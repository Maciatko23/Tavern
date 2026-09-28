//=============================================================================
// QuestBoard.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Tablica zleceń w tawernie „Pod Złotym Kuflem”: prawdziwe zlecenia od ludzi z okolicy (dostawy, wyroby, zbieractwo, polowania, POSZUKIWANY), sława w tawernie, zapłata w złocie i doświadczeniu. v1.0.0
 * @author Claude
 * @orderAfter Journal
 * @orderAfter Farming
 * @orderAfter Hunting
 * @orderAfter Combat
 * @orderAfter Story
 *
 * @param refreshDays
 * @text Nowe kartki co (dni)
 * @desc Co tyle dni na tablicy wiszą nowe ogłoszenia (przyjęte zlecenia zostają).
 * @type number
 * @min 1
 * @default 3
 *
 * @param maxActive
 * @text Najwięcej zleceń naraz
 * @type number
 * @min 1
 * @max 6
 * @default 3
 *
 * @param noticesMin
 * @text Kartek na tablicy (od)
 * @type number
 * @min 2
 * @max 6
 * @default 4
 *
 * @param noticesMax
 * @text Kartek na tablicy (do)
 * @type number
 * @min 2
 * @max 6
 * @default 6
 *
 * @param goldTier0
 * @text Zapłata: Nowy w okolicy (G)
 * @desc Od-do, np. 10-25. Sława 0-19.
 * @default 10-25
 *
 * @param goldTier1
 * @text Zapłata: Znajoma twarz (G)
 * @desc Sława 20-39, od 4. dnia.
 * @default 15-40
 *
 * @param goldTier2
 * @text Zapłata: Swój chłop (G)
 * @desc Sława 40-59, od 10. dnia.
 * @default 30-55
 *
 * @param goldTier3
 * @text Zapłata: Pewna ręka (G)
 * @desc Sława 60-79, od 18. dnia.
 * @default 45-80
 *
 * @param goldTier4
 * @text Zapłata: Chluba tawerny (G)
 * @desc Sława 80-100, od 28. dnia.
 * @default 60-100
 *
 * @param bountyGold
 * @text Zapłata: POSZUKIWANY (G)
 * @desc Nagroda za zwierzę z listu gończego (od-do, rośnie z trudnością).
 * @default 90-120
 *
 * @param goldFactor
 * @text Mnożnik zapłaty (%)
 * @desc 100 = jak wyżej. Mniej = biedniejsza okolica.
 * @type number
 * @min 0
 * @default 100
 *
 * @param xpFactor
 * @text Mnożnik doświadczenia (%)
 * @type number
 * @min 0
 * @default 100
 *
 * @param urgentChance
 * @text Szansa na PILNE (%)
 * @desc Najwyżej jedna pilna kartka na tablicy: krótszy termin, zapłata +25%, więcej sławy.
 * @type number
 * @min 0
 * @max 100
 * @default 18
 *
 * @param repFail
 * @text Sława: niedotrzymany termin
 * @type number
 * @min 0
 * @default 6
 *
 * @param repAbandon
 * @text Sława: porzucone zlecenie
 * @type number
 * @min 0
 * @default 3
 *
 * @command open
 * @text Otwórz tablicę zleceń
 * @desc Pokazuje tablicę (tak jak zdarzenie z komentarzem <Tavern:board> na pierwszej stronie).
 *
 * @command addRep
 * @text Zmień sławę w tawernie
 * @arg amount
 * @text Ile (może być ujemne)
 * @type number
 * @min -100
 * @max 100
 * @default 5
 *
 * @help
 * ============================================================================
 * QuestBoard.js - tablica zleceń w tawernie
 * ============================================================================
 * W sieni tawerny wisi tablica z ogłoszeniami ludzi z okolicy. Zdarzenie
 * z komentarzem <Tavern:board> na pierwszej stronie (albo z tym tagiem w
 * notatce) otwiera ją przyciskiem akcji. Można też poleceniem wtyczki.
 *
 * RODZAJE ZLECEŃ
 *   Dostawa      - przynieś towar (skóry, mięso, ziemniaki, jajka, miód...).
 *   Zamówienie   - wyroby z budynków (deski, cegły, chleb, garnki, ser...).
 *   Zbieractwo   - to, co rośnie i leży (zioła, grzyby, jagody, szyszki...).
 *   Polowanie    - upoluj zwierzęta (czasem na wskazanej mapie).
 *   POSZUKIWANY  - nazwane, groźne zwierzę na swojej mapie (Szary Kieł,
 *                  Czarny Ryj, Trójłap): większe, silniejsze, z imieniem.
 *   Ogłoszenia   - od dworu Lorda (kamerdyner Feliks) i z samej tawerny.
 * Każde ma zleceniodawcę, termin w dniach od przyjęcia i nagrodę: złoto,
 * doświadczenie, sławę, czasem przedmiot albo kość do gry (jeśli jest
 * wtyczka TavernDice).
 *
 * TABLICA: 4-6 kartek, nowe co 3 dni (przyjęte zostają), najwyżej jedna
 * PILNA. Najwyżej 3 zlecenia naraz. Przyjęte dostają pieczątkę PRZYJĘTE,
 * oddajesz je przy tablicy (towar znika z plecaka) - WYKONANE. Termin minął:
 * PO TERMINIE i -6 sławy; porzucenie: -3 sławy.
 *
 * SŁAWA W TAWERNIE (0-100): Nowy w okolicy (0), Znajoma twarz (20, od dnia 4),
 * Swój chłop (40, od dnia 10), Pewna ręka (60, od dnia 18), Chluba tawerny
 * (80, od dnia 28). Wyższa sława = lepiej płatne zlecenia.
 *
 * Sterowanie na tablicy: strzałki / WSAD - wybór kartki, O - otwórz /
 * potwierdź, P - wróć. Myszka też działa.
 *
 * DZIENNIK: zakładka „Zlecenia” (postęp, terminy, historia). OK na zleceniu
 * = śledzenie go w okienku celu na ekranie.
 *
 * Dla innych wtyczek: QuestBoard.open(), active(), accept(id), turnIn(id),
 * abandon(id), reputation(), refresh(seed), onComplete(fn), track(id).
 * Stan w $gameSystem._quests (zwykłe dane, zapisywane z grą).
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "QuestBoard";
    const params = PluginManager.parameters(PLUGIN);
    const num = (v, d) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? d : Number(v));
    const span = (v, d) => { const m = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(String(v || "")); return m ? [Number(m[1]), Number(m[2])] : d; };
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const round5 = v => Math.max(5, Math.round(v / 5) * 5);

    const REFRESH_DAYS = Math.max(1, num(params.refreshDays, 3));
    const MAX_ACTIVE = clamp(num(params.maxActive, 3), 1, 6);
    const NOTICES = [clamp(num(params.noticesMin, 4), 2, 6), clamp(num(params.noticesMax, 6), 2, 6)];
    const GOLD_F = num(params.goldFactor, 100) / 100, XP_F = num(params.xpFactor, 100) / 100;
    const URGENT_CHANCE = num(params.urgentChance, 18) / 100, URGENT_BONUS = 0.25;
    const REP_FAIL = num(params.repFail, 6), REP_ABANDON = num(params.repAbandon, 3);
    const BOUNTY_GOLD = span(params.bountyGold, [90, 120]);
    // the reputation tiers: from `rep` (0-100) and from day `day` on. gold/xp: what a notice of that tier pays; days: its term
    const TIERS = [
        { name: "Nowy w okolicy", rep: 0, day: 1, gold: span(params.goldTier0, [10, 25]), xp: [20, 35], gain: 4, days: [3, 4] },
        { name: "Znajoma twarz", rep: 20, day: 4, gold: span(params.goldTier1, [15, 40]), xp: [35, 55], gain: 5, days: [4, 5] },
        { name: "Swój chłop", rep: 40, day: 10, gold: span(params.goldTier2, [30, 55]), xp: [55, 80], gain: 6, days: [4, 6] },
        { name: "Pewna ręka", rep: 60, day: 18, gold: span(params.goldTier3, [45, 80]), xp: [80, 110], gain: 7, days: [5, 7] },
        { name: "Chluba tawerny", rep: 80, day: 28, gold: span(params.goldTier4, [60, 100]), xp: [110, 150], gain: 8, days: [6, 8] }
    ];
    const BASE = { gather: 4, deliver: 6, craft: 8, hunt: 10, story: 8 };
    // what a piece of an item is worth in effort (the database prices are for Borgar's shop, not for work)
    const EV = { 64: 1.2, 77: 1, 92: 1.2, 147: 0.8, 61: 2.5, 102: 1.2, 103: 2, 104: 1.8, 149: 1, 150: 2, 151: 1.6, 139: 1.2, 140: 1.2, 164: 2.5, 85: 5,
        96: 6, 163: 4, 146: 1.6, 94: 5, 157: 7, 159: 8, 161: 5, 95: 7, 158: 9, 71: 2.5, 72: 2.5, 73: 5, 74: 1.6, 75: 2.5, 76: 7, 123: 5, 111: 10,
        80: 4.5, 84: 3, 79: 3.5, 86: 12, 88: 0.9, 167: 12, 93: 4, 127: 0.8, 152: 5, 97: 12, 83: 6, 81: 8, 137: 18, 124: 16, 105: 12, 130: 14, 136: 14, 82: 3 };
    const KILL_EV = { rabbit: 6, deer: 12, wolf: 12, boar: 22 };

    // ------------------------------------------------------------------
    // The people who pin notices: name, trade, one line about them; pin: nail / brass / red tack / wax seal (0 the tavern's
    // tankard, 1 the manor's Z, 2 the herbalist's leaf); gift: items they sometimes add to the pay
    // ------------------------------------------------------------------
    const GIVERS = {
        borgar: { name: "Borgar Kowal", short: "Borgar", role: "karczmarz", line: "Płaci uczciwie. Jak na karczmarza.", pin: "seal0", gift: [[81, 2], [83, 2]] },
        feliks: { name: "Feliks", short: "Feliks, kamerdyner", role: "kamerdyner dworu Zaleskich", line: "Zapisuje wszystko. Nawet to, czego nie powiedziałeś.", pin: "seal1", gift: [] },
        melia: { name: "Melia Srebrogłosa", short: "Melia", role: "bardka", line: "Ma pieśń na każdą okazję i okazję na każdą pieśń.", pin: "red", gift: [[76, 1]] },
        grum: { name: "Grum Żelazna Pięść", short: "Grum", role: "najemnik", line: "Mówi mało, bije mocno, płaci od ręki.", pin: "nail", gift: [[152, 2], [127, 12]] },
        ozzy: { name: "Dziadek Ozzy", short: "Ozzy", role: "stały bywalec", line: "Pamięta czasy, których nie było.", pin: "nail", gift: [[81, 1]] },
        jagna: { name: "Babka Jagna", short: "Jagna", role: "zielarka", line: "Na każdą dolegliwość ma ziółko, a na resztę - gorsze ziółko.", pin: "seal2", gift: [[152, 2], [110, 2]] },
        tadeusz: { name: "Tadeusz Skórka", short: "T. Skórka", role: "kuśnierz", line: "Od futra się zaczyna i na futrze kończy.", pin: "brass", gift: [[97, 1]] },
        halina: { name: "Halina", short: "Halina", role: "piekarzowa", line: "Rano chleb, wieczorem plotki. Jedno i drugie świeże.", pin: "red", gift: [[83, 2]] },
        bartek: { name: "Bartłomiej", short: "sołtys Bartłomiej", role: "sołtys", line: "Wie wszystko najlepiej, zwłaszcza to, czego nie wie.", pin: "brass", gift: [[69, 3], [70, 4]] },
        wit: { name: "Wit", short: "Wit", role: "garncarz", line: "Lepi garnki, a przy okazji i historie.", pin: "nail", gift: [[167, 1]] },
        zdzich: { name: "Zdzisław", short: "Zdzisław", role: "kowal ze wsi", line: "Ręce jak kowadła, serce jak miech.", pin: "nail", gift: [[88, 10], [86, 1]] },
        bogdan: { name: "Bogdan", short: "Bogdan, łowczy", role: "łowczy", line: "Tropi wszystko, co ma cztery nogi. Trzy też.", pin: "nail", gift: [[127, 12]] },
        marianna: { name: "Wdowa Marianna", short: "Marianna", role: "gospodyni", line: "Liczy każdy grosz. Dwa razy.", pin: "brass", gift: [[75, 4], [67, 3]] },
        kazimierz: { name: "Kazimierz", short: "Kazimierz", role: "cieśla", line: "Mierzy dwa razy, tnie raz, narzeka trzy razy.", pin: "nail", gift: [[88, 6]] },
        jozek: { name: "Mały Józek", short: "Józek", role: "chłopak na posyłki", line: "Biega szybciej niż plotki. Prawie.", pin: "red", gift: [[102, 4], [139, 3]] }
    };

    // the animals, with Polish words for counts
    const BEASTS = {
        rabbit: { one: "zając", few: "zające", many: "zajęcy", sheet: "$Animal_Rabbit", icon: 94 },
        deer: { one: "jeleń", few: "jelenie", many: "jeleni", sheet: "$Animal_Deer", icon: 157 },
        wolf: { one: "wilk", few: "wilki", many: "wilków", sheet: "$Animal_Wolf", icon: 161 },
        boar: { one: "dzik", few: "dziki", many: "dzików", sheet: "$Animal_Boar", icon: 159 }
    };
    const plural = (n, one, few, many) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);
    const dniWord = n => (n === 1 ? "dzień" : "dni");
    // places for the hunts: the name and "where" (Polish locative)
    const PLACES = { 4: ["Łąka", "na łące"], 20: ["Podwórze dziadka", "na podwórzu dziadka"], 21: ["Leśna droga", "na Leśnej drodze"], 22: ["Polna droga", "na Polnej drodze"],
        23: ["Skraj lasu", "na Skraju lasu"], 8: ["Okolice Tawerny", "koło tawerny"] };
    const placeName = id => (PLACES[id] ? PLACES[id][0] : ($dataMapInfos && $dataMapInfos[id] ? String($dataMapInfos[id].name).replace(/#\d+$/, "") : "?"));
    const placeWhere = id => (PLACES[id] ? PLACES[id][1] : "na mapie " + placeName(id));

    // wanted animals: kind, where, how much stronger and bigger, a tint; pack: wolves beside it
    const BOUNTIES = {
        szary_kiel: { name: "Szary Kieł", kind: "wolf", map: 23, hp: 2.4, lv: 3, scale: 1.32, tone: [52, 52, 58, 90], pack: 2, die: "szczesciarz", hint: "nocą" },
        czarny_ryj: { name: "Czarny Ryj", kind: "boar", map: 21, hp: 2.2, lv: 3, scale: 1.3, tone: [-70, -70, -62, 40], pack: 0, die: "wdowa", hint: "o świcie i o zmierzchu" },
        trojlap: { name: "Trójłap", kind: "wolf", map: 22, hp: 1.8, lv: 2, scale: 1.16, tone: [46, 16, -14, 30], pack: 1, die: "grusza", hint: "nocą" }
    };

    // ------------------------------------------------------------------
    // The notices. req: { item, n } (n: [min, max] for each tier 0-4, null = not at that tier), { kill, n, maps } (maps: one is
    // picked; none = anywhere), { bounty }. from: the first day; seasons: 0 spring .. 3 winter; once: a one-off story notice.
    // {place}: the hunt's place ("na Leśnej drodze"); {Place}: its name
    // ------------------------------------------------------------------
    const T = (a, b) => [a, b];
    const TEMPLATES = [
        // ---- Borgar
        { id: "rabbit_meat", type: "deliver", giver: "borgar", title: ["Zając w potrawce", "Potrawka sama się nie zrobi"],
            text: ["Goście pytają o potrawkę z zająca. Ja pytam o zające. Przynieś świeże mięso, a potrawka zrobi się sama. Prawie sama.",
                "Kucharka grozi, że odejdzie, jak znowu podam kapuśniak. Przynieś zajęczyny i ratuj moją kuchnię."],
            req: [{ item: 94, n: [T(2, 2), T(2, 3), null, null, null] }] },
        { id: "firewood", type: "gather", giver: "borgar", title: ["Drewno do kominka", "Opał na zimne wieczory"],
            text: ["Kominek w sali zjada więcej niż Grum. Przynieś drewna - suchego, bo mokre dymi, a dym wygania gości.",
                "Kiedy w sali zimno, goście piją mniej. Kiedy piją mniej, ja płaczę. Przynieś drewna."],
            req: [{ item: 61, n: [T(4, 6), T(8, 10), null, null, null] }] },
        { id: "potatoes", type: "deliver", giver: "borgar", seasons: [0, 1, 2], from: 3, title: ["Worek ziemniaków", "Ziemniaki, dużo ziemniaków"],
            text: ["Kuchnia bez ziemniaków to jak karczma bez piwa - da się, ale po co? Przynieś ziemniaki, byle nie zielone.",
                "Grum zjadł wczoraj cały zapas ziemniaków. Na surowo. Nie pytaj. Przynieś nowe."],
            req: [{ item: 71, n: [T(3, 4), T(5, 6), T(8, 10), null, null] }] },
        { id: "mushrooms", type: "gather", giver: "borgar", seasons: [0, 1, 2], title: ["Grzyby na zupę"],
            text: ["Po deszczu grzyby wyłażą jak goście po wypłacie. Zbierz jadalne. Które są jadalne? Te, po których Ozzy jeszcze śpiewa."],
            req: [{ item: 103, n: [T(3, 4), T(5, 6), null, null, null] }] },
        { id: "barley", type: "deliver", giver: "borgar", seasons: [1, 2], from: 35, title: ["Jęczmień do warzenia"],
            text: ["Piwo nie warzy się od patrzenia. Kupię jęczmień - suchy i czysty, bez myszy w worku. Myszy kupuję osobno. Żartuję."],
            req: [{ item: 74, n: [null, null, T(8, 10), T(12, 14), null] }] },
        { id: "bread", type: "craft", giver: "borgar", from: 38, title: ["Chleb na śniadania"],
            text: ["Goście chcą chleba do jajecznicy. Piekarz chce urlopu. Ty chcesz złota. Wszyscy będą zadowoleni."],
            req: [{ item: 83, n: [null, null, null, T(4, 6), T(8, 10)] }] },
        { id: "boar_meat", type: "deliver", giver: "borgar", title: ["Pieczeń na odpust"],
            text: ["Na odpust musi być dzik. Bez dzika to nie odpust, tylko zebranie. Przynieś mięso dzika, resztę załatwi rożen."],
            req: [{ item: 159, n: [null, null, T(2, 3), T(3, 4), null] }] },
        { id: "s_cellar", type: "story", giver: "borgar", once: true, from: 12, noUrgent: true, title: ["Deski do piwnicy"],
            text: ["Od kilku nocy w starej piwnicy coś stuka. Pewnie szczury. Albo beczka turla się sama. Potrzebuję desek i gwoździ - zabiję ten kąt porządnie i będzie spokój. I nie pytaj."],
            req: [{ item: 80, n: [null, null, T(6, 6), T(6, 6), T(6, 6)] }, { item: 88, n: [null, null, T(10, 10), T(10, 10), T(10, 10)] }],
            note: ["Borgar i piwnica", "Borgar zamówił deski i gwoździe, żeby „porządnie zabić jeden kąt” w starej piwnicy. Od kilku nocy coś tam stuka - on mówi, że szczury. Nie wyglądał, jakby sam w to wierzył."] },
        // ---- Feliks, the manor
        { id: "lord_planks", type: "craft", giver: "feliks", title: ["Dworowi potrzeba desek", "Zamówienie dworu: deski"],
            text: ["Dwór Jaśnie Pana Zaleskiego pilnie zamawia deski na naprawę stajni. Zapłata według cennika dworu i dobrego humoru Jaśnie Pana."],
            req: [{ item: 80, n: [null, null, T(16, 20), T(20, 20), T(24, 26)] }] },
        { id: "lord_bricks", type: "craft", giver: "feliks", title: ["Cegły na oranżerię"],
            text: ["Jaśnie pan zapragnął oranżerii. Proszę nie pytać, co to jest - Jaśnie pan też nie wie. Dwór potrzebuje cegieł. Dużo cegieł."],
            req: [{ item: 84, n: [null, null, null, T(16, 20), T(24, 28)] }] },
        { id: "venison", type: "deliver", giver: "feliks", title: ["Dziczyzna na dworski stół"],
            text: ["Jaśnie pan wydaje kolację dla gości z miasta i życzy sobie dziczyzny. Świeżej. Goście z miasta poznają różnicę. Tak przynajmniej twierdzą."],
            req: [{ item: 157, n: [null, null, T(2, 3), T(3, 4), null] }] },
        { id: "quills", type: "deliver", giver: "feliks", title: ["Pióra do ksiąg dworu"],
            text: ["Jaśnie pan dyktuje szybciej, niż rosną gęsi. Dwór zamawia pióra do pisania. Uprasza się nie przynosić ich razem z ptakiem."],
            req: [{ item: 146, n: [null, T(4, 5), T(6, 8), null, null] }] },
        { id: "mead", type: "craft", giver: "feliks", title: ["Miód pitny na imieniny"],
            text: ["Imieniny Jaśnie Pana to święto całej okolicy. Tak przynajmniej twierdzi Jaśnie Pan. Dwór zamawia miód pitny - najlepszy, jaki się uda."],
            req: [{ item: 137, n: [null, null, null, T(2, 2), T(3, 4)] }] },
        { id: "cheese", type: "craft", giver: "feliks", title: ["Ser na dworski stół"],
            text: ["Goście Jaśnie Pana nie jedzą sera z miasta, bo „śmierdzi miastem”. Ser ze wsi śmierdzi wsią i o to właśnie chodzi."],
            req: [{ item: 124, n: [null, null, null, T(2, 3), T(4, 5)] }] },
        { id: "lord_deer", type: "hunt", giver: "feliks", title: ["Polowanie dla Jaśnie Pana"],
            text: ["Jaśnie pan chce pochwalić się przed gośćmi jeleniem. Upolować go osobiście nie zdąży - ma dużo pracy z chwaleniem się."],
            req: [{ kill: "deer", n: [null, null, null, T(1, 1), T(2, 2)] }, { item: 157, n: [null, null, null, T(2, 3), T(3, 4)] }] },
        // ---- Melia
        { id: "honey", type: "deliver", giver: "melia", title: ["Miód na zdarte gardło"],
            text: ["Po wczorajszym koncercie mój głos brzmi jak skrzypiące drzwi. Łyżka miodu i znów będę słowikiem. Albo chociaż wróblem."],
            req: [{ item: 76, n: [null, T(2, 2), T(3, 3), T(4, 5), null] }] },
        { id: "feathers", type: "deliver", giver: "melia", title: ["Pióra do kapelusza"],
            text: ["Kapelusz bez pióra to jak pieśń bez refrenu. Potrzebuję piór - im barwniejsze, tym lepiej. Wróble też się liczą."],
            req: [{ item: 146, n: [null, T(3, 4), T(5, 6), null, null] }] },
        { id: "apples", type: "gather", giver: "melia", seasons: [1, 2], title: ["Jabłka dla muzy"],
            text: ["Moja muza lubi dzikie jabłka. Nie pytaj. Kwaśne, prosto z drzewa - wtedy rymy same się układają."],
            req: [{ item: 139, n: [T(4, 5), T(6, 8), null, null, null] }] },
        // ---- Grum
        { id: "provisions", type: "deliver", giver: "grum", title: ["Prowiant na drogę"],
            text: ["Idę w góry na wschodzie. Nie pytaj po co. Potrzebuję pieczonego mięsa na drogę - tyle, żeby starczyło, i jeszcze trochę."],
            req: [{ item: 95, n: [null, T(2, 3), T(3, 4), null, null] }] },
        { id: "smoked", type: "craft", giver: "grum", title: ["Wędzonka na wyprawę"],
            text: ["Góry na wschodzie nie mają karczm. Sprawdzałem. Potrzebuję wędzonego mięsa, które przetrwa tydzień w plecaku. I mnie."],
            req: [{ item: 105, n: [null, null, null, T(3, 4), T(5, 6)] }] },
        { id: "hunt_mix", type: "hunt", giver: "grum", title: ["Trening dla najemnika"],
            text: ["Moi chłopcy mówią, że się starzeję. Pokaż im, jak się poluje: wilki i dzik. Zapłacę jak za dziesięciu."],
            req: [{ kill: "wolf", n: [null, null, null, T(2, 2), T(3, 3)] }, { kill: "boar", n: [null, null, null, T(1, 1), T(1, 1)] }] },
        { id: "b_szary_kiel", type: "bounty", giver: "grum", title: ["Szary Kieł"],
            text: ["Wielki szary wilk z blizną na pysku. Prowadzi watahę na Skraju lasu. Zagryzł już trzy owce, dwa psy i moją ulubioną czapkę. Poluje nocą."],
            req: [{ bounty: "szary_kiel", n: [null, null, null, T(1, 1), T(1, 1)] }] },
        // ---- Ozzy
        { id: "berries", type: "gather", giver: "ozzy", seasons: [0, 1, 2], title: ["Jagody na nalewkę"],
            text: ["Stara receptura mojej babki: jagody, cukier i cierpliwość. Cukier mam, cierpliwości nie. Przynieś jagody. *czkawka*"],
            req: [{ item: 102, n: [T(5, 6), T(8, 10), null, null, null] }] },
        { id: "beer", type: "craft", giver: "ozzy", from: 38, title: ["Piwo dla Ozzy'ego"],
            text: ["Borgar mówi, że mam za duży rachunek. Ja mówię, że mam za małe piwo. Przynieś parę kufli. Zapłacę. Chyba."],
            req: [{ item: 81, n: [null, null, null, T(3, 4), T(5, 6)] }] },
        { id: "s_ozzy", type: "story", giver: "ozzy", once: true, from: 8, seasons: [0, 1, 2], noUrgent: true, title: ["Grzyby za opowieść"],
            text: ["Przynieś mi miskę grzybów, to opowiem ci, co mruczy pod podłogą tawerny. Tylko nie mów Borgarowi. On nie lubi, jak o tym gadam."],
            req: [{ item: 103, n: [null, T(4, 4), T(4, 4), T(4, 4), T(4, 4)] }],
            note: ["Bełkot Ozzy'ego", "Ozzy za miskę grzybów opowiedział mi, że „pod tawerną jest więcej piwnicy niż tawerny” i że „kamienie tam na dole pamiętają”. Potem zasnął z łyżką w ręku. Borgar udawał, że nic nie słyszał."] },
        // ---- Jagna, the herbalist
        { id: "herbs", type: "gather", giver: "jagna", seasons: [0, 1], title: ["Zioła na napar"],
            text: ["Mój napar leczy wszystko: katar, smutek i łysienie. To ostatnie jeszcze sprawdzam. Potrzebuję świeżych ziół."],
            req: [{ item: 104, n: [T(3, 4), T(5, 6), null, null, null] }] },
        { id: "yarrow", type: "gather", giver: "jagna", seasons: [1, 2], title: ["Krwawnik na rany"],
            text: ["Krwawnik tamuje krew i kłótnie małżeńskie. To drugie nie zawsze. Przynieś trochę, zanim ktoś znowu ugryzie dzika."],
            req: [{ item: 150, n: [null, T(3, 4), T(5, 6), null, null] }] },
        { id: "nettle", type: "gather", giver: "jagna", seasons: [0, 1, 2], title: ["Pokrzywa na zupę"],
            text: ["Zupa pokrzywowa - najtańsza zupa świata, jeśli nie liczyć poparzonych rąk. Twoich rąk. Przynieś pokrzywy."],
            req: [{ item: 149, n: [T(4, 6), T(6, 8), null, null, null] }] },
        { id: "garlic", type: "gather", giver: "jagna", seasons: [0, 1], title: ["Czosnek na wampiry"],
            text: ["Wampirów tu nie ma. Dzięki czosnkowi. Potrzebuję świeżego zapasu, bo stary już nikogo nie straszy."],
            req: [{ item: 151, n: [T(3, 4), T(5, 6), null, null, null] }] },
        { id: "bandages", type: "craft", giver: "jagna", seasons: [1], title: ["Opatrunki dla łowców"],
            text: ["Dzik ugryzł Maćka. Maciek ugryzł dzika. Obaj potrzebują opatrunku, ale tylko jeden płaci. Zrób kilka na zapas."],
            req: [{ item: 152, n: [null, T(2, 2), T(3, 4), null, null] }] },
        // ---- Tadeusz, the furrier
        { id: "hides", type: "deliver", giver: "tadeusz", title: ["Skóry na kożuchy", "Skóra za skórę"],
            text: ["Zima przyjdzie jak co roku - niespodziewanie. Kupię surowe skóry, byle bez dziur po strzałach. No, najwyżej z jedną."],
            req: [{ item: 96, n: [T(2, 2), T(3, 3), T(4, 5), null, null] }] },
        { id: "wolf_pelts", type: "hunt", giver: "tadeusz", title: ["Wilcze futra", "Skóry wilka dla sołtysowej"],
            text: ["Sołtysowa chce futro z wilka, bo sąsiadka ma z lisa. Upoluj wilki i przynieś ich skóry. Wiem, że skóra to skóra, ale ja rozpoznam!"],
            req: [{ kill: "wolf", n: [null, null, T(2, 3), T(3, 4), T(4, 5)] }, { item: 96, same: 0 }] },
        { id: "tanned", type: "craft", giver: "tadeusz", title: ["Wyprawione skóry na buty"],
            text: ["Szewc zamawia skóry u mnie, ja u ciebie. Taki łańcuszek szczęścia, tylko z pieniędzmi. Przynieś skóry wyprawione."],
            req: [{ item: 97, n: [null, null, T(2, 3), T(3, 4), null] }] },
        // ---- Halina, the baker's wife
        { id: "eggs", type: "deliver", giver: "halina", from: 10, title: ["Jajka na niedzielne ciasto"],
            text: ["Ciasto bez jajek to podpłomyk. A podpłomyk to smutek. Przynieś jajka, najlepiej całe."],
            req: [{ item: 75, n: [null, null, T(6, 8), T(10, 12), null] }] },
        { id: "flour", type: "craft", giver: "halina", from: 36, title: ["Mąka na chleb"],
            text: ["Młyn stanął, bo młynarz się zakochał. Potrzebuję mąki, zanim cała wieś przejdzie na podpłomyki."],
            req: [{ item: 82, n: [null, null, null, T(6, 8), null] }] },
        { id: "pie", type: "craft", giver: "halina", from: 38, title: ["Placek na wesele"],
            text: ["Wesele u młynarzów! Pan młody zjadł już pół placka na próbę. Potrzebuję nowych, zanim zje resztę."],
            req: [{ item: 136, n: [null, null, null, null, T(3, 4)] }] },
        // ---- Bartłomiej, the village head
        { id: "stones", type: "gather", giver: "bartek", title: ["Kamienie na drogę"],
            text: ["Droga do młyna ma więcej dziur niż sito. Przynieś kamienie, a wieś ci podziękuje. Ja też, ale ciszej."],
            req: [{ item: 64, n: [T(8, 10), T(12, 15), null, null, null] }] },
        { id: "rope", type: "craft", giver: "bartek", title: ["Lina do studni"],
            text: ["Wiadro w studni urwało się razem z liną. Wiadro wyłowimy, linę trzeba nową. A najlepiej dwie, na zapas."],
            req: [{ item: 93, n: [T(2, 2), T(3, 4), null, null, null] }] },
        { id: "bricks", type: "craft", giver: "bartek", title: ["Cegły na nowy komin"],
            text: ["Komin w szkółce wali się od zeszłej zimy. Dzieci mówią, że to duch. Ja mówię, że to cegły. Przynieś nowe."],
            req: [{ item: 84, n: [null, T(6, 8), T(10, 12), T(14, 16), null] }] },
        { id: "wolves", type: "hunt", giver: "bartek", title: ["Wilki pod wsią"],
            text: ["Wilki podchodzą pod obejścia i straszą owce. Owce straszą mnie. Ktoś musi z tym skończyć, zanim przestraszę się sam."],
            req: [{ kill: "wolf", n: [null, T(2, 2), T(2, 3), T(3, 4), null] }] },
        { id: "stew", type: "craft", giver: "bartek", title: ["Gulasz dla drwali"],
            text: ["Drwale pracują za dwóch i jedzą za trzech. Przynieś gulasz, zanim zjedzą mnie."],
            req: [{ item: 130, n: [null, null, null, T(3, 4), T(5, 6)] }] },
        // ---- Wit, the potter
        { id: "clay", type: "gather", giver: "wit", seasons: [0, 1, 2], title: ["Glina z kałuży"],
            text: ["Po deszczu w kałużach jest najlepsza glina. Ja mam reumatyzm, ty masz łopatę. Przynieś mokrą glinę."],
            req: [{ item: 164, n: [T(2, 3), T(4, 5), null, null, null] }] },
        { id: "pots", type: "craft", giver: "wit", title: ["Garnki na jarmark"],
            text: ["Jarmark za pasem, a ja mam dwa garnki, z czego jeden to kapelusz. Przynieś wypalone gliniane garnki."],
            req: [{ item: 167, n: [null, T(1, 2), T(2, 3), T(3, 4), null] }] },
        // ---- Zdzisław, the smith
        { id: "charcoal", type: "craft", giver: "zdzich", title: ["Węgiel do kuźni"],
            text: ["Mój węglarz uciekł z córką młynarza. Węgiel przynieś ty - córki młynarza nie trzeba."],
            req: [{ item: 79, n: [null, T(4, 6), T(8, 9), null, null] }] },
        { id: "ore", type: "gather", giver: "zdzich", title: ["Ruda żelaza"],
            text: ["Kowal bez rudy jest jak bard bez głosu. Czyli jak Melia rano. Przynieś rudę żelaza."],
            req: [{ item: 85, n: [null, null, T(4, 6), T(6, 8), null] }] },
        { id: "iron", type: "craft", giver: "zdzich", title: ["Żelazo na podkowy"],
            text: ["Wszystkie konie we wsi zgubiły podkowy tego samego dnia. Przypadek? Tak, przypadek. Potrzebuję żelaza."],
            req: [{ item: 86, n: [null, null, null, T(3, 4), T(5, 6)] }] },
        // ---- Bogdan, the huntsman
        { id: "sinew", type: "deliver", giver: "bogdan", title: ["Ścięgna na cięciwy"],
            text: ["Moje cięciwy pękają częściej niż obietnice sołtysa. Potrzebuję ścięgien - suchych, mocnych, niegryzionych."],
            req: [{ item: 163, n: [null, T(3, 4), T(5, 6), null, null] }] },
        { id: "arrows", type: "craft", giver: "bogdan", title: ["Strzały dla łowczego"],
            text: ["Połowa moich strzał wisi na drzewach, druga połowa leci w nieznanym kierunku. Przydadzą się nowe."],
            req: [{ item: 127, n: [null, T(12, 12), T(18, 24), null, null] }] },
        { id: "wolf_meat", type: "deliver", giver: "bogdan", title: ["Mięso dla psów gończych"],
            text: ["Moje psy nie jedzą byle czego. Jedzą wszystko. Ale wilczyna smakuje im najbardziej - to chyba osobiste."],
            req: [{ item: 161, n: [null, null, T(3, 4), null, null] }] },
        { id: "wolves_map", type: "hunt", giver: "bogdan", title: ["Wataha: {Place}"],
            text: ["Nocą {place} grasuje wataha. Kupcy nie chcą jechać, a ja nie chcę słuchać kupców. Przerzedź ją."],
            req: [{ kill: "wolf", maps: [21, 22, 23, 4], n: [null, null, T(2, 3), T(3, 3), T(4, 4)] }] },
        { id: "deer", type: "hunt", giver: "bogdan", title: ["Jelenie w zbożu"],
            text: ["Jelenie wyjadają zboże, a potem patrzą na mnie z wyższością. Przerzedź stado, zanim zjedzą i mnie."],
            req: [{ kill: "deer", n: [null, T(1, 1), T(2, 2), null, null] }] },
        { id: "b_trojlap", type: "bounty", giver: "bogdan", title: ["Trójłap"],
            text: ["Kulawy wilk na trzech łapach, a ucieka szybciej niż ja na czterech. Kradnie kury na Polnej drodze. Poluje nocą, z kompanem."],
            req: [{ bounty: "trojlap", n: [null, null, T(1, 1), T(1, 1), null] }] },
        // ---- Marianna, the widow
        { id: "rabbits", type: "hunt", giver: "marianna", title: ["Zające w kapuście"],
            text: ["Zające zjadają mi kapustę, marchew i cierpliwość. Przegoń je na zawsze. Najlepiej do garnka."],
            req: [{ kill: "rabbit", n: [T(2, 2), T(3, 3), null, null, null] }] },
        { id: "boar", type: "hunt", giver: "marianna", title: ["Dzik w ogrodach"],
            text: ["Dzik zrył mi grządki, płot i dobry humor. Zrób coś z nim, zanim zryje mi dom."],
            req: [{ kill: "boar", n: [null, null, T(1, 1), T(2, 2), null] }] },
        { id: "milk", type: "deliver", giver: "marianna", from: 14, title: ["Mleko dla kociąt"],
            text: ["Kotka sołtysa okociła się pod moim piecem. Sołtys udaje, że to nie jego kot. Kocięta nie udają - są głodne."],
            req: [{ item: 123, n: [null, null, T(3, 4), T(4, 6), null] }] },
        { id: "flax", type: "gather", giver: "marianna", seasons: [0, 1, 2], title: ["Len dla prządki"],
            text: ["Kołowrotek stoi, a zima idzie. Przynieś len, uprzędę z niego nić, a z nici... zobaczymy."],
            req: [{ item: 92, n: [T(6, 8), T(10, 12), null, null, null] }] },
        { id: "wool", type: "deliver", giver: "marianna", from: 20, title: ["Wełna na skarpety"],
            text: ["Dziergam skarpety dla całej wsi. Wieś ma sto nóg, a ja jeden motek wełny. Przynieś wełnę."],
            req: [{ item: 111, n: [null, null, null, T(3, 4), T(5, 6)] }] },
        { id: "cabbage", type: "deliver", giver: "marianna", seasons: [2, 3], from: 60, title: ["Kapusta do kiszenia"],
            text: ["Beczka czeka, sąsiadki patrzą. Kiszona kapusta sama się nie zakisi. Potrzebuję główek twardych jak głowa sołtysa."],
            req: [{ item: 73, n: [null, T(3, 4), T(5, 6), T(6, 8), null] }] },
        { id: "b_czarny_ryj", type: "bounty", giver: "marianna", title: ["Czarny Ryj"],
            text: ["Czarny jak smoła, ciężki jak wóz z sianem. Rozwalił trzy płoty i jeden most. Ryje na Leśnej drodze o świcie i o zmierzchu."],
            req: [{ bounty: "czarny_ryj", n: [null, null, null, T(1, 1), T(1, 1)] }] },
        // ---- Kazimierz, the carpenter
        { id: "planks", type: "craft", giver: "kazimierz", title: ["Deski na nowy płot"],
            text: ["Stary płot przewróciła krowa. Nowy też przewróci, ale przynajmniej będzie nowy. Potrzebuję desek."],
            req: [{ item: 80, n: [T(4, 5), T(6, 8), T(10, 12), null, null] }] },
        { id: "nails", type: "craft", giver: "kazimierz", title: ["Gwoździe na dach"],
            text: ["Dach stodoły trzyma się na słowo honoru. Honoru mam dużo, gwoździ mało."],
            req: [{ item: 88, n: [null, null, T(10, 20), T(20, 30), null] }] },
        { id: "shed_wood", type: "gather", giver: "kazimierz", title: ["Drewno na nową szopę"],
            text: ["Stawiam szopę. Szopa stawia opór. Przynieś drewna, zanim podda się któreś z nas."],
            req: [{ item: 61, n: [null, T(8, 10), T(12, 15), null, null] }] },
        // ---- Józek
        { id: "carrots", type: "deliver", giver: "jozek", seasons: [0, 1, 2], title: ["Marchew dla kucyka"],
            text: ["Kucyk sołtysa nie ruszy bez marchwi. Sołtys też nie. Przynieś marchew, to może obaj ruszą."],
            req: [{ item: 72, n: [T(2, 3), T(4, 5), null, null, null] }] },
        { id: "branches", type: "gather", giver: "jozek", title: ["Chrust na ognisko"],
            text: ["Robimy z chłopakami wielkie ognisko. Mama mówi, że nie wolno. Dlatego chrust musi być szybko, zanim się dowie."],
            req: [{ item: 77, n: [T(8, 10), T(12, 14), null, null, null] }] },
        { id: "cones", type: "gather", giver: "jozek", title: ["Szyszki na wojnę"],
            text: ["Chłopaki z drugiego końca wsi wypowiedzieli nam wojnę na szyszki. Potrzebuję amunicji. Dużo amunicji."],
            req: [{ item: 147, n: [T(5, 6), T(8, 10), null, null, null] }] }
    ];
    const TEMPLATE = id => TEMPLATES.find(t => t.id === id) || null;
    const TYPE_LABEL = { deliver: "DOSTAWA", craft: "ZAMÓWIENIE", gather: "ZBIERACTWO", hunt: "POLOWANIE", bounty: "POSZUKIWANY", story: "OGŁOSZENIE" };

    // ------------------------------------------------------------------
    // Seeded randomness
    // ------------------------------------------------------------------
    function mulberry32(a) {
        return function() {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    const hashInts = (...xs) => xs.reduce((h, x) => Math.imul(h ^ ((x >>> 0) & 0xffffffff), 16777619) >>> 0, 2166136261);
    function Rng(seed) {
        const f = mulberry32(seed >>> 0);
        return { f, int: (a, b) => a + Math.floor(f() * (b - a + 1)), pick: arr => arr[Math.floor(f() * arr.length)], chance: p => f() < p };
    }

    // ------------------------------------------------------------------
    // State: $gameSystem._quests (plain data, saved with the game)
    //   board: the notices on the board (state open / active / done / failed); history: finished ones (newest first)
    // ------------------------------------------------------------------
    function newState() {
        return { v: 1, rep: 0, cycle: -1, seed: (Math.random() * 4294967296) >>> 0, board: [], history: [], stats: { done: 0, failed: 0, abandoned: 0, gold: 0, xp: 0 },
            track: null, tutorial: false, once: {}, nextId: 1, seen: -1 };
    }
    const hasState = () => !!(window.$gameSystem && $gameSystem._quests);
    function data() {
        if (!$gameSystem._quests) $gameSystem._quests = newState();
        const d = $gameSystem._quests;
        if (!d.board) d.board = [];
        if (!d.history) d.history = [];
        if (!d.stats) d.stats = { done: 0, failed: 0, abandoned: 0, gold: 0, xp: 0 };
        if (!d.once) d.once = {};
        return d;
    }
    const today = () => ($gameSystem && $gameSystem.dayNightDay ? $gameSystem.dayNightDay() : 1);
    const seasonOf = day => (window.Farming && Farming.seasonIndex ? Farming.seasonIndex(day) : 0);
    const find = id => (hasState() ? data().board.find(n => n.id === id) || null : null);
    const activeList = () => (hasState() ? data().board.filter(n => n.state === "active") : []);
    const repTier = rep => TIERS.reduce((t, T, i) => (rep >= T.rep ? i : t), 0);
    const dayTier = day => TIERS.reduce((t, T, i) => (day >= T.day ? i : t), 0);
    const tierNow = () => Math.min(repTier(data().rep), dayTier(today()));
    const item = id => $dataItems[id] || null;
    const itemName = id => (item(id) ? item(id).name : "?");
    const iconOf = id => (item(id) ? item(id).iconIndex : 0);

    // ------------------------------------------------------------------
    // Making notices
    // ------------------------------------------------------------------
    function tplTiers(tpl) {
        const q = tpl.req.find(r => r.n);
        return q ? q.n.map((v, i) => (v ? i : -1)).filter(i => i >= 0) : [];
    }
    function feasible(tpl, tier, ctx) {
        if (!tplTiers(tpl).includes(tier)) return false;
        if (tpl.from && ctx.day < tpl.from) return false;
        if (tpl.seasons && !tpl.seasons.includes(seasonOf(ctx.day))) return false;
        if (tpl.once && ctx.once[tpl.id]) return false;
        if (ctx.exclude && ctx.exclude.includes(tpl.id)) return false;
        const hunts = tpl.req.some(r => r.kill || r.bounty);
        if (hunts && !window.Hunting) return false;
        for (const r of tpl.req) if (r.item && !item(r.item)) return false;
        return true;
    }
    // one notice of template `tpl` at `tier`
    function makeNotice(tpl, tier, R, ctx) {
        const req = [];
        let map = 0;
        for (const r of tpl.req) {
            if (r.item) {
                const n = r.same !== undefined ? req[r.same].n : R.int(r.n[tier][0], r.n[tier][1]);
                req.push({ k: "item", id: r.item, n });
            } else if (r.kill) {
                const n = R.int(r.n[tier][0], r.n[tier][1]);
                if (r.maps) map = R.pick(r.maps);
                req.push({ k: "kill", kind: r.kill, n, map: r.maps ? map : 0, got: 0 });
            } else if (r.bounty) {
                const B = BOUNTIES[r.bounty];
                req.push({ k: "bounty", key: r.bounty, kind: B.kind, n: 1, map: B.map, got: 0 });
            }
        }
        const G = GIVERS[tpl.giver], TI = TIERS[tier], bounty = tpl.type === "bounty";
        const urgent = !bounty && !tpl.noUrgent && ctx.urgentLeft > 0 && R.chance(URGENT_CHANCE);
        if (urgent) ctx.urgentLeft--;
        let gold;
        if (bounty) gold = round5(BOUNTY_GOLD[0] + (BOUNTY_GOLD[1] - BOUNTY_GOLD[0]) * clamp((tier - 2) / 2, 0, 1) * (0.85 + R.f() * 0.15));
        else {
            const value = req.reduce((t, q) => t + (q.k === "item" ? (EV[q.id] || 3) * q.n : q.k === "kill" ? (KILL_EV[q.kind] || 10) * q.n : 0), 0);
            gold = clamp(round5((value * (1 + 0.1 * tier) * (0.92 + R.f() * 0.16) + BASE[tpl.type]) * (tpl.pay || 1)), TI.gold[0], TI.gold[1]);
        }
        if (urgent) gold = round5(gold * (1 + URGENT_BONUS));
        gold = Math.max(5, Math.round(gold * GOLD_F));
        const band = TI.gold[1] > TI.gold[0] ? clamp((gold / Math.max(0.01, GOLD_F) - TI.gold[0]) / (TI.gold[1] - TI.gold[0]), 0, 1) : 0.5;
        const xp = Math.round((bounty ? 200 + 20 * (tier - 2) : TI.xp[0] + (TI.xp[1] - TI.xp[0]) * band) * XP_F / 5) * 5;
        const rep = TI.gain + (urgent ? 2 : 0) + (bounty ? 4 : 0);
        const days = bounty ? 7 : urgent ? R.int(2, 3) : R.int(TI.days[0], TI.days[1]);
        let gift = null;
        if (tier >= 1 && G.gift && G.gift.length && R.chance(0.35)) gift = R.pick(G.gift).slice();
        if (gift && !item(gift[0])) gift = null;
        const dieKey = bounty ? BOUNTIES[req[0].key].die : tier >= 4 && R.chance(0.15) ? "krucze" : null;   // (TavernDice.js special dice)
        const fill = s => s.replace(/\{place\}/g, map ? placeWhere(map) : "w okolicy").replace(/\{Place\}/g, map ? placeName(map) : "okolica");
        const pin = G.pin === "nail" ? R.pick(["nail", "nail", "brass", "red"]) : G.pin;
        return {
            id: "q" + ctx.nextId++, tpl: tpl.id, type: tpl.type, giver: tpl.giver, title: fill(R.pick(tpl.title)), text: fill(R.pick(tpl.text)),
            req, days, urgent, tier, gold, xp, rep, gift, die: dieKey, posted: ctx.day, state: "open",
            look: { shade: bounty ? 3 : R.int(0, 3), w: bounty ? R.int(216, 224) : R.int(190, 212), rot: (R.f() - 0.5) * 7, pin, torn: 0, dx: R.int(-12, 12), dy: R.int(-8, 8),
                seed: R.int(1, 2147483646), crease: R.chance(0.3), slot: -1, stampRot: -6 - R.f() * 10 }
        };
    }
    // a whole set of notices; ctx: { day, rep (or tier), count, once, exclude, nextId, urgentLeft }
    function generate(seed, ctx) {
        const R = Rng(seed);
        const top = ctx.tier !== undefined ? ctx.tier : Math.min(repTier(ctx.rep || 0), dayTier(ctx.day || 1));
        const c = Object.assign({ once: {}, exclude: [], nextId: 1, urgentLeft: 1 }, ctx, { day: ctx.day || 1 });
        const out = [], usedGiver = {};
        let bounties = (ctx.bounties || 0);
        const count = ctx.count || R.int(NOTICES[0], NOTICES[1]);
        for (let i = 0; i < count; i++) {
            const cands = [];
            for (const tpl of TEMPLATES) {
                if (out.some(n => n.tpl === tpl.id)) continue;
                if (tpl.type === "bounty" && bounties >= 1) continue;
                for (let t = Math.max(0, top - 2); t <= top; t++) {
                    if (!feasible(tpl, t, c)) continue;
                    let w = t === top ? 1 : t === top - 1 ? 0.6 : 0.2;
                    if (i === 0 && t !== top) w *= 0.15;   // the first one is at the top tier when there is one
                    if (usedGiver[tpl.giver]) w *= 0.25;
                    if (tpl.type === "bounty") w *= 0.9;
                    if (tpl.once) w *= 1.4;
                    cands.push({ tpl, t, w });
                }
            }
            if (!cands.length) break;
            let roll = R.f() * cands.reduce((s, x) => s + x.w, 0), pick = cands[cands.length - 1];
            for (const x of cands) { roll -= x.w; if (roll <= 0) { pick = x; break; } }
            const n = makeNotice(pick.tpl, pick.t, R, c);
            if (n.type === "bounty") bounties++;
            usedGiver[pick.tpl.giver] = true;
            out.push(n);
        }
        // one card has a torn corner (not a wanted poster)
        const tornable = out.filter(n => n.type !== "bounty");
        if (tornable.length) R.pick(tornable).look.torn = R.int(1, 2);   // (top left / top right: the bottom holds the pay)
        if (ctx.nextId !== undefined) ctx.nextId = c.nextId;
        return out;
    }

    // ------------------------------------------------------------------
    // The board's cycle: new notices every REFRESH_DAYS days (in hand stays in hand)
    // ------------------------------------------------------------------
    const SLOTS = [[168, 268], [404, 264], [640, 270], [170, 528], [406, 532], [638, 526]];
    const cycleOf = day => Math.floor((Math.max(1, day) - 1) / REFRESH_DAYS);
    function newBoard(seed, cycle) {
        const d = data();
        d.board = d.board.filter(n => n.state === "active");
        const R = Rng(seed);
        const act = d.board.length, want = R.int(NOTICES[0], NOTICES[1]);
        const count = clamp(want - act, 2, SLOTS.length - act);
        const ctx = { day: today(), rep: d.rep, count, once: d.once, exclude: d.board.map(n => n.tpl), nextId: d.nextId, bounties: d.board.filter(n => n.type === "bounty").length };
        const fresh = generate(hashInts(seed, 7), ctx);
        d.nextId = ctx.nextId;
        const free = SLOTS.map((_, i) => i).filter(i => !d.board.some(n => n.look.slot === i));
        for (let i = free.length - 1; i > 0; i--) { const j = R.int(0, i); [free[i], free[j]] = [free[j], free[i]]; }
        fresh.forEach((n, i) => { n.look.slot = free[i] !== undefined ? free[i] : i; });
        d.board.push(...fresh.filter(n => n.look.slot >= 0));
        d.cycle = cycle;
        return fresh;
    }
    // one notice of a chosen template pinned now (events, tests): in a free slot, else in place of an open one
    function post(tplId, tier, seed) {
        const tpl = TEMPLATE(tplId), d = data();
        if (!tpl) return null;
        const tiers = tplTiers(tpl), t = tiers.includes(tier) ? tier : tiers[tiers.length - 1];
        const ctx = { day: today(), once: d.once, nextId: d.nextId, urgentLeft: 0 };
        const n = makeNotice(tpl, t, Rng(seed === undefined ? (Math.random() * 4294967296) >>> 0 : seed >>> 0), ctx);
        d.nextId = ctx.nextId;
        const free = SLOTS.map((_, i) => i).filter(i => !d.board.some(x => x.look.slot === i));
        if (free.length) n.look.slot = free[0];
        else {
            const i = d.board.findIndex(x => x.state !== "active");
            if (i < 0) return null;
            n.look.slot = d.board[i].look.slot;
            d.board.splice(i, 1);
        }
        if (d.cycle < 0) d.cycle = cycleOf(today());
        d.board.push(n);
        return n;
    }
    function checkCycle() {
        if (!window.$gameSystem) return false;
        const d = data(), c = cycleOf(today());
        if (d.cycle === c) return false;
        newBoard(hashInts(d.seed, c), c);
        return true;
    }

    // ------------------------------------------------------------------
    // Progress, accepting, turning in, giving up, failing
    // ------------------------------------------------------------------
    const have = q => (q.k === "item" ? (item(q.id) ? $gameParty.numItems(item(q.id)) : 0) : q.got || 0);
    const rowDone = q => have(q) >= q.n;
    const isReady = n => !!n && n.req.every(rowDone);
    const daysLeft = n => (n.due || 0) - today() + 1;
    function daysText(n) {
        const k = daysLeft(n);
        return k > 1 ? "zostały " + k + " dni" : k === 1 ? "dziś ostatni dzień" : "po terminie";
    }
    const reqName = q => (q.k === "item" ? itemName(q.id) : q.k === "bounty" ? BOUNTIES[q.key].name : cap(BEASTS[q.kind].few) + " upolowane");
    const reqPlace = q => (q.map ? placeName(q.map) : "");
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const listeners = [];

    function accept(id) {
        const n = find(id);
        if (!n || n.state !== "open") return { ok: false, why: "Tego zlecenia już nie ma na tablicy." };
        if (activeList().length >= MAX_ACTIVE) return { ok: false, why: "Masz już " + MAX_ACTIVE + " zlecenia. Najpierw któreś oddaj albo porzuć." };
        n.state = "active";
        n.accepted = today();
        n.due = today() + n.days - 1;
        for (const q of n.req) if (q.k !== "item") q.got = 0;
        return { ok: true };
    }
    // opts.debt: the pay goes straight to the Lord (Feliks's contracts, while grandpa's debt is open)
    function turnIn(id, opts) {
        const n = find(id);
        if (!n || n.state !== "active" || !isReady(n)) return null;
        const d = data();
        for (const q of n.req) if (q.k === "item") $gameParty.loseItem(item(q.id), q.n);
        $gameParty.gainGold(n.gold);
        let toDebt = 0;
        if (opts && opts.debt && window.Story && Story.isOpen && Story.isOpen()) toDebt = Story.pay(n.gold) || 0;
        const xp = window.Combat && Combat.gainXp ? Combat.gainXp(n.xp, "zlecenie", true) || 0 : 0;
        const before = d.rep;
        d.rep = clamp(d.rep + n.rep, 0, 100);
        if (n.gift) $gameParty.gainItem(item(n.gift[0]), n.gift[1]);
        let die = null;
        if (n.die && window.TavernDice && typeof TavernDice.giveDie === "function") {
            try { die = TavernDice.giveDie(n.die) ? n.die : null; } catch (e) { die = null; }
        }
        n.state = "done";
        n.doneDay = today();
        d.stats.done++;
        d.stats.gold += n.gold;
        d.stats.xp += xp;
        d.history.unshift({ id: n.id, tpl: n.tpl, title: n.title, giver: n.giver, type: n.type, day: today(), gold: n.gold, xp: n.xp, rep: n.rep, gift: n.gift, state: "done", req: n.req.map(q => Object.assign({}, q)) });
        d.history.length = Math.min(d.history.length, 40);
        if (d.track === n.id) d.track = null;
        const tpl = TEMPLATE(n.tpl);
        if (tpl && tpl.once) d.once[tpl.id] = today();
        if (window.Journal && Journal.addNote) {
            if (tpl && tpl.note) Journal.addNote(tpl.note[0], tpl.note[1]);
            else Journal.addNote("Zlecenie: " + n.title, "Dla: " + GIVERS[n.giver].name + " (" + GIVERS[n.giver].role + "). Wykonane w dniu " + today() + ".\n" +
                "Oddałem: " + n.req.map(q => reqName(q) + " " + q.n).join(", ") + ".\nZapłata: " + n.gold + " G" + (toDebt ? " (od razu na poczet długu dziadka)" : "") +
                ", " + n.xp + " dośw., sława +" + n.rep + (n.gift ? ", " + itemName(n.gift[0]) + " ×" + n.gift[1] : "") + ".");
        }
        const res = { id, gold: n.gold, xp, rep: n.rep, repBefore: before, repAfter: d.rep, gift: n.gift, die, toDebt, tierUp: repTier(d.rep) > repTier(before) ? TIERS[repTier(d.rep)].name : null };
        for (const fn of listeners) { try { fn(n, res); } catch (e) { console.error(e); } }
        if (window.Journal && Journal.evaluateGoals) Journal.evaluateGoals();
        return res;
    }
    function abandon(id) {
        const n = find(id);
        if (!n || n.state !== "active") return false;
        const d = data(), loss = REP_ABANDON + (n.urgent ? 2 : 0);
        d.rep = clamp(d.rep - loss, 0, 100);
        d.stats.abandoned++;
        d.history.unshift({ id: n.id, tpl: n.tpl, title: n.title, giver: n.giver, type: n.type, day: today(), gold: 0, xp: 0, rep: -loss, state: "abandoned", req: n.req.map(q => Object.assign({}, q)) });
        d.history.length = Math.min(d.history.length, 40);
        d.board = d.board.filter(x => x !== n);
        if (d.track === n.id) d.track = null;
        return loss;
    }
    function fail(n) {
        const d = data(), loss = REP_FAIL + (n.urgent ? 2 : 0);
        n.state = "failed";
        n.failDay = today();
        d.rep = clamp(d.rep - loss, 0, 100);
        d.stats.failed++;
        d.history.unshift({ id: n.id, tpl: n.tpl, title: n.title, giver: n.giver, type: n.type, day: today(), gold: 0, xp: 0, rep: -loss, state: "failed", req: n.req.map(q => Object.assign({}, q)) });
        d.history.length = Math.min(d.history.length, 40);
        if (d.track === n.id) d.track = null;
        notice("Zlecenie przepadło: " + n.title, "#ff9f8f", "Minął termin. Sława w tawernie -" + loss);
        return loss;
    }
    function failDue() {
        if (!hasState()) return 0;
        let k = 0;
        for (const n of activeList()) if (daysLeft(n) <= 0) { fail(n); k++; }
        return k;
    }
    function notice(text, color, sub) {
        if ($gameTemp && typeof $gameTemp.pushTopNotice === "function") $gameTemp.pushTopNotice(text, color, sub ? { sub } : null);
    }
    function track(id) {
        const d = data(), n = id ? find(id) : null;
        d.track = n && n.state === "active" ? n.id : null;
        return d.track;
    }

    // kills: Hunting.js tells every one (the hero's, the dog's)
    function onKill(animal) {
        if (!hasState() || !animal || !$gameMap) return;
        const kind = animal.kind ? animal.kind() : null, map = $gameMap.mapId();
        for (const n of activeList()) {
            let moved = false;
            for (const q of n.req) {
                if (q.k === "kill" && q.kind === kind && (!q.map || q.map === map) && (q.got || 0) < q.n) { q.got = (q.got || 0) + 1; moved = true; }
                if (q.k === "bounty" && animal._qbBounty === n.id && (q.got || 0) < 1) { q.got = 1; moved = true; }
            }
            if (!moved) continue;
            if (isReady(n)) notice("Zlecenie gotowe: " + n.title, "#9ff0a8", "Oddaj je przy tablicy zleceń w tawernie.");
            else {
                const q = n.req.find(r => r.k !== "item" && have(r) < r.n) || n.req[0];
                notice(n.title + ": " + reqName(q) + " " + Math.min(have(q), q.n) + "/" + q.n, "#ffd23f");
            }
        }
    }
    if (window.Hunting && Hunting.onKill) Hunting.onKill(onKill);

    // ------------------------------------------------------------------
    // On the map: the terms, a new board, "you have everything", the wanted animals
    // ------------------------------------------------------------------
    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        this._qbT = 0;
    };
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (!$gameSystem || !$gameMap) return;
        this._qbT = (this._qbT || 0) + 1;
        if (this._qbT % 30 !== 0 || !hasState()) return;
        const d = data();
        failDue();
        if (checkCycle() && d.tutorial) notice("Na tablicy w tawernie wiszą nowe ogłoszenia", "#ffd23f");
        for (const n of activeList()) {
            if (n.req.some(q => q.k === "item")) {   // (kills say it themselves, see onKill)
                const ok = isReady(n);
                if (ok && !n.said) { n.said = true; notice("Masz wszystko do zlecenia: " + n.title, "#9ff0a8", "Oddaj je przy tablicy zleceń w tawernie."); }
                else if (!ok && n.said && n.req.some(q => q.k === "item" && !rowDone(q))) n.said = false;
            }
            if (daysLeft(n) === 1 && !n.warned && !isReady(n)) { n.warned = true; notice("Dziś mija termin zlecenia: " + n.title, "#ffb36b"); }
        }
        updateBounties(this);
    };

    // a wanted animal: on its map, in its hours, somewhere 11-16 tiles off, once the map has been up for a few seconds
    function updateBounties(scene) {
        const H = window.Hunting;
        if (!H || !H.spawn || scene._qbT < 180) return;
        if ($gameMap.isEventRunning() || $gamePlayer.isTransferring()) return;
        for (const n of activeList()) {
            const q = n.req.find(r => r.k === "bounty");
            if (!q || q.got >= 1 || q.map !== $gameMap.mapId()) continue;
            const B = BOUNTIES[q.key];
            const sp = H.SPECIES[B.kind], h = $gameSystem.dayNightHour ? $gameSystem.dayNightHour() : 12;
            if (!sp || !sp.hours.some(([a, b]) => h >= a && h < b)) continue;
            if (H.animals.some(a => a._qbBounty === n.id && !a._dead)) continue;
            spawnBounty(n.id);
        }
    }
    function bountySpot(minD, maxD) {
        const px = $gamePlayer.x, py = $gamePlayer.y, spots = [];
        for (let y = 1; y < $gameMap.height() - 1; y++) for (let x = 1; x < $gameMap.width() - 1; x++) {
            const dd = Math.hypot(x - px, y - py);
            if (dd < minD || dd > maxD) continue;
            if (!$gameMap.checkPassage(x, y, 0x0f)) continue;
            if ($gameMap.eventsXy(x, y).some(e => e.isNormalPriority())) continue;
            if (window.Farming && (Farming.buildingAt(x, y) || (Farming.hasObjectTile && Farming.hasObjectTile(x, y)))) continue;
            spots.push([x, y]);
        }
        return spots.length ? spots[Math.floor(Math.random() * spots.length)] : null;
    }
    function spawnBounty(id, at) {
        const n = find(id), H = window.Hunting;
        const q = n && n.req.find(r => r.k === "bounty");
        if (!q || !H) return null;
        const B = BOUNTIES[q.key], spot = at || bountySpot(11, 16) || bountySpot(6, 30);
        if (!spot) return null;
        let beast = null;
        if (B.kind === "wolf" && H.spawnPack) {
            const pack = H.spawnPack(spot[0], spot[1], 1 + (B.pack || 0));
            beast = pack ? pack.leader : null;
        } else beast = H.spawn(B.kind, spot[0], spot[1]);
        if (!beast) return null;
        beast._qbBounty = n.id;
        beast._qbName = B.name;
        beast._qbScale = B.scale;
        beast._qbTone = B.tone;
        beast._level = (beast._level || 1) + B.lv;
        beast._maxHp = Math.round(beast._maxHp * B.hp);
        beast._hp = beast._maxHp;
        beast._maxPoise = Math.round((beast._maxPoise || 20) * 1.5);
        beast._poise = beast._maxPoise;
        notice("W pobliżu grasuje " + B.name + "!", "#ff9f8f", "POSZUKIWANY - zlecenie z tablicy w tawernie");
        AudioManager.playSe({ name: B.kind === "wolf" ? "Wolf" : "Monster3", volume: 70, pitch: B.kind === "wolf" ? 85 : 75, pan: 0 });
        return beast;
    }

    // the wanted animal's look: bigger, tinted, its name over it; the board's marker over the board event
    const _Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        if (this._qbScaled) { this.scale.x /= this._qbScaled; this.scale.y /= this._qbScaled; this._qbScaled = 0; }
        _Sprite_Character_update.call(this);
        const c = this._character;
        if (!c) return;
        if (c._qbScale) {
            this.scale.x *= c._qbScale;
            this.scale.y *= c._qbScale;
            this._qbScaled = c._qbScale;
            if (c._qbTone) this.setColorTone(c._qbTone);
            if (!this._qbLabel && c._qbName) { this._qbLabel = new Sprite(nameplate(c._qbName)); this._qbLabel.anchor.set(0.5, 1); this.addChild(this._qbLabel); }
            if (this._qbLabel) {
                this._qbLabel.y = -Math.round(this.patternHeight() * 0.92) - 4;
                this._qbLabel.scale.set(1 / (this.scale.x || 1), 1 / (this.scale.y || 1));   // (the name stays its size and unmirrored)
                this._qbLabel.visible = !c._dead;
            }
        } else if (c instanceof Game_Event && isBoardEvent(c)) updateMarker(this);
    };
    function nameplate(name) {
        const b = new Bitmap(8, 8);
        b.fontSize = 15;
        const w = Math.ceil(b.measureTextWidth(name)) + 26, bmp = new Bitmap(w, 24), ctx = bmp.context;
        const U = window.UIStyle;
        if (U && U.panel) U.panel(ctx, 0, 1, w, 22, { cut: 4, fill: "rgba(24,6,4,0.86)", line: "#7a2a1c", accent: false });
        else { ctx.fillStyle = "rgba(24,6,4,0.86)"; ctx.fillRect(0, 1, w, 22); }
        ctx.fillStyle = "#ff6b4a";
        ctx.beginPath(); ctx.moveTo(9, 7); ctx.lineTo(13, 12); ctx.lineTo(9, 17); ctx.lineTo(5, 12); ctx.closePath(); ctx.fill();
        bmp.fontSize = 15;
        bmp.textColor = "#ffb49e";
        bmp.outlineWidth = 3;
        bmp.outlineColor = "rgba(0,0,0,0.9)";
        bmp.drawText(name, 16, 1, w - 20, 22, "left");
        return bmp;
    }
    // over the board: a yellow "!" when there are notices not yet seen, a green tick when a contract can be turned in
    function markerState() {
        if (!hasState()) return "new";
        const d = data();
        if (activeList().some(isReady)) return "ready";
        return d.seen !== d.cycle || cycleOf(today()) !== d.cycle ? "new" : "";
    }
    const markerCache = {};
    function markerBitmap(kind) {
        if (markerCache[kind]) return markerCache[kind];
        const b = new Bitmap(26, 30), ctx = b.context, col = kind === "ready" ? "#7ddc6a" : "#ffd23f";
        const U = window.UIStyle;
        if (U && U.panel) U.panel(ctx, 1, 1, 24, 24, { cut: 4, fill: "rgba(11,12,15,0.9)", line: col, accent: false });
        ctx.fillStyle = "rgba(11,12,15,0.9)";
        ctx.beginPath(); ctx.moveTo(9, 25); ctx.lineTo(13, 29); ctx.lineTo(17, 25); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        if (kind === "ready") { ctx.beginPath(); ctx.moveTo(7, 13); ctx.lineTo(11.5, 18); ctx.lineTo(19, 8); ctx.stroke(); }
        else { ctx.fillRect(11.5, 6, 3, 10); ctx.fillRect(11.5, 18.5, 3, 3); }
        b._baseTexture.update();
        return (markerCache[kind] = b);
    }
    function updateMarker(spr) {
        const kind = markerState();
        if (!spr._qbMark) { spr._qbMark = new Sprite(); spr._qbMark.anchor.set(0.5, 1); spr.addChild(spr._qbMark); }
        const m = spr._qbMark;
        m.visible = !!kind;
        if (!kind) return;
        if (m._kind !== kind) { m.bitmap = markerBitmap(kind); m._kind = kind; }
        m.y = -Math.max(40, spr.patternHeight()) - 2 - Math.round(Math.abs(Math.sin(Graphics.frameCount / 18)) * 4);
    }

    // ------------------------------------------------------------------
    // The board event: page 1 (or the note) has <Tavern:board>; the action button there opens the board
    // ------------------------------------------------------------------
    const BOARD_TAG = /<Tavern:\s*board\s*>/i;
    const boardFlags = new WeakMap();
    function isBoardEvent(ev) {
        if (!ev || !ev.event) return false;
        if (boardFlags.has(ev)) return boardFlags.get(ev);
        const d = ev.event(), p = d && d.pages && d.pages[0];
        const yes = !!d && (BOARD_TAG.test(d.note || "") || (!!p && (p.list || []).some(c => (c.code === 108 || c.code === 408) && BOARD_TAG.test(String(c.parameters[0] || "")))));
        boardFlags.set(ev, yes);
        return yes;
    }
    const OPEN_LIST = [{ code: 355, indent: 0, parameters: ["QuestBoard.open()"] }, { code: 0, indent: 0, parameters: [] }];
    const _Game_Event_list = Game_Event.prototype.list;
    Game_Event.prototype.list = function() {
        const p = this.page();
        if (p && p.trigger <= 2 && isBoardEvent(this)) return OPEN_LIST;   // (the action button / touch: never an autorun or a parallel page)
        return _Game_Event_list.call(this);
    };
    function open() {
        if (!(SceneManager._scene instanceof Scene_QuestBoard)) SceneManager.push(Scene_QuestBoard);
        return true;
    }

    // ==================================================================
    // THE BOARD SCENE
    // ==================================================================
    const L = {   // the layout (tools/questboard/make_art.py draws the background with the same numbers)
        board: [18, 76, 790, 678], face: [48, 106, 760, 648], sign: [290, 32, 518, 92],
        detail: [812, 14, 1258, 492], slate: [812, 500, 1258, 678], hints: [18, 690, 1262, 716], tag: [404, 100]
    };
    const FONT_FILES = { "QB Hand": "Caveat-Regular.ttf", "QB Hand Bold": "Caveat-Bold.ttf", "QB Caps": "AlegreyaSC-Bold.ttf" };
    function ensureFonts() { for (const [fam, file] of Object.entries(FONT_FILES)) FontManager.load(fam, file); }
    const _Scene_Boot_loadGameFonts = Scene_Boot.prototype.loadGameFonts;
    Scene_Boot.prototype.loadGameFonts = function() {
        _Scene_Boot_loadGameFonts.call(this);
        ensureFonts();
    };
    const uiFont = () => ($gameSystem ? $gameSystem.mainFontFace() : "sans-serif");
    const F = {
        hand: s => s + 'px "QB Hand", ' + uiFont(),
        handB: s => s + 'px "QB Hand Bold", ' + uiFont(),
        caps: s => s + 'px "QB Caps", ' + uiFont(),
        ui: (s, bold) => (bold ? "bold " : "") + s + "px " + uiFont()
    };
    const INK = { dark: "#2a1a0d", soft: "#5b4128", faded: "#7a5f40", red: "#8e2417", green: "#2f5e22", gold: "#7a4c06", purple: "#4b2d7a", blue: "#27458f" };
    const TYPE_INK = { deliver: "#5b3a1a", craft: "#5b3a1a", gather: "#3f5220", hunt: "#6e2a14", bounty: "#8a1c10", story: "#3a2f60" };
    const U = () => window.UIStyle || { fill: "rgba(11,12,15,0.9)", line: "#3a3e46", accent: "#ffd23f", text: "#eceef0", muted: "#8a9099", panel: null, bar: null };

    // ---- small drawing helpers (straight on a 2D context)
    function wrap(ctx, text, maxW) {
        const out = [];
        for (const para of String(text).split("\n")) {
            let line = "";
            for (const word of para.split(" ")) {
                const t = line ? line + " " + word : word;
                if (line && ctx.measureText(t).width > maxW) { out.push(line); line = word; } else line = t;
            }
            out.push(line);
        }
        return out;
    }
    // text with letter spacing (the canvas's own letterSpacing is not everywhere); align: left / center / right
    function spaced(ctx, text, x, y, sp, align) {
        const chars = [...text], ws = chars.map(ch => ctx.measureText(ch).width);
        const total = ws.reduce((a, b) => a + b, 0) + sp * Math.max(0, chars.length - 1);
        let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
        ctx.textAlign = "left";
        chars.forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += ws[i] + sp; });
        return total;
    }
    function inkText(ctx, text, x, y, font, color, align, alpha) {
        ctx.save();
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = align || "left";
        ctx.textBaseline = "alphabetic";
        ctx.globalAlpha = alpha === undefined ? 0.92 : alpha;
        ctx.fillText(text, x, y);
        ctx.restore();
    }
    // a wobbly hand-drawn line
    function inkLine(ctx, x0, y0, x1, y1, color, width, R) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width || 1.2;
        ctx.lineCap = "round";
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 14));
        for (let i = 0; i <= n; i++) {
            const t = i / n, j = i === 0 || i === n ? 0 : (R.f() - 0.5) * 1.3;
            const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + j;
            if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
    }
    function flourish(ctx, cx, y, w, color, R) {
        inkLine(ctx, cx - w / 2, y, cx - 7, y, color, 1.1, R);
        inkLine(ctx, cx + 7, y, cx + w / 2, y, color, 1.1, R);
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.moveTo(cx, y - 3.5); ctx.lineTo(cx + 3.5, y); ctx.lineTo(cx, y + 3.5); ctx.lineTo(cx - 3.5, y); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    function star(ctx, cx, cy, r, fill, stroke, lw) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
            const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
            if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.4; ctx.stroke(); }
    }
    function hourglass(ctx, x, y, color) {
        ctx.save();
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y); ctx.moveTo(x, y + 14); ctx.lineTo(x + 10, y + 14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 1.5, y + 1); ctx.lineTo(x + 8.5, y + 1); ctx.lineTo(x + 5, y + 7); ctx.lineTo(x + 8.5, y + 13); ctx.lineTo(x + 1.5, y + 13); ctx.lineTo(x + 5, y + 7); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 2.8, y + 12.5); ctx.lineTo(x + 7.2, y + 12.5); ctx.lineTo(x + 5, y + 9.5); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    const img = bmp => (bmp ? bmp._canvas || bmp._image : null);
    function drawIcon(ctx, iconSet, index, x, y, size) {
        const src = img(iconSet);
        if (!src || !index) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(src, (index % 16) * 32, Math.floor(index / 16) * 32, 32, 32, Math.round(x), Math.round(y), size, size);
        ctx.restore();
    }

    // ---- assets
    const ASSETS = { back: "QuestBoard_Back", paper: "QuestBoard_Paper", parts: "QuestBoard_Parts" };
    const PART = { nail: [0, 0], brass: [64, 0], red: [128, 0], seal0: [192, 0], seal1: [256, 0], seal2: [320, 0], coin: [384, 0], coinS: [448, 0], mask: [0, 64, 512, 128], twine: [0, 192] };
    // an animal's side frame, trimmed; ink: in brown ink like an engraving (the wanted posters)
    const beastCache = {};
    function beastCanvas(kind, ink) {
        const key = kind + (ink ? "i" : "c");
        if (beastCache[key]) return beastCache[key];
        const sheet = ImageManager.loadCharacter(BEASTS[kind].sheet);
        const src = img(sheet);
        if (!src || !sheet.isReady()) return null;
        const pw = Math.floor(sheet.width / 3), ph = Math.floor(sheet.height / 4);
        const c = document.createElement("canvas");
        c.width = pw; c.height = ph;
        const x = c.getContext("2d");
        x.drawImage(src, pw, ph * 2, pw, ph, 0, 0, pw, ph);
        const id = x.getImageData(0, 0, pw, ph), p = id.data;
        let x0 = pw, y0 = ph, x1 = 0, y1 = 0;
        for (let yy = 0; yy < ph; yy++) for (let xx = 0; xx < pw; xx++) {
            const i = (yy * pw + xx) * 4;
            if (p[i + 3] < 10) continue;
            x0 = Math.min(x0, xx); y0 = Math.min(y0, yy); x1 = Math.max(x1, xx); y1 = Math.max(y1, yy);
            if (ink) {
                const l = (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]) / 255, t = Math.pow(l, 0.75);
                p[i] = 42 + (168 - 42) * t; p[i + 1] = 26 + (135 - 26) * t; p[i + 2] = 13 + (90 - 13) * t;
            }
        }
        x.putImageData(id, 0, 0);
        const out = document.createElement("canvas");
        out.width = Math.max(1, x1 - x0 + 1); out.height = Math.max(1, y1 - y0 + 1);
        out.getContext("2d").drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
        return (beastCache[key] = out);
    }
    function drawBeast(ctx, kind, x, y, maxW, maxH, ink) {
        const c = beastCanvas(kind, ink);
        if (!c) return 0;
        const s = Math.min(maxW / c.width, maxH / c.height);
        const k = s >= 1 ? Math.floor(s) : s, w = Math.round(c.width * k), h = Math.round(c.height * k);
        ctx.save();
        ctx.imageSmoothingEnabled = k < 1;
        if (ink) ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(c, Math.round(x + (maxW - w) / 2), Math.round(y + (maxH - h) / 2), w, h);
        ctx.restore();
        return w;
    }
    // the icon of a row: the item's icon, or the animal
    function drawReqIcon(ctx, A, q, x, y, size) {
        if (q.k === "item") drawIcon(ctx, A.iconSet, iconOf(q.id), x, y, size);
        else drawBeast(ctx, q.kind, x - 3, y + 2, size + 6, size - 4, false);
    }

    // ---- paper: a deckled outline (one corner torn off on some), the texture, burnt edges
    function paperOutline(w, h, R, torn) {
        const corners = [[1, 1], [w - 1, 1], [w - 1, h - 1], [1, h - 1]], poly = [];
        const ti = torn ? torn - 1 : -1, a = 24 + R.int(0, 16), b = 20 + R.int(0, 16);
        const towards = (p, q, d) => { const L2 = Math.hypot(q[0] - p[0], q[1] - p[1]); return [p[0] + (q[0] - p[0]) * d / L2, p[1] + (q[1] - p[1]) * d / L2]; };
        let tear = null;
        for (let i = 0; i < 4; i++) {
            if (i === ti) {
                const A = towards(corners[i], corners[(i + 3) % 4], a), B = towards(corners[i], corners[(i + 1) % 4], b);
                poly.push({ p: A }, { p: B, tear: true });
                tear = [A, B];
            } else poly.push({ p: corners[i] });
        }
        const pts = [];
        for (let i = 0; i < poly.length; i++) {
            const P = poly[i].p, Q = poly[(i + 1) % poly.length].p, isTear = !!poly[(i + 1) % poly.length].tear;
            const len = Math.hypot(Q[0] - P[0], Q[1] - P[1]), n = Math.max(1, Math.round(len / (isTear ? 2.4 : 7)));
            const nx = -(Q[1] - P[1]) / len, ny = (Q[0] - P[0]) / len;
            for (let k = 0; k < n; k++) {
                const t = k / n, amp = isTear ? 2.4 : 0.65, off = k === 0 ? 0 : (R.f() - 0.5) * 2 * amp;
                pts.push([P[0] + (Q[0] - P[0]) * t + nx * off, P[1] + (Q[1] - P[1]) * t + ny * off, isTear && k > 0]);
            }
        }
        const path = new Path2D();
        pts.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
        path.closePath();
        return { path, pts, tear };
    }
    function drawPaper(ctx, A, w, h, shade, R, torn, opts) {
        const o = opts || {}, out = paperOutline(w, h, R, torn), paper = img(A.paper);
        ctx.save();
        ctx.clip(out.path);
        const qx = (shade % 2) * 512, qy = Math.floor(shade / 2) * 512;
        const sx = qx + R.int(0, Math.max(0, 512 - w)), sy = qy + R.int(0, Math.max(0, 512 - h));
        if (paper) ctx.drawImage(paper, sx, sy, Math.min(w, 512), Math.min(h, 512), 0, 0, w, h);
        else { ctx.fillStyle = "#eadcb8"; ctx.fillRect(0, 0, w, h); }
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "rgba(255,249,232,0.12)");
        g.addColorStop(1, "rgba(70,40,12,0.10)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        if (o.crease) {   // a fold across it
            const y = Math.round(h * (0.42 + R.f() * 0.2));
            ctx.fillStyle = "rgba(255,250,236,0.35)"; ctx.fillRect(0, y, w, 1);
            ctx.fillStyle = "rgba(90,60,30,0.16)"; ctx.fillRect(0, y + 1, w, 1);
        }
        for (const [lw, a] of [[18, 0.09], [8, 0.11], [3, 0.2]]) { ctx.strokeStyle = "rgba(104,66,28," + a + ")"; ctx.lineWidth = lw; ctx.stroke(out.path); }
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = "rgba(56,36,16,0.6)";
        ctx.lineWidth = 1;
        ctx.stroke(out.path);
        if (out.tear) {   // the torn edge: light fibres
            ctx.strokeStyle = "rgba(255,248,228,0.85)";
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            let started = false;
            for (const [x, y, t] of out.pts) { if (!t) { started = false; continue; } if (!started) { ctx.moveTo(x - 0.5, y - 0.5); started = true; } else ctx.lineTo(x - 0.5, y - 0.5); }
            ctx.stroke();
        }
        ctx.restore();
        return out.path;
    }
    function shadowBitmap(w, h, path, pad) {
        const b = new Bitmap(w + pad * 2, h + pad * 2), ctx = b.context;
        ctx.save();
        ctx.filter = "blur(5px)";
        ctx.translate(pad, pad);
        ctx.fillStyle = "rgba(10,5,2,0.8)";
        ctx.fill(path);
        ctx.restore();
        b._baseTexture.update();
        return b;
    }

    // ---- a notice on the board
    const sealed = n => n.type !== "bounty" && String(n.look.pin).startsWith("seal");
    const topOf = n => (sealed(n) ? 8 : 0) + (n.urgent ? 10 : 0);
    function cardHeightFor(n, A, w) {
        const c = document.createElement("canvas").getContext("2d");
        c.font = F.handB(26);
        const lines = Math.min(2, wrap(c, n.title, w - 30).length);
        if (n.type === "bounty") return 250;
        return topOf(n) + 57 + lines * 25 + 2 + 10 + 40 + (n.req.some(q => q.map) ? 8 : 0) + 6 + 28 + 26;
    }
    function drawCard(n, A) {
        const w = n.look.w, h = cardHeightFor(n, A, w), R = Rng(n.look.seed);
        const bmp = new Bitmap(w, h), ctx = bmp.context, G = GIVERS[n.giver];
        const path = drawPaper(ctx, A, w, h, n.look.shade, R, n.look.torn, { crease: n.look.crease });
        ctx.save();
        ctx.clip(path);
        ctx.globalCompositeOperation = "multiply";
        const cx = w / 2, ink = TYPE_INK[n.type] || INK.dark;
        if (n.type === "bounty") {
            ctx.font = F.caps(25);
            ctx.fillStyle = "#8a1c10";
            ctx.globalAlpha = 0.9;
            spaced(ctx, "POSZUKIWANY", cx, 40, 1.5, "center");
            ctx.globalAlpha = 1;
            inkLine(ctx, 22, 48, w - 22, 48, "#8a1c10", 1.2, R);
            drawBeast(ctx, n.req[0].kind, 18, 56, w - 36, 74, true);
            inkText(ctx, n.title, cx, 158, F.handB(32), INK.dark, "center");
            inkText(ctx, "martwy, najlepiej", cx, 177, F.hand(18), INK.faded, "center", 0.85);
            flourish(ctx, cx, 190, w - 60, INK.soft, R);
            inkText(ctx, "Nagroda: " + n.gold + " G", cx, 216, F.handB(26), INK.gold, "center");
            inkText(ctx, placeName(n.req[0].map) + " · " + BOUNTIES[n.req[0].key].hint, cx, 238, F.hand(17), INK.soft, "center", 0.85);
        } else {
            const top = topOf(n);
            ctx.font = F.caps(12);
            ctx.fillStyle = ink;
            ctx.globalAlpha = 0.85;
            const label = n.giver === "feliks" ? "DWÓR ZALESKICH" : TYPE_LABEL[n.type];
            const lw = spaced(ctx, label, cx, 30 + top, 2.2, "center");
            ctx.globalAlpha = 1;
            inkLine(ctx, 16, 25 + top, cx - lw / 2 - 7, 25 + top, ink, 1, R);
            inkLine(ctx, cx + lw / 2 + 7, 25 + top, w - 16, 25 + top, ink, 1, R);
            ctx.font = F.handB(26);
            const lines = wrap(ctx, n.title, w - 30).slice(0, 2);
            let y = 57 + top;
            for (const line of lines) { inkText(ctx, line, cx, y, F.handB(26), INK.dark, "center"); y += 25; }
            y += 2;
            flourish(ctx, cx, y, w - 70, INK.soft, R);
            y += 10;
            // what is wanted: icons with counts
            const cells = n.req.map(q => ({ q, label: "×" + q.n }));
            ctx.font = F.handB(22);
            const cellW = cells.map(c => 36 + 4 + ctx.measureText(c.label).width);
            const gap = 14, total = cellW.reduce((a, b) => a + b, 0) + gap * (cells.length - 1);
            let x = cx - total / 2;
            ctx.globalCompositeOperation = "source-over";
            cells.forEach((c, i) => {
                drawReqIcon(ctx, A, c.q, x, y, 32);
                x += 36;
                ctx.globalCompositeOperation = "multiply";
                inkText(ctx, c.label, x + 2, y + 25, F.handB(22), INK.dark, "left");
                ctx.globalCompositeOperation = "source-over";
                if (c.q.map) inkText(ctx, placeName(c.q.map), x - 18, y + 42, F.hand(14), INK.soft, "center", 0.8);
                x += cellW[i] - 36 + gap;
            });
            ctx.globalCompositeOperation = "multiply";
            y += 40 + (n.req.some(q => q.map) ? 8 : 0);
            inkLine(ctx, 18, y, w - 18, y, INK.faded, 0.8, R);
            y += 6;
            // the pay and the term
            const parts = img(A.parts);
            ctx.globalCompositeOperation = "source-over";
            if (parts) ctx.drawImage(parts, PART.coinS[0] + 23, PART.coinS[1] + 23, 18, 18, 16, y + 4, 18, 18);
            ctx.globalCompositeOperation = "multiply";
            inkText(ctx, n.gold + " G", 38, y + 20, F.handB(23), INK.gold, "left");
            hourglass(ctx, w - 70, y + 6, INK.soft);
            inkText(ctx, n.days + " " + dniWord(n.days), w - 56, y + 20, F.handB(20), INK.soft, "left");
            y += 28;
            inkText(ctx, "— " + G.short, w - 16, y + 10, F.hand(17), INK.faded, "right", 0.9);
        }
        ctx.restore();
        if (n.urgent) drawRibbon(ctx, w);
        bmp._baseTexture.update();
        return { bitmap: bmp, w, h, path };
    }
    // PILNE: a red ribbon across the top right corner
    function drawRibbon(ctx, w) {
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, w, 80); ctx.clip();   // (its ends fold behind the paper)
        ctx.translate(w - 25, 25);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(-42, -7, 84, 20);
        const g = ctx.createLinearGradient(0, -10, 0, 10);
        g.addColorStop(0, "#c8392a"); g.addColorStop(0.5, "#a82618"); g.addColorStop(1, "#7c1a10");
        ctx.fillStyle = g;
        ctx.fillRect(-42, -10, 84, 19);
        ctx.fillStyle = "rgba(255,210,190,0.35)";
        ctx.fillRect(-42, -10, 84, 1);
        ctx.fillStyle = "rgba(60,8,4,0.6)";
        ctx.fillRect(-42, 8, 84, 1);
        ctx.font = F.caps(13);
        ctx.fillStyle = "#fff1dc";
        spaced(ctx, "PILNE", 0, 4, 2.2, "center");
        ctx.restore();
    }
    // a rubber stamp: PRZYJĘTE (blue), WYKONANE (green), PO TERMINIE (red); eroded by the ink mask
    function stampBitmap(kind, A) {
        const S = { active: ["PRZYJĘTE", "#27458f"], done: ["WYKONANE", "#2e6b2c"], failed: ["PO TERMINIE", "#9b2418"] }[kind];
        if (!S) return null;
        const probe = document.createElement("canvas").getContext("2d");
        probe.font = F.caps(25);
        const tw = [...S[0]].reduce((a, ch) => a + probe.measureText(ch).width, 0) + 2.5 * (S[0].length - 1);
        const w = Math.ceil(tw + 34), h = 46, b = new Bitmap(w, h), ctx = b.context;
        ctx.strokeStyle = S[1];
        ctx.fillStyle = S[1];
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(3, 3, w - 6, h - 6, 6) : ctx.rect(3, 3, w - 6, h - 6); ctx.stroke();
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(8, 8, w - 16, h - 16, 4) : ctx.rect(8, 8, w - 16, h - 16); ctx.stroke();
        ctx.font = F.caps(25);
        spaced(ctx, S[0], w / 2, h / 2 + 9, 2.5, "center");
        const m = img(A.parts);
        if (m) {
            ctx.globalCompositeOperation = "destination-in";
            const ox = Math.floor(Math.random() * Math.max(1, 512 - w)), oy = Math.floor(Math.random() * Math.max(1, 128 - h));
            ctx.drawImage(m, PART.mask[0] + ox, PART.mask[1] + oy, w, h, 0, 0, w, h);
        }
        b._baseTexture.update();
        return b;
    }
    function partBitmap(A, key, size) {
        const [px, py] = PART[key], seal = key.startsWith("seal"), s = seal ? 48 : key === "coin" ? 28 : 22;
        const off = seal ? 8 : key === "coin" ? 18 : 21, b = new Bitmap(size, size);
        const src = img(A.parts);
        if (src) { b.context.imageSmoothingEnabled = true; b.context.drawImage(src, px + off, py + off, s, s, 0, 0, size, size); }
        b._baseTexture.update();
        return b;
    }

    // ------------------------------------------------------------------
    // A card sprite: a container at the card's centre (rotated), with its shadow, the paper, the pin and the stamp
    // ------------------------------------------------------------------
    function Sprite_QBCard() {
        this.initialize(...arguments);
    }
    Sprite_QBCard.prototype = Object.create(Sprite.prototype);
    Sprite_QBCard.prototype.constructor = Sprite_QBCard;
    Sprite_QBCard.prototype.initialize = function(n, A) {
        Sprite.prototype.initialize.call(this);
        this.n = n;
        this.A = A;
        const c = drawCard(n, A);
        this.w = c.w;
        this.h = c.h;
        const pad = 16;
        this._shadow = new Sprite(shadowBitmap(c.w, c.h, c.path, pad));
        this._shadow.anchor.set(0.5, 0.5);
        this._glow = new Sprite(glowBitmap(c.w, c.h, c.path));
        this._glow.anchor.set(0.5, 0.5);
        this._glow.visible = false;
        this._paper = new Sprite(c.bitmap);
        this._paper.anchor.set(0.5, 0.5);
        this.addChild(this._glow, this._shadow, this._paper);
        const pin = n.look.pin, seal = pin.startsWith("seal"), size = seal ? 40 : 16;
        this._pin = new Sprite(partBitmap(A, pin, size));
        this._pin.anchor.set(0.5, 0.5);
        this._pin.x = n.type === "bounty" ? 0 : (Rng(n.look.seed + 1).f() - 0.5) * 16;
        this._pin.y = -c.h / 2 + (seal ? 5 : 9);
        if (n.type === "bounty") {   // two red tacks at the top corners
            this._pin.bitmap = partBitmap(A, "red", 16);
            this._pin.x = -c.w / 2 + 14;
            this._pin2 = new Sprite(partBitmap(A, "red", 16));
            this._pin2.anchor.set(0.5, 0.5);
            this._pin2.x = c.w / 2 - 14;
            this._pin2.y = this._pin.y;
            this.addChild(this._pin2);
        }
        this.addChild(this._pin);
        const [sx, sy] = SLOTS[n.look.slot] || SLOTS[0];
        this.baseX = sx + n.look.dx;
        this.baseY = sy + n.look.dy;
        this.baseRot = n.look.rot * Math.PI / 180;
        this.lift = 0;
        this.target = 0;
        this.enter = 0;          // the flutter in when the board opens
        this.shake = 0;
        this._stampKind = "";
        this.refreshStamp(false);
        this.applyTransform();
    };
    function glowBitmap(w, h, path) {
        const pad = 22, b = new Bitmap(w + pad * 2, h + pad * 2), ctx = b.context;
        ctx.save();
        ctx.filter = "blur(9px)";
        ctx.translate(pad, pad);
        ctx.strokeStyle = "rgba(125,220,106,0.95)";
        ctx.lineWidth = 12;
        ctx.stroke(path);
        ctx.restore();
        b._baseTexture.update();
        return b;
    }
    Sprite_QBCard.prototype.refreshStamp = function(animate) {
        const kind = this.n.state === "active" || this.n.state === "done" || this.n.state === "failed" ? this.n.state : "";
        if (kind === this._stampKind) return;
        this._stampKind = kind;
        if (this._stamp) { this.removeChild(this._stamp); this._stamp = null; }
        if (!kind) return;
        this._stamp = new Sprite(stampBitmap(kind, this.A));
        this._stamp.anchor.set(0.5, 0.5);
        this._stamp.rotation = (this.n.look.stampRot || -10) * Math.PI / 180;
        this._stamp.x = 4;
        this._stamp.y = this.n.type === "bounty" ? 30 : this.h * 0.1;
        this._stamp.opacity = 200;
        this._stampT = animate ? 0 : 99;
        this.addChild(this._stamp);
    };
    Sprite_QBCard.prototype.applyTransform = function() {
        const k = this.lift, e = this.enter;
        const ease = 1 - Math.pow(1 - e, 3);
        const sh = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
        this.x = this.baseX + sh;
        this.y = this.baseY - 9 * k - (1 - ease) * 40 + (this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0);
        this.rotation = this.baseRot * (1 - k) + (1 - ease) * 0.25 * (this.n.look.rot >= 0 ? 1 : -1);
        this.scale.set(1 + 0.07 * k, 1 + 0.07 * k);
        this.alpha = Math.min(1, e * 1.6);
        this._shadow.x = 3 + 8 * k;
        this._shadow.y = 5 + 12 * k;
        this._shadow.alpha = 0.42 + 0.14 * k;
        this._shadow.scale.set(1 + 0.03 * k, 1 + 0.03 * k);
    };
    Sprite_QBCard.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.lift += (this.target - this.lift) * 0.22;
        if (this.enter < 1) this.enter = Math.min(1, this.enter + 0.06);
        if (this.shake > 0) this.shake = Math.max(0, this.shake - 0.6);
        const ready = this.n.state === "active" && isReady(this.n);
        this._glow.visible = ready;
        if (ready) this._glow.alpha = 0.45 + 0.3 * Math.sin(Graphics.frameCount / 14);
        if (this._stamp && this._stampT < 14) {   // it comes down hard and settles
            this._stampT++;
            const t = this._stampT / 14, s = t < 0.6 ? 2 - t / 0.6 : 1 + Math.sin((t - 0.6) / 0.4 * Math.PI) * 0.06;
            this._stamp.scale.set(s * 0.9, s * 0.9);
            this._stamp.opacity = Math.min(200, 60 + t * 260);
        } else if (this._stamp) this._stamp.scale.set(0.9, 0.9);
        this.applyTransform();
    };
    // is (mx, my) on this card? (in its own rotated frame)
    Sprite_QBCard.prototype.hits = function(mx, my) {
        const dx = mx - this.x, dy = my - this.y, c = Math.cos(-this.rotation), s = Math.sin(-this.rotation);
        const lx = (dx * c - dy * s) / this.scale.x, ly = (dx * s + dy * c) / this.scale.y;
        return Math.abs(lx) <= this.w / 2 && Math.abs(ly) <= this.h / 2;
    };

    // the rules tag, hanging on twine under the sign
    function Sprite_QBTag() {
        this.initialize(...arguments);
    }
    Sprite_QBTag.prototype = Object.create(Sprite.prototype);
    Sprite_QBTag.prototype.constructor = Sprite_QBTag;
    Sprite_QBTag.prototype.initialize = function(A) {
        Sprite.prototype.initialize.call(this);
        this.w = 118; this.h = 42;
        const R = Rng(4242), b = new Bitmap(this.w, this.h), ctx = b.context;
        const path = drawPaper(ctx, A, this.w, this.h, 0, R, 0, {});
        ctx.save(); ctx.clip(path); ctx.globalCompositeOperation = "multiply";
        ctx.font = F.caps(13); ctx.fillStyle = INK.dark; ctx.globalAlpha = 0.85;
        spaced(ctx, "ZASADY", this.w / 2, 19, 2.5, "center");
        inkText(ctx, "tablicy", this.w / 2, 36, F.hand(18), INK.soft, "center");
        ctx.restore();
        b._baseTexture.update();
        this._shadow = new Sprite(shadowBitmap(this.w, this.h, path, 16));
        this._shadow.anchor.set(0.5, 0);
        this._shadow.y = -16 + 4; this._shadow.x = 3;
        this._shadow.alpha = 0.4;
        this._twine = new Sprite(new Bitmap(20, 20));
        const tctx = this._twine.bitmap.context;
        tctx.strokeStyle = "#8a6a3e"; tctx.lineWidth = 1.5;
        tctx.beginPath(); tctx.moveTo(10, 0); tctx.lineTo(4, 16); tctx.moveTo(10, 0); tctx.lineTo(16, 16); tctx.stroke();
        this._twine.bitmap._baseTexture.update();
        this._twine.anchor.set(0.5, 1);
        this._twine.y = 2;
        this._paper = new Sprite(b);
        this._paper.anchor.set(0.5, 0);
        this.addChild(this._shadow, this._twine, this._paper);
        this.x = L.tag[0];
        this.y = L.tag[1] + 6;
        this.baseY = this.y;
        this.lift = 0; this.target = 0; this.swing = 0; this.swingV = 0;
    };
    Sprite_QBTag.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.lift += (this.target - this.lift) * 0.22;
        this.swingV += -this.swing * 0.02 - this.swingV * 0.04;
        this.swing += this.swingV;
        this.rotation = this.swing;
        this.scale.set(1 + 0.08 * this.lift, 1 + 0.08 * this.lift);
        this._shadow.y = -12 + 8 * this.lift;
    };
    Sprite_QBTag.prototype.nudge = function() { this.swingV += 0.012; };
    Sprite_QBTag.prototype.hits = function(mx, my) {
        return mx >= this.x - this.w / 2 && mx <= this.x + this.w / 2 && my >= this.y && my <= this.y + this.h;
    };

    // ------------------------------------------------------------------
    // The scene
    // ------------------------------------------------------------------
    function Scene_QuestBoard() {
        this.initialize(...arguments);
    }
    Scene_QuestBoard.prototype = Object.create(Scene_Base.prototype);
    Scene_QuestBoard.prototype.constructor = Scene_QuestBoard;
    Scene_QuestBoard.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        ensureFonts();
        failDue();
        checkCycle();
        this.A = {
            back: ImageManager.loadSystem(ASSETS.back), paper: ImageManager.loadSystem(ASSETS.paper), parts: ImageManager.loadSystem(ASSETS.parts),
            iconSet: ImageManager.loadSystem("IconSet"), bust: ImageManager.loadPicture(BORGAR_BUST)
        };
        for (const k of Object.keys(BEASTS)) ImageManager.loadCharacter(BEASTS[k].sheet);
    };
    Scene_QuestBoard.prototype.start = function() {
        Scene_Base.prototype.start.call(this);
        this.build();
        this.startFadeIn(14, false);
        AudioManager.playSe({ name: "Book1", volume: 70, pitch: 105, pan: 0 });
        const d = data();
        if (!d.tutorial) this.showTutorial();
    };
    Scene_QuestBoard.prototype.terminate = function() {
        Scene_Base.prototype.terminate.call(this);
        if (hasState()) data().seen = data().cycle;
    };
    Scene_QuestBoard.prototype.build = function() {
        const A = this.A, W = Graphics.width, H = Graphics.height;
        this._back = new Sprite(A.back);
        this.addChild(this._back);
        this._tag = new Sprite_QBTag(A);
        this.addChild(this._tag);
        this._cardLayer = new Sprite();
        this.addChild(this._cardLayer);
        this._cards = [];
        const d = data();
        const order = d.board.slice().sort((a, b) => a.look.slot - b.look.slot);
        order.forEach((n, i) => { const c = new Sprite_QBCard(n, A); c.enter = -i * 0.12; this._cards.push(c); this._cardLayer.addChild(c); });
        this._brackets = new Sprite();
        this._brackets.anchor.set(0.5, 0.5);
        this.addChild(this._brackets);
        this._detail = new Sprite(new Bitmap(L.detail[2] - L.detail[0], L.detail[3] - L.detail[1] + 20));
        this._detail.x = L.detail[0];
        this._detail.y = L.detail[1];
        this.addChild(this._detail);
        this._buttons = new Sprite(new Bitmap(L.detail[2] - L.detail[0], 80));
        this._buttons.x = L.detail[0];
        this._buttons.y = L.detail[3] - 84;
        this.addChild(this._buttons);
        this._slate = new Sprite(new Bitmap(L.slate[2] - L.slate[0], L.slate[3] - L.slate[1]));
        this._slate.x = L.slate[0];
        this._slate.y = L.slate[1];
        this.addChild(this._slate);
        this._hints = new Sprite(new Bitmap(W, 30));
        this._hints.y = L.hints[1] - 4;
        this.addChild(this._hints);
        this.createAmbience();
        this._fx = new Sprite();
        this.addChild(this._fx);
        this._overlay = new Sprite(new Bitmap(W, H));
        this._overlay.visible = false;
        this.addChild(this._overlay);
        this._toast = new Sprite(new Bitmap(700, 34));   // (a short word at the bottom right, over the board's term)
        this._toast.x = L.hints[2] - 700 + 4;
        this._toast.y = L.hints[1] - 7;
        this._toast.opacity = 0;
        this.addChild(this._toast);
        this.mode = "browse";       // browse (moving between notices), choice (the buttons of the open notice), anim, tutorial
        this.focus = null;
        this.choices = [];
        this.choiceIndex = 0;
        this.purseShown = $gameParty.gold();
        this.debtShown = window.Story && Story.isOpen && Story.isOpen() ? Story.left() : 0;
        this.repShown = d.rep;
        this.anim = null;
        this._mouse = [TouchInput.x, TouchInput.y];
        this._detailKey = "";
        const first = this._cards.find(c => c.n.state === "active" && isReady(c.n)) || this._cards[0] || this._tag;
        this.setFocus(first, true);
        this.drawSlate();
        this.drawHints();
    };

    // ---- the lamp over the board: its warm light breathes a little, dust drifts in it
    Scene_QuestBoard.prototype.createAmbience = function() {
        const W = Graphics.width, H = Graphics.height, b = new Bitmap(W, H), ctx = b.context;
        const g = ctx.createRadialGradient(404, 40, 20, 404, 120, 640);
        g.addColorStop(0, "rgba(255,196,120,1)");
        g.addColorStop(0.45, "rgba(255,170,90,0.35)");
        g.addColorStop(1, "rgba(255,150,70,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        b._baseTexture.update();
        this._glow = new Sprite(b);
        this._glow.blendMode = 1;   // (additive: the light lies on what is under it)
        this._glow.opacity = 18;
        this.addChild(this._glow);
        const dot = new Bitmap(4, 4), dc = dot.context;
        dc.fillStyle = "rgba(255,236,200,0.55)"; dc.fillRect(1, 0, 2, 4); dc.fillRect(0, 1, 4, 2);
        dc.fillStyle = "rgba(255,248,230,0.95)"; dc.fillRect(1, 1, 2, 2);
        dot._baseTexture.update();
        this._motes = [];
        for (let i = 0; i < 22; i++) {
            const m = new Sprite(dot);
            m.anchor.set(0.5, 0.5);
            m.blendMode = 1;
            this.resetMote(m, true);
            this._motes.push(m);
            this.addChild(m);
        }
    };
    Scene_QuestBoard.prototype.resetMote = function(m, anywhere) {
        m._x = 120 + Math.random() * 580;
        m._y = anywhere ? 90 + Math.random() * 520 : 610 + Math.random() * 40;
        m._vx = (Math.random() - 0.5) * 0.12;
        m._vy = -(0.08 + Math.random() * 0.18);
        m._ph = Math.random() * Math.PI * 2;
        m._life = 0;
        m._max = 500 + Math.random() * 700;
        const k = 0.5 + Math.random() * 0.8;
        m.scale.set(k, k);
    };
    Scene_QuestBoard.prototype.updateAmbience = function() {
        const t = Graphics.frameCount;
        this._glow.opacity = 16 + 5 * Math.sin(t / 37) + 3 * Math.sin(t / 11.3) + (Math.random() < 0.02 ? 4 : 0);
        for (const m of this._motes) {
            m._life++;
            m._x += m._vx + Math.sin(t / 90 + m._ph) * 0.12;
            m._y += m._vy;
            if (m._life > m._max || m._y < 80) this.resetMote(m, false);
            const fade = Math.min(1, m._life / 90, (m._max - m._life) / 90);
            m.x = m._x; m.y = m._y;
            m.opacity = Math.max(0, fade) * (110 + 70 * Math.sin(t / 23 + m._ph));
        }
    };

    // ---- focus and the detail
    const elementOf = el => (el && el.n ? el.n : el ? "rules" : null);
    Scene_QuestBoard.prototype.elements = function() {
        return this._cards.concat([this._tag]);
    };
    Scene_QuestBoard.prototype.setFocus = function(el, quiet) {
        if (this.focus === el) return;
        this.focus = el;
        for (const e of this.elements()) e.target = e === el ? 1 : 0;
        if (el === this._tag && !quiet) el.nudge();
        // the focused card on top of the others
        if (el && el !== this._tag) { this._cardLayer.removeChild(el); this._cardLayer.addChild(el); }
        if (!quiet) SoundManager.playCursor();
        this.mode = this.mode === "choice" ? "browse" : this.mode;
        this.refreshDetail(true);
    };
    Scene_QuestBoard.prototype.refreshDetail = function(slide) {
        const el = this.focus;
        drawDetail(this._detail.bitmap, this.A, el === this._tag ? null : el ? el.n : null, this);
        this.choices = this.choiceList();
        this.choiceIndex = Math.min(this.choiceIndex, Math.max(0, this.choices.length - 1));
        this.drawButtons();
        this.drawHints();
        if (slide) { this._detailT = 0; }
    };
    // the buttons of the open notice
    Scene_QuestBoard.prototype.choiceList = function() {
        const el = this.focus;
        if (!el) return [];
        if (el === this._tag) return [{ id: "close", label: "Rozumiem" }];
        const n = el.n;
        if (this._confirm) return [{ id: "abandonYes", label: "Tak, porzuć (sława -" + (REP_ABANDON + (n.urgent ? 2 : 0)) + ")" }, { id: "abandonNo", label: "Nie" }];
        if (n.state === "open") return [{ id: "accept", label: "Przyjmij zlecenie", enabled: activeList().length < MAX_ACTIVE }, { id: "leave", label: "Zostaw" }];
        if (n.state === "active") {
            const out = [];
            const ready = isReady(n);
            if (n.giver === "feliks" && ready && window.Story && Story.isOpen && Story.isOpen()) {
                out.push({ id: "turnIn", label: "Oddaj", enabled: true });
                out.push({ id: "turnInDebt", label: "Oddaj na dług", enabled: true });
            } else out.push({ id: "turnIn", label: "Oddaj zlecenie", enabled: ready });
            out.push({ id: "track", label: data().track === n.id ? "Nie śledź" : "Śledź" });
            out.push({ id: "abandon", label: "Porzuć" });
            return out;
        }
        return [{ id: "leave", label: "Zamknij" }];
    };
    Scene_QuestBoard.prototype.drawButtons = function() {
        const b = this._buttons.bitmap, ctx = b.context, S = U();
        b.clear();
        const list = this.choices;
        if (!list.length) { b._baseTexture.update(); return; }
        const W = b.width - 14, gap = 10, pad = 22;
        ctx.font = F.ui(19, false);
        const ws = list.map(c => Math.ceil(ctx.measureText(c.label).width) + 30);
        let total = ws.reduce((a, c) => a + c, 0) + gap * (ws.length - 1);
        const k = total > W - pad * 2 ? (W - pad * 2 - gap * (ws.length - 1)) / (total - gap * (ws.length - 1)) : 1;
        const widths = ws.map(w => Math.floor(w * k));
        total = widths.reduce((a, c) => a + c, 0) + gap * (widths.length - 1);
        let x = Math.round((W - total) / 2);
        this._buttonRects = [];
        list.forEach((c, i) => {
            const w = widths[i], sel = this.mode === "choice" && i === this.choiceIndex, dim = c.enabled === false;
            if (S.panel) S.panel(ctx, x, 18, w, 38, { cut: 5, fill: sel ? "rgba(11,12,15,0.96)" : "rgba(11,12,15,0.78)", line: sel ? S.accent : S.line, accent: sel });
            else { ctx.fillStyle = "rgba(11,12,15,0.85)"; ctx.fillRect(x, 18, w, 38); }
            ctx.font = F.ui(19, false);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = dim ? "#6a6f77" : sel ? S.accent : S.text;
            ctx.fillText(c.label, x + w / 2, 38, w - 12);
            this._buttonRects.push([this._buttons.x + x, this._buttons.y + 18, w, 38]);
            x += w + gap;
        });
        ctx.textBaseline = "alphabetic";
        this._buttons.opacity = this.mode === "choice" ? 255 : 150;
        this._buttons.visible = this.mode !== "anim";
        b._baseTexture.update();
    };
    Scene_QuestBoard.prototype.drawHints = function() {
        const b = this._hints.bitmap, ctx = b.context, S = U();
        b.clear();
        const list = this.mode === "choice" ? [["←→", "wybierz"], ["O", "potwierdź"], ["P", "wróć"]]
            : this.mode === "anim" ? [["O", "szybciej"]]
            : this.mode === "tutorial" ? [["O", "dalej"]]
            : [["↑↓←→", "wybierz kartkę"], ["O", this.focus && this.focus.n && this.focus.n.state === "active" ? (isReady(this.focus.n) ? "oddaj / opcje" : "opcje") : "otwórz"], ["P", "wyjdź"]];
        let x = L.hints[0] + 2;
        for (const [key, what] of list) {
            ctx.font = F.ui(15, true);
            const kw = Math.max(26, Math.ceil(ctx.measureText(key).width) + 14);
            if (S.panel) S.panel(ctx, x, 2, kw, 22, { cut: 3, fill: "rgba(11,12,15,0.9)", accent: false });
            ctx.fillStyle = S.accent;
            ctx.textAlign = "center";
            ctx.fillText(key, x + kw / 2, 18);
            x += kw + 7;
            ctx.font = F.ui(17, false);
            ctx.fillStyle = S.text;
            ctx.textAlign = "left";
            ctx.fillText(what, x, 19);
            x += Math.ceil(ctx.measureText(what).width) + 22;
        }
        // on the right: the term of the board
        const d = data(), next = (cycleOf(today()) + 1) * REFRESH_DAYS + 1, k = next - today();
        ctx.font = F.ui(16, false);
        ctx.fillStyle = S.muted;
        ctx.textAlign = "right";
        ctx.fillText("Nowe ogłoszenia: " + (k <= 1 ? "jutro" : "za " + k + " dni") + "  ·  zleceń w toku: " + activeList().length + "/" + MAX_ACTIVE, L.hints[2] - 4, 19);
        void d;
        b._baseTexture.update();
    };

    // the big parchment on the right: everything about the focused notice (n null: the rules). BUDGET: where the text ends
    // (px from its top) - the buttons lie below
    const BUDGET = 400;
    function drawDetail(bmp, A, n, scene) {
        bmp.clear();
        const W = bmp.width, H = L.detail[3] - L.detail[1], ctx = bmp.context;
        const seed = n ? n.look.seed + 17 : 9001, R = Rng(seed);
        // its shadow on the wall
        const out = paperOutline(W - 14, H - 14, Rng(seed), 0);
        ctx.save();
        ctx.filter = "blur(8px)";
        ctx.translate(12, 14);
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fill(out.path);
        ctx.restore();
        ctx.save();
        const path = drawPaper(ctx, A, W - 14, H - 14, n ? n.look.shade : 0, R, 0, {});
        ctx.clip(path);
        ctx.globalCompositeOperation = "multiply";
        const x0 = 26, x1 = W - 14 - 26, cw = x1 - x0, cx = x0 + cw / 2;
        let y = 40;
        if (!n) {
            ctx.font = F.caps(14); ctx.fillStyle = INK.soft; ctx.globalAlpha = 0.85;
            spaced(ctx, "ZASADY TABLICY", cx, y, 3, "center");
            ctx.globalAlpha = 1;
            y += 38;
            inkText(ctx, "Jak to działa", cx, y, F.handB(38), INK.dark, "center");
            y += 16;
            flourish(ctx, cx, y, 200, INK.soft, R);
            y += 30;
            const rules = [
                "Zerwij kartkę - zlecenie jest twoje. Najwyżej " + MAX_ACTIVE + " naraz.",
                "Każde ma termin w dniach od przyjęcia. Nie zdążysz - wieś się dowie, a sława spadnie.",
                "Gotowe oddajesz tutaj: towar z plecaka, zapłata od ręki.",
                "Co " + REFRESH_DAYS + " dni wieszam nowe kartki. Im większa sława, tym lepiej płacą."
            ];
            ctx.font = F.hand(21);
            rules.forEach((r, i) => {
                const lines = wrap(ctx, r, cw - 30);
                inkText(ctx, (i + 1) + ".", x0 + 4, y, F.handB(21), INK.gold, "left");
                lines.forEach(l => { inkText(ctx, l, x0 + 28, y, F.hand(21), INK.dark, "left"); y += 22; });
                y += 4;
            });
            inkText(ctx, "— Borgar", x1, y, F.hand(20), INK.faded, "right");
            y += 12;
            inkLine(ctx, x0, y, x1, y, INK.faded, 0.9, R);
            y += 26;
            const d = data(), t = repTier(d.rep), nextT = TIERS[t + 1], st = d.stats;
            inkText(ctx, "Twoja sława: " + TIERS[t].name + " (" + d.rep + "/100)", x0, y, F.handB(21), INK.dark, "left");
            y += 22;
            ctx.font = F.hand(18);
            const more = (nextT ? "Następny próg: " + nextT.name + " - " + nextT.rep + " sławy, od dnia " + nextT.day + "; zlecenia do " + nextT.gold[1] + " G. "
                : "Wyżej już się nie da - cała okolica o tobie mówi. ") +
                "Wykonane: " + st.done + ", po terminie: " + st.failed + ", porzucone: " + st.abandoned + ", zarobione: " + st.gold + " G.";
            for (const l of wrap(ctx, more, cw).slice(0, 3)) { inkText(ctx, l, x0, y, F.hand(18), INK.soft, "left"); y += 20; }
            ctx.restore();
            bmp._baseTexture.update();
            return;
        }
        const G = GIVERS[n.giver];
        // the head: the kind of work, and where it stands
        ctx.font = F.caps(14);
        ctx.fillStyle = n.urgent ? "#8e2417" : TYPE_INK[n.type];
        ctx.globalAlpha = 0.88;
        spaced(ctx, (n.urgent ? "PILNE · " : "") + (n.giver === "feliks" ? "DWÓR ZALESKICH" : TYPE_LABEL[n.type]), x0, y, 2.4, "left");
        ctx.globalAlpha = 1;
        const st = n.state === "open" ? "na tablicy" : n.state === "active" ? (isReady(n) ? "gotowe do oddania" : "przyjęte · " + daysText(n)) : n.state === "done" ? "wykonane w dniu " + n.doneDay : "po terminie";
        inkText(ctx, st, x1, y, F.handB(19), n.state === "active" && isReady(n) ? INK.green : n.state === "failed" ? INK.red : INK.soft, "right");
        y += 44;
        // the title
        ctx.font = F.handB(38);
        const tl = wrap(ctx, n.title, cw).slice(0, 2);
        tl.forEach(l => { inkText(ctx, l, x0, y, F.handB(38), n.type === "bounty" ? "#6e1a0e" : INK.dark, "left"); y += 34; });
        y -= 6;
        inkText(ctx, "od: " + G.name + ", " + G.role, x0, y + 16, F.handB(20), INK.soft, "left");
        // what the lower part needs (the list, the pay, the term), so the text above takes only what is left
        const extras = !!n.gift || !!(n.die && window.TavernDice), felix = n.giver === "feliks" && window.Story && Story.isOpen && Story.isOpen() && n.state !== "done";
        const lower = 98 + n.req.length * 33 + (n.type === "bounty" ? 20 : 0) + (extras ? 24 : 0) + (felix ? 24 : 0);
        ctx.font = F.hand(22);
        const all = wrap(ctx, n.text, cw);
        const fit = quote => Math.floor((BUDGET - lower - (y + (quote ? 36 + 12 + 26 : 28 + 26)) + 23) / 23);
        const quote = fit(true) >= Math.min(3, all.length), room = clamp(fit(quote), 1, 5);   // (measured before y moves on)
        if (quote) {
            y += 36;
            inkText(ctx, "„" + G.line + "”", x0, y, F.hand(18), INK.faded, "left", 0.85);
            y += 12;
        } else y += 28;
        inkLine(ctx, x0, y, x1, y, INK.faded, 0.9, R);
        y += 26;
        // the text
        const lines = all.slice(0, room);
        if (all.length > room) lines[room - 1] = lines[room - 1].replace(/\s*\S*$/, "") + "…";
        lines.forEach(l => { inkText(ctx, l, x0, y, F.hand(22), INK.dark, "left"); y += 23; });
        y += 10;
        // what is wanted, with what the hero has
        ctx.font = F.caps(13); ctx.fillStyle = INK.soft; ctx.globalAlpha = 0.85;
        spaced(ctx, "POTRZEBA", x0, y, 2.2, "left");
        ctx.globalAlpha = 1;
        y += 8;
        for (const q of n.req) {
            const got = n.state === "done" ? q.n : Math.min(have(q), q.n), done = got >= q.n;
            const count = n.state === "open" && q.k !== "item" ? "0 / " + q.n : (n.state === "open" ? have(q) : got) + " / " + q.n;
            ctx.globalCompositeOperation = "source-over";
            drawReqIcon(ctx, A, q, x0, y + 3, 30);
            ctx.globalCompositeOperation = "multiply";
            const name = reqName(q) + (q.map ? " (" + placeName(q.map) + ")" : "");
            inkText(ctx, name, x0 + 40, y + 25, F.handB(22), INK.dark, "left");
            inkText(ctx, count, x1, y + 25, F.handB(24), n.state === "done" || done || (n.state === "open" && q.k === "item" && have(q) >= q.n) ? INK.green : INK.red, "right");
            y += 33;
        }
        if (n.req.some(q => q.k === "bounty")) {
            const q = n.req.find(r => r.k === "bounty"), B = BOUNTIES[q.key];
            inkText(ctx, "Większy i silniejszy od innych, grasuje " + B.hint + ".", x0, y + 12, F.hand(18), INK.soft, "left", 0.9);
            y += 20;
        }
        y += 18;
        // the pay
        ctx.font = F.caps(13); ctx.fillStyle = INK.soft; ctx.globalAlpha = 0.85;
        spaced(ctx, "NAGRODA", x0, y, 2.2, "left");
        ctx.globalAlpha = 1;
        y += 10;
        let x = x0;
        const parts = img(A.parts);
        ctx.globalCompositeOperation = "source-over";
        if (parts) ctx.drawImage(parts, PART.coin[0] + 18, PART.coin[1] + 18, 28, 28, x, y, 24, 24);
        ctx.globalCompositeOperation = "multiply";
        inkText(ctx, n.gold + " G", x + 30, y + 21, F.handB(26), INK.gold, "left");
        ctx.font = F.handB(26);
        x += 30 + ctx.measureText(n.gold + " G").width + 20;
        ctx.globalCompositeOperation = "source-over";
        star(ctx, x + 9, y + 12, 9, "#9a7cd0", "#4b2d7a", 1.2);
        ctx.globalCompositeOperation = "multiply";
        inkText(ctx, n.xp + " dośw.", x + 22, y + 20, F.handB(22), INK.purple, "left");
        ctx.font = F.handB(22);
        x += 22 + ctx.measureText(n.xp + " dośw.").width + 18;
        ctx.globalCompositeOperation = "source-over";
        star(ctx, x + 9, y + 12, 9, "#ffd23f", "#7a5a10", 1.2);
        ctx.globalCompositeOperation = "multiply";
        inkText(ctx, "sława +" + n.rep, x + 22, y + 20, F.handB(22), INK.gold, "left");
        y += 30;
        const extra = [];
        if (n.gift) extra.push(["gift", n.gift]);
        if (n.die && window.TavernDice) extra.push(["die", n.die]);
        if (extra.length) {
            let ex = x0;
            for (const [k, v] of extra) {
                if (k === "gift") {
                    ctx.globalCompositeOperation = "source-over";
                    drawIcon(ctx, A.iconSet, iconOf(v[0]), ex, y - 2, 24);
                    ctx.globalCompositeOperation = "multiply";
                    const t = "i " + itemName(v[0]) + " ×" + v[1];
                    inkText(ctx, t, ex + 28, y + 16, F.hand(20), INK.dark, "left");
                    ctx.font = F.hand(20);
                    ex += 28 + ctx.measureText(t).width + 16;
                } else {
                    const DT = window.TavernDice && TavernDice.DIE_TYPES && TavernDice.DIE_TYPES[v];
                    inkText(ctx, "i " + (DT ? DT.name : "kość do gry"), ex, y + 16, F.hand(20), INK.dark, "left");
                }
            }
            y += 24;
        }
        y += 4;
        // the term
        hourglass(ctx, x0, y, INK.soft);
        const termY = y;
        const term = n.state === "open" ? n.days + " " + dniWord(n.days) + " od przyjęcia" : n.state === "active" ? "do dnia " + n.due + " · " + daysText(n) : n.state === "done" ? "oddane w dniu " + n.doneDay : "termin minął w dniu " + n.due;
        inkText(ctx, term, x0 + 18, y + 13, F.handB(20), n.state === "active" && daysLeft(n) <= 1 ? INK.red : INK.soft, "left");
        y += 18;
        if (felix) {
            inkText(ctx, "Feliks może zaliczyć zapłatę od razu na poczet długu dziadka.", x0, y + 18, F.hand(18), INK.faded, "left", 0.9);
            y += 24;
        }
        // the signature, bottom right, above the buttons (a wax seal beside it for those who seal their notices)
        const sy = Math.max(y + 30, BUDGET - 8);
        if (sy > BUDGET) inkText(ctx, "— " + G.short, x1, termY + 14, F.handB(21), INK.soft, "right", 0.9);
        else {
            const sig = "— " + G.name;
            ctx.save();
            ctx.translate(x1, sy);
            ctx.rotate(-0.04);
            ctx.font = F.handB(28);
            const sw = ctx.measureText(sig).width;
            ctx.fillStyle = INK.soft;
            ctx.globalAlpha = 0.9;
            ctx.textAlign = "right";
            ctx.fillText(sig, 0, 0);
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = INK.soft;
            ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(-sw + 10, 7); ctx.quadraticCurveTo(-sw / 2, 12, 4, 5); ctx.stroke();
            ctx.restore();
            if (String(G.pin).startsWith("seal")) {
                const parts = img(A.parts), [px, py] = PART[G.pin];
                ctx.globalCompositeOperation = "source-over";
                ctx.save();
                ctx.translate(x0 + 24, sy - 8);
                ctx.rotate(-0.18);
                if (parts) ctx.drawImage(parts, px + 8, py + 8, 48, 48, -24, -24, 48, 48);
                ctx.restore();
            }
        }
        ctx.restore();
        bmp._baseTexture.update();
        void scene;
    }

    // the slate: the reputation, what is in hand, the purse
    Scene_QuestBoard.prototype.drawSlate = function() {
        const b = this._slate.bitmap, ctx = b.context, S = U(), d = data();
        b.clear();
        const chalk = "rgba(236,238,236,0.92)", dim = "rgba(200,205,205,0.55)", yellow = "rgba(255,210,63,0.95)";
        const rep = Math.round(this.repShown), t = repTier(rep);
        // left: the reputation
        ctx.font = F.caps(13); ctx.fillStyle = yellow;
        spaced(ctx, "SŁAWA W TAWERNIE", 22, 32, 1.8, "left");
        for (let i = 0; i < 5; i++) {
            const cx = 34 + i * 28, cy = 54, fillK = clamp((rep - i * 20) / 20, 0, 1);
            star(ctx, cx, cy, 12, "rgba(255,255,255,0.06)", "rgba(236,238,236,0.55)", 1.4);
            if (fillK > 0) {
                ctx.save();
                ctx.beginPath(); ctx.rect(cx - 13, cy + 13 - 26 * fillK, 26, 26 * fillK); ctx.clip();
                star(ctx, cx, cy, 12, "#ffd23f", "rgba(120,90,10,0.9)", 1);
                ctx.restore();
            }
        }
        inkText(ctx, rep + "/100", 214, 61, F.hand(18), dim, "right", 1);
        inkText(ctx, TIERS[t].name, 22, 94, F.handB(27), chalk, "left", 1);
        if (S.bar) S.bar(ctx, 22, 103, 184, 5, rep / 100, "#ffd23f");
        const next = TIERS[t + 1];
        inkText(ctx, next ? "dalej: " + next.name + " (" + next.rep + ")" : "najwyższa sława", 22, 126, F.hand(17), dim, "left", 1);
        // right: in hand
        const rx = 236;
        ctx.fillStyle = "rgba(236,238,236,0.18)";
        ctx.fillRect(rx - 12, 18, 1, 110);
        const act = activeList();
        ctx.font = F.caps(13); ctx.fillStyle = yellow;
        spaced(ctx, "W TOKU  " + act.length + "/" + MAX_ACTIVE, rx, 32, 1.8, "left");
        if (!act.length) inkText(ctx, "nic - zerwij jakąś kartkę", rx, 60, F.hand(19), dim, "left", 1);
        act.slice(0, 3).forEach((n, i) => {
            const y = 40 + i * 30, ready = isReady(n);
            const q = n.req.find(r => !rowDone(r)) || n.req[0];
            drawReqIcon(ctx, this.A, q, rx, y + 2, 22);
            const right = ready ? "gotowe!" : Math.min(have(q), q.n) + "/" + q.n + " · " + Math.max(0, daysLeft(n)) + " d";
            ctx.font = F.handB(19);
            const room = 418 - Math.ceil(ctx.measureText(right).width) - 10 - (rx + 28);
            ctx.font = F.hand(19);
            let title = n.title;
            if (ctx.measureText(title).width > room) {
                while (ctx.measureText(title + "…").width > room && title.length > 3) title = title.slice(0, -1);
                title = title.trim() + "…";
            }
            inkText(ctx, title, rx + 28, y + 19, F.hand(19), chalk, "left", 1);
            inkText(ctx, right, 418, y + 19, F.handB(19), ready ? "#9ff0a8" : daysLeft(n) <= 1 ? "#ff9f8f" : dim, "right", 1);
            if (data().track === n.id) { ctx.fillStyle = S.accent; ctx.fillRect(rx - 6, y + 6, 3, 16); }
        });
        // the purse (and grandpa's debt) along the bottom
        ctx.fillStyle = "rgba(236,238,236,0.18)";
        ctx.fillRect(18, 138, 410, 1);
        const py = 162;
        const parts = img(this.A.parts);
        if (parts) ctx.drawImage(parts, PART.coin[0] + 18, PART.coin[1] + 18, 28, 28, 22, py - 17, 20, 20);
        inkText(ctx, "Sakiewka: " + Math.round(this.purseShown) + " G", 48, py, F.handB(21), "#ffe27a", "left", 1);
        this._purseAt = [L.slate[0] + 32, L.slate[1] + py - 7];
        if (window.Story && Story.state && Story.state() && Story.active && Story.active()) {
            const s = Story.state(), left = Math.max(0, Math.round(this.debtShown !== undefined && this.anim && this.anim.debt ? this.debtShown : s.debt - s.paid));
            inkText(ctx, left > 0 ? "Dług dziadka: " + left + " G" : "Dług dziadka spłacony", rx, py, F.hand(20), left > 0 ? dim : "#9ff0a8", "left", 1);
            this._debtAt = [L.slate[0] + rx + 60, L.slate[1] + py - 7];
        }
        this._repAt = [L.slate[0] + 94, L.slate[1] + 54];
        b._baseTexture.update();
    };

    // ---- the yellow brackets round the focused element (the interface's cursor)
    Scene_QuestBoard.prototype.drawBrackets = function() {
        const spr = this._brackets, el = this.focus;
        spr.visible = !!el && this.mode !== "tutorial";
        if (!spr.visible) return;
        const lifted = el === this._tag ? 1.08 : 1.07, w = Math.round(el.w * lifted), h = Math.round(el.h * lifted), key = w + "x" + h;
        if (spr._key !== key) {   // four yellow corners (the interface's cursor), drawn once per size
            spr._key = key;
            const m = 8, bw = w + m * 2 + 6, bh = h + m * 2 + 6, b = new Bitmap(bw, bh), ctx = b.context, L2 = 14;
            const x0 = 3, y0 = 3, x1 = bw - 3, y1 = bh - 3;
            const corners = () => {
                ctx.beginPath();
                ctx.moveTo(x0, y0 + L2); ctx.lineTo(x0, y0); ctx.lineTo(x0 + L2, y0);
                ctx.moveTo(x1 - L2, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + L2);
                ctx.moveTo(x1, y1 - L2); ctx.lineTo(x1, y1); ctx.lineTo(x1 - L2, y1);
                ctx.moveTo(x0 + L2, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - L2);
            };
            ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.lineWidth = 5; corners(); ctx.stroke();
            ctx.strokeStyle = U().accent; ctx.lineWidth = 2.5; corners(); ctx.stroke();
            b._baseTexture.update();
            spr.bitmap = b;
        }
        const k = el.lift, pulse = 1 + 0.012 * Math.sin(Graphics.frameCount / 10);
        spr.x = el.x;
        spr.y = el === this._tag ? el.y + el.h * el.scale.y / 2 : el.y;
        spr.scale.set(pulse, pulse);
        spr.opacity = Math.round(255 * (0.4 + 0.6 * k));
    };

    // ---- input
    Scene_QuestBoard.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (!this._cards) return;
        this._t = (this._t || 0) + 1;
        if (this._detailT !== undefined && this._detailT < 10) {
            this._detailT++;
            const e = this._detailT / 10;
            this._detail.x = L.detail[0] + Math.round((1 - e) * 14);
            this._detail.opacity = 120 + 135 * e;
        }
        if (this._toastT > 0) { this._toastT--; this._toast.opacity = Math.min(255, this._toastT * 12); }
        this.drawBrackets();
        this.updateAmbience();
        if (this.anim) { this.updateAnim(); return; }
        if (this.mode === "tutorial") { this.updateTutorial(); return; }
        if (this.isBusy()) return;
        this.updateMouse();
        if (this.mode === "browse") this.updateBrowse();
        else if (this.mode === "choice") this.updateChoice();
    };
    Scene_QuestBoard.prototype.updateMouse = function() {
        const mx = TouchInput.x, my = TouchInput.y, moved = mx !== this._mouse[0] || my !== this._mouse[1];
        this._mouse = [mx, my];
        if (moved) {
            if (this.mode === "browse") {
                const over = this.hitElement(mx, my);
                if (over && over !== this.focus) this.setFocus(over);
            } else if (this.mode === "choice" && this._buttonRects) {
                const i = this._buttonRects.findIndex(([x, y, w, h]) => mx >= x && mx <= x + w && my >= y && my <= y + h);
                if (i >= 0 && i !== this.choiceIndex) { this.choiceIndex = i; SoundManager.playCursor(); this.drawButtons(); }
            }
        }
    };
    Scene_QuestBoard.prototype.hitElement = function(mx, my) {
        const cards = this._cardLayer.children.slice().reverse();   // the top one first
        for (const c of cards) if (c.hits && c.hits(mx, my)) return c;
        return this._tag.hits(mx, my) ? this._tag : null;
    };
    Scene_QuestBoard.prototype.updateBrowse = function() {
        const dirs = [["left", -1, 0], ["right", 1, 0], ["up", 0, -1], ["down", 0, 1]];
        for (const [k, dx, dy] of dirs) if (Input.isRepeated(k)) { this.moveFocus(dx, dy); return; }
        if (Input.isTriggered("ok")) { this.openChoice(); return; }
        if (TouchInput.isTriggered()) {
            const over = this.hitElement(TouchInput.x, TouchInput.y);
            if (over) { this.setFocus(over, true); this.openChoice(); return; }
            if (this._buttonRects) {
                const i = this._buttonRects.findIndex(([x, y, w, h]) => TouchInput.x >= x && TouchInput.x <= x + w && TouchInput.y >= y && TouchInput.y <= y + h);
                if (i >= 0) { this.openChoice(); this.choiceIndex = i; this.drawButtons(); this.decide(); return; }
            }
        }
        if (Input.isTriggered("cancel") || TouchInput.isCancelled()) { SoundManager.playCancel(); this.popScene(); }
    };
    // the nearest element in that direction (the angle counts twice as much as the distance)
    Scene_QuestBoard.prototype.moveFocus = function(dx, dy) {
        const el = this.focus || this._cards[0];
        if (!el) return;
        const pos = e => [e.baseX !== undefined ? e.baseX : e.x, e.baseY !== undefined ? e.baseY : e.y + e.h / 2];
        const [x0, y0] = pos(el);
        let best = null, bestS = Infinity;
        for (const e of this.elements()) {
            if (e === el) continue;
            const [x, y] = pos(e), vx = x - x0, vy = y - y0, along = vx * dx + vy * dy;
            if (along < 12) continue;
            const across = Math.abs(vx * dy - vy * dx), s = along + across * 2;
            if (s < bestS) { bestS = s; best = e; }
        }
        if (best) this.setFocus(best);
    };
    Scene_QuestBoard.prototype.openChoice = function() {
        if (!this.focus) return;
        this._confirm = false;
        this.mode = "choice";
        this.choices = this.choiceList();
        const first = this.choices.findIndex(c => c.enabled !== false);
        this.choiceIndex = Math.max(0, first);
        SoundManager.playOk();
        if (this.focus === this._tag) this._tag.nudge();
        this.drawButtons();
        this.drawHints();
    };
    Scene_QuestBoard.prototype.closeChoice = function() {
        this._confirm = false;
        this.mode = "browse";
        this.refreshDetail(false);
    };
    Scene_QuestBoard.prototype.updateChoice = function() {
        const n = this.choices.length;
        if (Input.isRepeated("left") || Input.isRepeated("up")) { this.choiceIndex = (this.choiceIndex + n - 1) % n; SoundManager.playCursor(); this.drawButtons(); return; }
        if (Input.isRepeated("right") || Input.isRepeated("down")) { this.choiceIndex = (this.choiceIndex + 1) % n; SoundManager.playCursor(); this.drawButtons(); return; }
        if (Input.isTriggered("ok")) { this.decide(); return; }
        if (TouchInput.isTriggered() && this._buttonRects) {
            const i = this._buttonRects.findIndex(([x, y, w, h]) => TouchInput.x >= x && TouchInput.x <= x + w && TouchInput.y >= y && TouchInput.y <= y + h);
            if (i >= 0) { this.choiceIndex = i; this.drawButtons(); this.decide(); return; }
            const over = this.hitElement(TouchInput.x, TouchInput.y);
            if (over && over !== this.focus) { this.closeChoice(); this.setFocus(over, true); return; }
        }
        if (Input.isTriggered("cancel") || TouchInput.isCancelled()) { SoundManager.playCancel(); this.closeChoice(); }
    };
    Scene_QuestBoard.prototype.toast = function(text, color) {
        const b = this._toast.bitmap, ctx = b.context, S = U();
        b.clear();
        ctx.font = F.ui(18, false);
        const w = Math.min(b.width - 4, Math.ceil(ctx.measureText(text).width) + 28), x = b.width - w - 2;
        if (S.panel) S.panel(ctx, x, 2, w, 30, { cut: 4, fill: "rgba(11,12,15,0.97)", line: color || "#ff9f8f", accent: false });
        ctx.fillStyle = color || "#ff9f8f";
        ctx.textAlign = "center";
        ctx.fillText(text, x + w / 2, 23, w - 16);
        b._baseTexture.update();
        this._toastT = 150;
        this._toast.opacity = 255;
    };
    Scene_QuestBoard.prototype.decide = function() {
        const c = this.choices[this.choiceIndex], el = this.focus;
        if (!c || !el) return;
        const n = el.n;
        if (c.enabled === false) {
            SoundManager.playBuzzer();
            if (c.id === "accept") this.toast("Masz już " + MAX_ACTIVE + " zlecenia. Oddaj albo porzuć któreś.");
            else if (c.id === "turnIn") { const q = n.req.find(r => !rowDone(r)); this.toast(q ? "Brakuje: " + reqName(q) + " " + Math.min(have(q), q.n) + "/" + q.n : "Jeszcze nie gotowe."); }
            return;
        }
        switch (c.id) {
            case "close": case "leave": case "abandonNo":
                SoundManager.playCancel();
                this.closeChoice();
                return;
            case "accept": {
                const r = accept(n.id);
                if (!r.ok) { SoundManager.playBuzzer(); this.toast(r.why); return; }
                AudioManager.playSe({ name: "Blow1", volume: 55, pitch: 62, pan: 0 });
                AudioManager.playSe({ name: "Book2", volume: 60, pitch: 110, pan: 0 });
                el.refreshStamp(true);
                el.shake = 5;
                this.closeChoice();
                this.toast("Przyjęte. Postęp widać w dzienniku (J); „Śledź” pokaże je na ekranie.", "#ffd23f");
                this.drawSlate();
                return;
            }
            case "track":
                track(data().track === n.id ? null : n.id);
                SoundManager.playOk();
                this.drawSlate();
                this.choices = this.choiceList();
                this.drawButtons();
                this.toast(data().track === n.id ? "Śledzisz to zlecenie w okienku celu na ekranie." : "Już go nie śledzisz.", "#ffd23f");
                return;
            case "abandon":
                SoundManager.playOk();
                this._confirm = true;
                this.choices = this.choiceList();
                this.choiceIndex = 1;
                this.drawButtons();
                return;
            case "abandonYes": {
                const loss = abandon(n.id);
                this._confirm = false;
                AudioManager.playSe({ name: "Book2", volume: 70, pitch: 70, pan: 0 });
                this.tearOff(el);
                this.toast("Porzucone. Sława w tawernie -" + loss, "#ff9f8f");
                this.repShown = data().rep;
                this.drawSlate();
                return;
            }
            case "turnIn": case "turnInDebt":
                this.startTurnIn(el, c.id === "turnInDebt");
                return;
        }
    };
    // an abandoned notice: torn off the board, it falls away
    Scene_QuestBoard.prototype.tearOff = function(el) {
        this._cards = this._cards.filter(c => c !== el);
        this._falling = this._falling || [];
        el.vy = -2; el.vr = (Math.random() - 0.5) * 0.08;
        this._falling.push(el);
        this.mode = "browse";
        const next = this._cards[0] || this._tag;
        this.focus = null;
        this.setFocus(next, true);
    };

    // ---- turning in: the goods go into the card, the stamp, the coins fly to the purse, the stars fill
    Scene_QuestBoard.prototype.startTurnIn = function(el, debt) {
        const n = el.n, gone = n.req.filter(q => q.k === "item").map(q => [iconOf(q.id), q.n]);
        const before = { gold: $gameParty.gold(), rep: data().rep, debt: window.Story && Story.left ? Story.left() : 0 };
        const res = turnIn(n.id, { debt });
        if (!res) { SoundManager.playBuzzer(); return; }
        this.mode = "anim";
        this.drawHints();
        this.drawButtons();
        this.anim = { t: 0, el, res, gone, debt: debt && res.toDebt > 0, coins: [], goldFrom: before.gold, repFrom: before.rep, debtFrom: before.debt, paid: 0 };
        this.purseShown = before.gold;
        this.repShown = before.rep;
        this.debtShown = before.debt;
        // the goods from the purse corner into the card
        gone.forEach(([icon], i) => this.flyIcon(icon, this._purseAt || [1000, 640], [el.x, el.y], 6 * i, 26, true));
        if (gone.length) AudioManager.playSe({ name: "Equip1", volume: 55, pitch: 100, pan: 0 });
    };
    Scene_QuestBoard.prototype.flyIcon = function(icon, from, to, delay, dur, fade) {
        const b = new Bitmap(32, 32);
        const ctx = b.context;
        drawIcon(ctx, this.A.iconSet, icon, 0, 0, 32);
        b._baseTexture.update();
        const s = new Sprite(b);
        s.anchor.set(0.5, 0.5);
        s.visible = false;
        this._fx.addChild(s);
        (this._flyers = this._flyers || []).push({ s, from, to, delay, dur, t: 0, fade, arc: -60 });
    };
    Scene_QuestBoard.prototype.updateAnim = function() {
        const a = this.anim, el = a.el, fast = Input.isTriggered("ok") || TouchInput.isTriggered();
        a.t += fast ? 40 : 1;
        this.updateFlyers(fast);
        const STAMP = 34, COINS = 50;
        if (a.t >= STAMP && !a.stamped) {
            a.stamped = true;
            el.refreshStamp(true);
            el.shake = 6;
            AudioManager.playSe({ name: "Blow1", volume: 60, pitch: 58, pan: 0 });
            this.sparkles(el.x, el.y, 10, "#9ff0a8");
        }
        if (a.t >= COINS && !a.coinsOut) {
            a.coinsOut = true;
            const count = clamp(4 + Math.round(a.res.gold / 8), 5, 18), to = a.debt ? this._debtAt || this._purseAt : this._purseAt;
            a.coinCount = count;
            for (let i = 0; i < count; i++) {
                const b = new Bitmap(24, 24);
                b.context.drawImage(img(this.A.parts), PART.coin[0] + 18, PART.coin[1] + 18, 28, 28, 0, 0, 24, 24);
                b._baseTexture.update();
                const s = new Sprite(b);
                s.anchor.set(0.5, 0.5);
                s.visible = false;
                this._fx.addChild(s);
                const f = { s, from: [el.x + (Math.random() - 0.5) * 40, el.y + (Math.random() - 0.5) * 30], to: to || [1000, 640], delay: i * 3, dur: 34 + Math.random() * 12, t: 0, coin: true, arc: -90 - Math.random() * 80, spin: Math.random() * 6 };
                (this._flyers = this._flyers || []).push(f);
            }
            this.floatText("+" + a.res.xp + " dośw.", el.x, el.y - 40, "#c9a6ff");
        }
        // the stars fill after the coins
        if (a.t >= COINS + 40) {
            const k = clamp((a.t - COINS - 40) / 50, 0, 1);
            this.repShown = a.repFrom + (a.res.repAfter - a.repFrom) * (1 - Math.pow(1 - k, 2));
            if (k >= 1 && a.res.tierUp && !a.tierSaid) {
                a.tierSaid = true;
                AudioManager.playSe({ name: "Chime2", volume: 80, pitch: 100, pan: 0 });
                this.sparkles(this._repAt[0], this._repAt[1], 16, "#ffd23f");
                this.banner("Nowa sława: " + a.res.tierUp + "!");
            }
            if (a.gift === undefined && a.res.gift) { a.gift = true; this.flyIcon(iconOf(a.res.gift[0]), [el.x, el.y], this._purseAt, 0, 30, true); }
            if (!a.dieSaid && a.res.die) {
                a.dieSaid = true;
                const DT = window.TavernDice && TavernDice.DIE_TYPES && TavernDice.DIE_TYPES[a.res.die];
                this.floatText("Nowa kość: " + (DT ? DT.name : a.res.die), el.x, el.y + 10, "#ffe27a");
            }
        }
        this.drawSlate();
        const end = COINS + 110 + (a.res.tierUp ? 40 : 0);
        if (a.t >= end && !(this._flyers || []).length) {
            this.purseShown = $gameParty.gold();
            this.repShown = data().rep;
            this.anim = null;
            this.mode = "browse";
            this.drawSlate();
            this.refreshDetail(false);
        }
    };
    Scene_QuestBoard.prototype.updateFlyers = function(fast) {
        const list = this._flyers || [];
        for (const f of list) {
            if (fast) { f.delay = 0; f.t = f.dur; }
            if (f.delay > 0) { f.delay--; continue; }
            f.t++;
            const k = clamp(f.t / f.dur, 0, 1), e = f.coin ? k * k * (3 - 2 * k) : 1 - Math.pow(1 - k, 2);
            const mx = (f.from[0] + f.to[0]) / 2, my = Math.min(f.from[1], f.to[1]) + f.arc;
            const x = (1 - e) * (1 - e) * f.from[0] + 2 * (1 - e) * e * mx + e * e * f.to[0];
            const y = (1 - e) * (1 - e) * f.from[1] + 2 * (1 - e) * e * my + e * e * f.to[1];
            f.s.visible = true;
            f.s.x = x; f.s.y = y;
            if (f.coin) { f.s.scale.x = Math.cos(f.t / 3 + f.spin); f.s.scale.y = 1; }
            if (f.fade) f.s.opacity = 255 * (k < 0.8 ? 1 : (1 - k) / 0.2);
            if (k >= 1 && !f.done) {
                f.done = true;
                if (f.coin && this.anim) {
                    const a = this.anim, share = a.res.gold / (a.coinCount || 1);
                    if (a.debt) { this.debtShown -= share; } else this.purseShown = Math.min($gameParty.gold(), this.purseShown + share);
                    if ((a.coinSe = (a.coinSe || 0) + 1) % 2 === 1) AudioManager.playSe({ name: "Coin", volume: 45, pitch: 95 + Math.floor(Math.random() * 40), pan: 0 });
                    this.sparkles(f.to[0], f.to[1], 2, "#ffe27a");
                }
                this._fx.removeChild(f.s);
            }
        }
        this._flyers = list.filter(f => !f.done);
        // the sparkles and the floating texts
        for (const s of this._fx.children.slice()) {
            if (s._life === undefined) continue;
            s._life--;
            s.x += s._vx; s.y += s._vy; s._vy += s._g || 0;
            s.opacity = Math.max(0, Math.min(255, s._life * 12));
            if (s._life <= 0) this._fx.removeChild(s);
        }
        // abandoned notices falling off the board
        for (const el of this._falling || []) {
            el.vy += 0.5; el.y += el.vy; el.baseY = el.y; el.rotation += el.vr; el.alpha = Math.max(0, el.alpha - 0.03);
            if (el.alpha <= 0 && el.parent) el.parent.removeChild(el);
        }
        this._falling = (this._falling || []).filter(el => el.parent);
    };
    const sparkleCache = {};
    function sparkleBitmap(color) {
        if (sparkleCache[color]) return sparkleCache[color];
        const b = new Bitmap(14, 14), ctx = b.context;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(8.5, 5.5); ctx.lineTo(14, 7); ctx.lineTo(8.5, 8.5); ctx.lineTo(7, 14); ctx.lineTo(5.5, 8.5); ctx.lineTo(0, 7); ctx.lineTo(5.5, 5.5); ctx.closePath(); ctx.fill();
        b._baseTexture.update();
        return (sparkleCache[color] = b);
    }
    Scene_QuestBoard.prototype.sparkles = function(x, y, n, color) {
        for (let i = 0; i < n; i++) {
            const s = new Sprite(sparkleBitmap(color));
            s.anchor.set(0.5, 0.5);
            s.x = x; s.y = y;
            const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 2.5;
            s._vx = Math.cos(a) * v; s._vy = Math.sin(a) * v - 1; s._g = 0.08; s._life = 22 + Math.floor(Math.random() * 12);
            s.scale.set(0.6 + Math.random() * 0.6, 0.6 + Math.random() * 0.6);
            this._fx.addChild(s);
        }
    };
    Scene_QuestBoard.prototype.floatText = function(text, x, y, color) {
        const probe = new Bitmap(8, 8);
        probe.fontSize = 24;
        const w = Math.ceil(probe.measureTextWidth(text)) + 20, b = new Bitmap(w, 34);
        b.fontSize = 24;
        b.textColor = color;
        b.outlineColor = "rgba(0,0,0,0.9)";
        b.outlineWidth = 4;
        b.drawText(text, 0, 0, w, 34, "center");
        const s = new Sprite(b);
        s.anchor.set(0.5, 0.5);
        s.x = x; s.y = y; s._vx = 0; s._vy = -0.7; s._g = 0; s._life = 80;
        this._fx.addChild(s);
    };
    Scene_QuestBoard.prototype.banner = function(text) {
        const S = U(), probe = new Bitmap(8, 8);
        probe.fontSize = 24;
        const w = Math.ceil(probe.measureTextWidth(text)) + 60, b = new Bitmap(w, 48), ctx = b.context;
        if (S.panel) S.panel(ctx, 0, 0, w, 48, { cut: 6 });
        b.fontSize = 24;
        b.textColor = S.accent;
        b.outlineWidth = 0;
        b.drawText(text, 0, 7, w, 34, "center");
        const s = new Sprite(b);
        s.anchor.set(0.5, 0.5);
        s.x = L.slate[0] + (L.slate[2] - L.slate[0]) / 2;
        s.y = L.slate[1] - 30;
        s._vx = 0; s._vy = -0.15; s._g = 0; s._life = 150;
        this._fx.addChild(s);
    };

    // ---- the first time: Borgar explains the board
    const BORGAR_BUST = "People3_5";   // (the bust Borgar has in talks, SpeechBubbles.js; 330 x 350, facing left)
    const TUTORIAL = [
        "Tu ludzie z okolicy wieszają swoje prośby. Zerwiesz kartkę - bierzesz robotę. Płacą złotem, a dobra robota niesie się po wsi: im większa twoja sława w tawernie, tym lepiej płatne zlecenia.",
        "Najwyżej trzy naraz, bo się nie wyrobisz. Każde ma termin - nie zdążysz, cała wieś się dowie. Robotę oddajesz tutaj, przy tablicy. Co trzy dni wieszam nowe kartki."
    ];
    Scene_QuestBoard.prototype.showTutorial = function() {
        this.mode = "tutorial";
        this._tutPage = 0;
        this.drawTutorial();
        this.drawHints();
    };
    Scene_QuestBoard.prototype.drawTutorial = function() {
        const b = this._overlay.bitmap, ctx = b.context, S = U(), W = b.width, H = b.height;
        b.clear();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, W, H);
        // Borgar's bust at the bottom right, facing the panel on its left (as in the talks)
        const bust = img(this.A.bust), bh = 300, bw = bust ? Math.round(this.A.bust.width * bh / this.A.bust.height) : 0;
        const pw = 820, ph = 168, px = W - bw - pw + 20, py = H - ph - 52;
        if (S.panel) S.panel(ctx, px, py, pw, ph, { cut: 8 });
        else { ctx.fillStyle = S.fill; ctx.fillRect(px, py, pw, ph); }
        ctx.fillStyle = "rgba(11,12,15,0.9)";   // the tail towards the bust
        ctx.beginPath(); ctx.moveTo(px + pw - 1, py + 50); ctx.lineTo(px + pw + 18, py + 62); ctx.lineTo(px + pw - 1, py + 76); ctx.closePath(); ctx.fill();
        if (bust) {
            ctx.save();
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(bust, 0, 0, this.A.bust.width, this.A.bust.height, W - bw - 8, H - bh, bw, bh);
            ctx.restore();
        }
        ctx.font = F.ui(15, true);
        ctx.fillStyle = S.accent;
        ctx.textAlign = "left";
        spaced(ctx, "BORGAR", px + 30, py + 38, 2, "left");
        ctx.font = F.ui(21, false);
        ctx.fillStyle = S.text;
        const lines = wrap(ctx, TUTORIAL[this._tutPage], pw - 60);
        lines.forEach((l, i) => ctx.fillText(l, px + 30, py + 70 + i * 28));
        ctx.font = F.ui(16, false);
        ctx.fillStyle = S.muted;
        ctx.textAlign = "right";
        ctx.fillText((this._tutPage + 1) + "/" + TUTORIAL.length + "   O - dalej", px + pw - 22, py + ph - 16);
        b._baseTexture.update();
        this._overlay.visible = true;
    };
    Scene_QuestBoard.prototype.updateTutorial = function() {
        if (Input.isTriggered("ok") || Input.isTriggered("cancel") || TouchInput.isTriggered()) {
            SoundManager.playOk();
            this._tutPage++;
            if (this._tutPage >= TUTORIAL.length) {
                data().tutorial = true;
                this._overlay.visible = false;
                this.mode = "browse";
                this.drawHints();
            } else this.drawTutorial();
        }
    };

    // ------------------------------------------------------------------
    // The journal: the "Zlecenia" tab and following one contract in the goal window (Journal.js exports addTab /
    // addTrackerSource)
    // ------------------------------------------------------------------
    function trackLine(n) {
        if (isReady(n)) return "Gotowe! Oddaj przy tablicy w tawernie.";
        const lack = n.req.filter(q => !rowDone(q)).slice(0, 2).map(q => reqName(q) + " " + Math.min(have(q), q.n) + "/" + q.n);
        return lack.join(" · ") + " · " + daysText(n);
    }
    function journalItems() {
        if (!hasState()) return [{ label: "Brak zleceń", mark: "locked", dim: true, empty: true }];
        const d = data(), out = [];
        for (const n of activeList()) {
            const q = n.req.find(r => !rowDone(r)) || n.req[0];
            out.push({ label: n.title, icon: q.k === "item" ? iconOf(q.id) : iconOf(BEASTS[q.kind].icon), mark: isReady(n) ? "ready" : d.track === n.id ? "pin" : "todo",
                right: isReady(n) ? "gotowe" : Math.max(0, daysLeft(n)) + " " + dniWord(Math.max(0, daysLeft(n))), contract: n });
        }
        for (const h of d.history.slice(0, 15)) {
            const q = (h.req || [])[0];
            out.push({ label: h.title, icon: q ? (q.k === "item" ? iconOf(q.id) : iconOf(BEASTS[q.kind].icon)) : 0, mark: h.state === "done" ? "done" : "locked",
                right: (h.state === "done" ? "dz. " : h.state === "failed" ? "przepadło, dz. " : "porzucone, dz. ") + h.day, dim: true, hist: h });
        }
        if (!out.length) out.push({ label: "Brak zleceń", mark: "locked", dim: true, empty: true });
        return out;
    }
    function journalOps(it) {
        if (!it || it.empty) {
            return [{ k: "title", text: "Zlecenia" }, { k: "rule" },
                { k: "p", text: "Tu zobaczysz zlecenia z tablicy w tawernie „Pod Złotym Kuflem”: co trzeba przynieść albo upolować, do kiedy i za ile. Tablica wisi w sieni tawerny." }];
        }
        if (it.hist) {
            const h = it.hist, G = GIVERS[h.giver];
            return [{ k: "title", text: h.title }, { k: "sub", text: (G ? G.name + ", " + G.role : "") + "  ·  dzień " + h.day }, { k: "rule" },
                { k: "p", text: h.state === "done" ? "Wykonane. Zapłata: " + h.gold + " G, " + h.xp + " dośw., sława +" + h.rep + "." : h.state === "failed" ? "Termin minął. Sława " + h.rep + "." : "Porzucone. Sława " + h.rep + "." }];
        }
        const n = it.contract, G = GIVERS[n.giver], d = data();
        const ops = [{ k: "title", text: n.title, icon: it.icon }, { k: "sub", text: G.name + ", " + G.role + "  ·  " + (isReady(n) ? "gotowe do oddania" : "do dnia " + n.due + " (" + daysText(n) + ")") }, { k: "rule" },
            { k: "p", text: n.text }, { k: "gap", n: 8 }, { k: "h", text: "Potrzeba" }];
        for (const q of n.req) {
            const src = q.k === "item" && window.Journal && Journal.sourceLines ? (Journal.sourceLines(q.id)[0] || "") : "";
            ops.push({ k: "cost", icon: q.k === "item" ? iconOf(q.id) : iconOf(BEASTS[q.kind].icon), name: reqName(q) + (q.map ? " (" + placeName(q.map) + ")" : ""), have: Math.min(have(q), q.n), need: q.n,
                note: q.k === "item" && have(q) < q.n ? src : q.k === "bounty" ? "Grasuje " + placeWhere(q.map) + ", " + BOUNTIES[q.key].hint + "." : "" });
        }
        ops.push({ k: "gap", n: 8 }, { k: "h", text: "Nagroda" },
            { k: "row", text: n.gold + " G  ·  " + n.xp + " dośw.  ·  sława +" + n.rep + (n.gift ? "  ·  " + itemName(n.gift[0]) + " ×" + n.gift[1] : "") });
        ops.push({ k: "gap", n: 8 }, { k: "muted", text: "Oddajesz je przy tablicy zleceń w tawernie „Pod Złotym Kuflem”. " + (d.track === n.id ? "Śledzisz je w okienku celu. OK: przestań śledzić." : "OK: śledź je w okienku celu na ekranie.") });
        return ops;
    }
    if (window.Journal && Journal.addTab) {
        Journal.addTab({
            name: "Zlecenia",
            items: () => journalItems(),
            detail: it => ({ ops: journalOps(it) }),
            legend: () => { const d = hasState() ? data() : { rep: 0, stats: { done: 0 } }; return "Sława " + d.rep + "/100  ·  " + TIERS[repTier(d.rep)].name + "  ·  wykonane: " + d.stats.done; },
            help: "OK: śledź na ekranie   ←/→: zakładka",
            ok: it => { if (it && it.contract && it.contract.state === "active") { track(data().track === it.contract.id ? null : it.contract.id); SoundManager.playOk(); } }
        });
    }
    if (window.Journal && Journal.addTrackerSource) {
        Journal.addTrackerSource(() => {
            if (!hasState()) return null;
            const d = data();
            if (!d.track) return null;
            const n = find(d.track);
            if (!n || n.state !== "active") { d.track = null; return null; }
            const line = trackLine(n);
            return { label: "ZLECENIE", title: n.title, line, key: n.id + "|" + line };
        });
    }

    // ------------------------------------------------------------------
    // Saving, plugin commands, the API
    // ------------------------------------------------------------------
    const _extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _extractSaveContents.call(this, contents);
        if ($gameSystem && $gameSystem._quests) data();   // (fills in what an older save lacks)
    };
    function addRep(k) {
        const d = data();
        d.rep = clamp(d.rep + (Number(k) || 0), 0, 100);
        return d.rep;
    }
    PluginManager.registerCommand(PLUGIN, "open", () => open());
    PluginManager.registerCommand(PLUGIN, "addRep", args => addRep(args.amount));

    window.Scene_QuestBoard = Scene_QuestBoard;
    window.QuestBoard = {
        open,
        active: () => activeList(),
        board: () => (hasState() ? data().board : []),
        accept: id => accept(id),
        turnIn: (id, opts) => turnIn(id, opts),
        abandon: id => abandon(id),
        reputation: () => (hasState() ? data().rep : 0),
        tier: () => repTier(hasState() ? data().rep : 0),
        tierNow: () => tierNow(),
        addRep,
        refresh: seed => { const d = data(); newBoard(seed === undefined ? (Math.random() * 4294967296) >>> 0 : seed >>> 0, cycleOf(today())); return d.board; },
        onComplete: fn => { listeners.push(fn); },
        track, isReady: id => isReady(find(id)), progress: id => { const n = find(id); return n ? n.req.map(q => [have(q), q.n]) : null; },
        find, post, failDue, checkCycle, cycleOf, spawnBounty, isBoardEvent, generate, state: () => data(),
        TEMPLATES, GIVERS, TIERS, BOUNTIES, BEASTS, SLOTS, EV, LAYOUT: L, MAX_ACTIVE, REFRESH_DAYS, Scene_QuestBoard
    };
})();
