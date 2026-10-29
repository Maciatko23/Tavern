# Architektura gry „Tawerna” (wtyczki RPG Maker MZ)

Stan: 2026-09-29, etap 3 porządków („żeby to było ładne, czytelne, proste do rozszerzenia”).
**Od 2026-10-23 wtyczki ładują się z listy gry `js/tawerna_wtyczki.js`** (ładowacz `js/plugins/TawernaLoader.js` z `index.html`);
`js/plugins.js` (edytor) trzyma tylko ładowacz i trzy obce wtyczki z parametrami z edytora. Nowa wtyczka = wiersz na liście gry - sekcja 2.0.
Kod: 76 wtyczek w `js/plugins.js` (71 naszych), ok. 52 800 linii (48 400 naszych). Rdzeń: **TawernaCore.js** i **TawernaUI.js**
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
 │                        Fullscreen, RegionLayers                              │
 │               świat na ekranie: Sky, RoomLighting, DustMotes, CloudShadows,  │
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

### 2.0 Skąd gra bierze wtyczki (od 2026-10-23): lista gry i ładowacz

Edytor RPG Maker MZ przy każdym zapisie projektu pisze `js/plugins.js` od nowa - z listy, którą wczytał przy otwarciu
projektu. Wtyczka dopisana do tego pliku przy otwartym edytorze znikała. Dlatego wtyczki gry stoją teraz na **liście gry**:

- **`js/tawerna_wtyczki.js`** - wszystkie wtyczki gry (148 w dniu przejścia), w kolejności ładowania, z parametrami; jeden wpis
  w wierszu, ten sam układ co `js/plugins.js` (`var $tawernaWtyczki =` + tablica wpisów `{name, status, description, parameters}`).
  Edytor tego pliku nie zna i go nie zapisuje.
- **`js/plugins/TawernaLoader.js`** (ładowacz) - wczytuje go `index.html`: dwa wiersze nad `js/main.js` (najpierw lista, potem
  ładowacz). Zanim `main.js` wczyta silnik i `js/plugins.js`, ładowacz zamienia `window.$plugins` w akcesor: `var $plugins = ...`
  z `js/plugins.js` przechodzi przez jego setter i wychodzi scalone z listą gry. Dalej wszystko po staremu: `main.js` woła
  `PluginManager.setup($plugins)`, silnik wstawia skrypty po kolei (`async = false`), każdy wykonuje się przed `load` okna, czyli
  przed `Scene_Boot` i `DataManager`; brak pliku wtyczki = „Failed to load: js/plugins/X.js” przy starcie;
  `PluginManager.parameters(nazwa)` i `window.$plugins` jak dawniej (każda wtyczka raz, w kolejności listy; ładowacz stoi w `$plugins`
  pierwszy, `PluginManager.setup` go pomija - już działa). Haki testów na `$plugins` (REGISTERED=1, `GAME_PLUGINS_ADD`) dostają
  scaloną listę, tak jak dawniej cały `js/plugins.js`. `TawernaLoader.info()` mówi, jak poszło (tryb, wpisy tylko z edytora,
  parametry z edytora).
- **Edytor nie zmienia `index.html` ani `js/main.js`**: przy zapisie podmienia w `index.html` tylko tytuł (sprawdzone w RPGMZ.exe:
  wyrażenie `(<title>)[^<]*(</title>)`), a `main.js` tylko czyta (numer wersji). `js/main.js` i `rmmz_*.js` zostają takie jak z RPG
  Maker MZ. Przy podmianie plików silnika z nowej wersji RPG Maker (folder `newdata`) **nie** nadpisywać `index.html` (albo dopisać
  te dwa wiersze na nowo).

Zasady scalania (`TawernaLoader.js`; druga ręka w `tests/lib/wtyczki.js`, sprawdza je `tests/ladowacz_test.js`):

1. Kolejność = lista gry; każda wtyczka raz (drugi wpis tej samej nazwy - na liście albo w `js/plugins.js` - pominięty).
2. Wtyczka, która stoi i na liście, i w `js/plugins.js`, bierze z edytora włączenie i parametry - **parametr po parametrze**
   (czego wpis edytora nie ma, zostaje z listy). Wyłączona w edytorze = wyłączona w grze.
3. Wtyczka tylko w `js/plugins.js` (np. obca dodana w Menedżerze wtyczek): stoi nad wpisem TawernaLoader - wczytuje się przed listą
   gry, pod nim - po liście. `js/plugins.js` bez wpisu TawernaLoader (stary zapis edytora) - każda zaraz za wtyczką, która stoi nad
   nią w `js/plugins.js`.
4. Zapasowe wejście: gdyby `index.html` stracił te dwa wiersze, wpis TawernaLoader w `js/plugins.js` wczyta ładowacz jak zwykłą
   wtyczkę; ten doczyta listę i dołoży resztę (każdą raz, wszystkie przed `Scene_Boot`), ale **po** wtyczkach z `js/plugins.js` -
   kolejność tylko przybliżona, w konsoli ostrzeżenie. Wtedy przywrócić dwa wiersze w `index.html`.
5. Brak listy gry (plik zniknął albo ma błąd składni): przy starcie ekran błędu silnika „Failed to load: js/tawerna_wtyczki.js”.

**Co jest w `js/plugins.js`** (to widać w Menedżerze wtyczek edytora): `TawernaLoader` (pierwszy; nie wyłączać i nie usuwać - to
zapasowe wejście) oraz `ActorPictures`, `OptionEx`, `HDLayout` - obce wtyczki, których parametry ustawia się w edytorze (OptionEx:
domyślna głośność i polskie nazwy opcji - zmieniane 2026-09-26; ActorPictures: obrazki aktorów; HDLayout: układ okien). Te trzy
stoją też na liście gry (ich miejsce w kolejności), a parametry z edytora mają pierwszeństwo. Nasze wtyczki mają parametry stałe
albo domyślne - są tylko na liście gry. Zmiana parametru naszej wtyczki = zmiana wiersza na liście gry (albo dodać tę wtyczkę
w Menedżerze wtyczek i ustawić tam - wtedy wygrywa edytor, `--sprawdz` to pokaże).

**Nowa wtyczka** (edytor może być otwarty): plik `js/plugins/Nazwa.js` (nagłówek z `@plugindesc`), potem wiersz na liście gry:

```
python tools/wtyczki.py --dodaj Nazwa --po Poprzednia            podgląd (opis z @plugindesc, parametry z @default)
python tools/wtyczki.py --dodaj Nazwa --po Poprzednia --wykonaj  zapis (albo --przed Następna; bez --po/--przed: na koniec)
python tools/wtyczki.py --sprawdz                                kontrola: pliki, podwójne wpisy, index.html, js/plugins.js
python tools/wtyczki.py                                          lista z numerami (E = stoi też w js/plugins.js)
```

Bez `js/plugins.js`, bez zamykania edytora, bez Menedżera wtyczek; gra i testy widzą wtyczkę od następnego startu. Instalatory
w `tools/*` (w5, w7, w9_rywal, orzel, motyle, przystan, domy, rozszerzenia, miejsca_wyspy, kruczy_jar) piszą już listę gry. Z Pythona:
`tools/wtyczki.py` jako moduł (`czytaj_liste`, `wpis_z_pliku`, `dodaj`, `Plik.zapisz`); z Node: `tests/lib/wtyczki.js` (`lista()`,
`edytor()`, `merge()`, `nazwy()`, `tekst()`).

**Gdy edytor zapisze `js/plugins.js` po swojemu:**
- ze starą, długą listą (edytor otwarty sprzed przejścia na ładowacz): gra działa (każda wtyczka raz, w kolejności listy), ale
  parametry z tego zapisu mają pierwszeństwo przed listą; `python tools/wtyczki.py --sprawdz` to pokaże, a przy zamkniętym edytorze
  `python tools/wtyczki.py --plugins-js --wykonaj` przywraca krótki `js/plugins.js` (kopia poprzedniego do
  `Tawerna_archiwum_2026-10-18/dane_przed_ladowaczem/`);
- z samym ładowaczem albo bez którejś z trzech obcych: gra działa, ich parametry z listy gry.

Obcą wtyczkę dodaną w edytorze można przenieść na listę: `python tools/wtyczki.py --przenies --wykonaj` (trafia tam, gdzie gra i tak
ją wczytuje).

