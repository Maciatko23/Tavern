# Przegląd ekran po ekranie - lista defektów

Zrobione 2026-11-11 (tylko odczyt - żadnego pliku gry nie ruszono). Każdy ekran każdej mapy świata (27x15 kratek, zakładka 2 kratki, bohater schowany, bez pogody, dzień 40 godz. 11; wnętrza w swoim świetle) obejrzany oczami, plus detektory z danych map (`tools/przeglad_ekranow/detektory.py`). Zdjęcia ekranów: `tools/przeglad_ekranow/zrzuty/<mapa>/<x>_<y>.png`, arkusze: `zrzuty/_arkusze/`.

**Waga:** 3 = rzuca się w oczy od razu, 2 = widoczny, 1 = drobiazg. **Źródło:** `auto` = znalazł tylko detektor, `oko` = tylko ja na ekranie, `auto+oko` = oba. Obrazek w kolumnie ostatniej: wycinek z gry w pełnej skali, czerwona ramka = miejsce. Kratki podane jako `x,y` (szer x wys); bohater nie stoi na wycinku.

Uwaga o detektorach: wiersze `auto` są łączone w skupiska (kilka trafień w promieniu 4 kratek = jeden wiersz, w opisie `+N podobnych`). Detektory zostawiają trochę fałszywych alarmów (zwłaszcza `niewidzialna blokada` i `region 2`) - oznaczono je w kolumnie opisu.

## Podsumowanie wag

Razem **586** wierszy: waga 3 - 109, waga 2 - 310, waga 1 - 167; `auto` 469, `oko` 48, `auto+oko` 69.

## Ile defektów na mapę

| mapa | nazwa | razem | waga 3 | waga 2 | waga 1 |
|---|---|---|---|---|---|
| 1 | TAWERNA | 11 | 1 | 6 | 4 |
| 3 | Kruczy Jar | 26 | 3 | 15 | 8 |
| 4 | Łąka pod Gawrą | 29 | 11 | 10 | 8 |
| 8 | Kruczogród | 128 | 37 | 69 | 22 |
| 13 | Góry i kamieniołom | 68 | 4 | 41 | 23 |
| 20 | Dom dziadka - Podwórze | 13 | 3 | 3 | 7 |
| 24 | Posiadłość Lorda | 37 | 6 | 14 | 17 |
| 102 | Piekarnia | 1 | 1 | 0 | 0 |
| 111 | Podgrodzie | 121 | 21 | 55 | 45 |
| 118 | Dno studni | 1 | 0 | 1 | 0 |
| 119 | Archiwum zakonu | 2 | 0 | 2 | 0 |
| 120 | Osada Milczących | 7 | 3 | 3 | 1 |
| 125 | Przystań | 68 | 11 | 43 | 14 |
| 162 | Garnizon nad zatoką | 37 | 3 | 22 | 12 |
| 168 | Spalona zagroda | 17 | 3 | 12 | 2 |
| 175 | Orla Grań | 11 | 2 | 7 | 2 |
| 181 | Stajnia z wozownią | 1 | 0 | 1 | 0 |
| 183 | Dom 2 (kamienica mieszczan) | 2 | 0 | 1 | 1 |
| 213 | Kopalnia pod Orlą Granią | 6 | 0 | 5 | 1 |

## Ile defektów na kategorię

| kategoria | razem | mapy (liczba) |
|---|---|---|
| kanciasta / prostokątna plama gruntu | 84 | 3(3), 8(13), 13(15), 20(6), 24(8), 111(23), 125(9), 162(7) |
| niewidzialna blokada (zdarzenie/kafel) | 65 | 1(3), 8(3), 13(2), 111(10), 125(21), 162(18), 168(6), 181(1), 183(1) |
| region 2 (blokada) na gołym gruncie | 63 | 1(3), 3(2), 4(8), 8(36), 24(2), 111(8), 125(4) |
| ucięty/pojedynczy grunt | 39 | 3(2), 4(5), 13(6), 24(5), 111(15), 125(3), 162(3) |
| kanciasta plama gruntu | 36 | 3(4), 8(2), 13(9), 20(1), 111(3), 120(1), 125(3), 168(4), 175(8), 213(1) |
| ucięty obiekt | 33 | 1(1), 3(2), 4(11), 8(7), 24(4), 111(2), 120(1), 125(4), 162(1) |
| zębata / dziurawa linia wzgórza | 30 | 3(3), 8(2), 13(20), 120(2), 125(3) |
| drzewo/krzak/skała na murze, dachu lub płocie | 26 | 3(1), 4(1), 8(5), 24(1), 111(14), 120(1), 125(1), 162(2) |
| luka w płocie | 26 | 8(6), 20(1), 24(1), 111(13), 125(4), 162(1) |
| obraz zachodzi na mur/dach/płot | 18 | 8(10), 20(1), 24(4), 111(2), 125(1) |
| cień-bryła (stałe kafle z gwiazdkami) | 18 | 8(6), 24(2), 111(7), 125(2), 162(1) |
| twardy czarny prostokąt cienia (warstwa 4) | 17 | 8(15), 213(2) |
| drzewo za blisko wody | 17 | 13(9), 111(2), 125(5), 162(1) |
| resztka / samotny płot | 15 | 3(2), 8(3), 13(3), 24(1), 111(3), 125(3) |
| brama bez słupków | 14 | 3(3), 4(2), 8(4), 20(1), 111(4) |
| obraz zdarzenia wystaje na wolną kratkę | 10 | 8(2), 13(1), 111(5), 118(1), 175(1) |
| pusty nudny obszar | 9 | 3(1), 4(1), 20(1), 24(1), 120(1), 125(1), 162(1), 168(1), 175(1) |
| długi prosty odcinek | 7 | 8(1), 24(1), 162(1), 168(3), 175(1) |
| zdarzenie na kaflu blokującym | 6 | 1(3), 8(3) |
| rama innego gruntu pod płotem/murem | 5 | 8(2), 111(3) |
| płot / obiekt narysowany na dachu | 5 | 8(3), 125(2) |
| luka w płocie / niedomknięty płot | 5 | 8(2), 20(1), 111(1), 168(1) |
| figura wygląda jak NPC / przedmiot | 5 | 24(2), 111(2), 125(1) |
| dwa grunty pod jednym obiektem | 5 | 24(1), 111(2), 125(1), 162(1) |
| uprawa tuż pod murem/płotem | 4 | 8(1), 20(1), 111(2) |
| pusty dywan | 3 | 1(1), 102(1), 183(1) |
| równo rozsiane drzewa/rzeczy | 3 | 3(1), 4(1), 168(1) |
| twardy czarny prostokąt cienia | 3 | 8(1), 120(1), 213(1) |
| wysoki obiekt bez gwiazdki | 3 | 24(2), 168(1) |
| gwiazdka nad wolną kratką | 3 | 119(2), 213(1) |
| drzewo z kafli bez gwiazdki | 2 | 3(1), 8(1) |
| zdarzenie nad postacią nad wolną kratką | 2 | 13(1), 24(1) |
| zaokrąglony koniec lica przy schodach | 2 | 13(2) |
| morze wygląda jak mgła | 1 | 3(1) |
| dziwny wzór / do oceny | 1 | 24(1) |
| dwa zdarzenia na jednej kratce | 1 | 213(1) |

## Mapa x kategoria (tylko niepuste)

- **1 TAWERNA**: niewidzialna blokada (zdarzenie/kafel) 3; zdarzenie na kaflu blokującym 3; region 2 (blokada) na gołym gruncie 3; ucięty obiekt 1; pusty dywan 1
- **3 Kruczy Jar**: kanciasta plama gruntu 4; zębata / dziurawa linia wzgórza 3; brama bez słupków 3; kanciasta / prostokątna plama gruntu 3; region 2 (blokada) na gołym gruncie 2; ucięty/pojedynczy grunt 2; resztka / samotny płot 2; ucięty obiekt 2; drzewo/krzak/skała na murze, dachu lub płocie 1; pusty nudny obszar 1; drzewo z kafli bez gwiazdki 1; równo rozsiane drzewa/rzeczy 1; morze wygląda jak mgła 1
- **4 Łąka pod Gawrą**: ucięty obiekt 11; region 2 (blokada) na gołym gruncie 8; ucięty/pojedynczy grunt 5; brama bez słupków 2; drzewo/krzak/skała na murze, dachu lub płocie 1; równo rozsiane drzewa/rzeczy 1; pusty nudny obszar 1
- **8 Kruczogród**: region 2 (blokada) na gołym gruncie 36; twardy czarny prostokąt cienia (warstwa 4) 15; kanciasta / prostokątna plama gruntu 13; obraz zachodzi na mur/dach/płot 10; ucięty obiekt 7; luka w płocie 6; cień-bryła (stałe kafle z gwiazdkami) 6; drzewo/krzak/skała na murze, dachu lub płocie 5; brama bez słupków 4; niewidzialna blokada (zdarzenie/kafel) 3; resztka / samotny płot 3; płot / obiekt narysowany na dachu 3; zdarzenie na kaflu blokującym 3; rama innego gruntu pod płotem/murem 2; obraz zdarzenia wystaje na wolną kratkę 2; zębata / dziurawa linia wzgórza 2; kanciasta plama gruntu 2; luka w płocie / niedomknięty płot 2; drzewo z kafli bez gwiazdki 1; twardy czarny prostokąt cienia 1; uprawa tuż pod murem/płotem 1; długi prosty odcinek 1
- **13 Góry i kamieniołom**: zębata / dziurawa linia wzgórza 20; kanciasta / prostokątna plama gruntu 15; drzewo za blisko wody 9; kanciasta plama gruntu 9; ucięty/pojedynczy grunt 6; resztka / samotny płot 3; niewidzialna blokada (zdarzenie/kafel) 2; zaokrąglony koniec lica przy schodach 2; zdarzenie nad postacią nad wolną kratką 1; obraz zdarzenia wystaje na wolną kratkę 1
- **20 Dom dziadka - Podwórze**: kanciasta / prostokątna plama gruntu 6; luka w płocie / niedomknięty płot 1; luka w płocie 1; obraz zachodzi na mur/dach/płot 1; uprawa tuż pod murem/płotem 1; pusty nudny obszar 1; brama bez słupków 1; kanciasta plama gruntu 1
- **24 Posiadłość Lorda**: kanciasta / prostokątna plama gruntu 8; ucięty/pojedynczy grunt 5; obraz zachodzi na mur/dach/płot 4; ucięty obiekt 4; figura wygląda jak NPC / przedmiot 2; region 2 (blokada) na gołym gruncie 2; cień-bryła (stałe kafle z gwiazdkami) 2; wysoki obiekt bez gwiazdki 2; długi prosty odcinek 1; dwa grunty pod jednym obiektem 1; luka w płocie 1; resztka / samotny płot 1; drzewo/krzak/skała na murze, dachu lub płocie 1; zdarzenie nad postacią nad wolną kratką 1; dziwny wzór / do oceny 1; pusty nudny obszar 1
- **102 Piekarnia**: pusty dywan 1
- **111 Podgrodzie**: kanciasta / prostokątna plama gruntu 23; ucięty/pojedynczy grunt 15; drzewo/krzak/skała na murze, dachu lub płocie 14; luka w płocie 13; niewidzialna blokada (zdarzenie/kafel) 10; region 2 (blokada) na gołym gruncie 8; cień-bryła (stałe kafle z gwiazdkami) 7; obraz zdarzenia wystaje na wolną kratkę 5; brama bez słupków 4; resztka / samotny płot 3; kanciasta plama gruntu 3; rama innego gruntu pod płotem/murem 3; figura wygląda jak NPC / przedmiot 2; drzewo za blisko wody 2; dwa grunty pod jednym obiektem 2; obraz zachodzi na mur/dach/płot 2; ucięty obiekt 2; uprawa tuż pod murem/płotem 2; luka w płocie / niedomknięty płot 1
- **118 Dno studni**: obraz zdarzenia wystaje na wolną kratkę 1
- **119 Archiwum zakonu**: gwiazdka nad wolną kratką 2
- **120 Osada Milczących**: zębata / dziurawa linia wzgórza 2; twardy czarny prostokąt cienia 1; drzewo/krzak/skała na murze, dachu lub płocie 1; kanciasta plama gruntu 1; pusty nudny obszar 1; ucięty obiekt 1
- **125 Przystań**: niewidzialna blokada (zdarzenie/kafel) 21; kanciasta / prostokątna plama gruntu 9; drzewo za blisko wody 5; region 2 (blokada) na gołym gruncie 4; ucięty obiekt 4; luka w płocie 4; ucięty/pojedynczy grunt 3; resztka / samotny płot 3; zębata / dziurawa linia wzgórza 3; kanciasta plama gruntu 3; cień-bryła (stałe kafle z gwiazdkami) 2; płot / obiekt narysowany na dachu 2; drzewo/krzak/skała na murze, dachu lub płocie 1; obraz zachodzi na mur/dach/płot 1; figura wygląda jak NPC / przedmiot 1; dwa grunty pod jednym obiektem 1; pusty nudny obszar 1
- **162 Garnizon nad zatoką**: niewidzialna blokada (zdarzenie/kafel) 18; kanciasta / prostokątna plama gruntu 7; ucięty/pojedynczy grunt 3; drzewo/krzak/skała na murze, dachu lub płocie 2; długi prosty odcinek 1; ucięty obiekt 1; drzewo za blisko wody 1; cień-bryła (stałe kafle z gwiazdkami) 1; dwa grunty pod jednym obiektem 1; luka w płocie 1; pusty nudny obszar 1
- **168 Spalona zagroda**: niewidzialna blokada (zdarzenie/kafel) 6; kanciasta plama gruntu 4; długi prosty odcinek 3; luka w płocie / niedomknięty płot 1; wysoki obiekt bez gwiazdki 1; równo rozsiane drzewa/rzeczy 1; pusty nudny obszar 1
- **175 Orla Grań**: kanciasta plama gruntu 8; długi prosty odcinek 1; obraz zdarzenia wystaje na wolną kratkę 1; pusty nudny obszar 1
- **181 Stajnia z wozownią**: niewidzialna blokada (zdarzenie/kafel) 1
- **183 Dom 2 (kamienica mieszczan)**: niewidzialna blokada (zdarzenie/kafel) 1; pusty dywan 1
- **213 Kopalnia pod Orlą Granią**: twardy czarny prostokąt cienia (warstwa 4) 2; twardy czarny prostokąt cienia 1; kanciasta plama gruntu 1; dwa zdarzenia na jednej kratce 1; gwiazdka nad wolną kratką 1

## Najgorsze miejsca (waga 3)

