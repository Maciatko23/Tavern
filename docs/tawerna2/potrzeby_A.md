# Tawerna 2 - zależności wtyczek od Map001 / Map025 / Map026 / Map009 (wycinek A)

Stan odczytany 2026-11-08 z `js/plugins/*.js` i `data/Map001|009|025|026.json`. Tylko odczyt, nic nie zmieniono.
Skróty napraw: **PIN** = przestawić stałą w kodzie, **ID** = zachować numer zdarzenia, **NAME** = zachować nazwę zdarzenia, **TAG** = zachować tag w notatce/komentarzu, **REGEN** = przegenerować dane narzędziem, **NONE** = nie zależy.

## 0. Co dziś stoi w mapach (punkt odniesienia)

- **Mapy**: Map001 101x55, Map025 97x71, Map026 81x57, Map009 20x15 (tileset 10). Map001/025/026: **tileset 8** (wnętrza), BGM Town1.
- **Notatki map (zachować!)**:
  - Map001: `<Dust:off> <Dark:on> <DayNight:off> <DarkDay:30> <DarkNight:185> <LightEdges:soft>`
  - Map025, Map026: to samo bez `<LightEdges:soft>`.
  - Map009: `<Dust:on><Dark:on><DayNight:off><DarkDay:165><DarkNight:165><Ambience:cave><Hunt:off><Build:off><Farm:off><Minimap:off>`.
