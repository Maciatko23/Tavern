# Testy (Tawerna)

Testy end-to-end: uruchamiają prawdziwą grę w headless Edge (przez CDP, `cdp.js`) i sprawdzają
zachowanie wtyczek — bez żadnych mocków silnika RPG Makera.

## Uruchomienie

Pełny opis: [docs/TESTY.md](../docs/TESTY.md). W skrócie - serwer gry z korzenia projektu (jeden, w tle):
```
node tools/serve.js      (tests/run.js starts it by itself when nothing answers on 8765)
```
i dalej:
```
node tests/run.js smoke          szybki zestaw (~6 min)
node tests/run.js full           wszystkie *_test.js
node tests/run.js unit           logika bez przeglądarki (tests/unit/)
node tests/run.js keys_test hut  wybrane
```
Wynik: `tests/results.txt` (skrót + tabela) + `tests/out_<test>.txt` (pełny log każdego testu).
Stary `tests/run.sh` też działa.

`cdp.js` oczekuje Edge pod `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` -
zmień stałą `EDGE` na górze pliku, jeśli u kogoś jest gdzie indziej.

## Pisanie nowego testu

Nowe testy piszemy na kicie `tests/lib/kit.js` (start gry, nowa gra, pomocnicy, podsumowanie
`N/M passed`) - przykład i lista funkcji w [docs/TESTY.md](../docs/TESTY.md); gotowe wzory:
[bubbles_test.js](bubbles_test.js), [needs_test.js](needs_test.js), [quest_board_test.js](quest_board_test.js).
Każdy plik `*_test.js` łapie `node tests/run.js full` automatycznie. Starsze testy mają jeszcze własny,
skopiowany nagłówek - działają jak dawniej.

Zapisane gry do wczytania w testach: `tests/fixtures/` (`t.loadFixture("day40_farm")`).
Czysta logika bez przeglądarki: `tests/unit/*.test.js` (`tests/lib/unit.js`, `tests/lib/sandbox.js`).

## Co NIE jest tu trzymane

Jednorazowe skrypty, które wprowadzały dany fragment gry (`patch_*.py`, `install_*.py`,
generowanie grafik PixelLabem, zrzuty ekranu do ocenienia „na oko") zostają w scratchpadzie
sesji, w której powstały — to narzędzia jednorazowe, nie regresja do trzymania w repo.
