//=============================================================================
// ChoppableTree.js
//=============================================================================
// Trees, bushes, rocks, ore veins, stumps and logs to gather, and the hero's tool swings. Split in four (2026-09-29): this file holds
// the parameters and the defaults they make, the table of the swings (Combat.js reads it while it loads), the tiles big objects take,
// the tags read from the events' notes (<Tree>, <Rock>, <Stump>, <Log>, <Bush>, <Occupy>), the saved state, the plugin commands, the
// API (window.ChoppableTree) and EVERY engine hook. ChoppableTree_Objects.js (what each thing is, the blow, the drops, fruit, the
// lightning's char, the fall and the break, the bus's "chop"), ChoppableTree_Swing.js (the hero's swings: the sheets, the tool drawn
// without one, held O) and ChoppableTree_Render.js (the tree drawn in strips - the sway, the kick, the fall, the embers -, the hit
// flash, the flying chips and stones) are functions and classes only.

/*:
 * @target MZ
 * @plugindesc Zbieractwo: ścinanie drzew siekierą, kopanie pieńków łopatą, rozbijanie kamieni kilofem, rąbanie kłód, prawdziwa animacja postaci przy machaniu narzędziem, odłamki przy uderzeniu, duże obiekty blokują swoją podstawę, zwalnia ziemię pod uprawy i budowę, animacje grabienia i orki, kucania przy siewie i zbiorze, ścinanie krzaków (dają gałęzie), kamienie w wielu rodzajach (lecą do gracza po rozbiciu), duże krzewy z przechodnim brzegiem, 26 kamieni od małych po ogromne plus żyła rudy żelaza, bezlistne zarośla z gałęzi blokujące drogę, zużywa wytrzymałość, dzikie drzewa owocowe (jabłoń, grusza) z sezonowym owocem do zerwania przed ścięciem. v1.17.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
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
 * @command pickFruit
 * @text Zerwij owoce z drzewa
 * @desc Użyj na pierwszej stronie zdarzenia-drzewa owocowego (jabłoń, grusza; wyzwalacz: Przycisk akcji). Zrywa owoce, gdy są w sezonie; potem drzewo można ściąć.
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
 *
 * STAN W ZAPISIE (rdzeń TawernaCore): $gameSystem._tw.treeFruit (dzień, w
 * którym zerwano owoce z każdego drzewa owocowego) i $gameSystem._tw.smoulder
 * (godzina, w której piorun trafił w drzewo - zapisuje ją wtyczka Storm).
 * Stare zapisy z $gameSystem._treeFruit i _smoulder są przejmowane; stare
 * nazwy dalej prowadzą do nowego miejsca.
 *
 * SZYNA ZDARZEŃ (Tawerna.on): chop { kind, id, mapId, x, y, done, drops,
 * charred, hand, event } - rzecz skończona: ścięte drzewo (kind "tree"),
 * wykopany pieniek ("stump"), rozbity kamień ("rock") albo żyła rudy ("ore"),
 * ścięty krzak ("bush"), rozrąbana albo zebrana kłoda ("log"). done: nic z
 * niej nie zostało, ziemia jest wolna (ścięte drzewo zostawia pieniek: false);
 * drops: co wpadło do torby, [{ item, amount }]; charred: zwęglone drzewo albo
 * jego pieniek; hand: zebrane ręką, bez narzędzia (kamyki, gruz).
 *
 * PLIKI (2026-09-29 podzielone): ChoppableTree.js (parametry, tabela zamachów,
 * duże obiekty, tagi, stan, polecenia, API, WSZYSTKIE haki silnika - ten),
 * ChoppableTree_Objects.js (rodzaje rzeczy, uderzenie, łup, owoce, piorun,
 * upadek i rozbicie), ChoppableTree_Swing.js (zamachy bohatera: arkusze,
 * narzędzie bez arkusza, trzymane O), ChoppableTree_Render.js (drzewo w
 * paskach: kołysanie, odrzut, upadek, żar; błysk trafienia, odłamki i kamienie
 * lecące do postaci). Kolejność na liście wtyczek: ChoppableTree,
 * ChoppableTree_Objects, ChoppableTree_Swing, ChoppableTree_Render (zaraz pod
 * ChoppableTree). Dopóki części nie są wpisane, ten plik wczytuje je sam.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("ChoppableTree.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    // the family's shared bag: this file (P.core), ChoppableTree_Objects.js (P.objects), ChoppableTree_Swing.js (P.swing),
    // ChoppableTree_Render.js (P.render). The parts are read when needed: in the game every one of them is in the page by then
    const P = T.api("ChoppableTree_parts") || T.register("ChoppableTree_parts", {});
    const missing = file => { throw new Error("ChoppableTree.js: brak " + file + " (a part of ChoppableTree.js)"); };
    const O = () => P.objects || missing("ChoppableTree_Objects.js");
    const S = () => P.swing || missing("ChoppableTree_Swing.js");
    const R = () => P.render || missing("ChoppableTree_Render.js");
    // an engine method whose body is in a part: the part's function with the object as `this` (the method stays on the prototype
    // here, so other plugins call - or wrap - it where they always did)
    const via = (part, name) => function() { return part()[name].apply(this, arguments); };

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
    const FALL_FRAMES = 55;   // (a felled tree: frames from the first tilt to the ground)
    const BREAK_FRAMES = { stump: 28, rock: 30, log: 24, bush: 22 };   // (a stump, a rock, a log, a bush: the frames it squashes and fades)
    // The burn of a tree struck by lightning (ChoppableTree_Render.js draws it, Storm.js smokes over it): from the tip to the foot, then
    // the embers dying out
    const EMBER_FRONT = 0.2;   // h: about 12 s at the usual clock speed from the tip to the foot
    const EMBER_SMOULDER = 0.5, EMBER_LIFE = EMBER_FRONT + EMBER_SMOULDER;   // then 30 game minutes of embers and smoke

    // (the new hero - HeroLook.js - may play its own sheet for a kind)
    function swingKind(kind) {
        const def = SWING_KINDS[kind] || SWING_KINDS[0], look = T.api("HeroLook");
        return look && look.swingDef ? look.swingDef(kind, def) : def;
    }
    // the kind with that name, else the first that plays that sheet (-1: none) - Combat.js (while it loads)
    const swingKindOf = key => { const i = SWING_KINDS.findIndex(k => k.name === key); return i >= 0 ? i : SWING_KINDS.findIndex(k => k.sheet === key); };

    // ------------------------------------------------------------------
    // Saved data (TawernaCore): _tw.treeFruit = { "mapId:eventId": the day its fruit was picked } (fruit trees) and _tw.smoulder =
    // { "mapId:eventId": the clock hour (day * 24 + hour) lightning struck the tree } (Storm.js writes it, the embers read it). An older
    // save's $gameSystem._treeFruit / _smoulder is taken over; the old names stay hidden ways there (Storm.js writes $gameSystem._smoulder)
    // ------------------------------------------------------------------
    const fruitState = T.state.define("treeFruit", () => ({}), { version: 1, adopt: "_treeFruit", owner: pluginName });
    const smoulderState = T.state.define("smoulder", () => ({}), { version: 1, adopt: "_smoulder", owner: pluginName });

    // ------------------------------------------------------------------
    // The tags on an event's note. Only the note, as always (Tawerna.tag on its text), and only the keys the defaults know, as numbers
    // ------------------------------------------------------------------
    const configCaches = { Tree: new WeakMap(), Rock: new WeakMap(), Stump: new WeakMap(), Log: new WeakMap(), Bush: new WeakMap() };

    // a value written as a number (the core gives 5 for "5"; true / false never were numbers here)
    const isNumberArg = value => typeof value !== "boolean" && isFinite(Number(value));

    // Reads <Tag:key=value,...> from the event note. Returns null when the
    // event has no such tag (and whenNoTag is not set); otherwise the defaults
    // overridden by the note. whenNoTag: what an event without the tag gets, e.g.
    // for a picture that is known to be a bush or a rock.
    function readConfig(event, tag, defaults, whenNoTag) {
        const cache = configCaches[tag];
        if (cache.has(event)) return cache.get(event);
        const data = event.event();
        const args = data ? T.tag(data.note || "", tag) : null;
        let cfg = null;
        if (args || whenNoTag) {
            cfg = Object.assign({}, args ? defaults : whenNoTag);
            if (args) {
                for (const key of Object.keys(args.kv)) {
                    if (key in cfg && isNumberArg(args.kv[key])) cfg[key] = Number(args.kv[key]);
                }
            }
        }
        cache.set(event, cfg);
        return cfg;
    }

    // <Occupy:left=,right=,up=,down=,soft=> from the event note: only the keys that are
    // written there (null when the event has no such tag).
    const OCCUPY_KEYS = ["left", "right", "up", "down", "soft"];
    const occupyTags = new WeakMap();
    function occupyTag(event) {
        if (occupyTags.has(event)) return occupyTags.get(event);
        const data = event.event();
        const args = data ? T.tag(data.note || "", "Occupy") : null;
        let tag = null;
        if (args) {
            tag = {};
            for (const key of Object.keys(args.kv)) {
                if (OCCUPY_KEYS.includes(key) && isNumberArg(args.kv[key])) tag[key] = Number(args.kv[key]);
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

    // the numbers of a thing to gather (ChoppableTree_Objects.js: the kinds)
    const treeConfig = event => O().treeConfig(event);
    const rockConfig = event => O().rockConfig(event);
    const bushConfig = event => O().bushConfig(event);
    const anyHarvestConfig = event => O().anyHarvestConfig(event);

    // ------------------------------------------------------------------
    // Engine hooks. Every one ChoppableTree has is in this file, so they keep its place in the plugin list whether its parts are
    // listed or put into the page by this file at the end (the parts are functions and classes only); the longer bodies are in the
    // parts, called through the methods here (via)
    // ------------------------------------------------------------------
    // fruit trees (ChoppableTree_Objects.js): self-switch C follows the fruit before the event's page is (re)picked
    const _Game_Event_refresh = Game_Event.prototype.refresh;
    Game_Event.prototype.refresh = function() {
        O().syncFruitSwitch(this);
        _Game_Event_refresh.call(this);
    };
    // catches regrowth while the player just stands around on the map (refresh() otherwise only
    // runs on map load and self-switch/variable changes, not every time an hour passes) - the map's clock (TawernaCore)
    let lastFruitHour = -1;
    T.onMapUpdate(() => {
        if (!$gameSystem || typeof $gameSystem.dayNightHour !== "function") return;
        const h = T.time.day() * 24 + T.time.hour();
        if (h === lastFruitHour) return;
        lastFruitHour = h;
        for (const event of $gameMap.events()) if (treeConfig(event) && treeConfig(event).fruit) event.refresh();
    }, { owner: pluginName, name: "fruit" });

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
    Game_Event.prototype.updateTreeAnimation = via(O, "updateTreeAnimation");   // (the event's clocks: the swing, the fall, the break)

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

    Game_Event.prototype.finishTreeFall = via(O, "finishTreeFall");   // (the felled tree: its wood, the stump page)
    Game_Event.prototype.finishBreak = via(O, "finishBreak");         // (a rock, a bush, a log, a stump: what it gives, its page)

    // Objects that were destroyed before the farming system existed (or in an
    // older save) free their ground too, as soon as the map is set up.
    const _Game_Map_setupEvents = Game_Map.prototype.setupEvents;
    Game_Map.prototype.setupEvents = function() {
        _Game_Map_setupEvents.call(this);
        if (typeof $gameSystem.clearLand !== "function") return;
        const objects = O();
        for (const event of this.events()) {
            if (objects.isDestroyedHarvest(event)) objects.clearLandUnder(event, true);
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
    // (ChoppableTree_Swing.js: the swing itself)
    Game_Player.prototype.startToolSwing = via(S, "startToolSwing");

    Game_Player.prototype.isToolSwinging = function() {
        return !!this._toolSwing;
    };
    // a swing is never taken over from a save file: its callbacks (onImpact, holdWhile...) do not survive it, and a game saved while
    // the hero sat or worked threw "opts.holdWhile is not a function" on loading (2026-09-26)
    // (the core's "load": after the whole save is read)
    T.on("load", () => {
        if ($gamePlayer) { $gamePlayer._toolSwing = null; $gamePlayer._swingEvent = null; }
    }, { owner: pluginName });

    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        _Game_Player_update.call(this, sceneActive);
        if (sceneActive) S().updateHoldStrike(this);   // (held O: the next blow)
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
    Game_Player.prototype.stepToolSwing = via(S, "stepToolSwing");

    const _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        return !this._toolSwing && _Game_Player_canMove.call(this);
    };

    // ------------------------------------------------------------------
    // The plugin commands (ChoppableTree_Objects.js: the blow, the fruit picked) and the interpreter waiting for the animation
    // ------------------------------------------------------------------
    for (const kind of ["chop", "dig", "mine"]) {
        PluginManager.registerCommand(pluginName, kind, function() {
            O().strike(this, kind);
        });
    }
    PluginManager.registerCommand(pluginName, "pickFruit", function() {
        O().pickFruit(this);
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
    // The sprites: the standing tree drawn in strips, its fall, the embers of a burnt one, the stump fading in, the hit flash, a bush
    // seen through (ChoppableTree_Render.js); the hero's swing (ChoppableTree_Swing.js)
    // ------------------------------------------------------------------
    Sprite_Character.prototype.isTreeSprite = via(R, "isTreeSprite");
    Sprite_Character.prototype.setTreeBodyVisible = via(R, "setTreeBodyVisible");
    Sprite_Character.prototype.ensureTreeStrips = via(R, "ensureTreeStrips");
    Sprite_Character.prototype.updateTreeFrame = via(R, "updateTreeFrame");
    Sprite_Character.prototype.buildEmbers = via(R, "buildEmbers");
    Sprite_Character.prototype.drawEmbers = via(R, "drawEmbers");
    Sprite_Character.prototype.updateEmbers = via(R, "updateEmbers");
    Sprite_Character.prototype.updateStumpPreviewFrame = via(R, "updateStumpPreviewFrame");
    Sprite_Character.prototype.updateCharredTone = via(R, "updateCharredTone");
    Sprite_Character.prototype.updateHitFlash = via(R, "updateHitFlash");
    Sprite_Character.prototype.updateTreeEffects = via(R, "updateTreeEffects");
    Sprite_Character.prototype.updateSimpleHitEffects = via(R, "updateSimpleHitEffects");
    Sprite_Character.prototype.updateBushSeeThrough = via(R, "updateBushSeeThrough");
    Sprite_Character.prototype.updateDecorTreeSeeThrough = via(R, "updateDecorTreeSeeThrough");
    Sprite_Character.prototype.updateSwingSheet = via(S, "updateSwingSheet");   // (HeroLook.js asks it too)
    Sprite_Character.prototype.updateToolSwing = via(S, "updateToolSwing");

    // The core (pre-ChoppableTree.js) updateFrame, kept so the tree/swing override below can fall through to it.
    const _Sprite_Character_updateFrame = Sprite_Character.prototype.updateFrame;

    const _Sprite_Character_updatePosition = Sprite_Character.prototype.updatePosition;
    Sprite_Character.prototype.updatePosition = function() {
        _Sprite_Character_updatePosition.call(this);
        if (this._character instanceof Game_Event && anyHarvestConfig(this._character)) {
            this.updateTreeEffects(this._character);
            this.updateCharredTone(this._character);
        } else if (this._character === $gamePlayer) {
            this.updateToolSwing();
        } else if (this._character instanceof Game_Event && DECOR_TREE.test(this._characterName || "")) {
            this.updateDecorTreeSeeThrough(this._character);   // (a decorative tree picture: fades while the player is behind it)
        }
    };
    const DECOR_TREE = /^!.*tree/i;
    // the see-through factors of bushes and decorative trees, applied after the engine's updateOther (which sets the opacity from
    // the character every frame, after updatePosition)
    const _Sprite_Character_updateOther = Sprite_Character.prototype.updateOther;
    Sprite_Character.prototype.updateOther = function() {
        _Sprite_Character_updateOther.call(this);
        const k = (this._bushSeeK === undefined ? 1 : this._bushSeeK) * (this._decorSeeK === undefined ? 1 : this._decorSeeK);
        if (k < 1) this.opacity = Math.round(this.opacity * k);
    };

    // Load the sheets with the map so the first swing does not have to wait for them.
    const _Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _Scene_Map_create.call(this);
        for (const def of SWING_KINDS) if (def.sheet) ImageManager.loadSystem(def.sheet);
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

    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this._hitFxLayer = new (R().Sprite_HitFxLayer)();   // (the flying chips and stones)
        this._tilemap.addChild(this._hitFxLayer);
    };

    // ------------------------------------------------------------------
    // For the parts, and window.ChoppableTree (the same names as before the split)
    // ------------------------------------------------------------------
    P.core = { pluginName, TREE_DEFAULTS, ROCK_DEFAULTS, STUMP_DEFAULTS, LOG_DEFAULTS, BUSH_DEFAULTS, FRUIT_SEASON_FROM, FRUIT_SEASON_TO,
        FRUIT_REGROW_DAYS, FRUIT_SE, CHARCOAL, CONE, CHARRED_DROP, CHARRED_STUMP_DROP, CHARRED_HITS, CHARRED_TONE, SWAY_CYCLE, CHOP_SE, FALL_SE,
        DIG_SE, MINE_SE, BREAK_SE, PICKUP_SE, BUSH_SE, SWING_KINDS, SWING_KIND, FALL_FRAMES, BREAK_FRAMES, EMBER_FRONT, EMBER_SMOULDER, EMBER_LIFE,
        SOLID_GRAPHICS, swingKind, swingKindOf, configCaches, readConfig, isNumberArg, occupyTag, occupyConfig, isInsideArea, isSoftTile,
        fruitState, smoulderState };
    const objects = name => function() { const o = O(); return o[name].apply(o, arguments); };
    const render = name => function() { const r = R(); return r[name].apply(r, arguments); };
    // for Storm.js (lightning hitting a tree) and the tests
    // treeConfig: the parsed (and cached) <Tree:...> numbers of an event - Forestry.js changes scale / hits / drops of a planted tree
    // in place as it grows
    // swingKind(kind): the timing of a kind of swing; swingKindOf(key): the kind with that name, else the first that plays that
    // sheet (-1: none) - Combat.js
    window.ChoppableTree = T.register(pluginName, { isTree: event => !!treeConfig(event), treeConfig, isLow: objects("isLow"), isPine: objects("isPine"),
        isCharred: objects("isCharred"), charTree: objects("charTree"), strikeableTrees: objects("strikeableTrees"), emberLights: render("emberLights"),
        emberSpots: render("emberSpots"), EMBER_FRONT, EMBER_LIFE, CHARCOAL, CONE, swingKind, swingKindOf });

    // the parts not in js/plugins.js yet: put into the page here (after every plugin - functions and classes only, every engine hook
    // is above, so nothing moves in the chain)
    for (const part of ["ChoppableTree_Objects", "ChoppableTree_Swing", "ChoppableTree_Render"]) {
        if (!(window.$plugins || []).some(p => p && p.name === part && p.status)) PluginManager.loadScript(part);
    }
})();
