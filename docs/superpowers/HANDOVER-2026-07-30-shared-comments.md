# Handover — Shared Comments and Interests

> **SUPERSEDED — historical checkpoint, 2026-07-30.** This document records the
> branch as it stood partway through, and is kept for its decision rationale and
> the trap-notes on testing. It is **not** a current status report: all 7 tasks
> are now complete, Giscus is deleted, the docs are corrected, and Supabase is
> configured and verified against the live project. Where this file and the PR
> description disagree, the PR is right. Statements below about what is
> unfinished or unverified describe 2026-07-30, not today.

**Branch:** `worktree-shared-comments` · **Base:** `origin/main` @ `26d7217`
**Status (as of 2026-07-30):** Tasks 1–5 of 7 complete. **Tasks 6 and 7 not started.**

As of that date this branch was **not finished** and should not have been merged
as-is. It was a coherent, working checkpoint: everything on it was verified, but
the feature set was incomplete — Giscus was still present and the docs still
described the old behavior.

---

## What this replaces, and why

Two mechanisms failed the same four-person audience for the same reason:
nothing was shared.

- **Comments** used Giscus (GitHub Discussions). It was never enabled —
  `giscus.repo_id` was empty — and turning it on would have required Papa,
  Mama, Bubu (18), and Gaby (17) to each hold a GitHub account and authorize
  an app.
- **Interest marks** lived in `localStorage`. Each person's stars were
  visible only in their own browser and vanished when it was cleared. The
  site exists to surface agreement and disagreement about eleven cities and
  ten open questions; a private star does neither.

Both become shared Supabase state behind a family member name picked once
per device. `localStorage` still exists but its role inverted: it now holds
only *who you are*, never the opinions.

**Spec:** `docs/superpowers/specs/2026-07-28-shared-comments-and-interests-design.md`
**Plan:** `docs/superpowers/plans/2026-07-28-shared-comments-and-interests.md`

---

## Done (Tasks 1–5)

| # | Task | Commit | Review |
| --- | --- | --- | --- |
| 1 | Schema + public runtime config | `3b73697` | clean |
| 2 | Identity module and picker | `39c1d14` → `0c51f53` | 2 Important fixed |
| 3 | Split `app.js` into ES modules | `25f6f62` | clean, zero findings |
| 4 | Supabase data layer | `cfc121c` → `ac47821` | 1 Important fixed ⚠️ |
| 5 | Shared interest marks | `99e7a6a` | approved, 1 Important deferred |

Plus two plan-correction commits: `79705e3` (rebase onto the Argument Wall
redesign) and `3fc9399` (dynamic import — see Decisions).

### Remaining: Tasks 6 and 7

**Task 6 — comment threads.** Creates `comments.js` and
`_includes/comments.html`, **deletes `_includes/giscus.html`**, swaps the
include in `city.html`, `question.html`, and `feedback.md`. Brief-ready in
the plan. Two things the next implementer must not get wrong:

- The Post button is `.action-quiet` (ink), **not** `.action` (signal).
  Every page already spends its one signal element on the closing wall.
  This is the single most likely design violation in the whole plan.
- The `{% include close-wall.html %}` block follows the comments include in
  all three files. Leave it where it is — DESIGN.md requires every page to
  end on a closing wall, so the thread sits above it, never after.

**Task 7 — documentation.** README (Supabase setup + the manual
verification script) and **`PRODUCT.md`**, which currently documents
localStorage-only interests and Giscus as live constraints. Both are now
false. Three specific bullets to correct, quoted verbatim in the plan.

---

## How to pick this up

```bash
cd /home/tng/workspace/euro_trip/.claude/worktrees/shared-comments
./script/check.sh                      # must print ALL CHECKS PASSED
cd site && bundle exec jekyll serve --port 4321
```

