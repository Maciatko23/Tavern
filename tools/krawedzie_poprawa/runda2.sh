#!/bin/bash
cd "$(dirname "$0")/../.."
S=tools/krawedzie_poprawa/staging
rm -f $S/runda2.txt
# wydajność: data/ potem staging, jedno po drugim
unset GAME_OVERLAY GAME_OVERLAY_JS
CDP_PORT=9407 timeout 900 node tests/wydajnosc_test.js > $S/wyd_data.txt 2>&1
export GAME_OVERLAY=$S GAME_OVERLAY_JS=1
CDP_PORT=9407 timeout 900 node tests/wydajnosc_test.js > $S/wyd_staging.txt 2>&1
echo WYD >> $S/runda2.txt
FAZA=po CDP_PORT=9407 timeout 1500 node tests/krawedzie_zrzuty.js > $S/z_po.txt 2>&1
unset GAME_OVERLAY GAME_OVERLAY_JS
FAZA=przed CDP_PORT=9407 timeout 1500 node tests/krawedzie_zrzuty.js > $S/z_przed.txt 2>&1
echo ZRZUTY >> $S/runda2.txt
bash tools/krawedzie_poprawa/testy.sh
echo KONIEC >> $S/runda2.txt
