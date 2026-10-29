// The ferry's travellers (docs/PODROZNI.md, Podroznicy_Data.js + Podroznicy.js) without the game:
//   - the data: the residents 3020-3049 (keys and ids unique, in TownLife's fourth range), the cast in the table's order, every room of
//     the cast a guest room (or the hero's 3 / the Gold suite behind TavernLife's gate), the pool's kinds and bodies, the words of each
//     (js/teksty/podroznicy.txt)
//   - the calendar of chapter 1 (days 1-61, the ferry every 3 days) with a usual game's world: who comes when (the doc's timeline:
//     Tobiasz 4, Konstanty 7, Zenon 10, Gaspar 13, Teofil and Ksenia 16, Augustyn 19, Urszula 22, Tymon 25, Szczerba and the Company 28,
//     Jędrek 31, Erazm 34, Albin 37), the stays, the returns (Tobiasz every 9-12 days), the limit (4 at once; a group one place), 1-3 new
//     a ferry, the rooms (never 1, 2, 7; 3 and the Gold suite only with the gate), no room twice
//   - the pool: the same seed - the same people; another seed - other; a wave day one fewer
//   - an older save loaded on day 40: the late ones one a ferry, in the table's order
//   - renown 60: the limit 5; the siege's night: nobody comes or goes; the gate: the guest of room three in room 3
//   - the day's plans: the day it comes ("w drodze" till noon), the day it leaves (the bill at 11, away from noon), Urszula's ferry days
// Run: node tests/unit/podroznicy.test.js (or node tests/run.js unit)
"use strict";
const fs = require("fs");
const path = require("path");
const unit = require("../lib/unit.js");
const ROOT = path.join(__dirname, "..", "..");

