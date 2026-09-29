// ChoppableTree.js split in four (ChoppableTree.js, ChoppableTree_Objects.js, ChoppableTree_Swing.js, ChoppableTree_Render.js - stage 3,
// batch E2) without the game: window.ChoppableTree keeps every name it had before the split (Storm, Forestry, Hunting, Farming_Render,
// Combat and the tests use them), the swings' table is there while Combat_Fight.js loads (before the parts), the parts are in the
// family's bag and refuse the wrong order with a readable error; the tags of every event of every map (data/Map*.json) read the old way
// (the plugin's own regexes until 2026-09-29) and the new way (Tawerna.tag on the note) give the same numbers; an older save's
// $gameSystem._treeFruit / _smoulder are adopted into _tw (the old names still lead there - Storm.js writes _smoulder); the bus's
// "chop" when a rock, an ore vein, a bush and a pine are finished.
const fs = require("fs");
const path = require("path");
const unit = require("../lib/unit.js");

// window.ChoppableTree before the split (ChoppableTree.js 2026-09-28)
const OLD_API = ["isTree", "treeConfig", "isLow", "isPine", "isCharred", "charTree", "strikeableTrees", "emberLights", "emberSpots", "EMBER_FRONT",
    "EMBER_LIFE", "CHARCOAL", "CONE", "swingKind", "swingKindOf"];
const FILES = ["TawernaCore", "ChoppableTree", "ChoppableTree_Objects", "ChoppableTree_Swing", "ChoppableTree_Render"];
const DATA = path.join(__dirname, "..", "..", "data");

// the readers as ChoppableTree.js had them until 2026-09-29 (its own regexes on the event's note)
function oldRead(note, tag, defaults, whenNoTag) {
    const m = new RegExp("<" + tag + "(?::\\s*([^>]*))?>", "i").exec(note || "");
    if (!m && !whenNoTag) return null;
    const cfg = Object.assign({}, m ? defaults : whenNoTag);
    for (const pair of m ? (m[1] || "").split(",") : []) {
        const [key, value] = pair.split("=").map(s => s.trim().toLowerCase());
        if (key in cfg && value !== undefined && isFinite(Number(value))) cfg[key] = Number(value);
    }
    return cfg;
}
function oldOccupy(note) {
    const m = /<Occupy(?::\s*([^>]*))?>/i.exec(note || "");
    if (!m) return null;
    const tag = {};
    for (const pair of (m[1] || "").split(",")) {
        const [key, value] = pair.split("=").map(s => s.trim().toLowerCase());
        if (["left", "right", "up", "down", "soft"].includes(key) && value !== undefined && isFinite(Number(value))) tag[key] = Number(value);
    }
    return tag;
}

// a save as the game stores it, read back: plain fields of a Game_System
function oldSave(Game_System) {
    const sys = JSON.parse(JSON.stringify({ _treeFruit: { "3:12": 35 }, _smoulder: { "3:40": 950.5 }, _other: 1 }));
    Object.setPrototypeOf(sys, Game_System.prototype);
    return sys;
}

