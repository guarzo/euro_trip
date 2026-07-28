# Shared comments and interests, backed by Supabase

**Date:** 2026-07-28
**Status:** Approved

## Problem

Two mechanisms on the site fail the same four-person audience for the same
reason: nothing is shared.

**Comments** use Giscus, backed by GitHub Discussions. It has never been
enabled — `giscus.repo_id` is empty in `_config.yml`, so every page renders a
placeholder. Turning it on would require Papa, Mama, Bubu (18), and Gaby (17)
to each hold a GitHub account and authorize an app before they could say "I
don't want another museum." That is not going to happen.

**Interest toggles** store per-city and per-question marks in `localStorage`.
Each person's stars live only in their own browser, invisible to everyone else
and lost when the browser is cleared. The site exists to surface agreement and
disagreement about eleven cities and ten open questions; a private star does
neither.

## Outcome

Both become shared state in a Supabase project, behind a name you pick once per
device. No accounts, no passwords, no email. Every city and question page shows
all four family members' marks and a single comment thread anyone can post to.

## Decisions

### Identity: pick your name

On first visit a header banner asks "Who's this?" and offers the four family
members with their emoji. Tapping one stores `{person: "bubu"}` in
`localStorage`.

`localStorage` remains in use, but its role inverts: it holds only *a device's
memory of who you are*, never the opinions themselves. The header then shows
the current identity with a "not you?" switch link, so a shared iPad can hand
off between people.

Until someone picks, interest buttons and the comment form render disabled with
the prompt "Pick who you are to join in." Pages stay fully readable with
JavaScript off or Supabase unreachable.

The four names derive from `site.family_members` in `_config.yml`, which
already exists with emoji. No new source of truth; the database `CHECK`
constraint mirrors that list.

Stored keys are the lowercased display name — `Papa` → `papa`, `Bubu` →
`bubu` — computed at render time with Liquid's `downcase`. The display name and
emoji always come from the config; the stored key is only ever an identifier.

**Accepted risk.** The site is public at `eu.dpao.la`, so a stranger who finds
it could post as Papa. The audience is four people who live together, and the
worst realistic outcome is deleting a few rows from the SQL console.
Alternatives considered and rejected: a shared passphrase gated by a JWT (adds
an auth flow and a token-minting Edge Function against a mostly hypothetical
threat) and routing all writes through an Edge Function (a deploy target beyond
the static site, more infrastructure than four people warrant).

### Visibility: everyone sees everyone

Each city and question page shows all four avatars with their marks —
`👨★ 👩★ 👦✕ 👧☆` — so agreement and conflict are visible at a glance.
Aggregate-only counts and hide-until-you-vote were both rejected: they obscure
exactly the disagreement the site is for.

### Comments: Supabase replaces Giscus

Giscus is removed rather than kept alongside. Comments become rows in the same
project as interests, sharing the same identity and styling. A flat list,
newest last, one thread per page. Threaded replies were rejected as more UI and
more schema than a four-person thread needs.

## Data model

Two tables, keyed differently on purpose: **an interest is about a city, a
comment is about a page.**

`interests` keys on `interest_key` — the `city:athens` identifier the existing
markup already emits via `data-interest-key`. This is load-bearing. The cities
index at `/cities/` renders all eleven toggles on one page, so a `page_path` key
would collide every toggle on that page into a single row, and would make
marking Rome from the index a different record than marking Rome from
`/cities/rome/`. Keying on the city makes those two controls two views of one
row.

`comments` keys on `page_path`, using the same `pathname` Giscus used —
`/cities/rome/`, `/questions/pace/`. Threads genuinely are per-page, and the
cities index has no thread.

```sql
-- person values mirror site.family_members in _config.yml
create table interests (
  id           uuid primary key default gen_random_uuid(),
  interest_key text not null,
  person       text not null check (person in ('papa','mama','bubu','gaby')),
  state        text not null check (state in ('yes','no')),
  updated_at   timestamptz not null default now(),
  unique (interest_key, person)
);

create table comments (
  id         uuid primary key default gen_random_uuid(),
  page_path  text not null,
  person     text not null check (person in ('papa','mama','bubu','gaby')),
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index on interests (interest_key);
create index on comments (page_path);
```

