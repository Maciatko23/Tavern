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

{LICZBY}
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
{PIECZATKI}

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

{SPRAWDZENIA}
