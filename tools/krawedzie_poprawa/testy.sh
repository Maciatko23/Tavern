#!/bin/bash
# Testy poprawy krawędzi na stagingu (port 9407); wynik: tools/krawedzie_poprawa/staging/testy.txt.  bash tools/krawedzie_poprawa/testy.sh [przed]
cd "$(dirname "$0")/../.."
OUT=tools/krawedzie_poprawa/staging/testy${1:+_$1}.txt; : > $OUT
for t in swiat_styki swiat_przejscia krawedzie orzel clean_hud laki_przejscia swiat_etap1 swiat_etap2 swiat_etap2b swiat_etap3 field_loss story podgrodzie przystan town_well w8_mountains mountain_places osada_huts wydajnosc; do
  f=tests/${t}_test.js; [ -f $f ] || continue
  if [ -z "$1" ]; then export GAME_OVERLAY=tools/krawedzie_poprawa/staging GAME_OVERLAY_JS=1; else unset GAME_OVERLAY GAME_OVERLAY_JS; fi
  CDP_PORT=${PORT_CDP:-9411} timeout 900 node $f > tools/krawedzie_poprawa/staging/log_$t${1:+_$1}.txt 2>&1
  echo "$t exit=$? $(grep -cE '^PASS' tools/krawedzie_poprawa/staging/log_$t${1:+_$1}.txt) PASS $(grep -cE '^FAIL' tools/krawedzie_poprawa/staging/log_$t${1:+_$1}.txt) FAIL" >> $OUT
done
echo KONIEC >> $OUT
