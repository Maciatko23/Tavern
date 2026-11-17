cd /c/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna
D=tools/poprawki_krok5/mapy/125
rm -f $D/tmp/final_done
MODE=after CDP_PORT=9704 timeout 280 node $D/gra_test.js > $D/tmp/gra_after.txt 2>&1
for T in przystan_test okolice_szkielet_test; do
  GAME_OVERLAY=$D/staging CDP_PORT=9704 timeout 420 node tests/$T.js > $D/tmp/f_${T}_after.txt 2>&1; echo "$T exit $?" >> $D/tmp/final_done
done
MODE=after MAP=125 PLACES=$D/miejsca.json OUT_DIR=$D/tmp/zdjecia CDP_PORT=9704 timeout 900 node $D/zdjecia.js > $D/tmp/shots_after.txt 2>&1
echo done >> $D/tmp/final_done
