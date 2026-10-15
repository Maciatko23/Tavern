# Pięć nowych pomysłów na interfejs (runda 2)

Makiety do wyboru z 2026-10-08. Kod gry i dane są nietknięte, to tylko obrazki.

**Tło:** świeże zrzuty z obecnej gry w „Czystym widoku”. Zapis `day40_farm`: pole dziadka, dzień 40, lato, 11:01. HUD jest wyłączony, żeby można było nałożyć makiety.

**Dane na makietach są z gry:**
- cel: „Znajdź pracę w tawernie”;
- kompas: kąt 104°, podpis „Tawerna · 151 kroków”, prosto z `CleanCompass.info()`;
- plecak i cele dziennika: prawdziwa zawartość zapisu;
- obciążenie: 41 / 120.

Ikony pochodzą z `img/system/IconSet.png`, popiersie to `img/pictures/Hero_Bust.png`.

**Zasady wspólne dla wszystkich pięciu (Twoje):**
- **4 paski** (życie, kondycja, sytość, nawodnienie) zawsze w **lewym dolnym rogu**. Każdy pomysł układa je inaczej: lancety, flaszki, wachlarz, pierścienie, napełniające się ikony.
- **Okrągły kompas w prawym górnym rogu:** N E S W, strzałka do celu, pod nim podpis z liczbą kroków i obciążenie plecaka.
- **Mały zegar ze wskazówkami** zamiast godziny w cyfrach. Stoi w lewym górnym rogu przy celu (sam tytuł celu, bez opisu) i każdy pokazuje też porę dnia (słońce).
- **Okna:** każdy pomysł ma dziennik, plecak i jedno inne okno.

**Charakter pomysłów:** 1 i 2 są **ozdobne** (mocny klimat). 3, 4 i 5 są **schludne i minimalistyczne**, zgodnie z Twoim dopiskiem: czysta typografia, równe odstępy, cienkie linie, mało ozdobników, stonowane kolory z akcentem miedzi, czerwieni rubryk albo złota.

Porównanie z obecnym wyglądem jest w `zestawienie.png`.

| # | nazwa | charakter | HUD | dziennik | plecak | trzecie okno |
|---|---|---|---|---|---|---|
| 1 | Witraż | ozdobny | `pomysl_1_witraz_hud.png` | `…_dziennik.png` | `…_plecak.png` | postać: `…_postac.png` |
| 2 | Zielarnia | ozdobny | `pomysl_2_zielarnia_hud.png` | `…_dziennik.png` | `…_plecak.png` | opcje: `…_opcje.png` |
| 3 | Grafit i miedź | schludny | `pomysl_3_grafit_hud.png` | `…_dziennik.png` | `…_plecak.png` | menu P (pierścień): `…_menu_p.png` |
| 4 | Len i atrament | schludny | `pomysl_4_len_hud.png` | `…_dziennik.png` | `…_plecak.png` | zapis gry: `…_zapis.png` |
| 5 | Granat i złoto | schludny | `pomysl_5_granat_hud.png` | `…_dziennik.png` | `…_plecak.png` | postać: `…_postac.png` |

**Czcionki:** wszystkie są z Google Fonts (licencja OFL), a polskie znaki sprawdziłem (`tools/ui_pomysly/fonts/probka2.png`). Wszędzie można zostać przy Alegreya Sans w zwykłym tekście; nowa czcionka zmienia głównie nagłówki.

---

## 1. Witraż: szkło i ołów (ozdobny)

**Idea.** Interfejs złożony z kolorowego szkła w ołowianych ramkach, jak okna kaplicy zakonu. Pod tekstem jest ciemne „dymne” szkło, więc czytelność jest dobra.

- **Kompas:** rozeta (PixelLab) w kamiennym pierścieniu, ze złotą strzałką.
- **Zegar:** mała rozeta 12 szybek ze wskazówkami; słońce chodzi po obręczy.
- **Paski:** **4 ostrołukowe okna (lancety)** w lewym dole, wypełnione od dołu szkłem w romby. Ikona jest pod parapetem; przy niskim nawodnieniu lancet dostaje jasną obwódkę.
- **Okna:** dziennik ma ikonę celu w ostrołuku; plecak ma rozetę z ikoną; postać pokazuje popiersie w ostrołuku z ramą z szybek, atrybuty jako szklane medaliony i potrzeby w lancetach.