**Wdrażanie** (Plik → Wdrażanie): katalog `js/` idzie do paczki w całości - „Wyklucz nieużywane pliki” dotyczy tylko `img/`, `audio/`
i `effects/` (pomoc RPG Maker MZ, rozdział o wdrażaniu: 01_11_03), więc lista gry, ładowacz i wszystkie wtyczki są w paczce; `index.html`
też (edytor zmienia w nim tylko tytuł). Uwaga: „Wyklucz nieużywane pliki” liczy grafiki i dźwięki z bazy danych, map i parametrów
wtyczek z `js/plugins.js` - pliki, które nasze wtyczki biorą z kodu (prawie wszystkie obrazki i dźwięki) albo z parametrów na liście
gry, uznałby za nieużywane i wyrzucił. Wdrażać **bez** tej opcji (tak samo było przed ładowaczem). Po wdrożeniu uruchomić grę z paczki
raz (tytuł + mapa).

### 2.1 Lista

Lista gry `js/tawerna_wtyczki.js` (do 2026-10-23 `js/plugins.js`; 82 wtyczek w tym zestawieniu; dziś 151, wszystkie włączone; numer = miejsce na liście; w `$plugins` stoi przed nią jeszcze TawernaLoader):

```
 0  TawernaCore                ← pierwsza, nad wszystkim
 1  Wydajnosc                  ← (2026-10-24) mniej pustej pracy silnika co klatkę: puste aktualizacje obrazków, pole filtrów sceny mapy, postacie poza ekranem nierysowane, szybkie „czy to przedmiot”; etap 2: zdarzenia daleko poza ekranem co 4. klatkę, filtry kolorów MZ w spoczynku wyłączone, opts dla konturu (CharacterPolish) i nocy (Farming_Render); Opcje -> „Jakość grafiki” (Automatycznie / Wysoka / Średnia / Niska, ConfigManager.gfxQuality + gfxAuto): jeden obiekt `gfx` (mood, bloom, particles, grass, critters, lazyEvery, smallShadows, fireShadows, nightScale, skyFx, version), który czytają Mood, GroundDetail, Birds, Motyle, Storm, Sky, ChoppableTree_Render, Farming_Render i pogoda MZ; Automatycznie mierzy czas klatki w Graphics._onTick (docs/WYDAJNOSC.md „Jakość grafiki”)
 2  ActorPictures, AltMenuScreen, AltSaveScreen, OptionEx, HDLayout                     (obce)
 7  DustMotes, RoomLighting, DayNightCycle, CloudShadows, SwayingFoliage, Sky, MapZoom   ← Sky: słońce, niebo, cienie
14  ChoppableTree, ChoppableTree_Objects, ChoppableTree_Swing, ChoppableTree_Render  ← części zaraz pod główną (przed SurvivalHUD)
18  SurvivalHUD, Farming_Data
20  Farming, Farming_Plots, Farming_Build, Farming_Stations, Farming_UI  ← części zaraz pod główną (za nimi Farming_Render)
25  Farming_Render, CharacterPolish, GroundDetail, FreeMovement, RegionLayers, WaterFx, Fullscreen, Survival   ← RegionLayers: regiony 1/2/3 = pod / na równi / nad graczem; WaterFx: płynny wodospad, plusk, fale, nurt (<Fall>, <Splash>, <Flow>)
33  UITheme
34  TawernaUI                  ← zaraz pod UITheme
35  Journal, Minimap, Atmosphere, Storm, Puddles, Durability, Spoilage
42  Hunting, Hunting_Path, Hunting_AI, Hunting_Weapons  ← części zaraz pod główną (przed Birds)
46  Birds, Motyle_Data, Motyle, Forestry, Needs, Livestock, Dog, Skills_Data   ← Motyle (2026-10-18): motyle za dnia, ćmy nocą przy ogniu, siatka, gablotka (zakładka Dziennika), zapylanie; stan Tawerna.state("motyle"); szyna: butterflyCaught; dane i K54 w Motyle_Data (pakiet TownQuests, nad TownQuests_Data)
52  Combat, Combat_Fight, Combat_UI                     ← części zaraz pod główną
55  SpeechBubbles, Debug
57  MenuPanel                  ← pod Journal (układa jego scenę), nad wtyczkami, które dokładają wpisy do menu P
58  HeroLook
59  TavernShift, TavernShift_Hall, TavernShift_Parts
62  Story                      ← pod MenuPanel (linia długu: MenuPanel.addFoot)
63  QuestBoard_Data, QuestBoard, QuestBoard_Art, QuestBoard_Scene
67  TavernDice_Data, TavernDice, TavernDice_Art, TavernDice_Scene
71  TavernLife, TavernLife_Render, TavernLife_ArmWrestle, TavernLife_Darts, TavernLife_Plan
76  HomeAmbience, HomeDecor, HomeLife
79  TownLife_Data, TownLife     ← miasteczko według zegara: mieszkańcy 910-949 na mapie 8 (plany dnia, okrzyki, rozmowy, dzwon)
81  TownQuests_Data, TownQuests ← questy miasteczka (docs/QUESTY.md, stan: docs/QUESTY_STAN.md): zadania w rozmowach mieszkańców (TownLife.addTalkHook), Opinia w miasteczku 0-100, zakładka dziennika „Miasteczko”, dzień targowy, sygnały dzwonu; stan Tawerna.state("townQuests"); szyna: townQuestAccepted / townQuestDone / townQuestFailed / townOpinion; zdarzenia 951-959
87  Underground_Data, Underground ← podziemia pod tawerną (docs/PODZIEMIA.md): piętra 1-9 składane z kawałków mapy 130 (ziarno zapisu, Tawerna.onMapData na mapach 131-139), piętro 10 ręcznie (Map140), krata w piwnicy (przełącznik 11); stan Tawerna.state("underground"); szyna: undergroundFloor / undergroundDeeper / undergroundLoot / undergroundNote / undergroundGate / undergroundLift; zdarzenia stworów 860-899
96  Okolice_Data, Zasoby_Data, Lowy_Data, Ludzie_Data, Zakon_Data ← (2026-10-21/22) nowy teren 21 powiększonych map (docs/rozszerzenia/PLAN.md): dane rdzenia i czterech paczek, nad TownLife (TownLifeExtra, TownQuestsPacks)
102 Podroznicy_Data ← (2026-10-28) podróżni z promu (docs/PODROZNI.md, rozdz. 18 niżej): obsada, pula, pokoje, plany dnia; mieszkańcy TownLife 3020-3049, wątek „podroznicy” (Watki.js); nad TownLife
103 SwieteKosci_Data, Dezerter_Data ← (2026-10-29, etap 4 podróżnych) łańcuchy W15 „Święte kości” i W16 „Dezerter” jako wątki silnika (zadania do TownQuestsPacks, stany „swieteKosci” i „dezerter”); pod Podroznicy_Data, nad TownLife
    Intrygi_Data ← (2026-10-29, etap 3 podróżnych) wątek „intrygi”: zadania D45, D46, K73 i dane mechanizmów intryg; pod Dezerter_Data, nad TownLife
    Poselstwo_Data, Podroznicy5_Data ← (2026-10-29, etap 5 podróżnych) wątki „poselstwo” (W14) i „podroznicy5” (D44, D47, D48): zadania do TownQuestsPacks, miejsca posła i Ostapa na Map026 (TownLifeData.SPOTS_BY_MAP), gettery `zadania` obsady; pod Dezerter_Data, nad TownLife
103 W1_Data, W2_Data, W3_Data, W6_Data, W8_Data, Przystan_Data ← (2026-10-29, etap 4 - docs/WATKI_DANE.md 7c) łuki miasteczka jako wątki silnika: zadania W1/W2/W3/W6/W8 (kroki z nazwami) i zadania przystani K47, K48, D20, W10 z rozmowami i stanem „przystan”; TownQuests_Data wkłada je na stare miejsca listy (ARC), kod kroków: haki W1_HAKI... w TownQuests.js, Przystan.js
110 Rynek_Data, Straz_Data, Oboz_Data, Goscie_Data, W4_Data, W9_Data ← (2026-10-29, etap 5 - docs/WATKI_DANE.md 7d) reszta zadań miasteczka jako wątki silnika: rynek (K1, K5, K9, K13-K17, K20, D3, D16), straż (K37-K39, D11, D14, D17), obóz (K19, K27-K29, D4, D10, D18), stali goście (K22, K33, D13, D6), W4 rozdz. 1-5, W9 rozdz. 6; haki RYNEK_HAKI... w TownQuests.js (obiekt FX pusty)
130 Podroznicy ← (2026-10-28) silnik podróżnych z promu: planowanie promu, księga pokoi, Renoma karczmy, scena przybycia, rozmowy, F9; pod Kasztelan (czyli pod TownQuests, Przystan, Garnizon, Kantor, Wrak, Act3)
    Intrygi ← (2026-10-29, etap 3) intrygi na piętrach: drzwi zajętych pokoi, przeszukanie, nocne kroki ze świecą, listy pod drzwiami, D45/D46/K73; furtki TavernLife (addRoomGuard, addRoomPrice, addGatePass, addWake, plan.addInfo) i TavernShift.addTipBonus; zaraz pod Podroznicy_Sprawy
    Podroznicy_Sprawy ← (2026-10-29, etap 2) haki zadań K71, K72, D39-D43 (dane w Podroznicy_Data), podsłuch przez ścianę (Podroznicy.podsluch), Antek i Zenon w garnizonie; zaraz pod Podroznicy
131 SwieteKosci, Dezerter ← (2026-10-29) silniki łańcuchów W15 / W16: haki danych, sceny (kazanie, bęben, noc pod piątką, przysięga), kurier 3050 i Tymon 3060 (`Tawerna.inject`, właściciel „Lancuchy”), echa w Akcie III (Act3Data.WIEDZA_FRAKCJI, obrońcy); pod Podroznicy
    Poselstwo, Podroznicy5 ← (2026-10-29, etap 5) silniki W14 (kolacja „w służbie” - TavernLife.addGatePass, narada, Noc Kupały, ślady, list) i spraw D44/D47/D48 (Feliks na korytarzu, podsłuch pokoju 4, burdy Kompanii, siłowanie i kości z Hubertem, bójka - Humans, tuba Teofila); zdarzenia 3070-3089 (`Tawerna.inject`, właściciel „Poselstwo”), echa w Akcie III; pod Dezerter
135 Okolice, Zasoby, Lowy, Ludzie, Zakon ← silniki pod Orzel_Lot: rdzeń Okolice (miejsca i test kolizji, odkrycia i zakładka dziennika „Okolice”, kompas `Okolice.track`, wiersze F9 `Okolice.f9`, upał/susza, cień słońca) i paczki A woda i zasoby, B zwierzęta i łowy, C ludzie, D tajemnice i zakon
```

