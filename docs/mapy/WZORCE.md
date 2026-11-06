# WZORCE STYLU: 4 mapy gracza (DNA stylu)

Gracz ocenił mapy budowane skryptami jako słabe i „dziwne” i wskazał 4 własne mapy jako wzorzec: **Map013** „Góry i kamieniołom”
(zestaw 11), **Map159** „Przylądek z latarnią” (zestaw 11), **Map008** „Okolice Tawerny” (zestaw 11) i **Map003** „Kruczy Jar” z polem
dziadka (zestaw 9). Ten dokument rozkłada je na liczby i przykłady. Obrazki (wycinki wielkości jednego ekranu gry, 27x15 kratek,
1296x720 px): `docs/mapy/wzorce/*.png` (`python tools/mapy/pieczatki/wzorce_obrazy.py`). Liczby: `python tools/mapy/pieczatki/wzorce_liczby.py`.
Pieczątki wycięte z tych map: `tools/mapy/pieczatki/dane/` (rozdział 7). Dokument składa `tools/mapy/pieczatki/wzorce_dokument.py`
z szablonu `wzorce_szablon.md`.

## 1. Najważniejsze cechy (streszczenie)

1. **Grunt jest cichy.** Mapy to głównie trawa (50-82% kratek warstwy 0) w dwóch tonach (A2-16 i A2-27, w Kruczym Jarze A5 jako
   ciemniejsze plamy trawy), do tego duże plamy ziemi (A2-24 / A2-17). Zmienność daje warstwa 1: kępki trawy (A2-21 w 4-31% kratek),
   ciemna trawa pod sosnami (46), kamienny rumosz (39, 23), sucha ziemia koryta (36). Nie ma wzorów powtarzanych jak szablon.
2. **Granice plam są duże i okrągłe.** Plama ziemi ma zwykle 10-25 kratek średnicy (mediana pola 17-32 kratek, największe 110-250),
   brzeg z krokami 1-2 kratki, bez prostych cięć dłuższych niż 3-4 kratki. Przejście grunt-grunt to jeden kształt autokafla
   (w Map013 dodatkowo pojedyncze kafle A5 jako miękki rant). Plama nie dotyka krawędzi mapy i nie „urywa się”.
3. **Drogi i ścieżki** to wstęgi ziemi 2-4 kratki szerokości z łagodnym zakrętem, rozwidleniem i poszerzeniem; kończą się
   zaokrąglonym końcem albo wpadają w plamę ziemi. Kierunek zmienia się co 6-10 kratek, nigdy co kratkę.
4. **Las to zdarzenia.** Drzewa (sosny A/B/C, małe drzewo, jabłoń/grusza) są zdarzeniami o priorytecie „jak postać”, więc bohater
   przechodzi ZA nimi, a nie po nich. Gęstość: 1,0-2,0 drzewa na 100 kratek całej mapy (Map159, 008, 013), 3,5 w Kruczym Jarze;
   lasy zwarte mają odstęp 1-2 kratki, rzadkie 3-6; mediana odstępu 2,2-4,5 kratki. Las jest PLAMAMI (kępa 3-5 drzew, lasek 20-60
   drzew z miękkim, rzedniejącym brzegiem), a na łące stoją pojedyncze drzewa. Pod drzewami ciemniejsza trawa (46).
5. **Wzgórza** to pierścienie albo półki z kafla A2-47 (skalny klif) na warstwie 1: lico 2 kratki od południa, cienka krawędź
   (1 kratka) po bokach i u góry, szczyt z wcięciami, zakończenia boków zaokrąglone; schody to kafle D w przerwie lica. Każdy kształt
   jest zamknięty w całości; klify nigdy nie dochodzą do krawędzi mapy.
6. **Drobiazgi** (kamienie 0,2-0,7 na 100 kratek, w Kruczym Jarze 2,5; krzaki 0,3 i 1,8; pnie, kłody, kwiaty A2-28/29, rumosz) leżą
   w grupkach przy czymś: przy ścieżce, pod skałą, na skraju lasu.