- **Paleta:** ołów `#121318`, dymne szkło `#161d2c`, rubin `#c8304a`, szafir `#3a64c8`, bursztyn `#e0a43a`, szmaragd `#2ea05a`, złoto `#f2c45a`.
- **Czcionka:** Uncial Antiqua (nagłówki, pismo uncjalne) + Alegreya Sans.

**Plusy:**
- Bardzo charakterystyczny.
- Wiąże się z fabułą: zakon, kaplica, Serce.
- Lancety to czytelne „termometry”.
- Kolory potrzeb mają naturalne znaczenie (rubin to życie, szafir to woda).

**Minusy:**
- Pstrokaty; ramka z wielu kolorów męczy przy długim czytaniu w oknach.
- Uncjał jest mniej czytelny.
- Kolorowe szkło konkuruje z kolorową mapą.

**Koszt:** duży, około 3–4 dni.
- Tekstura ramki ze szkła jako 9-slice.
- Lancety i rozeta-zegar w `CleanHUD.js`.
- Tarcza kompasu z obrazkiem w `CleanHUD_Compass.js`.
- Przemalowanie okien: `MenuPanel` (plecak, menu), `Journal`, `Scene_Hero` w `Combat_UI`.

---

## 2. Zielarnia: szkło, korek i etykiety (ozdobny)

**Idea.** Szafka wiejskiej zielarki. Drewno, zielone sukno, papierowe etykiety na sznurku, mosiądz.

- **Zegar:** mosiężny zegarek kieszonkowy z okienkiem nieba.
- **Kompas:** żeglarski, w drewnianej puszce, z czerwoną igłą do celu.
- **Paski:** **półka z czterema flaszkami** w lewym dole, każda innego kształtu (kolba, butelka, słój, karafka) i z płynem do poziomu. Na sznurkach wiszą etykiety z ikonami; przy nawodnieniu jest czerwony wykrzyknik.
- **Okna:**
  - dziennik to kartoteka z przekładkami i kartą celu na liniowanym papierze, z pieczątką „ŚLEDZONY”;
  - plecak to szafka z szufladkami (wybrana się wysuwa), opis na dużej etykiecie;
  - opcje mają tak/nie jako korek wciśnięty albo wyjęty, a głośność jako szklaną rurkę z płynem.

- **Paleta:** drewno `#4e321c`, sukno `#1c281f`, papier `#ece2c4`, mosiądz `#b08a3a`, płyny: czerwony `#b02a36`, zielony `#4a8a2a`, bursztyn `#c8861e`, niebieski `#3a7ac8`.
- **Czcionka:** EB Garamond + Cormorant SC (mosiężne tabliczki).

**Plusy:**
- Ciepły, „rękodzielniczy”; pasuje do zbieractwa, ziół, gotowania i biedy.
- Flaszki są czytelne i zabawne.
- Szufladki porządkują dużo rzeczy.

**Minusy:**
- Najwięcej grafiki: drewno, papier, mosiądz, 4 kształty flaszek.
- Szufladki pokazują nazwę dopiero po wybraniu.
- Ciemne sukno i drewno dużo zajmują.

**Koszt:** duży, około 3–4 dni.
- Tekstury i 9-slice.
- Flaszki jako 4 maski z wypełnieniem.
- Zegarek i kompas jako obrazki z ruchomymi wskazówkami.
- Nowy układ plecaka (siatka szuflad).
- Własne kontrolki w `OptionEx` / `MenuPanel` dla opcji.

---

## 3. Grafit i miedź (schludny, minimalistyczny)

**Idea.** Jak dopracowana współczesna gra indie:
- grafitowe półprzezroczyste panele z zaokrągleniem 8 px;
- jedna cienka linia, jeden miedziany akcent;
- kapitaliki z oddechem jako etykiety („CEL”, „SKĄD WZIĄĆ”);
- siatka 8 px i równe marginesy.

