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
| RN-02 | Questions | content | high | Missing a meta question: is winter break the right window at all? | fixed |
| RN-03 | Questions | content | med | Drop the "are Bubu and Gaby coming" framing from `what-kids-want` | fixed |
| RN-04 | Cities / Ruled out | content | med | Venice: no longer dismissed. Move off ruled-out into a candidate city page, but not pushed as a contender | fixed |
| RN-05 | Madrid | content | med | Toledo goes *inside* the Madrid page as a day trip, not its own city page | fixed |
| RN-06 | New page | content | high | Draft itinerary framed as "what option 3 would actually look like" — an argument for the recommendation, not a settled plan | open |
| RN-07 | City pages | content | med | Add depth to every city page — enough that people can buy in | fixed |
| RN-08 | Rome | content | med | 4 suggested nights but only 3 day blocks; every other city matches | fixed |
| RN-09 | City pages | design | low | Only the first activity card per page has a "Get Directions" link | no change needed |
| RN-10 | City pages | content | med | Pages argue against each other without ever linking to each other | fixed |
| RN-11 | Cities hub | content | low | Suggested nights total 31 for a 14-day trip, with no framing | fixed |
| RN-12 | Florence | copy | med | "The most skippable stop" is a highlight tag, shown as a poster bill | fixed |
| RN-13 | Questions | content | med | `pace.md` recommends 4 nights minimum; the split arc it endorses gives 3.5 | fixed |
| RN-14 | Questions | content | med | `how-many-countries` recommends 2 countries; `which-arc` recommends a 3-country split arc | fixed |
| RN-15 | Index / hubs | content | low | "Eleven cities / six countries" is hardcoded in 4 places; adding Venice breaks all of them | fixed |
| RN-16 | Questions | idea | low | Nothing encodes which questions block which; `which-arc` is upstream of most | open |
| RN-17 | Athens | content | low | Sunset claimed ~5:20 PM, actually ~5:10 PM (Dec 21) | fixed |
| RN-18 | Seville / Granada | content | low | Sunset claimed ~6:00 PM, actually ~6:10–6:11 PM — understates the page's own "warmest and brightest" claim | fixed |
| RN-19 | Florence | content | low | January high claimed ~10 °C, actually ~11.2 °C | fixed |
| RN-20 | Barcelona / Madrid | content | low | January highs off by ~1 °C each (Barcelona 15→14, Madrid 11→10) | fixed |
| RN-21 | Athens | content | med | Winter reduced-rate archaeological ticket claim may be outdated — sources conflict on whether the discount still exists | fixed |
| RN-22 | Barcelona / Paris | content | low | Barcelona↔Paris train claimed ~6h30, typical journey is closer to 6h45–7h | fixed |

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

22 findings, ordered into six batches of work. Order matters: batch 1 gates
batches 4 and 5, and everything else is independent.

### 1. Settle the arc/pace/countries contradiction (gates batches 4–5) — done

- **RN-13, RN-14 — fixed.** `pace.md` and `how-many-countries.md` each now name
  the split arc as a deliberate, acknowledged exception to their default
  recommendation (three bases / two countries), rather than silently
  disagreeing with `which-arc.md`. `which-arc.md`'s own recommendation now
  links back to both, naming the trade-off explicitly. Verified with a clean
  `jekyll build`.

### 2. Quick content/structure fixes — done

- **RN-03 — fixed.** `what-kids-want.md`'s front-matter question is now "What
  do Bubu and Gaby want out of it?"; the "Are you in?" question and the
  choice-not-a-given framing are gone. `feedback.md` already used the new
  title verbatim — no change needed there.
