# Testy (Tawerna)

Testy end-to-end: uruchamiają prawdziwą grę w headless Edge (przez CDP, `cdp.js`) i sprawdzają
zachowanie wtyczek — bez żadnych mocków silnika RPG Makera.

## Uruchomienie

1. Serwer gry z korzenia projektu (jeden na cały czas pracy, w tle):
   ```
   python -m http.server 8765 --bind 127.0.0.1
   ```
2. Cała paczka testów albo wybrane:
   ```
   tests/run.sh
   tests/run.sh keys_test hut_test bucket_test
   ```
   Wynik: `tests/results.txt` (skrót) + `tests/out_<test>.txt` (pełny log każdego testu).

`cdp.js` oczekuje Edge pod `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` —
zmień stałą `EDGE` na górze pliku, jeśli u kogoś jest gdzie indziej.

## Pisanie nowego testu

Każdy plik `*_nazwa_test.js` jest samodzielny: startuje przeglądarkę, ładuje `index.html`,
wchodzi w nową grę, robi serię `check(opis, warunek, dodatkoweInfo)` i na końcu wypisuje
`N/M passed`. `tests/run.sh` bez argumentów łapie każdy plik pasujący do `*_test.js`
automatycznie — nowy test nie wymaga dopisywania go nigdzie indziej.

Najprostszy sposób na nowy test: skopiuj nagłówek (boot gry, `frames`, `J`, `waitMap`, `setN`,
`key`/`press`) z istniejącego testu, np. [keys_test.js](keys_test.js) albo
[hut_test.js](hut_test.js) — ten sam szablon powtarza się we wszystkich, celowo nie jest
wydzielony do wspólnego pliku (każdy test ma inaczej dobrany zestaw pomocników).

## Co NIE jest tu trzymane

Jednorazowe skrypty, które wprowadzały dany fragment gry (`patch_*.py`, `install_*.py`,
generowanie grafik PixelLabem, zrzuty ekranu do ocenienia „na oko") zostają w scratchpadzie
sesji, w której powstały — to narzędzia jednorazowe, nie regresja do trzymania w repo.