Nazwa miejsca to rozstrzelone kapitaliki z cienkimi liniami, bez panelu.

- **Zegar:** grafitowa tarcza z miedzianą wskazówką minutową; złote słońce na obręczy pokazuje porę dnia. Stoi w jednym panelu z celem.
- **Kompas:** grafitowy krąg z podziałką co 15°, miedziana strzałka, podpis w pigułce.
- **Paski:** **wachlarz 4 wycinków** w samym rogu, każdy wypełniany od środka na zewnątrz. Ikony są na końcach; przy nawodnieniu jest cienki łuk-ostrzeżenie.
- **Okna:**
  - dziennik: zakładki podkreślone miedzią, lista z kółkami odhaczenia, opis z sekcjami i paskiem postępu rozdziału;
  - plecak: siatka 8×5 kafli, a obok karta z tabelką (masz / waga / świeżość) i efektami po zjedzeniu;
  - **menu P:** obecny pierścień w tym stylu, z kartą „kim jestem” (popiersie, paski z liczbami, dług) i kartą „na wierzchu”.

- **Paleta:** grafit `#16171a` / linia `#40424a`, miedź `#d08a5a`, tekst `#ece6da`; paski stonowane: `#d8605a`, `#94bf6e`, `#dda650`, `#62a6dc`.
- **Czcionka:** Alegreya Sans (obecna) + Alegreya Sans SC na etykiety.

**Plusy:**
- Najczytelniejszy i najspokojniejszy.
- Działa na każdym tle: dzień, noc, śnieg.
- Zostaje obecna czcionka i obecne zachowanie „Czystego widoku”: pierścień P, kompas, układ.
- Wachlarz jest oryginalny, ale zajmuje mało miejsca.

**Minusy:**
- Najmniej „średniowieczny”; klimat dają tylko miedź i mapa.
- Wachlarz trzeba się nauczyć czytać (długość od środka).

**Koszt:** mały do średniego, około 1,5–2 dni. To najbliżej obecnego kodu.
- `CleanHUD.js` już rysuje na płótnie: dochodzą panele z zaokrągleniem, zegar zamiast cyfr i wachlarz zamiast 4 kresek.
- Kompas to tylko nowa tarcza.
- `MenuRing.js` dostaje przemalowanie.
- Plecak dostaje siatkę zamiast listy w `MenuPanel.js`.
- Dziennik i opcje to głównie kolory i linie w `UIStyle`.

---

## 4. Len i atrament (schludny, jasny, typograficzny)

**Idea.** Kremowe karty jak dobrze złożona książka:
- szeryfowa EB Garamond;
- linie 1 px atramentem, podwójna linia pod tytułem;
- czerwień rubryk jako jedyny akcent: inicjał, kapitaliki, zaznaczenie;
- dużo powietrza, prawie kwadratowe rogi.

Nazwa miejsca i podpisy są w małych jasnych pigułkach.

- **Zegar:** papierowa tarcza z atramentowymi wskazówkami; czerwona kropka na obręczy pokazuje porę dnia.
- **Kompas:** papierowy krąg z podziałką, „N” na czerwono, atramentowa igła z czerwonym grotem.
- **Paski:** **4 pierścienie z ikoną w środku** na jednej jasnej listwie w lewym dole. Przy nawodnieniu jest czerwona kropka.
- **Okna:**
  - dziennik z czerwonym inicjałem „B”, wykonane cele przekreślone z dniem wykonania;
  - plecak jak spis treści: grupy, kropki prowadzące do liczby, karta przedmiotu z tabelką;
  - **zapis gry z miniaturami miejsc**: obrazek mapy z chwili zapisu, dzień, pora, czas gry.

- **Paleta:** papier `#f3eee2`, atrament `#2b2620`, rubryka `#a23a22`, linia włoskowa `#beb4a2`; paski: `#b8382e`, `#5a8a32`, `#c8861e`, `#2f6fb0`.
- **Czcionka:** EB Garamond + Cormorant SC (rozstrzelone kapitaliki).

