//=============================================================================
// Garnizon.js
//=============================================================================
// PAKIET D (docs/miejsca_wyspy/PAKIETY.md, KONCEPCJA.md point 6) - the engine of "Garnizon nad zatoką" (Map162, the captain's
// quarters Map163). The royal army of the mainland (the white banner with the phoenix), quartered here by the Lord's leave. The data:
// Garnizon_Data.js (the residents 945-947, the quests K52/D26/D27, the buying, the soldiers). This plugin:
//   - the place is built: Wyspa.ready(162) once data/Map162.json is the real map (its note <Garnizon:mapa>) - then the harbour's
//     bottom edge leads here (Wyspa.js)
//   - the soldiers (ids 640-647, Map162): a day by the clock like TownLife's residents (the gate, the pier and the boat, the barrels,
//     the drill, the smithy, the tower, the fire, the tents), barks, talks; two night sentries see like the manor's guard (W1)
//   - the favour of the garrison 0-100 (start 20, the save: Tawerna.state "garnizon"): 40 - the pass to the wreck (flag glejtWrak),
//     60 - the garrison's smith sells arrows and steel, 80 - two soldiers defend the tavern in Act III (Act3Data.DEFENDERS), under 10
//     - a patrol on the road searches the hero's bag
//   - the military buying at Kłos (after K52): grain, vegetables, smoked meat and fish, hides, arrows, wood, charcoal; x1.5 for a week
//     after each wave; in the hungry week after the requisition (D14) every day of selling food costs the town's opinion
//   - the talks (the core's Tawerna.talk: a takeover at "owner" priority; Kłos's menu takes others' options): the first meetings (the
//     captain: "Ile masz lat? ...Jeszcze nie."), the menus, the list of the missing (the father's banner: only the word "zaginiony"), the pass; the hero is never conscripted
//   - D26 (the recruits: help / warn / the ship's log), D27 (the grain: bought at night from Kłos or carried out of the granary past the
//     sentries; Kłos given up or kept quiet) - the thread "garnizon" (Garnizon_Data.js, the engine Watki.js): the state, the quests,
//     their talks and actions as data; here the hooks they name
//   - the sandbar (Map162 rows 20-21): sea tiles; at low tide (Wyspa.tide, switch 20) the wet sand shows (img/system/Garnizon_Lacha.png)
//     and one can walk on it to the wreck (Map165, only once Wyspa.isReady(165)); otherwise "Łacha pod wodą."
//   - the quarters' door (7-20), the guarded water barrels (only a bubble - the drought), the kitchen, the stocks (a night in them for a
//     caught thief)
// No water for the hero anywhere here.

