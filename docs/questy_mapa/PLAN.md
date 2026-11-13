# Questy a obecna plansza 3x3 - plan dostosowania (2026-11-11)

Tylko plan (nic w grze nie zmieniono). Dane dla wykonawcy: `plan.json`. Skrypty i zrzuty robocze: `tmp/` (BFS po przejściach `bfs_run.js`, zrzuty przejezdności `mapdump_*.json`, szukanie wolnych pól `free.js`).

## 1. Co sprawdzono i jak
- 122 zadania (K/D/W). Przejście sprawdziłem **na żywo w grze** (BFS po przejściach z 9 map planszy, razem z wstrzykiwanymi zdarzeniami), w kodzie wtyczek (Wyspa, Wrak, Cysterna, Kruk, Pustelnia, Orzel, Garnizon, Homes, Zakon, Ludzie, Kantor) i w danych (SPOTS, kroki, tabele paczek A-D).
- Wynik: **30 zadań wymaga zmiany, 92 jest w porządku.** Z 34 zadań z heurystyki 6 to fałszywe alarmy (D20, D25, D26, D28, W12, K70); heurystyka pominęła W8 (rozdz. 5, Osada) i D38 (gaj).
- Prawdziwe zależności siedzą w tabelach danych (Zakon_Data TOWERS/SHRINES/CAIRNS/RING/GROVE, Ludzie_Data CYCLE/ZBYCH_ALT, Zasoby_Data źródełka/GLADE/ORCHARD, Lowy_Data obozy, Kantor_Data TIME/RAID) i w stałych kodu (`TownQuests.js:89 ROAD = 22`, `Homes.js`), nie w tekstach.

## 2. Co NAPRAWDĘ jest osiągalne (sprawdzone)
| Miejsce | Stan | Dowód |
|---|---|---|
| Wrak 165/166 | **osiągalny** łodzią Janka z Przystani (Wrak.js `boatOk`). Łachy od garnizonu NIE ma (Wyspa_Data: 162<->165 wycięte; w Map162 brak zdarzenia „bar”) | żywa gra: `Wyspa.readyMaps()` = [125,155,157,162,165,167] |
| Stara cysterna 167 | **osiągalna** z podziemi (piętro 30, Zasuwa główna po W1 rozdz. 7). Krata kruka z cysterny prowadzi do **Map157** - furtka do parkowanej kieszeni 155/156/157 | Cysterna.js `grate()` (l. 397-399) |
| Wyspy 920/922/951 | osiągalne łodziami (Przystań (13,9), Garnizon (5,28)); 917/918/914/923 nie | Wyspy.js |
| Jaskinia przemytników 177, latarnia 160/161 | osiągalne z Przystani | Ludzie.js, Latarnia_Data MAP=125 |
| 155, 156, 157 | nieosiągalne pieszo, tylko przez kratę z cysterny; mapy prawdziwe i całe | BFS |
| 175 Orla Grań | nieosiągalna (Orzel_Data `WAY_UP.cells = []`). **Plik mapy nowszy niż dane**: `WAY_UP.land (20,57)` i `WAY_DOWN (19-21,59)` leżą dziś w ścianie; znacznik `orzel_wejscie` = (20,27) | zrzut przejezdności |
| 120-124, 168/169, 18/176, 22, 21, 23, 17 | nieosiągalne | BFS |
| „Wrak” w D20/K51 | to **kuter na plaży Przystani**, nie wrak 165 (stąd fałszywe alarmy) | SPOTS.przystan_wrak (125, 18,35) |

## 3. Decyzje dla każdego zaparkowanego miejsca (jedna opcja + powód)
**K** = zostaje, **M** = mała wersja na planszy (dane/markery, bez nowych map), **P** = „kieszeń”: zaparkowana mapa wraca jak pomieszczenie (jak jaskinia 14) przez jedną bramę z mapy planszy; jej krawędzie na parkowane sąsiadki zamykamy. P nie zmienia 3x3 ani szwów.

