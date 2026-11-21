//=============================================================================
// Pulapki.js
//=============================================================================
// (2026-11-19, the user: "może nawet dodać w lochach ukryte pola jako pułapki i jak postać się skrada, to może (ale nie musi) zauważyć
// takie pole z pułapką i spróbować ją rozbroić (części metalowe różne, zysk i xp)")
//   - HIDDEN TRAPS on the generated floors of the underground: a few a floor (more deeper), on the floor of the rooms and the ways, not
//     by the stairs, apart from each other and from the floor's own spikes; where and which - by the save's seed and the floor (the
//     same every visit). Kinds (KINDS): the spike plate (kolce), the jaw trap (wnyk - holds the hero a moment), the tripwire with bells
//     (linka - no wound, but the bells call every creature round).
//   - NOT SEEN until noticed: walking on one springs it. SNEAKING (C) the hero may notice one coming near - a roll when he comes within
//     2.2 tiles and again within 1.2 (Percepcja helps); noticed, it shows on the floor (the spikes' holes, the open jaws, the wire).
//   - DISARMED: sneaking, by it, facing it - hold O (Zamki.task: the ring, as a lock): every second a chance it goes off on him;
//     done - its metal parts (KINDS[k].parts: nails, iron, fittings, steel deeper, a rope) and experience. Sprung or disarmed stays so.
// Saved: Tawerna.state("pulapki") = { floors: { "mapId:seed:sig": { found: [i], done: { i: "sprung" | "disarmed" } } } }.

