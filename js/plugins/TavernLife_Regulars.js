//=============================================================================
// TavernLife_Regulars.js
//=============================================================================
// The tavern's regulars as people one talks to (the user, 2026-10-06: "rób wszystko"): Melia Srebrogłosa, Dziadek Ozzy and Grum
// Żelazna Pięść (Map001's events 2-4, found by TavernLife's NPCS) answer the action button with a talk of their own. First the town's
// quests speak (TownQuests.regularTalk: an offer, a hand-in, a reminder, a remark after what happened), then the greeting (by the
// hour and by how far they trust the hero) and a menu: what is new (the hour, the weather, the drought, the grandfather's debt), the
// rumours (from what really goes on: the quests' flags, the market, the ferry, the refugees), their own topics (Melia's songs and
// where she knows them from, a beer for Ozzy - and his "vision", tomorrow's weather read from the plan, Grum's war and his
// mountains, a game with Grum) and a farewell. Each in a voice of their own: Melia poetic, Ozzy a drunk old man who knows too much,
// Grum a mercenary of few words. Ozzy sleeps in the hall at night (a mumble, no menu).
// Trust ("Zaufanie", 0-100, five tiers): the first talk of a day, a beer for Ozzy, a song heard, a game with Grum or Ozzy (each
// once a day and only up to a point) - and the quests (TownQuests reward.trust). Deeper topics wait for it. The state: TavernLife's
// store, field "regulars". API on TavernLife: regular(interp), regularMenu, regularTopic, regularOf(ev), trust(role),
// addTrust(role, n, why), trustTier(role), regularsInfo(), REGULARS.