**Plusy:**
- Najbardziej „książkowy”, elegancki i spokojny.
- Świetnie czyta się długie teksty: dziennik, opisy, receptury.
- Miniatury w zapisie bardzo pomagają.

**Minusy:**
- Jasne panele w nocy i w ciemnych wnętrzach mocno świecą; trzeba je przygasić nocą, np. do 80% i cieplej.
- Odwraca kolory tekstu w oknach: komunikaty zielone, czerwone i niebieskie trzeba dobrać od nowa.

**Koszt:** średni, około 2–2,5 dnia.
- Jasna paleta `UIStyle` i ciemny tekst w oknach.
- Pierścienie w `CleanHUD.js`.
- Miniatury zapisu: `Bitmap.snap` przy zapisie, zapisane w informacji o pliku (`DataManager.makeSavefileInfo`). To nowa funkcja na pół dnia.
- Przygaszanie paneli nocą.

---

## 5. Granat i złoto (schludny, klasyczny, symetryczny)

**Idea.** Głęboki granat nocy ze złotą linią włoskową. Jedyne ozdobniki to maleńkie złote romby w narożnikach i na liniach. Tytuły są wyśrodkowane, kapitaliki Cormorant rozstrzelone, a układ okien symetryczny jak karta tytułowa starej księgi. Nazwa miejsca to kapitaliki nad linią z rombem, bez panelu.

- **Zegar:** granatowa tarcza ze złotymi wskazówkami; u dołu okienko z niebem i słońcem, jak okienko faz księżyca w zegarku.
- **Kompas:** granatowy krąg, złoty grot-romb do celu, romby na kierunkach pośrednich.
- **Paski:** **ikony napełniające się** w jednym rzędzie w lewym dole (64 px). Pod poziomem ikona ma pełne kolory, nad poziomem jest szaroniebieskim cieniem. Bez liczb, czytelne z daleka; przy nawodnieniu jest czerwony romb.
- **Okna:**
  - dziennik: wyśrodkowany opis celu z ikoną w złotym kółku;
  - plecak: dwie kolumny po 6 rzeczy i pas opisu na dole z efektami;
  - **postać:** popiersie w okrągłym medalionie, atrybuty symetrycznie po obu stronach, potrzeby jako napełnione ikony z procentami.

- **Paleta:** granat `#101624` / `#16203a`, złoto `#d4b26a`, kość `#efe9dc`, szaroniebieski `#9aa3b4`.
- **Czcionka:** Cormorant SC i Cormorant (nagłówki) + Alegreya Sans (tekst).

**Plusy:**
- Elegancki, „szlachetny”, profesjonalny.
- Nocna paleta pasuje do zakonu i podziemi.
- Napełniające się ikony to najprostszy do odczytania wskaźnik: od razu widać, czego brakuje.
- Symetria wygląda dopracowanie.

**Minusy:**
- Złoto i granat są chłodniejsze niż reszta gry (ciepłe drewno, zieleń).
- Kapitaliki z oddechem zajmują dużo szerokości.
- Napełnione ikony 64 px są większe niż cienkie paski.

**Koszt:** średni, około 2 dni.
- `CleanHUD.js`: zegar, rząd ikon z wypełnieniem (rysowanie ikony dwa razy z maską poziomu), kompas.
- `UIStyle` (granat, złote linie, romby).
- Wyśrodkowane układy w `MenuPanel` / `Journal` / `Scene_Hero`.
- Nowa czcionka Cormorant (plik w `fonts/`).

---

## Rekomendacja

Polecam **3, „Grafit i miedź”**. Jest najbardziej schludny i czytelny na każdym tle. Zachowuje to, co już działa w „Czystym widoku” (pierścień P, kompas z trasą, obecną czcionkę) i kosztuje najmniej. Dochodzi zegar ze wskazówkami i wachlarz potrzeb w rogu.

Jeśli wolisz więcej średniowiecznej elegancji przy tej samej czystości, wybierz **5, „Granat i złoto”**. Jej napełniające się ikony dobrze pasują też do Grafitu, zamiast wachlarza, jeśli wachlarz okaże się mniej czytelny.

