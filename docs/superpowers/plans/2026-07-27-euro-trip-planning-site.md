# Europe Trip Planning Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Jekyll site at `eu.dpao.la` that helps a family converge on when, where, and how long for a two-week Europe trip over winter break 2028/29.

**Architecture:** A static Jekyll site rooted at `site/`, deployed to GitHub Pages by an Actions workflow, modeled closely on `guarzo/2026_jp_trip`. Two Jekyll collections carry the content: `_cities/` (what a place is like *in winter*, with a draft day sketch) and `_questions/` (open decisions, each on its own page so Giscus comment threads stay separated per decision). Verification is a shell script of assertions against the built `_site/` output, since a static site has no unit-test surface.

**Tech Stack:** Jekyll 4.3, kramdown, `jekyll-seo-tag`, GitHub Pages via `actions/jekyll-build-pages`, hand-written CSS (no framework), vanilla JS, Giscus for comments, `html-proofer` for link checking.

**Spec:** `docs/superpowers/specs/2026-07-27-euro-trip-planning-site-design.md`

## Global Constraints

- Jekyll `~> 4.3`. Dependencies limited to `jekyll`, `jekyll-seo-tag`, `webrick`, and `html-proofer` (dev only). Add nothing else.
- All site files live under `site/`. The Actions workflow uses `source: ./site`.
- Custom domain is `eu.dpao.la`. A `CNAME` file containing exactly `eu.dpao.la` goes at the repo root **and** in `site/` (the Japan repo does both; `site/CNAME` is the one that reaches the artifact).
- **No cost or budget content anywhere on the site.** The user excluded it explicitly.
- **No countdown.** The trip date is undecided; a countdown would display a fabricated number.
- **No `_days/` collection, no `reservations`, `packing`, `emergency`, `pokemon`, `manifest.json`, or `sw.js`.** These serve a booked trip and are out of scope for v1.
- Giscus IDs cannot be known until the GitHub repo exists and Discussions is enabled. Layouts MUST gate the Giscus `<script>` behind `{% if site.giscus.repo_id != "" %}`, reading all four values from `_config.yml`. Never hardcode the Japan repo's IDs.
- Reuse the existing CSS class vocabulary from the Japan repo (`activity-card`, `activity-block`, `activity-time`, `activity-meta`, `alert`, `alert-info`, `alert-title`, `section-heading`, `quick-links`, `quick-link`, `highlight-tag`, `hero`, `container`, `table-wrapper`). Do not invent parallel names for things that already have one.
- Mobile-first. The Japan stylesheet is mobile-first with `min-width` media queries; keep that direction.
- Trip is more than two years out. Weather figures are climate normals and event schedules shift year to year. Every city page carries a directional-content disclaimer (Task 3 defines the exact markup).
- Family members: Papa, Mama, Bubu (18 by the trip), Gaby (17).

## Reference material

The Japan repo is the source for ported chrome. Clone it once for reference:

```bash
git clone --depth 1 https://github.com/guarzo/2026_jp_trip.git /tmp/jp_trip_ref
```

Files worth reading before Task 2: `site/assets/css/style.css`, `site/assets/js/app.js`, `site/_layouts/default.html`, `site/_includes/header.html`, `site/_includes/footer.html`.

---

### Task 1: Jekyll skeleton and the build-check harness

**Files:**
- Create: `script/check.sh`
- Create: `site/Gemfile`
- Create: `site/_config.yml`
- Create: `site/index.md`
- Create: `site/_layouts/default.html`
- Create: `site/_includes/header.html`
- Create: `site/_includes/footer.html`
- Create: `site/assets/css/style.css`
- Create: `.gitignore`
- Create: `CNAME`
- Create: `site/CNAME`
- Create: `.github/workflows/jekyll.yml`

**Interfaces:**
- Consumes: nothing.
- Produces: `script/check.sh` — the assertion harness every later task extends. It defines three shell functions later tasks call: `assert_file <path>`, `assert_contains <path> <literal-string>`, `assert_absent <path> <literal-string>`. It runs `bundle exec jekyll build` from `site/` before asserting, and exits non-zero if any assertion fails. Also produces `site/_config.yml` keys later tasks read: `site.giscus.repo`, `site.giscus.repo_id`, `site.giscus.category`, `site.giscus.category_id`.

- [ ] **Step 1: Write the failing check script**

Create `script/check.sh`:

```bash
#!/usr/bin/env bash
# Build the site and assert the expected output exists.
set -uo pipefail
cd "$(dirname "$0")/.."

FAIL=0
SITE_OUT="site/_site"

assert_file() {
  if [ -f "$1" ]; then
    echo "ok    file $1"
  else
    echo "FAIL  file missing: $1"
    FAIL=1
  fi
}

assert_contains() {
  if grep -qF -- "$2" "$1" 2>/dev/null; then
    echo "ok    $1 contains '$2'"
  else
    echo "FAIL  $1 does not contain '$2'"
    FAIL=1
  fi
}

assert_absent() {
  if grep -qF -- "$2" "$1" 2>/dev/null; then
    echo "FAIL  $1 unexpectedly contains '$2'"
    FAIL=1
  else
    echo "ok    $1 does not contain '$2'"
  fi
}

echo "== building =="
( cd site && bundle exec jekyll build ) || { echo "FAIL  jekyll build failed"; exit 1; }

echo "== asserting =="
assert_file "$SITE_OUT/index.html"
assert_file "$SITE_OUT/assets/css/style.css"
assert_contains "$SITE_OUT/index.html" "Europe Trip Planning"
# No countdown: the trip date is undecided (see Global Constraints).
assert_absent "$SITE_OUT/index.html" "countdown"

echo
if [ "$FAIL" -eq 0 ]; then
  echo "ALL CHECKS PASSED"
else
  echo "CHECKS FAILED"
fi
exit "$FAIL"
```

Make it executable:

```bash
chmod +x script/check.sh
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `./script/check.sh`
Expected: FAIL — `jekyll build failed` (there is no `site/Gemfile` or `site/_config.yml` yet).

- [ ] **Step 3: Create the Gemfile**

Create `site/Gemfile`:

```ruby
source "https://rubygems.org"

gem "jekyll", "~> 4.3"
gem "webrick" # Required for Ruby 3.0+

group :jekyll_plugins do
  gem "jekyll-seo-tag"
end

group :development do
  gem "html-proofer", "~> 5.0"
end
```

- [ ] **Step 4: Create the site config**

Create `site/_config.yml`:

```yaml
title: "Europe Trip Planning"
description: "Where, when, and how long — winter break 2028/29"
baseurl: ""
url: "https://eu.dpao.la"

# Nothing about this trip is decided yet. These are the candidates.
trip_season: "Winter break 2028/29"
trip_length_target: "~2 weeks"

family_members:
  - name: "Papa"
    emoji: "👨"
  - name: "Mama"
    emoji: "👩"
  - name: "Bubu"
    emoji: "👦"
    age: 18
  - name: "Gaby"
    emoji: "👧"
    age: 17

# Giscus. Fill these in AFTER creating the GitHub repo and enabling
# Discussions + the Giscus app. Layouts omit the comment widget entirely
# while repo_id is empty, so the site builds and deploys fine without them.
giscus:
  repo: "guarzo/euro_trip"
  repo_id: ""
  category: "General"
  category_id: ""

markdown: kramdown
highlighter: rouge

plugins:
  - jekyll-seo-tag

exclude:
  - README.md
  - Gemfile
  - Gemfile.lock
  - vendor

collections:
  cities:
    output: true
    permalink: /cities/:name/
  questions:
    output: true
    permalink: /questions/:name/

defaults:
  - scope:
      path: ""
      type: "cities"
    values:
      layout: "city"
  - scope:
      path: ""
      type: "questions"
    values:
      layout: "question"
```

- [ ] **Step 5: Create the default layout**

Create `site/_layouts/default.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#1d6a96">
  <title>{% if page.title %}{{ page.title }} | {% endif %}{{ site.title }}</title>
  <link rel="stylesheet" href="{{ '/assets/css/style.css' | relative_url }}">
  {% seo %}
</head>
<body>
  {% include header.html %}

  <main class="container">
    {{ content }}
  </main>

  {% include footer.html %}

  <script src="{{ '/assets/js/app.js' | relative_url }}"></script>
</body>
</html>
```

- [ ] **Step 6: Create the header and footer includes**

Create `site/_includes/header.html`:

```html
<header class="site-header">
  <div class="header-container">
    <a href="{{ '/' | relative_url }}" class="site-logo">
      <span class="logo-flag">🌍</span>
      <span class="logo-text">Europe Trip</span>
    </a>

    <button class="menu-toggle" aria-label="Toggle menu" aria-expanded="false">
      <span class="menu-icon"></span>
    </button>

    <nav class="site-nav" id="site-nav">
      <a href="{{ '/' | relative_url }}" {% if page.url == '/' %}class="active"{% endif %}>Home</a>
      <a href="{{ '/cities/' | relative_url }}" {% if page.url contains 'cities' %}class="active"{% endif %}>Cities</a>
      <a href="{{ '/questions/' | relative_url }}" {% if page.url contains 'questions' %}class="active"{% endif %}>Questions</a>
      <a href="{{ '/logistics/' | relative_url }}" {% if page.url contains 'logistics' %}class="active"{% endif %}>Logistics</a>
      <a href="{{ '/ruled-out/' | relative_url }}" {% if page.url contains 'ruled-out' %}class="active"{% endif %}>Ruled Out</a>
      <a href="{{ '/feedback/' | relative_url }}" {% if page.url contains 'feedback' %}class="active"{% endif %}>Feedback</a>
    </nav>
  </div>
</header>
```

Create `site/_includes/footer.html`:

```html
<footer class="site-footer">
  <div class="footer-container">
    <p class="footer-trip">Greece &bull; Italy &bull; Spain &bull; France &bull; UK &bull; Netherlands</p>
    <p class="footer-dates">{{ site.trip_season }} &mdash; nothing booked, everything open</p>
    <p class="footer-meta">
      <a href="{{ '/feedback/' | relative_url }}">Give Feedback</a>
    </p>
  </div>
</footer>
```

- [ ] **Step 7: Create a placeholder stylesheet and homepage**

Task 2 ports the real stylesheet. For now create `site/assets/css/style.css` with only the palette, so the build has something to serve:

```css
/* Europe Trip Planning - Mobile-First Styles */

