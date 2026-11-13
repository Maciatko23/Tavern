#!/bin/bash
# questy_mapa: istniejace testy z nakladka (po) i bez (przed). Uzycie: MODE=przed|po [ONLY="t1 t2"] bash tools/questy_mapa/testy.sh
# po: nakladka = migawka staging_testy (cp -r staging staging_testy przed uruchomieniem). Wynik: testy_<MODE>/<test>.log + testy_<MODE>.txt. CDP: przed 9753, po 9755.
cd "$(dirname "$0")/../.."
TESTS="zakon_test zasoby_test lowy_test ludzie_test w5_test field_loss_test okolice_szkielet_test okolice_integracja_test przystan_test w1_chapters_test pustelnia_test kruk_test debug_menu_test mountain_places_test osada_huts_test krawedzie_test"
MODE=${MODE:-przed}; PORT=9753; [ "$MODE" = "po" ] && PORT=9755
mkdir -p tools/questy_mapa/testy_$MODE; : > tools/questy_mapa/testy_$MODE.txt
if [ "$MODE" = "po" ]; then export GAME_OVERLAY=tools/questy_mapa/staging_testy GAME_OVERLAY_JS=1; else unset GAME_OVERLAY GAME_OVERLAY_JS; fi
for T in ${ONLY:-$TESTS}; do
  CDP_PORT=$PORT timeout 900 node tests/$T.js > tools/questy_mapa/testy_$MODE/$T.log 2>&1
  echo "$T rc=$? $(grep -c '^PASS' tools/questy_mapa/testy_$MODE/$T.log) pass, $(grep -c '^FAIL' tools/questy_mapa/testy_$MODE/$T.log) fail; $(tail -1 tools/questy_mapa/testy_$MODE/$T.log | cut -c1-80)" >> tools/questy_mapa/testy_$MODE.txt
done
echo done > tools/questy_mapa/testy_${MODE}_done.txt
