# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: Bubu (18) and Gaby (17)** — the two teenagers this trip is supposedly
for, who are the swing vote on where it goes and who have not yet said what they
want. They arrive on a phone, from a link a parent sent them, with roughly the
attention budget of a group chat. Success is that they read more than one page,
form an actual opinion, and leave it somewhere the family can see.

**Secondary: Papa and Mama** — building the trip, reading every page, and
needing the comparative facts (daylight, weather, transit time, nights) to be
scannable and trustworthy.

The site is read together as well as alone: a phone passed across a couch, a
laptop open at a kitchen table.

## Product Purpose

A decision site for a family trip to Europe over winter break 2027/28. Nothing
is decided — not the dates, not the countries, not the duration. The site exists
to change that by doing exactly two jobs:

1. **City pages** — what eleven candidate cities are actually like *in winter*,
   each with a draft day sketch.
2. **Open questions** — ten decisions that need answers, each with options, a
   written recommendation, and its own comment thread.

Success is a decided arc, decided dates, and four people who feel they chose it
rather than were told it.

## Positioning

Almost every trip-planning artifact assumes the trip is booked: itineraries,
reservations, packing lists, countdowns. This one covers the phase *before*
that. Its subject is not the trip — it is the argument about the trip. Every
recommendation on the site is one person's reasoning written down **so that it
can be argued with**, and every page carries a comment thread for exactly that.
The companion site (`guarzo/2026_jp_trip`) serves the booked half; this one
serves the open half.

## Operating Context

- Static Jekyll site, deployed to GitHub Pages at `eu.dpao.la`.
- Read overwhelmingly on phones, in short sessions, often at night.
- Comments and interest marks run on Supabase, authenticated via magic-link
  sign-in to one of four known email addresses — no self-declared identity and
  no GitHub. While `supabase.url` is empty a placeholder note renders in place
  of both and the site builds fine without it.
- `script/check.sh` builds the site and asserts every expected page exists,
  contains its required sections, and has no broken internal links. It is the
  project's only test surface. External links, including hero images, are **not**
  checked — a dead `hero_image` ships silently and must be verified by hand.
- Hero images use the `commons.wikimedia.org/wiki/Special:FilePath/` form
  deliberately; hand-built `upload.wikimedia.org` thumbnail paths embed a hash
  directory that fails silently.

## Capabilities and Constraints

- **Content is settled and stays as written.** Eleven city pages, ten question
  pages, plus Logistics, Ruled Out, and Feedback. Prose is not up for redesign.
- **Interest marks** — a three-state (unset / interested / not for me) marker on
  each city, shared across devices and visible to the whole family. Every
  member's mark shows on both the city page and the cities index, because both
  key on the city rather than the page. `localStorage` holds the Supabase
  session (via magic-link sign-in); no client-side storage records which
  family member a device belongs to.
- Six countries in play: Greece, Italy, Spain, France, UK, Netherlands.
- Three candidate arcs: Mediterranean, Northern classics, Split.
- The comparative facts the site turns on are **January high** and **late-December
  sunset time** — the daylight column is the one people underestimate, and it
  spans London at 3:53 PM to Seville at ~6:00 PM.
- Deliberately absent, and must stay absent: day-by-day itinerary pages,
  reservation tracking, packing lists, emergency info, offline/PWA support, and
  any cost or budget content.
- Third-party web fonts and authored/generated image assets are permitted
  (confirmed with the user).

## Brand Commitments

- Name: **Europe Trip Planning**. Domain `eu.dpao.la`.
- Voice: plainspoken, specific, and willing to argue against itself. It states a
  recommendation, then a section on what would change its mind. It says "the
  honest counterpoint" and means it. No brochure enthusiasm, no exclamation
  marks, no invented excitement.
- Family members are named in `_config.yml`: Papa, Mama, Bubu (18), Gaby (17).
- Every factual page carries the "directional, not gospel" caveat — the trip is
  more than two years out, and the site is explicit that its own numbers will
  drift.

## Evidence on Hand

- Real, researched prose for all 21 content pages, including climate normals,
  sunset times, and rail journey times.
- Hero photography for each city via Wikimedia Commons `Special:FilePath` URLs
  in each city's front matter.
- No budget figures, no bookings, no prices, no reservations — none exist, and
  none may be invented. No testimonials or third-party endorsements exist.
- Comments and marks are live: `supabase.url` and `anon_key` are configured
  and the schema is applied. Both features stay dependent on that project
  remaining reachable with its tables, CHECK constraints, and RLS policies
  intact — if the config is emptied or the schema is missing, each renders a
  placeholder note and the site must keep working and reading well that way.

## Product Principles

1. **The argument is the product.** Recommendations exist to be disagreed with;
   the design must make disagreeing feel invited, not rude.
2. **Winter is the whole premise.** Daylight and weather are not footnotes — they
   are the comparative axis every page is really about.
3. **Nothing is decided, and the site says so everywhere.** Openness is the
   honest state, not a gap to paper over.
4. **The teenagers are the swing vote.** If a page does not survive a phone and
   a short attention span, it does not do its job.
5. **Directional, not gospel.** The site never presents a two-year-out number
   with more confidence than it has.

## Accessibility & Inclusion

Read primarily on phones, frequently one-handed and at night. Touch targets stay
at 44px minimum (the interest toggle already sets this deliberately). Interest
state is exposed to assistive tech with a three-way `aria-pressed` mapping,
because "not marked" and "explicitly not interested" must be distinguishable.
Winter viability and question status must be carried by meaningful text — never
by color or a glyph alone.
