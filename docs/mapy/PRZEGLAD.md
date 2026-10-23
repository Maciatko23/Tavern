# Przegląd map zrobionych przez agentów (etap 1)

Data: 2026-10-22. Narzędzie: `python tools/mapy/przeglad.py` (kontrola jednej mapy: `python tools/mapy/kontrola.py 105`).
Stan map w chwili przeglądu (etap 1: lista problemów; etap 2: poprawki map agentów - sekcja „Po etapie 2” na końcu, tam też „Do poprawy przez użytkownika”).

Sprawdzone: 35 wnętrz (102-117, 121-128 bez 125, 156, 160, 161, 163, 166, 169, 171-177 bez 175, Map019) i nowe części 21 powiększonych map (2026-10-19: wszystko na prawo od starej szerokości i pod starą wysokością; stara część na obrazkach jest przyciemniona).
Wiedza o kaflach (blaty, obiekty, gwiazdki, wyjątki) pochodzi z map wzorcowych: Map001, Map019, Map025, Map026, Map101, Map008 (`tools/mapy/katalog.json`).

## Kody problemów

| kod | co znaczy | waga |
|---|---|---|
| D1 | miejsca nieosiągalne | uwaga |
| D2 | wyjście / drzwi nieosiągalne | błąd |
| D3 | miejsce przybycia zablokowane | błąd |
| D4 | zdarzenie z akcją nieosiągalne | uwaga |
| G1 | bohater wchodzi pod obiekt (gwiazdka nad wolną kratką) | uwaga |
| G2 | bohater wchodzi na obiekt (góra bez gwiazdki) | uwaga |
| G3 | obraz zdarzenia wystaje na wolną kratkę | uwaga |
| G4 | zdarzenie 'pod postacią' wyższe niż kratka | uwaga |
| G5 | zdarzenie 'nad postacią' nad wolną kratką | uwaga |
| O1 | obiekt rozcięty | uwaga |
| P1 | przedmiot na meblu, który nie jest blatem | uwaga |
| P2 | przedmiot na krawędzi blatu / poza blatem | uwaga |
| P3 | przedmiot stołowy na podłodze | info |
| P4 | kafel przechodni na meblu (bohater wejdzie na mebel) | błąd |
| R1 | obiekt z kafli na mapie plenerowej (obiekty mają być zdarzeniami) | uwaga |
| W1 | przejście węższe niż 1 kratka | uwaga |
| Z1 | zdarzenia na jednej kratce | uwaga |
| Z2 | obszary zdarzeń nachodzą | uwaga |
| Z3 | zdarzenie na kaflu blokującym | uwaga |
| Z4 | zdarzenie poza mapą | błąd |

Waga: **błąd** psuje grę (nie da się wejść, wyjść, bohater wchodzi na mebel), **uwaga** psuje wygląd albo dostęp do rzeczy, **info** do decyzji (np. drzewo do ścięcia stoi w gęstym lesie, pokój za drzwiami, które może otwiera fabuła).

## Najczęstsze problemy

Razem: **0 błędów, 39 uwag, 290 informacji** w 56 mapach (39 map bez żadnej uwagi ani błędu).

| kod | co | błędy + uwagi | w ilu mapach | do tego info |
|---|---|---|---|---|
| D1 | miejsca nieosiągalne | 17 | 6 | 11 |
| O1 | obiekt rozcięty | 10 | 4 | 0 |
| P2 | przedmiot na krawędzi blatu / poza blatem | 6 | 5 | 0 |
| G1 | bohater wchodzi pod obiekt (gwiazdka nad wolną kratką) | 2 | 1 | 0 |
| P1 | przedmiot na meblu, który nie jest blatem | 2 | 2 | 0 |
| P3 | przedmiot stołowy na podłodze | 1 | 1 | 1 |
| G3 | obraz zdarzenia wystaje na wolną kratkę | 1 | 1 | 0 |
| D4 | zdarzenie z akcją nieosiągalne | 0 | 0 | 278 |

Dla porównania kontrola map wzorcowych (szum narzędzia: tyle znajduje w mapach uznanych za dobre):

| mapa | znalezione |
|---|---|
| Map001 TAWERNA | D1 25, D4 2, P2 27, Z2 7, Z3 4 |
| Map025 Pokoje gości | D1 1, D2 5, P2 12, Z1 12 |
| Map026 Apartamenty | nic |

Uwaga do map wzorcowych: Map001 ma pokoje dostępne tylko przez przeniesienia i drzwi obsługiwane przez wtyczki, więc tam D1 to głównie zaplecze; P2 w tawernie to talerze i świece na przedniej krawędzi stołów - tak wygląda granica, od której kontrola zaczyna zgłaszać.

## Mapy