7. **Krawędzie nie mają pasa.** Teren na obrzeżu to ten sam grunt co w głębi (trawa/ziemia, w 159 morze); drzew w pasie 3 kratek od
   krawędzi jest mało (Map159: 9; w 013 i 003 więcej, bo to ich mur i las), żadnych pasów liści (A2-20).
8. **Mur i płot** są zawsze zakończone: baszta albo słup na końcu, furtka w przerwie, narożnik; za krawędź mapy przechodzą tylko
   tam, gdzie ciągną się dalej na sąsiedniej mapie.

## 2. Grunt i proporcje (z liczb)

Rodzaje: A2-16 trawa, A2-27 trawa (ton), A2-24 ziemia (zestaw 11), A2-17 ziemia (zestaw 9, ścieżka w 159), A5 (kafle 1625-1662) =
ciemniejsze plamy trawy i rant ziemi, A1-6 morze, A2-33 drewno/belki (w 013 pas muru przy dolnej krawędzi). Warstwa 1: 21 kępki
trawy, 46 ciemna trawa, 39 i 23 rumosz, 36 sucha spękana ziemia (koryto), 47 skalna półka (klif).

### Map013 (120x96)
- grunt, warstwa 0: trawa 49.7%, ziemia 21.8%, trawa jasna/ciemna (27) 17.9%, A5 8.5%, deski 1.2%, ziemia/ścieżka (17) 1.1%, bruk 0.0%
- warstwa 1 (nakładki): 47 8.2%, 21 6.4%, 39 3.6%, 29 2.7%, 36 1.4%, 23 1.4%, 25 0.3% (udział w kratkach 24%)
- drzewa-zdarzenia: 236 (2.0 na 100 kratek), krzaki 37 (0.3), skały 83 (0.7); zdarzeń razem 406
- odstęp drzewo-najbliższe drzewo: mediana 3.6 kratki, 10% najbliższych <= 1.0, 90% <= 6.3
- grafiki drzew: Pine_A 76, Pine_C 75, Pine_B 50, Tree_Small 32, Big_Trees_green 3
- plamy ziemi (24/17, warstwa 0): 39 plam, największe [254, 253, 246, 225] kratek, mediana 32
- regiony: {0: 11274, 7: 238, 2: 8}
- obrzeże 2 kratek: trawa 39.2%, ziemia 25.7%, deski 15.7%, trawa jasna/ciemna (27) 12.4%; drzew w pasie 3 kratek od krawędzi: 44

### Map159 (104x80)
- grunt, warstwa 0: trawa 50.7%, morze 36.2%, ziemia/ścieżka (17) 10.1%, A5 2.8%, 66 0.1%, 84 0.1%
- warstwa 1 (nakładki): 21 4.2%, 39 1.6%, 31 1.4%, ziemia/ścieżka (17) 0.7%, 23 0.5%, B-E 0.0% (udział w kratkach 8%)
- drzewa-zdarzenia: 93 (1.1 na 100 kratek), krzaki 28 (0.3), skały 27 (0.3); zdarzeń razem 178
- odstęp drzewo-najbliższe drzewo: mediana 3.6 kratki, 10% najbliższych <= 2.8, 90% <= 5.3
- grafiki drzew: Pine_C 44, Pine_B 23, Pine_A 16, Tree_Small 6, Tree_Pear 3, Tree_Apple 1
- plamy ziemi (24/17, warstwa 0): 28 plam, największe [111, 108, 74, 60] kratek, mediana 17
- regiony: {0: 8296, 2: 24}
- obrzeże 2 kratek: morze 63.1%, trawa 25.7%, ziemia/ścieżka (17) 11.2%; drzew w pasie 3 kratek od krawędzi: 9

