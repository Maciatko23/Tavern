cd /c/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna
D=tools/poprawki_krok5/mapy/125
rm -f $D/tmp/shots_done
for M in before after; do
  MODE=$M MAP=125 PLACES=$D/miejsca.json OUT_DIR=$D/tmp/zdjecia CDP_PORT=9704 timeout 900 node $D/zdjecia.js > $D/tmp/shots_$M.txt 2>&1
  echo "$M exit $?" >> $D/tmp/shots_done
done
echo done >> $D/tmp/shots_done