| Miejsce | Decyzja | Powód |
|---|---|---|
| Wrak 165/166 | **K** + poprawka tekstów (bez „łachy od garnizonu”) | działa; D25, W12, K70 bez zmian |
| Cysterna 167 | **K**; krata prowadzi do kieszeni 157 | D28 bez zmian, K53 działa po P dla 157 |
| Pustelnia 155 + Skryptorium 156 + Urwisko 157 | **P**: brama „Ścieżka na klif” na Przystani **(88,95)** (przy Słupie strażnicy zakonu (87,100), u stóp wzgórza latarni). 155 ma zdarzenia 66-68 (południowa krawędź (21-23,71)) -> przekierować na Przystań (88,95); 157 ma wyjście na Góry (1,63) - zamknąć | Kleofas = dawca 5 zadań + finał W2 + kruk (D24, K51, K53); odbudowa na planszy najdroższa, mapy gotowe |
| Orla Grań 175 | **P przez nową kopalnię** (decyzja użytkownika), pkt 4 | jajo orła = towarzysz; półki orła na Map013 zostają tylko z powietrza |
| Osada Milczących 120-124 + gaj | **P**: brama na Górach, istniejące zdarzenie „Brama Milczących” **(6,27)** (obok Kopczyk (4,34), Słup (8,34)) -> Map120 (21,32) | W8 rozdz. 5, D38, karta 3 (Map123) bez zmian w danych; 120 ma 3 krawędzie na parkowane (22, 934, 159): zdarzenia 146-154 -> Góry (6,29), 155-165 usunąć |
| Spalona zagroda 168 + Dom Ługów 169 | **P**: drogowskaz + ścieżka na Podgrodziu, północno-wschodni róg **~(110,20)** (do dopasowania) | Homes.js (region 8, 5 etapów) to duży kawał; bramy 168 na 900/912 usunąć; Homes wstrzykuje dziś drogowskaz i WAY na Map023 (79,27-29): zmienić `EDGE` na 111 |
| Krąg menhirów 18 + Komora 176 | **M**: krąg na Łące pod Gawrą, środek **(50,78)** (wolne ~11x11 od (45,73)); komora 176 bez zmian (wejście Zakon.js:520, powrót `RING.back` na 4) | cała tabela RING to dane; pastwisko_018 -> Łąka (44,61) |
| Polna droga 22 | **M**: Kruczy Jar (3), droga na północ od działki, przy postoju wozu (75,12) | brama południowa miasta -> Kruczy Jar |
| Skraj lasu 23 | **M**: Kruczy Jar (3), wschodni skraj lasu x 85-100, y 25-60 | j.w.; kurier Baltazara wychodzi bramą południową |
| Leśna droga 21 | **M**: Łąka pod Gawrą (4), kępy drzew na północnym zachodzie | Łąka ma zagrodę pasterza i kępy |
| Omszała łąka 17 | **M**: Kruczy Jar (3), południowy zachód | Jagna, zioła, kręgi grzybów |
| Gaj Milczących | w kieszeni 120 | D38 bez zmian |

## 4. Orla Grań przez kopalnię z wagonikiem (decyzja użytkownika)
Zamiast szybu w Map014 (kopacze W8 zostają nietknięci) - **nowa mapa Map213 „Kopalnia: sztolnia ku szczytowi”** (wolny numer; MapInfos kończy się na 212).

**Wejście z Map013:** w ścianie kamieniołomu jest wnęka (51-55,31). Wejście do sztolni na **(54,31)**, stanie na (54,32) (wolne), tuż obok istniejącego „Porzuconego wózka” (47,34) i wejścia do jaskini (44,31). Zdarzenie w pliku Map013 (przy zamkniętym edytorze): przejście na Map213 przystanek A. Powrót: lądowanie na Map013 (54,32) twarzą w dół.
**Wyjście na szczyt:** schody na przystanku B -> **Map175 (20,28)** twarzą w górę (znacznik `orzel_wejscie` (20,27)). Zejście z 175: komórki **(19,30),(20,30),(21,30)** -> Map213 przystanek B. Zdarzenie schodów to dziś `Orzel.wayUp()`: popup „stromo” pozostaje bramką (Akt II / jajo / D29) **na schodach B**, sama kopalnia i wagonik są otwarte od razu.
**Dane:** Orzel_Data `WAY_UP = { map: 213, cells: [[stairs B]], to: 175, land: [20,28], dir: 8 }`, `WAY_DOWN = { cells: [[19,30],[20,30],[21,30]], to: 213, land: [B], dir: 2 }`; Orzel.js:1831 `T.inject(D.GORY` -> `D.WAY_UP.map`; Orzel_Lot.js:243 (`D.GORY`) bez zmian. Map175: usunąć zdarzenia 144/152/155 (północna krawędź na 931). `MapaWyspy_Data.WNETRZA[175] = [13,"Orla Grań"]`, `WNETRZA[213] = [13,"Kopalnia"]` - lista wnętrz i F9 widzą obie. SwiatData bez zmian (siatka 9 map). **Półki orła na 13 (99,62), (33,97) zostają tylko z powietrza** - na Map013 nie ma żadnych komórek wspinaczki.
**Zadania:** D29, K69, W13 i klatka/kradzież orła są po tej ścieżce w porządku; zmienić tylko słowa: D29 krok 0 „Wejdź na Orlą Grań (Góry, wysoka półka nad kamieniołomem: stare kołki w skale)” -> „…przez sztolnię w kamieniołomie, wagonikiem na szczyt”; to samo w opisach W13/K69.

