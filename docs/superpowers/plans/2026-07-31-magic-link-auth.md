# Magic-Link Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the self-declared identity picker with Supabase magic-link auth, so comment and interest authorship is enforced by Postgres RLS rather than by client-side JavaScript.

**Architecture:** Supabase email OTP with signups disabled and four hand-created users. A `profiles` table maps `auth.users` to display name and emoji, replacing the `person` text column on both data tables and the `family_members` roster in `_config.yml`. `auth.js` replaces `identity.js` as the session owner; `comments.js` and `interests.js` subscribe to it. RLS policies key on `auth.uid() = user_id`.

**Tech Stack:** Jekyll (Liquid, kramdown), vanilla ES modules, Supabase (Postgres + GoTrue), `@supabase/supabase-js@2` via esm.sh CDN.

**Spec:** `docs/superpowers/specs/2026-07-31-magic-link-auth-design.md`

## Global Constraints

- **No test framework exists.** `./script/check.sh` builds the site and asserts against `site/_site/`. It is the only automated surface. The TDD cycle in this plan is: add the assertion, run `./script/check.sh` and watch it fail, implement, run again and watch it pass.
- **RLS is verified by hand** in the Supabase SQL editor, per the spec's six-step checklist. No automated test covers auth.
- **`site/assets/js/supabase.js` is the only file that performs network I/O.** Every other module talks to Supabase through its exported functions and never sees a query. Preserve this.
- **The Supabase client is imported dynamically**, inside the configured-check, so a blocked CDN cannot take down `initUI()`. Never convert it to a static top-level import.
- **DESIGN.md: emoji may reinforce a state but never carry it alone.** Every interest stamp ships a word too.
- **DESIGN.md: one signal element per region.** The comment Post button stays `.action-quiet`; the sign-in button must not be `.action` on pages that already have a signal element.
- **User-supplied text is rendered with `textContent`, never `innerHTML`.**
- **No countdown anywhere** — the trip date is undecided; `check.sh` greps the whole built tree for it.
- The unconfigured state (`window.SUPABASE_CONFIG.url === ''`) must keep building and rendering a placeholder, never an error.

---

## File Structure

**Create:**
- `site/assets/js/auth.js` — session state, sign-in/sign-out, roster from `profiles`, change subscription.

**Delete:**
- `site/assets/js/identity.js` — replaced entirely by `auth.js`.

**Modify:**
- `supabase/schema.sql` — drop and recreate all tables; add `profiles`; RLS on `auth.uid()`.
- `site/assets/js/supabase.js` — auth calls, `profiles` queries, `person` → `user_id`.
- `site/_includes/identity-banner.html` — picker markup → sign-in form.
- `site/assets/css/style.css` — styles for the sign-in form.
- `site/assets/js/comments.js` — subscribe to auth; join `profiles` for display.
- `site/assets/js/interests.js` — subscribe to auth; roster from `profiles`.
- `site/assets/js/main.js` — `initIdentity()` → `initAuth()`, awaited before the rest.
- `site/_config.yml` — remove `family_members`.
- `script/check.sh` — assertions for the new markup, absence of the old.
- `README.md` — Supabase setup steps.

**Ordering rationale:** the schema lands first because every later task's manual verification needs a database to run against. `auth.js` lands second because `comments.js` and `interests.js` both import from it. Cleanup lands last so the build stays green throughout.

---

### Task 1: Schema and Supabase setup

**Files:**
- Modify: `supabase/schema.sql` (full rewrite)
- Modify: `README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: tables `profiles (user_id, name, emoji)`, `comments (id, page_path, user_id, body, created_at)`, `interests (id, interest_key, user_id, state, updated_at)`. `user_id` defaults to `auth.uid()` on both writable tables, so clients never send it.

- [ ] **Step 1: Rewrite `supabase/schema.sql`**

```sql
-- Applied by hand in the Supabase SQL editor. Committed so the schema is
-- reviewable and reproducible; this project has no migration tooling.
--
-- Authorship is enforced here, not in the browser. The anon key ships in the
-- page and the JavaScript belongs to whoever opens devtools; `auth.uid() =
-- user_id` is the only claim in this system that a determined sibling cannot
-- forge.

