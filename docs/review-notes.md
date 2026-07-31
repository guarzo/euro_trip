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

## Logistics

### Walkthrough notes

### Content findings

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