| mapa | kratki | kategoria | opis | obrazek |
|---|---|---|---|---|
| 1 | 27,9 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 439 (C 15,6) - góra bez dołu (brak kafla 447 pod) w (27,9) | [1/06](1/06.png) |
| 3 | 27,49 (1x1) | ucięty obiekt | Czarny kwadracik w ścianie skały (dziura 1 kratka) bez sensu | [3/20](3/20.png) |
| 3 | 39,49 (2x4) | resztka / samotny płot | Przy pionowym płocie (x=42) na południu stoją same słupki bez poprzeczek (3 kratki) - resztka płotu na ścieżce | [3/22](3/22.png) |
| 3 | 77,85 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 732 (D 12,11) - góra bez dołu (brak kafla 740 pod) w (77,85) | [3/25](3/25.png) |
| 4 | 0,6 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,6) (+1 podobnych w pobliżu) | [4/01](4/01.png) |
| 4 | 0,15 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,15) (+1 podobnych w pobliżu) | [4/05](4/05.png) |
| 4 | 0,24 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,24) (+1 podobnych w pobliżu) | [4/08](4/08.png) |
| 4 | 0,35 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,35) (+1 podobnych w pobliżu) | [4/09](4/09.png) |
| 4 | 0,47 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,47) (+1 podobnych w pobliżu) | [4/11](4/11.png) |
| 4 | 0,56 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,56) (+1 podobnych w pobliżu) | [4/15](4/15.png) |
| 4 | 0,67 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,67) (+1 podobnych w pobliżu) | [4/18](4/18.png) |
| 4 | 0,80 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,80) (+1 podobnych w pobliżu) | [4/21](4/21.png) |
| 4 | 0,93 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,93) (+1 podobnych w pobliżu) | [4/24](4/24.png) |
| 4 | 0,102 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,102) (+1 podobnych w pobliżu) | [4/26](4/26.png) |
| 4 | 0,113 (2x4) | ucięty obiekt | Kamienny mur z basztami przy zachodniej krawędzi urywa się płaskim końcem w y~116, a dalej na południu jest sama trawa (a na północy mur biegnie do krawędzi) | [4/29](4/29.png) |
| 8 | 13,4 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 173 (B 13,5) - góra bez dołu (brak kafla 181 pod) w (13,4) | [8/03](8/03.png) |
| 8 | 15,6 (1x3) | luka w płocie | luka 1 kratki w płocie (15,5)-(15,7) | [8/05](8/05.png) |
| 8 | 22,10 (1x3) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 3 szt. - twardy prostokąt | [8/07](8/07.png) |
| 8 | 51,13 (1x1) | obraz zachodzi na mur/dach/płot | '!Tavern_Props2' (zdarzenie 28 w 52,14) zachodzi na ścianę (3 kratek, 1969 px) (+6 podobnych w pobliżu) | [8/29](8/29.png) |
| 8 | 4,23 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 203 w 3,26) zachodzi na dach (3 kratek, 1686 px) | [8/18](8/18.png) |
| 8 | 12,23 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 417 w 13,26) zachodzi na dach (3 kratek, 2104 px) | [8/22](8/22.png) |
| 8 | 85,26 (12x1) | płot / obiekt narysowany na dachu | Poziomy drewniany płot narysowany wzdłuż kalenicy strzechy domu - płot leży na dachu (wygląda jak pas pszenicy na dachu), obok komin z dymem | [8/43](8/43.png) |
| 8 | 108,27 (9x6) | luka w płocie | luka 1 kratki w płocie (110,27)-(112,27) (+7 podobnych w pobliżu) | [8/47](8/47.png) |
| 8 | 4,28 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 201 w 3,31) zachodzi na dach (3 kratek, 1686 px) | [8/35](8/35.png) |
| 8 | 12,28 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 202 w 13,31) zachodzi na dach (3 kratek, 2104 px) | [8/38](8/38.png) |
| 8 | 29,28 (1x3) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 3 szt. - twardy prostokąt | [8/40](8/40.png) |
| 8 | 33,33 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_green' (zdarzenie 123 w 34,38) zachodzi na ścianę (4 kratek, 4309 px) | [8/41](8/41.png) |
| 8 | 17,43 (5x5) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 4 szt. - twardy prostokąt (+1 podobnych w pobliżu) | [8/51](8/51.png) |
| 8 | 107,45 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 404 (C 12,2) - góra bez dołu (brak kafla 412 pod) w (107,45) (+1 podobnych w pobliżu) | [8/63](8/63.png) |
| 8 | 89,47 (13x3) | twardy czarny prostokąt cienia | Pod frontami dwóch domów (czarny dach i szary kamienny z szyldem) leży ciemny prostokątny pas cienia o ostrych brzegach, szeroki jak cały dom, na bruku | [8/61](8/61.png) |
| 8 | 12,55 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 425 (C 9,5) - dół bez góry (brak kafla 417 nad) w (12,55) (+1 podobnych w pobliżu) | [8/69](8/69.png) |
| 8 | 6,59 (1x1) | obraz zachodzi na mur/dach/płot | '!$Smith' (zdarzenie 142 w 7,62) zachodzi na dach (12 kratek, 24837 px) | [8/68](8/68.png) |
| 8 | 98,59 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 573 (D 5,7) - dół bez góry (brak kafla 565 nad) w (98,59) | [8/75](8/75.png) |
| 8 | 75,62 (3x1) | luka w płocie | Ogrodzony ogródek warzywny: dolny płot ma 3-kratkową przerwę pośrodku bez bramy i słupków | [8/86](8/86.png) |
| 8 | 56,65 (10x4) | kanciasta plama gruntu | Prostokątny ciemnoszary plac (10x4) pod beczkami i wozem wcięty w trawnik - kanciasty | [8/85](8/85.png) |
| 8 | 3,66 (22x9) | luka w płocie / niedomknięty płot | Duży ogród warzywny: dolny płot to cztery odcinki z 2-kratkowymi dziurami bez bramek i słupków; wygląda jak dziurawy płot | [8/77](8/77.png) |
| 8 | 3,66 (22x1) | uprawa tuż pod murem/płotem | Pierwszy rząd grządek leży tuż pod górnym płotem ogrodu (bez odstępu na przejście) | [8/78](8/78.png) |
| 8 | 76,66 (17x9) | luka w płocie / niedomknięty płot | Drugi ogród (grządki marchwi i kapusty): dolny płot z dwiema dziurami po 2 kratki, grządki dotykają górnego płotu | [8/87](8/87.png) |
| 8 | 111,71 (1x3) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 3 szt. - twardy prostokąt | [8/90](8/90.png) |
| 8 | 56,79 (9x2) | płot / obiekt narysowany na dachu | Płot narysowany tuż za domem leży NA dachu: pas płotu przecina połać dachu, szczyt dachu wchodzi w płot (płot rysuje się nad dachem) | [8/96](8/96.png) |
| 8 | 75,79 (3x1) | luka w płocie | luka 1 kratki w płocie (74,79)-(76,79) | [8/98](8/98.png) |
| 8 | 106,79 (7x2) | płot / obiekt narysowany na dachu | Płot narysowany tuż za domem leży NA dachu: pas płotu przecina połać dachu, szczyt dachu wchodzi w płot (płot rysuje się nad dachem) | [8/102](8/102.png) |
| 8 | 34,81 (1x6) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 6 szt. - twardy prostokąt | [8/94](8/94.png) |
| 8 | 95,83 (1x1) | obraz zachodzi na mur/dach/płot | '!$Wiatrak_Czapa' (zdarzenie 443 w 97,83) zachodzi na ścianę (5 kratek, 8342 px) (+1 podobnych w pobliżu) | [8/101](8/101.png) |
| 8 | 22,84 (1x4) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 4 szt. - twardy prostokąt | [8/106](8/106.png) |
| 8 | 37,85 (3x1) | luka w płocie | luka 1 kratki w płocie (36,85)-(38,85) | [8/109](8/109.png) |
| 8 | 80,85 (2x1) | brama bez słupków | Płot pola warzywnego ma 2-kratkową furtkę w dolnym boku bez słupków (gołe końce płotu po obu stronach) | [8/115](8/115.png) |
| 8 | 56,93 (3x1) | luka w płocie | luka 1 kratki w płocie (55,93)-(57,93) (+16 podobnych w pobliżu) | [8/111](8/111.png) |
| 8 | 77,104 (3x1) | ucięty obiekt | obiekt rozcięty: kafel 477 (C 13,11) - dół bez góry (brak kafla 469 nad) w (77,104) (+2 podobnych w pobliżu) | [8/123](8/123.png) |
| 8 | 89,104 (3x1) | ucięty obiekt | obiekt rozcięty: kafel 477 (C 13,11) - dół bez góry (brak kafla 469 nad) w (89,104) (+2 podobnych w pobliżu) | [8/125](8/125.png) |
| 8 | 0,108 (105x6) | długi prosty odcinek | Południowy mur miejski, płot u jego stóp i pas ciemnego żywopłotu biegną idealnie prosto przez ~100 kratek (baszty co stały odstęp) | [8/127](8/127.png) |
| 8 | 118,114 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 173 (B 13,5) - góra bez dołu (brak kafla 181 pod) w (118,114) (+1 podobnych w pobliżu) | [8/128](8/128.png) |
| 13 | 98,60 (12x11) | kanciasta plama gruntu | Prostokątny zielony plateau 12x11 z ostrymi prostymi krawędziami i cienką ciemną obwódką, wklejony w żółto-brązowy brzeg; u dołu kamienny mur i jaskinia - wygląda jak wycięty prostokąt | [13/37](13/37.png) |
| 13 | 95,93 (13x9) | kanciasta plama gruntu | Czwarty prostokątny plateau (13x9, mur + schodki) tuż przy wybrzeżu, równy jak wycięty | [13/52](13/52.png) |
| 13 | 14,96 (14x8) | kanciasta plama gruntu | Drugi prostokątny zielony plateau z kamiennym murem i schodkami u dołu: ostre proste krawędzie z góry, lewej i prawej, obwódka jak rama | [13/58](13/58.png) |
| 13 | 32,96 (14x9) | kanciasta plama gruntu | Trzeci prostokątny plateau (14x9) z równym murem z przodu i prostymi bokami - kanciasta bryła na miękkiej łące | [13/60](13/60.png) |
| 20 | 38,43 (6x5) | luka w płocie / niedomknięty płot | Kojce przy chacie (lewy i dwa prawe) to fragmenty płotu: narożniki bez boku od strony chaty, z kawałkami słupków - wyglądają na niedokończone | [20/05](20/05.png) |
| 20 | 51,43 (1x1) | obraz zachodzi na mur/dach/płot | '!Tavern_Yard' (zdarzenie 11 w 52,44) zachodzi na płot (3 kratek, 2908 px) | [20/08](20/08.png) |
| 20 | 51,44 (4x4) | luka w płocie | luka 1 kratki w płocie (51,46)-(53,46) (+2 podobnych w pobliżu) | [20/07](20/07.png) |
| 24 | 98,56 (3x24) | resztka / samotny płot | Cienka pionowa kamienna listwa (ok. 1/3 kratki szerokości) biegnie przez łąkę od y~56 do y~80, z przerwami i jednym blokiem muru - niczego nie ogradza; wygląda jak zbłąkana krawędź skarpy | [24/09](24/09.png) |
| 24 | 55,77 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 224 (B 8,12) - dół bez góry (brak kafla 216 nad) w (55,77) | [24/26](24/26.png) |
| 24 | 16,105 (20x8) | pusty nudny obszar | Zachodnia łąka poniżej dworu: gładka trawa i kilka kwiatków, brak obiektów | [24/31](24/31.png) |
| 24 | 91,115 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 141 (B 13,1) - dół bez góry (brak kafla 133 nad) w (91,115) | [24/36](24/36.png) |
| 24 | 108,115 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 141 (B 13,1) - dół bez góry (brak kafla 133 nad) w (108,115) | [24/37](24/37.png) |
| 24 | 15,118 (5x1) | obraz zachodzi na mur/dach/płot | Kawałek drewnianego płotu (5 kratek) narysowany na licu południowego muru dworu - płot wisi na ścianie muru | [24/33](24/33.png) |
| 102 | 6,8 (3x3) | pusty dywan | Przed drzwiami piekarni leży beżowy prostokąt bez wzoru (płaska plama) | [102/01](102/01.png) |
| 111 | 40,5 (8x8) | resztka / samotny płot | Wolnostojący prostokąt płotu (8x~8) na łące przy brzegu: nic w środku, lewy pas pod płotem to ziemia brzegowa, reszta trawa (dwa tony gruntu), płot otwarty z dołu | [111/02](111/02.png) |
| 111 | 27,28 (26x3) | drzewo/krzak/skała na murze, dachu lub płocie | Rząd wielkich liściastych drzew i świerków stoi dokładnie na linii płotu (y~29), co ~4 kratki - pnie i korony zasłaniają płot, płot wchodzi pod drzewa | [111/12](111/12.png) |
| 111 | 103,29 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 166 w 103,34) zachodzi na płot (3 kratek, 4385 px) | [111/18](111/18.png) |
| 111 | 70,30 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 144 w 71,34) zachodzi na płot (3 kratek, 3117 px) | [111/14](111/14.png) |
| 111 | 78,30 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 149 w 79,34) zachodzi na płot (3 kratek, 3117 px) | [111/15](111/15.png) |
| 111 | 95,30 (3x1) | luka w płocie | luka 1 kratki w płocie (94,30)-(96,30) | [111/16](111/16.png) |
| 111 | 57,33 (8x1) | drzewo/krzak/skała na murze, dachu lub płocie | Dwa równoległe płoty (y 31 i 38) i duże drzewa stojące między nimi tak, że pnie i korony zachodzą na dolny płot; płoty biegną bez sensu przez trawę, wyglądają jak wolnostojące linie | [111/13](111/13.png) |
| 111 | 31,36 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_green' (zdarzenie 471 w 32,38) zachodzi na płot (3 kratek, 4549 px) | [111/23](111/23.png) |
| 111 | 75,36 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 472 w 76,38) zachodzi na płot (3 kratek, 4304 px) | [111/34](111/34.png) |
| 111 | 91,36 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_green' (zdarzenie 475 w 92,38) zachodzi na płot (3 kratek, 4549 px) | [111/37](111/37.png) |
| 111 | 41,37 (3x2) | drzewo/krzak/skała na murze, dachu lub płocie | Duże krzaki leżą na linii dolnego płotu podwórka (płot za krzakiem) | [111/27](111/27.png) |
| 111 | 77,41 (14x4) | luka w płocie / niedomknięty płot | Trzy kojce z płotu mają otwarte dolne boki z przerwami po 2 kratki bez słupków bramy - wyglądają na niedokończone | [111/36](111/36.png) |
| 111 | 52,54 (11x12) | kanciasta plama gruntu | Szara bruko-plama (11x12) z postrzępionym, schodkowym brzegiem po prawej i prostym po lewej, pomiędzy trawą a płotem | [111/55](111/55.png) |
| 111 | 40,58 (1x3) | luka w płocie | luka 1 kratki w płocie (40,57)-(40,59) | [111/53](111/53.png) |
| 111 | 48,59 (1x1) | resztka / samotny płot | resztka płotu (1 kratki) niezwiązana z linią ani murem | [111/54](111/54.png) |
| 111 | 78,65 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 491 (C 11,13) - dół bez góry (brak kafla 483 nad) w (78,65) | [111/75](111/75.png) |
| 111 | 51,69 (11x8) | kanciasta plama gruntu | Szary bruk placu z postrzępionym prawym brzegiem pośród trawy; martwe drzewo stoi na samym bruku | [111/72](111/72.png) |
| 111 | 26,78 (14x2) | uprawa tuż pod murem/płotem | Pod chatami grządki leżą w pierwszym rzędzie pod frontową ścianą (jeden rząd odstępu na ścieżkę ledwo widać) | [111/83](111/83.png) |
| 111 | 76,83 (3x1) | luka w płocie | luka 1 kratki w płocie (75,83)-(77,83) (+48 podobnych w pobliżu) | [111/86](111/86.png) |
| 111 | 51,87 (6x6) | drzewo/krzak/skała na murze, dachu lub płocie | Drzewo liściaste i krzak stoją na linii płotu zagrody (pień zasłania słupki) | [111/99](111/99.png) |
| 111 | 71,91 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 462 w 72,95) zachodzi na płot (4 kratek, 6802 px) | [111/104](111/104.png) |
| 120 | 2,8 (36x22) | twardy czarny prostokąt cienia | Przy każdym domu (okolice 10,14 / 31,12 / 32,22 / 10,23) leży ciemny prostokąt o ostrych brzegach obok ściany - to kratki cienia warstwy 4 (twardy prostokąt), nie cień słońca | [120/01](120/01.png) |
| 120 | 5,29 (30x3) | drzewo/krzak/skała na murze, dachu lub płocie | Pas sosen stoi tuż przy południowej palisadzie i na niej: pnie zasłaniają deski, korony zachodzą na linię palisady (np. 6-12,29; 30,29-31) | [120/03](120/03.png) |
| 120 | 60,40 (9x14) | ucięty obiekt | Pozostałość muru ze schodkowymi, rwanymi krawędziami (kamienne bloki bez spójnych narożników) tworzy poszarpany labirynt na trawie - wygląda jak źle ucięty tilesetowy klif | [120/07](120/07.png) |
| 125 | 20,14 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 301 (C 5,5) - góra bez dołu (brak kafla 309 pod) w (20,14) | [125/11](125/11.png) |
| 125 | 28,15 (2x2) | ucięty obiekt | obiekt rozcięty: kafel 349 (C 5,11) - dół bez góry (brak kafla 341 nad) w (28,15) (+1 podobnych w pobliżu) | [125/14](125/14.png) |
| 125 | 38,16 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 368 (C 0,14) - góra bez dołu (brak kafla 376 pod) w (38,16) | [125/18](125/18.png) |
| 125 | 61,16 (26x2) | płot / obiekt narysowany na dachu | Poziomy płot narysowany dokładnie na kalenicy dachów trzech domów - szczyt dachu wchodzi w płot | [125/24](125/24.png) |
| 125 | 39,17 (1x1) | resztka / samotny płot | resztka płotu (1 kratki) niezwiązana z linią ani murem | [125/19](125/19.png) |
| 125 | 28,21 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 437 (C 13,6) - dół bez góry (brak kafla 429 nad) w (28,21) | [125/15](125/15.png) |
| 125 | 39,21 (1x1) | resztka / samotny płot | resztka płotu (1 kratki) niezwiązana z linią ani murem | [125/20](125/20.png) |
| 125 | 104,29 (7x9) | kanciasta plama gruntu | Prostokątny podwyższony plateau (6x8) z kamiennym murkiem dookoła i ptasim gniazdem - kanciasty, wycięty linijką w trawie | [125/38](125/38.png) |
| 125 | 96,44 (7x9) | kanciasta plama gruntu | Drugi prostokątny plateau (7x8) z murem u dołu i skrzynką w środku; proste boki, ostre narożniki | [125/47](125/47.png) |
| 125 | 50,78 (70x20) | pusty nudny obszar | Południowa część mapy (x 50-120, y 78-95): sama płaska trawa z rzadkimi kępkami, jedna-dwie sosny, plamy szarego bruku; brak obiektów | [125/66](125/66.png) |
| 125 | 86,98 (12x10) | kanciasta plama gruntu | Wzgórze latarni: prostokątne tarasy z cienką obwódką i prostymi bokami (12x10), schodki w murze - sztywny prostokąt zamiast skarpy | [125/68](125/68.png) |
| 162 | 54,31 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 368 (C 0,14) - góra bez dołu (brak kafla 376 pod) w (54,31) | [162/05](162/05.png) |
| 162 | 53,60 (18x2) | drzewo/krzak/skała na murze, dachu lub płocie | Rząd sosen i liściastych stoi tuż przy południowej palisadzie garnizonu: korony zasłaniają ostrza palisady, kilka pni dotyka linii palisady | [162/27](162/27.png) |
| 162 | 96,82 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 169 w 97,86) zachodzi na płot (4 kratek, 6802 px) | [162/33](162/33.png) |
| 168 | 25,11 (24x4) | luka w płocie / niedomknięty płot | Pas krótkich odcinków płotu wzdłuż drogi (4-5 odcinków po 3 kratki z przerwami 2-3 kratek) - nie tworzy ogrodzenia, wygląda jak resztki | [168/01](168/01.png) |
| 168 | 2,13 (98x24) | kanciasta plama gruntu | Spalone pole to ogromny prostokąt ziemi (prawie 100x24) z prostą górną i dolną krawędzią (y=14 i y=36) i pozielenionymi „wyspami” - brzeg ostro prostokątny | [168/05](168/05.png) |
| 168 | 55,22 (8x4) | równo rozsiane drzewa/rzeczy | Osiem martwych drzew ustawionych w idealną siatkę 4x2 (równe odstępy) pośrodku spalonego pola - wygląda jak sztuczna kratownica | [168/06](168/06.png) |
| 175 | 76,0 (8x14) | kanciasta plama gruntu | Pionowy pas żółtego/zielonego gruntu o ostrych pionowych brzegach (8x14) pośrodku szarego kamienistego terenu - brzydki szew albo wklejka | [175/02](175/02.png) |
| 175 | 77,38 (8x10) | kanciasta plama gruntu | Pionowy pas żółtego gruntu z prostym lewym i prawym brzegiem (jak powyżej przy (76,0)) i postacią-posągiem obok | [175/10](175/10.png) |

