//=============================================================================
// Dwor_Data.js
//=============================================================================
// The data of the arc W7 "Dwór z kamieni twierdzy" (docs/QUESTY.md W7) - VARIANT A (the user's choice 2026-10-17): the Lord knows
// nothing. Lord Leopold Zaleski is vain and naive and believes the "fairy tale" of the fortress stones; his butler Feliks has for
// years sold the faction (Straż Pewności, "the Black Eyes") the water of the Order's canal, news and the raven stones of the manor's
// own walls. Dwor.js is the engine. Registered in js/plugins.js under the other arcs' data (Kantor_Data), above TownLife and
// TownQuests:
//   - window.TownQuestsPacks: the quest W7 (eight steps, chapters 1-7), its things (Feliks's letters, the copy), the remarks
//   - TownLifeData: Feliks's day (6-10:30 the market, 10:30-20 in the manor's hall behind the butler's lectern - "inside dwor" on the
//     town map = gone through the east gate; the hall's marker "Miejsce: feliks_hol"), the same for Teodor once Feliks is gone
//   - window.DworData: the maps (172-174, built by tools/w7/build_dwor.py), the event ids (570-599, owner "Dwor" - TawernaCore's
//     registry), the places, the clock, the words

/*:
 * @target MZ
 * @plugindesc [W7] Dane wątku „Dwór z kamieni twierdzy” (wariant A: Lord nic nie wie, Feliks sprzedaje frakcji): hol, biblioteka, gabinet (mapy 172-174). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Kantor_Data
 *
 * @help
 * ============================================================================
 * Dwor_Data.js - dane wątku W7 „Dwór z kamieni twierdzy”
 * ============================================================================
 * Same dane: czyta je Dwor.js (silnik). Zadanie W7 trafia do TownQuests
 * przez window.TownQuestsPacks, plan dnia Feliksa (i Teodora) do TownLife.
 * Musi stać nad TownLife.js i TownQuests_Data.js (pod Kantor_Data).
 * Numery zdarzeń 570-599 (właściciel "Dwor"), nowe mapy 172 „Dwór - Hol”,
 * 173 „Dwór - Biblioteka”, 174 „Dwór - Gabinet” (pod Posiadłością Lorda).
 * ============================================================================
 */

