# Świat Kruczej Wyspy w kratkach

2026-10-30. **PROJEKT do oceny.** W `data/` ani `js/` nic nie zmieniłem. Narzędzia (`tools/mapy/`): `swiat_kratki.py` (układ, maska, `swiat.json`), `swiat_obrazy.py` (obrazki), `swiat_opis.py` (ten plik), `swiat_krawedzie.py` (**sprawdzanie krawędzi do etapów**).

Obrazki w `docs/mapy/`:

- `swiat_podglad.png`: **ładny podgląd całej wyspy** (bez ramek technicznych): tak będzie wyglądać świat i mapa w menu. Gładki brzeg, suche koryto rzeki (bez wody) poszerzające się ku ujściu, drogi o stałej szerokości.
- `swiat_kratki.png`: rysunek techniczny. Mapy jako miniatury z prawdziwych kafli, nowe w pomarańczowych ramkach, droga, suche koryto rzeki, linia brzegu (zielona tam, gdzie leży na mapie), **czerwone pola = tu będzie morze (pusty teren)**, żółte = wybrzuszenie lądu wokół treści. Woda w mapach jest częścią morza świata (nie ma już „wody poza maską”).
- `swiat_kratki_podzial.png`: sam podział na mapy (puzzle): numery, rozmiary, krawędzie (zielone przejście, niebieskie morze, brązowa ściana, szare wspólne).
- `swiat_zblizenia.png`: **zbliżenia trzech styków map z brzegiem**: obie mapy obok siebie, biała linia brzegu przechodzi przez krawędź w tej samej kratce i pod tym samym kątem.
- `swiat.json`: dane do budowy (położenie map, odcinki krawędzi z sąsiadami, przejścia, suche koryto, brzeg na każdej krawędzi, treść w pasie morza, obecne wyjścia i ich los). `swiat_maska.png`: maska lądu świata (po wybrzuszeniach).

## Jak działa świat w kratkach

- Jedna siatka kratek: sylwetka kruka z Atlasu (`kruk_maska.png`), skala **0,70 kratki na piksel Atlasu** (zostaje: tak puzzle pasują, mniejsza skala wymusza nakładanie, większa zostawia puste brzegi), świat 940 x 600 kratek (sama sylwetka 752 x 444). Kratka świata = kratka maski + przesunięcie (80, 60).
- Mapa to prostokątny **wycinek świata** (x0, y0, szer., wys.). Sąsiedzi dzielą krawędź co do kratki; przejście z kratki (X, Y) prowadzi do **tej samej kratki świata** w sąsiedniej mapie. Na jednej krawędzi może być kilku sąsiadów (odcinki). Krawędź bez sąsiada to morze albo ściana (klif, gęsty las, góry); wspólna krawędź bez drogi to też ściana.
- **Brzeg z jednej maski**: sylwetkę wygładzono (łuki, zatoki, cyple, bez schodków), więc linia brzegu przechodzi przez granice map bez skoku. Linia brzegu leży na mapach w **91.9%**.
- **Brzeg omija treść.** Za treść uznaję: budynki i ich ogrodzenia (`<Occupy>`), drzwi do wnętrz, zdarzenia z tagami wtyczek (`Town`, `Garnizon`, `Wyspa`, `Wrak`, `Latarnia`, `Studnia`, `Zagroda`), lampy, obozy, nory, studnie, krzyże, namioty, kuter, bramy, wozy, stragany, ule, gniazda itp. (nazwa). **Nie** liczę drzew, krzaków, kamieni, kłód i pni (zasoby; pod morzem zniknęłyby razem z lądem). Wokół treści z pasa morza ląd się wybrzusza (wypukła obwiednia, wygładzona): 64053 kratek lądu dołożone do sylwetki. Obecnych zdarzeń z treścią: 1003, w pasie morza surowej sylwetki leżało 120, **w morzu po wybrzuszeniu: 0**.

## Uproszczona sylwetka (gracz: kształt tylko z grubsza)

**Twarda zasada gracza: żadna obecna mapa nie traci lądu** (ląd -> morze = 0 w KAŻDEJ mapie, gracza i nie gracza; sprawdza to swiat_krawedzie.py). Morze zaczyna się dopiero za obecnymi mapami: maska = sylwetka kruka + ląd wszystkich obecnych map + pas lądu na zewnątrz o falującej szerokości 8-25 kratek (nie prosta ramka), wygładzony. Dosypujemy ląd tylko tam, gdzie mapa ma dziś wodę (woda -> ląd, jak przy zaokrąglaniu zatok). Woda twarda (mapy gracza, 125, 159) zostaje dokładnie jak jest. Zewnętrzne krawędzie krańcowych map kończą się naturalnie: mapy spoza listy gracza rosną na zewnątrz (w prawo i w dół, żeby nie przesuwać zdarzeń), a przy mapach gracza i tam, gdzie wzrost w lewo/w górę oznaczałby przesunięcie zdarzeń, dokładamy sąsiednie mapy brzegowe (najmniejsza 60 x 40, bez mikromap). **Nowych map jest teraz 19** (było 13).

## Układ stały i sprawdzanie (2026-10-31)

- **Układ jest stały**: `docs/mapy/swiat_uklad.json` (x0, y0, szer., wys. każdej mapy, numery i nazwy nowych) oraz `docs/mapy/swiat_maska.png` (maska lądu). `swiat_kratki.py` je czyta, nie liczy od nowa. Rozmiary docelowe są bezwzględne; wzrost = cel - obecny rozmiar mapy (nigdy ujemny, nigdy podwójny). Od nowa liczy się tylko z `--przelicz-uklad` (to nadpisuje układ i maskę, tylko do projektu sprzed instalacji).
- `swiat_krawedzie.py` **tylko sprawdza**: nie zapisuje `swiat.json` ani maski (zapis wyłącznie z `--zapisz`). Flaga `--staging-b` podmienia mapy z `tools/swiat/etap2/staging_b/data/` na obecne z `data/` (sprawdzenie przed instalacją partii b). Warunki: nakładanie map 0, ucięte krawędzie 0, ląd obecnych map pod morzem 0, treść w morzu 0, połączenia (mapy 111, 165, 162, 917 bez przejść to oczekiwany etap 3, raportowane osobno).
- Numery map zbudowanych: 914, 917, 920, 922 (data/), 900, 901, 923 (data/), 912, 932, 934, 936 (staging_b). **932 = (178, 104, 100 x 40)** (tak ją zbudowano; zgodna z maską w 100%), a projektowa mapa (764, 316, 80 x 80) ma numer **933**.

