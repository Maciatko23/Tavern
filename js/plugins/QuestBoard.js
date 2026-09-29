//=============================================================================
// QuestBoard.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Tablica zleceń w tawernie „Pod Złotym Kuflem”: prawdziwe zlecenia od ludzi z okolicy (dostawy, wyroby, zbieractwo, polowania, POSZUKIWANY), sława w tawernie, zapłata w złocie i doświadczeniu. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
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
 * Stan w $gameSystem._tw.quests (rdzeń TawernaCore; stare zapisy z
 * $gameSystem._quests są przejmowane, a stary klucz zostaje jako alias).
 *
 * PLIKI (2026-09-29 podzielone): QuestBoard.js (logika, stan, API - ten),
 * QuestBoard_Data.js (wzory ogłoszeń, zleceniodawcy, listy gończe),
 * QuestBoard_Art.js (rysunki kartek), QuestBoard_Scene.js (scena tablicy).
 * Kolejność na liście wtyczek: QuestBoard_Data, QuestBoard, QuestBoard_Art,
 * QuestBoard_Scene. Dopóki części nie są wpisane, ten plik wczytuje je sam.
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "QuestBoard";
    const T = window.Tawerna;
    if (!T) throw new Error("QuestBoard.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    // the family's shared bag: this file (P.core), QuestBoard_Data.js (P.data), QuestBoard_Art.js (P.art), QuestBoard_Scene.js (P.Scene)
    const P = T.api("QuestBoard_parts") || T.register("QuestBoard_parts", {});
    // the parts not in js/plugins.js yet: put into the page here (after every plugin - they are data and classes only, no engine hooks)
    for (const part of ["QuestBoard_Data", "QuestBoard_Art", "QuestBoard_Scene"]) {
        if (!(window.$plugins || []).some(p => p && p.name === part && p.status)) PluginManager.loadScript(part);
    }
    // the tables (QuestBoard_Data.js), read when needed
    function D() {
        if (!P.data) throw new Error("QuestBoard.js: brak QuestBoard_Data.js (the quest board's tables)");
        return P.data;
    }
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
    const plural = (n, one, few, many) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);
    const dniWord = n => (n === 1 ? "dzień" : "dni");
    // places for the hunts (QuestBoard_Data.js PLACES: the name and "where"), else the map's own name
    const placeName = id => (D().PLACES[id] ? D().PLACES[id][0] : ($dataMapInfos && $dataMapInfos[id] ? String($dataMapInfos[id].name).replace(/#\d+$/, "") : "?"));
    const placeWhere = id => (D().PLACES[id] ? D().PLACES[id][1] : "na mapie " + placeName(id));
    const TEMPLATE = id => D().TEMPLATES.find(t => t.id === id) || null;

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
    // State: $gameSystem._tw.quests (the core's saved state; an older save's $gameSystem._quests is taken over and the old key stays as
    // an alias). board: the notices on the board (state open / active / done / failed); history: finished ones (newest first)
    // ------------------------------------------------------------------
    function newState() {
        return { v: 1, rep: 0, cycle: -1, seed: (Math.random() * 4294967296) >>> 0, board: [], history: [], stats: { done: 0, failed: 0, abandoned: 0, gold: 0, xp: 0 },
            track: null, tutorial: false, once: {}, nextId: 1, seen: -1 };
    }
    const store = T.state.define("quests", newState, { version: 1, adopt: "_quests", owner: PLUGIN });
    const hasState = () => !!window.$gameSystem;
    function data() {
        const d = store();
        if (!d.board) d.board = [];
        if (!d.history) d.history = [];
        if (!d.stats) d.stats = { done: 0, failed: 0, abandoned: 0, gold: 0, xp: 0 };
        if (!d.once) d.once = {};
        return d;
    }
    const today = () => T.time.day();
    const seasonOf = day => T.time.season(day);
    const find = id => (hasState() ? data().board.find(n => n.id === id) || null : null);
    const activeList = () => (hasState() ? data().board.filter(n => n.state === "active") : []);
    const repTier = rep => TIERS.reduce((t, x, i) => (rep >= x.rep ? i : t), 0);
    const dayTier = day => TIERS.reduce((t, x, i) => (day >= x.day ? i : t), 0);
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
        if (hunts && !T.api("Hunting")) return false;
        for (const r of tpl.req) if (r.item && !item(r.item)) return false;
        return true;
    }
    // one notice of template `tpl` at `tier`
    function makeNotice(tpl, tier, R, ctx) {
        const { BOUNTIES, GIVERS, EV, KILL_EV, BASE } = D();
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
            for (const tpl of D().TEMPLATES) {
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
    const reqName = q => (q.k === "item" ? itemName(q.id) : q.k === "bounty" ? D().BOUNTIES[q.key].name : cap(D().BEASTS[q.kind].few) + " upolowane");
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
        if (opts && opts.debt && T.call("Story", "isOpen")) toDebt = T.call("Story", "pay", n.gold) || 0;
        const xp = T.call("Combat", "gainXp", n.xp, "zlecenie", true) || 0;
        const before = d.rep;
        d.rep = clamp(d.rep + n.rep, 0, 100);
        if (n.gift) $gameParty.gainItem(item(n.gift[0]), n.gift[1]);
        let die = null;
        const TD = T.api("TavernDice");
        if (n.die && TD && typeof TD.giveDie === "function") {
            try { die = TD.giveDie(n.die) ? n.die : null; } catch (e) { die = null; }
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
        const J = T.api("Journal"), G = D().GIVERS[n.giver];
        if (J && J.addNote) {
            if (tpl && tpl.note) J.addNote(tpl.note[0], tpl.note[1]);
            else J.addNote("Zlecenie: " + n.title, "Dla: " + G.name + " (" + G.role + "). Wykonane w dniu " + today() + ".\n" +
                "Oddałem: " + n.req.map(q => reqName(q) + " " + q.n).join(", ") + ".\nZapłata: " + n.gold + " G" + (toDebt ? " (od razu na poczet długu dziadka)" : "") +
                ", " + n.xp + " dośw., sława +" + n.rep + (n.gift ? ", " + itemName(n.gift[0]) + " ×" + n.gift[1] : "") + ".");
        }
        const res = { id, gold: n.gold, xp, rep: n.rep, repBefore: before, repAfter: d.rep, gift: n.gift, die, toDebt, tierUp: repTier(d.rep) > repTier(before) ? TIERS[repTier(d.rep)].name : null };
        for (const fn of listeners) { try { fn(n, res); } catch (e) { console.error(e); } }
        T.emit("questDone", { id: n.id, kind: n.type, gold: n.gold, title: n.title, giver: n.giver, xp, rep: n.rep, toDebt });
        T.call("Journal", "evaluateGoals");
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
        T.popup(text, { top: true, color, sub });
    }
    function track(id) {
        const d = data(), n = id ? find(id) : null;
        d.track = n && n.state === "active" ? n.id : null;
        return d.track;
    }

    // kills: Hunting.js tells every one on the bus (the hero's, the dog's)
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
    T.on("kill", e => onKill(e.animal), { owner: PLUGIN });

    // ------------------------------------------------------------------
    // On the map: the terms, a new board, "you have everything", the wanted animals - every 30 frames (scene._qbT counts the map
    // scene's frames: a new one starts at 0, and the wanted animals wait for 180 of them)
    // ------------------------------------------------------------------
    T.onMapUpdate(scene => {
        if (!$gameSystem || !$gameMap) return;
        scene._qbT = (scene._qbT || 0) + 1;
        if (scene._qbT % 30 !== 0 || !hasState()) return;
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
        updateBounties(scene);
    }, { owner: PLUGIN, name: "board" });

    // a wanted animal: on its map, in its hours, somewhere 11-16 tiles off, once the map has been up for a few seconds
    function updateBounties(scene) {
        const H = T.api("Hunting");
        if (!H || !H.spawn || scene._qbT < 180) return;
        if (!T.isCalm(scene, { only: ["event", "transfer"] })) return;
        for (const n of activeList()) {
            const q = n.req.find(r => r.k === "bounty");
            if (!q || q.got >= 1 || q.map !== $gameMap.mapId()) continue;
            const B = D().BOUNTIES[q.key];
            const sp = H.SPECIES[B.kind], h = T.time.hour();
            if (!sp || !sp.hours.some(([a, b]) => h >= a && h < b)) continue;
            if (H.animals.some(a => a._qbBounty === n.id && !a._dead)) continue;
            spawnBounty(n.id);
        }
    }
    function bountySpot(minD, maxD) {
        const px = $gamePlayer.x, py = $gamePlayer.y, spots = [], F = T.api("Farming");
        for (let y = 1; y < $gameMap.height() - 1; y++) for (let x = 1; x < $gameMap.width() - 1; x++) {
            const dd = Math.hypot(x - px, y - py);
            if (dd < minD || dd > maxD) continue;
            if (!$gameMap.checkPassage(x, y, 0x0f)) continue;
            if ($gameMap.eventsXy(x, y).some(e => e.isNormalPriority())) continue;
            if (F && (F.buildingAt(x, y) || (F.hasObjectTile && F.hasObjectTile(x, y)))) continue;
            spots.push([x, y]);
        }
        return spots.length ? spots[Math.floor(Math.random() * spots.length)] : null;
    }
    function spawnBounty(id, at) {
        const n = find(id), H = T.api("Hunting");
        const q = n && n.req.find(r => r.k === "bounty");
        if (!q || !H) return null;
        const B = D().BOUNTIES[q.key], spot = at || bountySpot(11, 16) || bountySpot(6, 30);
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
        T.audio.se(B.kind === "wolf" ? "Wolf" : "Monster3", { volume: 70, pitch: B.kind === "wolf" ? 85 : 75 });
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
    const boardFlags = new WeakMap();
    const boardIn = src => T.tagList(src).some(t => t.name.toLowerCase() === "tavern" && t.args.raw.toLowerCase() === "board");
    function isBoardEvent(ev) {
        if (!ev || !ev.event) return false;
        if (boardFlags.has(ev)) return boardFlags.get(ev);
        const d = ev.event(), p = d && d.pages && d.pages[0];
        const yes = !!d && (boardIn(d.note || "") || (!!p && boardIn({ list: p.list || [] })));
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
        const S = P.Scene;
        if (!S) { console.error("QuestBoard.js: brak QuestBoard_Scene.js (the board's scene)"); return false; }
        if (!(SceneManager._scene instanceof S)) SceneManager.push(S);
        return true;
    }

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
            out.push({ label: n.title, icon: q.k === "item" ? iconOf(q.id) : iconOf(D().BEASTS[q.kind].icon), mark: isReady(n) ? "ready" : d.track === n.id ? "pin" : "todo",
                right: isReady(n) ? "gotowe" : Math.max(0, daysLeft(n)) + " " + dniWord(Math.max(0, daysLeft(n))), contract: n });
        }
        for (const h of d.history.slice(0, 15)) {
            const q = (h.req || [])[0];
            out.push({ label: h.title, icon: q ? (q.k === "item" ? iconOf(q.id) : iconOf(D().BEASTS[q.kind].icon)) : 0, mark: h.state === "done" ? "done" : "locked",
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
            const h = it.hist, G = D().GIVERS[h.giver];
            return [{ k: "title", text: h.title }, { k: "sub", text: (G ? G.name + ", " + G.role : "") + "  ·  dzień " + h.day }, { k: "rule" },
                { k: "p", text: h.state === "done" ? "Wykonane. Zapłata: " + h.gold + " G, " + h.xp + " dośw., sława +" + h.rep + "." : h.state === "failed" ? "Termin minął. Sława " + h.rep + "." : "Porzucone. Sława " + h.rep + "." }];
        }
        const n = it.contract, G = D().GIVERS[n.giver], d = data(), J = T.api("Journal");
        const ops = [{ k: "title", text: n.title, icon: it.icon }, { k: "sub", text: G.name + ", " + G.role + "  ·  " + (isReady(n) ? "gotowe do oddania" : "do dnia " + n.due + " (" + daysText(n) + ")") }, { k: "rule" },
            { k: "p", text: n.text }, { k: "gap", n: 8 }, { k: "h", text: "Potrzeba" }];
        for (const q of n.req) {
            const src = q.k === "item" && J && J.sourceLines ? (J.sourceLines(q.id)[0] || "") : "";
            ops.push({ k: "cost", icon: q.k === "item" ? iconOf(q.id) : iconOf(D().BEASTS[q.kind].icon), name: reqName(q) + (q.map ? " (" + placeName(q.map) + ")" : ""), have: Math.min(have(q), q.n), need: q.n,
                note: q.k === "item" && have(q) < q.n ? src : q.k === "bounty" ? "Grasuje " + placeWhere(q.map) + ", " + D().BOUNTIES[q.key].hint + "." : "" });
        }
        ops.push({ k: "gap", n: 8 }, { k: "h", text: "Nagroda" },
            { k: "row", text: n.gold + " G  ·  " + n.xp + " dośw.  ·  sława +" + n.rep + (n.gift ? "  ·  " + itemName(n.gift[0]) + " ×" + n.gift[1] : "") });
        ops.push({ k: "gap", n: 8 }, { k: "muted", text: "Oddajesz je przy tablicy zleceń w tawernie „Pod Złotym Kuflem”. " + (d.track === n.id ? "Śledzisz je w okienku celu. OK: przestań śledzić." : "OK: śledź je w okienku celu na ekranie.") });
        return ops;
    }
    const JOURNAL = T.api("Journal");
    if (JOURNAL && JOURNAL.addTab) {
        JOURNAL.addTab({
            name: "Zlecenia",
            items: () => journalItems(),
            detail: it => ({ ops: journalOps(it) }),
            legend: () => { const d = hasState() ? data() : { rep: 0, stats: { done: 0 } }; return "Sława " + d.rep + "/100  ·  " + TIERS[repTier(d.rep)].name + "  ·  wykonane: " + d.stats.done; },
            help: "OK: śledź na ekranie   ←/→: zakładka",
            ok: it => { if (it && it.contract && it.contract.state === "active") { track(data().track === it.contract.id ? null : it.contract.id); SoundManager.playOk(); } }
        });
    }
    if (JOURNAL && JOURNAL.addTrackerSource) {
        JOURNAL.addTrackerSource(() => {
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
    // Plugin commands, the API (the tables and the scene come from the parts as they are asked for)
    // ------------------------------------------------------------------
    function addRep(k) {
        const d = data();
        d.rep = clamp(d.rep + (Number(k) || 0), 0, 100);
        return d.rep;
    }
    PluginManager.registerCommand(PLUGIN, "open", () => open());
    PluginManager.registerCommand(PLUGIN, "addRep", args => addRep(args.amount));

    // for QuestBoard_Art.js and QuestBoard_Scene.js
    P.core = { data, hasState, failDue, checkCycle, activeList, accept, turnIn, abandon, track, isReady, rowDone, have, daysLeft, daysText, reqName, repTier,
        iconOf, itemName, placeName, dniWord, cycleOf, today, Rng, TIERS, SLOTS, MAX_ACTIVE, REFRESH_DAYS, REP_ABANDON };

    const api = {
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
        TIERS, SLOTS, MAX_ACTIVE, REFRESH_DAYS
    };
    // (from the parts: the tables, the layout, the scene)
    const fromPart = (name, get) => Object.defineProperty(api, name, { enumerable: true, get });
    fromPart("TEMPLATES", () => D().TEMPLATES);
    fromPart("GIVERS", () => D().GIVERS);
    fromPart("BOUNTIES", () => D().BOUNTIES);
    fromPart("BEASTS", () => D().BEASTS);
    fromPart("EV", () => D().EV);
    fromPart("LAYOUT", () => (P.art ? P.art.L : null));
    fromPart("Scene_QuestBoard", () => P.Scene || null);
    window.QuestBoard = T.register(PLUGIN, api);
})();
