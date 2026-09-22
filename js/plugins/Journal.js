//=============================================================================
// Journal.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Dziennik: cele, księga rzemiosła (surowce, budynki, receptury), notatki i podsumowanie dnia. v1.0.0
 * @author Claude
 *
 * @param showTracker
 * @text Pokazuj bieżący cel na ekranie
 * @desc Okienko w prawym górnym rogu (pod minimapą, jeśli jest) z celem i tym, czego brakuje.
 * @type boolean
 * @default true
 *
 * @param summaryOnSleep
 * @text Podsumowanie dnia po spaniu
 * @desc Po nocy w łóżku albo na legowisku pokazuje, co udało się zrobić i co czeka rano.
 * @type boolean
 * @default true
 *
 * @command addNote
 * @text Dodaj notatkę do dziennika
 * @desc Zapisuje w zakładce Notatki poszlakę, plotkę albo ważną rozmowę.
 *
 * @arg title
 * @text Tytuł
 * @type string
 * @default Nowa notatka
 *
 * @arg text
 * @text Treść
 * @type multiline_string
 *
 * @command openJournal
 * @text Otwórz dziennik
 *
 * @help
 * ============================================================================
 * Journal.js
 * ============================================================================
 * DZIENNIK (klawisz J albo menu główne > Dziennik) ma pięć zakładek:
 *   Cele        - kolejne zadania prowadzące przez rozwój: od pierwszego drewna
 *                 po kuźnię, jedzenie i tajemnice tawerny. Cele wykonują się
 *                 same, gdy zrobisz to, czego wymagają (nic nie trzeba
 *                 zgłaszać). OK przypina cel: widać go wtedy w prawym górnym
 *                 rogu (pod minimapą z wtyczki Minimap) razem z tym, czego jeszcze brakuje.
 *   Surowce     - skąd wziąć każdy materiał, do czego służy i czy już go miałeś.
 *   Budynki     - koszt, opis, co produkują; zielone = starcza materiałów.
 *   Receptury   - wszystko, co da się zrobić w budynkach, ze składnikami
 *                 (zielone = masz, czerwone = brakuje).
 *   Notatki     - poszlaki i rozmowy dodawane poleceniem wtyczki.
 * Surowce, budynki i receptury czyta prosto z tabel wtyczki Farming, więc nowa
 * receptura pojawia się w księdze sama.
 *
 * PODSUMOWANIE DNIA pojawia się po przespanej nocy (łóżko albo legowisko):
 * wykonane cele, zdobyte rzeczy, nowe budynki oraz zapowiedź poranka (pogoda
 * na jutro, dojrzałe plony, gotowe produkty, zbliżająca się zima).
 *
 * POLECENIA WTYCZKI
 *   Dodaj notatkę do dziennika: tytuł i treść trafiają do zakładki Notatki.
 *   Otwórz dziennik.
 * W skryptach: Journal.addNote("Tytuł", "Treść").
 *
 * Cele fabularne (Tajemnice tawerny) odczytują zmienną 1 (postęp rozmowy z
 * Borgarem) oraz przełącznik A zdarzenia 1 na mapie 9 (wejście do piwnicy).
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "Journal";
    const params = PluginManager.parameters(pluginName);
    const flag = (v, d) => (v === undefined || v === "" ? d : v === "true");
    const SHOW_TRACKER = flag(params.showTracker, true);
    const SUMMARY_ON = flag(params.summaryOnSleep, true);

    Input.keyMapper[74] = "journal";   // J

    const dataItem = id => $dataItems[id];
    const farmData = () => ($gameSystem && $gameSystem._farm) || { plots: {}, buildings: {} };
    const Farm = () => window.Farming || null;
    const iconOfItem = id => (dataItem(id) || {}).iconIndex || 0;
    const countOf = id => (dataItem(id) ? $gameParty.numItems(dataItem(id)) : 0);
    const dayNow = () => ($gameSystem ? $gameSystem.dayNightDay() : 1);

    // ------------------------------------------------------------------
    // Saved data ($gameSystem._journal): items ever owned, finished goals (day), notes, the pinned goal, the record of the day
    // ------------------------------------------------------------------
    function completedBuildings() {
        const out = [];
        for (const list of Object.values(farmData().buildings || {})) for (const b of list || []) if (!b.site) out.push(b);
        return out;
    }
    const builtCount = type => completedBuildings().filter(b => b.type === type).length;
    const isBuilt = type => builtCount(type) > 0;
    function anyPlot(pred) {
        for (const map of Object.values(farmData().plots || {})) for (const p of Object.values(map || {})) if (pred(p)) return true;
        return false;
    }

    function newDayRecord(n) {
        return { n, gained: {}, goals: [], eaten: 0, gold0: $gameParty ? $gameParty.gold() : 0, built0: completedBuildings().map(b => b.id) };
    }
    function data() {
        const sys = $gameSystem;
        if (!sys._journal) {
            const seen = {};
            for (const it of $gameParty.items()) seen[it.id] = true;   // what the bag already holds counts as known
            sys._journal = { seen, done: {}, pinned: null, notes: [], day: newDayRecord(sys.dayNightDay()), last: null, eaten: 0, fresh: true };
        }
        return sys._journal;
    }
    const has = id => !!data().seen[id];
    const hasAny = ids => ids.some(has);

    // ------------------------------------------------------------------
    // Goals. They finish by themselves when the game state says so.
    // ch: chapter, after: goals that have to be done first (for the list and the tracker), item: the icon,
    // build / recipe: what the details show (cost rows), short: the second line of the tracker
    // ------------------------------------------------------------------
    const CHAPTERS = ["Pierwsze kroki", "Deski i narzędzia", "Własne pole", "Ogień i kuźnia", "Jedzenie i przetrwanie", "Tajemnice Tawerny"];
    const GOALS = [
        { id: "stone", ch: 0, title: "Podnieś kamienie z ziemi", item: 64, after: [], done: () => has(64),
            text: "Małe kamienie leżą na łące: stań przed nimi i naciśnij przycisk akcji. Większe skały rozbijesz później kilofem." },
        { id: "branches", ch: 0, title: "Nazbieraj gałęzi", item: 77, after: [], done: () => has(77),
            text: "Suche gałęzie (brązowe patyki) leżą na trawie. Podnosisz je przyciskiem akcji, tak jak kamienie. Zrobisz z nich młotek, warsztat i pierwsze narzędzia." },
        { id: "flax", ch: 0, title: "Zbierz len", item: 92, after: [], done: () => has(92),
            text: "Len rośnie na łące (niebieskie kwiatki, od wiosny do jesieni). Podnosisz go przyciskiem akcji. Wiążesz nim kamień z gałęzią, a z czterech sztuk skręcisz linę." },
        { id: "drink", ch: 0, title: "Napij się wody", item: 129, after: [], done: () => ((($gameSystem._needs || {}).drinks) || 0) > 0,
            text: "Pod ikoną wytrzymałości są dwa paski: sytość i nawodnienie. Gdy spadają, wszystko kosztuje więcej sił. Stań przed stawem albo studnią i wybierz „Napij się”. W deszczu na dworze nawodnienie rośnie samo." },
        { id: "hammer", ch: 0, title: "Zrób młotek", item: 89, recipe: ["hand", "hammer"], after: ["stone", "branches", "flax"], done: () => has(89),
            text: "Bez młotka nie postawisz żadnego budynku. Stań przed trawą lub oczyszczoną ziemią, wybierz „Wytwórz...”, a potem „Zrób młotek”." },
        { id: "workbench", ch: 0, title: "Zbuduj warsztat", item: 89, build: "workbench", after: ["hammer"], done: () => isBuilt("workbench"),
            text: "Na warsztacie powstają wszystkie narzędzia. Wybierz „Zbuduj...”, potem miejsce, a na koniec uderzaj młotkiem w plac budowy. Wystarczą gałęzie, kamienie i len." },
        { id: "axe", ch: 0, title: "Zrób kamienną siekierę", item: 60, recipe: ["workbench", "axe_stone"], after: ["workbench"], done: () => hasAny([60, 115]),
            text: "Ostry kamień, gałąź i len. Siekierą ścinasz drzewa, rozrąbujesz kłody i ścinasz krzaki." },
        { id: "wood", ch: 0, title: "Zdobądź drewno", item: 61, after: ["axe"], done: () => has(61),
            text: "Podejdź do drzewa i uderzaj przyciskiem akcji, aż padnie. Zetnij też leżące kłody." },
        { id: "bough", ch: 0, title: "Zrób leśne legowisko", item: 128, recipe: ["hand", "bough_bed"], after: ["branches", "flax"], done: () => hasAny([128]) || isBuilt("bedroll"),
            text: "Gałęzie związane lnem i wyścielone trawą. Stań przed trawą, wybierz „Wytwórz...”, a potem „Zrób leśne legowisko”. Rozłożysz je w „Zbuduj...”." },
        { id: "bednight", ch: 0, title: "Prześpij noc na legowisku", item: 128, after: ["bough"], done: () => ((farmData().bedNights) || 0) > 0,
            text: "Rozłóż legowisko, stań przed nim i wybierz „Prześpij noc”. Rano wstaniesz z około 60% sił (w deszczu i zimą z mniejszą ilością). Namiot wypoczywa lepiej." },
        { id: "campfire", ch: 0, title: "Rozpal ognisko", item: 61, build: "campfire", after: ["wood", "stone", "hammer"], done: () => isBuilt("campfire"),
            text: "Przy ognisku odpoczniesz, ogrzejesz się i upieczesz posiłek. Wybierz miejsce w menu budowy, potem podejdź i uderzaj młotkiem w plac budowy." },

        { id: "sawmill", ch: 1, title: "Zbuduj tartak", item: 80, build: "sawmill", after: ["wood", "stone", "hammer"], done: () => isBuilt("sawmill"),
            text: "Duży stół z kłodą i grubą piłą. Zamienia drewno w deski, a z prawdziwą piłą wychodzi ich więcej. Prawie wszystko inne budujesz z desek." },
        { id: "planks", ch: 1, title: "Napiłuj deski", item: 80, recipe: ["sawmill", "planks"], after: ["sawmill"], done: () => has(80),
            text: "Otwórz menu tartaku (przycisk akcji przy nim) i wybierz „Piłuj deski”. To ciężka praca: kosztuje wytrzymałość i kilka godzin." },
        { id: "pickaxe", ch: 1, title: "Zrób kamienny kilof", item: 63, recipe: ["workbench", "pick_stone"], after: ["wood"], done: () => has(63),
            text: "Kilof robisz w warsztacie z drewna, gałęzi i kamieni. Rozbija skały i żyły rudy." },
        { id: "skin", ch: 1, title: "Zrób bukłak", item: 129, recipe: ["hand", "waterskin"], after: ["drink", "flax"], done: () => has(129),
            text: "Bukłak z surowej skóry (zdobędziesz ją z pułapki albo polowania) mieści 4 łyki. Napełniasz go przy wodzie, a pijesz klawiszem G. Bez niego daleko od stawu szybko zaschnie ci w gardle." },
        { id: "repair", ch: 1, title: "Napraw narzędzie", item: 89, after: ["axe"], done: () => ((($gameSystem._wear || {}).repaired) || 0) > 0,
            text: "Narzędzia się zużywają: stan widać przy nich w plecaku, a gdy zostaje mało, nad postacią pojawia się dymek. W warsztacie jest „Napraw: ...” dla każdego nadwerężonego narzędzia. Złamane trzeba zrobić od nowa." },
        { id: "chest", ch: 1, title: "Postaw skrzynię", item: 80, build: "chest_s", after: ["planks"], done: () => isBuilt("chest_s") || isBuilt("chest_l"),
            text: "W skrzyni odłożysz nadmiar surowców, żeby nie dźwigać wszystkiego. Otwierasz ją przyciskiem akcji." },

        { id: "rake", ch: 2, title: "Zagrab ziemię", item: 65, recipe: ["workbench", "rake"], after: ["wood"], done: () => anyPlot(p => p.s === "raked" || p.s === "tilled" || p.crop),
            text: "Grabie zrobisz w warsztacie. Potem stań przed oczyszczoną ziemią lub trawą i wybierz „Zagrab ziemię”." },
        { id: "till", ch: 2, title: "Zaoraj pole motyką", item: 66, after: ["rake"], done: () => anyPlot(p => p.s === "tilled" || p.crop),
            text: "Motykę zrobisz w warsztacie. Zagrabioną ziemię zaorzesz nią, a dopiero na zaoranej ziemi da się siać." },
        { id: "sow", ch: 2, title: "Zasiej nasiona", item: 67, after: ["till"], done: () => anyPlot(p => p.crop) || hasAny([71, 72, 73, 74]),
            text: "Nasiona leżą w skrzyni w domku. Sadzisz je w odpowiedniej porze roku: menu podpowiada, kiedy która roślina rośnie." },
        { id: "harvest", ch: 2, title: "Zbierz pierwszy plon", item: 71, after: ["sow"], done: () => hasAny([71, 72, 73, 74]),
            text: "Dojrzałą roślinę zbierasz przyciskiem akcji. Podlewanie konewką przyspiesza wzrost o jedną piątą." },

        { id: "kiln", ch: 3, title: "Zbuduj piec do wypału", item: 79, build: "kiln", after: ["sawmill"], done: () => isBuilt("kiln"),
            text: "W piecu wypalisz z drewna węgiel drzewny, potrzebny do wytopu żelaza. Ziemię na budowę wykopiesz łopatą." },
        { id: "charcoal", ch: 3, title: "Wypal węgiel drzewny", item: 79, recipe: ["kiln", "charcoal"], after: ["kiln"], done: () => has(79),
            text: "Wypał trwa kilka godzin i toczy się w tle. Możesz w tym czasie robić coś innego." },
        { id: "brickworks", ch: 3, title: "Zbuduj cegielnię", item: 84, build: "brickworks", after: ["planks"], done: () => isBuilt("brickworks"),
            text: "Cegielnia wypala cegły z kamieni i ziemi. Cegły są potrzebne do kuźni i piekarni." },
        { id: "bricks", ch: 3, title: "Wypal cegły", item: 84, recipe: ["brickworks", "brick"], after: ["brickworks"], done: () => has(84),
            text: "Kamienie i ziemia zamieniają się tu w cegły." },
        { id: "forge", ch: 3, title: "Zbuduj kuźnię", item: 86, build: "forge", after: ["bricks"], done: () => isBuilt("forge"),
            text: "W kuźni wytopisz żelazo i wykujesz nowe narzędzia. Sama nie wymaga jeszcze żelaza ani gwoździ." },
        { id: "ore", ch: 3, title: "Wydobądź rudę żelaza", item: 85, after: ["pickaxe"], done: () => has(85),
            text: "Żyły rudy to skały z rdzawymi żyłkami w skalistej części mapy. Rozbijaj je kilofem." },
        { id: "iron", ch: 3, title: "Wytop żelazo", item: 86, recipe: ["forge", "iron"], after: ["forge", "charcoal", "ore"], done: () => has(86),
            text: "W kuźni ruda i węgiel drzewny dają żelazo. Wytop trwa kilka godzin i toczy się w tle." },
        { id: "nails", ch: 3, title: "Wykuj gwoździe", item: 88, recipe: ["forge", "nails"], after: ["iron"], done: () => has(88),
            text: "Na kowadle w kuźni z jednej sztuki żelaza wykujesz kilka gwoździ. Potrzebne do dużej skrzyni, browaru i wędzarni." },
        { id: "ironpick", ch: 3, title: "Zrób żelazny kilof", item: 116, recipe: ["workbench", "pick_iron"], after: ["iron", "planks", "pickaxe"], done: () => has(116),
            text: "Grot wykuwasz w kuźni z żelaza, a kilof montujesz w warsztacie. Zastępuje kamienny kilof: skały pękają szybciej, a uderzenia kosztują mniej sił." },
        { id: "ironaxe", ch: 3, title: "Zrób żelazną siekierę", item: 115, recipe: ["workbench", "axe_iron"], after: ["iron", "planks", "axe"], done: () => has(115),
            text: "Głowicę wykuwasz w kuźni z żelaza, a siekierę montujesz w warsztacie. Zastępuje kamienną siekierę: drzewa, kłody i krzaki padają szybciej, a uderzenia kosztują mniej sił." },
        { id: "saw", ch: 3, title: "Zrób piłę", item: 118, recipe: ["workbench", "saw"], after: ["iron", "rope", "sawmill"], done: () => has(118),
            text: "Ostrze piły wykuwasz w kuźni z żelaza, a piłę montujesz w warsztacie. W tartaku tnie deski szybciej i daje ich więcej niż gruba, ręczna piła stołu." },
        { id: "can", ch: 3, title: "Wykuj konewkę", item: 87, recipe: ["forge", "can"], after: ["iron", "planks"], done: () => has(87),
            text: "Blaszana konewka mieści kilka podlań. Napełnisz ją w studni albo w stawie." },
        { id: "tongs", ch: 3, title: "Wykuj żelazne szczypce", item: 144, recipe: ["forge", "tongs"], after: ["iron"], done: () => has(144),
            text: "Szczypce do trzymania rozżarzonego metalu. Bez nich w hucie nie przetopisz stali." },
        { id: "huta", ch: 3, title: "Zbuduj hutę", item: 143, build: "huta", after: ["bricks"], done: () => isBuilt("huta"),
            text: "Piec z cegieł do przetapiania żelaza na stal. Do pracy w nim potrzebne są żelazne szczypce z kuźni." },
        { id: "steel", ch: 3, title: "Przetop stal", item: 143, recipe: ["huta", "steel"], after: ["huta", "tongs", "charcoal"], done: () => has(143),
            text: "W hucie żelazo i węgiel drzewny dają twardszą stal. Trzymasz rozżarzony metal szczypcami. Wytop trwa kilka godzin i toczy się w tle." },

        { id: "knife", ch: 4, title: "Zrób nóż", item: 90, recipe: ["workbench", "knife"], after: ["wood", "stone", "branches"], done: () => hasAny([90, 91]),
            text: "Bez noża nie oprawisz zwierzyny. Kamienny zrobisz w warsztacie, żelazny wykujesz w kuźni (daje więcej mięsa)." },
        { id: "rope", ch: 4, title: "Skręć linę", item: 93, recipe: ["hand", "rope"], after: ["flax"], done: () => has(93),
            text: "Cztery sztuki lnu dają jedną linę (menu ziemi, „Wytwórz...”). Lina potrzebna jest do pułapki, wędki, garbarni i studni." },
        { id: "snare", ch: 4, title: "Postaw pułapkę", item: 101, build: "snare", after: ["rope", "branches"], done: () => isBuilt("snare"),
            text: "Zwierzyna wpada w pułapkę co kilka dni. Odbierasz ją przyciskiem akcji." },
        { id: "meat", ch: 4, title: "Zdobądź mięso", item: 94, after: ["snare", "knife"], done: () => has(94),
            text: "Odbierz zwierzynę z pułapki, a potem użyj jej w menu Przedmioty (potrzebny nóż): dostaniesz mięso i skórę." },
        { id: "roast", ch: 4, title: "Upiecz posiłek na ognisku", item: 95, after: ["meat", "campfire"], done: () => hasAny([95, 99, 107, 108]),
            text: "Menu ogniska ma przepisy: mięso, ryba, ziemniaki i jajecznica. Siadasz z jedzeniem na patyku i czekasz, aż się upiecze (mięso i ryba pół godziny gry). Jeśli wstaniesz wcześniej (Esc albo ruch), nic się nie upiecze." },
        { id: "tripod", ch: 4, title: "Dobuduj trójnóg do ogniska", item: 77, after: ["roast", "rope"], done: () => isBuilt("tripod") || isBuilt("cauldron"),
            text: "W menu ogniska wybierz „Dobuduj trójnóg”: 3 gałęzie i lina staną nad ogniem. Mięso zawiesisz na haczyku i możesz odejść, bo piecze się samo (gotowe odbierzesz z ognia). Na patyku, bez trójnogu, trzeba siedzieć przy ogniu aż do końca." },
        { id: "cauldron", ch: 4, title: "Zawieś kociołek nad ogniem", item: 141, after: ["tripod", "iron"], done: () => isBuilt("cauldron"),
            text: "W kuźni wykuj kociołek („Wykuj kociołek”, 3 żelaza), a potem w menu ogniska z trójnogiem wybierz „Zawieś kociołek” - wystarczy mieć go w plecaku (wokół potrzeba miejsca 3 × 2 pola). W kociołku ugotujesz zupę, gulasz, kapuśniak, owsiankę i wywar. Kociołek zajmuje cały ogień, więc mięso na patyku upieczesz już tylko na drugim ognisku." },
        { id: "eat", ch: 4, title: "Zjedz posiłek", item: 95, after: ["roast"], done: () => data().eaten > 0,
            text: "Jesz z menu Przedmioty. Posiłek syci (pasek sytości pod wytrzymałością), odnawia siły i daje premię: Najedzony (tańsze czynności) albo Rozgrzany (odporność na zimno). Głodny traci więcej sił przy pracy." },
        { id: "rod", ch: 4, title: "Zrób wędkę", item: 100, recipe: ["workbench", "rod"], after: ["rope", "wood"], done: () => has(100),
            text: "Wędkę zrobisz w warsztacie z drewna, liny i gałęzi." },
        { id: "fish", ch: 4, title: "Złów rybę", item: 98, after: ["rod"], done: () => has(98),
            text: "Stań przy stawie, naciśnij przycisk akcji i wybierz „Zarzuć wędkę”. Ryby biorą najlepiej o świcie i o zmierzchu, a także w deszcz." },
        { id: "bucket", ch: 4, title: "Zbuduj wiadro", item: 138, build: "bucket", after: ["planks", "iron"], done: () => isBuilt("bucket") || has(138),
            text: "Wiadro robisz z desek i żelaza w menu „Zbuduj…” (staje od razu, bez młotka). Postawione na dworze zbiera deszczówkę: napijesz się z niego, podlejesz nią rośliny albo napełnisz konewkę i bukłak. Możesz je zabrać do plecaka." },
        { id: "well", ch: 4, title: "Zbuduj studnię", item: 87, build: "well", after: ["rope", "stone", "bucket"], done: () => isBuilt("well"),
            text: "Do budowy studni potrzebujesz wiadra (zabierz je z ziemi do plecaka) i wykopanego na pełną głębokość dołu 2 × 2 pod studnią (łopatą, trzy uderzenia w każdej z czterech kratek). W studni napełnisz konewkę i napijesz się." },
        { id: "tannery", ch: 4, title: "Zbuduj garbarnię", item: 97, build: "tannery", after: ["meat"], done: () => isBuilt("tannery"),
            text: "W garbarni wyprawisz skóry, a z nich uszyjesz płaszcz, buty i plecak." },
        { id: "cloak", ch: 4, title: "Uszyj płaszcz przed zimą", item: 112, recipe: ["tannery", "cloak"], after: ["tannery"], done: () => has(112),
            text: "Zima zaczyna się w dniu 85. Bez płaszcza, ogniska lub ciepłego posiłku marzniesz i każda czynność kosztuje więcej sił." },
        { id: "tent", ch: 4, title: "Uszyj namiot", item: 121, recipe: ["tannery", "tent"], after: ["tannery", "rope", "wood"], done: () => has(121),
            text: "Namiot zszywasz w garbarni ze skór, liny i żerdzi. To twój dom w drodze: rozstawiasz go, gdzie chcesz, śpisz w nim do rana i składasz z powrotem." },
        { id: "tentnight", ch: 4, title: "Prześpij noc w namiocie", item: 121, after: ["tent"], done: () => (farmData().tentNights || 0) > 0,
            text: "Rozstaw namiot (menu ziemi, „Zbuduj...”), stań przed nim i wybierz „Prześpij noc”. Rano dostaniesz podsumowanie dnia, a gra zapisze się sama. Namiot złożysz i zabierzesz ze sobą." },
        { id: "smokehouse", ch: 4, title: "Zbuduj wędzarnię", item: 105, build: "smokehouse", after: ["nails", "meat"], done: () => isBuilt("smokehouse"),
            text: "Wędzone mięso i ryba to najbardziej sycące jedzenie w grze." },
        { id: "sling", ch: 4, title: "Zrób procę", item: 125, recipe: ["workbench", "sling"], after: ["rope", "wood"], done: () => hasAny([125, 126]),
            text: "Proca (albo łuk ze strzałami) pozwala polować na zające i jelenie. Strzelasz klawiszem F, a amunicją do procy są kamienie." },
        { id: "hunt", ch: 4, title: "Upoluj zwierzynę", item: 101, after: ["sling", "knife"], done: () => { const k = (($gameSystem._hunt || {}).kills) || {}; return (k.rabbit || 0) + (k.deer || 0) > 0; },
            text: "Zające pasą się na łące w ciągu dnia i uciekają, gdy podejdziesz. Strzel do nich z daleka klawiszem F: proca kręci się nad głową i wyrzuca kamień, łuk naciąga cięciwę i puszcza strzałę. Zwierzynę oprawisz nożem w menu Przedmioty: mięso i skóra." },
        { id: "pantry", ch: 4, title: "Zbuduj spiżarnię", item: 99, build: "pantry", after: ["planks", "meat"], done: () => isBuilt("pantry"),
            text: "Surowe mięso i ryby psują się w ciągu kilku dni (widać to w opisie). W spiżarni jedzenie starzeje się pięć razy wolniej. Zepsute jedzenie wrzucisz do kompostownika." },
        { id: "cowshed", ch: 4, title: "Zbuduj oborę", item: 123, build: "cowshed", after: ["nails"], done: () => isBuilt("cowshed"),
            text: "Obora to spory ogrodzony wybieg (8 × 5 pól): w środku chodzą krowy, a na noc chowają się w szopie. Dają mleko każdego dnia, zbierasz je z menu przy płocie. Mleko szybko kwaśnieje, więc wypij je albo zrób z niego ser." },
        { id: "dairy", ch: 4, title: "Zbuduj serowarnię", item: 124, build: "dairy", after: ["cowshed"], done: () => isBuilt("dairy"),
            text: "Z trzech dzbanów mleka wychodzi jeden ser. Ser syci na długo i trzyma się miesiąc." },
        { id: "cheese", ch: 4, title: "Zrób ser", item: 124, recipe: ["dairy", "cheese"], after: ["dairy"], done: () => has(124),
            text: "Wypał trwa kilka godzin i toczy się w tle." },

        { id: "hut", ch: 4, title: "Zbuduj chatkę", item: 80, build: "hut", after: ["nails", "planks", "iron"], done: () => isBuilt("hut"),
            text: "Twój pierwszy własny dach: mała chatka z bali (30 desek, 40 gwoździ, 20 kamieni i 6 żelaza). Wejdziesz do niej przez drzwi. Jest tylko jedna na całą grę." },
        { id: "furnish", ch: 4, title: "Urządź wnętrze chatki", item: 80, after: ["hut", "chest"], done: () => ((farmData().buildings || {})[100] || []).some(b => !b.site),
            text: "W środku masz podłogę 5 × 2 pola (pole przed drzwiami zostaje wolne, a meble nie mogą cię zamknąć w środku). Stań przed wolnym polem podłogi i naciśnij przycisk akcji: wybierzesz, co postawić (łóżko, kredens, warsztat, skrzynię, ławkę albo legowisko). Pod dachem śpi się dobrze także w deszczu i zimą." },

        { id: "borgar", ch: 5, title: "Zapytaj Borgara o zamek", item: 59, after: [], done: () => $gameVariables.value(1) >= 1,
            text: "Karczmarz zawsze coś przemilcza. Zapytaj go wprost, co wie o dawnym zamku." },
        { id: "cellar", ch: 5, title: "Znajdź przejście do piwnic", item: 59, after: ["borgar"], done: () => $gameSelfSwitches.value([9, 1, "A"]),
            text: "Po rozmowie z Borgarem przyjrzyj się ścianom tawerny. Coś w nich wygląda inaczej niż powinno." }
    ];
    const goalById = id => GOALS.find(g => g.id === id);
    const goalDone = g => data().done[g.id] !== undefined;
    const goalAvailable = g => (g.after || []).every(id => data().done[id] !== undefined);
    const goalIcon = g => (g.item ? iconOfItem(g.item) : g.icon || 0);

    function currentGoal() {
        const d = data();
        const pinned = d.pinned && goalById(d.pinned);
        if (pinned && !goalDone(pinned)) return pinned;
        return GOALS.find(g => !goalDone(g) && goalAvailable(g)) || null;
    }

    function announce(goal) {
        $gameTemp.pushLootPopup(goalIcon(goal), "Cel wykonany: " + goal.title, "#9ff0a8");
        AudioManager.playSe({ name: "Item3", volume: 80, pitch: 105, pan: 0 });
    }

    // every finished goal counts, in any order (a goal is done as soon as the game state says so); a save that
    // already has progress gets its goals ticked silently the first time
    function evaluateGoals() {
        const d = data();
        let announced = 0;
        for (const g of GOALS) {
            if (goalDone(g)) continue;
            let ok = false;
            try { ok = !!g.done(); } catch (e) { ok = false; }
            if (!ok) continue;
            d.done[g.id] = dayNow();
            d.day.goals.push(g.id);
            if (d.pinned === g.id) d.pinned = null;
            if (!d.fresh && announced < 2) { announce(g); announced++; }
        }
        d.fresh = false;
    }

    // ------------------------------------------------------------------
    // Hooks that feed the data
    // ------------------------------------------------------------------
    const _Game_Party_gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(item, amount, includeEquip) {
        _Game_Party_gainItem.call(this, item, amount, includeEquip);
        if (item && amount > 0 && DataManager.isItem(item) && $gameSystem) {
            const d = data();
            d.seen[item.id] = true;
            d.day.gained[item.id] = (d.day.gained[item.id] || 0) + amount;
        }
    };
    const _Game_Battler_useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        _Game_Battler_useItem.call(this, item);
        if (item && DataManager.isItem(item) && item.meta && item.meta.Food && $gameSystem) {
            data().eaten++;
            data().day.eaten++;
        }
    };

    // the day is over whenever the clock passes midnight; the summary is only shown after sleeping
    function buildSummary(rec, endedDay) {
        const gained = Object.entries(rec.gained).map(([id, n]) => [Number(id), n]).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const builtNow = completedBuildings().filter(b => !rec.built0.includes(b.id)).map(b => (Farm() && Farm().BUILDINGS[b.type] ? Farm().BUILDINGS[b.type].name : b.type));
        return { day: endedDay, gained, goals: rec.goals.slice(), built: builtNow, eaten: rec.eaten, gold: $gameParty.gold() - rec.gold0, shown: false };
    }
    function onDayChanged(endedDay) {
        const d = data();
        d.last = buildSummary(d.day, endedDay);
        d.day = newDayRecord(dayNow());
    }
    function queueSummary() {
        const d = data();
        if (SUMMARY_ON && d.last && !d.last.shown) {
            d.last.shown = true;
            $gameTemp._pendingSummary = d.last;
        }
    }
    const _advanceDayNight = Game_System.prototype.advanceDayNight;
    Game_System.prototype.advanceDayNight = function(hours) {
        const before = this.dayNightDay();
        _advanceDayNight.call(this, hours);
        if (this._journal && this.dayNightDay() !== before) onDayChanged(before);
    };
    const _sleepUntilHour = Game_System.prototype.sleepUntilHour;
    Game_System.prototype.sleepUntilHour = function(hour) {
        const before = this.dayNightDay();
        const result = _sleepUntilHour.call(this, hour);
        if (this._journal && this.dayNightDay() !== before) {
            onDayChanged(before);
            queueSummary();
        }
        return result;
    };
    // resting on a bedroll or bench (Farming.js) can run through midnight as well
    function afterRest() {
        if (!$gameSystem._journal) return;
        const d = data();
        if (d.last && d.last.day === dayNow() - 1 && !d.last.shown) queueSummary();
    }

    // ------------------------------------------------------------------
    // Where things come from and what they are for (mostly read from the tables of Farming.js)
    // ------------------------------------------------------------------
    const SOURCES = {
        61: "Ścinaj drzewa siekierą (zrobisz ją w warsztacie) i rozrąbuj kłody.",
        77: "Podnoś suche gałęzie z ziemi (przycisk akcji) albo ścinaj krzaki siekierą.",
        64: "Podnoś małe kamienie z ziemi (przycisk akcji) albo rozbijaj skały kilofem.",
        78: "Wykop łopatą z oczyszczonej lub trawiastej ziemi. Kompostownik zamienia gałęzie w ziemię.",
        85: "Żyły rudy (skały z rdzawymi żyłkami) rozbijasz kilofem.",
        92: "Len rośnie na łące (niebieskie kwiatki). Zbierasz go przyciskiem akcji.",
        98: "Łów wędką w stawie (najlepiej o świcie i o zmierzchu).",
        129: "Robisz go w menu Wytwórz... z surowej skóry i lnu.",
        122: "Psujące się jedzenie zamienia się w to. Kompostownik zamieni je w ziemię.",
        123: "Obora daje mleko co dzień. Mleko szybko kwaśnieje.",
        127: "Robisz je w warsztacie: gałązki, kamień na grot i len.",
        101: "Wpada w pułapki. Oprawiasz nożem z menu Przedmioty.",
        94: "Oprawiona zwierzyna (nóż, menu Przedmioty).",
        96: "Oprawiona zwierzyna (nóż, menu Przedmioty).",
        102: "Dziko rosną na łące latem i jesienią.",
        103: "Dziko rosną na łące jesienią.",
        139: "Rosną na dzikich jabłoniach w lesie latem i jesienią. Zerwij je, zanim drzewo ściniesz.",
        140: "Rosną na dzikich gruszach w lesie latem i jesienią. Zerwij je, zanim drzewo ściniesz.",
        104: "Dziko rosną na łące.",
        67: "Leżą w skrzyni w domku. Z plonu odzyskasz kolejne.",
        68: "Leżą w skrzyni w domku. Z plonu odzyskasz kolejne.",
        69: "Leżą w skrzyni w domku. Z plonu odzyskasz kolejne.",
        70: "Leżą w skrzyni w domku. Z plonu odzyskasz kolejne."
    };
    function sourceLines(id) {
        const lines = [];
        if (SOURCES[id]) lines.push(SOURCES[id]);
        const F = Farm();
        if (!F) return lines;
        for (const r of F.HAND_RECIPES || []) if (r.output[0] === id) lines.push("Wytwórz... (bez budynku): " + r.name);
        for (const def of Object.values(F.BUILDINGS)) {
            for (const r of def.recipes || []) if (r.output[0] === id) lines.push(def.name + ": " + r.name + (r.manual ? " (ręcznie)" : ""));
            if (def.produce && def.produce.item === id) lines.push(def.name + ": co " + def.produce.period + " dn. (najwyżej " + def.produce.cap + ")");
        }
        for (const c of Object.values(F.CROPS)) {
            if (c.produce === id) lines.push("Uprawa: " + c.name + " (siew: " + c.seasons.map(s => F.SEASON_NAMES[s]).join(", ").toLowerCase() + "; wzrost " + c.days + " dn.)");
        }
        return lines;
    }
    function usesLines(id) {
        const F = Farm(), lines = [];
        if (!F) return lines;
        const bs = [], rs = [];
        for (const r of F.HAND_RECIPES || []) if (r.inputs.some(([i]) => i === id)) rs.push(r.name);
        for (const def of Object.values(F.BUILDINGS)) {
            if (def.cost.some(([i]) => i === id)) bs.push(def.name);
            for (const r of def.recipes || []) if (r.inputs.some(([i]) => i === id)) rs.push(r.name);
        }
        if (bs.length) lines.push("Budowa: " + bs.join(", "));
        if (rs.length) lines.push("Receptury: " + rs.join(", "));
        return lines;
    }
    const shortSource = id => {
        const lines = sourceLines(id);
        return lines.length ? lines[0] : "";
    };
    const costRows = pairs => pairs.map(([id, n]) => ({ k: "cost", icon: iconOfItem(id), name: dataItem(id).name, have: countOf(id), need: n, note: countOf(id) < n ? shortSource(id) : "" }));

    function materialIds() {
        const F = Farm(), ids = new Set();
        if (F) {
            for (const r of F.HAND_RECIPES || []) { for (const [i] of r.inputs) ids.add(i); ids.add(r.output[0]); }
            for (const def of Object.values(F.BUILDINGS)) {
                for (const [i] of def.cost) ids.add(i);
                for (const r of def.recipes || []) { for (const [i] of r.inputs) ids.add(i); ids.add(r.output[0]); }
                if (def.produce) ids.add(def.produce.item);
            }
            for (const c of Object.values(F.CROPS)) { ids.add(c.seed); ids.add(c.produce); }
        }
        for (const k of Object.keys(SOURCES)) ids.add(Number(k));
        return [...ids].filter(i => dataItem(i) && dataItem(i).name && dataItem(i).itypeId !== 2).sort((a, b) => a - b);
    }
    // a goal's [building, recipe id]; "hand" = a recipe that needs no building
    function recipeRef(ref) {
        const F = Farm();
        if (!F) return null;
        if (ref[0] === "hand") {
            const r = (F.HAND_RECIPES || []).find(x => x.id === ref[1]);
            return r ? { type: "hand", def: { name: "Bez budynku" }, r } : null;
        }
        const def = F.BUILDINGS[ref[0]], r = def && def.recipes.find(x => x.id === ref[1]);
        return r ? { type: ref[0], def, r } : null;
    }
    const stationBuilt = type => type === "hand" || isBuilt(type);
    function allRecipes() {
        const F = Farm(), out = [];
        if (!F) return out;
        for (const r of F.HAND_RECIPES || []) out.push({ type: "hand", def: { name: "Bez budynku" }, r });
        for (const [type, def] of Object.entries(F.BUILDINGS)) for (const r of def.recipes || []) out.push({ type, def, r });
        return out;
    }

    // ------------------------------------------------------------------
    // Rich text for the detail panes: a list of ops is measured, then painted
    // ------------------------------------------------------------------
    function wrapText(win, text, maxWidth) {
        const lines = [];
        for (const paragraph of String(text).split("\n")) {
            let line = "";
            for (const word of paragraph.split(" ")) {
                const trial = line ? line + " " + word : word;
                if (line && win.textWidth(trial) > maxWidth) { lines.push(line); line = word; } else line = trial;
            }
            lines.push(line);
        }
        return lines;
    }
    function layoutOps(win, ops, innerW, imageW) {
        let y = 0;
        for (const op of ops) {
            op.y = y;
            const w = op.narrow ? innerW - imageW : innerW;
            win.resetFontSettings();
            switch (op.k) {
                case "title": op.h = 46; break;
                case "sub": win.contents.fontSize = 22; op.lines = wrapText(win, op.text, w); op.h = 4 + op.lines.length * 28; break;
                case "rule": op.h = 14; break;
                case "p": win.contents.fontSize = 24; op.lines = wrapText(win, op.text, w); op.h = 4 + op.lines.length * 30; break;
                case "muted": win.contents.fontSize = 22; op.lines = wrapText(win, op.text, w); op.h = 4 + op.lines.length * 28; break;
                case "h": op.h = 40; break;
                case "cost": op.h = 34; if (op.note) { win.contents.fontSize = 20; op.noteLines = wrapText(win, op.note, w - 52); op.h += op.noteLines.length * 24; } break;
                case "row": op.h = 34; break;
                case "icons": {
                    const per = Math.max(1, Math.floor(innerW / 110));
                    op.per = per;
                    op.h = Math.ceil(op.list.length / per) * 38 + 4;
                    break;
                }
                case "gap": op.h = op.n; break;
                default: op.h = 0;
            }
            y += op.h;
        }
        return y;
    }
    function paintOps(win, ops, innerW, imageW) {
        const c = win.contents;
        for (const op of ops) {
            win.resetFontSettings();
            const w = op.narrow ? innerW - imageW : innerW;
            switch (op.k) {
                case "title": {
                    let x = 0;
                    if (op.icon) { win.drawIcon(op.icon, 0, op.y + 7); x = ImageManager.iconWidth + 10; }
                    c.fontSize = 32;
                    win.changeTextColor(ColorManager.textColor(16));
                    win.drawText(op.text, x, op.y, w - x);
                    break;
                }
                case "sub":
                    c.fontSize = 22;
                    win.changeTextColor(ColorManager.textColor(7));
                    op.lines.forEach((line, i) => win.drawText(line, 0, op.y + i * 28 - 4, w));
                    break;
                case "rule": c.fillRect(0, op.y + 3, innerW, 2, ColorManager.textColor(26)); break;
                case "p":
                    c.fontSize = 24;
                    op.lines.forEach((line, i) => win.drawText(line, 0, op.y + i * 30 - 3, w));
                    break;
                case "muted":
                    c.fontSize = 22;
                    win.changeTextColor(ColorManager.textColor(7));
                    op.lines.forEach((line, i) => win.drawText(line, 0, op.y + i * 28 - 4, w));
                    break;
                case "h":
                    c.fontSize = 24;
                    win.changeTextColor(ColorManager.textColor(16));
                    win.drawText(op.text, 0, op.y + 4, w);
                    break;
                case "cost": {
                    win.drawIcon(op.icon, 0, op.y + 1);
                    c.fontSize = 24;
                    win.drawText(op.name, ImageManager.iconWidth + 8, op.y - 1, w - 44 - 120);
                    win.changeTextColor(ColorManager.textColor(op.have >= op.need ? 3 : 10));
                    win.drawText(op.have + " / " + op.need, w - 120, op.y - 1, 120, "right");
                    if (op.noteLines) {
                        c.fontSize = 20;
                        win.changeTextColor(ColorManager.textColor(7));
                        op.noteLines.forEach((line, i) => win.drawText(line, ImageManager.iconWidth + 8, op.y + 30 + i * 24 - 4, w - 52));
                    }
                    break;
                }
                case "row": {
                    let x = 0;
                    if (op.icon) { win.drawIcon(op.icon, 0, op.y + 1); x = ImageManager.iconWidth + 8; }
                    c.fontSize = 24;
                    if (op.color !== undefined) win.changeTextColor(ColorManager.textColor(op.color));
                    win.drawText(op.text, x, op.y - 1, w - x);
                    break;
                }
                case "icons":
                    op.list.forEach(([icon, n], i) => {
                        const x = (i % op.per) * 110, y = op.y + Math.floor(i / op.per) * 38;
                        win.drawIcon(icon, x, y + 2);
                        c.fontSize = 24;
                        win.drawText("×" + n, x + ImageManager.iconWidth + 6, y - 1, 70);
                    });
                    break;
            }
        }
    }

    // check boxes and markers drawn straight on the contents of a list row
    function drawMark(win, x, y, state) {
        const ctx = win.contents.context, s = 20, ty = y + Math.floor((win.lineHeight() - s) / 2);
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = state === "locked" ? "#5c4d38" : "#a67c3a";
        ctx.fillStyle = "rgba(20,14,10,0.9)";
        ctx.fillRect(x, ty, s, s);
        ctx.strokeRect(x + 1, ty + 1, s - 2, s - 2);
        if (state === "done") {
            ctx.strokeStyle = "#8fd06a";
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(x + 4, ty + 10); ctx.lineTo(x + 8.5, ty + 15); ctx.lineTo(x + 16.5, ty + 5); ctx.stroke();
        } else if (state === "ready" || state === "pin") {
            ctx.fillStyle = state === "pin" ? "#e0b458" : "#e8c458";
            ctx.beginPath(); ctx.moveTo(x + 10, ty + 4); ctx.lineTo(x + 16, ty + 10); ctx.lineTo(x + 10, ty + 16); ctx.lineTo(x + 4, ty + 10); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        win.contents._baseTexture.update();
    }

    // ------------------------------------------------------------------
    // The five tabs: what the list shows and what the details say
    // ------------------------------------------------------------------
    const TABS = ["Cele", "Surowce", "Budynki", "Receptury", "Notatki", "Zapasy"];

    function goalItems() {
        const d = data();
        const active = GOALS.filter(g => !goalDone(g) && goalAvailable(g)).map(g => ({ label: g.title, icon: goalIcon(g), mark: d.pinned === g.id ? "pin" : "todo", goal: g }));
        const done = GOALS.filter(goalDone).sort((a, b) => d.done[b.id] - d.done[a.id]).map(g => ({ label: g.title, icon: goalIcon(g), mark: "done", right: "dz. " + d.done[g.id], dim: true, goal: g }));
        return active.concat(done);
    }
    function materialItems() {
        return materialIds().map(id => ({ label: dataItem(id).name, icon: iconOfItem(id), mark: has(id) ? "done" : "todo", right: countOf(id) > 0 ? "×" + countOf(id) : "", dim: !has(id), itemId: id }));
    }
    function canBuild(def) {
        return def.cost.every(([id, n]) => countOf(id) >= n);
    }
    function buildingItems() {
        const F = Farm();
        if (!F) return [];
        return Object.entries(F.BUILDINGS).map(([type, def]) => {
            const n = builtCount(type);
            const icon = def.recipes && def.recipes[0] ? iconOfItem(def.recipes[0].output[0]) : def.produce ? iconOfItem(def.produce.item) : iconOfItem(def.cost[0][0]);
            return { label: def.name, icon, mark: n > 0 ? "done" : canBuild(def) ? "ready" : "todo", right: n > 1 ? "×" + n : "", dim: n === 0 && !canBuild(def), type, def };
        });
    }
    function recipeItems() {
        return allRecipes().map(e => {
            const out = e.r.output[0], made = has(out), ready = stationBuilt(e.type) && e.r.inputs.every(([id, n]) => countOf(id) >= n);
            return { label: e.r.name, icon: iconOfItem(out), mark: made ? "done" : ready ? "ready" : "todo", right: e.def.name, dim: !made && !ready, entry: e };
        });
    }
    function noteItems() {
        const notes = data().notes;
        if (notes.length === 0) return [{ label: "Brak notatek", mark: "locked", dim: true, empty: true }];
        return notes.slice().reverse().map(n => ({ label: n.title, mark: "todo", right: "dz. " + n.day, note: n }));
    }
    // worn tools (worst first) and food that will spoil soon (soonest first) - a status view over Durability.js and Spoilage.js
    function wornTools() {
        if (!window.Durability || !Durability.enabled()) return [];
        const ids = Object.keys(Durability.TOOLS).map(Number).filter(id => dataItem(id) && $gameParty.hasItem(dataItem(id)) && Durability.used(id) > 0);
        ids.sort((a, b) => Durability.left(a) / Durability.lifeOf(a) - Durability.left(b) / Durability.lifeOf(b));
        return ids.map(id => {
            const left = Durability.left(id), life = Durability.lifeOf(id), ratio = life > 0 ? left / life : 1;
            const canFix = Durability.TOOLS[id].fix.every(([mid, n]) => countOf(mid) >= n);
            return { label: dataItem(id).name, icon: iconOfItem(id), mark: ratio > 0.4 ? "done" : canFix ? "ready" : "todo",
                right: left + "/" + life, supplyTool: id };
        });
    }
    function spoilingFood() {
        if (!window.Spoilage || !Spoilage.enabled()) return [];
        const items = $gameParty.items().filter(it => Spoilage.isPerishable(it) && Spoilage.hoursLeft(it.id) !== null);
        items.sort((a, b) => Spoilage.hoursLeft(a.id) - Spoilage.hoursLeft(b.id));
        return items.map(it => {
            const h = Spoilage.hoursLeft(it.id);
            return { label: it.name, icon: it.iconIndex, mark: h < 24 ? "ready" : h < 72 ? "todo" : "done",
                right: h < 1 ? "<1 godz." : Math.round(h) + " godz.", supplyFood: it.id };
        });
    }
    function supplyItems() {
        const items = wornTools().concat(spoilingFood());
        if (items.length === 0) items.push({ label: "Nic tu na razie nie wymaga uwagi", mark: "locked", dim: true, empty: true });
        return items;
    }
    function itemsForTab(tab) {
        return [goalItems, materialItems, buildingItems, recipeItems, noteItems, supplyItems][tab]().map(it => Object.assign(it, { tab }));
    }

    function goalOps(g) {
        const d = data(), done = d.done[g.id], F = Farm();
        const ops = [{ k: "title", text: g.title, icon: goalIcon(g) }, { k: "sub", text: CHAPTERS[g.ch] + (done !== undefined ? "  ·  wykonano w dniu " + done : "") }, { k: "rule" }, { k: "p", text: g.text }];
        if (g.build && F) {
            const def = F.BUILDINGS[g.build];
            ops.push({ k: "gap", n: 8 }, { k: "h", text: "Budowa: " + def.name }, ...costRows(def.cost));
        } else if (g.recipe && F) {
            const e = recipeRef(g.recipe);
            ops.push({ k: "gap", n: 8 }, { k: "h", text: e.type === "hand" ? e.r.name : e.def.name + ": " + e.r.name }, ...costRows(e.r.inputs));
            ops.push({ k: "muted", text: e.type === "hand" ? "Robisz to bez żadnego budynku: menu oczyszczonej ziemi > Wytwórz... > " + e.r.name + "."
                : isBuilt(e.type) ? "Potrzebny budynek: " + e.def.name + " (masz)." : "Potrzebny budynek: " + e.def.name + " (jeszcze go nie zbudowałeś)." });
        } else if (g.item) {
            const lines = sourceLines(g.item);
            if (lines.length) ops.push({ k: "gap", n: 8 }, { k: "h", text: "Skąd wziąć" }, ...lines.map(t => ({ k: "muted", text: t })));
        }
        if (done === undefined) ops.push({ k: "gap", n: 10 }, { k: "muted", text: d.pinned === g.id ? "Ten cel jest przypięty: widzisz go w prawym górnym rogu. OK: odepnij." : "OK: przypnij ten cel, żeby widzieć go na ekranie." });
        return ops;
    }
    function materialOps(id) {
        const it = dataItem(id), ops = [{ k: "title", text: it.name, icon: it.iconIndex }, { k: "sub", text: has(id) ? "Już miałeś to w rękach  ·  masz teraz: " + countOf(id) : "Jeszcze tego nie miałeś" }, { k: "rule" }];
        if (it.description) ops.push({ k: "p", text: it.description });
        const src = sourceLines(id);
        ops.push({ k: "gap", n: 8 }, { k: "h", text: "Skąd wziąć" });
        if (src.length) ops.push(...src.map(t => ({ k: "p", text: t })));
        else ops.push({ k: "muted", text: "Nie da się tego zdobyć zwykłym sposobem." });
        const uses = usesLines(id);
        if (uses.length) ops.push({ k: "gap", n: 8 }, { k: "h", text: "Do czego służy" }, ...uses.map(t => ({ k: "p", text: t })));
        return ops;
    }
    function buildingOps(type, def) {
        const n = builtCount(type);
        const ops = [{ k: "title", text: def.name, icon: 0, narrow: true }, { k: "sub", text: n > 0 ? "Zbudowane: " + n : "Jeszcze nie zbudowane", narrow: true }, { k: "rule" }, { k: "p", text: def.desc || "", narrow: true }];
        const facts = [];
        const rows = def.h || 1;
        facts.push(def.yard ? "Ogrodzony wybieg " + def.w + " × " + rows + " pól, w środku żyją zwierzęta" : rows > 1 ? "Zajmuje " + def.w + " × " + rows + " pola" : "Zajmuje " + def.w + (def.w === 1 ? " pole" : " pola") + " obok siebie");
        if (def.rest) facts.push("Odpoczynek: +" + def.rest + " wytrzymałości");
        if (def.water) facts.push("Napełnisz tu konewkę i napijesz się");
        if (def.slots) facts.push("Zmieści " + def.slots + " rodzajów przedmiotów");
        if (def.produce) facts.push("Produkuje: " + dataItem(def.produce.item).name + " co " + def.produce.period + " dn. (najwyżej " + def.produce.cap + ")");
        for (const f of facts) ops.push({ k: "muted", text: f, narrow: true });
        ops.push({ k: "gap", n: 6 }, { k: "h", text: "Koszt budowy" }, ...costRows(def.cost));
        if (def.recipes && def.recipes.length) {
            ops.push({ k: "gap", n: 4 }, { k: "h", text: "Co tu zrobisz" }, { k: "p", text: def.recipes.map(r => r.name).join(",  ") });
        }
        return ops;
    }
    function recipeOps(e) {
        const r = e.r, out = dataItem(r.output[0]);
        const ops = [{ k: "title", text: r.name, icon: out.iconIndex }, { k: "sub", text: e.type === "hand" ? "Bez budynku (na kolanie)" : e.def.name + (isBuilt(e.type) ? "  ·  budynek stoi" : "  ·  jeszcze go nie zbudowałeś") }, { k: "rule" }];
        ops.push({ k: "p", text: "Wynik: " + out.name + " ×" + r.output[1] + (has(r.output[0]) ? "  (już to robiłeś)" : "") + "." });
        if (r.desc) ops.push({ k: "muted", text: r.desc });
        ops.push({ k: "gap", n: 8 }, { k: "h", text: "Składniki" }, ...costRows(r.inputs));
        ops.push({ k: "gap", n: 8 }, { k: "muted", text: "Czas: " + Math.max(1, Math.ceil(r.hours)) + " godz.  ·  " + (r.manual ? "praca ręczna (od razu)" : "praca w tle") + "  ·  -" + (r.stamina || 0) + " wytrzymałości" });
        if (r.tool) ops.push({ k: "muted", text: "Potrzebujesz w plecaku: " + dataItem(r.tool).name + (countOf(r.tool) > 0 ? " (masz)" : " (nie masz)") + ". Nie zużywa się." });
        if (r.unique) ops.push({ k: "muted", text: "Tego przedmiotu potrzebujesz tylko jednego." });
        return ops;
    }
    function noteOps(n) {
        return [{ k: "title", text: n.title }, { k: "sub", text: "Dzień " + n.day }, { k: "rule" }, { k: "p", text: n.text }];
    }
    function toolOps(id) {
        const it = dataItem(id), left = Durability.left(id), life = Durability.lifeOf(id);
        const ops = [{ k: "title", text: it.name, icon: it.iconIndex }, { k: "sub", text: "Wytrzymałość: " + left + " z " + life + " (" + Durability.unitWord(id, left) + ")" }, { k: "rule" }];
        if (it.description) ops.push({ k: "p", text: it.description });
        ops.push({ k: "gap", n: 8 }, { k: "h", text: "Naprawa" }, ...costRows(Durability.TOOLS[id].fix));
        ops.push({ k: "gap", n: 6 }, { k: "muted", text: "Naprawiasz to przy warsztacie: wytrzymałość wraca do pełna." });
        return ops;
    }
    function foodOps(itemId) {
        const it = dataItem(itemId);
        const ops = [{ k: "title", text: it.name, icon: it.iconIndex }, { k: "sub", text: Spoilage.freshnessText(itemId) || "Jeszcze świeże." }, { k: "rule" }];
        if (it.description) ops.push({ k: "p", text: it.description });
        ops.push({ k: "gap", n: 8 }, { k: "muted", text: "W spiżarni psuje się pięć razy wolniej niż w plecaku." });
        return ops;
    }
    function supplyOps(item) {
        if (!item || item.empty) return [{ k: "title", text: "Zapasy" }, { k: "rule" },
            { k: "p", text: "Tu widać zużyte narzędzia (i czego trzeba, żeby je naprawić) oraz jedzenie w plecaku, które zaraz się zepsuje." }];
        return item.supplyTool !== undefined ? toolOps(item.supplyTool) : foodOps(item.supplyFood);
    }
    function detailFor(tab, item) {
        if (!item) return { ops: [] };
        if (item.tab !== undefined) tab = item.tab;   // a row always explains itself, whatever tab is shown
        if (tab === 0) return { ops: goalOps(item.goal) };
        if (tab === 1) return { ops: materialOps(item.itemId) };
        if (tab === 2) return { ops: buildingOps(item.type, item.def), image: item.def.image };
        if (tab === 3) return { ops: recipeOps(item.entry) };
        if (tab === 5) return { ops: supplyOps(item) };
        if (item.empty) return { ops: [{ k: "title", text: "Notatki" }, { k: "rule" }, { k: "p", text: "Tu trafią poszlaki, plotki i ważne rozmowy. Zapisują się same, gdy dowiesz się czegoś istotnego." }] };
        return { ops: noteOps(item.note) };
    }
    function legendFor(tab) {
        const d = data();
        if (tab === 0) return "Wykonano " + GOALS.filter(goalDone).length + " z " + GOALS.length + " celów";
        if (tab === 1) { const ids = materialIds(); return "Poznano " + ids.filter(has).length + " z " + ids.length + " surowców"; }
        if (tab === 2) { const F = Farm(), types = F ? Object.keys(F.BUILDINGS) : []; return "Zbudowano " + types.filter(isBuilt).length + " z " + types.length + " rodzajów budynków"; }
        if (tab === 3) { const rs = allRecipes(); return "Wykonano " + rs.filter(e => has(e.r.output[0])).length + " z " + rs.length + " receptur"; }
        if (tab === 5) { const n = wornTools().length, f = spoilingFood().length; return n + f === 0 ? "Wszystko w porządku" : "Do ogarnięcia: " + n + " narzędzi, " + f + " potraw"; }
        return "Notatek: " + d.notes.length;
    }

    // ------------------------------------------------------------------
    // The journal scene
    // ------------------------------------------------------------------
    function Window_JournalList() {
        this.initialize(...arguments);
    }
    Window_JournalList.prototype = Object.create(Window_Selectable.prototype);
    Window_JournalList.prototype.constructor = Window_JournalList;
    Window_JournalList.prototype.initialize = function(rect) {
        this._items = [];
        this._onSelect = null;
        this._onTab = null;
        Window_Selectable.prototype.initialize.call(this, rect);
    };
    Window_JournalList.prototype.maxItems = function() { return this._items.length; };
    Window_JournalList.prototype.currentItem = function() { return this._items[this.index()] || null; };
    Window_JournalList.prototype.setItems = function(items) {
        this._items = items;
        this.refresh();
        this.scrollTo(0, 0);
        this.select(items.length ? 0 : -1);
        this.updateHelp();
    };
    Window_JournalList.prototype.drawItem = function(index) {
        const it = this._items[index], rect = this.itemLineRect(index);
        this.changePaintOpacity(!it.dim);
        drawMark(this, rect.x, rect.y, it.mark);
        let x = rect.x + 30;
        if (it.icon) { this.drawIcon(it.icon, x, rect.y + 2); x += ImageManager.iconWidth + 6; }
        let right = rect.x + rect.width;
        if (it.right) {
            this.contents.fontSize = 20;
            const w = this.textWidth(it.right);
            this.changeTextColor(ColorManager.textColor(7));
            this.drawText(it.right, right - w, rect.y + 1, w, "left");
            this.resetFontSettings();
            right -= w + 10;
        }
        this.resetTextColor();
        this.drawText(it.label, x, rect.y, Math.max(0, right - x), "left");
        this.changePaintOpacity(true);
    };
    Window_JournalList.prototype.updateHelp = function() {
        if (this._onSelect) this._onSelect(this.currentItem());
    };
    Window_JournalList.prototype.callUpdateHelp = function() {
        if (this.active) this.updateHelp();
    };
    Window_JournalList.prototype.cursorLeft = function() { if (this._onTab) this._onTab(-1); };
    Window_JournalList.prototype.cursorRight = function() { if (this._onTab) this._onTab(1); };

    function Window_JournalDetail() {
        this.initialize(...arguments);
    }
    Window_JournalDetail.prototype = Object.create(Window_Base.prototype);
    Window_JournalDetail.prototype.constructor = Window_JournalDetail;
    Window_JournalDetail.prototype.initialize = function(rect) {
        this._contentH = 0;
        this._imageName = null;
        this._ops = [];
        Window_Base.prototype.initialize.call(this, rect);
    };
    Window_JournalDetail.prototype.contentsHeight = function() {
        return Math.max(this.innerHeight, this._contentH || 0);
    };
    Window_JournalDetail.prototype.setDetail = function(detail) {
        this._ops = detail.ops || [];
        this._imageName = detail.image || null;
        this._contents_token = null;
        this.redraw();
    };
    Window_JournalDetail.prototype.redraw = function() {
        const imageW = this._imageName ? 128 : 0;
        this.resetFontSettings();
        this._contentH = layoutOps(this, this._ops, this.innerWidth, imageW);
        this.createContents();
        this.origin.y = 0;
        paintOps(this, this._ops, this.innerWidth, imageW);
        this.paintImage();
    };
    Window_JournalDetail.prototype.paintImage = function() {
        if (!this._imageName) return;
        const bmp = ImageManager.loadSystem(this._imageName);
        const token = this._contents_token = {};
        const draw = () => {
            if (this._contents_token !== token) return;
            const scale = Math.min(1, 120 / bmp.width), w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
            this.contents.blt(bmp, 0, 0, bmp.width, bmp.height, this.innerWidth - w - 4, 4, w, h);
        };
        bmp.addLoadListener(draw);
    };
    Window_JournalDetail.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        // long details scroll with the mouse wheel
        if (this._contentH > this.innerHeight && TouchInput.wheelY !== 0 && this.isTouchedInsideFrame()) {
            this.origin.y = Math.max(0, Math.min(this._contentH - this.innerHeight, this.origin.y + Math.sign(TouchInput.wheelY) * 60));
        }
    };

    function Scene_Journal() {
        this.initialize(...arguments);
    }
    Scene_Journal.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Journal.prototype.constructor = Scene_Journal;
    Scene_Journal.prototype.prepare = function(tab) {
        this._startTab = tab || 0;
    };
    Scene_Journal.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        evaluateGoals();
        const top = this.mainAreaTop(), tabsH = this.calcWindowHeight(1, true), legendH = this.calcWindowHeight(1, false);
        const bodyY = top + tabsH, bodyH = this.mainAreaHeight() - tabsH - legendH, listW = 470;
        this._tabs = new Window_Command(new Rectangle(0, top, Graphics.boxWidth, tabsH));
        this._tabs.maxCols = () => TABS.length;
        this._tabs.makeCommandList = function() { TABS.forEach(t => this.addCommand(t, "tab")); };
        this._tabs.itemTextAlign = () => "center";
        this._tabs.refresh();
        this._tabs.deactivate();
        this.addWindow(this._tabs);
        this._list = new Window_JournalList(new Rectangle(0, bodyY, listW, bodyH));
        this._list._onSelect = item => this._detail.setDetail(detailFor(this._tab, item));
        this._list._onTab = dir => this.changeTab(dir);
        this._list.setHandler("ok", this.onListOk.bind(this));
        this._list.setHandler("cancel", this.popScene.bind(this));
        this._list.setHandler("pagedown", () => { this.changeTab(1); });
        this._list.setHandler("pageup", () => { this.changeTab(-1); });
        this.addWindow(this._list);
        this._detail = new Window_JournalDetail(new Rectangle(listW, bodyY, Graphics.boxWidth - listW, bodyH));
        this.addWindow(this._detail);
        this._legend = new Window_Base(new Rectangle(0, bodyY + bodyH, Graphics.boxWidth, legendH));
        this.addWindow(this._legend);
        this._tab = Math.max(0, Math.min(TABS.length - 1, this._startTab || 0));
        this.showTab();
    };
    Scene_Journal.prototype.showTab = function() {
        this._tabs.select(this._tab);
        this._list.setItems(itemsForTab(this._tab));
        this._list.activate();
        this.refreshLegend();
    };
    Scene_Journal.prototype.changeTab = function(dir) {
        this._tab = (this._tab + dir + TABS.length) % TABS.length;
        SoundManager.playCursor();
        this.showTab();
    };
    Scene_Journal.prototype.refreshLegend = function() {
        const w = this._legend;
        w.contents.clear();
        w.resetFontSettings();
        w.contents.fontSize = 22;
        w.changeTextColor(ColorManager.textColor(7));
        const keys = ["←/→ lub Q/E: zakładka   OK: przypnij cel   Anuluj: wróć",
            "Ptaszek: poznane   ←/→ lub Q/E: zakładka   Anuluj: wróć",
            "Ptaszek: zbudowane   Romb: możesz zbudować teraz   ←/→: zakładka",
            "Ptaszek: zrobione   Romb: możesz zrobić teraz   ←/→: zakładka",
            "←/→ lub Q/E: zakładka   Anuluj: wróć",
            "Ptaszek: w porządku   Romb: masz na naprawę / zaraz się zepsuje   ←/→ lub Q/E: zakładka"][this._tab];
        w.drawText(keys, 0, 0, w.innerWidth - 300);
        w.changeTextColor(ColorManager.textColor(16));
        w.drawText(legendFor(this._tab), w.innerWidth - 400, 0, 400, "right");
    };
    Scene_Journal.prototype.onListOk = function() {
        const it = this._list.currentItem();
        if (this._tab === 0 && it && it.goal && !goalDone(it.goal)) {
            const d = data();
            d.pinned = d.pinned === it.goal.id ? null : it.goal.id;
            const index = this._list.index();
            this._list.setItems(itemsForTab(0));
            this._list.select(Math.min(index, this._list.maxItems() - 1));
        }
        this._list.activate();
    };
    Scene_Journal.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        if (Input.isTriggered("journal")) this.popScene();   // J closes it as well
    };

    // ------------------------------------------------------------------
    // The summary of the day
    // ------------------------------------------------------------------
    function forecastText(day) {
        const S = window.Survival;
        if (!S || !S.weatherPlan) return null;
        const p = S.weatherPlan(day);
        if (!p) return "bezdeszczowo";
        return (p.type === "snow" ? "śnieg" : "deszcz") + " od " + p.start + ":00 do " + p.end + ":00";
    }
    function fieldsReport() {
        const F = Farm();
        if (!F) return null;
        let ripe = 0, growing = 0;
        for (const plots of Object.values(farmData().plots || {})) {
            for (const [k, p] of Object.entries(plots || {})) {
                if (!p.crop) continue;
                const [x, y] = k.split(",").map(Number);
                if (F.isRipe(x, y, p)) ripe++; else growing++;
            }
        }
        return ripe + growing > 0 ? { ripe, growing } : null;
    }
    function readyReport() {
        const F = Farm(), out = [];
        if (!F) return out;
        for (const list of Object.values(farmData().buildings || {})) {
            for (const b of list || []) {
                const def = F.BUILDINGS[b.type];
                if (!def || b.site) continue;
                if (def.produce) { const n = F.readyProduce(b); if (n > 0) out.push(def.name + ": " + dataItem(def.produce.item).name + " ×" + n); }
                if (b.job && F.jobReady(b)) out.push(def.name + ": " + dataItem(b.job.out[0]).name + " ×" + b.job.out[1]);
            }
        }
        return out;
    }
    function winterWarning(day) {
        const F = Farm();
        if (!F) return null;
        const cloak = countOf(112) > 0;
        const cur = F.seasonIndex(day);
        if (cur === 3) return cloak ? null : "Jest zima. Bez płaszcza, ogniska lub ciepłego posiłku marzniesz.";
        for (let k = 1; k <= 12; k++) if (F.seasonIndex(day + k) === 3) return cloak ? null : "Do zimy zostało " + k + " dn. Uszyj płaszcz (garbarnia).";
        return null;
    }
    function summaryOps(s) {
        const F = Farm(), next = s.day + 1, ops = [];
        ops.push({ k: "title", text: "Dzień " + s.day + " zakończony", icon: 82 });
        ops.push({ k: "sub", text: (F ? F.seasonOf(s.day) : "") + "  ·  zaczyna się dzień " + next });
        ops.push({ k: "rule" });
        let any = false;
        if (s.goals.length) {
            any = true;
            ops.push({ k: "h", text: "Wykonane cele" });
            for (const id of s.goals) { const g = goalById(id); if (g) ops.push({ k: "row", icon: goalIcon(g), text: g.title, color: 3 }); }
        }
        if (s.gained.length) {
            any = true;
            ops.push({ k: "h", text: "Zdobyte" }, { k: "icons", list: s.gained.map(([id, n]) => [iconOfItem(id), n]) });
        }
        if (s.built.length) { any = true; ops.push({ k: "h", text: "Zbudowano" }, { k: "p", text: s.built.join(", ") }); }
        const misc = [];
        if (s.eaten) misc.push("Posiłki: " + s.eaten);
        if (s.gold) misc.push("Złoto: " + (s.gold > 0 ? "+" : "") + s.gold);
        if (misc.length) { any = true; ops.push({ k: "muted", text: misc.join("   ·   ") }); }
        if (!any) ops.push({ k: "muted", text: "Spokojny dzień. Nic szczególnego się nie wydarzyło." });
        ops.push({ k: "gap", n: 6 }, { k: "rule" }, { k: "h", text: "Co czeka rano" });
        const weather = forecastText(next);
        if (weather) ops.push({ k: "row", icon: 0, text: "Pogoda: " + weather });
        if (F && F.seasonIndex(next) !== F.seasonIndex(s.day)) ops.push({ k: "row", text: "Nowa pora roku: " + F.seasonOf(next), color: 6 });
        const fields = fieldsReport();
        if (fields) ops.push({ k: "row", text: "Na polach: " + fields.ripe + " gotowych do zbioru, " + fields.growing + " rośnie", color: fields.ripe > 0 ? 3 : 0 });
        for (const line of readyReport().slice(0, 5)) ops.push({ k: "row", text: "Do odebrania: " + line, color: 3 });
        const warn = winterWarning(next);
        if (warn) ops.push({ k: "row", text: warn, color: 10 });
        const goal = currentGoal();
        if (goal) ops.push({ k: "row", icon: goalIcon(goal), text: "Cel: " + goal.title, color: 16 });
        ops.push({ k: "gap", n: 8 }, { k: "muted", text: "OK: zacznij nowy dzień" });
        return ops;
    }

    function Window_DaySummary() {
        this.initialize(...arguments);
    }
    Window_DaySummary.prototype = Object.create(Window_Base.prototype);
    Window_DaySummary.prototype.constructor = Window_DaySummary;
    Window_DaySummary.prototype.setup = function(summary) {
        const width = 760, ops = summaryOps(summary);
        this.width = width;
        this.resetFontSettings();
        const contentH = layoutOps(this, ops, width - this.padding * 2, 0);
        this.height = Math.min(Graphics.boxHeight - 24, contentH + this.padding * 2);
        this.x = Math.floor((Graphics.boxWidth - width) / 2);
        this.y = Math.floor((Graphics.boxHeight - this.height) / 2);
        this.createContents();
        paintOps(this, ops, this.innerWidth, 0);
        this._ready = true;
    };

    function Scene_DaySummary() {
        this.initialize(...arguments);
    }
    Scene_DaySummary.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_DaySummary.prototype.constructor = Scene_DaySummary;
    Scene_DaySummary.prototype.prepare = function(summary) {
        this._summary = summary;
    };
    Scene_DaySummary.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        evaluateGoals();
        this._window = new Window_DaySummary(new Rectangle(0, 0, 760, 200));
        this.addWindow(this._window);
        this._window.setup(this._summary);
        this._wait = 12;
    };
    Scene_DaySummary.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        if (this._wait > 0) { this._wait--; return; }
        if (Input.isTriggered("ok") || Input.isTriggered("cancel") || TouchInput.isTriggered() || TouchInput.isCancelled()) {
            SoundManager.playOk();
            this.popScene();
        }
    };

    // ------------------------------------------------------------------
    // On the map: goal check, the J key, the summary after sleeping, the tracker
    // ------------------------------------------------------------------
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        this.updateJournal();
    };
    Scene_Map.prototype.canUseJournal = function() {
        return !SceneManager.isSceneChanging() && !$gameMessage.isBusy() && !$gameMap.isEventRunning() && !$gameTemp._farmMenuOpen && !$gameTemp._buildMode && $gamePlayer.canMove();
    };
    Scene_Map.prototype.updateJournal = function() {
        if (!$gameSystem) return;
        if (Graphics.frameCount % 30 === 0) evaluateGoals();
        if (Input.isTriggered("journal") && this.canUseJournal()) {
            SoundManager.playOk();
            SceneManager.push(Scene_Journal);
            return;
        }
        if ($gameTemp._pendingSummary && this.canUseJournal() && $gameScreen.brightness() >= 250) {
            const summary = $gameTemp._pendingSummary;
            $gameTemp._pendingSummary = null;
            SceneManager.push(Scene_DaySummary);
            SceneManager.prepareNextScene(summary);
        }
    };

    function goalProgress(g) {
        const F = Farm();
        let pairs = null;
        if (g.build && F) pairs = F.BUILDINGS[g.build].cost;
        else if (g.recipe && F) pairs = recipeRef(g.recipe).r.inputs;
        if (pairs) {
            const lack = pairs.filter(([id, n]) => countOf(id) < n);
            if (lack.length === 0) return g.build ? "Masz wszystko. Wybierz miejsce w menu budowy." : g.recipe[0] === "hand" ? "Masz składniki: menu ziemi > Wytwórz... > " + recipeRef(g.recipe).r.name : "Masz składniki. Idź do budynku.";
            return lack.slice(0, 3).map(([id, n]) => dataItem(id).name + " " + countOf(id) + "/" + n).join("  ·  ");
        }
        const first = g.text.split(/[.!?] /)[0];
        return first.length > 58 ? first.slice(0, 56) + "…" : first;
    }

    // The goal window: right under the minimap in the top right corner (Minimap.js), in the map's place on maps
    // without one; without the plugin, under the stamina gauge as before.
    function Sprite_GoalTracker() {
        this.initialize(...arguments);
    }
    Sprite_GoalTracker.prototype = Object.create(Sprite.prototype);
    Sprite_GoalTracker.prototype.constructor = Sprite_GoalTracker;
    Sprite_GoalTracker.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(216, 132));
        this._key = "";
        this.visible = false;
    };
    Sprite_GoalTracker.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const scene = SceneManager._scene, hud = scene && scene._survivalHud;
        const r = window.Minimap ? Minimap.rect() : null;
        if (r) {
            this.x = r.x;
            this.y = r.y + (r.h > 0 ? r.h + Minimap.gap : 0);
            if (this.bitmap.width !== r.w) { this.bitmap = new Bitmap(r.w, 132); this._key = ""; }
        } else if (hud && hud._gauge) {
            this.x = hud.x + hud._gauge.x;
            this.y = hud.y + hud._gauge.y + 76;
        }
        const g = SHOW_TRACKER && $gameSystem ? currentGoal() : null;
        this.visible = !!g && !!hud && !!hud._gauge && hud._gauge.visible && !$gameMessage.isBusy();
        if (!g) return;
        const line = goalProgress(g), key = g.id + "|" + line + "|" + this.bitmap.width;
        if (key !== this._key) {
            this._key = key;
            this.paint(g, line);
        }
    };
    function wrapBitmapText(bmp, text, maxWidth, maxLines) {
        const lines = [];
        let line = "";
        for (const word of String(text).split(" ")) {
            const trial = line ? line + " " + word : word;
            if (line && bmp.measureTextWidth(trial) > maxWidth) { lines.push(line); line = word; } else line = trial;
        }
        lines.push(line);
        if (lines.length > maxLines) {
            lines.length = maxLines;
            lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…";
        }
        return lines;
    }
    Sprite_GoalTracker.prototype.paint = function(g, line) {
        const bmp = this.bitmap, w = bmp.width, ctx = bmp.context, inner = w - 20;
        bmp.clear();
        bmp.fontFace = $gameSystem.mainFontFace();
        bmp.fontSize = 18;
        const titleLines = wrapBitmapText(bmp, g.title, inner, 2);
        bmp.fontSize = 14;
        const lines = wrapBitmapText(bmp, line, inner, 3);
        const h = 8 + 15 + titleLines.length * 21 + 3 + lines.length * 17 + 6;
        ctx.fillStyle = "rgba(22,15,10,0.86)";
        ctx.beginPath();
        const r = 8;
        ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(166,124,58,0.9)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        bmp.outlineWidth = 3;
        bmp.outlineColor = "rgba(14,8,4,0.9)";
        let y = 6;
        bmp.fontSize = 13;
        bmp.textColor = "#dcb460";
        bmp.drawText("CEL", 10, y, 60, 16, "left");
        y += 15;
        bmp.fontSize = 18;
        bmp.textColor = "#f0e4c8";
        for (const t of titleLines) { bmp.drawText(t, 10, y, inner, 21, "left"); y += 21; }
        y += 3;
        bmp.fontSize = 14;
        bmp.textColor = "#b8ab94";
        for (const t of lines) { bmp.drawText(t, 10, y, inner, 17, "left"); y += 17; }
        bmp._baseTexture.update();
    };

    const _Scene_Map_createSurvivalHud = Scene_Map.prototype.createSurvivalHud;
    if (_Scene_Map_createSurvivalHud) {
        Scene_Map.prototype.createSurvivalHud = function() {
            _Scene_Map_createSurvivalHud.call(this);
            if (this._survivalHud) {
                this._goalTracker = new Sprite_GoalTracker();
                (this._hudLayer || this._survivalHud).addChild(this._goalTracker);
            }
        };
    }

    // ------------------------------------------------------------------
    // Main menu entry and plugin commands
    // ------------------------------------------------------------------
    const _addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
    Window_MenuCommand.prototype.addOriginalCommands = function() {
        _addOriginalCommands.call(this);
        this.addCommand("Dziennik", "journal", true);
    };
    Window_MenuCommand.prototype.maxCols = function() {
        return 5;
    };
    const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _Scene_Menu_createCommandWindow.call(this);
        this._commandWindow.setHandler("journal", this.commandJournal.bind(this));
    };
    Scene_Menu.prototype.commandJournal = function() {
        SceneManager.push(Scene_Journal);
    };

    function addNote(title, text) {
        const d = data();
        d.notes.push({ title: String(title || "Notatka"), text: String(text || ""), day: dayNow() });
        $gameTemp.pushLootPopup(iconOfItem(59), "Nowa notatka: " + title, "#f0e4c8");
        AudioManager.playSe({ name: "Bell1", volume: 70, pitch: 100, pan: 0 });
    }
    PluginManager.registerCommand(pluginName, "addNote", args => addNote(args.title, String(args.text || "").replace(/\\n/g, "\n")));
    PluginManager.registerCommand(pluginName, "openJournal", () => { SceneManager.push(Scene_Journal); });

    window.Journal = { recipeRef, GOALS, CHAPTERS, data, evaluateGoals, currentGoal, goalAvailable, goalDone, addNote, afterRest, buildSummary, summaryOps, itemsForTab, detailFor, materialIds, allRecipes, sourceLines, usesLines, goalProgress, has, Scene_Journal, Scene_DaySummary };
})();
