# Review notes

A full page-by-page review of the site. Two passes, in this order:

1. **Walkthrough** — reactions while reading the live site, page by page.
2. **Content sweep** — a cross-page read of the 11 city pages and 10 question
   pages, checking consistency, accuracy, and depth.

Findings are `RN-nn`. Type is bug | content | design | copy | idea. Severity is
high (wrong or broken; misleads a real decision), med (weak or inconsistent),
low (nit).

Out of scope unless raised: Supabase/auth/JS internals, build config, and
conformance to `DESIGN.md`. Technical problems hit in passing get noted, not
audited.

## Open findings

| ID | Page | Type | Sev | Finding | Status |
|---|---|---|---|---|---|
| RN-01 | All | design | med | Hero images overflow the viewport on desktop; fine on mobile | open |
| RN-02 | Questions | content | high | Missing a meta question: is winter break the right window at all? | open |
| RN-03 | Questions | content | med | Drop the "are Bubu and Gaby coming" framing from `what-kids-want` | open |
| RN-04 | Cities / Ruled out | content | med | Venice: no longer dismissed. Move off ruled-out into a candidate city page, but not pushed as a contender | open |
| RN-05 | Madrid | content | med | Toledo goes *inside* the Madrid page as a day trip, not its own city page | open |
| RN-06 | New page | content | high | Draft itinerary framed as "what option 3 would actually look like" — an argument for the recommendation, not a settled plan | open |
| RN-07 | City pages | content | med | Add depth to every city page — enough that people can buy in | open |
| RN-08 | Rome | content | med | 4 suggested nights but only 3 day blocks; every other city matches | open |
| RN-09 | City pages | design | low | Only the first activity card per page has a "Get Directions" link | open |
| RN-10 | City pages | content | med | Pages argue against each other without ever linking to each other | open |
| RN-11 | Cities hub | content | low | Suggested nights total 31 for a 14-day trip, with no framing | open |
| RN-12 | Florence | copy | med | "The most skippable stop" is a highlight tag, shown as a poster bill | open |
| RN-13 | Questions | content | med | `pace.md` recommends 4 nights minimum; the split arc it endorses gives 3.5 | open |
| RN-14 | Questions | content | med | `how-many-countries` recommends 2 countries; `which-arc` recommends a 3-country split arc | open |
| RN-15 | Index / hubs | content | low | "Eleven cities / six countries" is hardcoded in 4 places; adding Venice breaks all of them | open |
| RN-16 | Questions | idea | low | Nothing encodes which questions block which; `which-arc` is upstream of most | open |
| RN-17 | Athens | content | low | Sunset claimed ~5:20 PM, actually ~5:10 PM (Dec 21) | open |
| RN-18 | Seville / Granada | content | low | Sunset claimed ~6:00 PM, actually ~6:10–6:11 PM — understates the page's own "warmest and brightest" claim | open |
| RN-19 | Florence | content | low | January high claimed ~10 °C, actually ~11.2 °C | open |
| RN-20 | Barcelona / Madrid | content | low | January highs off by ~1 °C each (Barcelona 15→14, Madrid 11→10) | open |
| RN-21 | Athens | content | med | Winter reduced-rate archaeological ticket claim may be outdated — sources conflict on whether the discount still exists | open |
| RN-22 | Barcelona / Paris | content | low | Barcelona↔Paris train claimed ~6h30, typical journey is closer to 6h45–7h | open |

---

## Cross-cutting

### Walkthrough notes

- **RN-01 — hero images don't fit the screen on desktop.** Mobile looks right.
  Reported on the live site.

---

## Index

### Walkthrough notes

### Content findings

## Cities (hub)

### Walkthrough notes

### Content findings

## City pages

### Walkthrough notes

- **RN-04 — put Venice back on the table.** Currently in `ruled-out.md` as "the
  closest call on this page," on cold, damp, and *acqua alta*. **Decided:** it
  gets a normal city page and comes off ruled-out, but it is not being pushed
  as a contender — just no longer dismissed.
