// Stage 3, batch B2: Birds, Dog and Journal keep their state in the core (Tawerna.state "birds", "dog", "journal"; Livestock has none).
// The four saves made before (tests/fixtures) load with it: the old $gameSystem._birds / _dog / _journal are adopted (the same data in
// _tw, the old keys only hidden aliases); the tamed dog of day40_farm comes out by its kennel and keeps working, the hens walk in the
// coop's yard, the journal keeps its goals and notes; a new save has only the new places and loads again. The four plugins run on
// the core's map clock (their updaters listed), and the journal hears the bus: a storyStep on the map and its goals are looked at
// at once, not at the next 30-frame look.
// Stage 3 (batch E1): Farming's _farm adopted into _tw.farm (every fixture; $gameSystem._farm a hidden way there - 8 plugins read it):
// day40_farm's 24 buildings on grandpa's field and the hut's furniture, its plots, the pantry's and the larder's food and the hut
// itself come back and Farming's parts answer for them; the new save has only _tw.farm and loads again.
// Stage 6: Farming's loose keys $gameSystem._lastSleep, _bagWater and _vesselBag are fields of _tw.farm now (lastSleep, bagWater,
// vesselBag); the old names lead there (Game_System.prototype, never saved) and an older save's own fields move in on loading.
//   CDP_PORT=9404 node tests/core_fixtures_b2_test.js
const kit = require("./lib/kit.js");

const KEYS = { birds: "_birds", dog: "_dog", journal: "_journal" };
const rawSystem = name => { const fx = kit.fixture(name); return (typeof fx.save === "string" ? JSON.parse(fx.save) : fx.save).system; };
const DOG_KEYS = ["tame", "trust", "fedAt", "map", "mode", "hurtUntil"];
// Farming's saved farm, counted the same way in the fixture's text and in the game
const farmOf = f => { const all = Object.values(f.buildings).reduce((a, l) => a.concat(l || []), []);
    return { buildings: all.length, byMap: Object.keys(f.buildings).filter(k => (f.buildings[k] || []).length).sort().map(k => k + ":" + f.buildings[k].length), plots: Object.values(f.plots).reduce((a, p) => a + Object.keys(p).length, 0),
        nextId: f.nextId, stores: all.filter(b => b.store && b.type !== "stockpile" && b.type !== "doghouse").map(b => b.type + ":" + JSON.stringify(b.store)).sort() }; };   // (not what the dog fills)
const FARM = `(function(){ const s = $gameSystem, f = Farming.farm(), farmOf = ${farmOf.toString()};
    return Object.assign(farmOf(f), { same: f === s._tw.farm && s._farm === f, hidden: !Object.keys(s).includes("_farm"), v: Tawerna.state.version("farm") }); })()`;
// (stage 6) Farming's old loose keys and their fields in _tw.farm: not own fields of $gameSystem any more, the old name reads the field
const LOOSE_KEYS = [["_lastSleep", "lastSleep"], ["_bagWater", "bagWater"], ["_vesselBag", "vesselBag"]];
const LOOSE = `(function(){ const s = $gameSystem, f = s._tw.farm;
    return ${JSON.stringify(LOOSE_KEYS)}.map(([k, n]) => ({ k, own: Object.prototype.hasOwnProperty.call(s, k), same: s[k] === f[n], v: f[n] === undefined ? null : f[n] })); })()`;