| mapa | nazwa | rodzaj | błędy | uwagi | info | kody | obrazek |
|---|---|---|---|---|---|---|---|
| Map019 | Dom dziadka - Wnętrze | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map019.png) |
| Map102 | Piekarnia | wnętrze | 0 | 4 | 0 | O1 3, P2 1 | [obraz](kontrola_Map102.png) |
| Map103 | Kantor | wnętrze | 0 | 1 | 1 | P2 1, P3 1 | [obraz](kontrola_Map103.png) |
| Map104 | Ratusz | wnętrze | 0 | 1 | 0 | P2 1 | [obraz](kontrola_Map104.png) |
| Map105 | Dom kowala | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map105.png) |
| Map106 | Dom garbarza | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map106.png) |
| Map107 | Dom woziwody | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map107.png) |
| Map108 | Dzwonnica | wnętrze | 0 | 1 | 0 | P3 1 | [obraz](kontrola_Map108.png) |
| Map109 | Dom mieszczan | wnętrze | 0 | 3 | 0 | P1 1, P2 2 | [obraz](kontrola_Map109.png) |
| Map110 | Izba pod skałą | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map110.png) |
| Map112 | Chata praczki | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map112.png) |
| Map113 | Chata drwala | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map113.png) |
| Map114 | Chata kłusownika | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map114.png) |
| Map115 | Izba znachorki | wnętrze | 0 | 1 | 0 | D1 1 | [obraz](kontrola_Map115.png) |
| Map116 | Kram starzyzny | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map116.png) |
| Map117 | Dom uchodźców | wnętrze | 0 | 3 | 0 | G1 2, O1 1 | [obraz](kontrola_Map117.png) |
| Map121 | Wspólna izba | wnętrze | 0 | 0 | 1 | D1 1 | [obraz](kontrola_Map121.png) |
| Map122 | Chata tkaczki | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map122.png) |
| Map123 | Chata Najstarszego | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map123.png) |
| Map124 | Chata rzeźbiarza | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map124.png) |
| Map126 | Chata Janka | wnętrze | 0 | 1 | 0 | P2 1 | [obraz](kontrola_Map126.png) |
| Map127 | Szopa przy pochylni | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map127.png) |
| Map128 | Komora celna | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map128.png) |
| Map156 | Skryptorium | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map156.png) |
| Map160 | Izba latarnika | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map160.png) |
| Map161 | Laterna | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map161.png) |
| Map163 | Kwatera rotmistrza | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map163.png) |
| Map166 | Wrak - pod pokładem | wnętrze | 0 | 0 | 5 | D1 1, D4 4 | [obraz](kontrola_Map166.png) |
| Map169 | Dom Ługów | wnętrze | 0 | 2 | 0 | D1 2 | [obraz](kontrola_Map169.png) |
| Map171 | Piwnica kantoru | wnętrze | 0 | 1 | 0 | D1 1 | [obraz](kontrola_Map171.png) |
| Map172 | Dwór - Hol | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map172.png) |
| Map173 | Dwór - Biblioteka | wnętrze | 0 | 1 | 1 | D1 1, P1 1 | [obraz](kontrola_Map173.png) |
| Map174 | Dwór - Gabinet | wnętrze | 0 | 0 | 0 | - | [obraz](kontrola_Map174.png) |
| Map176 | Komora pod menhirami | wnętrze | 0 | 2 | 1 | D1 1, O1 2 | [obraz](kontrola_Map176.png) |
| Map177 | Jaskinia przemytników | wnętrze | 0 | 1 | 0 | G3 1 | [obraz](kontrola_Map177.png) |
| Map003 | Kruczy Jar | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map003.png) |
| Map004 | Łąka#1 | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map004.png) |
| Map017 | Łąka#2 | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map017.png) |
| Map018 | Łąka#3 | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map018.png) |
| Map020 | Dom dziadka - Podwórze | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map020.png) |
| Map021 | Leśna droga | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map021.png) |
| Map022 | Polna droga | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map022.png) |
| Map023 | Skraj lasu | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map023.png) |
| Map013 | Góry i kamieniołom | nowa część powiększonej mapy | 0 | 0 | 2 | D1 2 | [obraz](kontrola_Map013.png) |
| Map008 | Okolice Tawerny | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map008.png) |
| Map024 | Posiadłość Lorda | nowa część powiększonej mapy | 0 | 4 | 2 | D1 1, D4 1, O1 4 | [obraz](kontrola_Map024.png) |
| Map111 | Podgrodzie | nowa część powiększonej mapy | 0 | 1 | 104 | D1 1, D4 104 | [obraz](kontrola_Map111.png) |
| Map120 | Osada Milczących | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map120.png) |
| Map125 | Przystań | nowa część powiększonej mapy | 0 | 11 | 130 | D1 14, D4 127 | [obraz](kontrola_Map125.png) |
| Map155 | Pustelnia na klifie | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map155.png) |
| Map157 | Urwisko Kruków | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map157.png) |
| Map159 | Przylądek z latarnią | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map159.png) |
| Map162 | Garnizon nad zatoką | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map162.png) |
| Map165 | Wrak na mieliźnie | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map165.png) |
| Map168 | Spalona zagroda | nowa część powiększonej mapy | 0 | 1 | 43 | D1 2, D4 42 | [obraz](kontrola_Map168.png) |
| Map175 | Orla Grań | nowa część powiększonej mapy | 0 | 0 | 0 | - | [obraz](kontrola_Map175.png) |

## Szczegóły

### Map019 Dom dziadka - Wnętrze

19x13, zestaw 8.

![Map019](kontrola_Map019.png)

Brak problemów.

### Map102 Piekarnia

17x12, zestaw 8.

![Map102](kontrola_Map102.png)

- **O1** (uwaga) obiekt rozcięty: kafel 789 (E 5,2) - dół bez góry (brak kafla 781 nad) w (10,6)
- **O1** (uwaga) obiekt rozcięty: kafel 482 (C 10,12) - dół bez góry (brak kafla 474 nad) w (14,9)
- **O1** (uwaga) obiekt rozcięty: kafel 482 (C 10,12) - góra bez dołu (brak kafla 490 pod) w (14,9)
- **P2** (uwaga) zdarzenie 10 'gruba świeca z zaciekami (animowana)' (!Tavern_Props|1|2|0) stoi za blatem (nad jego tylną krawędzią): 7 px od płaskiego wierzchu w (12,7)

### Map103 Kantor

19x12, zestaw 8.

![Map103](kontrola_Map103.png)

- **P2** (uwaga) zdarzenie 5 'kasetka z monetami' (!Tavern_Props|1|6|0) stoi przed blatem (na jego przodzie / nogach): 7 px poza płaskim wierzchem w (14,7)
- informacje: P3 1 (np. zdarzenie 11 'gruba świeca z zaciekami (animowana)' (!Tavern_Props|0|2|0) leży na podłodze, a w mapach wzorcowych leży tylko na blatach (3,7))

### Map104 Ratusz

21x13, zestaw 8.

![Map104](kontrola_Map104.png)

- **P2** (uwaga) zdarzenie 18 'Świeca' (!Decoration2|1|2|0) stoi na brzegu mebla (półprzezroczysty cień / rama) w (18,8)

### Map105 Dom kowala

15x11, zestaw 8.

![Map105](kontrola_Map105.png)

Brak problemów.

### Map106 Dom garbarza

16x11, zestaw 8.

![Map106](kontrola_Map106.png)

Brak problemów.

### Map107 Dom woziwody

14x10, zestaw 8.

![Map107](kontrola_Map107.png)

Brak problemów.

### Map108 Dzwonnica

11x13, zestaw 8.

![Map108](kontrola_Map108.png)

- **P3** (uwaga) zdarzenie 18 'Świeca' (!Decoration2|1|2|0) stoi na podłodze tuż przed meblem - pewnie miał stać na blacie (we wzorcach: na blacie 6, na podłodze 2) (1,7)

### Map109 Dom mieszczan

16x11, zestaw 8.

![Map109](kontrola_Map109.png)

- **P1** (uwaga) kafel 720 (D 8,10) leży na kaflu 484 (C 12,12), który nie jest blatem (13,5)
- **P2** (uwaga) kafel 596 (D 4,10) wisi w powietrzu za meblem / nad nim (4 px nad jego pikselami) w (5,7)
- **P2** (uwaga) zdarzenie 23 'Świeca' (!Decoration2|1|2|0) stoi na brzegu mebla (półprzezroczysty cień / rama) w (6,8)

### Map110 Izba pod skałą

12x10, zestaw 8.

![Map110](kontrola_Map110.png)

Brak problemów.

### Map112 Chata praczki

13x10, zestaw 8.

![Map112](kontrola_Map112.png)

Brak problemów.

### Map113 Chata drwala

13x10, zestaw 8.

![Map113](kontrola_Map113.png)

Brak problemów.

### Map114 Chata kłusownika

12x10, zestaw 8.

![Map114](kontrola_Map114.png)

Brak problemów.

### Map115 Izba znachorki

13x10, zestaw 8.

![Map115](kontrola_Map115.png)

- **D1** (uwaga) nieosiągalne miejsce: 1 kratek od (2,4)

### Map116 Kram starzyzny

14x10, zestaw 8.

![Map116](kontrola_Map116.png)

Brak problemów.

### Map117 Dom uchodźców

16x11, zestaw 8.

![Map117](kontrola_Map117.png)

- **G1** (uwaga) kafel 720 (D 8,10) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (3,6)
- **G1** (uwaga) kafel 608 (D 0,12) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (9,6)
- **O1** (uwaga) obiekt rozcięty: kafel 415 (C 15,3) - dół bez góry (brak kafla 407 nad) w (11,9)

### Map121 Wspólna izba

15x11, zestaw 8.

![Map121](kontrola_Map121.png)

- informacje: D1 1 (np. nieosiągalne miejsce: 1 kratek od (2,4) - za zdarzeniem 12 'Pusta beczka' (może się otwiera))

