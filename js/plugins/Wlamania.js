//=============================================================================
// Wlamania.js
//=============================================================================
// (2026-11-19, the user: "a domy w Podgrodziu i mieście? i skrzynki w nich?" - "tak, ale jak śpią, to niech są na łóżku")
//   - THE HOUSES' DOORS AT NIGHT: a door of a house round the town shut by the hour (its page asks the hour - "Zamknięte." outside it)
//     takes a lockpick while it is shut (Zamki.pickEvent - sneaking, hold O): Podgrodzie's and the coast's huts a simple lock, the town's
//     houses a solid one, the kantor and the town hall an iron-bound one. Picked, it is open till the morning - in at once.
//   - ASLEEP IN BED: from SLEEP[0] to SLEEP[1] o'clock a resident at home (TownLife: inside, at his "<key>_wnetrze" place) sleeps in
//     his bed - his head on the pillow, the blanket over him (his sheet's facing-down frame, only the head), "z" over him; his standing
//     self is hidden (so Widzenie's sight leaves him out: asleep he sees nothing). The beds: the pillow tiles of the interior sheet
//     (PILLOWS), the nearest free one to his place; a house with no bed gets a plain bed of the same sheet by the wall near him
//     (injected tiles, BED_IDS - three events: the head, the pillow, the blanket).
//   - WAKING: an intruder (in through a picked door tonight) walking near without sneaking, the clicks of a lock picked close by, a pick
//     snapping - his sleep meter fills; full: he gets up, "Złodziej!", the town's opinion down (a guard: the garrison's favour too), and
//     he stays awake the rest of the night.
// Saved: Tawerna.state("wlamania") = { picked: { mapId: night }, woke: { key: night } }.

