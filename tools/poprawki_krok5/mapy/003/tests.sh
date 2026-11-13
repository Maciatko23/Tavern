#!/bin/bash
cd /c/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna
OUT=tools/poprawki_krok5/mapy/003/tmp/testy; mkdir -p $OUT
for T in laki_przejscia hunting fruit_tree; do
  for O in bez nakl; do
    if [ $O = nakl ]; then OV=tools/poprawki_krok5/mapy/003/staging; else OV=""; fi
    GAME_OVERLAY="$OV" CDP_PORT=9705 timeout -k 5 200 node tests/${T}_test.js > $OUT/${T}_$O.txt 2>&1
    echo "exit $?" >> $OUT/${T}_$O.txt
    powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { \$_.CommandLine -match '9705' -and \$_.Name -eq 'msedge.exe' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force }" >/dev/null 2>&1
  done
done
echo done > $OUT/KONIEC
