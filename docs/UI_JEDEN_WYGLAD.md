# Jeden wygląd interfejsu (2026-10-28)

Gracz wybrał wygląd „klasyczny”: **czarne panele, jasnożółty akcent `#ffd23f`, jasny tekst, szare linie** – kolory menu P
(MenuRing.js, paleta `K`, 2026-10-23: „układ jest ok, a można kolory z klasycznego wziąć?”). Do dziś obok żyły inne wyglądy:
domyślny „Grafit i miedź” (miedziany akcent `#d08a5a`, grafitowe tła, skórka `Window_Grafit.png`), opcja „Wygląd: Grafit /
Klasyczny”, stare menu-panel MenuPanel.js, stary ekran Postaci z Combat_UI.js i przełącznik starego bohatera (Reid) w F9.

**Zasada zmiany:** zostaje układ i kształty, które gracz widzi dziś (HUD CleanHUD, menu P MenuRing, zaokrąglone panele z jedną
cienką linią, listy bez pasków pod wierszami), a kolory wszędzie z jednej palety. Zmieniły się tylko miejsca miedziane albo
niespójne – zrzuty przed / po niżej.

## 1. Paleta – jedno miejsce

`js/plugins/UITheme.js` → `window.UIStyle.C` (zamrożony obiekt). Czytają ją:

| kto | jak |
|---|---|
| CleanHUD.js, CleanHUD_Compass.js | `CleanHUD.C` **to ten sam obiekt** (HUD, zegar, kompas, napisy u góry, zdobycze) |
| MenuRing.js | `K` = krótkie nazwy menu na tę paletę (`K.acc = C.accent`, `K.accDim = C.accentDark`, `K.sel = C.onAccent`…), `NEED_COL` = kolory potrzeb |
| TawernaUI.js (mini-gry: kości, rzutki, siłowanie, zmiana w karczmie, tablica, sklepy) | `Tawerna.ui.style()` = `UIStyle` |
| Journal.js, SpeechBubbles.js, SurvivalHUD/Needs/Survival/Minimap (stary HUD), Farming (wskaźnik menu) | `UIStyle.*` |
| Combat_Feel.js (pierścień celu, strzałki przy krawędzi), Prologue.js (narożniki, przycisk, imiona) | `UIStyle.C.accent` |
| skórka okien `img/system/Window.png` (wiadomości, wybory, listy budowy/jedzenia, skrzynia, podsumowanie dnia) | te same barwy; robi ją `tools/ui_jeden_wyglad/make_skin.py` |

| nazwa | wartość | do czego |
|---|---|---|
| `text` / `soft` / `muted` / `dim` | `#eceef0` / `#d4d6da` / `#8a9099` / `#62676f` | tekst, łagodniejszy, cichy, wyszarzony |
| `accent` / `accentDim` / `accentDark` / `accentMuted` / `onAccent` | `#ffd23f` / `#c9a12a` / `#5c4c18` / `#58460c` / `#100e06` | akcent; ciemniejszy; tło wybranego wiersza; przygaszony wybór; tusz na żółtym |
| `fill` / `solid` / `panel` / `glass` / `strip` | `rgba(11,12,15,.9)` / `#0b0c0f` / `rgba(11,12,15,.93)` / `rgba(11,12,15,.84)` / `rgba(6,6,8,.92)` | okno, pełne tło, panel menu, półprzezroczysty panel HUD-u, pasek |
| `panel2` / `cell` / `empty` / `track` / `trough` | `#141519` / `#1e2025` / `#111216` / `#26282e` / `#16181c` | wewnętrzne pola, kafelki, tor paska |
| `line` / `outline` | `#3a3e46` / `rgba(0,0,0,.82)` | cienka linia; obrys tekstu na mapie |
| `good` / `gold` / `warn` / `amber` / `sun` | `#96cd82` / `#ffd660` / `#ff9f8f` / `#e8b64a` / `#f2c25a` | znaczenia |
| `health` / `stamina` / `food` / `water` / `breath` | `#d8605a` / `#94bf6e` / `#dda650` / `#62a6dc` / `#8fe3ff` | paski potrzeb |

Wspólne rysowanie (UITheme): `UIStyle.panel()` (zaokrąglony, jedna linia), `bar()`, `glyph()`, `chip()`, `hudRow()`, `roundPath()`,
`rgba(hex, alfa)`.