## Pełna lista (wg map)


### Mapa 1 - TAWERNA

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 6,5 (5x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 166 '!$Fireplace_kitchen' blokuje 2 kratek, w których jego obraz jest pusty (np. 6,5) (+2 podobnych w pobliżu) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](1/01.png) |
| 02 | 7,5 (1x1) | zdarzenie na kaflu blokującym | zdarzenie 166 'Piec kuchenny' (!$Fireplace_kitchen/0/4/0) stoi na meblu z kafli 426 (7,5) | Przesunąć zdarzenie na wolną kratkę. | 1 | auto Z3 | ![](1/02.png) |
| 03 | 9,5 (1x1) | zdarzenie na kaflu blokującym | zdarzenie 168 'Piec kuchenny' (!$Fireplace_kitchen/0/6/0) stoi na meblu z kafli 426 (9,5) | Przesunąć zdarzenie na wolną kratkę. | 1 | auto Z3 | ![](1/03.png) |
| 04 | 11,5 (1x1) | zdarzenie na kaflu blokującym | zdarzenie 47 'Piec kuchenny' (!$Fireplace_kitchen/0/4/0) stoi na meblu z kafli 558/426 (11,5) | Przesunąć zdarzenie na wolną kratkę. | 1 | auto Z3 | ![](1/04.png) |
| 05 | 19,4 (7x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 263 '!$Fireplace_kitchen' blokuje 2 kratek, w których jego obraz jest pusty (np. 19,4) (+3 podobnych w pobliżu) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](1/05.png) |
| 06 | 27,9 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 439 (C 15,6) - góra bez dołu (brak kafla 447 pod) w (27,9) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](1/06.png) |
| 07 | 29,27 (1x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 1 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](1/07.png) |
| 08 | 1,38 (1x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 1 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](1/08.png) |
| 09 | 27,38 (1x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 1 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](1/09.png) |
| 10 | 33,43 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 129 '!$Fireplace1' blokuje 3 kratek, w których jego obraz jest pusty (np. 33,43) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](1/10.png) |
| 11 | 46,44 (12x8) | pusty dywan | W południowo-wschodniej sali leżą dwa ciemne puste prostokątne dywany (po ok. 2x6 kratek) bez mebli i wzoru - wyglądają jak dziury w podłodze | Dać wzór/frędzle jak inne dywany albo postawić stół | 1 | oko | ![](1/11.png) |

### Mapa 3 - Kruczy Jar

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 0,0 (2x3) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 5 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](3/01.png) |
| 02 | 1,0 (1x1) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 87 kratek) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](3/02.png) |
| 03 | 42,3 (2x2) | drzewo/krzak/skała na murze, dachu lub płocie | Sosna stoi na niskim fragmencie muru (resztka muru przy północnej ścianie); mur + drzewo zlane w jedną plamę, a sam kawałek muru wisi samotnie | Zdjąć sosnę z muru (przesunąć o 2-3 kratki) albo dokończyć mur do linii ściany | 2 | auto+oko ES-f,ES-j | ![](3/03.png) |
| 04 | 117,0 (3x3) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 7 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](3/04.png) |
| 05 | 75,14 (45x12) | pusty nudny obszar | Płaska łąka ok. 45x12 kratek: prawie same te same plamki trawy, kilka krzaków i jedna sosna | Dosadzić skupiska sosen/krzewów, strumyk albo ścieżkę; nie rozsypywać równo | 2 | oko | ![](3/05.png) |
| 06 | 100,20 (3x3) | kanciasta plama gruntu | Ciemnoszara pionowa plama (owal 2x3) pośrodku pustej łąki; wygląda jak przypalona/brudna plama, nic jej nie tłumaczy | Zamienić na trawę ciemną (27) z miękkim brzegiem albo postawić tam obiekt (głaz, ognisko) | 2 | oko | ![](3/06.png) |
| 07 | 7,28 (1x1) | ucięty/pojedynczy grunt | pasek jednej kratki (3) gruntu 27 na warstwie 0 otoczony gruntem 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](3/07.png) |
| 08 | 48,34 (1x1) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 20 kratek) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](3/08.png) |
| 09 | 68,34 (4x1) | brama bez słupków | Płot pola kończy się z obu stron przejścia gołymi końcami (4 kratki przerwy na ścieżce), bez słupków/bramy | Dostawić słupki bramy po obu stronach albo wstawić bramę z kafli/zdarzenia | 2 | auto+oko ES-f,ES-j | ![](3/09.png) |
| 10 | 8,47 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](3/10.png) |
| 11 | 25,37 (1x1) | drzewo z kafli bez gwiazdki | korona z 11 kafli bez gwiazdki, 11 kratek chodliwych pod nią (kafle [640, 641, 642, 644, 645, 646]) | Dodać gwiazdkę nad koroną. | 2 | auto ES-c | ![](3/11.png) |
| 12 | 25,36 (9x9) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 17 kratek) (+3 podobnych w pobliżu) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](3/12.png) |
| 13 | 35,41 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 8 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](3/13.png) |
| 14 | 42,46 (1x4) | brama bez słupków | Pionowy płot x=42 ma przerwę na ścieżce bez słupków bramy | Słupki bramy po obu stronach przerwy | 2 | oko | ![](3/14.png) |
| 15 | 53,39 (1x1) | ucięty/pojedynczy grunt | pasek jednej kratki (3) gruntu 17 na warstwie 0 otoczony gruntem 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](3/15.png) |
| 16 | 66,47 (2x2) | kanciasta plama gruntu | Mała ciemna owalna plama gruntu między sosnami i jabłoniami | Zmiękczyć/usunąć | 1 | oko | ![](3/16.png) |
| 17 | 77,42 (1x6) | resztka / samotny płot | Obok pionowego płotu zagrody (x=78) stoją dwa osobne słupki po jego lewej stronie (77,42) i (77,47) - resztki | Usunąć słupki albo domknąć nimi płot | 2 | oko | ![](3/17.png) |
| 18 | 104,36 (3x5) | kanciasta plama gruntu | Druga ciemnoszara pionowa plama na łące (jak przy 100,20), obca w trawie | Jak wyżej: usunąć albo ugruntować obiektem | 2 | oko | ![](3/18.png) |
| 19 | 107,47 (1x1) | kanciasta plama gruntu | Malutki ciemny owal na trawie | Usunąć | 1 | oko | ![](3/19.png) |
| 20 | 27,49 (1x1) | ucięty obiekt | Czarny kwadracik w ścianie skały (dziura 1 kratka) bez sensu | Zamknąć kaflem skały | 3 | auto+oko O1 | ![](3/20.png) |
| 21 | 27,53 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](3/21.png) |
| 22 | 39,49 (2x4) | resztka / samotny płot | Przy pionowym płocie (x=42) na południu stoją same słupki bez poprzeczek (3 kratki) - resztka płotu na ścieżce | Dokończyć płot do linii x=42 albo usunąć słupki | 3 | oko | ![](3/22.png) |
| 23 | 49,59 (4x1) | brama bez słupków | Południowy płot zagrody ma 4-kratkową przerwę na drodze (x 49-52) bez słupków bramy; końce płotu gołe | Słupki bramy po obu stronach | 2 | oko | ![](3/23.png) |
| 24 | 60,52 (60x28) | równo rozsiane drzewa/rzeczy | Południowa połowa łąki (x 60-120, y 52-80): pojedyncze sosny co kilkanaście kratek, bez skupisk i bez śladu ścieżki - nuda | Zgrupować sosny w kępy, zostawić polany, dodać ścieżkę do brzegu | 2 | auto+oko ES-b,ES-f,ES-j | ![](3/24.png) |
| 25 | 77,85 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 732 (D 12,11) - góra bez dołu (brak kafla 740 pod) w (77,85) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](3/25.png) |
| 26 | 0,100 (120x20) | morze wygląda jak mgła | Morze przy południowej krawędzi to płaska szaro-zielona toń (Czerwona Woda, bez fal) - na zdjęciu wygląda jak mgła; do potwierdzenia przez gracza, że tak ma być | Do sprawdzenia przez gracza, czy tak ma być (kafel wody A1 rodzaj 6 + Mood) | 1 | oko | ![](3/26.png) |

### Mapa 4 - Łąka pod Gawrą

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 0,6 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,6) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](4/01.png) |
| 02 | 1,7 (1x2) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 2 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](4/02.png) |
| 03 | 78,6 (2x3) | ucięty/pojedynczy grunt | pojedyncza kratka gruntu 27 na warstwie 0 otoczony gruntem 16 (+1 podobnych w pobliżu) | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](4/03.png) |
| 04 | 85,4 (1x1) | ucięty/pojedynczy grunt | pojedyncza kratka gruntu 17 na warstwie 0 otoczony gruntem 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](4/04.png) |
| 05 | 0,15 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,15) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](4/05.png) |
| 06 | 50,23 (3x2) | drzewo/krzak/skała na murze, dachu lub płocie | Obozowisko: sosna stoi tuż nad namiotem, korona dotyka jego szczytu (drzewo za namiotem, zachodzą na siebie) | Odsunąć sosnę o 2 kratki od namiotu | 1 | oko | ![](4/06.png) |
| 07 | 76,20 (1x1) | ucięty/pojedynczy grunt | pasek jednej kratki (2) gruntu 27 na warstwie 0 otoczony gruntem 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](4/07.png) |
| 08 | 0,24 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,24) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](4/08.png) |
| 09 | 0,35 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,35) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](4/09.png) |
| 10 | 1,25 (1x4) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 4 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](4/10.png) |
| 11 | 0,47 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,47) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](4/11.png) |
| 12 | 1,36 (1x5) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 5 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](4/12.png) |
| 13 | 21,42 (1x1) | ucięty/pojedynczy grunt | pojedyncza kratka gruntu 27 na warstwie 0 otoczony gruntem 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](4/13.png) |
| 14 | 50,40 (7x4) | brama bez słupków | Dwa kojce z płotu mają otwarty dolny bok (brama bez słupków po obu stronach przerwy); prawy ma jeszcze urwany kawałek płotu przy bramie | Dostawić słupki bramy po obu stronach przerwy | 1 | oko | ![](4/14.png) |
| 15 | 0,56 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,56) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](4/15.png) |
| 16 | 1,57 (1x4) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 4 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](4/16.png) |
| 17 | 17,49 (1x1) | ucięty/pojedynczy grunt | pojedyncza kratka gruntu 27 na warstwie 0 otoczony gruntem 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](4/17.png) |
| 18 | 0,67 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,67) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](4/18.png) |
| 19 | 1,68 (1x6) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 6 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](4/19.png) |
| 20 | 34,65 (14x10) | brama bez słupków | Ogrodzone pole: lewy płot ma dwie przerwy z pojedynczymi słupkami (bramy) - słupki sterczą, a drugi bok ma nierówne końce | Zostawić jedną bramę ze słupkami, drugą domknąć płotem | 2 | auto+oko GR1,PL1 | ![](4/20.png) |
| 21 | 0,80 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,80) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](4/21.png) |
| 22 | 1,81 (1x6) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 6 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](4/22.png) |
| 23 | 23,82 (8x11) | równo rozsiane drzewa/rzeczy | Głazy i krzaki ułożone w równe rzędy i kolumny (jak na szachownicy) pod ścieżką - wygląda na wzorek, nie na naturę | Rozrzucić nieregularnie, kępkami, różne odstępy | 2 | oko | ![](4/23.png) |
| 24 | 0,93 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,93) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](4/24.png) |
| 25 | 1,94 (1x2) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 2 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](4/25.png) |
| 26 | 0,102 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 181 (B 13,6) - góra bez dołu (brak kafla 189 pod) w (0,102) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](4/26.png) |
| 27 | 1,103 (1x5) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 5 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](4/27.png) |
| 28 | 25,100 (70x20) | pusty nudny obszar | Południe łąki: ta sama trawa, pojedyncze sosny, brak ścieżek, wody, kępek | Dosadzić zagajniki i polany, ścieżkę | 1 | oko | ![](4/28.png) |
| 29 | 0,113 (2x4) | ucięty obiekt | Kamienny mur z basztami przy zachodniej krawędzi urywa się płaskim końcem w y~116, a dalej na południu jest sama trawa (a na północy mur biegnie do krawędzi) | Dokończyć mur do krawędzi mapy albo zakończyć narożną basztą | 3 | auto+oko NI2,O1 | ![](4/29.png) |

