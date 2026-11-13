#!/bin/bash
# the staged tests against the staging overlay, one at a time, port 9421
cd "$(dirname "$0")/../.."
for t in "$@"; do
  timeout 1500 node tools/osada_laka/run.js $t 9421 > tools/osada_laka/out/after_$t.txt 2>&1
  echo "$t exit $?" >> tools/osada_laka/out/after_summary.txt
done
