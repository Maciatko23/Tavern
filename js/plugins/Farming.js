//=============================================================================
// Farming.js
//=============================================================================
// Farming and building. Split in five (2026-09-29): this file holds the parameters, the tables (from Farming_Data.js), the saved
// state, the seasons, the buildings' shapes and where they stand, the small helpers, the API (window.Farming) and EVERY engine hook.
// Farming_Plots.js (the ground, gathering, water, buckets and pots, the crops and the tools on a plot), Farming_Build.js (the
// rules of building, the sites, placing and the walk to the spot, the hut, the snares, resting and sleeping), Farming_Stations.js
// (the stations' jobs and queue, the fires, the recipes, hand work, the chests and their screen) and Farming_UI.js (the action
// menus, Q and E, the menu windows) are functions and classes only.

/*:
 * @target MZ
 * @plugindesc Uprawa i budowanie: ziemia po kłodach, pieńkach i kamieniach -> grabie -> motyka -> nasiona -> wzrost -> zbiór, plus budowa płotu, ławki, ogniska, kurnika, ula, skrzyń, pieca ziemnego, tartaku (stołu do ręcznego piłowania), kompostownika, browaru, piekarni, cegielni i kuźni. Budowle z desek, kilof i gwoździe robi się samemu, małe kamienie leżą na ziemi. Zbieractwo (kamienie, len, jagody, grzyby, zioła), gotowanie na ognisku, pułapki, oprawianie, garbarnia, wędzarnia, studnia z konewką, wędkowanie, legowisko i owczarnia. Podlewanie konewką przyspiesza wzrost, sadzenie zależy od pory roku. Warsztat, w którym powstają i montują się wszystkie narzędzia, piła z żelaznego ostrza oraz namiot: zszyty w garbarni, rozkładany i składany, do spania, oraz odpoczynek na trawie bez żadnego budynku. v1.14.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
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
 *   Oczyszczona ziemia: po kolei "Odpocznij" (tylko na trawie), "Wytwórz...", "Wykop ziemię",
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
 *   Budować wolno tylko na polu dziadka (mapa 3) i w chatce (mapa 100) - lista BUILD_MAPS w Farming_Data.js,
 *   a notatka mapy <Build:on> / <Build:off> ją nadpisuje. Gdzie indziej Q pokazuje dymek "Budować możesz
 *   tylko na polu dziadka" i na liście zostają tylko pułapki (one stoją na każdej mapie). Menu F9 nie pyta.
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
 *   Naciśnięcie otwiera menu placu (zacznij / buduj dalej, zrezygnuj / rozbierz
 *   plac - zwraca materiały: wszystkie przed pierwszym uderzeniem, potem coraz
 *   mniej, do połowy); przytrzymanie przycisku wybiera budowanie samo i uderza
 *   bez przerwy. Nie ma tu kucania. Budowle blokują przejście. Ognisko migocze i nocą
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
 *   "Przepis" (na górze "Zbierz", gdy coś jest gotowe, pod nim przepisy; póki coś jest w środku, są wyszarzone
 *   z powodem), potem "Akcja" (ogrzanie się, dokładanie drewna, rozbudowa, rozbiórka). Co się teraz robi i ile
 *   jeszcze potrwa, widać pod nazwą budynku. Otwiera się na "Przepis";
 *   strzałki lewo / prawo (albo Q / E) przełączają zakładki, góra / dół wybierają.
 *   Każde stanowisko ma własne receptury. Są dwa rodzaje:
 *   - "w tle" (ogień, fermentacja, rozkład): oddajesz surowce, a po ustalonej
 *     liczbie godzin gry (liczy się też, gdy jesteś na innej mapie lub śpisz)
 *     odbierasz gotowy produkt. KOLEJKA: na takim przepisie strzałki ← / → ustawiają,
 *     ile sztuk naraz (×2 ... ×9, tyle, na ile starczy surowców w plecaku; przy ogniu -
 *     na ile starczy drewna w ognisku). OK płaci za wszystkie od razu, budynek robi je po
 *     kolei (pod nazwą: "Trwa wypalanie 2/3"), a "Zbierz" zabiera to, co już gotowe.
 *     Zakładki przełączasz wtedy klawiszami Q / E;
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
 *   Wytwórz...: surowa skóra i len) mieści 4 łyki, a powiększony w garbarni ("Powiększ bukłak":
 *   wyprawiona skóra i 2 ścięgna) 8 łyków; "Napełnij bukłak" przy wodzie, a pije się z niego
 *   klawiszem G lub z menu Przedmioty. BECZKA NA DESZCZÓWKĘ (deski i gwoździe, młotkiem) zbiera
 *   deszcz jak wiadro, ale więcej: 1,5 porcji na godzinę deszczu, do 12 porcji.
 *   Głodny albo spragniony poniżej 25 zbiera jedzenie (jagody, grzyby, dzikie warzywa, plony)
 *   bez kosztu wytrzymałości - nawet przy zerowych siłach (Needs.js).
 *
 * ODPOCZYNEK (siedzi, a co sekundę mija godzina; drabinka: wytrzymałości na godzinę)
 *   Trawa (bez budynku, na zwykłej, nietkniętej trawie): "Odpocznij" - +20 na godzinę, w deszczu +10. Gracz siada
 *     z rękami złożonymi na kolanach. Ławka ("Usiądź i odpocznij"): +30. Ognisko, trójnóg, kociołek ("Odpocznij
 *     przy ogniu", gdy się pali): +40. Wiata ("Usiądź i odpocznij", także w deszczu): +50.
 *   Siedzi, aż wypocznie (wstaje sam), aż gracz wstanie (strzałki, O, Esc, kliknięcie), aż ogień zgaśnie albo
 *     coś go zaatakuje / dzik czy wilki się zbliżą. Głód i pragnienie rosną jak zwykle z mijającymi godzinami.
 *   Sen (legowisko 60%, namiot i łóżko 100%) przewija czas do rana.
 * POTRZEBA SNU
 *   Kto nie spał 16 godzin, temu odpoczynek (trawa, ognisko, ławka, wiata) przywraca najwyżej 50% sił - menu
 *   mówi, od ilu godzin nie spał. Każdy sen (legowisko, namiot, łóżko) liczy czas od nowa.
 *
 * LEŚNE LEGOWISKO (pierwsze spanie w terenie)
 *   W menu ziemi "Wytwórz..." robisz je z 10 gałęzi i 10 lnu (jedno naraz), a potem rozkładasz w
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
 *
 * STAN W ZAPISIE (rdzeń TawernaCore): $gameSystem._tw.farm - pola, budynki,
 * zebrane rzeczy z ziemi, konewka, noce w namiocie i w łóżku, a także
 * lastSleep (godzina ostatniego przebudzenia po nocy), bagWater (woda w wiadrze
 * w plecaku) i vesselBag (garnki w plecaku). Stare zapisy z $gameSystem._farm
 * są przejmowane; stara nazwa dalej prowadzi do nowego miejsca (czyta ją 7
 * wtyczek). Dawne $gameSystem._lastSleep, _bagWater i _vesselBag przechodzą do
 * _tw.farm przy wczytaniu; stare nazwy dalej prowadzą do nowego miejsca.
 *
 * SZYNA ZDARZEŃ (Tawerna.on):
 *   build { type, x, y, mapId, done, id, how } - plac budowy wyznaczony
 *     (done: false, how: "site") albo budynek już stoi (done: true, how:
 *     "hammer" - ostatnie uderzenie młotkiem w plac, "instant" - rozstawiony
 *     od razu: namiot, wiadro, legowisko, garnek, "upgrade" - rozbudowa, np.
 *     ognisko w trójnóg, "free" - stawianie z menu F9, "direct" -
 *     Farming.build ze zdarzeń i testów). id - numer budynku.
 *   harvest { crop, item, n, seeds, x, y, mapId } - zebrana dojrzała roślina:
 *     crop - rodzaj (CROPS), item i n - plon w plecaku, seeds - ile nasion.
 *   craft { station, item, n, recipe } - zrobiona rzecz trafiła do plecaka:
 *     zebrana z budynku (station - typ budynku, np. "kiln"; z kolejki tyle,
 *     ile zebrano naraz) albo zrobiona ręcznie (station - typ budynku albo
 *     "hand" dla menu "Wytwórz..."). Naprawy i powiększenie bukłaka - bez
 *     zdarzenia.
 *
 * PLIKI (2026-09-29 podzielone): Farming.js (parametry, dane, stan, API, pory
 * roku, kształty budynków, WSZYSTKIE haki silnika - ten), Farming_Plots.js
 * (ziemia, zbieractwo, woda, wiadra i garnki, wzrost, narzędzia na polu,
 * glina), Farming_Build.js (zasady budowy, plac budowy, stawianie z
 * podejściem, rozbiórka, pułapki, chatka, odpoczynek i sen),
 * Farming_Stations.js (praca stanowisk i kolejka, ogień, przepisy, praca
 * ręczna, skrzynie i ich ekran), Farming_UI.js (menu akcji, Q i E, okna
 * menu). Kolejność na liście wtyczek: Farming, Farming_Plots, Farming_Build,
 * Farming_Stations, Farming_UI, Farming_Render. Dopóki części nie są
 * wpisane, ten plik wczytuje je sam.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("Farming.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    // the family's shared bag: this file (P.core), Farming_Plots.js (P.plots), Farming_Build.js (P.build), Farming_Stations.js
    // (P.stations), Farming_UI.js (P.ui) - the parts are read when needed
    const P = T.api("Farming_parts") || T.register("Farming_parts", {});
    const missing = file => { throw new Error("Farming.js: brak " + file + " (a part of Farming.js)"); };
    const PL = () => P.plots || missing("Farming_Plots.js");
    const B = () => P.build || missing("Farming_Build.js");
    const S = () => P.stations || missing("Farming_Stations.js");
    const UI = () => P.ui || missing("Farming_UI.js");
    // functions of a part called from another file: const [a, b] = link(PL, ["a", "b"]) - each call goes through the bag (the part may
    // come into the page after the file that asks)
    const link = (part, names) => names.map(n => function() { return part()[n].apply(null, arguments); });
    // the bus: a building site marked (done: false) or a building standing (done: true) - the help above says what "how" is
    const tellBuild = (b, done, how) => T.emit("build", { type: b.type, x: b.x, y: b.y, mapId: $gameMap.mapId(), done, id: b.id, how });
    // the parts' functions this file calls (through the bag)
    const [bushSolid, gatherAt, pickGather, isWaterTile, waterMenu] =
        link(PL, ["bushSolid", "gatherAt", "pickGather", "isWaterTile", "waterMenu"]);
    const [hutSanitize, enterHut, leaveHut] =
        link(B, ["hutSanitize", "enterHut", "leaveHut"]);
    const [giveUpRoast] =
        link(S, ["giveUpRoast"]);
    const [menuFor, showMenu, openKeyMenu] =
        link(UI, ["menuFor", "showMenu", "openKeyMenu"]);

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
        cone: 147, pineSeed: 148, nettle: 149, yarrow: 150, garlic: 151, bandage: 152, nettleSoup: 153, spear: 154, shield: 155, club: 156, rawDeer: 157, roastDeer: 158, rawBoar: 159, roastBoar: 160, rawWolf: 161, roastWolf: 162, sinew: 163, wildApple: 139, wildPear: 140, clay: 164, rawPot: 165, dryPot: 166, firedPot: 167,
        rawBear: 168, roastBear: 169, bearHide: 170, jacket: 171   // stone axe (60) and pickaxe (63): made at the workbench; the saw and the iron heads: forged parts
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
    const CAN_BASE = Math.max(1, num(params.waterCanCharges, 6));
    const canMax = () => CAN_BASE + Math.round(perk("can.charges"));   // (Rolnictwo: Duża konewka)
    const STONE_DENSITY = Math.max(0, Math.min(30, num(params.stoneDensity, 5))) / 100;
    const STONE_RESPAWN_DAYS = Math.max(1, num(params.stoneRespawnDays, 4));
    const SEED_CHANCE = num(params.seedChance, 12) / 100;
    const GROWTH = num(params.growthSpeed, 100) / 100;
    const SCARECROW_BONUS = 1.25;   // crops within 2 tiles of a scarecrow grow 25% faster
    const SCARECROW_RANGE = 2;
    const WATER_BONUS = 1.20;       // watered today or yesterday grows 20% faster
    const WATER_GRACE_DAYS = 1;

    // Four seasons of equal length (the parameter seasonLength), counted from day 1: 0 spring, 1 summer, 2 autumn, 3 winter - the
    // core's calendar (Tawerna.time reads this plugin's seasonLength; the same formula as before)
    const SEASON_NAMES = ["Wiosna", "Lato", "Jesień", "Zima"];
    function seasonIndex(day) {
        return T.time.season(day);
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
    const CLAY_YIELD = [1, 2];   // wet clay per dig in a puddle (Puddles.js)

    const SE = {
        rake: "Earth2", hoe: "Earth3", plant: "Earth4", harvest: "Item3",
        build: "Hammer", demolish: "Break", rest: "Heal2", collect: "Item2", uproot: "Earth1",
        dig: "Earth5", kindle: "Fire2", chest: "Chest1", move: "Item1", water: "Liquid"
    };
    // resting (the user's, 2026-09-26): seated, REST_HOURS_A_SECOND hours of the day go by every second of real time and the
    // strength comes back by the place's rate an hour - the grass GROUND_REST (GROUND_REST_WET in the rain), the places built for it
    // more (BUILDINGS[..].rest: bench 30, campfire 40, shelter 50) - until full, until he gets up, or until danger comes
    const GROUND_REST = 20, GROUND_REST_WET = 10, REST_HOURS_A_SECOND = 1;
    // the need of sleep: GROUND/building rests bring the strength back only to SLEEP_CAP of the maximum once he has been awake
    // SLEEP_DEBT_HOURS (a night's sleep - any bed, the tent - resets it; farm().lastSleep = the clock hour he woke)
    const SLEEP_DEBT_HOURS = 16, SLEEP_CAP = 0.5;   // (the user's, 2026-09-26: was 20 h / 70%)

    // ------------------------------------------------------------------
    // Content tables (crops, buildings, hand-made recipes): Farming_Data.js (loads before this file). Add your own crops / buildings there.
    // ------------------------------------------------------------------
    const FD = T.api("Farming_Data");
    if (!FD) throw new Error("Farming.js: brak Farming_Data.js - musi stać nad Farming.js na liście wtyczek (Farming's tables are missing)");
    const { CROPS, BUILDINGS, HAND_RECIPES, BUILD_MAPS } = FD.build(ITEM);
    const CROP_IDS = Object.keys(CROPS);
    const BUILDING_IDS = Object.keys(BUILDINGS);

    const TILE = 48;

    // ------------------------------------------------------------------
    // Save data (TawernaCore): $gameSystem._tw.farm = { plots, buildings, nextId, rev, ... }
    //   plots[mapId]["x,y"] = { s: "cleared" | "raked" | "tilled", crop, day }
    //   buildings[mapId] = [ { id, type, x, y, last, store?, job? } ]
    //     store (chests): { "i78": n, ... }   job (crafting): { recipe, start (game hours), hours, out: [item, n] }
    //   and, once they are needed: stones and bushes (what was picked where), can, stungDay, tentNights, bedNights, lastSleep (the
    //   clock hour he woke from his last night's sleep), bagWater (the water in the bucket carried in the bag), vesselBag ({ type:
    //   [{ water, uses }] } - the clay pots carried in the bag)
    // rev grows on every change, so the drawing layer knows when to rebuild.
    // An older save's $gameSystem._farm is taken over; the old name stays a hidden way to the same object (GroundDetail, Journal,
    // Livestock, Minimap, Spoilage, Story and Survival read $gameSystem._farm as it is).
    // ------------------------------------------------------------------
    const farmState = T.state.define("farm", () => ({ plots: {}, buildings: {}, nextId: 1, rev: 0 }), { version: 1, adopt: "_farm", owner: "Farming" });
    function farm() {
        const r = $gameSystem._tw, f = r && r.farm;   // (the quick way first: asked on every passability check)
        return f && typeof f === "object" ? f : farmState();
    }
    // lastSleep, bagWater and vesselBag were $gameSystem._lastSleep, _bagWater and _vesselBag: those names (the tests read and write
    // them) lead to the farm's fields now - on Game_System.prototype, never saved; an older save's own fields move in on loading
    const OLD_KEYS = [["_lastSleep", "lastSleep"], ["_bagWater", "bagWater"], ["_vesselBag", "vesselBag"]];
    for (const [name, field] of OLD_KEYS) {
        Object.defineProperty(Game_System.prototype, name, { configurable: true, enumerable: false,
            get() { const f = this === window.$gameSystem ? farm() : this._tw && this._tw.farm; return f ? f[field] : undefined; },
            set(v) {
                if (this === window.$gameSystem) farm()[field] = v;
                else Object.defineProperty(this, name, { value: v, writable: true, enumerable: true, configurable: true });
            } });
    }
    T.on("load", () => {   // (a save from before: its own fields move in, the prototype's way takes over)
        const sys = $gameSystem, f = farm();
        for (const [name, field] of OLD_KEYS) {
            if (!Object.prototype.hasOwnProperty.call(sys, name)) continue;
            const v = sys[name];
            delete sys[name];
            if (v !== undefined && v !== null) f[field] = v;
        }
    }, { owner: "Farming", priority: -10 });
    // the day of the game: DayNightCycle's, through the core's calendar (0 without the clock, as before)
    function today() {
        return typeof $gameSystem.dayNightDay === "function" ? T.time.day() : 0;
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
    function hutDoorAt(x, y) {
        const h = hutOf();
        if (!h || h.b.site || h.mapId !== $gameMap.mapId()) return null;
        const d = hutDoorCell(h);
        return d.x === x && d.y === y ? h.b : null;
    }

    // ---- buildings
    // A building covers w x h tiles, anchored at the bottom-left tile (x, y): the cells are (x + i, y - j). Its picture stands on the
    // bottom row and rises above it. A YARD (cowshed, coop, sheep pen) is a fenced field: the fence is the outer ring of cells (with a
    // gate in the bottom row), the hut stands inside at yard.hut, everything else is open ground for the animals and for the player.
    // Buildings put up before the sizes grew (no b.v) keep the size they had: BUILDINGS[type].legacy; v:2 ones (first round of
    // bigger buildings) keep BUILDINGS[type].v2 where a later round changed the type again; new ones are v:3.
    // A building may be put down mirrored (b.flip): the picture is turned over and everything that sits at a place of the picture moves
    // with it: the door, the gate and the hut of a yard, the chimney, the fire opening, the hook of a tripod.
    const mirrorCache = new WeakMap();
    function mirrorGeo(g) {
        let m = mirrorCache.get(g);
        if (m) return m;
        m = Object.assign({}, g, { flipped: true });
        if (g.door) m.door = Object.assign({}, g.door, { dx: g.w - 1 - g.door.dx });
        if (g.yard) m.yard = Object.assign({}, g.yard, { gate: g.w - 1 - g.yard.gate, hut: Object.assign({}, g.yard.hut, { dx: g.w - g.yard.hut.dx - g.yard.hut.w }) });
        if (g.ventX) m.ventX = -g.ventX;
        if (g.ember && g.ember.x) m.ember = Object.assign({}, g.ember, { x: -g.ember.x });
        if (g.hang && g.hang.x) m.hang = Object.assign({}, g.hang, { x: -g.hang.x });
        mirrorCache.set(g, m);
        return m;
    }
    const geoOf = b => {
        const def = BUILDINGS[b.type] || { w: 1 };
        let g = def;
        if (!b.v && def.legacy) g = Object.assign({}, def, { ventX: 0, ember: undefined }, def.legacy, { yard: undefined });   // (the old pictures have no measured fire opening)
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

    // share = the part of the tiles that hold this kind; the kinds follow one another on the hash line (stones first).
    // keep = how much of its stretch of the line still holds it (2026-10-07, user: "za dużo rzeczy na ziemi" - half): the same tiles
    // as before, only fewer of them, and the stretches do not move (no kind wanders onto another's tiles, saves stay as they were)
    const GROUND_KEEP = 0.5;
    const GATHER = {
        stone: { item: ITEM.stone, share: STONE_DENSITY, keep: GROUND_KEEP, respawn: STONE_RESPAWN_DAYS, count: [1, 1] },
        fiber: { item: ITEM.fiber, share: 0.06, keep: GROUND_KEEP, respawn: 3, count: [1, 2], seasons: [0, 1, 2] },
        berries: { item: ITEM.berries, share: 0.035, keep: GROUND_KEEP, respawn: 4, count: [1, 3], seasons: [1, 2] },
        mushroom: { item: ITEM.mushroom, share: 0, respawn: 4, count: [1, 2], seasons: [0, 1, 2] },   // no fixed tiles: they grow and vanish (mushroomBirth)
        bush: { item: ITEM.berries, share: 0, respawn: 0, count: [2, 4] },   // berry bushes: berries, then the bare bush gives fibre (bushState)
        herb: { item: ITEM.herb, share: 0.03, keep: GROUND_KEEP, respawn: 4, count: [1, 2], seasons: [0, 1] },
        branch: { item: ITEM.branch, share: 0.05, keep: GROUND_KEEP, respawn: 3, count: [1, 2] },
        // the wild herbs came later: after the branches on the hash line, so the older kinds keep their tiles
        nettle: { item: ITEM.nettle, share: 0.025, keep: GROUND_KEEP, respawn: 4, count: [2, 3], seasons: [0, 1, 2] },   // stings bare hands (pickGather)
        yarrow: { item: ITEM.yarrow, share: 0.018, keep: GROUND_KEEP, respawn: 5, count: [1, 2], seasons: [1, 2] },
        garlic: { item: ITEM.garlic, share: 0.018, keep: GROUND_KEEP, respawn: 5, count: [1, 3], seasons: [0, 1] },
        cone: { item: ITEM.cone, share: 0, respawn: 5, count: [1, 3] },   // no share: only under a standing pine (coneTiles)
        // wild potatoes and carrots (the user's, 2026-09-25): seldom, there from the start; dug out by hand they give the vegetable and,
        // half the time, its seeds (seed: [item, chance, count]) - a way to the first seeds. Last on the hash line: the older kinds keep their tiles
        wildPotato: { item: ITEM.potato, share: 0.004, respawn: 12, count: [1, 2], seasons: [0, 1, 2], seed: [67, 0.5, [1, 2]] },
        wildCarrot: { item: ITEM.carrot, share: 0.004, respawn: 12, count: [1, 2], seasons: [0, 1, 2], seed: [68, 0.5, [1, 2]] }
    };
    const GATHER_KINDS = Object.keys(GATHER);
    const BUSH_SHARE = 0.02;        // the part of the tiles that hold a berry bush
    const MUSHROOM_POOL = 0.07;     // the part of the tiles where a mushroom may grow (0.14 till 2026-10-07: halved, a part of the same tiles)
    const MUSHROOM_LIFE = 3;        // days a mushroom stays before it is gone
    const CONE_SHARE = 0.11;        // the part of the free tiles under a pine where cones lie (0.22 till 2026-10-07: halved, the same tiles)
    const CROP_LIFT = -8;    // sown plants are drawn this many pixels higher: their pictures stand on the bottom edge of the tile, this puts them in the middle
    const BUCKET_REACH = 3;   // how far from a plot a bucket still waters it (tiles)
    // ---- helpers
    const itemOf = id => $dataItems[id];
    const countOf = id => $gameParty.numItems(itemOf(id));
    const rand = ([lo, hi]) => lo + Math.floor(Math.random() * (hi - lo + 1));

    // over the player (Tawerna.popup: SurvivalHUD's popups); what is missing is always said this way, in red (popup.need)
    function popup(icon, text, color) {
        T.popup(text, { icon, color });
    }
    function complain(icon, text) { T.popup.need(icon, text); }
    // true when n more of item would still fit in the bag - the standard guard before gaining loot/output or packing an item
    function spaceFor(item, n) { return $gameParty.maxItems(item) - countOf(item.id) >= n; }
    function complainNoSpace(item) { complain(item.iconIndex, "Nie zmieści się w plecaku: " + item.name); }

    function playSe(name, pitch) {
        T.audio.se(name, { volume: 90, pitch: pitch || 100 });   // (the core's pool: a missing file stays silent)
    }
    function spendStamina(cost) {
        if (cost <= 0 || typeof $gameSystem.trySpendStamina !== "function") return true;
        if ($gameSystem.trySpendStamina(cost)) return true;
        complain(ICON.stamina, "Jesteś zbyt zmęczony");
        return false;
    }
    // the hero's skills (Combat.js, Skills_Data.js): perk(key) = what the learnt skills add up to for an effect, perkRoll(key) = a
    // roll against it (a chance), knowsSkill(id) = that one skill is learnt
    const perk = key => T.call("Combat", "perk", key) || 0;
    const perkRoll = key => { const c = perk(key); return c > 0 && Math.random() < c; };
    const knowsSkill = id => !!T.call("Combat", "hasSkill", id);
    const farmCost = n => n * (1 - Math.min(0.8, perk("farm.cost")));   // (Rolnictwo: Ogrodnik)
    // the last bit of strength (the user's stage 1, 2026-09-27): starving or parched (Needs.inNeed: fullness or water under 25), picking
    // something to eat (FoodTable: eaten as it is - berries, mushrooms, wild vegetables, garlic, a ripe crop) costs no strength, so a
    // hero worn down to nothing can always get out of it. (Fruit off a tree, eating and drinking never cost any.)
    const foodIsFree = itemId => !!T.call("Needs", "inNeed") && !!T.call("FoodTable", "edible", itemId);
    // one use of a tool (Durability.js wears it out, breaks it in the end)
    function useTool(id) {
        T.call("Durability", "use", id);
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

    const NO_BUILD = "Budować możesz tylko na polu dziadka";
    // shared by missingMaterials/missingInputs: which [id, n] pairs of a cost/inputs list are not fully in the bag
    function missingOf(pairs) {
        return pairs.filter(([id, n]) => countOf(id) < n);
    }
    const menuHooks = [];   // fn(b, def, entries) -> optional note: extra lines of a building's menu (Dog.js)
    const hasClock = () => typeof $gameSystem.dayNightHour === "function";
    // game hours since day 0 (with the fraction of the current hour)
    function clockHours() {
        return hasClock() ? today() * 24 + T.time.hour() : 0;
    }
    const FUEL_MAX = 10;          // hours of burning it can hold at once
    const FUEL_START = 4;         // hours it starts with when the site is finished
    const FUEL_PER_WOOD = 3;      // hours added per piece of firewood
    const FUEL_PER_BRANCH = 1;    // hours added per branch (worse fuel, but it is often what is on hand)
    const SMOULDER_HOURS = 0.5;   // a fire that has gone out still smokes this long (30 game minutes), thinner and thinner
    const weatherHere = () => { const sv = T.api("Survival"); return !(sv && typeof sv.isOutdoors === "function") || sv.isOutdoors(); };
    function rainingHere() {
        const sv = T.api("Survival");
        if (!(sv && typeof sv.currentWeather === "function") || !weatherHere()) return false;
        const w = sv.currentWeather();
        return !!w && w.type === "rain";
    }
    const RAW_MEATS = () => [ITEM.rawMeat, ITEM.rawDeer, ITEM.rawBoar, ITEM.rawWolf, ITEM.rawBear];
    const MEAT_LABEL = "surowe mięso (dowolne)";
    const meatCount = () => RAW_MEATS().reduce((t, id) => t + countOf(id), 0);
    const QUEUE_MAX = 9;
    // "2 godz. 15 min", "40 min" (rounded up to 5 minutes)
    function clockText(hours) {
        const m = Math.max(5, Math.ceil(hours * 12 - 1e-6) * 5), h = Math.floor(m / 60), r = m % 60;
        return h ? h + " godz." + (r ? " " + r + " min" : "") : r + " min";
    }
    function hoursText(hours) {
        if (hours < 1) return Math.max(5, Math.ceil(hours * 12) * 5) + " min";
        const h = Math.max(1, Math.ceil(hours));
        return h === 1 ? "1 godz." : h + " godz.";
    }

    // recipes that make something better instead of a new item (recipe field improve; no new row in the database): done() - it already
    // is, run() - make it so, text() - the popup after it (the user's stage 1, 2026-09-27: the waterskin 4 -> 8 sips, Needs.js)
    const IMPROVE = {
        skin: { done: () => !!T.call("Needs", "skinBig"), run: () => T.api("Needs").enlargeSkin(), doneText: "Bukłak jest już powiększony",
            text: () => "Bukłak mieści teraz " + T.api("Needs").SKIN.max + " łyków" }
    };
    // [[item id, amount]] -> [[icon, amount, in the bag, name]]: the list shows icon and amount, the popup the rest
    function costRows(pairs) {
        return pairs.map(([id, n]) => [itemOf(id).iconIndex, n, countOf(id), itemOf(id).name]);
    }
    function targetTile() {
        const d = $gamePlayer.direction();
        return { x: $gameMap.roundXWithDirection($gamePlayer.x, d), y: $gameMap.roundYWithDirection($gamePlayer.y, d) };
    }

    const DOOR_CALM = { only: ["transfer", "event", "message"] };   // (not while going to another map, in an event or a message)
    const _Game_Player_checkEventTriggerHere = Game_Player.prototype.checkEventTriggerHere;
    Game_Player.prototype.checkEventTriggerHere = function(triggers) {
        _Game_Player_checkEventTriggerHere.call(this, triggers);
        if (!Array.isArray(triggers) || !triggers.includes(1) || !T.isCalm(null, DOOR_CALM)) return;
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
        if (menu.entries) showMenu(menu.title, menu.entries, undefined, undefined, menu.tabs, menu.status, menu.note);
        if (menu.hold && SceneManager._scene) SceneManager._scene._farmHold = { run: menu.hold, t: 0 };   // (a site: O held on = its first entry)
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
        if ($gameTemp._farmMenuOpen || ($gameTemp._buildMode && !$gameTemp._buildMode.walk) || $gameTemp._farmLock > 0) return false;
        return _Game_Player_canMove.call(this);
    };
    // ...but the action button waits until the building is down
    const _Game_Player_triggerAction = Game_Player.prototype.triggerAction;
    Game_Player.prototype.triggerAction = function() {
        if ($gameTemp._buildMode) return false;
        return _Game_Player_triggerAction.apply(this, arguments);
    };

    PluginManager.registerCommand(pluginName, "clearArea", args => {
        const x0 = num(args.x, 0), y0 = num(args.y, 0), w = Math.max(1, num(args.width, 1)), h = Math.max(1, num(args.height, 1));
        const tiles = [];
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) tiles.push({ x, y });
        $gameSystem.clearLand($gameMap.mapId(), tiles);
    });

    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this.createFarmMenu();
    };
    // the map scene's farm menu (Farming_UI.js) and the building being placed (Farming_Build.js): methods of the engine's Scene_Map put
    // on it here, so they are there whether the parts are listed or come into the page at the end; their bodies are in the parts
    const sceneMethod = (part, name) => function() { return part().SCENE[name].apply(this, arguments); };
    for (const name of ["createFarmMenu", "farmMenuWidth", "openFarmMenu", "closeFarmMenu", "onFarmOk", "onFarmKey"]) Scene_Map.prototype[name] = sceneMethod(UI, name);
    for (const name of ["startBuildMode", "endBuildMode", "refreshBuildHelp", "updateBuildMode", "putDownBuilding", "updateBuildWalk"]) Scene_Map.prototype[name] = sceneMethod(B, name);

    const MENU_MARGIN = 16;   // the farm menu and the build help keep this far off the screen's edges (Farming_UI.js, Farming_Build.js)
    // Q and E open their menus when this scene is on, not changing, no message, event, farm menu or building being placed, and he can move
    const KEY_MENU_CALM = { only: ["onMap", "sceneChange", "message", "event", "farmMenu", "build", "canMove"] };
    Scene_Map.prototype.canUseKeyMenu = function() {
        return T.isCalm(this, KEY_MENU_CALM);
    };
    // a menu opened by the press that is still held (a building site): held on long enough, its first entry is chosen by itself;
    // let go before that and the menu simply stays
    const SITE_HOLD = 14;
    // the map's clock (after the map, its events and the old-style hooks): the site's O held on, Q and E, the building being placed
    T.onMapUpdate(scene => {
        const hold = scene._farmHold;
        if (hold && $gameTemp._farmMenuOpen) {
            if (!Input.isPressed("ok")) scene._farmHold = null;
            else if (++hold.t >= SITE_HOLD) { scene.closeFarmMenu(); hold.run(); }
        }
        const kind = Input.isTriggered("pageup") ? "build" : Input.isTriggered("pagedown") ? "food" : "";
        if (kind && scene._farmMenu && scene.canUseKeyMenu() && openKeyMenu(kind)) SoundManager.playOk();
        if ($gameTemp._buildMode) scene.updateBuildMode();   // (the cursor, the walk to the spot, putting it down: Farming_Build.js)
    }, { owner: "Farming", name: "update" });

    const _Scene_Map_isMenuEnabled = Scene_Map.prototype.isMenuEnabled;
    Scene_Map.prototype.isMenuEnabled = function() {
        return !$gameTemp._farmMenuOpen && !$gameTemp._buildMode && _Scene_Map_isMenuEnabled.call(this);
    };

    // a steady pseudo-random number (0..1) of a tile and a salt: what lies where (Farming_Plots.js), how the soil looks (Farming_Render.js)
    function hash2(x, y, s) {
        let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1103515245);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }

    const BUILD_RANGE = 6;   // how far from the player (in tiles) a building may be placed

    // ------------------------------------------------------------------
    // The bus: a map entered, a game loaded or begun, a night's sleep
    // ------------------------------------------------------------------
    // a map entered: no building is being placed any more; on the hut's map the furniture that stands off its floor goes back to the
    // bag; a roast the player was sitting at (a game saved or a map left in the middle of it) is not carried on: the food goes back
    T.on("mapEnter", e => {
        $gameTemp._buildMode = null;
        if (e.mapId === HUT_MAP) hutSanitize(false);
        for (const b of farm().buildings[e.mapId] || []) if (b.job && b.job.sit) giveUpRoast(b, true);
    }, { owner: "Farming" });
    // a game loaded or begun: what is worked out from the saved state is worked out afresh (the buildings' index here; the bushes in
    // the way, the cones and the drawing layer's counter in Farming_Plots.js)
    function afreshAfterLoad() {
        buildingIndexRev = -1;
        if (P.plots) P.plots.freshCaches();
    }
    T.on("load", afreshAfterLoad, { owner: "Farming" });
    T.on("newGame", afreshAfterLoad, { owner: "Farming" });
    // every night's sleep (a bed, the tent, the bedroll, an inn) wakes him rested: the count of hours awake starts again (the core tells
    // it right after Game_System.sleepUntilHour - this first, before the day's summary and the autosave)
    T.on("wake", () => { farm().lastSleep = clockHours(); }, { owner: "Farming", priority: -10 });

    // ------------------------------------------------------------------
    // For the parts (the bag), and window.Farming (for events, other plugins and tests: the same names as before the split)
    // ------------------------------------------------------------------
    P.core = { PL, B, S, UI, link, tellBuild, num, FARM_REGION, BLOCK_REGION, AUTO_GROUND, ITEM, ICON, STAMINA, canMax,
        SEED_CHANCE, GROWTH, SCARECROW_BONUS, SCARECROW_RANGE, WATER_BONUS, WATER_GRACE_DAYS, SEASON_NAMES, seasonIndex, seasonOf,
        RAKE_KIND, HOE_KIND, CROUCH_KIND, SIT_KIND, ROAST_KIND, ROAST_WAIT_KIND, SIT_MAX_SECONDS, HAMMER_KIND, FISH_KIND,
        SHOVEL_KIND, DIG_YIELD, CLAY_YIELD, SE, GROUND_REST, GROUND_REST_WET, REST_HOURS_A_SECOND, SLEEP_DEBT_HOURS, SLEEP_CAP,
        CROPS, BUILDINGS, HAND_RECIPES, BUILD_MAPS, CROP_IDS, BUILDING_IDS, TILE, farm, today, key, plotsOf, buildingsOf, changed,
        HUT_MAP, HUT_ROOM, isHutInterior, hutFloor, hutOf, hutDoorCell, mirrorGeo, geoOf, cellsOfGeo, buildingAt, solidAt, GATHER,
        GATHER_KINDS, BUSH_SHARE, MUSHROOM_POOL, MUSHROOM_LIFE, CONE_SHARE, BUCKET_REACH, itemOf, countOf, rand, popup, complain,
        spaceFor, complainNoSpace, playSe, spendStamina, perk, perkRoll, knowsSkill, farmCost, foodIsFree, useTool, requireItem,
        fx, later, lockPlayer, swingThen, NO_BUILD, missingOf, menuHooks, hasClock, clockHours, FUEL_MAX, FUEL_START,
        FUEL_PER_WOOD, FUEL_PER_BRANCH, SMOULDER_HOURS, weatherHere, rainingHere, RAW_MEATS, MEAT_LABEL, meatCount, QUEUE_MAX,
        clockText, hoursText, IMPROVE, costRows, targetTile, MENU_MARGIN, hash2, BUILD_RANGE };
    const API = window.Farming = T.register("Farming", { addMenuHook: fn => menuHooks.push(fn), GATHER, QUEUE_MAX, BUILD_MAPS,
        NO_BUILD, IMPROVE, RAW_MEATS, meatCount, MEAT_LABEL, BUSH_SHARE, MUSHROOM_POOL, MUSHROOM_LIFE, BUCKET_REACH, HUT_MAP,
        HUT_ROOM, hutOf, hutDoorAt, isHutInterior, geoOf, cellsOfGeo, isSolidCell, yardInterior, solidAt, CROPS, BUILDINGS,
        buildingAt, canMax, clockHours, seasonIndex, seasonOf, SEASON_NAMES, ITEM, hash2, HAND_RECIPES, BUILD_RANGE, CROP_LIFT,
        TILE, farm, itemOf, key, mirrorGeo, onRing, today, SMOULDER_HOURS, rainingHere });
    // what the parts do, through the bag (called while a part is not in the page: the error names the file)
    const exportFrom = (part, names) => { for (const n of names) API[n] = function() { return part()[n].apply(null, arguments); }; };
    exportFrom(PL, ["setBagWater", "takeGatherFor", "bushState", "bushSolid", "mushroomBirth", "mushroomChance", "gatherKindOf",
        "claimGround", "releaseGround", "bucketUnits", "bucketSync", "takeBucketWater", "bucketFor", "rainHoursBetween",
        "bagWater", "bagWaterWeight", "fillSkin", "plotAt", "isSoilTile", "groundIsSoil", "naturalFarmland", "rake", "till",
        "plant", "harvest", "uproot", "groundInfoAt", "hasObjectTile", "cropStage", "isRipe", "daysLeft", "growthRate", "dig",
        "digClay", "potDryness", "takePot", "putPotOnTable", "takeTablePot", "tablePotDry", "water", "wateredRecently", "stoneAt",
        "stoneSpot", "pickStone", "gatherAt", "gatherSpot", "pickGather", "isWaterTile", "waterMenu", "fillCan", "drink",
        "goFishing", "rainWater", "canCharges", "gatherRev", "rationWell", "rationLeft", "rationOf"]);
    exportFrom(B, ["mapAllowsBuilding", "startFreePlacement", "placeFree", "hutShutsIn", "hutSanitize", "enterHut", "leaveHut",
        "upgradeBuilding", "roomFor", "build", "demolish", "collect", "rest", "readyProduce", "snares", "snareBait", "snareSprung",
        "snareCatch", "snareEatBait", "baitSnare", "whyNotBuild", "awakeHours", "restCap", "siteHits", "hitCost", "demolishBlock",
        "pitchInstant", "packUp", "sleepInTent", "wakeHour", "startPlacement", "placementProblem", "tileWhyNot", "placeSite",
        "strikeSite", "cancelSite", "missingMaterials", "tilesOfBuilding"]);
    exportFrom(S, ["jobCount", "jobFinished", "jobCollectable", "queueMax", "recipeEntry", "startJob", "collectJob", "jobReady",
        "jobHoursLeft", "jobHours", "putInChest", "takeFromChest", "isFood", "ownedOutput", "chestStacks", "chestKinds",
        "chestHolds", "packStacks", "whyNotMove", "openChest", "craftManual", "recipeOf", "fuelLeft", "fireLit", "smoulderOf",
        "jobPaused"]);
    exportFrom(UI, ["openBuildKeyMenu", "openFoodKeyMenu", "foodFacts", "whyNotEat", "menuFor"]);
    // the chest screen's classes (Farming_Stations.js); soilTexture, fenceTexture, nightAmount, fireGlowAlpha: added by Farming_Render.js
    for (const name of ["Scene_Chest", "Window_ChestList"]) Object.defineProperty(API, name, { enumerable: true, configurable: true,
        get() { return S()[name]; }, set(v) { Object.defineProperty(API, name, { value: v, writable: true, enumerable: true, configurable: true }); } });

    // the parts not in js/plugins.js yet: put into the page here (after every plugin - functions and classes only, every engine hook
    // is above, so nothing moves in the chain)
    for (const part of ["Farming_Plots", "Farming_Build", "Farming_Stations", "Farming_UI"]) {
        if (!(window.$plugins || []).some(p => p && p.name === part && p.status)) PluginManager.loadScript(part);
    }
})();
