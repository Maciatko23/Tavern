//=============================================================================
// Ogrodki.js
//=============================================================================
// (2026-11-13, the user on the new world: every villager's hut gets its own small fenced vegetable garden; the vegetables LIVE - they grow
// with the seasons and they belong to the villagers; the hero CAN steal them, but if somebody sees it, that villager's trust drops)
//   1. THE GARDEN: an event (transparent, passable) at the soil's top-left cell with the note <Ogrodek:w,h,owner,rows>
//        w, h   the soil's size in cells        owner  the villager's key (ASCII)
//        rows   the soil rows that hold crops, digits from the top row: "02" = rows 0 and 2 (row 1 is a bare footpath)
//      The fence is tiles (not ours). The event's name "Ogródek: Chata tkaczki" is what the popups call the garden.
//   2. THE PICTURE: one sprite in the map's tilemap (z 1: over the ground, under the people), the garden baked ONCE into a bitmap from the
//      farm's own crops (img/system/Farm_Crops.png, 48 x 48 frames: column = stage 0..3, row = crop 0 potato / 1 carrot / 2 cabbage), each
//      lifted 8 px as the farm draws its plants. Every crop row has one crop (a stable hash of owner + row; neighbours differ). The stage
//      comes from the season: spring 0 then 1; summer 2 then 3 (ripe); autumn 3 until 70% of it, then bare; winter bare but the cabbage (2).
//      A picked cell is bare for REGROW days. The bake is looked at every 60 frames and redone only when the stages / picked cells changed.
//   3. STEALING: OK while facing a ripe cell: a popup "somebody else's vegetables, press again"; the second press within 3 s picks them.
//      Anybody (a "Npc" picture or a TownLife resident) within 7 cells (4 at night) sees it: trust of the owner -1 and a red popup.
//      The state (Tawerna.state "ogrodki"): the picked cells by map and cell, thefts / witnessed thefts / trust by owner.
// Costs: one sprite a garden placed every frame (numbers only); the bake once a stage change; the key handler only on a press.

