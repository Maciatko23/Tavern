//=============================================================================
// ChoppableTree.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Zbieractwo: ścinanie drzew siekierą, kopanie pieńków łopatą, rozbijanie kamieni kilofem, rąbanie kłód, prawdziwa animacja postaci przy machaniu narzędziem, odłamki przy uderzeniu, duże obiekty blokują swoją podstawę, zwalnia ziemię pod uprawy i budowę, animacje grabienia i orki, kucania przy siewie i zbiorze, ścinanie krzaków (dają gałęzie), kamienie w wielu rodzajach (lecą do gracza po rozbiciu), duże krzewy z przechodnim brzegiem, 26 kamieni od małych po ogromne plus żyła rudy żelaza, bezlistne zarośla z gałęzi blokujące drogę, zużywa wytrzymałość, dzikie drzewa owocowe (jabłoń, grusza) z sezonowym owocem do zerwania przed ścięciem. v1.16.0
 * @author Claude
 *
 * @param axeItem
 * @text Przedmiot: siekiera
 * @desc Bez tego przedmiotu w ekwipunku drzewa nie da się ściąć.
 * @type item
 * @default 60
 *
 * @param shovelItem
 * @text Przedmiot: łopata
 * @desc Potrzebna do wykopania pieńka.
 * @type item
 * @default 62
 *
 * @param pickaxeItem
 * @text Przedmiot: kilof
 * @desc Potrzebny do rozbijania kamieni.
 * @type item
 * @default 63
 *
 * @param dropItem
 * @text Przedmiot zdobywany ze ściętego drzewa
 * @type item
 * @default 61
 *
 * @param stoneItem
 * @text Przedmiot zdobywany z kamienia
 * @type item
 * @default 64
 *
 * @param dropMin
 * @text Drewno z drzewa: minimum sztuk
 * @type number
 * @min 0
 * @default 2
 *
 * @param dropMax
 * @text Drewno z drzewa: maksimum sztuk
 * @type number
 * @min 0
 * @default 4
 *
 * @param hits
 * @text Uderzenia siekierą do ścięcia drzewa
 * @type number
 * @min 1
 * @default 4
 *
 * @param digHits
 * @text Uderzenia łopatą do wykopania pieńka
 * @type number
 * @min 1
 * @default 2
 *
 * @param rockHits
 * @text Uderzenia kilofem do rozbicia kamienia
 * @type number
 * @min 1
 * @default 3
 *
 * @param logHits
 * @text Uderzenia siekierą do rozrąbania kłody
 * @type number
 * @min 1
 * @default 2
 *
 * @param staminaChop
 * @text Wytrzymałość: koszt uderzenia siekierą w drzewo
 * @desc Wymaga pluginu SurvivalHUD. 0 = bez kosztu.
 * @type number
 * @min 0
 * @default 5
 *
 * @param staminaDig
 * @text Wytrzymałość: koszt uderzenia łopatą
 * @type number
 * @min 0
 * @default 4
 *
 * @param staminaMine
 * @text Wytrzymałość: koszt uderzenia kilofem
 * @type number
 * @min 0
 * @default 6
 *
 * @param staminaLog
 * @text Wytrzymałość: koszt uderzenia siekierą w kłodę
 * @type number
 * @min 0
 * @default 3
 *
 * @param swayAngle
 * @text Kołysanie drzewa: kąt (stopnie, 0 = wyłączone)
 * @type number
 * @decimals 1
 * @min 0
 * @default 1.0
 *
 * @param swayCycle
 * @text Kołysanie drzewa: czas jednego cyklu (sekundy)
 * @type number
 * @decimals 1
 * @min 0.5
 * @default 6.0
 *
 * @param fruitItem
 * @text Owoc: domyślny przedmiot
 * @desc Używany, gdy notatka <Tree:fruit=...> nie poda innego. 0 = drzewo owocowe bez notatki nie owocuje.
 * @type item
 * @default 0
 *
 * @param fruitMin
 * @text Owoc: ile sztuk (minimum)
 * @type number
 * @min 1
 * @default 2
 *
 * @param fruitMax
 * @text Owoc: ile sztuk (maksimum)
 * @type number
 * @min 1
 * @default 4
 *
 * @param fruitSeasonFrom
 * @text Owocowanie: pierwsza pora roku (0 Wiosna, 1 Lato, 2 Jesień, 3 Zima)
 * @type number
 * @min 0
 * @max 3
 * @default 1
 *
 * @param fruitSeasonTo
 * @text Owocowanie: ostatnia pora roku
 * @type number
 * @min 0
 * @max 3
 * @default 2
 *
 * @param fruitRegrowDays
 * @text Owoc odrasta po (dni)
 * @type number
 * @min 1
 * @default 5
 *
 * @param fruitSe
 * @text Dźwięk: zerwanie owocu
 * @type file
 * @dir audio/se
 * @default Item1
 *
 * @param chopSe
 * @text Dźwięk: uderzenie siekiery
 * @type file
 * @dir audio/se/
 * @default Hammer
 *
 * @param fallSe
 * @text Dźwięk: upadek drzewa
 * @type file
 * @dir audio/se/
 * @default Crash
 *
 * @param digSe
 * @text Dźwięk: uderzenie łopaty
 * @type file
 * @dir audio/se/
 * @default Earth1
 *
 * @param mineSe
 * @text Dźwięk: uderzenie kilofa
 * @type file
 * @dir audio/se/
 * @default Hammer
 *
 * @param breakSe
 * @text Dźwięk: rozbicie kamienia / wyrwanie pieńka
 * @type file
 * @dir audio/se/
 * @default Break
 *
 * @param charcoalItem
 * @text Przedmiot: węgiel drzewny (z drzewa trafionego piorunem)
 * @desc Zwęglone drzewo (piorun w burzy, wtyczka Storm) daje go zamiast drewna, a jego pieniek też.
 * @type item
 * @default 79
 *
 * @param branchItem
 * @text Przedmiot zdobywany ze ściętego krzaka
 * @desc Gałęzie. Ze ściętego krzaka wypada od jednej do kilku sztuk (zależnie od wielkości krzaka).
 * @type item
 * @default 77
 *
 * @param bushHits
 * @text Uderzenia siekierą do ścięcia krzaka
 * @desc Dotyczy krzaków bez własnych ustawień. Poszczególne rodzaje (duży krzew, kępa trawy...) mają swoje wartości w tablicy BUSH_PROFILES w kodzie.
 * @type number
 * @min 1
 * @default 2
 *
 * @param staminaBush
 * @text Wytrzymałość: koszt uderzenia siekierą w krzak
 * @type number
 * @min 0
 * @default 3
 *
 * @param bushSe
 * @text Dźwięk: cięcie krzaka
 * @type file
 * @dir audio/se/
 * @default Slash3
 *
 * @command chop
 * @text Uderz w drzewo (siekiera)
 * @desc Użyj w zdarzeniu-drzewie, kłodzie lub krzaku (wyzwalacz: Przycisk akcji). Sprawdza siekierę, liczy uderzenia i ścina.
 *
 * @command dig
 * @text Kop pieniek (łopata)
 * @desc Użyj na stronie zdarzenia z pieńkiem (samoprzełącznik A). Sprawdza łopatę, liczy uderzenia i wykopuje pieniek.
 *
 * @command mine
 * @text Uderz w kamień (kilof)
 * @desc Użyj w zdarzeniu-kamieniu (notatka <Rock>). Sprawdza kilof, liczy uderzenia i rozbija kamień.
 *
 * @help
 * ============================================================================
 * ChoppableTree.js
 * ============================================================================
 * Trzy rodzaje obiektów do zbierania, każdy to zwykłe zdarzenie na mapie.
 *
 * 1) DRZEWO (siekiera), 3 strony zdarzenia:
 *   STRONA 1 (drzewo stojące)
 *     - Grafika: duży obraz drzewa (np. "!$Pine_A" z img/characters).
 *       Zdarzenie stoi na kafelku pnia, a obraz sięga od pnia w górę.
 *     - Priorytet: Tak samo jak postać, Wyzwalacz: Przycisk akcji.
 *     - Polecenie wtyczki: "Uderz w drzewo (siekiera)".
 *   STRONA 2 (pieniek)
 *     - Warunek: Samoprzełącznik A włączony (plugin włącza go sam po ścięciu).
 *     - Grafika: kafelek pieńka, Priorytet: Tak samo jak postać,
 *       Wyzwalacz: Przycisk akcji.
 *     - Polecenie wtyczki: "Kop pieniek (łopata)".
 *   STRONA 3 (pusto po wykopaniu)
 *     - Warunek: Samoprzełącznik B włączony. Bez grafiki i bez poleceń.
 *
 *   Notatka zdarzenia (opcjonalna, nadpisuje ustawienia wtyczki):
 *     <Tree:hits=5,axe=60,drop=61,dropmin=2,dropmax=4,sway=1.5,
 *           shovel=62,digs=2,digdrop=61,digmin=1,digmax=2>
 *     Sama obecność tagu <Tree> (np. <Tree>) włącza kołysanie drzewa.
 *     sway - kąt kołysania w stopniach (0 = drzewo nie kołysze się).
 *
 *   DRZEWO OWOCOWE (dzika jabłoń / grusza): ten sam tag <Tree>, z dodatkowymi
 *   kluczami fruit=<przedmiot>,fruitmin=,fruitmax=. Dopóki drzewo owocuje,
 *   przycisk akcji zrywa owoce zamiast rąbać - siekiera działa dopiero, gdy
 *   nic już na nim nie wisi (zerwane albo nie jego pora roku). Potrzebne są
 *   DWIE strony: STRONA 1 (Samoprzełącznik C wyłączony - owocuje): grafika
 *   "!$Tree_Apple" / "!$Tree_Pear" (albo własna), polecenie wtyczki "Zerwij
 *   owoce z drzewa"; STRONA 2 (Samoprzełącznik C włączony, A wyłączony -
 *   bez owoców): grafika "!$Tree_FruitBare" (albo własna), polecenie "Uderz
 *   w drzewo (siekiera)" - od tej strony to już zwykłe ścinane drzewo.
 *   Pora owocowania i liczba dni do odrośnięcia to parametry wtyczki
 *   (wspólne dla wszystkich drzew owocowych na mapie).
 *
 * 2) KAMIEŃ (kilof), 2 strony zdarzenia:
 *   STRONA 1: grafika kamienia (kafelek lub obraz), Priorytet: Tak samo jak
 *     postać, Wyzwalacz: Przycisk akcji, polecenie "Uderz w kamień (kilof)".
 *   STRONA 2: Warunek: Samoprzełącznik A włączony. Bez grafiki i poleceń.
 *   Notatka zdarzenia:
 *     <Rock:hits=3,tool=63,drop=64,dropmin=1,dropmax=3>
 *   Gotowe kamienie z obrazem "!$Rock_..." (31 rodzajów od kamyków po ogromny
 *   głaz 3x3: wysoka skała, iglica, menhir, płyty, stosy, skupiska, gruz,
 *   pęknięte i omszałe kamienie, szare i brązowe głazy, oraz sześć skał z rudą
 *   żelaza "!$Rock_Ore_Iron", "_Chunk", "_Spire", "_Cluster", "_Twin", "_Jagged",
 *   które dają rudę zamiast kamienia) oraz głaz "!$Boulder_A"
 *   nie potrzebują ani stron, ani poleceń, ani notatki: wystarczy postawić
 *   zdarzenie z takim obrazem. Po każdym uderzeniu kilofem lecą odłamki, a po
 *   ostatnim z kamienia wylatują dokładnie te kamienie, które dostajesz
 *   (przedmiot z parametru "Przedmiot zdobywany z kamienia"), odbijają się od
 *   ziemi i lecą do postaci. Liczba uderzeń i kamieni zależy od wielkości
 *   kamienia (tablica ROCK_PROFILES w kodzie). Zdarzenie z notatką <Rock...>
 *   ma wartości z notatki i z parametrów wtyczki, jak dawniej.
 *
 * 3) PIENIEK BEZ DRZEWA (łopata): zdarzenie z notatką <Stump> (klucze jak
 *   shovel, digs, digdrop, digmin, digmax). STRONA 1: grafika pieńka + polecenie
 *   "Kop pieniek (łopata)"; STRONA 2: Samoprzełącznik B włączony, pusta.
 *
 * 4) KŁODA / STOS DREWNA (siekiera): notatka <Log:hits=2,tool=60,drop=61,
 *   dropmin=1,dropmax=2>, polecenie "Uderz w drzewo (siekiera)".
 *   STRONA 2: Samoprzełącznik A włączony, pusta. tool=0 oznacza, że nie trzeba
 *   żadnego narzędzia (samo zebranie).
 *
 * 5) KRZAK (siekiera, dają gałęzie): wystarczy postawić zdarzenie z obrazem
 *   "!$Bush_..." z img/characters (25 gotowych krzaków, małych i dużych:
 *   liściaste, kwitnące, paprocie, ośnieżone, duży krzew...). Zdarzenie nie
 *   potrzebuje żadnych poleceń ani notatki: po naciśnięciu przycisku akcji
 *   postać macha siekierą, a po ostatnim uderzeniu krzak znika i wypadają
 *   gałęzie (przedmiot z parametru "Przedmiot zdobywany ze ściętego krzaka").
 *   Wielkość krzaka (liczba uderzeń, ilość gałęzi, koszt wytrzymałości) bierze
 *   się z tablicy BUSH_PROFILES w kodzie. Duży krzew i krzew zajmują całą
 *   powierzchnię obrazu (SOLID_GRAPHICS), ale ich brzeg jest przechodni: postać
 *   może lekko wejść w krzak albo go musnąć (liście zasłaniają ją wtedy, a krzak
 *   robi się półprzezroczysty) i ścina go z każdej strony, także od środka
 *   brzegu. Blokuje tylko wnętrze. Szerokość przechodniego brzegu to klucz soft
 *   w tablicy i w notatce <Occupy:soft=1> (soft=0 - krzak blokuje cały).
 *   BEZLISTNE ZAROŚLA "!$Bush_Bare_..." (8 rodzajów: suchy krzaczek, kolczaste
 *   pnącza, wysoki suchy krzak, splot gałęzi, zasiek 3x1, gęste zarośla, kłąb
 *   pnączy, wielki splot 3x2) to gęste sploty gałęzi i pnączy bez liści. Blokują
 *   drogę całą swoją powierzchnią (bez przechodniego brzegu), ale można je
 *   ściąć siekierą: dają więcej gałęzi niż zwykłe krzaki (im większe, tym
 *   więcej uderzeń i gałęzi), a lecą z nich suche patyki, nie zielone liście.
 *   Wstaw takie zdarzenie w przejściu, żeby je zagrodzić do czasu ścięcia.
 *   Klucz bare=1 w <Bush:...> włącza suche patyki także dla własnych obrazów.
 *   Zdarzenie stoi na kratce w dolnym rzędzie (przy szerokich krzewach po lewej
 *   stronie albo pośrodku, jak przy głazie). Po ścięciu zdarzenie znika
 *   i zwalnia ziemię (można ją uprawiać). Krzak można też zrobić z dowolnego
 *   innego obrazu notatką <Bush:hits=2,tool=60,drop=77,dropmin=1,dropmax=3,
 *   cost=3>. Jeśli chcesz własną stronę po ścięciu, dodaj stronę z warunkiem
 *   Samoprzełącznik A (pusta albo z pieńkiem).
 *
 * 6) OBIEKT ZAJMUJĄCY WIĘCEJ KRATEK: <Occupy:left=1,right=1,up=1,down=0> -
 *   zdarzenie blokuje i reaguje na akcję także na sąsiednich kratkach (left,
 *   right - w bok, up, down - w górę i w dół od kratki zdarzenia; soft - szerokość
 *   przechodniego brzegu tego obszaru, patrz krzaki).
 *   Duże obiekty z tablicy SOLID_GRAPHICS w kodzie (np. głaz "!$Boulder_A" i
 *   "!$Logs_Big") blokują same swój dolny rząd (kratkę zdarzenia i jedną w
 *   prawo), bez żadnej notatki - wystarczy wstawić zdarzenie z taką grafiką.
 *   Górny rząd głazu nie blokuje: można stać "za" skałą. Chcesz, żeby blokował,
 *   dopisz w notatce <Occupy:up=1>. Klucze z <Occupy> mają pierwszeństwo.
 *   Po zniszczeniu obiektu (strona bez grafiki i z priorytetem "pod postacią")
 *   blokada znika.
 *
 * ZWĘGLONE DRZEWO (piorun, wtyczka Storm): w czasie burzy bliski piorun może
 *   trafić w stojące drzewo na ekranie (nie owocowe). Drzewo jest zwęglone
 *   (samoprzełącznik D - zapisuje się samo) i sypie iskrami. Spala się od czubka
 *   w dół, piksel po pikselu: pasek żaru (żółty, pomarańczowy, czerwony) schodzi
 *   po nim w ok. 12 sekund i zostawia je czarne; kilka punktów tli się dalej
 *   do godziny gry. W nocy żar lekko rozjaśnia ciemność wokół siebie. Jest
 *   kruche: pada po połowie uderzeń, lecą z niego czarne drzazgi i popiół,
 *   a zamiast drewna daje 6-10 sztuk węgla drzewnego (parametr "Przedmiot:
 *   węgiel drzewny"). Spłonęło do korzeni, więc po ścięciu NIE zostaje pieniek
 *   (od razu strona pusta, samoprzełącznik B) i ziemia pod nim jest wolna.
 *   Samoprzełącznika D nie używaj na drzewach do niczego innego.
 *
 * WYTRZYMAŁOŚĆ (wymaga pluginu SurvivalHUD): każde uderzenie kosztuje trochę
 * wytrzymałości. Koszt zmienisz w parametrach albo w notatce zdarzenia kluczem
 * cost= (dla drzewa dodatkowo digcost= przy kopaniu pieńka). Gdy siły
 * zabraknie, uderzenie nie następuje - trzeba się wyspać w łóżku.
 *
 * ANIMACJA MACHANIA: podczas uderzenia postać gracza jest zastępowana klatkami
 * z arkuszy img/system/Swing_*.png (siekiera z góry, siekiera z boku,
 * kilof, łopata). Arkusz ma 4 wiersze (dół, lewo, prawo, góra) i po
 * jednej komórce 96x96 na klatkę; stopy postaci stoją w punkcie (48, 80).
 * Rodzaje zamachu (tablica SWING_KINDS w kodzie): siekiera z boku przy stojących
 * drzewach (Swing_AxeSide), siekiera z góry przy kłodach (Swing_Axe), kilof
 * przy kamieniach, łopata przy pieńkach, grabie i motyka przy pracy na polu
 * oraz kucanie (Swing_Crouch, bez narzędzia) przy siewie, zbiorze i zbieraniu
 * jajek i miodu (wtyczka Farming), przy budowie młotek (rodzaj 7, Swing_Hammer)
 * i przy wędkowaniu wędka (rodzaj 8, Swing_Rod: postać zarzuca żyłkę i trzyma
 * wędkę, dopóki spławik pływa). Dla każdego są tam: długość zamachu,
 * klatka gry, w której narzędzie trafia, i klatka arkusza pokazywana w tej
 * chwili (hit). Postać robi też mały krok w stronę celu (reach, w pikselach).
 * Przy uderzeniu lecą drzazgi, iskry, grudki ziemi albo liście, a kamienie
 * lekko trzęsą ekranem. Bez arkusza wtyczka rysuje obracające się narzędzie
 * z img/system/Tools.png.
 *
 * Wszystkie klucze w notatkach są opcjonalne; brakujące biorą się z
 * parametrów wtyczki.
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "ChoppableTree";
    const params = PluginManager.parameters(pluginName);
    const num = (value, fallback) =>
        value !== undefined && value !== "" && isFinite(Number(value)) ? Number(value) : fallback;

    const TREE_DEFAULTS = {
        hits: num(params.hits, 4),
        axe: num(params.axeItem, 60),
        drop: num(params.dropItem, 61),
        dropmin: num(params.dropMin, 2),
        dropmax: num(params.dropMax, 4),
        sway: num(params.swayAngle, 1.0),
        shovel: num(params.shovelItem, 62),
        digs: num(params.digHits, 2),
        digdrop: num(params.dropItem, 61),
        digmin: 1,
        digmax: 2,
        cost: num(params.staminaChop, 5),
        digcost: num(params.staminaDig, 4),
        // a tree with fruit=0 (the default) is an ordinary tree; the note tag <Tree:fruit=...> opts it in
        fruit: num(params.fruitItem, 0),
        fruitmin: num(params.fruitMin, 2),
        fruitmax: num(params.fruitMax, 4),
        scale: 1,   // shrinks the whole picture (and the sway with it) around the foot of the tree; <Tree:scale=0.65>
        nostump: 0   // 1: felled, it leaves no stump (a seedling planted by Forestry.js) - the ground is free at once
    };
    const FRUIT_SEASON_FROM = num(params.fruitSeasonFrom, 1);
    const FRUIT_SEASON_TO = num(params.fruitSeasonTo, 2);
    const FRUIT_REGROW_DAYS = num(params.fruitRegrowDays, 5);
    const FRUIT_SE = params.fruitSe || "Item1";
    // a tree struck by lightning (Storm.js): charcoal instead of wood, from the tree and from its stump
    const CHARCOAL = num(params.charcoalItem, 79);
    // pine cones (Farming.js lays them under the pines, Forestry.js turns their seeds into trees)
    const CONE = num(params.coneItem, 147);
    const isPine = event => { const data = event.event(), page = data && data.pages && data.pages[0]; return !!page && /Pine/.test(page.image.characterName || ""); };
    const CHARRED_DROP = [6, 10], CHARRED_STUMP_DROP = [1, 2];
    const CHARRED_HITS = 2;   // a charred tree is brittle: two blows fell it (the user's number)
    const CHARRED_TONE = [-62, -72, -84, 255];   // grey, then darker and a little warm: soot-black wood
    const ROCK_DEFAULTS = {
        hits: num(params.rockHits, 3),
        tool: num(params.pickaxeItem, 63),
        drop: num(params.stoneItem, 64),
        dropmin: 1,
        dropmax: 3,
        cost: num(params.staminaMine, 6)
    };
    const STUMP_DEFAULTS = {
        shovel: TREE_DEFAULTS.shovel,
        digs: TREE_DEFAULTS.digs,
        digdrop: TREE_DEFAULTS.digdrop,
        digmin: TREE_DEFAULTS.digmin,
        digmax: TREE_DEFAULTS.digmax,
        cost: num(params.staminaDig, 4)
    };
    const LOG_DEFAULTS = {
        hits: num(params.logHits, 2),
        tool: num(params.axeItem, 60),
        drop: num(params.dropItem, 61),
        dropmin: 1,
        dropmax: 2,
        cost: num(params.staminaLog, 3)
    };
    const BUSH_DEFAULTS = {
        hits: num(params.bushHits, 2),
        tool: num(params.axeItem, 60),
        drop: num(params.branchItem, 77),
        dropmin: 1,
        dropmax: 2,
        cost: num(params.staminaBush, 3),
        bare: 0   // 1: leafless (dry twigs fly off instead of leaves)
    };
    // Every picture named "!$Bush_..." is a bush: no note, no commands needed.
    const BUSH_GRAPHIC = /^!\$Bush_/;
    // What the ready-made bushes give: hits to cut, branches dropped, stamina per
    // hit. Bushes that are not listed use BUSH_DEFAULTS.
    const TUFT = { hits: 1, dropmin: 1, dropmax: 1, cost: 2 };
    const BUSH_PROFILES = {
        "!$Bush_Big": { hits: 2, dropmin: 3, dropmax: 5, cost: 5 },
        "!$Bush_Medium": { hits: 2, dropmin: 2, dropmax: 4, cost: 4 },
        "!$Bush_Wide": { hits: 2, dropmin: 2, dropmax: 3, cost: 4 },
        "!$Bush_Small": TUFT, "!$Bush_Grass": TUFT, "!$Bush_Fern_A": TUFT, "!$Bush_Fern_B": TUFT,
        "!$Bush_Snow_Tuft_A": TUFT, "!$Bush_Snow_Tuft_B": TUFT, "!$Bush_Bud_B": TUFT,
        // leafless thickets: dense woody tangles, more hits and more branches than leafy bushes
        "!$Bush_Bare_A": { hits: 2, dropmin: 2, dropmax: 3, cost: 4, bare: 1 },
        "!$Bush_Bare_B": { hits: 2, dropmin: 2, dropmax: 3, cost: 4, bare: 1 },
        "!$Bush_Bare_Tall": { hits: 2, dropmin: 3, dropmax: 4, cost: 5, bare: 1 },
        "!$Bush_Bare_Wide": { hits: 2, dropmin: 3, dropmax: 5, cost: 5, bare: 1 },
        "!$Bush_Bare_Hedge": { hits: 5, dropmin: 4, dropmax: 6, cost: 5, bare: 1 },
        "!$Bush_Bare_Thicket": { hits: 5, dropmin: 4, dropmax: 6, cost: 6, bare: 1 },
        "!$Bush_Bare_Vines": { hits: 5, dropmin: 4, dropmax: 6, cost: 6, bare: 1 },
        "!$Bush_Bare_Big": { hits: 6, dropmin: 5, dropmax: 8, cost: 7, bare: 1 }
    };
    // Every picture named "!$Rock_..." (and the boulder) is a rock: no note, no
    // commands needed. hits, stones dropped and stamina per hit by size. An event
    // with a <Rock> note keeps using the plugin parameters plus its note.
    const ROCK_GRAPHIC = /^!\$(Rock_|Boulder_)/;
    const SMALL_ROCK = { hits: 6, dropmin: 1, dropmax: 2, cost: 5 };   // (the numbers of blows: the user's, 2026-09-24)
    const ROCK_PROFILES = {
        "!$Boulder_A": { hits: 20, dropmin: 2, dropmax: 4, cost: 7 },
        "!$Rock_Tall": { hits: 16, dropmin: 2, dropmax: 3, cost: 6 },
        "!$Rock_Slab": { hits: 4, dropmin: 2, dropmax: 4, cost: 6 },
        "!$Rock_Mound": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Pile": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Grey": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Tan": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Snow_Grey": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Snow_Tan": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Flat": SMALL_ROCK, "!$Rock_Round": SMALL_ROCK, "!$Rock_Steps": SMALL_ROCK,
        // loose pebbles and rubble lie on the ground: tool 0 = picked up by hand (no pickaxe, no swing)
        "!$Rock_Pebbles": { tool: 0, hits: 1, dropmin: 1, dropmax: 1, cost: 1, title: "Podniesiono kamień!" },
        "!$Rock_Boulder_Crack": { hits: 20, dropmin: 2, dropmax: 4, cost: 7 },
        "!$Rock_Jagged": { hits: 20, dropmin: 2, dropmax: 4, cost: 7 },
        "!$Rock_Twin": { hits: 4, dropmin: 2, dropmax: 3, cost: 6 },
        "!$Rock_Wide": { hits: 14, dropmin: 3, dropmax: 5, cost: 7 },
        "!$Rock_Huge": { hits: 18, dropmin: 4, dropmax: 7, cost: 8 },
        "!$Rock_Spire": { hits: 16, dropmin: 2, dropmax: 3, cost: 6 },
        "!$Rock_Column": { hits: 4, dropmin: 2, dropmax: 4, cost: 6 },
        "!$Rock_Cluster": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Long": { hits: 4, dropmin: 2, dropmax: 4, cost: 6 },
        "!$Rock_Rubble": { tool: 0, hits: 1, dropmin: 1, dropmax: 2, cost: 1, title: "Podniesiono kamienie!" },
        "!$Rock_Cracked": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Cairn": SMALL_ROCK, "!$Rock_Chunk": SMALL_ROCK, "!$Rock_Mossy": SMALL_ROCK,
        // an ore vein: tougher than a plain rock, gives iron ore instead of stone (Farming/kuźnia)
        "!$Rock_Ore_Iron": { hits: 26, dropmin: 1, dropmax: 2, cost: 7, drop: 85, title: "Wydobyto rudę żelaza!" },
        // more shapes of the same vein (the bigger, the more ore and the more blows)
        "!$Rock_Ore_Iron_Chunk": { hits: 22, dropmin: 1, dropmax: 2, cost: 7, drop: 85, title: "Wydobyto rudę żelaza!" },
        "!$Rock_Ore_Iron_Spire": { hits: 26, dropmin: 2, dropmax: 3, cost: 7, drop: 85, title: "Wydobyto rudę żelaza!" },
        "!$Rock_Ore_Iron_Cluster": { hits: 26, dropmin: 2, dropmax: 3, cost: 7, drop: 85, title: "Wydobyto rudę żelaza!" },
        "!$Rock_Ore_Iron_Twin": { hits: 30, dropmin: 3, dropmax: 4, cost: 8, drop: 85, title: "Wydobyto rudę żelaza!" },
        "!$Rock_Ore_Iron_Jagged": { hits: 30, dropmin: 3, dropmax: 5, cost: 8, drop: 85, title: "Wydobyto rudę żelaza!" }
    };
    // Big objects block the tiles at their base (in tiles, counted from the
    // event's own tile: right = extra tiles to the right, up = extra rows above),
    // so a new event with one of these graphics needs no <Occupy> note. The upper
    // rows of a boulder are only drawn over the ground: the player can stand
    // there, behind the rock. Keys written in a note's <Occupy:...> still win over
    // the values here (e.g. <Occupy:up=1> makes the upper row block as well).
    // Bushes cover their whole body (up = rows above the event's row) and react to
    // the action button on every tile of it. soft = width (in tiles) of the edge
    // that can be walked on: the player steps a little way into the bush or brushes
    // against it, and only the inner part blocks. Without an inner part (or with
    // soft 0) the whole body blocks.
    const SOLID_GRAPHICS = {
        "!$Boulder_A": { right: 1 },
        "!$Logs_Big": { right: 1 },
        "!$Bush_Big": { left: 2, right: 2, up: 3, soft: 1 },
        "!$Bush_Medium": { right: 3, up: 2, soft: 1 },
        "!$Bush_Wide": { right: 1, up: 1 },
        "!$Bush_FernTall_A": { up: 1 },
        "!$Bush_FernTall_B": { up: 1 },
        "!$Rock_Tall": { up: 1 },
        "!$Rock_Slab": { right: 1 },
        // boulders like the old one: only the lower row(s) block, the rest can be walked behind
        "!$Rock_Boulder_Crack": { right: 1 },
        "!$Rock_Jagged": { right: 1 },
        "!$Rock_Twin": { right: 1 },
        "!$Rock_Wide": { left: 1, right: 1 },
        "!$Rock_Huge": { left: 1, right: 1, up: 1 },
        // tall single stones block both of their tiles
        "!$Rock_Spire": { up: 1 },
        "!$Rock_Column": { up: 1 },
        // low, wide ones
        "!$Rock_Cluster": { right: 1 },
        // leafless thickets block their whole body (no soft edge): they close the way until they are cut
        "!$Bush_Bare_Tall": { up: 1 },
        "!$Bush_Bare_Wide": { right: 1 },
        "!$Bush_Bare_Hedge": { left: 1, right: 1 },
        "!$Bush_Bare_Thicket": { right: 1, up: 1 },
        "!$Bush_Bare_Vines": { right: 1, up: 1 },
        "!$Bush_Bare_Big": { left: 1, right: 1, up: 1 },
        "!$Rock_Long": { left: 1, right: 1 },
        "!$Rock_Rubble": { right: 1 },
        "!$Rock_Ore_Iron_Spire": { up: 1 },
        "!$Rock_Ore_Iron_Cluster": { right: 1 },
        "!$Rock_Ore_Iron_Twin": { right: 1 },
        "!$Rock_Ore_Iron_Jagged": { right: 1 }
    };
    const SWAY_CYCLE = num(params.swayCycle, 6);
    const CHOP_SE = params.chopSe || "Hammer";
    const FALL_SE = params.fallSe || "Crash";
    const DIG_SE = params.digSe || "Earth1";
    const MINE_SE = params.mineSe || "Hammer";
    const BREAK_SE = params.breakSe || "Break";
    const PICKUP_SE = "Item1";
    const BUSH_SE = params.bushSe || "Slash3";

    // A swing: wind up, strike, recover. The hit lands on the strike frame.
    // One entry per kind of swing. sheet: file in img/system holding its frames
    // (see ANIMACJA MACHANIA in the help). tool: frame in img/system/Tools.png,
    // used only when the sheet is missing. frames / impact / hold: length of the
    // whole swing, the game frame the tool connects on and how long that frame is
    // held (all in game frames, 60 = 1 s). reach: px the body lunges toward the
    // target. hit: sheet frame where the tool connects, per facing (down, left,
    // right, up). tool -1: no tool (crouching): without its sheet the action just
    // happens after the pause, with nothing drawn over the figure.
    const SWING_KINDS = [
        { sheet: "Swing_Axe", tool: 0, frames: 26, impact: 16, hold: 2, reach: 3, hit: [5, 5, 5, 6] },          // 0: axe from above (logs)
        { sheet: "Swing_Pick", tool: 1, frames: 34, impact: 21, hold: 3, reach: 5, hit: [6, 5, 5, 7] },        // 1: pickaxe (rocks)
        { sheet: "Swing_Shovel", tool: 2, frames: 30, impact: 17, hold: 2, reach: 6, hit: [7, 6, 6, 5] },      // 2: shovel (stumps)
        { sheet: "Swing_AxeSide", tool: 0, frames: 26, impact: 16, hold: 2, reach: 4, hit: [7, 8, 8, 5] },     // 3: axe from the side (standing trees)
        { sheet: "Swing_Rake", tool: 2, frames: 34, impact: 20, hold: 2, reach: 6, hit: [6, 5, 5, 5] },        // 4: rake (Farming.js)
        { sheet: "Swing_Hoe", tool: 2, frames: 32, impact: 18, hold: 2, reach: 5, hit: [5, 6, 6, 7] },         // 5: hoe (Farming.js)
        { sheet: "Swing_Crouch", tool: -1, frames: 44, impact: 20, hold: 8, reach: 0, hit: [5, 5, 5, 5] },     // 6: crouch (Farming.js: sowing, harvest, collecting)
        // 7: hammer (Farming.js: building sites), a two-handed overhead swing
        { sheet: "Swing_Hammer", tool: 3, frames: 30, impact: 18, hold: 3, reach: 3, hit: [6, 6, 6, 6] },
        // 8: fishing rod (Farming.js): the rod is drawn back and flicked forward (impact), then the last frame is
        // held until the swing ends, which is as long as the player stays locked (Farming.js: goFishing, 22 + 130 game frames)
        { sheet: "Swing_Rod", tool: 4, frames: 152, impact: 22, hold: 130, reach: 0, hit: [10, 10, 10, 10] },
        // 9: sling (Hunting.js): the sling is whirled over the head and flung forward; the stone leaves on the impact frame
        { sheet: "Swing_Sling", tool: -1, frames: 60, impact: 40, hold: 4, reach: 0, hit: [11, 10, 10, 10] },
        // 10: bow (Hunting.js): the bow is raised, the string drawn back and held, then let go on the impact frame
        { sheet: "Swing_Bow", tool: -1, frames: 54, impact: 36, hold: 6, reach: 0, hit: [11, 11, 11, 11] },
        // 11: sitting down by a fire (Farming.js, resting at a campfire): sits down, stays seated (the rest happens on the impact frame), stands up
        { sheet: "Swing_Sit", tool: -1, frames: 130, impact: 36, hold: 58, reach: 0, hit: [12, 12, 12, 12] },
        // 12: sitting by the fire with a roasting stick (Farming.js, the campfire's roasting recipes): the food is put over the fire on the impact frame
        // (the player stays seated on the impact frame for as long as opts.holdWhile says, see startToolSwing)
        { sheet: "Swing_Roast", tool: -1, frames: 82, impact: 36, hold: 8, reach: 0, hit: [12, 12, 12, 12] },
        // 13: sitting beside a tripod with the food hanging from it (hands free: the same sheet as the plain sitting), same timing as 12
        { sheet: "Swing_Sit", tool: -1, frames: 82, impact: 36, hold: 8, reach: 0, hit: [12, 12, 12, 12] },
        // 14: lying down flat on the ground to rest (Farming.js, "Odpocznij na ziemi"): sinks down onto their
        // side, stays lying (the rest happens on the impact frame), then stands back up
        { sheet: "Swing_LieDown", tool: -1, frames: 125, impact: 40, hold: 50, reach: 0, hit: [10, 10, 10, 10] },
        // 15: a spear jab (Hunting.js): the spear is drawn back and driven forward with a lunge; the hit lands on the impact frame
        { sheet: "Swing_Spear", tool: -1, frames: 32, impact: 14, hold: 4, reach: 8, hit: [5, 5, 5, 5] },
        // 16: the dodge roll (Combat.js, Space): squat, tuck, roll over, land, stand - as long as Combat's roll (22 frames); the
        // hero moves along by himself (no reach). Built from Swing_Crouch: its squat turned over in 90-degree steps
        { sheet: "Swing_Roll", tool: -1, frames: 22, impact: 1, hold: 0, reach: 0, hit: [0, 0, 0, 0] },
        // 17: knocked down (Combat.js: a blow too strong to stand): the lying-down sheet played fast - falls, lies, gets up (50 frames)
        { sheet: "Swing_LieDown", name: "knockdown", tool: -1, frames: 50, impact: 9, hold: 22, reach: 0, hit: [10, 10, 10, 10] },
        // 18: the club (Combat.js): a quick one-handed blow - raised over the shoulder, brought down in front, back on the shoulder
        { sheet: "Swing_Club", tool: -1, frames: 22, impact: 11, hold: 2, reach: 3, hit: [4, 5, 5, 4] },
        // 19: a punch (Combat.js, no weapon): fists up, a step, a straight punch, back
        { sheet: "Swing_Punch", tool: -1, frames: 18, impact: 8, hold: 2, reach: 2, hit: [3, 4, 4, 4] }
    ];
    const SWING_KIND = { log: 0, rock: 1, stump: 2, fall: 3, bush: 3 };   // bushes: axe from the side
    const SHAKE_FRAMES = 6;
    const TOOL_SIZE = 32;
    const TOOL_PIVOT = { x: 16, y: 27 };
    // [wind-up angle, strike angle] in degrees for each tool (0 = held upright)
    const SWING_ANGLES = [[-70, 80], [-80, 85], [-30, 65], [-85, 70], [-75, 30]];
    const STRIP_HEIGHT = 6;
    const KICK_PIXELS = 7;
    const FLASH_FRAMES = 14;
    const FLASH_ALPHA = 170;
    const FALL_FRAMES = 55;

    function swingKind(kind) {
        return SWING_KINDS[kind] || SWING_KINDS[0];
    }

    const easeOut = x => 1 - (1 - x) * (1 - x);
    const easeIn = x => x * x;
    const easeInOut = x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    const clamp01 = x => Math.max(0, Math.min(1, x));

    // Pose of the tool at swing time f (0..1): its angle in radians (positive =
    // clockwise, before mirroring for the facing) and how far the body lunges
    // forward (0..1, peaking on the strike).
    function swingPose(f, tool) {
        const [windup, strike] = SWING_ANGLES[tool] || SWING_ANGLES[0];
        let deg;
        if (f < 0.42) deg = windup * easeOut(f / 0.42);
        else if (f < 0.5) deg = windup;
        else if (f < 0.6) deg = windup + (strike - windup) * easeIn((f - 0.5) / 0.1);
        else deg = strike * (1 - easeInOut(clamp01((f - 0.6) / 0.4)));
        return { angle: (deg * Math.PI) / 180, lunge: Math.sin(Math.PI * clamp01((f - 0.42) / 0.4)) };
    }

    // How far a falling tree has tipped over, 0 (upright) to 1 (flat on the
    // ground). It accelerates like a real fall. The same value drives the tilt
    // and the transparency, so the lower the tree gets the more it fades and
    // it is gone exactly when it reaches the ground.
    function fallTilt(frames) {
        const p = Math.min(1, frames / FALL_FRAMES);
        return p * p;
    }
    const BREAK_FRAMES = { stump: 28, rock: 30, log: 24, bush: 22 };

    const configCaches = { Tree: new WeakMap(), Rock: new WeakMap(), Stump: new WeakMap(), Log: new WeakMap(), Bush: new WeakMap() };

    // Reads <Tag:key=value,...> from the event note. Returns null when the
    // event has no such tag (and whenNoTag is not set); otherwise the defaults
    // overridden by the note. whenNoTag: what an event without the tag gets, e.g.
    // for a picture that is known to be a bush or a rock.
    function readConfig(event, tag, defaults, whenNoTag) {
        const cache = configCaches[tag];
        if (cache.has(event)) return cache.get(event);
        const data = event.event();
        const m = data ? new RegExp("<" + tag + "(?::\\s*([^>]*))?>", "i").exec(data.note || "") : null;
        let cfg = null;
        if (m || whenNoTag) {
            cfg = Object.assign({}, m ? defaults : whenNoTag);
            for (const pair of m ? (m[1] || "").split(",") : []) {
                const [key, value] = pair.split("=").map(s => s.trim().toLowerCase());
                if (key in cfg && value !== undefined && isFinite(Number(value))) {
                    cfg[key] = Number(value);
                }
            }
        }
        cache.set(event, cfg);
        return cfg;
    }
    const treeConfig = event => readConfig(event, "Tree", TREE_DEFAULTS);

    // ---- fruit trees: a Tree that also carries fruit while standing (wild apple / pear). Picking
    // the fruit (self-switch C on) is the only way to make it choppable; it grows back after some
    // days, only in season. $gameSystem._treeFruit = { "mapId:eventId": dayItWasPicked }
    function treeFruitStore() {
        if (!$gameSystem._treeFruit) $gameSystem._treeFruit = {};
        return $gameSystem._treeFruit;
    }
    const fruitKey = event => event._mapId + ":" + event._eventId;
    function fruitSeasonNow() {
        if (!(window.Farming && Farming.seasonIndex)) return true;   // no Farming.js loaded: no season gate
        const s = Farming.seasonIndex($gameSystem.dayNightDay());
        return s >= FRUIT_SEASON_FROM && s <= FRUIT_SEASON_TO;
    }
    // should self-switch C be OFF (fruiting) right now?
    function shouldFruit(event, cfg) {
        if (!cfg || !cfg.fruit || !fruitSeasonNow()) return false;
        const picked = treeFruitStore()[fruitKey(event)];
        return picked === undefined || $gameSystem.dayNightDay() - picked >= FRUIT_REGROW_DAYS;
    }
    // keeps self-switch C in sync with shouldFruit() before the event's page is (re)picked
    function syncFruitSwitch(event) {
        const cfg = treeConfig(event);
        if (!cfg || !cfg.fruit) return;
        const want = !shouldFruit(event, cfg);   // C on = bare
        if ($gameSelfSwitches.value([event._mapId, event._eventId, "C"]) !== want) {
            $gameSelfSwitches.setValue([event._mapId, event._eventId, "C"], want);
        }
    }
    const _Game_Event_refresh = Game_Event.prototype.refresh;
    Game_Event.prototype.refresh = function() {
        syncFruitSwitch(this);
        _Game_Event_refresh.call(this);
    };
    // catches regrowth while the player just stands around on the map (refresh() otherwise only
    // runs on map load and self-switch/variable changes, not every time an hour passes)
    let lastFruitHour = -1;
    const _Scene_Map_update_fruit = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update_fruit.call(this);
        if (!$gameSystem || typeof $gameSystem.dayNightHour !== "function") return;
        const h = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour();
        if (h === lastFruitHour) return;
        lastFruitHour = h;
        for (const event of $gameMap.events()) if (treeConfig(event) && treeConfig(event).fruit) event.refresh();
    };
    // ---- a tree struck by lightning (Storm.js) is charred: self-switch D (saved with the game). It stays where it
    // is, black; it falls after half the blows and gives charcoal instead of wood, and so does its stump.
    const isCharred = event => !!event && !!treeConfig(event) && $gameSelfSwitches.value([event._mapId, event._eventId, "D"]);
    // a standing tree lightning can hit: an ordinary one (not a fruit tree), not felled, showing its picture
    function isStandingTree(event) {
        const cfg = treeConfig(event);
        if (!cfg || cfg.fruit) return false;
        const on = ch => $gameSelfSwitches.value([event._mapId, event._eventId, ch]);
        return !on("A") && !on("B") && event.tileId() === 0 && !!event.characterName();
    }
    const strikeableTrees = () => $gameMap.events().filter(e => isStandingTree(e) && !isCharred(e) && !e.isTreeAnimating());
    function charTree(event) {
        if (!isStandingTree(event) || isCharred(event)) return false;
        $gameSelfSwitches.setValue([event._mapId, event._eventId, "D"], true);
        queueFxAt(event, "ember", true);   // sparks out of the crown and burnt leaves drifting down
        queueFxAt(event, "ash", true);
        return true;
    }

    // A "!$Rock_..." / "!$Boulder_..." picture on one of the event's pages, if any.
    function rockGraphic(event) {
        const data = event.event();
        const page = data && data.pages ? data.pages.find(pg => pg.image && ROCK_GRAPHIC.test(pg.image.characterName || "")) : null;
        return page ? page.image.characterName : "";
    }
    const rockConfig = event => {
        const graphic = rockGraphic(event);
        return readConfig(event, "Rock", ROCK_DEFAULTS, graphic ? Object.assign({}, ROCK_DEFAULTS, ROCK_PROFILES[graphic] || SMALL_ROCK) : null);
    };
    const stumpConfig = event => readConfig(event, "Stump", STUMP_DEFAULTS);
    const logConfig = event => readConfig(event, "Log", LOG_DEFAULTS);

    // The "!$Bush_..." picture an event shows (or showed before it was chopped:
    // the first page that has one).
    function bushGraphic(event) {
        const data = event.event();
        const page = data && data.pages ? data.pages.find(pg => pg.image && BUSH_GRAPHIC.test(pg.image.characterName || "")) : null;
        return page ? page.image.characterName : "";
    }
    // <Bush> note, or a bush picture (then the numbers come from BUSH_PROFILES).
    // Not for events that are already a tree, rock, stump or log.
    function bushConfig(event) {
        if (configCaches.Bush.has(event)) return configCaches.Bush.get(event);
        if (treeConfig(event) || rockConfig(event) || stumpConfig(event) || logConfig(event)) {
            configCaches.Bush.set(event, null);
            return null;
        }
        const graphic = bushGraphic(event);
        const defaults = Object.assign({}, BUSH_DEFAULTS, BUSH_PROFILES[graphic]);
        return readConfig(event, "Bush", defaults, graphic ? defaults : null);
    }

    // <Occupy:left=,right=,up=,down=,soft=> from the event note: only the keys that are
    // written there (null when the event has no such tag).
    const occupyTags = new WeakMap();
    function occupyTag(event) {
        if (occupyTags.has(event)) return occupyTags.get(event);
        const data = event.event();
        const m = data ? /<Occupy(?::\s*([^>]*))?>/i.exec(data.note || "") : null;
        let tag = null;
        if (m) {
            tag = {};
            for (const pair of (m[1] || "").split(",")) {
                const [key, value] = pair.split("=").map(s => s.trim().toLowerCase());
                if (["left", "right", "up", "down", "soft"].includes(key) && value !== undefined && isFinite(Number(value))) {
                    tag[key] = Number(value);
                }
            }
        }
        occupyTags.set(event, tag);
        return tag;
    }

    // The tiles the event blocks around its own: from the note, from the graphic
    // it currently shows, or both (null = just its own tile).
    function occupyConfig(event, graphicName) {
        const tag = occupyTag(event);
        const graphic = SOLID_GRAPHICS[graphicName === undefined ? event.characterName() : graphicName];
        if (!tag && !graphic) return null;
        return Object.assign({ left: 0, right: 0, up: 0, down: 0, soft: 0 }, graphic, tag);
    }

    function isInsideArea(event, o, x, y) {
        return x >= event.x - o.left && x <= event.x + o.right && y >= event.y - o.up && y <= event.y + o.down;
    }

    // An edge tile of a soft object: it reacts to the action button but does not block.
    // Objects too small to have an inner part stay solid.
    function isSoftTile(event, o, x, y) {
        const s = o.soft;
        if (!s || !isInsideArea(event, o, x, y)) return false;
        const left = event.x - o.left, right = event.x + o.right, top = event.y - o.up, bottom = event.y + o.down;
        if (right - left + 1 <= 2 * s || bottom - top + 1 <= 2 * s) return false;
        return x < left + s || x > right - s || y < top + s || y > bottom - s;
    }

    // The tile of the event nearest to the player: where the tool actually hits.
    function targetTile(event) {
        const o = occupyConfig(event);
        if (!o) return { x: event.x, y: event.y };
        if (isInsideArea(event, o, $gamePlayer.x, $gamePlayer.y)) {
            // standing on a soft edge tile: the tool hits the tile he is facing
            const d = $gamePlayer.direction();
            const fx = $gamePlayer.x + (d === 6 ? 1 : d === 4 ? -1 : 0), fy = $gamePlayer.y + (d === 2 ? 1 : d === 8 ? -1 : 0);
            if (isInsideArea(event, o, fx, fy)) return { x: fx, y: fy };
        }
        return {
            x: Math.max(event.x - o.left, Math.min(event.x + o.right, $gamePlayer.x)),
            y: Math.max(event.y - o.up, Math.min(event.y + o.down, $gamePlayer.y))
        };
    }
    const anyHarvestConfig = event => treeConfig(event) || rockConfig(event) || stumpConfig(event) || logConfig(event) || bushConfig(event);

    function playSe(name, pitch) {
        AudioManager.playSe({ name, volume: 90, pitch, pan: 0 });
    }

    const _Game_Event_pos = Game_Event.prototype.pos;
    Game_Event.prototype.pos = function(x, y) {
        if (_Game_Event_pos.call(this, x, y)) return true;
        const occupy = occupyConfig(this);
        return !!occupy && x >= this.x - occupy.left && x <= this.x + occupy.right &&
            y >= this.y - occupy.up && y <= this.y + occupy.down;
    };

    const _Game_Event_posNt = Game_Event.prototype.posNt;
    Game_Event.prototype.posNt = function(x, y) {
        if (!_Game_Event_posNt.call(this, x, y)) return false;
        const occupy = occupyConfig(this);
        return !(occupy && isSoftTile(this, occupy, x, y));
    };

    // One press, one thing: where a wide bush reaches over a rock (or two such things overlap) the button started both, and every
    // press - and held O - struck one and then the other (the user). Now only the one standing on that tile is struck, else the nearest.
    const _Game_Player_startMapEvent = Game_Player.prototype.startMapEvent;
    Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
        const fits = e => e.isTriggerIn(triggers) && e.isNormalPriority() === normal;
        const things = $gameMap.isEventRunning() ? [] : $gameMap.eventsXy(x, y).filter(e => fits(e) && anyHarvestConfig(e));
        if (things.length < 2) return _Game_Player_startMapEvent.call(this, x, y, triggers, normal);
        const far = e => Math.abs(e.x - x) + Math.abs(e.y - y);
        const pick = things.reduce((a, b) => (far(b) < far(a) ? b : a));
        for (const event of $gameMap.eventsXy(x, y)) {
            if (fits(event) && (event === pick || !anyHarvestConfig(event))) event.start();
        }
    };

    // A bush or rock event made of nothing but a picture needs no commands: the
    // action button chops / mines it. (An event with its own commands keeps them.)
    const BUSH_COMMANDS = [
        { code: 357, indent: 0, parameters: [pluginName, "chop", "Ściąć krzak", {}] },
        { code: 0, indent: 0, parameters: [] }
    ];
    const ROCK_COMMANDS = [
        { code: 357, indent: 0, parameters: [pluginName, "mine", "Uderz w kamień", {}] },
        { code: 0, indent: 0, parameters: [] }
    ];
    const _Game_Event_list = Game_Event.prototype.list;
    Game_Event.prototype.list = function() {
        const list = _Game_Event_list.call(this);
        if (list && list.length <= 1 && (this._characterName || this._tileId > 0)) {
            if (rockConfig(this)) return ROCK_COMMANDS;
            if (bushConfig(this)) return BUSH_COMMANDS;
        }
        return list;
    };

    // A chopped bush or a mined rock without a page of its own for that (a page
    // waiting for self-switch A) just disappears, also when the map is loaded again.
    const _Game_Event_findProperPageIndex = Game_Event.prototype.findProperPageIndex;
    Game_Event.prototype.findProperPageIndex = function() {
        const index = _Game_Event_findProperPageIndex.call(this);
        if (index < 0 || !(rockConfig(this) || bushConfig(this))) return index;
        const conditions = this.event().pages[index].conditions;
        if (conditions.selfSwitchValid && conditions.selfSwitchCh === "A") return index;
        return $gameSelfSwitches.value([this._mapId, this._eventId, "A"]) ? -1 : index;
    };

    Game_Event.prototype.isTreeAnimating = function() {
        return this._treeShake > 0 || this._treeFallT >= 0 || this._breakT >= 0 ||
            this._swingT >= 0 || !!this._pendingAction;
    };

    const _Game_Event_update = Game_Event.prototype.update;
    Game_Event.prototype.update = function() {
        _Game_Event_update.call(this);
        this.updateTreeAnimation();
    };

    Game_Event.prototype.updateTreeAnimation = function() {
        if (this._treeShake > 0) {
            this._treeShake--;
        }
        if (this._swingT >= 0) {
            const swing = swingKind(this._swingKind);
            this._swingT += this._swingRate || 1;   // (Zręczność: a quicker swing, workSpeed)
            if (!this._hitLanded && this._swingT >= swing.impact && this._pendingAction) {
                this._hitLanded = true;
                applyPendingAction(this);
            }
            if (this._swingT >= swing.frames) {
                this._swingT = -1;
                if ($gamePlayer._swingEvent === this) $gamePlayer._swingEvent = null;
                const h = $gamePlayer._holdStrike;
                if (h && h.id === this._eventId && h.map === this._mapId) h.t = Math.max(2, Math.round(HOLD_PAUSE / (this._swingRate || 1)));   // held O: the next blow soon
            }
        }
        if (this._treeGone && ++this._treeGoneFrames > 3) {
            this.releaseInvisibleHold();
        }
        if (this._treeFallT >= 0) {
            this._treeFallT++;
            if (this._treeFallT >= FALL_FRAMES) {
                playSe(FALL_SE, 100);
                this.finishTreeFall();
            }
        }
        if (this._breakT >= 0) {
            this._breakT++;
            const total = BREAK_FRAMES[this._breakKind] || 30;
            const p = Math.min(1, this._breakT / total);
            this.setOpacity(Math.round(255 * (1 - p * p)));
            if (this._breakT >= total) {
                this.finishBreak();
            }
        }
    };

    // ------------------------------------------------------------------
    // Swings for actions that have no event to wait on (Farming.js: raking,
    // hoeing ...). The player cannot move while it plays. onImpact runs on the
    // strike frame, onDone when the swing is over. Returns false (nothing was
    // started) when there is no such kind of swing or the player is busy, so the
    // caller can simply do the action right away.
    // ------------------------------------------------------------------
    // opts (optional): { holdWhile, onWait, onHoldEnd, still, holdAt, keepOnMove, wobble, rate } - after the impact frame the figure stays in that
    // pose for as long as holdWhile() returns true (sitting by the fire until the food is ready); onWait(n) runs every frame of the wait;
    // pressing cancel or a direction key ends the wait early; onHoldEnd(cancelled) runs when it ends. still: no shifting between two poses
    // during the wait. holdAt: wait at this frame instead, BEFORE the impact (aiming the sling: it whirls until F is let go, then the
    // stone leaves); keepOnMove: the direction keys do not end the wait (they turn to another target); wobble: frames per pose shift (22);
    // rate: animation frames a game frame advances (1; more = a quicker swing - the hammer with Zręczność, Farming.js).
    Game_Player.prototype.startToolSwing = function(kind, onImpact, onDone, opts) {
        if (!SWING_KINDS[kind] || this._toolSwing || this._swingEvent) return false;
        this._toolSwing = { _swingT: 0, _swingKind: kind, onImpact, onDone, opts: opts || null, _waiting: false, _wait: 0 };
        this._swingEvent = this._toolSwing;
        return true;
    };

    Game_Player.prototype.isToolSwinging = function() {
        return !!this._toolSwing;
    };

    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        _Game_Player_update.call(this, sceneActive);
        if (sceneActive) updateHoldStrike(this);
        const swing = this._toolSwing;
        if (!swing) return;
        const rate = swing.opts && swing.opts.rate > 0 ? swing.opts.rate : 1;
        swing._acc = (swing._acc || 0) + rate;
        while (swing._acc >= 1 && this._toolSwing === swing) {   // (rate 1: exactly one step a frame, as always)
            swing._acc -= 1;
            if (this.stepToolSwing(swing) === "hold") { swing._acc = 0; break; }
        }
    };
    // one frame of the swing's animation; "hold" while the pose is held
    Game_Player.prototype.stepToolSwing = function(swing) {
        const def = swingKind(swing._swingKind), opts = swing.opts;
        if (swing._waiting) {   // holding the pose until the action is over
            const cancelled = Input.isTriggered("cancel") || (!opts.keepOnMove && Input.dir4 !== 0);
            if (!cancelled && opts.holdWhile()) {
                swing._wait++;
                if (opts.onWait) opts.onWait(swing._wait);
                return "hold";
            }
            swing._waiting = false;
            swing._cancelled = cancelled;
            if (opts.onHoldEnd) opts.onHoldEnd(cancelled);
        }
        swing._swingT++;
        if (opts && opts.holdAt && swing._swingT === opts.holdAt && opts.holdWhile && opts.holdWhile()) swing._waiting = true;   // waits before the impact
        if (swing._swingT === def.impact) {
            if (swing._cancelled) { this._toolSwing = null; if (this._swingEvent === swing) this._swingEvent = null; return; }   // aiming cancelled: no shot
            if (swing.onImpact) swing.onImpact();
            if (opts && !opts.holdAt && opts.holdWhile && opts.holdWhile()) swing._waiting = true;
        }
        if (swing._swingT >= def.frames) {
            this._toolSwing = null;
            if (this._swingEvent === swing) this._swingEvent = null;
            if (swing.onDone) swing.onDone();
        }
    };

    const _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        return !this._toolSwing && _Game_Player_canMove.call(this);
    };

    // The ground a destroyed object stood on (its base tiles) becomes cleared land
    // that can be raked, ploughed, sown or built on (Farming.js keeps track of it).
    // original: use the picture of the event's first page (what it showed before it
    // was destroyed) to work out how much ground it covered.
    function clearLandUnder(event, original) {
        if (typeof $gameSystem.clearLand !== "function") return;
        const pages = event.event() && event.event().pages;
        const name = original && pages && pages[0] ? pages[0].image.characterName : undefined;
        const o = occupyConfig(event, name) || { left: 0, right: 0, up: 0, down: 0 };
        const tiles = [];
        for (let y = event.y; y <= event.y + o.down; y++) {
            for (let x = event.x - o.left; x <= event.x + o.right; x++) tiles.push({ x, y });
        }
        $gameSystem.clearLand(event._mapId, tiles);
    }

    // Objects that were destroyed before the farming system existed (or in an
    // older save) free their ground too, as soon as the map is set up.
    function isDestroyedHarvest(event) {
        if (!(event instanceof Game_Event)) return false;
        const on = ch => $gameSelfSwitches.value([event._mapId, event._eventId, ch]);
        if (rockConfig(event) || logConfig(event) || bushConfig(event)) return on("A");
        if (stumpConfig(event) || treeConfig(event)) return on("B");   // a felled tree only leaves a stump
        return false;
    }

    const _Game_Map_setupEvents = Game_Map.prototype.setupEvents;
    Game_Map.prototype.setupEvents = function() {
        _Game_Map_setupEvents.call(this);
        if (typeof $gameSystem.clearLand !== "function") return;
        for (const event of this.events()) {
            if (isDestroyedHarvest(event)) clearLandUnder(event, true);
        }
    };

    const rollCount = (min, max) => min + Math.floor(Math.random() * (Math.max(max, min) - min + 1));

    // fixed: the number was already decided (the stones that flew out of the rock)
    // bonusKey: a skill's chance of one piece more (Zbieractwo: "chop.yield", "mine.yield", "forage.yield")
    function giveReward(title, itemId, min, max, fixed, bonusKey) {
        const item = $dataItems[itemId];
        let count = fixed !== undefined ? fixed : rollCount(min, max);
        if (bonusKey && count > 0 && perkRoll(bonusKey)) count++;
        // With SurvivalHUD loaded, gainItem shows a floating "+N item" over the
        // player; without it fall back to plain messages.
        const hasPopups = typeof $gameTemp.pushLootPopup === "function";
        if (!hasPopups) $gameMessage.add(title);
        if (item && count > 0) {
            $gameParty.gainItem(item, count);
            if (!hasPopups) $gameMessage.add("Zdobyto: \\I[" + item.iconIndex + "]" + item.name + " x" + count);
        }
    }

    // The switch that swaps in the next page (stump / empty) is only applied at
    // the start of the NEXT frame. Until then keep the finished object fully
    // transparent so it cannot flash back to its full, upright self for a frame.
    Game_Event.prototype.holdInvisibleUntilPageChange = function() {
        this.setOpacity(0);
        this._treeGone = true;
        this._treeGoneFrames = 0;
    };

    Game_Event.prototype.releaseInvisibleHold = function() {
        this._treeGone = false;
        this.setOpacity(255);
    };

    const _Game_Event_setupPage = Game_Event.prototype.setupPage;
    Game_Event.prototype.setupPage = function() {
        _Game_Event_setupPage.call(this);
        if (this._treeGone) this.releaseInvisibleHold();
    };

    Game_Event.prototype.finishTreeFall = function() {
        this._treeFallT = -1;
        // The sprite keeps the tree gone and the stump preview fully shown until
        // the next frame swaps in the real stump page.
        this._treeGone = true;
        this._treeGoneFrames = 0;
        const cfg = treeConfig(this) || TREE_DEFAULTS;
        if (isCharred(this)) {
            // burnt to the roots: no stump is left (straight to the empty page), the ground under it is free at once
            giveReward("Ścięto zwęglone drzewo!", CHARCOAL, CHARRED_DROP[0], CHARRED_DROP[1]);
            clearLandUnder(this);
            $gameSelfSwitches.setValue([this._mapId, this._eventId, "B"], true);
        } else {
            giveReward("Ścięto drzewo!", cfg.drop, cfg.dropmin, cfg.dropmax, undefined, "chop.yield");
            // a grown pine sheds its cones as it falls (a young planted one has none yet)
            if (isPine(this) && (cfg.scale || 1) >= 0.9 && $dataItems[CONE]) $gameParty.gainItem($dataItems[CONE], 1 + Math.floor(Math.random() * 3));
            if (cfg.nostump) {   // (a seedling: nothing to dig out afterwards)
                clearLandUnder(this);
                $gameSelfSwitches.setValue([this._mapId, this._eventId, "B"], true);
            }
        }
        $gameSelfSwitches.setValue([this._mapId, this._eventId, "A"], true);
    };

    Game_Event.prototype.finishBreak = function() {
        const kind = this._breakKind;
        this._breakT = -1;
        clearLandUnder(this);
        this.holdInvisibleUntilPageChange();
        if (kind === "rock") {
            const cfg = rockConfig(this) || ROCK_DEFAULTS;
            giveReward(cfg.title || "Rozbito kamień!", cfg.drop, cfg.dropmin, cfg.dropmax, this._dropCount, cfg.tool > 0 ? "mine.yield" : "forage.yield");
            if (cfg.tool > 0 && cfg.drop !== IRON_ORE && $dataItems[IRON_ORE] && perkRoll("ore")) $gameParty.gainItem($dataItems[IRON_ORE], 1);   // (Oko na kruszec)
            this._dropCount = undefined;
            $gameSelfSwitches.setValue([this._mapId, this._eventId, "A"], true);
        } else if (kind === "bush") {
            const cfg = bushConfig(this) || BUSH_DEFAULTS;
            giveReward("Ścięto krzak!", cfg.drop, cfg.dropmin, cfg.dropmax, undefined, "chop.yield");
            $gameSelfSwitches.setValue([this._mapId, this._eventId, "A"], true);
        } else if (kind === "log") {
            const cfg = logConfig(this) || LOG_DEFAULTS;
            giveReward(cfg.tool > 0 ? "Rozrąbano kłodę!" : "Zebrano drewno!", cfg.drop, cfg.dropmin, cfg.dropmax, undefined, cfg.tool > 0 ? "chop.yield" : "forage.yield");
            $gameSelfSwitches.setValue([this._mapId, this._eventId, "A"], true);
        } else if (isCharred(this)) {   // (only a stump left by a charred tree felled before they stopped leaving one)
            giveReward("Wykopano zwęglony pieniek!", CHARCOAL, CHARRED_STUMP_DROP[0], CHARRED_STUMP_DROP[1]);
            $gameSelfSwitches.setValue([this._mapId, this._eventId, "B"], true);
        } else {
            const cfg = treeConfig(this) || stumpConfig(this) || STUMP_DEFAULTS;
            giveReward("Wykopano pieniek!", cfg.digdrop, cfg.digmin, cfg.digmax, undefined, "chop.yield");
            $gameSelfSwitches.setValue([this._mapId, this._eventId, "B"], true);
        }
    };

    // What a command does depends on the event's tag: <Log> / <Tree> for chop,
    // <Tree> / <Stump> for dig, <Rock> for mine.
    function strikeSetup(event, kind) {
        if (kind === "chop") {
            const log = logConfig(event);
            if (log) {
                return { tool: log.tool, needed: log.hits, cost: log.tool > 0 ? log.cost : 0, se: log.tool > 0 ? CHOP_SE : PICKUP_SE, finish: "log",
                    missing: "Potrzebujesz siekiery" };
            }
            const tree = treeConfig(event);
            const bush = !tree && bushConfig(event);
            if (bush) {
                return { tool: bush.tool, needed: bush.hits, cost: bush.cost, se: BUSH_SE, finish: "bush", bare: !!bush.bare,
                    missing: "Potrzebujesz siekiery" };
            }
            const cfg = tree || TREE_DEFAULTS;
            const charred = isCharred(event);   // brittle: half the blows, black chips and ash instead of wood and leaves
            return { tool: cfg.axe, needed: charred ? CHARRED_HITS : cfg.hits, cost: cfg.cost, se: CHOP_SE, finish: "fall",
                fx: charred ? ["char"] : null, fallFx: charred ? "ash" : "leaf", missing: "Potrzebujesz siekiery" };
        }
        if (kind === "dig") {
            const treeCfg = treeConfig(event);
            const cfg = treeCfg || stumpConfig(event) || STUMP_DEFAULTS;
            return { tool: cfg.shovel, needed: cfg.digs, cost: treeCfg ? treeCfg.digcost : cfg.cost, se: DIG_SE, finish: "stump",
                missing: "Potrzebujesz łopaty" };
        }
        const cfg = rockConfig(event) || ROCK_DEFAULTS;
        return { tool: cfg.tool, needed: cfg.hits, cost: cfg.cost, se: cfg.tool > 0 ? MINE_SE : PICKUP_SE, finish: "rock",
            missing: "Potrzebujesz kilofa" };
    }

    // A forged iron axe (115) / pickaxe (116), made in the forge (Farming.js), REPLACES the plain tool: it works
    // on its own (the old axe / pickaxe may be gone) and is clearly better - about a third fewer blows and a
    // little less stamina per blow. The first blow on every object says how much it saved.
    const IRON_HIT_FACTOR = 0.65;
    const IRON_ITEM = { axe: 115, pick: 116 };
    function ironTool(tool) {
        const id = tool > 0 && tool === TREE_DEFAULTS.axe ? IRON_ITEM.axe : tool > 0 && tool === ROCK_DEFAULTS.tool ? IRON_ITEM.pick : 0;
        const item = id ? $dataItems[id] : null;
        return item && $gameParty.hasItem(item) ? item : null;
    }
    function ownsTool(tool) {
        return $gameParty.hasItem($dataItems[tool]) || !!ironTool(tool);
    }
    function applyIronTool(action) {
        const item = ironTool(action.tool);
        if (!item) return;
        const before = action.needed;
        action.needed = Math.max(1, Math.round(before * IRON_HIT_FACTOR));
        if (action.cost > 1) action.cost = Math.max(1, Math.round(action.cost * 0.75));
        action.ironItem = item;
        action.ironFrom = before;
    }
    // the hero's skills (Combat.js, Skills_Data.js): perk(key) = what the learnt skills add up to for an effect, perkRoll(key) = a
    // roll against it (a chance), knowsSkill(id) = that one skill is learnt
    const perk = key => (window.Combat && Combat.perk ? Combat.perk(key) : 0);
    const perkRoll = key => { const c = perk(key); return c > 0 && Math.random() < c; };
    const knowsSkill = id => !!(window.Combat && Combat.hasSkill && Combat.hasSkill(id));
    const IRON_ORE = 85;
    // Zbieractwo: fewer blows and less strength for chopping, digging out stumps and mining; picking up by hand is free ("Szybkie ręce")
    function applySkills(action) {
        if (action.tool > 0) {
            // Siła a little (Combat.gatherBonus: 0.5% a point over 5), the Zbieractwo skills a lot
            const str = window.Combat && Combat.gatherBonus ? Combat.gatherBonus() : 0;
            const fewer = Math.min(0.75, perk(action.finish === "rock" ? "mine.hits" : "chop.hits") + str);
            if (fewer > 0) action.needed = Math.max(1, Math.round(action.needed * (1 - fewer)));
            if (action.cost > 0) action.cost = Math.max(0.5, action.cost * (1 - Math.min(0.75, perk("gather.cost"))));
        } else if (knowsSkill("g_quick")) action.cost = 0;
    }
    // Held O at a tree, a bush, a log, a stump or a rock: a moment after each blow (sooner with Zręczność) the next one - for as long as
    // it is held and he stands where he stood; it stops when the thing falls or breaks, or he is too tired (the popup says so).
    const HOLD_PAUSE = 12;   // frames between two blows at the usual speed
    const SLOW_SWING = { fall: 0.5, rock: 0.5 };   // chopping a standing tree (axe) and mining a rock or ore (pickaxe) go at half the speed (the swing and the pause; the user's)
    const workSpeed = () => (window.Combat && Combat.workSpeed ? Combat.workSpeed() : 1);
    function updateHoldStrike(p) {
        const h = p._holdStrike;
        if (!h || !(h.t > 0) || --h.t > 0) return;
        const e = h.map === $gameMap.mapId() ? $gameMap.event(h.id) : null;
        if (!e || !Input.isPressed("ok") || p.x !== h.x || p.y !== h.y || p.direction() !== h.d ||
            e._treeFallT >= 0 || e._breakT >= 0 || e._treeGone || $gameMessage.isBusy() || $gameTemp._farmMenuOpen) { p._holdStrike = null; return; }
        if (e.isTreeAnimating() || $gameMap.isEventRunning() || p.isMoving() || p._toolSwing || p._swingEvent) { h.t = 1; return; }   // (the shake, the event: a frame more)
        p._holdStrike = null;
        e.start();
    }
    function blowsText(n) {
        return n + (n === 1 ? " uderzenie" : n < 5 ? " uderzenia" : " uderzeń");
    }

    // What is missing (a tool, strength) is always said by a popup over the player - the same as the messages of
    // Farming.js - and never by the message window. (Only without the popup layer does it fall back to the window.)
    function needPopup(icon, text) {
        if ($gameTemp && typeof $gameTemp.pushLootPopup === "function") $gameTemp.pushLootPopup(icon, text, "#ff9f8f");
        else $gameMessage.add(text);
    }

    function strike(interpreter, kind) {
        const event = $gameMap.event(interpreter._eventId);
        if (!event || event.isTreeAnimating()) return;
        const action = strikeSetup(event, kind);
        applyIronTool(action);
        applySkills(action);
        if (action.tool > 0 && !ownsTool(action.tool)) {
            needPopup($dataItems[action.tool] ? $dataItems[action.tool].iconIndex : 0, action.missing);
            return;
        }
        if (action.cost > 0 && typeof $gameSystem.trySpendStamina === "function" && !$gameSystem.trySpendStamina(action.cost)) {
            needPopup(82, "Jesteś zbyt zmęczony");
            return;
        }
        if (action.tool > 0 && window.Durability) Durability.use(action.ironItem ? action.ironItem.id : action.tool);   // one blow wears the tool
        event._pendingAction = action;
        if (action.tool > 0) {
            // Swing the tool; the hit itself lands on the strike frame.
            event._swingKind = SWING_KIND[action.finish];
            event._swingT = 0;
            event._swingRate = workSpeed() * (SLOW_SWING[action.finish] || 1);   // (a standing tree, a rock: slower, the user's)
            event._hitLanded = false;
            $gamePlayer._swingEvent = event;
            $gamePlayer._holdStrike = { id: event.eventId(), map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction(), t: 0 };   // (ids: nothing big in a save)
        } else {
            applyPendingAction(event);   // picking something up by hand: no swing
        }
        interpreter.setWaitMode("treeAnimation");
    }

    // ------------------------------------------------------------------
    // Hit effects: chips, sparks, dirt and leaves flying off the target when a
    // tool connects. The game side only queues them in $gameTemp._hitFx; the
    // layer at the end of this file turns them into little falling squares.
    // ------------------------------------------------------------------
    const BARE_BUSH_FX = ["drytwig", "twig"];   // leafless: dry twigs, no green leaves
    const FX_BY_FINISH = { fall: ["wood"], log: ["wood"], rock: ["rock", "spark"], stump: ["dirt"], bush: ["bushleaf", "twig"] };
    // count / final: particles per hit / on the last hit. speed, lift: sideways
    // and upward speed (px per frame), gravity, life (frames), size (px).
    const FX_TYPES = {
        wood: { colors: ["#e2bd7f", "#c99a5b", "#9a6a35", "#f3dfae"], count: 7, final: 13, speed: [0.6, 2.2], lift: [1.4, 3.4], gravity: 0.22, life: [26, 40], size: [2, 3], oy: -26 },
        rock: { colors: ["#b8bdc2", "#8f959b", "#d6d9dc", "#6b7075"], count: 6, final: 12, speed: [0.5, 2.0], lift: [1.2, 3.0], gravity: 0.24, life: [24, 36], size: [2, 3], oy: -18 },
        spark: { colors: ["#fff3b0", "#ffd45c", "#ffffff"], count: 5, final: 9, speed: [1.5, 3.6], lift: [0.5, 2.6], gravity: 0.12, life: [8, 14], size: [1, 2], oy: -18 },
        dirt: { colors: ["#5b3e27", "#79532f", "#3e2a1b", "#8a6a45"], count: 6, final: 12, speed: [0.4, 1.7], lift: [1.0, 2.6], gravity: 0.25, life: [24, 34], size: [2, 3], oy: -6 },
        leaf: { colors: ["#3f6b34", "#557f3c", "#2f5229", "#7f9a4a"], count: 12, final: 12, speed: [0.1, 0.9], lift: [-0.3, 0.6], gravity: 0.04, life: [46, 70], size: [2, 2], oy: -78, spread: 22 },
        bushleaf: { colors: ["#3f6b34", "#557f3c", "#2f5229", "#7f9a4a", "#93b653"], count: 7, final: 15, speed: [0.4, 2.2], lift: [0.5, 2.4], gravity: 0.09, life: [34, 56], size: [2, 3], oy: -20, spread: 14 },
        // dry twigs of the leafless thickets
        drytwig: { colors: ["#5f4e42", "#70614f", "#483b39", "#9d8371", "#7e674f"], count: 9, final: 18, speed: [0.6, 2.6], lift: [1.2, 3.2], gravity: 0.24, life: [28, 44], size: [2, 3], oy: -18, spread: 16 },
        twig: { colors: ["#7a5a34", "#9a7443", "#5e4326", "#b08a52"], count: 3, final: 8, speed: [0.6, 2.0], lift: [1.2, 2.8], gravity: 0.22, life: [24, 38], size: [2, 3], oy: -14, spread: 8 },
        // a tree struck by lightning (Storm.js): sparks out of the crown, burnt leaves and ash drifting down; chopping it, black chips (a spark now and then)
        ember: { colors: ["#ffd45c", "#ff9a2e", "#fff3b0", "#ff6a1a"], count: 10, final: 24, speed: [0.3, 2.2], lift: [0.8, 2.8], gravity: 0.06, life: [30, 60], size: [1, 2], oy: -92, spread: 24 },
        ash: { colors: ["#2a2622", "#3b3530", "#1c1a18", "#55504a"], count: 10, final: 16, speed: [0.1, 0.9], lift: [-0.3, 0.6], gravity: 0.04, life: [46, 70], size: [2, 2], oy: -78, spread: 22 },
        char: { colors: ["#1f1b18", "#2e2925", "#4a423b", "#141210", "#ff8a2a"], count: 7, final: 13, speed: [0.6, 2.2], lift: [1.4, 3.4], gravity: 0.22, life: [26, 40], size: [2, 3], oy: -26 },
        // whole little stones (the ones you get): they fly out, bounce, lie there for a
        // moment (settle frames, staggered) and then fly to the player
        stone: { pebble: true, count: 2, final: 4, speed: [0.9, 2.4], lift: [2.0, 3.0], gravity: 0.5, life: [0, 0], size: [6, 6], oy: -26, spread: 10, bounce: 0.42, settle: 30 }
    };
    const FX_MAX_PARTICLES = 140;
    const FX_MAX_PEBBLES = 12;

    // count: how many particles (otherwise the type's own number)
    function queueHitFx(event, type, final, count) {
        if (typeof $gameTemp === "undefined" || !$gameTemp) return;
        if (!$gameTemp._hitFx) $gameTemp._hitFx = [];
        // The effect starts on the side of the target that faces the player
        // (of the tile of a big object that is nearest to the player).
        const tile = targetTile(event);
        $gameTemp._hitFx.push({
            type, final: !!final, count,
            bx: tile.x + 0.5, by: tile.y + 1,
            dx: Math.sign(tile.x - $gamePlayer.x), dy: Math.sign(tile.y - $gamePlayer.y)
        });
    }

    // the same, from the object itself rather than from the side the player hits it (lightning)
    function queueFxAt(event, type, final, count) {
        if (typeof $gameTemp === "undefined" || !$gameTemp) return;
        if (!$gameTemp._hitFx) $gameTemp._hitFx = [];
        $gameTemp._hitFx.push({ type, final: !!final, count, bx: event.x + 0.5, by: event.y + 1, dx: 0, dy: 0 });
    }

    function shakeScreen(power, duration) {
        if (typeof $gameScreen !== "undefined" && $gameScreen && $gameScreen.startShake) {
            $gameScreen.startShake(power, 9, duration);
        }
    }

    // The moment the tool connects: sound, knock-back / flash, hit counting and
    // the start of the felling / breaking animation.
    function applyPendingAction(event) {
        const action = event._pendingAction;
        event._pendingAction = null;
        if (!action) return;
        event._treeHits = (event._treeHits || 0) + 1;
        playSe(action.se, 90 + Math.floor(Math.random() * 20));
        event._treeShake = SHAKE_FRAMES;
        event._treeKickAt = Graphics.frameCount;
        // The hit pushes the target away from the player.
        event._treeKickDir = $gamePlayer.x <= event.x ? 1 : -1;
        const last = event._treeHits >= action.needed;
        if (event._treeHits === 1 && action.ironItem && action.ironFrom > action.needed && typeof $gameTemp.pushLootPopup === "function") {
            $gameTemp.pushLootPopup(action.ironItem.iconIndex, action.ironItem.name + ": " + blowsText(action.needed) + " zamiast " + action.ironFrom, "#ffd866");
        }
        for (const type of (action.bare ? BARE_BUSH_FX : action.fx || FX_BY_FINISH[action.finish]) || []) queueHitFx(event, type, last);
        if (action.finish === "rock") shakeScreen(last ? 3 : 2, last ? 14 : 7);
        if (last) {
            event._treeHits = 0;
            if (action.finish === "fall") {
                event._treeFallDir = event._treeKickDir;
                event._treeFallT = 0;
                queueHitFx(event, action.fallFx || "leaf", true);
            } else {
                event._breakKind = action.finish;
                event._breakT = 0;
                if (action.finish !== "bush") playSe(BREAK_SE, 100);
                if (action.finish === "rock") {
                    // the stones you get are decided now and fly out of the rock
                    const cfg = rockConfig(event) || ROCK_DEFAULTS;
                    event._dropCount = rollCount(cfg.dropmin, cfg.dropmax);
                    queueHitFx(event, "stone", true, event._dropCount);
                }
            }
        }
    }
    for (const kind of ["chop", "dig", "mine"]) {
        PluginManager.registerCommand(pluginName, kind, function() {
            strike(this, kind);
        });
    }
    PluginManager.registerCommand(pluginName, "pickFruit", function() {
        const event = $gameMap.event(this._eventId);
        if (!event || event.isTreeAnimating()) return;
        const cfg = treeConfig(event);
        if (!cfg || !cfg.fruit) return;
        giveReward("Zerwano owoce!", cfg.fruit, cfg.fruitmin, cfg.fruitmax);
        playSe(FRUIT_SE, 105);
        treeFruitStore()[fruitKey(event)] = $gameSystem.dayNightDay();
        $gameSelfSwitches.setValue([event._mapId, event._eventId, "C"], true);
    });

    const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === "treeAnimation") {
            const event = $gameMap.event(this._eventId);
            const waiting = !!event && event.isTreeAnimating();
            if (!waiting) {
                this._waitMode = "";
            }
            return waiting;
        }
        return _Game_Interpreter_updateWaitMode.call(this);
    };

    // ------------------------------------------------------------------
    // Rendering: the standing tree is drawn as thin horizontal strips, each shifted sideways by a
    // WHOLE number of pixels taken from a bending curve (trunk pinned at the ground, crown moving most).
    // Whole pixels on purpose. A fractional shift of a smoothed texture blurs the strip, and since the
    // blur depends on the fraction, bands of soft and sharp strips used to run up and down the crown
    // like glowing waves (worst in the evening, when the dark leaf edges blur into light ones). A shift
    // of a whole pixel keeps every strip exactly as sharp as the picture, so the sway only ever moves
    // the crown, it never changes how it looks.
    // ------------------------------------------------------------------

    // How far a strip at relative height h (0 = ground, 1 = top) follows the sway of the crown.
    function bendProfile(h) {
        return Math.pow(h, 1.7);
    }

    // The second, quicker bend of a springy trunk: the middle leans one way while the very top whips the other.
    function whipProfile(h) {
        return 1.6 * h * h * (1 - 1.6 * h);
    }

    // The wind on one tree right now. Gusts sweep across the map (their strength depends on the tree's x, so
    // neighbouring trees lean together), the crown lags the trunk only a little and no ripple runs up the tree.
    // In a storm (Storm.js: wind 0..1) the trees bend up to three times as far, lean hard downwind and shake faster; its clock
    // runs faster with the wind (a clock, not frameCount times a factor, so a rising wind never makes the trees jump).
    function treeWind(event, cfg, treeHeight) {
        if (!(cfg.sway > 0)) return null;
        const storm = window.Storm, W = storm ? storm.wind() : 0;
        const t = storm ? storm.clock() : Graphics.frameCount / 60;
        const w = (2 * Math.PI) / SWAY_CYCLE;
        const phase = event.eventId() * 1.7 + event.x * 0.35;
        const gust = 0.5 + 0.5 * Math.sin((w * t) / 2.7 - event.x * 0.12);   // 0..1
        return {
            amp: treeHeight * Math.tan((cfg.sway * Math.PI) / 180) * (1 + 2 * W),
            lean: 0.6 * gust * (1 + W),        // a gust pushes the whole tree downwind
            swing: 0.3 + 0.6 * gust,           // and the main swing grows with it
            whip: 0.2 * (0.4 + 0.6 * gust) * (1 + 1.5 * W),   // the quick shiver of the crown
            swingPhase: w * t + phase,
            whipPhase: 2.7 * w * t + 1.7 * phase
        };
    }

    // Horizontal offset (px, not yet rounded) of a strip at relative height h.
    function treeOffset(event, wind, h) {
        let d = 0;
        if (wind) {
            const swing = Math.sin(wind.swingPhase - 0.35 * h);
            const whip = Math.sin(wind.whipPhase - 0.6 * h);
            d += wind.amp * (bendProfile(h) * (wind.lean + wind.swing * swing) + whipProfile(h) * wind.whip * whip);
        }
        if (event._treeKickAt !== undefined) {
            // The crown reacts a moment after the trunk, then rings out.
            const elapsed = (Graphics.frameCount - event._treeKickAt) / 60 - 0.07 * h;
            if (elapsed > 0 && elapsed < 2) {
                d += (event._treeKickDir || 1) * KICK_PIXELS * Math.exp(-3.2 * elapsed) *
                    Math.sin(2 * Math.PI * 2.3 * elapsed) * bendProfile(h);
            }
        }
        return d;
    }

    function hitFlashAlpha(event) {
        if (event._treeKickAt === undefined) return 0;
        const p = (Graphics.frameCount - event._treeKickAt) / FLASH_FRAMES;
        if (p < 0 || p >= 1) return 0;
        return Math.round(FLASH_ALPHA * (1 - p) * (1 - p));
    }

    Sprite_Character.prototype.isTreeSprite = function() {
        const event = this._character;
        return event instanceof Game_Event && !!treeConfig(event) &&
            this._tileId === 0 && !!this._characterName &&
            !!this.bitmap && this.bitmap.isReady();
    };

    // The standing tree lives in _treeBody (a container: it is what tilts and
    // fades while falling). Under it sits _stumpPreview, which fades in while
    // the tree fades out, so the stump is already there when the tree is gone.
    Sprite_Character.prototype.setTreeBodyVisible = function(visible) {
        if (this._treeBody) {
            this._treeBody.visible = visible;
            this._stumpPreview.visible = visible && this._stumpPreview.alpha > 0;
        }
    };

    Sprite_Character.prototype.ensureTreeStrips = function(frameHeight) {
        if (!this._treeBody) {
            this._stumpPreview = new Sprite();
            this._stumpPreview.anchor.x = 0.5;
            this._stumpPreview.anchor.y = 1;
            this._stumpPreview.alpha = 0;
            this._stumpPreview.visible = false;
            this._treeBody = new Sprite();
            this.addChild(this._stumpPreview);
            this.addChild(this._treeBody);
        }
        if (this._treeStrips && this._treeStripsFor === frameHeight) return;
        if (this._treeStrips) {
            for (const strip of this._treeStrips) {
                this._treeBody.removeChild(strip);
            }
        }
        this._treeStrips = [];
        this._treeStripsFor = frameHeight;
        this._treeFrameKey = null;   // the new strips have no picture frame yet
        for (let row = 0; row < frameHeight; row += STRIP_HEIGHT) {
            const strip = new Sprite();
            strip.anchor.x = 0;
            strip.anchor.y = 0;
            strip._rowStart = row;
            strip._rowHeight = Math.min(STRIP_HEIGHT, frameHeight - row);
            this._treeStrips.push(strip);
            this._treeBody.addChild(strip);
        }
    };

    // The core (pre-ChoppableTree.js) updateFrame, kept so the tree/swing override below can fall
    // through to it. The override itself lives after updateSwingSheet(), further down this file,
    // once both things it chooses between (the tree frame and the swing sheet) are defined - see the
    // comment there for why this used to be two separate overrides.
    const _Sprite_Character_updateFrame = Sprite_Character.prototype.updateFrame;

    Sprite_Character.prototype.updateTreeFrame = function() {
        const event = this._character;
        const cfg = treeConfig(event);
        const scale = (cfg && cfg.scale) || 1;
        const pw = this.patternWidth();
        const ph = this.patternHeight();
        const sx = (this.characterBlockX() + this.characterPatternX()) * pw;
        const sy = (this.characterBlockY() + this.characterPatternY()) * ph;
        // Own texture stays empty; the strips draw the tree. Smoothing is
        // only for the tilt while it falls; the sway itself moves whole pixels.
        this.setFrame(sx, sy, 0, ph);
        this.bitmap.smooth = true;
        this.ensureTreeStrips(ph);
        this._treeBody.visible = true;
        this.updateStumpPreviewFrame(event);
        const wind = treeWind(event, cfg, ph);
        const half = Math.floor(pw / 2);
        // a charred tree draws its strips from a soot-black copy of its picture (a colour tone on the sprite would dull its embers
        // too) - but while it still smoulders it keeps its own picture: the burn creeping down it covers it pixel by pixel
        const charred = isCharred(event), age = charred ? smoulderAge(event) : -1, burning = age >= 0 && age < EMBER_LIFE;
        const sooty = charred && !burning, pic = sooty ? charredBitmap(this.bitmap) : this.bitmap;
        // a new picture resets the strips' frames: set them again. The picture itself is part of the key: a fruit tree swapping its bare
        // sheet for the fruiting one (the same size, so the same sx/sy/pw) would otherwise keep the old frames - and a strip given a
        // bitmap that is still loading gets the WHOLE sheet as its frame once it loads (every row of it: the tree drawn over and over)
        const frameKey = (pic._url || "") + "," + sx + "," + sy + "," + pw + (sooty ? ",c" : "");
        const reframe = this._treeFrameKey !== frameKey;
        this._treeFrameKey = frameKey;
        // scale shrinks (or grows) the whole picture around the foot of the tree (local 0,0): both the
        // strip size and its position get the same factor, so a smaller tree still stands on its own tile.
        // Each strip reaches exactly to the whole pixel where the next one starts: a strip of 6 rows at 0.74 is 4.44 px high, and
        // with its top rounded a gap of up to a pixel was left under it (a line of grass across a young planted pine)
        for (const strip of this._treeStrips) {
            strip.bitmap = pic;
            strip.visible = true;
            if (reframe) strip.setFrame(sx, sy + strip._rowStart, pw, strip._rowHeight);
            const top = Math.round((strip._rowStart - ph) * scale), bottom = Math.round((strip._rowStart + strip._rowHeight - ph) * scale);
            strip.scale.x = scale;
            strip.scale.y = (bottom - top) / strip._rowHeight;
            const h = 1 - (strip._rowStart + strip._rowHeight / 2) / ph;
            strip.x = Math.round((treeOffset(event, wind, h) - half) * scale);
            strip.y = top;
        }
        this.updateEmbers(burning ? age : -1, sx, sy, pw, ph, scale);
    };

    // ---- a charred tree: its picture turned to soot (made once per picture), and the embers smouldering in it
    const charredCache = new Map();
    function charredBitmap(src) {
        const key = src._url || src;
        let out = charredCache.get(key);
        if (out) return out;
        const w = src.width, h = src.height;
        out = new Bitmap(w, h);
        out.blt(src, 0, 0, w, h, 0, 0);
        const ctx = out.context, img = ctx.getImageData(0, 0, w, h), d = img.data;
        for (let i = 0; i < d.length; i += 4) {
            if (!d[i + 3]) continue;
            const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];   // the same as CHARRED_TONE: grey, then darker and a little warm
            d[i] = Math.max(0, l + CHARRED_TONE[0]);
            d[i + 1] = Math.max(0, l + CHARRED_TONE[1]);
            d[i + 2] = Math.max(0, l + CHARRED_TONE[2]);
        }
        ctx.putImageData(img, 0, 0);
        out._baseTexture.update();
        out.smooth = true;   // like the tree picture itself (only the tilt of a falling tree is smoothed)
        out._charred = true;
        charredCache.set(key, out);
        return out;
    }
    // The burn: after the strike the tree does not turn black at once. From the tip, where the bolt hit, a band of embers creeps
    // down it pixel by pixel (a ragged edge, over EMBER_FRONT hours): each pixel of the tree's own shape flares up yellow, cools
    // through orange and red and is left soot-black. Behind the band a few pixels keep smouldering, pulsing slowly, for half an
    // hour after the band has reached the foot (EMBER_LIFE hours after the strike; Storm.js smokes for as long and reads both numbers);
    // then the tree is simply drawn from its charred picture. $gameSystem._smoulder has the hour each tree was struck ("mapId:eventId").
    const EMBER_FRONT = 0.2;   // h: about 12 s at the usual clock speed from the tip to the foot
    const EMBER_SMOULDER = 0.5, EMBER_LIFE = EMBER_FRONT + EMBER_SMOULDER;   // then 30 game minutes of embers and smoke
    const EMBER_SPOTS = 16;   // glowing pixels handed to Storm.js each time the embers are drawn: the smoke rises from them
    const EMBER_COLOURS = [[128, 34, 16], [214, 72, 24], [255, 128, 32], [255, 184, 64], [255, 236, 170]];
    function smoulderAge(event) {
        const store = $gameSystem._smoulder, at = store && store[event._mapId + ":" + event._eventId];
        return at === undefined ? -1 : $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour() - at;
    }
    function emberNoise(j, t) {   // 0..1, the same for the same pixel and moment
        let h = Math.imul(j ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(t + 1, 0xc2b2ae35);
        h ^= h >>> 15;
        h = Math.imul(h, 0x27d4eb2f);
        h ^= h >>> 13;
        return (h >>> 0) / 4294967296;
    }
    // every drawn pixel of this frame of the tree: when the burn reaches it, how fast it cools, its charred colour
    Sprite_Character.prototype.buildEmbers = function(key, sx, sy, pw, ph) {
        this._emberKey = key;
        const tmp = new Bitmap(pw, ph);
        tmp.blt(this.bitmap, sx, sy, pw, ph, 0, 0);
        const src = tmp.context.getImageData(0, 0, pw, ph).data;
        tmp.destroy();
        const rowShows = y => { for (let x = 0; x < pw; x++) if (src[(y * pw + x) * 4 + 3] > 128) return true; return false; };
        let top = 0;   // the tip: the first row with something drawn on it
        while (top < ph && !rowShows(top)) top++;
        const idx = [], ign = [], cool = [], slow = [], soot = [];
        for (let y = top; y < ph; y++) {
            const k = (y - top) / Math.max(1, ph - top);   // 0 at the tip .. 1 at the foot
            for (let x = 0; x < pw; x++) {
                const i = y * pw + x, a = src[i * 4 + 3];
                if (a < 128) continue;
                idx.push(i);
                // (the jitter and the cooling scale with EMBER_FRONT, so the band keeps its thickness whatever its speed)
                ign.push(Math.max(0, k - 0.04) * EMBER_FRONT + Math.random() * 0.045 * EMBER_FRONT);   // a ragged edge: pixel by pixel
                const smoulders = Math.random() < 0.04;   // a few keep glowing long after the band has passed, dying out over the half hour
                slow.push(smoulders ? 1 : 0);
                cool.push(smoulders ? (0.35 + Math.random() * 0.55) * EMBER_SMOULDER : (0.015 + Math.random() * 0.035) * EMBER_FRONT);
                const l = 0.299 * src[i * 4] + 0.587 * src[i * 4 + 1] + 0.114 * src[i * 4 + 2];
                soot.push([Math.max(0, l + CHARRED_TONE[0]), Math.max(0, l + CHARRED_TONE[1]), Math.max(0, l + CHARRED_TONE[2]), a]);
            }
        }
        this._emberSites = { idx, ign, cool, slow, soot, n: idx.length, top };
        if (!this._emberBitmap || this._emberBitmap.width !== pw || this._emberBitmap.height !== ph) {
            this._emberBitmap = new Bitmap(pw, ph);
            this._emberBitmap.smooth = false;
        }
        this._emberImg = this._emberBitmap.context.createImageData(pw, ph);
        if (this._emberStrips) for (const e of this._emberStrips) this._treeBody.removeChild(e);
        this._emberStrips = this._treeStrips.map(strip => {
            const e = new Sprite(this._emberBitmap);
            e.setFrame(0, strip._rowStart, pw, strip._rowHeight);
            this._treeBody.addChild(e);   // over the tree's own strips, moving with them
            return e;
        });
        this._emberTick = -1;
    };
    // the burn at this moment: untouched pixels stay clear (the tree's own picture shows), burning ones glow, burnt ones are soot
    Sprite_Character.prototype.drawEmbers = function(age, tick, ph) {
        const s = this._emberSites, d = this._emberImg.data;
        d.fill(0);
        const fadeFrom = EMBER_FRONT + EMBER_SMOULDER * 0.7;   // the last embers dim out over the end of the smouldering
        const fade = age > fadeFrom ? Math.max(0, 1 - (age - fadeFrom) / (EMBER_SMOULDER * 0.3)) : 1;
        const pw = this._emberBitmap.width, spots = [];
        let lit = 0, sumY = 0;
        for (let j = 0; j < s.n; j++) {
            const dt = age - s.ign[j];
            if (dt < 0) continue;
            const k = s.idx[j] * 4;
            let b = 0;
            if (dt < s.cool[j] * 6) {
                const flare = 0.02 * EMBER_FRONT, heat = dt < flare ? 1 : Math.exp(-(dt - flare) / s.cool[j]);
                // the band shimmers pixel by pixel; the ones left smouldering pulse slowly instead
                b = s.slow[j] ? heat * fade * (0.55 + 0.45 * Math.sin(j * 1.7 + tick * (0.12 + (j % 5) * 0.03)))
                    : heat * (0.72 + 0.28 * emberNoise(j, Math.floor((tick + (j % 3)) / 2)));   // mostly by heat: yellow at the front, then orange, red, black
            }
            if (b >= 0.12) {
                const c = EMBER_COLOURS[b > 0.82 ? 4 : b > 0.62 ? 3 : b > 0.42 ? 2 : b > 0.26 ? 1 : 0];
                d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
                if (b > 0.26) {
                    lit++;
                    sumY += Math.floor(s.idx[j] / pw);
                    // a fair handful of the glowing pixels (reservoir sampling) for the smoke
                    const r = lit <= EMBER_SPOTS ? lit - 1 : Math.floor(Math.random() * lit);
                    if (r < EMBER_SPOTS) spots[r] = { x: s.idx[j] % pw, y: Math.floor(s.idx[j] / pw), b };
                }
            } else {
                const c = s.soot[j];
                d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = c[3];
            }
        }
        this._emberBitmap.context.putImageData(this._emberImg, 0, 0);
        this._emberBitmap._baseTexture.update();
        // for the night layer: how much glows and where (from the foot of the picture, px)
        this._emberGlow = lit > 0 ? { heat: Math.min(1, lit / 80), up: ph - sumY / lit } : null;
        this._emberSpots = spots;
    };
    // age: hours since the strike while it smoulders, -1 otherwise
    Sprite_Character.prototype.updateEmbers = function(age, sx, sy, pw, ph, scale) {
        if (age < 0) {
            if (this._emberStrips) for (const e of this._emberStrips) e.visible = false;
            this._emberGlow = null;
            this._emberSpots = null;
            return;
        }
        const key = sx + "," + sy + "," + pw + "," + ph + "," + this._treeStrips.length;
        if (this._emberKey !== key) this.buildEmbers(key, sx, sy, pw, ph);
        const tick = Math.floor(Graphics.frameCount / 3);
        if (tick !== this._emberTick) {
            this._emberTick = tick;
            this.drawEmbers(age, tick, ph);
        }
        this._emberScale = scale;
        this._treeStrips.forEach((strip, i) => {
            const e = this._emberStrips[i];
            e.visible = true;
            e.x = strip.x;
            e.y = strip.y;
            e.scale.x = strip.scale.x;
            e.scale.y = strip.scale.y;
        });
    };
    // the embers light the dark around them a little (Farming_Render's night layer cuts these holes): where most of them glow now
    function emberLights(spriteset) {
        const out = [];
        for (const s of (spriteset && spriteset._characterSprites) || []) {
            const g = s._emberGlow;
            if (!g || !s._treeBody || !s._treeBody.visible) continue;
            out.push({ x: s.x, y: s.y - g.up * (s._emberScale || 1), r: 40 + 40 * g.heat, i: 0.3 + 0.5 * g.heat, id: 5000 + s._character._eventId });
        }
        return out;
    }
    // where the embers of a smouldering tree glow now, on the screen: [{ x, y, b }] (b: 0.26..1, how hot), [] when nothing glows
    function emberSpots(sprite) {
        const spots = sprite && sprite._emberSpots, bmp = sprite && sprite._emberBitmap;
        if (!spots || !bmp || !sprite._treeBody || !sprite._treeBody.visible) return [];
        const k = sprite._emberScale || 1, half = bmp.width / 2, ph = bmp.height;
        return spots.filter(Boolean).map(p => ({ x: sprite.x + (p.x - half) * k, y: sprite.y - (ph - p.y) * k, b: p.b }));
    }

    // The tile the event turns into after it is felled (its next page's graphic).
    const stumpTileCache = new WeakMap();
    function stumpTileId(event) {
        if (stumpTileCache.has(event)) return stumpTileCache.get(event);
        const data = event.event();
        const page = data ? data.pages.slice(1).find(p => p.image && p.image.tileId > 0) : null;
        const id = page ? page.image.tileId : 0;
        stumpTileCache.set(event, id);
        return id;
    }

    // 0 until the tree has tipped a quarter of the way, fully shown by ~85%.
    function stumpPreviewAlpha(tilt) {
        return Math.max(0, Math.min(1, (tilt - 0.25) / 0.6));
    }

    Sprite_Character.prototype.updateStumpPreviewFrame = function(event) {
        const tileId = stumpTileId(event);
        if (tileId === this._stumpPreviewTile) return;
        this._stumpPreviewTile = tileId;
        const preview = this._stumpPreview;
        if (tileId > 0) {
            const pw = $gameMap.tileWidth();
            const ph = $gameMap.tileHeight();
            preview.bitmap = this.tilesetBitmap(tileId);
            preview.setFrame(((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * pw,
                (Math.floor((tileId % 256) / 8) % 16) * ph, pw, ph);
        } else {
            preview.bitmap = null;
        }
    };

    // the stump of a charred tree is drawn soot-black with a colour tone (the standing tree has its own soot-black picture instead,
    // so that the tone does not dull its embers); the stump that fades in under a falling tree too
    Sprite_Character.prototype.updateCharredTone = function(event) {
        const charred = isCharred(event), toned = charred && !this.isTreeSprite();
        if (toned !== !!this._charredOn) {
            this._charredOn = toned;
            this.setColorTone(toned ? CHARRED_TONE : [0, 0, 0, 0]);
        }
        if (this._stumpPreview && charred !== !!this._charredPreview) {
            this._charredPreview = charred;
            this._stumpPreview.setColorTone(charred ? CHARRED_TONE : [0, 0, 0, 0]);
        }
    };

    const _Sprite_Character_updatePosition = Sprite_Character.prototype.updatePosition;
    Sprite_Character.prototype.updatePosition = function() {
        _Sprite_Character_updatePosition.call(this);
        if (this._character instanceof Game_Event && anyHarvestConfig(this._character)) {
            this.updateTreeEffects(this._character);
            this.updateCharredTone(this._character);
        } else if (this._character === $gamePlayer) {
            this.updateToolSwing();
        }
    };

    // Real swing animation. Every kind of swing has a sheet in img/system (see
    // SWING_KINDS): 4 rows (down, left, right, up), one 96x96 cell per frame,
    // drawn from the same character. While it plays it replaces the walking
    // sprite, so the whole body swings the tool. Without a sheet the tool is
    // drawn over the normal sprite instead (below).
    const SHEET_CELL = 96;
    const SHEET_FEET = { x: 48, y: 80 };   // the point of a cell that stands on the tile
    const SHEET_ROW = { 2: 0, 4: 1, 6: 2, 8: 3 };
    // Which way the body steps toward the target (shorter up / down: the view is low top-down).
    const REACH_VECTOR = { 2: { x: 0, y: 0.7 }, 4: { x: -1, y: 0 }, 6: { x: 1, y: 0 }, 8: { x: 0, y: -0.7 } };

    // Frame to show t game frames into the swing: the wind-up is stretched so the
    // impact frame lands on the strike frame of the swing, then it is held
    // briefly and the recovery frames share the rest of the swing.
    function swingSheetFrame(kind, frames, row, t) {
        const def = swingKind(kind);
        const impact = Math.min(frames - 1, def.hit[row]);
        if (t < def.impact) return Math.floor(t / def.impact * impact);
        if (t < def.impact + def.hold) return impact;
        const after = frames - 1 - impact;
        const k = (t - def.impact - def.hold) / (def.frames - def.impact - def.hold);
        return Math.min(frames - 1, impact + 1 + Math.floor(k * after));
    }

    // 0..1: how far the body has stepped toward the target; full on the strike frame.
    function swingLunge(kind, t) {
        const def = swingKind(kind);
        if (t < def.impact) return easeInOut(clamp01(t / def.impact));
        return 1 - easeInOut(clamp01((t - def.impact - def.hold) / Math.max(1, def.frames - def.impact - def.hold)));
    }

    // "ready", "loading", or "none" when the swing has no sheet (or it failed to load).
    function swingSheetState(kind) {
        const def = SWING_KINDS[kind];
        if (!def || !def.sheet) return "none";
        const bitmap = ImageManager.loadSystem(def.sheet);
        if (bitmap.isError && bitmap.isError()) return "none";
        return bitmap.isReady() ? "ready" : "loading";
    }

    // Load the sheets with the map so the first swing does not have to wait for them.
    const _Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _Scene_Map_create.call(this);
        for (const def of SWING_KINDS) if (def.sheet) ImageManager.loadSystem(def.sheet);
    };

    // Draws the current swing frame in a child sprite anchored on the feet.
    // Returns true while a sheet is on screen (the walking sprite is hidden then).
    Sprite_Character.prototype.updateSwingSheet = function() {
        const event = $gamePlayer._swingEvent;
        const kind = event && event._swingT >= 0 ? event._swingKind : undefined;
        if (kind === undefined || swingSheetState(kind) !== "ready") {
            if (this._swingBody) this._swingBody.visible = false;
            return false;
        }
        const def = swingKind(kind);
        const bitmap = ImageManager.loadSystem(def.sheet);
        if (bitmap.smooth) bitmap.smooth = false;
        if (!this._swingBody) {
            this._swingBody = new Sprite();
            this._swingBody.anchor.x = SHEET_FEET.x / SHEET_CELL;
            this._swingBody.anchor.y = SHEET_FEET.y / SHEET_CELL;
            this.addChild(this._swingBody);
        }
        const frames = Math.max(1, Math.floor(bitmap.width / SHEET_CELL));
        const dir = $gamePlayer.direction();
        const row = SHEET_ROW[dir] || 0;
        const reach = REACH_VECTOR[dir] || REACH_VECTOR[2];
        const lunge = def.reach * swingLunge(kind, event._swingT);
        const body = this._swingBody;
        body.bitmap = bitmap;
        let col = swingSheetFrame(kind, frames, row, event._swingT);
        // while it waits the figure shifts a little between two poses - unless opts.still (resting on the ground: sits quite still, hands folded)
        if (event._waiting && !(event.opts && event.opts.still)) col -= Math.floor(event._wait / ((event.opts && event.opts.wobble) || 22)) % 2;
        body.setFrame(col * SHEET_CELL, row * SHEET_CELL, SHEET_CELL, SHEET_CELL);
        body.x = reach.x * lunge;
        body.y = reach.y * lunge;
        body.visible = true;
        return true;
    };

    // Single override chain for updateFrame: the swing sheet (player only) takes priority, then a tree
    // sprite draws its own frame, and anything else falls through to the core behaviour. This used to
    // be two separate overrides, each patching whatever updateFrame already was, which happened to work
    // only because the two conditions (player vs. tree event) can never both be true at once - fragile
    // if the file were ever reordered. One override, one backup alias, order made explicit instead.
    Sprite_Character.prototype.updateFrame = function() {
        if (this._character === $gamePlayer && this.updateSwingSheet()) {
            this.setFrame(0, 0, 0, this.patternHeight());   // the swing sheet draws the figure
        } else if (this.isTreeSprite()) {
            this.updateTreeFrame();
        } else {
            this.setTreeBodyVisible(false);
            _Sprite_Character_updateFrame.call(this);
        }
    };

    // Fallback without a sheet. Where the tool is held for each facing (relative
    // to the feet), which way it is mirrored, and the direction the body leans
    // into the blow.
    const HAND = {
        2: { x: 9, y: -25, sign: 1, ax: 0, ay: 1 },
        4: { x: -6, y: -26, sign: -1, ax: -1, ay: 0 },
        6: { x: 6, y: -26, sign: 1, ax: 1, ay: 0 },
        8: { x: -9, y: -27, sign: -1, ax: 0, ay: -1 }
    };
    const LUNGE_PIXELS = 3;
    const VERTICAL_FORESHORTEN = 0.65;   // swings toward / away from the camera look shorter

    // The tool the player is swinging: a child sprite that rotates about the
    // grip, while the whole figure leans a few pixels into the strike.
    Sprite_Character.prototype.updateToolSwing = function() {
        const event = $gamePlayer._swingEvent;
        const def = swingKind(event && event._swingKind);
        const active = !!event && event._swingT >= 0 && event._swingKind !== undefined && def.tool >= 0 &&
            swingSheetState(event._swingKind) === "none";
        if (!active) {
            if (this._toolSprite) this._toolSprite.visible = false;
            return;
        }
        if (!this._toolSprite) {
            this._toolSprite = new Sprite(ImageManager.loadSystem("Tools"));
            this._toolSprite.anchor.x = TOOL_PIVOT.x / TOOL_SIZE;
            this._toolSprite.anchor.y = TOOL_PIVOT.y / TOOL_SIZE;
            this.addChild(this._toolSprite);
        }
        const tool = this._toolSprite;
        const pose = swingPose(Math.min(1, event._swingT / def.frames), def.tool);
        const hand = HAND[$gamePlayer.direction()] || HAND[2];
        const vertical = hand.ax === 0;
        tool.visible = true;
        tool.setFrame(def.tool * TOOL_SIZE, 0, TOOL_SIZE, TOOL_SIZE);
        tool.x = hand.x;
        tool.y = hand.y;
        tool.scale.x = hand.sign;
        tool.rotation = hand.sign * pose.angle * (vertical ? VERTICAL_FORESHORTEN : 1);
        this.x += hand.ax * LUNGE_PIXELS * pose.lunge;
        this.y += hand.ay * LUNGE_PIXELS * 0.7 * pose.lunge;
    };

    Sprite_Character.prototype.updateHitFlash = function(event) {
        const alpha = hitFlashAlpha(event);
        if (alpha > 0 || this._treeFlashOn) {
            this.setBlendColor([255, 244, 210, alpha]);
            this._treeFlashOn = alpha > 0;
        }
    };

    Sprite_Character.prototype.updateTreeEffects = function(event) {
        if (!this.isTreeSprite()) {
            // Stump / rock (tile or plain graphic): small jitter and highlight
            // on every hit, squash and fade while it breaks.
            this.updateSimpleHitEffects(event);
            return;
        }
        this.scale.x = 1;
        this.scale.y = 1;
        this.rotation = 0;
        // 0 = upright, 1 = on the ground (or already felled and waiting for the
        // stump page). The same value tips the tree, fades it out and fades the
        // stump in, so all three stay in step.
        let tilt = 0;
        if (event._treeFallT >= 0) {
            tilt = fallTilt(event._treeFallT);
        } else if (event._treeGone) {
            tilt = 1;
        }
        const body = this._treeBody;
        const preview = this._stumpPreview;
        body.rotation = (event._treeFallDir || 1) * (Math.PI / 2) * tilt;
        body.alpha = 1 - tilt;
        const noStump = isCharred(event) || !!(treeConfig(event) || {}).nostump;
        preview.alpha = noStump ? 0 : stumpPreviewAlpha(tilt);   // a charred tree (and a seedling) leaves no stump
        preview.visible = preview.alpha > 0 && !!preview.bitmap;
        this.updateHitFlash(event);
    };

    Sprite_Character.prototype.updateSimpleHitEffects = function(event) {
        this.rotation = 0;
        if (event._treeKickAt !== undefined) {
            const tau = (Graphics.frameCount - event._treeKickAt) / 60;
            if (tau >= 0 && tau < 1) {
                this.x += (event._treeKickDir || 1) * 3 * Math.exp(-6 * tau) * Math.sin(2 * Math.PI * 4 * tau);
            }
        }
        let scaleX = 1, scaleY = 1, sink = 0;
        if (event._breakT >= 0) {
            const p = Math.min(1, event._breakT / (BREAK_FRAMES[event._breakKind] || 30));
            if (event._breakKind !== "stump") {
                scaleX = 1 + 0.15 * p;
                scaleY = 1 - 0.5 * p;
            } else {
                scaleY = 1 - 0.35 * p;
                sink = 14 * p;
            }
        }
        this.scale.x = scaleX;
        this.scale.y = scaleY;
        this.y += sink;
        this.updateHitFlash(event);
        this.updateBushSeeThrough(event);
    };

    // A bush with a walkable edge fades a little while the player stands in it, so
    // you can see him (and the swing) among the leaves.
    const BUSH_SEE_THROUGH = 0.6;
    Sprite_Character.prototype.updateBushSeeThrough = function(event) {
        if (!bushConfig(event)) return;   // only bushes: other events keep their own alpha
        const o = occupyConfig(event);
        const inside = !!o && o.soft > 0 && isInsideArea(event, o, $gamePlayer.x, $gamePlayer.y);
        const target = inside ? BUSH_SEE_THROUGH : 1;
        if (this.alpha === target) return;
        this.alpha += (target - this.alpha) * 0.25;
        if (Math.abs(target - this.alpha) < 0.02) this.alpha = target;
    };
    // ------------------------------------------------------------------
    // Hit effect particles. A layer in the tilemap (so it scrolls and zooms
    // with the map) that turns the entries queued in $gameTemp._hitFx into
    // small squares that fly off, fall to the ground and fade.
    // ------------------------------------------------------------------

    // draw order (Sprite.z). Only one value lives here, but it is named for the same reason
    // Farming_Render.js keeps its own small Z table: a number alone (was "this.z = 7") does not say why.
    // Not shared across the two files - ChoppableTree.js currently loads before Farming_Render.js in
    // plugins.js, so it keeps its own copy rather than depend on a table the other file may not have
    // finished defining yet.
    const Z = {
        hitFx: 7   // hit-effect particles (flying stones, chips), above the characters
    };

    // build (once) and cache a bitmap under `key` in `cache` (a plain object). buildFn does the actual
    // drawing and returns the bitmap; mirrors the helper of the same shape in Farming_Render.js (kept
    // local here for the same load-order reason as the Z table above).
    function cachedBitmap(cache, key, buildFn) {
        if (!cache[key]) cache[key] = buildFn();
        return cache[key];
    }

    const fxBitmaps = {};
    function fxBitmap(color, size) {
        const key = color + size;
        return cachedBitmap(fxBitmaps, key, () => {
            const bitmap = new Bitmap(size, size);
            bitmap.fillRect(0, 0, size, size, color);
            return bitmap;
        });
    }
    // little pixel-art stones: [light, mid, dark, outline]
    const STONE_SHADES = [
        ["#c9cfd4", "#9aa1a7", "#6f757b", "#3a3f44"],
        ["#d2c29b", "#a8956a", "#7a6a48", "#3f3423"],
        ["#b7c4b0", "#8a9a84", "#5f6e5a", "#2f3a2d"]
    ];
    const stoneBitmaps = {};
    function stoneBitmap(shade) {
        return cachedBitmap(stoneBitmaps, shade, () => {
            const [light, mid, dark, line] = STONE_SHADES[shade];
            const bitmap = new Bitmap(7, 6);
            bitmap.fillRect(2, 0, 3, 1, line);
            bitmap.fillRect(1, 1, 5, 1, line);
            bitmap.fillRect(0, 2, 7, 2, line);
            bitmap.fillRect(1, 4, 5, 1, line);
            bitmap.fillRect(2, 5, 3, 1, line);
            bitmap.fillRect(2, 1, 3, 1, mid);
            bitmap.fillRect(1, 2, 5, 2, mid);
            bitmap.fillRect(2, 4, 3, 1, dark);
            bitmap.fillRect(2, 1, 2, 1, light);
            bitmap.fillRect(1, 2, 2, 1, light);
            bitmap.fillRect(4, 3, 2, 1, dark);
            return bitmap;
        });
    }
    // where the flying stones go: the player's chest
    function playerScreenPoint() {
        if (typeof $gamePlayer.screenX === "function") return { x: $gamePlayer.screenX(), y: $gamePlayer.screenY() - 24 };
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        return { x: $gameMap.adjustX($gamePlayer.x) * tw + tw / 2, y: $gameMap.adjustY($gamePlayer.y) * th + th / 2 };
    }
    const fxRandom = (a, b) => a + Math.random() * (b - a);
    const fxInt = range => Math.round(fxRandom(range[0], range[1]));

    function Sprite_HitFxLayer() {
        this.initialize(...arguments);
    }

    Sprite_HitFxLayer.prototype = Object.create(Sprite.prototype);
    Sprite_HitFxLayer.prototype.constructor = Sprite_HitFxLayer;

    Sprite_HitFxLayer.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = Z.hitFx;   // above the characters
        this._particles = [];
    };

    Sprite_HitFxLayer.prototype.spawn = function(fx) {
        const type = FX_TYPES[fx.type];
        if (!type) return;
        const away = fx.dx !== 0 ? fx.dx : (Math.random() < 0.5 ? -1 : 1);
        const count = fx.count !== undefined ? Math.min(fx.count, FX_MAX_PEBBLES) : (fx.final ? type.final : type.count);
        for (let i = 0; i < count && this._particles.length < FX_MAX_PARTICLES; i++) {
            const size = fxInt(type.size);
            const sprite = new Sprite(type.pebble
                ? stoneBitmap(Math.floor(Math.random() * STONE_SHADES.length))
                : fxBitmap(type.colors[Math.floor(Math.random() * type.colors.length)], size));
            sprite.anchor.x = 0.5;
            sprite.anchor.y = 0.5;
            const spread = type.spread || 3;
            const homeAt = type.pebble ? type.settle + i * 2 : -1;   // frame the stone starts flying to the player
            this._particles.push({
                sprite, bx: fx.bx, by: fx.by, bounce: type.bounce || 0, homeAt,
                // starts on the side of the target facing the player
                ox: -fx.dx * 9 + fxRandom(-spread, spread),
                oy: type.oy - fx.dy * 5 + fxRandom(-3, 3),
                vx: away * fxRandom(type.speed[0], type.speed[1]) + fxRandom(-0.9, 0.9),
                vy: -fxRandom(type.lift[0], type.lift[1]),
                gravity: type.gravity, age: 0, life: type.pebble ? homeAt + 45 : fxInt(type.life), floor: fxRandom(-2, 5)
            });
            this.addChild(sprite);
        }
    };

    // A stone flying to the player (in screen coordinates, so it follows the scrolling
    // map and a moving player). Returns true when it has arrived.
    Sprite_HitFxLayer.prototype.flyHome = function(p) {
        const target = playerScreenPoint();
        if (!p.homing) {
            p.homing = true;
            p.hx = p.sprite.x;
            p.hy = p.sprite.y;
        }
        const dx = target.x - p.hx, dy = target.y - p.hy, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10) return true;
        const step = Math.max(3, dist * 0.22);
        p.hx += dx / dist * step;
        p.hy += dy / dist * step;
        p.sprite.x = Math.round(p.hx);
        p.sprite.y = Math.round(p.hy);
        p.sprite.alpha = 1;
        return false;
    };

    Sprite_HitFxLayer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const queue = typeof $gameTemp !== "undefined" && $gameTemp ? $gameTemp._hitFx : null;
        while (queue && queue.length > 0) this.spawn(queue.shift());
        const tw = $gameMap.tileWidth();
        const th = $gameMap.tileHeight();
        for (const p of this._particles.slice()) {
            p.age++;
            let done = p.age >= p.life;
            if (p.homeAt >= 0 && p.age >= p.homeAt) {
                done = this.flyHome(p) || done;
            } else {
                p.vy += p.gravity;
                p.ox += p.vx;
                p.oy += p.vy;
                if (p.oy > p.floor) {   // landed: it stays there and slides a little (stones bounce first)
                    p.oy = p.floor;
                    p.vy = p.bounce && p.vy > 1.4 ? -p.vy * p.bounce : 0;
                    p.vx *= p.bounce ? 0.75 : 0.6;
                }
                p.sprite.x = Math.round($gameMap.adjustX(p.bx) * tw + p.ox);
                p.sprite.y = Math.round($gameMap.adjustY(p.by) * th + p.oy);
                p.sprite.alpha = Math.min(1, (p.life - p.age) / 10);
            }
            if (done) {
                this.removeChild(p.sprite);
                this._particles.splice(this._particles.indexOf(p), 1);
            }
        }
    };

    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this._hitFxLayer = new Sprite_HitFxLayer();
        this._tilemap.addChild(this._hitFxLayer);
    };

    // for Storm.js (lightning hitting a tree) and the tests
    // treeConfig: the parsed (and cached) <Tree:...> numbers of an event - Forestry.js changes scale / hits / drops of a planted tree
    // in place as it grows
    // swingKind(kind): the timing of a kind of swing; swingKindOf(key): the kind with that name, else the first that plays that
    // sheet (-1: none) - Combat.js
    const swingKindOf = key => { const i = SWING_KINDS.findIndex(k => k.name === key); return i >= 0 ? i : SWING_KINDS.findIndex(k => k.sheet === key); };
    window.ChoppableTree = { isTree: event => !!treeConfig(event), treeConfig, isPine, isCharred, charTree, strikeableTrees, emberLights, emberSpots, EMBER_FRONT, EMBER_LIFE, CHARCOAL, CONE,
        swingKind, swingKindOf };
})();
