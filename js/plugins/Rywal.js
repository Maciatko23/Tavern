//=============================================================================
// Rywal.js
//=============================================================================
// W9 chapter 3 "Rywal w ruinach" (docs/QUESTY.md W9 ch. 3; the data: Rywal_Data.js). Someone from outside goes down for the Heart
// too - the one the hero did not win over (who(): Grum with his mercenaries, the Lord's men, Baltazar's men, or - Baltazar in the
// hero's grip / everyone won over - the Black Eyes' own diggers with their commander). The flow:
//   - the night after the grate in the tavern's cellar was opened (Act II) they go in through the cellar; then a floor every few
//     hours down floors 1-10 (never into the floor the hero is on, never out of it while he is there); the tenth gate stops them
//     (the armour wants the words) - after some days there they give up and go back up with what they took
//   - the floors they passed keep their traces (injected events 828-839, no map file changed): their mark (the White Eye in chalk /
//     the Lord's pennant), boot prints, cold camps and bedrolls, a dropped rope, a tripwire with bells across the way (sneaking: cut
//     in time); they empty part of the containers not yet searched and tear out the Order's notes about the way down
//   - the meeting on the floor they are on (their camp fire in the stairs' room; at the tenth gate in the guard hall): a talk with
//     choices (a fight - Humans.js: beaten, the hero is robbed, never killed; the party's own deal: the guard's words sold / the hero
//     as their guide / a report to the Lord / Grum turned; a warning of the armour; walk on) - or, if he dawdles, nothing: they go
//   - the outcome: flags in TownQuests (the contract in docs/QUESTY_STAN.md), the journal, W9's chapter in the journal (two steps
//     appended to TownQuests' W9 - the old saves' step numbers stay), Act III (Act3_Data reads w9FrakcjaPobita / w9FrakcjaWie /
//     w9DowodcaPolegl; grumAlly / grumGone / grumDead), the Heart (Underground.world().rival, its epilogue line, the Lord's line;
//     the ones who went down past the gate wait before the Heart's door as witnesses)
// (2026-10-23) The words: js/teksty/rywal.txt (Rywal_Data's TX - Watki.js reads the file when the game starts).
// API: window.Rywal (Tawerna.api("Rywal")).