### Mapa 8 - Kruczogród

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 0,7 (2x5) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 10 kratek - nic go nie pokazuje (+2 podobnych w pobliżu) | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/01.png) |
| 02 | 2,2 (11x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 11 kratek - nic go nie pokazuje (+1 podobnych w pobliżu) | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/02.png) |
| 03 | 13,4 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 173 (B 13,5) - góra bez dołu (brak kafla 181 pod) w (13,4) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](8/03.png) |
| 04 | 14,5 (1x1) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 1 szt. - twardy prostokąt | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 2 | auto CI2 | ![](8/04.png) |
| 05 | 15,6 (1x3) | luka w płocie | luka 1 kratki w płocie (15,5)-(15,7) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 3 | auto PL1 | ![](8/05.png) |
| 06 | 16,5 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 17 (4x3, wypełnienie 100%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](8/06.png) |
| 07 | 22,10 (1x3) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 3 szt. - twardy prostokąt | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 3 | auto CI2 | ![](8/07.png) |
| 08 | 25,5 (1x1) | brama bez słupków | brama '!$North_Gate_B' bez słupków/płotu po obu stronie | Dostawić słupki/płot po obu stronach bramy. | 2 | auto PL3 | ![](8/08.png) |
| 09 | 27,7 (1x5) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 5 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/09.png) |
| 10 | 29,6 (1x1) | drzewo z kafli bez gwiazdki | korona z 23 kafli bez gwiazdki, 23 kratek chodliwych pod nią (kafle [697]) | Dodać gwiazdkę nad koroną. | 2 | auto ES-c | ![](8/10.png) |
| 11 | 29,5 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 27 (9x9, wypełnienie 93%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](8/11.png) |
| 12 | 29,2 (9x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 9 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/12.png) |
| 13 | 65,2 (12x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 12 kratek - nic go nie pokazuje (+3 podobnych w pobliżu) | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/13.png) |
| 14 | 67,8 (1x5) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 150 '!Tavern_Yard' blokuje 1 kratek, w których jego obraz jest pusty (np. 67,8) (+1 podobnych w pobliżu) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](8/14.png) |
| 15 | 72,8 (1x5) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 156 '!Tavern_Yard' blokuje 1 kratek, w których jego obraz jest pusty (np. 72,8) (+1 podobnych w pobliżu) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](8/15.png) |
| 16 | 78,7 (1x6) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 6 kratek - nic go nie pokazuje (+3 podobnych w pobliżu) | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/16.png) |
| 17 | 118,7 (2x2) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 4 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/17.png) |
| 18 | 4,23 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 203 w 3,26) zachodzi na dach (3 kratek, 1686 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 3 | auto NA2 | ![](8/18.png) |
| 19 | 5,15 (1x1) | obraz zachodzi na mur/dach/płot | '!Statue' (zdarzenie 47 w 5,17) zachodzi na ścianę (2 kratek, 2859 px) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 2 | auto NA1 | ![](8/19.png) |
| 20 | 8,23 (1x1) | obraz zachodzi na mur/dach/płot | '!Statue' (zdarzenie 420 w 8,25) zachodzi na dach (2 kratek, 2859 px) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 2 | auto NA1 | ![](8/20.png) |
| 21 | 11,15 (1x1) | obraz zachodzi na mur/dach/płot | '!Statue' (zdarzenie 49 w 11,17) zachodzi na ścianę (2 kratek, 2859 px) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 2 | auto NA1 | ![](8/21.png) |
| 22 | 12,23 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 417 w 13,26) zachodzi na dach (3 kratek, 2104 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 3 | auto NA2 | ![](8/22.png) |
| 23 | 14,13 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 27 (4x3, wypełnienie 92%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](8/23.png) |
| 24 | 16,23 (7x1) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) (+1 podobnych w pobliżu) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](8/24.png) |
| 25 | 27,19 (1x9) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 9 kratek - nic go nie pokazuje (+2 podobnych w pobliżu) | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/25.png) |
| 26 | 29,15 (4x3) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 2 szt. - twardy prostokąt (+1 podobnych w pobliżu) | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 2 | auto CI2 | ![](8/26.png) |
| 27 | 42,14 (3x2) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 6 kratek - nic go nie pokazuje (+4 podobnych w pobliżu) | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/27.png) |
| 28 | 51,16 (1x1) | brama bez słupków | brama '!$Gate_Wood1' bez słupków/płotu po obu stronie | Dostawić słupki/płot po obu stronach bramy. | 2 | auto PL3 | ![](8/28.png) |
| 29 | 51,13 (1x1) | obraz zachodzi na mur/dach/płot | '!Tavern_Props2' (zdarzenie 28 w 52,14) zachodzi na ścianę (3 kratek, 1969 px) (+6 podobnych w pobliżu) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 3 | auto NA1 | ![](8/29.png) |
| 30 | 65,16 (1x1) | rama innego gruntu pod płotem/murem | pod płotem/murem grunt 16, wokół {40: 72, 33: 55} | Ujednolicić grunt pod płotem/murem. | 2 | auto ES-h | ![](8/30.png) |
| 31 | 65,16 (4x1) | resztka / samotny płot | krótki samotny płot (4 kratek w linii) | Usunąć resztkę albo dokończyć ją do pełnego ogrodzenia. | 2 | auto PL2 | ![](8/31.png) |
| 32 | 72,16 (1x1) | rama innego gruntu pod płotem/murem | pod płotem/murem grunt 16, wokół {40: 80, 33: 73} | Ujednolicić grunt pod płotem/murem. | 2 | auto ES-h | ![](8/32.png) |
| 33 | 72,16 (5x1) | resztka / samotny płot | krótki samotny płot (5 kratek w linii) | Usunąć resztkę albo dokończyć ją do pełnego ogrodzenia. | 2 | auto PL2 | ![](8/33.png) |
| 34 | 83,15 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 6 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](8/34.png) |
| 35 | 4,28 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 201 w 3,31) zachodzi na dach (3 kratek, 1686 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 3 | auto NA2 | ![](8/35.png) |
| 36 | 7,32 (3x1) | obraz zdarzenia wystaje na wolną kratkę | obraz zdarzenia 422 'Brama cmentarza (otwarta)' (!$SF_Gate3/0/6/2) zajmuje 57% dołu wolnej kratki (7,32) (+1 podobnych w pobliżu) | Zmienić <Occupy:...> tak, by obejmował obraz, albo przesunąć zdarzenie. | 2 | auto G3 | ![](8/36.png) |
| 37 | 8,32 (1x1) | brama bez słupków | brama '!$SF_Gate3' bez słupków/płotu po obu stronie | Dostawić słupki/płot po obu stronach bramy. | 2 | auto PL3 | ![](8/37.png) |
| 38 | 12,28 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 202 w 13,31) zachodzi na dach (3 kratek, 2104 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 3 | auto NA2 | ![](8/38.png) |
| 39 | 27,34 (1x1) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 56 kratek) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](8/39.png) |
| 40 | 29,28 (1x3) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 3 szt. - twardy prostokąt | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 3 | auto CI2 | ![](8/40.png) |
| 41 | 33,33 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_green' (zdarzenie 123 w 34,38) zachodzi na ścianę (4 kratek, 4309 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 3 | auto NA2 | ![](8/41.png) |
| 42 | 56,34 (1x1) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 1 szt. - twardy prostokąt | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 2 | auto CI2 | ![](8/42.png) |
| 43 | 85,26 (12x1) | płot / obiekt narysowany na dachu | Poziomy drewniany płot narysowany wzdłuż kalenicy strzechy domu - płot leży na dachu (wygląda jak pas pszenicy na dachu), obok komin z dymem | Usunąć kafle płotu z kalenicy; ogrodzenie postawić na ziemi za domem | 3 | auto+oko GR1,NA1,NA2,O1 | ![](8/43.png) |
| 44 | 85,30 (2x2) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 2 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/44.png) |
| 45 | 91,31 (4x2) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 1 szt. - twardy prostokąt (+1 podobnych w pobliżu) | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 2 | auto CI2 | ![](8/45.png) |
| 46 | 93,30 (1x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 1 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/46.png) |
| 47 | 108,27 (9x6) | luka w płocie | luka 1 kratki w płocie (110,27)-(112,27) (+7 podobnych w pobliżu) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 3 | auto PL1 | ![](8/47.png) |
| 48 | 118,25 (2x4) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 8 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/48.png) |
| 49 | 0,36 (2x7) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 14 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/49.png) |
| 50 | 10,39 (3x1) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](8/50.png) |
| 51 | 17,43 (5x5) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 4 szt. - twardy prostokąt (+1 podobnych w pobliżu) | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 3 | auto CI2 | ![](8/51.png) |
| 52 | 18,45 (1x1) | obraz zachodzi na mur/dach/płot | '!Decoration' (zdarzenie 106 w 18,45) zachodzi na ścianę (1 kratek, 253 px) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 2 | auto NA1 | ![](8/52.png) |
| 53 | 19,47 (1x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 1 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/53.png) |
| 54 | 32,44 (8x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 1 kratek - nic go nie pokazuje (+3 podobnych w pobliżu) | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/54.png) |
| 55 | 39,37 (1x1) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 1 szt. - twardy prostokąt | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 2 | auto CI2 | ![](8/55.png) |
| 56 | 48,37 (1x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 1 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/56.png) |
| 57 | 55,37 (1x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 1 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/57.png) |
| 58 | 59,36 (1x1) | zębata / dziurawa linia wzgórza | urwany kawałek obrysu wzgórza: kafel A5 121 bez ciągu w kierunku E (6 takich kafli) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](8/58.png) |
| 59 | 64,44 (8x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 1 kratek - nic go nie pokazuje (+3 podobnych w pobliżu) | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/59.png) |
| 60 | 81,43 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 105 '!Decoration' blokuje 1 kratek, w których jego obraz jest pusty (np. 81,43) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](8/60.png) |
| 61 | 89,47 (13x3) | twardy czarny prostokąt cienia | Pod frontami dwóch domów (czarny dach i szary kamienny z szyldem) leży ciemny prostokątny pas cienia o ostrych brzegach, szeroki jak cały dom, na bruku | Wygasić cień-bryłę Cienie.js dla tych domów (<Cienie:off> / mniejsza wysokość) albo zmiękczyć krawędź | 3 | auto+oko CI2,NI1,NI2 | ![](8/61.png) |
| 62 | 92,37 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (dół) 5 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](8/62.png) |
| 63 | 107,45 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 404 (C 12,2) - góra bez dołu (brak kafla 412 pod) w (107,45) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](8/63.png) |
| 64 | 108,41 (2x3) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 4 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/64.png) |
| 65 | 118,47 (1x1) | zdarzenie na kaflu blokującym | zdarzenie 223 'Chorągiew Lorda Zaleskiego' (!Flags_banner/0/4/1) stoi na meblu z kafli 181 (118,47) | Przesunąć zdarzenie na wolną kratkę. | 1 | auto Z3 | ![](8/65.png) |
| 66 | 118,36 (2x5) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 10 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/66.png) |
| 67 | 119,47 (1x1) | zdarzenie na kaflu blokującym | zdarzenie 224 'Chorągiew Lorda Zaleskiego' (!Flags_banner/0/4/1) stoi na meblu z kafli 182 (119,47) | Przesunąć zdarzenie na wolną kratkę. | 1 | auto Z3 | ![](8/67.png) |
| 68 | 6,59 (1x1) | obraz zachodzi na mur/dach/płot | '!$Smith' (zdarzenie 142 w 7,62) zachodzi na dach (12 kratek, 24837 px) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 3 | auto NA1 | ![](8/68.png) |
| 69 | 12,55 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 425 (C 9,5) - dół bez góry (brak kafla 417 nad) w (12,55) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](8/69.png) |
| 70 | 27,53 (3x12) | kanciasta plama gruntu | Wąski prostokątny pas ciemnej trawy (3x12) wcięty w bruk między ulicą a rynkiem - prostokąt jak z linijki | Zamienić na szerszy trawnik z nierównym brzegiem albo na bruk, dodać drzewa/ławkę | 2 | auto+oko CI1,NI2 | ![](8/70.png) |
| 71 | 64,58 (8x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 1 kratek - nic go nie pokazuje (+3 podobnych w pobliżu) | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/71.png) |
| 72 | 75,56 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 17 (4x6, wypełnienie 100%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](8/72.png) |
| 73 | 82,59 (1x1) | zdarzenie na kaflu blokującym | zdarzenie 176 'Ozdoba' (!Roof_Windows/1/2/1) stoi na meblu z kafli 860 (82,59) | Przesunąć zdarzenie na wolną kratkę. | 1 | auto Z3 | ![](8/73.png) |
| 74 | 88,55 (8x2) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) (+1 podobnych w pobliżu) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](8/74.png) |
| 75 | 98,59 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 573 (D 5,7) - dół bez góry (brak kafla 565 nad) w (98,59) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](8/75.png) |
| 76 | 118,57 (2x4) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 8 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/76.png) |
| 77 | 3,66 (22x9) | luka w płocie / niedomknięty płot | Duży ogród warzywny: dolny płot to cztery odcinki z 2-kratkowymi dziurami bez bramek i słupków; wygląda jak dziurawy płot | Wypełnić dziury płotem, zostawić jedną bramkę ze słupkami | 3 | auto+oko CI2,ES-h,ES-j,NA1,NI2,PL1 | ![](8/77.png) |
| 78 | 3,66 (22x1) | uprawa tuż pod murem/płotem | Pierwszy rząd grządek leży tuż pod górnym płotem ogrodu (bez odstępu na przejście) | Odsunąć grządki o rząd od płotu | 3 | auto+oko CI2,ES-h,ES-j,NA1,NI2,PL1 | ![](8/78.png) |
| 79 | 9,61 (4x2) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 1 szt. - twardy prostokąt (+1 podobnych w pobliżu) | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 2 | auto CI2 | ![](8/79.png) |
| 80 | 11,60 (1x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 1 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/80.png) |
| 81 | 36,70 (2x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 2 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/81.png) |
| 82 | 37,71 (1x1) | obraz zachodzi na mur/dach/płot | '!Decoration' (zdarzenie 107 w 37,71) zachodzi na ścianę (1 kratek, 253 px) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 2 | auto NA1 | ![](8/82.png) |
| 83 | 38,66 (2x4) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 1 szt. - twardy prostokąt (+1 podobnych w pobliżu) | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 2 | auto CI2 | ![](8/83.png) |
| 84 | 43,69 (2x3) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 4 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/84.png) |
| 85 | 56,65 (10x4) | kanciasta plama gruntu | Prostokątny ciemnoszary plac (10x4) pod beczkami i wozem wcięty w trawnik - kanciasty | Zaokrąglić albo wyłożyć bruk w tym samym kolorze co ulica | 3 | auto+oko CI1,CI2,ES-j,G1,NI2,O1 | ![](8/85.png) |
| 86 | 75,62 (3x1) | luka w płocie | Ogrodzony ogródek warzywny: dolny płot ma 3-kratkową przerwę pośrodku bez bramy i słupków | Wstawić furtkę ze słupkami albo domknąć płot | 3 | auto+oko PL1 | ![](8/86.png) |
| 87 | 76,66 (17x9) | luka w płocie / niedomknięty płot | Drugi ogród (grządki marchwi i kapusty): dolny płot z dwiema dziurami po 2 kratki, grządki dotykają górnego płotu | Domknąć płot, jedna bramka ze słupkami, odstęp przy górnym płocie | 3 | auto+oko CI2,ES-j,NI2,PL1 | ![](8/87.png) |
| 88 | 82,61 (4x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 1 kratek - nic go nie pokazuje (+1 podobnych w pobliżu) | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/88.png) |
| 89 | 98,60 (1x1) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 1 szt. - twardy prostokąt | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 2 | auto CI2 | ![](8/89.png) |
| 90 | 111,71 (1x3) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 3 szt. - twardy prostokąt | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 3 | auto CI2 | ![](8/90.png) |
| 91 | 118,68 (2x6) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 12 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/91.png) |
| 92 | 5,82 (1x1) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 1 szt. - twardy prostokąt | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 2 | auto CI2 | ![](8/92.png) |
| 93 | 18,80 (3x1) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](8/93.png) |
| 94 | 34,81 (1x6) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 6 szt. - twardy prostokąt | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 3 | auto CI2 | ![](8/94.png) |
| 95 | 36,80 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 5 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](8/95.png) |
| 96 | 56,79 (9x2) | płot / obiekt narysowany na dachu | Płot narysowany tuż za domem leży NA dachu: pas płotu przecina połać dachu, szczyt dachu wchodzi w płot (płot rysuje się nad dachem) | Odsunąć płot o 2-3 kratki za dom albo przerwać go na szerokości dachu; sprawdzić, czy płot nie jest na warstwie nad dachem | 3 | auto+oko CI1,CI2 | ![](8/96.png) |
| 97 | 70,79 (5x1) | resztka / samotny płot | krótki samotny płot (5 kratek w linii) | Usunąć resztkę albo dokończyć ją do pełnego ogrodzenia. | 2 | auto PL2 | ![](8/97.png) |
| 98 | 75,79 (3x1) | luka w płocie | luka 1 kratki w płocie (74,79)-(76,79) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 3 | auto PL1 | ![](8/98.png) |
| 99 | 77,79 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 17 (7x6, wypełnienie 100%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](8/99.png) |
| 100 | 89,83 (2x3) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 4 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/100.png) |
| 101 | 95,83 (1x1) | obraz zachodzi na mur/dach/płot | '!$Wiatrak_Czapa' (zdarzenie 443 w 97,83) zachodzi na ścianę (5 kratek, 8342 px) (+1 podobnych w pobliżu) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 3 | auto NA1 | ![](8/101.png) |
| 102 | 106,79 (7x2) | płot / obiekt narysowany na dachu | Płot narysowany tuż za domem leży NA dachu: pas płotu przecina połać dachu, szczyt dachu wchodzi w płot (płot rysuje się nad dachem) | Odsunąć płot o 2-3 kratki za dom albo przerwać go na szerokości dachu; sprawdzić, czy płot nie jest na warstwie nad dachem | 3 | auto+oko CI2 | ![](8/102.png) |
| 103 | 118,81 (2x6) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 12 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/103.png) |
| 104 | 0,85 (2x14) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 28 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/104.png) |
| 105 | 8,86 (1x1) | obraz zachodzi na mur/dach/płot | '!Decoration' (zdarzenie 161 w 8,87) zachodzi na ścianę (1 kratek, 706 px) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 2 | auto NA1 | ![](8/105.png) |
| 106 | 22,84 (1x4) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 4 szt. - twardy prostokąt | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 3 | auto CI2 | ![](8/106.png) |
| 107 | 30,88 (3x1) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](8/107.png) |
| 108 | 31,84 (2x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 2 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/108.png) |
| 109 | 37,85 (3x1) | luka w płocie | luka 1 kratki w płocie (36,85)-(38,85) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 3 | auto PL1 | ![](8/109.png) |
| 110 | 51,94 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 17 (4x5, wypełnienie 100%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](8/110.png) |
| 111 | 56,93 (3x1) | luka w płocie | luka 1 kratki w płocie (55,93)-(57,93) (+16 podobnych w pobliżu) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 3 | auto PL1 | ![](8/111.png) |
| 112 | 58,94 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 17 (4x5, wypełnienie 100%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](8/112.png) |
| 113 | 59,85 (2x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 2 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/113.png) |
| 114 | 65,94 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 17 (4x5, wypełnienie 100%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](8/114.png) |
| 115 | 80,85 (2x1) | brama bez słupków | Płot pola warzywnego ma 2-kratkową furtkę w dolnym boku bez słupków (gołe końce płotu po obu stronach) | Dostawić słupki po obu stronach | 3 | auto+oko PL1 | ![](8/115.png) |
| 116 | 108,85 (2x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 2 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/116.png) |
| 117 | 118,94 (2x2) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 4 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/117.png) |
| 118 | 5,100 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 5 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](8/118.png) |
| 119 | 20,101 (2x3) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 4 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/119.png) |
| 120 | 45,104 (3x1) | obraz zdarzenia wystaje na wolną kratkę | obraz zdarzenia 126 'EV126' (!Town_Props/2/8/0) zajmuje 50% dołu wolnej kratki (45,104) (+1 podobnych w pobliżu) | Zmienić <Occupy:...> tak, by obejmował obraz, albo przesunąć zdarzenie. | 2 | auto G3 | ![](8/120.png) |
| 121 | 54,104 (1x1) | obraz zachodzi na mur/dach/płot | '!Decoration' (zdarzenie 61 w 54,105) zachodzi na ścianę (1 kratek, 554 px) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 2 | auto NA1 | ![](8/121.png) |
| 122 | 71,103 (3x1) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](8/122.png) |
| 123 | 77,104 (3x1) | ucięty obiekt | obiekt rozcięty: kafel 477 (C 13,11) - dół bez góry (brak kafla 469 nad) w (77,104) (+2 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](8/123.png) |
| 124 | 81,101 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 17 (6x3, wypełnienie 94%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](8/124.png) |
| 125 | 89,104 (3x1) | ucięty obiekt | obiekt rozcięty: kafel 477 (C 13,11) - dół bez góry (brak kafla 469 nad) w (89,104) (+2 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](8/125.png) |
| 126 | 118,103 (2x5) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 10 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](8/126.png) |
| 127 | 0,108 (105x6) | długi prosty odcinek | Południowy mur miejski, płot u jego stóp i pas ciemnego żywopłotu biegną idealnie prosto przez ~100 kratek (baszty co stały odstęp) | Zróżnicować: załamanie muru, nierówny odstęp baszt, przerwy w płocie z drzewami | 3 | auto+oko CI2,ES-f,G1,NI1,NI2,O1,PL1 | ![](8/127.png) |
| 128 | 118,114 (2x1) | ucięty obiekt | obiekt rozcięty: kafel 173 (B 13,5) - góra bez dołu (brak kafla 181 pod) w (118,114) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](8/128.png) |

