# Zasady budowania map (Tawerna)

Krótko: jak budujemy mapy, żeby wszystko leżało równo i wyglądało profesjonalnie. Dotyczy agentów i narzędzi
(generatorów map). Narzędzia: `tools/mapy/` (katalog kafli, kontrola map, przegląd, zestawy z palety).
Ostatni przegląd map agentów: [docs/mapy/PRZEGLAD.md](mapy/PRZEGLAD.md).

## 1. Narzędzia i obowiązkowa kontrola

| co | polecenie | wynik |
|---|---|---|
| katalog kafli | `python tools/mapy/katalog.py` | `tools/mapy/katalog.json`, podglądy `docs/mapy/katalog_08.png` ... `_12.png` |
| kontrola mapy | `python tools/mapy/kontrola.py 105` (`--nowe` tylko nowa część powiększonej mapy, `--obszar x0,y0,x1,y1`, `--dane DIR` mapa z folderu roboczego) | raport na ekranie + `docs/mapy/kontrola_Map105.png` |
| przegląd map agentów | `python tools/mapy/przeglad.py` | `docs/mapy/PRZEGLAD.md` + obrazki |
| zestawy z palety | `python tools/mapy/zestawy.py 101` | `tools/mapy/zestawy.json` + `docs/mapy/zestawy_Map101.png` |
| poprawki map | `python tools/mapy/popraw.py plan 105` / `obrazy` / `instaluj` | `tools/mapy/staging/`, `docs/mapy/poprawki_Map105.png`, zapis do `data/` |

- **Każda mapa zbudowana albo zmieniona przez agenta przechodzi kontrolę przed instalacją** (najlepiej na kopii roboczej:
  `--dane tools/<narzędzie>/staging`). Zero błędów; każda uwaga poprawiona albo opisana w raporcie dla użytkownika.
- Katalog odbudowuje się po zmianie map wzorcowych albo flag zestawu kafli. Mapy wzorcowe (z nich katalog uczy się, co
  jest dobre): Map001 tawerna, Map019 dom dziadka, Map025 i Map026 pokoje, Map101 paleta miasteczka, Map008 miasteczko
  (`mapylib.WZORCE`). Map001 jest tylko do odczytu.
- Kody kontroli: Z zdarzenia, P przedmioty i blaty, O obiekty rozcięte, G gwiazdki i „wchodzenie pod / na”, D dostęp,
  W wąskie przejścia (pełna lista w `PRZEGLAD.md` i na górze `kontrola.py`).

## 2. Kratki i warstwy

- Kratka = 48 px. Mapa wnętrza: zestaw kafli 8 (Winlu Interior), podziemia 10/12, plener 9/11 (Winlu Exterior).
- Warstwa 0-1: podłoże (A1-A5: podłoga, ściany, trawa, woda, dywany autokaflowe).
- Warstwa 2: mebel (B-E). Warstwa 3: to, co leży na meblu, albo górna część obiektu nachodząca na inny kafel.
- Zdarzenie: to, co się rusza, świeci, ma akcję albo nie istnieje w kaflach (obrazy postaci `!...`).
- Obiekt z arkusza stawiamy **w całości**: wszystkie kafle, które na arkuszu stykają się krawędziami (ramki w
  `katalog_NN.png`). Bez dołu albo bez góry wychodzi „pół stołka”, „regał bez nóg” (kontrola: O1).
- Kafel przechodni ('O') nie może leżeć na warstwie 3 nad blokującym meblem ('X') - wtedy bohater wchodzi na stół (P4).

## 3. Blaty: gdzie kłaść przedmioty

- Przedmiot leży tylko na **blacie**: stół, lada, komoda, szafka, beczka, skrzynia, półka. W `katalog_NN.png` blaty
  z map wzorcowych mają zielone tło i liczbę `B12`; w `katalog.json`: `kafle[id].blat`.
- Punkt podparcia (dla płaskich rzeczy środek, dla wysokich podstawa) musi być na **płaskim wierzchu** mebla, nie na
  przedniej krawędzi, nogach ani za tylną krawędzią, i nie może wystawać z boku (P2).
- Stół dwurzędowy z arkusza C: wierzch zaczyna się w dolnej połowie górnego kafla i kończy w górnej połowie dolnego.
  Kafel-przedmiot (warstwa 3) kładziemy na **górny rząd**; zdarzenie z obrazkiem 48x96 (`!Decoration2`, `!Tavern_Props`)
  rysuje się wyżej niż jego kratka - sprawdzamy kontrolą, gdzie naprawdę wyląduje.