- **Zmiana 2026-10-31 (przed etapem 3): woda TWARDA także w 155 Pustelnia, 157 Urwisko, 162 Garnizon i 165 Wrak.** Te miejsca stoją nad morzem, więc ich morze zostaje, a ląd świata dopasowuje się do niego (maska przechodzi dokładnie przez brzeg z mapy; woda sąsiednich map brzegowych łączy się z nią bez ucięć). Policzone od nowa (`--przelicz-niezainstalowane`): tylko maska i mapy jeszcze niezainstalowane w lewym skrzydle; maska w mapach zainstalowanych (etapy 1-2) i wszystko na wschód od x 420 bez zmian co do kratki. Zmiany (korekta po zasadzie łachy, patrz sekcja „Wyjątek: łacha”): **165 Wrak (126, 260, 80 x 60)**: rzędy 20-21 jej wschodniej krawędzi leżą na wysokości świata łachy 162 (y 280-281); **bez lądowego przesmyku** (nie ma już mapy 940 ani cypla do Garnizonu); **18 Łąka#3 o 20 w lewo** (26, 225), żeby zrobić miejsce Wrakowi; **155 bez dołożonego pasa (+42)**, czyli 96 x 72, jak w data/; jej południe i lądowe przejście do lewego skrzydła obsługuje nowa mapa **950 „Zbocze pod Pustelnią” (186, 218, 96 x 42)**; usunięta 919 (nachodziła na 165), nowa brzegowa **951 (146, 320, 60 x 40)**. W 155 jedna kratka wody na styku z 157 (x 95, y 3) zamieniona na piasek. Szlak Pustelni nie kończy się w morzu: biegnie przez ląd poniżej zatoczki, przez 950, do lądu lewego skrzydła.

## Najważniejsze liczby

