//=============================================================================
// Pustelnia_Data.js
//=============================================================================
// PAKIET A (docs/miejsca_wyspy/PAKIETY.md) - the data of "Pustelnia na klifie" (Map155) and its "Skryptorium" (Map156): brother
// Kleofas, the last chronicler of the Order, the six ciphered cards of the chronicle, one question a year (concept approved by the
// user 2026-10-16: docs/miejsca_wyspy/KONCEPCJA.md section 3). Only data and texts - the engine is Pustelnia.js.
//   - window.TownLifeExtra: the resident "pustelnik" (fixed id 944) living on Map155, in the scriptorium (Map156) by his plan
//   - window.TownQuestsPacks: K50 "Atrament dla pustelnika", D23 "Zaszyfrowane kroniki", the things carried (the six cards, the
//     bell's heart), remarks of the town about the hermit (W2 rozdz. 7 "Jedno pytanie" is a step of W2 itself, TownQuests_Data.js)
//   - window.PustelniaData: the cards (where they lie, what they say, the journal's chapters of "Kronika upadku"), the questions of
//     the Night of the Question and Kleofas's own talk (the first meeting, honey, the chronicles' gossip, the bell)
// Stands under Wyspa_Data and above TownLife / TownQuests_Data (its fixed place in js/plugins.js - package 0).
// DROUGHT (the user's rule): nothing here gives the hero water - K50 TAKES a portion of his own rain water; the cistern is empty.

/*:
 * @target MZ
 * @plugindesc [pakiet A] Dane: pustelnia na klifie i skryptorium (mapy 155, 156), brat Kleofas, karty kroniki, K50, D23. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa_Data
 *
 * @help
 * Pakiet A - dane miejsca (silnik: Pustelnia.js).
 * Mieszkaniec: brat Kleofas (pustelnik, numer 944) na mapach 155/156.
 * Zadania: K50 „Atrament dla pustelnika”, D23 „Zaszyfrowane kroniki”
 * (W2 rozdz. 7 „Jedno pytanie” jest w bloku W2 w TownQuests_Data.js).
 * Numery zdarzeń 600-609. Test: tests/pustelnia_test.js (port 9501).
 */

