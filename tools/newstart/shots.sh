#!/bin/sh
# sh shots.sh <outdir> <prefix> <map ids...>  - whole-map pictures (retries when the busy server fails to load a file)
out="$1"; pre="$2"; shift 2
for m in "$@"; do
  for t in 1 2 3 4; do
    r=$(node "$(dirname "$0")/mapshot.js" "$m" "$out/${pre}map$m.png" 12 2>&1)
    echo "$r" | grep -q "^saved" && break
  done
  echo "$m: $(echo "$r" | head -1)"
done
