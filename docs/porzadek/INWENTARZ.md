# Inwentarz porządków - co gra używa, a czego nie

Stan na 2026-10-18 22:18. Raport tylko do decyzji: **nic nie zostało usunięte, przeniesione ani zmienione**. Zrobił go skrypt w trybie tylko do odczytu (`inwentarz.py` w scratchpadzie sesji; surowe wyniki: `inwentarz.json`).

## Wykonane porządki (2026-10-18, wieczorem) - stan

Poniższy spis to stan **sprzed** porządków (z poprawką sekcji 3d). Co zrobiono według decyzji użytkownika:

- **Archiwum** obok projektu: `C:\Users\macie\OneDrive\Dokumenty\RMMZ\Tawerna_archiwum_2026-10-18\` (645 MB, 1060 plików):
  `zip/` (17 ZIP-ów `backup_art_*` + `tools_robocze.zip`, każdy sprawdzony: testzip, liczba plików, suma bajtów),
  `pliki/` (1019 plików z zachowaniem ścieżek), `dane_przed/` (pliki danych sprzed zmian), `manifest.txt` (co skąd),
  `przywroc.py` (przywracanie), `usun_z_projektu.py` (usuwanie oryginałów), `staging_dane/` (przygotowane i zainstalowane zmiany danych).
- **Oryginały jeszcze NIE są usunięte z projektu** - tryb auto zablokował kasowanie. Gotowe do uruchomienia (edytor zamknięty, testy nie biegną):
  `python usun_z_projektu.py` (podgląd) i `python usun_z_projektu.py --wykonaj` w folderze archiwum. Zwolni ok. 917 MB
  (72 foldery z ZIP-ów, 1019 plików z `pliki/`, 1539 zrzutów/logów testów i plików `__pycache__` do skasowania na stałe, pusty `tex/`).
  Skrypt usuwa tylko to, co ma dobrą kopię w archiwum i czego nikt nie zmienił od archiwizacji.
- **Celowo pominięte:** `backup_art_2026-10-18` (dziś pisze do niego sesja orła), `tools/orzel`, `tools/motyle`, `tests/orzel`,
  `!Chest` i `!waterfall_animation` (używają ich move_test / waterfall_test), `Vehicle.png`, obie czcionki mplus, `Npc_*_Walk8`,
  cała kategoria „MOŻE używane”, `docs/`, Map101, paczki Winlu.
- **Mapy:** puste 005, 006, 007, 015, 016 wyjęte z MapInfos.json (pliki w archiwum, z projektu znikną po `usun_z_projektu.py`);
  `tools/ekran_tytulowy/capture.js` robi zrzut „las_pochodnia” na Map023 zamiast Map005. Łąka#2 (Map017) i Łąka#3 (Map018) podłączone
  do pola dziadka: wyjście S (8..10, 29) i W (0, 14..16), luki w obrzeżu i ścieżki do krawędzi (`tools/apply_laki.py`,
  `tools/newstart/layout.py` MEADOW_EDGES); zrzuty: `laki_*.png` w tym folderze. Map002 bez zmian.
- **Baza:** Enemies, Troops, Animations - po jednym pustym wpisie; zestawy kafli 1, 4, 5, 6 puste. **Zestaw 3 „Wewnątrz” zostaje** -
  TavernShift.js (sala w mini-grze zmiany w tawernie) czyta `$dataTilesets[3]` (sekcja 6 tego spisu o tym nie wiedziała). Pliki RTP używane
  tylko przez wyczyszczone wpisy (89 plików + efekty Effekseer + notatki .txt kafli) są w archiwum i znikną z `usun_z_projektu.py`.
  Własne `Tawerna_A2/A4/D` zostają (zestaw 3).
- **Testy (port 9541):** laki_przejscia_test 14/14 (nowy), title_test 34/34, debug_menu_test 62/62, torch_test 57/57, mood_test 46/46,
  workbench_test 60/60, core_test 49/49, `tools/newstart/run_transfer_test.py` 99/99 przejść.

## Podsumowanie

- **Bezpiecznie do usunięcia: 2272 plików, 346.13 MB** (pliki do odtworzenia: RTP/DLC z instalacji RPG Makera, zrzuty i logi testów, cache).
- **Wymaga Twojej decyzji: 7325 plików, 619.30 MB.**
- Osobno: docs/ to 1573 plików, 1371.33 MB (makiety, zrzuty, PDF-y, dokumentacja autora) - tylko lista w 5g, bez oceny.
- Gra używa: 548 z 1419 grafik (+212 z nazw składanych w kodzie), 178 z 449 dźwięków (+0 składanych), 88 z 98 map.

| Kategoria (bezpieczne) | Pliki | Rozmiar |
|---|---|---|
| Grafiki RTP/DLC bez żadnego odwołania (do odzyskania z RPG Maker MZ) | 469 | 36.02 MB |
| Dźwięki RTP bez żadnego odwołania (do odzyskania z RPG Maker MZ) | 189 | 23.02 MB |
| Zrzuty ekranu w katalogu głównym (nieśledzone, wyniki testów) | 54 | 72.00 MB |
| Zrzuty i logi testów w tests/ (ignorowane przez git, odtwarzane) | 1430 | 212.59 MB |
| __pycache__ (cache Pythona) | 130 | 2.50 MB |

| Kategoria (do decyzji) | Pliki | Rozmiar |
|---|---|---|
| Mapy bez dojścia (kandydaci) | 9 | 0.32 MB |
| Paczki Winlu w podfolderach img/tilesets/ (zestawy kafli 8-12 czytają z nich część plików; narzędzia - resztę) | 234 | 42.49 MB |
| Własne grafiki bez odwołań (PEWNIE nieużywane) | 52 | 4.26 MB |
| Własne dźwięki bez odwołań (PEWNIE nieużywane) | 0 | 0.0 KB |
| Grafiki „MOŻE używane” (wzmianka / prefiks / tylko baza RTP) | 107 | 14.09 MB |
| Dźwięki „MOŻE używane” | 82 | 2.50 MB |
| Foldery backup_art_* (nieśledzone) | 2211 | 236.79 MB |
| tools/: staging, out, preview, frames, raw, zrzuty... | 4628 | 318.84 MB |
| Wtyczki spoza plugins.js | 2 | 6.9 KB |

**Najważniejsze pozycje do decyzji:**

1. Kopie `backup_art_*` (18 folderów): 236.79 MB, z czego 32.62 MB to pliki identyczne z obecnymi. Propozycja: jeden ZIP poza projektem.
2. `tools/`: staging i wyniki pośrednie 318.84 MB; największe: tools/tavern/staging/ 152.71 MB, tools/tavern/v2/out/ 35.17 MB, tools/underground/staging/ 25.65 MB.
3. Mapy: puste i nieosiągalne Map005, Map006, Map007, Map015, Map016 (usunąć); nieosiągalne z treścią: Map002, Map017, Map018 (Map002 stary domek, Map017/018 Łąki #2-3 - podłączyć albo zarchiwizować); Map012 to planowany Mroczny las.
4. 33 arkuszy `Npc_*_Walk8` (3.18 MB) - zrobione dla każdej postaci, gra używa tylko części; zostawić, jeśli mieszkańcy mają dostać chód w 8 kierunkach.
5. Baza RTP: wrogowie, oddziały, animacje, zestawy kafli 1-6 i pojazdy. Po ich wyczyszczeniu w edytorze można usunąć 146 kolejnych plików RTP (11.74 MB) z sekcji 3c/4c.
6. Paczki Winlu w podfolderach `img/tilesets/` (42.49 MB): **gra ich używa** - zestawy kafli 8-12 (wszystkie mapy) wskazują 27 plików w tych podfolderach; resztę czytają narzędzia. Zostawić.
7. `docs/` (1371.33 MB): największe docs/miasteczko/ 120.04 MB, docs/walka/ 115.39 MB, docs/tawerna_nowa/ 96.66 MB - to Twoje makiety i zrzuty, tylko wypisane.

Legenda pewności: **pewne** = nigdzie w grze nie ma odwołania; **możliwe** = jest ślad (wzmianka, prefiks nazwy składanej, tylko baza RTP albo tylko nieużywana mapa); **używane** = jest odwołanie. Rekomendacja: usunąć / zarchiwizować (przenieść poza projekt, np. do ZIP) / zostawić / decyzja.

Gdzie szukałem: wszystkie włączone wtyczki `js/plugins/*.js` (literały, komentarze, prefiksy i sufiksy nazw składanych `"X_" + y`, szablony `` `X_${y}` ``), rdzeń `js/rmmz_*.js` i `main.js`, `js/plugins.js` (parametry), `index.html`, `package.json`, `css/`, wszystkie `data/*.json` (każda wartość tekstowa + surowy tekst, np. notatki `<Tag:Nazwa>`). Testy (`tests/`) i narzędzia (`tools/`) tylko jako informacja - same nie liczą się jako użycie w grze. Pochodzenie pliku: porównanie SHA-1 z `RPG Maker MZ/newdata` (RTP) i `dlc/`.

## 1. Mapy

Start gry: Map019 (System.json). Przejścia: polecenie 201 w mapach, zdarzeniach wspólnych i oddziałach; przejścia ze zmiennej: 0. Mapy z losowymi spotkaniami: brak. Kod: stałe/tablice z numerami map w wtyczkach (np. `MAP = 175`, `maps: [..]`, `reserveTransfer(N`, `inject(N`), potem dojście po przejściach od mapy startowej i map z kodu.

### 1a. Kandydaci do usunięcia i mapy szczególne

| Mapa | Rozmiar | Zawartość | Dowód | Testy / narzędzia | Pewność | Rekomendacja |
|---|---|---|---|---|---|---|
| Map001 „TAWERNA” | 0.28 MB | 101x55, 269 zdarzeń, 296 rodz. kafli | przejścia z: Map008, Map009, Map025. Tawerna - mapa główna, nietykalna. | testy: act2_quests_test.js, act3_test.js, bubbles_test.js +25; narzędzia: act3/record.js, apply_tavern_area.py, apply_tavern_interior.py +32 | używana | zostawić |
| Map002 „Domek - Wnętrze” | 0.01 MB | 11x11, 8 zdarzeń, 31 rodz. kafli | brak przejść (201) do mapy. Liczba 2 pojawia się w kodzie tylko jako współrzędne / rozmiary / numery zdarzeń (sprawdzone ręcznie) - żadna wtyczka nie przenosi na tę mapę. Stary „Domek - Wnętrze” (pierwszy dom z 2026-09, łóżko + „Skrzynia z zapasami”). Ma wyjście na Map003, ale nic tu nie prowadzi. UWAGA: tests/workbench_test.js czyta skrzynię z data/Map002.json (fetch) - test trzeba poprawić przy usuwaniu. | testy: workbench_test.js (czyta skrzynię z data/Map002.json); narzędzia: newstart/build_newstart.py (czyta łóżko z data/Map002.json). Trafienia w act3_test / creatures_test to nie ta mapa. | pewne (nieosiągalna) | zarchiwizować JSON + poprawić workbench_test.js |
| Map005 „Las” | 7.8 KB | 25x20, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Brak odwołań w kodzie. Pusta mapa z szablonu RMMZ (0 zdarzeń, jednolity teren tilesetu 2 „Zewnątrz” RTP). UWAGA: tools/ekran_tytulowy/capture.js robi na niej zrzut „las_pochodnia”. | narzędzia: ekran_tytulowy/capture.js (zrzut „las_pochodnia” na mapie 5) | pewne | usunąć (i zmienić mapę w capture.js) |
| Map006 „Wzgórza” | 5.9 KB | 22x17, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Liczba 6 pojawia się w kodzie tylko jako współrzędne / rozmiary / numery zdarzeń (sprawdzone ręcznie) - żadna wtyczka nie przenosi na tę mapę. Pusta mapa z szablonu RMMZ (0 zdarzeń, jednolity teren tilesetu 2). | - | pewne | usunąć |
| Map007 „Brzeg Rzeki” | 5.9 KB | 22x17, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Liczba 7 pojawia się w kodzie tylko jako współrzędne / rozmiary / numery zdarzeń (sprawdzone ręcznie) - żadna wtyczka nie przenosi na tę mapę. Pusta mapa z szablonu RMMZ (0 zdarzeń, jednolity teren tilesetu 2). | - | pewne | usunąć |
| Map012 „Mroczny Las” | 7.8 KB | 25x20, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Liczba 12 pojawia się w kodzie tylko jako współrzędne / rozmiary / numery zdarzeń (sprawdzone ręcznie) - żadna wtyczka nie przenosi na tę mapę. Pusta płaska mapa (0 zdarzeń, tileset 2) - Twój planowany „Mroczny las”: Mood.js ma DARK_FOREST_MAPS = [12], tests/mood_test.js i tools/mood/capture.js przechodzą na nią, żeby sprawdzić klimat. Nic w grze tu nie prowadzi. | testy: mood_test.js (Mroczny las); narzędzia: mood/capture.js. (town/fidelity.py wskazuje mapę próbną Winlu, nie naszą) | pewne (nieosiągalna) | decyzja: zostawić, jeśli Mroczny las ma powstać (inaczej usunąć + poprawić mood_test) |
| Map015 „Polana (questy poboczne)” | 3.7 KB | 17x13, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Liczba 15 pojawia się w kodzie tylko jako współrzędne / rozmiary / numery zdarzeń (sprawdzone ręcznie) - żadna wtyczka nie przenosi na tę mapę. Pusta mapa (0 zdarzeń, tileset 2) „Polana (questy poboczne)”. | - (trafienia w talk_busts_test.js, mountains/mtlib.py, town/fidelity.py to współrzędne albo mapy próbne Winlu) | pewne | usunąć |
| Map016 „Dom rodzinny” | 3.1 KB | 17x13, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Liczba 16 pojawia się w kodzie tylko jako współrzędne / rozmiary / numery zdarzeń (sprawdzone ręcznie) - żadna wtyczka nie przenosi na tę mapę. Pusta mapa (0 zdarzeń, tileset 8) „Dom rodzinny”, bez nazwy wyświetlanej. | - (trafienia w mountains/mtlib.py, town/fidelity.py to mapy próbne Winlu) | pewne | usunąć |
| Map017 „Łąka#2” | 0.13 MB | 40x30, 60 zdarzeń, 44 rodz. kafli | brak przejść (201) do mapy. Liczba 17 pojawia się w kodzie tylko jako współrzędne / rozmiary / numery zdarzeń (sprawdzone ręcznie) - żadna wtyczka nie przenosi na tę mapę. Łąka#2 - wygenerowana 2026-09-23 (build_meadows3.py: strumień, grzbiet skalny, zagajniki), 60 zdarzeń. Żadne przejście ani kod tu nie prowadzi (wyjścia z Łąki#1 na W/E nie mają przejść). UWAGA: tests/torch_test.js przechodzi na nią jako „inna mapa”. | testy: torch_test.js (t.go(17, ...) jako „inna mapa”) | pewne (nieosiągalna) | decyzja: podłączyć do Łąki#1 albo zarchiwizować JSON (+ poprawić torch_test) |
| Map018 „Łąka#3” | 0.14 MB | 40x30, 71 zdarzeń, 36 rodz. kafli | brak przejść (201) do mapy. Brak odwołań w kodzie. Łąka#3 - wygenerowana 2026-09-23 (krąg kamieni, sad, ruda żelaza), 71 zdarzeń. Żadne przejście ani kod tu nie prowadzi. | - | pewne (nieosiągalna) | decyzja: podłączyć albo zarchiwizować JSON |
| Map101 „Paleta miasteczka (do kopiowania)” | 0.14 MB | 62x49, 133 zdarzeń, 298 rodz. kafli | brak przejść (201) do mapy. Notatka mapy: „Paleta: gotowe budynki autora tilesetu do kopiowania w edytorze. Nie jest częścią świata gry.” Brak przejść i odwołań w kodzie; zbudowana przez tools/town/build_palette.py. | narzędzia: town/build_palette.py | używana (przez autora w edytorze) | zostawić |
| Map130 „Podziemia: kawałki (pasmo 1)” | 0.14 MB | 74x44, 139 zdarzeń, 187 rodz. kafli | brak przejść (201) do mapy; kod: Underground_Data.js:40, Underground_Data.js:92. Underground_Data.js MAPS.chunks1 = 130: biblioteka kawałków pasma 1, czytana przez kod (gracz tu nie wchodzi). | testy: underground.test.js, underground_test.js; narzędzia: underground/build.py, underground/check_chunks.js, underground/chunks.py +1 | używana | zostawić |
| Map131 „Podziemia: piętro 1” | 3.8 KB | 17x13, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Underground_Data.js floorBase = 130: piętro N pasma 1 = mapa 130+N; Underground.js wypełnia tę PUSTĄ skorupę przy wczytaniu. PUSTA, ALE POTRZEBNA. | narzędzia: underground/build.py, underground/places.py | używana | zostawić |
| Map132 „Podziemia: piętro 2” | 3.8 KB | 17x13, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Underground_Data.js floorBase = 130: piętro N pasma 1 = mapa 130+N; Underground.js wypełnia tę PUSTĄ skorupę przy wczytaniu. PUSTA, ALE POTRZEBNA. | - | używana | zostawić |
| Map133 „Podziemia: piętro 3” | 3.8 KB | 17x13, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Underground_Data.js floorBase = 130: piętro N pasma 1 = mapa 130+N; Underground.js wypełnia tę PUSTĄ skorupę przy wczytaniu. PUSTA, ALE POTRZEBNA. | - | używana | zostawić |
| Map134 „Podziemia: piętro 4” | 3.8 KB | 17x13, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Underground_Data.js floorBase = 130: piętro N pasma 1 = mapa 130+N; Underground.js wypełnia tę PUSTĄ skorupę przy wczytaniu. PUSTA, ALE POTRZEBNA. | - | używana | zostawić |
| Map135 „Podziemia: piętro 5” | 3.8 KB | 17x13, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Underground_Data.js floorBase = 130: piętro N pasma 1 = mapa 130+N; Underground.js wypełnia tę PUSTĄ skorupę przy wczytaniu. PUSTA, ALE POTRZEBNA. | - | używana | zostawić |
| Map136 „Podziemia: piętro 6” | 3.8 KB | 17x13, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Underground_Data.js floorBase = 130: piętro N pasma 1 = mapa 130+N; Underground.js wypełnia tę PUSTĄ skorupę przy wczytaniu. PUSTA, ALE POTRZEBNA. | - | używana | zostawić |
| Map137 „Podziemia: piętro 7” | 3.8 KB | 17x13, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Underground_Data.js floorBase = 130: piętro N pasma 1 = mapa 130+N; Underground.js wypełnia tę PUSTĄ skorupę przy wczytaniu. PUSTA, ALE POTRZEBNA. | - | używana | zostawić |
| Map138 „Podziemia: piętro 8” | 3.8 KB | 17x13, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Underground_Data.js floorBase = 130: piętro N pasma 1 = mapa 130+N; Underground.js wypełnia tę PUSTĄ skorupę przy wczytaniu. PUSTA, ALE POTRZEBNA. | - | używana | zostawić |
| Map139 „Podziemia: piętro 9” | 3.8 KB | 17x13, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy. Underground_Data.js floorBase = 130: piętro N pasma 1 = mapa 130+N; Underground.js wypełnia tę PUSTĄ skorupę przy wczytaniu. PUSTA, ALE POTRZEBNA. | - | używana | zostawić |
| Map145 „Podziemia: piętra 11-99 (skorupa)” | 3.9 KB | 17x13, 0 zdarzeń, jednolity teren | brak przejść (201) do mapy; kod: Underground_Data.js:42. Underground_Data.js MAPS.shell = 145: pusta skorupa wczytywana dla pięter 11-99 (wirtualne id 1000+N). PUSTA, ALE POTRZEBNA. | testy: underground_test.js; narzędzia: underground/build.py, underground/places_deep.py | używana | zostawić |

Uwaga: puste mapy podziemi 131-139 i 145 **muszą zostać** - Underground.js wypełnia je w locie (piętra 1-9 = mapa 130+N, piętra 11-99 = skorupa 145). Usunięcie mapy w edytorze zostawia jej wpis w MapInfos.json - edytor usuwa oba; ręcznie trzeba usunąć plik i wpis.

### 1b. Mapy używane (dowód w skrócie)

| Mapa | Rozmiar | Zdarzenia | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Map003 „Domek - Zewnętrze” | 0.26 MB | 146 | przejścia z: Map002, Map004, Map023 | używana | zostawić |
| Map004 „Łąka#1” | 0.15 MB | 74 | przejścia z: Map003 | używana | zostawić |
| Map008 „Okolice Tawerny” | 0.16 MB | 129 | przejścia z: Map001, Map022, Map024 +12 | używana | zostawić |
| Map009 „Piwnica Tawerny” | 0.01 MB | 7 | przejścia z: Map001, Map010 | używana | zostawić |
| Map010 „Ruiny Zamku” | 0.02 MB | 14 | przejścia z: Map009 | używana | zostawić |
| Map011 „Komnata Serca” | 0.03 MB | 19 | kod: Dwor_Data.js:37, Rywal_Data.js:41 +4 | używana | zostawić |
| Map013 „Góry i kamieniołom” | 0.41 MB | 229 | przejścia z: Map014, Map021, Map120 +1 | używana | zostawić |
| Map014 „Jaskinia” | 0.04 MB | 35 | przejścia z: Map013, Map149 | używana | zostawić |
| Map019 „Dom dziadka - Wnętrze” | 0.02 MB | 26 | przejścia z: Map020 | używana | zostawić |
| Map020 „Dom dziadka - Podwórze” | 0.11 MB | 77 | przejścia z: Map019, Map021 | używana | zostawić |
| Map021 „Leśna droga” | 0.22 MB | 114 | przejścia z: Map013, Map020, Map022 | używana | zostawić |
| Map022 „Polna droga” | 0.13 MB | 67 | przejścia z: Map008, Map021, Map023 | używana | zostawić |
| Map023 „Skraj lasu” | 0.20 MB | 100 | przejścia z: Map003, Map022, Map168 | używana | zostawić |
| Map024 „Posiadłość Lorda” | 0.07 MB | 64 | przejścia z: Map008, Map172 | używana | zostawić |
| Map025 „Pokoje gości” | 0.46 MB | 354 | przejścia z: Map001, Map025, Map026 | używana | zostawić |
| Map026 „Apartamenty” | 0.25 MB | 197 | przejścia z: Map025, Map026 | używana | zostawić |
| Map100 „Chatka - Wnętrze” | 3.4 KB | 3 | kod: CleanHUD_Compass.js:221, Dwor_Data.js:37 +4 | używana | zostawić |
| Map102 „Piekarnia” | 0.01 MB | 10 | przejścia z: Map008 | używana | zostawić |
| Map103 „Kantor” | 0.01 MB | 12 | przejścia z: Map008, Map171; kod: Kantor_Data.js:37 | używana | zostawić |
| Map104 „Ratusz” | 0.02 MB | 18 | przejścia z: Map008; kod: Kantor_Data.js:37 | używana | zostawić |
| Map105 „Dom kowala” | 0.01 MB | 12 | przejścia z: Map008 | używana | zostawić |
| Map106 „Dom garbarza” | 0.02 MB | 20 | przejścia z: Map008 | używana | zostawić |
| Map107 „Dom woziwody” | 0.01 MB | 13 | przejścia z: Map008 | używana | zostawić |
| Map108 „Dzwonnica” | 0.01 MB | 16 | przejścia z: Map008; kod: TownQuests_Data.js:233 | używana | zostawić |
| Map109 „Dom mieszczan” | 0.02 MB | 21 | przejścia z: Map008 | używana | zostawić |
| Map110 „Izba pod skałą” | 7.5 KB | 7 | przejścia z: Map008 | używana | zostawić |
| Map111 „Podgrodzie” | 0.13 MB | 110 | przejścia z: Map008, Map112, Map113 +6; kod: Debug.js:154, Garnizon_Data.js:39 +20 | używana | zostawić |
| Map112 „Chata praczki” | 0.01 MB | 14 | przejścia z: Map111 | używana | zostawić |
| Map113 „Chata drwala” | 0.01 MB | 13 | przejścia z: Map111 | używana | zostawić |
| Map114 „Chata kłusownika” | 0.01 MB | 11 | przejścia z: Map111 | używana | zostawić |
| Map115 „Izba znachorki” | 0.01 MB | 14 | przejścia z: Map111; kod: Combat_Fight.js:141 | używana | zostawić |
| Map116 „Kram starzyzny” | 7.2 KB | 6 | przejścia z: Map111; kod: Combat_Fight.js:144 | używana | zostawić |
| Map117 „Dom uchodźców” | 5.4 KB | 3 | przejścia z: Map111 | używana | zostawić |
| Map118 „Dno studni” | 0.01 MB | 17 | przejścia z: Map008; kod: TownQuests_Data.js:184, TownQuests_Data.js:185 | używana | zostawić |
| Map119 „Archiwum zakonu” | 0.01 MB | 15 | przejścia z: Map008; kod: Pustelnia.js:57, TownQuests_Data.js:195 +1 | używana | zostawić |
| Map120 „Osada Milczących” | 0.16 MB | 99 | przejścia z: Map013, Map121, Map122 +2; kod: TownQuests_Data.js:208 | używana | zostawić |
| Map121 „Wspólna izba” | 0.02 MB | 21 | przejścia z: Map120 | używana | zostawić |
| Map122 „Chata tkaczki” | 0.02 MB | 19 | przejścia z: Map120 | używana | zostawić |
| Map123 „Chata Najstarszego” | 0.03 MB | 27 | przejścia z: Map120; kod: Pustelnia.js:57 | używana | zostawić |
| Map124 „Chata rzeźbiarza” | 0.02 MB | 22 | przejścia z: Map120 | używana | zostawić |
| Map125 „Przystań” | 0.10 MB | 92 | przejścia z: Map111, Map126, Map127 +3; kod: Debug.js:147, Kantor_Data.js:37 +14 | używana | zostawić |
| Map126 „Chata Janka” | 0.01 MB | 14 | przejścia z: Map125 | używana | zostawić |
| Map127 „Szopa przy pochylni” | 9.0 KB | 9 | przejścia z: Map125 | używana | zostawić |
| Map128 „Komora celna” | 0.01 MB | 11 | przejścia z: Map125 | używana | zostawić |
| Map140 „Podziemia: piętro 10 (Strażnica)” | 0.04 MB | 32 | kod: Kasztelan.js:71, Rywal_Data.js:41 +2 | używana | zostawić |
| Map141 „Podziemia: kawałki (pasmo 2)” | 0.14 MB | 139 | kod: Underground_Data.js:101 | używana | zostawić |
| Map142 „Podziemia: kawałki (pasmo 3)” | 0.13 MB | 126 | kod: Underground_Data.js:110 | używana | zostawić |
| Map143 „Podziemia: kawałki (pasmo 4)” | 0.11 MB | 103 | kod: Underground_Data.js:119 | używana | zostawić |
| Map144 „Podziemia: kawałki (pasmo 5)” | 0.14 MB | 142 | kod: Underground_Data.js:128 | używana | zostawić |
| Map146 „Podziemia: piętro 20 (Sala jednego pytania)” | 0.03 MB | 25 | kod: Underground_Data.js:101, Underground_Data.js:70 | używana | zostawić |
| Map147 „Podziemia: piętro 30 (Wielka cysterna)” | 0.03 MB | 23 | przejścia z: Map167; kod: Underground_Data.js:101, Underground_Data.js:71 +2 | używana | zostawić |
| Map148 „Podziemia: piętro 40 (Bród Milczącej)” | 0.03 MB | 20 | kod: Underground_Data.js:110, Underground_Data.js:72 | używana | zostawić |
| Map149 „Podziemia: piętro 50 (Przekop kopaczy)” | 0.03 MB | 23 | przejścia z: Map014; kod: Underground_Data.js:110, Underground_Data.js:73 | używana | zostawić |
| Map150 „Podziemia: piętro 60 (Brama Pierwszych)” | 0.03 MB | 20 | kod: Underground_Data.js:119, Underground_Data.js:74 | używana | zostawić |
| Map151 „Podziemia: piętro 70 (Sala płaskorzeźb)” | 0.03 MB | 23 | kod: Underground_Data.js:119, Underground_Data.js:75 | używana | zostawić |
| Map152 „Podziemia: piętro 80 (Sala echa)” | 0.04 MB | 29 | kod: Underground_Data.js:128, Underground_Data.js:76 | używana | zostawić |
| Map153 „Podziemia: piętro 90 (Ostatnia straż)” | 0.03 MB | 22 | kod: Underground_Data.js:128, Underground_Data.js:77 | używana | zostawić |
| Map154 „Chata pod lasem” | 7.5 KB | 7 | kod: Combat_Fight.js:143, Debug.js:158 +1 | używana | zostawić |
| Map155 „Pustelnia na klifie” | 0.10 MB | 60 | przejścia z: Map156, Map157; kod: Combat_Fight.js:152, Debug.js:148 +8 | używana | zostawić |
| Map156 „Skryptorium” | 0.01 MB | 11 | przejścia z: Map155; kod: Combat_Fight.js:137, Debug.js:157 +2 | używana | zostawić |
| Map157 „Urwisko Kruków” | 0.11 MB | 63 | kod: Cysterna_Data.js:37, Debug.js:149 +10 | używana | zostawić |
| Map159 „Przylądek z latarnią” | 0.08 MB | 47 | przejścia z: Map160, Map161; kod: Debug.js:150, Latarnia_Data.js:34 +6 | używana | zostawić |
| Map160 „Izba latarnika” | 0.01 MB | 11 | kod: Debug.js:157, Latarnia_Data.js:34 +2 | używana | zostawić |
| Map161 „Laterna” | 0.01 MB | 11 | kod: Debug.js:157, Debug.js:820 +4 | używana | zostawić |
| Map162 „Garnizon nad zatoką” | 0.13 MB | 143 | przejścia z: Map163, Map165; kod: Debug.js:151, Garnizon_Data.js:39 +6 | używana | zostawić |
| Map163 „Kwatera rotmistrza” | 0.01 MB | 15 | kod: Debug.js:157, Garnizon_Data.js:39 +1 | używana | zostawić |
| Map165 „Wrak na mieliźnie” | 0.06 MB | 54 | przejścia z: Map166; kod: Debug.js:152, Garnizon.js:64 +5 | używana | zostawić |
| Map166 „Wrak - pod pokładem” | 0.02 MB | 14 | przejścia z: Map165; kod: Debug.js:158, Wrak_Data.js:41 +1 | używana | zostawić |
| Map167 „Stara cysterna zakonu” | 0.04 MB | 27 | kod: Cysterna_Data.js:37, Debug.js:153 +6 | używana | zostawić |
| Map168 „Spalona zagroda” | 0.10 MB | 58 | przejścia z: Map169; kod: Debug.js:155, Homes.js:113 | używana | zostawić |
| Map169 „Dom Ługów” | 7.7 KB | 7 | kod: Debug.js:158, Homes.js:132 | używana | zostawić |
| Map171 „Piwnica kantoru” | 0.02 MB | 21 | kod: Combat_Fight.js:157, Debug.js:158 +1 | używana | zostawić |
| Map172 „Dwór - Hol” | 0.03 MB | 42 | przejścia z: Map173; kod: Debug.js:160, Dwor_Data.js:37 | używana | zostawić |
| Map173 „Dwór - Biblioteka” | 0.02 MB | 17 | przejścia z: Map172; kod: Debug.js:160, Dwor_Data.js:37 | używana | zostawić |
| Map174 „Dwór - Gabinet” | 0.02 MB | 20 | kod: Debug.js:160, Dwor_Data.js:37 | używana | zostawić |
| Map175 „Orla Grań” | 0.11 MB | 64 | kod: Orzel_Data.js:33 | używana | zostawić |

## 2. Wtyczki

`js/plugins.js`: 131 wpisów, włączonych 131, wyłączonych (status false): 0. Wpisy bez pliku: brak. Duplikaty wpisów: brak.

| Wtyczka | Rozmiar | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|
| ButtonPicture.js | 3.0 KB | RTP (identyczna z newdata); brak w plugins.js; odwołania w innych wtyczkach: brak; testy: brak | pewne | usunąć (RTP, do odzyskania) |
| TextPicture.js | 3.8 KB | RTP (identyczna z newdata); brak w plugins.js; odwołania w innych wtyczkach: brak; testy: brak | pewne | usunąć (RTP, do odzyskania) |

Nieśledzone przez git (nowe, z bieżącej pracy - **nie ruszać**): Motyle.js, Motyle_Data.js, Orzel.js, Orzel_Data.js, Orzel_Lot.js.

## 3. Grafiki (img/)

| Folder | Pliki | Rozmiar | używane | składane (potw.) | możliwe | pewne nieużywane | inne (.txt) |
|---|---|---|---|---|---|---|---|
| img/battlebacks1 | 51 | 16.82 MB | 0 | 0 | 13 | 38 | 0 |
| img/battlebacks2 | 50 | 6.38 MB | 0 | 0 | 12 | 38 | 0 |
| img/characters | 561 | 37.18 MB | 332 | 142 | 4 | 83 | 0 |
| img/enemies | 105 | 2.60 MB | 0 | 0 | 13 | 92 | 0 |
| img/faces | 15 | 1.20 MB | 5 | 0 | 1 | 9 | 0 |
| img/parallaxes | 21 | 6.04 MB | 0 | 0 | 6 | 15 | 0 |
| img/pictures | 187 | 11.38 MB | 47 | 35 | 1 | 104 | 0 |
| img/sv_actors | 40 | 0.66 MB | 0 | 0 | 9 | 31 | 0 |
| img/sv_enemies | 105 | 1.88 MB | 0 | 0 | 13 | 92 | 0 |
| img/system | 194 | 9.56 MB | 154 | 35 | 4 | 1 | 0 |
| img/tilesets | 66 | 6.14 MB | 7 | 0 | 26 | 2 | 31 |
| img/titles1 | 22 | 4.78 MB | 3 | 0 | 5 | 14 | 0 |
| img/titles2 | 2 | 0.15 MB | 0 | 0 | 0 | 2 | 0 |

Gra nie ma bitew (brak poleceń 301, brak losowych spotkań, `optSideView` = False) i nie pokazuje animacji z bazy (polecenia 212/337: 0, wywołań w kodzie: 0) - stąd grafiki/dźwięki, do których prowadzi tylko baza wrogów, oddziałów, animacji itp., są oznaczone jako „możliwe”.

### 3a. Własne grafiki - PEWNIE nieużywane

**img/characters** - 49 plików, 3.63 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| 11 plików: !$Bush_Blossom, !$Bush_Bud_A, !$Bush_Flower_Orange, !$Bush_Flower_Purple, !$Bush_Flower_White, !$Bush_Leaf_A, !$Bush_Leaf_B, !$Bush_Leaf_C, !$Bush_Round, !$Bush_Round_White, !$Bush_Snow_Round | 0.02 MB | własne, śledzony | stare zielone/kwitnące krzaki (ChoppableTree, 2026-09); żadna mapa już ich nie ma (łąki tylko z typów Map003). Każdy: brak odwołań (kod gry, plugins.js, data/*.json, CSS/HTML, nazwy składane) | pewne | zarchiwizować |
| 33 plików: Npc_Bartek_Walk8, Npc_Bronek_Walk8, Npc_Celnik_Walk8, Npc_Drwal_Walk8, Npc_Dzwonnik_Walk8, Npc_Ela_Walk8, Npc_Feliks_Walk8, Npc_Franek_Walk8, Npc_Gracz_Walk8, Npc_Grum_Walk8, Npc_Janek_Walk8, Npc_Kamerdyner_Walk8, Npc_Klusownik_Walk8, Npc_Kopacz_Walk8, Npc_Kupiec_Walk8, Npc_Kurier_Walk8, Npc_Kwatermistrz_Walk8, Npc_Latarnik_Walk8, Npc_Lord_Walk8, Npc_Ludmila_Walk8, Npc_Ozzy_Walk8, Npc_Praczka_Walk8, Npc_Przemytnik_Walk8, Npc_Pustelnik_Walk8, Npc_Rotmistrz_Walk8, Npc_Rozbitek_Walk8, Npc_Szmaciarz_Walk8, Npc_Werbownik_Walk8, Npc_Woznica_Walk8, Npc_Zebrak_Walk8, Npc_Zlodziej_Walk8, Npc_Znachorka_Walk8, Npc_Zosia_Walk8 | 3.18 MB | własne, śledzony | arkusz 8-kierunkowy robiony przy każdej postaci przez tools/npc/build_npc.py; gra podpina tylko część (obrońcy Aktu III, cienie w podziemiach: Borgar, Kowal, Piekarka, Dziadek, Melia, Sołtys, Wanda, żołnierze, uchodźca, Marek); mieszkańcy chodzą na 4-kierunkowych $Npc_*. Każdy: brak odwołań (kod gry, plugins.js, data/*.json, CSS/HTML, nazwy składane); wspominają: garnizon/art/werbownik_beben.py | pewne | decyzja (zostawić, jeśli mieszkańcy mają chodzić w 8 kierunkach) |
| !$Manor_Lord | 0.33 MB | własny | stary obrazek dworu; Map024 przebudowany z kafli tilesetu 11 (tools/manor/build_manor.py). brak odwołań (kod gry, plugins.js, data/*.json, CSS/HTML, nazwy składane); testy: manor_test.js; narzędzia: manor/build_manor.py | pewne | zarchiwizować |
| !$Manor_Lord_Front | 0.04 MB | własny | stary obrazek dworu; Map024 przebudowany z kafli tilesetu 11 (tools/manor/build_manor.py). brak odwołań (kod gry, plugins.js, data/*.json, CSS/HTML, nazwy składane) | pewne | zarchiwizować |
| $Animal_Bear_Idle | 0.02 MB | własny | stary 4-kierunkowy arkusz; zwierzęta używają anim8/*_Idle8 (Hunting.js LOOK8). brak odwołań (kod gry, plugins.js, data/*.json, CSS/HTML, nazwy składane) | pewne | zarchiwizować |
| $Animal_Dog_Bark | 7.6 KB | własny | stary 4-kierunkowy arkusz; zwierzęta używają anim8/*_Idle8 (Hunting.js LOOK8). brak odwołań (kod gry, plugins.js, data/*.json, CSS/HTML, nazwy składane) | pewne | zarchiwizować |
| $Reid_Tall | 0.02 MB | własny | stary bohater Reid (domyślnie HeroLook: nowa postać; aktor 1 ma $Reid_Poor). brak odwołań (kod gry, plugins.js, data/*.json, CSS/HTML, nazwy składane) | pewne | zarchiwizować |

**img/pictures** - 1 plików, 0.08 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Ambrozy_Bust_Zakon | 0.08 MB | własny | wariant popiersia Ambrożego z tools/busts (nieużyty). brak odwołań (kod gry, plugins.js, data/*.json, CSS/HTML, nazwy składane); narzędzia: busts/make_ambrozy_zakon.py, busts/make_dzwonnik.py +2 | pewne | zarchiwizować |

**img/system** - 1 plików, 1.3 KB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Farm_Campfire | 1.3 KB | własny | stara wersja ogniska; budynek używa Farm_Campfire_L (bez wpisu legacy w Farming_Data.js). brak odwołań (kod gry, plugins.js, data/*.json, CSS/HTML, nazwy składane) | pewne | zarchiwizować |

**img/tilesets** - 1 plików, 0.55 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Soft_Test_A2 | 0.55 MB | własny, nieśledzony | próbny kafelek z tools/tiles/soft (nieśledzony). brak odwołań (kod gry, plugins.js, data/*.json, CSS/HTML, nazwy składane); narzędzia: tiles/soft/make_ground.py, tiles/soft/shots.js | pewne | usunąć / zarchiwizować |

### 3b. Grafiki RTP / DLC - PEWNIE nieużywane

Standardowe pliki RPG Makera (identyczne z `newdata/` albo z `dlc/`). Można je w każdej chwili skopiować z powrotem z instalacji.

**img/battlebacks1** - 38 plików, 13.03 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Castle1 | 0.24 MB | RTP | brak odwołań | pewne | usunąć |
| Castle2 | 0.27 MB | RTP | brak odwołań | pewne | usunąć |
| Castle3 | 0.34 MB | RTP | brak odwołań | pewne | usunąć |
| Cobblestones1 | 0.24 MB | RTP | brak odwołań | pewne | usunąć |
| Cobblestones2 | 0.42 MB | RTP | brak odwołań | pewne | usunąć |
| Cobblestones3 | 0.34 MB | RTP | brak odwołań | pewne | usunąć |
| Cobblestones4 | 0.44 MB | RTP | brak odwołań | pewne | usunąć |
| Cobblestones5 | 0.43 MB | RTP | brak odwołań | pewne | usunąć |
| Colosseum | 0.27 MB | RTP | brak odwołań | pewne | usunąć |
| Crystal | 0.32 MB | RTP | brak odwołań | pewne | usunąć |
| Cyberspace | 0.17 MB | RTP | brak odwołań | pewne | usunąć |
| DecorativeTile1 | 0.29 MB | RTP | brak odwołań | pewne | usunąć |
| DecorativeTile2 | 0.46 MB | RTP | brak odwołań | pewne | usunąć |
| DemonCastle1 | 0.40 MB | RTP | brak odwołań | pewne | usunąć |
| DemonCastle2 | 0.21 MB | RTP | brak odwołań | pewne | usunąć |
| DemonCastle3 | 0.25 MB | RTP | brak odwołań | pewne | usunąć |
| DemonicWorld | 0.38 MB | RTP | brak odwołań | pewne | usunąć |
| Dirt | 0.33 MB | RTP | brak odwołań | pewne | usunąć |
| DirtCave | 0.42 MB | RTP | brak odwołań | pewne | usunąć |
| Fort1 | 0.35 MB | RTP | brak odwołań | pewne | usunąć |
| Fort2 | 0.42 MB | RTP | brak odwołań | pewne | usunąć |
| Ground1 | 0.38 MB | RTP | brak odwołań | pewne | usunąć |
| Ground2 | 0.40 MB | RTP | brak odwołań | pewne | usunąć |
| IceCave | 0.26 MB | RTP | brak odwołań | pewne | usunąć |
| IceMaze | 0.42 MB | RTP | brak odwołań | pewne | usunąć |
| LavaCave | 0.48 MB | RTP | brak odwołań | pewne | usunąć |
| Road1 | 0.33 MB | RTP | brak odwołań | pewne | usunąć |
| Road2 | 0.37 MB | RTP | brak odwołań | pewne | usunąć |
| Road3 | 0.48 MB | RTP | brak odwołań | pewne | usunąć |
| RockCave | 0.49 MB | RTP | brak odwołań | pewne | usunąć |
| Smoke | 0.37 MB | RTP | brak odwołań; testy: farm.js, fixtures.js +1 | pewne | usunąć |
| Stone1 | 0.37 MB | RTP | brak odwołań | pewne | usunąć |
| Stone2 | 0.35 MB | RTP | brak odwołań | pewne | usunąć |
| Stone3 | 0.44 MB | RTP | brak odwołań | pewne | usunąć |
| Temple | 0.24 MB | RTP | brak odwołań | pewne | usunąć |
| Tent | 0.25 MB | RTP | brak odwołań | pewne | usunąć |
| Wood1 | 0.23 MB | RTP | brak odwołań | pewne | usunąć |
| Wood2 | 0.18 MB | RTP | brak odwołań | pewne | usunąć |

**img/battlebacks2** - 38 plików, 4.91 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Brick | 0.12 MB | RTP | brak odwołań | pewne | usunąć |
| Bridge | 0.11 MB | RTP | brak odwołań | pewne | usunąć |
| Castle1 | 0.10 MB | RTP | brak odwołań | pewne | usunąć |
| Castle2 | 0.13 MB | RTP | brak odwołań | pewne | usunąć |
| Castle3 | 0.12 MB | RTP | brak odwołań | pewne | usunąć |
| Colosseum | 0.12 MB | RTP | brak odwołań | pewne | usunąć |
| Crystal | 0.14 MB | RTP | brak odwołań | pewne | usunąć |
| Cyberspace | 0.10 MB | RTP | brak odwołań | pewne | usunąć |
| DarkSpace | 0.12 MB | RTP | brak odwołań | pewne | usunąć |
| DemonCastle1 | 0.14 MB | RTP | brak odwołań | pewne | usunąć |
| DemonCastle2 | 0.22 MB | RTP | brak odwołań | pewne | usunąć |
| DemonCastle3 | 0.10 MB | RTP | brak odwołań | pewne | usunąć |
| DemonicWorld | 0.15 MB | RTP | brak odwołań | pewne | usunąć |
| DirtCave | 0.12 MB | RTP | brak odwołań | pewne | usunąć |
| Fort1 | 0.09 MB | RTP | brak odwołań | pewne | usunąć |
| Fort2 | 0.17 MB | RTP | brak odwołań | pewne | usunąć |
| IceCave | 0.15 MB | RTP | brak odwołań | pewne | usunąć |
| IceMaze | 0.17 MB | RTP | brak odwołań | pewne | usunąć |
| LavaCave | 0.14 MB | RTP | brak odwołań | pewne | usunąć |
| RockCave | 0.16 MB | RTP | brak odwołań | pewne | usunąć |
| Room1 | 0.08 MB | RTP | brak odwołań | pewne | usunąć |
| Room2 | 0.11 MB | RTP | brak odwołań | pewne | usunąć |
| Room3 | 0.12 MB | RTP | brak odwołań | pewne | usunąć |
| Ruins1 | 0.11 MB | RTP | brak odwołań | pewne | usunąć |
| Ruins2 | 0.15 MB | RTP | brak odwołań | pewne | usunąć |
| Ruins3 | 0.17 MB | RTP | brak odwołań | pewne | usunąć |
| Smoke | 0.09 MB | RTP | brak odwołań; testy: farm.js, fixtures.js +1 | pewne | usunąć |
| Stone1 | 0.21 MB | RTP | brak odwołań | pewne | usunąć |
| Stone2 | 0.17 MB | RTP | brak odwołań | pewne | usunąć |
| Stone3 | 0.21 MB | RTP | brak odwołań | pewne | usunąć |
| Temple | 0.12 MB | RTP | brak odwołań | pewne | usunąć |
| Tent | 0.09 MB | RTP | brak odwołań | pewne | usunąć |
| Tower | 0.17 MB | RTP | brak odwołań | pewne | usunąć |
| Town1 | 0.07 MB | RTP | brak odwołań; narzędzia: domy/podgrodzie_zagroda.py, newstart/build_newstart.py +2 | pewne | usunąć |
| Town2 | 0.08 MB | RTP | brak odwołań | pewne | usunąć |
| Town3 | 0.09 MB | RTP | brak odwołań | pewne | usunąć |
| Town4 | 0.10 MB | RTP | brak odwołań | pewne | usunąć |
| Town5 | 0.10 MB | RTP | brak odwołań | pewne | usunąć |

**img/characters** - 34 plików, 1.78 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| !$Curtain | 0.12 MB | DLC (Winlu Fantasy Tileset - Interior) | brak odwołań; narzędzia: house/houselib.py | pewne | usunąć |
| !$Gate1 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| !$Gate2 | 0.08 MB | RTP | brak odwołań | pewne | usunąć |
| !$SF_Gate1 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| !$SF_Gate2 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| !Chest | 0.01 MB | RTP | brak odwołań; testy: move_test.js, workbench_test.js | pewne | usunąć |
| !Crystal | 0.09 MB | RTP | brak odwołań | pewne | usunąć |
| !Decoration_3 | 0.23 MB | DLC (Winlu Fantasy Tileset - Dungeon) | brak odwołań | pewne | usunąć |
| !Door2 | 0.07 MB | RTP | brak odwołań | pewne | usunąć |
| !Other1 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| !Other2 | 0.12 MB | RTP | brak odwołań | pewne | usunąć |
| !SF_Chest | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| !SF_Door1 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| !SF_Door2 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| !SF_Switch1 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| !Switch1 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| !Switch2 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| !waterfall_animation | 0.18 MB | DLC (Winlu Fantasy Tileset - Dungeon) | brak odwołań; testy: waterfall_test.js; narzędzia: town/waterfall_fx.py | pewne | usunąć |
| $BigMonster1 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| $BigMonster2 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Damage2 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Evil | 0.04 MB | RTP | brak odwołań; narzędzia: town/check_miasteczko.py, town/check_town.py | pewne | usunąć |
| Monster | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor2 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor3 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Damage1 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Damage2 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Monster | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_People1 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_People2 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_People3 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Vehicle | 0.02 MB | RTP | brak odwołań | pewne | usunąć |

**img/enemies** - 92 plików, 2.32 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Actor2_1 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_2 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_3 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_4 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_6 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_7 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3_1 | 0.02 MB | RTP | brak odwołań; narzędzia: busts/make_janek.py, busts/make_match.py +1 | pewne | usunąć |
| Actor3_2 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3_3 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3_4 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Berserker | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Birdman | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Blackknight | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Caitsith | 9.9 KB | RTP | brak odwołań | pewne | usunąć |
| Crab | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Darkelf | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Demon | 0.06 MB | RTP | brak odwołań | pewne | usunąć |
| Demon_metamorphosis | 0.12 MB | RTP | brak odwołań | pewne | usunąć |
| Demoncount | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Demonpot | 6.6 KB | RTP | brak odwołań | pewne | usunąć |
| Dragon | 0.07 MB | RTP | brak odwołań | pewne | usunąć |
| Evilbook | 9.6 KB | RTP | brak odwołań | pewne | usunąć |
| Evilgod | 0.10 MB | RTP | brak odwołań | pewne | usunąć |
| Foxman | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Frilledlizard | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| God_of_light | 0.09 MB | RTP | brak odwołań | pewne | usunąć |
| Goddess | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Goddess_of_death | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Hakutaku | 0.06 MB | RTP | brak odwołań | pewne | usunąć |
| Harpy | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Highking | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Hydra | 0.06 MB | RTP | brak odwołań | pewne | usunąć |
| Ketos | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Kraken | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Lich | 0.06 MB | RTP | brak odwołań | pewne | usunąć |
| Machinerybee | 8.4 KB | RTP | brak odwołań | pewne | usunąć |
| Matango | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Mechascorpion | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Medusa | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Mercenary | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Mimic | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Oddegg | 5.6 KB | RTP | brak odwołań | pewne | usunąć |
| Petitdevil | 8.4 KB | RTP | brak odwołań | pewne | usunąć |
| Plasma | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Sailor | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Salamander | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Sandworm | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Agent | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Anaconda | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Armygorilla | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Armymonkey | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Blueogre | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Boss | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Brownbear | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Cyborg | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Demon_of_universe | 0.07 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Drone | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Enmadaio | 0.08 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Evilteddybear | 8.5 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Hannyamask | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Hermit | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Jiangshi | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Kamaitachi | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Kappa | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Madclown | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Madscientist | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Mafia | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Mechasphere | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Phoenix | 0.06 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Redogre | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Securityrobot | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Shadow | 8.2 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Skullmask | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Slaughterrobot | 0.06 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Specialforces | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Talkingmuppet | 7.8 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Timebomb | 8.4 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Whitewolf | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Will_o_the_wisp | 9.4 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Wolf | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Workrobot | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Zombiedog | 9.6 KB | RTP | brak odwołań | pewne | usunąć |
| Siren | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Sorcerer | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Stoneknight | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Sylph | 10.1 KB | RTP | brak odwołań | pewne | usunąć |
| Tigerbunny | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Undine | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Unicorn | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Witch | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Wolfman | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Zombie | 0.01 MB | RTP | brak odwołań | pewne | usunąć |

**img/faces** - 9 plików, 0.71 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Actor3 | 0.08 MB | RTP | brak odwołań | pewne | usunąć |
| Evil | 0.08 MB | RTP | brak odwołań; narzędzia: town/check_miasteczko.py, town/check_town.py | pewne | usunąć |
| Monster | 0.09 MB | RTP | brak odwołań | pewne | usunąć |
| Nature | 0.07 MB | RTP | brak odwołań; narzędzia: newstart/build_newstart.py, newstart/build_tavern_area.py +2 | pewne | usunąć |
| SF_Actor1 | 0.08 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor2 | 0.08 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor3 | 0.08 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Monster | 0.08 MB | RTP | brak odwołań | pewne | usunąć |
| SF_People1 | 0.07 MB | RTP | brak odwołań | pewne | usunąć |

**img/parallaxes** - 15 plików, 3.65 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| BlueSky | 0.18 MB | RTP | brak odwołań | pewne | usunąć |
| DarkClouds | 0.24 MB | RTP | brak odwołań | pewne | usunąć |
| DarkSpace | 0.36 MB | RTP | brak odwołań | pewne | usunąć |
| DesertNight | 0.54 MB | RTP | brak odwołań | pewne | usunąć |
| IslandofSky1 | 0.23 MB | RTP | brak odwołań | pewne | usunąć |
| IslandofSky2 | 0.21 MB | RTP | brak odwołań | pewne | usunąć |
| Mountains1 | 0.24 MB | RTP | brak odwołań | pewne | usunąć |
| Mountains2 | 0.20 MB | RTP | brak odwołań | pewne | usunąć |
| Mountains3 | 0.19 MB | RTP | brak odwołań | pewne | usunąć |
| Ocean | 0.20 MB | RTP | brak odwołań | pewne | usunąć |
| RedSky | 0.28 MB | RTP | brak odwołań | pewne | usunąć |
| SnowForest | 0.28 MB | RTP | brak odwołań | pewne | usunąć |
| StarlitSky | 0.11 MB | RTP | brak odwołań | pewne | usunąć |
| Twilight | 0.18 MB | RTP | brak odwołań | pewne | usunąć |
| Universe | 0.20 MB | RTP | brak odwołań | pewne | usunąć |

**img/pictures** - 103 plików, 3.88 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Actor2_1 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_2 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_3 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_4 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_6 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_7 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_8 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_garbarz.py, busts/make_residents.py | pewne | usunąć |
| Actor3_1 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_janek.py, busts/make_match.py +1 | pewne | usunąć |
| Actor3_2 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3_3 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3_4 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3_5 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_klusownik.py, busts/make_match.py +2 | pewne | usunąć |
| Actor3_6 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3_7 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3_8 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Evil_1 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_residents.py, busts/make_szmaciarz.py | pewne | usunąć |
| Evil_2 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Evil_3 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Evil_4 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Evil_5 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Evil_6 | 0.06 MB | RTP | brak odwołań | pewne | usunąć |
| Evil_7 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Monster_1 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Monster_2 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Monster_3 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Monster_4 | 0.06 MB | RTP | brak odwołań | pewne | usunąć |
| Monster_5 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Monster_6 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Monster_7 | 0.07 MB | RTP | brak odwołań | pewne | usunąć |
| Monster_8 | 0.06 MB | RTP | brak odwołań | pewne | usunąć |
| Nature_1 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Nature_2 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Nature_3 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Nature_4 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Nature_5 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Nature_6 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Nature_7 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Nature_8 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| People1_1 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_bronek.py, busts/make_residents.py | pewne | usunąć |
| People1_2 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_residents.py, busts/make_zosia.py | pewne | usunąć |
| People1_3 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_docs.py, busts/make_hero.py +2 | pewne | usunąć |
| People1_4 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_ela.py, busts/make_residents.py | pewne | usunąć |
| People1_7 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_docs.py, busts/make_lineup.py +2 | pewne | usunąć |
| People1_8 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_residents.py, busts/make_znachorka.py | pewne | usunąć |
| People2_2 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_lineup.py, busts/make_match.py +2 | pewne | usunąć |
| People2_3 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_residents.py, busts/make_zlodziej.py | pewne | usunąć |
| People2_4 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| People2_5 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_docs.py, busts/make_lord.py +1 | pewne | usunąć |
| People2_6 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_praczka.py | pewne | usunąć |
| People3_1 | 0.05 MB | RTP | brak odwołań; narzędzia: busts/make_ambrozy_zakon.py, busts/make_dzwonnik.py +1 | pewne | usunąć |
| People3_2 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| People3_3 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| People3_4 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| People3_6 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_gracz.py, busts/make_residents.py | pewne | usunąć |
| People3_7 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_kapral.py, busts/make_residents.py +1 | pewne | usunąć |
| People3_8 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_residents.py, busts/make_straznik.py | pewne | usunąć |
| People4_1 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_kamerdyner.py, busts/make_residents.py | pewne | usunąć |
| People4_2 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_piekarka.py, busts/make_residents.py | pewne | usunąć |
| People4_3 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_kupiec.py, busts/make_residents.py | pewne | usunąć |
| People4_4 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| People4_6 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| People4_7 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_feliks.py, busts/make_residents.py | pewne | usunąć |
| People4_8 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_1 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_2 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_3 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_4 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_5 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_residents.py, busts/make_uchodzca.py | pewne | usunąć |
| SF_Actor1_6 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_7 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_8 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor2_1 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_bartek.py, busts/make_residents.py | pewne | usunąć |
| SF_Actor2_2 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor2_3 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_residents.py, busts/make_woziwoda.py | pewne | usunąć |
| SF_Actor2_4 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/kit.py, busts/make_gracz.py +2 | pewne | usunąć |
| SF_Actor2_5 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_werbownik.py | pewne | usunąć |
| SF_Actor2_6 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor2_7 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_rafal.py, busts/make_residents.py | pewne | usunąć |
| SF_Actor2_8 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor3_1 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_kowal.py, busts/make_residents.py | pewne | usunąć |
| SF_Actor3_2 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_ludmila.py, busts/make_residents.py | pewne | usunąć |
| SF_Actor3_3 | 0.04 MB | RTP | brak odwołań; narzędzia: busts/make_marek.py, busts/make_match.py +1 | pewne | usunąć |
| SF_Actor3_4 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor3_5 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor3_6 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_garbarz.py | pewne | usunąć |
| SF_Actor3_7 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_drwal.py, busts/make_residents.py | pewne | usunąć |
| SF_Actor3_8 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Monster_1 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Monster_2 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Monster_3 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Monster_4 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Monster_5 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Monster_6 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Monster_7 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Monster_8 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| SF_People1_1 | 0.02 MB | RTP | brak odwołań; narzędzia: busts/make_franek.py, busts/make_residents.py | pewne | usunąć |
| SF_People1_2 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_People1_3 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_People1_4 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_People1_5 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_celnik.py, busts/make_match.py +1 | pewne | usunąć |
| SF_People1_6 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_match.py, busts/make_matka.py +2 | pewne | usunąć |
| SF_People1_7 | 0.03 MB | RTP | brak odwołań; narzędzia: busts/make_lineup.py, busts/make_match.py +2 | pewne | usunąć |
| SF_People1_8 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |

**img/sv_actors** - 31 plików, 0.50 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Actor2_1 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_2 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_3 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_4 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_6 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_7 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_8 | 0.02 MB | RTP | brak odwołań; narzędzia: busts/make_garbarz.py, busts/make_residents.py | pewne | usunąć |
| Actor3_5 | 0.02 MB | RTP | brak odwołań; narzędzia: busts/make_klusownik.py, busts/make_match.py +2 | pewne | usunąć |
| Actor3_6 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3_7 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3_8 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_1 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_2 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_3 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_4 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_5 | 0.02 MB | RTP | brak odwołań; narzędzia: busts/make_residents.py, busts/make_uchodzca.py | pewne | usunąć |
| SF_Actor1_6 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_7 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor1_8 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor2_1 | 0.02 MB | RTP | brak odwołań; narzędzia: busts/make_bartek.py, busts/make_residents.py | pewne | usunąć |
| SF_Actor2_2 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor2_3 | 0.02 MB | RTP | brak odwołań; narzędzia: busts/make_residents.py, busts/make_woziwoda.py | pewne | usunąć |
| SF_Actor2_4 | 0.02 MB | RTP | brak odwołań; narzędzia: busts/kit.py, busts/make_gracz.py +2 | pewne | usunąć |
| SF_Actor2_5 | 0.02 MB | RTP | brak odwołań; narzędzia: busts/make_werbownik.py | pewne | usunąć |
| SF_Actor2_6 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor2_7 | 0.01 MB | RTP | brak odwołań; narzędzia: busts/make_rafal.py, busts/make_residents.py | pewne | usunąć |
| SF_Actor2_8 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor3_5 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Actor3_6 | 0.01 MB | RTP | brak odwołań; narzędzia: busts/make_garbarz.py | pewne | usunąć |
| SF_Actor3_7 | 0.01 MB | RTP | brak odwołań; narzędzia: busts/make_drwal.py, busts/make_residents.py | pewne | usunąć |
| SF_Actor3_8 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |

**img/sv_enemies** - 92 plików, 1.68 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Actor2_1 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_2 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_3 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_4 | 9.9 KB | RTP | brak odwołań | pewne | usunąć |
| Actor2_6 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Actor2_7 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3_1 | 0.02 MB | RTP | brak odwołań; narzędzia: busts/make_janek.py, busts/make_match.py +1 | pewne | usunąć |
| Actor3_2 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3_3 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Actor3_4 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Berserker | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Birdman | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Blackknight | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Caitsith | 7.2 KB | RTP | brak odwołań | pewne | usunąć |
| Crab | 9.8 KB | RTP | brak odwołań | pewne | usunąć |
| Darkelf | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Demon | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Demon_metamorphosis | 0.08 MB | RTP | brak odwołań | pewne | usunąć |
| Demoncount | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Demonpot | 4.8 KB | RTP | brak odwołań | pewne | usunąć |
| Dragon | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Evilbook | 6.9 KB | RTP | brak odwołań | pewne | usunąć |
| Evilgod | 0.07 MB | RTP | brak odwołań | pewne | usunąć |
| Foxman | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Frilledlizard | 8.9 KB | RTP | brak odwołań | pewne | usunąć |
| God_of_light | 0.07 MB | RTP | brak odwołań | pewne | usunąć |
| Goddess | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Goddess_of_death | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Hakutaku | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Harpy | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Highking | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Hydra | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Ketos | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Kraken | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Lich | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Machinerybee | 5.9 KB | RTP | brak odwołań | pewne | usunąć |
| Matango | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Mechascorpion | 8.1 KB | RTP | brak odwołań | pewne | usunąć |
| Medusa | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Mercenary | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Mimic | 7.5 KB | RTP | brak odwołań | pewne | usunąć |
| Oddegg | 4.5 KB | RTP | brak odwołań | pewne | usunąć |
| Petitdevil | 6.3 KB | RTP | brak odwołań | pewne | usunąć |
| Plasma | 8.0 KB | RTP | brak odwołań | pewne | usunąć |
| Sailor | 9.5 KB | RTP | brak odwołań | pewne | usunąć |
| Salamander | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Sandworm | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Agent | 9.0 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Anaconda | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_ArmyGorilla | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Armymonkey | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Blueogre | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Boss | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Brownbear | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Cyborg | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Demon_of_universe | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Drone | 8.2 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Enmadaio | 0.06 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Evilteddybear | 6.3 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Hannyamask | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Hermit | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Jiangshi | 9.2 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Kamaitachi | 8.0 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Kappa | 7.4 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Madclown | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Madscientist | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Mafia | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Mechasphere | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Phoenix | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Redogre | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Securityrobot | 8.7 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Shadow | 5.8 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Skullmask | 8.7 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Slaughterrobot | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Specialforces | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Talkingmuppet | 5.7 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Timebomb | 6.2 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Whitewolf | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Will_o_the_wisp | 6.2 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Wolf | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| SF_Workrobot | 9.2 KB | RTP | brak odwołań | pewne | usunąć |
| SF_Zombiedog | 6.8 KB | RTP | brak odwołań | pewne | usunąć |
| Siren | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Sorcerer | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Stoneknight | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Sylph | 7.5 KB | RTP | brak odwołań | pewne | usunąć |
| Tigerbunny | 8.6 KB | RTP | brak odwołań | pewne | usunąć |
| Undine | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Unicorn | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Witch | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Wolfman | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Zombie | 8.4 KB | RTP | brak odwołań | pewne | usunąć |

**img/tilesets** - 1 plików, 0.16 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Inside_A4 | 0.16 MB | RTP | brak odwołań | pewne | usunąć |

**img/titles1** - 14 plików, 3.24 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Beach | 0.17 MB | RTP | brak odwołań | pewne | usunąć |
| Bigtree | 0.20 MB | RTP | brak odwołań | pewne | usunąć |
| Canyon | 0.24 MB | RTP | brak odwołań | pewne | usunąć |
| FlyingIsland | 0.21 MB | RTP | brak odwołań | pewne | usunąć |
| Jungle | 0.34 MB | RTP | brak odwołań | pewne | usunąć |
| Mansion | 0.28 MB | RTP | brak odwołań | pewne | usunąć |
| Monument | 0.23 MB | RTP | brak odwołań | pewne | usunąć |
| Mountain | 0.16 MB | RTP | brak odwołań | pewne | usunąć |
| Oasis | 0.18 MB | RTP | brak odwołań | pewne | usunąć |
| Snow | 0.29 MB | RTP | brak odwołań | pewne | usunąć |
| Sword | 0.29 MB | RTP | brak odwołań | pewne | usunąć |
| Town1 | 0.20 MB | RTP | brak odwołań; narzędzia: domy/podgrodzie_zagroda.py, newstart/build_newstart.py +2 | pewne | usunąć |
| Town2 | 0.26 MB | RTP | brak odwołań | pewne | usunąć |
| Universe | 0.19 MB | RTP | brak odwołań | pewne | usunąć |

**img/titles2** - 2 plików, 0.15 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Floral | 0.07 MB | RTP | brak odwołań | pewne | usunąć |
| Medieval | 0.09 MB | RTP | brak odwołań | pewne | usunąć |

### 3c. Grafiki MOŻE używane - do decyzji

**własne / DLC** - 2 plików, 0.17 MB

| Plik | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| characters/!$Big_drawbridge_animated | 0.13 MB | DLC (Winlu Fantasy Tileset - Exterior) | tylko: tylko nieużywana mapa / paleta (Map101); narzędzia: town/build_miasteczko.py | możliwe | decyzja |
| characters/!$Waterwheel | 0.04 MB | DLC (Winlu Fantasy Tileset - Exterior) | tylko: tylko nieużywana mapa / paleta (Map101); narzędzia: town/build_town.py | możliwe | decyzja |

**RTP: tylko baza bitew / animacji / pojazdów albo rdzeń RMMZ w kodzie bitwy** - 44 plików, 5.09 MB

| Plik | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| battlebacks1/Clouds | 0.25 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1882, rmmz_sprites.js:1915) - gra nie ma bitew; testy: core_test.js, garnizon_test.js +1; narzędzia: domy/ruina.py, garnizon/build.py +2 | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks1/Desert | 0.21 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1873, rmmz_sprites.js:1907) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks1/DirtField | 0.28 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1870) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks1/Grassland | 0.29 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1923, rmmz_sprites.js:1927) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks1/GrassMaze | 0.33 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (System (bitwa)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks1/Lava1 | 0.37 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1875) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks1/Lava2 | 0.30 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1877) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks1/PoisonSwamp | 0.25 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1885, rmmz_sprites.js:1918) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks1/Ship | 0.31 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1931, rmmz_sprites.js:1935) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks1/Snowfield | 0.40 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1880, rmmz_sprites.js:1913) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks1/Wasteland | 0.32 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1867, rmmz_sprites.js:1904) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks2/Cliff | 0.11 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1899) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks2/Clouds | 0.09 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1882, rmmz_sprites.js:1915) - gra nie ma bitew; testy: core_test.js, garnizon_test.js +1; narzędzia: domy/ruina.py, garnizon/build.py +2 | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks2/Desert | 0.07 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1873, rmmz_sprites.js:1907) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks2/Forest | 0.15 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1895) - gra nie ma bitew; testy: mood_test.js | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks2/Grassland | 0.11 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1923, rmmz_sprites.js:1927) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks2/GrassMaze | 0.16 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (System (bitwa)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks2/Lava | 0.17 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1910) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks2/PoisonSwamp | 0.13 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1885, rmmz_sprites.js:1918) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks2/Ship | 0.09 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1931, rmmz_sprites.js:1935) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks2/Snowfield | 0.16 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1880, rmmz_sprites.js:1913) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| battlebacks2/Wasteland | 0.15 MB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:1867, rmmz_sprites.js:1904) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| enemies/Crow | 9.7 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Enemies) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| enemies/Gnome | 7.0 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Enemies) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| enemies/Goblin | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Enemies) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| enemies/Hi_monster | 0.05 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (System (bitwa)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| enemies/Treant | 0.07 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Enemies) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| sv_actors/Actor1_1 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Actors (bitwa)); narzędzia: miejsca_wyspy/staging/js/plugins.js, orzel/staging/js/plugins.js +1 | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| sv_actors/Actor1_2 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Actors (bitwa)); narzędzia: miejsca_wyspy/staging/js/plugins.js, orzel/staging/js/plugins.js +1 | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| sv_actors/Actor1_3 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Actors (bitwa)); narzędzia: busts/make_klusownik.py, busts/make_residents.py +2 | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| sv_actors/Actor1_4 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Actors (bitwa)); narzędzia: miejsca_wyspy/staging/js/plugins.js, orzel/staging/js/plugins.js +1 | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| sv_actors/Actor1_5 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Actors (bitwa)); narzędzia: busts/make_zolnierz.py, miejsca_wyspy/staging/js/plugins.js +2 | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| sv_actors/Actor1_6 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Actors (bitwa)); narzędzia: miejsca_wyspy/staging/js/plugins.js, orzel/staging/js/plugins.js +1 | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| sv_actors/Actor1_7 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Actors (bitwa)); narzędzia: miejsca_wyspy/staging/js/plugins.js, orzel/staging/js/plugins.js +1 | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| sv_actors/Actor1_8 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Actors (bitwa)); narzędzia: miejsca_wyspy/staging/js/plugins.js, orzel/staging/js/plugins.js +1 | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| sv_enemies/Crow | 6.8 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Enemies) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| sv_enemies/Gnome | 5.4 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Enemies) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| sv_enemies/Goblin | 8.0 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Enemies) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| sv_enemies/Hi_monster | 0.04 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (System (bitwa)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| sv_enemies/Treant | 0.05 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Enemies) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| system/Shadow2 | 0.4 KB | RTP | tylko rdzeń RMMZ w kodzie bitwy (rmmz_sprites.js:704, rmmz_sprites.js:3576) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| system/Weapons1 | 5.9 KB | RTP | tylko rdzeń RMMZ w kodzie bitwy: prefiks „Weapons” (rmmz_sprites.js:2780) + „1” znalezione w kodzie (Spriteset_Battle / Sprite_Weapon) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| system/Weapons2 | 5.7 KB | RTP | tylko rdzeń RMMZ w kodzie bitwy: prefiks „Weapons” (rmmz_sprites.js:2780) + „2” znalezione w kodzie (Spriteset_Battle / Sprite_Weapon) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| system/Weapons3 | 1.9 KB | RTP | tylko rdzeń RMMZ w kodzie bitwy: prefiks „Weapons” (rmmz_sprites.js:2780) + „3” znalezione w kodzie (Spriteset_Battle / Sprite_Weapon) - gra nie ma bitew | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |

**RTP: tylko zestawy kafli, których nie używa żadna żywa mapa** - 26 plików, 4.31 MB

| Plik | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| tilesets/Dungeon_A1 | 0.12 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 4) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/Dungeon_A2 | 0.14 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 4) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/Dungeon_A4 | 0.18 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 4) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/Dungeon_A5 | 0.10 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 4) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/Dungeon_B | 0.18 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 4) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/Dungeon_C | 0.16 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 4) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/Inside_A2 | 0.14 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 6) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/Outside_A1 | 0.15 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 2, Tileset 5) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/Outside_A2 | 0.16 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 2, Tileset 5); narzędzia: tiles/soft/make_ground.py | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/Outside_A3 | 0.07 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 2) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/Outside_A4 | 0.18 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 2) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/Outside_A5 | 0.10 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 2) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/Outside_B | 0.15 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 2) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/Outside_C | 0.22 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 2); narzędzia: przystan/art/prom_collage.py | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/SF_Inside_A4 | 0.26 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 6) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/SF_Inside_B | 0.14 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 6) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/SF_Inside_C | 0.17 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 6) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/SF_Outside_A3 | 0.13 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 5) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/SF_Outside_A4 | 0.24 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 5) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/SF_Outside_A5 | 0.11 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 5, Tileset 6) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/SF_Outside_B | 0.18 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 5) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/SF_Outside_C | 0.23 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 5) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/World_A1 | 0.13 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 1) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/World_A2 | 0.13 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 1) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/World_B | 0.31 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 1) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |
| tilesets/World_C | 0.21 MB | RTP | tylko: zestaw kafli bez żywej mapy (Tileset 1) | możliwe | usunąć razem z nieużywanymi zestawami kafli (sekcja 6) |

**RTP: zbieżność nazw albo wzmianka (nazwa użyta do czegoś innego)** - 35 plików, 4.52 MB

| Plik | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| battlebacks1/Sand | 0.20 MB | RTP | zbieżność nazw: literał „Sand” w TavernShift.js:211 użyty raczej jako audio/se: `stir:  { key: "up",    name: "Mieszać",    icon: 403, colour: "#8fc7ff", se: ["Water2", 50` | możliwe | usunąć po rzucie oka na dowód |
| battlebacks1/Space | 0.29 MB | RTP | tylko wzmianka w komentarzu: ChoppableTree.js:591, FreeMovement.js:131, Hunting_AI.js:927; testy: ap.js, bear_test.js +2; narzędzia: tavern/upperlib.py | możliwe | usunąć po rzucie oka na dowód |
| battlebacks2/Port | 0.09 MB | RTP | wzmianka (część dłuższego tekstu): Przystan.js:367; testy: act2_quests_test.js, regulars_quests_test.js +2; narzędzia: prolog/klatki.py | możliwe | usunąć po rzucie oka na dowód |
| characters/Damage1 | 0.06 MB | RTP | zbieżność nazw: literał „Damage1” w Hunting_AI.js:299 użyty raczej jako audio/se: `se("Close1", Math.round(85 * vol), 140, pan);         se("Damage1", Math.round(35 * vol), ` | możliwe | usunąć po rzucie oka na dowód |
| characters/Damage3 | 0.03 MB | RTP | zbieżność nazw: literał „Damage3” w Hunting_AI.js:548 użyty raczej jako audio/se: `se("Blow1", 90, 55, pan);         se("Damage3", 45, 50, pan);` | możliwe | usunąć po rzucie oka na dowód |
| enemies/Actor1_3 | 0.01 MB | RTP | tylko w parametrach wtyczek (plugins.js), bez związku z folderem img/enemies; narzędzia: busts/make_klusownik.py, busts/make_residents.py +2 | możliwe | usunąć po rzucie oka na dowód |
| enemies/Actor1_4 | 0.01 MB | RTP | tylko w parametrach wtyczek (plugins.js), bez związku z folderem img/enemies; narzędzia: miejsca_wyspy/staging/js/plugins.js, orzel/staging/js/plugins.js +1 | możliwe | usunąć po rzucie oka na dowód |
| enemies/Actor1_5 | 0.02 MB | RTP | tylko w parametrach wtyczek (plugins.js), bez związku z folderem img/enemies; narzędzia: busts/make_zolnierz.py, miejsca_wyspy/staging/js/plugins.js +2 | możliwe | usunąć po rzucie oka na dowód |
| enemies/Actor1_6 | 0.02 MB | RTP | tylko w parametrach wtyczek (plugins.js), bez związku z folderem img/enemies; narzędzia: miejsca_wyspy/staging/js/plugins.js, orzel/staging/js/plugins.js +1 | możliwe | usunąć po rzucie oka na dowód |
| enemies/Actor2_5 | 0.01 MB | RTP | zbieżność nazw: literał „Actor2_5” w TavernDice_Data.js:77 użyty raczej jako img/pictures: `name: "Grum Żelazna Pięść", short: "Grum", role: "najemnik", style: "ryzykant", styleColor`; testy: talk_busts_test.js; narzędzia: busts/game_shots.js, busts/make_docs.py +2 | możliwe | usunąć po rzucie oka na dowód |
| enemies/Captain | 0.02 MB | RTP | zbieżność nazw: literał „Captain” w Act3_Data.js:100 użyty raczej jako coś innego niż grafika/dźwięk (flaga, klucz, nazwa): `// (2026-10-17, W9 rozdz. 3) the commander killed in the ruins under the tavern (w9Dowodca`; testy: act3_test.js, w9_rywal_test.js | możliwe | usunąć po rzucie oka na dowód |
| enemies/Gatekeeper | 0.02 MB | RTP | tylko wzmianka w komentarzu: main.js:134 | możliwe | usunąć po rzucie oka na dowód |
| enemies/Wraith | 0.02 MB | RTP | zbieżność nazw: literał „Wraith” w Creatures_Data.js:122 użyty raczej jako coś innego niż grafika/dźwięk (flaga, klucz, nazwa): `upior: {             name: "Upiór prawdy", look: "Wraith", floors: [76, 99], hp: 70, poise` | możliwe | usunąć po rzucie oka na dowód |
| faces/People4 | 0.08 MB | RTP | zbieżność nazw: literał „People4” w TavernDice_Data.js:152 użyty raczej jako img/characters: `name: "Kupiec Wawrzyniec", short: "Wawrzyniec", role: "bogaty gość z miasta", style: "wyra` | możliwe | usunąć po rzucie oka na dowód |
| parallaxes/Clouds | 0.29 MB | RTP | zbieżność nazw: literał „Clouds” w CloudShadows.js:112 użyty raczej jako coś innego niż grafika/dźwięk (flaga, klucz, nazwa): `function isCloudsEnabled() {         return T.mapFlag("Clouds", DEFAULT_ENABLED);`; testy: core_test.js, garnizon_test.js +1; narzędzia: domy/ruina.py, garnizon/build.py +2 | możliwe | usunąć po rzucie oka na dowód |
| parallaxes/Desert | 0.55 MB | RTP | zbieżność nazw: literał „Desert” w rmmz_sprites.js:1873 użyty raczej jako img/battlebacks1, img/battlebacks2: `Sprite_Battleback.prototype.terrainBattleback1Name = function(type) {         case 33:    ` | możliwe | usunąć po rzucie oka na dowód |
| parallaxes/Forest | 0.59 MB | RTP | zbieżność nazw: literał „Forest” w rmmz_sprites.js:1895 użyty raczej jako img/battlebacks2: `Sprite_Battleback.prototype.terrainBattleback2Name = function(type) {         case 21:    `; testy: mood_test.js | możliwe | usunąć po rzucie oka na dowód |
| parallaxes/Lava | 0.57 MB | RTP | zbieżność nazw: literał „Lava” w rmmz_sprites.js:1910 użyty raczej jako img/battlebacks2: `Sprite_Battleback.prototype.terrainBattleback2Name = function(type) {         case 35:    ` | możliwe | usunąć po rzucie oka na dowód |
| parallaxes/River | 0.20 MB | RTP | zbieżność nazw: literał „River” w Atmosphere.js:460 użyty raczej jako audio/bgs: `if (period === "night") return { name: "Night", volume: 55 };             if (nearWater(4`; testy: atmosphere_test.js, underground.test.js; narzędzia: underground/places_deep.py | możliwe | usunąć po rzucie oka na dowód |
| parallaxes/Space | 0.19 MB | RTP | tylko wzmianka w komentarzu: ChoppableTree.js:591, FreeMovement.js:131, Hunting_AI.js:927; testy: ap.js, bear_test.js +2; narzędzia: tavern/upperlib.py | możliwe | usunąć po rzucie oka na dowód |
| pictures/People1_5 | 0.04 MB | RTP | tylko wzmianka w komentarzu: TavernLife_Darts.js:67; testy: act2_quests_test.js; narzędzia: busts/make_residents.py, busts/make_soltys.py | możliwe | usunąć po rzucie oka na dowód |
| sv_actors/Actor2_5 | 0.02 MB | RTP | zbieżność nazw: literał „Actor2_5” w TavernDice_Data.js:77 użyty raczej jako img/pictures: `name: "Grum Żelazna Pięść", short: "Grum", role: "najemnik", style: "ryzykant", styleColor`; testy: talk_busts_test.js; narzędzia: busts/game_shots.js, busts/make_docs.py +2 | możliwe | usunąć po rzucie oka na dowód |
| sv_enemies/Actor1_3 | 0.01 MB | RTP | tylko w parametrach wtyczek (plugins.js), bez związku z folderem img/sv_enemies; narzędzia: busts/make_klusownik.py, busts/make_residents.py +2 | możliwe | usunąć po rzucie oka na dowód |
| sv_enemies/Actor1_4 | 9.7 KB | RTP | tylko w parametrach wtyczek (plugins.js), bez związku z folderem img/sv_enemies; narzędzia: miejsca_wyspy/staging/js/plugins.js, orzel/staging/js/plugins.js +1 | możliwe | usunąć po rzucie oka na dowód |
| sv_enemies/Actor1_5 | 0.02 MB | RTP | tylko w parametrach wtyczek (plugins.js), bez związku z folderem img/sv_enemies; narzędzia: busts/make_zolnierz.py, miejsca_wyspy/staging/js/plugins.js +2 | możliwe | usunąć po rzucie oka na dowód |
| sv_enemies/Actor1_6 | 0.01 MB | RTP | tylko w parametrach wtyczek (plugins.js), bez związku z folderem img/sv_enemies; narzędzia: miejsca_wyspy/staging/js/plugins.js, orzel/staging/js/plugins.js +1 | możliwe | usunąć po rzucie oka na dowód |
| sv_enemies/Actor2_5 | 9.6 KB | RTP | zbieżność nazw: literał „Actor2_5” w TavernDice_Data.js:77 użyty raczej jako img/pictures: `name: "Grum Żelazna Pięść", short: "Grum", role: "najemnik", style: "ryzykant", styleColor`; testy: talk_busts_test.js; narzędzia: busts/game_shots.js, busts/make_docs.py +2 | możliwe | usunąć po rzucie oka na dowód |
| sv_enemies/Captain | 0.02 MB | RTP | zbieżność nazw: literał „Captain” w Act3_Data.js:100 użyty raczej jako coś innego niż grafika/dźwięk (flaga, klucz, nazwa): `// (2026-10-17, W9 rozdz. 3) the commander killed in the ruins under the tavern (w9Dowodca`; testy: act3_test.js, w9_rywal_test.js | możliwe | usunąć po rzucie oka na dowód |
| sv_enemies/Gatekeeper | 0.01 MB | RTP | tylko wzmianka w komentarzu: main.js:134 | możliwe | usunąć po rzucie oka na dowód |
| sv_enemies/Wraith | 0.01 MB | RTP | zbieżność nazw: literał „Wraith” w Creatures_Data.js:122 użyty raczej jako coś innego niż grafika/dźwięk (flaga, klucz, nazwa): `upior: {             name: "Upiór prawdy", look: "Wraith", floors: [76, 99], hp: 70, poise` | możliwe | usunąć po rzucie oka na dowód |
| titles1/Gate | 0.23 MB | RTP | tylko wzmianka w komentarzu: Creatures_Data.js:215; narzędzia: town/build_miasteczko.py, town/street_test.py +1 | możliwe | usunąć po rzucie oka na dowód |
| titles1/Gold | 0.29 MB | RTP | tylko wzmianka w komentarzu: rmmz_objects.js:10027 | możliwe | usunąć po rzucie oka na dowód |
| titles1/Night | 0.20 MB | RTP | zbieżność nazw: literał „Night” w Atmosphere.js:459 użyty raczej jako audio/bgs: `if (seaHere() && nearWater(6) >= 6) return { name: "Sea", volume: period === "night" ? 50 `; testy: atmosphere_test.js, pustelnia_test.js; narzędzia: pustelnia/build.py, pustelnia/shots.js | możliwe | usunąć po rzucie oka na dowód |
| titles1/Sky | 0.19 MB | RTP | zbieżność nazw: literał „Sky” w Sky.js:112 użyty raczej jako coś innego niż grafika/dźwięk (flaga, klucz, nazwa): `let lastBolt = null;     T.on("lightning", e => { if (e && e.outdoors) lastBolt = { x: e.x`; testy: latarnia_test.js, motyle_test.js +2; narzędzia: latarnia/shots.js, miejsca_wyspy/staging/js/plugins.js +2 | możliwe | usunąć po rzucie oka na dowód |
| titles1/Wasteland | 0.19 MB | RTP | zbieżność nazw: literał „Wasteland” w rmmz_sprites.js:1867 użyty raczej jako img/battlebacks1, img/battlebacks2: `Sprite_Battleback.prototype.terrainBattleback1Name = function(type) {         case 25:    ` | możliwe | usunąć po rzucie oka na dowód |

### 3d. Paczki Winlu w img/tilesets/ (podfoldery) - UŻYWANE

**Poprawka (2026-10-18):** pierwsza wersja tego raportu podawała, że gra nie czyta tych podfolderów - to był błąd. Tilesets.json wskazuje pliki ze ścieżką podfolderu (np. `Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/tilesets/Fantasy_Outside_A2_2_green`) i tak są zbudowane wszystkie używane zestawy kafli (8-12). Pozostałe pliki paczek (inne warianty, characters/, PDF-y licencji) czytają narzędzia w tools/.

| Folder | Pliki | Rozmiar | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| img/tilesets/Winlu Fantasy Tileset - Dungeon/ | 42 | 8.46 MB | gra: 8 plików w zestawach kafli (Tileset 10, Tileset 12): Fantasy_Dungeon_A1, Fantasy_Dungeon_A2, Fantasy_Dungeon_A4, Fantasy_Dungeon_A5 +4; oryginał: dlc/Winlu Fantasy Tileset - Dungeon (jest); git: 42 śledz.; narzędzia (5): cysterna/art.py, tiles/soft/groundlib/paths.py, underground/make_props.py +2 | używane | zostawić |
| img/tilesets/Winlu Fantasy Tileset - Exterior/ | 70 | 17.23 MB | gra: 11 plików w zestawach kafli (Tileset 11, Tileset 9): Fantasy_Outside_A1_green, Fantasy_Outside_A1_green_town, Fantasy_Outside_A2_2_green, Fantasy_Outside_A2_green +7; oryginał: dlc/Winlu Fantasy Tileset - Exterior (jest); git: 70 śledz.; narzędzia (20): art/ground_pixellab.py, art/mushrooms_pixellab.py, domy/art/drogowskaz.py +17 | używane | zostawić |
| img/tilesets/Winlu Fantasy Tileset - Exterior Winter/ | 31 | 4.49 MB | gra: 0 plików w zestawach kafli (-): -; oryginał: dlc/Winlu Fantasy Tileset - Exterior Winter (jest); git: 31 śledz.; narzędzia (1): tiles/soft/groundlib/paths.py | możliwe | zostawić |
| img/tilesets/Winlu Fantasy Tileset - Interior/ | 91 | 12.30 MB | gra: 8 plików w zestawach kafli (Tileset 12, Tileset 8): Fantasy_Inside_A2, Fantasy_Inside_A3, Fantasy_Inside_A4, Fantasy_Inside_A5 +4; oryginał: dlc/Winlu Fantasy Tileset - Interior (jest); git: 91 śledz.; narzędzia (28): apply_tavern_interior.py, house/decor/check_decor.py, house/props/make_house_props.py +25 | używane | zostawić |

### 3e. Grafiki z nazw składanych w kodzie (potwierdzone) - zostawić

Te pliki nie mają literału w kodzie, ale kod składa ich nazwę z prefiksu/sufiksu, a reszta nazwy występuje w kodzie (np. `"anim8/Cr_" + look + "_Walk8"` i `look: "Wolf"`).

| Plik | Rozmiar | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|
| img/characters/$Cr_Armor | 0.03 MB | prefiks „$Cr_” (Creatures.js:169) + „Armor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Armor_Atk | 0.03 MB | prefiks „$Cr_” (Creatures.js:169) + „Armor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Armor_Die | 0.03 MB | prefiks „$Cr_” (Creatures.js:169) + „Armor_Die” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Bat | 0.01 MB | prefiks „$Cr_” (Creatures.js:169) + „Bat” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Bat_Atk | 0.01 MB | prefiks „$Cr_” (Creatures.js:169) + „Bat” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Blank | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Blank” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Blank_Atk | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Blank” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Blank_Die | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Blank_Die” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Deep | 0.05 MB | prefiks „$Cr_” (Creatures.js:169) + „Deep” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Deep_Atk | 0.05 MB | prefiks „$Cr_” (Creatures.js:169) + „Deep” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Deep_Die | 0.06 MB | prefiks „$Cr_” (Creatures.js:169) + „Deep_Die” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Drowned | 0.03 MB | prefiks „$Cr_” (Creatures.js:169) + „Drowned” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Drowned_Atk | 0.03 MB | prefiks „$Cr_” (Creatures.js:169) + „Drowned” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Drowned_Die | 0.03 MB | prefiks „$Cr_” (Creatures.js:169) + „Drowned_Die” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Face_Borgar | 0.02 MB | prefiks „$Cr_Face_” (Creatures.js:170) + „Borgar” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Face_Dziadek | 0.02 MB | prefiks „$Cr_Face_” (Creatures.js:170) + „Dziadek” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Face_Kowal | 0.02 MB | prefiks „$Cr_Face_” (Creatures.js:170) + „Kowal” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Face_Melia | 0.02 MB | prefiks „$Cr_Face_” (Creatures.js:170) + „Melia” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Face_Piekarka | 0.02 MB | prefiks „$Cr_Face_” (Creatures.js:170) + „Piekarka” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Face_Soltys | 0.02 MB | prefiks „$Cr_Face_” (Creatures.js:170) + „Soltys” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Face_Wanda | 0.02 MB | prefiks „$Cr_Face_” (Creatures.js:170) + „Wanda” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Keeper | 0.11 MB | prefiks „$Cr_” (Creatures.js:169) + „Keeper” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Keeper_Atk | 0.11 MB | prefiks „$Cr_” (Creatures.js:169) + „Keeper” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Last | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Last” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Last_Atk | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Last” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Last_Die | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Last_Die” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Mother | 0.08 MB | prefiks „$Cr_” (Creatures.js:169) + „Mother” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Mother_Atk | 0.08 MB | prefiks „$Cr_” (Creatures.js:169) + „Mother” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Mother_Die | 0.10 MB | prefiks „$Cr_” (Creatures.js:169) + „Mother_Die” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Prior | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Prior” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Prior_Atk | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Prior” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Prior_Die | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Prior_Die” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Queen | 0.05 MB | prefiks „$Cr_” (Creatures.js:169) + „Queen” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Queen_Atk | 0.05 MB | prefiks „$Cr_” (Creatures.js:169) + „Queen” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Queen_Run | 0.05 MB | prefiks „$Cr_” (Creatures.js:169) + „Queen_Run” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Rat | 9.1 KB | prefiks „$Cr_” (Creatures.js:169) + „Rat” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Rat_Atk | 8.7 KB | prefiks „$Cr_” (Creatures.js:169) + „Rat” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Shadow | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Shadow” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Shadow_Atk | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Shadow” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Spider | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Spider” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Spider_Atk | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Spider” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Spider_Die | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Spider_Die” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Stone | 0.06 MB | prefiks „$Cr_” (Creatures.js:169) + „Stone” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Stone_Atk | 0.05 MB | prefiks „$Cr_” (Creatures.js:169) + „Stone” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Wraith | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Wraith” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Cr_Wraith_Atk | 0.02 MB | prefiks „$Cr_” (Creatures.js:169) + „Wraith” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Archer_Atk | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Archer” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Archer_Crouch | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Archer” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Archer_Kneel | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Archer” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Archer_Lie | 6.2 KB | prefiks „$Human_” (Humans.js:185) + „Archer” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Bandit_Atk | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Bandit” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Bandit_Crouch | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Bandit” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Bandit_Kneel | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Bandit” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Captain_Atk | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Captain” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Captain_Crouch | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Captain” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Captain_Guard | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Captain” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Captain_Kneel | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Captain” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Captain_Lie | 9.4 KB | prefiks „$Human_” (Humans.js:185) + „Captain” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Dwor_Atk | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Dwor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Dwor_Crouch | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Dwor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Dwor_Guard | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Dwor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Dwor_Kneel | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Dwor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Knife_Atk | 8.8 KB | prefiks „$Human_” (Humans.js:185) + „Knife” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Knife_Crouch | 8.8 KB | prefiks „$Human_” (Humans.js:185) + „Knife” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Knife_Kneel | 8.8 KB | prefiks „$Human_” (Humans.js:185) + „Knife” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Merc_Atk | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Merc” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Merc_Crouch | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Merc” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Merc_Guard | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Merc” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/$Human_Merc_Kneel | 0.01 MB | prefiks „$Human_” (Humans.js:185) + „Merc” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Archer_Atk8 | 0.10 MB | prefiks „anim8/” (Humans.js:193) + „Archer” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Archer_Crouch8 | 0.10 MB | prefiks „anim8/” (Humans.js:193) + „Archer” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Archer_Kneel8 | 0.10 MB | prefiks „anim8/” (Humans.js:193) + „Archer” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Archer_Lie8 | 4.4 KB | prefiks „anim8/” (Humans.js:193) + „Archer” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Archer_Run8 | 0.09 MB | prefiks „anim8/” (Humans.js:193) + „Archer” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Archer_Walk8 | 0.12 MB | prefiks „anim8/” (Humans.js:193) + „Archer” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Bandit_Atk8 | 0.12 MB | prefiks „anim8/” (Humans.js:193) + „Bandit” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Bandit_Crouch8 | 0.10 MB | prefiks „anim8/” (Humans.js:193) + „Bandit” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Bandit_Kneel8 | 0.10 MB | prefiks „anim8/” (Humans.js:193) + „Bandit” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Bandit_Lie8 | 5.5 KB | prefiks „anim8/” (Humans.js:193) + „Bandit” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Bandit_Run8 | 0.09 MB | prefiks „anim8/” (Humans.js:193) + „Bandit” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Bandit_Walk8 | 0.09 MB | prefiks „anim8/” (Humans.js:193) + „Bandit” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Captain_Atk8 | 0.17 MB | prefiks „anim8/” (Humans.js:193) + „Captain” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Captain_Guard8 | 0.09 MB | prefiks „anim8/” (Humans.js:193) + „Captain” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Captain_Kneel8 | 0.12 MB | prefiks „anim8/” (Humans.js:193) + „Captain” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Captain_Lie8 | 6.7 KB | prefiks „anim8/” (Humans.js:193) + „Captain” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Captain_Walk8 | 0.08 MB | prefiks „anim8/” (Humans.js:193) + „Captain” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Armor_Atk8 | 0.17 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Armor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Armor_Die8 | 0.16 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Armor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Armor_Walk8 | 0.12 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Armor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Bat_Atk8 | 0.05 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Bat” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Bat_Walk8 | 0.05 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Bat” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Blank_Atk8 | 0.13 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Blank” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Blank_Die8 | 0.12 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Blank” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Blank_Walk8 | 0.09 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Blank” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Deep_Atk8 | 0.29 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Deep” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Deep_Die8 | 0.34 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Deep” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Deep_Walk8 | 0.22 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Deep” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Drowned_Atk8 | 0.18 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Drowned” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Drowned_Die8 | 0.16 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Drowned” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Drowned_Walk8 | 0.13 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Drowned” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Keeper_Atk8 | 0.82 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Keeper” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Keeper_Walk8 | 0.56 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Keeper” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Last_Atk8 | 0.14 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Last” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Last_Die8 | 0.11 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Last” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Last_Walk8 | 0.07 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Last” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Mother_Atk8 | 0.56 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Mother” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Mother_Die8 | 0.57 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Mother” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Mother_Walk8 | 0.36 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Mother” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Prior_Atk8 | 0.15 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Prior” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Prior_Die8 | 0.13 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Prior” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Prior_Walk8 | 0.10 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Prior” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Queen_Atk8 | 0.30 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Queen” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Queen_Run8 | 0.25 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Queen” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Queen_Walk8 | 0.25 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Queen” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Rat_Atk8 | 0.04 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Rat” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Rat_Walk8 | 0.05 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Rat” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Shadow_Atk8 | 0.13 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Shadow” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Shadow_Walk8 | 0.09 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Shadow” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Spider_Atk8 | 0.13 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Spider” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Spider_Die8 | 0.10 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Spider” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Spider_Walk8 | 0.09 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Spider” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Stone_Atk8 | 0.31 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Stone” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Stone_Walk8 | 0.23 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Stone” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Wraith_Atk8 | 0.13 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Wraith” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Cr_Wraith_Walk8 | 0.09 MB | prefiks „anim8/Cr_” (Creatures.js:175) + „Wraith” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Dwor_Atk8 | 0.15 MB | prefiks „anim8/” (Humans.js:193) + „Dwor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Dwor_Crouch8 | 0.14 MB | prefiks „anim8/” (Humans.js:193) + „Dwor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Dwor_Guard8 | 0.11 MB | prefiks „anim8/” (Humans.js:193) + „Dwor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Dwor_Kneel8 | 0.13 MB | prefiks „anim8/” (Humans.js:193) + „Dwor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Dwor_Lie8 | 5.5 KB | prefiks „anim8/” (Humans.js:193) + „Dwor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Dwor_Walk8 | 0.11 MB | prefiks „anim8/” (Humans.js:193) + „Dwor” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Knife_Atk8 | 0.09 MB | prefiks „anim8/” (Humans.js:193) + „Knife” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Knife_Crouch8 | 0.09 MB | prefiks „anim8/” (Humans.js:193) + „Knife” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Knife_Kneel8 | 0.09 MB | prefiks „anim8/” (Humans.js:193) + „Knife” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Knife_Lie8 | 6.0 KB | prefiks „anim8/” (Humans.js:193) + „Knife” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Knife_Run8 | 0.08 MB | prefiks „anim8/” (Humans.js:193) + „Knife” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Knife_Walk8 | 0.07 MB | prefiks „anim8/” (Humans.js:193) + „Knife” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Merc_Atk8 | 0.15 MB | prefiks „anim8/” (Humans.js:193) + „Merc” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Merc_Crouch8 | 0.14 MB | prefiks „anim8/” (Humans.js:193) + „Merc” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Merc_Guard8 | 0.11 MB | prefiks „anim8/” (Humans.js:193) + „Merc” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Merc_Kneel8 | 0.13 MB | prefiks „anim8/” (Humans.js:193) + „Merc” znalezione w kodzie | używane (składana) | zostawić |
| img/characters/anim8/Merc_Lie8 | 5.4 KB | prefiks „anim8/” (Humans.js:193) + „Merc” znalezione w kodzie | używane (składana) | zostawić |
| img/pictures/Bronek_Bust | 0.05 MB | rdzeń „Bronek” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Celnik_Bust | 0.04 MB | rdzeń „Celnik” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Drwal_Bust | 0.06 MB | rdzeń „Drwal” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Dzwonnik_Bust | 0.05 MB | rdzeń „Dzwonnik” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Ela_Bust | 0.05 MB | rdzeń „Ela” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Feliks_Bust | 0.07 MB | rdzeń „Feliks” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Franek_Bust | 0.05 MB | rdzeń „Franek” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Garbarz_Bust | 0.06 MB | rdzeń „Garbarz” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Janek_Bust | 0.05 MB | rdzeń „Janek” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Kamerdyner_Bust | 0.10 MB | rdzeń „Kamerdyner” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Kapral_Bust | 0.05 MB | rdzeń „Kapral” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Klusownik_Bust | 0.09 MB | rdzeń „Klusownik” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Kupiec_Bust | 0.09 MB | rdzeń „Kupiec” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Kwatermistrz_Bust | 0.04 MB | rdzeń „Kwatermistrz” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Latarnik_Bust | 0.07 MB | rdzeń „Latarnik” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Lord_Bust | 0.12 MB | rdzeń „Lord” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Ludmila_Bust | 0.05 MB | rdzeń „Ludmila” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Marek_Bust | 0.06 MB | rdzeń „Marek” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Piekarka_Bust | 0.06 MB | rdzeń „Piekarka” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Praczka_Bust | 0.04 MB | rdzeń „Praczka” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Przemytnik_Bust | 0.06 MB | rdzeń „Przemytnik” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Pustelnik_Bust | 0.06 MB | rdzeń „Pustelnik” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Rafal_Bust | 0.06 MB | rdzeń „Rafal” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Rotmistrz_Bust | 0.06 MB | rdzeń „Rotmistrz” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Rozbitek_Bust | 0.05 MB | rdzeń „Rozbitek” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Soltys_Bust | 0.07 MB | rdzeń „Soltys” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Straznik_Bust | 0.05 MB | rdzeń „Straznik” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Szmaciarz_Bust | 0.11 MB | rdzeń „Szmaciarz” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Uchodzca_Bust | 0.07 MB | rdzeń „Uchodzca” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Werbownik_Bust | 0.07 MB | rdzeń „Werbownik” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Woziwoda_Bust | 0.08 MB | rdzeń „Woziwoda” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Zebrak_Bust | 0.08 MB | rdzeń „Zebrak” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Zlodziej_Bust | 0.08 MB | rdzeń „Zlodziej” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Znachorka_Bust | 0.09 MB | rdzeń „Znachorka” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/pictures/Zosia_Bust | 0.07 MB | rdzeń „Zosia” użyty + sufiks „_Bust” (SpeechBubbles.js:128) | używane (składana) | zostawić |
| img/system/Gather_Berries_0 | 1.4 KB | prefiks „Gather_” (Farming_Render.js:384) + „Berries_0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Branch_0 | 1.0 KB | prefiks „Gather_” (Farming_Render.js:384) + „Branch_0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Branch_1 | 1.1 KB | prefiks „Gather_” (Farming_Render.js:384) + „Branch_1” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Bush_0 | 4.2 KB | prefiks „Gather_” (Farming_Render.js:384) + „Bush_0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Bush_1 | 4.3 KB | prefiks „Gather_” (Farming_Render.js:384) + „Bush_1” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Bush_2 | 4.2 KB | prefiks „Gather_” (Farming_Render.js:384) + „Bush_2” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Bush_3 | 3.8 KB | prefiks „Gather_” (Farming_Render.js:384) + „Bush_3” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Cone_0 | 1.4 KB | prefiks „Gather_” (Farming_Render.js:384) + „Cone_0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Cone_1 | 0.9 KB | prefiks „Gather_” (Farming_Render.js:384) + „Cone_1” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Flax_0 | 1.3 KB | prefiks „Gather_” (Farming_Render.js:384) + „Flax_0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Flax_1 | 1.3 KB | prefiks „Gather_” (Farming_Render.js:384) + „Flax_1” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Garlic_0 | 1.6 KB | prefiks „Gather_” (Farming_Render.js:384) + „Garlic_0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Herb_0 | 1.3 KB | prefiks „Gather_” (Farming_Render.js:384) + „Herb_0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Mushroom_0 | 1.4 KB | prefiks „Gather_” (Farming_Render.js:384) + „Mushroom_0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Mushroom_1 | 1.3 KB | prefiks „Gather_” (Farming_Render.js:384) + „Mushroom_1” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Mushroom_2 | 2.3 KB | prefiks „Gather_” (Farming_Render.js:384) + „Mushroom_2” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Mushroom_3 | 1.4 KB | prefiks „Gather_” (Farming_Render.js:384) + „Mushroom_3” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Mushroom_4 | 1.7 KB | prefiks „Gather_” (Farming_Render.js:384) + „Mushroom_4” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Nettle_0 | 1.6 KB | prefiks „Gather_” (Farming_Render.js:384) + „Nettle_0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Nettle_1 | 1.3 KB | prefiks „Gather_” (Farming_Render.js:384) + „Nettle_1” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Stone_0 | 0.6 KB | prefiks „Gather_” (Farming_Render.js:384) + „Stone_0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Stone_1 | 0.6 KB | prefiks „Gather_” (Farming_Render.js:384) + „Stone_1” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Stone_2 | 0.8 KB | prefiks „Gather_” (Farming_Render.js:384) + „Stone_2” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_WildCarrot_0 | 1.2 KB | prefiks „Gather_” (Farming_Render.js:384) + „WildCarrot_0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_WildCarrot_1 | 1.0 KB | prefiks „Gather_” (Farming_Render.js:384) + „WildCarrot_1” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_WildPotato_0 | 1.6 KB | prefiks „Gather_” (Farming_Render.js:384) + „WildPotato_0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_WildPotato_1 | 0.9 KB | prefiks „Gather_” (Farming_Render.js:384) + „WildPotato_1” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Gather_Yarrow_0 | 1.7 KB | prefiks „Gather_” (Farming_Render.js:384) + „Yarrow_0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/Motyle_Gablotka_Bielinek_Cien | 0.9 KB | rdzeń „Motyle_Gablotka_Bielinek” użyty + sufiks „_Cien” (Motyle.js:1174 (stała)) | używane (składana) | zostawić |
| img/system/Motyle_Gablotka_Cma_Cien | 0.8 KB | rdzeń „Motyle_Gablotka_Cma” użyty + sufiks „_Cien” (Motyle.js:1174 (stała)) | używane (składana) | zostawić |
| img/system/Motyle_Gablotka_Cytrynek_Cien | 0.8 KB | rdzeń „Motyle_Gablotka_Cytrynek” użyty + sufiks „_Cien” (Motyle.js:1174 (stała)) | używane (składana) | zostawić |
| img/system/Motyle_Gablotka_Modraszek_Cien | 0.8 KB | rdzeń „Motyle_Gablotka_Modraszek” użyty + sufiks „_Cien” (Motyle.js:1174 (stała)) | używane (składana) | zostawić |
| img/system/Motyle_Gablotka_Pawik_Cien | 0.8 KB | rdzeń „Motyle_Gablotka_Pawik” użyty + sufiks „_Cien” (Motyle.js:1174 (stała)) | używane (składana) | zostawić |
| img/system/RedWater_Fish_0 | 0.7 KB | prefiks „RedWater_Fish_” (CzerwonaWoda.js:290) + „0” znalezione w kodzie | używane (składana) | zostawić |
| img/system/RedWater_Fish_1 | 0.7 KB | prefiks „RedWater_Fish_” (CzerwonaWoda.js:290) + „1” znalezione w kodzie | używane (składana) | zostawić |

## 4. Dźwięki (audio/)

| Folder | Pliki | Rozmiar | używane | składane (potw.) | możliwe | pewne nieużywane |
|---|---|---|---|---|---|---|
| audio/bgm | 48 | 28.50 MB | 12 | 0 | 3 | 33 |
| audio/bgs | 29 | 3.94 MB | 22 | 0 | 1 | 6 |
| audio/me | 27 | 1.45 MB | 6 | 0 | 2 | 19 |
| audio/se | 345 | 3.92 MB | 138 | 0 | 76 | 131 |

### 4a. Własne dźwięki - PEWNIE nieużywane

Brak.

### 4b. Dźwięki RTP - PEWNIE nieużywane

**audio/bgm** - 33 plików, 19.85 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Battle2 | 0.57 MB | RTP | brak odwołań | pewne | usunąć |
| Battle3 | 0.71 MB | RTP | brak odwołań | pewne | usunąć |
| Battle4 | 0.82 MB | RTP | brak odwołań | pewne | usunąć |
| Battle5 | 0.70 MB | RTP | brak odwołań | pewne | usunąć |
| Battle6 | 0.68 MB | RTP | brak odwołań | pewne | usunąć |
| Battle7 | 0.49 MB | RTP | brak odwołań | pewne | usunąć |
| Battle8 | 0.80 MB | RTP | brak odwołań | pewne | usunąć |
| Castle1 | 0.55 MB | RTP | brak odwołań | pewne | usunąć |
| Castle2 | 0.58 MB | RTP | brak odwołań | pewne | usunąć |
| Castle3 | 0.62 MB | RTP | brak odwołań | pewne | usunąć |
| Dungeon2 | 0.73 MB | RTP | brak odwołań | pewne | usunąć |
| Dungeon3 | 0.62 MB | RTP | brak odwołań | pewne | usunąć |
| Dungeon4 | 0.46 MB | RTP | brak odwołań | pewne | usunąć |
| Dungeon5 | 0.56 MB | RTP | brak odwołań | pewne | usunąć |
| Dungeon6 | 0.64 MB | RTP | brak odwołań | pewne | usunąć |
| Dungeon7 | 0.80 MB | RTP | brak odwołań | pewne | usunąć |
| Field4 | 0.52 MB | RTP | brak odwołań | pewne | usunąć |
| Scene3 | 0.46 MB | RTP | brak odwołań | pewne | usunąć |
| Scene5 | 0.53 MB | RTP | brak odwołań | pewne | usunąć |
| Scene6 | 0.49 MB | RTP | brak odwołań | pewne | usunąć |
| Scene7 | 0.52 MB | RTP | brak odwołań | pewne | usunąć |
| Scene8 | 0.56 MB | RTP | brak odwołań | pewne | usunąć |
| Scene9 | 0.59 MB | RTP | brak odwołań | pewne | usunąć |
| Theme1 | 0.60 MB | RTP | brak odwołań | pewne | usunąć |
| Theme2 | 0.59 MB | RTP | brak odwołań | pewne | usunąć |
| Theme3 | 0.55 MB | RTP | brak odwołań | pewne | usunąć |
| Town2 | 0.59 MB | RTP | brak odwołań | pewne | usunąć |
| Town3 | 0.55 MB | RTP | brak odwołań | pewne | usunąć |
| Town4 | 0.58 MB | RTP | brak odwołań | pewne | usunąć |
| Town5 | 0.61 MB | RTP | brak odwołań | pewne | usunąć |
| Town6 | 0.52 MB | RTP | brak odwołań | pewne | usunąć |
| Town7 | 0.70 MB | RTP | brak odwołań | pewne | usunąć |
| Town8 | 0.59 MB | RTP | brak odwołań | pewne | usunąć |

**audio/bgs** - 6 plików, 0.53 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| City | 0.34 MB | RTP | brak odwołań | pewne | usunąć |
| Quake1 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Quake2 | 9.2 KB | RTP | brak odwołań | pewne | usunąć |
| Storm1 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Waterfall1 | 0.07 MB | RTP | brak odwołań | pewne | usunąć |
| Waterfall2 | 0.07 MB | RTP | brak odwołań | pewne | usunąć |

**audio/me** - 19 plików, 0.96 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Curse1 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Curse2 | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Defeat2 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Fanfare1 | 0.09 MB | RTP | brak odwołań | pewne | usunąć |
| Fanfare2 | 0.09 MB | RTP | brak odwołań | pewne | usunąć |
| Fanfare3 | 0.08 MB | RTP | brak odwołań | pewne | usunąć |
| Gag | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Gameover2 | 0.10 MB | RTP | brak odwołań | pewne | usunąć |
| Horror | 0.04 MB | RTP | brak odwołań | pewne | usunąć |
| Musical2 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Musical3 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Mystery | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Organ | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Refresh | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Shock1 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Shock2 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Shock3 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Victory2 | 0.05 MB | RTP | brak odwołań | pewne | usunąć |
| Victory3 | 0.06 MB | RTP | brak odwołań | pewne | usunąć |

**audio/se** - 131 plików, 1.68 MB

| Nazwa | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| Absorb1 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Applause2 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Attack1 | 6.0 KB | RTP | brak odwołań | pewne | usunąć |
| Autodoor | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Barrier | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Battle2 | 10.1 KB | RTP | brak odwołań | pewne | usunąć |
| Battle4 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Battle5 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Battle6 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Blow10 | 8.5 KB | RTP | brak odwołań | pewne | usunąć |
| Blow5 | 5.3 KB | RTP | brak odwołań | pewne | usunąć |
| Blow7 | 7.4 KB | RTP | brak odwołań | pewne | usunąć |
| Blow8 | 6.0 KB | RTP | brak odwołań | pewne | usunąć |
| Blow9 | 9.4 KB | RTP | brak odwołań | pewne | usunąć |
| Bow4 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Bow5 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Buzzer3 | 7.7 KB | RTP | brak odwołań | pewne | usunąć |
| Cancel3 | 7.0 KB | RTP | brak odwołań | pewne | usunąć |
| Chest2 | 9.7 KB | RTP | brak odwołań | pewne | usunąć |
| Chicken | 9.9 KB | RTP | brak odwołań | pewne | usunąć |
| Chime1 | 5.9 KB | RTP | brak odwołań | pewne | usunąć |
| Close2 | 7.6 KB | RTP | brak odwołań | pewne | usunąć |
| Close3 | 8.1 KB | RTP | brak odwołań | pewne | usunąć |
| Computer | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Confuse | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Cow | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Cry1 | 6.2 KB | RTP | brak odwołań | pewne | usunąć |
| Cry2 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Cursor4 | 5.5 KB | RTP | brak odwołań | pewne | usunąć |
| Darkness6 | 6.0 KB | RTP | brak odwołań | pewne | usunąć |
| Decision3 | 8.0 KB | RTP | brak odwołań | pewne | usunąć |
| Decision4 | 5.8 KB | RTP | brak odwołań | pewne | usunąć |
| Decision5 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Devil1 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Devil2 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Devil3 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Door3 | 9.6 KB | RTP | brak odwołań | pewne | usunąć |
| Door4 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Door6 | 8.8 KB | RTP | brak odwołań | pewne | usunąć |
| Door7 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Door8 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Down3 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Down4 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Down5 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Down6 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Down7 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Electrocardiogram | 6.9 KB | RTP | brak odwołań | pewne | usunąć |
| Explosion3 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Fire4 | 9.5 KB | RTP | brak odwołań | pewne | usunąć |
| Fire5 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Flash3 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Fog1 | 6.9 KB | RTP | brak odwołań | pewne | usunąć |
| Fog2 | 9.7 KB | RTP | brak odwołań | pewne | usunąć |
| Heal4 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Heal5 | 8.7 KB | RTP | brak odwołań | pewne | usunąć |
| Heal6 | 7.5 KB | RTP | brak odwołań | pewne | usunąć |
| Heal7 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Ice2 | 8.4 KB | RTP | brak odwołań | pewne | usunąć |
| Ice6 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Ice7 | 6.4 KB | RTP | brak odwołań | pewne | usunąć |
| Ice8 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Ice9 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Jump2 | 5.2 KB | RTP | brak odwołań | pewne | usunąć |
| Laser2 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Launch | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Leakage | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Load1 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Magic11 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Magic6 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Magic7 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Magic8 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Magic9 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Monster10 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Monster4 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Monster6 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Monster7 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Monster8 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Monster9 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Move10 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Move2 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Move4 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Move5 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Move6 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Move7 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Move8 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Move9 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Neon | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Open2 | 6.9 KB | RTP | brak odwołań | pewne | usunąć |
| Open3 | 7.5 KB | RTP | brak odwołań | pewne | usunąć |
| Open4 | 6.6 KB | RTP | brak odwołań | pewne | usunąć |
| Open6 | 9.9 KB | RTP | brak odwołań | pewne | usunąć |
| Open7 | 8.5 KB | RTP | brak odwołań | pewne | usunąć |
| Open8 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Open9 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Particles2 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Particles3 | 0.03 MB | RTP | brak odwołań | pewne | usunąć |
| Pollen | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Raise1 | 8.4 KB | RTP | brak odwołań | pewne | usunąć |
| Raise3 | 10.1 KB | RTP | brak odwołań | pewne | usunąć |
| Resonance | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Saint5 | 7.1 KB | RTP | brak odwołań | pewne | usunąć |
| Saint6 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Saint7 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Saint8 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Saint9 | 7.3 KB | RTP | brak odwołań | pewne | usunąć |
| Save1 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Scream | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Sheep | 8.3 KB | RTP | brak odwołań | pewne | usunąć |
| Shop2 | 6.2 KB | RTP | brak odwołań | pewne | usunąć |
| Shot1 | 7.9 KB | RTP | brak odwołań | pewne | usunąć |
| Shot2 | 5.5 KB | RTP | brak odwołań | pewne | usunąć |
| Shot3 | 8.1 KB | RTP | brak odwołań | pewne | usunąć |
| Siren | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Slash6 | 6.0 KB | RTP | brak odwołań | pewne | usunąć |
| Slash7 | 5.3 KB | RTP | brak odwołań | pewne | usunąć |
| Slash9 | 5.8 KB | RTP | brak odwołań | pewne | usunąć |
| Sound1 | 6.0 KB | RTP | brak odwołań | pewne | usunąć |
| Summon | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Switch3 | 5.7 KB | RTP | brak odwołań | pewne | usunąć |
| Sword3 | 6.9 KB | RTP | brak odwołań | pewne | usunąć |
| Sword6 | 9.3 KB | RTP | brak odwołań | pewne | usunąć |
| Sword7 | 9.0 KB | RTP | brak odwołań | pewne | usunąć |
| Thunder13 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Thunder14 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Transceiver | 9.4 KB | RTP | brak odwołań | pewne | usunąć |
| Up2 | 0.01 MB | RTP | brak odwołań | pewne | usunąć |
| Up5 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Up6 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Up7 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Up8 | 0.02 MB | RTP | brak odwołań | pewne | usunąć |
| Water3 | 8.7 KB | RTP | brak odwołań | pewne | usunąć |

### 4c. Dźwięki MOŻE używane - do decyzji

**RTP: tylko baza bitew / animacji / pojazdów albo rdzeń RMMZ w kodzie bitwy** - 76 plików, 2.34 MB

| Plik | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| bgm/Battle1 | 0.54 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (System (bitwa)); testy: atmosphere_test.js | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| bgm/Ship1 | 0.45 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (System (pojazd)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| bgm/Ship2 | 0.50 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (System (pojazd)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| me/Defeat1 | 0.05 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (System (bitwa)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Absorb2 | 10.1 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Attack2 | 7.7 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Attack3 | 6.7 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations, System (bitwa)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Battle1 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (System (bitwa)); testy: atmosphere_test.js | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Battle3 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Blind | 9.6 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Collapse2 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (System (bitwa)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Collapse3 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (System (bitwa)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Crossbow | 6.1 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Damage2 | 6.6 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Damage4 | 7.2 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations, System (bitwa)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Damage5 | 6.3 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (System (bitwa)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Darkness7 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Darkness8 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Down2 | 8.4 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Explosion1 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Explosion2 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Explosion4 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Fire6 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Fire7 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Fire8 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Fire9 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Flash2 | 9.8 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Float1 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Float2 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Gun1 | 7.4 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Gun2 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Gun3 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Heal1 | 6.2 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Heal3 | 8.3 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Ice1 | 6.2 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Ice10 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Ice11 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Ice3 | 7.5 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Ice4 | 7.3 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Ice5 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Laser1 | 9.4 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Magic1 | 7.1 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Magic12 | 0.03 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Magic2 | 9.8 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Magic4 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Magic5 | 10.2 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Paralyze1 | 7.3 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Paralyze2 | 5.5 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Paralyze3 | 9.6 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Particles1 | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Particles4 | 0.03 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Phone | 7.7 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Powerup | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Raise2 | 6.6 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Recovery | 7.3 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations, System (bitwa)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Reflection | 7.2 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations, System (bitwa)) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Saint2 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Saint4 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Silence | 6.8 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Skill1 | 7.9 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Skill2 | 9.4 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Skill3 | 10.1 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Slash5 | 5.9 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Slash8 | 5.8 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Sleep | 6.2 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations); testy: sleep_danger_test.js | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Sound2 | 8.1 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Sound3 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Starlight | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Sword5 | 6.3 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Teleport | 0.02 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Thunder2 | 5.7 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Twine | 8.3 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Up1 | 9.1 KB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Up3 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Water4 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |
| se/Water5 | 0.01 MB | RTP | tylko: bitwy/pojazdy/animacje z bazy (Animations) | możliwe | usunąć (razem z wpisami RTP bazy, sekcja 6) albo zostawić |

**RTP: zbieżność nazw albo wzmianka (nazwa użyta do czegoś innego)** - 6 plików, 0.16 MB

| Plik | Rozmiar | Pochodzenie / git | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| bgs/Fire3 | 0.08 MB | RTP | zbieżność nazw: literał „Fire3” w Torch.js:196 użyty raczej jako audio/se: `if (layerNow) layerNow.puff();         if (why === "burnt") { se("Fire3", 40, 70); say("Po` | możliwe | usunąć po rzucie oka na dowód |
| me/Like | 0.04 MB | RTP | tylko wzmianka w komentarzu: Creatures.js:10; narzędzia: tiles/soft/groundlib/tex.py | możliwe | usunąć po rzucie oka na dowód |
| se/Dog | 5.4 KB | RTP | zbieżność nazw: literał „Dog” w Farming_Build.js:343 użyty raczej jako coś innego niż grafika/dźwięk (flaga, klucz, nazwa): `for (const member of $gameParty.members()) member.setHp(Math.min(member.mhp, member.hp + M`; testy: ap.js, buildings_contract_test.js +2; narzędzia: miejsca_wyspy/staging/js/plugins.js, orzel/staging/js/plugins.js +2 | możliwe | usunąć po rzucie oka na dowód |
| se/Fall | 8.2 KB | RTP | zbieżność nazw: literał „Fall” w WaterFx.js:423 użyty raczej jako coś innego niż grafika/dźwięk (flaga, klucz, nazwa): `const note = ev.event().note;             const splash = tagArgs(note, "Splash"), flow = t`; testy: waterfall_test.js; narzędzia: town/waterfall_fx.py | możliwe | usunąć po rzucie oka na dowód |
| se/Noise | 0.01 MB | RTP | tylko wzmianka w komentarzu: Hunting_Weapons.js:87 | możliwe | usunąć po rzucie oka na dowód |
| se/Thunder12 | 0.01 MB | RTP | tylko wzmianka w komentarzu: Storm.js:79 | możliwe | usunąć po rzucie oka na dowód |

### 4e. Czcionki, efekty, inne foldery gry

| Plik / folder | Rozmiar | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|
| fonts/AlegreyaSC-Bold.ttf | 0.36 MB | kod/CSS: TawernaUI.js:249 | używane | zostawić |
| fonts/AlegreyaSC-OFL.txt | 4.3 KB | licencja OFL czcionki (wymagana przy rozpowszechnianiu czcionki) | używane | zostawić |
| fonts/AlegreyaSans-Bold.ttf | 0.25 MB | kod/CSS: CleanHUD.js:145, TitleScreen.js:93 | używane | zostawić |
| fonts/AlegreyaSans-Medium.ttf | 0.25 MB | kod/CSS: UITheme.js:114 | używane | zostawić |
| fonts/AlegreyaSans-OFL.txt | 4.3 KB | licencja OFL czcionki (wymagana przy rozpowszechnianiu czcionki) | używane | zostawić |
| fonts/AlegreyaSans-Regular.ttf | 0.25 MB | kod/CSS: CleanHUD.js:145, TitleScreen.js:94 | używane | zostawić |
| fonts/AlegreyaSansSC-Medium.ttf | 0.25 MB | kod/CSS: CleanHUD.js:145 | używane | zostawić |
| fonts/Caveat-Bold.ttf | 0.25 MB | kod/CSS: TawernaUI.js:249 | używane | zostawić |
| fonts/Caveat-OFL.txt | 4.3 KB | licencja OFL czcionki (wymagana przy rozpowszechnianiu czcionki) | używane | zostawić |
| fonts/Caveat-Regular.ttf | 0.25 MB | kod/CSS: TawernaUI.js:249 | używane | zostawić |
| fonts/EBGaramond-OFL.txt | 4.3 KB | licencja OFL czcionki (wymagana przy rozpowszechnianiu czcionki) | używane | zostawić |
| fonts/EBGaramond-Variable.ttf | 0.81 MB | kod/CSS: TitleScreen.js:92, Prologue.js:72 | używane | zostawić |
| fonts/PirataOne-OFL.txt | 4.3 KB | licencja OFL czcionki (wymagana przy rozpowszechnianiu czcionki) | używane | zostawić |
| fonts/PirataOne-Regular.ttf | 0.05 MB | kod/CSS: TitleScreen.js:91 | używane | zostawić |
| fonts/mplus-1m-regular.woff | 0.96 MB | brak odwołań w grze (ani w kodzie, ani w System.json); pochodzenie: RTP | pewne | usunąć (RTP, do odzyskania z RPG Makera) |
| fonts/mplus-2p-bold-sub.woff | 6.9 KB | System.json advanced.numberFontFilename = mplus-2p-bold-sub.woff (rdzeń wczytuje go przy starcie); UITheme.js podmienia go przy starcie na AlegreyaSans-Medium.ttf, więc dziś nie jest ładowany - ale bez tego pliku gra nie wstanie, gdy UITheme zostanie wyłączony | możliwe | zostawić (mały) albo zmienić czcionkę liczb w Bazie danych > System 2 |
| effects/ (175 plików) | 2.64 MB | efekty Effekseer RTP; Animations.json wskazuje 120 z 120 plików .efkefc; animacji z bazy gra nie pokazuje (212/337: 0); w kodzie wtyczek: Breath, Confusion, Death +8 | możliwe | zostawić (mały, rdzeń RMMZ je wczytuje przy animacjach) |
| movies/ | 0 | pusty folder (standard RMMZ, na filmy) | używane (standard) | zostawić |

## 5. Śmieci poza grą

### 5a. Katalog główny projektu

Zrzuty *.png w katalogu głównym zapisują testy uruchomione z katalogu projektu (ścieżka względna); te same zrzuty powstają w tests/. Żaden nie jest w git.

| Nazwa | Rozmiar | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|
| artlib.py | 0.0 KB | git: śledzony; pusty plik 0 B (w git od commita 5c95269); prawdziwy moduł to tools/tavern/artlib.py (importują go: decor_paint.py, make_board.py, make_decor.py +2) | pewne | usunąć (git rm) |
| bubble_bark.png | 0.14 MB | git: nieśledzony; zrzut testu bubbles_test.js; nowsza wersja w tests/ | pewne | usunąć |
| bubble_borgar.png | 0.14 MB | git: nieśledzony; zrzut testu bubbles_test.js; nowsza wersja w tests/ | pewne | usunąć |
| bubble_choices.png | 0.18 MB | git: nieśledzony; zrzut testu bubbles_test.js; nowsza wersja w tests/ | pewne | usunąć |
| bubble_player.png | 0.14 MB | git: nieśledzony; zrzut testu bubbles_test.js; nowsza wersja w tests/ | pewne | usunąć |
| debug_kinds.png | 0.43 MB | git: nieśledzony; zrzut testu debug_menu_test.js; nowsza wersja w tests/ | pewne | usunąć |
| dog_hurt_kennel.png | 1.76 MB | git: nieśledzony; zrzut testu dog_test.js | pewne | usunąć |
| dog_rest_kennel.png | 1.78 MB | git: nieśledzony; zrzut testu dog_test.js | pewne | usunąć |
| dog_sleep.png | 1.38 MB | git: nieśledzony; zrzut testu dog_test.js | pewne | usunąć |
| dog_work.png | 1.80 MB | git: nieśledzony; zrzut testu dog_test.js | pewne | usunąć |
| fire_cauldron_day.png | 1.80 MB | git: nieśledzony; zrzut testu fire_test.js; nowsza wersja w tests/ | pewne | usunąć |
| fire_cauldron_night.png | 0.88 MB | git: nieśledzony; zrzut testu fire_test.js; nowsza wersja w tests/ | pewne | usunąć |
| fire_day.png | 1.81 MB | git: nieśledzony; zrzut testu fire_test.js; nowsza wersja w tests/ | pewne | usunąć |
| fire_night.png | 0.89 MB | git: nieśledzony; zrzut testu fire_test.js; nowsza wersja w tests/ | pewne | usunąć |
| fire_rain.png | 1.36 MB | git: nieśledzony; zrzut testu fire_fuel_test.js; nowsza wersja w tests/ | pewne | usunąć |
| fire_smoulder.png | 1.57 MB | git: nieśledzony; zrzut testu fire_fuel_test.js; nowsza wersja w tests/ | pewne | usunąć |
| fire_tripod_day.png | 1.80 MB | git: nieśledzony; zrzut testu fire_test.js; nowsza wersja w tests/ | pewne | usunąć |
| fire_tripod_roast_done.png | 1.04 MB | git: nieśledzony; zrzut testu sit_test.js; nowsza wersja w tests/ | pewne | usunąć |
| gain_feed.png | 1.62 MB | git: nieśledzony; zrzut testu gain_feed_test.js; nowsza wersja w tests/ | pewne | usunąć |
| gain_goal.png | 1.61 MB | git: nieśledzony; zrzut testu gain_feed_test.js; nowsza wersja w tests/ | pewne | usunąć |
| gain_xp_top.png | 1.65 MB | git: nieśledzony; zrzut testu gain_feed_test.js; nowsza wersja w tests/ | pewne | usunąć |
| hero_attr_table.png | 0.20 MB | git: nieśledzony; zrzut testu hero_menu_test.js; nowsza wersja w tests/ | pewne | usunąć |
| menu_fire_note.png | 1.48 MB | git: nieśledzony; zrzut testu menu_test.js; nowsza wersja w tests/ | pewne | usunąć |
| menu_height_build.png | 1.54 MB | git: nieśledzony; zrzut testu menu_height_test.js; nowsza wersja w tests/ | pewne | usunąć |
| menu_height_fire.png | 1.54 MB | git: nieśledzony; zrzut testu menu_height_test.js; nowsza wersja w tests/ | pewne | usunąć |
| menu_height_food.png | 1.65 MB | git: nieśledzony; zrzut testu menu_height_test.js; nowsza wersja w tests/ | pewne | usunąć |
| placer_invalid.png | 1.41 MB | git: nieśledzony; zrzut testu place_test.js; nowsza wersja w tests/ | pewne | usunąć |
| placer_valid.png | 1.34 MB | git: nieśledzony; zrzut testu place_test.js; nowsza wersja w tests/ | pewne | usunąć |
| save_notice.png | 1.84 MB | git: nieśledzony; zrzut testu atmosphere_test.js, save_notice_test.js; nowsza wersja w tests/ | pewne | usunąć |
| save_notice_combat.png | 1.67 MB | git: nieśledzony; zrzut testu save_notice_test.js; nowsza wersja w tests/ | pewne | usunąć |
| save_notice_day.png | 1.63 MB | git: nieśledzony; zrzut testu save_notice_test.js; nowsza wersja w tests/ | pewne | usunąć |
| shoot_bow_draw.png | 1.28 MB | git: nieśledzony; zrzut testu shoot_anim_test.js; nowsza wersja w tests/ | pewne | usunąć |
| shoot_bow_release.png | 1.23 MB | git: nieśledzony; zrzut testu shoot_anim_test.js; nowsza wersja w tests/ | pewne | usunąć |
| shoot_sling_front.png | 1.20 MB | git: nieśledzony; zrzut testu shoot_anim_test.js; nowsza wersja w tests/ | pewne | usunąć |
| shoot_sling_whirl.png | 1.20 MB | git: nieśledzony; zrzut testu shoot_anim_test.js; nowsza wersja w tests/ | pewne | usunąć |
| sit_rest_2.png | 1.37 MB | git: nieśledzony; zrzut testu; nowsza wersja w tests/ | pewne | usunąć |
| sit_rest_6.png | 1.47 MB | git: nieśledzony; zrzut testu; nowsza wersja w tests/ | pewne | usunąć |
| sit_rest_8.png | 1.46 MB | git: nieśledzony; zrzut testu; nowsza wersja w tests/ | pewne | usunąć |
| sit_roast_2.png | 1.24 MB | git: nieśledzony; zrzut testu; nowsza wersja w tests/ | pewne | usunąć |
| sit_roast_6.png | 1.23 MB | git: nieśledzony; zrzut testu; nowsza wersja w tests/ | pewne | usunąć |
| sit_roast_8.png | 1.27 MB | git: nieśledzony; zrzut testu; nowsza wersja w tests/ | pewne | usunąć |
| site_1of3.png | 1.77 MB | git: nieśledzony; zrzut testu site_test.js; nowsza wersja w tests/ | pewne | usunąć |
| site_done.png | 1.77 MB | git: nieśledzony; zrzut testu site_test.js; nowsza wersja w tests/ | pewne | usunąć |
| site_hammer_swing.png | 1.77 MB | git: nieśledzony; zrzut testu site_test.js; nowsza wersja w tests/ | pewne | usunąć |
| site_marked.png | 1.77 MB | git: nieśledzony; zrzut testu site_test.js; nowsza wersja w tests/ | pewne | usunąć |
| sleep_wolves.png | 0.87 MB | git: nieśledzony; zrzut testu sleep_danger_test.js | pewne | usunąć |
| sunrays.png | 1.72 MB | git: nieśledzony; zrzut testu sunrays_test.js; nowsza wersja w tests/ | pewne | usunąć |
| tex/ | 0 | pusty folder (nie jest częścią RMMZ, nic go nie używa) | pewne | usunąć |
| tired.png | 1.80 MB | git: nieśledzony; zrzut testu tired_test.js; nowsza wersja w tests/ | pewne | usunąć |
| wild_carrot.png | 1.37 MB | git: nieśledzony; zrzut testu wild_veg_test.js; nowsza wersja w tests/ | pewne | usunąć |
| wild_potato.png | 1.31 MB | git: nieśledzony; zrzut testu wild_veg_test.js; nowsza wersja w tests/ | pewne | usunąć |
| yard_coop.png | 1.38 MB | git: nieśledzony; zrzut testu yard_test.js; nowsza wersja w tests/ | pewne | usunąć |
| yard_cows.png | 1.35 MB | git: nieśledzony; zrzut testu yard_test.js; nowsza wersja w tests/ | pewne | usunąć |
| yard_kilns.png | 1.38 MB | git: nieśledzony; zrzut testu yard_test.js; nowsza wersja w tests/ | pewne | usunąć |
| yard_pen.png | 1.36 MB | git: nieśledzony; zrzut testu yard_test.js; nowsza wersja w tests/ | pewne | usunąć |
| yard_placer.png | 1.34 MB | git: nieśledzony; zrzut testu yard_test.js; nowsza wersja w tests/ | pewne | usunąć |

### 5b. Foldery backup_art_*

Kopie zapasowe grafik/wtyczek robione przed zmianami (żaden nie jest w git). „Identyczne” = plik bajt w bajt taki sam jak obecny plik w projekcie (czysty duplikat).

| Folder | Pliki | Rozmiar | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| backup_art_2026-09-22/ | 13 | 0.92 MB | git: 13 nieśledz.; w środku (13): !$Tree_Apple.png, !$Tree_FruitBare.png, !$Tree_Pear.png, Farm_Brickworks_L.png, Farm_Cauldron_XL.png +3; identycznych z obecnymi: 0 (0.0 KB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-09-24/ | 37 | 1.51 MB | git: 37 nieśledz.; w środku (6): IconSet_before_club.png, IconSet_before_fist.png, IconSet_before_meats.png, IconSet_before_shield.png, ikona_tarcza_okuta_na_etap2.png +1; identycznych z obecnymi: 0 (0.0 KB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-09-25/ | 5 | 0.78 MB | git: 5 nieśledz.; w środku (5): Farm_Tent.png, Farm_Tent_L.png, IconSet_before_clay.png, IconSet_before_fired_pot.png, IconSet_before_pots.png; identycznych z obecnymi: 1 (4.6 KB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-09-26/ | 84 | 7.18 MB | git: 84 nieśledz.; w środku (76): Birds_before_dog.js, ChoppableTree_before_swing_save.js, Combat_before_diag.js, Combat_before_livedir.js, Dog_before_bowl.js +3; identycznych z obecnymi: 1 (0.13 MB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-09-28/ | 906 | 153.17 MB | git: 841 nieśledz., 65 ignor.; w środku (8): Map020_before_fence_fix.json, home, house_before_install, pre_refactor, refactor +3; identycznych z obecnymi: 482 (25.19 MB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-09-29/ | 51 | 2.42 MB | git: 51 nieśledz.; w środku (5): STORY_before_wyspa.md, cat, house_table, stage6, town_install; identycznych z obecnymi: 2 (0.42 MB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-09-30/ | 71 | 1.39 MB | git: 71 nieśledz.; w środku (6): ground_pixellab, mushrooms, mushrooms_pixellab, sky_plugin, town_rows +1; identycznych z obecnymi: 0 (0.0 KB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-10-04/ | 43 | 3.28 MB | git: 43 nieśledz.; w środku (8): east_gate, interiors, manor, npc_integration, quests +3; identycznych z obecnymi: 11 (0.48 MB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-10-05/ | 199 | 15.92 MB | git: 199 nieśledz.; w środku (15): after_interiors, butler, combat_stage2, kamerdyner, knights_garden +3; identycznych z obecnymi: 31 (0.86 MB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-10-06/ | 235 | 13.67 MB | git: 230 nieśledz., 5 ignor.; w środku (11): Farming_Build_before_humans_rest.js, Humans_before_camp_spot.js, bear, busts, combat_polish +3; identycznych z obecnymi: 78 (2.57 MB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-10-07/ | 78 | 3.02 MB | git: 78 nieśledz.; w środku (2): osada, popiersia; identycznych z obecnymi: 22 (0.46 MB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-10-08/ | 84 | 3.99 MB | git: 84 nieśledz.; w środku (4): cienie, pochodnia, ui_czysty, ui_grafit; identycznych z obecnymi: 1 (8.9 KB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-10-12/ | 55 | 1.57 MB | git: 55 nieśledz.; w środku (4): ekran_tytulowy, klimat, prolog, wnetrza; identycznych z obecnymi: 44 (0.98 MB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-10-14/ | 58 | 6.16 MB | git: 58 nieśledz.; w środku (3): prolog, przystan, walka; identycznych z obecnymi: 5 (0.56 MB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-10-15/ | 61 | 8.40 MB | git: 61 nieśledz.; w środku (2): czerwona_woda, strata_pola; identycznych z obecnymi: 3 (0.13 MB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-10-16/ | 103 | 4.63 MB | git: 103 nieśledz.; w środku (1): miejsca_wyspy; identycznych z obecnymi: 31 (0.69 MB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-10-17/ | 101 | 6.37 MB | git: 101 nieśledz.; w środku (10): kruk_zwiad, naprawy_testow, poprawki, w10, w4 +3; identycznych z obecnymi: 5 (0.15 MB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| backup_art_2026-10-18/ | 27 | 2.41 MB | git: 27 nieśledz.; w środku (2): motyle, orzel; identycznych z obecnymi: 0 (0.0 KB) | pewne (gra ich nie czyta) | zarchiwizować (ZIP poza projektem) |
| RAZEM | 2211 | 236.79 MB |  |  |  |

### 5c. tools/ - staging, pliki tymczasowe i wyniki pośrednie

tools/ razem: 6658 plików, 415.49 MB. Gra nie czyta niczego z tools/. Staging = mapy/grafiki przygotowane do instalacji (po instalacji są kopią tego, co już jest w data/ i img/).

| Folder | Pliki | Rozmiar | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| tools/tavern/staging/ | 184 | 152.71 MB | staging; git: 52 śledz., 132 ignor. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/tavern/v2/out/ | 120 | 35.17 MB | wyniki pośrednie; git: 120 ignor. | pewne (gra ich nie czyta) | usunąć |
| tools/underground/staging/ | 121 | 25.65 MB | staging; git: 85 śledz., 36 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/ekran_tytulowy/zrzuty/ | 17 | 16.57 MB | wyniki pośrednie; git: 17 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/creatures/preview/ | 106 | 15.85 MB | wyniki pośrednie; git: 106 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/ui_pomysly2/zrzuty/ | 19 | 14.17 MB | wyniki pośrednie; git: 19 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/town/staging/ | 46 | 8.17 MB | staging; git: 14 śledz., 32 ignor. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/creatures/frames/ | 1759 | 7.54 MB | wyniki pośrednie; git: 1759 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/urwisko/staging/ | 15 | 5.43 MB | staging; git: 15 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/ui_pomysly/zrzuty/ | 9 | 4.98 MB | wyniki pośrednie; git: 9 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/wnetrza/staging/ | 63 | 4.78 MB | staging; git: 63 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/humans/preview/ | 35 | 3.84 MB | wyniki pośrednie; git: 35 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/humans/frames/ | 1157 | 3.02 MB | wyniki pośrednie; git: 1157 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/bear/frames/ | 593 | 2.85 MB | wyniki pośrednie; git: 593 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/prolog/zrzuty/ | 3 | 2.57 MB | wyniki pośrednie; git: 3 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/latarnia/staging/ | 6 | 2.14 MB | staging; git: 6 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/pustelnia/staging/ | 4 | 2.10 MB | staging; git: 4 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/bear/preview/ | 6 | 1.46 MB | wyniki pośrednie; git: 6 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/house/staging/ | 14 | 1.42 MB | staging; git: 14 śledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/cysterna/out/ | 5 | 1.08 MB | wyniki pośrednie; git: 5 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/tavern/v2/overlay/ | 5 | 0.94 MB | wyniki pośrednie; git: 5 ignor. | pewne (gra ich nie czyta) | usunąć |
| tools/tavern/v2/staging/ | 4 | 0.65 MB | staging; git: 4 śledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/mountains/staging/ | 3 | 0.62 MB | staging; git: 3 śledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/tavern/props_upper/out/ | 9 | 0.54 MB | wyniki pośrednie; git: 9 śledz. | pewne (gra ich nie czyta) | decyzja |
| tools/osada/staging/ | 15 | 0.52 MB | staging; git: 15 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/orzel/staging/ | 6 | 0.50 MB | staging; git: 6 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/domy/staging/ | 13 | 0.44 MB | staging; git: 13 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/miejsca_wyspy/staging/ | 16 | 0.27 MB | staging; git: 16 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/przystan/art/raw/ | 13 | 0.27 MB | wyniki pośrednie; git: 13 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/latarnia/art/raw/ | 10 | 0.23 MB | wyniki pośrednie; git: 10 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/anim8/preview/ | 2 | 0.19 MB | wyniki pośrednie; git: 2 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/podgrodzie/staging/ | 14 | 0.17 MB | staging; git: 14 śledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/interiors/staging/ | 18 | 0.17 MB | staging; git: 18 śledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/anim8/frames/ | 90 | 0.16 MB | wyniki pośrednie; git: 90 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/miejsca_wyspy/staging_D/ | 3 | 0.15 MB | staging; git: 3 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/przystan/staging/ | 8 | 0.15 MB | staging; git: 8 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/newstart/staging/ | 2 | 0.13 MB | staging; git: 2 śledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/interiors/props/out/ | 1 | 0.13 MB | wyniki pośrednie; git: 1 śledz. | pewne (gra ich nie czyta) | decyzja |
| tools/miejsca_wyspy/staging_A/ | 2 | 0.11 MB | staging; git: 2 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/miejsca_wyspy/staging_B/ | 2 | 0.11 MB | staging; git: 2 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/miejsca_wyspy/staging_C/ | 4 | 0.11 MB | staging; git: 4 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/w7/staging/ | 8 | 0.11 MB | staging; git: 8 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/wrak/art/raw/ | 3 | 0.09 MB | wyniki pośrednie; git: 3 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/miejsca_wyspy/staging_E/ | 5 | 0.09 MB | staging; git: 5 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/orzel/raw/ | 9 | 0.08 MB | wyniki pośrednie; git: 9 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/w5/staging/ | 5 | 0.07 MB | staging; git: 5 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/kruk/art/raw/ | 46 | 0.06 MB | wyniki pośrednie; git: 46 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/creatures/rot_rejected/ | 8 | 0.06 MB | wyniki pośrednie; git: 8 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/osada/props/out/ | 1 | 0.06 MB | wyniki pośrednie; git: 1 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/miejsca_wyspy/staging_F/ | 2 | 0.04 MB | staging; git: 2 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/quest_places/staging/ | 4 | 0.04 MB | staging; git: 4 śledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/house/props/out/ | 1 | 0.03 MB | wyniki pośrednie; git: 1 śledz. | pewne (gra ich nie czyta) | decyzja |
| tools/garnizon/art/raw/ | 3 | 0.03 MB | wyniki pośrednie; git: 3 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/przystan/art/czerwona/raw/ | 8 | 0.02 MB | wyniki pośrednie; git: 8 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/pustelnia/art/raw/ | 1 | 0.01 MB | wyniki pośrednie; git: 1 nieśledz. | pewne (gra ich nie czyta) | decyzja |
| tools/garnizon/staging/ | 2 | 0.01 MB | staging; git: 2 nieśledz. | pewne (gra ich nie czyta) | zarchiwizować |
| tools/house/decor/out/ | 0 | 0.0 KB | wyniki pośrednie; git: - | pewne (gra ich nie czyta) | decyzja |

Największe podfoldery tools/:

| Folder | Pliki | Rozmiar | Git |
|---|---|---|---|
| tools/tavern/ | 446 | 192.49 MB | 166 śledz., 280 ignor. |
| tools/orzel/ | 697 | 59.05 MB | 696 nieśledz., 1 ignor. |
| tools/underground/ | 158 | 26.13 MB | 110 śledz., 36 nieśledz., 12 ignor. |
| tools/creatures/ | 2000 | 23.93 MB | 127 śledz., 1873 nieśledz. |
| tools/ekran_tytulowy/ | 38 | 17.95 MB | 6 śledz., 31 nieśledz., 1 ignor. |
| tools/ui_pomysly/ | 61 | 15.57 MB | 8 śledz., 51 nieśledz., 2 ignor. |
| tools/town/ | 132 | 14.49 MB | 66 śledz., 66 ignor. |
| tools/ui_pomysly2/ | 41 | 14.43 MB | 17 śledz., 21 nieśledz., 3 ignor. |
| tools/tiles/ | 162 | 9.57 MB | 107 śledz., 55 ignor. |
| tools/humans/ | 1249 | 6.99 MB | 47 śledz., 1202 nieśledz. |
| tools/urwisko/ | 18 | 5.45 MB | 3 śledz., 15 nieśledz. |
| tools/wnetrza/ | 93 | 5.17 MB | 6 śledz., 83 nieśledz., 4 ignor. |
| tools/bear/ | 610 | 4.37 MB | 11 śledz., 599 nieśledz. |
| tools/prolog/ | 74 | 4.34 MB | 6 śledz., 67 nieśledz., 1 ignor. |
| tools/latarnia/ | 22 | 2.40 MB | 5 śledz., 17 nieśledz. |

### 5d. tests/ - zrzuty ekranu i wyniki

| Rodzaj | Pliki | Rozmiar | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|---|
| zrzuty ekranu (tests/) | 99 | 136.96 MB | git: ignorowany 99 | pewne | usunąć (każdy test je odtwarza) |
| wyniki/logi testów | 1263 | 5.52 MB | git: ignorowany 1263 | pewne | usunąć (każdy test je odtwarza) |
| zrzuty ekranu (tests/autopilot/) | 1 | 0.04 MB | git: ignorowany 1 | pewne | usunąć (każdy test je odtwarza) |
| zrzuty ekranu (tests/bough/) | 3 | 5.00 MB | git: ignorowany 3 | pewne | usunąć (każdy test je odtwarza) |
| zrzuty ekranu (tests/hunt/) | 3 | 5.36 MB | git: ignorowany 3 | pewne | usunąć (każdy test je odtwarza) |
| zrzuty ekranu (tests/life/) | 1 | 1.72 MB | git: ignorowany 1 | pewne | usunąć (każdy test je odtwarza) |
| zrzuty ekranu (tests/marathon/) | 1 | 0.34 MB | git: ignorowany 1 | pewne | usunąć (każdy test je odtwarza) |
| zrzuty ekranu (tests/needs/) | 4 | 6.15 MB | git: ignorowany 4 | pewne | usunąć (każdy test je odtwarza) |
| zrzuty ekranu (tests/orzel/) | 21 | 32.26 MB | git: ignorowany 21 | pewne | usunąć (każdy test je odtwarza) |
| zrzuty ekranu (tests/swing/) | 23 | 4.69 MB | git: ignorowany 23 | pewne | usunąć (każdy test je odtwarza) |
| zrzuty ekranu (tests/tent/) | 6 | 6.14 MB | git: ignorowany 6 | pewne | usunąć (każdy test je odtwarza) |
| zrzuty ekranu (tests/wb/) | 5 | 8.41 MB | git: ignorowany 5 | pewne | usunąć (każdy test je odtwarza) |
| tests/carcass_test.jscarcass_rabbit.png | 1 | 1.28 MB | dziwna nazwa (sklejona ścieżka testu i zrzutu) | pewne | usunąć |
| tests/wolves_test.jswolves_ring.png | 1 | 0.59 MB | dziwna nazwa (sklejona ścieżka testu i zrzutu) | pewne | usunąć |

### 5e. Pliki tymczasowe, puste, cache

| Plik | Rozmiar | Dowód | Pewność | Rekomendacja |
|---|---|---|---|---|
| tests/run_fruit.log | 0.0 KB | pusty plik (0 B); git: ignorowany | pewne | usunąć |
| tests/run_lie.log | 0.0 KB | pusty plik (0 B); git: ignorowany | pewne | usunąć |
| __pycache__ (37 folderów) | 2.50 MB | 130 plików .pyc; tools/__pycache__, tools/art/__pycache__, tools/busts/__pycache__ +34 | pewne | usunąć |

### 5f. Duplikaty (pliki identyczne bajt w bajt)

Zestawienie wg miejsc (grupa = te same bajty w kilku miejscach; „nadmiar” = rozmiar wszystkich kopii poza jedną):

| Gdzie leżą kopie | Grup | Nadmiar |
|---|---|---|
| docs/tawerna_nowa + tools/tavern | 20 | 38.93 MB |
| backup_art_* | 156 | 10.95 MB |
| backup_art_* + tools/tiles | 157 | 9.78 MB |
| img/characters + img/tilesets | 27 | 5.46 MB |
| backup_art_* + js | 33 | 4.60 MB |
| img/characters + img/tilesets + tools/tavern | 15 | 4.27 MB |
| backup_art_* + tests | 53 | 4.19 MB |
| img/characters + img/tilesets + tools/town | 7 | 4.05 MB |
| backup_art_* + tools/tavern | 46 | 3.53 MB |
| backup_art_* + tools/house | 48 | 2.41 MB |
| tools/town | 6 | 2.03 MB |
| backup_art_* + data | 23 | 1.76 MB |
| fonts + tools/ui_pomysly | 5 | 1.63 MB |
| img/characters + tools/town | 1 | 1.58 MB |
| img/tilesets | 10 | 1.57 MB |
| backup_art_* + data + tools/underground | 20 | 1.43 MB |
| backup_art_* + data + tools/mountains | 2 | 1.36 MB |
| backup_art_* + tests/tent | 1 | 1.18 MB |
| tests | 130 | 1.16 MB |
| backup_art_* + img/characters | 14 | 0.87 MB |
| tools/creatures | 61 | 0.73 MB |
| img/characters | 15 | 0.61 MB |
| data + tools/miejsca_wyspy | 11 | 0.59 MB |
| backup_art_* + tools/underground | 5 | 0.52 MB |
| tools/orzel | 35 | 0.52 MB |
| data + tools/wnetrza | 19 | 0.51 MB |
| img/characters + tools/tavern | 4 | 0.49 MB |
| data + tools/mountains + tools/osada | 1 | 0.48 MB |
| data + tools/tavern | 1 | 0.46 MB |
| backup_art_* + tools/miejsca_wyspy | 14 | 0.42 MB |

Duplikaty WEWNĄTRZ plików gry (img/, audio/, data/, js/; bez paczek Winlu z 3d, które powielają img/characters) - pliki o różnych nazwach, ale tych samych bajtach:

| Pliki | Rozmiar 1 kopii | Kopii |
|---|---|---|
| img/characters/anim8/Cr_Queen_Run8.png, img/characters/anim8/Cr_Queen_Walk8.png | 0.25 MB | 2 |
| img/characters/$Cr_Queen.png, img/characters/$Cr_Queen_Run.png | 0.05 MB | 2 |
| img/characters/$Cr_Face_Kowal.png, img/characters/$Npc_Kowal.png | 0.02 MB | 2 |
| img/characters/$Cr_Face_Melia.png, img/characters/$Npc_Melia.png | 0.02 MB | 2 |
| img/characters/$Cr_Face_Dziadek.png, img/characters/$Npc_Dziadek.png | 0.02 MB | 2 |
| img/characters/$Cr_Face_Piekarka.png, img/characters/$Npc_Piekarka.png | 0.02 MB | 2 |
| img/characters/$Cr_Face_Wanda.png, img/characters/$Npc_Wanda.png | 0.02 MB | 2 |
| img/characters/$Cr_Face_Soltys.png, img/characters/$Npc_Soltys.png | 0.02 MB | 2 |
| img/characters/$Cr_Face_Borgar.png, img/characters/$Npc_Borgar.png | 0.02 MB | 2 |
| img/characters/$Human_Dwor_Atk.png, img/characters/$Human_Dwor_Crouch.png, img/characters/$Human_Dwor_Guard.png, img/characters/$Human_Dwor_Kneel.png | 0.01 MB | 4 |
| img/characters/$Human_Merc_Atk.png, img/characters/$Human_Merc_Crouch.png, img/characters/$Human_Merc_Guard.png, img/characters/$Human_Merc_Kneel.png | 0.01 MB | 4 |
| img/characters/$Human_Captain_Atk.png, img/characters/$Human_Captain_Crouch.png, img/characters/$Human_Captain_Guard.png, img/characters/$Human_Captain_Kneel.png | 0.01 MB | 4 |
| img/characters/$Human_Archer_Atk.png, img/characters/$Human_Archer_Crouch.png, img/characters/$Human_Archer_Kneel.png | 0.01 MB | 3 |
| img/characters/$Human_Bandit_Atk.png, img/characters/$Human_Bandit_Crouch.png, img/characters/$Human_Bandit_Kneel.png | 0.01 MB | 3 |
| img/characters/$Human_Knife_Atk.png, img/characters/$Human_Knife_Crouch.png, img/characters/$Human_Knife_Kneel.png | 8.8 KB | 3 |

Największe grupy duplikatów (wszystkie miejsca):

| Pliki | Rozmiar 1 kopii | Kopii | Nadmiar |
|---|---|---|---|
| docs/tawerna_nowa/pietro1_final.png, tools/tavern/staging/renders/f25_full.png | 10.81 MB | 2 | 10.81 MB |
| docs/tawerna_nowa/pietro2_final.png, tools/tavern/staging/renders/f26_full.png | 7.83 MB | 2 | 7.83 MB |
| docs/tawerna_nowa/koncepcja_C.png, tools/tavern/staging/renders/C_lit.png | 2.90 MB | 2 | 2.90 MB |
| docs/tawerna_nowa/koncepcja_B.png, tools/tavern/staging/renders/B_lit.png | 2.70 MB | 2 | 2.70 MB |
| docs/tawerna_nowa/koncepcja_A.png, tools/tavern/staging/renders/A_lit.png | 2.67 MB | 2 | 2.67 MB |
| docs/tawerna_nowa/pietro.png, tools/tavern/staging/renders/P_lit.png | 2.20 MB | 2 | 2.20 MB |
| img/characters/!Town_Props.png, tools/town/staging/characters/!Town_Props.png, tools/town/staging/overlay_A/img/characters/!Town_Props.png +3 | 0.32 MB | 6 | 1.58 MB |
| backup_art_2026-09-28/pre_refactor/js/libs/pixi.js, js/libs/pixi.js | 1.48 MB | 2 | 1.48 MB |
| img/characters/!$Big_Trees_green.png, img/tilesets/Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/characters/!$Big_Trees_green.png, tools/town/staging/overlay_A/img/characters/!$Big_Trees_green.png +3 | 0.27 MB | 6 | 1.35 MB |
| backup_art_2026-09-28/pre_refactor/tools/tiles/soft/work/piasek/preview_1x.png, tools/tiles/soft/work/piasek/preview_1x.png | 1.31 MB | 2 | 1.31 MB |
| backup_art_2026-09-28/pre_refactor/tools/tiles/soft/work/bloto/preview_1x.png, tools/tiles/soft/work/bloto/preview_1x.png | 1.29 MB | 2 | 1.29 MB |
| backup_art_2026-09-28/pre_refactor/tests/carcass_test.jscarcass_rabbit.png, tests/carcass_test.jscarcass_rabbit.png | 1.28 MB | 2 | 1.28 MB |
| backup_art_2026-09-28/pre_refactor/tests/tree_strike_stump.png, tests/tree_strike_stump.png | 1.25 MB | 2 | 1.25 MB |
| backup_art_2026-10-06/mountains/Map013_before_145107.json, backup_art_2026-10-06/mountains/Map013_before_150046.json, data/Map013.json +1 | 0.41 MB | 4 | 1.23 MB |
| backup_art_2026-09-28/pre_refactor/tools/house/staging/_light/off_20.5.png, backup_art_2026-09-28/pre_refactor/tools/house/staging/_light/off_22.5.png, tools/house/staging/_light/off_20.5.png +1 | 0.40 MB | 4 | 1.19 MB |
| backup_art_2026-09-28/pre_refactor/tests/tent/morning_message.png, tests/tent/morning_message.png | 1.18 MB | 2 | 1.18 MB |
| backup_art_2026-09-28/pre_refactor/tools/tiles/soft/work/piasek_pixellab/preview_1x.png, tools/tiles/soft/work/piasek_pixellab/preview_1x.png | 1.16 MB | 2 | 1.16 MB |
| backup_art_2026-09-28/pre_refactor/js/libs/effekseer.wasm, js/libs/effekseer.wasm | 1.15 MB | 2 | 1.15 MB |
| img/characters/!$Smith.png, img/tilesets/Winlu Fantasy Tileset - Exterior/Winlu Fantasy Exterior/characters/!$Smith.png, tools/town/staging/overlay_A/img/characters/!$Smith.png +3 | 0.23 MB | 6 | 1.14 MB |
| img/characters/!Decoration2.png, img/tilesets/Winlu Fantasy Tileset - Dungeon/characters/!Decoration2.png, img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/characters/!Decoration2.png +1 | 0.35 MB | 4 | 1.06 MB |
| backup_art_2026-09-28/pre_refactor/tools/tiles/soft/work/sciolka/preview_1x.png, tools/tiles/soft/work/sciolka/preview_1x.png | 1.05 MB | 2 | 1.05 MB |
| backup_art_2026-09-28/pre_refactor/tools/tiles/soft/work/sucha_trawa_pixellab/preview_1x.png, tools/tiles/soft/work/sucha_trawa_pixellab/preview_1x.png | 0.98 MB | 2 | 0.98 MB |
| backup_art_2026-09-28/pre_refactor/tools/tiles/soft/work/sucha_trawa/preview_1x.png, tools/tiles/soft/work/sucha_trawa/preview_1x.png | 0.97 MB | 2 | 0.97 MB |
| docs/tawerna_nowa/pietro_ekran.png, tools/tavern/staging/renders/P_screen.png | 0.95 MB | 2 | 0.95 MB |
| backup_art_2026-09-28/zoom_notes/Map025.json, tools/tavern/staging/Map025.json, tools/tavern/staging/install_preview/data/Map025.json | 0.46 MB | 3 | 0.92 MB |

### 5g. docs/ - lista (bez oceny, to dokumentacja autora)

docs/ razem: 1573 plików, 1371.33 MB.

| Pozycja | Pliki | Rozmiar | Git |
|---|---|---|---|
| docs/miasteczko/ | 71 | 120.04 MB | 1 śledz., 70 nieśledz. |
| docs/walka/ | 83 | 115.39 MB | 83 nieśledz. |
| docs/tawerna_nowa/ | 88 | 96.66 MB | 88 nieśledz. |
| docs/miejsca_wyspy/ | 69 | 69.93 MB | 3 śledz., 66 nieśledz. |
| docs/cienie/ | 73 | 63.13 MB | 73 nieśledz. |
| docs/postacie/ | 164 | 61.52 MB | 164 nieśledz. |
| docs/ui_grafit/ | 76 | 59.99 MB | 76 nieśledz. |
| docs/podziemia/ | 91 | 53.77 MB | 91 nieśledz. |
| docs/podgrodzie/ | 45 | 38.13 MB | 1 śledz., 44 nieśledz. |
| docs/wnetrza_poprawa/ | 103 | 36.89 MB | 103 nieśledz. |
| docs/klimat/ | 24 | 33.30 MB | 24 nieśledz. |
| docs/strata_pola/ | 26 | 33.02 MB | 1 śledz., 25 nieśledz. |
| docs/ui_przed_i_po/ | 17 | 32.22 MB | 8 śledz., 9 nieśledz. |
| docs/nowy_start/ | 22 | 32.16 MB | 22 nieśledz. |
| docs/motyle/ | 20 | 29.85 MB | 20 nieśledz. |
| docs/tawerna_zycie/ | 43 | 29.84 MB | 3 śledz., 40 nieśledz. |
| docs/dom_dziadka/ | 47 | 27.42 MB | 47 nieśledz. |
| docs/ui_czysty/ | 21 | 27.02 MB | 21 nieśledz. |
| docs/pochodnia/ | 15 | 26.34 MB | 15 nieśledz. |
| docs/prolog/ | 30 | 26.30 MB | 1 śledz., 29 nieśledz. |
| docs/ui_pomysly2/ | 40 | 26.30 MB | 1 śledz., 39 nieśledz. |
| docs/gory/ | 21 | 25.74 MB | 21 nieśledz. |
| docs/kafelki/ | 18 | 22.05 MB | 18 nieśledz. |
| docs/popiersia/ | 18 | 21.52 MB | 18 nieśledz. |
| docs/posiadlosc_lorda/ | 22 | 20.75 MB | 22 nieśledz. |
| docs/przystan/ | 22 | 19.77 MB | 1 śledz., 21 nieśledz. |
| docs/niebo/ | 12 | 19.55 MB | 12 nieśledz. |
| docs/orzel/ | 25 | 14.18 MB | 25 nieśledz. |
| docs/ekran_tytulowy/ | 18 | 12.46 MB | 1 śledz., 17 nieśledz. |
| docs/ui_pomysly/ | 12 | 11.56 MB | 1 śledz., 11 nieśledz. |
| docs/postac/ | 26 | 11.53 MB | 26 nieśledz. |
| docs/rosliny_przejscie.gif | 1 | 10.45 MB | nieśledzony |
| docs/osada/ | 19 | 10.41 MB | 1 śledz., 18 nieśledz. |
| docs/poprawki/ | 11 | 10.36 MB | 11 nieśledz. |
| docs/architektura/ | 18 | 9.82 MB | 18 nieśledz. |
| docs/budynki_proba/ | 15 | 8.67 MB | 15 nieśledz. |
| docs/w6/ | 7 | 8.50 MB | 7 nieśledz. |
| docs/wnetrza/ | 19 | 8.11 MB | 19 nieśledz. |
| docs/w9_rywal/ | 11 | 8.10 MB | 11 nieśledz. |
| docs/miejsca_zadan/ | 8 | 8.06 MB | 8 nieśledz. |
| docs/akt3/ | 5 | 7.82 MB | 5 nieśledz. |
| docs/zwierzeta_ludzie/ | 5 | 7.73 MB | 5 nieśledz. |
| docs/w7/ | 5 | 5.09 MB | 5 nieśledz. |
| docs/tawerna_zmiana/ | 14 | 4.46 MB | 14 nieśledz. |
| docs/w5/ | 7 | 4.44 MB | 7 nieśledz. |
| docs/w4/ | 4 | 4.22 MB | 4 nieśledz. |
| docs/dwor/ | 5 | 4.20 MB | 5 nieśledz. |
| docs/rosliny_wiatr.gif | 1 | 4.01 MB | nieśledzony |
| docs/laka_podglad.png | 1 | 3.66 MB | nieśledzony |
| docs/laka2_podglad.png | 1 | 3.62 MB | nieśledzony |
| docs/laka3_podglad.png | 1 | 3.56 MB | nieśledzony |
| docs/rosliny_spokojnie.gif | 1 | 3.27 MB | nieśledzony |
| docs/budynki_styl/ | 4 | 2.77 MB | 4 nieśledz. |
| docs/zwierzeta8/ | 23 | 2.28 MB | 23 nieśledz. |
| docs/hud_przezroczysty.png | 1 | 1.86 MB | nieśledzony |
| docs/FABULA_I_PRZEJSCIE.pdf | 1 | 1.78 MB | nieśledzony |
| docs/grzyby_w_grze.png | 1 | 1.66 MB | nieśledzony |
| docs/zbieractwo_w_grze.png | 1 | 1.63 MB | nieśledzony |
| docs/kaluze_podglad.png | 1 | 0.64 MB | nieśledzony |
| docs/f9_zakladki.png | 1 | 0.56 MB | nieśledzony |
| docs/f9_kot.png | 1 | 0.29 MB | nieśledzony |
| docs/porzadek/ | 1 | 0.18 MB | 1 nieśledz. |
| docs/QUESTY.md | 1 | 0.12 MB | śledzony |
| docs/ARCHITEKTURA.md | 1 | 0.10 MB | śledzony |
| docs/QUESTY_STAN.md | 1 | 0.08 MB | śledzony |
| docs/zbieractwo_nowe.png | 1 | 0.06 MB | nieśledzony |
| docs/WALKA.md | 1 | 0.06 MB | śledzony |
| docs/grzyby_pixellab.png | 1 | 0.05 MB | nieśledzony |
| docs/PODZIEMIA.md | 1 | 0.04 MB | śledzony |
| docs/zbieractwo_teraz.png | 1 | 0.04 MB | nieśledzony |
| docs/STORY.md | 1 | 0.04 MB | śledzony |
| docs/miasta_miejsca_zadan.md | 1 | 0.04 MB | śledzony |
| docs/FABULA_I_PRZEJSCIE.md | 1 | 0.04 MB | nieśledzony |
| docs/grzyby_styl_winlu.png | 1 | 0.02 MB | nieśledzony |
| docs/grzyby_skos.png | 1 | 0.02 MB | nieśledzony |
| docs/grzyby_porownanie.png | 1 | 0.02 MB | nieśledzony |
| docs/galaz_proba.png | 1 | 0.02 MB | nieśledzony |
| docs/TESTY.md | 1 | 0.01 MB | śledzony |
| docs/AKT3.md | 1 | 0.01 MB | śledzony |

### 5h. Git: .gitignore i status

- Śledzonych plików: 3882, nieśledzonych (nie ignorowanych): 8840, ignorowanych: 1989.
- `.gitignore` już pomija: `/save/`, zrzuty i logi testów (`/tests/*.png`, `/tests/*/*.png`, `out_*.txt`, `*.log`, `edge_profile_*`), `__pycache__`, rendery tools/tavern i tools/town, `tools/town/winlu_samples/`, `tools/town/refs/`.
- **Nie** pomija: `backup_art_*/`, zrzutów `*.png` w katalogu głównym, `tools/*/staging*/`, `tools/*/out/`, `tools/*/raw/`, `tools/*/frames/`, `tools/*/preview/` - dlatego wiszą w `git status` jako nieśledzone.
- Nieśledzone wg miejsca (top 20): tools/creatures (1873), tools/humans (1202), backup_art_2026-09-28 (841), tools/orzel (696), tools/bear (599), backup_art_2026-10-06 (230), backup_art_2026-10-05 (199), docs/postacie (164), docs/wnetrza_poprawa (103), backup_art_2026-10-16 (103), backup_art_2026-10-17 (101), tools/anim8 (92), docs/podziemia (91), docs/tawerna_nowa (88), backup_art_2026-10-08 (84), backup_art_2026-09-26 (84), tools/wnetrza (83), docs/walka (83), backup_art_2026-10-07 (78), docs/ui_grafit (76).

## 6. Baza danych (data/*.json) - tylko puste i domyślne wpisy RTP

| Plik | Rozmiar | Wpisów | Puste nazwy (id) | Domyślne RTP (id) | Uwagi |
|---|---|---|---|---|---|
| Items.json | 0.07 MB | 184 | 2-5, 16, 20-21, 31-49, 51-58 | - | - |
| Weapons.json | 0.01 MB | 50 | 6, 12, 18, 24, 30, 36, 42, 48-50 | - | - |
| Armors.json | 0.02 MB | 100 | 7, 14, 19, 25, 32, 38, 44, 51, 58, 64, 71, 87, 90, 93 | - | - |
| Skills.json | 0.10 MB | 235 | 4-10, 42-50, 55, 59, 63, 66-70, 77-80, 93-98, 102, 106, 110, 114, 118, 122, 125, 128, 131, 134, 137, 140, 143, 146, 149, 152, 155, 158-170, 179-184, 194, 204, 212-214, 220-224, 230-235 | - | - |
| States.json | 0.01 MB | 30 | 11, 14, 28 | - | - |
| Animations.json | 0.07 MB | 120 | - | - | - |
| Enemies.json | 2.1 KB | 4 | - | 1: 1 | Goblin |
| Troops.json | 1.8 KB | 5 | - | 1: 1 | Goblin*2 |
| Classes.json | 0.03 MB | 8 | - | - | - |
| Actors.json | 3.3 KB | 12 | - | - | - |
| Tilesets.json | 0.41 MB | 15 | 7, 13-15 | - | nieużywane przez żadną mapę: 1 Świat, 3 Wewnątrz, 4 Loch, 5 SF Zewnątrz, 6 SF Wewnątrz, 7 , 13 , 14 , 15 ; tylko na mapach-kandydatach do usunięcia: 2 Zewnątrz (mapy [5, 6, 7, 12, 15]) |
| CommonEvents.json | 1.1 KB | 6 | 1-4 | - | puste (bez poleceń, bez nazwy): 1-4; z wyzwalaczem „brak” i nigdzie nie wołane (117, efekt przedmiotu, parametr wtyczki): brak |

Rekomendacja dla bazy: **decyzja**. Wpisy RTP w bazie wrogów/oddziałów/animacji/umiejętności nic nie kosztują w grze; usunięcie ich pozwoli potem usunąć grafiki/dźwięki z sekcji 3c/4c, które są „możliwe” tylko z ich powodu. Puste wpisy to wolne numery - zostawić.

## Zastrzeżenia

- Nazwy składane: skrypt zbiera z kodu literały stojące przed `+`/po `+`, stałe kończące się na `_` lub `/` (np. `"Swing_"`, `"anim8/"`) i początki/końce szablonów. Plik z pasującym prefiksem trafia do „składane (potw.)”, jeśli reszta nazwy występuje w kodzie, inaczej do „możliwe”.
- Wzmianka w komentarzu nie jest użyciem, ale oznaczam ją jako „możliwe” - czasem to opis starego pliku, czasem nazwa budowana gdzie indziej.
- Testy (`tests/`) i narzędzia (`tools/`) nie liczą się jako użycie, ale są wypisane, bo usunięcie pliku może zepsuć test albo generator.
- Inne sesje Claude pracują teraz w projekcie (np. orzeł: Orzel*.js, Map175, nowe grafiki Orzel*/Motyle*) - takie nieśledzone, świeże pliki traktuj jako „w toku”, nawet jeśli raport ich nie widzi w kodzie.
- Edytor RPG Makera przy wdrożeniu („Wyklucz nieużywane pliki”) patrzy tylko na bazę danych i mapy, nie na wtyczki - nie używaj tej opcji, bo wytnie grafiki ładowane przez wtyczki.
