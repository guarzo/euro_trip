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
| RN-04 | Cities / Ruled out | content | med | Add Venice back as a candidate city; remove from ruled-out | open |
| RN-05 | Cities | content | med | Add Toledo, Spain as a candidate | open |
| RN-06 | New page | content | high | Draft itinerary page built on the split ("hybrid") arc | open |
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
  closest call on this page," on cold, damp, and *acqua alta*. It needs a real
  city page and removal from ruled-out.
- **RN-05 — add Toledo, Spain.** Not currently anywhere on the site. Likely a
  day trip from Madrid rather than a base — worth deciding which the page
  claims it is.
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
  the trip concrete enough that people can get on board with it. Note the
  tension — the site's premise is that nothing is decided, so this page has to
  read as a *proposal*, not a settled plan.

### Content findings

---

## Triage

_Filled in at the end: open findings ordered into work._
