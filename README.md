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

## Deployment and the custom domain

Pushing to `main` builds and deploys via `.github/workflows/jekyll.yml`. The
workflow runs `script/check.sh` and uploads the `site/_site` tree that the checks
passed against — deliberately *not* `actions/jekyll-build-pages`, which builds
with the `github-pages` gem (Jekyll 3.x) and would deploy a differently-built
site from the one that was verified.

**The site only works at `eu.dpao.la`.** `site/_config.yml` sets `baseurl: ""`,
which is correct for a custom domain but means every internal link resolves from
the domain root. At `https://guarzo.github.io/euro_trip/` the pages render and
every link 404s. Do not "fix" that by setting `baseurl: "/euro_trip"` — it would
break the site the moment the custom domain is in use.

The custom domain requires:

- A DNS record: `eu.dpao.la. CNAME guarzo.github.io.`
- `site/CNAME` reaching the built artifact. It is published only because it is
  absent from `_config.yml`'s `exclude:` list; `check.sh` asserts
  `_site/CNAME` exists so an `exclude:` edit cannot silently unpublish it.
- The domain set under Settings → Pages → Custom domain.

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

## Structure

```
site/
├── _config.yml       # Site config, family members, Supabase keys
├── _layouts/         # default; city and question nest inside it
├── _includes/        # header, footer, comments, identity-banner, winter-disclaimer
├── _cities/          # 11 city pages → /cities/:name/
├── _questions/       # 10 decision pages → /questions/:name/
├── assets/
│   ├── css/style.css
│   └── js/*.js       # main, ui, identity, supabase, interests, comments
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
offline/PWA support, comment editing and deletion (SQL console instead),
notifications, threaded replies, and any cost or budget content. Those belong to a booked
trip. This site covers the phase before that one.

## A note on the content

The trip is more than two years out. Temperatures are climate normals, and
opening hours, festivals, and border requirements all shift. Everything here is
directional — re-check it once dates are set. Every city page says so.
