# Europe Trip Planning Site — Design

**Date:** 2026-07-27
**Repo:** `euro_trip` → `guarzo/euro_trip`
**Domain:** `eu.dpao.la`
**Reference:** [`guarzo/2026_jp_trip`](https://github.com/guarzo/2026_jp_trip)

## Purpose

Help the family converge on *when, where, and how long* for a roughly two-week
trip over winter break 2028/29. Nothing about the trip is decided: not the
dates, not the countries, not the duration.

This is a **planning** site, not a trip-execution site. The Japan repo it is
modeled on serves a booked trip — locked dates, confirmed reservations, an
offline service worker for use on the ground. This site serves the phase before
that one.

Two kinds of content carry the work:

1. **City pages** — what a place is actually like *in winter*, plus a draft day
   sketch, so the family can react to concrete places.
2. **Open questions** — the decisions that need answers, each with options and
   tradeoffs laid out.

## Deliberately not ported

`reservations.md`, `packing.md`, `emergency.md`, `pokemon.md`, `manifest.json`,
and `sw.js` all serve a trip that is booked and underway. Building them now
would be scaffolding around decisions that do not exist yet. They arrive in a
later phase, once dates lock.

The `_days/` collection is likewise deferred. A day-by-day spine presumes a
route; there is no route yet.

The homepage carries **no countdown**. The Japan site counts down to a known
departure. Counting down to an undecided date would be fiction.

## Architecture

Unchanged from the Japan repo, because it works.

- Jekyll site rooted at `site/`
- Deployed by `.github/workflows/jekyll.yml` with `source: ./site`
- Custom domain `eu.dpao.la` via `CNAME` at repo root and in `site/`
- Same `_layouts` / `_includes` split
- Hand-rolled CSS, no framework, no build step beyond Jekyll

Two collections replace `_days`:

| Collection | Permalink |
|---|---|
| `_cities/` | `/cities/:name/` |
| `_questions/` | `/questions/:name/` |

Each open question is its own page so that **Giscus threads stay separate per
decision**. Collapsing every decision into one comment thread is how planning
discussions turn to mush.

## Content model

### City page

Front matter:

```yaml
country: Greece          # Greece | Italy | Spain | France | UK | Netherlands
city: Athens
winter_viability: good   # good | mixed | closed
suggested_nights: 3
hero_image: <url>
hero_alt: <text>
highlights:
  - ...
```

Body sections, in the same order on every city page:

- **In winter** — weather, daylight, what is open, what is closed. This is the
  section that earns the page; a generic city description would not.
- **Why go**
- **Draft day sketch** — loose, one to two days of plausible activities, reusing
  the Japan `activity-card` markup
- **Eat**
- **Getting here / onward**

### Seeded cities

| Country | Cities |
|---|---|
| Greece | Athens |
| Italy | Rome, Florence, Naples |
| Spain | Barcelona, Madrid, Seville, Granada |
| France | Paris |
| UK | London |
| Netherlands | Amsterdam |

That is 11 city pages across 6 countries.

**Excluded, with reasons recorded on `ruled-out.md`** so they are not
re-litigated: Santorini and Crete (island season is summer; ferries and
lodging largely shut down), Cinque Terre and Amalfi (same), Venice (December is
cold, damp, fog and acqua alta season), Delphi and Nafplio (sleepy in winter,
low appeal for teenagers).

### Question page

Front matter:

```yaml
status: open        # open | decided
impact: high        # high | medium
question: <one-line phrasing>
```

Body: why it matters, two to three options with honest tradeoffs, a
recommendation, then the Giscus thread.

### Seeded questions

The headline question, ordered first:

**Which arc?** The southern countries and the northern cities are two coherent
trips, not one. Options as seeded:

1. **Mediterranean** — Athens · Rome · Barcelona/Madrid. Mild and bright,
   slower pace, three flights between bases.
2. **Northern classics** — London · Paris · Amsterdam. The tightest logistics of
   any option (London–Paris 2h20 and Paris–Amsterdam 3h20 by train, city center
   to city center), highest appeal for the kids, Christmas markets. Dark and
   wet: Amsterdam's sun sets at 4:29 PM in late December, London's at 3:53 PM,
   against 4:40 PM in Rome and 6:00 PM in Seville.
3. **Split arc** — e.g. Rome · Barcelona · Paris · London. Covers both moods,
   drops Greece as the geographic outlier, spends the most days in transit.

Remaining seeded questions:

- Exact dates within winter break
- Three countries or two
- Open-jaw vs. round-trip flights
- Trains vs. budget flights between cities
- Pace: three bases or six stops
- Where to be for Christmas and New Year's
- Are Bubu (18 by then) and Gaby (17) both coming, and what do *they* want out
  of it
- Hotels vs. apartments
- ETIAS registration and passport validity

## Pages

| Page | Contents |
|---|---|
| `index.md` | Planning status, quick links. No countdown. |
| `cities.md` | City index grouped by country, winter viability visible |
| `questions.md` | Question index, open vs. decided |
| `ruled-out.md` | Excluded places and the reason for each |
| `logistics.md` | Flights, rail and ferry realities, ETIAS, winter weather |
| `feedback.md` | Giscus |

## Interaction

**Giscus** on each city page and each question page, for anything that needs to
be shared. Requires a GitHub account.

**Interest toggles** — each family member marks cities and activities as
interested or not, persisted to their own browser's `localStorage`. This reuses
the checkbox-persistence code already in the Japan `app.js`. Zero friction, no
account required.

`app.js` is ported with the countdown removed and the interest toggles added.

The palette shifts off the Japan red (`#dc2626`) to Mediterranean blue and
terracotta.

## Family members

Carried over from the Japan `_config.yml`, with ages as of winter 2028/29:
Papa, Mama, Bubu (18), Gaby (17).

## Known risk

The `localStorage` picks are **per-device and invisible to the trip organizer.**
That is the honest limit of a client-side-only approach. If the family engages
with the toggles but nobody comments in Giscus, the result is a site that feels
interactive and yields no usable data.

The mitigation is deferred, not designed away: a Google Form can be added later
without restructuring anything. Revisit after the first round of family
feedback.

## Verification

- `bundle exec jekyll build` succeeds from `site/`
- Every seeded city and question page renders at its expected permalink
- Both collections' index pages link to every member
- No dead internal links
- Pages render legibly at mobile width

## Out of scope for v1

Day-by-day itinerary pages, reservation tracking, packing lists, emergency
info, PWA/offline support, cost and budget content of any kind, and any shared
backend for aggregating votes.
