# Mapa kruka: propozycja ułożenia map plenerowych

2026-10-30. To jest **propozycja do oceny**. Nic w `data/` ani `js/` nie zostało zmienione. Narzędzie: `tools/mapy/kruk.py` (układ liczy się sam, potem poprawiony ręcznie). Dane liczbowe: `kruk_wynik_A.json`, `kruk_wynik_B.json`. Maska lądu kruka (z „Atlasu Kruczej Wyspy”): `kruk_maska.png`.

Obrazki (patrz na nie najpierw):

- `kruk_propozycja_A.png`: **polecany**, mała skala, 8 nowych map.
- `kruk_propozycja_B.png`: większy kruk, 19 nowych map.

Jak czytać obrazek: na jasnobrązowej sylwetce kruka stoją prawdziwe miniatury map, pomarańczowe ramki to nowe mapy. Kropki to linia brzegu kruka: **zielone** leżą na jakiejś mapie, **czerwone** nie. Niebieskie kreski to nowe przejścia, zielone kropki na krawędziach to obecne przejścia, które zostają. Czerwone przerywane linie (z numerami par map) to dawne przejścia, które znikają.

## Skala i dlaczego

| | A (polecany) | B |
|---|---|---|
| kratek na piksel Atlasu | 0,70 (1 kratka = 1,43 piksela) | 0,85 (1 kratka = 1,18 piksela) |
| kruk ma | 752 x 444 kratek | 910 x 540 kratek |
| nowe mapy | 8 | 19 |
| brzeg leży na mapie | **95,6%** | 95,5% |

Dlaczego 0,70: 21 obecnych map to razem ok. 141 tys. kratek, a ląd kruka przy skali 0,70 to ok. 130 tys. Mapy ledwo mieszczą się w sylwetce bez nakładania. Mniejsza skala zmusza do nakładania map, większa zostawia coraz więcej pustego lądu i wymaga coraz więcej nowych map na brzegi. W wariancie B środek (mapy i przejścia) jest **dokładnie ten sam** co w A, tylko kruk jest większy, więc brzeg dopełnia 19 nowych map. Obie sylwetki mają w środku nieprzechodnie „wnętrze” (las, skały) bez map, między skrzydłami a tułowiem. Pomysł: to dzikie ostępy, do których droga nie prowadzi. Brzeg wokół nich jest pokryty.

## Gdzie stoi każda mapa (wariant A)

Położenie: lewy górny róg w kratkach od lewego górnego rogu ramki kruka (x, y), oraz środek mapy na Atlasie (piksele). `*` = mapa gracza.

| mapa | część kruka | x, y (kratki) | środek na Atlasie |
|---|---|---|---|
| 175 Orla Grań | głowa, szczyt | 323, -1 | 640, 99 |
| 13 Góry i kamieniołom * | barki, góry | 364, 60 | 716, 212 |
| 157 Urwisko Kruków | lewe ramię | 252, 101 | 550, 254 |
| 155 Pustelnia na klifie | lewe skrzydło, góra | 156, 106 | 401, 261 |
| 120 Osada Milczących | prawe ramię, góry | 484, 55 | 870, 185 |
| 159 Przylądek z latarnią | prawe skrzydło, góra | 580, 87 | 1013, 239 |
| 8 Okolice Tawerny * | tułów, na prawo od rzeki | 424, 165 | 790, 392 |
| 111 Podgrodzie * | tułów, po lewej od miasta | 332, 195 | 650, 417 |
| 24 Posiadłość Lorda * | prawe skrzydło, przy mieście | 529, 202 | 923, 389 |
| 21 Leśna droga | prawe skrzydło | 609, 211 | 1037, 402 |
| 20 Dom dziadka | prawe skrzydło (pola i zagroda) | 612, 167 | 1027, 328 |
| 168 Spalona zagroda | koniec prawego skrzydła | 689, 190 | 1166, 392 |
| 125 Przystań (+40 w prawo) | zatoka pod prawym skrzydłem, tuż przy mieście | 528, 271 | 973, 502 |
| 162 Garnizon (+36 w dół) | lewe skrzydło, dół | 220, 194 | 504, 418 |
| 165 Wrak na mieliźnie | lewe skrzydło, dół | 140, 197 | 367, 388 |
| 22 Polna droga | ogon, zaraz pod miastem | 439, 304 | 794, 535 |
| 23 Skraj lasu * | ogon | 438, 365 | 793, 622 |
| 3 Kruczy Jar * | ogon | 357, 367 | 677, 625 |
| 4 Łąka#1 * | ogon | 359, 307 | 680, 539 |
| 17 Łąka#2 | koniec ogona | 357, 427 | 677, 722 |
| 18 Łąka#3 | ogon, lewa strona | 277, 365 | 563, 634 |

