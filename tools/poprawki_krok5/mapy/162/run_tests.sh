#!/bin/bash
cd /c/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna
OUT=tools/poprawki_krok5/mapy/162/tmp/tests
mkdir -p $OUT
export CDP_PORT=9703
for t in garnizon lowy ludzie okolice_szkielet zasoby swiat_styki; do
  for mode in before after; do
    if [ $mode = after ]; then export GAME_OVERLAY=tools/poprawki_krok5/mapy/162/staging; else unset GAME_OVERLAY; fi
    timeout 500 node tests/${t}_test.js > $OUT/${t}_${mode}.txt 2>&1
    echo "$t $mode exit=$? $(tail -1 $OUT/${t}_${mode}.txt | cut -c1-120)" >> $OUT/summary.txt
  done
done
echo DONE >> $OUT/summary.txt