Z ozdobnych lepiej rokuje **2, „Zielarnia”**: flaszki na półce są najzabawniejsze. Kosztuje jednak najwięcej grafiki.

## Pliki

- **`tools/ui_pomysly2/`:**
  - `capture.js`: świeże zrzuty z obecnej gry, port CDP 9482: `CDP_PORT=9482 node tools/ui_pomysly2/capture.js`. Robi mapę z HUD, bez HUD, nocą bez HUD, menu P, plecak, dziennik, opcje, zapis i postać.
  - `common2.py`: zasady, dane z gry, czyste elementy (panele, kapitaliki z oddechem, pierścienie, klawisze, napełniona ikona).
  - `p1_witraz.py` … `p5_granat.py` oraz `zestawienie2.py`, uruchamiane z tego folderu.
- **`tools/ui_pomysly2/zrzuty/`:** tła i `hud_info.json` (dane kompasu i celu z gry).
- **`tools/ui_pomysly2/art/`:** `rozeta.png` (rozeta 96×96, kompas Witrażu) i `lancet.png` (okno ostrołukowe, nieużyte). Oba z PixelLab, 3 generacje w tej rundzie; trzecia, wycinanka, nie została użyta.
- Wspólna biblioteka z rundy 1: `tools/ui_pomysly/uikit.py`.

---

# Menu P w stylu „Grafit i miedź”: 3 projekty (2026-10-08)

Wybrałeś pomysł 3, „Grafit i miedź”, ale z fajniejszym menu P niż pierścień. Są trzy różne projekty:
- `menu_p_A.png`
- `menu_p_B.png`
- `menu_p_C.png`

Porównanie z obecnym pierścieniem jest w `menu_p_zestawienie.png`.

Tło to świeży zrzut z gry. Dane są prawdziwe, z zapisu `day40_farm` (skrypt `tools/ui_pomysly2/dane_menu.js`):
- imię „Reid” z bazy, poziom 6, 890 / 1200 doświadczenia;
- 15 punktów atrybutów i 5 umiejętności;
- paski z liczbami;
- 28 rzeczy, obciążenie 41 / 120, sakiewka 330 G;
- dług dziadka: zostało 1250 G, 21 dni;
- cel „Znajdź pracę w tawernie” (Tawerna, 151 kroków), 41 z 77 celów;
- 12 narzędzi z prawdziwym zużyciem, oswojony pies.

Pozycje menu: Plecak, Dziennik, Postać, Opcje, Zapisz grę, Zakończ grę.

## A. Karta bohatera
**Co widać:**
- Duże popiersie w kręgu pośrodku; miedziany pierścień wokół pokazuje postęp doświadczenia.
- Pod popiersiem tabliczka „Reid · Poziom 6”.
- Z lewej: Stan (4 paski z liczbami) i Atrybuty z przyciskami „+”.
- Z prawej sloty: narzędzia ze zużyciem, broń, „na sobie” (puste miejsca podpowiadają, gdzie to zrobić) i towarzysz.
- Na dole pasek: cel, sakiewka, dług z terminem.
- Pozycje menu są zakładkami u góry; ta karta to zakładka „Postać”.

**Sterowanie:**
- Q/E albo klik: zakładka;
- strzałki: po slotach i atrybutach;
- Enter: rozdaje punkt albo otwiera;
- Esc: powrót do gry.

**Animacja wejścia:** tło się rozmywa, popiersie wjeżdża od dołu, panele wsuwają się z boków, a miedziane linie od slotów do postaci dorysowują się.

**Plusy i minusy:** najbardziej efektowny, bo bohater jest w centrum. Łączy menu P z ekranem Postać. Jest jednak najcięższy w budowie, a Plecak i Dziennik i tak otwierają się jako zakładki z osobnymi widokami.