### Map008 (104x138, teren za murem y>=103)
- grunt, warstwa 0: trawa 56.3%, ziemia/ścieżka (17) 25.4%, trawa jasna/ciemna (27) 18.2%, 26 0.1%
- warstwa 1 (nakładki): 21 31.6%, 31 20.1%, 37 12.5%, 39 9.6%, 28 9.1%, 36 3.1% (udział w kratkach 86%)
- drzewa-zdarzenia: 35 (1.0 na 100 kratek), krzaki 10 (0.3), skały 8 (0.2); zdarzeń razem 58
- odstęp drzewo-najbliższe drzewo: mediana 4.5 kratki, 10% najbliższych <= 3.8, 90% <= 9.6
- grafiki drzew: Big_Trees_green 24, Tree_Small 10, Tree_Pear 1
- plamy ziemi (24/17, warstwa 0): 17 plam, największe [523, 166, 46, 40] kratek, mediana 17
- regiony: {0: 10163, 2: 3018, 31: 1006, 3: 165}
- obrzeże 2 kratek: mur/dach A4 37.1%, deski 22.1%, trawa 16.5%, ziemia/ścieżka (17) 13.2%; drzew w pasie 3 kratek od krawędzi: 11

### Map003 (80x60)
- grunt, warstwa 0: trawa 81.9%, A5 12.6%, trawa jasna/ciemna (27) 5.1%, ziemia/ścieżka (17) 0.3%
- warstwa 1 (nakładki): 21 26.1%, 39 7.5%, 46 3.0%, 47 0.8%, 28 0.3%, 36 0.1%, 31 0.0% (udział w kratkach 38%)
- drzewa-zdarzenia: 168 (3.5 na 100 kratek), krzaki 86 (1.8), skały 119 (2.5); zdarzeń razem 402
- odstęp drzewo-najbliższe drzewo: mediana 2.2 kratki, 10% najbliższych <= 1.0, 90% <= 3.6
- grafiki drzew: Pine_A 67, Pine_B 50, Tree_Small 24, Tree_Apple 22, Tree_Pear 3, Pine_C 2
- plamy ziemi (24/17, warstwa 0): 4 plam, największe [5, 4, 4, 3] kratek, mediana 4
- regiony: {9: 3350, 0: 843, 2: 300, 7: 270, 3: 37}
- obrzeże 2 kratek: trawa 51.7%, A5 46.1%, trawa jasna/ciemna (27) 2.2%; drzew w pasie 3 kratek od krawędzi: 42


Wnioski liczbowe do budowy: trawa 50-80% kratek; ziemia 10-25%; kępki trawy (21) 4-30% warstwy 1; jedna duża plama ziemi na ok.
400-600 kratek mapy; plamy mniejsze (5-20 kratek) tylko jako rumosz.

## 3. Drogi, ścieżki, plamy: kształt i szerokość

- Ścieżka w Map003 (A5 1633 + 39): szerokość 2-3 kratki, zakręt po łuku o promieniu ok. 6-8 kratek, rozwidlenie Y co ok. 25 kratek.
- Map159: rozwidlenie (pieczątka `sciezka_rozwidlenie`): odnogi 3 i 4-5 kratek, ciemna plamka trawy między odnogami.
- Map013: pasy ziemi 2-3 kratki między kępami sosen, plamy 10-25 kratek, miękki rant A5.
- Przejście trawa-ziemia to ZAWSZE jeden kształt autokafla (nie pas 3 kratek); brzeg ma kroki 1-2 kratki.
(Szerokości to ocena z wycinków i pieczątek, nie pomiar maszynowy.)

Obrazki: `159_sciezka_rozwidlenie.png`, `003_sciezka_zakret.png`, `013_plamy_ziemi.png`, `008_podmiejska_laka.png`.

## 4. Las, podszyt, drobiazgi

- Drzewa: `!$Pine_A/B/C` (wysokie, średnie, niskie sosny; 70-80% drzew), `!$Tree_Small` (młode, 10-15%), `!$Tree_Apple/Pear` (do 12% w
  Kruczym Jarze, rzędem przy sosnach), `!$Big_Trees_green` (liściaste, tylko w mieście Map008). Ozdobne: „Drzewo (ozdobne)” z notatką
  `<Zapora:krawedz>`; do wycinania: `<Tree:hits=...>`. Wszystkie `priorityType 1`.