Zgodność z Atlasem: szczyt na głowie, góry na barkach, miasteczko na prawo od rzeki w dolnej części tułowia, pola i zagroda na prawym skrzydle, lasy na lewym skrzydle i w ogonie. Odstępstwa: Podgrodzie (111) i Garnizon (162) stoją na tułowiu, bo tak łączą się z miastem; Góry (13) leżą pod głową, ale Orla Grań (175) jest nad nimi (wspinaczka 13 → 175 zostaje, nie jest krawędzią).

## Przystań przy mieście (dodatkowy warunek gracza)

Przystań (125) stoi **na wschód od miasta, przy jego dolnym rogu**, tam gdzie na Atlasie jest zatoka między prawym skrzydłem a ogonem. Wejście z miasta: dolna część wschodniej krawędzi Okolic Tawerny (8) prowadzi na zachodnią krawędź Przystani. Podróżni ze statku wchodzą więc od razu do miasta.

Co to zmienia w przejściach:

- **8 ↔ 125: nowe** (8: (103,122), Przystań: (1,16)).
- **111 ↔ 125: znika**. Podgrodzie nie jest już drogą do portu. Zachodnie wyjście Podgrodzia (111, (0,56)) prowadzi do Garnizonu (162, (110,57)).
- **125 ↔ 155 (Pustelnia): znika**. Pustelnia zostaje połączona z Urwiskiem Kruków (157), zachowane przejście 155 ↔ 157. Do Pustelni dochodzi się teraz przez Urwisko (a to przez Góry, 13).
- **125 ↔ 162 (Garnizon): znika**. Garnizon łączy się z Podgrodziem (111) i z Wrakiem (165).
- Lewe skrzydło: bez portu staje się samodzielne: Podgrodzie → Garnizon → Wrak → nowe mapy brzegowe na końcu skrzydła; druga droga: Góry (13) → Urwisko (157) → Pustelnia (155) → nowy klif.

Uwaga do oceny: obecnie Przystań ma morze po zachodniej i południowej stronie, a wejście z miasta wypada na jej **zachodniej krawędzi**. Trzeba tam dorobić nabrzeże / drogę w głąb (do sprawdzenia w edytorze). Alternatywa (wejście od północy, droga „pod bramą w dół”) wymaga, żeby Polna droga (22) przestała leżeć pod miastem, i kosztuje więcej obecnych przejść (patrz pytania).

## Zmiany przejść

Obecnych par map z przejściami: 20. **Zostaje 11**, 9 się zmienia (te same pary, strona i przesunięcie zgodne, tolerancja ok. 1 kratki przy wdrożeniu).

**Zostają** (11): 3↔4, 3↔17, 3↔18, 3↔23, 8↔22, 8↔24, 8↔111, 20↔21, 22↔23, 155↔157, 162↔165.

### Mapy gracza (zmiany do Twojej zgody)

Mapy gracza w układzie: 3, 4, 8, 13, 23, 24, 111. Zmiany na nich:

| mapa | zmiana |
|---|---|
| **13 Góry i kamieniołom** | znika wyjście północne do Osady (120) i wyjście wschodnie do Latarni (159, y 11-13) oraz zachodnie do Leśnej drogi (21, y 38-40). Nowe: **wschodnie** do Osady (13 (119,31) ↔ 120 (1,36)) i **zachodnie** do Urwiska Kruków (13 (0,68) ↔ 157 (110,27)). Czyli trzy krawędzie zmieniają cel, dwie z nich zmieniają miejsce. |
| **111 Podgrodzie** | wyjście zachodnie (0,19) do Przystani zmienia cel na Garnizon (0,56) ↔ 162 (110,57). |
| **8 Okolice Tawerny** | **nowe** wyjście na wschodniej krawędzi (103,122) do Przystani. Reszta bez zmian. |
| **24 Posiadłość Lorda** | **nowe** wyjście wschodnie (79,34) do Leśnej drogi (21, (1,25)). Zachodnie do miasta zostaje. |
| 3, 4, 23 | bez zmian (23 traci tylko przychodzące z 168 jednokierunkowe przejście, po stronie 168). |

Najmniej zmian: 13 (3 krawędzie), reszta po jednym wyjściu.

### Pozostałe mapy