- **RN-05 — add Toledo, Spain.** Not currently anywhere on the site.
  **Decided:** it belongs inside the Madrid page as a day trip, not as its own
  city page.
- **RN-07 — add depth to each city page.** The current pages are a claim plus a
  facts table plus a day sketch. Deeper, more specific content would help the
  group actually buy in.

### Content findings

- **RN-08 — Rome's day sketch is one day short.** Every other city gets one
  `activity-block` per suggested night; Rome suggests 4 nights and has 3 day
  blocks. London (4 nights) has 4. Either add a Rome day 4 or drop it to 3
  nights — and 3 nights contradicts `pace.md`'s "four nights minimum."
- **RN-09 — only the first activity card on each page has a "Get Directions"
  link.** All eleven pages have exactly one map link and 6–11 cards. It reads as
  an unfinished pattern rather than a deliberate one.
- **RN-10 — city pages barely link to each other.** Only 5 `/cities/*` links
  exist across the whole site, all from `ruled-out.md`. Pages that argue about
  each other (Florence "the most skippable stop", Naples "go to Florence
  instead", Seville vs. Granada, Madrid vs. Barcelona) never link to the page
  they are arguing against.
- **RN-11 — suggested nights total 31 for a 14-day trip.** Fine in principle
  (they are per-city suggestions, not a sum), but no page says so, and the
  cities hub prints "N nights suggested" on every bill with no framing. A
  reader adding them up gets a nonsense number.
- **RN-12 — Florence's front matter markets it against itself.** `highlights`
  ends with "The most skippable stop", which appears as a poster bill on the
  cities hub with no context. Every other city's highlights are draws. If
  Florence is skippable, the argument belongs in the body, not the tagline.

## Questions (hub)

### Walkthrough notes

### Content findings

## Question pages

### Walkthrough notes

- **RN-02 — add a meta question: "Is winter break the right choice?"** Nothing
  on the site questions the window itself; every other question assumes it.
  Needs its own page with options (winter break / summer / spring / a different
  break), a recommendation, and a comment thread.
- **RN-03 — remove the "are Bubu and Gaby coming" question.** Treat their
  attendance as settled. `what-kids-want.md` currently leads with it in the
  front-matter question line. Their preferences stay; the attendance framing
  goes. Also referenced from `feedback.md` (line 35) and inside
  `what-kids-want.md`.

### Content findings

- **RN-13 — the pace recommendation and the arc recommendation disagree.**
  `pace.md` recommends "three bases, four nights minimum each" and calls four
  bases "the reasonable stretch." `which-arc.md` recommends the four-base split
  arc outright. Both are the site's own voice, both are "my recommendation,"
  and neither acknowledges it is being overruled by the other. Since RN-06
  builds the itinerary page on the split arc, this needs settling first.
- **RN-14 — same problem on country count.** `how-many-countries.md`
  recommends **two countries**; the split arc it defers to is Italy, Spain,
  France, and the UK — four. The page's escape hatch covers the *northern* arc
  only, not the split arc. As written, the site recommends an option its own
  countries question argues against.
- **RN-15 — "eleven cities, six countries" is hardcoded in four places**
  (`index.md` ×2, `cities.md` ×2) while everything else counts from
  `site.cities`. Adding Venice (RN-04) silently makes all four wrong. Question
  count is already dynamic (`site.questions | size`) — cities should match,
  except `feedback.md` line 49 hardcodes "Ten decisions," which RN-02 breaks.
- **RN-16 — no question page states what it is blocked by.** Front matter has
  `order` and `impact`, and pages cross-link in prose, but `which-arc` is
  genuinely upstream of most others and nothing encodes that. Relevant now that
  RN-02 adds a question that is arguably upstream of `which-arc` itself.

## Logistics

### Walkthrough notes

### Content findings

Cross-page fact-check pass (climate table in `logistics.md`, echoed on the
relevant city pages). All discrepancies below are small — none flip a
superlative claim the site makes (Amsterdam is still the coldest of the
northern three; Seville is still the warmest and brightest overall) — but the
numbers should be corrected:

- **RN-17 — Athens sunset overstated by ~10 min.** Claimed ~5:20 PM
  (`_cities/athens.md`, `logistics.md`), actual ~5:10 PM on Dec 21.
- **RN-18 — Seville/Granada sunset understated by ~10 min.** Claimed ~6:00 PM
  (`_cities/seville.md`, `_cities/granada.md`, `logistics.md`), actual
  ~6:10–6:11 PM. Notably this error runs *against* the site's own argument —
  Seville's page calls itself "the warmest and brightest option anywhere in
  this plan," and the real number makes that case stronger, not weaker.
- **RN-19 — Florence January high understated.** Claimed ~10 °C (50 °F),
  actual ~11.2 °C (Florence Airport, 1991–2020 normal).
- **RN-20 — Barcelona and Madrid January highs off by ~1 °C each.** Barcelona
  claimed 15 °C / actual ~14 °C; Madrid claimed 11 °C / actual ~10 °C. Tightens
  the margin between Madrid and Florence in the `logistics.md` ranking table,
  though it doesn't invert it.

**Second pass — seasonal events, opening hours, and remaining rail claims:**

- **RN-21 — Athens's winter reduced-rate ticket claim may be stale.** The page
  states archaeological sites drop to a reduced winter rate from 1 November to
  31 March, as settled fact. Sources conflict on whether the Greek Ministry of
  Culture eliminated this discount starting the 2025 winter season in favor of
  a flat year-round rate. Given the trip is 2028/29, this needs a live check
  closer to booking rather than a confident claim now — soften the wording or
  re-verify.
- **RN-22 — Barcelona↔Paris train duration understates the typical journey.**
  Claimed "~6h30" (`_cities/barcelona.md`, `_cities/paris.md`,
  `trains-vs-flights.md`, `logistics.md`). The fastest departure does run 6h29,
  but the typical journey is 6h45–7h. Minor, but it's the one route the site
  calls "roughly a wash" against a 2-hour flight — worth the accurate range.

**Confirmed accurate, no changes needed:** Alhambra winter hours, Amsterdam
Light Festival dates (2025/26: 27 Nov–18 Jan, matches "late November to
mid-January"), Barcelona's Cavalcada dels Reis date (5 January), Anne Frank
House timed-ticket claim, Seville Cathedral and Madrid Royal Palace
superlatives, Sierra Nevada distance and "southernmost ski resort" claim,
Piazza Navona Christmas market dates, Naples/Amalfi winter ferry and hotel
closures, Acropolis winter closing hours.

**Still not independently re-verified:** the remaining individual rail/flight
durations in `trains-vs-flights.md` and `logistics.md` (Rome–Naples,
Rome–Florence, Madrid–Barcelona/Seville/Granada, airport transfer times, and
the Athens/Rome/Barcelona/Paris/London flight durations). These are
well-established fixed infrastructure and the figures match commonly cited
schedules, but were not run through search. Low risk; skip further checking
unless something changes.

## Ruled out

### Walkthrough notes

### Content findings

## Feedback

### Walkthrough notes

### Content findings

## Draft itinerary (new page)

### Walkthrough notes

- **RN-06 — build a draft itinerary page.** Uses the split arc (option 3 in
  `which-arc`), day by day, deep on each city. The point is persuasion: make
  the trip concrete enough that people can get on board with it.
  **Decided:** frame it as *"what option 3 would actually look like"* — an
  argument for the recommendation, not a settled plan. That keeps it consistent
  with the site's premise that nothing is decided.

### Content findings

---

## Triage

_Filled in at the end: open findings ordered into work._
