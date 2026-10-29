//=============================================================================
// Podroznicy.js
//=============================================================================
// The ferry's travellers (docs/PODROZNI.md, stage 1 "the core", 2026-10-28) - the ENGINE; the data: Podroznicy_Data.js, the words:
// js/teksty/podroznicy.txt.
//   - THE FERRY: on a ferry day (TownQuests.isFerry: day 1 and every 3 days) at 6:00 the engine plans it once (the state's `last`):
//     who leaves today (the stay is over; a matter still going: one ferry longer, once), who of the cast comes (the data's windows, in
//     the table's order, while the limit allows - 4 on the island in chapter 1, 5 from renown 60 and in Act II; a group counts as
//     one; 1-3 new a ferry), then 0-2 of the pool (deterministic: the save's seed and the day; on a wave day one fewer). Nobody comes
//     or goes on the night of the siege (Act III). An older save: the day it is loaded counts as planned; the cast whose window has
//     passed come one a ferry, in the table's order.
//   - THE BOOK: rooms 4-24 of the guests' floor (never 1 and 2; 3 and the Gold suite only with TavernLife's gate - stage 3; 7 is Eryk
//     Sowa's): the cast's own room when free, else the nearest of its kind; Borgar's option "Księga gości" (Tawerna.talk.option).
//   - THE DAY: a traveller is a resident of the town (TownLife, ids 3020-3049 - Podroznicy_Data.js): its plan by its profile, "w
//     drodze" till noon on the day it comes and from noon on the day it leaves (the pier 14-15, the ferry at 15:00); in the tavern -
//     the hall's place the user puts on Map001 ("Miejsce: podrozny_1..6", "kompania_1..4", "grajek", "medyk"), else its room upstairs.
//   - RENOWN: Renoma karczmy (0-100, start 30) - the tavern's own fame, apart from the hero's Sława; from 60 the limit is 5. Borgar's
//     takings from the rooms (a night: 8 / 15 / 20 G by the room's kind, a tip on leaving) - only words in the book.
//   - THE HARBOUR: the actors 3002-3008 on Map125 - the arrived on the pier 9-11, the leaving 14-15, Urszula watching the faces;
//     the scene of the landing at 9:00 (the bars, the camera to the pier, the bell and the chain, the ferryman's call, the travellers
//     coming off one by one with a bubble each, the customs officer) - once a ferry; P: the next shot, P held: the end as it would be.
//   - THE TALKS: a traveller's first meeting (Tawerna.talk "meet+5"), its menu ("shop+25": Skąd płyniesz? / wieści z lądu / Co
//     słychać? / the pool's small favour / the other systems' options / Bywaj.).
//   - F9 ("Wyspa i fabuła", the section "Podróżni z promu" - Watki.f9): the next ferry now, a traveller now, everyone off, the book
//     cleared, renown ±10, a new seed, the scene of the landing.
// Bus: prom { dzien, przybyli, odplywaja }, podroznyPrzyplynal { kto }, podroznyOdplynal { kto, sprawa }, renoma { renoma, zmiana, co }.
// API: window.Podroznicy (Tawerna.api("Podroznicy")); Podroznicy.logika - the pure planning (tests/unit/podroznicy.test.js).

