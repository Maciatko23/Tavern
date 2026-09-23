//=============================================================================
// Farming.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Uprawa i budowanie: ziemia po kłodach, pieńkach i kamieniach -> grabie -> motyka -> nasiona -> wzrost -> zbiór, plus budowa płotu, ławki, ogniska, kurnika, ula, skrzyń, pieca ziemnego, tartaku (stołu do ręcznego piłowania), kompostownika, browaru, piekarni, cegielni i kuźni. Budowle z desek, kilof i gwoździe robi się samemu, małe kamienie leżą na ziemi. Zbieractwo (kamienie, len, jagody, grzyby, zioła), gotowanie na ognisku, pułapki, oprawianie, garbarnia, wędzarnia, studnia z konewką, wędkowanie, legowisko i owczarnia. Podlewanie konewką przyspiesza wzrost, sadzenie zależy od pory roku. Warsztat, w którym powstają i montują się wszystkie narzędzia, piła z żelaznego ostrza oraz namiot: zszyty w garbarni, rozkładany i składany, do spania, oraz odpoczynek na trawie bez żadnego budynku. v1.13.0
 * @author Claude
 * @orderAfter DayNightCycle
 * @orderAfter SurvivalHUD
 * @orderAfter ChoppableTree
 * @orderAfter Farming_Data
 *
 * @param farmRegion
 * @text Region ziemi uprawnej
 * @desc Kratki namalowane tym regionem zawsze nadają się do grabienia i budowy (także na kamieniu czy piasku, jeśli są przechodnie). 0 = wyłączone.
 * @type number
 * @min 0
 * @max 255
 * @default 6
 *
 * @param autoGround
 * @text Każda trawa i ziemia na zewnątrz nadaje się pod uprawę
 * @desc Włączone: przed graczem każda przechodnia kratka z trawą lub ziemią (bez obiektów, zdarzeń i bez kamienia, drewna, wody) ma opcje grabienia i budowy. Wyłączone: tylko ziemia po usuniętych obiektach i region uprawny.
 * @type boolean
 * @default true
 *
 * @param blockRegion
 * @text Region zakazu uprawy
 * @desc Kratki namalowane tym regionem nigdy nie są polem (np. podwórko, ścieżka przed drzwiami). 0 = wyłączone.
 * @type number
 * @min 0
 * @max 255
 * @default 7
 *
 * @param rakeItem
 * @text Przedmiot: grabie
 * @type item
 * @default 65
 *
 * @param hoeItem
 * @text Przedmiot: motyka
 * @type item
 * @default 66
 *
 * @param woodItem
 * @text Przedmiot: drewno (materiał budowlany)
 * @type item
 * @default 61
 *
 * @param stoneItem
 * @text Przedmiot: kamień (materiał budowlany)
 * @type item
 * @default 64
 *
 * @param shovelItem
 * @text Przedmiot: łopata (kopanie ziemi)
 * @type item
 * @default 62
 *
 * @param soilItem
 * @text Przedmiot: ziemia
 * @type item
 * @default 78
 *
 * @param charcoalItem
 * @text Przedmiot: węgiel drzewny
 * @type item
 * @default 79
 *
 * @param branchItem
 * @text Przedmiot: gałęzie (do kompostu)
 * @type item
 * @default 77
 *
 * @param planksItem
 * @text Przedmiot: deski
 * @type item
 * @default 80
 *
 * @param beerItem
 * @text Przedmiot: piwo
 * @type item
 * @default 81
 *
 * @param flourItem
 * @text Przedmiot: mąka
 * @type item
 * @default 82
 *
 * @param breadItem
 * @text Przedmiot: chleb
 * @type item
 * @default 83
 *
 * @param brickItem
 * @text Przedmiot: cegła
 * @type item
 * @default 84
 *
 * @param ironOreItem
 * @text Przedmiot: ruda żelaza
 * @type item
 * @default 85
 *
 * @param ironItem
 * @text Przedmiot: żelazo
 * @type item
 * @default 86
 *
 * @param wateringCanItem
 * @text Przedmiot: konewka
 * @type item
 * @default 87
 *
 * @param seasonLength
 * @text Długość pory roku (dni)
 * @desc Rok = 4 pory roku tej długości (wiosna, lato, jesień, zima), licząc od dnia 1.
 * @type number
 * @min 1
 * @default 28
 *
 * @param staminaWater
 * @text Wytrzymałość: podlewanie
 * @type number
 * @min 0
 * @default 2
 *
 * @param staminaDig
 * @text Wytrzymałość: kopanie ziemi
 * @type number
 * @min 0
 * @default 4
 *
 * @param staminaRake
 * @text Wytrzymałość: grabienie
 * @type number
 * @min 0
 * @default 3
 *
 * @param staminaHoe
 * @text Wytrzymałość: orka
 * @type number
 * @min 0
 * @default 5
 *
 * @param staminaPlant
 * @text Wytrzymałość: siew
 * @type number
 * @min 0
 * @default 1
 *
 * @param staminaHarvest
 * @text Wytrzymałość: zbiór
 * @type number
 * @min 0
 * @default 1
 *
 * @param seedChance
 * @text Szansa znalezienia nasion przy grabieniu (%)
 * @type number
 * @min 0
 * @max 100
 * @default 12
 *
 * @param growthSpeed
 * @text Tempo wzrostu roślin (%)
 * @desc 100 = zgodnie z tabelą, 200 = dwa razy szybciej.
 * @type number
 * @min 10
 * @default 100
 *
 * @param waterCanCharges
 * @text Konewka: ile podlań na jedno napełnienie
 * @type number
 * @min 1
 * @default 6
 *
 * @param staminaFish
 * @text Wytrzymałość: zarzucenie wędki
 * @type number
 * @min 0
 * @default 2
 *
 * @param hammerItem
 * @text Przedmiot: młotek
 * @type item
 * @default 89
 *
 * @param staminaBuildHit
 * @text Wytrzymałość: jedno uderzenie młotkiem przy budowie
 * @type number
 * @min 0
 * @default 2
 *
 * @param nailsItem
 * @text Przedmiot: gwoździe
 * @type item
 * @default 88
 *
 * @param pickaxeItem
 * @text Przedmiot: kilof
 * @type item
 * @default 63
 *
 * @param staminaPickup
 * @text Wytrzymałość: podniesienie kamyka
 * @type number
 * @min 0
 * @default 1
 *
 * @param stoneDensity
 * @text Małe kamienie na ziemi: gęstość (% kafelków trawy)
 * @desc Kamyki leżą na wolnych kafelkach trawy i ziemi. Podnosi się je przyciskiem akcji, bez narzędzia. 0 = brak.
 * @type number
 * @min 0
 * @max 30
 * @default 5
 *
 * @param stoneRespawnDays
 * @text Małe kamienie: po ilu dniach wracają
 * @type number
 * @min 1
 * @default 4
 *
 * @command clearArea
 * @text Oczyść ziemię (obszar)
 * @desc Zamienia prostokąt kratek na tej mapie w oczyszczoną ziemię, gotową do grabienia i budowy.
 *
 * @arg x
 * @text X (lewy górny róg)
 * @type number
 * @default 0
 *
 * @arg y
 * @text Y (lewy górny róg)
 * @type number
 * @default 0
 *
 * @arg width
 * @text Szerokość (kratki)
 * @type number
 * @min 1
 * @default 1
 *
 * @arg height
 * @text Wysokość (kratki)
 * @type number
 * @min 1
 * @default 1
 *
 * @help
 * ============================================================================
 * Farming.js
 * ============================================================================
 * SKĄD BIORĄ SIĘ POLA
 *   1) Każda zwykła ziemia na zewnątrz: kratka przed graczem, po której da się
 *      chodzić, z trawą lub ziemią na dole (rozpoznaje to po wyglądzie kafla),
 *      bez obiektów na wyższych warstwach i bez zdarzeń. Kamień, drewno, woda,
 *      ściany, klify, płoty i krzewy nie są polem.
 *   2) Ziemia po zniszczonej kłodzie, pieńku albo kamieniu (ChoppableTree):
 *      staje się oczyszczonym polem, nawet jeśli to nie trawa.
 *   3) Kratki pomalowane regionem z parametru "Region ziemi uprawnej" albo
 *      ustawione poleceniem "Oczyść ziemię".
 *   Sterowanie na mapie (notatka mapy): <Farm:off> wyłącza pola na całej mapie,
 *   <Farm:on> włącza je (domyślnie są włączone wszędzie poza mapami z
 *   <Dark:on>, czyli wnętrzami). Region z parametru "Region zakazu uprawy"
 *   (domyślnie 7) wyklucza pojedyncze kratki, np. podwórko przy drzwiach.
 *
 * JAK SIĘ Z TYM PRACUJE (przycisk akcji, twarzą do kratki)
 *   Oczyszczona ziemia: po kolei "Odpocznij na ziemi" (tylko na trawie), "Wytwórz...", "Wykop ziemię",
 *                       "Zagrab ziemię" (grabie) i na końcu "Postaw...".
 *                       "Wytwórz..." to młotek i lina bez budynku (wszystkie inne narzędzia powstają w warsztacie);
 *                       "Postaw..." to namiot, wiadro i leśne legowisko - stają od razu, bez młotka.
 *                       Prawdziwe budynki (młotek + plac budowy) są tylko pod klawiszem Q, nie w menu ziemi.
 *   Zagrabiona ziemia:  "Wytwórz...", "Wykop ziemię", "Zaoraj ziemię" (motyka), "Postaw...".
 *   Żadne menu nie ma pozycji "Zostaw": zamyka je anuluj (P, Esc, prawy przycisk myszy).
 *   Zaorana ziemia:     "Zasiej" jednym z posiadanych nasion.
 *   Rosnąca roślina:    pokazuje, ile dni zostało; można ją podlać albo wyrwać.
 *   Dojrzała roślina:   przycisk akcji od razu ją zbiera, a pole wraca do
 *                       stanu zaoranej ziemi (z dobrym zbiorem wypadają też nasiona).
 *   Budowla:            akcje zależne od rodzaju (odpoczynek, zbiór jaj / miodu)
 *                       oraz "Rozbierz" (zwraca połowę materiałów).
 *   Grabienie i orka kosztują wytrzymałość (SurvivalHUD); zagrabiając, czasem
 *   znajdziesz nasiona. Rośliny rosną z upływem dni gry (też podczas snu i
 *   gdy jesteś na innej mapie).
 *   Postać naprawdę pracuje: grabie i motyka to zamach z narzędziem, a siew,
 *   zbiór, wyrywanie roślin, zbieranie jajek i miodu oraz stawianie budowli to
 *   kucanie (animacje z ChoppableTree; bez arkuszy akcja dzieje się od razu).
 *
 * KLAWISZE NA MAPIE
 *   WASD lub strzałki: ruch (WASD ustawia FreeMovement.js).
 *   O: OK / akcja, P: anuluj / wróć (zamiast Z i X; działają też Enter, Spacja, Esc).
 *   Q: menu budowy z każdego miejsca (w chatce: meble). E: menu jedzenia, czyli
 *   wszystko jadalne z plecaka, a przy zaznaczonej potrawie dymek z tym, co
 *   daje (wytrzymałość, sytość, nawodnienie, premie, świeżość). OK zjada
 *   i zostaje w menu, Q lub E ponownie zamyka, a drugi klawisz przełącza
 *   na drugie menu. W oknach Q i E przewijają strony (zakładki dziennika,
 *   ilość przenoszona w skrzyni), a przy stawianiu budynku odbijają go jak R.
 *
 * BUDOWANIE
 *   Klawisz Q (z każdego miejsca) otwiera listę prawdziwych budynków (młotek i plac budowy). To, co się
 *   stawia od razu bez młotka (namiot, wiadro, leśne legowisko), jest w menu ziemi pod "Postaw...".
 *   Po wyborze jednej pokazuje siatkę wokół gracza i półprzezroczysty obraz budowli,
 *   którym sterujesz strzałkami albo myszą (kursor zaczyna przed graczem, zasięg to
 *   6 kratek). Zielone kratki: da się tu postawić, czerwone: nie (na dole napis,
 *   dlaczego). OK lub kliknięcie wyznacza PLAC BUDOWY, Anuluj lub prawy przycisk
 *   wraca. Po wyznaczeniu placu płotu tryb trwa dalej, żeby dało się oznaczyć cały
 *   rząd. Materiały znikają z ekwipunku od razu (są "dowiezione na plac").
 *   Plac budowy to oznaczone ziemia (kołki i przerywana ramka) i blady obraz
 *   budowli. Budowa NIE dzieje się sama: postać musi podejść, stanąć przodem do
 *   placu i mieć MŁOTEK. Każde naciśnięcie przycisku akcji to jedno uderzenie
 *   młotkiem (kosztuje wytrzymałość, parametr), a budowla rośnie od dołu, aż po
 *   ostatnim uderzeniu jest gotowa. Liczba uderzeń zależy od wielkości budowli.
 *   Pierwsze naciśnięcie otwiera menu (zacznij / zrezygnuj ze zwrotem materiałów);
 *   po pierwszym uderzeniu budowę trzeba dokończyć. Nie ma tu kucania. Budowle blokują przejście. Ognisko migocze i nocą
 *   rzuca ciepły blask (godzina z wtyczki DayNightCycle).
 *
 * ZIEMIA
 *   Na oczyszczonej i zagrabionej ziemi (także na zwykłej trawie) jest opcja
 *   "Wykop ziemię": łopatą wykopujesz 2-3 sztuki ziemi (kosztuje wytrzymałość).
 *   Ziemia jest potrzebna do budowy pieca i do wypału.
 *
 * SKRZYNIE (mała: 12 rodzajów przedmiotów, duża: 30, po 99 sztuk każdego)
 *   "Otwórz" pokazuje dwa okna: plecak (lewe) i skrzynię (prawe).
 *   Strzałki w lewo / w prawo przełączają stronę, przycisk OK przenosi
 *   zaznaczony przedmiot na drugą stronę, Q i E (PageUp / PageDown) zmieniają
 *   ilość przenoszoną naraz (1, 5, 10, wszystko). Przedmiotów fabularnych
 *   (narzędzi) nie da się schować. Pełnej skrzyni nie można rozebrać.
 *
 * ZBIERACTWO (małe kamienie, suche gałęzie, dziki len, jagody, grzyby, zioła)
 *   Na trawie i ziemi leżą małe kamienie (jak gęsto: parametr) i suche gałęzie.
 *   Stajesz twarzą do kamyka i przyciskiem akcji go podnosisz (bez narzędzia,
 *   kosztuje odrobinę wytrzymałości). Po kilku dniach w tym miejscu leży nowy.
 *   To pierwsze surowce w grze: młotek (gałęzie, kamienie, len), a z nim warsztat
 *   (gałęzie, kamienie, len) da się zrobić bez żadnego narzędzia. Dziki len to włókno
 *   na linę (wiosna, lato, jesień); są też jagody (lato, jesień), grzyby (jesień)
 *   i zioła (wiosna, lato). Co gdzie leży, jest stałe dla kratki; zebrane wracają
 *   po kilku dniach.
 *
 * WODA
 *   Stając przodem do wody (staw) albo studni, przyciskiem akcji: napełnisz
 *   konewkę (mieści kilka podlań, potem jest pusta), napijesz się (+8 wytrzymałości)
 *   albo zarzucisz wędkę (ryby biorą najlepiej o świcie i o zmierzchu, gorzej zimą).
 *   Deszcz (wtyczka Survival) podlewa wszystkie zaorane pola.
 *
 * JEDZENIE, MIĘSO I SKÓRY
 *   Ognisko piecze mięso, ryby, ziemniaki i jajka (zwykłe stanowisko z recepturami),
 *   kociołek gotuje zupy i wywary, wędzarnia wędzi mięso i ryby, garbarnia wyprawia
 *   skóry i szyje buty, plecak i płaszcz. Pułapka łapie zwierzynę, którą oprawiasz
 *   nożem z menu Przedmioty. Owczarnia daje wełnę, legowisko pozwala się przespać w
 *   terenie. Jedzenie zjadasz z menu (opis w Survival.js).
 *
 * CRAFTING (warsztat, piec ziemny, tartak, kompostownik, browar, piekarnia, cegielnia, kuźnia)
 *   Menu każdego budynku z przepisami (też ogniska, trójnogu i kociołka) ma dwie zakładki: najpierw
 *   "Przepis" (same przepisy; póki coś jest w środku, są wyszarzone z powodem), potem "Akcja" (to, co
 *   się pali lub piecze i "Zbierz", ogrzanie się, dokładanie drewna, rozbudowa, rozbiórka). Otwiera się na "Przepis";
 *   strzałki lewo / prawo (albo Q / E) przełączają zakładki, góra / dół wybierają.
 *   Każde stanowisko ma własne receptury. Są dwa rodzaje:
 *   - "w tle" (ogień, fermentacja, rozkład): oddajesz surowce, a po ustalonej
 *     liczbie godzin gry (liczy się też, gdy jesteś na innej mapie lub śpisz)
 *     odbierasz gotowy produkt;
 *   - RĘCZNE ("manual": piłowanie desek, montaż narzędzi, kucie gwoździ): to robota rąk, więc
 *     nie dzieje się sama. Wykonujesz ją od razu, płacisz wytrzymałością, a czas
 *     gry mija na twoich oczach (ekran przygasa). Można ją zrobić także wtedy, gdy
 *     w tym samym budynku pali się wypał (kuźnia: kowadło obok pieca).
 *   Receptura może wymagać narzędzia w plecaku ("tool", nie zużywa się): tartak z
 *   piłą tnie deski szybciej i daje ich więcej.
 *   Progresja: gałęzie, kamienie i len z ziemi -> młotek (ręcznie) -> warsztat ->
 *   kamienna siekiera -> drewno -> tartak (deski) -> kamienny kilof, łopata, grabie,
 *   motyka -> budowle z desek -> cegielnia -> cegły -> kuźnia i piekarnia ->
 *   ruda (kilof) + węgiel (piec) -> żelazo -> gwoździe, ostrza i głowice (kuźnia) ->
 *   żelazne narzędzia i piła (warsztat) -> duża skrzynia i browar. Piec ziemny dymi, gdy pracuje, i nocą lekko
 *   świeci; nad gotowym produktem unosi się jego ikona. Jedna budowla = jeden
 *   wypał naraz. Kuźnia potrzebuje rudy żelaza - to nowy rodzaj kamienia do
 *   wydobycia kilofem (ChoppableTree), rdzawe żyłki na szarej skale.
 *   Nowe receptury i stanowiska dopisuje się w tablicy BUILDINGS jako "recipes" -
 *   cała reszta (menu, czas, zbiór) działa sama.
 *
 * ROZMIARY BUDYNKÓW I WYBIEGI (w x h pól)
 *   Budynek stoi na dolnym rzędzie swojego obrysu, a obraz wznosi się nad nim; kratka (x, y) to lewy dolny róg.
 *   Stanowiska (piece, tartak, browar, garbarnia, serowarnia, kociołek), studnia i namiot zajmują
 *   3 x 2 pola (browar 4 x 2, spiżarnia 3 x 2), warsztat 2 x 1. Obora (8 x 5), owczarnia i kurnik (6 x 5) to OGRODZONE WYBIEGI: płot na
 *   obwodzie z furtką w środku frontu, szopa pod tylnym płotem, a reszta to wolna ziemia, po której chodzą
 *   prawdziwe zwierzęta (wtyczka Livestock). Do środka wchodzi się furtką; wolnej ziemi wybiegu nie da się
 *   ani kopać, ani obsiewać. W tablicy BUILDINGS: w, h, yard { gate, hut { dx, dy, w, h }, animal, count }.
 *   Budynki postawione przed powiększeniem (bez znacznika v) zachowują swój dawny rozmiar i obraz
 *   (BUILDINGS[typ].legacy), więc stare zapisy się nie sypią.
 *
 * WODA I BUKŁAK (głód i pragnienie: wtyczka Needs)
 *   "Napij się" przy stawie albo studni gasi pragnienie (+40). Bukłak (Zrób bukłak w menu
 *   Wytwórz...: surowa skóra i len) mieści 4 łyki; "Napełnij bukłak" przy wodzie, a pije się z niego
 *   klawiszem G lub z menu Przedmioty.
 *
 * ODPOCZYNEK NA ZIEMI (bez żadnego budynku)
 *   Na zwykłej, nietkniętej trawie (nie na zaoranej ani zagrabionej ziemi) pierwszą pozycją menu jest
 *   "Odpocznij na ziemi": gracz siada na trawie i siedzi bez ruchu, z rękami złożonymi na kolanach;
 *   co 3 minuty gry +1 wytrzymałości. Wstaje, gdy się ruszysz albo wypocznie do pełna.
 *
 * LEŚNE LEGOWISKO (pierwsze spanie w terenie)
 *   W menu ziemi "Wytwórz..." robisz je z 6 gałęzi i 3 lnu (jedno naraz), a potem rozkładasz w
 *   "Postaw..." od razu, bez młotka. "Prześpij noc" działa jak w namiocie (czas do rana,
 *   podsumowanie dnia, autozapis), ale siły wracają tylko do 60% (w deszczu, śniegu i zimą
 *   do 40%; w tablicy BUILDINGS: sleepRestore, sleepBad). Rozbierz zwraca 3 gałęzie i len.
 *
 * NAMIOT (spanie w terenie)
 *   Garbarnia szyje namiot (skóry, lina, drewno; można mieć tylko jeden). Namiot to
 *   przedmiot: w menu ziemi "Postaw..." > Namiot stawiasz go od razu, bez młotka
 *   i placu budowy. Przy rozstawionym namiocie (przycisk akcji) jest "Prześpij noc":
 *   ekran gaśnie, czas leci do rana (godzina z wtyczki SurvivalHUD), wracają wszystkie
 *   siły i zdrowie, dziennik pokazuje podsumowanie dnia, a gra zapisuje się sama
 *   (tak samo jak po nocy w łóżku). "Złóż namiot" zwija go z powrotem w przedmiot,
 *   który zabierasz ze sobą. W tablicy BUILDINGS: instant (bez placu budowy),
 *   pack (przedmiot, do którego się składa), sleep (można w nim spać).
 *
 * NABIAŁ I SPIŻARNIA
 *   Obora daje mleko (2 dzbany dziennie, najwyżej 6), serowarnia zsiada je na ser
 *   (3 mleka -> 1 ser, długi wypał w tle). Spiżarnia to skrzynia tylko na jedzenie:
 *   wszystko, co w niej leży, starzeje się pięć razy wolniej (wtyczka Spoilage). Zepsute
 *   jedzenie zamienia kompostownik w ziemię.
 *
 * PROCA, ŁUK, NAPRAWY
 *   W warsztacie robi się procę (amunicja: kamienie), łuk i strzały (6 sztuk naraz); polowanie
 *   opisuje wtyczka Hunting. Narzędzia zużywają się (wtyczka Durability): w warsztacie jest
 *   "Napraw: ..." dla każdego nadwerężonego narzędzia. Receptury "manual" ze startSe "Hammer" (kucie,
 *   montaż) pokazują zamach młotkiem, a "Slash1" (piłowanie) ruch grabi.
 *
 * PODLEWANIE I PORY ROKU
 *   "Podlej" (konewka) na zaoranej ziemi przyspiesza wzrost o 20% na dzień
 *   podlania i dzień następny - trzeba wracać co 1-2 dni, żeby bonus nie wygasł.
 *   Rok dzieli się na 4 pory (wiosna, lato, jesień, zima), każdą z nasion można
 *   siać tylko w jej porach - napis przy sadzeniu mówi, kiedy się nie da.
 *
 * DODAWANIE NOWYCH ROŚLIN I BUDOWLI
 *   W kodzie wtyczki są dwie tablice: CROPS (nasiona, plon, dni wzrostu, wiersz
 *   w obrazku img/system/Farm_Crops.png: 4 klatki na roślinę) oraz BUILDINGS
 *   (koszt, szerokość w kratkach, obrazek img/system/Farm_*.png, odpoczynek,
 *   produkcja, "slots" = schowek albo "recipes" = receptury stanowiska
 *   craftingu). Przedmioty (nasiona, plony) dodajesz w bazie danych.
 *
 * POWIĄZANE WTYCZKI
 *   ChoppableTree - zwalnia ziemię po zniszczonych obiektach i pokazuje animacje
 *                   grabienia, orki i kucania. SurvivalHUD - wytrzymałość i napisy nad
 *                   graczem. DayNightCycle - upływ dni, odpoczynek przesuwa czas.
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "Farming";
    Input.keyMapper[82] = "flip";   // R: mirror the building that is being placed
    Input.keyMapper[69] = "pagedown";   // E, beside Q (= pageup): on the map Q opens the build menu and E the food menu, in windows they still page (W walks now: FreeMovement.js)
    Input.keyMapper[191] = "grid";   // the "?" key (keyCode 191, the "/" and "?" key): toggles a ground grid overlay, see Sprite_TileGrid in Farming_Render.js
    const params = PluginManager.parameters(pluginName);
    const num = (value, fallback) =>
        value !== undefined && value !== "" && isFinite(Number(value)) ? Number(value) : fallback;

    const FARM_REGION = num(params.farmRegion, 6);
    const BLOCK_REGION = num(params.blockRegion, 7);
    const AUTO_GROUND = params.autoGround !== "false";
    const ITEM = {
        rake: num(params.rakeItem, 65),
        hoe: num(params.hoeItem, 66),
        wood: num(params.woodItem, 61),
        stone: num(params.stoneItem, 64),
        shovel: num(params.shovelItem, 62),
        soil: num(params.soilItem, 78),
        charcoal: num(params.charcoalItem, 79),
        branch: num(params.branchItem, 77),
        planks: num(params.planksItem, 80),
        beer: num(params.beerItem, 81),
        flour: num(params.flourItem, 82),
        bread: num(params.breadItem, 83),
        brick: num(params.brickItem, 84),
        ironOre: num(params.ironOreItem, 85),
        iron: num(params.ironItem, 86),
        wateringCan: num(params.wateringCanItem, 87),
        nails: num(params.nailsItem, 88),
        hammer: num(params.hammerItem, 89),
        knifeStone: 90, knifeIron: 91, fiber: 92, rope: 93, rawMeat: 94, roastMeat: 95, rawHide: 96, hide: 97,
        fish: 98, roastFish: 99, rod: 100, carcass: 101, berries: 102, mushroom: 103, herb: 104,
        smokedMeat: 105, smokedFish: 106, scramble: 107, bakedPotato: 108, soup: 109, brew: 110, wool: 111,
        cloak: 112, boots: 113, backpack: 114, ironAxe: 115, ironPick: 116, potato: 71, carrot: 72, egg: 75,
        pickaxe: num(params.pickaxeItem, 63),
        axe: 60, sawBlade: 117, saw: 118, axeHead: 119, pickHead: 120, tent: 121, rot: 122, milk: 123, cheese: 124, sling: 125, bow: 126, arrows: 127, boughBed: 128, skin: 129,
        honey: 76, cabbage: 73, stew: 130, cabbageSoup: 131, mushroomSoup: 132, porridge: 133, grilledMushrooms: 134, bakedCheese: 135, berryPie: 136, mead: 137, bucket: 138, cauldronItem: 141, shears: 142, steel: 143, tongs: 144, bird: 145, feathers: 146,
        cone: 147, pineSeed: 148, nettle: 149, yarrow: 150, garlic: 151, bandage: 152, nettleSoup: 153, spear: 154, wildApple: 139, wildPear: 140   // stone axe (60) and pickaxe (63): made at the workbench; the saw and the iron heads: forged parts
    };
    // icon indices used in popup()/complain() calls that are not tied to a specific item (SurvivalHUD's stamina icon, Needs' thirst/hunger icons)
    const ICON = { stamina: 82, thirst: 391, hunger: 390 };
    const STAMINA = {
        dig: num(params.staminaDig, 4),
        water: num(params.staminaWater, 2),
        rake: num(params.staminaRake, 3),
        hoe: num(params.staminaHoe, 5),
        plant: num(params.staminaPlant, 1),
        harvest: num(params.staminaHarvest, 1),
        pickup: num(params.staminaPickup, 1),
        buildHit: num(params.staminaBuildHit, 2),
        fish: num(params.staminaFish, 2)
    };
    const CAN_MAX = Math.max(1, num(params.waterCanCharges, 6));
    const STONE_DENSITY = Math.max(0, Math.min(30, num(params.stoneDensity, 5))) / 100;
    const STONE_RESPAWN_DAYS = Math.max(1, num(params.stoneRespawnDays, 4));
    const SEED_CHANCE = num(params.seedChance, 12) / 100;
    const GROWTH = num(params.growthSpeed, 100) / 100;
    const SCARECROW_BONUS = 1.25;   // crops within 2 tiles of a scarecrow grow 25% faster
    const SCARECROW_RANGE = 2;
    const WATER_BONUS = 1.20;       // watered today or yesterday grows 20% faster
    const WATER_GRACE_DAYS = 1;

    // Four seasons of equal length, counted from day 1. 0 spring, 1 summer, 2 autumn, 3 winter.
    const SEASON_LENGTH = Math.max(1, num(params.seasonLength, 28));
    const SEASON_NAMES = ["Wiosna", "Lato", "Jesień", "Zima"];
    function seasonIndex(day) {
        return Math.floor(((Math.max(1, day) - 1) / SEASON_LENGTH) % 4);
    }
    function seasonOf(day) {
        return SEASON_NAMES[seasonIndex(day)];
    }

    // Kinds of swing in ChoppableTree (only used when they exist there).
    const RAKE_KIND = 4;
    const HOE_KIND = 5;
    const CROUCH_KIND = 6;   // sowing, harvesting, collecting
    const SIT_KIND = 11;     // sitting down by a fire to rest
    const ROAST_KIND = 12;   // sitting with a stick over the fire (the campfire's roasting recipes)
    const ROAST_WAIT_KIND = 13;   // sitting beside a tripod with the food hanging from it (hands free)
    const SIT_MAX_SECONDS = 8;   // however long the food takes, sitting by the fire never lasts longer than this many real seconds
    const HAMMER_KIND = 7;   // striking a building site
    const FISH_KIND = 8;     // casting a fishing rod
    const SHOVEL_KIND = 2;   // digging soil
    // LIE_KIND = 14 (Swing_LieDown) is no longer used by "Odpocznij na ziemi" (that now sits, see below) - the
    // sheet is kept in ChoppableTree.js in case a lying-down rest is wanted again somewhere else later.

    const DIG_YIELD = [2, 3];   // soil per dig

    const SE = {
        rake: "Earth2", hoe: "Earth3", plant: "Earth4", harvest: "Item3",
        build: "Hammer", demolish: "Break", rest: "Heal2", collect: "Item2", uproot: "Earth1",
        dig: "Earth5", kindle: "Fire2", chest: "Chest1", move: "Item1", water: "Liquid"
    };
    // sitting on the ground: no building needed, stays seated for as long as you like (moving away ends it),
    // +1 stamina every REST_TICK_MINUTES of game time - about REST_TICK_MINUTES real seconds at the usual clock speed
    const REST_TICK_MINUTES = 3;

    // ------------------------------------------------------------------
    // Content tables (crops, buildings, hand-made recipes): Farming_Data.js (loads before this file). Add your own crops / buildings there.
    // ------------------------------------------------------------------
    const { CROPS, BUILDINGS, HAND_RECIPES } = window.Farming_Data.build(ITEM);
    const CROP_IDS = Object.keys(CROPS);
    const BUILDING_IDS = Object.keys(BUILDINGS);

    const TILE = 48;

    // ------------------------------------------------------------------
    // Save data: $gameSystem._farm = { plots, buildings, nextId, rev }
    //   plots[mapId]["x,y"] = { s: "cleared" | "raked" | "tilled", crop, day }
    //   buildings[mapId] = [ { id, type, x, y, last, store?, job? } ]
    //     store (chests): { "i78": n, ... }   job (crafting): { recipe, start (game hours), hours, out: [item, n] }
    // rev grows on every change, so the drawing layer knows when to rebuild.
    // ------------------------------------------------------------------
    function farm() {
        const sys = $gameSystem;
        if (!sys._farm) sys._farm = { plots: {}, buildings: {}, nextId: 1, rev: 0 };
        return sys._farm;
    }
    function today() {
        return typeof $gameSystem.dayNightDay === "function" ? $gameSystem.dayNightDay() : 0;
    }
    const key = (x, y) => x + "," + y;
    const plotsOf = mapId => farm().plots[mapId] || (farm().plots[mapId] = {});
    const buildingsOf = mapId => farm().buildings[mapId] || (farm().buildings[mapId] = []);
    const changed = () => { farm().rev++; buildingIndexRev = -1; };

    // Ground that a destroyed object stood on becomes cleared land.
    Game_System.prototype.clearLand = function(mapId, tiles) {
        const plots = plotsOf(mapId);
        for (const t of tiles) {
            if (!plots[key(t.x, t.y)]) plots[key(t.x, t.y)] = { s: "cleared" };
        }
        changed();
    };

    // ---- ordinary ground: which tiles count as farmland without anything being cleared
    function mapAllowsFarming() {
        const note = ($dataMap && $dataMap.note) || "";
        const tag = /<Farm:\s*(on|off)\s*>/i.exec(note);
        if (tag) return tag[1].toLowerCase() === "on";
        return !/<Dark:\s*on\s*>/i.test(note);   // rooms with <Dark:on> are indoors
    }

    // Where a tile's picture lies in the tileset sheets: { set, x, y } (null for
    // tiles that are never ground: water, walls, roofs).
    function tilePicture(tileId) {
        if (Tilemap.isTileA1(tileId) || Tilemap.isTileA3(tileId) || Tilemap.isTileA4(tileId)) return null;
        if (Tilemap.isTileA2(tileId)) {
            const k = Tilemap.getAutotileKind(tileId) - 16;
            return { set: 1, x: (k % 8) * 96, y: Math.floor(k / 8) * 144 + 48 };   // the plain fill piece of the autotile
        }
        if (Tilemap.isTileA5(tileId)) {
            const i = tileId - Tilemap.TILE_ID_A5;
            return { set: 4, x: (i % 8) * TILE, y: Math.floor(i / 8) * TILE };
        }
        return {
            set: 5 + Math.floor(tileId / 256),
            x: ((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * TILE,
            y: (Math.floor((tileId % 256) / 8) % 16) * TILE
        };
    }

    // Soft ground looks like grass (green) or bare earth (brown/olive, not
    // reddish like wood, not grey like stone). Many decorative ground autotiles
    // (grass tufts, moss and dirt patches) are drawn as a soft, feathered blob
    // that does not fill its tile edge to edge, so a moderate opaque coverage is
    // enough to judge by colour; a tile that is (almost) fully transparent here
    // tells us nothing (some custom tilesets have blank, unused autotile kinds)
    // and is reported as null rather than "not soil".
    // -> "grass" | "earth" | false (not soft ground) | null (nothing drawn here);
    // the average colour of the opaque pixels is kept in `.tint` of the returned info.
    function soilKindOf(pixels) {
        let n = 0, opaque = 0, r = 0, g = 0, b = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            n++;
            if (pixels[i + 3] < 200) continue;
            opaque++; r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2];
        }
        if (opaque < n * 0.05) return { kind: null };     // nothing meaningful is drawn here
        if (opaque < n * 0.35) return { kind: false };    // too sparse to be the ground itself
        r /= opaque; g /= opaque; b /= opaque;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        if (d === 0) return { kind: false };
        let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h = (h * 60 + 360) % 360;
        const s = d / max, v = max / 255;
        const grass = h >= 110 && h <= 150 && s >= 0.30 && v >= 0.44;
        const earth = h >= 38 && h <= 98 && s >= 0.22 && s <= 0.42 && v >= 0.42 && v <= 0.62;
        return { kind: grass ? "grass" : earth ? "earth" : false, tint: [Math.round(r), Math.round(g), Math.round(b)] };
    }
    function looksLikeSoil(pixels) {
        const kind = soilKindOf(pixels).kind;
        return kind === null ? null : !!kind;
    }

    // { kind, tint } of a tile's picture, or undefined while its tileset image is still loading
    const soilTileCache = new Map();
    function tileGround(tileId) {
        const tileset = $gameMap.tileset();
        if (!tileset || tileId <= 0) return { kind: false };
        const k = tileset.id + ":" + tileId;
        if (soilTileCache.has(k)) return soilTileCache.get(k);
        const pic = tilePicture(tileId);
        let result = { kind: false };
        if (pic) {
            const bitmap = ImageManager.loadTileset(tileset.tilesetNames[pic.set]);
            if (!bitmap || !bitmap.isReady()) return undefined;   // not decided yet: ask again next time
            result = soilKindOf(bitmap.context.getImageData(pic.x + 10, pic.y + 10, 28, 28).data);
        }
        soilTileCache.set(k, result);
        return result;
    }

    // true / false, or null when the tile's picture is blank (nothing to judge).
    function isSoilTile(tileId) {
        const ground = tileGround(tileId);
        if (!ground) return false;
        return ground.kind === null ? null : !!ground.kind;
    }

    // What the player actually sees as ground: the upper autotile layer, unless
    // it turns out to be a blank autotile kind (kind null) - then the lower layer
    // underneath is what is visually shown instead.
    function groundInfoAt(x, y) {
        const upper = $gameMap.tileId(x, y, 1);
        if (upper > 0) {
            const ground = tileGround(upper);
            if (ground === undefined) return undefined;
            if (ground.kind !== null) return ground;
        }
        return tileGround($gameMap.tileId(x, y, 0));
    }
    function groundIsSoil(x, y) {
        const ground = groundInfoAt(x, y);
        return !!(ground && ground.kind);
    }
    function hasObjectTile(x, y) {
        return $gameMap.tileId(x, y, 2) > 0 || $gameMap.tileId(x, y, 3) > 0;
    }

    function naturalFarmland(x, y) {
        if (!$gameMap.isValid(x, y)) return false;
        const region = $gameMap.regionId(x, y);
        if (BLOCK_REGION > 0 && region === BLOCK_REGION) return false;
        if (!$gameMap.checkPassage(x, y, 0x0f)) return false;
        if (FARM_REGION > 0 && region === FARM_REGION) return true;   // painted by the author
        if (!AUTO_GROUND || !mapAllowsFarming()) return false;
        if ($gameMap.eventsXy(x, y).length > 0 || hasObjectTile(x, y)) return false;
        return groundIsSoil(x, y);
    }

    // The plot on a tile: the stored one, or a virtual "cleared" one on ordinary
    // ground (see naturalFarmland).
    // ---- the hut: the player's first house. Its inside is a map of its own (HUT_MAP: a 5 x 2 floor, the door is in the wall below it and leads to the door)
    // where furniture (the buildings marked indoor) is put with the same build menu. One hut per game.
    const HUT_MAP = 100;
    const HUT_ROOM = { x0: 1, x1: 5, y0: 3, y1: 4, doorX: 3, doorY: 5 };   // the floor of Map100 (5 x 2); the door is the doormat (doorX, doorY) in the wall below it, the floor tile in front of it (doorX, y1) stays free
    const isHutInterior = mapId => (mapId === undefined ? $gameMap.mapId() : mapId) === HUT_MAP;
    const hutFloor = (x, y) => x >= HUT_ROOM.x0 && x <= HUT_ROOM.x1 && y >= HUT_ROOM.y0 && y <= HUT_ROOM.y1 && !(x === HUT_ROOM.doorX && y === HUT_ROOM.y1);   // the part of the floor that can be furnished (all but the tile in front of the door)
    // the hut the player has (or is building): { b, mapId }
    function hutOf() {
        const all = farm().buildings || {};
        for (const mapId of Object.keys(all)) for (const b of all[mapId]) if (b.type === "hut") return { b, mapId: Number(mapId) };
        return null;
    }
    const hutDoorCell = h => ({ x: h.b.x + geoOf(h.b).door.dx, y: h.b.y });   // the doorway: a passable cell of the hut's bottom row
    // would the furniture leave the player without a way to the doormat? (a 4-neighbour walk over the floor)
    function hutShutsIn(type, x, y) {
        const px = $gamePlayer.x, py = $gamePlayer.y;
        if (px < HUT_ROOM.x0 || px > HUT_ROOM.x1 || py < HUT_ROOM.y0 || py > HUT_ROOM.y1) return false;
        const blocked = new Set(cellsOfGeo(BUILDINGS[type], x, y).map(c => key(c.x, c.y)));
        for (const b of farm().buildings[HUT_MAP] || []) for (const c of cellsOfGeo(geoOf(b), b.x, b.y)) blocked.add(key(c.x, c.y));
        const seen = new Set([key($gamePlayer.x, $gamePlayer.y)]), queue = [[$gamePlayer.x, $gamePlayer.y]];
        while (queue.length) {
            const [cx, cy] = queue.shift();
            if (cx === HUT_ROOM.doorX && cy === HUT_ROOM.y1) return false;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = cx + dx, ny = cy + dy, k = key(nx, ny);
                if (nx < HUT_ROOM.x0 || nx > HUT_ROOM.x1 || ny < HUT_ROOM.y0 || ny > HUT_ROOM.y1 || seen.has(k) || blocked.has(k)) continue;
                seen.add(k);
                queue.push([nx, ny]);
            }
        }
        return true;
    }
    // furniture that stands where the floor is no longer (an older, smaller room) goes back to the bag, chests emptied first
    function hutSanitize(say) {
        const list = farm().buildings[HUT_MAP];
        if (!list || !list.length) return;
        let moved = 0;
        for (const b of list.slice()) {
            const g = geoOf(b);
            if (cellsOfGeo(g, b.x, b.y).every(c => hutFloor(c.x, c.y))) continue;
            for (const s of isChest(b) ? chestStacks(b) : []) takeFromChest(b, s.item, s.n);
            if (isChest(b) && chestKinds(b) > 0) continue;   // the bag is full: leave it, nothing is lost
            for (const [id, n] of g.cost) $gameParty.gainItem(itemOf(id), n);
            list.splice(list.indexOf(b), 1);
            moved++;
        }
        if (moved) {
            changed();
            if (say) popup(itemOf(ITEM.planks).iconIndex, "Meble z chatki wróciły do plecaka", "#f3e0a0");
        }
    }
    function hutDoorAt(x, y) {
        const h = hutOf();
        if (!h || h.b.site || h.mapId !== $gameMap.mapId()) return null;
        const d = hutDoorCell(h);
        return d.x === x && d.y === y ? h.b : null;
    }

    function plotAt(x, y, mapId) {
        mapId = mapId === undefined ? $gameMap.mapId() : mapId;
        const stored = (farm().plots[mapId] || {})[key(x, y)];
        if (stored) return stored;
        if (mapId === $gameMap.mapId() && isHutInterior(mapId) && hutFloor(x, y)) return { s: "floor", indoor: true };   // the floor of the hut: ground for furniture
        if (mapId === $gameMap.mapId() && bushSolid(x, y, mapId)) return null;   // a bush grows there
        if (mapId === $gameMap.mapId() && naturalFarmland(x, y)) return { s: "cleared", natural: true };
        return null;
    }
    // a virtual plot becomes a stored one as soon as something is done on it (indoors nothing is stored: there is no soil)
    function ensurePlot(x, y) {
        if (isHutInterior()) return { s: "floor", indoor: true };
        const plots = plotsOf($gameMap.mapId());
        if (!plots[key(x, y)]) plots[key(x, y)] = { s: "cleared" };
        return plots[key(x, y)];
    }

    // A new building marks its ground as cleared land; the tiles that were plain natural ground before are remembered (b.claimed), so that
    // taking the building away (bucket, tent, demolishing, giving up a site) gives the ground back as it was, unless it was worked on meanwhile
    function claimGround(tiles) {
        const fresh = [];
        if (isHutInterior()) return fresh;
        const plots = plotsOf($gameMap.mapId());
        for (const t of tiles) {
            const k = key(t.x, t.y);
            if (!plots[k]) { fresh.push(k); plots[k] = { s: "cleared" }; }
        }
        return fresh;
    }
    function releaseGround(b, mapId) {
        const plots = farm().plots[mapId];
        if (!plots || !b.claimed) return;
        for (const k of b.claimed) {
            const p = plots[k];
            if (p && p.s === "cleared" && !p.crop && !p.dug && p.watered === undefined) delete plots[k];
        }
        changed();
    }

    // ---- buildings
    // A building covers w x h tiles, anchored at the bottom-left tile (x, y): the cells are (x + i, y - j). Its picture stands on the
    // bottom row and rises above it. A YARD (cowshed, coop, sheep pen) is a fenced field: the fence is the outer ring of cells (with a
    // gate in the bottom row), the hut stands inside at yard.hut, everything else is open ground for the animals and for the player.
    // Buildings put up before the sizes grew (no b.v) keep the size they had: BUILDINGS[type].legacy; v:2 ones (first round of
    // bigger buildings) keep BUILDINGS[type].v2 where a later round changed the type again; new ones are v:3.
    // A building may be put down mirrored (b.flip): the picture is turned over and everything that sits at a place of the picture moves
    // with it: the door, the gate and the hut of a yard, the chimney, the hook of a tripod.
    const mirrorCache = new WeakMap();
    function mirrorGeo(g) {
        let m = mirrorCache.get(g);
        if (m) return m;
        m = Object.assign({}, g, { flipped: true });
        if (g.door) m.door = Object.assign({}, g.door, { dx: g.w - 1 - g.door.dx });
        if (g.yard) m.yard = Object.assign({}, g.yard, { gate: g.w - 1 - g.yard.gate, hut: Object.assign({}, g.yard.hut, { dx: g.w - g.yard.hut.dx - g.yard.hut.w }) });
        if (g.ventX) m.ventX = -g.ventX;
        if (g.hang && g.hang.x) m.hang = Object.assign({}, g.hang, { x: -g.hang.x });
        mirrorCache.set(g, m);
        return m;
    }
    const geoOf = b => {
        const def = BUILDINGS[b.type] || { w: 1 };
        let g = def;
        if (!b.v && def.legacy) g = Object.assign({}, def, { ventX: 0 }, def.legacy, { yard: undefined });
        else if (b.v === 2 && def.v2) g = Object.assign({}, def, def.v2);   // put up in the first round of bigger buildings
        return b.flip ? mirrorGeo(g) : g;
    };
    function cellsOfGeo(g, x, y) {
        const out = [];
        for (let j = 0; j < (g.h || 1); j++) for (let i = 0; i < g.w; i++) out.push({ x: x + i, y: y - j, i, j });
        return out;
    }
    const onRing = (g, i, j) => i >= 0 && j >= 0 && i < g.w && j < (g.h || 1) && (i === 0 || j === 0 || i === g.w - 1 || j === (g.h || 1) - 1);
    const inHut = (g, i, j) => !!g.yard && i >= g.yard.hut.dx && i < g.yard.hut.dx + g.yard.hut.w && j >= g.yard.hut.dy && j < g.yard.hut.dy + g.yard.hut.h;
    // does the cell keep the player out? A yard is its ring of fence (but the gate) plus the hut inside it. Everything else - an ordinary
    // building, or a house (def.door) - only blocks its front row (j === 0, the one the picture stands on and, for a house, its doorway):
    // the rows behind it, where the picture rises above the tiles without anything actually built on them, are open ground - the player
    // can step a little onto the building, the same way a tree's canopy is free to walk under even though its trunk blocks the tile it grows from.
    function isSolidCell(g, i, j) {
        if (g.door) return j === 0 && i !== g.door.dx;   // a house: its front row is solid but for the doorway; the rows behind are open, same as any tall building
        if (g.yard) {
            if (onRing(g, i, j)) return !(j === 0 && i === g.yard.gate);
            return inHut(g, i, j);
        }
        return j === 0;
    }
    // the open ground inside a yard (where the animals walk): [{ x, y }]
    function yardInterior(b) {
        const g = geoOf(b);
        if (!g.yard) return [];
        return cellsOfGeo(g, b.x, b.y).filter(c => !onRing(g, c.i, c.j) && !inHut(g, c.i, c.j));
    }
    let buildingIndex = {}, solidIndex = {}, buildingIndexRev = -1, buildingIndexMap = -1;
    function buildingIndexFor(mapId) {
        if (buildingIndexRev !== farm().rev || buildingIndexMap !== mapId) {
            buildingIndex = {};
            solidIndex = {};
            for (const b of farm().buildings[mapId] || []) {
                const g = geoOf(b);
                for (const c of cellsOfGeo(g, b.x, b.y)) {
                    buildingIndex[key(c.x, c.y)] = b;
                    if (isSolidCell(g, c.i, c.j)) solidIndex[key(c.x, c.y)] = b;
                }
            }
            buildingIndexRev = farm().rev;
            buildingIndexMap = mapId;
        }
        return buildingIndex;
    }
    function buildingAt(x, y, mapId) {
        mapId = mapId === undefined ? $gameMap.mapId() : mapId;
        return buildingIndexFor(mapId)[key(x, y)] || null;
    }
    const solidAt = (x, y, mapId) => {
        buildingIndexFor(mapId === undefined ? $gameMap.mapId() : mapId);
        return solidIndex[key(x, y)] || null;
    };

    const _Game_Map_isPassable = Game_Map.prototype.isPassable;
    Game_Map.prototype.isPassable = function(x, y, d) {
        if (solidAt(x, y, this.mapId()) || bushSolid(x, y, this.mapId())) return false;
        return _Game_Map_isPassable.call(this, x, y, d);
    };

    // ---- things lying about on the ground, picked up by hand (no tool): small stones, wild flax (fibre),
    // berries, mushrooms and herbs. Where they lie is fixed by the tile (a hash) and the season decides which
    // of them are out; only the picked ones are saved: $gameSystem._farm.stones[mapId]["x,y"] = the day
    // (they grow back later).
    let stoneRev = 0;   // bumped when one is taken, so the drawing layer refreshes
    const gatherRev = () => stoneRev;   // Farming_Render.js reads the counter through this (a plain export would freeze at its value at load time)
    const stonesOf = mapId => {
        const f = farm();
        if (!f.stones) f.stones = {};
        return f.stones[mapId] || (f.stones[mapId] = {});
    };
    // share = the part of the tiles that hold this kind; the kinds follow one another on the hash line (stones first)
    const GATHER = {
        stone: { item: ITEM.stone, share: STONE_DENSITY, respawn: STONE_RESPAWN_DAYS, count: [1, 1] },
        fiber: { item: ITEM.fiber, share: 0.06, respawn: 3, count: [1, 2], seasons: [0, 1, 2] },
        berries: { item: ITEM.berries, share: 0.035, respawn: 4, count: [1, 3], seasons: [1, 2] },
        mushroom: { item: ITEM.mushroom, share: 0, respawn: 4, count: [1, 2], seasons: [0, 1, 2] },   // no fixed tiles: they grow and vanish (mushroomBirth)
        bush: { item: ITEM.berries, share: 0, respawn: 0, count: [2, 4] },   // berry bushes: berries, then the bare bush gives fibre (bushState)
        herb: { item: ITEM.herb, share: 0.03, respawn: 4, count: [1, 2], seasons: [0, 1] },
        branch: { item: ITEM.branch, share: 0.05, respawn: 3, count: [1, 2] },
        // the wild herbs came later: after the branches on the hash line, so the older kinds keep their tiles
        nettle: { item: ITEM.nettle, share: 0.025, respawn: 4, count: [2, 3], seasons: [0, 1, 2] },   // stings bare hands (pickGather)
        yarrow: { item: ITEM.yarrow, share: 0.018, respawn: 5, count: [1, 2], seasons: [1, 2] },
        garlic: { item: ITEM.garlic, share: 0.018, respawn: 5, count: [1, 3], seasons: [0, 1] },
        cone: { item: ITEM.cone, share: 0, respawn: 5, count: [1, 3] }   // no share: only under a standing pine (coneTiles)
    };
    const GATHER_KINDS = Object.keys(GATHER);
    const BUSH_SHARE = 0.02;        // the part of the tiles that hold a berry bush
    const MUSHROOM_POOL = 0.14;     // the part of the tiles where a mushroom may grow
    const MUSHROOM_LIFE = 3;        // days a mushroom stays before it is gone
    const CONE_SHARE = 0.22;        // the part of the free tiles under a pine where cones lie
    function gatherKindOf(x, y) {
        if (hash2(x, y, 811) < BUSH_SHARE) return "bush";
        const r = hash2(x, y, 301);
        let acc = 0;
        for (const k of GATHER_KINDS) {
            acc += GATHER[k].share;
            if (r < acc) return k;
        }
        if (coneTiles().has(key(x, y)) && hash2(x, y, 907) < CONE_SHARE) return "cone";
        return hash2(x, y, 733) < MUSHROOM_POOL ? "mushroom" : null;
    }
    // ---- cones fall under the pines: the tiles within 2 of a standing pine (a "!$Pine_..." picture, not felled; a pine planted by
    // Forestry.js only once it has grown up). Worked out again each day and when the map or its events change.
    let coneCache = { stamp: "", tiles: new Set() };
    function coneTiles() {
        if (!$gameMap || !$dataMap) return coneCache.tiles;
        // (asked on every passability check through bushSolid: the stamp is kept cheap, no copy of the event list)
        const stamp = $gameMap.mapId() + ":" + today() + ":" + $gameMap._events.length;
        if (coneCache.stamp === stamp) return coneCache.tiles;
        const tiles = new Set();
        for (const e of $gameMap.events()) {
            const data = e.event(), page = data && data.pages && data.pages[0];
            if (!page || !/Pine/.test(page.image.characterName || "") || e._plantedGrowth < 1) continue;
            if ($gameSelfSwitches.value([e._mapId, e._eventId, "A"])) continue;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx || dy) tiles.add(key(e.x + dx, e.y + dy));
        }
        coneCache = { stamp, tiles };
        return tiles;
    }
    // ---- mushrooms: on a tile of the pool a new one may appear each day (seldom; in the days after rain many more; never in winter) and it stays for
    // MUSHROOM_LIFE days unless it is picked. Nothing is stored except the day it was picked.
    const rainOn = day => { const p = window.Survival && Survival.weatherPlan ? Survival.weatherPlan(day) : null; return !!p && p.type === "rain"; };
    function mushroomChance(day) {
        const base = [0.003, 0.004, 0.008, 0][seasonIndex(day)];
        return Math.min(0.9, base * (rainOn(day) || rainOn(day - 1) ? 14 : 1));
    }
    // the day the mushroom that stands on the tile now was born (the newest of the last MUSHROOM_LIFE days), or null
    function mushroomBirth(x, y) {
        const day = today();
        for (let d = day; d > day - MUSHROOM_LIFE && d >= 1; d--) {
            if (hash2(x * 5 + d * 101, y * 7 + d * 29, 741) < mushroomChance(d)) return d;
        }
        return null;
    }
    // ---- berry bushes: full (berries), picked -> bare for 4 days (then it fruits again) or, picked bare, gone for 8 days (then it grows back);
    // in winter it stands bare. farm().bushes[mapId]["x,y"] = { stage: "empty" | "gone", day }
    const bushesOf = mapId => {
        const f = farm();
        if (!f.bushes) f.bushes = {};
        return f.bushes[mapId] || (f.bushes[mapId] = {});
    };
    function bushState(x, y) {
        const rec = ((farm().bushes || {})[$gameMap.mapId()] || {})[key(x, y)], day = today(), fruit = seasonIndex(day) !== 3;
        if (!rec) return fruit ? "full" : "empty";
        if (rec.stage === "gone") return day - rec.day >= 8 ? (fruit ? "full" : "empty") : "gone";
        return day - rec.day >= 4 && fruit ? "full" : "empty";
    }
    // a bush keeps the player out (a cache: the answer changes only with the day, a pick or a building)
    const bushCache = new Map();
    function bushSolid(x, y, mapId) {
        if (gatherKindOf(x, y) !== "bush") return false;
        const stamp = today() + ":" + stoneRev + ":" + farm().rev, k = mapId + ":" + x + "," + y, c = bushCache.get(k);
        if (c && c.stamp === stamp) return c.solid;
        const solid = !!(mapId === $gameMap.mapId() && gatherAt(x, y) === "bush");
        bushCache.set(k, { stamp, solid });
        return solid;
    }
    // the kind that lies on a tile (in this season), false, or undefined while the ground pictures are still loading
    function gatherSpot(x, y) {
        const kind = gatherKindOf(x, y);
        if (!kind) return false;
        if (!$gameMap.isValid(x, y) || !AUTO_GROUND || !mapAllowsFarming()) return false;
        if (BLOCK_REGION > 0 && $gameMap.regionId(x, y) === BLOCK_REGION) return false;
        if (!$gameMap.checkPassage(x, y, 0x0f)) return false;
        if ($gameMap.eventsXy(x, y).length > 0 || hasObjectTile(x, y)) return false;
        if ((farm().plots[$gameMap.mapId()] || {})[key(x, y)] || buildingAt(x, y)) return false;   // cleared or built-on ground has none
        const g = GATHER[kind];
        if (g.seasons && !g.seasons.includes(seasonIndex(today()))) return false;
        if (kind === "mushroom" && mushroomChance(today()) <= 0 && mushroomBirth(x, y) === null) return false;
        const ground = groundInfoAt(x, y);
        if (ground === undefined) return undefined;
        return ground && ground.kind ? kind : false;
    }
    function gatherAt(x, y) {
        const kind = gatherSpot(x, y);
        if (!kind) return false;
        if (kind === "bush") return bushState(x, y) === "gone" ? false : "bush";
        const picked = ((farm().stones || {})[$gameMap.mapId()] || {})[key(x, y)];
        if (kind === "mushroom") {
            const born = mushroomBirth(x, y);
            return born !== null && (picked === undefined || born > picked) ? kind : false;
        }
        return picked === undefined || today() - picked >= GATHER[kind].respawn ? kind : false;
    }
    // the small-stone view of the same thing (kept for events and tests)
    function stoneSpot(x, y) {
        const kind = gatherSpot(x, y);
        return kind === undefined ? undefined : kind === "stone";
    }
    const stoneAt = (x, y) => gatherAt(x, y) === "stone";
    function pickGather(x, y) {
        const kind = gatherAt(x, y);
        if (!kind) return false;
        if (kind === "bush") return pickBush(x, y);
        const g = GATHER[kind], item = itemOf(g.item), n = rand(g.count);
        if (!spaceFor(item, n)) { complainNoSpace(item); return false; }
        const sting = kind === "nettle";   // nettles sting bare hands: a little more strength, and a word about it once a day
        if (!spendStamina(STAMINA.pickup + (sting ? 1 : 0))) return false;
        swingThen(CROUCH_KIND, () => {
            stonesOf($gameMap.mapId())[key(x, y)] = today();
            stoneRev++;
            playSe(SE.collect, 105);
            $gameParty.gainItem(item, n);
            if (sting && farm().stungDay !== today()) {
                farm().stungDay = today();
                popup(item.iconIndex, "Pokrzywa parzy! (-1 wytrzymałości)", "#ffb070");
            }
        });
        return true;
    }
    const pickStone = pickGather;
    // a bush with berries gives berries and stays bare; a bare bush gives fibre and is gone for a while
    function pickBush(x, y) {
        const full = bushState(x, y) === "full", item = itemOf(full ? ITEM.berries : ITEM.fiber), n = full ? rand(GATHER.bush.count) : rand([1, 2]);
        if (!spaceFor(item, n)) { complainNoSpace(item); return false; }
        if (!spendStamina(STAMINA.pickup)) return false;
        swingThen(CROUCH_KIND, () => {
            bushesOf($gameMap.mapId())[key(x, y)] = { stage: full ? "empty" : "gone", day: today() };
            stoneRev++;
            playSe(SE.collect, full ? 108 : 95);
            $gameParty.gainItem(item, n);
            if (!full) popup(item.iconIndex, "Krzak poszedł na włókna", "#cfe6a8");
        });
        return true;
    }

    // ---- water: the can, a drink, fishing
    const canCharges = () => (farm().can ? farm().can.charges : CAN_MAX);   // a new can is full
    const setCanCharges = n => { farm().can = { charges: Math.max(0, Math.min(CAN_MAX, n)) }; };
    function isWaterTile(x, y) {
        if (!$gameMap.isValid(x, y)) return false;
        for (let z = 0; z < 2; z++) {
            const id = $gameMap.tileId(x, y, z);
            if (id > 0 && Tilemap.isWaterTile(id)) return true;
        }
        return false;
    }
    // src: a bucket to take the water from (its portions run out); without it the water is unlimited (a pond, a well)
    const bucketEmpty = () => complain(itemOf(ITEM.bucket).iconIndex, "Wiadro jest puste");
    function fillCan(src) {
        const can = itemOf(ITEM.wateringCan);
        if (!$gameParty.hasItem(can)) { complain(can.iconIndex, "Nie masz konewki"); return false; }
        if (canCharges() >= CAN_MAX) { complain(can.iconIndex, "Konewka jest pełna"); return false; }
        if (src && bucketUnits(src) < 1) { bucketEmpty(); return false; }
        swingThen(CROUCH_KIND, () => {
            let now = CAN_MAX;
            if (src) {
                const take = Math.min(CAN_MAX - canCharges(), bucketUnits(src));
                takeBucketWater(src, take);
                now = canCharges() + take;
            }
            setCanCharges(now);
            playSe(SE.water, 100);
            popup(can.iconIndex, (now >= CAN_MAX ? "Konewka pełna (" : "Konewka (") + now + "/" + CAN_MAX + ")", "#9fd4ff");
        });
        return true;
    }
    const needsOn = () => !!window.Needs && Needs.enabled();
    const thirsty = () => needsOn() && Needs.state().water < 95;
    function drink(src) {
        const tired = typeof $gameSystem.staminaRatio === "function" && $gameSystem.staminaRatio() < 0.98;
        if (!thirsty() && !(tired && !needsOn())) { complain(ICON.thirst, "Nie chce ci się pić"); return false; }
        if (src && bucketUnits(src) < 1) { bucketEmpty(); return false; }
        swingThen(CROUCH_KIND, () => {
            if (src) takeBucketWater(src, 1);
            if (needsOn()) {
                const got = Needs.drink(Needs.TAP_DRINK);
                $gameSystem.changeStamina(3);
                playSe(SE.water, 105);
                popup(ICON.thirst, "Nawodnienie +" + got, "#9fd4ff");
            } else {
                $gameSystem.changeStamina(8);
                playSe(SE.water, 105);
                popup(ICON.stamina, "+8 wytrzymałości", "#9ff0a8");
            }
        });
        return true;
    }
    function fillSkin(src) {
        const skin = itemOf(ITEM.skin);
        if (!needsOn() || !Needs.ownsSkin()) { complain(skin.iconIndex, "Potrzebujesz bukłaka"); return false; }
        if (Needs.skinCharges() >= Needs.SKIN.max) { complain(skin.iconIndex, "Bukłak jest pełny"); return false; }
        if (src && bucketUnits(src) < 1) { bucketEmpty(); return false; }
        swingThen(CROUCH_KIND, () => {
            if (src) {
                const take = Math.min(Needs.SKIN.max - Needs.skinCharges(), bucketUnits(src));
                takeBucketWater(src, take);
                Needs.state().skin = Needs.skinCharges() + take;
            } else {
                Needs.fillSkin();
            }
            playSe(SE.water, 100);
            popup(skin.iconIndex, (Needs.skinCharges() >= Needs.SKIN.max ? "Bukłak pełny (" : "Bukłak (") + Needs.skinCharges() + "/" + Needs.SKIN.max + ")", "#9fd4ff");
        });
        return true;
    }
    function fillBucket(src) {
        const bucket = itemOf(ITEM.bucket), max = BUILDINGS.bucket.rain.max;
        if (!ownsBucket()) { complain(bucket.iconIndex, "Potrzebujesz wiadra"); return false; }
        if (bagWater() >= max) { complain(bucket.iconIndex, "Wiadro jest pełne"); return false; }
        if (src && bucketUnits(src) < 1) { bucketEmpty(); return false; }
        swingThen(CROUCH_KIND, () => {
            let now = max;
            if (src) {
                const take = Math.min(max - bagWater(), bucketUnits(src));
                takeBucketWater(src, take);
                now = bagWater() + take;
            }
            setBagWater(now);
            playSe(SE.water, 100);
            popup(bucket.iconIndex, (now >= max ? "Wiadro pełne (" : "Wiadro (") + now + "/" + max + ")", "#9fd4ff");
        });
        return true;
    }
    function goFishing() {
        if (!requireItem(ITEM.rod) || !spendStamina(STAMINA.fish)) return false;
        const rod = itemOf(ITEM.rod);
        swingThen(FISH_KIND, () => {
            useTool(ITEM.rod);
            lockPlayer(130);
            playSe(SE.water, 90);
            popup(rod.iconIndex, "Zarzucasz wędkę...", "#cfe6ff");
            later(96, () => {
                const hour = $gameSystem.dayNightHour();
                let chance = 0.5 + ((hour >= 5 && hour < 8) || (hour >= 17 && hour < 20) ? 0.25 : 0) + (["rain", "storm"].includes($gameScreen.weatherType()) ? 0.1 : 0) - (seasonIndex(today()) === 3 ? 0.2 : 0);
                if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(1);
                const roll = Math.random();
                if (roll < chance) {
                    playSe(SE.harvest, 105);
                    $gameParty.gainItem(itemOf(ITEM.fish), Math.random() < 0.25 ? 2 : 1);
                } else if (roll < chance + 0.15) {
                    $gameParty.gainItem(itemOf(ITEM.fiber), 1);   // waterweed
                } else {
                    complain(rod.iconIndex, "Nic nie bierze");
                }
            });
        });
        return true;
    }
    // src: the bucket the water comes from (its portions), none for a well or a pond
    const hasWater = src => !src || bucketUnits(src) >= 1;
    const portions = src => (src ? "\nWiadro: " + bucketUnits(src) + "/" + BUILDINGS[src.type].rain.max + " porcji deszczówki." : "");
    function canEntry(src) {
        const can = itemOf(ITEM.wateringCan), have = $gameParty.hasItem(can);
        return { name: "Napełnij konewkę", icon: can.iconIndex, right: have ? canCharges() + "/" + CAN_MAX : "", enabled: have && canCharges() < CAN_MAX && hasWater(src),
            help: (have ? "Konewka mieści " + CAN_MAX + " podlań." : "Nie masz konewki. Wykuje się ją w kuźni.") + portions(src), run: () => fillCan(src) };
    }
    function drinkEntry(src) {
        return { name: "Napij się", icon: 391, right: needsOn() ? "+" + Needs.TAP_DRINK : "+8", enabled: (thirsty() || (!needsOn() && $gameSystem.staminaRatio() < 0.98)) && hasWater(src),
            help: (needsOn() ? "Chłodna woda gasi pragnienie (+" + Needs.TAP_DRINK + ") i trochę odświeża." : "Chłodna woda odświeża.") + portions(src), run: () => drink(src) };
    }
    function skinEntry(src) {
        const have = needsOn() && Needs.ownsSkin(), max = needsOn() ? Needs.SKIN.max : 4;
        return { name: "Napełnij bukłak", icon: itemOf(ITEM.skin).iconIndex, right: have ? Needs.skinCharges() + "/" + max : "", enabled: have && Needs.skinCharges() < max && hasWater(src),
            help: (have ? "Bukłak mieści " + max + " łyki po " + Needs.SKIN.sip + ". Pijesz z niego klawiszem G albo z menu Przedmioty." : "Nie masz bukłaka. Zrobisz go z surowej skóry w menu „Wytwórz...”.") + portions(src), run: () => fillSkin(src) };
    }
    function bucketEntry(src) {
        const max = BUILDINGS.bucket.rain.max, have = ownsBucket();
        return { name: "Napełnij wiadro", icon: itemOf(ITEM.bucket).iconIndex, right: have ? bagWater() + "/" + max : "", enabled: have && bagWater() < max && hasWater(src),
            help: (have ? "Wiadro mieści " + max + " porcji wody. Potrzebne do gotowania w kociołku." : "Nie masz wiadra. Wykujesz je w kuźni z desek i żelaza.") + portions(src), run: () => fillBucket(src) };
    }
    function wellEntries() {
        return [drinkEntry(), skinEntry(), canEntry(), bucketEntry()];
    }
    // ---- the bucket: it collects rain by itself, hour by hour of the weather plan (Survival.weatherPlan), also while the player is away
    function rainHoursBetween(h0, h1) {
        if (!(window.Survival && Survival.weatherPlan) || !(h1 > h0)) return 0;
        let total = 0;
        const d0 = Math.floor(h0 / 24), d1 = Math.min(Math.floor(h1 / 24), d0 + 60);
        for (let day = d0; day <= d1; day++) {
            const plan = Survival.weatherPlan(day);
            if (!plan || plan.type !== "rain") continue;
            const a = Math.max(h0, day * 24 + plan.start), z = Math.min(h1, day * 24 + plan.end);
            if (z > a) total += z - a;
        }
        return total;
    }
    function bucketSync(b) {
        const def = BUILDINGS[b.type];
        if (!def || !def.rain || b.site) return 0;
        const now = clockHours();
        if (b.wt === undefined || now < b.wt) b.wt = now;
        if (now > b.wt) {
            b.water = Math.min(def.rain.max, (b.water || 0) + rainHoursBetween(b.wt, now) * def.rain.rate);
            b.wt = now;
        }
        return b.water || 0;
    }
    const bucketUnits = b => Math.floor(bucketSync(b) + 1e-6);
    function takeBucketWater(b, n) {
        b.water = Math.max(0, bucketSync(b) - n);
        changed();
    }
    // The bucket you carry in the bag: one shared water level (like the waterskin/watering can), not tracked per
    // item copy - RPG Maker items only count how many you have, not per-instance state, and the game already
    // solves this the same way for those two.
    const ownsBucket = () => $gameParty.hasItem(itemOf(ITEM.bucket));
    const bagWater = () => $gameSystem._bagWater || 0;
    function setBagWater(n) {
        $gameSystem._bagWater = Math.max(0, Math.min(BUILDINGS.bucket.rain.max, n));
        changed();
    }
    const bagWaterWeight = () => bagWater();   // 1 weight unit per carried portion (Survival.js reads this)
    const CROP_LIFT = -8;    // sown plants are drawn this many pixels higher: their pictures stand on the bottom edge of the tile, this puts them in the middle
    const BUCKET_REACH = 3;   // how far from a plot a bucket still waters it (tiles)
    function bucketFor(x, y) {
        let best = null, bestD = 1e9;
        for (const b of buildingsOf($gameMap.mapId())) {
            if (!BUILDINGS[b.type] || !BUILDINGS[b.type].rain || b.site || bucketUnits(b) < 1) continue;
            const d = Math.max(Math.abs(b.x - x), Math.abs(b.y - y));
            if (d <= BUCKET_REACH && d < bestD) { best = b; bestD = d; }
        }
        return best;
    }
    function pourOut(b) {
        if (bucketUnits(b) < 1) return false;
        swingThen(CROUCH_KIND, () => {
            b.water = 0;
            changed();
            playSe(SE.water, 90);
            popup(itemOf(ITEM.bucket).iconIndex, "Wylano wodę", "#9fd4ff");
        });
        return true;
    }
    function bucketEntries(b) {
        const max = BUILDINGS[b.type].rain.max, n = bucketUnits(b);
        return [{ name: n >= 1 ? "Woda w wiadrze: " + n + "/" + max : "Wiadro jest puste", icon: itemOf(ITEM.bucket).iconIndex, right: n + "/" + max, enabled: false,
                help: n >= 1 ? "Deszczówka zebrana w wiadrze. Pijesz ją, napełniasz nią konewkę i bukłak albo podlewasz rośliny w pobliżu." : "Wiadro zbiera deszcz: każda godzina deszczu to jedna porcja (do " + max + ")." },
            drinkEntry(b), skinEntry(b), canEntry(b), bucketEntry(b),
            { name: "Wylej wodę", icon: itemOf(ITEM.bucket).iconIndex, enabled: n >= 1, help: "Wylewasz wodę na ziemię.", run: () => pourOut(b) }];
    }
    function waterMenu() {
        const rod = itemOf(ITEM.rod), have = $gameParty.hasItem(rod);
        return { title: "Woda", entries: [
            { name: "Zarzuć wędkę", icon: rod.iconIndex, right: "-" + STAMINA.fish, enabled: have,
                help: have ? "Ryby biorą najlepiej o świcie i o zmierzchu. Wędkowanie trwa około godziny." : "Potrzebujesz wędki. Robi się ją przy tartaku.", run: goFishing },
            drinkEntry(), skinEntry(), canEntry(), bucketEntry()] };
    }
    // rain waters every tilled plot
    function rainWater() {
        const plots = farm().plots || {};
        for (const mapId of Object.keys(plots)) {
            for (const k of Object.keys(plots[mapId])) {
                if (plots[mapId][k].s === "tilled") plots[mapId][k].watered = today();
            }
        }
        changed();
    }

    // ---- growth
    function scarecrowNear(x, y) {
        return buildingsOf($gameMap.mapId()).some(b => b.type === "scarecrow" && !b.site &&
            Math.abs(b.x - x) <= SCARECROW_RANGE && Math.abs(b.y - y) <= SCARECROW_RANGE);
    }
    // watered today or on the day before still gets the bonus - a day's grace so
    // missing one watering does not immediately undo it
    function wateredRecently(plot) {
        return !!plot && plot.watered !== undefined && today() - plot.watered <= WATER_GRACE_DAYS;
    }
    // plot is optional: callers that only care about the location (e.g. deciding
    // whether to build a scarecrow) can leave it out and get no watering bonus.
    function growthRate(x, y, plot) {
        return GROWTH * (scarecrowNear(x, y) ? SCARECROW_BONUS : 1) * (wateredRecently(plot) ? WATER_BONUS : 1);
    }
    function grownDays(x, y, plot) {
        return Math.floor(Math.max(0, today() - plot.day) * growthRate(x, y, plot));
    }
    function isRipe(x, y, plot) {
        return !!plot.crop && grownDays(x, y, plot) >= CROPS[plot.crop].days;
    }
    // 0 just sown, 1 sprout, 2 growing, 3 ripe
    function cropStage(x, y, plot) {
        const def = CROPS[plot.crop], days = grownDays(x, y, plot);
        if (days >= def.days) return 3;
        return Math.min(2, Math.floor(days / def.days * 3));
    }
    function daysLeft(x, y, plot) {
        const def = CROPS[plot.crop], rate = growthRate(x, y, plot);
        const elapsed = Math.max(0, today() - plot.day) * rate;
        return Math.max(1, Math.ceil((def.days - elapsed) / rate));
    }

    // ---- helpers
    const itemOf = id => $dataItems[id];
    const countOf = id => $gameParty.numItems(itemOf(id));
    const rand = ([lo, hi]) => lo + Math.floor(Math.random() * (hi - lo + 1));

    function popup(icon, text, color) {
        $gameTemp.pushLootPopup(icon, text, color);
    }
    function complain(icon, text) { popup(icon, text, "#ff9f8f"); }
    // true when n more of item would still fit in the bag - the standard guard before gaining loot/output or packing an item
    function spaceFor(item, n) { return $gameParty.maxItems(item) - countOf(item.id) >= n; }
    function complainNoSpace(item) { complain(item.iconIndex, "Nie zmieści się w plecaku: " + item.name); }

    function playSe(name, pitch) {
        AudioManager.playSe({ name, volume: 90, pitch: pitch || 100, pan: 0 });
    }
    function spendStamina(cost) {
        if (cost <= 0 || typeof $gameSystem.trySpendStamina !== "function") return true;
        if ($gameSystem.trySpendStamina(cost)) return true;
        complain(ICON.stamina, "Jesteś zbyt zmęczony");
        return false;
    }
    // one use of a tool (Durability.js wears it out, breaks it in the end)
    function useTool(id) {
        if (window.Durability) Durability.use(id);
    }
    function requireItem(id) {
        if ($gameParty.hasItem(itemOf(id))) return true;
        complain(itemOf(id).iconIndex, "Potrzebujesz: " + itemOf(id).name);
        return false;
    }
    function fx(x, y, type, final) {
        if (!$gameTemp) return;
        if (!$gameTemp._hitFx) $gameTemp._hitFx = [];
        $gameTemp._hitFx.push({
            type, final: !!final, bx: x + 0.5, by: y + 1,
            dx: Math.sign(x - $gamePlayer.x), dy: Math.sign(y - $gamePlayer.y)
        });
    }
    // small timers and a lock on the player, driven by Game_Player.update
    function later(frames, fn) {
        if (!$gameTemp._farmTimers) $gameTemp._farmTimers = [];
        $gameTemp._farmTimers.push({ t: frames, fn });
    }
    function lockPlayer(frames) {
        $gameTemp._farmLock = Math.max($gameTemp._farmLock || 0, frames);
    }
    // Runs the action on the strike frame of a swing when there is one for this
    // tool, right away otherwise. Returns true when a swing was started.
    function swingThen(kind, fn, opts) {
        if ($gamePlayer.startToolSwing && $gamePlayer.startToolSwing(kind, fn, undefined, opts)) return true;
        fn();
        return false;
    }

    // ------------------------------------------------------------------
    // Actions. Each one checks tool / materials / stamina itself and returns
    // true when it went ahead.
    // ------------------------------------------------------------------
    function rake(x, y) {
        const plot = plotAt(x, y);
        if (!plot || plot.s !== "cleared" || !requireItem(ITEM.rake) || !spendStamina(STAMINA.rake)) return false;
        swingThen(RAKE_KIND, () => {
            useTool(ITEM.rake);
            const raked = ensurePlot(x, y);
            raked.s = "raked";
            delete raked.dug;   // the raking levels a pit
            changed();
            playSe(SE.rake, 95 + Math.floor(Math.random() * 10));
            fx(x, y, "dirt", false);
            if (Math.random() < SEED_CHANCE) {
                const found = CROPS[CROP_IDS[Math.floor(Math.random() * CROP_IDS.length)]];
                $gameParty.gainItem(itemOf(found.seed), 1);
            }
        });
        return true;
    }

    function till(x, y) {
        const plot = plotAt(x, y);
        if (!plot || plot.s !== "raked" || !requireItem(ITEM.hoe) || !spendStamina(STAMINA.hoe)) return false;
        swingThen(HOE_KIND, () => {
            useTool(ITEM.hoe);
            const stored = ensurePlot(x, y);
            stored.s = "tilled";
            stored.crop = null;
            changed();
            playSe(SE.hoe, 95 + Math.floor(Math.random() * 10));
            fx(x, y, "dirt", true);
        });
        return true;
    }

    function plant(x, y, cropId) {
        const plot = plotAt(x, y), def = CROPS[cropId];
        if (!plot || plot.s !== "tilled" || plot.crop || !def) return false;
        if (def.seasons && !def.seasons.includes(seasonIndex(today()))) {
            complain(itemOf(def.seed).iconIndex, def.name + " nie sadzi się o tej porze roku (" + seasonOf(today()) + ")");
            return false;
        }
        if (countOf(def.seed) < 1) { complain(itemOf(def.seed).iconIndex, "Brak nasion: " + itemOf(def.seed).name); return false; }
        if (!spendStamina(STAMINA.plant)) return false;
        $gameParty.loseItem(itemOf(def.seed), 1, false);
        swingThen(CROUCH_KIND, () => {
            const stored = ensurePlot(x, y);
            stored.crop = cropId;
            stored.day = today();
            changed();
            playSe(SE.plant, 105);
        });
        return true;
    }

    function harvest(x, y) {
        const plot = plotAt(x, y);
        if (!plot || !plot.crop || !isRipe(x, y, plot) || !spendStamina(STAMINA.harvest)) return false;
        const def = CROPS[plot.crop];
        swingThen(CROUCH_KIND, () => {
            plot.crop = null;
            delete plot.day;
            changed();
            playSe(SE.harvest, 100);
            fx(x, y, "leaf", false);
            $gameParty.gainItem(itemOf(def.produce), rand(def.yield));
            const seeds = rand(def.seeds);
            if (seeds > 0) $gameParty.gainItem(itemOf(def.seed), seeds);
        });
        return true;
    }

    function uproot(x, y) {
        const plot = plotAt(x, y);
        if (!plot || !plot.crop) return false;
        swingThen(CROUCH_KIND, () => {
            plot.crop = null;
            delete plot.day;
            changed();
            playSe(SE.uproot, 110);
            fx(x, y, "dirt", false);
        });
        return true;
    }

    // Watering gives a growth bonus for today and tomorrow (see wateredRecently).
    // Works on any tilled plot, sown or not, so the ground can be pre-watered.
    function water(x, y) {
        const plot = plotAt(x, y);
        if (!plot || plot.s !== "tilled") return false;
        const canOk = $gameParty.hasItem(itemOf(ITEM.wateringCan)) && canCharges() > 0;
        const bucket = canOk ? null : bucketFor(x, y);   // no (or an empty) can: a bucket with rain water close by will do
        if (!bucket) {
            if (!requireItem(ITEM.wateringCan)) return false;
            if (canCharges() <= 0) { complain(itemOf(ITEM.wateringCan).iconIndex, "Konewka jest pusta. Napełnij ją w studni albo w stawie."); return false; }
        }
        if (!spendStamina(STAMINA.water)) return false;
        swingThen(CROUCH_KIND, () => {
            if (bucket) takeBucketWater(bucket, 1); else setCanCharges(canCharges() - 1);
            ensurePlot(x, y).watered = today();
            changed();
            playSe(SE.water, 100);
            fx(x, y, "dirt", false);
        });
        return true;
    }

    // Soil comes out of any cleared or raked ground (also plain grass) with the shovel.
    function dig(x, y) {
        const plot = plotAt(x, y);
        if (!plot || plot.crop || (plot.s !== "cleared" && plot.s !== "raked")) return false;
        if (!requireItem(ITEM.shovel)) return false;
        const soil = itemOf(ITEM.soil);
        if ($gameParty.maxItems(soil) - countOf(ITEM.soil) < 1) { complain(soil.iconIndex, "Masz już dość ziemi"); return false; }
        if (!spendStamina(STAMINA.dig)) return false;
        swingThen(SHOVEL_KIND, () => {
            useTool(ITEM.shovel);
            const stored = ensurePlot(x, y);
            if (stored.s === "raked") stored.s = "cleared";   // the rake marks are dug up
            stored.dug = Math.min(3, (stored.dug || 0) + 1);   // a pit: the ground shows that soil was taken (deeper with every shovelful, up to 3)
            changed();
            playSe(SE.dig, 95 + Math.floor(Math.random() * 10));
            fx(x, y, "dirt", false);
            $gameParty.gainItem(soil, rand(DIG_YIELD));
        });
        return true;
    }

    // ---- building
    function tilesOfBuilding(type, x, y) {
        return cellsOfGeo(BUILDINGS[type], x, y);
    }
    function tileIsFree(x, y) {
        return $gameMap.eventsXy(x, y).every(e => !e.isNormalPriority()) &&
            !($gamePlayer.x === x && $gamePlayer.y === y);
    }
    // null when it can be built there, otherwise the reason. type: the building being placed (a dug-out pit is fine under a well, which needs one)
    function tileWhyNot(x, y, type) {
        if (!$gameMap.isValid(x, y)) return "Tu się nie zmieści.";
        if (isHutInterior() && !hutFloor(x, y)) return x === HUT_ROOM.doorX && (y === HUT_ROOM.y1 || y === HUT_ROOM.doorY) ? "Zostaw przejście do drzwi." : "Tu się nie zmieści.";
        const h = hutOf();
        if (h && !isHutInterior() && h.mapId === $gameMap.mapId()) {
            const d = hutDoorCell(h);
            if (x === d.x && y === d.y + 1) return "Zostaw wejście do chatki.";
        }
        const plot = plotAt(x, y);
        if (!plot) return "Trzeba oczyszczonej ziemi.";
        if (plot.s === "tilled") return "Zaoranej ziemi nie zabudujesz.";
        if (plot.dug && type !== "well") return "Najpierw zagrab dół.";
        if (buildingAt(x, y)) return "Tu już coś stoi.";
        if (!tileIsFree(x, y)) return "Coś tu stoi.";
        return null;
    }
    // a 2x2 block, entirely within the given cells, dug to the bottom (depth 3): what a well needs under it
    function has2x2Pit(cells) {
        const set = new Set(cells.map(c => key(c.x, c.y)));
        for (const c of cells) {
            const corners = [[c.x, c.y], [c.x + 1, c.y], [c.x, c.y + 1], [c.x + 1, c.y + 1]];
            if (!corners.every(([cx, cy]) => set.has(key(cx, cy)))) continue;
            if (corners.every(([cx, cy]) => (plotAt(cx, cy) || {}).dug === 3)) return true;
        }
        return false;
    }
    function whyNotBuild(type, x, y, flip) {
        const def = flip ? mirrorGeo(BUILDINGS[type]) : BUILDINGS[type];
        if (def.single && hutOf()) return "Masz już chatkę.";
        if (isHutInterior() && !def.indoor) return "Tego nie postawisz w chatce.";
        if (isHutInterior() && hutShutsIn(type, x, y)) return "Zablokowałbyś sobie wyjście.";
        if (def.indoorOnly && !isHutInterior()) return "To stawia się tylko w chatce.";
        if (def.door) {   // the way to the door must stay open
            const fx = x + def.door.dx, fy = y + 1;
            if (!$gameMap.isValid(fx, fy) || !$gameMap.checkPassage(fx, fy, 0x0f) || buildingAt(fx, fy) || hasObjectTile(fx, fy)) return "Przed drzwiami musi być wolne miejsce.";
        }
        for (const t of tilesOfBuilding(type, x, y)) {
            const why = tileWhyNot(t.x, t.y, type);
            if (why) return why;
        }
        if (type === "well" && !has2x2Pit(tilesOfBuilding(type, x, y))) return "Potrzebny dół 2×2 wykopany do dna (poziom 3) w miejscu studni.";
        return null;
    }
    // shared by missingMaterials/missingInputs: which [id, n] pairs of a cost/inputs list are not fully in the bag
    function missingOf(pairs) {
        return pairs.filter(([id, n]) => countOf(id) < n);
    }
    function missingMaterials(type) {
        return missingOf(BUILDINGS[type].cost);
    }
    function build(type, x, y, flip) {
        const def = BUILDINGS[type];
        if (!def) return false;
        const why = whyNotBuild(type, x, y, flip);
        if (why) { complain(itemOf(ITEM.wood).iconIndex, why); return false; }
        const missing = missingMaterials(type);
        if (missing.length > 0) { const m = itemOf(missing[0][0]); complain(m.iconIndex, "Brakuje: " + m.name); return false; }
        if (!spendStamina(def.stamina)) return false;
        for (const [id, n] of def.cost) $gameParty.loseItem(itemOf(id), n, false);
        let crouched = false;
        crouched = swingThen(CROUCH_KIND, () => {
            const fresh = claimGround(tilesOfBuilding(type, x, y));
            const b = Object.assign({ id: farm().nextId++, type, x, y, last: today(), v: 3, claimed: fresh }, flip ? { flip: true } : {});
            buildingsOf($gameMap.mapId()).push(b);
            changed();
            playSe(SE.build, 100);
            later(10, () => playSe(SE.build, 90));
            later(20, () => playSe(SE.build, 105));
            fx(x, y, "wood", true);
            if (!crouched) lockPlayer(30);   // the crouch already keeps the player busy
        });
        return true;
    }
    // ---- building sites. Choosing a place only marks it: the materials are delivered right away, but
    // nothing stands there yet. The player has to come with a hammer and strike (the action button, one
    // swing each, costing stamina) until the building is done; the blueprint fills up from the bottom.
    const hitsNeeded = def => Math.max(2, Math.ceil(def.stamina / Math.max(1, STAMINA.buildHit)));
    // A building without a site (the tent): the item goes in, it stands at once and no hammer is needed.
    function pitchInstant(type, x, y, flip) {
        const def = BUILDINGS[type];
        const why = whyNotBuild(type, x, y, flip);
        const iconItem = itemOf(def.pack || def.cost[0][0]);
        if (why) { complain(iconItem.iconIndex, why); return false; }
        const missing = missingMaterials(type);
        if (missing.length > 0) { complain(iconItem.iconIndex, "Brakuje: " + itemOf(missing[0][0]).name); return false; }
        if (!spendStamina(def.stamina)) return false;
        for (const [id, n] of def.cost) $gameParty.loseItem(itemOf(id), n, false);
        let crouched = false;
        crouched = swingThen(CROUCH_KIND, () => {
            const fresh = claimGround(tilesOfBuilding(type, x, y));
            const carryWater = def.rain ? bagWater() : 0;   // the bucket you place keeps the water you were carrying in it
            buildingsOf($gameMap.mapId()).push(Object.assign({ id: farm().nextId++, type, x, y, last: today(), v: 3, claimed: fresh }, def.rain ? { water: carryWater, wt: clockHours() } : {}, flip ? { flip: true } : {}));
            if (carryWater > 0) setBagWater(0);
            changed();
            playSe("Equip2", 100);
            later(12, () => playSe("Equip2", 85));
            popup(iconItem.iconIndex, "Rozstawiono: " + def.name, "#f3e0a0");
            if (!crouched) lockPlayer(30);
        });
        return true;
    }
    // room for a building around an existing one (its own tile is not counted): free, passable ground, nothing sown or ploughed
    function roomFor(type, x, y, ignoreX, ignoreY) {
        for (const t of tilesOfBuilding(type, x, y)) {
            if (t.x === ignoreX && t.y === ignoreY) continue;
            const plot = plotAt(t.x, t.y);
            if (!$gameMap.isValid(t.x, t.y) || !$gameMap.checkPassage(t.x, t.y, 0x0f) || buildingAt(t.x, t.y) || !tileIsFree(t.x, t.y) || hasObjectTile(t.x, t.y)) return false;
            if (plot && (plot.s === "tilled" || plot.crop)) return false;
        }
        return true;
    }
    // The campfire grows into a cauldron: the fire (and its stones) stay where they are, the cauldron is built around them
    function upgradeBuilding(b) {
        const up = (geoOf(b) || {}).upgrade;
        if (!up) return false;
        const target = BUILDINGS[up.to], first = itemOf(up.cost[0][0]);
        if (b.job) { complain(first.iconIndex, "Najpierw zbierz z ognia"); return false; }
        const missing = up.cost.filter(([id, n]) => countOf(id) < n);
        if (missing.length > 0) { complain(itemOf(missing[0][0]).iconIndex, "Potrzebujesz: " + itemOf(missing[0][0]).name); return false; }
        if (up.tool && !requireItem(up.tool)) return false;
        const ax = b.x - up.dx, ay = b.y;   // the fire is the tile up.dx from the left end of the bottom row of what is built around it
        if (!roomFor(up.to, ax, ay, b.x, b.y)) { complain(itemOf(ITEM.stone).iconIndex, "Za mało miejsca wokół ogniska"); return false; }
        if (!spendStamina(up.stamina)) return false;
        for (const [id, n] of up.cost) $gameParty.loseItem(itemOf(id), n, false);
        swingThen(up.tool === ITEM.hammer ? HAMMER_KIND : CROUCH_KIND, () => {
            if (up.tool) useTool(up.tool);
            const list = buildingsOf($gameMap.mapId());
            const at = list.indexOf(b);
            if (at < 0) return;
            list.splice(at, 1);
            const fresh = (b.claimed || []).concat(claimGround(tilesOfBuilding(up.to, ax, ay)));
            const fuel = b.fuel !== undefined ? { fuel: fuelLeft(b), fuelSince: clockHours() } : {};   // the same fire, still burning down
            list.push(Object.assign({ id: farm().nextId++, type: up.to, x: ax, y: ay, last: today(), v: 3, claimed: fresh }, b.flip ? { flip: true } : {}, fuel));
            changed();
            playSe(SE.build, 100);
            later(10, () => playSe(SE.build, 90));
            popup(itemOf(up.tool || up.cost[0][0]).iconIndex, up.done || "Rozbudowano: " + target.name, "#9ff0a8");
        });
        return true;
    }
    // like a building on the build list: the costs with what is in the bag, dimmed with "Brakuje: ..." until everything is there
    function upgradeEntry(b, def) {
        const up = def.upgrade, cost = up.cost.map(([id, n]) => itemOf(id).name + " ×" + n).join(", ");
        const missing = missingOf(up.cost);
        const help = missing.length > 0
            ? "Brakuje: " + missing.map(([id, n]) => itemOf(id).name + " (" + countOf(id) + "/" + n + ")").join(", ") + ".\n" + up.help
            : up.help + "\nKoszt: " + cost + ".";
        return { name: up.name, icon: itemOf(up.cost[0][0]).iconIndex, costs: costRows(up.cost), enabled: missing.length === 0, help,
            tip: up.help, facts: ["-" + up.stamina + " wytrzymałości, bez młotka"], run: () => upgradeBuilding(b) };
    }

    // Folds the tent back into its item (a tent with nothing inside has nothing to block it).
    function packUp(b) {
        const def = BUILDINGS[b.type], item = itemOf(def.pack);
        if (!spaceFor(item, 1)) { complainNoSpace(item); return false; }
        const carryWater = def.rain ? bucketUnits(b) : 0;   // the bucket keeps its water: it joins the shared carried level
        let crouched = false;
        crouched = swingThen(CROUCH_KIND, () => {
            const list = buildingsOf($gameMap.mapId());
            if (list.indexOf(b) < 0) return;
            list.splice(list.indexOf(b), 1);
            releaseGround(b, $gameMap.mapId());
            changed();
            $gameParty.gainItem(item, 1);
            if (carryWater > 0) setBagWater(bagWater() + carryWater);
            playSe("Equip1", 100);
            const packed = def.packedText || "Złożono: " + def.name;
            popup(item.iconIndex, carryWater > 0 ? packed + " (" + bagWater() + "/" + BUILDINGS.bucket.rain.max + ")" : packed, "#f3e0a0");
            if (!crouched) lockPlayer(30);
        });
        return true;
    }
    // The hour the SurvivalHUD plugin wakes you at (the same as after a night in a bed).
    const wakeHour = () => num(PluginManager.parameters("SurvivalHUD").wakeHour, 7);
    // A night in a tent = a night in a bed: time jumps to the morning (Journal writes the day summary,
    // Atmosphere saves the game - both hook sleepUntilHour), strength and health are restored, a message greets the new day.
    // rain, snow or winter: the forest bed is damp and cold (the tent stays dry)
    const harshNight = () => ["rain", "storm", "snow"].includes($gameScreen.weatherType()) || seasonIndex(today()) === 3;
    function sleepInTent(b) {
        if (typeof $gameSystem.sleepUntilHour !== "function") { complain(ICON.stamina, "Tu się nie da spać"); return false; }
        const def = BUILDINGS[b.type];
        const bad = def.sleepBad !== undefined && !isHutInterior() && harshNight();   // under the roof of the hut the weather does not matter
        const restore = bad ? def.sleepBad : def.sleepRestore !== undefined ? def.sleepRestore : 1;
        const morning = restore >= 1 ? "Czujesz się wypoczęty." : bad ? "Spałeś w zimnie i wilgoci. Sił odzyskałeś niewiele." : "Spałeś twardo. Sił odzyskałeś tylko część.";
        // the screen goes dark for a moment while the night passes, then the new day comes up; the greeting is a small plate at the
        // top of the screen (SurvivalHUD.js), shown after the day summary (Journal.js)
        lockPlayer(150);
        $gameScreen.startFadeOut(30);
        later(45, () => {
            AudioManager.playMe({ name: PluginManager.parameters("SurvivalHUD").sleepMe || "Inn1", volume: 90, pitch: 100, pan: 0 });
            $gameSystem.sleepUntilHour(wakeHour());
            if (typeof $gameSystem.setStamina === "function") $gameSystem.setStamina(Math.max($gameSystem.stamina(), Math.round($gameSystem.maxStamina() * restore)));
            for (const member of $gameParty.members()) member.recoverAll();
            if (b.type === "tent") farm().tentNights = (farm().tentNights || 0) + 1; else farm().bedNights = (farm().bedNights || 0) + 1;
            b.last = today();
        });
        later(75, () => $gameScreen.startFadeIn(40));
        later(115, () => {
            if (typeof $gameTemp.queueDayBanner === "function") $gameTemp.queueDayBanner(morning);
            else { $gameMessage.add("Dzień " + $gameSystem.dayNightDay() + ". " + $gameSystem.dayNightPeriod().name + "."); $gameMessage.add(morning); }
        });
        return true;
    }
    function placeSite(type, x, y, flip) {
        const def = BUILDINGS[type];
        if (!def) return false;
        if (def.instant) return pitchInstant(type, x, y, flip);
        const why = whyNotBuild(type, x, y, flip);
        if (why) { complain(itemOf(ITEM.wood).iconIndex, why); return false; }
        const missing = missingMaterials(type);
        if (missing.length > 0) { const m = itemOf(missing[0][0]); complain(m.iconIndex, "Brakuje: " + m.name); return false; }
        for (const [id, n] of def.cost) $gameParty.loseItem(itemOf(id), n, false);
        const fresh = claimGround(tilesOfBuilding(type, x, y));
        buildingsOf($gameMap.mapId()).push({ id: farm().nextId++, type, x, y, last: today(), v: 3, claimed: fresh, site: { need: hitsNeeded(def), done: 0 }, ...(flip ? { flip: true } : {}) });
        changed();
        playSe(SE.plant, 95);
        popup(itemOf(ITEM.hammer).iconIndex, "Plac budowy: " + def.name, "#f3e0a0");
        if (!$gameParty.hasItem(itemOf(ITEM.hammer))) complain(itemOf(ITEM.hammer).iconIndex, "Potrzebujesz młotka");
        return true;
    }
    // one blow at the site in front of the player (x, y = the tile that is hit)
    function strikeSite(b, x, y) {
        const site = b.site, def = BUILDINGS[b.type];
        if (!site || !requireItem(ITEM.hammer) || !spendStamina(STAMINA.buildHit)) return false;
        swingThen(HAMMER_KIND, () => {
            useTool(ITEM.hammer);
            site.done++;
            const last = site.done >= site.need;
            playSe(SE.build, 95 + Math.floor(Math.random() * 10));
            if (last) {
                later(9, () => playSe(SE.build, 90));
                later(18, () => playSe(SE.build, 105));
                delete b.site;
                b.last = today();
                popup(itemOf(ITEM.hammer).iconIndex, "Gotowe: " + def.name, "#9ff0a8");
            }
            fx(x, y, "wood", last);
            changed();
        });
        return true;
    }
    // giving up is only possible before the first blow, and returns everything
    function cancelSite(b) {
        if (!b.site || b.site.done > 0) return false;
        const list = buildingsOf($gameMap.mapId());
        list.splice(list.indexOf(b), 1);
        releaseGround(b, $gameMap.mapId());
        for (const [id, n] of BUILDINGS[b.type].cost) $gameParty.gainItem(itemOf(id), n);
        changed();
        playSe(SE.demolish, 100);
        return true;
    }
    function siteMenu(b, x, y) {
        const def = BUILDINGS[b.type], left = b.site.need - b.site.done;
        if (b.site.done > 0) {   // work in progress: every press of the action button is one blow
            strikeSite(b, x, y);
            return { done: true };
        }
        return { title: "Plac budowy: " + def.name + " (0/" + b.site.need + ")", entries: [
            ...(hammerMissing() ? [handMenuEntry(x, y)] : []),
            { name: "Zacznij budować", icon: itemOf(ITEM.hammer).iconIndex, right: "-" + STAMINA.buildHit, run: () => strikeSite(b, x, y),
                help: "Potrzebny młotek. Każde uderzenie (przycisk akcji) kosztuje " + STAMINA.buildHit + " wytrzymałości, a potrzeba ich " + left + ". Po pierwszym uderzeniu budowę trzeba dokończyć." },
            { name: "Zrezygnuj", help: "Zwraca wszystkie materiały.", run: () => cancelSite(b) }] };
    }

    // null when the building may be taken down, otherwise the reason
    function demolishBlock(b) {
        if (b.job) return "W piecu jest wypał. Najpierw go zbierz.";
        if (chestKinds(b) > 0) return "Najpierw opróżnij skrzynię.";
        if (b.type === "hut" && (farm().buildings[HUT_MAP] || []).length > 0) return "Najpierw wynieś z chatki wszystkie meble.";
        return null;
    }
    function demolish(b) {
        const def = geoOf(b);   // a building of the old size gives back half of what it cost then
        const block = demolishBlock(b);
        if (block) { complain(itemOf(ITEM.wood).iconIndex, block); return false; }
        const list = buildingsOf($gameMap.mapId());
        list.splice(list.indexOf(b), 1);
        releaseGround(b, $gameMap.mapId());
        changed();
        playSe(SE.demolish, 100);
        fx(b.x, b.y, "wood", true);
        for (const [id, n] of def.refund || def.cost.map(([id, n]) => [id, Math.floor(n / 2)])) {
            if (n > 0) $gameParty.gainItem(itemOf(id), n);
        }
        return true;
    }
    function readyProduce(b) {
        const p = BUILDINGS[b.type].produce;
        if (!p) return 0;
        return Math.min(p.cap, Math.floor(Math.max(0, today() - b.last) / p.period) * p.amount + (b.caught || 0));
    }
    function daysToProduce(b) {
        const p = BUILDINGS[b.type].produce;
        return Math.max(1, p.period - Math.max(0, today() - b.last) % p.period);
    }
    function collect(b) {
        const n = readyProduce(b);
        if (n < 1) return false;
        const tool = BUILDINGS[b.type].produce.tool;
        if (tool && !requireItem(tool)) return false;
        swingThen(CROUCH_KIND, () => {
            b.last = today();
            b.caught = 0;   // (a snare: the rabbit taken out, it is set again)
            changed();
            playSe(SE.collect, 100);
            $gameParty.gainItem(itemOf(BUILDINGS[b.type].produce.item), n);
        });
        return true;
    }
    // ---- a snare (a building with `lure`): it catches nothing by itself. Bait in it (b.bait = { item, until: clock hours }) draws
    // live rabbits (Hunting.js); one may be caught - one at a time, the snare holds the rabbit (b.caught) until it is collected. The
    // bait lasts lure.baitHours or until the first rabbit (caught, or scared off with it).
    function snares(mapId) {
        return (farm().buildings[mapId === undefined ? $gameMap.mapId() : mapId] || []).filter(b => !b.site && BUILDINGS[b.type] && BUILDINGS[b.type].lure);
    }
    const snareSprung = b => (b.caught || 0) > 0;
    function snareBait(b) {
        if (b.bait && b.bait.until <= clockHours()) { b.bait = null; changed(); }   // gone off / eaten by the ants
        return b.bait || null;
    }
    function snareCatch(b) {
        if (snareSprung(b)) return false;
        b.caught = 1;
        b.bait = null;
        changed();
        return true;
    }
    function snareEatBait(b) {
        if (!b.bait) return;
        b.bait = null;
        changed();
    }
    function baitSnare(b) {
        const lure = BUILDINGS[b.type].lure, id = lure.baits.find(i => countOf(i) > 0);
        if (!id) { complain(itemOf(lure.baits[0]).iconIndex, "Nie masz przynęty"); return false; }
        if (snareSprung(b)) { complain(itemOf(ITEM.carcass).iconIndex, "W pułapce siedzi zając"); return false; }
        swingThen(CROUCH_KIND, () => {
            $gameParty.loseItem(itemOf(id), 1);
            b.bait = { item: id, at: clockHours(), until: clockHours() + lure.baitHours };
            changed();
            playSe(SE.move, 110);
            popup(itemOf(id).iconIndex, "Przynęta w pułapce: " + itemOf(id).name, "#cfe6a8");
        });
        return true;
    }
    function snareBaitEntry(b, def) {
        const lure = def.lure, bait = snareBait(b);
        if (bait) {
            const left = Math.max(1, Math.round(bait.until - clockHours()));
            return { name: "Przynęta: " + itemOf(bait.item).name, icon: itemOf(bait.item).iconIndex, right: left + " h", enabled: false,
                help: "Leży w pułapce jeszcze około " + left + " godz. albo do pierwszego zająca. Zające zwąchają ją nawet z " + lure.radius + " kratek." };
        }
        const id = lure.baits.find(i => countOf(i) > 0), sprung = snareSprung(b);
        return { name: "Załóż przynętę", icon: itemOf(id || lure.baits[0]).iconIndex, right: id ? "-1" : "", enabled: !!id && !sprung,
            help: sprung ? "W pułapce siedzi zając: najpierw go zabierz."
                : id ? "Kładziesz w pułapce: " + itemOf(id).name + " (masz " + countOf(id) + "). Bez przynęty pułapka nic nie złapie; tę zające zwąchają z " + lure.radius + " kratek. Wystarczy na dobę albo do pierwszego zająca."
                : "Nie masz przynęty, a bez niej pułapka nic nie złapie. Zające skuszą się na: " + lure.baits.map(i => itemOf(i).name.toLowerCase()).join(", ") + ".",
            run: () => baitSnare(b) };
    }
    // ---- crafting stations: one job at a time, timed by the game clock (DayNightCycle)
    const hasClock = () => typeof $gameSystem.dayNightHour === "function";
    // game hours since day 0 (with the fraction of the current hour)
    function clockHours() {
        return hasClock() ? today() * 24 + $gameSystem.dayNightHour() : 0;
    }
    function jobHoursLeft(b) {
        return b.job ? Math.max(0, b.job.start + b.job.hours - clockHours()) : 0;
    }
    function jobReady(b) {
        return !!b.job && (!hasClock() || jobHoursLeft(b) <= 0);
    }
    // ---- fire fuel: a campfire (and what grows from it - tripod, cauldron) slowly burns down and goes out; lazily
    // computed from the game clock, same as everything else timed here, so nothing needs to tick every frame.
    const FUEL_MAX = 10;          // hours of burning it can hold at once
    const FUEL_START = 4;         // hours it starts with when the site is finished
    const FUEL_PER_WOOD = 3;      // hours added per piece of firewood
    const FUEL_PER_BRANCH = 1;    // hours added per branch (worse fuel, but it is often what is on hand)
    function fuelLeft(b) {
        const def = geoOf(b);
        if (!def.fire) return Infinity;   // no animated fire on this building (older cauldrons built before the flame) - never fuel-gated
        if (b.fuel === undefined) { b.fuel = FUEL_START; b.fuelSince = clockHours(); }
        return Math.max(0, b.fuel - Math.max(0, clockHours() - b.fuelSince));
    }
    function addFuel(b, hours) {
        b.fuel = Math.min(FUEL_MAX, fuelLeft(b) + hours);
        b.fuelSince = clockHours();
    }
    // lit for display/warming purposes: real fuel, or a job already burning in it (started while it still had fuel -
    // it does not go dark under food that is mid-roast just because the background clock ran on while you were away)
    function fireLit(b) {
        return fuelLeft(b) > 0 || !!b.job;
    }
    // A fire that has gone out is lit again with kindling: a pine cone (the best), else one more branch
    function kindlingFor(fuelId) {
        if (countOf(ITEM.cone) > 0) return ITEM.cone;
        return countOf(ITEM.branch) >= (fuelId === ITEM.branch ? 2 : 1) ? ITEM.branch : null;
    }
    function feedFireEntries(b) {
        const def = geoOf(b);
        if (!def.fire) return [];
        const left = fuelLeft(b), out = left <= 0 && !b.job;
        const status = left > 0 ? "Starczy jeszcze na " + hoursText(left) + "." : b.job ? "Bez drewna zgaśnie, gdy skończy się to, co się teraz piecze." : "Ogień wygasł.";
        const relight = " Rozpalisz go od nowa: na rozpałkę pójdzie szyszka (bez szyszek - jeszcze jedna gałąź).";
        const feed = (fuelId, hours, name, done) => {
            const kindling = out ? kindlingFor(fuelId) : null, fuel = itemOf(fuelId);
            return { name, icon: fuel.iconIndex, right: "×1", enabled: countOf(fuelId) > 0 && (!out || !!kindling),
                help: status + (out ? relight + (kindling ? "" : " Nie masz ani szyszki, ani gałęzi.") : "") + " " + done,
                run: () => {
                    $gameParty.loseItem(fuel, 1, false);
                    if (kindling) $gameParty.loseItem(itemOf(kindling), 1, false);
                    addFuel(b, hours);
                    changed();
                    playSe(SE.build, 95);
                    popup(fuel.iconIndex, kindling ? "Rozpalono ogień (rozpałka: " + itemOf(kindling).name.toLowerCase() + ")" : name === "Dorzuć drewna" ? "Dorzucono drewna" : "Dorzucono gałąź", "#f3e0a0");
                    return true;
                } };
        };
        return [
            feed(ITEM.wood, FUEL_PER_WOOD, "Dorzuć drewna", "Drewno daje " + hoursText(FUEL_PER_WOOD) + " ognia."),
            feed(ITEM.branch, FUEL_PER_BRANCH, "Dorzuć gałąź", "Gałąź daje " + hoursText(FUEL_PER_BRANCH) + " ognia - gorzej niż drewno.")
        ];
    }
    function recipeOf(b, id) {
        return ((BUILDINGS[b.type] || {}).recipes || []).find(r => r.id === id) || null;
    }
    function missingInputs(r) {
        return missingOf(r.inputs);
    }
    // recipes that need water (the cauldron's soups): null when fine, else the reason for a popup/help line
    function waterProblem(r) {
        if (!r.water) return null;
        if (!ownsBucket()) return "Potrzebujesz wiadra";
        if (bagWater() < r.water) return "Za mało wody w wiadrze (" + bagWater() + "/" + r.water + ")";
        return null;
    }
    function costRowsWithWater(r) {
        const rows = costRows(r.inputs);
        if (r.water) rows.push([itemOf(ITEM.bucket).iconIndex, r.water, bagWater(), "woda"]);
        return rows;
    }
    function startJob(b, recipeId) {
        const r = recipeOf(b, recipeId);
        if (!r || b.job) return false;
        if (geoOf(b).fire && fuelLeft(b) <= 0) { complain(itemOf(ITEM.wood).iconIndex, "Ogień wygasł. Dorzuć drewna."); return false; }
        if (r.tool && !requireItem(r.tool)) return false;
        const waterBad = waterProblem(r);
        if (waterBad) { complain(itemOf(ITEM.bucket).iconIndex, waterBad); return false; }
        const missing = missingInputs(r);
        if (missing.length > 0) { complain(itemOf(missing[0][0]).iconIndex, "Brakuje: " + itemOf(missing[0][0]).name); return false; }
        if (!spendStamina(r.stamina || 0)) return false;
        for (const [id, n] of r.inputs) $gameParty.loseItem(itemOf(id), n, false);
        if (r.water) setBagWater(bagWater() - r.water);
        const begin = () => {
            b.job = { recipe: r.id, start: clockHours(), hours: r.hours, out: r.output.slice(), sit: !!r.roast && !geoOf(b).hang && $gamePlayer.isToolSwinging() };   // sit: the player is at the fire for it (on a stick, not on a tripod)
            playSe(r.startSe || BUILDINGS[b.type].startSe || SE.kindle, 90);
            fx(b.x, b.y, "dirt", false);
        };
        if (!r.roast) {
            swingThen(CROUCH_KIND, begin);
            return true;
        }
        // A tripod: the food is hung on the hook and roasts by itself, like in any oven (a background job): the player may leave, or wait
        // beside it (waitAtFire), and collects it from the fire when it is done.
        if (geoOf(b).hang) {
            swingThen(CROUCH_KIND, begin);
            return true;
        }
        // On a stick: the player sits at the fire with the food until it is done (r.hours of game time, run faster when that would take
        // long), then stands up with it. Cancel / a direction key gets up early: then nothing is roasted and nothing stays on the fire -
        // the raw food goes back to the bag.
        const sph = num(PluginManager.parameters("DayNightCycle").secondsPerHour, 60) || 60;
        const extra = Math.max(0, (r.hours * sph / SIT_MAX_SECONDS - 1) / 60 / sph);   // extra game hours per frame while waiting
        swingThen(ROAST_KIND, begin, {
            holdWhile: () => !!b.job && !jobReady(b) && buildingsOf($gameMap.mapId()).indexOf(b) >= 0,
            onWait: () => { if (extra > 0 && typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(extra); },
            onHoldEnd: cancelled => {
                if (!cancelled && b.job && jobReady(b)) collectJob(b);
                else if (b.job && b.job.sit) giveUpRoast(b);
            }
        });
        return true;
    }
    // Sitting beside the tripod while the food on it roasts (optional). Getting up early does not spoil anything: it keeps roasting.
    function waitAtFire(b) {
        if (!b.job || jobReady(b)) return false;
        const sph = num(PluginManager.parameters("DayNightCycle").secondsPerHour, 60) || 60;
        const extra = Math.max(0, (jobHoursLeft(b) * sph / SIT_MAX_SECONDS - 1) / 60 / sph);
        swingThen(ROAST_WAIT_KIND, () => {}, {
            holdWhile: () => !!b.job && !jobReady(b) && buildingsOf($gameMap.mapId()).indexOf(b) >= 0,
            onWait: () => { if (extra > 0 && typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(extra); },
            onHoldEnd: cancelled => { if (!cancelled && b.job && jobReady(b)) collectJob(b); }
        });
        return true;
    }
    // the player got up before the food was done: nothing is roasted and nothing stays on the fire, the raw food goes back to the bag
    function giveUpRoast(b, silent) {
        const r = b.job ? recipeOf(b, b.job.recipe) : null;
        delete b.job;
        if (r) for (const [id, n] of r.inputs) $gameParty.gainItem(itemOf(id), n);
        changed();
        if (r && !silent) popup(itemOf(r.inputs[0][0]).iconIndex, "Nie upiekło się", "#ffb4a0");
    }
    function collectJob(b) {
        if (!jobReady(b)) return false;
        const [id, n] = b.job.out, item = itemOf(id);
        if (!spaceFor(item, n)) { complainNoSpace(item); return false; }
        swingThen(CROUCH_KIND, () => {
            delete b.job;
            playSe(SE.collect, 100);
            $gameParty.gainItem(item, n);
        });
        return true;
    }
    function hoursText(hours) {
        if (hours < 1) return Math.max(5, Math.ceil(hours * 12) * 5) + " min";
        const h = Math.max(1, Math.ceil(hours));
        return h === 1 ? "1 godz." : h + " godz.";
    }

    // ---- storage chests: b.store = { "i78": n, "w3": n, "a5": n } (item / weapon / armor id -> count)
    const isChest = b => !!(BUILDINGS[b.type] && BUILDINGS[b.type].slots);
    const itemKey = item => (DataManager.isItem(item) ? "i" : DataManager.isWeapon(item) ? "w" : "a") + item.id;
    function itemByKey(k) {
        const table = k[0] === "i" ? $dataItems : k[0] === "w" ? $dataWeapons : $dataArmors;
        return table[Number(k.slice(1))] || null;
    }
    // key items (tools, story items) never go into a chest
    const storable = item => !!item && !!item.name && !(DataManager.isItem(item) && item.itypeId === 2);
    function chestStacks(b) {
        const order = { i: 0, w: 1, a: 2 }, out = [];
        for (const k of Object.keys(b.store || {})) {
            const item = itemByKey(k);
            if (item && b.store[k] > 0) out.push({ item, n: b.store[k], k });
        }
        out.sort((p, q) => order[p.k[0]] - order[q.k[0]] || p.item.id - q.item.id);
        return out;
    }
    const chestKinds = b => Object.keys(b.store || {}).filter(k => b.store[k] > 0).length;
    const chestSlots = b => (BUILDINGS[b.type] || {}).slots || 0;
    const chestHolds = (b, item) => (b.store && b.store[itemKey(item)]) || 0;
    // what the party carries and may put away
    function packStacks() {
        return $gameParty.allItems().filter(storable).map(item => ({ item, n: $gameParty.numItems(item) })).filter(s => s.n > 0);
    }
    // food and what it is made of: the pantry takes only this
    const FOOD_EXTRA = [74, 76, 81, 82, 92];   // barley, honey, beer, flour, flax fibre
    const isFood = item => !!item && DataManager.isItem(item) && (!!(item.meta && item.meta.Food) || FOOD_EXTRA.includes(item.id) || (window.Spoilage && Spoilage.isPerishable(item)) || item.id === ITEM.rot);
    // null when it can move, otherwise the reason (direction: "put" into the chest, "take" out of it)
    function whyNotMove(b, item, direction) {
        if (direction === "put") {
            if (!storable(item)) return "Tego nie da się schować.";
            if (BUILDINGS[b.type].foodOnly && !isFood(item)) return "Tu trzyma się tylko jedzenie.";
            if (chestHolds(b, item) === 0 && chestKinds(b) >= chestSlots(b)) return "Skrzynia jest pełna.";
            if (chestHolds(b, item) >= $gameParty.maxItems(item)) return "Stos w skrzyni jest pełny.";
            return null;
        }
        if (chestHolds(b, item) < 1) return "Tego nie ma w skrzyni.";
        if ($gameParty.numItems(item) >= $gameParty.maxItems(item)) return "Stos w plecaku jest pełny.";
        return null;
    }
    // moves up to n; returns how many really moved
    function putInChest(b, item, n) {
        if (whyNotMove(b, item, "put") || !(n >= 1)) return 0;
        const k = itemKey(item), held = chestHolds(b, item);
        const moved = Math.min(n, $gameParty.numItems(item), $gameParty.maxItems(item) - held);
        if (moved < 1) return 0;
        $gameParty.loseItem(item, moved, false);
        if (window.Spoilage) Spoilage.chestPut(b, item, moved);   // the food keeps its age inside
        if (!b.store) b.store = {};
        b.store[k] = held + moved;
        return moved;
    }
    function takeFromChest(b, item, n) {
        if (whyNotMove(b, item, "take") || !(n >= 1)) return 0;
        const k = itemKey(item), held = chestHolds(b, item);
        const moved = Math.min(n, held, $gameParty.maxItems(item) - $gameParty.numItems(item));
        if (moved < 1) return 0;
        if (window.Spoilage) Spoilage.chestPreload(b, item, moved);   // ...and gets it back in the bag
        $gameParty.gainItem(item, moved);
        if (held - moved > 0) b.store[k] = held - moved; else delete b.store[k];
        return moved;
    }
    function openChest(b) {
        if (!isChest(b)) return false;
        lockPlayer(2);
        playSe(SE.chest, 100);
        SceneManager.push(Scene_Chest);
        SceneManager.prepareNextScene($gameMap.mapId(), b.id);
        const scene = SceneManager._scene;   // like Scene_Map.callMenu: settle the map before the snapshot
        if (scene && scene._mapNameWindow) scene._mapNameWindow.hide();
        if (scene && scene._waitCount !== undefined) scene._waitCount = 2;
        return true;
    }

    // A recipe done by hand (sawing, forging): it happens right now, costs stamina, and the time it
    // takes passes in front of the player (a short swing and pause) - nothing keeps working by itself.
    // unique recipes: the item that makes it pointless (the result itself or one that replaces it), 0 when none
    function ownedOutput(r) {
        if (!r.unique) return 0;
        if (countOf(r.output[0]) >= 1) return r.output[0];
        if (r.alsoBuilt && Object.values(farm().buildings).some(list => (list || []).some(b => b.type === r.alsoBuilt))) return r.output[0];   // pitched somewhere
        return (r.also || []).find(id => countOf(id) >= 1) || 0;
    }
    // a tool the recipe needs in the bag (it is not used up): its name when it is missing, "" otherwise
    const toolMissing = r => r.tool && countOf(r.tool) < 1 ? itemOf(r.tool).name : "";
    // the swing the body makes for a hand recipe: hammering (workbench, forge) and sawing look like it
    const craftSwing = r => r.swing === "crouch" ? CROUCH_KIND : r.startSe === "Hammer" ? HAMMER_KIND : r.startSe === "Slash1" ? RAKE_KIND : CROUCH_KIND;
    function craftManual(b, r) {
        const out = itemOf(r.output[0]), own = r.repair ? 0 : ownedOutput(r);
        if (own) { complain(itemOf(own).iconIndex, "Masz już: " + itemOf(own).name); return false; }
        if (toolMissing(r)) { complain(itemOf(r.tool).iconIndex, "Potrzebujesz: " + toolMissing(r)); return false; }
        const missing = missingInputs(r);
        if (missing.length > 0) { complain(itemOf(missing[0][0]).iconIndex, "Brakuje: " + itemOf(missing[0][0]).name); return false; }
        if (!r.repair && !spaceFor(out, r.output[1])) { complainNoSpace(out); return false; }
        if (!spendStamina(r.stamina || 0)) return false;
        for (const [id, n] of r.inputs) $gameParty.loseItem(itemOf(id), n, false);
        const se = r.startSe || (b && BUILDINGS[b.type] && BUILDINGS[b.type].startSe) || SE.build;
        swingThen(craftSwing(r), () => {
            lockPlayer(62);   // about a second, matching the sounds and the pause below
            playSe(se, 90);
            later(9, () => playSe(se, 80));
            later(18, () => playSe(se, 95));
            later(32, () => {
                if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(r.hours);
                if (r.repair) {
                    if (window.Durability) Durability.repair(r.repair);
                    popup(out.iconIndex, out.name + ": naprawione", "#9ff0a8");
                } else {
                    $gameParty.gainItem(out, r.output[1]);
                    if (r.tool) useTool(r.tool);
                }
            });
        });
        return true;
    }
    function rest(b) {
        const def = BUILDINGS[b.type];
        if (typeof $gameSystem.staminaRatio === "function" && $gameSystem.staminaRatio() >= 0.98) {
            complain(ICON.stamina, "Nie jesteś zmęczony");
            return false;
        }
        if (def.fire && !fireLit(b)) { complain(itemOf(ITEM.wood).iconIndex, "Ogień wygasł. Dorzuć drewna."); return false; }
        const restore = () => {
            if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(def.restHours || 1);
            if (window.Journal) Journal.afterRest();   // a night on the bedroll ends the day: the summary of it
            if (window.Atmosphere) Atmosphere.afterRest(def);   // a long rest saves the game (autosave)
            if (typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(def.rest);
            playSe(SE.rest, 100);
            popup(ICON.stamina, "+" + def.rest + " wytrzymałości", "#9ff0a8");
        };
        if (def.fire) {   // by a fire the player sits down on the ground, stays seated a moment, then stands back up
            swingThen(SIT_KIND, () => {
                lockPlayer(60);
                later(26, restore);
            });
            return true;
        }
        lockPlayer(95);
        later(35, restore);
        return true;
    }
    // no building needed: the player sits down right where they stand (the same sitting swing as a bench or a
    // campfire) and stays seated for as long as they like - +1 stamina every REST_TICK_MINUTES of game time,
    // shown floating over them. Moving away (or reaching full strength) stands them back up on their own.
    function lieDown(x, y) {
        if (typeof $gameSystem.staminaRatio === "function" && $gameSystem.staminaRatio() >= 0.98) {
            complain(ICON.stamina, "Nie jesteś zmęczony");
            return false;
        }
        const gameMinutes = () => $gameSystem.dayNightDay() * 1440 + $gameSystem.dayNightHour() * 60;
        let startMin = 0, given = 0;
        swingThen(SIT_KIND, () => {
            startMin = gameMinutes();
            given = 0;
        }, {
            holdWhile: () => typeof $gameSystem.staminaRatio !== "function" || $gameSystem.staminaRatio() < 1,
            onWait: () => {
                const due = Math.floor((gameMinutes() - startMin) / REST_TICK_MINUTES);
                if (due > given) {
                    given = due;
                    if (typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(1);
                    popup(ICON.stamina, "+1", "#9ff0a8");
                }
            },
            onHoldEnd: () => playSe(SE.rest, 100),
            still: true   // sits quite still with the hands folded in the lap (no shifting between two poses like by the fire)
        });
        return true;
    }

    // ------------------------------------------------------------------
    // What the action button offers on a tile: { title, entries } where an entry
    // is { name, icon, costs, right, help, enabled, run }. null = nothing here;
    // { done: true } = the action was carried out right away (ripe crop).
    // ------------------------------------------------------------------
    // (no "Zostaw" line on any menu: cancel closes it)

    // [[item id, amount]] -> [[icon, amount, in the bag, name]]: the list shows icon and amount, the popup the rest
    function costRows(pairs) {
        return pairs.map(([id, n]) => [itemOf(id).iconIndex, n, countOf(id), itemOf(id).name]);
    }
    function costsOf(type) {
        return costRows(BUILDINGS[type].cost);
    }
    function costText(type) {
        return BUILDINGS[type].cost.map(([id, n]) => itemOf(id).name + " ×" + n).join(", ");
    }

    // one line of a manual recipe (hand menu, workbench, forge...): costs with stock, what it gives; a tool that is
    // already owned stays on the list, dimmed; a recipe that needs a tool (the saw) is dimmed until it is in the bag
    function manualEntry(b, r) {
        const missing = missingInputs(r), out = itemOf(r.output[0]), own = ownedOutput(r), noTool = toolMissing(r);
        let help;
        if (own) help = "Masz już: " + itemOf(own).name + ".";
        else if (noTool) help = "Potrzebujesz: " + noTool + ".";
        else if (missing.length > 0) help = "Brakuje: " + missing.map(([id, n]) => itemOf(id).name + " (" + countOf(id) + "/" + n + ")").join(", ") + ".";
        else help = (r.repair ? "Naprawiasz: " + out.name : "Wynik: " + out.name + " ×" + r.output[1]) + ". Ręcznie: " + hoursText(r.hours) + ", -" + (r.stamina || 0) + " wytrzymałości.\n" + r.desc;
        const facts = ["Czas: " + hoursText(r.hours) + ", -" + (r.stamina || 0) + " wytrzymałości (praca ręczna)"];
        if (r.tool) facts.push("Wymaga: " + itemOf(r.tool).name + (noTool ? " (nie masz)" : " (masz)"));
        return { name: r.name, costs: costRows(r.inputs), enabled: !own && !noTool && missing.length === 0, help,
            tip: (own ? "Masz już: " + itemOf(own).name + ".\n" : "") + (r.repair ? "Naprawiasz: " + out.name : "Wynik: " + out.name + " ×" + r.output[1]) + ".\n" + r.desc, facts,
            run: () => craftManual(b, r) };
    }
    const handRecipeEntry = r => Object.assign(manualEntry(null, r), { icon: itemOf(r.output[0]).iconIndex });
    const hammerMissing = () => countOf(ITEM.hammer) < 1;
    const handNames = () => { const n = HAND_RECIPES.map(r => itemOf(r.output[0]).name.toLowerCase()); return n.length > 1 ? n.slice(0, -1).join(", ") + " i " + n[n.length - 1] : n.join(); };
    // the entry of the plot menu that opens the hand menu
    function handMenuEntry(x, y) {
        return { name: "Wytwórz...", icon: itemOf(ITEM.hammer).iconIndex, run: () => openHandMenu(x, y),
            help: "Rzeczy, które zrobisz sam, bez budynku: " + handNames() + ". Resztę narzędzi zrobisz w warsztacie.",
            tip: "Rzeczy, które zrobisz sam, z gałęzi, kamieni i lnu z ziemi, bez żadnego budynku: " + handNames() + ".\nMłotek jest potrzebny do budowy warsztatu, a w nim powstają wszystkie inne narzędzia." };
    }
    function openHandMenu(x, y) {
        const entries = HAND_RECIPES.map(handRecipeEntry);
        entries.push({ name: "Wróć", help: "", run: () => openMenu(x, y) });
        showMenu("Wytwarzanie ręczne", entries);
    }
    // the entry of the plot menu that opens the "pitch it straight away" menu (tent, bucket, forest bedroll)
    function placeMenuEntry(x, y) {
        return { name: "Postaw...", icon: itemOf(ITEM.tent).iconIndex, run: () => openPlaceMenu(x, y),
            help: "Stawiasz od razu, bez młotka: " + placeNames() + ".",
            tip: "Rzeczy, które stawiasz od razu, bez młotka i bez placu budowy: " + placeNames() + "." };
    }

    // shared by buildEntries/placeEntries: one menu entry per building type that passes `filter`, sharing all the
    // display logic (cost/help/facts) regardless of whether it needs a hammer and a site, or pitches straight away
    function buildingEntryList(x, y, filter) {
        const indoors = isHutInterior();
        return BUILDING_IDS.filter(type => !BUILDINGS[type].noBuild && (indoors ? BUILDINGS[type].indoor : !BUILDINGS[type].indoorOnly) && filter(BUILDINGS[type])).map(type => {
            const def = BUILDINGS[type];
            const missing = missingMaterials(type);
            const built = !!def.single && !!hutOf();
            const how = def.instant ? "Wybierzesz miejsce, a stawia się od razu, bez młotka." : "Wybierzesz miejsce, a potem z młotkiem uderzasz w plac budowy.";
            let help = def.desc + "\nKoszt: " + costText(type) + ". " + how;
            if (missing.length > 0) help = "Brakuje: " + missing.map(([id, n]) => itemOf(id).name + " (" + countOf(id) + "/" + n + ")").join(", ") + ".\n" + def.desc;
            if (built) help = "Masz już chatkę: drugiej nie potrzeba.\n" + def.desc;
            const facts = [def.instant ? "Rozstawiasz od razu (-" + def.stamina + " wytrzymałości), bez młotka" : "Uderzeń młotkiem: " + hitsNeeded(def) + " (po " + STAMINA.buildHit + " wytrzymałości)"];
            if (def.w > 1 || (def.h || 1) > 1) facts.push("Zajmuje " + def.w + " × " + (def.h || 1) + " pól" + (def.yard ? " (ogrodzony wybieg)" : ""));
            return { name: def.name, costs: costsOf(type), help, enabled: missing.length === 0 && !built, run: () => startPlacement(type, x, y),
                tip: def.desc + "\n" + (def.instant ? "Wybierasz miejsce, a namiot stoi od razu." : "Najpierw wybierasz miejsce, potem młotkiem uderzasz w plac budowy."), facts };
        });
    }
    // real buildings: hammer + a construction site (the Q list; the ground menu has no "Zbuduj..." any more). Indoors
    // (equipping the hut) this still lists every piece of furniture regardless of instant/site, since "Wyposaż chatkę" is its own single, already-unified list.
    function buildEntries(x, y) {
        const indoors = isHutInterior();
        const entries = buildingEntryList(x, y, def => indoors || !def.instant);
        if (hammerMissing()) entries.unshift(handRecipeEntry(HAND_RECIPES.find(r => r.id === "hammer")));   // no hammer yet: the way to make one comes first
        return entries;
    }
    // things pitched straight from the bag: no hammer, no construction site (tent, bucket, forest bedroll)
    const placeNames = () => { const n = BUILDING_IDS.filter(t => BUILDINGS[t].instant).map(t => BUILDINGS[t].name.toLowerCase()); return n.length > 1 ? n.slice(0, -1).join(", ") + " i " + n[n.length - 1] : n.join(); };
    function placeEntries(x, y, direct) {
        const entries = buildingEntryList(x, y, def => !!def.instant);
        if (!direct) entries.push({ name: "Wróć", help: "", run: () => openMenu(x, y) });
        return entries;
    }

    function digEntry(x, y) {
        const soil = itemOf(ITEM.soil);
        return { name: "Wykop ziemię", icon: soil.iconIndex, right: "-" + STAMINA.dig,
            help: "Łopata. Wykopujesz 2-3 sztuki ziemi (do pieca i budowy). Masz teraz: " + countOf(ITEM.soil) + ".", run: () => dig(x, y) };
    }
    function waterEntry(x, y) {
        const plot = plotAt(x, y), active = wateredRecently(plot);
        return { name: "Podlej", icon: itemOf(ITEM.wateringCan).iconIndex, right: "-" + STAMINA.water,
            help: "Konewka (woda: " + canCharges() + "/" + CAN_MAX + "). Rośliny rosną o 20% szybciej w dniu podlania i dzień później." + (active ? " Ta ziemia jest już podlana." : "") + (bucketFor(x, y) ? " Bez konewki podlejesz wodą z wiadra obok." : ""),
            run: () => water(x, y) };
    }

    // menu lines of a crafting station: the running job, its result, or the recipes
    // a station's menu has two tabs (left/right switch them), in this order: "Przepis" - the recipes (entries marked
    // tab: "recipe"), the one it opens on - and "Akcja", everything else (the running job and its result, warming up,
    // fuel, upgrades, demolishing)
    const TABS = [["recipe", "Przepis"], ["action", "Akcja"]];
    const splitTabs = entries => TABS.map(([id, name]) => ({ name, entries: entries.filter(e => (e.tab || "action") === id) }));

    // menu lines of a crafting station: the running job and its result, then the recipes. While something is inside,
    // the background recipes stay on the list, greyed out with the reason, so the "Przepis" tab never goes empty.
    function stationEntries(b, def) {
        const entries = [];
        const autoRecipes = def.recipes.filter(r => !r.manual), manualRecipes = def.recipes.filter(r => r.manual);
        let busy = null;
        if (b.job) {
            const [id, n] = b.job.out, item = itemOf(id);
            if (jobReady(b)) {
                entries.push({ name: "Zbierz: " + item.name + " ×" + n, icon: item.iconIndex, help: "Wypał skończony. Wyjmujesz gotowy produkt.", run: () => collectJob(b) });
                busy = "Najpierw zbierz to, co jest gotowe (zakładka Akcja).";
            } else {
                entries.push({ name: def.working || "Trwa wypał...", icon: item.iconIndex, right: "~" + hoursText(jobHoursLeft(b)), enabled: false,
                    help: "Będzie gotowe za około " + hoursText(jobHoursLeft(b)) + " (czas gry płynie też, gdy jesteś daleko)." });
                if (def.hang) entries.push({ name: "Poczekaj przy ogniu", icon: 82, help: "Siadasz przy ogniu, aż się upiecze. Możesz też wstać i odejść: piecze się dalej.", run: () => waitAtFire(b) });
                busy = (def.working || "Trwa wypał...") + " Poczekaj, aż się skończy.";
            }
        }
        for (const r of autoRecipes) {
            const missing = missingInputs(r), out = itemOf(r.output[0]), waterBad = waterProblem(r);
            const sit = r.roast ? "\n" + (def.hang ? "Zawieszasz to na haczyku trójnogu: piecze się samo, możesz odejść." : "Siedzisz z tym na patyku nad ogniem. Jeśli odejdziesz przed końcem, nic się nie upiecze.") : "";
            const toolNote = r.tool ? " Potrzebne: " + itemOf(r.tool).name + "." : "";
            const waterNote = r.water ? " Potrzeba: " + r.water + " porcji wody z wiadra." : "";
            const help = busy ? busy
                : missing.length > 0 ? "Brakuje: " + missing.map(([id, n]) => itemOf(id).name + " (" + countOf(id) + "/" + n + ")").join(", ") + "." + toolNote + waterNote
                : waterBad ? waterBad + "." + waterNote
                : "Wynik: " + out.name + " ×" + r.output[1] + ", " + hoursText(r.hours).replace(/\.$/, "") + ".\n" + r.desc + sit + toolNote;
            entries.push({ name: r.name, costs: costRowsWithWater(r), enabled: !busy && missing.length === 0 && !waterBad, help, run: () => startJob(b, r.id), tab: "recipe",
                tip: (busy ? busy + "\n" : "") + "Wynik: " + out.name + " ×" + r.output[1] + ".\n" + r.desc, facts: [r.roast && !def.hang ? "Czas: " + hoursText(r.hours) + " (siedzisz przy ogniu; odejście przerywa pieczenie)" : "Czas: " + hoursText(r.hours) + (def.hang ? " (piecze się na trójnogu, możesz odejść)" : " (piec pracuje w tle)")] });
        }
        // hand work is available at any time (also while the fire of the same building burns)
        for (const r of manualRecipes) entries.push(Object.assign(manualEntry(b, r), { tab: "recipe" }));
        if (def.repairs && window.Durability) for (const r of Durability.repairRecipes()) entries.push(Object.assign(manualEntry(b, r), { tab: "recipe" }));
        return entries;
    }

    // a real building (not a build site): rest/produce/chest/sleep/recipes/upgrade/pack/demolish entries
    function buildingMenuFor(b) {
        const def = geoOf(b);
        const entries = [];
        if (def.door && !b.site) entries.push({ name: "Wejdź do środka", icon: 82, help: "Wchodzisz do chatki. Drzwi otwierasz też, po prostu w nie wchodząc.", run: () => enterHut(b) });
        if (def.rest) {
            const fireOut = !!def.fire && !fireLit(b);
            entries.push({ name: b.type === "bench" ? "Usiądź i odpocznij" : b.type === "bedroll" ? "Zdrzemnij się" : "Ogrzej się przy ogniu", icon: 82, right: "+" + def.rest, enabled: !fireOut,
                help: fireOut ? "Ogień wygasł. Dorzuć drewna, żeby się ogrzać." : "Odnawia wytrzymałość. Mija " + hoursText(def.restHours || 1), run: () => rest(b) });
        }
        entries.push(...feedFireEntries(b));
        if (def.water) entries.push(...wellEntries());
        if (def.rain && !b.site) entries.push(...bucketEntries(b));
        if (def.produce) {
            const ready = readyProduce(b), item = itemOf(def.produce.item);
            const toolNote = def.produce.tool ? " Potrzebne: " + itemOf(def.produce.tool).name + "." : "";
            entries.push({ name: ready > 0 ? "Zbierz: " + item.name + " ×" + ready : "Zbierz: " + item.name, icon: item.iconIndex, enabled: ready > 0,
                help: (snareSprung(b) ? "W pułapce siedzi złapany zając. " : "") + (ready > 0 ? "Zabierasz wszystko, co jest gotowe."
                    : def.lure ? (snareBait(b) ? "Pusto. Przynęta leży, trzeba poczekać, aż jakiś zając się skusi." : "Pusto. Sama pułapka nic nie złapie: załóż przynętę.")
                    : "Jeszcze nic nie ma. Następna porcja za " + daysToProduce(b) + " dn.") + toolNote,
                run: () => collect(b) });
        }
        if (def.lure && !b.site) entries.push(snareBaitEntry(b, def));
        let title = def.name + (def.rain ? " (" + bucketUnits(b) + "/" + def.rain.max + ")" : "");
        if (def.slots) {
            title += " (" + chestKinds(b) + "/" + def.slots + ")";
            entries.push({ name: "Otwórz", right: chestKinds(b) + "/" + def.slots, help: "Odkładaj i zabieraj przedmioty. Zmieści się " + def.slots + " rodzajów, po 99 sztuk.", run: () => openChest(b) });
        }
        if (def.sleep) entries.push({ name: "Prześpij noc", icon: itemOf(def.pack || def.cost[0][0]).iconIndex, right: def.sleepRestore < 1 ? "~" + Math.round(def.sleepRestore * 100) + "% sił" : "do rana",
            help: "Kładziesz się spać do " + wakeHour() + ":00. " + (def.sleepRestore < 1 ? "Odnawia około " + Math.round(def.sleepRestore * 100) + "% sił (" + (isHutInterior() ? "pod dachem chatki bez kary za deszcz i zimno" : "w deszczu, śniegu i zimą " + Math.round(def.sleepBad * 100) + "%") + "), " : "Odnawia wszystkie siły i zdrowie, ") + "dostajesz podsumowanie dnia, a gra zapisuje się sama.", run: () => sleepInTent(b) });
        if (def.recipes) entries.push(...stationEntries(b, def));
        if (def.upgrade && !b.job) entries.push(upgradeEntry(b, def));
        if (def.pack) {
            const wet = !!def.rain && bucketUnits(b) >= 1;   // a bucket with water in it is picked up together with the water: it just weighs more
            entries.push({ name: def.packName || "Złóż namiot", icon: itemOf(def.pack).iconIndex, enabled: true,
                help: (wet ? "Zabierasz z wodą w środku (" + bucketUnits(b) + "/" + def.rain.max + ").\n" : "") + (def.packHelp || "Składasz namiot i zabierasz go ze sobą. Rozstawisz go, gdzie zechcesz."), run: () => packUp(b) });
        }
        const back = def.refund || def.cost.map(([id, n]) => [id, Math.floor(n / 2)]).filter(([, n]) => n > 0);
        const block = demolishBlock(b);
        if (!def.pack) entries.push({ name: "Rozbierz", enabled: !block, help: block || "Zwraca połowę materiałów" + (back.length ? ": " + back.map(([id, n]) => itemOf(id).name + " ×" + n).join(", ") : "") + ".", run: () => demolish(b) });
        return def.recipes ? { title, entries, tabs: splitTabs(entries) } : { title, entries };
    }
    // a growing or ripe crop: harvest on the spot, or water/uproot menu
    function cropMenuFor(x, y, plot) {
        const def = CROPS[plot.crop];
        if (isRipe(x, y, plot)) { harvest(x, y); return { done: true }; }
        return {
            title: def.name + ": jeszcze " + daysLeft(x, y, plot) + " dn." + (wateredRecently(plot) ? " (podlane)" : ""),
            entries: [waterEntry(x, y), { name: "Wyrwij roślinę", help: "Usuwa roślinę. Pole wraca do zaoranej ziemi.", run: () => uproot(x, y) }]
        };
    }
    // bare ground: cleared (rake), raked (till), or tilled-empty (sow) - a plot with none of these is impossible here
    // (buildings are not on this menu: Q opens the build list from anywhere)
    function groundMenuFor(x, y, plot) {
        if (plot.s === "cleared") {
            const entries = [];
            if (plot.natural) {   // resting comes first: sit down on the grass
                const full = typeof $gameSystem.staminaRatio === "function" && $gameSystem.staminaRatio() >= 0.98;
                entries.push({ name: "Odpocznij na ziemi", icon: 82, right: "+1/" + REST_TICK_MINUTES + "min", enabled: !full,
                    help: full ? "Nie jesteś zmęczony." : "Siadasz na trawie. Dopóki się nie ruszysz, co " + REST_TICK_MINUTES + " minuty gry odzyskujesz 1 wytrzymałości. Wstajesz, gdy się ruszysz albo wypoczniesz do pełna.",
                    run: () => lieDown(x, y) });
            }
            entries.push(handMenuEntry(x, y),
                digEntry(x, y),
                { name: "Zagrab ziemię", icon: itemOf(ITEM.rake).iconIndex, right: "-" + STAMINA.rake, help: plot.natural ? "Grabie. Zrywa darń i przygotowuje ziemię pod orkę." : "Grabie. Przygotowuje ziemię pod orkę.", run: () => rake(x, y) });
            // with pine seeds in the bag: plant a tree here (Forestry.js)
            if (window.Forestry && countOf(ITEM.pineSeed) > 0) entries.push(Forestry.plantEntry(x, y));
            entries.push(placeMenuEntry(x, y));
            return { title: plot.natural ? "Nieuprawiana ziemia" : "Oczyszczona ziemia", entries };
        }
        if (plot.s === "raked") {
            return { title: "Zagrabiona ziemia", entries: [
                handMenuEntry(x, y),
                digEntry(x, y),
                { name: "Zaoraj ziemię", icon: itemOf(ITEM.hoe).iconIndex, right: "-" + STAMINA.hoe, help: "Motyka. Zaorana ziemia nadaje się do siewu.", run: () => till(x, y) },
                placeMenuEntry(x, y)] };
        }
        // tilled and empty: sow (or pre-water)
        const season = seasonIndex(today());
        const entries = CROP_IDS.map(id => {
            const def = CROPS[id], seed = itemOf(def.seed), n = countOf(def.seed);
            const inSeason = !def.seasons || def.seasons.includes(season);
            let help;
            if (!inSeason) help = "Nie sadzi się o tej porze roku (" + seasonOf(today()) + "). Pory: " + def.seasons.map(s => SEASON_NAMES[s]).join(", ") + ".";
            else if (n < 1) help = "Nie masz nasion: " + seed.name + ".";
            else help = "Dojrzeje za " + def.days + " dn. Zbiór: " + itemOf(def.produce).name + ".";
            return { name: "Zasiej: " + def.name, icon: seed.iconIndex, right: "×" + n, enabled: inSeason && n > 0, help, run: () => plant(x, y, id) };
        });
        entries.push(waterEntry(x, y));
        return { title: "Zaorana ziemia (" + seasonOf(today()) + ")" + (wateredRecently(plot) ? " - podlana" : ""), entries };
    }
    // dispatcher: figures out which case applies (building / build site / hut floor / crop / bare ground) and delegates
    function menuFor(x, y) {
        const b = solidAt(x, y);
        if (!b && buildingAt(x, y)) return null;   // the open ground inside a yard: nothing to do there (no digging, no sowing)
        if (b && b.site) return siteMenu(b, x, y);
        if (b) return buildingMenuFor(b);
        const plot = plotAt(x, y);
        if (!plot || !tileIsFree(x, y)) return null;
        if (plot.s === "floor") return { title: "Wyposaż chatkę", entries: buildEntries(x, y) };
        if (plot.crop) return cropMenuFor(x, y, plot);
        return groundMenuFor(x, y, plot);
    }

    // the menu is a window of the current map scene
    // tabs (optional): [{ name, entries }] - the window shows one tab at a time; entries is still the whole list
    function showMenu(title, entries, kind, index, tabs) {
        const scene = SceneManager._scene;
        if (scene && typeof scene.openFarmMenu === "function") scene.openFarmMenu(title, entries, kind, index, tabs);
    }
    function openMenu(x, y) {
        const menu = menuFor(x, y);
        if (menu && menu.entries) showMenu(menu.title, menu.entries, undefined, undefined, menu.tabs);
    }
    function openPlaceMenu(x, y) {
        showMenu("Postaw", placeEntries(x, y));
    }

    // ---- Q and E on the map
    // Q: everything that can be built, from wherever the player stands (placing starts at the tile in front of them); in the hut only the furniture
    function openBuildKeyMenu() {
        let t = targetTile();
        if (!$gameMap.isValid(t.x, t.y)) t = { x: $gamePlayer.x, y: $gamePlayer.y };
        showMenu(isHutInterior() ? "Wyposaż chatkę" : "Budowa", buildEntries(t.x, t.y), "build");
        return true;
    }

    // E: every dish in the bag; what it gives is in the popup, the ones that would do nothing now are greyed out and the popup says why
    const foodOf = item => (window.Survival && Survival.foodInfo && item && DataManager.isItem(item) ? Survival.foodInfo(item) : null);
    function foodFacts(item, food) {
        const facts = [];
        if (food.stamina) facts.push("Wytrzymałość: +" + food.stamina);
        if (needsOn() && Needs.foodValues) {
            const [fed, water] = Needs.foodValues(item, food);
            if (fed > 0) facts.push("Sytość: +" + fed);
            if (water > 0) facts.push("Nawodnienie: +" + water);
        }
        for (const [name, hours] of [[food.buff, food.hours], [food.buff2, food.hours2]]) {
            const buff = name && window.Survival && Survival.BUFFS && Survival.BUFFS[name];
            if (buff && hours > 0) facts.push(buff.name + " (" + hours + " godz.): " + buff.desc);
        }
        const fresh = window.Spoilage && Spoilage.freshnessText ? Spoilage.freshnessText(item.id) : "";
        if (fresh) facts.push(fresh);
        return facts;
    }
    function whyNotEat(food) {
        if (food.buff) return "Teraz nic by ci to nie dało: masz pełnię sił, a efekt już działa.";
        return "Teraz nic by ci to nie dało: masz pełnię sił" + (needsOn() ? ", nie jesteś głodny ani spragniony" : "") + ".";
    }
    function foodEntry(item, food, index) {
        const can = $gameParty.canUse(item);
        return { name: item.name, icon: item.iconIndex, right: "×" + $gameParty.numItems(item), enabled: can,
            tip: item.description + (can ? "" : "\n" + whyNotEat(food)), facts: foodFacts(item, food), run: () => eatFromMenu(item, index) };
    }
    function eatFromMenu(item, index) {
        if (!$gameParty.hasItem(item) || !$gameParty.canUse(item)) return false;
        SoundManager.playUseItem();
        $gameParty.leader().useItem(item);   // Survival.js and Needs.js do the eating: stamina, buffs, hunger and thirst, the popup over the player
        openFoodKeyMenu(index, true);        // the menu stays: the next dish, the list already up to date
        return true;
    }
    function openFoodKeyMenu(index, quiet) {
        const entries = [];
        for (const item of $gameParty.items()) {
            const food = foodOf(item);
            if (food) entries.push(foodEntry(item, food, entries.length));
        }
        if (entries.length === 0) {
            if (!quiet) complain(ICON.hunger, "Nie masz nic do jedzenia");
            return false;
        }
        showMenu("Jedzenie", entries, "food", index);
        return true;
    }
    const openKeyMenu = kind => (kind === "build" ? openBuildKeyMenu() : openFoodKeyMenu());

    function targetTile() {
        const d = $gamePlayer.direction();
        return { x: $gameMap.roundXWithDirection($gamePlayer.x, d), y: $gameMap.roundYWithDirection($gamePlayer.y, d) };
    }

    // ---- the hut's door: the doorway is a passable cell, stepping into it (or "Wejdź do środka") changes the map; the doormat inside leads out
    function enterHut(b) {
        if (!b || b.site || $gamePlayer.isTransferring() || $gameMap.isEventRunning()) return false;
        hutSanitize(true);
        playSe("Door1", 100);
        $gamePlayer.reserveTransfer(HUT_MAP, HUT_ROOM.doorX, HUT_ROOM.y1, 8, 0);
        return true;
    }
    function leaveHut() {
        if ($gamePlayer.isTransferring()) return false;
        const h = hutOf();
        playSe("Door1", 90);
        if (h) {
            const d = hutDoorCell(h);
            $gamePlayer.reserveTransfer(h.mapId, d.x, d.y + 1, 2, 0);
        } else {
            $gamePlayer.reserveTransfer(3, 8, 10, 2, 0);   // the hut is gone: back to the farm
        }
        return true;
    }
    const _Game_Player_checkEventTriggerHere = Game_Player.prototype.checkEventTriggerHere;
    Game_Player.prototype.checkEventTriggerHere = function(triggers) {
        _Game_Player_checkEventTriggerHere.call(this, triggers);
        if (!Array.isArray(triggers) || !triggers.includes(1) || this.isTransferring() || $gameMap.isEventRunning() || $gameMessage.isBusy()) return;
        if (isHutInterior()) {
            if (this.x === HUT_ROOM.doorX && this.y === HUT_ROOM.doorY) leaveHut();
        } else {
            const b = hutDoorAt(this.x, this.y);
            if (b) enterHut(b);
        }
    };

    // the action button, when nothing else answers
    const _Game_Player_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (_Game_Player_triggerButtonAction.call(this)) return true;
        if (!Input.isTriggered("ok")) return false;
        const scene = SceneManager._scene;
        if (!(scene instanceof Scene_Map) || typeof scene.openFarmMenu !== "function") return false;
        const t = targetTile();
        if (!$gameMap.isValid(t.x, t.y)) return false;
        if (gatherAt(t.x, t.y)) {   // something lying there (a stone, flax, berries...): take it (the menu opens on the next press)
            pickGather(t.x, t.y);
            return true;
        }
        if (isWaterTile(t.x, t.y)) {
            const water = waterMenu();
            showMenu(water.title, water.entries);
            return true;
        }
        const menu = menuFor(t.x, t.y);
        if (!menu) return false;
        if (menu.entries) showMenu(menu.title, menu.entries, undefined, undefined, menu.tabs);
        return true;
    };

    // timers and the lock (rest, building) run with the player
    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        _Game_Player_update.call(this, sceneActive);
        if ($gameTemp._farmLock > 0) $gameTemp._farmLock--;
        const timers = $gameTemp._farmTimers;
        if (timers && timers.length > 0) {
            for (const timer of timers.slice()) {
                if (--timer.t <= 0) {
                    timers.splice(timers.indexOf(timer), 1);
                    timer.fn();
                }
            }
        }
    };
    const _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if ($gameTemp._farmMenuOpen || $gameTemp._buildMode || $gameTemp._farmLock > 0) return false;
        return _Game_Player_canMove.call(this);
    };

    PluginManager.registerCommand(pluginName, "clearArea", args => {
        const x0 = num(args.x, 0), y0 = num(args.y, 0), w = Math.max(1, num(args.width, 1)), h = Math.max(1, num(args.height, 1));
        const tiles = [];
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) tiles.push({ x, y });
        $gameSystem.clearLand($gameMap.mapId(), tiles);
    });

    // ------------------------------------------------------------------
    // The menu: a list of entries with a help window under it (Scene_Map).
    // ------------------------------------------------------------------
    function Window_FarmList() {
        this.initialize(...arguments);
    }
    Window_FarmList.prototype = Object.create(Window_Command.prototype);
    Window_FarmList.prototype.constructor = Window_FarmList;

    Window_FarmList.prototype.initialize = function(rect) {
        this._entries = [];
        Window_Command.prototype.initialize.call(this, rect);
        this.hide();
        this.deactivate();
    };
    // the text of these menus (the list, its title plate and the popup) is MENU_SMALLER px smaller than the other windows'
    const MENU_SMALLER = 4;
    Window_FarmList.prototype.resetFontSettings = function() {
        Window_Command.prototype.resetFontSettings.call(this);
        this.contents.fontSize = $gameSystem.mainFontSize() - MENU_SMALLER;
    };

    Window_FarmList.prototype.makeCommandList = function() {
        for (const e of this._entries || []) this.addCommand(e.name, "entry", e.enabled !== false);
    };

    Window_FarmList.prototype.setup = function(title, entries, index, tabs) {
        this._title = title;
        this._tabs = tabs || null;
        this._tab = 0;
        this._entries = tabs ? tabs[0].entries : entries;
        this.refresh();
        this.select(Math.max(0, Math.min(index || 0, this._entries.length - 1)));
    };
    // a menu with tabs: left / right go to the neighbouring tab (up / down still move along the list)
    Window_FarmList.prototype.processCursorMove = function() {
        if (this._tabs && this.isCursorMovable()) {
            const step = Input.isTriggered("right") ? 1 : Input.isTriggered("left") ? -1 : 0;
            if (step && this.switchTab(this._tab + step)) {
                this.playCursorSound();
                return;
            }
        }
        Window_Command.prototype.processCursorMove.call(this);
    };
    Window_FarmList.prototype.switchTab = function(tab) {
        if (!this._tabs || tab < 0 || tab >= this._tabs.length || tab === this._tab) return false;
        this._tab = tab;
        this._entries = this._tabs[tab].entries;
        this.refresh();
        this.select(0);
        this.callHandler("tab");
        this.callUpdateHelp();
        return true;
    };
    // Q and E: the scene decides (a build or food menu closes / switches, the others ignore them); the window stays active
    Window_FarmList.prototype.processPageup = function() {
        this.updateInputData();
        this.callHandler("pageup");
    };
    Window_FarmList.prototype.processPagedown = function() {
        this.updateInputData();
        this.callHandler("pagedown");
    };

    Window_FarmList.prototype.currentEntry = function() {
        return this._entries[this.index()] || null;
    };

    Window_FarmList.prototype.drawItem = function(index) {
        const entry = this._entries[index], rect = this.itemLineRect(index);
        this.changePaintOpacity(entry.enabled !== false);
        let x = rect.x, right = rect.x + rect.width;
        if (entry.costs) {
            for (let i = entry.costs.length - 1; i >= 0; i--) {
                const [icon, n] = entry.costs[i], label = "×" + n, w = this.textWidth(label);
                right -= w;
                this.drawText(label, right, rect.y, w, "left");
                right -= ImageManager.iconWidth + 2;
                this.drawIcon(icon, right, rect.y + 2);
                right -= 8;
            }
        } else if (entry.right) {
            const w = this.textWidth(entry.right);
            right -= w;
            this.drawText(entry.right, right, rect.y, w, "left");
            right -= 8;
        }
        if (entry.icon) {
            this.drawIcon(entry.icon, x, rect.y + 2);
            x += ImageManager.iconWidth + 4;
        }
        this.drawText(entry.name, x, rect.y, Math.max(0, right - x), "left");
        this.changePaintOpacity(true);
    };

    // The help window does not wrap lines by itself, and the hand-work texts are long.
    function wrapLines(win, text, maxWidth) {
        const lines = [];
        for (const paragraph of String(text).split("\n")) {
            let line = "";
            for (const word of paragraph.split(" ")) {
                const trial = line ? line + " " + word : word;
                if (line && win.textWidth(trial) > maxWidth) {
                    lines.push(line);
                    line = word;
                } else {
                    line = trial;
                }
            }
            lines.push(line);
        }
        return lines;
    }

    // The description of the highlighted entry is a popup to the right of the list, level with the row it belongs to.
    Window_FarmList.prototype.updateHelp = function() {
        this.followTip();
    };
    Window_FarmList.prototype.followTip = function() {
        const tip = this._helpWindow;
        if (!tip || this.index() < 0) return;
        const rect = this.itemRect(this.index());
        tip.showFor(this.currentEntry(), this.x + this.width + 18, this.y + this.padding + rect.y + rect.height / 2);
    };
    Window_FarmList.prototype.update = function() {
        Window_Command.prototype.update.call(this);
        if (this.visible && this.active) this.followTip();   // the list scrolls smoothly: keep the popup level with the row
    };

    // the name of the menu (what is being done to which thing), above the list
    function Window_FarmTitle() {
        this.initialize(...arguments);
    }
    Window_FarmTitle.prototype = Object.create(Window_Base.prototype);
    Window_FarmTitle.prototype.constructor = Window_FarmTitle;
    // tabs (optional): their names, drawn on a second line under the title with the current one lit and underlined
    Window_FarmTitle.prototype.setTitle = function(text, tabs) {
        this._text = text || "";
        this._tabs = tabs || null;
        this.setTab(0);
    };
    Window_FarmTitle.prototype.setTab = function(tab) {
        const c = this.contents;
        c.clear();
        this.resetFontSettings();
        c.fontSize = 28 - MENU_SMALLER;
        this.changeTextColor(ColorManager.textColor(16));
        this.drawText(this._text, 0, 0, this.innerWidth, "left");
        if (this._tabs) {
            const y = this.lineHeight();
            c.fontSize = 24 - MENU_SMALLER;
            let x = 0;
            this._tabs.forEach((name, i) => {
                const w = this.textWidth(name), on = i === tab;
                this.changeTextColor(on ? ColorManager.normalColor() : ColorManager.textColor(7));
                this.changePaintOpacity(on);
                this.drawText(name, x, y, w + 4, "left");
                if (on) c.fillRect(x, y + this.lineHeight() - 6, w, 3, ColorManager.textColor(16));
                x += w + 28;
            });
            this.changePaintOpacity(false);
            this.changeTextColor(ColorManager.textColor(7));
            this.drawText("←  →", 0, y, this.innerWidth, "right");
            this.changePaintOpacity(true);
        }
        this.resetFontSettings();
    };

    // The popup: name, description, facts and what is needed (green when it is in the bag, red when it is not).
    const TIP_FONT = 24 - MENU_SMALLER, TIP_LINE = 30 - MENU_SMALLER;
    function Window_FarmTip() {
        this.initialize(...arguments);
    }
    Window_FarmTip.prototype = Object.create(Window_Base.prototype);
    Window_FarmTip.prototype.constructor = Window_FarmTip;

    Window_FarmTip.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._entry = null;
        this._ops = [];
        this._shown = 99;
        this._baseX = rect.x;
        this._rowY = rect.y;
        this.pointer = null;   // the little notch pointing at the row (a sprite of the scene, set by Scene_Map)
        this.hide();
    };
    Window_FarmTip.prototype.hide = function() {
        Window_Base.prototype.hide.call(this);
        if (this.pointer) this.pointer.visible = false;
    };
    Window_FarmTip.prototype.reset = function() {
        this._entry = null;
        this.hide();
    };
    Window_FarmTip.prototype.bodyText = function(entry) {
        return entry.tip !== undefined ? entry.tip : (entry.help || "");
    };
    Window_FarmTip.prototype.hasContent = function(entry) {
        return !!entry && !!(this.bodyText(entry) || (entry.costs && entry.costs.length > 0) || (entry.facts && entry.facts.length > 0));
    };
    Window_FarmTip.prototype.showFor = function(entry, x, rowY) {
        this._baseX = x;
        this._rowY = rowY;
        if (entry !== this._entry) {
            this._entry = entry;
            if (this.hasContent(entry)) {
                this.build(entry);
                this._shown = 0;
                this.show();
            } else {
                this.hide();
            }
        }
        this.place();
    };

    // measure everything first (the window is as tall as its content), then paint
    Window_FarmTip.prototype.build = function(entry) {
        this.width = Math.max(300, Math.min(440, Graphics.boxWidth - this._baseX - 16));
        this.resetFontSettings();
        this.contents.fontSize = TIP_FONT;
        const inner = this.width - this.padding * 2;
        const ops = [];
        let h = 0;
        const add = (op, height) => { op.y = h; ops.push(op); h += height; };
        add({ kind: "name", text: entry.name, icon: entry.icon }, 42 - MENU_SMALLER);
        add({ kind: "rule" }, 12);
        const body = this.bodyText(entry);
        if (body) for (const line of wrapLines(this, body, inner - 4)) add({ kind: "text", text: line }, TIP_LINE);
        if (entry.facts && entry.facts.length > 0) {
            h += 6;
            for (const fact of entry.facts) for (const line of wrapLines(this, fact, inner - 4)) add({ kind: "fact", text: line }, 28 - MENU_SMALLER);
        }
        if (entry.costs && entry.costs.length > 0) {
            h += 10;
            add({ kind: "heading", text: "Potrzebne" }, 30 - MENU_SMALLER);
            for (const cost of entry.costs) add({ kind: "cost", cost }, 34);
        }
        this._ops = ops;
        this.height = h + this.padding * 2;
        this.createContents();
        this.paintOps(inner);
    };

    Window_FarmTip.prototype.paintOps = function(inner) {
        const c = this.contents;
        for (const op of this._ops) {
            this.resetFontSettings();
            c.fontSize = TIP_FONT;
            if (op.kind === "name") {
                let x = 0;
                if (op.icon) {
                    this.drawIcon(op.icon, 0, op.y + 4);
                    x = ImageManager.iconWidth + 8;
                }
                c.fontSize = 30 - MENU_SMALLER;
                this.changeTextColor(ColorManager.textColor(16));
                this.drawText(op.text, x, op.y, inner - x);
            } else if (op.kind === "rule") {
                c.fillRect(0, op.y + 2, inner, 2, ColorManager.textColor(26));
            } else if (op.kind === "text") {
                this.drawText(op.text, 0, op.y - 3 - MENU_SMALLER / 2, inner);   // (centred in the shorter row)
            } else if (op.kind === "fact") {
                this.changeTextColor(ColorManager.textColor(7));
                c.fontSize = 22 - MENU_SMALLER;
                this.drawText(op.text, 0, op.y - 4 - MENU_SMALLER / 2, inner);
            } else if (op.kind === "heading") {
                this.changeTextColor(ColorManager.systemColor());
                this.drawText(op.text, 0, op.y - 3 - MENU_SMALLER / 2, inner);
            } else if (op.kind === "cost") {
                const [icon, need, have, name] = op.cost;
                this.drawIcon(icon, 0, op.y + 1);
                if (name === undefined) {
                    this.drawText("×" + need, ImageManager.iconWidth + 8, op.y - 1, inner - 44);
                } else {
                    this.drawText(name, ImageManager.iconWidth + 8, op.y - 1, inner - 44 - 110);
                    this.changeTextColor(ColorManager.textColor(have >= need ? 3 : 10));
                    this.drawText(have + " / " + need, inner - 110, op.y - 1, 110, "right");
                }
            }
        }
    };

    // level with the row, kept on the screen, sliding in a little; the notch shows which row it belongs to
    Window_FarmTip.prototype.place = function() {
        if (!this._entry || !this.visible) return;
        const slide = -Math.round(10 * (1 - Math.min(1, this._shown / 8)));
        const top = Math.round(Math.max(8, Math.min(Graphics.boxHeight - this.height - 8, this._rowY - this.height / 2)));
        this.x = this._baseX + slide;
        this.y = top;
        const p = this.pointer;
        if (p) {
            const layer = SceneManager._scene && SceneManager._scene._windowLayer;
            p.x = this.x - 15 + (layer ? layer.x : 0);
            p.y = Math.round(Math.max(top + 20, Math.min(top + this.height - 20, this._rowY)) - p.height / 2) + (layer ? layer.y : 0);
            p.alpha = this.opacity / 255;
            p.visible = true;
        }
    };
    Window_FarmTip.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        if (this.visible && this._shown < 8) {
            this._shown++;
            this.opacity = Math.round(255 * this._shown / 8);
            this.contentsOpacity = this.opacity;
        }
        this.place();
    };

    function makePointerBitmap() {
        const w = 17, h = 28, bmp = new Bitmap(w, h), ctx = bmp.context;
        ctx.fillStyle = "#0e1013";   // the colour of the window back at its edge (Window.png)
        ctx.beginPath();
        ctx.moveTo(w, 0); ctx.lineTo(2, h / 2); ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffd23f";   // the yellow of the corners and the cursor
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w, 1); ctx.lineTo(2, h / 2); ctx.lineTo(w, h - 1);
        ctx.stroke();
        bmp._baseTexture.update();
        return bmp;
    }

    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this.createFarmMenu();
    };

    Scene_Map.prototype.createFarmMenu = function() {
        const rect = new Rectangle(0, 0, 480, 100);
        this._farmHelp = new Window_Help(rect);   // only for placing a building now
        this._farmHelp.hide();
        this._farmTitle = new Window_FarmTitle(new Rectangle(0, 0, 300, 60));
        this._farmTitle.hide();
        this._farmTip = new Window_FarmTip(new Rectangle(0, 0, 400, 120));
        this._farmMenu = new Window_FarmList(rect);
        this._farmMenu.setHelpWindow(this._farmTip);
        this._farmMenu.setHandler("ok", this.onFarmOk.bind(this));
        this._farmMenu.setHandler("cancel", this.closeFarmMenu.bind(this));
        this._farmMenu.setHandler("pageup", this.onFarmKey.bind(this, "build"));
        this._farmMenu.setHandler("pagedown", this.onFarmKey.bind(this, "food"));
        this._farmMenu.setHandler("tab", () => this._farmTitle.setTab(this._farmMenu._tab));
        this.addWindow(this._farmHelp);
        this.addWindow(this._farmTitle);
        this.addWindow(this._farmMenu);
        this.addWindow(this._farmTip);
        // the notch of the popup lives above the window layer
        this._farmPointer = new Sprite(makePointerBitmap());
        this._farmPointer.visible = false;
        this._farmTip.pointer = this._farmPointer;
        this.addChild(this._farmPointer);
    };

    // wide enough for the longest line (name, and the icons with amounts that sit on its right)
    Scene_Map.prototype.farmMenuWidth = function(entries) {
        const menu = this._farmMenu;
        menu.resetFontSettings();
        let widest = 0;
        for (const e of entries) {
            let w = (e.icon ? ImageManager.iconWidth + 4 : 0) + menu.textWidth(e.name) + 24;
            if (e.costs) for (const [, n] of e.costs) w += ImageManager.iconWidth + 2 + menu.textWidth("×" + n) + 8;
            else if (e.right) w += menu.textWidth(e.right) + 8;
            widest = Math.max(widest, w);
        }
        return Math.max(340, Math.min(560, widest + menu.padding * 2 + 8));
    };

    // docked in the bottom left corner: the name of the menu, the list under it, the popup to the right of the list
    const MENU_MARGIN = 16;
    Scene_Map.prototype.openFarmMenu = function(title, entries, kind, index, tabs) {
        const menu = this._farmMenu, plate = this._farmTitle;
        // with tabs the window is sized for all of them, so it does not jump when switching
        const all = tabs ? [].concat(...tabs.map(t => t.entries)) : entries;
        const rows = tabs ? Math.max(...tabs.map(t => t.entries.length)) : entries.length;
        const width = this.farmMenuWidth(all);
        const listH = this.calcWindowHeight(Math.min(rows, 8), true);
        const plateH = this.calcWindowHeight(tabs ? 2 : 1, false);
        const x = MENU_MARGIN, y = Graphics.boxHeight - MENU_MARGIN - listH;
        menu.move(x, y, width, listH);
        plate.move(x, y - plateH, width, plateH);
        menu.createContents();   // the contents bitmap has to match the new size
        plate.createContents();
        plate.setTitle(title, tabs ? tabs.map(t => t.name) : null);
        this._farmTip.reset();
        this._farmKind = kind || "";
        menu.setup(title, entries, index, tabs);
        plate.show();
        menu.show();
        menu.open();
        menu.activate();
        menu.callUpdateHelp();
        $gameTemp._farmMenuOpen = true;
    };

    Scene_Map.prototype.closeFarmMenu = function() {
        this._farmKind = "";
        this._farmMenu.deactivate();
        this._farmMenu.hide();
        this._farmTitle.hide();
        this._farmTip.reset();
        this._farmHelp.hide();
        // the same press of "OK" that chose the entry must not act on the tile again
        if ($gameTemp._farmMenuOpen) lockPlayer(2);
        $gameTemp._farmMenuOpen = false;
    };

    Scene_Map.prototype.onFarmOk = function() {
        const entry = this._farmMenu.currentEntry();
        this.closeFarmMenu();
        if (entry && entry.run) entry.run();
    };

    // Q (build) and E (food) on the map; while one of these two menus is open the same key closes it and the other key switches to the other menu
    Scene_Map.prototype.onFarmKey = function(kind) {
        const now = this._farmKind, menu = this._farmMenu;
        if (menu._tabs) {   // a station's menu: Q / E switch its tabs, like in the journal
            if (menu.switchTab(menu._tab + (kind === "build" ? -1 : 1))) SoundManager.playCursor();
            return;
        }
        if (now !== "build" && now !== "food") return;   // the menu of a plot, a chest...: no use for Q and E
        if (now === kind) {
            SoundManager.playCancel();
            this.closeFarmMenu();
        } else if (openKeyMenu(kind)) {
            SoundManager.playCursor();
        }
    };
    Scene_Map.prototype.canUseKeyMenu = function() {
        return this === SceneManager._scene && !SceneManager.isSceneChanging() && !$gameMessage.isBusy() && !$gameMap.isEventRunning() &&
            !$gameTemp._farmMenuOpen && !$gameTemp._buildMode && $gamePlayer.canMove();
    };
    const _Scene_Map_update_keyMenus = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update_keyMenus.call(this);
        const kind = Input.isTriggered("pageup") ? "build" : Input.isTriggered("pagedown") ? "food" : "";
        if (kind && this._farmMenu && this.canUseKeyMenu() && openKeyMenu(kind)) SoundManager.playOk();
    };

    const _Scene_Map_isMenuEnabled = Scene_Map.prototype.isMenuEnabled;
    Scene_Map.prototype.isMenuEnabled = function() {
        return !$gameTemp._farmMenuOpen && !$gameTemp._buildMode && _Scene_Map_isMenuEnabled.call(this);
    };

    // ------------------------------------------------------------------
    // The chest screen: the pack on the left, the chest on the right.
    // ------------------------------------------------------------------
    function Window_ChestList() {
        this.initialize(...arguments);
    }
    Window_ChestList.prototype = Object.create(Window_Selectable.prototype);
    Window_ChestList.prototype.constructor = Window_ChestList;

    Window_ChestList.prototype.initialize = function(rect, emptyText) {
        this._stacks = [];
        this._emptyText = emptyText || "";
        Window_Selectable.prototype.initialize.call(this, rect);
    };
    Window_ChestList.prototype.maxItems = function() {
        return this._stacks.length;
    };
    Window_ChestList.prototype.currentStack = function() {
        return this._stacks[this.index()] || null;
    };
    Window_ChestList.prototype.item = function() {
        const stack = this.currentStack();
        return stack ? stack.item : null;
    };
    Window_ChestList.prototype.isCurrentItemEnabled = function() {
        return !!this.currentStack();
    };
    // the lists keep the cursor where it was, clamped to the new length
    Window_ChestList.prototype.setStacks = function(stacks) {
        this._stacks = stacks;
        this.refresh();
        this.select(stacks.length > 0 ? Math.max(0, Math.min(this.index(), stacks.length - 1)) : -1);
    };
    Window_ChestList.prototype.drawItem = function(index) {
        const stack = this._stacks[index], rect = this.itemLineRect(index);
        const label = "×" + stack.n, w = this.textWidth("×99") + 4;
        this.drawItemName(stack.item, rect.x, rect.y, rect.width - w);
        this.drawText(label, rect.x, rect.y, rect.width, "right");
    };
    Window_ChestList.prototype.drawAllItems = function() {
        Window_Selectable.prototype.drawAllItems.call(this);
        if (this._stacks.length === 0) {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(this._emptyText, 0, 0, this.innerWidth, "center");
            this.resetTextColor();
        }
    };
    Window_ChestList.prototype.updateHelp = function() {
        this.setHelpWindowItem(this.item());
    };
    // the screen stays on the same list after a move: OK / page keys do not deactivate the window
    Window_ChestList.prototype.processOk = function() {
        this.updateInputData();
        this.callOkHandler();
    };
    Window_ChestList.prototype.processPagedown = function() {
        this.updateInputData();
        this.callHandler("pagedown");
    };
    Window_ChestList.prototype.processPageup = function() {
        this.updateInputData();
        this.callHandler("pageup");
    };
    Window_ChestList.prototype.processHandling = function() {
        if (this.isOpenAndActive() && (Input.isTriggered("left") || Input.isTriggered("right"))) {
            this.updateInputData();
            this.callHandler("side");
            return;
        }
        Window_Selectable.prototype.processHandling.call(this);
    };

    const CHEST_STEPS = [1, 5, 10, 0];   // how many to move at once, 0 = the whole stack
    const stepLabel = s => s === 0 ? "wszystko" : "×" + s;

    function Scene_Chest() {
        this.initialize(...arguments);
    }
    Scene_Chest.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Chest.prototype.constructor = Scene_Chest;

    Scene_Chest.prototype.prepare = function(mapId, buildingId) {
        this._mapId = mapId;
        this._buildingId = buildingId;
    };
    Scene_Chest.prototype.chest = function() {
        return (farm().buildings[this._mapId] || []).find(b => b.id === this._buildingId) || null;
    };
    Scene_Chest.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this._step = 0;
        this._note = "";
        this.createHelpWindow();
        this.createTitleWindows();
        this.createListWindows();
        this.createFooterWindow();
        this.refreshAll();
        this.focus(this._packList);
    };
    Scene_Chest.prototype.halfWidth = function() {
        return Math.floor(Graphics.boxWidth / 2);
    };
    Scene_Chest.prototype.titleHeight = function() {
        return this.calcWindowHeight(1, false);
    };
    Scene_Chest.prototype.footerHeight = function() {
        return this.calcWindowHeight(2, false);
    };
    Scene_Chest.prototype.listTop = function() {
        return this.mainAreaTop() + this.titleHeight();
    };
    Scene_Chest.prototype.createTitleWindows = function() {
        const half = this.halfWidth(), top = this.mainAreaTop(), h = this.titleHeight();
        this._packTitle = new Window_Help(new Rectangle(0, top, half, h));
        this._chestTitle = new Window_Help(new Rectangle(half, top, Graphics.boxWidth - half, h));
        this.addWindow(this._packTitle);
        this.addWindow(this._chestTitle);
    };
    Scene_Chest.prototype.createListWindows = function() {
        const half = this.halfWidth(), top = this.listTop();
        const h = this.mainAreaBottom() - this.footerHeight() - top;
        this._packList = new Window_ChestList(new Rectangle(0, top, half, h), "Plecak jest pusty");
        this._chestList = new Window_ChestList(new Rectangle(half, top, Graphics.boxWidth - half, h), "Skrzynia jest pusta");
        for (const list of [this._packList, this._chestList]) {
            list.setHelpWindow(this._helpWindow);
            list.setHandler("ok", this.onTransfer.bind(this));
            list.setHandler("cancel", this.popScene.bind(this));
            list.setHandler("side", this.onSide.bind(this));
            list.setHandler("pagedown", this.onStep.bind(this, 1));
            list.setHandler("pageup", this.onStep.bind(this, -1));
            this.addWindow(list);
        }
    };
    Scene_Chest.prototype.createFooterWindow = function() {
        const h = this.footerHeight();
        this._footer = new Window_Help(new Rectangle(0, this.mainAreaBottom() - h, Graphics.boxWidth, h));
        this.addWindow(this._footer);
    };
    Scene_Chest.prototype.otherList = function() {
        return this._focusList === this._packList ? this._chestList : this._packList;
    };
    Scene_Chest.prototype.focus = function(list) {
        this._focusList = list;
        this.otherList().deactivate();
        list.activate();
        this._packList.contentsOpacity = this._focusList === this._packList ? 255 : 150;
        this._chestList.contentsOpacity = this._focusList === this._chestList ? 255 : 150;
        this.refreshTitles();
    };
    Scene_Chest.prototype.refreshAll = function() {
        const b = this.chest();
        this._packList.setStacks(packStacks());
        this._chestList.setStacks(b ? chestStacks(b) : []);
        this.refreshTitles();
        this.refreshFooter();
    };
    Scene_Chest.prototype.refreshTitles = function() {
        const b = this.chest();
        if (!b || !this._focusList) return;
        const colour = list => this._focusList === list ? "\\C[0]" : "\\C[16]";
        this._packTitle.setText(colour(this._packList) + "Plecak");
        this._chestTitle.setText(colour(this._chestList) + BUILDINGS[b.type].name + "  " + chestKinds(b) + "/" + chestSlots(b));
    };
    Scene_Chest.prototype.refreshFooter = function() {
        const line1 = "OK: przenieś   Lewo/Prawo: strona   Anuluj: wyjdź";
        const line2 = "Q/E: ilość naraz \\C[17]" + stepLabel(CHEST_STEPS[this._step]) + "\\C[0]" + (this._note ? "    \\C[2]" + this._note : "");
        this._footer.setText(line1 + "\n" + line2);
    };
    Scene_Chest.prototype.onSide = function() {
        this.focus(this.otherList());
        SoundManager.playCursor();
    };
    Scene_Chest.prototype.onStep = function(direction) {
        this._step = (this._step + direction + CHEST_STEPS.length) % CHEST_STEPS.length;
        this._note = "";
        this.refreshFooter();
        SoundManager.playCursor();
    };
    Scene_Chest.prototype.onTransfer = function() {
        const b = this.chest(), list = this._focusList, stack = list.currentStack();
        if (!b || !stack) { SoundManager.playBuzzer(); return; }
        const toChest = list === this._packList;
        const step = CHEST_STEPS[this._step], want = step === 0 ? stack.n : step;
        const moved = toChest ? putInChest(b, stack.item, want) : takeFromChest(b, stack.item, want);
        if (moved < 1) {
            this._note = whyNotMove(b, stack.item, toChest ? "put" : "take") || "Nic się nie przeniosło.";
            SoundManager.playBuzzer();
        } else {
            this._note = "";
            playSe(SE.move, 100);
        }
        this.refreshAll();
        // a list that has just run empty hands the cursor over to the other one
        if (list.maxItems() === 0 && this.otherList().maxItems() > 0) this.focus(this.otherList());
        else list.reselect();
    };
    // a click on the other list switches to it
    Scene_Chest.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        if (this._focusList && TouchInput.isTriggered()) {
            const other = this.otherList();
            if (other.isTouchedInsideFrame()) this.focus(other);
        }
    };

    // ------------------------------------------------------------------
    // Drawing. Soil, crops and the plugin-drawn fence are built at runtime.
    // ------------------------------------------------------------------
    function hash2(x, y, s) {
        let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1103515245);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }

    // ------------------------------------------------------------------
    // Placing a building: after choosing it in the build menu a grid appears around the player and a
    // see-through picture of the building follows a cursor. Arrows (or the mouse) move it, OK / a click
    // builds, cancel / a right click goes back. Green = it can stand there, red = it cannot (with the reason).
    // ------------------------------------------------------------------
    const BUILD_RANGE = 6;   // how far from the player (in tiles) a building may be placed

    function placementProblem(type, x, y, flip) {
        const def = BUILDINGS[type];
        const rows = def.h || 1;   // the nearest tile of the whole footprint counts
        const far = Math.max(0, x - $gamePlayer.x, $gamePlayer.x - (x + def.w - 1), (y - rows + 1) - $gamePlayer.y, $gamePlayer.y - y);
        if (far > BUILD_RANGE) return "Za daleko od ciebie.";
        const why = whyNotBuild(type, x, y, flip);
        if (why) return why;
        if (missingMaterials(type).length > 0) return "Brakuje materiałów.";
        return null;
    }

    function startPlacement(type, x, y) {
        const scene = SceneManager._scene;
        if (!(scene instanceof Scene_Map) || typeof scene.startBuildMode !== "function") return build(type, x, y);
        scene.startBuildMode(type, x, y);
        return true;
    }

    Scene_Map.prototype.startBuildMode = function(type, x, y) {
        $gameTemp._buildMode = { type, x, y, wait: 4, hover: null, flip: false };
        const help = this._farmHelp, width = Math.min(600, Graphics.boxWidth - 40), helpH = this.calcWindowHeight(4, false);
        help.move(MENU_MARGIN, Math.max(8, Graphics.boxHeight - helpH - MENU_MARGIN), width, helpH);
        help.createContents();
        help.show();
        this.refreshBuildHelp();
    };

    Scene_Map.prototype.endBuildMode = function() {
        $gameTemp._buildMode = null;
        this._farmHelp.hide();
        lockPlayer(2);   // the same key press must not act on the map
    };

    Scene_Map.prototype.refreshBuildHelp = function() {
        const mode = $gameTemp._buildMode;
        if (!mode) return;
        const def = BUILDINGS[mode.type], problem = placementProblem(mode.type, mode.x, mode.y, mode.flip);
        // text codes: \C[n] a colour of the window palette (16 brass, 3 green, 10 red, 7 muted), \I[n] an icon
        const help = this._farmHelp;
        const cost = BUILDINGS[mode.type].cost.map(([id, n]) => "\\I[" + itemOf(id).iconIndex + "]\\C[" + (countOf(id) >= n ? 3 : 10) + "]" + countOf(id) + "/" + n + "\\C[0]").join("   ");
        help.setText("\\C[16]Stawianie: " + def.name + "\\C[0]\n" + "Koszt:  " + cost + "\n" + (problem ? "\\C[10]" + problem : "\\C[3]Można tu postawić.") + "\\C[0]\n\\C[7]Strzałki: ruch   OK: postaw   " + (mode.type === "fence" ? "" : "R / Q / E: odbij" + (mode.flip ? " (odbite)" : "") + "   ") + "Anuluj: wróć");
    };

    Scene_Map.prototype.updateBuildMode = function() {
        const mode = $gameTemp._buildMode, def = mode && BUILDINGS[mode.type];
        if (!def) return;
        if ($gameMap.isEventRunning() || $gameMessage.isBusy() || $gamePlayer.isTransferring()) {
            $gameTemp._buildMode = null;
            this._farmHelp.hide();
            return;
        }
        if (mode.wait > 0) { mode.wait--; return; }   // the press of "OK" that picked the building is still fresh
        let x = mode.x, y = mode.y;
        if (Input.isRepeated("left")) x--; else if (Input.isRepeated("right")) x++;
        if (Input.isRepeated("up")) y--; else if (Input.isRepeated("down")) y++;
        if (TouchInput.isHovered() && (!mode.hover || mode.hover.x !== TouchInput.x || mode.hover.y !== TouchInput.y)) {
            mode.hover = { x: TouchInput.x, y: TouchInput.y };
            x = $gameMap.canvasToMapX(TouchInput.x);
            y = $gameMap.canvasToMapY(TouchInput.y);
        }
        // the cursor stays on the map, near the player and on the screen
        const screenW = Math.floor($gameMap.screenTileX()), screenH = Math.floor($gameMap.screenTileY());
        x = Math.max($gamePlayer.x - BUILD_RANGE, Math.min($gamePlayer.x + BUILD_RANGE, x));
        y = Math.max($gamePlayer.y - BUILD_RANGE, Math.min($gamePlayer.y + BUILD_RANGE, y));
        const rows = def.h || 1;
        x = Math.max(0, Math.min($gameMap.width() - def.w, x));
        y = Math.max(rows - 1, Math.min($gameMap.height() - 1, y));
        if ($gameMap.adjustX(x) < 0 || $gameMap.adjustX(x) > screenW - def.w) x = mode.x;
        if ($gameMap.adjustY(y - rows + 1) < 0 || $gameMap.adjustY(y) > screenH - 1) y = mode.y;
        if (x !== mode.x || y !== mode.y) {
            mode.x = x;
            mode.y = y;
            SoundManager.playCursor();
        }
        if (mode.type !== "fence" && (Input.isTriggered("flip") || Input.isTriggered("pageup") || Input.isTriggered("pagedown"))) {   // mirror the building before it is put down (R, Q or E)
            mode.flip = !mode.flip;
            SoundManager.playCursor();
        }
        const key = mode.x + "," + mode.y + ":" + farm().rev + ":" + missingMaterials(mode.type).length + ":" + $gamePlayer.x + "," + $gamePlayer.y + ":" + mode.flip;
        if (key !== mode.key) {
            mode.key = key;
            this.refreshBuildHelp();
        }
        if (Input.isTriggered("cancel") || TouchInput.isCancelled()) {
            SoundManager.playCancel();
            this.endBuildMode();
            return;
        }
        const confirm = Input.isTriggered("ok") || TouchInput.isTriggered();
        if (!confirm || $gameTemp._farmLock > 0) return;
        const problem = placementProblem(mode.type, mode.x, mode.y, mode.flip);
        if (problem) {
            SoundManager.playBuzzer();
            complain(itemOf(ITEM.wood).iconIndex, problem);
            return;
        }
        const dx = mode.x - $gamePlayer.x, dy = mode.y - $gamePlayer.y;
        $gamePlayer.setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 6 : 4) : (dy > 0 ? 2 : 8));
        if (placeSite(mode.type, mode.x, mode.y, mode.flip) && mode.type !== "fence") this.endBuildMode();   // fences: keep going, one after another
    };

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if ($gameTemp._buildMode) this.updateBuildMode();
    };

    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        $gameTemp._buildMode = null;
        if (mapId === HUT_MAP) hutSanitize(false);
        // a roast the player was sitting at (a game saved or a map left in the middle of it) is not carried on: the food goes back to the bag
        if ($gameSystem && $gameSystem._farm) for (const b of $gameSystem._farm.buildings[mapId] || []) if (b.job && b.job.sit) giveUpRoast(b, true);
    };

    // for events, other plugins and tests
    window.Farming = {
        openBuildKeyMenu, openFoodKeyMenu, foodFacts, whyNotEat,
        bushState, bushSolid, mushroomBirth, mushroomChance, gatherKindOf, BUSH_SHARE, MUSHROOM_POOL, MUSHROOM_LIFE, claimGround, releaseGround, bucketUnits, bucketSync, takeBucketWater, bucketFor, rainHoursBetween, BUCKET_REACH, bagWater, setBagWater, bagWaterWeight,
        HUT_MAP, HUT_ROOM, hutOf, hutDoorAt, isHutInterior, hutShutsIn, hutSanitize, enterHut, leaveHut,
        upgradeBuilding, roomFor, fillSkin, geoOf, cellsOfGeo, isSolidCell, yardInterior, solidAt, CROPS, BUILDINGS, plotAt, buildingAt, menuFor, isSoilTile, groundIsSoil, naturalFarmland, rake, till, plant, harvest, uproot, build, demolish, collect, rest,
        groundInfoAt, hasObjectTile, cropStage, isRipe, daysLeft, readyProduce, snares, snareBait, snareSprung, snareCatch, snareEatBait, baitSnare, whyNotBuild, growthRate,   // soilTexture, fenceTexture, nightAmount, fireGlowAlpha: added by Farming_Render.js
        dig, startJob, collectJob, jobReady, jobHoursLeft, clockHours, demolishBlock, pitchInstant, packUp, sleepInTent, wakeHour, putInChest, takeFromChest, isFood, ownedOutput,
        chestStacks, chestKinds, chestHolds, packStacks, putInChest, takeFromChest, whyNotMove, openChest, Scene_Chest, Window_ChestList,
        water, wateredRecently, seasonIndex, seasonOf, SEASON_NAMES, ITEM, hash2,
        stoneAt, stoneSpot, pickStone, gatherAt, gatherSpot, pickGather, isWaterTile, waterMenu, fillCan, drink, goFishing, rainWater, canCharges, craftManual, HAND_RECIPES, startPlacement, placementProblem, tileWhyNot, placeSite, strikeSite, cancelSite,
        // used only by Farming_Render.js (@orderAfter Farming), not meant for other plugins
        BUILD_RANGE, CROP_LIFT, TILE, farm, itemOf, key, mirrorGeo, missingMaterials, onRing, recipeOf, tilesOfBuilding, today, gatherRev, fuelLeft, fireLit
    };
})();
