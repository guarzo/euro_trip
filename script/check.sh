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

# The custom domain depends entirely on this file reaching the artifact.
# site/CNAME is published only because it is not in _config.yml's exclude
# list — an edit there would silently unpublish eu.dpao.la.
assert_file "$SITE_OUT/CNAME"
assert_contains "$SITE_OUT/CNAME" "eu.dpao.la"

# No countdown anywhere: the trip date is undecided (see Global Constraints).
# Scans the whole built tree, not just the homepage.
if grep -ril "countdown" "$SITE_OUT" > /dev/null 2>&1; then
  echo "FAIL  'countdown' found in built site:"
  grep -ril "countdown" "$SITE_OUT" | sed 's/^/      /'
  FAIL=1
else
  echo "ok    no 'countdown' anywhere in the built site"
fi
assert_file "$SITE_OUT/assets/js/ui.js"
# Runtime config must reach every page, even while unconfigured — the empty
# string is what the modules read as "Supabase is not set up".
assert_contains "$SITE_OUT/index.html" "window.SUPABASE_CONFIG"
assert_contains "$SITE_OUT/cities/athens/index.html" "window.SUPABASE_CONFIG"
# The roster is defined once, in _config.yml. If this attribute stops being
# rendered, every identity-dependent feature silently disables itself.
assert_contains "$SITE_OUT/index.html" "data-identity-banner"
assert_contains "$SITE_OUT/index.html" '"key":"papa"'
assert_contains "$SITE_OUT/index.html" '"key":"gaby"'
assert_file "$SITE_OUT/assets/js/identity.js"
assert_file "$SITE_OUT/assets/js/supabase.js"
assert_file "$SITE_OUT/assets/js/main.js"
assert_contains "$SITE_OUT/assets/css/style.css" ".activity-card"
# The homepage's quick-link tile grid was replaced by the poster bill stack.
assert_contains "$SITE_OUT/assets/css/style.css" ".bill-stack"
assert_contains "$SITE_OUT/assets/css/style.css" ".site-header"
# The display face is the design; a missing font file must fail the build.
assert_file "$SITE_OUT/assets/fonts/archivo-latin.woff2"
assert_file "$SITE_OUT/assets/fonts/archivo-latin-ext.woff2"
# The countdown timer was removed along with the service worker (see Global Constraints).
assert_absent "$SITE_OUT/assets/js/ui.js" "countdown"
assert_absent "$SITE_OUT/assets/js/ui.js" "serviceWorker"
# app.js is gone; a stale copy in _site would still be served.
if [ -f "$SITE_OUT/assets/js/app.js" ]; then
  echo "FAIL  stale $SITE_OUT/assets/js/app.js still present — clean site/_site"
  FAIL=1
else
  echo "ok    no stale app.js"
fi
assert_contains "$SITE_OUT/index.html" "Open Questions"
assert_file "$SITE_OUT/cities/athens/index.html"
assert_contains "$SITE_OUT/cities/athens/index.html" "In winter"
assert_contains "$SITE_OUT/cities/athens/index.html" "Draft day sketch"
assert_contains "$SITE_OUT/cities/athens/index.html" "Getting here"
assert_contains "$SITE_OUT/cities/athens/index.html" "climate normals"
# Giscus stays out of the markup until the real repo IDs are filled in.
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

for CITY in rome florence naples barcelona madrid seville granada paris london amsterdam; do
  assert_file "$SITE_OUT/cities/$CITY/index.html"
  assert_contains "$SITE_OUT/cities/$CITY/index.html" "In winter"
  assert_contains "$SITE_OUT/cities/$CITY/index.html" "Draft day sketch"
done
assert_file "$SITE_OUT/cities/index.html"
# Every city must be reachable from the index, not just a sampled few.
for CITY in athens rome florence naples barcelona madrid seville granada paris london amsterdam; do
  assert_contains "$SITE_OUT/cities/index.html" "/cities/$CITY/"