### 4a. Projekt kopalni (bez implementacji)
- **Mapa:** 96 x 40, tileset **10 „Wilu Fantasy Dungeon”** (jak Map014 i podziemia 130+), `<Dark:on>`, ciemno, światło tylko od latarni (każde światło to ogień, `<Light:...>`), `<Ambience:cave>`, muzyka milknie.
- **Tory:** w zestawie 10 szyn **nie ma** (Fantasy_Dungeon_E sprawdzony: urny, szkielety, trumny, kraty; A5/B/D nie przejrzane w całości - do potwierdzenia). Rekomendacja: własny arkusz kafli „Kopalnia_Tory” (słot B/C, kafle: prosto 2 kierunki, 4 zakręty, rozjazd T, kozioł oporowy), rysowany skryptem w palecie Dungeon (+ opcjonalnie PixelLab `create_tiles_pro`); tory to kafle **bez zdarzeń** (pod postacią).
- **Układ (przekrój korytarza 3 kratki):** przystanek A (wejście z 13) na zachodzie (x~6,y~30) -> główna linia na wschód 40 kratek -> zakręt na północ -> **rozjazd J1** (x~50,y~20): w lewo ślepa odnoga do zawalonego przodka z rudą (loot, kozioł oporowy, wagonik tam sam zawraca), w prawo linia dalej -> zakręt -> **rozjazd J2** (x~70,y~10) tylko pętla zawracająca (dekoracja) -> **przystanek B** (x~88,y~6) ze schodami w górę. Rozjazd przełącza **dźwignia** (akcja O) przy J1; domyślnie ustawiony na B (nie da się zablokować).
- **Wagonik:** jedno zdarzenie `!$Kopalnia_Wagonik` (top-down, 4 kierunki, 3 klatki obrót kół, styl Winlu; można wyrysować w PixelLab `create_object` / `animate_object`), stoi na każdym przystanku (jeden wagonik, jego pozycja z zapisu). Wsiadanie: stań obok, **O** -> menu klawiaturowe „Jedź do A / B / Zostań”. Jazda: bohater schowany (przełączone przezroczystość i followersy), kamera na nim, wagonik jedzie po łamanej z danych (`Kopalnia_Data.js`: lista punktów i rozjazdów) ze stałą prędkością ~4 kratek/s, skręty łagodzone, hamuje 1 s przed przystankiem. Dźwięk: pętla turkotu kół (SE ze zmianą wysokości przy zakrętach), stuk na rozjeździe; ściszenie muzyki jak w jaskiniach. Wysiadka: wolna kratka obok przystanku (najbliższa wolna), kierunek do wyjścia.
- **Nie utknie:** wsiadając zawsze kończy się na przystanku (A/B/ślepa odnoga); **Anuluj** w jeździe = hamuje na następnym przystanku; zapis w trakcie jazdy zapisuje „stoi na przystanku X” (po wczytaniu wysiada); odnoga zawraca sama; wagonik nigdy nie jedzie przez ścianę (ruch po danych, nie po kolizji). Wejście do wagonika zablokowane w walce / z gonionym przez zwierzę (jak Woz.js).
- **Wydajność:** jedno ruchome zdarzenie, ruch = interpolacja po punktach (bez szukania ścieżki), kamera = kamera MZ; kilka latarni; brak pętli po zdarzeniach. Mapa 96x40 mała.
- **Generowanie:** `tools/kopalnia/zbuduj.py` (wzór: `tools/orle_skarpy/zbuduj.py`): z opisu (punkty linii, stacje, rozjazdy) rysuje kafle (ściany Dungeon, podłoga, tory), stawia zdarzenia i znaczniki, produkuje `staging/data/Map213.json`; `--dry-run` (zrzut), `--wykonaj` (kopie zapasowe, wpis w MapInfos, przejście na Map013 i Map175); sprawdza spójność toru (każdy punkt na torze, każde zakończenie = przystanek/kozioł).
- **Test:** `tests/kopalnia_test.js` (kit): wejście z 13, wsiadanie O, przejazd A->B w czasie granicznym, wysiadka na wolnej kratce, schody -> 175 (20,28) -> zejście z powrotem, Anuluj w jeździe, zapis/wczytanie w trakcie, brak błędów w konsoli, średni czas klatki. Dodatkowo `tests/orzel_test.js` (D29).
- **Do wyboru przez użytkownika:** (1) czy jeden wagonik czy dwa (A i B); (2) czy rozjazd z dźwignią i ślepa odnoga z rudą są potrzebne, czy sama linia A-B; (3) cena/limit (bezpłatnie vs opłata jak wóz); (4) czy jazda ma „strach” (szczury z Creatures.js na torach) czy jest bezpieczna; (5) rysunek wagonika: własny skrypt czy PixelLab; (6) czy kopalnia czynna od początku (rekomendacja: tak, schody gated).