## B. Panel z lewej + podgląd
**Co widać:**
- Pełna kolumna z lewej: na górze popiersie, imię, poziom i pasek doświadczenia oraz 4 potrzeby z liczbami.
- Pod tym 6 pozycji z dużymi ikonami w kółkach i podpisami, np. „28 rzeczy · 41/120”, cel, „15 pkt atrybutów”, „Plik 1 · dzień 40”.
- Na dole kolumny sakiewka i dług z paskiem.
- Po prawej podgląd zaznaczonej pozycji, a mapa dalej jest widoczna. Dla Plecaka: kategorie, 14 rzeczy na wierzchu, narzędzia ze zużyciem. Dla Dziennika byłby cel, dla Postaci atrybuty, dla Zapisu miniatura.

**Sterowanie:**
- ↑↓ albo najechanie myszą: wybór;
- Enter / → / klik: otwiera;
- Esc / P: zamyka;
- kółko myszy: przewija podgląd.

**Animacja wejścia:** panel wysuwa się z lewej (około 0,18 s), pozycje wpadają po kolei, a podgląd przenika przy zmianie zaznaczenia.

**Plusy i minusy:** najszybszy w użyciu, bo widać wszystko naraz i podgląd mówi, co jest w środku, zanim się wejdzie. Jest też prosty do zrobienia. Mniej „wow” niż A i C.

## C. Hub z kafelkami
**Co widać:** karty jak w menu współczesnych gier.
- **Plecak** (duży, zaznaczony, z miedzianą poświatą): liczba rzeczy, obciążenie, 14 rzeczy.
- **Dziennik:** śledzony cel z ikoną i kierunkiem, kolejne cele, 41 / 77.
- **Postać:** popiersie, kółko poziomu z postępem, punkty do rozdania, 4 potrzeby.
- **Dług dziadka u Lorda:** 1250 G zostało, 21 dni na czerwono, pasek spłaty, sakiewka.
- Opcje, Zapisz grę i Zakończ grę jako niskie kafelki z podpisami.
- W nagłówku imię, plakietka poziomu, dzień i pora oraz miejsce.

**Sterowanie:**
- strzałki: po siatce;
- Enter albo klik: otwiera;
- 1–6: skróty;
- Esc / P: zamyka.

**Animacja wejścia:** kafelki wskakują po przekątnej (skala 0,96 → 1 i przenikanie), miedziana ramka płynie do zaznaczonego kafelka, a liczby (rzeczy, dług) dobijają do wartości.

**Plusy i minusy:**
- Plus: najbardziej nowoczesny i czytelny.
- Plus: dług i cel są na pierwszym planie, a to oś gry.
- Minus: zasłania mapę.
- Minus: więcej rysowania kart niż w B.

## Koszt
Wszystkie trzy to podmiana obecnego `MenuRing.js`, a nie nowe systemy. Dane już są: Journal.tracked, Story.left / daysLeft, Durability, Combat.hero, Survival.

| projekt | koszt | uwagi |
|---|---|---|
| A | około 2 dni | łączy menu z ekranem Postać |
| B | około 1 dzień | |
| C | około 1,5 dnia | |

## Rekomendacja
**C, „Hub z kafelkami”:**
- najbardziej efektowny przy zachowaniu czystości Grafitu;
- najważniejsze rzeczy (cel, dług, plecak) widać bez wchodzenia dalej;
- działa dobrze i z klawiatury, i z myszą.

Jeśli wolisz, żeby mapa dalej była widoczna i żeby menu było jak najszybsze, wybierz **B**. A jest najładniejsze jako sam ekran **Postać**: można go użyć jako widoku po wejściu w kafelek „Postać” z C.

---

# Paski stanu jako łuki wokół zegara (szkic użytkownika, 2026-10-08)

Twój pomysł: zegar w lewym górnym rogu, a 4 paski jako łuki obiegające go od dołu w prawo. Kolejność łuków od środka: życie, kondycja, sytość, nawodnienie. Każdy łuk ma **tę samą grubość** i **równe odstępy**, także 5. łuk oddechu w trybie walki.

Makiety są na świeżym zrzucie gry z HUD Grafit. Kompas w prawym górnym rogu, nazwa miejsca i zdobycze zostały z gry bez zmian, a lewy dolny róg jest pusty.

