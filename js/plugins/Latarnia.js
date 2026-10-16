//=============================================================================
// Latarnia.js
//=============================================================================
// PAKIET C (docs/miejsca_wyspy/PAKIETY.md) - the engine of "Przylądek z latarnią" (Map159), "Izba latarnika" (Map160) and "Laterna"
// (Map161), concept approved by the user 2026-10-16 (docs/miejsca_wyspy/KONCEPCJA.md section 5). The data and texts: Latarnia_Data.js.
//   - the place is built: Wyspa.ready(159) - the mountains' right edge (Map013 59, 11-13) leads up here (Wyspa.js puts it in); the
//     way west to Urwisko Kruków only once that place is built (Wyspa.isReady(157)), else a popup
//   - the lighthouse's FIRE (a flame, the user's rule): a flame drawn in the basket of the tower's picture, the lantern's panes lit
//     warm, a big light in the night layer (Farming_Render's Sprite_NightLight - its lights() wrapped on the instance, as Humans.js
//     does) and two slow beams sweeping over the sea above the dark - seen from afar: faintly also on Map013 and Map157 at night.
//     Lit from dusk to dawn while there is fuel: nights of fire (start 7; the ferry brings 4 until day 24 - then the war; Bazyli's
//     driftwood 0.25 a day; the hero sells him wood 2 G, charcoal 4 G, oil 6 G). No fuel: dark (flag latarniaZgasla). The
//     lighthouse never delays the ferry (the user's decision).
//   - the sea fog at night: the night before a misty morning (Sky.mistOfDay(tomorrow) >= 0.6) banks of fog drift over the cape (the
//     same soft banks as Sky.js's morning mist, over the dark), switch 19 Wyspa_MglaPrzyladek is ON, the fog bell rings every
//     full hour (its rope runs from the gallery: Bazyli pulls it)
//   - Bazyli Krzesiwo (TownLife 943): his plan's hours follow the sun (Sky.sunTimes) - the same array, the hours changed in place;
//     indoors he is shown only in the room his plan has him in (Latarnia.indoorSpot - a getter in TownLifeData.SPOTS_BY_MAP);
//     his talk (TownLife.addTalkHook, first): the first meeting (the raven on the neck, seen in the fog), the quests, his menu (buys
//     fuel, the weather for two days exactly from the weather plan, the stock, the Book of Fogs)
//   - the visions (D22): in a fog, at night, in the lantern room, with Bazyli there - once a night: a white screen, the vision on a
//     round board (img/pictures/Latarnia_Wizja_N), one sentence, a journal note; "Ciężka głowa" until noon (Survival.defineBuff:
//     works cost more; Hart ducha - Combat.mindResist - takes a part off or all of it). Vision 2 sets the contract's flag "mgla"
//     (Wrak.js: W12's clue); D22's end: tell Bazyli or keep it -> the card 5 (flag kronikaKarta5, Pustelnia.js gives the card)
//   - W11 "Soczewka" (Act II, Wyspa.actTwo()): Baltazar's offer (400 G), the warning, the night raid (Humans.spawn on Map159 / in
//     the lantern room; defended or stolen), the thieves' camp in the cove the next night (the sack - event 630) or the buy-back
//     from Baltazar, brother Kleofas reads what the lens is (the Order's "Oko Strażnicy" from a crystal of the First - not a
//     shard of the Heart), the choice: leave it (Bazyli guards), break it (flag soczewkaRozbita: no visions), sell it (flag
//     soczewkaSprzedana, 400 G)
//   - the oil recipe in the cauldron ("Wytop tran": 3 raw fish + 1 wood -> 1 Tran) put into Farming.BUILDINGS.cauldron.recipes at
//     load (Farming_Data.js unchanged); Janek sells oil (6 G) for good once K49 is on (or Bazyli met)
//   - the cove of the sea's leavings: after every storm the sea throws up wood and odds and ends (once a storm)
// Ids 630-639 (Tawerna.inject, owner "Latarnia"): 630 the thieves' sack in the cove (Map159).
// DROUGHT (the user's rule): the sea here is salt and red (<Water:salt>); nothing gives the hero water.

