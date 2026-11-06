#!/bin/bash
cd "$(dirname "$0")/../.."
S=tools/krawedzie_poprawa/staging
unset GAME_OVERLAY GAME_OVERLAY_JS
POMIN_ISTNIEJACE=1 FAZA=przed CDP_PORT=${PORT_CDP:-9411} timeout 1500 node tests/krawedzie_zrzuty.js > $S/z_przed2.txt 2>&1
echo ZRZUTY > $S/runda2.txt
bash tools/krawedzie_poprawa/testy.sh
echo KONIEC >> $S/runda2.txt
