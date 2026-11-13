# Potrzeby C - testy dotykajace tawerny (Map001/025/026/009)

Zakres: tests/*.js, tests/lib, tests/fixtures, tests/autopilot*, tools/*/test*.js. Badanie tylko do odczytu (grep + naglowki).
Uruchamianie: `node tools/serve.js` (serwer), potem `CDP_PORT=<port> node tests/<plik>.js`; staging przez `GAME_OVERLAY=<katalog z data/ itd.>` i `GAME_OVERLAY_JS=1` (podmienia tez index.html i js/*; kit: opts.overlay / overlayJs, docs/TESTY.md). Czasow w naglowkach nie ma (zwykle 1-4 min na test). Przy rownoleglym uruchomieniu nadac rozne CDP_PORT.

## A. Testy z twardymi wymiarami / wspolrzednymi / id (do przerobienia)

| Test | Port / overlay | Co twierdzi o tawernie | Co zmienic |
|---|---|---|---|
| tavern_interior_test | domyslny 9333; `GAME_OVERLAY=tools/tavern/staging/install_preview` | Map001 `w===101 && h===55`; LANDING (50,53) po wejsciu z Map008 zd.22; ROOMS_MAP (prostokaty podlog: Piekarnia, Wedzarnia, Pokoj sluzby, Gabinet Borgara, Magazyn...) kazdy osiagalny; cegla zd.9 -> Map009 (10,8), schody Map009 zd.1 -> Map001 (9,5); 6 zdarzen schodow (x 37..39, 61..63, 47) -> Map025 (48,62); schody w dol Map025 -> Map001 (61..63,53); Map026 laduje sie | caly plik: nowe w/h (~46x32), LANDING, ROOMS_MAP, schody, cegla |
| tavern_life_test | CDP_PORT=9384 | `map1.w===101 && map1.h===55` + dokladna lista tagow `<Tavern:..>` (`meal:1,mealtable:6,bath:4,stage:1,arm:1,darts:2,attendant...`); schody -> Map025 (48,62); drzwi komnaty (Map025), drzwi apartamentu (Map026), brama zlota Map025 -> Map026 | wymiary, liczba/rodzaje tagow, ladowisko, id drzwi komnaty, geometria bramy |
| tavern_plan_test | CDP_PORT=9386 | petla po mapach [1,25,26]: zdarzenie `<Tavern:plan>` (Map001 zd.349; Map025/026 zd.950 z wtyczki) na wolnych osiagalnych komorkach; zakladki, kursor, panel (nazwy sal), skala; brak sekretu/cegly/Map009 | id planu, nazwy sal, skala, czy Map025/026 maja plan |
| tavern_life_save_test | CDP_PORT=9406 | fixture tavern_evening; `KOMNATA_DOOR = 9` (Map025) | stala drzwi, fixture |
| goscie_sala_test | `GAME_OVERLAY=tools/tavern/siadanie/staging GAME_OVERLAY_JS=1 CDP_PORT=9413` | start `map:1 x:50 y:37`; okragle krzesla, nigdy dwoch na jednym, bez miejsc mieszkancow, koszt klatki | start (50,37) poza ~46x32; ew. twarde liczby gosci/krzesel |
| pokoje_test | `GAME_OVERLAY=tools/tavern/pokoje/staging GAME_OVERLAY_JS=1 CDP_PORT=9428` | start map 1 (50,35); kliny sasiedniej sali przez przejscie | start; lista map/sal w Pokoje.js (dane wtyczki) |
| pokoje_mapy_test | jak wyzej, CDP_PORT=9430 | start map 1 (50,35); wchodzi na kazde wnetrze (tez Map025/026/009) | tylko start |
| przytulna_test | `GAME_OVERLAY=tools/tavern/przytulna/overlay` | start map 1 (50,34); swiatlo, kominki, kufle, grajek, Borgar | start; wspolrzedne w danych Przytulna.js |
| tavern_dice_test | CDP_PORT=9380 | nowa gra w tawernie 19:00; zdarzenie `<Tavern:dice>` | tylko start i obecnosc stolu |
| tavern_shift_test | CDP_PORT=9350 | nowa gra w tawernie; bot gra zmiane klawiszami; powrot bohatera na stare miejsce | tylko start/lada Borgara |
| podroznicy_test | CDP_PORT=9761 | Map025: pokoj 23 Tobiasza przy kufrze (5,8), ladowisko (48,62); pokoje 1,2 nigdy; Konstanty pokoj 11 | wspolrzedne, numeracja pokoi |
| podroznicy_sprawy_test | wg naglowka | I2 podsluch: go(1,37,42), go(25,81,52), go(25,22,40); relacje sala->Jadalnia prywatna, korytarz->pokoj 12, pokoj 3->pokoj 5 | wspolrzedne i relacje scian/drzwi |
| intrygi_test | wg naglowka | pokoje 1,3,4,20 (kufer Zenona),23; go(25,17,49)(30,49)(35,40)(38,40)(38,42)(4,18)(74,23), go(9,4,11); krata zlota; sciana pokoju 1; piwnica | wspolrzedne, numery pokoi, krata |
| poselstwo_test (W14) | wg naglowka | pokoje 15 (Albin), 4 (Erazm, podsluch), "zloty" (Map026, taca/krata); go(25,45,27)(25,66,49)(25,90,18)(26,65,41) | wspolrzedne Map025/026, pokoje 15 i 4 |
| lancuchy_test (W15/W16) | wg naglowka | pokoj 12 (Gaspar, zd.3050 pod drzwiami), pokoj 5 (Tymon, 0:30); go(25,78,51,6) | wspolrzedne, pokoje 12 i 5 |
| w6_test | CDP_PORT=9463 | Rafal w pokoju 1 (Map025), miejsce 951, arkusz $Npc_Rafal, x=40,y=38; go(1,43,51)(1,52,31)(25,39,39) | (40,38) i ladowiska |
| act3_test | CDP_PORT=9470 | go(1,50,52,8); Borgar zd.1 i Grum zd.3 w srodku; fale do drzwi tawerny (51,17) na Map008 | punkt wejscia (50,52); id zd.1/3 |
| regulars_test | CDP_PORT=9463 | Map001 zd.2 Melia, 3 Grum, 4 Ozzy; start (74,31) | zachowac id 2-4; start |
| story_test | CDP_PORT=9350 | droga do tawerny, Story.borgarEvent(), piwnica Map009 | start, wejscie |
| w4_key_test / w4_borgar_test | 9463 / 9511 | krata Map009 (15,2); zd.540 Borgar, 541 kosz w piwnicy "16,3" | tylko jesli Map009 sie zmieni (zalozenie: bez zmian) |
| w9_rywal_test, underground_test | 9509 / wg naglowka | start Map009 (10,8) / (15,3); zapis w scianie (5,1) wraca do (10,8) | jak wyzej |
| minimap_test | wg naglowka | "wielka tawerna Map001 (101x55) ma minimape" | przy ~46x32 minimapa moze nie byc -> zmienic asercje lub inna duza mape |
| core_fixtures_test / _b2 | wg naglowka | fixture tavern_evening laduje sie na Map001 | fixture patrz B |
| autopilot_fabula/fab.js | patrz tests/autopilot_fabula/raport.md; MAP.tavern=1, cellar=9 | zd.52 lada Borgara (lub Story.borgarEvent()); luzna cegla 9,4 / ladowisko 9,5 | zd.52 i polozenie cegly; dluga jazda, poza minimalnym zestawem |
| tools/miasto3/test_faza1.js | | 4 trafienia Map001 (przejscia dziedziniec <-> drzwi) | prawdopodobnie tylko wejscia |
| ~30 pozostalych (act2_quests, w5, w7, w8, osada_huts, droga, region_layers, atmosphere, bubbles, zakon, wrak, przystan, ludzie, talk_busts, town_quests2, red_water, laka, meble_ruch, manor, home_life, fruit_tree, quest_places...) | rozne | po 1-3 trafienia: Map001 jako start / wejscie, bez wymiarow | po zmianie przejrzec grepem; zwykle nowy (x,y) |

## B. Fixtures
- tests/fixtures/tavern_evening.json (dzien 20, 19:00, Map001, reputacja 60; uzywany przez core_fixtures_test, core_fixtures_b2_test, quest_board_test, rozmowy_test, tavern_life_save_test, watki_test). Zapis ma stare (x,y) na Map001, po zmianie rozmiaru bohater moze stac w scianie. Regeneracja: tests/fixtures/make_fixtures.js, funkcja tavern_evening (asercja `map===1 && hour>=19 && reputation===60 && gold>=200`).
- Pozostale fixtures (dom dziadka, day40_farm, home_decor_v0) bez tawerny.
- kit go(map,x,y,dir) teleportuje wprost: zle wspolrzedne daja gracza w scianie bez bledu; zalecane szukanie zdarzen po nazwie/tagu zamiast liczb.

## C. Minimalny zestaw (na stagingu przez overlay)

| Cel | Test | Uwagi |
|---|---|---|
| mapy laduja sie bez bledow konsoli | tavern_interior_test (po przerobieniu) + pokoje_mapy_test | oba maja "no console errors"; pokoje_mapy_test chodzi po Map025/026/009 |
| sadzanie Goscie_Sala | goscie_sala_test | nowy start |
| zmiana od Borgara | tavern_shift_test | (story_test ma cala sciezke, ciezszy) |
| podroznicy dostaja pokoje | podroznicy_test + intrygi_test | z 12 pokojami numery 15, 20, 23 znikna: przemapowac w Podroznicy_Data/Intrygi_Data |
| W6 Rafal w pokoju | w6_test (ch4, pokoj 1, miejsce 951) | caly test dlugi |
| W14 Poselstwo | poselstwo_test | pokoje 15 i 4, "zloty" na Map026 |
| przejscie do piwnicy | tavern_interior_test (cegla zd.9 <-> Map009) + w4_key_test | Map009 bez zmian |
| oblezenie Akt III | act3_test | wejscie (50,52), zd.1/3 |
| dodatkowo | tavern_life_test, tavern_plan_test, minimap_test, core_fixtures_test | po regeneracji fixture |

Kolejnosc: (1) przerobic tavern_interior_test i fixture; (2) pokoje_mapy, goscie_sala, tavern_shift; (3) podroznicy, intrygi, w6, poselstwo, lancuchy, act3; (4) tavern_life/plan na koniec (najwiecej twardych liczb). Zgodnie z regula "mniej testow na zmiane": zbudowac wszystko, potem jeden przebieg.

## D. Ryzyka
- Numery pokoi w testach i danych: 1, 2, 3, 4, 5, 11, 12, 15, 20, 23 oraz komnata, suite1, zloty; jedno pietro z 12 pokojami wymaga przemapowania.
- Id zdarzen Map001 do zachowania: 1 Borgar, 2 Melia, 3 Grum, 4 Ozzy, 9 cegla, 52 lada, 349 plan, 950 plan na Map025/026, 951 miejsce Rafala, 3050 kurier.
- Map026 z 2 apartamentami: testy komnaty/Zlotego dzialaja, jesli brama Map025 -> Map026 zostaje.