- **21 Leśna droga**: znikają wyjścia zachodnie (do 22) i wschodnie (do 13). Nowe: zachodnie do Posiadłości Lorda (24), wschodnie do Spalonej zagrody (168, 21 (79,30) ↔ 168 (1,51)). Północne do Domu dziadka (20) zostaje.
- **22 Polna droga**: znika wschodnie wyjście do 21.
- **125 Przystań**: znikają E → 111, N → 155, S → 162. Nowe: zachodnie do miasta (8).
- **155 Pustelnia**: znika południowe do Przystani.
- **162 Garnizon**: znika północne do Przystani. Nowe: wschodnie do Podgrodzia (111).
- **157 Urwisko Kruków**: znika wschodnie do Latarni (159). Nowe: wschodnie do Gór (13).
- **159 Latarnia**: znikają zachodnie (do 157) i południowe (do 13). Nowe: zachodnie do Osady (120, 120 (95,50) ↔ 159 (1,18)).
- **120 Osada Milczących**: znika południowe do Gór. Nowe: zachodnie do Gór.
- **168 Spalona zagroda**: znika wschodnie jednokierunkowe do Skraju lasu (23). Nowe zachodnie do 21.
- **Dojście z domu dziadka do miasta** idzie teraz: 20 → 21 → 24 (Posiadłość Lorda) → 8.

## Nowe mapy i zmiany rozmiarów (wariant A)

Powiększenia na zewnątrz (tylko w prawo lub w dół, jak `tools/powieksz`, na stronach bez przejść):

| mapa | zmiana | po co |
|---|---|---|
| 125 Przystań | +40 w prawo (152 x 80) | brzeg zatoki pod prawym skrzydłem |
| 162 Garnizon | +36 w dół (112 x 116) | dolny brzeg lewego skrzydła |
| 165 Wrak | +8 w dół (80 x 68) | dolny brzeg |

Nowe mapy (wejście z podanej mapy; idea: miejsce z widokiem na morze, klif lub plaża, do której da się dojść):

| nr | nazwa | rozmiar | gdzie na kruku | skąd się wchodzi | co |
|---|---|---|---|---|---|
| 900 | Zachodnie mielizny | 120 x 80 | dolny brzeg lewego skrzydła | 165 Wrak, krawędź zachodnia | plaża i piaskowe mielizny, wrak widać w dali; możliwe miejsce plaży z prologu |
| 901 | Zachodni klif | 120 x 80 | górny brzeg lewego skrzydła | 155 Pustelnia, zachodnia | klif widziany z góry, ścieżka na skraj, kruki |
| 902 | Cypel końca skrzydła | 80 x 80 | czubek lewego skrzydła | 900, zachodnia | skalny cypel z widokiem na ocean |
| 903 | Północny brzeg pól | 80 x 60 | koniec prawego skrzydła | 168 Spalona zagroda, północna | skalisty brzeg za polami |
| 904 | Północny klif Pustelni | 80 x 60 | górny brzeg lewego skrzydła | 155 Pustelnia, północna | urwisko z widokiem |
| 905 | Grzbiet nad Urwiskiem | 60 x 60 | lewe ramię, góra | 157 Urwisko Kruków, północna | grań z widokiem na zatokę |
| 906 | Zatoczka pod Garnizonem | 50 x 50 | lewy dolny brzeg ogona | 162 Garnizon, południowa | mała zatoczka, pomost |
| 907 | Przełęcz pod Orlą Granią | 40 x 40 | lewy bok szyi głowy | 175 Orla Grań, południowa | wąska przełęcz z widokiem |

Wariant B dodaje do tego jeszcze 11 map (razem 19): m.in. szczyt na czubku głowy (nad Orlą Granią), dwa dodatkowe odcinki końca lewego skrzydła, dwa końca prawego skrzydła, dwa pod tułowiem i końcem ogona. Pełna lista z położeniem: `kruk_wynik_B.json`.

## Pokrycie brzegu

Wariant A: **95,6% linii brzegu kruka leży na jakiejś mapie**. Same obecne mapy w obecnych rozmiarach pokrywają 49,8% (przy powiększeniach 66,7%), resztę dają nowe mapy. Wariant B: 95,5%.

Niepokryte (A, razem ok. 234 px Atlasu z ok. 5300, same drobne ostrogi, każdą da się domknąć powiększeniem sąsiada o 5-12 kratek albo nowym fragmentem):

| odcinek | długość (px Atlasu) | gdzie |
|---|---|---|
| środek Atlasu (150, 286) | 26 | czubek lewego skrzydła, nad cyplem 902 |
| (342, 207) | 24 | górny brzeg lewego skrzydła, między 901 i 904 |
| (918, 443), (1090, 446) | po 15 | dolny brzeg prawego skrzydła, przy 125 i 168 |
| (519, 576) | 15 | lewy brzeg ogona, przy 18 |
| 7 mniejszych | po 4-9 | pojedyncze piksele brzegu przy łączeniach map |

W wariancie B niepokryte są ostatnie ok. 242 px, podobnie rozproszone.

Mapy nakładają się tylko w jednym miejscu: 23 z 4 (2 kratki²); do usunięcia przesunięciem przejścia 3 ↔ 4 o 1-2 kratki.

