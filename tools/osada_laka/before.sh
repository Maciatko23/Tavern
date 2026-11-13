#!/bin/bash
# the baseline: the live tests as they are now (no overlay), one at a time, port 9420
cd "$(dirname "$0")/../.."
for t in osada_huts_test questy_mapa_test zakon_test mountain_places_test w8_mountains_test; do
  CDP_PORT=9420 timeout 900 node tests/$t.js > tools/osada_laka/out/before_$t.txt 2>&1
  echo "$t exit $?" >> tools/osada_laka/out/before_summary.txt
done
