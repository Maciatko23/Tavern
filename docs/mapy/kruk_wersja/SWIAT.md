# Świat Kruczej Wyspy w kratkach

2026-10-30. **PROJEKT do oceny.** W `data/` ani `js/` nic nie zmieniłem. Narzędzia (`tools/mapy/`): `swiat_kratki.py` (układ, maska, `swiat.json`), `swiat_obrazy.py` (obrazki), `swiat_opis.py` (ten plik), `swiat_krawedzie.py` (**sprawdzanie krawędzi do etapów**).

Obrazki w `docs/mapy/`:

- `swiat_podglad.png`: **ładny podgląd całej wyspy** (bez ramek technicznych): tak będzie wyglądać świat i mapa w menu. Gładki brzeg, suche koryto rzeki (bez wody) poszerzające się ku ujściu, drogi o stałej szerokości.
- `swiat_kratki.png`: rysunek techniczny. Mapy jako miniatury z prawdziwych kafli, nowe w pomarańczowych ramkach, droga, suche koryto rzeki, linia brzegu (zielona tam, gdzie leży na mapie), **czerwone pola = tu będzie morze (pusty teren)**, żółte = wybrzuszenie lądu wokół treści.
- `swiat_kratki_podzial.png`: sam podział na mapy (puzzle): numery, rozmiary, krawędzie (zielone przejście, niebieskie morze, brązowa ściana, szare wspólne).
- `swiat_zblizenia.png`: **zbliżenia trzech styków map z brzegiem**: obie mapy obok siebie, biała linia brzegu przechodzi przez krawędź w tej samej kratce i pod tym samym kątem.
- `swiat.json`: dane do budowy (położenie map, odcinki krawędzi z sąsiadami, przejścia, suche koryto, brzeg na każdej krawędzi, treść w pasie morza, obecne wyjścia i ich los). `swiat_maska.png`: maska lądu świata (po wybrzuszeniach).

## Jak działa świat w kratkach

- Jedna siatka kratek: sylwetka kruka z Atlasu (`kruk_maska.png`), skala **0,70 kratki na piksel Atlasu** (zostaje: tak puzzle pasują, mniejsza skala wymusza nakładanie, większa zostawia puste brzegi), świat 940 x 600 kratek (sama sylwetka 752 x 444). Kratka świata = kratka maski + przesunięcie (80, 60).
- Mapa to prostokątny **wycinek świata** (x0, y0, szer., wys.). Sąsiedzi dzielą krawędź co do kratki; przejście z kratki (X, Y) prowadzi do **tej samej kratki świata** w sąsiedniej mapie. Na jednej krawędzi może być kilku sąsiadów (odcinki). Krawędź bez sąsiada to morze albo ściana (klif, gęsty las, góry); wspólna krawędź bez drogi to też ściana.
- **Brzeg z jednej maski**: sylwetkę wygładzono (łuki, zatoki, cyple, bez schodków), więc linia brzegu przechodzi przez granice map bez skoku. Linia brzegu leży na mapach w **99.0%**.
- **Brzeg omija treść.** Za treść uznaję: budynki i ich ogrodzenia (`<Occupy>`), drzwi do wnętrz, zdarzenia z tagami wtyczek (`Town`, `Garnizon`, `Wyspa`, `Wrak`, `Latarnia`, `Studnia`, `Zagroda`), lampy, obozy, nory, studnie, krzyże, namioty, kuter, bramy, wozy, stragany, ule, gniazda itp. (nazwa). **Nie** liczę drzew, krzaków, kamieni, kłód i pni (zasoby; pod morzem zniknęłyby razem z lądem). Wokół treści z pasa morza ląd się wybrzusza (wypukła obwiednia, wygładzona): 13476 kratek lądu dołożone do sylwetki. Obecnych zdarzeń z treścią: 993, w pasie morza surowej sylwetki leżało 163, **w morzu po wybrzuszeniu: 0**.

## Uproszczona sylwetka (gracz: kształt tylko z grubsza)