Uwaga: „leży na mapie” znaczy tyle, że brzeg wypada w prostokącie mapy. Samo morze i brzeg trzeba w tych mapach dopiero narysować (np. Okolice Tawerny nie mają dziś wody tam, gdzie wypada zatoka, a Przystań potrzebuje nabrzeża od zachodu).

## Co zmienia się w fabule (tylko opis, niczego nie zmieniam)

- **Podróżni z promu** (`js/plugins/Podroznicy.js`, `Podroznicy_Data.js`, `Podroznicy5*.js`): scena przystani nadal dzieje się na Map125 (pomost, przybyli, odpływający, Urszula). Zmienia się tylko to, co po drodze: wcześniej nowi szli Przystań → Podgrodzie (111) → miasto, teraz Przystań → miasto bezpośrednio, krótko i bez Podgrodzia. Wypływają z tej samej przystani, ale widać ich z miasta. Nazwy i współrzędne w `PRZYSTAN` (20,16) pozostają.
- **Prolog** (`docs/prolog/SCENOPIS.md`, scena 5 „Plaża o świcie”): plansza z wrakiem i ścieżką przez wydmy nie jest mapą, więc nic się nie psuje. Zmienia się logika miejsca: Janek (chata 126 w Przystani) „przyniósł z plaży”. Są dwie możliwości: plaża = zatoka przy Przystani (blisko miasta, kuter rozbity w zatoce; pasuje do ścieżki do miasta) albo plaża = Zachodnie mielizny (nowa 900, wrak 165 daleko od Janka, więc Janek niósłby daleko). Polecam pierwszą.
- **Pustelnia i Garnizon**: tracą bezpośrednie wyjście do portu. Garnizon staje się drogą z miasta (przez Podgrodzie) na zachodnie wybrzeże. Pustelnia: tylko przez Urwisko i Góry (albo przez nowy klif).
- **Dom dziadka (start)**: dojście do miasta wiedzie przez Posiadłość Lorda.

## Pytania do gracza

1. **A czy B?** Polecam A: 8 nowych map, mało roboty. B daje większy świat, ale 19 nowych map.
2. **Przystań na wschód od miasta** (wejście od zachodu, trzeba dorobić nabrzeże) czy od północy (8 południe ↔ 125 północ, „droga spod bramy w dół”)? Druga wersja jest bliższa Atlasowi, ale wtedy Polna droga (22) i cały ogon (22, 23, 3, 4, 17, 18) muszą przesunąć się na południowy zachód i traci się kilka obecnych przejść.
3. **Mapy gracza**: zgoda na zmiany na 13 (trzy krawędzie), 111 (zachodnia), 8 i 24 (po jednym nowym wyjściu)?
4. **Dom dziadka (20) i Kruczy Jar (3)**: dziś „działka dziadka” (3) jest w ogonie, a dom (20) na prawym skrzydle. Atlas ma pola i zagrodę na prawym skrzydle. Zostawić tak, czy przenieść Kruczy Jar z łąkami (3, 4, 17, 18, 23) na prawe skrzydło (gubi to kilka przejść)?
5. **Pusty środek** (ostęp między skrzydłami a tułowiem): zostawić jako nieprzechodni las i góry, czy dołożyć mapy w środku?
6. **Osada Milczących (120)**: w tym układzie stoi na prawym ramieniu, obok Gór (wchodzi się z Gór od wschodu, nie od północy). Ok?
7. Nowe mapy: czy mają być sceneriami do oglądania (klif widziany z góry, ścieżka na skraj) czy z zadaniami?

## Co dalej po zatwierdzeniu

1. **Przejścia**: wpisać zmiany z tabel wyżej w mapach (krawędzie, `Wyspa_Data.js` EDGES i LINKS, wspinaczka 13 → 175) i sprawdzić tool `tools/mapy/swiat.py` (ma pokazać 0 niezgodnych przejść i 0 nakładań).
2. **Brzegi**: dorysować morze i brzeg tam, gdzie kruk ma wodę (Przystań od zachodu, miasto od południowego wschodu), nowe mapy brzegowe i powiększenia (`tools/powieksz`), kontrola `tools/mapy/kontrola.py`.
3. **Mapa w menu P w kształcie kruka**: w `js/plugins/MapaWyspy_Data.js` podmienić BRZEG na kontur kruka (z `kruk_maska.png`) i położenia `x`, `y` każdego miejsca na te z tabeli (kratki podzielić przez rozmiar kruka: 752 x 444 w wariancie A), dodać nowe mapy jako miejsca i nowe DROGI.
4. Testy ścieżek: `tests/`, w tym przejścia 8 ↔ 125 oraz przybycie podróżnych z promu.