:root {
  /* Colors - Mediterranean palette */
  --color-primary: #1d6a96;      /* Aegean blue */
  --color-primary-dark: #14506f;
  --color-secondary: #c1592f;    /* Terracotta */
  --color-accent: #e0a24a;       /* Olive gold */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  --color-bg: #fafafa;
  --color-surface: #ffffff;
  --color-text: #1f2937;
  --color-text-light: #6b7280;
  --color-border: #e5e7eb;

  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;

  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, monospace;

  --container-max: 800px;
  --header-height: 60px;
}
```

Create `site/index.md`:

```markdown
---
layout: default
title: Home
---

<section class="hero">
  <h1 class="hero-title">Europe Trip Planning</h1>
  <p class="hero-subtitle">Winter break 2028/29 &bull; about two weeks &bull; nothing decided yet</p>
</section>
```

- [ ] **Step 8: Create gitignore, CNAME files, and the deploy workflow**

Create `.gitignore`:

```
_site/
site/_site/
.sass-cache/
.jekyll-cache/
site/.jekyll-cache/
.jekyll-metadata
.bundle/
vendor/
Gemfile.lock
*.swp
*.swo
.DS_Store
```

Create `CNAME` and `site/CNAME`, each containing exactly one line:

```
eu.dpao.la
```

Create `.github/workflows/jekyll.yml`:

```yaml
name: Deploy Jekyll site to Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Build with Jekyll
        uses: actions/jekyll-build-pages@v1
        with:
          source: ./site
          destination: ./_site

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 9: Install dependencies and run the check to verify it passes**

Run:

```bash
cd site && bundle install && cd ..
./script/check.sh
```

Expected: `ALL CHECKS PASSED`.

If `bundle install` fails on a native extension, that is an environment problem, not a plan problem — report it rather than working around it by changing gem versions.

- [ ] **Step 10: Commit**

```bash
git add script .gitignore CNAME site .github
git commit -m "feat: Jekyll skeleton, deploy workflow, and build-check harness"
```

---

### Task 2: Port the site chrome — stylesheet, JS, and homepage

**Files:**
- Modify: `site/assets/css/style.css`
- Create: `site/assets/js/app.js`
- Modify: `site/index.md`
- Modify: `script/check.sh`

**Interfaces:**
- Consumes: `script/check.sh` assertion functions from Task 1; the CSS custom properties defined in Task 1 Step 7.
- Produces: the full CSS class vocabulary later tasks use (`activity-card`, `activity-block`, `activity-time`, `activity-meta`, `alert`, `alert-info`, `alert-title`, `section-heading`, `quick-links`, `quick-link`, `quick-link-icon`, `quick-link-label`, `highlight-tag`, `hero`, `hero-title`, `hero-subtitle`, `table-wrapper`, `day-hero`, `day-header`, `day-highlights`, `day-content`, `day-comments`, `comments-prompt`), plus `site/assets/js/app.js` containing the mobile-nav toggle and smooth-scroll behaviors. Task 8 extends this same JS file with interest toggles.

- [ ] **Step 1: Add the failing assertions**

In `script/check.sh`, insert after the existing `assert_absent "$SITE_OUT/index.html" "countdown"` line:

```bash
assert_file "$SITE_OUT/assets/js/app.js"
assert_contains "$SITE_OUT/assets/css/style.css" ".activity-card"
assert_contains "$SITE_OUT/assets/css/style.css" ".quick-link"
assert_contains "$SITE_OUT/assets/css/style.css" ".site-header"
# The countdown timer was removed along with the service worker (see Global Constraints).
assert_absent "$SITE_OUT/assets/js/app.js" "countdown"
assert_absent "$SITE_OUT/assets/js/app.js" "serviceWorker"
assert_contains "$SITE_OUT/index.html" "Open Questions"
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `./script/check.sh`
Expected: FAIL — `assets/js/app.js` missing, stylesheet lacks `.activity-card`, index lacks "Open Questions".

- [ ] **Step 3: Port the stylesheet**

Copy the Japan stylesheet body into `site/assets/css/style.css`, keeping the Mediterranean `:root` block from Task 1 Step 7 and discarding the Japan `:root` block:

```bash
# Everything after the Japan :root block (its closing brace is on line 33).
tail -n +34 /tmp/jp_trip_ref/site/assets/css/style.css >> site/assets/css/style.css
```

Then edit the appended CSS by hand:

- Delete the `.countdown`, `.countdown-number`, `.countdown-label`, and `.countdown-dates` rules — there is no countdown.
- Delete the `.offline-banner` and `body.offline` rules — there is no service worker.
- Delete the `.japanese-text`, `.conf-number`, `.confirmation-box`, `.reservation-card`, `.reservation-header`, `.reservation-details`, `.reservation-note`, `.status-booked`, `.status-pending`, `.status-urgent`, `.booking-timeline`, `.timeline-item`, `.timeline-date`, `.timeline-action`, `.emergency-card`, and `.emergency-number` rules — those pages are out of scope for v1.
- Update the top-of-file comment to `/* Europe Trip Planning - Mobile-First Styles */`.
- Leave every other rule intact, including `.day-hero`, `.day-header`, `.day-highlights`, `.day-content`, `.day-comments`, and `.comments-prompt` — Task 3's city layout reuses them.

Verify nothing references a deleted variable:

```bash
grep -n "countdown\|offline\|japanese-text\|reservation-\|emergency-" site/assets/css/style.css
```

Expected: no output.

- [ ] **Step 4: Port the JavaScript**

Create `site/assets/js/app.js` with the mobile-nav and smooth-scroll behaviors from the Japan `app.js`, dropping the countdown, checklist, clipboard, offline-detection, and service-worker sections:

```javascript
// Europe Trip Planning - Main JavaScript