### Map122 Chata tkaczki

13x10, zestaw 8.

![Map122](kontrola_Map122.png)

Brak problemów.

### Map123 Chata Najstarszego

15x11, zestaw 8.

![Map123](kontrola_Map123.png)

Brak problemów.

### Map124 Chata rzeźbiarza

13x10, zestaw 8.

![Map124](kontrola_Map124.png)

Brak problemów.

### Map126 Chata Janka

13x10, zestaw 8.

![Map126](kontrola_Map126.png)

- **P2** (uwaga) zdarzenie 12 'Świeca' (!Decoration2|1|2|0) stoi przed blatem (na jego przodzie / nogach): 7 px poza płaskim wierzchem w (9,8)

### Map127 Szopa przy pochylni

12x9, zestaw 8.

![Map127](kontrola_Map127.png)

Brak problemów.

### Map128 Komora celna

12x9, zestaw 8.

![Map128](kontrola_Map128.png)

Brak problemów.

### Map156 Skryptorium

13x10, zestaw 8.

![Map156](kontrola_Map156.png)

Brak problemów.

### Map160 Izba latarnika

13x10, zestaw 8.

![Map160](kontrola_Map160.png)

Brak problemów.

### Map161 Laterna

11x9, zestaw 8.

![Map161](kontrola_Map161.png)

Brak problemów.

### Map163 Kwatera rotmistrza

13x10, zestaw 8.

![Map163](kontrola_Map163.png)

Brak problemów.

### Map166 Wrak - pod pokładem

22x13, zestaw 8.

![Map166](kontrola_Map166.png)

- informacje: D1 1, D4 4 (np. nieosiągalne miejsce: 22 kratek od (2,3) - za zdarzeniem 7 'Drzwi kajuty kapitana' (może się otwiera); zdarzenie 6 'Skrzynia kapitana' z akcją za zdarzeniem 7 'Drzwi kajuty kapitana' (może się otwiera) (7,3); zdarzenie 5 'Koja kapitana' z akcją za zdarzeniem 7 'Drzwi kajuty kapitana' (może się otwiera) (1,4))

### Map169 Dom Ługów

13x10, zestaw 8.

![Map169](kontrola_Map169.png)

- **D1** (uwaga) nieosiągalne miejsce: 1 kratek od (1,7)
- **D1** (uwaga) nieosiągalne miejsce: 1 kratek od (11,8)

### Map171 Piwnica kantoru

19x12, zestaw 8.

![Map171](kontrola_Map171.png)

- **D1** (uwaga) nieosiągalne miejsce: 1 kratek od (16,4)

### Map172 Dwór - Hol

23x15, zestaw 8.

![Map172](kontrola_Map172.png)

Brak problemów.

### Map173 Dwór - Biblioteka

17x12, zestaw 8.

![Map173](kontrola_Map173.png)

- **P1** (uwaga) kafel 613 (D 5,12) leży na kaflu 863 (E 7,11), który nie jest blatem (2,9)
- informacje: D1 1 (np. nieosiągalne miejsce: 1 kratek od (1,10) - za zdarzeniem 12 'Globus' (może się otwiera))

### Map174 Dwór - Gabinet

15x11, zestaw 8.

![Map174](kontrola_Map174.png)

Brak problemów.

### Map176 Komora pod menhirami

20x14, zestaw 12.

![Map176](kontrola_Map176.png)

- **O1** (uwaga) obiekt rozcięty: kafel 878 (E 6,13) - góra bez dołu (brak kafla 886 pod) w (3,4)
- **O1** (uwaga) obiekt rozcięty: kafel 878 (E 6,13) - góra bez dołu (brak kafla 886 pod) w (16,10)
- informacje: D1 1 (np. nieosiągalne miejsce: 154 kratek od (0,0) - pusta przestrzeń poza pomieszczeniem (przechodnie kafle tła))

### Map177 Jaskinia przemytników

20x14, zestaw 12.

![Map177](kontrola_Map177.png)

- **G3** (uwaga) obraz zdarzenia 3 'Stół z rejestrem' (!$Lud_Stol|0|2|1) zajmuje 21% dołu wolnej kratki (8,5)

### Map003 Kruczy Jar

80x60, zestaw 9; sprawdzona nowa część (x >= 40 albo y >= 30; stara mapa 40x30).

![Map003](kontrola_Map003.png)

Brak problemów.

### Map004 Łąka#1

80x60, zestaw 9; sprawdzona nowa część (x >= 40 albo y >= 30; stara mapa 40x30).

![Map004](kontrola_Map004.png)

Brak problemów.

### Map017 Łąka#2

80x60, zestaw 9; sprawdzona nowa część (x >= 40 albo y >= 30; stara mapa 40x30).

![Map017](kontrola_Map017.png)

Brak problemów.

### Map018 Łąka#3

80x60, zestaw 9; sprawdzona nowa część (x >= 40 albo y >= 30; stara mapa 40x30).

![Map018](kontrola_Map018.png)

Brak problemów.

### Map020 Dom dziadka - Podwórze

60x44, zestaw 9; sprawdzona nowa część (x >= 30 albo y >= 22; stara mapa 30x22).

![Map020](kontrola_Map020.png)

Brak problemów.

### Map021 Leśna droga

80x60, zestaw 9; sprawdzona nowa część (x >= 40 albo y >= 30; stara mapa 40x30).

![Map021](kontrola_Map021.png)

Brak problemów.

### Map022 Polna droga

80x60, zestaw 9; sprawdzona nowa część (x >= 40 albo y >= 30; stara mapa 40x30).

![Map022](kontrola_Map022.png)

Brak problemów.

### Map023 Skraj lasu

80x60, zestaw 9; sprawdzona nowa część (x >= 40 albo y >= 30; stara mapa 40x30).

![Map023](kontrola_Map023.png)

Brak problemów.

### Map013 Góry i kamieniołom

120x96, zestaw 11; sprawdzona nowa część (x >= 60 albo y >= 48; stara mapa 60x48).

![Map013](kontrola_Map013.png)

- informacje: D1 2 (np. nieosiągalne miejsce: 39 kratek od (99,37) - miejsce tylko z orła (Okolice_Data.js, celowo nieosiągalne pieszo); nieosiągalne miejsce: 52 kratek od (33,73) - miejsce tylko z orła (Okolice_Data.js, celowo nieosiągalne pieszo))
- pominięto 3 drobnych zamkniętych kieszeni (< 4 kratki, bez zdarzeń).

### Map008 Okolice Tawerny

104x138, zestaw 11; sprawdzona nowa część (x >= 52 albo y >= 69; stara mapa 52x69).

![Map008](kontrola_Map008.png)

Brak problemów.

### Map024 Posiadłość Lorda

80x60, zestaw 11; sprawdzona nowa część (x >= 40 albo y >= 30; stara mapa 40x30).

![Map024](kontrola_Map024.png)