- **displayName**: „Tawerna”, „Pokoje gości”, „Apartamenty”, „Piwnica Tawerny” (te nazwy są też kluczami: `js/teksty/miejsca.txt` # 1/9/25/26, gotowe obrazki `img/nazwy_map`, `MapaWyspy_Data.js:44-45` `{1:[8,"Tawerna"], 9:[8,"Piwnica Tawerny"], 25:[8,"Pokoje gości"], 26:[8,"Apartamenty"]}`).
- **Zakresy id**: edytor zajmuje id < 500 (rejestr w `TawernaCore.js:598-653`, wtyczki wstrzykują od 500 w górę). Dziś Map001 ma id do 444, Map025 do 367, Map026 do 197. Nowe mapy muszą zostać w id < 500 (kolizja z `Orzel` 500-539, `Kasztelan` 540-559 itd.). Id **950** zajmuje `TavernLife_Plan` (sztaluga), **951** TownQuests (Rafał w Map025).
- **Przejścia istniejące** (dane map, potrzebne do przestawienia):
  - Map008 ev22 „Drzwi tawerny -> Tawerna” (51,16) -> **Map1 (50,53)**.
  - Map001 ev10-12 „Wyjście -> Kruczogród” (49..51,54) -> Map8 (50..52,17).
  - Map001 ev13-18 „Schody -> Pokoje gości” (37..39,47 i 61..63,47) -> **Map25 (48,62)**.
  - Map025 ev288-292 „Schody -> Tawerna (parter)” (46..50,65) -> Map1 (61,53) / (62,53) / (63,53).
  - Map025 ev293-297 „Schody -> Apartamenty” (90..94,6) -> Map26 (38..42,23).
  - Map026 ev159-163 „Schody -> Pokoje gości” (38..42,26) -> Map25 (90..94,17).
  - **Piwnica**: Map001 ev9 „Luźna cegła” (9,4) -> **Map9 (9,10)**; Map009 ev1 „Wejście do piwnicy” (9,8) i ev2 „Schody do tawerny” (9,7) -> **Map1 (9,5)**; Map010 ev1 -> Map9 (15,3) (Map009 zostaje, ten link bez zmian); Map009 ev7 „Stara krata zakonu (zejście)” (15,2) -> Map10 (3,7).

## 1. Tagi i nazwy zdarzeń, które kod CZYTA z map (to jest kontrakt)

Wszystko poniżej szuka po tagu/nazwie, nie po współrzędnych - wystarczy zostawić tag/nazwę i umieścić w nowym układzie.

| Tag / nazwa | Kto czyta | Co musi być w nowej mapie |
|---|---|---|
| `<Tavern:meal>` (Map001 ev38 (49,29), nazwa „Tavern:meal (zamówienie posiłku)”) | TavernLife.js:178, Kasztelan.js:296 (regex `<Tavern:meal[\s>]`, zamyka ladę w dniu zamknięcia) | 1 zdarzenie lada przed Borgarem |
| `<Tavern:mealtable dir=N plate=dx,dy lift=N>` (6 szt.: ev60,61,77,78,188,189) | TavernLife.js:179,816 (wolne miejsce przy stole) | min. kilka miejsc przy stołach; `plate=` w kratkach od krzesła |
| `<Tavern:bath [lift=34]>` (ev159,161,163,165) + `<Tavern:attendant>` „Łaziebna Wanda” (ev172, `<Bust:People1_6>`) | TavernLife.js:182,1246-1249 (szuka też po nazwie `/Łaziebn\|Wanda/i`) | balie + łaziebna (wycięcie łaźni z 46x32 = ubytek usługi, kod to przeżyje: brak tagu = brak usługi) |
| `<Tavern:stage>` (ev110 (74,33)) | TavernLife.js:184 pieśń Melii | miejsce słuchacza przed sceną |
| `<Tavern:dice>` (ev140 (86,31)) i `<Tavern:dice:grum>` (ev143 (92,31)) | TavernDice.js:613-632 (`/^dice(?::(\w+))?$/`), TavernLife_Plan ikony | stoły do kości; `:grum` ogranicza do Gruma |
| `<Tavern:arm>` (ev148 (94,32)) | TavernLife_ArmWrestle | stół siłowania |
| `<Tavern:darts>` (ev174 (84,48), ev176 (90,48)) | TavernLife_Darts | linia rzutu |
| `<Tavern:board>` (ev21 „Tablica zleceń” (43,49), `<Occupy:left=1,right=1>`) | QuestBoard.js:690 `isBoardEvent`, CleanHUD_Compass.js:218 (regex `/<Tavern:\s*board/i`), TownQuests.js:1825 (W6 plakat) | dokładnie jedna tablica zleceń; przycisk akcji (trigger<=2) |
| `<Tavern:plan>` (ev349 (45,49) `<Occupy:right=1>`, id 950 wstrzykiwany) | TavernLife_Plan.js:63-65,76 | patrz sekcja 3 (rozmiar mapy blokuje wstrzyknięcie) |
| `<Tavern:bed room=N price=P name="..." [minrep=R]>` | TavernLife.js:188, `roomMaps`=„25,26” (parametr w `js/tawerna_wtyczki.js`), `readTags` 951-966 czyta pliki Map025/Map026 przez XHR przy starcie | każdy wynajmowany pokój ma łóżko z tagiem |
| `<Tavern:door room=N>` (na obu stronach zdarzenia; strona 2 z warunkiem self-switch A) | TavernLife.js:189, 1074-1090 (ustawia self-switch `[mapId, eventId, "A"]`) | drzwi wynajmowanych pokoi |
| `<Tavern:candle room=N>` | TavernLife.js:193, TavernLife_Render.js:355 (dziura w ciemności, świeca) | opcjonalnie |
| `<Tavern:gate minrep=80>` (Map025 ev298 „Złota krata”, `<Occupy:left=2,right=2>`) | TavernLife.js:195, 955, 1096-1127 | krata do Apartamentów (zostaje, bo zostaje Złoty) |
| `<Tavern:bell>` (Map025 ev299 „Dzwonek na odźwiernego”) | TavernLife (rodzaj `bell`, tag w mapie) | opcjonalnie |
| Borgar / Melia / Grum / Ozzy = **ev 1,2,3,4** na Map001 (nazwy `^Borgar\b`, `^Melia\b`, `^Grum\b`, `/Ozzy/`; arkusze People3_Tall/4, People2_Tall/7, Actor2_Tall/4, People2_Tall/0; `<Bust:...>` w notatce) | TavernLife.js:500-519 (`npc()`), Story.js:488 (`roleOf`), CleanHUD_Compass.js:145, TownQuests.js:356,1102,1129 (`map===1 && id<100` = rozmówcy), Przytulna.js:236 (`d.id <= 8`, ev 1 = Borgar) | **zachować id 1-4 i nazwy**; ev 5-8 „Atmosfera - Borgar/Melia/Grum/Ozzy” (równoległe, kod je pomija `/^Atmosfera/`) tuż za nimi |
| `Miejsce: gosc_N` (Map001 ev53-59,62 = gosc_1..8) | TownLife.js:215-233 (gości z wpisem „tawerna” w planie dnia, kolejność), Wrak.js:629 (gosc_9) | tyle `Miejsce: gosc_N`, ilu mieszkańców ma „tawerna”; reszta z `SPOTS_BY_MAP[1]` (dziś tylko gosc_9) |
| `Miejsce: podrozny_1..6`, `kompania_1..4`, `grajek`, `medyk` (dziś **brak** w Map001) | Podroznicy.js:569-602 (skanuje `Map001.json` XHR + `wstaw`), Podroznicy_Data.js:34 | opcjonalnie; bez nich podróżni siedzą w pokojach |
| `Miejsce: pokoj_<n>` (Map025, dziś brak; fallback w kodzie) | Podroznicy_Data.js:57-70,538 (`SPOTS_BY_MAP[25]`) | opcjonalnie |
| Nazwy drzwi pokoi: `^(?:Drzwi\|Wejście) -> Pokój (\d+)$` (Map025) | Intrygi_Data.js:42 `DRZWI.re`, Intrygi.js:154 (drzwi zamknięte gdy gość mieszka) | **NAME**: drzwi gości dokładnie „Drzwi -> Pokój N” albo „Wejście -> Pokój N”; „Wyjście z pokoju”, „Drzwi (wyjście)” są pomijane |
| Nazwy `^Kufer` / `^Torba` (Map025) | Intrygi_Data.js:49 `SZUKANIE.rzeczy` + Intrygi.js:225-228 | kufer/torba w pokoju gościa (numer pokoju z planu, sekcja 3) |
| `^Kominek`, `^Świeca\|Latarnia\|Lampa\|Kaganek\|Pochodnia\|randol`, `^wypelnienie`, `Poswiata sali (Przytulna)`, `Świeca na stole` | Przytulna.js:100-113, 194 (tylko Map001, w prostokącie HALL) | NAME dla zdarzeń światła, jeśli Przytulna ma działać |
| `Gość stołowy (Przytulna)` ev **400-422** z `<Siedzi:Key>` w notatce | Goscie_Sala.js:37 `ID0=400, ID1=422`; Przytulna.js:236,340 | **ID**: 23 zdarzenia 400-422 (albo zmiana `ID0/ID1`); klucze `Siedzi:` z `SEATED_KEYS` (Przytulna.js:52) |
| `Grajek na scenie (Przytulna)` ev **360** (70,29) | Przytulna.js:49 `BARD_ID=360, BARD_X=70, BARD_Y=29` | ID 360 + PIN pozycji |
| `Stara krata zakonu (zejście)` (Map009 ev7) | Kasztelan.js:300, TownQuests.js:1630 | NAME (Map009 zostaje) |
| `Drzwi tawerny` (Map008, tylko po stronie miasta) | Kasztelan.js:301 | NAME na Map008 (nie dotyczy przebudowy) |

## 2. Stałe współrzędne w kodzie - Map001 (parter)

Wszystkie to **PIN** (przeliczyć do nowego układu ~46x32). Obecny układ: sala 37..83 x 27..44, lada y~28-31, wejście y=53-54.

| plik:linia | wartość | po co / co się stanie |
|---|---|---|
| TavernLife.js:1739-1753 | `ENTRANCE=[50,53,8]`, `TAVERN_LAYOUT=2` | stare zapisy w Map001 lądują na wejściu; PIN wejścia (lub podbić `TAVERN_LAYOUT` na 3 - wtedy WSZYSTKIE stare zapisy w tawernie przeniesie na wejście, co jest właściwe, bo stare koordynaty będą w ścianach) |
| Przytulna.js:47 | `HALL={x0:37,y0:27,x1:83,y1:44}` | prostokąt sali (światła, kominki, iskry, goście); poza nim kod nic nie robi |
| Przytulna.js:49 | `BARD_ID=360, BARD_X=70, BARD_Y=29` | grajek na scenie |
| Przytulna.js:65 | `BORGAR_HOME={52,28}`, `BORGAR_BAR={53,29}` | Borgar wyciera ladę; `at(BORGAR_HOME)` - jeśli Borgar (ev1) nie stoi w HOME, animacja się nie włączy (cicha utrata funkcji) |
| Przytulna.js:55, Goscie_Sala.js:39 | `TABLE_TILES=[416,424,432,439,447]` (warstwa 3), `TABLE_TILES2=[842,850,859,867,863,871,844,852]` (warstwa 2), `CHAIR=390` (warstwa 3) | krzesła i stoły rozpoznawane po **id kafli** - nowy układ musi używać tych samych kafli stołów/krzeseł, inaczej brak siedzących gości |
| Goscie_Sala.js:38 | `HALL={37,27,83,44}` | gdzie szukać krzeseł |
| Goscie_Sala.js:40 | `DOOR={50,52}`; `BAR=[[46,31],[48,31],[50,31],[52,31],[54,31],[56,31]]`; `STAGE=[[71,33],[73,33],[75,33],[77,33]]` | drzwi wejściowe, miejsca przy barze, pod sceną dla spacerujących gości; komórki muszą być przechodnie (filtr `free`) |
| Underground.js:1367 | `reserveTransfer(1,52,31,8)` (po zakończeniu zakończenia gry) | bohater przy barze |
| Underground_Data.js:668-674,727 | scena „tawerna”: `map:1, cam:[52,31]`, aktorzy borgar (52,28,2), ozzy (49,30,6), melia (55,30,4), grum (58,31,4), bohater (52,31,8), `heroIn [52,31,8]` | finałowa scena przy barze: PIN wszystkich |
| Kasztelan_Data.js:35 | `AT_BAR=[1,52,31,8]` (używane w ev. 180,185,187 harmonogramu bohatera) | PIN |
| Act3_Data.js:40-57 | `SPOTS[1]`: `door [9,14]`, `doorTile [9,13]` (= Map001 ev209 „Stare drzwi” (9,13), stare drzwi do piwnicy), `kitchen [[45,11],[47,11],[43,12],[49,12],[45,13],[41,12]]`, `front [[50,51],[49,51],[51,51],[50,50],[48,50],[52,50]]`, `guard [[10,16],[8,16],[11,17],[7,17]]`, `hall [[50,30],[47,31],[53,31]]`, `borgar [52,31]`, `entry [50,53]` | oblężenie (fale w3 „kitchen”, w4 „front” na Map1): wejście od kuchni, od frontu, obrona starych drzwi i hali. PIN wszystkiego; potrzebna kuchnia i tylne drzwi do piwnicy |
| Act3_Data.js:122 | `DOORS[1]` hp 100 (stare drzwi na Map1, ev209 po nazwie/polu `door`) | brak zmian poza PIN `door/doorTile` |
| Wrak_Data.js:60 | `SPOT_TAVERN=[61,33,4]` (gosc_9, wolny stołek prawego stołu) | PIN (Wrak.js:629 przestawia na gosc_N) |
| Poselstwo_Data.js:197 | `idz:[1,52,33,8]` (W14 poseł w sali, 19.6 h) | PIN |
| CleanHUD_Compass.js:147,165,218 | `TAVERN=1`, Borgar po nazwie, tablica po tagu | NONE (bez współrzędnych; liczy po zdarzeniach) |
| Journal.js:287, Story.js:249 | cele `{map:1,name:"Tawerna"}` (bez x,y) | NONE |
| Dezerter.js:157-170 | wejście łowczyni w sali (Map1): `dist(sz,hero)<=12`, `TavernLife.npc` | NONE (po zdarzeniach), ale „12 kratek” musi pasować do mniejszej sali |

## 3. TavernLife_Plan.js - największy blok do przegenerowania (REGEN)

- `PLAN_DATA` (linia 59, jedna linia JSON, generowana przez `tools/tavern/plan/make_plan.py`; **nie edytować ręcznie**) zawiera **3 piętra**: map 1 (w101,h55), 25 (w97,h71), 26 (w81,h57) - dla każdego: `rooms` (prostokąty `r`, klucze `k`/`g`, typ `t`), `icons` (bar, kitchen, board, dice, arm, darts, bath, stage, fire, stairs, room, gate), `exits` (`"8"`: wyjścia na miasto; `"25"`...: schody), `arrive` (gdzie lądujesz z innego piętra), `walk` (bitmapa przechodniości base64 w x h), `s/ox/oy` (skala rysunku). Obrazy: `img/pictures/TavernPlan_0.png`, `_1`, `_2`, `TavernPlan_Back.png`; sztalugi `img/characters/!$Tavern_Plan.png`, `!$Tavern_Plan_Small.png` (make_board.py).
- **Klucze pokoi w planie są kontraktem dla innych wtyczek**: Intrygi.js:89-95 (`numerPokoju` = `/^r(\d+)$/` na kluczu pokoju planu, szuka po prostokątach `r` - to jedyny sposób, w jaki „Kufer/Torba” i podsłuch wiedzą, w którym pokoju stoją) oraz `planInfo` Intrygi.js:145 (`[1,25,26][floor]`, `key r<N>`, Map026 klucz `s4` = „zloty”). Nowy PLAN_DATA **musi** mieć pokoje gości jako `r<N>` i Złoty jako `26:s4`.
- Przełączniki w `planInfo` (TavernLife_Plan.js:215-310) po kluczach: `1:sala 1:kuchnia 1:scena 1:gry 1:rzutki 1:laznia 1:mysliwski 1:jadalnia 1:sien`, `25:chamber 25:r1 25:r2 25:r3 26:s4 25:schody_gora 26:lord`, `/^25:r\d+$/`. Pokój o kluczu nieobsłużonym dostaje tekst domyślny (nie wywala). Teksty: `js/teksty/plan_karczmy.txt` `opisy.1.*`, `opisy.25.*`, `opisy.26.*` (klucze pokoi tam też; brak wpisu = brak opisu, nie błąd).
- `PLAN_BOARDS` (linie 62-66): sztaluga wstrzykiwana tylko gdy `data.width/height` = **{1: 101x84, 25: 97x71, 26: 81x57}** (!). Map001 ma już 55 wierszy (nie 84), więc wstrzyknięcie na Map001 i tak nie działa - sztaluga jest ręczna (ev349, tag `<Tavern:plan>`). Po przebudowie: albo zostawić ręczne zdarzenie z tagiem na każdej z 3 map (kod wtedy nie wstrzykuje drugiej: linie 83-84), albo PIN `w/h` i komórek: `1: x46,y78 (cells 45-47,78)`, `25: x53,y61 (cell 53,61)`, `26: x44,y23 (cell 44,23)`. Id **950** zarezerwowane.
- Połączenia pięter: `PLAN_DATA.floors[0].exits["25"]` = [[37..39,47],[61..63,47]], `arrive["25"]=[61,53]`; piętro 25: `exits["1"]` [[46..50,65]], `arrive["1"]=[48,62]`, `exits["26"]` [[90..94,6]], `arrive["26"]=[90,17]`; piętro 26: `exits["25"]` [[38..42,26]], `arrive["25"]=[38,23]`. To wyznacza „drogę” (planWay BFS po `walk`).
- Pokoje Map025 w planie dziś (klucz: prostokąt `[x0,y0,x1,y1]`, typ): r1 [35,34,41,44] guest, r2 [55,34,61,44] guest, r3 [22,34,33,44] guest, chamber [59,1,76,12] guest (komnata), r4 [63,34,74,44], r5 [11,34,20,44], r6 [76,34,85,44], r7 [1,34,9,44], r8 [87,34,95,44], r9 [27,54,38,65], r10 [58,54,69,65], r11 [14,54,25,65], r12 [71,54,82,65], r13 [1,54,12,67], r14 [84,54,95,67], r15 [35,22,41,32], r16 [55,22,61,32], r17 [63,22,71,32], r18 [73,22,83,32], r19 [85,22,95,32], r20 [27,1,37,12], r21 [19,3,25,12], r22 [9,1,17,12], r23 [1,3,7,12], r24 [78,1,87,12]; plus nc, sc, gal, hall, lounge, bath, linen, maid, schody_dol [46,63,50,68], schody_gora [90,5,94,16]. Map026: s4a/s4b (grupa `s4` = Złoty) [61,32,68,46]+[70,32,79,46], lorda/lordb (grupa `lord`) [33,1,47,15]+[22,1,31,15], hall, schody_dol [38,24,42,29] itd.

## 4. Pokoje gości (Map025) - numery pokoi używane w kodzie

Dziś pokoje 1-24 (+ „komnata”). Hero: **1, 2, 3** (`<Tavern:bed room=1|2|3>`, ceny 8/15/20 z parametru `roomPrices`), **komnata** (`room=komnata price=30 minrep=60`, nagroda `RESTED.komnata=8`), Apartament Złoty (**Map026**, `room=zloty price=50 minrep=80`, `RESTED.zloty=12`, `BREAKFAST_IN_BED.zloty`). Pokoje 4-24 = dla podróżnych (księga gości Podroznicy).

Mapa Map025 -> kto (po numerze pokoju) - po zmianie na 12 pokoi trzeba **przenumerować i zaktualizować wszystkie poniższe**:

| Numer | Konsument | plik:linia |
|---|---|---|
| 1,2 | pokoje gracza (`POKOJE_BOHATERA`), `POKOJ_RAFALA=1` (W6 Rafał ukryty), TavernLife gifts | Podroznicy_Data.js:73-75; TavernLife.js:~943 `GIFTS` |
| 3 | pokój gracza „furtka” (tylko z bramką), **trójka** (`pokoj:3`, D45), drzwi + dziurka od klucza, sadza przy drzwiach `D45.sadza=[25,29,49]`, podsłuch „d45Liczby” pokój 3; `LIST_GDZIE[3]=[25,28,44]` | Podroznicy_Data.js:121; Intrygi_Data.js:70,79; Intrygi.js:692 |
| 4 | **poborca** (`pokoj:4`), D44 podsłuch pokoju 4, Feliks pod drzwiami (68,49) 22.67-23.34h, wall 23-24h | Podroznicy_Data.js:115; Podroznicy5.js:305; Podroznicy5_Data.js:50 |
| 5 | **dezerter** Tymon, **Szczerba** noc u drzwi pokoju 5 (`przed [16,49,8]`, drzwi (16,48)), podsłuch „w16Sen”; Dezerter_Data idz `[25,14,40,8]`, `[25,18,51,4]` | Dezerter_Data.js:51,218-219; Dezerter.js:316,418 |
| 6 | **łowczyni** Szczerba (rezydent), `miejsce [84,42,2]` | Podroznicy_Data.js:109 |
| 7 | Eryk Sowa, rozbitek (`POKOJ_ERYKA=7`, `SPOT_ROOMS=[6,38,4]`, Map025 `rozbitek_wnetrze`) | Podroznicy_Data.js:74; Wrak_Data.js:61,80 |
| 9,10 | **Kompania** (4 postaci: pokoje [9,9,10,10]) | Podroznicy_Data.js:111 |
| 11 | **medyk** | Podroznicy_Data.js:93 |
| 12 | **relikwie** Gaspar (`pokoj:12`), W15: `PRZESZUKANIA w15Skrzynka`, kurier Baltazara ev3050 przed drzwiami pokoju 12 `KURIER=(81,52)` (drzwi (81,53)), podsłuch „w15Kurier” | SwieteKosci_Data.js:52; Intrygi_Data.js:73; SwieteKosci.js:305 |
| 15 | **pielgrzym** Albin, W14: podsłuch okna pokój 15, `PRZESZUKANIA` torba/kufer pokój 15, krok Albina start [41,24,8] trasa [[41,22],[44,19],[70,18],[88,18],[92,17]], wosk ev3073 (45,25), krata ev3074 (91,17), `idz [25,45,27,8]` | Poselstwo.js:473-499; Poselstwo_Data.js:58-59,200 |
| 16 | **wizytator** | Podroznicy_Data.js:103 |
| 17 | **grajek** (bard-podróżny, D41) | Podroznicy_Data.js:113 |
| 18 | **Ksenia** (D46), `PRZESZUKANIA d46Pokoj` pokój 18, domyślny podsłuch „d46Ksenia” | Podroznicy_Data.js:101; Intrygi_Data.js:75; Intrygi.js:694 |
| 20 | **zboże** (D42), `PRZESZUKANIA d42Umowa` pokój 20 | Podroznicy_Data.js:95; Intrygi_Data.js:74 |
| 21 | **Urszula** (D43) | Podroznicy_Data.js:105 |
| 22 | **kartograf** (D40), `PRZESZUKANIA d48Tuba` pokój 22 (Podroznicy5.js:312) | Podroznicy_Data.js:99 |
| 23 | **Tobiasz** goniec (K71/K72) | Podroznicy_Data.js:90 |
| 24 | używany tylko w tabeli `POKOJE` (miejsce [106,70,2] - i tak poza mapą 97x71, błąd istniejący) | Podroznicy_Data.js:69 |

**Tabela `POKOJE`** (Podroznicy_Data.js:62-70): numery 4-24 z `typ` ("1-os."=8 G, "2-os."=15 G, "rodzinny"=20 G w `CENY`) i `miejsce [x,y,dir]` (gdzie siedzi gość „u siebie” - generuje `tools/podroznicy/miejsca_pokoi.py` z kufra/świecy). Używana: Podroznicy.js:110-125,216,435,501 (`D.POKOJE[room]`, przydział pokoju najbliższego numerem i typem), Podroznicy_Data.js:538 -> `TownLifeData.SPOTS_BY_MAP[25]["pokoj_<n>"]` i `"pokoj_<n>_2"`. **Fix**: nowa tabela `POKOJE` na 12 pokoi (REGEN `miejsca_pokoi.py`) i przenumerowanie `pokoj:` w `OBSADA`, `PRZESZUKANIA`, podsłuchów (`podsluch.dodaj ... pokoj:"N"`), D45/D46/D44/W14/W15/W16 jw. Gdy numer nie istnieje w `POKOJE`, `Podroznicy.js:123-125` wybiera najbliższy wolny (łagodnie), ale podsłuch/przeszukanie/drzwi dla nieistniejącego numeru po prostu nie zadziałają.

Stałe współrzędne Map025 w kodzie (PIN, jeśli Map025 zostaje jako piętro gości):
- Intrygi_Data.js:57-61 `KROCZACY` (nocny chodzący): start Ozzy [20,49,6] i Tymon [16,49,6], trasa [[44,50],[48,56],[48,62]] (do schodów w dół (46..50,65)); Intrygi.js:756 `PIETRO=["Piętro gości",25,48,49,8]` (F9 debug); Intrygi_Data.js:70 `LIST_GDZIE` (list pod drzwiami: pokoje 1/2/3 [25,38,44],[25,58,44],[25,28,44], komnata [25,67,12]); Intrygi_Data.js:79 `D45.sadza=[25,29,49]`.
- Podroznicy5_Data.js:169-172 `idz` na piętro: [25,61,40,6], [25,67,41,8], [25,32,60,4], [25,13,9,8]; Dezerter_Data.js:218-219 [25,14,40,8], [25,18,51,4]; Poselstwo_Data.js:200 [25,45,27,8]; SwieteKosci_Data.js:223 [25,74,50,6].
- TownQuests_Data.js:230 `w6_hide_tavern` {map:25, id:951, x:40, y:38} (Rafał ukryty w pokoju 1; musi leżeć w pokoju 1 lub zmienić); TownQuests.js:2078 `ROOMS=25`, 3379 podsłuch cienkiej ściany W8 (`mapId===25`, `rentedRoom`, 22-24h) - działa gdy pokój wynajęty na tej mapie.
- Podroznicy5.js:204, Poselstwo.js:426, Podroznicy_Sprawy.js:297,357 `m!==1&&m!==25&&m!==26` - tylko lista numerów map, NONE jeśli te mapy zostają (id 1/25/26 ten sam).
- Wyspa_Data.js:36 `{tawerna:1, pokojeGosci:25}` - tylko nazwy w tabeli (nieużywane przez `.pokojeGosci`), NONE.
- Zakon.js:227,236 `TK.kod.buildMap[25]/[26]` - to indeksy w tabeli tekstów, NIE numery map (false positive).

## 5. Apartamenty (Map026) - „tylko Złoty + Lorda”

Dziś (do wycięcia): apartamenty Różany (`room=suite1`), Błękitny (`suite2`), Zielony (`suite3`), Biblioteka, Wielki salon, Jadalnia, Taras, Kącik służby.
Zachować:
- **Apartament Złoty**: `<Tavern:bed room=zloty price=50 minrep=80>` (ev103 (74,35)), `<Tavern:candle room=zloty>` (ev94), `<Tavern:door room=zloty>` na „Wejście -> Apartament Złoty — salonik” (ev21 (67,31)); w planie klucz `26:s4`.
- **Apartament Lorda**: drzwi `<Tavern:door room=lordsuite>` (ev3 (24,19) sypialnia, ev5 (40,19) salon); w planie grupa `26:lord`, `case "26:lord"` TavernLife_Plan.js:305 (zawsze „zajęty”).
- Id zdarzeń drzwi (self-switch A w zapisach gry!): Map026 ev1,3,5,9,11,21 = suite1, lordsuite, lordsuite, suite2, suite3, zloty. Zapisy trzymają `[26, eventId, "A"]` - przy nowych id stary stan jest sierocy (bez szkody, ale warto zachować id 3,5,21 i 103, 94).
- Poselstwo (W14) w Map026: `Poselstwo_Data.js:55-57` Lord ev3070 (32,40,dir4), Feliks ev3071 (30,43), Albin ev3072 (65,29); `MIEJSCA` `posel_wnetrze [65,40,4]`, `gwardzista_wnetrze [66,30,2]`; `idz` [26,41,40,4] (narada), [26,62,28,6] (kradzież), [26,64,29,2] (list); w Intrygi.js:474-480 wstrzykuje list na Map026; TavernLife Złoty `zlotyList` czytany z Map026 (Intrygi.js:420 „by its bed”). W14 „Narada” w Wielkim salonie (`podsluch.dodaj ... mapa:26, pokoj:"salon"`, Poselstwo.js:475) - **wycięcie Wielkiego salonu i Jadalni łamie W14** (potrzebny „salon” w Apartamencie Lorda albo przestawienie na salon Lorda; to decyzja fabularna).
- Schody Map026 <-> Map025: Map026 ev159-163 (38..42,26) -> Map25 (90..94,17); Map025 ev293-297 (90..94,6) -> Map26 (38..42,23). PLAN `arrive` jw.

## 6. Piwnica (Map009 zostaje) - łącza z nową Map001

- 3 przejścia do przestawienia przy nowej Map001: **Map001 ev9 „Luźna cegła”** (nowa pozycja w ścianie; self-switch A tego zdarzenia + warunek zmiennej 1 >= 1 - stan z rozmowy z Borgarem), **Map009 ev1 i ev2 -> (1,9,5)** (nowy punkt lądowania), **Map001 ev209 „Stare drzwi”** (9,13) i Act3_Data `SPOTS[1].door [9,14] / doorTile [9,13]` (stare drzwi do piwnicy, oblężenie).
- Journal.js:287: cel „cellar” kończy `$gameSelfSwitches.value([9,1,"A"])` = self-switch A zdarzenia **Map009 ev1** (zostaje, bo Map009 bez zmian). Story.js:1123 `step("cellar")` przy wejściu na Map9.
- Underground.js:300 `{[cellar]: [10,8]}` (stopień piwnicy), Underground_Data.js:57 `cellarGate [15,3,8]` (Map009) - **NONE**.
- Kasztelan_Data.js:184,189 `[9,15,3,8]`, `[9,14,4,6]` - Map009, NONE.

## 7. Lekkie/automatyczne (NONE, ale warto wiedzieć)

- **Pokoje.js** (zasięg widzenia): `tilesetId === 8` i brak `<Widok:off>`; ściany z warstw kafli, bez współrzędnych. Nowe mapy muszą zostać na **tileset 8**. **Cienie.js**, **Widok.js**: `INDOOR_SETS=[8,10,12]` - też tylko tileset.
- **Atmosphere.js**:153,191 `tavernMaps="1"` (parametr w `tawerna_wtyczki.js`) - tylko Map001 dostaje profil `tavern` (szum ludzi 28%); Map025/026 `interior`. Nowa Map001 zachowuje id 1 -> OK. Można dodać `<Ambience:tavern>` do Map025/026.
- **RoomLighting.js**: światła z notatek zdarzeń (`<Light:..>`, `<LightWhen:night>`, `<LightSoft>`, `<LightCone:...>`), `<LightEdges:soft>` w notatce Map001 - nic o numerach map.
- **Mood.js / Sky.js / DayNightCycle.js / Minimap.js / MenuRing*.js / CleanHUD.js**: brak odniesień do Map001/025/026 (profil wnętrza z tilesetu i `<Dark:on>`). Nazwa mapy z `img/nazwy_map` po `displayName` (zachować nazwy lub przegenerować `tools/nazwa_mapy/obrazki.js`).
- **TavernShift*.js** (zmiana u Borgara) i **TavernDice*.js**: własne sceny rysowane (tileset 3 „Wewnątrz”, `TILESET_ID=3`, kafle 6272+ itd. TavernShift_Hall.js:44-300) - NIE czytają Map001; TavernDice tylko tagi `<Tavern:dice[:grum]>`.
- **Farming*.js**: bez odniesień do 1/25/26 (domyślnie `<Dark:on>` = bez pól; budowa tylko mapa 3/100).
- **Ludzie*.js, TownLife_Data.js**: bez odniesień do tych map poza `SPOTS_BY_MAP` z innych wtyczek (Wrak gosc_9 -> Map1, Podroznicy pokoj_N -> Map25, Poselstwo -> Map26) oraz `TownLife_Data.js:36` `tawerna:[51,17,8]` i `przed_tawerna:[58,19,2]` = **Map008** (przed drzwiami tawerny od strony miasta, nie dotyczy wnętrza).
- **Regiony**: wtyczki tawerny nie używają regionów w tych mapach (brak `regionId` w TavernLife*, Przytulna, Goscie_Sala, Pokoje, RoomLighting, Cienie). Jedynie gdy `RegionLayers.js` miałby coś robić w tileset 8 - nie sprawdzano (poza wycinkiem).
- **Zapisy gry (save-compat)**: stan pokoi/bram zapisany po kluczach `"<mapId>:<eventId>"` (`gateKey`, `s.gates`) i `[mapId,eventId,"A"]` (self-switche drzwi) - przy zmianie id zdarzeń stare zapisy tracą otwarcie bramy/drzwi (bezpiecznie, odtworzy się). `TavernLife` `layout` (TAVERN_LAYOUT) przenosi na wejście zapisy z innej wersji układu parteru.

## 8. Warunki, których kod wymaga od nowego pokoju gracza (TavernLife.floorOf)

TavernLife.js:1050-1070 znajduje podłogę pokoju BFS-em od łóżka (`<Tavern:bed>`) po przechodnich kratkach, **do 120 kratek**, zatrzymując się na kratkach drzwi (`<Tavern:door>`); jeśli pokój nie jest zamknięty ścianami (>=120), traktowany jako „hala” i `playerInside` używa promienia 7 kratek od łóżka. Pokoje muszą więc być zamknięte ścianami z drzwiami opisanymi tagiem, a łóżko wewnątrz (`<Occupy:right=1,down=1>` dla podwójnych).

## 9. Lista kontrolna „co przestawić / zachować” (skrót)

1. **ID/NAME/TAG zachować**: ev1-4 (Borgar, Melia, Grum, Ozzy) + ev5-8 Atmosfera; ev9 Luźna cegła; tagi `Tavern:*` (sekcja 1); ev360 grajek; ev400-422 goście stołowi (`<Siedzi:Key>`); `Drzwi -> Pokój N`/`Wejście -> Pokój N`; Kufer/Torba; Map026: ev3,5,21,94,103; Map025: ev298 krata, ev299 dzwonek; id 950 i 951 zarezerwowane.
2. **Kafle stołów/krzeseł**: warstwa 3 `416,424,432,439,447` i krzesło `390`; warstwa 2 `842,850,859,867,863,871,844,852` (Goscie_Sala + Przytulna).
3. **PIN współrzędnych**: sekcje 2, 4, 5, 6 (Przytulna HALL/BARD/BORGAR, Goscie_Sala DOOR/BAR/STAGE, ENTRANCE, Underground ending + reserveTransfer, Kasztelan AT_BAR, Act3 SPOTS[1], Wrak SPOT_TAVERN, Poselstwo idz, Podroznicy5/Dezerter/SwieteKosci idz, KURIER, Intrygi KROCZACY/LIST_GDZIE/D45.sadza, TownQuests w6_hide_tavern).
4. **REGEN**: `PLAN_DATA` + TavernPlan_0..2.png + sztalugi (`tools/tavern/plan/make_plan.py`, `make_board.py`), `POKOJE.miejsce` (`tools/podroznicy/miejsca_pokoi.py`), `js/teksty/plan_karczmy.txt` opisy dla nowych kluczy, `img/nazwy_map` jeśli zmienią się nazwy.
5. **Przenumerowanie pokoi gości 4-24 -> 12 pokoi**: sekcja 4 - jedna decyzja „kto w którym pokoju” obejmuje: OBSADA (14 podróżnych + trójka + Kompania x4 w 2 pokojach), PRZESZUKANIA (12, 20, 18, 22, 15), podsłuchy (3, 4, 5, 12, 15, 18, + `d48Tuba` 22), pokój 7 (Eryk), pokój 1 (Rafał), bramka „furtka” 3.
6. **Fabuła w Apartamentach**: W14 „Narada” w Wielkim salonie i Jadalni (usuwane) wymaga nowego miejsca w Apartamencie Lorda; Poselstwo_Data ev3070-3072 pozycje.
