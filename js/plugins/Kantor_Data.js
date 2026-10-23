//=============================================================================
// Kantor_Data.js
//=============================================================================
// The data of the arc W5 "Towary z kontynentu" (docs/QUESTY.md W5): Baltazar Vey's smuggling for the Black Eyes (Straż Pewności),
// the three knocks at the kantor's back door after midnight, the smugglers' camp on the forest edge (Map023), the night porter in
// the kantor's cellar (the new Map171 "Piwnica kantoru"), the register on Baltazar's desk, who gets it (Wit / the reeve / the double
// game / blackmail), the ferry night on Polna droga (Map022) with the ambush, and the kantor's fate in Act II. Kantor.js is the
// engine. Registered in js/plugins.js under the island packages' data (Cysterna_Data), above TownLife and TownQuests:
//   - window.TownQuestsPacks: the quest W5 (ten steps, chapters 1-7), its things (the register, the copy, the crate...), the remarks
//   - TownLifeData: Baltazar's plan gets the night shift (he is in the cellar, not behind the counter - Kantor.js's own event), his
//     move to the harbour in Act II when the town shut his kantor (alt: Map125, by the port's storehouse), the spots
//   - window.KantorData: the maps, the event ids (730-759, the core's registry: owner "Kantor"), the places, the visitors of the
//     night, the cargo, the shop's prices, the register's lines, the words

/*:
 * @target MZ
 * @plugindesc [W5] Dane wątku „Towary z kontynentu”: Baltazar Vey, tylne drzwi kantoru, piwnica (mapa 171), obóz przemytników, noc promu. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Cysterna_Data
 *
 * @help
 * ============================================================================
 * Kantor_Data.js - dane wątku W5 „Towary z kontynentu”
 * ============================================================================
 * Same dane: czyta je Kantor.js (silnik). Zadanie W5 trafia do TownQuests
 * przez window.TownQuestsPacks, plan nocy Baltazara do TownLife. Musi stać
 * nad TownLife.js i TownQuests_Data.js (pod Cysterna_Data).
 * Numery zdarzeń 730-759 (właściciel "Kantor"), nowa mapa 171 „Piwnica
 * kantoru” (pod Kantorem, Map103).
 * ============================================================================
 */

