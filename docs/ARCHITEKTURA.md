# Architektura gry „Tawerna” (wtyczki RPG Maker MZ)

Stan: 2026-09-29, etap 3 porządków („żeby to było ładne, czytelne, proste do rozszerzenia”).
Kod: 75 wtyczek w `js/plugins.js` (70 naszych), ok. 52 800 linii (48 400 naszych). Rdzeń: **TawernaCore.js** i **TawernaUI.js**
(zestaw interfejsu). Przeniesione na rdzeń jako wzorce w etapie 2: **HomeDecor.js**, **HomeAmbience.js**, **HomeLife.js**.
Etap 3, partia A (2026-09-29): zakładka F9 „Rdzeń”, znaczniki notatki mapy przez `Tawerna.mapFlag/mapTag` (18 wtyczek), dymki
braków przez `Tawerna.popup`, zdarzenia szyny z Hunting, TavernShift, TavernDice, QuestBoard, Story i TavernLife (sekcja 14.1).
Partia B: stany Story, Forestry, Birds, Dog, Journal, QuestBoard, TavernShift, TavernDice i TavernLife w `_tw` (sekcja 4), całe
wstawianie przez `Tawerna.inject` (sekcja 6), mini-gry tawerny na `Scene_MiniGame` i podział dużych wtyczek na pliki (sekcja 2),
Journal słucha szyny (sekcja 5). Partia C1: MenuPanel na rdzeniu i jego API wpisów (`addCommand`, `addFoot` - sekcja 11.3).
Partia C2: Storm i Atmosphere na rdzeniu (zdarzenia `stormStart`, `stormEnd`, `lightning`). Partia C3: Combat na rdzeniu, w trzech
plikach (`Combat_Fight`, `Combat_UI`), stany `hero` i `combat`, zdarzenia `levelUp`, `heroHit`, `heroDown`, `attack`. Partia D1:
SpeechBubbles na rdzeniu (tagi `<Bust>` przez `Tawerna.tag`, parametr `heroSide`). Partia D2: Hunting na rdzeniu, w czterech plikach
(`Hunting_Path`, `_AI`, `_Weapons`), stany `hunt` i `carcasses`, zdarzenie `shot`. Partia E1: Farming na rdzeniu, w pięciu plikach
(`Farming_Plots`, `_Build`, `_Stations`, `_UI`), stan `farm`, zdarzenia `build`, `harvest`, `craft`. Partia E2: ChoppableTree na
rdzeniu, w czterech plikach (`ChoppableTree_Objects`, `_Swing`, `_Render`), stany `treeFruit` i `smoulder`, tagi przez `Tawerna.tag`,
zdarzenie `chop`. Części Combat, Hunting, Farming i ChoppableTree wpisane do `js/plugins.js` (sekcja 2). Nic z tego nie jest już
w toku; dalej: etap 5 (dane i teksty do plików danych) i etap 6 (sprzątanie) - sekcja 14. Etap 6, pierwsze porządki (2026-09-29):
Storm na `Tawerna.state("smoulder")`, Farming_Render przez `Tawerna.call`, Combat słucha `build` zamiast przeglądać budynki co 90
klatek, dawne `_lastSleep` / `_bagWater` / `_vesselBag` w `_tw.farm` (sekcje 4, 5, 14).

Ten plik mówi, *jak ma być*. Każda nowa rzecz i każda przeróbka trzyma się tych zasad; stare wtyczki dochodzą do nich
krok po kroku (sekcja 14).

---

## 1. Warstwy

```
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │ 4. UI         UITheme (styl) → TawernaUI (zestaw, Scene_MiniGame)            │
 │               SurvivalHUD, Journal, Minimap, MenuPanel, Debug, Combat_UI,    │
 │               sceny mini-gier (TavernShift, TavernDice, QuestBoard, TavernLife)│
 ├──────────────────────────────────────────────────────────────────────────────┤
 │ 3. SYSTEMY    logika:  DayNightCycle, Survival, Needs, Forestry, Birds,      │
 │                        Farming (+ _Plots, _Build, _Stations, _UI),           │
 │                        ChoppableTree (+ _Objects, _Swing),                   │
 │                        Hunting (+ _Path, _AI, _Weapons), Livestock, Dog,     │
 │                        Combat, Combat_Fight, Durability, Spoilage, Story,    │
 │                        HomeLife, HomeDecor, FreeMovement, HeroLook, MapZoom, │
 │                        Fullscreen                                            │
 │               świat na ekranie: RoomLighting, DustMotes, CloudShadows,       │
 │                        SwayingFoliage, CharacterPolish, GroundDetail,        │
 │                        Farming_Render, ChoppableTree_Render, Storm, Puddles, │
 │                        Atmosphere (dźwięk), HomeAmbience, SpeechBubbles      │
 ├──────────────────────────────────────────────────────────────────────────────┤
 │ 2. DANE       Farming_Data (CROPS, BUILDINGS, HAND_RECIPES, FoodTable),      │
 │               Skills_Data, data/*.json (edytor), bloki generowane w wtyczkach│
 │               QuestBoard_Data, TavernDice_Data (wzory ogłoszeń, rywale)      │
 ├──────────────────────────────────────────────────────────────────────────────┤
 │ 1. RDZEŃ      TawernaCore: stan, szyna, wstawianie, zegar, spokój, tagi,     │
 │               kalendarz, dźwięk, dymki, rejestr wtyczek, debug               │
 ├──────────────────────────────────────────────────────────────────────────────┤
 │ 0. SILNIK     rmmz_*.js + obce wtyczki bez zmian: ActorPictures, AltMenuScreen,│
 │               AltSaveScreen, OptionEx, HDLayout, ButtonPicture, TextPicture  │
 └──────────────────────────────────────────────────────────────────────────────┘
```

Zasady:

1. **Warstwa sięga tylko w dół.** Systemy nie rysują okien ani nie znają scen UI: mówią przez `Tawerna.popup(...)`,
   `Tawerna.emit(...)` albo przez swoje API czytane przez UI. UI czyta systemy przez ich API.
2. **System do systemu: przez API albo szynę**, nigdy przez prywatne pola. `Tawerna.call("Farming", "seasonIndex", d)`
   zamiast `window.Farming && Farming.seasonIndex ? ... : ...`; „coś się stało” (zabity wilk, spłacony dług) = zdarzenie
   na szynie, nie odpytywanie stanu co 120 klatek.
3. **Dane osobno od logiki.** Tabele (uprawy, budynki, przepisy, umiejętności) w `*_Data.js`; długie teksty w tablicy na
   górze wtyczki (`LINES`, `TEXT`) albo w jej `*_Data.js`.
4. **Obcych wtyczek (warstwa 0) nie ruszamy.** Ich zachowanie zmieniają nasze wtyczki (np. UITheme dla AltSaveScreen).

Dzisiejsze wyjątki (do sprzątnięcia w etapie 6): Farming ma własne okna menu (od partii E1 osobno, w części `Farming_UI.js`, ale
wciąż w rodzinie systemu); baner dnia SurvivalHUD (`$gameTemp.queueDayBanner`) Story owija, a TavernLife woła wprost; Combat sumuje
doświadczenie w napisie u góry przez `$gameTemp.pushTopNotice(..., { sum })` (SurvivalHUD; propozycja: `Tawerna.popup(..., { top: true,
sum })`); 7 innych wtyczek czyta `$gameSystem._farm` (od E1 ukryty alias `_tw.farm`; Combat od etapu 6 już nie), Journal czyta dawne
klucze `_needs`, `_wear` (a `_hunt` i `_forest` przez alias).

---

## 2. Kolejność wtyczek

Lista w `js/plugins.js` (75 wtyczek, wszystkie włączone; numer = miejsce na liście):

```
 0  TawernaCore                ← pierwsza, nad wszystkim
 1  ActorPictures, AltMenuScreen, AltSaveScreen, OptionEx, HDLayout                     (obce)
 6  DustMotes, RoomLighting, DayNightCycle, CloudShadows, SwayingFoliage, MapZoom
12  ChoppableTree, ChoppableTree_Objects, ChoppableTree_Swing, ChoppableTree_Render  ← części zaraz pod główną (przed SurvivalHUD)
16  SurvivalHUD, Farming_Data
18  Farming, Farming_Plots, Farming_Build, Farming_Stations, Farming_UI  ← części zaraz pod główną (za nimi Farming_Render)
23  Farming_Render, CharacterPolish, GroundDetail, FreeMovement, Fullscreen, Survival
29  UITheme
30  TawernaUI                  ← zaraz pod UITheme
31  Journal, Minimap, Atmosphere, Storm, Puddles, Durability, Spoilage
38  Hunting, Hunting_Path, Hunting_AI, Hunting_Weapons  ← części zaraz pod główną (przed Birds)
42  Birds, Forestry, Needs, Livestock, Dog, Skills_Data
48  Combat, Combat_Fight, Combat_UI                     ← części zaraz pod główną
51  SpeechBubbles, Debug
53  MenuPanel                  ← pod Journal (układa jego scenę), nad wtyczkami, które dokładają wpisy do menu P
54  HeroLook
55  TavernShift, TavernShift_Hall, TavernShift_Parts
58  Story                      ← pod MenuPanel (linia długu: MenuPanel.addFoot)
59  QuestBoard_Data, QuestBoard, QuestBoard_Art, QuestBoard_Scene
63  TavernDice_Data, TavernDice, TavernDice_Art, TavernDice_Scene
67  TavernLife, TavernLife_Render, TavernLife_ArmWrestle, TavernLife_Darts, TavernLife_Plan
72  HomeAmbience, HomeDecor, HomeLife
```

ButtonPicture.js i TextPicture.js (obce) leżą w `js/plugins`, ale nie są na liście. Części Combat i Hunting (partie C3, D2) wpisane
2026-09-29: `Combat_Fight`, `Combat_UI` zaraz pod Combat; `Hunting_Path`, `Hunting_AI`, `Hunting_Weapons` zaraz pod Hunting (przed Birds).
Części ChoppableTree i Farming (partie E2, E1) wpisane 2026-09-29 ok. 15:45: `ChoppableTree_Objects`, `_Swing`, `_Render` zaraz pod
ChoppableTree (przed SurvivalHUD); `Farming_Plots`, `_Build`, `_Stations`, `_UI` zaraz pod Farming (Farming_Render stoi za nimi).

Części podzielonych wtyczek (partie B, C3, D2, E1, E2; stara nazwa została, część to nowy plik obok - sama nic nie robi bez głównej):

| plik | co w nim | stoi pod |
|---|---|---|
| `TavernShift_Hall.js` | sala tawerny dla zmiany: kafle, postacie, efekty, stoły, bar, kominek, beczka, kufel | TavernShift, TawernaUI |
| `TavernShift_Parts.js` | cztery części zmiany: sprzątanie i drewno, nalewanie, kuchnia w rytm, obsługa sali | TavernShift_Hall |
| `QuestBoard_Data.js` | wzory ogłoszeń, zleceniodawcy, zwierzęta i listy gończe, ceny towarów, słowa Borgara | (nad QuestBoard) |
| `QuestBoard_Art.js` | kartki na pergaminie (`ui.drawPaper`), pinezki, pieczęcie, wstążka PILNE, zwierzęta tuszem | QuestBoard, TawernaUI |
| `QuestBoard_Scene.js` | scena tablicy: kartki, szczegóły, łupek ze sławą, klawisze i mysz, przyjmowanie i oddawanie | QuestBoard_Art |
| `TavernDice_Data.js` | kości specjalne, rywale (godziny, stawki, sposób gry, ich słowa), słowa bohatera | (nad TavernDice) |
| `TavernDice_Art.js` | kości, kubek, monety, stół, świece, dymki, pasek i panele stołu | TavernDice, TawernaUI |
| `TavernDice_Scene.js` | scena stołu na `Scene_MiniGame`: lobby, partia, rywal, koniec partii | TavernDice_Art |
| `TavernLife_Render.js` | karta dań i pokoi, talerze, para, nuty, świece, monety, kąpiel, znaczki premii | TavernLife |
| `TavernLife_ArmWrestle.js` | siłowanie z Grumem (`Scene_MiniGame`) | TavernLife |
| `TavernLife_Darts.js` | rzutki z Ozzym / Wieśkiem (`Scene_MiniGame`) | TavernLife |
| `TavernLife_Plan.js` | sztalugi z planem (wstawiane, id 950), scena planu karczmy, wpis „Plan karczmy” w menu P | TavernLife, MenuPanel |
| `Combat_Fight.js` | oddech i bieg, broń w ręku, ciosy (kombo, ciężki cios), przewrót, blok i parowanie, `hitPlayer` (cios wroga w bohatera), zatrzymanie świata (hitstop), walka co klatkę | Combat |
| `Combat_UI.js` | warstwa walki na mapie (liczby, iskry, paski wrogów, oddech, tarcza), plakietka broni, pasek doświadczenia, napis trybu, baner poziomu, ekran Postaci (`Scene_Hero`) | Combat_Fight |
| `Hunting_Path.js` | droga w 8 kierunkach (A*, `path8`), pilnowanie utknięcia - także dla psa | Hunting |
| `Hunting_AI.js` | zwierzę (`Game_Animal`): pasienie, ucieczka, przynęta, dzik, wilki | Hunting_Path |
| `Hunting_Weapons.js` | proca, łuk, celowanie, oszczep, pociski, trafienie i `kill`, zwłoki i oprawianie | Hunting_AI |
| `ChoppableTree_Objects.js` | co jest czym (profile krzaków i kamieni, rodzaje), owoce, zwęglenie piorunem, pole celu, zegary zdarzenia, koniec upadku i rozbicia, zwolnienie ziemi, zdobycz, uderzenie (`strike`), `applyPendingAction`, kolejka `$gameTemp._hitFx`, zdarzenie `chop` | ChoppableTree |
| `ChoppableTree_Swing.js` | zamach narzędziem (`startToolSwing` / `stepToolSwing`), trzymane O, arkusze zamachów, narzędzie z `Tools.png`, gdy arkusza brak | ChoppableTree_Objects |
| `ChoppableTree_Render.js` | drzewo w paskach (kołysanie, odrzut, przechył upadku), zwęglony obrazek, żar (`emberLights`, `emberSpots`), podgląd pniaka, błysk trafienia, zgniecenie, przezroczysty krzak, odpryski (`FX_TYPES`, `Sprite_HitFxLayer`, z 7) | ChoppableTree_Swing |
| `Farming_Plots.js` | rodzaje ziemi, pola, zbieractwo i krzaki, woda (konewka, picie, bukłak, wędkowanie), wiadra i garnki, wzrost, grabie / motyka / siew / zbiór / wyrywanie / podlewanie / kopanie, glina, suszenie garnków | Farming |
| `Farming_Build.js` | zasady budowy, plac budowy i młotek, stawianie od razu, rozbudowa, rozbiórka, plony budynków i ich zbiór, wnyki, meble i drzwi chatki, stawianie z podejściem, odpoczynek i sen | Farming_Plots |
| `Farming_Stations.js` | praca stanowisk i kolejka, paliwo ognia i deszcz, przepisy, pieczenie, praca ręczna, linie przepisów stanowisk, skrzynie (`Scene_Chest`, `Window_ChestList`) | Farming_Build |
| `Farming_UI.js` | `menuFor` i menu budynku / uprawy / ziemi, menu ręczne i „Postaw...”, lista budowy (Q), jedzenie (E), `Window_FarmList` / `Title` / `Tip`, ciała metod sceny menu (`SCENE`) | Farming_Stations |

