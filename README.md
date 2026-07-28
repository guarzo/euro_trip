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

This is the project's only test surface — a static site has no unit-test
surface, so the assertions run against the generated `_site/` output. Add an
assertion whenever you add a page.

### Hero images are not checked automatically

`check.sh` disables external link checking, so a dead hero image URL will ship
silently. **When you change a `hero_image`, verify it by hand:**

```bash
for f in site/_cities/*.md; do
  U=$(grep -m1 '^hero_image:' "$f" | sed 's/hero_image: *//')
  echo "$(curl -s -o /dev/null -w '%{http_code}' -L "$U")  $(basename "$f")"
  sleep 3
done
```

All hero images use the `commons.wikimedia.org/wiki/Special:FilePath/` form
rather than hand-built `upload.wikimedia.org` thumbnail paths, because the
latter embed a hash directory that is easy to get wrong and fails silently.

## Enabling comments

Comments use [Giscus](https://giscus.app/), backed by GitHub Discussions. The
site builds and deploys fine without them — the widget is omitted entirely while
`giscus.repo_id` is empty, and a short placeholder note renders instead. To turn
comments on:

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
├── _layouts/         # default; city and question nest inside it
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

`city.html` and `question.html` carry `layout: default`, so the HTML skeleton
lives in exactly one file. `default.html` owns the only `<head>` and resolves
the page title from `city`/`country`, `question`, or `title` accordingly.

## Deliberately not here

Day-by-day itinerary pages, reservation tracking, packing lists, emergency info,
offline/PWA support, and any cost or budget content. Those belong to a booked
trip. This site covers the phase before that one.

## A note on the content

The trip is more than two years out. Temperatures are climate normals, and
opening hours, festivals, and border requirements all shift. Everything here is
directional — re-check it once dates are set. Every city page says so.