Priorytet to połączenia i porządek, kruk ma być tylko z grubsza. Sylwetkę uproszczono (zamknięcie r=11 i otwarcie r=6 maski, potem łagodne wygładzenie): **usunięte** wąskie pióra i palce lądu (postrzępiony dół ogona pod Leśną drogą, palce pod prawym skrzydłem przy Łące#2), zatoczka wcięta w lewe skrzydło przy Łące#3 i inne wąskie wcięcia oraz cypelki; brzeg jest spokojny, z łagodnymi łukami, także na stykach map. **Zostało:** zatoka pod lewym skrzydłem z wejściem do basenu Przystani od zachodu, głowa z Orlą Granią, cypel z latarnią, wrak i wszystko, co ma treść (wokół treści brzeg wybrzusza się łagodnie). Mniej map: powiększam obecne mapy spoza listy gracza (w prawo i w dół) zamiast dokładać nowe: **nowych map było 13, jest 11**; mapy z samym lasem i brzegiem są tylko tam, gdzie brzeg nie dochodzi do żadnej obecnej mapy; bez mikro-map (najmniejsza 60 x 40).

## Najważniejsze liczby

- Obecnych map plenerowych: 21. **Rosną: 9** (111 Podgrodzie +10/+0, 21 Leśna droga +10/+0, 18 Łąka#3 +10/+0, 155 Pustelnia na klifie +0/+42, 157 Urwisko Kruków +10/+0, 22 Polna droga +5/+0, 20 Dom dziadka +20/+0, 17 Łąka#2 +30/+0, 168 Spalona zagroda +0/+10). **Nowych map: 11** (poprzednia wersja miała 13; rozmiary od 60 x 40, bez mikro-map).
- **Morza do domalowania na obecnych mapach: 25443 kratek**, wszystko na pustym terenie (las, łąka, skały): zero zdarzeń z treścią. Zasoby (drzewa, kamienie), które znikną pod morzem, są wypisane przy każdej mapie.
- **Droga z domu dziadka do miasta: 20 -> 3 -> 24 -> 8** (4 mapy, czyli 2 pośrednie): Dom dziadka dotyka Kruczego Jaru od południa, Kruczy Jar Posiadłości Lorda od wschodu, a ta miasta.
- Obecnych wyjść między mapami plenerowymi: 39. **Zostaje w tej samej kratce: 10**, ta sama krawędź z nowym celem: 22, przesunięte: 1, zamyka się (morze lub ściana): 6.
- **Sprawdzanie krawędzi** (`python tools/mapy/swiat_krawedzie.py`): 52 wspólnych krawędzi, niezgodności drogi/rzeki: **0**, największe przesunięcie przecięcia brzegu na granicy map: **3 kratek**, treść w morzu: **0**.

## Brzeg na wspólnych krawędziach

Dla każdej wspólnej krawędzi, przez którą przechodzi brzeg: kratka świata, w której linia brzegu ją przecina (y dla krawędzi pionowej, x dla poziomej), przejście (ląd -> morze albo odwrotnie) i kierunek: kąt linii brzegu (0° = w prawo, 90° = w górę) z pola maski. Obie mapy czytają jedną maskę, więc przecięcie wypada w tej samej kratce i pod tym samym kątem (przesunięcie przecięcia między ostatnią kolumną jednej mapy a pierwszą drugiej: co najwyżej 3 kratek, to nachylenie brzegu; kąty z lokalnych pomiarów obu stron są w `swiat.json`, pola `kat_a`, `kat_b`).

| krawędź | strona A | odcinek (kratki świata) | brzeg przecina w kratce | przejście | kąt brzegu |
|---|---|---|---|---|---|
| 175 Orla Grań <-> 13 Góry i kamieniołom | południowa | x 404-500 | x = 405 | morze->ląd | 58.6° |
| 175 Orla Grań <-> 13 Góry i kamieniołom | południowa | x 404-500 | x = 490 | ląd->morze | 104.9° |
| 13 Góry i kamieniołom <-> 120 Osada Milczących | wschodnia | y 124-192 | y = 151 | morze->ląd | 75.1° |
| 125 Przystań <-> N910 | południowa | x 420-440 | x = 435 | morze->ląd | 60.3° |
| 111 Podgrodzie <-> N917 | południowa | x 318-418 | x = 396 | morze->ląd | 82.0° |
| 21 Leśna droga <-> N914 | południowa | x 440-500 | x = 441 | morze->ląd | 124.5° |
| 21 Leśna droga <-> N914 | południowa | x 440-500 | x = 457 | ląd->morze | 63.4° |
| 165 Wrak na mieliźnie <-> 162 Garnizon nad zatoką | wschodnia | y 305-340 | y = 313 | ląd->morze | 1.5° |
| 162 Garnizon nad zatoką <-> 111 Podgrodzie | wschodnia | y 260-340 | y = 333 | ląd->morze | 158.9° |
| 155 Pustelnia na klifie <-> 157 Urwisko Kruków | wschodnia | y 146-216 | y = 148 | morze->ląd | 15.1° |
| 157 Urwisko Kruków <-> 13 Góry i kamieniołom | wschodnia | y 144-216 | y = 150 | morze->ląd | 66.8° |
| 120 Osada Milczących <-> 159 Przylądek z latarnią | wschodnia | y 124-192 | y = 144 | morze->ląd | 71.2° |
| 20 Dom dziadka <-> 17 Łąka#2 | wschodnia | y 312-356 | y = 339 | ląd->morze | 152.4° |
| 159 Przylądek z latarnią <-> N900 | południowa | x 689-724 | x = 701 | ląd->morze | 152.7° |
| 168 Spalona zagroda <-> N915 | południowa | x 796-856 | x = 817 | ląd->morze | 54.2° |
| N900 <-> 168 Spalona zagroda | wschodnia | y 208-252 | y = 226 | morze->ląd | 145.8° |
| N901 <-> 125 Przystań | południowa | x 524-532 | x = 529 | ląd->morze | 59.2° |
| N901 <-> 20 Dom dziadka | wschodnia | y 312-354 | y = 347 | ląd->morze | 4.7° |
| N910 <-> 21 Leśna droga | wschodnia | y 434-494 | y = 491 | ląd->morze | 120.4° |
| N911 <-> 18 Łąka#3 | południowa | x 66-136 | x = 72 | morze->ląd | 21.5° |
| N911 <-> 18 Łąka#3 | południowa | x 66-136 | x = 87 | ląd->morze | 165.6° |
| N911 <-> 18 Łąka#3 | południowa | x 66-136 | x = 96 | morze->ląd | 32.1° |
| N911 <-> 155 Pustelnia na klifie | wschodnia | y 165-225 | y = 167 | morze->ląd | 76.3° |
| N911 <-> 155 Pustelnia na klifie | wschodnia | y 165-225 | y = 184 | ląd->morze | 89.4° |
| N911 <-> 155 Pustelnia na klifie | wschodnia | y 165-225 | y = 186 | morze->ląd | 62.7° |
| N912 <-> 168 Spalona zagroda | południowa | x 784-864 | x = 796 | morze->ląd | 13.7° |
| N912 <-> 168 Spalona zagroda | południowa | x 784-864 | x = 845 | ląd->morze | 100.4° |
| N913 <-> 120 Osada Milczących | południowa | x 560-620 | x = 565 | morze->ląd | 13.7° |
| N913 <-> 120 Osada Milczących | południowa | x 560-620 | x = 600 | ląd->morze | 134.3° |
| N916 <-> 175 Orla Grań | wschodnia | y 84-120 | y = 91 | ląd->morze | 128.1° |
| N916 <-> 13 Góry i kamieniołom | wschodnia | y 120-144 | y = 123 | morze->ląd | 70.8° |
| N916 <-> 13 Góry i kamieniołom | wschodnia | y 120-144 | y = 134 | ląd->morze | 127.5° |
| N916 <-> 157 Urwisko Kruków | południowa | x 284-404 | x = 296 | morze->ląd | 16.6° |
| N916 <-> 157 Urwisko Kruków | południowa | x 284-404 | x = 321 | ląd->morze | 161.9° |
| N918 <-> 155 Pustelnia na klifie | południowa | x 186-246 | x = 197 | morze->ląd | 16.6° |
| N918 <-> 155 Pustelnia na klifie | południowa | x 186-246 | x = 217 | ląd->morze | 165.6° |

Pełne dane są w `swiat.json`, pole `brzeg_na_krawedziach`.

## Mapy gracza: dokładna lista zmian (do Twojej zgody)

Mapy gracza: 3, 4, 8, 13, 23, 24, 111. Kratki podaję lokalnie (w mapie, od lewego górnego rogu) i w świecie. **Morze jest tylko na pustym terenie**, zero zdarzeń z treścią.

### 8 Okolice Tawerny

- Świat: x0 = 420, y0 = 216, rozmiar 104 x 138 (tułów). Rośnie: nie.
- Morze: 0 kratek (cała mapa to ląd).
- Treść, która leżała w pasie morza surowej sylwetki: żadna. Po wybrzuszeniu w morzu: 0.
- Krawędź południowa, kratki x 24-26 (świat x 444-446): dziś do 22 Polna droga (lądowanie (12,1)); **po zmianie do 125 Przystań**, lądowanie w tej samej kratce świata, lokalnie (24,1); (25,1); (26,1).
- Krawędź wschodnia, kratki y 50-51 (świat y 266-267): **bez zmian**, nadal do 24 Posiadłość Lorda.
- Krawędź zachodnia, kratki y 50-51 (świat y 266-267): **bez zmian**, nadal do 111 Podgrodzie.
- **NOWE wyjście**: krawędź północna, kratki x 49-51 (świat x 469-471), do 13 Góry i kamieniołom (Szlak górski).
- **NOWE wyjście**: krawędź wschodnia, kratki y 17-19 (świat y 233-235), do 22 Polna droga (Droga polna).

### 24 Posiadłość Lorda

- Świat: x0 = 524, y0 = 252, rozmiar 80 x 60 (prawe skrzydło). Rośnie: nie.
- Morze: 0 kratek (cała mapa to ląd).
- Treść, która leżała w pasie morza surowej sylwetki: żadna. Po wybrzuszeniu w morzu: 0.
- Krawędź zachodnia, kratki y 14-16 (świat y 266-268): **bez zmian**, nadal do 8 Okolice Tawerny.
- **NOWE wyjście**: krawędź wschodnia, kratki y 14-16 (świat y 266-268), do 3 Kruczy Jar (Droga do dworu i do pola).

### 3 Kruczy Jar

- Świat: x0 = 604, y0 = 252, rozmiar 80 x 60 (prawe skrzydło). Rośnie: nie.
- Morze: 0 kratek (cała mapa to ląd).
- Treść, która leżała w pasie morza surowej sylwetki: żadna. Po wybrzuszeniu w morzu: 0.
- Krawędź północna, kratki x 28-31 (świat x 632-635): **bez zmian**, nadal do 4 Łąka#1.
- Krawędź południowa, kratki x 8-10 (świat x 612-614): dziś do 17 Łąka#2 (lądowanie (9,1)); **po zmianie do 20 Dom dziadka**, lądowanie w tej samej kratce świata, lokalnie (8,1); (9,1); (10,1).
- Krawędź zachodnia, kratki y 14-16 (świat y 266-268): dziś do 18 Łąka#3 (lądowanie (78,15)); **po zmianie do 24 Posiadłość Lorda**, lądowanie w tej samej kratce świata, lokalnie (78,14); (78,15); (78,16).
- Krawędź wschodnia, kratki y 12-14 (świat y 264-266): **bez zmian**, nadal do 23 Skraj lasu.

### 4 Łąka#1

- Świat: x0 = 609, y0 = 192, rozmiar 80 x 60 (prawe skrzydło). Rośnie: nie.
- Morze: 0 kratek (cała mapa to ląd).
- Treść, która leżała w pasie morza surowej sylwetki: żadna. Po wybrzuszeniu w morzu: 0.
- Krawędź południowa, kratki x 23-26 (świat x 632-635): **bez zmian**, nadal do 3 Kruczy Jar.

### 23 Skraj lasu

- Świat: x0 = 684, y0 = 252, rozmiar 80 x 60 (prawe skrzydło). Rośnie: nie.
- Morze: 0 kratek (cała mapa to ląd).
- Treść, która leżała w pasie morza surowej sylwetki: żadna. Po wybrzuszeniu w morzu: 0.
- Krawędź zachodnia, kratki y 12-14 (świat y 264-266): **bez zmian**, nadal do 3 Kruczy Jar.
- Krawędź północna, kratki x 23-25 (świat x 707-709): dziś do 22 Polna droga (lądowanie (24,58)); **po zmianie do 900 Pola pod grzbietem**, lądowanie w tej samej kratce świata, lokalnie (18,58); (19,58); (20,58).
- **NOWE wyjście**: krawędź południowa, kratki x 39-41 (świat x 723-725), do 17 Łąka#2 (Droga łąk).

### 13 Góry i kamieniołom

- Świat: x0 = 404, y0 = 120, rozmiar 120 x 96 (barki / góry). Rośnie: nie.
- **Morze: 1435 kratek (12.5%)** na pustym terenie: 1407 kratek w prostokącie x 86-119, y 0-55; 27 kratek w prostokącie x 0-2, y 15-27.
- Treść, która leżała w pasie morza surowej sylwetki: Brama Milczących (1): #6. Po wybrzuszeniu w morzu: 0.
- Zasoby pod morzem (drzewa, kamienie, kłody): 28, znikną.
- Krawędź zachodnia, kratki y 38-40 (świat y 158-160): dziś do 21 Leśna droga (lądowanie (78,9)); **po zmianie do 157 Urwisko Kruków**, lądowanie w tej samej kratce świata, lokalnie (120,14); (120,15); (120,16).
- Krawędź północna, kratki x 5-7 (świat x 409-411): dziś do 120 Osada Milczących (lądowanie (20,31)); **po zmianie do 175 Orla Grań**, lądowanie w tej samej kratce świata, lokalnie (5,58); (6,58); (7,58).
- Krawędź wschodnia, kratki y 11-13 (świat y 131-133): dziś do 159 Przylądek z latarnią (lądowanie (30,78)); **po zmianie do 120 Osada Milczących**, lądowanie w tej samej kratce świata, lokalnie (1,7); (1,8); (1,9).
- **NOWE wyjście**: krawędź południowa, kratki x 65-67 (świat x 469-471), do 8 Okolice Tawerny (Szlak górski).
- **Szlak górski**: z północnej bramy miasta (8, krawędź północna, x 49-51 lokalnie) przez Góry do Orlej Grani: w 13 wchodzi południową krawędzią w kratce świata x ok. 470 i wychodzi północną (do 175) w x ok. 464, wspólna krawędź 13 / 175 to droga (zamiast wspinaczki).

### 111 Podgrodzie

- Świat: x0 = 318, y0 = 249, rozmiar 102 x 112 (lewe skrzydło). Rośnie: **+10 kolumn wstawionych przed murem, od x 90** (wariant z jednym murem niżej).
- **Morze: 2658 kratek (25.8%)** na pustym terenie: 2658 kratek w prostokącie x 0-84, y 74-111.
- Treść, która leżała w pasie morza surowej sylwetki: Dym z komina (1): #93; Drzwi (zamknięte): Chata pod lasem (1): #94. Po wybrzuszeniu w morzu: 0.
- Zasoby pod morzem (drzewa, kamienie, kłody): 54, znikną.
- Krawędź wschodnia, kratki y 17-18 (świat y 266-267): nadal do 8 Okolice Tawerny, **w tej samej kratce świata, ale na nowej krawędzi mapy (x 101 zamiast 91)**, patrz niżej.
- Krawędź zachodnia, kratki y 19 (świat y 268): dziś do 125 Przystań (lądowanie (110,19)); **po zmianie do 162 Garnizon nad zatoką**, lądowanie w tej samej kratce świata, lokalnie (110,8).
- **Wariant z jednym murem: 10 kolumn wstawionych PRZED murem, od x 90 (nic nie zapisuję, tylko opis).** Mapa rośnie z 92 do 102 kolumn. Nowe kolumny x 90-99 (cała wysokość, 112 rzędów) to czysty grunt i **suche koryto (fosa) przed murem po stronie Podgrodzia**; pas muru i bramy, który dziś stoi na x 90-91, **przesuwa się o +10 na x 100-101, czyli na nowy wschodni brzeg**, i dalej styka się z murem Okolic Tawerny jak dziś. Wychodzi jeden mur z fosą przed nim, a brama stoi po właściwej stronie fosy.
- **Co dokładnie się przesuwa (+10 kolumn, tylko to):** kafle muru z x 90-91 we wszystkich rzędach; zdarzenia bramy zachodniej i muru: #19 Pochodnia na baszcie (90,13) -> (100,13); #90 Brama zachodnia: skrzydło i cień (90,18) -> (100,18); #91 Brama zachodnia: światło latarni (91,16) -> (101,16); #89 Brama zachodnia: dach i słupy (91,19) -> (101,19); przejścia #65 (91,17) -> (101,17) i #66 (91,18) -> (101,18), które w tej samej kratce świata (y 266-267) prowadzą do Okolic Tawerny (8); oraz zasoby na x 90: Drzewo #111 (90,84) -> (100,84), Drzewo #254 (90,88) -> (100,88), Suchy krzaczek #290 (90,101) -> (100,101).
- **Zostaje na swoich miejscach (x 89 i mniej, placyk przed bramą):** #18 Latarnia przy bramie (88,19); #20 Posłanie żebraka (88,14); #67 Drogowskaz: Podgrodzie (86,15); #70 Miejsce: brama_zach (87,18); #71 Miejsce: zebrak (89,16); #72 Miejsce: zebrak_noc (89,14); #400 Miejsce: w5_lada (89,17); płot (ok. x 85) i wszystkie budynki, drzewa i zdarzenia o x < 90 (np. Beczki #316 (84,16)).
- **Fosa i most:** suche koryto leży w x 90-99 (6-8 kratek dna ze skarpami, 1-2 kolumny gruntu po bokach), przed murem po stronie Podgrodzia. **Most z placyku przed bramą (x 89) do bramy (x 100)**: kamienny, 10 kratek długości i 4 szerokości (lokalnie y 16-19), czyli na wysokości bramy. **Poniżej linii murów** (rzędy y 20-111) koryto biegnie dalej w tych samych kolumnach x 90-99 na południe, do dolnej krawędzi mapy i dalej do basenu Przystani. Wschodnie wyjście stoi więc na x 101 (kratki y 17-18, tak jak dziś, tylko 10 kolumn dalej).
- Poza tym nic w Map111 się nie rusza: te same budynki, ulice, płot, wnętrza i zadania. Gdyby wstawienie 10 kolumn było nie do przyjęcia, alternatywa: koryto w pasie x 86-89 (4 wolne kolumny między płotem a murem, tylko do y ok. 66, dalej budynki), czyli bez miejsca na mostek i fosę, więc nie polecam.

## Tabela map

| mapa | część kruka | x0, y0 | rozmiar | rośnie | morze do domalowania | zasoby pod morzem | woda poza maską |
|---|---|---|---|---|---|---|---|
| 8 Okolice Tawerny * | tułów | 420, 216 | 104 x 138 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 24 Posiadłość Lorda * | prawe skrzydło | 524, 252 | 80 x 60 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 111 Podgrodzie * | lewe skrzydło | 318, 249 | 102 x 112 | +10 w prawo, +0 w dół | 2658 kratek (25.8%) | 54 | 0 (0.0%) |
| 125 Przystań | ogon | 420, 354 | 112 x 80 | nie | 969 kratek (10.8%) | 26 | 449 (5.0%) |
| 22 Polna droga | prawe skrzydło | 524, 192 | 85 x 60 | +5 w prawo, +0 w dół | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 20 Dom dziadka | prawe skrzydło | 604, 312 | 80 x 44 | +20 w prawo, +0 w dół | 885 kratek (33.5%) | 28 | 0 (0.0%) |
| 21 Leśna droga | ogon | 440, 434 | 90 x 60 | +10 w prawo, +0 w dół | 979 kratek (20.4%) | 51 | 0 (0.0%) |
| 13 Góry i kamieniołom * | barki / góry | 404, 120 | 120 x 96 | nie | 1435 kratek (12.5%) | 28 | 0 (0.0%) |
| 120 Osada Milczących | prawe skrzydło | 524, 124 | 96 x 68 | nie | 385 kratek (5.9%) | 18 | 257 (3.9%) |
| 175 Orla Grań | głowa | 404, 60 | 96 x 60 | nie | 1541 kratek (26.8%) | 57 | 35 (0.6%) |
| 23 Skraj lasu * | prawe skrzydło | 684, 252 | 80 x 60 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 168 Spalona zagroda | prawe skrzydło | 764, 208 | 100 x 98 | +0 w prawo, +10 w dół | 3536 kratek (40.2%) | 62 | 494 (5.6%) |
| 3 Kruczy Jar * | prawe skrzydło | 604, 252 | 80 x 60 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 4 Łąka#1 * | prawe skrzydło | 609, 192 | 80 x 60 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 17 Łąka#2 | prawe skrzydło | 684, 312 | 110 x 76 | +30 w prawo, +0 w dół | 2637 kratek (43.4%) | 94 | 0 (0.0%) |
| 18 Łąka#3 | lewe skrzydło | 46, 225 | 90 x 76 | +10 w prawo, +0 w dół | 805 kratek (13.2%) | 39 | 94 (1.5%) |
| 162 Garnizon nad zatoką | lewe skrzydło | 206, 260 | 112 x 80 | nie | 2613 kratek (29.2%) | 56 | 472 (5.3%) |
| 165 Wrak na mieliźnie | lewe skrzydło | 126, 305 | 80 x 60 | nie | 143 kratek (3.0%) | 1 | 825 (17.2%) |
| 155 Pustelnia na klifie | lewe skrzydło | 186, 146 | 96 x 114 | +0 w prawo, +42 w dół | 361 kratek (5.2%) | 15 | 515 (7.5%) |
| 157 Urwisko Kruków | lewe skrzydło | 282, 144 | 122 x 72 | +10 w prawo, +0 w dół | 636 kratek (7.9%) | 19 | 182 (2.3%) |
| 159 Przylądek z latarnią | prawe skrzydło | 620, 112 | 104 x 80 | nie | 2800 kratek (33.7%) | 95 | 372 (4.5%) |

`*` = mapa gracza. Woda poza maską to woda w mapie tam, gdzie świat ma ląd (staw, rzeczka z mapy): zostaje. Basen Przystani jest morzem z maski.

## Co leży w pasie do zalania (treść), mapa po mapie

Dla każdej obecnej mapy: ile kratek morza i jakie zdarzenia z treścią wypadły w pasie morza surowej sylwetki kruka. Wszystkie są **chronione wybrzuszeniem lądu**, w morzu po zmianie: **0**.

- **8 Okolice Tawerny**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **24 Posiadłość Lorda**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **111 Podgrodzie**: morze 2658 kratek (25.8%). W pasie: Dym z komina (1): #93; Drzwi (zamknięte): Chata pod lasem (1): #94. W morzu po zmianie: 0.
- **125 Przystań**: morze 969 kratek (10.8%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **22 Polna droga**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **20 Dom dziadka**: morze 1242 kratek (33.5%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **21 Leśna droga**: morze 1432 kratek (20.4%). W pasie: Kamienny kopiec (1): #343. W morzu po zmianie: 0.
- **13 Góry i kamieniołom**: morze 1435 kratek (12.5%). W pasie: Brama Milczących (1): #6. W morzu po zmianie: 0.
- **120 Osada Milczących**: morze 385 kratek (5.9%). W pasie: Drzwi chaty 1 (1): #1; Drzwi chaty 2 (1): #3; Drzwi chaty 3 (1): #5; Boczne drzwi chaty 3 (1): #6; EV003 (1): #7; EV008 (1): #8; EV009 (1): #9; Drzwi chaty 4 (1): #10; Kamień kręgu (8): #12, #13, #14, #15, #268, #273 ...; Kopczyk milczenia (3): #17, #18, #22; Słup z zaszytymi ustami (2): #19, #20; Latarnia przy drzwiach (2): #27, #28; Milczący przy ścianie (1): #86; Milcząca przy ścianie (1): #87; Najstarszy z Milczących (1): #88; Milcząca przy grządce (1): #89; Miejsce: osada_wejscie (1): #90; Miejsce: osada_krag (1): #91; Miejsce: osada_sciana (1): #92; Miejsce: osada_grum (1): #93; Miejsce: osada_starszy (1): #94; Miejsce: osada_dom_1 (1): #95; Miejsce: osada_dom_2 (1): #96; Miejsce: osada_dom_3 (1): #97; Miejsce: osada_dom_4 (1): #98. W morzu po zmianie: 0.
- **175 Orla Grań**: morze 1541 kratek (26.8%). W pasie: Kamienny kopiec (1): #49; Miejsce: orzel_wejscie (1): #56; Miejsce: orzel_jajo (1): #57; Miejsce: orzel_orlica (1): #58; Miejsce: orzel_strzaly (1): #59; Miejsce: orzel_misa (1): #60; Miejsce: orzel_plyta (1): #61; Miejsce: orzel_oboz (1): #62; Miejsce: orzel_klatka (1): #63; Miejsce: orzel_ladowisko (1): #64. W morzu po zmianie: 0.
- **23 Skraj lasu**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **168 Spalona zagroda**: morze 4005 kratek (40.2%). W pasie: Resztki stodoły (1): #1; Stara studnia (zasypana) (1): #2; Krzyż: Jan Ług (1): #3; Kamienny kopiec (3): #32, #198, #199; Dom Ługów (1): #55. W morzu po zmianie: 0.
- **3 Kruczy Jar**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **4 Łąka#1**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **17 Łąka#2**: morze 4208 kratek (43.4%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **18 Łąka#3**: morze 875 kratek (13.2%). W pasie: Menhir (9): #1, #2, #4, #6, #248, #250 ...; Kamienny kopiec (3): #23, #78, #276. W morzu po zmianie: 0.
- **162 Garnizon nad zatoką**: morze 2613 kratek (29.2%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **165 Wrak na mieliźnie**: morze 143 kratek (3.0%). W pasie: Wrak: dziób (1): #1; Wrak: rufa (1): #2; Blokada: kadłub (37): #3, #4, #5, #6, #7, #8 ...; Dziura w burcie -> Pod pokładem (1): #40; Skrzynie z ładunku (1): #42; Blokada: maszt (1): #44; Miejsce: wrak_janek (1): #50; Miejsce: wrak_przybicie (1): #51; Miejsce: wrak_zolnierz_1 (1): #53; Miejsce: wrak_zolnierz_2 (1): #54. W morzu po zmianie: 0.
- **155 Pustelnia na klifie**: morze 361 kratek (5.2%). W pasie: Dym z komina (2): #1, #6; Drzwi: Skryptorium (1): #2; Wieża skryptorium (1): #3; Wieża skryptorium: podstawa (1): #4; Dzwon w wieży (1): #5; Drzwi (zamknięte): Cela brata Kleofasa (1): #7; Latarenka u drzwi skryptorium (1): #8; Latarenka przy celi (1): #9; Latarnia przy wieży (1): #10; Pusta cysterna na deszczówkę (1): #11; Grób kronikarza (3): #12, #13, #14; Ule brata Kleofasa (1): #16; Ule: miejsce (1): #17; Kopiec z krukiem (1): #18; Kamienny kopiec (1): #22; Rozbita skrzynia (1): #28; Miejsce: skryptorium_drzwi (1): #54; Miejsce: cela_drzwi (1): #55; Miejsce: urwisko (1): #56; Miejsce: lawka (1): #57; Miejsce: ogrodek (1): #58; Miejsce: ule (1): #59; Miejsce: wieza (1): #60. W morzu po zmianie: 0.
- **157 Urwisko Kruków**: morze 776 kratek (7.9%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **159 Przylądek z latarnią**: morze 2800 kratek (33.7%). W pasie: Latarnia (1): #1; Latarnia: mur (5): #2, #3, #4, #48, #52; Dym z komina (1): #5; Drzwi: Izba latarnika (1): #6; Latarenka przy izbie (1): #7; Słup strażnicy zakonu (1): #8; Płyta strażnicy (1): #9; Dzwon mgłowy (1): #10; Beczki tranu (1): #12; Zatoczka szczątków (1): #14; Kamienny kopiec (1): #19; Miejsce: laterna (1): #41; Miejsce: izba (1): #42; Miejsce: izba_sen (1): #43; Miejsce: drewutnia (1): #44; Miejsce: lat_napad (1): #45; Miejsce: lat_oboz (1): #46; Miejsce: lat_dzwon (1): #47. W morzu po zmianie: 0.

## Pozostałe mapy: zmiany wyjść

### 125 Przystań

- Położenie: x0 = 420, y0 = 354, 112 x 80 (ogon), rośnie: nie.
- krawędź wschodnia, y 373: znika (do 111 Podgrodzie).
- krawędź północna, x 434-436: cel z 155 Pustelnia na klifie na 8 Okolice Tawerny.
- krawędź południowa, x 441-443: cel z 162 Garnizon nad zatoką na 21 Leśna droga.

### 22 Polna droga

- Położenie: x0 = 524, y0 = 192, 85 x 60 (prawe skrzydło), rośnie: +5/+0.
- krawędź północna, x 535-537: cel z 8 Okolice Tawerny na 120 Osada Milczących.
- krawędź wschodnia, y 211-213: cel z 21 Leśna droga na 4 Łąka#1.
- krawędź południowa, x 547-549: cel z 23 Skraj lasu na 24 Posiadłość Lorda.
- NOWE przejście do 8 Okolice Tawerny (kratka świata 234, Droga polna).

### 20 Dom dziadka

- Położenie: x0 = 604, y0 = 312, 80 x 44 (prawe skrzydło), rośnie: +20/+0.
- krawędź południowa, x 618-620: znika (do 21 Leśna droga).
- NOWE przejście do 3 Kruczy Jar (kratka świata 614, Droga pola dziadka).

### 21 Leśna droga

- Położenie: x0 = 440, y0 = 434, 90 x 60 (ogon), rośnie: +10/+0.
- krawędź wschodnia, y 442-444: znika (do 13 Góry i kamieniołom).
- krawędź północna, x 459-461: cel z 20 Dom dziadka na 125 Przystań.
- krawędź zachodnia, y 453-455: cel z 22 Polna droga na 910 Zatoczka pod ogonem.

### 120 Osada Milczących

- Położenie: x0 = 524, y0 = 124, 96 x 68 (prawe skrzydło), rośnie: nie.
- krawędź południowa, x 543-545: cel z 13 Góry i kamieniołom na 22 Polna droga.
- NOWE przejście do 13 Góry i kamieniołom (kratka świata 135, Szlak latarni).
- NOWE przejście do 159 Przylądek z latarnią (kratka świata 153, Szlak latarni).

### 175 Orla Grań

- Położenie: x0 = 404, y0 = 60, 96 x 60 (głowa), rośnie: nie.
- NOWE przejście do 13 Góry i kamieniołom (kratka świata 464, Szlak górski).

### 168 Spalona zagroda

- Położenie: x0 = 764, y0 = 208, 100 x 98 (prawe skrzydło), rośnie: +0/+10.
- krawędź wschodnia, y 219-221: znika (do 23 Skraj lasu).

### 17 Łąka#2

- Położenie: x0 = 684, y0 = 312, 110 x 76 (prawe skrzydło), rośnie: +30/+0.
- krawędź północna, x 692-694: cel z 3 Kruczy Jar na 23 Skraj lasu.

### 18 Łąka#3

- Położenie: x0 = 46, y0 = 225, 90 x 76 (lewe skrzydło), rośnie: +10/+0.
- krawędź wschodnia, y 239-241: znika (do 3 Kruczy Jar).

### 162 Garnizon nad zatoką

- Położenie: x0 = 206, y0 = 260, 112 x 80 (lewe skrzydło), rośnie: nie.
- krawędź północna, x 227-229: cel z 125 Przystań na 155 Pustelnia na klifie.
- krawędź zachodnia, y 280-281: znika (do 165 Wrak na mieliźnie).
- NOWE przejście do 111 Podgrodzie (kratka świata 295, Trakt zachodni).

### 165 Wrak na mieliźnie

- Położenie: x0 = 126, y0 = 305, 80 x 60 (lewe skrzydło), rośnie: nie.
- krawędź wschodnia, y 325-326: do 162 Garnizon nad zatoką, lądowanie przesunięte.

### 155 Pustelnia na klifie

- Położenie: x0 = 186, y0 = 146, 96 x 114 (lewe skrzydło), rośnie: +0/+42.
- krawędź południowa, x 209-211: cel z 125 Przystań na 162 Garnizon nad zatoką.
- krawędź wschodnia, y 163-164: bez zmian, do 157 Urwisko Kruków.

### 157 Urwisko Kruków

- Położenie: x0 = 282, y0 = 144, 122 x 72 (lewe skrzydło), rośnie: +10/+0.
- krawędź zachodnia, y 163-164: bez zmian, do 155 Pustelnia na klifie.
- krawędź wschodnia, y 163-164: cel z 159 Przylądek z latarnią na 13 Góry i kamieniołom.

### 159 Przylądek z latarnią

- Położenie: x0 = 620, y0 = 112, 104 x 80 (prawe skrzydło), rośnie: nie.
- krawędź południowa, x 649-651: cel z 13 Góry i kamieniołom na 4 Łąka#1.
- krawędź zachodnia, y 145-146: cel z 157 Urwisko Kruków na 120 Osada Milczących.

## Nowe mapy

Każda stoi przy brzegu, dotyka rodzica i innych sąsiadów całą wspólną krawędzią i ma ścieżkę z rodzicem (do każdego punktu brzegu da się dojść albo go zobaczyć). Brzeg wynika z maski. Bez zadań, bez treści w morzu.

| nr | nazwa | rozmiar | x0, y0 | część kruka | co na niej | wejście z (rodzic) | sąsiedzi |
|---|---|---|---|---|---|---|---|
| 900 | Pola pod grzbietem | 75 x 60 | 689, 192 | prawe skrzydło | pola i łąka za Łąką#1, droga do Spalonej zagrody, widok na wzgórza | 4 Łąka#1 | 4, 23, 159, 168 |
| 901 | Sady pod dworem | 80 x 42 | 524, 312 | prawe skrzydło | sady i ogrody Lorda, ścieżka nad zatokę | 24 Posiadłość Lorda | 8, 20, 24, 125 |
| 910 | Zatoczka pod ogonem | 60 x 60 | 380, 434 | ogon | przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze | 21 Leśna droga | 21, 125 |
| 911 | Północny klif lewego skrzydła | 120 x 60 | 66, 165 | lewe skrzydło | klif z widokiem na morze albo plaża do chodzenia; ścieżka od rodzica, kilka drzew i skał | 18 Łąka#3 | 18, 155 |
| 912 | Północny brzeg pól | 80 x 60 | 784, 148 | prawe skrzydło | klif z widokiem na morze albo plaża do chodzenia; ścieżka od rodzica, kilka drzew i skał | 168 Spalona zagroda | 168 |
| 913 | Północny brzeg pól II | 60 x 60 | 560, 64 | prawe skrzydło | przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze | 120 Osada Milczących | 120, 159 |
| 914 | Cypel ogona | 60 x 60 | 440, 494 | ogon | przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze | 21 Leśna droga | 21 |
| 915 | Mielizny prawego skrzydła | 60 x 60 | 796, 306 | prawe skrzydło | przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze | 168 Spalona zagroda | 168 |
| 916 | Północny klif lewego skrzydła II | 120 x 60 | 284, 84 | lewe skrzydło | klif z widokiem na morze albo plaża do chodzenia; ścieżka od rodzica, kilka drzew i skał | 175 Orla Grań | 13, 157, 175 |
| 917 | Zatoczka pod ogonem II | 100 x 60 | 318, 361 | ogon | klif z widokiem na morze albo plaża do chodzenia; ścieżka od rodzica, kilka drzew i skał | 111 Podgrodzie | 111 |
| 918 | Północny klif lewego skrzydła III | 60 x 60 | 186, 86 | lewe skrzydło | przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze | 155 Pustelnia na klifie | 155 |

## Przystań pod miastem

- **Przystań (125) leży bezpośrednio pod Okolicami Tawerny (8)**: 8 ma x0 = 420, y0 = 216 (104 x 138), 125 ma x0 = 420, y0 = 354 (112 x 80); wspólna krawędź to całe 104 kratki dolnej krawędzi miasta.
- Południowa brama miasta (kratki świata x 444-446 na dolnej krawędzi 8, lokalnie 24-26) wchodzi do Przystani w tej samej kratce (lokalnie w 125 też x 24-26; dziś jej wyjście północne jest przy x 14-16, więc przesuwa się o 10 kratek; to mapa spoza listy gracza). Droga kończy się przy nabrzeżu (zdarzenie „Miejsce: nabrzeze”).
- **Wpływ od lewej strony ogona, pod lewym skrzydłem.** Świat ma zatokę w kącie między lewym skrzydłem a ogonem (10364 kratek morza wcięte w ląd): osłonięta, łagodnie zwężająca się ku basenowi; statki wpływają od zachodu i południowego zachodu, płyną wzdłuż lewego boku ogona i kończą w basenie Przystani. Skrzydło jest nad zatoką, ogon po jej prawej, kruk zostaje czytelny.
- **Basen Map125 (zachodnia część mapy, lokalnie x 0-20) jest teraz morzem z maski**, nie żółtą „wodą poza maską”: woda kafelków, przez którą nie da się przejść, = morze świata; pomosty i nabrzeże zostają lądem. Mapy nie odbijamy. Morze do domalowania w 125: 969 kratek (10.8%), na pustym terenie (zatoka wchodzi w dolny i zachodni pas mapy), treść w morzu: 0.
- **Dawna „Zatoka portowa” (902) na wschodzie znika**: wschodni brzeg ogona przy porcie to zwykły ląd (brzeg z maski). Leśna droga (21) stoi teraz pod Przystanią (x0 = 440, y0 = 434, 90 x 60), droga z nabrzeża prowadzi do niej.
- **Polna droga (22)** nie leży pod miastem: stoi na wschód od miasta (x0 = 524, y0 = 192, 85 x 60), nad Posiadłością Lorda; łączy się z miastem (górna część wschodniej krawędzi) i z Osadą Milczących (na północ). To droga na pola.
- Lewe skrzydło bez portu: Podgrodzie -> Garnizon -> Wrak (i drugi ciąg Góry -> Urwisko -> Pustelnia).

## Suche koryto rzeki

Decyzja gracza: ślad po rzece tak, ale **bez wody**. Wzdłuż całego biegu jest suche koryto: popękane błoto, kamienie i otoczaki, suche trzciny przy skarpach (na rysunku ciemna skarpa i jasne dno z otoczakami). Rzeka znika **pod wzgórzem zamkowym** (wlot, czarny łuk w Górach, kratka świata (474, 208)) i wypływa **suchym jarem (fosą) tuż przed murem Podgrodzia i miasta** (wylot, kratka świata (413, 253)), jak fosa; jar poszerza się od 3 do 7 kratek i kończy się **w basenie Przystani** (dawne ujście rzeki: port zbudowano w ujściu, a dolną część wypełnia dziś morze).

- Część A (Góry): kratki świata (452,78) (453,88) (457,113) (462,142) (468,168) (473,190) (474,206). Część B (jar za murem do basenu): kratki świata (413,253) (413,260) (413,278) (413,299) (414,322) (415,340) (419,352) (424,357) (429,360) (432,360).
- Jar leży w **nowym pasie 10 kolumn wstawionych przed murem Podgrodzia** (Map111, lokalnie x 90-99; mur z bramą przesuwa się na x 100-101), więc **nie idzie po żadnym budynku, zadaniu ani miejscu**. Okolice Tawerny (8) bez zmian: zachodni mur miasta stoi na x 0-2, domy od x 4. Drogę z placyku do bramy Podgrodzia przecina **most** (kamienny, jeden); brama stoi po drugiej stronie fosy, za mostem. Szczegóły zmian w Map111: sekcja „Mapy gracza”.
- Przebieg przez krawędzie map: 175 Orla Grań <-> 13 Góry i kamieniołom, x 458; 8 Okolice Tawerny <-> 125 Przystań, x 420; 111 Podgrodzie <-> 8 Okolice Tawerny, y 354.
- **Oceniony i odrzucony inny bieg:** (1) przez Okolice Tawerny ulicą: po budynkach i miejscach; (2) przez wąski pas między płotem a murem Podgrodzia bez powiększenia: tylko 4 wolne kolumny (x 86-89) i tylko do y ok. 66, dalej budynki; (3) na zachód od Podgrodzia: między Górami a Garnizonem nie ma map (puszcza), trasa 140 kratek przez treść Urwiska i Garnizonu, kończyłaby się daleko od basenu. Wariant „za murem” z 10 nowymi kolumnami w Map111 jest najkrótszy i ma zero zmian w istniejącej treści.

## Dom dziadka, Kruczy Jar i Lord

- **Dom dziadka (20) dotyka Kruczego Jaru (3) od południa**: wychodzisz z podwórza i jesteś na swoim polu (wyjście południowe 3 w kratkach x 8-10 lokalnie wchodzi do 20). Dom dziadka rośnie o 20 kratek w prawo, żeby objąć całą dolną krawędź pola.
- **Posiadłość Lorda (24) dotyka pola od zachodu** (wyjście zachodnie 3 do 24), więc Lord zabiera pole za długi tuż obok.
- Trasa do miasta: 20 Dom dziadka -> 3 Kruczy Jar -> 24 Posiadłość Lorda -> 8 Okolice Tawerny.

## Szlak górski

Z północnej bramy miasta (8) w górę do Gór (13) i dalej na Orlą Grań (175): droga w kratkach świata (470,224), (467,160), (462,100). Przecina wspólną krawędź 8 / 13 w x ok. 460 i 13 / 175 w x ok. 452 (lokalnie w 13: x 49-51 i x 52-54 od lewej).

## Jakość (zasady rysunku)

- Brzeg: gładka krzywa z maski (łuki, zatoki, cyple), bez prostych odcinków i schodków; wybrzuszenia wokół treści to wypukłe, zaokrąglone cyple.
- Drogi: stała szerokość 3 kratek, łagodne zakręty (wygładzone łamane), prowadzą do celów. Rzeka: gładka, 2-7 kratek.
- Podział: mapy dotykają się krawędziami bez szczelin; nowe mapy mają co najmniej 60 x 40 i krawędzie wyrównane do sąsiadów, gdzie się dało. Środek lewego skrzydła bez map zostaje jako nieprzechodnia puszcza i skały otoczona mapami, daleko od brzegu.

## Etapy budowy

Po każdym etapie `python tools/mapy/swiat_krawedzie.py` sprawdza każdą wspólną krawędź kratka po kratce: woda, ląd, droga, suche koryto, klif/ściana, brzeg (kratka przecięcia i kąt z obu stron), treść w morzu, spójność przejść. Etap uznajemy za gotowy dopiero przy `WYNIK: OK`.

1. **Tułów**: miasto (8), Przystań pod nim (125) z basenem otwartym na zatokę pod lewym skrzydłem, ogon (Leśna droga 21 i nowe mapy pod ogonem), suche koryto (Góry -> jar za murem -> basen), szlak górski (8 -> 13 -> 175).
2. **Prawe skrzydło**: Kruczy Jar (3), Łąka#1 (4), Skraj lasu (23), Dom dziadka (20), Posiadłość Lorda (24), Polna droga (22), Osada (120), Latarnia (159), Spalona zagroda (168), Łąka#2 (17) i nowe mapy brzegowe.
3. **Lewe skrzydło i głowa**: Podgrodzie (111), Garnizon (162), Wrak (165), Łąka#3 (18), Urwisko (157), Pustelnia (155), Góry (13), Orla Grań (175) i nowe mapy brzegowe.
4. **Mapa w menu P z tego samego świata**: `MapaWyspy_Data.js` czyta `swiat.json` (BRZEG z maski, położenia z x0, y0, szer., wys., drogi i suche koryto z `drogi`, `suche_koryto`).

## Pytania do gracza

1. Czy kształt wyspy po wybrzuszeniach i z zatoką pod lewym skrzydłem wokół treści (`swiat_podglad.png`) jest dla Ciebie nadal rozpoznawalnym krukiem? Skrzydła są pełniejsze, bo osady i latarnia musiały zostać na lądzie. Jeśli kruk ma być szczuplejszy, trzeba przenieść treść tych map w głąb, a nie dokładać lądu.
2. Czy lista zmian na mapach gracza (3, 4, 8, 13, 23, 24, 111) jest do przyjęcia? Najwięcej na 13 (cele i miejsce wyjść) i 111 (morze po lewej i u dołu, wyjście zachodnie do Garnizonu).
3. **Suche koryto za zachodnim murem**: zgoda na powiększenie Map111 (Podgrodzie, mapa gracza) o 10 kolumn w prawo za murem i przesunięcie jej wschodniego wyjścia z x 91 na x 101 (most nad korytem)? Alternatywy w sekcji o korycie.
4. Środek lewego skrzydła (puszcza i skały bez map) zostaje bez zmian?
