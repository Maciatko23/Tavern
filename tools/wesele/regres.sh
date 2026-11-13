#!/bin/bash
# regression: the tests that touch what W18 changed (Goscie_Sala, the plugin list, the tavern): before (live game) -> after (overlay)
cd "$(dirname "$0")/../.."
for T in goscie_sala_test lancuchy_test tavern_life_test; do
  echo "== $T before"; CDP_PORT=9943 timeout 900 node tests/$T.js 2>&1 | grep -E "passed|^FAIL|^ERR" | cut -c1-200
  echo "== $T after";  GAME_OVERLAY=tools/wesele/overlay GAME_OVERLAY_JS=1 CDP_PORT=9943 timeout 900 node tests/$T.js 2>&1 | grep -E "passed|^FAIL|^ERR" | cut -c1-200
done
echo done