- Układ: **skraj lasu** to nieregularny rząd z odstępami 2-4 kratki, młodsze drzewa na obrzeżu, gęstość spada ku końcom;
  **kępa** to 3-5 drzew w trójkącie o boku 2-3 kratki; **las zwarty** (`003_geste_sosny_plot`) 60-65 drzew na ok. 20x17 kratek.
- Podszyt: krzaki `!$Bush_Bare_*` w grupkach 1-3 przy skraju lasu i pod skałami; kamienie `!$Rock_*` (płaski, kopiec, głaz) 1-2 przy
  ścieżce; pnie `<Stump>` i kłody `<Log>` pojedynczo na skraju.
- Kwiaty (A2-28/29 na warstwie 1) skupiskami 5-15 kratek na łące, nie pasem.

Obrazki: `013_skraj_lasu.png`, `003_geste_sosny_plot.png`, `013_suche_koryto.png`, `003_pole_skal.png`.

## 5. Wzgórza, klify, półki, skarpy, schody

- **Pierścień** (Map013 (22..31, 54..63), (96..108, 70..80), (42..54, 77..87); Map003 (22..32, 36..50)): półka A2-47 na warstwie 1;
  lico 2 kratki wysokości od południa, 1 kratka krawędzi po bokach i u góry, szczyt z 2-3 wcięciami, boki kończą się zaokrąglonym
  zakończeniem; wnętrze to trawa tego samego rodzaju co na zewnątrz; wysokość 8-11 kratek, szerokość 9-13.
- **Półki wyrobiska** (Map013 (30..60, 14..28)): poziome lico 2-3 kratki, długość 6-14 kratek, końce schodkowe; **schody** (kafle D,
  2-4 kratki szerokości) w przerwie lica.
- **Cypel** (Map159): trzy poziomy, każdy z licem od południa, schody na osi, szczyty płaskie (`159_cypel.png`).
- Zakończenia: żaden klif nie dochodzi do krawędzi mapy; ostatnia kratka półki ma narożnik.

Obrazki: `013_wzgorze_pierscien.png`, `013_wzgorze_w_ziemi.png`, `013_kamieniolom_schody.png`, `159_cypel.png`, `003_wzgorze_ruiny.png`.

## 6. Brzeg morza, mury i płoty, regiony, krawędzie

- **Brzeg morza** (Map159): morze A1-6 na warstwie 0 (36% kratek), ląd A2-16; linia brzegu schodkowa, odcinki prostej 2-6 kratek,
  kroki 1-2; w grze nakładka CzerwonaWoda (`BRZEG_MAPS`) wygładza brzeg i rysuje pas brzegu (kamień, ziemia, sucha trawa, ok. 1-2
  kratek) - same kafle są kątowe. Obrzeże 2 kratek ma 63% morza: morze przechodzi przez krawędź mapy (`159_brzeg_morza.png`).
- **Mury** (Map008): A3/A4 (rodzaje 48-127), baszty co 6-7 kratek, brama z dwiema basztami, schody na wale; koniec muru = baszta
  (`008_mur_z_basztami.png`). W Map003 mur i płot z kafli B na warstwie 3 z regionem 2 (blokada), płot z furtką (przerwa 4-5
  kratek), słupy na końcach, narożniki (`003_geste_sosny_plot.png`); zestaw 9 nie ma flag przejścia, blokadę dają regiony.
- **Regiony** (RegionLayers.js): 2 = „na równi” (zawsze blokuje: płoty i mury; Map003 300 kratek, Map008 3018), 3 = „nad” (165 kratek
  w Map008), 1 = „pod”; 7 = kołysanie liści, 9 = pole dziadka (Map003, 3350 kratek), 31 = plac Map008.
- **Krawędzie**: zob. punkt 7 streszczenia i `docs/MAPY_ZASADY.md` rozdz. 11; kontrola `tools/mapy/estetyka.py`.

