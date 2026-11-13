#!/bin/bash
# questy_mapa: jeden test z nakladka i ZMIENIONYM testem (staging/tests/<T>.js; require ./ -> tests/). Uzycie: PORT=9756 bash testy2.sh <test> [<snapshot dir, domyslnie staging>]
cd "$(dirname "$0")/../.."
T=$1; SNAP=${2:-tools/questy_mapa/staging}; PORT=${PORT:-9756}
ABS="$(pwd -W 2>/dev/null || pwd)"
mkdir -p tools/questy_mapa/testy_run tools/questy_mapa/testy_po2
SRC=$SNAP/tests/$T.js; [ -f "$SRC" ] || SRC=tests/$T.js
cp "$SRC" tests/_qm_$T.js
GAME_OVERLAY=$SNAP GAME_OVERLAY_JS=1 CDP_PORT=$PORT timeout 900 node tests/_qm_$T.js > tools/questy_mapa/testy_po2/$T.log 2>&1
rm -f tests/_qm_$T.js
echo "$T rc=$? $(grep -c '^PASS' tools/questy_mapa/testy_po2/$T.log) pass $(grep -c '^FAIL' tools/questy_mapa/testy_po2/$T.log) fail; $(tail -1 tools/questy_mapa/testy_po2/$T.log | cut -c1-60)"
