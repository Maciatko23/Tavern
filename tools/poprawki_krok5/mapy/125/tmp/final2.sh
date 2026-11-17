cd /c/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna
D=tools/poprawki_krok5/mapy/125
rm -f $D/tmp/f2_done
MODE=after CDP_PORT=9704 timeout 280 node $D/gra_test.js > $D/tmp/gra_after.txt 2>&1
MODE=after MAP=125 PLACES=$D/miejsca.json OUT_DIR=$D/tmp/zdjecia CDP_PORT=9704 timeout 900 node $D/zdjecia.js > $D/tmp/shots_after.txt 2>&1
echo done > $D/tmp/f2_done
