# Testy - jak uruchamiać i pisać

Testy gry to skrypty Node, które uruchamiają prawdziwą grę w Edge bez okna (przez CDP, `tests/cdp.js`)
i sprawdzają zachowanie wtyczek. Każdy wypisuje linie `PASS ...` / `FAIL ...` i na końcu `N/M passed`.

Potrzebny jest serwer gry na `127.0.0.1:8765` - `tests/run.js` uruchamia go sam, gdy nic tam nie odpowiada
(`tools/serve.js`: pliki w pamięci, bez gubienia plików pod obciążeniem). Ręcznie, z katalogu projektu:

```
node tools/serve.js
```

(Stary `python -m http.server 8765 --bind 127.0.0.1` też działa, ale pod obciążeniem gubi pliki - gra wtedy klika „Retry".)

## Jak testować po zmianie (od 2026-10-23)

Zasada gracza: **najpierw budować, testować raz na końcu - tylko to, czego zmiana dotyka.** Pełny przebieg (`full`, ponad godzinę)
tylko po zapytaniu gracza.

```
node tests/run.js znacznik                 na POCZĄTKU pracy: zapamiętuje stan plików (kilka sesji naraz: znacznik <nazwa>)
   ... budowanie ...
node tests/run.js unit                     w trakcie, ile razy chcesz: cała logika bez przeglądarki (~10 s)
node tests/run.js zmiany --od znacznik     na KOŃCU: unit + testy dotknięte tym, co zmieniłeś od znacznika (+ smoke, gdy trzeba)
node tests/run.js zmiany --od znacznik --list    to samo, tylko lista - przy każdym teście powód (plik:linie funkcja)
```

Inne źródła zmian:

```
node tests/run.js zmiany                   wszystko od ostatniego commita (z plikami nieśledzonymi) - po dniu pracy zwykle dużo
node tests/run.js zmiany --od HEAD~3       od podanego commita
node tests/run.js zmiany Bron Ubior data/Map003.json "img/characters/!$Dym_Komin.png"
                                           tylko te pliki (wtyczka po nazwie albo ścieżka), porównane z ostatnim commitem;
                                           z --od znacznik: te pliki od znacznika
```

`zmiany` zawsze dokłada wszystkie testy `unit`, a zestaw smoke tylko wtedy, gdy zmiana jest w kodzie, który wykonuje każda gra
(hak co klatkę, start gry, plik czytany przez każdy test, silnik, lista wtyczek, `tests/lib`). Na końcu wypisuje, ile testów
w przeglądarce wybrał i ile to potrwa (czasy z `tests/last_results.json`); powyżej 60% wszystkich - „to prawie pełny przebieg:
zapytaj gracza”. Uwagi (`uwaga: ...`) mówią, co zmieniłeś, a czego **żaden test nie wykonuje** - tam warto dopisać test.

Kiedy co:

| sytuacja | komenda |
|---|---|
| po każdej zmianie logiki (tabele, wzory, dane) | `unit` |
| koniec pracy nad funkcją / zadaniem | `zmiany --od znacznik` |
| zmiana w rdzeniu (`TawernaCore`, `TawernaUI`), w ładowaniu, w `tests/lib` | `zmiany` (dobierze smoke) albo `smoke` |
| po dużym przebudowaniu wielu wtyczek | zapytać gracza o `full` |
| test sam w sobie zmieniony | `zmiany` bierze go zawsze; albo `node tests/run.js <nazwa>` |

`affected <Wtyczka...>` i `changed` działają dalej (testy, które wymieniają wtyczkę albo - z mapą - wykonują jej rzadkie funkcje,
plus smoke); `zmiany` jest od nich dokładniejsze.

## Testy dobierane do zmian - mapa testów (`tests/mapa_testow.json`)

Mapa jest **zmierzona**, nie zgadywana: każdy test przechodzi raz z włączonym pokryciem V8 (`Profiler.startPreciseCoverage`,
pokrycie blokowe - funkcje i bloki: gałąź `if`, reszta funkcji po wczesnym `return`) i z zapisem plików, o które strona prosi
serwer, oraz map, na które gra weszła (`Game_Map.setup`). `tests/lib/mapa.js` zamienia to na plik:

- `testy` - nazwa testu → jego numer bitu, wynik i czas pomiaru, data;
- `wtyczki` - dla każdej wtyczki i **wersji pliku** (blob gita, tekst trzymany w `.git` przez `git hash-object -w` - nic nie jest
  dodawane do indeksu ani commitowane) lista funkcji i bloków `[linia od, linia do, nazwa, bity testów, kolumna od, kolumna do]`;
- `pliki` - dane, obrazki, dźwięki → testy, które je wczytały; `mapy` - `data/MapNNN.json` → testy, które weszły na mapę.

Plik jest **lokalny** (poza gitem, jak `tests/last_results.json`): teksty zmierzonych wersji są obiektami w `.git` tej maszyny (nie
w żadnym commicie), a sam plik ma 1-5 MB i zmienia go każdy pomiar. Jeden zakres w linii. `git gc` usuwa po 2 tygodniach obiekty
bez commita - wtedy `zmiany` mówi „brak tekstu zmierzonej wersji” i bierze testy używające wtyczki: czas odświeżyć mapę.

**Pomiar** (nie jest przebiegiem oceniającym - nie zmienia kolumny `before`, wyniki trafiają tylko do mapy; trwa ok. półtorej godziny
na dwóch portach, w tle):

```
node tests/run.js mapa --czesc 1/2 --port 9623      połowa testów (podział po czasach), równolegle z:
node tests/run.js mapa --czesc 2/2 --port 9624
node tests/run.js --odswiez-mape needs_test hut_test      tylko te testy (po dopisaniu testu albo dużej zmianie tego, co testuje)
node tests/run.js mapa needs_test hut_test                to samo (lista nazw po `mapa`)
node tests/run.js mapa --nieaktualne --port 9623     testy zmierzone na starszej wersji którejś wtyczki (albo gdy się zmieniała)
```

Kiedy odświeżać: nowy test (inaczej `zmiany` go nie zna - bierze go tylko po zmianie jego pliku), test przepisany, wtyczka
mocno przebudowana. Drobne zmiany po pomiarze **nie psują mapy**: zmienione linie są przenoszone na linie zmierzonej wersji
przez diff (Myers), więc funkcja się znajduje także w pliku edytowanym po pomiarze. Raz na jakiś czas (np. po commicie) cały pomiar od nowa.

**Jak `zmiany` wybiera** (dla każdego pliku z listy zmian):

| co się zmieniło | które testy |
|---|---|
| linia kodu wtyczki w funkcji albo bloku | testy, które wykonały **tę** funkcję / ten blok (najbliższy wokół pierwszego znaku linii) |
| komentarz, pusta linia | żadne |
| linia w funkcji, którą wykonuje ≥85% testów (hak co klatkę, start gry) | smoke |
| linia „najwyżej w pliku” (tabela, stała, `const X = {`, `BUSTS["…"] = …`) | nazwy, które deklaruje albo obiekt, do którego pisze (wiersz tabeli → nazwa tabeli; nazwy jednoliterowe i klasy silnika się nie liczą) → funkcje, które ich używają: w tej wtyczce (także nowe linie) i we wtyczkach, które ją wymieniają (tabela `_Data` czytana przez swoją wtyczkę) → ich testy; nazwa używana w każdej grze → smoke; nieużywana → smoke + uwaga |
| wywołanie najwyżej w pliku (`T.inject(...)`, `T.talk.takeover(...)`) | testy funkcji wewnątrz tego wywołania + smoke |
| funkcja, której żaden test nie wykonał | żadne + uwaga „żaden zmierzony test tego nie wykonuje” |
| nowa wtyczka (bez pomiaru) | testy, które ją wymieniają + smoke + uwaga |
| `js/tawerna_wtyczki.js`, `js/plugins.js` | testy używające wtyczek, których wpis zmienił się albo przesunął + `ladowacz_test` + smoke |
| `index.html`, `js/*.js` silnika | `ladowacz_test` + smoke |
| `js/teksty/<nazwa>.txt` (teksty wątków, Watki.js) | zmienione klucze (linia `a.b = …` albo blok `[a.b]`; komentarze się nie liczą) → we wtyczkach, które czytają plik: `Watki.scal(OBIEKT, "<nazwa>", "prefiks")` z prefiksem nad kluczem (dalej jak tabela: funkcje używające obiektu) i linie z kluczem w napisie albo `TK.<klucz>` / `TX.<klucz>` → ich testy; plus testy, które czytają ten plik (`watki_test`); nic nie znaleziono → testy używające tych wtyczek + uwaga |
| `data/MapNNN.json` | testy, które weszły na mapę; mapa czytana z góry przez wtyczki - też testy, które ją wymieniają (`go(155`, `Map155`) + smoke |
| `data/Items.json`, `Weapons`, `Armors` (czyta je każdy test) | smoke + testy, które dają / liczą zmieniony przedmiot (`give(ID`, `count(ID`, `$dataItems[ID]`) |
| inny plik danych, obrazek, dźwięk | testy, które go wczytały; wczytywany przez każdy test - smoke |
| nowy obrazek (nikt go jeszcze nie wczytał) | linie wtyczek, które go wymieniają (jak zmiana tych linii), mapy, które go wymieniają |
| `tests/<test>.js`, `tests/smoke/*.js` | ten test |
| `tests/fixtures/<zapis>.json` | testy, które go wczytują + `smoke/fixtures` |
| `tests/lib/*`, `tests/cdp.js`, `tests/run.js` | smoke |
| `docs/`, `tools/`, reszta | żadne |

Bez mapy (`tests/mapa_testow.json` nie ma) `zmiany` robi to, co `affected`: testy wymieniające zmienione wtyczki + smoke.
Znacznik (`tests/znaczniki/<nazwa>.json`, poza gitem): rozmiar, czas i skrót każdego pliku gry i testów, teksty wtyczek w `.git`.
Działanie mapy sprawdza `tests/unit/mapa.test.js` (diff, komentarze, nazwy, `select` na zmyślonej wtyczce).

## Turbo (od 2026-10-23)

`TEST_TURBO=N` (albo `--turbo N` w `run.js`, opcja `turbo` w `kit.test` / `launch`): gra robi N aktualizacji logiki na jedną klatkę
obrazu (`SceneManager.determineRepeatNumber`). Wszystko, co liczy klatki gry - ruch, przejścia, wiadomości, toczenie kości,
`t.frames(n)` - idzie N razy szybciej zegarowo, te same klatki w tej samej kolejności. Nie przyspiesza tego, co test mierzy zegarem
(`sleep`, czasy w ms). `run.js` włącza turbo testom z listy `TURBO` na górze pliku - tylko sprawdzonym (zielone z turbo i bez):

| test | bez turbo | turbo ×3 |
|---|---|---|
| `tavern_dice_test` | 162 s | 78 s |
| `story_test` | 123 s | 61 s |
| `tavern_life_test` | 195 s | 98 s |
| `home_life_test` | 108 s | 44-46 s |
| `forest_fight_test` | 106 s | 45-67 s |
| `survival_test` | 69 s | 46-48 s |

Razem te sześć: ok. 12,7 min → ok. 6 min. ×6 psuje już `tavern_dice_test` („gorące kości”). Nie znoszą turbo (sprawdzone
2026-10-23): `tavern_shift_test` (pauza i przerwanie zmiany klawiszami w czasie zegarowym), `heart_test` (staje), `creatures_test`,
`birds_test` (kółko celowania); `underground_test` jest z turbo wolniejszy (pracę robi generator pięter, nie klatki). Nowy kandydat: `node tests/run.js <test> --turbo 3` dwa razy zielono → na listę. `--bez-turbo` wyłącza listę.

## Znane czerwone - czekają na decyzję (2026-10-23)

| zestaw | wynik | przyczyna |
|---|---|---|
| `home_decor_test`, `core_fixtures_test` | 34/43, 26/29 | autor przesunął w Map019 świecę na stole (zdarzenie 13) z (3,10) na (2,10) (commit z 17.10); HomeDecor.js sprawdza „kotwicę” stołu (świeca na 3,10) i celowo pomija trzy ozdoby stołu (993-995: `stol_p`, `stol_l`, `wigilia`) - na stole nie ma pisanek, jabłek, Wigilii. Do wyboru: świeca z powrotem na (3,10) albo kotwica „świeca gdziekolwiek na stole” i nowe miejsce `stol_l` (dziś byłoby pod świecą) |
| `prologue_test` | 28/37 | od 22.10 (między 7:51 a 10:18; w commicie 6cd5534) `data/System.json` zaczyna nową grę na Map003 (12,22) zamiast w domu dziadka (Map019 2,5) - prolog po filmie wchodzi na Kruczy Jar, rozmowa dziadka nie rusza. Do wyboru: pozycja startowa w edytorze z powrotem (Map019 2,5) albo Prologue.js zawsze stawia nową grę fabularną w domu dziadka |
| `tavern_interior_test` | 12/14 | Map001 (zmiana między 6 a 15.10): przejścia do zaplecza (50,24-26) i do dolnych skrzydeł (9,42), (95,42) są ścianami, na nich drzwi-zdarzenia (246, 247 „nad postaciami”, bez polecenia; „Drzwi na zaplecze” - sam obrazek). Pieszo nie da się wejść do korytarza, kuchni, browaru, łaźni (`bath`), sali rzutek (`darts`), jadalni prywatnej (2 z `mealtable`) |

## Szybkie testy (od 2026-09-29)

- **Karta graficzna**: przeglądarka testowa rysuje na GPU (ANGLE d3d11) - start gry ~1,5 s zamiast ~6 s, gra w pełnym tempie.
  `CDP_GPU=0` wraca do rysowania na procesorze (SwiftShader).
- **Jedna przeglądarka na przebieg** (`run.js` domyślnie): każdy test dostaje nową kartę tej samej przeglądarki; zapisy i opcje
  gry są przed każdym testem czyszczone (jak w świeżym profilu), zabłąkane karty zamykane po teście. `--no-reuse` = stara droga
  (osobna przeglądarka na test).
- **Tylko potrzebne testy**: `node tests/run.js zmiany` (wyżej: mapa testów). Starsze: `affected Farming Dog` - testy (także `unit/` i
  `smoke/`), które wspominają te wtyczki (z mapą: także te, które wykonują ich rzadkie funkcje), plus smoke; część liczy się też jako
  jej główna wtyczka (`Farming_Build` → i testy Farming); `changed` - to samo dla wtyczek zmienionych od ostatniego przebiegu `full`.
- **Testy unit równolegle**: `run.js` puszcza wszystkie `tests/unit/*.test.js` naraz (kilka procesów Node) - cały zestaw w czasie
  najdłuższego (~10 s, `unit/underground`).
- **Bez przebiegu „przed"**: `tests/last_results.json` trzyma ostatni wynik każdego testu; tabela `run.js` pokazuje go w kolumnie
  `before`. Zmiana wtyczki = jeden przebieg po zmianie i porównanie z `before` (pełny `full` raz na koniec dnia - zapamiętuje też
  stan wtyczek dla `changed`).
- **Testy czułe na czas**: gra na GPU chodzi w pełnym tempie, więc sprawdzenie „z zewnątrz" co klatkę może przegapić krótkie okno.
  Takie chwile łap w pętli gry (np. owinięte `SceneManager.updateMain`, jak `__sitRec` w `sit_test`) albo odczekaj kilka klatek, zanim
  sprawdzisz skutek (`combat_test`: pasek dzika). `combat_test`, `sit_test`, `talk_busts_test`, `pantry_fresh_test` są już tak poprawione
  (etap 6). Gdy test padnie tylko na GPU, porównaj z `CDP_GPU=0 node tests/run.js <test> --no-reuse`.
  2026-10-23, ta sama zasada: `shoot_anim_test` (licznik zamachu `_swingT` i klatka arkusza notowane w pętli gry, nie `Graphics.frameCount`
  od chwili odczytu), `combat_test` (przewrót i jego `iframes`), `motyle_test` (odległość w klatce spłoszenia, motyl na ekranie,
  kilka zamachów siatką na krążącą ćmę). Wartości, które spadają co klatkę (woda, wytrzymałość przy „Wysuszonym”), porównuj
  z tolerancją, nie `===`. `t.dismiss()` czeka też, aż wejdzie scena, która już jest w drodze (`SceneManager.isSceneChanging()`).

## Uruchamianie

```
node tests/run.js smoke          szybki zestaw (~6 min): każdy główny system raz
node tests/run.js full           wszystkie tests/*_test.js (długo - kilkadziesiąt minut)
node tests/run.js unit           czysta logika w Node, bez przeglądarki (~10 s, wszystkie naraz)
node tests/run.js zmiany         unit + testy dotknięte zmianami (wyżej) - zwykła komenda po pracy
node tests/run.js needs story_test smoke/farm     tylko te (nazwa z _test albo bez)
node tests/run.js unit smoke     można łączyć
```

Opcje: `--port N` (port CDP, domyślnie `CDP_PORT` albo 9396), `--retry N` (ile razy powtórzyć test,
który padł na starcie gry albo na serwerze - domyślnie 1), `--timeout S` (limit jednego testu, domyślnie
420 s, przy pomiarze mapy 900 s), `--list` (tylko pokaż, co by poszło; przy `zmiany` z powodami), `--no-reuse` (osobna przeglądarka na
każdy test; `--reuse` - wspólna - jest domyślne), `--czesc k/n` (k-ta z n części listy, podział po czasach - dwa porty naraz),
`--turbo N` / `--bez-turbo` (wyżej), `--od REF|znacznik[:nazwa]` (dla `zmiany`).

Testy idą **jeden po drugim** (dwa przebiegi naraz - każdy na swoim porcie - już się nie gryzą, ale obciążają maszynę). Wynik: tabela na ekranie, `tests/results.txt` (te same sekcje co z `tests/run.sh`
i tabela), pełny zapis każdego testu w `tests/out_<nazwa>.txt` (przy porcie innym niż 9396 z `_p<port>` w nazwie - niżej).
Kod wyjścia 0 = wszystko czyste.

Pojedynczy test też można puścić wprost: `CDP_PORT=9396 node tests/needs_test.js`.

`combat_test`, `hunting_test`, `smoke/farm`, `hold_gather_test` i `tree_strike_test` mają przełącznik `REGISTERED=1` (np.
`REGISTERED=1 node tests/run.js combat_test hunting_test`): części (`Combat_Fight`, `Combat_UI` / `Hunting_Path`, `Hunting_AI`,
`Hunting_Weapons` / `Farming_Plots`, `_Build`, `_Stations`, `_UI` / `ChoppableTree_Objects`, `_Swing`, `_Render`) stają na liście wtyczek
strony zaraz pod główną - tak jak na liście gry (do 2026-10-23 w `js/plugins.js`; sam plik nietknięty) - i test sprawdza też tę
kolejność. Bez przełącznika gra idzie z listą gry; części, których na niej nie ma, wkłada sama główna wtyczka (`PluginManager.loadScript`).
(`quest_board_test`, `tavern_dice_test`, `tavern_shift_test` mają ten sam przełącznik dla swoich części.)

### Lista wtyczek w testach (od 2026-10-23)

Gra bierze wtyczki z listy gry `js/tawerna_wtyczki.js` (ładowacz `js/plugins/TawernaLoader.js` z `index.html`; `js/plugins.js` ma tylko
ładowacz i trzy obce wtyczki - `docs/ARCHITEKTURA.md`, sekcja 2.0). Dla testów nic się nie zmienia:

- `$plugins` w stronie to cała scalona lista (ładowacz pierwszy, potem lista gry w swojej kolejności); haki testów na
  `window.$plugins` (`REGISTERED=1`, `beforeLoad` z `Object.defineProperty(window, "$plugins", ...)`, `GAME_PLUGINS_ADD`) dostają ją
  przez setter tak jak dawniej cały `js/plugins.js`.
- `GAME_PLUGINS_ADD="Po:Nowa;..."` - wtyczki, których nie ma jeszcze na liście gry, wstawione na swoje miejsca (jak dawniej).
- Nowa wtyczka do testów: wiersz na liście gry (`python tools/wtyczki.py --dodaj Nazwa --po Poprzednia --wykonaj`), edytor może być otwarty.
- Node: `tests/lib/wtyczki.js` - `lista()` (lista gry), `edytor()` (`js/plugins.js`), `merge()` (reguły ładowacza), `nazwy()` (jak
  `$plugins` w stronie), `tekst()` (oba pliki - szybkie `/"name":"X"/`). `tests/run.js affected/changed` biorą nazwy stąd.
- `GAME_OVERLAY_JS=1` (opcja kitu `overlayJs: true`) - nakładka `GAME_OVERLAY` podmienia też `index.html` i `js/*` (np. lista gry
  albo `js/plugins.js` ze stagingu).
- `tests/ladowacz_test.js` (port 9605): kilka startów gry z podmienionym `js/plugins.js` / `index.html` - dzisiejsze pliki, stara
  lista edytora (148 wpisów, migawka `tests/fixtures/wtyczki/plugins_2026-10-23.js`), sam ładowacz, edytor po swojemu (obca wtyczka
  nad i pod ładowaczem, podwójny wpis, zmienione parametry, wyłączona wtyczka), `index.html` bez ładowacza (zapasowe wejście), brak
  listy gry (ekran błędu). Za każdym razem: każda wtyczka raz, w kolejności, wszystkie przed `Scene_Boot`, `$plugins` i
  `PluginManager.parameters` jak z reguł, tytuł bez błędów. Gdy z rozmysłem zmienią się parametry na liście gry albo zniknie
  wtyczka, check „A2 ... z tymi samymi parametrami” to pokaże - nowa migawka: `node tests/ladowacz_test.js --migawka`.
Stary `tests/run.sh` dalej działa.

`marathon_test.js` nie wchodzi do `full` (gra autopilotem całe dni i wysyła powiadomienia na telefon) -
tylko na życzenie: `node tests/marathon_test.js [dni] [przyspieszenie]`.

### Teksty wątków (od 2026-10-23)

Wątki i ich teksty są danymi (`js/plugins/Watki.js`, pliki `js/teksty/*.txt`, `docs/WATKI_DANE.md`):

- `tests/watki_test.js` (port 9625, 11 sprawdzeń): teksty wczytane przed tytułem, zmiana w pliku widoczna w grze („Wczytaj teksty od
  nowa”), zapis i wczytanie W4, stare zapisy;
- `tests/unit/watki.test.js` (26): format tekstów, pilot W4 (`Kasztelan_Data` + `kasztelan.txt`);
- `debug_menu_test` - od 2026-10-23 65 sprawdzeń (nowy wiersz F9 „Wczytaj teksty od nowa”);
- bez przeglądarki, po poprawce tekstu: `node tools/teksty.js sprawdz` (każdy plik: klucze, błędy, klucze, których kod nie czyta) i
  `node tools/teksty.js porownaj <plik> tests/fixtures/teksty/<plik>_przed.json` (czy teksty po przeniesieniu są te same);
- `unit.load` sam dokłada `Watki.js` i teksty z dysku wtyczkom, które z nich korzystają (niżej, „Testy jednostkowe”);
- `zmiany` zna pliki tekstów (tabela w „Testy dobierane do zmian”).

### Rozmowy z postaciami (od 2026-10-23)

Rozmowy idą przez jedną usługę rdzenia (`Tawerna.talk`, `Tawerna.onEventStart`, `Tawerna.onEventList` - `docs/ARCHITEKTURA.md`,
sekcja 16, spis: `docs/ROZMOWY.md`). `tests/rozmowy_test.js` (port 9603, 17 sprawdzeń): priorytety przejęć, remis po nazwie
właściciela, `skip`, opcje dwóch systemów w menu jednej postaci w każdej kolejności rejestracji, pożegnanie ostatnie, `pick`; drabina
przejęć mieszkańców (sklepy pod zadaniami - sklep nigdy nie przykrywa zadania) i kolejność haków startu / poleceń zdarzeń (**zmiana drabiny = zmiana tabeli w teście i w `docs/ROZMOWY.md`**);
Kłos z jego kwestiami i sklepem Bron jako jednym wierszem; stary `TownLife.addTalkHook`; ukryty mieszkaniec nie startuje; stary zapis
`tavern_evening` - menu Borgara z wierszami TavernLife. W teście opcja albo przejęcie na chwilę: `const off = Tawerna.talk.option(...)`,
potem `off()`; zadania wyciszone podmianą `TownQuests.remarkFor / talkFor / markers / offerable` (jak `bron_dane_test`).

### Porty CDP

Każda przeglądarka testowa słucha na swoim porcie CDP. Dwie przeglądarki na jednym porcie się gryzą,
więc każdy, kto testuje równolegle (np. drugi agent), bierze **własny** port:

- 9396 - testy tego etapu (`run.js` domyślnie),
- 9398-9416 - testy etapu 3 (każdy ma swój port w komentarzu na górze pliku, np. `core_fixtures_test` 9398,
  `core_fixtures_b2_test` 9404, `tavern_life_save_test` 9406); równoległe wątki etapu 3 biorą każdy własny
  (`--port 9412`, `9414`, `9416`...). Przy porcie innym niż 9396 `run.js` pisze do plików z portem w nazwie:
  `tests/out_<nazwa>_p<port>.txt` i `tests/results_p<port>.txt` - dwa wątki z tym samym testem się nie mieszają,
- 9603 - `rozmowy_test` i testy etapu rozmów (2026-10-23),
- 9621-9624 - etap „mniej czekania na testy” (2026-10-23): 9623 i 9624 pomiar mapy (`mapa --czesc 1/2`, `2/2`),
- 9625 - `watki_test` (teksty wątków, 2026-10-23),
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

kit.test({ plugins: ["HomeDecor"] }, async t => {         // wtyczki spoza listy wtyczek - wstrzyknięte
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
`height`, `dpr`, `plugins`, `overlay` (jak `GAME_OVERLAY`), `overlayJs` (jak `GAME_OVERLAY_JS`), `beforeLoad` (skrypt przed grą), `bootCheck`
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
| `unit/underground` | 42 | `Underground` (+ `_Data`): biblioteki kawałków, generowane piętra wielu ziaren, labirynt 80x60, piętra ręczne |
| `unit/watki` | 26 | `Watki.js`: format tekstów `js/teksty/*.txt`, pilot W4 (`Kasztelan_Data` + `kasztelan.txt`) |
| **od 2026-10-23 (etap „mniej czekania na testy”)** | | |
| `unit/core` | 20 | `TawernaCore` bez mapy (część `core_test`): szyna (priorytet, `once`, `off`, słuchacz z błędem), stan `_tw` z wersjami i adopcją starego klucza, tagi, kalendarz, `has/api/call` |
| `unit/core_map` | 19 | `TawernaCore` z atrapami mapy i zegara (część `core_test`): wstawianie zdarzeń (zakresy, właściciele, zdarzenie spoza zakresu), aktualizatory mapy (błąd - jeden komunikat i wyłączenie), spokój, dźwięk, dymki |
| `unit/talk` | 19 | `Tawerna.talk` (czysta część `rozmowy_test`): priorytety przejęć, remis po nazwie właściciela, `skip`, opcje kilku systemów w każdej kolejności rejestracji, pożegnanie ostatnie, `pick`, `off()` |
| `unit/bron_data` | 19 | `Bron_Data` (+ `Bron`, `Ubior_Data`, stwory): każda broń / zbroja / tarcza / ozdoba prawdziwym przedmiotem z notatką, ceną, wagą; unikalne numery, rodzaje, materiały; liczby broni = rodzaj × materiał; kara poziomu (3% za poziom, najwyżej 45%); sklepy |
| `unit/combat_formulas` | 19 | `Combat` + `Combat_Fight` + `Skills_Data`: krzywa doświadczenia do poziomu 100, XP za zabicie wg poziomów, kolory poziomu wroga, odkrycia; co dają atrybuty (start, 25, 60) i umiejętności; oddech (Kondycja, zmęczenie, rany) |
| `unit/combat_gear` | 11 | `Combat_Fight` z liczbami `Bron_Data`: broń ponad poziom bohatera (słabsza, droższa w oddechu, brak do 45%), rękawice; części zbroi sumowane do `ZBROJA_MAX`, ich ciężar, część ponad poziom |
| `unit/skills_data` | 14 | `Skills_Data`: 10 drzew, 100+ umiejętności - unikalne, miejsca w drzewie, ścieżki od rzędu 0, rangi, progi atrybutów, efekty czytane przez `Combat.perk`; nauka |
| `unit/durability` | 14 | `Durability` (+ `Bron`): tabela zużycia, ostrzeżenie przy 15%, złamanie (znika z torby, odmiana „złamała / złamał”), naprawa, broń i zbroja |
| `unit/equipment` | 12 | `Equipment`: części w kolejności karty, rzeczy ze starego zapisu, zakładanie / zdejmowanie, odmowy, rzecz znikająca z torby |
| `unit/ubior_data` | 12 | `Ubior_Data` (+ `Ubior_Bron`, `Equipment`): wyglądy (miejsce, rampa kolorów, maska), klucze z `docs/ekwipunek/PLAN.md`, przedmioty 250+, sklepy |
| `unit/foes_data` | 12 | `Humans_Data` / `Creatures_Data` (+ wtyczki): rodzaje ludzi i stworów z rozsądnymi liczbami, XP z `Combat`, obozy i napady na prawdziwych mapach, bossowie pięter 10-90 (nazwy z tekstów `Watki`) |
| `unit/needs` | 16 | `Needs` na zegarze i wytrzymałości gry (część `needs_test`): start 90/90, spadek na godzinę (czuwanie, sen, pory roku, deszcz), koszty pracy, sufit wytrzymałości, picie, bukłak |
| `unit/spoilage` | 13 | `Spoilage` (+ `FoodTable`, spiżarnia 0,2; część `pantry_fresh_test`): psucie na zegarze gry, „13 dni” / „3 dni” |
| `unit/sky` | 15 | `Sky` (+ `DayNightCycle`, `Survival`; część `sky_test`): wysokość słońca wg godziny i pory roku (wschody i zachody), fazy nieba, mgła |
| `unit/mood` | 16 | `Mood` (część `mood_test`): liczby filtra wg pory dnia, nieba, podziemi i notatek map |
| `unit/mapa` | 15 | `tests/lib/mapa.js`: diff linii, komentarze, nazwy najwyżej w pliku, `select` na zmyślonej wtyczce |

Wtyczka, której teksty są danymi (`Watki.scal` / `Watki.zTekstu` - `js/teksty/*.txt`, gra czyta je przez serwer przed tytułem): `unit.load`
dokłada wtedy sam `Watki.js` zaraz za rdzeniem i wczytuje wszystkie `js/teksty/*.txt` z dysku, więc dane są całe jak w grze (bez tego
np. bossowie `Underground_Data` nie mieli nazw). Test, który sam ładuje `Watki`, sam podaje teksty (`Watki.wczytaj`).

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