done
# The northern cities' early sunsets are what the "which arc" decision turns on;
# they must survive any later edit to those pages.
assert_contains "$SITE_OUT/cities/london/index.html" "3:53"
assert_contains "$SITE_OUT/cities/amsterdam/index.html" "4:29"
# Amsterdam is the one city rated 'mixed' rather than 'good'.
assert_contains "$SITE_OUT/cities/amsterdam/index.html" "Mixed in winter"

assert_file "$SITE_OUT/questions/which-arc/index.html"
assert_contains "$SITE_OUT/questions/which-arc/index.html" "Which arc"
assert_contains "$SITE_OUT/questions/which-arc/index.html" "Why it matters"
assert_contains "$SITE_OUT/questions/which-arc/index.html" "My recommendation"
assert_contains "$SITE_OUT/questions/which-arc/index.html" "4:29"

for Q in exact-dates how-many-countries open-jaw-flights trains-vs-flights pace \
         christmas-and-new-years what-kids-want hotels-vs-apartments etias-and-passports; do
  assert_file "$SITE_OUT/questions/$Q/index.html"
  assert_contains "$SITE_OUT/questions/$Q/index.html" "Why it matters"
  assert_contains "$SITE_OUT/questions/$Q/index.html" "My recommendation"
done
assert_file "$SITE_OUT/questions/index.html"
for Q in which-arc exact-dates how-many-countries open-jaw-flights trains-vs-flights \
         pace christmas-and-new-years what-kids-want hotels-vs-apartments etias-and-passports; do
  assert_contains "$SITE_OUT/questions/index.html" "/questions/$Q/"
done

assert_file "$SITE_OUT/ruled-out/index.html"
assert_contains "$SITE_OUT/ruled-out/index.html" "Santorini"
assert_contains "$SITE_OUT/ruled-out/index.html" "Venice"
assert_file "$SITE_OUT/logistics/index.html"
assert_contains "$SITE_OUT/logistics/index.html" "Eurostar"
# Markdown tables inside a block-level HTML wrapper need markdown="1", or
# kramdown emits the raw "| Route | Time |" source. Grepping for cell text
# passes either way, so assert the actual <table> element instead.
assert_contains "$SITE_OUT/logistics/index.html" "<table"
assert_absent "$SITE_OUT/logistics/index.html" "|---|"
assert_contains "$SITE_OUT/index.html" "<table"
assert_absent "$SITE_OUT/index.html" "|---|"
assert_contains "$SITE_OUT/questions/trains-vs-flights/index.html" "<table"
assert_file "$SITE_OUT/feedback/index.html"
assert_contains "$SITE_OUT/assets/css/style.css" ".interest-mark"
assert_file "$SITE_OUT/assets/js/interests.js"
# The same interest_key must appear on both the city page and the index —
# that shared key is what makes them two views of one mark.
assert_contains "$SITE_OUT/cities/athens/index.html" 'data-interest-key="city:athens"'
assert_contains "$SITE_OUT/cities/index.html" 'data-interest-key="city:athens"'
assert_contains "$SITE_OUT/cities/index.html" 'data-interest-key="city:amsterdam"'
# The old per-device copy must not survive anywhere, including the city
# page's closing wall.
assert_absent "$SITE_OUT/cities/index.html" "not shared with anyone"
assert_absent "$SITE_OUT/cities/athens/index.html" "nobody else sees this"
assert_absent "$SITE_OUT/cities/athens/index.html" "only tells your own browser"

echo "== checking internal links =="
# External links are deliberately not checked: the site links to dozens of
# Google Maps and Wikimedia URLs, and checking them every run would be slow
# and flaky. Hero images are verified separately when they change.
if ( cd site && bundle exec htmlproofer ./_site \
      --disable-external \
      --allow-hash-href \
      --no-enforce-https ) > /dev/null 2>&1; then
  echo "ok    no broken internal links"
else
  echo "FAIL  broken internal links — rerun htmlproofer directly for detail:"
  echo "      (cd site && bundle exec htmlproofer ./_site --disable-external --allow-hash-href --no-enforce-https)"
  FAIL=1
fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo "ALL CHECKS PASSED"
else
  echo "CHECKS FAILED"
fi
exit "$FAIL"
