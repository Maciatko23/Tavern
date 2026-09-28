#!/bin/bash
# runshots_s2.sh <outdir> <sheet|-> <tag> spots... : one browser per spot (CDP_PORT 9353), retried when the boot hit an error
cd "$(dirname "$0")"
out="$1"; sheet="$2"; tag="$3"; shift 3
mkdir -p "$out"
for s in "$@"; do
  for try in 1 2 3 4; do
    res=$(CDP_PORT=9353 timeout 200 node shots_s2.js "$out" "$sheet" "$tag" "$s" 2>&1)
    if echo "$res" | grep -q "^shot" && ! echo "$res" | grep -q "EXC\|Failed to load\|ERR"; then echo "$res" | grep "^shot"; break; fi
    echo "retry $s ($try)"; echo "$res" | head -3
  done
done