### Mapa 13 - Góry i kamieniołom

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 1,24 (1x1) | drzewo za blisko wody | drzewo na gruncie brzegu (ziemia/kamień) 5.0 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](13/01.png) |
| 02 | 6,27 (1x1) | zdarzenie nad postacią nad wolną kratką | zdarzenie 6 'Brama Milczących' (!$Mt_Gate/0/4/0) 'nad postacią' stoi na wolnej kratce: bohater wejdzie pod nie (6,27) | Zmienić priorytet zdarzenia albo zablokować kratkę. | 1 | auto G5 | ![](13/02.png) |
| 03 | 8,33 (1x2) | resztka / samotny płot | Samotny słupek obok ścieżki przy pierwszym wejściu do kamieniołomu | Usunąć | 2 | auto+oko ES-j | ![](13/03.png) |
| 04 | 9,24 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 46 kratek, rodzaj 24 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/04.png) |
| 05 | 13,27 (1x1) | drzewo za blisko wody | drzewo na gruncie brzegu (ziemia/kamień) 5.8 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](13/05.png) |
| 06 | 16,33 (1x20) | resztka / samotny płot | Cienka pionowa linia (płot 1 px) biegnie przez las ok. 20 kratek bez początku i końca - samotny płot wolnostojący bez celu | Usunąć albo zamienić w prawdziwy płot z narożnikami | 2 | auto+oko ES-f,ES-j | ![](13/06.png) |
| 07 | 32,32 (1x1) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 35 kratek) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/07.png) |
| 08 | 32,31 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 7 kratek, rodzaj 24 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/08.png) |
| 09 | 37,33 (1x1) | zębata / dziurawa linia wzgórza | dziura 1 kratki w licu / obrysie wzgórza | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/09.png) |
| 10 | 37,27 (1x1) | drzewo za blisko wody | drzewo na gruncie brzegu (ziemia/kamień) 4.0 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](13/10.png) |
| 11 | 47,26 (1x1) | drzewo za blisko wody | drzewo na gruncie brzegu (ziemia/kamień) 6.3 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](13/11.png) |
| 12 | 51,31 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok S prosty na 26 kratek (naprzeciw 2), rodzaj 24 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](13/12.png) |
| 13 | 53,31 (1x1) | obraz zdarzenia wystaje na wolną kratkę | obraz zdarzenia 500 'Wejście do kopalni' (!$Kopalnia_Wejscie/0/2/0) zajmuje 37% dołu wolnej kratki (53,31) | Zmienić <Occupy:...> tak, by obejmował obraz, albo przesunąć zdarzenie. | 2 | auto G3 | ![](13/13.png) |
| 14 | 58,34 (1x1) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 14 kratek) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/14.png) |
| 15 | 65,25 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/15.png) |
| 16 | 87,29 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok W prosty na 6 kratek (naprzeciw 1), rodzaj 24 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](13/16.png) |
| 17 | 87,29 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 6 kratek, rodzaj 24 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/17.png) |
| 18 | 88,33 (3x3) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 21 kratek) (+1 podobnych w pobliżu) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/18.png) |
| 19 | 34,45 (1x1) | zębata / dziurawa linia wzgórza | skok dolnej linii lica o >= 2 kratek | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/19.png) |
| 20 | 36,41 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 13 '!Mt_Props' blokuje 1 kratek, w których jego obraz jest pusty (np. 36,41) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](13/20.png) |
| 21 | 52,46 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 14 '!Mt_Props' blokuje 1 kratek, w których jego obraz jest pusty (np. 52,46) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](13/21.png) |
| 22 | 64,38 (1x1) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 13 kratek) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/22.png) |
| 23 | 70,39 (1x5) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 5 kratek, rodzaj 27 (+1 podobnych w pobliżu) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/23.png) |
| 24 | 76,36 (1x1) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 18 kratek) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/24.png) |
| 25 | 84,46 (2x4) | zębata / dziurawa linia wzgórza | dziura 1 kratki w licu / obrysie wzgórza (+2 podobnych w pobliżu) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/25.png) |
| 26 | 98,47 (1x1) | drzewo za blisko wody | drzewo 2.2 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](13/26.png) |
| 27 | 21,55 (4x2) | zaokrąglony koniec lica przy schodach | prawe zakończenie lica (A5 114) tuż przy schodach (+3 podobnych w pobliżu) | Poprawić zakończenie lica. | 2 | auto ES-i | ![](13/27.png) |
| 28 | 30,55 (50x30) | kanciasta plama gruntu | Zachodnia łąka pełna ciemnoszarych kanciastych plam kamiennego gruntu (wstęgi, krzyżyki, prostokąty) o różnych tonach - wyglądają jak brudne plamy | Ujednolicić ton gruntu, zaokrąglić, ograniczyć liczbę | 2 | auto+oko ES-b,ES-f,ES-j | ![](13/28.png) |
| 29 | 32,58 (2x12) | kanciasta plama gruntu | Cienka pionowa wstęga ciemnoszarego gruntu (1-2 kratki szerokości, ~12 długości) pośrodku trawy, bez celu | Poszerzyć w prawdziwą ścieżkę/usypisko albo usunąć | 2 | auto+oko ES-b,ES-f,ES-j | ![](13/29.png) |
| 30 | 44,50 (1x1) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 17 kratek) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/30.png) |
| 31 | 83,58 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 8 kratek, rodzaj 24 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/31.png) |
| 32 | 97,49 (2x3) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 26 kratek) (+1 podobnych w pobliżu) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/32.png) |
| 33 | 8,65 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok N prosty na 8 kratek (naprzeciw 2), rodzaj 27 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](13/33.png) |
| 34 | 8,65 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 8 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/34.png) |
| 35 | 24,62 (1x1) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 20 kratek) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/35.png) |
| 36 | 77,64 (4x4) | kanciasta plama gruntu | Szare plamy gruntu w kształcie krzyża/T w trawie (kamienna kostka) - kanciaste | Zaokrąglić albo usunąć | 1 | oko | ![](13/36.png) |
| 37 | 98,60 (12x11) | kanciasta plama gruntu | Prostokątny zielony plateau 12x11 z ostrymi prostymi krawędziami i cienką ciemną obwódką, wklejony w żółto-brązowy brzeg; u dołu kamienny mur i jaskinia - wygląda jak wycięty prostokąt | Zaokrąglić brzegi plateau (miękkie przejście trawa-sucha trawa), mur zakończyć stopniowo | 3 | auto+oko ES-g,ES-j | ![](13/37.png) |
| 38 | 4,75 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 10 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/38.png) |
| 39 | 12,75 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok W prosty na 10 kratek (naprzeciw 4), rodzaj 27 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](13/39.png) |
| 40 | 21,78 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 9 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/40.png) |
| 41 | 89,81 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok W prosty na 6 kratek (naprzeciw 2), rodzaj 24 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](13/41.png) |
| 42 | 89,81 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 6 kratek, rodzaj 24 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/42.png) |
| 43 | 98,81 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 9 kratek, rodzaj 24 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/43.png) |
| 44 | 112,78 (1x1) | drzewo za blisko wody | drzewo 2.0 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](13/44.png) |
| 45 | 113,76 (1x1) | zębata / dziurawa linia wzgórza | dziura 1 kratki w licu / obrysie wzgórza | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/45.png) |
| 46 | 113,82 (1x1) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 30 kratek) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/46.png) |
| 47 | 34,87 (6x4) | kanciasta plama gruntu | Ciemnoszara plama w kształcie zaokrąglonego prostokąta (6x4) na trawie bez wytłumaczenia | Usunąć/zaokrąglić | 2 | auto+oko ES-j | ![](13/47.png) |
| 48 | 55,89 (1x3) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 35 kratek) (+1 podobnych w pobliżu) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/48.png) |
| 49 | 57,88 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok N prosty na 7 kratek (naprzeciw 3), rodzaj 27 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](13/49.png) |
| 50 | 64,90 (3x3) | zębata / dziurawa linia wzgórza | dziura 1 kratki w licu / obrysie wzgórza (+2 podobnych w pobliżu) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/50.png) |
| 51 | 74,92 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 9 kratek, rodzaj 24 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/51.png) |
| 52 | 95,93 (13x9) | kanciasta plama gruntu | Czwarty prostokątny plateau (13x9, mur + schodki) tuż przy wybrzeżu, równy jak wycięty | Jak wyżej | 3 | auto+oko ES-g,ES-i | ![](13/52.png) |
| 53 | 100,87 (3x3) | kanciasta plama gruntu | Ciemnoszara plama w kształcie krzyża na brązowym gruncie | Usunąć/zaokrąglić | 2 | oko | ![](13/53.png) |
| 54 | 108,84 (1x1) | drzewo za blisko wody | drzewo na gruncie brzegu (ziemia/kamień) 6.7 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](13/54.png) |
| 55 | 112,93 (2x4) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 12 kratek) (+1 podobnych w pobliżu) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/55.png) |
| 56 | 112,89 (1x1) | drzewo za blisko wody | drzewo 3.0 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](13/56.png) |
| 57 | 113,94 (1x1) | drzewo za blisko wody | drzewo 2.0 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](13/57.png) |
| 58 | 14,96 (14x8) | kanciasta plama gruntu | Drugi prostokątny zielony plateau z kamiennym murem i schodkami u dołu: ostre proste krawędzie z góry, lewej i prawej, obwódka jak rama | Jak przy (98,60): miękkie brzegi, mur schodkowy | 3 | auto+oko ES-i,ES-j | ![](13/58.png) |
| 59 | 19,107 (1x1) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 13 kratek) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/59.png) |
| 60 | 32,96 (14x9) | kanciasta plama gruntu | Trzeci prostokątny plateau (14x9) z równym murem z przodu i prostymi bokami - kanciasta bryła na miękkiej łące | Przerobić jak pozostałe: miękka linia brzegu, schodki, drzewa na krawędzi | 3 | oko | ![](13/60.png) |
| 61 | 76,107 (1x3) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 14 kratek) (+1 podobnych w pobliżu) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/61.png) |
| 62 | 3,113 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (dół) 6 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/62.png) |
| 63 | 26,112 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/63.png) |
| 64 | 40,117 (1x3) | resztka / samotny płot | Wąski jasny słupek/pas kamienia (1x3) przy dolnej krawędzi mapy, sam na trawie | Usunąć albo domknąć murem | 2 | oko | ![](13/64.png) |
| 65 | 53,110 (4x1) | zaokrąglony koniec lica przy schodach | prawe zakończenie lica (A5 114) tuż przy schodach (+1 podobnych w pobliżu) | Poprawić zakończenie lica. | 2 | auto ES-i | ![](13/65.png) |
| 66 | 96,109 (2x3) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 19 kratek) (+2 podobnych w pobliżu) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/66.png) |
| 67 | 107,112 (1x1) | zębata / dziurawa linia wzgórza | dziura 1 kratki w licu / obrysie wzgórza | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](13/67.png) |
| 68 | 107,111 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](13/68.png) |

### Mapa 20 - Dom dziadka - Podwórze

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 19,2 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 17 (6x3, wypełnienie 89%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](20/01.png) |
| 02 | 30,10 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](20/02.png) |
| 03 | 52,20 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](20/03.png) |
| 04 | 28,29 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](20/04.png) |
| 05 | 38,43 (6x5) | luka w płocie / niedomknięty płot | Kojce przy chacie (lewy i dwa prawe) to fragmenty płotu: narożniki bez boku od strony chaty, z kawałkami słupków - wyglądają na niedokończone | Domknąć kojce płotem z bramką lub usunąć fragmenty | 3 | auto+oko CI2,ES-b,ES-j,NA1,NI1,O1,PL1 | ![](20/05.png) |
| 06 | 50,43 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 17 (5x4, wypełnienie 100%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](20/06.png) |
| 07 | 51,44 (4x4) | luka w płocie | luka 1 kratki w płocie (51,46)-(53,46) (+2 podobnych w pobliżu) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 3 | auto PL1 | ![](20/07.png) |
| 08 | 51,43 (1x1) | obraz zachodzi na mur/dach/płot | '!Tavern_Yard' (zdarzenie 11 w 52,44) zachodzi na płot (3 kratek, 2908 px) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 3 | auto NA1 | ![](20/08.png) |
| 09 | 52,44 (1x1) | uprawa tuż pod murem/płotem | uprawa/roślina '!Tavern_Yard' (zdarzenie 11) w pierwszym rzędzie pod murem/dachem/płotem | Odsunąć grządkę o co najmniej 1-2 kratki od muru/płotu. | 2 | auto UP1 | ![](20/09.png) |
| 10 | 0,52 (30x30) | pusty nudny obszar | Południowo-zachodnia łąka mapy: gładka trawa z kilkoma kwiatkami, bez drzew, skał ani ścieżek | Dosadzić kępy drzew, skały, ścieżkę | 1 | auto+oko ES-b,ES-j | ![](20/10.png) |
| 11 | 45,53 (3x1) | brama bez słupków | Południowy płot działki dziadka kończy się gołymi końcami po obu stronach 3-kratkowego wyjścia ścieżki - brak słupków bramy | Postawić słupki/bramę po obu stronach | 2 | oko | ![](20/11.png) |
| 12 | 48,49 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 17 (5x4, wypełnienie 100%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](20/12.png) |
| 13 | 28,68 (16x3) | kanciasta plama gruntu | Dwa poziome pasy ziemi (16x2 i 6x2) o prostych górnych i dolnych brzegach pośrodku łąki - ścieżka urywa się w nicość | Przedłużyć w prawdziwą ścieżkę do czegoś albo usunąć/zaokrąglić | 2 | auto+oko ES-b,ES-j | ![](20/13.png) |

### Mapa 24 - Posiadłość Lorda

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 0,26 (100x3) | długi prosty odcinek | Północny brzeg: linia wybrzeża tworzy długie poziome odcinki (15-25 kratek) ze schodkami co kilka kratek - równo jak linijka | Zaokrąglić brzeg: łagodne zatoczki i cyple, różne długości | 1 | oko | ![](24/01.png) |
| 02 | 48,35 (20x5) | figura wygląda jak NPC / przedmiot | Długie równe rzędy szarych kwadracików z ciemnym grzbietem na górze (2 rzędy x 20) na północnym polu dworu - wyglądają jak rzędy nagrobków lub niedokończone grządki, nie jak uprawa | Zamienić na normalne grządki albo usunąć; nie rozmieszczać co kratkę | 2 | auto+oko ES-b | ![](24/02.png) |
| 03 | 80,35 (19x5) | figura wygląda jak NPC / przedmiot | Drugi taki sam zestaw dwóch rzędów szarych kwadracików (19x2) obok pierwszego | Jak wyżej | 2 | oko | ![](24/03.png) |
| 04 | 32,36 (12x8) | dwa grunty pod jednym obiektem | ogrodzony prostokąt 12x8 ma w środku dwa grunty: 16:58%, 27:41% | Ujednolicić grunt pod ogrodzeniem/podwórkiem. | 2 | auto GR1 | ![](24/04.png) |
| 05 | 37,43 (4x1) | luka w płocie | luka 2 kratki w płocie (36,43)-(39,43) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](24/05.png) |
| 06 | 98,43 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (dół) 8 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](24/06.png) |
| 07 | 104,43 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok S prosty na 8 kratek (naprzeciw 3), rodzaj 17 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](24/07.png) |
| 08 | 85,56 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 5 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](24/08.png) |
| 09 | 98,56 (3x24) | resztka / samotny płot | Cienka pionowa kamienna listwa (ok. 1/3 kratki szerokości) biegnie przez łąkę od y~56 do y~80, z przerwami i jednym blokiem muru - niczego nie ogradza; wygląda jak zbłąkana krawędź skarpy | Usunąć listwę (kafle skarpy w x~98) albo zamienić w pełną skarpę/mur z narożnikami | 3 | auto+oko ES-b,ES-f,NI2 | ![](24/09.png) |
| 10 | 20,64 (2x2) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 4 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](24/10.png) |
| 11 | 23,64 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (prawo) 6 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](24/11.png) |
| 12 | 25,70 (3x2) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](24/12.png) |
| 13 | 32,64 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Pine_B' (zdarzenie 54 w 31,64) zachodzi na ścianę (1 kratek, 344 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 2 | auto NA2 | ![](24/13.png) |
| 14 | 32,66 (1x1) | obraz zachodzi na mur/dach/płot | '!$Big_Decoration' (zdarzenie 76 w 31,69) zachodzi na ścianę (2 kratek, 1191 px) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 2 | auto NA1 | ![](24/14.png) |
| 15 | 34,67 (15x5) | obraz zachodzi na mur/dach/płot | '!$Big_Decoration' (zdarzenie 77 w 50,69) zachodzi na ścianę (1 kratek, 900 px) (+4 podobnych w pobliżu) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 2 | auto NA1 | ![](24/15.png) |
| 16 | 38,61 (5x1) | zdarzenie nad postacią nad wolną kratką | zdarzenie 68 'Dym z komina' (!Fantasy_chimney/0/2/0) 'nad postacią' stoi na wolnej kratce: bohater wejdzie pod nie (38,61) (+1 podobnych w pobliżu) | Zmienić priorytet zdarzenia albo zablokować kratkę. | 1 | auto G5 | ![](24/16.png) |
| 17 | 40,65 (1x2) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 2 kratek - nic go nie pokazuje (+4 podobnych w pobliżu) | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](24/17.png) |
| 18 | 94,71 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (prawo) 10 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](24/18.png) |
| 19 | 105,66 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 5 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](24/19.png) |
| 20 | 9,78 (1x1) | ucięty/pojedynczy grunt | pojedyncza kratka gruntu 24 na warstwie 0 otoczony gruntem 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](24/20.png) |
| 21 | 27,80 (16x7) | dziwny wzór / do oceny | Cztery ogrodzone prostokąty kwiatów w równym rzędzie - zbyt regularne ale spójne z dziedzińcem; płot z poprzeczkami ma białe poprzeczki ukośne | Do oceny, severity niska | 2 | auto+oko ES-b,ES-j,NA1 | ![](24/21.png) |
| 22 | 32,74 (3x1) | wysoki obiekt bez gwiazdki | górny kafel 270 (C 6,1) obiektu bez gwiazdki na wolnej kratce: bohater stanie na nim w (32,74) (+2 podobnych w pobliżu) | Dodać kafel z gwiazdką nad górną częścią obiektu. | 2 | auto G2 | ![](24/22.png) |
| 23 | 46,74 (3x1) | wysoki obiekt bez gwiazdki | górny kafel 270 (C 6,1) obiektu bez gwiazdki na wolnej kratce: bohater stanie na nim w (46,74) (+2 podobnych w pobliżu) | Dodać kafel z gwiazdką nad górną częścią obiektu. | 2 | auto G2 | ![](24/23.png) |
| 24 | 47,81 (1x1) | ucięty/pojedynczy grunt | pojedyncza kratka gruntu 27 na warstwie 0 otoczony gruntem 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](24/24.png) |
| 25 | 52,81 (3x2) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](24/25.png) |
| 26 | 55,77 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 224 (B 8,12) - dół bez góry (brak kafla 216 nad) w (55,77) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](24/26.png) |
| 27 | 59,78 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok W prosty na 6 kratek (naprzeciw 1), rodzaj 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](24/27.png) |
| 28 | 79,80 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](24/28.png) |
| 29 | 60,89 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 1) ucięta: bok N prosty na 11 kratek (naprzeciw 5), rodzaj 17 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](24/29.png) |
| 30 | 67,86 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 9 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](24/30.png) |
| 31 | 16,105 (20x8) | pusty nudny obszar | Zachodnia łąka poniżej dworu: gładka trawa i kilka kwiatków, brak obiektów | Dosadzić drzewa/skały/ścieżkę | 3 | auto+oko O1 | ![](24/31.png) |
| 32 | 55,100 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (dół) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](24/32.png) |
| 33 | 15,118 (5x1) | obraz zachodzi na mur/dach/płot | Kawałek drewnianego płotu (5 kratek) narysowany na licu południowego muru dworu - płot wisi na ścianie muru | Usunąć płot z lica muru (warstwa 1/2 w y=118, x 15-19) | 3 | auto+oko NI2,O1 | ![](24/33.png) |
| 34 | 29,119 (9x1) | obraz zachodzi na mur/dach/płot | Zielony pas krzaczków/żywopłotu narysowany na dolnej krawędzi lica muru (u dołu ekranu 25,105) - ucina się o mur | Usunąć albo odsunąć od muru o rząd | 2 | auto+oko NI2 | ![](24/34.png) |
| 35 | 65,118 (1x2) | ucięty obiekt | Pionowy cienki szew w licu muru (kafel z krawędzią) przy y=118 | Podmienić kafel na pełne lico | 2 | auto+oko NI2 | ![](24/35.png) |
| 36 | 91,115 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 141 (B 13,1) - dół bez góry (brak kafla 133 nad) w (91,115) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](24/36.png) |
| 37 | 108,115 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 141 (B 13,1) - dół bez góry (brak kafla 133 nad) w (108,115) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](24/37.png) |

