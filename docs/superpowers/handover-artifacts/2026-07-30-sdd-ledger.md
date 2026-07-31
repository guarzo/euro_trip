> Copied out of the git-ignored SDD workspace so it survives the branch.
> Chronological record of every finding, decision, and measurement.

# SDD ledger — plan: docs/superpowers/plans/2026-07-28-shared-comments-and-interests.md

Base: 79705e3 (branch worktree-shared-comments, from origin/main 26d7217)

Task 1: minor (deferred): giscus.html guard changed unilaterally despite dispatch saying not to touch it; fix itself correct and minimal (file is deleted in Task 6).
Task 1: complete (commits 79705e3..3b73697, review clean — spec OK, quality approved)
Pre-Task-3 UI baseline (origin/main 26d7217, 1280x900, progressive scroll):
  js-slam=true, slam-in=18, slammed-after-scroll=18, left-invisible=0,
  nav opens=true, aria-expanded=true, escape closes=true, focus returns=true.
  Harness: /tmp/verify-ui.js (SITE=... CDP_PORT=... node /tmp/verify-ui.js).
  NOTE: a short viewport + instant scrollTo(bottom) falsely reports elements
  stuck at opacity 0 — IntersectionObserver never fires for skipped elements.
Task 2: review — spec OK, quality approved with 2 Important + 1 Minor.
Task 2: minor (deferred): personLabel() returns raw key if key not in PEOPLE; unreachable via getPerson() but Tasks 5/6 may pass raw DB values.
Task 2: fix round 1/5 (2 addressed, 0 open — initIdentity contract comment; aria-live on identity-current; commits 39c1d14..0c51f53)
  Controller-verified in headless Chromium: live region exposed (not ignored),
  live=polite, subtree StaticText "MAMA" + button "NOT YOU?"; identity switch
  Mama->Papa updates text in place while region is visible.
Task 2: minor (deferred): aria-live first-pick announcement depends on statement
  order in identity.js render() — `currentEl.hidden=false` runs BEFORE
  `label.textContent=...`, so the text lands as a mutation into an
  already-rendered live region (verified via MutationObserver: attributes/hidden
  fires first, then childList, both with hiddenNow=false). Correct today, but
  undocumented and untested; swapping those two lines would silently mute the
  first pick. Consider a comment on the ordering.
Task 2: complete (commits 3b73697..0c51f53, 2 Important fixed & controller-verified, 3 minors deferred)
Task 3: controller regression check vs pre-change baseline — EXACT MATCH.
  js-slam=true, slam-in=18, slammed=18, left-invisible=0, nav opens, escape
  closes + focus returns to toggle (verified at 430x830 mobile viewport),
  outside-click closes, aria-expanded toggles. Served build confirmed:
  app.js 404, ui.js 200, only main.js referenced.
  Byte-identical move verified: nav+scroll and the entire slam block compare
  equal to the old app.js after whitespace/comment normalization.
Task 3: NOT-A-REGRESSION (pre-existing on origin/main): ~59ms FOUC where
  .bill renders at opacity 1 then js-slam hides it (t=20ms visible -> t=79ms
  hidden). Pristine origin/main 26d7217 measures ~57ms — identical behavior,
  inherent to the redesign's visible-by-default + hide-via-JS approach. The
  module conversion (sync script -> deferred module) did NOT worsen it.
Task 3: complete (commits 0c51f53..25f6f62, review clean — spec OK, quality approved, zero findings)
Task 4: controller verification — node --check parses OK; all JS column refs
  (interest_key, person, state, updated_at, page_path, body, created_at) exist
  in supabase/schema.sql; dynamic import(CDN) intact inside db().
  CDN-OUTAGE TEST (Network.setBlockedURLs '*esm.sh*'): identity banner works,
  4 choices, js-slam applied, 18/18 slammed, 0 left invisible, nav opens,
  identity pickable (Gaby), 0 uncaught exceptions. This is exactly what the
  static-import design would have broken.
Task 4: CONFIRMED DEFECT (controller-reproduced, browser + isolation):
  db() memoizes clientPromise including REJECTIONS. With esm.sh blocked, call #1
  fails "Failed to fetch dynamically imported module"; after fully unblocking the
  CDN, call #2 fails with the SAME cached error — no retry is ever attempted
  (isolation test: exactly 1 import attempt across 3 calls). A transient CDN
  blip therefore disables marks+comments for the whole page session until reload.