-- Dropped rather than migrated: the previous tables keyed authorship on a
-- client-chosen `person` string, and their contents are a few days of test
-- marks. See the design doc, "Existing rows are dropped".
drop table if exists interests;
drop table if exists comments;
drop table if exists profiles;

-- Display identity for the four users. Rows are inserted by hand alongside
-- the auth users; there is deliberately no write policy.
create table profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name    text not null,
  emoji   text not null
);

-- An interest is about a city, a comment is about a page. The cities index
-- renders all eleven toggles on one page, so keying interests on the page
-- would collide them into a single row.
create table interests (
  id           uuid primary key default gen_random_uuid(),
  interest_key text not null,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  state        text not null check (state in ('yes','no')),
  updated_at   timestamptz not null default now(),
  unique (interest_key, user_id)
);

create table comments (
  id         uuid primary key default gen_random_uuid(),
  page_path  text not null,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index interests_key_idx on interests (interest_key);
create index comments_path_idx on comments (page_path);

alter table profiles  enable row level security;
alter table interests enable row level security;
alter table comments  enable row level security;

-- Policies are dropped before being recreated: `create policy` has no
-- `if not exists`, so without this the file fails on a second run, which
-- would defeat the "reproducible" intent stated at the top.
drop policy if exists "read profiles"     on profiles;
drop policy if exists "read interests"    on interests;
drop policy if exists "insert interests"  on interests;
drop policy if exists "update interests"  on interests;
drop policy if exists "delete interests"  on interests;
drop policy if exists "read comments"     on comments;
drop policy if exists "insert comments"   on comments;

-- Reads stay open to anon: the site is public and browsable logged out.
create policy "read profiles"  on profiles  for select to anon, authenticated using (true);
create policy "read interests" on interests for select to anon, authenticated using (true);
create policy "read comments"  on comments  for select to anon, authenticated using (true);

-- Writes require a session, and may only ever touch your own row.
create policy "insert interests" on interests for insert to authenticated
  with check (auth.uid() = user_id);
create policy "update interests" on interests for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Delete is required: clearing a mark removes the row rather than storing an
-- "unset" state, so the table only ever holds actual opinions.
create policy "delete interests" on interests for delete to authenticated
  using (auth.uid() = user_id);

create policy "insert comments" on comments for insert to authenticated
  with check (auth.uid() = user_id);
-- Deliberately no update or delete policy on comments. Editing or removing a
-- comment is a SQL console job, which is the right level of friction for four
-- people.
```

- [ ] **Step 2: Apply the schema**

Paste into the Supabase SQL editor and run. Expect no errors. Run it a second time to confirm it is idempotent.

- [ ] **Step 3: Disable signups**

Dashboard → Authentication → Providers → Email: **enable** Email, **disable** "Allow new users to sign up". Confirm "Confirm email" is on.

This toggle is load-bearing and invisible in a diff. If it is left on, anyone in the world can request a link, get an account, and post.

- [ ] **Step 4: Create the four users**

Dashboard → Authentication → Users → Add user, for each of Papa, Mama, Bubu, Gaby. Email only — **no password**, and check "Auto Confirm User". Copy each resulting `user_id`.

- [ ] **Step 5: Insert the profile rows**

Substitute the four real UUIDs from Step 4:

```sql
insert into profiles (user_id, name, emoji) values
  ('<papa-uuid>', 'Papa', '👨'),
  ('<mama-uuid>', 'Mama', '👩'),
  ('<bubu-uuid>', 'Bubu', '👦'),
  ('<gaby-uuid>', 'Gaby', '👧');
```

- [ ] **Step 6: Set the redirect allow-list**

Dashboard → Authentication → URL Configuration. Site URL `https://eu.dpao.la`. Redirect URLs must include `https://eu.dpao.la/**` and `http://localhost:4000/**`.

Without the localhost entry, magic links cannot be tested against a local `jekyll serve`. Without the wildcard, returning to the page you signed in from does not work.

- [ ] **Step 7: Document the setup in README.md**

Add after the "Local development" section:

```markdown
## Supabase setup

Comments and interest marks require a Supabase project. `supabase/schema.sql`
is applied by hand in the SQL editor — there is no migration tooling.

Auth is magic-link only, for four known addresses:

1. Authentication → Providers → Email: enabled, with **"Allow new users to
   sign up" disabled**. This is what stops a stranger who guesses the URL from
   creating an account. It lives only in the dashboard, so no test can catch
   it being wrong — check it by hand.
2. Authentication → Users → Add user, four times, email only, "Auto Confirm
   User" checked.
3. Insert a matching row in `profiles` for each, with name and emoji.
4. Authentication → URL Configuration: allow `https://eu.dpao.la/**` and
   `http://localhost:4000/**`.

Disabling signups blocks user *creation*, not link delivery. Each person types
their own address into the site's sign-in form and Supabase mails them a link.
Nobody hands out links by hand.

The built-in mailer is rate-limited to a few messages per hour and is not
meant for production. Four people logging in once per device sit well inside
that, but it bites during setup when everyone tests at once — a throttled send
looks exactly like broken auth. Configuring SMTP is a settings change if it
becomes a nuisance.
```

- [ ] **Step 8: Verify RLS by hand**

In the SQL editor, run the spec's checklist. Each must behave as stated:

1. As Bubu, insert a comment → succeeds, lands with Bubu's `user_id`.
2. As Bubu, insert a comment with `user_id` set to Gaby's → **rejected**.
3. As Bubu, delete Gaby's interest row → affects **zero** rows.
4. Signed out, `select` from `comments` → succeeds.
5. Signed out, `insert` into `comments` → **rejected**.
6. Request a link for an address that is not one of the four → no account created, no mail sent.

Step 6 is the one to actually run rather than assume — it is the only check on the signups toggle.

- [ ] **Step 9: Commit**

```bash
git add supabase/schema.sql README.md
git commit -m "feat: auth-backed schema with per-user RLS"
```

---

### Task 2: `auth.js` and the sign-in form

**Files:**
- Create: `site/assets/js/auth.js`
- Modify: `site/assets/js/supabase.js`
- Modify: `site/_includes/identity-banner.html`
- Modify: `site/assets/css/style.css`
- Modify: `site/assets/js/main.js`
- Test: `script/check.sh`

**Interfaces:**
- Consumes: `isConfigured()` from `supabase.js`.
- Produces, from `auth.js`:
  - `initAuth(): Promise<void>` — resolves once the session is restored and the banner rendered. Must be awaited before `initComments()` / `initInterests()`.
  - `getUser(): {id: string} | null`
  - `onAuthChange(fn: (user) => void): void`
  - `PEOPLE: Array<{user_id, name, emoji}>` — the roster, loaded from `profiles`. Empty until `initAuth()` resolves.
  - `personLabel(userId: string): string` — `"👦 Bubu"`, or `"Someone"` if unknown.
- Produces, from `supabase.js`: `getSession()`, `signIn(email, redirectTo)`, `signOut()`, `onAuthStateChange(fn)`, `getProfiles()`.

- [ ] **Step 1: Add the failing assertions to `script/check.sh`**

Replace the three identity assertions at lines 64-69 with:

```bash
# The sign-in form is the only way to write. If this markup stops rendering,
# the site silently becomes read-only.
assert_contains "$SITE_OUT/index.html" "data-auth-banner"
assert_contains "$SITE_OUT/index.html" "data-auth-email"
assert_contains "$SITE_OUT/index.html" "data-auth-signin"
# The roster is no longer baked into the page — it comes from the profiles
# table, so the browser cannot be the source of who someone is.
assert_absent "$SITE_OUT/index.html" '"key":"papa"'
assert_absent "$SITE_OUT/index.html" "data-identity-banner"
assert_file "$SITE_OUT/assets/js/auth.js"
```

And replace `assert_file "$SITE_OUT/assets/js/identity.js"` with a staleness check next to the existing `app.js` one:

```bash
# identity.js is gone; a stale copy in _site would still be served and would
# still offer the picker.
if [ -f "$SITE_OUT/assets/js/identity.js" ]; then
  echo "FAIL  stale $SITE_OUT/assets/js/identity.js still present — clean site/_site"
  FAIL=1
else
  echo "ok    no stale identity.js"
fi
```

- [ ] **Step 2: Run the check and watch it fail**

```bash
rm -rf site/_site && ./script/check.sh
```

Expected: FAIL on `data-auth-banner`, `data-auth-email`, `data-auth-signin`, `assets/js/auth.js`, and on `"key":"papa"` / `data-identity-banner` still being present.

- [ ] **Step 3: Add auth functions to `site/assets/js/supabase.js`**

Append to the exports, keeping the existing `db()` helper as the only client source:

```js
export async function getSession() {
  const { data } = await (await db()).auth.getSession();
  return data.session;
}

// shouldCreateUser: false is belt-and-braces. The dashboard's "allow new
// users to sign up" toggle is the real control, but a setting that lives only
// in a dashboard is invisible in a diff; this makes the intent reviewable.
export async function signIn(email, redirectTo) {
  const { error } = await (await db()).auth.signInWithOtp({
    email: email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo }
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await (await db()).auth.signOut();
  if (error) throw error;
}

export async function onAuthStateChange(fn) {
  (await db()).auth.onAuthStateChange(function (_event, session) {
    fn(session ? session.user : null);
  });
}

export async function getProfiles() {
  const { data, error } = await (await db())
    .from('profiles')
    .select('user_id, name, emoji');
  if (error) throw error;
  return data || [];
}
```

- [ ] **Step 4: Rewrite the data functions in `site/assets/js/supabase.js`**

`person` is gone from every table. Writes omit `user_id` entirely — the column's `default auth.uid()` fills it, so the client never names an author and cannot name the wrong one.

```js
export async function getInterests() {
  const { data, error } = await (await db())
    .from('interests')
    .select('interest_key, user_id, state');
  if (error) throw error;
  return data || [];
}

// user_id is omitted deliberately: the column defaults to auth.uid(), so the
// author is whoever holds the session and cannot be spoofed by the caller.
export async function setInterest(interestKey, state) {
  const { error } = await (await db())
    .from('interests')
    .upsert(
      { interest_key: interestKey, state: state, updated_at: new Date().toISOString() },
      { onConflict: 'interest_key,user_id' }
    );
  if (error) throw error;
}

// No .eq('user_id', ...) is needed or wanted: the delete policy already scopes
// this to auth.uid(), so a missing filter deletes only your own row.
export async function clearInterest(interestKey) {
  const { error } = await (await db())
    .from('interests')
    .delete()
    .eq('interest_key', interestKey);
  if (error) throw error;
}

export async function getComments(pagePath) {
  const { data, error } = await (await db())
    .from('comments')
    .select('id, user_id, body, created_at')
    .eq('page_path', pagePath)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addComment(pagePath, body) {
  const { error } = await (await db())
    .from('comments')
    .insert({ page_path: pagePath, body: body });
  if (error) throw error;
}
```

- [ ] **Step 5: Create `site/assets/js/auth.js`**

```js
// Who is signed in, and who the four people are. Replaces identity.js, whose
// answer to "who are you" was whatever the browser said.
//
// The roster now comes from the profiles table rather than from _config.yml,
// so the page no longer ships the list of who may post. PEOPLE is empty until
// initAuth() resolves; main.js awaits it before anything reads it.

import {
  isConfigured, getSession, signIn, signOut, onAuthStateChange, getProfiles
} from './supabase.js';

const listeners = [];
let banner = null;
let user = null;

export let PEOPLE = [];

export function getUser() {
  return user;
}

export function onAuthChange(fn) {
  listeners.push(fn);
}

export function personLabel(userId) {
  const person = PEOPLE.find(function (p) { return p.user_id === userId; });
  // A comment whose author has no profile row still renders. Falling back to
  // the raw UUID would leak an internal id into the page for no benefit.
  return person ? person.emoji + ' ' + person.name : 'Someone';
}

function notify() {
  listeners.forEach(function (fn) { fn(user); });
}

function render() {
  if (!banner) return;
  const form = banner.querySelector('[data-auth-form]');
  const currentEl = banner.querySelector('[data-auth-current]');
  const label = banner.querySelector('[data-auth-label]');

  form.hidden = user !== null;
  currentEl.hidden = user === null;
  if (user) label.textContent = personLabel(user.id);
}

function setStatus(message) {
  const el = banner.querySelector('[data-auth-status]');
  if (el) el.textContent = message;
}

async function onSubmit(e) {
  e.preventDefault();

  const button = banner.querySelector('[data-auth-signin]');
  // Re-entry guard: a double-tap would otherwise request two links, and the
  // built-in mailer is rate-limited enough for that to matter.
  if (button.disabled) return;

  const email = banner.querySelector('[data-auth-email]').value.trim();
  if (email === '') return;

  button.disabled = true;
  setStatus('Sending…');

  try {
    // Return to the page the link was requested from, so signing in from the
    // Rome page comes back to Rome.
    await signIn(email, window.location.href);
    // Deliberately identical wording whether or not the address is one of the
    // four. Saying "no such user" would turn the form into a way to ask who
    // has an account.
    setStatus('Check your email for a sign-in link.');
  } catch (err) {
    setStatus("Couldn't send a link — try again.");
  } finally {
    button.disabled = false;
  }
}

async function onSignOut() {
  try {
    await signOut();
  } catch (e) {
    // onAuthStateChange still fires locally, so the UI returns to the form.
  }
}

export async function initAuth() {
  banner = document.querySelector('[data-auth-banner]');
  if (!banner || !isConfigured()) return;

  banner.querySelector('[data-auth-form]').addEventListener('submit', onSubmit);
  banner.querySelector('[data-auth-signout]').addEventListener('click', onSignOut);
  banner.hidden = false;

  try {
    PEOPLE = await getProfiles();
  } catch (e) {
    // Names are unavailable, but sign-in still works and marks still save.
    PEOPLE = [];
  }

  try {
    const session = await getSession();
    user = session ? session.user : null;
  } catch (e) {
    user = null;
  }
  render();

  // Fires on sign-in, sign-out, and token refresh — including when the user
  // arrives back from a magic link, which is what completes that flow.
  await onAuthStateChange(function (nextUser) {
    const changed = (nextUser && nextUser.id) !== (user && user.id);
    user = nextUser;
    render();
    // Token refresh fires this with the same user every hour or so. Notifying
    // on that would re-render every thread and every interest row for no
    // reason, so only a real identity change propagates.
    if (changed) notify();
  });
}
```

- [ ] **Step 6: Rewrite `site/_includes/identity-banner.html`**

The roster no longer comes from Liquid, so `family_members` and the `data-people` attribute are both gone.

```html
{%- comment -%}
  The roster used to be handed to JS as JSON here. It now comes from the
  profiles table, because a list of who may post that ships in the page is a
  list the page can edit.
{%- endcomment -%}
<div class="identity-banner" data-auth-banner hidden>
  <form class="auth-form" data-auth-form>
    <label class="visually-hidden" for="auth-email">Your email</label>
    <input type="email" id="auth-email" data-auth-email required
           autocomplete="email" placeholder="you@example.com">
    <button type="submit" class="identity-choice" data-auth-signin>Send me a link</button>
    <span class="auth-status" data-auth-status role="status" aria-live="polite"></span>
  </form>
  <div class="identity-current" data-auth-current aria-live="polite" hidden>
    <span data-auth-label></span>
    <button type="button" class="identity-switch" data-auth-signout>sign out</button>
  </div>
</div>
```

- [ ] **Step 7: Add the form styles to `site/assets/css/style.css`**

Insert next to the existing `.identity-*` rules, around line 1376:

```css
.auth-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.auth-form input[type="email"] {
  font: inherit;
  font-size: 0.9rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--rule);
  background: var(--paper);
  color: var(--ink);
  min-width: 14rem;
}

.auth-status {
  font-size: 0.85rem;
  color: var(--ink-soft);
}
```

If those custom property names do not exist in this stylesheet, use whatever the neighbouring `.identity-choice` rule uses — do not invent new tokens.

- [ ] **Step 8: Update `site/assets/js/main.js`**

`initAuth()` must resolve before the others: both read `PEOPLE` and the current user during their own init.

```js
// Module entry point — the only script the layout loads.
import { initUI } from './ui.js';
import { initAuth } from './auth.js';
import { initInterests } from './interests.js';
import { initComments } from './comments.js';

initUI();
// Awaited, unlike the others: initInterests() and initComments() both read the
// roster and the current user, which do not exist until this resolves.
initAuth().then(function () {
  initInterests();
  initComments();
});
```

- [ ] **Step 9: Run the check and watch it pass**

```bash
rm -rf site/_site && ./script/check.sh
```

Expected: all assertions ok. Tasks 3 and 4 still reference `identity.js`, so the browser console will error until they land — that is expected and `check.sh` does not execute JS.

- [ ] **Step 10: Commit**

```bash
git add site/assets/js/auth.js site/assets/js/supabase.js site/assets/js/main.js \
        site/_includes/identity-banner.html site/assets/css/style.css script/check.sh
git commit -m "feat: magic-link sign-in replaces the identity picker"
```

---

### Task 3: Comments on auth

**Files:**
- Modify: `site/assets/js/comments.js`
- Test: `script/check.sh`

**Interfaces:**
- Consumes: `getUser()`, `onAuthChange()`, `personLabel()` from `auth.js`; `getComments(pagePath)`, `addComment(pagePath, body)` from `supabase.js`.
- Produces: nothing other modules import.

- [ ] **Step 1: Add the failing assertion to `script/check.sh`**

Next to the existing `assert_file "$SITE_OUT/assets/js/comments.js"`:

```bash
# The locked-state copy changed with the auth model: there is no longer a
# "who are you" to pick.
assert_contains "$SITE_OUT/cities/athens/index.html" "Sign in to join in"
assert_absent "$SITE_OUT/cities/athens/index.html" "Pick who you are to join in"
```

- [ ] **Step 2: Run the check and watch it fail**

```bash
rm -rf site/_site && ./script/check.sh
```

Expected: FAIL — "Sign in to join in" missing, "Pick who you are to join in" present.

- [ ] **Step 3: Update the locked copy in `site/_includes/comments.html`**

```html
  <p class="comment-locked" data-comment-locked hidden>Sign in to join in.</p>
```

- [ ] **Step 4: Rewrite the imports and identity reads in `site/assets/js/comments.js`**

Replace the import line:

```js
import { getUser, onAuthChange, personLabel } from './auth.js';
import { isConfigured, getComments, addComment } from './supabase.js';
```

In `renderThread()`, the meta line keys on `user_id`:

```js
    meta.textContent = personLabel(c.user_id) + ' · ' + formatDate(c.created_at);
```

Rename `renderFormVisibility()`'s body:

```js
function renderFormVisibility() {
  const me = getUser();
  form.hidden = me === null;
  lockedEl.hidden = me !== null;
}
```

In `onSubmit()`, the author is no longer sent:

```js
  const me = getUser();
  const body = bodyEl.value.trim();
  if (!me || body === '') return;
```

and the post call drops its person argument:

```js
    await addComment(pagePath, body);
```

In `initComments()`, subscribe to auth instead of identity:

```js
  onAuthChange(renderFormVisibility);
```

- [ ] **Step 5: Run the check and watch it pass**

```bash
rm -rf site/_site && ./script/check.sh
```

Expected: all ok.

- [ ] **Step 6: Verify in a browser**

```bash
cd site && bundle exec jekyll serve
```

At `http://localhost:4000/cities/athens/`: signed out, the form is hidden and "Sign in to join in" shows. Request a link, click it from the inbox, land back on the Athens page signed in. Post a note — it appears with the right name and emoji. Sign out; the form hides again.

- [ ] **Step 7: Commit**

```bash
git add site/assets/js/comments.js site/_includes/comments.html script/check.sh
git commit -m "feat: comments require a session and render authors from profiles"
```

---

### Task 4: Interests on auth

**Files:**
- Modify: `site/assets/js/interests.js`
- Test: `script/check.sh`

**Interfaces:**
- Consumes: `getUser()`, `onAuthChange()`, `PEOPLE` from `auth.js`; `getInterests()`, `setInterest(key, state)`, `clearInterest(key)` from `supabase.js`.
- Produces: nothing other modules import.

**Note:** `PEOPLE` entries are now `{user_id, name, emoji}`, not `{key, name, emoji}`. Every `person.key` in this file becomes `person.user_id`, and the `marks` map is keyed by `user_id`.

- [ ] **Step 1: Add the failing assertion to `script/check.sh`**

Next to the existing interests assertions:

```bash
# The logged-out hint changed with the auth model.
assert_contains "$SITE_OUT/assets/js/interests.js" "Sign in to join in"
assert_absent "$SITE_OUT/assets/js/interests.js" "Pick who you are to join in"
```

- [ ] **Step 2: Run the check and watch it fail**

```bash
rm -rf site/_site && ./script/check.sh
```

Expected: FAIL on both.

- [ ] **Step 3: Update imports in `site/assets/js/interests.js`**

```js
import { getUser, onAuthChange, PEOPLE } from './auth.js';
import { isConfigured, getInterests, setInterest, clearInterest } from './supabase.js';
```

- [ ] **Step 4: Key `renderRow()` on `user_id`**

```js
function renderRow(row) {
  const key = row.dataset.interestKey;
  const me = getUser();
  const myId = me ? me.id : null;
  row.textContent = '';

  PEOPLE.forEach(function (person) {
    const state = stateFor(key, person.user_id);
    const isMe = person.user_id === myId;

    const el = document.createElement(isMe ? 'button' : 'span');
    el.className = 'interest-mark' + (isMe ? ' is-me' : '');
    el.dataset.interestState = state;
    // Three carriers, deliberately: the person's emoji, the state glyph, and
    // the state word. Color and glyph alone would fail DESIGN.md.
    el.textContent = person.emoji + ' ' + MARK[state] + ' ' + WORD[state];

    if (isMe) {
      el.type = 'button';
      // Three states, so "no" maps to mixed rather than false — otherwise a
      // screen reader cannot tell "not marked" from "explicitly not interested".
      el.setAttribute('aria-pressed', state === 'yes' ? 'true' : (state === 'no' ? 'mixed' : 'false'));
      el.setAttribute('aria-label', 'Your mark, currently ' + state + '. Activate to change.');
      el.addEventListener('click', function () { cycle(row, key); });
    } else {
      // A span carries no accessible name of its own, and the visible text is
      // abbreviated, so state the whole thing for assistive tech.
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', person.name + ': ' + state);
    }

    row.appendChild(el);
  });

  if (!myId) {
    const hint = document.createElement('span');
    hint.className = 'interest-hint';
    hint.textContent = 'Sign in to join in';
    row.appendChild(hint);
  }
}
```

- [ ] **Step 5: Drop the `person` parameter from `cycle()`**

The author is the session, so `cycle()` no longer takes or forwards one:

```js
function cycle(row, key) {
  const me = getUser();
  // Only the signed-in person's mark renders as a button, so this is a
  // belt-and-braces guard against a stale listener firing after sign-out.
  if (!me) return;

  const previous = stateFor(key, me.id);
  const next = CYCLE[(CYCLE.indexOf(previous) + 1) % CYCLE.length];

  // Optimistic: render immediately, revert if the write fails. A star that
  // was never saved is worse than a slow one.
  setLocal(key, me.id, next);
  renderRow(row);
  // Clear any error from a previous attempt: the row now shows this tap's
  // state, so a stale "Didn't save" would be describing something else.
  setRowStatus(row, '', false);

  // Chain behind any write already in flight for this mark, so the server
  // sees the same order the reader tapped.
  const prior = pendingWrites[key] || Promise.resolve();
  const write = prior.catch(function () {}).then(function () {
    // `next` is what this tap intended, and the chain guarantees every earlier
    // tap has already been sent, so it is safe to send as-is.
    return next === 'unset' ? clearInterest(key) : setInterest(key, next);
  }).catch(function (e) {
    // Only revert if no later tap has queued behind this one. Otherwise that
    // tap is about to write and owns what the row should show — reverting here
    // would drop the display back to a state the server is moving away from,
    // which is the desync this whole chain exists to prevent.
    if (pendingWrites[key] === write) {
      setLocal(key, me.id, previous);
      renderRow(row);
      showRowError(row, "Didn't save — try again");
    }
    throw e;
  });

  // Keep the chain alive for the next tap, then drop it once this mark is
  // idle so a failed write cannot poison later attempts.
  pendingWrites[key] = write;
  write.catch(function () {}).then(function () {
    if (pendingWrites[key] === write) delete pendingWrites[key];
  });
}
```

- [ ] **Step 6: Key the load on `user_id` and subscribe to auth**

In `initInterests()`:

```js
    data.forEach(function (r) { setLocal(r.interest_key, r.user_id, r.state); });
```

and at the end:

```js
  // Signing in or out re-renders which mark is yours.
  onAuthChange(renderAll);
```

- [ ] **Step 7: Run the check and watch it pass**

```bash
rm -rf site/_site && ./script/check.sh
```

Expected: all ok.

- [ ] **Step 8: Verify in a browser**

At `http://localhost:4000/cities/`: signed out, all four marks render read-only with "Sign in to join in". Signed in, only your own mark is a button. Tap it through unset → yes → no → unset; reload and confirm it persisted. Confirm the same mark shows on the Athens page and the cities index.

- [ ] **Step 9: Commit**

```bash
git add site/assets/js/interests.js script/check.sh
git commit -m "feat: interest marks are keyed to the signed-in user"
```

---

### Task 5: Remove the picker

**Files:**
- Delete: `site/assets/js/identity.js`
- Modify: `site/_config.yml`
- Test: `script/check.sh`

**Interfaces:**
- Consumes: nothing. Every importer of `identity.js` moved to `auth.js` in Tasks 2-4.
- Produces: nothing.

- [ ] **Step 1: Confirm nothing still imports it**

```bash
grep -rn "identity.js\|getPerson\|onPersonChange\|family_members" site/ script/ --include=*.js --include=*.html --include=*.yml
```

Expected: no matches outside `site/_site/` (build output) and `supabase.js` if it still mentions nothing. If any source file matches, fix it before continuing — deleting the module first would break the build for a reason the checks cannot explain.

- [ ] **Step 2: Delete the module and the roster**

```bash
git rm site/assets/js/identity.js
```

Remove the `family_members:` block from `site/_config.yml`, including its four entries. The roster lives in `profiles` now; leaving a second copy in config invites the two drifting apart.

- [ ] **Step 3: Run the check and watch it pass**

```bash
rm -rf site/_site && ./script/check.sh
```

Expected: all ok, including the "no stale identity.js" check added in Task 2.

- [ ] **Step 4: Full browser pass**

With `jekyll serve` running, sign in as two different people in two browsers. Confirm: each sees only their own mark as a button; both see all four marks; a comment from one appears for the other on reload.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: drop the identity picker and the config roster"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Magic link, not passwords | 1 (steps 3-4), 2 (step 3, `shouldCreateUser: false`) |
| Link delivery / manual user creation | 1 (steps 4-5, 7) |
| Mail rate limits documented | 1 (step 7) |
| Identity is Supabase's, not the site's | 2 (steps 5-6), 5 (step 2) |
| Redirect back to originating page | 1 (step 6), 2 (step 5, `window.location.href`) |
| Schema: `profiles`, no `person` | 1 (step 1) |
| Existing rows dropped | 1 (step 1, `drop table`) |
| `user_id` defaults to `auth.uid()` | 1 (step 1), 2 (step 4) |
| RLS is the enforcement | 1 (step 1) |
| Client: `auth.js`, `identity.js` deleted | 2 (step 5), 5 (step 2) |
| Locked copy reworded | 3 (step 3), 4 (step 4) |
| Interests read-only logged out | 4 (steps 4-5) |
| Comments join `profiles` | 2 (step 5, `PEOPLE`), 3 (step 4, `personLabel`) |
| Manual RLS verification checklist | 1 (step 8) |
| `check.sh` covers markup only | 2, 3, 4 (step 1 of each) |

No gaps.

**Placeholder scan:** none. The one deliberate placeholder is `<papa-uuid>` in Task 1 Step 5, which cannot be known before Step 4 runs and is explicitly labelled as a substitution.

**Type consistency:** `PEOPLE` entries are `{user_id, name, emoji}` in `auth.js` (Task 2) and read as `person.user_id` in `interests.js` (Task 4) — consistent. `personLabel(userId)` takes a UUID in both its definition (Task 2) and its two call sites (Tasks 3, 4). `setInterest(key, state)` and `clearInterest(key)` are two-arg and one-arg in both `supabase.js` (Task 2) and `interests.js` (Task 4). `getUser()` returns an object with `.id`, and every call site uses `.id` rather than treating it as a string.

**One risk worth flagging to the executor:** Task 2 leaves the tree in a state where `check.sh` passes but the browser console errors, because `comments.js` and `interests.js` still import the deleted-in-spirit `identity.js`. That is deliberate — the alternative is one enormous task — but do not interpret a green `check.sh` after Task 2 as "the site works".