unit.test(t => {
    const sys = { _d: 1, _h: 9, _tw: {}, dayNightDay() { return this._d; }, dayNightHour() { return this._h; }, setDayNightHour(h) { this._h = h; } };
    const globals = { $gameMap: { mapId: () => 8, event: () => null }, $gameParty: { gainItem() {}, gainGold() {} }, $dataItems: [] };
    Object.defineProperty(globals, "$gameSystem", { get: () => sys, enumerable: true, configurable: true });
    const w = unit.load(["TawernaCore", "Watki", "Podroznicy_Data", "Podroznicy"], { globals });
    w.Watki.wczytaj("podroznicy", fs.readFileSync(path.join(ROOT, "js", "teksty", "podroznicy.txt"), "utf8"));
    const D = w.PodroznicyData, P = w.Podroznicy, L = P.logika, TX = D.TX;

    // ================================================================ the data
    const ids = D.RESIDENTS.map(r => r.id), keys = D.RESIDENTS.map(r => r.key);
    t.check("data: " + D.RESIDENTS.length + " residents (14 of the cast with Ksenia and the guest of room three, 4 of the Company, poseł and Ostap, 4 places of the pool), ids unique in 3020-3049, keys unique",
        new Set(ids).size === ids.length && new Set(keys).size === keys.length && ids.every(i => i >= 3020 && i <= 3049) && D.RESIDENTS.length === 24, { ids, keys });
    const okRoom = c => [].concat(c.pokoj !== undefined ? [c.pokoj] : [], c.pokoje || []).every(r => D.POKOJE[r] || (D.POKOJE_BOHATERA[r] === "furtka" && c.wymaga === "furtka"));
    t.check("data: every room of the cast a guest room 4-24 (not 7); room 3 and the Gold suite only for the gated (wymaga: furtka)", D.OBSADA.every(okRoom) && !D.POKOJE[7] && !D.POKOJE[1] && !D.POKOJE[2],
        D.OBSADA.filter(c => !okRoom(c)).map(c => c.key));
    t.check("data: 16 kinds of the pool, each on one of the 4 bodies; the bodies' sheets made (img/characters)",
        Object.keys(D.PULA).length === 16 && Object.values(D.PULA).every(p => D.CIALA[p.cialo]) && [].concat(...Object.values(D.CIALA)).every(s => fs.existsSync(path.join(ROOT, "img", "characters", s + ".png"))));
    const sheets = D.OBSADA.filter(c => c.arkusz).map(c => c.arkusz).concat(Object.values(D.CZLONKOWIE).map(m => m.arkusz));
    t.check("data: the cast's stand-in sheets and their busts are there (tools/podroznicy/zastepcze.py)",
        sheets.every(s => fs.existsSync(path.join(ROOT, "img", "characters", s + ".png")) && fs.existsSync(path.join(ROOT, "img", "pictures", s.slice(5) + "_Bust.png"))), sheets);
    const words = ["imie", "tytul", "przybycie", "spotkanie", "skad", "glos", "okrzyki", "odjazd"];
    const castKeys = D.OBSADA.filter(c => !c.grupa).map(c => c.key).concat(["posel", "gwardzista"]);
    const lack = [];
    for (const k of castKeys) for (const f of words) if (!TX.obsada[k] || !TX.obsada[k][f]) lack.push(k + "." + f);
    for (const k of Object.keys(D.PULA)) for (const f of ["tytul", "spotkanie", "skad", "glos", "okrzyki"]) if (!TX.pula[k] || !TX.pula[k][f]) lack.push("pula." + k + "." + f);
    for (const [k, p] of Object.entries(D.PULA)) if (p.przysluga && !(TX.pula[k].przysluga && TX.pula[k].przysluga.etykieta)) lack.push("pula." + k + ".przysluga");
    t.check("words: each of the cast has its name, title, line off the ferry, first meeting, where from, voice, calls and farewell; each kind of the pool its own; the Company's four names",
        !lack.length && ["kompania_1", "kompania_2", "kompania_3", "kompania_4"].every(k => TX.obsada[k] && TX.obsada[k].imie), lack);
    t.check("words: the war's news of every stage, the names of the pool (men and women)",
        ["etap1", "etap2", "etap3", "akt2", "akt3"].every(e => (TX.wiesci[e] || []).length >= 2) && TX.imiona.m.length >= 10 && TX.imiona.k.length >= 8);

    // ================================================================ the calendar of chapter 1
    const fresh = seed => ({ seed: seed || 4242, last: 0, noc: 0, obecni: {}, byli: {}, wizyty: {}, ksiega: {}, pula: {}, sloty: [null, null, null, null],
        renoma: 30, renomaLog: [], utarg: 0, utargTyg: { t: 0, g: 0 }, zlotoProm: {}, poznani: {}, intrygi: {}, widziane: { sceny: {}, historyjki: {} } });
    // a usual game: the hero knows the town and Janek, works shifts, W8 from day 28; the map's places from day 16; W3 not going
    const usual = { miasteczko: () => true, kartograf: d => d >= 16, zmiany: () => true, janek: () => true, w8: d => d >= 28, w3: () => false, pokoj: () => true, akt2: () => false };
    const envOf = (o = {}) => d => Object.assign({ isFerry: L.FERRY, furtka: false, akt2: false, renoma: 30, fala: [10, 25, 37, 52].includes(d), oblezenie: false,
        warunek: (atom, dd) => { const k = atom.split(":")[0]; if (k === "flaga") return false; return usual[k] ? usual[k](dd) : false; }, sprawa: () => false,
        imiona: { m: TX.imiona.m, k: TX.imiona.k } }, o);
    // days from..to: the ferry planned at 6:00, the leaving at 15:00 (the planning's own "leaving today" ones go then)
    function play(s, from, to, env) {
        const log = [], bad = [];
        for (let d = from; d <= to; d++) {
            if (L.FERRY(d) && s.last < d) {
                s.last = d;
                const r = L.planuj(s, d, env(d));
                const groups = Object.keys(s.obecni).length, people = Object.keys(s.obecni);
                log.push({ d, przybyli: r.przybyli.slice(), odplywaja: r.odplywaja.slice(), n: groups - r.odplywaja.length, people });
                // the rules every day: the limit after the leaving, rooms never 1 / 2 / 7 (3 and the Gold suite with the gate only), no room twice
                const lim = L.limitOf(env(d));
                if (groups - r.odplywaja.length > lim) bad.push(d + ": " + (groups - r.odplywaja.length) + " > " + lim);
                const rooms = [];
                for (const [pk, e] of Object.entries(s.obecni)) for (const rr of new Set([e.pokoj].concat(Object.values(e.pokoje || {})))) rooms.push(rr + ":" + pk);
                const only = rooms.map(x => x.split(":")[0]);
                if (only.some(x => x === "1" || x === "2" || x === "7")) bad.push(d + ": a room of the hero / Eryk " + only);
                if (!env(d).furtka && only.some(x => x === "3" || x === "zloty")) bad.push(d + ": room 3 / zloty without the gate");
                if (new Set(only).size !== only.length) bad.push(d + ": a room twice " + rooms);
                if (r.przybyli.length > D.NOWYCH_NA_PROM) bad.push(d + ": " + r.przybyli.length + " new");
            }
            for (const [pk, e] of Object.entries(s.obecni)) if (e.do <= d) L.zwolnij(s, pk, d);
        }
        return { log, bad };
    }
    const s1 = fresh(4242), env1 = envOf(), run1 = play(s1, 1, 61, env1);
    const firstDay = k => { const x = run1.log.find(l => l.przybyli.includes(k)); return x ? x.d : null; };
    const when = Object.fromEntries(D.OBSADA.map(c => [c.key, firstDay(c.key)]));
    t.eq("chapter 1, a usual game: the cast comes as the doc's timeline - Tobiasz 4, Konstanty 7, Zenon 10, Gaspar 13, Teofil and Ksenia 16, Augustyn 19, Urszula 22, Tymon 25, Szczerba and the Company 28, Jędrek 31, Erazm 34, Albin 37; the gated (poseł, room three) never",
        when, { tobiasz: 4, medyk: 7, zboze: 10, relikwie: 13, kartograf: 16, ksenia: 16, wizytator: 19, urszula: 22, dezerter: 25, lowczyni: 28, kompania: 28, grajek: 31, poborca: 34, pielgrzym: 37, posel: null, trojka: null });
    t.check("chapter 1: never more than 4 on the island (a group one place), 1-3 new a ferry, rooms never 1, 2, 3, 7 or the Gold suite, no room twice", !run1.bad.length, run1.bad.slice(0, 6));
    const stays = Object.fromEntries(["tobiasz", "medyk", "relikwie", "dezerter", "grajek", "urszula"].map(k => [k, (s1.byli[k] || []).map(v => v.od + "-" + v.do)]));
    t.eq("stays: Tobiasz one ferry and back every 9-12 days (4-7, 13-16, 25-28, 37-40, 46-49, 55-58), Konstanty 7-13 and back with the 4th wave (52-58), Gaspar 13-25, Tymon 25-37, Jędrek 31-43, Urszula 22-31",
        stays, { tobiasz: ["4-7", "13-16", "25-28", "37-40", "46-49", "55-58"], medyk: ["7-13", "52-58"], relikwie: ["13-25"], dezerter: ["25-37"], grajek: ["31-43"], urszula: ["22-31"] });
    const counts = run1.log.map(l => l.n), new3 = run1.log.filter(l => l.przybyli.length >= 1).length;
    // (day 40 has 3: the envoy and his guard wait for TavernLife's gate - the Gold suite, stage 5)
    t.check("every ferry of chapter 1 brings someone (" + new3 + " of " + run1.log.length + "), the island 4 full in the densest days (19-22, 28-34, 37, 43)",
        new3 >= run1.log.length - 3 && [19, 22, 28, 31, 34, 37, 43].every(d => (run1.log.find(l => l.d === d) || {}).n === 4), run1.log.map(l => l.d + ":" + l.n + "(" + l.przybyli.join(",") + ")").join(" "));
    // the pool is the seed's
    const run1b = play(fresh(4242), 1, 61, env1), poolOf = r => r.log.map(l => l.przybyli.filter(p => /^p/.test(p)).length).join("");
    const s2 = fresh(777), run2 = play(s2, 1, 61, env1);
    t.check("the pool: the same seed - the very same people (kinds, names, bodies, rooms); another seed - others",
        JSON.stringify(s1.pula) === JSON.stringify(fresh(4242).pula) || (JSON.stringify(run1.log) === JSON.stringify(run1b.log) && JSON.stringify(s2.pula) !== JSON.stringify(s1.pula)),
        { a: poolOf(run1), b: poolOf(run1b), c: poolOf(run2) });
    const waveNew = run1.log.filter(l => [10, 25, 37, 52].includes(l.d)).map(l => l.przybyli.filter(p => /^p/.test(p)).length);
    t.check("a wave day: the pool one fewer (the wave is a crowd anyway) - at most one of the pool on 10, 25, 37, 52", waveNew.every(n => n <= 1), waveNew);
    const pooled = Object.values(s1.obecni).concat([]).filter(e => e.pula);
    t.check("a person of the pool: a kind, a name, a body of its kind, a room 4-24, a stay of 1-2 ferries", pooled.every(e => D.PULA[e.pula] && e.imie && D.CIALA[D.PULA[e.pula].cialo].includes(e.arkusz) && D.POKOJE[e.pokoj] && [3, 6].includes(e.do - e.od)),
        pooled);

    // ================================================================ an older save, renown, the siege, the gate
    const old = fresh(99);
    old.last = 40;   // (loaded on day 40: nobody "backwards")
    const runOld = play(old, 40, 61, env1);
    const castOld = runOld.log.map(l => l.d + ":" + l.przybyli.filter(p => !/^p/.test(p)).join(","));
    // (the late ones: a first visit whose latest day has passed - a return within its window is no late one: Konstanty's on 55)
    const firstOd = k => (old.byli[k] && old.byli[k][0] ? old.byli[k][0].od : old.obecni[k] ? old.obecni[k].od : null);
    const late = runOld.log.map(l => l.przybyli.filter(p => { const c = D.OBSADA.find(x => x.key === p); return !!c && firstOd(p) === l.d && c.wizyty[0].do !== undefined && l.d > c.wizyty[0].do; }));
    t.check("an older save loaded on day 40: nobody on day 40 itself; then the late ones of the cast one a ferry, in the table's order (Tobiasz, Konstanty, Zenon...)",
        !runOld.log.some(l => l.d === 40) && late.every(x => x.length <= 1) && late.filter(x => x.length).map(x => x[0]).slice(0, 3).join(",") === "tobiasz,medyk,zboze", castOld);
    const rich = play(fresh(4242), 1, 61, envOf({ renoma: 60 }));
    t.check("renown 60: 5 on the island at once in the dense days (the limit 5)", rich.log.some(l => l.n === 5) && !rich.bad.length, rich.log.map(l => l.d + ":" + l.n).join(" "));
    const sg = fresh(5);
    play(sg, 1, 30, env1);
    const before = JSON.stringify(sg.obecni);
    sg.last = 30;
    const rs = L.planuj(sg, 31, envOf({ oblezenie: true })(31));
    t.check("the siege's night (Act III): nobody comes, nobody goes", !rs.przybyli.length && !rs.odplywaja.length && JSON.stringify(sg.obecni) === before);
    const gated = play(fresh(4242), 1, 61, envOf({ furtka: true }));
    const tro = gated.log.find(l => l.przybyli.includes("trojka")), pos = gated.log.find(l => l.przybyli.includes("posel"));
    t.check("with TavernLife's gate (stage 3): the guest of room three comes (46-52) into room 3, the envoy (40-43) with Albin on the island into the Gold suite",
        !!tro && tro.d >= 46 && tro.d <= 52 && !!pos && pos.d >= 40 && pos.d <= 43, { tro, pos });

    // ================================================================ the rooms
    const taken = new Set(["22", "7"]);
    t.eq("a room: its own when free; taken - the nearest of its kind (22: 2-os. -> 24); 1 and 2 never; 3 only with the gate", [
        L.pokojDla(23, new Set(["7"])), L.pokojDla(22, taken), L.pokojDla(1, taken), L.pokojDla(2, taken), L.pokojDla(3, taken), L.pokojDla(3, taken, { furtka: true })], ["23", "24", null, null, null, "3"]);

    // ================================================================ the day's plans (the residents' getters with a state of the game)
    const S = P.stan();
    Object.assign(S, fresh(4242), { last: 25 });
    sys._d = 25; sys._h = 9;
    S.obecni.dezerter = { od: 25, do: 37, pokoj: "5", wizyta: 1, miejsce: 4 };
    S.obecni.urszula = { od: 22, do: 31, pokoj: "21", wizyta: 1, miejsce: 6 };
    S.obecni.tobiasz = { od: 22, do: 25, pokoj: "23", wizyta: 1, miejsce: 1 };
    S.ksiega = { 5: "dezerter", 21: "urszula", 23: "tobiasz" };
    w.Tawerna.emit("load", {});
    const at = (plan, h) => { let e = plan[plan.length - 1]; for (const x of plan) if (x[0] <= h) e = x; return e[1] + " " + (Array.isArray(e[2]) ? e[2].join(">") : e[2]); };
    const pT = P.plan("dezerter"), pU = P.plan("urszula"), pB = P.plan("tobiasz");
    t.eq("the day it comes: away till noon, then the hall (Borgar), then its plan; the day it leaves: the bill at 11, away from noon; a ferry day: Urszula on the pier 9-15",
        [at(pT, 8), at(pT, 12.5), at(pT, 15), at(pB, 10), at(pB, 11.5), at(pB, 13), at(pU, 10), at(pU, 15.5), at(pU, 23.5)],
        ["inside podr_droga", "inside podr_sala", "wander stodola", "patrol ratusz_przed>plac_studnia>kantor_przed>plac_tablica>przed_tawerna", "inside podr_sala", "inside podr_droga",
            "inside podr_przystan", "inside podr_sala", "inside podr_pokoj"]);
    const inside = P.wnetrze("dezerter");
    t.check("indoors without the user's places on Map001: the hall's place is its room upstairs (pokoj_5), the night its room too",
        inside.podr_sala === "pokoj_5" && inside.podr_pokoj === "pokoj_5" && P.mapa("dezerter") === 8 && P.mapa("posel") === -1 && P.jest("dezerter") && !P.jest("posel"), inside);
    P.wstaw({ events: [null, { id: 5, name: "Miejsce: podrozny_4", x: 10, y: 10 }] }, 1);
    t.check("...and with the user's „Miejsce: podrozny_4” on Map001: the hall's place podrozny_4 (read as the map loads)", P.wnetrze("dezerter").podr_sala === "podrozny_4", P.wnetrze("dezerter"));
    t.check("the book's names: the cast with its title, the pool's „gość z lądu” till met", /^Tomek, uchodźca z promu$/.test(P.nazwa("dezerter", true)), P.nazwa("dezerter", true));

    // ================================================================ stage 2: the quests of the first six (the data and their words)
    const def = D.watek.def, Z = def.zadania || {}, R = def.rozmowy || {}, A = def.akcje || {};
    const look = k => k.split(".").reduce((o, x) => (o && typeof o === "object" ? o[x] : undefined), TX);
    const miss = { rozmowy: [], akcje: [], teksty: [] };
    const textKey = k => { if (typeof k === "string" && k.indexOf(":") < 0 && /\./.test(k) && look(k) === undefined) miss.teksty.push(k); };
    // a talk's entries: the keys of its lines, its sub-talks, its script calls, its choices
    function walk(list) {
        for (const e of [].concat(list || [])) {
            if (!e) continue;
            if (typeof e === "string") { textKey(e); continue; }
            if (e.mow) textKey(e.mow);
            if (e.rozmowa && !R[e.rozmowa]) miss.rozmowy.push(e.rozmowa);
            if (e.zrob && !A[e.zrob]) miss.akcje.push(e.zrob);
            if (e.wybor) for (const o of e.wybor) { textKey(o.etykieta); walk(o.tresc); }
            if (e.to) walk(e.to);
            if (e.inaczej) walk(e.inaczej);
        }
    }
    for (const r of Object.values(R)) walk(r);
    for (const q of Object.values(Z)) for (const k of q.kroki || []) for (const e of k.rozmowy || []) walk(e.tresc);
    for (const a of Object.values(A)) for (const x of [].concat(a)) { if (x && x.notatka) textKey(x.notatka); if (x && x.zrob) for (const y of x.zrob) if (y && y.notatka) textKey(y.notatka); }
    t.check("stage 2: 7 quests (K71, K72, D39-D43) in the thread, each with its words (title, offer, a text for every step); every talk, action and text key they name is there",
        ["K71", "K72", "D39", "D40", "D41", "D42", "D43"].every(id => Z[id] && look("zadania." + id + ".title") && look("zadania." + id + ".offer.say") && Z[id].kroki.every((k, i) => look("zadania." + id + ".steps." + i + ".text"))) &&
        !miss.rozmowy.length && !miss.akcje.length && !miss.teksty.length, miss);
    t.check("stage 2: the cast's matters - Tobiasz K71/K72, Konstanty D39, Teofil D40, Jędrek D41, Zenon D42, Urszula D43 (one ferry longer while one goes on)",
        ["tobiasz:K71,K72", "medyk:D39", "kartograf:D40", "grajek:D41", "zboze:D42", "urszula:D43"].every(s => { const [k, z] = s.split(":"); const c = D.OBSADA.find(x => x.key === k); return c && (c.zadania || []).join() === z; }));
    t.check("stage 2: the wall's conversations (I2) of the data have their words; the view points of D40 their names; Teofil's words for every place of the island's map",
        D.PODSLUCH.every(d => Array.isArray(look(d.kwestie)) && look(d.kwestie).length >= 3) && Object.values(D.SPOTS).every(s => !!s.name) &&
        [8, 24, 111, 125, 22, 20, 21, 13, 120, 175, 23, 168, 3, 4, 17, 18, 162, 165, 155, 157, 159].every(id => !!look("d40.karta." + id)));
});