/*:
 * @target MZ
 * @plugindesc Podróżni z promu - silnik: planowanie promu, księga pokoi, Renoma karczmy, plany dnia, odpływy i powroty, scena przybycia na przystani, rozmowy, F9. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Podroznicy_Data
 * @orderAfter TownLife
 * @orderAfter TownQuests
 * @orderAfter Przystan
 *
 * @help
 * ============================================================================
 * Podroznicy.js - podróżni z promu (docs/PODROZNI.md)
 * ============================================================================
 * W dzień promu o 6:00 silnik planuje prom: kto odpływa, kto przypływa
 * (obsada z danych, potem 0-2 ludzi z puli), który pokój (4-24). Przybyli
 * są „w drodze” do południa, potem w tawernie u Borgara i według swojego
 * planu dnia w miasteczku. Odpływają promem o 15:00.
 * Księga gości: u Borgara (opcja „Księga gości”) - kto, który pokój, do
 * kiedy, Renoma karczmy, utarg z pokoi.
 * Scena przybycia: przystań, dzień promu, 9:00 (P - następne ujęcie,
 * przytrzymane P - pomiń całą).
 * Miejsca w sali stawia gracz na mapie 1: „Miejsce: podrozny_1” ... „_6”,
 * „kompania_1” ... „_4”, „grajek”, „medyk” - bez nich podróżni są w swoich
 * pokojach na piętrze.
 * F9 → „Wyspa i fabuła” → „Podróżni z promu”.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.PodroznicyData;
    if (!T || !window.Watki || !D) throw new Error("Podroznicy.js: brak TawernaCore.js / Watki.js / Podroznicy_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Podroznicy";
    const w = D.watek, TX = D.TX;
    const fill = Watki.wstaw;
    const C = Watki.mowa.C;
    const AK = { akapity: true };

    // ==================================================================
    // 1. The pure planning (no game: the state, the day and the world given - tests/unit/podroznicy.test.js)
    // ==================================================================
    const FERRY = d => d >= 1 && (d - 1) % 3 === 0;
    const OBSADA_BY = new Map(D.OBSADA.map(c => [c.key, c]));
    // a number from numbers (the pool's choices: the save's seed and the day)
    const mix = (...n) => { let h = 2166136261 >>> 0; for (const x of n) { h = Math.imul(h ^ ((x | 0) >>> 0), 16777619) >>> 0; h ^= h >>> 13; } return h >>> 0; };
    function rng(seed) {
        let a = seed >>> 0;
        return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }
    // the first ferry day from x on
    function naPromie(x, isFerry) {
        const f = isFerry || FERRY;
        for (let d = Math.max(1, x); d < Math.max(1, x) + 12; d++) if (f(d)) return d;
        return x;
    }
    // the day of leaving for a visit begun on day d: doDnia (at least a ferry later) or `promy` ferries
    const wyjazd = (v, d, isFerry) => (v && v.doDnia ? Math.max(v.doDnia, naPromie(d + 3, isFerry)) : naPromie(d + 3 * Math.max(1, (v && v.promy) || 1), isFerry));
    // the day a cast member first came (present on its first visit, or gone), null while never
    function pierwszyPrzyjazd(s, key) {
        const e = s.obecni[key];
        if (e && (e.wizyta || 1) === 1) return e.od;
        const b = s.byli[key];
        return b && b.length ? b[0].od : null;
    }
    // a condition of the data: "a|b" either, "a&b" both, "!x" not; dzien:n, obecny:<key>, byl:<key> - here; the rest the world's
    function warunek(expr, ctx) {
        if (!expr) return true;
        return String(expr).split("|").some(alt => alt.split("&").every(raw => {
            let a = raw.trim(), neg = false;
            while (a[0] === "!") { neg = !neg; a = a.slice(1); }
            let v;
            const i = a.indexOf(":"), kind = i < 0 ? a : a.slice(0, i), arg = i < 0 ? "" : a.slice(i + 1);
            if (kind === "dzien") v = ctx.d >= Number(arg);
            else if (kind === "obecny") v = !!ctx.s.obecni[arg];
            else if (kind === "byl") v = !!(ctx.s.byli[arg] && ctx.s.byli[arg].length);
            else v = !!(ctx.env && ctx.env.warunek && ctx.env.warunek(a, ctx.d));
            return neg ? !v : v;
        }));
    }
    const isHeroRoom = r => D.POKOJE_BOHATERA[r] !== undefined;
    // the rooms taken now: the book's, Eryk Sowa's, the hero's (3 / the Gold suite only for a traveller allowed them)
    function zajete(s) {
        const z = new Set(Object.keys(s.ksiega));
        z.add(String(D.POKOJ_ERYKA));
        return z;
    }
    // a room for a traveller: its own when free; else the nearest free of the same kind, else the nearest free - never the hero's
    // 1 and 2 (3 / zloty: only the very room asked for, with TavernLife's gate - "furtka")
    function pokojDla(pref, taken, env) {
        const p = String(pref === undefined || pref === null ? "" : pref);
        if (p && isHeroRoom(p)) return D.POKOJE_BOHATERA[p] === "furtka" && env && env.furtka && !taken.has(p) ? p : null;
        if (p && D.POKOJE[p] && !taken.has(p)) return p;
        const n = Number(p) || 12, typ = D.POKOJE[p] ? D.POKOJE[p].typ : null;
        const free = Object.keys(D.POKOJE).filter(r => !taken.has(r)).sort((a, b) => Math.abs(a - n) - Math.abs(b - n) || a - b);
        return free.find(r => !typ || D.POKOJE[r].typ === typ) || free[0] || null;
    }
    // the hall's place: the one it likes when free, else the first free of 1..6, else 0 (none: its room)
    function wolneMiejsce(s, pref, bez) {
        const used = new Set(Object.entries(s.obecni).filter(([k]) => k !== bez).map(([, e]) => e.miejsce).filter(Boolean));
        if (pref && !used.has(pref)) return pref;
        for (let i = 1; i <= D.MIEJSCA_W_SALI; i++) if (!used.has(i)) return i;
        return 0;
    }
    const limitOf = env => (env.akt2 || (env.renoma || 0) >= D.LIMIT.renomaProg ? D.LIMIT.renoma : D.LIMIT.rozdzial);
    // into the book: the entry and its rooms (a group: each member's room - their rooms in the book once)
    function przyjmij(s, pk, e) {
        s.obecni[pk] = e;
        for (const r of new Set([e.pokoj].concat(Object.values(e.pokoje || {})).filter(Boolean))) s.ksiega[r] = pk;
    }
    const poolCount = (s, bez) => Object.entries(s.obecni).filter(([k, e]) => e.pula && !(bez && bez.has(k))).length;
    // the plan of the ferry of day d (the state changed in place) -> { przybyli: [pk], odplywaja: [pk], zostaja: [pk] }.
    // env: { isFerry, furtka, akt2, renoma, fala, oblezenie, warunek(atom, d), sprawa(pk), imiona: { m: [], k: [] } }
    function planuj(s, d, env) {
        const out = { przybyli: [], odplywaja: [], zostaja: [] };
        if (env.oblezenie) return out;   // (the siege's night: nobody comes, nobody goes)
        const isF = env.isFerry || FERRY;
        // 1. who leaves today; a matter still going - a ferry longer, once
        for (const [pk, e] of Object.entries(s.obecni)) {
            if (e.do > d) continue;
            if (!e.zostal && env.sprawa && env.sprawa(pk)) { e.do = naPromie(d + 3, isF); e.zostal = 1; out.zostaja.push(pk); continue; }
            out.odplywaja.push(pk);
        }
        const leaving = new Set(out.odplywaja);
        let cap = limitOf(env) - Object.keys(s.obecni).filter(k => !leaving.has(k)).length, nowi = 0;
        const taken = zajete(s);
        const ctx = { s, d, env };
        // 2. the cast, in the table's order
        let zalegly = false;
        for (const c of D.OBSADA) {
            if (nowi >= D.NOWYCH_NA_PROM || cap <= 0) break;
            if (s.obecni[c.key]) continue;
            const i = s.wizyty[c.key] || 0, v = c.wizyty[i];
            if (!v) continue;
            const first = i === 0;
            if ((c.wymaga || v.wymaga) === "furtka" && !env.furtka) continue;
            let od = v.od;
            if (v.po) { const p = pierwszyPrzyjazd(s, v.po.kto); od = p === null ? null : p + v.po.dni; }
            const forced = first && v.do !== undefined && d >= v.do;
            if (od === null ? !forced : d < od) continue;
            if (!first && v.do !== undefined && d > v.do) { s.wizyty[c.key] = i + 1; continue; }   // (a return's window gone: skipped)
            const overdue = first && v.do !== undefined && d > v.do;
            if (!forced && v.gdy && !warunek(v.gdy, ctx)) continue;
            if (overdue && zalegly) continue;   // (an older save: the late ones come one a ferry)
            let pokoj = null, pokoje = null;
            if (c.grupa) {
                const want = Array.from(new Set(c.pokoje.map(String))), got = {};
                const t2 = new Set(taken);
                for (const r of want) { const a = pokojDla(r, t2, env); if (!a) { got.brak = true; break; } got[r] = a; t2.add(a); }
                if (got.brak) continue;
                pokoje = {};
                c.grupa.forEach((m, k) => { pokoje[m] = got[String(c.pokoje[k])]; });
                pokoj = got[want[0]];
            } else {
                pokoj = pokojDla(c.pokoj, taken, env);
                if (!pokoj) continue;
            }
            const e = { od: d, do: wyjazd(v, d, isF), pokoj, wizyta: i + 1, miejsce: c.grupa ? 0 : wolneMiejsce(s, c.miejsce) };
            if (pokoje) e.pokoje = pokoje;
            przyjmij(s, c.key, e);
            for (const r of [pokoj].concat(Object.values(pokoje || {}))) taken.add(r);
            s.wizyty[c.key] = i + 1;
            if (overdue) zalegly = true;
            nowi++; cap--;
            out.przybyli.push(c.key);
        }
        // 3. the pool: 0-2 (Act II 1-2; at least one when the cast brought nobody - not on a wave day: one fewer then)
        const r = rng(mix(s.seed || 1, d, 7));
        let k = env.akt2 ? 1 + (r() < 0.5 ? 1 : 0) : (x => (x < 0.4 ? 0 : x < 0.8 ? 1 : 2))(r());
        if (!nowi && !env.fala) k = Math.max(1, k);
        if (env.fala) k = Math.max(0, k - 1);
        k = Math.min(k, D.PULA_NA_PROM, Math.max(0, cap), D.NOWYCH_NA_PROM - nowi, D.SLOTY_PULI.length - poolCount(s));
        const here = new Set(Object.values(s.obecni).filter(e => e.pula).map(e => e.pula));
        const names = new Set(Object.values(s.obecni).filter(e => e.imie).map(e => e.imie));
        const sheets = new Set(Object.values(s.obecni).filter(e => e.arkusz).map(e => e.arkusz));
        const typy = [];
        for (let j = 0; j < k; j++) {
            const pool = Object.keys(D.PULA).filter(t => !here.has(t) && !typy.includes(t));
            if (!pool.length) break;
            const wt = t => (D.PULA[t].zamozny && (env.renoma || 0) >= D.LIMIT.renomaProg ? 2 : 1);
            let x = r() * pool.reduce((a, t) => a + wt(t), 0), typ = pool[pool.length - 1];
            for (const t of pool) { x -= wt(t); if (x < 0) { typ = t; break; } }
            const P = D.PULA[typ], list = (env.imiona && env.imiona[P.kobieta ? "k" : "m"]) || [];
            const freeNames = list.filter(n => !names.has(n)), imie = (freeNames.length ? freeNames : list)[Math.floor(r() * Math.max(1, (freeNames.length ? freeNames : list).length))] || "";
            const bodies = D.CIALA[P.cialo], freeB = bodies.filter(b => !sheets.has(b)), arkusz = (freeB.length ? freeB : bodies)[Math.floor(r() * (freeB.length ? freeB : bodies).length)];
            const promy = D.POBYT_PULI[Math.floor(r() * D.POBYT_PULI.length)];
            const rooms = Object.keys(D.POKOJE).filter(n => !taken.has(n));
            if (!rooms.length) break;
            const pokoj = rooms[Math.floor(r() * rooms.length)];
            const pk = "p" + d + "_" + j;
            przyjmij(s, pk, { od: d, do: naPromie(d + 3 * promy, isF), pokoj, wizyta: 1, miejsce: wolneMiejsce(s, 0), pula: typ, imie, arkusz, kobieta: !!P.kobieta });
            taken.add(pokoj); names.add(imie); sheets.add(arkusz);
            typy.push(typ);
            out.przybyli.push(pk);
            nowi++; cap--;
        }
        if (typy.length) {
            s.pula[d] = typy;
            const days = Object.keys(s.pula).map(Number).sort((a, b) => a - b);
            while (days.length > 12) delete s.pula[days.shift()];
        }
        return out;
    }
    // a traveller off the island (the ferry, F9): the book freed, the cast's visit kept (byli), its pool place free; -> its entry
    function zwolnij(s, pk, d) {
        const e = s.obecni[pk];
        if (!e) return null;
        delete s.obecni[pk];
        for (const [r, who] of Object.entries(s.ksiega)) if (who === pk) delete s.ksiega[r];
        if (OBSADA_BY.get(pk)) (s.byli[pk] = s.byli[pk] || []).push({ od: e.od, do: Math.min(e.do, d) });
        const i = s.sloty ? s.sloty.indexOf(pk) : -1;
        if (i >= 0) s.sloty[i] = null;
        return e;
    }
    const logika = { planuj, zwolnij, pokojDla, wolneMiejsce, wyjazd, naPromie, warunek, rng, mix, limitOf, FERRY };

    // ==================================================================
    // 2. The game: the state, the world's conditions, the ferry's day
    // ==================================================================
    const S = () => w.S();
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem;
    const TQ = () => T.api("TownQuests"), TL = () => T.api("TownLife");
    const isFerry = d => { const q = TQ(); try { return q && q.isFerry ? !!q.isFerry(d) : FERRY(d); } catch (e) { return FERRY(d); } };
    const WAVES = [10, 25, 37, 52];
    const waves = () => { const q = TQ(); return q && q.waves ? q.waves() : WAVES; };
    let rev = 1, cache = null;
    const bump = () => { rev++; cache = null; };
    // a cache for the residents' getters (asked every frame): made again when the state or the day changes
    function memo(key, make) {
        const d = has() ? day() : 0;
        if (!cache || cache.rev !== rev || cache.d !== d) cache = { rev, d, v: new Map() };
        if (!cache.v.has(key)) cache.v.set(key, make());
        return cache.v.get(key);
    }
    const flags = () => { const q = TQ(); try { return (q && q.state && q.state().flags) || {}; } catch (e) { return {}; } };
    const qrec = id => { const q = TQ(); try { return q && q.rec ? q.rec(id) : null; } catch (e) { return null; } };
    const stateIf = key => (T.state.spec(key) ? T.state(key) : null);   // (another plugin's state - never made here)
    function aktII() {
        const St = T.api("Story");
        try { return !!(St && St.active && St.active() && (St.chapterEnded ? St.chapterEnded() : !!(St.state() || {}).done)); } catch (e) { return false; }
    }
    function oblezenie() { const A = T.api("Act3"); try { return !!(A && A.phase && A.phase() === "siege"); } catch (e) { return false; } }
    function znaneMiejsca() {
        const M = T.api("MapaWyspy");
        try { return M && M.nodes ? M.nodes().filter(n => n.state === "known").length : 0; } catch (e) { return 0; }
    }
    function byl(mapId) {
        const M = T.api("MapaWyspy");
        try { if (M && M.discovered && M.discovered(mapId)) return true; } catch (e) { /* (no map) */ }
        const v = stateIf("nazwaMapy");
        return !!(v && v.odw && v.odw[mapId]) || (!!window.$gameMap && $gameMap.mapId() === mapId);
    }
    // the world's conditions of the data (the rest - dzien, obecny, byl - the planning knows itself)
    function warunekGry(atom, d) {
        const i = atom.indexOf(":"), kind = i < 0 ? atom : atom.slice(0, i), arg = i < 0 ? "" : atom.slice(i + 1);
        switch (kind) {
            case "miasteczko": return byl(8);
            case "kartograf": { const n = znaneMiejsca(); return (d >= 16 && n >= 6) || n >= 10; }
            case "zmiany": { const s = stateIf("tavernShift"); return !!s && (s.done || 0) >= Number(arg || 1); }
            case "janek": return !!flags().janekMet;
            case "w8": return !!qrec("W8");
            case "w3": { const r = qrec("W3"); return !!r && r.s === "active"; }
            case "pokoj": { const s = stateIf("tavernLife"); return !!s && (s.rooms || 0) > 0; }
            case "akt2": return aktII();
            case "flaga": return !!flags()[arg];
            default: console.error("[Podroznicy] nie znam warunku „" + atom + "”"); return false;
        }
    }
    // a matter of a cast member going on (its quests - the data's zadania, stage 2)
    function sprawa(pk) {
        const c = OBSADA_BY.get(pk);
        return !!c && (c.zadania || []).some(id => { const r = qrec(id); return !!r && r.s === "active"; });
    }
    const furtka = () => { const TLf = T.api("TavernLife"); return !!(TLf && typeof TLf.addRoomGuard === "function"); };
    const listOf = v => (Array.isArray(v) ? v : v ? [v] : []);
    function srodowisko(d) {
        return { isFerry, furtka: furtka(), akt2: aktII(), renoma: S().renoma, fala: waves().includes(d), oblezenie: oblezenie(),
            warunek: warunekGry, sprawa, imiona: { m: listOf(TX.imiona && TX.imiona.m), k: listOf(TX.imiona && TX.imiona.k) } };
    }

    // ------------------------------------------------------------------ who is who: the residents' keys -> the book's
    const GRUPA = {};
    for (const c of D.OBSADA) if (c.grupa) c.grupa.forEach((m, i) => { GRUPA[m] = { g: c.key, i }; });
    const SLOT = {};
    D.SLOTY_PULI.forEach((s, i) => { SLOT[s.key] = i; });
    const RES_KEYS = new Set(D.RESIDENTS.map(r => r.key));
    // the person (the book's key) behind a resident: the cast's own key, a group's key, the pool's person in that place
    function osoba(resKey) {
        if (!has()) return null;
        if (SLOT[resKey] !== undefined) return S().sloty[SLOT[resKey]] || null;
        if (GRUPA[resKey]) return GRUPA[resKey].g;
        return OBSADA_BY.has(resKey) ? resKey : null;
    }
    // the resident of a person (for a talk on the harbour): the cast's key, a group's members, the pool's place
    function rezydenci(pk) {
        const c = OBSADA_BY.get(pk);
        if (c) return c.grupa ? c.grupa.slice() : [pk];
        const i = has() ? S().sloty.indexOf(pk) : -1;
        return i >= 0 ? [D.SLOTY_PULI[i].key] : [];
    }
    const wpis = pk => (pk && has() ? S().obecni[pk] || null : null);

    // ------------------------------------------------------------------ the words
    const tx = key => w.tekst(key);
    const txm = key => w.tekstMoze(key);
    const one = v => (Array.isArray(v) ? v[0] || "" : v || "");
    function slowa(resKey, field) {
        const pk = osoba(resKey), e = wpis(pk);
        if (SLOT[resKey] !== undefined) return e && e.pula ? txm("pula." + e.pula + "." + field) : null;
        if (GRUPA[resKey]) return txm("obsada." + resKey + "." + field) || txm("obsada." + GRUPA[resKey].g + "." + field);
        return txm("obsada." + resKey + "." + field);
    }
    function imie(resKey) {
        if (SLOT[resKey] !== undefined) { const e = wpis(osoba(resKey)); return e ? e.imie || "" : ""; }
        return one(slowa(resKey, "imie"));
    }
    const tytul = resKey => one(slowa(resKey, "tytul"));
    function arkusz(resKey) {
        if (SLOT[resKey] !== undefined) { const e = wpis(osoba(resKey)); return e && e.arkusz ? e.arkusz : D.CIALA.m[0]; }
        if (D.CZLONKOWIE[resKey]) return D.CZLONKOWIE[resKey].arkusz;
        const c = OBSADA_BY.get(resKey);
        return c ? c.arkusz : D.CIALA.m[0];
    }
    // a person's name for the book and the notices (the pool's: "Gerwazy, flisak z lądu" once met, else "gość z lądu")
    function nazwa(pk, ksiega) {
        const e = wpis(pk), c = OBSADA_BY.get(pk);
        if (c && c.grupa) return (txm("obsada." + pk + ".imie") || txm("obsada." + pk + ".tytul") || pk) + (c.grupa.length > 2 ? " (" + c.grupa.length + ")" : "");
        if (c) { const n = txm("obsada." + pk + ".imie") || pk, t = txm("obsada." + pk + ".tytul"); return ksiega && t ? n + ", " + t : n; }
        if (e && e.pula) {
            if (ksiega && !S().poznani[pk]) return txm("ksiega.gosc") || "";
            const t = txm("pula." + e.pula + ".tytul");
            return ksiega && t ? e.imie + ", " + t : e.imie;
        }
        return pk;
    }

    // ------------------------------------------------------------------ the residents' getters (Podroznicy_Data.js): cheap, cached
    // a present traveller lives in the town; one that may come with the next ferry too (its event is made with the map - TownLife
    // makes a resident's event only when the map loads); everyone else: no map, no event
    function kandydat(pk) {
        return memo("k:" + pk, () => {
            const c = OBSADA_BY.get(pk), s = S();
            if (!c) return false;
            const v = c.wizyty[s.wizyty[pk] || 0];
            if (!v || ((c.wymaga || v.wymaga) === "furtka" && !furtka())) return false;
            let od = v.od;
            if (v.po) { const p = pierwszyPrzyjazd(s, v.po.kto); od = p === null ? null : p + v.po.dni; }
            const next = naPromie(day() + 1, isFerry);   // (the ferry after today - today's too, if not planned yet: its window is earlier)
            return (od !== null && od <= next) || (v.do !== undefined && v.do <= next);
        });
    }
    const jest = resKey => !!wpis(osoba(resKey));
    // (a place of the pool with nobody in it: in the town only while a ferry's planning is near - tonight or today - so that whoever
    // comes has an event there; else no event: Map008 is the heaviest map)
    const planSoon = () => { const d = day(), s = S(); return s.last === null || s.last === undefined || (isFerry(d) && s.last < d) || (isFerry(d + 1) && hour() >= 12); };
    function mapa(resKey) {
        if (!has()) return 8;
        if (SLOT[resKey] !== undefined) return osoba(resKey) || planSoon() ? 8 : -1;
        const pk = osoba(resKey);
        return wpis(pk) || kandydat(pk) ? 8 : -1;
    }
    // the day's plan (docs/PODROZNI.md 1.4): the profile's base; the day it comes - away till noon; the day it leaves - the bill at
    // 11, away from noon; a ferry day for who watches the pier - away 9-15
    const baza = D.baza;   // (Podroznicy_Data.js: the profile's ordinary day)
    const activeAt = (plan, h) => { let e = plan[plan.length - 1]; for (const x of plan) if (x[0] <= h) e = x; return e; };
    function nakladka(plan, from, to, entries) {
        const at = activeAt(plan, to);
        return plan.filter(e => e[0] < from).concat(entries, [[to, at[1], at[2]]], plan.filter(e => e[0] > to));
    }
    const PLAN_BRAK = [[0, "inside", "podr_droga"]];
    function profilOf(pk) {
        const c = OBSADA_BY.get(pk), e = wpis(pk);
        if (c) return c.profil;
        return e && e.pula ? D.PULA[e.pula].profil : "zwykly";
    }
    function plan(resKey) {
        const pk = osoba(resKey), e = wpis(pk);
        if (!e) return PLAN_BRAK;
        const d = day(), c = OBSADA_BY.get(pk);
        const kind = e.f9 && e.od === d ? "zwykly" : e.od === d ? "przyjazd" : e.do === d ? "odjazd" : c && c.przystan && isFerry(d) ? "przystan" : "zwykly";
        const prof = profilOf(pk);
        return memo("p:" + prof + ":" + kind, () => {
            const b = baza(D.PLANY[prof] || D.PLANY.zwykly);
            if (kind === "przyjazd") return [[0, "inside", "podr_droga"]].concat(b.filter(x => x[0] >= D.GODZINY.sala));
            if (kind === "odjazd") return b.filter(x => x[0] < D.GODZINY.rachunek).concat([[D.GODZINY.rachunek, "inside", "podr_sala"], [D.GODZINY.wDrodze, "inside", "podr_droga"]]);
            if (kind === "przystan") return nakladka(b, D.GODZINY.przybija, D.GODZINY.odplywa, [[D.GODZINY.przybija, "inside", "podr_przystan"]]);
            return b;
        });
    }
    // the places indoors: podr_sala - the hall's place of the user (Map001), else the room; podr_pokoj - the room upstairs (Map025:
    // "pokoj_<n>", the second of two in one room "pokoj_<n>_2"); podr_medyk / podr_grajek - their own places in the hall
    let znaczniki = new Set(), znaczniki01 = false, znaczPytane = false;
    const salaMa = name => znaczniki.has(name);
    function wnetrze(resKey) {
        const pk = osoba(resKey);
        let e = wpis(pk);
        const c = pk ? OBSADA_BY.get(pk) : null;
        if (!e && !(c && kandydat(pk))) return PUSTE;
        return memo("w:" + resKey + ":" + (e ? "o" : "k"), () => {
            const g = GRUPA[resKey];
            let room;
            if (e) room = g && e.pokoje ? e.pokoje[resKey] : e.pokoj;
            else room = g ? c.pokoje[g.i] : c.pokoj;   // (a candidate: its own room - placeIndoor moves it once the book says another)
            const second = g && g.i % 2 === 1;
            const pokoj = room && D.POKOJE[room] ? "pokoj_" + room + (second ? "_2" : "") : "";
            const seat = e ? e.miejsce : c && c.miejsce;
            let sala = pokoj;
            if (g && salaMa(resKey)) sala = resKey;   // (the Company: kompania_1..4)
            else if (seat && salaMa("podrozny_" + seat)) sala = "podrozny_" + seat;
            return { podr_sala: sala, podr_pokoj: pokoj, podr_medyk: salaMa("medyk") ? "medyk" : sala, podr_grajek: salaMa("grajek") ? "grajek" : sala };
        });
    }
    const PUSTE = Object.freeze({});
    function okrzyki(resKey) {
        const pk = osoba(resKey);
        if (!pk) return PUSTE;
        return memo("o:" + resKey + ":" + pk, () => {
            const L = listOf(slowa(resKey, "okrzyki"));
            return { wander: L, stand: L, patrol: L, work: L, home: L, tavern: L, night: [], rain: [] };
        });
    }
    function mowa(resKey) {
        const pk = osoba(resKey);
        if (!pk) return PUSTE;
        return memo("m:" + resKey + ":" + pk, () => { const L = listOf(slowa(resKey, "glos")); return { morning: L, day: L, evening: L, night: L, rain: L }; });
    }

    // ------------------------------------------------------------------ the ferry's day: the nights, the leaving, the planning
    function sync() {
        if (!has()) return false;
        const s = S(), d = day(), h = hour();
        let changed = false;
        if (!s.seed) { s.seed = 1 + Math.floor(Math.random() * 2147483000); changed = true; }
        if (s.last === null || s.last === undefined) { s.last = d; changed = true; }   // (an older save: nobody arrives "backwards")
        // the nights slept: Borgar's takings (each traveller who slept here the night before the day)
        if (!s.noc) s.noc = d;
        else if (s.noc < d) {
            for (let n = s.noc + 1; n <= d; n++) for (const e of Object.values(s.obecni)) if (e.od < n && e.do >= n) utarg(cena(e), n);
            s.noc = d;
        }
        // the leaving: the ferry at 15:00 on the day (or a day jumped over); a matter going on - a ferry longer, once
        for (const [pk, e] of Object.entries(s.obecni)) {
            if (!(e.do < d || (e.do === d && h >= D.GODZINY.odplywa))) continue;
            if (!e.zostal && sprawa(pk)) { e.do = naPromie(Math.max(d, e.do) + 3, isFerry); e.zostal = 1; zostaje(pk); changed = true; continue; }
            odplyn(pk, "prom");
            changed = true;
        }
        // the ferry of today, planned once (from 6:00)
        if (isFerry(d) && s.last < d && h >= D.GODZINY.plan) { planujDzis(); changed = true; }
        if (sloty()) changed = true;
        if (changed) bump();
        if (!znaczniki01) pytajZnaczniki();
        return changed;
    }
    function planujDzis() {
        const s = S(), d = day();
        s.last = d;
        const res = planuj(s, d, srodowisko(d));
        for (const pk of res.zostaja) zostaje(pk);
        sloty();
        bump();
        for (const pk of res.przybyli) T.emit("podroznyPrzyplynal", { kto: pk, dzien: d });
        T.emit("prom", { dzien: d, przybyli: res.przybyli.slice(), odplywaja: res.odplywaja.slice() });
        return res;
    }
    function zostaje(pk) {
        const e = wpis(pk);
        if (!e) return;
        T.popup(fill(tx("napis.zostaje"), { imie: nazwa(pk), dzien: e.do }), { top: true, color: "#ffe27a", sub: txm("napis.zostajePod") || "" });
    }
    const cena = e => (e && D.POKOJE[e.pokoj] ? D.CENY[D.POKOJE[e.pokoj].typ] || 0 : 0) * (e && e.pokoje ? new Set(Object.values(e.pokoje)).size : 1);
    function utarg(n, d) {
        if (!(n > 0)) return;
        const s = S(), t = Math.floor(((d || day()) - 1) / 7);
        s.utarg += n;
        if (s.utargTyg.t !== t) s.utargTyg = { t, g: 0 };
        s.utargTyg.g += n;
    }
    // gone with the ferry (or F9): the book freed, the visit kept; a tip for Borgar; a matter left - the renown down and a note
    function odplyn(pk, how) {
        const s = S(), left = how === "prom" && sprawa(pk), e = zwolnij(s, pk, day());
        if (!e) return false;
        const c = OBSADA_BY.get(pk);
        if (how === "prom") utarg(1 + (mix(s.seed, e.od, e.pokoj | 0) % 3));
        if (left) {
            renoma(D.RENOMA.bezKonca, "bezKonca:" + pk);
            const p = tx("notatka.bezKonca");
            if (Array.isArray(p)) T.call("Journal", "addNote", p[0], fill(p[1], { imie: nazwa(pk), odplynal: tx("odplynal." + (c && c.kobieta ? "k" : "m")) }));
            const q = TQ();
            for (const id of (c && c.zadania) || []) { const r = qrec(id); if (r && r.s === "active" && q && q.fail) { try { q.fail(id); } catch (er) { console.error("[Podroznicy]", er); } } }
        }
        bump();
        T.emit("podroznyOdplynal", { kto: pk, sprawa: left, jak: how });
        return true;
    }
    // the pool's people get a place among the four residents of the pool (3038-3041); a new one - its sheet and name on the live event
    function sloty() {
        const s = S();
        let changed = false;
        for (let i = 0; i < s.sloty.length; i++) if (s.sloty[i] && !s.obecni[s.sloty[i]]) { s.sloty[i] = null; changed = true; }
        for (const [pk, e] of Object.entries(s.obecni)) {
            if (!e.pula || s.sloty.includes(pk)) continue;
            const i = s.sloty.indexOf(null);
            if (i < 0) break;
            s.sloty[i] = pk;
            changed = true;
        }
        if (changed && window.$gameMap) {
            bump();
            const L = TL();
            for (const sl of D.SLOTY_PULI) {
                const ev = L && L.eventOf ? L.eventOf(sl.key) : null;
                if (!ev) continue;
                const want = arkusz(sl.key);
                if (ev.characterName() !== want) ev.setImage(want, 0);
                const de = ev.event();
                if (de) de.name = imie(sl.key) + " (" + tytul(sl.key) + ")";
            }
        }
        return changed;
    }
    // the renown of the tavern: 0-100, its log; -> the renown now
    function renoma(delta, why) {
        const s = S();
        if (!delta) return s.renoma;
        const before = s.renoma;
        s.renoma = Math.max(D.RENOMA.min, Math.min(D.RENOMA.max, Math.round(s.renoma + delta)));
        const n = s.renoma - before;
        if (n) {
            s.renomaLog.push({ d: day(), n, co: String(why || "") });
            while (s.renomaLog.length > D.RENOMA.log) s.renomaLog.shift();
            T.popup(fill(tx("renoma.zmiana"), { zmiana: (n > 0 ? "+" : "") + n }), { top: true, color: n > 0 ? "#9ff0a8" : "#ffb4a0" });
            bump();
            T.emit("renoma", { renoma: s.renoma, zmiana: n, co: why || "" });
        }
        return s.renoma;
    }
    const opisRenomy = r => txm("renoma.opis." + (D.RENOMA.opisy.find(p => r >= p) || 0)) || "";
    // the hall's places of the user on Map001 (its data as it loads - Podroznicy_Data's injector comes before TownLife's; else read
    // once from the file, for a game loaded upstairs)
    function skanuj(events) {
        const out = new Set();
        for (const e of events || []) { const m = e && /^Miejsce:\s*(\S+)/i.exec(e.name || ""); if (m) out.add(m[1]); }
        return out;
    }
    function pytajZnaczniki() {
        if (znaczPytane || znaczniki01 || typeof XMLHttpRequest === "undefined") return;
        znaczPytane = true;
        try {
            const x = new XMLHttpRequest();
            x.open("GET", "data/Map001.json");
            x.overrideMimeType("application/json");
            x.onload = () => { if (x.status < 400 && !znaczniki01) { try { znaczniki = skanuj(JSON.parse(x.responseText).events); znaczniki01 = true; bump(); } catch (e) { /* (kept empty) */ } } };
            x.send();
        } catch (e) { /* (no file: the rooms) */ }
    }

    // ==================================================================
    // 3. The harbour: the actors (3002-3008) and the scene of the landing
    // ==================================================================
    const SC = D.SCENA, AKT0 = D.IDS.aktorzy[0], AKT_N = D.IDS.aktorzy[1] - D.IDS.aktorzy[0] + 1;
    const COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function aktorDane(id) {
        return { id, name: "", note: "<Podroznicy:aktor>", x: SC.zejscie[0], y: SC.zejscie[1], pages: [{ conditions: Object.assign({}, COND), directionFix: false,
            image: { tileId: 0, characterName: "", direction: 2, pattern: 1, characterIndex: 0 },
            list: [C(355, ["Podroznicy.aktor(this);"]), C(0, [])], moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
            moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false, through: true, trigger: 0, walkAnime: true }] };
    }
    // every map's data as it loads (Podroznicy_Data's injector - before TownLife's): the hall's places; the harbour's actors
    function wstaw(data, mapId) {
        if (mapId === 1) { znaczniki = skanuj(data.events); znaczniki01 = true; bump(); }
        const out = [];
        if (mapId === SC.mapa) for (let i = 0; i < AKT_N; i++) out.push(aktorDane(AKT0 + i));
        // (stage 2: Podroznicy_Sprawy.js - Antek and Zenon at the garrison; stage 3 and on: Podroznicy.dodajWstaw(fn) - the walker, the
        // letter, the soot, the rope...) - each gives the events of its own ids on this map
        const S2 = window.PodroznicySprawy;
        for (const f of [S2 && S2.wstaw].concat(WSTAWKI)) {
            if (typeof f !== "function") continue;
            try { out.push(...(f(data, mapId) || [])); } catch (e) { console.error("[Podroznicy] wstaw", e); }
        }
        return out;
    }
    const WSTAWKI = [];
    // who stands on the pier now: the arrived 9-11, the leaving 14-15, who watches the faces 9-15 (only on a ferry day)
    function naMolo() {
        const out = [], d = day(), h = hour(), s = S();
        if (!has() || !isFerry(d)) return out;
        const add = (pk, kind, i) => { for (const rk of rezydenci(pk)) out.push({ pk, rk, kind, i: i++ }); return i; };
        let a = 0, b = 0, c = 0;
        for (const [pk, e] of Object.entries(s.obecni)) {
            if (e.od === d && !e.f9 && h >= D.GODZINY.przybija && h < D.GODZINY.molo) a = add(pk, "przyjazd", a);
            else if (e.do === d && h >= D.GODZINY.odjazdMolo && h < D.GODZINY.odplywa) b = add(pk, "odjazd", b);
            else if (OBSADA_BY.get(pk) && OBSADA_BY.get(pk).przystan && e.od !== d && h >= D.GODZINY.przybija && h < D.GODZINY.odplywa) c = add(pk, "straz", c);
        }
        return out.slice(0, AKT_N);
    }
    const spotOf = a => (a.kind === "przyjazd" ? SC.molo : a.kind === "odjazd" ? SC.odjazd : SC.straz)[a.i % (a.kind === "straz" ? SC.straz.length : SC.molo.length)];
    function ukryj(ev) {
        const st = ev._podr || (ev._podr = {});
        if (st.ukryty === true) return;
        st.ukryty = true; st.rk = ""; st.pk = "";
        ev.setTransparent(true); ev.setThrough(true); ev._priorityType = 0;
    }
    function pokaz(ev, a, at) {
        const st = ev._podr || (ev._podr = {});
        const sheet = arkusz(a.rk);
        if (ev.characterName() !== sheet) ev.setImage(sheet, 0);
        const de = ev.event();
        if (de) de.name = imie(a.rk) + (tytul(a.rk) ? " (" + tytul(a.rk) + ")" : "");
        if (at && !ev.isMoving() && (ev.x !== at[0] || ev.y !== at[1])) ev.locate(at[0], at[1]);
        if (at && !ev.isMoving()) ev.setDirection(at[2] || 2);
        st.rk = a.rk; st.pk = a.pk;
        if (st.ukryty !== false) { st.ukryty = false; ev.setTransparent(false); ev.setThrough(true); ev._priorityType = 1; }
    }
    function przystanTick() {
        if (!window.$gameMap || $gameMap.mapId() !== SC.mapa || scena) return;
        const list = naMolo();
        for (let i = 0; i < AKT_N; i++) {
            const ev = $gameMap.event(AKT0 + i);
            if (!ev) continue;
            const a = list[i];
            if (a) pokaz(ev, a, spotOf(a)); else ukryj(ev);
        }
    }
    T.onEventStart(ev => !!(ev._podr && ev._podr.ukryty), { owner: PLUGIN, priority: "hidden" });
    // an actor spoken to: the very talk of its resident (the first meeting, the menu, the quests)
    function aktor(interp) {
        if (!interp || !has()) return;
        const ev = $gameMap.event(interp.eventId()), st = ev && ev._podr;
        if (!st || st.ukryty || !st.rk) return;
        T.talk.run(interp, st.rk, { ev, owner: PLUGIN, base: () => linie(ev, listOf(slowa(st.rk, "glos")).slice(0, 1)) });
    }

    // ---------------------------------------------------------------- the scene of the landing (docs/PODROZNI.md 8.1, example 1)
    let scena = null;
    const przybyliDzis = () => (has() ? Object.entries(S().obecni).filter(([, e]) => e.od === day() && !e.f9).map(([pk]) => pk) : []);
    let auto = true;   // (the scene by itself; the tests' quiet mode turns it off - tests/lib/kit.js QUIET)
    function scenaMozna() {
        if (!window.$gameMap || $gameMap.mapId() !== SC.mapa || scena || !has()) return false;
        const forced = window.$gameTemp && $gameTemp._podrScena;
        if (!forced && !auto) return false;
        const d = day(), h = hour();
        if (!forced && (!isFerry(d) || h < D.GODZINY.przybija || h >= D.GODZINY.przybija + 0.5 || S().widziane.sceny["prom" + d] || !przybyliDzis().length)) return false;
        return T.isCalm(SceneManager._scene, { only: ["onMap", "sceneChange", "transfer", "message", "event", "farmMenu", "build", "miniGame"], settle: SC.klatki.zwloka });
    }
    // the steps: kino (the bars), kamera (to a cell / "bohater"), dzwiek, czekaj, ujecie (a shot's end: P skips to the next), pokaz (an
    // actor at the gangway), idz (an actor walks to its place), dymek (a bubble over an actor / the ferryman / the officer)
    function kroki(cast) {
        const k = [], K = SC.klatki;
        k.push({ co: "kino", on: true }, { co: "kamera", cel: SC.kamera, klatki: K.kamera }, { co: "dzwiek", se: ["Bell2", 70, 80] }, { co: "czekaj", klatki: 30 },
            { co: "dzwiek", se: ["Chain", 55, 90] }, { co: "dymek", kto: "przewoznik", tekst: tx("scena.przewoznik") }, { co: "czekaj", klatki: K.dymek }, { co: "ujecie" });
        cast.forEach((a, i) => {
            k.push({ co: "pokaz", i }, { co: "dzwiek", se: ["Move1", 40, 100] }, { co: "idz", i, cel: SC.molo[i % SC.molo.length] });
            const pool = listOf(TX.przybycie && TX.przybycie.pula), line = one(slowa(a.rk, "przybycie")) || (SLOT[a.rk] !== undefined && pool.length ? pool[i % pool.length] : "");
            if (line) k.push({ co: "dymek", kto: i, tekst: line });
            k.push({ co: "czekaj", klatki: K.przerwa + (line ? 60 : 0) }, { co: "ujecie" });
        });
        if (day() === waves()[0] && window.$gameMap && $gameMap.event(SC.fala[1])) {   // (the first wave: Ludmiła and Ela off the same ferry)
            k.push({ co: "dymek", kto: "fala1", tekst: tx("scena.ela") }, { co: "czekaj", klatki: 110 }, { co: "dymek", kto: "fala0", tekst: tx("scena.ludmila") },
                { co: "czekaj", klatki: 110 }, { co: "ujecie" });
        }
        if (cast.length) {
            const cele = listOf(TX.scena && TX.scena.cele);
            k.push({ co: "dymek", kto: "celnik", tekst: tx("scena.celnik") }, { co: "czekaj", klatki: 90 },
                { co: "dymek", kto: 0, tekst: cele.length ? cele[mix(S().seed, day()) % cele.length] : "" }, { co: "czekaj", klatki: 100 }, { co: "ujecie" });
        }
        k.push({ co: "kamera", cel: "bohater", klatki: 50 }, { co: "kino", on: false });
        return k;
    }
    function scenaStart() {
        if (!has()) return false;
        if (window.$gameTemp) $gameTemp._podrScena = false;
        let pks = przybyliDzis();
        if (!pks.length) pks = Object.keys(S().obecni).slice(0, 3);   // (F9 on another day: whoever is here)
        const cast = [];
        for (const pk of pks) for (const rk of rezydenci(pk)) if (cast.length < AKT_N) cast.push({ pk, rk });
        S().widziane.sceny["prom" + day()] = day();
        scena = { kroki: kroki(cast), i: 0, t: 0, cast, hold: 0, kino: false, kam: null, from: null, dzien: day() };
        for (let i = 0; i < AKT_N; i++) { const ev = $gameMap.event(AKT0 + i); if (ev) ukryj(ev); }
        $gameMap._interpreter.setup([C(355, ["Podroznicy.scenaTrzymaj(this);"]), C(0, [])], 0);
        T.emit("podroznicyScena", { co: "prom", start: true });
        return true;
    }
    // the map's interpreter holds while the scene plays (every system takes it as an event: no barks, no wolves, no menu)
    function scenaTrzymaj(interp) {
        if (!scena || !interp) return;
        interp._index--;
        interp.wait(1);
    }
    const aktorEv = i => $gameMap.event(AKT0 + i);
    function charOf(kto) {
        if (kto === "przewoznik") return $gameMap.event(SC.przewoznik);
        if (kto === "celnik") { const L = TL(); return L && L.eventOf ? L.eventOf(SC.celnik) : null; }
        if (kto === "fala0") return $gameMap.event(SC.fala[0]);
        if (kto === "fala1") return $gameMap.event(SC.fala[1]);
        return typeof kto === "number" ? aktorEv(kto) : null;
    }
    function displayFor(cel) {
        const x = cel === "bohater" ? $gamePlayer.x : cel[0], y = cel === "bohater" ? $gamePlayer.y : cel[1];
        return [x - $gamePlayer.centerX(), y - $gamePlayer.centerY()];
    }
    // one step now (instant: skipped - its end state at once); -> true when it is over
    function krok(k, instant) {
        const sc = scena;
        switch (k.co) {
            case "kino": sc.kino = k.on; return true;
            case "dzwiek": if (!instant) T.audio.se(k.se[0], { volume: k.se[1], pitch: k.se[2] }); return true;
            case "ujecie": return true;
            case "czekaj": return instant || ++sc.t >= k.klatki;
            case "dymek": { const ch = charOf(k.kto), SB = T.api("SpeechBubbles"); if (!instant && ch && SB && SB.say && k.tekst) SB.say(ch, k.tekst, SC.klatki.dymek + 30); return true; }
            case "pokaz": {
                const a = sc.cast[k.i], ev = aktorEv(k.i);
                if (a && ev) { pokaz(ev, a, [SC.zejscie[0], SC.zejscie[1], 8]); ev.setMoveSpeed(3); }
                return true;
            }
            case "idz": {
                const ev = aktorEv(k.i);
                if (!ev) return true;
                const [tx2, ty2, dir] = k.cel;
                if (instant) { ev.locate(tx2, ty2); ev.setDirection(dir || 2); return true; }
                if (ev.isMoving()) return false;
                if (ev.x === tx2 && ev.y === ty2) { ev.setDirection(dir || 2); return true; }
                const d = ev.y > SC.molo[0][1] ? 8 : ev.x !== tx2 ? (tx2 > ev.x ? 6 : 4) : ty2 > ev.y ? 2 : 8;
                ev.setThrough(true);
                ev.moveStraight(d);
                return false;
            }
            case "kamera": {
                const [tx2, ty2] = displayFor(k.cel);
                if (instant) { $gameMap.setDisplayPos(tx2, ty2); sc.kam = null; if (k.cel === "bohater") $gamePlayer.center($gamePlayer.x, $gamePlayer.y); return true; }
                if (!sc.kam) sc.kam = { x0: $gameMap.displayX(), y0: $gameMap.displayY(), t: 0 };
                const p = Math.min(1, ++sc.kam.t / Math.max(1, k.klatki)), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
                $gameMap.setDisplayPos(sc.kam.x0 + (tx2 - sc.kam.x0) * e, sc.kam.y0 + (ty2 - sc.kam.y0) * e);
                if (p < 1) return false;
                sc.kam = null;
                if (k.cel === "bohater") $gamePlayer.center($gamePlayer.x, $gamePlayer.y);
                return true;
            }
            default: return true;
        }
    }
    function scenaTick() {
        const sc = scena;
        if (!sc) return;
        if (!window.$gameMap || $gameMap.mapId() !== SC.mapa) { scenaKoniec(); return; }
        if (day() !== sc.dzien) { scenaKoniec(true); return; }   // (the clock jumped to another day: as after the whole scene)
        // P: the next shot; P held: the whole scene (as the prologue)
        const held = Input.isPressed("escape") || Input.isPressed("cancel");
        if (held) { if (++sc.hold >= SC.klatki.trzymaj) { scenaKoniec(true); return; } }
        else { if (sc.hold > 0 && sc.hold < SC.klatki.trzymaj) dalej(); sc.hold = 0; }
        let guard = 0;
        while (sc.i < sc.kroki.length && guard++ < 20) {
            if (!krok(sc.kroki[sc.i], false)) return;
            sc.i++; sc.t = 0;
        }
        if (sc.i >= sc.kroki.length) scenaKoniec();
    }
    // to the next shot: the steps between done at once
    function dalej() {
        const sc = scena;
        while (sc.i < sc.kroki.length) {
            const k = sc.kroki[sc.i];
            krok(k, true);
            sc.i++; sc.t = 0; sc.kam = null;
            if (k.co === "ujecie") break;
        }
        SoundManager.playCursor();
    }
    function scenaKoniec(all) {
        const sc = scena;
        if (!sc) return;
        if (all) { while (sc.i < sc.kroki.length) { krok(sc.kroki[sc.i], true); sc.i++; } SoundManager.playOk(); }
        sc.kino = false;
        updateKino();
        scena = null;
        if (window.$gamePlayer) $gamePlayer.center($gamePlayer.x, $gamePlayer.y);
        T.emit("podroznicyScena", { co: "prom", start: false, pominieta: !!all });
    }
    // the cinema: black bars over the map, the HUD out of the way, the hint "przytrzymaj P: pomiń" on the lower bar
    const kinoUI = { bars: null, hidden: [], a: 0 };
    function updateKino() {
        const sc = SceneManager._scene, on = !!(scena && scena.kino);
        if (!(sc instanceof Scene_Map)) return;
        if (on && (!kinoUI.bars || kinoUI.bars.parent !== sc)) {
            const bars = new Sprite(), h = 54;
            for (const y of [0, Graphics.height - h]) { const b = new Sprite(new Bitmap(Graphics.width, h)); b.bitmap.fillAll("#000000"); b.y = y; bars.addChild(b); }
            const hint = new Sprite(new Bitmap(360, 30));
            hint.bitmap.fontSize = 16;
            hint.bitmap.textColor = "#a9a39a";
            hint.bitmap.drawText(txm("scena.pomin") || "", 0, 0, 340, 30, "right");
            hint.x = Graphics.width - 370; hint.y = Graphics.height - 42;
            bars.addChild(hint);
            bars.alpha = 0;
            sc.addChildAt(bars, Math.max(0, sc._spriteset ? sc.children.indexOf(sc._spriteset) + 1 : 0));
            kinoUI.bars = bars;
        }
        if (on) {
            kinoUI.bars.alpha = Math.min(1, kinoUI.bars.alpha + 0.06);
            for (const el of (sc.hudFadeElements ? sc.hudFadeElements() : [])) {
                if (!el) continue;
                if (el.visible && !kinoUI.hidden.includes(el)) kinoUI.hidden.push(el);
                el.visible = false;
            }
        } else if (kinoUI.bars) {
            if (kinoUI.bars.parent) kinoUI.bars.parent.removeChild(kinoUI.bars);
            kinoUI.bars = null;
            for (const el of kinoUI.hidden) el.visible = true;
            kinoUI.hidden = [];
        }
    }

    // ==================================================================
    // 4. The talks: a traveller's first meeting and its menu; Borgar's book
    // ==================================================================
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const spkOf = ev => ({ id: ev ? ev.eventId() : -1, name: ev && ev.event() ? String(ev.event().name || "").replace(/\s*\(.*\)\s*$/, "") : "" });
    const linie = (ev, lines) => Watki.mowa.linesTo([], spkOf(ev), lines, null, 0, AK);
    const isTraveller = key => RES_KEYS.has(String(key));
    // the first meeting (once a visit; before the quests): it says who it is
    function spotkanie(ctx) {
        const pk = osoba(ctx.who), e = wpis(pk);
        if (!e) return null;
        const s = S(), mark = pk + ":" + (e.wizyta || 1);
        if (s.poznani[mark] || (GRUPA[ctx.who] && s.poznani[pk + ":" + (e.wizyta || 1)])) return null;
        const lines = listOf(slowa(ctx.who, "spotkanie"));
        if (!lines.length) return null;
        s.poznani[mark] = day();
        if (!s.poznani[pk]) s.poznani[pk] = day();
        bump();
        return linie(ctx.ev, lines);
    }
    // the war's news by its stage (docs/PODROZNI.md 1.2)
    function wiesci(pk) {
        const d = day(), A = T.api("Act3");
        let et = (D.ETAPY_WOJNY.find(x => d <= x.do) || D.ETAPY_WOJNY[D.ETAPY_WOJNY.length - 1]).etap;
        if (aktII()) et = "akt2";
        try { if (A && A.outcome && A.outcome()) et = "akt3"; } catch (e) { /* (no Act III) */ }
        const L = listOf(TX.wiesci && TX.wiesci[et]);
        return L.length ? L[mix(S().seed, d, String(pk).length, (S().obecni[pk] || {}).pokoj | 0) % L.length] : "";
    }
    // the menu: where from, the news, how it is (its words in turn), the pool's small favour, the other systems' options, "Bywaj."
    function menu(ctx) {
        const pk = osoba(ctx.who), e = wpis(pk);
        if (!e || !ctx.ev) return null;
        const out = linie(ctx.ev, [pick(listOf(TX.menu && TX.menu.pyta)) || "?"]);
        const own = [];
        const skad = listOf(slowa(ctx.who, "skad"));
        if (skad.length) own.push({ label: tx("menu.skad"), cmds: linie(ctx.ev, skad) });
        const news = wiesci(pk);
        if (news) own.push({ label: tx("menu.wiesci"), cmds: linie(ctx.ev, [news]) });
        const glos = listOf(slowa(ctx.who, "glos"));
        if (glos.length) {
            const n = (e.glos || 0) % glos.length;
            own.push({ label: tx("menu.glos"), cmds: [C(355, ["Podroznicy.akcja(this, " + JSON.stringify(["glos", pk]) + ");"])].concat(linie(ctx.ev, [glos[n]])) });
        }
        const prz = e.pula && D.PULA[e.pula].przysluga;
        if (prz) own.push({ label: tx("pula." + e.pula + ".przysluga.etykieta"), cmds: [C(355, ["Podroznicy.akcja(this, " + JSON.stringify(["przysluga", pk]) + ");"])] });
        const rows = T.talk.rows(ctx.who, ctx, own);
        return T.talk.menu(out, rows, tx("menu.bywaj"));
    }
    // the script calls of the talks: Podroznicy.akcja(this, [co, pk])
    function akcja(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        const [co, pk] = args, e = wpis(pk);
        if (!e) return;
        const ev = interp ? $gameMap.event(interp.eventId()) : null;
        try {
            if (co === "glos") { e.glos = (e.glos || 0) + 1; return; }
            if (co === "przysluga") przysluga(interp, ev, pk, e);
        } catch (er) { console.error("[Podroznicy] akcja " + JSON.stringify(args), er); }
    }
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    // a small favour of the pool (stage 1: daj / usluga / rada); done once a visit; at most ZLOTO_PRZYSLUG gold a ferry from them all
    function przysluga(interp, ev, pk, e) {
        const P = D.PULA[e.pula].przysluga, key = "pula." + e.pula + ".przysluga.", s = S();
        const say = lines => Watki.mowa.uruchom(interp, linie(ev, lines));
        if (P.co !== "rada" && e.przysluga) { say([tx("przysluga.zrobione")]); return; }
        if (P.co === "rada" && P.hak === "pogoda") {
            const Sv = T.api("Survival"), pl = Sv && Sv.weatherPlan ? Sv.weatherPlan(day() + 1) : null;
            say([tx(key + (pl ? "deszcz" : "sucho"))]);
            return;
        }
        if (P.co === "daj") {
            const lack = P.rzeczy.find(([id, n]) => count(id) < n);
            if (lack) { T.popup.need(item(lack[0]) ? item(lack[0]).iconIndex : 0, tx(key + "brak")); return; }
            const prom = naPromie(e.od, isFerry), got = s.zlotoProm[prom] || 0;
            if ((P.zloto || 0) && got + P.zloto > D.ZLOTO_PRZYSLUG) { say([tx("przysluga.dosc")]); return; }
            for (const [id, n] of P.rzeczy) $gameParty.loseItem(item(id), n, false);
            if (P.zloto) { $gameParty.gainGold(P.zloto); s.zlotoProm[prom] = got + P.zloto; T.popup("+" + P.zloto + " G", { icon: 314, kind: "good" }); }
            if (P.opinia) T.call("TownQuests", "addOpinion", P.opinia, PLUGIN);
            e.przysluga = day();
            say([tx(key + "dzieki")]);
            return;
        }
        if (P.co === "usluga" && P.hak === "naostrz") {
            const Du = T.api("Durability");
            let best = 0, worst = 1;
            if (Du && Du.TOOLS && (!Du.enabled || Du.enabled())) for (const id of Object.keys(Du.TOOLS).map(Number)) {
                if (!item(id) || !$gameParty.hasItem(item(id)) || !(Du.used(id) > 0)) continue;
                const r = Du.left(id) / Math.max(1, Du.lifeOf(id));
                if (r < worst) { worst = r; best = id; }
            }
            if (!best) { T.popup.need(0, tx(key + "nic")); return; }
            if ($gameParty.gold() < P.cena) { T.popup.need(314, tx(key + "brak")); return; }
            $gameParty.loseGold(P.cena);
            Du.repair(best);
            e.przysluga = day();
            say([tx(key + "dzieki")]);
        }
    }
    // the guests' book at Borgar's bar: the rooms (who, till when), Eryk Sowa, Rafał hidden, the renown and the week's takings
    function ksiegaLinie() {
        const s = S(), d = day(), h = hour(), rows = [];
        for (const [pk, e] of Object.entries(s.obecni)) {
            const rooms = Array.from(new Set([e.pokoj].concat(Object.values(e.pokoje || {})).filter(Boolean)));
            for (const r of rooms) {
                const key = e.do === d ? "ksiega.wierszDzis" : e.od === d && !e.f9 && h < D.GODZINY.sala ? "ksiega.wierszDroga" : "ksiega.wiersz";
                rows.push({ n: Number(r) || 99, text: fill(tx(key), { pokoj: r, kto: nazwa(pk, true), do: e.do }) });
            }
        }
        const L = TL(), eryk = L && L.RESIDENTS && L.RESIDENTS.find(r => r.key === "rozbitek");
        if (eryk && !(L.absent && L.absent("rozbitek"))) rows.push({ n: D.POKOJ_ERYKA, text: tx("ksiega.eryk") });
        const w6 = qrec("W6"), hide = w6 && w6.t && w6.t.hide;
        if (w6 && w6.s === "active" && hide && hide.where === "tavern" && !flags().rafalTaken) rows.push({ n: D.POKOJ_RAFALA, text: tx("ksiega.rafal") });
        rows.sort((a, b) => a.n - b.n);
        const out = rows.map(r => r.text);
        if (!Object.keys(s.obecni).length) out.push(tx("ksiega.pusto"));
        out.push("", fill(tx("ksiega.renoma"), { renoma: s.renoma, opis: opisRenomy(s.renoma) }), fill(tx("ksiega.utarg"), { utarg: s.utargTyg.t === Math.floor((d - 1) / 7) ? s.utargTyg.g : 0 }));
        return out;
    }
    function ksiega(ctx) {
        const spk = ctx.ev ? { id: ctx.ev.eventId(), name: "Borgar" } : { id: -1, name: "Borgar" };
        const out = Watki.mowa.linesTo([], spk, [pick(listOf(TX.ksiega && TX.ksiega.borgar))], null, 0, AK);
        return Watki.mowa.plain(out, tx("ksiega.tytul"), ksiegaLinie().filter(l => l !== ""));
    }
    function hookTalk() {
        if (hookTalk.done) return;
        hookTalk.done = true;
        T.talk.takeover({ owner: PLUGIN, name: "spotkanie", who: isTraveller, priority: T.talk.PRIORITY.meet + 5, run: ctx => { try { return spotkanie(ctx); } catch (e) { console.error("[Podroznicy]", e); return null; } } });
        T.talk.takeover({ owner: PLUGIN, name: "menu", who: isTraveller, priority: T.talk.PRIORITY.shop + 25, run: ctx => { try { return menu(ctx); } catch (e) { console.error("[Podroznicy]", e); return null; } } });
        T.talk.option({ owner: PLUGIN, who: "borgar", id: "ksiega", label: () => txm("ksiega.etykieta") || "Księga gości", order: T.talk.ORDER.extra + 10,
            run: ctx => { try { return ksiega(ctx); } catch (e) { console.error("[Podroznicy]", e); return null; } } });
    }
    hookTalk();

    // ==================================================================
    // 5. F9 ("Wyspa i fabuła" - the section of the thread, Watki.f9)
    // ==================================================================
    const F9_KTO = D.OBSADA.map(c => c.key).concat(["pula"]);
    const f9State = { kto: 0, renoma: 10 };
    const nextFerryDay = () => naPromie(day() + 1, isFerry);
    function f9Wiersze() {
        if (!has()) return [];
        const s = S(), kto = F9_KTO[f9State.kto];
        return [
            { co: "prom", label: fill(tx("f9.prom"), { dzien: nextFerryDay() }), desc: tx("f9.promOpis"), icon: 190 },
            { co: "przyplyn", label: fill(tx("f9.przyplyn"), { kto: kto === "pula" ? tx("f9.pula") : nazwa(kto) }), desc: tx("f9.przyplynOpis"), icon: 87, pick: f9State.kto },
            { co: "odplyw", label: fill(tx("f9.odplyw"), { n: Object.keys(s.obecni).length }), desc: tx("f9.odplywOpis"), icon: 189 },
            { co: "wyczysc", label: tx("f9.wyczysc"), desc: tx("f9.wyczyscOpis"), icon: 189 },
            { co: "renoma", label: fill(tx("f9.renoma"), { renoma: s.renoma, zmiana: (f9State.renoma > 0 ? "+" : "") + f9State.renoma }), desc: tx("f9.renomaOpis"), icon: 87, pick: f9State.renoma },
            { co: "ziarno", label: fill(tx("f9.ziarno"), { ziarno: s.seed }), desc: tx("f9.ziarnoOpis"), icon: 189 },
            { co: "scena", label: tx("f9.scena"), desc: tx("f9.scenaOpis"), icon: 190 }
        ];
    }
    function f9Wybierz(row, delta) {
        if (row.co === "przyplyn") f9State.kto = (f9State.kto + delta + F9_KTO.length * 10) % F9_KTO.length;
        else if (row.co === "renoma") f9State.renoma = -f9State.renoma;
        else return false;
        const r = f9Wiersze().find(x => x.co === row.co);
        if (r) { row.label = r.label; row.pick = r.pick; }
        return true;
    }
    const PRZYSTAN = ["Przystań", 125, 20, 16, 4];
    function f9Ok(row) {
        if (!has()) return null;
        const s = S();
        switch (row.co) {
            case "prom": {
                const d = nextFerryDay();
                T.state("clock").day = d;
                $gameSystem.setDayNightHour(8.92);
                delete s.widziane.sceny["prom" + d];
                sync();
                return { go: PRZYSTAN };
            }
            case "przyplyn": {
                const kto = F9_KTO[f9State.kto], pk = przyplyn(kto);
                return pk ? { say: fill(tx("f9.ok.przyplyn"), { kto: nazwa(pk), pokoj: wpis(pk).pokoj }) } : { say: fill(tx("f9.ok.nie"), { kto: kto === "pula" ? tx("f9.pula") : nazwa(kto) }), bad: true };
            }
            case "odplyw": { let n = 0; for (const pk of Object.keys(s.obecni)) if (odplyn(pk, "f9")) n++; sloty(); return { say: fill(tx("f9.ok.odplyw"), { n }) }; }
            case "wyczysc": wyczysc(); return { say: tx("f9.ok.wyczysc") };
            case "renoma": renoma(f9State.renoma, "F9"); return { say: fill(tx("f9.ok.renoma"), { renoma: s.renoma }) };
            case "ziarno": s.seed = 1 + Math.floor(Math.random() * 2147483000); bump(); return { say: fill(tx("f9.ok.ziarno"), { ziarno: s.seed }) };
            case "scena": {
                const d = isFerry(day()) ? day() : nextFerryDay();
                if (d !== day()) { T.state("clock").day = d; sync(); }
                $gameSystem.setDayNightHour(8.92);
                delete s.widziane.sceny["prom" + d];
                if (window.$gameTemp) $gameTemp._podrScena = true;
                return { go: PRZYSTAN };
            }
        }
        return null;
    }
    // a traveller now (F9, tests): the cast's next visit (its room, its stay) or someone of the pool; -> the book's key or null
    function przyplyn(kto) {
        if (!has()) return null;
        const s = S(), d = day();
        if (kto === "pula") {   // (someone of the pool, picked at once - not the ferry's planning)
            const env = srodowisko(d), r = rng(mix(s.seed, d, Object.keys(s.obecni).length, (Graphics.frameCount | 0)));
            const typy = Object.keys(D.PULA).filter(t => !Object.values(s.obecni).some(e => e.pula === t));
            if (!typy.length || s.sloty.indexOf(null) < 0) return null;
            const typ = typy[Math.floor(r() * typy.length)], P = D.PULA[typ], list = env.imiona[P.kobieta ? "k" : "m"];
            const pokoj = pokojDla(null, zajete(s), env);
            let pk = "p" + d + "_f0";
            for (let n = 1; s.obecni[pk]; n++) pk = "p" + d + "_f" + n;
            if (!pokoj) return null;
            przyjmij(s, pk, { od: d, do: naPromie(d + 3, isFerry), pokoj, wizyta: 1, miejsce: wolneMiejsce(s, 0), pula: typ, imie: list[Math.floor(r() * list.length)] || "",
                arkusz: D.CIALA[P.cialo][Math.floor(r() * D.CIALA[P.cialo].length)], kobieta: !!P.kobieta, f9: true });
            sloty(); bump();
            T.emit("podroznyPrzyplynal", { kto: pk, dzien: d, f9: true });
            return pk;
        }
        const c = OBSADA_BY.get(kto);
        if (!c || s.obecni[kto]) return null;
        const i = Math.min(s.wizyty[kto] || 0, c.wizyty.length - 1), v = c.wizyty[i];
        const env = srodowisko(d), taken = zajete(s);
        let pokoj, pokoje = null;
        if (c.grupa) {
            pokoje = {};
            for (const [k2, m] of c.grupa.entries()) { const a = pokojDla(c.pokoje[k2], taken, env) || pokojDla(null, taken, env); if (!a) return null; pokoje[m] = a; }
            pokoj = pokoje[c.grupa[0]];
        } else pokoj = pokojDla(c.pokoj, taken, env) || (isHeroRoom(String(c.pokoj)) ? pokojDla(null, taken, env) : null);
        if (!pokoj) return null;
        const e = { od: d, do: isFerry(d) ? wyjazd(v, d, isFerry) : naPromie(d + 3 * Math.max(1, v.promy || 1), isFerry), pokoj, wizyta: i + 1, miejsce: c.grupa ? 0 : wolneMiejsce(s, c.miejsce), f9: true };
        if (pokoje) e.pokoje = pokoje;
        przyjmij(s, kto, e);
        s.wizyty[kto] = i + 1;
        bump();
        T.emit("podroznyPrzyplynal", { kto, dzien: d, f9: true });
        return kto;
    }
    // the book cleared (F9): nobody here, nobody was; the renown, the seed and the takings stay
    function wyczysc() {
        const s = S();
        Object.assign(s, { obecni: {}, byli: {}, wizyty: {}, ksiega: {}, pula: {}, sloty: [null, null, null, null], poznani: {}, zlotoProm: {}, last: day() });
        bump();
    }

    // ==================================================================
    // 6. The clock and the bus
    // ==================================================================
    T.on("newGame", () => { if (has()) { S().last = 0; S().noc = 0; } bump(); }, { owner: PLUGIN });   // (a new game: the ferry of day 1 too)
    T.on("load", () => { scena = null; bump(); }, { owner: PLUGIN });
    T.on("dayStart", () => sync(), { owner: PLUGIN });
    T.on("hourChange", () => sync(), { owner: PLUGIN });
    T.on("mapReady", () => { scena = null; sync(); przystanTick(); }, { owner: PLUGIN });
    T.on("served", e => { if (e && e.service === "room") bump(); }, { owner: PLUGIN });
    let ticks = 0;
    T.onMapUpdate(() => {
        if (scena) { scenaTick(); updateKino(); return; }
        if (kinoUI.bars) updateKino();
        if (++ticks % 10) return;
        if (window.$gameMap && $gameMap.mapId() === SC.mapa) {
            if (scenaMozna()) { scenaStart(); return; }
            if (ticks % 20 === 0) przystanTick();
        }
    }, { owner: PLUGIN, name: "podroznicy" });

    // the thread's hooks (the data's conditions of stage 2: { hak: "obecny", args: ["tobiasz"] }, "renoma>=50" as { hak: "renoma", args: [50] })
    w.haki({
        obecny: (ctx, key) => !!wpis(key),
        wizyta: (ctx, key, n) => { const e = wpis(key); return !!e && (e.wizyta || 1) === Number(n); },
        renoma: (ctx, n) => S().renoma >= Number(n),
        pokojZajety: (ctx, r) => !!S().ksiega[String(r)]
    });

    // ==================================================================
    // The API
    // ==================================================================
    const api = {
        D, logika, PLUGIN,
        stan: () => S(), sync, planujDzis, obecni: () => Object.assign({}, S().obecni), ksiega: () => Object.assign({}, S().ksiega), ksiegaLinie,
        renoma: (delta, why) => (delta ? renoma(delta, why) : S().renoma), opisRenomy, nazwa, osoba, rezydenci, jest, mapa, imie, tytul, arkusz,
        plan, wnetrze, okrzyki, mowa, wstaw, aktor, akcja, przyplyn, odplyn: pk => { const ok = odplyn(pk, "f9"); sloty(); return ok; }, wyczysc,
        naMolo, przystanTick, scenaTrzymaj, scena: { start: scenaStart, koniec: scenaKoniec, dalej: () => (scena ? (dalej(), true) : false), trwa: () => !!scena, stan: () => scena },
        auto: on => { if (on !== undefined) { auto = on !== false; if (!auto && scena) scenaKoniec(true); } return auto; },
        znaczniki: () => Array.from(znaczniki), limit: () => (has() ? limitOf(srodowisko(day())) : D.LIMIT.rozdzial), warunekGry,
        // (stage 2) the first ferry from day x on; a traveller leaving on that ferry (no extra stay - D42: Zenon shown up)
        naPromie: x => naPromie(x, isFerry),
        wyjazd: (pk, d) => { const e = wpis(pk); if (!e) return false; e.do = Math.max(day(), Number(d) || day()); e.zostal = 1; bump(); return true; },
        odswiez: () => bump(),
        dodajWstaw: fn => { if (typeof fn === "function") WSTAWKI.push(fn); },
        f9: { wiersze: f9Wiersze, wybierz: f9Wybierz, ok: f9Ok }
    };
    window.Podroznicy = T.register(PLUGIN, api);
})();