**Wtyczki nowego terenu (2026-10-22):** każda paczka ma swoje zdarzenia (`Tawerna.inject`, rejestr w §6), mieszkańców TownLife z drugiego zakresu 2900–2949, przedmioty (A 185–199, B 200–209, C 210–224, D 225–239), ikony (wiersze 29–32 IconSet: 464–527), stan w zapisie (`okolice`, `zasoby`, `lowy`, `ludzie`, `zakon`) i test (`okolice_szkielet_test` 9550, `zasoby_test` 9551, `lowy_test` 9552, `ludzie_test` 9553, `zakon_test` 9554). Mapy 176 (komora pod menhirami, D) i 177 (jaskinia przemytników, C). Szyna: `okoliceDiscover`, `zakonGrove`. Epilog po Sercu pyta `Zasoby/Lowy/Ludzie/Zakon.epilogue(kind, w)` (linijka albo lista). Instalator danych: `tools/rozszerzenia/instaluj.py`, opisy na liście gry: `tools/rozszerzenia/opisy_wtyczek.py`.

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
| `Combat_UI.js` | warstwa walki na mapie (liczby, iskry, paski wrogów, oddech, tarcza), plakietka broni, pasek doświadczenia, napis trybu, baner poziomu (ekran Postaci jest w menu P - MenuRing.js) | Combat_Fight |
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
6. **Nowa wtyczka = wiersz na liście gry** `js/tawerna_wtyczki.js` (`python tools/wtyczki.py --dodaj Nazwa --po Poprzednia --wykonaj`,
   sekcja 2.0) - edytor może być otwarty, `js/plugins.js` się nie rusza. Po zmianach w `data/*.json` - przeładuj projekt w edytorze.

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
- **oldFields** (porządki 2026-10-28) - dawne *proste* pola `$gameSystem` (liczba, flaga, rekord), które teraz są polami stanu:
  ```js
  const clock = Tawerna.state.define("clock", () => ({ hour: 9, day: 1 }), { version: 1, owner: "DayNightCycle" });
  Tawerna.state.oldFields("clock", { _dayNightHour: "hour", _dayNightDay: "day", _dayNightTinting: "tinting" });
  ```
  Stara nazwa prowadzi do pola przez getter / setter na `Game_System.prototype` (niezapisywany) - inne wtyczki, F9 i testy czytają
  i piszą ją jak dawniej (`$gameSystem._dayNightDay = 40`). Własne pola starego zapisu (także te, które konstruktor zapisał, zanim
  obiekt został `$gameSystem` gry) przechodzą do stanu, gdy rdzeń go przegląda (`ensure`, zaraz po wczytaniu zapisu), i znikają
  z `$gameSystem`. Inny `Game_System` niż ten gry (czytany zapis, obiekt testu) dostaje zwykłe własne pole. Uwaga:
  `delete $gameSystem._stormForce` nic już nie robi - `= null`. Pole może dojść do stanu innej wtyczki (np. `gridShown` w `farm`
  z Farming_Render.js, `layout` w `tavernLife`). Odczyt co klatkę: przez stan (`$gameSystem._tw.<klucz>` jako szybka droga,
  jak `Farming.farm()`), nie przez starą nazwę.

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
| `clock` (`hour`, `day`, `tinting`) | `_dayNightHour`, `_dayNightDay`, `_dayNightTinting` (oldFields; konstruktor nie zapisuje już godziny - domyślne stanu) | DayNightCycle | porządki | `core_fixtures_test` (dzień i godzina każdego zapisu, `tinting` z `day40_farm`; zapis bez starych pól) |
| `survival` (`buffs`, `healAcc`, `stormForce`, `stormWarned`, `weatherOwn`, `rainDay`) | `_buffs`, `_healAcc`, `_stormForce`, `_stormWarned`, `_weatherOwn`, `_rainDay` (oldFields) | Survival | porządki | `core_fixtures_test` (`home_decor_v0`: `_stormForce`; `day40_farm`; „postarzony” zapis z każdym polem) |
| `needs` | `_needs` | Needs | porządki | `core_fixtures_test` (głód 72 / pragnienie 70 z `day40_farm`) |
| `fresh` | `_fresh` (`last` - zegar przy pierwszym pytaniu, jak dawniej przy tworzeniu) | Spoilage | porządki | `core_fixtures_test`, `unit/spoilage` |
| `wear` | `_wear` | Durability | porządki | `core_fixtures_test` (siekiera i kilof z `day40_farm`), `unit/durability` |
| `puddleClay` | `_puddleClay` | Puddles | porządki | `core_fixtures_test` („postarzony” zapis) |
| `minimap` (`hidden`) | `_minimapHidden` (oldFields; CleanHUD pisze starą nazwą) | Minimap | porządki | `core_fixtures_test` (`home_decor_v0`) |
| `freeMove` (`on`) | `_freeMove` (oldFields) | FreeMovement | porządki | `core_fixtures_test` („postarzony” zapis) |
| `sky` (`mistForce`) | `_mistForce` (oldFields) | Sky | porządki | `core_fixtures_test`, `unit/sky` |
| `farm.gridShown`, `tavernLife.layout` | `_gridShown` (Farming_Render), `_tavernLayout` (TavernLife) - pola cudzego stanu (oldFields) | Farming_Render, TavernLife | porządki | `core_fixtures_test` |

Livestock nie ma stanu w zapisie (stado liczone na nowo po `load` / `mapEnter`). Od porządków 2026-10-28 moje wtyczki czytają
cudze stany przez `Tawerna.state(...)` (Journal: needs, wear, hunt, forest, farm; GroundDetail, Livestock, Minimap, Spoilage,
Survival: farm; CzerwonaWoda: survival; HomeDecor: `T.has("TavernDice")` / `T.has("QuestBoard")` zamiast `_dice` / `_quests`;
rdzeń: `combat` w `isCalm` czyta `_tw.combat.mode`). Starą nazwą czytają i piszą jeszcze (działa przez alias / oldFields; pliki
innych agentów - do zmiany przy ich pracy): Story (`_farm`), Kantor i Ludzie (`_dayNightDay`), Latarnia (`_dayNightTinting`),
Kruk, Motyle, Orzel, Orzel_Lot, Zakon (`_combatMode`), CleanHUD (`_minimapHidden`); `_smoulder` - tylko testy.