## 7. Pieczątki (tools/mapy/pieczatki)

Pieczątka to gotowy, ZAKOŃCZONY kawałek terenu: wszystkie warstwy kafli, cienie, regiony i zdarzenia ozdobne razem; JSON w `dane/`,
podgląd PNG obok. Kompletność wymusza wycinanie: obiekt z kafli (półka, ściana, schody) dotykający brzegu okna odpada w całości,
plama gruntu dotykająca brzegu odpada w całości, przecięty brzegiem pas ścieżki jest obcinany i zaokrąglany, drzewa na brzegu
odpadają; pieczątki „pełne” (całe okno) mają brzeg z tego samego gruntu co tło. Wstawianie (`pieczatki.Plotno.wstaw`) kładzie maskę,
zdarzenia (bez nakładania zajętych kratek) i PRZELICZA kształty autokafli (47 kształtów A1/A2/góry A4, 16 kształtów ścian A3/A4)
w pasie styku, więc połączenie z otoczeniem jest zamknięte.

| pieczątka | źródło | rozmiar | zdarzeń | opis |
|---|---|---|---|---|
| `c_plama_013_0` | Map013 | 17x12 | 4 | Plama ziemi i bruku z Map013 (52,46). |
| `c_plama_013_1` | Map013 | 12x13 | 2 | Plama ziemi z Map013 (89,57). |
| `c_plama_013_2` | Map013 | 14x11 | 3 | Plama ziemi z Map013 (55,58). |
| `c_plama_013_3` | Map013 | 11x17 | 10 | Pas ziemi z Map013 (43,39). |
| `c_plama_013_4` | Map013 | 11x10 | 4 | Mała plama ziemi z Map013 (4,48). |
| `c_wzgorze_003` | Map003 | 18x14 | 11 | Całe kamienne wzgórze z Map003 (22,36), z kępkami drzew na szczycie (bez wieżyczki z kafli D). |
| `c_wzgorze_013_a` | Map013 | 18x19 | 4 | Całe wzgórze z Map013 (96,69): lico A5, krawędź A2-47, pas gruntu 3 kratki. |
| `c_wzgorze_013_b` | Map013 | 17x20 | 3 | Całe wzgórze z Map013 (72,74). |
| `cypel_trzy_poziomy` | Map159 | 45x34 | 19 | Cypel z trzema poziomami wzgórza, schodami i płaskimi szczytami, otoczony morzem. |
| `gracz_wzgorze_990` | Map990 | 30x17 | 0 | WZGÓRZE GRACZA z Map990 (wzorzec nr 1): plateau obrysem A5 ze wszystkich stron, lico ze schodami, bez zmian. |
| `kamieniolom_polki` | Map013 | 34x21 | 24 | Wyrobisko z dwiema skalnymi półkami (poziomami), schodami między nimi, głazami i rumoszem. |
| `kamieniolom_schody` | Map013 | 15x14 | 3 | Dwie skalne półki z kamiennymi schodami między poziomami wyrobiska (całe okno, tło: ziemia). |
| `kepa_sosen` | Map013 | 16x10 | 4 | Kępa kilku sosen na łące. |
| `koryto_suche` | Map013 | 13x15 | 0 | Suche koryto: pas ciemnej, spękanej ziemi (A2-36) z kamieniami i leżącym pniem, końce zaokrąglone. |
| `las_geste_gory` | Map013 | 26x26 | 29 | Gęsty sosnowy las z miękkim, nieregularnym brzegiem (elipsa). |
| `las_geste_jar` | Map003 | 26x19 | 64 | Gęsty las sosnowy z rzędem dzikich jabłoni na skraju (elipsa). |
| `mur_baszta_brama` | Map013 | 14x8 | 3 | Koniec muru: okrągła baszta, odcinek muru i przerwa bramy z brukiem (całe okno, przy dolnej krawędzi mapy, tło: trawa). |
| `plama_ziemi_159` | Map159 | 16x15 | 6 | Plama ziemi na łące. |
| `plama_ziemi_a` | Map013 | 17x18 | 7 | Duża plama ziemi z rumoszem i kamieniami, zakończona zaokrąglonym brzegiem. |
| `plama_ziemi_b` | Map013 | 16x16 | 5 | Plama ziemi z pasem rumoszu. |
| `plama_ziemi_c` | Map013 | 17x11 | 4 | Pas ziemi z rumoszem. |
| `plot_narozny_zakonczony` | Map003 | 9x10 | 2 | Płot z narożnikiem i dwoma wolnymi końcami (słupki na końcach), blokada regionem 2 (całe okno, tło: trawa). |
| `polka_dluga_schody` | Map013 | 42x17 | 22 | Długa skalna półka ze schodami w środku i zakończeniami po bokach. |
| `polka_prosta_a` | Map013 | 30x6 | 4 | Skalna półka z poziomym licem i schodkami (całe okno, tło: trawa). |
| `sad_jabloni` | Map003 | 11x8 | 15 | Kilka dzikich jabłoni i gruszy: miejsce zbierania owoców. |
| `sciezka_rozwidlenie` | Map159 | 16x26 | 4 | Ścieżka ziemna z zakrętem i rozwidleniem (końce zaokrąglone, ścieżka kończy się łagodnie). |
| `sciezka_zakret` | Map159 | 17x17 | 7 | Ścieżka z szerokim zakrętem i poszerzeniem (końce zaokrąglone). |
| `skaly_rumowisko` | Map003 | 22x17 | 62 | Pole skał i zarośli: głazy różnej wielkości i suche krzaki. |
| `skraj_lasu` | Map013 | 37x16 | 22 | Skraj lasu: nieregularny rząd sosen (z młodymi drzewkami) ze zmniejszającą się gęstością ku końcom. |
| `wzgorze_a` | Map013 | 19x16 | 2 | Wzgórze z klifem: półka z poszarpaną ścianą od południa, zaokrąglonym szczytem i zakończeniami po bokach. |
| `wzgorze_b` | Map013 | 20x13 | 3 | Niskie wzgórze otwarte od północy: ściana klifu z wcięciami, schodzi do ziemi bokami. |
| `wzgorze_c` | Map013 | 16x13 | 2 | Okrągłe wzgórze z klifem i dwoma wcięciami w szczycie. |
| `wzgorze_ruiny_jar` | Map003 | 14x17 | 10 | Kamienne wzgórze-pierścień z kamienną nasypką (bez wieżyczki z kafli), zakończone ze wszystkich stron. |

