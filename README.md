# Europe Trip Planning

A planning site for a family trip to Europe over winter break 2027/28.

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

## Supabase setup

Comments and interest marks require a Supabase project. `supabase/schema.sql`
is applied by hand in the SQL editor — there is no migration tooling.

**⚠️ WARNING:** The schema file drops and recreates every table. Once the four
users and their profile rows are seeded (see below), re-running the file will
destroy all comments, interest marks, and profile rows. Do not re-run it to
"check something" — re-runs are only safe before users are created.

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

The sign-in form shows identical copy ("Check your email for a sign-in link.")
whether or not the address is one of the four seeded users — see the comment
at `auth.js`'s `onSubmit()`. This is deliberate: a different message for
"no such user" would turn the form into a way to enumerate who has an
account. That property depends on both sides — our code never branches on
whether the email exists, and Supabase's own `signInWithOtp` behavior (with
"Allow new users to sign up" disabled) does not either. Do not "helpfully"
add a more specific error message here later; it would reopen exactly what
disabling signups closed.

Mail is sent through **Resend** over custom SMTP, configured in Project
Settings → Authentication → SMTP Settings. The sender domain is `dpao.la`, so
magic links arrive from an address the family recognizes rather than from a
shared provider domain — which matters more than usual for a link people are
being asked to click.

Supabase's built-in mailer is rate-limited to a few messages per hour and is
not meant for production; it was hit during setup, where a throttled send looks
exactly like broken auth. If mail stops arriving, check Resend's Emails tab
(did it reach Resend at all?) and Supabase's Auth Logs (did Supabase fail to
hand it over?) — between the two you can tell which side failed. Note that
Authentication → Rate Limits applies its own cap independently of SMTP.

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

## Verifying the shared features

The following manual tests verify behavior in `site/assets/js/interests.js`,
`comments.js`, `auth.js`, and `supabase.js`. Client authentication has landed
and these steps are live now; re-run the five happy-path steps and the
failure-path checklist below after touching any of those files.

### Happy path

1. Sign in via magic link.
2. On a city page, tap your mark until it reads ★.
3. Open the same page in a different browser (or a private window), sign in as
   a *different* person, and confirm the first person's ★ is visible.
4. Open `/cities/` and confirm that city shows the same ★ there. This is what
   the `interest_key` schema exists for — the index and the city page are two
   views of one mark.
5. Post a comment, reload, and confirm it survives. Then clear your mark and
   confirm it disappears in both browsers and on the index.

### Failure paths

These cover the behaviors that are easy to break silently, because nothing
renders differently until they are provoked. Each has been verified at least
once; re-run the relevant ones after touching `supabase.js`, `interests.js`,
or `comments.js`.

1. **CDN unreachable.** Block `esm.sh` (DevTools → Network → block request
   domain) and reload. Nav, smooth scroll, the slam animation, and the
   sign-in form must all still work, with no uncaught exceptions in the console.
   This is why the Supabase client is a dynamic `import()` — a static one would
   take the whole module graph down with it.
2. **No in-session CDN recovery.** With `esm.sh` still blocked, marks and notes
   report a load failure. Unblock it and interact again *without reloading*:
   they stay failed. That is expected — the browser caches a failed module
   resolution against its URL for the life of the page, so the retry never hits
   the network. A reload fixes it. If you ever want true in-session recovery,
   it needs a cache-busted URL; that was deliberately not done.
3. **Failed write on a mark.** With the network throttled to offline, tap your
   mark. It must snap back to its previous state and show "Didn't save — try
   again" — and that message must survive, since it lives in a live region
   outside the row rather than inside the part that gets re-rendered.
4. **Rapid repeated taps.** Tap one mark four times fast. The mark shown must
   match what is stored — reload and confirm it did not change. Writes are
   chained per mark precisely so a double-tap cannot strand a stale value; this
   is the check that catches a regression there.
5. **Failed comment post.** Offline again, post a note. It must report
   "Didn't post — try again" *and leave your text in the box*. Clear the box
   and submit: the stale error must disappear rather than linger.
6. **Magic link comes back with `otp_expired`.** Click a fresh link and land
   on the site with `#error=access_denied&error_code=otp_expired` in the URL.
   `otp_expired` only means the token was not accepted — it does NOT
   distinguish an aged-out link from an already-used one, so don't assume
   expiry. Check Authentication → Logs: two `GET /verify` entries seconds
   apart, the first `303` (success) and the second `403` "One-time token not
   found", means the link worked and something re-fetched it — not an auth
   problem. Known cause: a stale service worker registered on `localhost`
   from an earlier build of this site re-issuing the navigation (this
   project's own service worker was removed; `check.sh` asserts
   `serviceWorker` never returns to `ui.js`, but a browser that visited an
   older build may still have one installed). Fix: DevTools → Application →
   Service Workers → Unregister, then Clear site data. Also note: Supabase
   treats `http://localhost:4000` and `http://127.0.0.1:4000` as different
   origins — whichever you browse, that exact origin must be in the redirect
   allowlist.

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

## Structure

```text
site/
├── _config.yml       # Site config, Supabase keys
├── _layouts/         # default; city and question nest inside it
├── _includes/        # header, footer, comments, identity-banner, winter-disclaimer
├── _cities/          # 11 city pages → /cities/:name/
├── _questions/       # 10 decision pages → /questions/:name/
├── assets/
│   ├── css/style.css
│   └── js/*.js       # main, ui, auth, supabase, interests, comments
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