Jeszcze w starych kluczach (`$gameSystem._xxx`; docelowo każdy przez `Tawerna.state`):

| klucz | wtyczka | dlaczego jeszcze nie |
|---|---|---|
| `_stamina` (`this._stamina` w metodach `Game_System`) | SurvivalHUD | plik agenta „jeden wygląd UI”; czytają go wszystkie wtyczki przez `stamina()` |
| `_windowTone` | OptionEx | wtyczka z zewnątrz (barwa okien z Opcji) |
| `_ubior` | Ubior | tylko zapasowa droga bez rdzenia (z rdzeniem: `Tawerna.state("ubior")`) |

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
| 1–499 | edytor | wszystkie | zdarzenia z edytora (od powiększenia map 2026-10-18 nowe obiekty dostają wolne numery 1–499; Map003, 008 i 013 mają je do 499); na mapach 131-139 - zdarzenia pięter zrobione przez Underground.js | - |
| 500–539 | Orzel | 13, 175 | biały orzeł: 500–509 ścieżka wspinaczy (Map013), 510–529 rzeczy na Orlej Grani, 530–539 obóz złodziei | `Tawerna.inject` ✓ |
| 540–559 | Kasztelan | 9, 140 | W4: Borgar przy kracie, posterunek przy dziesiątej bramie | `Tawerna.inject` ✓ |
| 560–569 | *wolne* | | | |
| 570–599 | Dwor | 172–174, 24 | W7: dwór Lorda | `Tawerna.inject` ✓ |
| 600–699 | Pustelnia 600–609, Kruk 610–629, Latarnia 630–639, Garnizon 640–669, Wrak 670–679, Cysterna 680–689, Wyspa 690–699 | 119, 146, 155–167, 8, 111, 125, 13 | sześć miejsc wyspy (docs/miejsca_wyspy/PAKIETY.md) | `Tawerna.inject` ✓ |
| 700–729 | Homes | 3, 4, 23, 168 | pole po stracie, drogowskaz, dym i Marta w Spalonej zagrodzie | `Tawerna.inject` ✓ |
| 730–759 | Kantor | 103, 8, 171, 23, 22 | W5: kantor Baltazara | `Tawerna.inject` ✓ |
| 760–779 | Przystan | 125 | przystań: przewoźnik, ludzie z promu | `Tawerna.inject` ✓ |
| 780–798 | *tylko test* | 3 | `tests/core_test.js` (strona testowa) | - |
| 800–827 | Underground | Serce, sceny | komnata Serca (800–804), ujęcia zakończeń (805–827) | `Tawerna.inject` ✓ |
| 828–839 | Rywal | 10, 11, 131–140 | W9: rywal w ruinach | `Tawerna.inject` ✓ |
| 840–859 | Act3 | 8 | Akt III (840–858 rezerwa, 859 lina) | `Tawerna.inject` ✓ / `reserve` |
| 860–899 | Underground (zarezerwowane) | 131-139 | stwory podziemi | `Tawerna.inject.reserve` |
| 901–902 | Story | 19, 24 | dziadek Stach, Lord Zaleski | `Tawerna.inject` ✓ |
| 903–909 | TownQuests (rekwizyty) | 8, 111, 3 | namioty i ludzie W6 | `Tawerna.inject` ✓ |
| 910–949 | TownLife | każda | mieszkańcy (pełny zakres; 949 ostatni wolny) | `Tawerna.inject` ✓ |
| 950 | TavernLife (TavernLife_Plan.js) | 1, 25, 26 | sztaluga z planem karczmy | `Tawerna.inject` ✓ |
| 951–959 | TownQuests (miejsca zadań) | 8, 13, 14, 19, 20, 22, 24, 25, 108, 118, 119, 120, 125 | numery osobno na każdej mapie (przydział dla paczek nowego terenu: docs/rozszerzenia/PLAN.md 3.4) | `Tawerna.inject` ✓ |
| 960–979 | HomeLife | 19 | kot Mruczek | `Tawerna.inject` ✓ |
| 980–998 | HomeDecor | 19 | ozdoby domu dziadka | `Tawerna.inject` ✓ |
| 1000–1999 | Forestry | każda (`"*"`) | posadzone sosny (z `_tw.forest`); od 2026-10-21 nowe drzewo bierze **pierwszy wolny** numer z 1000–1999 | `Tawerna.inject` ✓ |
| 2000–2099 | Okolice (pakiet 0) | nowy teren | rdzeń rozszerzeń: znaczniki, wspólne zdarzenia (docs/rozszerzenia/PLAN.md) | `Tawerna.inject` |
| 2100–2299 | Zasoby (paczka A) | nowy teren | woda i zasoby | `Tawerna.inject` |
| 2300–2499 | Lowy (paczka B) | nowy teren | zwierzęta i łowy | `Tawerna.inject` |
| 2500–2699 | Ludzie (paczka C) | nowy teren | ludzie przy drogach | `Tawerna.inject` |
| 2700–2899 | Zakon (paczka D) | nowy teren | tajemnice i zakon | `Tawerna.inject` |
| 2900–2949 | TownLife (drugi zakres) | każda | mieszkańcy paczek nowego terenu: A 2900–2904, B 2905–2909, C 2910–2929, D 2930–2939, rezerwa 2940–2949 | `Tawerna.inject` ✓ |
| 3000–3001 | Woz | 8, 111, 3, 21, 125 | wóz Wojciecha (3000) i Wojciech poza miasteczkiem (3001) na postojach szybkiej podróży (docs/ROZMOWY.md, tests/mapa_woz_test.js); ukryte, gdy wóz jest gdzie indziej | `Tawerna.inject` ✓ |
| 3002–3019 | Podroznicy | 125 (też 1, 25, 26, 8, 162 w etapach 2-6) | podróżni z promu: aktorzy scen na przystani 3002–3008 (przybyli 9-11, odpływający 14-15, kto patrzy na molo); Map162 (etap 2, `Podroznicy_Sprawy.js`): Zenon przy wadze 3008 (D42), Antek wśród rekrutów 3009 (D43); etap 3 (`Intrygi.js`, przez `Podroznicy.dodajWstaw`): nocny piechur ze świecą 3002 (Map025), sadza 3011 (Map025), list pod drzwiami 3014 (Map025/026), worek flisaka 3012 (Map125), sznur z ołowianką 3017 (Map009); rekwizyty 3010–3017 (trap...), zapas 3018–3019 (docs/PODROZNI.md 6.6); wstawiane z `Podroznicy_Data.js` (jego `T.inject` stoi przed TownLife - czyta znaczniki sali Map001 przed mieszkańcami) | `Tawerna.inject` ✓ |
| 3020–3049 | TownLife (czwarty zakres) | każda | podróżni jako mieszkańcy: obsada 3020–3033, Wolna Kompania 3034–3037, miejsca puli 3038–3041, Ksenia 3042, „gość spod trójki” 3043, zapas 3044–3049 (`Podroznicy_Data.js`, `TownLifeData.EXTRA_RANGES`) | `Tawerna.inject` ✓ |
| 3050–3069 | Lancuchy (łańcuchy podróżnych) | 25 (W15); 108, 19, 3, 162, 8, 111 (W16) | W15 „Święte kości”: kurier Baltazara pod pokojem 12 w noc sprzedaży 3050 (`SwieteKosci.js`), zapas 3051–3059; W16 „Dezerter”: Tymon w kryjówce (dzwonnica, chata dziadka, Kruczy Jar), w garnizonie, w obozie 3060 (`Dezerter.js`), zapas 3061–3069 (docs/PODROZNI.md 4.2, 4.3) | `Tawerna.inject` ✓ |
| 3070–3089 | Poselstwo (etap 5 podróżnych) | 26, 25 (W14); 25 (D44) | W14 „Poselstwo” (`Poselstwo.js`): Lord 3070 i Feliks 3071 na naradzie w Wielkim salonie, Albin pod Apartamentem Złotym w Noc Kupały 3072 (Map026), wosk na galerii 3073 i ślady przy złotej kracie 3074 (Map025), zapas 3075–3079; D44 „Podatek wojenny” (`Podroznicy5.js`): Feliks na korytarzu gości przed czwórką 3080 (Map025), zapas 3081–3089 (docs/PODROZNI.md 4.1, 2.7) | `Tawerna.inject` ✓ |
| 3090+ | *wolne* | | | |

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
`core_test.js` używa w swojej stronie numerów 780–798 (tylko w teście).

