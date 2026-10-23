# Powiązania mapy 111 Podgrodzie (stan 2026-10-22, przed przebudową)

Spis wszystkiego, co jest przypięte do współrzędnych / numerów zdarzeń Map111 (92x112, tileset 11, 303 zdarzenia, max id 430,
notatka `<Clouds:on>` `<Farm:off>` `<BuildRegion:8>`). Regiony: 2 (378 pól, domy i mur), 3 (15 pól, sznury z praniem, daszki),
8 (240 pól = działka Chaty pod lasem x 15-34, y 38-49); regionu 31 brak. Stara część mapy (sprzed powiększenia): 46x56
(Okolice_Data OLD[111], tools/powieksz/stan.json). Ścieżki względne do katalogu projektu. Spis zrobił budowniczy nowego
Podgrodzia (tylko odczyt); nowe współrzędne każdego punktu: `tools/podgrodzie2/mapowanie.json` (c_miejsca.punkty_wtyczek).

## (A) Wtyczki

### A1. TownLife - mieszkańcy, miejsca
| Plik:linia | Co | Współrzędne / ID |
|---|---|---|
| TownLife_Data.js:322-490 | 8 mieszkańców z `map: 111` (praczka Marta, Franek, drwal Zbych, kłusownik Rysiek, znachorka Jadwiga, szmaciarz Józek, uchodźca Darin, żebrak Gaweł) | plany po kluczach miejsc: praczka_drzwi, pranie, plac, studnia_sucha, zabawa, kram, brama_zach, drwal_drzwi, drewutnia, skraj_lasu (kłusownik i drwal „inside” = znika w lesie), namioty, klusownik_drzwi, znachorka_drzwi, ziola, kapliczka, szmaciarz_drzwi, uchodzcy_drzwi, zebrak, zebrak_noc |
| TownLife_Data.js:266, 292, 308, 612 | W6 `alt: { map: 111, when: "campOutside" }` Ludmiła, Ela, Rafał, Marek | namioty, plac, kram, zabawa, drewutnia, skraj_lasu |
| TownLife_Data.js:940-1060 | NOWI mieszkańcy (agent mieszkańców, 2026-10-22): szynkarz 2950, opiekunka 2951, garncarz 2952, dziecko 2953; nieobecni, dopóki na mapie nie ma ich „Miejsce: <dom>_drzwi” | szynk_drzwi, przytulek_drzwi, garncarnia_drzwi, lepianka1_drzwi, placyk_1..6, szynk_lawy, przytulek_kociol, garncarnia_lawy, glinianka, wybieg + stare brama_zach, namioty, ziola, zebrak, zabawa |
| TownLife_Data.js:1062 | SPOTS_BY_MAP[111] = {} (miejsca tylko ze zdarzeń „Miejsce: <klucz>” mapy) | - |
| TownLife.js:146-158 | spotsFrom: zdarzenie „Miejsce: <klucz>” na mapie nadpisuje dane (kierunek z obrazka strony) | mechanizm przenosin |
| Map111 ev 70-88 | 19 zdarzeń „Miejsce:” | brama_zach 41,18 · zebrak 43,16 · zebrak_noc 43,14 · namioty 38,9 · uchodzcy_drzwi 32,9 · kram 26,15 · szmaciarz_drzwi 21,14 · plac 26,18 · studnia_sucha 23,18 · zabawa 20,18 · drwal_drzwi 7,9 · drewutnia 10,11 · skraj_lasu 0,19 · klusownik_drzwi 4,28 · znachorka_drzwi 15,27 · ziola 20,27 · kapliczka 26,24 · praczka_drzwi 33,27 · pranie 32,30 |
| Kantor_Data.js:349-355 | SPOTS_PODGRODZIE w5_lada (Ludmiła idzie do miasta przez bramę) | 44,17,6 (stara brama w połowie mapy) |