(() => {
    "use strict";

    const MAP = { town: 8, kantor: 103, piwnica: 171, droga: 22, skraj: 23, przystan: 125, ratusz: 104 };
    const IDS = [730, 759];
    // the injected events, by map: Map103 the trapdoor, the stack by the back door, the town's honest counter (Act II); Map008 the
    // visitors of the night (the courier, a guest); Map171 Baltazar, Sławek, the pile, the night's things, the desk, the strongbox,
    // the crate to sit on; Map023 the camp's cart, crates, the courier; Map022 the ferry night's cart, Rafał
    const EV = {
        klapa: 730, stos: 731, lada: 732,
        kurier: 733, gosc: 734,
        baltazar: 740, slawek: 741, sterta: 742, worki: 743, kamienie: 744, mapy: 745, biurko: 746, szkatula: 747, siedzisko: 748,
        wozOboz: 750, skrzynieOboz: 751, kurierOboz: 752, ogien: 753,
        wozProm: 754, rafal: 755, skrzynieProm: 756, straz1: 757, ogienProm: 759     // (757, 758: the cart's two men in the double game)
    };
    // the art: !W5_Kantor (tools/w5/art.py) - [sheet, index, direction, pattern]
    const ART = {
        woz: ["!W5_Kantor", 0, 2, 0], wozPusty: ["!W5_Kantor", 0, 2, 1], wozWorki: ["!W5_Kantor", 0, 2, 2],
        stos1: ["!W5_Kantor", 0, 4, 0], stos2: ["!W5_Kantor", 0, 4, 1], stos3: ["!W5_Kantor", 0, 4, 2],
        kamienie: ["!W5_Kantor", 0, 6, 0], worki: ["!W5_Kantor", 0, 6, 1], mapy: ["!W5_Kantor", 0, 6, 2],
        sterta: ["!W5_Kantor", 0, 8, 0], skrzynia: ["!W5_Kantor", 0, 8, 1],
        szkatula: ["!Fantasy_chest", 6, 4, 0],
        kurier: ["$Npc_Kurier", 0, 2, 1], baltazar: ["$Npc_Kupiec", 0, 2, 1], slawek: ["$Human_Bandit", 0, 2, 1], rafal: ["$Npc_Rafal", 0, 2, 1],
        feliks: ["$Npc_Feliks", 0, 2, 1], grum: ["$Npc_Grum", 0, 2, 1]
    };

    // ------------------------------------------------------------------ the places (map coordinates; the user's maps are not changed)
    const PLACES = {
        // Map103 (the kantor - the user's map): the trapdoor tile he drew in the back room, the stack by the back door, the counter
        klapa: [5, 9], klapaLand: [5, 10, 2], stos: [6, 10], lada: [12, 6], kantorBackLand: [3, 10, 8],
        // Map171 (the cellar - tools/w5/build_piwnica.py): the stairs' landing, Baltazar's place behind the desk, the door of the office
        piwnicaLand: [2, 4, 2], schody: [2, 4], baltazar: [16, 4, 2], biurko: [15, 6], szkatula: [17, 8], sterta: [8, 9], worki: [5, 9],
        kamienie: [3, 8], slawek: [9, 7, 8], siedzisko: [3, 6], gabinetDoor: [12, 8], gabinet: [12, 4, 17, 10],   // (x0, y0, x1, y1 - with its door)
        // Map008 (the town): the back door (event 94 of the user's map), the cell before it, where the visitors come from and go
        backDoor: [14, 47], backFront: [14, 48, 8], frontDoor: [18, 46], gateIn: [52, 104], gateOut: [52, 105], east: [101, 50], tavern: [51, 18],
        // Map023 (Skraj lasu): the smugglers' fire, its seats, the cart, the courier
        ognisko: [33, 4], seats: [[32, 4, "sit"], [34, 4, "sit"], [33, 2, "sleep"], [32, 3, "sit"]], wozOboz: [35, 2], skrzynieOboz: [37, 3], kurierOboz: [35, 4, 4],
        listen: 3.4,                                                  // tiles from the fire the talk is heard from
        // Map022 (Polna droga): the cart at the fork to the east, its guards, Rafał tied to it
        wozProm: [29, 20], guards: [[28, 21, "idle"], [32, 19, "idle"]], rafal: [31, 21, 2], skrzynieProm: [27, 19], ogienProm: [32, 21]
    };

    // ------------------------------------------------------------------ the clock
    const TIME = {
        knock: 0.18,          // the courier's knock (after midnight - Ambroży rings three and one)
        spawn: 23.9,          // the courier comes in through the south gate
        inside: 0.25,         // ...is let in, and out again at knock + inside
        leaveBy: 1.2,         // he is gone off the map by then
        camp: [21, 4.5],      // the camp burns (Map023)
        shift: [21.9, 23.5],  // a porter's shift: he comes in through the back door then (later: no work tonight)
        shiftEnd: 2.5,        // Baltazar's men leave the cellar
        out: 0.5, away: 20 / 60,   // night 3: Baltazar goes up at half past midnight, for twenty minutes
        copy: 0.25,           // copying the register takes a quarter of an hour
        ferry: [21, 3],       // the ferry night's cart on Polna droga
        meeting: [12, 16],    // the town meeting in the town hall, the day after the reeve got the register
        work: [8, 18]         // Baltazar's day trade
    };
    const PAY = { shift: 20, double: 30, blackmail: 50, letGo: 30 };
    const CRATES = 3;         // crates a night
    const SHIFTS = 2;         // the porter's nights before the register's night (chapter 3)
    const STONES = { swap: 6, gain: 5 };   // plain stones (item 64) to swap the cargo; raven stones found in it
    const RAID = { after: [3, 6], kinds: ["bandit", "knifer", "archer"], maps: [3, 21, 22, 23], hours: [21, 4] };
    // the shop of chapter 7: base prices (the honest kantor 10% lower; Baltazar in the hero's grip - half; Baltazar the enemy - double)
    const GOODS = [{ id: 86, n: 1, price: 18 }, { id: 143, n: 1, price: 50 }, { id: 88, n: 10, price: 2 }, { id: 93, n: 1, price: 6 }];
    const PRICE = { honest: 0.9, grip: 0.5, enemy: 2, normal: 1 };

    // ------------------------------------------------------------------ the words
    const TX = {
        // the trapdoor / the doors
        klapaZamknieta: "Klapa zamknięta na kłódkę.",
        klapaZejdz: "Zejść do piwnicy?",
        tylneZamkniete: "Tylne drzwi zamknięte na zasuwę.",
        tylneSpoznienie: "Za późno. Nikt już nie otwiera.",
        kantorZamkniety: "Kantor zamknięty z rozkazu sołtysa.",
        stukanie: "(Trzy stuknięcia w tylne drzwi kantoru.)",
        drzwiOtwarte: "Kto? ...Wchodź. Szybko.",
        // the courier and the guests
        kurierBarks: ["...", "Zimno jak u mnie w domu.", "Trzy razy. Nie dwa, nie cztery."],
        kurierSploszony: "Ktoś tu jest... Nie dziś.",
        kurierWychodzi: "Wóz o świcie. Kamienie pod słomą.",
        felixBark: "Szybko, szybko... Lord śpi, a ja tu stoję.",
        grumBark: "Mój żołd. Z lądu. I nic więcej nie mów.",
        noteKnock: ["Trzy stuknięcia", "Po północy ktoś w kapturze zapukał trzy razy w tylne drzwi kantoru, a Baltazar go wpuścił. Ambroży zadzwonił z dzwonnicy trzy i jeden - „obcy w murach”. Gość wyszedł bramą południową."],
        noteFeliks: ["Feliks u Baltazara", "O północy Feliks, kamerdyner Lorda, zapukał do tylnych drzwi kantoru. Wyszedł z sakiewką."],
        noteGrum: ["Grum u Baltazara", "Nocą Grum Żelazna Pięść zapukał do tylnych drzwi kantoru. „Mój żołd. Z lądu.” Ktoś z kontynentu płaci mu przez Baltazara."],
        noteKlos: ["Kłos przy kantorze", "Po promie, nocą, kwatermistrz Kłos z garnizonu stuka trzy razy w tylne drzwi kantoru. Królewskie zboże wychodzi tylnymi drzwiami."],
        // the camp
        obozRozmowa: [
            ["kurier", "Sztab chce więcej kamieni. Każdy z krukiem. Płacą w srebrze."],
            ["a", "Kupiec mówi, że miejscowi znoszą je jak gruz. Za grosze."],
            ["b", "A zboże? Rekwizycja dworu idzie przez nas. Garnizon sprzedaje swoje nocą."],
            ["kurier", "Zboże to nic. Liczą się drzwi pod skałą. Kupiec ma to zapisać - wszystko, każdy grosz, każde imię."],
            ["a", "Zapisuje. W tej swojej księdze. Ciągle zapisuje."],
            ["kurier", "Następny prom - wielki ładunek. Ktoś ma pilnować wozu."]
        ],
        obozHeard: ["> (Księga. Baltazar wszystko zapisuje.)", "> (Kamienie z krukiem, zboże z rekwizycji, „drzwi pod skałą”... dla jakiegoś sztabu.)"],
        noteObozHeard: ["Obóz przemytników", "Na Skraju lasu, przy ognisku, siedzą ludzie Baltazara z kurierem w kapturze. Sztab z lądu chce kamieni z krukiem, zboże z rekwizycji idzie przez nich, a „liczą się drzwi pod skałą”. Baltazar wszystko zapisuje w swojej księdze. Na następny prom szykują wielki ładunek."],
        noteObozFight: ["Obóz przemytników", "Na Skraju lasu ludzie Baltazara siedzieli przy ognisku z kurierem w kapturze. Zobaczyli mnie - była bijatyka. W ich worku list przewozowy z pieczęcią kantoru: „kamienie z krukiem - do sztabu, zboże - na prom”."],
        obozPobity: ["> (Ludzie z obozu mnie pobili. Ogień zgaszony, ich nie ma. Wrócą następnej nocy.)"],
        // the night porter (chapter 3) - Baltazar's day talk (TownQuests step)
        najemTrust: ["Przyjacielu. Ty umiesz nie zadawać pytań - to rzadki towar.", "Potrzebuję silnych rąk nocą. Skrzynie z piwnicy pod tylne drzwi. Dwadzieścia groszy za noc.",
            "Od dziesiątej, tylnymi drzwiami. Nie spóźniaj się - po wpół do dwunastej nikt ci nie otworzy."],
        najemCold: ["(Baltazar długo ci się przygląda.) Moi ludzie mówią, że ktoś kręcił się nocą przy Skraju lasu. Ktoś ciekawski.",
            "Ciekawskich wolę mieć blisko. Będziesz nosił skrzynie. Dwadzieścia groszy za noc - i patrzę ci na ręce.",
            "Od dziesiątej, tylnymi drzwiami. Po wpół do dwunastej nikt ci nie otworzy."],
        najemFight: ["(Baltazar uśmiecha się samymi ustami.) Moich ludzi ktoś pobił przy Skraju lasu. Nie wiem kto. A ty wiesz?",
            "Nieważne. Kto umie się bić, ten udźwignie skrzynię. Dwadzieścia groszy za noc. Od dziesiątej, tylne drzwi."],
        najemYes: "Przyjdę.", najemNo: "Nie dziś.",
        najemOk: ["Dobrze. Tylne drzwi, dziesiąta. Puk, puk, puk."], najemLater: ["Oferta nie ucieka. Ja też nie."],
        noteNajem: ["Nocny tragarz", "Baltazar najął mnie do nocnej roboty: od dziesiątej wieczorem, tylnymi drzwiami kantoru, skrzynie z piwnicy pod tylne drzwi. Dwadzieścia groszy za noc."],
        // the cellar
        baltazarStart: ["Jesteś. Trzy skrzynie z kupki pod schody, na górę, pod tylne drzwi. Ostrożnie - kruche.", "Sławek pilnuje. Ja liczę."],
        baltazarWork: ["Jeszcze {left}. Nie mam całej nocy."],
        baltazarPay: ["Wszystko? Dobrze. Dwadzieścia groszy. Do jutra, przyjacielu."],
        baltazarDone: ["Na dziś koniec. Idź spać - i nie śnij za głośno."],
        baltazarLate: ["Spóźniłeś się. Dziś nie ma roboty."],
        baltazarNight3: ["Dziś nic nie nosisz. Czekamy na wóz - o wpół do pierwszej idę na górę go przyjąć.", "Posiedź tu. Pilnuj skrzyń razem ze Sławkiem."],
        czekaj: "Poczekam (do wpół do pierwszej).", nieCzekaj: "Rozejrzę się.",
        baltazarIdzie: "Idę na górę. Dwadzieścia minut. Niczego nie dotykaj.",
        baltazarWraca: "Wóz przyjęty. Wszystko w porządku?",
        baltazarAfter: ["Wóz pojechał. Masz swoje dwadzieścia groszy. Idź spać."],
        caught: ["(Baltazar staje w drzwiach gabinetu.) Szukasz czegoś w moim biurku, przyjacielu?", "Wynocha. Dziś nie płacę. Jutro... zobaczymy, czy jeszcze cię lubię."],
        caughtAgain: ["Znowu? Jeszcze raz cię tu zobaczę, to popłyniesz do zatoki z kamieniami u nóg. Wynocha."],
        slawekAlarm: "Hej! Szefie! Grzebie ci w papierach!",
        slawekHej: "Hej. Dokąd? Szef kazał siedzieć przy skrzyniach.",
        slawekBarks: ["(Sławek ziewa.)", "Te beczki to nie wino, wiesz?", "Nie gap się tak. Noś."],
        slawekTalk: ["Noś, nie gadaj. Szef nie lubi gadania."],
        sterta: "Skrzynia z kupki. Ciężka.",
        stertaPusta: "Na dziś wszystko wyniesione.",
        stertaNiesiesz: "Już niesiesz jedną.",
        stosPolozona: "Skrzynia pod tylnymi drzwiami ({n}/{max}).",
        stosNic: "Pod drzwiami czekają skrzynie na wóz.",
        widzi: [
            ["> (W skrzyni, pod słomą, worki zboża. Na workach pieczęć dworu: „Zboże na wojnę”. Rekwizycja.)"],
            ["> (Skrzynia lżejsza. W środku kamienie. Na każdym wyryty kruk - jak na moim wisiorku.)"],
            ["> (Dziś nic nie nosimy. Na stole w gabinecie leżą zwoje map wyspy.)"]
        ],
        noteWidzi: [
            ["Co nosi kantor (noc 1)", "Pierwszej nocy w piwnicy kantoru: worki zboża z pieczęcią dworu - „Zboże na wojnę”. Rekwizycja idzie nie na wojnę, tylko tylnymi drzwiami do Baltazara."],
            ["Co nosi kantor (noc 2)", "Drugiej nocy w skrzyniach kamienie z wyrytym krukiem. „Pamiątki”, które Baltazar skupuje od ludzi, płyną nocą na ląd."],
            ["Co nosi kantor (noc 3)", "Trzeciej nocy na stole w gabinecie zwoje map wyspy. Ktoś na lądzie rysuje Kruczą Wyspę kamień po kamieniu."]
        ],
        worki: "Worki zboża. Pieczęć dworu: „Zboże na wojnę”.",
        kamienie: "Kamienie z krukiem. Kilkadziesiąt. „Pamiątki”.",
        mapy: "Zwoje map wyspy. Kredą zaznaczone kamienie z krukiem i Krucze Skały.",
        biurkoZamkniete: "Baltazar siedzi przy biurku.",
        biurkoNic: "Rejestru już tu nie ma.",
        biurkoOdpis: "Rejestr leży, jak leżał. Odpis mam w torbie.",
        biurkoAsk: ["> (Na biurku leży gruba księga w skórze. Rejestr. Imiona, kwoty, daty.)"],
        biurkoTake: "Zabierz rejestr.", biurkoCopy: "Przepisz go (kwadrans).", biurkoLeave: "Zostaw.",
        biurkoTaken: ["> (Chowasz rejestr pod koszulę. Ciężki. Baltazar zauważy - jutro.)"],
        biurkoCopied: ["> (Przepisujesz rejestr węglem na luźne kartki. Kwadrans. Ręce się trzęsą.)"],
        szkatula: "Szkatuła. Zamknięta na skobel.",
        szkatulaKarta: ["> (W szkatule, między wekslami, leży luźna karta gęsto zapisana szyfrem. Karta z kronik zakonu, które sprzedałem Baltazarowi.)"],
        szkatulaNic: "W szkatule weksle i monety z okiem. Nic, co by mi się przydało.",
        siedzisko: "Usiąść na skrzyni i poczekać?",
        noteRejestr: "Rejestr Baltazara",
        rejestrWzial: "Zabrałem Baltazarowi rejestr z biurka w piwnicy kantoru.",
        rejestrOdpis: "Przepisałem rejestr Baltazara z jego biurka w piwnicy kantoru. Oryginał został na miejscu.",
        // chapter 5
        komuWit: {
            ask: ["> Kapralu. To rejestr Baltazara. Imiona, kwoty. Twoje też."],
            trust: ["(Wit czyta długo. Przy pierwszej linijce zamyka oczy.) „K.W. - pięć groszy na tydzień.” To ja. Brałem. Za to, żeby przy bramie było ciemno.",
                "Myślałem: co mi zależy, ktoś przemyca sukno. A to kamienie, zboże dzieci z obozu... i ktoś z lądu, kto szuka drzwi pod skałą.",
                "Pomogłeś mi przy wilkach, nie zapomniałem. Idziemy razem do sołtysa. Powiem, co brałem. Kantor zamkną - a ja będę stał przy tobie, kiedy przyjdą po swoje."],
            burn: ["(Wit przegląda rejestr, aż zatrzymuje się na jednej linijce. Patrzy na ciebie.)", "Nic tu nie ma. Bazgroły kupca. (Rejestr ląduje w koszu żarowym.)",
                "A ty spędzisz noc w wartowni. Za włóczenie się po nocy. Straż!"]
        },
        komuSoltys: {
            ask: ["> Panie sołtysie. To rejestr Baltazara Veya. Zboże z rekwizycji, kamienie z krukiem, łapówki - wszystko zapisane."],
            say: ["(Sołtys czyta i blednie.) Zboże dzieci z obozu... a ja liczyłem racje co do kubka.", "Jutro w południe zwołam ludzi do ratusza. Niech miasto samo zobaczy, kogo karmiło. Przyjdź - bez ciebie nikt w to nie uwierzy."]
        },
        komuBaltazar: {
            ask: ["> Baltazarze. Mam twój rejestr. Każde imię, każdy grosz."],
            say: ["(Baltazar nawet nie mruga.) Ach. Ciekawość. Mówiłem, że to piękna cecha... u kota.", "No dobrze. Czego chcesz, przyjacielu?"],
            double: "Pracujmy razem (podwójna gra).", blackmail: "Pięćdziesiąt groszy - i zapominam.", later: "Jeszcze nie wiem.",
            doubleSay: ["Rozsądnie. Pracujesz dla mnie dalej - trzydzieści groszy na tydzień, za samo milczenie.", "A ty mówisz mi, kto pyta o kantor. Wiesz, ilu ludzi chce wiedzieć to, co ty wiesz? Jesteśmy wspólnikami, przyjacielu."],
            blackmailSay: ["(Baltazar odlicza pięćdziesiąt groszy, jakby płacił za pogrzeb.) Masz. A teraz posłuchaj.", "Od dziś jesteś mi obcy. Obcym sprzedaję drożej. A noce na wyspie są długie."],
            laterSay: ["Pomyśl. Ja zaczekam. Rejestry nie uciekają."]
        },
        noteWit: ["Wit stanie przy mnie", "Dałem rejestr kapralowi Witowi. Przyznał się, że brał od Baltazara pięć groszy na tydzień za ciemność przy bramie. Poszliśmy razem do sołtysa: kantor zamknięty, a Wit stanie przy mnie, kiedy przyjdą po swoje."],
        noteWitBurn: ["Rejestr w ogniu", "Kapral Wit spalił rejestr Baltazara w koszu żarowym - sam był w nim zapisany. Noc spędziłem w wartowni. Baltazar już wie, kto mu grzebał w biurku."],
        noteSoltys: ["Zebranie w ratuszu", "Dałem rejestr Baltazara sołtysowi. Jutro w południe zebranie w ratuszu."],
        noteDouble: ["Wspólnik Baltazara", "Powiedziałem Baltazarowi, że mam jego rejestr - i że będę z nim pracował. Trzydzieści groszy na tydzień za milczenie, a on chce wiedzieć, kto pyta o kantor. Gram na dwie strony."],
        noteBlackmail: ["Szantaż", "Wziąłem od Baltazara pięćdziesiąt groszy za milczenie o rejestrze. Od dziś jestem dla niego obcy - ceny podwójne, a noce na wyspie są długie."],
        zebranie: {
            say: ["(W ratuszu tłoczno. Sołtys czyta rejestr na głos - linijka po linijce.)", "@soltys: Zboże z rekwizycji: tylnymi drzwiami do kantoru. Kamienie z krukiem: na ląd, do jakiegoś sztabu. Łapówki - straż, garnizon, dwór.",
                "(Ktoś krzyczy, ktoś płacze. Hanka trzaska drzwiami.)", "Kantor zamknięty. Od dziś, z rozkazu ratusza. Baltazar Vey ma opuścić wyspę najbliższym promem."],
            notYet: ["Zebranie jutro w południe. Przyjdź do ratusza."]
        },
        noteZebranie: ["Kantor zamknięty", "Na zebraniu w ratuszu sołtys przeczytał rejestr Baltazara. Kantor zamknięty z rozkazu ratusza, Baltazar ma odpłynąć najbliższym promem. Miasto patrzy na mnie inaczej."],
        // chapter 6
        promFirst: "Wóz z ładunkiem Baltazara czeka na Polnej drodze, przy rozwidleniu na wschód.",
        promStraz: ["Kto idzie?!", "To ten od rejestru! Brać go!", "Kupiec mówił, że przyjdzie!"],
        promZasadzka: "Zasadzka! Z krzaków!",
        promSwoj: ["Swój. Kupiec mówił, że przyjdziesz.", "Pilnuj z nami. O trzeciej ruszamy na przystań."],
        promSwojOpts: ["Puszczam wóz.", "Odwrócę wasze oczy... (podmień skrzynie)", "Nic."],
        promLetGo: ["Dobry z ciebie wspólnik. Masz trzydzieści groszy od kupca."],
        promWoz: "Wóz z ładunkiem. Skrzynie przykryte słomą.",
        promSwapAsk: "Podmienić kamienie z krukiem na zwykłe kamienie?",
        promSwapped: ["> (Wyjmujesz kamienie z krukiem i wkładasz w słomę zwykłe kamienie. Na przystani nikt nie zajrzy.)"],
        promSeized: ["> (Skrzynie pod słomą: kamienie z krukiem, dziesiątki. I zwoje map wyspy. Biorę, co uniosę.)"],
        promSwapNeed: "Potrzebujesz: Kamień ×6",
        promGone: ["Wóz pojechał", "Ładunek Baltazara odpłynął z nocnym promem."],
        noteSwapped: ["Podmienione skrzynie", "W noc promu podmieniłem ładunek na wozie Baltazara: kamienie z krukiem są u mnie, a na ląd popłynęły zwykłe kamienie."],
        noteSeized: ["Ładunek z wozu", "W noc promu pobiłem ludzi Baltazara przy wozie na Polnej drodze. Kamienie z krukiem i mapy nie popłynęły na ląd."],
        noteLetGo: ["Wóz pojechał", "W noc promu pilnowałem wozu Baltazara razem z jego ludźmi. Kamienie z krukiem popłynęły na ląd. Dostałem trzydzieści groszy."],
        noteGone: ["Wóz pojechał", "Nie było mnie przy wozie w noc promu. Ładunek Baltazara - kamienie z krukiem i mapy - popłynął na ląd."],
        noteBeaten: ["Wóz pojechał", "Ludzie Baltazara pobili mnie przy wozie na Polnej drodze. Ładunek popłynął na ląd."],
        rafalTied: "Rafał! Związany! Pomóż mi!",
        rafalFree: ["(Przecinasz sznury.) Myślałem, że już po mnie. Dwór sprzedał mnie im jak worek zboża - do kopania pod skałą.", "Wracam do Ludmiły. Nie zapomnę ci tego."],
        rafalWait: "Najpierw ci przy wozie!",
        noteRafal: ["Rafał wolny", "Na wozie Baltazara w noc promu leżał związany Rafał - dwór oddał go przemytnikom do kopania pod skałą. Uwolniłem go. Wrócił do Ludmiły."],
        noteRafalGone: ["Rafał odpłynął", "Na wozie Baltazara w noc promu był Rafał - dwór sprzedał go przemytnikom. Wóz odjechał. Rafał odpłynął na ląd, do kopaczy."],
        // chapter 7
        akt2Soltys: ["Kantor stoi pusty od zebrania. Szkoda budynku - i ludzie chcą soli, żelaza, gwoździ.", "Kto ma go prowadzić? Ludmiła z obozu, uczciwie i za małą dolę - czy ratusz?"],
        akt2Ludmila: "Ludmiła i obóz.", akt2Ratusz: "Ratusz.",
        akt2LudmilaSay: ["Ludmiła... Dobrze. Obóz ma ręce, ratusz ma papiery. Uczciwy kantor, ceny o dziesiątą część niższe."],
        akt2RatuszSay: ["Ratusz. Dobrze - skrzynka na monety i cennik na ladzie. Ceny o dziesiątą część niższe niż u Baltazara."],
        akt2Grip: ["(Baltazar wita cię jak wspólnika.) Teraz przywożę żelazo i stal. Dla ciebie - pół ceny.", "Ale wiesz, jak to jest ze wspólnikami. Ty wiesz o mnie wszystko... a ja o tobie. O każdym twoim kroku w dół, pod tawernę."],
        akt2Enemy: ["(Baltazar nie podaje ręki.) Żelazo i stal są. Dla ciebie - podwójnie. Interes to interes, nawet z wrogiem."],
        noteHonest: ["Uczciwy kantor", "Kantor znów otwarty - uczciwy. Żelazo, stal, gwoździe i lina o dziesiątą część taniej niż u Baltazara."],
        noteGrip: ["Baltazar w garści", "Baltazar sprzedaje mi żelazo i stal za pół ceny. Ale frakcja, dla której pracuje, wie o każdym moim kroku w podziemiach."],
        noteEnemy: ["Kantor wroga", "Baltazar sprzedaje mi wszystko dwa razy drożej. Wiem, że jego ludzie patrzą na mnie nocą."],
        noteBack: ["Baltazar wrócił", "Baltazar Vey wrócił na wyspę z najemnikami. Siedzi w składzie portowym na przystani. Kantoru już nie ma - jest wojna."],
        // shop / weekly pay / the honest counter
        sklepAsk: "Pokaż towar.", sklepNic: "Nic.", sklepBye: "Bywaj.",
        sklepPowitanie: { honest: ["Kantor miejski. Ceny uczciwe, monety do skrzynki."], grip: ["Wspólniku. Pół ceny, jak się umawialiśmy."], enemy: ["Czego? Ceny dla ciebie podwójne."] },
        // the honest kantor run by Ludmiła (Act II): behind the counter 9-15, the money box the rest of the open hours
        ladaLudmila: ["Kantor miejski. Uczciwa waga, uczciwa cena - o dziesiątą część taniej niż u Baltazara.", "Ela liczy gwoździe. Myli się tylko na swoją niekorzyść."],
        ladaPokaz: "Pokaż towar.", ladaOboz: "Co słychać w obozie?", ladaBywaj: "Bywaj.",
        ladaObozLine: ["W obozie? Ludzie mają pracę - noszą, ważą, liczą. Pierwszy raz od promu nikt nie żebrze pod murem."],
        ladaPusta: { ludmila: ["(Na ladzie cennik i skrzynka na monety. Ludmiła stoi tu od dziewiątej do trzeciej.)"],
            ratusz: ["(Na ladzie cennik z pieczęcią ratusza i skrzynka na monety. „Uczciwość na słowo - sołtys liczy co wieczór.”)"] },
        dzialka: ["Twoja działka, wspólniku. Trzydzieści groszy. Za milczenie."],
        lada: "Lada kantoru miejskiego",
        // the raid (the enemy path)
        napadShout: "Pozdrowienia od kupca!",
        // F9
        f9: "W5: przeskocz do rozdziału {n}",
        f9desc: "Ustawia wątek „Towary z kontynentu” na początku rozdziału {n} (flagi, pora, miejsce) i przenosi bohatera tam, gdzie się dzieje."
    };

    // ------------------------------------------------------------------ the register's lines (Kantor.js reads the flags)
    const REGISTER = [
        { line: "K.W. - 5 G na tydzień. Za ciemność przy bramie." },
        { line: "F. - dwie beczki wody na tydzień, o północy, tylna furtka dworu.", unless: "feliksGone", alt: "F. - nie przychodzi. Szukać innego przy dworze." },
        { line: "G.Ż.P. - żołd z lądu, 40 G na miesiąc. Rozkaz: drzwi pod skałą, za każdą cenę." },
        { line: "P.K. (garnizon) - 4 worki zboża z rekwizycji na każdy prom.", unless: "klosWydany", alt: "P.K. (garnizon) - wpadł. Dostawca do zastąpienia." },
        { line: "Zboże z rekwizycji dworu (D.) - przez bramę wschodnią, nocą." },
        { line: "Kamienie z krukiem - do sztabu Straży Pewności (białe oko). Płacić do 15 G za sztukę." },
        { line: "Chłopak od Stacha - 5 kamieni z wraku, 75 G.", flag: "wrakKamienieBaltazar" },
        { line: "Chłopak od Stacha - kroniki zakonu, 300 G. Na prom.", flag: "w5ChroniclesSold" },
        { line: "Chłopak od Stacha - listy z kruka. Czytać wszystkie.", flag: "krukBaltazarWie" },
        { line: "Kopacz R. - za morze, 50 G (chłopak zapłacił).", flag: "rafalSmuggled" },
        { line: "Mapa kamieni od E.S. - do sztabu.", flag: "wrakMapaSprzedana" },
        { line: "Oko z latarni - 400 G. Sztab zapłaci tysiąc.", flag: "soczewkaSprzedana" },
        { line: "Chłopak od Stacha otworzył skrzynię. Uważać.", flag: "k15Opened" },
        { line: "Turniej - 40 G dla chłopaka od Stacha, żeby przegrał.", flag: "d6Bribe" },
        { line: "Czekamy na drzwi pod skałą." }
    ];

    // ------------------------------------------------------------------ the quest W5 (TownQuests)
    const W5 = {
        id: "W5", kind: "W", title: "Towary z kontynentu", giver: null, icon: 0,
        where: "kantor, tylne drzwi kantoru nocą, Skraj lasu, Polna droga", when: "od dnia 10 do Aktu II",
        desc: "Baltazar Vey przywozi z kontynentu to, czego wyspa nie ma, a wywozi to, czego ma za dużo. Co dokładnie - i dla kogo?",
        autoStart: "w5Auto",
        steps: [
            { ch: 1, type: "custom", check: "w5Poszlaki", vars: "w5Vars",
                text: "Dziwny kupiec: co wywozi Baltazar Vey? Poszlaki ({n} z 2): skrzynia na nocnym wozie, skup zapasów po promie, zalany kosz i mokre ślady, lek z pieczęcią wojska, „trzy i jeden” z dzwonnicy, nocni goście przy kantorze." },
            { ch: 2, type: "custom", check: "w5Stuk", reward: { xp: 40 },
                text: "Trzy stuknięcia: po północy obserwuj tylne drzwi kantoru (przy tawernie, na zachód od rynku) - z ukrycia (C), żeby gość cię nie zauważył." },
            { ch: 2, type: "custom", check: "w5Oboz", reward: { xp: 80 },
                text: "Kurier w kapturze wychodzi bramą południową. Idź jego drogą przez Polną drogę na Skraj lasu: przy ognisku obóz przemytników (21–4). Podejdź po cichu (C) i posłuchaj." },
            { ch: 3, type: "custom", talk: "w5Najem", text: "Nocny tragarz: porozmawiaj z Baltazarem (przed kantorem, 8–18)." },
            { ch: 3, type: "custom", check: "w5Zmiany", vars: "w5Vars",
                text: "Nocny tragarz: przyjdź tylnymi drzwiami kantoru (22–23:30) i noś skrzynie z piwnicy pod tylne drzwi. Noce: {zmiany}/" + SHIFTS + "." },
            { ch: 4, type: "custom", check: "w5Rejestr", reward: { xp: 120 },
                text: "Rejestr: trzecia noc w kantorze (22–23:30, tylne drzwi). O wpół do pierwszej Baltazar wychodzi na dwadzieścia minut - zabierz albo przepisz rejestr z jego biurka w gabinecie. Sławek pilnuje składu." },
            { ch: 5, type: "custom", talk: "w5Komu", vars: "w5Vars",
                text: "Komu to dać? {rejestr}: kapralowi Witowi (brama wschodnia, mury), sołtysowi (ratusz, 8–18) albo samemu Baltazarowi (kantor, 8–18) - podwójna gra albo szantaż." },
            { ch: 5, type: "custom", talk: "w5Zebranie", vars: "w5Vars", text: "Zebranie w ratuszu: dzień {zebranie}, 12–16 - porozmawiaj z sołtysem." },
            { ch: 6, type: "custom", check: "w5Prom", vars: "w5Vars",
                text: "Noc promu: {prom}. Wóz z ładunkiem Baltazara stanie nocą (21–3) na Polnej drodze, przy rozwidleniu na wschód. Kamienie z krukiem płyną na ląd." },
            { ch: 7, type: "custom", talk: "w5Akt2", vars: "w5Vars", text: "Co dalej z Kantorem: {akt2}" }
        ],
        reward: { xp: 300 }
    };
    const VITEMS = {
        rejestr: { name: "Rejestr Baltazara", icon: 189 },
        odpis_rejestru: { name: "Odpis rejestru Baltazara", icon: 191 },
        skrzynia_w5: { name: "Skrzynia z piwnicy kantoru", icon: 0 },
        list_przewozowy: { name: "List przewozowy z pieczęcią kantoru", icon: 191 }
    };
    // the raven stones of the cargo: the same thing as the wreck's (Wrak_Data's v:kamien_kruk) - ours only when no pack has it yet
    if (!(window.TownQuestsPacks || []).some(p => p && p.vitems && p.vitems.kamien_kruk)) VITEMS.kamien_kruk = { name: "Kamień z krukiem", icon: 319 };
    const REMARKS = [
        { id: "w5Roch", who: "przemytnik", flag: "w5Kamienie", lines: ["Mówiłem, że ktoś na wyspie skupuje kamienie z krukiem. Teraz już wiesz kto. Kupiec z kantoru.", "Uważaj. Kto handluje kamieniami, ten handluje i ludźmi."] },
        { id: "w5WitAlly", who: "kapral", flag: "w5WitAlly", lines: ["Pięć groszy na tydzień. Tyle byłem wart. (Wit poprawia tabard.) Teraz już nic nie biorę. I nikogo nie wpuszczam po ciemku."] },
        { id: "w5Hanka", who: "piekarka", flag: "w5Zamkniety", lines: ["Słyszałeś? Zboże z rekwizycji szło nocą do kantoru! A ja ważyłam mąkę na gramy... Dobrze, że ktoś to wyciągnął."] },
        { id: "w5Ludmila", who: "ludmila", flag: "w5KantorLudmila", lines: ["Kantor... ja? (Ludmiła się śmieje, pierwszy raz od dawna.) Obóz będzie miał pracę. Dziękuję."] },
        { id: "w5Klos", who: "kwatermistrz", flag: "w5Zamkniety", lines: ["Kantor zamknięty? Ehem. To... smutne. Taki porządny kupiec. (Kłos ociera czoło.)"] },
        { id: "w5Ambrozy", who: "dzwonnik", flag: "w5Stuk", lines: ["Trzy i jeden. Słyszałeś w nocy? Tak się dzwoniło, kiedy obcy kręcili się w murach. Ktoś znowu kręci się przy kantorze."] }
    ];
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Kantor", quests: [W5], vitems: VITEMS, remarks: REMARKS });

    // ------------------------------------------------------------------ TownLife: Baltazar's night shift and his move to the harbour
    // (his plan: inside the kantor at night - at the counter of Map103; on a porter's night he is in the cellar instead, Kantor.js's
    // own event: "inside" at the place w5_piwnica, which no interior shows - `away`). In Act II, when the town shut his kantor, he
    // lives at the harbour (Map125) by the port's storehouse with a mercenary's guard (alt, condition "w5Harbour").
    const TLD = window.TownLifeData;
    const SPOTS_TOWN = { w5_piwnica: [14, 48, 8], w5_lada: [18, 47, 8] };       // (w5_lada: the kantor's front door - Ludmiła goes in)
    const SPOTS_HARBOUR = { w5_sklad: [26, 14, 8], w5_przystan: [27, 15, 2] };
    const SPOTS_KANTOR = { ludmila_lada: [12, 5, 2] };                            // Map103: behind the counter (the merchant's chair)
    const SPOTS_PODGRODZIE = { w5_lada: [89, 17, 6] };                           // Map111: the west gate's way into the town
    if (TLD) {
        if (TLD.SPOTS) for (const [k, v] of Object.entries(SPOTS_TOWN)) if (!TLD.SPOTS[k]) TLD.SPOTS[k] = v;
        TLD.SPOTS_BY_MAP = TLD.SPOTS_BY_MAP || {};
        TLD.SPOTS_BY_MAP[MAP.przystan] = Object.assign({}, TLD.SPOTS_BY_MAP[MAP.przystan] || {}, SPOTS_HARBOUR);
        TLD.SPOTS_BY_MAP[MAP.kantor] = Object.assign({}, TLD.SPOTS_BY_MAP[MAP.kantor] || {}, SPOTS_KANTOR);
        TLD.SPOTS_BY_MAP[111] = Object.assign({}, TLD.SPOTS_BY_MAP[111] || {}, SPOTS_PODGRODZIE);
        const kupiec = (TLD.RESIDENTS || []).find(r => r.key === "kupiec");
        // (2026-10-17, the user: Ludmiła behind the counter of the honest kantor by day) when the town gave the shut kantor to Ludmiła's
        // camp (Act II, condition "w5Lada" - Kantor.js), she stands at the counter 9-15 instead of the market (TownLife v1.5.0 "indoor": the
        // place w5_lada is the spot ludmila_lada of Map103); mornings and evenings at the camp as before (W6, D4, D10, K27, the Wigilia)
        const ludmila = (TLD.RESIDENTS || []).find(r => r.key === "ludmila");
        if (ludmila && !ludmila._w5) {
            ludmila._w5 = true;
            ludmila.plan.push([9.01, "inside", "w5_lada", "w5Lada"], [11.01, "inside", "w5_lada", "w5Lada"]);
            ludmila.plan.sort((a, b) => a[0] - b[0]);
            if (ludmila.alt && ludmila.alt.plan) {   // (the camp outside the wall: she comes in through the west gate in the morning)
                ludmila.alt.plan.push([9.01, "inside", "w5_lada", "w5Lada"], [12.01, "inside", "w5_lada", "w5Lada"]);
                ludmila.alt.plan.sort((a, b) => a[0] - b[0]);
            }
            ludmila.indoor = Object.assign({}, ludmila.indoor || {}, { w5_lada: "ludmila_lada" });
        }
        if (kupiec && !kupiec._w5) {
            kupiec._w5 = true;
            kupiec.plan.push([0.02, "inside", "w5_piwnica", "w5Shift"], [21.9, "inside", "w5_piwnica", "w5Shift"], [23.02, "inside", "w5_piwnica", "w5Shift"]);
            kupiec.plan.sort((a, b) => a[0] - b[0]);
            kupiec.away = (kupiec.away || []).concat(["w5_piwnica", "w5_sklad"]);
            kupiec.alt = { map: MAP.przystan, when: "w5Harbour",
                plan: [[0, "inside", "w5_sklad"], [8, "stand", "w5_przystan"], [18, "inside", "w5_sklad"]],
                barks: { stand: ["Towary z kontynentu. Dla przyjaciół. Przyjaciół mam teraz mniej.", "Najemnicy kosztują. Wszystko kosztuje."],
                    rain: ["Deszcz. Na przystani zawsze deszcz."], night: [] },
                talk: { morning: ["Wróciłem, przyjacielu. Wyspa beze mnie była nudna."], day: ["Kantor zamknęli. Przystań jest szersza."],
                    evening: ["Wieczorem nie handluję. Moi ludzie handlują za mnie."], night: [], rain: ["W deszcz nawet najemnicy śpią."] } };
        }
    }

    window.KantorData = {
        MAP, IDS, OWNER: "Kantor", EV, ART, PLACES, TIME, PAY, CRATES, SHIFTS, STONES, RAID, GOODS, PRICE, TX, REGISTER, W5, VITEMS, REMARKS,
        SPOTS_TOWN, SPOTS_HARBOUR, SPOTS_KANTOR, LADA_HOURS: [9, 15], STONE_ITEM: 64
    };
})();