## 2. Spis: co używało którego wyglądu, co martwe, co potrzebne

| plik | było | teraz |
|---|---|---|
| **UITheme.js** | `LOOKS.classic` + `LOOKS.grafit`, `look()` / `grafit()` z `ConfigManager.uiClean`, podmiana skórki na `Window_Grafit`, dwa kształty paneli (ścięte z żółtymi narożnikami / zaokrąglone), karta postaci w menu (martwa od MenuPanel), dopisek dnia w oknie zapisu AltSaveScreen (martwy od MenuRing) | jedna paleta `UIStyle.C`, jeden kształt (zaokrąglony – ten, który gracz widział), skórka zawsze `Window.png`; karta i dopisek usunięte (dane dnia/chatki do zapisu zostają – czyta je MenuRing). Stary ekran tytułowy (Sprite_TitleFx) zostaje jako zapas, gdy TitleScreen.js jest wyłączony |
| **CleanHUD.js** | własna paleta miedziana `C`, opcja „Wygląd” w Opcjach i w pliku ustawień | `C = UIStyle.C`; opcji brak, zapisany `uiClean` się nie czyta i nie zapisuje (stare zapisy z Grafitem / Klasycznym dostają jeden wygląd). Zostaje przełącznik **tylko dla testów** `ConfigManager.uiClean = false` / `CleanHUD.setClean(false)` i notatka mapy `<CleanHud:off>` |
| CleanHUD_Compass.js | miedziane N i wskazówka, grafitowa tarcza | z palety (żółte, `glass`) |
| **MenuRing.js** | menu P tylko w wyglądzie Grafit (w Klasycznym – MenuPanel), paleta `K` wpisana na sztywno | jedyne menu P; `K` czyta paletę; ekrany plików zawsze jego; **nowy:** „Opcje” z ekranu tytułowego w tym samym wyglądzie (jak „Wczytaj grę”); `Window_SavefileList` maxCols/itemHeight przeniesione z MenuPanel; poprawka: okno listy kasuje kursor skórki z pierwszego `select()` (prawa połowa pierwszego wiersza Opcji) |
| **MenuPanel.js** | całe menu-panel: karta postaci, Plecak (siatka i lista), Dziennik w panelu, Opcje, Zapisz/Wczytaj, Zakończ grę, rysunki poleceń, kolejność poleceń, `Sprite_MenuPanel` | zostało tylko to, co ktoś woła: `addCommand` (zakładka w MenuRing – „Plan karczmy”), `addFoot` (woła Story.js; nic już tego nie rysuje), brak przycisków dotykowych, `Window_ItemDetail` (karta Plecaka MenuRing), lista „all” Plecaka, `isKeepsake`, `questNeeds`, `stampText` |
| **Combat_UI.js** | ekran Postaci `Scene_Hero` (atrybuty, drzewka: `Window_HeroList`, `Window_SkillTree`, `Window_SkillDomains`, tabela skutków) | usunięty (nic go nie otwierało – menu P to MenuRing). Zostaje warstwa walki, plakietka broni, pasek doświadczenia, napis trybu, baner poziomu (CleanHUD czyta `_levelBanner`) |
| Combat.js | polecenie „Postać” → `Scene_Hero`, `Combat.Scene_Hero` | usunięte; wiersz „Automatyczny tryb walki” rysowany jednym stylem |
| **Journal.js** | dwie wersje rysowania: „grafitowa” (to widział gracz – w menu P) i klasyczna (lista z kwadratowymi znacznikami) | tylko jedna (dawna grafitowa, w kolorach palety); `drawMark` i klasyczny wiersz listy usunięte. Własny ekran `Scene_Journal` zostaje – w grze J otwiera menu P na Dzienniku, `Scene_Journal` widzą tylko testy (przełącznik testów) |
| Mood.js, Wydajnosc.js, Combat.js (wiersze Opcji) | wstawiane „pod Wygląd”; styl zależny od wyglądu | pierwsze w liście (Jakość grafiki, opis, efekty obrazu…); jeden styl |
| Combat_Feel.js | miedziany pierścień celu i strzałki przy krawędzi | żółte (akcent palety); czerwone i biało-złote bez zmian |
| Prologue.js | miedziane narożniki dymków, ramka imienia, przycisk „Gotowe” | żółte; tła paneli filmu zostają grafitowe (Kruk.js i Orzel.js zasłaniają tym kolorem tytuł ekranu imienia) |
| TitleScreen.js | własna złota paleta obrazu „Kufel przy kominku” | bez zmian (to nie miedź – złoto obrazu), poprawione tylko opisy |
| **HeroLook.js** | przełącznik F9 „Nowa postać: włączona / wyłączona (stary Reid)”, param. `startOn`, `$gameSystem._heroLook` | bohater zawsze; `setActive` usunięte; `swingDef` bez arkusza dla rodzaju bez arkusza bohatera (nigdy `Swing_*`); `$Reid_Poor` / `$Reid_Poor_Sneak` (wciąż w data/Actors.json) zamieniane na `Hero_Walk` / `Hero_Sneak` |
| Debug.js | wiersz „Nowa postać…” w F9 | usunięty (tylko ten wiersz) |
| Hunting.js | arkusz skradania `$Reid_Poor_Sneak` | usunięty (skradanie rysuje HeroLook: `Hero_Sneak`) |
| Torch.js | pochodnia rysowana obok starego bohatera (kij + płomień) | usunięta |
| ChoppableTree.js | wczytywał wszystkie `Swing_*` przy każdej mapie | wczytuje arkusze, które bohater gra (`swingKind`); nazwy `Swing_*` w `SWING_KINDS` są już tylko kluczami rodzajów |
| SurvivalHUD, Needs, Survival, Minimap, okno celu Journal, plakietki Combat_UI | stary HUD (z paskami pod zegarem) – w wyglądzie Klasyczny | **uśpione:** działają (dane, czas, haki testów), nie są rysowane; rysuje je tylko przełącznik testów albo `<CleanHud:off>` (żadna mapa tego nie ma). Kandydaci do usunięcia w następnym kroku |