/*:
 * @target MZ
 * @plugindesc [pakiet C] Przylądek z latarnią (mapy 159-161): ogień latarni, mgła morska, latarnik Bazyli, wizje w soczewce (D22), tran (K49), Soczewka (W11). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa
 *
 * @help
 * ============================================================================
 * Latarnia.js - przylądek z latarnią
 * ============================================================================
 * Mapa 159 „Przylądek z latarnią”, wnętrza 160 „Izba latarnika” i 161
 * „Laterna”. Mieszka tu latarnik Bazyli Krzesiwo (TownLife, numer 943).
 *
 * - ogień latarni: płomień w koszu na szczycie wieży, nocą światło i snopy
 *   nad morzem (widać je z daleka); pali się od zmierzchu do świtu, póki
 *   jest opał (tran, węgiel, drewno - Bazyli skupuje);
 * - mgła morska nocą (przed mglistym porankiem): pasma mgły, dzwon mgłowy
 *   co godzinę, przełącznik 19 „Wyspa_MglaPrzyladek”;
 * - wizje w soczewce (D22 „Księga mgieł”): raz na noc, tylko we mgle;
 *   następnego dnia „Ciężka głowa” do południa (Hart ducha pomaga);
 * - K49 „Tran dla latarni” (od dnia 24), W11 „Soczewka” (Akt II);
 * - przepis „Wytop tran” w kociołku (3 ryby + drewno);
 * - zatoczka szczątków: po sztormie morze wyrzuca drewno i drobiazgi.
 *
 * Zdarzenia 630-639: worek złodziei w zatoczce (630).
 * W skryptach: Latarnia.state(), Latarnia.lit(), Latarnia.fogNow(),
 * Latarnia.vision(this, n), Latarnia.info().
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna, D = window.LatarniaData;
    if (!T) throw new Error("Latarnia.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    if (!D) throw new Error("Latarnia.js: brak Latarnia_Data.js - musi być wyżej na liście wtyczek (the lighthouse's data is missing)");
    const PLUGIN = "Latarnia";
    const MAP = D.MAP, IZBA = D.IZBA, LATERNA = D.LATERNA, HARBOUR = 125, OURS = [MAP, IZBA, LATERNA];
    const KEY = "latarnik", COIN_ICON = 314, SWITCH_FOG = 19;
    const HERO = { id: 0, name: "" };
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const day = () => T.time.day(), hour = () => T.time.hour(), now = () => day() * 24 + hour();
    const has = () => !!window.$gameSystem && !!window.$gameParty;
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const TL = () => T.api("TownLife") || window.TownLife || null;
    const W = () => window.Wyspa || T.api("Wyspa") || null;
    const SKY = () => T.api("Sun") || window.Sky || null;
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const inHours = (h, r) => (r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] !== undefined ? v[k] : m));
    const onMap = id => !!window.$gameMap && $gameMap.mapId() === id;
    const ours = () => !!window.$gameMap && OURS.includes($gameMap.mapId());

    // ------------------------------------------------------------------
    // The state (the save): what the lighthouse itself remembers (the quests' records and flags are TownQuests')
    // ------------------------------------------------------------------
    const store = T.state.define("latarnia", () => ({
        met: 0, fuel: D.FUEL.start, gainDay: 0, burnDay: 0, nights: {}, sold: { day: 0, n: {} }, weatherDay: 0, bookN: 0, usualN: 0,
        visions: {}, visionNight: -99, lens: "whole", wreck: 0, janek: { day: 0, n: 0 }, raid: null, told: "", trust: 0, out: 0
    }), { version: 1, owner: PLUGIN });
    const S = () => store();
    const qs = () => { const q = TQ(); return q && q.state ? q.state() : null; };
    const flags = () => { const s = qs(); return s ? s.flags : {}; };
    const flag = k => !!flags()[k];
    function setFlag(k) {
        const w = W();
        if (w && w.setFlag) w.setFlag(k);
        else { const f = flags(); if (!f[k]) f[k] = day(); }
        const q = TQ();
        if (q && q.autoChecks) q.autoChecks();
        if (q && q.refreshMarkers) q.refreshMarkers();
    }
    const vcount = k => { const s = qs(); return s && s.v ? s.v[k] || 0 : 0; };
    const vgive = (k, n) => { const s = qs(); if (s) s.v[k] = (s.v[k] || 0) + (n || 1); };
    const vtake = (k, n) => { const s = qs(); if (!s) return; s.v[k] = Math.max(0, (s.v[k] || 0) - (n || 1)); if (!s.v[k]) delete s.v[k]; };
    const rec = id => { const q = TQ(); return q && q.rec ? q.rec(id) : null; };
    const isDone = id => { const q = TQ(); return !!(q && q.isDone && q.isDone(id)); };
    const isActive = id => { const r = rec(id); return !!r && r.s === "active"; };
    const stepOf = id => { const r = rec(id); return r && r.s === "active" ? r.step : -1; };
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const xp = (n, why) => T.call("Combat", "gainXp", n, why, true) || 0;
    const actTwo = () => { const w = W(); return !!(w && w.actTwo && w.actTwo()); };
    const refresh = () => { const q = TQ(); if (q && q.refreshMarkers) q.refreshMarkers(); };

    // ------------------------------------------------------------------
    // The sun: dawn and dusk of a day (Sky.sunTimes - cached a day), Bazyli's plan follows them
    // ------------------------------------------------------------------
    const sunCache = new Map();
    function sun(d) {
        if (sunCache.has(d)) return sunCache.get(d);
        const Sk = SKY();
        let t = { rise: 6, set: 20 };
        try { if (Sk && Sk.sunTimes && window.$gameSystem) t = Sk.sunTimes(d); } catch (e) { /* (no sky yet) */ }
        if (sunCache.size > 40) sunCache.clear();
        sunCache.set(d, t);
        return t;
    }
    const dusk = d => Math.max(17.3, sun(d).set - 0.3);       // (he goes up, the fire is lit)
    const dawn = d => Math.min(7.4, sun(d).rise + 0.4);       // (the fire put out)
    // the night that is on now (the day it began on) - or null by day
    function nightKeyAt(d, h) {
        if (h >= dusk(d)) return d;
        if (h < dawn(d)) return d - 1;
        return null;
    }
    const nightNow = () => (has() ? nightKeyAt(day(), hour()) : null);
    let planDay = 0;
    function updatePlan(dd) {
        const d = dd || day();
        if (!has() || planDay === d) return;
        planDay = d;
        const P = D.PLAN;
        // [0 laterna] [rise izba] [8 asleep] [15 the woodshed] [17 izba] [dusk laterna] - the same entries, only their hours
        if (P[1]) P[1][0] = Math.round(Math.min(7.6, sun(d).rise + 0.6) * 100) / 100;
        if (P[5]) P[5][0] = Math.round(dusk(d) * 100) / 100;
    }
    // where his plan has him inside now ("laterna", "izba", ...) or null
    function placeNow() {
        const L = TL();
        if (!L || !L.entryAt || !L.RESIDENTS) return null;
        if (L.absent && L.absent(KEY)) return null;
        const res = L.RESIDENTS.find(r => r.key === KEY);
        if (!res) return null;
        const e = L.entryAt(res, hour());
        return e && e.act === "inside" ? e.where : null;
    }
    // TownLifeData.SPOTS_BY_MAP[160 | 161].latarnik_wnetrze (a getter in Latarnia_Data.js): while the map loads always (the event is
    // put in), then only while his plan has him in that room
    function indoorSpot(mid) {
        const o = D.INDOOR[mid];
        if (!o) return null;
        if (!window.$gameMap || $gameMap.mapId() !== mid) return o.at;
        return placeNow() === o.place ? o.at : null;
    }

    // ------------------------------------------------------------------
    // The fog: the night before a misty morning (Sky.mistOfDay)
    // ------------------------------------------------------------------
    function mistOf(d) {
        const Sk = SKY();
        try { return Sk && Sk.mistOfDay && window.$gameSystem ? Sk.mistOfDay(d) : 0; } catch (e) { return 0; }
    }
    const fogNight = nk => mistOf(nk + 1) >= D.FOG.at;   // (the night that began on day nk)
    const fogTonight = d => fogNight(d === undefined ? day() : d);
    function fogNow() {
        if (!has()) return false;
        const nk = nightNow();
        return nk !== null && fogNight(nk);
    }
    // how thick, for the picture: 0..1 - in from dusk over an hour, out at dawn
    function fogAmount() {
        if (!has()) return 0;
        const d = day(), h = hour(), nk = nightNow();
        if (nk === null || !fogNight(nk)) return 0;
        if (nk === d) return Math.min(1, (h - dusk(d)) / 1.0 + 0.15);
        return Math.min(1, (dawn(d) - h) / 0.8);
    }
    // the next fog night from today (the day it begins on) - for Bazyli and the journal
    function nextFog(from) {
        const d0 = from === undefined ? day() : from;
        for (let d = d0; d < d0 + 14; d++) if (fogNight(d)) return d;
        return null;
    }

    // ------------------------------------------------------------------
    // The fuel: nights of fire (gains each day, a night burnt at each dusk) - worked out lazily in order
    // ------------------------------------------------------------------
    const F = D.FUEL;
    const isFerry = d => { const q = TQ(); return !!(q && q.isFerry && q.isFerry(d)); };
    function settle() {
        if (!has()) return;
        const s = S(), d = day(), h = hour();
        if (!s.gainDay) { s.gainDay = d - 1; s.burnDay = d - 1; }
        for (let k = Math.max(s.gainDay + 1, d - 60); k <= d; k++) {   // (a long absence: two months at most)
            // the night of the day before (if not burnt yet), then the day's gains
            if (s.burnDay < k - 1) burn(k - 1);
            let g = F.chop;
            if (isFerry(k) && k < F.ferryUntil) g += F.ferry;
            s.fuel = Math.min(F.max, s.fuel + g);
            s.gainDay = k;
        }
        if (s.burnDay < d && h >= dusk(d)) burn(d);
    }
    function burn(nk) {
        const s = S();
        if (s.burnDay >= nk) return;
        s.burnDay = nk;
        const lit = s.fuel >= F.perNight;
        if (lit) s.fuel = Math.round((s.fuel - F.perNight) * 100) / 100;
        s.nights[nk] = lit ? 1 : 0;
        for (const k of Object.keys(s.nights)) if (Number(k) < nk - 12) delete s.nights[k];
        if (!lit && !flag("latarniaZgasla")) setFlag("latarniaZgasla");
    }
    // the fire burns now (by night, with the night's fuel burnt)
    function lit() {
        if (!has()) return false;
        const nk = nightNow();
        if (nk === null) return false;
        settle();
        if (S().burnDay < nk) burn(nk);
        return S().nights[nk] === 1;
    }
    const nightsText = n => { const k = Math.floor(n); return k === 1 ? "jedną noc" : k >= 2 && k <= 4 ? k + " noce" : k + " nocy"; };

    // ------------------------------------------------------------------
    // Event commands: speech bubbles (\SPK[n]) and choices, the way TownQuests / Pustelnia write them
    // ------------------------------------------------------------------
    const LINE = 46, PAGE = 3;
    function wrap(text) {
        const out = [];
        for (const para of String(text).split("\n")) {
            let line = "";
            for (const w of para.split(/\s+/)) {
                if (!w) continue;
                if (line && (line + " " + w).length > LINE) { out.push(line); line = w; } else line = line ? line + " " + w : w;
            }
            if (line) out.push(line);
        }
        return out;
    }
    function sayTo(out, spk, text, ind) {
        const lines = wrap(text);
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push(C(101, ["", 0, 0, 2, spk.name || ""], ind));
            lines.slice(i, i + PAGE).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + spk.id + "]" : "") + l], ind)));
        }
        return out;
    }
    function linesTo(out, spk, arr, ind) {
        for (const raw of [].concat(arr || [])) {
            if (!raw) continue;
            const s = String(raw);
            if (s.startsWith("> ")) sayTo(out, HERO, s.slice(2), ind);
            else sayTo(out, spk, s, ind);
        }
        return out;
    }
    const act = (out, args, ind) => (out.push(C(355, ["Latarnia.act(this, " + JSON.stringify(args) + ")"], ind)), out);
    function choiceTo(out, labels, branches, cancel, ind) {
        const i0 = ind || 0;
        out.push(C(102, [labels, cancel === undefined ? labels.length - 1 : cancel, 0, 2, 0], i0));
        labels.forEach((l, i) => {
            out.push(C(402, [i, l], i0));
            for (const c of branches[i] || []) out.push(Object.assign({}, c, { indent: (c.indent || 0) + i0 + 1 }));
            out.push(C(0, [], i0 + 1));
        });
        out.push(C(404, [], i0));
        return out;
    }
    function bazyliEv() {
        const L = TL(), ev = L && L.eventOf ? L.eventOf(KEY) : null;
        return ev && $gameMap.event(ev.eventId()) === ev ? ev : null;
    }
    const bazyliHere = () => { const ev = bazyliEv(); return !!ev && !(ev._town && ev._town.hidden); };
    const spkB = () => { const ev = bazyliEv(); return { id: ev && bazyliHere() ? ev.eventId() : -1, name: D.RESIDENT.name }; };
    function say(ev, text) {
        const SB = T.api("SpeechBubbles");
        if (SB && SB.say && ev) SB.say(ev, String(text).replace(/^> /, ""), 220); else T.popup(String(text).replace(/^> /, ""), { color: "#eceef0" });
    }
    function usual() {
        const L = TL(), t = L && L.lines ? L.lines(KEY) : null;
        if (!t) return "";
        const h = hour(), slot = h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 21.5 ? "evening" : "night";
        const list = t[slot] || t.day || [];
        if (!list.length) return "";
        S().usualN = (S().usualN || 0) + 1;
        return list[S().usualN % list.length];
    }
    function questWants(key) {
        const q = TQ();
        if (!q || !q.markers) return false;
        if (q.refreshMarkers) q.refreshMarkers();
        const m = q.markers()[key || KEY];
        return m === "ready" || m === "new";
    }
    const questTalk = key => { const q = TQ(); return q && q.talkFor ? q.talkFor(key || KEY, false) : null; };

    // ------------------------------------------------------------------
    // The weather for two days, exactly from the weather plan (Survival.weatherPlan) - once a day
    // ------------------------------------------------------------------
    const hh = h => String(Math.round(h));
    function weatherOf(d) {
        const Sv = T.api("Survival") || window.Survival;
        let plan = null;
        try { plan = Sv && Sv.weatherPlan ? Sv.weatherPlan(d) : null; } catch (e) { plan = null; }
        let s;
        if (!plan) s = "sucho";
        else if (plan.storm) s = "burza od " + hh(plan.storm.start) + " do " + hh(plan.storm.end) + ", potem deszcz do " + hh(plan.end);
        else s = (plan.type === "snow" ? "śnieg" : "deszcz") + " od " + hh(plan.start) + " do " + hh(plan.end);
        const m = mistOf(d);
        if (m >= D.FOG.at) s += ", rano gęsta mgła";
        else if (m >= 0.3) s += ", rano trochę mgły";
        return s;
    }
    function forecast() {
        const d = day();
        return fill(D.TX.weatherHead, { d1: weatherOf(d + 1), d2: weatherOf(d + 2) });
    }

    // ------------------------------------------------------------------
    // Selling fuel to Bazyli
    // ------------------------------------------------------------------
    const FUEL_IDS = [D.ITEM.tran, D.ITEM.charcoal, D.ITEM.wood];
    function sell(id) {
        const s = S();
        settle();
        if (s.sold.day !== day()) s.sold = { day: day(), n: {} };
        const have = count(id), v = F.value[id], left = F.sellMax - (s.sold.n[id] || 0), room = Math.floor((F.max - s.fuel) / v + 1e-6);
        const n = Math.min(have, left, room);
        const ev = bazyliEv();
        if (have <= 0) { if (ev) say(ev, D.TX.sellNone[0]); return 0; }
        if (room <= 0) { if (ev) say(ev, D.TX.sellFull[0]); return 0; }
        if (left <= 0) { if (ev) say(ev, D.TX.sellDay[0]); return 0; }
        $gameParty.loseItem(item(id), n);
        const g = n * F.price[id];
        $gameParty.gainGold(g);
        s.sold.n[id] = (s.sold.n[id] || 0) + n;
        s.fuel = Math.min(F.max, Math.round((s.fuel + n * v) * 100) / 100);
        T.popup("+" + g + " G", { icon: COIN_ICON, kind: "gold" });
        if (ev) say(ev, D.TX.sellDone[0]);
        return n;
    }

    // ------------------------------------------------------------------
    // Bazyli's talk (TownLife's hook, first): the meeting, the quests, his menu
    // ------------------------------------------------------------------
    function bazyliTalk(ev) {
        const spk = { id: ev.eventId(), name: D.RESIDENT.name }, out = [];
        if (!S().met) {
            linesTo(out, spk, D.TX.meet);
            return act(out, ["met"]);
        }
        if (questWants()) { const q = questTalk(); if (q && q.length) return q; }
        const h = hour();
        linesTo(out, spk, [h >= 8 && h < 15 ? D.TX.sleepyDay[0] : pick(D.TX.ask)]);
        const labels = [], branches = [];
        // selling fuel: a small menu of what he has to give
        const kinds = FUEL_IDS.filter(id => count(id) > 0);
        labels.push("Kupisz opał?");
        if (kinds.length) {
            const sub = [];
            linesTo(sub, spk, D.TX.sell);
            choiceTo(sub, kinds.map(id => (item(id) ? item(id).name : "?") + " ×" + count(id) + " (" + F.price[id] + " G)").concat(["Nic."]),
                kinds.map(id => act([], ["sell", id])).concat([[]]), kinds.length);
            branches.push(sub);
        } else branches.push(linesTo([], spk, D.TX.sellNone));
        labels.push("Jaka będzie pogoda?");
        branches.push(act([], ["weather"]));
        labels.push("Ile masz opału?");
        branches.push(act([], ["stock"]));
        labels.push("Co piszesz w księdze?");
        branches.push(act([], ["bookN"]).concat(linesTo([], spk, [D.TX.book[(S().bookN || 0) % D.TX.book.length]])));
        labels.push("Co słychać?");
        branches.push(linesTo([], spk, [usual() || "Cicho. Morze gada za nas."]));
        labels.push("Bywaj.");
        branches.push([]);
        return choiceTo(out, labels, branches, labels.length - 1);
    }
    // Janek sells oil (his harbour, by day) - for good (the coordinator's decision 2026-10-16): once K49 is on or over, or the hero has
    // met Bazyli (before that he does not know what tran is for); a choice, "Nie, w innej sprawie" lets the other talks of his go on
    let passJanekUntil = 0;
    function janekTalk(ev) {
        if (Graphics.frameCount < passJanekUntil) return null;
        if (!onMap(HARBOUR) || !inHours(hour(), [6, 20]) || !(isActive("K49") || isDone("K49") || flag("latarnikMet")) || count(D.ITEM.tran) >= 4 || !flag("janekMet")) return null;
        const P = T.api("Przystan");
        if (P && P.janekAtSea && P.janekAtSea()) return null;
        if (questWants("janek")) return null;
        const j = S().janek;
        if (j.day === day() && j.n >= 4) return null;
        const spk = { id: ev.eventId(), name: "Janek" }, out = [];
        linesTo(out, spk, D.TX.janekTran);
        return choiceTo(out, ["Kupię dzbanek tranu (6 G).", "Nie, w innej sprawie."], [act([], ["janekTran"]), act([], ["passJanek"])], 1);
    }
    function hook(key, ev) {
        if (!has()) return null;
        if (key === KEY) return bazyliTalk(ev);
        if (key === "janek") return janekTalk(ev);
        return null;
    }
    function hookTalk() {
        const L = TL();
        if (L && L.addTalkHook && !hookTalk.done) {
            hookTalk.done = true;
            L.addTalkHook((key, ev) => { try { return hook(key, ev); } catch (e) { console.error("[Latarnia]", e); return null; } }, true);
        }
    }

    // ------------------------------------------------------------------
    // Script calls from the talks: Latarnia.act(this, [what, ...])
    // ------------------------------------------------------------------
    function actCall(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        const [what, a, b] = args;
        const stop = () => { if (interp && interp._list) interp._index = interp._list.length; };
        const ev = bazyliEv();
        try {
            if (what === "met") {
                if (!S().met) { S().met = day(); setFlag("latarnikMet"); note(D.TX.meetNote[0], D.TX.meetNote[1]); }
            } else if (what === "sell") {
                sell(a);
            } else if (what === "weather") {
                if (S().weatherDay === day()) { if (ev) say(ev, D.TX.weatherAgain[0]); return; }
                S().weatherDay = day();
                const t = forecast();
                if (interp) interp.setupChild(linesTo([], spkB(), [t]).concat([C(0, [])]), interp.eventId());
            } else if (what === "stock") {
                settle();
                const n = S().fuel, lines = n < 1 ? D.TX.stockNone.slice() : [fill(D.TX.stock, { n: nightsText(n) })];
                lines.push(day() < F.ferryUntil ? D.TX.stockFerry[0] : D.TX.stockWar[0]);
                if (interp) interp.setupChild(linesTo([], spkB(), lines).concat([C(0, [])]), interp.eventId());
            } else if (what === "bookN") {
                S().bookN = (S().bookN || 0) + 1;
            } else if (what === "janekTran") {
                const j = S().janek;
                if (j.day !== day()) { j.day = day(); j.n = 0; }
                const jev = interp ? $gameMap.event(interp.eventId()) : null;
                if (j.n >= 4) { if (jev) say(jev, D.TX.janekTranNone[0]); stop(); return; }
                if ($gameParty.gold() < D.FUEL.price[D.ITEM.tran]) { T.popup.need(COIN_ICON, "Potrzebujesz " + D.FUEL.price[D.ITEM.tran] + " G"); stop(); return; }
                $gameParty.loseGold(D.FUEL.price[D.ITEM.tran]);
                $gameParty.gainItem(item(D.ITEM.tran), 1);
                j.n++;
                if (jev) say(jev, D.TX.janekTranBuy[0]);
            } else if (what === "passJanek") {
                passJanekUntil = Graphics.frameCount + 600;
                const L = TL();
                if (L && L.talk && interp) L.talk(interp);
            } else if (what === "d22") {
                d22End(a);
            } else if (what === "w11") {
                w11Act(a, b, interp, stop);
            }
        } catch (e) { console.error("[Latarnia] act " + JSON.stringify(args), e); }
    }

    // ------------------------------------------------------------------
    // Doors, things to look at, the cove
    // ------------------------------------------------------------------
    let popAt = 0;
    function pop(text, color) {
        if (Graphics.frameCount - popAt < 50) return;
        popAt = Graphics.frameCount;
        T.popup(text, { color: color || "info" });
    }
    function transfer(mid, x, y, d) {
        T.audio.se("Door1", { volume: 80 });
        $gamePlayer.reserveTransfer(mid, x, y, d, 0);
    }
    // the tower's door: up the spiral stairs to the lantern room
    function towerOpen() {
        if (flag("latarniaUfa")) return "trust";
        if (S().met && fogNow()) return "fog";
        if (isActive("D22") && fogNow()) return "fog";
        const r = S().raid;
        if (r && stepOf("W11") === 2 && now() >= (r.day + 1) * 24 - 3 && now() < (r.day + 1) * 24 + D.RAID.until) return "raid";
        return null;
    }
    function door(interp) {
        if (!has()) return;
        const why = towerOpen();
        if (!why) { pop(nightNow() !== null ? D.TX.towerNight : D.TX.towerDay); return; }
        if (why === "fog" && !flag("latarniaUfa")) pop(D.TX.towerMist, "#ffe9a8");
        const L = D.LANDING[LATERNA];
        transfer(LATERNA, L[0], L[1], 8);
    }
    function izbaDoor(interp, lx, ly) {
        if (!has()) return;
        if (placeNow() === "izba_sen") { pop(D.TX.izbaAsleep); return; }
        transfer(IZBA, lx, ly, 8);
    }
    function edge() { pop(D.TX.edge); }
    function look(interp, what) {
        if (!has()) return;
        if (what === "slup") pop(count(D.ITEM.pendant) > 0 ? D.TX.slup : D.TX.slupNoPendant);
        else if (what === "plyta") pop(D.TX.plyta);
        else if (what === "dzwon") pop(fogNow() ? D.TX.dzwonMist : D.TX.dzwon);
        else if (what === "drewno") pop(D.TX.drewno);
        else if (what === "beczki") { settle(); pop(S().fuel >= 1 ? fill(D.TX.beczki, { n: nightsText(S().fuel) }) : D.TX.beczkiNone); }
    }
    function book(interp) {
        if (!has()) return;
        pop(Object.keys(S().visions).length ? D.TX.bookOwn : D.TX.bookLook);
    }
    // the storms since the last look: the sea's leavings (once a storm)
    function lastStorm() {
        const Sv = T.api("Survival") || window.Survival;
        if (!Sv || !Sv.weatherPlan) return 0;
        for (let d = day(); d > day() - 30 && d > 0; d--) {
            let p = null;
            try { p = Sv.weatherPlan(d); } catch (e) { p = null; }
            if (p && p.storm && (d < day() || hour() >= p.storm.end)) return d;
        }
        return 0;
    }
    function wreckage(interp) {
        if (!has()) return;
        const st = lastStorm();
        if (!st || st <= S().wreck) { pop(D.TX.wreckEmpty); return; }
        S().wreck = st;
        const Fa = window.Farming, I = (Fa && Fa.ITEM) || {};
        const got = [[D.ITEM.wood, 3 + Math.floor(Math.random() * 3)]];
        const extra = [[I.rope, 1], [I.nails, 2], [D.ITEM.tar, 1], [D.ITEM.herring, 1], [I.planks, 2]].filter(x => x[0] && item(x[0]));
        if (extra.length) got.push(pick(extra));
        for (const [id, n] of got) {
            $gameParty.gainItem(item(id), n);
            T.popup(item(id).name + " ×" + n, { icon: item(id).iconIndex, kind: "good", gain: true });
        }
        T.popup(D.TX.wreckGot, { color: "#ffe9a8" });
        if (Math.random() < 0.3) setTimeout(() => pop(D.TX.wreckEye), 900);
    }

    // ------------------------------------------------------------------
    // The lens and the visions (D22)
    // ------------------------------------------------------------------
    const seenCount = () => D.VISIONS.filter(v => S().visions[v.n]).length;
    function lensBlock() {
        const st = S().lens;
        if (st === "stolen" || st === "baltazar") return { pop: D.TX.lensGone };
        if (st === "bag") return { pop: D.TX.lensBag };
        if (st === "broken") return { pop: D.TX.lensBroken };
        if (st === "sold") return { pop: D.TX.lensSold };
        if (nightNow() === null) return { pop: D.TX.lensDay };
        if (!fogNow()) return { pop: D.TX.lensNoMist };
        if (!bazyliHere()) return { pop: D.TX.lensNoBazyli };
        if (!isActive("D22") && !isDone("D22")) return { say: D.TX.lensNoQuest };
        if (S().visionNight === nightNow()) return { pop: D.TX.lensUsed };
        if (seenCount() >= D.VISIONS.length) return { say: D.TX.visionsDone };
        return null;
    }
    // the vision of tonight: the first not seen, in an order shuffled by the day
    function visionFor(nk) {
        const left = D.VISIONS.filter(v => !S().visions[v.n]);
        if (!left.length) return null;
        return left[Math.abs(Math.imul(nk + 7, 2654435761)) % left.length];
    }
    function lens(interp) {
        if (!has() || !interp) return;
        const b = lensBlock();
        if (b && b.pop) { pop(b.pop); return; }
        if (b && b.say) { interp.setupChild(linesTo([], spkB(), b.say).concat([C(0, [])]), interp.eventId()); return; }
        const v = visionFor(nightNow());
        const out = [C(355, ["Latarnia.vision(this, " + v.n + ");"])];
        linesTo(out, spkB(), D.TX.afterVision);
        interp.setupChild(out.concat([C(0, [])]), interp.eventId());
    }
    // the hours of "Ciężka głowa": until noon (the next day's if before midnight)
    function heavy() {
        const Sv = T.api("Survival") || window.Survival, H = D.HEAVY;
        if (!Sv || !Sv.defineBuff || typeof $gameSystem.addBuff !== "function") return 0;
        const h = hour(), until = h >= H.until ? 24 - h + H.until : H.until - h;
        const Cb = T.api("Combat"), res = Cb && Cb.mindResist ? Cb.mindResist(H.power, 0) : 0;
        const hours = Math.round(until * (1 - Math.min(0.8, res)) * 10) / 10;
        if (Math.random() < res * 0.5 || hours < 0.5) { T.popup(D.TX.heavyResist, { color: "#9ff0a8" }); return 0; }
        $gameSystem.addBuff(H.key, hours);
        T.popup(D.TX.heavy, { top: true, color: "#ff9f8f", sub: D.TX.heavySub });
        return hours;
    }
    // what a vision does (also called by the tests without the screen)
    function seeVision(n) {
        const v = D.VISIONS.find(x => x.n === n);
        if (!v || !has()) return false;
        const first = !S().visions[n];
        S().visions[n] = day();
        S().visionNight = nightNow() === null ? day() : nightNow();
        if (first) {
            note("Księga mgieł: " + v.title, v.note);
            if (v.flag) setFlag(v.flag);
            xp(40, "wizja w latarni");
        }
        const q = TQ();
        if (q && q.autoChecks) q.autoChecks();
        refresh();
        return true;
    }

    // ---- the vision on the screen: white, the round board, the sentence; the event waits (the interpreter's wait mode)
    let vis = null;
    function vision(interp, n) {
        const v = D.VISIONS.find(x => x.n === n);
        if (!v || !has()) return;
        seeVision(n);
        const scene = SceneManager._scene;
        if (scene instanceof Scene_Map) {
            vis = { n, t: 0, pic: ImageManager.loadPicture(v.pic), line: v.line, sprites: null, done: false };
            T.audio.se("Chime2", { volume: 70, pitch: 60 });
            if (interp && interp.setWaitMode) interp.setWaitMode("latarniaVision");
        }
        vis && (vis.heavy = true);
        if (!vis) heavy();
    }
    const visionBusy = () => !!vis && !vis.done;
    function buildVision(scene) {
        const root = new Sprite(), white = new Sprite(new Bitmap(Graphics.width, Graphics.height));
        white.bitmap.fillAll("#f6f7f8");
        const pic = new Sprite(vis.pic);
        pic.anchor.set(0.5, 0.5);
        pic.x = Graphics.width / 2;
        pic.y = Graphics.height / 2 - 34;
        const text = new Sprite(new Bitmap(Graphics.width, 64));
        if ($gameSystem && $gameSystem.mainFontFace) text.bitmap.fontFace = $gameSystem.mainFontFace();
        text.bitmap.fontSize = 26;
        text.bitmap.textColor = "#3a3e46";
        text.bitmap.outlineWidth = 0;
        text.bitmap.drawText(vis.line, 0, 10, Graphics.width, 40, "center");
        text.y = Math.min(Graphics.height - 70, pic.y + 270);
        root.addChild(white, pic, text);
        root._white = white; root._pic = pic; root._text = text;
        white.opacity = 0; pic.opacity = 0; text.opacity = 0;
        scene.addChild(root);
        vis.sprites = root;
    }
    function updateVision(scene) {
        if (!vis) return;
        if (!vis.sprites) buildVision(scene);
        const t = ++vis.t, s = vis.sprites, IN = 40, HOLD_MIN = 150, HOLD_MAX = 420, OUT = 50;
        const key = Input.isTriggered("ok") || Input.isTriggered("cancel") || TouchInput.isTriggered();
        if (!vis.outAt && t > HOLD_MIN && (key || t > HOLD_MAX)) vis.outAt = t;
        const k = vis.outAt ? Math.max(0, 1 - (t - vis.outAt) / OUT) : 1;
        s._white.opacity = 255 * Math.min(1, t / IN) * k;
        s._pic.opacity = 255 * Math.max(0, Math.min(1, (t - 25) / 45)) * k;
        s._pic.scale.set(0.97 + 0.03 * Math.min(1, t / 120));
        s._text.opacity = 255 * Math.max(0, Math.min(1, (t - 70) / 30)) * k;
        if (vis.outAt && t - vis.outAt >= OUT) {
            if (s.parent) s.parent.removeChild(s);
            vis.done = true;
            if (vis.heavy) heavy();
            vis = null;
        }
    }
    const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === "latarniaVision") {
            if (visionBusy()) return true;
            this._waitMode = "";
            return false;
        }
        return _Game_Interpreter_updateWaitMode.call(this);
    };
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (vis) updateVision(this);
    };
    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        if (vis) { vis.done = true; if (vis.heavy) heavy(); vis = null; }
        _Scene_Map_terminate.call(this);
    };

    // D22's end: tell him or keep it
    function d22End(how) {
        if (!isActive("D22")) return;
        S().told = how === "tell" ? "tell" : "keep";
        if (how === "tell") { setFlag("latarniaPowiedzial"); S().trust += 20; } else { setFlag("latarniaMilczal"); S().trust += 5; }
        const q = TQ();
        if (q && q.finish) q.finish("D22");
    }

    // ------------------------------------------------------------------
    // W11: the raid, the thieves, the lens's way
    // ------------------------------------------------------------------
    const R = D.RAID;
    const raidStart = r => (r.day + 1) * 24 + R.from, raidEnd = r => (r.day + 1) * 24 + R.until;
    const campFrom = r => (r.day + 1) * 24 + 21, campTo = r => (r.day + 2) * 24 + 4;
    let raidBand = false;
    function markerAt(name) {
        for (const e of ($dataMap && $dataMap.events) || []) if (e && e.name === "Miejsce: " + name) return [e.x, e.y];
        return null;
    }
    function spawnRaid() {
        const H = T.api("Humans") || window.Humans, r = S().raid;
        if (!H || !H.spawn || !r) return false;
        const inside = onMap(LATERNA);
        const kinds = inside ? R.inside : R.kinds;
        const at = inside ? [5, 7] : markerAt("lat_napad") || [6, 33];
        let n = 0;
        kinds.forEach((kind, i) => {
            const x = at[0] + (inside ? (i % 2 ? 1 : -1) : i % 2), y = at[1] - (inside ? 0 : Math.floor(i / 2));
            const h = H.spawn(kind, x, y, { tag: R.tag, level: 6, engaged: inside, say: i === 0 ? (inside ? "Szkło! Brać szkło!" : "Cicho... do wieży.") : null });
            if (!h) return;
            n++;
            if (!inside && H.march) H.march(h, D.TOWER[0], D.TOWER[1] + 1);
        });
        r.state = "spawned";
        r.n = n;
        raidBand = true;
        pop(inside ? D.TX.raidInside : D.TX.raidStart, "#ff9f8f");
        return n > 0;
    }
    function raidOutcome(won) {
        const r = S().raid;
        if (!r || (r.state !== "spawned" && r.state !== "wait")) return;
        r.state = won ? "defended" : "stolen";
        raidBand = false;
        const q = TQ();
        if (won) {
            setFlag("latarniaObroniona");
            S().trust += 25;
            T.popup(D.TX.raidWin, { top: true, color: "#9ff0a8", sub: D.TX.raidWinSub });
            if (q && q.completeStep && stepOf("W11") === 2) q.completeStep("W11", { to: 4 });
        } else {
            S().lens = "stolen";
            setFlag("latarniaSkradziona");
            T.popup(D.TX.raidLost, { top: true, color: "#ff9f8f", sub: D.TX.raidLostSub });
            if (q && q.completeStep && stepOf("W11") === 2) q.completeStep("W11");
        }
        refresh();
    }
    function raidRaiders() { const H = T.api("Humans") || window.Humans; return H && H.humans ? H.humans().filter(h => h._tag === R.tag && !h._dead) : []; }
    function updateRaid() {
        const r = S().raid;
        if (!r || stepOf("W11") !== 2) return;
        const t = now();
        if (r.state === "wait") {
            if (t >= raidStart(r) && t < raidEnd(r) && (onMap(MAP) || onMap(LATERNA))) spawnRaid();
            else if (t >= raidStart(r) && t < raidEnd(r) && onMap(IZBA) && !r.heard) { r.heard = 1; pop(D.TX.raidStart, "#ff9f8f"); }
            else if (t >= raidEnd(r)) raidOutcome(false);   // (nobody there: they came and went)
            return;
        }
        if (r.state === "spawned") {
            const men = raidRaiders();
            if (!men.length) { raidOutcome(true); return; }
            // one at the tower's door with the hero far away: in, up, and off with the glass
            const door = [D.TOWER[0], D.TOWER[1] + 1];
            if (onMap(MAP) && men.some(h => Math.hypot(h._x - door[0], h._y - door[1]) < 1.2) && Math.hypot($gamePlayer.x - door[0], $gamePlayer.y - door[1]) > 6) {
                const H = T.api("Humans") || window.Humans;
                for (const h of men) { if (H && H.remove) H.remove(h); }
                raidOutcome(false);
            }
        }
    }
    // the hero beaten by the raiders, or gone off the map while they fight: the glass is gone
    T.on("heroRobbed", p => { if (p && p.tag === R.tag) raidOutcome(false); }, { owner: PLUGIN });
    T.on("humansDone", p => { if (p && p.tag === R.tag && S().raid && S().raid.state === "spawned") raidOutcome(true); }, { owner: PLUGIN });
    T.on("mapLeave", () => {
        if (!has()) return;
        const r = S().raid, H = T.api("Humans") || window.Humans;
        if (r && r.state === "spawned" && raidRaiders().length) {
            const to = $gamePlayer.isTransferring() ? $gamePlayer.newMapId() : 0;
            if ((onMap(MAP) && to === LATERNA) || (onMap(LATERNA) && to === MAP)) { r.state = "wait"; if (H && H.clear) H.clear(R.tag); }   // (they follow him up / down)
            else raidOutcome(false);
        }
        if (thievesUp && H && H.clear) H.clear(R.thievesTag);
        thievesUp = false;
    }, { owner: PLUGIN });
    T.on("humansDone", p => { if (p && p.tag === R.thievesTag && has()) S().thievesBeaten = day(); }, { owner: PLUGIN });
    // the thieves wait for their boat in the cove the night after: two asleep, one awake by the sack
    let thievesUp = false;
    const campNight = () => { const r = S().raid; return !!r && S().lens === "stolen" && now() >= campFrom(r) && now() < campTo(r); };
    function updateThieves() {
        const r = S().raid;
        if (!r || S().lens !== "stolen") return;
        if (now() >= campTo(r)) {      // (the boat came: the glass went to the money changer's)
            S().lens = "baltazar";
            refresh();
            return;
        }
        if (!onMap(MAP) || thievesUp || !campNight() || S().thievesBeaten) return;
        const H = T.api("Humans") || window.Humans, at = markerAt("lat_oboz") || [6, 31];
        if (!H || !H.spawn) return;
        thievesUp = true;
        const band = H.makeBand ? H.makeBand([], { tag: R.thievesTag }) : null;
        const seats = [[at[0] - 2, at[1] + 1, "sleep"], [at[0] + 2, at[1] + 1, "sleep"], [at[0] + 1, at[1] - 1, "sit"]];
        R.thieves.forEach((kind, i) => {
            const s = seats[i];
            if (s) H.spawn(kind, s[0], s[1], { tag: R.thievesTag, level: 6, mode: s[2], band: band || undefined });
        });
    }
    // the sack (event 630): the lens back
    function sack(interp) {
        if (!has() || S().lens !== "stolen" || !campNight()) return;
        S().lens = "bag";
        vgive("soczewka", 1);
        T.audio.se("Item3", { volume: 80 });
        T.popup(D.TX.sackGot, { top: true, color: "#ffd23f", sub: D.TX.sack });
        const ev = interp && $gameMap.event(interp.eventId());
        if (ev) ev.erase();
        const q = TQ();
        if (q && q.completeStep && stepOf("W11") === 3) q.completeStep("W11");
        refresh();
    }
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1,
        switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    T.inject([MAP], { ids: D.IDS, owner: PLUGIN, build(data) {
        if (!has() || S().lens !== "stolen") return [];
        let at = [7, 31];
        for (const e of data.events || []) if (e && e.name === "Miejsce: lat_oboz") at = [e.x + 1, e.y];
        const page = { conditions: Object.assign({}, BLANK), directionFix: true,
            image: { tileId: 0, characterName: "!Fantasy_chest", direction: 2, pattern: 0, characterIndex: 3 },
            list: [C(355, ["Latarnia.sack(this);"]), C(0, [])],
            moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: false };
        return [{ id: D.IDS[0], name: "Worek złodziei", note: "<Latarnia:worek>", pages: [page], x: at[0], y: at[1] }];
    } });
    function w11Act(what, a, interp, stop) {
        const q = TQ();
        if (!q) return;
        if (what === "oferta" && stepOf("W11") === 0) {
            setFlag(a ? "latarniaBaltazarMoze" : "latarniaBaltazarNie");
            q.completeStep("W11");
        } else if (what === "warn" && stepOf("W11") === 1) {
            S().raid = { day: day() + R.after, state: "wait" };   // (the night from day+1 to day+2: "jutro w nocy", after midnight)
            q.completeStep("W11");
        } else if (what === "give" && stepOf("W11") === 4 && S().lens === "whole") {
            S().lens = "bag";
            vgive("soczewka", 1);
            T.popup("Soczewka latarni", { top: true, color: "#ffd23f", sub: "Zanieś ją bratu Kleofasowi." });
        } else if (what === "buyback" && stepOf("W11") === 3 && S().lens === "baltazar") {
            if ($gameParty.gold() < R.buyBack) { T.popup.need(COIN_ICON, "Potrzebujesz " + R.buyBack + " G"); stop(); return; }
            $gameParty.loseGold(R.buyBack);
            S().lens = "bag";
            vgive("soczewka", 1);
            T.popup("Soczewka latarni", { top: true, color: "#ffd23f", sub: "Odkupiona od Baltazara." });
            q.completeStep("W11");
        } else if (what === "kleofas" && stepOf("W11") === 4 && S().lens === "bag") {
            note(D.TX.kleofasNote[0], D.TX.kleofasNote[1]);
            q.completeStep("W11");
        } else if (stepOf("W11") === 5 && S().lens === "bag" && (what === "leave" || what === "break" || what === "sell")) {
            if (what === "sell") { q.completeStep("W11"); return; }
            vtake("soczewka", 1);
            if (what === "leave") {
                S().lens = "whole";
                setFlag("latarniaSoczewkaZostaje");
                S().trust += 20;
                q.finish("W11", { xp: 150, note: D.TX.leaveNote });
            } else {
                S().lens = "broken";
                setFlag("soczewkaRozbita");
                q.finish("W11", { xp: 150, note: D.TX.breakNote });
            }
        } else if (what === "sold" && stepOf("W11") === 6 && S().lens === "bag") {
            vtake("soczewka", 1);
            S().lens = "sold";
            setFlag("soczewkaSprzedana");
            q.finish("W11", { gold: R.sale, xp: 80, note: D.TX.soldNote });
        }
        refresh();
    }

    // ------------------------------------------------------------------
    // TownQuests' handlers: K49 (the fuel), D22 (the visions, the end), W11
    // ------------------------------------------------------------------
    const kantorOpen = () => inHours(hour(), [8, 18]);
    function hookQuests() {
        const q = TQ();
        if (!q || !q.FX || hookQuests.done) return;
        hookQuests.done = true;
        Object.assign(q.FX, {
            k49Paliwo: { hand: () => { settle(); S().fuel = Math.min(F.max, S().fuel + 4 * F.value[D.ITEM.tran] + 6 * F.value[D.ITEM.wood]); S().trust += 20; } },
            d22Ready: { cond: () => has() && !!S().met && (fogNow() || (fogTonight() && hour() >= 12)) },
            d22Wizje: {
                check: () => seenCount() >= D.VISIONS.length,
                vars: () => {
                    const nf = nextFog(), k = fogNow() ? " Mgła jest teraz - wejdź na górę." : nf === null ? "" : nf === day() ? " Dziś w nocy będzie mgła." :
                        " Bazyli mówi, że mgła przyjdzie w nocy z dnia " + nf + " na " + (nf + 1) + ".";
                    return { n: seenCount(), kiedy: k };
                }
            },
            d22Koniec: {
                ready: (qq, r, st, key) => (key === KEY ? true : null),
                talk: (qq, r, st, key, spk) => {
                    if (key !== KEY) return null;
                    const out = [];
                    linesTo(out, spk, ["Trzy mgły. Trzy razy patrzyłeś w szkło. (Bazyli otwiera Księgę mgieł na czystej stronie.)", "Co widziałeś?"]);
                    choiceTo(out, ["Powiem ci.", "Zachowam to dla siebie."], [
                        linesTo([], spk, ["> Statek bez bandery. Człowieka z piórem w czarnej wodzie. I kobietę nad rzeką.",
                            "(Bazyli pisze długo, nie podnosząc głowy.) Teraz to i twoje, i księgi. Lżej będzie nieść we dwóch.",
                            "Weź to. Stary latarnik przepisał tu kiedyś kartę z kroniki zakonu, zanim umarł. Szyfr. Ja nie umiem tego czytać."]).concat(act([], ["d22", "tell"])),
                        linesTo([], spk, ["> Zachowam to dla siebie.", "Niektóre rzeczy lepiej nosić samemu. Rozumiem.",
                            "Ale to weź. Stary latarnik przepisał tu kiedyś kartę z kroniki zakonu. Szyfr. Mnie się nie przyda."]).concat(act([], ["d22", "keep"]))
                    ], -1);
                    return { ready: true, list: out };
                }
            },
            // W11 "Soczewka" (Act II)
            w11Auto: () => has() && actTwo() && !!S().met && day() >= 25,
            w11Oferta: {
                ready: (qq, r, st, key) => (key === "kupiec" ? kantorOpen() : null),
                talk: (qq, r, st, key, spk) => {
                    if (key !== "kupiec" || !kantorOpen()) return null;
                    const out = linesTo([], spk, D.TX.baltazar);
                    choiceTo(out, ["Nie sprzedam cudzego.", "Pomyślę."],
                        [linesTo([], spk, D.TX.baltazarNo.slice(1)).concat(act([], ["w11", "oferta", 0])),
                         linesTo([], spk, D.TX.baltazarMaybe.slice(1)).concat(act([], ["w11", "oferta", 1]))], -1);
                    return { ready: true, list: out };
                }
            },
            w11Ostrzez: {
                ready: (qq, r, st, key) => (key === KEY ? true : null),
                talk: (qq, r, st, key, spk) => (key === KEY ? { ready: true, list: act(linesTo([], spk, D.TX.warn), ["w11", "warn"]) } : null)
            },
            w11Vars: {
                vars: () => {
                    const r = S().raid || { day: day() }, st = S().lens;
                    const gdzie = st === "baltazar" ? "Łódź zabrała soczewkę z zatoczki. Baltazar ma ją w kantorze - odkup ją (" + R.buyBack + " G, 8–18)." :
                        "Złodzieje czekają na łódź w zatoczce szczątków na przylądku - w nocy z dnia " + (r.day + 1) + " na " + (r.day + 2) + ". Odbierz im worek.";
                    const kto = st === "whole" ? "Weź soczewkę od Bazylego i zanieś ją bratu Kleofasowi (pustelnia na klifie). Niech przeczyta w kronikach, czym jest." :
                        "Zanieś soczewkę bratu Kleofasowi (pustelnia na klifie). Niech przeczyta w kronikach, czym jest.";
                    return { d: r.day, d1: r.day + 1, gdzie, kto };
                }
            },
            w11Odkup: {
                ready: (qq, r, st, key) => (key === "kupiec" && S().lens === "baltazar" ? kantorOpen() : null),
                talk: (qq, r, st, key, spk) => {
                    if (key !== "kupiec" || S().lens !== "baltazar" || !kantorOpen()) return null;
                    const out = linesTo([], spk, D.TX.baltazarBack);
                    choiceTo(out, ["Biorę (" + R.buyBack + " G).", "Nie teraz."],
                        [act([], ["w11", "buyback"]).concat(linesTo([], spk, D.TX.baltazarBackYes)), linesTo([], spk, D.TX.baltazarBackNo)], 1);
                    return { ready: true, list: out };
                }
            },
            w11Kleofas: {
                ready: (qq, r, st, key) => {
                    if (key === "pustelnik") return S().lens === "bag";
                    if (key === KEY) return S().lens === "whole" || (S().lens === "bag" && !hermitReady());
                    return null;
                },
                talk: (qq, r, st, key, spk) => {
                    if (key === "pustelnik" && S().lens === "bag") return { ready: true, list: act(linesTo([], spk, D.TX.kleofas), ["w11", "kleofas"]) };
                    if (key !== KEY) return null;
                    if (S().lens === "whole") {
                        const lines = S().raid && S().raid.state === "defended" ? D.TX.bazyliDefended : D.TX.bazyliGive;
                        return { ready: true, list: act(linesTo([], spk, lines), ["w11", "give"]) };
                    }
                    if (S().lens === "bag" && !hermitReady()) return { ready: true, list: act(linesTo([], spk, D.TX.bazyliReads), ["w11", "kleofas"]) };
                    if (S().lens === "bag") return { ready: false, list: linesTo([], spk, D.TX.bazyliBagFirst) };
                    return null;
                }
            },
            w11Wybor: {
                ready: (qq, r, st, key) => (key === KEY ? S().lens === "bag" : null),
                talk: (qq, r, st, key, spk) => {
                    if (key !== KEY || S().lens !== "bag") return null;
                    const out = linesTo([], spk, D.TX.choiceAsk);
                    choiceTo(out, ["Zostaw je w latarni.", "Rozbij je.", "Sprzedam je Baltazarowi."], [
                        linesTo([], spk, D.TX.choiceLeave).concat(act([], ["w11", "leave"])),
                        linesTo([], spk, D.TX.choiceBreak).concat(act([], ["w11", "break"])),
                        linesTo([], spk, D.TX.choiceSell).concat(act([], ["w11", "sell"]))], -1);
                    return { ready: true, list: out };
                }
            },
            w11Sprzedaz: {
                ready: (qq, r, st, key) => (key === "kupiec" && S().lens === "bag" ? kantorOpen() : null),
                talk: (qq, r, st, key, spk) => {
                    if (key !== "kupiec" || S().lens !== "bag" || !kantorOpen()) return null;
                    return { ready: true, list: act(linesTo([], spk, D.TX.sold), ["w11", "sold"]) };
                }
            }
        });
    }
    const hermitReady = () => { const w = W(); return !!(w && w.isReady && w.isReady(155)); };

    // ------------------------------------------------------------------
    // The oil in the cauldron (Farming.BUILDINGS - Farming_Data.js unchanged), "Ciężka głowa", the bust
    // ------------------------------------------------------------------
    const RECIPE = { id: "tran", name: "Wytop tran", doing: "Trwa wytapianie", inputs: [[D.ITEM.wood, 1]], fish: 3, output: [D.ITEM.tran, 1], hours: 3,
        stamina: 2, startSe: "Liquid", desc: "Trzy surowe ryby (ze stawu albo z morza) wytopione w kociołku na gęsty, śmierdzący tran. Pali się w latarni - Bazyli z przylądka go skupuje." };
    (function addRecipe() {
        const Fa = window.Farming, B = Fa && Fa.BUILDINGS, c = B && B.cauldron;
        if (!c || !Array.isArray(c.recipes)) { console.warn("[Latarnia] Farming.BUILDINGS.cauldron is missing - the oil recipe waits for the integration"); return; }
        if (!c.recipes.some(r => r.id === RECIPE.id)) c.recipes.push(RECIPE);
    })();
    (function defineBuffs() {
        const Sv = window.Survival, H = D.HEAVY;
        if (Sv && Sv.defineBuff) Sv.defineBuff(H.key, { name: H.name, icon: H.icon, bad: true, desc: "po wizji w latarni: do południa prace kosztują więcej sił", cost: H.cost });
    })();
    // (Bazyli's talk bust Latarnik_Bust is in SpeechBubbles' own BUSTS table since the integration)

    // ------------------------------------------------------------------
    // The picture: the fire on the tower, the lit panes, the beams, the fog, the bell, the lens and the basket upstairs
    // ------------------------------------------------------------------
    const FIRE = D.FIRE, FIRE_LIGHT = 620, FIRE_I = 0.82, BEAM_ALPHA = 0.24, FAR_ALPHA = 0.24, HALO_ALPHA = 0.62;
    // a small flame in fine pixels (frames made once): a core, yellow, orange, red tips - flickering, leaning with the wind
    let flameFrames = null;
    function makeFlames() {
        if (flameFrames) return flameFrames;
        const Wd = 16, Hd = 26, out = [];
        const PAL = [[120, 24, 8], [200, 56, 12], [240, 120, 24], [255, 186, 60], [255, 236, 150], [255, 252, 226]];
        for (let f = 0; f < 8; f++) {
            const b = new Bitmap(Wd, Hd), ctx = b.context, img = ctx.createImageData(Wd, Hd);
            for (let y = 0; y < Hd; y++) {
                const v = 1 - y / (Hd - 1);                    // (0 the top .. 1 the foot)
                const sway = Math.sin(f * 0.8 + y * 0.45) * (1 - v) * 1.6;
                const half = (Wd / 2 - 1.2) * Math.pow(v, 0.62) * (0.9 + 0.1 * Math.sin(f * 1.7 + y));
                for (let x = 0; x < Wd; x++) {
                    const dx = Math.abs(x + 0.5 - Wd / 2 - sway);
                    if (dx > half) continue;
                    const e = 1 - dx / (half + 0.01);
                    let heat = e * (0.35 + 0.75 * v) + 0.12 * Math.sin(x * 2.1 + y * 1.3 + f * 2.3);
                    if (y < 4 && ((x + f + y) % 3 === 0)) heat -= 0.25;
                    const k = heat > 0.95 ? 5 : heat > 0.78 ? 4 : heat > 0.6 ? 3 : heat > 0.42 ? 2 : heat > 0.24 ? 1 : heat > 0.1 ? 0 : -1;
                    if (k < 0) continue;
                    const i = (y * Wd + x) * 4, c = PAL[k];
                    img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = k === 0 ? 170 : 255;
                }
            }
            ctx.putImageData(img, 0, 0);
            b._baseTexture.update();
            out.push(b);
        }
        return (flameFrames = out);
    }
    // the beam: a long soft wedge, brightest at the lantern. FIRE light (the user's rule: every light is a flame): the campfire's own
    // colours (Farming_Render's fireGlowBitmap) - the old pale gold, added over the night's blue-green, came out yellow-green
    // (integration 2026-10-16). Two layers: a warm tint laid over the dark (normal blend - it turns the ground under it orange) and
    // the fire's light added on it (add blend, little green and blue)
    const beamBmps = {};
    function beamBitmap(kind) {
        if (beamBmps[kind]) return beamBmps[kind];
        const Lx = 900, Hy = 200, b = new Bitmap(Lx, Hy), ctx = b.context;
        const g = ctx.createLinearGradient(0, 0, Lx, 0);
        const stops = kind === "tint"
            ? [[0, "rgba(255,120,36,0.9)"], [0.08, "rgba(240,104,30,0.62)"], [0.35, "rgba(214,84,24,0.3)"], [1, "rgba(190,64,16,0)"]]
            : [[0, "rgba(255,176,84,0.95)"], [0.08, "rgba(255,144,56,0.66)"], [0.35, "rgba(255,112,36,0.3)"], [1, "rgba(255,88,20,0)"]];
        for (const [at, c] of stops) g.addColorStop(at, c);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, Hy / 2 - 2); ctx.lineTo(Lx, 14); ctx.lineTo(Lx, Hy - 14); ctx.lineTo(0, Hy / 2 + 2); ctx.closePath();
        ctx.filter = "blur(10px)";
        ctx.fill();
        ctx.filter = "none";
        b._baseTexture.update();
        return (beamBmps[kind] = b);
    }
    const BEAM_TINT = 0.75;   // (the tint layer's share of the beam's alpha)
    // the glow of the fire seen from afar ("łuna"): a soft warm round, at the screen's edge towards the lighthouse when it is off it
    let haloBmp = null;
    function haloBitmap() {
        if (haloBmp) return haloBmp;
        const N = 256, b = new Bitmap(N, N), ctx = b.context, g = ctx.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
        g.addColorStop(0, "rgba(255,168,72,0.9)");
        g.addColorStop(0.45, "rgba(255,118,40,0.38)");
        g.addColorStop(1, "rgba(255,88,20,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, N, N);
        b._baseTexture.update();
        return (haloBmp = b);
    }
    // the fog banks: the recipe of Sky.js's morning mist (overlapping round puffs, blurred)
    function hash01(a, b) {
        let h = (a * 374761393 + b * 668265263) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    let fogShapes = null;
    function fogBitmaps() {
        if (fogShapes) return fogShapes;
        fogShapes = [0, 1, 2].map(s => {
            const Wd = 256, Hd = 96, bmp = new Bitmap(Wd, Hd), ctx = bmp.context;
            ctx.filter = "blur(7px)";
            for (let i = 0; i < 9; i++) {
                const x = 40 + hash01(s * 13 + 159, i) * (Wd - 80), y = 38 + hash01(s * 13 + 159, i + 50) * 22, r = 18 + hash01(s * 13 + 159, i + 90) * 26;
                const g = ctx.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, "rgba(255,255,255,0.55)");
                g.addColorStop(1, "rgba(255,255,255,0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.ellipse(x, y, r * 1.6, r * 0.75, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.filter = "none";
            bmp._baseTexture.update();
            return bmp;
        });
        return fogShapes;
    }
    const tagged = (name) => { for (const ev of $gameMap.events()) { const e = ev.event(); if (e && e.note && e.note.indexOf("<Latarnia:" + name + ">") >= 0) return ev; } return null; };
    function spriteOf(spriteset, ev) {
        if (!ev || !spriteset._characterSprites) return null;
        return spriteset._characterSprites.find(s => s._character === ev) || null;
    }
    const darkNow = () => { const Fa = window.Farming; return Fa && Fa.nightAmount && $gameSystem._dayNightTinting ? Fa.nightAmount() : nightNow() !== null ? 1 : 0; };
    // where the flame is on the screen (Map159)
    function fireScreen(spriteset) {
        const s = spriteset._latTower;
        if (!s || !s.parent) return null;
        return { x: s.x + FIRE.x, y: s.y - FIRE.y - 8 };
    }
    function setupSprites(ss) {
        const mid = $gameMap.mapId();
        ss._latMap = mid;
        ss._latTower = null; ss._latFlame = null; ss._latGlass = null;
        if (ss._latLayer && ss._latLayer.parent) ss._latLayer.parent.removeChild(ss._latLayer);
        ss._latLayer = null;
        const far = D.FAR[mid];
        if (mid !== MAP && !far) return;
        // (over the dark of the night - Farming_Render's _nightLight -, under the weather and the interface)
        const layer = new Sprite();
        const nl = ss._nightLight && ss._nightLight.parent === ss ? ss._nightLight : null;
        if (nl) ss.addChildAt(layer, ss.getChildIndex(nl) + 1); else ss.addChild(layer);
        ss._latLayer = layer;
        layer._fog = new Sprite();
        layer._beams = new Sprite();
        layer._halo = new Sprite(haloBitmap());
        layer._halo.anchor.set(0.5, 0.5);
        layer._halo.blendMode = PIXI.BLEND_MODES.ADD;
        layer._halo.scale.set(4.2, 2.6);
        layer.addChild(layer._fog, layer._halo, layer._beams);
        for (let i = 0; i < 2; i++) {
            for (const kind of ["tint", "light"]) {
                const b = new Sprite(beamBitmap(kind));
                b.anchor.set(0, 0.5);
                b.blendMode = kind === "tint" ? PIXI.BLEND_MODES.NORMAL : PIXI.BLEND_MODES.ADD;
                b._beam = i;
                b._tint = kind === "tint";
                layer._beams.addChild(b);
            }
        }
        if (mid === MAP) {
            const shapes = fogBitmaps(), Wm = $gameMap.width() * $gameMap.tileWidth(), Hm = $gameMap.height() * $gameMap.tileHeight();
            for (let i = 0; i < 26; i++) {
                const k = 159 * 3000 + i, b = new Sprite(shapes[i % 3]);
                b.anchor.set(0.5, 0.5);
                const sc = 2.2 + 1.6 * hash01(k, 3);
                b.scale.set(sc * (hash01(k, 4) < 0.5 ? -1 : 1), sc * (0.8 + 0.3 * hash01(k, 5)));
                b._mist = { wx: hash01(k, 1) * Wm, wy: hash01(k, 2) * Hm, vx: 0.15 + 0.2 * hash01(k, 6), ph: hash01(k, 7) * 6.28, base: 0.5 + 0.5 * hash01(k, 8), half: 128 * sc };
                layer._fog.addChild(b);
            }
            const tower = tagged("wieza"), ts = spriteOf(ss, tower);
            if (ts) {
                ss._latTower = ts;
                const glass = new Sprite(ImageManager.loadSystem("Latarnia_Szyby"));
                glass.anchor.set(0.5, 1);
                const flame = new Sprite(makeFlames()[0]);
                flame.anchor.set(0.5, 1);
                flame.x = FIRE.x;
                flame.y = -FIRE.y + 2;
                ts.addChild(glass, flame);
                ss._latGlass = glass;
                ss._latFlame = flame;
            }
        }
    }
    function updateSprites(ss) {
        if (ss._latMap !== $gameMap.mapId()) setupSprites(ss);
        wrapNightLights(ss);
        const mid = $gameMap.mapId(), layer = ss._latLayer, f = Graphics.frameCount;
        const on = has() && lit(), dark = darkNow();
        if (ss._latFlame) {
            ss._latFlame.visible = on;
            if (on) ss._latFlame.bitmap = makeFlames()[Math.floor(f / 5) % 8];
            ss._latGlass.visible = on;
            ss._latGlass.opacity = on ? 255 * (0.55 + 0.4 * dark) * (0.85 + 0.1 * Math.sin(f * 0.13) + 0.05 * Math.sin(f * 0.41)) : 0;
        }
        if (!layer) return;
        // the beams: from the lantern (Map159), or from beyond the right edge (the maps around) - faint
        const far = D.FAR[mid];
        let o = null, alpha = 0;
        if (mid === MAP) { o = fireScreen(ss); alpha = BEAM_ALPHA; }
        else if (far && W() && W().isReady && W().isReady(MAP)) {   // (far off beyond the edge: the beams cross the sky of the screen)
            o = { x: Graphics.width + 220, y: Graphics.height * far.sy };
            alpha = FAR_ALPHA;
        }
        const fog = mid === MAP ? fogAmount() : 0;
        // the glow over the horizon: the fire off the screen (the forest below the cape, the maps around)
        const GW = Graphics.width, GH = Graphics.height;
        const off = !!o && (o.x < -40 || o.x > GW + 40 || o.y < -40 || o.y > GH + 40);
        layer._halo.visible = on && off && dark > 0.05;
        if (layer._halo.visible) {
            layer._halo.x = Math.max(-30, Math.min(GW + 30, o.x));
            layer._halo.y = Math.max(-30, Math.min(GH + 30, o.y));
            layer._halo.alpha = HALO_ALPHA * dark * (mid === MAP ? 1 : 0.8) * (0.86 + 0.08 * Math.sin(f * 0.13) + 0.06 * Math.sin(f * 0.41));
        }
        const beamA = on && o && dark > 0.05 ? alpha * dark * (1 + 0.5 * fog) : 0;
        layer._beams.visible = beamA > 0.005;
        if (layer._beams.visible) {
            const ang = (f / 60) * (Math.PI * 2 / 22);           // (a turn in 22 seconds)
            layer._beams.x = o.x; layer._beams.y = o.y;
            layer._beams.scale.set(1, 0.62);                      // (the beams lie flat over the sea: seen from above, squashed)
            layer._beams.children.forEach(b => {
                const i = b._beam || 0;
                b.rotation = ang + i * Math.PI;
                b.scale.set(mid === MAP ? 2.2 : 2.6, 1);
                b.alpha = beamA * (b._tint ? BEAM_TINT : 1) * (0.85 + 0.15 * Math.sin(f * 0.07 + i));
            });
        }
        // the fog banks over the cape at night (and in the first light), bluish grey in the dark, drifting with the wind
        layer._fog.visible = fog > 0.01;
        if (layer._fog.visible) {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), Wm = $gameMap.width() * tw, GW = Graphics.width, GH = Graphics.height;
            const wind = 1 + 3 * (window.Storm && Storm.wind ? Storm.wind() : 0);
            const tint = dark > 0.5 ? 0xa8b4c8 : 0xd8dee8;
            for (const b of layer._fog.children) {
                const m = b._mist;
                m.wx += m.vx * wind;
                if (m.wx - m.half > Wm) m.wx -= Wm + 2 * m.half;
                const x = $gameMap.adjustX(m.wx / tw) * tw, y = $gameMap.adjustY(m.wy / th) * th + Math.sin(f * 0.004 + m.ph) * 10;
                b.visible = x > -m.half && x < GW + m.half && y > -m.half && y < GH + m.half;
                if (!b.visible) continue;
                b.x = Math.round(x); b.y = Math.round(y);
                b.tint = tint;
                b.alpha = (0.34 + 0.12 * dark) * fog * m.base * (0.8 + 0.2 * Math.sin(f * 0.006 + m.ph * 1.3));
            }
        }
    }
    // the lighthouse's fire into the night layer (Farming_Render): wrapped on the instance, as Humans.js does
    function wrapNightLights(ss) {
        const nl = ss._nightLight;
        if (!nl || typeof nl.lights !== "function" || nl._latarniaLit) return;
        const base = nl.lights;
        nl.lights = function() {
            const out = base.call(this);
            try {
                if ($gameMap.mapId() === MAP && lit()) {
                    const p = fireScreen(ss);
                    if (p) out.push({ x: p.x, y: p.y, r: FIRE_LIGHT * (fogNow() ? 0.8 : 1), i: FIRE_I, id: 6630, glow: true });
                }
            } catch (e) { /* (no light this frame) */ }
            return out;
        };
        nl._latarniaLit = true;
    }
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        try { if (window.$gameMap && $gameMap.mapId() > 0) updateSprites(this); } catch (e) { if (!this._latErr) { this._latErr = true; console.error("[Latarnia] sprites", e); } }
    };

    // the things that change with the hour on our maps: the lens's look, the basket's fire upstairs, the bell
    let bellLeft = 0, bellNext = 0, bellEv = null;
    function updateThings() {
        if (onMap(MAP)) {
            const sk = $gameMap.event(D.IDS[0]);
            if (sk) { const on = S().lens === "stolen" && campNight(); sk.setOpacity(on ? 255 : 0); sk.setThrough(!on); }
        }
        if (onMap(LATERNA)) {
            const L = tagged("soczewka"), k = tagged("kosz");
            const st = S().lens, d = st === "whole" ? 2 : st === "broken" ? 4 : 6;
            // (their pages have a fixed direction - turning to the hero would change the row: set straight)
            if (L) { L._direction = d; L.setStepAnime(st === "whole"); }
            const on = lit();
            if (k) { k._direction = on ? 2 : 6; k.setStepAnime(on); if (!on) k.setPattern(1); }
        }
    }
    function ring() {
        bellLeft = 3;
        bellNext = Graphics.frameCount + 10;
        bellEv = onMap(MAP) ? tagged("dzwon") : null;
    }
    function updateBell() {
        if (bellLeft > 0 && Graphics.frameCount >= bellNext) {
            T.audio.se("Bell1", { volume: onMap(MAP) ? 75 : 40, pitch: 62 });
            bellLeft--;
            bellNext = Graphics.frameCount + 80;
        }
        if (bellEv && (bellLeft > 0 || Graphics.frameCount < bellNext + 40)) {
            const s = SceneManager._scene && SceneManager._scene._spriteset ? spriteOf(SceneManager._scene._spriteset, bellEv) : null;
            if (s) s.x += Math.round(Math.sin(Graphics.frameCount * 0.6) * 1.4);
        }
    }
    T.on("hourChange", p => {
        if (!has()) return;
        updatePlan();
        if (ours() && fogNow()) ring();
    }, { owner: PLUGIN });
    T.on("dayStart", () => { if (has()) { updatePlan(); settle(); } }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The place is built: the mountains' right edge leads up here (Wyspa.js)
    // ------------------------------------------------------------------
    // (only once data/Map159.json is the real map - package 0's stub has the note <Wyspa:szkielet>: until the coordinator installs
    // the map, the way from the mountains stays shut. Read once at the start, the way the engine reads its data files)
    let built = false;
    (function checkBuilt() {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "data/Map" + String(MAP).padStart(3, "0") + ".json");
            xhr.overrideMimeType("application/json");
            xhr.onload = () => {
                try {
                    const n = xhr.status < 400 ? String(JSON.parse(xhr.responseText).note || "") : "<Wyspa:szkielet>";
                    if (!/<Wyspa:szkielet>/.test(n)) { built = true; const w = W(); if (w && w.ready) w.ready(MAP); }
                } catch (e) { /* (no map: not built) */ }
            };
            xhr.send();
        } catch (e) { /* (no XHR: not built) */ }
    })();

    hookQuests();
    let tick = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        updateBell();
        if (++tick % 30 !== 0) return;
        updatePlan();
        if (window.$gameSwitches) { const f = fogNow(); if ($gameSwitches.value(SWITCH_FOG) !== f) $gameSwitches.setValue(SWITCH_FOG, f); }
        updateRaid();
        updateThieves();
        if (ours()) updateThings();
    }, { owner: PLUGIN, name: "lighthouse" });
    T.on("mapReady", () => {
        hookQuests();
        // (first: before the other hooks for Janek - "Nie, w innej sprawie" lets them speak)
        hookTalk();
        if (!has()) return;
        updatePlan();
        settle();
        if (ours()) updateThings();
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    const api = {
        MAP, IZBA, LATERNA, DATA: D, state: () => S(), act: actCall, door, izbaDoor, edge, look, book, lens, wreckage, sack, vision, seeVision,
        lit, fogNow, fogAmount, fogTonight, nextFog, nightNow, dusk, dawn, sun, settle, sell, forecast, weatherOf, placeNow, indoorSpot,
        updatePlan: d => { planDay = 0; updatePlan(d); return D.PLAN.map(e => e[0]); }, visionBusy, seenCount, visionFor, lensBlock, towerOpen, heavy, spawnRaid, raidOutcome, updateRaid, updateThieves, campNight, RECIPE,
        built: () => built, bazyliHere,
        info: () => (has() ? { fuel: S().fuel, lit: lit(), fog: fogNow(), night: nightNow(), dusk: dusk(day()), dawn: dawn(day()), lens: S().lens,
            visions: Object.keys(S().visions).map(Number), raid: S().raid, place: placeNow(), built } : { built })
    };
    window.Latarnia = T.register(PLUGIN, api);
})();
