# Testy - jak uruchamiać i pisać

Testy gry to skrypty Node, które uruchamiają prawdziwą grę w Edge bez okna (przez CDP, `tests/cdp.js`)
i sprawdzają zachowanie wtyczek. Każdy wypisuje linie `PASS ...` / `FAIL ...` i na końcu `N/M passed`.

Potrzebny jest serwer gry na `127.0.0.1:8765` - `tests/run.js` uruchamia go sam, gdy nic tam nie odpowiada
(`tools/serve.js`: pliki w pamięci, bez gubienia plików pod obciążeniem). Ręcznie, z katalogu projektu:

```
node tools/serve.js
```

(Stary `python -m http.server 8765 --bind 127.0.0.1` też działa, ale pod obciążeniem gubi pliki - gra wtedy klika „Retry".)

### Szybkie testy (od 2026-09-29)

- **Karta graficzna**: przeglądarka testowa rysuje na GPU (ANGLE d3d11) - start gry ~1,5 s zamiast ~6 s, gra w pełnym tempie.
  `CDP_GPU=0` wraca do rysowania na procesorze (SwiftShader).
- **Jedna przeglądarka na przebieg** (`run.js` domyślnie): każdy test dostaje nową kartę tej samej przeglądarki; zapisy i opcje
  gry są przed każdym testem czyszczone (jak w świeżym profilu), zabłąkane karty zamykane po teście. `--no-reuse` = stara droga
  (osobna przeglądarka na test).
- **Tylko potrzebne testy**: `node tests/run.js affected Farming Dog` - testy (także `unit/` i `smoke/`), które wspominają te wtyczki,
  plus smoke; część liczy się też jako jej główna wtyczka (`Farming_Build` → i testy Farming); `node tests/run.js changed` - to samo dla
  wtyczek zmienionych od ostatniego przebiegu `full` (bez niego: zmiany według gita).
- **Bez przebiegu „przed"**: `tests/last_results.json` trzyma ostatni wynik każdego testu; tabela `run.js` pokazuje go w kolumnie
  `before`. Zmiana wtyczki = jeden przebieg po zmianie i porównanie z `before` (pełny `full` raz na koniec dnia - zapamiętuje też
  stan wtyczek dla `changed`).
- **Testy czułe na czas**: gra na GPU chodzi w pełnym tempie, więc sprawdzenie „z zewnątrz" co klatkę może przegapić krótkie okno.
  Takie chwile łap w pętli gry (np. owinięte `SceneManager.updateMain`, jak `__sitRec` w `sit_test`) albo odczekaj kilka klatek, zanim
  sprawdzisz skutek (`combat_test`: pasek dzika). `combat_test`, `sit_test`, `talk_busts_test`, `pantry_fresh_test` są już tak poprawione
  (etap 6). Gdy test padnie tylko na GPU, porównaj z `CDP_GPU=0 node tests/run.js <test> --no-reuse`.

## Uruchamianie

```
node tests/run.js smoke          szybki zestaw (~6 min): każdy główny system raz
node tests/run.js full           wszystkie tests/*_test.js (długo - kilkadziesiąt minut)
node tests/run.js unit           czysta logika w Node, bez przeglądarki (sekundy)
node tests/run.js needs story_test smoke/farm     tylko te (nazwa z _test albo bez)
node tests/run.js unit smoke     można łączyć
```

Opcje: `--port N` (port CDP, domyślnie `CDP_PORT` albo 9396), `--retry N` (ile razy powtórzyć test,
który padł na starcie gry albo na serwerze - domyślnie 1), `--timeout S` (limit jednego testu, domyślnie
420 s), `--list` (tylko pokaż, co by poszło), `--no-reuse` (osobna przeglądarka na każdy test; `--reuse` - wspólna - jest domyślne).

Testy idą **jeden po drugim** (dwa przebiegi naraz - każdy na swoim porcie - już się nie gryzą, ale obciążają maszynę). Wynik: tabela na ekranie, `tests/results.txt` (te same sekcje co z `tests/run.sh`
i tabela), pełny zapis każdego testu w `tests/out_<nazwa>.txt` (przy porcie innym niż 9396 z `_p<port>` w nazwie - niżej).
Kod wyjścia 0 = wszystko czyste.

Pojedynczy test też można puścić wprost: `CDP_PORT=9396 node tests/needs_test.js`.

`combat_test`, `hunting_test`, `smoke/farm`, `hold_gather_test` i `tree_strike_test` mają przełącznik `REGISTERED=1` (np.
`REGISTERED=1 node tests/run.js combat_test hunting_test`): części (`Combat_Fight`, `Combat_UI` / `Hunting_Path`, `Hunting_AI`,
`Hunting_Weapons` / `Farming_Plots`, `_Build`, `_Stations`, `_UI` / `ChoppableTree_Objects`, `_Swing`, `_Render`) stają na liście wtyczek
strony zaraz pod główną - tak jak w `js/plugins.js` od 2026-09-29 (sam plik nietknięty) - i test sprawdza też tę kolejność. Bez
przełącznika gra idzie z listą z `js/plugins.js`; części, których na niej nie ma, wkłada sama główna wtyczka (`PluginManager.loadScript`).
(`quest_board_test`, `tavern_dice_test`, `tavern_shift_test` mają ten sam przełącznik dla swoich części.)
Stary `tests/run.sh` dalej działa.

`marathon_test.js` nie wchodzi do `full` (gra autopilotem całe dni i wysyła powiadomienia na telefon) -
tylko na życzenie: `node tests/marathon_test.js [dni] [przyspieszenie]`.

### Porty CDP

Każda przeglądarka testowa słucha na swoim porcie CDP. Dwie przeglądarki na jednym porcie się gryzą,
więc każdy, kto testuje równolegle (np. drugi agent), bierze **własny** port:

- 9396 - testy tego etapu (`run.js` domyślnie),
- 9398-9416 - testy etapu 3 (każdy ma swój port w komentarzu na górze pliku, np. `core_fixtures_test` 9398,
  `core_fixtures_b2_test` 9404, `tavern_life_save_test` 9406); równoległe wątki etapu 3 biorą każdy własny
  (`--port 9412`, `9414`, `9416`...). Przy porcie innym niż 9396 `run.js` pisze do plików z portem w nazwie:
  `tests/out_<nazwa>_p<port>.txt` i `tests/results_p<port>.txt` - dwa wątki z tym samym testem się nie mieszają,
- 9334 - podglądane okno gry (autopilot `play.js`),
- 9333 - domyślny `cdp.js` (stare testy bez `CDP_PORT`),
- stare testy mają w komentarzu swój port (np. `CDP_PORT=9394` dla `home_decor_test.js`).

Kit przed startem zamyka przeglądarkę, która została na jego porcie po przerwanym teście.

## Zestaw smoke

| test | co sprawdza |
|---|---|
| `smoke/fixtures` | start gry, wczytanie każdej zapisanej gry z `tests/fixtures/`, gra po wczytaniu, zapis -> wczytanie |
| `smoke/story` | nowa gra fabularna, rozmowa z dziadkiem, dziennik, dług w menu, pole, Borgar najmuje, zapis |
| `smoke/farm` | menu budowy (Q), plac budowy i młotek, warsztat, piec i praca w godzinach, uprawa ziemniaków, zapis; Farming w pięciu plikach (każdy raz w stronie), zdarzenia `build`, `craft`, `harvest` |
| `combat_test`, `wolves_test` | walka, klawisze, atrybuty, wilki w nocy |
| `needs_test` | głód i pragnienie |
| `journal_test` | dziennik, cele, zakładki |
| `menu_panel_test` | menu P |
| `tavern_interior_test` | wnętrze tawerny, przejścia, piwnica, schody |
| `quest_board_test` | tablica zleceń (minigra tawerny) |
| `bubbles_test` | dymki rozmów |
| `home_decor_test` | dom dziadka |

Lista jest na górze `tests/run.js` (`SMOKE`).

## Pisanie testu z kitem

`tests/lib/kit.js` robi to, co każdy test kopiował: start gry, ponawianie plików (przycisk Retry),
nowa gra, pomocnicy, podsumowanie. Przykład (`tests/mojtest_test.js`):

```js
// Mój test: dom dziadka, rozmowa, chleb, pole, menu budowy, zapis.
const kit = require("./lib/kit.js");

kit.test({ plugins: ["HomeDecor"] }, async t => {         // wtyczki spoza js/plugins.js - wstrzyknięte
    await t.newGame({ story: true, skipIntro: true, hour: 10 });
    t.check("gra zaczyna się w domu dziadka", (await t.eval("$gameMap.mapId()")) === 19);

    const talk = await t.talkTo(901);                      // bohater staje przy dziadku, rozmowa do końca
    t.check("dziadek mówi o długu", talk.done && /dług|grosza/i.test(talk.text), talk.text);

    await t.give(83, 2);                                   // 2 chleby
    t.check("chleb w torbie", (await t.count(83)) === 2);

    await t.go(3, 26, 14);                                 // pole dziadka
    await t.key("Q");                                      // prawdziwy klawisz
    t.check("Q otwiera menu budowy", await t.eval("!!$gameTemp._farmMenuOpen"));
    await t.key("Q");

    await t.saveTo(1);
    t.check("zapis się wczytuje", await t.loadFrom(1));
    await t.shot("mojtest/koniec.png");                    // ścieżka względem tests/
});
```

`kit.test` sam wypisze `console errors: ...` i `N/M passed`, zamknie przeglądarkę i ustawi kod wyjścia.
Błędy konsoli gry to nieudany test (`errorCheck: "nazwa"` robi z nich zwykły check o tej nazwie).

Najważniejsze funkcje (`t.`):

- gra: `newGame({ story, map, x, y, dir, hour, day, skipIntro, deadline, calm, needsOff, quiet, minimap })`,
  `go(mapa, x, y, kierunek)`, `calm()`, `quiet()`, `toTitle()`, `scene()`, `onMap(id)` (wyrażenie)
- strona: `eval(wyr)`, `json(wyr)`, `frames(n)`, `wait(ms)`, `until(wyr, sekundy)`, `shot(plik)`, `errors()`
- klawisze: `press("ok")` (przycisk Input), `hold("up", klatki)`, `tapOk()`, `key("O")` (prawdziwy klawisz),
  `mouseMove(x, y)`, `click(x, y)`, `face(kier)`, `locate(x, y, kier)`
- rozmowy: `talkTo(id | wyrażenie, [wybory], { secs, shotAtChoice })`, `run(komendy)` + `t.cmd.text/choice/end`,
  `finish()`, `popups()`, `notices()`
- stan: `setHour(h)`, `setDay(d, h)`, `gold(n)`, `give(id, n)`, `count(id)`
- zapisy: `saveTo(slot)`, `loadFrom(slot)`, `loadFixture(nazwa)`, `saveFixture(nazwa, { desc })`
- koniec: `check(nazwa, ok, info)`, `done()` (robi to `kit.test`)

`kit.open(opcje)` + `await t.done()` to to samo co `kit.test`, ręcznie. Opcje `open`: `port`, `width`,
`height`, `dpr`, `plugins`, `overlay` (jak `GAME_OVERLAY`), `beforeLoad` (skrypt przed grą), `bootCheck`
(„the game boots" jako check), `errorCheck`, `evalTimeout`.

Przykłady przeniesione na kit: `bubbles_test`, `talk_busts_test`, `tavern_interior_test`, `home_decor_test`,
`quest_board_test`, `needs_test` (te same checki co przedtem; stare wersje w
`backup_art_2026-09-28/pre_refactor/tests/`).

## Zapisane gry (fixtures)

`tests/fixtures/<nazwa>.json` to zapisy zrobione przez samą grę (dokładnie ten tekst, który gra
zapisała), z opisem i podsumowaniem na górze pliku:

- `new_story_day1` - nowa gra fabularna, dom dziadka, dzień 1, po rozmowie z dziadkiem;
- `tavern_evening` - dzień 20, 19:00 w tawernie, dwie zmiany u Borgara, sakiewka, reputacja 60;
- `day40_farm` - dzień 40, pole dziadka: ~25 budynków, pies przy budzie, chatka z meblami, jedzenie,
  uprawy, narzędzia, połowa długu spłacona;
- `home_decor_v0` - zapis zrobiony starym HomeDecor.js (stan w `$gameSystem._homeDecor`;
  `tests/fixtures/make_home_decor_v0.js`).

Stare zapisy z rdzeniem (etap 3: stan przechodzi do `$gameSystem._tw`, stary klucz zostaje ukrytym aliasem):

| test | co sprawdza |
|---|---|
| `core_fixtures_test` | cztery zapisy wstają i grają; `_tw` z wersjami; ozdoby i kot w domu; adopcja `_homeDecor`, `_story`, `_forest` (partia B1), `_hero`, `_combatMode`, `_combatHand` (C3), `_hunt`, `_carcasses`, `_sneak` (D2); nowy zapis tylko w nowym miejscu i jego ponowne wczytanie |
| `core_fixtures_b2_test` | partia B2: adopcja `_birds`, `_dog`, `_journal`; pies z `day40_farm` przy budzie i dalej pracuje, kury w zagrodzie, dziennik z celami i notatkami; zegary mapy na liście rdzenia; `storyStep` odhacza cel od razu; partia E1: `_farm` z każdego zapisu w `_tw.farm` (`$gameSystem._farm` tylko ukryty alias), 24 budynki `day40_farm` na polu, meble chatki, pola, jedzenie w spiżarni, nowy zapis bez `_farm` |
| `tree_strike_test` | (między innymi) stary zapis z `_stormTrees` (C2) oraz `_smoulder` / `_treeFruit` (E2) przejęte do `_tw` |
| `tavern_life_save_test` | `tavern_evening` z TavernLife podzielonym na części: adopcja `_tavernLife`, pokój wynajęty po wczytaniu, nowy zapis tylko w `_tw`; siłowanie (pauza, „Poddaję się”) i rzutki na `Scene_MiniGame` |
| `quest_board_test` | (między innymi) `tavern_evening`: `_quests` i `_tavernShift` przejęte do `_tw` |
| `smoke/fixtures` | każdy zapis wstaje, gra po wczytaniu, zapis -> wczytanie |

W teście: `await t.loadFixture("day40_farm")` (wczytuje jak ekran wczytywania). To są „stare zapisy"
dla kolejnych etapów przebudowy - zgodność ze starymi zapisami to reguła, więc `smoke/fixtures` musi
przechodzić. Nowe robi `node tests/fixtures/make_fixtures.js [nazwa]` - **istniejących nie nadpisywać**
bez powodu (przestałyby być starymi zapisami).

## Testy jednostkowe (bez przeglądarki)

`tests/unit/*.test.js` ładują wtyczki w samym Node (`tests/lib/sandbox.js`: udawane okno, w którym każda
nazwa silnika jest atrapą) i sprawdzają czyste funkcje:

| zestaw | sprawdzeń | co |
|---|---|---|
| `unit/tavern_dice` | 17 | `TavernDice`: liczenie punktów, kości |
| `unit/quest_board` | 15 | `QuestBoard`: losowanie zleceń, progi reputacji |
| `unit/path8` | 10 | `Hunting_Path` (+ rdzeń, `Hunting`): szukanie drogi path8, najazdy |
| `unit/combat` | 13 | `Combat` w trzech plikach (+ rdzeń, `Skills_Data`): `window.Combat` z każdą dawną nazwą, części w torbie `Combat_parts` i czytelny błąd przy złej kolejności, adopcja `_hero` / `_combatMode` / `_combatHand` ze starego zapisu, umiejętności, poziomy (`levelUp`) i doświadczenie za `kill` |
| `unit/farming_data` | 21 | `Farming_Data` + `Farming` w pięciu plikach (+ rdzeń): pory roku, budynki, tabela jedzenia; torba `Farming_parts`, dawne nazwy `window.Farming`, czytelny błąd, gdy część stoi nad Farming.js albo brak rdzenia |
| `unit/choppable_tree` | 17 | `ChoppableTree` w czterech plikach (+ rdzeń): dawne nazwy `window.ChoppableTree`, tablica zamachów gotowa przed częściami (Combat_Fight), torba `ChoppableTree_parts` i czytelny błąd przy złej kolejności, tagi każdego zdarzenia każdej mapy starym odczytem i przez `Tawerna.tag` - te same liczby, adopcja `_treeFruit` / `_smoulder`, `chop` |
| `unit/map_flags` | 26 | `TawernaCore`: notatka każdej mapy z `data/` czytana starymi wyrażeniami wtyczek i przez `Tawerna.mapFlag/mapTag` - te same wartości; do tego „on” / „off” / „pierwszy” wygrywa i znane różnice (nie ma ich w danych) |
| `unit/tavern_life` | 17 | `TavernLife` (+ rdzeń, zestaw UI, `TavernLife_Darts`): ceny Borgara (danie dnia, progi reputacji, rabaty z parametrów, pokoje, kąpiel), punkty rzutek na całej tarczy, atrybuty `<Tavern:...>` czytane po staremu na tagach rdzenia (`plate=0,-2` zostaje w całości, cudzysłowy trzymają spacje) |

Wtyczki na rdzeniu ładuje się razem z nim, części w kolejności z listy wtyczek: QuestBoard, TavernDice, TavernLife -
`unit.load(["TawernaCore", "TawernaUI", ...])`; `unit/combat` - `["TawernaCore", "Skills_Data", "Combat", "Combat_Fight", "Combat_UI"]`;
`unit/path8` - `["TawernaCore", "Hunting", "Hunting_Path"]`; `unit/farming_data` - `["TawernaCore", "Farming_Data", "Farming",
"Farming_Plots", "Farming_Build", "Farming_Stations", "Farming_UI"]`; `unit/choppable_tree` - `["TawernaCore", "ChoppableTree",
"ChoppableTree_Objects", "ChoppableTree_Swing", "ChoppableTree_Render"]`.

```js
const unit = require("../lib/unit.js");
unit.test(t => {
    const w = unit.load(["TavernDice"]);                  // albo z danymi: { globals: { $dataItems: unit.data("Items") } }
    t.eq("trzy jedynki to 1000", w.TavernDice.score([1, 1, 1]).points, 1000);
});
```