- **O1** (uwaga) obiekt rozcięty: kafel 224 (B 8,12) - dół bez góry (brak kafla 216 nad) w (5,58)
- **O1** (uwaga) obiekt rozcięty: kafel 224 (B 8,12) - dół bez góry (brak kafla 216 nad) w (31,58)
- **O1** (uwaga) obiekt rozcięty: kafel 224 (B 8,12) - dół bez góry (brak kafla 216 nad) w (57,58)
- **O1** (uwaga) obiekt rozcięty: kafel 224 (B 8,12) - dół bez góry (brak kafla 216 nad) w (71,58)
- informacje: D1 1, D4 1 (np. nieosiągalne miejsce: 11 kratek od (10,46) - za zdarzeniem 251 'Suchy krzaczek' (może się otwiera); rzecz do zbierania 310 'Wysoki pieniek' stoi w nieosiągalnym miejscu (15,51))
- pominięto 9 drobnych zamkniętych kieszeni (< 4 kratki, bez zdarzeń).

### Map111 Podgrodzie

92x112, zestaw 11; sprawdzona nowa część (x >= 46 albo y >= 56; stara mapa 46x56).

![Map111](kontrola_Map111.png)

- **D1** (uwaga) nieosiągalne miejsce: 4 kratek od (46,0)
- informacje: D4 104 (np. rzecz do zbierania 147 'Drzewo' stoi w nieosiągalnym miejscu (48,0); rzecz do zbierania 402 'Dzika jabłoń' stoi w nieosiągalnym miejscu (75,0); rzecz do zbierania 150 'Drzewo' stoi w nieosiągalnym miejscu (55,1))
- pominięto 9 drobnych zamkniętych kieszeni (< 4 kratki, bez zdarzeń).

### Map120 Osada Milczących

80x68, zestaw 11; sprawdzona nowa część (x >= 40 albo y >= 34; stara mapa 40x34).

![Map120](kontrola_Map120.png)

Brak problemów.

### Map125 Przystań

112x80, zestaw 11; sprawdzona nowa część (x >= 56 albo y >= 40; stara mapa 56x40).

![Map125](kontrola_Map125.png)

- **D1** (uwaga) nieosiągalne miejsce: 73 kratek od (60,0)
- **D1** (uwaga) nieosiągalne miejsce: 4 kratek od (69,1)
- **D1** (uwaga) nieosiągalne miejsce: 23 kratek od (62,22)
- **D1** (uwaga) nieosiągalne miejsce: 5 kratek od (59,31)
- **D1** (uwaga) nieosiągalne miejsce: 25 kratek od (76,31)
- **D1** (uwaga) nieosiągalne miejsce: 25 kratek od (81,41)
- **D1** (uwaga) nieosiągalne miejsce: 25 kratek od (44,47)
- **D1** (uwaga) nieosiągalne miejsce: 4 kratek od (109,47)
- **D1** (uwaga) nieosiągalne miejsce: 25 kratek od (64,69)
- **D1** (uwaga) nieosiągalne miejsce: 4 kratek od (109,71)
- **D1** (uwaga) nieosiągalne miejsce: 9 kratek od (109,75)
- informacje: D1 3, D4 127 (np. nieosiągalne miejsce: 27 kratek od (94,0) - za zdarzeniem 339 'Pęknięty kamień' (może się otwiera); nieosiągalne miejsce: 121 kratek od (109,24) - miejsce tylko z orła (Okolice_Data.js, celowo nieosiągalne pieszo); nieosiągalne miejsce: 171 kratek od (97,44) - miejsce tylko z orła (Okolice_Data.js, celowo nieosiągalne pieszo))
- pominięto 13 drobnych zamkniętych kieszeni (< 4 kratki, bez zdarzeń).

### Map155 Pustelnia na klifie

96x72, zestaw 11; sprawdzona nowa część (x >= 48 albo y >= 36; stara mapa 48x36).

![Map155](kontrola_Map155.png)

Brak problemów.

### Map157 Urwisko Kruków

112x72, zestaw 11; sprawdzona nowa część (x >= 56 albo y >= 36; stara mapa 56x36).

![Map157](kontrola_Map157.png)

Brak problemów.

### Map159 Przylądek z latarnią

88x80, zestaw 11; sprawdzona nowa część (x >= 44 albo y >= 40; stara mapa 44x40).

![Map159](kontrola_Map159.png)

Brak problemów.

### Map162 Garnizon nad zatoką

112x80, zestaw 11; sprawdzona nowa część (x >= 56 albo y >= 40; stara mapa 56x40).

![Map162](kontrola_Map162.png)

Brak problemów.

### Map165 Wrak na mieliźnie

80x60, zestaw 11; sprawdzona nowa część (x >= 40 albo y >= 30; stara mapa 40x30).

![Map165](kontrola_Map165.png)

Brak problemów.

### Map168 Spalona zagroda

100x72, zestaw 11; sprawdzona nowa część (x >= 50 albo y >= 36; stara mapa 50x36).

![Map168](kontrola_Map168.png)

- **D1** (uwaga) nieosiągalne miejsce: 6 kratek od (10,36)
- informacje: D1 1, D4 42 (np. nieosiągalne miejsce: 27 kratek od (51,24) - miejsce tylko z orła (Okolice_Data.js, celowo nieosiągalne pieszo); rzecz do zbierania 110 'Drzewo' stoi w nieosiągalnym miejscu (88,0); rzecz do zbierania 88 'Martwe drzewo' stoi w nieosiągalnym miejscu (50,2))
- pominięto 1 drobnych zamkniętych kieszeni (< 4 kratki, bez zdarzeń).

### Map175 Orla Grań

80x60, zestaw 11; sprawdzona nowa część (x >= 40 albo y >= 30; stara mapa 40x30).

![Map175](kontrola_Map175.png)

Brak problemów.

## Po etapie 2 (poprawki map agentów, 2026-10-22)

Narzędzie: `python tools/mapy/popraw.py plan` (plan + kopia robocza `tools/mapy/staging/`), `obrazy` (zrzuty przed / po), `instaluj` (zapis do `data/` tylko przy zamkniętym edytorze; operacje nakładane na plik z dysku w chwili zapisu, każda sprawdza starą wartość - zmiana z edytora zatrzymuje mapę). Kopie map sprzed poprawek: `Tawerna_archiwum_2026-10-18/dane_przed_poprawkami_map/`. Każda mapa sprawdzona kontrolą przed i po: po poprawce żadnych nowych problemów (wyjątek: martwa kratka za meblem, do 2 kratek, bez zdarzeń). Test dymny w grze (port 9564): każda poprawiona mapa wczytuje się bez błędów konsoli, przesunięte zdarzenia stoją na nowych miejscach (30/30).

Razem: **23 map poprawionych**, uwagi na mapach agentów 102 -> 14. Poprawki: D4 7, G1 7, O1 33, P2 11, P3 1, W1 1, ręcznie 2.

