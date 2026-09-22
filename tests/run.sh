#!/bin/bash
# Runs every *_test.js in this folder (or just the ones named on the command line) against a
# local copy of the game and writes a short pass/fail summary to results.txt.
#
#   tests/run.sh                  runs the whole suite
#   tests/run.sh keys_test hut_test   runs just those two
#
# Needs a game server on 127.0.0.1:8765 (from the project root: python -m http.server 8765
# --bind 127.0.0.1) and a headless Edge at the path cdp.js expects.
cd "$(dirname "$0")"
tests=("$@")
if [ ${#tests[@]} -eq 0 ]; then
  for f in *_test.js; do tests+=("${f%.js}"); done
fi
: > results.txt
pass=0 fail=0
for t in "${tests[@]}"; do
  [ -f "$t.js" ] || { echo "=== $t : no such file" >> results.txt; continue; }
  echo "=== $t" >> results.txt
  timeout 420 node "$t.js" > "out_$t.txt" 2>&1
  grep -E "^FAIL|^ERR|passed|console errors" "out_$t.txt" | tail -12 >> results.txt
  if grep -qE "^FAIL|^ERR" "out_$t.txt"; then fail=$((fail+1)); else pass=$((pass+1)); fi
done
echo "SUITES: $pass clean, $fail with a FAIL/ERR line" >> results.txt
echo "ALL DONE" >> results.txt