- **RN-08 — fixed.** Added a fourth day block to Rome ("Appian Way, and
  nothing scheduled") — a quiet catacombs morning plus a deliberately
  unstructured afternoon, matching `pace.md`'s own argument for what a base
  city's extra day should be.
- **RN-09 — no change needed, finding corrected.** Re-inspected: every page's
  map link sits on day 1's first card, consistently, across all eleven
  cities — it marks the single headline attraction, not a random partial
  pattern. The original finding was a misread during the sweep.
- **RN-10 — fixed.** Added the missing links where a page argues against
  another: Naples → Florence, Granada → Seville, Madrid → Barcelona.
- **RN-11 — fixed.** Added a line to `cities.md` framing suggested nights as
  per-city, not additive.
- **RN-12 — fixed.** Florence's highlights tag changed from "The most
  skippable stop" to "Duomo dome climb" — the actual argument already lived
  properly in the page body; only the poster-bill tagline needed to change.
- **RN-15 — fixed.** Added `_includes/number-word.html` (spells out small
  integers for poster-scale headline type) and wired `index.md` and
  `cities.md`'s city/country counts to `site.cities` instead of hardcoding.
  `feedback.md`'s "Ten decisions" line is unaffected by this batch — RN-02
  (batch 4) will need to update it when the new question is added.
- **RN-16 — left as backlog**, per the original triage note. No page
  currently needs it to function.

Verified with a clean `jekyll build` and spot-checked rendered output
(dynamic counts render correctly, Rome shows 4 day blocks).

### 3. Fact corrections — done

- **RN-17 — fixed.** Athens sunset corrected to ~5:10 PM (from ~5:20 PM) in
  `_cities/athens.md` (both mentions) and `logistics.md`; the "fifty minutes
  later than Amsterdam" comparison recalculated to "forty."
- **RN-18 — fixed.** Seville sunset corrected to ~6:10 PM, Granada to ~6:05 PM
  (both were ~6:00 PM), in the respective city pages (both mentions each) and
  `logistics.md`.
- **RN-19, RN-20 — fixed.** Florence 10→11 °C, Barcelona 15→14 °C, Madrid
  11→10 °C, in each city page and `logistics.md`. This flips Florence and
  Madrid's relative order in the logistics climate table (Florence is now
  warmer than Madrid) — reordered the table to match. Florence's "coldest in
  Italy on this list" claim still holds at 11 °C.
- **RN-21 — fixed.** Athens's winter-ticket-discount claim now says the
  reduced rate has "historically" applied and flags that pricing has been in
  flux, rather than stating the discount as settled fact.
- **RN-22 — fixed.** Barcelona↔Paris train time corrected from ~6h30 to
  ~6h45 in all four mentions (`_cities/barcelona.md`, `_cities/paris.md`,
  `trains-vs-flights.md`, `logistics.md`).

Verified with a clean `jekyll build`; the "Seville gets more than two extra
hours than London" comparison in `logistics.md` still holds against the
corrected sunset times (2h17m).

### 4. New candidate content — done

- **RN-04 — fixed.** Wrote `_cities/venice.md` (rated `mixed`, 2 suggested
  nights): winter facts (7 °C January high, ~4:40 PM sunset, all verified),
  the acqua alta/MOSE update to the ruled-out reasoning, a two-day sketch
  (St. Mark's/Doge's Palace/Grand Canal, then Murano/Burano or Dorsoduro),
  Eat, and journey times. Removed the old ruled-out entry. Explicitly framed
  as "no longer dismissed," not pushed as a contender, per your call.
- **RN-05 — fixed.** Toledo already had a one-line optional card in
  `madrid.md`'s day 3 — expanded it into real depth (Cathedral, Santo Tomé's
  El Greco, the three-faiths synagogues, damascene craft, the Tagus gorge
  view), verified the existing 33-minute Avant train claim was already
  accurate, and reframed it as a full day trip rather than a throwaway
  optional stop.
- **RN-02 — fixed.** Wrote `_questions/right-window.md`, "Is winter break the
  right window at all?", as a peer question (order 11, impact high): four
  options (winter / summer / spring / open-ended), recommendation to stay
  with winter break on practical-availability grounds, not just weather.
  Updated `feedback.md`'s hardcoded "Ten decisions" to compute from
  `site.questions.size` via the `number-word` include, so it now reads
  "Eleven decisions" automatically.

Verified with a clean `jekyll build`; spot-checked that "Twelve cities,"
"Eleven decisions," and "11 open" all render correctly from the new content.

### 5. The big content asks

- **RN-07 — fixed.** Re-inspected first: the "Why go" sections already had a
  real argument and an honest counterpoint on every page — thinner than
  assumed during the sweep. Asked what depth was actually wanted; answer was
  a "Where to stay" section (missing on all twelve pages) plus more day-sketch
  detail. Researched real neighborhoods per city (walkability to what each
  page already recommends, safety, honest caveats) and added a "Where to
  stay" section to all twelve city pages, tying each recommendation back to
  that page's own Day 1/Day 3/etc. content rather than generic advice. Also
  found and fixed the same suggested-nights/day-blocks mismatch as RN-08 on
  Athens (3 nights, 2 day blocks) — added a third day (Cape Sounion, or an
  explicitly open day).
- **RN-06** — still open. Write the draft itinerary page, framed as "what the
  split arc would actually look like."

Verified with a clean `jekyll build` and confirmed all twelve city pages
render a "Where to stay" section.

### 6. Design (independent, needs a front-end look)

- **RN-01** — hero images overflow the viewport on desktop. Out of this
  review's scope to diagnose further, but flagged as a real bug to fix.
