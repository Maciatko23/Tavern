#!/bin/bash
# runshots.sh <outdir> <sheet|-> <tag> spots... : one browser per spot (map:x:y:name), retried when the boot hit an error
here="$(cd "$(dirname "$0")" && pwd)"
outdir="$1"; sheet="$2"; tag="$3"; shift 3
for s in "$@"; do
  for try in 1 2 3 4; do
    out=$(CDP_PORT=9352 timeout 200 node "$here/shots.js" "$outdir" "$sheet" "$tag" "$s" 2>&1)
    if echo "$out" | grep -q "^shot" && ! echo "$out" | grep -q "EXC\|Failed to load\|ERR"; then echo "$out" | grep "^shot"; break; fi
    echo "retry $s ($try)"; echo "$out" | head -3
  done
done