### A2. TownQuests (W6, K40-K46)
| Plik:linia | Co | Współrzędne / ID |
|---|---|---|
| TownQuests_Data.js:225-228 | rekwizyty W6 na mapie 111 (show w6Second) | namiot 903 41,7 · Bogdan 906 37,8 · Halina 907 41,10 |
| TownQuests.js:3769, 3775 | PODGRODZIE = 111 (w6Prop: „Out”) | - |
| TownQuests.js:4095-4100 | wilki nocą przy obozie: TownLife.spot("namioty"), gracz <= 14 kratek | wilki w losowych wolnych kratkach 7-12 od gracza |
| TownQuests_Data.js:1093-1230 | K40-K46 (praczka, znachorka, szmaciarz, uchodźca, drwal, kłusownik, Franek) | bez współrzędnych (dawcy z TownLife) |
| TownQuests_Data.js:2451-2478 | D20 (Zbych, Marta) | bez współrzędnych |

### A3. Okolice / Zasoby (paczka A6) / Ludzie
| Plik:linia | Co | Współrzędne / ID |
|---|---|---|
| Okolice_Data.js:86 | OLD[111] = [46, 56] (stara część; miejsca paczek w niej = błąd kontroli Okolice) | - |
| Okolice_Data.js:89 | ENTRY[111] = [23, 28] (start chodzenia kontroli, musi być przechodnie) | 23,28 |
| Okolice_Data.js:103 | TQ_SPOTS 111: A 951-953 (zarezerwowane, nieużywane) | - |
| Okolice_Data.js:133-137 | PLAN_SPOTS: ogrodek_1 55,10 4x3 · ogrodek_2 60,10 4x3 · ogrodek_3 65,8 4x3 · wysypisko 50,23 6x4 · glinianka 54,36 5x4 (mode reach) | - |
| Zasoby_Data.js:63 | IDS[111] = 2205-2224 | - |
| Zasoby_Data.js:160-163 | GARDENS (grządki = zdarzenia przechodnie) | ogrodek_1 2205-2208: 55,10 57,10 56,12 58,12 · ogrodek_2 2209-2212: 60,10 62,10 61,12 63,12 · ogrodek_3 2213-2216: 65,8 67,8 66,10 68,10 |
| Zasoby_Data.js:166 | DUMP 50,23 6x4, sterty 2217 52,25 (główna, Occupy l/r) · 2218 54,26 · 2219 50,23 | - |
| Zasoby_Data.js:169 | CLAYPIT 54,36 5x4, 2220 na 56,38 (Occupy l/r/up), puste 2221-2224 | - |
| Zasoby_Data.js:229-230 | odkrycia wysypisko 52,25 (near 2) · glinianka 56,38 (near 2) | - |
| Zasoby.js:393-407 | wstrzyknięcie zdarzeń 2205-2224 na mapę 111 | - |
| Zasoby.js:1418 | F9: Ogródki Podgrodzia 56,13 · Wysypisko 52,27 · Glinianka 56,40 | - |
| Zasoby_Data.js:200-235 | grzyby_krag1/2 są na mapie 17 (Omszała łąka), nie na 111 | - |
| Ludzie_Data.js:53 | MAP.podgrodzie = 111 (handlarz nie ma postoju na 111: CYCLE.stops = 22, 21, 4, 3) | - |

### A4. Homes, Garnizon, Underground, Wrak
| Plik:linia | Co | Współrzędne / ID |
|---|---|---|
| Homes.js:113, 120, 127-130 | Chata pod lasem: land 111, doorName /Chata pod lasem/ (ev 94 po NAZWIE), front [6, 41], wnętrze Map154 (4,8), BUILD_REGION 8 | drzwi ev94 6,40 · przed drzwiami 6,41 · działka region 8 x 15-34, y 38-49 |
| Homes.js:130, 548 | tekst „na samym dole, za lasem na końcu ścieżki od południowej drogi” | opis położenia do poprawy po przeniesieniu |
| Homes.js:323-337 | roleOf: zdarzenie mapy 111 o nazwie z „Chata pod lasem” = drzwi chaty (lista podmieniana) | po nazwie |
| Homes.js:639-650 | oczyszczenie działki przy zakupie: region 8 | region 8 |
| Garnizon_Data.js:39, 285 | PODGRODZIE = 111, PODGRODZIE_EVENTS (żołnierze D26) | 660 27,19 · 661 36,10 |
| Garnizon.js:544-550, 1039-1072 | wstrzykiwanie / pokazywanie żołnierzy | - |
| Underground_Data.js:728-731 | epilog „oboz” (w.camp === "outside") | kamera 38,11 · Ludmiła 37,11,6 · Ela 38,12,8 · Marek 39,11,4 · Rafał 41,12,4 |
| Wrak.js:60, 1058 | PODGRODZIE, RAID_MAPS zawiera 111 (losowe wolne kratki) | - |
| Wyspa_Data.js:36 | podgrodzie: 111 (nazwy map) | - |