Ograniczenia: `kamieniolom_schody` kładzie się na wcześniej przygotowanym gruncie ziemi (tło A2-24); `cypel_trzy_poziomy` zawiera
tylko drobiazgi (ląd cypla przylega do lądu mapy i odpadał jako ucięty), więc wzgórze z półkami i schodami do map próbnych bierze
się z `polka_prosta_a`, `kamieniolom_schody` i pierścieni.

## 8. Wzgórze gracza (Map990), WZORZEC NR 1 (poprawka gracza 2026-11-01, wersja pliku sha256 dc61145d…)

Gracz poprawił w edytorze wzgórze na mapie próbnej A. To jest wzorzec numer 1 konstrukcji wzgórza; wycinek 1:1 (32x17 kratek):
`docs/mapy/wzorce/990_wzgorze_gracza.png`; pieczątka: `tools/mapy/pieczatki/dane/gracz_wzgorze_990.json` (+ `.png`, 135 kafli obrysu, okno 30x17). Rozbiór (kratki mapy, wszystko na warstwie 0 z kafli A5
zestawu `Fantasy_Outside_A5_green`, numery to id kafla A5 minus 1536; warstwy 2-3 puste, regionów brak poza płotem w środku):

- **Obrys to jeden zamknięty, kroczący kontur** (plateau 28 kratek szerokości, ok. 11-14 wysokości), zbudowany z dwóch prostokątów połączonych jednym stopniem: prawa część
  (x 15..34) zaczyna się od y=7, lewa (x 6..14) od y=10. Nigdzie nie ma otwartego boku ani urwanego kawałka.