(() => {
    "use strict";

    const MAP = { town: 8, manor: 24, hol: 172, bib: 173, gab: 174, ruins: 10, field: 3, hut: 100, house: 19, heart: 11 };
    const IDS = [570, 599];
    // the injected events: the Lord in the hall and the library while he shows the hero round (chapter 2), Feliks coming up the
    // trapdoor of the study (caught, chapter 4), the bundle of letters on Feliks's desk once the drawer is open, Feliks and Kuba at
    // the hatch behind the orangery at night (chapter 3: the water - W1)
    const EV = { lordHol: 570, lordBib: 571, feliksGab: 572, listy: 573, feliksNoc: 575, kubaNoc: 576 };
    const ART = {
        lord: ["$Npc_Lord", 0, 2, 1], feliks: ["$Npc_Feliks", 0, 2, 1], kuba: ["$Npc_Woziwoda", 0, 2, 1], teodor: ["$Npc_Kamerdyner", 0, 2, 1],
        listy: ["!W7_Dwor", 0, 8, 0]
    };

    // ------------------------------------------------------------------ the places (the maps of tools/w7/build_dwor.py; Map024 is the user's)
    const PLACES = {
        hol: { land: [11, 13, 8], fromBib: [3, 4, 2], fromGab: [19, 4, 2], lord: [12, 12, 4], lordKruki: [16, 5, 8], bibDoor: [3, 4], gabDoor: [19, 3] },
        bib: { land: [8, 10, 8], lord: [7, 7, 6], kronika: [8, 7] },
        gab: { land: [7, 9, 8], trapLand: [11, 8, 4], trap: [12, 8], feliks: [12, 9, 8], listy: [2, 4], exitTo: [19, 4, 2] },
        manor: { door: [20, 12], doorLand: [20, 13, 2], hatch: [3, 20], hatchLand: [3, 21, 2], feliksNoc: [2, 20, 6], kubaNoc: [3, 19, 2],
            garden: { x1: 21, y0: 17 }, out: [8, 102, 51, 4], f9: [20, 14, 8] },
        town: { gate: [100, 51], f9: [50, 46, 8] }
    };

    // ------------------------------------------------------------------ the clock
    const TIME = {
        lord: [8, 20],                 // the Lord at his door (Story.js)
        market: [6, 10.5],             // Feliks shopping (TownLife)
        hall: [10.5, 20],              // Feliks behind his lectern in the hall
        hatch: [1.5, 3],               // Feliks at the hatch with Kuba (W1's water)
        night: [22, 5],                // the hatch can be used, the study is dark
        down: [1.4, 1.6],              // Feliks comes into the study to go down the trapdoor
        up: [2.95, 3.15],              // ...and comes back up it
        copy: 0.5,                     // copying the letters takes half an hour
        kantor: [23.5, 24.6]           // Feliks at the kantor's back door on the nights of day%7 == 3 (Kantor.js)
    };
    const OBS = { rano: 300, dzien: 240, noc: 300, near: 7, close: 2.5, hall: 6, hatch: 8, need: 3 };
    const PAY = { truthDebt: 250, truthBuyback: 1000, truthElse: 100, week: 100, toll: 5 };
    const GEAR = [[59, 3], [93, 2], [152, 2], [127, 10]];      // the manor's armoury: torches, ropes, bandages, arrows
    const KAZIMIERZ = "Kazimierz";

    // ------------------------------------------------------------------ the words
    const TX = {
        // ---- the door, the rooms
        drzwiWejdz: "Wejść do dworu?",
        drzwiTak: "Wejdź.", drzwiNie: "Nie teraz.",
        kamien: "Kamień z dawnej twierdzy z wyrytym krukiem. Co dziesiąty kamień w tej ścianie ma takiego kruka.",
        brak: "Tu powinien być kruk. Kamień jaśniejszy od innych, zaprawa wokół biała i świeża. Ktoś go niedawno wymienił.",
        brakPo: "Tu był kruk. Feliks wyjął go i sprzedał - jak dwa następne obok drzwi gabinetu.",
        schody: "Schody na piętro - pokoje jaśnie pana. Bez zaproszenia ani kroku dalej.",
        ksiega: "Księga gości dworu. Ostatnie wpisy: „kurier z przystani - w sprawie wosku”, „kupiec V. - w sprawie wosku”. Wosku? Pismo Feliksa.",
        ksiegaTeodor: "Księga gości dworu. Od kilku dni pisze w niej ktoś inny - równe, okrągłe litery Teodora.",
        gabZamkniety: "Gabinet jaśnie pana. Zamknięty na klucz - klucz nosi {butler}.",
        gabNoc: "Drzwi na hol zamknięte na klucz - od tamtej strony.",
        biurko: "Rachunki dworu. Jaśnie pan podpisuje, co mu podsuną - na każdej stronie ten sam zamaszysty podpis i ani jednej poprawki.",
        biurkoPo: "Rachunki dworu. Między kartkami - ołówkowe kreski Lorda. Teraz czyta wszystko, strona po stronie.",
        mapa: "Mapa wyspy. Ktoś zaznaczył ołówkiem dwór, wzgórze tawerny i kopiec z krukiem przy chacie dziadka. Pismo Feliksa.",
        kronikaSam: ["(Kronika rodu Zaleskich. Na zakładce - piąta zwrotka starej pieśni:)",
            "„Dwór z kamieni - kamień pamięta, / skąd go wzięła ręka przeklęta. / Kruk na progu, kruk na ścianie - / nikt nie pyta, co się stanie.”"],
        klapaZejdz: "Zejść do kanału?",
        klapaTak: "Zejdź.", klapaNie: "Jeszcze nie.",
        kanalDol: ["> (Stary kanał zakonu. Po kostki w mule, gdzieś za kratą szumi woda. Kilkadziesiąt kroków - i drabina do włazu za oranżerią.)"],
        wlazZejdz: "Zejść przez właz?",
        wlazTak: "Zejdź do kanału.", wlazNie: "Nie teraz.",
        wlazZamkniety: "Zasuwa włazu zamknięta od środka.",
        wlazFeliks: "Przy włazie stoi Feliks z Kubą. Nie teraz.",
        wlazDzien: "Za dnia ogrodnik i straż widzą każdy krok. Nocą.",
        wlazRygiel: "Zasuwa zaryglowana od dołu. Feliks pilnuje się teraz bardziej - spróbuj za dwie noce.",
        kanalGora: ["> (Kanał prowadzi pod dworem. Na końcu - drabina i klapa w podłodze. Ostrożnie, ramieniem...)"],
        // ---- chapter 2: the invitation, the tour, the chronicle
        zaproAsk: ["Wnuku Stacha! Połowa długu - i to przed terminem. Przyznam, zaczynam cię lubić.",
            "Ty pewnie nigdy nie byłeś w środku? Wejdź. Pokażę ci coś, czego nawet Stach nie widział: ściany z kamieni twierdzy."],
        zaproAskBuy: ["Wnuku Stacha. Połowa za działkę - przyznam, nie wierzyłem. Ty pewnie nigdy nie byłeś w środku?",
            "Wejdź. Pokażę ci, z czego jest ten dom. Ściany z kamieni twierdzy."],
        // (2026-10-17) after W1's big choice: shamed at the market (W1 a) - cold, but the debt is the debt; the quiet way (W1 b) - a friend
        zaproAskCold: ["Wnuku Stacha. Po tamtym targu nie myślałem, że jeszcze cię tu zobaczę. A jednak - połowa długu, co do grosza.",
            "Wejdź. Skoro całe miasto wie, co płynęło pod moim dworem, zobacz chociaż, z czego ten dwór jest zrobiony."],
        zaproAskAlly: ["Mój przyjaciel od zasuwy! I połowa długu na dodatek. Nigdy cię nie oprowadziłem po domu - wstyd.",
            "Wejdź. Pokażę ci ściany z kamieni twierdzy. Teraz, kiedy Feliksa nie ma, sam muszę pilnować, kto tu wchodzi."],
        zaproTak: "Wejdę.", zaproNie: "Innym razem.",
        zaproLater: ["Jak chcesz. Drzwi poczekają - od ósmej do ósmej."],
        tour: [
            ["lord", "Witaj w moim domu. Hol pamięta jeszcze mojego dziadka - to on postawił ten dwór."],
            ["lord", "Każdy kamień w tych ścianach przywieziono z ruin dawnej twierdzy. Z Kruczych Skał. Dziadek kazał je układać tak, jak leżały."],
            ["walk", "lordKruki"],
            ["lord", "Widzisz? Co dziesiąty ma wyrytego kruka. Mówią, że jeden kruk pilnuje dziewięciu kamieni."],
            ["hero", "(Liczysz. Kruk... dziewięć gładkich... kruk. A przy drzwiach gabinetu - trzy zwykłe kamienie, jaśniejsze, na białej, świeżej zaprawie.)"],
            ["hero", "Tu brakuje kruków. Trzech."],
            ["lord", "Feliks dba o mury. Coś kruszeje, to wymienia. Przy tej wilgoci..."],
            ["lord", "(Lord macha ręką.) Ja kamieni nie liczę, młodzieńcze. Ja liczę gości."],
            ["feliks", "(Feliks za pulpitem podnosi wzrok znad księgi gości. Patrzy na ciebie dłużej, niż trzeba.)"],
            ["lord", "Chodź do biblioteki - drzwi na lewo. Mam tam coś ładniejszego niż kamienie: kronikę rodu."]
        ],
        tourKronika: [
            ["lord", "Kronika rodu Zaleskich. Dziadek spisał w niej wszystko, co starzy mówili o twierdzy. Posłuchaj."],
            ["lord", "„Dwór z kamieni - kamień pamięta, / skąd go wzięła ręka przeklęta. / Kruk na progu, kruk na ścianie - / nikt nie pyta, co się stanie.”"],
            ["lord", "To bajki, ale ładne. „Ręka przeklęta” - podobno o moim dziadku, że ruszył kamienie twierdzy. Bzdura. Kamień to kamień."],
            ["lord", "Przychodź, kiedy zechcesz - od ósmej do ósmej drzwi dworu są dla ciebie otwarte. {butler} wie."]
        ],
        tourMuryGone: "Feliks dbał o mury, póki tu służył. Coś kruszało, to wymieniał. Przy tej wilgoci...",
        tourLordWaits: "Jaśnie pan czeka w bibliotece - drzwi na lewo.",
        noteKronika: ["Kronika rodu Zaleskich", "Lord pokazał mi hol dworu: ściany z kamieni dawnej twierdzy, co dziesiąty z wyrytym krukiem. Przy drzwiach gabinetu brakuje trzech kruków - na ich miejscu zwykłe kamienie na świeżej zaprawie. „Feliks dba o mury.”\nW bibliotece kronika rodu, piąta zwrotka pieśni o Kruczych Skałach: „Dwór z kamieni - kamień pamięta, / skąd go wzięła ręka przeklęta. / Kruk na progu, kruk na ścianie - / nikt nie pyta, co się stanie.”\nLord: „To bajki, ale ładne.” Drzwi dworu są dla mnie otwarte od ósmej do ósmej."],
        // ---- chapter 3: Feliks's two lives
        notePlanTitle: "Plan dnia Feliksa",
        plan: {
            head: "Feliks, kamerdyner jaśnie pana. Co widziałem na własne oczy:",
            rano: "6–10:30, rynek: zakupy dla dworu przy straganach, rachunki u sołtysa. U Hanki bierze bułki dla dworu - i papier, lak, atrament na kopy. Za dużo jak na rachunki jednego domu.",
            dzien: "10:30–20, hol dworu: za pulpitem z księgą gości. Co godzinę zagląda do gabinetu; kluczyk od kantorka chowa do kałamarza.",
            noc: "ok. 1:30–3:00, ogród dworu: Feliks wychodzi SPOD włazu z krukiem za oranżerią - nie z dworu! - i napełnia Kubie beczki. Kanał pod włazem musi prowadzić do środka dworu.",
            kantor: "raz w tygodniu, o północy: tylne drzwi kantoru Baltazara (trzy stuknięcia). Wychodzi z sakiewką.",
            miss: "(jeszcze nie widziałem)",
            gone: "Feliksa już nie ma w dworze. Co zostało po nim:",
            teodor: "Teodor: kantorek Feliksa w gabinecie wciąż zamknięty na kluczyk. Klucza nie znalazł - „Feliks nosił go zawsze przy sobie... albo w kałamarzu”.",
            hanka: "Hanka: Feliks kupował papier i lak na kopy. „Mówił, że jaśnie pan dużo pisze. Jaśnie pan? On nawet listów nie czyta.”",
            kuba: "Kuba: Feliks zawsze pytał, kto pyta o wodę - i zapisywał. Wychodził spod włazu za oranżerią, nie z dworu.",
            rejestr: "Rejestr Baltazara: „F.” - dwie beczki wody na tydzień, o północy, tylna furtka dworu.",
            foot: "Zostaje gabinet. Nocą, starym kanałem spod włazu za oranżerią."
        },
        obsRano: "> (Feliks przy straganie Hanki: bułki... i papier, lak, atrament. Na kopy.)",
        obsDzien: "> (Feliks zagląda do gabinetu, wraca do pulpitu - i wrzuca kluczyk do kałamarza.)",
        obsNoc: ["> (Feliks... wyszedł spod włazu, nie z dworu. Kanał pod włazem musi prowadzić do środka.)"],
        feliksSpotted: "Pan coś ode mnie chciał, młodzieńcze?",
        feliksNocKto: "Kto tam?! ...Straż!",
        caughtNoc: "Wyrzucony za bramę dworu - spróbuj innej nocy",
        guardSees: "Stój! Kto tam łazi po ogrodzie jaśnie pana?!",
        slady: {
            kamerdyner: ["> Teodorze, co zostało po Feliksie?",
                "Po Feliksie? Kantorek w gabinecie jaśnie pana, zamknięty na kluczyk. Klucza nie znalazłem - nosił go zawsze przy sobie... albo w kałamarzu. Taki nawyk pisarzy.",
                "I jeszcze to: w nocy czasem słychać pod podłogą gabinetu wodę. Jak w kanale."],
            piekarka: ["> Hanko, Feliks kupował coś u ciebie poza bułkami?",
                "Papier i lak! Na kopy. Mówił, że jaśnie pan dużo pisze. Jaśnie pan? On nawet listów nie czyta, to Feliks mu czytał."],
            woziwoda: ["> Kuba, o co pytał cię Feliks przy beczkach?",
                "(Kuba się rozgląda.) Zawsze o to samo: kto pyta o wodę. I zapisywał. Po co kamerdynerowi takie zapiski?",
                "I wychodził spod włazu za oranżerią. Nie z dworu - spod włazu. Jakby tam miał drzwi."]
        },
        // ---- chapter 4: the study at night
        szuflada: {
            open: ["> (Kantorek Feliksa. Szuflada zamknięta na kluczyk.)"],
            key: "> (Kluczyk - w kałamarzu. Widziałem, jak go tam chowa.)",
            keyGuess: "> (Kluczyk... leży w kałamarzu. Stary nawyk pisarzy.)",
            bundle: "> (W szufladzie plik listów, przewiązany czarnym sznurkiem. Na laku - otwarte białe oko.)",
            letters: [
                "> „Do sztabu Straży Pewności. Woda: dwie beczki na tydzień idą przez kantor na prom. Ogród dworu poję z gałęzi zakonu - pan myśli, że to studnia.”",
                "> „Kamienie: z holu wyjąłem w tym miesiącu trzy z krukiem, przy drzwiach gabinetu. Na ich miejsce zwykłe, na świeżą zaprawę. Pan nie liczy kamieni - pan liczy gości.”"
            ],
            lastHere: "> „Wnuk Stacha spłaca dług i pyta o twierdzę. Zna Borgara. Patrzę na niego. Pan nic nie wie i nie dowie się - pan wierzy w bajki. F.”",
            lastGone: "> „Ktoś widział mnie przy włazie. Jeśli zniknę - kamienie z holu są u kupca. Szukajcie innego przy dworze. F.”",
            lastPays: "> „Wnuk Stacha wie o zasuwie. Płacę mu dwadzieścia groszy na tydzień - niech myśli, że to wystarczy. Moi ludzie zajmą się resztą. Pan nic nie wie. F.”",
            hand: "> (Pismo Feliksa. To samo, co w księdze gości i na rachunkach dworu.)",
            ask: "Co z nimi zrobisz?",
            take: "Zabierz listy.", copy: "Przepisz je (pół godziny).", leave: "Zostaw je.",
            tookSay: ["> (Listy za pazuchą. Szuflada zamknięta, kluczyk w kałamarzu - jakby nikt jej nie ruszał.)"],
            copySay: ["> (Przepisujesz słowo w słowo, przy świecy jaśnie pana. Oryginały wracają do szuflady.)"],
            leaveSay: ["> (Listy wracają do szuflady. Wiesz, co w nich jest - to na razie musi wystarczyć.)"],
            done: "> (Szuflada pusta. Listy są u mnie.)",
            doneCopy: "> (Listy leżą, jak leżały. Odpis mam w torbie.)"
        },
        caughtGab: ["Ty?! Tutaj?! ...", "Wynoś się. Drzwiami, nie kanałem. I módl się, żebym to ja pierwszy nie poszedł z tym do jaśnie pana."],
        caughtGabPopup: "Feliks cię przyłapał w gabinecie",
        caughtGabSub: "Wyprowadzony przed dwór - klapa zaryglowana na dwie noce",
        noteListy: ["Listy Feliksa", "W gabinecie dworu, w zamkniętym kantorku Feliksa (kluczyk w kałamarzu) leżą listy pisane jego ręką „Do sztabu Straży Pewności” - lak z białym okiem:\n- woda z gałęzi zakonu idzie przez kantor Baltazara na prom; ogród dworu pije z kanału, Lord myśli, że ze studni,\n- Feliks wyjmuje z holu kamienie z krukiem i wstawia zwykłe (trzy przy drzwiach gabinetu),\n- donosi o mnie: „wnuk Stacha pyta o twierdzę”.\nLord nic nie wie - „pan wierzy w bajki”."],
        noteFlee: ["Feliks uciekł", "Feliks zauważył, że listy zniknęły z kantorka. Uciekł promem na ląd, zanim Lord się dowiedział."],
        // ---- the truth (chapter 4 end / later)
        prawdaAsk: ["> Panie. Muszę panu coś pokazać. To listy - z kantorka Feliksa, w gabinecie."],
        prawdaOpt: "Pokaż Lordowi listy Feliksa.", prawdaLater: "Jeszcze nie.",
        prawdaLaterSay: ["Listy? Od Feliksa? ...Jak chcesz. Wiesz, gdzie mnie szukać."],
        powiedzOpt: "Powiedz Lordowi o listach w kantorku Feliksa.",
        powiedzSay: ["> Panie. W gabinecie, w kantorku Feliksa, leżą listy. Do tych z białym okiem. Pisane jego ręką.",
            "(Lord długo milczy.) To poważne oskarżenie, młodzieńcze. Feliks służy temu domowi od trzydziestu lat.",
            "...Sprawdzę sam. W nocy, kiedy wszyscy śpią. Przyjdź jutro."],
        powiedzWait: ["Przyjdź jutro, mówiłem. Dziś jeszcze nie wiem, co myśleć."],
        sprawdzil: ["Sprawdziłem. Kantorek, kałamarz, kluczyk. Wszystko tak, jak mówiłeś."],
        copyCheck: ["To nie jego pismo - to twoje. Przepisałeś...", "Wiem, gdzie Feliks trzyma kluczyk. (Lord woła przez ramię.) Bartosz! Gabinet, kantorek, szuflada. Przynieś, co tam leży.",
            "(Po chwili strażnik wraca z plikiem listów przewiązanym czarnym sznurkiem. Lord łamie lak z okiem.)"],
        prawda: [
            "To jego ręka. Trzydzieści lat znam tę rękę. Pisała mi rachunki, zaproszenia, życzenia na imieniny...",
            "„Pan nie liczy kamieni - pan liczy gości.” ...Ma rację. Liczyłem gości. Ilu przyszło, kto przyniósł miód, kto się ukłonił niżej.",
            "A on w tym czasie wyjmował mi ze ścian kruki i sprzedawał wodę z mojego ogrodu tym... z białym okiem. Tym, co palą wsie na lądzie.",
            "Płacę Koronie podatek wojenny, żeby chorągiew w zatoce broniła nas przed nimi. A oni siedzieli mi w kuchni. Przy moim stole.",
            "(Lord siada na stopniu przed drzwiami dworu. Nagle wygląda na starego człowieka.)",
            "Mój ojciec mawiał: przyjdź najpierw do mnie. Myślałem, że chodzi o skarby. Chodziło o ludzi. Kto pierwszy przychodzi z prawdą, ten jest swój."
        ],
        fate: {
            arrest: "(Lord wstaje.) Straż! Feliksa do wieży. Niech czeka na sołtysa i rotmistrza - niech oni go sądzą, nie ja. Ja bym... nie umiał.",
            fled: "Uciekł, mówisz? Promem? ...Niech płynie do swoich. Kruków ze ścian już mi nie wyjmie.",
            jailed: "Siedzi już w wieży - za wodę. Teraz posiedzi za resztę.",
            sent: "Odprawiłem go za wodę - po cichu, z sakiewką na drogę. Z sakiewką! Niech go teraz szukają ci z okiem.",
            gone: "Feliksa już tu nie ma. A jego listy zostały - jak kamienie, które ukradł."
        },
        reward: {
            debt: "Dług twojego dziadka... Zapiszę sam: dwieście pięćdziesiąt mniej. Nie, nie dziękuj. To ja dziękuję.",
            buyback: "Działkę Stacha odsprzedam ci za dwa tysiące. Tysiąc mniej. Tyle są warte te listy - i to, że przyszedłeś z nimi do mnie.",
            other: "Weź to - sto groszy. I zapamiętaj: drzwi tego domu są dla ciebie otwarte zawsze."
        },
        prawdaPays: "„Wnuk Stacha wie o zasuwie. Płacę mu...” (Lord podnosi wzrok.) Brałeś od niego pieniądze. ...A jednak przyszedłeś z tym do mnie. To liczę bardziej.",
        // (2026-10-17) W1 6 c - the hush money: Feliks arrested or gone over the sea - no more pay, no men on the road; W1's choice again
        w1Broke: ["Feliks już nie płaci", "{fate} - dwudziestu groszy na tydzień już nie będzie, a jego ludzie nie mają po co czekać na Polnej drodze. Rysunek śluzy wciąż mam: mogę go pokazać sołtysowi albo Lordowi."],
        w1BrokeFate: { arrest: "Feliks siedzi w wieży", fled: "Feliks uciekł promem" },
        prawdaKoniec: "Dziękuję. Nie wiem jeszcze za co bardziej - za listy, czy za to, że przyszedłeś z nimi do mnie, a nie na rynek.",
        prawdaGaraz: "Listy pójdą do rotmistrza w zatoce. Niech Korona wie, kogo tu karmiła.",
        prawdaGalaz: "I jeszcze ten kanał w cysternie... Zamknąłeś mi wodę, a teraz przynosisz prawdę. Nie wiem, czy ci dziękować, czy cię przeklinać.",
        noteTruth: ["Prawda dla Lorda", "Pokazałem Lordowi listy Feliksa. Lord się złamał: „Liczyłem gości, a on liczył kamienie.” {fate}\nOd dziś Lord jest po mojej stronie - „kto pierwszy przychodzi z prawdą, ten jest swój”."],
        fateNote: { arrest: "Feliks siedzi w wieży - sądzić go będą sołtys i rotmistrz.", fled: "Feliks uciekł promem, zanim Lord się dowiedział.",
            jailed: "Feliks już siedział w wieży za wodę (W1).", sent: "Feliksa Lord już wcześniej odprawił za wodę (W1).", gone: "Feliksa już nie ma w dworze." },
        // ---- chapter 6: who first (Act II)
        najpierwAsk: {
            normal: ["Słyszałem od Borgara... a raczej od jego beczek: krata w piwnicy tawerny stoi otworem. A ty schodzisz w dół.",
                "Mówiłem ci - przyjdź najpierw do mnie. No więc? Co tam jest, pod Kruczymi Skałami?"],
            ally: ["Po tym, co zrobiłeś z Feliksem, ufam ci bardziej niż własnej straży.", "Krata w piwnicy tawerny stoi otworem. Powiesz mi, co tam jest, pod Kruczymi Skałami?"],
            cold: ["Po tamtym targu nie liczę na twoją szczerość. Ale pytam: krata w piwnicy stoi otworem. Co tam jest, pod Kruczymi Skałami?"]
        },
        optLord: "Powiem panu wszystko - co piętro, co znajdę.",
        optLie: "Nic tam nie ma, panie. Kurz i szczury.",
        optSilent: "Tego nie powiem nikomu. Także panu.",
        sayLord: ["Wiedziałem, że ród Stacha ma honor. Sto groszy na tydzień - za każde słowo. I weź coś ze zbrojowni: pochodnie, liny, opatrunki, strzały.",
            "Moi ludzie pójdą za tobą. Nie przeszkadzać - pilnować, żebyś wrócił. I żeby nikt inny nie był pierwszy."],
        sayLie: ["Kurz i szczury... Dobrze. Wierzę ci. Na razie."],
        saySilent: ["Milczysz? ...Szanuję milczenie. Ale pamiętam je."],
        saySilentFeliks: "(Za plecami Lorda, w drzwiach dworu, stoi Feliks. Słyszał każde słowo.)",
        tydzien: ["Twoje sto groszy. Co nowego pod tawerną?", "> Schodzę głębiej, panie. Ostrożnie."],
        tydzienNie: ["Sto groszy? Mój ogród usycha przez twoje grzebanie w rurach zakonu. Nie tym razem."],
        lieOut: ["Lord wie, że skłamałeś", "Kurz i szczury - powiedziałem Lordowi. Ludzie w tawernie gadają, że zszedłem do dziesiątej bramy i dalej. Lord wie. Dwór jest teraz wrogi: wyższe myto u bramy wschodniej, a straż dworu zapowiedziała przeszukanie mojej chaty."],
        lieOutPopup: "Lord wie, że skłamałeś",
        lieOutSub: "Wrogość dworu: wyższe myto, przeszukanie chaty",
        lordHostile: ["Kurz i szczury, mówiłeś. Moi ludzie słyszą w tawernie co innego.", "Kłamca nie wejdzie do mojego domu. Płać, co winien - i idź."],
        toll: "Myto dworu! Dla ciebie - z rozkazu jaśnie pana - pięć groszy.",
        search: ["Przeszukanie", "Straż dworu przewróciła mi chatę do góry nogami. {what} „Z rozkazu jaśnie pana - za kłamstwo.”"],
        searchTook: "Zabrali kamienie z krukiem ({n}).",
        searchNone: "Nic nie znaleźli - wszystko leży na podłodze.",
        donosi: ["Daleko pan dziś schodził, młodzieńcze?", "Piwnica tawerny... wilgotna, prawda?", "Jaśnie pan pytał o pana. Powiedziałem, że nic nie wiem."],
        noteDonosi: ["Feliks patrzy", "Odmówiłem Lordowi, a Feliks to słyszał. Teraz widzę go wszędzie - przy studni, pod tawerną, na drodze. Ktoś na lądzie wie o każdym moim zejściu."],
        // ---- the W9 rival: the Lord's men beaten underground (the coordinator's small effect)
        w9Lord: "Moi ludzie wrócili z ruin posiniaczeni. Bartosz kuleje. ...Nie pytam, kto zaczął. Pamiętam, kto skończył.",
        w9Guard: "Bartosz jeszcze kuleje. Przechodź szybko, chłopcze.",
        // ---- chapter 7: the Heart
        serce: {
            ally: "Lord jest po twojej stronie - zejdzie za tobą aż do Serca, z jednym pytaniem: o syna, Kazimierza.",
            rival: "Lord jest ci wrogi - jego ludzie pójdą twoimi śladami, a on sam stanie przy Sercu przeciw tobie. Też z pytaniem o syna.",
            absent: "Lord nie wie, że schodzisz w głąb - przy Sercu go nie będzie. Nigdy nie zada swojego pytania o syna."
        },
        noteSerce: ["Lord przy Sercu", "Lord Zaleski przy Sercu Twierdzy: {how}"],
        serceHow: { allow: "pozwoliłem mu zadać jedno pytanie - o syna, Kazimierza.", refuse: "nie pozwoliłem mu zapytać.", askFor: "zapytałem za niego.", none: "nie przyszedł." },
        // ---- the epilogue (Underground's floor 100: one line)
        epilog: {
            truth: "W holu dworu brakuje trzech kruków. Lord nie kazał ich zamurować - „niech każdy gość pyta, gdzie są”.",
            lie: "Dwór Zaleskich zamyka bramę przed wnukiem Stacha. Myto przy bramie wschodniej wciąż kosztuje go pięć groszy.",
            fled: "Gdzieś na lądzie Feliks pisze listy do sztabu, którego już nikt nie czyta.",
            silent: "Lord do dziś nie wie, kto mu wyjmował kruki ze ścian. Liczy gości."
        },
        // ---- F9
        f9: "W7: rozdział {n} - {name}   ←→ zmień, OK idź",
        f9desc: "Ustawia „Dwór z kamieni twierdzy” na początku rozdziału {n} (spłaty, flagi, pora) i przenosi tam, gdzie się dzieje.",
        f9names: { 1: "dług", 2: "zaproszenie", 3: "dwa życia Feliksa", 4: "gabinet nocą", 5: "prawda i ostatnia spłata", 6: "do kogo najpierw", 7: "Lord przy Sercu" }
    };

    // ------------------------------------------------------------------ the quest W7 (TownQuests)
    const W7 = {
        id: "W7", kind: "W", title: "Dwór z kamieni twierdzy", giver: null, icon: 0,
        where: "drzwi dworu, hol, biblioteka, gabinet, ogród dworu nocą, rynek", when: "od dnia 1 (dług) do Aktu III",
        desc: "Lord Zaleski zna tylko bajkę o kamieniach twierdzy. Jego kamerdyner Feliks rano robi zakupy, a nocą prowadzi interesy. Z kim?",
        autoStart: "w7Auto",
        steps: [
            { ch: 1, type: "custom", check: "w7Dlug", vars: "w7Vars", text: "Dług dziadka u Lorda Zaleskiego: {dlug}" },
            { ch: 2, type: "custom", talk: "w7Zapro", check: "w7Kronika", vars: "w7Vars", text: "Zaproszenie: {zapro}" },
            { ch: 3, type: "custom", talk: "w7Slady", check: "w7Feliks", vars: "w7Vars", text: "{feliks}" },
            { ch: 4, type: "custom", vars: "w7Vars", text: "Gabinet nocą: {gabinet}" },
            { ch: 4, type: "custom", talk: "w7Prawda", check: "w7PoPrawdzie", vars: "w7Vars", text: "{prawda}" },
            { ch: 5, type: "custom", talk: "w7Prawda", check: "w7Splata", vars: "w7Vars", text: "Ostatnia spłata: {splata}" },
            { ch: 6, type: "custom", talk: "w7Najpierw", check: "w7Wybor", vars: "w7Vars", text: "Do kogo najpierw: {najpierw}" },
            { ch: 7, type: "custom", talk: "w7Tydzien", check: "w7Serce", vars: "w7Vars", text: "Lord przy Sercu: {serce}" }
        ],
        reward: { xp: 300 }
    };
    const VITEMS = {
        listy_feliksa: { name: "Listy Feliksa (do sztabu)", icon: 191 },
        odpis_listow: { name: "Odpis listów Feliksa", icon: 189 }
    };
    const REMARKS = [
        { id: "w7Hanka", who: "piekarka", flag: "w7FeliksZatrzymany", lines: ["Feliksa zabrali do wieży! Kamerdynera! Mówią, że listy pisał... do tych z okiem. A ja mu sprzedawałam papier."] },
        { id: "w7Soltys", who: "soltys", flag: "w7FeliksZatrzymany", lines: ["Jaśnie pan przysłał mi Feliksa w łańcuchach. Do sądu. Trzydzieści lat rachunków dworu - teraz wiem, czemu zawsze się zgadzały."] },
        { id: "w7Kuba", who: "woziwoda", flag: "w7Prawda", lines: ["Feliksa już nie ma, co? ...Dobrze. Pytał za dużo. Ja tylko woziłem beczki."] },
        { id: "w7Ucieczka", who: "kapral", flag: "w7FeliksUciekl", lines: ["Kamerdyner dworu odpłynął porannym promem. Z jednym kuferkiem. Pierwszy raz widziałem, żeby Feliks się śpieszył."] },
        { id: "w7Teodor", who: "kamerdyner", flag: "w7Prawda", lines: ["Jaśnie pan od wczoraj czyta rachunki. Wszystkie. Strona po stronie. Trzydzieści lat nie czytał."] },
        { id: "w7Straz", who: "straznik", flag: "w7FeliksZatrzymany", lines: ["Feliksa zabrali do wieży. Kamerdyner - kto by pomyślał. Jaśnie pan od tamtej nocy sam obchodzi hol i liczy kruki."] },
        { id: "w7StrazW9", who: "straznik", flag: "w9DworPobity", lines: ["(Strażnik nie patrzy ci w oczy.) Bartosz jeszcze kuleje po waszym spotkaniu w ruinach. Przechodź. Szybko."] },
        { id: "w7StrazKlamstwo", who: "straznik", flag: "w7KlamstwoWyszlo", lines: ["Kurz i szczury, co? Jaśnie pan kazał cię nie wpuszczać. Rozkaz to rozkaz."] }
    ];
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Dwor", quests: [W7], vitems: VITEMS, remarks: REMARKS });

    // ------------------------------------------------------------------ TownLife: Feliks's day (and Teodor's once Feliks is gone)
    // 6-10:30 the market (as before from 7: K30, K31, K37 and the tests keep their hours), 10:30-20 the manor's hall ("inside dwor" =
    // through the east gate; indoors on the hall's marker feliks_hol / kamerdyner_hol), the night at the manor (no interior shows it)
    const TLD = window.TownLifeData;
    if (TLD) {
        if (TLD.SPOTS && !TLD.SPOTS.dwor) TLD.SPOTS.dwor = (TLD.SPOTS.brama_wsch || [100, 51, 4]).slice();
        for (const key of ["feliks", "kamerdyner"]) {
            const r = (TLD.RESIDENTS || []).find(x => x.key === key);
            if (!r || r._w7) continue;
            r._w7 = true;
            const out = [];
            for (const p of r.plan) {
                if (p[0] === 7 && p[1] === "wander") out.push([6, p[1], p[2]].concat(p.slice(3)));
                else if (p[0] === 10.5 && p[1] === "inside") out.push([10.5, "inside", "dwor"]);
                else out.push(p);
            }
            if (!out.some(p => p[0] === 20)) out.push([20, "inside", "brama_wsch"]);
            out.sort((a, b) => a[0] - b[0]);
            r.plan = out;
            r.indoor = Object.assign({}, r.indoor || {}, { dwor: key + "_hol" });
            r.barks = Object.assign({}, r.barks, { home: key === "feliks"
                ? ["Jaśnie pan przyjmuje od ósmej... ach, pan już w środku.", "Proszę niczego nie dotykać, młodzieńcze. Kamienie pamiętają.", "(Feliks coś zapisuje w księdze gości.)"]
                : ["Rachunki dworu są otwarte - jaśnie pan teraz sam je czyta.", "(Teodor ściera kurz z pulpitu.)"] });
        }
    }

    // (2026-10-17) the manor's guard spoke of Feliks as if he were still there, Teodor of a sluice already opened: with Feliks gone (W1 a/b
    // or W7's truth) the guard's lines leave him out; Teodor speaks of the sluice only once W1 has opened it (TownLife reads these at the
    // moment of the talk / call - getters)
    const gone = () => { try { return !!(window.TownLife && TownLife.gone && TownLife.gone("feliks")); } catch (e) { return false; } };
    const qflag = k => { try { const Q = window.TownQuests, s = Q && Q.state ? Q.state() : null; return !!(s && s.flags && s.flags[k]); } catch (e) { return false; } };
    const swap = (obj, key, alt) => {
        if (!obj || !Array.isArray(obj[key])) return;
        const orig = obj[key];
        Object.defineProperty(obj, key, { configurable: true, enumerable: true, get() { const a = alt(); return a || orig; } });
    };
    if (TLD) {
        const g = (TLD.RESIDENTS || []).find(x => x.key === "straznik"), t = (TLD.RESIDENTS || []).find(x => x.key === "kamerdyner");
        if (g && !g._w7words) {
            g._w7words = true;
            swap(g.talk, "morning", () => (gone() ? ["Straż dworu. Pilnuję, żeby nikt obcy nie deptał jaśnie panu kwiatów.",
                qflag("sluiceHalf") ? "Ogród podlewamy teraz wiadrami. Jak wszyscy w mieście." : "Ogród dalej zielony, choć Feliksa już nie ma. Pod oranżerią szumi woda, jak szumiała."] : null));
            swap(g.talk, "night", () => (gone() ? ["Nocą do ogrodu nie wolno. Rozkaz jaśnie pana."] : null));
            swap(g.barks, "night", () => (gone() ? ["Zimno... do świtu jeszcze daleko.", "Odkąd Feliksa nie ma, nocą w ogrodzie cicho jak w grobie."] : null));
        }
        if (t && !t._w7words) {
            t._w7words = true;
            swap(t.talk, "day", () => (qflag("sluiceHalf") ? null : ["Pod oranżerią szumi woda. Feliks nie zostawił klucza... ani wyjaśnień. Jaśnie pan teraz sam czyta rachunki, strona po stronie."]));
        }
    }

    window.DworData = {
        MAP, IDS, OWNER: "Dwor", EV, ART, PLACES, TIME, OBS, PAY, GEAR, KAZIMIERZ, TX, W7, VITEMS, REMARKS,
        // the steps' names (Dwor.js: which step is on): the chapters 1, 2, 3, 4, 4 (the truth), 5, 6, 7
        STEPS: ["w7Dlug", "w7Zapro", "w7Feliks", "w7Gabinet", "w7Prawda", "w7Splata", "w7Najpierw", "w7Serce"]
    };
})();