### A5. Orzeł, krawędzie, regiony, motyle, F9
| Plik:linia | Co | Współrzędne |
|---|---|---|
| Orzel_Data.js:131 | TOWN_SQUARES[111] (lądowanie orła w osadzie) | ulica 1,18-41,20 · dolna ścieżka 2,27-28,31 · działka 15,38-34,49 |
| Orzel_Data.js:139 | SIDES[111] = { E: 8, W: 125 }; SIDES[8].W = 111; SIDES[125].E = 111 | - |
| Krawedzie.js | wyjście z krawędzi wg przejść na brzegu | ev 65/66 (91,17-18) wschód, ev 92 (0,19) zachód |
| RegionLayers.js | 1 pod / 2 blokuje / 3 nad | regiony 2/3 na domach, murze, praniu |
| Motyle_Data.js:75 | 111: „działka pod lasem”, region: true (motyle nad działką = region 8) | region 8 |
| Debug.js:155 | F9 „Chata pod lasem” | 111, 6,41, kier. 2 |

## (B) Przeniesienia na mapę 111 i z niej
| Mapa | Zdarzenie (pozycja) | Cel |
|---|---|---|
| Map008 Okolice Tawerny | ev237 (0,50) · ev238 (0,51) | 111: 90,17 / 90,18 kier. 4 |
| Map112 Chata praczki | ev10 (6,9) | 111: 33,27 kier. 2 |
| Map113 Chata drwala | ev7 (6,9) | 111: 7,9 |
| Map114 Chata kłusownika | ev8 (6,9) | 111: 4,28 |
| Map115 Izba znachorki | ev9 (6,9) | 111: 15,27 |
| Map116 Kram starzyzny | ev3 (7,9) | 111: 21,14 |
| Map117 Dom uchodźców | ev5 (8,10) | 111: 32,9 |
| Map125 Przystań | ev92 (111,19) | 111: 1,19 kier. 6 |
| Map154 Chata pod lasem (wnętrze) | ev7 (4,9) | 111: 6,41 kier. 2 |
| Map111 ev3 Drzwi: Chata drwala (7,8) | <Town:door=drwal>, 6-21 | -> Map113 6,8 |
| Map111 ev6 Drzwi: Kram starzyzny (21,13) | <Town:door=szmaciarz>, 6-21 | -> Map116 7,8 |
| Map111 ev8 Drzwi: Dom uchodźców (32,8) | <Town:door=uchodzcy>, zawsze | -> Map117 8,9 |
| Map111 ev11 Drzwi: Chata kłusownika (4,27) | <Town:door=klusownik>, 6-21 | -> Map114 6,8 |
| Map111 ev14 Drzwi: Izba znachorki (15,26) | <Town:door=znachorka>, 6-21 | -> Map115 6,8 |
| Map111 ev16 Drzwi: Chata praczki (33,26) | <Town:door=praczka>, 6-21 | -> Map112 6,8 |
| Map111 ev65 / ev66 (91,17 / 91,18) | Przejście -> Okolice Tawerny | -> Map008 1,50 / 1,51 kier. 6 |
| Map111 ev92 (0,19) | Przejście -> Przystań | -> Map125 110,19 kier. 4 |
Drzwi zamknięte (popup nad bohaterem): ev4 Chata pod strzechą (15,9), ev9 Chałupa z desek (13,17), ev12 Szopa (9,27), ev17 Komórka (39,25),
ev94 Chata pod lasem (6,40 „Na sprzedaż.”, po zakupie Homes podmienia listę). CommonEvents: brak. MapInfos: dzieci mapy 111 = 112-117, 154.

