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