The SDD ledger — every finding, decision, and measurement, in order — is
committed at `docs/superpowers/handover-artifacts/2026-07-30-sdd-ledger.md`.
Read it before resuming; it is the recovery map. (Its live copy, plus the
per-task briefs and implementer reports, sits in the git-ignored
`.superpowers/sdd/2026-07-28-shared-comments-and-interests/` in the original
worktree — present only on the machine that ran this.)

### The browser harness

`script/check.sh` asserts against built HTML and **cannot see behavior**.
Several defects on this branch were only findable in a real browser. The
harnesses live in `/tmp` (ephemeral — recreate if gone) and drive
Playwright's bundled Chromium over CDP:

```bash
SITE=http://localhost:4321 CDP_PORT=9260 node /tmp/verify-ui.js
```

Chromium is at
`~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`. The Playwright
MCP server looks for system Chrome and fails; drive the bundled binary
directly. The CDP client needs `ws`, installed in `/tmp` — **never** in the
repo, which must stay npm-free.

**A testing trap, learned the hard way:** a short viewport plus an instant
`scrollTo(bottom)` outruns `IntersectionObserver` and falsely reports slam
elements stuck at `opacity: 0`. Use 1280×900 and scroll progressively. This
nearly produced a false bug report against `origin/main`.

---

## Decisions a reviewer should challenge

**1. Interests key on `interest_key`, comments on `page_path`.**
Deliberate asymmetry. An interest is about a *city*; a comment is about a
*page*. The cities index renders all eleven toggles on one page, so a
page-keyed scheme would collide them into one row and make marking Rome on
the index a different record than marking it on Rome's own page. The spec
originally said `page_path` for both; that was caught and corrected before
implementation (`9d20f4d`).

**2. Anyone can post as anyone.** Identity is a name picked on the device —
no accounts, no passwords. The site is public at `eu.dpao.la`, so a stranger
who finds it could post as Papa. Accepted deliberately: the audience is four
people who live together, and the remedy is deleting rows from the SQL
console. The alternative was making everyone hold an account, which is the
problem this work exists to solve.

**3. The Supabase client loads via dynamic `import()`, not a static one.**
Load-bearing, and easy to "simplify" into a serious bug. A static top-level
import fetches the CDN on every page load for every reader — including the
unconfigured state — and **a failed static import rejects the entire module
graph**, taking `initUI()` and `initIdentity()` with it. Verified in Node:
one unreachable import and the nav, smooth scroll, slam animation, and
identity picker all die. Verified in the browser too: with `esm.sh` blocked
at the network layer, everything still works and no exceptions are thrown.

**4. No cache-busting on CDN retry.** `db()` clears its memo on failure so a
later call retries — but **the browser caches a failed module URL for the
page's lifetime**. Proven: blocked → FAIL; unblock, same URL → still FAIL;
same URL + `?cb=1` → OK instantly. True in-session recovery would need a
changing URL on every retry. Not added: it complicates the one file that
must stay simple, for a scenario where a page refresh is a fine remedy, and
the copy already says "reload to try again". **This is the decision most
worth a second opinion.**

**5. `--signal` is spent on the closing wall, so marks use `--ink`.**
DESIGN.md caps signal at one element per region. Eleven cities × four people
would have multiplied it across the index.

---

## Where the risk actually is

**Task 4's fix was never independently reviewed.** I found the defect,
specified the fix, and verified the fix. Two re-reviewers were dispatched
and both went idle without returning a verdict, so I closed it on reproduced
evidence rather than block indefinitely. That is a weaker gate than every
other task received. **The final whole-branch review should re-examine
`site/assets/js/supabase.js`'s `db()` specifically** — including the race
analysis I did myself (concurrent callers share one in-flight import;
a slow failing import does not strand a null on a newer successful one).

I am confident the code is correct. I am less confident it has been
*reviewed*.

