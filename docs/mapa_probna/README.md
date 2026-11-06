# Mapy próbne A (990) i B (991)

Zbudowane z PIECZĄTEK (`tools/mapy/pieczatki/`), wyciętych z 4 wzorców gracza (Map013, Map159, Map008, Map003), według `docs/mapy/WZORCE.md`.
Obie mapy 64x60 kratek, rysowane z JEDNEGO płótna 128x60 (`tools/mapa_probna/zbuduj.py`), więc szew A|B (kolumny 54..73 płótna) jest niewidoczny:
w strefie szwu tylko grunt wspólny dla zestawów 9 i 11 (A2 16-33, 36-45, mapowanie 1:1), bez zdarzeń i obiektów z kafli, ścieżka przechodzi przez szew.
Położenie w świecie: A x0=2000, B x0=2064, y0=0, linki E/W na całej wspólnej krawędzi (`Swiat_Data.js`); nie łączą się z resztą świata.

**A (Map990, zestaw 11, styl 013/159/008)**: zatoka morska w rogu NW z brzegiem schodkowym (`<Water:salt>`, 990 dopisane do `BRZEG_MAPS` w CzerwonaWoda.js:
zaokrąglony brzeg jak na 159); półka skalna ze schodami (`polka_prosta_a`); wzgórze z klifem (`wzgorze_a`); plama ziemi z rumoszem i skałami
(`plama_ziemi_a`); ścieżka z rozwidleniem (`sciezka_rozwidlenie`); kępy sosen i skraj lasu; sad dzikich jabłoni (miejsce zbierania, `sad_jabloni`);
suche koryto (`koryto_suche`); zagroda z płotu A2-22 z furtką (przerwa 3 kratek); koniec muru z basztą i przerwą bramy (`mur_baszta_brama`) przy dolnej krawędzi;
ciemniejsze plamy trawy (A2-27) i kępki trawy (A2-21) jako jedyny „szum”.

**B (Map991, zestaw 9, styl 003)**: gęsty las sosnowy z jabłoniami (`las_geste_jar`), pole skał i zarośli (`skaly_rumowisko`), kamienne wzgórze-pierścień
(`wzgorze_ruiny_jar`), sad (`sad_jabloni`), zagroda z furtką (A2-22 + region 2, bo zestaw 9 nie ma flag przejścia), kępy sosen, suche koryto, skraj lasu, plamy ziemi.
Zestaw 9 nie ma kafla A2-47 (skalna półka), więc B nie ma półki ze schodami ani morza: tylko wzgórze-pierścień z Map003.

Zrzuty z gry (`gra/`): `ekran_<mapa>_<y>_<x>.png` (środek ekranu w kratce x, y; siatka 3x4 ekranów na mapę), `styk_A_przed.png`, `styk_B_po.png`,
`styk_A_po_powrocie.png` (przejście A->B->A). Przegląd: `mapa_990_calosc.png`, `mapa_991_calosc.png`; porównanie z wzorcami: `porownanie_z_wzorcami.png`.
Powtórzenie: `python tools/mapa_probna/zbuduj.py`, `python tools/mapa_probna/install.py --nakladka`, potem
`GAME_OVERLAY=tools/mapa_probna/staging/nakladka GAME_OVERLAY_JS=1 CDP_PORT=9412 node tests/mapa_probna_zrzuty.js`.

Kontrola: `python tools/mapa_probna/kontrole.py` (estetyka a-e: 0 błędów obu map, układ świata z wspólną krawędzią), `python tools/mapy/kontrola.py 990 991 --dane tools/mapa_probna/staging/data`
(A: 0 uwag; B: 0 uwag poza informacjami D4 o skałach w polu skał). Wydajność: `tests/mapa_probna_wydajnosc.js` i `tests/wydajnosc_test.js` (16/16).
