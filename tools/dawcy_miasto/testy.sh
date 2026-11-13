#!/bin/bash
# dawcy_miasto: istniejace testy z nakladka (po) i bez (przed). Uzycie: MODE=przed|po [ONLY="t1 t2"] bash tools/dawcy_miasto/testy.sh
# po: nakladka = migawka staging_testy (cp -r staging staging_testy przed uruchomieniem). Wynik: testy_<MODE>/<test>.log + testy_<MODE>.txt. CDP: przed 9917, po 9918.
cd "$(dirname "$0")/../.."
TESTS="quest_board_test przystan_test garnizon_test latarnia_test tavern_life_test goscie_sala_test ludzie_test lowy_test zasoby_test wrak_test podroznicy_test podroznicy_sprawy_test town_life_test podgrodzie_life_test podgrodzie_mieszkancy_test podgrodzie_quests_test miasto_mieszkancy_test regulars_quests_test town_quests_test town_quests2_test"
MODE=${MODE:-przed}; PORT=9917; [ "$MODE" = "po" ] && PORT=9918
D=tools/dawcy_miasto
mkdir -p $D/testy_$MODE; : > $D/testy_$MODE.txt
if [ "$MODE" = "po" ]; then export GAME_OVERLAY=$D/staging_testy GAME_OVERLAY_JS=1; else unset GAME_OVERLAY GAME_OVERLAY_JS; fi
for T in ${ONLY:-$TESTS}; do
  CDP_PORT=$PORT timeout 1200 node tests/$T.js > $D/testy_$MODE/$T.log 2>&1
  echo "$T rc=$? $(grep -c '^PASS' $D/testy_$MODE/$T.log) pass, $(grep -c '^FAIL' $D/testy_$MODE/$T.log) fail; $(tail -1 $D/testy_$MODE/$T.log | cut -c1-80)" >> $D/testy_$MODE.txt
done
echo done > $D/testy_${MODE}_done.txt