## A. Wiernie według szkicu
Pliki: `luki_zegar_A.png` i zbliżenie x2 `luki_zegar_A_zblizenie.png`.

- **Zegar:** tarcza r 40 z miedzianą wskazówką; słońce na tarczy pokazuje porę dnia.
- **Łuki:** grubość 7 px, co 26 px. Zaczynają się u dołu przy ikonach z IconSet (serce, but, mięso, kropla), które stoją pionowo pod zegarem. Kończą się tam, gdzie dochodzą do górnej krawędzi, więc zewnętrzne są krótsze, jak na szkicu.
- **Cel i pora:** po prawej od łuków: „CEL”, ikona i „Znajdź pracę w tawernie”, pod spodem „Południe · dzień 40 · lato”.
- **Mało wody:** łuk wody krótki, czerwony z poświatą (miga), przy kropli „!”.
- **Walka:** oddech jako 5. łuk na zewnątrz, z ikoną wiatru, plus plakietka „Tryb walki” pod celem.
- **Wada:** całość zajmuje około 200×215 px w rogu.

## B. Dopracowany
Pliki: `luki_zegar_B.png` i zbliżenie x2 `luki_zegar_B_zblizenie.png`.

- **Łuki:** zwarte, jako półpierścień po prawej stronie tarczy (r 34): od dołu przez prawą stronę do góry. Grubość 7 px, odstęp 3 px.
- **Przy początkach łuków** (u dołu) małe znaczki w kolorach łuków.
- **Przy końcach** (u góry, w samym rogu) wartości: 78% / 70 / 64 / 41.
- **Cel i pora:** po prawej, tak jak w A.
- **Mało wody:** krótki czerwony łuk z poświatą i wartość „12” na czerwono.
- **Walka:** 5. łuk oddechu na zewnątrz, z tą samą grubością i odstępem.
- **Zaleta:** zajmuje około 120×170 px, czyli mniej niż obecny panel z zegarem i wachlarz razem.

**Moja rekomendacja: B.** Jest zwarty, czytelny (wartości przy końcach, równe łuki) i zwalnia cały lewy dolny róg. A lepiej oddaje szkic, ale zajmuje dużo miejsca w rogu mapy.

Skrypty: `tools/ui_pomysly2/luki_zegar.py` (rysuje oba warianty; łuki rysowane w 4× i zmniejszane, więc krawędzie są gładkie) i `tools/ui_pomysly2/capture_luki.js` (zrzuty, port 9482).

---

# Zakładka POSTAĆ: 3 układy (2026-10-08)

Twoje wytyczne:
- menu P ma 6 zakładek głównych: Postać, Plecak, Dziennik, Opcje, Zapisz grę, Zakończ grę;
- Umiejętności nie są osobną zakładką, tylko częścią Postaci;
- w Postaci są: atrybuty z opisem, obrażenia obecną bronią, odporności, ekwipunek (11 komórek z wyborem rzeczy) i umiejętności (drzewka, punkty);
- opis zaznaczonego elementu jest zawsze w jednym stałym miejscu, bez dymka na postaci.

Porównanie wszystkich układów jest w `postac_zestawienie.png`.

**Dane są z gry** (`tools/ui_pomysly2/dane_postac2.js`, zapis `day40_farm`; przed zrzutem założyłem w grze kurtkę, tarczę, płaszcz, plecak i buty, bez zmiany kodu):
- bohater: Reid, poziom 6, 1065 / 1200 doświadczenia, 15 punktów atrybutów, 5 umiejętności;
- obrażenia Żelazną siekierą: cios 26, seria 26 / 29 / 38, ciężki 57 (pełny 70), krytyk 3% × 1,6 = 42, zbijanie równowagi 30 (ciężki 75), oddech 16, bez broni cios 5;
- odporności: życie 115, oddech 100, kurtka −20%, tarcza 75%, próg przewrócenia 60, płaszcz (nie marzniesz), opór na strach 15%;
- opisy atrybutów z wartościami „teraz / +1” pochodzą z `Combat.attrInfo`;
- drzewka z `Skills_Data`: 10 dziedzin, Walka wręcz 0 / 19.

