//=============================================================================
// TownQuests_Data.js
//=============================================================================
// The town's quests (docs/QUESTY.md, user 2026-10-04: "zrób to wszystko co tylko możesz"): who gives them, when, what is said, the
// steps, the rewards - and the town's opinion of the hero ("Opinia w miasteczku"), its greetings, the market day, the calendar and
// the bell signals. TownQuests.js reads it; it stands right above it in the plugin list. Only data here (and texts) - the logic is
// in TownQuests.js; a quest that needs something special names a handler there (talk / tick / check / fx).
//
// A QUEST
//   id, kind ("K" short, "D" long, "W" arc), title, giver (a TownLife resident key, "lord" / "grandpa" = Story's people, null = it
//   starts by itself), icon (an item id: the journal's icon), where, when (journal texts), desc (what it is about)
//   offer:  { cond, say: [lines], yes, no, accept: [lines], decline: [lines], options: [...] (instead of yes / no), gives, vgives }
//           an option: { label, then: "accept" | "decline" | "refuse" (never again) | "close" (done at once), step, say, reward,
//           need (taken), cost (gold paid), flag, fx }; offer.pay: gold the giver pays at once; gives / vgives: handed over
//   lines:  { ... } the texts of a quest's own handler (TownQuests.js FX); react: K17's reactions
//   steps:  [ step, ... ] - one at a time; the journal shows the current one's `text`
//   reward: { gold, xp, opinion, items: [[id, n]], note: [title, text], clue, flag, opinionFirst (only the first time) }
//   fail:   { opinion, text } - a deadline missed
//   repeat: "daily" - can be taken again the next day
// A STEP
//   type:   bring (give `need` to `to`), talk (talk to `to`), spot (the quest's place on a map: SPOTS), wait (time passes), kill,
//           custom (a handler in TownQuests.js), pause (the arc waits for the author: "ciąg dalszy wkrótce")
//   when:   hours [a, b] (b < a: over midnight), dayRel n (n days after the step began), dayIs (that day), after [step, days] (that
//           many days after step `step` was done), clear (no rain), deadline { day (from the step's day) | abs, hour, late:
//           "fail" | "next" }
//   needs:  need [[itemId | "v:key", n]] (taken), needAny [[[...]], ...] (the first one the hero has), tools [[id, n]] (shown, kept),
//           water n (portions of the hero's own rain water, given away), showWater n (shown, kept), gold n (paid)
//   lines:  say (the speaker's), hero (the hero's, before), done (after), remind (not ready), early (not the time)
//   then:   gives [[id, n]], vgives { key: n }, reward, choice { ask: [lines], options: [{ label, say, reward, flag, fx }] }
// LINES: a string is said by the one spoken to; "> text" by the hero; "@key: text" by another resident (or "@lord", "@grandpa").
//   {gold}, {n}, {left}... are filled from the quest's numbers.
//
// DROUGHT (the user's rule): no quest, choice or resident gives the hero water - quests only ever TAKE the hero's own rain water.

/*:
 * @target MZ
 * @plugindesc Dane questów miasteczka: zadania, rozmowy, nagrody, Opinia w miasteczku, dzień targowy, kalendarz, sygnały dzwonu (dla TownQuests.js). v1.0.0
 * @author Claude
 * @help Same dane - działa z TownQuests.js (ma stać nad nim na liście wtyczek).
 */

