#!/bin/bash
# usage: testy.sh <test> <port_before> <port_after>   (tests/<test>_test.js; before = live game, after = staging overlay) - logs in tmp/t/
cd "$(dirname "$0")/../.."
T=$1; PB=$2; PA=$3
O=tools/questy_pustelnia/staging
if [ "$T" = kleofas_kaplica ]; then BEF=tools/questy_pustelnia/tmp/leer; else BEF=""; fi
( if [ -n "$BEF" ]; then export GAME_OVERLAY=$BEF; else unset GAME_OVERLAY; fi; unset GAME_OVERLAY_JS
  CDP_PORT=$PB timeout 1500 node tests/${T}_test.js > tools/questy_pustelnia/tmp/t/before_${T}.txt 2>&1 ) &
( export GAME_OVERLAY=$O GAME_OVERLAY_JS=1; CDP_PORT=$PA timeout 1500 node tests/${T}_test.js > tools/questy_pustelnia/tmp/t/after_${T}.txt 2>&1 ) &
wait
for m in before after; do echo "$m $T: $(grep -E '[0-9]+/[0-9]+ passed' tools/questy_pustelnia/tmp/t/${m}_${T}.txt | tail -1)"; done