---

## 7. Zegar mapy i „spokój”

```js
Tawerna.onMapUpdate((scene, n) => { ... }, { owner: "HomeDecor", name: "refresh", every: 30, calm: false, priority: 0 });
```

- Jeden hak na `Scene_Map.update` (po całym łańcuchu - po mapie, zdarzeniach i starych hakach). `every` liczy klatki,
  w których zegar mógł ruszyć; `calm: true` (albo opcje jak niżej) pomija klatki niespokojne; `priority` ustawia
  kolejność między zegarami. Zegar, który rzuci błąd, jest zgłaszany raz i wyłączany - mapa idzie dalej.
- Czas każdego zegara na klatkę: `Tawerna.debug.updaters()`.
- **Własne haki `Scene_Map.prototype.update` → zegar mapy** (porządki 2026-10-28). Łańcuch haków szedł w kolejności listy wtyczek
  (część „po” każdego haka: Wydajnosc, SurvivalHUD, Journal, Spoilage, Needs, Debug, Latarnia, CleanHUD), a zegary rdzenia - po
  nim. Przeniesione dostały ujemne priorytety, żeby szły w dawnej kolejności między sobą i przed każdym starym zegarem (najmniejszy
  dotąd: -10):

  | zegar | wtyczka | priorytet | co |
  |---|---|---|---|
  | `filterArea` | Wydajnosc | -400 | obszar filtrów sceny i spriteset'u = ekran (ustawiany co klatkę, przed rysowaniem - miejsce w klatce bez znaczenia) |
  | `tick` | Spoilage | -300 | psucie się jedzenia (zegar gry) |
  | `drink` | Needs | -200 | G - łyk z bukłaka; dymki głodu i pragnienia co 30 klatek |
  | `f9` | Debug | -100 | F9; budynek z menu i akty zakładki „Wyspa i fabuła” po powrocie na mapę |

  Teraz idą po częściach „po” haków Latarnia i CleanHUD (wizja w latarni, układ czystego HUD) i po `checkClock` (dayStart /
  hourChange) - nic z tego od siebie nie zależy. Zostają własne haki: **Journal** (J i podsumowanie dnia - Atmosphere, wyżej w
  łańcuchu, robi autozapis po nocy w tej samej klatce, w której podsumowanie jest brane; na zegarze autozapis przyszedłby przed
  nim), **Wydajnosc `keepQuality`** (musi iść *przed* aktualizacją), **TawernaCore** (sam zegar); w plikach innych agentów:
  CleanHUD, SurvivalHUD (UI), Latarnia (wątki) - do przeniesienia przy ich pracy (priorytety jak wyżej: Latarnia -50, CleanHUD -40,
  żeby została kolejność).

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
| `<NazwaMapy:słowo>` | wnetrze / miejsce / off | CleanHUD | nazwa mapy „Kronika” przy wejściu: mała (wnętrze) albo pełna mimo zestawu kafli; `off` - bez nazwy (bez tagu: wnętrze według profilu Atmosphere) |

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

### 9.1 Widok świata (`Tawerna.view`, 2026-10-18)

Ile świata mapy widać na ekranie, w pikselach świata. Zwykle to sam ekran (`Graphics.width × Graphics.height`, skala 1 - wszystkie
liczby dokładnie jak wcześniej). Podczas lotu na białym orle (`Orzel_Lot.js`, wysoko) świat jest rysowany w skali 0,5, więc ekran
pokazuje go dwa razy więcej w każdą stronę.

- `Tawerna.view()` → `{ w, h, s }`, `Tawerna.view.w()` / `.h()` / `.scale()`; `Tawerna.view.setScale(s)` ustawia tylko Orzel_Lot
  (na szynie `viewScale`).
- **Zasada:** co żyje **w spritesecie mapy** (warstwa wielkości ekranu, odrzucanie „czy jest na ekranie”, liczba czegoś na ekran),
  pyta `Tawerna.view`, nie `Graphics`. Interfejs na scenie (HUD, okna, dymki) zostaje przy `Graphics`.
- Już na tym: Farming_Render (noc: `Sprite_NightLight.fitView`, kołysanie, maska ciepła), Sky (boczne światło, promienie, mgła),
  Storm (promienie), CloudShadows, Motyle, Torch, WaterFx, TownLife, Hunting/Humans (`onScreen`), Kruk, Birds, GroundDetail, Puddles.
  Pogodę silnika (`_weather`) oraz liście i błysk burzy Orzel_Lot rysuje w skali 1/s (zawsze wielkości ekranu).
- Jak działa oddalenie: `Game_Map.screenTileX/Y` dzielone przez skalę (przewijanie, środek kamery, zdarzenia „blisko ekranu”),
  tilemapa tak szeroka jak widok, cały `Spriteset_Map` w skali przez zoom ekranu od punktu (0, 0), tekstury filtrowane liniowo
  (przy 0,5 piksel ekranu = średnia 2 × 2). Szczegóły: `docs/orzel/KONCEPCJA.md` punkt 5.

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

### 11.3 Menu P (MenuRing.js) i wpisy innych wtyczek (MenuPanel.js)

