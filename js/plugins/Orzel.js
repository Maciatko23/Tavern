//=============================================================================
// Orzel.js
//=============================================================================
// The white eagle (the user's idea 2026-10-18, docs/orzel/KONCEPCJA.md; the data: Orzel_Data.js; riding it: Orzel_Lot.js).
//   - the egg (item 182) from the Orla Grań (Map175, over the mountains - the climbers' path up from Map013 is put in at runtime, the
//     user's map stays as it is) after a storm in Act II (D29 "Jajo z grani", Bazyli saw it from the lantern); it hatches after 36 hours
//     of warmth: by a lit fire, indoors, or slept with (the bag), or in its basket (Farming building "orzel_kosz") by a fire
//   - five stages by the days of care (a day counts when it was fed, watered and - the chick - warm at night): pisklę 0.5 tile, młody
//     0.9, podrostek 1.2 (grey-brown, short flights), prawie dorosły 2.5 (flies), dorosły ~4 x 4 (carries the hero - Orzel_Lot.js)
//   - the care: food (raw meat or fish; the older ones hunt part of it themselves - the map's game thins), water (its bowl; the older ones
//     also drink by themselves on the ridge - never the hero's water source), the bond (petting, feeding by hand, flights, fights),
//     the nest (the basket, "Orle gniazdo" 3x3, "Orla grzęda" 4x4), the night's warmth for the chick. Neglected from the third stage it
//     flies off to the ridge for three days and comes back when called (L) or fetched with meat - it never dies
//   - the fight (stage 3+): beak, talons, the adult's dive and cry, its own wing strength and rest (never fights for the hero alone);
//     never the dog, the raven, the yards' animals, people who are not fighting him; a man is never killed by it. They fight back for
//     real (2026-10-18): a beast it strikes may turn on it (Starcia.js - its body Game_EagleBody as the beast's foe: the wolf's leap,
//     the boar's charge, the bear's paw), a man it strikes may make it his foe (his blows), archers shoot at it on the ground and in
//     the low flight (with the hero on it too: the arrows hit the bird) - never high up; hurt with him on it: "ląduj!", at 0 it comes down
//   - the bird is not an event: a plain object (x, y on the ground in tiles, z px over it) drawn in the tilemap from img/system/Orzel<n>.png
//     (8 rows of facings: standing, walking, the attack) and, in the air, Orzel<n>_Lot.png (seen from above, turned by code)
//   - the quests D29 / W13 "Skrzydlata Straż" (TownQuests pack in Orzel_Data.js; their handlers here), Act III (one man fewer a wave
//     outside), the epilogue's line, F9 (the island tab)
// Ids 500-539 (Tawerna.inject, owner "Orzel"). The state: Tawerna.state("orzel").

