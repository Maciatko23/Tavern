cd /c/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna
export CDP_PORT=9702
for t in manor_test lowy_test okolice_integracja_test okolice_szkielet_test; do
  for m in before after; do
    if [ $m = after ]; then export GAME_OVERLAY=tools/poprawki_krok5/mapy/024/staging; else unset GAME_OVERLAY; fi
    timeout 420 node tests/$t.js > tools/poprawki_krok5/mapy/024/tmp/t_${t}_$m.txt 2>&1
    echo "$t $m exit $?" >> tools/poprawki_krok5/mapy/024/tmp/t_summary.txt
  done
done
echo DONE >> tools/poprawki_krok5/mapy/024/tmp/t_summary.txt