/*:
 * @target MZ
 * @plugindesc Stali bywalcy tawerny (część TavernLife.js): Melia, Dziadek Ozzy i Grum jako rozmówcy - powitania, co słychać, plotki, własne tematy, zaufanie. v1.0.0
 * @author Claude
 * @base TavernLife
 * @orderAfter TavernLife
 *
 * @help
 * ============================================================================
 * TavernLife_Regulars.js - stali bywalcy jako rozmówcy
 * ============================================================================
 * Część TavernLife.js. Melia, Dziadek Ozzy i Grum (zdarzenia 1-4 na mapie
 * tawerny, rozpoznawane po imieniu) zamiast jednego zdania mają rozmowę:
 * najpierw sprawy zadań (TownQuests), potem powitanie i menu tematów:
 * „Co słychać?”, „Jakieś plotki?”, tematy własne każdej postaci i
 * pożegnanie. Zaufanie (0-100: Obcy, Znajomy, Kompan, Przyjaciel,
 * Powiernik) rośnie od rozmów, piwa dla Ozzy'ego, pieśni Melii, gier z
 * Grumem i od zadań; głębsze tematy otwierają się z zaufaniem. Stan
 * w dzienniku: Miasteczko - Stali bywalcy tawerny.
 *
 * KOLEJNOŚĆ: pod TavernLife.js (najlepiej za jego innymi częściami).
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("TavernLife_Regulars.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const TL = T.api("TavernLife");
    if (!TL || !TL.lib) throw new Error("TavernLife_Regulars.js: brak TavernLife.js - musi być nad tą wtyczką na liście (TavernLife is missing)");
    const lib = TL.lib;
    const { C, q, S, npc, NPCS, say, sayAs, heroSay, script, run, day, hour, hash, popup, gold, needGold, bark, GOOD, notice } = lib;
    const TAVERN = 1;
    const ROLES = ["melia", "ozzy", "grum"];
    const BEER = 81, BEER_PRICE = 3;

    // ------------------------------------------------------------------
    // Trust: 0-100 per regular, five tiers; what everyday things give stops at a cap (the rest comes from deeds - the quests)
    // ------------------------------------------------------------------
    const TIERS = [
        { at: 0, name: "Obcy" }, { at: 15, name: "Znajomy" }, { at: 35, name: "Kompan" }, { at: 60, name: "Przyjaciel" }, { at: 85, name: "Powiernik" }
    ];
    const CAPS = { chat: 30, song: 40, beer: 50, game: 45, win: 50 };
    function rec(role) {
        const s = S(), all = s.regulars || (s.regulars = {});
        return all[role] || (all[role] = { trust: 0, day: 0, n: 0, said: {}, rum: [], got: {}, vis: 0, topics: {} });
    }
    const trust = role => (window.$gameSystem ? rec(role).trust : 0);
    function tierOf(v) { let i = 0; TIERS.forEach((t, k) => { if (v >= t.at) i = k; }); return i; }
    const trustTier = role => tierOf(trust(role));
    // n trust for `why`; kind: a daily source (once a day, up to its cap) or none (a deed: always)
    function addTrust(role, n, why, kind) {
        if (!window.$gameSystem || !REGULARS[role] || !n) return 0;
        const r = rec(role);
        if (kind) {
            if (r.got[kind] === day() || r.trust >= (CAPS[kind] || 100)) return 0;
            r.got[kind] = day();
            n = Math.min(n, (CAPS[kind] || 100) - r.trust);
        }
        const before = r.trust;
        r.trust = Math.max(0, Math.min(100, before + n));
        const got = r.trust - before;
        if (!got) return 0;
        const tb = tierOf(before), ta = tierOf(r.trust);
        if (ta !== tb && ta > tb) notice(REGULARS[role].name + ": " + TIERS[ta].name.toLowerCase(), REGULARS[role].tierText[ta]);
        T.emit("regularTrust", { role, trust: r.trust, change: got, why: String(why || ""), tier: ta });
        return got;
    }

    // ------------------------------------------------------------------
    // What they know of the world now (all read, nothing changed)
    // ------------------------------------------------------------------
    const TQ = () => T.api("TownQuests");
    const flags = () => { const Q = TQ(); try { return (Q && Q.state && Q.state().flags) || {}; } catch (e) { return {}; } };
    const clue = k => { const Q = TQ(); try { return !!(Q && Q.state && Q.state().clues[k]); } catch (e) { return false; } };
    const qDone = id => { const Q = TQ(); return !!(Q && Q.isDone && Q.isDone(id)); };
    const qRec = id => { const Q = TQ(); return Q && Q.rec ? Q.rec(id) : null; };
    const gone = k => !!T.call("TownLife", "gone", k);
    const dryDays = () => Number(T.call("TownQuests", "dryDays")) || 0;
    const isMarket = d => { const Q = TQ(); return Q && Q.isMarket ? !!Q.isMarket(d) : d % 7 === 0; };
    const isFerry = d => { const Q = TQ(); return Q && Q.isFerry ? !!Q.isFerry(d) : (d - 1) % 3 === 0; };
    const fame = () => { const QB = T.api("QuestBoard"); try { return QB && QB.reputation ? Number(QB.reputation()) || 0 : 0; } catch (e) { return 0; } };
    function weatherNow() {
        const Sv = T.api("Survival"), d = day(), h = hour();
        if (Sv && Sv.stormLevel && Sv.stormLevel(d, h) > 0) return "storm";
        const w = Sv && Sv.currentWeather ? Sv.currentWeather() : null;
        if (w) return w.type === "snow" ? "snow" : "rain";
        return null;
    }
    function debt() {
        const St = T.api("Story");
        try {
            if (!St || !St.active || !St.active() || !St.state()) return null;
            const s = St.state();
            return { left: St.left(), days: St.daysLeft(), paid: s.paid, debt: s.debt, done: !!s.done };
        } catch (e) { return null; }
    }
    const slot = h => (h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "evening" : "night");
    const asleep = role => role === "ozzy" && (hour() >= 23 || hour() < 6);
    // the hour as said: "o trzeciej po południu", "o ósmej rano"
    const ORD = ["dwunastej", "pierwszej", "drugiej", "trzeciej", "czwartej", "piątej", "szóstej", "siódmej", "ósmej", "dziewiątej", "dziesiątej", "jedenastej"];
    function hourWords(h) {
        const H = Math.floor(h) % 24, part = H < 5 ? " w nocy" : H < 11 ? " rano" : H < 13 ? " w południe" : H < 18 ? " po południu" : " wieczorem";
        return "o " + ORD[H % 12] + (H === 12 ? "" : part);
    }

    // ------------------------------------------------------------------
    // THE REGULARS: names, how they greet (by trust tier: 0..4), what they say, their rumours and topics
    // ------------------------------------------------------------------
    const REGULARS = {
        melia: {
            name: "Melia", full: "Melia Srebrogłosa", title: "pieśniarka",
            tierText: ["", "Melia zapamiętała twoją twarz.", "Melia nazywa cię swoim słuchaczem.", "Melia ci ufa - opowie więcej.", "Melia powierza ci to, czego nie śpiewa nikomu."],
            greet: [["O, nowa twarz. Wędrowiec? Każdy wędrowiec to niedokończona ballada.", "Witaj, wędrowcze. Siadaj bliżej - z daleka pieśń brzmi gorzej."],
                ["A, to ty! Ten od pola za lasem. Pamiętam twarze - to połowa mojej roboty.", "Znowu ty, złotko? Dobrze. Lubię stałą publiczność."],
                ["Mój ulubiony słuchacz! Siadaj, zanim Ozzy zajmie ci miejsce.", "Jesteś! Czekałam, aż ktoś mi opowie coś, czego nie ma w żadnej balladzie."],
                ["Przyjacielu... Kiedy wchodzisz, w sali robi się cieplej. Nie śmiej się.", "Ty jeden słuchasz słów, a nie tylko melodii. Chodź, siadaj."],
                ["Wiesz, że o tobie też kiedyś zaśpiewam? Tylko jeszcze nie wiem, jak się ta pieśń skończy.", "Moja lutnia i ja - obie nastrojone pod ciebie. No, prawie."]],
            again: ["Coś jeszcze, złotko?", "Tak? Słucham - ja też czasem słucham, wiesz?", "Mów, mów. Pieśń poczeka."],
            bye: ["Niech ci droga śpiewa, złotko.", "Wracaj wieczorem. Zostawię ci miejsce pod sceną.", "Idź, idź. Tylko nie zapomnij, co ci mówiłam."],
            heroBye: "Bywaj, Melio.",
            talk: {
                morning: ["Rano struny są zimne jak rosa. Ja też. Daj mi chwilę, zanim się nastroję.", "Pół nocy szukałam rymu do „sakiewki”. Znalazłam „konewki”. Nie pytaj.",
                    "Borgar już krzyczy na kuchnię. Słychać, że dzień się zaczął - jak w każdej dobrej balladzie, od krzyku."],
                day: ["Popołudnie to najgorsza pora dla pieśni. Ludzie są albo głodni, albo śpiący.", "Przepisuję stare słowa na nowe nuty. Czasem mam wrażenie, że to one przepisują mnie.",
                    "Widziałeś, jak kurz tańczy w słońcu przy oknie? Gdybym umiała to zaśpiewać, byłabym sławna."],
                evening: ["Wieczór! Moja pora. Sala się zapełnia, a ludzie robią się szczerzy po drugim kuflu.", "Od szóstej śpiewam. Przyjdź pod scenę - dla ciebie zaśpiewam głośniej.",
                    "Grum znowu siłuje się z każdym, kto ma dwie ręce. A ja śpiewam tym, co mają dwoje uszu."],
                night: ["Noc... Sala pusta, świece dogasają. Najlepsze pieśni przychodzą właśnie teraz. I najgorsze sny.", "Nie śpisz? Ja też nie. Lutnia mruczy mi do snu, ale dziś coś nie chce.",
                    "Ozzy chrapie w kącie jak niedźwiedź w gawrze. Ładnie się przy tym śpiewa, wiesz?"],
                rain: ["Słyszysz deszcz o okiennice? To najstarszy bęben świata. Wystaw garnki, póki leje!", "Deszcz! Ludzie biegną z wiadrami na rynek jak do kościoła. Napisałabym o tym pieśń, ale wyszłaby za smutna."],
                storm: ["Burza! Kiedy grzmi, pieśni przychodzą same. Albo uciekają - nigdy nie wiadomo.", "Grzmi tak, że lutnia drży mi na kolanach. Posiedź, póki nie przejdzie."],
                snow: ["Śnieg... Na kontynencie mówią, że w śniegu słychać to, co ktoś kiedyś powiedział. Ja słyszę tylko zimno."],
                drought: ["Tyle dni bez deszczu... Nawet słowa mi wysychają. Ludzie piją piwo zamiast wody, a potem dziwią się, że płaczą przy balladach.",
                    "Susza. Ziemia pęka jak stara struna. Ktoś musi o tym zaśpiewać, zanim wszyscy zapomną, jak brzmi deszcz."],
                debtNear: ["Słyszałam o długu twojego dziadka. Lord ma dwór z kamieni i serce do kompletu. Trzymaj się, złotko.",
                    "Termin u Lorda tuż-tuż, prawda? Widać ci to po oczach. Gdyby pieśnią dało się płacić, zaśpiewałabym za ciebie."],
                debtPaid: ["Spłaciłeś Lorda! Cała sala o tym mówiła. Ułożę pieśń: „Wnuk, co pole wykupił”. Albo coś krótszego."]
            },
            rumours: [
                { id: "kubaWater", when: () => !qRec("W1"), text: "Kuba Woziwoda nosi wodę, której w studni nie ma. Ludzie mówią: z nieba. Ja mówię: z czyjejś piwnicy." },
                { id: "kubaFled", when: () => !!flags().kubaFled, text: "Kuba uciekł z miasta! Hanka mówi, że wróci, jak mu sumienie wyschnie. Czyli prędko." },
                { id: "mill", when: () => !!flags().sluiceHalf, text: "Słyszysz młyn? Ruszył. Ludzie mówią, że ktoś odkręcił Lordowi wodę. Ktoś odważny. Albo głupi - w dobrej balladzie to jedno i to samo." },
                { id: "feliks", when: () => gone("feliks"), text: "Feliksa nie ma. Kamerdyner, a zniknął jak kamfora. Lord udaje, że nic się nie stało - i dobrze mu to wychodzi." },
                { id: "lucjan", when: () => !!flags().lucjanOut, text: "Ponoć wygoniłeś z targu oszusta od kości. Bartek opowiada o tym przy każdym piwie, za każdym razem w innej wersji." },
                { id: "purse", when: () => !!flags().k37Seen, text: "Ludzie gadają, że ktoś przytulił sakiewkę dworu. Nie patrz tak - ja tylko powtarzam." },
                { id: "market", when: () => isMarket(day() + 1), text: "Jutro targ. Przyjadą ludzie z dalszych wsi - zawsze ktoś z nich zna nową piosenkę. Kradnę je bez wstydu." },
                { id: "ferry", when: () => isFerry(day()), text: "Dziś przypłynął prom. Na sali nowe twarze. Jeden siedzi od rana nad jednym kuflem i patrzy na drzwi." },
                { id: "nameday", when: () => day() >= 26 && day() < 33, text: "Lord ma niedługo imieniny. Feliks już chodzi po mieście jak kogut przed jarmarkiem." },
                { id: "kupala", when: () => day() >= 35 && day() < 42, text: "Za parę dni Noc Kupały. Dziewczęta będą puszczać wianki na stawie za halą. W taką suszę - wianki na błocie." },
                { id: "camp", when: () => day() >= 10, text: "Pod murem stanęły namioty. Ludzie z kontynentu. Mała Ela ma oczy, w które trudno patrzeć." },
                { id: "fame", when: () => fame() >= 40, text: "Borgar mówi, że z tablicy zleceń zdejmujesz więcej kartek niż ktokolwiek. Rośnie ci sława, złotko." }
            ],
            evergreen: ["Ambroży dzwoni czasem o dziwnych porach. Ludzie myślą, że stary się myli. Ja myślę, że on liczy.",
                "Grum wypytuje każdego, kto przyjdzie od wschodu, o góry. Płaci za odpowiedzi piwem. Odpowiedzi są tańsze.",
                "Ozzy mówi, że jutro spadnie deszcz. Mówi to od trzech miesięcy. Kiedyś trafi - a wtedy wszyscy powiemy, że zawsze mu wierzyliśmy.",
                "Wanda z łaźni wie o wszystkich wszystko. Ludzie w gorącej wodzie gadają jak na spowiedzi.",
                "Pod podłogą tej sali są kamienie starsze niż miasto. Borgar nie lubi, kiedy się o tym mówi. Czyli jest o czym."]
        },
        ozzy: {
            name: "Dziadek Ozzy", full: "Dziadek Ozzy", title: "stały bywalec",
            tierText: ["", "Ozzy pamięta, kim jesteś. Prawie zawsze.", "Ozzy nazywa cię kompanem od kufla.", "Ozzy mówi ci rzeczy, których nie mówi nikomu.", "Ozzy ufa ci jak nikomu od sześćdziesięciu lat."],
            greet: [["*hep* Ktoś ty? A, nieważne. Wszyscy kiedyś tu przychodzą.", "Młody! Masz może grosika na piwo? Nie? Ech, młodzież..."],
                ["A, chłopak Stacha! *hep* Twój dziadek przesiadywał tu kiedyś co wieczór. Potem się ożenił. Głupiec.", "Znowu ty? Siadaj, siadaj. Stołek się nie obrazi."],
                ["Mój kompan od kufla! *hep* Siadaj, opowiem ci, jak to było z tą kozą.", "Synku! Dobrze, że jesteś. Borgar mi już nie nalewa na krechę."],
                ["Ty jesteś dobry chłopak. Ja to wiem. Ja wiem różne rzeczy. *hep*", "Przyjacielu... siadaj. Dziś widzę wyraźniej niż zwykle. To niedobry znak."],
                ["Synku... Tobie jednemu bym powiedział, gdybym pamiętał, co chciałem powiedzieć. *hep*", "Ty i ja, synku. Dwóch, co wiedzą za dużo. No, ty jeszcze nie. Jeszcze."]],
            again: ["*hep* Czego jeszcze?", "Mów, mów. Ucho mam jedno dobre.", "Hm? Jeszcze tu jesteś?"],
            bye: ["Idź, idź. *hep* Ja tu będę. Zawsze tu jestem.", "Uważaj na schody, synku. Na wszystkie schody.", "Idź z Bogiem. Albo z kimkolwiek. *hep*"],
            heroBye: "Bywaj, dziadku.",
            talk: {
                morning: ["Rano? *hep* Rano to ja jeszcze śpię. To, co widzisz, to moje ciało z przyzwyczajenia.", "Głowa mi pęka jak garnek na mrozie. Ale oczy widzą. Za dużo widzą.",
                    "Borgar mówi, że mam iść do domu. A ja mówię: to jest mój dom. Od czterdziestu lat ten sam stołek."],
                day: ["W południe cienie są najkrótsze. Wtedy najmniej widać. *hep* Najlepsza pora na piwo.", "Siedzę i liczę muchy. Dziewiętnaście. Jutro będzie dwadzieścia trzy. Zobaczysz.",
                    "Grzyby na ogień i piwo do dzbana - tego nauczył mnie ojciec. Reszty nauczyła mnie piwnica."],
                evening: ["Wieczorem sala gada, a ja słucham. Ludzie mówią jedno, a myślą drugie. *hep* Słyszę i to, i to.",
                    "Melia zaraz zaśpiewa. Przy tej o chłopcu z piwnicy zawsze płaczę. Ze śmiechu. Na pewno ze śmiechu.",
                    "Grum przegra dziś z kimś na rękę. Albo wygra. Jedno z dwojga, *hep*, na pewno."],
                night: ["Noc to dobra pora. Wtedy kamienie mówią. Słyszysz? Nie? Ja też nie. *hep* Kłamię.", "Śpij, synku. Ja popilnuję. Ktoś musi."],
                rain: ["Deszcz! A mówiłem? Mówiłem! *hep* Nie pamiętam, czy mówiłem. Ale wiedziałem.", "Leje! Wystaw garnek, synku, wystaw wiadro. Woda z nieba jest za darmo. Jedyna rzecz w tym mieście."],
                storm: ["Burza... Piorun lubi wysokie drzewa i głupich ludzi. *hep* Siedź tu.", "Słyszysz, jak grzmi? Tak samo grzmiało, kiedy wpadłem do piwnicy. Sześćdziesiąt lat temu. Może siedemdziesiąt."],
                snow: ["Śnieg... Zimą kamienie śpią głębiej. Wtedy łatwiej o nich zapomnieć."],
                drought: ["Ile dni bez deszczu? *hep* Ja wiem ile. I wiem, gdzie jest woda. Tylko nikt nie pyta.", "Sucho, synku. Sucho w ziemi, sucho w gardle. Z tych dwóch to drugie da się naprawić."],
                debtNear: ["Dług, dług... Lordowie liczą grosze, a nie widzą, na czym siedzą. *hep* Zdążysz, synku. Albo nie. Ale raczej zdążysz."],
                debtPaid: ["Spłacone? Hehe. Widziałem to we śnie. Wczoraj albo przedwczoraj. *hep*"]
            },
            sleep: ["Chrrr... *hep* ...co? Kto? A, to ty. Śniła mi się woda. Dużo wody. Pod ziemią.", "Chrrr... fiuuu... (Ozzy śpi na ławie z głową na stole. Uśmiecha się przez sen.)",
                "...nie ta cegła... trzecia od dołu... chrrr...", "(Ozzy mruczy coś przez sen i przewraca się na drugi bok. Ława trzeszczy.)"],
            rumours: [
                { id: "roses", when: () => !qRec("W1"), text: "Woda u Kuby pachnie różami. A róże rosną tylko tam, gdzie ktoś je podlewa. *hep* Pomyśl." },
                { id: "bell", when: () => !qRec("W2"), text: "Ambroży dzwoni o trzeciej w nocy. Trzy razy. Ludzie śpią. A dzwon nie dzwoni dla ludzi. *hep*" },
                { id: "garden", when: () => !!flags().gardenKey, text: "Byłeś w ogrodzie rycerzy, co? Pachniesz kamieniem i zakonem. *hep* Ja też tam byłem. Tylko pod spodem." },
                { id: "kubaFled", when: () => !!flags().kubaFled, text: "Kuba ucieka, a woda zostaje. *hep* Woda zawsze zostaje. Ludzie uciekają." },
                { id: "mill", when: () => !!flags().sluiceHalf, text: "Młyn ruszył. *hep* Słyszę go przez ściany. Ładnie śpiewa. Ładniej niż Melia - tylko jej nie mów." },
                { id: "feliks", when: () => gone("feliks"), text: "Kamerdynera nie ma? Ja wiedziałem, że go nie będzie. Wiedziałem już w zeszłym roku. *hep*" },
                { id: "stones", when: () => clue("lord_stones"), text: "Lord pyta o kamienie z krukiem. Niech pyta. Kamienie i tak mu nie odpowiedzą. Mnie odpowiadają. *hep*" },
                { id: "camp", when: () => day() >= 10, text: "Ludzie z promu szukają serca skały. Nie znajdą. *hep* Serce samo znajduje." },
                { id: "ferry", when: () => isFerry(day()), text: "Prom przypłynął. Trzech zeszło na ląd, a jeden z nich nie jest tym, za kogo się podaje. *hep* Nie pytaj który." }
            ],
            evergreen: ["Borgar trzyma nad barem pół klucza. Pół! Kto trzyma pół klucza? Ten, kto boi się całego. *hep*",
                "Grum to dobry chłop. Tylko płacą mu źli ludzie. *hep* Tak to bywa z najemnikami.",
                "Melia śpiewa rzeczy, których nie powinna znać. Ja też mówię rzeczy, których nie powinienem. Tylko ona ładniej.",
                "W piwnicy tej tawerny jedna cegła siedzi luźno. *hep* Albo dwie. Policz sam.",
                "Jak zobaczysz kruka na trzech kamieniach naraz - wracaj do domu. *hep* Nie pytaj, czemu."]
        },
        grum: {
            name: "Grum", full: "Grum Żelazna Pięść", title: "najemnik",
            tierText: ["", "Grum kiwa ci głową na powitanie.", "Grum mówi do ciebie pełnymi zdaniami. Czasem.", "Grum ma do ciebie zaufanie. Rzadka rzecz.", "Grum stanąłby za tobą w szyku."],
            greet: [["Hm.", "Czego?"], ["Ty. Siadaj albo idź.", "A, chudzielec od pola."], ["Siadaj. Piwo jest, gadać nie muszę.", "No. Jesteś."],
                ["Dobrze cię widzieć. Nie mów nikomu, że to powiedziałem.", "Siadaj, chłopcze. Masz łokieć - masz kompana."],
                ["Ty jeden tu nie kłamiesz. Chyba. Siadaj.", "Bracie od stołu. Mów."]],
            again: ["Coś jeszcze?", "No?", "Mów."],
            bye: ["Hm.", "Idź. Uważaj na plecy.", "Bywaj, chłopcze."],
            heroBye: "Bywaj, Grum.",
            talk: {
                morning: ["Rano się nie gada. Rano się ostrzy.", "Spałem trzy godziny. Wystarczy. Na wojnie spałem mniej.", "Borgar daje kaszę. Kasza jest dobra. Na wojnie nie było kaszy."],
                day: ["Czekam.", "Ludzie przychodzą od wschodu. Pytam. Nie wiedzą. Czekam dalej.", "Zrobiłbym coś. Ale nie ma co."],
                evening: ["Wieczór. Ktoś przegra dziś na rękę. Nie ja.", "Kości są uczciwsze od ludzi. Ale rzadziej.", "Sala pełna. Pilnuj sakiewki. Nie przede mną - przed tamtymi."],
                night: ["Śpię jednym okiem. Starczy.", "Nocą słychać, kto chodzi po murach. Kapral chodzi. I ktoś jeszcze.", "Idź spać, chłopcze."],
                rain: ["Deszcz. Drogi rozmokną. Dobrze. W błocie nikt za tobą nie pójdzie.", "Pada. Na wojnie deszcz znaczył: dziś nie atakują."],
                storm: ["Burza. Konie się płoszą, ludzie też. Siedź pod dachem.", "Piorun to jedyny wróg, z którym nie wygrasz. Szanuję."],
                snow: ["Śnieg. Ślady widać na milę. Dobra pora na polowanie. Zła na ucieczkę."],
                drought: ["Woda drożeje. Wojna zaczyna się od wody. Zapamiętaj.", "Sucho. Pod Wrzosową Przełęczą piliśmy z kałuż. Tu jeszcze nie jest tak źle. Jeszcze."],
                debtNear: ["Lord chce pieniędzy. Lordowie zawsze chcą. Zarób albo uciekaj. Ja bym zarobił."],
                debtPaid: ["Spłaciłeś. Dobrze. Wolny człowiek śpi lepiej."]
            },
            rumours: [
                { id: "wolves", when: () => day() >= 3 && !qDone("D5"), text: "Wilki chodzą pod bramą południową. Trzy, może cztery. Przewodnik jest siwy. Nie idź nocą sam." },
                { id: "camp", when: () => day() >= 10, text: "Prom przywozi ludzi z kontynentu. Połowa to uciekinierzy. Reszta udaje uciekinierów. Ci są groźni." },
                { id: "gold", when: () => day() >= 5, text: "Kupiec z kantoru płaci złotem z kontynentu. Świeżym. Kto ma świeże złoto w czasie wojny? Jedna ze stron." },
                { id: "wit", when: () => !flags().witDegraded, text: "Kapral bierze od wozów. Widziałem. Nic nie mówię. Nie moja wojna." },
                { id: "tourney", when: () => !qDone("D6") && isMarket(day() + 1), text: "Jutro targ. W targ czasem siłują się na rynku. Wygrywam. Beczka piwa. Przyjdź, zobaczysz." },
                { id: "lucjan", when: () => !!flags().lucjanOut, text: "Wyrzuciłeś szulera z targu. Dobrze. Nie lubię oszustów. Uczciwie przegrać umiem." },
                { id: "ambush", when: () => !!flags().w1Ambushed, text: "Napadli cię na Polnej. W kapturach. Następnym razem weź pałkę. Albo mnie." },
                { id: "ambushWon", when: () => !!flags().w1AmbushWon, text: "Na Polnej leżeli ludzie w kapturach. Ktoś ich przetrzepał. Bosy, mówią. Hm. Dobra robota. Kto im płacił?" },
                { id: "cistern", when: () => !!flags().cisternOpen, text: "Studnia pełna. Ktoś dzwonił cztery i dwa, a pod rynkiem zaszumiało. Na kontynencie by za to zabili. Tu stawiają piwo." },
                { id: "feliks", when: () => gone("feliks"), text: "Kamerdynera nie ma. Ktoś mu dał wybór: zniknąć albo zniknąć. Dobrze wybrał." }
            ],
            evergreen: ["Na wschodzie są góry. W górach jaskinie. W jaskiniach ludzie, którzy nie wyszli. Tyle wiem.",
                "Ludzie z kontynentu kupują stare kamienie z krukiem. Płacą dobrze. Nie pytam za co.",
                "Ozzy gada bzdury. Tylko czemu te bzdury się sprawdzają?",
                "Melia śpiewa o skale. Ja byłem pod niejedną skałą. Żadna nie śpiewała.",
                "Dwór Lorda ma straż w barwach. Barwy nowe. Straż stara. Dziwne."]
        }
    };

    // ------------------------------------------------------------------
    // Which event is which regular (the tavern only): TavernLife's NPCS (by name, else by look)
    // ------------------------------------------------------------------
    let roleCache = { map: null, ids: {} };
    function regularOf(ev) {
        if (!ev || !$gameMap || $gameMap.mapId() !== TAVERN) return null;
        if (roleCache.map !== $gameMap) {
            roleCache = { map: $gameMap, ids: {} };
            for (const role of ROLES) { const e = npc(role); if (e) roleCache.ids[e.eventId()] = role; }
        }
        const role = roleCache.ids[ev.eventId()];
        return role && $gameMap.event(ev.eventId()) === ev ? role : null;
    }
    const STUB = [C(355, ["TavernLife.regular(this)"]), C(0, [])];
    const _Game_Event_list = Game_Event.prototype.list;
    Game_Event.prototype.list = function() {
        if (window.$gameMap && $gameMap.mapId() === TAVERN && this._trigger !== 3 && this._trigger !== 4 && regularOf(this)) return STUB;
        return _Game_Event_list.call(this);
    };

    // ------------------------------------------------------------------
    // The talk: the quests first, then the greeting and the menu
    // ------------------------------------------------------------------
    const R0 = role => REGULARS[role];
    const said = (role, list, key) => { const r = rec(role), n = r.topics[key] || 0; r.topics[key] = n + 1; return list[n % list.length]; };
    // what is new: the weather, the drought, the debt first; else the hour's lines in turn
    function newsLine(role) {
        const t = R0(role).talk, w = weatherNow(), dbt = debt();
        if (w && t[w]) return said(role, t[w], "w:" + w);
        if (dbt && dbt.done && t.debtPaid && !rec(role).topics.debtPaid) return said(role, t.debtPaid, "debtPaid");
        if (dbt && !dbt.done && dbt.days <= 7 && dbt.left > 0 && t.debtNear && rec(role).topics["debt:" + day()] === undefined) { rec(role).topics["debt:" + day()] = 1; return pickDay(t.debtNear, role); }
        if (dryDays() >= 6 && t.drought && rec(role).topics["dry:" + day()] === undefined) { rec(role).topics["dry:" + day()] = 1; return pickDay(t.drought, role); }
        const sl = slot(hour());
        return said(role, t[sl] || t.day, "s:" + sl);
    }
    const pickDay = (list, role) => list[Math.floor(hash(day(), role.length) * list.length) % list.length];
    // a rumour: the first true one not told yet; then the old ones in turn
    function rumourLine(role) {
        const r = rec(role), d = R0(role);
        for (const m of d.rumours) {
            let ok = false;
            try { ok = !!m.when(); } catch (e) { ok = false; }
            if (ok && !r.rum.includes(m.id)) { r.rum.push(m.id); return m.text; }
        }
        return said(role, d.evergreen, "evergreen");
    }
    function greeting(role) {
        const r = rec(role), d = R0(role);
        if (r.day !== day()) {
            r.day = day();
            addTrust(role, 1, "rozmowa", "chat");
            return pickDay(d.greet[tierOf(r.trust)], role);
        }
        return said(role, d.again, "again");
    }
    // the action button at a regular
    function regular(interp) {
        const ev = interp && $gameMap.event(interp.eventId()), role = regularOf(ev);
        if (!role) return;
        const out = [], Q = TQ();
        let qt = null;
        try { qt = Q && Q.regularTalk ? Q.regularTalk(role, ev) : null; } catch (e) { console.error(e); qt = null; }
        if (asleep(role)) {   // (Ozzy sleeps in the hall: only what a quest wants of him now, else a mumble)
            if (qt && qt.kind === "ready") { run(interp, qt.list); return; }
            sayAs(out, role, said(role, R0(role).sleep, "sleep"));
            run(interp, out);
            return;
        }
        if (qt && qt.list && qt.list.length) {
            for (const c of qt.list) out.push(c);
            if (qt.pop) qt.pop();
            if (rec(role).day !== day()) { rec(role).day = day(); addTrust(role, 1, "rozmowa", "chat"); }   // (the quest's talk was the greeting)
        }
        script(out, "TavernLife.regularMenu(this, " + q(role) + ", " + (qt && qt.list && qt.list.length ? 1 : 0) + ")");
        run(interp, out);
    }
    // the menu: options by the hour, the trust and the quests; each topic comes back to it, the farewell ends the talk
    function menuOptions(role) {
        const tr = trust(role), h = hour(), o = [["news", "Co słychać?"], ["rumour", "Jakieś plotki?"]];
        if (role === "melia") {
            o.push(["songs", "Opowiedz o swoich pieśniach."]);
            if (tr >= 35) o.push(["origin", "Skąd znasz te ballady?"]);
            if (lib.inSongHours() && S().songDay !== day() && !lib.meliaAway()) o.push(["sing", "Zaśpiewasz dziś?"]);
        } else if (role === "ozzy") {
            o.push(["beer", "Postaw mu piwo (" + BEER_PRICE + " G)"]);
            if (tr >= 35) o.push(["cellar", "Opowiedz o piwnicy."]);
        } else if (role === "grum") {
            o.push(["war", "Opowiedz o wojnie."]);
            if (tr >= 15) o.push(["home", "Skąd jesteś?"]);
            o.push(["play", "Zagrajmy w coś."]);
        }
        // the quests' own topics (K27: Melia under the wall, W3: a jug of mead for Ozzy) - TownQuests says which
        const Q = TQ();
        try { for (const t of (Q && Q.regularTopics ? Q.regularTopics(role) : [])) o.splice(2, 0, ["q:" + t.id, t.label]); } catch (e) { console.error(e); }
        o.push(["bye", "Bywaj."]);
        return o;
    }
    function regularMenu(interp, role, again) {
        if (!REGULARS[role] || !npc(role)) return;
        const out = [], opts = menuOptions(role);
        sayAs(out, role, again ? said(role, R0(role).again, "again") : greeting(role));
        out.push(C(102, [opts.map(o => o[1]), opts.length - 1, 0, 2, 0]));
        opts.forEach(([key, label], i) => {
            out.push(C(402, [i, label]));
            if (key === "bye") {
                say(out, 0, R0(role).heroBye, null, "", 1);
                const n = NPCS[role], e = npc(role);
                say(out, e ? e.eventId() : -1, said(role, R0(role).bye, "bye"), n.face, n.name, 1);
            } else out.push(C(355, ["TavernLife.regularTopic(this, " + q(role) + ", " + q(key) + ")"], 1));
            out.push(C(0, [], 1));
        });
        out.push(C(404, []));
        run(interp, out);
    }
    const back = (out, role) => script(out, "TavernLife.regularMenu(this, " + q(role) + ", 1)");
    function regularTopic(interp, role, key) {
        const out = [], tr = trust(role);
        const hero = t => heroSay(out, t), her = t => sayAs(out, role, t);
        if (key.startsWith("q:")) {   // a quest's topic: its lines (TownQuests), then back to the menu
            const Q = TQ(), list = Q && Q.regularTopicList ? Q.regularTopicList(role, key.slice(2), npc(role)) : null;
            if (list) for (const c of list) out.push(c);
            back(out, role);
            run(interp, out);
            return;
        }
        switch (key) {
            case "news": hero(role === "ozzy" ? "Co słychać, dziadku?" : "Co słychać?"); her(newsLine(role)); break;
            case "rumour": hero("Jakieś plotki?"); her(rumourLine(role)); break;
            // ---- Melia
            case "songs": {
                const heard = S().heard || [], all = TL.SONGS || [];
                hero("Opowiedz o swoich pieśniach.");
                if (!heard.length) her("Mam sześć starych ballad. Śpiewam je wieczorami, od szóstej, po kolei - kto przyjdzie sześć razy, usłyszy wszystkie. I dostanie natchnienie w prezencie.");
                else if (heard.length < all.length) {
                    const left = all.filter(s => !heard.includes(s.id)).map(s => "„" + s.title + "”");
                    her("Słyszałeś już " + heard.length + " z " + all.length + ". Zostały jeszcze: " + left.join(", ") + ". Przyjdź wieczorem pod scenę.");
                } else {
                    const w3 = qRec("W3");
                    her(w3 && w3.s === "active" ? "Siódma ballada rośnie, złotko. Zwrotka po zwrotce. Czuję ją w palcach jak drzazgę."
                        : w3 && w3.s === "done" ? "Znasz wszystkie siedem. Nikt inny nie zna. Nawet ja nie znałam, zanim mi ich nie przyniosłeś."
                            : "Znasz już wszystkie moje stare ballady. Czasem mam wrażenie, że jest siódma - tylko jeszcze się nie urodziła.");
                }
                break;
            }
            case "origin":
                hero("Skąd znasz te ballady?");
                her("Nie wiem. Naprawdę. Matka nie śpiewała, babki nie znałam. Któregoś dnia wzięłam lutnię i słowa były. Jakby ktoś je zostawił w moich palcach.");
                if (tr >= 60) her("Czasem śni mi się kamienna sala i kobiety w szarych płaszczach. Śpiewają, a ja się uczę. Rano pamiętam tylko melodię. I chłód.");
                break;
            case "sing": {
                hero("Zaśpiewasz dziś?");
                const list = lib.songTalk ? lib.songTalk() : null;
                if (list) { run(interp, out.concat(list)); return; }
                her("Dziś już nie, złotko.");
                break;
            }
            // ---- Ozzy
            case "beer": {
                hero("Borgar! Piwo dla dziadka.");
                if (gold() < BEER_PRICE) { needGold(BEER_PRICE); her("Pusta sakiewka? *hep* Nic to. Myśl się liczy. Myśl się nie pije, ale się liczy."); break; }
                $gameParty.loseGold(BEER_PRICE);
                lib.spend(BEER_PRICE);
                const r = rec(role), first = r.vis !== day();
                her("*glug, glug* Aaach... Dobry z ciebie chłopak.");
                if (first) {
                    r.vis = day();
                    addTrust(role, 2, "piwo", "beer");
                    her("Masz, coś ci powiem. Ale nie mów nikomu, że ode mnie. *hep*");
                    for (const l of visionLines()) her(l);
                } else her("Już mi dziś stawiałeś. Wizje mam jedną na dzień, synku. Reszta to piwo. *hep*");
                break;
            }
            case "cellar":
                hero("Dziadku, opowiedz o piwnicy.");
                her("Miałem siedem lat. Goniłem kota dziadka Borgara... i wpadłem. Przez dziurę w podłodze, prosto w ciemność. *hep*");
                her("Leżałem tam do rana. Coś świeciło. Nie ogień. Coś, co patrzyło. I od tamtej pory... wiem rzeczy. Głupie rzeczy. Czasem nie głupie.");
                if (tr >= 60) her("Nie pytaj mnie, co tam jest, synku. Bo ci powiem. A wtedy będziesz wiedział. *hep* To gorsze niż kac. Dużo gorsze.");
                break;
            // ---- Grum
            case "war": {
                hero("Opowiedz o wojnie.");
                her(said(role, ["Dwa królestwa za morzem biją się o coś, czego żadne nie widziało. Płacą dobrze. Umiera się tak samo.",
                    "Byłem pod Wrzosową Przełęczą. Trzy dni deszczu i strzał. Wyszło nas dwunastu ze stu. Nie pytaj więcej.",
                    "Najemnik nie wybiera strony. Wybiera, kto płaci w terminie. Tak mówiłem kiedyś. Dziś już nie wiem."], "war"));
                break;
            }
            case "home":
                hero("Skąd jesteś, Grum?");
                her("Z gór. Innych gór, za morzem. Ojciec kopał rudę, ja nie chciałem. Wziąłem miecz. Tyle.");
                if (tr >= 60) her("Matka mówiła, że w skale mieszkają duchy, które znają twoje imię. Śmiałem się. Teraz już się nie śmieję.");
                break;
            case "play": {
                hero("Zagrajmy w coś.");
                her("W co? Na rękę czy w kości?");
                const TD = T.api("TavernDice"), dice = !!(TD && TD.present && TD.present(undefined, undefined, "grum").length);
                const opts = [{ label: "Siłujmy się.", js: "TavernLife.regularStep(this, 'grum', 'arm')" },
                    { label: dice ? "W kości." : "W kości (od piątej po południu).", js: "TavernLife.regularStep(this, 'grum', 'dice')" }, { label: "Innym razem.", js: [] }];
                lib.choose(out, opts);
                run(interp, out);
                return;
            }
        }
        back(out, role);
        run(interp, out);
    }
    function regularStep(interp, role, what) {
        if (what === "arm") {
            const fn = lib.kind("arm"), list = fn ? fn() : null;
            if (list) run(interp, list);
            return;
        }
        if (what === "dice") {
            const TD = T.api("TavernDice");
            if (!TD || !TD.present || !TD.present(undefined, undefined, "grum").length) { run(interp, sayAs([], role, "Kości wieczorem. Od piątej. Teraz piję.")); return; }
            TD.start({ opponent: "grum" });
        }
    }
    // Ozzy's "vision" after a beer: tomorrow's weather read from the plan (always true) - and, now and then, one more true thing
    function visionLines() {
        const out = [], Sv = T.api("Survival"), d = day() + 1;
        const plan = Sv && Sv.weatherPlan ? Sv.weatherPlan(d) : null, after = Sv && Sv.weatherPlan ? Sv.weatherPlan(d + 1) : null;
        if (plan && plan.storm) out.push("Jutro " + hourWords(plan.storm.start) + " burza. Taka, że psy pod ławy wejdą. Wystaw garnki, zanim przyjdzie.");
        else if (plan && plan.type === "snow") out.push("Jutro " + hourWords(plan.start) + " śnieg. Ciepło się ubierz, synku.");
        else if (plan) out.push("Jutro " + hourWords(plan.start) + " będzie padać. Wystaw garnki z wieczora, nie gap się.");
        else if (after) out.push("Jutro sucho. Ale pojutrze " + hourWords(after.storm ? after.storm.start : after.start) + (after.storm ? " burza." : " deszcz.") + " Zapamiętaj.");
        else out.push("Jutro sucho. Pojutrze też. Sucho jak w moim gardle, synku. *hep*");
        const extra = [];
        if (isMarket(day() + 1)) extra.push("Jutro targ. Ktoś na nim straci sakiewkę, a ktoś inny głowę. Pilnuj obu.");
        const dbt = debt();
        if (dbt && !dbt.done && dbt.left > 0) extra.push("Brakuje ci " + dbt.left + " groszy dla Lorda. Co do grosza. Nie dziw się, ja liczę cudze pieniądze lepiej niż swoje.");
        const w1 = qRec("W1");
        if (w1 && w1.s === "active" && w1.step === 1) extra.push("Kuba wychodzi z domu po pierwszej w nocy. Idź za nim na palcach - na palcach, mówię!");
        const w2 = qRec("W2");
        if (w2 && w2.s === "active" && flags().gardenKey && !flags().signalBook) extra.push("Siedem w południe, synku. Siedem. *hep* Nie wiem, czemu to mówię.");
        extra.push("W sakiewce masz " + gold() + " groszy. Ani grosza więcej. Wiem, wiem... nie pytaj skąd.");
        if (extra.length && hash(day(), 31) < 0.7) out.push(extra[Math.floor(hash(day(), 33) * extra.length) % extra.length]);
        return out;
    }

    // ------------------------------------------------------------------
    // Trust from the everyday: a song heard, a tip, a game with Grum (arm, dice) or Ozzy (darts, dice)
    // ------------------------------------------------------------------
    T.on("songHeard", e => { if (!window.$gameSystem) return; addTrust("melia", 1, "pieśń", "song"); if (e && e.tipped) { const r = rec("melia"); if (r.trust < CAPS.song) r.trust++; } }, { owner: "TavernLife_Regulars" });
    T.on("tavernGame", e => {
        if (!window.$gameSystem || !e) return;
        const who = e.game === "arm" && (!e.rival || e.rival === "grum") ? "grum" : e.game === "darts" && e.rival === "ozzy" ? "ozzy" : null;
        if (!who) return;
        addTrust(who, 1, "gra", "game");
        if (e.won && who === "grum") addTrust(who, 1, "wygrana", "win");   // (Grum respects a hand that beats his)
    }, { owner: "TavernLife_Regulars" });
    for (const ev of ["diceWin", "diceLose"]) {
        T.on(ev, e => { if (window.$gameSystem && e && (e.rival === "grum" || e.rival === "ozzy")) addTrust(e.rival, 1, "kości", "game"); }, { owner: "TavernLife_Regulars" });
    }

    // ------------------------------------------------------------------
    // A word now and then when the hero walks by (Ozzy snores at night)
    // ------------------------------------------------------------------
    const BARKS = {
        melia: ["♪ La, la-la... ♪", "♪ Hej, kruku, czarny kruku... ♪", "Ta struna znowu fałszuje..."],
        ozzy: ["*hep*", "Karczmarz! Jeszcze jedno...", "Hehe... kozę, mówię, kozę!"],
        grum: ["Hm.", "Kto następny na rękę?", "*ostrzy nóż*"]
    };
    const nextBark = {};
    T.onMapUpdate(scene => {
        if (scene !== SceneManager._scene || !$gameMap || $gameMap.mapId() !== TAVERN || Graphics.frameCount % 20 || $gameMap.isEventRunning() || lib.busy()) return;
        for (const role of ROLES) {
            const ev = npc(role);
            if (!ev || Math.hypot(ev.x - $gamePlayer.x, ev.y - $gamePlayer.y) > 3.5) continue;
            if ((nextBark[role] || 0) > Graphics.frameCount) continue;
            nextBark[role] = Graphics.frameCount + 1500 + Math.floor(Math.random() * 1200);
            if (Math.random() < 0.5) continue;
            const list = asleep(role) ? ["Chrrr...", "Chrrr... fiuuu...", "...nie ta cegła..."] : BARKS[role];
            bark(ev, list[Math.floor(Math.random() * list.length)], 130);
        }
    }, { owner: "TavernLife_Regulars", name: "barks" });
    T.on("mapEnter", () => { roleCache = { map: null, ids: {} }; }, { owner: "TavernLife_Regulars" });

    // ------------------------------------------------------------------
    // For the journal (TownQuests' tab "Miasteczko"): each regular, the trust and what it opens
    // ------------------------------------------------------------------
    const OPENS = {
        melia: [[35, "opowie, skąd zna ballady"], [60, "opowie o swoich snach"]],
        ozzy: [[35, "opowie o piwnicy"], [60, "powie, czego się boi"]],
        grum: [[15, "powie, skąd jest"], [60, "powie, w co naprawdę wierzy"]]
    };
    function regularsInfo() {
        return ROLES.map(role => {
            const t = trust(role), ti = tierOf(t), nx = TIERS[ti + 1];
            const next = OPENS[role].find(([at]) => at > t);
            return { role, name: REGULARS[role].full, title: REGULARS[role].title, trust: t, tier: ti, tierName: TIERS[ti].name, text: REGULARS[role].tierText[ti] || "",
                next: nx ? nx.at : null, opens: next ? "Przy " + next[0] + ": " + next[1] + "." : "" };
        });
    }

    Object.assign(TL, {
        REGULARS, TRUST_TIERS: TIERS, regular, regularMenu, regularTopic, regularStep, regularOf, trust, trustTier, addTrust, regularsInfo,
        visionLines, regularState: role => JSON.parse(JSON.stringify(rec(role)))
    });
    TL.modules.TavernLife_Regulars = true;
})();