/*:
 * @target MZ
 * @plugindesc Ogródki wieśniaków: żywe warzywa rosnące z porami roku (<Ogrodek:szer,wys,właściciel,rzędy> w notatce zdarzenia), kradzież z zaufaniem. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * Ogrodki.js
 *   Zdarzenie ogródka (przezroczyste, przechodnie) stoi na lewej górnej kratce ziemi. Notatka:
 *     <Ogrodek:4,3,tkaczka,02>
 *   czyli ziemia 4 x 3 kratki, właścicielka "tkaczka", warzywa w rzędach 0 i 2 (rząd 1 to ścieżka).
 *   Nazwa zdarzenia, np. "Ogródek: Chata tkaczki", pokazuje się w komunikatach.
 *   Warzywa (ziemniaki, marchew, kapusta) rosną z porami roku. Rosną na ziemi cudze:
 *   stań twarzą do dojrzałej kratki i naciśnij OK dwa razy (w ciągu 3 s), żeby je zerwać.
 *   Jeśli ktoś w pobliżu zobaczy kradzież (w dzień 7 kratek, w nocy 4), właściciel traci do ciebie zaufanie.
 *   Zerwana kratka jest goła przez 8 dni.
 *   API: Ogrodki.trust(właściciel), thefts(właściciel), seen(właściciel), gardens(), stage(rodzaj), cells(mapa).
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    const TILE = 48, LIFT = 8, REGROW = 8, CONFIRM_FRAMES = 180, CHECK_EVERY = 60;
    const DAY_RANGE = 7, NIGHT_RANGE = 4;
    const CROPS = [   // the farm's rows in Farm_Crops.png
        { row: 0, item: 71, min: 1, max: 2 },   // potato
        { row: 1, item: 72, min: 1, max: 2 },   // carrot
        { row: 2, item: 73, min: 1, max: 1 }    // cabbage
    ];
    const NOTE_RE = /<Ogrodek:\s*(\d+)\s*,\s*(\d+)\s*,\s*([A-Za-z0-9_]+)\s*,\s*(\d+)\s*>/i;
    const CALM = { only: ["transfer", "event", "message"] };   // (nothing while an event runs or a message is open)

    const store = T.state.define("ogrodki", { picked: {}, thefts: {}, seen: {}, trust: {} }, { owner: "Ogrodki" });

    // ------------------------------------------------------------------
    // The garden of an event (parsed once, kept on the event)
    // ------------------------------------------------------------------
    const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); h = Math.imul(h ^ (h >>> 15), 2246822507); return (h ^ (h >>> 13)) >>> 0; };
    // (2026-11-15: kept beside the events, not ON them - the garden points back at its event, and a game object holding it could
    // not be saved: "Object too deep" on every save in Podgrodzie)
    const GARDENS = new WeakMap();
    function gardenOf(ev) {
        if (!ev || !(ev instanceof Game_Event)) return null;
        if (GARDENS.has(ev)) return GARDENS.get(ev);
        const d = ev.event && ev.event(), m = d && NOTE_RE.exec(d.note || "");
        if (!m) { GARDENS.set(ev, null); return null; }
        const w = Number(m[1]), h = Number(m[2]), owner = m[3], rows = [];
        let prev = -1;
        for (const ch of m[4]) {
            const r = Number(ch);
            if (r >= h || rows.some(q => q.r === r)) continue;
            let kind = hashStr(owner + ":" + r) % CROPS.length;
            if (kind === prev) kind = (kind + 1) % CROPS.length;   // (neighbouring crop rows differ)
            rows.push({ r, kind }); prev = kind;
        }
        const g = { ev, w, h, owner, rows, name: String((d.name || "").replace(/^Ogr[oó]dek:\s*/i, "") || owner), cells: [], dirty: true, last: null };
        for (const q of rows) for (let c = 0; c < w; c++) g.cells.push({ dx: c, dy: q.r, kind: q.kind });
        g.last = new Int8Array(g.cells.length).fill(-9);
        g.now = new Int8Array(g.cells.length);
        GARDENS.set(ev, g);
        return g;
    }
    const gardensNow = () => ($gameMap ? $gameMap.events() : []).map(gardenOf).filter(Boolean);

    // ------------------------------------------------------------------
    // The stage: -1 bare, 0 sprouts .. 3 ripe
    // ------------------------------------------------------------------
    function seasonStage(kind) {
        const s = T.time.season(), dd = T.time.dayOfSeason(), L = T.time.seasonLength();
        if (s === 0) return dd <= L * 0.3 ? 0 : 1;
        if (s === 1) return dd <= L * 0.5 ? 2 : 3;
        if (s === 2) return dd <= L * 0.7 ? 3 : -1;
        return kind === 2 ? 2 : -1;
    }
    const cellKey = (mapId, x, y) => mapId + ":" + x + "," + y;
    function isPicked(mapId, x, y) {
        const d = store().picked[cellKey(mapId, x, y)];
        const ago = T.time.day() - d;   // (a day in the future - a time jump back in a test - is no pick)
        return d !== undefined && ago >= 0 && ago < REGROW;
    }
    function stageOf(g, cell) {
        const ev = g.ev;
        if (isPicked(ev._mapId, ev.x + cell.dx, ev.y + cell.dy)) return -1;
        return seasonStage(cell.kind);
    }

    // ------------------------------------------------------------------
    // The picture
    // ------------------------------------------------------------------
    function bake(g, sheet) {
        const bm = new Bitmap(g.w * TILE, g.h * TILE), ctx = bm.context;
        ctx.imageSmoothingEnabled = false;
        for (let i = 0; i < g.cells.length; i++) {
            const st = g.now[i], c = g.cells[i];
            if (st < 0) continue;
            ctx.drawImage(sheet.canvas, st * TILE, CROPS[c.kind].row * TILE, TILE, TILE, c.dx * TILE, c.dy * TILE, TILE, TILE);
        }
        bm._baseTexture.update();
        return bm;
    }
    function refresh(g, sp) {
        let diff = false;
        for (let i = 0; i < g.cells.length; i++) {
            const st = stageOf(g, g.cells[i]);
            g.now[i] = st;
            if (st !== g.last[i]) diff = true;
        }
        if (!diff && sp.bitmap) return;
        const sheet = ImageManager.loadSystem("Farm_Crops");
        if (!sheet.isReady()) return;   // (looked at again at the next check)
        const old = sp.bitmap;
        sp.bitmap = bake(g, sheet);
        if (old) old.destroy();
        g.last.set(g.now);
    }
    T.sprite.hook({ owner: "Ogrodki", method: "update", when: s => !!gardenOf(s._character), after(s) { gardenUpdate.call(s); } });
    function gardenUpdate() {
        const ch = this._character, g = gardenOf(ch);
        if (!g) return;
        const tm = this.parent;
        if (!tm) return;
        let sp = this._ogrSp;
        if (!sp || this._ogrFor !== ch) {
            this._ogrFor = ch;
            if (sp && sp.parent) sp.parent.removeChild(sp);
            sp = this._ogrSp = new Sprite();
            sp.z = 1;
            sp._ogrAt = 0;
            this._wyKeep = true;   // (Wydajnosc.js: a settled event far off is not updated every frame - the garden must be placed)
        }
        if (!sp.parent) tm.addChild(sp);
        const tw = $gameMap.tileWidth();
        const ox = Math.round($gameMap.adjustX(ch.x) * tw), oy = Math.round($gameMap.adjustY(ch.y) * tw);
        sp.x = ox; sp.y = oy - LIFT;
        const on = ox < Graphics.width && ox + g.w * tw > 0 && oy - LIFT < Graphics.height && oy + g.h * tw > 0;
        sp.visible = on;
        if (g.dirty || (++sp._ogrAt >= CHECK_EVERY && on) || !sp.bitmap) {
            sp._ogrAt = 0; g.dirty = false;
            refresh(g, sp);
        }
    }

    // ------------------------------------------------------------------
    // Stealing
    // ------------------------------------------------------------------
    let press = { key: "", frame: -9999 };
    function cellAt(x, y) {
        const mapId = $gameMap.mapId();
        for (const ev of $gameMap.events()) {
            const g = gardenOf(ev);
            if (!g) continue;
            const dx = x - ev.x, dy = y - ev.y;
            if (dx < 0 || dy < 0 || dx >= g.w || dy >= g.h) continue;
            const cell = g.cells.find(c => c.dx === dx && c.dy === dy);
            if (cell) return { g, cell, x, y, mapId };
        }
        return null;
    }
    const isNight = () => { const h = T.time.hour(); return h >= 21 || h < 5; };
    const isPerson = ev => {
        if (!ev || ev._erased || ev._transparent) return false;
        if (ev._town && !ev._town.hidden) return true;
        const n = ev.characterName ? ev.characterName() : "";
        return typeof n === "string" && n.indexOf("Npc") >= 0;
    };
    function witnesses(x, y) {
        const W = T.api("Widzenie");   // (2026-11-19: one rule of sight - who sees the garden's cell now; this count only without it)
        if (W && W.seenBy) return W.seenBy(x, y).length;
        const R = isNight() ? NIGHT_RANGE : DAY_RANGE, R2 = R * R;
        let n = 0;
        for (const ev of $gameMap.events()) {
            if (!isPerson(ev)) continue;
            const dx = ev.x - x, dy = ev.y - y;
            if (dx * dx + dy * dy <= R2) n++;
        }
        return n;
    }
    function bump(field, owner) { const s = store(); s[field][owner] = (s[field][owner] || 0) + (field === "trust" ? -1 : 1); }
    function steal(c) {
        const crop = CROPS[c.cell.kind], item = $dataItems[crop.item];
        const n = crop.min + Math.floor(Math.random() * (crop.max - crop.min + 1));
        if (item && $gameParty.maxItems(item) - $gameParty.numItems(item) < n) {
            T.popup.need(item.iconIndex, "Nie zmieści się w plecaku: " + item.name);
            return;
        }
        if (item) $gameParty.gainItem(item, n);
        T.audio.se("Item2", { volume: 90, pitch: 105 });
        const s = store(), day = T.time.day();
        s.picked[cellKey(c.mapId, c.x, c.y)] = day;
        for (const k of Object.keys(s.picked)) if (day - s.picked[k] >= REGROW) delete s.picked[k];   // (the regrown ones are forgotten)
        c.g.dirty = true;
        bump("thefts", c.g.owner);
        if (witnesses($gamePlayer.x, $gamePlayer.y) > 0) {
            bump("seen", c.g.owner); bump("trust", c.g.owner);
            T.popup("Ktoś to widział!", { color: "#ff8080" });
        }
    }
    const _triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && T.isCalm(null, CALM)) {
            const d = this.direction(), x = $gameMap.roundXWithDirection(this.x, d), y = $gameMap.roundYWithDirection(this.y, d);
            const c = $gameMap.isValid(x, y) ? cellAt(x, y) : null;
            if (c) {
                const st = stageOf(c.g, c.cell);
                if (st < 0) T.popup("Tu nic nie rośnie.", { color: "info" });
                else if (st < 3) T.popup("Jeszcze nie urosło.", { color: "info" });
                else {
                    const key = cellKey(c.mapId, x, y), f = Graphics.frameCount;
                    if (press.key === key && f - press.frame <= CONFIRM_FRAMES) { press.key = ""; steal(c); }
                    else { press.key = key; press.frame = f; T.popup("Ogródek " + c.g.name + ": cudze warzywa. Naciśnij jeszcze raz, żeby zerwać.", { color: "info" }); }
                }
                return true;
            }
        }
        return _triggerButtonAction.call(this);
    };

    // ------------------------------------------------------------------
    // API
    // ------------------------------------------------------------------
    // (the test's own events: a season change reloads $dataMap, so they are put back before the sprites are made)
    const testData = [];
    const _createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        for (const d of testData) if (d.mapId === $gameMap.mapId() && !$dataMap.events[d.data.id]) $dataMap.events[d.data.id] = d.data;
        _createCharacters.call(this);
    };
    const api = { gardenOf,   // (the garden of an event - for the tests; it is not kept on the event)
        stage: kind => seasonStage(kind === undefined ? 0 : kind),   // the stage of a crop kind (0 potato, 1 carrot, 2 cabbage) now
        trust: owner => store().trust[owner] || 0,
        thefts: owner => store().thefts[owner] || 0,
        seen: owner => store().seen[owner] || 0,
        gardens: () => gardensNow().map(g => ({ id: g.ev.eventId(), x: g.ev.x, y: g.ev.y, w: g.w, h: g.h, owner: g.owner, name: g.name, rows: g.rows.map(q => q.r), kinds: g.rows.map(q => q.kind) })),
        cells: () => { const out = []; for (const g of gardensNow()) for (const c of g.cells) out.push({ x: g.ev.x + c.dx, y: g.ev.y + c.dy, owner: g.owner, kind: c.kind, stage: stageOf(g, c) }); return out; },
        // (the test: a garden event (and a person) made in the running map)
        _addEvent(x, y, name, note, characterName) {
            const id = $dataMap.events.length;
            const page = { conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 },
                directionFix: false, image: { tileId: 0, characterName: characterName || "", direction: 2, pattern: 1, characterIndex: 0 }, list: [{ code: 0, indent: 0, parameters: [] }],
                moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: characterName ? 1 : 0,
                stepAnime: false, through: !characterName, trigger: 0, walkAnime: true };
            $dataMap.events[id] = { id, name: name || "", note: note || "", pages: [page], x, y };
            testData.push({ mapId: $gameMap.mapId(), data: $dataMap.events[id] });
            const ev = new Game_Event($gameMap.mapId(), id);
            $gameMap._events[id] = ev;
            const ss = SceneManager._scene && SceneManager._scene._spriteset;
            if (ss) { const sp = new Sprite_Character(ev); ss._characterSprites.push(sp); ss._tilemap.addChild(sp); }
            return id;
        },
        _addForTest(x, y, w, h, owner, rows) { return api._addEvent(x, y, "Ogródek: Chata " + owner, "<Ogrodek:" + w + "," + h + "," + owner + "," + rows + ">"); }
    };
    window.Ogrodki = T.register("Ogrodki", api);

    // ------------------------------------------------------------------
    // (2026-11-13, the user: „ogrodzenia ze zwierzętami też mają mieć wejście - mieszkańcy będą wchodzić i karmić zwierzęta, zbierać
    // jajka, wełnę”) the pens have a gate now; an animal whose note is <Zagroda:owner,x0,y0,x1,y1> never steps out of its run (x0..x1,
    // y0..y1) - the gate lets people in, not the hens out
    // ------------------------------------------------------------------
    const runOf = ev => {
        if (ev._zagRun !== undefined) return ev._zagRun;
        const d = ev.event && ev.event(), m = d && /<Zagroda:\s*\w+\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*>/i.exec(d.note || "");
        return (ev._zagRun = m ? [+m[1], +m[2], +m[3], +m[4]] : null);
    };
    const _canPass = Game_CharacterBase.prototype.canPass;
    Game_CharacterBase.prototype.canPass = function(x, y, d) {
        if (this instanceof Game_Event) {
            const r = runOf(this);
            if (r) {
                const nx = $gameMap.roundXWithDirection(x, d), ny = $gameMap.roundYWithDirection(y, d);
                if (nx < r[0] || nx > r[2] || ny < r[1] || ny > r[3]) return false;
            }
        }
        return _canPass.call(this, x, y, d);
    };
    const _setupPage = Game_Event.prototype.setupPage;
    Game_Event.prototype.setupPage = function() { this._zagRun = undefined; _setupPage.call(this); };
})();