### Mapa 102 - Piekarnia

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 6,8 (3x3) | pusty dywan | Przed drzwiami piekarni leży beżowy prostokąt bez wzoru (płaska plama) | Wzór/obwódka albo usunąć | 3 | auto+oko O1 | ![](102/01.png) |

### Mapa 111 - Podgrodzie

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 20,0 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok E prosty na 10 kratek (naprzeciw 1), rodzaj 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/01.png) |
| 02 | 40,5 (8x8) | resztka / samotny płot | Wolnostojący prostokąt płotu (8x~8) na łące przy brzegu: nic w środku, lewy pas pod płotem to ziemia brzegowa, reszta trawa (dwa tony gruntu), płot otwarty z dołu | Domknąć albo usunąć; wyrównać grunt pod ogrodzeniem | 3 | auto+oko GR1,PL1 | ![](111/02.png) |
| 03 | 61,10 (14x3) | figura wygląda jak NPC / przedmiot | Rzędy szarych kwadracików z ciemnym grzbietem (2 rzędy x 15, kolejne x 12) na północy mapy - wyglądają jak rzędy nagrobków, grządki bez ziemi, a w kilku jest zielony kiełek | Zamienić grafikę pól na ziemię z roślinami; nie szare płytki | 2 | oko | ![](111/03.png) |
| 04 | 82,10 (10x3) | figura wygląda jak NPC / przedmiot | Drugi zestaw rzędów szarych płytek (jak wyżej), puste | Jak wyżej | 2 | oko | ![](111/04.png) |
| 05 | 85,4 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 6 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/05.png) |
| 06 | 106,0 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok E prosty na 10 kratek (naprzeciw 2), rodzaj 17 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/06.png) |
| 07 | 118,7 (1x5) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 5 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](111/07.png) |
| 08 | 33,15 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 10 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/08.png) |
| 09 | 107,19 (4x4) | brama bez słupków | Drewniana brama (łuk) stoi przy palisadzie z jednej strony, z drugiej strony przejścia nic - brama bez słupków wisi na trawie obok ścieżki | Dostawić palisadę/słupki po lewej stronie bramy | 2 | auto+oko G5,PL2 | ![](111/09.png) |
| 10 | 118,19 (1x10) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 10 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](111/10.png) |
| 11 | 19,34 (1x5) | drzewo za blisko wody | drzewo 1.4 kratki od wody (+1 podobnych w pobliżu) | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](111/11.png) |
| 12 | 27,28 (26x3) | drzewo/krzak/skała na murze, dachu lub płocie | Rząd wielkich liściastych drzew i świerków stoi dokładnie na linii płotu (y~29), co ~4 kratki - pnie i korony zasłaniają płot, płot wchodzi pod drzewa | Przesunąć drzewa o 2 kratki od płotu albo przerwać płot w tych miejscach z bramką | 3 | auto+oko NA2 | ![](111/12.png) |
| 13 | 57,33 (8x1) | drzewo/krzak/skała na murze, dachu lub płocie | Dwa równoległe płoty (y 31 i 38) i duże drzewa stojące między nimi tak, że pnie i korony zachodzą na dolny płot; płoty biegną bez sensu przez trawę, wyglądają jak wolnostojące linie | Usunąć jeden z płotów albo zamknąć go w prostokąt; drzewa odsunąć od linii płotu | 3 | auto+oko NA2 | ![](111/13.png) |
| 14 | 70,30 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 144 w 71,34) zachodzi na płot (3 kratek, 3117 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 3 | auto NA2 | ![](111/14.png) |
| 15 | 78,30 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 149 w 79,34) zachodzi na płot (3 kratek, 3117 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 3 | auto NA2 | ![](111/15.png) |
| 16 | 95,30 (3x1) | luka w płocie | luka 1 kratki w płocie (94,30)-(96,30) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 3 | auto PL1 | ![](111/16.png) |
| 17 | 98,30 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 165 w 99,34) zachodzi na płot (2 kratek, 1197 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 2 | auto NA2 | ![](111/17.png) |
| 18 | 103,29 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 166 w 103,34) zachodzi na płot (3 kratek, 4385 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 3 | auto NA2 | ![](111/18.png) |
| 19 | 19,38 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 170 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 19,38) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](111/19.png) |
| 20 | 19,46 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 172 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 19,46) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](111/20.png) |
| 21 | 22,37 (4x4) | luka w płocie | luka 2 kratki w płocie (24,36)-(24,39) (+1 podobnych w pobliżu) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](111/21.png) |
| 22 | 31,37 (5x4) | luka w płocie | luka 2 kratki w płocie (31,36)-(31,39) (+4 podobnych w pobliżu) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](111/22.png) |
| 23 | 31,36 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_green' (zdarzenie 471 w 32,38) zachodzi na płot (3 kratek, 4549 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 3 | auto NA2 | ![](111/23.png) |
| 24 | 33,39 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (dół) 6 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/24.png) |
| 25 | 34,39 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok S prosty na 6 kratek (naprzeciw 1), rodzaj 27 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/25.png) |
| 26 | 39,43 (6x7) | luka w płocie | luka 2 kratki w płocie (44,42)-(44,45) (+1 podobnych w pobliżu) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](111/26.png) |
| 27 | 41,37 (3x2) | drzewo/krzak/skała na murze, dachu lub płocie | Duże krzaki leżą na linii dolnego płotu podwórka (płot za krzakiem) | Odsunąć krzak od płotu | 3 | auto+oko GR1,NA1,NA2 | ![](111/27.png) |
| 28 | 45,47 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (dół) 6 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/28.png) |
| 29 | 47,45 (1x1) | obraz zdarzenia wystaje na wolną kratkę | obraz zdarzenia 26 'Posłanie pod daszkiem' (!Town_Props/2/4/1) zajmuje 26% dołu wolnej kratki (47,45) | Zmienić <Occupy:...> tak, by obejmował obraz, albo przesunąć zdarzenie. | 2 | auto G3 | ![](111/29.png) |
| 30 | 50,47 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok S prosty na 6 kratek (naprzeciw 1), rodzaj 27 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/30.png) |
| 31 | 55,43 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/31.png) |
| 32 | 56,47 (1x1) | obraz zdarzenia wystaje na wolną kratkę | obraz zdarzenia 24 'Posłanie' (!Town_Props/2/4/1) zajmuje 26% dołu wolnej kratki (56,47) | Zmienić <Occupy:...> tak, by obejmował obraz, albo przesunąć zdarzenie. | 2 | auto G3 | ![](111/32.png) |
| 33 | 62,44 (1x1) | obraz zdarzenia wystaje na wolną kratkę | obraz zdarzenia 23 'Posłanie' (!Town_Props/2/4/1) zajmuje 26% dołu wolnej kratki (62,44) | Zmienić <Occupy:...> tak, by obejmował obraz, albo przesunąć zdarzenie. | 2 | auto G3 | ![](111/33.png) |
| 34 | 75,36 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 472 w 76,38) zachodzi na płot (3 kratek, 4304 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 3 | auto NA2 | ![](111/34.png) |
| 35 | 76,36 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (dół) 10 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/35.png) |
| 36 | 77,41 (14x4) | luka w płocie / niedomknięty płot | Trzy kojce z płotu mają otwarte dolne boki z przerwami po 2 kratki bez słupków bramy - wyglądają na niedokończone | Domknąć kojce bramkami ze słupkami | 3 | auto+oko PL1 | ![](111/36.png) |
| 37 | 91,36 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_green' (zdarzenie 475 w 92,38) zachodzi na płot (3 kratek, 4549 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 3 | auto NA2 | ![](111/37.png) |
| 38 | 94,47 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 313 '!Tavern_Yard' blokuje 1 kratek, w których jego obraz jest pusty (np. 94,47) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](111/38.png) |
| 39 | 95,45 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok S prosty na 7 kratek (naprzeciw 2), rodzaj 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/39.png) |
| 40 | 99,47 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 314 '!Tavern_Yard' blokuje 1 kratek, w których jego obraz jest pusty (np. 99,47) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](111/40.png) |
| 41 | 100,38 (12x6) | kanciasta plama gruntu | Ciemnoszary prostokątny plac z kamiennym obrzeżem 1 kratka (12x6) wcięty w trawę koło chaty; ostre proste krawędzie i kanciasty narożnik, dwa suche patyki w środku | Zaokrąglić brzeg, dać kamienie/kępy trawy | 2 | oko | ![](111/41.png) |
| 42 | 107,47 (1x1) | obraz zdarzenia wystaje na wolną kratkę | obraz zdarzenia 20 'Posłanie żebraka' (!Town_Props/2/4/1) zajmuje 26% dołu wolnej kratki (107,47) | Zmienić <Occupy:...> tak, by obejmował obraz, albo przesunąć zdarzenie. | 2 | auto G3 | ![](111/42.png) |
| 43 | 118,36 (1x7) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 7 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](111/43.png) |
| 44 | 21,59 (1x4) | luka w płocie | luka 2 kratki w płocie (21,58)-(21,61) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](111/44.png) |
| 45 | 23,48 (3x1) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](111/45.png) |
| 46 | 28,49 (4x1) | luka w płocie | luka 2 kratki w płocie (27,49)-(30,49) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](111/46.png) |
| 47 | 28,57 (7x12) | dwa grunty pod jednym obiektem | ogrodzony prostokąt 7x12 ma w środku dwa grunty: 16:42%, 27:42% | Ujednolicić grunt pod ogrodzeniem/podwórkiem. | 2 | auto GR1 | ![](111/47.png) |
| 48 | 29,54 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok N prosty na 7 kratek (naprzeciw 3), rodzaj 27 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/48.png) |
| 49 | 29,54 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 7 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/49.png) |
| 50 | 36,54 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok N prosty na 22 kratek (naprzeciw 9), rodzaj 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/50.png) |
| 51 | 38,57 (1x1) | rama innego gruntu pod płotem/murem | pod płotem/murem grunt 17, wokół {16: 61, 27: 17} | Ujednolicić grunt pod płotem/murem. | 2 | auto ES-h | ![](111/51.png) |
| 52 | 38,57 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/52.png) |
| 53 | 40,58 (1x3) | luka w płocie | luka 1 kratki w płocie (40,57)-(40,59) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 3 | auto PL1 | ![](111/53.png) |
| 54 | 48,59 (1x1) | resztka / samotny płot | resztka płotu (1 kratki) niezwiązana z linią ani murem | Usunąć resztkę albo dokończyć ją do pełnego ogrodzenia. | 3 | auto PL2 | ![](111/54.png) |
| 55 | 52,54 (11x12) | kanciasta plama gruntu | Szara bruko-plama (11x12) z postrzępionym, schodkowym brzegiem po prawej i prostym po lewej, pomiędzy trawą a płotem | Wygładzić brzeg lub ograniczyć do prostokąta z bordiurą | 3 | auto+oko GR1,PL1 | ![](111/55.png) |
| 56 | 93,56 (3x1) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](111/56.png) |
| 57 | 109,51 (11x5) | obraz zdarzenia wystaje na wolną kratkę | obraz zdarzenia 90 'Brama zachodnia: skrzydło i cień' (!$West_Gate/0/8/1) zajmuje 100% dołu wolnej kratki (119,51) (+8 podobnych w pobliżu) | Zmienić <Occupy:...> tak, by obejmował obraz, albo przesunąć zdarzenie. | 2 | auto G3 | ![](111/57.png) |
| 58 | 109,48 (9x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 9 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](111/58.png) |
| 59 | 109,53 (9x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 9 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](111/59.png) |
| 60 | 118,51 (1x1) | brama bez słupków | brama '!$West_Gate' bez słupków/płotu po obu stronie | Dostawić słupki/płot po obu stronach bramy. | 2 | auto PL3 | ![](111/60.png) |
| 61 | 118,59 (1x6) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 6 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](111/61.png) |
| 62 | 119,52 (1x1) | brama bez słupków | brama '!$West_Gate' bez słupków/płotu po obu stronie | Dostawić słupki/płot po obu stronach bramy. | 2 | auto PL3 | ![](111/62.png) |
| 63 | 19,63 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 178 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 19,63) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](111/63.png) |
| 64 | 19,71 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 183 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 19,71) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](111/64.png) |
| 65 | 21,62 (2x3) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 6 kratek, rodzaj 17 (+1 podobnych w pobliżu) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/65.png) |
| 66 | 26,68 (4x1) | luka w płocie | luka 2 kratki w płocie (25,68)-(28,68) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](111/66.png) |
| 67 | 27,60 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (prawo) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/67.png) |
| 68 | 29,62 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok S prosty na 32 kratek (naprzeciw 4), rodzaj 17 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/68.png) |
| 69 | 35,68 (4x1) | luka w płocie | luka 2 kratki w płocie (34,68)-(37,68) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](111/69.png) |
| 70 | 37,67 (3x1) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](111/70.png) |
| 71 | 40,63 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (dół) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/71.png) |
| 72 | 51,69 (11x8) | kanciasta plama gruntu | Szary bruk placu z postrzępionym prawym brzegiem pośród trawy; martwe drzewo stoi na samym bruku | Wygładzić brzeg; drzewo przesunąć na trawę | 3 | auto+oko CI1,ES-b,GR1,PL1 | ![](111/72.png) |
| 73 | 74,63 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 6 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/73.png) |
| 74 | 77,63 (1x1) | obraz zachodzi na mur/dach/płot | '!Town_Props' (zdarzenie 275 w 77,64) zachodzi na ścianę (1 kratek, 1011 px) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 2 | auto NA1 | ![](111/74.png) |
| 75 | 78,65 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 491 (C 11,13) - dół bez góry (brak kafla 483 nad) w (78,65) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](111/75.png) |
| 76 | 80,68 (2x1) | resztka / samotny płot | resztka płotu (2 kratki) niezwiązana z linią ani murem | Usunąć resztkę albo dokończyć ją do pełnego ogrodzenia. | 2 | auto PL2 | ![](111/76.png) |
| 77 | 82,63 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok S prosty na 29 kratek (naprzeciw 3), rodzaj 17 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/77.png) |
| 78 | 95,61 (4x2) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 6 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](111/78.png) |
| 79 | 98,68 (1x1) | rama innego gruntu pod płotem/murem | pod płotem/murem grunt 27, wokół {16: 97, 17: 54} | Ujednolicić grunt pod płotem/murem. | 2 | auto ES-h | ![](111/79.png) |
| 80 | 98,63 (9x5) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) (+1 podobnych w pobliżu) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](111/80.png) |
| 81 | 19,79 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 192 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 19,79) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](111/81.png) |
| 82 | 22,72 (1x1) | obraz zachodzi na mur/dach/płot | '!Town_Props' (zdarzenie 294 w 22,73) zachodzi na płot (1 kratek, 1011 px) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 2 | auto NA1 | ![](111/82.png) |
| 83 | 26,78 (14x2) | uprawa tuż pod murem/płotem | Pod chatami grządki leżą w pierwszym rzędzie pod frontową ścianą (jeden rząd odstępu na ścieżkę ledwo widać) | Odsunąć grządki o 2 kratki (ścieżka przed domem) albo usunąć | 3 | auto+oko GR1,PL1 | ![](111/83.png) |
| 84 | 28,83 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok N prosty na 30 kratek (naprzeciw 14), rodzaj 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/84.png) |
| 85 | 72,80 (3x1) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](111/85.png) |
| 86 | 76,83 (3x1) | luka w płocie | luka 1 kratki w płocie (75,83)-(77,83) (+48 podobnych w pobliżu) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 3 | auto PL1 | ![](111/86.png) |
| 87 | 77,83 (1x1) | rama innego gruntu pod płotem/murem | pod płotem/murem grunt 27, wokół {16: 408, 17: 224} | Ujednolicić grunt pod płotem/murem. | 2 | auto ES-h | ![](111/87.png) |
| 88 | 84,72 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (prawo) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/88.png) |
| 89 | 93,72 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/89.png) |
| 90 | 98,80 (4x5) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 27 (+1 podobnych w pobliżu) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/90.png) |
| 91 | 118,72 (1x6) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 6 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](111/91.png) |
| 92 | 19,87 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 199 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 19,87) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](111/92.png) |
| 93 | 19,95 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 209 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 19,95) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](111/93.png) |
| 94 | 25,85 (6x7) | luka w płocie | luka 2 kratki w płocie (30,84)-(30,87) (+1 podobnych w pobliżu) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](111/94.png) |
| 95 | 29,88 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok S prosty na 8 kratek (naprzeciw 3), rodzaj 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/95.png) |
| 96 | 31,91 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 461 w 32,95) zachodzi na płot (2 kratek, 1197 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 2 | auto NA2 | ![](111/96.png) |
| 97 | 39,91 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 460 w 39,95) zachodzi na płot (1 kratek, 1671 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 2 | auto NA2 | ![](111/97.png) |
| 98 | 46,88 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/98.png) |
| 99 | 51,87 (6x6) | drzewo/krzak/skała na murze, dachu lub płocie | Drzewo liściaste i krzak stoją na linii płotu zagrody (pień zasłania słupki) | Odsunąć od płotu o 2 kratki | 3 | auto+oko ES-j,GR1,NA2 | ![](111/99.png) |
| 100 | 65,84 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 7 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/100.png) |
| 101 | 67,91 (4x1) | luka w płocie | luka 2 kratki w płocie (66,91)-(69,91) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](111/101.png) |
| 102 | 68,94 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok N prosty na 7 kratek (naprzeciw 3), rodzaj 27 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/102.png) |
| 103 | 68,94 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 7 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/103.png) |
| 104 | 71,91 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 462 w 72,95) zachodzi na płot (4 kratek, 6802 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 3 | auto NA2 | ![](111/104.png) |
| 105 | 78,84 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 17 (6x3, wypełnienie 100%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/105.png) |
| 106 | 84,94 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok S prosty na 11 kratek (naprzeciw 4), rodzaj 27 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/106.png) |
| 107 | 84,94 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 7 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/107.png) |
| 108 | 84,95 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 463 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 84,95) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](111/108.png) |
| 109 | 88,84 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 17 (6x3, wypełnienie 100%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/109.png) |
| 110 | 89,88 (36x5) | uprawa tuż pod murem/płotem | Trzy ogrodzone grządki z strachami na wróble: grzbiet grządki leży dokładnie pod górnym płotem, bez rzędu odstępu (płot i ziemia zlane) | Przesunąć grządki o 1 rząd w dół | 2 | auto+oko GR1,NI1,NI2 | ![](111/110.png) |
| 111 | 18,99 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok W prosty na 9 kratek (naprzeciw 1), rodzaj 24 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/111.png) |
| 112 | 18,99 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 9 kratek, rodzaj 24 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/112.png) |
| 113 | 19,106 (1x1) | drzewo za blisko wody | drzewo na gruncie brzegu (ziemia/kamień) 5.8 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](111/113.png) |
| 114 | 44,96 (3x1) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](111/114.png) |
| 115 | 88,96 (3x1) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](111/115.png) |
| 116 | 22,110 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok W prosty na 10 kratek (naprzeciw 2), rodzaj 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](111/116.png) |
| 117 | 26,108 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](111/117.png) |
| 118 | 34,116 (1x4) | luka w płocie | luka 2 kratki w płocie (34,115)-(34,118) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](111/118.png) |
| 119 | 43,108 (13x8) | dwa grunty pod jednym obiektem | Ogrodzony prostokąt: środek połatany plamami ziemi i trawy, dolny płot z przerwami, lewy płot urwany przy dole | Ujednolicić grunt (cała ziemia albo cała trawa), domknąć płot | 2 | auto+oko ES-j,PL1 | ![](111/119.png) |
| 120 | 47,117 (1x1) | brama bez słupków | Dolny płot dużej zagrody ma 3-kratkową przerwę na ścieżce (gołe końce płotu, brak słupków bramy) | Słupki bramy po obu stronach przerwy | 2 | auto+oko PL1 | ![](111/120.png) |
| 121 | 115,110 (3x10) | ucięty obiekt | Mur miejski z basztami po wschodniej stronie (x~115) kończy się na y~110, dalej trawa, a wyżej biegnie w dół aż do krawędzi sąsiada - ucięty bez zakończenia | Dokończyć mur do krawędzi mapy albo domknąć narożną basztą | 2 | auto+oko NI1 | ![](111/121.png) |

