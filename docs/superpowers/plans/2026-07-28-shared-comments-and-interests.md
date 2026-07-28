# Shared Comments and Interests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-device localStorage interest marks and never-enabled Giscus comments with shared state in Supabase, behind a family member name picked once per device.

**Architecture:** The Jekyll static site and GitHub Pages deploy are unchanged. `site/assets/js/app.js` splits into five ES modules; all network access is confined to `supabase.js`, which talks to two tables via the public `anon` key. Identity is a name in localStorage — localStorage keeps only *who you are*, never the opinions.

**Tech Stack:** Jekyll (Ruby, no npm and no build step), `@supabase/supabase-js` imported from the CDN as ESM, Supabase Postgres with Row Level Security.

**Spec:** `docs/superpowers/specs/2026-07-28-shared-comments-and-interests-design.md`

## Global Constraints

- **No build step.** No npm, no bundler, no `package.json`. The toolchain stays Ruby-only. Supabase JS is imported from the CDN with `<script type="module">`.
- **Degrade on empty config.** An empty `supabase.url` must render a short placeholder note and still build and deploy — exactly as an empty `giscus.repo_id` does today. This is a configuration path, not an error.
- **Never break the build without JS.** Pages stay fully readable with JavaScript off or Supabase unreachable.
- **`baseurl` stays `""`.** Never set it to `/euro_trip`; it would break the custom domain. Use `relative_url` for all internal paths.
- **No `countdown` or `serviceWorker` strings** anywhere in the built site — `script/check.sh` asserts their absence and the trip date is undecided.
- **Person keys are lowercased display names:** `Papa`→`papa`, `Mama`→`mama`, `Bubu`→`bubu`, `Gaby`→`gaby`. Display name and emoji always come from `site.family_members`; the stored key is only ever an identifier.
- **Interests key on `interest_key`** (`city:athens`), comments key on `page_path` (`/cities/rome/`). These differ deliberately.
- **`script/check.sh` must pass** at the end of every task that changes the site. It is the project's only automated test surface.
- **Add an assertion to `check.sh` whenever you add or change a page** — the README requires it.
- **Commit after every task.**

## File Structure

| File | Responsibility |
| --- | --- |
| `supabase/schema.sql` (create) | Tables, constraints, indexes, RLS policies. Applied by hand in the Supabase SQL editor; committed so the schema is reviewable and reproducible. |
| `site/_config.yml` (modify) | Replace the `giscus:` block with `supabase:`. |
| `site/_includes/supabase-config.html` (create) | Emits the public URL and anon key as a JSON `<script>` tag. Single source of runtime config. |
| `site/assets/js/identity.js` (create) | Who am I; pick, switch, the four names. No dependencies. |
| `site/assets/js/supabase.js` (create) | The only file that performs network I/O. Five exported calls. |
| `site/assets/js/interests.js` (create) | Renders the four-avatar row; wires the toggle. |
| `site/assets/js/comments.js` (create) | Renders the thread and the post form. |
| `site/assets/js/ui.js` (create) | Mobile nav and smooth scroll, moved verbatim from `app.js`. |
| `site/assets/js/app.js` (modify) | Becomes a thin module entry point that imports the others. |
| `site/_includes/comments.html` (create) | Replaces `giscus.html`. Keeps the "Family Notes" heading and prompt. |
| `site/_includes/giscus.html` (delete) | Replaced. |
| `site/_includes/identity-banner.html` (create) | The "Who's this?" picker and current-identity display. |
| `site/_includes/header.html` (modify) | Include the identity banner. |
| `site/_layouts/city.html` (modify) | Swap the single toggle for the avatar row; swap the include. |
| `site/_layouts/question.html` (modify) | Swap the include. |
| `site/cities.md` (modify) | Swap toggles for avatar rows; update the note copy. |
| `site/feedback.md` (modify) | Swap the include. |
| `site/assets/css/style.css` (modify) | Styles for the avatar row, identity banner, comment thread, and error states. |
| `script/check.sh` (modify) | Static assertions for the new markup; assert Giscus is gone. |
| `README.md` (modify) | Replace "Enabling comments" with Supabase setup and the manual verification script. |

Task order is deliberate: the schema and config exist before any code needs them, identity precedes the two features that depend on it, and the module split lands before new features are added to it — so no task both restructures and adds behavior.

---

### Task 1: Schema and Supabase project config

**Files:**
- Create: `supabase/schema.sql`
- Modify: `site/_config.yml`
- Create: `site/_includes/supabase-config.html`
- Modify: `script/check.sh`

**Interfaces:**
- Consumes: nothing.
- Produces: `window.SUPABASE_CONFIG` — an object `{url: string, anonKey: string}`, where both are `""` when unconfigured. Every later task reads config only through this.

- [ ] **Step 1: Write the schema**

Create `supabase/schema.sql`:

```sql
-- Applied by hand in the Supabase SQL editor. Committed so the schema is
-- reviewable and reproducible; this project has no migration tooling.

-- An interest is about a city, a comment is about a page. The cities index
-- renders all eleven toggles on one page, so keying interests on the page
-- would collide them into a single row.
create table if not exists interests (
  id           uuid primary key default gen_random_uuid(),
  interest_key text not null,
  person       text not null check (person in ('papa','mama','bubu','gaby')),
  state        text not null check (state in ('yes','no')),
  updated_at   timestamptz not null default now(),
  unique (interest_key, person)
);

create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  page_path  text not null,
  person     text not null check (person in ('papa','mama','bubu','gaby')),
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists interests_key_idx on interests (interest_key);
create index if not exists comments_path_idx on comments (page_path);

alter table interests enable row level security;
alter table comments  enable row level security;

-- The anon key ships in the client bundle; that is what it is for. The CHECK
-- constraints and the body length limit are the real guardrails.
create policy "anon reads interests"   on interests for select to anon using (true);
create policy "anon inserts interests" on interests for insert to anon with check (true);
create policy "anon updates interests" on interests for update to anon using (true) with check (true);
-- Delete is required: clearing a mark removes the row rather than storing
-- an "unset" state, so the table only ever holds actual opinions.
create policy "anon deletes interests" on interests for delete to anon using (true);

-- Deliberately no update or delete policy. Editing or removing a comment is
-- a SQL console job, which is the right level of friction for four people.
create policy "anon reads comments"   on comments for select to anon using (true);
create policy "anon inserts comments" on comments for insert to anon with check (true);
```