## A. Podzakładki
Pliki: `postac_A.png`, `postac_A_ekwipunek.png`, `postac_A_umiejetnosci.png`.

Pod zakładkami głównymi jest drugi rząd: Statystyki / Ekwipunek / Umiejętności (Z / C albo klik). Każda podzakładka zajmuje całą szerokość.

- **Statystyki:** pasek z popiersiem, poziomem i 4 potrzebami. Pod nim trzy kolumny: Atrybuty, Obrażenia (broń w prawej ręce) i Odporności. Na dole stały panel „Opis zaznaczonego” z tabelą „teraz / +1 pkt”.
- **Ekwipunek:** po lewej postać w pełnej sylwetce (arkusz chodu powiększony 4×, piksel-art) z 11 komórkami wokół. Po prawej lista wyboru dla zaznaczonej komórki, a pod nią stały opis rzeczy.
- **Umiejętności:** po lewej dziedziny z postępem, pośrodku drzewko z progami poziomów, po prawej opis i przycisk „naucz się”.

**Plusy i minusy:** najczytelniejszy i najłatwiejszy w obsłudze, każdy widok ma dużo miejsca. Minusem jest to, że nie widać wszystkiego naraz.

## B. Jeden ekran
Pliki: `postac_B.png`, `postac_B_ekwipunek.png`, `postac_B_drzewko.png`.

- **Lewa kolumna:** atrybuty, skrót obrażeń i odporności.
- **Środek:** imię, poziom, 4 potrzeby i postać z ekwipunkiem wokół.
- **Prawa kolumna:** 10 dziedzin umiejętności z punktami.
- **Na dole stały pasek opisu.** Przy zaznaczonym atrybucie pokazuje tabelę „teraz / +1”; przy komórce ekwipunku zamienia się w wybór rzeczy w poziomie (Drewniana tarcza / Pochodnia / Zdejmij).
- **Drzewko:** Enter na dziedzinie otwiera je na całym ekranie, a Esc wraca do Postaci.

**Plusy i minusy:** wszystko widać na jednym ekranie, a postać jest w centrum. Kolumny są jednak ciasne i wymagają mniejszych czcionek.

## C. „Co to daje”: podgląd w miejscu
Pliki: `postac_C.png`, `postac_C_ekwipunek.png`, `postac_C_drzewko.png`.

- **Kolorowe znaczki:** atrybuty mają swoje kolory i litery (S, Z, K, C, H), a każdy wiersz obrażeń i odporności nosi znaczek atrybutu albo ikonę rzeczy, która na niego działa.
- **Zaznaczony atrybut** podświetla wiersze, na które wpływa, i pokazuje w nich wynik po +1 punkcie, np. „Cios 26 → 27”, „Seria → 27 / 30 / 39”, „Ciężki → 59”. Reszta przygasa, więc dymek nie jest potrzebny.
- **Opis** jest zawsze w lewej kolumnie, pod listą atrybutów.
- **Zaznaczona rzecz** (Lewa ręka) podświetla wiersz „Blok”, a wybór rzeczy otwiera się w samym panelu ekwipunku, nie na postaci.
- **Umiejętności:** pasek 10 dziedzin na dole. Enter otwiera drzewko w środkowej części ekranu, a opis umiejętności trafia w to samo stałe miejsce po lewej.

**Plusy i minusy:** od razu widać, co da punkt albo rzecz, i nic nie zasłania postaci. Ekran jest jednak najgęstszy, a sylwetka postaci jest mała (tylko siatka komórek).

## Rekomendacja
**A** to najbezpieczniejszy wybór. Jest czytelny, ma dużo miejsca na drzewka, a opis jest zawsze w stałym panelu.

Najlepiej byłoby połączyć A z jednym pomysłem z C: podglądem „→ +1” bezpośrednio w kolumnach Obrażenia i Odporności, gdy zaznaczony jest atrybut.

B wybierz, jeśli chcesz mieć wszystko na jednym ekranie.

Skrypty: `tools/ui_pomysly2/postac_grafit.py`, `postac_zestawienie.py`, `dane_postac2.js` (port 9482).