## 5. Zadania, które się łamią - nowy dom i zmiany
(Współrzędne: wolne pola z `tmp/free.js`; „przybliżone” = do dopasowania na zrzucie.)

| Zadanie | Co się łamie | Nowy dom | Zmiana |
|---|---|---|---|
| **K3** | `SPOTS.horseshoe` map 22 (20,14) | Kruczy Jar (3) **(74,18)** | TownQuests_Data.js map/x/y; zadania_k.txt (k3) „na Polnej drodze” -> „na drodze za bramą południową” |
| **D5** | kroki kill `map:22` i `map:23` (spawn w kodzie wg `st.map`) | zwiadowcy Map 3; przewodnik Map 4 | TownQuests_Data.js d5Upoluj/d5Upoluj2; 2 teksty |
| **W1** | rozdz. 6c zasadzka `ROAD = 22` (TownQuests.js:89, 2921-2924); rozdz. 7 cysterna OK | Map 3 | **jedna linia kodu** `ROAD = 3`; w1.txt |
| **W5** | rozdz. 2 obóz przemytników na Skraju lasu (Kantor.js:207 `M.skraj`), rozdz. 8 wóz promu na Polnej drodze (`M.droga`, TIME.ferry, RAID.maps [3,21,22,23]) | obóz Map 3 **~(96,42)** 6x5; wóz promu Map 3 **~(88,16)** (przybliżone) | Kantor_Data MAP.skraj/droga=3, PLACES, RAID.maps [3,4]; teksty w5 kroki 2 i 8 |
| **K63** | mielerz Zbycha Map21 (48,17), `ZBYCH_ALT.map` | Map 4 **(46,22)** mielerz 3x3 + szałas | Ludzie_Data: MAP.droga=4, SPOTS_BY_MAP[4], KILN_AMBUSH map 4; teksty |
| **K65** | juk_021; handlarz Szymon Juczny map 22, `CYCLE.stops [22,21,4,3]` | juk Map 4 (przybliżone) (30,20),(36,14),(44,10); stops [4,3]; handlarz.map=4 | Ludzie_Data JUK_SPOTS, stops |
| **K64** | owca_017 Map17 | Map 4 przy koszarze: (60,45),(40,50),(30,55) (przybliżone) | Ludzie_Data SHEEP_SPOTS/WHERE |
| **K67** | wymaga 3 kapliczek: 022, 021 (parkowane), 004 (jest) | 022 -> Map 3 **(69,13)**; 021 -> Map 4 **(21,17)** | Zakon_Data SHRINES, znaczniki TQ |
| **K68** | 6 kart: strażnice 022/013/157 + kopce 017/023/155; dziś tylko 013 | strażnica 022 -> Map 3 **(59,13)** 6x6; kopce 017 -> Map 3 **(18,72)**, 023 -> Map 3 **(92,25)**; 157/155 w kieszeni | Zakon_Data TOWERS, CAIRNS |
| **D36** | RING map 18, komora 176 | RING -> Map 4 środek (50,78); `RING.back` na 4 | Zakon_Data RING, SPOTS, TQ_SPOTS |
| **D30** | Jagna map 17, GLADE (65,12), źródełka 017/021/168 | Jagna + polanka 5x3: Map 3 **(18,72)**; 017 -> Map 3 **(39,79)**; 021 -> Map 4 **(19,29)**; 168 w kieszeni; kręgi grzybów Map 3 **(40,74)** | Zasoby_Data GLADE/JAGNA/źródełka; TownLife SPOTS_BY_MAP[3] (jagna_las, jagna_polanka), resident.map=3 |
| **K59** | nora Map23 (64,49), Szary Kieł | Map 3 **(95,30)** 3x2, premia (97,32) | Lowy_Data; kontrakty tablicy `maps [21],[23]` (Lowy_Data:337-339) -> [4],[3] |
| **D33** | obóz CzO Map23 | Map 3 **(96,42)** 6x5; gawra na 13 (100,70) bez zmian | Lowy_Data czo; tekst „Skraj lasu” zostaje (nazwa miejsca na Jarze) |
| **D21 / K58 / K62** | Homes: EDGE=23, WAY (79,27-29), 168 | kieszeń 168 przez Podgrodzie ~(110,20) | Homes.js `EDGE=111`, współrzędne WAY/SIGNPOST; 168: usunąć zdarzenia 33,56,57,58,261,262; domy.txt:16,70,173 „na wschód od Skraju lasu” -> „za północno-wschodnim rogiem Podgrodzia” |
| **D38**, **W8** rozdz. 5 | gaj/Osada 120 | kieszeń 120, brama Góry (6,27) | dane zostają; dodać bramę |
| **K50, D23, K51, D24, K53, W4, W11, W15** | Kleofas / pustelnia / Urwisko | kieszeń 155/156/157 | brama Przystań (88,95); K51: Kruk.js:355-361 noga 1 `(15.5,2.6)` -> okolice bramy (88,95) |
| **D40** | punkty widokowe 155, 157 | w kieszeni (OK po bramie) | Podroznicy_Data:258-259 |
| **D29 / K69 / W13** | Orla Grań | pkt 4 | słowa |