/*:
 * @target MZ
 * @plugindesc Nocne włamania: drzwi domów nocą na wytrych (skradanie, O), domownicy śpią w łóżkach (głowa na poduszce, „z”), hałas ich budzi - „Złodziej!”. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TownLife
 * @orderAfter Zamki
 *
 * @help
 * ============================================================================
 * Wlamania.js - nocne włamania do domów
 * ============================================================================
 * Nocą drzwi domów są zamknięte. W skradaniu (C) otworzysz je wytrychem
 * (przytrzymaj O) - do rana zostają otwarte. Domownicy śpią w łóżkach
 * (22:00-5:00). Chodzenie bez skradania tuż obok, stukanie wytrycha przy
 * skrzyni albo pęknięty wytrych mogą ich obudzić - wtedy „Złodziej!”.
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "Wlamania";
    const T = window.Tawerna;
    if (!T) throw new Error("Wlamania.js: brak TawernaCore.js (the Tawerna core is missing)");

    const SLEEP = [22, 5];
    const AREAS = [218, 219, 220, 221];
    const DOOR_LEVEL = { 218: 1, 219: 1, 220: 2, 221: 2 };
    const DOOR_LEVEL_TO = { 103: 3, 104: 3 };   // (the kantor, the town hall: iron-bound)
    // the interior sheet's pillow tiles (Fantasy_Inside_C): a head goes on each - the single beds, the double beds' two pillows
    const PILLOWS = [476, 477, 478, 479, 490, 497, 499, 500, 501, 502, 503];
    // the side beds (two tiles wide, one high): the pillow at the left end (the head turned left) or the right end
    const SIDE = { 472: -1, 480: -1, 475: 1, 483: 1 };
    const PLAIN_BED = { head: 489, pillow: 497, foot: 505 };   // (the plain brown bed of the same sheet: frame, pillow, blanket)
    // the straw beds that are events ("Posłanie..." of !Podgrodzie2_Wnetrza, 144 px frames standing on their cell): where the pillow's
    // middle is in the frame (px from its top) by the pattern - the two grown-ups' beds and the child's short one
    const STRAW = { sheet: "!Podgrodzie2_Wnetrza", frame: 144, pillowY: [65, 65, 87], re: /pos[łl]anie|[łl][óo][żz]ko|siennik|prycz/i };
    const BED_IDS = [5200, 5229];
    const WAKE = { walk: 0.16, stand: 0.05, near: 3.5, sneakNear: 1.2, sneak: 0.012, click: 0.09, clickNear: 3, snap: 0.45, snapNear: 4.5, decay: 0.008 };
    const GUARDS = ["kapral", "straz_1", "straz_2"];
    const OPINION = -5, FAVOR = -8;
    const SAY = { shut: "Zamknięte.", thief: ["Złodziej!", "Kto tu?! Złodziej!", "Ratunku! Złodziej!"], guard: ["Stój! Złodziej w wartowni!", "Alarm! Złodziej!"] };

    const store = T.state.define("wlamania", () => ({ picked: {}, woke: {} }), { version: 1, owner: PLUGIN });
    const hour = () => T.time.hour();
    const nightKey = () => (hour() >= 12 ? T.time.day() : T.time.day() - 1);
    const asleepHour = () => { const h = hour(); return h >= SLEEP[0] || h < SLEEP[1]; };
    const sneaking = () => !!T.call("Hunting", "sneaking");
    const areaOf = mapId => { let m = $dataMapInfos[mapId], n = 0; while (m && n++ < 6) { if (AREAS.includes(m.id)) return m.id; m = $dataMapInfos[m.parentId]; } return 0; };

    // ==================================================================
    // 1. The doors shut by the hour: a lockpick at night
    // ==================================================================
    // a door of the town's maps with <Town:door=...> whose page starts with the hour's condition: [the condition's script, the transfer]
    const DOOR_OF = new WeakMap(), SLEEP_OF = new WeakMap();   // (off the events - they are saved with the game)
    function doorOf(ev) {
        if (!ev || !(ev instanceof Game_Event) || !AREAS.includes(ev._mapId)) return null;
        if (DOOR_OF.has(ev)) return DOOR_OF.get(ev);
        let d = null;
        const data = ev.event();
        if (data && /<Town:door=/.test(data.note || "")) {
            const list = (ev.page() && ev.page().list) || [], c = list[0];
            const tr = list.find(x => x.code === 201 && x.parameters[0] === 0);
            if (c && c.code === 111 && c.parameters[0] === 12 && /return\s+h\s*>=\s*\d+/.test(c.parameters[1] || "") && tr) {
                try { d = { open: new Function("return (" + c.parameters[1] + ");"), to: tr.parameters.slice(1, 5) }; } catch (e) { d = null; }
            }
        }
        DOOR_OF.set(ev, d);
        return d;
    }
    const doorShut = d => { try { return !d.open(); } catch (e) { return false; } };
    const pickedTonight = mapId => store().picked[mapId] === nightKey();
    function enter(d) {
        T.audio.se("Door1", { volume: 70 });
        $gamePlayer.reserveTransfer(d.to[0], d.to[1], d.to[2], d.to[3], 0);
    }
    const QUIET = 300, saidAt = {};
    function doorStart(ev) {
        const d = doorOf(ev);
        if (!d || !doorShut(d)) return false;
        if (pickedTonight(d.to[0])) { enter(d); return true; }
        const Z = T.api("Zamki");
        if (!Z || !Z.pickEvent) return false;
        // (2026-11-19, the user: touching the door gave "milion wiadomości") the doors are taken by a touch: walking into one only says
        // it is shut, once in QUIET frames; the lock is tried with the action button (O)
        if (!Input.isTriggered("ok")) {
            const f = Graphics.frameCount, k = ev._mapId + ":" + ev._eventId;
            if (!(saidAt[k] > f - QUIET)) { saidAt[k] = f; T.popup(SAY.shut, { kind: "info" }); }
            return true;
        }
        const level = DOOR_LEVEL_TO[d.to[0]] || DOOR_LEVEL[ev._mapId] || 1;
        Z.pickEvent(ev, { level, owner: "town", locked: () => !pickedTonight(d.to[0]) && doorShut(d),
            onOpen: () => { store().picked[d.to[0]] = nightKey(); T.emit("wlamanieDrzwi", { mapId: d.to[0] }); enter(d); } });
        return true;
    }

    // ==================================================================
    // 2. The beds: the pillows of the map, a plain bed where there is none
    // ==================================================================
    const spotsOf = data => (data.events || []).filter(e => e && /^Miejsce:\s*\w+_wnetrze\s*$/.test(e.name || "")).map(e => ({ key: e.name.replace(/^Miejsce:\s*/, "").replace(/_wnetrze\s*$/, ""), x: e.x, y: e.y }));
    // the beds of a map: { x, y } the cell the head lies in, { px, py } the head's middle in the map's pixels (48 a tile)
    function pillowsOf(data) {
        const W = data.width, H = data.height, out = [];
        for (let z = 2; z < 4; z++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const id = data.data[(z * H + y) * W + x];
            if (PILLOWS.includes(id)) out.push({ x, y, px: x * 48 + 24, py: y * 48 + 9 });
            else if (SIDE[id]) out.push({ x, y, px: x * 48 + (SIDE[id] > 0 ? 34 : 14), py: y * 48 + 17, side: SIDE[id] });
        }
        for (const e of data.events || []) {
            const im = e && e.pages && e.pages[0] && e.pages[0].image;
            if (!im || im.characterName !== STRAW.sheet || !STRAW.re.test(e.name || "")) continue;
            const py = (e.y + 1) * 48 - (STRAW.frame - (STRAW.pillowY[im.pattern] || STRAW.pillowY[0]));
            out.push({ x: e.x, y: Math.floor(py / 48), px: e.x * 48 + 24, py, straw: true });
        }
        return out;
    }
    // a cell open to walk (the tiles' own passage flags, from the top layer down, as the engine reads them)
    function passable(data, x, y) {
        if (x < 0 || y < 0 || x >= data.width || y >= data.height) return false;
        const flags = ($dataTilesets[data.tilesetId] || {}).flags || [], W = data.width, H = data.height;
        for (let z = 3; z >= 0; z--) {
            const id = data.data[(z * H + y) * W + x];
            if (!id) continue;
            const f = flags[id] || 0;
            if (f & 0x10) continue;
            return (f & 0x0f) !== 0x0f;
        }
        return false;
    }
    // a house with people at home and no bed: a plain bed for each, the head against the wall above, near his place, off the doors
    // (only for whom sleeps there: at home in the small hours by his plan, and about at all - TownLife's conditions)
    function sleepsHome(key) {
        const TL = T.api("TownLife");
        if (!TL || !TL.RESIDENTS || !TL.entryAt) return false;
        const res = TL.RESIDENTS.find(r => r.key === key);
        if (!res || (TL.absent && TL.absent(key))) return false;
        return [1, 2, 3].some(h => { const e = TL.entryAt(res, h) || {}; return e.act === "inside" && !(res.away && res.away.includes(e.where)) && !(res.indoor && res.indoor[e.where]); });
    }
    function plainBeds(data, mapId) {
        const spots = spotsOf(data).filter(sp => sleepsHome(sp.key));
        if (!spots.length || pillowsOf(data).length || !AREAS.includes(areaOf(mapId)) || AREAS.includes(mapId)) return [];
        const taken = new Set((data.events || []).filter(Boolean).map(e => e.x + "," + e.y));
        const doors = (data.events || []).filter(e => e && (e.pages || []).some(p => (p.list || []).some(c => c.code === 201)));
        const out = [];
        for (const sp of spots) {
            let best = null, bestD = 1e9;
            for (let y = 1; y < data.height - 2; y++) for (let x = 0; x < data.width; x++) {
                if (passable(data, x, y - 1) || !passable(data, x, y) || !passable(data, x, y + 1) || !passable(data, x, y + 2)) continue;
                if ([0, 1].some(k => taken.has(x + "," + (y + k))) || out.some(b => Math.abs(b.x - x) < 2 && Math.abs(b.y - y) < 3)) continue;
                if (doors.some(e => Math.abs(e.x - x) + Math.abs(e.y - y) < 3)) continue;
                const dd = Math.abs(sp.x - x) + Math.abs(sp.y - y) + (passable(data, x - 1, y) && passable(data, x + 1, y) ? 0 : -0.5);   // (by a side wall: a little better)
                if (dd < bestD) { bestD = dd; best = { x, y }; }
            }
            if (best) out.push({ x: best.x, y: best.y, key: sp.key });   // (x, y: the bed's head; the pillow under it, the blanket under that)
        }
        return out;
    }
    const tileEv = (id, name, x, y, tile, prio) => ({ id, name, note: "", x, y, pages: [{
        conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 },
        directionFix: true, image: { tileId: tile, characterName: "", characterIndex: 0, direction: 2, pattern: 0 }, list: [{ code: 0, indent: 0, parameters: [] }],
        moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
        priorityType: prio, stepAnime: false, through: false, trigger: 0, walkAnime: false }] });
    T.inject(mapId => AREAS.includes(areaOf(mapId)) && !AREAS.includes(mapId), { ids: BED_IDS, owner: PLUGIN, build: (data, mapId) => {
        const out = [];
        let id = BED_IDS[0];
        for (const b of plainBeds(data, mapId)) {
            if (id + 2 > BED_IDS[1]) break;
            out.push(tileEv(id++, "Łóżko (głowa)", b.x, b.y, PLAIN_BED.head, 0), tileEv(id++, "Łóżko", b.x, b.y + 1, PLAIN_BED.pillow, 1), tileEv(id++, "Łóżko", b.x, b.y + 2, PLAIN_BED.foot, 1));
        }
        return out;
    } });

    // ==================================================================
    // 3. Asleep: the residents at home in their beds
    // ==================================================================
    let room = null;   // { mapId, beds: [{x, y}], bedOf: { key: {x, y} } } - worked out on entering a map
    function setupRoom() {
        room = null;
        const mapId = $gameMap.mapId();
        if (!AREAS.includes(areaOf(mapId)) || AREAS.includes(mapId)) return;
        const spots = spotsOf($dataMap);
        if (!spots.length) return;
        const beds = pillowsOf($dataMap).concat($gameMap.events().filter(e => e.eventId() >= BED_IDS[0] && e.eventId() <= BED_IDS[1] && e.tileId() === PLAIN_BED.pillow)
            .map(e => ({ x: e.x, y: e.y, px: e.x * 48 + 24, py: e.y * 48 + 9 })));
        const bedOf = {}, used = new Set();
        const people = $gameMap.events().filter(e => !e._town && e.characterName() && !/^!/.test(e.characterName()) && !(e.eventId() >= BED_IDS[0] && e.eventId() <= BED_IDS[1]));
        for (const b of beds) if (people.some(e => e.x === b.x && (e.y === b.y || e.y === b.y + 1))) used.add(b.x + "," + b.y);
        for (const sp of spots.sort((a, b) => a.key.localeCompare(b.key))) {
            let best = null, bestD = 1e9;
            for (const b of beds) { const k = b.x + "," + b.y, d = Math.abs(b.x - sp.x) + Math.abs(b.y - sp.y); if (!used.has(k) && d < bestD) { bestD = d; best = b; } }
            if (best) { used.add(best.x + "," + best.y); bedOf[sp.key] = best; }
        }
        room = { mapId, beds, bedOf, wake: {} };
    }
    const keyOfEv = ev => { const m = /<Town:([\w]+)>/.exec((ev.event() && ev.event().note) || ""); return m ? m[1] : ""; };
    const residentsHere = () => $gameMap.events().filter(e => e._town && keyOfEv(e));
    const woken = key => store().woke[key] === nightKey();
    function shouldSleep(ev) {
        if (!room || !asleepHour()) return false;
        const key = keyOfEv(ev), st = ev._town || {};
        if (!room.bedOf[key] || woken(key) || st.hidden || !st.here || st.held || ev.isMoving()) return false;
        return true;
    }
    function fallAsleep(ev) {
        const key = keyOfEv(ev);
        SLEEP_OF.set(ev, { bed: room.bedOf[key], key });
        ev.setTransparent(true); ev.setThrough(true); ev._priorityType = 0;
        room.wake[key] = 0;
    }
    function standUp(ev) {
        if (!SLEEP_OF.has(ev)) return;
        SLEEP_OF.delete(ev);   // (back as TownLife makes them: seen, in the way, at the characters' level)
        if (!(ev._town && ev._town.hidden)) { ev.setTransparent(false); ev.setThrough(false); ev._priorityType = 1; }
    }
    function updateSleep() {
        if (!room || $gameMap.mapId() !== room.mapId) return;
        for (const ev of residentsHere()) {
            const want = shouldSleep(ev);
            if (want && !SLEEP_OF.has(ev)) fallAsleep(ev);
            else if (!want && SLEEP_OF.has(ev)) standUp(ev);
        }
    }
    const sleepers = () => residentsHere().filter(e => SLEEP_OF.has(e));

    // ---- waking: the intruder's steps, the clicks and the snap of a pick close by
    const heroCX = () => $gamePlayer._realX + 0.5, heroCY = () => $gamePlayer._realY + 0.5;
    const bedD = (ev, x, y) => { const b = SLEEP_OF.get(ev).bed; return Math.hypot(b.x + 0.5 - x, b.y + 0.5 - y); };
    function stir(ev, n) {
        const key = SLEEP_OF.get(ev).key;
        room.wake[key] = Math.max(0, Math.min(1, (room.wake[key] || 0) + n));
        if (room.wake[key] >= 1) wakeUp(ev);
    }
    function updateWake() {
        if (!room) return;
        const intruder = pickedTonight(room.mapId), sneak = sneaking(), moving = $gamePlayer.isMoving();
        for (const ev of sleepers()) {
            const d = bedD(ev, heroCX(), heroCY());
            let n = -WAKE.decay;
            if (intruder && !sneak && d < WAKE.near) n = moving ? WAKE.walk : WAKE.stand;
            else if (intruder && sneak && d < WAKE.sneakNear) n = WAKE.sneak;
            stir(ev, n);
        }
    }
    function noise(e, amount, near) {
        if (!room || !e) return;
        for (const ev of sleepers()) if (bedD(ev, e.x, e.y) < near) stir(ev, amount);
    }
    function wakeUp(ev) {
        const key = SLEEP_OF.get(ev).key;
        store().woke[key] = nightKey();
        standUp(ev);
        const dx = $gamePlayer.x - ev.x, dy = $gamePlayer.y - ev.y;
        ev.setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 6 : 4) : (dy > 0 ? 2 : 8));
        const guard = GUARDS.includes(key), lines = guard ? SAY.guard : SAY.thief, line = lines[Math.floor(Math.random() * lines.length)];
        const SB = T.api("SpeechBubbles");
        if (SB && SB.say) SB.say(ev, line); else T.popup(line, { kind: "bad" });
        T.audio.se("Buzzer1", { volume: 60 });
        T.call("Zamki", "cancel");
        T.call("TownQuests", "addOpinion", OPINION, "Włamanie nocą");
        if (guard) T.call("Garnizon", "addFavor", FAVOR, "Włamanie do wartowni");
        T.emit("wlamanieWpadka", { key, mapId: room.mapId });
    }

    // ---- the picture: the heads on the pillows, the "z" over them
    function zBitmap() {
        if (zBitmap.b) return zBitmap.b;
        const b = new Bitmap(30, 24);
        b.fontFace = $gameSystem.mainFontFace(); b.fontSize = 15; b.outlineWidth = 3; b.outlineColor = "rgba(0,0,0,0.85)"; b.textColor = "#fff6c8";
        b.drawText("z", 0, 8, 14, 16, "left"); b.fontSize = 19; b.drawText("Z", 11, 0, 18, 20, "left");
        return (zBitmap.b = b);
    }
    const headTop = {};   // "sheet#index" -> the frame's first drawn row
    function Sprite_Spiacy() { this.initialize(...arguments); }
    Sprite_Spiacy.prototype = Object.create(PIXI.Container.prototype);
    Sprite_Spiacy.prototype.constructor = Sprite_Spiacy;
    // (z 3.5: over the characters' level - a bed that is an event (a straw bed, a plain bed put in) - under the upper tiles)
    Sprite_Spiacy.prototype.initialize = function() { PIXI.Container.call(this); this.z = 3.5; this._s = new Map(); this._t = 0; };
    Sprite_Spiacy.prototype.update = function() {
        this._t++;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), seen = new Set();
        for (const ev of room ? sleepers() : []) {
            seen.add(ev);
            let e = this._s.get(ev);
            if (!e) {
                const bmp = ImageManager.loadCharacter(ev.characterName()), head = new Sprite(bmp), z = new Sprite(zBitmap());
                head.anchor.set(0.5, 0.5); z.anchor.set(0, 1);
                e = { head, z, idx: ev.characterIndex(), name: ev.characterName(), framed: false };
                this.addChild(head); this.addChild(z);
                this._s.set(ev, e);
            }
            const bmp = e.head.bitmap;
            if (!e.framed && bmp.isReady()) {   // (the facing-down standing frame's head: the top ~29% of the frame)
                const big = ImageManager.isBigCharacter(e.name), pw = bmp.width / (big ? 3 : 12), ph = bmp.height / (big ? 4 : 8);
                const sx = ((big ? 0 : (e.idx % 4) * 3) + 1) * pw, sy = (big ? 0 : Math.floor(e.idx / 4) * 4) * ph;
                // (the head from the frame's first drawn row down: a child is shorter - its head lower in the frame)
                // (one read of the frame's pixels, cached by the sheet and the figure - not a read a pixel)
                const ck = e.name + "#" + e.idx;
                let top = headTop[ck];
                if (top === undefined) {
                    top = 0;
                    try {
                        const px = bmp.context.getImageData(sx, sy, pw, Math.round(ph * 0.6)).data, x0 = Math.round(pw * 0.25), x1 = Math.round(pw * 0.75);
                        find: for (let y = 0; y < Math.round(ph * 0.6); y++) for (let x = x0; x < x1; x++) if (px[(y * pw + x) * 4 + 3] > 0) { top = y; break find; }
                    } catch (er) { top = Math.round(ph * 0.06); }
                    headTop[ck] = top;
                }
                const hh = Math.round(ph * 0.25);
                e.head.setFrame(sx, sy + top, pw, hh); e.mid = Math.round(hh * 0.45); e.framed = true;
            }
            const b = SLEEP_OF.get(ev).bed;   // (the head's middle on the pillow's middle; on a side bed turned with its top to the pillow's end)
            e.head.x = Math.round($gameMap.adjustX(b.px / 48) * tw);
            e.head.y = Math.round($gameMap.adjustY(b.py / 48) * th);
            e.head.rotation = b.side ? b.side * Math.PI / 2 : 0;
            e.head.visible = e.framed;
            const k = (this._t + ev.eventId() * 37) % 120;
            e.z.x = e.head.x + 8; e.z.y = e.head.y - 12 - Math.round(k / 12);
            e.z.opacity = Math.round(255 * Math.sin(Math.PI * k / 120));
        }
        for (const [ev, e] of this._s) if (!seen.has(ev)) { this.removeChild(e.head); this.removeChild(e.z); this._s.delete(ev); }
    };
    const _createLower = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _createLower.call(this);
        this._spiacy = new Sprite_Spiacy();
        this._tilemap.addChild(this._spiacy);
    };
    const _upd = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() { _upd.call(this); if (this._spiacy) this._spiacy.update(); };

    // a sleeper's own place takes no talk (he is in his bed); the doors shut by the hour take the lockpick
    T.onEventStart(ev => {
        if (SLEEP_OF.has(ev)) return true;
        return doorStart(ev);
    }, { owner: PLUGIN, priority: "instead" });
    function quietSleepers() {
        const SB = window.SpeechBubbles;
        if (!SB || !SB.say || SB.say._wlam) return;
        const say = SB.say;
        SB.say = function(ch, text, frames) { if (ch && SLEEP_OF.has(ch)) return; return say.apply(this, arguments); };
        SB.say._wlam = true;
    }
    let tick = 0;
    T.onMapUpdate(() => {
        if (++tick % 10) return;
        updateSleep();
        updateWake();
    }, { owner: PLUGIN, name: "sleep" });
    T.on("mapReady", () => { try { quietSleepers(); setupRoom(); updateSleep(); } catch (e) { room = null; console.error("[Wlamania]", e); } }, { owner: PLUGIN });
    T.on("zamekStuk", e => noise(e, WAKE.click, WAKE.clickNear), { owner: PLUGIN });
    T.on("zamekPekl", e => noise(e, WAKE.snap, WAKE.snapNear), { owner: PLUGIN });

    window.Wlamania = T.register(PLUGIN, {
        SLEEP, WAKE, PILLOWS, DOOR_LEVEL, doorOf, doorShut, room: () => room, sleepers, wakeUp, plainBeds, pillowsOf, nightKey,
        sleepOf: ev => SLEEP_OF.get(ev) || null,
        wakeOf: key => (room ? room.wake[key] || 0 : 0), state: store
    });
})();