kit.test({ port: 9404, bootCheck: "the game boots", errorCheck: "no console errors" }, async t => {
    const upd = await t.json("Tawerna.debug.updaters().map(u => u.owner + '.' + u.name)");
    t.check("the four plugins run on the core's map clock (Birds.birds, Livestock.yards, Dog.dog, Journal.goals)",
        ["Birds.birds", "Livestock.yards", "Dog.dog", "Journal.goals"].every(n => upd.includes(n)), upd);
    const states = await t.json("Tawerna.state.keys().map(k => ({ k, spec: Tawerna.state.spec(k) })).filter(s => ['birds', 'dog', 'journal'].includes(s.k)).map(s => s.k + ':' + s.spec.adopt + ':' + s.spec.owner)");
    t.check("their states are defined with the old keys to adopt", states.sort().join() === "birds:_birds:Birds,dog:_dog:Dog,journal:_journal:Journal", states);

    const STATE = `(function(){ const s = $gameSystem, tw = s._tw || {}, old = ${JSON.stringify(KEYS)};
        return Object.keys(old).map(k => ({ k, v: Tawerna.state.version(k), inTw: !!tw[k] && typeof tw[k] === "object", alias: s[old[k]] === tw[k], hidden: !Object.keys(s).includes(old[k]) })); })()`;
    const GOT = `(function(){ const d = Dog.state(), b = Birds.store(), j = Journal.data();
        return { dog: Object.assign(${JSON.stringify(DOG_KEYS)}.reduce((o, k) => (o[k] = d[k], o), {}), { same: d === $gameSystem._tw.dog }),
            birds: { maps: Object.keys(b.maps).sort(), kills: b.kills, eaten: b.eaten, same: b === $gameSystem._tw.birds },
            journal: { done: j.done, notes: j.notes.map(n => n.title), seen: Object.keys(j.seen), pinned: j.pinned, fresh: j.fresh, same: j === $gameSystem._tw.journal } }; })()`;
    for (const name of ["new_story_day1", "tavern_evening", "home_decor_v0", "day40_farm"]) {
        const sys = rawSystem(name);
        t.check(name + ": saved with the old keys (_birds, _dog, _journal), no _tw", !!sys._birds && !!sys._dog && !!sys._journal && !sys._tw);
        t.check(name + " loads", await t.loadFixture(name, { calm: true, needsOff: true }));
        const st = await t.json(STATE);
        t.check("... adopted: _tw.birds / dog / journal (v1), the old keys only hidden aliases", st.every(x => x.v === 1 && x.inTw && x.alias && x.hidden), st);
        const got = await t.json(GOT);
        const dogOk = got.dog.same && DOG_KEYS.every(k => JSON.stringify(got.dog[k]) === JSON.stringify(sys._dog[k]));
        const birdsOk = got.birds.same && got.birds.maps.join() === Object.keys(sys._birds.maps).sort().join() && JSON.stringify(got.birds.kills) === JSON.stringify(sys._birds.kills) && got.birds.eaten === sys._birds.eaten;
        const doneOk = Object.keys(sys._journal.done).every(k => got.journal.done[k] === sys._journal.done[k]);
        const jOk = got.journal.same && doneOk && JSON.stringify(got.journal.notes) === JSON.stringify(sys._journal.notes.map(n => n.title)) &&
            Object.keys(sys._journal.seen).every(k => got.journal.seen.includes(k)) && got.journal.pinned === sys._journal.pinned && got.journal.fresh === false;
        t.check("... the dog (" + (sys._dog.tame ? "tame, " + sys._dog.mode : "wild, trust " + sys._dog.trust) + "), the birds' raid plan and the journal (" +
            Object.keys(sys._journal.done).length + " goals, " + sys._journal.notes.length + " notes) are as saved", dogOk && birdsOk && jOk, { dogOk, birdsOk, jOk, got });
        const farm = await t.json(FARM);
        const want = farmOf(sys._farm);
        t.check("... Farming's _farm adopted into _tw.farm (v1, $gameSystem._farm only a hidden alias): " + want.buildings + " buildings, " + want.plots + " plots, the chests as saved",
            farm.same && farm.hidden && farm.v === 1 && farm.buildings === want.buildings && farm.byMap.join() === want.byMap.join() && farm.plots === want.plots &&
            farm.nextId === want.nextId && farm.stores.join() === want.stores.join(), { farm, want });
        const had = LOOSE_KEYS.filter(([k]) => k in sys), loose = await t.json(LOOSE);
        t.check("... " + (had.length ? had.map(([k, n]) => k + " (" + JSON.stringify(sys[k]) + ") moved into _tw.farm." + n).join(", ") : "no _lastSleep, _bagWater or _vesselBag saved") +
            "; the old names are no own fields and read the farm's", loose.every(x => !x.own && x.same) &&
            had.every(([k]) => JSON.stringify(loose.find(x => x.k === k).v) === JSON.stringify(sys[k])), { loose, had: had.map(([k]) => k) });
    }

    // ================= day40_farm: the tame dog at work, the hens in the coop's yard
    const d0 = await t.json("({ carry: JSON.stringify(Dog.state().carry), clock: Dog.state().clock, map: $gameMap.mapId(), hour: $gameSystem.dayNightHour() })");
    await t.until("!!Dog.dog", 10);
    const pos0 = await t.json("Dog.dog ? { x: Dog.dog._realX, y: Dog.dog._realY } : null");
    await t.frames(900);
    const d1 = await t.json(`(function(){ const g = Dog.dog, s = Dog.stockpile(), d = Dog.state();
        return { dog: !!g, x: g && g._realX, y: g && g._realY, task: g && g._task && g._task.kind, hud: !!(g && g._hud && g._hud.parent), carry: JSON.stringify(d.carry), clock: d.clock,
            stock: s && s.store ? JSON.stringify(s.store) : "", strip: !!(SceneManager._scene._dogStock && SceneManager._scene._dogStock.visible),
            hens: Livestock.animals.filter(a => a.kind() === "hen").length, all: Livestock.animals.length }; })()`);
    const moved = !!pos0 && (Math.abs(d1.x - pos0.x) + Math.abs(d1.y - pos0.y) > 0.5);
    t.check("day40_farm: the tame dog is out on the field (" + d0.hour.toFixed(1) + " h) with its bars over it, the stockpile strip at the top", d1.dog && d1.hud && d1.strip, d1);
    t.check("... and it works: it goes about (moved or busy), its needs run by the clock", (moved || !!d1.task || d1.carry !== d0.carry) && d1.clock > d0.clock, { d0, pos0, d1, moved });
    t.check("... the coop's yard has its three hens (Livestock)", d1.hens === 3 && d1.all >= 3, d1);
    const d40 = await t.json(`(function(){ const f = Farming.farm(), field = f.buildings[3] || [], inHut = f.buildings[100] || [], hut = Farming.hutOf();
        const pantry = field.find(b => b.type === "pantry"), menu = pantry && Farming.menuFor(pantry.x, pantry.y), larder = inHut.find(b => b.type === "larder");
        return { field: field.length, answers: field.filter(b => Farming.buildingAt(b.x, b.y, 3) === b).length, inHut: inHut.map(b => b.type).sort(),
            hut: hut ? hut.mapId + ":" + hut.b.type : null, pantry: menu ? menu.title : null, larder: larder ? Farming.chestStacks(larder).map(s => s.item.id + "x" + s.n) : null,
            plots: Object.keys(f.plots[3] || {}).length }; })()`);
    t.check("day40_farm: 24 buildings on grandpa's field, each where Farming finds it; the hut with its bed, larder and chest; the pantry's menu, the larder's food, 119 plots",
        d40.field === 24 && d40.answers === 24 && d40.inHut.join() === "bed,chest_s,larder" && d40.hut === "3:hut" && /^Spiżarnia/.test(d40.pantry || "") &&
        (d40.larder || []).length === 4 && d40.plots === 119, d40);

    // ================= a new save: only the new places; it loads again
    t.check("saved again (slot 4)", await t.saveTo(4));
    const saved = await t.json(`(async function(){ const s = JSON.parse(await StorageManager.zipToJson(await StorageManager.loadZip(DataManager.makeSavename(4)))).system;
        return { old: ["_birds", "_dog", "_journal"].filter(k => k in s), tw: !!s._tw, dog: s._tw && s._tw.dog && s._tw.dog.tame, notes: s._tw && s._tw.journal && s._tw.journal.notes.length,
            birds: s._tw && s._tw.birds && Object.keys(s._tw.birds.maps).length, v: s._tw && s._tw._v }; })()`);
    const want = rawSystem("day40_farm");
    t.check("... the new save has _tw.birds / dog / journal (version 1) and none of _birds, _dog, _journal", saved.old.length === 0 && saved.tw && saved.dog === true &&
        saved.notes >= want._journal.notes.length && saved.birds >= Object.keys(want._birds.maps).length && saved.v.dog === 1 && saved.v.journal === 1 && saved.v.birds === 1, saved);
    const fsave = await t.json(`(async function(){ const s = JSON.parse(await StorageManager.zipToJson(await StorageManager.loadZip(DataManager.makeSavename(4)))).system;
        return { old: "_farm" in s, farm: s._tw && s._tw.farm ? (${farmOf.toString()})(s._tw.farm) : null, v: s._tw && s._tw._v && s._tw._v.farm,
            loose: ${JSON.stringify(LOOSE_KEYS.map(([k]) => k))}.filter(k => k in s), lastSleep: s._tw && s._tw.farm ? s._tw.farm.lastSleep : null }; })()`);
    const want40 = farmOf(want._farm);
    t.check("... the new save has _tw.farm (version 1) with the same buildings and plots, and no _farm", !fsave.old && fsave.v === 1 && !!fsave.farm &&
        fsave.farm.buildings === want40.buildings && fsave.farm.byMap.join() === want40.byMap.join() && fsave.farm.plots === want40.plots, { fsave, want40 });
    t.check("... and _tw.farm.lastSleep (" + want._lastSleep + "), none of _lastSleep, _bagWater, _vesselBag", fsave.loose.length === 0 && fsave.lastSleep === want._lastSleep, fsave);
    t.check("... and that save loads again", await t.loadFrom(4, { calm: true, needsOff: true }));
    const farm4 = await t.json(FARM);
    t.check("... the farm comes back from it: the same buildings, plots and hut (Farming.hutOf)", farm4.same && farm4.hidden && farm4.buildings === want40.buildings &&
        farm4.plots === want40.plots && (await t.eval("!!Farming.hutOf()")), farm4);
    const again = await t.json("({ tame: Dog.state().tame, mode: Dog.state().mode, notes: Journal.data().notes.length, done: Object.keys(Journal.data().done).length, map: $gameMap.mapId() })");
    await t.until("!!Dog.dog", 10);
    t.check("... the dog (tame, at work), the journal's goals and notes are still there, the dog comes out again",
        again.tame && again.mode === want._dog.mode && again.notes >= want._journal.notes.length && again.done >= Object.keys(want._journal.done).length && (await t.eval("!!Dog.dog")), again);

    // ================= (stage 6) this game made older: lastSleep, bagWater and vesselBag back as $gameSystem's own fields, as Farming kept them
    const LOOSE_NAMES = JSON.stringify(LOOSE_KEYS.map(([k]) => k));
    const older = await t.json(`(function(){
        const c = JsonEx.parse(JsonEx.stringify(DataManager.makeSaveContents())), f = c.system._tw.farm;
        c.system._lastSleep = f.lastSleep; c.system._bagWater = 2; c.system._vesselBag = { clay_pot: [{ water: 1, uses: 3 }] };
        delete f.lastSleep; delete f.bagWater; delete f.vesselBag;
        const own = Object.keys(c.system).filter(k => ${LOOSE_NAMES}.includes(k)).sort();
        DataManager.extractSaveContents(c);
        SceneManager.goto(Scene_Map);
        return { own }; })()`);
    await t.until(t.onMap(3), 30, 150);
    await t.frames(30);
    const loose2 = await t.json(`(function(){ const s = $gameSystem, f = s._tw.farm, own = () => ${LOOSE_NAMES}.filter(k => Object.prototype.hasOwnProperty.call(s, k));
        const out = { own: own(), lastSleep: s._lastSleep, fLast: f.lastSleep, bag: Farming.bagWater(), fBag: f.bagWater, pots: JSON.stringify(s._vesselBag), fPots: JSON.stringify(f.vesselBag) };
        s._bagWater = 3;   // (the old name written, as the tests do)
        return Object.assign(out, { bag3: Farming.bagWater(), fBag3: f.bagWater, own3: own() }); })()`);
    t.check("... an older save's own _lastSleep, _bagWater and _vesselBag move into _tw.farm on loading (the need of sleep, the bucket's water, the pots in the bag); " +
        "none left on $gameSystem, the old names read and write the farm's fields", older.own.join() === "_bagWater,_lastSleep,_vesselBag" && loose2.own.length === 0 &&
        loose2.lastSleep === want._lastSleep && loose2.fLast === want._lastSleep && loose2.bag === 2 && loose2.fBag === 2 &&
        loose2.fPots === JSON.stringify({ clay_pot: [{ water: 1, uses: 3 }] }) && loose2.pots === loose2.fPots && loose2.bag3 === 3 && loose2.fBag3 === 3 && loose2.own3.length === 0, { older, loose2 });

    // ================= the journal hears the bus: a storyStep (Story.js), and the goals are looked at right away
    const listens = await t.json("Tawerna.debug.listeners()");
    t.check("the journal listens on the bus: kill, shiftDone, questDone, debtPayment, debtPaid, storyStep (and wake for the night's summary)",
        ["kill", "shiftDone", "questDone", "debtPayment", "debtPaid", "storyStep", "wake"].every(e => (listens[e] || []).includes("Journal")), listens);
    const bus = await t.json(`(function(){
        const g = Journal.GOALS.find(x => !Journal.goalDone(x));
        if (!g) return { none: true };
        const was = g.done;
        g.done = () => true;
        const before = Journal.goalDone(g);
        Tawerna.emit("storyStep", { step: "test" });
        const after = Journal.goalDone(g);
        g.done = was;
        return { id: g.id, before, after }; })()`);
    t.check("... a storyStep on the map: an open goal whose state now says done is ticked at once (not at the next 30-frame look)", !bus.none && !bus.before && bus.after, bus);
});