`interests` writes are upserts against `(interest_key, person)`. The third
toggle state — "unset" — is a **row delete**, not a stored value, so the table
only ever holds actual opinions.

The `city:` prefix is retained so question pages could become togglable later
without a migration. Question toggles are **not** part of this work.

Because interests are city-keyed rather than page-keyed, the cities index
fetches all interest rows in one unfiltered query rather than filtering by
page. At eleven cities and four people that is at most forty-four rows.

### Row Level Security

- `interests`: select, insert, update, delete permitted to `anon`. Delete is
  required because "unset" removes the row.
- `comments`: select and insert only. Editing and deleting a comment from the
  browser is impossible; that is a SQL console job, which is the right level of
  friction here.

The `anon` key ships in the client bundle. This is what that key is designed
for; the `CHECK` constraints and the body length limit are the real guardrails,
alongside Supabase's built-in rate limiting.

Realtime is off. Pages fetch once on load, and the UI updates locally after
your own write.

## Client architecture

`site/assets/js/app.js` is one IIFE holding mobile nav, smooth scroll, and the
interest toggles. Rather than growing it, split into ES modules under
`site/assets/js/`, loaded with `<script type="module">`:

| Module | Responsibility | Depends on |
| --- | --- | --- |
| `identity.js` | Who am I; pick, switch, the four names. Exports a getter and a change event. | — |
| `supabase.js` | Creates the client. Exposes exactly `getInterests()`, `setInterest(interestKey, person, state)`, `clearInterest(interestKey, person)`, `getComments(pagePath)`, `addComment(pagePath, person, body)`. | — |
| `interests.js` | Renders the four-avatar row; wires the toggle. Reads `data-interest-key` from each button. | `identity`, `supabase` |
| `comments.js` | Renders the thread and the post form. | `identity`, `supabase` |
| `ui.js` | Existing mobile nav and smooth scroll, behavior unchanged. | — |

Every network detail lives in `supabase.js` and nowhere else. `interests.js`
and `comments.js` do not know the other exists.

The Supabase client is imported from the CDN as ESM — no npm and no build step,
keeping the Ruby-only toolchain intact.

The project URL and anon key are public values, so they live in `_config.yml`
under a `supabase:` block where `giscus:` sits today, templated into a small
config include. An empty `supabase.url` degrades exactly as an empty
`giscus.repo_id` does now: a short placeholder note renders and the site builds
and deploys normally.

`_includes/giscus.html` becomes `_includes/comments.html`, keeping the "Family
Notes" heading and the "Reactions, objections, and 'please no' all welcome"
prompt. Pages that include it are otherwise unchanged.

## Failure behavior

Each feature renders three explicit states — loading, loaded, failed — rather
than leaving a blank region.

- **Failed read:** the interest row shows four greyed avatars with "Couldn't
  load marks — reload to try again." The comment thread says the same in prose.
- **Failed write:** the toggle reverts to its prior state and says so. Nothing
  displays a star that was never saved.
- **Unconfigured:** an empty `supabase.url` is a configuration path, not an
  error, and renders the placeholder note.

## Verification

`script/check.sh` asserts against built `_site/` output and is the project's
only test surface. It cannot exercise Supabase, so it gets static assertions
only:

- City and question pages contain the comments include and the interest row
  markup.
- No page references `giscus.app`.
- The `supabase:` config block exists.

Dynamic behavior is verified by a manual script, documented in the README and
run once at the end:

1. Pick a name; confirm the header shows it and the toggles enable.
2. Mark a city interested.
3. Load that page in a second browser; confirm the mark appears against the
   right avatar.
4. Load `/cities/`; confirm the same city shows the same mark there — this is
   what the `interest_key` schema exists for.
5. Post a comment; reload; confirm it survives.
6. Unset the mark; reload; confirm it is gone in both browsers and on the
   index.

Automating this would mean adding Playwright and a seeded test project — a real
toolchain addition to a site that currently needs only Ruby. Rejected
deliberately.

## Out of scope

- Editing or deleting your own comment (SQL console instead).
- Notifications when someone posts.
- Threaded replies.
- Realtime updates.
- Any moderation UI.