| mapa | nazwa | uwagi przed | po | operacji | zrzut |
|---|---|---|---|---|---|
| Map104 | Ratusz | 1 | 1 | 0 | [przed / po](poprawki_Map104.png) |
| Map105 | Dom kowala | 2 | 0 | 3 | [przed / po](poprawki_Map105.png) |
| Map106 | Dom garbarza | 3 | 0 | 7 | [przed / po](poprawki_Map106.png) |
| Map108 | Dzwonnica | 1 | 1 | 0 | [przed / po](poprawki_Map108.png) |
| Map109 | Dom mieszczan | 6 | 3 | 10 | [przed / po](poprawki_Map109.png) |
| Map110 | Izba pod skałą | 6 | 0 | 6 | [przed / po](poprawki_Map110.png) |
| Map113 | Chata drwala | 4 | 0 | 5 | [przed / po](poprawki_Map113.png) |
| Map114 | Chata kłusownika | 3 | 0 | 4 | [przed / po](poprawki_Map114.png) |
| Map115 | Izba znachorki | 7 | 1 | 7 | [przed / po](poprawki_Map115.png) |
| Map116 | Kram starzyzny | 4 | 0 | 7 | [przed / po](poprawki_Map116.png) |
| Map121 | Wspólna izba | 5 | 0 | 7 | [przed / po](poprawki_Map121.png) |
| Map122 | Chata tkaczki | 2 | 0 | 3 | [przed / po](poprawki_Map122.png) |
| Map123 | Chata Najstarszego | 1 | 0 | 5 | [przed / po](poprawki_Map123.png) |
| Map126 | Chata Janka | 2 | 1 | 1 | [przed / po](poprawki_Map126.png) |
| Map127 | Szopa przy pochylni | 4 | 0 | 6 | [przed / po](poprawki_Map127.png) |
| Map128 | Komora celna | 1 | 0 | 1 | [przed / po](poprawki_Map128.png) |
| Map160 | Izba latarnika | 2 | 0 | 5 | [przed / po](poprawki_Map160.png) |
| Map163 | Kwatera rotmistrza | 3 | 0 | 3 | [przed / po](poprawki_Map163.png) |
| Map166 | Wrak - pod pokładem | 7 | 0 | 9 | [przed / po](poprawki_Map166.png) |
| Map169 | Dom Ługów | 3 | 2 | 2 | [przed / po](poprawki_Map169.png) |
| Map171 | Piwnica kantoru | 3 | 1 | 5 | [przed / po](poprawki_Map171.png) |
| Map172 | Dwór - Hol | 8 | 0 | 6 | [przed / po](poprawki_Map172.png) |
| Map173 | Dwór - Biblioteka | 15 | 1 | 43 | [przed / po](poprawki_Map173.png) |
| Map176 | Komora pod menhirami | 4 | 2 | 2 | [przed / po](poprawki_Map176.png) |
| Map177 | Jaskinia przemytników | 5 | 1 | 4 | [przed / po](poprawki_Map177.png) |

### Zrzuty przed / po (mapy z największą liczbą uwag)

![Map173 przed i po](poprawki_Map173.png)

![Map172 przed i po](poprawki_Map172.png)

![Map115 przed i po](poprawki_Map115.png)

![Map109 przed i po](poprawki_Map109.png)

![Map110 przed i po](poprawki_Map110.png)

![Map166 przed i po](poprawki_Map166.png)

### Co zrobiono na każdej mapie

**Map104 Ratusz** (bez zmian)

- zostaje P2 (18,8): przesunięto zdarzenie 18 z (18,8) do (17,8): nowe problemy: P2(17,8)

**Map105 Dom kowala**

- P2 (3,7): przesunięto kafel 597 z (3,7) do (3,8) (1 px od krawędzi)
- P2 (4,8): przesunięto zdarzenie 14 z (4,8) do (4,7) (5 px od krawędzi)

**Map106 Dom garbarza**

- O1 (8,4): przesunięto obiekt C (7,7) 2 kafli o 1 w górę i dołożono dół
- P2 (12,7): przesunięto kafel 584 z (12,7) do (12,8) (3 px od krawędzi)

**Map108 Dzwonnica** (bez zmian)

- zostaje P3 (1,7): brak kandydatów

**Map109 Dom mieszczan**

- O1 (6,4): przesunięto obiekt C (5,7) 2 kafli o 1 w górę i dołożono dół
- O1 (10,4): przesunięto obiekt C (7,7) 2 kafli o 1 w górę i dołożono dół
- zostaje P2 (5,7): przesunięto kafel 596 z (5,7) do (4,6): nowe problemy: P2(4,6); przesunięto kafel 596 z (5,7) do (6,6): nowe problemy: P2(6,6)
- zostaje P2 (6,8): brak kandydatów

**Map110 Izba pod skałą**

- O1 (4,5): usunięto resztkę obiektu C (15,3) 1 kafli
- O1 (8,5): usunięto resztkę obiektu C (15,3) 1 kafli
- O1 (3,8): dołożono górę obiektu C (15,3) 1 kafli
- G1 (1,6): usunięto kafel 605 z gwiazdką
- G1 (10,6): usunięto kafel 605 z gwiazdką
- P3 (2,8): przesunięto zdarzenie 6 z (2,8) do (3,7) (2 px od krawędzi)

**Map113 Chata drwala**

- O1 (1,8): dołożono górę obiektu D (11,8) 2 kafli
- P2 (8,7): przesunięto kafel 597 z (8,7) do (8,8) (1 px od krawędzi)
- P2 (9,8): przesunięto zdarzenie 15 z (9,8) do (8,7) (5 px od krawędzi)

**Map114 Chata kłusownika**

- O1 (9,8): dołożono górę obiektu C (15,3) 1 kafli
- P2 (7,7): przesunięto kafel 576 z (7,7) do (7,8) (3 px od krawędzi)
- P2 (8,8): przesunięto zdarzenie 14 z (8,8) do (7,7) (5 px od krawędzi)

**Map115 Izba znachorki**

- O1 (1,3): dołożono górę obiektu E (14,1) 2 kafli
- O1 (2,4): dołożono dół obiektu C (7,7) 2 kafli
- G1 (4,4): kratka pod kaflem 581 zablokowana regionem 2 (RegionLayers: mebel stoi na niej)
- G1 (8,4): kratka pod kaflem 581 zablokowana regionem 2 (RegionLayers: mebel stoi na niej)
- P2 (2,7): przesunięto kafel 592 z (2,7) do (3,8) (6 px od krawędzi)
- P2 (2,8): przesunięto zdarzenie 16 z (2,8) do (2,7) (5 px od krawędzi)

**Map116 Kram starzyzny**

- O1 (3,3): usunięto resztkę obiektu C (5,8) 1 kafli
- O1 (3,4): przesunięto obiekt C (5,9) 1 kafli o 1 w górę i dołożono dół
- O1 (7,4): usunięto resztkę obiektu C (6,7) 2 kafli
- P2 (7,6): przesunięto zdarzenie 7 z (7,6) do (7,5) (5 px od krawędzi)

**Map121 Wspólna izba**

- O1 (1,4): przesunięto obiekt C (4,7) 2 kafli o 1 w górę i dołożono dół
- O1 (2,4): dołożono dół obiektu C (7,7) 2 kafli
- G1 (12,4): kratka pod kaflem 581 zablokowana regionem 2 (RegionLayers: mebel stoi na niej)

**Map122 Chata tkaczki**

- O1 (7,3): dołożono górę obiektu C (7,8) 1 kafli
- G1 (7,4): kratka pod kaflem 335 zablokowana regionem 2 (RegionLayers: mebel stoi na niej)

**Map123 Chata Najstarszego**

- O1 (13,4): przesunięto obiekt C (0,1) 2 kafli o 1 w górę i dołożono dół

**Map126 Chata Janka**

- G1 (3,4): kratka pod kaflem 595 zablokowana regionem 2 (RegionLayers: mebel stoi na niej)
- zostaje P2 (9,8): przesunięto zdarzenie 12 z (9,8) do (8,8): nowe problemy: P2(8,8)

**Map127 Szopa przy pochylni**