### Mapa 118 - Dno studni

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 6,6 (1x1) | obraz zdarzenia wystaje na wolną kratkę | obraz zdarzenia 10 'Płytka kałuża' (!Quest_Places/0/2/1) zajmuje 26% dołu wolnej kratki (6,6) | Zmienić <Occupy:...> tak, by obejmował obraz, albo przesunąć zdarzenie. | 2 | auto G3 | ![](118/01.png) |

### Mapa 119 - Archiwum zakonu

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 3,7 (1x1) | gwiazdka nad wolną kratką | kafel 718 (D 14,9) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (3,7) | Zablokować kratkę pod obiektem (kafel blokujący/region 2) albo zdjąć gwiazdkę. | 2 | auto G1 | ![](119/01.png) |
| 02 | 9,8 (1x1) | gwiazdka nad wolną kratką | kafel 717 (D 13,9) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (9,8) | Zablokować kratkę pod obiektem (kafel blokujący/region 2) albo zdjąć gwiazdkę. | 2 | auto G1 | ![](119/02.png) |

### Mapa 120 - Osada Milczących

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 2,8 (36x22) | twardy czarny prostokąt cienia | Przy każdym domu (okolice 10,14 / 31,12 / 32,22 / 10,23) leży ciemny prostokąt o ostrych brzegach obok ściany - to kratki cienia warstwy 4 (twardy prostokąt), nie cień słońca | Usunąć kratki cienia z warstwy 4 w tych miejscach | 3 | auto+oko CI2,G1,NA1,NA2,NI2 | ![](120/01.png) |
| 02 | 51,20 (14x6) | zębata / dziurawa linia wzgórza | Skarpa/klif ze schodkowymi, zębatymi krawędziami (kamienne wcięcia 2-3 kratki) na łące - dolna linia zęby jak piła; dziury w murze | Wygładzić schodkową linię (spójne rogi), domknąć dziury | 2 | oko | ![](120/02.png) |
| 03 | 5,29 (30x3) | drzewo/krzak/skała na murze, dachu lub płocie | Pas sosen stoi tuż przy południowej palisadzie i na niej: pnie zasłaniają deski, korony zachodzą na linię palisady (np. 6-12,29; 30,29-31) | Wyciąć drzewa w pasie 2 kratek od palisady | 3 | auto+oko G1 | ![](120/03.png) |
| 04 | 62,30 (14x8) | zębata / dziurawa linia wzgórza | Druga skarpa z poszarpaną zębatą linią muru (x 60-75, y 30-38) i dziurą pośrodku | Jak wyżej | 2 | oko | ![](120/04.png) |
| 05 | 2,45 (24x15) | kanciasta plama gruntu | Ciemnoszare kanciaste łaty gruntu (kształt krzyża, kropli, prostokąta) rozsiane po trawie przy wsi - wyglądają jak plamy oleju, jedna wcięta w ścieżkę | Usunąć albo zamienić w ziemię z miękkim brzegiem | 2 | oko | ![](120/05.png) |
| 06 | 48,40 (20x12) | pusty nudny obszar | Południowa łąka Osady: równomiernie rozsiane identyczne sosny z kępami kwiatów bez ścieżki czy obiektu | Dosadzić kępy, polanę, ścieżkę | 1 | oko | ![](120/06.png) |
| 07 | 60,40 (9x14) | ucięty obiekt | Pozostałość muru ze schodkowymi, rwanymi krawędziami (kamienne bloki bez spójnych narożników) tworzy poszarpany labirynt na trawie - wygląda jak źle ucięty tilesetowy klif | Przerobić na spójną ruinę: proste odcinki z zaokrąglonymi narożnikami lub usunąć | 3 | oko | ![](120/07.png) |

### Mapa 125 - Przystań

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 10,0 (1x1) | drzewo za blisko wody | drzewo 3.6 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](125/01.png) |
| 02 | 22,1 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 32 w 21,2) zachodzi na ścianę (1 kratek, 719 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 2 | auto NA2 | ![](125/02.png) |
| 03 | 26,4 (1x1) | obraz zachodzi na mur/dach/płot | '!Decoration' (zdarzenie 28 w 26,5) zachodzi na ścianę (1 kratek, 719 px) | Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot. | 2 | auto NA1 | ![](125/03.png) |
| 04 | 30,4 (3x2) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 5 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](125/04.png) |
| 05 | 36,6 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 66 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 36,6) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/05.png) |
| 06 | 52,9 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 40 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 52,9) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/06.png) |
| 07 | 55,4 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 35 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 55,4) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/07.png) |
| 08 | 56,9 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 6 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](125/08.png) |
| 09 | 62,9 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](125/09.png) |
| 10 | 80,10 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (dół) 5 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](125/10.png) |
| 11 | 20,14 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 301 (C 5,5) - góra bez dołu (brak kafla 309 pod) w (20,14) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](125/11.png) |
| 12 | 22,15 (3x1) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](125/12.png) |
| 13 | 22,23 (5x2) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 8 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](125/13.png) |
| 14 | 28,15 (2x2) | ucięty obiekt | obiekt rozcięty: kafel 349 (C 5,11) - dół bez góry (brak kafla 341 nad) w (28,15) (+1 podobnych w pobliżu) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](125/14.png) |
| 15 | 28,21 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 437 (C 13,6) - dół bez góry (brak kafla 429 nad) w (28,21) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](125/15.png) |
| 16 | 30,16 (6x2) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 4 kratek - nic go nie pokazuje (+1 podobnych w pobliżu) | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](125/16.png) |
| 17 | 34,21 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok N prosty na 6 kratek (naprzeciw 1), rodzaj 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](125/17.png) |
| 18 | 38,16 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 368 (C 0,14) - góra bez dołu (brak kafla 376 pod) w (38,16) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](125/18.png) |
| 19 | 39,17 (1x1) | resztka / samotny płot | resztka płotu (1 kratki) niezwiązana z linią ani murem | Usunąć resztkę albo dokończyć ją do pełnego ogrodzenia. | 3 | auto PL2 | ![](125/19.png) |
| 20 | 39,21 (1x1) | resztka / samotny płot | resztka płotu (1 kratki) niezwiązana z linią ani murem | Usunąć resztkę albo dokończyć ją do pełnego ogrodzenia. | 3 | auto PL2 | ![](125/20.png) |
| 21 | 44,12 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 42 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 44,12) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/21.png) |
| 22 | 48,17 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 47 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 48,17) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/22.png) |
| 23 | 54,16 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 45 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 54,16) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/23.png) |
| 24 | 61,16 (26x2) | płot / obiekt narysowany na dachu | Poziomy płot narysowany dokładnie na kalenicy dachów trzech domów - szczyt dachu wchodzi w płot | Odsunąć płot o 2-3 kratki od dachów albo przerwać go na szerokości domów | 3 | auto+oko NI1 | ![](125/24.png) |
| 25 | 62,20 (24x1) | płot / obiekt narysowany na dachu | Płot biegnie tuż nad kalenicą dachów (dach i płot zlewają się w jedną plamę), pod domami grządki w pierwszym rzędzie | Odsunąć grządki o 2 kratki | 2 | oko | ![](125/25.png) |
| 26 | 101,16 (2x2) | zębata / dziurawa linia wzgórza | dziura 1 kratki w licu / obrysie wzgórza (+1 podobnych w pobliżu) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](125/26.png) |
| 27 | 5,25 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 10 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](125/27.png) |
| 28 | 16,32 (1x1) | zębata / dziurawa linia wzgórza | dziura 1 kratki w licu / obrysie wzgórza | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](125/28.png) |
| 29 | 21,25 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok S prosty na 9 kratek (naprzeciw 2), rodzaj 17 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](125/29.png) |
| 30 | 28,34 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 64 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 28,34) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/30.png) |
| 31 | 51,29 (4x1) | luka w płocie | luka 2 kratki w płocie (50,29)-(53,29) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](125/31.png) |
| 32 | 61,29 (4x1) | luka w płocie | luka 2 kratki w płocie (60,29)-(63,29) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](125/32.png) |
| 33 | 70,29 (4x1) | luka w płocie | luka 2 kratki w płocie (69,29)-(72,29) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](125/33.png) |
| 34 | 71,34 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 5 kratek, rodzaj 27 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](125/34.png) |
| 35 | 72,28 (3x1) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](125/35.png) |
| 36 | 92,27 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 185 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 92,27) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/36.png) |
| 37 | 99,25 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 181 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 99,25) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/37.png) |
| 38 | 104,29 (7x9) | kanciasta plama gruntu | Prostokątny podwyższony plateau (6x8) z kamiennym murkiem dookoła i ptasim gniazdem - kanciasty, wycięty linijką w trawie | Zaokrąglić brzeg, dodać schodki/skarpę albo usunąć | 3 | oko | ![](125/38.png) |
| 39 | 113,25 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 124 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 113,25) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/39.png) |
| 40 | 13,46 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (lewo) 6 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](125/40.png) |
| 41 | 18,42 (1x1) | drzewo za blisko wody | drzewo 3.0 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](125/41.png) |
| 42 | 20,45 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 105 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 20,45) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/42.png) |
| 43 | 42,38 (6x7) | figura wygląda jak NPC / przedmiot | Trzy rzędy szarych płytek z ciemnym grzbietem i kiełkami (pola uprawne) stoją na łące bez płotu i bez ścieżki - wyglądają jak rzędy nagrobków | Zamienić na wyraźne grządki z płotkiem albo usunąć | 2 | auto+oko NI1 | ![](125/43.png) |
| 44 | 74,46 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (dół) 5 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](125/44.png) |
| 45 | 79,38 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 109 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 79,38) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/45.png) |
| 46 | 85,36 (5x2) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 99 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 85,36) (+1 podobnych w pobliżu) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/46.png) |
| 47 | 96,44 (7x9) | kanciasta plama gruntu | Drugi prostokątny plateau (7x8) z murem u dołu i skrzynką w środku; proste boki, ostre narożniki | Jak wyżej | 3 | auto+oko NI1 | ![](125/47.png) |
| 48 | 14,49 (5x10) | drzewo za blisko wody | drzewo 2.8 kratki od wody (+3 podobnych w pobliżu) | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](125/48.png) |
| 49 | 14,49 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 98 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 14,49) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/49.png) |
| 50 | 15,53 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok N prosty na 6 kratek (naprzeciw 2), rodzaj 16 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](125/50.png) |
| 51 | 17,54 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 222 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 17,54) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/51.png) |
| 52 | 20,59 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 102 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 20,59) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/52.png) |
| 53 | 37,54 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 140 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 37,54) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/53.png) |
| 54 | 38,59 (12x8) | dwa grunty pod jednym obiektem | ogrodzony prostokąt 12x8 ma w środku dwa grunty: 16:68%, 17:30% | Ujednolicić grunt pod ogrodzeniem/podwórkiem. | 2 | auto GR1 | ![](125/54.png) |
| 55 | 41,59 (4x1) | luka w płocie | luka 2 kratki w płocie (40,59)-(43,59) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](125/55.png) |
| 56 | 85,49 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 139 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 85,49) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/56.png) |
| 57 | 104,58 (1x1) | zębata / dziurawa linia wzgórza | wzgórze otwarte z jakiejś strony (obrys niezamknięty, 15 kratek) | Wygładzić obrys skarpy (spójne narożniki, bez dziur). | 2 | auto ES-f | ![](125/57.png) |
| 58 | 16,63 (5x16) | drzewo za blisko wody | drzewo 2.0 kratki od wody (+5 podobnych w pobliżu) | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](125/58.png) |
| 59 | 16,64 (2x1) | region 2 (blokada) na gołym gruncie | region 2 (zawsze blokuje) na gołym gruncie, 2 kratek - nic go nie pokazuje | Usunąć region 2 albo narysować obiekt, który blokuje. | 2 | auto NI2 | ![](125/59.png) |
| 60 | 20,64 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 160 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 20,64) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/60.png) |
| 61 | 42,62 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (dół) 5 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](125/61.png) |
| 62 | 61,64 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (dół) 10 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](125/62.png) |
| 63 | 79,65 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 142 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 79,65) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/63.png) |
| 64 | 85,65 (4x3) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 201 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 85,65) (+1 podobnych w pobliżu) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](125/64.png) |
| 65 | 28,79 (1x1) | drzewo za blisko wody | drzewo 1.0 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](125/65.png) |
| 66 | 50,78 (70x20) | pusty nudny obszar | Południowa część mapy (x 50-120, y 78-95): sama płaska trawa z rzadkimi kępkami, jedna-dwie sosny, plamy szarego bruku; brak obiektów | Dosadzić kępy drzew, skały, siatkę ścieżek, rekwizyty | 3 | auto+oko CI1,ES-b,ES-f,ES-j,G5,NA1,NI1,NI2,O1,PL2 | ![](125/66.png) |
| 67 | 94,94 (16x3) | resztka / samotny płot | Palisada z bramą (16 kratek) stoi w poprzek brzegu: lewy koniec wchodzi w latarnię, prawy urywa się gołym końcem na brzegu zatoki - wygląda jak wolnostojący płot | Domknąć palisadę do wody/skał po obu stronach lub usunąć | 2 | auto+oko G5,PL2 | ![](125/67.png) |
| 68 | 86,98 (12x10) | kanciasta plama gruntu | Wzgórze latarni: prostokątne tarasy z cienką obwódką i prostymi bokami (12x10), schodki w murze - sztywny prostokąt zamiast skarpy | Zaokrąglić narożniki tarasów, miękkie przejście do brzegu | 3 | auto+oko CI1,ES-i,O1,PL2 | ![](125/68.png) |

