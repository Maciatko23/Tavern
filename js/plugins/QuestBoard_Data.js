//=============================================================================
// QuestBoard_Data.js
//=============================================================================
// The quest board's tables (split out of QuestBoard.js, 2026-09-29): the notices' templates, the people who pin them, the animals
// and the wanted posters, what the goods are worth, Borgar's words. Only data - QuestBoard.js reads it when it needs it (so this
// file may come before or after it; registered: right above QuestBoard, as Farming_Data above Farming).

/*:
 * @target MZ
 * @plugindesc Dane tablicy zleceń (QuestBoard.js): wzory ogłoszeń, zleceniodawcy, zwierzęta i listy gończe, wartość towarów, słowa Borgara. Sam nic nie robi. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base QuestBoard
 * @orderBefore QuestBoard
 *
 * @help
 * ============================================================================
 * QuestBoard_Data.js - dane tablicy zleceń
 * ============================================================================
 * Same tabele dla QuestBoard.js (wydzielone z niego): wzory ogłoszeń
 * (TEMPLATES), zleceniodawcy (GIVERS), zwierzęta (BEASTS), miejsca polowań
 * (PLACES), listy gończe (BOUNTIES), ile wart jest towar (EV, KILL_EV, BASE),
 * napisy rodzajów pracy i słowa Borgara przy pierwszej wizycie.
 * Nowe ogłoszenie dopisuje się TUTAJ. Parametry ma QuestBoard.js.
 *
 * KOLEJNOŚĆ: tuż nad QuestBoard (QuestBoard_Data, QuestBoard, QuestBoard_Art,
 * QuestBoard_Scene). Bez tego pliku tablica nie ma ogłoszeń.
 * ============================================================================
 */

(() => {
    "use strict";
    const TW = window.Tawerna;
    if (!TW) throw new Error("QuestBoard_Data.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    // (the family's shared bag: QuestBoard.js and its parts; whichever file comes first makes it)
    const P = TW.api("QuestBoard_parts") || TW.register("QuestBoard_parts", {});
    if (P.data) return;   // (put into the page twice: kept as it was)

    // what a notice pays on top of the goods' worth, by its kind
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
    // places for the hunts: the name and "where" (Polish locative)
    const PLACES = { 4: ["Łąka", "na łące"], 20: ["Podwórze dziadka", "na podwórzu dziadka"], 21: ["Leśna droga", "na Leśnej drodze"], 22: ["Polna droga", "na Polnej drodze"],
        23: ["Skraj lasu", "na Skraju lasu"], 8: ["Okolice Tawerny", "koło tawerny"] };

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
    const TYPE_LABEL = { deliver: "DOSTAWA", craft: "ZAMÓWIENIE", gather: "ZBIERACTWO", hunt: "POLOWANIE", bounty: "POSZUKIWANY", story: "OGŁOSZENIE" };

    // the first visit: Borgar explains the board
    const BORGAR_BUST = "People3_5";   // (the bust Borgar has in talks, SpeechBubbles.js; 330 x 350, facing left)
    const TUTORIAL = [
        "Tu ludzie z okolicy wieszają swoje prośby. Zerwiesz kartkę - bierzesz robotę. Płacą złotem, a dobra robota niesie się po wsi: im większa twoja sława w tawernie, tym lepiej płatne zlecenia.",
        "Najwyżej trzy naraz, bo się nie wyrobisz. Każde ma termin - nie zdążysz, cała wieś się dowie. Robotę oddajesz tutaj, przy tablicy. Co trzy dni wieszam nowe kartki."
    ];

    P.data = { BASE, EV, KILL_EV, GIVERS, BEASTS, PLACES, BOUNTIES, TEMPLATES, TYPE_LABEL, BORGAR_BUST, TUTORIAL };
})();