Części sprawdzają przy wczytaniu swoją główną wtyczkę (`TavernLife.lib`, wspólne rzeczy TavernShift / TavernDice / QuestBoard,
wspólna torba `Tawerna.api("Combat_parts")` - `core`, `fight`, `ui` -, `Tawerna.api("Hunting_parts")` - `core`, `path`, `ai`, `weapons` -,
`Tawerna.api("ChoppableTree_parts")` - `core`, `objects`, `swing`, `render` - i `Tawerna.api("Farming_parts")` - `core`, `plots`, `build`,
`stations`, `ui`) i rzucają czytelny błąd, gdy jej brak albo stoi niżej; pliki `_Data` tylko się rejestrują (`@orderBefore` głównej), a
główna czyta je dopiero w grze. Testy wkładają część do strony tylko wtedy, gdy nie jest zarejestrowana (`TavernLife.modules`).
Główne pliki po podziale: Combat.js - klawisze, stan, atrybuty, poziomy, doświadczenie, umiejętności (`perk`), API; Hunting.js - stan,
API, `RoamingActor`, skradanie i czujność, pojawianie się zwierząt, nocne napady; ChoppableTree.js - parametry, `SOLID_GRAPHICS`, zajmowane
pola (`occupyTag`, `occupyConfig`, `isInsideArea`, `isSoftTile`), tablica zamachów `SWING_KINDS` / `swingKind` / `swingKindOf` (musi
zostać w głównym: Combat_Fight woła `swingKindOf` już przy wczytaniu, przed częściami), klatki upadku i rozbicia, czas żaru, stan, czytanie
tagów (`readConfig`), 4 polecenia wtyczki, tryb czekania `treeAnimation`, API; Farming.js - parametry, `ITEM` / `STAMINA` / `SE`, `GATHER`
i inne tabele na zewnątrz, tabele z Farming_Data, stan, pory roku, stałe chatki (`hutOf`, `hutDoorAt`), kształty budynków i ich indeks
(`geoOf`, `buildingAt`, `solidAt`), pomocnicy (`popup`, `playSe`, `swingThen`, `later`, `clockHours`, `hash2`), słuchacze szyny, zegar
mapy, API.

**Części wczytywane przez główny plik mają tylko funkcje i klasy; każdy hak silnika zostaje w głównym pliku.** Miejsce haków w
łańcuchu jest wtedy to samo, czy część stoi na liście, czy doszła na końcu: Combat.js, Hunting.js, ChoppableTree.js i Farming.js (jak
TavernDice, QuestBoard i TavernShift) wkładają niewpisaną część same (`PluginManager.loadScript`). Metoda silnika, której ciało jest w
części, stoi w głównym pliku jako cienkie przejście: ChoppableTree - `via(część, nazwa)` (np. `Game_Player.startToolSwing`,
`Sprite_Character.updateTreeFrame`), Farming - metody `Scene_Map` (menu, stawianie budynku) wołają `część().SCENE[nazwa]`; części wołają
się nawzajem przez torbę (`link()` w Farming), żadna nie rusza prototypu silnika. Części TavernLife same się nie wczytują - muszą być na
liście (`TavernLife_Render` i `TavernLife_Plan` mają własne haki silnika).

Reguły:

1. **TawernaCore pierwsza.** Jej haki „przygotowujące” (dane mapy, stan zapisu, zapisane zdarzenia) są wtedy najgłębiej,
   a haki „mówiące” (zdarzenia szyny, zegar mapy, sen) zakłada sama przy `Scene_Boot.start` - nad każdą wtyczką. Słuchacz
   widzi więc świat po wszystkich starych hakach.
2. **Każda wtyczka na rdzeniu ma w nagłówku** `@base TawernaCore` i `@orderAfter TawernaCore` (edytor ostrzeże, gdy
   rdzenia brak) i na starcie: `const T = window.Tawerna; if (!T) throw new Error("...: brak TawernaCore.js ...")` -
   brak rdzenia = czytelny błąd od razu, nie dziwne zachowanie później.
3. **Dane tuż nad swoim systemem** (`Farming_Data` nad `Farming`).
4. `@orderAfter` tylko dla prawdziwych zależności w chwili ładowania (ten sam hak w łańcuchu, odczyt przy ładowaniu).
   Odwołania w trakcie gry idą przez `Tawerna.api/call` - kolejność ich nie dotyczy.
5. **Nazwy plików się nie zmieniają** (edytor trzyma po nich parametry). Podział dużej wtyczki = nowy plik obok
   (`Nazwa_Render.js`, `Nazwa_Data.js`, `Nazwa_UI.js`), stara nazwa zostaje.
6. **Edytor:** nowy plik dopisuj z zamkniętym edytorem, potem raz otwórz Menedżer wtyczek i zapisz (inaczej edytor wyrzuci
   wpis). Po zmianach w `data/*.json` - przeładuj projekt w edytorze.

---

## 3. Nazwy

| Co | Zasada | Przykład |
|---|---|---|
| plik wtyczki | PascalCase, jedna rzecz na plik | `HomeDecor.js`, `Farming_Render.js` |
| obiekt wtyczki | `window.Nazwa = Tawerna.register("Nazwa", {...})` | `window.HomeDecor` |
| klucz stanu | camelCase, nazwa systemu | `homeDecor`, `farm`, `hunt` |
| dawny klucz (adopt) | jak był | `_homeDecor` |
| zdarzenie szyny | camelCase, co się stało | `kill`, `shiftDone`, `debtPaid` |
| zegar mapy | `{ owner: "Wtyczka", name: "co" }` | `HomeDecor.refresh` |
| właściciel wstawień | nazwa wtyczki | `owner: "HomeDecor"` |
| tag | PascalCase, własny tag = nazwa wtyczki | `<HomeDecor:rogi>`, `<Tavern:dice>` |
| klucze w tagu | małe litery | `<Tree:hits=5,drop=61>` |
| warstwa na scenie | `_` + nazwa | `scene._decorTip` |
| komentarze w kodzie | po angielsku, krótko | `// (the editor's own event: left alone)` |
| teksty w grze | po polsku | „Potrzebujesz siekiery” |

---

## 4. Stan i zapis

Wszystko, co ma przetrwać zapis, siedzi w **`$gameSystem._tw.<klucz>`** i powstaje przez rdzeń:

```js
const store = Tawerna.state.define("homeDecor", () => ({ v: 1, got: {}, kills: {} }),
    { version: 1, adopt: "_homeDecor", owner: "HomeDecor" });
store().got.wolf = 12;                    // żywy obiekt - ten sam przy każdym wywołaniu
Tawerna.state("homeDecor");               // to samo z każdego miejsca
```

- `$gameSystem._tw._v[klucz]` trzyma wersję; `Tawerna.state.version(klucz)` ją czyta.
- **Migracje** biegną przy wczytaniu, krok po kroku: `migrate: { 2: s => {...}, 3: s => {...} }` (albo jedna funkcja
  `(s, from, to)`). Brakujące pola z domyślnych dopełniają się same (płytko).
- **adopt**: stary zapis z `$gameSystem._homeDecor` przechodzi do `_tw.homeDecor`, a stary klucz zostaje jako **ukryty
  alias** (getter/setter, niezapisywany) - stary kod czytający `$gameSystem._homeDecor` dalej działa, a nowy zapis ma
  dane już tylko w nowym miejscu. Dane zaadoptowane mają wersję `adoptVersion` (1), potem idą migracje.
- Zapis nowszy niż wtyczka (cofnięta wersja gry): zostaje nietknięty, ostrzeżenie w konsoli.

Zasady:

1. **Tylko zwykłe dane JSON**: bez klas, funkcji, odwołań do `Game_*`, cykli. `Set` → tablica.
2. **Zmiana kształtu = wersja + 1 i krok migracji.** Nigdy nie zmieniaj nazwy ani nie usuwaj pola bez migracji.
3. **Stare zapisy muszą się wczytać.** Zapisy wzorcowe w `tests/fixtures/` (`new_story_day1`, `tavern_evening`,
   `day40_farm`, `home_decor_v0` - ten ostatni zrobiony starym HomeDecor.js); `tests/core_fixtures_test.js` (etap 2, B1),
   `tests/core_fixtures_b2_test.js` (B2) i `tests/tavern_life_save_test.js` wczytują je z rdzeniem. Każdy etap, który rusza
   stan, dopisuje swoje sprawdzenie (adopcja, alias, nowy zapis tylko w nowym miejscu i jego ponowne wczytanie).