- [ ] **Step 2: Replace the Giscus config block**

In `site/_config.yml`, delete the `giscus:` block and its comment, and add in its place:

```yaml
# Supabase backs the shared interest marks and comment threads. Both values
# are public by design — the anon key is meant to ship in the client. Fill
# them in after creating the project and applying supabase/schema.sql.
# While url is empty the site builds and deploys fine: the widgets render a
# short placeholder note instead, exactly as the old Giscus block did.
supabase:
  url: ""
  anon_key: ""
```

- [ ] **Step 3: Create the config include**

Create `site/_includes/supabase-config.html`:

```html
{%- comment -%}
  The single source of runtime config. Emitted as JSON rather than
  interpolated into JS so that a stray quote in a config value cannot
  break the parse. Both values are empty when unconfigured, which every
  module treats as "not set up" rather than as an error.
{%- endcomment -%}
<script>
  window.SUPABASE_CONFIG = {
    url: {{ site.supabase.url | default: "" | jsonify }},
    anonKey: {{ site.supabase.anon_key | default: "" | jsonify }}
  };
</script>
```

- [ ] **Step 4: Wire the include into the layout**

In `site/_layouts/default.html`, add the include immediately before the existing `app.js` script tag:

```html
  {% include supabase-config.html %}
  <script src="{{ '/assets/js/app.js' | relative_url }}"></script>
```

- [ ] **Step 5: Add the assertion**

In `script/check.sh`, immediately after the `assert_file "$SITE_OUT/assets/js/app.js"` line, add:

```bash
# Runtime config must reach every page, even while unconfigured — the empty
# string is what the modules read as "Supabase is not set up".
assert_contains "$SITE_OUT/index.html" "window.SUPABASE_CONFIG"
assert_contains "$SITE_OUT/cities/athens/index.html" "window.SUPABASE_CONFIG"
```

- [ ] **Step 6: Run the checks**

Run: `./script/check.sh`
Expected: `ALL CHECKS PASSED`. The two new assertions pass because `jsonify` renders empty config as `""`, not as nothing.

- [ ] **Step 7: Commit**

```bash
git add supabase/schema.sql site/_config.yml site/_includes/supabase-config.html site/_layouts/default.html script/check.sh
git commit -m "feat: Supabase schema and public runtime config"
```

---

### Task 2: Identity module and picker

**Files:**
- Create: `site/assets/js/identity.js`
- Create: `site/_includes/identity-banner.html`
- Modify: `site/_includes/header.html`
- Modify: `site/assets/css/style.css`
- Modify: `script/check.sh`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `getPerson()` → `string | null` — the stored key (`"bubu"`) or `null` if unpicked.
  - `setPerson(key)` → `void` — stores and fires the change event.
  - `clearPerson()` → `void` — forgets, returning the banner to the picker.
  - `onPersonChange(fn)` → `void` — registers `fn(personOrNull)`, called on every change. Not called on registration.
  - `PEOPLE` → `Array<{key, name, emoji}>` — read from the banner's rendered data, so `_config.yml` stays the only source of truth.

- [ ] **Step 1: Write the banner markup**

Create `site/_includes/identity-banner.html`. The `data-people` attribute is how JS learns the roster without duplicating it:

```html
{%- comment -%}
  The roster lives in _config.yml's family_members and is handed to JS as
  JSON here, so the four names are defined in exactly one place. The stored
  key is the lowercased display name; the name and emoji are for display.
{%- endcomment -%}
{%- capture people_json -%}
[{% for m in site.family_members %}{"key":{{ m.name | downcase | jsonify }},"name":{{ m.name | jsonify }},"emoji":{{ m.emoji | jsonify }}}{% unless forloop.last %},{% endunless %}{% endfor %}]
{%- endcapture -%}
<div class="identity-banner" data-identity-banner data-people='{{ people_json | strip }}' hidden>
  <div class="identity-picker" data-identity-picker>
    <span class="identity-prompt">Who's this?</span>
    <span class="identity-choices" data-identity-choices></span>
  </div>
  <div class="identity-current" data-identity-current hidden>
    <span data-identity-label></span>
    <button type="button" class="identity-switch" data-identity-switch>not you?</button>
  </div>
</div>
```

The wrapper is `hidden` in markup and unhidden by JS, so the picker never flashes for users with JS disabled — for whom it would be useless.

- [ ] **Step 2: Include it in the header**

In `site/_includes/header.html`, add the include as the last element inside `<header class="site-header">`, after the closing `</div>` of `.header-container`:

```html
    </nav>
  </div>
  {% include identity-banner.html %}
</header>
```

- [ ] **Step 3: Write the identity module**

Create `site/assets/js/identity.js`:

```javascript
// Who is using this device. This is the only thing localStorage still holds —
// the opinions themselves live in Supabase. Losing this value costs a tap,
// not data.

const STORAGE_KEY = 'euro-trip-person';

const listeners = [];
let banner = null;

export let PEOPLE = [];

export function getPerson() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    // A key from an older or hand-edited value must not be trusted: it would
    // be rejected by the database CHECK constraint anyway, so treat it as
    // unpicked and let the user choose again.
    return PEOPLE.some(function (p) { return p.key === value; }) ? value : null;
  } catch (e) {
    // Private browsing. Identity lasts for this page view only.
    return null;
  }
}

export function setPerson(key) {
  if (!PEOPLE.some(function (p) { return p.key === key; })) return;
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch (e) {
    // Not fatal — render() still reflects the choice for this page view.
  }
  render();
  notify(key);
}

export function clearPerson() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // Nothing to do; render() below still returns the UI to the picker.
  }
  render();
  notify(null);
}

export function onPersonChange(fn) {
  listeners.push(fn);
}

export function personLabel(key) {
  const person = PEOPLE.find(function (p) { return p.key === key; });
  return person ? person.emoji + ' ' + person.name : key;
}

function notify(value) {
  listeners.forEach(function (fn) { fn(value); });
}

function render() {
  if (!banner) return;
  const current = getPerson();
  const picker = banner.querySelector('[data-identity-picker]');
  const currentEl = banner.querySelector('[data-identity-current]');
  const label = banner.querySelector('[data-identity-label]');

  picker.hidden = current !== null;
  currentEl.hidden = current === null;
  if (current) label.textContent = personLabel(current);
}

export function initIdentity() {
  banner = document.querySelector('[data-identity-banner]');
  if (!banner) return;

  try {
    PEOPLE = JSON.parse(banner.dataset.people) || [];
  } catch (e) {
    PEOPLE = [];
  }
  if (PEOPLE.length === 0) return;

  const choices = banner.querySelector('[data-identity-choices]');
  PEOPLE.forEach(function (person) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'identity-choice';
    btn.textContent = person.emoji + ' ' + person.name;
    btn.addEventListener('click', function () { setPerson(person.key); });
    choices.appendChild(btn);
  });

  banner.querySelector('[data-identity-switch]')
    .addEventListener('click', clearPerson);

  banner.hidden = false;
  render();
}
```

- [ ] **Step 4: Load the module**

Leave the existing `app.js` and its IIFE completely untouched — Task 3 folds it into `ui.js`. Identity ships alongside it for now, so this task can be reviewed on its own.

In `site/_layouts/default.html`, add a module script **after** the existing `app.js` tag:

```html
  <script src="{{ '/assets/js/app.js' | relative_url }}"></script>
  <script type="module" src="{{ '/assets/js/main.js' | relative_url }}"></script>
```

Create `site/assets/js/main.js`:

```javascript
// Module entry point. Task 3 folds the legacy app.js IIFE into ui.js, after
// which this is the only script the layout loads.
import { initIdentity } from './identity.js';

initIdentity();
```

The old localStorage interest toggles keep working through this task; Task 3 removes them.

- [ ] **Step 5: Style the banner**

Append to `site/assets/css/style.css`:

```css
/* ============================================
   Identity banner
   ============================================ */
.identity-banner {
  background: #f4f8fb;
  border-top: 1px solid #dbe6ee;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.identity-prompt {
  margin-right: 0.25rem;
  color: #44606f;
}

.identity-choices {
  display: inline-flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.identity-choice,
.identity-switch {
  background: #fff;
  border: 1px solid #bfd3e0;
  border-radius: 999px;
  padding: 0.2rem 0.7rem;
  font: inherit;
  cursor: pointer;
}

.identity-choice:hover,
.identity-switch:hover {
  background: #e8f1f7;
}

.identity-choice:focus-visible,
.identity-switch:focus-visible {
  outline: 2px solid #1d6a96;
  outline-offset: 2px;
}

.identity-switch {
  margin-left: 0.5rem;
  font-size: 0.8rem;
  color: #5b7383;
}
```

- [ ] **Step 6: Add assertions**

In `script/check.sh`, after the `SUPABASE_CONFIG` assertions from Task 1, add:

```bash
# The roster is defined once, in _config.yml. If this attribute stops being
# rendered, every identity-dependent feature silently disables itself.
assert_contains "$SITE_OUT/index.html" "data-identity-banner"
assert_contains "$SITE_OUT/index.html" '"key":"papa"'
assert_contains "$SITE_OUT/index.html" '"key":"gaby"'
assert_file "$SITE_OUT/assets/js/identity.js"
assert_file "$SITE_OUT/assets/js/main.js"
```

- [ ] **Step 7: Run the checks**

Run: `./script/check.sh`
Expected: `ALL CHECKS PASSED`

- [ ] **Step 8: Verify by hand**

Run `cd site && bundle exec jekyll serve`, open `http://localhost:4000`, and confirm: the banner shows four name choices; clicking "👦 Bubu" replaces them with "👦 Bubu — not you?"; reloading keeps it; clicking "not you?" returns the picker.

- [ ] **Step 9: Commit**

```bash
git add site/assets/js/identity.js site/assets/js/main.js site/_includes/identity-banner.html site/_includes/header.html site/_layouts/default.html site/assets/css/style.css script/check.sh
git commit -m "feat: pick-your-name identity banner"
```

---

### Task 3: Split app.js into modules

**Files:**
- Create: `site/assets/js/ui.js`
- Modify: `site/assets/js/app.js` (delete)
- Modify: `site/assets/js/main.js`
- Modify: `site/_layouts/default.html`
- Modify: `script/check.sh`

**Interfaces:**
- Consumes: `initIdentity()` from Task 2.
- Produces: `initUI()` — wires mobile nav and smooth scroll. Behavior identical to today's.