(() => {
    "use strict";

    // ------------------------------------------------------------------
    // "Opinia w miasteczku" 0-100 (separate from "Sława w tawernie" of the quest board)
    // ------------------------------------------------------------------
    const OPINION = {
        start: 10,
        tiers: [
            { at: 0, name: "Obcy", text: "Obcy chłopak w łachmanach. Ludzie odpowiadają półsłówkami." },
            { at: 20, name: "Bywalec", text: "Znają twoją twarz. Kapral Wit da ci nocną wartę, Ambroży pozwoli ci zadzwonić za siebie." },
            { at: 40, name: "Sąsiad", text: "Mówią ci „dzień dobry”. Ambroży szuka ucznia - może to ty." },
            { at: 60, name: "Zaufany", text: "Ludzie witają cię jak swojego i pytają o zdanie." },
            { at: 80, name: "Jeden z nas", text: "Miasto stanie po twojej stronie, kiedy przyjdzie co do czego." }
        ]
    };

    // the first talk of the day: a greeting by the opinion's tier (0..4), then the resident's usual line
    const GREET = {
        any: [["Hm?", "Czego?", "Słucham."], ["A, to ty.", "Dzień dobry.", "Znowu ty? Dobrze."], ["Dzień dobry, sąsiedzie!", "O, sąsiad.", "Dobrze cię widzieć."],
            ["O, nasz chłopak! Mów, co trzeba.", "Tobie zawsze chętnie."], ["Nasz! Siadaj, mów, co słychać.", "Dla ciebie wszystko, wiesz o tym."]],
        kowal: [["Hm. Bosy. Czego?"], ["A, wnuk Stacha."], ["Sąsiad! Tylko nie siadaj na gorącym kowadle."], ["O, mój pomocnik!"], ["Ha! Nasz chłop! Dawaj grabę."]],
        piekarka: [["Tak?"], ["A, to ty, kochaneczku."], ["Sąsiad! Pachnie chlebkiem, prawda?"], ["Mój złoty chłopak!"], ["Synku! Chodź, niech cię uściskam."]],
        woziwoda: [["Czego? Wody nie ma."], ["A, to ty."], ["O, sąsiad."], ["Ty jesteś w porządku, wiesz?"], ["Przyjacielu!"]],
        kapral: [["Stać. Kto idzie?"], ["Znam cię. Spocznij."], ["Sąsiad. W porządku."], ["Dobrze, że jesteś. Spokojniej z tobą w mieście."], ["Ty to masz u mnie wolną bramę."]],
        dzwonnik: [["Kto tam?"], ["A... ty."], ["Witaj, chłopcze."], ["Dobrze, że przyszedłeś."], ["Mój uczniu..."]],
        kupiec: [["Tak? Czym mogę służyć?"], ["A, przyjaciel."], ["Drogi sąsiad!"], ["Mój najlepszy klient!"], ["Ach, chluba tego miasta!"]],
        soltys: [["Słucham, słucham."], ["A, młody od Stacha."], ["Dzień dobry, sąsiedzie."], ["Dobrze, że jesteś. Potrzebuję rozsądnej głowy."], ["Ty to masz u mnie posłuch."]],
        garbarz: [["Czego? Skóry masz?"], ["A, bosy. Dzień dobry."], ["Sąsiad!"], ["O, chłopak, co nie marudzi!"], ["Nasz! Wchodź, siadaj."]],
        feliks: [["Słucham? Spieszę się."], ["A, wnuk pana Stacha."], ["Dzień dobry, młodzieńcze."], ["Miło pana widzieć, doprawdy."], ["Ach, nasz dobrodziej!"]],
        bronek: [["Ty jesteś ten bosy?"], ["Cześć!"], ["Hej, sąsiad!"], ["To ty! Chodź się bawić!"], ["Mój najlepszy kolega!"]],
        zosia: [["...Dzień dobry."], ["Cześć!"], ["Dzień dobry, sąsiedzie!"], ["To ty! Chodź, pokażę ci coś!"], ["Mój rycerz!"]],
        ludmila: [["Dzień dobry... panie."], ["Dzień dobry."], ["Dobrze, że jesteś."], ["Nasz dobry człowiek."], ["Dla nas jesteś jak rodzina."]],
        ela: [["..."], ["Cześć."], ["Hej!"], ["To ty! Mama mówi, że jesteś dobry."], ["Mój przyjaciel!"]],
        rafal: [["Czego?"], ["Ty znowu."], ["A, to ty. W porządku."], ["Dobrze, że to ty."], ["Bracie."]]
    };

    // ------------------------------------------------------------------
    // The market day (every 7 days: 7, 14, 21...) - more calls round the stalls
    // ------------------------------------------------------------------
    const MARKET = {
        every: 7, hours: [6, 14],
        notice: ["Dziś dzień targowy", "Na rynku gwar do drugiej po południu."],
        barks: {
            piekarka: ["Dzień targowy! Chleb tańszy, kto pierwszy!", "Bułki z kminkiem, tylko dziś!", "Weź dwa, kochaneczku, drugi taniej!"],
            woziwoda: ["W targ przydział jak zawsze - po dzbanie na dom!", "Kolejka, ludzie, kolejka!"],
            kupiec: ["Sukno z kontynentu! Noże, gwoździe, przyprawy!", "Targ to targ - targujmy się!", "Dla przyjaciół rabat. Dla reszty też, tylko mniejszy."],
            soltys: ["Ludzie, porządek przy straganach!", "Opłata targowa - grosz od stołu!"],
            dzwonnik: ["Targ... jak za dawnych lat. Tylko ciszej.", "Dziś dzwon bije weselej."],
            kowal: ["Kto kupi podkowę na szczęście?", "Noże ostrzę od ręki!"],
            garbarz: ["Pasy, rzemienie, sakiewki!", "Buty na miarę - przyjmuję zamówienia!"],
            kapral: ["Pilnować sakiewek! W tłoku są złodzieje.", "Spokojnie, ludzie, spokojnie."]
        }
    };

    // ------------------------------------------------------------------
    // The calendar: the ferry every 3 days (the quest board's new notices come with it), the bigger dated days (docs/QUESTY.md 5.4).
    // `wait`: what the day still waits for (a map, characters) - the journal says it; nothing happens in the game yet.
    // ------------------------------------------------------------------
    const CALENDAR = {
        ferryEvery: 3,
        events: [
            { day: 10, title: "Prom po bitwie", text: "Prom przywiezie ludzi z kontynentu - pierwsza fala uchodźców. Pod murem staną namioty.", wait: "obóz uchodźców i jego ludzie" },
            { day: 24, title: "Druga fala z promu", text: "Namiotów przybędzie, przy beczkach Kuby będą kłótnie. Dwór zacznie zbierać zboże na wojnę.", wait: "obóz uchodźców" },
            { day: 33, title: "Imieniny Lorda", text: "U drzwi dworu kolejka z prezentami. Lord lubi miód pitny i placek jagodowy." },
            { day: 38, title: "Trzecia fala z promu", text: "Znowu nowi ludzie z kontynentu. Ceny na tydzień w górę.", wait: "obóz uchodźców" },
            { day: 42, title: "Noc Kupały", text: "Ogniska na łące za bramą południową, kwiat paproci w lesie - jedna noc w roku.", wait: "święto na łące (mapa, ogniska)" },
            { day: 52, title: "Czwarta fala i noc promu", text: "Wielki ładunek na przystań. Ktoś będzie chciał coś wywieźć po cichu.", wait: "przystań i wóz" },
            { day: 56, title: "Dożynki", text: "Wieniec z jęczmienia, konkurs na największą kapustę, uczta Lorda dla miasta. Lord przypomni o długu dziadka.", wait: "święto na rynku" }
        ]
    };

    // ------------------------------------------------------------------
    // The bell's signals (W2 "Kod dzwonu"): what the hero can hear and note. `when`: what goes on at that moment.
    // ------------------------------------------------------------------
    const SIGNALS = {
        "3": { name: "trzy o trzeciej", pattern: [3], when: "Głęboka noc, miasto śpi. Ambroży dzwoni co noc, choć nikt go o to nie prosi.", meaning: "nocna straż: wszystko spokojnie" },
        "1-1-1-1": { name: "cztery pojedyncze", pattern: [1, 1, 1, 1], when: "Jedenasta w nocy: kapral Wit kończy obchód murów i wraca do bramy.", meaning: "zmiana warty" },
        "4+2": { name: "cztery i dwa", pattern: [4, 2], when: "Pierwszy deszcz po kilku dniach suszy.", meaning: "woda idzie" },
        "2+2+2": { name: "trzy razy po dwa", pattern: [2, 2, 2], when: "Burza - piorun uderzył niedaleko.", meaning: "ogień" }
    };

    // things carried that are not items of the database (letters, a horseshoe, a crate...): the journal and the needs show them
    const VITEMS = {
        podkowa: { name: "Podkowa z herbem Lorda", icon: 342 },
        bochen: { name: "Bochen od Hanki", icon: 339 },
        list: { name: "List dziadka do Lorda", icon: 0 },
        petycja: { name: "Petycja sołtysa", icon: 0 },
        skrzynia: { name: "Skrzynia Baltazara", icon: 0 },
        podkowy: { name: "Podkowy dla straży", icon: 342 },
        cwieki: { name: "Ćwieki do butów", icon: 344 },
        obwieszczenie: { name: "Obwieszczenie sołtysa", icon: 0 },
        koszyki: { name: "Koszyki dla dworu", icon: 0 },
        lek: { name: "Lek z kontynentu", icon: 0 },
        plaszcze: { name: "Płaszcze od Ignaca", icon: 368 }
    };

    // the quests' places: events put into the maps (Tawerna.inject, ids 951-959 - the same id may serve another map). Shown and
    // usable only while a quest needs them (self switch A). wall: true - it is a wall / a window (O facing it); deco: a little
    // picture drawn on it (paper - a notice, glint - something shining, tracks - paw prints, doused - a drowned fire basket)
    const SPOTS = {
        bakery_window: { map: 8, id: 951, x: 6, y: 39, name: "Hanka (zza okienka)" },
        notice_tavern: { map: 8, id: 952, x: 25, y: 16, name: "Ściana tawerny", wall: true, deco: "paper", owner: null },
        notice_bakery: { map: 8, id: 953, x: 7, y: 39, name: "Ściana piekarni", wall: true, deco: "paper", owner: "piekarka" },
        notice_smithy: { map: 8, id: 954, x: 8, y: 48, name: "Ściana kuźni", wall: true, deco: "paper", owner: "kowal" },
        notice_kantor: { map: 8, id: 955, x: 15, y: 39, name: "Ściana kantoru", wall: true, deco: "paper", owner: "kupiec" },
        south_gate: { map: 8, id: 956, x: 26, y: 54, name: "Pod bramą południową", deco: "tracks" },
        watch_post: { map: 8, id: 957, x: 26, y: 20, name: "Posterunek przy bramie twierdzy" },
        east_brazier: { map: 8, id: 958, x: 49, y: 49, name: "Kosz żarowy", wall: true, deco: "doused" },
        horseshoe: { map: 22, id: 951, x: 20, y: 14, name: "Polna droga", deco: "glint" }
    };

    // K5: what each one says when the bread comes (one a day, in turn) - the first time it goes into the journal
    const GOSSIP = {
        dzwonnik: ["Chleb? Dziękuję. Słyszałeś w nocy dzwon? Nie? To dobrze. Ludzie powinni spać.", "Dziękuję, chłopcze. Kruki siedzą dziś nisko. Będzie deszcz albo kłopot."],
        kapral: ["Od Hanki? Dobra kobieta. Między nami: do kantoru wnoszą nocą więcej skrzyń, niż przypływa łodzi.", "Dzięki. Dwór kazał liczyć obcych przy bramie. Wychodzi ich więcej, niż wchodzi."],
        ludmila: ["Chleb? Dla nas? ...Dziękuję. Ela, chodź! Wiesz, w nocy ktoś chodzi koło stogów. Z beczkami.", "Dziękuję. Na kontynencie mówią, że wyspa ma pod skałami coś, za co warto ginąć. Tu nikt o tym nie mówi."],
        soltys: ["Dziękuję. Lord znów podnosi podatek - na wojnę. A ogród ma zielony jak na wiosnę.", "Dziękuję. Uchodźców będzie więcej. Gdzie ja ich, na litość, pomieszczę?"]
    };

    // D17: what each one says when signing; the ones who will not
    const SIGN = {
        kowal: "Petycja? Daj, postawię krzyżyk. Duży, żeby Lord widział.",
        piekarka: "Dziesięć groszy od domu? Z czego, z mąki? Podpisuję, kochaneczku.",
        woziwoda: "Podpiszę... tylko nie mów nikomu, że ja. Lord daje mi przepustkę.",
        garbarz: "Krzyżyk umiem. Na skórze bym ładniej postawił, ale niech będzie.",
        dzwonnik: "Ostatni raz podpisywałem coś dla zamku... dawno. Daj.",
        kupiec: "Podpis kupca kosztuje, przyjacielu. Ale dla ciebie... zgoda.",
        kupiecAsk: "Mój podpis? Jestem tu gościem, przyjacielu. Gość nie podpisuje się pod niczym... za darmo. Trzy wyprawione skóry i postawię najpiękniejszy krzyżyk w mieście.",
        kapral: "Ja służę Lordowi. Nie podpiszę. I nie widziałem, że to nosisz."
    };

    // ------------------------------------------------------------------
    // THE QUESTS
    // ------------------------------------------------------------------
    const H_KOWAL = [5.5, 17], H_PIEK = [6, 14], H_KUBA = [7, 14], H_WIT = [6, 18], H_PATROL = [18, 23], H_IGNAC = [6.5, 17];
    const QUESTS = [
        // =========================================================== K1
        {
            id: "K1", kind: "K", title: "Węgiel do paleniska", giver: "kowal", icon: 79, where: "kuźnia, taras rzemieślników", when: "6–17, od dnia 2",
            desc: "Palenisko Tadka przygasa, a węgla nie ma - węglarz z gór nie przyjechał. Węgiel drzewny daje piec na polu albo drzewo zwęglone piorunem.",
            offer: {
                cond: { hours: H_KOWAL, day: 2 },
                say: ["Palenisko mi przygasa, a węgla ani grudki. Węglarz z gór nie przyjechał - wojna, drogi, licho wie co.",
                    "Przyniesiesz pięć worków węgla drzewnego? Z pieca na polu albo z drzewa, w które walnął piorun. Przed dziewiątą - to ci jeszcze naostrzę narzędzie."],
                yes: "Przyniosę węgiel.", no: "Nie teraz.",
                accept: ["No to czekam. Tylko nie każ mi czekać do zimy."], decline: ["Twoja wola. Palenisko poczeka. Ja też."]
            },
            steps: [
                { type: "bring", to: "kowal", need: [[79, 5]], hours: H_KOWAL, fx: "k1Early",
                    text: "Przynieś Tadkowi 5× Węgiel drzewny (kuźnia, 6–17). Przed 9:00 naostrzy ci narzędzie.",
                    remind: ["Węgiel, chłopcze. Pięć worków. Bez tego kuję na zimno."], hero: ["> Mam węgiel. Pięć worków."],
                    done: ["O, to rozumiem! Palenisko odżyje."] }
            ],
            reward: { gold: 15, xp: 50, opinion: 2 }
        },
        // =========================================================== K2
        {
            id: "K2", kind: "K", title: "Woda do hartowania", giver: "kowal", icon: 138, where: "kuźnia", when: "6–17, po 3 dniach bez deszczu",
            desc: "Koryto do hartowania wyschło i kuźnia stoi. Tadek prosi o dwie porcje twojej deszczówki - z wiadra albo z bukłaka. Woda dla siebie czy dla innych?",
            offer: {
                cond: { hours: H_KOWAL, day: 3, dry: 3 },
                say: ["Koryto do hartowania wyschło do dna. Rozgrzane żelazo muszę w czymś studzić, inaczej pęka.",
                    "Przydział od Kuby starcza ledwo do picia. Masz deszczówkę? Dwie porcje - z wiadra albo z bukłaka. Zapłacę uczciwie."],
                options: [
                    { label: "Przyniosę dwie porcje.", then: "accept", say: ["Dobry z ciebie chłopak. Tylko nie odejmuj sobie od ust."] },
                    { label: "Nie mogę - sam ledwo mam.", then: "refuse", say: ["Rozumiem. Każdy ma swoje pragnienie. Pójdę prosić sołtysa o większy przydział."] },
                    { label: "Nie teraz.", then: "decline", say: ["Koryto poczeka. Ja też."] }
                ]
            },
            steps: [
                { type: "bring", to: "kowal", water: 2, hours: H_KOWAL,
                    text: "Oddaj Tadkowi 2 porcje swojej deszczówki (z wiadra noszonego w plecaku albo z bukłaka).",
                    remind: ["Dwie porcje deszczówki, chłopcze. Z wiadra albo z bukłaka."], hero: ["> Mam deszczówkę. Dwie porcje."],
                    done: ["Deszczówka! Czysta jak łza. Koryto znowu syczy, jak trzeba."],
                    choice: { ask: ["Co wolisz w zamian? Grosz czy gwoździe?"], options: [
                        { label: "25 groszy.", say: ["Masz. Uczciwie zarobione."], reward: { gold: 25 } },
                        { label: "Sześć gwoździ.", say: ["Sześć gwoździ, kute dziś rano. Trzymaj."], reward: { items: [[88, 6]] } }
                    ] } }
            ],
            reward: { xp: 50, opinion: 3 }
        },
        // =========================================================== K3
        {
            id: "K3", kind: "K", title: "Podkowa w słońcu", giver: "kowal", icon: 86, where: "kuźnia → Polna droga", when: "w południe (11–14), przy słońcu",
            desc: "Z wozu Wieśka wypadła podkowa dla konia Lorda. W samo południe błyska w słońcu między kamieniami na Polnej drodze - szukasz błysku, nie podkowy.",
            offer: {
                cond: { hours: H_KOWAL, day: 2 },
                say: ["Wiesiek wiózł mi podkowy dla konia Lorda i jedną zgubił na Polnej drodze. Lord już o nią pytał. Dwa razy.",
                    "Szukaj w samo południe, przy słońcu - podkowa błyska między kamieniami. Szukaj błysku, nie podkowy."],
                yes: "Poszukam.", no: "Nie teraz.",
                accept: ["Polna droga, między kamieniami. Od jedenastej do drugiej, póki słońce stoi wysoko."], decline: ["Ech. Lord zapyta trzeci raz."]
            },
            steps: [
                { type: "spot", spot: "horseshoe", hours: [11, 14], clear: true, vgives: { podkowa: 1 },
                    text: "Znajdź podkowę na Polnej drodze: w południe (11–14), przy słońcu, błyska między kamieniami.",
                    say: ["> (Coś błysnęło w słońcu.) Jest! Nowa podkowa, z herbem Lorda wybitym na pręcie."] },
                { type: "bring", to: "kowal", need: [["v:podkowa", 1]], hours: H_KOWAL, text: "Oddaj podkowę Tadkowi (kuźnia, 6–17).",
                    remind: ["Znalazłeś? Nie? Szukaj w południe, jak słońce wysoko."], hero: ["> Znalazłem podkowę. Błyszczała, jak mówiłeś."],
                    done: ["Ha! Ta sama. Lord nie będzie miał się do czego przyczepić. Dobre oko masz."] }
            ],
            reward: { gold: 10, xp: 50, opinion: 1 }
        },
        // =========================================================== K4
        {
            id: "K4", kind: "K", title: "Chleb przed świtem", giver: "piekarka", icon: 61, where: "piekarnia na rynku", when: "dzień przed; 3:30–5:00",
            desc: "Piec Hanki musi ruszyć o czwartej, inaczej o szóstej nie będzie chleba. A drewna brak. Trzeba wstać przed świtem.",
            offer: {
                cond: { hours: H_PIEK, day: 2 },
                say: ["Piec musi ruszyć o czwartej, inaczej o szóstej nie będzie chleba. A drewna mi brakuje - drwal leży w gorączce.",
                    "Przyniesiesz jutro cztery polana? Między wpół do czwartej a piątą, pod okienko piekarni. Zapukaj, otworzę."],
                yes: "Przyniosę przed świtem.", no: "Nie dam rady.",
                accept: ["Złoty chłopak! Tylko nie zaśpij, kochaneczku."], decline: ["Nic to. Spalę stare koszyki."]
            },
            steps: [
                { type: "spot", spot: "bakery_window", dayRel: 1, hours: [3.5, 5], need: [[61, 4]],
                    deadline: { day: 1, hour: 5, late: "fail" },
                    text: "Jutro między 3:30 a 5:00 przynieś Hance 4× Drewno pod okienko piekarni.",
                    early: ["Okienko piekarni zamknięte. Hanka otworzy przed świtem (3:30–5:00)."],
                    say: ["> (Pukasz w okienko.) Hanko! Drewno!", "Już, już! Cztery polana - złoty chłopak. Masz dwa bochny prosto z pieca, jeszcze gorące."] }
            ],
            reward: { gold: 8, items: [[83, 2]], xp: 50, opinion: 2 },
            fail: { opinion: -1, text: "Hanka rozpaliła piec czym się dało." }
        },
        // =========================================================== K5
        {
            id: "K5", kind: "K", title: "Bochenki do dziewiątej", giver: "piekarka", icon: 83, repeat: "daily", where: "stragan → dzwonnik, brama wschodnia, obóz pod murem, ratusz",
            when: "6–9, codziennie",
            desc: "Cztery bochny przed dziewiątą: Ambrożemu, kapralowi Witowi przy bramie wschodniej, Ludmile do obozu pod murem i sołtysowi pod ratusz. Każdy rzuci słowo plotki.",
            offer: {
                cond: { hours: [6, 8.5] },
                say: ["Pomożesz? Cztery bochny trzeba roznieść przed dziewiątą: Ambrożemu, kapralowi przy bramie wschodniej, Ludmile do obozu pod murem i sołtysowi pod ratusz.",
                    "Za Ludmiłę płaci sołtys, reszta z góry. Ja płacę tobie - dwanaście groszy."],
                yes: "Roznoszę!", no: "Nie dziś.", vgives: { bochen: 4 },
                accept: ["Leć! Tylko nie zjedz po drodze."], decline: ["To sama polecę. Moje nogi, moja sprawa."]
            },
            steps: [
                { type: "custom", talk: "k5", targets: ["dzwonnik", "kapral", "ludmila", "soltys"], deadline: { day: 0, hour: 9, late: "fail" },
                    text: "Roznieś 4 bochny przed 9:00: Ambroży (rynek), kapral Wit (brama wschodnia), Ludmiła (obóz pod murem), sołtys (ratusz, od 8:00)." },
                { type: "talk", to: "piekarka", hours: H_PIEK, text: "Wróć do Hanki po zapłatę (stragan, do 14:00).",
                    say: ["> Wszystko rozniesione.", "Wszyscy dostali? I nikt nie marudził? To zasłużyłeś. Dwanaście groszy, proszę."] }
            ],
            reward: { gold: 12, xp: 20, opinionFirst: 1 },
            fail: { opinion: -1, text: "Chleb wystygł, a ludzie czekali." }
        },
        // =========================================================== K6
        {
            id: "K6", kind: "K", title: "Jęczmień do żaren", giver: "piekarka", icon: 74, where: "stragan na rynku", when: "lato i jesień, 6–14",
            desc: "Mąki z młyna nie ma, bo koło stoi, odkąd opadł strumień. Hanka zmieli jęczmień z pola dziadka w ręcznych żarnach.",
            offer: {
                cond: { hours: H_PIEK, season: [1, 2] },
                say: ["Mąki z młyna już nie będzie, póki koło stoi. Mam stare żarna po babce - zmielę ręcznie, byle było co.",
                    "Masz jęczmień z pola dziadka? Cztery garście. Upiekę ci za to placek z jagodami."],
                yes: "Przyniosę jęczmień.", no: "Jeszcze nie urósł.",
                accept: ["Czekam, kochaneczku. Żarna już naoliwione."], decline: ["Jak urośnie, to pamiętaj o mnie."]
            },
            steps: [
                { type: "bring", to: "piekarka", need: [[74, 4]], hours: H_PIEK, text: "Przynieś Hance 4× Jęczmień (stragan, 6–14).",
                    remind: ["Cztery garście jęczmienia, kochaneczku. Żarna czekają."], hero: ["> Jęczmień z pola dziadka. Cztery garście."],
                    done: ["Piękne ziarno! Jutro będą podpłomyki. A to placek dla ciebie - obiecałam."] }
            ],
            reward: { gold: 10, items: [[136, 1]], xp: 50, opinion: 2,
                note: ["Młyn stoi", "Hanka mieli jęczmień w ręcznych żarnach, bo młyn stoi, odkąd opadł strumień. Koło i kamienie podobno są całe - brakuje tylko wody w korycie."] }
        },
        // =========================================================== K8
        {
            id: "K8", kind: "K", title: "Pęknięta beczka", giver: "woziwoda", icon: 80, where: "studnia na rynku", when: "7–14",
            desc: "Beczka Kuby cieknie, a każda kropla to pieniądz. Dwie deski, cztery gwoździe i młotek - obręcz zbijesz na miejscu.",
            offer: {
                cond: { hours: H_KUBA, day: 2 },
                say: ["Psia kość, beczka cieknie! Każda kropla to grosz, a tu leje się na bruk.",
                    "Przyniesiesz dwie deski i cztery gwoździe? I młotek, bo mój... pożyczyłem i przepadł. Obręcz zbijesz tu, na miejscu."],
                yes: "Przyniosę.", no: "Nie teraz.",
                accept: ["Tylko szybko, zanim do reszty wycieknie."], decline: ["No to cieknie dalej. Pięknie."]
            },
            steps: [
                { type: "bring", to: "woziwoda", need: [[80, 2], [88, 4]], tools: [[89, 1]], hours: H_KUBA, se: "Hammer",
                    text: "Przynieś Kubie 2× Deski i 4× Gwoździe i zbij obręcz młotkiem (studnia na rynku, 7–14).",
                    remind: ["Dwie deski, cztery gwoździe, młotek. Cieknie, słyszysz?"], hero: ["> Deski, gwoździe, młotek. Pokaż tę beczkę."],
                    done: ["No! Trzyma jak dzwon. Masz, zarobiłeś.", "> Skąd ty w ogóle bierzesz tyle wody?", "Z daleka. Nie pytaj.",
                        "> (Mokre klepki pachną dziwnie słodko. Jak róża.)"] }
            ],
            reward: { gold: 10, xp: 50, opinion: 1, clue: "w1_barrel",
                note: ["Beczka Kuby", "Kuba ma wodę codziennie, choć studnia na rynku ledwo daje parę wiader. Zapytany skąd - „Z daleka. Nie pytaj.” Mokre klepki jego beczki pachniały słodko, jak róża."] }
        },
        // =========================================================== K9
        {
            id: "K9", kind: "K", title: "Kłótnia w kolejce", giver: "woziwoda", icon: 0, where: "studnia na rynku", when: "7–8:30, po 3 dniach bez deszczu",
            desc: "Tadek i Ignac pokłócili się o przydział wody. Kuba prosi, żebyś rozsądził - jego nie posłuchają.",
            offer: {
                cond: { hours: [7, 8.5], dry: 3, day: 3 },
                say: ["Ratunku, chłopcze. Tadek i Ignac skoczyli sobie do oczu o przydział. Każdy krzyczy, że jego robota ważniejsza.",
                    "Kowal bez wody nie hartuje, garbarz nie wyprawi skór. A ja mam jedną beczkę na nich dwóch. Kto ma brać pierwszy? Ty powiedz - mnie nie posłuchają."],
                options: [
                    { label: "Po połowie, a na zmianę co dzień pierwszy.", then: "close", reward: { opinion: 3, xp: 50, items: [[131, 1]] },
                        say: ["Po połowie i na zmianę... A wiesz, że to ma sens? Idę im powiedzieć.", "> (Po chwili Ignac przynosi ci miskę kapuśniaku. „Za rozum” - mówi.)"], fx: "k9Fair" },
                    { label: "Niech rzucą kośćmi.", then: "close", reward: { opinion: -2, xp: 20 },
                        say: ["Kośćmi? O wodę? No dobra...", "Ignac przegrał i teraz nie gada z Tadkiem. Pięknie. Dzięki."], fx: "k9Dice" },
                    { label: "To nie moja sprawa.", then: "decline", say: ["Niczyja. Jak zawsze."] }
                ]
            },
            steps: []
        },
        // =========================================================== K10
        {
            id: "K10", kind: "K", title: "Smak wody", giver: "garbarz", icon: 129, where: "garbarnia", when: "6:30–17, po „Pękniętej beczce”",
            desc: "Ignac moczy skóry w wodzie od Kuby, a one potem pachną różami. W taką suszę, kiedy w mieście nie ma jednego kwiatka. Porównaj z własną deszczówką.",
            offer: {
                cond: { hours: H_IGNAC, done: ["K8"] },
                say: ["Powiem ci coś dziwnego. Moczę skóry w wodzie od Kuby, a one potem pachną różami. Różami! W taką suszę, kiedy w całym mieście nie ma jednego kwiatka.",
                    "Powąchaj moją kadź, jak mi nie wierzysz. A potem powąchaj swoją deszczówkę."],
                yes: "Powącham.", no: "Nie mam czasu na wąchanie skór.",
                accept: ["> (Pochylasz się nad kadzią.) Róża... i coś jak rdza. Żelazo?", "No właśnie. A teraz twoja deszczówka. Przynieś trochę - w wiadrze albo w bukłaku."],
                decline: ["Jak chcesz. Ja i tak wiem swoje."]
            },
            steps: [
                { type: "bring", to: "garbarz", showWater: 1, hours: H_IGNAC, text: "Pokaż Ignacowi trochę swojej deszczówki (wiadro albo bukłak) - do porównania.",
                    remind: ["Deszczówka, chłopcze. W wiadrze albo w bukłaku. Nie wylewaj jej - tylko powąchamy."],
                    hero: ["> Moja deszczówka. Nie pachnie niczym. Trochę dachem."],
                    done: ["No właśnie. A woda Kuby pachnie różą i żelazem.", "Róże rosną tylko tam, gdzie ktoś je podlewa. Ciekawe, kto w tym mieście ma wodę na róże."] }
            ],
            reward: { xp: 40, opinion: 1, clue: "w1_roses",
                note: ["Smak wody", "Woda Kuby pachnie różą i żelazem (kadź Ignaca), deszczówka nie pachnie niczym. Ignac: „Róże rosną tylko tam, gdzie ktoś je podlewa.”"] }
        },
        // =========================================================== K11
        {
            id: "K11", kind: "K", title: "Myto przy bramie", giver: "kapral", icon: 61, where: "brama wschodnia (do dworu)", when: "6–18",
            desc: "Kapral Wit chce dwa grosze myta „na wojnę” od każdego, kto idzie do dworu. Można zapłacić albo odrobić - kosze żarowe żrą drewno.",
            offer: {
                cond: { hours: H_WIT },
                say: ["Stać. Brama do dworu Lorda Zaleskiego. Myto: dwa grosze. Na wojnę.",
                    "Nie masz? Możesz odrobić - kosze żarowe przy bramie żrą drewno jak smok. Sześć polan i jesteśmy kwita."],
                options: [
                    { label: "Płacę dwa grosze.", then: "close", cost: 2, flag: "witKnows", reward: { xp: 20 },
                        say: ["Dziękuję. Zapamiętam twoją gębę - następnym razem przechodzisz bez gadania."] },
                    { label: "Odrobię: przyniosę 6 polan.", then: "accept", say: ["Sześć polan. Do koszy przy bramie. Czekam."] },
                    { label: "Nie teraz.", then: "decline", say: ["Brama nie ucieknie. Myto też nie."] }
                ]
            },
            steps: [
                { type: "bring", to: "kapral", need: [[61, 6]], hours: H_WIT, text: "Przynieś kapralowi Witowi 6× Drewno do koszy żarowych (brama wschodnia, 6–18).",
                    remind: ["Sześć polan, chłopcze. Kosze same się nie nakarmią."], hero: ["> Sześć polan do koszy."],
                    done: ["Równo ułożone. Dobra robota. Jesteś teraz znany straży - przechodź śmiało."] }
            ],
            reward: { xp: 50, opinion: 1, flag: "witKnows" }
        },
        // =========================================================== K12
        {
            id: "K12", kind: "K", title: "Łój do latarni", giver: "kapral", icon: 59, where: "obchód murów, wieczorem", when: "18–23",
            desc: "W latarni patrolu kończy się łój. Kawał tłustego mięsa z dzika albo jelenia - Wit wytopi łój. Albo dwie pochodnie.",
            offer: {
                cond: { hours: H_PATROL, day: 2 },
                say: ["W latarni kończy się łój, a do rana daleko. Dwór obiecał świece. Obiecał.",
                    "Przynieś kawał tłustego mięsa z dzika albo jelenia - wytopię łój. Albo dwie pochodnie, jak już masz."],
                yes: "Przyniosę.", no: "Nie teraz.",
                accept: ["Wieczorem obchodzę mury. Znajdziesz mnie."], decline: ["To będę chodził po ciemku. Nie pierwszy raz."]
            },
            steps: [
                { type: "bring", to: "kapral", needAny: [[[159, 1]], [[157, 1]], [[59, 2]]], anyRewards: [{ items: [[59, 2]] }, { items: [[59, 2]] }, { gold: 8 }],
                    hours: H_PATROL, text: "Przynieś kapralowi Witowi 1× Surowe mięso dzika albo jelenia (na łój) albo 2× Pochodnia (obchód murów, 18–23).",
                    remind: ["Tłuste mięso albo dwie pochodnie. Latarnia ledwo się tli."], hero: ["> Masz. Na latarnię."],
                    done: ["Dzięki. Powiem ci jedno, bo jesteś w porządku: po północy to nie ja jestem w tym mieście najdziwniejszy.",
                        "Ktoś chodzi z beczkami, kiedy porządni ludzie śpią. Ja nic nie mówiłem."] }
            ],
            reward: { xp: 50, opinion: 1, clue: "w1_night",
                note: ["Kapral o nocy", "Kapral Wit: „Po północy to nie ja jestem w tym mieście najdziwniejszy. Ktoś chodzi z beczkami, kiedy porządni ludzie śpią.”"] }
        },
        // =========================================================== K13
        {
            id: "K13", kind: "K", title: "Sznur dzwonu", giver: "dzwonnik", icon: 93, where: "rynek → dzwonnica", when: "rano, do 12:00",
            desc: "Sznur dzwonu się przetarł. Dwie liny przed południem - inaczej pierwszy raz w historii miasta nie zadzwoni południe.",
            offer: {
                cond: { hours: [6.3, 11.5], day: 2 },
                say: ["Sznur się przetarł. Jeszcze jedno szarpnięcie i pęknie. A w południe trzeba dzwonić. Zawsze trzeba.", "Przynieś mi dwie liny przed dwunastą. Proszę."],
                yes: "Przyniosę liny.", no: "Nie zdążę.",
                accept: ["Przed dwunastą. Pamiętaj."], decline: ["Wytrzyma. Musi."]
            },
            steps: [
                { type: "bring", to: "dzwonnik", need: [[93, 2]], hours: [6.3, 12.3], deadline: { day: 0, hour: 12, late: "fail" },
                    text: "Przynieś Ambrożemu 2× Lina przed 12:00 (ławka na rynku, przed południem przy dzwonnicy).",
                    remind: ["Dwie liny, chłopcze. Słońce idzie w górę."], hero: ["> Dwie liny. Zdążyłem?"],
                    done: ["Zdążyłeś. Południe zadzwoni, jak zawsze. Jak od trzystu lat."] }
            ],
            reward: { gold: 10, xp: 50, opinion: 2 },
            fail: { opinion: -1, text: "W południe dzwon milczał. Pierwszy raz od trzystu lat.", fx: "k13Silence" }
        },
        // =========================================================== K14
        {
            id: "K14", kind: "K", title: "Dzwonnik ma chore kolana", giver: "dzwonnik", icon: 0, where: "dzwonnica", when: "17:30–18:15, od Opinii 20",
            desc: "O osiemnastej Ambroży nie da rady wejść po schodach. Zadzwoń za niego: sześć uderzeń, kiedy serce dzwonu jest na górze. Ani jednego więcej.",
            offer: {
                cond: { hours: [17.5, 18.25], opinion: 20, day: 3 },
                say: ["Kolana... nie wejdę dziś po schodach. A szósta za chwilę.", "Zadzwonisz za mnie? Sześć uderzeń. Ciągnij, kiedy serce dzwonu jest na górze. Ani jednego więcej."],
                yes: "Zadzwonię.", no: "Nie umiem.",
                accept: ["Idź. Sznur jest nowy."], decline: ["To jakoś wejdę. Jakoś."]
            },
            steps: [
                { type: "custom", talk: "bellTalk", target: 6, text: "Zadzwoń za Ambrożego o 18:00: dokładnie 6 uderzeń (porozmawiaj z nim przy dzwonnicy, 17:30–18:15).",
                    deadline: { day: 0, hour: 18.4, late: "fail" } }
            ],
            reward: { xp: 50 },
            fail: { opinion: 0, text: "Ambroży wszedł po schodach sam. Powoli." },
            lines: {
                go: ["Sznur jest tam, na górze. Sześć razy. Ani jednego więcej."],
                ok: ["Równo jak za dawnych lat. Dziękuję, chłopcze. Kolana też dziękują."],
                badRhythm: ["Liczba dobra, choć krzywo. Dzwon wybaczy. Ja też."],
                wrong: ["Nie tak! Nie tak... Trzy i jeden to coś innego...", "(Ambroży blednie jak ściana.) Nic. Nic się nie stało. Idź już."],
                quit: ["Nie zadzwoniłeś? To... wejdę sam. Jakoś."],
                note: ["Dzwon: liczba ma znaczenie", "Zadzwoniłem za Ambrożego złą liczbę razy. Zbladł: „Trzy i jeden to coś innego...” Liczba uderzeń coś znaczy."]
            }
        },
        // =========================================================== K15
        {
            id: "K15", kind: "K", title: "Ostrożnie, kruche", giver: "kupiec", icon: 0, where: "kantor → brama południowa", when: "21:30–22:30",
            desc: "Baltazar chce, żeby skrzynia stanęła na wozie pod bramą południową o dziesiątej wieczorem. „Nie otwierać - kruche.” Skrzynia jest ciężka.",
            offer: {
                cond: { hours: [21.5, 22.2], day: 3 },
                say: ["Ach, przyjaciel. Mam drobną prośbę. Ta skrzynia ma stanąć na wozie pod bramą południową. O dziesiątej. Nie otwierać - kruche.",
                    "Pięć groszy teraz, dwadzieścia potem. Uczciwie?"],
                yes: "Zaniosę.", no: "Nie noszę cudzych skrzyń po nocy.", vgives: { skrzynia: 1 }, pay: 5,
                accept: ["Wiedziałem, że się dogadamy. Ostrożnie na schodach."], decline: ["Szkoda. Znajdę kogoś mniej... wybrednego."]
            },
            steps: [
                { type: "spot", spot: "south_gate", hours: [21.5, 22.5], need: [["v:skrzynia", 1]], deadline: { day: 0, hour: 22.5, late: "fail" },
                    talk: "k15Wit",
                    text: "Zanieś skrzynię Baltazara pod bramę południową przed 22:30. Nie otwieraj (albo oddaj ją kapralowi Witowi).",
                    say: ["> (Za bramą, w ciemności, stoi wóz. Ktoś czeka, nie widać twarzy.)"],
                    choice: { ask: [], options: [
                        { label: "Postaw skrzynię na wozie.", say: ["> (Z ciemności szept:) „Od Veya? Dobrze. Idź już.”"], flag: "k15Clean", next: 1 },
                        { label: "Najpierw zajrzyj do środka.", say: ["> (Zamek pęka cicho. W słomie leżą stare kamienie z wyrytym krukiem.)",
                            "> (Szybko zamykasz wieko i stawiasz skrzynię na wozie. Szept: „Od Veya? Dobrze.”)"], flag: "k15Opened", clue: "w5_stones",
                            note: ["Skrzynia Baltazara", "W skrzyni, którą Baltazar kazał nocą postawić na wozie pod bramą południową, leżały w słomie stare kamienie z wyrytym krukiem."], next: 1 }
                    ] } },
                { type: "custom", talk: "k15Pay", text: "Odbierz zapłatę u Baltazara (kantor, 8–18)." }
            ],
            reward: { xp: 50 },
            fail: { opinion: -1, text: "Wóz odjechał bez skrzyni. Baltazar nie będzie zachwycony." },
            lines: {
                wit: ["> Kapralu, Baltazar kazał mi to zanieść na wóz pod bramą południową. O tej porze.", "Skrzynia od Veya? Nocą? ...Dobrze zrobiłeś, że przyszedłeś do mnie. Ja się tym zajmę."],
                payClean: ["Skrzynia dotarła cała. Lubię ludzi, którzy nie zadają pytań. Dwadzieścia groszy, jak obiecałem."],
                payOpened: ["Zamek pęknięty. Ciekawość to piękna cecha... u kota. Dziesięć groszy i zapomnij, że mnie znasz."],
                payWit: ["Słyszałem, że lubisz kaprala. Ja też... lubiłem ciebie. Nic ci nie jestem winien, przyjacielu."]
            }
        },
        // =========================================================== K16
        {
            id: "K16", kind: "K", title: "Grzyby po dwakroć", giver: "kupiec", icon: 103, repeat: "trade", where: "kantor", when: "dzień po promie, 8–18",
            desc: "Dzień po promie Baltazar skupuje grzyby, jagody i wędzone mięso po podwójnej cenie - do dziesięciu sztuk. Dziwne, że bierze tylko to, co długo wytrzyma.",
            offer: { cond: { hours: [8, 18], afterFerry: true }, custom: "k16Trade" },
            steps: [],
            lines: {
                intro: ["Wczoraj przypłynął prom, a jutro odpływa. Skupuję grzyby, jagody i wędzone mięso. Płacę podwójnie - tylko dziś i tylko do dziesięciu sztuk."],
                none: ["Nie masz nic, co wytrzyma drogę? Szkoda. Do następnego promu, przyjacielu."],
                full: ["Na dziś mam dość. Następny prom za trzy dni."],
                sold: ["Interes zrobiony. Do następnego promu, przyjacielu."],
                no: "Nic nie sprzedam."
            },
            reward: { xp: 30, clue: "w8_stores",
                note: ["Zapasy Baltazara", "Dzień po promie Baltazar skupuje po podwójnej cenie grzyby, jagody i wędzone mięso - tylko to, co długo wytrzyma. Jakby ktoś szykował zapasy na długą drogę."] }
        },
        // =========================================================== K17
        {
            id: "K17", kind: "K", title: "Obwieszczenie o racjach", giver: "soltys", icon: 88, where: "ratusz → tawerna, piekarnia, kuźnia, kantor", when: "8–18",
            desc: "Cztery obwieszczenia: woda tylko na przydział, a za kradzież deszczówki - kara. Trzeba je przybić gwoździem na tawernie, piekarni, kuźni i kantorze.",
            offer: {
                cond: { hours: [8, 18], day: 2 },
                say: ["Mam tu cztery obwieszczenia. Woda tylko na przydział, a za kradzież deszczówki - kara. Trzeba je przybić: na tawernie, na piekarni, na kuźni i na kantorze.",
                    "Gwoździe i młotek masz swoje? To dobrze, bo ratusz nie ma ani jednego, ani drugiego."],
                yes: "Przybiję.", no: "Nie teraz.", vgives: { obwieszczenie: 4 },
                accept: ["Cztery gwoździe, cztery ściany. Ludzie będą psioczyć - nie słuchaj."], decline: ["To niech wiszą w ratuszu. Nikt tu nie zagląda."]
            },
            steps: [
                { type: "custom", spotFx: "k17", spots: ["notice_tavern", "notice_bakery", "notice_smithy", "notice_kantor"], hours: [6, 20],
                    text: "Przybij 4 obwieszczenia (1 gwóźdź i młotek na każde): ściana tawerny, piekarni, kuźni i kantoru." },
                { type: "talk", to: "soltys", hours: [8, 18], text: "Wróć do sołtysa (ratusz albo rynek).",
                    say: ["> Wiszą wszystkie cztery.", "Dobra robota. I co mówili?", "> Hanka pyta, czym zarobi na ciasto. Tadek klnie. Baltazar się cieszy.",
                        "Baltazar się cieszy... Zapamiętam. Teraz przynajmniej wiem, kto jest przeciw mnie."] }
            ],
            react: { notice_bakery: "Kara za deszczówkę? A czym ja zarobię na ciasto?", notice_smithy: "Psiakrew! Jeszcze tego brakowało!",
                notice_kantor: "Racje? Doskonale. Racje zawsze dobrze się sprzedają." },
            reward: { gold: 10, xp: 50, opinion: 1,
                note: ["Obwieszczenie o racjach", "Przybiłem obwieszczenia sołtysa. Hanka pytała, czym zarobi na ciasto, Tadek klął, a Baltazar się ucieszył - racje zawsze dobrze się sprzedają."] }
        },
        // =========================================================== K20
        {
            id: "K20", kind: "K", title: "Pierwsza skóra", giver: "garbarz", icon: 96, where: "garbarnia", when: "6:30–17, po pierwszym polowaniu",
            desc: "Ignac kupi twoją pierwszą surową skórę i pokaże, jak ciąć, żeby ścięgna nie szły na zmarnowanie.",
            offer: {
                cond: { hours: H_IGNAC, has: [[96, 1]] },
                say: ["Masz surową skórę? Pokaż... Pierwsza? Widać po cięciach.", "Kupię ją - osiem groszy. I pokażę ci, jak ciąć, żeby ścięgna nie szły na zmarnowanie."],
                options: [
                    { label: "Sprzedam.", then: "close", need: [[96, 1]], reward: { gold: 8, xp: 50, opinion: 1 }, fx: "k20Bonus",
                        say: ["Patrz: tu, wzdłuż, a nie w poprzek. Następne trzy zwierzęta oprawisz czyściej - zobaczysz, ile ścięgien zostanie."] },
                    { label: "Zostawię sobie.", then: "decline", say: ["Twoja skóra, twoja sprawa. Ale tniesz jak rzeźnik."] }
                ]
            },
            steps: []
        },
        // =========================================================== K21
        {
            id: "K21", kind: "K", title: "Garbnik z lasu", giver: "garbarz", icon: 147, where: "garbarnia", when: "6:30–13, oddać do 17:00",
            desc: "Skończył się garbnik. Dziesięć szyszek i cztery naręcza gałęzi (na korę) - przed piątą po południu, potem kadź stygnie.",
            offer: {
                cond: { hours: [6.5, 13], day: 2 },
                say: ["Skończył mi się garbnik. Bez kory i szyszek skóra zgnije, zanim się wyprawi.", "Przynieś dziesięć szyszek i cztery naręcza gałęzi. Przed piątą po południu - potem kadź stygnie."],
                yes: "Przyniosę.", no: "Nie dziś.",
                accept: ["Do piątej. Las niedaleko."], decline: ["To jutro będzie śmierdziało bardziej niż zwykle."]
            },
            steps: [
                { type: "bring", to: "garbarz", need: [[147, 10], [77, 4]], hours: H_IGNAC, deadline: { day: 0, hour: 17, late: "fail" },
                    text: "Przynieś Ignacowi 10× Szyszki i 4× Gałęzie przed 17:00 (garbarnia).",
                    remind: ["Dziesięć szyszek i cztery naręcza gałęzi. Kadź stygnie."], hero: ["> Szyszki i gałęzie. Na korę."],
                    done: ["W samą porę. Kadź jeszcze ciepła. Dzięki, chłopcze."] }
            ],
            reward: { gold: 12, xp: 50, opinion: 2 },
            fail: { opinion: -1, text: "Kadź wystygła." }
        },
        // =========================================================== K31
        {
            id: "K31", kind: "K", title: "Imieniny Lorda", giver: "feliks", icon: 137, where: "rynek (Feliks) → drzwi dworu", when: "dzień 33, do 20:00",
            desc: "Na imieniny Lorda każdy dom coś niesie. Lord lubi miód pitny i placek jagodowy. Dwa dzbany miodu i placek - w dniu 33, do 20:00.",
            offer: {
                cond: { hours: [7, 10.5], day: 26, until: 33, story: true },
                say: ["W dniu trzydziestym trzecim jaśnie pan obchodzi imieniny. Każdy dom coś przynosi - taki zwyczaj. A zwyczajów pilnuję ja.",
                    "Jaśnie pan lubi miód pitny i placek jagodowy. Dwa dzbany miodu i placek - może łaskawiej spojrzy na dług pana dziadka."],
                yes: "Zaniosę prezent.", no: "Nie stać mnie.",
                accept: ["Dzień trzydziesty trzeci, przed ósmą wieczorem. Do rąk jaśnie pana."], decline: ["Rozumiem. Jaśnie pan i tak nie liczy prezentów. Ja liczę."]
            },
            steps: [
                { type: "bring", to: "lord", need: [[137, 2], [136, 1]], dayIs: 33, hours: [8, 20], deadline: { abs: 33, hour: 20, late: "fail" },
                    text: "W dniu 33 (8–20) zanieś Lordowi 2× Miód pitny i 1× Placek jagodowy (drzwi dworu).",
                    early: ["Imieniny są trzydziestego trzeciego. Nie wcześniej, młodzieńcze."], remind: ["Imieniny! I co, z pustymi rękami?"],
                    hero: ["> Na imieniny, panie. Miód pitny i placek z jagodami."],
                    done: ["Miód pitny i placek! Feliks, zapisz: wnuk Stacha pamiętał.", "Przyjmij czterdzieści groszy. Albo... zapiszę je na poczet długu twojego dziadka. Wybieraj."],
                    choice: { ask: [], options: [
                        { label: "Wezmę pieniądze.", say: ["Proszę. Wnuk Stacha wie, co dobre."], reward: { gold: 40 } },
                        { label: "Zapisz na dług dziadka.", say: ["Feliks, zapisz: czterdzieści na poczet długu. Rozsądny chłopak."], reward: { gold: 40, debt: true } }
                    ] } }
            ],
            reward: { xp: 50, opinion: 2, flag: "lordNameDay" },
            fail: { opinion: 0, text: "Imieniny minęły bez twojego prezentu." }
        },
        // =========================================================== K32
        {
            id: "K32", kind: "K", title: "List od dziadka", giver: "grandpa", icon: 0, where: "dom dziadka → drzwi dworu", when: "dni 5–20, Lord 8–20",
            desc: "Dziadek prosi w liście o zwłokę w spłacie długu. Zwłoki nie będzie - ale Lord zada dziwne pytanie.",
            offer: {
                cond: { day: 5, until: 20, story: true },
                say: ["Wnuku... napisałem do Lorda. Proszę o zwłokę. Wiem, wiem - nic to nie da. Ale ojciec mnie uczył: proś, zanim zaczniesz się kłócić.",
                    "Zaniesiesz mu ten list? Do rąk własnych."],
                auto: true, vgives: { list: 1 },
                accept: ["> Zaniosę, dziadku.", "Dobry z ciebie wnuk. Lord stoi przed dworem od ósmej do ósmej."]
            },
            steps: [
                { type: "bring", to: "lord", need: [["v:list", 1]], hours: [8, 20], text: "Zanieś list dziadka Lordowi (drzwi dworu, 8–20).",
                    hero: ["> List od dziadka Stacha. Do rąk własnych."],
                    done: ["List od Stacha? (czyta) Zwłoki nie będzie. Dług to dług.",
                        "Ale powiedz mi... na polu twojego dziadka leżą jeszcze te stare kamienie? Z wyrytym krukiem? Mój dziadek je zbierał. Ładne kamienie."] }
            ],
            reward: { xp: 40, clue: "lord_stones",
                note: ["Lord pyta o kamienie", "Lord nie da zwłoki. Za to zapytał, czy na polu dziadka leżą jeszcze stare kamienie z wyrytym krukiem - „mój dziadek je zbierał”."] }
        },
        // =========================================================== K38
        {
            id: "K38", kind: "K", title: "Nocna warta", giver: "kapral", icon: 59, where: "brama twierdzy (górny dziedziniec)", when: "1:00–3:00, od Opinii 20",
            desc: "Strażnik przy bramie twierdzy ma gorączkę. Postój tam od pierwszej do trzeciej w nocy i zapamiętaj, co zobaczysz.",
            offer: {
                cond: { hours: H_PATROL, opinion: 20, day: 3 },
                say: ["Mój człowiek przy bramie twierdzy złapał gorączkę. Ktoś musi tam postać od pierwszej do trzeciej w nocy.",
                    "Patrzysz, słuchasz, nic nie robisz. Jak coś zobaczysz - zapamiętaj. Piętnaście groszy."],
                yes: "Postoję.", no: "Nocą śpię.",
                accept: ["Posterunek przy bramie twierdzy, od strony tawerny. Pierwsza w nocy. Nie spóźnij się."], decline: ["Jak wszyscy."]
            },
            steps: [
                { type: "spot", spot: "watch_post", hours: [0.75, 1.5], deadline: { day: 1, hour: 1.5, late: "fail" },
                    text: "Stań na posterunku przy bramie twierdzy między 0:45 a 1:30 (górny dziedziniec, przed tawerną).",
                    early: ["Warta zaczyna się o pierwszej w nocy."], say: ["> Zaczynam wartę. Do trzeciej."] },
                { type: "custom", tick: "k38Watch", text: "Pilnuj bramy twierdzy do 3:00. Nie odchodź od posterunku." },
                { type: "talk", to: "kapral", hours: H_PATROL, text: "Zamelduj się u kaprala Wita (obchód murów, 18–23).", sayFx: "k38Report" }
            ],
            reward: { gold: 15, xp: 50, opinion: 1 },
            fail: { opinion: -2, text: "Posterunek stał pusty." },
            lines: {
                fox: "Lis przemknął pod murem...", owl: "Sowa pohukuje na wieży.", kuba: "Kuba? Z pustymi beczkami, o tej porze? Idzie w stronę stawu...",
                left: "Zszedłeś z posterunku przed trzecią.",
                reportKuba: ["> Lis, sowa... I Kuba, koło drugiej, z pustymi beczkami. Szedł w stronę stawu za tawerną.",
                    "Kuba? ...Nie widziałeś niczego, czego ja bym nie widział. Masz piętnaście groszy. Dobrze się spisałeś."],
                reportQuiet: ["> Lis, sowa. Poza tym spokój.", "Spokój to dobra wiadomość. Masz piętnaście groszy."]
            }
        },

        // =========================================================== K19
        {
            id: "K19", kind: "K", title: "Spis obozu", giver: "soltys", icon: 0, where: "ratusz → obóz pod murem", when: "od dnia 10, za dnia",
            desc: "Pod murem śpią ludzie z promu. Sołtys liczy racje wody na głowy - policz ich. Ktoś poprosi, żebyś go nie liczył.",
            offer: {
                cond: { hours: [8, 18], day: 10 },
                say: ["Pod murem, przy stogach, śpią ludzie z promu. Muszę wiedzieć ilu - racje wody liczę na głowy.", "Policz ich. Porozmawiaj z każdym, żebym potem nie słyszał, że kogoś pominąłem."],
                yes: "Policzę.", no: "Nie teraz.",
                accept: ["Pod murem na tarasie rzemieślników. Rano albo wieczorem ich zastaniesz."], decline: ["To policzę na oko. Jak zawsze."]
            },
            steps: [
                { type: "custom", talk: "k19Count", targets: ["ludmila", "ela", "rafal"],
                    text: "Porozmawiaj z każdym w obozie pod murem: Ludmiła, Ela i... ktoś jeszcze (Rafał wychodzi tylko o świcie i późnym wieczorem). Policzeni: {n}/3." },
                { type: "talk", to: "soltys", hours: [8, 18], text: "Powiedz sołtysowi, ilu ludzi jest w obozie.",
                    say: ["Policzyłeś? No, mów. Ilu?"],
                    choice: { ask: [], options: [
                        { label: "Troje: kobieta, dziecko i mężczyzna.", say: ["Troje. Mężczyzna? Kapral będzie chciał wiedzieć, kto to. Dziękuję, spisałem."], flag: "campCountTrue", reward: { opinion: 1 } },
                        { label: "Dwoje: matka z córką.", say: ["Dwoje. Dobrze, łatwiej o wodę dla dwojga. Dziękuję."], flag: "rafalHidden" }
                    ] } }
            ],
            reward: { gold: 10, xp: 50 },
            lines: {
                ludmila: ["> Sołtys liczy ludzi w obozie. Na racje wody.", "Ludmiła. I córka, Ela. Dwie. Napisz, że dwie... i że Ela pije mało. Bardzo mało."],
                ela: ["> A ty jak masz na imię?", "Ela. Mam sześć lat. I konika. To znaczy... miałam."],
                rafal: ["> Sołtys liczy ludzi w obozie.", "Nie licz mnie. Proszę. Mnie tu nie ma. Jak kapral zobaczy moje imię na liście... na kontynencie wieszają za mniej."],
                rafalYes: ["...Dziękuję. Nie zapomnę."], rafalNo: ["Rozumiem. Każdy robi, co musi. Ja też."]
            }
        },
        // =========================================================== K27
        {
            id: "K27", kind: "K", title: "Konik dla Eli", giver: "ludmila", icon: 61, where: "obóz pod murem", when: "rano i wieczorem",
            desc: "Od przeprawy Ela nie śpi. Jej drewniany konik został w spalonej chacie na kontynencie. Kawałek drewna i nóż - może zaśnie.",
            offer: {
                cond: { hours: [6.5, 20], day: 2 },
                say: ["Od przeprawy Ela nie śpi. Budzi się z krzykiem. W domu miała drewnianego konika... został w spalonej chacie.",
                    "Umiesz strugać? Kawałek drewna i nóż. Może by zasnęła."],
                yes: "Wystrugam jej konika.", no: "Nie umiem strugać.",
                accept: ["Dziękuję... Ela kocha konie. Tata obiecał jej prawdziwego."], decline: ["Rozumiem. Każdy ma swoje kłopoty."]
            },
            steps: [
                { type: "bring", to: "ela", need: [[61, 1]], toolsAny: [91, 90], hours: [6.6, 20],
                    text: "Wystrugaj Eli konika: 1× Drewno i nóż (kamienny albo żelazny). Daj go Eli (obóz pod murem, rano i wieczorem).",
                    remind: ["...?"], hero: ["> (Strugasz z polana konika. Krzywy, ale ma grzywę i cztery nogi.) Proszę. To dla ciebie."],
                    done: ["Konik! ...Ma na imię Wiatr. Tak jak tamten.", "@ludmila: Dziękuję ci. Tam, skąd uciekamy, wszyscy czegoś szukają. Żołnierze mówili o sercu skały. Ludzie giną za coś, czego nikt nie widział."] }
            ],
            reward: { xp: 50, opinion: 3, clue: "w6_heart",
                note: ["Konik dla Eli", "Wystrugałem Eli konika. Ludmiła: „Tam, skąd uciekamy, wszyscy szukają serca skały. Ludzie giną za coś, czego nikt nie widział.”"] }
        },
        // =========================================================== K28
        {
            id: "K28", kind: "K", title: "Kocioł dla obozu", giver: "ludmila", icon: 131, where: "obóz pod murem", when: "rano i wieczorem; zimą liczy się podwójnie",
            desc: "W obozie jedzą raz na dwa dni. Ugotuj w kociołku coś gorącego - kapuśniak, gulasz albo zupę grzybową - dwie porcje.",
            offer: {
                cond: { hours: [6.5, 20], day: 3 },
                say: ["Jemy raz na dwa dni. Rafał przynosi, co znajdzie, ale... Ela rośnie.",
                    "Gdybyś ugotował coś ciepłego - kapuśniak, gulasz, zupę - dwie porcje. Starczy nam na dwa dni."],
                yes: "Ugotuję.", no: "Sam ledwo mam co jeść.",
                accept: ["Niech Bóg ci to wynagrodzi. Ja nie mam czym."], decline: ["Rozumiem. Naprawdę."]
            },
            steps: [
                { type: "bring", to: "ludmila", needAny: [[[131, 2]], [[130, 2]], [[132, 2]]], hours: [6.5, 20], fx: "k28Winter",
                    text: "Przynieś Ludmile 2 porcje gorącej zupy z kociołka: Kapuśniak, Gulasz albo Zupa grzybowa (obóz pod murem).",
                    remind: ["Nic, nic... Ela już zjadła kromkę od pani Hanki."], hero: ["> Gorące. Z kociołka. Dwie porcje."],
                    done: ["Ciepłe! Ela, chodź, jedz powoli... Dziękuję ci. Nie zapomnę."] }
            ],
            reward: { xp: 50, opinion: 4, flag: "campFed" }
        },
        // =========================================================== K29
        {
            id: "K29", kind: "K", title: "Rana Rafała", giver: "rafal", icon: 152, where: "ulica rzemieślników", when: "o świcie (4:30–6:30) albo późnym wieczorem (21–23:30)",
            desc: "Rafał ukrywa ranę po strzale. Załóż mu opatrunek - tak, żeby nie widział tego kapral Wit, który obchodzi mury do jedenastej.",
            offer: {
                cond: { hours: [[4.5, 6.5], [21, 23.5]] },
                say: ["Nie patrz tak. ...Dobra. Patrz. (Rafał odsłania ramię - zaogniona rana po strzale.)",
                    "Opatrzysz? Tylko po cichu. Kapral chodzi tędy wieczorem. Jak mnie zobaczy z raną od strzały... na kontynencie wieszają za mniej."],
                yes: "Przyniosę opatrunek.", no: "Nie mieszam się.",
                accept: ["...Dzięki. Będę tu, o świcie albo późnym wieczorem. Nikomu ani słowa."], decline: ["Mądrze. Ja bym się nie mieszał."]
            },
            steps: [
                { type: "bring", to: "rafal", need: [[152, 1]], hours: [[4.5, 6.5], [21, 23.5]], guard: "k29Guard",
                    text: "Załóż Rafałowi opatrunek (1× Opatrunek) - o świcie albo późnym wieczorem, kiedy kaprala Wita nie ma w pobliżu.",
                    remind: ["Opatrunek. Ziołowy. Sam nie zrobię - nie mam czym."], hero: ["> Pokaż ramię. Tylko nie krzycz."],
                    done: ["(Zakładasz opatrunek. Rafał zaciska zęby.)", "...Dziękuję. Nie wiem, czemu to robisz. Ale dziękuję."] }
            ],
            reward: { xp: 40, flag: "rafalTrust",
                note: ["Rana Rafała", "Rafał ma ranę po strzale i ukrywa się przed kapralem Witem - na kontynencie wieszają dezerterów. Opatrzyłem go po cichu."] },
            lines: { guard: "Cicho! Kapral idzie. Nie teraz - przyjdź, jak przejdzie." }
        },
        // =========================================================== K30
        {
            id: "K30", kind: "K", title: "Koszyki dla dworu", giver: "feliks", icon: 0, where: "stragany → drzwi dworu", when: "dni targowe, 7–9",
            desc: "Feliks robi zakupy dla dworu i nie da rady wszystkiego unieść. Trzy ciężkie koszyki do rąk Lorda przed dziewiątą.",
            offer: {
                cond: { hours: [7, 8.5], market: true, story: true },
                say: ["Dzień targowy, a ja mam tylko dwie ręce. Trzy koszyki na śniadanie jaśnie pana.",
                    "Zaniesie je pan do dworu? Przed dziewiątą - jaśnie pan stoi przed drzwiami od ósmej. Zapłacę. Pięć groszy do ręki, pięć na poczet długu."],
                yes: "Zaniosę.", no: "Nie dziś.", vgives: { koszyki: 3 },
                accept: ["Ostrożnie, w tym są jajka. Do rąk jaśnie pana."], decline: ["Trudno. Poniosę na raty."]
            },
            steps: [
                { type: "bring", to: "lord", need: [["v:koszyki", 3]], hours: [8, 9], deadline: { day: 0, hour: 9, late: "fail" },
                    text: "Zanieś Lordowi 3 koszyki od Feliksa przed 9:00 (drzwi dworu; Lord stoi przed nimi od 8:00). Są ciężkie.",
                    hero: ["> Koszyki od Feliksa, panie. Na śniadanie."],
                    done: ["Koszyki od Feliksa? Postaw tu. ...Wnuk Stacha nosi koszyki dla dworu. Twój dziadek też kiedyś nosił. Feliks, zapisz pięć na dług."] }
            ],
            reward: { gold: 5, debtCredit: 5, xp: 30, opinion: 1 },
            fail: { opinion: -1, text: "Śniadanie jaśnie pana wystygło." }
        },
        // =========================================================== D4
        {
            id: "D4", kind: "D", title: "Złodziej o świcie", giver: "piekarka", icon: 83, where: "stragan na rynku + obóz pod murem", when: "od dnia 11, o świcie",
            desc: "Co rano z kosza Hanki znika jeden bochen. Zaczaj się przed szóstą przy straganie - po cichu - i zobacz, kto to.",
            offer: {
                cond: { hours: [6, 12], day: 11 },
                say: ["Co rano znika mi jeden bochen. Z kosza, przed szóstą, kiedy jeszcze rozkładam stragan.",
                    "Zaczaisz się jutro o wpół do szóstej przy straganie? Tylko cicho - złodziej nie może cię zobaczyć."],
                yes: "Zaczaję się.", no: "To tylko jeden bochen.",
                accept: ["Wpół do szóstej, przy moim straganie. Ja udam, że nic nie wiem."], decline: ["Jeden dziś, jeden jutro... Ech."]
            },
            steps: [
                { type: "custom", tick: "d4Ambush", text: "Zaczaj się przy straganie Hanki między 5:20 a 5:50, skradając się (C). Złodziej nie może cię zobaczyć." },
                { type: "talk", to: "ela", hours: [6.6, 20], text: "Mała postać uciekła w stronę obozu pod murem. Porozmawiaj z Elą.",
                    say: ["> To ty bierzesz chleb od pani Hanki?", "...Dla mamy. Mama nie je, żebym ja jadła. Nie mów pani Hance. Proszę."],
                    choice: { ask: [], options: [
                        { label: "Muszę jej powiedzieć.", say: ["(Ela płacze.)"] },
                        { label: "Będę płacił za twój chleb.", cost: 15, say: ["> Od dziś chleb dla ciebie jest zapłacony. Na tydzień z góry.", "Naprawdę? ...Dziękuję!"] },
                        { label: "Pogadam z Hanką o pracy dla twojej mamy.", cond: { opinion: 20 }, say: ["Mama umie piec! W domu piekła dla całej wsi!"] }
                    ] } },
                { type: "talk", to: "piekarka", hours: [6, 14], text: "Wróć do Hanki.", sayFx: "d4Hanka", rewardFx: "d4Reward" }
            ],
            reward: { xp: 100 },
            lines: {
                seen: ["> (Mała postać wysuwa się zza straganu, łapie bochen z kosza i biegnie w dół, w stronę muru. Dwa warkoczyki.)"],
                spotted: "Złodziej cię zobaczył i uciekł. Spróbuj jutro - po cichu (C).",
                hankaTell: ["> To Ela, córka Ludmiły z obozu. Nosi chleb matce.", "Mała Ela? ...Powiem sołtysowi. Złodziej to złodziej, choćby i mały. Dziękuję ci."],
                hankaPay: ["> To Ela, córka Ludmiły z obozu. Za jej chleb zapłacę ja - masz za tydzień z góry.", "Ty płacisz za cudzy chleb? ...Dobry z ciebie chłopak. Niech mała bierze, co trzeba."],
                hankaWork: ["> To Ela, córka Ludmiły z obozu. Jej matka umie piec. Może by ci pomagała przy piecu o czwartej?",
                    "Ludmiła przy moim piecu? ...A wiesz, że czwarta rano to ciężka godzina dla jednej baby? Niech przyjdzie jutro. Zobaczymy, co umie.",
                    "@ela: Narysowałam ci coś. To kruk nad tawerną. A tu schody w dół. Mama mówi, że w nocy coś tam stuka."]
            }
        },
        // =========================================================== D10
        {
            id: "D10", kind: "D", title: "Gorączka Eli", giver: "ludmila", icon: 110, where: "obóz + łąki + kantor", when: "wiosna i lato, 2 dni",
            desc: "Ela ma gorączkę. Pomoże gorący wywar z ziół i trochę czystej wody do przemywania czoła - z twojej deszczówki. Baltazar ma też „lek z kontynentu”.",
            offer: {
                cond: { hours: [6.5, 20], day: 11, season: [0, 1] },
                say: ["Ela ma gorączkę. Od wczoraj. Pali się cała.", "Wywar z ziół by pomógł. I trochę czystej wody do przemywania czoła. Ja nie mam ani ognia, ani wody."],
                yes: "Zrobię wywar.", no: "Nie mam wody dla innych.",
                accept: ["Dziękuję... Będę przy niej. Cały czas."], decline: ["...Rozumiem. Woda to woda."]
            },
            steps: [
                { type: "bring", to: "ludmila", needAny: [[[110, 1]], [["v:lek", 1]]], water: 1, hours: [6.5, 20], talk: "d10Lek",
                    text: "Zaparz Wywar ziołowy (3× Zioła na ogniu) i oddaj go Ludmile z 1 porcją swojej deszczówki. (Baltazar sprzedaje też „lek z kontynentu” za 60 G.)",
                    remind: ["Wywar z ziół. I trochę wody na czoło. Tylko tyle."], hero: ["> Wywar dla Eli. I czysta woda - z mojej deszczówki."],
                    done: ["Ciepły... Ela, pij powoli. Ja przy niej posiedzę całą noc."] },
                { type: "wait", days: 1, hour: 6, text: "Ela przespi noc z gorączką. Zajrzyj rano." },
                { type: "talk", to: "ludmila", hours: [6.5, 20], text: "Zajrzyj rano do Ludmiły i Eli (obóz pod murem).", sayFx: "d10Morning" }
            ],
            reward: { xp: 100, opinion: 6, flag: "elaHealed" },
            lines: {
                lek: ["Lek z kontynentu. Działa na wszystko, co ma gorączkę. Sześćdziesiąt groszy, przyjacielu."],
                lekBuy: ["Mądry wybór. Proszę. Tylko nie pytaj, skąd mam."], lekNo: ["Zioła też leczą. Czasem."],
                morning: ["Gorączka spadła! Ela zjadła pół kromki i spytała o konika. Nie wiem, jak ci dziękować."],
                morningLek: ["Gorączka spadła. Ten flakonik... spójrz. Pieczęć wojska z kontynentu. Skąd kupiec ma lekarstwa armii?"]
            }
        },
        // =========================================================== D18
        {
            id: "D18", kind: "D", title: "Płaszcze przed zimą", giver: "garbarz", icon: 112, where: "garbarnia + obóz pod murem (+ Feliks na rynku)", when: "jesień, od dnia 70",
            desc: "Idzie zima, a obóz pod murem marznie. Ignac uszyje pięć płaszczy z dziesięciu skór i pięciu kłębków wełny. Komu je oddasz?",
            offer: {
                cond: { hours: [6.5, 17], day: 70, season: [2] },
                say: ["Idzie zima. Ci pod murem nie przeżyją jej w tym, w czym przypłynęli.", "Uszyję pięć płaszczy, jeśli przyniesiesz dziesięć surowych skór i pięć kłębków wełny. Robotę daję za darmo. Raz w życiu."],
                yes: "Przyniosę.", no: "Nie dam rady.",
                accept: ["Dziesięć skór, pięć wełny. Zima nie poczeka."], decline: ["Rozumiem. Ale zima zrozumie mniej."]
            },
            steps: [
                { type: "bring", to: "garbarz", need: [[96, 10], [111, 5]], hours: [6.5, 17], text: "Przynieś Ignacowi 10× Surowa skóra i 5× Wełna (garbarnia).",
                    remind: ["Dziesięć skór i pięć wełny. Liczę dni do mrozu."], hero: ["> Skóry i wełna. Wszystko."], done: ["Dwa dni szycia. Przyjdź pojutrze."] },
                { type: "talk", to: "garbarz", after: [0, 2], hours: [6.5, 17], vgives: { plaszcze: 5 }, text: "Odbierz płaszcze u Ignaca (2 dni szycia).",
                    early: ["Jeszcze szyję. Pojutrze, mówiłem."], say: ["Gotowe. Pięć płaszczy, ciepłych jak piec. Zanieś je do obozu, zanim ktoś się zainteresuje."] },
                { type: "custom", talk: "d18Give", text: "Zanieś płaszcze do obozu pod murem (Ludmiła). Feliks kręci się rano przy straganach - też coś o nich słyszał." }
            ],
            lines: {
                camp: ["> Płaszcze. Od Ignaca. Dla was wszystkich.", "Płaszcze... Ela, patrz! Ciepłe! ...Nie wiem, co powiedzieć. Weź jeden dla siebie - Ignac uszył sześć, wiem, liczyłam."],
                feliks: ["Słyszałem o tych płaszczach. Straż dworu marznie na murach - zapłacę za nie trzy razy tyle, co są warte. Dziewięćdziesiąt groszy."],
                feliksYes: ["Rozsądna decyzja. Jaśnie pan doceni. Pan Ignac... cóż, nie musi wiedzieć od razu."], feliksNo: ["Szkoda. Straż będzie marzła. Ale to pana sumienie."]
            },
            reward: { xp: 100 }
        },
        // =========================================================== Podgrodzie (Map111), the poor suburb outside the west wall
        // (2026-10-05): one short errand from each of its residents. Givers live there (TownLife "map: 111"); in the evening and at
        // night they are at home - a bring step is handed over wherever the resident is (also in its cabin).
        // =========================================================== K40
        {
            id: "K40", kind: "K", title: "Woda na pranie", giver: "praczka", icon: 138, where: "Podgrodzie, sznury z praniem", when: "5–17, od dnia 2",
            desc: "Marta nosi wodę z miasta, z przydziału przy studni - dwa wiadra na dzień to za mało na prześcieradła z dworu. Prosi o dwie porcje twojej deszczówki.",
            offer: {
                cond: { hours: [5, 17], day: 2 },
                say: ["Prześcieradła z dworu... Feliks chce je na jutro, a ja z przydziału mam ledwie na namoczenie.",
                    "Masz może deszczówkę? Dwie porcje starczyłyby mi na płukanie. Zapłacę, ile mogę."],
                yes: "Przyniosę deszczówkę.", no: "Sam mam mało.",
                accept: ["Niech ci Bóg wynagrodzi. Będę przy sznurach."], decline: ["Rozumiem. Każdy liczy każdą kroplę."]
            },
            steps: [
                { type: "bring", to: "praczka", water: 2, hours: [5, 22], text: "Daj Marcie 2 porcje swojej deszczówki (wiadro albo bukłak; Podgrodzie, przy praniu).",
                    remind: ["Dwie porcje, kochaneczku. Choćby z bukłaka."], hero: ["> Masz. Dwie porcje deszczówki."],
                    done: ["Czysta jak łza... Dworskie prześcieradła będą białe. Masz, weź te grosze. I przynieś mi kiedyś tę podartą koszulę - zaceruję."] }
            ],
            reward: { gold: 8, xp: 40, opinion: 2 }
        },
        // =========================================================== K41
        {
            id: "K41", kind: "K", title: "Zioła dla babki Jadwigi", giver: "znachorka", icon: 150, where: "Podgrodzie, ogródek ziół", when: "6–18",
            desc: "Babka Jadwiga robi opatrunki dla całego Podgrodzia, a krwawnik w jej ogródku zżółkł od suszy.",
            offer: {
                cond: { hours: [6, 18] },
                say: ["Krwawnik mi uschnął, dziecko. A ludzie się ranią - przy drewnie, przy sidłach, przy murze.",
                    "Przynieś mi trzy krwawniki i dwie pokrzywy z łąki. Zrobię opatrunki - i tobie dam."],
                yes: "Nazbieram.", no: "Nie teraz, babciu.",
                accept: ["Krwawnik ma białe baldachy, pokrzywa parzy. Nie pomylisz."], decline: ["Idź z Bogiem."]
            },
            steps: [
                { type: "bring", to: "znachorka", need: [[150, 3], [149, 2]], hours: [6, 22], text: "Przynieś babce Jadwidze 3× Krwawnik i 2× Pokrzywa (Podgrodzie).",
                    remind: ["Trzy krwawniki, dwie pokrzywy. Stara Jadwiga nie zapomina."], hero: ["> Zioła, babciu. Jak prosiłaś."],
                    done: ["Piękne, świeże! Masz - dwa opatrunki. Przyłóż na ranę, zawiąż mocno. I nie dziękuj, tylko uważaj na siebie."] }
            ],
            reward: { xp: 50, opinion: 2, items: [[152, 2]] }
        },
        // =========================================================== K42
        {
            id: "K42", kind: "K", title: "Kram Józka", giver: "szmaciarz", icon: 80, where: "Podgrodzie, kram starzyzny", when: "7–20",
            desc: "Daszek nad kramem Józka się zapada. Potrzeba desek, gwoździ i młotka.",
            offer: {
                cond: { hours: [7, 20], day: 3 },
                say: ["Widzisz ten daszek? Jeszcze jeden wiatr i cała starzyzna wyląduje w błocie. A starzyzna w błocie to już nie starzyzna, tylko błoto.",
                    "Dwie deski, cztery gwoździe i młotek. Zbijesz? Zapłacę - i dam ci coś z kramu. Coś dobrego!"],
                yes: "Zbiję.", no: "Nie teraz.",
                accept: ["Wiedziałem, że masz dobre ręce! Dobre ręce poznaję od razu."], decline: ["Szkoda. Daszek też szkoda."]
            },
            steps: [
                { type: "bring", to: "szmaciarz", need: [[80, 2], [88, 4]], tools: [[89, 1]], hours: [7, 22], se: "Hammer",
                    text: "Przynieś Józkowi 2× Deski i 4× Gwoździe i zbij daszek młotkiem (kram starzyzny).",
                    remind: ["Deski, gwoździe, młotek. Daszek czeka. Ja też."], hero: ["> Deski, gwoździe. I młotek. Przytrzymaj."],
                    done: ["Stoi! Jak nowy! No, prawie jak nowy. Masz, dwie liny - mocne, z portu. Prawie nieużywane."] }
            ],
            reward: { gold: 10, xp: 50, opinion: 2, items: [[93, 2]] }
        },
        // =========================================================== K43
        {
            id: "K43", kind: "K", title: "Drewno na ognisko", giver: "uchodzca", icon: 61, where: "Podgrodzie, obóz uchodźców", when: "17–22",
            desc: "Ognisko w obozie uchodźców przygasa, a w nocy przy murze zimno. Darin prosi o drewno.",
            offer: {
                cond: { hours: [17, 22] },
                say: ["Ogień nam przygasa. W nocy przy murze jest zimno, a dzieci śpią pod gołym niebem.",
                    "Sześć polan wystarczy do świtu. Nie mam czym zapłacić... ale mogę ci coś opowiedzieć. O kontynencie."],
                yes: "Przyniosę drewno.", no: "Nie dziś.",
                accept: ["Dziękuję, wyspiarzu."], decline: ["Rozumiem. Każdy ma swoje ognisko."]
            },
            steps: [
                { type: "bring", to: "uchodzca", need: [[61, 6]], hours: [6, 23], text: "Przynieś Darinowi 6× Drewno na ognisko (obóz uchodźców w Podgrodziu).",
                    remind: ["Sześć polan, dobrze? Ogień czeka."], hero: ["> Drewno. Sześć polan."],
                    done: ["Ogień do świtu! Siadaj.",
                        "W Varnhel na kontynencie każdy król chce Serca. Mówią, że jest pod jakąś twierdzą na wyspie - pod twierdzą, która czegoś strzegła. Nikt nie wie, pod którą.",
                        "> Pod twierdzą na wyspie...?", "Tak mówili oficerowie. Dlatego tu przypływają statki z ludźmi, którzy nie wyglądają na uchodźców."] }
            ],
            reward: { xp: 40, opinion: 3, note: ["Opowieść Darina", "Darin słyszał od oficerów na kontynencie, że Serce, o które walczą królowie, leży pod twierdzą na wyspie - pod twierdzą, która czegoś strzegła. Tawerna stoi na dawnym zamku..."] }
        },
        // =========================================================== K44
        {
            id: "K44", kind: "K", title: "Lina dla Zbycha", giver: "drwal", icon: 93, where: "Podgrodzie, drewutnia", when: "15–21",
            desc: "Zbychowi pękła lina do wiązania drewna, a nowej nie ma za co kupić.",
            offer: {
                cond: { hours: [15, 21.5] },
                say: ["Pękła mi lina. Drewno wiążę teraz łykiem i rozłazi się po drodze.",
                    "Dwie liny, chłopcze. Za to dostaniesz węgiel z mielerza - kowal płaci za taki uczciwie."],
                yes: "Przyniosę liny.", no: "Nie teraz.",
                accept: ["Dobrze. Rąbię do zmroku."], decline: ["Ech. To jeszcze trochę łyka."]
            },
            steps: [
                { type: "bring", to: "drwal", need: [[93, 2]], hours: [5, 22], text: "Przynieś Zbychowi 2× Lina (drewutnia w Podgrodziu).",
                    remind: ["Dwie liny. Łyko już się kończy."], hero: ["> Liny. Dwie."],
                    done: ["Mocne! Masz, trzy worki węgla. Z mojego mielerza, najlepszy w okolicy."] }
            ],
            reward: { xp: 40, opinion: 2, items: [[79, 3]] }
        },
        // =========================================================== K45
        {
            id: "K45", kind: "K", title: "Włókno na pętle", giver: "klusownik", icon: 92, where: "Podgrodzie", when: "13–20",
            desc: "Rysiek robi pętle na zające z włókna lnu, bo drutu nikt mu nie sprzeda.",
            offer: {
                cond: { hours: [13, 20], day: 2 },
                say: ["Psst. Potrzebuję włókna. Sześć garści. Na pętle.",
                    "Nie pytaj, na co pętle. Przyniesiesz - podzielę się tym, co w nie wpadnie."],
                yes: "Przyniosę włókno.", no: "Nie chcę mieć z tym nic wspólnego.",
                accept: ["Mądry chłopak. I cichy, mam nadzieję."], decline: ["Jak chcesz. Ale głodny będziesz ty, nie ja."]
            },
            steps: [
                { type: "bring", to: "klusownik", need: [[92, 6]], hours: [5, 22], text: "Przynieś Ryśkowi 6× Włókno na pętle (Podgrodzie).",
                    remind: ["Sześć garści włókna. Ciszej mów."], hero: ["> Włókno. Sześć garści."],
                    done: ["Dobre włókno. Masz, dwa zające z wczorajszej nocy. I rada za darmo: pusta pętla nic nie złapie. Zawsze daj przynętę."] }
            ],
            reward: { xp: 40, opinion: 1, items: [[94, 2]], note: ["Rada Ryśka", "Rysiek: „Pusta pętla nic nie złapie. Zawsze daj przynętę.” Sidła łapią tylko z przynętą."] }
        },
        // =========================================================== K46
        {
            id: "K46", kind: "K", title: "Suchar dla Franka", giver: "franek", icon: 83, where: "Podgrodzie", when: "7–19",
            desc: "Franek od rana nic nie jadł, a mama pierze do wieczora.",
            offer: {
                cond: { hours: [7, 19] },
                say: ["Masz coś do jedzenia? Mama pierze, a ja od rana nic... Choćby kawałek chleba."],
                yes: "Przyniosę ci chleb.", no: "Nie mam nic.",
                accept: ["Naprawdę? Będę tu! Albo tam. Gdzieś będę!"], decline: ["Aha..."]
            },
            steps: [
                { type: "bring", to: "franek", need: [[83, 1]], hours: [6, 22], text: "Przynieś Frankowi 1× Chleb (Podgrodzie).",
                    remind: ["Chleb? Masz już?"], hero: ["> Masz. Cały bochenek."],
                    done: ["Cały?! ...Dziękuję!", "Wiesz co? Powiem ci tajemnicę. Kuba woziwoda wyjeżdża po pierwszej w nocy z pustymi beczkami, a przed świtem wraca z pełnymi. Widziałem z dachu!"] }
            ],
            reward: { xp: 20, opinion: 2, note: ["Tajemnica Franka", "Franek widział z dachu: Kuba woziwoda wyjeżdża po pierwszej w nocy z pustymi beczkami, a przed świtem wraca z pełnymi."] }
        },
        // =========================================================== D1
        {
            id: "D1", kind: "D", title: "Buty od szewca", giver: "garbarz", icon: 113, where: "garbarnia + łąki i las + kuźnia", when: "od dnia 5, 4–6 dni",
            desc: "Ignac nie może patrzeć na bose stopy bohatera. Trzy skóry, ćwieki od Tadka, miara o świcie i dwa dni czekania - a potem prawdziwe buty.",
            offer: {
                cond: { hours: H_IGNAC, day: 5 },
                say: ["Patrzę na twoje bose nogi i serce mi pęka. Szewc ze mnie czy nie szewc?",
                    "Zrobię ci buty. Prawdziwe. Przynieś trzy surowe skóry - z jelenia albo z dzika, zając za cienki."],
                yes: "Przyniosę skóry.", no: "Bosy też dojdę.",
                accept: ["Trzy skóry. A potem zobaczymy, jaką masz stopę."], decline: ["Dojdziesz. Do pierwszego ciernia."]
            },
            steps: [
                { type: "bring", to: "garbarz", need: [[96, 3]], hours: H_IGNAC, text: "Przynieś Ignacowi 3× Surowa skóra (z jelenia albo z dzika).",
                    remind: ["Trzy skóry, chłopcze. Grube."], hero: ["> Trzy skóry. Grube, jak chciałeś."],
                    done: ["Dobre. Dwa dni w kadzi. A ty idź do Tadka - niech wykuje dwanaście ćwieków. Żelazo daj swoje."] },
                { type: "bring", to: "kowal", need: [[86, 1]], hours: H_KOWAL, vgives: { cwieki: 1 }, text: "Zanieś Tadkowi 1× Żelazo - wykuje 12 ćwieków do butów.",
                    remind: ["Ćwieki? Z czego, z powietrza? Daj kawałek żelaza."], hero: ["> Ignac mówi, że wykujesz dwanaście ćwieków do butów."],
                    done: ["Ćwieki dla Ignaca? Ha, buty z ćwiekami - jak u rycerza. Masz, jeszcze ciepłe."] },
                { type: "talk", to: "garbarz", after: [0, 2], hours: [7, 8], need: [["v:cwieki", 1]],
                    text: "Miara: przyjdź do Ignaca o 7:00 rano (7–8), boso, po rosie - najwcześniej 2 dni po oddaniu skór. Przynieś ćwieki.",
                    early: ["Miarę biorę o siódmej rano, po rosie. Wtedy ślad najlepszy. I skóry muszą swoje odleżeć - dwa dni."],
                    say: ["> Ćwieki od Tadka. I stopy, jak chciałeś.", "Stań na glinie. O tak. Dobra stopa - szeroka, chłopska. Za dwa dni odbierasz."] },
                { type: "talk", to: "garbarz", after: [2, 2], hours: H_IGNAC, text: "Odbierz buty u Ignaca (2 dni po mierze, 6:30–17).",
                    early: ["Jeszcze szyję. Dwa dni, mówiłem."],
                    say: ["Gotowe. Ale powiedz mi jeszcze, jak je wykończyć. Miękko, żeby zwierz nie słyszał? Czy na ćwiekach, żeby śnieg i kamień nie straszne?"],
                    choice: { ask: [], options: [
                        { label: "Buty łowcy - ciche.", say: ["Ciche jak kot. Zwierz usłyszy cię dopiero, jak już będziesz przy nim."], flag: "bootsHunter",
                            reward: { items: [[113, 1]] }, perk: { sneak: 0.2 } },
                        { label: "Podkute buty - pewne.", say: ["Na ćwiekach. Po lodzie przejdziesz jak po rynku, a kamienie ci nie straszne."], flag: "bootsNailed",
                            reward: { items: [[113, 1]] }, perk: { cold: 0.25, "stamina.cost": 0.05 } }
                    ] } }
            ],
            reward: { xp: 100, opinion: 4,
                note: ["Buty od Ignaca", "Ignac uszył mi buty na miarę. Pierwsze prawdziwe buty w moim życiu."] }
        },
        // =========================================================== D3
        {
            id: "D3", kind: "D", title: "Ręka kowala", giver: "kowal", icon: 86, where: "kuźnia + brama wschodnia + ratusz + garbarnia", when: "3 kolejne dni, 6–17",
            desc: "Tadek poparzył dłoń. Przez trzy dni zastępujesz go: podkowy dla straży, gwoździe dla sołtysa, nóż dla Ignaca. Spóźnisz się - klient się obrazi.",
            offer: {
                cond: { hours: [5.5, 14], day: 6, done: ["K1"] },
                say: ["Poparzyłem dłoń. Głupio, o własne szczypce. Trzy dni nie utrzymam młota.",
                    "Zastąpisz mnie? Mam trzy zamówienia, każde na inny dzień. Spóźnisz się - klient się obrazi, a obrażony klient to stracony klient."],
                yes: "Zastąpię cię.", no: "Nie dam rady.",
                accept: ["Dziś podkowy dla straży. Przynieś dwa kawałki żelaza i worek węgla - wykujesz je tu, przy mnie. Wit odbiera o piątej."],
                decline: ["To kuźnia postoi. Ech."]
            },
            steps: [
                { type: "bring", to: "kowal", need: [[86, 2], [79, 1]], hours: [5.5, 16], vgives: { podkowy: 1 }, fx: "d3Forge",
                    deadline: { day: 0, hour: 16, late: "next", skip: 2, text: "Wit wziął podkowy od kowala z sąsiedniej wsi." },
                    text: "Dzień 1: wykuj u Tadka 4 podkowy (2× Żelazo, 1× Węgiel drzewny), potem oddaj je kapralowi Witowi do 17:00.",
                    remind: ["Dwa kawałki żelaza i węgiel. Bez tego nie ma podków."], hero: ["> Żelazo i węgiel. Pokaż, jak się kuje podkowy."],
                    done: ["Grzej... teraz klepnij... obróć... Ha! Krzywa, ale koń nie zauważy.", "> (Godzina przy palenisku. Cztery podkowy, ręce czarne od sadzy.)", "Leć z nimi do Wita. Do piątej."] },
                { type: "bring", to: "kapral", need: [["v:podkowy", 1]], hours: [6, 17.5], deadline: { day: 0, hour: 17.5, late: "next", text: "Kapral Wit czekał na podkowy do piątej." },
                    text: "Dzień 1: oddaj 4 podkowy kapralowi Witowi przy bramie wschodniej do 17:00.",
                    hero: ["> Podkowy od Tadka. Cztery."], done: ["Na czas. Konie straży dziękują. Ja też."] },
                { type: "bring", to: "soltys", need: [[88, 20]], hours: [8, 18], deadline: { day: 1, hour: 18, late: "next", text: "Sołtys kupił gwoździe u Baltazara. Drożej." },
                    text: "Dzień 2: zanieś sołtysowi 20× Gwoździe (na scenę na dożynki) do 18:00 następnego dnia.",
                    remind: ["Dwadzieścia gwoździ, młody. Scena sama się nie zbije."], hero: ["> Gwoździe od Tadka. Dwadzieścia."],
                    done: ["Dwadzieścia, równiutko. Na dożynki będzie scena jak się patrzy."] },
                { type: "bring", to: "garbarz", need: [[91, 1]], hours: H_IGNAC, deadline: { day: 1, hour: 17, late: "next", text: "Ignac kroi skóry kamiennym nożem i klnie." },
                    text: "Dzień 3: zanieś Ignacowi 1× Nóż żelazny do 17:00.",
                    remind: ["Nóż, chłopcze. Żelazny. Moim kamiennym to można chleb kroić, nie skórę."], hero: ["> Nóż żelazny. Od Tadka."],
                    done: ["Ostry jak język sołtysa. Dzięki."] },
                { type: "talk", to: "kowal", hours: H_KOWAL, text: "Wróć do Tadka po zapłatę.",
                    say: ["Słyszałem, słyszałem. Ludzie zadowoleni.", "Mam dla ciebie sześćdziesiąt groszy. Albo... wiesz, ręka goi się długo, a cyrulik drogi. Wybieraj, ja nie będę."],
                    choice: { ask: [], options: [
                        { label: "Wezmę 60 groszy.", say: ["Uczciwie zarobione. Masz."], reward: { gold: 60 } },
                        { label: "Zostaw je sobie na leczenie.", say: ["...Tego ci nie zapomnę, chłopcze. Póki mam kuźnię, masz u mnie wszystko."], reward: { opinion: 6, xp: 50 }, flag: "tadekFriend" }
                    ] } }
            ],
            reward: { xp: 100, opinion: 2 }
        },
        // =========================================================== D5
        {
            id: "D5", kind: "D", title: "Wataha pod bramą", giver: "kapral", icon: 127, where: "brama południowa + Polna droga + Skraj lasu", when: "3 noce",
            desc: "Wilki podchodzą pod mur, a straż ma z dworu rozkaz nie wychodzić. Ślady o świcie, dwa wilki zwiadowcy na Polnej drodze, a potem przewodnik watahy na Skraju lasu.",
            offer: {
                cond: { hours: H_WIT, day: 8 },
                say: ["Wilki podchodzą pod mur. Nocą słychać je aż na rynku. A ja mam z dworu rozkaz: straż nie wychodzi za bramy.",
                    "Ty nie jesteś strażą. Obejrzyj o świcie ślady pod bramą południową. Weź strzały - przydadzą się."],
                yes: "Zajmę się tym.", no: "To nie dla mnie.", gives: [[127, 6]],
                accept: ["Sześć strzał. Nie zmarnuj ani jednej."], decline: ["Rozumiem. Wilk to nie zając."]
            },
            steps: [
                { type: "spot", spot: "south_gate", hours: [5, 9], text: "O świcie (5–9) obejrzyj tropy pod bramą południową.",
                    early: ["Tropy najlepiej widać o świcie, po rosie."],
                    say: ["> Tropy. Duże. Trzy, może cztery wilki... Jeden ślad większy od reszty. Idą od Polnej drogi."] },
                { type: "kill", kind: "wolf", map: 22, n: 2, night: true, spawn: 2, text: "Nocą (21–5) zabij 2 wilki zwiadowców na Polnej drodze." },
                { type: "kill", kind: "wolf", map: 23, n: 1, leader: true, night: true, spawn: 3, text: "Nocą zabij przewodnika watahy na Skraju lasu (największy wilk)." },
                { type: "talk", to: "kapral", hours: H_WIT, text: "Wróć do kaprala Wita (brama wschodnia, 6–18).",
                    say: ["Słyszałem. Przewodnik watahy, mówią. Sam?", "No to teraz pytanie: komu przypiszemy zasługę? Mnie by się przydała. Ale ty ją masz."],
                    choice: { ask: [], options: [
                        { label: "Zasługa twoja, kapralu.", say: ["...Jestem twoim dłużnikiem. Raz przepuszczę cię nocą bez pytań. Raz."], flag: "witOwes", reward: { gold: 80 } },
                        { label: "Powiem o wszystkim sołtysowi.", say: ["Uczciwie. Sołtys ogłosi to na rynku. Masz osiemdziesiąt groszy od miasta."], reward: { gold: 80, opinion: 5 } }
                    ] } }
            ],
            reward: { xp: 150 }
        },
        // =========================================================== D11
        {
            id: "D11", kind: "D", title: "Ognie na murach", giver: "kapral", icon: 79, where: "brama wschodnia i mury", when: "5 wieczorów, 18–21",
            desc: "Kosze żarowe gasną, a dwór nie przysyła węgla. Przez pięć wieczorów przynoś kapralowi po 3× Węgiel drzewny przed 21:00. Czwartej nocy ktoś zalewa kosz wodą.",
            offer: {
                cond: { hours: H_PATROL, day: 6 },
                say: ["Kosze żarowe gasną. Dwór obiecał węgiel i jak zwykle - obiecał.",
                    "Pięć wieczorów, po trzy worki węgla, przed dziewiątą. Płacę na koniec. Siedemdziesiąt groszy."],
                yes: "Będę nosił węgiel.", no: "Nie mam tyle węgla.",
                accept: ["Pięć wieczorów. Każdego wieczoru trzy worki. Przed dziewiątą."], decline: ["To będziemy marzli przy zimnych koszach."]
            },
            steps: [
                { type: "custom", talk: "d11Deliver", upto: 3, text: "Przynieś kapralowi Witowi 3× Węgiel drzewny przed 21:00 (obchód murów, 18–21) - po jednej dostawie na wieczór. Dostawy: {n}/5." },
                { type: "spot", spot: "east_brazier", hours: [21, 2], after: [0, 1], text: "Nocą (po 21:00) zajrzyj do kosza żarowego przy bramie wschodniej.",
                    early: ["Kosz płonie równo. Coś się stanie dopiero nocą."],
                    say: ["> Kosz zgaszony. Zalany wodą - w taką suszę! Z popiołu jeszcze kapie.", "> Na bruku mokre ślady butów. Prowadzą w stronę kantoru."],
                    choice: { ask: [], options: [
                        { label: "Powiem kapralowi.", say: ["> Wit musi to wiedzieć."], flag: "d11Wit" },
                        { label: "Pójdę do Baltazara.", say: ["> Kantor... Ciekawe, co Baltazar na to."], flag: "d11Kantor" }
                    ] } },
                { type: "custom", talk: "d11Report", text: "Powiedz o zalanym koszu kapralowi Witowi (18–23) albo idź do Baltazara (kantor)." },
                { type: "custom", talk: "d11Deliver", upto: 5, text: "Dokończ dostawy węgla dla kaprala Wita (po 3× Węgiel drzewny, 18–21). Dostawy: {n}/5." }
            ],
            reward: { gold: 70, xp: 100, opinion: 5 },
            lines: {
                give: ["> Trzy worki węgla."], thanks: ["Kosze dziękują. Dostaw: {n} z pięciu."],
                remind: ["Trzy worki węgla, przed dziewiątą. Kosze ledwo się tlą."],
                wit: ["> Ktoś zalał kosz przy bramie wschodniej. Wodą. Mokre ślady prowadziły do kantoru.",
                    "Wodą? W taką suszę?! ...Kantor, mówisz. Tej nocy popilnuję sam. A ty noś węgiel dalej."],
                bribe: ["Mokre ślady? Ach, ludzie chodzą, gdzie chcą, przyjacielu.", "Trzydzieści groszy i zapomnisz, dokąd prowadziły?"],
                bribeYes: ["Rozsądny człowiek. Ciemność przy bramie też jest towarem, wiesz?"],
                bribeNo: ["Szkoda. No cóż - idź do swojego kaprala."]
            }
        },
        // =========================================================== D14
        {
            id: "D14", kind: "D", title: "Zboże na wojnę", giver: "kapral", icon: 74, where: "brama wschodnia + pole dziadka", when: "od dnia 24, 3 dni",
            desc: "Dwór zbiera „zboże na wojnę”: trzecią część jęczmienia z każdego pola. Z pola dziadka - sześć garści. Oddać, przekupić kaprala czy schować?",
            offer: {
                cond: { hours: H_WIT, day: 24 },
                say: ["Rozkaz z dworu. Po bitwie na kontynencie zbieramy zboże na wojnę - trzecią część jęczmienia z każdego pola.",
                    "Z pola twojego dziadka: sześć garści jęczmienia. Za trzy dni. Nie mów, że nie ostrzegałem."],
                options: [
                    { label: "Oddam.", then: "accept", step: 0, say: ["Za trzy dni, tu, przy bramie. Lord zapisze to na poczet długu."] },
                    { label: "Ile, żebyś zapomniał?", then: "close", cost: 20, flag: "witBribed", reward: { opinion: -1, xp: 20 },
                        say: ["Dwadzieścia groszy... Nie widziałem pola twojego dziadka. Nikt nie widział."] },
                    { label: "Nie mam zboża.", then: "accept", step: 1, say: ["Nie masz? Za trzy dni sprawdzę. Lepiej, żebyś naprawdę nie miał."] }
                ]
            },
            steps: [
                { type: "bring", to: "kapral", need: [[74, 6]], hours: H_WIT, deadline: { day: 3, hour: 18, late: "fail" }, end: true,
                    text: "Oddaj kapralowi Witowi 6× Jęczmień w ciągu 3 dni (brama wschodnia, 6–18).",
                    remind: ["Sześć garści jęczmienia. Rozkaz to rozkaz."], hero: ["> Sześć garści. Na wojnę."],
                    done: ["Zapisane. Lord zaliczy to na dług twojego dziadka - pięćdziesiąt groszy. Przynajmniej tyle."],
                    reward: { debtCredit: 50, opinion: 0 } },
                { type: "custom", talk: "d14Inspect", dayAfter: 3, text: "Za 3 dni kapral Wit sprawdzi, czy na pewno nie masz jęczmienia (brama wschodnia, 6–18)." }
            ],
            reward: { xp: 50 },
            fail: { opinion: -2, text: "Kapral nie dostał zboża. Straż patrzy na ciebie krzywo." },
            lines: {
                caught: ["Nie masz zboża? A to co w worku? Jęczmień, jak żywy.", "Czterdzieści groszy kary. I straż cię zapamięta."],
                clean: ["Nic? Pusto w worku? No to nic. Masz szczęście, że nie lubię grzebać w cudzych skrzyniach."]
            }
        },
        // =========================================================== D16
        {
            id: "D16", kind: "D", title: "Uczeń dzwonnika", giver: "dzwonnik", icon: 0, where: "dzwonnica", when: "od Opinii 40, 4 dni (6:00, 12:00 albo 18:00)",
            desc: "Ambroży szuka następcy „na wszelki wypadek”. Przez cztery dni dzwonisz z nim o szóstej, w południe albo o osiemnastej - rytmy coraz trudniejsze.",
            offer: {
                cond: { hours: [6.3, 17.7], opinion: 40, day: 7 },
                say: ["Jestem stary. Kiedyś ktoś będzie musiał dzwonić za mnie. Na wszelki wypadek.",
                    "Przyjdź do dzwonu o szóstej, w południe albo o osiemnastej. Cztery dni. Nauczę cię wszystkiego... co wolno."],
                yes: "Będę przychodził.", no: "Nie mam głowy do dzwonów.",
                accept: ["Dzwon nie czeka. Bądź przed pełną godziną."], decline: ["Nikt nie ma. To właśnie jest kłopot."]
            },
            steps: [
                { type: "custom", talk: "bellLesson", days: 4, text: "Dzwoń z Ambrożym przy dzwonnicy o 6:00, 12:00 albo 18:00 (raz dziennie, 4 różne dni). Lekcje: {n}/4." }
            ],
            lines: {
                go: ["Teraz. Licz w myślach i ciągnij równo."], ok: ["Dobrze. Lekcja {n} z czterech."],
                again: ["Jeszcze nie. Następnym razem, przy dzwonie."], done: ["Zwykłe godziny już umiesz. Inne... może kiedyś."],
                wait: ["Dziś już dzwoniłeś. Jutro."]
            },
            reward: { xp: 100, opinion: 5, flag: "bellKey",
                note: ["Uczeń dzwonnika", "Ambroży dał mi klucz do dzwonnicy. „Zwykłe godziny już umiesz. Inne... może kiedyś.”"] }
        },
        // =========================================================== D17
        {
            id: "D17", kind: "D", title: "Petycja do Lorda", giver: "soltys", icon: 0, where: "ratusz + kuźnia + garbarnia + piekarnia + dzwonnica + drzwi dworu", when: "po dniu 20",
            desc: "Dwór chce od każdego domu dziesięć groszy podatku wojennego. Zbierz krzyżyki pod petycją - każdego łap przy robocie - i zanieś ją Lordowi.",
            offer: {
                cond: { hours: [8, 18], day: 20, story: true },
                say: ["Dwór chce od każdego domu dziesięć groszy podatku wojennego. Kuby, Ignaca i połowy miasta na to nie stać.",
                    "Napisałem petycję. Zbierz podpisy - krzyżyki - od ludzi. Każdego łap wtedy, kiedy jest przy robocie. Potem zanieś ją Lordowi."],
                yes: "Zbiorę podpisy.", no: "To się nie uda.",
                accept: ["Tadek, Hanka, Kuba, Ignac, Ambroży... I kto jeszcze zechce. Kapral nie podpisze, nawet nie próbuj."], decline: ["Może i nie. Ale trzeba spróbować."]
            },
            steps: [
                { type: "custom", talk: "d17Sign", signers: ["kowal", "piekarka", "woziwoda", "garbarz", "dzwonnik", "kupiec"], signNeed: 5, vgives: { petycja: 1 },
                    text: "Zbierz krzyżyki pod petycją (co najmniej 5): Tadek, Hanka, Kuba, Ignac, Ambroży, może Baltazar. Podpisy: {n}." },
                { type: "bring", to: "lord", need: [["v:petycja", 1]], hours: [8, 20], text: "Zanieś petycję Lordowi (drzwi dworu, 8–20).",
                    hero: ["> Petycja od miasta, panie. Ludzie nie mają z czego płacić."],
                    done: ["Petycja? (czyta długo) ...Pół. Obniżam o połowę. Tylko dlatego, że to ty przyniosłeś, a nie sołtys.",
                        "I jeszcze jedno. Mój dziadek zbierał bajki o Kruczych Skałach. Gdybyś kiedyś coś znalazł... przyjdź najpierw do mnie. Dla porządku."] },
                { type: "talk", to: "soltys", hours: [8, 18], text: "Wróć do sołtysa z odpowiedzią Lorda.",
                    say: ["> Lord obniżył podatek o połowę.", "O połowę! Chłopcze... Całe miasto będzie o tym gadać. Masz trzydzieści groszy - z kasy ratusza, uczciwie."] }
            ],
            reward: { gold: 30, xp: 100, opinion: 8, flag: "lordRemembers",
                note: ["Petycja do Lorda", "Lord obniżył podatek wojenny o połowę. I dodał: „Gdybyś coś znalazł pod Kruczymi Skałami... przyjdź najpierw do mnie.”"] }
        },

        // =========================================================== W1 (the first chapters; it stops before the big reveal)
        {
            id: "W1", kind: "W", title: "Woda spod Kruczych Skał", giver: null, icon: 138, where: "studnia na rynku, staw za halą, noc", when: "od dnia 3",
            desc: "Skąd Kuba ma tyle wody, skoro studnia na rynku ledwo daje parę wiader na dzień? Czemu ogród Lorda jest zielony? Kto osłabił studnię i młyn?",
            clues: ["w1_barrel", "w1_roses", "w1_night", "w1_watch"], cluesNeed: 3,
            lines: {
                caught: "Ty?! Co tu robisz po nocy?! Idź spać, chłopcze. I nic nie widziałeś!",
                seen: ["> (Kuba podstawia beczkę pod kamienną rurę wystającą ze skały pod wodospadem. Woda leje się gęstym strumieniem. Beczka za beczką.)",
                    "> (Na murze nad wodospadem mignęła latarnia. Ktoś tam stał i patrzył. Zgasła.)", "> Skąd ta rura w skale? I kto trzyma tę latarnię?"],
                note: ["Woda Kuby - noc", "Kuba wychodzi z domu po pierwszej w nocy i idzie do stawu za tawerną. Nabiera wodę z kamiennej rury w skale pod wodospadem, beczka za beczką. Na murze nad wodospadem ktoś stał z latarnią - zgasła, zanim zobaczyłem twarz. Ciąg dalszy wkrótce."]
            },
            steps: [
                { type: "custom", check: "w1Clues", text: "Zbieraj poszlaki o wodzie Kuby ({n}/3): „Pęknięta beczka”, „Smak wody”, „Łój do latarni”, „Nocna warta”." },
                { type: "custom", tick: "w1Follow",
                    text: "Kuba chodzi gdzieś nocą. Wyjdź za nim po cichu (C - skradanie), kiedy po pierwszej w nocy wyjdzie z domu na tarasie rzemieślników. Nie daj się zobaczyć." },
                { type: "pause", text: "Ciąg dalszy wkrótce. (Kto stoi za wodą Kuby - to się dopiero okaże.)" }
            ]
        },
        // =========================================================== W2 (the first chapters)
        {
            id: "W2", kind: "W", title: "Kod dzwonu", giver: null, icon: 0, where: "dzwonnica, rynek", when: "od pierwszego nocnego dzwonu",
            desc: "Ambroży dzwoni o dziwnych godzinach. Liczba uderzeń ma znaczenie - to sygnały, których miasto już nie rozumie.",
            lines: {
                garden: ["> (Za furtką cicho, jakby miasto zostało za murem. Dwa kamienne posągi rycerzy pilnują kopca, między nimi miecz wbity w kamień.)",
                    "> (Na tarczach posągów są nacięcia - krótkie i długie, jak uderzenia dzwonu.)", "> Ambroży mówił: „Tam jest reszta”. Reszta czego?"],
                note: ["Ogród rycerzy", "Furtka za tawerną otwiera się kluczem Ambrożego. W ogrodzie stoją posągi strażników zakonu, między nimi miecz wbity w kamień. Na ich tarczach są nacięcia jak uderzenia dzwonu. Ciąg dalszy wkrótce."]
            },
            steps: [
                { type: "custom", check: "w2Heard", text: "Usłysz dzwon o dziwnej porze (bądź w miasteczku nocą)." },
                { type: "talk", to: "dzwonnik", hours: [6.3, 17.7], text: "Zapytaj Ambrożego o nocne dzwonienie (rynek albo ogród zakonu, za dnia).",
                    say: ["> Słyszałem w nocy dzwon. Trzy uderzenia o trzeciej.", "Nie słyszałeś. Ludzie śpią o trzeciej.", "> Słyszałem.",
                        "...Trzy to nie godzina. Trzy to... Nieważne. Ktoś musi pamiętać, to pamiętam. Zapisuj, jak chcesz. Każde uderzenie."] },
                { type: "custom", check: "w2Apprentice", text: "Zdobądź zaufanie Ambrożego - zostań jego uczniem („Uczeń dzwonnika”, od Opinii 40)." },
                { type: "custom", check: "w2Table", text: "Zapisz trzy różne sygnały dzwonu i to, co się wtedy działo (w dzienniku: Sygnały dzwonu). Sygnały: {n}/3." },
                { type: "talk", to: "dzwonnik", hours: [17.7, 18.3], text: "Pokaż Ambrożemu tabelę sygnałów przy dzwonie (17:45–18:15).",
                    say: ["> Spisałem twoje dzwonienia. Każde przychodzi, kiedy coś się dzieje: warta, deszcz po suszy, piorun. To nie godziny. To słowa.",
                        "(Ambroży długo milczy. Ma mokre oczy.)", "Nikt... od czterdziestu lat nikt nie zapytał. Jestem ostatnim uczniem straży zakonu. Dzwonię, bo nikt nie odwołał warty.",
                        "Masz. Klucz do furtki ogrodu rycerzy. Tam jest reszta. Kiedyś."], fx: "w2Key" },
                { type: "custom", tick: "w2Garden", text: "Otwórz kluczem Ambrożego furtkę ogrodu rycerzy (na lewo od tawerny) i wejdź do środka." },
                { type: "pause", text: "Ciąg dalszy wkrótce: tajemnica posągów i Archiwum zakonu." }
            ]
        }
    ];

    window.TownQuestsData = { OPINION, GREET, MARKET, CALENDAR, SIGNALS, VITEMS, SPOTS, GOSSIP, SIGN, QUESTS };
})();
