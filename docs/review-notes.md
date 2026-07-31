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

---

## Triage

_Filled in at the end: open findings ordered into work._