This task moves code and deletes the localStorage interest logic. It adds no behavior — Task 5 rebuilds interests against Supabase. Keeping the restructure separate means a reviewer can confirm "nothing changed" here and judge new behavior on its own.

- [ ] **Step 1: Create ui.js with the nav and scroll logic only**

Create `site/assets/js/ui.js`, copying the mobile-nav and smooth-scroll sections from `app.js` verbatim into an exported function. The interest-toggle section is **not** copied — it is replaced in Task 5:

```javascript
// Mobile nav and smooth scrolling. Moved verbatim from the former app.js
// IIFE; behavior is unchanged.

export function initUI() {
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', function () {
      const isOpen = siteNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', function (e) {
      if (!menuToggle.contains(e.target) && !siteNav.contains(e.target)) {
        siteNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
```

- [ ] **Step 2: Delete the old file**

```bash
git rm site/assets/js/app.js
```

- [ ] **Step 3: Update the entry point**

Replace `site/assets/js/main.js`:

```javascript
// Module entry point — the only script the layout loads.
import { initUI } from './ui.js';
import { initIdentity } from './identity.js';

initUI();
initIdentity();
```

- [ ] **Step 4: Update the layout**

In `site/_layouts/default.html`, remove the legacy script tag so only the module remains:

```html
  {% include supabase-config.html %}
  <script type="module" src="{{ '/assets/js/main.js' | relative_url }}"></script>
```

- [ ] **Step 5: Update the assertions**

In `script/check.sh`, the old `app.js` assertions now refer to a deleted file. Replace these three lines:

```bash
assert_file "$SITE_OUT/assets/js/app.js"
assert_absent "$SITE_OUT/assets/js/app.js" "countdown"
assert_absent "$SITE_OUT/assets/js/app.js" "serviceWorker"
```

with:

```bash
assert_file "$SITE_OUT/assets/js/ui.js"
assert_absent "$SITE_OUT/assets/js/ui.js" "countdown"
assert_absent "$SITE_OUT/assets/js/ui.js" "serviceWorker"
# app.js is gone; a stale copy in _site would still be served.
if [ -f "$SITE_OUT/assets/js/app.js" ]; then
  echo "FAIL  stale $SITE_OUT/assets/js/app.js still present — clean site/_site"
  FAIL=1
else
  echo "ok    no stale app.js"
fi
```

Also delete this now-obsolete line, which asserted the localStorage key that this task removes:

```bash
assert_contains "$SITE_OUT/assets/js/app.js" "euro-trip-interest"
```

- [ ] **Step 6: Clean and rebuild**

Jekyll does not remove files from `_site` that no longer have a source, so the deleted `app.js` would linger and the new assertion would fail:

Run: `rm -rf site/_site && ./script/check.sh`
Expected: `ALL CHECKS PASSED`

- [ ] **Step 7: Verify no behavior changed**

Serve the site and confirm the mobile menu still opens and closes and anchor links still scroll smoothly. The interest buttons are now inert — expected; Task 5 rebuilds them.

- [ ] **Step 8: Commit**

```bash
git add -A site/assets/js site/_layouts/default.html script/check.sh
git commit -m "refactor: split app.js into ES modules, drop localStorage interests"
```

---

### Task 4: Supabase data layer

**Files:**
- Create: `site/assets/js/supabase.js`
- Modify: `script/check.sh`

**Interfaces:**
- Consumes: `window.SUPABASE_CONFIG` from Task 1.
- Produces:
  - `isConfigured()` → `boolean` — false when `url` is empty. Callers render the placeholder note rather than an error.
  - `getInterests()` → `Promise<Array<{interest_key, person, state}>>` — every row, unfiltered. At eleven cities and four people this is at most forty-four rows.
  - `setInterest(interestKey, person, state)` → `Promise<void>` — upsert on `(interest_key, person)`. `state` is `'yes'` or `'no'`.
  - `clearInterest(interestKey, person)` → `Promise<void>` — deletes the row. This is the "unset" state.
  - `getComments(pagePath)` → `Promise<Array<{id, person, body, created_at}>>` — oldest first.
  - `addComment(pagePath, person, body)` → `Promise<void>`.

  Every call rejects on failure. Callers are responsible for rendering the failure; this module never touches the DOM.

- [ ] **Step 1: Write the module**

Create `site/assets/js/supabase.js`:

```javascript
// The only file that performs network I/O. Everything else in the app talks
// to Supabase through these six functions and never sees a query.
//
// The anon key is public by design and ships in the page. The database CHECK
// constraints and RLS policies are the real guardrails, not secrecy.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const config = window.SUPABASE_CONFIG || { url: '', anonKey: '' };

let client = null;

export function isConfigured() {
  return Boolean(config.url && config.anonKey);
}

function db() {
  if (!isConfigured()) throw new Error('Supabase is not configured');
  if (!client) client = createClient(config.url, config.anonKey);
  return client;
}

export async function getInterests() {
  const { data, error } = await db()
    .from('interests')
    .select('interest_key, person, state');
  if (error) throw error;
  return data || [];
}

export async function setInterest(interestKey, person, state) {
  const { error } = await db()
    .from('interests')
    .upsert(
      { interest_key: interestKey, person: person, state: state, updated_at: new Date().toISOString() },
      { onConflict: 'interest_key,person' }
    );
  if (error) throw error;
}

export async function clearInterest(interestKey, person) {
  // Unset is a row delete, not a stored state, so the table only ever holds
  // actual opinions.
  const { error } = await db()
    .from('interests')
    .delete()
    .eq('interest_key', interestKey)
    .eq('person', person);
  if (error) throw error;
}

export async function getComments(pagePath) {
  const { data, error } = await db()
    .from('comments')
    .select('id, person, body, created_at')
    .eq('page_path', pagePath)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addComment(pagePath, person, body) {
  const { error } = await db()
    .from('comments')
    .insert({ page_path: pagePath, person: person, body: body });
  if (error) throw error;
}
```