(() => {
    "use strict";

    const MAP = 155, INNER = 156;
    const ITEM = { honey: 76, cones: 147, iron: 86, pendant: 172 };
    const P = () => window.Pustelnia || null;
    // TownLife's conditions (the engine answers them: the rain, the Night of the Question)
    const rain = () => !!(P() && P().rain());
    const dry = () => !rain();
    const night = () => !!(P() && P().nightNow());

    // ------------------------------------------------------------------ the resident: brother Kleofas
    // Plan (KONCEPCJA 3): 4-5 he gets up, 5-7 on the cliff's edge facing the sea, 7-12 copying in the scriptorium, 12-13 bread with
    // honey on the bench, 13-16 the garden and the hives, 16-19 the scriptorium, 19-20 the sunset from the bench, 20-4 asleep in his
    // shut cell. In the rain all day in the scriptorium. On the Night of the Question (the Wigilia) at the bell tower round midnight.
    // He never goes down to the town. "cela_drzwi" is away (asleep in the cell: shown in no interior).
    const RESIDENT = {
        key: "pustelnik", id: 944, name: "Brat Kleofas", title: "pustelnik, kronikarz zakonu", sheet: "$Npc_Pustelnik", map: MAP, speed: 2,
        away: ["cela_drzwi"],
        plan: [[0, "inside", "cela_drzwi"], [0, "stand", "wieza", night],
               [5, "stand", "urwisko", dry], [5, "inside", "skryptorium_drzwi", rain],
               [7, "inside", "skryptorium_drzwi"],
               [12, "stand", "lawka", dry],
               [13, "work", "ogrodek", dry],
               [14.5, "work", "ule", dry],
               [16, "inside", "skryptorium_drzwi"],
               [19, "stand", "lawka", dry],
               [20, "inside", "cela_drzwi"],
               [22.5, "stand", "wieza", night]],
        barks: {
            stand: ["(Kleofas mruczy psalm pod nosem. Fałszuje.)", "Morze jak krew... W kronikach trzy razy przez trzysta lat. A teraz co roku.",
                "Chleb z miodem. Lepszy niż połowa ksiąg, które przepisałem."],
            work: ["Szałwio, ty uparta. Rośnij.", "Pszczoły wiedzą, kiedy przyjdzie deszcz. Ja nie.", "Nie machaj rękami przy ulach, chłopcze. One pamiętają."],
            rain: ["Deszcz! Dzbany pod rynnę, prędko!"],
            night: ["Siedem uderzeń. Siedem. Pamiętaj."],
            home: ["(Skrzypi pióro.)", "...i roku tego morze zakwitło krwią...", "Nie oddychaj na karty. I nie dotykaj, bo masz tłuste palce."]
        },
        talk: {
            morning: ["Godzinki odmówione, morze na miejscu. Można pisać.", "Wstaję o czwartej. Mój mistrz wstawał o trzeciej. Dlatego umarł przede mną."],
            day: ["Przepisuję kroniki, bo papier gnije, a pamięć jeszcze szybciej.", "Do miasta nie schodzę. Zrobili z nas piosenkę. Ja wolę ciszę.",
                "Miód mam swój. Wosk też. Świece z wosku nie kopcą na karty."],
            evening: ["Słońce schodzi do morza. Kronikarze zapisywali każdy zachód, który był czerwony. Brakło im atramentu.",
                "Wieczorem czyta się najgorzej, a myśli najlepiej."],
            night: ["Po nocy chodzą tylko złodzieje i głupcy. Którym jesteś?"],
            rain: ["Deszcz! Cicho bądź i słuchaj, jak bębni. Najpiękniejsza muzyka na tej skale."]
        }
    };
    (window.TownLifeExtra = window.TownLifeExtra || []).push(RESIDENT);
    // default spots (the map's "Miejsce:" events win - tools/pustelnia/build.py puts them there)
    const TLD = window.TownLifeData;
    if (TLD && TLD.SPOTS_BY_MAP) {
        TLD.SPOTS_BY_MAP[MAP] = Object.assign({ skryptorium_drzwi: [14, 10, 8], cela_drzwi: [23, 8, 8], urwisko: [7, 7, 4], lawka: [9, 6, 4],
            ogrodek: [16, 11, 2], ule: [26, 8, 6], wieza: [20, 10, 8] }, TLD.SPOTS_BY_MAP[MAP] || {});
        TLD.SPOTS_BY_MAP[INNER] = Object.assign({ pustelnik_wnetrze: [5, 5, 6] }, TLD.SPOTS_BY_MAP[INNER] || {});
    }

    // ------------------------------------------------------------------ the six cards of the chronicle (D23)
    // n: the card's number = the chapter of "Kronika upadku"; flag: the TownQuests flag of "the card found" (WyspaData.FLAGS - A sets
    // 1-3, the packages E, C, B set 4-6); where: the journal's hint; read: what Kleofas reads at the lectern ("> ..." the hero);
    // note: the journal's chapter
    const CARDS = [
        { n: 1, flag: "kronikaKarta1", title: "Zasada jednego pytania", where: "kroniki z Archiwum zakonu (pod ogrodem rycerzy)",
            read: ["(Kleofas obraca tarczę szyfru, przykłada ją do nacięć na twoim wisiorku i czyta powoli, palcem po linijce.)",
                "„Serce odpowiada każdemu i na wszystko. Dlatego my pytamy raz.”",
                "„Strażnik dzwonu ma prawo zadać jedno pytanie na rok. Nowicjusz jedno na całe życie. Kronikarz zapisuje pytanie i odpowiedź. Kto pyta drugi raz w roku, przestaje być bratem.”",
                "> Czemu tylko jedno?",
                "Bo prawda to nie woda, chłopcze. Nie pije się jej do syta. Jedna szklanka na rok - i człowiek zostaje człowiekiem."],
            note: "Serce Twierdzy odpowiada każdemu i na wszystko. Zakon pytał raz: strażnik dzwonu jedno pytanie na rok, nowicjusz jedno na całe życie. Kronikarz zapisywał pytania i odpowiedzi. Kto zapytał drugi raz w roku, przestawał być bratem." },
        { n: 2, flag: "kronikaKarta2", title: "Cztery straże i kruczarze", where: "Księga pytań na dwudziestym piętrze podziemi (ostatnia nie wyrwana karta)",
            read: ["„Po każdym pytaniu straże rozchodzą się do swoich zadań: dzwon woła, pieśń pamięta, klucz zamyka, pióro zapisuje.”",
                "„A kruczarze z Urwiska niosą wieść tam, gdzie dzwon nie sięga. Ich znakiem jest kamień z krukiem na szyi.”",
                "Dzwon to Ambroży i jego ród. Pióro to ja. Klucz i pieśń... nie wiem, gdzie się podziały. Ktoś musiał zamykać. Ktoś musiał pamiętać, kiedy wszyscy zapomną.",
                "(Kleofas patrzy na twoją szyję.) A kamień z krukiem nosił posłaniec. Mówiłem ci: to nie ozdoba."],
            note: "Zakon miał cztery straże: dzwon (woła), pieśń (pamięta), klucz (zamyka) i pióro (zapisuje). Piąci byli kruczarze z Urwiska - posłańcy z kamieniem z krukiem na szyi. Dzwon to ród Ambrożego, pióro - Kleofas. Klucz i pieśń? Taki kamień noszę ja." },
        { n: 3, flag: "kronikaKarta3", title: "Trzy pytania Dobiesza", where: "Rejestr straży w chacie Najstarszego (Osada Milczących)",
            read: ["„Roku sto szóstego brat Dobiesz zapytał trzy razy w jednym roku: czy twierdza przetrwa, czy żona go kocha, czy przyjaciel go zdradzi.”",
                "„Po trzecim pytaniu przestał gasić świece i zamykać drzwi. Wyrwał z Księgi pytań karty z odpowiedziami i nocą uciekł łodzią na ląd.”",
                "„Wrócił po latach, stary i bez kart. Zszedł na dół z ostatnimi.”",
                "Dlatego Księga pytań ma wyrwane strony, chłopcze. Ktoś za morzem trzymał je przez trzysta lat. Oby tylko trzymał."],
            note: "Roku sto szóstego brat Dobiesz zapytał Serce trzy razy w jednym roku: czy twierdza przetrwa, czy żona go kocha, czy przyjaciel go zdradzi. Potem wyrwał z Księgi pytań karty z odpowiedziami i uciekł na ląd. Wrócił po latach bez kart i zszedł na dół z ostatnimi." },
        { n: 4, flag: "kronikaKarta4", title: "Upadek i zapieczętowanie", where: "kajuta wraku na mieliźnie",
            read: ["„Kiedy Dobiesz odpłynął, wardy gasły jedna po drugiej. Bracia schodzili na dół i nie wracali.”",
                "„Ostatni przeor zamknął drogę trzema zamkami: kluczem, dzwonem i pieśnią. Na górze rozgłosiliśmy, że to przeklęta ruina, żeby nikt nie kopał.”",
                "(Na marginesie ktoś dopisał obcym, ostrym pismem.) „Wyspa. Pod twierdzą. Szukać kamieni z krukiem.”",
                "To nie nasza ręka. Ta karta wróciła zza morza... z tymi, co wyrwane strony przeczytali."],
            note: "Po ucieczce Dobiesza wardy gasły, bracia schodzili na dół i nie wracali. Ostatni przeor zamknął drogę trzema zamkami - kluczem, dzwonem i pieśnią - a na górze rozgłoszono, że to przeklęta ruina. Na marginesie karty z wraku ktoś obcy dopisał: „Wyspa. Pod twierdzą. Szukać kamieni z krukiem.”" },
        { n: 5, flag: "kronikaKarta5", title: "Imiona kruczarzy", where: "Księga mgieł w latarni na przylądku",
            read: ["„Kruczarze z Urwiska, pokolenie po pokoleniu: Jarosz. Mszczuj. Wit Kamień. Bogdan. Stanisław z Urwiska, i syn jego Józef, ostatni, co trzymał kruki.”",
                "(Kleofas podnosi wzrok.) Stanisław z Urwiska. Twój dziadek to Stach, prawda? Stanisław.",
                "W rodach kruczarzy imiona wracały co trzecie pokolenie. Twój pradziad nosił listy zakonu. A dziad twojego dziadka trzymał kruki na Urwisku."],
            note: "Imiona kruczarzy z Urwiska, pokolenie po pokoleniu. Na końcu: „Stanisław z Urwiska i syn jego Józef, ostatni, co trzymał kruki”. Stanisław to imię mojego pradziada. Dziadek Stach nosi je po nim." },
        { n: 6, flag: "kronikaKarta6", title: "Cysterna i racje wody", where: "zwitek w obrączce kruka z Urwiska",
            read: ["„Cysterna pod wzgórzem pije deszcz z rynien na Urwisku. Pół dla twierdzy, ćwierć dla miasta, ćwierć dla tych, co przyjdą.”",
                "„Zasuwę główną otwiera sygnał wody: cztery i dwa. Kto bierze więcej niż swoją rację, ten pije z cudzego dzbana.”",
                "Ćwierć dla tych, co przyjdą... Ciekawe, czy ktoś jeszcze o tej ćwierci pamięta."],
            note: "Cysterna zakonu pod wzgórzem pije deszcz z rynien na Urwisku: pół dla twierdzy, ćwierć dla miasta, ćwierć dla tych, co przyjdą. Zasuwę główną otwiera sygnał wody - cztery i dwa. „Kto bierze więcej niż swoją rację, ten pije z cudzego dzbana.”" }
    ];

    // ------------------------------------------------------------------ the Night of the Question: what may be asked (W2 rozdz. 7, then a
    // question every Wigilia). need: "trust" - D23 done (Kleofas trusts the hero); "card:N" - card N read. keep: Kleofas will not take
    // it as the year's question (the answer is not in the chronicles). The answers come from the game's state (Pustelnia.answer).
    const QUESTIONS = [
        { id: "dziadek", label: "Co ukrywa mój dziadek?" },
        { id: "zdrajca", label: "Kto zdradzi miasteczko?" },
        { id: "lord", label: "Czy Lord wiedział o wodzie?" },
        { id: "serce", label: "Czym naprawdę jest Serce?", need: "trust" },
        { id: "dobiesz", label: "Co Dobiesz wywiózł za morze?", need: "card:3" },
        { id: "matka", label: "Czy moja matka żyje?", keep: true }
    ];

    // ------------------------------------------------------------------ Kleofas's own talk
    const TX = {
        meetTorch: ["Stój. Z ogniem nie podchodź do ksiąg. Zgaś to albo zostań tam, gdzie stoisz."],
        meet: ["...Czego tu szukasz? Do miasta jest w drugą stronę.",
            "> Szedłem wzdłuż klifu. Nie wiedziałem, że ktoś tu mieszka.",
            "Mało kto wie. I dobrze. (Kleofas patrzy na twoją szyję.) Pokaż to.",
            "> Wisiorek? Matka dała mi go na drogę. Był jej ojca, dziadka Stacha.",
            "Stacha... Hm. To by się zgadzało. To nie ozdoba, chłopcze. To znak posłańca. Kruki nie biorą się znikąd.",
            "Jestem Kleofas. Przepisuję tu rzeczy, których nikt już nie czyta. Jak przyniesiesz atrament, może ci coś przeczytam."],
        meetNote: ["Pustelnik na klifie", "Nad przystanią, na klifie, mieszka brat Kleofas - ostatni kronikarz zakonu. Przepisuje kroniki w kamiennym skryptorium. Na mój wisiorek powiedział: „To nie ozdoba. To znak posłańca.”"],
        ask: ["Hm?", "Mów. Krótko.", "Słucham, chłopcze. Tylko nie stój w świetle."],
        honeyAsk: ["Miód z moich uli. Dwanaście groszy słoik. Dla posłańca nie ma zniżek. Posłańcy płacą jak wszyscy."],
        honeyBuy: ["Masz. Nie jedz od razu. Miód lubi czekać."],
        honeyNone: ["Nie ma już. Pszczoły też mają swoje prawa."],
        pendant: ["Nacięcia na krawędzi. Siedem, trzy, pięć i dwa. Przyłożysz je do mojej tarczy - i szyfr się otwiera.",
            "Kruczarze nosili takie kamienie. Każdy ród miał swoje nacięcia. Twój to klucz do kronik. Nie sprzedawaj go. Nigdy."],
        chronicles: [
            "Kroniki piszą, że w roku wielkiej suszy bracia mierzyli wodę w cysternie łokciem. I że nikt nie pił więcej niż łokieć na miesiąc.",
            "Kroniki piszą, że kasztelan Bogumił z rodu Kowali nosił klucz na łańcuchu i nigdy go nie zdejmował. Nawet w łaźni.",
            "Kroniki piszą, że kruki z Urwiska przylatywały do skryptorium co rano. Kronikarz zostawiał im okruchy na parapecie. Ja też zostawiam.",
            "Kroniki piszą, że morze czerwieniało w suszę trzy razy w trzysta lat. Teraz czerwienieje co roku. Nikt już tego nie zapisuje. Poza mną.",
            "Kroniki piszą, że ostatni przeor zszedł na dół ze świecą i nie wrócił. Świeca podobno pali się do dziś. Bzdura. Ale ładna."],
        readWhere: ["Nie tutaj. Szyfr czyta się przy pulpicie, w skryptorium, przy dobrym świetle. Chodź za dnia."],
        readNoCard: ["Nie masz żadnej karty. Przynieś, to przeczytamy."],
        readNoInk: ["Bez atramentu nie przepiszę ani litery. Najpierw atrament."],
        readNoQuest: ["Najpierw porozmawiajmy, chłopcze. Potem karty."],
        readLate: ["Za ciemno. Oczy mam stare. Przyjdź jutro, między siódmą a dziewiętnastą."],
        readGo: ["Siadaj. Tarcza, wisiorek, świeca. I milcz, póki nie skończę."],
        readDone: ["Zapisane. Karta wraca do skrzyni, a ty do swoich spraw."],
        noKleofas: "Bez brata Kleofasa nie odczytasz szyfru.",
        noPendant: "Potrzebujesz wisiorka z krukiem",
        bellMute: "Dzwon w wieży. Bez serca - niemy od upadku zakonu.",
        bellHung: "Dzwon w wieży. Ma znowu serce. Kleofas nie pozwala dzwonić bez potrzeby.",
        dial: "Mosiężna tarcza szyfru na okutej skrzyni. Dwa kręgi liter, a na krawędzi nacięcia - takie same jak na twoim wisiorku.",
        dialNoPendant: "Mosiężna tarcza szyfru. Dwa kręgi liter i nacięcia na krawędzi. Bez klucza to tylko krąg liter.",
        hives: "Trzy ule brata Kleofasa. Pszczoły brzęczą leniwie - kwiatów mało, susza.",
        hivesDusk: "Ule. Pszczoły już śpią.",
        edge: "Ścieżka urywa się nad przepaścią. Dalej, na wschód, nie przejdziesz.",
        night: {
            early: ["Jeszcze nie. Czekaj na dzwon. O północy."],
            ask: ["Siedem. Słyszałeś? Pierwszy raz od upadku zakonu.", "Pytaj. Jedno pytanie. Zastanów się dobrze, bo drugiego nie będzie do przyszłej Wigilii."],
            askAgain: ["Siedem uderzeń. Rok minął. Pytaj, chłopcze. Jedno."],
            later: ["Jeszcze nie wiesz? Do pierwszej poczekam. Potem idę spać, a pytanie przepada do przyszłego roku."],
            done: ["Zapisałem. Pytanie i odpowiedź, jak każe reguła. Następne za rok."],
            used: ["Swoje pytanie w tym roku już zadałeś. Reguła to reguła."],
            keep: ["Tego nie ma w kronikach, chłopcze. Kroniki nie piszą o żywych. Zapytaj o co innego - tego pytania nie liczę."]
        },
        // the Baltazar route of card 1 (W2 rozdz. 6: the chronicles sold - until W5 is built, he sells the loose ciphered card back)
        balt: ["Ach, przyjaciel od starych ksiąg! Kroniki już płyną na kontynent... ale wypadła z nich jedna karta. Szyfr, bazgroły. Nikt jej nie chce.",
            "Dla ciebie - czterdzieści groszy. Sentyment, rozumiesz."],
        baltYes: ["Interes to interes. Bazgroły twoje."],
        baltNo: ["Karta poczeka. Ja też."],
        ambrozyCard: ["Karta? Luźna, pisana szyfrem? Była w kronikach, wypadła mi przy dzwonie. (Ambroży wyciąga ją zza pazuchy.)",
            "Nie umiem tego czytać. Ty też nie. Ale jak brat pióra żyje... niech czyta."]
    };

    // ------------------------------------------------------------------ the quests (TownQuests packs - docs/QUESTY_STAN.md "Jak dopisać")
    const K50 = {
        id: "K50", kind: "K", title: "Atrament dla pustelnika", giver: "pustelnik", icon: 147, where: "pustelnia na klifie (nad przystanią)", when: "za dnia, od dnia 6",
        desc: "Bratu Kleofasowi wysechł atrament. Nowy zrobi z garbnika z szyszek, rdzy z żelaza i wody - deszczówki, której sam nie ma.",
        offer: {
            cond: { hours: [5, 20], day: 6, flags: ["pustelnikMet"] },
            say: ["Atrament mi wysechł. Ostatni kałamarz rozcieńczałem, aż pisałem samą wodą. Kronika z wody to żadna kronika.",
                "Na nowy trzeba garbnika z szyszek, rdzy z żelaza i wody. Wody, chłopcze - deszczówki. Moja cysterna pusta od lat.",
                "Przyniesiesz? Cztery szyszki, kawałek żelaza i porcję deszczówki."],
            yes: "Przyniosę.", no: "Nie teraz.",
            accept: ["Szyszki z sosen, nie z ziemi - te z ziemi zgniły. Żelazo może być stare. Rdza i tak jest najlepsza."],
            decline: ["To będę pisał kredą. Po murach."]
        },
        steps: [
            { type: "bring", to: "pustelnik", need: [[147, 4], [86, 1]], water: 1, hours: [5, 20],
                text: "Przynieś bratu Kleofasowi 4× Szyszki, 1× Żelazo i 1 porcję własnej deszczówki (pustelnia na klifie, za dnia).",
                remind: ["Szyszki, żelazo, deszczówka. Nie zapomniałem, to i ty nie zapominaj."],
                hero: ["> Masz. Szyszki, żelazo i woda z mojego zapasu."],
                done: ["(Kleofas tłucze szyszki w moździerzu, wrzuca żelazo do garnka z wodą i stawia przy piecu.)",
                    "Garbnik i rdza. Trzy dni i będzie czarny jak sumienie poborcy. Dziękuję.",
                    "Masz, za fatygę. I przyjdź, jak znajdziesz coś do czytania. Teraz mam czym pisać - to i czym czytać."] }
        ],
        reward: { gold: 15, xp: 40, items: [[76, 2]], flag: "kleofasCzyta",
            note: ["Atrament dla pustelnika", "Przyniosłem bratu Kleofasowi szyszki, żelazo i własną deszczówkę na atrament. Teraz może czytać ze mną zaszyfrowane karty kroniki."] }
    };
    const D23 = {
        id: "D23", kind: "D", title: "Zaszyfrowane kroniki", giver: "pustelnik", icon: 189, where: "skryptorium na klifie + karty po całej wyspie", when: "Akt I-II, karta po karcie",
        desc: "Kroniki zakonu pisano szyfrem. Kluczem są tarcza Kleofasa i nacięcia na twoim wisiorku. Sześć kart przetrwało upadek - rozwiało je po wyspie.",
        offer: {
            cond: { hours: [7, 19], done: ["K50"] },
            say: ["Słuchaj. Kroniki zakonu pisano szyfrem. Klucz miał kronikarz - i posłańcy. Twój wisiorek ma nacięcia na krawędzi. To klucz do mojej tarczy.",
                "Mój mistrz pisał, że sześć kart przetrwało upadek. Rozwiało je po wyspie. Przynieś mi każdą, jaką znajdziesz, a przeczytamy je razem. Przy pulpicie, za dnia."],
            yes: "Poszukam kart.", no: "Może później.",
            accept: ["Pierwsza powinna leżeć w kronikach pod ogrodem rycerzy, jeśli ktoś je jeszcze ma. Druga w Księdze pytań, głęboko pod ziemią, na dwudziestym piętrze. Trzecia u Milczących, w ich rejestrze.",
                "O reszcie mój mistrz napisał tylko trzy słowa: morze, mgła i kruk. Rób z tym, co chcesz."],
            decline: ["Karty poczekają. Leżały trzysta lat."]
        },
        steps: [
            { type: "custom", talk: "d23Karty", check: "d23Karty", vars: "d23Karty",
                text: "Znajdź karty kroniki i odczytaj je z bratem Kleofasem przy pulpicie w skryptorium (7–19, potrzebny wisiorek). Odczytane: {n}/6.{wtorbie}{gdzie}" }
        ],
        reward: { gold: 120, flag: "kleofasUfa",
            note: ["Kronika upadku", "Odczytaliśmy z bratem Kleofasem wszystkie sześć kart kroniki. Kleofas mi ufa: w Noc Pytania mogę zapytać o wszystko, co zapisano."] }
    };
    const VITEMS = {
        karta_1: { name: "Zaszyfrowana karta kroniki (z Archiwum)", icon: 189 },
        karta_2: { name: "Zaszyfrowana karta kroniki (z Księgi pytań)", icon: 189 },
        karta_3: { name: "Zaszyfrowana karta kroniki (z Rejestru straży)", icon: 189 },
        karta_4: { name: "Zaszyfrowana karta kroniki (z wraku)", icon: 189 },
        karta_5: { name: "Zaszyfrowana karta kroniki (z Księgi mgieł)", icon: 189 },
        karta_6: { name: "Zaszyfrowana karta kroniki (zwitek z obrączki)", icon: 189 },
        serce_dzwonu: { name: "Serce dzwonu (od Ambrożego)", icon: 342 }
    };
    const REMARKS = [
        { id: "pustAmbrozy", who: "dzwonnik", flag: "pustelnikMet", lines: ["Byłeś na klifie? U brata pióra? ...Mój mistrz mówił, że tam siedzi ostatni kronikarz. Myślałem, że to bajka dla uczniów."] },
        { id: "pustSoltys", who: "soltys", flag: "pustelnikMet", lines: ["Pustelnik nad przystanią? Wiem, wiem. Podatku nie płaci, bo nie ma z czego. Do miasta nie schodzi, to i kłopotu nie robi."] },
        { id: "pustKupiec", who: "kupiec", flag: "kleofasCzyta", lines: ["Słyszałem, że chodzisz do starego mnicha na klifie. Gdyby miał jakieś księgi na sprzedaż... wiesz, gdzie mnie szukać, przyjacielu."] }
    ];
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({
        owner: "Pustelnia", quests: [K50, D23], vitems: VITEMS, remarks: REMARKS,
        gossip: { pustelnik: ["Chleb? Z miasta? ...Dziękuję. Kroniki piszą, że piekarze z miasta zawsze dodawali do mąki popiół. Ten nie ma popiołu. Postęp."] }
    });

    window.PustelniaData = { MAP, INNER, ITEM, IDS: [600, 609], HONEY_PRICE: 12, CARD_BUYBACK: 40, READ_HOURS: [7, 19], READ_TIME: 2,
        NIGHT: { from: 22.5, until: 1.5, bell: 0 }, RESIDENT, CARDS, QUESTIONS, TX, K50, D23, VITEMS, REMARKS };
})();