### Martwe, ale zostawione (do decyzji / innych właścicieli)

- `Story.js`: `drawDebtFoot` / `Story.lastMenuLine` – linia długu w stopce starego menu-panelu. `MenuPanel.addFoot` ją przyjmuje,
  ale nic jej nie rysuje (dług pokazuje zakładka Postać). Story.js należy do wątków – nie ruszany.
- `Journal.js`: polecenie „Dziennik” w ukrytym oknie poleceń i `Window_MenuCommand.maxCols = 5`; `Scene_Journal` (tylko testy);
  nazwy `grafitTabs`, `legendGrafit` w API (zostawione, żeby nie mieszać w pliku zmienianym równolegle).
- Stary HUD (wyżej) i stary ekran tytułowy UITheme (zapas dla TitleScreen).
- Parametry na liście wtyczek bez użycia: `UITheme.survivalStatusCard`, `HeroLook.startOn` (nieszkodliwe; narzędzie
  `tools/wtyczki.py` nie usuwa parametrów).
- `docs/ARCHITEKTURA.md`: w tabeli kluczy `$gameSystem._` wciąż `_heroLook` (tabelę porządkuje równoległy agent).
- Narzędzia z poprzednich wyglądów: `tools/ui_grafit/make_skin.py` (robił `Window_Grafit.png`), `tools/ui_grafit/capture.js`
  (`Combat.Scene_Hero`), `tools/torch/capture.js` (`Swing_*`) – stare, nieużywane przez grę.

## 3. Co zmieniło wygląd (zrzuty przed / po)

`tools/ui_jeden_wyglad/zrzuty.js przed|po` (zapis `tests/fixtures/day40_farm`, godz. 11) → `docs/ui_jeden_wyglad/przed_*.png`,
`po_*.png`; `tools/ui_jeden_wyglad/porownaj.py` → `porownanie_*.png` (obok siebie). Udział zmienionych pikseli liczy też mapę
(pora dnia, pies, motyle), więc na mapie jest większy niż sama zmiana interfejsu.