Od 2026-10-28 gra ma jeden wygląd interfejsu (docs/UI_JEDEN_WYGLAD.md): paleta `UIStyle.C` w UITheme.js (czerń, żółty akcent
#ffd23f, jasny tekst, szare linie) - czytają ją HUD (`CleanHUD.C` to ten sam obiekt), menu P (`K` w MenuRing.js), mini-gry
(`Tawerna.ui.style()`), dziennik, walka, prolog; skórka okien `img/system/Window.png` ma te same barwy. Menu P, ekrany plików
(„Kontynuuj”, Scene_Save) i „Opcje” z tytułu rysuje MenuRing.js; dawne menu-panel MenuPanel.js, wygląd „Grafit i miedź” i wiersz
„Wygląd” w Opcjach usunięto.

Wpisy innych wtyczek (wołane przy wczytaniu; wtyczka stoi niżej na liście niż MenuPanel):

```js
const MP = Tawerna.api("MenuPanel");
MP.addCommand({ symbol: "tavernPlan", label: "Plan karczmy", owner: "TavernLife_Plan",
    when: () => wKarczmie(),                        // czy jest w menu tym razem (sprawdzane przy każdym otwarciu)
    enabled: () => true,                           // opcja (albo true / false)
    ok: scene => SceneManager.push(Scene_X) });    // O na zakładce
MP.addFoot({ owner: "Story", when: () => aktywna(), draw(bitmap, area) { ... } });   // przyjmowane, ale nic ich już nie rysuje
MP.commands();                                     // ["tavernPlan"] - dopisane komendy
```

- Komenda trafia do (ukrytego) okna poleceń Scene_Menu; MenuRing.js pokazuje ją jako osobną zakładkę za swoimi, O woła `ok(scena)`.
  Ten sam `symbol` drugi raz - wtyczka włożona do strony dwa razy - zastępuje stary wpis. Wpis, który rzuci błąd, trafia do konsoli.
- `addFoot` (Story: linia długu) zostaje dla zgodności - dług dziadka pokazuje zakładka Postać, stopki starego panelu już nie ma.
- Reszta MenuPanel.js: bez przycisków dotykowych w menu i na mapie, `Window_ItemDetail` (okno karty Plecaka - kartę rysuje MenuRing),
  lista „all” Plecaka, `isKeepsake`, `questNeeds`, `stampText`. Test: `tests/menu_panel_test.js`.

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
| teksty wątków (od 2026-10-23) | `js/teksty/<nazwa>.txt` (format: `docs/WATKI_DANE.md` 3; czyta `Watki.teksty`, przy starcie razem z `data/`) | ręcznie, po polsku; `node tools/teksty.js sprawdz` |
| teksty systemów (porządki 2026-10-28) | `js/teksty/`: karczma (TavernLife, _Render), stali_goscie (_Regulars), plan_karczmy (_Plan), silowanie (_ArmWrestle), rzutki (_Darts), tablica (QuestBoard_Data, QuestBoard, _Art, _Scene), stwory (Creatures_Data, Creatures), f9 (Debug), mieszkancy (TownLife_Data), kosci (TavernDice*), zmiana (TavernShift*), dom_dziadka (HomeDecor, HomeLife), pies (Dog), umiejetnosci (Skills_Data), zbojcy (Humans_Data, Humans), starcia (Starcia), las (Forestry), ptaki (Birds), lupy (Drops), czerwona_woda (CzerwonaWoda), potrzeby (Needs), zuzycie (Durability), psucie (Spoilage), burza (Storm), atmosfera (Atmosphere) | jak wyżej; migawki „przed”: `tests/fixtures/teksty/<plik>_*przed.json` |
| grafiki | `img/characters` (`!House_Decor`...), `img/pictures` (`*_Bust`), `img/system` (`QuestBoard_*`, Window.png) | PixelLab + narzędzia |
| czcionki | `fonts/` (Alegreya Sans, Alegreya SC, Caveat + licencje OFL) | - |

Zasady: nowe tabele do `Nazwa_Data.js` (edytor go nie rusza, ładuje się synchronicznie jak każda wtyczka); żadnych
tekstów w środku logiki; zapis plików z Pythona zawsze binarnie, z zachowaniem LF/CRLF danego pliku.

**Teksty systemów w plikach (porządki 2026-10-28)** - tak samo jak teksty wątków (`docs/WATKI_DANE.md` 3): stałe przez
`Watki.scal(OBIEKT, "plik", "klucz"[, "id"])` (słowa scalane w miejscu po wczytaniu plików i po F9 „Wczytaj teksty od nowa”),
napisy z funkcji `TK.kod.<funkcja>[n]` (`const TK = Watki.teksty("plik")`), z miejscami `Watki.wstaw(TK..., { n })`. Każdy plik
przeszedł `porownaj` znak w znak z migawką sprzed zmiany, `zgodnosc` (żaden napis starej wtyczki nie zginął) i porównanie starej
i nowej wtyczki w piaskownicy (dane, które gra czyta). Zasady przy przenoszeniu:
- **Kopia przy wczytywaniu wtyczek** (zanim są pliki): premie dla Survival (`defineBuff`) - przez `Watki.poTekstach(fn)` i
  `Tawerna.on("tekstyWczytane", fn)` (TavernLife `defineBuffs`, CzerwonaWoda `defineState`); argument przy wczytaniu (pomoc
  zakładki dziennika, etykieta w menu P, podpis doświadczenia) - getter; teksty liczone z ustawień (`"... " + pct(x) + " ..."`) -
  szablon `{rabat}` / `{procent}` w pliku, wypełniany przy użyciu.
- **Co klatkę żadnego `Watki.wstaw`** (wyrażenie regularne i nowy obiekt): takie funkcje zostają w kodzie (`kody --bez-funkcji`:
  `daysText` / `reqName` QuestBoard - okienko celu, `drawSlate` QuestBoard_Scene, pasek bossa Creatures - zwykłe sklejanie
  z `TK`) albo napis liczony raz / przy zmianie klucza rysowania (rzutki, siłowanie, kości, zmiana w karczmie).
- Zostają w kodzie: klucze, id, nazwy obrazków, dźwięków, czcionki, skrypty poleceń zdarzeń, nazwy wstawianych zdarzeń,
  `PLAN_DATA` (pisze go generator), cztery listy strażnika / Teodora w `TownLife_Data` (Dwor_Data podmienia je getterem przy
  wczytywaniu).
- Teksty, które są też kluczem (ostrożnie przy poprawianiu pliku): imię „Dziadek” twarzy cienia (`stwory.txt`, boss 90 szuka po
  imieniu), plotki zbójców (`zbojcy.txt` - zapis pamięta opowiedziane po treści).

**Co zostało** (napisy jeszcze w kodzie): wtyczki stojące na liście *nad* Watki.js (Farming*, Survival, Journal, ChoppableTree*,
Sky, DayNightCycle... - przy ich wczytywaniu nie ma jeszcze `Watki.teksty`; wymagałoby przesunięcia Watki.js wyżej na liście),
pliki UI (UITheme, MenuRing, MenuPanel, CleanHUD, SurvivalHUD, Combat_UI, HeroLook) i zmieniane teraz przez agenta UI (Combat,
Combat_Fight, Combat_Feel, Hunting*, Torch, Mood, Prologue, TitleScreen, Ubior), wątki (agent „wątki na silnik”), rodzina
ekwipunku (Equipment, Ubior_Data, Bron_Data, Bron, Ubior_Sklepy), mapa wyspy i nowy teren (MapaWyspy*, Okolice*, Wyspa_Data, Woz).

---

## 14. Strategia przenoszenia (etap 3 i dalej)

1. **Najpierw adaptery** - zrobione: rdzeń, zestaw UI, rezerwacje numerów, aliasy dawnych kluczy stanu (stary kod
   działa bez zmian obok nowego).
2. **Potem wtyczka po wtyczce** (lista niżej), **nigdy wszystko naraz**. Jeden krok = jedna wtyczka (albo ciasna grupa).
3. **Po każdym kroku testy na zielono**: testy tej wtyczki, `core_test.js`, `core_fixtures_test.js` i `core_fixtures_b2_test.js`
   (stare zapisy), `node tests/run.js smoke`, `node tests/run.js unit`. Od 2026-10-23 zwykle wystarczy
   `node tests/run.js zmiany --od znacznik` (znacznik na początku pracy: `node tests/run.js znacznik`) - unit i testy, które według
   zmierzonej mapy (`tests/mapa_testow.json`) wykonują zmienione funkcje, z smoke, gdy zmiana jest w kodzie każdej gry (`docs/TESTY.md`). Kilka wątków naraz: każdy na swoim porcie (`--port`; przy
   porcie innym niż 9396 wyniki idą do `tests/out_<nazwa>_p<port>.txt` - `docs/TESTY.md`); przy pełnym obciążeniu procesora
   strona gry potrafi wczytać się w połowie (losowe „brak X.js”, `SceneManager is not defined`, przekroczony czas) - wtedy
   powtórzyć test, zanim się go uzna za zepsuty.
4. **Nazwy wtyczek bez zmian** (lista gry i edytor trzymają parametry po nazwie), parametry bez zmian, API `window.Nazwa` bez zmian
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
  `docs/TESTY.md`, „Szybkie testy”. Od 2026-10-23: testy dobierane do zmian (`zmiany`, mapa testów z pomiaru pokrycia V8:
  `tests/lib/mapa.js`, `tests/mapa_testow.json`, `node tests/run.js mapa` / `--odswiez-mape`), turbo (`TEST_TURBO`, lista `TURBO` w
  `tests/run.js`), testy unit równolegle; rdzeń bez przeglądarki: `unit/core`, `unit/core_map`, `unit/talk` - `docs/TESTY.md`.
- Menu P (partia C1): `menu_panel_test` (panel, karta, plecak, dziennik, zapis, koniec gry), `tavern_plan_test` („Plan karczmy” w
  menu tylko w karczmie, otwiera plan, P wraca do menu), `story_test` i `smoke/story` (linia długu: `Story.lastMenuLine/Label`),
  `hero_menu_test` (Postać pierwsza, liczba punktów), `journal_test` (Dziennik w kolumnie komend).
- Wtyczki spoza listy wtyczek (`js/tawerna_wtyczki.js` + `js/plugins.js`) wkłada zestaw testów (`kit.test({ plugins: [...] })`, rdzeń sam na początek).

---

## 16. Rozmowy z postaciami (`Tawerna.talk`, 2026-10-23)

Spis wszystkich rozmów w grze, drabina przejęć mieszkańców, menu z opcjami, haki zdarzeń i znalezione konflikty: **`docs/ROZMOWY.md`**.
Test: `tests/rozmowy_test.js`.

### 16.1 Zasada

1. **Rozmowa z postacią = przejęcie albo jej własne kwestie.** Kto mówi, rozstrzyga **nazwany priorytet** przejęcia
   (`Tawerna.talk.PRIORITY`), nigdy kolejność listy wtyczek ani chwila rejestracji. Równy priorytet: nazwa właściciela.
2. **Menu postaci = jej wiersze + opcje innych systemów + pożegnanie zawsze na końcu.** System, który chce dopisać do czyjejś
   rozmowy jeden wiersz (sklep, temat, usługa), dopisuje **opcję** - nigdy nie przejmuje całej rozmowy (tak zginęły kwestie Kłosa).
3. **Przejęcie tylko wtedy, gdy rozmowa musi być inna**: scena zadania, pierwsze spotkanie, grzywna, oddanie rzeczy. Przejęcie, które
   ma ustąpić zadaniom, stoi niżej niż `quest` (sklepy: `shop`) - wtedy zadania mówią pierwsze bez żadnych wyjątków we wtyczce;
   menu właściciela postaci nad zadaniami (`owner`, `meet`) pyta TownQuests samo (`questWants`).
4. Polecenia to zwykłe polecenia silnika (101/401 z `\SPK[n]`, 102/402/404) - SpeechBubbles pokazuje je jak dotąd (O wybór,
   P = ostatni wiersz = pożegnanie). Usługa nic nie zapisuje; stan rozmów (flagi, `met`, `greeted`) zostaje w stanach wtyczek.
5. Wtyczka **nie owija** `TownLife.talk`, `Story.talk`, `Game_Event.prototype.start` ani `Game_Event.prototype.list` - jest na to
   usługa i dwa haki rdzenia (16.6).

### 16.2 API

```js
// przejęcie: run(ctx) -> polecenia (rozmowa jego) albo null (pytaj dalej)
const off = Tawerna.talk.takeover({ owner: "Wtyczka", name: "", who: ["kowal", "kupiec"],   // klucz, lista, "*", RegExp albo fn(key, ctx)
    priority: Tawerna.talk.PRIORITY.owner + 10, run: ctx => ... });
// opcja w menu postaci: jeden wiersz (label, cmds albo run) albo kilka naraz (rows)
Tawerna.talk.option({ owner: "Wtyczka", id: "sklep", who: "kwatermistrz", order: Tawerna.talk.ORDER.extra,
    when: ctx => ..., label: "Pokaż zbrojownię", cmds: [/* polecenia gałęzi */], say: "" });   // label / cmds / say mogą być fn(ctx)
Tawerna.talk.option({ owner: "Wtyczka", id: "x", who: "borgar", rows: ctx => [{ label, cmds, say }] });
Tawerna.talk.option({ owner: "Wtyczka", id: "y", who: "kowal", label: "Coś", run: ctx => [/* polecenia po wyborze */] });   // (pick)
// rozmowa: przejęcia, a bez nich base(ctx); skip - właściciel pominięty tym razem
Tawerna.talk.run(interp, "kowal", { ev, owner: "TownLife", base: ctx => [/* własne kwestie */], skip: "Bron" });   // -> kto miał rozmowę
Tawerna.talk.resolve(interp, who, opts)              // to samo bez grania: { list, by, ctx }
Tawerna.talk.rows(who, ctx, ownRows, { owner })      // wiersze menu: własne + opcje, po order
Tawerna.talk.menu(out, rows, "Bywaj.")               // wybór: wiersze, pożegnanie ostatnie (= anulowanie)
Tawerna.talk.choice(out, labels, branches, cancel)   // goły wybór (jak choiceTo wtyczek)
Tawerna.talk.takeovers(who) / .options(who) / .last()  // F9, testy: kto po kolei, jakie opcje, kto mówił ostatnio
```

`ctx = { who, ev, interp, eventId, skip }`. Priorytety (od najwyższego): `scene` 1000 (scena, która musi mieć rozmowę), `errand` 900
(cudza krótka sprawa z „Nie, w innej sprawie”), `owner` 700 (wtyczka, do której postać należy), `handBack` 650 (oddanie rzeczy
właścicielowi), `meet` 600 (pierwsze spotkania i menu ludzi przystani i pustelni), `wrap` 550 (zwykła rozmowa i jeden wiersz po niej),
`quest` 500 (co mają do powiedzenia zadania TownQuests), **`shop` 450** (sklep postaci bez własnego menu - tylko gdy wszyscy wyżej nic
nie mają; decyzja 2026-10-23: sklep nigdy nie zabiera kwestii postaci), `greet` 400 (powitanie dnia TownQuests), `after` 300. Liczba w paśmie
(`owner + 50`) ustala kolejność wtyczek tego samego pasma - pełna drabina w `docs/ROZMOWY.md`, rozdz. 1. Kolejność wierszy menu
(`Tawerna.talk.ORDER`): `first` 0, `own` 100 (domyślna dla własnych wierszy), `extra` 500 (domyślna dla opcji), `chat` 800 („Co
słychać?”, „Porozmawiaj”); pożegnanie nie jest wierszem - `menu` zawsze dokłada je na koniec.

**Kto (`who`)**: klucz mieszkańca TownLife (`kwatermistrz`, `kowal`...), rola Story (`grandpa`, `lord`, `door`, `borgar`, `watch`),
żołnierz garnizonu `zolnierz:<rola>`. Przejęcie z `"*"` albo szerokim `fn` łapie **każdą** postać, także Story - przejęcie tylko dla
mieszkańców bierze `who: key => !!TownLife.RESIDENTS.find(r => r.key === key)` (jak TownQuests).

### 16.3 Jak dodać opcję (wiersz w czyimś menu)

```js
// Bron.js: „Pokaż zbrojownię” w menu Kłosa - jego kwestie i jego menu zostają, sklep to jeden wiersz
Tawerna.talk.option({ owner: PLUGIN, id: "sklep:kwatermistrz", who: "kwatermistrz",
    rows: ctx => menuRows("kwatermistrz", ctx.ev) || [] });   // [] - nic dziś (godziny, przychylność, Kłos wydany)
```

Opcja pojawi się w każdym menu tej postaci, które bierze opcje (rozdz. 2 `docs/ROZMOWY.md`). Postać bez menu (zwykły mieszkaniec:
jedna linijka) opcji nie pokazuje - wtedy potrzebne jest przejęcie albo menu właściciela.

### 16.4 Jak dodać przejęcie

```js
// Act3.js: Ambroży w oblężeniu - tylko gdy zadania nic nie mają ("after")
Tawerna.talk.takeover({ owner: PLUGIN, who: "dzwonnik", priority: Tawerna.talk.PRIORITY.after, run: c => ambrozyTalk(c.who, c.ev) });
// Zakon.js: „Nie, w innej sprawie” = ta sama rozmowa bez tej wtyczki
ACT.pass = interp => TownLife.talk(interp, { skip: PLUGIN });
```

Wybór pasma: czy to musi być przed zadaniami (`scene` ... `wrap`), czy po nich (`after`)? Czy ustępuje samo (`questWants`)?
Nowe przejęcie dopisz do tabeli w `docs/ROZMOWY.md` i do drabiny w `tests/rozmowy_test.js`.

### 16.5 Postać z własnym menu i własne wejście rozmowy

```js
// Garnizon.js, menu Kłosa: własne wiersze (kolejność own), „Co słychać?” (chat), opcje innych między nimi, „Bywaj.” na końcu
const rows = labels.map((label, i) => ({ label, cmds: branches[i] }));
rows.push({ label: "Co słychać?", cmds: ..., order: Tawerna.talk.ORDER.chat });
return Tawerna.talk.menu(out, Tawerna.talk.rows("kwatermistrz", { ev }, rows), "Bywaj.");
// Story.js: nowa postać / nowe wejście rozmowy - inni mogą je przejąć (TownQuests: linie zadania u Lorda i dziadka)
function talk(interp, role, opts) {
    const ev = $gameMap.event(interp.eventId());
    if (ev) Tawerna.talk.run(interp, role, { ev, owner: PLUGIN, skip: opts && opts.skip, base: () => ownTalk(ev, role) });
}
```

Menu biorą dziś opcje u: Kłosa i żołnierzy garnizonu (Garnizon), Tadka z rabatem (Ludzie), Ludmiły i Baltazara po W5 (Kantor),
sklepikarzy ubrań (Ubior_Sklepy), Borgara (Story). `addMenu` (Garnizon, Kantor, Ludzie, Ubior_Sklepy) usunięte.

### 16.6 Start zdarzenia i jego polecenia

```js
Tawerna.onEventStart(ev => !!(ev._town && ev._town.hidden), { owner: PLUGIN, priority: "hidden" });   // true = nie startuje
Tawerna.onEventList(ev => (warunek ? STUB : null), { owner: PLUGIN, priority: Tawerna.onEventList.PRIORITY.scene + 10 });
Tawerna.onEventList.own(ev)   // własne polecenia strony z pominięciem haków
```

Start: `hidden` 900 (ukryta postać nie startuje), `instead` 500 (coś innego zamiast strony: stół kości, kot na posłaniu), `before` 100
(powiadomienie, zawsze `false`: tryb walki). Polecenia: `closed` 900 (zamknięte: bar, drzwi), `scene` 800 (scena zadania przy drzwiach,
rzeczy, osobie), `own` 500 (własne miejsca systemu: kocioł, tawerna, bywalcy, tablica), `person` 300 (rozmowy fabuły). Kto gdzie:
`docs/ROZMOWY.md`, rozdz. 4. Jedyny hak poza rdzeniem: `Game_Event.list` w ChoppableTree (kamienie i krzaki z pustą stroną).

### 16.7 Sprawdzanie

- F9, zakładka „Rdzeń”: wiersz „Rozmowy: przejęcia N, opcje M, start zdarzeń S, polecenia zdarzeń L” i przejęcia od pierwszego;
  `Tawerna.debug.talks()` - całość.
- `tests/rozmowy_test.js` (17): usługa (priorytety, remis, skip, opcje dwóch systemów w dowolnej kolejności rejestracji, pożegnanie
  ostatnie, `pick`), drabina gry (sklepy pod zadaniami, nad powitaniem dnia), kolejność haków startu i poleceń, Kłos z jego menu i sklepem jako wierszem,
  przejęcie `scene` nad Garnizonem, stary `TownLife.addTalkHook`, ukryty mieszkaniec nie startuje, stary zapis `tavern_evening` -
  menu Borgara z opcjami TavernLife.

---

## 17. Wątki jako dane i teksty w plikach (`Watki.js`, 2026-10-23)

Całość - spis wątków, silnik, format tekstów, pilot, plan dalszych etapów: **`docs/WATKI_DANE.md`**.

- **Silnik** `js/plugins/Watki.js` (warstwa 3, zaraz pod Journal): `Watki.watek(def)` - wątek jako dane: stan (`Tawerna.state`, wersja,
  migracje), rozdziały (kroki zadania TownQuests na ich numerach - dziennik, znaczniki i nagrody zostają TownQuests; albo własny
  rekord i źródło dziennika „watki”), warunki `gdy`, akcje `zrob` (nazwane: `Watki.act(this, [id, akcja, ...])`), rozmowy (drzewa
  kluczy tekstów z wyborami), tematy przy barze Borgara, skoki F9 (`Watki.f9` - Debug.js pokazuje sekcję każdego wątku). Kod specjalny
  (sceny, walki, ruch, wstawiane zdarzenia) zostaje we wtyczce wątku jako haki (`w.haki({...})`).
- **Teksty** `js/teksty/<nazwa>.txt`: `klucz = tekst`, `[klucz]` + kwestie (do pustej linii), `> ` bohater, `{x}` wstawia gra.
  `Watki.teksty("nazwa")` daje obiekt wypełniany przy starcie gry (`DataManager.loadDatabase` / `isDatabaseLoaded` - przed tytułem;
  brak pliku = Retry silnika). Narzędzie: `node tools/teksty.js sprawdz | porownaj | wyciagnij | lista`.
- **Rozmowy w poleceniach zdarzeń**: jeden budowniczy `Watki.mowa` (`wrap` 46 znaków, 3 linie w oknie, `\SPK[n]`, `choiceTo`) zamiast
  kopii w każdej wtyczce wątku (kopie znikają etapami).
- **Pilot**: W4 rozdz. 6-8 - `Kasztelan_Data.js` (dane), `Kasztelan.js` (haki), `js/teksty/kasztelan.txt`. Testy: `tests/unit/watki.test.js`,
  `tests/watki_test.js` (port 9625), `w4_borgar_test`, `w4_key_test`.

## 18. Podróżni z promu (`Podroznicy.js` + `Podroznicy_Data.js`, 2026-10-28)

Projekt i stan budowy: **`docs/PODROZNI.md`** (rozdz. 11). Etap 1 = rdzeń bez zadań.

- **Dane** (`Podroznicy_Data.js`, nad TownLife): obsada z oknami przybycia, pula 16 typów na 4 ciałach, pokoje 4-24 Map025 (miejsca
  przy kufrach), plany dnia (szablony), scena przybycia; wątek `podroznicy` (`Watki.watek` - stan `Tawerna.state("podroznicy")` v1,
  teksty `js/teksty/podroznicy.txt`, sekcja F9); mieszkańcy TownLife 3020-3049 z polami-getterami (imię, arkusz, mapa, plan, wnętrza)
  pytającymi silnik - TownLife.js bez zmian.
- **Silnik** (`Podroznicy.js`): planowanie promu raz w dzień promu (6:00; czysta `Podroznicy.logika.planuj` - test jednostkowy), odpływy
  o 15:00, księga, Renoma karczmy (osobna od Sławy bohatera), utarg Borgara, aktorzy i scena na przystani, rozmowy (`Tawerna.talk`:
  `meet+5` pierwsze spotkanie, `shop+25` menu, opcja Borgara „Księga gości”, hak startu „hidden” aktorów), F9 przez `Watki.f9`
  (silnik wątków ma teraz wiersze własne wątku: `def.f9.wiersze/wybierz/ok`, rodzaj wiersza `isleWatek:<co>`).
- **Fale W6** - jedno źródło: `TownQuests.waves()` (10, 25, 37, 52), czytają je Przystan, Garnizon i Podroznicy.
- **Szyna:** `prom`, `podroznyPrzyplynal`, `podroznyOdplynal`, `renoma`, `podroznicyScena`. Testy: `tests/unit/podroznicy.test.js`,
  `tests/podroznicy_test.js` (port 9761); tryb cichy testów wyłącza samą scenę (`Podroznicy.auto(false)` w `QUIET`).
- **Łańcuchy W15 / W16** (etap 4, 2026-10-29): `SwieteKosci_Data.js` + `SwieteKosci.js` (teksty `swiete_kosci.txt`), `Dezerter_Data.js` +
  `Dezerter.js` (`dezerter.txt`) - wątki silnika z własnymi zadaniami W15 i W16; postacie trzymają prom dłużej przez getter `zadania` w
  `PodroznicyData.OBSADA` (raz, i tylko póki sprawa trwa - ich późniejszy odpływ to zakończenie łańcucha „bez bohatera”). Akt III: wspólna
  lista `Act3Data.WIEDZA_FRAKCJI` (najwyżej jeden zwiadowca więcej w fali 3, nigdy obok zwiadowcy W9/W7), obrońcy „tymon” i „tymon_oboz”,
  żołnierze garnizonu od przychylności 60 przy `tymonGarnizon`. Test: `tests/lancuchy_test.js` (port 9791).
- **Etap 5** (2026-10-29): `Poselstwo_Data.js` + `Poselstwo.js` (`poselstwo.txt`) - łańcuch W14 (Albin, poseł z Ostapem w Apartamencie
  Złotym - przyjeżdżają tylko, gdy jest `TavernLife.addRoomGuard`; kolacja u Borgara 20:00-21:00 = przepustka „w służbie” przez
  `TavernLife.addGatePass`; narada przez ścianę Jadalni; Noc Kupały; ślady i molo; list); `Podroznicy5_Data.js` + `Podroznicy5.js`
  (`podroznicy5.txt`) - D44 „Podatek wojenny”, D47 „Wolna Kompania” (Hubert jako rywal kości tylko tej sprawy: dopisany w biegu do
  `TavernDice_parts.data.OPPONENTS`, bez `OPP_ORDER`), D48 „Mapa Kruczej Wyspy”. Mechanizmy etapów 2-3 (podsłuch, nocne kroki, listy,
  przeszukanie) rejestrowane, gdy są. Akt III: `WIEDZA_FRAKCJI` (+`pielgrzymDonosi`, `mapaTwierdzy`), nowe wspólne listy
  `Act3Data.WIEDZA_FALA2` (łucznik więcej w fali 2) i `WIEDZA_FALA4` (najemnik więcej w fali 4), obrońca „kompania” (2, po dzwonie),
  żołnierze garnizonu przy `poselWdzieczny` od przychylności 70. Test: `tests/poselstwo_test.js` (port 9791).