/*:
 * @target MZ
 * @plugindesc Biały orzeł: jajo z Orlej Grani, pięć etapów wzrostu, opieka, gniazdo, walka szponami i dziobem, zadania D29 i W13. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Orzel_Data
 * @orderAfter Starcia
 * @orderAfter Kruk
 * @orderAfter TownQuests
 *
 * @help
 * ============================================================================
 * Orzel.js - biały orzeł (Skrzydlata Straż)
 * ============================================================================
 * Jajo z Orlej Grani (Akt II, po burzy; zadanie D29 u latarnika Bazylego)
 * wykluwa się po 36 godzinach w cieple: przy ogniu, w domu, w koszu przy
 * ognisku albo gdy śpisz z nim przy sobie.
 * Etapy: pisklę, młody, podrostek, prawie dorosły, dorosły (każdy kolejny trwa
 * 3 razy dłużej: 5, 15, 45 i 135 dni opieki - dorosły po 200 dniach; dzień
 * liczy się, gdy orzeł był najedzony, napojony, a pisklę w cieple).
 * Klawisz L: menu orła / zawołanie / start i lądowanie (dorosły, Orzel_Lot.js).
 * Przycisk akcji przy orle: to samo menu.
 * Orzeł nigdy nie ginie: ranny dzień leczy się w gnieździe, zaniedbany
 * odlatuje na Orlą Grań i wraca po trzech dniach na zawołanie.
 * W gnieździe siedzi w misie (przednia krawędź gniazda rysowana nad nim),
 * nocą śpi (budzi go dopiero bohater - menu), ranny leży; gdy bohater
 * podejdzie, wstaje. Dorosły do gniazda 3x3 się nie mieści - śpi obok.
 * Grafika: img/system/Orzel1..5.png, Orzel1..5_Poza.png (pozy z przodu),
 * Orzel4_Lot.png, Orzel5_Lot.png, Farm_OrzelKosz/Gniazdo/Grzeda.png i ich
 * przednie krawędzie *_Przod.png (tools/orzel/build_sheets.py, gniazda.py).
 * Test: tests/orzel_test.js.
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("orzel");   // (the words of this file: js/teksty/orzel.txt, kod.*)

    const T = window.Tawerna, D = window.OrzelData;
    if (!T) throw new Error("Orzel.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    if (!D) throw new Error("Orzel.js: brak Orzel_Data.js - musi być wyżej na liście wtyczek (the eagle's data is missing)");
    if (T.api("Orzel")) return;   // (put into the page twice: kept as it was)
    const PLUGIN = "Orzel";
    // the thread (Orzel_Data.js, the engine Watki.js): the state "orzel", D29 and W13, the flags
    const w = Watki.get("orzel");
    if (!w) throw new Error("Orzel.js: brak wątku „orzel” (Orzel_Data.js / Watki.js)");
    const TX = D.TX, CARE = D.CARE, ST = D.STAGES;
    const day = () => T.time.day(), hour = () => T.time.hour();
    const clock = () => day() * 24 + hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap && !!window.$gamePlayer;
    const F = () => T.api("Farming") || window.Farming || null;
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const SC = () => T.api("Starcia");
    const HM = () => T.api("Humans");
    const CB = () => T.api("Combat");
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const { fill } = Watki.mowa;
    const TILE = () => ($gameMap ? $gameMap.tileWidth() : 48);

    // ------------------------------------------------------------------
    // The state (the save): the thread's (Orzel_Data.js)
    // ------------------------------------------------------------------
    const S = () => w.S();
    const nameOf = () => (has() && S().name) || TX.defaultName;
    const V = extra => Object.assign({ imie: nameOf() }, extra || {});
    const stageDef = () => ST[S().stage] || ST[0];
    const maxHp = () => (stageDef().hp || 10);
    const maxSt = () => (stageDef().st || 0);
    const pop = (text, opts) => T.popup(fill(text, V(opts && opts.vars)), Object.assign({ icon: D.ICON.orzel, color: "#f3e8c8" }, opts || {}));
    const popNeed = (text, icon) => T.popup.need(icon || D.ICON.orzel, fill(text, V()));
    const outdoors = () => { const Sv = T.api("Survival"); return !!(Sv && Sv.isOutdoors ? Sv.isOutdoors() : true); };
    const underground = () => { const U = T.api("Underground"); return !!(U && U.isUnderground && U.isUnderground()); };
    const night = () => { const h = hour(); return h >= CARE.nightFrom || h < CARE.nightTo; };

    // the quests' state (TownQuests flags, records) - the thread's helpers
    const { flag, rec, autoChecks } = w;
    // a flag, then the quests' checks and the markers (Orzel_Lot.js calls it too: Orzel.setFlag)
    function setFlag(k) {
        w.setFlag(k);
        autoChecks();
    }
    const isActive = id => w.active(id);
    const isDone = id => w.done(id);
    const note = (title, text) => T.call("Journal", "addNote", fill(title, V()), fill(text, V()));
    const xp = (n, why) => T.call("Combat", "gainXp", n, why, true) || 0;
    const actTwo = () => { const st = T.api("Story"); if (st && typeof st.chapterEnded === "function") return !!st.chapterEnded(); const wy = T.api("Wyspa"); return !!(wy && wy.actTwo && wy.actTwo()); };

    // ------------------------------------------------------------------
    // The nests on the hero's land (Farming buildings): the basket (stages 1-2, the egg), the nest (3-4), the perch (5)
    // ------------------------------------------------------------------
    const NEST_TYPES = ["orzel_grzeda", "orzel_gniazdo", "orzel_kosz"];
    function nests() {
        const Fm = F(), all = (Fm && Fm.farm && Fm.farm().buildings) || {}, out = [];
        for (const m of Object.keys(all)) {
            if (Fm.landHeld && Fm.landHeld(Number(m))) continue;   // (the field lost to the Lord: not its home - Homes.js)
            for (const b of all[m] || []) if (b && NEST_TYPES.includes(b.type) && !b.site) out.push({ b, map: Number(m) });
        }
        return out;
    }
    // its home for this stage: the perch / the nest from the third stage (the basket is the chick's), the best one first
    function home() {
        const s = S(), list = nests();
        const ok = s.stage <= 2 ? ["orzel_kosz", "orzel_gniazdo", "orzel_grzeda"] : s.stage === 5 ? ["orzel_grzeda", "orzel_gniazdo"] : ["orzel_gniazdo", "orzel_grzeda"];
        for (const t of ok) { const n = list.find(x => x.b.type === t); if (n) return n; }
        return null;
    }
    function basketWithEgg() {
        const s = S();
        if (s.egg.where !== "basket" || !s.egg.basket) return null;
        return nests().find(n => n.b.id === s.egg.basket) || null;
    }
    // where it sits on a nest. In the bowl (Orzel_Data NESTS - the stages it fits): x across the bowl's middle, y the nest's front edge
    // (its place in the world: the sort, the distances - drawNested puts the picture in the bowl, the front rim over its feet). The adult
    // at the 3 x 3 nest (too small for it): on the ground beside it, where a free square of its size is (found once a map)
    const besideSpots = new Map();
    function nestSeat(n, stage) {
        const cfg = n && D.NESTS && D.NESTS[n.b.type], st = stage === undefined ? S().stage : stage;
        return cfg && cfg.stages.includes(st) ? cfg : null;
    }
    function nestPoint(n) {
        const Fm = F(), def = Fm && Fm.geoOf ? Fm.geoOf(n.b) : (Fm.BUILDINGS[n.b.type] || {}), w = def.w || 1;
        const cfg = nestSeat(n);
        if (cfg) return { x: n.b.x + w / 2 + (def.flipped ? -cfg.cx : cfg.cx) / TILE(), y: n.b.y + 0.98, z: 0, inNest: true };
        let at = besideSpots.get(n.b.id);
        if (!at || at.m !== n.map) {
            const land = Math.max(1, Math.ceil(stageDef().land || 1)), here = !!$gameMap && n.map === $gameMap.mapId();
            const sq = here ? besideSquare(n.b, w, def.h || 1, land) : null;
            at = { m: n.map, x: sq ? sq.x : n.b.x + w + land / 2, y: sq ? sq.y : n.b.y + 0.9 };
            if (sq) besideSpots.set(n.b.id, at);
        }
        return { x: at.x, y: at.y, z: 0, inNest: false };
    }
    // a free square of n x n beside the nest - not on its footprint (only some of its tiles are solid): on its right, its left (the same
    // bottom row first, then a row or two lower), else in front of it; its foot point
    function besideSquare(b, w, h, n) {
        const r0 = Math.floor(n / 2), onNest = (x, y) => x >= b.x && x < b.x + w && y > b.y - h && y <= b.y;
        const ok = (fx, fy) => { for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = fx - r0 + i, y = fy - j; if (onNest(x, y) || !freeTile(x, y)) return false; } return true; };
        for (const dy of [0, 1, 2, -1]) for (const gap of [0, 1, 2]) {
            for (const fx of [b.x + w + gap + r0, b.x - 1 - gap - (n - 1 - r0)]) if (ok(fx, b.y + dy)) return { x: fx + (n % 2 ? 0.5 : 0), y: b.y + dy + 0.9 };
        }
        for (let dy = n; dy <= n + 3; dy++) for (const dx of [0, -1, 1, -2, 2]) { const fx = b.x + Math.floor(w / 2) + dx; if (ok(fx, b.y + dy)) return { x: fx + (n % 2 ? 0.5 : 0), y: b.y + dy + 0.9 }; }
        return null;
    }

    // ------------------------------------------------------------------
    // The warmth: by a lit fire (Starcia's fire spots: the camp, the hero's lit fires, a torch in the ground), indoors (a house, not under
    // the ground), asleep with the egg in the bag
    // ------------------------------------------------------------------
    function fireNear(mapId, x, y, r) {
        const Fm = F();
        if (Fm && Fm.farm && Fm.fireLit && Fm.geoOf) {
            for (const b of (Fm.farm().buildings || {})[mapId] || []) {
                if (b.site) continue;
                const def = Fm.geoOf(b);
                if (!def || !def.fire || !Fm.fireLit(b)) continue;
                if (Math.hypot(b.x + (def.w || 1) / 2 - x, b.y + 0.5 - y) <= r) return true;
            }
        }
        if (mapId === ($gameMap && $gameMap.mapId())) {
            const fires = T.call("Starcia", "fires") || [];
            if (fires.some(f => Math.hypot(f.x - x, f.y - y) <= r)) return true;
        }
        return false;
    }
    function heroWarm() {
        if (S().sleepingWarm) return true;
        if (!outdoors() && !underground()) return true;
        return fireNear($gameMap.mapId(), $gamePlayer._realX + 0.5, $gamePlayer._realY + 0.5, 3);
    }
    function eggWarm() {
        const s = S();
        if (s.egg.where === "basket") {
            const n = basketWithEgg();
            if (!n) return false;
            const Fm = F(), def = Fm.geoOf ? Fm.geoOf(n.b) : {};
            if (def && def.indoor && n.map === 100) return true;   // (the hut's room: the hearth is there)
            return fireNear(n.map, n.b.x + 0.5, n.b.y + 0.5, 3);
        }
        return count(D.ITEM.jajo) > 0 && heroWarm();
    }
    // the chick warm at night: indoors, by a fire, or in its basket by a fire
    function chickWarm() {
        const s = S();
        if (eagle && eagle.map === $gameMap.mapId()) return heroWarm() || fireNear(s.map, eagle.x, eagle.y, 3);
        const h = home();
        if (h && h.map === s.map) return fireNear(h.map, h.b.x + 0.5, h.b.y + 0.5, 3) || (h.map === 100);
        return false;
    }

    // ------------------------------------------------------------------
    // The needs, by the clock (a rest, a night slept: those hours count too)
    // ------------------------------------------------------------------
    function rawKind(id) {
        const FT = window.FoodTable, row = FT && FT.get ? FT.get(id) : null;
        const it = item(id), name = (it && it.name || "").toLowerCase();
        if (row && row.raw) return /ryb|śledź|dorsz/.test(name) ? "fish" : "raw";
        return "cooked";
    }
    const MEATS = () => (window.FoodTable && FoodTable.tameMeats ? FoodTable.tameMeats() : []);
    function bestMeat() {
        const list = MEATS().filter(id => count(id) > 0);
        list.sort((a, b) => (D.CARE.meatValue[rawKind(b)] || 0) - (D.CARE.meatValue[rawKind(a)] || 0));
        return list[0] || 0;
    }
    const pieceValue = id => Math.round(100 / (stageDef().pieces || 1) * (D.CARE.meatValue[rawKind(id)] || 0.6));
    function tickNeeds() {
        const s = S();
        if (!s.have) return;
        const now = clock();
        if (s.clock === null || s.clock === undefined || now < s.clock) { s.clock = now; return; }
        const h = now - s.clock;
        if (h <= 0) return;
        s.clock = now;
        if (s.stage === 0) { tickEgg(h); return; }
        if (s.hp < 0) s.hp = maxHp();
        if (s.st < 0) s.st = maxSt();
        const away = !!s.away, stolen = s.theft && s.theft.state === "camp";
        // the older ones away (flown off, stolen) live by themselves: no hunger counted
        if (!away && !stolen) {
            s.food = Math.max(0, s.food - CARE.drainFood * h);
            s.water = Math.max(0, s.water - CARE.drainWater * h);
            eatFromNest();
        }
        // the day's log: its average food and water, the chick's night
        const L = s.dayLog || (s.dayLog = { d: day(), food: 0, water: 0, n: 0, cold: false });
        L.food += s.food * h; L.water += s.water * h; L.n += h;
        if (s.stage === 1 && night() && !chickWarm()) L.cold = true;
        // the healing: a day on the nest
        if (s.hurtUntil && now >= s.hurtUntil) { s.hurtUntil = 0; s.hp = maxHp(); pop(TX.healed, { color: "#cfe6a8" }); }
        if (!s.hurtUntil && s.food > 20 && s.water > 20) s.hp = Math.min(maxHp(), s.hp + 3 * h);
        s.st = Math.min(maxSt(), s.st + (maxSt() / 2) * h);
        // grandpa feeds a hungry chick once a day (stages 1-2, at his house)
        if (CARE.grandpaFeeds && s.stage <= 2 && s.food < 25 && s.map === 19 && s.grandpaDay !== day()) {
            s.grandpaDay = day();
            s.food = Math.min(100, s.food + 50);
        }
    }
    function tickEgg(h) {
        const s = S(), e = s.egg;
        if (eggWarm()) { e.warm += h; e.cold = 0; }
        else { e.cold += h; if (e.cold >= 12 && !e.coldSaid) { e.coldSaid = true; pop(TX.eggCold, { color: "#ffd0a0" }); } }
        if (e.warm >= 1) e.coldSaid = false;
        const need = ST[0].warmHours;
        if (!e.knock && e.warm >= need - 4) { e.knock = true; pop(TX.eggKnock, { color: "#f3e0a0" }); }
        if (e.warm >= need) hatch();
    }
    // a new day: the day before counted (or not), its own hunt and drink (the older ones), the neglect
    function newDay() {
        const s = S();
        if (!s.have || s.stage === 0) return;
        tickNeeds();
        const L = s.dayLog;
        s.dayLog = { d: day(), food: 0, water: 0, n: 0, cold: false };
        if (s.away || (s.theft && s.theft.state === "camp")) return;
        if (L && L.n > 0) {
            const food = L.food / L.n, water = L.water / L.n;
            const ok = food > CARE.dayOk && water > CARE.dayOk && !L.cold && !s.hurtUntil;
            if (ok) grow();
            if (food <= CARE.dayOk) { s.hungryDays++; addBond(CARE.bond.hungerDay); } else s.hungryDays = 0;
            if (water <= CARE.dayOk) addBond(CARE.bond.thirstDay);
            if (L.cold) { addBond(CARE.bond.cold); pop(TX.cold, { color: "#ffd0a0" }); }
            if (s.seenDay < day() - 1) addBond(CARE.bond.unseen);
        }
        // the older ones hunt and drink by themselves (their share) - the map's game thins (one hare fewer)
        if (s.stage >= 3 && !s.hurtUntil) {
            const share = stageDef().hunt || 0;
            s.food = Math.min(100, s.food + share * 100);
            s.hunted = day();
            const H = T.api("Hunting");
            try { if (H && H.thin) H.thin(s.map, "rabbit", 1); } catch (e) { /* (an old Hunting: nothing thins) */ }
            const wet = rainedLately();
            s.water = Math.min(100, s.water + (wet ? CARE.ownWaterWet : CARE.ownWaterDry));
            s.drank = day();
        }
        // neglected (the third stage on): it flies off to the ridge
        if (s.stage >= 3 && (s.bond < CARE.bond.flee || s.hungryDays >= CARE.flee.hungryDays)) flyOff();
    }
    // rain today (already fallen) or yesterday: the ridge's stone basins hold water
    function rainedLately() {
        const Sv = T.api("Survival");
        try {
            if (Sv && Sv.weatherPlan) {
                const today = Sv.weatherPlan(day()), before = Sv.weatherPlan(day() - 1);
                return !!((today && today.type === "rain" && hour() >= today.start) || (before && before.type === "rain"));
            }
        } catch (e) { /* (no forecast) */ }
        return !!($gameScreen && $gameScreen.weatherType && $gameScreen.weatherType() === "rain");
    }
    function addBond(n) {
        const s = S();
        s.bond = clamp(Math.round(s.bond + n), 0, 100);
    }
    function grow() {
        const s = S();
        s.care++;
        const at = D.STAGE_AT;
        let st = 1;
        for (let k = 1; k <= 5; k++) if (s.care >= at[k]) st = k;
        if (st > s.stage) setStage(st);
    }
    function setStage(st) {
        const s = S(), was = s.stage;
        s.stage = clamp(st, 0, 5);
        s.hp = maxHp();
        s.st = maxSt();
        if (s.stage > was && was >= 1) pop(TX.stageUp[s.stage], { color: "#9ff0a8", top: true });
        if (s.stage >= 3) setFlag("orzelPodrostek");
        if (s.stage >= 3 && !s.molt) { s.molt = true; giveFeather(); }
        if (s.stage >= 5) setFlag("orzelDorosly");
        if (eagle) eagle.stageDrawn = -1;
        autoChecks();
    }
    function giveFeather() {
        const it = item(D.ITEM.pioro);
        if (!it) return;
        $gameParty.gainItem(it, 1);
        T.popup(Watki.wstaw(TK.kod.giveFeather[0], { name: it.name }), { icon: it.iconIndex, kind: "gain" });
    }
    // the egg -> the chick (the name screen right after)
    function hatch() {
        const s = S();
        if (s.stage > 0) return;
        const where = s.egg.where === "basket" ? basketWithEgg() : null;
        if (s.egg.where !== "basket" && count(D.ITEM.jajo) > 0) $gameParty.loseItem(item(D.ITEM.jajo), 1);
        s.stage = 1;
        s.care = 0;
        s.food = 70; s.water = 70; s.hp = maxHp(); s.st = 0;
        s.bond = Math.max(s.bond, CARE.bond.start);
        s.clock = clock();
        s.dayLog = { d: day(), food: 0, water: 0, n: 0, cold: false };
        if (where) { s.map = where.map; const p = nestPoint(where); s.x = p.x; s.y = p.y; s.mode = "home"; }
        else { s.map = $gameMap.mapId(); s.x = $gamePlayer._realX + 0.5; s.y = $gamePlayer._realY + 1.2; s.mode = "follow"; }
        s.egg.where = "hatched";
        setFlag("orzelWyklul");
        T.audio.se("Item3", { volume: 70, pitch: 120 });
        pop(TX.stageUp[1], { color: "#9ff0a8", top: true });
        T.emit("orzelHatched", { map: s.map });
        pendingName = true;
        autoChecks();
    }
    let pendingName = false;

    // the name: the prologue's screen (Prologue.Scene_HeroName) with the eagle's words (the raven's way, Kruk.js)
    const NAMES = [];
    Watki.scal(NAMES, "orzel", "imiona");   // (its words: js/teksty/orzel.txt, imiona)
    let Scene_EagleName = null;
    function eagleScene() {
        if (Scene_EagleName) return Scene_EagleName;
        const P = window.Prologue, Base = P && P.Scene_HeroName;
        if (!Base) return null;
        const font = () => ($gameSystem.mainFontFace ? $gameSystem.mainFontFace() : "serif");
        Scene_EagleName = class extends Base {
            create() {
                super.create();
                const bmp = SceneManager.backgroundBitmap();
                if (bmp && this._bg) { this._bg.bitmap = bmp; this._bg.scale.set(1, 1); }
                this._name = [];
            }
            done() {
                if (this._leaving) return;
                let n = this.text().trim().replace(/\s+/g, " ");
                if (!n) n = TX.defaultName;
                n = n.charAt(0).toLocaleUpperCase("pl") + n.slice(1);
                S().name = n;
                this._leaving = true;
                SoundManager.playOk();
                SceneManager.pop();
                T.popup(Watki.wstaw(TK.kod.done[0], { n: n }), { top: true, color: "#9ff0a8", icon: D.ICON.orzel });
                autoChecks();
            }
            back() { this.done(); }
            button(id) {
                if (id === "random") { this._name = Array.from(pick(NAMES)); this._upper = false; SoundManager.playCursor(); this._dirty = true; return; }
                super.button(id);
            }
            redraw() {
                super.redraw();
                const b = this._panel.bitmap, ctx = b.context, PW = b.width;
                ctx.save();
                ctx.fillStyle = "rgba(20,21,24,1)";
                ctx.fillRect(16, 18, PW - 36, 82);
                ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.font = "600 34px " + font(); ctx.fillStyle = "#ece6da";
                ctx.fillText(TK.kod.redraw[0], PW / 2, 46);
                ctx.font = "17px " + font(); ctx.fillStyle = "#b8b0a2";
                ctx.fillText(TK.kod.redraw[1], PW / 2, 84);
                if (!this.text()) {
                    ctx.fillStyle = "rgba(30,32,36,1)"; ctx.fillRect(150, 124, PW - 304, 44);
                    ctx.font = "bold 36px " + font(); ctx.fillStyle = "#5e5a54";
                    ctx.fillText(TX.defaultName, PW / 2, 147);
                }
                ctx.fillStyle = "rgba(20,21,24,1)"; ctx.fillRect(200, b.height - 50, PW - 400, 30);
                ctx.font = "14px " + font(); ctx.fillStyle = "#77736b";
                ctx.fillText(Watki.wstaw(TK.kod.redraw[2], { defaultName: TX.defaultName }), PW / 2, b.height - 34);
                ctx.restore();
                b._baseTexture.update();
            }
        };
        return Scene_EagleName;
    }
    function nameScene() {
        const Sc = eagleScene();
        if (!Sc) { S().name = S().name || TX.defaultName; return false; }
        SceneManager.push(Sc);
        return true;
    }

    // ------------------------------------------------------------------
    // The eagle on this map: a plain object, drawn in the tilemap
    // ------------------------------------------------------------------
    let eagle = null;
    function newEagle(x, y, z) {
        return { x, y, z: z || 0, map: $gameMap.mapId(), dir: 2, angle: -Math.PI / 2, state: z > 0 ? "fly" : "stand", t: 0, anim: null,
            target: null, then: null, walkStep: 0, stuck: 0, holder: null, body: null, shadow: null, hud: null, stageDrawn: -1, vx: 0, vy: 0,
            fightT: 0, foe: null, cool: 0, tired: 0, flee: 0, ridden: false, perched: null, flapT: 0, wait: 0 };
    }
    // (for Starcia's knockFrom / cx: the eagle as a "character")
    function asChar(e) {
        if (!e) return null;
        e._realX = e.x - 0.5; e._realY = e.y - 0.9;
        if (!e.centerX) { e.centerX = function() { return this.x; }; e.centerY = function() { return this.y - 0.4; }; }
        return e;
    }
    function freeTile(x, y) {
        if (!$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f)) return false;
        if ($gameMap.eventsXy(x, y).some(e => e && !e._through && e.isNormalPriority && e.isNormalPriority() && e.characterName && (e.characterName() || e.tileId()))) return false;
        const Fm = F();
        if (Fm && (Fm.solidAt ? Fm.solidAt(x, y) : Fm.buildingAt && Fm.buildingAt(x, y))) return false;
        if (Fm && Fm.isWaterTile && Fm.isWaterTile(x, y)) return false;
        return true;
    }
    // a free square of n x n tiles whose bottom-middle is near (x, y): its foot point, or null (the landing spot); avoid: a tile it must
    // not cover (the hero's - a big bird lands beside him, not on him)
    function openSquare(cx, cy, n, maxR, avoid) {
        const r0 = Math.max(0, Math.floor(n / 2));
        for (let r = 0; r <= (maxR || 6); r++) {
            for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
                const fx = Math.floor(cx) + dx, fy = Math.floor(cy) + dy;
                if (avoid && avoid.x >= fx - r0 && avoid.x < fx - r0 + n && avoid.y <= fy && avoid.y > fy - n) continue;
                let ok = true;
                for (let j = 0; j < n && ok; j++) for (let i = 0; i < n && ok; i++) if (!freeTile(fx - r0 + i, fy - j)) ok = false;
                if (ok) return { x: fx + (n % 2 ? 0.5 : 0), y: fy + 0.9 };
            }
        }
        return null;
    }
    // can it be here at all (this map)
    function mapAllows(stage) {
        const st = stage === undefined ? S().stage : stage;
        if (underground()) return false;
        if (D.NO_LAND.includes($gameMap.mapId())) return st <= 2 && !underground();
        if (!outdoors()) return st <= 2;   // (the small ones go indoors with him)
        return true;
    }
    function spawnHere(opts) {
        const s = S(), o = opts || {};
        let x = s.x, y = s.y;
        const st = s.stage;
        if (o.near || !(x >= 0) || !$gameMap.isValid(Math.floor(x), Math.floor(y))) {
            const n = Math.max(1, Math.ceil(stageDef().land || 1));
            const sq = openSquare($gamePlayer._realX + 0.5 + (n > 1 ? n / 2 + 1 : 0), $gamePlayer._realY + 1, n, 6, n > 1 ? { x: $gamePlayer.x, y: $gamePlayer.y } : null);
            if (sq) { x = sq.x; y = sq.y; } else { x = $gamePlayer._realX + 0.5; y = $gamePlayer._realY + 1.9; }
        }
        eagle = newEagle(x, y, o.flyIn && st >= 3 ? 160 : 0);
        if (o.flyIn && st >= 3) {
            const off = offscreen(x, y);
            eagle.x = off.x; eagle.y = off.y; eagle.z = 160; eagle.state = "fly";
            eagle.target = { x, y, z: 0, land: true };
            if (st >= 4) { eagle.z = OVER_Z; eagle.overhead = true; }   // (the big ones: its shadow comes, it lands in a gust)
        }
        s.map = $gameMap.mapId();
        return eagle;
    }
    function offscreen(x, y) {
        const w = T.view.w() / TILE(), h = T.view.h() / TILE(), ox = $gameMap.displayX(), oy = $gameMap.displayY();
        const side = pick(["l", "r", "t"]);
        if (side === "l") return { x: ox - 4, y: oy + rand(1, h - 1) };
        if (side === "r") return { x: ox + w + 4, y: oy + rand(1, h - 1) };
        return { x: ox + rand(1, w - 1), y: oy - 5 };
    }
    function removeEagle() {
        if (eagle) dropSprites(eagle);
        eagle = null;
    }
    // where the eagle is now, by its mode (null: not on this map)
    function placeHere() {
        const s = S();
        if (!s.have || s.stage === 0) return null;
        const mapId = $gameMap.mapId();
        if (s.theft && s.theft.state === "camp" && mapId === D.MAP) return { cage: true };   // (taken: in the hunters' cage on the ridge)
        if (s.away || (s.theft && (s.theft.state === "camp" || s.theft.state === "taken"))) return null;
        if (s.hurtUntil && clock() < s.hurtUntil) {
            const h = home();
            return h && h.map === mapId ? { nest: h, rest: "hurt" } : null;
        }
        if (s.mode === "home" || (night() && s.stage <= 2 && home() && s.mode !== "stay" && s.map === home().map)) {
            const h = home();
            if (h && h.map === mapId) return { nest: h };
            if (!h && s.map === mapId) return { here: true };
            return null;
        }
        if (s.mode === "stay") return s.map === mapId ? { here: true } : null;
        // follow: with him where it may go
        if (s.map === mapId) return { here: true };
        return null;
    }
    function sync() {
        if (!has()) return;
        const p = placeHere();
        if (!p) { if (eagle && !eagle.ridden) removeEagle(); return; }
        if (eagle && eagle.map !== $gameMap.mapId()) removeEagle();
        if (!eagle && p.cage) {
            const m = (($dataMap && $dataMap.events) || []).find(v => v && v.name === "Miejsce: orzel_klatka");
            if (m) { eagle = newEagle(m.x + 0.5, m.y + 0.85, 0); eagle.caged = true; eagle.map = $gameMap.mapId(); eagle.dir = 2; }
            return;
        }
        if (!eagle) {
            if (p.nest) {
                const np = nestPoint(p.nest);
                eagle = newEagle(np.x, np.y, 0); eagle.perched = p.nest.b.id; eagle.inNest = np.inNest; eagle.state = p.rest === "hurt" ? "rest" : "stand";
                // (it was there all along: already sitting, asleep or lying hurt)
                const P = poseOf(), k = p.rest === "hurt" ? "hurt" : night() ? "sleep" : "sit";
                if (P && P[k]) eagle.pose = { kind: k, i: P[k][1] - 1, dir: 1 };
            }
            else spawnHere({});
            if (eagle) eagle.map = $gameMap.mapId();
        }
    }

    // ------------------------------------------------------------------
    // Moving: on foot (straight, round what is in the way; lost - it hops to him), in the air (no walls)
    // ------------------------------------------------------------------
    const DIR8 = a => { const o = Math.round(a / (Math.PI / 4)); return { 0: 6, 1: 3, 2: 2, 3: 1, 4: 4, "-4": 4, "-3": 7, "-2": 8, "-1": 9 }[o] || 2; };
    function walkTo(e, tx, ty, speedPx) {
        e.pose = null;
        const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
        if (d < 0.08) return true;
        const step = Math.min(d, speedPx / TILE());
        const nx = e.x + dx / d * step, ny = e.y + dy / d * step;
        const ok = (x, y) => freeTile(Math.floor(x), Math.floor(y - 0.05)) || (Math.floor(x) === Math.floor(e.x) && Math.floor(y - 0.05) === Math.floor(e.y - 0.05));
        if (ok(nx, ny)) { e.x = nx; e.y = ny; e.stuck = 0; }
        else if (ok(nx, e.y)) { e.x = nx; e.stuck++; }
        else if (ok(e.x, ny)) { e.y = ny; e.stuck++; }
        else e.stuck += 2;
        e.dir = DIR8(Math.atan2(dy, dx));
        e.walkStep += step;
        e.state = "walk";
        return false;
    }
    function flyTo(e, tx, ty, tz, speedPx) {
        e.pose = null;
        const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
        const step = Math.min(d, speedPx / TILE());
        if (d > 0.001) {
            e.x += dx / d * step; e.y += dy / d * step;
            const want = Math.atan2(dy, dx);
            let da = want - e.angle;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;
            e.angle += clamp(da, -0.12, 0.12);
            e.dir = DIR8(e.angle);
        }
        e.z += ((tz || 0) - e.z) * (d < 1.5 ? 0.12 : 0.04);
        e.state = "fly";
        e.flapT++;
        return d < 0.1 && Math.abs(e.z - (tz || 0)) < 2;
    }
    function hopNear(e) {
        const n = Math.max(1, Math.ceil(stageDef().land || 1));
        const sq = openSquare($gamePlayer._realX + 0.5 + (n > 1 ? n / 2 + 1 : 0), $gamePlayer._realY + 1, n, 4, n > 1 ? { x: $gamePlayer.x, y: $gamePlayer.y } : null);
        if (!sq) return;
        e.x = sq.x; e.y = sq.y; e.stuck = 0;
        puff(e);
    }
    let puffs = [];
    function puff(e) { puffs.push({ x: e.x, y: e.y, t: 0, dust: true, k: 0.8, life: 30 }); }
    // the wind of its wings on the ground (the big ones taking off / coming down when they go with him - no flight picture then, only
    // this and the shadow): a ring of wind going out, dust thrown up round its feet, a whoosh
    function gust(x, y, size) {
        const k = Math.max(0.6, (size || 1) / 2);
        puffs.push({ x, y, t: 0, ring: true, k, life: 34 });
        for (let i = 0; i < 14; i++) {
            const a = i / 14 * Math.PI * 2 + Math.random() * 0.4, sp = (0.03 + Math.random() * 0.035) * k;
            puffs.push({ x: x + Math.cos(a) * 0.3 * k, y: y + Math.sin(a) * 0.2 * k, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, t: 0,
                k: k * (0.7 + Math.random() * 0.5), dust: true, life: 40 });
        }
        T.audio.se("Wind7", { volume: 40, pitch: 135 });
    }

    // ------------------------------------------------------------------
    // The brain (every frame; the decisions every few)
    // ------------------------------------------------------------------
    function heroPoint() { return { x: $gamePlayer._realX + 0.5, y: $gamePlayer._realY + 0.9 }; }
    let heroStill = 0, lastHero = null, heroSpd = 0;   // (heroSpd: his pace, px a frame, smoothed - the eagle keeps it)
    function updateEagle() {
        const e = eagle, s = S();
        if (!e) return;
        e.t++;
        if (e.cool > 0) e.cool--;
        if (e.ridden) return;   // (Orzel_Lot moves it)
        if (e.caged) { e.state = "stand"; if (e.t % 120 === 0) e.dir = pick([2, 1, 3]); return; }
        stepPose(e);
        const st = s.stage, sd = stageDef(), hp = heroPoint();
        const hx = $gamePlayer._realX, hy = $gamePlayer._realY;
        if (lastHero && (Math.abs(lastHero.x - hx) > 0.01 || Math.abs(lastHero.y - hy) > 0.01)) heroStill = 0; else heroStill++;
        const mv = lastHero ? Math.hypot(hx - lastHero.x, hy - lastHero.y) * TILE() : 0;
        heroSpd = heroSpd * 0.8 + (mv > 12 ? 0 : mv) * 0.2;   // (a jump - a transfer, a hop - is not his pace)
        lastHero = { x: hx, y: hy };
        if (e.anim) { stepAnim(e); return; }
        // tired out in a fight: resting away from it (then back into it)
        if (e.restAway) { restStep(e); return; }
        // a fight (stage 3 on)
        if (st >= 3 && fightStep(e)) { e.overhead = false; return; }
        if (e.perched) {   // on its nest: sits, sleeps at night, lies hurt, gets up when he comes (perchIdle)
            const pl = placeHere();
            if (s.mode === "follow" && !(pl && pl.nest)) leaveNest(e);
            else { if (e.state !== "rest") e.state = "stand"; perchIdle(e, hp); return; }
        }
        if (e.state === "rest") {
            if (s.mode === "follow") e.state = "stand";
            else { idleLook(e, hp); return; }
        }
        if (s.mode === "home") {
            const h = home();
            if (h && h.map === $gameMap.mapId()) { goNest(e, h); return; }
        }
        if (s.mode === "stay" && e.state === "fly" && e.z > 6) { landHere(e); return; }
        if (s.mode === "stay" || s.mode === "home") { e.overhead = false; settle(e); idleLook(e, hp); return; }
        // follow
        const d = Math.hypot(hp.x - e.x, hp.y - e.y);
        if (sd.fly >= 2) return followAir(e, hp, d);
        if (sd.fly === 1 && (d > 5 || e.state === "fly")) {   // the podrostek: a short flight to him
            if (e.state !== "fly") { e.state = "fly"; e.target = landingNear(hp, 1) || { x: hp.x + 1, y: hp.y + 0.6 }; }
            const tg = e.target, mid = Math.hypot(tg.x - e.x, tg.y - e.y);
            if (flyTo(e, tg.x, tg.y, mid > 1.2 ? 34 : 0, 5)) { e.state = "stand"; e.z = 0; e.target = null; }
            return;
        }
        if (d > 9 || e.stuck > 50) { hopNear(e); return; }
        trail(e, hp, d, 1.6, (sd.speed || 3.5) * 1.35);
    }
    // on foot after him: it sets off when he is a bit further than `gap`, then keeps HIS pace (a bit quicker when behind, slower when
    // close) and stops only when he stands - no stop-and-go (a jerky walk) while he walks slower than it could
    function trail(e, hp, d, gap, maxSpeed) {
        const moving = heroSpd > 0.25;
        if (!e.trailing && d > gap + 0.7) e.trailing = true;
        if (e.trailing && (d < gap - 1 || (d < gap && !moving))) e.trailing = false;
        if (!e.trailing) { settle(e); restIdle(e); if (!e.pose) idleLook(e, hp); return; }
        if (e.pose) { standUp(e); return; }   // (sitting / asleep beside him: it gets up first)
        const speed = clamp(heroSpd + (d - gap) * 1.2, moving ? 0.4 : 0.8, maxSpeed);
        walkTo(e, hp.x, hp.y + 0.3, speed);
    }
    function settle(e) {
        if (e.z > 0) { e.z = Math.max(0, e.z - 4); if (e.z > 0) return; }
        if (e.state !== "rest") e.state = "stand";
    }
    function idleLook(e, hp) {
        if (e.t % 90 === 0 && Math.random() < 0.6) e.dir = DIR8(Math.atan2(hp.y - e.y, hp.x - e.x));
    }
    function landingNear(hp, n) {
        return openSquare(hp.x + (Math.random() < 0.5 ? -1.5 : 1.5), hp.y + 0.5, n, 5);
    }
    // does its body get through here: the tiles under it free (n wide, half of it deep) - the big ones do not squeeze between trees
    function bodyFits(x, y, n) {
        const x0 = Math.floor(x - n / 2 + 0.001), y1 = Math.floor(y - 0.05), rows = Math.max(1, Math.ceil(n / 2));
        for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) if (!freeTile(x0 + i, y1 - j)) return false;
        return true;
    }
    // the big ones (stage 4-5): on foot after him like the small ones; where its body does not get through (a forest, a narrow way, too
    // far behind) it goes up - a gust of wind and dust where it stood, "wzbił się", and from then on only its shadow is seen circling round
    // him (the flight picture with the wings spread is the ride's only); when he has been a good while where it has room, it comes down
    // beside him in a gust and walks on
    const OVER_Z = 200, LAND_WAIT = 240, FORM_Z = 90;   // (FORM_Z: below it the flying shadow melts into the round one under it)
    let saidRiseAt = -1e9;
    // its sounds a little later (the wingbeats one after another)
    let sfxQ = [];
    function sfxAt(delay, name, opts) { sfxQ.push({ at: Graphics.frameCount + delay, name, opts }); }
    function playSfx() {
        if (!sfxQ.length) return;
        const now = Graphics.frameCount;
        for (const q of sfxQ) if (now >= q.at) { if (now - q.at < 30) T.audio.se(q.name, q.opts); q.done = true; }   // (late - a menu was open: dropped)
        sfxQ = sfxQ.filter(q => !q.done);
    }
    // going up: a gust where it stood, heavy wingbeats going away, it climbs (its shadow shrinks into the flying shape)
    function rise(e, say) {
        if (e.z < 40) {
            gust(e.x, e.y, stageDef().tiles);
            [[0, 62, 52], [15, 56, 55], [30, 48, 58], [46, 36, 60], [64, 24, 62]].forEach(([t, v, p]) => sfxAt(t, "Evasion2", { volume: v, pitch: p }));
        }
        e.state = "fly"; e.z = Math.max(e.z, 8); e.overhead = true; e.target = null; e.airT = 0; e.trailing = false; e.landOk = 0; e.appear = 0;
        e.descending = false; e.beatLeft = 4; e.beatT = 0; e.glideT = 240;
        if (say && Graphics.frameCount - saidRiseAt > 1200) { saidRiseAt = Graphics.frameCount; pop(TX.rose); }
    }
    function touchDown(e, x, y) {
        e.x = x; e.y = y; e.z = 0; e.state = "stand"; e.overhead = false; e.target = null; e.stuck = 0; e.groundT = 0; e.landOk = 0; e.trailing = false;
        e.descending = false;
        e.appear = 14;   // (it shows in the dust)
        gust(x, y, stageDef().tiles);
        T.audio.se("Blow1", { volume: 42, pitch: 50 });   // (its weight on the ground)
        S().x = x; S().y = y;
    }
    // the shadow goes to (x, y) high up; true there
    function glideTo(e, x, y, speed) {
        e.overhead = true;
        return flyTo(e, x, y, OVER_Z, speed || 6) || Math.hypot(x - e.x, y - e.y) < 0.12;
    }
    // coming down on (x, y): high over it first, then straight down braking with its wings (the shadow grows and gathers under it), the
    // gust and it stands there; true when down
    function comeDown(e, x, y, speed) {
        e.overhead = true;
        if (!e.descending) {
            if (!glideTo(e, x, y, speed)) return false;
            e.descending = true; e.beatLeft = 2; e.beatT = 0;
            [[0, 30, 62], [18, 42, 58], [36, 52, 55]].forEach(([t, v, p]) => sfxAt(t, "Evasion2", { volume: v, pitch: p }));
        }
        e.x = x; e.y = y; e.state = "fly";
        e.z = Math.max(0, e.z - Math.max(2.2, e.z * 0.045));
        if (e.z <= 6) { touchDown(e, x, y); return true; }
        return false;
    }
    function followAir(e, hp, d) {
        const sd = stageDef(), n = Math.max(1, Math.ceil(sd.land || 1));
        if (e.state === "fly") {
            if (!e.overhead) rise(e, false);   // (up after a fight's hop: into the high flight)
            e.airT = (e.airT || 0) + 1;
            if (e.target && e.target.land) {
                comeDown(e, e.target.x, e.target.y, 6);
                return;
            }
            // room for it beside him: how long he has been where it could come down
            if (e.t % 10 === 0) {
                const me = { x: $gamePlayer.x, y: $gamePlayer.y };
                const sq = d < 7 ? (openSquare(hp.x + n / 2 + 1, hp.y + 0.5, n, 2, me) || openSquare(hp.x - n / 2 - 1, hp.y + 0.5, n, 2, me)) : null;
                const ok = sq && Math.hypot(sq.x - hp.x, sq.y - hp.y) < n / 2 + 3;
                e.landSq = ok ? sq : null;
                e.landOk = ok ? (e.landOk || 0) + 10 : 0;
            }
            if (e.landOk >= LAND_WAIT && e.landSq && e.airT > 60) { e.target = { x: e.landSq.x, y: e.landSq.y, z: 0, land: true }; return; }
            // circling round him (its shadow goes round him, over the trees too)
            e.ring = (e.ring || 0) + 0.012;
            const R = 2.5 + sd.tiles * 0.4, tx = hp.x + Math.cos(e.ring) * R, ty = hp.y + Math.sin(e.ring) * R * 0.6 - 0.3;
            flyTo(e, tx, ty, OVER_Z, d > 7 ? 9 : 5.5);
            return;
        }
        e.overhead = false;
        e.groundT = (e.groundT || 0) + 1;
        const gap = 1.6 + sd.tiles * 0.5;
        if (e.trailing || d > gap + 0.7) {
            // where it goes next: does its body get through (checked a tile ahead; not straight after landing)
            const ux = (hp.x - e.x) / Math.max(d, 0.01), uy = (hp.y - e.y) / Math.max(d, 0.01);
            const blocked = e.groundT > 45 && e.t % 6 === 0 && !bodyFits(e.x + ux, e.y + uy, n);
            if (d > 10 || e.stuck > 40 || blocked) { rise(e, true); return; }
        }
        trail(e, hp, d, gap, (sd.speed || 4.5) * 1.35);
    }
    // "Wracaj do gniazda" with the nest on this map: the big ones go up and come down on it (a gust), the podrostek flies, the small ones
    // walk to its front and hop in; there it sits
    function goNest(e, h) {
        const np = nestPoint(h), sd = stageDef(), d = Math.hypot(np.x - e.x, np.y - e.y);
        if (sd.fly >= 2) {
            if (e.state !== "fly" || !e.overhead) rise(e, false);
            if (comeDown(e, np.x, np.y, 6)) perch(e, h, np);
            return;
        }
        e.overhead = false;
        if (sd.fly >= 1) {
            if (e.state !== "fly") { e.state = "fly"; e.z = Math.max(e.z, 2); e.target = null; }
            if (flyTo(e, np.x, np.y, d > 1.5 ? (sd.fly >= 2 ? 90 : 40) : np.z, sd.fly >= 2 ? 5.5 : 4.5) || d < 0.12) perch(e, h, np);
            return;
        }
        const fx = np.x, fy = h.b.y + 1.9, df = Math.hypot(fx - e.x, fy - e.y);
        if (df < 0.35 || e.stuck > 60 || d > 18) { if (df >= 0.35) puff(e); perch(e, h, np); return; }
        walkTo(e, fx, fy, (sd.speed || 3.5) * 1.2);
    }
    function perch(e, h, np) {
        e.x = np.x; e.y = np.y; e.z = 0; e.state = "stand"; e.target = null; e.stuck = 0; e.perched = h.b.id; e.inNest = !!np.inNest; e.dir = 2;
        e.awake = false;
        S().x = e.x; S().y = e.y;
    }
    // out of the nest (it follows him again): over the rim to the nest's front
    function leaveNest(e) {
        const n = nests().find(x => x.b.id === e.perched), np = n ? nestPoint(n) : null;
        e.perched = null; e.pose = null; e.awake = false;
        if (np && e.inNest) { e.y = n.b.y + 1.9; puff(e); }
        e.inNest = false;
        dropRim(e);
    }

    // ------------------------------------------------------------------
    // The poses from the front (Orzel_Data POSE_SPEED; Orzel<n>_Poza.png): sitting down / up, asleep, lying hurt, preening.
    // e.pose = { kind, i (the frame, fractional), dir (1 into it, -1 out of it), next (the pose after sitting down) } | null (standing)
    // ------------------------------------------------------------------
    const poseOf = () => (D.SHEETS[S().stage] || {}).pose || null;
    const poseLast = (P, k) => P[k][1] - 1;
    function want(e, kind) {
        const P = poseOf(), p = e.pose;
        if (!P || !P[kind]) return;
        if (p && p.kind === kind && p.dir > 0) return;
        if (kind === "sit") {
            if (p && p.kind === "sit") Object.assign(p, { dir: 1, next: null, up: false });
            else e.pose = { kind: "sit", i: p && (p.kind === "sleep" || p.kind === "hurt") ? poseLast(P, "sit") : 0, dir: 1 };   // (awake: it sits up)
            return;
        }
        if (kind === "preen" && P.preenFrom === "none") return;   // (the adult lying in its nest: no preening there)
        if (kind === "preen" && P.preenFrom === "stand") { if (!p) e.pose = { kind, i: 0, dir: 1 }; return; }
        // asleep, lying hurt, preening (the bigger ones): from the sitting pose - sat down first
        const seated = p && p.kind === "sit" && p.dir > 0 && p.i >= poseLast(P, "sit");
        if (seated || (p && (p.kind === "sleep" || p.kind === "hurt"))) e.pose = { kind, i: 0, dir: 1 };
        else if (p && p.kind === "sit" && p.dir > 0) p.next = kind;
        else e.pose = { kind: "sit", i: p && p.kind === "sit" ? p.i : 0, dir: 1, next: kind };
    }
    function standUp(e) {
        const p = e.pose, P = poseOf();
        if (!p) return;
        if (!P || !P[p.kind]) { e.pose = null; return; }
        if (p.kind === "preen") p.dir = -1;
        else if (p.kind !== "sit") e.pose = { kind: "sit", i: poseLast(P, "sit"), dir: -1 };
        else p.dir = -1;
        e.pose.next = null;
        e.pose.up = true;
    }
    function stepPose(e) {
        const p = e.pose, P = poseOf();
        if (!p) return;
        if (!P || !P[p.kind]) { e.pose = null; return; }
        const last = poseLast(P, p.kind), sp = p.dir < 0 && p.kind !== "preen" ? D.POSE_SPEED.up : D.POSE_SPEED[p.kind] || 0.1;
        p.i += sp * p.dir;
        if (p.dir < 0 && p.i <= 0) {
            // (preened: it sits again - or stands, the small ones; up out of sitting: it stands)
            e.pose = p.kind === "preen" && P.preenFrom !== "stand" && !p.up ? { kind: "sit", i: poseLast(P, "sit"), dir: 1 } : null;
            return;
        }
        if (p.i >= last) {
            p.i = last;
            if (p.kind === "preen") { p.hold = (p.hold || 0) + 1; if (p.hold > 30) p.dir = -1; }   // (there and back)
            else if (p.next) e.pose = { kind: p.next, i: 0, dir: 1 };
        }
    }
    const poseCell = (e, P) => P[e.pose.kind][0] + clamp(Math.floor(e.pose.i), 0, poseLast(P, e.pose.kind));
    function posedStill(e) { const P = poseOf(), p = e.pose; return !!(P && p && P[p.kind] && p.dir > 0 && p.kind !== "preen" && p.i >= poseLast(P, p.kind)); }
    // on its nest: lying hurt for the day of healing; at night asleep (it does not wake by itself - his touch does: the menu, then it
    // sleeps again once he has gone); by day it sits, now and then preens; he comes up to it - it stands up and turns to him
    function perchIdle(e, hp) {
        const s = S(), I = D.IDLE, d = Math.hypot(hp.x - e.x, hp.y - e.y);
        if (s.hurtUntil && clock() < s.hurtUntil) { want(e, "hurt"); return; }
        if (night()) {
            if (e.awake && d > I.far + 0.5) e.awake = false;
            if (!e.awake) { want(e, "sleep"); return; }
        } else e.awake = false;
        if (d < I.near) {
            if (e.pose) { if (!e.pose.up) standUp(e); return; }
            e.dir = DIR8(Math.atan2(hp.y - e.y, hp.x - e.x));
            return;
        }
        if (d > I.far || (e.pose && !e.pose.up)) {
            if (!e.pose || e.pose.up || e.pose.next || e.pose.kind === "sleep" || e.pose.kind === "hurt") want(e, "sit");
            else if (posedStill(e) && e.pose.kind === "sit" && e.t % 60 === 0 && Math.random() < I.preen) want(e, "preen");
        }
    }
    // going with him: he stands a good while - it sits beside him (at night sooner), and later at night it sleeps; the small ones
    // preen standing now and then (the big ones are on the ground only where they fit - landed)
    function restIdle(e) {
        const I = D.IDLE, P = poseOf();
        if (!P || e.z > 0 || e.restAway || e.foe) return;
        if (night() && heroStill > I.sleepNight) { want(e, "sleep"); return; }
        if (heroStill > (night() ? I.sitNight : I.sit)) {
            if (!e.pose || e.pose.up || e.pose.next || e.pose.kind === "sleep" || e.pose.kind === "hurt") want(e, "sit");
            else if (posedStill(e) && e.pose.kind === "sit" && P.preenFrom !== "stand" && e.t % 60 === 0 && Math.random() < I.preen) want(e, "preen");
            return;
        }
        if (!e.pose && P.preenFrom === "stand" && heroStill > 240 && e.t % 90 === 0 && Math.random() < I.preen) want(e, "preen");
    }
    // "Zostań tu" while up in the air: down where there is room near it
    function landHere(e) {
        const n = Math.max(1, Math.ceil(stageDef().land || 1)), big = stageDef().fly >= 2;
        if (!e.target || !e.target.land) {
            const sq = openSquare(e.x, e.y + 0.5, n, 5, big ? { x: $gamePlayer.x, y: $gamePlayer.y } : null);
            e.target = { x: sq ? sq.x : e.x, y: sq ? sq.y : e.y, z: 0, land: true };
        }
        if (big) { comeDown(e, e.target.x, e.target.y, 6); return; }
        e.overhead = false;
        if (flyTo(e, e.target.x, e.target.y, 0, 4.5)) { e.state = "stand"; e.z = 0; e.target = null; S().x = e.x; S().y = e.y; }
    }
    function stepAnim(e) {
        const a = e.anim;
        if (++a.t >= a.speed) { a.t = 0; a.i++; if (a.onFrame) a.onFrame(a.i); }
        if (a.i >= a.n) { e.anim = null; if (a.then) a.then(); }
    }

    // ------------------------------------------------------------------
    // The fight (stage 3 on): the foe the hero has (soft target, engaged beasts, men after him); beak and talons; the adult's dive and cry
    // ------------------------------------------------------------------
    function foeOk(t) {
        const Sc = SC();
        if (!t || !Sc) return false;
        if (Sc.alive && !Sc.alive(t)) return false;
        const H = T.api("Hunting"), Hm = HM();
        if (H && H.animals && H.animals.includes(t)) {
            const sp = (H.SPECIES || {})[t.kind()] || {};
            if (!sp.aggressive || t._mode === "flee" || t._dawn) return false;
            if (t._qbBounty || t._tqLeader) return true;
            return !!(t._engaged || (t._pack && t._pack.engaged) || ["warn", "charge", "approach", "recover", "stagger"].includes(t._mode));
        }
        if (Hm && Hm.list && Hm.list.includes(t)) {
            if (t._dead || t._surrendered || t._mode === "flee" || t._mode === "leave") return false;
            const f = Hm.foeOf ? Hm.foeOf(t) : null;
            return !!t._engaged && (!f || (!!bodyChar && f === bodyChar)) && !!(t._band && t._band._heroAlarm);
        }
        return false;
    }
    function pickFoe(e) {
        const cfg = D.FIGHT[S().stage], H = T.api("Hunting"), Hm = HM();
        const target = softTarget();
        if (target && foeOk(target)) return target;
        let best = null, bd = cfg.join;
        for (const t of [].concat(H && H.animals ? H.animals : [], Hm && Hm.list ? Hm.list : [])) {
            if (!foeOk(t)) continue;
            const d = Math.hypot(t._realX + 0.5 - e.x, t._realY + 0.9 - e.y);
            if (d < bd && Math.hypot(t._realX - $gamePlayer._realX, t._realY - $gamePlayer._realY) < cfg.join + 4) { bd = d; best = t; }
        }
        return best;
    }
    let ordered = null;   // the foe the hero sent it at ("Atakuj!")
    // the hero's soft target (Combat_Feel.js: the ring on the ground, F)
    function softTarget() {
        const C = CB(), f = C && C.feel, t = f && f.target ? f.target() : null;
        return t && t.ref ? t.ref : null;
    }
    function fightStep(e) {
        const s = S(), cfg = D.FIGHT[s.stage];
        if (!cfg || s.hurtUntil || s.mode === "home") return false;
        if (s.mode === "stay" && !ordered) return false;
        if (e.flee > 0) {   // badly hurt: to the hero, out of it
            e.flee--;
            const hp = heroPoint();
            if (s.stage >= 4) flyTo(e, hp.x + 1, hp.y - 1, 90, 6); else walkTo(e, hp.x + 0.8, hp.y + 0.6, 4.5);
            return true;
        }
        let foe = ordered && foeOk(ordered) ? ordered : (e.foe && foeOk(e.foe) ? e.foe : null);
        if (!foe && e.t % 12 === 0) foe = pickFoe(e);
        if (!foe) { e.foe = null; ordered = null; return false; }
        e.foe = foe;
        s.fightDay = day();
        const fx = foe._realX + 0.5, fy = foe._realY + 0.9, d = Math.hypot(fx - e.x, fy - e.y);
        if (s.st <= 0) { goRest(e, foe); return true; }
        // the adult: from the air a dive (when it is up) - otherwise on foot like the others
        if (s.stage === 5 && cfg.dive && e.z > 30 && e.cool <= 0 && s.st >= cfg.dive.cost) {
            if (flyTo(e, fx, fy, 0, 10) || d < 0.8) diveHit(e, foe);
            return true;
        }
        if (e.z > 0 && s.stage >= 4 && d > cfg.reach) { flyTo(e, fx - Math.sign(fx - e.x) * cfg.reach * 0.7, fy + 0.3, d > 2 ? 40 : 0, 7); return true; }
        if (d > cfg.reach) { walkTo(e, fx - Math.sign(fx - e.x) * (cfg.reach * 0.7), fy + 0.2, (stageDef().speed || 4) * 1.3); if (e.stuck > 30) { e.z = 20; e.state = "fly"; } return true; }
        settle(e);
        e.dir = DIR8(Math.atan2(fy - e.y, fx - e.x));
        if (e.cool > 0) return true;
        strike(e, foe);
        return true;
    }
    // Out of wing strength in a fight: it does not sit down among the foes - the big ones go up (a gust) and off, far from the fight,
    // and circle high there (a resting eagle soars); the podrostek flies a short way aside and sits. Rested (a while, and most of its
    // strength back), the big ones come back and come down beside the hero (a gust) and go on fighting; the podrostek walks back in.
    function goRest(e, foe) {
        const s = S(), big = s.stage >= 4, hp = heroPoint(), F2 = D.FIGHT;
        // away from the foe (and from him: out of it)
        const fx = foe ? foe._realX + 0.5 : hp.x, fy = foe ? foe._realY + 0.9 : hp.y + 1;
        let ax = e.x - fx, ay = e.y - fy;
        const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
        const far = big ? F2.restFar : 6, W = $gameMap.width(), H = $gameMap.height();
        const r = { t: 0, phase: "away", x: clamp(hp.x + ax * far, 1, W - 2), y: clamp(hp.y + ay * far, 2, H - 1), ring: 0 };
        if (!big) { const sq = openSquare(r.x, r.y, 1, 4); if (sq) { r.x = sq.x; r.y = sq.y; } }
        e.foe = null; e.anim = null; e.trailing = false;
        e.restAway = r;
        if (big) { rise(e, false); pop(TX.tiredAway, { color: "#ffd0a0" }); }
        else { e.state = "fly"; e.z = Math.max(e.z, 2); pop(TX.tiredHop, { color: "#ffd0a0" }); }
    }
    function restStep(e) {
        const s = S(), r = e.restAway, big = s.stage >= 4, F2 = D.FIGHT;
        if (s.mode === "home" || s.hurtUntil) { e.restAway = null; return; }   // (sent home / hurt: that goes first)
        r.t++;
        s.st = Math.min(maxSt(), s.st + F2.stRegen / 60);
        const rested = r.t >= F2.restMin && s.st >= maxSt() * F2.restBack;
        if (r.phase === "away") {
            if (big) {
                // off to its quiet spot, then a slow high ring round it (its shadow far away)
                if (!r.there && glideTo(e, r.x, r.y, 7)) r.there = true;
                if (r.there) { r.ring += 0.01; flyTo(e, r.x + Math.cos(r.ring) * 2.5, r.y + Math.sin(r.ring) * 1.5, OVER_Z, 3.5); }
            } else if (e.state === "fly") {
                const dd = Math.hypot(r.x - e.x, r.y - e.y);
                if (flyTo(e, r.x, r.y, dd > 1.2 ? 34 : 0, 5) || dd < 0.1) { e.state = "rest"; e.z = 0; }
            } else e.state = "rest";
            if (!rested) return;
            if (!big) { e.state = "stand"; e.restAway = null; pop(TX.restedBack, { color: "#9ff0a8" }); return; }
            // back: down beside him (room for it), else beside the foe he fights; no room anywhere near - it stays up over him till there is
            const n = Math.max(1, Math.ceil(stageDef().land || 1)), hp = heroPoint(), me = { x: $gamePlayer.x, y: $gamePlayer.y };
            const t = pickFoe(e);
            r.land = openSquare(hp.x + n / 2 + 1, hp.y + 0.5, n, 6, me) || openSquare(hp.x - n / 2 - 1, hp.y + 0.5, n, 6, me)
                || (t ? openSquare(t._realX + 0.5, t._realY + 1.4, n, 5, me) : null);
            r.phase = "back";
            pop(TX.restedBack, { color: "#9ff0a8" });
            if (!r.land) { e.restAway = null; e.target = null; }   // (followAir keeps it up over him and lands it when there is room)
            return;
        }
        if (comeDown(e, r.land.x, r.land.y, 8)) e.restAway = null;
    }
    // which blow: by the weights in the data (the user: talons 60%, beak 40% - mixed at random)
    function pickAtk(list) {
        const tot = list.reduce((a, x) => a + (x[2] || 1), 0);
        let r = Math.random() * tot;
        for (const x of list) { r -= x[2] || 1; if (r <= 0) return x; }
        return list[list.length - 1];
    }
    function strike(e, foe) {
        const s = S(), cfg = D.FIGHT[s.stage], sh = D.SHEETS[s.stage];
        const [how, dmg] = pickAtk(cfg.atk);
        s.st = Math.max(0, s.st - cfg.cost);
        e.cool = cfg.gap;
        const n = sh && sh.atk ? sh.atk[1] : 4, hit = sh && sh.hit !== undefined ? sh.hit : Math.floor(n / 2);
        e.state = "attack";
        // (the adult's quick blows: 2 frames a cell)
        e.anim = { kind: "atk", i: 0, n, t: 0, speed: Math.max(2, Math.round(cfg.gap / (n + 2))), onFrame: i => { if (i === hit) land(e, foe, dmg, how, cfg); },
            then: () => { e.state = "stand"; } };
    }
    function land(e, foe, dmg, how, cfg) {
        if (!foeOk(foe)) return;
        const Sc = SC(), H = T.api("Hunting"), Hm = HM(), lv = (CB() && CB().hero ? CB().hero().level || 1 : 1);
        const d = Math.round(dmg * (1 + 0.04 * (lv - 1)));
        asChar(e);
        T.audio.se(how === "dziob" ? "Bite" : "Slash1", { volume: 70, pitch: how === "dziob" ? 120 : 95 });
        if (H && H.animals && H.animals.includes(foe)) {
            const kind = foe.kind ? foe.kind() : "", now = Graphics.frameCount, F2 = D.FIGHT.foes;
            // (a wolf thrown back now and then - not every blow: a beast it holds down for good would never strike back)
            const knock = kind === "wolf" && now - (foe._orzelKnockAt || -1e9) > F2.knockGap && Math.random() < (cfg.knockWolf || 0);
            if (knock) foe._orzelKnockAt = now;
            if (Sc && Sc.hurtBeast) Sc.hurtBeast(foe, d, { by: "eagle", how: "eagle", from: e, poise: knock ? 60 : F2.poise, knock, steady: !knock });
            if (knock && foe._hp > 0 && H.stagger) { try { H.stagger(foe, true); } catch (x) { /* (no stagger) */ } }
            if (foe._hp > 0) provoke(foe);   // (it may turn on the eagle)
        } else if (Hm && Hm.list && Hm.list.includes(foe)) {
            // a man is never killed by the eagle: at the last it only knocks him down (he kneels or runs)
            const hpNow = foe._hp !== undefined ? foe._hp : 99, safe = Math.max(0, Math.min(d, hpNow - 1));
            if (safe > 0) Hm.hit(foe, safe, "eagle", { from: { x: e.x, y: e.y }, poise: 20, by: "eagle" });
            if (hpNow - safe <= 1 && Hm.surrender) { try { Hm.surrender(foe); } catch (x) { /* (he runs) */ } }
            else provoke(foe);   // (he may turn on it)
        }
        S().fightDay = day();
    }
    function diveHit(e, foe) {
        const s = S(), cfg = D.FIGHT[5].dive, Sc = SC(), H = T.api("Hunting");
        s.st = Math.max(0, s.st - cfg.cost);
        e.cool = cfg.gap;
        e.z = 0;
        e.state = "attack";
        T.audio.se("Wind7", { volume: 60, pitch: 120 });
        T.audio.se("Blow1", { volume: 80, pitch: 80 });
        if ($gameScreen) $gameScreen.startShake(3, 8, 10);
        asChar(e);
        if (H && H.animals && H.animals.includes(foe)) {
            const kind = foe.kind ? foe.kind() : "", sp = (H.SPECIES || {})[kind] || {};
            if (Sc && Sc.hurtBeast) Sc.hurtBeast(foe, cfg.dmg, { by: "eagle", how: "eagle", from: e, poise: 80, knock: !sp.heavy, heavy: true });
            if (sp.bear && foe._hp > 0) {
                foe._orzelDives = (foe._orzelDives || 0) + 1;
                if (foe._orzelDives >= cfg.bearFlee || foe._hp < (sp.hp || 260) / 2) { try { foe._mode = "flee"; foe._fleeing = true; foe._engaged = false; } catch (x) { /* */ } }
            }
            if (kind === "boar" && foe._mode === "charge") { try { foe.setMode && foe.setMode("recover", 60); } catch (x) { /* */ } }
        } else if (foe && HM() && HM().list.includes(foe)) land(e, foe, cfg.dmg, "szpony", D.FIGHT[5]);
        e.anim = { kind: "atk", i: 0, n: (D.SHEETS[5].atk || [0, 6])[1], t: 0, speed: 4, then: () => { e.state = "stand"; e.z = 0; } };
    }
    // ------------------------------------------------------------------
    // (2026-10-18, the user's "tak") the others fight it for real. Its body for them: a Game_Character kept where it is (its feet x, y;
    // its middle up by its height) with takeHit / isDown - a beast it strikes may turn on it (Starcia.js: its `_clash` stands in for the
    // hero while it thinks - the wolf's leap and snap, the boar's charge, the bear's paw land here), a man it strikes may make it his foe
    // (Humans.js: his blows), an archer shoots at it (his arrow, seen) - on the ground; the arrows also in the low flight, with the hero on
    // it too (they hit the bird, not him); high up nobody reaches it. Orzel_Data FIGHT.foes
    // ------------------------------------------------------------------
    function Game_EagleBody() { this.initialize(...arguments); }
    Game_EagleBody.prototype = Object.create(Game_Character.prototype);
    Game_EagleBody.prototype.constructor = Game_EagleBody;
    Game_EagleBody.prototype.initialize = function() { Game_Character.prototype.initialize.call(this); this._orzel = true; this.setThrough(true); };
    Game_EagleBody.prototype.centerX = function() { return eagle ? eagle.x : this._realX + 0.5; };
    Game_EagleBody.prototype.centerY = function() { return eagle ? eagle.y - 0.45 - (eagle.z || 0) / TILE() : this._realY + 0.5; };
    Game_EagleBody.prototype.takeHit = function(info) { return takeHit(info || {}); };
    Game_EagleBody.prototype.isDown = function() { return !reachable(true); };
    Game_EagleBody.prototype.update = function() {};   // (moved by the eagle's own clock)
    // (Starcia.js, as a beast thinks with it in the hero's place) a big bird: the beast goes for the part of its body nearest to it - its
    // leap, its snap, its charge reach the bird's side, not only its middle (FIGHT.foes.size: tiles from its middle, by stage)
    Game_EagleBody.prototype.standFor = function(a) {
        const e = eagle;
        if (!e || !a || typeof a.centerX !== "function") return;
        const r = (D.FIGHT.foes.size || {})[S().stage] || 0, mx = e.x, my = e.y - 0.45;
        const dx = a.centerX() - mx, dy = a.centerY() - my, d = Math.hypot(dx, dy) || 1, k = Math.min(r, Math.max(0, d - 0.6)) / d;
        const px = mx + dx * k, py = my + dy * k;
        this._realX = px - 0.5; this._realY = py - 0.5; this._x = Math.round(this._realX); this._y = Math.round(this._realY);
    };
    let bodyChar = null;
    const bodyOf = () => bodyChar || (bodyChar = new Game_EagleBody());
    function syncBody(e) {
        const b = bodyOf();
        b._realX = e.x - 0.5; b._realY = e.y - 0.9; b._x = Math.round(b._realX); b._y = Math.round(b._realY);
        b._direction = e.dir || 2;
        b._hitRadius = (D.FIGHT.foes.arrows.radius || {})[S().stage] || 0.5;
    }
    // may the others reach it: a blow - on the ground only; an arrow (shot) - also in the low flight (the podrostek's hop, him on it low);
    // never high up, resting away, leaving, hurt, caged, gone, on another map
    function reachable(shot) {
        const e = eagle, s = has() ? S() : null, F2 = D.FIGHT.foes;
        if (!e || !s || !s.have || s.stage < 3 || e.map !== $gameMap.mapId() || e.caged || e.leaving || e.restAway || s.away) return false;
        if (s.hurtUntil && clock() < s.hurtUntil) return false;
        if (e.ridden) {
            const L = T.api("Orzel_Lot"), lot = L && L.lot;
            return !!shot && !!lot && lot.on && lot.level === "low" && (lot.phase === "fly" || lot.phase === "dive" || lot.phase === "rise");
        }
        if (e.overhead) return false;
        return e.z <= F2.reach || (!!shot && e.z <= 100);
    }
    // (Starcia.js: the eagle's body as a beast's foe - alive while it can be bitten)
    function registerBody() {
        const Sc = SC();
        if (registerBody.done || !Sc || !Sc.addFighter) return;
        registerBody.done = true;
        Sc.addFighter({ is: t => !!t && t === bodyChar, alive: () => reachable(false), by: "eagle" });
    }
    registerBody();
    // a blow or an arrow on it (Hunting_AI.js hitTarget, Humans.js blowLand and the arrows)
    function takeHit(info) {
        const e = eagle, F2 = D.FIGHT.foes, shot = !!info.shot;
        if (!e || !reachable(shot)) return "miss";
        const H = T.api("Hunting"), Hm = HM(), from = info.from || null;
        const kind = from && H && H.animals && H.animals.includes(from) && from.kind ? from.kind() : from && Hm && Hm.list && Hm.list.includes(from) ? "man" : "";
        const n = Math.max(1, Math.round((info.damage || 1) * (shot ? F2.arrows.dmg : (F2[kind] || {}).dmg || 1)));
        e.hitT = 12;
        T.audio.se(shot ? "Damage1" : "Damage3", { volume: 55, pitch: shot ? 135 : 115 });
        S().fightDay = day();
        hurt(n);
        if (!eagle) return "hit";
        if (e.ridden) { airHurt(e); return "hit"; }
        // it answers the one who struck it (one of his foes - a beast, a man after him)
        if (from && !e.foe && !shot && foeOk(from)) e.foe = from;
        return "hit";
    }
    // hurt with him on its back: "ranny - ląduj!" over him now and then (life under FIGHT.foes.hurtAir)
    function airHurt(e) {
        const s = S();
        if (s.hp > 0 && s.hp < maxHp() * D.FIGHT.foes.hurtAir && Graphics.frameCount - (e.saidHurtAir || -1e9) > 480) {
            e.saidHurtAir = Graphics.frameCount;
            pop(TX.hurtAir, { color: "#ffb4a0" });
        }
    }
    // one it struck turns on it, maybe (FIGHT.foes: the chance; a pack sends at most `max` wolves, the rest stay at the hero)
    function provoke(foe) {
        const e = eagle, F2 = D.FIGHT.foes, Sc = SC(), H = T.api("Hunting"), Hm = HM();
        if (!e || !foe || !reachable(false)) return false;
        const b = bodyOf();
        syncBody(e);
        if (H && H.animals && H.animals.includes(foe)) {
            const kind = foe.kind ? foe.kind() : "", cfg = F2[kind];
            if (!cfg || (Sc && Sc.freeBeast && !Sc.freeBeast(foe)) || foe._clash || foe._mode === "flee" || foe._dawn) return false;
            if (Math.random() >= cfg.turn) return false;
            const pack = foe._pack;
            if (pack) {
                if (pack._clash) return false;   // (the pack is after someone else)
                const live = pack.members.filter(m => !m._dead), onMe = live.filter(m => m._clash === b).length;
                if (onMe >= cfg.max || live.length - onMe - 1 < Math.min(cfg.keep, live.length - 1)) return false;
                if (pack.attacker === foe && !(foe._mode === "lunge" && foe.isJumping())) pack.attacker = null;
            }
            foe._slot = undefined; foe._spot = null; foe._noSpot = null; foe._p8 = null; foe._badSlots = []; foe._badSpots = [];
            foe._clash = b;
            foe._aware = 1;
            if (foe._mode === "windup" || foe._mode === "close") foe.setMode("stalk");
            if (kind === "bear" && !foe._engaged && foe.bearEngage) foe.bearEngage();
            T.emit("clash", { a: foe, b, kind: "start" });
            return true;
        }
        if (Hm && Hm.list && Hm.list.includes(foe)) {
            if (foe._kind === "archer" || foe._dead || foe._surrendered || Hm.foeOf(foe) || (Sc && Sc.freeMan && !Sc.freeMan(foe))) return false;
            if (Math.random() >= F2.man.turn) return false;
            return Hm.setFoe(foe, b);
        }
        return false;
    }
    // every few frames: the men on it - a fighter lets it go when it is up in the air (back to the hero), an archer when it is out of his
    // reach; the archers about (after the hero, or under its low flight) take it as their mark (FIGHT.foes.arrows)
    let archerLook = 0;
    function foesTick() {
        const e = eagle, Hm = HM(), Sc = SC(), F2 = D.FIGHT.foes, b = bodyChar;
        if (!Hm || !Hm.list || !Hm.foeOf) return;
        const ground = reachable(false), shotOk = reachable(true);
        const look = Graphics.frameCount - archerLook >= F2.arrows.every;
        if (look) archerLook = Graphics.frameCount;
        for (const h of Hm.list) {
            const f = b ? Hm.foeOf(h) : null;
            const d = e ? Math.hypot(h.centerX() - e.x, h.centerY() - e.y) : 99;
            if (f && f === b) {
                if (h._kind === "archer" ? !shotOk || d > F2.arrows.range + 3 : !ground) Hm.setFoe(h, null);
                continue;
            }
            if (!look || !shotOk || f || h._kind !== "archer" || h._dead || h._surrendered || h._mode === "sleep" || h._mode === "flee" || h._mode === "leave") continue;
            if ((Sc && Sc.freeMan && !Sc.freeMan(h)) || h._arrows <= 0 || d > F2.arrows.range) continue;
            const after = h._engaged && h._band && h._band._heroAlarm;
            if (!after && !e.ridden) continue;   // (one who is not after him shoots only at the giant bird low over him with a rider)
            if (Math.random() < F2.arrows.chance) { syncBody(e); Hm.setFoe(h, bodyOf(), { ranged: true }); }
        }
    }
    // the men on it let it go (it is gone, hurt, away)
    function releaseFoes() {
        const Hm = HM();
        if (!bodyChar || !Hm || !Hm.list) return;
        for (const h of Hm.list) if (Hm.foeOf(h) === bodyChar) Hm.setFoe(h, null);
    }
    function hurt(n) {
        const s = S(), e = eagle;
        s.hp = Math.max(0, s.hp - n);
        T.call("Combat", "numberAt", e ? e.x : 0, e ? e.y - 1.2 - (e.z || 0) / TILE() : 0, String(n), "#ff9f8f", 0.85);
        if (s.hp <= 0) {
            s.hurtUntil = clock() + CARE.hurtHours;
            releaseFoes();
            if (e && e.ridden) {   // (him on it: down first - Orzel_Lot.js; it flies off to its nest once he is off - afterLand)
                e.foe = null;
                pop(TX.hurtDown, { color: "#ffb4a0" });
                const L = T.api("Orzel_Lot");
                if (L && L.forceLand) L.forceLand("hurt");
                return;
            }
            pop(TX.hurt, { color: "#ffb4a0" });
            if (e) { e.foe = null; sendOff(); }
        } else if (s.hp < maxHp() * (D.FIGHT[s.stage] || {}).fleeAt && e && !e.ridden) e.flee = 240;
    }
    // (Orzel_Lot.js: he got off) hurt on the way down - off to its nest
    function afterLand() {
        const s = S();
        if (eagle && s.hurtUntil && clock() < s.hurtUntil) { pop(TX.hurt, { color: "#ffb4a0" }); eagle.foe = null; sendOff(); }
    }
    function sendOff() {   // it leaves the map (to its nest, to the ridge)
        if (!eagle) return;
        const e = eagle, o = offscreen(e.x, e.y);
        e.foe = null;
        if (S().stage >= 4) rise(e, false);   // (the big ones: a gust, then only the shadow going off)
        else e.overhead = false;
        e.target = { x: o.x, y: o.y - 2, z: 160, off: true };
        e.state = "fly";
        e.leaving = true;
    }
    function updateLeaving(e) {
        if (!e || !e.leaving) return false;
        const z = e.overhead ? OVER_Z : 160;
        if (flyTo(e, e.target.x, e.target.y, z, 7) || Math.hypot(e.target.x - e.x, e.target.y - e.y) < 0.5) removeEagle();
        return true;
    }

    // ------------------------------------------------------------------
    // Neglected: off to the ridge (stage 3+), called back after three days, or fetched with meat
    // ------------------------------------------------------------------
    function flyOff() {
        const s = S();
        if (s.away) return;
        s.away = { since: clock(), back: clock() + 24 * CARE.flee.awayDays };
        s.hungryDays = 0;
        for (const l of TX.fled) pop(l, { color: "#ffd0a0" });
        note(TX.fledNote[0], TX.fledNote[1]);
        if (eagle) sendOff();
        if (T.api("Orzel_Lot") && T.call("Orzel_Lot", "flying")) T.call("Orzel_Lot", "forceLand", "away");
    }
    function callBack(fromRidge) {
        const s = S();
        if (!s.away) return false;
        tickNeeds();   // (the hours it was away count as away: it fed itself)
        s.away = null;
        s.bond = Math.max(s.bond, fromRidge ? CARE.flee.ridgeBond : CARE.flee.callBond);
        s.food = Math.max(s.food, 60); s.water = Math.max(s.water, 60);
        s.mode = "follow";
        s.map = $gameMap.mapId();
        removeEagle();
        spawnHere({ near: true, flyIn: !fromRidge });
        if (fromRidge) { pop(TX.ridgeBack, { color: "#9ff0a8" }); note(TX.ridgeBackNote[0], TX.ridgeBackNote[1]); }
        else pop(TX.callBack, { color: "#9ff0a8" });
        return true;
    }

    // ------------------------------------------------------------------
    // Food and water: from the hand, from the bag; the nest's bowl (Farming's small food-only chest + bowlWater)
    // ------------------------------------------------------------------
    function feed(id) {
        const s = S();
        id = id || bestMeat();
        if (!id) { popNeed(TX.noMeat, 0); return false; }
        if (s.food >= 95) { pop(TX.notHungry); return false; }
        $gameParty.loseItem(item(id), 1);
        s.food = Math.min(100, s.food + pieceValue(id));
        if (s.handDay !== day()) { s.handDay = day(); addBond(CARE.bond.hand); }
        s.seenDay = day();
        T.audio.se("Bite", { volume: 55, pitch: 115 });
        pop(TX.fed, { vars: { co: (item(id).name || "").toLowerCase() } });
        return true;
    }
    function bowlOf(b) { return b && b.store ? Object.keys(b.store).filter(k => k[0] === "i" && b.store[k] > 0).map(k => ({ id: Number(k.slice(1)), n: b.store[k] })) : []; }
    function eatFromNest() {
        const s = S(), h = home();
        if (!h) return;
        const near = s.mode === "home" || s.map === h.map;
        if (!near) return;
        const b = h.b;
        for (let guard = 0; guard < 6 && s.food < 50; guard++) {
            const list = bowlOf(b).filter(x => MEATS().includes(x.id));
            if (!list.length) break;
            const x = list[0], key = "i" + x.id;
            b.store[key] -= 1;
            if (b.store[key] <= 0) delete b.store[key];
            const fr = b.fresh && b.fresh[x.id];
            if (fr && fr.length) { fr[0].n -= 1; if (fr[0].n <= 0) fr.shift(); if (!fr.length) delete b.fresh[x.id]; }
            s.food = Math.min(100, s.food + pieceValue(x.id));
        }
        while (s.water < 50 && (b.bowlWater || 0) >= 1) { b.bowlWater -= 1; s.water = Math.min(100, s.water + CARE.waterPortion); }
    }
    function pourWater(b) {
        const Fm = F(), max = ((Fm.BUILDINGS[b.type] || {}).bowl) || 3;
        if ((b.bowlWater || 0) >= max) { popNeed(TX.bowlFull, 391); return false; }
        if (!takeWater()) return false;
        b.bowlWater = (b.bowlWater || 0) + 1;
        T.audio.se("Water1", { volume: 70, pitch: 110 });
        T.popup(Watki.wstaw(TK.kod.pourWater[0], { bowlWater: b.bowlWater, max: max }), { icon: 391, color: "#9fd4ff" });
        return true;
    }
    function takeWater() {
        const Fm = F();
        if (Fm && Fm.bagWater && Fm.bagWater() >= 1) { Fm.setBagWater(Fm.bagWater() - 1); return true; }
        const N = T.api("Needs");
        if (N && N.skinCharges && N.skinCharges() >= 1) { N.state().skin = N.skinCharges() - 1; return true; }
        popNeed(TX.noWater, 391);
        return false;
    }
    // water from the hand (no nest near): straight into its crop
    function giveWater() {
        if (!takeWater()) return false;
        const s = S();
        s.water = Math.min(100, s.water + CARE.waterPortion);
        T.audio.se("Water1", { volume: 70, pitch: 120 });
        pop(TK.kod.giveWater[0], { color: "#9fd4ff" });
        return true;
    }

    // ------------------------------------------------------------------
    // The menus: at the eagle (OK facing it, or L), at its nest (Farming's hook), the egg in the basket
    // ------------------------------------------------------------------
    function statusNote() {
        const s = S();
        if (s.stage === 0) return fill(TX.statusEgg, { h: Math.floor(s.egg.warm), n: ST[0].warmHours, gdzie: s.egg.where === "basket" ? TK.kod.statusNote[0] : TK.kod.statusNote[1] });
        const next = s.stage < 5 ? Watki.wstaw(TK.kod.statusNote[2], { "1": D.STAGE_AT[s.stage + 1] - s.care }) : "";
        return fill(TX.status, { hp: Math.round(s.hp), mhp: maxHp(), st: Math.round(s.st), mst: maxSt(), f: Math.round(s.food), w: Math.round(s.water),
            b: Math.round(s.bond), etap: stageDef().name, dni: next });
    }
    function openMenu() {
        const s = S(), sc = SceneManager._scene;
        if (!sc || !sc.openFarmMenu || !s.have) return;
        if (eagle && eagle.pose && eagle.pose.kind === "sleep") { eagle.awake = true; standUp(eagle); }   // (his touch wakes it)
        const icon = D.ICON.orzel, meat = bestMeat(), h = home();
        const L = T.api("Orzel_Lot");
        const entries = [
            { name: TX.mPet, icon, help: TX.hPet, run: petIt },
            { name: TX.mFeed, icon: meat ? item(meat).iconIndex : icon, right: meat ? item(meat).name : "", enabled: !!meat, help: meat ? TX.hFeed : fill(TX.noMeat, V()), run: () => feed(meat) },
            { name: TX.mWater, icon: 391, help: TX.hWater, run: giveWater },
            { name: TX.mFollow, icon, enabled: s.mode !== "follow", help: TX.hFollow, run: () => setMode("follow") },
            { name: TX.mStay, icon, enabled: s.mode !== "stay", help: TX.hStay, run: () => setMode("stay") },
            { name: TX.mHome, icon, enabled: !!h && s.mode !== "home", help: h ? TX.hHome : fill(TX.noNest, V()), run: () => setMode("home") }
        ];
        if (s.stage >= 3 && (window.$gameSystem && $gameSystem._combatMode)) entries.push({ name: TX.mAttack, icon, help: TX.hAttack, run: orderAttack });
        if (s.stage >= 4 && L) entries.push({ name: TX.mFly, icon, help: TX.hFly, enabled: !L.why(), right: L.why() || "", run: () => L.mount() });
        sc.openFarmMenu(fill(TX.menuTitle, V()), entries, undefined, undefined, undefined, undefined, statusNote());
    }
    function petIt() {
        const s = S();
        s.seenDay = day();
        if (clock() - s.petAt >= CARE.petCooldown) { s.petAt = clock(); addBond(CARE.bond.pet); pop(pick(TX.pet), { color: "#f3e0a0" }); }
        else pop(TX.petAgain);
        if (eagle) eagle.dir = DIR8(Math.atan2(heroPoint().y - eagle.y, heroPoint().x - eagle.x));
    }
    function setMode(mode) {
        const s = S(), h = home();
        if (mode === "home" && !h) { popNeed(TX.noNest); return; }
        if (s.bond < CARE.bond.obey && mode !== "home") { pop(TX.bondLow, { vars: { b: s.bond, n: CARE.bond.obey } }); }
        s.mode = mode;
        if (eagle) { eagle.perched = null; eagle.target = null; if (eagle.state === "rest") eagle.state = "stand"; }
        pop(mode === "follow" ? TX.follow : mode === "stay" ? TX.stay : TX.home);
        if (mode === "home" && h && h.map !== $gameMap.mapId() && eagle) { s.map = h.map; const p = nestPoint(h); s.x = p.x; s.y = p.y; sendOff(); }
        if (mode === "stay" && eagle) { s.x = eagle.x; s.y = eagle.y; }
    }
    function orderAttack() {
        const t = softTarget();
        if (t && foeOk(t)) { ordered = t; if (eagle) eagle.foe = t; return; }
        ordered = eagle ? pickFoe(eagle) : null;
    }
    // L on the map: the menu (it is here) / mounting or landing (Orzel_Lot) / calling it
    function callKey() {
        const s = S(), L = T.api("Orzel_Lot");
        if (!s.have) return false;
        if (L && L.flying && L.flying()) { L.tryLand(); return true; }
        if (s.stage === 0) { openEggMenu(); return true; }
        if (s.away) {
            if (clock() < s.away.back) { pop(TX.callTooSoon, { vars: { d: Math.max(1, Math.ceil((s.away.back - clock()) / 24 - 0.01)) } }); return true; }
            if (!outdoors()) { pop(TX.outside); return true; }
            callBack(false);
            return true;
        }
        if (s.theft && (s.theft.state === "camp" || s.theft.state === "taken")) { pop(TK.kod.callKey[0]); return true; }
        if (s.hurtUntil && clock() < s.hurtUntil) { pop(TX.hurt); return true; }
        if (eagle && Math.hypot(eagle.x - heroPoint().x, eagle.y - heroPoint().y) < 10) { openMenu(); return true; }
        // not here: the flyers come, the walkers wait where they are
        if (s.stage >= 4 && outdoors() && !underground()) { s.mode = "follow"; s.map = $gameMap.mapId(); removeEagle(); spawnHere({ near: true, flyIn: true }); pop(TX.followAir); return true; }
        if (s.map === $gameMap.mapId() && eagle) { openMenu(); return true; }
        pop(TK.kod.callKey[1]);
        return true;
    }
    function openEggMenu() {
        const s = S(), sc = SceneManager._scene;
        if (!sc || !sc.openFarmMenu) return;
        sc.openFarmMenu(TX.menuEgg, [{ name: Watki.wstaw(TK.kod.openEggMenu[0], { "1": Math.floor(s.egg.warm), warmHours: ST[0].warmHours }), icon: D.ICON.jajo, enabled: false,
            help: TK.kod.openEggMenu[1] }], undefined, undefined, undefined, undefined, statusNote());
    }
    if (!Input.keyMapper[D.KEY]) Input.keyMapper[D.KEY] = "eagle";
    const CALM_MENU = { only: ["onMap", "event", "farmMenu"] };
    T.onMapUpdate(scene => {
        if (!has() || !Input.isTriggered("eagle") || !T.isCalm(scene, CALM_MENU)) return;
        callKey();
    }, { owner: PLUGIN, name: "key" });
    function eagleAhead() {
        if (!eagle || eagle.z > 20 || eagle.ridden) return false;
        const p = $gamePlayer, dir = p.direction(), r = 0.7 + (stageDef().tiles || 1) * 0.45;
        const fx = p._realX + 0.5 + (dir === 4 ? -1 : dir === 6 ? 1 : 0), fy = p._realY + 0.9 + (dir === 8 ? -1 : dir === 2 ? 1 : 0);
        return Math.hypot(eagle.x - fx, eagle.y - 0.3 - fy) < r;
    }
    const _triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && has() && S().have && eagleAhead() && T.isCalm(SceneManager._scene, CALM_MENU)) { openMenu(); return true; }
        return _triggerButtonAction.call(this);
    };
    // the nest's own lines (Farming's building menu): the egg in / out of the basket, the bowl's water, the eagle's menu
    if (window.Farming && Farming.addMenuHook) Farming.addMenuHook((b, def, entries) => {
        if (!b || !NEST_TYPES.includes(b.type) || b.site) return null;
        const s = S(), max = def.bowl || 3, at = Math.max(0, entries.findIndex(e => e.name === def.openName) + 1), add = [];
        if (b.type === "orzel_kosz" && s.have && s.stage === 0) {
            if (s.egg.where === "basket" && s.egg.basket === b.id) add.push({ name: TX.mEggTake, icon: D.ICON.jajo, help: TK.kod.glowna[0], run: () => eggOut(b) });
            else if (count(D.ITEM.jajo) > 0) add.push({ name: TX.mEggPut, icon: D.ICON.jajo, help: TK.kod.glowna[1], run: () => eggIn(b) });
        }
        const haveWater = (F().bagWater && F().bagWater() >= 1) || (T.api("Needs") && T.api("Needs").skinCharges && T.api("Needs").skinCharges() >= 1);
        add.push({ name: TK.kod.glowna[2], icon: 391, right: (b.bowlWater || 0) + "/" + max, enabled: (b.bowlWater || 0) < max && !!haveWater,
            help: TK.kod.glowna[3], run: () => pourWater(b) });
        if (s.have && s.stage >= 1) add.push({ name: fill(TX.menuTitle, V()), icon: D.ICON.orzel, help: TK.kod.glowna[4], run: openMenu });
        // the nest's upgrade to the perch: only once brother Kleofas told how (W13 ch. 3 - flag orzelKroniki)
        if (b.type === "orzel_gniazdo" && def.upgrade && !flag(def.upgrade.needFlag || "orzelKroniki")) {
            const ui = entries.findIndex(e => e.name === def.upgrade.name);
            if (ui >= 0) entries.splice(ui, 1);
        }
        entries.splice(at, 0, ...add);
        if (b.type === "orzel_kosz" && s.stage === 0) return s.egg.where === "basket" && s.egg.basket === b.id ? fill(TX.basketEgg, { h: Math.floor(s.egg.warm), n: ST[0].warmHours }) : TX.basketEmpty;
        const food = bowlOf(b).reduce((t, x) => t + x.n, 0);
        return fill(TX.nestNote, { f: food, w: b.bowlWater || 0, max });
    });
    function eggIn(b) {
        const s = S();
        if (count(D.ITEM.jajo) < 1) { popNeed(TX.noEgg, D.ICON.jajo); return; }
        tickNeeds();
        $gameParty.loseItem(item(D.ITEM.jajo), 1);
        s.egg.where = "basket"; s.egg.basket = b.id;
        T.popup(TK.kod.eggIn[0], { icon: D.ICON.jajo, color: "#f3e0a0" });
    }
    function eggOut(b) {
        const s = S();
        tickNeeds();
        $gameParty.gainItem(item(D.ITEM.jajo), 1);
        s.egg.where = "bag"; s.egg.basket = null;
        T.popup(TK.kod.eggOut[0], { icon: D.ICON.jajo, color: "#f3e0a0" });
    }

    // ------------------------------------------------------------------
    // Following him across the maps (performTransfer): the walkers and the flyers come along where they may; indoors only the small ones
    // ------------------------------------------------------------------
    const _performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        const s = has() ? S() : null, from = $gameMap ? $gameMap.mapId() : 0;
        const along = this.isTransferring() && s && s.have && s.stage >= 1 && s.mode === "follow" && !s.away && !s.hurtUntil && s.map === from && !(eagle && eagle.ridden)
            && !(s.theft && (s.theft.state === "camp" || s.theft.state === "taken"));
        _performTransfer.call(this);
        if (!along) return;
        const to = $gameMap.mapId();
        if (to === from) return;
        // (the map's data is there now: may it come in here)
        if (!mapAllows()) return;   // it waits on the map it was on
        s.map = to; s.x = -1; s.y = -1;
        removeEagle();
        s.cameIn = Graphics.frameCount;
    };

    // ------------------------------------------------------------------
    // The pictures: a holder at its foot point in the tilemap (the sort), the frame in it at -z, its shadow, the bars
    // ------------------------------------------------------------------
    let sheetsLoaded = {};
    const sheetOf = st => { const sh = D.SHEETS[st]; if (!sh) return null; return sheetsLoaded[sh.file] || (sheetsLoaded[sh.file] = ImageManager.loadSystem(sh.file)); };
    const airOf = st => { const a = D.AIR[st]; if (!a) return null; return sheetsLoaded[a.file] || (sheetsLoaded[a.file] = ImageManager.loadSystem(a.file)); };
    const poseSheetOf = P => sheetsLoaded[P.file] || (sheetsLoaded[P.file] = ImageManager.loadSystem(P.file));
    function tilemap() {
        const sc = SceneManager._scene;
        return sc instanceof Scene_Map && sc._spriteset ? sc._spriteset._tilemap : null;
    }
    let shadowBmp = null;
    function shadowBitmap() {
        if (shadowBmp) return shadowBmp;
        shadowBmp = new Bitmap(64, 20);
        const g = shadowBmp.context.createRadialGradient(32, 10, 2, 32, 10, 30);
        g.addColorStop(0, "rgba(0,0,0,0.42)"); g.addColorStop(1, "rgba(0,0,0,0)");
        shadowBmp.context.fillStyle = g;
        shadowBmp.context.save(); shadowBmp.context.scale(1, 0.33); shadowBmp.context.fillRect(0, 0, 64, 60); shadowBmp.context.restore();
        shadowBmp._baseTexture.update();
        return shadowBmp;
    }
    function ensureSprites(e) {
        const tm = tilemap();
        if (!tm) return false;
        if (e.holder && e.holder.parent === tm) return true;
        dropSprites(e);
        const holder = new Sprite(), body = new Sprite(), sh = new Sprite(shadowBitmap()), air = new Sprite(), hud = new Sprite(new Bitmap(60, 14));
        body._character = e;
        body.patternHeight = () => { const s2 = D.SHEETS[S().stage]; return s2 ? s2.feet : 48; };   // (SpeechBubbles: over its head)
        holder.addChild(body);
        holder.addChild(air);
        sh.anchor.set(0.5, 0.5);
        sh.z = 1;
        air.anchor.set(0.5, 0.5);
        hud.anchor.set(0.5, 1);
        hud.z = 9;
        tm.addChild(sh);
        tm.addChild(holder);
        tm.addChild(hud);
        e.holder = holder; e.body = body; e.shadow = sh; e.air = air; e.hud = hud; e._sprite = body;
        e.airShadow = new Sprite();
        e.airShadow.anchor.set(0.5, 0.5);
        e.airShadow.z = 1.8;
        e.airShadow.tint = 0x000000;
        tm.addChild(e.airShadow);
        e.stageDrawn = -1;
        return true;
    }
    // the flight shadow's layer: in the tilemap (low, sorted with the trees) or in the spriteset just under the clouds' shadows (high)
    function shadowHost(as, high) {
        const tm = tilemap(), set = tm && SceneManager._scene._spriteset;
        if (!tm || !set) return;
        if (high) {
            if (as.parent === set) return;
            if (as.parent) as.parent.removeChild(as);
            const c = set._cloudSprites && set._cloudSprites[0], i = c ? set.children.indexOf(c) : -1;
            if (i >= 0) set.addChildAt(as, i); else set.addChild(as);
        } else if (as.parent !== tm) {
            if (as.parent) as.parent.removeChild(as);
            tm.addChild(as);
        }
    }
    function dropSprites(e) {
        for (const k of ["holder", "shadow", "hud", "airShadow", "bars", "rim"]) { const sp = e[k]; if (sp && sp.parent) sp.parent.removeChild(sp); }
        e.holder = e.body = e.shadow = e.hud = e.air = e.airShadow = e._sprite = e.bars = e.rim = null;
    }
    function dropRim(e) { if (e && e.rim) { if (e.rim.parent) e.rim.parent.removeChild(e.rim); e.rim = null; } }
    // the nest's picture on the screen: where Farming_Render puts it (the footprint's bottom-middle, the picture's anchor; mirrored when
    // it was put down mirrored)
    function nestScreen(n) {
        const def = F().geoOf(n.b), tw = TILE(), th = $gameMap.tileHeight();
        return { x: Math.round(($gameMap.adjustX(n.b.x) + (def.w || 1) / 2) * tw), y: Math.round(($gameMap.adjustY(n.b.y) + 1) * th) - 1, flip: !!def.flipped };
    }
    // in the bowl: sorted right after the nest's picture (the nest under it) and before its front rim, drawn again over it - the lip
    // covers its feet and belly (like the cage's bars, drawCaged)
    function drawNested(e, n, cfg) {
        const tm = tilemap(), sp = nestScreen(n), st = S().stage;
        e.holder.x = sp.x + (sp.flip ? -cfg.cx : cfg.cx);
        e.holder.y = sp.y + 1;
        e.body.y = (sp.y - cfg.lip + (cfg.sink[st] || 0)) - e.holder.y;   // (no cut: the front layer's lip and side walls hide its lower part)
        if (!tm) return;
        if (!e.rim || e.rim.parent !== tm) {
            dropRim(e);
            e.rim = new Sprite();
            e.rim.addChild(new Sprite());
            e.rim.z = 3;
            tm.addChild(e.rim);
        }
        const inner = e.rim.children[0], bmp = ImageManager.loadSystem(cfg.rim);
        if (inner.bitmap !== bmp) inner.bitmap = bmp;
        inner.anchor.set(0.5, 1);
        inner.scale.x = sp.flip ? -1 : 1;
        inner.y = -2;
        e.rim.x = sp.x; e.rim.y = sp.y + 2;
        e.rim.visible = true;
    }
    // in the hunters' cage (W13 ch. 5): it sits in front of the cage's back and the cage's bars are drawn again over it, half see-through -
    // the cage's picture is too dense to see a bird behind it
    function drawCaged(e, gx, gy) {
        const tm = tilemap(), sc = SceneManager._scene, cage = $gameMap.event(516);
        const cs = cage && sc && sc._spriteset ? sc._spriteset._characterSprites.find(sp => sp._character === cage) : null;
        e.holder.y = gy + 9;
        e.body.y = -9;
        if (!cs || !cs.bitmap || !tm) return;
        if (!e.bars || e.bars.parent !== tm) {
            if (e.bars && e.bars.parent) e.bars.parent.removeChild(e.bars);
            e.bars = new Sprite();
            e.bars.addChild(new Sprite());
            e.bars.z = 3;
            tm.addChild(e.bars);
        }
        const inner = e.bars.children[0];
        e.bars.x = cs.x; e.bars.y = gy + 10;
        if (inner.bitmap !== cs.bitmap) inner.bitmap = cs.bitmap;
        inner.setFrame(cs._frame.x, cs._frame.y, cs._frame.width, cs._frame.height);
        inner.anchor.set(0.5, 1);
        inner.y = cs.y - e.bars.y;
        inner.alpha = 0.6;
        e.bars.visible = cs.visible;
    }
    // the frame of the ground sheet: [col, row]
    function groundFrame(e) {
        const sh = D.SHEETS[S().stage];
        if (!sh) return [0, 0];
        const row = D.ROWS[e.dir] || 0;
        if (e.anim && e.anim.kind === "atk" && sh.atk) return [sh.atk[0] + Math.min(sh.atk[1] - 1, e.anim.i), row];
        if ((e.state === "fly" || e.state === "hop") && sh.flap && e.z > 0) return [sh.flap[0] + Math.floor(e.flapT / 4) % sh.flap[1], row];
        if (e.state === "walk" && sh.walk) { const n = sh.walk[1], stride = Math.max(0.5, (S().stage >= 4 ? 1.2 : 0.7)); return [sh.walk[0] + Math.floor((e.walkStep / stride) * n) % n, row]; }
        return [0, row];
    }
    function airFrame(e) {
        const a = D.AIR[S().stage];
        if (!a) return 0;
        if (e.diving) return a.dive;
        const cyc = a.cycle || [0];
        // going with him up high (its shadow): like a real eagle - long glides on spread wings, now and then a few slow wingbeats
        // (beatLeft: beats still to make - climbing it beats hard, coming down it brakes)
        if (!e.ridden && e.overhead) {
            if (e.beatLeft > 0) {
                const f = cyc[Math.floor((e.beatT || 0) / 5) % cyc.length];
                e.beatT = (e.beatT || 0) + 1;
                if (e.beatT >= cyc.length * 5) { e.beatT = 0; e.beatLeft--; }
                return f;
            }
            if (e.glideT === undefined || --e.glideT <= 0) { e.glideT = 200 + Math.floor(Math.random() * 260); e.beatLeft = Math.random() < 0.4 ? 2 : 1; e.beatT = 0; }
            return a.glide;
        }
        const glide = e.ridden ? !!e.glideNow : e.target && !e.target.land && Math.floor(e.t / 200) % 3 === 2;
        if (glide) return a.glide;
        return cyc[Math.floor(e.flapT / 5) % cyc.length];
    }
    function drawEagle(e) {
        if (!ensureSprites(e)) return;
        const s = S(), st = s.stage, tw = TILE(), th = $gameMap.tileHeight();
        const gx = Math.round($gameMap.adjustX(e.x) * tw), gy = Math.round($gameMap.adjustY(e.y) * th);
        const sh = D.SHEETS[st], air = D.AIR[st], body = e.body, hold = e.holder, inv = e.ridden ? 1 / T.view.scale() : 1;
        hold.x = gx; hold.y = gy;
        const flying = e.z > 6 && air && (e.state === "fly" || e.ridden);
        body.visible = !flying && !!sh;
        e.air.visible = !!flying && !(e.overhead && !e.ridden);   // (going with him through the air: only its shadow - the wings are the ride's)
        if (body.visible) { body.alpha = e.appear > 0 ? 1 - e.appear / 14 : 1; if (e.appear > 0) e.appear--; }
        const P = e.pose && !flying && !(e.anim && e.anim.kind === "atk") ? poseOf() : null, posed = !!(P && P[e.pose.kind]);
        if (body.visible) {
            const bmp = posed ? poseSheetOf(P) : sheetOf(st);
            if (body.bitmap !== bmp) body.bitmap = bmp;
            if (posed) {
                body.setFrame(poseCell(e, P) * P.cell, 0, P.cell, P.cell);
                body.anchor.set(0.5, P.feet / P.cell);
            } else {
                const [c, r] = groundFrame(e);
                body.setFrame(c * sh.cell, r * sh.cell, sh.cell, sh.cell);
                body.anchor.set(0.5, sh.feet / sh.cell);
            }
            body.y = -Math.round(e.z);
            body.x = 0;
            // the breath: a big bird standing heaves a little; asleep slower and deeper, lying hurt weak
            const k = !posed ? 0.012 * Math.sin(e.t / 30) : e.pose.kind === "sleep" ? 0.02 * Math.sin(e.t / 55) : e.pose.kind === "hurt" ? 0.01 * Math.sin(e.t / 70) : 0.012 * Math.sin(e.t / 34);
            const breathe = (!posed && (e.state === "stand" || e.state === "rest")) || (posed && posedStill(e)) ? 1 + k : 1;
            body.scale.set(inv, inv * breathe);
            if (e.state === "rest" && !posed) body.scale.y *= 0.94;
        }
        if (flying) {
            const bmp = airOf(st);
            if (e.air.bitmap !== bmp) e.air.bitmap = bmp;
            const f = airFrame(e);
            e.air.setFrame(f * air.cell, 0, air.cell, air.cell);
            e.air.rotation = e.angle + Math.PI / 2;
            e.air.y = -Math.round(e.z);
            e.air.scale.set(inv * (air.scale || 1), inv * (air.scale || 1));   // (the fourth stage: a smaller bird)
        }
        hold.z = flying ? 9 : e.z > 20 ? 6 : 3;
        hold.scale.set(1, 1);
        // struck: a red flash a moment (a blow, an arrow)
        const hc = e.hitT > 0 ? [255, 60, 40, Math.round(160 * e.hitT / 12)] : null;
        if (hc || e.hitShown) { body.setBlendColor(hc || [0, 0, 0, 0]); e.air.setBlendColor(hc || [0, 0, 0, 0]); e.hitShown = !!hc; }
        if (e.hitT > 0) e.hitT--;
        // in its nest's bowl (the nest on this map, the stage that fits it)
        const pn = e.perched && e.inNest && !flying && e.z === 0 ? nests().find(x => x.b.id === e.perched && x.map === $gameMap.mapId()) : null;
        const cfgN = pn ? nestSeat(pn) : null;
        if (cfgN && body.visible) drawNested(e, pn, cfgN);
        else dropRim(e);
        e.nested = !!(cfgN && body.visible);
        if (e.caged) drawCaged(e, gx, gy);
        else if (e.bars) { if (e.bars.parent) e.bars.parent.removeChild(e.bars); e.bars = null; }
        // the shadow: an ellipse under its feet on the ground; in the air the silhouette, offset by the sun and the height
        const sw = sh ? Math.max(20, (stageDef().tiles || 1) * 34) : 20;
        // (going up / coming down with him: the round shadow under it melts into the flying shape near the ground - FORM 0..1)
        const lowAir = !!flying && e.overhead && !e.ridden && e.z < FORM_Z;
        e.shadow.visible = ((!flying && body.visible) || lowAir) && !e.nested;   // (in the nest: the nest's own shadow)
        e.shadow.alpha = lowAir ? 1 - e.z / FORM_Z : 1;
        e.shadow.x = gx; e.shadow.y = gy - 2;
        e.shadow.scale.set(sw / 64 * inv, sw / 64 * 0.9 * inv);
        const as = e.airShadow;
        as.visible = !!flying;
        if (flying) {
            const sun = T.call("Sun", "now");
            const sx = sun && sun.light > 0 ? sun.dx : 0.15, sy = sun && sun.light > 0 ? sun.dy : 1;
            const off = Math.min(220, e.z * 0.55);
            as.bitmap = e.air.bitmap;
            as.setFrame(e.air._frame.x, e.air._frame.y, e.air._frame.width, e.air._frame.height);
            as.rotation = e.air.rotation;
            as.x = gx + sx * off * 0.45;
            as.y = gy + sy * off * 0.2;
            // (its own size in the world - drawn far out it looks small: far below; going with him: big under it near the ground, smaller
            // the higher it is)
            const k = e.ridden ? 1 : e.overhead ? 1 - 0.35 * clamp((e.z - 20) / (OVER_Z - 20), 0, 1) : 0.85;
            as.scale.set(k * (air.scale || 1), k * 0.92 * (air.scale || 1));
            // high up (over him on foot's way, or ridden): the shadow falls on the treetops too (out of the tilemap's sort, put with the
            // clouds' shadows over the whole map) - over the woods it is all that is seen of it
            const high = (e.overhead || e.ridden) && e.z > 70;
            shadowHost(as, high);
            as.z = high ? 8.4 : 1.8;
            as.alpha = e.overhead && !e.ridden ? 0.48 * clamp(e.z / (FORM_Z / 2), 0, 1) * (night() ? 0.45 : 1)
                : clamp(0.32 - e.z / 1400, 0.12, 0.32) * (night() ? 0.3 : 1);
        }
        // the bars (life, wing strength) - only when hurt or tired or fighting
        const show = st >= 3 && (s.hp < maxHp() * 0.99 || s.st < maxSt() * 0.99 || e.foe) && !e.ridden;
        e.hud.visible = show && body.visible;
        if (e.hud.visible) {
            const key = Math.round(s.hp) + "," + Math.round(s.st);
            if (e.hudKey !== key) {
                e.hudKey = key;
                const bm = e.hud.bitmap;
                bm.clear();
                const bar = (y, r, c) => { bm.fillRect(4, y, 52, 4, "#16181c"); bm.fillRect(4, y, Math.round(52 * clamp(r, 0, 1)), 4, c); };
                bar(2, s.hp / maxHp(), "#d9463d");
                bar(8, maxSt() ? s.st / maxSt() : 0, "#e8eef8");
            }
            e.hud.x = gx;
            e.hud.y = gy - (sh ? sh.feet : 40) - 6 - e.z;
        }
    }
    let dustBmp = null, ringBmp = null;
    function dustBitmap() {
        if (dustBmp) return dustBmp;
        dustBmp = new Bitmap(48, 48);
        const c = dustBmp.context, g = c.createRadialGradient(24, 24, 2, 24, 24, 23);
        g.addColorStop(0, "rgba(238,228,204,0.95)"); g.addColorStop(0.55, "rgba(220,208,178,0.6)"); g.addColorStop(1, "rgba(200,190,160,0)");
        c.fillStyle = g; c.fillRect(0, 0, 48, 48);
        dustBmp._baseTexture.update();
        return dustBmp;
    }
    function ringBitmap() {
        if (ringBmp) return ringBmp;
        ringBmp = new Bitmap(128, 128);
        const c = ringBmp.context;
        c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 5; c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = "rgba(255,255,255,0.22)"; c.lineWidth = 3; c.beginPath(); c.arc(64, 64, 50, 0, Math.PI * 2); c.stroke();
        ringBmp._baseTexture.update();
        return ringBmp;
    }
    let puffTm = null;
    function drawPuffs() {
        const tm = tilemap();
        if (!tm) { puffs = []; return; }
        if (tm !== puffTm) { puffTm = tm; puffs = []; }   // (another map / a new scene: the old dust went with its sprites)
        for (const p of puffs) {
            const life = p.life || 30;
            if (!p.s) {
                p.s = new Sprite(p.ring ? ringBitmap() : p.dust ? dustBitmap() : shadowBitmap());
                p.s.anchor.set(0.5, 0.5);
                p.s.z = p.ring ? 1.5 : 4;
                tm.addChild(p.s);
            }
            p.t++;
            if (p.vx) { p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; }
            p.s.x = Math.round($gameMap.adjustX(p.x) * TILE());
            p.s.y = Math.round($gameMap.adjustY(p.y) * $gameMap.tileHeight()) - (p.ring ? 0 : p.t * (p.vx !== undefined ? 0.35 : 0.6));
            const f = p.t / life;
            if (p.ring) { const r = (0.3 + f * 1.2) * p.k; p.s.scale.set(r, r * 0.45); p.s.alpha = Math.max(0, 0.9 * (1 - f)); }
            else { const r = p.k * (0.6 + f * 0.9); p.s.scale.set(r, r * 0.8); p.s.alpha = Math.max(0, 0.95 * (1 - f * f)); }
        }
        for (const p of puffs) if (p.t > (p.life || 30) && p.s && p.s.parent) p.s.parent.removeChild(p.s);
        puffs = puffs.filter(p => p.t <= (p.life || 30));
    }

    // ------------------------------------------------------------------
    // The egg and the ridge (Map175): the egg in the broken nest after a storm in Act II, the mother, the arrows, the bowl, the carving,
    // the cold camp - events put into the map's data as it loads (Tawerna.inject 510-529); the way up on Map013 (500-509)
    // ------------------------------------------------------------------
    const BLANK_COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1,
        switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function page(list, opts) {
        const o = opts || {};
        return { conditions: Object.assign({}, BLANK_COND), directionFix: !!o.dirFix, image: { tileId: 0, characterName: o.pic || "", direction: o.dir || 2, pattern: o.pattern || 0, characterIndex: 0 },
            list: list.concat([{ code: 0, indent: 0, parameters: [] }]), moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
            moveSpeed: 3, moveType: 0, priorityType: o.priority === undefined ? 1 : o.priority, stepAnime: false, through: !!o.through, trigger: o.trigger === undefined ? 0 : o.trigger, walkAnime: false };
    }
    const script = code => ({ code: 355, indent: 0, parameters: [code] });
    function ev(id, name, x, y, pages, note) { return { id, name, note: note || "", pages, x, y }; }
    const eggReady = () => (actTwo() && S().stormAfterAct2 > 0) || !!(S().flags && S().flags.f9Egg);
    // the way up on the mountains' map (the user's Map013 stays as it is: put in as it loads)
    T.inject(D.GORY, { ids: [500, 509], owner: PLUGIN, build(data) {
        const out = [];
        D.WAY_UP.cells.forEach(([x, y], k) => {
            if (x >= data.width || y >= data.height) return;
            out.push(ev(500 + k, TK.kod.build[0], x, y, [page([script("Orzel.wayUp()")], { priority: 1, trigger: 0 })], "<Orzel:wspinaczka>"));
        });
        return out;
    } });
    // the ridge's things (the map file has the tiles; these follow the story)
    T.inject(D.MAP, { ids: [510, 529], owner: PLUGIN, build(data) {
        const marker = key => { const e = (data.events || []).find(v => v && v.name === "Miejsce: " + key); return e ? [e.x, e.y] : null; };
        const out = [], at = (key, id, name, list, o) => { const m = marker(key); if (m) out.push(ev(id, name, m[0], m[1], [page(list, o)], (o && o.note) || "")); };
        // (the pictures: img/characters/!$Orzel_*.png - tools/orzel/props.py; the nest's row 2 with the egg, row 4 empty; the cage's row 2
        // shut, row 4 open)
        const s = S(), egg = eggReady() && !s.have && !(s.flags && s.flags.eggTaken);
        const caged = !!(s.theft && s.theft.state === "camp");
        at("orzel_jajo", 510, TK.kod.build[1], [script("Orzel.look('gniazdo')")], { priority: 1, pic: "!$Orzel_Gniazdo", dir: egg ? 2 : 4, note: "<Occupy:left=1,right=1>" });
        at("orzel_orlica", 511, TK.kod.build[2], [script("Orzel.look('orlica')")], { priority: 1, pic: "!$Orzel_Orlica", note: "<Occupy:left=1,right=1>" });
        at("orzel_strzaly", 512, TK.kod.build[3], [script("Orzel.look('strzaly')")], { priority: 0, pic: "!$Orzel_Strzaly" });
        at("orzel_misa", 513, TK.kod.build[4], [script("Orzel.look('misa')")], { priority: 1, pic: "!$Orzel_Misa", note: "<Occupy:left=1>" });
        at("orzel_plyta", 514, TK.kod.build[5], [script("Orzel.look('plyta')")], { priority: 1 });
        at("orzel_oboz", 515, TK.kod.build[6], [script("Orzel.look('oboz')")], { priority: 0 });
        at("orzel_klatka", 516, "Klatka", [script("Orzel.look('klatka')")], { priority: 1, pic: "!$Orzel_Klatka", dir: caged ? 2 : 4, note: "<Occupy:left=1>" });
        D.WAY_DOWN.cells.forEach(([x, y], k) => {
            if (x >= data.width || y >= data.height) return;
            out.push(ev(520 + k, TK.kod.build[7], x, y, [page([{ code: 201, indent: 0, parameters: [0, D.WAY_DOWN.to, D.WAY_DOWN.land[0] + k % 2, D.WAY_DOWN.land[1], D.WAY_DOWN.dir, 0] }],
                { priority: 0, trigger: 1 })], "<Orzel:zejscie>"));
        });
        return out;
    } });
    function wayUp() {
        if (!actTwo() && !S().have && !isActive("D29") && !eggReady()) { T.popup(TX.wayUpLocked, { color: "info" }); return; }
        T.audio.se("Equip1", { volume: 60, pitch: 80 });
        $gamePlayer.reserveTransfer(D.MAP, D.WAY_UP.land[0], D.WAY_UP.land[1], D.WAY_UP.dir, 0);
    }
    function look(what) {
        const s = S(), say = lines => { for (const l of lines) T.popup(l.replace(/^> /, ""), { color: "info" }); };
        try {
            if (what === "gniazdo") {
                if (!eggReady() && !s.have) { say(TX.noEggYet); return; }
                if (s.have || s.flags.eggTaken) { T.popup(TK.kod.look[0], { color: "info" }); return; }
                say(TX.eggTake);
                $gameParty.gainItem(item(D.ITEM.jajo), 1);
                s.have = true; s.stage = 0; s.flags.eggTaken = day();
                s.egg = { warm: 0, cold: 0, where: "bag", basket: null, knock: false };
                s.clock = clock();
                T.popup(TX.eggTaken, { icon: D.ICON.jajo, color: "#ffe27a", top: true });
                const nestEv = $gameMap.event(510);
                if (nestEv) nestEv.setDirection(4);
                setFlag("orzelJajo");
                const q = TQ();
                if (q && !rec("D29") && q.start) q.start("D29", 0, true);
                autoChecks();
            } else if (what === "orlica") say(TX.mother);
            else if (what === "strzaly") say(TX.arrows);
            else if (what === "misa") say(TX.bowl);
            else if (what === "plyta") say(TX.carving);
            else if (what === "oboz") say(TX.camp);
            else if (what === "klatka") theftCage();
        } catch (e) { console.error("[Orzel] look " + what, e); }
    }

    // ------------------------------------------------------------------
    // The theft (W13 ch. 5): one night, the eagle (stage 3-4) at its nest, the Black Eyes' hunters come with a net. He is near and awake:
    // a fight at the nest. Away or asleep: it is taken to their camp on the ridge (a cage, two of them on guard) - fetched back there.
    // ------------------------------------------------------------------
    // asleep: any hour of the night (they come while he sleeps); awake: deep in the night only (23-4)
    function theftCheck(asleep) {
        const s = S();
        if (!s.have || s.stage < 3 || s.stage > 4 || s.theft || s.away || s.hurtUntil) return;
        if (!isActive("W13") || !rec("W13") || rec("W13").step !== 4) return;
        const h = home();
        if (!h) return;
        // (at its nest: sent home, or asleep on the nest's map - when it follows him, he sleeps there too)
        if (!(s.mode === "home" || (asleep && s.map === h.map))) return;
        if (!night() || (!asleep && hour() < 23 && hour() >= 4)) return;
        s.theft = { state: "plan", night: day(), asleep: !!asleep };
    }
    function theftNight() {
        const s = S(), t = s.theft, h = home();
        if (!t || t.state !== "plan") return;
        if (!night()) return;
        if (h && h.map === $gameMap.mapId() && !$gameParty.inBattle() && Math.hypot($gamePlayer.x - h.b.x, $gamePlayer.y - h.b.y) < 14) {
            // he is here: a fight at the nest
            const Hm = HM();
            t.state = "fight";
            pop(TX.theftWarn, { color: "#ffd0a0", top: true });
            if (Hm && Hm.ambush) Hm.ambush(["bandit", "knifer"], { tag: "orzelZlodzieje", far: [4, 8] });
            t.at = Graphics.frameCount;
            return;
        }
        // he is not: it is gone in the morning
        t.state = "taken";
    }
    function theftFightCheck() {
        const s = S(), t = s.theft, Hm = HM();
        if (!t || t.state !== "fight" || !Hm) return;
        const live = Hm.list.filter(h => h._tag === "orzelZlodzieje" && !h._dead && !h._surrendered && h._mode !== "flee");
        if (live.length === 0 && Graphics.frameCount - (t.at || 0) > 120) { t.state = "saved"; pop(TX.theftSaved, { color: "#9ff0a8", top: true }); setFlag("orzelObroniony"); autoChecks(); }
    }
    function theftMorning() {
        const s = S(), t = s.theft;
        if (!t) return;
        if ((t.state === "taken" || t.state === "plan") && !night()) {
            t.state = "camp";
            for (const l of TX.theftDone) T.popup(l, { color: "#ffd0a0", top: true });
            note("Porwany", TK.kod.theftMorning[0]);
            removeEagle();
            autoChecks();
        }
    }
    function theftCage() {
        const s = S(), t = s.theft, Hm = HM();
        if (!t || t.state !== "camp") { T.popup(TK.kod.theftCage[0], { color: "info" }); return; }
        const guards = Hm ? Hm.list.filter(h => h._tag === "orzelStraz" && !h._dead && !h._surrendered && h._mode !== "flee") : [];
        if (guards.length) { T.popup(TK.kod.theftCage[1], { color: "#ffb4a0" }); return; }
        t.state = "freed";
        const cage = $gameMap.event(516);
        if (cage) cage.setDirection(4);
        s.mode = "follow";
        s.map = $gameMap.mapId();
        s.bond = Math.min(100, s.bond + 10);
        removeEagle();
        spawnHere({ near: true });
        pop(TK.kod.theftCage[2], { color: "#9ff0a8", top: true });
        setFlag("orzelUwolniony");
        autoChecks();
    }
    // the camp's guards on the ridge (when it was taken)
    function campGuards() {
        const s = S(), t = s.theft, Hm = HM();
        if (!t || t.state !== "camp" || $gameMap.mapId() !== D.MAP || !Hm || t.guards) return;
        const m = (($dataMap && $dataMap.events) || []).find(v => v && v.name === "Miejsce: orzel_klatka");
        if (!m) return;
        t.guards = true;
        for (const [dx, dy, kind] of [[-2, 1, "bandit"], [2, 1, "archer"]]) {
            if (Hm.spawn) Hm.spawn(kind, m.x + dx, m.y + dy, { tag: "orzelStraz", name: TK.kod.campGuards[0] });   // (2026-10-21: "name" - Humans reads opts.name; "label" showed nothing)
        }
    }

    // ------------------------------------------------------------------
    // D29, W13 - the data's (Orzel_Data.js); what their conditions and words ask of the game
    // ------------------------------------------------------------------
    w.haki({
        jajoGotowe: () => eggReady(),
        // the words of W13's custom steps (rozdz. 1, 4, 5, 7): the egg's warmth, where the glove is, the theft, the first flight
        w13Zmienne: () => {
            const s = S(), t = s.theft;
            const cieplo = Watki.wstaw(TK.kod.vars[0], { "1": Math.floor(s.egg.warm), warmHours: ST[0].warmHours });
            const gdzie = s.stage < 3 ? Watki.wstaw(TK.kod.vars[1], { "1": D.STAGE_AT[3] }) : count(D.ITEM.rekawica) < 1 ? TK.kod.vars[2] : TK.kod.vars[3];
            const kradziez = !t || t.state === "plan" ? TK.kod.vars[4] : t.state === "fight" ? TK.kod.vars[5] :
                t.state === "camp" ? TK.kod.vars[6] : TK.kod.vars[7];
            const lot = s.stage < 4 ? Watki.wstaw(TK.kod.vars[8], { "1": D.STAGE_AT[4] }) : TK.kod.vars[9];
            return { cieplo, gdzie, kradziez, lot, imie: nameOf() };
        }
    });
    // the glove (W13 ch. 4): the podrostek near him with the glove in the bag - it sits on his hand
    function gloveCheck() {
        const s = S();
        if (s.glove || s.stage < 3 || count(D.ITEM.rekawica) < 1 || !eagle || eagle.ridden) return;
        if (Math.hypot(eagle.x - heroPoint().x, eagle.y - heroPoint().y) > 2.5) return;
        s.glove = true;
        addBond(5);
        pop(TK.kod.gloveCheck[0], { color: "#9ff0a8", top: true });
        note(TK.kod.gloveCheck[1], TK.kod.gloveCheck[2]);
        autoChecks();
    }

    // ------------------------------------------------------------------
    // Act III (Act3_Data asks Orzel.defends()), the epilogue (Underground_Data asks Orzel.epilogue(ending))
    // ------------------------------------------------------------------
    function defends() {
        const s = has() ? S() : null;
        return !!(s && s.have && s.stage >= 5 && s.bond >= CARE.bond.ride && !s.away && !s.hurtUntil && !(s.theft && s.theft.state === "camp"));
    }
    function epilogue(ending) {
        const s = has() ? S() : null;
        if (!s || !s.have || s.stage < 1) return "";
        if (s.away) return fill(TX.epilogue.gone, V());
        const E = TX.epilogue;
        return fill((ending && E[ending]) || E.any, V());
    }

    // ------------------------------------------------------------------
    // The bus: storms in Act II (the egg), sleep (the egg warm in the bag), the day
    // ------------------------------------------------------------------
    T.on("stormEnd", () => { if (has() && actTwo() && !S().stormAfterAct2) S().stormAfterAct2 = day(); }, { owner: PLUGIN });
    T.on("dayStart", () => {
        if (!has()) return;
        const s = S();
        if (actTwo() && !s.act2Day) s.act2Day = day();
        if (actTwo() && !s.stormAfterAct2 && s.act2Day && day() - s.act2Day >= 6) s.stormAfterAct2 = day();   // (no storm for six days: the wind did it)
        newDay();
        theftMorning();
    }, { owner: PLUGIN });
    T.on("sleep", () => { if (!has() || !S().have) return; tickNeeds(); S().sleepingWarm = S().stage === 0 && S().egg.where !== "basket" && count(D.ITEM.jajo) > 0; theftCheck(true); }, { owner: PLUGIN });
    T.on("wake", () => { if (!has() || !S().have) return; tickNeeds(); S().sleepingWarm = false; theftNight(); }, { owner: PLUGIN });
    T.on("mapEnter", () => { removeEagle(); }, { owner: PLUGIN });
    T.on("load", () => { removeEagle(); S().sleepingWarm = false; }, { owner: PLUGIN });
    T.on("mapReady", () => { registerBody(); if (has()) campGuards(); }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The map's clock
    // ------------------------------------------------------------------
    let auto = true, slow = 0, failed = 0;
    T.onMapUpdate(scene => {
        if (!has()) return;
        try { frame(scene); }
        catch (e) { if (!failed++) console.warn("[Orzel] wyjątek w zegarze orła: " + (e && e.message), e); removeEagle(); }
    }, { owner: PLUGIN, name: "eagle" });
    function frame(scene) {
        const s = S();
        if (!s.have) { if (eagle) removeEagle(); return; }
        if (++slow % 30 === 0) { tickNeeds(); if (auto) sync(); theftCheck(false); theftNight(); theftMorning(); theftFightCheck(); gloveCheck(); if (pendingName && T.isCalm(scene, CALM_MENU)) { pendingName = false; nameScene(); } }
        if (eagle) {
            if (eagle.leaving) updateLeaving(eagle);
            else if (auto && !eagle.frozen) updateEagle();
            if (eagle) syncBody(eagle);
            if (eagle) { s.x = eagle.x; s.y = eagle.y; drawEagle(eagle); }
            if (eagle && Math.hypot(eagle.x - heroPoint().x, eagle.y - heroPoint().y) < 6) s.seenDay = day();
        }
        if (slow % 10 === 5) foesTick();
        drawPuffs();
        playSfx();
    }

    // ------------------------------------------------------------------
    // F9 (Debug.js, the island tab "Wyspa i fabuła"): the rows, ←→ on the stage row, OK
    // ------------------------------------------------------------------
    let f9Pending = null;   // an act for the map once the menu is closed ("mount", "land")
    let f9Stage = 5;
    function f9Rows() {
        const s = S(), icon = D.ICON.orzel, have = s.have && s.stage >= 1;
        return [
            { what: "jajo", icon: D.ICON.jajo, label: s.have ? Watki.wstaw(TK.kod.f9Rows[2], { "1": s.stage ? Watki.wstaw(TK.kod.f9Rows[0], { stage: s.stage }) : Watki.wstaw(TK.kod.f9Rows[1], { "1": Math.floor(s.egg.warm), warmHours: ST[0].warmHours }) }) : TK.kod.f9Rows[3],
              desc: TK.kod.f9Rows[4] },
            { what: "gotowe", icon: D.ICON.jajo, label: TK.kod.f9Rows[5], desc: TK.kod.f9Rows[6] },
            { what: "etap", icon, pick: f9Stage, label: Watki.wstaw(TK.kod.f9Rows[7], { f9Stage: f9Stage, name: ST[f9Stage].name }),
              desc: TK.kod.f9Rows[8] },
            { what: "wiez", icon, label: Watki.wstaw(TK.kod.f9Rows[10], { "1": have ? "" : TK.kod.f9Rows[9] }), desc: TK.kod.f9Rows[11] },
            { what: "dosiadz", icon, label: TK.kod.f9Rows[12], desc: TK.kod.f9Rows[13] },
            { what: "wyladuj", icon, label: TK.kod.f9Rows[14], desc: TK.kod.f9Rows[15] },
            { what: "kradziez", icon, label: TK.kod.f9Rows[16], desc: TK.kod.f9Rows[17] },
            { what: "gran", icon: 190, label: TK.kod.f9Rows[18], desc: TK.kod.f9Rows[19] }
        ];
    }
    function f9Pick(row, delta) {
        f9Stage = ((f9Stage - 1 + delta + 5) % 5) + 1;
        row.pick = f9Stage;
        row.label = Watki.wstaw(TK.kod.f9Pick[0], { f9Stage: f9Stage, name: ST[f9Stage].name });
    }
    function f9(row) {
        const s = S();
        switch (row.what) {
            case "jajo":
                if (s.have) return { say: TK.kod.f9[0], bad: true };
                giveEgg();
                if (TQ() && TQ().finish && !isDone("D29")) TQ().finish("D29");
                return { say: TK.kod.f9[1] };
            case "gotowe":
                s.flags.f9Egg = true;
                return { say: TK.kod.f9[2] };
            case "etap":
                f9Pending = { act: "stage", stage: f9Stage };
                return { back: true };
            case "wiez":
                if (!s.have || !s.stage) return { say: TK.kod.f9[3], bad: true };
                s.bond = 100; s.food = 100; s.water = 100; s.hp = maxHp(); s.st = maxSt(); s.away = null; s.hurtUntil = 0;
                return { say: TK.kod.f9[4] };
            case "dosiadz":
                f9Pending = { act: "mount" };
                return { back: true };
            case "wyladuj":
                f9Pending = { act: "land" };
                return { back: true };
            case "kradziez":
                if (!s.have || !s.stage) forceStage(3);
                s.theft = { state: "camp", night: day() };
                removeEagle();
                return { go: [TK.kod.f9[5], D.MAP, D.WAY_UP.land[0], D.WAY_UP.land[1], 8] };
            case "gran":
                return { go: [TK.kod.f9[5], D.MAP, D.WAY_UP.land[0], D.WAY_UP.land[1], 8] };
        }
        return null;
    }
    function f9Run(scene) {
        if (!f9Pending || !T.isCalm(scene, { only: ["onMap", "event", "farmMenu", "sceneChange", "transfer"] })) return;
        const p = f9Pending, L = T.api("Orzel_Lot");
        f9Pending = null;
        if (p.act === "stage") { forceStage(p.stage); S().name = S().name || TX.defaultName; S().bond = Math.max(S().bond, 60); }
        else if (p.act === "mount") {
            if (S().stage < 5) forceStage(5);
            const s = S();
            s.bond = Math.max(s.bond, 80); s.st = maxSt(); s.name = s.name || TX.defaultName;
            if (!eagle) spawnHere({ near: true });
            if (L && L.mount) L.mount();
        } else if (p.act === "land" && L && L.forceLand) L.forceLand("f9");
    }
    T.onMapUpdate(scene => { if (has() && f9Pending) f9Run(scene); }, { owner: PLUGIN, name: "f9" });

    // ------------------------------------------------------------------
    // The API (F9, the tests, Orzel_Lot)
    // ------------------------------------------------------------------
    function giveEgg() {
        const s = S();
        if (!s.have) { s.have = true; s.stage = 0; s.egg = { warm: 0, cold: 0, where: "bag", basket: null, knock: false }; s.clock = clock(); s.flags.eggTaken = day(); }
        if (s.stage === 0 && count(D.ITEM.jajo) < 1 && s.egg.where !== "basket") $gameParty.gainItem(item(D.ITEM.jajo), 1);
        setFlag("orzelJajo");
        autoChecks();
    }
    function forceStage(st) {
        const s = S();
        if (!s.have) giveEgg();
        if (s.stage === 0 && st > 0) { s.egg.warm = ST[0].warmHours; hatch(); pendingName = false; s.name = s.name || TX.defaultName; }
        s.care = Math.max(s.care, D.STAGE_AT[st] || 0);
        setStage(st);
        s.food = 90; s.water = 90; s.away = null; s.hurtUntil = 0;
        s.map = $gameMap.mapId(); s.mode = "follow";
        removeEagle();
        if (st > 0 && mapAllows()) spawnHere({ near: true });
        return s.stage;
    }
    const api = {
        DATA: D, state: () => S(), get eagle() { return eagle; }, set eagle(v) { eagle = v; },
        auto: v => { auto = !!v; return auto; }, sync, tickNeeds, newDay, grow, setStage, forceStage, giveEgg, hatch, feed, giveWater, petIt, setMode,
        openMenu, callKey, callBack, flyOff, home, nests, nestPoint, nestSeat, nestScreen, leaveNest, want, standUp, poseOf, openSquare, freeTile, bodyFits, pickAtk, gusts: () => puffs.filter(p => p.ring).length,
        riseSaid: v => { if (v !== undefined) saidRiseAt = v; return saidRiseAt; }, mapAllows, spawnHere, removeEagle, drawEagle, updateEagle,
        eggWarm, heroWarm, fireNear, wayUp, look, defends, epilogue, nameScene, maxHp, maxSt, stageDef, pop, addBond, hurt, orderAttack, foeOk, pickFoe,
        theft: { check: theftCheck, night: theftNight, morning: theftMorning, cage: theftCage, guards: campGuards }, asChar, DIR8, flyTo, walkTo, diveHit,
        heroPoint, nameOf, setFlag, flag, autoChecks, f9Rows, f9Pick, f9, eggReady,
        bodyOf, reachable, provoke, takeHit, foesTick, afterLand, sendOff
    };
    window.Orzel = T.register(PLUGIN, api);
})();
