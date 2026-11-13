#!/bin/bash
# honest A/B: interleaved (base, jarmark) x3, each best of 3 x 3 s at 4x CPU throttle; port 9461
cd "$(dirname "$0")/../.."
rm -f tests/out_jarmark_perf.txt
for i in 1 2 3; do
  CDP_PORT=9461 timeout 900 node tests/jarmark_perf.js --base >> tests/out_jarmark_perf.txt 2>&1
  CDP_PORT=9461 timeout 900 node tests/jarmark_perf.js >> tests/out_jarmark_perf.txt 2>&1
done
echo PERFDONE >> tests/out_jarmark_perf.txt
