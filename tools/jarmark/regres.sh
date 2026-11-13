#!/bin/bash
# before -> after: existing tests that touch Map008 / the plugin list / the core's reserved ids, on the live game and on the overlay (ports 9463)
cd "$(dirname "$0")/../.."
for n in zakon_test town_interiors_test town_life_test debug_menu_test town_quests_test goscie_sala_test tavern_dice_test; do
  CDP_PORT=9463 timeout 1500 node tests/$n.js > tests/out_jarmark_przed_$n.txt 2>&1; echo "EXIT $?" >> tests/out_jarmark_przed_$n.txt
  GAME_OVERLAY=tools/jarmark/overlay GAME_OVERLAY_JS=1 CDP_PORT=9463 timeout 1500 node tests/$n.js > tests/out_jarmark_po_$n.txt 2>&1; echo "EXIT $?" >> tests/out_jarmark_po_$n.txt
done
echo DONE > tests/out_jarmark_regres_done.txt