- W mapach wzorcowych podstawa przedmiotu leży 28-40 px od góry kratki blatu (mediana 32 px).
- Rzecz **płaska** (talerz, chleb, księga, zwój, deska; także otwarta księga ukosem - obrys prawie kwadratowy, ale
  wypełniony do połowy) leży na blacie **cała**: za tylną krawędź wystaje najwyżej 10 px, z przedniej zwisa najwyżej
  5 px (wzorce: 9 / 4) - inaczej P2 „wystaje za tylną krawędź” / „zwisa z przedniej krawędzi” (2026-10-22, księgi
  w bibliotece Map173).
- Gdy taki przedmiot nie mieści się w żadnej kratce stołu dwurzędowego (28 px rzeczy na ~42 px wierzchu na dwóch
  kratkach), kładziemy go jako **zdarzenie** z obrazkiem tego kafla (pod postacią, bez poleceń) z notatką `<Px:0,dy>`
  - TawernaCore rysuje obrazek przesunięty o piksele. `popraw.py` robi to sam (próbuje dy -20..20 co 4, wybiera
  najdalej od krawędzi, rzeczy w jednym rzędzie stołu na tej samej wysokości).
- Świeca, talerz, dzban nie stoją na podłodze tuż przed stołem (P3). Rzeczy na łóżku, krześle, piecu - nie (P1).

## 4. Gwiazdki: nad postacią / pod postacią

- Kafel z gwiazdką rysuje się nad bohaterem. Wolno nią oznaczać tylko **górę wysokiego obiektu, którego dół blokuje**
  (regał, szafa, drzewo, łuk drzwi, belka). Gwiazdka nad wolną podłogą bez podstawy = bohater wchodzi pod mebel (G1).
- Odwrotnie: górny kafel stojącego obiektu bez gwiazdki na kratce, na którą da się wejść = bohater staje na meblu (G2).
- Zdarzenia: wysoki obraz „pod postacią” (priorytet 0) nie może sięgać wolnej kratki nad sobą (G4); „nad postacią”
  (priorytet 2) tylko rzeczy z sufitu, np. żyrandol (G5). Obraz szerszy niż kratka zdarzenia blokuje sąsiednie kratki
  tagiem `<Occupy:left=1,right=1>` - inaczej bohater wchodzi w obraz (G3, W1).
- Region 3 (RegionLayers.js) podnosi kafle nad bohatera, region 1 zawsze przepuszcza, region 2 zawsze blokuje -
  kontrola to uwzględnia.

## 5. Odstępy (liczby z dobrych map)

- Główne przejścia co najmniej 2 kratki; przejścia 1-kratkowe to w dobrych mapach tylko 6% podłogi (szczeliny między meblami).
- Odstęp między meblami w rzędzie: 1-3 kratki (mediana 3). Krzesło przy stole: 0 kratek (dosunięte).
- Przed drzwiami/wejściem wolne co najmniej 3-4 kratki na wprost (w dobrych mapach mediana 5; 0-1 kratki tylko w 8%).
- Meble stoją plecami do ściany; około 30% kratek mebli styka się ze ścianą, środek pokoju zostaje wolny.
- Bez martwych kratek: każde miejsce, na którym da się stać, jest osiągalne od wejścia (D1); każda rzecz z akcją ma
  wolną kratkę obok (D4), zdarzenie z akcją na ścianie ma priorytet „jak postać” (inaczej nie da się go użyć).

## 6. Wejścia i wyjścia

- Miejsce przybycia (przeniesienie z innej mapy) jest wolne i nie stoi na nim zdarzenie (D3).
- Drzwi/wyjście w przerwie ściany, osiągalne z wnętrza (D2). Na plenerze wyjście na krawędzi otwiera całą krawędź
  (Krawedzie.js) - krawędź po tej stronie ma być przejezdna.
- Nowe zdarzenia na mapach tylko z numerami 1-499 (500+ to zakresy wtyczek).

## 7. Światło, styl, postacie

- Każde światło to ogień: świeca, latarnia, kominek, kosz żarowy z `<Light:...>` w ciepłych kolorach (migotanie); słońce
  tylko przez okna (`<LightCone ... when=day>`), żadnych zimnych/elektrycznych świateł.
- Styl Winlu: kafle z zestawów Winlu, nowe grafiki w tym stylu (PixelLab), widok prosto z przodu (płaska fasada,
  dach z góry), cienki piksel i kontur 1 px jak drzewa.
