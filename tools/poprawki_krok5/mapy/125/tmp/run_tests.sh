cd /c/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna
D=tools/poprawki_krok5/mapy/125
for T in przystan_test okolice_szkielet_test; do
  CDP_PORT=9704 timeout 420 node tests/$T.js > $D/tmp/t_${T}_before.txt 2>&1; echo "$T before exit $?" >> $D/tmp/t_summary.txt
  GAME_OVERLAY=$D/staging CDP_PORT=9704 timeout 420 node tests/$T.js > $D/tmp/t_${T}_after.txt 2>&1; echo "$T after exit $?" >> $D/tmp/t_summary.txt
done
echo done >> $D/tmp/t_summary.txt