- [ ] **Step 2: Add the assertion**

In `script/check.sh`, alongside the other JS file assertions:

```bash
assert_file "$SITE_OUT/assets/js/supabase.js"
```

- [ ] **Step 3: Run the checks**

Run: `./script/check.sh`
Expected: `ALL CHECKS PASSED`. Nothing imports this module yet, so no behavior changes.

- [ ] **Step 4: Commit**

```bash
git add site/assets/js/supabase.js script/check.sh
git commit -m "feat: Supabase data layer"
```

---

### Task 5: Shared interest marks

**Files:**
- Create: `site/assets/js/interests.js`
- Modify: `site/_layouts/city.html`
- Modify: `site/cities.md`
- Modify: `site/assets/js/main.js`
- Modify: `site/assets/css/style.css`
- Modify: `script/check.sh`

**Interfaces:**
- Consumes: `getPerson`, `onPersonChange`, `PEOPLE` from Task 2; `isConfigured`, `getInterests`, `setInterest`, `clearInterest` from Task 4.
- Produces: `initInterests()`. Operates on every `[data-interest-key]` element on the page.

The markup contract: each city renders one `<div class="interest-row" data-interest-key="city:athens">`. JS fills it with one button per family member. Your own button is clickable and cycles unset → yes → no → unset; the other three render as read-only marks.

- [ ] **Step 1: Replace the toggle markup on the city layout**

In `site/_layouts/city.html`, replace the `<p>` containing the button and the `<p class="interest-note">` that follows it with:

```html
  <div class="interest-row" data-interest-key="city:{{ page.city | downcase | replace: ' ', '-' }}"></div>
  <p class="interest-note">Everyone's marks show here. Tap yours to change it.</p>
```

- [ ] **Step 2: Replace the toggle markup on the cities index**

In `site/cities.md`, replace the `<button class="interest-toggle" ...>` element with:

```html
    <div class="interest-row" data-interest-key="city:{{ city.city | downcase | replace: ' ', '-' }}"></div>
```

And replace the note above the list:

```html
<p class="interest-note">Everyone's marks show below. Tap yours to change it — the same mark shows on the city's own page.</p>
```

- [ ] **Step 3: Write the interests module**

Create `site/assets/js/interests.js`:

```javascript
// Shared interest marks. Every family member's mark for a city renders on
// both the city page and the cities index, because both key on the same
// interest_key rather than on the page they appear on.

import { getPerson, onPersonChange, PEOPLE, personLabel } from './identity.js';
import { isConfigured, getInterests, setInterest, clearInterest } from './supabase.js';

const CYCLE = ['unset', 'yes', 'no'];
const MARK = { unset: '☆', yes: '★', no: '✕' };

// interest_key -> { person -> state }
let marks = {};
let rows = [];

function stateFor(key, person) {
  return (marks[key] && marks[key][person]) || 'unset';
}

function setLocal(key, person, state) {
  if (!marks[key]) marks[key] = {};
  if (state === 'unset') delete marks[key][person];
  else marks[key][person] = state;
}

function renderRow(row) {
  const key = row.dataset.interestKey;
  const me = getPerson();
  row.textContent = '';

  PEOPLE.forEach(function (person) {
    const state = stateFor(key, person.key);
    const isMe = person.key === me;

    const el = document.createElement(isMe ? 'button' : 'span');
    el.className = 'interest-mark' + (isMe ? ' is-me' : '');
    el.dataset.interestState = state;
    el.textContent = person.emoji + MARK[state];

    if (isMe) {
      el.type = 'button';
      // Three states, so "no" maps to mixed rather than false — otherwise a
      // screen reader cannot tell "not marked" from "explicitly not interested".
      el.setAttribute('aria-pressed', state === 'yes' ? 'true' : (state === 'no' ? 'mixed' : 'false'));
      el.setAttribute('aria-label', 'Your mark for this city: ' + state);
      el.addEventListener('click', function () { cycle(row, key, person.key); });
    } else {
      el.setAttribute('title', personLabel(person.key) + ': ' + state);
    }

    row.appendChild(el);
  });

  if (!me) {
    const hint = document.createElement('span');
    hint.className = 'interest-hint';
    hint.textContent = 'Pick who you are to join in';
    row.appendChild(hint);
  }
}

function renderAll() {
  rows.forEach(renderRow);
}

function showRowError(row, message) {
  const err = document.createElement('span');
  err.className = 'interest-error';
  err.textContent = message;
  row.appendChild(err);
}

async function cycle(row, key, person) {
  const previous = stateFor(key, person);
  const next = CYCLE[(CYCLE.indexOf(previous) + 1) % CYCLE.length];

  // Optimistic: render immediately, revert if the write fails. A star that
  // was never saved is worse than a slow one.
  setLocal(key, person, next);
  renderRow(row);

  try {
    if (next === 'unset') await clearInterest(key, person);
    else await setInterest(key, person, next);
  } catch (e) {
    setLocal(key, person, previous);
    renderRow(row);
    showRowError(row, "Didn't save — try again");
  }
}

export async function initInterests() {
  rows = Array.prototype.slice.call(document.querySelectorAll('[data-interest-key]'));
  if (rows.length === 0) return;

  if (!isConfigured()) {
    rows.forEach(function (row) {
      row.textContent = '';
      showRowError(row, 'Marks turn on once Supabase is configured.');
    });
    return;
  }

  rows.forEach(function (row) {
    row.textContent = '';
    const loading = document.createElement('span');
    loading.className = 'interest-hint';
    loading.textContent = 'Loading marks…';
    row.appendChild(loading);
  });

  try {
    const data = await getInterests();
    marks = {};
    data.forEach(function (r) { setLocal(r.interest_key, r.person, r.state); });
    renderAll();
  } catch (e) {
    rows.forEach(function (row) {
      row.textContent = '';
      showRowError(row, "Couldn't load marks — reload to try again");
    });
    return;
  }

  // Switching identity re-renders which button is yours.
  onPersonChange(renderAll);
}
```

