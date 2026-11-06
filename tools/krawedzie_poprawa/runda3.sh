#!/bin/bash
# wydajność (data/ potem staging), zrzuty po/przed, testy; port CDP 9411 (PORT_CDP)
cd "$(dirname "$0")/../.."
S=tools/krawedzie_poprawa/staging; P=${PORT_CDP:-9411}
: > $S/runda3.txt
unset GAME_OVERLAY GAME_OVERLAY_JS
CDP_PORT=$P timeout 900 node tests/wydajnosc_test.js > $S/wyd_data.txt 2>&1; echo "wyd_data $(grep -c '^PASS' $S/wyd_data.txt)/$(grep -cE '^(PASS|FAIL)' $S/wyd_data.txt)" >> $S/runda3.txt
export GAME_OVERLAY=$S GAME_OVERLAY_JS=1
CDP_PORT=$P timeout 900 node tests/wydajnosc_test.js > $S/wyd_staging.txt 2>&1; echo "wyd_staging $(grep -c '^PASS' $S/wyd_staging.txt)/$(grep -cE '^(PASS|FAIL)' $S/wyd_staging.txt)" >> $S/runda3.txt
POMIN_ISTNIEJACE=1 FAZA=po CDP_PORT=$P timeout 2400 node tests/krawedzie_zrzuty.js > $S/z_po.txt 2>&1; echo PO >> $S/runda3.txt
unset GAME_OVERLAY GAME_OVERLAY_JS
POMIN_ISTNIEJACE=1 FAZA=przed CDP_PORT=$P timeout 2400 node tests/krawedzie_zrzuty.js > $S/z_przed.txt 2>&1; echo PRZED >> $S/runda3.txt
PORT_CDP=$P bash tools/krawedzie_poprawa/testy.sh
echo KONIEC >> $S/runda3.txt