**Task 5 carries one deferred Important finding: `cycle()` has no in-flight
guard.** A rapid double-tap fires two `cycle()` calls that each capture
`previous` independently, so out-of-order network resolution can revert a
later optimistic write — leaving the displayed mark disagreeing with the
stored one until reload. The reviewer judged it non-blocking (a pre-existing
hazard of this optimistic-UI pattern, and the brief did not ask for a mutex),
and I agree it should not hold the branch. But it is a real user-visible bug
on a touch device, which is how the teenagers this site is for will use it.
**Worth fixing before this ships**, either in Task 6 or as a follow-up: guard
`cycle()` against re-entry per row, or serialize writes per `interest_key`.

---

## Deferred minors (for the final review to triage)

1. **Task 1** — `giscus.html` was modified despite instructions not to. The
   change was necessary (`site.giscus` becomes nil once the config key is
   removed, and `nil != ""` is *true* in Liquid, so the widget branch would
   have rendered). Correct and minimal; moot once Task 6 deletes the file.
2. **Task 2** — `personLabel()` returns the raw key for a value not in
   `PEOPLE`. Unreachable via `getPerson()`, which filters. Tasks 5/6 may
   pass raw DB values; worth checking in Task 6.
3. **Task 2** — the `aria-live` first-pick announcement depends on statement
   order in `render()`: `currentEl.hidden = false` runs *before*
   `label.textContent = …`, so the text lands as a mutation into an
   already-live region. Verified correct via `MutationObserver`. Swapping
   those two lines would silently mute the first announcement, and no test
   would catch it. A comment on the ordering would help.
4. **Task 5** — two implementer deviations, both sound: `check.sh` line
   numbers differed from the brief's estimate (same edits made), and a stale
   `.interest-toggle` selector in the print stylesheet was updated to
   `.interest-row`. The second was a real catch — marks would otherwise
   have printed.
5. **Task 5** — `renderRow()` rebuilds the row, so focus drops to `body` if
   `onPersonChange` fires while a stamp is focused.
6. **Task 5** — `showRowError()` appends, so errors accumulate across
   repeated failures without an intervening render. Cleared on the next
   `renderRow()`.

The Task 5 reviewer separately **confirmed safe**: the unfiltered
`getInterests()` (rows whose `interest_key` matches no element are stored but
never rendered; unknown `person` values are never iterated), and that
`interests.js` never calls `personLabel()` — so deferred minor #2 cannot
surface there.

---

## Verification performed

`./script/check.sh` passes at every commit. Beyond that, in a real browser:

- **Identity** — banner renders four choices from `_config.yml`; computed
  `min-height` is 44px; picking writes `bubu`; identity persists across
  navigation; "not you?" clears it; an invalid stored key (`hacker`) is
  rejected and falls back to the picker — important, because that key goes
  into a database `CHECK` constraint.
- **No-JS** — the banner ships `hidden` in markup, so readers without
  JavaScript never meet a dead control.
- **Module split** — byte-identical move confirmed by normalized diff;
  behavior matches the pre-change baseline exactly (18 slam targets, 18
  slammed, 0 left invisible); Escape closes the nav and returns focus at a
  430×830 viewport.
- **CDN outage** — with `esm.sh` blocked, identity, nav, and slam all still
  work with zero uncaught exceptions.
- **Interest marks, configured** — driving the *real* `supabase-js` against
  a fake PostgREST server: four stamps render `👨 ★ Yes | 👩 ✕ No | 👦 — ? |
  👧 — ?`; mine is a `button` with `aria-pressed`, others are `span`s with
  `aria-label`; clicking cycles and persists.
- **Interest marks, write failure** — with the server forced to 500, the
  optimistic render reverts to the prior state, "Didn't save — try again"
  appears, and server rows are unchanged.

**Not verified as of 2026-07-30:** anything against a real Supabase project.
`supabase.url` was still empty, so every reader saw the placeholder note, and
the manual verification script in Task 7 had not been run.

**Since resolved.** A live project is configured and its guardrails were
exercised directly: anon reads work on both tables, a `person` outside the four
family keys is rejected with 400, a body over 2000 characters is rejected with
400, comment `DELETE` affects no rows (there is no delete policy), and the
upsert on `(interest_key, person)` updates in place rather than duplicating.
