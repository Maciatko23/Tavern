cd /c/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna
for t in zakon_test mountain_places_test przystan_test latarnia_test; do
  CDP_PORT=9671 node tests/$t.js > tools/poprawki_krok3/tmp/t_${t}_before.txt 2>&1
  GAME_OVERLAY=tools/poprawki_krok3/staging CDP_PORT=9671 node tests/$t.js > tools/poprawki_krok3/tmp/t_${t}_after.txt 2>&1
done
echo done > tools/poprawki_krok3/tmp/tests_done.txt