- [ ] **Step 4: Wire it into the entry point**

Update `site/assets/js/main.js`:

```javascript
// Module entry point — the only script the layout loads.
import { initUI } from './ui.js';
import { initIdentity } from './identity.js';
import { initInterests } from './interests.js';

initUI();
initIdentity();
initInterests();
```

`initIdentity()` runs first because `initInterests()` reads `PEOPLE` from it.

- [ ] **Step 5: Style the marks**

In `site/assets/css/style.css`, replace the `.interest-toggle` rules (the block starting at `.interest-toggle {` through `.itinerary-item .interest-toggle`) with:

```css
/* ============================================
   Shared interest marks
   ============================================ */
.interest-row {
  display: flex;
  gap: 0.3rem;
  align-items: center;
  flex-wrap: wrap;
  margin: 0.4rem 0;
}

.interest-mark {
  font-size: 0.95rem;
  line-height: 1;
  padding: 0.25rem 0.4rem;
  border-radius: 6px;
  border: 1px solid transparent;
  background: #f3f5f7;
}

.interest-mark.is-me {
  cursor: pointer;
  border-color: #bfd3e0;
  background: #fff;
  font: inherit;
  font-size: 0.95rem;
}

.interest-mark.is-me:hover {
  background: #e8f1f7;
}

.interest-mark.is-me:focus-visible {
  outline: 2px solid #1d6a96;
  outline-offset: 2px;
}

.interest-mark[data-interest-state="yes"] {
  background: #e6f4ea;
}

.interest-mark[data-interest-state="no"] {
  background: #f7e9e9;
}

.interest-hint,
.interest-error {
  font-size: 0.8rem;
  color: #6b7c88;
}

.interest-error {
  color: #9c3b3b;
}

.interest-note {
  font-size: 0.85rem;
  color: #6b7c88;
  margin-top: 0.3rem;
}
```

- [ ] **Step 6: Update the assertions**

In `script/check.sh`, replace the three interest assertions from the old design:

```bash
assert_contains "$SITE_OUT/assets/css/style.css" ".interest-toggle"
assert_contains "$SITE_OUT/cities/athens/index.html" 'data-interest-key="city:athens"'
assert_contains "$SITE_OUT/cities/index.html" 'data-interest-key="city:amsterdam"'
```

with:

```bash
assert_contains "$SITE_OUT/assets/css/style.css" ".interest-mark"
assert_file "$SITE_OUT/assets/js/interests.js"
# The same interest_key must appear on both the city page and the index —
# that shared key is what makes them two views of one mark.
assert_contains "$SITE_OUT/cities/athens/index.html" 'data-interest-key="city:athens"'
assert_contains "$SITE_OUT/cities/index.html" 'data-interest-key="city:athens"'
assert_contains "$SITE_OUT/cities/index.html" 'data-interest-key="city:amsterdam"'
# The old per-device copy must not survive anywhere.
assert_absent "$SITE_OUT/cities/index.html" "not shared with anyone"
assert_absent "$SITE_OUT/cities/athens/index.html" "nobody else sees this"
```

- [ ] **Step 7: Run the checks**

Run: `./script/check.sh`
Expected: `ALL CHECKS PASSED`

- [ ] **Step 8: Verify the unconfigured path**

With `supabase.url` still empty, serve the site and confirm every city row reads "Marks turn on once Supabase is configured." and nothing throws in the console. This is the degradation path from Global Constraints.

- [ ] **Step 9: Commit**

```bash
git add site/assets/js/interests.js site/assets/js/main.js site/_layouts/city.html site/cities.md site/assets/css/style.css script/check.sh
git commit -m "feat: shared interest marks backed by Supabase"
```

---

### Task 6: Shared comment threads

**Files:**
- Create: `site/assets/js/comments.js`
- Create: `site/_includes/comments.html`
- Delete: `site/_includes/giscus.html`
- Modify: `site/_layouts/city.html`
- Modify: `site/_layouts/question.html`
- Modify: `site/feedback.md`
- Modify: `site/assets/js/main.js`
- Modify: `site/assets/css/style.css`
- Modify: `script/check.sh`

**Interfaces:**
- Consumes: `getPerson`, `onPersonChange`, `personLabel` from Task 2; `isConfigured`, `getComments`, `addComment` from Task 4.
- Produces: `initComments()`. Operates on the single `[data-comments]` element, if present.

- [ ] **Step 1: Create the include**

Create `site/_includes/comments.html`, preserving the heading and prompt from the Giscus version:

```html
<section class="day-comments" data-comments data-page-path="{{ page.url }}">
  <h2>Family Notes</h2>
  <p class="comments-prompt">Reactions, objections, and "please no" all welcome.</p>
  <div class="comments-thread" data-comments-thread></div>
  <form class="comment-form" data-comment-form hidden>
    <label class="visually-hidden" for="comment-body">Your note</label>
    <textarea id="comment-body" data-comment-body rows="3" maxlength="2000"
              placeholder="Say what you actually think…"></textarea>
    <div class="comment-form-row">
      <button type="submit" class="comment-submit">Post</button>
      <span class="comment-status" data-comment-status></span>
    </div>
  </form>
  <p class="comment-locked" data-comment-locked hidden>Pick who you are to join in.</p>
</section>
```

`data-page-path` uses `page.url`, which is the same `pathname` value Giscus keyed on.

- [ ] **Step 2: Delete the Giscus include**

```bash
git rm site/_includes/giscus.html
```

- [ ] **Step 3: Swap the include on all three consumers**

In `site/_layouts/city.html`, `site/_layouts/question.html`, and `site/feedback.md`, replace:

```liquid
{% include giscus.html %}
```

with:

```liquid
{% include comments.html %}
```

- [ ] **Step 4: Write the comments module**

Create `site/assets/js/comments.js`:

```javascript
// One flat thread per page, oldest first. Comments cannot be edited or
// deleted from the browser — that is a SQL console job, which is the right
// level of friction for four people who live together.

import { getPerson, onPersonChange, personLabel } from './identity.js';
import { isConfigured, getComments, addComment } from './supabase.js';

let section = null;
let thread = null;
let form = null;
let bodyEl = null;
let statusEl = null;
let lockedEl = null;
let pagePath = '';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  } catch (e) {
    return '';
  }
}

function renderThread(comments) {
  thread.textContent = '';

  if (comments.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'comments-empty';
    empty.textContent = 'No notes yet. Be the first to say something.';
    thread.appendChild(empty);
    return;
  }

  comments.forEach(function (c) {
    const item = document.createElement('article');
    item.className = 'comment';

    const meta = document.createElement('p');
    meta.className = 'comment-meta';
    meta.textContent = personLabel(c.person) + ' · ' + formatDate(c.created_at);

    const body = document.createElement('p');
    body.className = 'comment-body';
    // textContent, not innerHTML: comment bodies are user input and are
    // never treated as markup.
    body.textContent = c.body;

    item.appendChild(meta);
    item.appendChild(body);
    thread.appendChild(item);
  });
}

function renderFormVisibility() {
  const me = getPerson();
  form.hidden = me === null;
  lockedEl.hidden = me !== null;
}

function showThreadMessage(message) {
  thread.textContent = '';
  const p = document.createElement('p');
  p.className = 'comments-empty';
  p.textContent = message;
  thread.appendChild(p);
}

async function reload() {
  try {
    renderThread(await getComments(pagePath));
  } catch (e) {
    showThreadMessage("Couldn't load notes — reload to try again.");
  }
}

async function onSubmit(e) {
  e.preventDefault();
  const me = getPerson();
  const body = bodyEl.value.trim();
  if (!me || body === '') return;

  const submit = form.querySelector('.comment-submit');
  submit.disabled = true;
  statusEl.textContent = 'Posting…';

  try {
    await addComment(pagePath, me, body);
    bodyEl.value = '';
    statusEl.textContent = '';
    await reload();
  } catch (err) {
    // The text stays in the textarea so nothing typed is lost.
    statusEl.textContent = "Didn't post — try again.";
  } finally {
    submit.disabled = false;
  }
}

export async function initComments() {
  section = document.querySelector('[data-comments]');
  if (!section) return;

  thread = section.querySelector('[data-comments-thread]');
  form = section.querySelector('[data-comment-form]');
  bodyEl = section.querySelector('[data-comment-body]');
  statusEl = section.querySelector('[data-comment-status]');
  lockedEl = section.querySelector('[data-comment-locked]');
  pagePath = section.dataset.pagePath || window.location.pathname;

  if (!isConfigured()) {
    showThreadMessage('Notes turn on once Supabase is configured.');
    lockedEl.hidden = true;
    return;
  }

  showThreadMessage('Loading notes…');
  renderFormVisibility();
  onPersonChange(renderFormVisibility);
  form.addEventListener('submit', onSubmit);

  await reload();
}
```

- [ ] **Step 5: Wire it into the entry point**

Update `site/assets/js/main.js`:

```javascript
// Module entry point — the only script the layout loads.
import { initUI } from './ui.js';
import { initIdentity } from './identity.js';
import { initInterests } from './interests.js';
import { initComments } from './comments.js';

initUI();
initIdentity();
initInterests();
initComments();
```

- [ ] **Step 6: Style the thread**

Append to `site/assets/css/style.css`:

```css
/* ============================================
   Comment threads
   ============================================ */
.comments-thread {
  margin: 1rem 0;
}

.comment {
  border-top: 1px solid #e4eaee;
  padding: 0.75rem 0;
}

.comment-meta {
  font-size: 0.8rem;
  color: #6b7c88;
  margin: 0 0 0.25rem;
}

.comment-body {
  margin: 0;
  white-space: pre-wrap;
}

.comments-empty,
.comment-locked {
  color: #6b7c88;
  font-size: 0.9rem;
}

.comment-form textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #bfd3e0;
  border-radius: 6px;
  font: inherit;
  resize: vertical;
}

.comment-form-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.comment-submit {
  background: #1d6a96;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 1rem;
  font: inherit;
  cursor: pointer;
}

.comment-submit:disabled {
  opacity: 0.6;
  cursor: default;
}

.comment-status {
  font-size: 0.85rem;
  color: #9c3b3b;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
```

- [ ] **Step 7: Update the assertions**

In `script/check.sh`, replace the Giscus assertion:

```bash
assert_absent "$SITE_OUT/cities/athens/index.html" "giscus.app/client.js"
```