- Postacie (NPC, goście, fabuła) w stylu bohatera (PixelLab pro na wzór HeroLook), nie arkusze RTP People/Actor.
- Mapy plenerowe: **wszystkie obiekty to zdarzenia** (drzewa, krzaki, kamienie, kłody, pnie - typy jak na Map003), kafle
  tylko na podłoże (A2: trawa, ziemia, ścieżki, kwiaty). Drzewa i kamienie nie stoją na wodzie ani na licu urwiska (Z3).

## 8. Paleta wnętrz (dla użytkownika)

Zestawy ułożone ręką użytkownika są najlepszym wzorem: agenci biorą z nich całe meble z przedmiotami.

1. W edytorze: nowa mapa (np. „Paleta wnętrz”), zestaw kafli **8 Wilu Fantasy Interior**, rozmiar dowolny (np. 60x40).
   Nikt na nią nie przenosi - nie jest częścią świata.
2. Ułóż zestawy: np. stół kuchenny z chlebem i świecą, łóżko z szafką nocną, kącik kowala, ladę sklepu. Między
   zestawami zostaw co najmniej jedną pustą kratkę.
3. Obrysuj albo zamaluj każdy zestaw **regionem** (zakładka R, ołówek lub prostokąt). Numer regionu = kategoria,
   najlepiej 10 lub wyżej (np. 10 kuchnia, 11 sypialnia, 12 warsztat). Zestaw = spójny obszar jednego regionu.
4. W środku zestawu (albo na ramce) postaw **puste zdarzenie** (bez obrazka, bez poleceń) i nazwij je nazwą zestawu,
   np. „Stół kuchenny z chlebem”. W notatce zdarzenia można dopisać `<Opis:...>`, `<Kategoria:kuchnia>`, `<PrzyScianie>`.
5. Zapisz i daj znać numer mapy. Agent uruchamia `python tools/mapy/zestawy.py <numer>`: zestawy trafiają do
   `tools/mapy/zestawy.json` (kafle warstw 0-3, cienie, zdarzenia, blokowane kratki, blaty), podgląd do
   `docs/mapy/zestawy_MapNNN.png`. W kodzie: `zestawy.wstaw(mapa, zestaw, x, y)`.

Paleta miasteczka Map101 już działa (zdarzenia-nagłówki „== Nazwa (SxW) ==”): `python tools/mapy/zestawy.py 101`.

## 9. Zasady użytkownika

(Do uzupełnienia przez użytkownika - te zasady wygrywają z wszystkim powyżej.)

-
-
-

## 10. Poprawki map (etap 2, zrobione 2026-10-22)

- Narzędzie `tools/mapy/popraw.py`: `plan` (poprawki + kopia robocza `tools/mapy/staging/`), `obrazy` (zrzuty
  `docs/mapy/poprawki_MapNNN.png`), `instaluj [--czekaj MIN]`, `stan`. Poprawka = lista operacji ze starą wartością
  (kafel, region, położenie / priorytet / notatka zdarzenia); instalacja nakłada je na plik z dysku w chwili zapisu i
  zatrzymuje mapę, gdy cokolwiek się nie zgadza. Edytor musi być zamknięty; kopie w
  `Tawerna_archiwum_2026-10-18/dane_przed_poprawkami_map/`.
- Jak poprawiamy: obiekt rozcięty - przesunąć pod ścianę i dołożyć dół, dołożyć brakującą część, a resztkę 1-2 kafli
  usunąć; gwiazdka nad wolną podłogą - kratka zablokowana regionem 2 (RegionLayers) albo kafel usunięty; przedmiot -
  na sąsiednią kratkę tego samego mebla, jak najdalej od krawędzi; rzecz z akcją na ścianie - priorytet „jak postać”,
  niewidoczne „oglądanie” o kratkę na część mebla, przed którą da się stanąć; zastawione przejście - przesunąć zastawę.
  Decyzje ręczne (po obejrzeniu zrzutów): `RECZNE` i `RECZNE_OPS` w `popraw.py`.
- Generatory map mają bramkę jakości `kontrola.bramka()`: `tools/wnetrza/build.py --install` (błędy i nowe uwagi
  zatrzymują mapę, `--mimo-uwag` przepuszcza uwagi), `tools/powieksz/install.py` (błędy zatrzymują, uwagi się wypisują),
  `tools/rozszerzenia/instaluj.py --mapa` (jak wnętrza, `--mimo-uwag`).
- Wynik i to, co zostało do decyzji: `docs/mapy/PRZEGLAD.md`, sekcje „Po etapie 2” i „Do poprawy przez użytkownika”.