/*:
 * @target MZ
 * @plugindesc [pakiet D] Garnizon nad zatoką (mapy 162, 163): żołnierze, przychylność garnizonu, skup wojskowy, pobór, zboże z rekwizycji, łacha do wraku w odpływie. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Garnizon_Data
 * @orderAfter Wyspa
 *
 * @help
 * ============================================================================
 * Garnizon.js - garnizon nad zatoką (pakiet D)
 * ============================================================================
 * Mapa 162 „Garnizon nad zatoką” (na południe od przystani) i 163 „Kwatera
 * rotmistrza”. Chorągiew królewska z lądu (feniks), za zgodą Lorda.
 *
 * - żołnierze (zdarzenia 640-647) żyją według zegara: brama, pomost, beczki,
 *   musztra, kuźnia, wieża, ognisko; nocą dwaj wartownicy widzą jak strażnik
 *   dworu;
 * - przychylność garnizonu 0-100 (start 20): 40 - glejt na wrak, 60 - kowal
 *   garnizonu sprzedaje strzały i stal, 80 - dwóch żołnierzy broni tawerny
 *   w Akcie III, poniżej 10 - patrol na drodze przeszukuje torbę;
 * - skup wojskowy u kwatermistrza (po K52), półtora raza drożej przez tydzień
 *   po fali z promu, w tygodniu głodu sprzedaż jedzenia kosztuje Opinię;
 * - zadania K52, D26, D27 (TownQuests), łacha do wraku tylko w odpływie.
 * Bohater nie jest wcielany. Wody w garnizonie nie ma (beczki pod strażą).
 *
 * W skryptach: Garnizon.favor(), Garnizon.addFavor(n), Garnizon.state(),
 * Garnizon.priceOf(id), Garnizon.barOpen(), Garnizon.sync().
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("garnizon");   // (the words of this file: js/teksty/garnizon.txt, kod.*)

    const T = window.Tawerna;
    if (!T) throw new Error("Garnizon.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const D = window.GarnizonData;
    if (!D) throw new Error("Garnizon.js: brak Garnizon_Data.js - musi być wyżej na liście wtyczek (the garrison's data is missing)");
    const PLUGIN = "Garnizon";
    // the thread (Garnizon_Data.js, the engine Watki.js): the state "garnizon", K52 / D26 / D27 with their talks and actions, the flags
    const w = Watki.get("garnizon");
    if (!w) throw new Error("Garnizon.js: brak wątku „garnizon” (Garnizon_Data.js / Watki.js)");
    const MAP = D.MAP, QUARTERS = D.QUARTERS, TOWN = D.TOWN, PODG = D.PODGRODZIE, WRECK = 165, F = D.FAVOR;
    const COIN_ICON = 314;
    const { HERO, C, choiceTo } = Watki.mowa;
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem;
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const TL = () => T.api("TownLife") || window.TownLife || null;
    const WY = () => T.api("Wyspa") || window.Wyspa || null;
    const onMap = id => !!(window.$gameMap && $gameMap.mapId() === id);
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const inHours = (h, a, b) => (a <= b ? h >= a && h < b : h >= a || h < b);
    const isNight = () => inHours(hour(), 22, 6);

    // ------------------------------------------------------------------
    // The state (the save): the favour and what happened - the thread's (Garnizon_Data.js); the quests' records and flags are
    // TownQuests' (through the thread: w.flags, w.vcount...)
    // ------------------------------------------------------------------
    const S = () => w.S();
    const flags = () => w.flags();
    function setFlag(k) { w.setFlag(k); w.autoChecks(); }   // (a flag and at once the quests' checks and markers)
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const qRec = id => w.rec(id);
    const vstate = () => { const q = w.qstate(); return q ? q.v : {}; };
    const vcount = k => w.vcount(k);
    const vgive = (k, n) => { const v = vstate(); v[k] = (v[k] || 0) + n; };   // (n as given - 0 adds nothing)
    const opinion = (n, why) => { const q = TQ(); return q && q.addOpinion ? q.addOpinion(n, why) || 0 : 0; };

    // ------------------------------------------------------------------
    // The favour of the garrison (0-100)
    // ------------------------------------------------------------------
    const favor = () => (has() ? S().favor : F.start);
    const TH_TEXT = {
    };
    Watki.scal(TH_TEXT, "garnizon", "progi");   // (its words: js/teksty/garnizon.txt, progi)
    function addFavor(n, why, quiet) {
        if (!has() || !n) return 0;
        const s = S(), before = s.favor;
        s.favor = Math.max(0, Math.min(100, before + n));
        const got = s.favor - before;
        if (!got) return 0;
        if (!quiet) T.popup(Watki.wstaw(TK.kod.addFavor[0], { "1": got > 0 ? "+" : "", got: got }), { kind: got > 0 ? "good" : "bad" });
        for (const t of [40, 60, 80]) {
            if (before < t && s.favor >= t && !s.th[t]) {
                s.th[t] = day();
                T.popup(TH_TEXT[t][0], { top: true, color: "#ffe27a", sub: TH_TEXT[t][1] });
                note(Watki.wstaw(TK.kod.addFavor[1], { "1": TH_TEXT[t][0].toLowerCase() }), TH_TEXT[t][1]);
            }
        }
        T.emit("garnizonFavor", { favor: s.favor, change: got, why: why || "" });
        return got;
    }
    function favorWord(v) {
        const f = v === undefined ? favor() : v;
        return TK.kod.favorWord[f >= 80 ? 0 : f >= 60 ? 1 : f >= 40 ? 2 : f >= 20 ? 3 : f >= 10 ? 4 : 5];
    }

    // ------------------------------------------------------------------
    // The calendar: the waves, the recruiter's market days, the hungry week, the nights of the kantor
    // ------------------------------------------------------------------
    const ferry = d => { const q = TQ(); return q && q.isFerry ? !!q.isFerry(d) : (d - 1) % 3 === 0; };
    // (2026-10-28, docs/PODROZNI.md 5.1) the waves are TownQuests' (10, 25, 37, 52 - always a ferry day); the data's WAVES - a fallback
    const waves = () => { const q = TQ(); return q && q.waves ? q.waves() : D.WAVES; };
    const waveWeek = (d = day()) => waves().some(w => d > w && d <= w + D.BUY_WAVE_DAYS);
    function hungerWeek(d = day()) {
        const r = qRec("D14");
        if (r && (r.s === "done" || r.s === "failed") && r.end) return d >= r.end && d < r.end + D.HUNGER_DAYS;
        const req = waves()[1] + 3;                         // (the requisition three days after the second wave: 28)
        return d >= req && d < req + D.HUNGER_DAYS;        // (the requisition happens in the world whether D14 was taken or not)
    }
    const recruitDay = (d = day()) => waves().some(w => d === w + 1);   // (the day after each wave: 11, 26, 38, 53)
    // (the recruiter's alt holds the whole market day: TownLife puts a resident on his alt map as the map loads - a hero already in
    // the town would not see him come otherwise; his alt plan keeps him "inside" outside his hours. Kłos at the kantor is an event
    // of ours, 659 - an alt switching at night would leave TownLife's resident without an event on the map)
    const kantorNight = () => has() && ((ferry(day()) && hour() >= 23) || (ferry(day() - 1) && hour() < 1.4));
    const marketNow = () => has() && recruitDay() && inHours(hour(), 8.5, 14.5);
    const klosGone = () => has() && !!flags().klosWydany;
    (function conditions() {
        const L = TL();
        if (!L || !L.addCondition) return;
        L.addCondition("garnizonRynek", () => has() && recruitDay());
    })();

    // ------------------------------------------------------------------
    // The military buying (Kłos; the captain once Kłos is gone)
    // ------------------------------------------------------------------
    function priceOf(id, d) {
        const b = D.BUY.find(x => x.id === id);
        if (!b) return 0;
        let p = b.price;
        if (waveWeek(d)) p *= D.BUY_WAVE;
        if (has() && (flags().d27Milczy || flags().d42KlosMilczy) && !klosGone()) p *= D.BUY_FRIEND;   // (2026-10-29: D42 d - Kłos told the hero knows)
        return Math.max(1, Math.round(p));
    }
    // (2026-10-24 audyt, the user's decision) the day's book: at most D.BUY_LIMIT (10) of each good a day; the rest waits for tomorrow -
    // Kłos says so in the talk, a popup over the hero when a sale stops at the limit (never a message window)
    const LIMIT = Number(D.BUY_LIMIT) > 0 ? Number(D.BUY_LIMIT) : 10;
    function skupToday() {
        const s = S(), d = day();
        if (!s.skup || s.skup.day !== d) s.skup = { day: d, n: {} };
        return s.skup;
    }
    const skupLeft = id => Math.max(0, LIMIT - (skupToday().n[id] || 0));
    const sellable = () => D.BUY.filter(b => count(b.id) > 0 && skupLeft(b.id) > 0);
    const atLimit = () => D.BUY.filter(b => count(b.id) > 0 && skupLeft(b.id) <= 0);   // (in the bag, but today's ten already taken)
    function sell(ids) {
        let gold = 0, food = false, capped = 0;
        const book = skupToday();
        for (const id of ids) {
            const have = count(id), b = D.BUY.find(x => x.id === id);
            if (!b || have <= 0) continue;
            const n = Math.min(have, skupLeft(id));
            if (n <= 0) { capped++; continue; }
            gold += n * priceOf(id);
            book.n[id] = (book.n[id] || 0) + n;
            if (b.food) food = true;
            $gameParty.loseItem(item(id), n, false);
            if (have > n) capped++;
        }
        if (!gold) { if (capped) T.popup(Watki.wstaw(TK.kod.sell[3], { n: LIMIT }), { kind: "bad" }); return 0; }
        const s = S();
        $gameParty.gainGold(gold);
        s.sold += gold;
        T.popup("+" + gold + " G", { icon: COIN_ICON, kind: "good" });
        if (capped) T.popup(Watki.wstaw(TK.kod.sell[4], { n: LIMIT }), { kind: "info" });
        if (s.saleDay !== day()) { s.saleDay = day(); addFavor(F.saleDay, "skup"); }
        if (food && hungerWeek() && s.hungerDay !== day()) {
            s.hungerDay = day();
            const got = opinion(-1, TK.kod.sell[0]);
            T.popup(Watki.wstaw(TK.kod.sell[2], { "1": got ? Watki.wstaw(TK.kod.sell[1], { got: got }) : "" }), { kind: "bad" });
        }
        return gold;
    }

    // ------------------------------------------------------------------
    // Event commands: the engine's builder (Watki.mowa with the thread's options: "\n" starts a new line, "@rotmistrz: ..." that
    // resident speaks) for the menus built here; the talks of the quests' steps, the first meetings and the captain's rows with an
    // action are the data's (Garnizon_Data.js rozmowy)
    // ------------------------------------------------------------------
    const say = (out, spk, arr) => Watki.mowa.linesTo(out, spk, arr, null, 0, w.def.mowa);
    const act = (out, args, ind) => Watki.mowa.script(out, "Garnizon.act(this, " + JSON.stringify(args) + ")", ind);
    const resident = key => { const L = TL(); return L && L.RESIDENTS ? L.RESIDENTS.find(r => r.key === key) || null : null; };
    function speaker(key) {
        const L = TL(), ev = L && L.eventOf ? L.eventOf(key) : null, r = resident(key);
        return { id: ev && $gameMap.event(ev.eventId()) === ev ? ev.eventId() : -1, name: r ? r.name : key };
    }
    function usual(key) {
        const L = TL(), t = L && L.lines ? L.lines(key) : null;
        if (!t) return "";
        const h = hour(), w = $gameScreen.weatherType(), rain = (w === "rain" || w === "storm") && $gameScreen.weatherPower() > 0;
        const slot = rain && t.rain ? "rain" : h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "evening" : "night";
        const list = t[slot] || t.day || [];
        if (!list.length) return "";
        S().usualN = (S().usualN || 0) + 1;
        return list[S().usualN % list.length];
    }
    function questWants(key) {
        const q = TQ();
        if (!q || !q.markers) return false;
        if (q.refreshMarkers) q.refreshMarkers();
        const m = q.markers()[key];
        return m === "ready" || m === "new";
    }
    const questTalk = key => { const q = TQ(); return q && q.talkFor ? q.talkFor(key, false) : null; };

    // ------------------------------------------------------------------
    // TEXTS
    // ------------------------------------------------------------------
    const TX = Watki.teksty("garnizon");

    // ------------------------------------------------------------------
    // The residents' talks (TownLife's hook, first): the menus are built here; the first meetings, the captain's rows with an action,
    // D26's deal and D27's rows are the data's (Garnizon_Data.js rozmowy - w.rozmowa)
    // ------------------------------------------------------------------
    function skupBranch(spk, who) {
        const b = [];
        const items = sellable();
        if (!items.length) return say(b, spk, atLimit().length ? TX.klosLimit : TX.klosNothing);   // (goods in the bag, the day's ten taken: "dość na dziś")
        say(b, spk, [TX.klosPrices[waveWeek() ? 1 : 0]]);
        // (a row: "Drewno ×10 z 23 - 3 G/szt. (dziennie po 10)" when the bag holds more than the day's book still takes)
        const nOf = x => Math.min(count(x.id), skupLeft(x.id));
        const labels = items.map(x => Watki.wstaw(TK.kod.skupBranch[count(x.id) > skupLeft(x.id) ? 2 : 0], { name: item(x.id).name, "2": nOf(x), "3": priceOf(x.id), "4": count(x.id), "5": LIMIT })).slice(0, 7);
        const shown = items.slice(0, 7);
        const branches = shown.map(x => act([], ["sell", [x.id]]).concat(say([], spk, [pick(TX.klosSold)])));
        labels.push(Watki.wstaw(TK.kod.skupBranch[1], { "1": shown.reduce((s, x) => s + nOf(x) * priceOf(x.id), 0) }));
        branches.push(act([], ["sell", shown.map(x => x.id)]).concat(say([], spk, [pick(TX.klosSold)])));
        labels.push("Nic.");
        branches.push([]);
        return choiceTo(b, labels, branches, labels.length - 1);
    }
    function rotmistrzTalk(ev) {
        const spk = { id: ev.eventId(), name: TK.kod.rotmistrzTalk[0] }, f = flags(), out = [], s = S();
        if (!s.met.rotmistrz) return w.rozmowa("poznanieRotmistrz", { spk });
        if (questWants("rotmistrz")) { const q = questTalk("rotmistrz"); if (q && q.length) return q; }
        say(out, spk, [pick(TX.belzaAsk)]);
        const labels = [], branches = [];
        labels.push(TK.kod.rotmistrzTalk[1]);
        branches.push(w.rozmowa("przychylnosc", { spk }));
        if (!f.glejtWrak) {
            labels.push(TK.kod.rotmistrzTalk[2]);
            branches.push(w.rozmowa("glejt", { spk }));
        }
        labels.push(TK.kod.rotmistrzTalk[3]);
        branches.push(w.rozmowa("lista", { spk }));
        labels.push(TK.kod.rotmistrzTalk[4]);
        branches.push(say([], spk, TX.whyAsk).concat(say([], spk, TX.why)));
        labels.push(TK.kod.rotmistrzTalk[5]);
        branches.push(say([], spk, TX.draftAsk).concat(say([], spk, TX.draft)));
        if (w.at("d26Ludzie") && f.dziennikOkretu && !s.d26.deal) {
            labels.unshift(TK.kod.rotmistrzTalk[6]);
            branches.unshift(w.rozmowa("d26Uklad", { spk }));
        }
        if (w.at("d27Klos")) {
            labels.unshift(TK.kod.rotmistrzTalk[7]);
            branches.unshift(w.rozmowa("d27Wydaj", { spk }));
        }
        if (klosGone()) { labels.push(TK.kod.rotmistrzTalk[8]); branches.push(say([], spk, TX.belzaSkup).concat(skupBranch(spk))); }
        labels.push("Bywaj.");
        branches.push([]);
        return choiceTo(out, labels, branches, labels.length - 1);
    }
    // (2026-10-23, docs/ROZMOWY.md) Kłos's menu and a soldier's word take the other systems' rows through the core's talk service
    // (Tawerna.talk.option - Bron.js: the quartermaster's armoury; who "kwatermistrz", "zolnierz:<role>"): Kłos's own rows first, theirs,
    // "Co słychać?", the farewell last - his lines are never taken away (the bug of 2026-10-23: a shop took his whole talk)
    function kwatTalk(ev) {
        const spk = { id: ev.eventId(), name: TK.kod.kwatTalk[0] }, f = flags(), out = [], s = S();
        if (!s.met.kwatermistrz) return w.rozmowa("poznanieKlos", { spk });
        if (questWants("kwatermistrz")) { const q = questTalk("kwatermistrz"); if (q && q.length) return q; }
        say(out, spk, [pick(TX.klosAsk)]);
        const labels = [], branches = [];
        labels.push(TK.kod.kwatTalk[1]);
        branches.push(f.k52Skup ? skupBranch(spk) : say([], spk, TX.klosNoSkup));
        if (w.at("d27Worki") && vcount("worek_zboza") < 4) {
            labels.push(TK.kod.kwatTalk[2]);
            branches.push(w.rozmowa("zboze", { spk }));
        }
        if (w.at("d27Klos")) {
            labels.unshift(TK.kod.kwatTalk[5]);
            branches.unshift(w.rozmowa("d27Milcz", { spk }));
        }
        const rows = labels.map((label, i) => ({ label, cmds: branches[i] }));
        rows.push({ label: TK.kod.kwatTalk[6], cmds: say([], spk, [usual("kwatermistrz") || TK.kod.kwatTalk[7]]), order: T.talk.ORDER.chat });
        return T.talk.menu(out, T.talk.rows("kwatermistrz", { ev }, rows), "Bywaj.");
    }
    function werbTalk(ev) {
        const spk = { id: ev.eventId(), name: TK.kod.werbTalk[0] }, out = [], s = S();
        if (!s.met.werbownik) return w.rozmowa("poznanieBeben", { spk });
        if (questWants("werbownik")) { const q = questTalk("werbownik"); if (q && q.length) return q; }
        say(out, spk, [pick(TX.bebenAsk)]);
        return choiceTo(out, [TK.kod.werbTalk[1], TK.kod.werbTalk[2], "Bywaj."],
            [say([], spk, TX.bebenDraft), say([], spk, [usual("werbownik") || "Trrrum-tum-tum."]), []], 2);
    }
    function hook(key, ev) {
        if (!has()) return null;
        if (key === "rotmistrz") return rotmistrzTalk(ev);
        if (key === "kwatermistrz") return kwatTalk(ev);
        if (key === "werbownik") return werbTalk(ev);
        return null;
    }
    // (2026-10-23, docs/ROZMOWY.md) the core's talk service: the garrison's people - an "owner" takeover after Lowy's (the arrow shown to
    // the captain) and Wrak's, as the old hooks
    function hookTalk() {
        if (hookTalk.done) return;
        hookTalk.done = true;
        T.talk.takeover({ owner: PLUGIN, who: ["rotmistrz", "kwatermistrz", "werbownik"], priority: T.talk.PRIORITY.owner,
            run: ctx => { try { return hook(ctx.who, ctx.ev); } catch (e) { console.error("[Garnizon]", e); return null; } } });
    }
    hookTalk();

    // ------------------------------------------------------------------
    // The soldiers, the recruits, the patrol, the searchers, the recruiter's list on the market (injected events)
    // ------------------------------------------------------------------
    const SHEETS = { A: "$Npc_Zolnierz", B: "$Npc_Zolnierz_B" };
    const RECRUIT_SHEETS = { bartek: "$Npc_Bartek", drwal: "$Npc_Drwal", uchodzca: "$Npc_Uchodzca" };
    const RECRUIT_NAMES = { };
    Watki.scal(RECRUIT_NAMES, "garnizon", "rekruci");   // (its words: js/teksty/garnizon.txt, rekruci)
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1,
        switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function eventData(id, name, sheet, x, y, d, script, note, opts) {
        const o = opts || {};
        const page = { conditions: Object.assign({}, BLANK), directionFix: !!o.dfix,
            image: { tileId: 0, characterName: sheet, direction: d || 2, pattern: o.pattern === undefined ? 1 : o.pattern, characterIndex: o.index || 0 },
            list: [C(355, [script]), C(0, [])], moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
            moveSpeed: o.speed || 3, moveType: 0, priorityType: o.priority === undefined ? 1 : o.priority, stepAnime: false, through: false,
            trigger: o.trigger || 0, walkAnime: o.walk !== false };
        return { id, name, note: note || "", pages: [page], x, y };
    }
    function spotsOf(events) {
        const out = {};
        for (const e of events || []) {
            const m = e && /^Miejsce:\s*(\S+)/i.exec(e.name || "");
            if (m) out[m[1]] = [e.x, e.y, e.pages && e.pages[0] && e.pages[0].image ? e.pages[0].image.direction : 2];
        }
        return out;
    }
    let spotCache = null;
    function spot(key) {
        if (!spotCache || spotCache.map !== $gameMap.mapId() || spotCache.data !== $dataMap) spotCache = { map: $gameMap.mapId(), data: $dataMap, s: spotsOf($dataMap && $dataMap.events) };
        return spotCache.s[key] || null;
    }
    // the plan's entry for an hour: { i, act, where (a spot or a list) }
    function entryAt(plan, h) {
        let i = plan.length - 1;
        for (let k = 0; k < plan.length; k++) if (plan[k][0] <= h) i = k;
        const e = plan[i];
        if (e.length === 2) return { i, act: "stand", where: e[1] };
        return { i, act: e[1], where: e[2] };
    }
    const recruitActive = key => has() && S().d26.who[key] === "help" && !!T.call("TownLife", "gone", key);
    const patrolWanted = () => has() && favor() < F.patrol && S().patrolDay !== day() && inHours(hour(), 7, 20);
    const searchDay = () => has() && S().d26.warned > 0 && day() === S().d26.warned + 1 && inHours(hour(), 8, 16);
    function buildMap(data, mapId) {
        const out = [];
        if (mapId === MAP) {
            const sp = spotsOf(data.events), h = hour();
            for (const sd of D.SOLDIERS) {
                const e = entryAt(sd.plan, h), first = Array.isArray(e.where) ? e.where[0] : e.where, at = sp[first] || [36, 12, 2];
                out.push(eventData(sd.id, sd.name, SHEETS[sd.sheet], at[0], at[1], at[2], "Garnizon.talk(this);",
                    "<Garnizon:zolnierz=" + sd.role + "><Bust:Zolnierz_Bust>"));
            }
            for (const [key, r] of Object.entries(D.RECRUITS)) {
                const at = sp[r.spot] || [30, 22, 8];
                out.push(eventData(r.id, Watki.wstaw(TK.kod.buildMap[0], { "1": RECRUIT_NAMES[key] }), RECRUIT_SHEETS[key], at[0], at[1] + 1, 8,
                    "Garnizon.talk(this);", "<Garnizon:rekrut=" + key + ">"));
            }
            out.push(eventData(D.PATROL.id, "Patrol", SHEETS.B, D.PATROL.x, D.PATROL.y, 8, "Garnizon.talk(this);", "<Garnizon:patrol><Bust:Zolnierz_Bust>"));
        } else if (mapId === TOWN) {
            const L = D.TOWN_EVENTS.list;
            out.push(eventData(L.id, TK.kod.buildMap[1], "!Town_Props", L.x, L.y, 2, "Garnizon.look(this, \"lista\");", "<Garnizon:lista><Occupy:right=1>",
                { index: 3, pattern: 2, dfix: true, walk: false }));
            D.TOWN_EVENTS.search.forEach((p, k) => out.push(eventData(p.id, TK.kod.buildMap[2], k ? SHEETS.A : SHEETS.B, p.x, p.y, 2,
                "Garnizon.talk(this);", "<Garnizon:szuka><Bust:Zolnierz_Bust>")));
            const K = D.TOWN_EVENTS.klos;
            out.push(eventData(K.id, TK.kod.buildMap[3], "$Npc_Kwatermistrz", K.x, K.y, K.d, "Garnizon.talk(this);", "<Garnizon:klos_kantor>"));
        } else if (mapId === PODG) {
            D.PODGRODZIE_EVENTS.forEach((p, k) => out.push(eventData(p.id, TK.kod.buildMap[2], k ? SHEETS.B : SHEETS.A, p.x, p.y, 2,
                "Garnizon.talk(this);", "<Garnizon:szuka><Bust:Zolnierz_Bust>")));
        }
        return out;
    }
    T.inject([MAP, TOWN, PODG], { ids: D.IDS, owner: PLUGIN, build: buildMap });

    // shown / hidden (hidden: not seen, not in the way, never starts)
    function setShown(e, on) {
        if (!e) return;
        const st = e._garn || (e._garn = { i: -1, patrol: 0, stuck: 0, wait: 0, nextBark: 0 });
        if (st.prio === undefined) { st.prio = e._priorityType; st.through = e._through; }
        if (on && st.hidden !== false) { e.setTransparent(false); e.setThrough(st.through); e._priorityType = st.prio; st.hidden = false; }
        else if (!on && st.hidden !== true) { e.setTransparent(true); e.setThrough(true); e._priorityType = 0; st.hidden = true; }
    }
    T.onEventStart(ev => !!(ev._garn && ev._garn.hidden), { owner: PLUGIN, priority: "hidden" });   // (the core's one start hook, 2026-10-23)
    const soldierOf = id => D.SOLDIERS.find(s => s.id === id) || null;
    let boatCache = null;
    function boats() {
        if (!boatCache || boatCache.events !== $gameMap._events) boatCache = { events: $gameMap._events, list: $gameMap.events().filter(e => /<Garnizon:lodz>/.test((e.event() && e.event().note) || "")) };
        return boatCache.list;
    }

    // the soldiers' day: walk to the plan's spot (Hunting's path8 + RoamingActor's steps, like TownLife), stand, glance, patrol
    const onScreen = ev => { const x = ev.screenX(), y = ev.screenY(); return x > -48 && y > -48 && x < Graphics.width + 48 && y < Graphics.height + 96; };
    const talking = ev => ev._locked || ($gameMap._interpreter.isRunning() && $gameMap._interpreter.eventId() === ev.eventId());
    function walk(ev, st, tx, ty) {
        const H = window.Hunting, RA = window.RoamingActor;
        const d = H && H.path8 ? H.path8(ev, tx, ty, { key: "garnizon" }).dir : ev.findDirectionTo(tx, ty);
        if (d > 0 && (RA ? RA.canStep(ev, ev.x, ev.y, d) : ev.canPass(ev.x, ev.y, d))) {
            if (RA) RA.step(ev, d); else ev.moveStraight(d);
            st.stuck = 0;
            return;
        }
        if (++st.stuck > (onScreen(ev) ? 900 : 120)) {
            const taken = ($gamePlayer.x === tx && $gamePlayer.y === ty) || $gameMap.eventsXyNt(tx, ty).some(o => o !== ev && o.isNormalPriority());
            if (!taken) ev.locate(tx, ty);
            st.stuck = 0;
        }
    }
    function placeSoldier(ev, sd) {
        const st = ev._garn || (ev._garn = { i: -1, patrol: 0, stuck: 0, wait: 0, nextBark: 0 });
        const e = entryAt(sd.plan, hour()), first = Array.isArray(e.where) ? e.where[0] : e.where, at = spot(first);
        st.i = e.i; st.patrol = 0; st.stuck = 0;
        if (at) { ev.locate(at[0], at[1]); ev.setDirection(at[2]); }
        setShown(ev, e.act !== "inside");
    }
    function driveSoldier(ev, sd) {
        const st = ev._garn;
        if (!st || talking(ev) || ev.isMoving()) return;
        const e = entryAt(sd.plan, hour());
        if (st.i !== e.i) { st.i = e.i; st.patrol = 0; st.stuck = 0; st.wait = 0; if (e.act !== "inside") setShown(ev, true); }
        if (st.hidden) return;
        const key = e.act === "patrol" ? e.where[st.patrol % e.where.length] : e.where, at = spot(key);
        if (!at) return;
        if (ev.x !== at[0] || ev.y !== at[1]) { walk(ev, st, at[0], at[1]); return; }
        if (e.act === "inside") { setShown(ev, false); return; }
        if (e.act === "patrol") { if (st.wait-- > 0) return; st.patrol++; st.wait = 60; return; }
        if (e.act === "work") {
            if (st.wait-- > 0) return;
            ev.setDirection(ev.direction() === at[2] ? [2, 4, 6, 8].filter(d => d !== at[2])[Math.floor(Math.random() * 3)] : at[2]);
            st.wait = ev.direction() === at[2] ? 150 + Math.floor(Math.random() * 200) : 40;
            return;
        }
        if (ev.direction() !== at[2]) ev.setDirection(at[2]);
    }
    let lastHour = null;
    function placeAll() {
        for (const sd of D.SOLDIERS) { const ev = $gameMap.event(sd.id); if (ev) placeSoldier(ev, sd); }
    }
    // barks: a soldier near the hero calls out now and then
    let nextBarkAny = 0;
    function bark(ev, role) {
        const st = ev._garn, now = Graphics.frameCount, SB = T.api("SpeechBubbles");
        if (!SB || !st || st.hidden || now < (st.nextBark || 0) || now < nextBarkAny || $gameMap.isEventRunning()) return;
        if (Math.hypot(ev.x - $gamePlayer.x, ev.y - $gamePlayer.y) > 4.5) return;
        st.nextBark = now + 900 + Math.floor(Math.random() * 900);
        const list = (isNight() ? TX.soldierBarks.noc : TX.soldierBarks[role]) || [];
        if (!list.length) return;
        SB.say(ev, pick(list));
        nextBarkAny = now + 300;
    }

    // ------------------------------------------------------------------
    // The night sentries: they see like the manor's guard (TownQuests' W1) - close by, in front, or a hero not sneaking
    // ------------------------------------------------------------------
    function sees(w, p, sneak) {
        const v = [[0, 0], [0, 1], [0, 0], [-1, 0], [0, 0], [1, 0], [0, 0], [0, -1]][w.direction() - 1] || [0, 1];
        const d = Math.hypot(w.x - p.x, w.y - p.y), ahead = ((p.x - w.x) * v[0] + (p.y - w.y) * v[1]) / Math.max(0.01, d);
        return d < 1.6 || (ahead > 0.5 && d < (sneak ? 3.5 : 6)) || (!sneak && d < 4);
    }
    function sentries() {
        const out = [];
        for (const sd of D.SOLDIERS) {
            if (!sd.sentry || !inHours(hour(), sd.sentry[0], sd.sentry[1])) continue;
            const ev = $gameMap.event(sd.id);
            if (ev && ev._garn && !ev._garn.hidden) out.push(ev);
        }
        return out;
    }
    const seenBy = () => { const sneak = !!T.call("Hunting", "sneaking"); return sentries().find(w => sees(w, $gamePlayer, sneak)) || null; };
    let pendingCaught = null;
    function caught(by) {
        const s = S();
        s.d27.caught++;
        s.d27.carry = 0;
        const v = vstate();
        delete v.worek_zboza;
        pendingCaught = by ? by.eventId() : 0;
    }
    // a night in the stocks: the morning (7:00), the hero by the stocks, the captain's word
    function runCaught(id) {
        const ev = id ? $gameMap.event(id) : null, spk = { id: ev ? id : -1, name: ev ? ev.event().name : "Wartownik" };
        const out = [];
        say(out, spk, TX.caught);
        out.push(C(221, []));
        act(out, ["stocks"]);
        out.push(C(222, []));
        const rot = T.call("TownLife", "eventOf", "rotmistrz");
        say(out, spk, rot ? TX.stocksMorning : TX.stocksNoRot);
        out.push(C(0, []));
        $gameMap._interpreter.setup(out, id || 0);
    }

    // ------------------------------------------------------------------
    // The sandbar (rows 20-21): at low tide sand to walk on, to the wreck
    // ------------------------------------------------------------------
    const BAR = D.BAR;
    const barCell = (x, y) => y >= BAR.rows[0] && y <= BAR.rows[1] && x >= BAR.x0 && x <= BAR.x1;
    const tideLevel = () => { const W = WY(); return W && W.tide ? W.tide().level : 1; };
    const lowTide = () => { const W = WY(); return !!(W && W.tide && W.tide().low); };
    const heroOnBar = () => onMap(MAP) && barCell(Math.round($gamePlayer._realX), Math.round($gamePlayer._realY));
    const barOpen = () => lowTide() || heroOnBar();
    const _Game_Map_isPassable = Game_Map.prototype.isPassable;
    Game_Map.prototype.isPassable = function(x, y, d) {
        if (this.mapId() === MAP && barCell(x, y) && has() && barOpen()) return true;
        return _Game_Map_isPassable.call(this, x, y, d);
    };
    // the wet sand over the sea (img/system/Garnizon_Lacha.png, made by tools/garnizon/build.py): above the red tint, below the people
    class Sprite_Lacha extends Sprite {
        constructor() {
            super(ImageManager.loadSystem(BAR.picture));
            this.z = 0.6;
            this.alpha = 0;
        }
        update() {
            super.update();
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            this.x = Math.round($gameMap.adjustX(BAR.px) * tw);
            this.y = Math.round($gameMap.adjustY(BAR.py) * th);
            const lv = tideLevel(), a = lv <= BAR.fadeFrom ? 1 : lv >= BAR.fadeTo ? 0 : 1 - (lv - BAR.fadeFrom) / (BAR.fadeTo - BAR.fadeFrom);
            this.alpha += (a - this.alpha) * 0.05;
        }
    }
    const _Spriteset_Map_createTilemap = Spriteset_Map.prototype.createTilemap;
    Spriteset_Map.prototype.createTilemap = function() {
        _Spriteset_Map_createTilemap.call(this);
        if ($gameMap.mapId() === MAP && this._tilemap) { this._garnLacha = new Sprite_Lacha(); this._tilemap.addChild(this._garnLacha); }
    };
    // the water comes back while the hero stands on the bar: a word once
    let barWarned = false;
    function barTick() {
        if (!heroOnBar()) { barWarned = false; return; }
        if (!lowTide() && !barWarned) { barWarned = true; T.popup(TX.looks.lachaWraca, { kind: "bad" }); }
    }

    // ------------------------------------------------------------------
    // The map's own events' scripts: talk, look, the granary, the bar, the door
    // ------------------------------------------------------------------
    function soldierTalk(interp, ev) {
        const note = (ev.event() && ev.event().note) || "", out = [];
        const spk = { id: ev.eventId(), name: ev.event().name };
        let m = /<Garnizon:zolnierz=(\w+)>/.exec(note);
        if (m) {
            const role = m[1];
            if (role === "kowal") {
                if (favor() >= F.smith) {
                    say(out, spk, TX.soldier.kowalShop);
                    const labels = D.SMITH.map(x => item(x.id).name + " ×" + x.n + " - " + x.price * x.n + " G").concat(["Nic."]);
                    choiceTo(out, labels, D.SMITH.map(x => act([], ["smith", x.id])).concat([[]]), labels.length - 1);
                } else say(out, spk, TX.soldier.kowal);
            } else if (role === "beczki") {
                T.popup(TX.barrels, { kind: "info" });
                say(out, spk, [pick(TX.soldier.beczki)]);
            } else if (isNight() && soldierOf(ev.eventId()) && soldierOf(ev.eventId()).sentry) {
                say(out, spk, [pick(TX.soldier.bramaNoc)]);
            } else say(out, spk, [pick(TX.soldier[role] || TX.soldier.cwiczy)]);
            const extra = T.talk.rows("zolnierz:" + role, { ev }), said = extra.find(r => r.say);
            if (said) say(out, spk, [said.say]);
            if (extra.length) T.talk.menu(out, extra, "Bywaj.");
            return out;
        }
        m = /<Garnizon:rekrut=(\w+)>/.exec(note);
        if (m) return say(out, spk, TX.recruit[m[1]] || ["..."]);
        if (/<Garnizon:patrol>/.test(note)) {
            say(out, spk, TX.patrol);
            act(out, ["patrol"]);
            return out;
        }
        if (/<Garnizon:szuka>/.test(note)) return say(out, spk, [pick(TX.search)]);
        if (/<Garnizon:klos_kantor>/.test(note)) return say(out, spk, w.at("d27Worki") ? TX.klosKantorD27 : TX.klosKantor);
        return out;
    }
    function talk(interp) {
        if (!has() || !interp) return;
        const ev = $gameMap.event(interp.eventId());
        if (!ev || (ev._garn && ev._garn.hidden)) return;
        const out = soldierTalk(interp, ev);
        if (out && out.length) interp.setupChild(out.concat([C(0, [])]), ev.eventId());
    }
    const popupOnce = (() => { const last = {}; return (k, text, kind) => { if (last[k] > Graphics.frameCount - 60) return; last[k] = Graphics.frameCount; T.popup(text, { kind: kind || "info" }); }; })();
    function look(interp, what) {
        if (!has()) return;
        if (what === "beczki") {
            popupOnce("beczki", TX.barrels);
            const g = $gameMap.event(643);
            const SB = T.api("SpeechBubbles");
            if (g && SB && !(g._garn && g._garn.hidden) && Math.hypot(g.x - $gamePlayer.x, g.y - $gamePlayer.y) < 7) SB.say(g, TX.barrels);
            return;
        }
        if (what === "lista") {
            if (marketNow()) popupOnce("lista", TK.kod.look[0]);
            return;
        }
        const t = TX.looks[what];
        if (t) popupOnce(what, t);
    }
    // the granary's door: shut by day; at night (D27) the hero may carry four sacks out past the sentries
    function granary(interp) {
        if (!has()) return;
        const s = S();
        if (!isNight()) { popupOnce("spichlerz", TX.looks.spichlerz); return; }
        if (!w.at("d27Worki") || vcount("worek_zboza") >= 4) { popupOnce("spichlerz", TX.looks.spichlerzNoc); return; }
        const guard = seenBy();
        if (guard) { caught(guard); return; }
        vgive("worek_zboza", 4 - vcount("worek_zboza"));
        s.d27.stolen = day();
        s.d27.carry = 1;
        T.popup(TK.kod.granary[0], { icon: 74, kind: "good" });
        const out = say([], HERO, TX.granaryTake);
        if (interp) interp.setupChild(out.concat([C(0, [])]), interp.eventId());
    }
    // the bar's end (0, 20-21): the wreck at low tide, once its map is built
    function bar(interp, y) {
        if (!has()) return;
        if (!barOpen()) { popupOnce("lacha", TX.looks.lachaPodWoda); return; }
        const W = WY();
        if (!(W && W.isReady && W.isReady(WRECK))) { popupOnce("lacha", TX.looks.lachaDalej); return; }
        AudioManager.playSe({ name: "Water1", volume: 50, pitch: 110, pan: 0 });
        $gamePlayer.reserveTransfer(WRECK, 78, y === 21 ? 21 : 20, 4, 0);   // (2026-10-18: the wreck's map doubled to 80x60 - one inside its east edge)
    }
    // the quarters' door: 7-20 into Map163, else shut
    function door(interp) {
        if (!has()) return;
        const h = hour();
        if (!inHours(h, 7, 20)) { popupOnce("drzwi", TX.looks.drzwiZamkniete); return; }
        AudioManager.playSe({ name: "Door1", volume: 80, pitch: 100, pan: 0 });
        $gamePlayer.reserveTransfer(QUARTERS, D.QUARTERS_LANDING[0], D.QUARTERS_LANDING[1], 8, 0);
    }

    // ------------------------------------------------------------------
    // The script calls from the menus built here: Garnizon.act(this, [what, ...]) (the data's talks: Watki.act(this, ["garnizon",
    // akcja]); the old names of their actions - a talk saved before 2026-10-28 - go to the same actions)
    // ------------------------------------------------------------------
    const MET = { rotmistrz: "poznalRotmistrz", kwatermistrz: "poznalKlos", werbownik: "poznalBeben" };
    const OLD = { favorInfo: "przychylnosc", glejt: "glejt", missing: "lista", grain: "zboze" };
    const stopOf = interp => () => { if (interp && interp._list) interp._index = interp._list.length; };
    function actCall(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        const [what, a] = args, s = S(), f = flags();
        const stop = stopOf(interp);
        try {
            if (what === "met") {
                if (MET[a]) w.akcja(MET[a], [], interp);
                else if (!s.met[a]) s.met[a] = day();
            } else if (Object.prototype.hasOwnProperty.call(OLD, what)) {
                w.akcja(OLD[what], [], interp);
            } else if (what === "sell") {
                sell([].concat(a || []));
            } else if (what === "smith") {
                const x = D.SMITH.find(o => o.id === a);
                if (!x) return;
                const cost = x.price * x.n;
                if ($gameParty.gold() < cost) { T.popup.need(COIN_ICON, Watki.wstaw(TK.kod.actCall[4], { cost: cost })); stop(); return; }
                $gameParty.loseGold(cost);
                $gameParty.gainItem(item(x.id), x.n);
                s.smith += cost;
            } else if (what === "patrol") {
                s.patrolDay = day();
                const out = [], spk = { id: interp ? interp.eventId() : -1, name: "Patrol" };
                if (!f.rochMet) { addFavor(F.stonesSeen, TK.kod.actCall[12]); say(out, spk, TX.patrolPendant); }
                else {
                    if ($gameParty.gold() >= 5) { $gameParty.loseGold(5); T.popup(TK.kod.actCall[13], { icon: COIN_ICON, kind: "bad" }); }
                    say(out, spk, TX.patrolClean);
                }
                if (interp && out.length) interp.setupChild(out.concat([C(0, [])]), interp.eventId());
                const ev = interp ? $gameMap.event(interp.eventId()) : null;
                if (ev) setShown(ev, false);
            } else if (what === "stocks") {
                $gameSystem.sleepUntilHour(7);
                $gamePlayer.locate(46, 19);
                $gamePlayer.setDirection(2);
                s.stocks = day();
                addFavor(F.caught, TK.kod.actCall[14]);
                if (window.$gameScreen) $gameScreen.clearWeather && $gameScreen.clearWeather();
                lastHour = null;
                placeAll();
                const L = TL();
                if (L && L.placeAll) L.placeAll();
                note(TK.kod.actCall[15], TK.kod.actCall[16]);
            }
        } catch (e) { console.error("[Garnizon] act " + JSON.stringify(args), e); }
    }

    // ------------------------------------------------------------------
    // The hooks the thread's data names (Garnizon_Data.js): D26, D27, the talks' words, conditions and actions
    // ------------------------------------------------------------------
    const d26List = () => D.D26_LIST.slice();
    const d26Resolved = () => d26List().filter(k => S().d26.who[k]).length;
    // D26: one of the list helped to the army (+10 G from the recruiter, gone to the garrison for a while) or warned (hidden two days)
    function d26Decide(key, how) {
        if (!w.at("d26Ludzie")) return;
        const s = S();
        if (s.d26.who[key]) return;
        s.d26.who[key] = how;
        if (how === "help") {
            $gameParty.gainGold(10);
            T.popup(TK.d26.zloto, { icon: COIN_ICON, kind: "gold" });
            addFavor(F.d26Help, TK.powody.pobor);
            opinion(-3, w.Q.D26.title);
            T.call("TownLife", "setGone", key, day() + D.RECRUIT_STAY);
            setFlag("d26Wzieci");
        } else {
            s.d26.warned = day();
            addFavor(Math.round(F.d26Warn / 3), TK.powody.pobor);
            opinion(3, w.Q.D26.title);
            T.call("TownLife", "setGone", key, day() + 2);
            setFlag("d26Ostrzezeni");
        }
        const q = TQ();
        if (q && q.autoChecks) q.autoChecks();
    }
    w.haki({
        // "@rotmistrz: ..." in a talk: that resident says it
        mowca: (ctx, key) => speaker(key),
        // D26: the day after a wave (the offer); the list in the step's text; the marker over one of the list not settled yet, or over
        // the captain while the ship's log waits; the step's talk with one of the list; TownQuests.act's "fx" (an old talk: deal / help / warn)
        dzienWerbunku: () => recruitDay(),
        d26Lista: () => {
            const s = S();
            return d26List().map(k => RECRUIT_NAMES[k] + (s.d26.who[k] === "help" ? TK.d26.zglosil : s.d26.who[k] === "warn" ? TK.d26.ukryty : "")).join(", ");
        },
        d26Znacznik: (ctx, Q, r, st, key) => (d26List().includes(key) && !S().d26.who[key]) || (key === "rotmistrz" && !!flags().dziennikOkretu && !S().d26.deal),
        d26Rozmowa: (ctx, Q, r, st, key, spk) => (!d26List().includes(key) || S().d26.who[key] ? null : { ready: true, list: w.rozmowa("d26", { spk, key }) }),
        d26Odpowiedz: (ctx, jak) => { const t = TK.d26[jak] || {}; return [t[ctx.key] || t.inny]; },
        d26Decyzja: (ctx, key, how) => d26Decide(key, how),
        d26Akcja: (ctx, Q, b, interp) => {
            if (!b) return;
            if (b.how === "deal") w.akcja("d26Uklad", [], interp);
            else d26Decide(b.key, b.how);
        },
        // D27: after the requisition (the offer from day 28, D14 not running); the sacks; the marker for the last step; TownQuests.act's "fx"
        odDnia: (ctx, n) => day() >= n,
        czteryWorki: () => vcount("worek_zboza") >= 4,
        workow: () => Math.min(4, vcount("worek_zboza")),
        d27Znacznik: (ctx, Q, r, st, key) => key === "rotmistrz" || (key === "kwatermistrz" && !klosGone()),
        d27Akcja: (ctx, Q, how, interp) => w.akcja(how === "accuse" ? "d27Wydaj" : "d27Milcz", [], interp),
        linie: (ctx, key, a, b) => [].concat(w.tekst(key) || []).slice(a, b),
        stac: (ctx, cost) => $gameParty.gold() >= cost,
        brakGrosza: (ctx, cost) => { T.popup.need(COIN_ICON, Watki.wstaw(TK.kod.actCall[4], { cost: cost })); stopOf(ctx.interp)(); },
        zaplac: (ctx, cost) => { $gameParty.loseGold(cost); },
        dopelnijWorki: () => vgive("worek_zboza", Math.max(0, 4 - vcount("worek_zboza"))),
        klosOdchodzi: () => { T.call("TownLife", "setGone", "kwatermistrz", true); },
        sprawdzZadania: () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); },
        // the favour: up / down (why: a key of the words), the captain's word about it (a popup)
        dodajPrzychylnosc: (ctx, n, why) => { addFavor(n, w.tekst(why)); },
        przychylnoscSlowa: () => {
            const fv = favor(), next = [10, 40, 60, 80].find(x => x > fv);
            return { fv, slowo: favorWord(fv), prog: next ? Watki.wstaw(TK.przychylnosc.prog, { next }) : "" };
        }
    });

    // ------------------------------------------------------------------
    // Act III: two royal soldiers defend the tavern after the alarm, once the garrison counts the hero as its own (favour 80)
    // ------------------------------------------------------------------
    // (the two soldiers' words: js/teksty/garnizon.txt, obrona - the second one starts with his own line; the objects stay these
    // very objects, Act III reads them in the fight)
    const OBRONA = { imie: {}, a: {}, b: {} };
    Watki.scal(OBRONA, "garnizon", "obrona");   // (its words: js/teksty/garnizon.txt, obrona)
    (function defenders() {
        const A3 = window.Act3Data;
        if (!A3 || !Array.isArray(A3.DEFENDERS) || A3.DEFENDERS.some(d => d.key === "garnizon")) return;
        const when = c => !!(c && c.bell) && favor() >= F.defenders;
        A3.DEFENDERS.push(
            { key: "garnizon", get name() { return OBRONA.imie.name; }, sheet: "Npc_Zolnierz_Walk8", maps: [8], from: "gate", delay: 500, hp: 120, dmg: 13, poise: 30,
              cd: [80, 110], speed: 3.9, armor: 0.2, swing: "#d8d8e0", when, lines: OBRONA.a },
            { key: "garnizon_b", get name() { return OBRONA.imie.name; }, sheet: "Npc_Zolnierz_B_Walk8", maps: [8], from: "gate", delay: 560, hp: 120, dmg: 13, poise: 30,
              cd: [80, 110], speed: 3.9, armor: 0.2, swing: "#d8d8e0", when, lines: OBRONA.b });
    })();

    // (the busts of our people - Rotmistrz, Kwatermistrz, Werbownik, Zolnierz(_B) - are in SpeechBubbles' own BUSTS table since the integration)

    // ------------------------------------------------------------------
    // The place is built: the real map (note <Garnizon:mapa>) - the harbour's way in appears (Wyspa.js)
    // ------------------------------------------------------------------
    let built = false;
    (function readyCheck() {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "data/Map%1.json".replace("%1", String(MAP).padStart(3, "0")));
            xhr.overrideMimeType("application/json");
            xhr.onload = () => {
                try {
                    const m = JSON.parse(xhr.responseText);
                    if (m && /<Garnizon:mapa>/.test(m.note || "")) { built = true; const W = WY(); if (W && W.ready) W.ready(MAP); }
                } catch (e) { /* (a skeleton or no file: the way in stays shut) */ }
            };
            xhr.send();
        } catch (e) { /* (no XHR: tests' sandbox) */ }
    })();

    // ------------------------------------------------------------------
    // Every frame: the soldiers, the shown things, the thief carrying sacks, the bar; once a second the bookkeeping
    // ------------------------------------------------------------------
    function sync() {
        if (!has() || !window.$gameMap) return;
        const s = S(), f = flags();
        // K52 done: +20 once; the castaway given to the garrison (Wrak, E): +10 once
        if (f.k52Skup && !s.k52) { s.k52 = day(); addFavor(F.k52, "K52"); }
        if (f.ansgarGiven && !s.ansgar) { s.ansgar = day(); addFavor(F.ansgar, TK.kod.sync[0]); }
        const id = $gameMap.mapId();
        if (id === MAP) {
            for (const [key, r] of Object.entries(D.RECRUITS)) {
                const ev = $gameMap.event(r.id);
                if (ev) setShown(ev, recruitActive(key) && inHours(hour(), 6, 21));
            }
            const p = $gameMap.event(D.PATROL.id);
            if (p) setShown(p, patrolWanted());
            // the rescue boat: at the wreck 9-15 (the soldiers fish its cargo), by the pier otherwise
            for (const e of boats()) setShown(e, !inHours(hour(), 9, 15));
        } else if (id === TOWN) {
            const l = $gameMap.event(D.TOWN_EVENTS.list.id);
            if (l) setShown(l, marketNow());
            const k = $gameMap.event(D.TOWN_EVENTS.klos.id);
            if (k) setShown(k, kantorNight() && !klosGone() && !T.call("TownLife", "gone", "kwatermistrz"));
            for (const e of D.TOWN_EVENTS.search) setShown($gameMap.event(e.id), searchDay());
        } else if (id === PODG) {
            for (const e of D.PODGRODZIE_EVENTS) setShown($gameMap.event(e.id), searchDay());
        }
    }
    let tick = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        tick++;
        const id = $gameMap.mapId();
        if (tick % 30 === 0) sync();
        if (id === MAP) {
            const h = hour();
            if (lastHour !== null) { const j = Math.abs(h - lastHour); if (Math.min(j, 24 - j) > 0.25) placeAll(); }
            lastHour = h;
            for (const sd of D.SOLDIERS) {
                const ev = $gameMap.event(sd.id);
                if (!ev || !ev._garn) continue;
                driveSoldier(ev, sd);
                bark(ev, sd.role);
            }
            barTick();
            // the thief with the sacks: a sentry who sees him - caught (once out of the gate or off the map he is safe)
            const s = S();
            if (s.d27.carry && !$gameMap.isEventRunning()) {
                const out = $gamePlayer.y <= 9 || $gamePlayer.x <= 22 || $gamePlayer.x >= 53 || $gamePlayer.y >= 34;
                if (out) s.d27.carry = 0;
                else if (tick % 6 === 0) { const guard = seenBy(); if (guard) caught(guard); }
            }
            // the patrol stops a hero who comes close
            const p = $gameMap.event(D.PATROL.id);
            if (p && p._garn && !p._garn.hidden && !$gameMap.isEventRunning() && Math.hypot(p.x - $gamePlayer.x, p.y - $gamePlayer.y) < 2.2) p.start();
        } else if (id === TOWN || id === PODG) {
            if (tick % 120 === 0) {
                const SB = T.api("SpeechBubbles"), evs = (id === TOWN ? D.TOWN_EVENTS.search : D.PODGRODZIE_EVENTS).map(e => $gameMap.event(e.id));
                for (const ev of evs) if (ev && ev._garn && !ev._garn.hidden && SB && Math.random() < 0.3 && Math.hypot(ev.x - $gamePlayer.x, ev.y - $gamePlayer.y) < 6) SB.say(ev, pick(TX.searchBarks));
                const k = id === TOWN ? $gameMap.event(D.TOWN_EVENTS.klos.id) : null;
                if (k && k._garn && !k._garn.hidden && SB && Math.random() < 0.3 && Math.hypot(k.x - $gamePlayer.x, k.y - $gamePlayer.y) < 6) SB.say(k, pick(TX.klosKantorBarks));
            }
        }
    }, { owner: PLUGIN, name: "garrison" });
    const _Game_Map_setupEvents = Game_Map.prototype.setupEvents;
    Game_Map.prototype.setupEvents = function() {
        _Game_Map_setupEvents.call(this);
        spotCache = null;
        lastHour = null;
        hookTalk();
        const id = this.mapId();
        if (id === MAP) {
            for (const sd of D.SOLDIERS) { const ev = this.event(sd.id); if (ev) placeSoldier(ev, sd); }
            if (S().d27.carry) S().d27.carry = 0;
        }
        if (id === MAP || id === TOWN || id === PODG) {
            for (const e of this.events()) {
                if (e.eventId() >= D.IDS[0] && e.eventId() <= D.IDS[1] && !e._garn) e._garn = { i: -1, patrol: 0, stuck: 0, wait: 0, nextBark: 0 };
            }
            sync();
        }
    };
    // the caught thief's night: run when the map is free
    T.onMapUpdate(() => {
        if (pendingCaught === null || $gameMap.isEventRunning()) return;
        const id = pendingCaught;
        pendingCaught = null;
        const ev = id ? $gameMap.event(id) : null, SB = T.api("SpeechBubbles");
        if (ev && SB) SB.say(ev, TX.caught[0]);
        runCaught(id);
    }, { owner: PLUGIN, name: "caught" });

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    const api = {
        MAP, QUARTERS, DATA: D, TX, state: () => S(), favor, addFavor, favorWord, priceOf, sell, skupLeft, BUY_LIMIT: LIMIT, waveWeek, hungerWeek, recruitDay, kantorNight,
        marketNow, klosGone, act: actCall, talk, look, granary, bar, door, barOpen, barCell, lowTide, sees, seenBy, sync, placeAll,
        built: () => built, d26List, d26Resolved, entryAt, spot
    };
    window.Garnizon = T.register(PLUGIN, api);
})();