/*:
 * @target MZ
 * @plugindesc Ukryte pułapki w podziemiach: kolce, wnyki, linki z dzwonkami; w skradaniu (C) można je dostrzec i rozbroić (przytrzymaj O) - części metalowe i doświadczenie. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Underground
 * @orderAfter Zamki
 *
 * @help
 * ============================================================================
 * Pulapki.js - ukryte pułapki w podziemiach
 * ============================================================================
 * Na piętrach podziemi leżą ukryte pułapki. Idąc normalnie, wchodzisz na nie
 * w ciemno. W skradaniu (C) możesz je dostrzec (Percepcja pomaga) - wtedy
 * widać je na ziemi. Stań przy niej przodem i przytrzymaj O, żeby rozbroić:
 * dostaniesz części metalowe i doświadczenie. Może się nie udać.
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "Pulapki";
    const T = window.Tawerna;
    if (!T) throw new Error("Pulapki.js: brak TawernaCore.js (the Tawerna core is missing)");

    const ITEM = { nails: 88, iron: 86, fitting: 514, steel: 143, rope: 93 };
    // the kinds: the words, how it hurts, how long disarming takes (s, Zręczność 5) and its chance to go off each second, the parts got
    // [item, chance, min, max] (deep: from floor 21 on), the weight by floor band, the look
    const KINDS = {
        kolce: { name: "Płyta z kolcami", dmg: [7, 0.6], poise: 30, secs: 3, fail: 0.07, w: 4, icon: 0,
            parts: [[ITEM.nails, 1, 3, 6], [ITEM.iron, 0.3, 1, 1]], deep: [[ITEM.steel, 0.35, 1, 1]] },
        wnyk: { name: "Wnyk", dmg: [5, 0.45], poise: 50, hold: 90, secs: 4, fail: 0.09, w: 3,
            parts: [[ITEM.fitting, 0.8, 1, 2], [ITEM.iron, 0.5, 1, 1], [ITEM.nails, 0.4, 2, 4]], deep: [[ITEM.steel, 0.3, 1, 1]] },
        linka: { name: "Linka z dzwonkami", dmg: [0, 0], noise: 14, secs: 2.5, fail: 0.05, w: 3,
            parts: [[ITEM.rope, 1, 1, 2], [ITEM.nails, 0.5, 1, 3]], deep: [[ITEM.fitting, 0.3, 1, 1]] }
    };
    const ART = {
        kolce: { sheet: "!Fantasy_dungeon_traps", block: 2, w: 48, h: 96 },   // (rows: 0 up, 3 the holes; block 3 the same bloody)
        wnyk: { pic: "Pulapka_Wnyk" },                                         // (img/system: 96x48 - open | shut)
        linka: { sheet: "!W9_Rywal", block: 1, w: 48, h: 48, row: 1 }         // (W9's tripwire: patterns 0 across, 1 along, 2 cut)
    };
    const PLACE = { base: 2, perFloors: 10, max: 8, apart: 6, stairs: 4, spikes: 2 };
    const SEE = { far: 2.2, near: 1.2, chance: 0.4, perStep: 0.04, nearBonus: 0.2, min: 0.15, max: 0.9 };
    const XP = { found: 4, disarm: 12, perFloor: 1.5 };
    const SAY = {
        found: "Pułapka! {name}.",
        hold: "Rozbrajasz: {name} - trzymaj O.",
        notSneak: "Pułapkę rozbroisz tylko w skradaniu (C).",
        done: "Rozbrojone: {name}.",
        failed: "Nie wyszło - {name} poszła!",
        sprung: { kolce: "Kolce!", wnyk: "Wnyk!", linka: "Dzwonki!" },
        sprungSub: { kolce: "Ukryta płyta z kolcami", wnyk: "Żelazne szczęki trzymają nogę", linka: "Wszystko w pobliżu to słyszało" }
    };

    const store = T.state.define("pulapki", () => ({ floors: {} }), { version: 1, owner: PLUGIN });
    const U = () => T.api("Underground");
    const attr = id => { const C = T.api("Combat"); try { return C && C.attr ? C.attr(id) : 5; } catch (e) { return 5; } };
    const sneaking = () => !!T.call("Hunting", "sneaking");
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const fill = (t, o) => t.replace(/\{(\w+)\}/g, (m, k) => (o[k] !== undefined ? o[k] : m));
    function rng(seed) {   // (a small seeded random: the same traps on the same floor of the same save)
        let s = seed >>> 0 || 1;
        return () => { s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0; s ^= s >>> 13; return (s >>> 0) / 4294967296; };
    }

    // ---- the traps of this floor: worked out on entering it
    let here = null;   // { key, mapId, floor, list: [{ i, kind, x, y, dir }], seen: { i: "far"|"near" } }
    function floorKey(mapId) {
        const u = U(), seed = u && u.seed ? u.seed() : 0;
        return mapId + ":" + seed + ":" + $gameMap.width() + "x" + $gameMap.height() + ":" + ($dataMap.events || []).length;
    }
    function rec() {
        const s = store().floors;
        if (!here) return null;
        if (!s[here.key]) {
            const keys = Object.keys(s);
            if (keys.length > 40) delete s[keys[0]];
            s[here.key] = { found: [], done: {} };
        }
        return s[here.key];
    }
    function stairsCells() {
        const out = [];
        for (const ev of $gameMap.events()) {
            const d = ev.event(), n = (d && (d.note || "")) + " " + ((d && d.name) || "");
            if (/<Minimap:exit>|schod|Schod|drabin|Drabin|winda|Winda/.test(n) || ev.isTriggerIn([1, 2])) out.push([ev.x, ev.y]);
        }
        return out;
    }
    function freeCell(x, y) {
        if (!$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f)) return false;
        if ($gameMap.eventsXy(x, y).length) return false;
        // (on a way: a way through it - up and down or left and right - not a dead pocket)
        const ok = (dx, dy) => $gameMap.isValid(x + dx, y + dy) && $gameMap.checkPassage(x + dx, y + dy, 0x0f);
        return (ok(0, -1) && ok(0, 1)) || (ok(-1, 0) && ok(1, 0));
    }
    function build() {
        here = null;
        const u = U(), mapId = $gameMap.mapId();
        if (!u || !u.isUnderground || !u.isUnderground(mapId) || !u.isGenerated(mapId)) return;
        const floor = u.floorOf(mapId) || 1, info = u.info(mapId) || {};
        const key = floorKey(mapId), r = rng(Zhash(key));
        const n = Math.min(PLACE.max, PLACE.base + Math.floor(floor / PLACE.perFloors));
        const stairs = stairsCells(), spikes = (info.traps || []).map(t => [t.x, t.y]);
        const far = (x, y, list, d) => list.every(([a, b]) => Math.abs(a - x) + Math.abs(b - y) >= d);
        const cells = [];
        for (let y = 1; y < $gameMap.height() - 1; y++) for (let x = 1; x < $gameMap.width() - 1; x++) if (freeCell(x, y)) cells.push([x, y]);
        const list = [];
        const kinds = Object.keys(KINDS), total = kinds.reduce((a, k) => a + KINDS[k].w, 0);
        for (let tries = 0; tries < 400 && list.length < n && cells.length; tries++) {
            const [x, y] = cells[Math.floor(r() * cells.length)];
            if (!far(x, y, stairs, PLACE.stairs) || !far(x, y, spikes, PLACE.spikes) || !far(x, y, list.map(t => [t.x, t.y]), PLACE.apart)) continue;
            let w = r() * total, kind = kinds[0];
            for (const k of kinds) { w -= KINDS[k].w; if (w <= 0) { kind = k; break; } }
            // the wire goes across the way: across (H) when the way runs up and down
            const vert = $gameMap.checkPassage(x, y - 1, 0x0f) && $gameMap.checkPassage(x, y + 1, 0x0f);
            const horiz = $gameMap.checkPassage(x - 1, y, 0x0f) && $gameMap.checkPassage(x + 1, y, 0x0f);
            list.push({ i: list.length, kind, x, y, dir: vert && !horiz ? "H" : !vert && horiz ? "V" : r() < 0.5 ? "H" : "V" });
        }
        here = { key, mapId, floor, list, seen: {} };
        rec();
    }
    function Zhash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    const stateOf = t => { const s = rec(); return s ? s.done[t.i] || (s.found.includes(t.i) ? "found" : "hidden") : "hidden"; };
    const armed = t => { const st = stateOf(t); return st === "hidden" || st === "found"; };

    // ---- noticing (sneaking): a roll on coming within SEE.far, another within SEE.near
    const heroCX = () => $gamePlayer._realX + 0.5, heroCY = () => $gamePlayer._realY + 0.5;
    function seeChance(near) {
        const c = SEE.chance + SEE.perStep * (attr("per") - 5) + (near ? SEE.nearBonus : 0);
        return Math.max(SEE.min, Math.min(SEE.max, c));
    }
    function notice(t) {
        const s = rec();
        if (!s || s.found.includes(t.i)) return;
        s.found.push(t.i);
        T.popup(fill(SAY.found, { name: KINDS[t.kind].name }), { kind: "bad", icon: 0 });
        T.audio.se("Search", { volume: 60, pitch: 120 });
        T.call("Combat", "gainXp", XP.found, "dostrzeżona pułapka", true);
        T.emit("pulapkaWykryta", { kind: t.kind, floor: here.floor });
    }
    function updateSee() {
        if (!here || !here.list.length) return;
        const sneak = sneaking(), hx = heroCX(), hy = heroCY();
        for (const t of here.list) {
            const d = Math.hypot(t.x + 0.5 - hx, t.y + 0.5 - hy), was = here.seen[t.i] || "";
            const zone = d <= SEE.near ? "near" : d <= SEE.far ? "far" : "";
            if (zone === was) continue;
            here.seen[t.i] = zone;   // (a roll on coming into a zone, not every frame: walking away and back is another look)
            if (!zone || !sneak || stateOf(t) !== "hidden") continue;
            if ((zone === "far" && was === "") || (zone === "near" && was !== "near")) if (Math.random() < seeChance(zone === "near")) notice(t);
        }
    }

    // ---- springing: stepped on (not seen or seen), or a disarming gone wrong
    let hold = 0;   // (frames the jaws hold the hero)
    function spring(t, how) {
        const s = rec(), K = KINDS[t.kind];
        if (!s) return;
        s.done[t.i] = "sprung";
        if (!s.found.includes(t.i)) s.found.push(t.i);
        const dmg = Math.round(K.dmg[0] + K.dmg[1] * here.floor);
        if (t.kind === "linka") {
            T.audio.se("Bell2", { volume: 80, pitch: 150 }); T.audio.se("Bell3", { volume: 60, pitch: 130 });
            T.call("Hunting", "makeNoise", t.x + 0.5, t.y + 0.5, K.noise);
        } else {
            T.audio.se(t.kind === "wnyk" ? "Hammer" : "Sword4", { volume: 90, pitch: t.kind === "wnyk" ? 70 : 110 });
            const u = U();
            if (u && u.hurt && dmg > 0) u.hurt(dmg, { poise: K.poise, knock: 0.2, name: K.name, from: { x: t.x, y: t.y - 0.6 } });
            if (K.hold) hold = K.hold;
        }
        T.popup(SAY.sprung[t.kind], { top: true, color: "#ff9f8f", sub: how === "fail" ? fill(SAY.failed, { name: K.name }) : SAY.sprungSub[t.kind] });
        T.emit("pulapkaUruchomiona", { kind: t.kind, floor: here.floor, how: how || "step" });
    }
    function updateStep() {
        if (!here || $gamePlayer.isTransferring()) return;
        const x = $gamePlayer.x, y = $gamePlayer.y;
        for (const t of here.list) if (t.x === x && t.y === y && armed(t)) { spring(t, "step"); break; }
    }
    const _canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() { return hold > 0 ? false : _canMove.call(this); };

    // ---- disarming: sneaking, by it, facing it - O (Zamki's ring)
    function trapAhead() {
        if (!here) return null;
        const d = $gamePlayer.direction(), fx = d === 4 ? -1 : d === 6 ? 1 : 0, fy = d === 8 ? -1 : d === 2 ? 1 : 0, hx = heroCX(), hy = heroCY();
        let best = null, bestD = 99;
        for (const t of here.list) {
            if (stateOf(t) !== "found") continue;
            const dx = t.x + 0.5 - hx, dy = t.y + 0.5 - hy, dist = Math.hypot(dx, dy);
            if (dist > 1.45 || (dist > 0.5 && (dx * fx + dy * fy) / dist < 0.5)) continue;
            if (dist < bestD) { bestD = dist; best = t; }
        }
        return best;
    }
    function disarm(t) {
        const Z = T.api("Zamki"), K = KINDS[t.kind];
        if (!Z || !Z.task) return false;
        const dex = attr("dex");
        return Z.task({
            key: "trap:" + here.key + ":" + t.i, mapId: here.mapId, level: 1, cx: () => t.x + 0.5, cy: () => t.y + 0.5, ringDy: -20,
            locked: () => stateOf(t) === "found",
            task: {
                hold: fill(SAY.hold, { name: K.name }), notSneak: SAY.notSneak, icon: 0,
                // (2026-11-19, the user) the mini-game (Zamki_Gra): the bells cut in their quiet; the spikes and the jaws - the needle in the green
                game: t.kind === "linka" ? "bells" : "spring", title: "Rozbrajanie: " + K.name, depth: here.floor, pic: t.kind,
                secs: () => K.secs * Math.max(0.5, Math.min(1.3, 1 - 0.04 * (dex - 5))),
                fail: () => K.fail * Math.max(0.3, 1 - 0.05 * (dex - 5)),
                onDone: () => disarmed(t),
                onFail: () => spring(t, "fail")
            }
        });
    }
    function disarmed(t) {
        const s = rec(), K = KINDS[t.kind];
        s.done[t.i] = "disarmed";
        T.audio.se("Equip2", { volume: 80, pitch: 120 });
        T.popup(fill(SAY.done, { name: K.name }), { kind: "good", icon: 0 });
        const rows = K.parts.concat(here.floor > 20 ? K.deep || [] : []);
        let got = 0;
        for (const [id, ch, a, b] of rows) if ($dataItems[id] && Math.random() < ch) { $gameParty.gainItem($dataItems[id], rnd(a, b)); got++; }
        if (!got) $gameParty.gainItem($dataItems[ITEM.nails], rnd(1, 3));
        T.call("Combat", "gainXp", Math.round(XP.disarm + XP.perFloor * here.floor), "rozbrojona pułapka: " + K.name);
        T.emit("pulapkaRozbrojona", { kind: t.kind, floor: here.floor });
    }
    const _trigger = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && here && !this.isInVehicle()) {
            const t = trapAhead();
            if (t && disarm(t)) return true;
        }
        return _trigger.call(this);
    };

    T.onMapUpdate(() => {
        if (hold > 0) hold--;
        if (!here) return;
        updateSee();
        updateStep();
    }, { owner: PLUGIN, name: "traps" });
    T.on("mapReady", () => { try { build(); } catch (e) { here = null; console.error("[Pulapki]", e); } }, { owner: PLUGIN });

    // ---- the pictures: the noticed, the sprung and the disarmed traps on the floor (the hidden ones are not drawn)
    function Sprite_Pulapki() { this.initialize(...arguments); }
    Sprite_Pulapki.prototype = Object.create(PIXI.Container.prototype);
    Sprite_Pulapki.prototype.constructor = Sprite_Pulapki;
    Sprite_Pulapki.prototype.initialize = function() { PIXI.Container.call(this); this.z = 1; this._sp = {}; this._br = {}; this._map = 0; };
    // a noticed, armed trap: the tile's corners in the HUD's yellow (the holes of a spike plate are hardly seen on a dark floor)
    function brackets() {
        const g = new PIXI.Graphics(), c = 0xffd23f, L = 10, m = 3, S = 48 - 2 * m;
        for (const [w, a] of [[4, 0x000000], [2, c]]) {
            g.lineStyle(w, a, a === c ? 0.85 : 0.45);
            for (const [x, y, dx, dy] of [[m, m, 1, 1], [m + S, m, -1, 1], [m, m + S, 1, -1], [m + S, m + S, -1, -1]]) { g.moveTo(x + dx * L, y); g.lineTo(x, y); g.lineTo(x, y + dy * L); }
        }
        return g;
    }
    Sprite_Pulapki.prototype.frameOf = function(t, st) {
        const a = ART[t.kind], open = st === "found";
        if (t.kind === "wnyk") return { bmp: ImageManager.loadSystem(a.pic), x: open ? 0 : 48, y: 0, w: 48, h: 48, ay: 0.5, dy: 24 };
        if (t.kind === "linka") return { bmp: ImageManager.loadCharacter(a.sheet), x: a.block * 144 + 48 * (st === "found" ? (t.dir === "V" ? 1 : 0) : 2), y: a.row * 48, w: 48, h: 48, ay: 1, dy: 48 };
        const block = st === "sprung" ? a.block + 1 : a.block;   // (the spikes: up and bloody once they went off, the holes else)
        return { bmp: ImageManager.loadCharacter(a.sheet), x: block * 144 + 48, y: (st === "sprung" ? 0 : 3) * 96, w: 48, h: 96, ay: 1, dy: 48 };
    };
    Sprite_Pulapki.prototype.update = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        if (!here || this._map !== here.key) {
            for (const k in this._sp) this.removeChild(this._sp[k]);
            for (const k in this._br) { this.removeChild(this._br[k]); this._br[k].destroy(); }
            this._sp = {}; this._br = {}; this._map = here ? here.key : 0;
        }
        if (!here) return;
        for (const t of here.list) {
            const st = stateOf(t);
            let s = this._sp[t.i], b = this._br[t.i];
            if (st === "found") {
                if (!b) { b = this._br[t.i] = brackets(); this.addChildAt(b, 0); }
                b.visible = true;
                b.x = Math.round($gameMap.adjustX(t.x) * tw); b.y = Math.round($gameMap.adjustY(t.y) * th);
            } else if (b) b.visible = false;
            if (st === "hidden") { if (s) s.visible = false; continue; }
            if (!s) { s = new Sprite(); this._sp[t.i] = s; this.addChild(s); }
            if (s._st !== st) {
                const f = this.frameOf(t, st);
                s.bitmap = f.bmp; s.setFrame(f.x, f.y, f.w, f.h); s.anchor.set(0.5, f.ay); s._dy = f.dy; s._st = st;
                s.opacity = st === "disarmed" ? 150 : 255;
            }
            s.visible = true;
            s.x = Math.round($gameMap.adjustX(t.x) * tw + tw / 2);
            s.y = Math.round($gameMap.adjustY(t.y) * th + s._dy);
        }
    };
    const _createLower = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _createLower.call(this);
        this._pulapki = new Sprite_Pulapki();
        this._tilemap.addChild(this._pulapki);
    };
    const _upd = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() { _upd.call(this); if (this._pulapki) this._pulapki.update(); };

    window.Pulapki = T.register(PLUGIN, {
        KINDS, PLACE, SEE, XP, build, notice, spring, disarm, trapAhead, seeChance,
        here: () => here, list: () => (here ? here.list.map(t => Object.assign({ state: stateOf(t) }, t)) : []),
        holding: () => hold, state: store
    });
})();