- O1 (8,2): przesunięto obiekt B (1,0) 1 kafli o 1 w górę i dołożono dół
- O1 (7,6): dołożono górę obiektu C (15,3) 1 kafli
- D4 (6,3): zdarzenie 4 'Mapa morska': priorytet 'jak postać' - akcja z sąsiedniej kratki
- D4 (10,4): niewidoczne zdarzenie 5 'Beczka smoły' przesunięte z (10,4) do (10,5) (przed nim da się stanąć)

**Map128 Komora celna**

- D4 (5,6): zdarzenie 6 'Księga celna': priorytet 'jak postać' - akcja z sąsiedniej kratki

**Map160 Izba latarnika**

- O1 (8,4): przesunięto obiekt C (7,7) 2 kafli o 1 w górę i dołożono dół

**Map163 Kwatera rotmistrza**

- D4 (4,3): zdarzenie 8 'Rozkazy garnizonu': priorytet 'jak postać' - akcja z sąsiedniej kratki
- D4 (6,3): zdarzenie 6 'Mapa Kruczej Wyspy': priorytet 'jak postać' - akcja z sąsiedniej kratki
- D4 (6,6): zdarzenie 10 'Lista zaginionych': priorytet 'jak postać' - akcja z sąsiedniej kratki

**Map166 Wrak - pod pokładem**

- O1 (2,1): przesunięto obiekt B (1,0) 1 kafli o 1 w górę i dołożono dół
- O1 (6,1): przesunięto obiekt B (1,0) 1 kafli o 1 w górę i dołożono dół
- O1 (10,3): dołożono dół obiektu D (13,3) 1 kafli
- O1 (20,7): dołożono dół obiektu D (13,3) 1 kafli
- W1 (20,10): zdarzenie 10 'Szkielet bosmana': <Occupy:right=1> - obraz nie wchodzi na wolną kratkę

**Map169 Dom Ługów**

- P2 (2,6): przesunięto kafel 597 z (2,6) do (2,7) (1 px od krawędzi)

**Map171 Piwnica kantoru**

- O1 (1,6): przesunięto obiekt D (13,3) 1 kafli o 1 w górę i dołożono dół
- D4 (15,3): niewidoczne zdarzenie 18 'Mapa Kruczej Wyspy' przesunięte z (15,3) do (14,3) (przed nim da się stanąć)

**Map172 Dwór - Hol**

- ręcznie: Hol: kamienie z krukiem (1,3) i (21,3) zasłaniała dolna połowa doniczki bez rośliny (kafel D(4,8) bez D(4,6..7)) -     usunięta (mały wazon pod nią zostaje); (9,3) i (13,3) zamykały kandelabry przy schodach - o kratkę niżej, symetrycznie.
- O1 (1,11): dołożono górę obiektu D (6,8) 1 kafli
- O1 (21,11): dołożono górę obiektu D (6,8) 1 kafli

**Map173 Dwór - Biblioteka**

- ręcznie: Biblioteka: dwa regały 4x2 (C(0..3,6..7)) bez dolnego rzędu stały na środku - bohater wchodził pod nie. Regały     stają pod tylną ścianą (rzędy 4-6) z dolnym rzędem C(0..3,8), przejście w rzędzie 7 zostaje wolne; kandelabr     spod lewego regału na (1,9), jak prawy na (15,9). Zdarzenia „Regały” (3,7) i (13,7) o rząd wyżej, przy regałach.

**Map176 Komora pod menhirami**

- O1 (4,8): dołożono górę obiektu C (11,9) 2 kafli
- O1 (15,8): dołożono górę obiektu C (11,9) 2 kafli
- zostaje O1 (3,4): decyzja: zostawione
- zostaje O1 (16,10): decyzja: zostawione

**Map177 Jaskinia przemytników**

- O1 (4,2): usunięto resztkę obiektu E (8,0) 1 kafli
- O1 (16,7): dołożono dół obiektu D (11,2) 1 kafli
- O1 (5,10): dołożono górę obiektu D (0,11) 1 kafli
- O1 (6,10): dołożono górę obiektu D (1,11) 1 kafli
- zostaje G3 (8,5): decyzja: zostawione

### Zostawione do decyzji użytkownika (mapy agentów)

- **Map104 Ratusz** (mapa użytkownika, świeca dodana przez agenta): świeca (zdarzenie 18) na przedniej krawędzi biurka; obok są globus i zwój - nie ma wolnego miejsca na blacie. Przesunąć coś na biurku albo usunąć świecę.
- **Map108 Dzwonnica**: świeca na podłodze przed małym biurkiem z księgą (1,7) - na biurku nie ma miejsca.
- **Map109 Dom mieszczan**: koszyk (kafel D(4,10)) za tylną krawędzią stołu i świeca na brzegu - stół pełny talerzy; rzecz na łóżku (13,5).
- **Map126 Chata Janka**: świeca na przedniej krawędzi stołu (9,8) - na górze stołu miska i dzban.
- **Map177 Jaskinia przemytników**: stół (zdarzenie 3) ma `<LudOff:24,0>`, ale Ludzie.js przesuwa obraz tylko zdarzeniom 2500-2699 - w grze stół jest narysowany o pół kratki w lewo i wchodzi na wolną kratkę (8,5). Do poprawy w Ludzie.js (nie ruszałem js/).
- **Map176 Komora pod menhirami**: urny E(6,13) bez dolnej części niszy - same na posadzce wyglądają dobrze, zostawione.
- **Map169, Map171, Map115**: pojedyncze martwe kratki za meblami (bez zdarzeń) - nie przeszkadzają.
- **Plenery (nowe części)**: polany zamknięte gęstym lasem (Map125 11 miejsc, Map168, Map013, Map111, Map024) - przecięcie ścieżki zmienia projekt mapy, więc do decyzji; miejsca tylko z orła (Okolice_Data.js) są celowo nieosiągalne; drzewa do zbierania w gęstym lesie zostają (informacja).
- Staging pakietów rozszerzeń (`tools/rozszerzenia/C/Map177.json`, `D/Map176.json`) ma układ sprzed poprawek - instalator pakietów zatrzyma go teraz kontrolą map (nowe uwagi względem data/).

## Do poprawy przez użytkownika (jego mapy - nie ruszane)

Map001 i mapy / części map robione przez użytkownika. Wypisane tylko błędy i uwagi (bez informacji).

### Map001 TAWERNA

![Map001](uzytkownik_Map001.png)

Razem: D1 25, D4 2, P2 27, Z2 7, Z3 4.