| ujęcie | co się zmieniło |
|---|---|
| `hud_dzien`, `hud_noc` | etykiety (CEL, Składowisko), wskazówka minutowa i pierścień zegara, N i strzałka kompasu: miedź → żółć; tarcza kompasu w czerni palety |
| `walka`, `poziom` | pierścień celu i strzałki przy krawędzi żółte; „Poziom N!”, nagłówki u góry żółte |
| `budowa` | lista budowy: wybrany wiersz ciemnożółty (jak w menu P) zamiast grafitu z miedzianym brzegiem; tytuł dymka i „Potrzebne” żółte; tło okien czarne |
| `wiadomosc`, `wybor` | okno wiadomości czarne zamiast grafitowego; narożniki dymka i strzałka żółte; wybrany wiersz wyboru ciemnożółty |
| `menu_*` (Postać, Ekwipunek, Umiejętności, drzewko, Plecak, karta, Mapa, Zapisz, Wyjdź) | **bez zmian (0,0%)** |
| `menu_dziennik` | nagłówki karty celu i pasek postępu rozdziału: miedź → żółć |
| `menu_opcje` | brak wiersza „Wygląd”; zniknął grafitowy kursor skórki w prawej połowie pierwszego wiersza; „Wł” żółte |
| `opcje_tytul` | „Opcje” z ekranu tytułowego w wyglądzie menu (panel jak „Wczytaj grę”, wiersze jak w menu P, klawisze pod spodem) zamiast panelu MenuPanel |
| `wczytaj` | panel w czerni palety (był grafit) |
| `skrzynia`, `podsumowanie`, `sklep`, `tablica`, `kosci`, `kosci_gra` | tytuły, etykiety i ramki akcentu żółte zamiast miedzianych (skórka okna i `UIStyle.accent`) |
| `imie` (prolog) | ramka pola imienia, kursor, „Gotowe” – żółte |
| `tytul` | bez zmian |

## 4. Testy

Zmienione tylko tam, gdzie sprawdzały rzeczy usunięte (progi bez zmian):

- `menu_panel_test` – na nowo, dla tego, co zostało w MenuPanel: zakładka z `addCommand` (when / ok), `addFoot` Story, brak przycisków
  dotykowych, karta i lista „all” Plecaka, pamiątki, `stampText`, „Opcje” z tytułu w jednym wyglądzie.
- `hero_menu_test` – bez ekranu `Scene_Hero`; liczby rozwoju (punkty, umiejętności, droga, rangi, atrybuty, zapis, poziom 100)
  bez ekranu + menu P otwiera się na Postaci z punktami.
- `hero_look_test` – zamiast przełącznika: żaden zamach nie gra `Swing_*`, `$Reid_Poor` → `Hero_Walk`.
- `torch_test` (pochodnia starego bohatera), `birds_test` (arkusz skradania), `boar_test` / `shoot_anim_test` / `sit_test`
  (rozmiary arkuszy – teraz `Hero_*`, które bohater gra), `combat_feel_test` (kolor strzałki = akcent palety),
  `jacket_test` (kurtka w Ekwipunku MenuRing zamiast w `Scene_Hero`), `unit/combat.test` (bez `Combat.Scene_Hero`).
- `clean_hud_test`, `menu_lista_test`, `mood_test`, `jakosc_grafiki_test` – bez „Wygląd”; pierwsza opcja to „Jakość grafiki”.
- `journal_test` (zakładka Dziennik w MenuRing zamiast kolumny poleceń), `summary_test` (dzień / chatka na ekranie plików MenuRing;
  karta celu w jednym wyglądzie – głowa `gtitle`), `quest_board_test` (nagłówki karty `gh`), `story_test` i `smoke/story` (dług
  w menu P – `MenuRing.debtInfo()` – zamiast stopki starego panelu), `debug_menu_test` (bez wiersza starego bohatera w F9).
- Przy okazji (nieaktualne od zakładki „Mapa” z 2026-10-24): `clean_hud_test` – dziewięć zakładek, `mood_test` – droga do Opcji
  przez zakładki aż do „options”.

## 5. Pliki w archiwum

`..\Tawerna_archiwum_2026-10-18\pliki\` (te same ścieżki, wpisy PRZENIESIONY w `manifest.txt`):
`img/characters/$Reid_Poor.png`, `img/characters/$Reid_Poor_Sneak.png`, `img/system/Window_Grafit.png` i 18 arkuszy
`img/system/Swing_*.png` (Axe, AxeSide, Bow, Club, Crouch, Hammer, Hoe, LieDown, Pick, Punch, Rake, Roast, Rod, Roll, Shovel, Sit,
Sling, Spear) – razem 21 plików, 1,2 MB. Poprzednia skórka `img/system/Window.png` (klasyczna z narożnikami):
`..\Tawerna_archiwum_2026-10-18\dane_przed_jednym_wygladem\img\system\Window.png` (DANE_PRZED).
