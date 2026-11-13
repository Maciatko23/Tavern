#!/bin/bash
# usage: testy.sh before|after  - the tests of the touched quests/maps (overlay = staging for "after"); logs in tmp/t/<mode>_<test>.txt
cd "$(dirname "$0")/../.."
MODE=$1; PORT0=9770
i=0
for t in zasoby questy_mapa zakon field_loss przystan pustelnia debug_menu; do
  P=$((PORT0 + i % 5)); i=$((i+1))
  if [ "$MODE" = after ]; then export GAME_OVERLAY=tools/poprawki_uzytkownika/staging GAME_OVERLAY_JS=1; else unset GAME_OVERLAY GAME_OVERLAY_JS; fi
  CDP_PORT=$P timeout 900 node tests/${t}_test.js > tools/poprawki_uzytkownika/tmp/t/${MODE}_${t}.txt 2>&1 &
  if [ $((i % 4)) -eq 0 ]; then wait; fi
done
wait
for t in zasoby questy_mapa zakon field_loss przystan pustelnia debug_menu; do echo "$MODE $t: $(grep -E '[0-9]+/[0-9]+ passed' tools/poprawki_uzytkownika/tmp/t/${MODE}_${t}.txt | tail -1)"; done