Bez zmian po sprawdzeniu (92): m.in. K1, K2, K4-6, K8-17, K20-21, K26-32, K37-39, K19, K27-30, D4, D10, D18, K40-46, D1, D3, D11, D14, D16, D17, W2, W3, W6, W7, W9, K22, K33, D13, D6, K47, K48, W10, K49, D22, K54-57, D31, K60, K61, D32, D34, D35, D37, K66, K71, K72, D39, D41-48, K73, W12, W14, W16, D20, D25, D26, D28, K70.

## 6. Znaleziska poza listą
- **Homes.js**: strażnicy zamkniętej działki stoją na starych mapach (MEADOW 4 (27,58), EDGE 23); działka to dziś środek Map003 w płocie - strażników przenieść do bram płotu.
- **Woz.js**: 4 przystanki (miasto, Podgrodzie, Jar, Przystań) - OK.
- Orzel_Data `SIDES` (stara tabela) - nic jej nie czyta. Wyspa_Data `EDGES = []`, `LINKS` nieużywane.

## 7. Nowe budynki miasta (do użycia, współrzędne po ustawieniu)
Żadne zadanie z listy od nich nie zależy; propozycje: Wiatrak (pola południowe) - K6/D42 (mąka, zboże); Sukiennice (rynek) - szwaczka, targ; Cech i Łaźnia - goście i W-podróżni; Przytułek (obóz uchodźców) - Ciotka Stefa, W6; Garbarnia z suszarnią - Ignac (K10, K20, K21, D1, D18).

## 8. Kolejność prac i ryzyka
1. Dane + jedna linia kodu (K3, D5, W1 ROAD, K63-65, K67, K68, D36, D30, K59, D33, W5) - bez edytora; testy zakon/ludzie/lowy/zasoby/kantor.
2. Kieszenie (120, 155/156/157, 168/169): przekierowanie krawędzi, bramy, drogowskazy (edytor zamknięty).
3. Kopalnia Map213 (generator + test) i Orla Grań.
4. Teksty (nie kasować kluczy). 5. Linter map. Zapisy skasowane - flagi nie są problemem.
Ryzyka: wstrzyknięte zdarzenia w zajętych polach (przeliczyć `free.js` po budowie miasta); krata cysterny nadal wpuszcza do 157 (świadomie).

## 9. Czego NIE zweryfikowałem
- Wolnych pól dla juków, owiec, kręgów grzybów, wozu promu, bramy Spalonej zagrody i schodów B kopalni (przybliżenia).
- Poleceń zdarzenia „Brama Milczących” (6,27) i wyglądu bramy 155.
- Czy lądowania Wraku (Przystań (12,7), Map165 (35,18)) są przejezdne - nie szedłem w grze.
- Szyn w zestawie 10 poza arkuszem E.
- Kluczy tekstowych każdego kroku (podane pliki, nie pełne klucze); pozycji miejsc pakietowych na mapach planszy (stare współrzędne PLAN_SPOTS) - czy trafiają w ładne pola.
