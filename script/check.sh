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
assert_file "$SITE_OUT/assets/js/app.js"
assert_contains "$SITE_OUT/assets/css/style.css" ".activity-card"
assert_contains "$SITE_OUT/assets/css/style.css" ".quick-link"
assert_contains "$SITE_OUT/assets/css/style.css" ".site-header"
# The countdown timer was removed along with the service worker (see Global Constraints).
assert_absent "$SITE_OUT/assets/js/app.js" "countdown"
assert_absent "$SITE_OUT/assets/js/app.js" "serviceWorker"
assert_contains "$SITE_OUT/index.html" "Open Questions"
assert_file "$SITE_OUT/cities/athens/index.html"
assert_contains "$SITE_OUT/cities/athens/index.html" "In winter"
assert_contains "$SITE_OUT/cities/athens/index.html" "Draft day sketch"
assert_contains "$SITE_OUT/cities/athens/index.html" "Getting here"
assert_contains "$SITE_OUT/cities/athens/index.html" "climate normals"
# Giscus stays out of the markup until the real repo IDs are filled in.
assert_absent "$SITE_OUT/cities/athens/index.html" "giscus.app/client.js"

for CITY in rome florence naples barcelona madrid seville granada paris london amsterdam; do
  assert_file "$SITE_OUT/cities/$CITY/index.html"
  assert_contains "$SITE_OUT/cities/$CITY/index.html" "In winter"
  assert_contains "$SITE_OUT/cities/$CITY/index.html" "Draft day sketch"
done
assert_file "$SITE_OUT/cities/index.html"
assert_contains "$SITE_OUT/cities/index.html" "/cities/athens/"
assert_contains "$SITE_OUT/cities/index.html" "/cities/amsterdam/"
assert_contains "$SITE_OUT/cities/index.html" "/cities/granada/"
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
assert_contains "$SITE_OUT/questions/index.html" "/questions/which-arc/"
assert_contains "$SITE_OUT/questions/index.html" "/questions/etias-and-passports/"

assert_file "$SITE_OUT/ruled-out/index.html"
assert_contains "$SITE_OUT/ruled-out/index.html" "Santorini"
assert_contains "$SITE_OUT/ruled-out/index.html" "Venice"
assert_file "$SITE_OUT/logistics/index.html"
assert_contains "$SITE_OUT/logistics/index.html" "Eurostar"
assert_file "$SITE_OUT/feedback/index.html"

assert_contains "$SITE_OUT/assets/js/app.js" "euro-trip-interest"
assert_contains "$SITE_OUT/assets/css/style.css" ".interest-toggle"
assert_contains "$SITE_OUT/cities/athens/index.html" 'data-interest-key="city:athens"'
assert_contains "$SITE_OUT/cities/index.html" 'data-interest-key="city:amsterdam"'

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
