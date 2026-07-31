# Magic-link auth for comments and interests

**Date:** 2026-07-31
**Status:** Approved

## Problem

Identity on the site is self-declared. The header banner asks "Who's this?",
stores the answer in `localStorage`, and every write to Supabase goes through
the `anon` key against policies that read `using (true)`. The `person` column
is a string the browser chooses.

Nothing stops Bubu from picking "Gaby" and posting in her name. The switch
link that makes a shared iPad workable makes impersonation a two-tap
operation, and devtools makes it available even without the link.

The threat is not an attacker. It is two teenagers with an obvious opening.
That still rules out anything enforced in JavaScript, because the JavaScript
is theirs to edit.

## Outcome

Reading stays open — the site remains a link you can send to a grandparent.
Writing requires a session established by a magic link sent to one of four
known addresses. Authorship is enforced by row-level security in Postgres, so
a crafted insert naming someone else is rejected by the database rather than
declined by the client.

Realistically each person logs in once per device and never thinks about it
again; refresh tokens keep the session alive indefinitely.

## Decisions

### Magic link, not passwords

Supabase email OTP, with **signups disabled** in the dashboard and the four
users created by hand. An unknown address that requests a link gets nothing —
no account is created, no link is sent.

Disabling signups blocks user *creation*, not link delivery. Nobody hands out
links: each person types their own address into the form and Supabase mails
them a link, as often as they need one. Setup is a one-time manual step —
Authentication → Users → Add user, email only, no password, four times, with a
matching `profiles` row for each.

The client passes `shouldCreateUser: false` to `signInWithOtp` as well. The
dashboard toggle is the real control, but a setting that lives only in a
dashboard is invisible in a diff; the option makes the intent reviewable.

No passwords, because a password four family members hold is a password every
family member holds within a week. The mail round-trip is one-time friction
per device and requires access to an inbox, which is precisely the property
that makes it unforgeable by a sibling.

All four people have their own inbox on the device they browse from. This
design depends on that and does not otherwise hold.

### Mail delivery is the built-in sender, for now

Supabase's default mailer is rate-limited to a small number of messages per
hour and is not intended for production traffic. Four people logging in once
per device sit well inside that.

It matters during setup, when everyone tests at once: hitting the cap looks
exactly like auth being broken. If it turns into a real nuisance, configuring
an SMTP provider is a settings change, not a code change, and is out of scope
here.

### Identity is Supabase's, not the site's

`identity-banner.html` stops being a picker.

- Logged out: an email field and a "send me a link" button.
- Logged in: the person's name and emoji, and a "sign out" link.

The `data-people` JSON attribute and `family_members` in `_config.yml` are no
longer read by the banner. The site stops knowing who the four people are;
that fact moves into the database.

The magic link redirects back to the page the request was made from, so a link
requested on the Rome page returns to Rome.

### Schema: `profiles`, and no `person` column

```sql
profiles  (user_id uuid pk references auth.users, name text, emoji text)
comments  (id, page_path, user_id references auth.users, body, created_at)
interests (id, interest_key, user_id, state, updated_at,
           unique (interest_key, user_id))
```

Both `person` columns and their `check (person in (...))` constraints are
dropped.

The alternative was keeping `person` alongside `user_id` as a display
denormalization, so rendering a thread needs no join. It was rejected: a
client-writable name column has to be checked against the session by RLS to
stay honest, which reintroduces the class of bug this change removes. A
`profiles` table is read-only to clients and makes the roster a database fact
rather than four strings duplicated across `_config.yml`, two CHECK
constraints, and every stored row.

`user_id` takes `default auth.uid()`, so clients omit it entirely on insert.

### Existing rows are dropped

The tables are dropped and recreated rather than migrated. The current
contents are a handful of test comments and marks from a feature that shipped
three days ago; mapping them to new auth users is not worth the migration
code.

### RLS is the enforcement

```sql
create policy "read comments" on comments for select
  to anon, authenticated using (true);
create policy "insert comments" on comments for insert
  to authenticated with check (auth.uid() = user_id);
```

Interests take the same shape plus update and delete, each scoped
`using (auth.uid() = user_id)` — clearing a mark can only clear your own.
`profiles` is `select` to `anon, authenticated`, with no write policy at all;
rows are inserted by hand alongside the users.

Reads remain open to `anon` so the site is browsable logged out.

This is the substance of the change. Everything in the client is convenience;
this is the part a curious kid with devtools cannot get around.

### Client

A new `auth.js` owns session state and exposes `getUser()` and an `onChange`
subscription. `identity.js` is deleted.

`comments.js` and `interests.js` subscribe to it. With no session, the comment
form is hidden behind the existing `comment-locked` note — reworded from "Pick
who you are to join in" to "Sign in to join in" — and interest toggles render
read-only. With a session, both enable and write without naming a person.
Comment rendering joins `profiles` for name and emoji.

## Verification

`check.sh` builds and asserts against `_site/`, so it covers the markup: the
login form renders, the picker markup is gone, the locked-state note is
present. It cannot exercise auth, and pretending otherwise would be worse than
saying so.

The policies are verified by hand in the SQL editor, as a session for each of
two users:

1. As Bubu, insert a comment. Succeeds, and lands with Bubu's `user_id`.
2. As Bubu, insert a comment with `user_id` set to Gaby's. Rejected.
3. As Bubu, delete Gaby's interest row. Affects zero rows.
4. Signed out, select from `comments`. Succeeds.
5. Signed out, insert into `comments`. Rejected.
6. Request a link for an address that is not one of the four. No account
   created, no mail sent.

Step 6 is the one to actually run rather than assume: it is the check that the
signups toggle is set correctly, and no automated test on a static site can
cover it.

## Excluded

- Gating reads. The site stays public; only writing is restricted.
- Editing and deleting comments, which remains a SQL console job — the right
  level of friction for four people, and unchanged by this work.
- Any migration of existing rows.
- Roles or permissions beyond "is one of the four".