### Mapa 162 - Garnizon nad zatoką

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 36,20 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 6 kratek, rodzaj 17 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](162/01.png) |
| 02 | 41,20 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok W prosty na 8 kratek (naprzeciw 1), rodzaj 17 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](162/02.png) |
| 03 | 93,22 (30x3) | długi prosty odcinek | Północno-wschodni brzeg ciągnie się idealnie poziomo ~30 kratek (y=24) - wygląda jak linijka | Zaokrąglić brzeg, zatoczki, cypel | 1 | auto+oko ES-b | ![](162/03.png) |
| 04 | 45,34 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 24 (12x24, wypełnienie 89%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](162/04.png) |
| 05 | 54,31 (1x1) | ucięty obiekt | obiekt rozcięty: kafel 368 (C 0,14) - góra bez dołu (brak kafla 376 pod) w (54,31) | Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę. | 3 | auto O1 | ![](162/05.png) |
| 06 | 57,25 (5x3) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 103 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 61,25) (+1 podobnych w pobliżu) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/06.png) |
| 07 | 60,34 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 15 kratek, rodzaj 24 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](162/07.png) |
| 08 | 71,29 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 79 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 71,29) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/08.png) |
| 09 | 78,24 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 13 kratek, rodzaj 24 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](162/09.png) |
| 10 | 79,24 (1x1) | ucięty/pojedynczy grunt | plama gruntu (warstwa 0) ucięta: bok N prosty na 13 kratek (naprzeciw 3), rodzaj 24 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](162/10.png) |
| 11 | 79,26 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 158 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 79,26) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/11.png) |
| 12 | 83,25 (1x1) | drzewo za blisko wody | drzewo na gruncie brzegu (ziemia/kamień) 5.4 kratki od wody | Odsunąć drzewo od wody. | 2 | auto ES-g | ![](162/12.png) |
| 13 | 61,40 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 44 '!Decoration' blokuje 1 kratek, w których jego obraz jest pusty (np. 61,40) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/13.png) |
| 14 | 76,37 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 82 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 76,37) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/14.png) |
| 15 | 77,41 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (prawo) 5 kratek, rodzaj 24 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](162/15.png) |
| 16 | 81,47 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 160 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 81,47) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/16.png) |
| 17 | 83,39 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 240 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 83,39) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/17.png) |
| 18 | 108,44 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 183 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 108,44) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/18.png) |
| 19 | 46,58 (1x1) | kanciasta / prostokątna plama gruntu | prostokątna plama gruntu 27 (4x3, wypełnienie 100%) | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](162/19.png) |
| 20 | 60,48 (5x4) | cień-bryła (stałe kafle z gwiazdkami) | bryła-cień Cienie.js: 3 stałych kafli z gwiazdkami nad sobą (szeroka ciemna płyta cienia) (+1 podobnych w pobliżu) | Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle. | 1 | auto CI1 | ![](162/20.png) |
| 21 | 76,53 (5x3) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 148 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 80,53) (+1 podobnych w pobliżu) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/21.png) |
| 22 | 86,58 (1x1) | kanciasta / prostokątna plama gruntu | prosty odcinek obrysu (góra) 19 kratek, rodzaj 24 | Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem. | 1 | auto ES-j | ![](162/22.png) |
| 23 | 116,54 (1x1) | ucięty/pojedynczy grunt | pasek jednej kratki (4) gruntu 16 na warstwie 0 otoczony gruntem 24 | Wygładzić plamę gruntu. | 1 | auto ES-b | ![](162/23.png) |
| 24 | 24,64 (8x3) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 152 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 31,64) (+2 podobnych w pobliżu) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/24.png) |
| 25 | 41,67 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 226 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 41,67) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/25.png) |
| 26 | 42,61 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 91 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 42,61) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/26.png) |
| 27 | 53,60 (18x2) | drzewo/krzak/skała na murze, dachu lub płocie | Rząd sosen i liściastych stoi tuż przy południowej palisadzie garnizonu: korony zasłaniają ostrza palisady, kilka pni dotyka linii palisady | Odsunąć drzewa o 2-3 kratki od palisady | 3 | auto+oko ES-j,NI1 | ![](162/27.png) |
| 28 | 111,60 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 211 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 111,60) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/28.png) |
| 29 | 119,66 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 156 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 119,66) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/29.png) |
| 30 | 31,77 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 138 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 31,77) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/30.png) |
| 31 | 36,79 (4x4) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 241 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 39,79) (+1 podobnych w pobliżu) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/31.png) |
| 32 | 95,82 (17x11) | dwa grunty pod jednym obiektem | ogrodzony prostokąt 17x11 ma w środku dwa grunty: 16:84%, 24:15% | Ujednolicić grunt pod ogrodzeniem/podwórkiem. | 2 | auto GR1 | ![](162/32.png) |
| 33 | 96,82 (1x1) | drzewo/krzak/skała na murze, dachu lub płocie | '!$Big_Trees_scinane' (zdarzenie 169 w 97,86) zachodzi na płot (4 kratek, 6802 px) | Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu. | 3 | auto NA2 | ![](162/33.png) |
| 34 | 110,79 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 14 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 110,79) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/34.png) |
| 35 | 110,73 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 151 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 110,73) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](162/35.png) |
| 36 | 101,92 (4x1) | luka w płocie | luka 2 kratki w płocie (100,92)-(103,92) | Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki. | 2 | auto PL1 | ![](162/36.png) |
| 37 | 24,96 (96x24) | pusty nudny obszar | Południe mapy 162 (y>96): trawa z samotnymi równomiernie rozsianymi sosnami, kępami kwiatów i kilkoma stogami siana; ani ścieżki, ani budynku | Skupiska drzew, polany, ścieżka do krawędzi | 2 | auto+oko ES-g,NI1 | ![](162/37.png) |

### Mapa 168 - Spalona zagroda

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 25,11 (24x4) | luka w płocie / niedomknięty płot | Pas krótkich odcinków płotu wzdłuż drogi (4-5 odcinków po 3 kratki z przerwami 2-3 kratek) - nie tworzy ogrodzenia, wygląda jak resztki | Połączyć w ciągły płot albo usunąć; w spalonej zagrodzie resztki mogą być zamierzone - do decyzji gracza | 3 | auto+oko PL1,PL2 | ![](168/01.png) |
| 02 | 26,7 (5x1) | wysoki obiekt bez gwiazdki | górny kafel 216 (B 8,11) obiektu bez gwiazdki na wolnej kratce: bohater stanie na nim w (26,7) (+1 podobnych w pobliżu) | Dodać kafel z gwiazdką nad górną częścią obiektu. | 2 | auto G2 | ![](168/02.png) |
| 03 | 43,3 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 43 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 43,3) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](168/03.png) |
| 04 | 50,0 (48x14) | kanciasta plama gruntu | Rozległe plamy ziemi z ostrymi poziomymi krawędziami (pasy y 3-6 i y 10-13), nieregularne ciemnozielone wyspy - wygląda jak mapa wycięta w kratkę | Zaokrąglić brzegi, dodać trawę i ślady kół | 2 | auto+oko NI1 | ![](168/04.png) |
| 05 | 2,13 (98x24) | kanciasta plama gruntu | Spalone pole to ogromny prostokąt ziemi (prawie 100x24) z prostą górną i dolną krawędzią (y=14 i y=36) i pozielenionymi „wyspami” - brzeg ostro prostokątny | Zaokrąglić obrys, dodać trawę wnikającą od brzegów, mniej jednolitego tła | 3 | auto+oko NI1,PL1,PL2,SC1 | ![](168/05.png) |
| 06 | 55,22 (8x4) | równo rozsiane drzewa/rzeczy | Osiem martwych drzew ustawionych w idealną siatkę 4x2 (równe odstępy) pośrodku spalonego pola - wygląda jak sztuczna kratownica | Rozsunąć nieregularnie, różne warianty, usunąć część | 3 | auto+oko NI1 | ![](168/06.png) |
| 07 | 50,26 (6x6) | kanciasta plama gruntu | Prostokątne plamy ziemi i zieleni na południowym brzegu spalonego pola mają ostre pionowe krawędzie (x~55 i x~80) | Zaokrąglić | 2 | auto+oko NI1 | ![](168/07.png) |
| 08 | 100,26 (20x10) | długi prosty odcinek | Brzeg morza na wschodzie z kamiennym klifem: schodkowe linie 3-4 kratki, dość równe, pas ziemi jak żółty kanciasty bruk | Zróżnicować linię brzegu | 1 | oko | ![](168/08.png) |
| 09 | 56,46 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 89 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 56,46) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](168/09.png) |
| 10 | 72,41 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 59 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 72,41) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](168/10.png) |
| 11 | 77,41 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 70 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 77,41) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](168/11.png) |
| 12 | 36,48 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 62 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 36,48) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](168/12.png) |
| 13 | 82,55 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 87 '!$Big_Trees_scinane' blokuje 1 kratek, w których jego obraz jest pusty (np. 82,55) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](168/13.png) |
| 14 | 0,68 (120x12) | pusty nudny obszar | Szeroki brzeg południowy mapy 168 (y 65-80): rozległy pas nijakiego kamienno-żółtego gruntu bez drzew, bez rekwizytów, z kilkoma kamykami | Dodać skały, drewno wyrzucone na brzeg, kępy trawy | 1 | oko | ![](168/14.png) |
| 15 | 0,82 (75x3) | długi prosty odcinek | Południowy brzeg zatoki to prosta pozioma linia ~75 kratek (y=85) z gładkimi prostokątnymi zatoczkami po wodnej stronie; wygląda jak wycięty linijką kanał | Poszarpać/zaokrąglić linię brzegu, zróżnicować zatoczki | 2 | oko | ![](168/15.png) |
| 16 | 103,80 (2x18) | długi prosty odcinek | Wschodni brzeg: pionowa prosta linia klifu ~18 kratek (x=115) z ostrym prostokątnym narożnikiem | Zaokrąglić | 2 | oko | ![](168/16.png) |
| 17 | 2,99 (35x9) | kanciasta plama gruntu | Pas jasnej trawy (35x9) z lewym końcem ściętym pionowo i prostymi górną/dolną krawędziami wcięty w żółty grunt na południu - prostokąt | Zaokrąglić obrys, wymieszać z gruntem | 2 | oko | ![](168/17.png) |

### Mapa 175 - Orla Grań

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 62,6 (5x6) | kanciasta plama gruntu | Cienki prostokątny obrys (ruina?) 5x6 z kamiennym słupem i dzwonkiem w środku, bez ścian - sam obrys w dwóch kafelkach | Zamienić na prawdziwy mur ruiny albo zabrać obrys | 2 | oko | ![](175/01.png) |
| 02 | 76,0 (8x14) | kanciasta plama gruntu | Pionowy pas żółtego/zielonego gruntu o ostrych pionowych brzegach (8x14) pośrodku szarego kamienistego terenu - brzydki szew albo wklejka | Rozmyć/zaokrąglić, ujednolicić grunt z otoczeniem | 3 | oko | ![](175/02.png) |
| 03 | 0,14 (10x9) | kanciasta plama gruntu | Zielone łaty trawy o prostych brzegach i prostokątny pas jasnoniebieskiego brukowego kamienia (x 10-15,y 15-17) leżą bez związku w szarym gruncie | Zaokrąglić łaty, usunąć prostokątny pas bruku | 2 | oko | ![](175/03.png) |
| 04 | 75,13 (25x14) | kanciasta plama gruntu | Pionowa pasma wody (x 80-88) rozdziela kamienisty ląd: lewy brzeg ma proste pionowe linie (długość ~14 kratek), nad nim dziwny „szew” szarego/zielonego gruntu z ostrą granicą | Zaokrąglić brzegi, usunąć szew gruntu | 2 | oko | ![](175/04.png) |
| 05 | 126,22 (30x6) | długi prosty odcinek | Brzegi północne klifu: prosta pozioma linia z równymi schodkami co ~8 kratek | Zróżnicować | 1 | oko | ![](175/05.png) |
| 06 | 19,30 (3x1) | obraz zdarzenia wystaje na wolną kratkę | obraz zdarzenia 345 'Szyb do kopalni' (!$Kopalnia_Szyb/0/2/0) zajmuje 96% dołu wolnej kratki (19,30) (+1 podobnych w pobliżu) | Zmienić <Occupy:...> tak, by obejmował obraz, albo przesunąć zdarzenie. | 2 | auto G3 | ![](175/06.png) |
| 07 | 33,33 (7x8) | kanciasta plama gruntu | Prostokątna cienka obwódka fundamentu 7x7 (dwa kafle ściany w dolnym rogu i schody) bez murów po bokach - pusty prostokąt | Dobudować niskie mury albo usunąć obwódkę | 2 | oko | ![](175/07.png) |
| 08 | 120,26 (36x26) | pusty nudny obszar | Wschodni płaskowyż: ogromna równa szara pustka (36x26) z czterema równo rozmieszczonymi sosnami, bez skał, ścieżek czy rekwizytów | Skupiska skał, krzewy, ścieżka, ruiny | 2 | oko | ![](175/08.png) |
| 09 | 69,39 (10x10) | kanciasta plama gruntu | Trzeci pusty prostokątny obrys ruiny (10x10) ze schodami i kamiennym słupem, mur tylko z przodu, trzy cienkie boki jako linie - sztywny prostokąt | Dobudować mury lub zaokrąglić | 2 | oko | ![](175/09.png) |
| 10 | 77,38 (8x10) | kanciasta plama gruntu | Pionowy pas żółtego gruntu z prostym lewym i prawym brzegiem (jak powyżej przy (76,0)) i postacią-posągiem obok | Rozmyć granicę, ujednolicić grunt | 3 | oko | ![](175/10.png) |
| 11 | 22,54 (8x2) | kanciasta plama gruntu | Jasnozielone prostokątne paski 1 kratka wysokości (8x1 i 6x1) tuż nad południowym murem skarpy - kanciaste pasy trawy | Zaokrąglić lub usunąć | 1 | oko | ![](175/11.png) |

### Mapa 181 - Stajnia z wozownią

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 2,4 (9x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 1 '!Miasto2_Wnetrza' blokuje 1 kratek, w których jego obraz jest pusty (np. 2,4) (+2 podobnych w pobliżu) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](181/01.png) |

### Mapa 183 - Dom 2 (kamienica mieszczan)

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 10,4 (1x1) | niewidzialna blokada (zdarzenie/kafel) | zdarzenie 1 '!$Fireplace1' blokuje 1 kratek, w których jego obraz jest pusty (np. 10,4) | Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje. | 2 | auto NI1 | ![](183/01.png) |
| 02 | 17,8 (3x3) | pusty dywan | W prawej sypialni leży ciemnofioletowy prostokątny dywan bez wzoru i bez obwódki (wygląda jak dziura w podłodze) | Dać wzór/obwódkę jak inne dywany albo zmienić na dywan z tilesetu | 1 | oko | ![](183/02.png) |

### Mapa 213 - Kopalnia pod Orlą Granią

| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |
|---|---|---|---|---|---|---|---|
| 01 | 25,14 (40x12) | twardy czarny prostokąt cienia | Kopalnia: przy stopie ścian skalnych leżą ciemne prostokątne pasy 1x1-1x2 o ostrych brzegach (kratki cienia warstwy 4) - np. przy (26,17), (45,17), (13,28-30), (24,31-33) | Wygładzić kratki cienia warstwy 4 w kopalni albo zastąpić miękkim cieniem | 2 | auto+oko CI2 | ![](213/01.png) |
| 02 | 50,13 (40x10) | kanciasta plama gruntu | Krawędzie jaskiń to schodkowe prostokątne wcięcia (kafle skały co kratkę, jak schody) - brzeg groty wygląda jak piksel-art z kwadratów, nie jak naturalna jaskinia | Zaokrąglić narożniki wcięć, różna głębokość | 2 | auto+oko CI2,G1 | ![](213/02.png) |
| 03 | 3,26 (1x10) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 10 szt. | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 2 | auto CI2 | ![](213/03.png) |
| 04 | 7,31 (1x1) | dwa zdarzenia na jednej kratce | zdarzenia 5 'Wagonik A' i 7 'Wagonik (jazda)' na jednej kratce (7,31) | Rozsunąć zdarzenia. | 1 | auto Z1 | ![](213/04.png) |
| 05 | 8,36 (1x4) | twardy czarny prostokąt cienia (warstwa 4) | kratki cienia (warstwa 4) 4 szt. | Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js. | 2 | auto CI2 | ![](213/05.png) |
| 06 | 29,37 (1x1) | gwiazdka nad wolną kratką | kafel 677 (D 13,4) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (29,37) | Zablokować kratkę pod obiektem (kafel blokujący/region 2) albo zdjąć gwiazdkę. | 2 | auto G1 | ![](213/06.png) |
