//=============================================================================
// TavernDice.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Gra w kości o pieniądze przy stole w sali gier tawerny „Pod Złotym Kuflem”: sześć kości, odkładanie, pudła, gorące kości, rywale z charakterem, pula na stole i kości specjalne. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base TawernaUI
 * @orderAfter TawernaUI
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
 *   TavernDice.stats()            - statystyki ($gameSystem._tw.dice)
 *   TavernDice.isRunning()
 * Wynik (onEnd, po powrocie na mapę): { played, won, lost, left, net,
 * games: [...], last: { opponent, stake, pot, won, left, hero, rival } }.
 *
 * Stan w $gameSystem._tw.dice (rdzeń TawernaCore; stare zapisy z
 * $gameSystem._dice są przejmowane, stary klucz zostaje jako alias).
 * Scena stoi na Scene_MiniGame z TawernaUI (klawisze, mysz, turbo, popiersia,
 * baner, monety); dźwięki z bezpiecznej puli rdzenia.
 *
 * PLIKI (2026-09-29 podzielone): TavernDice.js (liczenie, rywale przy stole,
 * partia bez obrazków, stan, API - ten), TavernDice_Data.js (kości specjalne,
 * rywale i ich kwestie), TavernDice_Art.js (kości, kubek, stół, panele),
 * TavernDice_Scene.js (scena stołu). Kolejność na liście wtyczek:
 * TavernDice_Data, TavernDice, TavernDice_Art, TavernDice_Scene. Dopóki części
 * nie są wpisane, ten plik wczytuje je sam.
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "TavernDice";
    const TW = window.Tawerna;
    if (!TW || !TW.ui || !TW.ui.Scene_MiniGame) throw new Error("TavernDice.js: brak TawernaCore.js / TawernaUI.js - muszą być wyżej na liście wtyczek (the Tawerna core or UI kit is missing)");
    const ui = TW.ui;
    // the family's shared bag: this file (P.core), TavernDice_Data.js (P.data), TavernDice_Art.js (P.art), TavernDice_Scene.js (P.Scene)
    const P = TW.api("TavernDice_parts") || TW.register("TavernDice_parts", {});
    // the tables (TavernDice_Data.js), read when needed
    function D() {
        if (!P.data) throw new Error("TavernDice.js: brak TavernDice_Data.js (the rivals and the special dice)");
        return P.data;
    }
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
    const NB = " ";   // (a no-break space: "15 G" never breaks)

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
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
    // The saved state: $gameSystem._tw.dice (the core's; an older save's $gameSystem._dice taken over, the old key an alias; plain data)
    // ==================================================================
    function blankStore() {
        return {
            v: 1, games: 0, wins: 0, losses: 0, left: 0, net: 0, biggestPot: 0, bestThrow: null, rulesSeen: false,
            owned: {}, set: ["std", "std", "std", "std", "std", "std"], vs: {}, visions: 0, firstWin: false, last: null
        };
    }
    const diceState = TW.state.define("dice", blankStore, { version: 1, adopt: "_dice", owner: PLUGIN });
    function store() {
        const d = diceState(), b = blankStore();
        for (const k in b) if (d[k] === undefined) d[k] = b[k];
        if (!Array.isArray(d.set) || d.set.length !== 6) d.set = b.set;
        return d;
    }
    const dayNow = () => TW.time.day();
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
            if (!D().DIE_TYPES[k] || k === "std") return "std";
            used[k] = (used[k] || 0) + 1;
            return used[k] <= ownedCount(k) ? k : "std";
        });
    }
    function giveDie(key) {
        if (!D().DIE_TYPES[key] || key === "std") return false;
        const st = store();
        st.owned[key] = (st.owned[key] || 0) + 1;
        return true;
    }

    // ==================================================================
    // Who sits at the table now (hours [from, to), "rare" guests only some days)
    // ==================================================================
    const rareDay = day => ((day * 37 + 11) % 4) === 0;
    function atHour(key, hour, day) {
        const o = D().OPPONENTS[key];
        const h = ((hour % 24) + 24) % 24, [a, b] = o.hours;
        const inHours = b > 24 ? (h >= a || h < b - 24) : (h >= a && h < b);
        return inHours && (!o.rare || rareDay(day));
    }
    // the tavern's fame (QuestBoard.js) or null without the quest board (read from window.QuestBoard: the tests take it away there)
    const fame = () => { const QB = window.QuestBoard; return QB && typeof QB.reputation === "function" ? Number(QB.reputation()) || 0 : null; };
    // does the fame let this rival sit down with the hero (without the quest board: as before - the stranger never comes)
    function fameOk(key) {
        const o = D().OPPONENTS[key], f = fame();
        if (!o.minRep) return true;
        if (f === null) return !o.needsRep;
        return f >= o.minRep;
    }
    // -> [{ key, tired }] (tired: lost enough to the hero today)
    function present(hour, day, only) {
        hour = hour === undefined ? hourNow() : hour;
        day = day === undefined ? dayNow() : day;
        const { OPPONENTS, OPP_ORDER } = D(), keys = only ? [only].filter(k => OPPONENTS[k]) : OPP_ORDER;
        return keys.filter(k => atHour(k, hour, day) && fameOk(k)).map(k => ({ key: k, tired: vsOf(k).lostToday >= OPPONENTS[k].perDay }));
    }
    // the rivals who are at the tables now but do not play with the hero yet (his fame is too low)
    function locked(hour, day) {
        hour = hour === undefined ? hourNow() : hour;
        day = day === undefined ? dayNow() : day;
        return fame() === null ? [] : D().OPP_ORDER.filter(k => atHour(k, hour, day) && !fameOk(k));
    }
    const targetFor = (stake, key) => (key && D().OPPONENTS[key] && D().OPPONENTS[key].target) || (stake <= QUICK_STAKE ? QUICK_TARGET : TARGET);

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
                const type = P.dice[slot] || "std", DT = D().DIE_TYPES, w = (DT[type] || DT.std).w;
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
        const o = D().OPPONENTS[key], dice = ["std", "std", "std", "std", "std", "std"];
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
        const { OPPONENTS, AUTO_AI } = D();
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
    // Back on the map (the scene's result goes there through TawernaUI): the experience, the journal's notes, the notices at the top,
    // then onEnd
    // ==================================================================
    function applyRewards(p) {
        const r = p.rewards || {};
        try {
            if (r.xp > 0) TW.call("Combat", "gainXp", r.xp, "wygrana w kości");
            for (const [t, x] of r.notes || []) TW.call("Journal", "addNote", t, x);
            for (const [t, c, sub] of r.notices || []) TW.popup(t, { top: true, color: c, sub });
        } catch (e) { console.error(e); }
        if (typeof p.onEnd === "function") { try { p.onEnd(p.result); } catch (e) { console.error(e); } }
    }

    // ==================================================================
    // The tables on the map: an event with <Tavern:dice> in a comment of its first page (or of the page on)
    // ==================================================================
    function diceTag(ev) {
        if (!ev || typeof ev.event !== "function") return null;
        const data = ev.event();
        if (!data || !data.pages) return null;
        const pages = [];
        const page = ev.page && ev.page();
        if (page) pages.push(page);
        if (data.pages[0]) pages.push(data.pages[0]);
        for (const p of pages) {
            for (const t of TW.tagList(p)) {
                if (t.name.toLowerCase() !== "tavern") continue;
                const m = /^dice(?:\s*:\s*(\w+))?$/i.exec(t.args.raw);
                if (m) return { only: m[1] && D().OPPONENTS[m[1].toLowerCase()] ? m[1].toLowerCase() : null };
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
        TW.popup(text, { color: colour || "#ff9f8f" });
        TavernDice.lastRefusal = text;
    }
    const scene = () => (P.Scene && ui.running instanceof P.Scene ? ui.running : null);
    // the table: refused when no one sits there or the purse is too thin for anyone
    function openTable(o) {
        o = o || {};
        if (scene() || SceneManager.isSceneChanging()) return false;
        const hour = hourNow(), list = present(hour, dayNow(), o.only);
        if (!list.length) {
            const only = o.only && D().OPPONENTS[o.only];
            popupMsg(only && hour >= 10 ? only.short + " siada do kości dopiero od " + only.hours[0] + ":00." : "Stoły puste. Wróć wieczorem.", "#eceef0");
            return false;
        }
        const awake = list.filter(p => !p.tired);
        if (!awake.length) { popupMsg("Nikt już dziś nie chce grać. Wróć jutro.", "#eceef0"); return false; }
        const min = Math.min(...awake.map(p => D().OPPONENTS[p.key].stakes[0]));
        if ($gameParty.gold() < min) { popupMsg("Za mało złota na grę (najmniej " + gold(min) + ")."); return false; }
        return launch(Object.assign({}, o));
    }
    function launch(opts) {
        if (scene() || SceneManager.isSceneChanging()) return false;
        if (!P.Scene) { console.error("TavernDice.js: brak TavernDice_Scene.js (the table's scene)"); return false; }
        return ui.open(P.Scene, opts || {});
    }

    // ==================================================================
    // API
    // ==================================================================
    const TavernDice = {
        P_BUST, E_OK, Match, streams, makeRng,
        onTick: null,
        lastResult: null,
        lastGame: null,
        lastRefusal: "",
        // opts: { opponent, stake, onEnd(result), seed, turbo } - with no opponent/stake: the table with its choice (by the hour);
        // false when it cannot start (not enough gold for the stake, a scene already on)
        start(opts) {
            opts = Object.assign({}, opts || {});
            if (scene() || SceneManager.isSceneChanging()) return false;
            const { OPPONENTS } = D();
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
            const DT = D().DIE_TYPES[key];
            if (SceneManager._scene instanceof Scene_Map) TW.popup("Nowa kość do gry: " + DT.name, { top: true, color: ui.style().accent, sub: DT.effect });
            return true;
        },
        // the hero's dice: the chosen six and the special ones he has
        dice() {
            const { DIE_TYPES, SPECIAL_ORDER } = D();
            return {
                set: heroSet(),
                owned: SPECIAL_ORDER.filter(k => ownedCount(k) > 0).map(k => ({ key: k, name: DIE_TYPES[k].name, count: ownedCount(k), effect: DIE_TYPES[k].effect }))
            };
        },
        // puts a special die into one of the six (i 0-5); false when he has none to spare
        setDie(i, key) {
            const set = heroSet();
            if (!(i >= 0 && i < 6) || !D().DIE_TYPES[key]) return false;
            if (key !== "std" && set.filter((x, j) => j !== i && x === key).length >= ownedCount(key)) return false;
            set[i] = key;
            store().set = set;
            return true;
        },
        stats() { return JSON.parse(JSON.stringify(store())); },
        isRunning: () => !!scene(),
        scene: () => scene(),
        // throws of one die of a kind (seeded): how often each face came up [n1..n6]
        rollStats(type, n, seed) {
            const DT = D().DIE_TYPES, rng = makeRng(seed || 1), w = (DT[type] || DT.std).w, c = [0, 0, 0, 0, 0, 0, 0];
            for (let i = 0; i < n; i++) c[rollFace(rng, w)]++;
            return c.slice(1);
        },
        // the hero's move from a script (tests, a tutorial): "throw"; "select" [indices]; "roll" / "bank" (the selection); "leave"
        act(kind, idx) {
            const s = scene();
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
            const s = scene();
            if (!s) return null;
            const BAR = P.art.BAR;
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
    // (from the parts: the rivals and the special dice)
    for (const k of ["OPPONENTS", "DIE_TYPES", "SPECIAL_ORDER"]) Object.defineProperty(TavernDice, k, { enumerable: true, get: () => D()[k] });
    window.TavernDice = TW.register(PLUGIN, TavernDice);

    // for TavernDice_Art.js and TavernDice_Scene.js
    P.core = { TARGET, QUICK_TARGET, QUICK_STAKE, XP_BASE, XP_PER_G, MIN_BASE, MIN_TURN, BIG_POT, VISIONS, RESULT_VAR, clamp, gold, makeRng, streams, pickOf,
        score, hasScore, options, best, decide, Match, setupGame, store, dayNow, hourNow, vsOf, ownedCount, heroSet, giveDie, present, locked, fame, targetFor,
        visionText, applyRewards, diceTag };

    PluginManager.registerCommand(PLUGIN, "openTable", () => { openTable({}); });
    PluginManager.registerCommand(PLUGIN, "play", args => { TavernDice.start({ opponent: String(args.opponent || "ozzy"), stake: Number(args.stake) || 5 }); });
    PluginManager.registerCommand(PLUGIN, "giveDie", args => { TavernDice.giveDie(String(args.die || "")); });

    // the parts not in js/plugins.js yet: put into the page here (after every plugin - data and classes only, no engine hooks)
    for (const part of ["TavernDice_Data", "TavernDice_Art", "TavernDice_Scene"]) {
        if (!(window.$plugins || []).some(p => p && p.name === part && p.status)) PluginManager.loadScript(part);
    }
})();
