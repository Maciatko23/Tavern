//=============================================================================
// Farming.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Uprawa i budowanie: ziemia po kłodach, pieńkach i kamieniach -> grabie -> motyka -> nasiona -> wzrost -> zbiór, plus budowa płotu, ławki, ogniska, kurnika, ula, skrzyń, pieca ziemnego, tartaku (stołu do ręcznego piłowania), kompostownika, browaru, piekarni, cegielni i kuźni. Budowle z desek, kilof i gwoździe robi się samemu, małe kamienie leżą na ziemi. Zbieractwo (kamienie, len, jagody, grzyby, zioła), gotowanie na ognisku, pułapki, oprawianie, garbarnia, wędzarnia, studnia z konewką, wędkowanie, legowisko i owczarnia. Podlewanie konewką przyspiesza wzrost, sadzenie zależy od pory roku. Warsztat, w którym powstają i montują się wszystkie narzędzia, piła z żelaznego ostrza oraz namiot: zszyty w garbarni, rozkładany i składany, do spania. v1.12.0
 * @author Claude
 * @orderAfter DayNightCycle
 * @orderAfter SurvivalHUD
 * @orderAfter ChoppableTree
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
 *   Oczyszczona ziemia: "Zagrab ziemię" (grabie) albo "Zbuduj...".
 *                       Na oczyszczonej i zagrabionej ziemi jest też "Wytwórz..." (młotek i lina: bez budynku; wszystkie inne narzędzia powstają w warsztacie).
 *   Zagrabiona ziemia:  "Zaoraj ziemię" (motyka) albo "Zbuduj...".
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
 *   "Zbuduj..." (na oczyszczonej lub zagrabionej ziemi) otwiera listę budowli, a po
 *   wyborze jednej pokazuje siatkę wokół gracza i półprzezroczysty obraz budowli,
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
 * LEŚNE LEGOWISKO (pierwsze spanie w terenie)
 *   W menu ziemi "Wytwórz..." robisz je z 6 gałęzi i 3 lnu (jedno naraz), a potem rozkładasz w
 *   "Zbuduj..." od razu, bez młotka. "Prześpij noc" działa jak w namiocie (czas do rana,
 *   podsumowanie dnia, autozapis), ale siły wracają tylko do 60% (w deszczu, śniegu i zimą
 *   do 40%; w tablicy BUILDINGS: sleepRestore, sleepBad). Rozbierz zwraca 3 gałęzie i len.
 *
 * NAMIOT (spanie w terenie)
 *   Garbarnia szyje namiot (skóry, lina, drewno; można mieć tylko jeden). Namiot to
 *   przedmiot: w menu ziemi "Zbuduj..." > Namiot stawiasz go od razu, bez młotka
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
        honey: 76, cabbage: 73, stew: 130, cabbageSoup: 131, mushroomSoup: 132, porridge: 133, grilledMushrooms: 134, bakedCheese: 135, berryPie: 136, mead: 137, bucket: 138   // stone axe (60) and pickaxe (63): made at the workbench; the saw and the iron heads: forged parts
    };
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

    const DIG_YIELD = [2, 3];   // soil per dig

    const SE = {
        rake: "Earth2", hoe: "Earth3", plant: "Earth4", harvest: "Item3",
        build: "Hammer", demolish: "Break", rest: "Heal2", collect: "Item2", uproot: "Earth1",
        dig: "Earth5", kindle: "Fire2", chest: "Chest1", move: "Item1", water: "Liquid"
    };

    // ------------------------------------------------------------------
    // Content tables. Add your own crops / buildings here.
    // ------------------------------------------------------------------
    // seed / produce: item ids. days: growth time. yield / seeds: [min, max] items
    // gained on harvest. row: the crop's row in img/system/Farm_Crops.png (4 stages).
    // seasons: indices into SEASON_NAMES this crop can be sown in (0 spring .. 3 winter).
    const CROPS = {
        potato: { name: "Ziemniaki", seed: 67, produce: 71, days: 4, yield: [2, 4], seeds: [0, 2], row: 0, seasons: [0, 1] },
        carrot: { name: "Marchew", seed: 68, produce: 72, days: 3, yield: [2, 3], seeds: [0, 2], row: 1, seasons: [0, 2] },
        cabbage: { name: "Kapusta", seed: 69, produce: 73, days: 5, yield: [1, 2], seeds: [0, 2], row: 2, seasons: [2, 3] },
        barley: { name: "Jęczmień", seed: 70, produce: 74, days: 6, yield: [3, 5], seeds: [1, 2], row: 3, seasons: [1, 2] }
    };
    const CROP_IDS = Object.keys(CROPS);

    // cost: [[item id, count], ...]. w, h: size in tiles (h = 1 when missing; the building stands on its bottom row and its picture rises
    // above it). legacy: the size and picture of buildings put up before the sizes grew (they have no b.v). yard: a fenced field for animals
    // (fence on the outer ring, gate in the bottom row at column gate, the hut inside at hut, the animals of Livestock.js walk in the rest).
    // ventX: px right of the middle of the picture where smoke rises. image: img/system file (null =
    // drawn by the plugin, like the fence). rest: stamina restored when used.
    // produce: { item, amount, period (days), cap } items the building makes.
    // slots: a storage chest, this many kinds of items (up to 99 of each).
    // recipes: a crafting station. { id, name, inputs: [[item, n]...], output: [item, n],
    //   hours (game hours), stamina, desc }. One job at a time; it keeps running while
    //   the player is elsewhere. vent: px above the foot of the picture where smoke rises.
    const BUILDINGS = {
        // The first building of the game: only what lies on the ground (sticks, stones, flax) - no wood, no planks,
        // because the axe that cuts wood is made here. Every tool is made and mounted on this table (all manual recipes).
        workbench: { name: "Warsztat", cost: [[ITEM.branch, 6], [ITEM.stone, 3], [ITEM.fiber, 4]], w: 2, h: 1, stamina: 9, image: "Farm_Workbench_L", legacy: { w: 2, h: 1, image: "Farm_Workbench" }, indoor: true, startSe: "Hammer",
            recipes: [
                { id: "axe_stone", name: "Zrób kamienną siekierę", inputs: [[ITEM.branch, 2], [ITEM.stone, 2], [ITEM.fiber, 2]], output: [ITEM.axe, 1], manual: true, unique: true, also: [ITEM.ironAxe],
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Ostry kamień przywiązany lnem do gałęzi. Ścina drzewa, rozrąbuje kłody i krzaki." },
                { id: "pick_stone", name: "Zrób kamienny kilof", inputs: [[ITEM.wood, 2], [ITEM.branch, 3], [ITEM.stone, 3]], output: [ITEM.pickaxe, 1], manual: true, unique: true, also: [ITEM.ironPick],
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Trzonek z drewna, obwiązanie z gałęzi i kamienny grot. Rozbija duże skały i żyły rudy." },
                { id: "shovel", name: "Zrób kamienną łopatę", inputs: [[ITEM.wood, 2], [ITEM.branch, 1], [ITEM.stone, 2]], output: [ITEM.shovel, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Płaski kamień przywiązany do długiego kija. Wykopie ziemię i pieńki." },
                { id: "rake", name: "Zrób grabie", inputs: [[ITEM.wood, 1], [ITEM.branch, 4]], output: [ITEM.rake, 1], manual: true, unique: true,
                    hours: 1, stamina: 3, startSe: "Item1", desc: "Kilka gałęzi na drewnianym trzonku. Do grabienia ziemi przed orką." },
                { id: "hoe", name: "Zrób motykę", inputs: [[ITEM.wood, 1], [ITEM.branch, 1], [ITEM.stone, 3]], output: [ITEM.hoe, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Kamienne ostrze na krótkim trzonku. Do orania zagrabionej ziemi." },
                { id: "knife", name: "Zrób nóż kamienny", inputs: [[ITEM.wood, 1], [ITEM.stone, 2], [ITEM.branch, 1]], output: [ITEM.knifeStone, 1], manual: true, unique: true, also: [ITEM.knifeIron],
                    hours: 1, stamina: 3, startSe: "Hammer", desc: "Łupany kamień na drewnianej rękojeści. Do oprawiania zwierzyny." },
                { id: "rod", name: "Zrób wędkę", inputs: [[ITEM.wood, 2], [ITEM.rope, 2], [ITEM.branch, 1]], output: [ITEM.rod, 1], manual: true, unique: true,
                    hours: 1, stamina: 3, startSe: "Hammer", desc: "Długi kij, żyłka z liny i haczyk z drzazgi. Do łowienia w stawie." },
                { id: "saw", name: "Zmontuj piłę", inputs: [[ITEM.sawBlade, 1], [ITEM.wood, 2], [ITEM.rope, 1]], output: [ITEM.saw, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Żelazne ostrze na drewnianej rączce. W tartaku tnie deski szybciej i daje ich więcej." },
                { id: "axe_iron", name: "Zmontuj żelazną siekierę", inputs: [[ITEM.axeHead, 1], [ITEM.planks, 1]], output: [ITEM.ironAxe, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Żelazna głowica na mocnym styliskiu. Zastępuje kamienną siekierę: drzewa, kłody i krzaki padają o jedną trzecią szybciej, a uderzenia kosztują mniej sił." },
                { id: "pick_iron", name: "Zmontuj żelazny kilof", inputs: [[ITEM.pickHead, 1], [ITEM.planks, 1]], output: [ITEM.ironPick, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Żelazny grot na mocnym trzonku. Zastępuje kamienny kilof: skały i żyły rudy pękają o jedną trzecią szybciej, a uderzenia kosztują mniej sił." },
                { id: "sling", name: "Zrób procę", inputs: [[ITEM.rope, 1], [ITEM.fiber, 2], [ITEM.branch, 2]], output: [ITEM.sling, 1], manual: true, unique: true,
                    hours: 1, stamina: 3, startSe: "Item1", desc: "Sznur z lnianą kieszonką na kamień. Ustrzelisz nią zająca, a ze skóry zrobisz legowisko. Strzelasz klawiszem F, a amunicją są kamienie." },
                { id: "bow", name: "Zrób łuk", inputs: [[ITEM.wood, 2], [ITEM.rope, 2], [ITEM.rawHide, 1]], output: [ITEM.bow, 1], manual: true, unique: true,
                    hours: 2, stamina: 5, startSe: "Hammer", desc: "Giętkie drewno, cięciwa z liny i skórzany uchwyt. Bije dalej i mocniej niż proca, także w jelenia. Potrzebuje strzał." },
                { id: "arrows", name: "Zrób strzały", inputs: [[ITEM.branch, 3], [ITEM.stone, 2], [ITEM.fiber, 2]], output: [ITEM.arrows, 6], manual: true,
                    hours: 1, stamina: 3, startSe: "Item1", desc: "Proste gałązki z kamiennym grotem i lnianym opierzeniem. Sześć sztuk naraz." }
            ],
            repairs: true,   // plus one "Napraw: ..." line for every tool that has been used (Durability.js)
            desc: "Stół, na którym powstają, są montowane i naprawiane wszystkie narzędzia: kamienne od razu, a żelazne z części wykutych w kuźni." },
        fence: { name: "Płot", cost: [[ITEM.planks, 1]], w: 1, stamina: 3, image: null,
            desc: "Blokuje przejście. Łączy się z sąsiednimi płotami." },
        bench: { name: "Ławka", cost: [[ITEM.planks, 2]], w: 1, stamina: 5, image: "Farm_Bench", rest: 25, indoor: true,
            desc: "Można na niej odpocząć: odnawia wytrzymałość (mija godzina)." },
        campfire: { name: "Ognisko", cost: [[ITEM.wood, 3], [ITEM.stone, 2]], w: 1, stamina: 5, image: "Farm_Campfire_L", rest: 15, working: "Coś się piecze...", vent: 48,
            fire: { y: 13, size: 1.25, glow: 2.2, light: 340, smoke: true },   // animated flames (y: px above the foot of the picture), steady smoke, a big glow
            upgrade: { to: "tripod", dx: 0, name: "Dobuduj trójnóg", cost: [[ITEM.branch, 3], [ITEM.rope, 1]], stamina: 3, done: "Dobudowano trójnóg",
                help: "Trzy kijki związane liną staną nad ogniem. Zawiesisz na haczyku jedzenie i możesz odejść: piecze się samo. Nie trzeba młotka." },
            recipes: [
                { id: "roast_meat", name: "Upiecz mięso", inputs: [[ITEM.rawMeat, 1]], output: [ITEM.roastMeat, 1], hours: 0.5, stamina: 1, startSe: "Fire2", desc: "Kawał mięsa nad żarem, pół godziny przy ogniu. Syci na kilka godzin." },
                { id: "roast_fish", name: "Upiecz rybę", inputs: [[ITEM.fish, 1]], output: [ITEM.roastFish, 1], hours: 0.5, stamina: 1, startSe: "Fire2", desc: "Ryba nad ogniem, pół godziny przy ogniu." },
                { id: "potatoes", name: "Upiecz ziemniaki", inputs: [[ITEM.potato, 2]], output: [ITEM.bakedPotato, 2], hours: 0.75, stamina: 1, startSe: "Fire2", desc: "Ziemniaki upieczone w żarze, trzy kwadranse przy ogniu." },
                { id: "eggs", name: "Usmaż jajecznicę", inputs: [[ITEM.egg, 2]], output: [ITEM.scramble, 1], hours: 0.25, stamina: 1, startSe: "Fire2", desc: "Jajka na rozgrzanym kamieniu, kwadrans." },
                { id: "mushrooms", name: "Upiecz grzyby", inputs: [[ITEM.mushroom, 2]], output: [ITEM.grilledMushrooms, 2], hours: 0.25, stamina: 1, startSe: "Fire2", desc: "Kapelusze nadziane na patyk i przypieczone nad żarem, kwadrans." },
                { id: "cheese_baked", name: "Przypiecz ser", inputs: [[ITEM.cheese, 1]], output: [ITEM.bakedCheese, 1], hours: 0.25, stamina: 1, startSe: "Fire2", desc: "Kawałek sera nad żarem, aż zacznie się rozpływać. Kwadrans." }
            ],
            desc: "Ogrzej się przy ogniu (odnawia wytrzymałość, mija godzina) i upiecz coś na patyku, siedząc przy nim (odejdziesz, to nic się nie upiecze). Dobudowany trójnóg piecze bez ciebie, a na nim zawiesisz kociołek." },
        // the middle step between the campfire and the cauldron: it is only ever built by upgrading a campfire (noBuild)
        tripod: { name: "Ognisko z trójnogiem", cost: [[ITEM.wood, 3], [ITEM.stone, 2], [ITEM.branch, 3], [ITEM.rope, 1]], w: 1, stamina: 5, image: "Farm_Tripod_L", rest: 15, working: "Coś się piecze...",
            vent: 66, noBuild: true, refund: [[ITEM.wood, 1], [ITEM.stone, 1], [ITEM.branch, 2]],
            fire: { y: 13, size: 1.25, glow: 2.2, light: 340, smoke: true }, hang: { y: 51, x: 0, rope: 59 },   // the food hangs on a short rope from the hook (px above the foot of the picture: the top of the icon, the top of the rope)
            upgrade: { to: "cauldron", dx: 1, name: "Zawieś kociołek", cost: [[ITEM.iron, 2], [ITEM.planks, 2], [ITEM.stone, 2]], stamina: 6, tool: ITEM.hammer, done: "Zawieszono kociołek",
                help: "Na trójnogu zawiśnie żelazny kociołek. Potrzebny młotek i miejsce 3 × 2 pola wokół ogniska. Kociołek gotuje zupy, gulasz, owsiankę i wywary, ale zajmuje cały ogień: mięsa na patyku już przy nim nie upieczesz (do tego zbuduj drugie ognisko)." },
            desc: "Trzy kijki i lina nad ogniem. Zawieszasz jedzenie na haczyku i możesz odejść: piecze się samo, a gotowe odbierasz z ognia (albo czekasz obok, siedząc). Później zawiesisz na nim żelazny kociołek." },
        scarecrow: { name: "Strach na wróble", cost: [[ITEM.wood, 3]], w: 1, stamina: 4, image: "Farm_Scarecrow",
            desc: "Rośliny w promieniu 2 kratek rosną o 25% szybciej." },
        coop: { name: "Kurnik", cost: [[ITEM.planks, 10], [ITEM.stone, 2]], w: 6, h: 5, stamina: 14, image: "Farm_Coop_L", legacy: { w: 2, h: 1, image: "Farm_Coop", cost: [[ITEM.planks, 6], [ITEM.stone, 2]] },
            yard: { gate: 2, hut: { dx: 2, dy: 3, w: 2, h: 1 }, animal: "hen", count: 3 },
            produce: { item: 75, amount: 2, period: 1, cap: 6 },
            desc: "Ogrodzony wybieg z kurnikiem: w środku biegają kury i niosą jajka, 2 dziennie (maksymalnie 6). Furtką wchodzisz do środka." },
        hive: { name: "Ul", cost: [[ITEM.planks, 4]], w: 1, stamina: 6, image: "Farm_Hive",
            produce: { item: 76, amount: 1, period: 2, cap: 3 },
            desc: "Pszczoły zbierają miód: 1 słoik co 2 dni (maksymalnie 3)." },
        chest_s: { name: "Mała skrzynia", cost: [[ITEM.planks, 4]], w: 1, stamina: 5, image: "Farm_ChestS", slots: 12, indoor: true,
            desc: "Schowek: 12 rodzajów przedmiotów, po 99 sztuk każdego." },
        chest_l: { name: "Duża skrzynia", cost: [[ITEM.planks, 8], [ITEM.stone, 2], [ITEM.nails, 6]], w: 2, stamina: 8, image: "Farm_ChestL", slots: 30, indoor: true,
            desc: "Schowek: 30 rodzajów przedmiotów, po 99 sztuk każdego. Okuta gwoździami." },
        kiln: { name: "Piec ziemny", cost: [[ITEM.soil, 10], [ITEM.stone, 4]], w: 3, h: 2, stamina: 12, image: "Farm_Kiln_L", legacy: { w: 2, h: 1, image: "Farm_Kiln", vent: 50 }, vent: 91, ventX: -7, smokes: true,
            recipes: [{
                id: "charcoal", name: "Wypal węgiel drzewny", inputs: [[ITEM.wood, 6], [ITEM.soil, 2]], output: [ITEM.charcoal, 3],
                hours: 6, stamina: 3, desc: "Drewno pod warstwą ziemi tli się bez płomienia i zamienia w węgiel."
            }],
            desc: "Wypala z drewna węgiel drzewny. Potrzebuje ziemi do przykrycia stosu." },
        compost: { name: "Kompostownik", cost: [[ITEM.planks, 3]], w: 1, stamina: 5, image: "Farm_Compost", startSe: "Earth4",
            recipes: [{
                id: "soil", name: "Kompostuj gałęzie", inputs: [[ITEM.branch, 6]], output: [ITEM.soil, 4],
                hours: 5, stamina: 2, desc: "Gałęzie i resztki roślin rozkładają się na żyzną ziemię."
            }, {
                id: "rot", name: "Kompostuj zepsute jedzenie", inputs: [[ITEM.rot, 4]], output: [ITEM.soil, 3],
                hours: 4, stamina: 2, desc: "Zepsute jedzenie rozkłada się na żyzną ziemię."
            }],
            desc: "Zamienia gałęzie i zepsute jedzenie w ziemię." },
        // Made of raw wood and stones only, because planks do not exist yet: the table brings its own thick hand saw.
        // A real saw (blade forged from iron, mounted at the workbench) is better: more planks in half the time.
        sawmill: { name: "Tartak", cost: [[ITEM.wood, 10], [ITEM.stone, 3]], w: 3, h: 2, stamina: 10, image: "Farm_Sawmill_L", legacy: { w: 2, h: 1, image: "Farm_Sawmill" }, startSe: "Slash1",
            recipes: [
                { id: "planks", name: "Piłuj deski", inputs: [[ITEM.wood, 3]], output: [ITEM.planks, 2], manual: true,
                    hours: 2, stamina: 6, startSe: "Slash1", desc: "Kłodę kładziesz na stole i przepiłowujesz grubą, ręczną piłą na deski. Ciężka robota." },
                { id: "planks_saw", name: "Piłuj deski piłą", inputs: [[ITEM.wood, 3]], output: [ITEM.planks, 3], manual: true, tool: ITEM.saw,
                    hours: 1, stamina: 4, startSe: "Slash1", desc: "Prawdziwa piła tnie równiej i szybciej: z tego samego drewna wychodzi więcej desek, w połowie czasu i za mniej sił." }
            ],
            desc: "Duży stół z kłodami i grubą piłą. Deski piłujesz ręcznie; z prawdziwą piłą (zmontujesz ją w warsztacie) idzie szybciej i wychodzi ich więcej." },
        brewery: { name: "Browar", cost: [[ITEM.planks, 8], [ITEM.stone, 4], [ITEM.nails, 8]], w: 4, h: 2, stamina: 14, image: "Farm_Brewery_XL", v2: { w: 3, h: 2, image: "Farm_Brewery_L" }, legacy: { w: 2, h: 1, image: "Farm_Brewery" }, startSe: "Liquid",
            recipes: [{
                id: "beer", name: "Warz piwo", inputs: [[CROPS.barley.produce, 4]], output: [ITEM.beer, 3],
                hours: 10, stamina: 3, desc: "Jęczmień fermentuje powoli w kadzi. Karczmarz chętnie odkupi piwo."
            }, {
                id: "mead", name: "Nastaw miód pitny", inputs: [[ITEM.honey, 3]], output: [ITEM.mead, 2],
                hours: 8, stamina: 3, desc: "Miód rozpuszczony w wodzie fermentuje w kadzi. Rozgrzewa i trochę gasi pragnienie."
            }],
            desc: "Warzy piwo z jęczmienia. Beczki spinają gwoździe. Długi wypał, ale karczma zawsze je kupi." },
        bakery: { name: "Piekarnia", cost: [[ITEM.planks, 4], [ITEM.brick, 8]], w: 3, h: 2, stamina: 11, image: "Farm_Bakery_L", legacy: { w: 2, h: 1, image: "Farm_Bakery", vent: 68 }, vent: 98, ventX: 18, smokes: true,
            recipes: [
                { id: "flour", name: "Zmiel mąkę", inputs: [[CROPS.barley.produce, 3]], output: [ITEM.flour, 2],
                    hours: 2, stamina: 2, startSe: "Machine", desc: "Żarna mielą ziarno na mąkę." },
                { id: "bread", name: "Upiecz chleb", inputs: [[ITEM.flour, 2]], output: [ITEM.bread, 2],
                    hours: 3, stamina: 2, desc: "Piec wypieka bochenki ze świeżej mąki." },
                { id: "berry_pie", name: "Upiecz placek jagodowy", inputs: [[ITEM.flour, 2], [ITEM.berries, 3], [ITEM.honey, 1]], output: [ITEM.berryPie, 2],
                    hours: 3, stamina: 2, desc: "Kruche ciasto z jagodami i miodem." }
            ],
            desc: "Młyn i piec razem: jęczmień -> mąka -> chleb. Piec z cegieł." },
        brickworks: { name: "Cegielnia", cost: [[ITEM.planks, 3], [ITEM.stone, 6]], w: 3, h: 2, stamina: 11, image: "Farm_Brickworks_L", legacy: { w: 2, h: 1, image: "Farm_Brickworks", vent: 77 }, vent: 101, ventX: -4, smokes: true,
            recipes: [{
                id: "brick", name: "Wypal cegły", inputs: [[ITEM.stone, 3], [ITEM.soil, 3]], output: [ITEM.brick, 4],
                hours: 7, stamina: 3, desc: "Glina z kamieniem wypalone razem dają trwałą cegłę."
            }],
            desc: "Wypala z kamienia i ziemi cegły - na piekarnię, kuźnię i odbudowę murów." },
        forge: { name: "Kuźnia", cost: [[ITEM.planks, 4], [ITEM.stone, 10], [ITEM.brick, 6]], w: 3, h: 2, stamina: 14, image: "Farm_Forge_L", legacy: { w: 2, h: 1, image: "Farm_Forge", vent: 79 }, vent: 95, ventX: 12, smokes: true,
            recipes: [
                { id: "iron", name: "Wytop żelazo", inputs: [[ITEM.ironOre, 2], [ITEM.charcoal, 2]], output: [ITEM.iron, 2],
                    hours: 8, stamina: 4, desc: "Ruda żelaza topi się w żarze węgla drzewnego." },
                { id: "knife_iron", name: "Wykuj nóż żelazny", inputs: [[ITEM.iron, 1], [ITEM.wood, 1]], output: [ITEM.knifeIron, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Ostrzejszy od kamiennego: z zwierzyny wytnie więcej mięsa." },
                { id: "head_axe", name: "Wykuj głowicę siekiery", inputs: [[ITEM.iron, 3]], output: [ITEM.axeHead, 1], manual: true, unique: true, also: [ITEM.ironAxe],
                    hours: 2, stamina: 6, startSe: "Hammer", desc: "Żelazna głowica z otworem na stylisko. Nasadzisz ją na stylisko w warsztacie." },
                { id: "head_pick", name: "Wykuj grot kilofa", inputs: [[ITEM.iron, 3]], output: [ITEM.pickHead, 1], manual: true, unique: true, also: [ITEM.ironPick],
                    hours: 2, stamina: 6, startSe: "Hammer", desc: "Żelazny grot z otworem na trzonek. Zamontujesz go w warsztacie." },
                { id: "blade_saw", name: "Wykuj ostrze piły", inputs: [[ITEM.iron, 2]], output: [ITEM.sawBlade, 1], manual: true, unique: true, also: [ITEM.saw],
                    hours: 2, stamina: 5, startSe: "Hammer", desc: "Cienkie, twarde ostrze z drobnymi zębami. W warsztacie dorobisz do niego rączkę i będzie z niego piła." },
                { id: "can", name: "Wykuj konewkę", inputs: [[ITEM.iron, 1], [ITEM.planks, 2]], output: [ITEM.wateringCan, 1], manual: true, unique: true,
                    hours: 1, stamina: 4, startSe: "Hammer", desc: "Blaszana konewka do podlewania. Napełnisz ją w studni albo w stawie." },
                { id: "nails", name: "Wykuj gwoździe", inputs: [[ITEM.iron, 1]], output: [ITEM.nails, 10], manual: true,
                    hours: 1, stamina: 5, startSe: "Hammer", desc: "Na kowadle z pręta żelaza wykuwasz garść gwoździ." }
            ],
            desc: "Wytapia żelazo z rudy i węgla, a na kowadle kuje z niego gwoździe, noże oraz głowice i ostrza narzędzi (montuje się je w warsztacie)." },
        snare: { name: "Pułapka", cost: [[ITEM.branch, 4], [ITEM.rope, 2], [ITEM.stone, 1]], w: 2, stamina: 6, image: "Farm_Snare",
            produce: { item: ITEM.carcass, amount: 1, period: 2, cap: 2 },
            desc: "Zwierzyna wpada w sidła: 1 sztuka co 2 dni (maksymalnie 2). Oprawisz ją nożem." },
        smokehouse: { name: "Wędzarnia", cost: [[ITEM.planks, 6], [ITEM.stone, 4], [ITEM.brick, 4], [ITEM.nails, 4]], w: 3, h: 2, stamina: 12, image: "Farm_Smokehouse_L", legacy: { w: 2, h: 1, image: "Farm_Smokehouse", vent: 80 }, vent: 99, ventX: 2, smokes: true, working: "Wędzi się...",
            recipes: [
                { id: "smoke_meat", name: "Wędź mięso", inputs: [[ITEM.rawMeat, 2], [ITEM.wood, 2]], output: [ITEM.smokedMeat, 2], hours: 8, stamina: 2, startSe: "Fire2", desc: "Długo w dymie: mięso syci mocniej i dłużej." },
                { id: "smoke_fish", name: "Wędź rybę", inputs: [[ITEM.fish, 2], [ITEM.wood, 2]], output: [ITEM.smokedFish, 2], hours: 6, stamina: 2, startSe: "Fire2", desc: "Ryba w dymie olchowym." }
            ],
            desc: "Wędzi mięso i ryby. Wędzonka daje najwięcej sił." },
        tannery: { name: "Garbarnia", cost: [[ITEM.planks, 4], [ITEM.rope, 2], [ITEM.stone, 2]], w: 3, h: 2, stamina: 10, image: "Farm_Tannery_L", legacy: { w: 2, h: 1, image: "Farm_Tannery" }, working: "Skóra się garbuje...",
            recipes: [
                { id: "tan", name: "Wyprawiaj skórę", inputs: [[ITEM.rawHide, 1], [ITEM.branch, 3]], output: [ITEM.hide, 1], hours: 12, stamina: 2, startSe: "Liquid", desc: "Skóra moczy się w garbniku z kory i gałęzi." },
                { id: "boots", name: "Zszyj buty", inputs: [[ITEM.hide, 2], [ITEM.rope, 1]], output: [ITEM.boots, 1], manual: true, unique: true, hours: 2, stamina: 4, startSe: "Item1", desc: "Mocne buty: chodzisz w nich szybciej." },
                { id: "backpack", name: "Zszyj plecak", inputs: [[ITEM.hide, 3], [ITEM.rope, 2]], output: [ITEM.backpack, 1], manual: true, unique: true, hours: 3, stamina: 5, startSe: "Item1", desc: "Skórzany plecak: zmieścisz w nim więcej." },
                { id: "cloak", name: "Uszyj płaszcz", inputs: [[ITEM.hide, 2], [ITEM.wool, 4], [ITEM.rope, 1]], output: [ITEM.cloak, 1], manual: true, unique: true, hours: 3, stamina: 5, startSe: "Item1", desc: "Ciepły płaszcz. Zimą nie marzniesz." },
                { id: "tent", name: "Zszyj namiot", inputs: [[ITEM.hide, 4], [ITEM.rope, 3], [ITEM.wood, 4]], output: [ITEM.tent, 1], manual: true, unique: true, alsoBuilt: "tent", hours: 4, stamina: 8, startSe: "Item1",
                    desc: "Skóry napięte na czterech żerdziach i zszyte liną. Rozstawisz go tam, gdzie chcesz spać, a rano złożysz i zabierzesz ze sobą." }
            ],
            desc: "Wyprawia skóry, a ze skór szyje buty, plecak, płaszcz i namiot." },
        // The bucket: built from planks and iron on the ground (no hammer), it collects rain (rain.rate portions per hour of rain, up to rain.max); it
        // can be taken into the bag (pack) and put down again (then the item pays for it, see effectiveCost). The well needs one.
        bucket: { name: "Wiadro", cost: [[ITEM.planks, 3], [ITEM.iron, 1]], carry: ITEM.bucket, w: 1, stamina: 2, image: "Farm_Bucket", imageFull: "Farm_Bucket_Full", instant: true, pack: ITEM.bucket,
            packName: "Zabierz wiadro", packHelp: "Zabierasz puste wiadro do plecaka (z wodą w środku nie da się go podnieść). Postawisz je, gdzie zechcesz. Wiadro jest też potrzebne do budowy studni.", packedText: "Zabrano: Wiadro",
            rain: { max: 6, rate: 1 },
            desc: "Drewniane wiadro z żelaznymi obręczami. Postawione na dworze zbiera deszczówkę (porcja za każdą godzinę deszczu, do 6): napijesz się z niego, podlejesz rośliny w pobliżu albo napełnisz konewkę i bukłak. Możesz je podnieść do plecaka. Jest potrzebne do budowy studni." },
        well: { name: "Studnia", cost: [[ITEM.stone, 12], [ITEM.planks, 3], [ITEM.rope, 2], [ITEM.bucket, 1]], w: 3, h: 2, stamina: 12, image: "Farm_Well_L", refund: [[ITEM.stone, 6], [ITEM.planks, 1], [ITEM.rope, 1], [ITEM.bucket, 1]],
            v2: { cost: [[ITEM.stone, 12], [ITEM.planks, 3], [ITEM.rope, 2]], refund: undefined },   // wells put up before the bucket was needed
            legacy: { w: 2, h: 1, image: "Farm_Well", cost: [[ITEM.stone, 12], [ITEM.planks, 3], [ITEM.rope, 2]], refund: undefined }, water: true,
            desc: "Czysta woda: napełnisz konewkę albo się napijesz. Do budowy potrzebne jest wiadro." },
        cauldron: { name: "Kociołek", cost: [[ITEM.iron, 2], [ITEM.planks, 2], [ITEM.stone, 4]], w: 3, h: 2, stamina: 10, image: "Farm_Cauldron_XL", v2: { image: "Farm_Cauldron_L", ventX: -17, fire: null }, legacy: { w: 2, h: 1, image: "Farm_Cauldron", vent: 46, fire: null },
            vent: 59, ventX: -1, smokes: true, rest: 15, fire: { y: 15, size: 0.9, glow: 1.1, light: 290 }, working: "Gotuje się...",
            recipes: [
                { id: "soup", name: "Ugotuj zupę", inputs: [[ITEM.potato, 2], [ITEM.carrot, 1], [ITEM.rawMeat, 1]], output: [ITEM.soup, 2], hours: 3, stamina: 2, startSe: "Liquid", desc: "Warzywa z mięsem: syci i rozgrzewa." },
                { id: "stew", name: "Ugotuj gulasz", inputs: [[ITEM.rawMeat, 2], [ITEM.carrot, 1], [ITEM.cabbage, 1]], output: [ITEM.stew, 2], hours: 4, stamina: 2, startSe: "Liquid", desc: "Mięso, marchew i kapusta dusone długo w kociołku. Bardzo syci i rozgrzewa na wiele godzin." },
                { id: "cabbage_soup", name: "Ugotuj kapuśniak", inputs: [[ITEM.cabbage, 2], [ITEM.potato, 1], [ITEM.smokedMeat, 1]], output: [ITEM.cabbageSoup, 2], hours: 3, stamina: 2, startSe: "Liquid", desc: "Kapusta z ziemniakami i kawałkiem wędzonki. Syci, rozgrzewa i trochę gasi pragnienie." },
                { id: "mushroom_soup", name: "Ugotuj zupę grzybową", inputs: [[ITEM.mushroom, 3], [ITEM.potato, 1], [ITEM.milk, 1]], output: [ITEM.mushroomSoup, 2], hours: 3, stamina: 2, startSe: "Liquid", desc: "Grzyby z ziemniakiem na mleku: kremowa zupa." },
                { id: "porridge", name: "Ugotuj owsiankę", inputs: [[CROPS.barley.produce, 3], [ITEM.milk, 1], [ITEM.honey, 1]], output: [ITEM.porridge, 2], hours: 2, stamina: 1, startSe: "Liquid", desc: "Kasza jęczmienna na mleku z łyżką miodu. Tania i sycąca." },
                { id: "brew", name: "Zaparz wywar", inputs: [[ITEM.herb, 3]], output: [ITEM.brew, 2], hours: 2, stamina: 1, startSe: "Liquid", desc: "Gorący wywar z ziół. Rozgrzewa na długo." }
            ],
            desc: "Wisi nad ogniem i zastępuje pieczenie na patyku: gotuje zupy, gulasz, owsiankę i wywary, a przy jego ogniu można się ogrzać. Powstaje z rozbudowy trójnogu. Mięso, ryby i ziemniaki upieczesz na osobnym ognisku." },
        pen: { name: "Owczarnia", cost: [[ITEM.planks, 12], [ITEM.rope, 2], [ITEM.stone, 2]], w: 6, h: 5, stamina: 14, image: "Farm_Pen_L", legacy: { w: 2, h: 1, image: "Farm_Pen", cost: [[ITEM.planks, 6], [ITEM.rope, 2], [ITEM.stone, 2]] },
            yard: { gate: 2, hut: { dx: 2, dy: 3, w: 2, h: 1 }, animal: "sheep", count: 3 },
            produce: { item: ITEM.wool, amount: 1, period: 3, cap: 3 },
            desc: "Ogrodzony wygon z szopą: w środku pasą się owce i dają wełnę, 1 sztukę co 3 dni (maksymalnie 3). Z wełny szyje się płaszcz." },
        // The forest bed (type key kept from the old hide bedroll): made in "Wytwórz..." (an item), laid out like the tent, but a night on it
        // restores only part of the strength: sleepRestore of the maximum, sleepBad in rain, snow and winter. refund: what Rozbierz gives back.
        bedroll: { name: "Leśne legowisko", cost: [[ITEM.boughBed, 1]], w: 2, stamina: 2, image: "Farm_Bedroll", instant: true, sleep: true, indoor: true, sleepRestore: 0.6, sleepBad: 0.4,
            refund: [[ITEM.branch, 3], [ITEM.fiber, 1]],
            desc: "Sterta gałęzi wyścielona suchą trawą i związana lnem. Prześpisz na niej noc, ale wstaniesz z około 60% sił, a w deszczu, śniegu i zimą z 40%. Namiot wypoczywa lepiej. Zrobisz ją w menu „Wytwórz...”." },
        // A portable building: sewn in the tannery into an item, pitched at once (instant: no site, no hammer) and packed up again
        // into the item (pack). Sleeping in it (sleep) works like the bed of the house did: until the morning, everything restored.
        tent: { name: "Namiot", cost: [[ITEM.tent, 1]], w: 3, h: 2, stamina: 3, image: "Farm_Tent_L", legacy: { w: 2, h: 1, image: "Farm_Tent" }, instant: true, pack: ITEM.tent, sleep: true,
            desc: "Rozstawiasz go od razu, bez młotka. Prześpisz w nim całą noc i wstaniesz z pełnią sił, także w deszczu. Rano złożysz go i zabierzesz ze sobą. Zszyjesz go w garbarni." },
        // dairy: the cowshed gives milk, the dairy turns milk into cheese, the pantry keeps food fresh (Spoilage.js: keeps = how fast it ages)
        cowshed: { name: "Obora", cost: [[ITEM.planks, 16], [ITEM.rope, 3], [ITEM.nails, 6]], w: 8, h: 5, stamina: 18, image: "Farm_Cowshed_XL",
            v2: { w: 7, h: 5, image: "Farm_Cowshed_L", cost: [[ITEM.planks, 14], [ITEM.rope, 3], [ITEM.nails, 6]], stamina: 16, yard: { gate: 3, hut: { dx: 2, dy: 3, w: 3, h: 1 }, animal: "cow", count: 2 } }, legacy: { w: 2, h: 1, image: "Farm_Cowshed", cost: [[ITEM.planks, 8], [ITEM.rope, 3], [ITEM.nails, 4]] },
            yard: { gate: 3, hut: { dx: 2, dy: 3, w: 4, h: 1 }, animal: "cow", count: 2 },
            produce: { item: ITEM.milk, amount: 2, period: 1, cap: 6 },
            desc: "Ogrodzony wybieg z oborą: w środku chodzą krowy, a razem dają 2 dzbany mleka dziennie (najwyżej 6). Mleko szybko kwaśnieje, więc zbieraj je często albo zrób z niego ser." },
        // The player's first house: a log hut (one per game). Its doorway (door.dx: a passable cell of the bottom row) leads to Map100, a room with
        // a 5 x 2 floor where furniture (the buildings marked indoor) is put with the same build menu.
        hut: { name: "Chatka", cost: [[ITEM.planks, 30], [ITEM.nails, 40], [ITEM.stone, 20], [ITEM.iron, 6]], w: 5, h: 3, stamina: 40, image: "Farm_Hut_L", door: { dx: 3 }, single: true,
            desc: "Twój pierwszy własny dach: mała chatka z bali. Wchodzisz do niej przez drzwi, a w środku (podłoga 5 × 2 pola) postawisz meble: łóżko, kredens, warsztat, skrzynie, ławkę albo legowisko. Pod dachem nie leje i nie mrozi. Tylko jedna na całą grę, za to kosztuje mnóstwo desek, gwoździ, kamieni i żelaza." },
        // furniture that stands only inside the hut (indoorOnly); the pieces marked indoor (bench, chests, workbench, bedroll) stand there too
        bed: { name: "Łóżko", cost: [[ITEM.planks, 6], [ITEM.nails, 4], [ITEM.wool, 3]], w: 2, h: 1, stamina: 8, image: "Farm_Bed", sleep: true, indoor: true, indoorOnly: true,
            desc: "Prawdziwe łóżko ze słomianym materacem i wełnianym kocem. Prześpisz w nim całą noc i wstaniesz z pełnią sił. Stoi tylko w chatce." },
        larder: { name: "Kredens", cost: [[ITEM.planks, 8], [ITEM.nails, 6]], w: 1, h: 1, stamina: 8, image: "Farm_Larder", slots: 24, keeps: 0.2, foodOnly: true, indoor: true, indoorOnly: true,
            desc: "Kredens na jedzenie: 24 rodzaje, po 99 sztuk. To, co w nim leży, psuje się pięć razy wolniej, jak w spiżarni. Stoi tylko w chatce." },
        dairy: { name: "Serowarnia", cost: [[ITEM.planks, 6], [ITEM.stone, 4], [ITEM.rope, 2]], w: 3, h: 2, stamina: 11, image: "Farm_Dairy_L", legacy: { w: 2, h: 1, image: "Farm_Dairy" }, startSe: "Liquid", working: "Mleko się ścina...",
            recipes: [{
                id: "cheese", name: "Zrób ser", inputs: [[ITEM.milk, 3]], output: [ITEM.cheese, 1],
                hours: 10, stamina: 3, startSe: "Liquid", desc: "Mleko zsiada się i dojrzewa pod prasą. Z trzech dzbanów wychodzi jeden ser, który trzyma się miesiąc."
            }],
            desc: "Zsiadłe mleko, prasa i dojrzewające sery. Ser syci na długo i prawie się nie psuje." },
        pantry: { name: "Spiżarnia", cost: [[ITEM.planks, 6], [ITEM.stone, 4], [ITEM.rope, 1]], w: 3, h: 2, stamina: 9, image: "Farm_Pantry_XL", v2: { w: 2, h: 1, image: "Farm_Pantry_L" }, legacy: { w: 1, h: 1, image: "Farm_Pantry" }, slots: 24, keeps: 0.2, foodOnly: true,
            desc: "Chłodna szafa na jedzenie: 24 rodzaje, po 99 sztuk. Wszystko, co w niej leży, psuje się pięć razy wolniej." }
    };
    BUILDINGS.tripod.recipes = BUILDINGS.campfire.recipes;   // the tripod roasts what the campfire roasts
    // the cauldron takes the whole fire: only its own dishes, no roasting on a stick (that needs a campfire of its own)
    for (const r of BUILDINGS.campfire.recipes) r.roast = true;   // sat by the fire with the food on a stick (or hung on the tripod's hook)
    const BUILDING_IDS = Object.keys(BUILDINGS);

    // Recipes that need no building: what a person can make with bare hands from what lies on the ground. There are
    // only four: the hammer (every building is put up with it, the workbench first), the forest bed, the waterskin and rope. All the other tools are
    // made at the workbench. Menu of a free plot > "Wytwórz...".
    const HAND_RECIPES = [
        { id: "hammer", name: "Zrób młotek", inputs: [[ITEM.branch, 2], [ITEM.stone, 2], [ITEM.fiber, 1]], output: [ITEM.hammer, 1], manual: true, unique: true, swing: "crouch",
            hours: 1, stamina: 3, startSe: "Hammer", desc: "Kamień przywiązany lnem do gałęzi. Bez niego nie postawisz żadnej budowli." },
        { id: "bough_bed", name: "Zrób leśne legowisko", inputs: [[ITEM.branch, 6], [ITEM.fiber, 3]], output: [ITEM.boughBed, 1], manual: true, unique: true, alsoBuilt: "bedroll", swing: "crouch",
            hours: 1, stamina: 3, startSe: "Item1", desc: "Gałęzie związane lnem i wyścielone suchą trawą. Rozkładasz je potem w menu „Zbuduj...”. Przespać na nim noc się da, ale wstaniesz z częścią sił. Namiot wypoczywa lepiej." },
        { id: "waterskin", name: "Zrób bukłak", inputs: [[ITEM.rawHide, 1], [ITEM.fiber, 2]], output: [ITEM.skin, 1], manual: true, unique: true, swing: "crouch",
            hours: 1, stamina: 2, startSe: "Item1", desc: "Surowa skóra zszyta lnem w worek z korkiem. Mieści 4 łyki wody: napełnisz go przy stawie albo studni, a napijesz się klawiszem G lub z menu Przedmioty." },
        { id: "rope", name: "Skręć linę", inputs: [[ITEM.fiber, 4]], output: [ITEM.rope, 1], manual: true,
            hours: 1, stamina: 2, startSe: "Item1", desc: "Włókna dzikiego lnu skręcone w mocny sznur." }
    ];

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
    // does the cell keep the player out? (everything of an ordinary building; the fence except the gate, and the hut, of a yard)
    function isSolidCell(g, i, j) {
        if (g.door && j === 0 && i === g.door.dx) return false;   // the doorway of a house
        if (!g.yard) return true;
        if (onRing(g, i, j)) return !(j === 0 && i === g.yard.gate);
        return inHut(g, i, j);
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
        branch: { item: ITEM.branch, share: 0.05, respawn: 3, count: [1, 2] }   // last, so the other kinds keep their tiles
    };
    const GATHER_KINDS = Object.keys(GATHER);
    const BUSH_SHARE = 0.02;        // the part of the tiles that hold a berry bush
    const MUSHROOM_POOL = 0.14;     // the part of the tiles where a mushroom may grow
    const MUSHROOM_LIFE = 3;        // days a mushroom stays before it is gone
    function gatherKindOf(x, y) {
        if (hash2(x, y, 811) < BUSH_SHARE) return "bush";
        const r = hash2(x, y, 301);
        let acc = 0;
        for (const k of GATHER_KINDS) {
            acc += GATHER[k].share;
            if (r < acc) return k;
        }
        return hash2(x, y, 733) < MUSHROOM_POOL ? "mushroom" : null;
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
        if ($gameParty.maxItems(item) - countOf(g.item) < n) { complain(item.iconIndex, "Nie zmieści się w plecaku: " + item.name); return false; }
        if (!spendStamina(STAMINA.pickup)) return false;
        swingThen(CROUCH_KIND, () => {
            stonesOf($gameMap.mapId())[key(x, y)] = today();
            stoneRev++;
            playSe(SE.collect, 105);
            $gameParty.gainItem(item, n);
        });
        return true;
    }
    const pickStone = pickGather;
    // a bush with berries gives berries and stays bare; a bare bush gives fibre and is gone for a while
    function pickBush(x, y) {
        const full = bushState(x, y) === "full", item = itemOf(full ? ITEM.berries : ITEM.fiber), n = full ? rand(GATHER.bush.count) : rand([1, 2]);
        if ($gameParty.maxItems(item) - countOf(item.id) < n) { complain(item.iconIndex, "Nie zmieści się w plecaku: " + item.name); return false; }
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
        if (!thirsty() && !(tired && !needsOn())) { complain(391, "Nie chce ci się pić"); return false; }
        if (src && bucketUnits(src) < 1) { bucketEmpty(); return false; }
        swingThen(CROUCH_KIND, () => {
            if (src) takeBucketWater(src, 1);
            if (needsOn()) {
                const got = Needs.drink(Needs.TAP_DRINK);
                $gameSystem.changeStamina(3);
                playSe(SE.water, 105);
                popup(391, "Nawodnienie +" + got, "#9fd4ff");
            } else {
                $gameSystem.changeStamina(8);
                playSe(SE.water, 105);
                popup(82, "+8 wytrzymałości", "#9ff0a8");
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
                let chance = 0.5 + ((hour >= 5 && hour < 8) || (hour >= 17 && hour < 20) ? 0.25 : 0) + ($gameScreen.weatherType() === "rain" ? 0.1 : 0) - (seasonIndex(today()) === 3 ? 0.2 : 0);
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
    function wellEntries() {
        return [drinkEntry(), skinEntry(), canEntry()];
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
            drinkEntry(b), skinEntry(b), canEntry(b),
            { name: "Wylej wodę", icon: itemOf(ITEM.bucket).iconIndex, enabled: n >= 1, help: "Wylewasz wodę na ziemię. Robisz to przed zabraniem wiadra: z wodą w środku nie da się go podnieść.", run: () => pourOut(b) }];
    }
    function waterMenu() {
        const rod = itemOf(ITEM.rod), have = $gameParty.hasItem(rod);
        return { title: "Woda", entries: [
            { name: "Zarzuć wędkę", icon: rod.iconIndex, right: "-" + STAMINA.fish, enabled: have,
                help: have ? "Ryby biorą najlepiej o świcie i o zmierzchu. Wędkowanie trwa około godziny." : "Potrzebujesz wędki. Robi się ją przy tartaku.", run: goFishing },
            drinkEntry(), skinEntry(), canEntry(), cancelEntry()] };
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
        if ($gameTemp && typeof $gameTemp.pushLootPopup === "function") $gameTemp.pushLootPopup(icon, text, color);
        else $gameMessage.add(text);
    }
    function complain(icon, text) { popup(icon, text, "#ff9f8f"); }

    function playSe(name, pitch) {
        AudioManager.playSe({ name, volume: 90, pitch: pitch || 100, pan: 0 });
    }
    function spendStamina(cost) {
        if (cost <= 0 || typeof $gameSystem.trySpendStamina !== "function") return true;
        if ($gameSystem.trySpendStamina(cost)) return true;
        complain(82, "Jesteś zbyt zmęczony");
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
    // null when it can be built there, otherwise the reason
    function tileWhyNot(x, y) {
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
        if (plot.dug) return "Najpierw zagrab dół.";
        if (buildingAt(x, y)) return "Tu już coś stoi.";
        if (!tileIsFree(x, y)) return "Coś tu stoi.";
        return null;
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
            const why = tileWhyNot(t.x, t.y);
            if (why) return why;
        }
        return null;
    }
    // what a building costs now: a piece that can be carried (the bucket) is paid for with the item when there is one in the bag
    function effectiveCost(type) {
        const def = BUILDINGS[type];
        return def.carry && countOf(def.carry) > 0 ? [[def.carry, 1]] : def.cost;
    }
    function missingMaterials(type) {
        return effectiveCost(type).filter(([id, n]) => countOf(id) < n);
    }
    function build(type, x, y, flip) {
        const def = BUILDINGS[type];
        if (!def) return false;
        const why = whyNotBuild(type, x, y, flip);
        if (why) { complain(itemOf(ITEM.wood).iconIndex, why); return false; }
        if (missingMaterials(type).length > 0) { complain(itemOf(def.cost[0][0]).iconIndex, "Brakuje materiałów"); return false; }
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
        if (missingMaterials(type).length > 0) { complain(iconItem.iconIndex, "Brakuje: " + itemOf(def.cost[0][0]).name); return false; }
        if (!spendStamina(def.stamina)) return false;
        for (const [id, n] of effectiveCost(type)) $gameParty.loseItem(itemOf(id), n, false);
        let crouched = false;
        crouched = swingThen(CROUCH_KIND, () => {
            const fresh = claimGround(tilesOfBuilding(type, x, y));
            buildingsOf($gameMap.mapId()).push(Object.assign({ id: farm().nextId++, type, x, y, last: today(), v: 3, claimed: fresh }, def.rain ? { water: 0, wt: clockHours() } : {}, flip ? { flip: true } : {}));
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
            list.push(Object.assign({ id: farm().nextId++, type: up.to, x: ax, y: ay, last: today(), v: 3, claimed: fresh }, b.flip ? { flip: true } : {}));
            changed();
            playSe(SE.build, 100);
            later(10, () => playSe(SE.build, 90));
            popup(itemOf(up.tool || up.cost[0][0]).iconIndex, up.done || "Rozbudowano: " + target.name, "#9ff0a8");
        });
        return true;
    }
    function upgradeEntry(b, def) {
        const up = def.upgrade, cost = up.cost.map(([id, n]) => itemOf(id).name + " ×" + n).join(", ");
        return { name: up.name, icon: itemOf(up.cost[0][0]).iconIndex, right: "-" + up.stamina, help: up.help + "\nKoszt: " + cost + ".", run: () => upgradeBuilding(b) };
    }

    // Folds the tent back into its item (a tent with nothing inside has nothing to block it).
    function packUp(b) {
        const def = BUILDINGS[b.type], item = itemOf(def.pack);
        if (def.rain && bucketUnits(b) >= 1) { complain(item.iconIndex, "Najpierw wylej lub zużyj wodę"); return false; }
        if ($gameParty.maxItems(item) - countOf(def.pack) < 1) { complain(item.iconIndex, "Nie zmieści się w plecaku: " + item.name); return false; }
        let crouched = false;
        crouched = swingThen(CROUCH_KIND, () => {
            const list = buildingsOf($gameMap.mapId());
            if (list.indexOf(b) < 0) return;
            list.splice(list.indexOf(b), 1);
            releaseGround(b, $gameMap.mapId());
            changed();
            $gameParty.gainItem(item, 1);
            playSe("Equip1", 100);
            popup(item.iconIndex, def.packedText || "Złożono: " + def.name, "#f3e0a0");
            if (!crouched) lockPlayer(30);
        });
        return true;
    }
    // The hour the SurvivalHUD plugin wakes you at (the same as after a night in a bed).
    const wakeHour = () => num(PluginManager.parameters("SurvivalHUD").wakeHour, 7);
    // A night in a tent = a night in a bed: the screen fades, time jumps to the morning (Journal writes the day summary,
    // Atmosphere saves the game - both hook sleepUntilHour), strength and health are restored, a message greets the new day.
    // rain, snow or winter: the forest bed is damp and cold (the tent stays dry)
    const harshNight = () => ["rain", "storm", "snow"].includes($gameScreen.weatherType()) || seasonIndex(today()) === 3;
    function sleepInTent(b) {
        if (typeof $gameSystem.sleepUntilHour !== "function") { complain(82, "Tu się nie da spać"); return false; }
        const def = BUILDINGS[b.type];
        const bad = def.sleepBad !== undefined && !isHutInterior() && harshNight();   // under the roof of the hut the weather does not matter
        const restore = bad ? def.sleepBad : def.sleepRestore !== undefined ? def.sleepRestore : 1;
        const morning = restore >= 1 ? "Czujesz się wypoczęty." : bad ? "Spałeś w zimnie i wilgoci. Sił odzyskałeś niewiele." : "Spałeś twardo. Sił odzyskałeś tylko część.";
        lockPlayer(240);
        $gameScreen.startFadeOut(40);
        later(45, () => {
            AudioManager.playMe({ name: PluginManager.parameters("SurvivalHUD").sleepMe || "Inn1", volume: 90, pitch: 100, pan: 0 });
            const woke = $gameSystem.sleepUntilHour(wakeHour());
            if (typeof $gameSystem.setStamina === "function") $gameSystem.setStamina(Math.max($gameSystem.stamina(), Math.round($gameSystem.maxStamina() * restore)));
            for (const member of $gameParty.members()) member.recoverAll();
            if (b.type === "tent") farm().tentNights = (farm().tentNights || 0) + 1; else farm().bedNights = (farm().bedNights || 0) + 1;
            b.last = today();
        });
        later(115, () => {
            $gameScreen.startFadeIn(40);
            $gameMessage.add("Dzień " + $gameSystem.dayNightDay() + ". " + $gameSystem.dayNightPeriod().name + ".");
            $gameMessage.add(morning);
        });
        return true;
    }
    function placeSite(type, x, y, flip) {
        const def = BUILDINGS[type];
        if (!def) return false;
        if (def.instant) return pitchInstant(type, x, y, flip);
        const why = whyNotBuild(type, x, y, flip);
        if (why) { complain(itemOf(ITEM.wood).iconIndex, why); return false; }
        if (missingMaterials(type).length > 0) { complain(itemOf(def.cost[0][0]).iconIndex, "Brakuje materiałów"); return false; }
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
            { name: "Zrezygnuj", help: "Zwraca wszystkie materiały.", run: () => cancelSite(b) },
            cancelEntry()] };
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
        return Math.min(p.cap, Math.floor(Math.max(0, today() - b.last) / p.period) * p.amount);
    }
    function daysToProduce(b) {
        const p = BUILDINGS[b.type].produce;
        return Math.max(1, p.period - Math.max(0, today() - b.last) % p.period);
    }
    function collect(b) {
        const n = readyProduce(b);
        if (n < 1) return false;
        swingThen(CROUCH_KIND, () => {
            b.last = today();
            changed();
            playSe(SE.collect, 100);
            $gameParty.gainItem(itemOf(BUILDINGS[b.type].produce.item), n);
        });
        return true;
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
    function recipeOf(b, id) {
        return ((BUILDINGS[b.type] || {}).recipes || []).find(r => r.id === id) || null;
    }
    function missingInputs(r) {
        return r.inputs.filter(([id, n]) => countOf(id) < n);
    }
    function startJob(b, recipeId) {
        const r = recipeOf(b, recipeId);
        if (!r || b.job) return false;
        const missing = missingInputs(r);
        if (missing.length > 0) { complain(itemOf(missing[0][0]).iconIndex, "Brakuje: " + itemOf(missing[0][0]).name); return false; }
        if (!spendStamina(r.stamina || 0)) return false;
        for (const [id, n] of r.inputs) $gameParty.loseItem(itemOf(id), n, false);
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
        if ($gameParty.maxItems(item) - countOf(id) < n) { complain(item.iconIndex, "Nie zmieści się w plecaku: " + item.name); return false; }
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
    // takes passes in front of the player (the screen dims) - nothing keeps working by itself.
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
        if (!r.repair && $gameParty.maxItems(out) - countOf(r.output[0]) < r.output[1]) { complain(out.iconIndex, "Nie zmieści się w plecaku: " + out.name); return false; }
        if (!spendStamina(r.stamina || 0)) return false;
        for (const [id, n] of r.inputs) $gameParty.loseItem(itemOf(id), n, false);
        const se = r.startSe || (b && BUILDINGS[b.type] && BUILDINGS[b.type].startSe) || SE.build;
        swingThen(craftSwing(r), () => {
            lockPlayer(62);   // the fade out and in below: about a second
            playSe(se, 90);
            later(9, () => playSe(se, 80));
            later(18, () => playSe(se, 95));
            $gameScreen.startFadeOut(26);
            later(32, () => {
                if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(r.hours);
                if (r.repair) {
                    if (window.Durability) Durability.repair(r.repair);
                    popup(out.iconIndex, out.name + ": naprawione", "#9ff0a8");
                } else {
                    $gameParty.gainItem(out, r.output[1]);
                    if (r.tool) useTool(r.tool);
                }
                $gameScreen.startFadeIn(26);
            });
        });
        return true;
    }
    function rest(b) {
        const def = BUILDINGS[b.type];
        if (typeof $gameSystem.staminaRatio === "function" && $gameSystem.staminaRatio() >= 0.98) {
            complain(82, "Nie jesteś zmęczony");
            return false;
        }
        const restore = () => {
            if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(def.restHours || 1);
            if (window.Journal) Journal.afterRest();   // a night on the bedroll ends the day: the summary of it
            if (window.Atmosphere) Atmosphere.afterRest(def);   // a long rest saves the game (autosave)
            if (typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(def.rest);
            playSe(SE.rest, 100);
            popup(82, "+" + def.rest + " wytrzymałości", "#9ff0a8");
        };
        if (def.fire) {   // by a fire the player sits down on the ground; the swing lasts through the fade, then the player stands up
            swingThen(SIT_KIND, () => {
                lockPlayer(60);
                $gameScreen.startFadeOut(24);
                later(26, () => { restore(); $gameScreen.startFadeIn(24); });
            });
            return true;
        }
        lockPlayer(95);
        $gameScreen.startFadeOut(30);
        later(35, () => {
            restore();
            $gameScreen.startFadeIn(30);
        });
        return true;
    }

    // ------------------------------------------------------------------
    // What the action button offers on a tile: { title, entries } where an entry
    // is { name, icon, costs, right, help, enabled, run }. null = nothing here;
    // { done: true } = the action was carried out right away (ripe crop).
    // ------------------------------------------------------------------
    const cancelEntry = () => ({ name: "Zostaw", help: "", run: null });

    // [[item id, amount]] -> [[icon, amount, in the bag, name]]: the list shows icon and amount, the popup the rest
    function costRows(pairs) {
        return pairs.map(([id, n]) => [itemOf(id).iconIndex, n, countOf(id), itemOf(id).name]);
    }
    function costsOf(type) {
        return costRows(effectiveCost(type));
    }
    function costText(type) {
        return effectiveCost(type).map(([id, n]) => itemOf(id).name + " ×" + n).join(", ");
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

    function buildEntries(x, y, direct) {
        const indoors = isHutInterior();
        const entries = BUILDING_IDS.filter(type => !BUILDINGS[type].noBuild && (indoors ? BUILDINGS[type].indoor : !BUILDINGS[type].indoorOnly)).map(type => {
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
        if (hammerMissing()) entries.unshift(handRecipeEntry(HAND_RECIPES.find(r => r.id === "hammer")));   // no hammer yet: the way to make one comes first
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
    function stationEntries(b, def) {
        const entries = [];
        const autoRecipes = def.recipes.filter(r => !r.manual), manualRecipes = def.recipes.filter(r => r.manual);
        if (b.job) {
            const [id, n] = b.job.out, item = itemOf(id);
            if (jobReady(b)) {
                entries.push({ name: "Zbierz: " + item.name + " ×" + n, icon: item.iconIndex, help: "Wypał skończony. Wyjmujesz gotowy produkt.", run: () => collectJob(b) });
            } else {
                entries.push({ name: def.working || "Trwa wypał...", icon: item.iconIndex, right: "~" + hoursText(jobHoursLeft(b)), enabled: false,
                    help: "Będzie gotowe za około " + hoursText(jobHoursLeft(b)) + " (czas gry płynie też, gdy jesteś daleko)." });
                if (def.hang) entries.push({ name: "Poczekaj przy ogniu", icon: 82, help: "Siadasz przy ogniu, aż się upiecze. Możesz też wstać i odejść: piecze się dalej.", run: () => waitAtFire(b) });
            }
        } else {
            for (const r of autoRecipes) {
                const missing = missingInputs(r), out = itemOf(r.output[0]);
                const sit = r.roast ? "\n" + (def.hang ? "Zawieszasz to na haczyku trójnogu: piecze się samo, możesz odejść." : "Siedzisz z tym na patyku nad ogniem. Jeśli odejdziesz przed końcem, nic się nie upiecze.") : "";
                const help = missing.length > 0
                    ? "Brakuje: " + missing.map(([id, n]) => itemOf(id).name + " (" + countOf(id) + "/" + n + ")").join(", ") + "."
                    : "Wynik: " + out.name + " ×" + r.output[1] + ", " + hoursText(r.hours).replace(/\.$/, "") + ".\n" + r.desc + sit;
                entries.push({ name: r.name, costs: costRows(r.inputs), enabled: missing.length === 0, help, run: () => startJob(b, r.id),
                    tip: "Wynik: " + out.name + " ×" + r.output[1] + ".\n" + r.desc, facts: [r.roast && !def.hang ? "Czas: " + hoursText(r.hours) + " (siedzisz przy ogniu; odejście przerywa pieczenie)" : "Czas: " + hoursText(r.hours) + (def.hang ? " (piecze się na trójnogu, możesz odejść)" : " (piec pracuje w tle)")] });
            }
        }
        // hand work is available at any time (also while the fire of the same building burns)
        for (const r of manualRecipes) entries.push(manualEntry(b, r));
        if (def.repairs && window.Durability) for (const r of Durability.repairRecipes()) entries.push(manualEntry(b, r));
        return entries;
    }

    function menuFor(x, y) {
        const b = solidAt(x, y);
        if (!b && buildingAt(x, y)) return null;   // the open ground inside a yard: nothing to do there (no digging, no sowing)
        if (b && b.site) return siteMenu(b, x, y);
        if (b) {
            const def = geoOf(b);
            const entries = [];
            if (def.door && !b.site) entries.push({ name: "Wejdź do środka", icon: 82, help: "Wchodzisz do chatki. Drzwi otwierasz też, po prostu w nie wchodząc.", run: () => enterHut(b) });
            if (def.rest) entries.push({ name: b.type === "bench" ? "Usiądź i odpocznij" : b.type === "bedroll" ? "Zdrzemnij się" : "Ogrzej się przy ogniu", icon: 82, right: "+" + def.rest,
                help: "Odnawia wytrzymałość. Mija " + hoursText(def.restHours || 1), run: () => rest(b) });
            if (def.water) entries.push(...wellEntries());
            if (def.rain && !b.site) entries.push(...bucketEntries(b));
            if (def.produce) {
                const ready = readyProduce(b), item = itemOf(def.produce.item);
                entries.push({ name: ready > 0 ? "Zbierz: " + item.name + " ×" + ready : "Zbierz: " + item.name, icon: item.iconIndex, enabled: ready > 0,
                    help: ready > 0 ? "Zabierasz wszystko, co jest gotowe." : "Jeszcze nic nie ma. Następna porcja za " + daysToProduce(b) + " dn.",
                    run: () => collect(b) });
            }
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
                const wet = !!def.rain && bucketUnits(b) >= 1;   // a bucket with water in it cannot be picked up: the water would be lost
                entries.push({ name: def.packName || "Złóż namiot", icon: itemOf(def.pack).iconIndex, enabled: !wet,
                    help: wet ? "W wiadrze jest woda. Wylej ją albo zużyj (pij, napełnij konewkę lub bukłak, podlej), zanim je zabierzesz." : def.packHelp || "Składasz namiot i zabierasz go ze sobą. Rozstawisz go, gdzie zechcesz.", run: () => packUp(b) });
            }
            const back = def.refund || def.cost.map(([id, n]) => [id, Math.floor(n / 2)]).filter(([, n]) => n > 0);
            const block = demolishBlock(b);
            if (!def.pack) entries.push({ name: "Rozbierz", enabled: !block, help: block || "Zwraca połowę materiałów" + (back.length ? ": " + back.map(([id, n]) => itemOf(id).name + " ×" + n).join(", ") : "") + ".", run: () => demolish(b) });
            entries.push(cancelEntry());
            return { title, entries };
        }
        const plot = plotAt(x, y);
        if (!plot || !tileIsFree(x, y)) return null;
        if (plot.s === "floor") return { title: "Wyposaż chatkę", entries: buildEntries(x, y, true).concat([cancelEntry()]) };
        if (plot.crop) {
            const def = CROPS[plot.crop];
            if (isRipe(x, y, plot)) { harvest(x, y); return { done: true }; }
            return {
                title: def.name + ": jeszcze " + daysLeft(x, y, plot) + " dn." + (wateredRecently(plot) ? " (podlane)" : ""),
                entries: [waterEntry(x, y), { name: "Wyrwij roślinę", help: "Usuwa roślinę. Pole wraca do zaoranej ziemi.", run: () => uproot(x, y) }, cancelEntry()]
            };
        }
        if (plot.s === "cleared") {
            return { title: plot.natural ? "Nieuprawiana ziemia" : "Oczyszczona ziemia", entries: [
                { name: "Zagrab ziemię", icon: itemOf(ITEM.rake).iconIndex, right: "-" + STAMINA.rake, help: plot.natural ? "Grabie. Zrywa darń i przygotowuje ziemię pod orkę." : "Grabie. Przygotowuje ziemię pod orkę.", run: () => rake(x, y) },
                digEntry(x, y),
                handMenuEntry(x, y),
                { name: "Zbuduj...", help: "Wybierz, co postawić na tym polu.", run: () => openBuildMenu(x, y) },
                cancelEntry()] };
        }
        if (plot.s === "raked") {
            return { title: "Zagrabiona ziemia", entries: [
                { name: "Zaoraj ziemię", icon: itemOf(ITEM.hoe).iconIndex, right: "-" + STAMINA.hoe, help: "Motyka. Zaorana ziemia nadaje się do siewu.", run: () => till(x, y) },
                digEntry(x, y),
                handMenuEntry(x, y),
                { name: "Zbuduj...", help: "Wybierz, co postawić na tym polu.", run: () => openBuildMenu(x, y) },
                cancelEntry()] };
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
        entries.push(cancelEntry());
        return { title: "Zaorana ziemia (" + seasonOf(today()) + ")" + (wateredRecently(plot) ? " - podlana" : ""), entries };
    }

    // the menu is a window of the current map scene
    function showMenu(title, entries, kind, index) {
        const scene = SceneManager._scene;
        if (scene && typeof scene.openFarmMenu === "function") scene.openFarmMenu(title, entries, kind, index);
    }
    function openMenu(x, y) {
        const menu = menuFor(x, y);
        if (menu && menu.entries) showMenu(menu.title, menu.entries);
    }
    function openBuildMenu(x, y) {
        showMenu("Budowa", buildEntries(x, y));
    }

    // ---- Q and E on the map
    // Q: everything that can be built, from wherever the player stands (placing starts at the tile in front of them); in the hut only the furniture
    function openBuildKeyMenu() {
        let t = targetTile();
        if (!$gameMap.isValid(t.x, t.y)) t = { x: $gamePlayer.x, y: $gamePlayer.y };
        showMenu(isHutInterior() ? "Wyposaż chatkę" : "Budowa", buildEntries(t.x, t.y, true), "build");
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
            if (!quiet) complain(390, "Nie masz nic do jedzenia");   // 390: the icon of hunger
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
        if (menu.entries) showMenu(menu.title, menu.entries);
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

    Window_FarmList.prototype.makeCommandList = function() {
        for (const e of this._entries || []) this.addCommand(e.name, "entry", e.enabled !== false);
    };

    Window_FarmList.prototype.setup = function(title, entries, index) {
        this._title = title;
        this._entries = entries;
        this.refresh();
        this.select(Math.max(0, Math.min(index || 0, entries.length - 1)));
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
    Window_FarmTitle.prototype.setTitle = function(text) {
        this.contents.clear();
        this.resetFontSettings();
        this.contents.fontSize = 28;
        this.changeTextColor(ColorManager.textColor(16));
        this.drawText(text || "", 0, 0, this.innerWidth, "left");
        this.resetFontSettings();
    };

    // The popup: name, description, facts and what is needed (green when it is in the bag, red when it is not).
    const TIP_FONT = 24, TIP_LINE = 30;
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
        add({ kind: "name", text: entry.name, icon: entry.icon }, 42);
        add({ kind: "rule" }, 12);
        const body = this.bodyText(entry);
        if (body) for (const line of wrapLines(this, body, inner - 4)) add({ kind: "text", text: line }, TIP_LINE);
        if (entry.facts && entry.facts.length > 0) {
            h += 6;
            for (const fact of entry.facts) for (const line of wrapLines(this, fact, inner - 4)) add({ kind: "fact", text: line }, 28);
        }
        if (entry.costs && entry.costs.length > 0) {
            h += 10;
            add({ kind: "heading", text: "Potrzebne" }, 30);
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
                c.fontSize = 30;
                this.changeTextColor(ColorManager.textColor(16));
                this.drawText(op.text, x, op.y, inner - x);
            } else if (op.kind === "rule") {
                c.fillRect(0, op.y + 2, inner, 2, ColorManager.textColor(26));
            } else if (op.kind === "text") {
                this.drawText(op.text, 0, op.y - 3, inner);
            } else if (op.kind === "fact") {
                this.changeTextColor(ColorManager.textColor(7));
                c.fontSize = 22;
                this.drawText(op.text, 0, op.y - 4, inner);
            } else if (op.kind === "heading") {
                this.changeTextColor(ColorManager.systemColor());
                this.drawText(op.text, 0, op.y - 3, inner);
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
        ctx.fillStyle = "#1c1410";   // the colour of the window back at its edge
        ctx.beginPath();
        ctx.moveTo(w, 0); ctx.lineTo(2, h / 2); ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#a67c3a";
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
    Scene_Map.prototype.openFarmMenu = function(title, entries, kind, index) {
        const menu = this._farmMenu, plate = this._farmTitle;
        const width = this.farmMenuWidth(entries);
        const listH = this.calcWindowHeight(Math.min(entries.length, 8), true);
        const plateH = this.calcWindowHeight(1, false);
        const x = MENU_MARGIN, y = Graphics.boxHeight - MENU_MARGIN - listH;
        menu.move(x, y, width, listH);
        plate.move(x, y - plateH, width, plateH);
        menu.createContents();   // the contents bitmap has to match the new size
        plate.createContents();
        plate.setTitle(title);
        this._farmTip.reset();
        this._farmKind = kind || "";
        menu.setup(title, entries, index);
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
        const now = this._farmKind;
        if (now !== "build" && now !== "food") return;   // the menu of a plot, a station...: no use for Q and E
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

    // smooth value noise, so the edges of a patch wave instead of jittering pixel by pixel
    function vnoise(x, salt) {
        const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f);
        return hash2(i, salt, 7) * (1 - t) + hash2(i + 1, salt, 7) * t;
    }
    function vnoise2(x, y, salt) {
        const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
        const tx = fx * fx * (3 - 2 * fx), ty = fy * fy * (3 - 2 * fy);
        const top = hash2(i, j, salt) * (1 - tx) + hash2(i + 1, j, salt) * tx;
        const bottom = hash2(i, j + 1, salt) * (1 - tx) + hash2(i + 1, j + 1, salt) * tx;
        return top * (1 - ty) + bottom * ty;
    }

    // neighbour bits: N 1, E 2, S 4, W 8, NE 16, SE 32, SW 64, NW 128
    // depth of the pixel below the ragged edge of the patch (< 0 = outside).
    // The edge is measured in world pixels along the side, so it runs on smoothly from tile to tile.
    function soilDepth(px, py, n, wx, wy) {
        let depth = 99;
        const inset = (a, salt) => 2 + 5.5 * vnoise(a / 11, salt) + 1.1 * hash2(a, salt, 3);
        if (!(n & 1)) depth = Math.min(depth, py - inset(wx, 11));
        if (!(n & 4)) depth = Math.min(depth, TILE - 1 - py - inset(wx, 12));
        if (!(n & 8)) depth = Math.min(depth, px - inset(wy, 13));
        if (!(n & 2)) depth = Math.min(depth, TILE - 1 - px - inset(wy, 14));
        const corner = (open, cx, cy) => {   // outer corner (both sides open): rounded
            if (!open) return;
            const dx = cx === 0 ? 12 - px : px - (TILE - 13), dy = cy === 0 ? 12 - py : py - (TILE - 13);
            if (dx > 0 && dy > 0) depth = Math.min(depth, 9 - Math.hypot(dx, dy) + 2);
        };
        corner(!(n & 1) && !(n & 8), 0, 0);
        corner(!(n & 1) && !(n & 2), 1, 0);
        corner(!(n & 4) && !(n & 2), 1, 1);
        corner(!(n & 4) && !(n & 8), 0, 1);
        const bite = (open, cx, cy) => {   // inner corner: the diagonal neighbour is missing
            if (open) depth = Math.min(depth, Math.hypot(px - cx, py - cy) - 5.5);
        };
        bite((n & 1) && (n & 8) && !(n & 128), 0, 0);
        bite((n & 1) && (n & 2) && !(n & 16), TILE - 1, 0);
        bite((n & 4) && (n & 2) && !(n & 32), TILE - 1, TILE - 1);
        bite((n & 4) && (n & 8) && !(n & 64), 0, TILE - 1);
        return depth;
    }

    const SOIL = {
        cleared: { a: [124, 94, 63], b: [140, 107, 73], c: [108, 81, 54], pebble: [168, 150, 126], root: [92, 68, 46], rim: [72, 52, 34] },
        raked: { a: [130, 99, 67], b: [153, 118, 82], c: [102, 76, 49], rim: [72, 52, 34] },
        tilled: { crest: [126, 87, 56], mid: [98, 66, 42], trough: [68, 45, 29], rim: [58, 39, 26] },
        yard: { rim: [66, 56, 44] }
    };
    const GRASS_EDGE = { dark: [34, 84, 46], mid: [60, 136, 66], light: [98, 172, 86] };

    // a small stone lying on the ground (3x2 px, light from the upper left), or null
    function pebbleAt(wx, wy) {
        const cx = Math.floor(wx / 12), cy = Math.floor(wy / 12);
        if (hash2(cx, cy, 5) < 0.8) return null;
        const dx = wx - (cx * 12 + 2 + Math.floor(hash2(cx, cy, 6) * 7)), dy = wy - (cy * 12 + 2 + Math.floor(hash2(cx, cy, 8) * 7));
        if (dx >= 0 && dx < 3 && dy >= 0 && dy < 2) return dy === 1 ? [104, 88, 70] : dx === 0 ? [176, 158, 134] : [146, 128, 106];
        if (dx >= 1 && dx < 4 && dy === 2) return [78, 58, 40];
        return null;
    }

    // a tuft of grass left growing on bare ground (3 px wide, 3 px tall), or null
    function tuftAt(wx, wy) {
        const cx = Math.floor(wx / 16), cy = Math.floor(wy / 16);
        if (hash2(cx, cy, 15) < 0.9) return null;
        const dx = wx - (cx * 16 + 2 + Math.floor(hash2(cx, cy, 16) * 11)), dy = wy - (cy * 16 + 2 + Math.floor(hash2(cx, cy, 17) * 10));
        if (dx < 0 || dx > 2 || dy < 0 || dy > 2) return null;
        if (dy === 2) return dx === 1 ? GRASS_EDGE.dark : null;
        return (dx + dy) % 2 === 0 ? GRASS_EDGE.mid : GRASS_EDGE.light;
    }

    // cobbled yard: irregular flagstones with dark joints, lit from the upper left
    const YARD_CELL = 11;
    function yardColour(wx, wy) {
        const cx = Math.floor(wx / YARD_CELL), cy = Math.floor(wy / YARD_CELL);
        let d1 = 1e9, d2 = 1e9, fx = 0, fy = 0, id = 0;
        for (let j = -1; j <= 1; j++) {
            for (let i = -1; i <= 1; i++) {
                const gx = cx + i, gy = cy + j;
                const sx = gx * YARD_CELL + 1.5 + hash2(gx, gy, 21) * (YARD_CELL - 3);
                const sy = gy * YARD_CELL + 1.5 + hash2(gx, gy, 22) * (YARD_CELL - 3);
                const d = Math.hypot(wx + 0.5 - sx, wy + 0.5 - sy);
                if (d < d1) { d2 = d1; d1 = d; fx = sx; fy = sy; id = hash2(gx, gy, 23); }
                else if (d < d2) d2 = d;
            }
        }
        if (d2 - d1 < 1.7) return [88, 76, 61];                      // joint
        const tones = [[156, 142, 120], [144, 130, 109], [164, 150, 126]];
        const t = tones[Math.floor(id * 3)], lit = (wx - fx) + (wy - fy);
        const k = lit < -4 ? 14 : lit > 5 ? -16 : 0;
        const speck = hash2(wx, wy, 24) > 0.94 ? -10 : 0;
        return [t[0] + k + speck, t[1] + k + speck, t[2] + k + speck];
    }

    function soilColour(state, px, py, wx, wy) {
        if (state === "yard") return yardColour(wx, wy);
        const tuft = state === "cleared" ? tuftAt(wx, wy) : null;
        if (tuft) return tuft;
        const n1 = hash2(wx, wy, 1), broad = vnoise2(wx / 9, wy / 9, 2);
        if (state === "cleared") {
            const s = SOIL.cleared;
            const stone = pebbleAt(wx, wy);
            if (stone) return stone;
            if (n1 > 0.992) return s.pebble;
            if (hash2(wx >> 1, wy >> 1, 4) > 0.955) return s.root;
            const base = broad > 0.62 ? s.b : broad < 0.34 ? s.c : s.a;
            if (n1 > 0.965) return [base[0] + 14, base[1] + 12, base[2] + 10];
            if (n1 < 0.05) return [base[0] - 12, base[1] - 10, base[2] - 8];
            return base;
        }
        if (state === "raked") {
            const s = SOIL.raked;
            const line = (px + Math.round(vnoise(wy / 15, 31) * 2) + (broad > 0.9 ? 1 : 0)) & 3;   // slightly wavy rake marks
            if (line === 0) return s.c;
            if (line === 1) return s.b;
            return n1 > 0.92 ? s.c : broad > 0.7 ? s.b : s.a;
        }
        const s = SOIL.tilled, r = (py + 3 + Math.round(vnoise(wx / 17, 41) * 2)) % 12;
        if (r < 3) return n1 > 0.8 ? s.mid : s.crest;
        if (r < 5) return s.mid;
        if (r < 9) return n1 > 0.85 ? s.mid : s.trough;
        return s.mid;
    }

    // colour of a pixel near the edge of a patch: the dark rim, tufts of grass leaning in over it,
    // and a darker band just inside, so that the patch does not end like a cut-out
    function edgeColour(state, depth, wx, wy, base) {
        const rim = SOIL[state].rim, g = GRASS_EDGE;
        const cell = hash2(Math.floor(wx / 3), Math.floor(wy / 3), 9);
        const clump = cell < 0.34, len = 1.2 + 3 * hash2(Math.floor(wx / 3), Math.floor(wy / 3), 10);
        if (depth < 1) return clump ? g.dark : rim;
        if (clump && depth < len) return depth < 1.9 ? g.mid : g.light;
        if (depth < 3.2) return [base[0] * 0.86, base[1] * 0.86, base[2] * 0.86];
        return null;
    }

    const soilCache = new Map();
    function soilTexture(state, tx, ty, n) {
        const k = state + ":" + tx + "," + ty + ":" + n;
        if (soilCache.has(k)) return soilCache.get(k);
        const bitmap = new Bitmap(TILE, TILE);
        const ctx = bitmap.context, image = ctx.createImageData(TILE, TILE), data = image.data;
        const rim = SOIL[state].rim, clamp = v => Math.max(0, Math.min(255, Math.round(v)));
        for (let py = 0; py < TILE; py++) {
            for (let px = 0; px < TILE; px++) {
                const wx = tx * TILE + px, wy = ty * TILE + py, depth = soilDepth(px, py, n, wx, wy);
                const i = (py * TILE + px) * 4;
                if (depth < -2.4) continue;
                if (depth < 0) {   // soft fringe just outside the edge
                    data[i] = rim[0]; data[i + 1] = rim[1]; data[i + 2] = rim[2];
                    data[i + 3] = Math.round(70 * (depth + 2.4) / 2.4);
                    continue;
                }
                const base = soilColour(state, px, py, wx, wy);
                const c = depth < 3.2 ? (edgeColour(state, depth, wx, wy, base) || base) : base;
                data[i] = clamp(c[0]); data[i + 1] = clamp(c[1]); data[i + 2] = clamp(c[2]); data[i + 3] = 255;
            }
        }
        ctx.putImageData(image, 0, 0);
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
        soilCache.set(k, bitmap);
        return bitmap;
    }

    // a pit left by the shovel (depth 1-3): a dark hole with the earth piled up around it, hard-edged like the rest of the ground
    const pitCache = new Map();
    function pitTexture(depth) {
        if (pitCache.has(depth)) return pitCache.get(depth);
        const bitmap = new Bitmap(TILE, TILE), ctx = bitmap.context, image = ctx.createImageData(TILE, TILE), data = image.data;
        const rx = 8 + 3 * depth, ry = 5 + 2 * depth, cx = 24, cy = 25;
        for (let py = 0; py < TILE; py++) {
            for (let px = 0; px < TILE; px++) {
                const e = Math.pow((px - cx) / rx, 2) + Math.pow((py - cy) / ry, 2);
                const ring = Math.pow((px - cx + 1.5) / (rx + 4), 2) + Math.pow((py - cy + 1.5) / (ry + 3), 2);   // the heap is a little up and to the left
                const i = (py * TILE + px) * 4;
                let c = null;
                if (e <= 1) {
                    const shade = Math.max(0, Math.min(1, (py - (cy - ry)) / (2 * ry)));   // dark under the upper rim, lighter at the bottom of the hole
                    const inner = e < 0.5 ? 0 : 1;
                    c = [46 + 34 * shade + 14 * inner, 29 + 22 * shade + 9 * inner, 16 + 12 * shade + 5 * inner];
                } else if (ring <= 1) {
                    const crumb = ((px * 7 + py * 13) % 5 === 0) ? -22 : ((px * 3 + py * 5) % 4 === 0 ? 12 : 0);
                    const lit = (px < cx ? 10 : -6) + (py < cy ? 8 : -4);
                    c = [148 + crumb + lit, 104 + crumb + lit * 0.8, 64 + crumb * 0.7 + lit * 0.5];
                }
                if (!c) continue;
                data[i] = Math.max(0, Math.min(255, Math.round(c[0]))); data[i + 1] = Math.max(0, Math.min(255, Math.round(c[1]))); data[i + 2] = Math.max(0, Math.min(255, Math.round(c[2]))); data[i + 3] = 255;
            }
        }
        ctx.putImageData(image, 0, 0);
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
        pitCache.set(depth, bitmap);
        return bitmap;
    }

    // fence: a post with rails toward the neighbouring fences (N 1, E 2, S 4, W 8)
    const fenceCache = new Map();
    function fenceTexture(mask) {
        if (fenceCache.has(mask)) return fenceCache.get(mask);
        const bitmap = new Bitmap(TILE, TILE), ctx = bitmap.context;
        const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
        const OUT = "#2a1a10", LIGHT = "#b98a55", MID = "#8f6539", DARK = "#5f3f24";
        rect(14, 33, 20, 5, "rgba(0,0,0,0.22)");   // shadow
        if (mask & 8) { rect(0, 18, 24, 4, OUT); rect(0, 19, 24, 2, LIGHT); rect(0, 27, 24, 4, OUT); rect(0, 28, 24, 2, MID); }
        if (mask & 2) { rect(24, 18, 24, 4, OUT); rect(24, 19, 24, 2, LIGHT); rect(24, 27, 24, 4, OUT); rect(24, 28, 24, 2, MID); }
        if (mask & 1) { rect(21, 0, 6, 20, OUT); rect(22, 0, 4, 20, MID); rect(22, 0, 1, 20, LIGHT); }
        if (mask & 4) { rect(21, 28, 6, 20, OUT); rect(22, 28, 4, 20, MID); rect(22, 28, 1, 20, LIGHT); }
        rect(19, 12, 10, 26, OUT);                    // post
        rect(20, 13, 8, 24, MID);
        rect(20, 13, 3, 24, LIGHT);
        rect(26, 13, 2, 24, DARK);
        rect(20, 13, 8, 2, "#d4a870");                // cap
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
        fenceCache.set(mask, bitmap);
        return bitmap;
    }

    // ---- the ground layer: soil patches and crops (below the characters)
    function Sprite_FarmLayer() {
        this.initialize(...arguments);
    }
    Sprite_FarmLayer.prototype = Object.create(Sprite.prototype);
    Sprite_FarmLayer.prototype.constructor = Sprite_FarmLayer;

    Sprite_FarmLayer.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 1;   // above the ground tiles, below the characters
        this._entries = [];
        this._stamp = null;
        this._scrollKey = null;
    };

    Sprite_FarmLayer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const mapId = $gameMap.mapId();
        const stamp = mapId + ":" + farm().rev + ":" + today();
        if (stamp !== this._stamp) {
            this._stamp = stamp;
            this.rebuild(mapId);
            this._scrollKey = null;
        }
        const scrollKey = $gameMap.displayX() + "," + $gameMap.displayY();
        if (scrollKey !== this._scrollKey) {
            this._scrollKey = scrollKey;
            this.reposition();
        }
    };

    Sprite_FarmLayer.prototype.rebuild = function(mapId) {
        for (const e of this._entries) this.removeChild(e.sprite);
        this._entries = [];
        const plots = farm().plots[mapId] || {};
        // buildings stand on the natural ground: no soil patch (and no paving) under or behind them
        const covered = new Set();
        for (const b of farm().buildings[mapId] || []) for (const c of cellsOfGeo(geoOf(b), b.x, b.y)) covered.add(key(c.x, c.y));
        const has = (x, y) => !!plots[key(x, y)] && !covered.has(key(x, y));
        const crops = ImageManager.loadSystem("Farm_Crops");
        for (const k of Object.keys(plots)) {
            const [x, y] = k.split(",").map(Number), plot = plots[k];
            if (covered.has(k)) continue;
            let n = 0;
            [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8], [1, -1, 16], [1, 1, 32], [-1, 1, 64], [-1, -1, 128]].forEach(([dx, dy, bit]) => {
                if (has(x + dx, y + dy)) n |= bit;
            });
            const soil = new Sprite(soilTexture(plot.s, x, y, n));
            this._entries.push({ x, y, sprite: soil });
            this.addChild(soil);
            if (plot.dug) {
                const pit = new Sprite(pitTexture(plot.dug));
                this._entries.push({ x, y, sprite: pit });
                this.addChild(pit);
            }
            if (plot.crop) {
                const stage = cropStage(x, y, plot), crop = new Sprite(crops);
                crop.setFrame(stage * TILE, CROPS[plot.crop].row * TILE, TILE, TILE);
                this._entries.push({ x, y, sprite: crop, dy: CROP_LIFT });
                this.addChild(crop);
            }
        }
    };

    Sprite_FarmLayer.prototype.reposition = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const e of this._entries) {
            e.sprite.x = Math.round($gameMap.adjustX(e.x) * tw);
            e.sprite.y = Math.round($gameMap.adjustY(e.y) * th) + (e.dy || 0);
        }
    };

    // ---- the things on the ground: pixel-art pebbles, flax, berries, mushrooms and herbs, above the soil, below the characters
    const GATHER_ART = {
        // o outline, l light, m mid, d dark, s shadow (stones); plants use their own letters below
        stone: { colours: { o: "#2e2c30", l: "#c4c4b8", m: "#8c8e8a", d: "#5e6060", s: "rgba(10,8,4,0.32)" }, shapes: [
            ["...oooooo...", "..ollllmmo..", ".ollllmmmmo.", ".olllmmmmddo", ".ommmmmmdddo", "..ommmmddoo.", "...oooooooo.", ".sssssssss.."],
            ["..ooooooooo..", ".ollllmmmmmo.", "olllmmmmmmddo", "ommmmmmmdddoo", ".oommmddooo..", "..sssoooss.s."],
            ["..ooo.......", ".ollmo.oo...", "olllmmoolmo.", "ommmddolmmdo", ".oooddommdo.", "..sssoosooo."]] },
        fiber: { colours: { g: "#4f9a4a", G: "#78c064", b: "#7ea6ff", w: "#f4f4ff", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["..b...b....", ".bwb.bwb....", "..g...g..b..", ".gG..gG.bwb.", ".g...g...g..", ".g..gG...g..", "gG.gG.g.gG..", "gGggGgggGg..", ".ssssssssss."],
            [".b....b...", "bwb..bwb..", ".g....g.b.", ".gG..gG.wb", ".g....g..g", "gG.gGg.gGg", "gGgggGgGg.", ".sssssss.."]] },
        berries: { colours: { o: "#1f3a22", g: "#3f7a3a", G: "#5fa050", r: "#d24a52", p: "#7a3f8a", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["...oooooo...", "..oggGGggo..", ".ogGrgGgpGo.", ".oGgGgrGgGo.", ".ogprgGgGgo.", "..oGgGpgGo..", "...oooooo...", "..ssssssss.."]] },
        // mushrooms and berry bushes are pictures made with PixelLab (img/system): five mushrooms; the bush: 0 blue berries, 1 red berries, 2 picked bare, 3 winter bare
        mushroom: { images: ["Gather_Mushroom_0", "Gather_Mushroom_1", "Gather_Mushroom_2", "Gather_Mushroom_3", "Gather_Mushroom_4"] },
        bush: { images: ["Gather_Bush_0", "Gather_Bush_1", "Gather_Bush_2", "Gather_Bush_3"] },
        branch: { colours: { o: "#33241a", b: "#8a6238", l: "#bd8e58", d: "#5e3f24", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["........oo..", "...oo..ollo.", "..olloolbbo.", "..obbllbddo.", ".oolbbblloo.", "ollbdddbbllo", "obbdoooddbbo", "oddo...ooddo", ".oo......oo.", ".sssssssss.."],
            ["..o........o", ".olo.....ool", ".oblooooollb", "oodblllllbbd", "llllbbbbbbbo", "bbbbblbbdddo", "dddddbdbloo.", "ooooododbo..", ".....o.odo..", ".sssssssss.."]] },
        herb: { colours: { g: "#3f8a44", G: "#6ec062", y: "#f0cc4e", Y: "#ffe98a", s: "rgba(10,8,4,0.30)" }, shapes: [
            ["....y.y...", "...yYy.y..", "....g.....", ".g..g..g..", "gG.gg.gGg.", ".gGgGgGg..", "..gGgg....", "...gg.....", "..sssss..."]] }
    };
    const gatherBitmaps = {};
    function gatherBitmap(kind, variant) {
        if (GATHER_ART[kind].images) return ImageManager.loadSystem(GATHER_ART[kind].images[variant]);   // a picture from img/system
        const k = kind + variant;
        if (gatherBitmaps[k] && gatherBitmaps[k]._baseTexture) return gatherBitmaps[k];
        // plants are drawn twice as big as the pebbles: they have to be spotted at a glance
        const art = GATHER_ART[kind], rows = art.shapes[variant], sc = kind === "stone" ? 1 : 2, w = Math.max(...rows.map(r => r.length)), bitmap = new Bitmap(w * sc, rows.length * sc), ctx = bitmap.context;
        rows.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                if (row[x] === "." || !art.colours[row[x]]) continue;
                ctx.fillStyle = art.colours[row[x]];
                ctx.fillRect(x * sc, y * sc, sc, sc);
            }
        });
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
        bitmap.smooth = false;
        gatherBitmaps[k] = bitmap;
        return bitmap;
    }

    function Sprite_StoneLayer() {
        this.initialize(...arguments);
    }
    Sprite_StoneLayer.prototype = Object.create(Sprite.prototype);
    Sprite_StoneLayer.prototype.constructor = Sprite_StoneLayer;

    Sprite_StoneLayer.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 1.5;   // over the ground and the soil, under the characters
        this._entries = [];
        this._stamp = null;
        this._scrollKey = null;
    };

    Sprite_StoneLayer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const mapId = $gameMap.mapId(), stamp = mapId + ":" + stoneRev + ":" + today() + ":" + farm().rev;
        if (stamp !== this._stamp) {
            if (!this.rebuild()) return;   // the ground pictures are not loaded yet: try again next frame
            this._stamp = stamp;
            this._scrollKey = null;
        }
        const scrollKey = $gameMap.displayX() + "," + $gameMap.displayY();
        if (scrollKey !== this._scrollKey) {
            this._scrollKey = scrollKey;
            this.reposition();
        }
    };

    Sprite_StoneLayer.prototype.rebuild = function() {
        const found = [];
        for (let y = 0; y < $gameMap.height(); y++) {
            for (let x = 0; x < $gameMap.width(); x++) {
                if (!gatherKindOf(x, y)) continue;   // most tiles have nothing
                const spot = gatherSpot(x, y);
                if (spot === undefined) return false;
                const kind = spot && gatherAt(x, y);
                if (kind) found.push({ x, y, kind });
            }
        }
        for (const e of this._entries) this.removeChild(e.sprite);
        this._entries = [];
        for (const { x, y, kind } of found) {
            const shapes = GATHER_ART[kind].shapes || GATHER_ART[kind].images;
            let variant = Math.floor(hash2(x, y, 302) * shapes.length);
            if (kind === "mushroom") variant = Math.floor(hash2(x + 3 * (mushroomBirth(x, y) || 0), y, 302) * shapes.length);   // a new mushroom on the same tile may look different
            if (kind === "bush") variant = bushState(x, y) === "full" ? (hash2(x, y, 302) < 0.5 ? 0 : 1) : (seasonIndex(today()) === 3 ? 3 : 2);
            const bitmap = gatherBitmap(kind, variant);
            if (!bitmap.isReady()) return false;   // the picture is still loading: try again next frame
            const sprite = new Sprite(bitmap);
            this._entries.push(kind === "bush" ? {
                sprite,
                px: x * TILE + Math.floor((TILE - bitmap.width) / 2),
                py: y * TILE + TILE - bitmap.height - 1
            } : {
                sprite,
                px: x * TILE + 8 + Math.floor(hash2(x, y, 303) * Math.max(1, TILE - 16 - bitmap.width)),
                py: y * TILE + 14 + Math.floor(hash2(x, y, 304) * Math.max(1, TILE - 22 - bitmap.height))
            });
            this.addChild(sprite);
        }
        return true;
    };

    Sprite_StoneLayer.prototype.reposition = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), ox = $gameMap.displayX() * tw, oy = $gameMap.displayY() * th;
        for (const e of this._entries) {
            e.sprite.x = Math.round(e.px - ox);
            e.sprite.y = Math.round(e.py - oy);
        }
    };

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
        const cost = effectiveCost(mode.type).map(([id, n]) => "\\I[" + itemOf(id).iconIndex + "]\\C[" + (countOf(id) >= n ? 3 : 10) + "]" + countOf(id) + "/" + n + "\\C[0]").join("   ");
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

    // the grid and the see-through building
    function Sprite_BuildPlacer(tilemap) {
        this.initialize(tilemap);
    }
    Sprite_BuildPlacer.prototype = Object.create(Sprite.prototype);
    Sprite_BuildPlacer.prototype.constructor = Sprite_BuildPlacer;

    Sprite_BuildPlacer.prototype.initialize = function(tilemap) {
        Sprite.prototype.initialize.call(this, new Bitmap(Graphics.width, Graphics.height));
        this.z = 2.4;   // over the ground, under the characters
        this.visible = false;
        this._age = 0;
        this._key = null;
        this._ghost = new Sprite();
        this._ghost.anchor.x = 0.5;
        this._ghost.anchor.y = 1;
        this._ghost.z = 3;   // sorted with the characters, like a real building
        this._ghost.visible = false;
        tilemap.addChild(this._ghost);
    };

    Sprite_BuildPlacer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const mode = $gameTemp._buildMode;
        this.visible = this._ghost.visible = !!mode;
        if (!mode) { this._key = null; return; }
        this._age++;
        const key = [mode.type, mode.x, mode.y, $gameMap.displayX(), $gameMap.displayY(), farm().rev, $gamePlayer.x, $gamePlayer.y, missingMaterials(mode.type).length, mode.flip].join();
        if (key !== this._key) {
            this._key = key;
            this.redraw(mode);
        }
        this._ghost.opacity = Math.round(255 * (0.66 + 0.16 * Math.sin(this._age * 0.14)));
    };

    Sprite_BuildPlacer.prototype.redraw = function(mode) {
        const def = mode.flip ? mirrorGeo(BUILDINGS[mode.type]) : BUILDINGS[mode.type], tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const bmp = this.bitmap, ctx = bmp.context;
        bmp.clear();
        // grid: every tile within reach of the player
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        for (let ty = $gamePlayer.y - BUILD_RANGE; ty <= $gamePlayer.y + BUILD_RANGE; ty++) {
            for (let tx = $gamePlayer.x - BUILD_RANGE; tx <= $gamePlayer.x + BUILD_RANGE; tx++) {
                if (!$gameMap.isValid(tx, ty)) continue;
                ctx.strokeRect(Math.round($gameMap.adjustX(tx) * tw) + 0.5, Math.round($gameMap.adjustY(ty) * th) + 0.5, tw - 1, th - 1);
            }
        }
        // the tiles the building would cover: green where it fits, red where it does not
        const far = placementProblem(mode.type, mode.x, mode.y, mode.flip) === "Za daleko od ciebie.";
        for (const t of tilesOfBuilding(mode.type, mode.x, mode.y)) {
            const bad = far || !!tileWhyNot(t.x, t.y), sx = Math.round($gameMap.adjustX(t.x) * tw), sy = Math.round($gameMap.adjustY(t.y) * th);
            const open = def.yard && !isSolidCell(def, t.i, t.j) && !(t.j === 0);   // the open ground inside a yard is only tinted; the fence and the hut are marked strongly
            ctx.fillStyle = bad ? "rgba(235,70,60," + (open ? 0.2 : 0.42) + ")" : "rgba(90,220,110," + (open ? 0.16 : 0.38) + ")";
            ctx.fillRect(sx, sy, tw, th);
            ctx.strokeStyle = bad ? "rgba(255,150,140,0.95)" : "rgba(190,255,200,0.95)";
            if (!open) ctx.strokeRect(sx + 1.5, sy + 1.5, tw - 3, th - 3);
        }
        bmp._baseTexture.update();
        // the picture of the building, in place like a real one
        let texture;
        if (mode.type === "fence") {
            const fences = new Set((farm().buildings[$gameMap.mapId()] || []).filter(b => b.type === "fence").map(b => key(b.x, b.y)));
            const mask = (fences.has(key(mode.x, mode.y - 1)) ? 1 : 0) | (fences.has(key(mode.x + 1, mode.y)) ? 2 : 0) |
                (fences.has(key(mode.x, mode.y + 1)) ? 4 : 0) | (fences.has(key(mode.x - 1, mode.y)) ? 8 : 0);
            texture = fenceTexture(mask);
        } else {
            texture = ImageManager.loadSystem(def.image);
        }
        this._ghost.bitmap = texture;
        const hut = def.yard ? def.yard.hut : null;   // a yard shows its hut where it will stand
        this._ghost.x = Math.round(($gameMap.adjustX(mode.x) + (hut ? hut.dx + hut.w / 2 : def.w / 2)) * tw);
        this._ghost.y = Math.round(($gameMap.adjustY(mode.y - (hut ? hut.dy : 0)) + 1) * th) - 1;
        this._ghost.scale.x = mode.flip ? -1 : 1;
        const problem = placementProblem(mode.type, mode.x, mode.y, mode.flip);
        this._ghost.setBlendColor(problem ? [255, 70, 60, 110] : [0, 0, 0, 0]);
    };

    // ---- campfire glow: a soft additive light, faint by day and strong at night.
    // It lives on the spriteset itself (not in the tilemap), because the day/night
    // tone filter only covers the base sprite - so the fire is not dimmed with the rest.
    const ADD_BLEND = typeof PIXI !== "undefined" && PIXI.BLEND_MODES ? PIXI.BLEND_MODES.ADD : 1;
    // 0 by day .. 1 at night (dusk 17-20, dawn 5-8)
    function nightAmount() {
        if (typeof $gameSystem.dayNightHour !== "function") return 0;
        const h = $gameSystem.dayNightHour();
        if (h >= 20 || h < 5) return 1;
        if (h >= 17) return (h - 17) / 3;
        if (h < 8) return 1 - (h - 5) / 3;
        return 0;
    }
    function fireGlowAlpha(frame) {
        const flicker = 0.78 + 0.14 * Math.sin(frame * 0.13) + 0.08 * Math.sin(frame * 0.37 + 1.3);
        return (0.1 + 0.68 * nightAmount()) * flicker;
    }
    let glowBitmap = null;
    function fireGlowBitmap() {
        if (glowBitmap) return glowBitmap;
        const size = 192, bitmap = new Bitmap(size, size), ctx = bitmap.context;
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, "rgba(255,172,72,0.75)");
        gradient.addColorStop(0.35, "rgba(255,122,40,0.32)");
        gradient.addColorStop(1, "rgba(255,90,20,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
        glowBitmap = bitmap;
        return bitmap;
    }

    // a pixel-art puff of smoke (2 px cells, light towards the upper left); faded and scaled by the sprite
    let puffBitmap = null;
    function puffTexture() {
        if (puffBitmap) return puffBitmap;
        const S = 20, bitmap = new Bitmap(S, S), ctx = bitmap.context;
        const discs = [[10, 11, 6.5], [6, 9, 4], [14, 9, 4.5], [10, 6, 4]];
        for (let py = 0; py < S; py += 2) {
            for (let px = 0; px < S; px += 2) {
                const cx = px + 1, cy = py + 1;
                if (!discs.some(([x, y, r]) => Math.hypot(cx - x, cy - y) <= r)) continue;
                ctx.fillStyle = cx + cy > 24 ? "#a4a9b0" : "#d3d7dc";
                ctx.fillRect(px, py, 2, 2);
            }
        }
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
        puffBitmap = bitmap;
        return bitmap;
    }
    const PUFFS = 4;
    const PUFF_PERIOD = 150;   // frames for a puff to rise and fade

    // A fire drawn in pixel-art steps (2 px cells). The ring is an ellipse seen from above, so the tongues of flame are rooted all over it
    // (the back ones a little higher on the screen, the front ones lower), each has a rounded foot, a wide belly and a pointed tip, and
    // they stand on a bed of glowing embers with a dithered edge - so there is no flat line at the bottom. FLAME_FRAMES frames make a
    // seamless loop (every tongue moves a whole number of times per loop). size scales the whole fire.
    const FLAME_FRAMES = 8;
    // x and y (px, y positive = towards the viewer) of the root, height, half width, cycles per loop, phase
    const FLAME_TONGUES = [
        [0, -8, 18, 6, 2, 2.4], [-13, -4, 13, 5, 1, 4.4], [13, -4, 14, 5, 3, 5.5], [0, -3, 30, 7, 1, 0.0], [-6, 0, 22, 6, 2, 1.9],
        [6, 0, 24, 6, 2, 3.1], [-4, 3, 17, 5, 1, 5.1], [5, 3, 15, 5, 3, 1.3], [-10, 5, 12, 5, 3, 0.7], [10, 5, 11, 5, 1, 2.9], [0, 7, 9, 6, 2, 4.0]
    ].sort((a, b) => a[1] - b[1]);   // back to front
    const FLAME_LAYERS = [["#b8321a", 1, 0], ["#ee6a1a", 0.82, 1], ["#ffb43a", 0.62, 2], ["#fff1a6", 0.36, 3]];
    const HANG_SCALE = 0.75;   // the icon of the hanging food
    const ROPE_LENGTH = 12;
    // the short rope the food hangs on (2 px wide, 6 x 12 bitmap, its lower end shifted sideways by o px to follow the swaying food)
    const ropeCache = {};
    function ropeBitmap(o) {
        if (ropeCache[o]) return ropeCache[o];
        const bitmap = new Bitmap(6, ROPE_LENGTH), ctx = bitmap.context;
        for (let y = 0; y < ROPE_LENGTH; y++) {
            const cx = 3 + Math.round(o * (y / (ROPE_LENGTH - 1)));
            if (y < 2) { ctx.fillStyle = "#d2b078"; ctx.fillRect(cx - 1, y, 2, 1); }   // the loop over the hook
            else if (y >= ROPE_LENGTH - 2) { ctx.fillStyle = "#5a3f22"; ctx.fillRect(cx - 2, y, 4, 1); }   // the knot
            else { ctx.fillStyle = "#8a6a3c"; ctx.fillRect(cx - 1, y, 1, 1); ctx.fillStyle = "#6a4c28"; ctx.fillRect(cx, y, 1, 1); }
        }
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
        ropeCache[o] = bitmap;
        return bitmap;
    }
    const flameCache = {};
    const flameHeight = k => Math.round(52 * k);
    const flameBase = k => Math.round(flameHeight(k) - 15 * k);   // row of the bitmap where the middle of the fire's foot is
    function flameFrames(k) {
        if (flameCache[k]) return flameCache[k];
        const W = Math.round(60 * k) + (Math.round(60 * k) % 2), H = flameHeight(k), y0 = flameBase(k), frames = [];
        const foot = p => p < 0.16 ? 0.5 + 0.5 * (p / 0.16) : Math.pow(1 - (p - 0.16) / 0.84, 1.25);
        for (let f = 0; f < FLAME_FRAMES; f++) {
            const bitmap = new Bitmap(W, H), ctx = bitmap.context, phase = (f / FLAME_FRAMES) * Math.PI * 2;
            // the bed of embers: an ellipse of 2 px cells that fades out into the ring with a shimmering, dithered edge
            const rx = 19 * k, ry = 7.5 * k;
            for (let cy = Math.floor(-ry - 2); cy <= ry + 2; cy += 2) {
                for (let cx = Math.floor(-rx - 2); cx <= rx + 2; cx += 2) {
                    const d = Math.hypot(cx / rx, cy / ry);
                    if (d > 1) continue;
                    const noise = (((cx + 40) * 7 + (cy + 40) * 13 + f * 5) % 11) / 11;
                    if (noise < Math.pow(d, 2.2) - 0.05) continue;
                    ctx.fillStyle = d < 0.42 ? "#ffb43a" : d < 0.72 ? "#ee6a1a" : "#b8321a";
                    ctx.fillRect(Math.round(W / 2 + cx - 1), Math.round(y0 + cy * 0.8), 2, 2);
                }
            }
            for (const [color, hk, inset] of FLAME_LAYERS) {
                ctx.fillStyle = color;
                for (const [tx, ty, th, hw, cycles, ph] of FLAME_TONGUES) {
                    if (hk < 0.5 && th < 16) continue;   // only the tall tongues get the pale core
                    const flick = 0.8 + 0.2 * Math.sin(phase * cycles + ph);
                    const height = Math.max(2, Math.round(th * k * hk * flick / 2) * 2);
                    const half = Math.max(1, hw * k * (0.55 + 0.45 * hk) - inset * 0.6 * k);
                    const baseY = Math.round(y0 + ty * k * 0.8);
                    for (let y = 0; y < height; y += 2) {
                        const p = y / height;
                        const w = Math.max(2, Math.round(half * foot(p)) * 2);
                        const sway = Math.round(Math.sin(phase * cycles + ph + y * 0.22) * (0.6 + p * 2.2) / 2) * 2;
                        ctx.fillRect(Math.round(W / 2 + tx * k + sway - w / 2), baseY - y - 2, w, 2);
                    }
                }
            }
            // a few sparks drifting up
            ctx.fillStyle = "#ffd35a";
            for (let n = 0; n < 4; n++) {
                const rise = (f * 3 + n * 7) % 24;
                ctx.fillRect(Math.round(W / 2 + (((n * 11 + f * 3) % 26) - 13) * k), Math.round(y0 - 22 * k - rise * k), 2, 2);
            }
            if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
            frames.push(bitmap);
        }
        flameCache[k] = frames;
        return frames;
    }

    // ---- the night: its own layer (a dark picture with holes), so that a fire really lights up the ground around it, in the
    // real colours of the ground, and the rest stays truly dark. It replaces the dark screen tone of DayNightCycle.js.
    const NIGHT_ALPHA = 0.9;
    function Sprite_NightLight() {
        this.initialize(...arguments);
    }
    Sprite_NightLight.prototype = Object.create(Sprite.prototype);
    Sprite_NightLight.prototype.constructor = Sprite_NightLight;
    Sprite_NightLight.prototype.initialize = function(spriteset) {
        const w = Math.ceil(Graphics.width / 2), h = Math.ceil(Graphics.height / 2);   // half the resolution: cheaper, and the edge of the light is soft
        Sprite.prototype.initialize.call(this, new Bitmap(w, h));
        this.bitmap.smooth = true;
        this.scale.set(2, 2);
        this.visible = false;
        this._spriteset = spriteset;
        this._age = 0;
    };
    // what gives light on this map: every fire, and the stations that have a job burning
    Sprite_NightLight.prototype.lights = function() {
        const out = [], set = this._spriteset._buildingSprites;
        for (const e of set ? set._sprites : []) {
            if (e.b.site) continue;
            const def = geoOf(e.b);
            if (def.fire) out.push({ x: e.sprite.x, y: e.sprite.y - def.fire.y - 6, r: def.fire.light || 300, i: 1, id: e.b.id });
            else if (def.smokes && e.b.job && !jobReady(e.b)) out.push({ x: e.sprite.x + (def.ventX || 0), y: e.sprite.y - Math.max(20, (def.vent || 40) - 30), r: def.light || 190, i: 0.85, id: e.b.id });
        }
        return out;
    };
    Sprite_NightLight.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this._age++;
        const dark = $gameSystem && $gameSystem._dayNightTinting && typeof $gameSystem.dayNightHour === "function" ? nightAmount() : 0;
        this.visible = dark > 0.01;
        if (!this.visible) return;
        const bmp = this.bitmap, ctx = bmp.context, w = bmp.width, h = bmp.height;
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(3,7,24," + (NIGHT_ALPHA * dark).toFixed(3) + ")";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "destination-out";
        for (const l of this.lights()) {
            const flick = 0.93 + 0.05 * Math.sin(this._age * 0.21 + l.id * 1.7) + 0.03 * Math.sin(this._age * 0.53 + l.id);
            const x = l.x / 2, y = l.y / 2, r = (l.r / 2) * (0.97 + 0.03 * flick);
            if (x + r < 0 || y + r < 0 || x - r > w || y - r > h) continue;
            const a = l.i * flick, g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, "rgba(0,0,0," + a.toFixed(3) + ")");
            g.addColorStop(0.2, "rgba(0,0,0," + (a * 0.93).toFixed(3) + ")");
            g.addColorStop(0.45, "rgba(0,0,0," + (a * 0.62).toFixed(3) + ")");
            g.addColorStop(0.72, "rgba(0,0,0," + (a * 0.25).toFixed(3) + ")");
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
        ctx.globalCompositeOperation = "source-over";
        if (bmp._baseTexture && bmp._baseTexture.update) bmp._baseTexture.update();
    };

    // a soft ground shadow, stretched under each building so that it sits on the ground instead of floating
    let shadowBitmap = null;
    function shadowTexture() {
        if (shadowBitmap) return shadowBitmap;
        const w = 96, h = 32, bitmap = new Bitmap(w, h), ctx = bitmap.context;
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(1, h / w);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
        g.addColorStop(0, "rgba(10,8,4,0.46)");
        g.addColorStop(0.6, "rgba(10,8,4,0.30)");
        g.addColorStop(1, "rgba(10,8,4,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
        shadowBitmap = bitmap;
        return bitmap;
    }

    // the marked ground of a building site: scuffed earth, a dashed border and a stake in every corner
    const siteFootCache = new Map();
    function siteFootTexture(w, h) {
        h = h || 1;
        const ck = w + "x" + h;
        if (siteFootCache.has(ck)) return siteFootCache.get(ck);
        const W = w * TILE, H = h * TILE, bitmap = new Bitmap(W, H), ctx = bitmap.context;
        ctx.fillStyle = "rgba(96,66,40,0.30)";
        ctx.fillRect(3, 3, W - 6, H - 6);
        ctx.fillStyle = "rgba(240,214,150,0.95)";   // dashes along all four sides
        for (let x = 8; x < W - 8; x += 10) { ctx.fillRect(x, 3, 5, 2); ctx.fillRect(x, H - 5, 5, 2); }
        for (let y = 8; y < H - 8; y += 10) { ctx.fillRect(3, y, 2, 5); ctx.fillRect(W - 5, y, 2, 5); }
        const stake = (sx, sy) => {   // a little wooden post with a lighter top
            ctx.fillStyle = "#2a1a10"; ctx.fillRect(sx - 1, sy - 1, 7, 15);
            ctx.fillStyle = "#8f6539"; ctx.fillRect(sx, sy, 5, 13);
            ctx.fillStyle = "#c79b62"; ctx.fillRect(sx, sy, 2, 13);
            ctx.fillStyle = "#e6c48a"; ctx.fillRect(sx, sy, 5, 2);
        };
        stake(1, 1); stake(W - 6, 1); stake(1, H - 14); stake(W - 6, H - 14);
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
        siteFootCache.set(ck, bitmap);
        return bitmap;
    }

    // ---- buildings: sprites placed straight in the tilemap so that they sort with the characters
    function BuildingSprites(tilemap, glowLayer) {
        this._tilemap = tilemap;
        this._glowLayer = glowLayer;
        this._age = 0;
        this._sprites = [];
        this._stamp = null;
        this._scrollKey = null;
    }
    BuildingSprites.prototype.update = function() {
        this._age++;
        const mapId = $gameMap.mapId();
        const stamp = mapId + ":" + farm().rev;
        if (stamp !== this._stamp) {
            this._stamp = stamp;
            this.rebuild(mapId);
            this._scrollKey = null;
        }
        const scrollKey = $gameMap.displayX() + "," + $gameMap.displayY();
        if (scrollKey !== this._scrollKey) {
            this._scrollKey = scrollKey;
            this.reposition();
        }
        for (const e of this._sprites) {
            if (e.glow && (e.b.type === "campfire" || (geoOf(e.b).fire || {}).smoke)) e.glow.alpha = fireGlowAlpha(this._age + e.b.id * 17);   // a fire that is always lit
            if (e.flame) this.updateFlame(e);
            if (e.meatRaw) this.updateHang(e);
            if (e.badge) this.updateStation(e);
            if (e.solid) this.updateSite(e);
            if (geoOf(e.b).imageFull && (e.filled === undefined || this._age % 15 === 0)) this.updateBucket(e);
        }
    };
    // the bucket shows water in it once a portion has been collected
    BuildingSprites.prototype.updateBucket = function(e) {
        const def = geoOf(e.b), full = !e.b.site && bucketUnits(e.b) >= 1;
        if (e.filled === full) return;
        e.filled = full;
        e.sprite.bitmap = ImageManager.loadSystem(full ? def.imageFull : def.image);
    };
    // the built part of a site grows from the ground up, one step for every blow
    BuildingSprites.prototype.updateSite = function(e) {
        const site = e.b.site, bitmap = e.solid.bitmap;
        if (!site || !bitmap || !bitmap.isReady() || bitmap.height <= 0) return;
        const done = Math.round(bitmap.height * Math.min(1, site.done / site.need));
        if (e.shown === done) return;
        e.shown = done;
        e.solid.visible = done > 0;
        if (done > 0) e.solid.setFrame(0, bitmap.height - done, bitmap.width, done);
    };
    // a crafting station shows its state: the product's icon when it is ready, plus
    // smoke and a glow while a job burns, for buildings marked "smokes" (a fire/kiln)
    // the food on the tripod: shown for as long as there is food on the hook (also when it is done, until it is collected), sways a
    // little, and is roasted more and more
    BuildingSprites.prototype.updateHang = function(e) {
        const b = e.b, cooking = !!b.job;
        e.meatRaw.visible = e.meatDone.visible = e.rope.visible = cooking;
        if (!cooking) { e.hangKey = null; return; }
        if (e.hangKey !== b.job.recipe) {
            e.hangKey = b.job.recipe;
            const r = recipeOf(b, b.job.recipe), set = (sprite, id) => {
                const idx = itemOf(id).iconIndex;
                sprite.setFrame((idx % 16) * 32, Math.floor(idx / 16) * 32, 32, 32);
            };
            set(e.meatRaw, r ? r.inputs[0][0] : b.job.out[0]);
            set(e.meatDone, b.job.out[0]);
        }
        const def = geoOf(b), progress = Math.max(0, Math.min(1, 1 - jobHoursLeft(b) / Math.max(0.01, b.job.hours)));
        e.meatDone.alpha = progress;
        const sway = Math.round(Math.sin(this._age / 26 + b.id) * 1.5);
        e.meatRaw.x = e.meatDone.x = e.sprite.x + (def.hang.x || 0) + sway;
        e.rope.x = e.sprite.x + (def.hang.x || 0);
        if (e.ropeSway !== sway) {
            e.ropeSway = sway;
            e.rope.bitmap = ropeBitmap(sway);
        }
    };
    // the flames flicker through their frames; the smoke of a campfire never stops
    BuildingSprites.prototype.updateFlame = function(e) {
        const k = geoOf(e.b).fire.size || 1, frames = flameFrames(k), i = Math.floor((this._age + e.b.id * 3) / 5) % frames.length;
        if (e.flameFrame !== i) {
            e.flameFrame = i;
            e.flame.bitmap = frames[i];
        }
    };
    BuildingSprites.prototype.updateStation = function(e) {
        const b = e.b, def0 = geoOf(b), ready = jobReady(b), cooking = !!b.job && !ready, burning = cooking || !!(def0.fire && def0.fire.smoke);
        if (e.puffs) {
            e.puffs.forEach((p, i) => {
                p.visible = burning;
                if (!burning) return;
                const t = ((this._age + i * (PUFF_PERIOD / PUFFS) + b.id * 13) % PUFF_PERIOD) / PUFF_PERIOD;
                const g = geoOf(b);
                p.x = e.sprite.x + (g.ventX || 0) + Math.sin(t * 5 + i * 1.7) * 5 + t * 9;
                p.y = e.sprite.y - (g.vent || 40) - t * 44;
                p.alpha = Math.min(1, t / 0.15) * (1 - t) * 0.6;
                p.scale.x = p.scale.y = 0.55 + t * 0.9;
            });
        }
        if (e.glow && b.type !== "campfire" && !(def0.fire && def0.fire.smoke)) e.glow.alpha = fireGlowAlpha(this._age + b.id * 17) * (def0.fire ? (cooking ? 0.75 : 0.45) : burning ? 0.55 : 0);
        e.badge.visible = ready;
        if (ready) {
            const idx = itemOf(b.job.out[0]).iconIndex, height = (e.sprite.bitmap && e.sprite.bitmap.height) || e.height;
            e.badge.setFrame((idx % 16) * 32, Math.floor(idx / 16) * 32, 32, 32);
            e.badge.y = e.sprite.y - height - 4 + Math.round(Math.sin(this._age * 0.08) * 3);
        }
    };
    BuildingSprites.prototype.rebuild = function(mapId) {
        this.destroy();
        const list = farm().buildings[mapId] || [];
        const fences = new Set(list.filter(b => b.type === "fence").map(b => key(b.x, b.y)));
        for (const b of list) {
            const def = geoOf(b);
            if (!BUILDINGS[b.type]) continue;
            let bitmap;
            if (b.type === "fence") {
                const mask = (fences.has(key(b.x, b.y - 1)) ? 1 : 0) | (fences.has(key(b.x + 1, b.y)) ? 2 : 0) |
                    (fences.has(key(b.x, b.y + 1)) ? 4 : 0) | (fences.has(key(b.x - 1, b.y)) ? 8 : 0);
                bitmap = fenceTexture(mask);
            } else {
                bitmap = ImageManager.loadSystem(def.image);
            }
            const sprite = new Sprite(bitmap);
            sprite.anchor.x = 0.5;
            sprite.anchor.y = 1;
            sprite.z = 3;
            if (def.flipped) sprite.scale.x = -1;   // put down mirrored
            let shadow = null, solid = null, foot = null;
            if (b.site) {
                sprite.opacity = 85;   // the blueprint of the whole building
                solid = new Sprite(bitmap);   // what has been built so far (frame set in updateSite)
                solid.anchor.x = 0.5;
                solid.anchor.y = 1;
                solid.z = 3;
                if (def.flipped) solid.scale.x = -1;
                solid.visible = false;
                this._tilemap.addChild(solid);
                foot = new Sprite(siteFootTexture(def.w, def.h));
                foot.z = 2;
                this._tilemap.addChild(foot);
            } else if (b.type !== "fence") {   // the fence texture has its own
                shadow = new Sprite(shadowTexture());
                shadow.anchor.x = 0.5;
                shadow.anchor.y = 0.5;
                shadow.z = 2;
                const hutW = def.yard ? def.yard.hut.w : def.w;
                shadow.scale.x = (hutW * TILE * 1.02) / 96;
                shadow.scale.y = (def.yard ? def.yard.hut.h : (def.h || 1)) * (hutW > 1 ? 1.1 : 0.8);
                this._tilemap.addChild(shadow);
            }
            this._tilemap.addChild(sprite);
            const entry = { b, sprite, shadow, solid, foot, glow: null, puffs: null, badge: null, height: 64, fences: null, flame: null, meatRaw: null, meatDone: null, rope: null };
            if (def.yard && !b.site) {   // the fence: a post with rails toward the neighbouring posts, all around, but the gate
                entry.fences = [];
                for (const c of cellsOfGeo(def, b.x, b.y)) {
                    if (!onRing(def, c.i, c.j) || (c.j === 0 && c.i === def.yard.gate)) continue;
                    const mask = (onRing(def, c.i, c.j + 1) ? 1 : 0) | (onRing(def, c.i + 1, c.j) ? 2 : 0) | (onRing(def, c.i, c.j - 1) ? 4 : 0) | (onRing(def, c.i - 1, c.j) ? 8 : 0);
                    const post = new Sprite(fenceTexture(mask));
                    post.anchor.x = 0.5;
                    post.anchor.y = 1;
                    post.z = 3;
                    this._tilemap.addChild(post);
                    entry.fences.push({ sprite: post, x: c.x, y: c.y });
                }
            }
            if (!b.site && (b.type === "campfire" || (def.fire && def.fire.smoke) || (def.recipes && def.smokes))) {
                entry.glow = new Sprite(fireGlowBitmap());
                entry.glow.anchor.x = 0.5;
                entry.glow.anchor.y = 0.5;
                entry.glow.blendMode = ADD_BLEND;
                entry.glow.alpha = def.fire && def.fire.smoke ? fireGlowAlpha(this._age) : 0;
                entry.glow.scale.x = entry.glow.scale.y = def.fire && def.fire.glow ? def.fire.glow : def.recipes ? 0.6 : 1;
                this._glowLayer.addChild(entry.glow);
            }
            if (!b.site && def.fire) {   // animated flames over the embers of the picture, sorted right after the building itself
                const flame = new Sprite(flameFrames(def.fire.size || 1)[0]);
                flame.anchor.x = 0.5;
                flame.anchor.y = (flameBase(def.fire.size || 1) + def.fire.y) / flameHeight(def.fire.size || 1);   // the middle of the foot is fire.y above the picture's foot
                flame.z = 3;
                this._tilemap.addChild(flame);
                entry.flame = flame;
            }
            if (!b.site && def.hang) {   // the food hanging from the rope while it roasts: the icon of the raw food, and over it the roasted one fading in
                const icon = () => {
                    const s = new Sprite(ImageManager.loadSystem("IconSet"));
                    s.setFrame(0, 0, 32, 32);
                    s.anchor.x = 0.5;
                    s.anchor.y = def.hang.y / (32 * HANG_SCALE);   // the top of the icon is def.hang.y above the foot of the picture
                    s.scale.set(HANG_SCALE);
                    s.z = 3;
                    s.visible = false;
                    this._tilemap.addChild(s);
                    return s;
                };
                const rope = new Sprite(ropeBitmap(0));
                rope.anchor.x = 0.5;
                rope.anchor.y = def.hang.rope / ROPE_LENGTH;   // the top of the rope is def.hang.rope above the foot of the picture
                rope.z = 3;
                rope.visible = false;
                this._tilemap.addChild(rope);
                entry.rope = rope;
                entry.meatRaw = icon();   // after the rope: the food is drawn over its lower end
                entry.meatDone = icon();
            }
            if (!b.site && def.recipes && (def.smokes || (def.fire && def.fire.smoke))) {
                entry.puffs = [];
                for (let i = 0; i < PUFFS; i++) {
                    const puff = new Sprite(puffTexture());
                    puff.anchor.x = 0.5;
                    puff.anchor.y = 0.5;
                    puff.z = 4;
                    puff.visible = false;
                    this._tilemap.addChild(puff);
                    entry.puffs.push(puff);
                }
            }
            if (!b.site && def.recipes) {
                const icon = new Sprite(ImageManager.loadSystem("IconSet"));   // the product waiting to be collected (frame set in updateStation)
                icon.setFrame(0, 0, 32, 32);
                icon.anchor.x = 0.5;
                icon.anchor.y = 1;
                icon.z = 5;
                icon.visible = false;
                this._tilemap.addChild(icon);
                entry.badge = icon;
            }
            this._sprites.push(entry);
        }
    };
    BuildingSprites.prototype.reposition = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const { b, sprite, shadow, solid, foot, glow, badge, fences, flame, meatRaw, meatDone, rope } of this._sprites) {
            const def = geoOf(b), hut = def.yard ? def.yard.hut : null;
            sprite.x = Math.round(($gameMap.adjustX(b.x) + (hut ? hut.dx + hut.w / 2 : def.w / 2)) * tw);
            sprite.y = Math.round(($gameMap.adjustY(b.y - (hut ? hut.dy : 0)) + 1) * th) - 1;
            for (const f of fences || []) {
                f.sprite.x = Math.round(($gameMap.adjustX(f.x) + 0.5) * tw);
                f.sprite.y = Math.round(($gameMap.adjustY(f.y) + 1) * th) - 1;
            }
            if (solid) {
                solid.x = sprite.x;
                solid.y = sprite.y;
            }
            if (foot) {
                foot.x = Math.round($gameMap.adjustX(b.x) * tw);
                foot.y = Math.round($gameMap.adjustY(b.y - (def.h || 1) + 1) * th);
            }
            if (shadow) {
                shadow.x = sprite.x;
                shadow.y = sprite.y - 9;
            }
            if (glow) {
                glow.x = sprite.x + (def.fire ? 0 : def.ventX || 0);
                glow.y = sprite.y - (def.fire ? def.fire.y + 10 : def.vent ? def.vent - 2 : 22);   // on the flames / the vent, above the foot of the sprite
            }
            if (flame) {
                flame.x = sprite.x;
                flame.y = sprite.y;
            }
            for (const meat of [meatRaw, meatDone, rope]) if (meat) meat.y = sprite.y;
            if (badge) badge.x = sprite.x;
        }
    };
    BuildingSprites.prototype.destroy = function() {
        for (const s of this._sprites) {
            this._tilemap.removeChild(s.sprite);
            if (s.shadow) this._tilemap.removeChild(s.shadow);
            if (s.solid) this._tilemap.removeChild(s.solid);
            if (s.foot) this._tilemap.removeChild(s.foot);
            if (s.glow) this._glowLayer.removeChild(s.glow);
            if (s.flame) this._tilemap.removeChild(s.flame);
            if (s.rope) this._tilemap.removeChild(s.rope);
            if (s.meatRaw) this._tilemap.removeChild(s.meatRaw);
            if (s.meatDone) this._tilemap.removeChild(s.meatDone);
            if (s.badge) this._tilemap.removeChild(s.badge);
            for (const p of s.puffs || []) this._tilemap.removeChild(p);
            for (const f of s.fences || []) this._tilemap.removeChild(f.sprite);
        }
        this._sprites = [];
    };

    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this._farmLayer = new Sprite_FarmLayer();
        this._tilemap.addChild(this._farmLayer);
        this._stoneLayer = new Sprite_StoneLayer();
        this._tilemap.addChild(this._stoneLayer);
        this._buildPlacer = new Sprite_BuildPlacer(this._tilemap);
        this._tilemap.addChild(this._buildPlacer);
        this._nightLight = new Sprite_NightLight(this);   // over the world, under the warm glow of the fires and the interface
        this.addChild(this._nightLight);
        this._farmGlowLayer = new Sprite();
        this.addChild(this._farmGlowLayer);
        this._buildingSprites = new BuildingSprites(this._tilemap, this._farmGlowLayer);
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        if (this._buildingSprites) this._buildingSprites.update();
    };

    // for events, other plugins and tests
    window.Farming = {
        openBuildKeyMenu, openFoodKeyMenu, foodFacts, whyNotEat,
        bushState, bushSolid, mushroomBirth, mushroomChance, gatherKindOf, BUSH_SHARE, MUSHROOM_POOL, MUSHROOM_LIFE, claimGround, releaseGround, effectiveCost, bucketUnits, bucketSync, takeBucketWater, bucketFor, rainHoursBetween, BUCKET_REACH,
        HUT_MAP, HUT_ROOM, hutOf, hutDoorAt, isHutInterior, hutShutsIn, hutSanitize, enterHut, leaveHut,
        upgradeBuilding, roomFor, fillSkin, geoOf, cellsOfGeo, isSolidCell, yardInterior, solidAt, CROPS, BUILDINGS, plotAt, buildingAt, menuFor, isSoilTile, groundIsSoil, naturalFarmland, rake, till, plant, harvest, uproot, build, demolish, collect, rest,
        groundInfoAt, hasObjectTile, cropStage, isRipe, daysLeft, readyProduce, whyNotBuild, soilTexture, fenceTexture, growthRate, nightAmount, fireGlowAlpha,
        dig, startJob, collectJob, jobReady, jobHoursLeft, clockHours, demolishBlock, pitchInstant, packUp, sleepInTent, wakeHour, putInChest, takeFromChest, isFood, ownedOutput,
        chestStacks, chestKinds, chestHolds, packStacks, putInChest, takeFromChest, whyNotMove, openChest, Scene_Chest, Window_ChestList,
        water, wateredRecently, seasonIndex, seasonOf, SEASON_NAMES, ITEM,
        stoneAt, stoneSpot, pickStone, gatherAt, gatherSpot, pickGather, isWaterTile, waterMenu, fillCan, drink, goFishing, rainWater, canCharges, craftManual, HAND_RECIPES, startPlacement, placementProblem, tileWhyNot, placeSite, strikeSite, cancelSite
    };
})();