- **D1** nieosiągalne miejsce: 35 kratek od (90,5)
- **D1** nieosiągalne miejsce: 72 kratek od (21,8)
- **D1** nieosiągalne miejsce: 3 kratek od (41,8)
- **D1** nieosiągalne miejsce: 2 kratek od (45,8)
- **D1** nieosiągalne miejsce: 1 kratek od (49,8)
- **D1** nieosiągalne miejsce: 55 kratek od (65,8)
- **D1** nieosiągalne miejsce: 77 kratek od (73,8)
- **D1** nieosiągalne miejsce: 200 kratek od (29,9)
- **D1** nieosiągalne miejsce: 1 kratek od (13,10)
- **D1** nieosiągalne miejsce: 1 kratek od (29,11)
- **D1** nieosiągalne miejsce: 153 kratek od (9,12)
- **D1** nieosiągalne miejsce: 153 kratek od (91,12)
- **D1** nieosiągalne miejsce: 32 kratek od (37,20)
- **D1** nieosiągalne miejsce: 10 kratek od (49,20)
- **D1** nieosiągalne miejsce: 31 kratek od (54,20)
- **D1** nieosiągalne miejsce: 1 kratek od (50,27)
- **D1** nieosiągalne miejsce: 8 kratek od (45,28)
- **D1** nieosiągalne miejsce: 8 kratek od (51,28)
- **D1** nieosiągalne miejsce: 1 kratek od (3,38)
- **D1** nieosiągalne miejsce: 1 kratek od (15,38)
- **D1** nieosiągalne miejsce: 2 kratek od (55,40)
- **D1** nieosiągalne miejsce: 273 kratek od (4,43)
- **D1** nieosiągalne miejsce: 1 kratek od (25,43)
- **D1** nieosiągalne miejsce: 284 kratek od (66,43)
- **D1** nieosiągalne miejsce: 1 kratek od (70,53)
- ... i jeszcze 40 (`python tools/mapy/kontrola.py 1`)

### Map102 Piekarnia

![Map102](uzytkownik_Map102.png)

Razem: O1 3, P2 1.

- **O1** obiekt rozcięty: kafel 789 (E 5,2) - dół bez góry (brak kafla 781 nad) w (10,6)
- **O1** obiekt rozcięty: kafel 482 (C 10,12) - dół bez góry (brak kafla 474 nad) w (14,9)
- **O1** obiekt rozcięty: kafel 482 (C 10,12) - góra bez dołu (brak kafla 490 pod) w (14,9)
- **P2** zdarzenie 10 'gruba świeca z zaciekami (animowana)' (!Tavern_Props|1|2|0) stoi za blatem (nad jego tylną krawędzią): 7 px od płaskiego wierzchu w (12,7)

### Map103 Kantor

![Map103](uzytkownik_Map103.png)

Razem: P2 1.

- **P2** zdarzenie 5 'kasetka z monetami' (!Tavern_Props|1|6|0) stoi przed blatem (na jego przodzie / nogach): 7 px poza płaskim wierzchem w (14,7)

### Map104 Ratusz

![Map104](uzytkownik_Map104.png)

Razem: P2 1.

- **P2** zdarzenie 18 'Świeca' (!Decoration2|1|2|0) stoi na brzegu mebla (półprzezroczysty cień / rama) w (18,8)

### Map117 Dom uchodźców

![Map117](uzytkownik_Map117.png)

Razem: G1 2, O1 1.

- **G1** kafel 720 (D 8,10) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (3,6)
- **G1** kafel 608 (D 0,12) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (9,6)
- **O1** obiekt rozcięty: kafel 415 (C 15,3) - dół bez góry (brak kafla 407 nad) w (11,9)

### Map003 Kruczy Jar

![Map003](uzytkownik_Map003.png)

Razem: Z2 49.

- **Z2** obszary zdarzeń 70 'Wysoki suchy krzak', 122 'Splot gałęzi' nachodzą na kratce (6,17)
- **Z2** obszary zdarzeń 99 'Splot gałęzi', 122 'Splot gałęzi', 134 'Wysoki suchy krzak' nachodzą na kratce (7,17)
- **Z2** obszary zdarzeń 50 'Ruda żelaza', 97 'Wielki splot gałęzi' nachodzą na kratce (30,17)
- **Z2** obszary zdarzeń 71 'Splot gałęzi', 133 'Wysoki suchy krzak' nachodzą na kratce (5,18)
- **Z2** obszary zdarzeń 70 'Wysoki suchy krzak', 71 'Splot gałęzi', 72 'Wysoki suchy krzak' nachodzą na kratce (6,18)
- **Z2** obszary zdarzeń 72 'Wysoki suchy krzak', 134 'Wysoki suchy krzak' nachodzą na kratce (7,18)
- **Z2** obszary zdarzeń 59 'Ruda żelaza', 97 'Wielki splot gałęzi', 113 'Wysoki suchy krzak' nachodzą na kratce (29,18)
- **Z2** obszary zdarzeń 96 'Pęknięty kamień', 97 'Wielki splot gałęzi' nachodzą na kratce (31,18)
- **Z2** obszary zdarzeń 72 'Wysoki suchy krzak', 133 'Wysoki suchy krzak' nachodzą na kratce (6,19)
- **Z2** obszary zdarzeń 4 'Martwe drzewo', 72 'Wysoki suchy krzak' nachodzą na kratce (7,19)
- **Z2** obszary zdarzeń 56 'Splot gałęzi', 111 'Wielki splot gałęzi' nachodzą na kratce (28,19)
- **Z2** obszary zdarzeń 56 'Splot gałęzi', 111 'Wielki splot gałęzi', 113 'Wysoki suchy krzak' nachodzą na kratce (29,19)
- **Z2** obszary zdarzeń 77 'Sterta kamieni', 111 'Wielki splot gałęzi' nachodzą na kratce (30,19)
- **Z2** obszary zdarzeń 48 'Ruda żelaza', 91 'Skalna iglica' nachodzą na kratce (31,19)
- **Z2** obszary zdarzeń 45 'Ruda żelaza', 105 'Splot gałęzi' nachodzą na kratce (33,19)
- **Z2** obszary zdarzeń 66 'Ruda żelaza', 112 'Wielki splot gałęzi' nachodzą na kratce (27,20)
- **Z2** obszary zdarzeń 64 'Ruda żelaza', 66 'Ruda żelaza', 111 'Wielki splot gałęzi' nachodzą na kratce (28,20)
- **Z2** obszary zdarzeń 64 'Ruda żelaza', 111 'Wielki splot gałęzi' nachodzą na kratce (29,20)
- **Z2** obszary zdarzeń 108 'Splot gałęzi', 111 'Wielki splot gałęzi' nachodzą na kratce (30,20)
- **Z2** obszary zdarzeń 91 'Skalna iglica', 108 'Splot gałęzi' nachodzą na kratce (31,20)
- **Z2** obszary zdarzeń 80 'Kamienny kopiec', 115 'Wysoki suchy krzak' nachodzą na kratce (32,20)
- **Z2** obszary zdarzeń 79 'Kamienny kopiec', 106 'Splot gałęzi' nachodzą na kratce (35,20)
- **Z2** obszary zdarzeń 104 'Zasiek z gałęzi', 112 'Wielki splot gałęzi' nachodzą na kratce (27,21)
- **Z2** obszary zdarzeń 92 'Menhir', 104 'Zasiek z gałęzi', 112 'Wielki splot gałęzi' nachodzą na kratce (28,21)
- **Z2** obszary zdarzeń 93 'Stos płaskich kamieni', 104 'Zasiek z gałęzi' nachodzą na kratce (29,21)
- ... i jeszcze 24 (`python tools/mapy/kontrola.py 3`)

### Map004 Łąka#1

Brak uwag.

### Map008 Okolice Tawerny

![Map008](uzytkownik_Map008.png)

Razem: D1 11, D4 1, G3 2, G4 2, P2 1, P4 3, W1 1, Z3 2.