- **Góra:** lewy górny narożnik 88 w (15,7), potem pas 89 (17 kratek) do prawego górnego narożnika 90 w (34,7); w drugim stopniu 88 w (6,10), pas 89 od x=7 do 14 i narożnik
  wewnętrzny 76 w (15,10), gdzie obrys schodzi o 3 rzędy.
- **Boki:** lewy bok 96 (x=15 dla y 8-9; x=6 dla y 11-17), prawy bok 98 (x=34, y 8-17). Boki są cienkie (1 kratka) i prowadzą prosto do lica.
- **Lico (dół):** 3 rzędy, y 18-20: rząd lipy 104 (lewy koniec) / 105 (środek), rząd środkowy 112 (lewy koniec) / 113 / 114 (prawy koniec), rząd dolny 120 / 121 / 122. Lico ma
  równą wysokość na całej długości (28 kratek) i NIE zagina się: jedyny stopień to prawy koniec, gdzie ostatnie 4 kolumny (x 31-34) leżą o 1 rząd niżej (rzędy 19-21) i mają
  własne zakończenia (104/112/120 po lewej, 106/114/122 po prawej) oraz boczny bok 98 schodzący do ich lipy. Wszystkie zakończenia są zaokrąglone, wszystkie boki zamknięte.
- **Schody:** w przerwie lica o szerokości 2 kratek (x 12-13) kafle schodów A5 24 i 26 w rzędach 19-20, nad nimi i pod nimi kępa ziemi (A2-39 na warstwie 1 w (12,18),(13,18),
  rumosz pod licem). Lico po obu stronach schodów kończy się PROSTO: przy schodach stoją kafle środka (113/121), nie zakończenia 112/120/114/122.
- **Ozdoby przy licu:** pod licem rząd kamyków A2-23 i A2-39 (warstwa 1) w 3 rzędach, dwa kafle A5 73/81 i 74/82 jako małe filary/ściek w licu.
- **Wnętrze plateau** to zwykła trawa (A2-16 z kępkami A2-21); stoi w nim płot A2-22 i sad - to nie jest część wzgórza.

Wniosek dla budowy: wzgórze = zamknięty obrys z kafli A5 (góra-boki-lico) z licem równej wysokości i krótkim stopniem na jednym końcu, schody w przerwie lica z prostymi bokami, wszystkie
końce zaokrąglone zakończeniami. Pieczątka `gracz_wzgorze_990` jest wstawiana bez zmian (A5 i A2-24/26 są takie same w zestawach 9 i 11; w zestawie 9 blokuje region 2 w pieczątce).

### Wyniki sprawdzeń estetyka f-j na wzorcach (liczby trafień; nic w nich nie zmieniono)

| mapa | a | b | c | d | e | f | g | h | i | j |
|---|---|---|---|---|---|---|---|---|---|---|
| Map013 | 0 | 16 | 0 | 0 | 2 | 51 | 0 | 0 | 4 | 46 |
| Map159 | 0 | 3 | 0 | 0 | 0 | 1 | 13 | 0 | 0 | 11 |
| Map008 | 0 | 9 | 1 | 0 | 0 | 4 | 0 | 3 | 0 | 29 |
| Map003 | 0 | 4 | 1 | 0 | 0 | 12 | 0 | 0 | 0 | 6 |
| Map990 (wersja gracza dc61145d) | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 2 | 11 |

(f: schodkowa/zębata linia lica, dziura 1 kratki, otwarta strona, urwany kawałek; g: drzewo przy wodzie; h: rama gruntu pod płotem/murem; i: zaokrąglony koniec lica przy schodach; j: kanciasta/prostokątna plama. Liczby na wzorcach to w większości dzieło gracza, nie błędy do poprawy; nic w nich nie zmieniono.)