- Obecnych map plenerowych: 21. **Rosną: 4** (18 Łąka#3 +10/+0, 157 Urwisko Kruków +10/+0, 162 Garnizon nad zatoką +0/+20, 175 Orla Grań +60/+0). **Nowych map: 19** (poprzednia wersja miała 13; rozmiary od 60 x 40, bez mikro-map).
- **Morza do domalowania na obecnych mapach: 2673 kratek**, wszystko na pustym terenie (las, łąka, skały): zero zdarzeń z treścią. Zasoby (drzewa, kamienie), które znikną pod morzem, są wypisane przy każdej mapie.
- **Droga z domu dziadka do miasta: 20 -> 3 -> 24 -> 8** (4 mapy, czyli 2 pośrednie): Dom dziadka dotyka Kruczego Jaru od południa, Kruczy Jar Posiadłości Lorda od wschodu, a ta miasta.
- Obecnych wyjść między mapami plenerowymi: 45. **Zostaje w tej samej kratce: 30**, ta sama krawędź z nowym celem: 15, przesunięte: 0, zamyka się (morze lub ściana): 0.
- **Sprawdzanie krawędzi** (`python tools/mapy/swiat_krawedzie.py`): 71 wspólnych krawędzi, niezgodności drogi/rzeki: **0**, największe przesunięcie przecięcia brzegu na granicy map: **2 kratek**, treść w morzu: **0**.

## Brzeg na wspólnych krawędziach

Dla każdej wspólnej krawędzi, przez którą przechodzi brzeg: kratka świata, w której linia brzegu ją przecina (y dla krawędzi pionowej, x dla poziomej), przejście (ląd -> morze albo odwrotnie) i kierunek: kąt linii brzegu (0° = w prawo, 90° = w górę) z pola maski. Obie mapy czytają jedną maskę, więc przecięcie wypada w tej samej kratce i pod tym samym kątem (przesunięcie przecięcia między ostatnią kolumną jednej mapy a pierwszą drugiej: co najwyżej 2 kratek, to nachylenie brzegu; kąty z lokalnych pomiarów obu stron są w `swiat.json`, pola `kat_a`, `kat_b`).

| krawędź | strona A | odcinek (kratki świata) | brzeg przecina w kratce | przejście | kąt brzegu |
|---|---|---|---|---|---|
| 17 Łąka#2 <-> N933 | wschodnia | y 316-396 | y = 388 | ląd->morze | 135.0° |
| 20 Dom dziadka <-> N923 | południowa | x 624-684 | x = 674 | morze->ląd | 128.3° |
| 21 Leśna droga <-> N920 | wschodnia | y 434-474 | y = 447 | ląd->morze | 38.1° |
| 120 Osada Milczących <-> 159 Przylądek z latarnią | wschodnia | y 124-192 | y = 145 | morze->ląd | 10.2° |
| 125 Przystań <-> N914 | południowa | x 420-440 | x = 435 | morze->ląd | 101.8° |
| 125 Przystań <-> N922 | wschodnia | y 394-434 | y = 420 | morze->ląd | 135.0° |
| 155 Pustelnia na klifie <-> 157 Urwisko Kruków | wschodnia | y 146-216 | y = 149 | morze->ląd | 10.0° |
| 155 Pustelnia na klifie <-> N950 | południowa | x 186-282 | x = 207 | morze->ląd | 98.0° |
| 159 Przylądek z latarnią <-> N900 | południowa | x 689-724 | x = 708 | ląd->morze | 90.5° |
| 165 Wrak na mieliźnie <-> 162 Garnizon nad zatoką | wschodnia | y 260-320 | y = 280 | morze->ląd | 113.5° |
| 165 Wrak na mieliźnie <-> 162 Garnizon nad zatoką | wschodnia | y 260-320 | y = 283 | ląd->morze | 48.6° |
| 168 Spalona zagroda <-> N933 | południowa | x 764-844 | x = 823 | ląd->morze | 34.9° |
| 175 Orla Grań <-> N934 | wschodnia | y 84-120 | y = 107 | morze->ląd | 9.0° |
| N901 <-> 125 Przystań | południowa | x 524-552 | x = 549 | ląd->morze | 88.0° |
| N910 <-> N950 | wschodnia | y 218-225 | y = 221 | morze->ląd | 123.0° |
| N914 <-> 21 Leśna droga | wschodnia | y 434-514 | y = 502 | ląd->morze | 0.0° |
| N918 <-> N910 | wschodnia | y 185-225 | y = 213 | morze->ląd | 174.9° |
| N922 <-> N920 | południowa | x 552-600 | x = 554 | ląd->morze | 54.6° |
| N923 <-> 17 Łąka#2 | wschodnia | y 376-408 | y = 380 | ląd->morze | 28.7° |
| N930 <-> 157 Urwisko Kruków | południowa | x 282-398 | x = 397 | morze->ląd | 73.4° |
| N934 <-> 120 Osada Milczących | południowa | x 560-620 | x = 611 | ląd->morze | 57.4° |
| N935 <-> N930 | południowa | x 328-388 | x = 365 | morze->ląd | 119.7° |
| N935 <-> N931 | wschodnia | y 24-60 | y = 46 | morze->ląd | 9.0° |
| N950 <-> 162 Garnizon nad zatoką | południowa | x 206-282 | x = 221 | morze->ląd | 81.1° |
| N951 <-> 162 Garnizon nad zatoką | wschodnia | y 320-360 | y = 327 | morze->ląd | 20.6° |
| N951 <-> 162 Garnizon nad zatoką | wschodnia | y 320-360 | y = 357 | ląd->morze | 157.2° |

Pełne dane są w `swiat.json`, pole `brzeg_na_krawedziach`.

## Mapy gracza: dokładna lista zmian (do Twojej zgody)

Mapy gracza: 3, 4, 8, 13, 23, 24, 111. Kratki podaję lokalnie (w mapie, od lewego górnego rogu) i w świecie. **Morze jest tylko na pustym terenie**, zero zdarzeń z treścią.

### 8 Okolice Tawerny

- Świat: x0 = 420, y0 = 216, rozmiar 104 x 138 (tułów). Rośnie: nie.
- Morze: 0 kratek (cała mapa to ląd).
- Treść, która leżała w pasie morza surowej sylwetki: żadna. Po wybrzuszeniu w morzu: 0.
- Krawędź północna, kratki x 24-26 (świat x 444-446): **bez zmian**, nadal do 13 Góry i kamieniołom.
- Krawędź wschodnia, kratki y 17-19 (świat y 233-235): **bez zmian**, nadal do 22 Polna droga.
- Krawędź wschodnia, kratki y 50-51 (świat y 266-267): **bez zmian**, nadal do 24 Posiadłość Lorda.
- Krawędź zachodnia, kratki y 50-51 (świat y 266-267): **bez zmian**, nadal do 111 Podgrodzie.
- Krawędź południowa, kratki x 33-35 (świat x 453-455): **bez zmian**, nadal do 125 Przystań.

### 24 Posiadłość Lorda

- Świat: x0 = 524, y0 = 252, rozmiar 80 x 60 (prawe skrzydło). Rośnie: nie.
- Morze: 0 kratek (cała mapa to ląd).
- Treść, która leżała w pasie morza surowej sylwetki: żadna. Po wybrzuszeniu w morzu: 0.
- Krawędź wschodnia, kratki y 14-16 (świat y 266-268): **bez zmian**, nadal do 3 Kruczy Jar.
- Krawędź zachodnia, kratki y 14-16 (świat y 266-268): **bez zmian**, nadal do 8 Okolice Tawerny.

### 3 Kruczy Jar

- Świat: x0 = 604, y0 = 252, rozmiar 80 x 60 (prawe skrzydło). Rośnie: nie.
- Morze: 0 kratek (cała mapa to ląd).
- Treść, która leżała w pasie morza surowej sylwetki: żadna. Po wybrzuszeniu w morzu: 0.
- Krawędź północna, kratki x 28-31 (świat x 632-635): **bez zmian**, nadal do 4 Łąka#1.
- Krawędź południowa, kratki x 8-10 (świat x 612-614): **bez zmian**, nadal do 20 Dom dziadka.
- Krawędź wschodnia, kratki y 12-14 (świat y 264-266): **bez zmian**, nadal do 23 Skraj lasu.
- Krawędź zachodnia, kratki y 14-16 (świat y 266-268): **bez zmian**, nadal do 24 Posiadłość Lorda.

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
- Krawędź południowa, kratki x 39-41 (świat x 723-725): **bez zmian**, nadal do 17 Łąka#2.

### 13 Góry i kamieniołom

- Świat: x0 = 404, y0 = 120, rozmiar 120 x 96 (barki / góry). Rośnie: nie.
- Morze: 0 kratek (cała mapa to ląd).
- Treść, która leżała w pasie morza surowej sylwetki: Brama Milczących (1): #6. Po wybrzuszeniu w morzu: 0.
- Krawędź południowa, kratki x 40-42 (świat x 444-446): **bez zmian**, nadal do 8 Okolice Tawerny.
- Krawędź zachodnia, kratki y 38-40 (świat y 158-160): dziś do 21 Leśna droga (lądowanie (78,9)); **po zmianie do 157 Urwisko Kruków**, lądowanie w tej samej kratce świata, lokalnie (120,14); (120,15); (120,16).
- Krawędź północna, kratki x 5-7 (świat x 409-411): dziś do 120 Osada Milczących (lądowanie (20,31)); **po zmianie do 175 Orla Grań**, lądowanie w tej samej kratce świata, lokalnie (5,58); (6,58); (7,58).
- Krawędź wschodnia, kratki y 11-13 (świat y 131-133): dziś do 159 Przylądek z latarnią (lądowanie (30,78)); **po zmianie do 120 Osada Milczących**, lądowanie w tej samej kratce świata, lokalnie (1,7); (1,8); (1,9).
- **Szlak górski**: z północnej bramy miasta (8, krawędź północna, x 49-51 lokalnie) przez Góry do Orlej Grani: w 13 wchodzi południową krawędzią w kratce świata x ok. 446 i wychodzi północną (do 175) w x ok. 465, wspólna krawędź 13 / 175 to droga (zamiast wspinaczki).

### 111 Podgrodzie

- Świat: x0 = 318, y0 = 249, rozmiar 102 x 112 (lewe skrzydło). Rośnie: nie.
- Morze: 0 kratek (cała mapa to ląd).
- Treść, która leżała w pasie morza surowej sylwetki: Dym z komina (1): #93; Drzwi (zamknięte): Chata pod lasem (1): #94. Po wybrzuszeniu w morzu: 0.
- Krawędź wschodnia, kratki y 17-18 (świat y 266-267): nadal do 8 Okolice Tawerny, **w tej samej kratce świata, ale na nowej krawędzi mapy (x 101 zamiast 91)**, patrz niżej.
- Krawędź zachodnia, kratki y 19 (świat y 268): dziś do 125 Przystań (lądowanie (108,19)); **po zmianie do 162 Garnizon nad zatoką**, lądowanie w tej samej kratce świata, lokalnie (110,8).
- **Wariant z jednym murem: 10 kolumn wstawionych PRZED murem, od x 90 (nic nie zapisuję, tylko opis).** Mapa rośnie z 92 do 102 kolumn. Nowe kolumny x 90-99 (cała wysokość, 112 rzędów) to czysty grunt i **suche koryto (fosa) przed murem po stronie Podgrodzia**; pas muru i bramy, który dziś stoi na x 90-91, **przesuwa się o +10 na x 100-101, czyli na nowy wschodni brzeg**, i dalej styka się z murem Okolic Tawerny jak dziś. Wychodzi jeden mur z fosą przed nim, a brama stoi po właściwej stronie fosy.
- **Co dokładnie się przesuwa (+10 kolumn, tylko to):** kafle muru z x 90-91 we wszystkich rzędach; zdarzenia bramy zachodniej i muru: #19 Pochodnia na baszcie (90,13) -> (100,13); #90 Brama zachodnia: skrzydło i cień (90,18) -> (100,18); #91 Brama zachodnia: światło latarni (91,16) -> (101,16); #89 Brama zachodnia: dach i słupy (91,19) -> (101,19); przejścia #65 (91,17) -> (101,17) i #66 (91,18) -> (101,18), które w tej samej kratce świata (y 266-267) prowadzą do Okolic Tawerny (8); oraz zasoby na x 90: Drzewo #111 (90,84) -> (100,84), Drzewo #254 (90,88) -> (100,88), Suchy krzaczek #290 (90,101) -> (100,101).
- **Zostaje na swoich miejscach (x 89 i mniej, placyk przed bramą):** #18 Latarnia przy bramie (88,19); #20 Posłanie żebraka (88,14); #67 Drogowskaz: Podgrodzie (86,15); #70 Miejsce: brama_zach (87,18); #71 Miejsce: zebrak (89,16); #72 Miejsce: zebrak_noc (89,14); #400 Miejsce: w5_lada (89,17); płot (ok. x 85) i wszystkie budynki, drzewa i zdarzenia o x < 90 (np. Beczki #316 (84,16)).
- **Fosa i most:** suche koryto leży w x 90-99 (6-8 kratek dna ze skarpami, 1-2 kolumny gruntu po bokach), przed murem po stronie Podgrodzia. **Most z placyku przed bramą (x 89) do bramy (x 100)**: kamienny, 10 kratek długości i 4 szerokości (lokalnie y 16-19), czyli na wysokości bramy. **Poniżej linii murów** (rzędy y 20-111) koryto biegnie dalej w tych samych kolumnach x 90-99 na południe, do dolnej krawędzi mapy i dalej do basenu Przystani. Wschodnie wyjście stoi więc na x 101 (kratki y 17-18, tak jak dziś, tylko 10 kolumn dalej).
- Poza tym nic w Map111 się nie rusza: te same budynki, ulice, płot, wnętrza i zadania. Gdyby wstawienie 10 kolumn było nie do przyjęcia, alternatywa: koryto w pasie x 86-89 (4 wolne kolumny między płotem a murem, tylko do y ok. 66, dalej budynki), czyli bez miejsca na mostek i fosę, więc nie polecam.

## Tabela map

| mapa | część kruka | x0, y0 | rozmiar | rośnie | ląd -> morze (w obecnej mapie) | zasoby pod morzem | woda -> ląd (w obecnej mapie) |
|---|---|---|---|---|---|---|---|
| 8 Okolice Tawerny * | tułów | 420, 216 | 104 x 138 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 24 Posiadłość Lorda * | prawe skrzydło | 524, 252 | 80 x 60 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 111 Podgrodzie * | lewe skrzydło | 318, 249 | 102 x 112 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 125 Przystań | ogon | 420, 354 | 132 x 80 | nie | 0 kratek (0.0%) | 4 | 71 (0.7%) |
| 22 Polna droga | prawe skrzydło | 524, 192 | 85 x 60 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 20 Dom dziadka | prawe skrzydło | 604, 312 | 80 x 64 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 21 Leśna droga | ogon | 440, 434 | 100 x 80 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 13 Góry i kamieniołom * | barki / góry | 404, 120 | 120 x 96 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 120 Osada Milczących | prawe skrzydło | 524, 124 | 96 x 68 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 175 Orla Grań | głowa | 404, 60 | 156 x 60 | +60 w prawo, +0 w dół | 0 kratek (0.0%) | 0 | 102 (1.8%) |
| 23 Skraj lasu * | prawe skrzydło | 684, 252 | 80 x 60 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 168 Spalona zagroda | prawe skrzydło | 764, 208 | 130 x 108 | nie | 0 kratek (0.0%) | 0 | 686 (4.9%) |
| 3 Kruczy Jar * | prawe skrzydło | 604, 252 | 80 x 60 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 4 Łąka#1 * | prawe skrzydło | 609, 192 | 80 x 60 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 17 Łąka#2 | ogon | 684, 312 | 80 x 96 | nie | 0 kratek (0.0%) | 0 | 100 (1.3%) |
| 18 Łąka#3 | lewe skrzydło | 26, 225 | 90 x 76 | +10 w prawo, +0 w dół | 0 kratek (0.0%) | 0 | 108 (1.8%) |
| 162 Garnizon nad zatoką | lewe skrzydło | 206, 260 | 112 x 100 | +0 w prawo, +20 w dół | 0 kratek (0.0%) | 4 | 0 (0.0%) |
| 165 Wrak na mieliźnie | lewe skrzydło | 126, 260 | 80 x 60 | nie | 0 kratek (0.0%) | 2 | 0 (0.0%) |
| 155 Pustelnia na klifie | lewe skrzydło | 186, 146 | 96 x 72 | nie | 0 kratek (0.0%) | 0 | 1 (0.0%) |
| 157 Urwisko Kruków | lewe skrzydło | 282, 144 | 122 x 72 | +10 w prawo, +0 w dół | 0 kratek (0.0%) | 0 | 0 (0.0%) |
| 159 Przylądek z latarnią | prawe skrzydło | 620, 112 | 104 x 80 | nie | 0 kratek (0.0%) | 0 | 0 (0.0%) |

`*` = mapa gracza. **Zasada (gracz: „ładnie”): decyduje maska świata.** Woda w mapach gracza (i basen Przystani, zatoka od zachodu) jest twarda: maska ją szanuje i przechodzi dokładnie przez ich brzeg. W pozostałych mapach woda jest tylko wskazówką: maska ją zaokrągla (wąskie szczeliny znikają, staw w Łące#3 znika, zatoka Garnizonu jest szeroka i łagodna), a mapę przemalowuje się do maski w etapach budowy. Kształt lądu 159 Przylądek (wzgórze z latarnią) jest nietykalny, w 159 zmienia się tylko woda. Warunek „ucięte krawędzie = 0” sprawdza swiat_krawedzie.py. Poprawka: NW róg basenu 125 (14x10 kratek, pod treścią miasta) woda -> piasek.

## Lista zmian wody (co przemalować w mapach)

Kratki lokalne mapy (x, y od lewego górnego rogu). **woda -> ląd** = woda mapy, na której maska ma ląd (zasypać); **ląd -> woda = 0 dla każdej mapy** (twarda zasada; kolumna i tabela pokazują tylko wody do zasypania). Wypisane skupiska od 12 kratek; drobne w sumie. Mapy gracza: woda twarda, nic nie zmienia się w kafelkach.

| mapa | woda -> ląd (kratek) | gdzie | ląd -> woda (kratek) | gdzie |
|---|---|---|---|---|
| 125 Przystań | 71 | 71 kr. w x 0-13, y 3-9 | 0 | - |
| 175 Orla Grań | 102 | 51 kr. w x 80-95, y 51-59; 40 kr. w x 80-95, y 0-6 (+11 drobnych) | 0 | - |
| 168 Spalona zagroda | 686 | 595 kr. w x 0-66, y 72-87; 85 kr. w x 87-99, y 72-87 (+6 drobnych) | 0 | - |
| 17 Łąka#2 | 100 | 48 kr. w x 71-79, y 60-75; 30 kr. w x 0-6, y 60-66 (+22 drobnych) | 0 | - |
| 18 Łąka#3 | 108 | 38 kr. w x 18-30, y 66-70; 35 kr. w x 71-79, y 60-64; 20 kr. w x 0-6, y 60-63 (+15 drobnych) | 0 | - |
| 155 Pustelnia na klifie | 1 |  (+1 drobnych) | 0 | - |

Mapa 125 Przystań: woda zostaje (twarda), zmiana tylko NW róg basenu 14x10 woda -> piasek. Mapy gracza z listy wyżej nie mają wiersza, jeśli nie mają zmian (woda twarda, ląd nietknięty).

## Co leży w pasie do zalania (treść), mapa po mapie

Dla każdej obecnej mapy: ile kratek morza i jakie zdarzenia z treścią wypadły w pasie morza surowej sylwetki kruka. Wszystkie są **chronione wybrzuszeniem lądu**, w morzu po zmianie: **0**.

- **8 Okolice Tawerny**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **24 Posiadłość Lorda**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **111 Podgrodzie**: morze 0 kratek (0.0%). W pasie: Dym z komina (1): #93; Drzwi (zamknięte): Chata pod lasem (1): #94. W morzu po zmianie: 0.
- **125 Przystań**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **22 Polna droga**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **20 Dom dziadka**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **21 Leśna droga**: morze 0 kratek (0.0%). W pasie: Kamienny kopiec (1): #343. W morzu po zmianie: 0.
- **13 Góry i kamieniołom**: morze 0 kratek (0.0%). W pasie: Brama Milczących (1): #6. W morzu po zmianie: 0.
- **120 Osada Milczących**: morze 0 kratek (0.0%). W pasie: Drzwi chaty 1 (1): #1; Drzwi chaty 2 (1): #3; Drzwi chaty 3 (1): #5; Boczne drzwi chaty 3 (1): #6; EV003 (1): #7; EV008 (1): #8; EV009 (1): #9; Drzwi chaty 4 (1): #10; Kamień kręgu (8): #12, #13, #14, #15, #268, #273 ...; Kopczyk milczenia (3): #17, #18, #22; Słup z zaszytymi ustami (2): #19, #20; Latarnia przy drzwiach (2): #27, #28; Milczący przy ścianie (1): #86; Milcząca przy ścianie (1): #87; Najstarszy z Milczących (1): #88; Milcząca przy grządce (1): #89; Miejsce: osada_wejscie (1): #90; Miejsce: osada_krag (1): #91; Miejsce: osada_sciana (1): #92; Miejsce: osada_grum (1): #93; Miejsce: osada_starszy (1): #94; Miejsce: osada_dom_1 (1): #95; Miejsce: osada_dom_2 (1): #96; Miejsce: osada_dom_3 (1): #97; Miejsce: osada_dom_4 (1): #98. W morzu po zmianie: 0.
- **175 Orla Grań**: morze 1783 kratek (0.0%). W pasie: Kamienny kopiec (1): #49; Miejsce: orzel_wejscie (1): #56; Miejsce: orzel_jajo (1): #57; Miejsce: orzel_orlica (1): #58; Miejsce: orzel_strzaly (1): #59; Miejsce: orzel_misa (1): #60; Miejsce: orzel_plyta (1): #61; Miejsce: orzel_oboz (1): #62; Miejsce: orzel_klatka (1): #63; Miejsce: orzel_ladowisko (1): #64. W morzu po zmianie: 0.
- **23 Skraj lasu**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **168 Spalona zagroda**: morze 0 kratek (0.0%). W pasie: Resztki stodoły (1): #1; Stara studnia (zasypana) (1): #2; Krzyż: Jan Ług (1): #3; Kamienny kopiec (3): #32, #198, #199; Dom Ługów (1): #55. W morzu po zmianie: 0.
- **3 Kruczy Jar**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **4 Łąka#1**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **17 Łąka#2**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **18 Łąka#3**: morze 121 kratek (0.0%). W pasie: Menhir (10): #1, #2, #4, #6, #248, #249 ...; Kamienny kopiec (4): #23, #78, #274, #276. W morzu po zmianie: 0.
- **162 Garnizon nad zatoką**: morze 768 kratek (0.0%). W pasie: Kosz ogniowy na pomoście (1): #71. W morzu po zmianie: 0.
- **165 Wrak na mieliźnie**: morze 0 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **155 Pustelnia na klifie**: morze 0 kratek (0.0%). W pasie: Dym z komina (2): #1, #6; Drzwi: Skryptorium (1): #2; Wieża skryptorium (1): #3; Wieża skryptorium: podstawa (1): #4; Dzwon w wieży (1): #5; Drzwi (zamknięte): Cela brata Kleofasa (1): #7; Latarenka u drzwi skryptorium (1): #8; Latarenka przy celi (1): #9; Latarnia przy wieży (1): #10; Pusta cysterna na deszczówkę (1): #11; Grób kronikarza (3): #12, #13, #14; Ule brata Kleofasa (1): #16; Ule: miejsce (1): #17; Kopiec z krukiem (1): #18; Kamienny kopiec (1): #22; Rozbita skrzynia (1): #28; Miejsce: skryptorium_drzwi (1): #54; Miejsce: cela_drzwi (1): #55; Miejsce: urwisko (1): #56; Miejsce: lawka (1): #57; Miejsce: ogrodek (1): #58; Miejsce: ule (1): #59; Miejsce: wieza (1): #60. W morzu po zmianie: 0.
- **157 Urwisko Kruków**: morze 1 kratek (0.0%). W pasie: nic z treścią. W morzu po zmianie: 0.
- **159 Przylądek z latarnią**: morze 0 kratek (0.0%). W pasie: Latarnia (1): #1; Latarnia: mur (5): #2, #3, #4, #48, #52; Dym z komina (1): #5; Drzwi: Izba latarnika (1): #6; Latarenka przy izbie (1): #7; Słup strażnicy zakonu (1): #8; Płyta strażnicy (1): #9; Dzwon mgłowy (1): #10; Beczki tranu (1): #12; Zatoczka szczątków (1): #14; Kamienny kopiec (1): #19; Miejsce: laterna (1): #41; Miejsce: izba (1): #42; Miejsce: izba_sen (1): #43; Miejsce: drewutnia (1): #44; Miejsce: lat_napad (1): #45; Miejsce: lat_oboz (1): #46; Miejsce: lat_dzwon (1): #47. W morzu po zmianie: 0.

## Pozostałe mapy: zmiany wyjść

### 125 Przystań

- Położenie: x0 = 420, y0 = 354, 132 x 80 (ogon), rośnie: nie.
- krawędź północna, x 453-455: bez zmian, do 8 Okolice Tawerny.
- krawędź południowa, x 450-452: bez zmian, do 21 Leśna droga.
- krawędź północna, x 434-436: cel z 155 Pustelnia na klifie na 8 Okolice Tawerny.
- krawędź południowa, x 441-443: cel z 162 Garnizon nad zatoką na 21 Leśna droga.

### 22 Polna droga

- Położenie: x0 = 524, y0 = 192, 85 x 60 (prawe skrzydło), rośnie: nie.
- krawędź zachodnia, y 233-235: bez zmian, do 8 Okolice Tawerny.
- krawędź wschodnia, y 211-213: cel z 21 Leśna droga na 4 Łąka#1.
- krawędź północna, x 569-571: bez zmian, do 120 Osada Milczących.

### 20 Dom dziadka

- Położenie: x0 = 604, y0 = 312, 80 x 64 (prawe skrzydło), rośnie: nie.
- krawędź północna, x 612-614: bez zmian, do 3 Kruczy Jar.

### 21 Leśna droga

- Położenie: x0 = 440, y0 = 434, 100 x 80 (ogon), rośnie: nie.
- krawędź wschodnia, y 442-444: cel z 13 Góry i kamieniołom na 920 Wschodni brzeg ogona II.
- krawędź zachodnia, y 453-455: cel z 22 Polna droga na 914 Zatoczka pod ogonem.
- krawędź północna, x 450-452: bez zmian, do 125 Przystań.

### 120 Osada Milczących

- Położenie: x0 = 524, y0 = 124, 96 x 68 (prawe skrzydło), rośnie: nie.
- krawędź południowa, x 543-545: cel z 13 Góry i kamieniołom na 22 Polna droga.
- krawędź południowa, x 569-571: bez zmian, do 22 Polna droga.
- krawędź wschodnia, y 152-154: bez zmian, do 159 Przylądek z latarnią.
- NOWE przejście do 13 Góry i kamieniołom (kratka świata 135, Szlak latarni).

### 175 Orla Grań

- Położenie: x0 = 404, y0 = 60, 156 x 60 (głowa), rośnie: +60/+0.
- NOWE przejście do 13 Góry i kamieniołom (kratka świata 465, Szlak górski).

### 168 Spalona zagroda

- Położenie: x0 = 764, y0 = 208, 130 x 108 (prawe skrzydło), rośnie: nie.

### 17 Łąka#2

- Położenie: x0 = 684, y0 = 312, 80 x 96 (ogon), rośnie: nie.
- krawędź północna, x 723-725: bez zmian, do 23 Skraj lasu.

### 18 Łąka#3

- Położenie: x0 = 26, y0 = 225, 90 x 76 (lewe skrzydło), rośnie: +10/+0.

### 162 Garnizon nad zatoką

- Położenie: x0 = 206, y0 = 260, 112 x 100 (lewe skrzydło), rośnie: +0/+20.
- krawędź północna, x 227-229: cel z 125 Przystań na 950 Zbocze pod Pustelnią.
- krawędź zachodnia, y 280-281: bez zmian, do 165 Wrak na mieliźnie.
- NOWE przejście do 111 Podgrodzie (kratka świata 292, Trakt zachodni).

### 165 Wrak na mieliźnie

- Położenie: x0 = 126, y0 = 260, 80 x 60 (lewe skrzydło), rośnie: nie.
- krawędź wschodnia, y 280-281: bez zmian, do 162 Garnizon nad zatoką.

### 155 Pustelnia na klifie

- Położenie: x0 = 186, y0 = 146, 96 x 72 (lewe skrzydło), rośnie: nie.
- krawędź południowa, x 209-211: cel z 125 Przystań na 950 Zbocze pod Pustelnią.
- krawędź wschodnia, y 163-164: bez zmian, do 157 Urwisko Kruków.

### 157 Urwisko Kruków

- Położenie: x0 = 282, y0 = 144, 122 x 72 (lewe skrzydło), rośnie: +10/+0.
- krawędź zachodnia, y 163-164: bez zmian, do 155 Pustelnia na klifie.
- krawędź wschodnia, y 163-164: cel z 159 Przylądek z latarnią na 13 Góry i kamieniołom.

### 159 Przylądek z latarnią

- Położenie: x0 = 620, y0 = 112, 104 x 80 (prawe skrzydło), rośnie: nie.
- krawędź południowa, x 649-651: cel z 13 Góry i kamieniołom na 4 Łąka#1.
- krawędź zachodnia, y 152-154: bez zmian, do 120 Osada Milczących.
- krawędź zachodnia, y 145-146: cel z 157 Urwisko Kruków na 120 Osada Milczących.

## Nowe mapy

Każda stoi przy brzegu, dotyka rodzica i innych sąsiadów całą wspólną krawędzią i ma ścieżkę z rodzicem (do każdego punktu brzegu da się dojść albo go zobaczyć). Brzeg wynika z maski. Bez zadań, bez treści w morzu.

| nr | nazwa | rozmiar | x0, y0 | część kruka | co na niej | wejście z (rodzic) | sąsiedzi |
|---|---|---|---|---|---|---|---|
| 900 | Pola pod grzbietem | 75 x 60 | 689, 192 | prawe skrzydło | pola i łąka za Łąką#1, droga do Spalonej zagrody, widok na wzgórza | 4 Łąka#1 | 4, 23, 159, 168, 912 |
| 901 | Sady pod dworem | 80 x 42 | 524, 312 | prawe skrzydło | sady i ogrody Lorda, ścieżka nad zatokę | 24 Posiadłość Lorda | 8, 20, 24, 125 |
| 910 | Północny klif lewego skrzydła II | 120 x 80 | 66, 145 | lewe skrzydło | klif z widokiem na morze albo plaża do chodzenia; ścieżka od rodzica, kilka drzew i skał | 18 Łąka#3 | 18, 155, 918, 950 |
| 912 | Północny brzeg pól | 120 x 60 | 764, 148 | prawe skrzydło | klif z widokiem na morze albo plaża do chodzenia; ścieżka od rodzica, kilka drzew i skał | 168 Spalona zagroda | 168, 900, 936 |
| 914 | Zatoczka pod ogonem | 80 x 80 | 360, 434 | ogon | klif z widokiem na morze albo plaża do chodzenia; ścieżka od rodzica, kilka drzew i skał | 21 Leśna droga | 21, 125 |
| 917 | Cypel ogona | 120 x 60 | 298, 361 | ogon | klif z widokiem na morze albo plaża do chodzenia; ścieżka od rodzica, kilka drzew i skał | 111 Podgrodzie | 111 |
| 918 | Północny klif lewego skrzydła IV | 60 x 40 | 6, 185 | lewe skrzydło | przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze | 910 Północny klif lewego skrzydła II | 18, 910 |
| 920 | Wschodni brzeg ogona II | 60 x 40 | 540, 434 | ogon | przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze | 21 Leśna droga | 21, 125, 922 |
| 922 | Wschodni brzeg ogona III | 60 x 40 | 552, 394 | ogon | przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze | 125 Przystań | 125, 920 |
| 923 | Cypel ogona II | 60 x 40 | 624, 376 | ogon | przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze | 20 Dom dziadka | 17, 20 |
| 930 | Północny klif lewego skrzydła | 120 x 80 | 278, 64 | lewe skrzydło | klif z widokiem na morze albo plaża do chodzenia; ścieżka od rodzica, kilka drzew i skał | 157 Urwisko Kruków | 157, 932, 935 |
| 931 | Grań nad szczytem | 120 x 60 | 388, 0 | głowa | klif z widokiem na morze albo plaża do chodzenia; ścieżka od rodzica, kilka drzew i skał | 175 Orla Grań | 175, 935 |
| 932 | Północny klif lewego skrzydła III | 100 x 40 | 178, 104 | lewe skrzydło | klif z widokiem na morze albo plaża do chodzenia; ścieżka od rodzica, kilka drzew i skał | 930 Północny klif lewego skrzydła | 930 |
| 933 | Wschodni brzeg ogona | 80 x 80 | 764, 316 | ogon | klif z widokiem na morze albo plaża do chodzenia; ścieżka od rodzica, kilka drzew i skał | 168 Spalona zagroda | 17, 168 |
| 934 | Północny brzeg pól II | 60 x 40 | 560, 84 | prawe skrzydło | przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze | 120 Osada Milczących | 120, 159, 175 |
| 935 | Północny klif lewego skrzydła V | 60 x 40 | 328, 24 | lewe skrzydło | przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze | 931 Grań nad szczytem | 930, 931 |
| 936 | Północny brzeg pól III | 60 x 40 | 724, 108 | prawe skrzydło | przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze | 159 Przylądek z latarnią | 159, 912 |
| 950 | Zbocze pod Pustelnią | 96 x 42 | 186, 218 | lewe skrzydło | zbocze i skraj lasu pod Pustelnią, ścieżka od Pustelni w dół do puszczy; od zachodu lądowe przejście do lewego skrzydła | 155 Pustelnia na klifie | 155, 162, 165, 910 |
| 951 | Zachodnie klify | 60 x 40 | 146, 320 | lewe skrzydło | przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze | 162 Garnizon nad zatoką | 162, 165 |

## Przystań pod miastem

- **Przystań (125) leży bezpośrednio pod Okolicami Tawerny (8)**: 8 ma x0 = 420, y0 = 216 (104 x 138), 125 ma x0 = 420, y0 = 354 (112 x 80); wspólna krawędź to całe 104 kratki dolnej krawędzi miasta.
- Południowa brama miasta (kratki świata x 444-446 na dolnej krawędzi 8, lokalnie 24-26) wchodzi do Przystani w tej samej kratce (lokalnie w 125 też x 24-26; dziś jej wyjście północne jest przy x 14-16, więc przesuwa się o 10 kratek; to mapa spoza listy gracza). Droga kończy się przy nabrzeżu (zdarzenie „Miejsce: nabrzeze”).
- **Wpływ od lewej strony ogona, pod lewym skrzydłem.** Świat ma zatokę w kącie między lewym skrzydłem a ogonem (10599 kratek morza wcięte w ląd): osłonięta, łagodnie zwężająca się ku basenowi; statki wpływają od zachodu i południowego zachodu, płyną wzdłuż lewego boku ogona i kończą w basenie Przystani. Skrzydło jest nad zatoką, ogon po jej prawej, kruk zostaje czytelny.
- **Basen Map125 (zachodnia część mapy, lokalnie x 0-20) jest teraz morzem z maski**, woda kafelków, przez którą nie da się przejść, = morze świata; pomosty i nabrzeże zostają lądem. Mapy nie odbijamy. Morze do domalowania w 125: 0 kratek (0.0%), na pustym terenie (zatoka wchodzi w dolny i zachodni pas mapy), treść w morzu: 0.
- **Dawna „Zatoka portowa” (902) na wschodzie znika**: wschodni brzeg ogona przy porcie to zwykły ląd (brzeg z maski). Leśna droga (21) stoi teraz pod Przystanią (x0 = 440, y0 = 434, 100 x 80), droga z nabrzeża prowadzi do niej.
- **Polna droga (22)** nie leży pod miastem: stoi na wschód od miasta (x0 = 524, y0 = 192, 85 x 60), nad Posiadłością Lorda; łączy się z miastem (górna część wschodniej krawędzi) i z Osadą Milczących (na północ). To droga na pola.
- Lewe skrzydło bez portu: Podgrodzie -> Garnizon -> Wrak (i drugi ciąg Góry -> Urwisko -> Pustelnia).

## Suche koryto rzeki

Decyzja gracza: ślad po rzece tak, ale **bez wody**. Wzdłuż całego biegu jest suche koryto: popękane błoto, kamienie i otoczaki, suche trzciny przy skarpach (na rysunku ciemna skarpa i jasne dno z otoczakami). Rzeka znika **pod wzgórzem zamkowym** (wlot, czarny łuk w Górach, kratka świata (474, 208)) i wypływa **suchym jarem (fosą) tuż przed murem Podgrodzia i miasta** (wylot, kratka świata (413, 253)), jak fosa; jar poszerza się od 3 do 7 kratek i kończy się **w basenie Przystani** (dawne ujście rzeki: port zbudowano w ujściu, a dolną część wypełnia dziś morze).

- Część A (Góry): kratki świata (452,78) (453,88) (457,113) (462,142) (468,168) (473,190) (474,206). Część B (jar za murem do basenu): kratki świata (413,253) (413,260) (413,278) (413,299) (414,322) (415,340) (419,352) (424,357) (429,360) (432,360).
- Jar leży w **nowym pasie 10 kolumn wstawionych przed murem Podgrodzia** (Map111, lokalnie x 90-99; mur z bramą przesuwa się na x 100-101), więc **nie idzie po żadnym budynku, zadaniu ani miejscu**. Okolice Tawerny (8) bez zmian: zachodni mur miasta stoi na x 0-2, domy od x 4. Drogę z placyku do bramy Podgrodzia przecina **most** (kamienny, jeden); brama stoi po drugiej stronie fosy, za mostem. Szczegóły zmian w Map111: sekcja „Mapy gracza”.
- Przebieg przez krawędzie map: 8 Okolice Tawerny <-> 125 Przystań, x 420; 111 Podgrodzie <-> 8 Okolice Tawerny, y 354; 175 Orla Grań <-> 13 Góry i kamieniołom, x 458.
- **Oceniony i odrzucony inny bieg:** (1) przez Okolice Tawerny ulicą: po budynkach i miejscach; (2) przez wąski pas między płotem a murem Podgrodzia bez powiększenia: tylko 4 wolne kolumny (x 86-89) i tylko do y ok. 66, dalej budynki; (3) na zachód od Podgrodzia: między Górami a Garnizonem nie ma map (puszcza), trasa 140 kratek przez treść Urwiska i Garnizonu, kończyłaby się daleko od basenu. Wariant „za murem” z 10 nowymi kolumnami w Map111 jest najkrótszy i ma zero zmian w istniejącej treści.

## Dom dziadka, Kruczy Jar i Lord

- **Dom dziadka (20) dotyka Kruczego Jaru (3) od południa**: wychodzisz z podwórza i jesteś na swoim polu (wyjście południowe 3 w kratkach x 8-10 lokalnie wchodzi do 20). Dom dziadka rośnie o 20 kratek w prawo, żeby objąć całą dolną krawędź pola.
- **Posiadłość Lorda (24) dotyka pola od zachodu** (wyjście zachodnie 3 do 24), więc Lord zabiera pole za długi tuż obok.
- Trasa do miasta: 20 Dom dziadka -> 3 Kruczy Jar -> 24 Posiadłość Lorda -> 8 Okolice Tawerny.

## Szlak górski

Z północnej bramy miasta (8) w górę do Gór (13) i dalej na Orlą Grań (175): droga w kratkach świata (445,224), (456,172), (466,130), (459,72). Przecina wspólną krawędź 8 / 13 w x ok. 460 i 13 / 175 w x ok. 452 (lokalnie w 13: x 49-51 i x 52-54 od lewej).

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

## Wyjątek: łacha Garnizon / Wrak (162 <-> 165)

Zasada gry (Garnizon.js, Garnizon_Data `BAR`, Wrak.js): do wraku dochodzi się **wyłącznie łachą w odpływie**. Łacha leży w 162 w rzędach 20-21, x 0-11: to kafle morza, które w odpływie (Wyspa.tide, przełącznik 20) są mokrym piaskiem (obraz Garnizon_Lacha). Jej koniec (0, 20-21) prowadzi do 165 (79, 20-21). **Lądowej drogi do wraku nie ma i nie będzie.**

- **Układ:** 165 stoi tak, że rzędy 20-21 (i 22, piasek wraku) jej wschodniej krawędzi leżą na tej samej wysokości świata co łacha 162: **y 280-282**; 165 = (126, 260), jej wschodnia krawędź (x 206) jest wspólna z zachodnią krawędzią 162. Żadnej mapy pomiędzy nimi.
- **Morze:** woda 162 (zatoka, x 0-11+) i woda 165 są twarde; poza rzędami 20-22 obie strony wspólnej krawędzi to morze po obu stronach. Maska nie ma w tym miejscu lądowego przesmyku.
- **Wyjątek w sprawdzaniu** (`WYJATKI_UCIETE` w `swiat_kratki.py`): rzędy 20-22 tej krawędzi (162 W, 165 E) nie liczą się jako ucięcie: po stronie 162 kafle morza (łacha), po stronie 165 piasek.
- **Szlak:** droga lądowa (`Trakt zachodni`) kończy się na plaży Garnizonu przy początku łachy (zdarzenie „Miejsce: brzeg” w 162, x 17, y 22), nie w 165. „wrak_przybicie” (165, x 35, y 18) jest po stronie Wraku i dochodzi się do niego tylko łachą.
- **Dla budowniczego:** w 162 rzędy 20-21, x 0-11 zostają kaflami morza z mechanizmem pływów (jak dziś); w 165 rzędy 20-22 przy wschodniej krawędzi zostają piaskiem, a przejścia „Łacha -> Wrak” i „Przejście -> Garnizon (łacha w odpływie)” bez zmian. Pozostałe kratki tej krawędzi po obu stronach: morze.

## Pytania do gracza

1. Czy kształt wyspy po wybrzuszeniach i z zatoką pod lewym skrzydłem wokół treści (`swiat_podglad.png`) jest dla Ciebie nadal rozpoznawalnym krukiem? Skrzydła są pełniejsze, bo osady i latarnia musiały zostać na lądzie. Jeśli kruk ma być szczuplejszy, trzeba przenieść treść tych map w głąb, a nie dokładać lądu.
2. Czy lista zmian na mapach gracza (3, 4, 8, 13, 23, 24, 111) jest do przyjęcia? Najwięcej na 13 (cele i miejsce wyjść) i 111 (morze po lewej i u dołu, wyjście zachodnie do Garnizonu).
3. **Suche koryto za zachodnim murem**: zgoda na powiększenie Map111 (Podgrodzie, mapa gracza) o 10 kolumn w prawo za murem i przesunięcie jej wschodniego wyjścia z x 91 na x 101 (most nad korytem)? Alternatywy w sekcji o korycie.
4. Środek lewego skrzydła (puszcza i skały bez map) zostaje bez zmian?