unit.test(t => {
    function Game_System() {}
    Game_System.prototype.dayNightDay = () => 40;
    Game_System.prototype.dayNightHour = () => 12;
    Game_System.prototype.clearLand = function(mapId, tiles) { (this.cleared = this.cleared || []).push({ mapId, tiles }); };
    let sys = null;
    const switches = {}, gained = [];
    const globals = {
        Game_System, $dataItems: unit.data("Items"),
        $gameSelfSwitches: { value: k => !!switches[k.join(",")], setValue: (k, v) => { switches[k.join(",")] = v; } },
        $gameParty: { gainItem: (item, n) => gained.push([item.id, n]), hasItem: () => false },
        $gameTemp: { pushLootPopup() {} }
    };
    Object.defineProperty(globals, "$gameSystem", { get: () => sys, enumerable: true, configurable: true });
    const w = unit.load(FILES, { globals });
    const CT = w.ChoppableTree, TW = w.Tawerna, P = TW.api("ChoppableTree_parts");

    // ---- the API and the parts
    t.check("window.ChoppableTree has every name it had before the split", OLD_API.every(k => k in CT), OLD_API.filter(k => !(k in CT)));
    t.check("... it is the core's ChoppableTree (Tawerna.api) and the parts are in the bag: core, objects, swing, render",
        TW.api("ChoppableTree") === CT && Object.keys(P || {}).join() === "core,objects,swing,render", P && Object.keys(P));
    t.check("... every function in it is a plain, writable field", Object.keys(CT).filter(k => typeof CT[k] === "function").every(k => Object.getOwnPropertyDescriptor(CT, k).writable));
    const bare = unit.load(["TawernaCore", "ChoppableTree"], { globals: { Game_System } }).ChoppableTree;
    t.check("the swings' table is there without the parts (Combat_Fight.js reads it while it loads): club 18, knockdown 17, roll 16, crouch 6",
        bare.swingKindOf("Swing_Club") === 18 && bare.swingKindOf("knockdown") === 17 && bare.swingKindOf("Swing_Roll") === 16 && bare.swingKindOf("Swing_Crouch") === 6 &&
        bare.swingKind(16).frames === 22 && bare.EMBER_LIFE === 0.7);
    let err = "";
    try { unit.load(["TawernaCore", "ChoppableTree_Render"]); } catch (e) { err = String(e.message); }
    t.check("ChoppableTree_Render.js without ChoppableTree.js above it: a readable error", /ChoppableTree_Render\.js: musi być pod ChoppableTree\.js/.test(err), err);

    // ---- the tags of every event on every map: the old regexes and the core's reader
    const C = P.core, O = P.objects;
    const fake = (mapId, ev) => ({ _mapId: mapId, _eventId: ev.id, x: ev.x, y: ev.y, event: () => ev,
        characterName: () => (ev.pages[0] && ev.pages[0].image && ev.pages[0].image.characterName) || "" });
    const KINDS = [["Tree", C.TREE_DEFAULTS], ["Rock", C.ROCK_DEFAULTS], ["Stump", C.STUMP_DEFAULTS], ["Log", C.LOG_DEFAULTS], ["Bush", C.BUSH_DEFAULTS]];
    let events = 0, tagged = 0, checks = 0;
    const diffs = [], kinds = {};
    for (const f of fs.readdirSync(DATA).filter(n => /^Map\d+\.json$/.test(n)).sort()) {
        const map = JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8")), mapId = Number(f.replace(/\D/g, ""));
        for (const ev of map.events || []) {
            if (!ev) continue;
            events++;
            if (/<(Tree|Rock|Stump|Log|Bush|Occupy)[:>]/i.test(ev.note || "")) tagged++;
            for (const [tag, D] of KINDS) {
                for (const when of [undefined, D]) {
                    checks++;
                    const a = oldRead(ev.note, tag, D, when), b = C.readConfig(fake(mapId, ev), tag, D, when);
                    if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push({ map: mapId, id: ev.id, tag, old: a, now: b });
                }
            }
            checks++;
            const a = oldOccupy(ev.note), b = C.occupyTag(fake(mapId, ev));
            if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push({ map: mapId, id: ev.id, tag: "Occupy", old: a, now: b });
            const e = fake(mapId, ev), kind = O.treeConfig(e) ? "tree" : O.rockConfig(e) ? "rock" : O.stumpConfig(e) ? "stump" : O.logConfig(e) ? "log" : O.bushConfig(e) ? "bush" : "";
            if (kind) kinds[kind] = (kinds[kind] || 0) + 1;
        }
    }
    t.check("<Tree>, <Rock>, <Stump>, <Log>, <Bush>, <Occupy> on every event of every map: the old regexes and Tawerna.tag give the same numbers",
        diffs.length === 0 && events > 1000 && tagged > 400, { events, tagged, checks, diffs: diffs.slice(0, 3) });
    t.check("... and the maps hold every kind: trees, rocks (by their pictures too), stumps, logs, bushes (by their pictures)",
        ["tree", "rock", "stump", "log", "bush"].every(k => kinds[k] > 10), kinds);
    const ore = { id: 1, note: "", pages: [{ image: { characterName: "!$Rock_Ore_Iron" } }] }, bush = { id: 2, note: "", pages: [{ image: { characterName: "!$Bush_Big" } }] };
    const planted = { id: 1001, note: "<Tree:hits=4,sway=0.9,drop=77,dropmin=1,dropmax=2,scale=0.4666666666666667,nostump=1><Planted>", pages: [{ image: { characterName: "!$Pine_A" } }] };
    const pc = O.treeConfig(fake(3, planted));
    t.check("a picture is enough: an ore vein (26 blows, iron ore 85), a big bush (branches 3-5); Forestry's planted pine reads its note (scale, nostump)",
        O.rockConfig(fake(3, ore)).hits === 26 && O.rockConfig(fake(3, ore)).drop === 85 && O.bushConfig(fake(3, bush)).dropmax === 5 && pc.scale === 0.4666666666666667 && pc.nostump === 1 && pc.hits === 4);

    // ---- an older save: _treeFruit and _smoulder adopted
    sys = oldSave(Game_System);
    const fruit = C.fruitState(), smoulder = C.smoulderState();
    t.check("the old save's fruit trees and smouldering trees are adopted: _tw.treeFruit, _tw.smoulder",
        fruit === sys._tw.treeFruit && fruit["3:12"] === 35 && smoulder === sys._tw.smoulder && smoulder["3:40"] === 950.5, sys._tw);
    t.check("... the old names $gameSystem._treeFruit / _smoulder are hidden ways to them",
        sys._treeFruit === fruit && sys._smoulder === smoulder && !Object.keys(sys).includes("_treeFruit") && !Object.keys(sys).includes("_smoulder"));
    (sys._smoulder = sys._smoulder || {})["3:41"] = 961;   // (as Storm.js writes it)
    t.check("... Storm.js writing $gameSystem._smoulder writes _tw.smoulder; the embers read it (40 * 24 + 12 - 950.5 = 21.5 h)",
        sys._tw.smoulder["3:41"] === 961 && P.render.smoulderAge({ _mapId: 3, _eventId: 40 }) === 21.5 && P.render.smoulderAge({ _mapId: 3, _eventId: 99 }) === -1);
    const saved = JSON.parse(JSON.stringify(sys));
    t.check("... saved again: only _tw (with versions), none of the old names; the rest as it was",
        !("_treeFruit" in saved) && !("_smoulder" in saved) && saved._other === 1 && saved._tw.treeFruit["3:12"] === 35 && saved._tw._v.treeFruit === 1 && saved._tw._v.smoulder === 1,
        Object.keys(saved));
    t.check("... fruit picked 5 days ago (day 35, regrows after 5) hangs again in summer", O.shouldFruit(fake(3, { id: 12 }), { fruit: 139 }) === true && O.fruitSeasonNow() === true);

    // ---- the bus: "chop" when a thing is finished
    const bus = [];
    TW.on("chop", e => bus.push(e), { owner: "ChoppableTreeUnit" });
    const thing = (id, pic, note, extra) => Object.assign({ _mapId: 3, _eventId: id, x: 10 + id, y: 5, event: () => ({ id, note: note || "", pages: [{ image: { characterName: pic } }] }),
        characterName: () => pic, holdInvisibleUntilPageChange() { this.hidden = true; } }, extra);
    O.finishBreak.call(thing(77, "!$Rock_Ore_Iron", "", { _breakKind: "rock", _breakT: 29, _dropCount: 3 }));
    O.finishBreak.call(thing(78, "!$Rock_Pebbles", "", { _breakKind: "rock", _breakT: 29, _dropCount: 1 }));
    O.finishBreak.call(thing(79, "!$Bush_Big", "", { _breakKind: "bush", _breakT: 21 }));
    O.finishTreeFall.call(thing(12, "!$Pine_B", "<Tree:hits=16,drop=61,dropmin=6,dropmax=8>", { _treeFallT: 55 }));
    const [ev1, ev2, ev3, ev4] = bus;
    t.check("chop: an ore vein broken - kind ore, done, its 3 pieces of iron ore in the bag, its tile freed, A switched on",
        bus.length === 4 && ev1.kind === "ore" && ev1.done === true && ev1.hand === false && JSON.stringify(ev1.drops) === '[{"item":85,"amount":3}]' && ev1.mapId === 3 && ev1.id === 77 &&
        ev1.x === 87 && ev1.y === 5 && switches["3,77,A"] === true && sys.cleared.some(c => c.tiles.some(p => p.x === 87 && p.y === 5)), ev1 && Object.assign({}, ev1, { event: undefined }));
    t.check("... pebbles picked up by hand: kind rock, hand; a big bush cut: kind bush, 3-5 branches",
        ev2.kind === "rock" && ev2.hand === true && ev2.drops[0].item === 64 && ev3.kind === "bush" && ev3.drops[0].item === 77 && ev3.drops[0].amount >= 3 && ev3.drops[0].amount <= 5 && ev3.done === true);
    t.check("... a grown pine felled: kind tree, 6-8 wood and 1-3 cones, not done (its stump is left), A on, B off",
        ev4.kind === "tree" && ev4.done === false && ev4.charred === false && ev4.drops[0].item === 61 && ev4.drops[0].amount >= 6 && ev4.drops[0].amount <= 8 &&
        ev4.drops[1].item === 147 && ev4.drops[1].amount >= 1 && switches["3,12,A"] === true && !switches["3,12,B"], ev4 && ev4.drops);
    t.check("... what went into the bag is what the bus says", JSON.stringify(gained) === JSON.stringify(bus.flatMap(e => e.drops.map(d => [d.item, d.amount]))), gained);
});