with:

```bash
# Giscus is gone entirely — no page may reference it.
if grep -rl "giscus" "$SITE_OUT" > /dev/null 2>&1; then
  echo "FAIL  'giscus' still present in built site:"
  grep -rl "giscus" "$SITE_OUT" | sed 's/^/      /'
  FAIL=1
else
  echo "ok    no giscus references anywhere in the built site"
fi
assert_file "$SITE_OUT/assets/js/comments.js"
assert_contains "$SITE_OUT/cities/athens/index.html" "Family Notes"
assert_contains "$SITE_OUT/cities/athens/index.html" 'data-page-path="/cities/athens/"'
assert_contains "$SITE_OUT/questions/pace/index.html" 'data-page-path="/questions/pace/"'
assert_contains "$SITE_OUT/feedback/index.html" "Family Notes"
# The cities index has no thread; interests are city-keyed, threads are not.
assert_absent "$SITE_OUT/cities/index.html" "data-comments"
```

- [ ] **Step 8: Clean, rebuild, and check**

Run: `rm -rf site/_site && ./script/check.sh`
Expected: `ALL CHECKS PASSED`

- [ ] **Step 9: Commit**

```bash
git add -A site script/check.sh
git commit -m "feat: Supabase comment threads, replacing Giscus"
```

---

### Task 7: Documentation and end-to-end verification

**Files:**
- Modify: `README.md`
- Modify: `site/_config.yml` (real values, only if you are configuring a live project)

**Interfaces:**
- Consumes: everything above.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the "Enabling comments" section**

In `README.md`, replace the entire "## Enabling comments" section with:

````markdown
## Enabling comments and shared marks

Both features are backed by one Supabase project. The site builds and deploys
fine without it — while `supabase.url` is empty, the interest rows and comment
threads render a short placeholder note instead.

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `supabase/schema.sql` from this repo. It creates
   both tables, the constraints, and the RLS policies.
3. From Project Settings → API, copy the **Project URL** and the **anon public**
   key.
4. Paste them into the `supabase:` block in `site/_config.yml`.
5. Commit and push.

The anon key is meant to be public and ships in the page — that is what it is
designed for. The `CHECK` constraints and the comment length limit are the real
guardrails.

**Accepted risk:** the site is public, so anyone who finds it could pick a name
and post as that person. The audience is four people who live together, and the
remedy is deleting rows from the SQL console. This was a deliberate trade
against making everyone hold an account.

Comments cannot be edited or deleted from the browser by design. To remove one:

```sql
delete from comments where id = '<uuid>';
```

## Verifying the shared features

`script/check.sh` asserts the markup is present but cannot exercise Supabase.
After changing anything under `site/assets/js/` or the Supabase config, run
these five steps by hand:

1. Open the site, pick a name in the header banner, and confirm the toggles
   and comment form become active.
2. On a city page, tap your mark until it reads ★.
3. Open the same page in a different browser (or a private window), pick a
   *different* name, and confirm the first person's ★ is visible.
4. Open `/cities/` and confirm that city shows the same ★ there. This is what
   the `interest_key` schema exists for — the index and the city page are two
   views of one mark.
5. Post a comment, reload, and confirm it survives. Then clear your mark and
   confirm it disappears in both browsers and on the index.
````

- [ ] **Step 2: Update the structure diagram**

In `README.md`, in the `## Structure` block, replace the two stale lines:

```
├── _config.yml       # Site config, family members, Giscus keys
```
```
│   └── app.js        # Mobile nav, smooth scroll, interest toggles
```

with:

```
├── _config.yml       # Site config, family members, Supabase keys
```
```
│   └── *.js          # main, ui, identity, supabase, interests, comments
```

- [ ] **Step 3: Update the "Deliberately not here" section**

Append to that section's list in `README.md`: `comment editing and deletion (SQL console instead), notifications, and threaded replies.`

- [ ] **Step 4: Run the full checks**

Run: `rm -rf site/_site && ./script/check.sh`
Expected: `ALL CHECKS PASSED`

- [ ] **Step 5: Run the manual verification**

If a real Supabase project has been configured, run all five steps from the
README section written in Step 1. If it has not, confirm instead that every
interest row and comment thread shows its placeholder note and the console is
free of errors — and say plainly in the commit that the live path is unverified.

- [ ] **Step 6: Commit**

```bash
git add README.md site/_config.yml
git commit -m "docs: Supabase setup and manual verification script"
```

---

## Self-Review

**Spec coverage.** Identity → Task 2. Visibility (everyone sees everyone) → Task 5. Comments replacing Giscus → Task 6. Data model → Task 1. Client architecture (five modules) → Tasks 2–6. Failure behavior (loading/loaded/failed, revert on failed write, unconfigured path) → Tasks 5 and 6. Verification (static assertions plus the manual script) → every task, and Task 7. Out-of-scope items are documented in Task 7 Step 3 and implemented nowhere.

**Type consistency.** `interest_key` is used in the schema, `supabase.js`, the markup attribute `data-interest-key`, and the assertions. `getInterests()` takes no argument in the interface block, the module, and its caller. `clearInterest` is a distinct function everywhere it appears. `personLabel` is exported in Task 2 and consumed in Tasks 5 and 6.

**Known deviation from the spec.** The spec's module table lists `ui.js` as holding the nav and scroll, with `app.js` as the entry point. The plan instead deletes `app.js` and names the entry point `main.js`, because leaving an `app.js` that no longer contains the app would be misleading, and because `check.sh` asserts against `app.js` by name — a rename forces those assertions to be updated rather than silently passing against a stale file. Task 3 Step 5 handles the stale-artifact risk this creates.
