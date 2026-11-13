# POTRZEBY - what the tavern rebuild must keep (inventory 2026-11-08)
Merged from three read-only inventories (A: tavern-life plugins, B: story plugins + data, C: tests). Details below, unedited.

## Decisions needed before building (story needs on DROPPED rooms)
1. D42 (Zenon/Klos meeting) is eavesdropped through the Jadalnia prywatna wall on Map001 (Podroznicy_Data.js:275, plan key `jadalnia`).
2. W14 council is staged in the Wielki salon (Map026): Poselstwo_Data 44-62, Lord 3070 / Feliks 3071 / envoy 3072, podsluch key `salon`, F9 jump.
3. Which 8 traveller room numbers to keep (proposal 4,5,9,10,12,15,18,20 -> renumber 4..11 or keep numbers) and whether the free "komnata" (renown 90) stays.
4. Map009 returns (ev1 page 1, ev2 -> Map001 9,5) must be re-pinned to the new pantry.



---
# Part A

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


---
# Part B

# Tawerna 2 - potrzeby strony fabularnej (slice B)

Research read-only, 2026-11-08. Zakres: Act3, Kasztelan, Podroznicy(+5,+Sprawy), Poselstwo, Dezerter (W16), SwieteKosci (W15),
Wrak, TownQuests, Intrygi, Story, Journal, Underground, Rywal + data/*.json poza Map001/025/026 + docs/STORY.md.
Nie istnieje plik `Lancuchy*` - "Lancuchy" to tylko nazwa wlasciciela id (Dezerter/SwieteKosci). Dwor, Zakon, Kantor, Starcia, Orzel,
Prologue, Historyjki: brak zaleznosci od map 1/9/25/26 (tylko miasto/Map008 lub inne mapy) - patrz sekcja 9.

Legenda "Naprawa": **re-pin** = zmienic stala wspolrzednych/numeru; **keep id** = zachowac id zdarzenia; **keep name** = zachowac nazwe
zdarzenia (regex); **keep tag** = zachowac tag `<Tavern:...>`/note; **none** = nic.

## !!! ZALEZNOSCI OD POMIESZCZEN USUNIETYCH (Rozany, Blekitny, Zielony, biblioteka, wielki salon, jadalnia)

| # | Gdzie | Co zalezy | Skutek | Proponowana naprawa |
|---|-------|-----------|--------|---------------------|
| D1 | `Podroznicy_Data.js:275` (`PODSLUCH`, `d42Narada`) + `js/teksty/podroznicy.txt:1251,1267,1280,1281,1359` | D42 "Zboze w susze": narada Zenona z Klosem **za drzwiami Jadalni prywatnej** na Map001 (klucz planu `jadalnia`, dzien 12, 20-22:30). Hero slucha stojac przy jednokomorkowej scianie (prog Czujnosc 6) | brak klucza `jadalnia` w `PLAN_DATA` => podsluch nigdy sie nie zlapie; quest D42 krok 0 (poszlaki 2 z 2) traci jedno zrodlo | Przeniesc rozmowe do pomieszczenia nowej karczmy z sciana podsluchowa (np. gabinet Borgara / maly pokoj Borgara albo kat kuchni): zmienic `pokoj:` + tekst "Jadalnia prywatna" w 5 liniach txt |
| D2 | `Poselstwo_Data.js:44-49,54-57` `AKTORZY.lord/feliks`, `NARADA`, `Poselstwo.js:11-12,406-415,475` | W14 rozdz. 3 **Narada w Wielkim salonie** (Map026): Lord (3070 @32,40) i Feliks (3071 @30,43) widoczni 21:00-22:30 w dniu narady, posel "trzymany" (`TownLife.hold`) na `NARADA.posel [28,40]`; podsluch `w14Narada` mapa 26, `pokoj: "salon"` (klucz planu `salon`) | brak `salon` w planie 26 => podsluch martwy; Lord/Feliks/posel stoja w nieistniejacym miejscu (poza mapa lub w scianie); krok "w14Narada" (`idz [26,41,40,4]`) skacze w pustke | Przeniesc narade do **Apartamentu Lorda** (zostaje) lub saloniku Zlotego: re-pin 3070/3071, `NARADA.posel`, `pokoj:` podsluchu na klucz planu Lorda (`lorda`/`lordb`), F9 `idz`; zmiana tekstow "Wielki salon"/"Jadalnia" w `poselstwo.txt:9,15,121,277` |
| D3 | `poselstwo.txt:9,15,121,277` + `Poselstwo_Data.js:9` | flavor/opisy zadania: "Jadalnia, Wielki salon", "podsluch z Jadalni" | tylko tekst widoczny w dzienniku | edycja tekstu |
| D4 | `Intrygi.js:145` `map = [1,25,26][floor]`, `planInfo` | indeks pietra planu 0/1/2 = mapy 1/25/26; klucz `s4` => "zloty". Ladowanie zalezy od **PLAN_DATA.floors** zachowujacego kolejnosc 1,25,26 | jesli Map026 zostanie jedynym "poddaszem" bez kluczy `s4a/s4b` -> info "kto mieszka" zniknie dla Zlotego | zachowac w planie 26 klucze `s4a`,`s4b` (Apartament Zloty) |
| D5 | `Podroznicy_Data.js:86,111,121-139` (ODSLONA) pokoje 4-24 | **21 numerow pokoi**; nowe pietro ma 12 pokoi (1,2,3 + 7 Eryka + 8 podroznych), wiec **13 numerow 4-24 przestaje istniec** | patrz sekcja 2 | patrz sekcja 2 |

Nie znalazlem w kodzie fabuly zaleznosci od Rozanego / Blekitnego / Zielonego / biblioteki Map026 (jedyne "biblioteki" w kodzie to Map173 dworu
Lorda - Dwor.js, i Lipnica - tylko tekst). Apartament Zloty i Lorda zostaja, wiec W14 i Dwor (Map172-174) sa bezpieczne poza D2.

## 1. Zloty apartament / Map026 (zostaje: Zloty + Lorda)

| Plik:linia | Czego potrzebuje | Co sie psuje | Naprawa |
|------------|------------------|--------------|---------|
| `Poselstwo_Data.js:46` `MAP.apartamenty=26` | numer mapy | - | none (ID mapy zostaje 26) |
| `Poselstwo_Data.js:48` `AKTORZY.albin` id 3072 Map026 (65,29) dir 2 | Albin przed drzwiami Zlotego w Noc Kupaly | stoi w losowym miejscu | re-pin do nowych drzwi Zlotego |
| `Poselstwo_Data.js:62` `MIEJSCA posel_wnetrze [65,40,4]`, `gwardzista_wnetrze [66,30,2]` | miejsca posla (kominek Zlotego) i Ostapa (drzwi) -> `TownLifeData.SPOTS_BY_MAP[26]` | NPC chodzi po scianach | re-pin (albo znaczniki "Miejsce: posel_wnetrze" w mapie) |
| `Poselstwo_Data.js:197-202` F9/skoki zadania: `[26,41,40,4]` (narada), `[26,62,28,6]` (kradziez), `[26,64,29,2]` (list) | debug i kompas "idz" | skok w pustke/sciane | re-pin |
| `Poselstwo.js:360` `T.inject([26,25], ids 3070-3071...)` | wstrzykniecie zdarzen 3070-3074 | - | none (keep id zakres 3070-3079) |
| `Intrygi.js:476-477` | **szuka na Map026 zdarzenia z note `<Tavern:bed room=zloty>`** i kladzie list o 1 kratke pod lozkiem (`zlotyList`) | brak lozka Zlotego => list bez miejsca | **keep tag** `<Tavern:bed room=zloty>` w nowej Map026 |
| `Intrygi_Data.js:70` `LIST_GDZIE.komnata [25,67,12]` | list w "Komnacie z kominkiem" Map025 (pokoj hero z rabatem) | jesli komnata znika - list nie spada | re-pin albo wyciac klucz `komnata` |
| `TavernLife.js:195,1094-1116` (poza slice) `<Tavern:gate minrep=80>` Zlota krata + `GATE_PASSES` (W14 kolacja "w sluzbie") | zdarzenie "Zlota krata (schody do Apartamentow)" na Map025 | kolacja do Zlotego nie otworzy bramy | **keep tag** gate, zostawic krate przy schodach |
| `Podroznicy_Data.js:19-21` `POKOJE_BOHATERA.zloty="furtka"`, OBSADA `posel` `pokoje:["zloty","zloty"]` | pokoj "zloty" nie jest w `POKOJE` - obsluga wylacznie w `pokojDla` | - | none; **keep** klucz planu `s4a`/`s4b` => `Intrygi.js:145` |
| `Poselstwo.js:482` Albin `krok` na Map025: `start [41,24,8]`, `trasa [[41,22],[44,19],[70,18],[88,18],[92,17]]` | nocna trasa Albina z pokoju 15 do schodow (Map025) | trasa przez sciany | re-pin pod nowa galerie/schody |
| `Poselstwo_Data.js:50` `AKTORZY.wosk` id 3073 (45,25), `krata` id 3074 (91,17) Map025 | slady sledztwa na galerii przy pokoju 15 i przy zlotej bramie | slad w scianie | re-pin (galeria przy pokoju 15 + przy zlotej bramie) |
| `Poselstwo_Data.js:201` (krok 5) `[25,45,27,8]` | skok do wosku | jw. | re-pin |
| `Poselstwo.js:426` lista map `[1,25,26]` (mysl Kupaly) | mapy 1/25/26 | - | none |

## 2. Pietro goscinne Map025 - pokoje, numery, drzwi, miejsca

### 2a. Kontrakty nazewnicze (keep name)
- Drzwi pokoi: regex `/^(?:Drzwi|Wejście) -> Pokój (\d+)$/` (`Intrygi_Data.js:46`, `Intrygi.js:157`) - zamkniete drzwi zajetych pokoi, "Zapukaj", sprzatanie 9-11, klucz Borgara. W obecnej Map025 uzywane: `Drzwi -> Pokój N` (1-7, 20-24), `Wejście -> Pokój N` (15-19). **Nowe drzwi musza nosic dokladnie te nazwy**. Inne drzwi ("Drzwi -> Komnata", Lazienka, Bieliznik, Pokoj pokojowki) NIE sa objete regexem (poprawnie).
- Skrzynie do przeszukania: nazwa zdarzenia `/^Kufer/` lub `/^Torba/` (`Intrygi_Data.js:49`), polozone **wewnatrz prostokata pokoju `r<N>` z PLAN_DATA** (`Intrygi.js:224` `numerPokoju`). Obecnie "Kufer podróżny" x20, "Torba podróżna" x9, "Kufer" x6.
- Klucze planu pietra: `r<N>` dla pokoi (`Podroznicy_Sprawy.js:267` `roomKey`, `Intrygi.js:95`), pietro w `TavernLife_Plan.js:59 PLAN_DATA` (mapa 25 -> prostokaty). Podsluch wymaga **sciany jednokomorkowej** miedzy dwoma prostokatami planu (`miejsceSluchu`, `Podroznicy_Sprawy.js:272-283`) - geometria pokoi musi to zachowac.
- `Miejsce: pokoj_<n>` / `pokoj_<n>_2` (opcjonalne, nadpisuja `POKOJE[n].miejsce`) - `Podroznicy_Data.js:537-538`.
- Znacznik `Podroznicy.js:569-602`: Map001 `Miejsce: podrozny_1..6`, `kompania_1..4`, `grajek`, `medyk` - **nie ma ich w obecnej Map001** (tylko `gosc_1..8`), wiec podrozni siedza w pokojach. Opcjonalnie dodac w nowej sali. (`MIEJSCA_W_SALI=6`, `Podroznicy_Data.js:76`.)

### 2b. Stala tablica pokoi - `Podroznicy_Data.js:57-80`
`POKOJE` 4..24 (bez 7) z `typ` (1-os. 8 G / 2-os. 15 G / rodzinny 20 G) i `miejsce [x,y,dir]` na Map025. Wspolrzedne sa i tak niezgodne z mapa 97x71 (24:[106,70], 13:[11,89]) - sa stare. `POKOJE_BOHATERA {1,2: true; 3,"zloty": "furtka"}`, `POKOJ_ERYKA=7`, `POKOJ_RAFALA=1`, `LIMIT {rozdzial 4, renoma 5, akt2 5}`. **Naprawa:** zredukowac `POKOJE` do 8 pokoi podroznych (zachowac mieszanke typow: >=3 x "2-os.", 2 x "rodzinny", >=2 x "1-os."), przeliczyc `miejsce`. `pokojDla` (`Podroznicy.js:119-126`) jest odporne: gdy zadany numer nie istnieje, bierze **najblizszy wolny o tym samym typie**, wiec cast nie padnie, ale powiazane stale ponizej tak.
Wspolbieznosc: limit 5 podroznych naraz (grupa = 1) + kompania zajmuje 2 pokoje + posel (zloty, poza pula) => 6 pokoi z 8 wystarcza.

### 2c. Pokoje przypisane w OBSADA (`Podroznicy_Data.js:121-139`)
tobiasz 23, medyk 11, zboze 20, relikwie 12, kartograf 22, ksenia 18, wizytator 16, urszula 21, dezerter 5, lowczyni 6, kompania [9,9,10,10] (2 pokoje), grajek 17, poborca 4, pielgrzym 15, posel zloty, trojka 3 (hero room, wymaga "furtka"). Pula losowa wybiera z `Object.keys(POKOJE)` (`Podroznicy.js:216`). Nieistniejace numery zostana automatycznie przeniesione (fallback powyzej) - **nic nie pada**, ale ponizsze twarde powiazania numerow tak.

### 2d. Twarde powiazania numer pokoju -> fabula (re-pin lub przenumerowanie)
| Numer | Plik:linia | Zaleznosc | Co sie psuje | Naprawa |
|-------|-----------|-----------|--------------|---------|
| 1 | `TownQuests_Data.js:230` `w6_hide_tavern` (Map025, id 951, **x40 y38**, "Rafał", `$Npc_Rafal`) + `Podroznicy_Data.js:78` `POKOJ_RAFALA=1` + `Podroznicy.js:956` (wiersz w ksiedze) + `TownQuests.js:3595` (50 G dla Borgara) | W6 ch.4: ukrycie Rafala w pokoju 1 hero; porownanie z `where==="tavern"` | Rafal poza pokojem | re-pin x,y do wnetrza nowego pokoju 1 (event 951 jest wstrzykniety - **keep id 951 na Map025**) |
| 1,2,3 | `Intrygi_Data.js:70` `LIST_GDZIE 1:[25,38,44] 2:[25,58,44] 3:[25,28,44]` | list pod drzwiami hero (rano po nocy w pokoju) | list w scianie | re-pin |
| 1,3 | `Intrygi_Data.js:79` `D45.podsluch [1,3]`, `Intrygi.js:692` `d45Liczby pokoj "3"`; `Intrygi.js:157-166` dziurka/notes przy drzwiach pokoju 3 | D45 "Gosc spod trojki": **sciana pokoju 1 sasiaduje z pokojem 3**; dziurka od klucza w drzwiach pokoju 3; trojka mieszka w pokoju 3 (wymaga furtki) | brak adjacency 1-3 => podsluch martwy | zachowac **pokoje 1 i 3 przy wspolnej scianie jednokomorkowej** i drzwi `Drzwi -> Pokój 3` |
| 3 | `Intrygi_Data.js:79` `D45.sadza [25,29,49]` | rekwizyt "sadza" (event 3011) przed drzwiami pokoju 3 | w scianie | re-pin |
| 3 | `Intrygi_Data.js:79` `D45.sznur [9,4,10]` | sznur w piwnicy (Map009) nad beczkami | none (Map009 zostaje) | none |
| 2,4 | `Podroznicy5.js:7,37,305`, `Podroznicy5_Data.js:50` D44 "Podatek wojenny" | podsluch przez sciane pokoju **4 z pokoju 2**; Feliks (id 3080 @68,49 dir 8) przed drzwiami pokoju 4 (68,48) 22:40-23:20; skoki F9 `[25,61,40,6]`, `[25,67,41,8]` | pokoje 2 i 4 nie sasiaduja / Feliks w scianie | zachowac sasiedztwo 2-4 + drzwi 4 od korytarza; re-pin 3080 i skoki; **keep id 3080** |
| 4 | `Podroznicy_Data.js:132` poborca pokoj 4 | - | jw. | patrz wyzej |
| 5 | `Dezerter_Data.js:50` `DRZWI {pokoj "5", przed [16,49,8]}` (drzwi 16,48); `Dezerter.js:316-326,418` podsluch `w16Sen` (0-4) i noc Szczerby; F9 `Dezerter_Data.js:218-219` `[25,14,40,8]`,`[25,18,51,4]`; `Intrygi_Data.js:55-62` trasy nocnych kroczacych (Ozzy start [20,49,6], Tymon start [16,49,6]) | W16 (Tomek/Tymon w pokoju 5, Szczerba pod drzwiami 23-2, rozmowa o polnocy w pokoju) | Szczerba/Tymon w scianie; rozmowa `mapa:25` | wybrac nowy numer "dezertera" **albo** zachowac numer 5 i re-pin `przed`, skoki, starty kroczacych |
| 9,10 | `Podroznicy_Data.js:111` kompania pokoje [9,9,10,10]; `Podroznicy5_Data.js:171` skok `[25,32,60,4]` | D47 "Wolna Kompania" halas do 1:00, 4 najemnikow w 2 pokojach | - | przeniesc na dwa dowolne z 8 pokoi (dwa sasiednie) |
| 12 | `SwieteKosci.js:305` podsluch `w15Kurier` (pokoj "12", 22-24); `SwieteKosci_Data.js:52` `KURIER` id 3050 Map025 **(81,52)** dir 2 przed drzwiami (81,53); `SwieteKosci_Data.js:223` skok `[25,74,50,6]`; `Intrygi_Data.js:67` przeszukanie `w15Skrzynka` (pokoj 12) | W15 "Swiete kosci": Gaspar (relikwie) w pokoju 12 | kurier w scianie, podsluch martwy | przypisac Gasparowi pokoj, przeliczyc: podsluch `pokoj`, `KURIER`, skok; **keep id 3050**; skrzynia "Kufer/Torba" w jego pokoju |
| 15 | `Poselstwo.js:473,497,499` podsluch `w14Okno` (pokoj "15", 23-24), przeszukanie torba/kufer; `Poselstwo.js:482` trasa Albina; `Poselstwo_Data.js:200` | W14 Albin (pielgrzym) w pokoju 15; **drzwi sa `Wejście -> Pokój 15`**; galeria przed pokojem 15 (wosk @45,25) | brak pokoju 15 => 4 mechaniki | zachowac dla pielgrzyma pokoj o numerze 15 **lub** podmienic string "15" w 4 miejscach (`Poselstwo.js:473,497,499`) |
| 18 | `Intrygi_Data.js:68` przeszukanie `d46Pokoj` (pokoj 18, Ksenia), `Intrygi.js:164` `d46.zamek` | D46 "Skradziona szkatulka": zamek w drzwiach Ksenii | przeszukanie szuka po `kto` (zapis w ksiedze), wiec **przezyje zmiane numeru**; `d46Pokoj` ma fallback na wpis ksiegi | none (dopiero `skrzynia` w jej pokoju) |
| 20 | `Intrygi_Data.js:66` `d42Umowa` (pokoj 20, Zenon) | D42 szukanie umowy | jw. (po `kto`) | none poza skrzynia w pokoju |
| 22 | `Podroznicy5.js:312` `d48Tuba` (pokoj 22, kartograf) | D48 tuba Teofila; `Podroznicy5_Data.js:172` skok `[25,13,9,8]` | skok w pustke | re-pin skoku; szukanie po `kto` |
| Komnata | `Intrygi_Data.js:70`, `Intrygi.js:130` `room==="komnata"` (cena 0 raz w tyg. przy renomie 90) | pokoj hero "komnata" | - | jesli komnata wypada: usunac `komnata` z `RENOMA.komnata` lub zostawic klucz planu `chamber` |
| 7 | `Wrak_Data.js:61` `SPOT_ROOMS [6,38,4]` (`rozbitek_wnetrze` -> SPOTS_BY_MAP[25]); `Podroznicy.js:114,954` (ksiega: "pokoj 7"), `Podroznicy_Data.js:77` `POKOJ_ERYKA=7` | Eryk Sowa (W12 rozbitek) spi w pokoju 7 przy waskim lozku | spi w scianie | re-pin `SPOT_ROOMS` do nowego pokoju 7 |
| 16,17,21,23,11,6 | `Podroznicy_Data.js:121-139` | tylko przypisanie "ulubionego" pokoju | fallback najblizszy wolny | none po przycieciu `POKOJE` |

### 2e. Kroczacy po pietrze (`Intrygi_Data.js:55-62`, `IDS.kroczacy=3002` Map025)
Ozzy (start [20,49,6]) i Tymon (start [16,49,6]) ida trasa `[[44,50],[48,56],[48,62]]` do schodow na parter (Map025 -> Map001 schody ~ (48,62)). **re-pin** start/trase do korytarza nowego pietra; `K73 "Nocne kroki"` (Ozzy lunatykuje, W3). Wymaga drogi z korytarza do schodow.

### 2f. Przejscia Map001 <-> Map025
- `data/Map001.json` ev 13-18 "Schody -> Pokoje gości" (6 zdarzen, x37-39 i x61-63, y47) -> Map025 `(48,62,8)`; Map025 "Schody -> Tawerna (parter)" x5 -> Map001 (nie sprawdzano docelowych wspolrzednych, slice A). Fabula nie zalezy od nich bezposrednio, ale `Podroznicy`/`TownLife` biora z nich punkt wejscia.

## 3. Parter Map001 - zdarzenia po ID/nazwie i wspolrzedne (CZERWONE: ID zdarzen!)

**Twarde ID zdarzen Map001 w kodzie fabuly:**
| ID | Nazwa (data) | Uzycie | Plik:linia | Naprawa |
|----|--------------|--------|-----------|---------|
| 1 | `Borgar Kowal` | `$gameMap.event(1)` = Borgar (Act3 obrona drzwi, mowa "startInside"; `hideEvent:1`) | `Act3.js:219,277,634`; `Act3_Data.js:149` `hideEvent: 1`; `Przytulna.js:303` | **keep id 1** na Borgarze |
| 2 | `Melia Srebrogłosa` | `event(2)` melia | `Act3.js:960` | **keep id 2** |
| 3 | `Grum Żelazna Pięść` | `event(3)`; `hideEvent:3`, wrog Grum chowany | `Act3.js:956,960`; `Act3_Data.js:152` | **keep id 3** |
| 4 | `Dziadek Ozzy` | `event(4)` ozzy | `Act3.js:960` | **keep id 4** |
| 9 | `Luźna cegła` @9,4 | wejscie do piwnicy: komunikat, SelfSwitch A, wybor "Zejść na dół" -> `201 [0,9,10,8,8]` (Map009 @10,8 dir 8) | data/Map001.json ev9 | **keep name/mechanika**; przeniesc cegle do spizarni; transfer na Map009 (10,8) zostaje |
| 206 | `Mysia dziura` @11,4 | tylko wizualny element przy cegle | data | opcjonalnie |
| 209 | `Stare drzwi` @9,13 | obraz drzwi `!Fantasy_door1`; Act3 opisuje je jako "old door to the cellar" (`door [9,14]`, `doorTile [9,13]`) - **obiekt fizyczny dla pasków HP drzwi** | `Act3_Data.js:38,52` | brak w kodzie lookup po nazwie (uzywa tylko wspolrzednych) - re-pin `SPOTS[1].door/doorTile` na nowa spizarnie/przejscie |

**Nazwy/Tagi Map001 uzywane przez fabule (keep name / keep tag):**
- Borgar: `Story.js:488` `roleOf`: nazwa `/^Borgar\b/i` (strona 0, trigger <=2) lub grafika `People3_Tall` index 4 -> rola "borgar"; "Atmosfera - Borgar" jest ignorowany (rownolegle). Uzywane przez `Kasztelan.js:309-312` (zamkniety bar), `Dezerter.js:163` (`TavernLife.npc("borgar")`), `TownQuests.js:352-358` (`REGULAR`: `TavernLife.npc` po nazwach Melia/Ozzy/Grum).
- Lada (counter) = zdarzenie z `<Tavern:meal` w tresci/note (`Kasztelan.js:293-297` `counterTag`) - **keep tag** `<Tavern:meal ...>`; "Tavern:meal (zamówienie posiłku)" ev 38 i "Lada - rozmowa z Borgarem" ev 52 w obecnej mapie.
- Tablica zlecen: `QuestBoard.js:690-698` `isBoardEvent` = tag `<Tavern:board>` w note/pierwszej stronie; TownQuests W6 "plakat" (`TownQuests.js:1817-1840,3525`) nadpisuje liste tego zdarzenia -> **keep tag** `<Tavern:board>` (obecnie ev 19/21 "tablica zleceń"@43,49).
- `Story.js:1123` wejscie na Map001 -> krok "tavern"; `Story.js:1124` Map009 -> krok "cellar" (flags.cellar); `Story.js:249` cel dziennika `gdzie {map:1}`; `Story.js:458` `borgarEvent`.
- Drzwi do Map008 z miasta: `data/Map008.json` ev22 "Drzwi tawerny -> Tawerna" @51,16 -> **Map001 (50,53,8)**; `Kasztelan.js:301` `doorOf` regex `/^Drzwi tawerny/` na Map008. Wejscie Map001 (50,53) = takze `TavernLife.js:1739 ENTRANCE`, `Goscie_Sala.js:40` (poza slice). Exit Map001 ev10-12 -> Map008 (50..52,17) - nowa mapa musi miec wyjscie pod to samo miejsce w miescie lub zmienic transfer w Map008 ev22 i Map001 ev10-12.

**Stale wspolrzedne Map001 (re-pin):**
| Plik:linia | Stala | Znaczenie | Naprawa |
|-----------|-------|-----------|---------|
| `Act3_Data.js:48-57` `SPOTS[1]`: `door [9,14]`, `doorTile [9,13]`, `kitchen [[45,11],[47,11],[43,12],[49,12],[45,13],[41,12]]`, `front [[50,51],[49,51],[51,51],[50,50],[48,50],[52,50]]`, `guard [[10,16],[8,16],[11,17],[7,17]]`, `hall [[50,30],[47,31],[53,31]]`, `borgar [52,31]`, `entry [50,53]` | oblezenie fala 3 (z kuchni) i 4 (frontem), stare drzwi do piwnicy (**tu zlamane drzwi = zejscie do piwnicy**), obroncy | **re-pin wszystkie** do nowej tawerny 46x32: kuchnia (wejscie bandytow tylnymi drzwiami), front, spizarnia/cegla (stare drzwi), strefa Borgara |
| `Act3_Data.js:35,161` `TRIGGER.maps [1,8,9]`, `siegeMaps [1,8]`, `DOORS {1:...}` | siege rozpoczynane na mapach 1/8/9 | none (ID zostaja) | none |
| `Act3.js:1164` | ogien na tawernie przy `SPOTS[1].doorTile` | re-pin z doorTile | jw. |
| `Kasztelan_Data.js:35` `AT_BAR [1,52,31,8]` + uzycia `:180,185,187` (skoki F9 W4 rozdz 1,5,7) | skok "przy barze" | re-pin | re-pin |
| `Underground.js:1367` `reserveTransfer(1, 52, 31, 8, 0)` | powrot po zakonczeniu (hero przy barze) | zly punkt -> hero w scianie | **re-pin** |
| `Underground_Data.js:668-727` epilog `tawerna`: `cam [52,31]`, aktorzy `borgar [52,28,2]`, `ozzy [49,30,6]`, `melia [55,30,4]`, `grum [58,31,4]`, `hero [52,31,8]`, `heroIn [52,31,8]` | finalowa scena w tawernie (Borgar za lada, Ozzy/Melia/Grum) | aktorzy w scianach | **re-pin** 4 pozycje + kamera; wymaga miejsca za/przed lada dla 4 postaci |
| `Poselstwo_Data.js:197` skok `[1,52,33,8]` | kolacja na tacy u Borgara | re-pin | re-pin |
| `Wrak_Data.js:60` `SPOT_TAVERN [61,33,4]` (gosc_9) + `Wrak.js:624-632` (`TLD.SPOTS_BY_MAP[1]` `gosc_9`; sprawdza numer rozbitka w kolejnosci gosci) | stolek rozbitka (tawerna) | jesli `Miejsce: gosc_N` sie przenumerowuje -> inny numer | re-pin lub `Miejsce: gosc_9` w nowej mapie |
| `Podroznicy_Data.js:75-76,87,111` + `Podroznicy.js:569-602` | `Miejsce: podrozny_1..6`, `kompania_1..4`, `grajek`, `medyk` w sali (opcjonalne) | none, fallback pokoj | dodaj w nowej sali jesli chcesz |
| `Dezerter.js:157-170` scena wejscia Szczerby (Map001 18-22, dystans 12 od niej); kolejnosc Melia/Ozzy/Grum jako reakcje | Szczerba wchodzi do sali | none (po `TavernLife.npc`) | none |
| `Intrygi_Data.js:79` | none dla Map001; D45 `dziurka` w pokoju 3 | - | - |
| `Podroznicy_Data.js:203-204` miasto (51,17) | bramy karczmy w miescie (Map008) | none | none |

## 4. Piwnica Map009 (zostaje) - zaleznosci od Map001

| Plik:linia | Czego potrzebuje | Naprawa |
|-----------|-----------------|---------|
| `data/Map009.json` ev1 "Wejście do piwnicy" @9,8 (strona 1: powrot `201 [0,1,9,5,2]`) i ev2 "Schody do tawerny" @9,7 -> `201 [0,1,9,5,2]` | **powrot na Map001 (9,5) dir 2** - tuz pod cegla (9,4) | **re-pin** oba transfery na nowe wyjscie ze spizarni |
| `Journal.js:287` `done: $gameSelfSwitches.value([9,1,"A"])` | cel dziennika "Znajdz przejscie do piwnic": self-switch A zdarzenia **Map009 id 1** (ustawia je strona 0 przy pierwszym wejsciu) | **keep id 1 Map009** (zostaje); tekst celu "przyjrzyj sie scianom tawerny" ok |
| `Journal.js:138`/`Story.js:249` | cele: `where {map:1, name:"Tawerna"}` kompas | none |
| `Underground.js:288-300`, `Underground_Data.js:57` | `cellarGate [15,3,8]`, `Map009 (10,8)` jako fallback zapisu | none (Map009 niezmieniona) |
| `Kasztelan.js:82-85,233-245`; `Kasztelan_Data.js:184,189` | zdarzenia 540-541 w piwnicy @ (16,3), (14,3), skoki `[9,15,3,8]`,`[9,14,4,6]` | none |
| `TownQuests.js:1628,1680` nazwa `/^Stara krata zakonu/` (Map009 ev7 "Stara krata zakonu (zejście)" @15,2) | **keep name** (Map009 bez zmian) | none |
| `Intrygi_Data.js:79` `D45.sznur [9,4,10]` | rekwizyt id 3017 w piwnicy | none |
| `Rywal.js:933,938`, `Rywal_Data.js:47` `MAP {tavern:1, cellar:9, ruins:10}` | tylko numery map | none |
| `Act3.js:496-501`, `Act3_Data.js:55,106-108` | zlamane stare drzwi => najemnicy "schodza do piwnicy"; `Kasztelan` flaga `borgarPilnuje` zmniejsza obrazenia | patrz sekcja 3 (re-pin stare drzwi) |
| `Map010 ev1` "Wąskie schody do piwnicy" -> `201 [0,9,15,3,2]` | zejscie z ruin na Map009 | none |

**Luzna cegla w spizarni** - mechanika jest w samym evencie `Luźna cegła` (RM commands, SelfSwitch A). Przeniesc event (i opcjonalnie `Mysia dziura`) do spizarni; `STORY.md:50,254` opisuja to jako "dzwignia w regale/kominku" lub "luzna cegla w murze" - brak kodu zalezacego od polozenia.

## 5. Dwor, Kantor, Zakon, Rywal, Starcia, Orzel, Prologue - przeglad

Brak zaleznosci od wspolrzednych/pokoi Map001/025/026 poza: `Rywal`/`Kasztelan`/`Act3` (tylko mapy 1,9 - patrz wyzej). `Kantor_Data.js:71` `tavern:[51,18]` = brama w miescie (Map008). `Orzel_Data.js:149` `NO_LAND [1,14,120]` - orzel nie laduje na Map001 (nowa mala mapa tez pasuje). `Zakon_Data.js` i `Orzel_Data.js` `[7,25,8]` itp. to inne mapy. `Prologue.js:219` ma `cam:[1,640,372]` - to plansza prologu (indeks 1, NIE mapa).

## 6. Dane (data/*.json) poza Map001/025/026

| Plik | Co | Naprawa |
|------|----|---------|
| `Map008.json` ev22 "Drzwi tawerny -> Tawerna" @51,16 | `201 [0,1,50,53,8]` -> Map001 (50,53) | re-pin jesli wejscie nowej Map001 jest gdzie indziej |
| `Map009.json` ev1 (strona 1), ev2 | `201 [0,1,9,5,2]` -> Map001 (9,5) | **re-pin** (sekcja 4) |
| `Map010.json` ev1 | `201 [0,9,15,3,2]` -> Map009 | none |
| `CommonEvents.json`, `Troops.json` | brak transferow do map 1/9/25/26 | none |
| `System.json` | `startMapId 8, (72,16)` - start w miescie (nie w tawernie) | none |
| `MapInfos.json` | id 9 "Piwnica Tawerny", 25 "Pokoje gości", 26 "Apartamenty" - rodzic 1 "TAWERNA" | none (zachowac ID i nazwy; uzywaja ich nazwa-obrazki `img/nazwy_map/spis.json` i `MapaWyspy_Data.js:44-45`) |
| `Map025.json` ev3050/951/3011... | wstrzykiwane w locie (`Tawerna.inject`), nie ma ich w pliku | nic w pliku, ale `inject` pracuje na wsp. z kodu |

## 7. Dokumenty

`docs/STORY.md:9,50,131,233-234,246,254,287,293-294,421` - "piwnice tawerny", "dzwignia w regale/kominku lub luzna cegla w murze" (254), "pokoje jako scena: podsluch przez sciane, list, gosc, ktory nie placi, zamiana kluczy" (287), mapy "Map001 + Map025 Pokoje gości + Map026 Apartamenty" (293), "Piwnica tawerny i luzna cegla (Map009)" (294). Zmieniac tylko jesli mapy zmieniaja role; `docs/PODROZNI.md` (nie w slice) zawiera tablice pokoi 4-24.

## 8. Podsumowanie "co MUSI zostac / co przeliczyc"

**Zostaje bez zmian (kontrakty):** ID zdarzen Map001 1,2,3,4 (Borgar/Melia/Grum/Ozzy); nazwa Borgara `Borgar...`; tag `<Tavern:meal>` (lada), `<Tavern:board>`, `<Tavern:gate minrep=80>`, `<Tavern:bed room=zloty|1|2|3|komnata>`; nazwy drzwi `Drzwi|Wejście -> Pokój N`; `Kufer*`/`Torba*` wewnatrz prostokatow `r<N>`; Map009 ev1/ev2/ev7 + switch 11; ID map 1,9,25,26; ID zdarzen wstrzykiwanych 951 (Map025), 3002-3017, 3050, 3070-3074, 3080.
**Do re-pinu (suma):** `Act3_Data SPOTS[1]`; `AT_BAR` (Kasztelan_Data); `Underground.js:1367` + `Underground_Data:668-727`; `Map009` ev1/ev2 powrot (9,5); `Poselstwo` x13; `Podroznicy5` D44/D47/D48; `Dezerter` pokoj 5; `SwieteKosci` pokoj 12; `Intrygi` LIST_GDZIE, D45, kroczacy; `TownQuests_Data:230`; `Wrak_Data` 2 miejsca; `POKOJE` (13 numerow wypada).
**Decyzje do podjecia (design):** (1) gdzie narada D42 (zamiast Jadalni) i gdzie narada W14 (zamiast Wielkiego salonu - sugestia: Apartament Lorda); (2) ktore 8 numerow pokoi podroznych (sugestia: zachowac 4,5,9,10,12,15,18,20 - mniej zmian: story-pokoje to 4,5,12,15 + kompania 9,10 + ksenia 18 + zboze 20; kartograf 22 -> fallback; D48 tuba/22 do przypisania); (3) czy "komnata" (rabat 90 renomy) zostaje; (4) sasiedztwa scian: 1-3 (D45), 2-4 (D44).


---
# Part C

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