## (C) Testy i narzędzia
Testy z pozycjami mapy 111: podgrodzie_test (czyta `tools/podgrodzie/staging/Map111_meta.json` i Map112-117_meta.json - stary układ;
brama Map008 5,50 / 4,51 / 2,50; locate 41,17 · 43,18 · 25,19 · 9,12 · 34,30 · 39,12; SPOT_KEYS 19 kluczy; DOOR_NAMES 6 drzwi),
podgrodzie_life_test (1,1; kram z „Miejsce: kram”), podgrodzie_quests_test (26,17), field_loss_test (go 111 6,41,8; „92 x 112, <BuildRegion:8>”;
20,20; Farming.farm().buildings[111]), garnizon_test (go 111 10,12 · 26,18), wrak_test (go 111 20,20), ludzie_test (go 111 23,28),
w6_test (go 111 38,12; campOutside), przystan_test (newGame 111 2,19; powrót na 1,19), zasoby_test (GARDENS/DUMP/CLAYPIT z danych;
go 111 56,13 · 52,27 · 56,39), okolice_szkielet_test (MAPS z 111, PLAN_SPOTS), heart_test (e2.maps zawiera 111).
Narzędzia: tools/podgrodzie/* (stary generator 46x36 - NIE uruchamiać na żywej mapie), tools/domy/podgrodzie_zagroda.py, domy/build.py
(chata: front [6, 41], door_x 4), domy/domy.json + installed.json, domy/install.py (MapInfos 154 dziecko 111), newstart/layout.py
(EDGES: 8 0,50-51 <-> 111 91,17-18; 111 0,19 <-> 125 111,19), newstart/run_transfer_test.py, przystan/build.py + check.py + install.py
(wyjście 125 -> 111 1,19), interiors/install.py (zasady drzwi 6-21), powieksz/stan.json (111 old [46, 56]) + miejsca_okolic.json
(ogrodek_1-3, wysypisko, glinianka) + powieksz.py, mapy/popraw.py i przeglad.py (UZYTKOWNIKA zawiera 111), mapy/kontrola.py
(PRZEGLAD_POWIEKSZONE), pomiar_czasu/graf_przejsc.json + pomiar2.*, busts/make_*.py (tylko arkusze postaci).

## (D) Ważne zdarzenia Map111
| ID | Nazwa | x,y | Co robi |
|---|---|---|---|
| 3, 6, 8, 11, 14, 16 | Drzwi: <dom> z <Town:door=...> | patrz (B) | wejścia do Map112-117 (godziny 6-21, uchodźcy zawsze) |
| 4, 9, 12, 17 | Drzwi (zamknięte): Chata pod strzechą / Chałupa z desek / Szopa / Komórka | 15,9 · 13,17 · 9,27 · 39,25 | popup; dostają wnętrza Map209-212 |
| 94 | Drzwi (zamknięte): Chata pod lasem | 6,40 | Homes (po nazwie), front 6,41 |
| 65, 66 | Przejście -> Okolice Tawerny (brama zachodnia) | 91,17 · 91,18 | -> Map008 1,50/1,51 |
| 92 | Przejście -> Przystań | 0,19 | -> Map125 110,19 |
| 89, 90, 91 | Brama zachodnia: dach i słupy / skrzydło i cień / światło latarni (!$West_Gate) | 45,19 · 44,18 · 45,16 | obrazki drewnianej bramy (tools/town/west_gate_doors.py) |
| 18, 19 | Latarnia przy bramie / Pochodnia na baszcie (<Light> nocą) | 42,19 · 44,13 | światła = ogień |
| 25 | Ognisko uchodźców (<Light>) | 39,9 | ognisko obozu |
| 20-24, 26 | posłania, namioty (!Town_Props) | obóz 36-43, 5-10 | obóz uchodźców i żebraka |
| 27 | Sucha studnia (tekst) | 23,17 | studnia wyschła (woda tylko w mieście) |
| 67, 68, 69 | Drogowskaz / Obwieszczenie sołtysa / Kapliczka (teksty) | 40,15 · 29,15 · 26,23 | napisy |
| 1, 2, 5, 7, 10, 13, 15, 93 | dym z kominów, okienko w dachu | przy domach | ozdoby |
| 70-88 | Miejsce: <klucz> | patrz A1 | TownLife |
| 28-64, 95-430 | drzewa ozdobne starej części, zasoby nowego terenu (skały, krzaki, pnie, jabłonie, grusze) | cała mapa | w obrębie osady do usunięcia, poza palisadą zostają |