(function() {
  'use strict';

  // ============================================
  // Mobile Navigation
  // ============================================
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', function() {
      const isOpen = siteNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', function(e) {
      if (!menuToggle.contains(e.target) && !siteNav.contains(e.target)) {
        siteNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ============================================
  // Smooth scroll for anchor links
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
```

- [ ] **Step 5: Build out the homepage**

Replace `site/index.md` with:

```markdown
---
layout: default
title: Home
---

<section class="hero">
  <h1 class="hero-title">Europe Trip Planning</h1>
  <p class="hero-subtitle">Winter break 2028/29 &bull; about two weeks &bull; nothing decided yet</p>
</section>

<div class="alert alert-info">
  <p class="alert-title">Where we are</p>
  <p>This is a planning site, not an itinerary. No dates, no route, and no bookings exist yet. It has two jobs: show what these cities are actually like <em>in winter</em>, and lay out the decisions we need to make. Browse the cities, then weigh in on the questions.</p>
</div>

<nav class="quick-links">
  <a href="{{ '/cities/' | relative_url }}" class="quick-link">
    <span class="quick-link-icon">🏙️</span>
    <span class="quick-link-label">Cities</span>
  </a>
  <a href="{{ '/questions/' | relative_url }}" class="quick-link">
    <span class="quick-link-icon">❓</span>
    <span class="quick-link-label">Questions</span>
  </a>
  <a href="{{ '/logistics/' | relative_url }}" class="quick-link">
    <span class="quick-link-icon">✈️</span>
    <span class="quick-link-label">Logistics</span>
  </a>
  <a href="{{ '/ruled-out/' | relative_url }}" class="quick-link">
    <span class="quick-link-icon">🚫</span>
    <span class="quick-link-label">Ruled Out</span>
  </a>
</nav>

<h2 class="section-heading">The big one: which arc?</h2>

<p>The southern countries and the northern cities are two coherent trips, not one. Cramming all six countries into two weeks means about a third of the trip in transit. Pick a lane:</p>

<div class="table-wrapper">

| Arc | Cities | The case for it | The catch |
|---|---|---|---|
| **Mediterranean** | Athens · Rome · Barcelona/Madrid | Mild and bright, slower pace, the original idea | Three flights between bases |
| **Northern classics** | London · Paris · Amsterdam | Tightest logistics of any option — all trains, city center to city center | Dark and wet; Amsterdam's sun sets at 4:29 PM in late December |
| **Split arc** | Rome · Barcelona · Paris · London | Covers both moods | The most days in transit; drops Greece |

</div>

<p><a href="{{ '/questions/which-arc/' | relative_url }}">Read the full breakdown and weigh in &rarr;</a></p>

<h2 class="section-heading">Open Questions</h2>

<p>Ten decisions are on the table, from exact dates to whether we take trains or budget flights. Each has its own page with options and a recommendation.</p>

<p><a href="{{ '/questions/' | relative_url }}">See all questions &rarr;</a></p>
```

- [ ] **Step 6: Run the check to verify it passes**

Run: `./script/check.sh`
Expected: `ALL CHECKS PASSED`.

The check will still pass even though `/cities/`, `/questions/`, `/logistics/`, and `/ruled-out/` do not exist yet — dead-link checking arrives in Task 9. That is intentional; those pages land in Tasks 4, 6, and 7.

- [ ] **Step 7: Commit**

```bash
git add site script
git commit -m "feat: port site chrome — stylesheet, JS, and homepage"
```

---

### Task 3: Cities collection, city layout, and Athens as the pattern

**Files:**
- Create: `site/_layouts/city.html`
- Create: `site/_includes/giscus.html`
- Create: `site/_includes/winter-disclaimer.html`
- Create: `site/_cities/athens.md`
- Modify: `script/check.sh`

**Interfaces:**
- Consumes: `default.html` chrome and CSS classes from Task 2; the `site.giscus.*` config keys from Task 1.
- Produces:
  - `site/_includes/giscus.html` — renders the Giscus widget only when `site.giscus.repo_id` is non-empty. Included by both `city.html` and (Task 5) `question.html`.
  - `site/_includes/winter-disclaimer.html` — the directional-content note required by Global Constraints.
  - `site/_layouts/city.html` — consumes front matter keys `city` (string), `country` (string), `winter_viability` (one of `good`, `mixed`, `closed`), `suggested_nights` (integer), `hero_image` (URL string), `hero_alt` (string), `highlights` (list of strings). Every city page in Task 4 uses exactly these keys.

- [ ] **Step 1: Add the failing assertions**

Append to the assertion block in `script/check.sh`:

```bash
assert_file "$SITE_OUT/cities/athens/index.html"
assert_contains "$SITE_OUT/cities/athens/index.html" "In winter"
assert_contains "$SITE_OUT/cities/athens/index.html" "Draft day sketch"
assert_contains "$SITE_OUT/cities/athens/index.html" "Getting here"
assert_contains "$SITE_OUT/cities/athens/index.html" "climate normals"
# Giscus stays out of the markup until the real repo IDs are filled in.
assert_absent "$SITE_OUT/cities/athens/index.html" "giscus.app/client.js"
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `./script/check.sh`
Expected: FAIL — `site/_site/cities/athens/index.html` missing.

- [ ] **Step 3: Create the Giscus and disclaimer includes**

Create `site/_includes/giscus.html`:

```html
{% if site.giscus.repo_id != "" %}
<section class="day-comments">
  <h2>Family Notes</h2>
  <p class="comments-prompt">Reactions, objections, and "please no" all welcome.</p>
  <div class="giscus"></div>
</section>
<script src="https://giscus.app/client.js"
  data-repo="{{ site.giscus.repo }}"
  data-repo-id="{{ site.giscus.repo_id }}"
  data-category="{{ site.giscus.category }}"
  data-category-id="{{ site.giscus.category_id }}"
  data-mapping="pathname"
  data-strict="0"
  data-reactions-enabled="1"
  data-emit-metadata="0"
  data-input-position="top"
  data-theme="light"
  data-lang="en"
  crossorigin="anonymous"
  async>
</script>
{% else %}
<section class="day-comments">
  <h2>Family Notes</h2>
  <p class="comments-prompt">Comments turn on once the GitHub repo has Discussions enabled.</p>
</section>
{% endif %}
```

Create `site/_includes/winter-disclaimer.html`:

```html
<div class="alert alert-info">
  <p class="alert-title">Directional, not gospel</p>
  <p>The trip is more than two years out. Temperatures are climate normals, and opening hours, festivals, and events shift year to year. Treat all of it as "roughly what to expect," and re-check everything once dates are set.</p>
</div>
```

- [ ] **Step 4: Create the city layout**

Create `site/_layouts/city.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#1d6a96">
  <title>{{ page.city }}, {{ page.country }} | {{ site.title }}</title>
  <link rel="stylesheet" href="{{ '/assets/css/style.css' | relative_url }}">
  {% seo %}
</head>
<body>
  {% include header.html %}

  <main class="container day-page">
    <nav class="day-nav">
      <a href="{{ '/cities/' | relative_url }}" class="day-nav-link prev">&larr; All cities</a>
      <span class="day-nav-current">
        <strong>{{ page.country }}</strong>
        <small>suggest {{ page.suggested_nights }} nights</small>
      </span>
      <span class="day-nav-link next disabled"></span>
    </nav>

    <header class="day-header">
      <h1>{{ page.city }}</h1>
      <p class="day-location">
        {% if page.winter_viability == 'good' %}☀️ Good in winter
        {% elsif page.winter_viability == 'mixed' %}🌧️ Mixed in winter
        {% else %}❄️ Largely closed in winter{% endif %}
      </p>
      {% if page.highlights %}
      <div class="day-highlights">
        {% for highlight in page.highlights %}
        <span class="highlight-tag">{{ highlight }}</span>
        {% endfor %}
      </div>
      {% endif %}
    </header>

    <img src="{{ page.hero_image }}" alt="{{ page.hero_alt }}" class="day-hero">

    <article class="day-content">
      {{ content }}
    </article>

    {% include winter-disclaimer.html %}

    {% include giscus.html %}
  </main>

  {% include footer.html %}

  <script src="{{ '/assets/js/app.js' | relative_url }}"></script>
</body>
</html>
```

- [ ] **Step 5: Write the Athens city page**

Create `site/_cities/athens.md`. **This is the exemplar** — Task 4 copies its section structure exactly.

```markdown
---
city: Athens
country: Greece
winter_viability: good
suggested_nights: 3
hero_image: https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Attica_06-13_Athens_50_View_from_Philopappos_-_Acropolis_Hill.jpg/1280px-Attica_06-13_Athens_50_View_from_Philopappos_-_Acropolis_Hill.jpg
hero_alt: The Acropolis seen from Philopappos Hill
highlights:
  - Acropolis
  - Cheapest winter entry
  - Great food city
  - Gateway to Greece
---

## In winter

Athens is the one Greek destination that genuinely works in December and January. Daytime highs sit around 13&nbsp;°C (55&nbsp;°F) — jacket weather, not parka weather — and the sun sets around 5:20&nbsp;PM, an hour and a half later than in Amsterdam.

Two things get *better* in winter. The Acropolis in July is a slow shuffle in punishing heat; in January you can walk up and actually look at it. And entry to the state archaeological sites drops to a reduced winter rate from 1 November through 31 March.

The tradeoff is rain — January is one of the wetter months — and shorter site hours, typically closing around 5&nbsp;PM instead of 8&nbsp;PM. Plan ruins for the morning and neighborhoods for the afternoon.

What does *not* work: the islands. Santorini, Mykonos, and most of the Cyclades largely shut down, with thin ferry schedules and closed hotels. Athens in winter is a city trip, not an island trip.

## Why go

It is the only place on the list where you walk past a 2,500-year-old temple on the way to dinner. The Acropolis Museum is genuinely world-class and, being indoors, is rain insurance. The food is casual, cheap, and excellent — an easy sell for teenagers who have hit their museum limit.

The honest counterpoint: Athens is also the geographic outlier. Every other candidate city is a short hop from another candidate city. Athens is a two-hour flight from Rome and further from everything else. See [Which arc?]({{ '/questions/which-arc/' | relative_url }}).

## Draft day sketch

<div class="activity-block">
<div class="activity-time">🌅 Day 1 — The classics</div>

<div class="activity-card">
<h3>Acropolis, early</h3>
<p>Go at opening. Even in winter the site fills up by late morning, and the light on the Parthenon is best early. Allow two hours including the Theatre of Dionysus on the south slope.</p>
<div class="activity-meta">
<a href="https://maps.google.com/?q=Acropolis+Athens">📍 Get Directions</a>
<span>⏱️ 2 hours</span>
</div>
</div>

<div class="activity-card">
<h3>Acropolis Museum</h3>
<p>Directly below the site. The top floor reassembles the Parthenon frieze at full scale, aligned with the real thing through the windows. Go <em>after</em> the site, not before — it makes more sense in that order.</p>
<div class="activity-meta">
<span>⏱️ 1.5 hours</span>
</div>
</div>

<div class="activity-card">
<h3>Plaka and Anafiotika</h3>
<p>The old town under the Acropolis, and above it a tiny whitewashed quarter built by island craftsmen that looks like it was airlifted in from the Cyclades. Pleasant aimless wandering; good rainy-afternoon fallback.</p>
</div>

</div>

<div class="activity-block">
<div class="activity-time">🏛️ Day 2 — Museums and neighborhoods</div>

<div class="activity-card">
<h3>National Archaeological Museum</h3>
<p>The deepest collection of Greek antiquities anywhere. Big — pick a couple of wings rather than attempting all of it.</p>
<div class="activity-meta">
<span>⏱️ 2 hours</span>
</div>
</div>

<div class="activity-card">
<h3>Central Market and Psyrri</h3>
<p>The Varvakios meat and fish market is loud, pungent, and completely unstaged. Psyrri next door has become the city's bar and street-food quarter.</p>
</div>

<div class="activity-card">
<h3>Sunset from Lycabettus Hill</h3>
<p>The highest point in the city, reached by funicular. In winter, sunset lands around 5:20&nbsp;PM, so this works as an early-evening stop rather than a late one.</p>
</div>

</div>

## Eat

- **Souvlaki** — the default cheap meal, and Athens does it better than anywhere.
- **Bougatsa** — semolina custard in filo, dusted with cinnamon and sugar. Breakfast.
- **Meze at a mezedopoleio** — many small plates over a long time. The most enjoyable way to eat here.
- **Loukoumades** — honey-soaked fried dough. A reliable teenager pleaser.

## Getting here / onward

Athens International (ATH) is the arrival point, with direct flights from the US East Coast in summer but mostly one-stop connections in winter — likely via a European hub. The metro runs from the airport to Syntagma in about 40 minutes.

Onward, everything is a flight: roughly 2 hours to Rome, 3 hours to Barcelona, 3.5 hours to Paris or London. There is no practical rail connection to the rest of Europe.
```

- [ ] **Step 6: Run the check to verify it passes**

Run: `./script/check.sh`
Expected: `ALL CHECKS PASSED`.

- [ ] **Step 7: Commit**

```bash
git add site script
git commit -m "feat: cities collection, city layout, and Athens page"
```

---

### Task 4: Remaining ten city pages and the cities index

**Files:**
- Create: `site/_cities/rome.md`, `florence.md`, `naples.md`, `barcelona.md`, `madrid.md`, `seville.md`, `granada.md`, `paris.md`, `london.md`, `amsterdam.md`
- Create: `site/cities.md`
- Modify: `script/check.sh`

**Interfaces:**
- Consumes: the `city.html` layout and its front matter contract from Task 3; the Athens page as the structural exemplar.
- Produces: `site/cities.md` at `/cities/`, grouping all eleven city pages by country. Task 8 adds interest toggles to the list items on this page.

Every city page uses the identical section order established by Athens: `## In winter`, `## Why go`, `## Draft day sketch`, `## Eat`, `## Getting here / onward`. The `In winter` section must open with the January daytime high and, for the northern cities, the late-December sunset time — those are the numbers the arc decision turns on.

- [ ] **Step 1: Add the failing assertions**

Append to `script/check.sh`:

```bash
for CITY in rome florence naples barcelona madrid seville granada paris london amsterdam; do
  assert_file "$SITE_OUT/cities/$CITY/index.html"
  assert_contains "$SITE_OUT/cities/$CITY/index.html" "In winter"
  assert_contains "$SITE_OUT/cities/$CITY/index.html" "Draft day sketch"
done
assert_file "$SITE_OUT/cities/index.html"
assert_contains "$SITE_OUT/cities/index.html" "/cities/athens/"
assert_contains "$SITE_OUT/cities/index.html" "/cities/amsterdam/"
assert_contains "$SITE_OUT/cities/index.html" "/cities/granada/"
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `./script/check.sh`
Expected: FAIL — ten missing city files plus the missing index.

- [ ] **Step 3: Write the seven southern city pages**

Follow the Athens structure exactly. Use these front matter values and anchor facts; write the surrounding prose in the same voice as Athens — specific, willing to name downsides, no marketing copy.

**`rome.md`** — `country: Italy`, `winter_viability: good`, `suggested_nights: 4`, highlights: `Colosseum`, `Vatican`, `Winter crowds are thin`, `Christmas in Rome`.
Anchor facts: January highs around 12&nbsp;°C (54&nbsp;°F), sunset about 4:40&nbsp;PM in late December. Everything major stays open year-round; winter is the low season for the Colosseum and Vatican Museums, which is a substantial advantage over summer queues. Piazza Navona hosts a Christmas market through early January. Rain is common; the Pantheon, Borghese, and Capitoline are the indoor fallbacks. Day sketch: Colosseum/Forum/Palatine on one day, Vatican and St. Peter's on another, Trastevere and the Pantheon for wandering. Eat: cacio e pepe, carbonara, supplì, pizza al taglio, gelato. Onward: high-speed rail to Florence in about 1.5 hours, Naples about 1.2 hours; flights to Barcelona or Paris about 2 hours.

**`florence.md`** — `country: Italy`, `winter_viability: good`, `suggested_nights: 2`, highlights: `Uffizi without the line`, `Duomo`, `Compact and walkable`, `Day trip from Rome`.
Anchor facts: January highs around 10&nbsp;°C (50&nbsp;°F), damp and grey. The genuine winter argument is the Uffizi and Accademia in January versus the same rooms in July — a different experience entirely. The city is small enough to cross on foot in 30 minutes. Note honestly that two days is enough, and that Florence is the most skippable Italian city if the trip is tight. Day sketch: Duomo complex and climb, Uffizi, Ponte Vecchio and Oltrarno, Accademia. Eat: bistecca alla fiorentina, lampredotto, schiacciata. Onward: rail to Rome 1.5 hours, Venice about 2 hours, Milan about 2 hours.

**`naples.md`** — `country: Italy`, `winter_viability: good`, `suggested_nights: 2`, highlights: `Pizza`, `Pompeii day trip`, `Nativity artisan street`, `Rough and alive`.
Anchor facts: January highs around 13&nbsp;°C (55&nbsp;°F), the mildest city in Italy on this list. Via San Gregorio Armeno is a narrow street of workshops making nativity figures year-round, and it peaks in December — a genuinely distinctive winter draw. Pompeii is open year-round and is far more bearable in cool weather than in August heat. Be honest that Naples is chaotic, grubby in places, and not everyone's taste. The Amalfi Coast is a summer proposition and is ruled out. Day sketch: Pompeii day trip by Circumvesuviana train, Naples Archaeological Museum for the mosaics actually taken from Pompeii, Spaccanapoli and San Gregorio Armeno. Eat: pizza margherita at its origin, sfogliatella, fried pizza, espresso. Onward: rail to Rome about 1.2 hours.

**`barcelona.md`** — `country: Spain`, `winter_viability: good`, `suggested_nights: 3`, highlights: `Sagrada Família`, `Gaudí everywhere`, `Mild winter`, `Three Kings parade`.
Anchor facts: January highs around 15&nbsp;°C (59&nbsp;°F) — among the mildest on the list. The Fira de Santa Llúcia Christmas market runs outside the cathedral in December. The Cavalcada dels Reis (Three Kings parade) on 5 January is a major public spectacle and worth knowing about when picking dates. Sagrada Família needs timed tickets booked ahead even in winter. Beaches are for walking, not swimming. Day sketch: Sagrada Família, Park Güell, Gothic Quarter, Montjuïc, La Boqueria. Eat: pintxos, jamón, patatas bravas, crema catalana, churros con chocolate. Onward: high-speed rail to Madrid about 2.5 hours; flights to Rome or Paris about 2 hours; direct trains to southern France.

**`madrid.md`** — `country: Spain`, `winter_viability: good`, `suggested_nights: 3`, highlights: `Prado`, `Plaza Mayor market`, `New Year's at Sol`, `Cold but dry`.
Anchor facts: January highs around 11&nbsp;°C (52&nbsp;°F) — colder than coastal Spain, but dry and often sunny, since Madrid sits at about 650 m on the plateau. The Plaza Mayor Christmas market runs through early January. New Year's Eve at Puerta del Sol, where the country eats twelve grapes at midnight, is one of the more distinctive holiday experiences on the list — relevant to the "where for New Year's" question. The Prado, Reina Sofía, and Thyssen sit within a few blocks of each other. Day sketch: Prado, Retiro Park, Plaza Mayor and La Latina, Reina Sofía for *Guernica*, Royal Palace. Eat: cocido madrileño, bocadillo de calamares, churros at San Ginés, tapas in La Latina. Onward: rail to Seville about 2.5 hours, Barcelona about 2.5 hours, Granada about 3.5 hours.

**`seville.md`** — `country: Spain`, `winter_viability: good`, `suggested_nights: 2`, highlights: `Warmest on the list`, `Real Alcázar`, `Flamenco`, `Orange trees in fruit`.
Anchor facts: January highs around 16&nbsp;°C (61&nbsp;°F) and sunset near 6:00&nbsp;PM — the warmest and brightest option anywhere in this plan, roughly two hours more usable daylight per day than Amsterdam. The Real Alcázar and the Cathedral with the Giralda are the anchors; the Alcázar requires timed tickets. Winter is low season, meaning the Alcázar is walkable rather than shuffling. The bitter orange trees lining the streets are in fruit in winter. Day sketch: Real Alcázar, Cathedral and Giralda climb, Barrio Santa Cruz, Plaza de España, an evening flamenco tablao. Eat: jamón ibérico, salmorejo, espinacas con garbanzos, sherry. Onward: rail to Madrid about 2.5 hours, Granada about 2.5 hours by bus or train.

**`granada.md`** — `country: Spain`, `winter_viability: good`, `suggested_nights: 2`, highlights: `Alhambra`, `Snow-capped Sierra Nevada`, `Free tapas`, `Skiing 45 min away`.
Anchor facts: January highs around 12&nbsp;°C (54&nbsp;°F) in the city, with the Sierra Nevada visibly snow-covered behind it — the Alhambra against snowy peaks is specifically a winter image. Alhambra tickets sell out and must be booked well in advance regardless of season; entry is timed. Granada is one of the last Spanish cities where a free tapa still comes with each drink, which teenagers find delightful. The Sierra Nevada ski resort is roughly 45 minutes from the city — a real option if anyone wants a ski day, and worth raising as a possible draw for the kids. Day sketch: Alhambra and Generalife (half a day minimum), Albaicín and the Mirador de San Nicolás at sunset, Sacromonte caves, cathedral and Royal Chapel. Eat: free tapas crawl, piononos, Moorish tea houses on Calle Calderería. Onward: rail to Madrid about 3.5 hours, Seville about 2.5 hours; small airport with domestic connections.

- [ ] **Step 4: Write the three northern city pages**

These carry the sunset numbers that make the arc decision concrete. State the darkness plainly; do not soften it.

**`paris.md`** — `country: France`, `winter_viability: good`, `suggested_nights: 3`, highlights: `Louvre`, `Christmas markets`, `2h20 to London`, `Dark by 5 PM`.
Anchor facts: January highs around 7&nbsp;°C (45&nbsp;°F), sunset about 4:55&nbsp;PM in late December. Grey and often wet, and the museums are the point in that weather. The Louvre, Orsay, and Orangerie are all winter-proof. Christmas markets run at the Tuileries and elsewhere through early January. Winter is genuinely low season for queues at the Eiffel Tower and Louvre. Day sketch: Louvre, Île de la Cité and Sainte-Chapelle, Musée d'Orsay, Montmartre and Sacré-Cœur, Eiffel Tower after dark, since dark arrives early anyway. Eat: croissants, steak frites, crêpes, falafel in the Marais, hot chocolate at a salon de thé. Onward: Eurostar to London 2h20 and Thalys/Eurostar to Amsterdam about 3h20, both city center to city center; rail to Barcelona about 6.5 hours; flights to Rome about 2 hours.

**`london.md`** — `country: UK`, `winter_viability: good`, `suggested_nights: 4`, highlights: `Free major museums`, `West End theatre`, `No language barrier`, `Darkest of the lot`.
Anchor facts: January highs around 8&nbsp;°C (47&nbsp;°F), and sunset about 3:53&nbsp;PM around the solstice — the earliest darkness of any city here, and the single strongest argument against the northern arc. The compensations are real: the British Museum, National Gallery, Tate Modern, Natural History Museum, and V&A all have free general admission, which makes rainy days cheap and flexible. West End theatre is a strong draw for 17- and 18-year-olds. Hyde Park's Winter Wonderland typically runs from late November into early January. Note that the UK is outside the Schengen area, so it is a separate border crossing. Day sketch: British Museum, Westminster and the South Bank walk, Tower of London, Camden and Borough markets, a West End show. Eat: Sunday roast, Indian food (genuinely a London specialty), Borough Market stalls, full English breakfast. Onward: Eurostar to Paris 2h20 or Amsterdam about 4 hours; flights to anywhere.

**`amsterdam.md`** — `country: Netherlands`, `winter_viability: mixed`, `suggested_nights: 3`, highlights: `Light Festival`, `Rijksmuseum`, `Very walkable`, `Cold, dark, wet`.
Anchor facts: January highs around 6&nbsp;°C (43&nbsp;°F) — the coldest on the list — with sunset about 4:29&nbsp;PM in late December, frequent rain, and genuine wind off the water. This is why it carries `winter_viability: mixed` rather than `good`. The counterweight is the Amsterdam Light Festival, which runs roughly late November to mid-January with illuminated artworks along the canals, viewed by boat or on foot. It is a rare case of an event that works *because* it is dark early. The Rijksmuseum and Van Gogh Museum are first-rate; the Anne Frank House requires timed tickets released on a schedule and sells out fast. Day sketch: Rijksmuseum, Van Gogh Museum, Anne Frank House with pre-booked tickets, a Light Festival canal cruise, Jordaan wandering. Eat: stroopwafels, bitterballen, herring for the brave, Indonesian rijsttafel, apple pie. Onward: trains to Paris about 3h20 and Brussels about 2 hours; Schiphol is a major hub with direct US flights.

- [ ] **Step 5: Create the cities index**

Create `site/cities.md`:

```markdown
---
layout: default
title: Cities
permalink: /cities/
---

<section class="hero">
  <h1 class="hero-title">Candidate Cities</h1>
  <p class="hero-subtitle">Eleven cities, six countries — all of them viable in winter</p>
</section>

<div class="alert alert-info">
  <p class="alert-title">These are candidates, not a route</p>
  <p>No trip visits all eleven. Two weeks realistically covers three or four bases. Read what appeals, and see <a href="{{ '/questions/which-arc/' | relative_url }}">Which arc?</a> for how they group into actual trips. Places that <em>don't</em> work in winter are on <a href="{{ '/ruled-out/' | relative_url }}">Ruled Out</a>, with reasons.</p>
</div>

{% assign countries = site.cities | group_by: "country" | sort: "name" %}
{% for group in countries %}
<h2 class="section-heading">{{ group.name }}</h2>

<div class="itinerary-list">
{% assign sorted_cities = group.items | sort: "city" %}
{% for city in sorted_cities %}
  <a href="{{ city.url | relative_url }}" class="itinerary-item">
    <span class="itinerary-location">{{ city.city }}</span>
    <span class="itinerary-day-date">
      {% if city.winter_viability == 'good' %}☀️ Good in winter
      {% elsif city.winter_viability == 'mixed' %}🌧️ Mixed in winter
      {% else %}❄️ Largely closed{% endif %}
      &bull; suggest {{ city.suggested_nights }} nights
    </span>
  </a>
{% endfor %}
</div>
{% endfor %}
```

- [ ] **Step 6: Run the check to verify it passes**

Run: `./script/check.sh`
Expected: `ALL CHECKS PASSED`.

- [ ] **Step 7: Commit**

```bash
git add site script
git commit -m "feat: ten more city pages and the cities index"
```

---

### Task 5: Questions collection, question layout, and the "Which arc?" question

**Files:**
- Create: `site/_layouts/question.html`
- Create: `site/_questions/which-arc.md`
- Modify: `script/check.sh`

**Interfaces:**
- Consumes: `giscus.html` from Task 3; the chrome and CSS from Task 2.
- Produces: `site/_layouts/question.html` — consumes front matter keys `question` (string, the one-line phrasing), `status` (one of `open`, `decided`), `impact` (one of `high`, `medium`), and `order` (integer, controls sort on the index). Every question page in Task 6 uses exactly these keys.

- [ ] **Step 1: Add the failing assertions**

Append to `script/check.sh`:

```bash
assert_file "$SITE_OUT/questions/which-arc/index.html"
assert_contains "$SITE_OUT/questions/which-arc/index.html" "Which arc"
assert_contains "$SITE_OUT/questions/which-arc/index.html" "Why it matters"
assert_contains "$SITE_OUT/questions/which-arc/index.html" "My recommendation"
assert_contains "$SITE_OUT/questions/which-arc/index.html" "4:29"
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `./script/check.sh`
Expected: FAIL — `site/_site/questions/which-arc/index.html` missing.

- [ ] **Step 3: Create the question layout**

Create `site/_layouts/question.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#1d6a96">
  <title>{{ page.question }} | {{ site.title }}</title>
  <link rel="stylesheet" href="{{ '/assets/css/style.css' | relative_url }}">
  {% seo %}
</head>
<body>
  {% include header.html %}

  <main class="container day-page">
    <nav class="day-nav">
      <a href="{{ '/questions/' | relative_url }}" class="day-nav-link prev">&larr; All questions</a>
      <span class="day-nav-current">
        <strong>{% if page.status == 'decided' %}Decided{% else %}Open{% endif %}</strong>
        <small>{{ page.impact }} impact</small>
      </span>
      <span class="day-nav-link next disabled"></span>
    </nav>

    <header class="day-header">
      <h1>{{ page.question }}</h1>
      <div class="day-highlights">
        <span class="highlight-tag">{% if page.status == 'decided' %}✅ Decided{% else %}🟡 Open{% endif %}</span>
        <span class="highlight-tag">{{ page.impact }} impact</span>
      </div>
    </header>

    <article class="day-content">
      {{ content }}
    </article>

    {% include giscus.html %}
  </main>

  {% include footer.html %}

  <script src="{{ '/assets/js/app.js' | relative_url }}"></script>
</body>
</html>
```

- [ ] **Step 4: Write the "Which arc?" question**

Create `site/_questions/which-arc.md`. **This is the exemplar** — Task 6 copies its section structure: `## Why it matters`, `## The options`, `## My recommendation`, `## What would change my mind`.

```markdown
---
question: Which arc — Mediterranean, Northern, or Split?
status: open
impact: high
order: 1
---

## Why it matters

Every other decision hangs off this one. Dates, flights, how we get between cities, and which city pages are even relevant all follow from it.

The original idea was Greece, Italy, and Spain. Adding Paris, London, and Amsterdam to the candidate list surfaced a real problem: those are two different trips. The southern countries are a wide arc connected mostly by flights. The northern cities are a tight cluster connected by fast trains. Merging all six countries into two weeks means roughly five intercity legs and about a third of the trip in transit.

Two weeks realistically supports three or four bases. So we pick a lane.

## The options

### 1. Mediterranean — Athens · Rome · Barcelona or Madrid

The original plan. Mild and bright: January highs of 12–16&nbsp;°C (54–61&nbsp;°F), and in Seville the sun is up until about 6:00&nbsp;PM. Ancient sites and museums are at their least crowded all year.

The cost is transit. There is no useful rail between Greece, Italy, and Spain, so each move is a flight with airport time on both ends. Athens is the outlier — two hours from Rome, further from everything else.

Also worth saying plainly: **the Greek islands are out either way.** Santorini and the Cyclades largely shut down in winter. Greece here means Athens, a city trip.

### 2. Northern classics — London · Paris · Amsterdam

By far the tightest logistics on offer. London to Paris is 2h20 by Eurostar and Paris to Amsterdam about 3h20, both city center to city center with no airports involved. Three countries, two train rides, zero transfer stress.

It is also the strongest option for Bubu and Gaby. West End theatre, Camden, the Louvre, the Amsterdam Light Festival, no language barrier in London — these land better at 17 and 18 than a fourth archaeological site.

The catch is darkness and weather. Late-December sunsets: London **3:53&nbsp;PM**, Amsterdam **4:29&nbsp;PM**, Paris 4:55&nbsp;PM. Highs of 6–8&nbsp;°C (43–47&nbsp;°F), frequent rain. You are touring in the dark and the wet for a meaningful part of each day. Christmas markets and the Light Festival partly turn that into a feature, but only partly.

### 3. Split arc — e.g. Rome · Barcelona · Paris · London

Covers both moods: Mediterranean light at the start, northern cities at the end, finishing with an easy English-speaking base and a straightforward flight home. Rome to Barcelona is a 2-hour flight, Barcelona to Paris a 2-hour flight or 6.5-hour train, Paris to London 2h20 by train.

It drops Greece — the geographic outlier — and spends the most days moving. Four bases in fourteen days is a brisk pace with a lot of packing.

## My recommendation

**Option 3, the split arc**, if the group can tolerate the pace. It gets the Mediterranean daylight that makes the first week pleasant *and* the northern cities that the kids will actually remember, and it ends somewhere with a lot of direct flights home.

If the group would rather move less, **option 1 without Athens** — Rome, Barcelona, Seville — is the most relaxed and the sunniest version of this trip.

I would not choose option 2 as a first Europe trip for this family. London and Paris are wonderful and you should absolutely go, but a fourteen-day trip where it is dark by 4&nbsp;PM every day is a hard sell against the alternative.

## What would change my mind

- **If we go over Christmas and New Year's specifically** — the northern arc gets stronger. Christmas markets and the Light Festival are genuinely better than anything the south offers in that window.
- **If Bubu and Gaby say the northern cities are the whole point** — that settles it. See [What do the kids want?]({{ '/questions/what-kids-want/' | relative_url }}).
- **If we would rather do three nights in four places than five nights in three** — pace tolerance is the real constraint here, and I am guessing at it.
```

- [ ] **Step 5: Run the check to verify it passes**

Run: `./script/check.sh`
Expected: `ALL CHECKS PASSED`.

- [ ] **Step 6: Commit**

```bash
git add site script
git commit -m "feat: questions collection, question layout, and the arc question"
```

---

### Task 6: The nine remaining questions and the questions index

**Files:**
- Create: `site/_questions/exact-dates.md`, `how-many-countries.md`, `open-jaw-flights.md`, `trains-vs-flights.md`, `pace.md`, `christmas-and-new-years.md`, `what-kids-want.md`, `hotels-vs-apartments.md`, `etias-and-passports.md`
- Create: `site/questions.md`
- Modify: `script/check.sh`

**Interfaces:**
- Consumes: the `question.html` layout and its front matter contract from Task 5; `which-arc.md` as the structural exemplar.
- Produces: `site/questions.md` at `/questions/`, listing all ten questions sorted by `order`, split into open and decided.

Every question page uses the same section order as `which-arc.md`: `## Why it matters`, `## The options`, `## My recommendation`, `## What would change my mind`. All ten are seeded with `status: open`.

- [ ] **Step 1: Add the failing assertions**

Append to `script/check.sh`:

```bash
for Q in exact-dates how-many-countries open-jaw-flights trains-vs-flights pace \
         christmas-and-new-years what-kids-want hotels-vs-apartments etias-and-passports; do
  assert_file "$SITE_OUT/questions/$Q/index.html"
  assert_contains "$SITE_OUT/questions/$Q/index.html" "Why it matters"
  assert_contains "$SITE_OUT/questions/$Q/index.html" "My recommendation"
done
assert_file "$SITE_OUT/questions/index.html"
assert_contains "$SITE_OUT/questions/index.html" "/questions/which-arc/"
assert_contains "$SITE_OUT/questions/index.html" "/questions/etias-and-passports/"
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `./script/check.sh`
Expected: FAIL — nine missing question files plus the missing index.

- [ ] **Step 3: Write the nine question pages**

Front matter and substance for each. Write the prose in the same voice as `which-arc.md`: name the tradeoff, give a recommendation, say what would change it.

**`exact-dates.md`** — `order: 2`, `impact: high`, question: `When exactly over winter break?`
Options: (a) the Christmas window, roughly 20 December to 3 January — markets, festive atmosphere, but peak prices, peak crowds, and closures on 25 December and 1 January; (b) early January after the 6th — Three Kings in Spain wraps up, crowds collapse, prices drop, but the festive layer is gone and it is the coldest stretch; (c) split the difference, arriving around 27 December through mid-January. Recommend (c): it catches New Year's, misses the worst of the Christmas price peak, and the back half is genuinely quiet. Flag that school calendars for 2028/29 are not published yet, so this is provisional. Changed by: whether being somewhere specific for Christmas matters more than crowds.

**`how-many-countries.md`** — `order: 3`, `impact: high`, question: `Three countries or two?`
Options: three countries in fourteen days means roughly four nights each and two travel days lost; two countries means five to seven nights each and time to have a normal day somewhere. Recommend two countries, three or four bases. Note this is the same tradeoff as [Pace]({{ '/questions/pace/' | relative_url }}) viewed from a different angle, and that the number of *countries* matters less than the number of *bases*. Changed by: whether the goal is breadth on a first trip or depth.

**`open-jaw-flights.md`** — `order: 4`, `impact: medium`, question: `Open-jaw or round-trip flights?`
Explain open-jaw plainly: fly into one city and home from another, so no backtracking. Options: round-trip is usually simpler to book and sometimes cheaper, but costs a full travel day returning to the start; open-jaw fits a linear arc naturally and is well supported by airlines as a multi-city booking. Recommend open-jaw for any of the three arcs, since all of them are linear — e.g. into Rome, home from London. Changed by: award-travel constraints, or a large fare gap on the specific dates.

**`trains-vs-flights.md`** — `order: 5`, `impact: medium`, question: `Trains or budget flights between cities?`
The core fact: trains win where the rail is fast and the cities are close, flights win where they are not. Concretely — London–Paris 2h20, Paris–Amsterdam 3h20, Rome–Florence about 1.5 hours, Rome–Naples about 1.2 hours, Madrid–Barcelona about 2.5 hours, Madrid–Seville about 2.5 hours are all clearly trains, city center to city center with no security theater. Athens to anywhere, and Italy to Spain, are flights — there is no practical rail. Recommend trains wherever the route offers them, flights only for the sea crossings. Note that budget carriers have strict bag rules that get expensive with four people and two weeks of luggage. Changed by: nothing much — this one mostly follows from the arc.

**`pace.md`** — `order: 6`, `impact: high`, question: `Three bases or six stops?`
Options: three bases at four to five nights each means unpacking three times and having real days; five or six stops means seeing more and spending roughly a third of the trip in transit and hotel lobbies. Note the hidden cost — a travel day is not half a day, it is most of a day once checkout, transit, and check-in are counted. Recommend three bases, four nights minimum each, with day trips doing the work of extra stops: Pompeii from Naples, Florence from Rome, Seville or Granada from each other. Changed by: whether the group would rather have seen more places or enjoyed them more.

**`christmas-and-new-years.md`** — `order: 7`, `impact: medium`, question: `Where do we want to be for Christmas and New Year's?`
Options with specifics: Rome for Christmas, with the Vatican at the center of it; Madrid for New Year's Eve, with twelve grapes at midnight in Puerta del Sol; Paris or Amsterdam for markets and the Light Festival; or deliberately somewhere quiet, since many restaurants and museums close on 25 December and 1 January regardless of city. Recommend picking one holiday to plan around rather than both, and note the practical warning that 25 December and 1 January are low-function days everywhere — do not schedule anything that needs to be open. Changed by: whether the family wants a holiday *experience* or just to be somewhere pleasant.

**`what-kids-want.md`** — `order: 8`, `impact: high`, question: `Are Bubu and Gaby both coming, and what do they want out of it?`
This one has no options list — it is a question *for them*, and the page should say so. By winter 2028/29 Bubu is 18 and Gaby is 17, which means college schedules, jobs, and their own opinions are all live variables. Prompt them concretely: is there a city on the list you would be disappointed to miss? Would you rather have four days in one place or two days in two places? Museums, food, nightlife, outdoors, shopping — rank them. Is a ski day in the Sierra Nevada appealing? Recommend that they answer before the arc gets locked, because their answer plausibly decides it. Changed by: their actual answers, which is the entire point.

**`hotels-vs-apartments.md`** — `order: 9`, `impact: medium`, question: `Hotels or apartments?`
Options: hotels are simpler, better located, and mean daily housekeeping, but four people usually means two rooms; apartments give a kitchen, a laundry machine, and one shared space for the price of roughly one hotel room, at the cost of variable quality and self-service check-in. Note that laundry is the sleeper argument for a two-week trip — it halves what you pack. Recommend apartments for stays of four or more nights and hotels for anything shorter. Note that short-term rental rules vary by city and have tightened in Barcelona and Amsterdam, so verify legality of any listing. Changed by: whether two hotel rooms or one shared apartment suits how the family actually likes to travel.

**`etias-and-passports.md`** — `order: 10`, `impact: medium`, question: `ETIAS, passports, and paperwork`
State what is known and flag what is not. Everyone needs a passport valid for at least three months beyond the planned departure from the Schengen area, and many sources advise six months of validity as a safety margin — check every family passport's expiry now, because renewals for a 2028/29 trip should not be left late. The EU's ETIAS travel authorization for visa-exempt visitors, including US citizens, is a pre-travel online registration and is expected to be in force well before this trip; the UK operates its own separate ETA, and the UK is not in the Schengen area, so a London leg is an additional border crossing. Be explicit that the exact requirements, fees, and timelines for 2028/29 are not knowable today and must be re-checked roughly six months out. Recommend one concrete action now: verify all four passport expiry dates and renew anything expiring before mid-2029. Changed by: nothing — this is homework, not a preference.

- [ ] **Step 4: Create the questions index**

Create `site/questions.md`:

```markdown
---
layout: default
title: Questions
permalink: /questions/
---

<section class="hero">
  <h1 class="hero-title">Open Questions</h1>
  <p class="hero-subtitle">The decisions that need answers before anything gets booked</p>
</section>

<div class="alert alert-info">
  <p class="alert-title">How to use this</p>
  <p>Each question has options, a recommendation, and a comment thread. Disagree freely — a recommendation is a starting point, not a verdict. Start with <a href="{{ '/questions/which-arc/' | relative_url }}">Which arc?</a>, since most of the others depend on it.</p>
</div>

{% assign open_questions = site.questions | where: "status", "open" | sort: "order" %}
{% assign decided_questions = site.questions | where: "status", "decided" | sort: "order" %}

<h2 class="section-heading">🟡 Still open ({{ open_questions | size }})</h2>

<div class="itinerary-list">
{% for q in open_questions %}
  <a href="{{ q.url | relative_url }}" class="itinerary-item">
    <span class="itinerary-location">{{ q.question }}</span>
    <span class="itinerary-day-date">{{ q.impact }} impact</span>
  </a>
{% endfor %}
</div>

{% if decided_questions.size > 0 %}
<h2 class="section-heading">✅ Decided ({{ decided_questions | size }})</h2>

<div class="itinerary-list">
{% for q in decided_questions %}
  <a href="{{ q.url | relative_url }}" class="itinerary-item">
    <span class="itinerary-location">{{ q.question }}</span>
    <span class="itinerary-day-date">{{ q.impact }} impact</span>
  </a>
{% endfor %}
</div>
{% endif %}
```

- [ ] **Step 5: Run the check to verify it passes**

Run: `./script/check.sh`
Expected: `ALL CHECKS PASSED`.

- [ ] **Step 6: Commit**

```bash
git add site script
git commit -m "feat: nine more question pages and the questions index"
```

---

### Task 7: Ruled Out, Logistics, and Feedback pages

**Files:**
- Create: `site/ruled-out.md`
- Create: `site/logistics.md`
- Create: `site/feedback.md`
- Modify: `script/check.sh`

**Interfaces:**
- Consumes: the `default` layout and CSS from Task 2; the `giscus.html` include from Task 3.
- Produces: the three pages the header nav already links to (`/ruled-out/`, `/logistics/`, `/feedback/`), closing the internal links Task 9's link check will verify.

- [ ] **Step 1: Add the failing assertions**

Append to `script/check.sh`:

```bash
assert_file "$SITE_OUT/ruled-out/index.html"
assert_contains "$SITE_OUT/ruled-out/index.html" "Santorini"
assert_contains "$SITE_OUT/ruled-out/index.html" "Venice"
assert_file "$SITE_OUT/logistics/index.html"
assert_contains "$SITE_OUT/logistics/index.html" "Eurostar"
assert_file "$SITE_OUT/feedback/index.html"
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `./script/check.sh`
Expected: FAIL — all three pages missing.

- [ ] **Step 3: Create the Ruled Out page**

Create `site/ruled-out.md`. The point of this page is that these do not get re-proposed every few weeks.

```markdown
---
layout: default
title: Ruled Out
permalink: /ruled-out/
---

<section class="hero">
  <h1 class="hero-title">Ruled Out</h1>
  <p class="hero-subtitle">Great places, wrong season — with reasons, so we don't relitigate them</p>
</section>

<div class="alert alert-info">
  <p class="alert-title">Not "bad places"</p>
  <p>Everything here is worth going to. None of it is worth going to in <em>December or January</em>. If we ever do this trip in summer instead, this list becomes the itinerary.</p>
</div>

<h2 class="section-heading">🇬🇷 The Greek islands</h2>

<div class="activity-block">

<div class="activity-card">
<h3>Santorini, Mykonos, and the Cyclades</h3>
<p>The islands run on a summer season. Outside it, ferry schedules thin out dramatically, and a large share of hotels, restaurants, and tour operators simply close for the winter. Weather is windy and wet, and swimming is out of the question.</p>
<p><strong>The deeper problem:</strong> a cancelled winter ferry can strand you for a day or more, which is a genuine risk on a fixed two-week schedule.</p>
</div>

<div class="activity-card">
<h3>Crete</h3>
<p>Large enough to stay open year-round, and Chania and Heraklion are real cities rather than seasonal resorts. Ruled out anyway on geography: it is an extra flight or a long overnight ferry from Athens, for a place whose main draws — beaches, gorge hiking, coastal driving — are all warm-weather activities.</p>
</div>

</div>

<h2 class="section-heading">🇮🇹 Coastal and northern Italy</h2>

<div class="activity-block">

<div class="activity-card">
<h3>Cinque Terre</h3>
<p>The same seasonal shutdown as the Greek islands, in a smaller space. Many restaurants and guesthouses close, the coastal walking paths are frequently shut for winter weather and landslide risk, and the villages are cold and quiet. The appeal is warm-weather village-hopping and swimming.</p>
</div>

<div class="activity-card">
<h3>Amalfi Coast and Capri</h3>
<p>Sorrento stays partly open, but Positano and Capri largely close down, and the boat connections that make the coast work are reduced or suspended. Naples and Pompeii cover the same region far better in winter — see <a href="{{ '/cities/naples/' | relative_url }}">Naples</a>.</p>
</div>

<div class="activity-card">
<h3>Venice</h3>
<p>The closest call on this page, and reasonable people would disagree. Venice does stay open, and winter fog over the canals is genuinely atmospheric. But December and January are cold and damp, and it is peak <em>acqua alta</em> season — the periodic tidal flooding that puts raised walkways across St. Mark's Square. With limited days, Rome and Florence deliver more reliably.</p>
<p><strong>Reopen this if:</strong> the trip lands in northern Italy anyway and someone really wants it.</p>
</div>

</div>

<h2 class="section-heading">🇬🇷 Mainland Greece beyond Athens</h2>

<div class="activity-block">

<div class="activity-card">
<h3>Delphi and Nafplio</h3>
<p>Both lovely, both wrong for this trip. Delphi is an outdoor mountain site — spectacular in clear weather, miserable in cold rain, and a long day trip from Athens either way. Nafplio is a charming seaside town that is very quiet in winter.</p>
<p><strong>The real reason:</strong> with two weeks and teenagers, these are the weakest cards in the deck. <a href="{{ '/cities/athens/' | relative_url }}">Athens</a> carries Greece on its own.</p>
</div>

</div>
```

- [ ] **Step 4: Create the Logistics page**

Create `site/logistics.md`:

```markdown
---
layout: default
title: Logistics
permalink: /logistics/
---

<section class="hero">
  <h1 class="hero-title">Logistics</h1>
  <p class="hero-subtitle">How the pieces actually connect</p>
</section>

<div class="alert alert-info">
  <p class="alert-title">Directional, not gospel</p>
  <p>Journey times are current typical durations and will hold roughly true, but schedules, operators, and border rules all change. Re-check everything once dates are set.</p>
</div>

<h2 class="section-heading">🚆 Getting between cities</h2>

<p>The single most useful fact in planning this trip: <strong>some of these cities are 2–3 hours apart by train, and others are only reachable by air.</strong> That shapes the route more than anything else.</p>

<h3>Fast and easy — take the train</h3>

<div class="table-wrapper">

| Route | Time | Operator |
|---|---|---|
| London → Paris | 2h20 | Eurostar |
| Paris → Amsterdam | 3h20 | Eurostar |
| Rome → Naples | ~1h10 | Trenitalia / Italo |
| Rome → Florence | ~1h30 | Trenitalia / Italo |
| Madrid → Barcelona | ~2h30 | Renfe AVE |
| Madrid → Seville | ~2h30 | Renfe AVE |
| Seville → Granada | ~2h30 | Renfe |
| Madrid → Granada | ~3h30 | Renfe |

</div>

<p>All of these are city center to city center with no airport transfer and no security queue worth the name. A three-hour train usually beats a one-hour flight door to door.</p>

<h3>Fly — no practical rail</h3>

<div class="table-wrapper">

| Route | Time |
|---|---|
| Athens → Rome | ~2h |
| Athens → Barcelona | ~3h |
| Rome → Barcelona | ~2h |
| Barcelona → Paris | ~2h (or ~6h30 by train) |
| Athens → London | ~3h30 |

</div>

<h2 class="section-heading">✈️ Getting there and home</h2>

<p>All three arcs are linear, so an <strong>open-jaw</strong> booking — into one city, home from another — avoids backtracking. Airlines sell this as a multi-city itinerary.</p>

<p>Winter transatlantic service is thinner than summer. London, Paris, Amsterdam, Madrid, and Rome all have direct US service year-round. Athens is mostly one-stop in winter. See <a href="{{ '/questions/open-jaw-flights/' | relative_url }}">Open-jaw or round-trip?</a></p>

<h2 class="section-heading">🛂 Borders and paperwork</h2>

<ul>
  <li><strong>Schengen area</strong> — Greece, Italy, Spain, France, and the Netherlands are all inside it. Once you are in, internal borders are effectively invisible.</li>
  <li><strong>The UK is not.</strong> A London leg is a separate border crossing with its own entry requirements.</li>
  <li><strong>Passports</strong> — must be valid well beyond the trip; six months' validity is the safe margin. Check all four now.</li>
  <li><strong>ETIAS</strong> — the EU's pre-travel authorization for visa-exempt visitors, expected to be in force before this trip. The UK runs a separate scheme.</li>
</ul>

<p>Details and the one action worth taking today are on <a href="{{ '/questions/etias-and-passports/' | relative_url }}">ETIAS, passports, and paperwork</a>.</p>

<h2 class="section-heading">🌦️ Winter weather at a glance</h2>

<p>January daytime highs and late-December sunset times. The daylight column is the one people underestimate.</p>

<div class="table-wrapper">

| City | January high | Sunset in late December |
|---|---|---|
| Seville | ~16 °C / 61 °F | ~6:00 PM |
| Barcelona | ~15 °C / 59 °F | ~5:30 PM |
| Athens | ~13 °C / 55 °F | ~5:20 PM |
| Naples | ~13 °C / 55 °F | ~4:45 PM |
| Granada | ~12 °C / 54 °F | ~6:00 PM |
| Rome | ~12 °C / 54 °F | ~4:40 PM |
| Madrid | ~11 °C / 52 °F | ~5:55 PM |
| Florence | ~10 °C / 50 °F | ~4:45 PM |
| London | ~8 °C / 47 °F | ~3:53 PM |
| Paris | ~7 °C / 45 °F | ~4:55 PM |
| Amsterdam | ~6 °C / 43 °F | ~4:29 PM |

</div>

<p>Seville gets more than two extra hours of usable afternoon than London does. Over fourteen days that is a materially different trip.</p>
```

- [ ] **Step 5: Create the Feedback page**

Create `site/feedback.md`:

```markdown
---
layout: default
title: Feedback
permalink: /feedback/
---

<section class="hero">
  <h1 class="hero-title">Feedback</h1>
  <p class="hero-subtitle">Tell us what you actually want</p>
</section>

<div class="alert alert-info">
  <p class="alert-title">Where to comment</p>
  <p>Every city page and every question page has its own comment thread at the bottom. Comment <em>there</em> rather than here — it keeps each discussion attached to the thing it is about. This page is for anything that doesn't fit elsewhere.</p>
</div>

<h2 class="section-heading">The three things most worth answering</h2>

<ol>
  <li><strong><a href="{{ '/questions/which-arc/' | relative_url }}">Which arc?</a></strong> — Mediterranean sunshine, northern cities, or a split. Everything else follows from this.</li>
  <li><strong><a href="{{ '/questions/pace/' | relative_url }}">Pace</a></strong> — three places properly, or six places quickly.</li>
  <li><strong><a href="{{ '/questions/what-kids-want/' | relative_url }}">What do Bubu and Gaby want?</a></strong> — genuinely open, and genuinely likely to decide the first one.</li>
</ol>

<h2 class="section-heading">No wrong answers yet</h2>

<p>Nothing is booked and nothing is decided. "I don't want to go to another museum" is useful information. So is "I only care about one thing and it's Rome." Say it now, while changing the plan costs nothing.</p>

{% include giscus.html %}
```

- [ ] **Step 6: Run the check to verify it passes**

Run: `./script/check.sh`
Expected: `ALL CHECKS PASSED`.

- [ ] **Step 7: Commit**

```bash
git add site script
git commit -m "feat: ruled-out, logistics, and feedback pages"
```

---

### Task 8: Interest toggles

**Files:**
- Modify: `site/assets/js/app.js`
- Modify: `site/assets/css/style.css`
- Modify: `site/_layouts/city.html`
- Modify: `site/cities.md`
- Modify: `script/check.sh`

**Interfaces:**
- Consumes: `app.js` from Task 2; `city.html` from Task 3; `cities.md` from Task 4.
- Produces: a `.interest-toggle` button contract — any element with class `interest-toggle` and a `data-interest-key` attribute becomes a three-state control cycling unset → interested → not interested, persisted under the single `localStorage` key `euro-trip-interest` as a JSON object mapping interest key to `"yes"` or `"no"`.

Per the spec, these picks are **per-device and invisible to the trip organizer.** That is the accepted limit of v1. Do not add a backend.

- [ ] **Step 1: Add the failing assertions**

Append to `script/check.sh`:

```bash
assert_contains "$SITE_OUT/assets/js/app.js" "euro-trip-interest"
assert_contains "$SITE_OUT/assets/css/style.css" ".interest-toggle"
assert_contains "$SITE_OUT/cities/athens/index.html" "data-interest-key=\"city:athens\""
assert_contains "$SITE_OUT/cities/index.html" "data-interest-key=\"city:amsterdam\""
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `./script/check.sh`
Expected: FAIL — none of the four strings are present.

- [ ] **Step 3: Add the toggle behavior to app.js**

Insert this section into `site/assets/js/app.js`, before the closing `})();`:

```javascript
  // ============================================
  // Interest Toggles (localStorage, per-device)
  // ============================================
  // Each person's picks live only in their own browser. Nothing is shared
  // or sent anywhere — Giscus threads are where shared opinions go.
  const INTEREST_KEY = 'euro-trip-interest';
  const INTEREST_STATES = ['unset', 'yes', 'no'];
  const INTEREST_LABELS = {
    unset: '☆ Interested?',
    yes: '★ Interested',
    no: '✕ Not for me'
  };

  function loadInterests() {
    try {
      return JSON.parse(localStorage.getItem(INTEREST_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveInterests(state) {
    try {
      localStorage.setItem(INTEREST_KEY, JSON.stringify(state));
    } catch (e) {
      // Private browsing or a full quota — the toggle still works for this
      // page view, it just won't survive a reload. Not worth interrupting for.
    }
  }

  function renderInterest(btn, value) {
    const state = value || 'unset';
    btn.dataset.interestState = state;
    btn.textContent = INTEREST_LABELS[state];
    btn.setAttribute('aria-pressed', state === 'yes');
  }

  const interestButtons = document.querySelectorAll('.interest-toggle');

  if (interestButtons.length > 0) {
    const interests = loadInterests();

    interestButtons.forEach(function(btn) {
      const key = btn.dataset.interestKey;
      if (!key) return;

      renderInterest(btn, interests[key]);

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const current = btn.dataset.interestState || 'unset';
        const next = INTEREST_STATES[(INTEREST_STATES.indexOf(current) + 1) % INTEREST_STATES.length];

        if (next === 'unset') {
          delete interests[key];
        } else {
          interests[key] = next;
        }

        saveInterests(interests);
        renderInterest(btn, next);
      });
    });
  }
```

The `e.stopPropagation()` matters: on the cities index the button sits inside an `<a>`, and without it a click would navigate away instead of toggling.

- [ ] **Step 4: Add the toggle styles**

Append to `site/assets/css/style.css`:

```css
/* ============================================
   Interest Toggles
   ============================================ */

.interest-toggle {
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-text-light);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.interest-toggle:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.interest-toggle[data-interest-state="yes"] {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.interest-toggle[data-interest-state="no"] {
  background: var(--color-border);
  border-color: var(--color-border);
  color: var(--color-text-light);
  text-decoration: line-through;
}

.interest-note {
  margin-top: var(--space-sm);
  font-size: 0.8rem;
  color: var(--color-text-light);
}
```

- [ ] **Step 5: Add the toggle to the city layout**

In `site/_layouts/city.html`, inside the `<header class="day-header">` block, insert immediately after the closing `</div>` of `day-highlights` and before the closing `</header>`:

```html
      <p>
        <button class="interest-toggle"
                data-interest-key="city:{{ page.city | downcase | replace: ' ', '-' }}"
                aria-pressed="false">☆ Interested?</button>
      </p>
      <p class="interest-note">Saved in your browser only — nobody else sees this. For opinions that count, use the comments below.</p>
```

- [ ] **Step 6: Add toggles to the cities index**

In `site/cities.md`, replace the `<a ...class="itinerary-item">…</a>` block inside the inner `for` loop with:

```markdown
  <div class="itinerary-item">
    <a href="{{ city.url | relative_url }}">
      <span class="itinerary-location">{{ city.city }}</span>
      <span class="itinerary-day-date">
        {% if city.winter_viability == 'good' %}☀️ Good in winter
        {% elsif city.winter_viability == 'mixed' %}🌧️ Mixed in winter
        {% else %}❄️ Largely closed{% endif %}
        &bull; suggest {{ city.suggested_nights }} nights
      </span>
    </a>
    <button class="interest-toggle"
            data-interest-key="city:{{ city.city | downcase | replace: ' ', '-' }}"
            aria-pressed="false">☆ Interested?</button>
  </div>
```

Also add, immediately after the existing `alert-info` block on that page:

```markdown
<p class="interest-note">Tap ☆ to mark a city. Picks are saved in your own browser and are not shared with anyone.</p>
```

- [ ] **Step 7: Run the check to verify it passes**

Run: `./script/check.sh`
Expected: `ALL CHECKS PASSED`.

- [ ] **Step 8: Verify the toggle behaves in a browser**

Run:

```bash
cd site && bundle exec jekyll serve --port 4000
```

Open `http://localhost:4000/cities/`, then confirm by hand:

1. Clicking ☆ on a city cycles it to ★ Interested, then ✕ Not for me, then back to ☆.
2. Clicking the button does **not** navigate to the city page.
3. Reloading the page preserves the state.
4. Opening `/cities/athens/` shows the same state as the index did for Athens.

Stop the server with Ctrl-C.

- [ ] **Step 9: Commit**

```bash
git add site script
git commit -m "feat: per-device interest toggles on city pages and index"
```

---

### Task 9: Link checking, README, and final verification

**Files:**
- Modify: `script/check.sh`
- Create: `README.md`
- Modify: `.github/workflows/jekyll.yml`

**Interfaces:**
- Consumes: everything built in Tasks 1–8.
- Produces: the finished repository, with `./script/check.sh` as the single command that builds and validates the whole site.

- [ ] **Step 1: Add link checking to the check script**

In `script/check.sh`, insert immediately before the final `echo` / summary block:

```bash
echo "== checking internal links =="
if ( cd site && bundle exec htmlproofer ./_site \
      --disable-external \
      --allow-hash-href \
      --no-enforce-https ); then
  echo "ok    no broken internal links"
else
  echo "FAIL  broken internal links"
  FAIL=1
fi
```

External links are disabled deliberately: this site links to dozens of Google Maps and Wikipedia URLs, and checking them on every run would make the script slow and flaky for no real benefit.

- [ ] **Step 2: Run the check to see what it catches**

Run: `./script/check.sh`
Expected: either `ALL CHECKS PASSED`, or a list of broken internal links.

If links are broken, fix them at the source. The likely candidates are cross-references written by earlier tasks: `{{ '/questions/which-arc/' | relative_url }}` and friends in `athens.md`, `cities.md`, `questions.md`, `feedback.md`, `logistics.md`, and `ruled-out.md`. Verify each target permalink actually exists. Do **not** relax the checker to make it pass.

- [ ] **Step 3: Write the README**

Create `README.md`:

````markdown
# Europe Trip Planning

A planning site for a family trip to Europe over winter break 2028/29.

**Live:** [eu.dpao.la](https://eu.dpao.la)

Nothing about this trip is decided — not the dates, not the countries, not the
duration. This site exists to change that. It has two jobs:

1. **City pages** — what eleven candidate cities are actually like *in winter*,
   each with a draft day sketch.
2. **Open questions** — the decisions that need answers, each with options, a
   recommendation, and its own comment thread.

Modeled on [guarzo/2026_jp_trip](https://github.com/guarzo/2026_jp_trip), which
serves the *other* half of trip planning: a trip already booked.

## Local development

Requires Ruby and Bundler.

```bash
cd site
bundle install
bundle exec jekyll serve
# http://localhost:4000
```

## Verifying

One command builds the site and asserts every expected page exists, contains its
required sections, and has no broken internal links:

```bash
./script/check.sh
```

## Enabling comments

Comments use [Giscus](https://giscus.app/), backed by GitHub Discussions. The
site builds and deploys fine without them — the widget is omitted entirely while
`giscus.repo_id` is empty. To turn comments on:

1. Enable **Discussions** on this repository (Settings → General → Features).
2. Install the [Giscus app](https://github.com/apps/giscus) for the repo.
3. Visit [giscus.app](https://giscus.app/), enter `guarzo/euro_trip`, and copy
   the generated `data-repo-id` and `data-category-id`.
4. Paste them into the `giscus:` block in `site/_config.yml`.
5. Commit and push.

## Structure

```
site/
├── _config.yml       # Site config, family members, Giscus keys
├── _layouts/         # default, city, question
├── _includes/        # header, footer, giscus, winter-disclaimer
├── _cities/          # 11 city pages → /cities/:name/
├── _questions/       # 10 decision pages → /questions/:name/
├── assets/
│   ├── css/style.css
│   └── js/app.js     # Mobile nav, smooth scroll, interest toggles
├── index.md
├── cities.md         # /cities/
├── questions.md      # /questions/
├── logistics.md
├── ruled-out.md
└── feedback.md
script/check.sh       # Build + assert + link check
```

## Deliberately not here

Day-by-day itinerary pages, reservation tracking, packing lists, emergency info,
offline/PWA support, and any cost or budget content. Those belong to a booked
trip. This site covers the phase before that one.

## A note on the content

The trip is more than two years out. Temperatures are climate normals, and
opening hours, festivals, and border requirements all shift. Everything here is
directional — re-check it once dates are set.
````

- [ ] **Step 4: Add the check to CI**

In `.github/workflows/jekyll.yml`, insert this step in the `build` job, immediately after `Checkout` and before `Setup Pages`:

```yaml
      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true
          working-directory: ./site

      - name: Build and verify
        run: ./script/check.sh
```

This means a push that breaks a link or drops a page fails CI instead of silently deploying.

- [ ] **Step 5: Run the full check one final time**

Run:

```bash
./script/check.sh
```

Expected: `ALL CHECKS PASSED`.

Then confirm the page count matches the spec:

```bash
ls site/_cities/*.md | wc -l      # expect 11
ls site/_questions/*.md | wc -l   # expect 10
```

Then check mobile rendering, since the stylesheet is mobile-first and the wide
tables on `/logistics/` are the most likely thing to break:

```bash
cd site && bundle exec jekyll serve --port 4000
```

At a 375px-wide viewport, confirm on `/`, `/cities/`, `/logistics/`, and
`/questions/which-arc/`:

1. No horizontal page scroll. Wide tables scroll inside their own
   `.table-wrapper`, not by pushing the page sideways.
2. The hamburger menu opens and closes.
3. Interest toggles are large enough to tap without hitting the link.

- [ ] **Step 6: Review the full diff**

Run: `git diff main --stat` and skim it. Confirm:

- No `countdown`, `sw.js`, `manifest.json`, `packing`, `reservations`, `emergency`, or `pokemon` anywhere.
- No cost, price, or budget content on any page.
- No hardcoded Giscus IDs from the Japan repo.
- `site/CNAME` and `CNAME` both contain `eu.dpao.la`.

- [ ] **Step 7: Commit**

```bash
git add README.md script .github
git commit -m "feat: link checking, README, and CI verification"
```

---

## Post-implementation, requires the user

These need access the implementer does not have. Report them rather than attempting them:

1. **Create the GitHub repo** `guarzo/euro_trip` and push `main`.
2. **Enable Pages** — Settings → Pages → Source: GitHub Actions.
3. **Point DNS** — a `CNAME` record for `eu` on `dpao.la` → `guarzo.github.io`.
4. **Enable Discussions and Giscus**, then fill in the two IDs in `site/_config.yml` per the README.
5. **Check four passport expiry dates** — the one action from the ETIAS question worth doing today rather than in 2028.