- **P4** kafel 716 (przechodni) na meblu 673: bohater wejdzie na mebel w (1,64)
- **P4** kafel 701 (przechodni) na meblu 675: bohater wejdzie na mebel w (28,64)
- **P4** kafel 697 (przechodni) na meblu 676: bohater wejdzie na mebel w (29,64)
- **D1** nieosiągalne miejsce: 33 kratek od (42,0)
- **D1** nieosiągalne miejsce: 6 kratek od (49,5)
- **D1** nieosiągalne miejsce: 46 kratek od (42,8)
- **D1** nieosiągalne miejsce: 8 kratek od (2,26)
- **D1** nieosiągalne miejsce: 8 kratek od (12,26)
- **D1** nieosiągalne miejsce: 11 kratek od (29,26)
- **D1** nieosiągalne miejsce: 8 kratek od (42,26)
- **D1** nieosiągalne miejsce: 8 kratek od (2,59)
- **D1** nieosiągalne miejsce: 10 kratek od (12,59)
- **D1** nieosiągalne miejsce: 11 kratek od (29,59)
- **D1** nieosiągalne miejsce: 8 kratek od (42,59)
- **D4** zdarzenie 142 'EV142' z akcją jest nieosiągalne - bohater musi stać na tej samej kratce (priorytet pod postacią) (6,48)
- **G3** obraz zdarzenia 126 'EV126' (!Town_Props|2|8|0) zajmuje 50% dołu wolnej kratki (47,30)
- **G3** obraz zdarzenia 244 'Brama zachodnia: skrzydło i cień' (!$West_Gate|0|4|1) zajmuje 100% dołu wolnej kratki (0,51)
- **G4** zdarzenie 244 'Brama zachodnia: skrzydło i cień' (!$West_Gate|0|4|1) rysowane pod postacią sięga kratki (0,50): bohater stanie na nim
- **G4** zdarzenie 244 'Brama zachodnia: skrzydło i cień' (!$West_Gate|0|4|1) rysowane pod postacią sięga kratki (1,50): bohater stanie na nim
- **P2** zdarzenie 105 'EV105' (!Decoration|7|4|0) wisi w powietrzu za meblem / nad nim (2 px nad jego pikselami) w (37,35)
- **W1** obraz zdarzenia 126 'EV126' (!Town_Props|2|8|0) zajmuje 50% dołu wolnej kratki (49,30): przejście węższe niż kratka
- **Z3** zdarzenie 223 'Chorągiew Lorda Zaleskiego' (!Flags_banner|0|4|1) stoi na meblu z kafli 181 (50,49)
- **Z3** zdarzenie 224 'Chorągiew Lorda Zaleskiego' (!Flags_banner|0|4|1) stoi na meblu z kafli 182 (51,49)

### Map013 Góry i kamieniołom

Brak uwag.

### Map023 Skraj lasu

Brak uwag.

### Map024 Posiadłość Lorda

![Map024](uzytkownik_Map024.png)

Razem: D1 5, G2 6, G5 2, O1 5.

- **D1** nieosiągalne miejsce: 6 kratek od (3,0)
- **D1** nieosiągalne miejsce: 5 kratek od (12,21)
- **D1** nieosiągalne miejsce: 5 kratek od (24,21)
- **D1** nieosiągalne miejsce: 5 kratek od (12,26)
- **D1** nieosiągalne miejsce: 5 kratek od (24,26)
- **G2** górny kafel 270 (C 6,1) obiektu bez gwiazdki na wolnej kratce: bohater stanie na nim w (12,14)
- **G2** górny kafel 270 (C 6,1) obiektu bez gwiazdki na wolnej kratce: bohater stanie na nim w (13,14)
- **G2** górny kafel 270 (C 6,1) obiektu bez gwiazdki na wolnej kratce: bohater stanie na nim w (14,14)
- **G2** górny kafel 270 (C 6,1) obiektu bez gwiazdki na wolnej kratce: bohater stanie na nim w (26,14)
- **G2** górny kafel 270 (C 6,1) obiektu bez gwiazdki na wolnej kratce: bohater stanie na nim w (27,14)
- **G2** górny kafel 270 (C 6,1) obiektu bez gwiazdki na wolnej kratce: bohater stanie na nim w (28,14)
- **G5** zdarzenie 68 'Dym z komina' (!Fantasy_chimney|0|2|0) 'nad postacią' stoi na wolnej kratce: bohater wejdzie pod nie (18,1)
- **G5** zdarzenie 69 'Dym z komina' (!Fantasy_chimney|0|2|0) 'nad postacią' stoi na wolnej kratce: bohater wejdzie pod nie (22,1)
- **O1** obiekt rozcięty: kafel 754 (D 10,14) - dół bez góry (brak kafla 746 nad) w (2,1)
- **O1** obiekt rozcięty: kafel 224 (B 8,12) - dół bez góry (brak kafla 216 nad) w (5,58)
- **O1** obiekt rozcięty: kafel 224 (B 8,12) - dół bez góry (brak kafla 216 nad) w (31,58)
- **O1** obiekt rozcięty: kafel 224 (B 8,12) - dół bez góry (brak kafla 216 nad) w (57,58)
- **O1** obiekt rozcięty: kafel 224 (B 8,12) - dół bez góry (brak kafla 216 nad) w (71,58)

### Map111 Podgrodzie

![Map111](uzytkownik_Map111.png)

Razem: D1 1, G1 19, G3 5, G4 2, G5 6, O1 10, P1 1.

- **D1** nieosiągalne miejsce: 4 kratek od (46,0)
- **G1** kafel 380 (C 4,15) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (42,3)
- **G1** kafel 202 (B 10,9) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (43,4)
- **G1** kafel 202 (B 10,9) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (28,5)
- **G1** kafel 210 (B 10,10) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (43,5)
- **G1** kafel 210 (B 10,10) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (28,6)
- **G1** kafel 218 (B 10,11) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (43,6)
- **G1** kafel 218 (B 10,11) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (28,7)
- **G1** kafel 226 (B 10,12) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (43,7)
- **G1** kafel 226 (B 10,12) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (28,8)
- **G1** kafel 381 (C 5,15) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (19,9)
- **G1** kafel 380 (C 4,15) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (35,9)
- **G1** kafel 210 (B 10,10) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (43,12)
- **G1** kafel 218 (B 10,11) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (43,13)
- **G1** kafel 226 (B 10,12) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (43,14)
- **G1** kafel 795 (E 3,3) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (30,18)
- **G1** kafel 803 (E 3,4) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (30,19)
- **G1** kafel 811 (E 3,5) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (30,20)
- **G1** kafel 381 (C 5,15) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (17,27)
- **G1** kafel 380 (C 4,15) z gwiazdką nad wolną kratką: bohater wchodzi pod niego w (18,27)
- **G3** obraz zdarzenia 23 'Posłanie' (!Town_Props|2|4|1) zajmuje 26% dołu wolnej kratki (43,7)
- **G3** obraz zdarzenia 26 'Posłanie pod daszkiem' (!Town_Props|2|4|1) zajmuje 26% dołu wolnej kratki (28,8)
- **G3** obraz zdarzenia 24 'Posłanie' (!Town_Props|2|4|1) zajmuje 26% dołu wolnej kratki (37,10)
- **G3** obraz zdarzenia 20 'Posłanie żebraka' (!Town_Props|2|4|1) zajmuje 26% dołu wolnej kratki (43,14)
- **G3** obraz zdarzenia 90 'Brama zachodnia: skrzydło i cień' (!$West_Gate|0|8|1) zajmuje 100% dołu wolnej kratki (45,18)
- ... i jeszcze 19 (`python tools/mapy/kontrola.py 111`)