4. **Pamięć podręczna poza stanem** (sprite'y, układy, wyszukiwania): liczona na nowo po `load` / `mapReady`.
5. Chwilowe flagi sesji (otwarte menu) - `$gameTemp`, nie zapis.

Stany w rdzeniu (`$gameSystem._tw.<klucz>`, wersja 1, stary klucz przejęty przez `adopt` i zostawiony jako ukryty alias):

| klucz w `_tw` | dawny klucz | wtyczka | partia | sprawdza stary zapis |
|---|---|---|---|---|
| `homeDecor` | `_homeDecor` | HomeDecor | etap 2 | `core_fixtures_test` (`home_decor_v0`) |
| `homeAmbience` | `_homeAmbience` | HomeAmbience | etap 2 | `core_fixtures_test` |
| `homeLife` | `_homeLife` | HomeLife | etap 2 | `core_fixtures_test` |
| `story` | `_story` | Story | B1 | `core_fixtures_test`, `story_test` |
| `forest` | `_forest` | Forestry | B1 | `core_fixtures_test` |
| `birds` | `_birds` | Birds | B2 | `core_fixtures_b2_test` |
| `dog` | `_dog` | Dog | B2 | `core_fixtures_b2_test` (pies z `day40_farm`) |
| `journal` | `_journal` | Journal | B2 | `core_fixtures_b2_test` |
| `quests` | `_quests` | QuestBoard | B | `quest_board_test` (`tavern_evening`: reputacja, tablica) |
| `tavernShift` | `_tavernShift` | TavernShift | B | `quest_board_test` |
| `dice` | `_dice` | TavernDice | B | `tavern_dice_test` (przez alias `_dice`) |
| `tavernLife` | `_tavernLife` | TavernLife | B | `tavern_life_save_test` |
| `stormTrees` | `_stormTrees` | Storm | C2 | `tree_strike_test` (stary zapis z `_stormTrees`) |
| `hero` | `_hero` | Combat | C3 | `core_fixtures_test` (`day40_farm`: poziom 6), `unit/combat` |
| `combat` (`mode`, `hand`) | `_combatMode`, `_combatHand` (przechodzą przy wczytaniu; stare nazwy: getter/setter na `Game_System.prototype`) | Combat | C3 | `core_fixtures_test`, `unit/combat` |
| `hunt` (`kills`, `killed`, `sneak`) | `_hunt`; `_sneak` (przechodzi do `hunt.sneak` przy wczytaniu; stara nazwa: getter/setter na `Game_System.prototype`) | Hunting | D2 | `core_fixtures_test` (`home_decor_v0`: wilk z dnia 14; postarzony `day40_farm`: skradanie, zwłoki) |
| `carcasses` | `_carcasses` | Hunting | D2 | `core_fixtures_test` |
| `farm` | `_farm` (alias czyta 7 wtyczek: GroundDetail, Journal, Livestock, Minimap, Spoilage, Story, Survival; jest od początku gry). Etap 6: pola `lastSleep` (godzina przebudzenia po nocy), `bagWater` (woda w wiadrze w plecaku), `vesselBag` (garnki w plecaku) - dawne `_lastSleep`, `_bagWater`, `_vesselBag` przechodzą przy wczytaniu; stare nazwy: getter/setter na `Game_System.prototype` (czytają i piszą je testy) | Farming | E1, etap 6 | `core_fixtures_b2_test` (każdy zapis; `day40_farm`: 24 budynki na polu, meble chatki, pola, spiżarnia; `_lastSleep` z `tavern_evening` i `day40_farm`, postarzony `day40_farm` z `_bagWater` i `_vesselBag`) |
| `treeFruit` | `_treeFruit` | ChoppableTree | E2 | `tree_strike_test` (stary zapis), `unit/choppable_tree` |
| `smoulder` | `_smoulder` (Storm od etapu 6 przez `Tawerna.state("smoulder")`; alias już tylko dla starych zapisów i testów) | ChoppableTree | E2 | `tree_strike_test` (stary zapis), `unit/choppable_tree` |

Livestock nie ma stanu w zapisie (stado liczone na nowo po `load` / `mapEnter`). Stare klucze czytane przez alias w innych
wtyczkach: `_dice`, `_quests` (HomeDecor: czy już coś jest, zanim zapyta API), `_forest`, `_hunt` (Journal), `_combatMode` (rdzeń:
sprawdzenie `combat` w `isCalm`), `_farm` (7 wtyczek z tabeli). `_smoulder` czytają i piszą już tylko testy (`tree_strike_test`).

Jeszcze w starych kluczach (`$gameSystem._xxx`; docelowo każdy przez `Tawerna.state` z `adopt`):

| klucz | wtyczka | klucz | wtyczka |
|---|---|---|---|
| `_stormForce`, `_stormWarned`, `_weatherOwn`, `_rainDay` | Survival | `_needs` | Needs (czyta Journal) |
| `_fresh` | Spoilage | `_wear` | Durability (czyta Journal) |
| `_freeMove` | FreeMovement | `_puddleClay` | Puddles |
| `_dayNightTinting` | DayNightCycle (czytają Farming_Render, Storm) | `_heroLook` | HeroLook |
| `_gridShown` | Farming_Render | `_minimapHidden` | Minimap |

---

## 5. Szyna zdarzeń

```js
const off = Tawerna.on("dayStart", e => { ... }, { owner: "Farming", priority: 0 });
Tawerna.once("mapReady", e => ...);
Tawerna.emit("debtPaid", { paid: 2500, day: 20 });   // -> ilu słuchało
```

Kolejność: `priority` (mniejsza pierwsza), potem kolejność zapisu. Słuchacz, który rzuci błąd, trafia do konsoli (z
właścicielem), a pozostali i tak dostają zdarzenie.

**Zdarzenia rdzenia** (`Tawerna.EVENTS.core`):

| zdarzenie | kiedy | dane |
|---|---|---|
| `newGame` | po `DataManager.setupNewGame` (także raz przy starcie gry pod ekran tytułowy) | `{ boot }` |
| `load` | po wczytaniu zapisu (stany już zaadoptowane i zmigrowane) | `{ contents }` |
| `save` | tuż przed zrobieniem zawartości zapisu | `{}` |
| `mapLeave` | przed każdym `Game_Map.setup` | `{ mapId: stara (0 w nowej grze), to }` |
| `mapEnter` | po `Game_Map.setup` (zdarzenia mapy już są) | `{ mapId, from }` |
| `mapReady` | po każdym `Scene_Map.onMapLoaded` (przejście, wczytanie, powrót z menu) | `{ mapId, transfer, scene }` |
| `dayStart` | numer dnia się zmienił (sprawdzane co klatkę mapy i po śnie) | `{ day, prev }` |
| `hourChange` | pełna godzina się zmieniła | `{ hour, prev, day }` |
| `sleep` / `wake` | wokół `Game_System.sleepUntilHour` | `{ day, hour, until }` / `{ day, hour, from }` |
| `miniGameStart` / `miniGameEnd` | TawernaUI: scena `Scene_MiniGame` ruszyła (`start`) / wynik doszedł (po `onEnd`, już na mapie; gdy gra nie wraca na mapę - od razu) | `{ id, scene }` / `{ id, result }` |

`id` mini-gry: `TavernShift`, `TavernDice`, `arm` (siłowanie), `darts` (rzutki) - `Scene_X.gameId` albo `opts.id`. Na `miniGame*` nikt
jeszcze nie słucha (są dla testów i przyszłych nagród); „czy trwa mini-gra” sprawdza `Tawerna.miniGameRunning()` / `isCalm`.
(`miniGame*` nadaje TawernaUI; w rdzeniu stoją na liście `Tawerna.EVENTS.systems`.)

**Zdarzenia systemów** (etap 3 - kto nadaje, kto słucha; nazwy w `Tawerna.EVENTS.systems` - od partii C/D także `heroHit`, `heroDown`,
`attack`, `shot`, `stormStart`, `stormEnd`, `lightning`, od E2 `chop`). Nadawane tam, gdzie zmienia się stan - także w scenie mini-gry
(`shiftDone`, `diceWin` przychodzą, zanim wróci mapa), więc słuchacz nie zakłada `Scene_Map`. Wtyczka, która jeszcze nie stoi na
rdzeniu, nadaje przez małe `const emit = (name, data) => { const TW = window.Tawerna; if (TW && TW.emit) TW.emit(name, data); }`
(bez rdzenia - cisza; tak ładują je testy jednostkowe).

| zdarzenie | nadaje (gdzie) | dane | słucha |
|---|---|---|---|
| `kill` ✓ | Hunting (`Hunting_Weapons` `kill()`): każde ubite zwierzę (strzał, włócznia, cios Combat, ugryzienie psa) | `{ kind, by: "hero"｜"dog", how: "shot"｜"spear"｜"melee"｜"dog"｜"", mapId, x, y (pola), level, bounty? (id zlecenia listu gończego), animal }` | HomeDecor (tylko `by: "hero"`), QuestBoard (`T.on`: zlecenia), Journal (cele), Combat (XP, `T.on`; `Hunting.onKill` usunięte) |
| `shiftDone` ✓ | TavernShift `applyResult`: zmiana skończona (przerwana - nie) | `{ grade 1-5, pay, tips, total, level, shift, done }` | HomeDecor (kufel), Story (pierwsza zmiana → `storyStep`), Journal |
| `diceWin` / `diceLose` ✓ | TavernDice_Scene `finishGame`: koniec partii (odejście od stołu = `diceLose` z `left: true`) | `{ rival, name, stake, pot, net, left }` | HomeDecor (kości, tylko `diceWin`) |
| `questDone` ✓ | QuestBoard `turnIn` | `{ id, kind (deliver, gather, craft, hunt, bounty, story), gold, title, giver, xp, rep, toDebt }` | HomeDecor (ogłoszenie z tytułem), Journal |
| `debtPayment` ✓ | Story `pay`: każda spłata (rozmowa z Lordem / Feliksem, `Story.pay`, zlecenie Feliksa) | `{ amount, paid, debt, day }` | Journal |
| `debtPaid` ✓ | Story `pay`: suma doszła do długu (raz) | `{ total, debt, day }` | HomeDecor (pokwitowanie), Journal |
| `storyStep` ✓ | Story `tell` (krok rozdziału 1, raz: jego flaga w stanie) | `{ step }`: `talk` (pierwsza rozmowa z dziadkiem), `firstShift` (pierwsza zmiana u Borgara), `chapterDone` (dług spłacony), `thanked` (dziadek dziękuje po spłacie) | Journal |
| `served` ✓ | TavernLife `pay`: zapłacona usługa | `{ service: "meal"｜"room"｜"bath"｜"song", price, dish? (meal), room? (room) }` | - |
| `levelUp` ✓ | Combat: każdy nowy poziom | `{ level }` | Combat_UI (baner „Poziom N!”); (plan: Journal) |
| `attack` ✓ | Combat_Fight: cios bohatera spadł (trafił albo nie) | `{ weapon, combo, heavy, hits }` | - |
| `heroHit` ✓ | Combat_Fight `hitPlayer`: cios wroga doszedł do bohatera | `{ result: "dodged"｜"parried"｜"blocked"｜"guardbreak"｜"hit"｜"bump", damage, by, name, hp }` | - |
| `heroDown` ✓ | Combat_Fight `hitPlayer`: bohater leży (przewrócony ciosem albo bez życia) | `{ by, name, dead }` | - |
| `shot` ✓ | Hunting_Weapons: kamień z procy albo strzała skończyła lot | `{ weapon: "sling"｜"bow", hit, kind (co trafione; pudło: ""), x, y }` | - |
| `stormStart` / `stormEnd` ✓ | Storm: burza pojawia się na niebie / minęła (widziane z mapy, także zaraz po wczytaniu) | `{ day, hour, phase, level }` (`stormEnd`: phase null, level 0) | - |
| `lightning` ✓ | Storm `strike`: każdy piorun, także pod dachem (tam bez błysku, sam grzmot) | `{ d (0 blisko .. 1 daleko), strength, x, y (px ekranu; y: koniec zygzaka albo null), bolt, outdoors, hitTree, tree, mapId }` | - (HomeAmbience dalej liczy `Storm.state.strikes`: ze zdarzeniem jej błysk byłby o klatkę krótszy) |
| `chop` ✓ | ChoppableTree (`ChoppableTree_Objects`): rzecz skończona - ścięte drzewo, wykopany pniak, rozbity kamień albo żyła rudy, ścięty krzak, rozrąbana kłoda; nadawane po zdobyczy i przełącznikach własnych | `{ kind: "tree"｜"stump"｜"rock"｜"ore"｜"bush"｜"log", id, mapId, x, y, done (nic nie zostało, ziemia wolna; ścięte drzewo zostawia pniak - false), drops: [{ item, amount }] (co weszło do plecaka), charred (drzewo zwęglone piorunem albo jego pniak), hand (podniesione bez narzędzia), event }` | - |
| `build` ✓ | Farming (`Farming_Build`): plac budowy wyznaczony (`done: false`) albo budynek stoi (`done: true`) | `{ type, x, y, mapId, done, id (numer budynku), how: "site"｜"hammer"｜"instant"｜"upgrade"｜"free"｜"direct" }` (`hammer` - ostatnie uderzenie młotkiem w plac, `instant` - rozstawione od razu: namiot, wiadro, legowisko, garnek, `upgrade` - rozbudowa, np. ognisko w trójnóg, `free` - stawianie z F9, `direct` - `Farming.build` ze zdarzeń i testów) | Combat (etap 6, `T.on`: doświadczenie za pierwszy budynek danego rodzaju - `done: true`, każde `how`, także `free`; zamiast przeglądania `_farm.buildings` co 90 klatek; przed gotowością bohatera - nowa gra, zapis sprzed Combat - to, co stoi, liczy `markExisting` jako znane, bez doświadczenia); możliwi: Journal, QuestBoard, Livestock, Dog |
| `harvest` ✓ | Farming (`Farming_Plots` `harvest`): zebrana dojrzała roślina | `{ crop, item, n, seeds, x, y, mapId }` (`crop` - rodzaj z CROPS, `item` i `n` - plon w plecaku - w planie było `amount`, `seeds` - ile nasion) | - (możliwi: Journal, QuestBoard) |
| `craft` ✓ | Farming (`Farming_Stations`): zrobiona rzecz w plecaku - zebrana z budynku (z kolejki tyle, ile zebrano naraz) albo zrobiona ręcznie; naprawy i powiększenie bukłaka - bez zdarzenia | `{ station (typ budynku, np. "kiln", albo "hand" - menu „Wytwórz...”), item, n, recipe }` | - (możliwi: Journal, QuestBoard) |
| `gainItem` | rdzeń (kandydat: dziś 4 wtyczki owijają `Game_Party.gainItem`) | `{ item, amount }` | (plan: SurvivalHUD, Journal, Combat, Spoilage) |
| `questAccepted` | QuestBoard `accept` (jeszcze nie nadaje) | `{ id, title }` | (plan: Journal, HomeLife) |
| `weather` | Survival | `{ type, power }` | (plan: HomeAmbience, Needs) |

✓ = nadawane (partie A–E); reszta to plan. Każdy nadawca ma w swoim teście jedno sprawdzenie, że zdarzenie przychodzi
(`hunting_test` - `kill`, `shot`; `dog_test`, `tavern_shift_test`, `tavern_dice_test`, `quest_board_test`, `story_test`, `tavern_life_test`;
`combat_test` - `levelUp`, `attack`, `heroHit`, `heroDown`; `storm_test` - `stormStart`, `stormEnd`, `lightning`; `tree_strike_test` -
`lightning` z trafionym drzewem i `chop` ze zwęglonym; `hold_gather_test` i `unit/choppable_tree` - `chop`; `smoke/farm` - `build`,
`craft`, `harvest`).

**Journal na szynie (B2):** słucha `kill`, `shiftDone`, `questDone`, `debtPayment`, `debtPaid`, `storyStep` (`Journal.GOAL_EVENTS`,
`priority: 10` - po innych słuchaczach, np. XP Combat za zabicie) i od razu sprawdza cele; zdarzenie w scenie mini-gry czeka na
pierwszą klatkę mapy (dymek i dźwięk na mapie, jak dawniej). Co 30 klatek sprawdza dalej wszystko, co jeszcze nie ma zdarzenia
(rzeczy w torbie, budynki, pola, picie, naprawy, zdobycz wnyków pod nieobecność). `wake` (sen przez północ) obraca dzień i
zapowiada podsumowanie. `core_fixtures_b2_test` sprawdza, że `storyStep` na mapie odhacza cel od razu, nie po 30 klatkach.

---

## 6. Rejestr numerów wstawianych zdarzeń

Zdarzenia dokładane przez wtyczki do danych mapy (pliki map zostają nietknięte). Numery są **wspólne dla całej gry**:
jeden numer = jeden właściciel na każdej mapie. Nakładanie się zakresów = błąd od razu (`Tawerna.inject` rzuca). Od partii B
**wszystkie** wstawienia idą przez `Tawerna.inject` - w grze nie ma już własnych haków `DataManager.onLoad` / `onMapLoaded` do tego.
(Rdzeń trzyma dalej te zakresy jako zarezerwowane - `reserved` w TawernaCore.js - żeby nikt inny ich nie wziął.)

| numery | właściciel | mapy | co | sposób |
|---|---|---|---|---|
| 1–899 | edytor | wszystkie | zdarzenia z edytora (dziś najwyżej 354: Map025) | - |
| 900 | *wolne* | | | |
| 901–902 | Story | 19, 24 | dziadek Stach, Lord Zaleski | `Tawerna.inject` ✓ (`when`: jest fabuła - inaczej przy `Game_Map.setup` wychodzą z danych; `fixSaved: false` - zapis ma postacie, z którymi go zrobiono); miejsce przy fotelu / drzwiach dworu ustawia własny `Game_Map.setupEvents` |
| 903–949 | *wolne* (bierz bloki po 10) | | | |
| 950 | TavernLife (plik TavernLife_Plan.js) | 1, 25, 26 | sztaluga z planem karczmy; nie wchodzi na mapę innego rozmiaru, na zajęte pola ani tam, gdzie jest plan z edytora (`<Tavern:plan>` - na mapie 1 dziś id 349) | `Tawerna.inject` ✓ |
| 951–959 | *wolne* | | | |
| 960–979 | HomeLife | 19 | kot Mruczek (+ zapas) | `Tawerna.inject` ✓ |
| 980–998 | HomeDecor | 19 | ozdoby domu dziadka | `Tawerna.inject` ✓ |
| 999 | *wolne* | | | |
| 1000–∞ | Forestry | każda (`"*"`) | posadzone sosny (z `_tw.forest`) | `Tawerna.inject` ✓; drzewo z wykopanym pniakiem znika dopiero przy `Game_Map.setup` (własny hak: rekord, przełączniki, dane) |

```js
Tawerna.inject(19, { ids: [980, 998], owner: "HomeDecor",
    build(data, mapId) { return [eventData, ...]; },   // zdarzenia spoza zakresu - pominięte (ostrzeżenie)
    when: mapId => true,        // opcja: false -> nic nie wchodzi, a przy Game_Map.setup wstawione wychodzą z danych
    fixSaved: true,             // zapis zrobiony na tej mapie: brakujące zdarzenia dochodzą, osierocone znikają
    editorWins: true });        // zdarzenie edytora na tym numerze zostaje (ostrzeżenie raz)
Tawerna.injected(19);           // { HomeDecor: [980, ...] } - co weszło przy ostatnim wczytaniu mapy
Tawerna.onMapData((data, mapId) => ...);   // dane każdej mapy zaraz po wczytaniu (np. notatki w pamięci)
```

Rdzeń sam dopisuje `meta` wstawionym zdarzeniom (silnik robi to tylko dla zdarzeń z pliku).
`core_test.js` używa w swojej stronie numerów 930–953 (tylko w teście).

---

## 7. Zegar mapy i „spokój”

```js
Tawerna.onMapUpdate((scene, n) => { ... }, { owner: "HomeDecor", name: "refresh", every: 30, calm: false, priority: 0 });
```

- Jeden hak na `Scene_Map.update` (po całym łańcuchu - po mapie, zdarzeniach i starych hakach). `every` liczy klatki,
  w których zegar mógł ruszyć; `calm: true` (albo opcje jak niżej) pomija klatki niespokojne; `priority` ustawia
  kolejność między zegarami. Zegar, który rzuci błąd, jest zgłaszany raz i wyłączany - mapa idzie dalej.
- Czas każdego zegara na klatkę: `Tawerna.debug.updaters()`.

**`Tawerna.isCalm(scene, opcje)`** - jedno wspólne „czy teraz spokojnie” (przed rozmową, szczeknięciem, pojawieniem się
zwierzęcia, dymkiem). `Tawerna.whyNotCalm(...)` mówi, co przeszkadza.

| sprawdzenie | wyrażenie | kto używa dziś |
|---|---|---|
| `onMap` | scena to aktualna `Scene_Map` | Combat, Dog, Birds, Farming, SurvivalHUD, TavernDice, TavernLife, SpeechBubbles |
| `sceneChange` | `!SceneManager.isSceneChanging()` | 12 wtyczek |
| `transfer` | `!$gamePlayer.isTransferring()` | Combat, Farming, HomeLife, QuestBoard, Story |
| `message` | `!$gameMessage.isBusy()` | 17 wtyczek |
| `event` | `!$gameMap.isEventRunning()` | 19 wtyczek |
| `eventStarting` | `!$gameMap.isAnyEventStarting()` | FreeMovement, HomeLife |
| `farmMenu` | `!$gameTemp._farmMenuOpen` (menu Q/E, stacje, menu psa) | 10 wtyczek |
| `build` | `!$gameTemp._buildMode` | 7 wtyczek |
| `miniGame` | żadna mini-gra nie trwa (TawernaUI, TavernShift, TavernDice, TavernLife) | Story |
| `lock` | `!($gameTemp._farmLock > 0)` | Farming |
| `tool` | `!$gamePlayer.isToolSwinging()` (też siedzenie, odpoczynek) | Debug, Farming, Story, ChoppableTree, Hunting |
| `canMove` | `$gamePlayer.canMove()` | Farming, Hunting, Journal, Needs, HeroLook |
| `fade` | jasność ≥ 250 i scena nie gaśnie | Atmosphere (sama jasność ≥ 250), Journal, SurvivalHUD, Story |
| `summary` | `!$gameTemp._pendingSummary` (podsumowanie dnia czeka) | Atmosphere, Story, SurvivalHUD |
| `combat` | `!$gameSystem._combatMode` (stara nazwa - prowadzi do `_tw.combat.mode`) | Combat |
| `talk` | rozmowa z popiersiami nie trwa | (nikt jeszcze) |
| `settle: n` | mapa stoi już n klatek (`scene._twFrames`) | QuestBoard (180, własny licznik `_qbT`), Story (40, `_twFrames`) |

Zestawy: **`"auto"`** (domyślny: onMap, sceneChange, transfer, message, event, farmMenu, build, miniGame),
**`"input"`** (klawisz wciśnięty przez gracza: message, event), **`"strict"`** (auto + tool, fade, summary, lock).
Zmiana pojedynczo: `{ farmMenu: false }`, `{ combat: true }`, `{ only: ["event", "message"] }`, `{ settle: 40 }`.

Kolumna „kto używa dziś” to stare, własne sprawdzenia. Przez `Tawerna.isCalm` pytają już:

| wtyczka | gdzie | opcje |
|---|---|---|
| Story | zegar mapy `chapter` (rozmowa na start, termin długu, listy) | **`"strict"`** (bez rozmowy, menu, budowy, mini-gry, przejścia, wyciemnienia, podsumowania dnia, odpoczynku, zamachu) |
| HomeDecor | OK w domu (`lookAround`: opis ozdoby) / podpowiedź nad ozdobą | `"input"` / domyślne `"auto"` |
| HomeLife | kot, dziadek (czy zajęty) | `{ only: ["event", "message", "sceneChange", "transfer"] }` |
| Journal | klawisz J, podsumowanie dnia | `{ only: ["sceneChange", "message", "event", "farmMenu", "build", "canMove"] }` |
| Birds | raport najazdów pod nieobecność | `{ only: ["message"] }` |
| Dog | menu psa (OK przy psie) | `{ only: ["onMap", "event", "farmMenu"] }` |
| QuestBoard | list gończy (zwierzę się pojawia) | `{ only: ["event", "transfer"] }` |
| TavernLife | API usług (`meal`, `bath`, `song`, `room` z testów i debugu): czy wolno zacząć (`idle`) | `{ only: ["onMap", "sceneChange", "event"] }` |
| Combat | wolna gra na mapie (`mapFreePlay`: klawisze walki, przewrót, Tab; eksport `Combat.mapFreePlay`) | `{ only: ["onMap", "sceneChange", "message", "farmMenu", "build", "event"] }` |
| Hunting | skradanie (C), strzał i celowanie (`canShoot`) | `{ only: ["canMove", "message", "event", "farmMenu", "build", "sceneChange"] }` |
| Atmosphere | autozapis po śnie | `{ only: ["message", "event", "summary"] }` + własne `$gameScreen.brightness() >= 250` (nie `fade` rdzenia: nie pyta, czy scena gaśnie) |
| SpeechBubbles | kto mówi (dymek na mapie), miejsce wyborów | `{ only: ["onMap"] }`; koniec rozmowy przy ciemnieniu - własne: jasność < 255 i ekran się nie rozjaśnia (rozjaśnianie liczy się jako jasno - inaczej niż `fade`) |
| Farming | klawisze Q / E (`Scene_Map.canUseKeyMenu`) | `{ only: ["onMap", "sceneChange", "message", "event", "farmMenu", "build", "canMove"] }` |
| Farming | drzwi chatki: wejście na próg (`checkEventTriggerHere`) / `enterHut` (`Farming_Build`, też „Wejdź do środka”) | `{ only: ["transfer", "event", "message"] }` / `{ only: ["transfer", "event"] }` |
| Farming | trzymane O przy placu budowy (`holdingOn`, `Farming_Build`) | `{ only: ["farmMenu", "build", "event", "message", "tool"] }` |
| Farming | stawianie budynku (`updateBuildMode`, `Farming_Build`: zdarzenie, wiadomość albo przejście kończy stawianie) | `{ only: ["event", "message", "transfer"] }` |
| ChoppableTree | trzymane O przy drzewie, krzaku, kamieniu, kłodzie, pniaku (`ChoppableTree_Swing`) | `{ only: ["message", "farmMenu"] }` - koniec; `{ only: ["event"] }` - czeka klatkę |

---

## 8. Tagi

```js
Tawerna.tags(x)             // { tree: args, occupy: args } - nazwy bez wielkości liter, pierwszy wygrywa
Tawerna.tag(ev, "Tavern")   // args albo null;  Tawerna.hasTag(x, "Planted");  Tawerna.tagList(x) - wszystkie po kolei
Tawerna.mapTag("Zoom")                     // notatka mapy: pierwszy <Zoom:...> (args; tekst taki, jak napisany, w .raw) albo null
Tawerna.mapFlag("Clouds", false)           // <X:on> / <X:off> -> true / false, bez nich domyślne; są oba: "on" wygrywa
Tawerna.mapFlag("FreeMove", true, "off")   // ... "off" wygrywa (<FreeMove>, <Weather:off>, <Polish:off>, <Clock:off>, <Stamina:off>)
Tawerna.mapFlag("Farm", null, "first")     // ... pierwszy wygrywa (<Farm>, <Build>)
Tawerna.parseArgs("bed room=komnata price=30 name=\"Komnata z kominkiem\"")
    // -> { raw, pos: ["bed"], kv: { room: "komnata", price: 30, name: "Komnata z kominkiem" } }
```

Co czyta `Tawerna.tags(x)`: **Game_Event** - notatka + komentarze (108/408) **bieżącej strony** (zmiana strony = nowe
tagi); **dane zdarzenia** - notatka + komentarze wszystkich stron; **strona** - jej komentarze; **tekst** - tylko on
(np. notatka); **przedmiot, mapa** - notatka. Pamięć podręczna: na zdarzenie i stronę (i treść notatki). Argumenty:
przecinki, spacje i dwukropki dzielą (`dice:grum` → `["dice","grum"]`), `klucz=wartość` (klucze małymi literami),
cudzysłowy trzymają spacje i przecinki, liczby i `true/false` zamieniane; cały tekst w `raw`.

### 8.1 Notatka mapy

Od etapu 3 wszystkie te wtyczki czytają notatkę mapy przez `Tawerna.mapFlag` / `mapTag` (liczy się samo `on` / `off`, spacje
i wielkość liter bez znaczenia - jak stare `/<X:\s*on\s*>/i`). `tests/unit/map_flags.test.js` czyta notatkę każdej mapy z `data/`
starymi wyrażeniami i nowymi wywołaniami: te same wartości.

| tag | argumenty | czyta | co robi |
|---|---|---|---|
| `<Clouds:on｜off>` | on/off | CloudShadows; jako „na dworze”: Survival, Needs, UITheme, MenuPanel, Atmosphere | cienie chmur; mapa zewnętrzna |
| `<Weather:on｜off>` | on/off | Survival, Needs (off wygrywa); UITheme, MenuPanel, Atmosphere (tylko on) | mapa zewnętrzna (pogoda, zimno) |
| `<DayNight:on｜off>` | on/off | DayNightCycle | zabarwienie pory dnia |
| `<Dust:on｜off>` | on/off | DustMotes | drobinki kurzu |
| `<Dark:on｜off>` | on/off | RoomLighting; Farming (`on` = wnętrze, bez pola) | ciemność pokoju i światła |
| `<DarkDay:N>`, `<DarkNight:N>` | liczba | RoomLighting | ciemność w dzień / w nocy |
| `<Minimap:on｜off>` | on/off | Minimap | minimapa |
| `<TimeMusic:on｜off>` | on/off | Atmosphere | muzyka pory dnia |
| `<Ambience:słowo>` | outdoor/tavern/interior/cave/off | Atmosphere | profil dźwięków otoczenia |
| `<Farm:on｜off>`, `<Build:on｜off>` | on/off | Farming | pole uprawne / budowanie na mapie |
| `<Hunt:k=v,...>` / `<Hunt:off>` | rabbit, deer, boar, wolf | Hunting | ile dzikich zwierząt |
| `<Poziom:N>` | liczba | Combat | poziom wrogów na mapie |
| `<Zoom:skala[,klatki[,x,y]]>` | pozycyjne | MapZoom | zbliżenie mapy |
| `<FreeMove:on｜off>` | on/off | FreeMovement | ruch co do piksela |
| `<Polish:off>` | off | CharacterPolish, GroundDetail | bez cieni / kępek trawy |
| `<Clock:off>`, `<Stamina:off>` | off | SurvivalHUD | bez zegara / paska sił |
| `<HomeAmbience>` | - | HomeAmbience | klimat domu na tej mapie |

### 8.2 Zdarzenia (notatka / komentarze strony)

| tag | argumenty | skąd | czyta | co robi |
|---|---|---|---|---|
| `<Tree[:k=v]>` | hits, axe, drop, dropmin, dropmax, sway, shovel, digs, digdrop, digmin, digmax, cost, digcost, fruit, fruitmin, fruitmax, scale, nostump | notatka | ChoppableTree, Minimap, Forestry | drzewo do ścinania (owocowe przy `fruit`) |
| `<Rock[:k=v]>`, `<Stump[:k=v]>`, `<Log[:k=v]>`, `<Bush[:k=v]>` | hits, tool, drop..., cost (`bare` dla krzaka) | notatka | ChoppableTree, Minimap | kamień, pniak, kłoda, krzak |
| `<Occupy:k=v>` | left, right, up, down, soft | notatka | ChoppableTree, TavernLife | zdarzenie zajmuje kilka pól |
| `<Light[:promień[,r,g,b]]>` | pozycyjne | notatka | RoomLighting, HomeAmbience | okrągłe światło |
| `<LightCone:k=v>` | length, angle, dir, width, anchor, blur, dust, dustsize, offsetx, offsety, r, g, b, when | notatka | RoomLighting, HomeAmbience (zmienia `dust`) | smuga światła |
| `<LightWhen:day｜night>`, `<LightSoft>`, `<LightFlicker[:siła[,r,g,b]]>` | | notatka | RoomLighting (+ HomeAmbience dopisuje Flicker w pamięci) | pora, miękkość, migotanie |
| `<Clock>` | - | notatka | HomeAmbience | tykanie zegara |
| `<Tavern:rodzaj atrybuty>` | `meal`, `mealtable dir plate lift`, `bath lift`, `stage`, `arm`, `darts`, `bed room price name desc minrep candle`, `door room`, `candle room`, `gate minrep`, `attendant`, `plan`, `board`, `dice[:rywal]`, (`bell` - nieużywany) | komentarze (i notatka) | TavernLife, QuestBoard (`board`), TavernDice (`dice`) | miejsca karczmy |
| `<Bust:Nazwa｜none>`, `<BustName:tekst>` | tekst | komentarze bieżącej strony, potem notatka (`Tawerna.tag`; pusty się nie liczy) | SpeechBubbles (TavernLife) | popiersie i imię w rozmowie |
| `<Story:rola>` | grandpa, lord | notatka (wstawione) | Story, HomeLife | postacie fabuły |
| `<HomeDecor:klucz>` | slot | notatka (wstawione) | HomeDecor | to zdarzenie jest ozdobą |
| `<HomeLife:cat>`, `<Planted>` | - | notatka (wstawione) | nikt (znacznik) | kot / posadzone drzewo |
| `<Guard>` | - | komentarz (Map026 ev 48) | nikt | - |

### 8.3 Przedmioty (meta silnika)

| tag | argumenty | czyta | co robi |
|---|---|---|---|
| `<Food:k=v>` | stamina, buff, hours, buff2, hours2, fed, water | Farming_Data (gdy brak w FoodTable), Farming, Journal, Debug | jedzenie |
| `<Butcher[:bird]>` | - / bird | Survival, Debug | oprawianie |
| `<Bandage>` | - | Survival, Debug | leczy ranę |
| `<Need:id,id>` | numery | Survival, Needs | potrzebny przedmiot (nóż) |
| `<Weight:N>` | liczba | Survival | ciężar |
| `<Drink:N>` | liczba | nikt (Items 129) | - |

### 8.4 Kody w tekście wiadomości

| kod | czyta | pisze | co robi |
|---|---|---|---|
| `\SPK[n]` | SpeechBubbles | Story, TavernLife | kto mówi: 0 bohater, n zdarzenie, -1 zwykłe okno |

### 8.5 Na co uważać przy przenoszeniu parserów na `Tawerna.tags`

- ChoppableTree (E2) czyta **tylko notatkę**: `Tawerna.tag(notatka, "Tree")` (tekst = sama notatka; tak samo `Rock`, `Stump`, `Log`,
  `Bush` i `<Occupy>`), z tą samą białą listą - tylko klucze znane z domyślnych, tylko liczby (`true` / `false` rdzenia się nie liczą) - i
  tą samą pamięcią na zdarzenie (`configCaches`, którą Forestry zmienia w miejscu). Przy przenosinach: 37 489 porównań starego i nowego
  odczytu na 27 mapach (1816 zdarzeń) - 0 różnic; różnice są tylko dla form notatki, których w danych nie ma. `unit/choppable_tree`
  powtarza porównanie przy każdym przebiegu (11 odczytów na zdarzenie).
- TavernLife (partia B): tag znajduje rdzeń (`Tawerna.tag(src, "Tavern")`: strona - jej komentarze, dane zdarzenia - notatka i
  komentarze wszystkich stron), rodzaj to `args.pos[0]`, ale pary `klucz=wartość` czyta **sam** z `args.raw` (własne `ATTR_RE`,
  pamięć podręczna na obiekt `args`) - rdzeń dzieli po przecinkach bez cudzysłowu, a TavernLife ma wartości z przecinkami
  (`plate=0,-2`); wartości zostają tekstem, klucze małymi literami. Akcja czyta tylko bieżącą stronę, pozycje - wszystkie
  (`tests/unit/tavern_life.test.js` sprawdza oba odczyty).
- QuestBoard `board`: `Tawerna.tagList` na **notatce** zdarzenia i na komentarzach strony 1, tag `<Tavern:board>` (`args.raw` =
  `board`); wynik zapamiętany na zdarzenie.
- TavernDice `dice`: `Tawerna.tagList` na bieżącej stronie i na stronie 1 (bez notatki), `args.raw` przez `/^dice(?:\s*:\s*(\w+))?$/i`
  (`<Tavern:dice:grum>` - tylko ten rywal).
- Silnik (`meta`) bierze **ostatni** duplikat, wtyczki - **pierwszy** (rdzeń też pierwszy).
- Sześć kopii `mapNoteFlag` („on” wygrywa) zastąpił `Tawerna.mapFlag` (etap 3); „off najpierw” (FreeMovement, `<Weather:off>`,
  `<X:off>`) i „pierwszy” (`<Farm>`, `<Build>`) to jego trzeci argument. Rdzeń przyjmuje spację przed dwukropkiem (`<Dust :on>`)
  i goły `<Hunt>` (= `<Hunt:>`: nic tu nie żyje), stare wyrażenia nie - w danych gry tego nie ma (sprawdza to test jednostkowy).
- SpeechBubbles (D1) `<Bust>` / `<BustName>`: najpierw komentarze bieżącej strony - do rdzenia idzie za każdym razem **nowy** obiekt
  `{ list: page.list }` (pamięć tagów rdzenia jest na obiekt i nie zobaczyłaby komentarza dopisanego do strony później - tak robią
  testy), potem notatka; pusty tag (`args.raw` puste) się nie liczy.

---

## 9. Kalendarz (`Tawerna.time`)

| funkcja | zwraca |
|---|---|
| `day()`, `hour()` | dzień i godzina z DayNightCycle (bez niego: 1 i 12) |
| `seasonLength()` | parametr `seasonLength` z Farming.js (28) |
| `season(d)` | 0 wiosna, 1 lato, 2 jesień, 3 zima - ten sam wzór co `Farming.seasonIndex` |
| `seasonName(d)`, `dayOfSeason(d)`, `year(d)` | „Wiosna”..., 1-28, rok od 1 |
| `period(h)` | pora dnia DayNightCycle (`dawn` 5, `morning` 8, `noon` 11, `afternoon` 15, `evening` 18, `night` 21) |
| `isNight(h)` | 21:00–5:00 |
| `around(d, n)` | n dni wokół połowy pory roku |
| `isEaster(d, n=4)`, `isWigilia(d, n=5)` | Wielkanoc 13–16 dzień wiosny, Wigilia 12–16 dzień zimy (co roku) |

Zasada: **żadnych własnych wzorów na porę roku** - tylko `Tawerna.time`. Już na nim: HomeAmbience, HomeDecor, QuestBoard, MenuPanel,
Atmosphere (śnieg pod stopami zimą), Farming (E1: `Farming.seasonIndex` / `seasonOf` to już tylko nakładka na `T.time.season`; dzień,
godzina, pora dnia w porannej wiadomości), ChoppableTree (E2: pora owoców, dzień zerwania, godzina żaru); dzień i godzinę z `T.time`
biorą też m.in. Storm, Hunting, Story, Birds, Dog; jeszcze po staremu (`Farming.seasonIndex` z zapasowym wzorem - pod spodem już
`T.time`): Survival, Needs, UITheme. Zdarzenia `dayStart` / `hourChange` /
`sleep` / `wake` zamiast pilnowania `lastDay`.

---

## 10. Dźwięk i dymki

- **`Tawerna.audio.se(nazwa, { volume, pitch, pan })`** - SE z małej puli odtwarzaczy (3 na plik). Plik, który się nie
  wczyta, **milczy** (ostrzeżenie raz) - nigdy „Failed to load” i stop gry (silnik sprawdza tylko własne bufory).
  Głośność = opcja SE gry × volume. Najwyżej `seBudget` (6) dźwięków na klatkę. `preload(nazwy)`, `isMissing(nazwa)`.
  `Tawerna.audio.stopSe()` ucisza całą pulę; rdzeń owija `AudioManager.stopSe`, więc pula milknie razem z SE silnika (polecenie
  zdarzenia „Stop SE”, początek bitwy, `stopAll` przy błędzie i końcu gry). Na `audio.se` m.in. Combat, Hunting, Storm (grzmoty,
  podmuchy), Atmosphere (wrona, żaby), Farming (E1: `playSe` - dźwięki pola, budowy i stanowisk), ChoppableTree (E2: `ChoppableTree_Objects`
  - uderzenia, upadek, rozbicie).
- **`Tawerna.audio.bgsLayer(klucz, { name, pitch, max, fadeIn, fadeOut, scale })`** - zapętlona warstwa obok BGS mapy
  (tak jak łóżka dźwięków HomeAmbience): `layer.set(cel 0..100, pan)`, co klatkę mapy płynnie do celu, gra tylko gdy
  słychać; głośność = opcja BGS × cel × `scale()`; zatrzymuje się z każdym `AudioManager.stopBgs` i wyciemnieniem sceny.
  **Tło Atmosphere zostaje prawdziwym BGS mapy** (`AudioManager.playBgs` z `fadeOutBgs` / `fadeInBgs`, partia C2), nie warstwą:
  to jedno tło naraz, które zapis gry trzyma i odtwarza po wczytaniu (jak każdy BGS), polecenia zdarzeń BGS działają na nie po
  staremu, a warstwy są dokładkami *obok* niego (HomeAmbience: ogień, kapanie, wiatr, zegar - nigdy głośniej niż tło Atmosphere).
- **`Tawerna.popup(tekst, { icon, kind, color, top, sub, gain, menu })`** - dymek nad bohaterem (SurvivalHUD).
  `kind: "need"` = czerwony (braki), `"good"`, `"info"`, `"gold"`; `top: true` - napis u góry ekranu (z drugą linią
  `sub`); `menu: true` - w menu przedmiotów pisze w oknie pomocy. `Tawerna.popup.need(ikona, "Potrzebujesz siekiery")`.
  **Braki zawsze dymkiem, nigdy oknem wiadomości** (ikona przedmiotu + „Potrzebujesz X”, bez podpowiedzi gdzie zrobić).
  Na rdzeniu (etap 3): Farming `complain`, ChoppableTree `needPopup`, braki bukłaka w Needs = `popup.need`; zwykłe dymki Farming,
  Needs i Survival (pogoda, zimno, okrzyk bez SpeechBubbles) = `popup(tekst, { icon, color })`; `Survival.feedback` =
  `popup(..., { kind: "good", menu: true })` i pamięta tekst, żeby Scene_Item wstawiła go z powrotem po ponownym wybraniu
  przedmiotu - dlatego Durability i Spoilage wołają dalej `Survival.feedback` (bez niego: `popup(..., { menu: true })`).
  Poza mapą `popup` nic nie pokazuje (jak dawniej `pushLootPopup`). Lista zdobyczy SurvivalHUD i napisy u góry - bez zmian.
  Partie C/D: Combat `popup(tekst, { icon, color, menu: true })`, Hunting to samo z `kind: "good"`, Storm (piorun w drzewo),
  Atmosphere (`top: true` - napis o autozapisie). Suma doświadczenia Combat idzie dalej przez `$gameTemp.pushTopNotice(..., { sum })`
  (SurvivalHUD dodaje, póki napis widać) - propozycja: `sum` w `popup(..., { top: true })`.

---

## 11. Zestaw UI i baza mini-gier (TawernaUI.js)

### 11.1 `Scene_MiniGame`

```js
class Scene_Kosci extends Scene_MiniGame {
    createGame() { this.setTitle("KOŚCI", "stół w sali gier", $gameParty.gold(), Tawerna.ui.COIN_ICON);
                   this.setHints([["←→", "wybór"], ["O", "rzuć"], ["P", "pauza"]]); ... }
    begin()      { this.showCard({ kicker: "ZASADY", title: "Kości", lines: [...], bust: "People3_5" }); }
    tick()       { if (this.trig.ok) ...; if (this.rep.left) ...; if (this.mouse.click) ... }   // jeden krok logiki
    frame()      { ... }                                   // raz na klatkę (rysowanie)
    helpLines()  { return ["...pomoc na karcie pauzy..."]; }
    quitResult() { return { lost: this.stake }; }
    state()      { return Object.assign(super.state(), { ... }); }   // dla testów
}
Tawerna.ui.open(Scene_Kosci, { onEnd: wynik => ..., seed: 42, turbo: 3 });   // false: inna już trwa
this.end({ won: true, net: 50 });   // koniec: wynik do onEnd już NA MAPIE, potem zdarzenie miniGameEnd
```

- **Klawisze**: O = `trig.ok`, P = `trig.back` (w grze: pauza), strzałki/WASD `keys/trig/rep` (powtarzanie po 18
  krokach co 5), Q/E `pageup/pagedown`, Shift; klawisze trzymane z mapy nie liczą się. **Mysz**: `this.mouse` (x, y,
  moved, click, cancel, down); `touchOk` - kliknięcie gdziekolwiek = O.
- **Pauza** (P): karta „Pauza” z pomocą gry i wyborem *Gramy dalej* / *Wyjdź z gry* (`quitLabel()`) = pytanie przed
  wyjściem; `askQuit("Odejść od stołu?")` - samo pytanie; `quit()` kończy z `{ aborted: true, ...quitResult() }`.
- **Karty** na nakładce: `showCard(spec, onClose)` (zasady, wynik - z popiersiem), `showChoice({ title, lines, options,
  cancel, onPick })`.
- **Testy**: `seed` (ta sama gra: `this.rng()`, `rng.int/pick/chance`), `turbo` 1–40 kroków na klatkę,
  `Scene_MiniGame.onTick = scene => ...` (co krok), `Tawerna.ui.running`, `Tawerna.ui.lastResult`, `scene.state()`.
- **Warstwy sceny** (od spodu): rozmyta mapa (raz) + cień → `stage` (gra) → popiersia `bustL`/`bustR` → `fx` (baner,
  monety, cząstki) → dymki `bubbleL`/`bubbleR` → `hud` (pasek tytułu, podpowiedzi) → `overlay` (karty) → wyciemnienie.
- Dźwięki UI: `this.se("cursor" | "ok" | "cancel" | "buzzer" | "coin" | "coins" | "page" | "win" | "lose")` - przez
  bezpieczną pulę.
- **Do nadpisania w grze** (partia B): `ticksThisFrame()` - ile kroków logiki w tej klatce (domyślnie `turbo`; TavernDice x3,
  gdy trzymane O pogania rywala); `testHook()` / `dropTestHook()` - hak testów wołany przed każdym krokiem (domyślnie
  `Scene_MiniGame.onTick`; TavernShift → `TavernShift.onTick`, TavernDice → `TavernDice.onTick`, gry TavernLife → `GAME.onTick`;
  hak, który rzuci, jest zdejmowany); `keyDown(k)` - czy klawisz (`ok`, `back`, strzałki, `pageup/pagedown`, `shift`) jest
  wciśnięty teraz (z niego `keys/trig/rep`; `touchOk`: dotyk = O); `preload(bitmap)` - obrazek spoza ImageManagera
  (`loadBust`, `safeBitmap`), na który scena czeka przed startem, brakujący plik - nie czeka (TavernShift: popiersie Borgara).
- `gameId` (statyczne pole klasy albo `opts.id`) idzie w `miniGameStart/End`: `TavernShift`, `TavernDice`, `arm`, `darts`.
  `opts.backdrop: "solid"` - czarne tło zamiast rozmytej mapy.

### 11.2 Elementy (`Tawerna.ui.*`)

| element | co | wzięty z |
|---|---|---|
| `Panel(w, h, { title, cut, fill, accent })` | panel w stylu HUD | UIStyle.panel |
| `TitleBar` → `set(tytuł, pod, prawo, ikona)` | pasek u góry mini-gry | TavernDice `drawHeader` |
| `KeyHints` → `set([[klawisze, opis], ...], prawo)` | pasek podpowiedzi na dole (wyśrodkowany, rysowany od nowa tylko przy zmianie). **`set([])` tylko czyści** bitmapę - pod kartami chowaj sprite (`hints.visible = false`, jak `showHud` w TavernLife) | TavernDice `keyCap/keyHints` |
| `ButtonRow(w, h)` → `set(przyciski, fokus)`, `move(±1)`, `hitAt(x, y)` | rząd przycisków (wyłączone pomijane) | TavernDice `drawButton`, QuestBoard |
| `IconList(w, h, { title })` → `set(wiersze)`, `select`, `move`, `hitAt` | lista z ikonami, przewijana | menu gry, MenuPanel |
| `Meter(w, h, { label, thresholds })` → `set(ratio, tekst)` | pasek z opisem | UIStyle.bar, TavernShift |
| `Banner` → `show("bust"｜"win"｜"lose"｜"turn"｜"hot", tytuł, pod, życie, y)` | „Pudło!”, „Wygrana!”, „Twoja tura”; `y` - tym razem wyżej / niżej; `ticked = true` - rusza się tylko w `tick()` (krokach logiki: turbo i poganianie przyspieszają go tak samo) | TavernDice `BannerSprite` |
| `CoinFly(a, b, { delay, duration, icon, bitmap, scale, arc, onArrive })`, `coinBurst(rodzic, n, a, b, { onEach, onDone, gap, spread, se, sound })` | monety lecące do sakiewki (brzęk co druga); `ticked = true` - leci tylko w `tick()` (zwraca `false`, gdy wylądowała) | TavernDice `CoinFly`, QuestBoard |
| `Bust(strona)` → `show`, `dim`, `jolt`, `hop`, `box()` | popiersie w rogu (wjeżdża, przygasa); `ticked = true` - tylko w `tick()` | TavernDice `BustSprite` |
| `Bubble(strona)` → `say(tekst, klatki)` | dymek nad popiersiem | TavernLife `bubbleBitmap` |
| `ParchmentCard(w, h, { seed, shade, torn, crease, title, lines, write })` | pergamin (tekstura QuestBoard_Paper, poszarpany brzeg, atrament) | QuestBoard `drawPaper` |
| `drawPaper(ctx, w, h, { seed, shade, torn, crease, rng, paper, out })`, `paperOutline(w, h, R, torn)` | sam pergamin na kontekście; `rng` - strumień wołającego zamiast ziarna (rysuje nim dalej: `R()`, `R.int(a, b)`), `paper` - tekstura jako Bitmapa wołającego, `out` - dostaje obrys `{ path, pts, tear }`; zwraca, czy tekstura już była | QuestBoard `drawPaper` / `paperOutline` |
| rysowanie: `panel`, `bar`, `dirty`, `text`, `wrap`, `measure`, `icon`, `arrow`, `keyCap`, `keyHints`, `button`, `brackets`, `dim`, `drawCard`, `drawChoiceCard`, `inkText`, `inkWrap`, `bubbleBitmap` | na bitmapie (`panel`/`bar` = UIStyle + `dirty`) | TavernDice, TavernLife, QuestBoard |
| `loadBust`, `safeBitmap` | obrazki poza pamięcią ImageManagera - brak pliku nie zatrzyma gry | TavernDice, SpeechBubbles |
| `heroBust()`, `bustOf(ev)`, `bustHeight()` | popiersie bohatera / postaci (przez SpeechBubbles) | SpeechBubbles |
| `ensureFonts()`, `inkFont.hand/handBold/caps`, `INK` | czcionki pergaminu: QB Hand (Caveat), QB Caps (Alegreya SC) | QuestBoard, TavernLife |
| `rng(seed)`, `ease.out/inOut/back` | losowość z ziarnem, wygładzanie | wszystkie mini-gry |

Kto używa dziś (grep `ui.`): TavernShift (`Scene_MiniGame`, `preload`, `testHook`, `keyCap`, `panel`, `bar`), TavernDice_Scene /
_Art (`Scene_MiniGame`, `Banner`/`Bust`/`CoinFly` z `ticked`, `ticksThisFrame`, `testHook`, `keyHints`, `button`), gry TavernLife
(`Scene_MiniGame`, `Banner` w rzutkach, `panel`, `text`), TavernLife_Render (`coinBurst`, `keyHints`), TavernLife_Plan (`keyHints`,
`inkFont`), QuestBoard_Art / _Scene (`drawPaper`, `paperOutline`, `inkWrap`, `inkFont`, `ensureFonts`), MenuPanel (`panel`, `bar`,
`style`). `IconList`, `ButtonRow`, `Meter`, `TitleBar` jako sprite'y - tylko `Scene_MiniGame` i `core_test.js`.

Podgląd: `docs/architektura/minigra_karta.png`, `minigra_pauza.png`, `minigra_demo.png` (mała gra z `core_test.js`).

### 11.3 Menu P (MenuPanel.js) i jego wpisy

Wygląd menu P (czerń i żółć, uzgodniony) zostaje własny: nagłówek (tytuł 28 px z krótką żółtą kreską, podtytuł z prawej) i płaskie
podpowiedzi klawiszy (ciemny klawisz z białym napisem, opis szary) to nie `TitleBar` / `KeyHints` zestawu - te mają wygląd mini-gier
(żółte pogrubione klawisze, rysowane strzałki, własny pasek). Panele i paski rysuje zestaw: `ui.panel` / `ui.bar` (to samo
UIStyle + `dirty`). Porównanie bitmap przed i po przeniesieniu (menu P, plecak, Postać, dziennik, koniec gry): piksel w piksel.

Wpisy innych wtyczek (wołane przy wczytaniu; wtyczka stoi niżej na liście niż MenuPanel):

```js
const MP = Tawerna.api("MenuPanel");
MP.addCommand({ symbol: "tavernPlan", label: "Plan karczmy", owner: "TavernLife_Plan",
    when: () => wKarczmie(),                        // czy jest w menu tym razem (sprawdzane przy każdym otwarciu)
    enabled: () => true,                           // opcja (albo true / false)
    glyph: (ctx, x, y, size, colour) => ...,       // mały rysunek w polu size x size (22 px), w jednym kolorze
    badge: () => 0,                                // opcja: żółta liczba z prawej (jak punkty przy Postaci)
    ok: scene => SceneManager.push(Scene_X) });    // Enter
MP.addFoot({ owner: "Story", when: () => aktywna(),
    draw(bitmap, area) { ... } });                 // area: { x (koniec klawiszy), y (ich linia), right (brzeg), room (right - x), rect }
MP.commands();                                     // ["tavernPlan"] - dopisane komendy
```

- Komenda staje za komendami dokładanymi po staremu (`addOriginalCommands`: Dziennik z Journal, Postać z Combat), przed Opcjami;
  potem MenuPanel układa kolejność: Postać, Plecak, Dziennik, reszta jak przyszła. Ten sam `symbol` (i ten sam `owner` stopki)
  drugi raz - wtyczka włożona do strony dwa razy - zastępuje stary wpis. Wpis, który rzuci błąd, trafia do konsoli, a menu działa
  dalej (błąd w `ok` z powrotem aktywuje listę).
- Na API: „Plan karczmy” (TavernLife_Plan: `when` = bohater na piętrze karczmy, rysunek mapy z planu) i linia długu (Story:
  `drawDebtFoot` dostaje `area.room` - nie mierzy już sama klawiszy MenuPanel). Bez MenuPanel obie wtyczki robią to po staremu
  (zwykła komenda; linia pod kartą postaci).
- Po staremu zostają: Journal i Combat (`addOriginalCommands` + `setHandler`; etykietę, rysunek i liczbę punktów daje im MenuPanel),
  scena Postaci (Combat_UI `Scene_Hero`: `MenuPanel.Sprite_MenuPanel`, `HEAD/TABS/FOOT`) i dziennik (MenuPanel owija `Journal.Scene_Journal`).
  Debug nie ma wpisu w menu P (jego F9 to `Scene_MenuBase`, więc bez przycisków dotykowych jak reszta menu).
- Eksport: `panelRect(kind)`, `SIZES`, `HEAD`, `FOOT`, `TABS`, `Sprite_MenuPanel`, `Window_ItemDetail`, `addCommand`, `addFoot`,
  `commands()`; zarejestrowany (`Tawerna.api("MenuPanel")`).

---

## 12. Kolejność warstw rysowania (zmierzona 2026-09-28 w grze, dom dziadka i pole; karczma - z kodu, 2026-09-29)

```
Scene_Map (od spodu)
 0  Spriteset_Map
      _baseSprite: czarne tło, paralaksa, Tilemap
          Tilemap wg z: 0 kafle dolne · 0.5 dywany/obrus (HomeDecor) · 0.8 kępki trawy (GroundDetail)
                        · 1 uprawy, postacie „pod” (Farming_Render) · 1.2 kałuże (Puddles) · 1.5 zbieractwo (Farming_Render)
                        · 2 cienie · 2.2 znacznik celu · 2.35 siatka · 2.4 widmo budowy · 3 postacie
                        · 4 kafle górne · 5 nad postaciami · 6 · 7 odpryski (ChoppableTree_Render: Sprite_HitFxLayer) · 8 walka (Combat_UI)
                        · 9 celownik (Hunting_Weapons), cel kliknięcia
                        (iskry i para HomeAmbience biorą z samego paleniska - nad nim, pod tym, kto stoi przed nim)
                        dom dziadka (HomeLife): 5 śpiący dziadek (nad wezgłowiem łóżka) · 8 efekty kota i dziadka
                        karczma (TavernLife_Render): 3 talerze, kufle, świece w wynajętych pokojach (jak postacie)
                                                    · 5 para, nuty, krople; poświata świecy - w _roomLightingContainer
                                                      (z otworem w ciemności pokoju), bez RoomLighting na z 5
      Sprite_Smoulder, Sprite_StormLeaves (Storm)
      _nightLight (Farming_Render: ciemność nocy na dworze)       ← oświetlenie
      _farmGlowLayer (Farming_Render: poświata ognisk)
      Weather (silnik)
      Sprite_SunRays, Sprite_StormSky (Storm)
      _dustContainer (DustMotes)
      _roomLightingContainer (RoomLighting: ciemność pokoju + światła)
      Sprite_CloudShadow × 36 (CloudShadows, tylko na dworze)
      HomeAmbience: widoki okien → kurz w smugach → nastrój (mnożenie, ciepło, winieta, błysk)   ← grading
      _pictureContainer (obrazki zdarzeń)                          ← obrazki
      _timerSprite
 1  Sprite_SneakBadge (Hunting)
 2  Sprite_StockStrip (Dog)
 3-6 Sprite_WeaponPlate, Sprite_XpBar, Sprite_ModeBadge, Sprite_LevelBanner (Combat_UI)
 7  _hudLayer (SurvivalHUD):                                       ← HUD
      Sprite_SurvivalHud → Sprite_LootLayer (dymki nad bohaterem) → Sprite_GainFeed → Sprite_DayBanner
      → Sprite_TopNotice → Sprite_GoalTracker (Journal) → Sprite_Minimap
 8  Sprite_Barks (SpeechBubbles)
 9  Sprite_TalkBusts (SpeechBubbles)                               ← popiersia
10  _tavernCoins (TavernLife_Render: monety płacenia w karczmie)
    (tylko gdy otwarta) przyciemnienie + Sprite_TavernCard (TavernLife_Render: karta dań / pokoi; lista na niej to okno)
11  WindowLayer: MapName, Message, ScrollText, Gold, NameBox, ChoiceList, NumberInput, EventItem, Help,
                 FarmTitle, FarmList, FarmTip (Farming_UI)        ← okna
12  znacznik mówiącego (SpeechBubbles)
13  _farmPointer (Farming_UI)
14  _decorTip (HomeDecor, tylko w domu)
```

Zasada na nowe warstwy: **efekt świata** - w Spriteset_Map (nad oświetleniem, pod obrazkami); **HUD** - do `_hudLayer`;
**coś nad oknami** - tylko wskaźniki przyklejone do okna. Nie wkładaj niczego między `WindowLayer` a znacznik mówiącego.
(Plan, jeszcze niezrobiony: `Tawerna.layer(scene, "hud" | "worldFx" | "overWindows")` zamiast ręcznego `addChildAt`.)

Sceny poza mapą mają swoje warstwy: mini-gry - `Scene_MiniGame` (sekcja 11.1); menu (MenuPanel) - panel `Sprite_MenuPanel` tuż
pod `WindowLayer` sceny (okna bez ramek i tła leżą na nim); tablica zleceń i plan karczmy - własne sceny (QuestBoard_Scene,
TavernLife_Plan).

---

## 13. Pliki danych i teksty

| co | gdzie | kto pisze |
|---|---|---|
| mapy, przedmioty, aktorzy, system | `data/*.json` | edytor; narzędzia w `tools/` tylko przy zamkniętym edytorze; wtyczki **nigdy** nie zapisują, zmieniają tylko w pamięci (`Tawerna.onMapData`) |
| uprawy, budynki, przepisy, jedzenie | `js/plugins/Farming_Data.js` | ręcznie |
| drzewka umiejętności | `js/plugins/Skills_Data.js` | ręcznie |
| bloki generowane w wtyczkach | `// <decor-data>` w HomeDecor (tools/house/decor/make_decor.py), `PLAN_DATA` w TavernLife (tools/tavern/plan/make_plan.py) | tylko generator - nie edytować ręcznie |
| teksty w grze | tablice na górze wtyczki (`LINES`, `EARNED_NOTE`, przepisy), rozmowy przez `\SPK[n]` | ręcznie, po polsku |
| grafiki | `img/characters` (`!House_Decor`...), `img/pictures` (`*_Bust`), `img/system` (`QuestBoard_*`, Window.png) | PixelLab + narzędzia |
| czcionki | `fonts/` (Alegreya Sans, Alegreya SC, Caveat + licencje OFL) | - |

Zasady: nowe tabele do `Nazwa_Data.js` (edytor go nie rusza, ładuje się synchronicznie jak każda wtyczka); żadnych
tekstów w środku logiki; zapis plików z Pythona zawsze binarnie, z zachowaniem LF/CRLF danego pliku.

---

## 14. Strategia przenoszenia (etap 3 i dalej)

1. **Najpierw adaptery** - zrobione: rdzeń, zestaw UI, rezerwacje numerów, aliasy dawnych kluczy stanu (stary kod
   działa bez zmian obok nowego).
2. **Potem wtyczka po wtyczce** (lista niżej), **nigdy wszystko naraz**. Jeden krok = jedna wtyczka (albo ciasna grupa).
3. **Po każdym kroku testy na zielono**: testy tej wtyczki, `core_test.js`, `core_fixtures_test.js` i `core_fixtures_b2_test.js`
   (stare zapisy), `node tests/run.js smoke`, `node tests/run.js unit`. Kilka wątków naraz: każdy na swoim porcie (`--port`; przy
   porcie innym niż 9396 wyniki idą do `tests/out_<nazwa>_p<port>.txt` - `docs/TESTY.md`); przy pełnym obciążeniu procesora
   strona gry potrafi wczytać się w połowie (losowe „brak X.js”, `SceneManager is not defined`, przekroczony czas) - wtedy
   powtórzyć test, zanim się go uzna za zepsuty.
4. **Nazwy wtyczek bez zmian** (edytor trzyma parametry po nazwie), parametry bez zmian, API `window.Nazwa` bez zmian
   (testy i inne wtyczki go używają) - najwyżej dochodzą nowe rzeczy.

Przepis na jedną wtyczkę (tak przeszły HomeDecor, HomeAmbience, HomeLife):

1. Kopia pliku do `backup_art_<data>/refactor/`.
2. Nagłówek: `@base TawernaCore`, `@orderAfter TawernaCore`; na starcie `const T = window.Tawerna; if (!T) throw ...`.
3. Stan: `T.state.define(klucz, domyślne, { version: 1, adopt: "_staryKlucz" })`.
4. `DataManager.loadMapData/onLoad` + `onMapLoaded` → `T.inject(...)` (numery z sekcji 6) albo `T.onMapData`.
5. `setupNewGame` / `extractSaveContents` / `Game_Map.setup` → `T.on("newGame" | "load" | "mapLeave" | "mapEnter" | "mapReady")`.
6. `Scene_Map.update` → `T.onMapUpdate(fn, { owner, name, every })`; własne „busy()” → `T.isCalm(scene, opcje)`.
7. Regexy tagów → `T.tag/tags/mapFlag`; pora roku → `T.time`; dymki → `T.popup`; SE → `T.audio.se`;
   `window.X && X.f` → `T.api("X")` / `T.call("X", "f")`.
8. Na końcu `window.Nazwa = T.register("Nazwa", {...})`.
9. **Zostają własne haki**, które są zachowaniem tej wtyczki, nie hydrauliką: `Game_Event.setupPageSettings`, sprite'y,
   przycisk akcji, `performTransfer` z warunkiem sprzed przejścia.
10. Testy: zwykły przebieg + kolejność jak po rejestracji (kit: `beforeLoad` z listą jak w `core_test.js`). Przegląd diffu
    (`git diff --stat` - tylko zmienione linie).

Czego nie robić: zmieniać kształtu zapisu bez migracji; przenosić haków, których kolejność ma znaczenie, bez testu;
zmieniać nazw plików; ruszać obcych wtyczek.

### 14.1 Lista na etap 3 (od najmniejszego ryzyka)

| # | wtyczka | co z rdzenia | ryzyko | wielkość |
|---|---|---|---|---|
| 1 ✓ | **Debug** | zakładka F9 z `Tawerna.debug.lines()` (stany, numery, zegary z czasem) | niskie | S (~40 linii) |
| 2 ✓ | **DayNightCycle, CloudShadows, DustMotes, RoomLighting, Minimap, Atmosphere** (`mapNoteFlag`), **CharacterPolish, GroundDetail, SurvivalHUD** (`<X:off>`) | `mapFlag`/`mapTag`; RoomLighting `noteNumber` → `mapTag(...).raw` | niskie (FreeMovement: „off” najpierw) | S (~10 linii każda) |
| 3 ✓ | **Durability, Spoilage, Needs, Survival** (dymki), **ChoppableTree** `needPopup`, **Farming** `complain` | `Tawerna.popup` (Survival.feedback = `popup(..., { menu: true })`) | niskie | S |
| 4 ✓ | **HomeAmbience/HomeDecor/HomeLife** - rejestracja w plugins.js | - | niskie | - |
| 5 ✓ | **Hunting** (tylko nadawanie) | `emit("kill", { kind, by, how, ... })`; HomeDecor bez owijania `Hunting.hit` | średnie | S (~20) |
| 6 ✓ | **TavernShift, TavernDice, QuestBoard, Story** (tylko nadawanie) | `shiftDone`, `diceWin/diceLose`, `questDone`, `debtPaid`, `storyStep` ✓; HomeDecor i Journal słuchają ✓ | niskie–średnie | S (~10 każda) |
| 7 ✓ | **Forestry** | `inject("*", { ids: [1000, Infinity] })` + reguła wykopanego pniaka przy `setup`; `state adopt _forest`; `dayStart` zamiast `lastDay` | średnie (zapisy z drzewami) | M (~80) |
| 8 ✓ | **Story** | `inject([19, 24], { ids: [901, 902], when: aktywna, fixSaved: false })`; `state adopt _story`; `calm` → `isCalm(scene, "strict")`; `emit debtPaid` | średnie (start fabuły, story_test 62) | M (~120) |
| 9 ✓ | **Birds, Livestock, Dog** | `state adopt`; `onMapUpdate every`; `Game_Map.setup` → `mapEnter`; `isCalm` dla dymków | średnie | M |
| 10 ½ | **Spoilage, Durability, Needs, Journal** (reszta) | `dayStart/hourChange/sleep`; Journal: cele z szyny zamiast co 30 klatek | średnie | M |
| 11 ✓ | **Scene_TavernGame** (TavernLife: siłowanie, rzutki) → `Scene_MiniGame`; plan: `inject(950)`; `state adopt _tavernLife` | `drawGameCard` → `ui.drawCard`, pauza, `GAME.end` → onEnd; aliasy `TavernLife.gameState/onTick` zostają | średnie–wysokie | L (~400; warto wydzielić `TavernLife_Plan.js`) |
| 12 ✓ | **TavernDice** → `Scene_MiniGame` + `ui.*` | usuwa ~600 linii kopii (klawisze, przyciski, baner, monety, popiersia, pula SE → `audio.se`) | wysokie (3482 linii, duży test) | L |
| 13 ✓ | **TavernShift** → `Scene_MiniGame` | pauza, karty, podpowiedzi, turbo/seed | wysokie (2665) | L |
| 14 ✓ | **QuestBoard** | `drawPaper` / `paperOutline` / `inkWrap` / `ensureFonts` z zestawu; scena i monety zostały własne (plan był: `ParchmentCard`, `KeyHints`, `coinBurst`) | średnie–wysokie | L |
| 15 ✓ | **MenuPanel** | `ui.panel/bar`, `T.api/call/time`, API `addCommand/addFoot` (Plan karczmy, dług); nagłówek i podpowiedzi zostały własne - inny, uzgodniony wygląd niż `TitleBar/KeyHints` | średnie | M |
| 16 ✓ | **SpeechBubbles** | tagi `<Bust>` / `<BustName>` przez `Tawerna.tag`; `bustBitmap` = sprawdzenie + `ui.loadBust` (jeden obrazek dla rozmów i mini-gier); zegary mapy, `isCalm`, słuchacze `mapEnter` / `newGame` / `load` | średnie | M |
| 17 ✓ | **Farming** (Farming_Render i Farming_Data - bez zmian) | `state adopt _farm` (alias dla 8 czytelników), `isCalm` (Q/E, drzwi chatki, trzymane O, stawianie), `T.time` (`seasonIndex` jako nakładka), `mapEnter` / `wake` / `load` / `newGame` zamiast owijania, jeden zegar mapy, `audio.se`, `T.api/call`; nadaje `build`, `harvest`, `craft`; podział na `Farming_Plots`, `_Build`, `_Stations`, `_UI` | wysokie | XL |
| 18 ✓ | **ChoppableTree** | `readConfig` i `<Occupy>` → `Tawerna.tag(notatka)` z tą samą białą listą i pamięcią; `state adopt _treeFruit/_smoulder`; zegar mapy `fruit`, `isCalm` przy trzymanym O, `T.time`, `audio.se`, `popup`; nadaje `chop`; podział na `ChoppableTree_Objects`, `_Swing`, `_Render` | wysokie (każdy obiekt mapy) | L |
| 19 ✓ | **Combat** | `state` `hero` (adopt `_hero`) i `combat` (`_combatMode/_combatHand` przy wczytaniu), `mapFreePlay` → `isCalm({ only })`, `emit levelUp/heroHit/heroDown/attack`, `kill` przez `T.on`; podział na `Combat_Fight`, `Combat_UI` | wysokie | L |
| 20 ½ | **Hunting** (reszta) ✓, **Storm** ✓, **Atmosphere** ✓; **Puddles, Survival, Needs, Minimap, UITheme** - jeszcze nie | `state`, `onMapUpdate`, `emit` (Hunting `shot`, Storm `stormStart/stormEnd/lightning` ✓; Survival `weather` - plan); Atmosphere bez `audio.bgsLayer` (sekcja 10) | średnie | M–L |
| - | ActorPictures, AltMenuScreen, AltSaveScreen, OptionEx, HDLayout, ButtonPicture, TextPicture | nigdy (obce) | - | - |

**Partia A (2026-09-29) - co zrobione:**

- **1 Debug:** czwarta zakładka „Rdzeń” (Q / E; tylko do czytania, OK czyta jeszcze raz): `Tawerna.debug.lines()` - czas zegarów na
  klatkę, stany z wersjami, każdy zegar mapy z ms, numery zdarzeń z właścicielami, co wstawiono na tej mapie, słuchacze szyny; za
  szeroka linia łamie się po przecinku. Reszta F9 bez zmian. Podgląd: `docs/architektura/f9_rdzen.png`.
- **2 znaczniki mapy:** CloudShadows, DayNightCycle, DustMotes, RoomLighting (+ `<DarkDay>`/`<DarkNight>` przez `mapTag`), Minimap,
  Atmosphere (`<TimeMusic>`, `<Ambience>`), CharacterPolish, GroundDetail, SurvivalHUD, FreeMovement, Farming (`<Farm>`, `<Dark>`,
  `<Build>`), MapZoom (`<Zoom>` z `.raw`), Combat (`<Poziom>`), Hunting (`<Hunt>`), Survival, Needs, UITheme, MenuPanel.
- **3 dymki:** Farming, ChoppableTree, Needs, Survival, Durability, Spoilage (sekcja 10).
- **5, 6 (nadawanie):** zdarzenia z sekcji 5 (+ `debtPayment`, `served`). HomeDecor słucha szyny: bez owijania `Hunting.hit`, bez
  odpytywania co 120 klatek i przy każdej mapie - stan innych wtyczek czyta już tylko przy wczytaniu gry (stary zapis) i przy
  `HomeDecor.refresh()`.
- Nagłówki: `@base TawernaCore` + `@orderAfter TawernaCore`. Wtyczki bez testów jednostkowych rzucają czytelny błąd bez rdzenia;
  Farming i Hunting (piaskownica `tests/unit` ładuje je bez rdzenia) biorą `window.Tawerna` bez rzucania. (Po partii B TavernShift,
  TavernDice, QuestBoard, Story i TavernLife też rzucają bez rdzenia - testy jednostkowe ładują je z nim; po partii D2 także Hunting.)

**Partia B (2026-09-29) - co zrobione** (B1: Story, Forestry; B2: Birds, Livestock, Dog, Journal; mini-gry tawerny):

- **6** dokończone: Story nadaje `storyStep` (sekcja 5), Journal słucha szyny.
- **7 Forestry:** `inject("*", [1000, ∞])` (sosny z `_tw.forest`), wykopany pniak znika przy `Game_Map.setup` (własny hak), wzrost na
  `dayStart` i `mapReady`; `state adopt _forest`.
- **8 Story:** `inject([19, 24], [901, 902], when: fabuła, fixSaved: false)`, `state adopt _story`, zegar mapy `chapter` z
  `isCalm(scene, "strict")`, `debtPayment` / `debtPaid` / `storyStep`, `shiftDone` → pierwsza zmiana.
- **9 Birds, Livestock, Dog:** stany `birds`, `dog` (Livestock bez stanu), zegary mapy, `load` / `mapEnter` zamiast `Game_Map.setup`,
  `isCalm` dla raportu najazdów i menu psa. Stare zapisy: `core_fixtures_b2_test` (pies z `day40_farm` wychodzi przy budzie).
- **10 ½:** Journal - stan `journal`, cele od razu po zdarzeniu szyny (+ co 30 klatek reszta), `wake`. Spoilage, Durability, Needs
  jeszcze bez `dayStart/hourChange/sleep`.
- **11 TavernLife:** gry (siłowanie, rzutki) na `Scene_MiniGame` (pauza, karty, popiersia, baner, `GAME.onTick` jako `testHook`),
  sztaluga planu przez `inject(950)`, `state adopt _tavernLife`; podział na `TavernLife_Render`, `_ArmWrestle`, `_Darts`, `_Plan`
  (`TavernLife.lib` dla części). Stary zapis: `tavern_life_save_test`.
- **12 TavernDice:** scena stołu na `Scene_MiniGame` z `ui.Banner/Bust/CoinFly` (`ticked`), `ticksThisFrame` (poganianie),
  `testHook` (`TavernDice.onTick`), `state adopt _dice`; podział na `_Data`, `_Art`, `_Scene`.
- **13 TavernShift:** `Scene_MiniGame` (pauza, karty, podpowiedzi, turbo / ziarno, `preload` popiersia Borgara), `state adopt
  _tavernShift`; podział na `_Hall`, `_Parts`.
- **14 QuestBoard:** pergamin z zestawu (`drawPaper` z `rng/paper/out`, `paperOutline`, `inkWrap`, `inkFont`, `ensureFonts`),
  `state adopt _quests`, `kill` przez `T.on`, `isCalm` dla listów gończych; scena i lecące monety (z arkusza tablicy) zostają
  własne; podział na `_Data`, `_Art`, `_Scene`.

**Partia C1 (2026-09-29) - MenuPanel (15):** na rdzeniu i zestawie (`T.api/call/has` zamiast `window.X`, pora roku z `T.time`,
panele i paski `ui.panel/bar`, `@base TawernaUI`), zarejestrowany; API wpisów `addCommand` / `addFoot` (sekcja 11.3) i na nim
„Plan karczmy” (TavernLife_Plan) oraz linia długu (Story - bez własnej kopii mierzenia klawiszy). Nagłówek i podpowiedzi zostają
własne (wygląd menu uzgodniony; `TitleBar` / `KeyHints` zestawu to wygląd mini-gier). MenuPanel nie ma stanu, tagów, dymków ani
sprawdzania spokoju; dźwięki kursora i brzęczyka to systemowe `SoundManager` (z bazy danych), nie pliki SE. Wygląd sprawdzony
bitmapa w bitmapę ze starą wersją.

**Partia C2 (2026-09-29) - Storm i Atmosphere (20, część):**

- **Storm:** stan `stormTrees` (adopt `_stormTrees`), zegar mapy `Storm.sky`, niebo czytane też przy `createWeather` (`readSky`),
  `T.time` / `T.api` / `T.call`, grzmoty i podmuchy przez `audio.se`, `popup` (piorun w drzewo); nadaje `stormStart` / `stormEnd` i
  `lightning` (sekcja 5). `weather` zostaje planem dla Survival.
- **Atmosphere:** zegar mapy `Atmosphere.sound`; autozapis po śnie z `T.on("wake")` zamiast owijania `sleepUntilHour` (kolejność ta
  sama: po podsumowaniu dnia z Journal), czeka na `isCalm({ only: ["message", "event", "summary"] })` i własną jasność ≥ 250; wrona i
  żaby przez `audio.se`, napis o autozapisie `popup({ top: true })`; tło zostaje prawdziwym BGS mapy (sekcja 10). `atmosphere_test`
  sprawdza szum wody przy udawanym stawie (na żadnej mapie nie ma wody - tak ma być).

**Partia C3 (2026-09-29) - Combat (19):** `Combat.js` (541 linii: klawisze, stan, atrybuty, poziomy, doświadczenie, umiejętności, API i
**wszystkie** haki silnika), `Combat_Fight.js` (oddech, bronie, ciosy, przewrót / blok / parowanie, `hitPlayer`, hitstop, walka co
klatkę), `Combat_UI.js` (warstwa walki, pasek doświadczenia, baner poziomu, ekran Postaci); wspólna torba `Tawerna.api("Combat_parts")`.
Stan `_tw.hero` (adopt `_hero`) i `_tw.combat { mode, hand }` (stare `_combatMode` / `_combatHand` przechodzą przy wczytaniu; stare
nazwy - getter/setter na `Game_System.prototype`). Szyna: słucha `kill` wprost (`T.on`), nadaje `levelUp` (słucha Combat_UI - baner),
`heroHit`, `heroDown`, `attack`. Zegar mapy `Combat.update`; `isCalm(null, { only: [onMap, sceneChange, message, farmMenu, build, event] })`;
`popup(..., { icon, color, menu: true })`; suma doświadczenia dalej przez `$gameTemp.pushTopNotice` (sekcja 1); adapter
`Journal.onGoalDone` zostaje. Testy: `combat_test` (42, też z `REGISTERED=1`), `unit/combat` (13), `core_fixtures_test` (bohater z
`day40_farm`).

**Partia D1 (2026-09-29) - SpeechBubbles (16):** v1.2.0, `@base TawernaCore` + `TawernaUI`; zegary mapy `SpeechBubbles.talk` i
`SpeechBubbles.coverHud`; słucha `mapEnter` (`priority: -1` - okrzyk przy wejściu zostaje), `newGame`, `load`; `isCalm(null, { only: ["onMap"] })`
i własne sprawdzenie ciemności (sekcja 7); tagi `<Bust>` / `<BustName>` przez `Tawerna.tag` (sekcja 8.5); `SpeechBubbles.bustBitmap` =
sprawdzenie, czy plik jest, + `ui.loadBust` (rozmowy i mini-gry dzielą jeden obrazek). Parametr `heroSide` (domyślnie `right`: popiersie
bohatera w prawym dolnym rogu, rozmówcy w lewym).

**Partia D2 (2026-09-29) - Hunting (20, część):** `Hunting.js` (829 linii: stan, API, wszystkie haki, `RoamingActor`, skradanie, czujność,
pojawianie się zwierząt, napady), `Hunting_Path.js` (363: A* / `path8`), `Hunting_AI.js` (860: `Game_Animal`, przynęta, dzik, wilki),
`Hunting_Weapons.js` (567: bronie, celowanie, pociski, `kill`, zwłoki); torba `Tawerna.api("Hunting_parts")`. Stan `_tw.hunt { kills,
killed, sneak }` (adopt `_hunt`; `_sneak` - getter/setter) i `_tw.carcasses` (adopt `_carcasses`). Szyna: `kill` (słucha Combat;
`Hunting.onKill` usunięte), nowe `shot`. Zegar mapy `Hunting.update`; hak `Game_Map.update` zostaje dla zwierząt (w hitstopie Combat
stoją razem ze światem, przy przyspieszeniu mapy biegną z nią); `canShoot` → `isCalm({ only: [canMove, message, event, farmMenu, build,
sceneChange] })`; `audio.se`, `popup`. Testy: `hunting_test` (33, też z `REGISTERED=1`), `unit/path8` (rdzeń + Hunting + Hunting_Path),
`core_fixtures_test` (29).

**Partia E1 (2026-09-29) - Farming (17):** `Farming.js` (1120 linii: parametry, `ITEM` / `STAMINA` / `SE`, `GATHER` i inne tabele na
zewnątrz, tabele z Farming_Data, stan, pory roku, stałe chatki, `hutOf` / `hutDoorAt`, kształty budynków i ich indeks, pomocnicy,
**wszystkie** haki silnika, słuchacze szyny, zegar mapy, API, wczytywanie części), `Farming_Plots.js` (933), `Farming_Build.js` (901),
`Farming_Stations.js` (791), `Farming_UI.js` (913) - co w nich: tabela w sekcji 2; torba `Tawerna.api("Farming_parts")`. Metody `Scene_Map`
stoją w głównym jako cienkie przejścia do `część().SCENE[nazwa]`, części wołają się przez `link()`. Stan `_tw.farm` (adopt `_farm`;
`$gameSystem._farm` - ukryty alias dla 8 czytelników, jest od początku gry); `_lastSleep`, `_bagWater`, `_vesselBag` zostają starymi
kluczami (od etapu 6 pola `_tw.farm`). Haki przed → po: dwa owinięcia `Scene_Map.update` → jeden zegar mapy `Farming.update`; `Game_Map.setup` → `T.on("mapEnter")`;
`sleepUntilHour` → `T.on("wake", ..., { priority: -10 })` (przed podsumowaniem dnia i autozapisem); nowi słuchacze `load` / `newGame` liczą
pamięć podręczną od nowa; `canUseKeyMenu`, drzwi chatki, `enterHut`, trzymane O (`holdingOn`), `updateBuildMode` → `T.isCalm` (sekcja 7);
`playSe` → `T.audio.se`; 38 sprawdzeń `window.X` → `T.api` / `T.call`; pora roku, dzień, godzina → `T.time`. Zostają haki:
`Game_Map.isPassable`, `Game_Player` `checkEventTriggerHere` / `triggerButtonAction` / `update` / `canMove` / `triggerAction`, `Scene_Map`
`createAllWindows` / `isMenuEnabled`, `Game_System.clearLand`, polecenie `clearArea`, klawisze (R, E, ?). Szyna: nowe `build`, `harvest`,
`craft` (sekcja 5; nikt jeszcze nie słucha - możliwi: Combat zamiast przeglądania `_farm.buildings` co 90 klatek - od etapu 6 słucha `build` -,
Journal, QuestBoard, Livestock, Dog). Poprawka `menuFor`: każde pole budynku daje jego menu (tylne rzędy, po których od prostego przerysowania da się chodzić,
nie dawały nic), ziemia wewnątrz zagrody dalej nic; przodem do wejścia chatki - menu chatki. Testy: `unit/farming_data` (21: rdzeń +
Farming + części), `core_fixtures_b2_test` (36, +7 o farmie), `smoke/farm` (12, też z `REGISTERED=1`), `yard_test` 46/48 (dwa nieaktualne
oczekiwania: tylny rząd pieca, liczby otworu 91 / -7 w teście, w danych 95 / -32). Błędy sprzed E1: `dishes_test` 13/15, `survival_test`
36/37, `life_test` 14/16. Propozycja dla rdzenia: wspólny pomocnik `Tawerna.parts(...)` (Combat, Hunting, Farming i ChoppableTree
powtarzają ten sam wzór torby, `missing`, wczytywania części).

**Partia E2 (2026-09-29) - ChoppableTree (18):** `ChoppableTree.js` (988 linii: parametry, `SOLID_GRAPHICS`, zajmowane pola, tablica
zamachów, klatki upadku i rozbicia, czas żaru, stan, `readConfig`, **wszystkie** haki silnika, 4 polecenia wtyczki - `chop`, `dig`,
`mine`, `pickFruit` -, tryb czekania `treeAnimation`, API, wczytywanie części), `ChoppableTree_Objects.js` (592), `ChoppableTree_Swing.js`
(241), `ChoppableTree_Render.js` (695) - co w nich: tabela w sekcji 2; torba `Tawerna.api("ChoppableTree_parts")`. Stan `_tw.treeFruit`
(adopt `_treeFruit`) i `_tw.smoulder` (adopt `_smoulder`; Storm dalej pisze `$gameSystem._smoulder` przez alias - do etapu 6, potem `Tawerna.state("smoulder")`). Zegar mapy
`ChoppableTree.fruit` (odrastanie owoców co godzinę); słuchacz `load` czyści zapisany zamach (jego funkcje nie przeżywają zapisu); trzymane
O - `isCalm` (sekcja 7); `T.time`, `audio.se`, `popup`. Nowe zdarzenie `chop` (sekcja 5), nadawane po zdobyczy i przełącznikach własnych.
Tagi przez `Tawerna.tag` na notatce (sekcja 8.5: 0 różnic). Testy: `unit/choppable_tree` (17), `hold_gather_test` (13) i `tree_strike_test`
(36) - z `REGISTERED=1`, sprawdzenia `chop` i adopcja starego zapisu; `ore_test` czyta tabelę kamieni z `ChoppableTree_Objects.js`, potem
z `ChoppableTree.js`. Błędy sprzed E2: `fruit_tree_test` 9/13, `pick_test` 1/2, `swing_test` 10/18, `life_test` 14/16; `lock_test` wypisuje
tylko czasy (bez `N/M passed` - `run.js` pokazuje CRASH).

**Etap 6 (2026-09-29) - pierwsze porządki** (zachowanie bez zmian, stare zapisy się wczytują; kopie w `backup_art_2026-09-29/stage6/`):

- **Storm:** `hitTree` i dym zwęglonego drzewa (`Sprite_Smoulder`) czytają i piszą `Tawerna.state("smoulder")` (stan ChoppableTree) zamiast
  `$gameSystem._smoulder`; bez ChoppableTree (stan niezdefiniowany) - `{}`, jak dawniej. Alias `_smoulder` zostaje dla starych zapisów i testów.
- **Farming_Render:** żar drzewa w warstwie nocy przez `T.call("ChoppableTree", "emberLights", spriteset)` (bez ChoppableTree: nic, jak
  dawniej) zamiast `window.ChoppableTree`; komentarz tabeli `Z` wskazuje `ChoppableTree_Render.js`.
- **Combat:** doświadczenie za pierwszy budynek danego rodzaju z `T.on("build")` (`done: true`, każde `how`, także F9 - `free`) zamiast
  przeglądania `$gameSystem._farm.buildings` co 90 klatek; te same zasady: rodzaj raz (`hero.firsts["b" + typ]`), plac budowy (`done: false`) się
  nie liczy, a to, co stoi, zanim bohater jest gotowy (nowa gra, zapis sprzed Combat), `markExisting` zalicza jako znane bez doświadczenia -
  wczytany zapis nie daje doświadczenia za swoje budynki. Doświadczenie przychodzi od razu, nie do 90 klatek później. `markExisting` czyta
  budynki przez `T.call("Farming", "farm")` - Combat nie czyta już `_farm`.
- **Farming:** `lastSleep`, `bagWater`, `vesselBag` - pola `_tw.farm` (Farming_Build `awakeHours`, Farming_Plots bukłak wiadra i garnki w
  plecaku); dawne `$gameSystem._lastSleep` / `_bagWater` / `_vesselBag` - getter/setter na `Game_System.prototype` (nie w zapisie; czytają je
  i piszą testy), własne pola starego zapisu przechodzą przy `load` (`priority: -10`, jak `_sneak` w Hunting). Sprawdza `core_fixtures_b2_test`.
- Testy: komentarze `combat_test` i `hunting_test` o `REGISTERED=1` poprawione (części są na liście w `js/plugins.js`, oba przebiegi mają tę
  samą kolejność).
- **Stare padające testy naprawione** (same testy - bez zmian w grze, mapach i danych; susza zostaje): `dishes_test` 41/41 i `life_test` 49/49
  (szukanie wolnego miejsca do ostatniego rzędu mapy, ognisko dokarmione, wiadro do dojenia, nazwy mięs z `$dataItems`), `survival_test` 55/55
  (udawany staw przez `isWaterTile` części `Farming_Plots`, dni deszczu bez burzy, nocne napady wyłączone na czas snu w lesie), `yard_test`
  48/48 (tylny rząd budynków celowo przechodni; komin pieca 95 / -32 z `Farming_Data`), `fruit_tree_test` 13/13 (drzewa przestawione na Map003;
  prawdziwy klawisz O zrywa owoce), `pick_test` 2/2, `swing_test` 18/18 (arkusze `Hero_*` z `ChoppableTree.swingKind`), `lock_test` 7/7
  (przepisany na kit, pomiar w pętli gry).
- **Testy czułe na tempo** (przy pełnej szybkości GPU): `talk_busts_test` (dymek-emocja nad Ozzym ze zdarzenia „Atmosfera" gaszony na czas
  sprawdzenia), `combat_test` (pasek dzika 3 klatki po ciosie), `sit_test` (klatka siadu łapana w `SceneManager.updateMain`; t 36 = uderzenie,
  odpoczynek trzyma tam pozę), `pantry_fresh_test` (skok zegara postarza się przed włożeniem jedzenia) - przechodzą na GPU i na procesorze.
- **Drobne:** `@command pickFruit` w nagłówku ChoppableTree (edytor pokazuje polecenie „Zerwij owoce z drzewa"); Journal - scena
  podsumowania dnia bez podsumowania (odtworzona po zamknięciu sceny nad nią) wraca od razu na mapę zamiast błędu w `summaryOps`.

**Dalej:**

- **Etap 5** - dane i polskie teksty do plików danych (`*_Data.js`: tabele i teksty, które dziś stoją w logice - sekcja 13).
- **Etap 6 - reszta (na potem):** wspólny pomocnik `Tawerna.parts(...)` dla podzielonych wtyczek (Combat, Hunting, Farming, ChoppableTree
  powtarzają ten sam wzór), pozostałe stare klucze (tabela w sekcji 4), czytelnicy aliasu `_farm` (sekcja 1), napisy sprawdzeń w
  `combat_test` / `hunting_test` („the parts put in by ...").
- **Szybsze testy dalej:** tryb przewijania czasu gry w testach (najdłuższe - `tavern_shift`, `tavern_life`, `tavern_dice` - czekają na czas gry).

---

## 15. Testy rdzenia

- `tests/core_test.js` (46 sprawdzeń) - w kolejności jak po rejestracji: stan (wersje, migracje, adopt, alias), szyna,
  zdarzenia rdzenia, wstawianie (zakresy, nakładanie, edytor, stare zapisy, `when`), zegar i spokój, tagi, kalendarz,
  dźwięk (brakujący plik - gra idzie dalej), warstwy BGS, dymki, has/api/call, debug, mała mini-gra (`ButtonRow`, `IconList`, `Meter`).
- `tests/core_fixtures_test.js` (29) - cztery stare zapisy z rdzeniem i trzema wtyczkami domu; adopcja `_homeDecor`; partia B1:
  `_story` i `_forest` przejęte do `_tw` (fabuła jak zapisana, stare nazwy dalej prowadzą do tych samych danych); C3: `_hero` z
  `day40_farm` (poziom 6, punkty, życie) i `_combatMode` / `_combatHand` w `_tw.combat`; D2: `_hunt` i `_carcasses` (wilk z dnia 14 w
  `home_decor_v0`), postarzony `day40_farm` z `_sneak` i zwłokami; nowy zapis bez starych kluczy.
- `tests/core_fixtures_b2_test.js` (29) - partia B2: `_birds`, `_dog`, `_journal` przejęte ze starych zapisów (alias, nowy zapis tylko w
  `_tw` i jego ponowne wczytanie), oswojony pies z `day40_farm` przy budzie i dalej pracuje, kury w zagrodzie, dziennik z celami i
  notatkami; zegary mapy czterech wtyczek na liście rdzenia; `storyStep` odhacza cel od razu. Od etapu 6 (42 sprawdzenia): dawne
  `_lastSleep` / `_bagWater` / `_vesselBag` w `_tw.farm` (z każdego zapisu, nowy zapis bez nich, postarzony `day40_farm` z własnymi polami).
- `tests/tavern_life_save_test.js` (22) - TavernLife podzielony na części ze starym zapisem `tavern_evening`: adopcja `_tavernLife`,
  pokój wynajęty po wczytaniu, drzwi na górze, nowy zapis tylko w `_tw`; siłowanie (pauza z pomocą, „Poddaję się”, stawka na mapie)
  i rzutki (baner tury, popiersia, wynik) na `Scene_MiniGame`. Obrazki: `docs/architektura/tavernlife_*.png`.
- `tests/fixtures/make_home_decor_v0.js` - jak powstał zapis starego HomeDecor.js (raz, jak pozostałe).
- `tests/unit/map_flags.test.js` (26) - notatka każdej mapy z `data/` czytana starymi wyrażeniami wtyczek i przez
  `mapFlag`/`mapTag`: te same wartości; do tego „on” / „off” / „pierwszy” wygrywa i znane różnice (nie ma ich w danych).
- `tests/unit/tavern_life.test.js` (17) - TavernLife bez gry (rdzeń, zestaw, TavernLife, TavernLife_Darts w piaskownicy): ceny
  Borgara (danie dnia, progi reputacji QuestBoard, rabaty z parametrów), punkty rzutek na całej tarczy, atrybuty `<Tavern:...>`
  czytane po staremu na tagach rdzenia (wartość z przecinkami: `plate=0,-2`, cudzysłowy).
- `tests/debug_menu_test.js` - zakładka „Rdzeń” w F9 (linie rdzenia, tylko do czytania).
- Partie C2-D2: `combat_test` (42) i `hunting_test` (33) - pliki rodziny w stronie po razie, z `REGISTERED=1` także kolejność na liście
  (jak w `js/plugins.js`), zdarzenia szyny; `tests/unit/combat.test.js` (13) - `window.Combat` z każdą dawną nazwą, części w torbie i
  czytelny błąd przy złej kolejności, adopcja `_hero` / `_combatMode` / `_combatHand`, poziomy i `kill`; `tests/unit/path8.test.js` (10) -
  rdzeń + Hunting + Hunting_Path; `storm_test` (30) i `tree_strike_test` (od E2: 36) - `stormStart` / `stormEnd` / `lightning`, stary zapis z
  `_stormTrees`; `atmosphere_test` (34) - udawany staw; `bubbles_test` (11) i `talk_busts_test` (36) - SpeechBubbles na rdzeniu.
- Partie E1, E2: `unit/farming_data` (21) - rdzeń, Farming_Data, Farming i jego części w kolejności z listy, torba, dawne nazwy
  `window.Farming`, czytelny błąd przy złej kolejności; `core_fixtures_b2_test` (36) - `_farm` z każdego zapisu w `_tw.farm`, `day40_farm`
  (budynki, pola, chatka), nowy zapis bez `_farm`; `smoke/farm` (12) - części w stronie, `build` / `craft` / `harvest`; `unit/choppable_tree`
  (17) - dawne nazwy `window.ChoppableTree`, tablica zamachów przed częściami, tagi każdej mapy starym i nowym odczytem, adopcja
  `_treeFruit` / `_smoulder`, `chop`; `hold_gather_test` (13) i `tree_strike_test` - części w stronie, `chop`, stary zapis. Z `REGISTERED=1`
  (części na liście strony jak w `js/plugins.js`): `smoke/farm`, `hold_gather_test`, `tree_strike_test`.
- Szybkie przebiegi (GPU, jedna przeglądarka na przebieg, `affected` / `changed`, kolumna `before`) i serwer gry `tools/serve.js` -
  `docs/TESTY.md`, „Szybkie testy”.
- Menu P (partia C1): `menu_panel_test` (panel, karta, plecak, dziennik, zapis, koniec gry), `tavern_plan_test` („Plan karczmy” w
  menu tylko w karczmie, otwiera plan, P wraca do menu), `story_test` i `smoke/story` (linia długu: `Story.lastMenuLine/Label`),
  `hero_menu_test` (Postać pierwsza, liczba punktów), `journal_test` (Dziennik w kolumnie komend).
- Wtyczki spoza `js/plugins.js` wkłada zestaw testów (`kit.test({ plugins: [...] })`, rdzeń sam na początek).