/*:
 * @target MZ
 * @plugindesc [W9 rozdz. 3] „Rywal w ruinach”: ktoś z zewnątrz schodzi po Serce przed bohaterem - ślady na piętrach 1-10, pułapki, puste skrzynie, wyrwane zapiski, spotkanie (rozmowa albo walka), skutki w Akcie III i przy Sercu. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Rywal_Data
 * @orderAfter Rywal_Data
 * @orderAfter TownQuests
 * @orderAfter Underground
 * @orderAfter Humans
 * @orderAfter Act3
 * @orderAfter Kantor
 *
 * @help
 * ============================================================================
 * Rywal.js - W9 rozdz. 3 „Rywal w ruinach”
 * ============================================================================
 * Kto: Grum z najemnikami (W8: frakcja albo przegrana przy tunelu), ludzie
 * Lorda (Lord rywalem: W1 a, chłodny, gałąź dworska, działka u Lorda), ludzie
 * Baltazara (Baltazar nie w garści bohatera - W5), a gdy Baltazar w garści
 * (podwójna gra) albo wszyscy po stronie bohatera - kopacze Czarnych Oczu
 * z dowódcą. Dokładnie jedna drużyna, w tej kolejności.
 * Kiedy: noc po otwarciu kraty w piwnicy tawerny (Akt II). Co 6 godzin gry
 * piętro niżej, najwyżej do dziesiątej bramy; po 3 dniach przy bramie
 * odchodzą. Ślady na piętrach, linka z dzwonkami (skradanie - C - widać ją
 * w porę), puste skrzynie, wyrwane zapiski zakonu. Spotkanie na ich piętrze.
 * Zdarzenia 828-839 (rejestr TawernaCore: "Rywal"). F9, zakładka „Wyspa
 * i fabuła”: „W9: rywal (wymuś wariant)” i „W9: rywal - spotkanie”.
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("rywal");   // (the words of this file: js/teksty/rywal.txt, kod.*)
    const T = window.Tawerna;
    const D = window.RywalData;
    if (!T) throw new Error("Rywal.js: brak TawernaCore.js");
    if (!D) { console.warn("Rywal.js: brak Rywal_Data.js - rozdział „Rywal w ruinach” wyłączony"); return; }
    const PLUGIN = "Rywal";
    // the thread (Rywal_Data.js, the engine Watki.js): the state, W9's steps of chapter 3, the leader's talk, the thoughts, the flags
    const w = Watki.get("rywal");
    if (!w) { console.warn("Rywal.js: brak wątku „rywal” (Rywal_Data.js / Watki.js) - rozdział „Rywal w ruinach” wyłączony"); return; }
    const M = D.MAP, EV = D.EV, ART = D.ART, TX = D.TX, TM = D.TIME, TR = D.TRAIL;
    const TAG = "w9Rywal", TAG_LEAD = "w9RywalLead";
    const { C, linesTo } = Watki.mowa;
    const day = () => T.time.day(), hour = () => T.time.hour();
    const now = () => day() * 24 + hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const UG = () => T.api("Underground") || window.Underground || null;
    const HM = () => T.api("Humans") || window.Humans || null;
    const HU = () => T.api("Hunting") || window.Hunting || null;
    const SB = () => T.api("SpeechBubbles") || window.SpeechBubbles || null;
    const RA = () => window.RoamingActor || null;
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const onMap = id => !!(window.$gameMap && $gameMap.mapId() === id);
    const report = (where, e) => console.error("[Rywal] " + where + ":", e);
    const fill = Watki.mowa.fill;
    const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
    const DIR4 = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 4 : 6) : (dy < 0 ? 8 : 2));
    let auto = true;   // (tests of other systems: Rywal.auto(false) - the chapter does not begin by itself, the rival does not move)

    // ------------------------------------------------------------------
    // The state (the save): the thread's (Rywal_Data.js)
    // ------------------------------------------------------------------
    const defaults = w.def.stan.domyslne;
    const S = () => w.S();
    function fresh(keep) {
        const s = S(), d = defaults();
        for (const k of Object.keys(s)) delete s[k];
        Object.assign(s, d, keep || {});
        layouts.clear();
        return s;
    }

    // TownQuests' flags, things, records (the thread's)
    const { flags, flag, setFlag, rec } = w;
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const xp = (n, why) => T.call("Combat", "gainXp", n, why || TK.kod.xp[0]);
    const actTwo = () => { const q = TQ(); try { return !!(q && q.actTwo && q.actTwo()); } catch (e) { return false; } };
    const gateOpen = () => { const U = UG(); try { return !!(U && U.isOpen && U.isOpen()); } catch (e) { return false; } };
    const party = () => (S().party ? D.PARTIES[S().party] || null : null);
    const heroFloor = () => { const U = UG(); return U && window.$gameMap ? U.floorOf($gameMap.mapId()) || 0 : 0; };
    const ugState = () => { const U = UG(); return U && U.state ? U.state() : { notes: {}, deepest: 0 }; };
    const sneaking = () => !!T.call("Hunting", "sneaking");

    // ------------------------------------------------------------------
    // Who goes down (one party, in this order - see Rywal_Data.js)
    // ------------------------------------------------------------------
    function lordWhyOf(w) {
        const fl = flags();
        if (fl.w7KlamstwoWyszlo) return "lordLie";   // (2026-10-17, W7 ch. 6: the hero lied about the ruins - it came out)
        if (!w) return "lordCold";
        if (w.fieldLost) return "lordField";
        if (w.lordFlags && w.lordFlags.branch) return "lordBranch";
        if (fl.w1Revealed) return "lordShamed";
        if (w.lordFlags && w.lordFlags.cold) return "lordCold";
        return "lordForced";
    }
    function who(ignoreForce) {
        const s = S(), f = flags();
        if (!ignoreForce && s.forced && D.PARTIES[s.forced]) return { key: s.forced, why: "forced" };
        if ((f.w8Faction || f.w8Lost) && !f.grumAlly && !f.grumGone && !f.grumDead) return { key: "grum", why: f.w8Lost ? "grumLost" : "grumFaction" };
        const U = UG();
        let w = null, stance = "absent";
        try { w = U && U.world ? U.world() : null; stance = w && U.lordStance ? U.lordStance(w) : "absent"; } catch (e) { w = null; }
        if (stance === "rival") return { key: "lord", why: lordWhyOf(w) };
        // (2026-10-17, W7 ch. 6 - Dwor.js) the hero tells the Lord everything he finds: the Lord's men go down after him - not as his
        // enemies (the Lord an ally), but the same party of the manor's guard as the rival's (W9 ch. 3)
        if (f.w7LordFirst && !f.w7KlamstwoWyszlo) return { key: "lord", why: "lordFirst" };
        const K = T.api("Kantor");
        let mode = "normal";
        try { mode = K && K.mode ? K.mode() : "normal"; } catch (e) { mode = "normal"; }
        if (mode !== "grip") return { key: "baltazar", why: mode === "enemy" ? (f.w5BaltazarWrocil ? "baltazarBack" : "baltazarEnemy") : "baltazarFree" };
        return { key: "kopacze", why: f.w5FactionWatches ? "kopaczeGrip" : "kopaczeAll" };
    }

    // ------------------------------------------------------------------
    // The clock: the chapter begins, the rival goes down a floor every TM.pace hours, gives up at the gate
    // ------------------------------------------------------------------
    function begin() {
        const s = S(), w = who();
        s.party = w.key; s.why = w.why; s.rf = 1; s.at = s.enter || now(); s.began = day();
        setFlag("w9Rywal"); setFlag(D.PARTIES[s.party].flag);
        T.emit("w9RywalBegin", { party: s.party, why: s.why });
    }
    function tick() {
        if (!has() || !auto) return;
        const s = S();
        if (!s.party) {
            if (!gateOpen() || !actTwo() || !UG()) return;
            if (!s.gateDay) s.gateDay = day();
            if (!s.enter) s.enter = (s.gateDay + 1) * 24 + TM.enter;
            if (now() < s.enter) return;
            begin();
        }
        advance();
    }
    function advance() {
        const s = S();
        if (!s.party || s.outcome || s.fight) return;
        const hf = heroFloor(), t = now();
        while (s.rf < TM.cap && t - s.at >= TM.pace) {
            const nf = s.rf + 1;
            if (hf === s.rf || hf === nf) break;   // (the hero on their floor - the meeting; or on the next one - they wait till he goes)
            passFloor(s.rf);
            s.rf = nf;
            s.at += TM.pace;
            s.met = 0; s.talked = 0;
            if (s.rf >= TM.cap && !s.gateSince) { s.gateSince = s.at; tearNotes(TM.cap); }   // (their camp in the guard hall: the note there is theirs)
        }
        // at the tenth gate: the armour lets nobody by without the words - after some days they give up and go back up
        if (s.rf >= TM.cap && s.gateSince && hf !== TM.cap && t - s.gateSince >= TM.giveUpDays * 24) leave();
    }
    // the floor they leave: the containers they empty, the notes they tear out, the traces they leave behind
    const chance = (...a) => { const U = UG(); return U && U.hash ? (U.hash(U.seed ? U.seed() : 1, "rywal", ...a) % 1000) / 1000 : Math.random(); };
    function passFloor(f) {
        const s = S(), U = UG();
        if (!U || s.passed[f]) return;
        s.passed[f] = day();
        s.trail[f] = { day: day() };
        if (f < TM.cap) {
            const mapId = U.mapOf(f), got = U.floorData ? U.floorData(f) : null, loot = got && got.info ? got.info.loot || {} : {};
            const robbed = [];
            for (const id of Object.keys(loot)) {
                const e = loot[id];
                if (!e || !TR.robKinds.includes(e.kind) || $gameSelfSwitches.value([mapId, Number(id), "A"])) continue;
                if (chance(f, id) < TR.rob) robbed.push(Number(id));
            }
            if (robbed.length) s.robbed[mapId] = robbed;
        }
        tearNotes(f);
    }
    function tearNotes(f) {
        const s = S(), read = ugState().notes || {};
        for (const key of TR.torn[f] || []) if (!read[key] && !s.torn[key]) s.torn[key] = f;
    }
    function leave() {
        const s = S();
        if (s.outcome) return;
        passFloor(TM.cap);
        resolve("odeszli", { silent: true });
    }

    // ------------------------------------------------------------------
    // The places on a generated floor (1-9): a walk from the stairs up to the stairs down (the tileset's flags, as the engine reads
    // them) - the prints, the mark, the tripwire, the rope along it; a camp in a middle room; the meeting by the stairs down
    // ------------------------------------------------------------------
    const layouts = new Map();
    const BIT = { 2: 1, 4: 2, 6: 4, 8: 8 }, REV = { 2: 8, 4: 6, 6: 4, 8: 2 }, STEP = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
    function passOf(W, H, data, fl) {
        return (x, y, bit) => {
            if (x < 0 || y < 0 || x >= W || y >= H) return false;
            for (let z = 3; z >= 0; z--) {
                const id = data[(z * H + y) * W + x];
                if (!id && z > 0) continue;
                const f = fl[id] || 0;
                if (f & 0x10) continue;
                if ((f & bit) === 0) return true;
                if ((f & bit) === bit) return false;
            }
            return false;
        };
    }
    function layoutOf(f) {
        const U = UG();
        if (!U || !U.floorData || f < 1 || f >= TM.cap) return null;
        const key = (U.seed ? U.seed() : 0) + ":" + f;
        if (layouts.has(key)) return layouts.get(key);
        let out = null;
        try { out = makeLayout(f); } catch (e) { report("layout " + f, e); out = null; }
        layouts.set(key, out);
        return out;
    }
    function makeLayout(f) {
        const U = UG(), got = U.floorData(f);
        if (!got || !got.map || !got.info) return null;
        const map = got.map, info = got.info, W = map.width, H = map.height;
        const fl = U.flags ? U.flags(U.bandOf(f)) : null;
        if (!fl) return null;
        const pass = passOf(W, H, map.data, fl);
        const K = (x, y) => y * W + x;
        const occupied = new Set(), blocked = new Set();
        for (const e of map.events) {
            if (!e) continue;
            occupied.add(K(e.x, e.y));
            const p = e.pages[0];
            if (p.priorityType === 1 && !p.through) blocked.add(K(e.x, e.y));
        }
        const up = info.spots.up, down = info.spots.down;
        if (!up || !down) return null;
        // the walk (4 ways) from the landing of the stairs up to the landing of the stairs down
        const prev = new Map([[K(up[0], up[1]), -1]]), q = [[up[0], up[1]]];
        while (q.length) {
            const [x, y] = q.shift();
            for (const d of [2, 4, 6, 8]) {
                const nx = x + STEP[d][0], ny = y + STEP[d][1], k = K(nx, ny);
                if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev.has(k) || blocked.has(k)) continue;
                if (!pass(x, y, BIT[d]) || !pass(nx, ny, BIT[REV[d]])) continue;
                prev.set(k, K(x, y));
                q.push([nx, ny]);
            }
        }
        const reach = prev;   // (every cell one can walk to from the stairs up)
        const kd = K(down[0], down[1]);
        if (!reach.has(kd)) return null;
        const path = [];
        for (let k = kd; k !== -1; k = reach.get(k)) path.unshift([k % W, Math.floor(k / W)]);
        const onPath = new Set(path.map(([x, y]) => K(x, y)));
        const L = path.length;
        const free = (x, y) => reach.has(K(x, y)) && !occupied.has(K(x, y));
        const taken = new Set();
        const take = c => { if (c) taken.add(K(c[0], c[1])); return c; };
        const ok = (x, y, off) => free(x, y) && !taken.has(K(x, y)) && (!off || !onPath.has(K(x, y)));
        const n8 = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].map(([dx, dy]) => [x + dx, y + dy]);
        const nearOff = (cx, cy, r) => {   // the nearest free cell off the walk within r
            let best = null, bd = 1e9;
            for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
                if (!ok(x, y, true)) continue;
                const dd = Math.hypot(x - cx, y - cy);
                if (dd < bd) { bd = dd; best = [x, y]; }
            }
            return best;
        };
        const flow = i => {   // the walk's way at step i: "H" (along x) or "V"
            const a = path[Math.max(0, i - 1)], b = path[Math.min(L - 1, i + 1)];
            return Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]) ? "H" : "V";
        };
        const roomOf = (x, y) => info.rooms.find(r => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h) || null;
        const lay = { floor: f, path, up, down };
        // the boot prints (decals on the walk) and the mark beside the stairs down
        const iA = Math.max(1, Math.round(L * 0.3)), iB = Math.max(2, Math.round(L * 0.62));
        lay.printsA = take(L > 4 ? [path[iA][0], path[iA][1], flow(iA)] : null);
        lay.printsB = take(L > 6 ? [path[iB][0], path[iB][1], flow(iB)] : null);
        lay.mark = take([[down[0] - 1, down[1]], [down[0] + 1, down[1]], [down[0] - 1, down[1] + 1], [down[0] + 1, down[1] + 1]].find(([x, y]) => ok(x, y, true)) || nearOff(down[0], down[1], 2));
        // the tripwire: a cell of the walk near its middle (a corridor's 2-wide way preferred), not by the stairs
        let ti = -1;
        const mid = Math.round(L * 0.55);
        for (let d = 0; d < L && ti < 0; d++) {
            for (const i of [mid + d, mid - d]) {
                if (i < 4 || i > L - 5 || ti >= 0) continue;
                const [x, y] = path[i];
                if (taken.has(K(x, y)) || occupied.has(K(x, y))) continue;
                const rm = roomOf(x, y);
                if (!rm || d > L * 0.25) { ti = i; break; }
            }
        }
        lay.trap = take(ti >= 0 ? [path[ti][0], path[ti][1], flow(ti) === "H" ? "V" : "H"] : null);
        // the rope: off the walk, near its middle
        const ri = Math.round(L * 0.45);
        lay.rope = take(L > 4 ? nearOff(path[ri][0], path[ri][1], 2) : null);
        // the camp: in a middle room (not the stairs' rooms), the one the walk crosses most - else the end room
        const mids = info.rooms.filter(r => !r.start && !r.end);
        const score = r => path.filter(([x, y]) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h).length;
        const room = mids.sort((a, b) => score(b) - score(a))[0] || info.rooms.find(r => r.end);
        if (room) {
            const cx = Math.floor(room.x + room.w / 2), cy = Math.floor(room.y + room.h / 2) + 1;
            const c = nearOff(cx, cy, Math.max(room.w, room.h));
            if (c && roomOf(c[0], c[1]) === room) {
                lay.camp = take(c);
                lay.bed = take(n8(c[0], c[1]).filter(([x, y]) => ok(x, y, true) && Math.abs(x - c[0]) + Math.abs(y - c[1]) === 2)[0] ||
                    n8(c[0], c[1]).find(([x, y]) => ok(x, y, true)) || null);
            }
        }
        // the meeting: their fire in the end room 2-7 tiles from the landing, off the walk, room round it for the men
        const endRoom = info.rooms.find(r => r.end);
        let fire = null, fd = 1e9;
        if (endRoom) {
            for (let y = endRoom.y; y < endRoom.y + endRoom.h; y++) for (let x = endRoom.x; x < endRoom.x + endRoom.w; x++) {
                if (!ok(x, y, true)) continue;
                const dd = Math.hypot(x - down[0], y - down[1]);
                if (dd < 2.5 || dd > 7.5) continue;
                const room8 = n8(x, y).filter(([a, b]) => ok(a, b, true)).length;
                if (room8 < 4) continue;
                const sc = Math.abs(dd - 4) - room8 * 0.15;
                if (sc < fd) { fd = sc; fire = [x, y]; }
            }
        }
        if (!fire) fire = nearOff(path[Math.max(0, L - 4)][0], path[Math.max(0, L - 4)][1], 3);
        lay.fire = take(fire);
        if (fire) {
            const men = [];
            for (const [x, y] of [[fire[0] - 1, fire[1]], [fire[0] + 1, fire[1]], [fire[0], fire[1] + 1], [fire[0] - 1, fire[1] + 1], [fire[0] + 1, fire[1] + 1], [fire[0], fire[1] - 1]]) {
                if (men.length >= 3) break;
                if (ok(x, y, true)) men.push(take([x, y, DIR4(fire[0] - x, fire[1] - y)]));
            }
            lay.men = men;
            // the leader: beside the walk a few steps before the landing, facing the way the hero comes
            let lead = null;
            for (let k = 4; k < Math.min(L - 1, 10) && !lead; k++) {
                const [px, py] = path[L - 1 - k];
                const c = [[px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]].find(([x, y]) => ok(x, y, true));
                if (c) {
                    const back = path[Math.max(0, L - 1 - k - 4)];
                    lead = [c[0], c[1], DIR4(back[0] - c[0], back[1] - c[1])];
                }
            }
            lay.lead = take(lead || (() => { const c = nearOff(fire[0], fire[1], 3); return c ? [c[0], c[1], 2] : null; })());
            lay.bed2 = take(n8(fire[0], fire[1]).map(([x, y]) => [x + (x - fire[0]), y + (y - fire[1])]).find(([x, y]) => ok(x, y, true)) || null);
        }
        lay.spawns = (info.spawns || []).map(sp => [sp.x, sp.y]);
        return lay;
    }

    // ------------------------------------------------------------------
    // The events (Tawerna.inject 828-839): what the state says the map holds when it loads; hidden / shown at runtime
    // ------------------------------------------------------------------
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function eventData(id, name, x, y, o) {
        o = o || {};
        const img = o.img || ["", 0, 2, 1];
        const page = { conditions: Object.assign({}, BLANK), directionFix: !!o.fix,
            image: { tileId: 0, characterName: img[0], characterIndex: img[1] || 0, direction: o.dir || img[2] || 2, pattern: img[3] !== undefined ? img[3] : 1 },
            list: [C(355, ["Rywal.act(this);"]), C(0, [])], moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false },
            moveSpeed: o.speed || 3, moveType: 0, priorityType: o.priority === undefined ? 1 : o.priority, stepAnime: !!o.step, through: !!o.through, trigger: 0,
            walkAnime: o.walk !== false };
        return { id, name: "W9: " + name, note: "<Rywal:" + (o.key || name) + ">" + (o.note || ""), pages: [page], x, y };
    }
    const decal = (id, name, c, img, key) => eventData(id, name, c[0], c[1], { key, img, fix: true, walk: false, priority: 0, through: true });
    const markArt = P => (P.mark === "pennant" ? ART.pennant : ART.eyeArrow);
    const printsArt = way => (way === "V" ? ART.printsV : ART.printsH);
    // the party at its camp (the meeting): the fire, the leader, the men; at the tenth gate a wounded one too
    function groupEvents(P, lay, gate) {
        const out = [];
        out.push(eventData(EV.fire, TK.kod.groupEvents[0], lay.fire[0], lay.fire[1], { key: "fire", img: ART.fire, fix: true, walk: false, step: true, note: D.FIRE_LIGHT }));
        if (lay.lead) out.push(eventData(EV.lead, P.lead.name, lay.lead[0], lay.lead[1], { key: "lead", img: [P.lead.img[0], P.lead.img[1], lay.lead[2] || 2, 1], dir: lay.lead[2] || 2, speed: 4 }));
        const men = menOf(P);
        (lay.men || []).slice(0, men.length).forEach((c, i) => out.push(eventData(EV.man0 + i, men[i].name, c[0], c[1], { key: "man" + i, img: [men[i].img[0], men[i].img[1], c[2] || 2, 1], dir: c[2] || 2, speed: 4 })));
        if (lay.bed) out.push(eventData(EV.bed, TK.kod.groupEvents[1], lay.bed[0], lay.bed[1], { key: "bed", img: ART.bedSpread, fix: true, walk: false, priority: 0, through: true }));
        if (gate && lay.wounded) out.push(eventData(EV.extra, "Ranny", lay.wounded[0], lay.wounded[1], { key: "wounded", img: [P.wounded[0], P.wounded[1], lay.wounded[2] || 2, 1], fix: true, walk: false }));
        else if (lay.bed2) out.push(eventData(EV.extra, TK.kod.groupEvents[1], lay.bed2[0], lay.bed2[1], { key: "bed", img: ART.bedRolled, fix: true, walk: false, priority: 0, through: true }));
        return out;
    }
    // the camp they left behind (after the meeting's end, or a camp floor they passed)
    function campLeft(lay) {
        const out = [];
        if (lay.fire) out.push(eventData(EV.fire, TK.kod.campLeft[0], lay.fire[0], lay.fire[1], { key: "ash", img: ART.ash, fix: true, walk: false }));
        if (lay.bed) out.push(eventData(EV.bed, TK.kod.campLeft[1], lay.bed[0], lay.bed[1], { key: "bed", img: ART.bedHeap, fix: true, walk: false, priority: 0, through: true }));
        return out;
    }
    // the men of the party (Baltazar the enemy: a mercenary instead of the archer)
    function menOf(P) {
        if (P === D.PARTIES.baltazar) {
            const K = T.api("Kantor");
            let m = "normal";
            try { m = K && K.mode ? K.mode() : "normal"; } catch (e) { m = "normal"; }
            if (m === "enemy") return P.men.slice(0, 2).concat([P.enemyMan]);
        }
        return P.men;
    }
    // the creatures' places near their camp: emptied (they cleared the room - Creatures.js keeps a marker empty some days)
    function clearCreatures(mapId, spawns, at, r) {
        const Cr = T.api("Creatures");
        const st = Cr && Cr.state ? Cr.state() : null;
        if (!st || !st.killed || !at) return;
        for (const [x, y] of spawns || []) if (Math.hypot(x - at[0], y - at[1]) <= r) st.killed[mapId + ":" + x + "," + y] = day();
    }
    function build(data, mapId) {
        if (!has()) return [];
        const s = S(), P = party(), U = UG();
        if (!P || !U) return [];
        try {
            if (mapId === M.ruins) return buildRuins(P);
            if (mapId === M.heart) return buildHeart(P);
            const f = U.floorOf(mapId);
            if (!(f >= 1 && f <= TM.cap) || f > s.rf) return [];
            return f === TM.cap ? buildGate(P, mapId) : buildFloor(P, f, mapId);
        } catch (e) { report("build " + mapId, e); return []; }
    }
    function buildRuins(P) {
        const R = D.RUINS, out = [];
        R.prints.forEach((p, i) => out.push(decal(EV.printsA + i, TK.kod.buildRuins[0], p, printsArt(p[2]), "prints")));
        out.push(decal(EV.mark, P.mark === "pennant" ? TK.kod.buildRuins[1] : TK.kod.buildRuins[2], R.mark, markArt(P), "mark"));
        return out;
    }
    function buildFloor(P, f, mapId) {
        const s = S(), lay = layoutOf(f), out = [];
        if (!lay) return out;
        const here = f === s.rf, tr = s.trail[f] || null;
        if (lay.printsA) out.push(decal(EV.printsA, TK.kod.buildFloor[0], lay.printsA, printsArt(lay.printsA[2]), "prints"));
        if (lay.printsB && (tr || here)) out.push(decal(EV.printsB, TK.kod.buildFloor[0], lay.printsB, printsArt(lay.printsB[2]), "prints"));
        if (lay.mark && tr) out.push(decal(EV.mark, P.mark === "pennant" ? TK.kod.buildFloor[1] : TK.kod.buildFloor[2], lay.mark, markArt(P), "mark"));
        if (tr && TR.rope.includes(f) && lay.rope && !s.ropes[f]) out.push(eventData(EV.rope, TK.kod.buildFloor[3], lay.rope[0], lay.rope[1], { key: "rope", img: ART.ropeEnd, fix: true, walk: false, priority: 0, through: true }));
        if (tr && TR.trap.includes(f) && lay.trap) out.push(decal(EV.trap, TK.kod.buildFloor[4], lay.trap, s.traps[f] ? ART.wireCut : lay.trap[2] === "V" ? ART.wireV : ART.wireH, "trap"));
        if (here && !s.outcome) {
            if (lay.fire) { out.push(...groupEvents(P, lay, false)); clearCreatures(mapId, lay.spawns, lay.fire, 7); }
        } else if (here || (s.outcome && s.outFloor === f)) {
            if (lay.fire) out.push(...campLeft(lay));
        } else if (tr && TR.camp.includes(f) && lay.camp) {
            out.push(...campLeft({ fire: lay.camp, bed: lay.bed }));
        }
        return out;
    }
    function buildGate(P, mapId) {
        const s = S(), G = D.FLOOR10, out = [];
        G.prints.forEach((p, i) => out.push(decal(EV.printsA + i, TK.kod.buildGate[0], p, printsArt(p[2]), "prints")));
        out.push(decal(EV.mark, P.mark === "pennant" ? TK.kod.buildGate[1] : TK.kod.buildGate[2], G.mark, markArt(P), "mark"));
        const lay = { fire: G.fire, lead: G.lead, men: G.men, bed: G.bed, bed2: G.bed2, wounded: G.wounded };
        if (!s.outcome) { out.push(...groupEvents(P, lay, true)); clearCreatures(mapId, [G.spider], G.fire, 8); }
        else out.push(...campLeft(lay));
        return out;
    }
    // the Heart (Map011): the ones who went down past the gate (the words sold, the hero their guide) wait before the door
    function buildHeart(P) {
        const s = S(), U = UG(), H = D.HEART, out = [];
        if (!s.deep || (U && U.state && U.state().ending)) return out;
        out.push(eventData(EV.lead, P.lead.name, H.lead[0], H.lead[1], { key: "witness", img: [P.lead.img[0], P.lead.img[1], H.lead[2], 1], dir: H.lead[2] }));
        const m = menOf(P)[0];
        out.push(eventData(EV.man0, m.name, H.man[0], H.man[1], { key: "witnessMan", img: [m.img[0], m.img[1], H.man[2], 1], dir: H.man[2] }));
        out.push(eventData(EV.fire, TK.kod.buildHeart[0], H.ash[0], H.ash[1], { key: "ash", img: ART.ash, fix: true, walk: false }));
        return out;
    }
    const injMaps = id => id === M.ruins || id === M.heart || id === M.floor10 || (id > 130 && id < 140);
    T.inject(injMaps, { ids: D.IDS, owner: PLUGIN, build });

    const evOf = id => (window.$gameMap ? $gameMap.event(id) : null);
    const keyOf = ev => { const m = ev && ev.event() && /<Rywal:(\w+)>/.exec(ev.event().note || ""); return m ? m[1] : ""; };
    function remember(ev) { if (ev && ev._w9prio === undefined) { ev._w9prio = ev._priorityType; ev._w9through = ev.isThrough(); } }
    function hideEv(ev) {
        if (!ev || ev._w9hidden === true) return;
        remember(ev);
        ev._w9hidden = true;
        ev.setTransparent(true); ev.setThrough(true); ev._priorityType = 0;
    }
    function showEv(ev) {
        if (!ev || ev._w9hidden !== true) return;
        ev._w9hidden = false;
        ev.setTransparent(false); ev.setThrough(!!ev._w9through); ev._priorityType = ev._w9prio === undefined ? 1 : ev._w9prio;
    }
    const hidden = ev => !ev || ev._w9hidden === true || ev.isTransparent();
    const groupIds = () => [EV.lead, EV.man0, EV.man1, EV.man2];
    const say = (ch, text, frames) => { const sb = SB(); if (sb && sb.say && ch && text) sb.say(ch, text, frames || 200); };

    // bubbles one after another outside a talk (over the hero "> ...", or over a character) - the thread's (Rywal_Data mysli)
    const think = (lines, whoCh) => w.mysl(lines, whoCh);
    const calm = () => !$gameMessage.isBusy() && !$gameMap.isEventRunning() && !$gamePlayer.isTransferring() && SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging();

    // ------------------------------------------------------------------
    // What the hero knows (the deals and the warning ask it)
    // ------------------------------------------------------------------
    const knowsWords = () => { const U = UG(); return !!(flag("borgarSaying") || (U && U.gate10 && U.gate10())); };
    function knowsGuardian() {
        const n = ugState().notes || {};
        return knowsWords() || (ugState().deepest || 0) >= TM.cap || !!(n["8"] || n["10a"] || n["10d"]);
    }
    function grumReasons() {
        const f = flags(), q = TQ(), out = [], R = TX.turn.powody;
        let chron = false;
        try { chron = (q && q.vcount ? q.vcount("kroniki") > 0 : false) || !!f.ambrozyChronicles || (!!f.chroniclesForAmbrozy && !f.w5ChroniclesSold); } catch (e) { chron = false; }
        if (f.marekSaved) out.push(R.marek);
        if (chron) out.push(R.kroniki);
        if (f.w8Honour) out.push(R.honor);
        return out;
    }
    function grumCount() {
        const q = TQ();
        try { if (q && q.FX && q.FX.w8Choice && q.FX.w8Choice.count) return q.FX.w8Choice.count(); } catch (e) { /* (below) */ }
        return grumReasons().length;
    }

    // ------------------------------------------------------------------
    // The meeting: the talk with the leader
    // ------------------------------------------------------------------
    function greetLines(P) {
        const s = S(), G = TX.greet[s.party], gate = s.rf >= TM.cap, out = [].concat(G.intro);
        if (s.party === "baltazar") {
            const K = T.api("Kantor");
            let m = "normal";
            try { m = K && K.mode ? K.mode() : "normal"; } catch (e) { m = "normal"; }
            out.push(...(flag("w5BaltazarWrocil") ? G.back : m === "enemy" ? G.enemy : G.normal));
        } else if (s.party === "grum") out.push(...(flag("w8Lost") ? G.lost : G.normal));
        else if (s.party === "kopacze") out.push(...(s.why === "kopaczeGrip" ? G.grip : G.normal));
        else out.push(...G.normal);
        if (s.party === "lord") out.push(TX.lordWhy[{ lordField: "field", lordBranch: "branch", lordShamed: "shamed", lordFirst: "first", lordLie: "lie" }[s.why] || "cold"]);
        out.push(...(gate ? G.gate : G.road));
        return out;
    }
    // the leader's talk: the data's (Rywal_Data rozmowy.przywodca)
    function talkLead(ev) {
        const s = S(), P = party();
        if (!P || s.outcome || s.fight) return null;
        const first = !s.talked;
        s.talked = s.talked || day();
        if (!s.met) s.met = day();
        return w.rozmowa("przywodca", { spk: { id: ev.eventId(), name: P.lead.name }, vars: { ranny: P.wName }, partia: s.party, pierwszy: first, brama: s.rf >= TM.cap });
    }
    // the men look at their leader
    const barkMan = ev => (say(ev, TX.bark[S().party] || "...", 160), null);

    // ------------------------------------------------------------------
    // The fight (Humans.js): the leader (Baltazar goes off) and his men, where they stood
    // ------------------------------------------------------------------
    function levelHere() {
        const U = UG(), f = heroFloor(), b = U && U.bandOf ? U.bandOf(f) : null;
        return b && b.level ? b.level + Math.floor((f - b.from) / 2) : (T.call("Combat", "placeLevel") || 4);
    }
    function startFight() {
        const s = S(), P = party(), H = HM();
        if (!P || s.outcome || s.fight) return;
        if (!H || !H.spawn || !H.makeBand) { resolve("pobici"); return; }   // (no Humans.js: as if they ran)
        registerLooks();
        const band = H.makeBand([], { tag: TAG }), lv = levelHere();
        s.fight = { mapId: $gameMap.mapId(), lead: "", day: day() };
        const members = [];
        const lead = evOf(EV.lead);
        if (lead && !hidden(lead)) {
            if (P.lead.fights) members.push({ ev: lead, m: P.lead, lead: true });
            else leaving([EV.lead], "up");   // (Baltazar: "Ja nie lubię widoku krwi" - and off he goes)
        }
        menOf(P).forEach((m, i) => { const e = evOf(EV.man0 + i); if (e && !hidden(e)) members.push({ ev: e, m }); });
        members.forEach((x, i) => {
            const { ev, m } = x;
            const opts = { band, tag: x.lead ? TAG_LEAD : TAG, noBand: true, engaged: true, name: m.name, level: Math.max(1, lv + (m.lv || 0)) };
            if (m.look) opts.look = m.look;
            if (m.gold !== undefined) opts.gold = m.gold;
            const h = H.spawn(m.kind, ev.x, ev.y, opts);
            if (h) h._w9 = true;
            hideEv(ev);
        });
        if (!members.length) resolve("pobici");
    }
    T.on("humanDefeated", e => { if (has() && e && e.tag === TAG_LEAD && S().fight) S().fight.lead = e.how || ""; }, { owner: PLUGIN });
    T.on("humansDone", e => {
        if (!has() || !e || e.tag !== TAG) return;
        const s = S();
        if (s.fight && !s.outcome) resolve("pobici", { how: s.fight.lead || "" });
    }, { owner: PLUGIN });
    T.on("heroRobbed", e => {
        if (!has() || !e || e.tag !== TAG) return;
        const s = S();
        if (s.fight && !s.outcome) resolve("wygrali");
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The outcome: the flags (docs/QUESTY_STAN.md), the journal, W9's step, Act III, the Heart
    // ------------------------------------------------------------------
    const DOWN = { haslo: true, przewodnik: true };
    const UPWALK = { zawrocili: true, raport: true, sojusz: true };
    function resolve(outcome, o) {
        const s = S(), P = party();
        if (!P || s.outcome) return;
        o = o || {};
        s.outcome = outcome; s.how = o.how || ""; s.outDay = day(); s.outFloor = s.rf;
        const fac = P.faction, tornN = Object.keys(s.torn).length;
        setFlag({ pobici: "w9RywalPobity", wygrali: "w9RywalWygral", zawrocili: "w9RywalZawrocil", haslo: "w9RywalHaslo", przewodnik: "w9RywalPrzewodnik",
            raport: "w9DworRaport", sojusz: "w9GrumZawrocil", odeszli: "w9RywalOdszedl" }[outcome]);
        if (DOWN[outcome]) { s.deep = true; setFlag("w9RywalWDol"); }
        if (fac && outcome === "pobici") setFlag("w9FrakcjaPobita");
        if (fac && (outcome === "wygrali" || DOWN[outcome] || outcome === "odeszli" || (outcome === "zawrocili" && tornN > 0))) setFlag("w9FrakcjaWie");
        if (s.party === "lord") setFlag({ pobici: "w9DworPobity", zawrocili: "w9DworZawrocil", wygrali: "w9DworWie", odeszli: "w9DworWie" }[outcome]);
        if (s.party === "grum" && outcome === "pobici") setFlag(s.how === "killed" ? "grumDead" : "grumGone");
        if (s.party === "grum" && outcome === "sojusz") setFlag("grumAlly");
        if (s.party === "kopacze" && outcome === "pobici" && s.how === "killed") setFlag("w9DowodcaPolegl");
        if (o.gold) { $gameParty.gainGold(o.gold); s.gold = o.gold; }
        if (fac && outcome === "pobici" && tornN) recoverNotes();
        // the men on the map: the talk's outcomes - they walk off (up, or down past the gate); the fight's - the fire goes out
        if (has()) {
            if (UPWALK[outcome] || DOWN[outcome]) leaving(groupIds(), DOWN[outcome] ? "down" : "up");
            if (!UPWALK[outcome] && !DOWN[outcome]) for (const id of groupIds()) hideEv(evOf(id));
            const fire = evOf(EV.fire);
            if (fire && outcome !== "odeszli" && heroFloor() === s.rf) { fire.setImage(ART.ash[0], ART.ash[1]); fire._direction = ART.ash[2]; fire._pattern = 0; fire._originalPattern = 0; fire.setStepAnime(false); }
        }
        T.emit("w9RywalDone", { party: s.party, outcome, floor: s.rf, how: s.how });
        if (!o.silent) learn();
    }
    // the hero learns the outcome (at once - or, when they gave up at the gate, from Borgar / on floor 10): the journal, the reward,
    // W9's step
    function learn() {
        const s = S(), P = party();
        if (!P || !s.outcome || s.learned) return;
        s.learned = day();
        const vars = { kto: P.kto, Kto: cap(P.kto), f: s.outFloor || s.rf, n: s.recovered, zwrot: s.recovered ? fill(TX.recovered, { n: s.recovered }) : "" };
        const key = s.outcome, n = key === "odeszli" && !s.first ? TX.outcome.odeszliUnseen : TX.outcome[key];
        let text = fill(n[1], vars);
        if (s.party === "grum" && key === "pobici") text += " " + (TX.grumFate[s.how] || TX.grumFate.fled);
        if (s.party === "kopacze" && key === "pobici" && s.how === "killed") text += " " + TX.captainDead;
        note(n[0], text);
        const top = key === "odeszli" && !s.first ? TX.topOutcome.odeszliUnseen : TX.topOutcome[key];
        T.popup(top[0], { top: true, color: key === "wygrali" ? "#ff9f8f" : "#ffe27a", sub: fill(top[1], vars) });
        const r = { pobici: 220, sojusz: 250, zawrocili: 120, raport: 100, haslo: 60, przewodnik: 60, wygrali: 40, odeszli: 0 }[key] || 0;
        if (r) xp(r);
        ensureW9();
        w9After();
        autoChecks();
    }
    // the Order's notes they tore out: in their sack (the fight won) - in the journal as if read
    function recoverNotes() {
        const s = S(), U = UG(), d = window.Underground_Data, st = ugState(), keys = Object.keys(s.torn);
        let n = 0;
        for (const key of keys) {
            const nt = d && d.NOTES ? d.NOTES[key] : null, floor = s.torn[key];
            delete s.torn[key];
            if (!nt || (st.notes && st.notes[key])) continue;
            if (st.notes) st.notes[key] = true;
            const nv = { tytul: nt.title, tekst: nt.text, pietro: floor };
            note(fill(TX.odebrane.tytul, nv), fill(TX.odebrane.tekst, nv));
            T.call("Combat", "discover", "ug_note_" + key, fill(TX.odebrane.odkrycie, nv), 20);
            T.emit("undergroundNote", { key: String(key), floor, title: nt.title });
            n++;
        }
        s.recovered = n;
        if (n && U) T.popup(fill(TX.odebrane.ile, { n }), { kind: "info", icon: 191 });
    }

    // ------------------------------------------------------------------
    // W9 in the journal: two steps appended to TownQuests' W9 (ch. 3 - the rival; then "dalej w głąb" till the first truth)
    // ------------------------------------------------------------------
    // (the steps: the thread's - Rywal_Data kroki, at W9's places 1 and 2)
    const autoChecks = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); };
    const stepIdx = k => { const q = TQ(); return q && q.Q && q.Q.W9 ? q.Q.W9.steps.findIndex(st => st.w9r === k) : -1; };
    function ensureW9() {
        const q = TQ();
        if (!q || !q.Q || !q.Q.W9 || !q.start) return;
        if (!q.rec("W9")) {
            // (the outcome known already - Borgar heard them go: W9 begins past the rival's step)
            const learned = !!S().learned, i = stepIdx("rival");
            q.start("W9", learned ? stepIdx("after") : i);
            S().w9 = day();
            const r = q.rec("W9");
            if (learned && r) { r.t.done = r.t.done || {}; r.t.done[i] = day(); }
        }
        if (S().learned) w9After();
    }
    function w9After() {
        const r = rec("W9"), i = stepIdx("rival"), j = stepIdx("after");
        if (!r || r.s !== "active" || i < 0 || j < 0 || r.step !== i) return;
        r.t.done = r.t.done || {};
        r.t.done[i] = day();
        r.step = j; r.sday = day(); r.sh = hour();
    }
    function stepVars() {
        const s = S(), P = party();
        const seen = Object.keys(s.seen).map(Number).filter(f => f > 0);
        const last = seen.length ? Math.max(...seen) : 0;
        const gdzie = s.met ? fill(TX.gdzie.met, { f: s.outFloor || s.rf }) : s.rf >= TM.cap && s.seen[TM.cap] ? TX.gdzie.gate : last ? fill(TX.gdzie.seen, { f: last }) : TX.gdzie.none;
        const unseen = !s.first;   // (never saw a trace of them: Borgar's words are all he knows)
        return { kto: P && !unseen ? P.kto : TX.ktoUnseen, gdzie, znaki: P && !unseen ? TX.znaki[P.mark] : TX.znakiUnseen,
            koniec: s.outcome ? fill(unseen && TX.koniec[s.outcome + "Unseen"] ? TX.koniec[s.outcome + "Unseen"] : TX.koniec[s.outcome], { f: s.outFloor || s.rf }) : "" };
    }
    // the first truth of the Truth Layer: W9 goes on to its chapter 6 (TownQuests' step 0)
    T.on("undergroundTruth", () => {
        if (!has()) return;
        const r = rec("W9"), i = stepIdx("rival"), j = stepIdx("after");
        if (!r || r.s !== "active" || (r.step !== i && r.step !== j)) return;
        r.t.done = r.t.done || {};
        r.t.done[r.step] = day();
        r.step = 0; r.sday = day(); r.sh = hour();
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The first sighting, the traces' words, the tripwire, the rope
    // ------------------------------------------------------------------
    function chapterSeen() {
        const s = S(), P = party();
        if (!P || s.first) return;
        s.first = day();
        note(TX.noteStart[0], fill(TX.noteStart[1], { znak: TX.znak[P.mark], why: D.WHY[s.why] || "" }));
        T.popup(TX.firstTop[0], { top: true, color: "#ffe27a", sub: TX.firstTop[1] });
        ensureW9();
    }
    function noteOnce(key, pair, vars) {
        const s = S();
        if (s.notes[key]) return;
        s.notes[key] = day();
        note(pair[0], fill(pair[1], vars || {}));
    }
    const info = text => T.popup(text, { kind: "info" });
    function trapAt() {
        const s = S(), f = heroFloor();
        if (!f || f >= TM.cap || !TR.trap.includes(f) || !s.trail[f] || s.traps[f]) return null;
        const lay = layoutOf(f);
        return lay && lay.trap ? lay.trap : null;
    }
    function updateTrap() {
        const t = trapAt();
        if (!t || $gamePlayer.x !== t[0] || $gamePlayer.y !== t[1] || $gamePlayer.isTransferring()) return;
        const s = S(), f = heroFloor(), ev = evOf(EV.trap);
        if (sneaking()) {
            s.traps[f] = "cut";
            think(TX.trapCut);
            giveRope();
        } else {
            s.traps[f] = "hit";
            T.audio.se("Bell2", { volume: 70, pitch: 150 });
            T.audio.se("Blow1", { volume: 70, pitch: 90 });
            const U = UG(), dmg = TR.trapDamage + TR.trapPerFloor * f;
            if (U && U.hurt) U.hurt(dmg, { poise: 40, knock: 0.9, name: TX.trapName, from: { x: t[0] + (t[2] === "V" ? -0.6 : 0), y: t[1] + (t[2] === "V" ? 0 : -0.6) } });
            T.popup(TX.trapHit, { top: true, color: "#ff9f8f", sub: TX.trapHitSub });
        }
        noteOnce("trap", TX.noteTrap);
        if (ev) { ev.setImage(ART.wireCut[0], ART.wireCut[1]); ev._direction = ART.wireCut[2]; ev._pattern = ART.wireCut[3]; ev._originalPattern = ART.wireCut[3]; }
    }
    function giveRope() {
        const it = item(TR.ropeItem);
        if (!it) return;
        $gameParty.gainItem(it, 1);
        T.popup(it.name + " ×1", { icon: it.iconIndex, gain: true });
    }
    // arriving on a map: the first sighting, the floor's traces seen, the emptied containers shown open, a fight left behind
    function onArrive(mapId) {
        const s = S(), P = party(), U = UG();
        if (!P || !U) return;
        if (s.fight && s.fight.mapId !== mapId) { s.fight = null; const H = HM(); if (H && H.clear) H.clear(TAG); }
        const f = U.floorOf(mapId);
        if (mapId === M.ruins || (f >= 1 && f <= s.rf)) chapterSeen();
        if (f >= 1 && f <= s.rf) {
            s.seen[f] = s.seen[f] || day();
            if (TR.camp.includes(f) && s.trail[f] && f !== s.rf) noteOnce("camp", TX.noteCamp, { f });
        }
        if (f === TM.cap && s.outcome === "odeszli") learn();
        for (const id of s.robbed[mapId] || []) if (!$gameSelfSwitches.value([mapId, id, "A"])) $gameSelfSwitches.setValue([mapId, id, "A"], true);
    }

    // ------------------------------------------------------------------
    // Underground's notes and containers: torn out / emptied by them
    // ------------------------------------------------------------------
    (function wrapUnderground() {
        const U = UG();
        if (!U || U._rywal) return;
        U._rywal = true;
        const _read = U.read, _search = U.search;
        if (typeof _read === "function") U.read = function(key) {
            const s = has() ? S() : null, P = s ? party() : null;
            if (P && s.torn[String(key)]) {
                $gameMessage.add(TX.torn[P.mark] || TX.torn.eye);
                noteOnce("torn", TX.noteTorn);
                return false;
            }
            return _read.apply(this, arguments);
        };
        if (typeof _search === "function") U.search = function(eventId) {
            const s = has() ? S() : null, mapId = window.$gameMap ? $gameMap.mapId() : 0, k = mapId + ":" + eventId;
            if (s && party() && (s.robbed[mapId] || []).includes(eventId) && !s.robSeen[k]) {
                s.robSeen[k] = day();
                $gameSelfSwitches.setValue([mapId, eventId, "A"], true);
                $gameMessage.add(TX.robbed);
                noteOnce("rob", TX.noteRobbed);
                return false;
            }
            return _search.apply(this, arguments);
        };
    })();

    // ------------------------------------------------------------------
    // Walking off (the talk's outcomes): Hunting's path8 + RoamingActor's steps, hidden once there (or after a while)
    // ------------------------------------------------------------------
    let walkers = null;   // { ids, to: [x, y], until }
    function leaving(ids, way) {
        const s = S(), f = heroFloor(), U = UG();
        let to = null;
        if (f === TM.cap) to = way === "down" ? [19, 13] : D.FLOOR10.up;
        else if (f >= 1) { const lay = layoutOf(f); to = lay ? (way === "down" ? [lay.down[0], lay.down[1]] : [lay.up[0], lay.up[1]]) : null; }
        else if (U && onMap(M.heart)) to = [15, 16];
        if (!to) { for (const id of ids) hideEv(evOf(id)); return; }
        const add = walkers && walkers.to[0] === to[0] && walkers.to[1] === to[1] ? walkers.ids : [];
        walkers = { ids: add.concat(ids.filter(id => !add.includes(id))), to, until: Graphics.frameCount + 420, said: false };
        const g = evOf(ids[0]);
        if (g && !hidden(g)) say(g, way === "down" ? (TX.goneDown[s.party] || TX.goneUp[s.party]) : TX.goneUp[s.party], 160);
    }
    function walkTo(ev, tx, ty) {
        if (!ev || ev.isMoving()) return ev && Math.abs(ev.x - tx) + Math.abs(ev.y - ty) <= 1;
        if (Math.abs(ev.x - tx) + Math.abs(ev.y - ty) <= 1) return true;
        const H = HU(), R = RA();
        ev.setThrough(true);
        const d = H && H.path8 ? H.path8(ev, tx, ty, { key: "w9r" }).dir : ev.findDirectionTo(tx, ty);
        if (d > 0) { if (R && R.canStep && R.canStep(ev, ev.x, ev.y, d)) R.step(ev, d); else ev.moveStraight(d); }
        return false;
    }
    function updateWalkers() {
        if (!walkers) return;
        let left = 0;
        for (const id of walkers.ids) {
            const ev = evOf(id);
            if (!ev || hidden(ev)) continue;
            if (walkTo(ev, walkers.to[0], walkers.to[1]) || Graphics.frameCount > walkers.until) hideEv(ev); else left++;
        }
        if (!left) walkers = null;
    }

    // ------------------------------------------------------------------
    // The events' script: Rywal.act(this) - by the event; Rywal.act(this, [what, ...]) - from a talk
    // ------------------------------------------------------------------
    function actCall(interp, args) {
        if (!has() || !interp) return;
        try {
            if (Array.isArray(args)) return actArgs(args, interp);
            const ev = $gameMap.event(interp.eventId());
            if (!ev || hidden(ev)) return;
            const k = keyOf(ev), P = party();
            if (!P) return;
            const list = {
                lead: () => talkLead(ev), man0: () => barkMan(ev), man1: () => barkMan(ev), man2: () => barkMan(ev),
                wounded: () => (say(ev, TX.woundedBark, 180), null),
                mark: () => (info(P.mark === "pennant" ? TX.markPennant : TX.markEye), null),
                prints: () => (info(TX.prints), null),
                fire: () => (info(TX.campLeft), null),
                ash: () => { info(S().outcome || heroFloor() !== S().rf ? TX.campCold : TX.campLeft); return null; },
                bed: () => (info(TX.bed), null),
                rope: () => { const f = heroFloor(); if (f && !S().ropes[f]) { S().ropes[f] = day(); giveRope(); hideEv(ev); } return null; },
                trap: () => (info(S().traps[heroFloor()] ? TX.trapDone : TX.trapHitSub), null),
                witness: () => linesTo([], { id: ev.eventId(), name: P.lead.name }, [TX.heartLine[S().party] || "..."]),
                witnessMan: () => (say(ev, TX.heartMan, 120), null)
            }[k];
            const out = list ? list() : null;
            if (out && out.length) interp.setupChild(out.concat([C(0, [])]), ev.eventId());
        } catch (e) { report("act", e); }
    }
    // the leader's talk's choices (the data's actions - Watki.act; the old script calls Rywal.act(this, [what, ...]) of a talk
    // saved before 2026-10-28 go to the same actions)
    function deal(a) {
        if (a === "haslo") resolve("haslo", { gold: 150 });
        else if (a === "przewodnik") resolve("przewodnik", { gold: 100 });
        else if (a === "raport") resolve("raport");
    }
    function actArgs(args, interp) {
        const [what, a] = args;
        const name = { fight: "walka", deal: "uklad", turn: "zawroc", warn: "ostrzez", leave: "odejdz" }[what];
        if (name) w.akcja(name, what === "deal" ? [a] : [], interp);
    }
    w.haki({
        // the talk: the greeting's lines, the conditions, the words
        powitanie: () => greetLines(party()),
        znaSlowa: () => knowsWords(),
        znaStraznika: () => knowsGuardian(),
        grumZawroci: () => grumCount() >= 2,
        powody: () => grumReasons().join(" ") || TX.turn.powodyBrak,
        // the actions
        walka: () => startFight(),
        uklad: (ctx, a) => deal(a),
        zawroc: () => { if (S().party === "grum" && grumCount() >= 2) resolve("sojusz"); },
        rozstrzygnij: (ctx, outcome) => resolve(outcome),
        // W9's steps: the words of their text
        krokZmienne: () => stepVars()
    });

    // ------------------------------------------------------------------
    // The frame: the clock, the meeting's start, the tripwire, the walkers, the cellar, the Heart's witnesses
    // ------------------------------------------------------------------
    let pendingTalk = 0, cellarCheck = 0, heartSaid = false;
    function updateMeeting() {
        const s = S(), P = party();
        if (!P || s.outcome || s.fight || heroFloor() !== s.rf || heroFloor() === 0) return;
        const lead = evOf(EV.lead);
        if (!lead || hidden(lead)) return;
        if (pendingTalk) {
            if (Graphics.frameCount >= pendingTalk && calm()) { pendingTalk = 0; lead.start(); }
            return;
        }
        if (s.met || !calm()) return;
        if (Math.hypot($gamePlayer.x - lead.x, $gamePlayer.y - lead.y) > TM.meet) return;
        s.met = day();
        lead.setDirection(DIR4($gamePlayer.x - lead.x, $gamePlayer.y - lead.y));
        for (const id of [EV.man0, EV.man1, EV.man2]) { const e = evOf(id); if (e && !hidden(e)) e.setDirection(DIR4($gamePlayer.x - e.x, $gamePlayer.y - e.y)); }
        say(lead, TX.stop[s.party], 120);
        pendingTalk = Graphics.frameCount + 50;
    }
    function updateUpTop() {
        const s = S();
        if (!party()) return;
        // the cellar: the grate stood open in the night - mud on the steps
        if (onMap(M.cellar) && !s.cellar && Graphics.frameCount >= cellarCheck) {
            cellarCheck = Graphics.frameCount + 20;
            if (Math.hypot($gamePlayer.x - 15, $gamePlayer.y - 3) <= 3.5) { s.cellar = day(); think(TX.cellar); chapterSeen(); }
        }
        // they gave up at the gate: Borgar heard them go out through the cellar
        if (s.outcome === "odeszli" && !s.learned && (onMap(M.tavern) || onMap(M.cellar)) && calm()) { s.toldUp = day(); think(TX.borgar); learn(); }
        // the Heart: the ones who went down wait before the door
        if (onMap(M.heart) && s.deep && !heartSaid) {
            const w = evOf(EV.lead);
            if (w && !hidden(w) && Math.hypot($gamePlayer.x - w.x, $gamePlayer.y - w.y) <= 5) { heartSaid = true; say(w, TX.heartLine[s.party] || "...", 240); }
        }
    }
    T.onMapUpdate((scene, n) => {
        if (!has()) return;
        try { updateWalkers(); } catch (e) { report("walkers", e); walkers = null; }
        if (!auto) return;
        try { updateMeeting(); } catch (e) { report("meeting", e); }
        try { if (party()) updateTrap(); } catch (e) { report("trap", e); }
        if (n % 10) return;
        try { updateUpTop(); } catch (e) { report("up top", e); }
        if (n % 60) return;
        try { tick(); } catch (e) { report("tick", e); }
    }, { owner: PLUGIN, name: "rywal" });
    T.on("mapReady", e => {
        if (!has()) return;
        pendingTalk = 0; walkers = null; heartSaid = false; cellarCheck = 0;
        try { if (auto) tick(); onArrive(e && e.mapId !== undefined ? e.mapId : $gameMap.mapId()); } catch (er) { report("mapReady", er); }
    }, { owner: PLUGIN });
    T.on("load", () => {
        layouts.clear();
        if (has() && S().fight) S().fight = null;   // (a fight saved half-way: the men of Humans.js are not in the save - they stand at their fire again)
    }, { owner: PLUGIN });
    T.on("newGame", () => { layouts.clear(); }, { owner: PLUGIN });
    // Act III armed: a word on who they are (the same Black Eyes as in the ruins - or the Lord's men were others)
    T.on("act3Armed", () => {
        if (!has() || !party()) return;
        noteOnce("act3", party().faction ? TX.noteAct3.faction : TX.noteAct3.lord);
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The looks of Humans.js this party fights in: the manor's guard (Dwor) and the commander (Captain - Act3.js has it too)
    // ------------------------------------------------------------------
    function registerLooks() {
        const Hn = HU(), L = Hn && Hn.LOOK8, Hm = HM();
        if (!L) return;
        for (const look of Object.keys(D.LOOKS)) {
            const def = D.LOOKS[look];
            if (Hm && Hm.LOOKS && !Hm.LOOKS[look]) Hm.LOOKS[look] = { anim: Object.assign({}, def.anim), shield: !!def.shield };
            const k = "$Human_" + look, a = "anim8/" + look + "_";
            if (L[k]) continue;
            L[k] = { sheet: a + "Walk8", cell: 64, stride: 1.7, turn: 2, runAt: 4.2 };
            L[k + "_Atk"] = { sheet: a + "Atk8", cell: 96, pose: true };
            L[k + "_Guard"] = { sheet: a + "Guard8", cell: 96, pose: true };
            L[k + "_Kneel"] = { sheet: a + "Kneel8", cell: 96, pose: true };
            L[k + "_Crouch"] = { sheet: a + def.crouch, cell: 96, pose: true };
            L[k + "_Lie"] = { sheet: a + "Lie8", cell: 64, pose: true };
        }
    }
    registerLooks();
    const _Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        registerLooks();
        _Scene_Map_create.call(this);
    };

    // ------------------------------------------------------------------
    // For the Heart (Underground.js): what the world reads, the epilogue's line
    // ------------------------------------------------------------------
    function forWorld() {
        if (!has()) return null;
        const s = S(), P = party();
        if (!P) return null;
        return { key: s.party, outcome: s.outcome || null, deep: !!s.deep, faction: !!P.faction, floor: s.outFloor || s.rf,
            lordLine: s.party === "lord" && s.outcome ? TX.lordLine[s.outcome] || null : null };
    }
    function epilogue(kind, w) {
        const r = (w && w.rival) || forWorld(), E = TX.epilogue;
        if (!r || !r.outcome) return null;
        if (r.deep) return E.deep[r.key] || null;
        if (r.outcome === "pobici") return r.faction ? E.pobici.faction : E.pobici.lord;
        if (r.outcome === "sojusz") return E.sojusz;
        if (r.outcome === "raport") return E.raport;
        if (r.faction && (r.outcome === "wygrali" || r.outcome === "odeszli" || r.outcome === "zawrocili") && flag("w9FrakcjaWie")) return E.lost;
        return null;
    }

    // ------------------------------------------------------------------
    // F9 ("Wyspa i fabuła"): a variant forced and the chapter begun; the meeting on a floor
    // ------------------------------------------------------------------
    function debugStart(variant) {
        if (!has() || !UG()) return null;
        const v = variant && D.PARTIES[variant] ? variant : "";
        fresh({ forced: v });
        const U = UG(), s = S();
        U.open();
        s.gateDay = day() - 1;
        s.enter = now() - TM.pace * 2 - 0.25;
        begin();
        s.at = s.enter;
        for (let i = 0; i < 2; i++) { passFloor(s.rf); s.rf++; s.at += TM.pace; }
        if (window.$gameMap && $gameMap.mapId() === M.ruins) $gamePlayer.requestMapReload();
        return [M.ruins, 14, 7, 2];
    }
    function debugMeet(floor, variant) {
        if (!has() || !UG()) return null;
        const U = UG(), f = Math.max(1, Math.min(TM.cap, Math.floor(Number(floor) || 1)));
        const s = S(), v = variant === undefined ? s.forced || "" : variant || "";
        if (!s.party || s.outcome || v !== (s.forced || "")) debugStart(v);
        const s2 = S();
        for (let i = s2.rf; i < f; i++) passFloor(i);
        s2.rf = f; s2.at = now(); s2.met = 0; s2.talked = 0; s2.fight = null;
        if (f >= TM.cap) { s2.gateSince = now(); tearNotes(TM.cap); }
        const to = U.landing ? U.landing(f, "up") : null;
        if (to && window.$gameMap && to[0] === $gameMap.mapId()) $gamePlayer.requestMapReload();   // (the same floor again: its events made anew)
        return to;
    }
    // the section's rows are the thread's data (Rywal_Data.js f9: "wariant", "spotkanie"); here their hooks - the words' {x}, ←→ (the party,
    // the floor - kept between the menu's openings), OK (debugStart / debugMeet: there, or why not)
    const F9_PARTIES = ["", "baltazar", "grum", "lord", "kopacze"];
    const f9Pick = { party: 0, floor: 4 };
    w.haki({
        f9Zmienne: () => ({ name: TX.f9Names[F9_PARTIES[f9Pick.party] || "gra"], n: f9Pick.floor }),
        f9Wybierz(ctx, delta) {
            if (ctx.row.co === "wariant") f9Pick.party = (f9Pick.party + delta + F9_PARTIES.length * 10) % F9_PARTIES.length;
            else if (ctx.row.co === "spotkanie") f9Pick.floor = ((f9Pick.floor - 1 + delta + TM.cap * 10) % TM.cap) + 1;
            else return false;
            return true;
        },
        f9Ok(ctx) {
            const meet = ctx.row.co === "spotkanie", v = F9_PARTIES[f9Pick.party];
            const g = meet ? debugMeet(f9Pick.floor, v) : debugStart(v);
            if (!g) return { say: meet ? fill(TX.f9BrakPietra, { n: f9Pick.floor }) : TX.f9Brak, bad: true };
            return { go: ["W9", g[0], g[1], g[2], g[3]] };
        }
    });

    window.Rywal = T.register(PLUGIN, {
        act: (interp, args) => actCall(interp, args), state: S, who, party, auto: v => { auto = v === undefined ? auto : !!v; return auto; },
        tick, advance, begin, passFloor, resolve, learn, layoutOf, forWorld, epilogue, stepVars, debugStart, debugMeet, fresh, startFight,
        registerLooks, knowsWords, knowsGuardian, grumCount, TAG, TAG_LEAD,
        step: () => { const r = rec("W9"), q = TQ(); return r && q && q.Q && q.Q.W9 && r.s === "active" ? q.Q.W9.steps[r.step].w9r || "w9:" + r.step : null; }
    });
})();
