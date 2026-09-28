//=============================================================================
// TavernDice.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Gra w kości o pieniądze przy stole w sali gier tawerny „Pod Złotym Kuflem”: sześć kości, odkładanie, pudła, gorące kości, rywale z charakterem, pula na stole i kości specjalne. v1.0.0
 * @author Claude
 * @orderAfter UITheme
 * @orderAfter SurvivalHUD
 * @orderAfter Journal
 * @orderAfter Combat
 * @orderAfter SpeechBubbles
 * @orderAfter HeroLook
 *
 * @param target
 * @text Cel gry (punkty)
 * @desc Kto pierwszy dojdzie do tylu punktów, wygrywa pulę.
 * @type number
 * @min 500
 * @default 2000
 *
 * @param quickTarget
 * @text Szybka gra (punkty)
 * @desc Cel gry przy małej stawce (do progu poniżej).
 * @type number
 * @min 500
 * @default 1500
 *
 * @param quickStake
 * @text Próg małej stawki (G)
 * @desc Stawka do tej kwoty włącznie = szybka gra.
 * @type number
 * @min 0
 * @default 10
 *
 * @param xpBase
 * @text Doświadczenie za wygraną
 * @desc Stała część doświadczenia za wygraną partię.
 * @type number
 * @min 0
 * @default 10
 *
 * @param xpPerGold
 * @text Doświadczenie za stawkę (%)
 * @desc Ile procent stawki dochodzi do doświadczenia (20 = +1 za każde 5 G stawki).
 * @type number
 * @min 0
 * @default 20
 *
 * @param minutesBase
 * @text Czas partii: stały (min)
 * @desc Ile minut gry mija przy każdej partii.
 * @type number
 * @min 0
 * @default 10
 *
 * @param minutesPerTurn
 * @text Czas partii: za turę (min)
 * @desc Ile minut dochodzi za każdą turę obu graczy.
 * @type number
 * @min 0
 * @default 2
 *
 * @param bigWinPot
 * @text Duża wygrana (G)
 * @desc Pula od tej kwoty: napis u góry ekranu po powrocie na mapę.
 * @type number
 * @min 0
 * @default 40
 *
 * @param ozzyVisions
 * @text Przeczucia Ozzy'ego
 * @desc Dziadek Ozzy czasem mamrocze, co wypadnie w twoim rzucie - i ma rację.
 * @type boolean
 * @default true
 *
 * @param resultVariable
 * @text Zmienna: wynik
 * @desc Po ostatniej partii: 1 wygrana, 2 przegrana, 3 odejście od stołu (0 = żadna zmienna).
 * @type variable
 * @default 0
 *
 * @command openTable
 * @text Stół do gry
 * @desc Otwiera stół do gry w kości (kto siedzi przy stole, zależy od godziny).
 *
 * @command play
 * @text Zagraj z...
 * @desc Partia z wybranym rywalem i stawką (bez wyboru przy stole).
 *
 * @arg opponent
 * @text Rywal
 * @type select
 * @option Grum Żelazna Pięść
 * @value grum
 * @option Dziadek Ozzy
 * @value ozzy
 * @option Kupiec Wawrzyniec
 * @value kupiec
 * @option Bartek Kmieć
 * @value bartek
 * @option Nieznajomy w kapturze
 * @value nieznajomy
 * @default ozzy
 *
 * @arg stake
 * @text Stawka (G)
 * @type number
 * @min 1
 * @default 5
 *
 * @command giveDie
 * @text Daj kość specjalną
 * @desc Bohater dostaje kość specjalną (np. nagroda za zadanie).
 *
 * @arg die
 * @text Kość
 * @type select
 * @option Kość szczęściarza
 * @value szczesciarz
 * @option Kość wdowy
 * @value wdowa
 * @option Kość z Kruczych Skał
 * @value krucze
 * @option Kość z gruszy
 * @value grusza
 * @default szczesciarz
 *
 * @help
 * ============================================================================
 * TavernDice.js - kości w sali gier
 * ============================================================================
 * Znana karczemna gra w kości. Sześć kości; po każdym rzucie trzeba odłożyć
 * co najmniej jedną punktującą kość, a potem zapisać punkty tury albo rzucać
 * dalej pozostałymi. Rzut bez punktów to „Pudło!” - punkty tury przepadają.
 * Wszystkie sześć odłożone = „Gorące kości!” - znowu cała szóstka.
 *
 * Punkty: jedynka 100, piątka 50; trzy takie same = oczko × 100 (trzy
 * jedynki 1000); cztery = × 2, pięć = × 4, sześć = × 8; strit 1-5 = 500,
 * 2-6 = 750, 1-6 = 1500. Liczą się tylko odłożone kości, a układy tylko
 * w obrębie jednego rzutu. Gra do 2000 (przy małej stawce do 1500).
 *
 * Stół: zdarzenie z komentarzem <Tavern:dice> na pierwszej stronie. Gracz
 * podchodzi, naciska O - otwiera się stół. Kto przy nim siedzi, zależy od
 * godziny (noc: „Stoły puste. Wróć wieczorem.”). <Tavern:dice:grum> sadza
 * przy stole tylko tego rywala.
 *
 * Rywale: Grum (ryzykant, 10-25 G, wieczorem), Dziadek Ozzy (ostrożny
 * gaduła, 5-10 G), Kupiec Wawrzyniec (25-50 G, rzadki gość) i Bartek
 * Kmieć (chłop, 5 G). Grum, Ozzy i Bartek mają swoją kość specjalną, którą
 * czasem grają - i którą w końcu oddają bohaterowi, gdy ten wygra z nimi
 * kilka razy.
 *
 * Sława w tawernie (QuestBoard.js, jeśli jest): kupiec siada do gry
 * z bohaterem dopiero od „Swój chłop” (40) - wcześniej inni mówią, że gra
 * tylko z ludźmi, których zna. Od „Chluba tawerny” (80), wieczorami
 * 21-24, przy stole siada Nieznajomy w kapturze: wielka gra o 100 G do
 * 3000 punktów, czasem jego ciężka kość z Kruczych Skał. Pierwsza wygrana
 * z nim daje tę kość (a gdy bohater już ją ma - sakiewkę 100 G). Bez
 * tablicy ogłoszeń: kupiec jak dawniej, nieznajomego nie ma.
 *
 * Sterowanie: strzałki / WSAD - wybór kości i przycisków, O - zaznacz /
 * zatwierdź, P - wstecz (w trakcie partii: odejście, stawka przepada).
 * Mysz też działa. Przytrzymanie O w turze rywala przyspiesza jego ruchy.
 *
 * Dla skryptów:
 *   TavernDice.start({ opponent: "grum", stake: 15, onEnd: wynik => {...} })
 *     (bez opponent/stake: stół z wyborem; zwraca false, gdy brak złota)
 *   TavernDice.score([1,1,1,5])   - { valid, points, combos, name }
 *   TavernDice.giveDie("wdowa")   - kość specjalna dla bohatera
 *   TavernDice.dice()             - kości bohatera (posiadane i wybrane)
 *   TavernDice.stats()            - statystyki ($gameSystem._dice)
 *   TavernDice.isRunning()
 * Wynik (onEnd, po powrocie na mapę): { played, won, lost, left, net,
 * games: [...], last: { opponent, stake, pot, won, left, hero, rival } }.
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "TavernDice";
    const params = PluginManager.parameters(PLUGIN);
    const num = (v, d) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? d : Number(v));
    const flag = (v, d) => (v === undefined || v === null || v === "" ? d : String(v) === "true");
    const TARGET = num(params.target, 2000);
    const QUICK_TARGET = num(params.quickTarget, 1500);
    const QUICK_STAKE = num(params.quickStake, 10);
    const XP_BASE = num(params.xpBase, 10);
    const XP_PER_G = num(params.xpPerGold, 20) / 100;
    const MIN_BASE = num(params.minutesBase, 10);
    const MIN_TURN = num(params.minutesPerTurn, 2);
    const BIG_POT = num(params.bigWinPot, 40);
    const VISIONS = flag(params.ozzyVisions, true);
    const RESULT_VAR = num(params.resultVariable, 0);
    const NB = " ";   // (a no-break space: "15 G" never breaks)

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    const easeInOut = t => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    const easeBack = t => { t = clamp(t, 0, 1); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    const gold = n => n + NB + "G";

    function makeRng(seed) {   // mulberry32
        let a = (seed >>> 0) || 1;
        return () => {
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    // the separate streams of one game: the dice, the players' decisions, the start, the talk, the looks (so talk and looks
    // never change what the dice show)
    function streams(seed) {
        seed = seed >>> 0;
        return { dice: makeRng(seed), ai: makeRng(seed * 7 + 1), start: makeRng(seed * 13 + 5), talk: makeRng(seed * 31 + 7), fx: makeRng(seed * 17 + 3) };
    }
    const pickOf = (rng, list) => list[Math.floor(rng() * list.length) % list.length];

    // ==================================================================
    // Scoring (pure): the best way to count ALL the dice given (null: some die would not count)
    // ==================================================================
    const FACE = [null,
        ["jedynka", "jedynki", "jedynek"], ["dwójka", "dwójki", "dwójek"], ["trójka", "trójki", "trójek"],
        ["czwórka", "czwórki", "czwórek"], ["piątka", "piątki", "piątek"], ["szóstka", "szóstki", "szóstek"]];
    const COUNT = { 1: "jedna", 2: "dwie", 3: "trzy", 4: "cztery", 5: "pięć", 6: "sześć" };
    // "trzy czwórki", "pięć szóstek", "jedynka"
    function facesWord(n, face) {
        if (n === 1) return FACE[face][0];
        return COUNT[n] + " " + FACE[face][n >= 5 ? 2 : 1];
    }
    const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
    const STRAIGHTS = {
        s15: { name: "mały strit", faces: [1, 2, 3, 4, 5], points: 500 },
        s26: { name: "duży strit", faces: [2, 3, 4, 5, 6], points: 750 },
        s16: { name: "pełny strit", faces: [1, 2, 3, 4, 5, 6], points: 1500 }
    };
    const kindPoints = (face, n) => (face === 1 ? 1000 : face * 100) * Math.pow(2, n - 3);

    const memo = new Map();
    // counts[1..6] -> { points, combos } using every die, or null
    function partition(counts) {
        const key = counts.join("");
        if (memo.has(key)) return memo.get(key);
        let f = 1;
        while (f <= 6 && !counts[f]) f++;
        let best = null;
        if (f > 6) best = { points: 0, combos: [] };
        else {
            const tryOne = (combo, take) => {
                const c = counts.slice();
                for (const [face, n] of take) { c[face] -= n; if (c[face] < 0) return; }
                const rest = partition(c);
                if (rest && (!best || rest.points + combo.points > best.points)) best = { points: rest.points + combo.points, combos: [combo].concat(rest.combos) };
            };
            // (the lowest face has to be in some group: a straight that starts with it, some of a kind of it, or it alone)
            if (f === 1) {
                tryOne({ kind: "straight", key: "s16", points: 1500, faces: [1, 2, 3, 4, 5, 6] }, [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1]]);
                tryOne({ kind: "straight", key: "s15", points: 500, faces: [1, 2, 3, 4, 5] }, [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]]);
            }
            if (f === 2) tryOne({ kind: "straight", key: "s26", points: 750, faces: [2, 3, 4, 5, 6] }, [[2, 1], [3, 1], [4, 1], [5, 1], [6, 1]]);
            for (let n = 3; n <= counts[f]; n++) tryOne({ kind: "kind", face: f, n, points: kindPoints(f, n), faces: new Array(n).fill(f) }, [[f, n]]);
            if (f === 1) tryOne({ kind: "single", face: 1, n: 1, points: 100, faces: [1] }, [[1, 1]]);
            if (f === 5) tryOne({ kind: "single", face: 5, n: 1, points: 50, faces: [5] }, [[5, 1]]);
        }
        memo.set(key, best);
        return best;
    }
    function countsOf(faces) {
        const c = [0, 0, 0, 0, 0, 0, 0];
        for (const f of faces) if (f >= 1 && f <= 6) c[f]++;
        return c;
    }
    // the words for a way of counting: "Trzy czwórki + jedynka", "Pełny strit", "Dwie piątki"
    function describe(combos) {
        const parts = [], singles = {};
        for (const c of combos) {
            if (c.kind === "single") singles[c.face] = (singles[c.face] || 0) + 1;
            else if (c.kind === "straight") parts.push(STRAIGHTS[c.key].name);
            else parts.push(facesWord(c.n, c.face));
        }
        for (const f of [1, 5]) if (singles[f]) parts.push(facesWord(singles[f], f));
        return cap(parts.join(" + "));
    }
    // dice: faces (1-6) or { face } objects -> { valid, points, combos, name, n }
    function score(dice) {
        const faces = (dice || []).map(d => (typeof d === "object" && d ? d.face : d));
        if (!faces.length || faces.some(f => !(f >= 1 && f <= 6))) return { valid: false, points: 0, combos: [], name: "", n: faces.length };
        const p = partition(countsOf(faces));
        if (!p || p.points <= 0) return { valid: false, points: 0, combos: [], name: "", n: faces.length };
        return { valid: true, points: p.points, combos: p.combos, name: describe(p.combos), n: faces.length };
    }
    // does a throw hold anything that counts (else: a bust)
    function hasScore(faces) {
        const c = countsOf(faces);
        return c[1] > 0 || c[5] > 0 || c.some((n, f) => f > 0 && n >= 3);
    }
    // every way to set dice aside from a throw: [{ idx, points, combos, name, n }] (one per distinct set of faces)
    function options(faces) {
        const out = [], seen = new Set(), n = faces.length;
        for (let mask = 1; mask < (1 << n); mask++) {
            const idx = [];
            for (let i = 0; i < n; i++) if (mask & (1 << i)) idx.push(i);
            const key = idx.map(i => faces[i]).sort().join("");
            if (seen.has(key)) continue;
            seen.add(key);
            const s = score(idx.map(i => faces[i]));
            if (s.valid) out.push({ idx, points: s.points, combos: s.combos, name: s.name, n: idx.length });
        }
        return out;
    }
    // the most points one can set aside (ties: fewer dice)
    function best(faces) {
        let b = null;
        for (const o of options(faces)) if (!b || o.points > b.points || (o.points === b.points && o.n < b.n)) b = o;
        return b;
    }
    // a face from a die with the weights w[0..5] (one rng() a die, whatever the weights)
    function rollFace(rng, w) {
        w = w || [1, 1, 1, 1, 1, 1];
        let sum = 0;
        for (let i = 0; i < 6; i++) sum += w[i];
        let r = rng() * sum;
        for (let i = 0; i < 6; i++) { r -= w[i]; if (r < 0) return i + 1; }
        return 6;
    }
    // the chance of a bust with n dice and the mean best score of a throw that counts (worked out over every throw)
    const P_BUST = [1, 0.6667, 0.4444, 0.2778, 0.1574, 0.0772, 0.0309];
    const E_OK = [0, 75, 90, 120.2, 170.3, 262.2, 411.8];

    // ==================================================================
    // The dice: the plain ones and the special ones (kept in $gameSystem, not database items)
    // ==================================================================
    const DIE_TYPES = {
        std: {
            name: "Zwykła kość", short: "zwykła", w: [1, 1, 1, 1, 1, 1],
            desc: "Kość z kości, jak w każdej karczmie. Uczciwa jak Borgar przy wadze.",
            effect: "Każde oczko tak samo często."
        },
        grusza: {
            name: "Kość z gruszy", short: "z gruszy", w: [1.25, 1, 1, 1, 1.15, 1],
            desc: "Wystrugana przez Bartka Kmiecia z gruszkowego drewna. Pachnie sadem.",
            effect: "Jedynki i piątki odrobinę częściej."
        },
        wdowa: {
            name: "Kość wdowy", short: "wdowy", w: [1, 1, 1, 1, 1.9, 1],
            desc: "Czarna jak żałoba, lekka jak plotka. Dziadek Ozzy wygrał ją kiedyś od wdowy z Młynówki.",
            effect: "Piątki wyraźnie częściej (ok. 1 na 4 rzuty)."
        },
        szczesciarz: {
            name: "Kość szczęściarza", short: "szczęściarza", w: [1.8, 1, 1, 1, 1, 1],
            desc: "Szczęśliwa kość Gruma, ze złotym połyskiem i czerwonym oczkiem.",
            effect: "Jedynki wyraźnie częściej (ok. 1 na 4 rzuty)."
        },
        krucze: {
            name: "Kość z Kruczych Skał", short: "z Kruczych Skał", w: [1.7, 1, 0.8, 1, 1.3, 1], rare: true,
            desc: "Z czarnego kamienia dawnej twierdzy. Zamiast jedynki wyryty kruk. Zimna w dłoni, nawet przy ogniu.",
            effect: "Kruk (jedynka) i piątki częściej, trójki rzadziej."
        }
    };
    const SPECIAL_ORDER = ["szczesciarz", "wdowa", "krucze", "grusza"];

    // ==================================================================
    // The rivals: when they sit at the table, what they play for, how they play, what they say
    // ==================================================================
    // ai.bank[n]: the turn's points at which they write them down when n dice would be left to throw (6: after hot dice)
    const OPPONENTS = {
        grum: {
            name: "Grum Żelazna Pięść", short: "Grum", role: "najemnik", style: "ryzykant", styleColor: "#ff9b6b",
            bust: "Actor2_5", sheet: "Actor2_Tall", index: 4,
            hours: [17, 24], stakes: [10, 15, 20, 25], perDay: 3,
            ai: { bank: [0, 450, 550, 700, 1100, 2000, Infinity], reckless: 0.2, chase: 1.8 },
            die: { key: "szczesciarz", chance: 0.5, giveAfter: 4 },
            quote: "Siadaj. Tylko nie płacz potem, jak zgarnę pulę.",
            lines: {
                greet: ["Siadaj. Tylko nie płacz potem, jak zgarnę pulę.", "No proszę, ktoś odważny. Kości czekają.", "Stawiaj, chłopcze. Grum nie gra za darmo."],
                meFirst: ["Ja pierwszy. Patrz i się ucz.", "Moja kolej na start. Tak ma być."],
                heroFirst: ["Zaczynaj. I tak cię dogonię.", "Ty pierwszy. Dam ci fory. Małe."],
                myBig: ["Ha! Tak się rzuca!", "Widzisz? Szczęście sprzyja odważnym.", "No i co ty na to, chłopcze?"],
                myBust: ["Na brodę mojej matki...", "Kości dziś krzywe.", "Niech to szlag!", "Pfff. Rozgrzewka."],
                myHot: ["Wszystkie sześć! Grum się rozkręca!", "Gorące! Jeszcze raz, całą garścią!"],
                push: ["Jeszcze raz. Kto nie ryzykuje, ten nie pije.", "Mało. Rzucam dalej.", "Grum nie zapisuje drobnych."],
                bank: ["Dobra, zapisuję. Nie przyzwyczajaj się.", "Do sakwy z tym."],
                heroBust: ["Ha! Pudło! Kości cię nie lubią, chłopcze.", "Hehe. Bywa.", "I tyle z twojej tury."],
                heroHot: ["Gorące kości? Farciarz...", "Hmpf. Rzucaj, rzucaj."],
                heroBig: ["Hmpf. Zwykłe szczęście.", "Nieźle. Ale to jeszcze nie koniec."],
                heroSmall: ["Zapisujesz tak mało? Tchórzysz?", "Ostrożny jak baba na lodzie."],
                win: ["Moje! Dzięki za piwo, chłopcze.", "Pula moja. Wróć, jak urośniesz."],
                lose: ["Wygrałeś. Uczciwie. Nie myśl, że się nie odegram.", "Grr. Masz szczęście, że lubię tę karczmę."],
                lucky: ["Moja szczęśliwa kość. Nie dotykaj, bo straci moc."],
                chat: ["Słyszałeś coś o jaskiniach na wschód stąd? Nie? Szkoda.", "Za górami płacą lepiej niż Borgar. Ale kości tam gorsze.", "Najemnik bez kości to jak miecz bez ostrza."],
                give: ["Weź ją. Moja szczęśliwa kość przestała mnie lubić. Może ciebie polubi."],
                tired: ["Dość na dziś. Sakwa pusta, a duma obolała. Jutro się odegram."]
            }
        },
        ozzy: {
            name: "Dziadek Ozzy", short: "Ozzy", role: "stały bywalec", style: "ostrożny", styleColor: "#8fc7ff",
            bust: "People2_1", sheet: "People2_Tall", index: 0,
            hours: [10, 23], stakes: [5, 10], perDay: 3,
            ai: { bank: [0, 250, 300, 350, 500, 850, Infinity], reckless: 0, chase: 1.4 },
            die: { key: "wdowa", chance: 0.35, giveAfter: 3 },
            visions: true, stories: true,
            quote: "Siadaj, siadaj, młody. Stary Ozzy lubi towarzystwo.",
            lines: {
                greet: ["Siadaj, siadaj, młody. Stary Ozzy lubi towarzystwo.", "O, gość! Zagramy? Tylko nie o grube pieniądze, emerytura skromna."],
                meFirst: ["Ja zaczynam? Starszym się ustępuje, hehe."],
                heroFirst: ["Młodzi przodem. Rzucaj."],
                myBig: ["O! Widzisz? Stare ręce jeszcze umieją.", "Hehe, jak za młodu!"],
                myBust: ["Ech... Kości jak moja pamięć. Nic nie zostało.", "Pudło? No to się napiję."],
                myHot: ["Wszystkie? Ojej, a ja nawet nie celowałem!"],
                push: ["Jeszcze jeden rzut... No dobra, jeden.", "Raz się żyje, a ja żyję już dość długo."],
                bank: ["Zapisuję, zapisuję. Pewne to pewne.", "Wróbel w garści, jak mawiała moja Halinka."],
                heroBust: ["Oj, pudło. Nie martw się, mnie też się zdarza. Codziennie.", "Kości mają humory. Jak ja."],
                heroHot: ["Gorące! Uważaj, żeby się nie sparzyć, hehe."],
                heroBig: ["No, no! Pięknie rzucone!", "Ho, ho! Masz rękę do kości."],
                heroSmall: ["Rozsądnie. Rozsądnie.", "Mądrze. Pewne to pewne."],
                win: ["Hehe! Stary Ozzy jeszcze coś potrafi!", "Moja wygrana. Postawię ci za to piwo. Za twoje pieniądze."],
                lose: ["Wygrałeś uczciwie. Moja Halinka by cię polubiła.", "Ech, przegrałem. Ale jaka zabawa!"],
                lucky: ["Ta czarna? Kość wdowy. Gram nią, jak mi smutno."],
                chat: [
                    "Za moich młodych lat grało się o kury, nie o grosze. Raz wygrałem koguta. Dziobał mnie do zimy.",
                    "Moja Halinka grała lepiej ode mnie. I lepiej gotowała. Właściwie wszystko robiła lepiej.",
                    "Kiedyś jeden kupiec z miasta przegrał tu buty. Szedł do domu boso, a śpiewał!",
                    "Ta tawerna stoi na starych kamieniach, wiesz? Jako chłopak wlazłem raz do piwnicy... Hyk. Nieważne. Rzucaj.",
                    "Borgar mówi: nie pytaj o to, czego nie chcesz wiedzieć. Mądry chłopak. Po dziadku.",
                    "Grum? Dobry chłopak, tylko za dużo pyta o jaskinie na wschodzie. Po co mu jaskinie?",
                    "Kiedyś rzuciłem sześć jedynek. Nikt mi nie wierzy. Ja też już nie wierzę.",
                    "Kości trzeba ogrzać w dłoni. Tak mówił mój ojciec. Potem przegrał krowę."
                ],
                vision: {
                    bust: ["Hyk... Nic z tego nie będzie. Nic a nic...", "Widzę pustkę... Hyk. Pudło."],
                    s16: ["Wszystkie po kolei... od jedynki do szóstki... hyk."],
                    straight: ["Po kolei... ładnie po kolei, jak kaczki..."],
                    kind: ["{w}... hyk... tak mi się widzi."],
                    one: ["Jedynka... Widzę jedynkę. Hyk."],
                    five: ["Piątka. Samotna piątka... hyk."],
                    after: ["Mówiłem.", "Hehe. Mówiłem przecież."]
                },
                give: ["Weź ją. Wygrałem ją kiedyś od wdowy z Młynówki. Ta to grała! Niech ci służy lepiej niż mnie."],
                tired: ["Na dziś dość, młody. Stare kości potrzebują snu. I moje, i te."]
            }
        },
        kupiec: {
            name: "Kupiec Wawrzyniec", short: "Wawrzyniec", role: "bogaty gość z miasta", style: "wyrachowany", styleColor: "#c9a6ff",
            bust: "People4_5", sheet: "People4", index: 4,
            hours: [18, 23], rare: true, stakes: [25, 35, 50], perDay: 2, minRep: 40,
            ai: { bank: [0, 300, 350, 400, 700, 1700, Infinity], reckless: 0.03, chase: 1.6 },
            die: { key: "krucze", chance: 0.4 },
            quote: "Pięćdziesiąt groszy tu, pięćdziesiąt tam... Siadaj, młodzieńcze.",
            lines: {
                greet: ["Pięćdziesiąt groszy tu, pięćdziesiąt tam... Siadaj, młodzieńcze.", "Szukam rozrywki na wieczór. Zagramy o coś wartego uwagi?"],
                meFirst: ["Pozwolisz, że zacznę. Czas to pieniądz."],
                heroFirst: ["Proszę. Gość przodem."],
                myBig: ["Inwestycja się zwraca.", "Tak wygląda dobry interes."],
                myBust: ["Hm. Koszty prowadzenia interesu.", "Każdy kupiec czasem traci towar."],
                myHot: ["Pełna ładownia. Płyniemy dalej."],
                push: ["Ryzyko jest ceną zysku.", "Jeszcze jeden rzut. Liczby są po mojej stronie."],
                bank: ["Zysk w kieszeni jest lepszy niż zysk w obietnicy.", "Zamykam rachunek tej tury."],
                heroBust: ["Tak kończy się chciwość.", "Przykro mi. Naprawdę. Trochę."],
                heroHot: ["Ho, ho. Imponujące.", "Szczęście początkującego?"],
                heroBig: ["Dobry rzut. Zanotuję to sobie.", "Proszę, proszę."],
                heroSmall: ["Ostrożność. Cenię to."],
                win: ["Interes się opłacił. Dziękuję za grę.", "Pula moja. Nic osobistego, młodzieńcze."],
                lose: ["Brawo. Rzadko przegrywam. Zapamiętam twoją twarz.", "Wygrałeś. Pieniądz lubi zmieniać właściciela."],
                lucky: ["Ta czarna? Pamiątka z podróży. Nie zwracaj na nią uwagi."],
                chat: ["Na targu w grodzie gra się o większe stawki. Ale tu jest przytulniej.", "Kupiłem kiedyś kość od kopacza spod Kruczych Skał. Od tamtej pory śnią mi się kruki.", "Rachunek prawdopodobieństwa, młodzieńcze. Nie szczęście."],
                tired: ["Na dziś wystarczy. Mój skarbnik by mnie zabił."]
            }
        },
        bartek: {
            name: "Bartek Kmieć", short: "Bartek", role: "chłop spod Młynówki", style: "nowicjusz", styleColor: "#8ee08a",
            bust: "People1_5", sheet: "People1_Tall", index: 4,
            hours: [14, 21], stakes: [5], perDay: 2,
            ai: { bank: [0, 300, 350, 400, 450, 600, Infinity], keepAll: true, miss: 0.12, reckless: 0, chase: 1.3 },
            die: { key: "grusza", chance: 1, giveAfter: 2 },
            quote: "Pięć groszy, więcej nie mam, żona liczy.",
            lines: {
                greet: ["Pięć groszy, więcej nie mam, żona liczy.", "Zagramy? Tylko powoli, ja dopiero się uczę."],
                meFirst: ["Ja pierwszy? Ojej. Dobra."],
                heroFirst: ["Ty zaczynaj, ja popatrzę, jak się to robi."],
                myBig: ["O matko, to się liczy? Liczy się, nie?", "Hej! Szkoda, że żona nie widziała!"],
                myBust: ["Ojej... No nic, ziemniaki też nie zawsze wschodzą.", "Ech. Jak z moim polem."],
                myHot: ["Wszystkie sześć? To tak można?!"],
                push: ["Rzucę jeszcze. Chyba tak się robi?"],
                bank: ["Zapiszę, zapiszę, bo mi ucieknie.", "Lepiej zapiszę, bo zapomnę."],
                heroBust: ["Oj. Współczuję. Szczerze!", "Pudło? Tak jak ja wczoraj."],
                heroHot: ["Wszystkie sześć? Jak to się robi?!"],
                heroBig: ["Ale rzut! Nauczysz mnie tak?"],
                heroSmall: ["Mądrze."],
                win: ["Wygrałem! Kupię żonie wstążkę!", "Naprawdę wygrałem? No proszę!"],
                lose: ["Przegrałem... Tylko nie mów żonie.", "No trudno. Dobra zabawa za pięć groszy."],
                lucky: ["Ta z gruszy? Sam wystrugałem. Nie jest krzywa. Chyba."],
                chat: ["U nas we wsi gra się w kości tylko w niedzielę. Po kościele. Za kościołem.", "Żona mówi, że kości to grzech. Ale sama gra w karty."],
                give: ["Nie mam już grosza... Weź moją kość. Sam wystrugałem z gruszy. Mnie i tak nie przynosi szczęścia."],
                tired: ["Na dziś koniec. Żona mnie zabije, jak przegram jeszcze grosz."]
            }
        }
    };
    // (from the tavern's fame on the quest board, QuestBoard.js: 40 Swój chłop, 80 Chluba tawerny)
    OPPONENTS.nieznajomy = {
        name: "Nieznajomy w kapturze", short: "Nieznajomy", role: "gość bez imienia", style: "zagadka", styleColor: "#c8bda8",
        bust: "Evil_8", sheet: null, index: 0,
        hours: [21, 24], stakes: [100], target: 3000, perDay: 1, minRep: 80, needsRep: true,
        ai: { bank: [0, 350, 400, 500, 800, 1800, Infinity], reckless: 0.08, chase: 1.7 },
        die: { key: "krucze", chance: 0.5, giveOnce: true, orGold: 100 },
        quote: "Kości nie kłamią. Ludzie kłamią. Siadaj.",
        lines: {
            greet: ["Kości nie kłamią. Ludzie kłamią. Siadaj.", "Sto sztuk złota. Do trzech tysięcy. Chluba tawerny chyba się nie boi?"],
            meFirst: ["Ja pierwszy. Tak miało być."],
            heroFirst: ["Proszę. Pokaż, ile jesteś wart."],
            myBig: ["Tak musiało być.", "Wiedziałem."],
            myBust: ["...", "Ciekawe."],
            myHot: ["Wszystkie sześć. Jak dawniej."],
            push: ["Jeszcze.", "Za mało, żeby przestać."],
            bank: ["Wystarczy.", "Zapisz to."],
            heroBust: ["Każdy kiedyś sięga o jeden rzut za daleko.", "Chciałeś wiedzieć za dużo."],
            heroHot: ["Kości cię dziś lubią. Nie przyzwyczajaj się."],
            heroBig: ["Nieźle.", "Kości cię lubią. Na razie."],
            heroSmall: ["Ostrożnie. Mądrze."],
            win: ["Pula moja. Jeszcze się spotkamy.", "Tak miało być."],
            lose: ["Wygrałeś. Rzadko to słyszę.", "Dobrze. Zasłużyłeś."],
            lucky: ["Ta kość jest stara. Starsza niż ta tawerna."],
            chat: ["Pod tą podłogą leżą starsze kamienie, niż myślisz.", "Pytasz, kim jestem? Zapytaj lepiej, czego szukasz.", "Niektórzy rzucają kośćmi, żeby nie myśleć o tym, co wiedzą."],
            give: ["Weź ją. Z Kruczych Skał. Ona i tak woli ciebie."],
            giveGold: ["Kość z Kruczych Skał już masz. Weź więc to. I nie pytaj."],
            tired: ["Na dziś dość. Znajdę cię."]
        }
    };
    // what the others say when the merchant sits by the window but does not play with the hero yet (fame below 40)
    const MERCHANT_HINT = {
        grum: "Ten kupiec przy oknie? Gra tylko z ludźmi, których zna. Mnie też długo nie znał.",
        ozzy: "Widzisz tego kupca z miasta? Gra tylko z ludźmi, których zna. Pokaż się w tawernie, to i z tobą siądzie.",
        bartek: "Kupiec mówi, że gra tylko z ludźmi, których zna. Mnie nie zna. Nikt mnie nie zna."
    };
    const OPP_ORDER = ["grum", "ozzy", "kupiec", "bartek", "nieznajomy"];
    const HERO_LINES = { vision: ["Skąd on to wiedział...?", "Zaraz... skąd on wiedział?"] };
    // the hero on autopilot (tests): plays like a sensible regular
    const AUTO_AI = {
        steady: { bank: [0, 300, 350, 400, 650, 1500, Infinity], reckless: 0, chase: 1.5 },
        bold: { bank: [0, 450, 550, 700, 1100, 2000, Infinity], reckless: 0.1, chase: 1.8 },
        timid: { bank: [0, 200, 250, 300, 350, 500, Infinity], reckless: 0, chase: 1.2 }
    };

    // ==================================================================
    // The saved state: $gameSystem._dice (plain data only)
    // ==================================================================
    function blankStore() {
        return {
            v: 1, games: 0, wins: 0, losses: 0, left: 0, net: 0, biggestPot: 0, bestThrow: null, rulesSeen: false,
            owned: {}, set: ["std", "std", "std", "std", "std", "std"], vs: {}, visions: 0, firstWin: false, last: null
        };
    }
    function store() {
        const s = window.$gameSystem;
        if (!s) return blankStore();
        if (!s._dice || typeof s._dice !== "object") s._dice = blankStore();
        const d = s._dice, b = blankStore();
        for (const k in b) if (d[k] === undefined) d[k] = b[k];
        if (!Array.isArray(d.set) || d.set.length !== 6) d.set = b.set;
        return d;
    }
    const dayNow = () => (window.$gameSystem && $gameSystem.dayNightDay ? $gameSystem.dayNightDay() : 1);
    const hourNow = () => (window.$gameSystem && $gameSystem.dayNightHour ? $gameSystem.dayNightHour() : 19);
    function vsOf(key) {
        const st = store();
        if (!st.vs[key]) st.vs[key] = { games: 0, wins: 0, losses: 0, day: 0, lostToday: 0, given: false };
        const v = st.vs[key];
        if (v.day !== dayNow()) { v.day = dayNow(); v.lostToday = 0; }
        return v;
    }
    const ownedCount = key => (key === "std" ? 6 : Math.max(0, Math.floor(store().owned[key] || 0)));
    // the hero's six: the chosen set, with dice no longer owned put back to plain ones
    function heroSet() {
        const st = store(), used = {};
        return st.set.map(k => {
            if (!DIE_TYPES[k] || k === "std") return "std";
            used[k] = (used[k] || 0) + 1;
            return used[k] <= ownedCount(k) ? k : "std";
        });
    }
    function giveDie(key) {
        if (!DIE_TYPES[key] || key === "std") return false;
        const st = store();
        st.owned[key] = (st.owned[key] || 0) + 1;
        return true;
    }

    // ==================================================================
    // Who sits at the table now (hours [from, to), "rare" guests only some days)
    // ==================================================================
    const rareDay = day => ((day * 37 + 11) % 4) === 0;
    function atHour(key, hour, day) {
        const o = OPPONENTS[key];
        const h = ((hour % 24) + 24) % 24, [a, b] = o.hours;
        const inHours = b > 24 ? (h >= a || h < b - 24) : (h >= a && h < b);
        return inHours && (!o.rare || rareDay(day));
    }
    // the tavern's fame (QuestBoard.js) or null without the quest board
    const fame = () => (window.QuestBoard && typeof QuestBoard.reputation === "function" ? Number(QuestBoard.reputation()) || 0 : null);
    // does the fame let this rival sit down with the hero (without the quest board: as before - the stranger never comes)
    function fameOk(key) {
        const o = OPPONENTS[key], f = fame();
        if (!o.minRep) return true;
        if (f === null) return !o.needsRep;
        return f >= o.minRep;
    }
    // -> [{ key, tired }] (tired: lost enough to the hero today)
    function present(hour, day, only) {
        hour = hour === undefined ? hourNow() : hour;
        day = day === undefined ? dayNow() : day;
        const keys = only ? [only].filter(k => OPPONENTS[k]) : OPP_ORDER;
        return keys.filter(k => atHour(k, hour, day) && fameOk(k)).map(k => ({ key: k, tired: vsOf(k).lostToday >= OPPONENTS[k].perDay }));
    }
    // the rivals who are at the tables now but do not play with the hero yet (his fame is too low)
    function locked(hour, day) {
        hour = hour === undefined ? hourNow() : hour;
        day = day === undefined ? dayNow() : day;
        return fame() === null ? [] : OPP_ORDER.filter(k => atHour(k, hour, day) && !fameOk(k));
    }
    const targetFor = (stake, key) => (key && OPPONENTS[key] && OPPONENTS[key].target) || (stake <= QUICK_STAKE ? QUICK_TARGET : TARGET);

    // ==================================================================
    // The players' heads: what to set aside, and whether to write the turn down
    // ==================================================================
    // c: { faces, turn, total, rival, target } -> { idx, bank, reckless }
    function decide(c, P, rng) {
        let opts = options(c.faces);
        if (!opts.length) return null;
        if (P.miss && opts.length > 1 && rng() < P.miss) {   // a slip: a straight (or a lone five) goes unnoticed
            const plain = opts.filter(o => !o.combos.some(x => x.kind === "straight") && !(o.n === 1 && o.combos[0].face === 5));
            if (plain.length) opts = plain;
        }
        const n = c.faces.length, left = o => (n - o.n) || 6;
        const top = opts.reduce((b, o) => (!b || o.points > b.points || (o.points === b.points && o.n < b.n) ? o : b), null);
        if (c.total + c.turn + top.points >= c.target) return { idx: top.idx, bank: true, win: true };
        const cont = o => (1 - P_BUST[left(o)]) * (c.turn + o.points + E_OK[left(o)]);
        const go = P.keepAll ? top : opts.reduce((b, o) => (!b || cont(o) > cont(b) + 0.01 || (Math.abs(cont(o) - cont(b)) <= 0.01 && o.points > b.points) ? o : b), null);
        let k = 1;
        if (c.rival >= c.target - 350) k *= P.chase || 1;             // the other one is about to win: go on
        else if (c.total - c.rival >= 800) k *= 0.85;                 // well ahead: play safe
        const L = left(go), t2 = c.turn + go.points, bar = P.bank[L] * k;
        let bank = t2 >= bar, reckless = false;
        if (bank && P.reckless && L >= 2 && t2 < bar * 1.6 && rng() < P.reckless) { bank = false; reckless = true; }
        return bank ? { idx: top.idx, bank: true } : { idx: go.idx, bank: false, reckless };
    }

    // ==================================================================
    // One game (no pictures): the dice thrown, set aside, written down; the scene and simulate() both play through this
    // ==================================================================
    class Match {
        // o: { target, rng, players: [{ key, name, dice: [6 types] }, ...], first }
        constructor(o) {
            this.target = o.target;
            this.rng = o.rng;
            this.players = o.players.map(p => ({ key: p.key, name: p.name, dice: p.dice.slice(), total: 0, turns: 0, busts: 0, hot: 0, throws: 0, best: null }));
            this.cur = o.first || 0;
            this.over = false;
            this.winner = -1;
            this.turnNo = 0;
            this.forced = [];   // throws the tests set up: arrays of faces
            this.log = [];
            this.beginTurn();
        }
        get P() { return this.players[this.cur]; }
        get R() { return this.players[1 - this.cur]; }
        beginTurn() {
            this.turn = { pts: 0, free: [0, 1, 2, 3, 4, 5], groups: [], throws: 0, hot: 0, lost: 0 };
            this.thrown = null;
            this.hotNext = false;
            this.turnNo++;
            this.P.turns++;
        }
        // throws the free dice -> { dice: [{ slot, type, face }], bust }
        roll() {
            const t = this.turn, P = this.P, forced = this.forced.length ? this.forced.shift() : null;
            const dice = t.free.map((slot, i) => {
                const type = P.dice[slot] || "std", w = (DIE_TYPES[type] || DIE_TYPES.std).w;
                return { slot, type, face: forced && forced[i] ? forced[i] : rollFace(this.rng, w) };
            });
            this.thrown = dice;
            this.hotNext = false;
            t.throws++;
            P.throws++;
            const bust = !hasScore(dice.map(d => d.face));
            this.log.push({ p: this.cur, t: this.turnNo, roll: dice.map(d => d.face) });
            if (bust) { P.busts++; t.lost = t.pts; t.pts = 0; this.log.push({ p: this.cur, bust: true, lost: t.lost }); }
            return { dice, bust };
        }
        // sets aside the thrown dice at idx -> { group, hot } or null (not all of them count)
        take(idx) {
            if (!this.thrown || !idx || !idx.length) return null;
            const uniq = Array.from(new Set(idx)).filter(i => i >= 0 && i < this.thrown.length);
            const dice = uniq.map(i => this.thrown[i]);
            const s = score(dice.map(d => d.face));
            if (!s.valid) return null;
            const t = this.turn, P = this.P;
            const group = { dice, points: s.points, combos: s.combos, name: s.name };
            t.groups.push(group);
            t.pts += s.points;
            t.free = t.free.filter(slot => !dice.some(d => d.slot === slot));
            if (!P.best || s.points > P.best.points) P.best = { points: s.points, name: s.name, faces: dice.map(d => d.face) };
            let hot = false;
            if (!t.free.length) { hot = true; t.hot++; P.hot++; t.free = [0, 1, 2, 3, 4, 5]; this.hotNext = true; }
            this.thrown = null;
            this.log.push({ p: this.cur, take: dice.map(d => d.face), points: s.points, hot });
            return { group, hot };
        }
        // writes the turn down -> { points, total, won }
        bank() {
            const P = this.P, pts = this.turn.pts;
            P.total += pts;
            this.log.push({ p: this.cur, bank: pts, total: P.total });
            if (P.total >= this.target) { this.over = true; this.winner = this.cur; }
            return { points: pts, total: P.total, won: this.over };
        }
        endTurn() {
            if (this.over) return;
            this.cur = 1 - this.cur;
            this.beginTurn();
        }
        // what a head needs to decide
        context() {
            return { faces: (this.thrown || []).map(d => d.face), turn: this.turn.pts, total: this.P.total, rival: this.R.total, target: this.target };
        }
    }
    // the start of a game against key: the rival's dice (his special one, some games) and who starts (each throws one die)
    function setupGame(key, rng) {
        const o = OPPONENTS[key], dice = ["std", "std", "std", "std", "std", "std"];
        let special = null;
        const v = vsOf(key), gaveIt = v.given && v.gift !== "gold";   // (gold given instead: he keeps his die)
        if (o && o.die && !gaveIt && rng() < o.die.chance) { dice[2] = o.die.key; special = o.die.key; }
        const rolls = [];
        let first = -1;
        for (let i = 0; i < 12 && first < 0; i++) {
            const a = 1 + Math.floor(rng() * 6), b = 1 + Math.floor(rng() * 6);
            rolls.push([a, b]);
            if (a !== b) first = a > b ? 0 : 1;
        }
        return { dice, special, rolls, first: first < 0 ? 0 : first };
    }
    // a whole game with no scene, both sides played by heads -> { winner, totals, turns, log, ... } (tests, balance)
    function simulate(o) {
        o = o || {};
        const key = OPPONENTS[o.opponent] ? o.opponent : "ozzy";
        const seed = o.seed !== undefined ? Number(o.seed) : (Date.now() >>> 0);
        const R = streams(seed), setup = setupGame(key, R.start);
        const heroAi = AUTO_AI[o.hero] || OPPONENTS[o.hero] && OPPONENTS[o.hero].ai || AUTO_AI.steady;
        const m = new Match({
            target: o.target || targetFor(o.stake || OPPONENTS[key].stakes[0], key), rng: R.dice, first: setup.first,
            players: [{ key: "hero", name: "Ty", dice: o.heroDice || ["std", "std", "std", "std", "std", "std"] }, { key, name: OPPONENTS[key].short, dice: setup.dice }]
        });
        const heads = [heroAi, OPPONENTS[key].ai];
        let guard = 0, errors = 0;
        while (!m.over && guard++ < 3000) {
            const r = m.roll();
            if (r.bust) { m.endTurn(); continue; }
            const d = decide(m.context(), heads[m.cur], R.ai);
            const t = d && m.take(d.idx);
            if (!t) { errors++; m.endTurn(); continue; }
            if (d.bank) { m.bank(); m.endTurn(); }
        }
        return {
            seed, winner: m.winner, first: setup.first, rolls: setup.rolls, special: setup.special, target: m.target, errors,
            totals: m.players.map(p => p.total), turns: m.players.map(p => p.turns), busts: m.players.map(p => p.busts),
            hot: m.players.map(p => p.hot), throws: m.players.map(p => p.throws), log: m.log
        };
    }

    // ==================================================================
    // Style: the game's black + bright yellow (UITheme.js's window.UIStyle), with a fallback
    // ==================================================================
    const FALLBACK = {
        fill: "rgba(11,12,15,0.9)", solid: "#0b0c0f", line: "#3a3e46", accent: "#ffd23f", accentDim: "#c9a12a",
        text: "#eceef0", muted: "#8a9099", trough: "#16181c",
        panel(ctx, x, y, w, h, o) {
            o = o || {};
            ctx.save(); ctx.fillStyle = o.fill || FALLBACK.fill; ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = o.line || FALLBACK.line; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); ctx.restore();
        },
        bar(ctx, x, y, w, h, r, c) {
            ctx.fillStyle = FALLBACK.line; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
            ctx.fillStyle = FALLBACK.trough; ctx.fillRect(x, y, w, h);
            ctx.fillStyle = c; ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, r))), h);
        }
    };
    const ST = () => window.UIStyle || FALLBACK;
    const GOOD = "#8ee08a", BAD = "#ff7b6b", WARN = "#ffb347", GOLD_TXT = "#ffe27a", FELT_GOLD = "rgba(222,184,98,";
    const COIN_ICON = 313;

    function dirty(b) { if (b && b._baseTexture) b._baseTexture.update(); }
    function panel(b, x, y, w, h, o) { ST().panel(b.context, x, y, w, h, o); dirty(b); }
    function bar(b, x, y, w, h, r, c) { ST().bar(b.context, x, y, w, h, r, c); dirty(b); }
    function font(b, size, colour, bold, outline) {
        b.fontSize = size;
        b.textColor = colour || ST().text;
        b.fontBold = !!bold;
        b.outlineWidth = outline || 1;
        b.outlineColor = outline ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0)";
    }
    function txt(b, s, x, y, w, o) {
        o = o || {};
        const size = o.size || 20;
        font(b, size, o.color, o.bold, o.outline);
        if (o.alpha !== undefined) b.paintOpacity = Math.round(255 * o.alpha);
        b.drawText(String(s), Math.round(x), Math.round(y), Math.round(w), o.lh || Math.round(size * 1.35), o.align || "left");
        b.paintOpacity = 255;
        b.fontBold = false;
    }
    function measure(b, s, size, bold) { font(b, size, null, bold); const w = b.measureTextWidth(String(s)); b.fontBold = false; return w; }
    function wrapLines(b, s, w, size, bold) {
        const out = [];
        for (const para of String(s).split("\n")) {
            let cur = "";
            for (const word of para.split(" ")) {
                const test = cur ? cur + " " + word : word;
                if (cur && measure(b, test, size, bold) > w) { out.push(cur); cur = word; } else cur = test;
            }
            out.push(cur);
        }
        return out;
    }
    function icon(b, index, x, y, size) {
        if (!(index > 0)) return;
        const set = ImageManager.loadSystem("IconSet"), pw = ImageManager.iconWidth, ph = ImageManager.iconHeight;
        if (!set.isReady()) return;
        b.context.imageSmoothingEnabled = false;
        b.blt(set, (index % 16) * pw, Math.floor(index / 16) * ph, pw, ph, x, y, size || pw, size || ph);
        b.context.imageSmoothingEnabled = true;
    }
    // an arrow: dir "left" | "up" | "right" | "down", centred on (cx, cy), s = its size
    function arrow(ctx, dir, cx, cy, s, colour) {
        const a = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir] || 0;
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(s * 0.5, 0); ctx.lineTo(0, -s * 0.45); ctx.lineTo(0, -s * 0.17); ctx.lineTo(-s * 0.5, -s * 0.17);
        ctx.lineTo(-s * 0.5, s * 0.17); ctx.lineTo(0, s * 0.17); ctx.lineTo(0, s * 0.45); ctx.closePath();
        ctx.fillStyle = colour; ctx.fill();
        ctx.restore();
    }
    // a small solid triangle (the stake's arrows)
    function tri(ctx, dir, cx, cy, s, colour) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate({ right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir] || 0);
        ctx.beginPath(); ctx.moveTo(s * 0.45, 0); ctx.lineTo(-s * 0.35, -s * 0.5); ctx.lineTo(-s * 0.35, s * 0.5); ctx.closePath();
        ctx.fillStyle = colour; ctx.fill();
        ctx.restore();
    }
    // a key cap: label = "O", "P" or an arrow name; returns its width
    function keyCap(b, label, x, y, h, colour) {
        h = h || 26;
        const isArrow = ["left", "up", "right", "down"].includes(label);
        const size = Math.round(h * 0.6);
        const w = isArrow ? h : Math.max(h, Math.ceil(measure(b, label, size, true)) + 14);
        ST().panel(b.context, x, y, w, h, { cut: 3, fill: "rgba(28,30,36,0.96)", line: "#5d636e", accent: false });
        if (isArrow) arrow(b.context, label, x + w / 2, y + h / 2, h * 0.56, colour || ST().accent);
        dirty(b);
        if (!isArrow) txt(b, label, x, y + Math.round((h - size * 1.35) / 2), w, { size, color: colour || ST().accent, bold: true, align: "center" });
        return w;
    }
    // a row of hints: [[cap or [caps], text], ...]; returns the width used (measure only: dry)
    function keyHints(b, rows, x, y, h, size, dry) {
        let cx = x;
        for (const [caps, text] of rows) {
            for (const c of [].concat(caps)) {
                if (dry) { const isArrow = ["left", "up", "right", "down"].includes(c); cx += (isArrow ? h : Math.max(h, Math.ceil(measure(b, c, Math.round(h * 0.6), true)) + 14)) + 3; }
                else cx += keyCap(b, c, cx, y, h) + 3;
            }
            cx += 5;
            if (!dry) txt(b, text, cx, y + Math.round((h - size * 1.35) / 2), 400, { size, color: ST().text });
            cx += Math.ceil(measure(b, text, size)) + 20;
        }
        return cx - x - 20;
    }
    // a rounded rectangle path
    function rr(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
    // a soft (blurred) shape: the canvas blur filter where there is one, else a few widening passes
    function soft(ctx, blur, draw) {
        if ("filter" in ctx) {
            ctx.save(); ctx.filter = "blur(" + blur + "px)"; draw(ctx, 0); ctx.restore();
        } else {
            for (let i = 4; i >= 1; i--) { ctx.save(); ctx.globalAlpha = 0.25; draw(ctx, blur * i / 4); ctx.restore(); }
        }
    }
    function smoothBitmap(w, h) { const b = new Bitmap(w, h); b.smooth = true; return b; }
    function solidBitmap(colour) { const b = new Bitmap(4, 4); b.fillAll(colour); return b; }
    // a button: o { focus, disabled, primary, small }
    function drawButton(b, x, y, w, h, label, o) {
        o = o || {};
        const S = ST(), ctx = b.context;
        if (o.disabled) S.panel(ctx, x, y, w, h, { cut: 5, fill: "rgba(16,17,21,0.88)", line: "#2c3037", accent: false });
        else if (o.focus) {
            S.panel(ctx, x, y, w, h, { cut: 5, fill: o.primary ? S.accent : "rgba(255,210,63,0.16)", line: S.accent, accent: !o.primary });
            if (o.primary) { ctx.save(); ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.fillRect(x + 5, y + 1, w - 10, 1); ctx.restore(); }
        } else S.panel(ctx, x, y, w, h, { cut: 5, fill: "rgba(20,22,27,0.94)", line: o.primary ? "#6b5a22" : S.line, accent: false });
        dirty(b);
        const colour = o.disabled ? "#565b64" : o.focus ? (o.primary ? "#16171b" : S.accent) : o.primary ? S.accent : S.text;
        const size = o.small ? 18 : 21;
        txt(b, label, x, y + Math.round((h - size * 1.35) / 2), w, { size, color: colour, bold: !o.disabled && (o.focus || o.primary), align: "center" });
    }

    // ==================================================================
    // The dice, drawn: an ivory (or ebony, stone, pear wood...) rounded cube seen from above with engraved pips
    // ==================================================================
    const LOOKS = {
        std: { c0: "#fffaf0", c1: "#f0e6cc", c2: "#d2c29d", edge: "rgba(120,96,60,0.30)", line: "rgba(66,48,28,0.6)", hi: "rgba(255,255,255,0.9)",
            lo: "rgba(110,86,52,0.45)", pip0: "#1b120a", pip1: "#5e4533", rim: "rgba(255,255,255,0.65)" },
        szczesciarz: { c0: "#fff5d6", c1: "#f3d78f", c2: "#c69743", edge: "rgba(140,96,30,0.32)", line: "rgba(118,78,18,0.8)", hi: "rgba(255,250,222,0.95)",
            lo: "rgba(130,90,30,0.5)", pip0: "#281809", pip1: "#6a4c2d", rim: "rgba(255,250,225,0.7)", red: ["#7a0d08", "#e2463b"], gild: true },
        wdowa: { c0: "#4c4855", c1: "#28252e", c2: "#0e0d11", edge: "rgba(0,0,0,0.45)", line: "rgba(0,0,0,0.9)", hi: "rgba(214,204,244,0.6)",
            lo: "rgba(0,0,0,0.6)", pip0: "#aaa4bb", pip1: "#ffffff", rim: "rgba(0,0,0,0.6)", light: true },
        krucze: { c0: "#6f7680", c1: "#444a53", c2: "#22262c", edge: "rgba(0,0,0,0.42)", line: "rgba(8,10,14,0.9)", hi: "rgba(222,232,242,0.5)",
            lo: "rgba(0,0,0,0.55)", pip0: "#a1acb7", pip1: "#eef3f7", rim: "rgba(0,0,0,0.55)", light: true, speckle: true, raven: true },
        grusza: { c0: "#f2c993", c1: "#d69f60", c2: "#a36731", edge: "rgba(90,45,10,0.35)", line: "rgba(76,38,10,0.75)", hi: "rgba(255,238,204,0.75)",
            lo: "rgba(90,45,10,0.5)", pip0: "#29160a", pip1: "#61401f", rim: "rgba(255,232,196,0.6)", grain: true }
    };
    const PIP_AT = (() => {
        const a = 0.27, m = 0.5, z = 0.73;
        return { 1: [[m, m]], 2: [[z, a], [a, z]], 3: [[z, a], [m, m], [a, z]], 4: [[a, a], [z, a], [a, z], [z, z]], 5: [[a, a], [z, a], [m, m], [a, z], [z, z]], 6: [[a, a], [z, a], [a, m], [z, m], [a, z], [z, z]] };
    })();
    function pip(ctx, x, y, r, L, red) {
        const off = L.light ? -r * 0.16 : r * 0.16;
        ctx.beginPath(); ctx.arc(x + off, y + off, r * 1.12, 0, Math.PI * 2); ctx.fillStyle = L.rim; ctx.fill();   // the pit's lit (or dark) edge
        const inner = red ? red[1] : L.pip1, outer = red ? red[0] : L.pip0, k = L.light ? -0.3 : 0.34;
        const g = ctx.createRadialGradient(x + r * k, y + r * k, r * 0.05, x, y, r);
        g.addColorStop(0, inner); g.addColorStop(1, outer);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    }
    // the raven of the Krucze Skały die (in place of the one), in a box of size s centred on (x, y)
    function raven(ctx, x, y, s, L) {
        const draw = (dx, dy, colour) => {
            ctx.save();
            ctx.translate(x + dx, y + dy); ctx.scale(s, s);
            ctx.fillStyle = colour; ctx.strokeStyle = colour; ctx.lineCap = "round";
            ctx.beginPath(); ctx.ellipse(-0.02, 0.05, 0.25, 0.14, -0.35, 0, Math.PI * 2); ctx.fill();          // body
            ctx.beginPath(); ctx.arc(0.2, -0.1, 0.09, 0, Math.PI * 2); ctx.fill();                              // head
            ctx.beginPath(); ctx.moveTo(0.26, -0.14); ctx.lineTo(0.42, -0.085); ctx.lineTo(0.26, -0.055); ctx.closePath(); ctx.fill();   // beak
            ctx.beginPath(); ctx.moveTo(-0.2, 0.1); ctx.lineTo(-0.44, 0.22); ctx.lineTo(-0.41, 0.09); ctx.lineTo(-0.19, 0.0); ctx.closePath(); ctx.fill();   // tail
            ctx.lineWidth = 0.035;
            ctx.beginPath(); ctx.moveTo(-0.02, 0.17); ctx.lineTo(-0.05, 0.29); ctx.moveTo(0.07, 0.16); ctx.lineTo(0.08, 0.29); ctx.stroke();   // legs
            ctx.restore();
        };
        draw(-s * 0.03, -s * 0.03, "rgba(0,0,0,0.6)");
        draw(0, 0, L.pip1);
        ctx.beginPath(); ctx.arc(x + s * 0.22, y - s * 0.11, s * 0.022, 0, Math.PI * 2); ctx.fillStyle = "#2a2e34"; ctx.fill();   // the eye
    }
    // a die of type with face up in a square of side S at (x, y) (px of ctx)
    function paintDie(ctx, x, y, S, face, type) {
        const L = LOOKS[type] || LOOKS.std, r = S * 0.2;
        ctx.save();
        rr(ctx, x, y, S, S, r);
        const g = ctx.createLinearGradient(x, y, x + S, y + S);
        g.addColorStop(0, L.c0); g.addColorStop(0.55, L.c1); g.addColorStop(1, L.c2);
        ctx.fillStyle = g; ctx.fill();
        ctx.save();
        rr(ctx, x, y, S, S, r); ctx.clip();
        if (L.grain) {   // pear wood: soft wavy grain
            for (let i = 0; i < 9; i++) {
                const yy = y + S * (0.08 + i * 0.105);
                ctx.beginPath(); ctx.moveTo(x, yy);
                ctx.bezierCurveTo(x + S * 0.3, yy + S * 0.04 * ((i % 3) - 1), x + S * 0.6, yy - S * 0.05, x + S, yy + S * 0.02);
                ctx.strokeStyle = i % 2 ? "rgba(120,62,18,0.22)" : "rgba(255,226,180,0.18)"; ctx.lineWidth = S * 0.018; ctx.stroke();
            }
        }
        if (L.speckle) {   // stone: specks
            let seed = 7;
            const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
            for (let i = 0; i < 70; i++) {
                ctx.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.16)";
                ctx.fillRect(x + rnd() * S, y + rnd() * S, S * 0.018, S * 0.018);
            }
        }
        const rg = ctx.createRadialGradient(x + S * 0.36, y + S * 0.32, S * 0.08, x + S * 0.5, y + S * 0.5, S * 0.78);
        rg.addColorStop(0, "rgba(255,255,255,0.16)"); rg.addColorStop(0.55, "rgba(255,255,255,0)"); rg.addColorStop(1, L.edge);
        ctx.fillStyle = rg; ctx.fillRect(x, y, S, S);
        ctx.restore();
        // the bevel: light on the upper-left rim, shade on the lower-right
        const bw = Math.max(1, S * 0.035);
        const bg = ctx.createLinearGradient(x, y, x + S, y + S);
        bg.addColorStop(0, L.hi); bg.addColorStop(0.45, "rgba(255,255,255,0)"); bg.addColorStop(0.6, "rgba(0,0,0,0)"); bg.addColorStop(1, L.lo);
        rr(ctx, x + bw, y + bw, S - bw * 2, S - bw * 2, r * 0.85);
        ctx.strokeStyle = bg; ctx.lineWidth = bw * 1.6; ctx.stroke();
        if (L.gild) { rr(ctx, x + bw * 2.4, y + bw * 2.4, S - bw * 4.8, S - bw * 4.8, r * 0.7); ctx.strokeStyle = "rgba(176,120,30,0.55)"; ctx.lineWidth = Math.max(1, S * 0.012); ctx.stroke(); }
        rr(ctx, x + 0.5, y + 0.5, S - 1, S - 1, r);
        ctx.strokeStyle = L.line; ctx.lineWidth = Math.max(1, S * 0.018); ctx.stroke();
        // the face
        if (face === 1 && L.raven) raven(ctx, x + S / 2, y + S / 2, S * 0.62, L);
        else {
            const pr = S * (face === 1 ? 0.118 : 0.085);
            for (const [px, py] of PIP_AT[face] || []) pip(ctx, x + px * S, y + py * S, pr, L, face === 1 && L.red ? L.red : null);
        }
        ctx.restore();
    }
    const TEX = { die: {}, misc: {} };
    const DIE_T = 128, DIE_S = 112, DIE_SCALE = 0.54;   // texture px, the body in it; on the table 112 * 0.54 = 60 px
    function dieBitmap(type, face) {
        const key = (LOOKS[type] ? type : "std") + ":" + face;
        if (TEX.die[key]) return TEX.die[key];
        const b = smoothBitmap(DIE_T, DIE_T), o = (DIE_T - DIE_S) / 2;
        paintDie(b.context, o, o, DIE_S, face, type);
        dirty(b);
        return (TEX.die[key] = b);
    }
    function miscBitmap(key, w, h, draw) {
        if (TEX.misc[key]) return TEX.misc[key];
        const b = smoothBitmap(w, h);
        draw(b.context, w, h, b);
        dirty(b);
        return (TEX.misc[key] = b);
    }
    // the die's soft shadow (the same scale as the die)
    const dieShadow = () => miscBitmap("dieShadow", 176, 176, ctx => soft(ctx, 9, (c, g) => { rr(c, 32 - g, 34 - g, DIE_S + g * 2, DIE_S + g * 2, 24); c.fillStyle = "rgba(0,0,0,0.62)"; c.fill(); }));
    // the yellow glow of a chosen die (added light)
    const dieGlow = () => miscBitmap("dieGlow", 184, 184, ctx => {
        ctx.save(); ctx.shadowColor = "rgba(255,210,63,1)"; ctx.shadowBlur = 22;
        rr(ctx, 36, 36, DIE_S, DIE_S, 24); ctx.strokeStyle = "rgba(255,214,80,0.95)"; ctx.lineWidth = 8; ctx.stroke();
        ctx.stroke(); ctx.restore();
    });
    // the keyboard's corner brackets round a die (screen px)
    const focusBitmap = () => miscBitmap("focus", 92, 92, ctx => {
        const a = 6, b = 86, L = 16;
        const corners = c => {
            c.beginPath();
            c.moveTo(a, a + L); c.lineTo(a, a); c.lineTo(a + L, a);
            c.moveTo(b - L, a); c.lineTo(b, a); c.lineTo(b, a + L);
            c.moveTo(b, b - L); c.lineTo(b, b); c.lineTo(b - L, b);
            c.moveTo(a + L, b); c.lineTo(a, b); c.lineTo(a, b - L);
        };
        ctx.lineCap = "square";
        corners(ctx); ctx.strokeStyle = "rgba(0,0,0,0.75)"; ctx.lineWidth = 6; ctx.stroke();
        corners(ctx); ctx.strokeStyle = ST().accent; ctx.lineWidth = 3; ctx.stroke();
    });

    // ==================================================================
    // The leather cup (three-quarter view), its shadow; the coins, the pot; the candles
    // ==================================================================
    const CUP_W = 200, CUP_H = 236;
    function paintCup(ctx) {
        const cx = CUP_W / 2, top = 40, bot = 206, trx = 72, brx = 84, ery = 22;
        const body = () => {
            ctx.beginPath();
            ctx.moveTo(cx - trx, top); ctx.lineTo(cx - brx, bot);
            ctx.ellipse(cx, bot, brx, ery * 1.05, 0, Math.PI, 0, true);
            ctx.lineTo(cx + trx, top);
            ctx.ellipse(cx, top, trx, ery, 0, 0, Math.PI, false);
            ctx.closePath();
        };
        body();
        const g = ctx.createLinearGradient(cx - brx, 0, cx + brx, 0);
        g.addColorStop(0, "#2a1509"); g.addColorStop(0.16, "#5b331a"); g.addColorStop(0.36, "#94603a"); g.addColorStop(0.5, "#7d4a28");
        g.addColorStop(0.78, "#4a2812"); g.addColorStop(1, "#200f06");
        ctx.fillStyle = g; ctx.fill();
        ctx.save();
        body(); ctx.clip();
        let seed = 11;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (let i = 0; i < 420; i++) {   // the leather's grain
            ctx.fillStyle = rnd() < 0.5 ? "rgba(0,0,0,0.13)" : "rgba(255,210,160,0.06)";
            ctx.fillRect(cx - brx + rnd() * brx * 2, top + rnd() * (bot - top + 20), 1 + rnd() * 2.5, 1 + rnd() * 1.5);
        }
        for (const k of [-0.55, 0, 0.55]) {   // tooled grooves
            ctx.beginPath(); ctx.moveTo(cx + k * trx, top + 34); ctx.lineTo(cx + k * brx * 0.98, bot - 30);
            ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 3; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + k * trx + 2.5, top + 34); ctx.lineTo(cx + k * brx * 0.98 + 2.5, bot - 30);
            ctx.strokeStyle = "rgba(255,214,170,0.08)"; ctx.lineWidth = 1.5; ctx.stroke();
        }
        // the bands at the lip and at the base, with stitches
        const band = (y, rx, w) => {
            ctx.beginPath(); ctx.ellipse(cx, y, rx, ery, 0, 0.02, Math.PI - 0.02); ctx.strokeStyle = "rgba(38,18,8,0.9)"; ctx.lineWidth = w; ctx.stroke();
            ctx.beginPath(); ctx.ellipse(cx, y - w / 2 + 1, rx, ery, 0, 0.05, Math.PI - 0.05); ctx.strokeStyle = "rgba(255,214,170,0.14)"; ctx.lineWidth = 1.5; ctx.stroke();
            for (const d of [-w / 2 + 4, w / 2 - 4]) {
                ctx.save(); ctx.setLineDash([7, 6]);
                ctx.beginPath(); ctx.ellipse(cx, y + d, rx, ery, 0, 0.12, Math.PI - 0.12); ctx.strokeStyle = "rgba(236,212,166,0.85)"; ctx.lineWidth = 2; ctx.stroke();
                ctx.restore();
            }
        };
        band(top + 22, trx + 1.5, 20);
        band(bot - 22, brx - 1.5, 18);
        // the light down the left side
        const sh = ctx.createLinearGradient(cx - brx, 0, cx, 0);
        sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.55, "rgba(255,236,210,0.12)"); sh.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = sh; ctx.fillRect(cx - brx, top, brx, bot - top + 30);
        ctx.restore();
        // the brass boss
        const bx = cx - 8, by = (top + bot) / 2 + 6;
        ctx.beginPath(); ctx.arc(bx + 1.5, by + 2, 17, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fill();
        const bg = ctx.createRadialGradient(bx - 6, by - 6, 2, bx, by, 17);
        bg.addColorStop(0, "#fff3c0"); bg.addColorStop(0.45, "#e0ac3e"); bg.addColorStop(1, "#7a5212");
        ctx.beginPath(); ctx.arc(bx, by, 16, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.fill();
        ctx.strokeStyle = "rgba(60,36,6,0.9)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(bx, by, 10.5, 0, Math.PI * 2); ctx.strokeStyle = "rgba(90,58,10,0.65)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.save(); ctx.translate(bx, by);   // a small engraved die on it
        ctx.strokeStyle = "rgba(80,50,8,0.85)"; ctx.lineWidth = 1.6; rr(ctx, -5.5, -5.5, 11, 11, 2.5); ctx.stroke();
        ctx.fillStyle = "rgba(80,50,8,0.9)";
        for (const [px, py] of [[-2.4, -2.4], [0, 0], [2.4, 2.4]]) { ctx.beginPath(); ctx.arc(px, py, 1, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        // the mouth: the rolled lip and the dark inside
        ctx.beginPath(); ctx.ellipse(cx, top, trx - 5, ery - 4, 0, 0, Math.PI * 2);
        const ig = ctx.createLinearGradient(0, top - ery, 0, top + ery);
        ig.addColorStop(0, "#3b2213"); ig.addColorStop(0.55, "#120904"); ig.addColorStop(1, "#070302");
        ctx.fillStyle = ig; ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx, top, trx - 2, ery - 1.5, 0, 0, Math.PI * 2);
        const lg = ctx.createLinearGradient(0, top - ery, 0, top + ery);
        lg.addColorStop(0, "#4a2a15"); lg.addColorStop(0.5, "#6e4324"); lg.addColorStop(1, "#b07a4a");
        ctx.strokeStyle = lg; ctx.lineWidth = 7; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx, top + 1, trx - 2, ery - 1.5, 0, 0.15, Math.PI - 0.15); ctx.strokeStyle = "rgba(255,226,190,0.35)"; ctx.lineWidth = 1.5; ctx.stroke();
        // the outline
        body(); ctx.strokeStyle = "rgba(16,8,3,0.75)"; ctx.lineWidth = 2; ctx.stroke();
    }
    const cupBitmap = () => miscBitmap("cup", CUP_W, CUP_H, paintCup);
    const cupShadow = () => miscBitmap("cupShadow", 240, 90, ctx => soft(ctx, 10, (c, g) => { c.beginPath(); c.ellipse(120, 45, 88 + g, 24 + g * 0.4, 0, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.55)"; c.fill(); }));

    // a coin lying flat (seen from above, a little tilted): 2x texture 52 x 38
    function paintCoin(ctx, x, y, s) {
        const rx = 22 * s, ry = 14 * s, th = 5 * s;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x - rx, y); ctx.lineTo(x - rx, y + th);
        ctx.ellipse(x, y + th, rx, ry, 0, Math.PI, 0, true);
        ctx.lineTo(x + rx, y);
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI, false);
        ctx.closePath();
        const sg = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
        sg.addColorStop(0, "#6a4510"); sg.addColorStop(0.4, "#b98722"); sg.addColorStop(1, "#5a3a0c");
        ctx.fillStyle = sg; ctx.fill();
        ctx.strokeStyle = "rgba(50,30,4,0.7)"; ctx.lineWidth = 1.2 * s; ctx.stroke();
        const g = ctx.createRadialGradient(x - rx * 0.35, y - ry * 0.45, 1, x, y, rx);
        g.addColorStop(0, "#fff6c4"); g.addColorStop(0.4, "#f2c64c"); g.addColorStop(1, "#b07c16");
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = "rgba(96,62,6,0.85)"; ctx.lineWidth = 1.2 * s; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2); ctx.strokeStyle = "rgba(140,96,18,0.55)"; ctx.lineWidth = 1.4 * s; ctx.stroke();
        // a star struck in the middle
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = (i % 2 ? 0.2 : 0.46) * rx * 0.62;
            const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2 * (ry / rx);
            if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.closePath(); ctx.fillStyle = "rgba(150,100,16,0.55)"; ctx.fill();
        ctx.restore();
    }
    const coinBitmap = () => miscBitmap("coin", 56, 44, ctx => paintCoin(ctx, 28, 18, 1));
    // the pot: n coins in little stacks plus a couple lying about (2x texture, 240 x 180, the base centred at 120, 150)
    function potBitmap(n) {
        const key = "pot" + n;
        if (TEX.misc[key]) return TEX.misc[key];
        const b = smoothBitmap(240, 180), ctx = b.context;
        soft(ctx, 8, (c, g) => { c.beginPath(); c.ellipse(120, 150, 92 + g, 24 + g * 0.4, 0, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.45)"; c.fill(); });
        const k = n <= 0 ? 0 : n <= 6 ? 1 : n <= 12 ? 2 : n <= 20 ? 3 : 4, total = Math.min(n, 32), stacks = [];
        for (let i = 0; i < k; i++) stacks.push(Math.floor(total / k) + (i < total % k ? 1 : 0));
        const spots = [[120, 138], [82, 146], [158, 146], [112, 162]];
        // loose coins lying at the foot
        if (n >= 4) { paintCoin(ctx, 58, 160, 0.95); paintCoin(ctx, 186, 158, 0.95); }
        const order = stacks.map((h, i) => ({ h, x: spots[i][0], y: spots[i][1] })).sort((a, c) => a.y - c.y);
        for (const s of order) for (let k = 0; k < s.h; k++) paintCoin(ctx, s.x + ((k * 5) % 3) - 1, s.y - k * 8, 1);
        dirty(b);
        return (TEX.misc[key] = b);
    }
    // a candle on a brass dish (2x texture 64 x 120, the dish's middle at 32, 104); the flame is a sprite of its own
    const candleBitmap = () => miscBitmap("candle", 64, 120, ctx => {
        soft(ctx, 4, (c, g) => { c.beginPath(); c.ellipse(34, 108, 28 + g, 9 + g * 0.3, 0, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.5)"; c.fill(); });
        const dg = ctx.createLinearGradient(4, 0, 60, 0);
        dg.addColorStop(0, "#6b4a12"); dg.addColorStop(0.35, "#f4d27a"); dg.addColorStop(0.6, "#c99a36"); dg.addColorStop(1, "#5e3f0c");
        ctx.beginPath(); ctx.ellipse(32, 104, 28, 10, 0, 0, Math.PI * 2); ctx.fillStyle = dg; ctx.fill();
        ctx.strokeStyle = "rgba(60,38,6,0.9)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(32, 102, 20, 6.5, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(90,60,10,0.55)"; ctx.fill();
        const wg = ctx.createLinearGradient(20, 0, 44, 0);
        wg.addColorStop(0, "#c9b27a"); wg.addColorStop(0.35, "#fff6dc"); wg.addColorStop(1, "#b9a169");
        ctx.beginPath(); ctx.moveTo(20, 46); ctx.lineTo(20, 100); ctx.ellipse(32, 100, 12, 4, 0, Math.PI, 0, true); ctx.lineTo(44, 46); ctx.closePath();
        ctx.fillStyle = wg; ctx.fill();
        ctx.beginPath(); ctx.moveTo(38, 48); ctx.quadraticCurveTo(41, 60, 39, 66); ctx.quadraticCurveTo(37, 70, 36, 62); ctx.closePath();   // a drip
        ctx.fillStyle = "rgba(255,248,226,0.9)"; ctx.fill();
        ctx.beginPath(); ctx.ellipse(32, 46, 12, 4, 0, 0, Math.PI * 2); ctx.fillStyle = "#fff3d0"; ctx.fill();
        ctx.beginPath(); ctx.ellipse(32, 46.5, 6, 2, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(220,190,120,0.8)"; ctx.fill();
        ctx.beginPath(); ctx.moveTo(32, 46); ctx.lineTo(32, 38); ctx.strokeStyle = "#241a12"; ctx.lineWidth = 2; ctx.stroke();
    });
    const flameBitmap = () => miscBitmap("flame", 40, 64, ctx => {
        const g = ctx.createRadialGradient(20, 44, 1, 20, 40, 26);
        g.addColorStop(0, "rgba(255,255,236,1)"); g.addColorStop(0.3, "rgba(255,226,120,0.95)"); g.addColorStop(0.65, "rgba(255,140,40,0.6)"); g.addColorStop(1, "rgba(255,90,20,0)");
        ctx.beginPath(); ctx.moveTo(20, 4); ctx.bezierCurveTo(28, 22, 34, 34, 32, 46); ctx.bezierCurveTo(30, 58, 10, 58, 8, 46); ctx.bezierCurveTo(6, 34, 12, 22, 20, 4); ctx.closePath();
        ctx.fillStyle = g; ctx.fill();
    });
    const glowBitmap = () => miscBitmap("glow", 256, 256, ctx => {
        const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        g.addColorStop(0, "rgba(255,190,110,0.55)"); g.addColorStop(0.35, "rgba(255,150,70,0.22)"); g.addColorStop(1, "rgba(255,120,40,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    });
    const sparkBitmap = () => miscBitmap("spark", 16, 16, ctx => {
        const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        g.addColorStop(0, "rgba(255,250,210,1)"); g.addColorStop(0.4, "rgba(255,190,80,0.9)"); g.addColorStop(1, "rgba(255,120,30,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 16);
    });
    const moteBitmap = () => miscBitmap("mote", 8, 8, ctx => {
        const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
        g.addColorStop(0, "rgba(255,226,170,0.9)"); g.addColorStop(1, "rgba(255,190,110,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 8);
    });
    const dustBitmap = () => miscBitmap("dust", 10, 10, ctx => {
        const g = ctx.createRadialGradient(5, 5, 0, 5, 5, 5);
        g.addColorStop(0, "rgba(190,210,170,0.55)"); g.addColorStop(1, "rgba(190,210,170,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 10, 10);
    });

    // ==================================================================
    // The table: dark wood boards round a green felt, brass corners, a gold line, the circle of the pot
    // ==================================================================
    const TBL = { x: 262, y: 62, w: 756, h: 550 }, RIM = 24;
    const FELT = { x: TBL.x + RIM, y: TBL.y + RIM, w: TBL.w - RIM * 2, h: TBL.h - RIM * 2 };
    const COL_W = 84;   // the columns of set-aside dice at both ends of the felt
    const ZONE = { x: FELT.x + COL_W + 10, y: FELT.y + 18, w: FELT.w - (COL_W + 10) * 2, h: FELT.h - 70 };   // where the dice land
    const POT = { x: FELT.x + FELT.w / 2, y: FELT.y + FELT.h / 2 - 16 };
    const HERO_COL = FELT.x + COL_W / 2 + 4, OPP_COL = FELT.x + FELT.w - COL_W / 2 - 4;
    // words printed along an ellipse (centred on the angle mid; under: read along the bottom, left to right)
    function arcWords(ctx, text, cx, cy, rx, ry, mid, colour, size, under) {
        ctx.save();
        ctx.font = "bold " + size + "px " + ($gameSystem && $gameSystem.mainFontFace ? $gameSystem.mainFontFace() : "sans-serif");
        ctx.fillStyle = colour; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const chars = Array.from(text), widths = chars.map(c => ctx.measureText(c).width + size * 0.18);
        const total = widths.reduce((a, w) => a + w, 0), r = (rx + ry) / 2;
        let a = mid - (under ? -1 : 1) * total / r / 2;
        chars.forEach((c, i) => {
            const step = widths[i] / r, at = a + (under ? -1 : 1) * step / 2;
            ctx.save();
            ctx.translate(cx + Math.cos(at) * rx, cy + Math.sin(at) * ry);
            ctx.rotate(at + (under ? -Math.PI / 2 : Math.PI / 2));
            ctx.fillText(c, 0, 0);
            ctx.restore();
            a += (under ? -1 : 1) * step;
        });
        ctx.restore();
    }
    function paintTable(b) {
        const ctx = b.context, ox = TBL.x - 30, oy = TBL.y - 24;   // (the bitmap starts here on the screen)
        const X = TBL.x - ox, Y = TBL.y - oy, W = TBL.w, H = TBL.h;
        soft(ctx, 16, (c, g) => { rr(c, X + 4 - g, Y + 14 - g, W + g * 2, H + g * 2, 26); c.fillStyle = "rgba(0,0,0,0.7)"; c.fill(); });
        // the four boards (mitred), each with its own grain
        let seed = 29;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        const outer = () => rr(ctx, X, Y, W, H, 20);
        const fx = X + RIM, fy = Y + RIM, fw = W - RIM * 2, fh = H - RIM * 2;
        const boards = [
            { pts: [[X, Y], [X + W, Y], [fx + fw, fy], [fx, fy]], horiz: true, light: 1.12 },
            { pts: [[fx, fy + fh], [fx + fw, fy + fh], [X + W, Y + H], [X, Y + H]], horiz: true, light: 0.82 },
            { pts: [[X, Y], [fx, fy], [fx, fy + fh], [X, Y + H]], horiz: false, light: 1.0 },
            { pts: [[fx + fw, fy], [X + W, Y], [X + W, Y + H], [fx + fw, fy + fh]], horiz: false, light: 0.9 }
        ];
        const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = v => clamp(Math.round(v * k), 0, 255); return "rgb(" + f(n >> 16) + "," + f((n >> 8) & 255) + "," + f(n & 255) + ")"; };
        for (const bd of boards) {
            ctx.save();
            outer(); ctx.clip();
            ctx.beginPath(); bd.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.clip();
            const gr = bd.horiz ? ctx.createLinearGradient(0, bd.pts[0][1], 0, bd.pts[3][1]) : ctx.createLinearGradient(bd.pts[0][0], 0, bd.pts[1][0], 0);
            gr.addColorStop(0, shade("#5a361e", bd.light)); gr.addColorStop(0.5, shade("#462914", bd.light)); gr.addColorStop(1, shade("#2f1a0c", bd.light));
            ctx.fillStyle = gr; ctx.fillRect(X, Y, W, H);
            for (let i = 0; i < (bd.horiz ? 70 : 90); i++) {   // the grain along the board
                const dark = rnd() < 0.6, a = 0.05 + rnd() * 0.16;
                ctx.strokeStyle = dark ? "rgba(18,8,2," + a + ")" : "rgba(150,98,58," + a * 0.8 + ")";
                ctx.lineWidth = 0.6 + rnd() * 1.4;
                ctx.beginPath();
                if (bd.horiz) {
                    const y0 = Math.min(bd.pts[0][1], bd.pts[3][1]) + rnd() * RIM, amp = (rnd() - 0.5) * 3;
                    ctx.moveTo(X, y0); ctx.bezierCurveTo(X + W * 0.3, y0 + amp, X + W * 0.7, y0 - amp, X + W, y0 + amp * 0.5);
                } else {
                    const x0 = Math.min(bd.pts[0][0], bd.pts[1][0]) + rnd() * RIM, amp = (rnd() - 0.5) * 3;
                    ctx.moveTo(x0, Y); ctx.bezierCurveTo(x0 + amp, Y + H * 0.3, x0 - amp, Y + H * 0.7, x0 + amp * 0.5, Y + H);
                }
                ctx.stroke();
            }
            ctx.restore();
        }
        // mitre joints, the outer bevel, the lip round the felt
        ctx.save(); outer(); ctx.clip();
        ctx.strokeStyle = "rgba(10,4,0,0.6)"; ctx.lineWidth = 1.5;
        for (const [a, c] of [[[X, Y], [fx, fy]], [[X + W, Y], [fx + fw, fy]], [[X, Y + H], [fx, fy + fh]], [[X + W, Y + H], [fx + fw, fy + fh]]]) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
        ctx.restore();
        rr(ctx, X + 1, Y + 1, W - 2, H - 2, 19); ctx.strokeStyle = "rgba(255,214,170,0.16)"; ctx.lineWidth = 2; ctx.stroke();
        rr(ctx, X + 0.5, Y + 0.5, W - 1, H - 1, 20); ctx.strokeStyle = "rgba(8,3,0,0.9)"; ctx.lineWidth = 1.5; ctx.stroke();
        // brass corners
        for (const [cx0, cy0, sx, sy] of [[X, Y, 1, 1], [X + W, Y, -1, 1], [X, Y + H, 1, -1], [X + W, Y + H, -1, -1]]) {
            ctx.save(); ctx.translate(cx0, cy0); ctx.scale(sx, sy);
            ctx.beginPath(); ctx.moveTo(6, 3); ctx.lineTo(40, 3); ctx.lineTo(40, 11); ctx.lineTo(11, 11); ctx.lineTo(11, 40); ctx.lineTo(3, 40); ctx.lineTo(3, 6); ctx.quadraticCurveTo(3, 3, 6, 3); ctx.closePath();
            const bg = ctx.createLinearGradient(0, 0, 40, 40);
            bg.addColorStop(0, "#fbe39a"); bg.addColorStop(0.4, "#c9973a"); bg.addColorStop(1, "#6e4b10");
            ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = "rgba(40,24,2,0.85)"; ctx.lineWidth = 1; ctx.stroke();
            for (const [rx, ry] of [[7, 7], [30, 7], [7, 30]]) { ctx.beginPath(); ctx.arc(rx, ry, 1.8, 0, Math.PI * 2); ctx.fillStyle = "#4a3208"; ctx.fill(); ctx.beginPath(); ctx.arc(rx - 0.5, ry - 0.5, 0.8, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,240,190,0.9)"; ctx.fill(); }
            ctx.restore();
        }
        // the felt
        ctx.save();
        rr(ctx, fx, fy, fw, fh, 6); ctx.clip();
        const fg = ctx.createRadialGradient(fx + fw / 2, fy + fh * 0.46, 30, fx + fw / 2, fy + fh / 2, fw * 0.62);
        fg.addColorStop(0, "#2f6d4c"); fg.addColorStop(0.55, "#205239"); fg.addColorStop(1, "#123424");
        ctx.fillStyle = fg; ctx.fillRect(fx, fy, fw, fh);
        const img = ctx.getImageData(fx, fy, fw, fh), d = img.data;   // the nap of the cloth
        for (let i = 0; i < d.length; i += 4) {
            const n = (rnd() - 0.5) * 16 + (((i >> 2) % 3) - 1) * 1.5;
            d[i] = clamp(d[i] + n, 0, 255); d[i + 1] = clamp(d[i + 1] + n * 1.1, 0, 255); d[i + 2] = clamp(d[i + 2] + n * 0.9, 0, 255);
        }
        ctx.putImageData(img, fx, fy);
        // darker bands for the set-aside dice at both ends
        for (const x0 of [fx, fx + fw - COL_W]) { ctx.fillStyle = "rgba(0,0,0,0.13)"; ctx.fillRect(x0, fy, COL_W, fh); }
        // the shadow of the rim on the cloth
        for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [[0, fy, 0, fy + 26, fx, fy, fw, 26], [0, fy + fh, 0, fy + fh - 22, fx, fy + fh - 22, fw, 22], [fx, 0, fx + 22, 0, fx, fy, 22, fh], [fx + fw, 0, fx + fw - 22, 0, fx + fw - 22, fy, 22, fh]]) {
            const sg = ctx.createLinearGradient(x0, y0, x1, y1);
            sg.addColorStop(0, "rgba(0,0,0,0.5)"); sg.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = sg; ctx.fillRect(rx, ry, rw, rh);
        }
        ctx.restore();
        // gold lines: the border inside the felt, the columns' edges, the circle of the pot
        ctx.save();
        ctx.strokeStyle = FELT_GOLD + "0.34)"; ctx.lineWidth = 1.5;
        rr(ctx, fx + 10.5, fy + 10.5, fw - 21, fh - 21, 4); ctx.stroke();
        ctx.setLineDash([5, 6]); ctx.strokeStyle = FELT_GOLD + "0.22)"; ctx.lineWidth = 1;
        for (const x0 of [fx + COL_W + 0.5, fx + fw - COL_W - 0.5]) { ctx.beginPath(); ctx.moveTo(x0, fy + 22); ctx.lineTo(x0, fy + fh - 22); ctx.stroke(); }
        ctx.setLineDash([]);
        const px = POT.x - ox, py = POT.y - oy + 8;
        ctx.beginPath(); ctx.ellipse(px, py, 74, 58, 0, 0, Math.PI * 2); ctx.strokeStyle = FELT_GOLD + "0.26)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(px, py, 67, 51, 0, 0, Math.PI * 2); ctx.strokeStyle = FELT_GOLD + "0.12)"; ctx.lineWidth = 1; ctx.stroke();
        arcWords(ctx, "POD ZŁOTYM KUFLEM", px, py, 90, 72, -Math.PI / 2, FELT_GOLD + "0.30)", 13);
        ctx.restore();
        // the lip where the cloth meets the wood
        rr(ctx, fx - 0.5, fy - 0.5, fw + 1, fh + 1, 6); ctx.strokeStyle = "rgba(0,0,0,0.75)"; ctx.lineWidth = 2; ctx.stroke();
        rr(ctx, fx - 2.5, fy - 2.5, fw + 5, fh + 5, 7); ctx.strokeStyle = "rgba(255,214,170,0.13)"; ctx.lineWidth = 1; ctx.stroke();
        dirty(b);
        return { x: ox, y: oy };
    }

    // ==================================================================
    // Sprites. Everything moves in logic ticks (tick()), so the tests' turbo speeds it all up alike.
    // ==================================================================
    // a die on the table: tx, ty = where it touches the cloth; h = how high above it; rot; k = size (1 on the table)
    class DieSprite extends Sprite {
        initialize(type, face, rng) {
            super.initialize();
            this.type = type;
            this.face = face;
            this.rng = rng || Math.random;
            this.shadow = new Sprite(dieShadow());
            this.glow = new Sprite(dieGlow());
            this.body = new Sprite(dieBitmap(type, face));
            for (const s of [this.shadow, this.glow, this.body]) { s.anchor.set(0.5, 0.5); this.addChild(s); }
            this.glow.blendMode = PIXI.BLEND_MODES.ADD;
            this.glow.visible = false;
            this.tx = 0; this.ty = 0; this.h = 0; this.rot = 0; this.k = 1;
            this.lift = 0; this.liftTo = 0; this.dim = 0; this.dimTo = 0; this.sq = 0; this.fade = 1;
            this.anim = null;
            this.t = 0;
            this.onImpact = null;
            this._blend = -1;
        }
        setFace(f) {
            if (f === this.face) return;
            this.face = f;
            this.body.bitmap = dieBitmap(this.type, f);
        }
        // thrown from (sx, sy) at height h0 to land on (ex, ey) after D ticks, ending turned by rot1
        fly(o) {
            this.tx = o.sx; this.ty = o.sy; this.h = o.h0;
            this.anim = { kind: "fly", t: 0, D: o.D, sx: o.sx, sy: o.sy, ex: o.ex, ey: o.ey, h0: o.h0, spin: o.spin, rot1: o.rot1, final: o.face, hits: 0, next: 0, delay: o.delay || 0 };
            this.rot = o.rot1 + o.spin;
            this.visible = !(o.delay > 0);
        }
        // slides (with a little hop of height arc) to (ex, ey), growing to size k1, in D ticks
        moveTo(ex, ey, D, k1, arc, rot1) {
            this.anim = { kind: "move", t: 0, D: Math.max(1, D), sx: this.tx, sy: this.ty, ex, ey, k0: this.k, k1: k1 === undefined ? this.k : k1, arc: arc || 0, r0: this.rot, r1: rot1 === undefined ? this.rot : rot1 };
        }
        fadeOut(D) { this.anim = { kind: "fade", t: 0, D: Math.max(1, D) }; }
        busy() { return !!this.anim; }
        tick() {
            this.t++;
            const a = this.anim;
            if (a && a.kind === "fly" && a.delay > 0) {   // (still in the cup)
                a.delay--;
                if (!a.delay) this.visible = true;
            } else if (a && a.kind === "fly") {
                a.t++;
                const u = clamp(a.t / a.D, 0, 1), p = 1 - Math.pow(1 - u, 2.3);
                this.tx = lerp(a.sx, a.ex, p);
                this.ty = lerp(a.sy, a.ey, p);
                const U = [0.4, 0.68, 0.84];
                if (u < U[0]) { const q = u / U[0]; this.h = a.h0 * (1 - q) + 44 * 4 * q * (1 - q); }
                else if (u < U[1]) { const q = (u - U[0]) / (U[1] - U[0]); this.h = 15 * 4 * q * (1 - q); }
                else if (u < U[2]) { const q = (u - U[1]) / (U[2] - U[1]); this.h = 4.5 * 4 * q * (1 - q); }
                else this.h = 0;
                while (a.hits < 3 && u >= U[a.hits]) { if (this.onImpact) this.onImpact(this, a.hits); a.hits++; }
                this.rot = a.rot1 + a.spin * (1 - easeOut(u));
                if (u < U[1]) {   // tumbling: other faces flash by, the cube looks squashed as it turns
                    if (a.t >= a.next) { this.setFace(1 + Math.floor(this.rng() * 6)); a.next = a.t + 3 + Math.floor(this.rng() * 3); }
                    this.sq = Math.abs(Math.sin(a.t * 0.55)) * (1 - u / U[1]);
                } else { this.setFace(a.final); this.sq = 0; }
                if (a.t >= a.D) { this.h = 0; this.sq = 0; this.rot = a.rot1; this.setFace(a.final); this.anim = null; }
            } else if (a && a.kind === "move") {
                a.t++;
                const u = easeInOut(a.t / a.D);
                this.tx = lerp(a.sx, a.ex, u);
                this.ty = lerp(a.sy, a.ey, u);
                this.k = lerp(a.k0, a.k1, u);
                this.h = a.arc * 4 * u * (1 - u);
                this.rot = lerp(a.r0, a.r1, u);
                if (a.t >= a.D) { this.h = 0; this.anim = null; }
            } else if (a && a.kind === "fade") {
                a.t++;
                this.fade = 1 - a.t / a.D;
                if (a.t >= a.D) { this.fade = 0; this.anim = null; this.visible = false; }
            }
            this.lift += clamp(this.liftTo - this.lift, -1 / 6, 1 / 6);
            this.dim += clamp(this.dimTo - this.dim, -1 / 10, 1 / 10);
            this.place();
        }
        place() {
            const lift = this.lift, h = this.h + lift * 7, base = DIE_SCALE * this.k;
            const s = base * (1 + h / 170 + lift * 0.05), sq = this.sq * 0.2;
            this.x = Math.round(this.tx * 2) / 2;
            this.y = Math.round(this.ty * 2) / 2;
            this.body.y = -h * 0.55;
            this.body.rotation = this.rot;
            this.body.scale.set(s * (1 - sq), s * (1 - sq * 0.4));
            this.shadow.x = 3 + h * 0.32;
            this.shadow.y = 5 + h * 0.42;
            this.shadow.rotation = this.rot;
            this.shadow.scale.set(base * (1 + h / 240));
            this.shadow.opacity = Math.round(255 * clamp(0.92 - h / 120, 0.25, 0.92) * this.fade);
            this.glow.visible = lift > 0.02;
            if (this.glow.visible) {
                this.glow.y = this.body.y;
                this.glow.rotation = this.rot;
                this.glow.scale.set(s);
                this.glow.opacity = Math.round(lift * (190 + 60 * Math.sin(this.t / 7)) * this.fade);
            }
            this.body.opacity = Math.round(255 * this.fade);
            const blend = Math.round(this.dim * 150);
            if (blend !== this._blend) { this._blend = blend; this.body.setBlendColor([24, 26, 30, blend]); }
        }
        // the die's box on the screen (for the mouse)
        hit(x, y) { const r = 34 * this.k; return Math.abs(x - this.x) <= r && Math.abs(y - (this.y + this.body.y)) <= r; }
    }

    // the leather cup: comes in from its owner's side, is shaken, tips the dice out and goes
    class CupSprite extends Sprite {
        initialize() {
            super.initialize();
            this.shadow = new Sprite(cupShadow());
            this.shadow.anchor.set(0.5, 0.5);
            this.shadow.scale.set(0.5);
            this.body = new Sprite(cupBitmap());
            this.body.anchor.set(0.5, 206 / CUP_H);   // (the middle of the base)
            this.body.scale.set(0.5);
            this.addChild(this.shadow);
            this.addChild(this.body);
            this.visible = false;
            this.mode = "hidden";
            this.t = 0;
            this.dir = 1;
            this.bx = 0; this.by = 0; this.lift = 0; this.rot = 0; this.alpha2 = 0;
            this.onRattle = null;
            this.onRelease = null;
        }
        // side: 1 = the hero's (tips to the right), -1 = the rival's; (x, y) where it stands
        enter(x, y, side) {
            this.dir = side;
            this.bx = x; this.by = y;
            this.mode = "enter"; this.t = 0;
            this.visible = true;
        }
        shake(ticks) { this.mode = "shake"; this.t = 0; this.shakeFor = ticks || 44; }
        pour() { this.mode = "pour"; this.t = 0; this.released = false; }
        leave() { this.mode = "leave"; this.t = 0; }
        mouth() {   // where the dice come out (screen px)
            const r = this.body.rotation, len = (206 - 40) * 0.5 + 8;
            return { x: this.x + Math.sin(r) * len, y: this.y + this.body.y - Math.cos(r) * len, h: 26 };
        }
        busy() { return this.mode === "enter" || this.mode === "shake" || this.mode === "pour" || this.mode === "leave"; }
        tick() {
            if (!this.visible) return;
            this.t++;
            const t = this.t;
            let ox = 0, oy = 0, rot = 0, lift = 0, op = 1;
            if (this.mode === "enter") {
                const u = easeOut(t / 14);
                ox = -this.dir * 60 * (1 - u); op = u;
                if (t >= 14) this.mode = "ready";
            } else if (this.mode === "shake") {
                const env = Math.sin(Math.PI * clamp(t / this.shakeFor, 0, 1));
                ox = Math.sin(t * 0.95) * 5 * env;
                oy = Math.cos(t * 1.3) * 2.5 * env;
                rot = Math.sin(t * 0.78) * 0.17 * env;
                lift = Math.abs(Math.sin(t * 0.42)) * 16 * env;
                if (this.onRattle && t % 5 === 1 && t < this.shakeFor - 3) this.onRattle(env);
                if (t >= this.shakeFor) this.mode = "ready";
            } else if (this.mode === "pour") {
                const u = easeBack(t / 12);
                rot = this.dir * 1.3 * u; lift = 18 * Math.min(1, t / 8); ox = this.dir * 14 * u;
                if (t === 7 && this.onRelease && !this.released) { this.released = true; this.onRelease(); }
                if (t >= 20) this.mode = "poured";
            } else if (this.mode === "poured") {
                rot = this.dir * 1.3; lift = 18; ox = this.dir * 14;
            } else if (this.mode === "leave") {
                const u = easeInOut(t / 18);
                rot = this.dir * 1.3 * (1 - u); lift = 18 * (1 - u); ox = this.dir * 14 - this.dir * 70 * u; op = 1 - u;
                if (t >= 18) { this.mode = "hidden"; this.visible = false; }
            }
            this.x = this.bx + ox;
            this.y = this.by + oy;
            this.body.y = -lift;
            this.body.rotation = rot;
            this.shadow.x = 6 + lift * 0.3; this.shadow.y = 6 + lift * 0.25;
            this.shadow.scale.set(0.5 * (1 - lift / 120));
            this.opacity = Math.round(255 * clamp(op, 0, 1));
        }
    }

    // a bust in a bottom corner: slides in from its side; dimmed while it is the other one's turn
    const BUST_H = 273;
    class BustSprite extends Sprite {
        initialize(side) {
            super.initialize();
            this.side = side;   // "left" (the hero, mirrored to look right) | "right"
            this.anchor.set(0, 1);
            this.k = 0; this.want = false; this.light = 1; this.lightTo = 1; this.jolt = 0; this.hop = 0; this._blend = -1;
            this.name = "";
            this.visible = false;
        }
        setPicture(name) {
            if (name === this.name) return;
            this.name = name;
            this.bitmap = name ? loadBust(name) : null;
        }
        tick() {
            this.k = clamp(this.k + (this.want ? 1 : -1) / 14, 0, 1);
            this.light += clamp(this.lightTo - this.light, -0.05, 0.05);
            if (this.jolt > 0) this.jolt--;
            if (this.hop > 0) this.hop--;
            const b = this.bitmap, ready = b && b.isReady() && b.height > 0 && !b.isError();
            this.visible = ready && this.k > 0;
            if (!this.visible) return;
            const sc = BUST_H / b.height, w = b.width * sc, left = this.side === "left", e = easeOut(this.k);
            const x0 = left ? 0 : Graphics.width - w, slide = (1 - e) * (w + 20) * (left ? -1 : 1);
            const shake = this.jolt > 0 ? Math.sin(this.jolt * 1.7) * 3 : 0, hop = this.hop > 0 ? -Math.sin(Math.PI * this.hop / 16) * 7 : 0;
            this.scale.set(left ? -sc : sc, sc);
            this.x = Math.round(x0 + slide + (left ? w : 0) + shake);
            this.y = Graphics.height + Math.round(hop);
            this.opacity = Math.round(255 * Math.min(1, e * 1.4));
            const blend = Math.round((1 - this.light) * 255);
            if (blend !== this._blend) { this._blend = blend; this.setBlendColor([6, 6, 10, blend]); }
        }
        box() {   // the bust's rectangle on the screen
            const b = this.bitmap;
            if (!b || !b.isReady() || !b.height) return { x: this.side === "left" ? 0 : Graphics.width - 257, w: 257, top: Graphics.height - BUST_H };
            const w = Math.round(b.width * BUST_H / b.height);
            return { x: this.side === "left" ? 0 : Graphics.width - w, w, top: Graphics.height - BUST_H };
        }
    }
    // busts load outside ImageManager's cache (a missing file must not stop the game with a load error)
    const bustCache = new Map();
    function loadBust(name) {
        let b = bustCache.get(name);
        if (!b) { b = Bitmap.load("img/pictures/" + Utils.encodeURI(name) + ".png"); b.smooth = true; bustCache.set(name, b); }
        return b;
    }
    function heroBustName() {
        try { if (window.SpeechBubbles && SpeechBubbles.heroBust) { const n = SpeechBubbles.heroBust(); if (n) return n; } } catch (e) {}
        if (!window.HeroLook || (HeroLook.active && HeroLook.active())) return "Hero_Bust";
        const a = window.$gameParty && $gameParty.leader();
        return (a && a.pictureName && a.pictureName()) || "Hero_Bust";
    }

    // a speech bubble above a bust, its tail down to the head
    const BUBBLE = { w: 236, font: 18, line: 24, pad: 13, tail: 13 };
    class BubbleSprite extends Sprite {
        initialize(side) {
            super.initialize();
            this.side = side;
            this.anchor.set(0.5, 1);
            this.t = 0; this.life = 0;
            this.visible = false;
            this.text = "";
        }
        say(text, frames) {
            this.text = String(text);
            const probe = new Bitmap(8, 8), inner = BUBBLE.w - BUBBLE.pad * 2;
            const lines = wrapLines(probe, this.text, inner, BUBBLE.font);
            const h = lines.length * BUBBLE.line + BUBBLE.pad * 2 - 4, H = h + BUBBLE.tail + 2;
            const b = new Bitmap(BUBBLE.w + 4, H), ctx = b.context, S = ST();
            const tailX = this.side === "left" ? BUBBLE.w * 0.5 : BUBBLE.w * 0.5;
            // the panel with its tail
            const x0 = 1.5, y0 = 1.5, w = BUBBLE.w - 1, c = 6;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x0 + c, y0); ctx.lineTo(x0 + w - c, y0); ctx.lineTo(x0 + w, y0 + c); ctx.lineTo(x0 + w, y0 + h - c); ctx.lineTo(x0 + w - c, y0 + h);
            ctx.lineTo(tailX + 10, y0 + h); ctx.lineTo(tailX + (this.side === "left" ? 6 : -6), y0 + h + BUBBLE.tail); ctx.lineTo(tailX - 10, y0 + h);
            ctx.lineTo(x0 + c, y0 + h); ctx.lineTo(x0, y0 + h - c); ctx.lineTo(x0, y0 + c); ctx.closePath();
            ctx.fillStyle = "rgba(11,12,15,0.9)"; ctx.fill();
            ctx.strokeStyle = S.line; ctx.lineWidth = 1; ctx.stroke();
            ctx.strokeStyle = S.accent; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x0 + 0.5, y0 + c + 10); ctx.lineTo(x0 + 0.5, y0 + c); ctx.lineTo(x0 + c, y0 + 0.5); ctx.lineTo(x0 + c + 10, y0 + 0.5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x0 + w - 0.5, y0 + h - c - 10); ctx.lineTo(x0 + w - 0.5, y0 + h - c); ctx.lineTo(x0 + w - c, y0 + h - 0.5); ctx.lineTo(x0 + w - c - 10, y0 + h - 0.5); ctx.stroke();
            ctx.restore();
            dirty(b);
            lines.forEach((l, i) => txt(b, l, x0 + BUBBLE.pad, y0 + BUBBLE.pad - 4 + i * BUBBLE.line, inner, { size: BUBBLE.font, color: S.text, lh: BUBBLE.line }));
            const old = this.bitmap;
            this.bitmap = b;
            if (old) old.destroy();
            this.anchor.set((tailX + (this.side === "left" ? 6 : -6)) / b.width, 1);
            this.t = 0;
            this.life = frames || clamp(110 + this.text.length * 3.2, 150, 360);
            this.visible = true;
        }
        hide() { if (this.visible && this.t < this.life - 14) this.t = this.life - 14; }
        tick() {
            if (!this.visible) return;
            this.t++;
            const k = Math.min(1, this.t / 10, (this.life - this.t) / 14);
            this.opacity = Math.round(255 * clamp(k, 0, 1));
            this.oy = Math.round(5 * (1 - Math.min(1, this.t / 10)));
            if (this.t >= this.life) { this.visible = false; this.text = ""; }
        }
        shown() { return this.visible && this.t < this.life - 14; }
    }

    // a banner across the table: "Pudło!", "Gorące kości!", "Twoja tura"...
    const BANNERS = {
        bust: { line: "#ff7b6b", text: "#ff8f7f", glow: "rgba(255,90,70,0.20)", size: 64 },
        hot: { line: "#ffb347", text: "#ffc861", glow: "rgba(255,150,40,0.24)", size: 60 },
        turn: { line: "#3a3e46", text: "#ffd23f", glow: "rgba(255,210,63,0.08)", size: 34 },
        win: { line: "#ffd23f", text: "#ffd23f", glow: "rgba(255,210,63,0.26)", size: 68 },
        lose: { line: "#8a9099", text: "#d4d8de", glow: "rgba(160,170,190,0.10)", size: 60 }
    };
    class BannerSprite extends Sprite {
        initialize() {
            super.initialize(new Bitmap(TBL.w - 40, 160));
            this.anchor.set(0.5, 0.5);
            this.x = TBL.x + TBL.w / 2;
            this.y = POT.y;
            this.visible = false;
            this.t = 0; this.life = 0; this.kind = "";
        }
        show(kind, title, sub, life, y) {
            this.y = y || POT.y;
            const B = BANNERS[kind] || BANNERS.turn, b = this.bitmap, ctx = b.context, W = b.width, H = b.height;
            const small = kind === "turn", bh = small ? 64 : sub ? 128 : 104, by = (H - bh) / 2;
            b.clear();
            ctx.save();
            const g = ctx.createLinearGradient(0, 0, W, 0);
            g.addColorStop(0, "rgba(8,9,11,0)"); g.addColorStop(0.16, "rgba(8,9,11,0.9)"); g.addColorStop(0.84, "rgba(8,9,11,0.9)"); g.addColorStop(1, "rgba(8,9,11,0)");
            ctx.fillStyle = g; ctx.fillRect(0, by, W, bh);
            const gl = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.42);
            gl.addColorStop(0, B.glow); gl.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = gl; ctx.fillRect(0, by, W, bh);
            const lg = ctx.createLinearGradient(0, 0, W, 0);
            lg.addColorStop(0, "rgba(0,0,0,0)"); lg.addColorStop(0.2, B.line); lg.addColorStop(0.8, B.line); lg.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = lg; ctx.fillRect(0, by, W, 2); ctx.fillRect(0, by + bh - 2, W, 2);
            ctx.restore();
            dirty(b);
            const ty = small ? by + 10 : by + (sub ? 14 : 18);
            txt(b, title, 0, ty, W, { size: B.size, color: B.text, bold: true, align: "center", outline: 5 });
            if (sub) txt(b, sub, 0, by + bh - 38, W, { size: 20, color: "#d8dde3", align: "center" });
            this.kind = kind;
            this.t = 0;
            this.life = life || (small ? 70 : 110);
            this.visible = true;
        }
        tick() {
            if (!this.visible) return;
            this.t++;
            const t = this.t, fin = Math.min(1, t / 10), fout = clamp((this.life - t) / 14, 0, 1);
            this.opacity = Math.round(255 * Math.min(fin, fout));
            const s = this.kind === "turn" ? 0.94 + 0.06 * easeOut(t / 10) : 0.8 + 0.2 * easeBack(t / 14);
            this.scale.set(s, s);
            this.x = TBL.x + TBL.w / 2 + (this.kind === "bust" && t < 18 ? Math.sin(t * 2.1) * (18 - t) * 0.6 : 0);
            if (t >= this.life) this.visible = false;
        }
        shown() { return this.visible; }
    }

    // floating words: "+500 Mały strit"
    class FloatText extends Sprite {
        initialize(text, sub, colour, size) {
            const probe = new Bitmap(8, 8), s = size || 34;
            const w = Math.ceil(Math.max(measure(probe, text, s, true), sub ? measure(probe, sub, 19, true) : 0)) + 24;
            super.initialize(new Bitmap(w, s + (sub ? 34 : 14)));
            txt(this.bitmap, text, 0, 0, w, { size: s, color: colour || ST().accent, bold: true, outline: 5, align: "center" });
            if (sub) txt(this.bitmap, sub, 0, s + 4, w, { size: 19, color: "#f4f1e8", bold: true, outline: 4, align: "center" });
            this.anchor.set(0.5, 1);
            this.life = 0; this.max = 78; this.vy = -1.1;
        }
        tick() {
            this.life++;
            this.y += this.life < 22 ? this.vy : this.vy * 0.25;
            const s = this.life < 8 ? 0.7 + 0.3 * easeBack(this.life / 8) : 1;
            this.scale.set(s, s);
            this.opacity = this.life > this.max - 20 ? 255 * (this.max - this.life) / 20 : 255;
            return this.life < this.max;
        }
    }
    class Particle extends Sprite {
        initialize(bitmap, vx, vy, life, grav, add) {
            super.initialize(bitmap);
            this.anchor.set(0.5, 0.5);
            if (add) this.blendMode = PIXI.BLEND_MODES.ADD;
            this.vx = vx; this.vy = vy; this.life = 0; this.max = life; this.grav = grav || 0;
        }
        tick() {
            this.life++;
            this.x += this.vx; this.y += this.vy; this.vy += this.grav; this.vx *= 0.97;
            this.opacity = 255 * (1 - this.life / this.max);
            return this.life < this.max;
        }
    }
    // a coin flying along a curve from a to b; onArrive when it gets there
    class CoinFly extends Sprite {
        initialize(a, b, delay, D, onArrive) {
            super.initialize(coinBitmap());
            this.anchor.set(0.5, 0.5);
            this.scale.set(0.5);
            this.a = a; this.b = b; this.delay = delay; this.D = D; this.t = 0; this.onArrive = onArrive;
            this.cx = (a.x + b.x) / 2 + (b.y - a.y) * 0.15; this.cy = Math.min(a.y, b.y) - 90;
            this.visible = false;
        }
        tick() {
            this.t++;
            const t = this.t - this.delay;
            if (t < 0) return true;
            this.visible = true;
            const u = easeInOut(t / this.D), iu = 1 - u;
            this.x = iu * iu * this.a.x + 2 * iu * u * this.cx + u * u * this.b.x;
            this.y = iu * iu * this.a.y + 2 * iu * u * this.cy + u * u * this.b.y;
            this.scale.set(0.5 * (0.9 + 0.3 * Math.sin(Math.PI * u)) * Math.abs(Math.cos(t * 0.3)) + 0.12, 0.5 * (0.9 + 0.3 * Math.sin(Math.PI * u)));
            if (t >= this.D) { if (this.onArrive) this.onArrive(); return false; }
            return true;
        }
    }

    // ==================================================================
    // Sounds (the RTP's own): the cup's rattle and the dice's clack are short clicks and knocks at random pitches
    // ==================================================================
    let seBudget = 4;   // SEs a frame (turbo would pile them up)
    // the table's sounds come from a few preloaded players per file (no new download for every click, and a file that fails to load
    // stays silent: AudioManager would stop the whole game with "Failed to load")
    const SE_POOL = new Map();
    function sePlayer(name) {
        let pool = SE_POOL.get(name);
        if (!pool) {
            const url = AudioManager._path + "se/" + Utils.encodeURI(name) + AudioManager.audioFileExt();
            pool = { i: 0, list: [0, 1, 2].map(() => new WebAudio(url)) };
            SE_POOL.set(name, pool);
        }
        return pool.list[pool.i++ % pool.list.length];
    }
    function se(name, volume, pitch, pan) {
        if (!name || seBudget <= 0) return;
        seBudget--;
        try {
            const a = sePlayer(name);
            if (a.isError()) return;
            a.volume = (AudioManager.seVolume * (volume || 80)) / 10000;
            a.pitch = (pitch || 100) / 100;
            a.pan = (pan || 0) / 100;
            a.play(false, 0);
        } catch (e) {}
    }
    const SND = {
        cursor: ["Cursor1", 50, 100], on: ["Switch1", 70, 132], off: ["Switch1", 55, 95], decide: ["Decision1", 60, 100], cancel: ["Cancel1", 60, 100],
        buzzer: ["Buzzer1", 50, 100], coin: ["Coin", 50, 100], coins: ["Shop1", 55, 105], bank: ["Item1", 55, 112], bust: ["Miss", 85, 80],
        hot: ["Fire1", 70, 115], hot2: ["Flash1", 40, 125], combo: ["Item3", 40, 125], big: ["Chime2", 55, 100], vision: ["Stare", 60, 100],
        laugh: ["Laugh", 40, 108], lose: ["Disappointment", 60, 100], page: ["Book1", 55, 100], tick: ["Cursor1", 25, 140]
    };
    const snd = (k, volK, pitchAdd) => { const s = SND[k]; if (s) se(s[0], Math.round(s[1] * (volK === undefined ? 1 : volK)), s[2] + (pitchAdd || 0)); };

    // ==================================================================
    // The scene
    // ==================================================================
    let pendingOpts = null, running = null, pendingEnd = null;
    const HEADER = { x: 12, y: 8, w: 1256, h: 46 };
    const SIDE_L = { x: 12, y: 64, w: 240, h: 228 }, SIDE_R = { x: 1028, y: 64, w: 240, h: 228 };
    const BAR = { x: TBL.x, y: 620, w: TBL.w, h: 44 }, HINT = { x: TBL.x, y: 678, w: TBL.w, h: 32 };
    const BTN = [
        { id: "rules", x: 0, w: 118, label: "Zasady", small: true },
        { id: "roll", x: 162, w: 212, primary: true },
        { id: "bank", x: 382, w: 212, primary: true },
        { id: "leave", x: 638, w: 118, label: "Odejdź", small: true }
    ];

    class Scene_TavernDice extends Scene_Base {
        initialize() {
            super.initialize();
            this.opts = pendingOpts || {};
            pendingOpts = null;
        }
        create() {
            super.create();
            this.turbo = clamp(Math.floor(this.opts.turbo || 1), 1, 40);
            this.seed = this.opts.seed !== undefined ? Number(this.opts.seed) >>> 0 : ((Date.now() ^ (store().games * 7919 + 17)) >>> 0);
            this.fxRng = makeRng(this.seed ^ 0x5bd1e995);
            this.results = [];
            this.rewards = { xp: 0, notes: [], notices: [] };
            this.keys = {}; this.prev = {}; this.trig = {};
            this.phase = "none";
            this.co = null; this.wait = 0; this.waitFn = null;
            this.dice = [];
            this.aside = [[], []];
            this.fx = [];
            this.focus = { row: "btn", i: 1 };
            this.heroAct = null;
            this.waitHero = null;
            this.game = null;
            this.shown = [0, 0];
            this.countHold = [0, 0];
            this.talkLog = [];
            this.gameNo = 0;
            this.lastMouse = { x: -1, y: -1 };
            ImageManager.loadSystem("IconSet");
            [heroBustName()].concat(OPP_ORDER.map(k => OPPONENTS[k].bust)).forEach(loadBust);
            this.createLayers();
        }
        createLayers() {
            const W = Graphics.width, H = Graphics.height;
            const snap = SceneManager.backgroundBitmap();
            this.bg = new Sprite(snap || solidBitmap("#15100b"));
            if (!snap) this.bg.scale.set(W / 4, H / 4);
            else { const f = new PIXI.filters.BlurFilter(); f.blur = 6; this.bg.filters = [f]; }
            this.addChild(this.bg);
            const shade = new Bitmap(W, H), sc = shade.context;
            sc.fillStyle = "rgba(9,7,5,0.62)"; sc.fillRect(0, 0, W, H);
            const vg = sc.createRadialGradient(W / 2, H * 0.47, 160, W / 2, H * 0.47, W * 0.66);
            vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.72)");
            sc.fillStyle = vg; sc.fillRect(0, 0, W, H);
            dirty(shade);
            this.addChild(new Sprite(shade));
            const tb = new Bitmap(TBL.w + 60, TBL.h + 60);
            tb.smooth = true;
            const at = paintTable(tb);
            this.table = new Sprite(tb);
            this.table.x = at.x; this.table.y = at.y;
            this.addChild(this.table);
            // candlelight on the cloth (added light, flickering)
            this.lights = new Sprite();
            this.lights.blendMode = PIXI.BLEND_MODES.ADD;
            this.addChild(this.lights);
            this.candleSpots = [{ x: TBL.x + 12, y: TBL.y + 142 }, { x: TBL.x + TBL.w - 12, y: TBL.y + 142 }];
            this.glows = this.candleSpots.map(p => {
                const g = new Sprite(glowBitmap());
                g.anchor.set(0.5, 0.5); g.x = p.x; g.y = p.y - 30; g.scale.set(2.1); g.blendMode = PIXI.BLEND_MODES.ADD;
                this.lights.addChild(g);
                return g;
            });
            this.centreGlow = new Sprite(glowBitmap());
            this.centreGlow.anchor.set(0.5, 0.5); this.centreGlow.x = POT.x; this.centreGlow.y = POT.y; this.centreGlow.scale.set(3.4, 2.6); this.centreGlow.opacity = 70;
            this.centreGlow.blendMode = PIXI.BLEND_MODES.ADD;
            this.lights.addChild(this.centreGlow);
            // the pot and its label, the labels on the cloth
            this.potSpr = new Sprite();
            this.potSpr.anchor.set(0.5, 150 / 180); this.potSpr.scale.set(0.5); this.potSpr.x = POT.x; this.potSpr.y = POT.y + 22;
            this.addChild(this.potSpr);
            this.feltText = new Sprite(new Bitmap(FELT.w, FELT.h));
            this.feltText.x = FELT.x; this.feltText.y = FELT.y;
            this.addChild(this.feltText);
            // the dice, the cup, the keyboard's brackets
            this.diceLayer = new Sprite();
            this.addChild(this.diceLayer);
            this.cup = new CupSprite();
            this.addChild(this.cup);
            this.focusSpr = new Sprite(focusBitmap());
            this.focusSpr.anchor.set(0.5, 0.5); this.focusSpr.visible = false;
            this.addChild(this.focusSpr);
            // the candles (on the rim)
            this.flames = [];
            for (const p of this.candleSpots) {
                const c = new Sprite(candleBitmap());
                c.anchor.set(0.5, 104 / 120); c.scale.set(0.5); c.x = p.x; c.y = p.y;
                this.addChild(c);
                const f = new Sprite(flameBitmap());
                f.anchor.set(0.5, 0.9); f.scale.set(0.5); f.x = p.x; f.y = p.y - 32; f.blendMode = PIXI.BLEND_MODES.ADD;
                this.addChild(f);
                this.flames.push(f);
            }
            // warm specks drifting in the candlelight over the table
            this.motes = [];
            const moteLayer = new Sprite();
            moteLayer.blendMode = PIXI.BLEND_MODES.ADD;
            this.addChild(moteLayer);
            for (let i = 0; i < 18; i++) {
                const s = new Sprite(moteBitmap());
                s.anchor.set(0.5, 0.5);
                s.blendMode = PIXI.BLEND_MODES.ADD;
                moteLayer.addChild(s);
                this.motes.push({ s, x: TBL.x + Math.random() * TBL.w, y: TBL.y + Math.random() * TBL.h, vy: -(0.08 + Math.random() * 0.18), ph: Math.random() * 6.3, k: 0.5 + Math.random() * 0.7 });
            }
            this.fxLayer = new Sprite();
            this.addChild(this.fxLayer);
            this.banner = new BannerSprite();
            this.addChild(this.banner);
            // the HUD
            this.header = new Sprite(new Bitmap(HEADER.w, HEADER.h)); this.header.x = HEADER.x; this.header.y = HEADER.y;
            this.panelL = new Sprite(new Bitmap(SIDE_L.w, SIDE_L.h)); this.panelL.x = SIDE_L.x; this.panelL.y = SIDE_L.y;
            this.panelR = new Sprite(new Bitmap(SIDE_R.w, SIDE_R.h)); this.panelR.x = SIDE_R.x; this.panelR.y = SIDE_R.y;
            this.bar = new Sprite(new Bitmap(BAR.w, BAR.h)); this.bar.x = BAR.x; this.bar.y = BAR.y;
            this.hint = new Sprite(new Bitmap(HINT.w, HINT.h)); this.hint.x = HINT.x; this.hint.y = HINT.y;
            for (const s of [this.header, this.panelL, this.panelR, this.bar, this.hint]) this.addChild(s);
            this.bustL = new BustSprite("left");
            this.bustR = new BustSprite("right");
            this.addChild(this.bustL);
            this.addChild(this.bustR);
            this.bubbleL = new BubbleSprite("left");
            this.bubbleR = new BubbleSprite("right");
            this.addChild(this.bubbleL);
            this.addChild(this.bubbleR);
            this.topFx = new Sprite();   // (coins fly over the panels)
            this.addChild(this.topFx);
            this.overlay = new Sprite(new Bitmap(W, H));
            this.overlay.visible = false;
            this.addChild(this.overlay);
            this.bustL.setPicture(heroBustName());
        }
        start() {
            super.start();
            running = this;
            for (const k of ["ok", "cancel", "up", "down", "left", "right"]) this.prev[k] = Input.isPressed(k === "cancel" ? "cancel" : k);   // (a key still held from the map does not count)
            this.startFadeIn(this.fadeSpeed(), false);
            if (this.opts.opponent && OPPONENTS[this.opts.opponent] && this.opts.stake) this.beginGame(this.opts.opponent, Number(this.opts.stake));
            else this.openLobby();
            if (!store().rulesSeen && this.opts.rules !== false) this.showRules();
        }
        isBusy() { return super.isBusy(); }
        // ---- the loop: logic ticks (turbo of them a frame, 3x as many while O is held in the rival's turn), then the pictures
        update() {
            super.update();
            seBudget = 4;
            if (this.phase === "left") return;
            const n = this.turbo * (this.hurry() ? 3 : 1);
            for (let i = 0; i < n; i++) {
                if (typeof TavernDice.onTick === "function") {
                    try { TavernDice.onTick(this); } catch (e) { console.error(e); TavernDice.onTick = null; }
                }
                this.readKeys();
                this.tick();
                if (this.phase === "leaving" || this.phase === "left") break;
            }
            this.frame();
        }
        hurry() {   // O held while the rival plays: his moves go 3x as fast
            return this.phase === "play" && !this.waitHero && !!this.game && this.game.match.cur === 1 && !this.opts.auto && Input.isPressed("ok");
        }
        readKeys() {
            const now = {
                ok: Input.isPressed("ok"), cancel: Input.isPressed("cancel") || Input.isPressed("menu"),
                up: Input.isPressed("up"), down: Input.isPressed("down"), left: Input.isPressed("left"), right: Input.isPressed("right")
            };
            for (const k in now) { this.trig[k] = now[k] && !this.prev[k]; this.prev[k] = now[k]; }
            this.keys = now;
            this.click = TouchInput.isTriggered() ? { x: TouchInput.x, y: TouchInput.y } : null;
            const mx = TouchInput.x, my = TouchInput.y;
            this.hover = (mx !== this.lastMouse.x || my !== this.lastMouse.y) && mx > 0 && my > 0 ? { x: mx, y: my } : null;
            this.lastMouse = { x: mx, y: my };
        }
        tick() {
            this.phaseT = (this.phaseT || 0) + 1;
            this.tickSprites();
            switch (this.phase) {
                case "lobby": this.lobbyInput(); break;
                case "rules": this.rulesInput(); break;
                case "confirm": this.confirmInput(); break;
                case "end": this.endInput(); break;
                case "play":
                    if (this.trig.cancel) { this.askLeave(); break; }
                    this.runCo();
                    if (this.phase === "play" && this.waitHero) this.heroInput();
                    else if (this.phase === "play" && this.click) this.sideButtons();
                    break;
            }
        }
        tickSprites() {
            for (const d of this.dice) d.tick();
            for (const side of this.aside) for (const d of side) d.tick();
            this.cup.tick();
            this.banner.tick();
            this.bustL.tick(); this.bustR.tick();
            this.bubbleL.tick(); this.bubbleR.tick();
            this.fx = this.fx.filter(f => { const alive = f.tick(); if (!alive) { if (f.parent) f.parent.removeChild(f); f.destroy(); } return alive; });
            // the scores count up to what is written down
            if (this.game) {
                const m = this.game.match;
                for (let i = 0; i < 2; i++) {
                    if (this.countHold[i] > 0) { this.countHold[i]--; continue; }
                    const want = m.players[i].total;
                    if (this.shown[i] < want) {
                        this.shown[i] = Math.min(want, this.shown[i] + Math.max(5, Math.ceil((want - this.shown[i]) / 9)));
                        if (this.phaseT % 3 === 0) snd("tick");
                    }
                }
            }
        }
        runCo() {
            if (!this.co) return;
            if (this.wait > 0) { this.wait--; return; }
            if (this.waitFn) { if (!this.waitFn()) return; this.waitFn = null; }
            for (let guard = 0; guard < 60 && this.co; guard++) {
                const r = this.co.next();
                if (r.done) { this.co = null; return; }
                const v = r.value;
                if (typeof v === "number") { if (v > 1) { this.wait = v - 1; return; } if (v === 1) return; continue; }
                if (typeof v === "function") { if (!v()) { this.waitFn = v; return; } continue; }
                return;
            }
        }
        // ---- pictures (every frame)
        frame() {
            const t = Graphics.frameCount;
            this.flames.forEach((f, i) => {
                const n = Math.sin(t * 0.21 + i * 2.1) * 0.5 + Math.sin(t * 0.47 + i) * 0.3 + Math.sin(t * 1.3 + i * 4) * 0.2;
                f.scale.set(0.5 * (1 + n * 0.04), 0.5 * (1 + n * 0.1));
                f.skew.x = Math.sin(t * 0.13 + i) * 0.06;
                this.glows[i].opacity = Math.round(150 + n * 40);
                this.glows[i].scale.set(2.1 + n * 0.05);
            });
            this.centreGlow.opacity = Math.round(62 + Math.sin(t * 0.05) * 8);
            for (const m of this.motes) {
                m.y += m.vy; m.x += Math.sin(t * 0.013 + m.ph) * 0.12;
                if (m.y < TBL.y - 10) { m.y = TBL.y + TBL.h; m.x = TBL.x + Math.random() * TBL.w; }
                m.s.x = m.x; m.s.y = m.y;
                m.s.scale.set(m.k);
                // (brighter near the candles)
                const near = Math.min(...this.candleSpots.map(c => Math.hypot(c.x - m.x, c.y - 30 - m.y)));
                m.s.opacity = Math.round((40 + 30 * Math.sin(t * 0.04 + m.ph)) * (1 + Math.max(0, 1 - near / 260) * 1.6));
            }
            this.diceLayer.children.sort((a, b) => a.ty - b.ty);
            this.placeFocus();
            this.placeBubbles();
            this.drawHeader();
            this.drawSides();
            this.drawBar();
            this.drawHint();
            this.drawFelt();
            this.drawPot();
            this.drawOverlay();
            if (this.phase === "leaving" && !this.isFading() && !this._popped) {
                this._popped = true;
                this.phase = "left";
                SceneManager.pop();
            }
        }
        placeBubbles() {
            const place = (bub, bust, cx) => {
                const top = Graphics.height - BUST_H + 16;
                bub.x = cx;
                bub.y = top + (bub.oy || 0);
            };
            place(this.bubbleL, this.bustL, SIDE_L.x + SIDE_L.w / 2);
            place(this.bubbleR, this.bustR, SIDE_R.x + SIDE_R.w / 2);
        }
        terminate() {
            super.terminate();
            Input.clear();
            if (running === this) running = null;
        }

        // ==============================================================
        // Starting a game: the stake goes into the pot, the dice are set, the flow begins
        // ==============================================================
        beginGame(key, stake) {
            const opp = OPPONENTS[key];
            if (!opp || !(stake > 0) || $gameParty.gold() < stake) { snd("buzzer"); return false; }
            this.gameNo++;
            const seed = (this.seed + (this.gameNo - 1) * 101) >>> 0, R = streams(seed), setup = setupGame(key, R.start);
            const heroDice = Array.isArray(this.opts.heroDice) && this.opts.heroDice.length === 6 ? this.opts.heroDice.slice() : heroSet();
            const match = new Match({
                target: this.opts.target || targetFor(stake, key), rng: R.dice, first: setup.first,
                players: [{ key: "hero", name: "Ty", dice: heroDice }, { key, name: opp.short, dice: setup.dice }]
            });
            if (Array.isArray(this.opts.script)) match.forced = this.opts.script.map(a => a.slice());
            $gameParty.loseGold(stake);
            this.game = {
                key, opp, stake, pot: stake * 2, seed, R, setup, match, potShown: 0, visions: 0, lastChat: -9, gift: null, done: false, left: false, started: false,
                heads: [this.opts.auto ? (AUTO_AI[this.opts.auto] || OPPONENTS[this.opts.auto] && OPPONENTS[this.opts.auto].ai || AUTO_AI.steady) : null, opp.ai],
                hour: hourNow(), day: dayNow()
            };
            this.shown = [0, 0];
            this.countHold = [0, 0];
            this.clearTable(true);
            this.bustR.setPicture(opp.bust);
            this.bustL.setPicture(heroBustName());
            this.bustL.want = this.bustR.want = true;
            this.bustL.lightTo = this.bustR.lightTo = 1;
            this.phase = "play";
            this.phaseT = 0;
            this.overlay.visible = false;
            this.co = this.gameFlow();
            this.wait = 0; this.waitFn = null;
            return true;
        }
        clearTable(all) {
            for (const d of this.dice) { if (d.parent) d.parent.removeChild(d); d.destroy({ children: true }); }
            this.dice = [];
            if (all) {
                for (const side of this.aside) for (const d of side) { if (d.parent) d.parent.removeChild(d); d.destroy({ children: true }); }
                this.aside = [[], []];
                for (const f of this.fx) { if (f.parent) f.parent.removeChild(f); f.destroy(); }
                this.fx = [];
            }
        }
        newDie(type, face) {
            const d = new DieSprite(type, face, this.fxRng);
            d.onImpact = (die, n) => this.dieImpact(die, n);
            this.diceLayer.addChild(d);
            return d;
        }
        dieImpact(die, n) {
            const r = this.fxRng;
            if (n === 0) { se("Knock", 50, 135 + Math.floor(r() * 25)); se("Switch1", 34, 115 + Math.floor(r() * 30)); }
            else if (n === 1) se("Switch1", 26, 135 + Math.floor(r() * 30));
            if (n <= 1) for (let i = 0; i < (n ? 2 : 4); i++) {   // a puff of the cloth's nap
                const a = r() * Math.PI * 2, v = 0.4 + r() * 0.8;
                this.addFx(new Particle(dustBitmap(), Math.cos(a) * v, Math.sin(a) * v * 0.6, 18 + Math.floor(r() * 10), 0), die.tx, die.ty + 6);
            }
        }
        addFx(s, x, y, top) {
            if (x !== undefined) { s.x = x; s.y = y; }
            (top || s instanceof CoinFly ? this.topFx : this.fxLayer).addChild(s);
            this.fx.push(s);
            return s;
        }
        float(text, sub, x, y, colour, size) { return this.addFx(new FloatText(text, sub, colour, size), x, y); }
        sparks(x, y, n, colour) {
            const r = this.fxRng;
            for (let i = 0; i < n; i++) {
                const a = -Math.PI / 2 + (r() - 0.5) * 2.2, v = 1 + r() * 2.6;
                this.addFx(new Particle(sparkBitmap(), Math.cos(a) * v, Math.sin(a) * v, 26 + Math.floor(r() * 20), 0.03, true), x + (r() - 0.5) * 30, y + (r() - 0.5) * 16);
            }
        }
        // a line of a speaker (1 the rival, 0 the hero) from its list key; chance: said only sometimes
        say(who, key, chance, force) {
            const g = this.game;
            if (!g) return false;
            const lines = who ? g.opp.lines[key] : HERO_LINES[key];
            if (!lines || !lines.length) return false;
            if (chance !== undefined && g.R.talk() >= chance) return false;
            return this.sayText(who, pickOf(g.R.talk, lines), force);
        }
        sayText(who, text, force) {
            const bub = who ? this.bubbleR : this.bubbleL;
            if (!force && bub.shown() && bub.t < 40) return false;
            bub.say(text);
            if (who) this.bustR.hop = 16; else this.bustL.hop = 16;
            this.talkLog.push({ who, text });
            if (this.talkLog.length > 40) this.talkLog.shift();
            return true;
        }

        // ==============================================================
        // The flow of a game (a generator: yield n = wait n ticks, yield fn = wait till fn() is true)
        // ==============================================================
        *gameFlow() {
            const g = this.game, m = g.match;
            yield 12;
            this.say(1, "greet", undefined, true);
            if (g.setup.special) { yield 70; this.say(1, "lucky", undefined, true); }
            yield* this.potIn();
            yield* this.rollOffFlow();
            while (!m.over) yield* this.turnFlow();
            yield* this.endFlow();
        }
        // both stakes fly into the pot
        *potIn() {
            const g = this.game, n = clamp(Math.ceil(g.stake / 5), 2, 8);
            let arrived = 0;
            for (let side = 0; side < 2; side++) {
                const from = side ? { x: SIDE_R.x + 40, y: SIDE_R.y + 24 } : { x: SIDE_L.x + 60, y: SIDE_L.y + 46 };
                for (let i = 0; i < n; i++) {
                    const to = { x: POT.x + (this.fxRng() - 0.5) * 30, y: POT.y + 4 + (this.fxRng() - 0.5) * 12 };
                    this.addFx(new CoinFly(from, to, i * 5 + side * 3, 30, () => {
                        arrived++;
                        g.potShown = Math.round(g.pot * arrived / (n * 2));
                        se("Coin", 38, 90 + Math.floor(this.fxRng() * 30));
                    }));
                }
            }
            yield () => arrived >= n * 2;
            g.potShown = g.pot;
            snd("coins", 0.8);
            yield 16;
        }
        // who starts: each throws one die, the higher starts (a tie: again)
        *rollOffFlow() {
            const g = this.game;
            this.banner.show("turn", "Kto zaczyna?", null, 42);
            yield 36;
            for (const [a, b] of g.setup.rolls) {
                const da = this.newDie(g.match.players[0].dice[0], a), db = this.newDie("std", b);
                da.fly({ sx: ZONE.x + 20, sy: POT.y + 60, h0: 30, ex: POT.x - 110, ey: POT.y + 40, D: 44, spin: 8.5, rot1: -0.12, face: a });
                db.fly({ sx: ZONE.x + ZONE.w - 20, sy: POT.y - 70, h0: 30, ex: POT.x + 110, ey: POT.y - 40, D: 46, spin: -8, rot1: 0.14, face: b });
                this.dice = [da, db];
                yield () => !da.busy() && !db.busy();
                yield 20;
                if (a === b) { this.banner.show("turn", "Remis! Jeszcze raz.", null, 56); yield 40; }
                else { (a > b ? da : db).liftTo = 1; snd("on"); yield 26; }
                for (const d of [da, db]) d.fadeOut(12);
                yield 14;
                this.clearTable();
            }
            const heroFirst = g.match.cur === 0;
            this.banner.show("turn", heroFirst ? "Zaczynasz ty" : "Zaczyna " + g.opp.short, null, 64);
            this.say(1, heroFirst ? "heroFirst" : "meFirst", 0.8);
            yield 40;
        }
        *turnFlow() {
            const g = this.game, m = g.match, me = m.cur, hero = me === 0, auto = hero && !!this.opts.auto;
            g.started = true;
            this.setActive(me);
            this.shown[me] = m.players[me].total;
            this.banner.show("turn", hero ? "Twoja tura" : "Tura: " + g.opp.short, null, 58);
            if (!hero && !this.hinted && MERCHANT_HINT[g.key] && m.turnNo >= 2 && locked(hourNow(), dayNow()).includes("kupiec")) { this.hinted = true; g.lastChat = m.turnNo; this.sayText(1, MERCHANT_HINT[g.key], true); }
            else if (!hero && g.opp.lines.chat && m.turnNo - g.lastChat >= 3 && g.R.talk() < (g.opp.stories ? 0.3 : 0.14)) { g.lastChat = m.turnNo; this.say(1, "chat", undefined, true); }
            yield 24;
            let first = true;
            for (;;) {
                if (first) {
                    if (hero && !auto) { this.askHero("throw"); yield () => !!this.heroAct; this.heroAct = null; this.waitHero = null; }
                    else yield 12;
                }
                if (m.hotNext) yield* this.hotFlow();
                else if (!first) yield* this.gatherLeft();
                const r = m.roll();
                const vision = hero ? this.maybeVision(r) : null;
                yield* this.throwFlow(r.dice);
                if (vision) yield* this.visionAfter();
                if (r.bust) { yield* this.bustFlow(); break; }
                let act;
                if (hero && !auto) {
                    this.askHero("choose");
                    yield () => !!this.heroAct;
                    act = this.heroAct; this.heroAct = null; this.waitHero = null;
                } else act = yield* this.aiChooseFlow();
                const res = m.take(act.idx);
                if (!res) { act = { idx: best(m.context().faces).idx, bank: act.bank }; }   // (never: the choice was checked)
                const took = res || m.take(act.idx);
                yield* this.takeFlow(took.group);
                if (act.bank) { yield* this.bankFlow(); break; }
                first = false;
            }
            this.clearTable();
            if (!m.over) m.endTurn();
        }
        setActive(me) {
            this.bustL.lightTo = me === 0 ? 1 : 0.55;
            this.bustR.lightTo = me === 1 ? 1 : 0.55;
        }
        askHero(kind) {
            this.waitHero = kind;
            this.heroAct = null;
            if (kind === "throw") this.focus = { row: "btn", i: 1 };
            else {
                const order = this.dice.map((d, i) => i).sort((a, b) => this.dice[a].tx - this.dice[b].tx);
                this.focus = order.length ? { row: "die", i: order[0] } : { row: "btn", i: 1 };
            }
        }
        // the dice left on the table after a choice go back into the cup
        *gatherLeft() {
            const hero = this.game.match.cur === 0, cx = hero ? ZONE.x + 64 : ZONE.x + ZONE.w - 64, cy = hero ? POT.y + 118 : POT.y - 70;
            const left = this.dice.slice();
            left.forEach((d, i) => { d.liftTo = 0; d.moveTo(cx, cy, 14 + i * 2, 0.7, 10); });
            yield 10;
            left.forEach(d => d.fadeOut(8));
            yield 8;
            this.clearTable();
        }
        // the cup comes in, is shaken, tips; the dice fly out, bounce and settle
        *throwFlow(dice) {
            const g = this.game, hero = g.match.cur === 0, side = hero ? 1 : -1;
            const cx = hero ? ZONE.x + 64 : ZONE.x + ZONE.w - 64, cy = hero ? POT.y + 118 : POT.y - 70;
            this.clearTable();
            this.cup.enter(cx, cy, side);
            yield () => this.cup.mode === "ready";
            this.cup.onRattle = env => {
                const r = this.fxRng;
                se("Switch1", Math.round(24 + env * 26), 128 + Math.floor(r() * 40));
                if (r() < 0.45) se("Knock", Math.round(14 + env * 16), 150 + Math.floor(r() * 30));
            };
            this.cup.shake(hero ? 40 : 34);
            yield () => this.cup.mode === "ready";
            const spots = this.landingSpots(dice.length, hero);
            this.dice = dice.map(d => { const s = this.newDie(d.type, d.face); s.visible = false; s.tx = cx; s.ty = cy; s.model = d; return s; });
            let released = false;
            this.cup.onRelease = () => {
                released = true;
                const mo = this.cup.mouth(), r = this.fxRng;
                this.dice.forEach((s, i) => {
                    const sp = spots[i];
                    s.fly({ sx: mo.x, sy: mo.y + 20, h0: mo.h + 8, ex: sp.x, ey: sp.y, D: 44 + Math.floor(r() * 16) + i * 2, spin: side * (5 + r() * 7) * (r() < 0.25 ? -1 : 1), rot1: (r() - 0.5) * 0.5, face: dice[i].face, delay: i * 2 });
                });
            };
            this.cup.pour();
            yield () => released;
            yield () => this.dice.every(d => !d.busy());
            this.cup.leave();
            yield 8;
        }
        // where the dice come to rest: apart from each other, off the pot, on the far side from the cup
        landingSpots(n, hero) {
            const r = this.fxRng, out = [];
            const x0 = hero ? ZONE.x + 150 : ZONE.x + 40, x1 = hero ? ZONE.x + ZONE.w - 40 : ZONE.x + ZONE.w - 150;
            const y0 = ZONE.y + 46, y1 = ZONE.y + ZONE.h - 58;
            for (let tries = 0; out.length < n && tries < 2000; tries++) {
                const p = { x: x0 + r() * (x1 - x0), y: y0 + r() * (y1 - y0) };
                const ex = (p.x - POT.x) / 112, ey = (p.y - (POT.y + 20)) / 94;   // (off the coins and their label)
                if (ex * ex + ey * ey < 1) continue;
                if (out.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 80)) continue;
                out.push(p);
            }
            for (let i = out.length; i < n; i++) out.push({ x: x0 + 40 + (i % 3) * 90, y: y0 + Math.floor(i / 3) * 100 });   // (never: room enough)
            return out;
        }
        // the rival (or the hero on autopilot) looks, picks the dice one by one, then says what he does
        *aiChooseFlow() {
            const g = this.game, m = g.match, me = m.cur, d = decide(m.context(), g.heads[me] || AUTO_AI.steady, g.R.ai);
            yield 26 + Math.floor(this.fxRng() * 12);
            for (const i of d.idx) { if (this.dice[i]) this.dice[i].liftTo = 1; snd("on", 0.8); yield 9; }
            yield 14;
            if (me === 1) {
                const left = (m.turn.free.length - d.idx.length) || 6, pts = m.turn.pts + score(d.idx.map(i => m.thrown[i].face)).points;
                if (!d.bank && (d.reckless || (pts >= 350 && left <= 3))) this.say(1, "push", d.reckless ? 0.9 : 0.5);
            }
            return d;
        }
        // the chosen dice go to their owner's column; the points and the name of the throw float up
        *takeFlow(group) {
            const g = this.game, m = g.match, me = m.cur, col = me === 0 ? HERO_COL : OPP_COL;
            const sprites = this.dice.filter(s => group.dice.includes(s.model));
            const cx = sprites.reduce((a, s) => a + s.tx, 0) / Math.max(1, sprites.length), cy = sprites.reduce((a, s) => a + s.ty, 0) / Math.max(1, sprites.length);
            const big = group.points >= 500 || group.combos.some(c => c.kind === "straight" || (c.kind === "kind" && c.n >= 4));
            this.float("+" + group.points, group.name, cx, cy - 34, big ? ST().accent : "#fff2b8", big ? 44 : 34);
            if (big) { snd("big"); this.sparks(cx, cy - 20, 14); } else snd("combo");
            yield 10;
            sprites.forEach((s, i) => {
                const slot = this.aside[me].length;
                this.aside[me].push(s);
                this.dice.splice(this.dice.indexOf(s), 1);
                s.liftTo = 0;
                s.moveTo(col, FELT.y + 62 + slot * 58, 18 + i * 3, 0.78, 16, 0);
            });
            yield 24;
            if (big) {
                if (me === 0) { this.say(1, "heroBig", 0.6); }
                else { this.say(1, "myBig", 0.75); this.bustR.hop = 16; }
            }
        }
        *bankFlow() {
            const g = this.game, m = g.match, me = m.cur, res = m.bank();
            snd("bank");
            const col = me === 0 ? HERO_COL : OPP_COL, side = me === 0 ? SIDE_L : SIDE_R;
            this.countHold[me] = 22;
            const f = this.float("+" + res.points, null, col, FELT.y + 70 + this.aside[me].length * 29, ST().accent, 40);
            f.vy = 0;
            f.target = { x: side.x + side.w / 2, y: side.y + 110 };
            f.tickBase = f.tick;
            f.tick = function() { const alive = this.tickBase(); if (this.life > 12) { this.x += (this.target.x - this.x) * 0.12; this.y += (this.target.y - this.y) * 0.12; } return alive && this.life < 44; };
            for (const s of this.aside[me]) s.liftTo = 1;
            yield 16;
            for (const s of this.aside[me]) s.fadeOut(14);
            if (me === 0) { if (res.points < 350 && !res.won) this.say(1, "heroSmall", 0.35); }
            else if (!res.won) this.say(1, "bank", 0.45);
            yield 30;
            for (const s of this.aside[me]) { if (s.parent) s.parent.removeChild(s); s.destroy({ children: true }); }
            this.aside[me] = [];
            yield () => this.shown[me] >= m.players[me].total;
            yield 10;
        }
        *bustFlow() {
            const g = this.game, m = g.match, me = m.cur, lost = m.turn.lost;
            snd("bust");
            for (const d of this.dice) d.dimTo = 1;
            for (const d of this.aside[me]) d.dimTo = 1;
            this.banner.show("bust", "Pudło!", lost > 0 ? "Tura przepada: −" + lost : "Żadna kość nie punktuje", 104);
            if (me === 0) {
                const said = this.say(1, "heroBust", 0.75);
                if (said && g.key === "grum" && g.R.talk() < 0.4) snd("laugh");
                this.bustL.jolt = 18;
            } else { this.say(1, "myBust", 0.8); this.bustR.jolt = 18; }
            yield 100;
            for (const d of this.dice.concat(this.aside[me])) d.fadeOut(14);
            yield 16;
            for (const d of this.aside[me]) { if (d.parent) d.parent.removeChild(d); d.destroy({ children: true }); }
            this.aside[me] = [];
        }
        *hotFlow() {
            const g = this.game, m = g.match, me = m.cur, hero = me === 0;
            const cx = hero ? ZONE.x + 64 : ZONE.x + ZONE.w - 64, cy = hero ? POT.y + 118 : POT.y - 70;
            snd("hot"); snd("hot2");
            this.banner.show("hot", "Gorące kości!", "Wszystkie sześć odłożone — rzut całą szóstką, punkty zostają", 110);
            for (const d of this.aside[me]) { d.liftTo = 1; this.sparks(d.tx, d.ty - 10, 5); }
            if (hero) this.say(1, "heroHot", 0.7); else this.say(1, "myHot", 0.8);
            yield 40;
            this.clearTable();
            this.aside[me].forEach((d, i) => { d.liftTo = 0; d.moveTo(cx, cy, 16 + i * 2, 0.7, 24); });
            yield 20;
            for (const d of this.aside[me]) d.fadeOut(8);
            yield 10;
            for (const d of this.aside[me]) { if (d.parent) d.parent.removeChild(d); d.destroy({ children: true }); }
            this.aside[me] = [];
            yield 24;
        }
        // Dziadek Ozzy sometimes mutters what the hero's throw will show - and he is right (the dice are already thrown)
        maybeVision(r) {
            const g = this.game;
            const forced = this.opts.visions !== undefined;   // (tests: the chance given)
            if (!VISIONS || !g.opp.visions || g.visions >= 1 || (!forced && g.match.turnNo < 3) || g.R.talk() >= (forced ? Number(this.opts.visions) : 0.2)) return null;
            g.visions++;
            const text = visionText(r.dice.map(d => d.face), g.opp.lines.vision, g.R.talk);
            this.sayText(1, text, true);
            return text;
        }
        *visionAfter() {
            const g = this.game;
            yield 26;
            snd("vision");
            this.sayText(1, pickOf(g.R.talk, g.opp.lines.vision.after), true);
            yield 50;
            this.say(0, "vision", undefined, true);
            const st = store();
            st.visions = (st.visions || 0) + 1;
            if (st.visions === 1) this.rewards.notes.push(["Dziadek Ozzy i kości", "Grałem z Dziadkiem Ozzym w kości. Zanim kości wypadły z kubka, wymamrotał, co pokażą. Zgadzało się co do oczka.\nPijacki fart? Ozzy mówi czasem rzeczy, których nie mógłby wiedzieć..."]);
            yield 40;
        }
        *endFlow() {
            const g = this.game, m = g.match, won = m.winner === 0;
            this.waitHero = null;
            yield 20;
            this.shown = m.players.map(p => p.total);
            this.bustL.lightTo = this.bustR.lightTo = 1;
            this.banner.show(won ? "win" : "lose", won ? "Wygrana!" : "Przegrana", won ? "Pula " + gold(g.pot) + " jest twoja" : g.opp.short + " zgarnia pulę", 170, FELT.y + 118);
            if (won) { AudioManager.playMe({ name: "Item", volume: 70, pitch: 100, pan: 0 }); this.bustL.hop = 16; this.sparks(POT.x, POT.y, 24); }
            else { snd("lose"); this.bustR.hop = 16; }
            // the coins fly to the winner
            const to = won ? { x: SIDE_L.x + 60, y: SIDE_L.y + 46 } : { x: SIDE_R.x + 40, y: SIDE_R.y + 24 };
            const n = clamp(Math.ceil(g.pot / 5), 3, 14);
            let arrived = 0;
            yield 30;
            for (let i = 0; i < n; i++) {
                const from = { x: POT.x + (this.fxRng() - 0.5) * 40, y: POT.y + (this.fxRng() - 0.5) * 14 };
                this.addFx(new CoinFly(from, to, i * 4, 34, () => { arrived++; g.potShown = Math.round(g.pot * (1 - arrived / n)); se("Coin", 40, 95 + Math.floor(this.fxRng() * 25)); }));
            }
            yield () => arrived >= n;
            g.potShown = 0;
            this.finishGame(won ? "won" : "lost");
            this.say(1, g.gift ? "give" : g.giftGold ? "giveGold" : won ? "lose" : "win", undefined, true);
            g.closing = this.bubbleR.text;
            yield 70;
            this.openEnd();
        }

        // ==============================================================
        // The hero's hands: the dice and the buttons (keys and the mouse)
        // ==============================================================
        selection() {
            const idx = [];
            this.dice.forEach((d, i) => { if (d.liftTo > 0) idx.push(i); });
            const m = this.game && this.game.match;
            if (!idx.length || !m || !m.thrown) return { idx, n: 0, valid: false, points: 0, name: "" };
            const s = score(idx.map(i => m.thrown[i].face));
            return { idx, n: idx.length, valid: s.valid, points: s.points, name: s.name };
        }
        buttons() {
            const m = this.game && this.game.match, w = this.waitHero, sel = w === "choose" ? this.selection() : null;
            const left = m && sel ? (m.turn.free.length - sel.n) : 0;
            return BTN.map(b => {
                const o = Object.assign({}, b, { y: 0, h: BAR.h });
                if (b.id === "roll") {
                    o.label = w === "choose" ? (sel.valid && left === 0 ? "Rzuć wszystkimi (6)" : "Rzuć dalej" + (sel.valid ? " (" + left + ")" : "")) : "Rzuć kośćmi";
                    o.enabled = w === "throw" || (w === "choose" && sel.valid);
                } else if (b.id === "bank") {
                    o.label = w === "choose" && sel.valid ? "Zapisz " + (m.turn.pts + sel.points) : "Zapisz punkty";
                    o.enabled = w === "choose" && sel.valid;
                } else o.enabled = this.phase === "play";
                return o;
            });
        }
        heroInput() {
            const t = this.trig, btns = this.buttons();
            // the mouse: hovering moves the focus, a click acts
            const at = p => {
                if (!p) return null;
                if (this.waitHero === "choose") for (let i = this.dice.length - 1; i >= 0; i--) if (this.dice[i].hit(p.x, p.y)) return { row: "die", i };
                for (let i = 0; i < btns.length; i++) { const b = btns[i]; if (p.x >= BAR.x + b.x && p.x < BAR.x + b.x + b.w && p.y >= BAR.y && p.y < BAR.y + BAR.h) return { row: "btn", i }; }
                return null;
            };
            const hov = at(this.hover);
            if (hov && (hov.row !== this.focus.row || hov.i !== this.focus.i)) this.focus = hov;
            const clk = at(this.click);
            if (clk) { this.focus = clk; this.activate(btns); return; }
            if (t.left || t.right || t.up || t.down) this.moveFocus(t, btns);
            else if (t.ok) this.activate(btns);
        }
        moveFocus(t, btns) {
            const f = this.focus, dirs = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
            const [dx, dy] = dirs[t.left ? "left" : t.right ? "right" : t.up ? "up" : "down"];
            const dice = this.waitHero === "choose" ? this.dice : [];
            if (f.row === "die" && dice[f.i]) {
                const bestI = this.nextDie(f.i, dx, dy);
                if (bestI >= 0) this.focus = { row: "die", i: bestI };
                else if (dy > 0) this.focus = { row: "btn", i: btns[1].enabled ? 1 : btns[2].enabled ? 2 : 1 };
                else return;
            } else {
                if (dx) {
                    let i = f.row === "btn" ? f.i : 1;
                    for (let k = 0; k < btns.length; k++) { i = (i + dx + btns.length) % btns.length; if (btns[i].enabled) break; }
                    this.focus = { row: "btn", i };
                } else if (dy < 0 && dice.length) {
                    const bx = BAR.x + btns[f.i].x + btns[f.i].w / 2;
                    let bi = 0;
                    dice.forEach((d, i) => { if (Math.abs(d.tx - bx) + (BAR.y - d.ty) * 0.3 < Math.abs(dice[bi].tx - bx) + (BAR.y - dice[bi].ty) * 0.3) bi = i; });
                    this.focus = { row: "die", i: bi };
                } else return;
            }
            snd("cursor");
        }
        // while the hero only watches: "Zasady" and "Odejdź" still take a click
        sideButtons() {
            const p = this.click;
            for (const x of this.buttons()) {
                if (!x.enabled || (x.id !== "rules" && x.id !== "leave")) continue;
                if (p.x >= BAR.x + x.x && p.x < BAR.x + x.x + x.w && p.y >= BAR.y && p.y < BAR.y + BAR.h) {
                    if (x.id === "rules") { snd("decide"); this.showRules(); } else this.askLeave();
                    return;
                }
            }
        }
        // the die an arrow leads to from die i (dx, dy: the arrow), or -1: the nearest one that way, sideways distance counting more
        nextDie(i, dx, dy) {
            const dice = this.dice, me = dice[i];
            let bestI = -1, bestD = Infinity;
            if (!me) return -1;
            dice.forEach((d, j) => {
                if (j === i) return;
                const ax = d.tx - me.tx, ay = d.ty - me.ty, along = ax * dx + ay * dy, across = Math.abs(ax * dy - ay * dx);
                if (along <= 8) return;
                const dist = along + across * 1.6;
                if (dist < bestD) { bestD = dist; bestI = j; }
            });
            return bestI;
        }
        activate(btns) {
            const f = this.focus;
            if (f.row === "die") {
                const d = this.dice[f.i];
                if (!d || this.waitHero !== "choose") return;
                d.liftTo = d.liftTo > 0 ? 0 : 1;
                snd(d.liftTo ? "on" : "off");
                return;
            }
            const b = btns[f.i];
            if (!b) return;
            if (!b.enabled) { snd("buzzer"); this.pillFlash = 40; return; }
            if (b.id === "rules") { snd("decide"); this.showRules(); return; }
            if (b.id === "leave") { this.askLeave(); return; }
            if (b.id === "roll" && this.waitHero === "throw") { snd("decide"); this.heroAct = { kind: "throw" }; return; }
            const sel = this.selection();
            if (!sel.valid) { snd("buzzer"); this.pillFlash = 40; return; }
            snd("decide");
            this.heroAct = { idx: sel.idx, bank: b.id === "bank" };
        }
        placeFocus() {
            const f = this.focus, s = this.focusSpr;
            const show = this.phase === "play" && this.waitHero === "choose" && f.row === "die" && this.dice[f.i] && !this.dice[f.i].busy();
            s.visible = !!show;
            if (!show) return;
            const d = this.dice[f.i], pulse = 1 + Math.sin(Graphics.frameCount / 9) * 0.035;
            s.x = d.x; s.y = d.y + d.body.y;
            s.scale.set(pulse * (1 + d.lift * 0.06));
        }

        // ==============================================================
        // The table's lobby: who sits there, the stake, the hero's six dice
        // ==============================================================
        openLobby() {
            this.phase = "lobby";
            this.phaseT = 0;
            this.game = null;
            this.co = null;
            this.waitHero = null;
            this.clearTable(true);
            this.bustL.want = this.bustR.want = false;
            this.bubbleL.hide(); this.bubbleR.hide();
            const list = this.opts.opponent && OPPONENTS[this.opts.opponent] ? [{ key: this.opts.opponent, tired: false }] : present(hourNow(), dayNow(), this.opts.only);
            const cards = list.map(p => ({ key: p.key, tired: p.tired, afford: $gameParty.gold() >= OPPONENTS[p.key].stakes[0] }));
            const L = this.lobby = { cards, sel: 0, row: "cards", i: 0, stakeI: 0, slot: 0, btn: 1, hint: this.opts.opponent ? "" : this.fameHint() };
            const ok = cards.findIndex(c => !c.tired && c.afford);
            L.sel = L.i = ok >= 0 ? ok : 0;
            if (this.lastPick) { const j = cards.findIndex(c => c.key === this.lastPick.key); if (j >= 0 && !cards[j].tired) { L.sel = L.i = j; } }
            this.fixStake(this.lastPick ? this.lastPick.stake : 0);
            if (!cards.length) { L.row = "buttons"; L.btn = 2; }
            else if (!this.canPlay()) { L.row = "buttons"; L.btn = 2; }
        }
        lobbyCard() { const L = this.lobby; return L && L.cards[L.sel] ? L.cards[L.sel] : null; }
        // who is in the hall but does not play with the hero yet: the words for the lobby
        fameHint() {
            const lk = locked(hourNow(), dayNow());
            if (lk.includes("kupiec")) return "Przy oknie siedzi bogaty kupiec z miasta, ale gra tylko z ludźmi, których zna.";
            if (lk.includes("nieznajomy") && (fame() || 0) >= 60) return "W kącie ktoś w kapturze przygląda się stołom. Podobno gra tylko z chlubą tawerny.";
            return "";
        }
        stakesOf(card) { return card ? OPPONENTS[card.key].stakes : []; }
        fixStake(want) {
            const L = this.lobby, st = this.stakesOf(this.lobbyCard()), g = $gameParty.gold();
            if (!st.length) { L.stakeI = 0; return; }
            let i = want ? st.indexOf(want) : -1;
            if (i < 0 || st[i] > g) { i = 0; for (let k = 0; k < st.length; k++) if (st[k] <= g) { i = k; break; } }
            L.stakeI = i;
        }
        lobbyStake() { const st = this.stakesOf(this.lobbyCard()); return st[this.lobby.stakeI] || 0; }
        canPlay() {
            const c = this.lobbyCard();
            return !!c && !c.tired && $gameParty.gold() >= this.lobbyStake() && this.lobbyStake() > 0;
        }
        hasSpecials() { return SPECIAL_ORDER.some(k => ownedCount(k) > 0); }
        lobbyRows() {
            const rows = [];
            if (this.lobby.cards.length) rows.push("cards", "stake");
            if (this.hasSpecials()) rows.push("dice");
            rows.push("buttons");
            return rows;
        }
        lobbyInput() {
            const t = this.trig, L = this.lobby;
            const hit = this.hitAt(this.click) || null, hov = this.hitAt(this.hover);
            if (hov) this.lobbyFocus(hov, false);
            if (hit) { this.lobbyFocus(hit, true); this.lobbyOk(hit); return; }
            if (t.cancel) { snd("cancel"); this.leave(); return; }
            const rows = this.lobbyRows(), r = rows.indexOf(L.row);
            if (t.up || t.down) {
                const nr = clamp(r + (t.down ? 1 : -1), 0, rows.length - 1);
                if (nr !== r) { L.row = rows[nr]; if (L.row === "buttons") L.btn = this.canPlay() ? 1 : 2; snd("cursor"); }
                return;
            }
            if (t.left || t.right) {
                const d = t.right ? 1 : -1;
                if (L.row === "cards" && L.cards.length) { const i = clamp(L.i + d, 0, L.cards.length - 1); if (i !== L.i) { L.i = L.sel = i; this.fixStake(this.lobbyStake()); snd("cursor"); } }
                else if (L.row === "stake") this.cycleStake(d);
                else if (L.row === "dice") { L.slot = (L.slot + d + 6) % 6; snd("cursor"); }
                else if (L.row === "buttons") { L.btn = (L.btn + d + 3) % 3; snd("cursor"); }
                return;
            }
            if (t.ok) this.lobbyOk({ row: L.row, i: L.row === "cards" ? L.i : L.row === "dice" ? L.slot : L.btn });
        }
        lobbyFocus(h, quiet) {
            const L = this.lobby;
            if (h.row === "cards") { if (L.row !== "cards" || L.i !== h.i) { L.row = "cards"; L.i = L.sel = h.i; this.fixStake(this.lobbyStake()); } }
            else if (h.row === "stake") L.row = "stake";
            else if (h.row === "dice") { L.row = "dice"; L.slot = h.i; }
            else if (h.row === "buttons") { L.row = "buttons"; L.btn = h.i; }
        }
        lobbyOk(h) {
            const L = this.lobby;
            if (h.row === "cards") {
                const c = L.cards[h.i];
                if (!c || c.tired || !c.afford) { snd("buzzer"); return; }
                L.row = "stake"; snd("decide");
            } else if (h.row === "stake") {
                if (h.dir) { this.cycleStake(h.dir); return; }
                L.row = "buttons"; L.btn = this.canPlay() ? 1 : 2; snd("decide");
            } else if (h.row === "dice") this.cycleSlot(h.i);
            else if (h.row === "buttons") {
                if (h.i === 0) { snd("decide"); this.showRules(); }
                else if (h.i === 1) {
                    if (!this.canPlay()) { snd("buzzer"); return; }
                    snd("decide");
                    const c = this.lobbyCard(), stake = this.lobbyStake();
                    this.lastPick = { key: c.key, stake };
                    this.beginGame(c.key, stake);
                } else { snd("cancel"); this.leave(); }
            }
        }
        cycleStake(d) {
            const L = this.lobby, st = this.stakesOf(this.lobbyCard()), g = $gameParty.gold();
            for (let k = 1; k <= st.length; k++) {
                const i = (L.stakeI + d * k + st.length * 4) % st.length;
                if (st[i] <= g) { if (i !== L.stakeI) { L.stakeI = i; snd("cursor"); } return; }
            }
            snd("buzzer");
        }
        // O on a die of the set: the next kind the hero has (plain ones always)
        cycleSlot(i) {
            const st = store(), kinds = ["std"].concat(SPECIAL_ORDER.filter(k => ownedCount(k) > 0));
            if (kinds.length < 2) { snd("buzzer"); return; }
            const set = heroSet(), cur = kinds.indexOf(set[i]);
            for (let k = 1; k <= kinds.length; k++) {
                const next = kinds[(cur + k) % kinds.length];
                const used = set.filter((x, j) => j !== i && x === next).length;
                if (next === "std" || used < ownedCount(next)) { set[i] = next; st.set = set; snd("on"); return; }
            }
        }
        hitAt(p) {
            if (!p || !this.hits) return null;
            for (let i = this.hits.length - 1; i >= 0; i--) { const h = this.hits[i]; if (p.x >= h.x && p.x < h.x + h.w && p.y >= h.y && p.y < h.y + h.h) return h; }
            return null;
        }

        // ==============================================================
        // The rules card, leaving, the end of a game
        // ==============================================================
        showRules() {
            if (this.phase === "rules") return;
            this.rulesBack = this.phase === "none" ? "lobby" : this.phase;
            this.phase = "rules";
            this.phaseT = 0;
        }
        rulesInput() {
            const t = this.trig;
            if (this.phaseT > 8 && (t.ok || t.cancel || this.click)) {
                snd(t.cancel ? "cancel" : "decide");
                store().rulesSeen = true;
                this.phase = this.rulesBack || "lobby";
                this.phaseT = 0;
            }
        }
        askLeave() {
            const g = this.game;
            if (!g || g.done) { this.leave(); return; }
            snd("cancel");
            this.confirmSel = 0;
            this.phase = "confirm";
            this.phaseT = 0;
        }
        confirmInput() {
            const t = this.trig, h = this.hitAt(this.click), hov = this.hitAt(this.hover);
            if (hov && hov.row === "confirm") this.confirmSel = hov.i;
            if (h && h.row === "confirm") { this.confirmSel = h.i; t.ok = true; }
            if (t.left || t.right) { this.confirmSel = 1 - this.confirmSel; snd("cursor"); }
            else if (t.cancel || (t.ok && this.confirmSel === 0)) { snd("cancel"); this.phase = "play"; this.phaseT = 0; }
            else if (t.ok && this.confirmSel === 1) { snd("decide"); this.forfeit(); }
        }
        forfeit() {
            const g = this.game;
            if (g && !g.done) {
                g.left = true;
                this.finishGame("left");
            }
            this.leave();
        }
        // the game is over: the pot, the records, a gift, what the map shows afterwards, the time it took
        finishGame(outcome) {
            const g = this.game, m = g.match, st = store(), v = vsOf(g.key);
            if (g.done) return;
            g.done = true;
            const won = outcome === "won", left = outcome === "left";
            st.games++; v.games++;
            if (won) {
                st.wins++; v.wins++; v.lostToday++;
                st.net += g.stake;
                st.biggestPot = Math.max(st.biggestPot || 0, g.pot);
                $gameParty.gainGold(g.pot);
            } else {
                if (left) st.left++; else st.losses++;
                v.losses++;
                st.net -= g.stake;
            }
            const hb = m.players[0].best;
            if (hb && (!st.bestThrow || hb.points > st.bestThrow.points)) st.bestThrow = { points: hb.points, name: hb.name, faces: hb.faces.slice(), day: dayNow(), vs: g.key };
            if (won && g.opp.die && !v.given) {
                const d = g.opp.die;
                if (d.giveOnce && d.orGold && ownedCount(d.key) > 0) {   // (he would give his die, but the hero has one: gold)
                    v.given = true; v.gift = "gold";
                    g.giftGold = d.orGold;
                    $gameParty.gainGold(d.orGold);
                    st.net += d.orGold;
                    this.rewards.notices.push(["Sakiewka od: " + g.opp.name + " (+" + gold(d.orGold) + ")", ST().accent, null]);
                } else if (d.giveOnce || (d.giveAfter && v.wins >= d.giveAfter) || (d.giveAtStake && g.stake >= d.giveAtStake)) {
                    v.given = true; v.gift = d.key;
                    giveDie(d.key);
                    g.gift = d.key;
                    const T = DIE_TYPES[d.key];
                    this.rewards.notes.push(["Nowa kość: " + T.name, "Dostałem ją od: " + g.opp.name + ".\n" + T.desc + "\n" + T.effect + "\nPrzy stole do kości mogę ją wybrać do swojej szóstki."]);
                    this.rewards.notices.push(["Nowa kość do gry: " + T.name, ST().accent, T.effect]);
                }
            }
            if (won) {
                g.xp = Math.round(XP_BASE + g.stake * XP_PER_G);
                this.rewards.xp += g.xp;
                if (!st.firstWin) {
                    st.firstWin = true;
                    this.rewards.notes.push(["Pierwsza wygrana w kości", "Wygrałem pierwszą partię kości w tawernie „Pod Złotym Kuflem”. Rywal: " + g.opp.name + ", pula " + gold(g.pot) + ".\nSzczęście? Może. Ale odłożyć właściwe kości też trzeba umieć."]);
                }
                if (g.pot >= BIG_POT) this.rewards.notices.push(["Wielka wygrana w kości: +" + gold(g.pot) + "!", ST().accent, "Pula od: " + g.opp.name]);
            }
            const minutes = Math.round(MIN_BASE + MIN_TURN * m.turnNo);
            if (window.$gameSystem && typeof $gameSystem.advanceDayNight === "function" && minutes > 0) $gameSystem.advanceDayNight(minutes / 60);
            const rec = {
                opponent: g.key, stake: g.stake, pot: g.pot, won, left, hero: m.players[0].total, rival: m.players[1].total, target: m.target,
                turns: m.turnNo, busts: m.players[0].busts, hot: m.players[0].hot, best: hb ? { points: hb.points, name: hb.name } : null,
                gift: g.gift, giftGold: g.giftGold || 0, xp: g.xp || 0, minutes, day: dayNow()
            };
            st.last = rec;
            this.results.push(rec);
            if (RESULT_VAR > 0 && window.$gameVariables) $gameVariables.setValue(RESULT_VAR, won ? 1 : left ? 3 : 2);
            TavernDice.lastGame = rec;
        }
        // what "Jeszcze raz" would do, or why not: null when fine
        againBlock() {
            const g = this.game;
            if (!g) return "—";
            if (this.opts.once) return "Tylko jedna partia.";
            if (vsOf(g.key).lostToday >= g.opp.perDay) return g.opp.short + " już dziś nie zagra.";
            if (!this.opts.opponent && !present(hourNow(), dayNow()).some(p => p.key === g.key)) return "Robi się późno — " + g.opp.short + " odchodzi od stołu.";
            if ($gameParty.gold() < g.stake) return "Za mało złota na tę stawkę.";
            return null;
        }
        openEnd() {
            this.bubbleR.hide();
            this.phase = "end";
            this.phaseT = 0;
            this.waitHero = null;
            const again = !this.againBlock(), lobby = !this.opts.opponent;
            this.endBtns = [
                { id: "again", label: "Jeszcze raz", enabled: again, primary: true },
                { id: "lobby", label: "Inna gra", enabled: lobby },
                { id: "leave", label: "Odchodzę", enabled: true }
            ];
            this.endSel = again ? 0 : 2;
        }
        endInput() {
            const t = this.trig, h = this.hitAt(this.click), hov = this.hitAt(this.hover);
            if (hov && hov.row === "end" && this.endBtns[hov.i].enabled) this.endSel = hov.i;
            if (h && h.row === "end") { this.endSel = h.i; t.ok = true; }
            if (this.phaseT < 20) return;
            if (t.left || t.right) {
                const d = t.right ? 1 : -1;
                for (let k = 1; k <= 3; k++) { const i = (this.endSel + d * k + 9) % 3; if (this.endBtns[i].enabled) { this.endSel = i; break; } }
                snd("cursor");
            } else if (t.cancel) { snd("cancel"); this.leave(); }
            else if (t.ok) {
                const b = this.endBtns[this.endSel];
                if (!b.enabled) { snd("buzzer"); return; }
                snd("decide");
                if (b.id === "again") { const g = this.game; this.bubbleR.hide(); this.beginGame(g.key, g.stake); }
                else if (b.id === "lobby") { this.lastPick = { key: this.game.key, stake: this.game.stake }; this.openLobby(); }
                else this.leave();
            }
        }
        // back to the map: the result for onEnd, the rewards shown there
        leave() {
            if (this.phase === "leaving" || this.phase === "left") return;
            const res = this.summary();
            const toMap = SceneManager._stack.length && SceneManager._stack[SceneManager._stack.length - 1] === Scene_Map;
            const p = { result: res, onEnd: this.opts.onEnd, rewards: this.rewards };
            if (toMap) pendingEnd = p;
            else applyRewards(p);
            TavernDice.lastResult = res;
            this.co = null;
            this.waitHero = null;
            this.phase = "leaving";
            this.startFadeOut(this.fadeSpeed(), false);
        }
        summary() {
            const r = this.results, net = r.reduce((a, x) => a + (x.won ? x.stake : -x.stake), 0);
            return { played: r.length, won: r.filter(x => x.won).length, lost: r.filter(x => !x.won && !x.left).length, left: r.filter(x => x.left).length, net, games: r.slice(), last: r.length ? r[r.length - 1] : null };
        }

        // ==============================================================
        // The HUD: the top bar, the two players' plates, the buttons, the key hints, the words on the cloth, the pot
        // ==============================================================
        drawHeader() {
            const g = this.game, S = ST(), h = hourNow();
            const clock = String(Math.floor(h) % 24).padStart(2, "0") + ":" + String(Math.floor((h % 1) * 60)).padStart(2, "0");
            const key = [this.phase === "lobby" ? "L" : "G", g ? g.key + ":" + g.stake + ":" + g.match.target : "", $gameParty.gold(), clock].join("|");
            if (key === this._hk) return;
            this._hk = key;
            const b = this.header.bitmap, W = b.width;
            b.clear();
            panel(b, 0, 0, W, HEADER.h, { cut: 6 });
            txt(b, "KOŚCI", 18, 8, 120, { size: 23, color: S.accent, bold: true });
            const w1 = Math.ceil(measure(b, "KOŚCI", 23, true));
            txt(b, "·   sala gier „Pod Złotym Kuflem”", 18 + w1 + 12, 12, 420, { size: 17, color: S.muted });
            if (g && this.phase !== "lobby") txt(b, g.opp.name + "   ·   stawka " + gold(g.stake) + "   ·   gra do " + g.match.target, W / 2 - 300, 11, 600, { size: 18, color: S.text, align: "center" });
            const gs = gold($gameParty.gold()), gw = Math.ceil(measure(b, gs, 20, true));
            txt(b, gs, W - 18 - gw, 10, gw + 4, { size: 20, color: S.accent, bold: true });
            icon(b, COIN_ICON, W - 18 - gw - 30, 10, 26);
            txt(b, clock + "   ·   dzień " + dayNow(), W - 18 - gw - 250, 12, 212, { size: 17, color: S.muted, align: "right" });
        }
        drawSides() {
            const g = this.game, on = !!g && (this.phase === "play" || this.phase === "end" || this.phase === "confirm" || (this.phase === "rules" && this.rulesBack !== "lobby"));
            this.panelL.visible = this.panelR.visible = on;
            if (!on) return;
            this.drawSide(0);
            this.drawSide(1);
        }
        drawSide(who) {
            const g = this.game, m = g.match, p = m.players[who], S = ST(), spr = who ? this.panelR : this.panelL, b = spr.bitmap, W = b.width, H = b.height;
            const active = g.started && m.cur === who && !m.over && this.phase !== "end";
            const turn = active ? m.turn.pts : 0;
            let sel = null;
            if (m.cur === who && this.phase === "play") {
                const lifted = this.dice.map((d, i) => (d.liftTo > 0 ? i : -1)).filter(i => i >= 0);
                if (lifted.length && m.thrown) { const s = score(lifted.map(i => m.thrown[i] && m.thrown[i].face)); sel = s.valid ? s.points : -1; }
            }
            const shown = Math.min(this.shown[who], p.total), dice = p.dice.join(",");
            const key = [who, active, shown, m.target, turn, sel, dice, $gameParty.gold(), m.winner].join("|");
            if (spr._key === key) return;
            spr._key = key;
            b.clear();
            panel(b, 0, 0, W, H, { cut: 6, line: active ? S.accentDim : S.line, fill: active ? "rgba(26,23,13,0.93)" : "rgba(11,12,15,0.9)" });
            const name = who ? g.opp.short : "Ty", sub = who ? g.opp.role + " · " + g.opp.style : "sakiewka: " + gold($gameParty.gold());
            txt(b, name, 16, 10, W - 110, { size: 24, color: S.accent, bold: true });
            if (active) {
                const tag = "RZUCA", tw = Math.ceil(measure(b, tag, 13, true)) + 16;
                ST().panel(b.context, W - 16 - tw, 16, tw, 20, { cut: 3, fill: S.accent, line: S.accent, accent: false }); dirty(b);
                txt(b, tag, W - 16 - tw, 16, tw, { size: 13, color: "#16171b", bold: true, align: "center", lh: 20 });
            } else if (m.over && m.winner === who) {
                const tag = "WYGRANA", tw = Math.ceil(measure(b, tag, 13, true)) + 16;
                ST().panel(b.context, W - 16 - tw, 16, tw, 20, { cut: 3, fill: "rgba(142,224,138,0.18)", line: GOOD, accent: false }); dirty(b);
                txt(b, tag, W - 16 - tw, 16, tw, { size: 13, color: GOOD, bold: true, align: "center", lh: 20 });
            }
            txt(b, sub, 16, 38, W - 32, { size: 15, color: who ? g.opp.styleColor : S.muted });
            const big = String(shown), bw = Math.ceil(measure(b, big, 46, true));
            txt(b, big, 14, 56, bw + 6, { size: 46, color: S.text, bold: true });
            txt(b, "/ " + m.target, 14 + bw + 8, 76, 100, { size: 18, color: S.muted });
            bar(b, 16, 124, W - 32, 7, shown / m.target, who ? g.opp.styleColor : S.accent);
            b.fillRect(16, 142, W - 32, 1, S.line);
            txt(b, "Tura", 16, 148, 100, { size: 17, color: S.muted });
            txt(b, turn > 0 ? "+" + turn : "—", W - 116, 145, 100, { size: 22, color: turn > 0 ? S.accent : "#5d636e", bold: turn > 0, align: "right" });
            txt(b, who ? "Odkłada" : "Wybrane", 16, 174, 100, { size: 17, color: S.muted });
            txt(b, sel === null ? "—" : sel < 0 ? "nie punktują" : "+" + sel, W - 136, 172, 120, { size: sel === null ? 20 : 19, color: sel === null ? "#5d636e" : sel < 0 ? BAD : GOOD, bold: sel !== null, align: "right" });
            txt(b, "Kości", 16, 200, 80, { size: 15, color: S.muted });
            p.dice.forEach((k, i) => paintDie(b.context, W - 16 - (6 - i) * 21 + 2, 201, 18, 5, k));
            dirty(b);
        }
        drawBar() {
            const on = this.phase === "play" || this.phase === "confirm" || (this.phase === "rules" && this.rulesBack === "play");
            this.bar.visible = on;
            if (!on) return;
            const btns = this.buttons(), fi = this.waitHero && this.focus.row === "btn" ? this.focus.i : -1;
            const key = btns.map(x => x.label + (x.enabled ? 1 : 0)).join("|") + "#" + fi;
            if (key === this._bk) return;
            this._bk = key;
            const b = this.bar.bitmap;
            b.clear();
            btns.forEach((x, i) => drawButton(b, x.x, 0, x.w, BAR.h, x.label, { focus: i === fi && x.enabled, disabled: !x.enabled, primary: x.primary, small: x.small }));
        }
        drawHint() {
            const p = this.phase, arrows = ["up", "left", "down", "right"];
            let rows;
            if (p === "lobby") rows = [[arrows, "wybór"], [["O"], "zatwierdź"], [["P"], "odejdź"]];
            else if (p === "rules") rows = [[["O"], "rozumiem"], [["P"], "zamknij"]];
            else if (p === "confirm") rows = [[["left", "right"], "wybór"], [["O"], "zatwierdź"], [["P"], "zostań przy stole"]];
            else if (p === "end") rows = [[["left", "right"], "wybór"], [["O"], "zatwierdź"], [["P"], "odejdź"]];
            else if (this.waitHero === "choose") rows = [[arrows, "kości i przyciski"], [["O"], "odłóż kość / wciśnij"], [["P"], "odejdź od stołu"]];
            else if (this.waitHero === "throw") rows = [[["O"], "rzuć kośćmi"], [["P"], "odejdź od stołu"]];
            else if (this.game && this.game.started && this.game.match.cur === 1) rows = [[["O"], "przytrzymaj: szybciej"], [["P"], "odejdź od stołu"]];
            else rows = [[["P"], "odejdź od stołu"]];
            const key = JSON.stringify(rows);
            if (key === this._hintKey) return;
            this._hintKey = key;
            const b = this.hint.bitmap;
            b.clear();
            const w = keyHints(b, rows, 0, 3, 26, 17, true);
            keyHints(b, rows, Math.round((b.width - w) / 2), 3, 26, 17);
        }
        // the words on the cloth: whose column is whose, the turn's points, what the chosen dice give, the pot
        drawFelt() {
            const g = this.game, S = ST();
            const m = g && g.match;
            let pill = "", pc = S.muted;
            if (g && this.phase !== "lobby") {
                if (m.over) pill = "";
                else if (!g.started) pill = "Rzut o pierwszeństwo: wyższe oczko zaczyna";
                else if (this.waitHero === "throw") { pill = "Twoja tura — rzuć kośćmi"; pc = S.text; }
                else if (this.waitHero === "choose") {
                    const s = this.selection();
                    if (!s.n) pill = this.pillFlash > 0 ? "Najpierw odłóż co najmniej jedną punktującą kość" : "Wybierz kości, które odkładasz";
                    else if (!s.valid) { pill = "Nie wszystkie wybrane kości punktują"; pc = BAD; }
                    else { pill = s.name + "  ·  " + s.points; pc = S.accent; }
                    if (this.pillFlash > 0) { this.pillFlash--; if (!s.n) pc = BAD; }
                } else if (m.cur === 1) {
                    const lifted = this.dice.map((d, i) => (d.liftTo > 0 ? i : -1)).filter(i => i >= 0);
                    if (lifted.length && m.thrown) { const s = score(lifted.map(i => m.thrown[i].face)); pill = g.opp.short + " odkłada: " + (s.valid ? s.name + "  ·  " + s.points : "..."); pc = S.text; }
                    else pill = "Tura: " + g.opp.short;
                }
            }
            const turns = g && g.started && !m.over ? [m.cur === 0 ? m.turn.pts : 0, m.cur === 1 ? m.turn.pts : 0] : [0, 0];
            const key = [g && this.phase !== "lobby" ? g.key : "", pill, pc, turns.join(","), g ? g.potShown : 0].join("|");
            if (key === this._fk) return;
            this._fk = key;
            const b = this.feltText.bitmap, W = b.width, H = b.height;
            b.clear();
            if (!g || this.phase === "lobby") return;
            const labels = [["TY", HERO_COL], [g.opp.short.toUpperCase(), OPP_COL]];
            for (const [text, cx] of labels) {
                const size = measure(b, text, 14, true) > COL_W - 8 ? 12 : 14;
                txt(b, text, cx - FELT.x - 50, 12 + (14 - size), 100, { size, color: "rgba(232,200,120,0.78)", bold: true, align: "center" });
            }
            turns.forEach((t, i) => { if (t > 0) txt(b, "+" + t, (i ? OPP_COL : HERO_COL) - FELT.x - 50, H - 44, 100, { size: 20, color: "rgba(255,226,140,0.95)", bold: true, align: "center", outline: 3 }); });
            if (g.potShown > 0) {   // the pot's label under the coins
                const s = "Pula " + gold(g.potShown), w = Math.ceil(measure(b, s, 16, true)) + 22, x = POT.x - FELT.x - w / 2, y = POT.y - FELT.y + 44;
                const ctx = b.context;
                rr(ctx, x, y, w, 24, 12); ctx.fillStyle = "rgba(8,10,9,0.72)"; ctx.fill(); ctx.strokeStyle = FELT_GOLD + "0.5)"; ctx.lineWidth = 1; ctx.stroke(); dirty(b);
                txt(b, s, x, y + 1, w, { size: 16, color: GOLD_TXT, bold: true, align: "center", lh: 22 });
            }
            if (pill) {
                const w = Math.ceil(measure(b, pill, 18, true)) + 40, x = W / 2 - w / 2, y = H - 40;
                const ctx = b.context;
                rr(ctx, x, y, w, 30, 15); ctx.fillStyle = "rgba(8,10,9,0.78)"; ctx.fill();
                ctx.strokeStyle = pc === S.accent ? "rgba(255,210,63,0.7)" : pc === BAD ? "rgba(255,123,107,0.7)" : FELT_GOLD + "0.35)"; ctx.lineWidth = 1; ctx.stroke(); dirty(b);
                txt(b, pill, x, y + 3, w, { size: 18, color: pc, bold: pc !== S.muted, align: "center", lh: 24 });
            }
        }
        drawPot() {
            const g = this.game, n = g && this.phase !== "lobby" && g.potShown > 0 ? clamp(Math.round(g.potShown / 4) + 2, 3, 32) : 0;
            if (n !== this._potN) {
                this._potN = n;
                this.potSpr.bitmap = n > 0 ? potBitmap(n) : null;
            }
        }

        // ==============================================================
        // The panels over the table: the lobby, the rules, leaving, the end of a game
        // ==============================================================
        drawOverlay() {
            const p = this.phase, show = p === "lobby" || p === "rules" || p === "confirm" || p === "end";
            this.overlay.visible = show;
            if (!show) { this.hits = null; return; }
            const key = this.overlayKey();
            if (key === this._ok) return;
            this._ok = key;
            const b = this.overlay.bitmap;
            b.clear();
            this.hits = [];
            if (p === "rules") {
                if (this.rulesBack === "lobby") this.drawLobby(b, true);
                this.drawRules(b);
            } else if (p === "lobby") this.drawLobby(b);
            else if (p === "confirm") this.drawConfirm(b);
            else if (p === "end") this.drawEnd(b);
        }
        overlayKey() {
            const L = this.lobby, p = this.phase;
            const ready = [heroBustName()].concat(OPP_ORDER.map(k => OPPONENTS[k].bust)).map(n => (loadBust(n).isReady() ? 1 : 0)).join("")
                + (ImageManager.loadSystem("IconSet").isReady() ? 1 : 0);
            if (p === "lobby" || (p === "rules" && this.rulesBack === "lobby")) return [p, ready, L.row, L.i, L.sel, L.stakeI, L.slot, L.btn, store().set.join(), $gameParty.gold()].join("|");
            if (p === "confirm") return p + this.confirmSel;
            if (p === "end") return [p, ready, this.endSel, this.gameNo].join("|");
            return p + ready;
        }
        dim(b, a) { b.fillRect(0, 0, b.width, b.height, "rgba(0,0,0," + a + ")"); }
        drawLobby(b, under) {
            const S = ST(), L = this.lobby, px = 140, py = 48, pw = 1000, ph = 622;
            this.dim(b, 0.45);
            panel(b, px, py, pw, ph, { cut: 10 });
            txt(b, "SALA GIER · „POD ZŁOTYM KUFLEM”", px + 32, py + 20, 600, { size: 15, color: S.muted, bold: true });
            txt(b, "Kości", px + 32, py + 38, 400, { size: 44, color: S.accent, bold: true });
            txt(b, "Sześć kości, kubek i odrobina odwagi. Kto pierwszy dojdzie do celu, bierze całą pulę.", px + 32, py + 96, pw - 64, { size: 18, color: S.text });
            const h = hourNow(), clock = String(Math.floor(h) % 24).padStart(2, "0") + ":" + String(Math.floor((h % 1) * 60)).padStart(2, "0");
            txt(b, clock + " · dzień " + dayNow(), px + pw - 332, py + 22, 300, { size: 17, color: S.muted, align: "right" });
            txt(b, "Sakiewka: " + gold($gameParty.gold()), px + pw - 332, py + 46, 300, { size: 22, color: S.accent, bold: true, align: "right" });
            b.fillRect(px + 32, py + 132, pw - 64, 1, S.line);
            txt(b, "KTO SIEDZI PRZY STOLE", px + 32, py + 142, 400, { size: 14, color: S.muted, bold: true });
            txt(b, L.hint || "Kto siedzi przy stole, zależy od pory dnia.", px + 332, py + 142, pw - 364, { size: 14, color: L.hint ? "#c9b27a" : "#6d737c", align: "right" });
            const n = L.cards.length, gap = 22, cw = Math.min(212, Math.floor((pw - 64 - (n - 1) * gap) / Math.max(1, n))), ch = 226, total = n * cw + (n - 1) * gap, x0 = px + Math.round((pw - total) / 2), y0 = py + 168;
            if (!n) {
                txt(b, "Stoły puste. Wróć wieczorem.", px, y0 + 70, pw, { size: 30, color: S.accent, bold: true, align: "center" });
                txt(b, "O tej porze nikt nie gra w kości.", px, y0 + 114, pw, { size: 18, color: S.muted, align: "center" });
            }
            L.cards.forEach((c, i) => this.drawCard(b, c, x0 + i * (cw + gap), y0, cw, ch, i === L.sel, L.row === "cards" && i === L.i));
            // the chosen rival's words
            const card = this.lobbyCard();
            if (card) {
                const o = OPPONENTS[card.key], q = card.tired ? o.lines.tired[0] : o.quote;
                b.fillRect(px + 32, py + 408, 3, 26, S.accentDim);
                txt(b, "„" + q + "”", px + 46, py + 405, pw - 300, { size: 19, color: "#d8dde3" });
                txt(b, "— " + o.name, px + pw - 300, py + 407, 268, { size: 17, color: S.muted, align: "right" });
            }
            // the stake
            const sy = py + 452, stake = this.lobbyStake(), fS = L.row === "stake";
            txt(b, "STAWKA", px + 32, sy + 10, 120, { size: 14, color: S.muted, bold: true });
            const bx = px + 150, bw = 176;
            ST().panel(b.context, bx, sy, bw, 40, { cut: 4, fill: fS ? "rgba(255,210,63,0.12)" : "rgba(20,22,27,0.94)", line: fS ? S.accent : S.line, accent: fS });
            const tcol = card && stake ? (fS ? S.accent : S.text) : "#565b64";
            tri(b.context, "left", bx + 20, sy + 20, 14, tcol); tri(b.context, "right", bx + bw - 20, sy + 20, 14, tcol);
            dirty(b);
            txt(b, card ? gold(stake) : "—", bx, sy + 5, bw, { size: 24, color: card ? (fS ? S.accent : S.text) : "#565b64", bold: true, align: "center" });
            this.hits.push({ row: "stake", dir: -1, x: bx, y: sy, w: 44, h: 40 }, { row: "stake", dir: 1, x: bx + bw - 44, y: sy, w: 44, h: 40 }, { row: "stake", x: bx + 44, y: sy, w: bw - 88, h: 40 });
            if (card) {
                const afford = $gameParty.gold() >= stake;
                const tg = targetFor(stake, card.key), info = afford ? "pula " + gold(stake * 2) + "   ·   gra do " + tg + (tg < TARGET ? " (szybka partia)" : tg > TARGET ? " (wielka gra)" : "") : "Masz za mało złota na tę stawkę.";
                txt(b, info, bx + bw + 20, sy + 8, 520, { size: 18, color: afford ? S.text : BAD });
            }
            // the hero's six
            const dy = py + 506, fD = L.row === "dice", set = heroSet(), specials = this.hasSpecials();
            txt(b, "TWOJE KOŚCI", px + 32, dy + 10, 130, { size: 14, color: S.muted, bold: true });
            set.forEach((k, i) => {
                const x = px + 150 + i * 48, sz = 38;
                paintDie(b.context, x, dy + 1, sz, [5, 1, 3, 6, 2, 4][i], k);
                if (fD && i === L.slot) {
                    const c = b.context; c.save(); c.strokeStyle = S.accent; c.lineWidth = 2;
                    const a = x - 5, z = x + sz + 5, t = dy - 4, bo = dy + sz + 6, l = 9;
                    c.beginPath(); c.moveTo(a, t + l); c.lineTo(a, t); c.lineTo(a + l, t); c.moveTo(z - l, t); c.lineTo(z, t); c.lineTo(z, t + l);
                    c.moveTo(z, bo - l); c.lineTo(z, bo); c.lineTo(z - l, bo); c.moveTo(a + l, bo); c.lineTo(a, bo); c.lineTo(a, bo - l); c.stroke(); c.restore();
                }
                this.hits.push({ row: "dice", i, x: x - 4, y: dy - 4, w: sz + 8, h: sz + 10 });
            });
            dirty(b);
            const k = fD ? set[L.slot] : null, T = k ? DIE_TYPES[k] : null;
            if (specials && T) {
                txt(b, T.name, px + 452, dy - 2, pw - 480, { size: 19, color: S.accent, bold: true });
                txt(b, T.effect + (SPECIAL_ORDER.some(s => ownedCount(s) > 0) ? "   (O: zmień)" : ""), px + 452, dy + 22, pw - 480, { size: 15, color: S.muted });
            } else if (specials) {
                const names = SPECIAL_ORDER.filter(s => ownedCount(s) > 0).map(s => DIE_TYPES[s].name + (ownedCount(s) > 1 ? " ×" + ownedCount(s) : ""));
                txt(b, "Masz: " + names.join(", "), px + 452, dy - 2, pw - 480, { size: 17, color: S.text });
                txt(b, "Wybierz kość strzałkami i zmień ją klawiszem O.", px + 452, dy + 22, pw - 480, { size: 15, color: S.muted });
            } else {
                txt(b, "Sześć zwykłych kości z kości.", px + 452, dy - 2, pw - 480, { size: 17, color: S.text });
                txt(b, "Kości wyjątkowe zdobywa się przy stole i w przygodach.", px + 452, dy + 22, pw - 480, { size: 15, color: S.muted });
            }
            // the buttons
            const by = py + ph - 62, btns = [["Zasady", px + 32, 150, false], ["Siadam do gry", px + pw - 32 - 170 - 14 - 250, 250, true], ["Odchodzę", px + pw - 32 - 170, 170, false]];
            btns.forEach(([label, x, w, primary], i) => {
                const en = i !== 1 || this.canPlay();
                drawButton(b, x, by, w, 44, label, { focus: L.row === "buttons" && L.btn === i && en, disabled: !en, primary });
                this.hits.push({ row: "buttons", i, x, y: by, w, h: 44 });
            });
            if (under) this.hits = [];
        }
        drawCard(b, c, x, y, w, h, sel, foc) {
            const S = ST(), o = OPPONENTS[c.key], ctx = b.context, v = vsOf(c.key), off = c.tired || !c.afford;
            S.panel(ctx, x, y, w, h, { cut: 6, fill: sel ? "rgba(255,210,63,0.08)" : "rgba(18,20,24,0.96)", line: sel ? S.accent : S.line, accent: sel });
            // the bust in a warm little window
            const ix = x + 9, iy = y + 9, iw = w - 18, ih = 130;
            const bg = ctx.createRadialGradient(ix + iw / 2, iy + ih * 0.7, 10, ix + iw / 2, iy + ih * 0.6, iw * 0.7);
            bg.addColorStop(0, "rgba(120,74,34,0.9)"); bg.addColorStop(1, "rgba(28,18,10,0.95)");
            ctx.fillStyle = bg; ctx.fillRect(ix, iy, iw, ih);
            const bust = loadBust(o.bust);
            if (bust.isReady() && bust.width) {
                ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip();
                ctx.imageSmoothingEnabled = true;
                const sw = bust.width * 0.7, sh = sw * ih / iw;
                ctx.drawImage(bust._canvas || bust._image, (bust.width - sw) / 2, 4, sw, sh, ix, iy, iw, ih);
                ctx.restore();
            }
            ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 1; ctx.strokeRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1);
            dirty(b);
            if (v.games > 0) {
                const rec = v.wins + " : " + v.losses, rw = Math.ceil(measure(b, rec, 13, true)) + 14;
                S.panel(ctx, ix + iw - rw - 5, iy + 5, rw, 20, { cut: 3, fill: "rgba(8,9,11,0.85)", accent: false }); dirty(b);
                txt(b, rec, ix + iw - rw - 5, iy + 5, rw, { size: 13, color: S.text, bold: true, align: "center", lh: 20 });
            }
            txt(b, o.short, x + 14, y + 144, w - 28, { size: 22, color: off ? S.muted : S.accent, bold: true });
            txt(b, o.role, x + 14, y + 172, w - 28, { size: 15, color: S.muted });
            const st = o.stakes, range = st.length > 1 ? st[0] + "–" + gold(st[st.length - 1]) : gold(st[0]);
            if (c.tired) txt(b, "Dziś już nie gra", x + 14, y + 194, w - 28, { size: 16, color: BAD, bold: true });
            else if (!c.afford) txt(b, range + " · za mała sakiewka", x + 14, y + 194, w - 28, { size: 16, color: BAD });
            else {
                txt(b, range, x + 14, y + 194, 90, { size: 16, color: S.text, bold: true });
                txt(b, o.style, x + 14, y + 194, w - 28, { size: 16, color: o.styleColor, align: "right" });
            }
            if (off) { ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(ix, iy, iw, ih); dirty(b); }
            if (foc && !sel) { ctx.strokeStyle = S.accent; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); dirty(b); }
            this.hits.push({ row: "cards", i: this.lobby.cards.indexOf(c), x, y, w, h });
        }
        drawRules(b) {
            const S = ST(), px = 120, py = 50, pw = 1040, ph = 618, ctx = b.context;
            this.dim(b, 0.6);
            panel(b, px, py, pw, ph, { cut: 10, fill: "rgba(11,12,15,0.985)" });
            txt(b, "JAK SIĘ GRA", px + 32, py + 20, 400, { size: 15, color: S.muted, bold: true });
            txt(b, "Zasady gry w kości", px + 32, py + 38, 600, { size: 38, color: S.accent, bold: true });
            const rules = [
                "Każdy ma sześć kości. Rzucasz wszystkimi naraz.",
                "Po każdym rzucie odkładasz co najmniej jedną punktującą kość. Potem zapisujesz punkty tury albo rzucasz dalej resztą kości.",
                "Rzut bez żadnej punktującej kości to „Pudło!” — punkty z tej tury przepadają.",
                "Odłożysz wszystkie sześć? „Gorące kości!” — rzucasz znowu całą szóstką, a punkty tury zostają.",
                "Liczą się tylko odłożone kości, a układy tylko w obrębie jednego rzutu.",
                "Wygrywa, kto pierwszy dojdzie do celu: 2000 punktów, przy małej stawce (do " + gold(QUICK_STAKE) + ") szybka partia do 1500. Zwycięzca bierze całą pulę."
            ];
            let y = py + 100;
            const cw = 452;
            for (const r of rules) {
                const ls = wrapLines(b, r, cw - 24, 18);
                b.fillRect(px + 38, y + 11, 6, 6, S.accent);
                for (const l of ls) { txt(b, l, px + 54, y, cw - 24, { size: 18, lh: 25 }); y += 25; }
                y += 9;
            }
            // the points, with little dice
            const tx = px + 540, tw = pw - 540 - 32;
            txt(b, "PUNKTY", tx, py + 104, 200, { size: 14, color: S.muted, bold: true });
            const rows = [
                [[1], "jedynka", "100"], [[5], "piątka", "50"], [[1, 1, 1], "trzy jedynki", "1000"],
                [[4, 4, 4], "trzy takie same", "oczko × 100"], [[4, 4, 4, 4], "cztery takie same", "× 2"],
                [[4, 4, 4, 4, 4], "pięć takich samych", "× 4"], [[4, 4, 4, 4, 4, 4], "sześć takich samych", "× 8"],
                [[1, 2, 3, 4, 5], "mały strit", "500"], [[2, 3, 4, 5, 6], "duży strit", "750"], [[1, 2, 3, 4, 5, 6], "pełny strit", "1500"]
            ];
            y = py + 130;
            rows.forEach(([faces, name, pts], i) => {
                if (i % 2 === 0) { ctx.fillStyle = "rgba(255,255,255,0.03)"; ctx.fillRect(tx - 8, y - 3, tw + 16, 38); }
                faces.forEach((f, j) => paintDie(ctx, tx + j * 27, y + 3, 24, f, "std"));
                txt(b, name, tx + 172, y + 3, 170, { size: 18, color: S.text });
                txt(b, pts, tx + tw - 130, y + 2, 130, { size: 19, color: S.accent, bold: true, align: "right" });
                y += 40;
            });
            dirty(b);
            txt(b, "Przykład: trzy czwórki to 400, cztery czwórki 800, pięć czwórek 1600.", tx - 8, y + 4, tw + 16, { size: 15, color: S.muted });
            b.fillRect(px + 32, py + ph - 64, pw - 64, 1, S.line);
            txt(b, "Zasady są zawsze pod przyciskiem „Zasady”.", px + 32, py + ph - 50, 600, { size: 16, color: S.muted });
            txt(b, "O — rozumiem, gramy", px + pw - 432, py + ph - 52, 400, { size: 21, color: S.accent, bold: true, align: "right" });
        }
        drawConfirm(b) {
            const S = ST(), g = this.game, pw = 560, ph = 236, px = (b.width - pw) / 2, py = (b.height - ph) / 2 - 20;
            this.dim(b, 0.55);
            panel(b, px, py, pw, ph, { cut: 10 });
            txt(b, "Odejść od stołu?", px + 30, py + 22, pw - 60, { size: 30, color: S.accent, bold: true });
            const text = "Partia trwa. Twoja stawka (" + gold(g.stake) + ") przepada, a " + g.opp.short + " zgarnia pulę.";
            let y = py + 76;
            for (const l of wrapLines(b, text, pw - 60, 19)) { txt(b, l, px + 30, y, pw - 60, { size: 19 }); y += 26; }
            [["Zostaję", px + 30, 230], ["Odchodzę", px + pw - 30 - 230, 230]].forEach(([label, x, w], i) => {
                drawButton(b, x, py + ph - 66, w, 44, label, { focus: this.confirmSel === i, primary: i === 0 });
                this.hits.push({ row: "confirm", i, x, y: py + ph - 66, w, h: 44 });
            });
        }
        drawEnd(b) {
            const S = ST(), g = this.game, m = g.match, rec = this.results[this.results.length - 1] || {}, won = !!rec.won;
            const gift = g.gift ? DIE_TYPES[g.gift] : null, blockWhy = this.againBlock(), boxed = !!(gift || g.giftGold);
            const pw = 780, ph = 404 + (boxed ? 88 : 0) + (boxed && blockWhy ? 26 : 0), px = TBL.x + (TBL.w - pw) / 2, py = TBL.y + (TBL.h - ph) / 2 - 6, ctx = b.context;
            this.dim(b, 0.35);
            panel(b, px, py, pw, ph, { cut: 10 });
            txt(b, "KONIEC PARTII · " + g.opp.name.toUpperCase(), px + 32, py + 20, pw - 64, { size: 15, color: S.muted, bold: true });
            txt(b, won ? "Wygrana!" : "Przegrana", px + 32, py + 38, 400, { size: 50, color: won ? S.accent : "#ff8f7f", bold: true });
            // the score
            const sc = "Ty  " + m.players[0].total + "  :  " + m.players[1].total + "  " + g.opp.short;
            txt(b, sc, px + pw - 432, py + 50, 400, { size: 24, color: S.text, bold: true, align: "right" });
            txt(b, "gra do " + m.target + " · tury: " + m.turnNo, px + pw - 432, py + 84, 400, { size: 15, color: S.muted, align: "right" });
            b.fillRect(px + 32, py + 116, pw - 64, 1, S.line);
            let y = py + 130;
            txt(b, won ? "+" + gold(g.pot + (g.giftGold || 0)) + " do sakiewki" : "Stawka przepada: −" + gold(g.stake), px + 32, y, 420, { size: 24, color: won ? GOOD : BAD, bold: true });
            if (won && g.xp) txt(b, "+" + g.xp + " dośw.", px + pw - 232, y + 4, 200, { size: 19, color: "#c9a6ff", bold: true, align: "right" });
            y += 44;
            const best = rec.best ? rec.best.name + " · " + rec.best.points : "—";
            txt(b, "Twój najlepszy rzut:  " + best, px + 32, y, pw - 64, { size: 18, color: S.text });
            y += 28;
            txt(b, "Pudła: " + m.players[0].busts + "   ·   gorące kości: " + m.players[0].hot + "   ·   w sakiewce: " + gold($gameParty.gold()), px + 32, y, pw - 64, { size: 17, color: S.muted });
            y += 40;
            const line = g.closing || "";
            if (line) {
                const ls = wrapLines(b, "„" + line + "”", pw - 110, 19);
                b.fillRect(px + 32, y + 2, 3, ls.length * 26 - 4, S.accentDim);
                for (const l of ls) { txt(b, l, px + 46, y, pw - 110, { size: 19, color: "#d8dde3" }); y += 26; }
                txt(b, "— " + g.opp.name, px + 46, y, pw - 110, { size: 16, color: S.muted });
                y += 30;
            }
            if (gift) {   // a special die from the rival
                const gy = py + ph - 62 - (blockWhy ? 36 : 12) - 78;
                S.panel(ctx, px + 32, gy, pw - 64, 78, { cut: 5, fill: "rgba(255,210,63,0.08)", line: S.accentDim, accent: false });
                paintDie(ctx, px + 48, gy + 11, 56, 1, g.gift);
                dirty(b);
                txt(b, "Nowa kość: " + gift.name, px + 124, gy + 10, pw - 180, { size: 21, color: S.accent, bold: true });
                txt(b, gift.effect, px + 124, gy + 40, pw - 180, { size: 16, color: S.text });
            } else if (g.giftGold) {   // the stranger's purse (the hero has his die already)
                const gy = py + ph - 62 - (blockWhy ? 36 : 12) - 78;
                S.panel(ctx, px + 32, gy, pw - 64, 78, { cut: 5, fill: "rgba(255,210,63,0.08)", line: S.accentDim, accent: false });
                const cb = coinBitmap();
                for (let i = 0; i < 4; i++) b.blt(cb, 0, 0, cb.width, cb.height, px + 50 + (i % 2) * 6, gy + 34 - i * 8, cb.width, cb.height);
                txt(b, "Sakiewka od nieznajomego: +" + gold(g.giftGold), px + 124, gy + 10, pw - 180, { size: 21, color: S.accent, bold: true });
                txt(b, "Kość z Kruczych Skał już masz - dostajesz złoto.", px + 124, gy + 40, pw - 180, { size: 16, color: S.text });
            }
            const by = py + ph - 62;
            if (blockWhy) txt(b, blockWhy, px + 32, by - 30, pw - 64, { size: 15, color: S.muted });
            const bw = 220, gap = 16, bx0 = px + pw - 32 - bw * 3 - gap * 2;
            this.endBtns.forEach((btn, i) => {
                const x = bx0 + i * (bw + gap);
                drawButton(b, x, by, bw, 44, btn.label, { focus: this.endSel === i && btn.enabled, disabled: !btn.enabled, primary: btn.primary });
                this.hits.push({ row: "end", i, x, y: by, w: bw, h: 44 });
            });
        }
    }
    window.Scene_TavernDice = Scene_TavernDice;

    // Ozzy's muttering about a throw that is already on its way (the words from what the dice show)
    function visionText(faces, lines, rng) {
        if (!hasScore(faces)) return pickOf(rng, lines.bust);
        const b = best(faces), c = b ? b.combos : [];
        if (c.some(x => x.key === "s16")) return pickOf(rng, lines.s16);
        if (c.some(x => x.kind === "straight")) return pickOf(rng, lines.straight);
        const kind = c.filter(x => x.kind === "kind").sort((a, z) => z.points - a.points)[0];
        if (kind) return pickOf(rng, lines.kind).replace("{w}", cap(facesWord(kind.n, kind.face)));
        const n = countsOf(faces);
        if (n[1] === 1 && !n[5]) return pickOf(rng, lines.one);
        if (n[5] === 1 && !n[1]) return pickOf(rng, lines.five);
        return cap([n[1] ? facesWord(n[1], 1) : "", n[5] ? facesWord(n[5], 5) : ""].filter(Boolean).join(" i ")) + "... hyk.";
    }

    // ==================================================================
    // Back on the map: the experience, the journal's notes, the notices at the top, onEnd
    // ==================================================================
    function applyRewards(p) {
        const r = p.rewards || {};
        try {
            if (r.xp > 0 && window.Combat && typeof Combat.gainXp === "function") Combat.gainXp(r.xp, "wygrana w kości");
            if (window.Journal && typeof Journal.addNote === "function") for (const [t, x] of r.notes || []) Journal.addNote(t, x);
            if (window.$gameTemp && typeof $gameTemp.pushTopNotice === "function") for (const [t, c, sub] of r.notices || []) $gameTemp.pushTopNotice(t, c, sub ? { sub } : null);
        } catch (e) { console.error(e); }
        if (typeof p.onEnd === "function") { try { p.onEnd(p.result); } catch (e) { console.error(e); } }
    }
    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        const p = pendingEnd;
        if (!p) return;
        pendingEnd = null;
        applyRewards(p);
    };

    // ==================================================================
    // The tables on the map: an event with <Tavern:dice> in a comment of its first page (or of the page on)
    // ==================================================================
    const TAG = /<Tavern\s*:\s*dice(?:\s*:\s*(\w+))?\s*>/i;
    function diceTag(ev) {
        if (!ev || typeof ev.event !== "function") return null;
        const data = ev.event();
        if (!data || !data.pages) return null;
        const lists = [];
        const page = ev.page && ev.page();
        if (page) lists.push(page.list);
        if (data.pages[0]) lists.push(data.pages[0].list);
        for (const list of lists) {
            for (const c of list || []) {
                if (c.code !== 108 && c.code !== 408) continue;
                const m = TAG.exec(String(c.parameters[0] || ""));
                if (m) return { only: m[1] && OPPONENTS[m[1].toLowerCase()] ? m[1].toLowerCase() : null };
            }
        }
        return null;
    }
    const _Game_Event_start = Game_Event.prototype.start;
    Game_Event.prototype.start = function() {
        // (the action button or a touch - not an autorun or parallel page)
        const tag = !this._erased && (this._trigger === undefined || this._trigger === null || this._trigger <= 2) ? diceTag(this) : null;
        if (tag) { openTable({ only: tag.only, eventId: this.eventId() }); return; }
        _Game_Event_start.call(this);
    };
    function popupMsg(text, colour) {
        if (window.$gameTemp && typeof $gameTemp.pushLootPopup === "function" && SceneManager._scene instanceof Scene_Map) $gameTemp.pushLootPopup(0, text, colour || "#ff9f8f");
        TavernDice.lastRefusal = text;
    }
    // the table: refused when no one sits there or the purse is too thin for anyone
    function openTable(o) {
        o = o || {};
        if (running || SceneManager.isSceneChanging()) return false;
        const hour = hourNow(), list = present(hour, dayNow(), o.only);
        if (!list.length) {
            const only = o.only && OPPONENTS[o.only];
            popupMsg(only && hour >= 10 ? only.short + " siada do kości dopiero od " + only.hours[0] + ":00." : "Stoły puste. Wróć wieczorem.", "#eceef0");
            return false;
        }
        const awake = list.filter(p => !p.tired);
        if (!awake.length) { popupMsg("Nikt już dziś nie chce grać. Wróć jutro.", "#eceef0"); return false; }
        const min = Math.min(...awake.map(p => OPPONENTS[p.key].stakes[0]));
        if ($gameParty.gold() < min) { popupMsg("Za mało złota na grę (najmniej " + gold(min) + ")."); return false; }
        return launch(Object.assign({}, o));
    }
    function launch(opts) {
        if (running || SceneManager.isSceneChanging()) return false;
        pendingOpts = opts || {};
        if (window.$gameTemp && $gameTemp.clearDestination) $gameTemp.clearDestination();
        SceneManager.push(Scene_TavernDice);
        return true;
    }

    // ==================================================================
    // API
    // ==================================================================
    const TavernDice = {
        OPPONENTS, DIE_TYPES, SPECIAL_ORDER, P_BUST, E_OK, Match, streams, makeRng,
        onTick: null,
        lastResult: null,
        lastGame: null,
        lastRefusal: "",
        // opts: { opponent, stake, onEnd(result), seed, turbo } - with no opponent/stake: the table with its choice (by the hour);
        // false when it cannot start (not enough gold for the stake, a scene already on)
        start(opts) {
            opts = Object.assign({}, opts || {});
            if (running || SceneManager.isSceneChanging()) return false;
            if (opts.opponent !== undefined && opts.opponent !== null && !OPPONENTS[opts.opponent]) return false;
            if (opts.opponent && opts.stake !== undefined) {
                const stake = Number(opts.stake);
                if (!(stake > 0)) return false;
                if ($gameParty.gold() < stake) { popupMsg("Nie stać cię na stawkę " + gold(stake) + "."); return false; }
                opts.stake = stake;
                return launch(opts);
            }
            if (opts.opponent) {
                if ($gameParty.gold() < OPPONENTS[opts.opponent].stakes[0]) { popupMsg("Za mało złota na grę (najmniej " + gold(OPPONENTS[opts.opponent].stakes[0]) + ")."); return false; }
                return launch(opts);
            }
            return openTable(opts);
        },
        openTable,
        score, hasScore, options, best, rollFace, decide, simulate, present, locked, fame, targetFor, setupGame, describe,
        // a special die for the hero (a quest's reward); a notice when on the map
        giveDie(key) {
            if (!giveDie(key)) return false;
            if (SceneManager._scene instanceof Scene_Map && window.$gameTemp && $gameTemp.pushTopNotice) $gameTemp.pushTopNotice("Nowa kość do gry: " + DIE_TYPES[key].name, ST().accent, { sub: DIE_TYPES[key].effect });
            return true;
        },
        // the hero's dice: the chosen six and the special ones he has
        dice() {
            return {
                set: heroSet(),
                owned: SPECIAL_ORDER.filter(k => ownedCount(k) > 0).map(k => ({ key: k, name: DIE_TYPES[k].name, count: ownedCount(k), effect: DIE_TYPES[k].effect }))
            };
        },
        // puts a special die into one of the six (i 0-5); false when he has none to spare
        setDie(i, key) {
            const set = heroSet();
            if (!(i >= 0 && i < 6) || !DIE_TYPES[key]) return false;
            if (key !== "std" && set.filter((x, j) => j !== i && x === key).length >= ownedCount(key)) return false;
            set[i] = key;
            store().set = set;
            return true;
        },
        stats() { return JSON.parse(JSON.stringify(store())); },
        isRunning: () => !!running,
        scene: () => running,
        // throws of one die of a kind (seeded): how often each face came up [n1..n6]
        rollStats(type, n, seed) {
            const rng = makeRng(seed || 1), w = (DIE_TYPES[type] || DIE_TYPES.std).w, c = [0, 0, 0, 0, 0, 0, 0];
            for (let i = 0; i < n; i++) c[rollFace(rng, w)]++;
            return c.slice(1);
        },
        // the hero's move from a script (tests, a tutorial): "throw"; "select" [indices]; "roll" / "bank" (the selection); "leave"
        act(kind, idx) {
            const s = running;
            if (!s || s.phase !== "play") return false;
            if (kind === "throw") { if (s.waitHero !== "throw") return false; s.heroAct = { kind: "throw" }; return true; }
            if (kind === "select") { if (s.waitHero !== "choose") return false; s.dice.forEach((d, i) => { d.liftTo = (idx || []).includes(i) ? 1 : 0; }); return true; }
            if (kind === "roll" || kind === "bank") {
                if (s.waitHero !== "choose") return false;
                const sel = s.selection();
                if (!sel.valid) return false;
                s.heroAct = { idx: sel.idx, bank: kind === "bank" };
                return true;
            }
            if (kind === "leave") { s.askLeave(); return true; }
            return false;
        },
        state() {
            const s = running;
            if (!s) return null;
            const g = s.game, m = g && g.match;
            return {
                phase: s.phase, wait: s.waitHero, gameNo: s.gameNo, rulesBack: s.rulesBack || null,
                lobby: s.phase === "lobby" && s.lobby ? { cards: s.lobby.cards.map(c => ({ key: c.key, tired: c.tired, afford: c.afford })), sel: s.lobby.sel, row: s.lobby.row, btn: s.lobby.btn, stake: s.lobbyStake(), canPlay: s.canPlay(), hint: s.lobby.hint } : null,
                game: g ? {
                    opponent: g.key, stake: g.stake, pot: g.pot, potShown: g.potShown, target: m.target, cur: m.cur, turnNo: m.turnNo, over: m.over, winner: m.winner,
                    done: g.done, totals: m.players.map(p => p.total), shown: s.shown.slice(), turn: m.turn.pts, free: m.turn.free.length, special: g.setup.special,
                    first: g.setup.first, hotNext: m.hotNext, busts: m.players.map(p => p.busts), hot: m.players.map(p => p.hot), gift: g.gift, giftGold: g.giftGold || 0, heroDice: m.players[0].dice.slice()
                } : null,
                dice: s.dice.map((d, i) => ({ i, face: d.face, x: Math.round(d.x), y: Math.round(d.y + d.body.y), h: Math.round(d.h), sel: d.liftTo > 0, busy: d.busy(), type: d.type })),
                aside: s.aside.map(a => a.length),
                focus: Object.assign({}, s.focus),
                selection: s.waitHero === "choose" ? s.selection() : null,
                buttons: s.phase === "play" ? s.buttons().map(b => ({ id: b.id, label: b.label, enabled: b.enabled, x: BAR.x + b.x, y: BAR.y, w: b.w, h: BAR.h })) : [],
                bubbles: { hero: s.bubbleL.shown() ? s.bubbleL.text : "", rival: s.bubbleR.shown() ? s.bubbleR.text : "" },
                banner: s.banner.visible ? s.banner.kind : "",
                cup: s.cup.mode,
                end: s.phase === "end" && s.endBtns ? { buttons: s.endBtns.map(b => ({ id: b.id, enabled: b.enabled })), sel: s.endSel, why: s.againBlock() } : null,
                confirm: s.phase === "confirm" ? s.confirmSel : null,
                talk: s.talkLog.slice(-40),
                results: s.results.slice()
            };
        }
    };
    window.TavernDice = TavernDice;

    PluginManager.registerCommand(PLUGIN, "openTable", () => { openTable({}); });
    PluginManager.registerCommand(PLUGIN, "play", args => { TavernDice.start({ opponent: String(args.opponent || "ozzy"), stake: Number(args.stake) || 5 }); });
    PluginManager.registerCommand(PLUGIN, "giveDie", args => { TavernDice.giveDie(String(args.die || "")); });
})();