Task 4: fix round 1/5 (1 addressed — clientPromise nulled on rejection; commits cfc121c..ac47821)
Task 4: IMPORTANT DISCOVERY — the memo fix is necessary but NOT sufficient.
  The BROWSER caches a failed dynamic import() per URL in its module map for the
  page's lifetime. Proven directly: import(URL) blocked -> FAIL; unblock CDN,
  import(SAME URL) -> still FAIL; import(URL+'?cb=1') -> OK immediately.
  So in-session recovery from a CDN outage requires a changing URL (cache-bust
  query) on retry; our memo fix alone cannot achieve it. Without that, a CDN
  blip disables marks/comments until the reader reloads the page.
  DECISION: not adding cache-busting. It complicates the one file that must stay
  simple, for a four-person family site where reload is a fine remedy; and the
  failure already surfaces honestly as "couldn't load — reload to try again"
  (Task 5/6 copy). The memo fix stays: it is still correct, costs nothing, and
  restores retry the moment the browser's module map is not the blocker (e.g.
  a fresh URL, or a transient error thrown after the module loaded).
Task 4: controller race analysis of the memo fix — CLEAN.
  Concurrent first-calls (realistic: interests.js + comments.js on one page load)
  share a single in-flight import (1 attempt, both get same rejection), and the
  next call retries (2 attempts total). Adversarial ordering (slow failing import
  nulls memo, then a newer fast import succeeds) does NOT strand a null: the old
  .catch runs before the replacement exists, clientPromise stays set, later calls
  reuse the cached client. No stale-null hazard.
Task 4: re-review dispatched twice; both re-reviewers went idle without returning
  a verdict. Controller closed the finding on reproduced evidence instead:
  isolation test (fail -> retry -> memoized = 2 attempts), concurrent-caller test
  (1 shared in-flight import), adversarial-ordering test (no stale null), and
  ./script/check.sh green. Finding ADDRESSED. Logged as a process gap, not a
  code gap — the final whole-branch review should re-examine supabase.js db().
Task 4: complete (commits 3fc9399..ac47821, 1 Important found+fixed by controller
  reproduction; formal re-review verdict never returned — see above)
Task 5: controller verification — UNCONFIGURED path: 11 rows on /cities/, 1 on
  city page, placeholder "Marks turn on once Supabase is configured.", 0 stamps,
  old .interest-toggle gone, stale copy ("own browser"/"not shared with anyone")
  gone, 0 uncaught exceptions.
  CONFIGURED path (real supabase-js against a fake PostgREST on :5599):
  4 stamps render "👨 ★ Yes | 👩 ✕ No | 👦 — ? | 👧 — ?"; mine is a BUTTON with
  aria-pressed, others are SPANs with aria-label ("Papa: yes"); clicking cycles
  and PERSISTS to the server. Three carriers per stamp (emoji+glyph+word).
  WRITE-FAILURE path (server forced to 500): optimistic render reverts to the
  prior state, "Didn't save — try again" shown, server rows unchanged, 0 uncaught.
  CSS: exactly 1 --signal use (the documented failed-write rule), 0 raw hex.
Task 5: NOTE — while building the harness I confirmed the Task 2 reviewer's
  concern is real: importing identity.js under a cache-busted URL yields a
  SECOND module instance with PEOPLE=[] (initIdentity never ran on it). Not a
  product bug (the page loads each module once), but it validates why the
  ordering contract comment matters.
Task 5: review — spec OK, quality APPROVED. Findings:
  IMPORTANT (deferred, reviewer non-blocking): cycle() has no in-flight guard.
    Rapid double-tap fires two cycle() calls that each capture `previous`
    independently; out-of-order network resolution can revert a later optimistic
    write. Pre-existing class of optimistic-UI bug; brief did not ask for a mutex.
  minor: renderRow() rebuild drops focus to body if onPersonChange fires while a
    stamp is focused.
  minor: showRowError() accumulates errors across repeated failures without an
    intervening render (cleared on next renderRow()).
  Confirmed SAFE by reviewer: unfiltered getInterests() (unmatched interest_key
  rows stored but never rendered; unknown person values never iterated);
  personLabel() is never called by interests.js, so the raw-key leak flagged in
  Task 2 cannot surface here.
Task 5: complete (commits ac47821..99e7a6a, review approved, 1 Important + 2 minors deferred)
