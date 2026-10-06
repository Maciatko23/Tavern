// The underground, band 1 (Underground.js + Underground_Data.js, docs/PODZIEMIA.md): the grate in the tavern's cellar (closed until
// switch 11 - Act II), Ruiny Zamku (Map010) and its great stairs, the generated floors 1-9 (maps 131-139, made from the chunks of
// Map130 and the save's seed), floor 10 (Map140: the guardian of the tenth gate, the lift up), the song's shortcut, the F9 rows.
//   - the same floor twice is the same (after going down and up again, after a save and a load); another seed makes another floor
//   - the stairs connect: down lands on the next floor's stairs up, up lands on the stairs down; every floor 1-9 of five seeds has
//     a walk from its stairs up to its stairs down (tile flags + blocking events, the engine's rules)
//   - containers give what the generator put in once, then they are empty; the notes go into the journal
// Shots: docs/podziemia/gra_*.png.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "podziemia");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const api = await t.json(`(function(){ const U = Tawerna.api("Underground"), D = window.Underground_Data;
        return U && D && { win: window.Underground === U, chunks: (U.library(U.bandOf(1)) || []).length, flags: $dataTilesets[10].flags.length,
            maps: [9, 10, 11, 130, 131, 139, 140, 141, 142, 143, 144, 145, 146, 153].map(id => !!$dataMapInfos[id]), floorOf: [U.floorOf(131), U.floorOf(139), U.floorOf(140), U.floorOf(10)],
            libs: [2, 3, 4, 5].map(b => (U.library(U.bandOf(b * 20 - 9)) || []).length), virt: [U.mapOf(11), U.mapOf(99), U.floorOf(1055), !!$dataMapInfos[1055]], ts12: $dataTilesets[12] && $dataTilesets[12].flags.length,
            sw: Object.keys(D.SWITCHES).map(k => $dataSystem.switches[D.SWITCHES[k]]) }; })()`);
    t.check("Underground is loaded (T.api, window.Underground), the band-1 chunk library (Map130) is read with the database, tileset 10 has its 8192 passage flags",
        api && api.win && api.chunks >= 10 && api.flags === 8192, api);
    t.check("maps 9-11, 130-153 are in MapInfos; floors: 131 -> 1, 139 -> 9, 140 -> 10 (made by hand), Map010 is not a floor; switches 11-14 have names",
        api && api.maps.every(Boolean) && api.floorOf.join() === "1,9,10,0" && api.sw.join() === "Podziemia_Zejscie,Podziemia_Winda,Podziemia_Skrot,Podziemia_Brama10", api);
    t.check("the libraries of bands 2-5 (Map141-144) are read with the database (10+ chunks each), band 2's tileset 12 has its flags; floors 11-99 are the map ids 1011-1099 (named in the map list, in memory)",
        api && api.libs.every(n => n >= 10) && api.ts12 === 8192 && api.virt.join() === "1011,1099,55,true", { libs: api && api.libs, virt: api && api.virt, ts12: api && api.ts12 });

    // ---- the grate in the tavern's cellar: closed (switch 11 off) - walking into it goes nowhere, the action button tells why
    await t.newGame({ map: 9, x: 15, y: 3, dir: 8, hour: 12, quiet: true });
    await t.finish();
    // (the creatures of stage 4 - Creatures.js - stay out of these walks: they have their own test)
    await t.eval("(window.Creatures && Creatures.auto && Creatures.auto(false), 0)");
    await t.locate(15, 3, 8);
    await t.hold("up", 30);
    const shut = await t.json("({ map: $gameMap.mapId(), y: $gamePlayer.y, open: Underground.isOpen() })");
    t.check("the grate is closed in a new game (switch 11 off): walking up into it the hero stays in the cellar", shut.map === 9 && shut.y === 3 && !shut.open, shut);
    const why = await t.talkTo(`$gameMap.events().find(e => /krata/i.test(e.event().name))`, [], { place: false });
    t.check("...and the action button on it says why (the order's raven lock, rusted shut)", /Krata ani drgnie/.test(why.text), why.text);
    await t.shot(path.join(SHOTS, "gra_piwnica_krata.png"));

    // ---- an old save standing where the old cellar (one big floor) had floor and the new one has wall: to the stairs' foot
    await t.locate(5, 1, 2);
    await t.saveTo(2);
    await t.loadFrom(2, { quiet: true });
    const moved = await t.json("({ map: $gameMap.mapId(), at: [$gamePlayer.x, $gamePlayer.y] })");
    t.check("a save standing inside the cellar's new wall (5,1) loads at the foot of the stairs from the tavern (10,8)", moved.map === 9 && moved.at.join() === "10,8", moved);

    // ---- opened (Story / a quest turns switch 11 on): through the grate to Ruiny Zamku
    await t.eval("Underground.open(); 0");
    await t.locate(15, 3, 8);
    await t.frames(5);
    await t.hold("up", 30);
    const inRuins = await t.until(t.onMap(10), 15);
    const r0 = await t.json("({ x: $gamePlayer.x, y: $gamePlayer.y })");
    t.check("switch 11 on: walking into the open grate takes the hero down to Ruiny Zamku (Map010 3,7)", inRuins && r0.x === 3 && r0.y === 7, r0);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "gra_ruiny_zamku.png"));

    // ---- the great stairs down: floor 1 (map 131), on its stairs up; the notice and the deepest floor
    await t.notices({ clear: true });
    await t.locate(14, 7, 8);
    await t.hold("up", 30);
    const on1 = await t.until(t.onMap(131), 20);
    await t.frames(40);
    const f1 = await t.json(`(function(){ const i = Underground.info(); return { at: [$gamePlayer.x, $gamePlayer.y], up: i.spots.up, down: i.spots.down, floor: i.floor,
        deepest: Underground.deepest(), seed: Underground.seed(), name: $gameMap.displayName(), dark: Tawerna.mapFlag("Dark", false) }; })()`);
    const tops = await t.notices();
    t.check("walking into the great stairs: floor 1 (map 131), the hero on the landing of its stairs up", on1 && f1.floor === 1 && f1.at[0] === f1.up[0] && f1.at[1] === f1.up[1], f1);
    t.check("the notice 'Piętro 1' at the top, the map's name 'Podziemia - piętro 1', the deepest floor 1, a seed of the save, a dark map",
        tops.some(n => /^Piętro 1 \|/.test(n)) && f1.name === "Podziemia - piętro 1" && f1.deepest === 1 && f1.seed > 0 && f1.dark, { tops, f1 });
    await t.shot(path.join(SHOTS, "gra_pietro1.png"));
    const SIG = `(function(){ let h = 0; for (const v of $dataMap.data) h = (h * 31 + v) | 0; return { w: $dataMap.width, h: $dataMap.height, data: h,
        ev: $dataMap.events.filter(Boolean).map(e => e.name + "@" + e.x + "," + e.y).join("|").length, n: $gameMap.events().length }; })()`;
    const sig1 = await t.json(SIG);

    // ---- down to floor 2 and up again: the stairs connect, floor 1 is the same
    await t.locate(f1.down[0], f1.down[1], 8);
    await t.hold("up", 30);
    const on2 = await t.until(t.onMap(132), 20);
    await t.frames(20);
    const f2 = await t.json(`(function(){ const i = Underground.info(); return { at: [$gamePlayer.x, $gamePlayer.y], up: i.spots.up, down: i.spots.down, deepest: Underground.deepest() }; })()`);
    t.check("floor 1's stairs down lead to floor 2 (map 132), onto the landing of its stairs up; the deepest floor 2",
        on2 && f2.at.join() === f2.up.slice(0, 2).join() && f2.deepest === 2, f2);
    await t.locate(f2.up[0], f2.up[1], 8);
    await t.hold("up", 30);
    const back1 = await t.until(t.onMap(131), 20);
    await t.frames(20);
    const at1 = await t.json("[$gamePlayer.x, $gamePlayer.y]");
    const sig1b = await t.json(SIG);
    t.check("floor 2's stairs up lead back to floor 1, onto the landing of its stairs down", back1 && at1.join() === f1.down.slice(0, 2).join(), { at1, down: f1.down });
    t.check("floor 1 is the same floor as before (tiles, size, events)", JSON.stringify(sig1b) === JSON.stringify(sig1), { sig1, sig1b });

    // ---- a container: what the generator put in, once; then empty (self switch A shows it open)
    const box = await t.json(`(function(){ const i = Underground.info(); const id = Object.keys(i.loot).map(Number).find(k => i.loot[k].got.length && $gameMap.event(k));
        return id ? { id, got: i.loot[id].got, kind: i.loot[id].kind } : null; })()`);
    if (box) {
        const before = await t.json(`({ gold: $gameParty.gold(), items: ${JSON.stringify(box.got)}.filter(g => g.item).map(g => $gameParty.numItems($dataItems[g.item])) })`);
        const first = await t.talkTo(box.id, []);
        const after = await t.json(`({ gold: $gameParty.gold(), items: ${JSON.stringify(box.got)}.filter(g => g.item).map(g => $gameParty.numItems($dataItems[g.item])), open: $gameSelfSwitches.value([131, ${box.id}, "A"]) })`);
        const gold = box.got.filter(g => g.gold).reduce((a, g) => a + g.gold, 0);
        const items = box.got.filter(g => g.item);
        const second = await t.talkTo(box.id, []);
        const again = await t.json("$gameParty.gold()");
        t.check("a container (" + box.kind + ") gives what the generator put in it (" + JSON.stringify(box.got) + ") and is marked searched",
            after.gold - before.gold === gold && items.every((g, i) => after.items[i] - before.items[i] === g.n) && after.open, { before, after, first: first.text });
        t.check("...searched again it is empty (nothing more)", again === after.gold && second.text.length > 0, second.text);
    } else t.check("a container with something in it on floor 1", false, "none");

    // ---- save and load on floor 1: the same floor
    await t.saveTo(1);
    const loaded = await t.loadFrom(1, { quiet: true });
    const sig1c = await t.json(SIG);
    t.check("saved on floor 1 and loaded: the same floor, the same events", loaded && JSON.stringify(sig1c) === JSON.stringify(sig1), { sig1, sig1c });

    // ---- another seed: another floor; every floor 1-9 of five seeds has a way from its stairs up to its stairs down
    const seeds = await t.json(`(function(){ const keep = Underground.seed(), out = { differ: false, bad: [], steps: [] };
        const a = Underground.floorData(1).map;
        Underground.setSeed(keep + 77);
        const b = Underground.floorData(1).map;
        out.differ = a.width !== b.width || a.height !== b.height || a.data.some((v, i) => v !== b.data[i]);
        for (const s of [1, 2, 3, 12345, 987654]) {
            Underground.setSeed(s);
            for (let f = 1; f <= 9; f++) { const c = Underground.verify(f); if (!c.ok) out.bad.push(s + "/" + f + ": " + c.why); else out.steps.push(c.steps); }
        }
        Underground.setSeed(keep);
        return out; })()`, 120000);
    t.check("another seed makes another floor 1", seeds.differ, seeds);
    t.check("every floor 1-9 of five seeds: a walk from the stairs up to the stairs down (tile flags, blocking events)", seeds.bad.length === 0 && seeds.steps.length === 45, seeds);

    // ---- floor 9 down -> floor 10 (Map140); its stairs up -> floor 9's stairs down
    await t.eval("Underground.go(9); 0");
    await t.until(t.onMap(139), 20);
    await t.frames(20);
    const f9 = await t.json("Underground.info().spots");
    await t.locate(f9.down[0], f9.down[1], 8);
    await t.hold("up", 30);
    const on10 = await t.until(t.onMap(140), 20);
    await t.frames(30);
    const a10 = await t.json("({ at: [$gamePlayer.x, $gamePlayer.y], deepest: Underground.deepest(), name: $gameMap.displayName() })");
    t.check("floor 9's stairs down lead to floor 10 (Map140, made by hand) at its stairs up (5,13); the deepest floor 10", on10 && a10.at.join() === "5,13" && a10.deepest === 10, a10);
    await t.shot(path.join(SHOTS, "gra_pietro10.png"));
    await t.locate(5, 13, 8);
    await t.hold("up", 30);
    const up9 = await t.until(t.onMap(139), 20);
    await t.frames(10);
    const at9 = await t.json("[$gamePlayer.x, $gamePlayer.y]");
    t.check("floor 10's stairs up lead to floor 9's stairs down", up9 && at9.join() === f9.down.slice(0, 2).join(), { at9, f9 });

    // ---- the guardian of the tenth gate: the wrong words hurt, the right ones (Borgar's saying) open the gate
    await t.eval("Underground.go(10); 0");
    await t.until(t.onMap(140), 20);
    await t.frames(20);
    const gid = await t.eval(`$gameMap.events().find(e => e.event().name === "Pusta zbroja strażnika").eventId()`);
    const hp0 = await t.eval("$gameParty.leader().hp");
    await t.locate(19, 16, 8);
    await t.hold("up", 16);
    const woke = await t.until("$gameMap.isEventRunning() && $gameMap._interpreter.eventId() === " + gid, 5, 50);
    t.check("stepping on the line in front of the tenth gate wakes the guardian (his talk starts)", woke, { gid });
    await t.finish();
    const wrong = await t.talkTo(gid, ["Prawdy."]);
    await t.frames(30);
    const hp1 = await t.json("({ hp: $gameParty.leader().hp, gate: $gameSwitches.value(14) })");
    t.check("answered 'Prawdy.': the armour strikes (the hero loses health), the gate stays shut", hp1.hp < hp0 && !hp1.gate && /PRAWDY NIE BIERZE/.test(wrong.text), { hp0, hp1, text: wrong.text });
    await t.eval("$gameParty.leader().setHp($gameParty.leader().mhp); 0");
    const right = await t.talkTo(gid, ["Nie pytam"], { shotAtChoice: path.join(SHOTS, "gra_straznik.png") });
    const opened = await t.json(`({ gate: $gameSwitches.value(14), pass: $gameMap.eventsXy(19, 12).every(e => e.isThrough() || !e.isNormalPriority()) })`);
    t.check("answered 'Nie pytam o to, czego nie chcę wiedzieć.' (the castellan's words): switch 14 on, the gate open (walk-through)",
        opened.gate && opened.pass && /SŁOWA KASZTELANA/.test(right.text), { opened, text: right.text });

    // ---- the lift: the windlass (switch 12), the cage up to Ruiny Zamku, and down again
    const lever = await t.eval(`$gameMap.events().find(e => e.event().name === "Kołowrót windy").eventId()`);
    const turned = await t.talkTo(lever, ["Zakręcić"]);
    const liftOn = await t.eval("$gameSwitches.value(12)");
    t.check("the windlass turned: switch 12 on (the lift works)", liftOn && /Winda znów chodzi/.test(turned.text), turned.text);
    const cage = await t.eval(`$gameMap.events().find(e => e.event().name === "Winda kasztelana").eventId()`);
    await t.talkTo(cage, ["Ruiny"]);
    const upR = await t.until(t.onMap(10), 20);
    await t.frames(20);
    const atR = await t.json("[$gamePlayer.x, $gamePlayer.y]");
    t.check("the cage takes the hero up to Ruiny Zamku, in front of the shaft (24,8)", upR && atR.join() === "24,8", atR);
    await t.shot(path.join(SHOTS, "gra_ruiny_winda.png"));
    const shaft = await t.eval(`$gameMap.events().find(e => e.event().name === "Winda (szyb)").eventId()`);
    await t.talkTo(shaft, ["Piętro 10"]);
    const down10 = await t.until(t.onMap(140), 20);
    await t.frames(10);
    const at10 = await t.json("[$gamePlayer.x, $gamePlayer.y]");
    t.check("...and from Ruiny Zamku down again to floor 10, in front of the cage (21,5)", down10 && at10.join() === "21,5", at10);

    // ---- the song's shortcut (W3): with switch 13 the great stairs offer the third step - straight to floor 10
    await t.eval("Underground.go(0); 0");
    await t.until(t.onMap(10), 20);
    await t.frames(10);
    await t.eval("Underground.shortcut(true); 0");
    const stairsId = await t.eval(`$gameMap.events().find(e => e.event().name === "Wielkie schody w dół").eventId()`);
    const sc = await t.talkTo(stairsId, ["Trzeci"], { place: false });
    const viaSong = await t.until(t.onMap(140), 20);
    t.check("switch 13 (the song): the great stairs offer 'Trzeci stopień' - straight to floor 10", viaSong && sc.choices.length && sc.choices[0].length === 3, sc.choices);

    // ---- the notes of the order: one on every generated floor, read into the journal
    await t.eval("Underground.go(3); 0");
    await t.until(t.onMap(133), 20);
    await t.frames(10);
    const note = await t.json(`(function(){ const n = Underground.info().notes[0]; return n ? { id: n.id, floor: n.floor } : null; })()`);
    if (note) {
        const read = await t.talkTo(note.id, []);
        const j = await t.json(`(function(){ const J = window.Journal; const notes = J && J.data ? (J.data().notes || []) : []; return { read: !!Underground.state().notes[3], journal: JSON.stringify(notes).indexOf("Napis w murze") >= 0 }; })()`);
        t.check("floor 3 has the order's note 'Napis w murze' (Borgar's saying); read, it is kept and goes into the journal's notes",
            /NIE PYTAJ O TO, CZEGO NIE CHCESZ WIEDZIEĆ/.test(read.text) && j.read && j.journal, { j, text: read.text });
    } else t.check("floor 3 has the order's note", false, "none");

    // ---- the torches light the floor; the spikes rise and fall, and hurt the one standing on them while they are up
    const lit = await t.json(`(function(){ const s = SceneManager._scene._spriteset; const holes = s.roomLightHoles ? s.roomLightHoles() : [];
        return { holes: holes.length, torches: $gameMap.events().filter(e => e.event().name === "Pochodnia").length }; })()`);
    t.check("the floor's burning torches are RoomLighting lights (flames)", lit.torches > 0 && lit.holes >= lit.torches, lit);
    const trapAt = await t.json(`(function(){ const keep = Underground.seed();
        for (let s = 1; s < 60; s++) { Underground.setSeed(s); for (let f = 1; f <= 9; f++) { const i = Underground.floorData(f).info; if (i.traps.length) return { seed: s, floor: f, trap: i.traps[0], keep }; } }
        Underground.setSeed(keep); return null; })()`);
    if (trapAt) {
        await t.eval(`Underground.go(${trapAt.floor}); 0`);
        await t.until(t.onMap(130 + trapAt.floor), 20);
        await t.frames(10);
        await t.eval("$gameParty.leader().setHp($gameParty.leader().mhp); 0");
        const hpT0 = await t.eval("$gameParty.leader().hp");
        await t.locate(trapAt.trap.x, trapAt.trap.y, 2);
        const seen = await t.json(`new Promise(res => { const ev = $gameMap.event(${trapAt.trap.id}), dirs = new Set(), end = Graphics.frameCount + 330;
            const iv = setInterval(() => { dirs.add(ev.direction()); $gamePlayer.locate(${trapAt.trap.x}, ${trapAt.trap.y}); if (Graphics.frameCount >= end) { clearInterval(iv); res([...dirs].sort()); } }, 16); })`, 60000);
        const hpT1 = await t.eval("$gameParty.leader().hp");
        t.check("the spikes go up and down (all four heights shown) and hurt the hero standing on them (seed " + trapAt.seed + ", floor " + trapAt.floor + ")",
            seen.join() === "2,4,6,8" && hpT1 < hpT0, { seen, hpT0, hpT1 });
        await t.eval(`Underground.setSeed(${trapAt.keep}); $gameParty.leader().setHp($gameParty.leader().mhp); 0`);
    } else t.check("a floor with spikes among 60 seeds", false, "none");

    // ---- the creatures' hooks (stage 4): spawn places on the floors, a maker registered puts events 860+ there
    const cr = await t.json(`(function(){ const sp = Underground.spawns().length;
        Underground.registerCreature("szczur", s => ({ name: "Szczur (test)", note: "", pages: [{ conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 },
            directionFix: false, image: { tileId: 0, characterName: "", characterIndex: 0, direction: 2, pattern: 0 }, list: [{ code: 0, indent: 0, parameters: [] }], moveFrequency: 3,
            moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: 0, stepAnime: false, through: true, trigger: 0, walkAnime: false }] }));
        return { sp, kinds: [...new Set(Underground.spawns().map(s => s.kind))] }; })()`);
    await t.eval("Underground.go(1); 0");
    await t.until(t.onMap(131), 20);
    await t.frames(10);
    const cr2 = await t.json(`({ made: $gameMap.events().filter(e => e.eventId() >= 860 && e.eventId() <= 899 && e.event().name === "Szczur (test)").length,
        rats: Underground.spawns().filter(s => s.kind === "szczur").length })`);
    await t.eval(`Underground.registerCreature("szczur", null); 0`);
    t.check("the floors carry spawn places for the creatures (" + cr.kinds.join(", ") + "); a registered maker puts its events there (ids 860-899)",
        cr.sp > 0 && cr2.made > 0 && cr2.made === cr2.rats, { cr, cr2 });

    // =========================================================================================================== floors 11-100
    const sigOf = SIG;
    // ---- floor 10's stairs down (behind the tenth gate, open since the riddle) -> floor 11: map 1011, the shared shell made into a floor
    await t.eval("Underground.go(10); 0");
    await t.until(t.onMap(140), 20);
    await t.frames(20);
    await t.notices({ clear: true });
    await t.locate(16, 3, 8);
    await t.hold("up", 30);
    const on11 = await t.until(t.onMap(1011), 20);
    await t.frames(30);
    const f11 = await t.json(`(function(){ const i = Underground.info(); return { at: [$gamePlayer.x, $gamePlayer.y], up: i.spots.up, down: i.spots.down, floor: i.floor,
        band: i.band, ts: $dataMap.tilesetId, w: $dataMap.width, name: $gameMap.displayName(), deepest: Underground.deepest(), poziom: Tawerna.mapTag("Poziom") }; })()`);
    const tops11 = await t.notices();
    t.check("floor 10's stairs down lead to floor 11: map 1011 (no file of its own - it loads the shell Map145 and is made from band 2's chunks on tileset 12), on its stairs up",
        on11 && f11.floor === 11 && f11.band === 2 && f11.ts === 12 && f11.w > 17 && f11.at.join() === f11.up.slice(0, 2).join() && f11.name === "Podziemia - piętro 11", f11);
    t.check("...the notice 'Piętro 11 | Kwatery i kaplica zakonu', the deepest floor 11", tops11.some(n => /^Piętro 11 \|.*Kwatery/.test(n)) && f11.deepest === 11, tops11);
    await t.shot(path.join(SHOTS, "gra_pietro11.png"));
    const sig11 = await t.json(sigOf);
    await t.locate(f11.up[0], f11.up[1], 8);
    await t.hold("up", 30);
    const back10 = await t.until(t.onMap(140), 20);
    await t.frames(10);
    const at10b = await t.json("[$gamePlayer.x, $gamePlayer.y]");
    t.check("floor 11's stairs up lead back to floor 10, in front of its stairs down (16,3)", back10 && at10b.join() === "16,3", at10b);
    await t.locate(16, 3, 8);
    await t.hold("up", 30);
    await t.until(t.onMap(1011), 20);
    await t.frames(10);
    const sig11b = await t.json(sigOf);
    t.check("...and down again: floor 11 is the same floor", JSON.stringify(sig11b) === JSON.stringify(sig11), { sig11, sig11b });

    // ---- every generated floor 11-99 of two seeds: a walk from the stairs up to the stairs down (the game's own data and flags)
    const deep = await t.json(`(function(){ const keep = Underground.seed(), out = { bad: [], n: 0 };
        for (const s of [keep, 4242]) { Underground.setSeed(s); for (let f = 11; f <= 99; f++) { if (f % 10 === 0) continue; const c = Underground.verify(f); out.n++; if (!c.ok) out.bad.push(s + "/" + f + ": " + c.why); } }
        Underground.setSeed(keep); return out; })()`, 240000);
    t.check("every generated floor 11-99 of two seeds (" + deep.n + " floors): a walk from its stairs up to its stairs down", deep.bad.length === 0 && deep.n === 162, deep);

    // ---- floor 19 down -> floor 20 (Map146, made by hand) at its stairs up; the boss holds the stairs down only while a maker is registered
    await t.eval("Underground.go(19); 0");
    await t.until(t.onMap(1019), 20);
    await t.frames(20);
    const f19 = await t.json("Underground.info().spots");
    await t.locate(f19.down[0], f19.down[1], 8);
    await t.hold("up", 30);
    const on20 = await t.until(t.onMap(146), 20);
    await t.frames(30);
    const a20 = await t.json("({ at: [$gamePlayer.x, $gamePlayer.y], name: $gameMap.displayName(), boss: Underground.spawns().filter(s => s.kind === 'boss_20').length })");
    t.check("floor 19's stairs down lead to floor 20 (Map146, Sala jednego pytania) at its stairs up (4,6); its boss's place <Stwor:boss_20> is there",
        on20 && a20.at.join() === "4,6" && a20.boss === 1, a20);
    await t.shot(path.join(SHOTS, "gra_pietro20.png"));
    await t.eval(`Underground.registerCreature("boss_20", s => ({ name: "Przeor w zbroi (test)", note: "", pages: [{ conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 },
        directionFix: false, image: { tileId: 0, characterName: "", characterIndex: 0, direction: 2, pattern: 0 }, list: [{ code: 0, indent: 0, parameters: [] }], moveFrequency: 3,
        moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: 0, stepAnime: false, through: true, trigger: 0, walkAnime: false }] })); Underground.go(20); 0`);
    await t.until("$gameMap.mapId() === 146 && !$gamePlayer.isTransferring()", 20);
    await t.frames(20);
    const made20 = await t.json("$gameMap.events().filter(e => e.eventId() >= 860 && e.event().name === 'Przeor w zbroi (test)').length");
    await t.popups({ clear: true });
    await t.locate(32, 6, 8);
    await t.hold("up", 30);
    await t.frames(20);
    const held = await t.json("({ map: $gameMap.mapId(), pops: window.__kit.pops.map(p => p.text) })");
    t.check("a maker for boss_20 registered: the boss stands on its place (an event 860+), the stairs down refuse ('Najpierw Przeor w zbroi...')",
        made20 === 1 && held.map === 146 && held.pops.some(p => /Najpierw Przeor w zbroi/.test(p)), { made20, held });
    await t.eval("Underground.bossDefeated(20); 0");
    await t.locate(32, 6, 8);
    await t.hold("up", 30);
    const on21 = await t.until(t.onMap(1021), 20);
    t.check("...Underground.bossDefeated(20): the stairs down lead to floor 21", on21 && (await t.json("Underground.bosses()[20] === true")));
    await t.eval(`Underground.registerCreature("boss_20", null); 0`);

    // ---- the lift: floor 20's windlass (a new stop), its cage -> Ruiny Zamku, the shaft there -> floor 20
    await t.eval("Underground.go(20); 0");
    await t.until(t.onMap(146), 20);
    await t.frames(20);
    const lever20 = await t.eval(`$gameMap.events().find(e => e.event().name === "Kołowrót windy").eventId()`);
    const turned20 = await t.talkTo(lever20, ["Zakręcić"]);
    const stops = await t.json("Underground.liftStops()");
    t.check("floor 20's windlass turned: a stop of the lift (the stops: " + stops.join(", ") + ")", stops.includes(20) && stops.includes(10) && /Winda znów chodzi/.test(turned20.text), turned20.text);
    const cage20 = await t.eval(`$gameMap.events().find(e => e.event().name === "Winda kasztelana").eventId()`);
    const ride = await t.talkTo(cage20, ["Ruiny"]);
    const upR20 = await t.until(t.onMap(10), 20);
    t.check("floor 20's cage offers Ruiny Zamku and floor 10 (not floor 20 itself) and takes the hero up to Ruiny Zamku",
        upR20 && ride.choices.length && ride.choices[0].some(c => /^Ruiny/.test(c)) && ride.choices[0].some(c => /^Piętro 10/.test(c)) && !ride.choices[0].some(c => /^Piętro 20/.test(c)), ride.choices);
    await t.frames(20);
    const shaft2 = await t.eval(`$gameMap.events().find(e => e.event().name === "Winda (szyb)").eventId()`);
    await t.talkTo(shaft2, ["Piętro 20"]);
    const down20 = await t.until(t.onMap(146), 20);
    await t.frames(10);
    const at20 = await t.json("[$gamePlayer.x, $gamePlayer.y]");
    t.check("...and from Ruiny Zamku's shaft straight down to floor 20, in front of its cage (7,19)", down20 && at20.join() === "7,19", at20);

    // ---- the hand-made floors 30-90: each reached by Underground.go at its stairs up, the shots
    const hm = [];
    for (const [f, m] of [[30, 147], [40, 148], [50, 149], [60, 150], [70, 151], [80, 152], [90, 153]]) {
        await t.eval(`Underground.go(${f}); 0`);
        const ok = await t.until(t.onMap(m), 20);
        await t.frames(30);
        const at = await t.json("[$gamePlayer.x, $gamePlayer.y, Underground.info().floor]");
        hm.push(f + ": " + (ok ? at.join(",") : "not reached"));
        await t.shot(path.join(SHOTS, "gra_pietro" + f + ".png"));
    }
    t.check("floors 30-90 (Map147-153, made by hand) are reached at their stairs up (4,6)", hm.every(s => / 4,6,\d+$/.test(s)), hm);

    // ---- water down here is not drunk: facing the river on floor 40 the action button says so (Farming's water menu stays shut)
    await t.eval("Underground.go(40); 0");
    await t.until(t.onMap(148), 20);
    await t.frames(20);
    await t.popups({ clear: true });
    await t.locate(17, 10, 6);
    await t.frames(5);
    const wet = await t.json("({ water: Underground.waterAt(18, 10) })");
    await t.press("ok");
    await t.frames(10);
    const dry = await t.json("({ pops: window.__kit.pops.map(p => p.text), menu: !!(SceneManager._scene._farmMenu && SceneManager._scene._farmMenu.active) })");
    t.check("floor 40: the river is water (A1), but the action button facing it only says it is not for drinking", wet.water && dry.pops.some(p => /nie będę pić/.test(p)) && !dry.menu, { wet, dry });
    // ...the one clean spring under the fortress (floor 50) is drunk from - three draws a day (Farming.rationWell, <Studnia:3>)
    await t.eval("Underground.go(50); 0");
    await t.until(t.onMap(149), 20);
    await t.frames(20);
    const spring = await t.json(`(function(){ const e = $gameMap.events().find(o => o.event().name === "Źródło pod skałą"); return e ? { id: e.eventId(), ration: Farming.rationOf ? Farming.rationOf(e) : null } : null; })()`);
    t.check("floor 50: the spring under the rock is a well of three draws a day", spring && spring.ration && spring.ration.max === 3, spring);

    // ---- save and load on a deep generated floor (57: map 1057): the same floor, the same place
    await t.eval("Underground.go(57); 0");
    await t.until(t.onMap(1057), 20);
    await t.frames(20);
    const sig57 = await t.json(sigOf);
    const at57 = await t.json("[$gamePlayer.x, $gamePlayer.y]");
    await t.saveTo(3);
    await t.eval("Underground.go(1); 0");
    await t.until(t.onMap(131), 20);
    await t.loadFrom(3, { quiet: true });
    await t.frames(20);
    const back57 = await t.json(`({ map: $gameMap.mapId(), at: [$gamePlayer.x, $gamePlayer.y], sig: ${sigOf} })`);
    t.check("saved on floor 57 (map 1057, band 4) and loaded: the same map, the same floor, the same place", back57.map === 1057 && JSON.stringify(back57.sig) === JSON.stringify(sig57) &&
        back57.at.join() === at57.join(), { back57, sig57, at57 });
    await t.shot(path.join(SHOTS, "gra_pietro57.png"));

    // ---- the Truth Layer (floor 85): whispers from the dark, someone from up there seen for a moment, the screen gone cold
    await t.eval("Underground.go(85); 0");
    await t.until(t.onMap(1085), 20);
    await t.frames(20);
    const tl = await t.json(`(function(){ const i = Underground.info(); const said = Underground.whisper("...siedem..."); Underground.startMoment(60);
        return { whispers: i.whispers.length, visions: i.visions.length, said, tone: $gameScreen._toneTarget.slice(), blue: $gameMap.events().filter(e => /Decoration2_blue/.test(e.characterName())).length }; })()`);
    const vid = await t.json("(Underground.info().visions[0] || {}).id || 0");
    await t.eval(`Underground.showVision(${vid}, 0); 0`);
    await t.frames(45);
    const seen = await t.json(`({ name: $gameMap.event(${vid}).characterName(), op: $gameMap.event(${vid}).opacity() })`);
    await t.shot(path.join(SHOTS, "gra_pietro85_zjawa.png"));
    await t.frames(160);
    const gone = await t.json(`$gameMap.event(${vid}).characterName()`);
    t.check("floor 85: places of whispers and visions; a whisper is said from the dark, the screen tints cold; the flames are blue",
        tl.whispers > 0 && tl.visions > 0 && tl.said === "...siedem..." && tl.tone[2] > 0 && tl.blue > 0, tl);
    t.check("...a vision: Borgar ($Npc_Borgar) stands there for a moment, then he is gone", seen.name === "$Npc_Borgar" && seen.op > 100 && gone === "", { seen, gone });
    const truth = await t.json("(Underground.info().notes[0] || {}).id || 0");
    if (truth) {
        const rd = await t.talkTo(truth, []);
        const tr = await t.json("Underground.truths()");
        t.check("...the floor's note is a truth in the hero's own hand (about Tadek); read, it is kept as a truth (the bus undergroundTruth)",
            /Prawda o Tadku/.test(rd.text) && tr[85] && tr[85].who === "kowal", { text: rd.text, tr });
    } else t.check("floor 85 has its truth", false, "no note");

    // ---- floor 100: the door of three locks, the Heart, the choice and the epilogue (the song's shortcut of the test above forgotten:
    // the song lock reads it as the song known)
    await t.eval("Underground.shortcut(false); Underground.go(100); 0");
    const on100 = await t.until(t.onMap(11), 20);
    await t.frames(30);
    const a100 = await t.json("({ at: [$gamePlayer.x, $gamePlayer.y], name: $gameMap.displayName(), locks: Underground.locks() })");
    t.check("floor 100 (Map011, Komnata Serca) at its stairs up (4,6); the door shut, no lock known without the quests (W2-W4)",
        on100 && a100.at.join() === "4,6" && !a100.locks.door && !a100.locks.keyKnown && !a100.locks.signalKnown && !a100.locks.songKnown, a100);
    await t.shot(path.join(SHOTS, "gra_pietro100.png"));
    const id100 = n => t.eval(`$gameMap.events().find(e => e.event().name === ${JSON.stringify(n)}).eventId()`);
    const keyNo = await t.talkTo(await id100("Zamek z krukiem"), []);
    const doorNo = await t.talkTo(await id100("Drzwi Komnaty Serca"), []);
    t.check("...the raven's lock without the castellan's key: it does not move; the door: 'Otwartych: 0 z 3'", /Bez klucza ani drgnie/.test(keyNo.text) && /Otwartych: 0 z 3/.test(doorNo.text), { k: keyNo.text, d: doorNo.text });
    // the quests' state: the key (W4) and the signal (W2) - as the quest engine keeps them
    await t.eval(`(function(){ const s = TownQuests.state(); s.v.klucz_kasztelana = 1; s.flags.signalBook = true; return 0; })()`);
    const kn = await t.json("Underground.locks()");
    const keyYes = await t.talkTo(await id100("Zamek z krukiem"), []);
    const bell = await t.talkTo(await id100("Kamienny dzwon"), ["Siedem"]);
    const songNo = await t.talkTo(await id100("Kamień pieśni"), []);
    await t.frames(10);
    const l2 = await t.json(`({ locks: Underground.locks(), door: $gameSelfSwitches.value([11, $gameMap.events().find(e => e.event().name === "Drzwi Komnaty Serca").eventId(), "A"]) })`);
    t.check("the key from W4 and the Book of Signals from W2 (TownQuests' state): both locks known, the song (W3) not", kn.keyKnown && kn.signalKnown && !kn.songKnown, kn);
    t.check("...the key turns, the bell rings seven times; the song stone stays blank; two of three - the door opens (self switch A)",
        /Klucz kasztelana wchodzi/.test(keyYes.text) && /Siedem uderzeń/.test(bell.text) && /pustymi wersami/.test(songNo.text) && l2.locks.open === 2 && l2.locks.door && l2.door, { l2, bell: bell.text });
    await t.shot(path.join(SHOTS, "gra_komnata_drzwi.png"));
    const heartId = await id100("Serce Twierdzy");
    await t.locate(15, 8, 8);
    const look = await t.talkTo(heartId, [], { shotAtChoice: path.join(SHOTS, "gra_serce_wybor.png"), place: false });
    t.check("behind the door the Heart: its look and the choice of Act III (destroy / guardian / free the truth / seal it with rules / not yet)",
        /Serce Twierdzy/.test(look.text) && look.choices.length && look.choices[0].length === 5 && /^Zniszczyć/.test(look.choices[0][0]) && /^Zapieczętować/.test(look.choices[0][3]), look.choices);
    await t.locate(15, 8, 8);
    const end = await t.talkTo(heartId, ["Zapieczętować", "Tak", "Wrócić"], { place: false, secs: 90 });
    const afterEnd = await t.until(t.onMap(1), 30);
    await t.frames(30);
    const st = await t.json("({ ending: Underground.ending ? Underground.state().ending : null, map: $gameMap.mapId() })");
    t.check("'Zapieczętować' + 'Tak': the epilogue (the rules kept up there, 'To uczciwe.', KONIEC), then 'Wrócić do gry' - the hero wakes in the tavern; the ending is kept",
        afterEnd && /To nie jest szczęśliwe zakończenie/.test(end.text) && /KONIEC/.test(end.text) && st.ending && st.ending.kind === "zapieczetowac" && st.ending.locks === 2,
        { st, text: end.text.slice(0, 400) });
    await t.eval("Underground.go(100); 0");
    await t.until(t.onMap(11), 20);
    await t.frames(20);
    const sealed = await t.json(`$gameMap.events().find(e => e.event().name === "Serce Twierdzy (blask)").characterName()`);
    const after = await t.talkTo(await id100("Serce Twierdzy"), []);
    t.check("...back in the chamber: the Heart sleeps under a stone seal, and says so", sealed === "!Dungeon_Secrets" && /PRZY ŚWIADKACH/.test(after.text), { sealed, text: after.text });
    await t.shot(path.join(SHOTS, "gra_serce_zapieczetowane.png"));

    // ---- the creatures on a hand-made floor: a maker for kamiennik puts its events on floor 60's places (ids 860+)
    await t.eval(`Underground.registerCreature("kamiennik", s => ({ name: "Kamiennik (test)", note: "", pages: [{ conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 },
        directionFix: false, image: { tileId: 0, characterName: "", characterIndex: 0, direction: 2, pattern: 0 }, list: [{ code: 0, indent: 0, parameters: [] }], moveFrequency: 3,
        moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: 0, stepAnime: false, through: true, trigger: 0, walkAnime: false }] })); Underground.go(60); 0`);
    await t.until(t.onMap(150), 20);
    await t.frames(10);
    const k60 = await t.json(`({ made: $gameMap.events().filter(e => e.eventId() >= 860 && e.event().name === "Kamiennik (test)").length,
        places: Underground.spawns().filter(s => s.kind === "kamiennik").length })`);
    await t.eval(`Underground.registerCreature("kamiennik", null); 0`);
    t.check("a maker for 'kamiennik' fills floor 60's two kamiennik places with its events (860+)", k60.made === 2 && k60.places === 2, k60);

    // ---- F9: the floor row (←→ 0-100, Shift: by 10), the grate, the locks on trial, every stop of the lift
    const f9rows = await t.json(`(function(){ SceneManager.push(Scene_Debug); return true; })()`);
    await t.until("SceneManager._scene instanceof Scene_Debug && SceneManager._scene._started", 10);
    await t.frames(5);
    const rows = await t.json(`(function(){ const s = SceneManager._scene; s.showTab(0); const out = s._list._rows.filter(r => /^ug|underground/.test(r.kind)).map(r => r.label);
        const i = s._list._rows.findIndex(r => r.kind === "underground"); s._list.select(i); const row = s._list._rows[i]; const keep = row.floor; row.floor = 99; s._list.changeQty(1); out.push(row.label); row.floor = 0; s._list.changeQty(-1); out.push(row.label); row.floor = keep; return out; })()`);
    t.check("F9, first tab: 'Podziemia: piętro N' (0-100, the hand-made floors by name), the grate, the locks on trial, every stop of the lift",
        f9rows && rows.length === 6 && /Podziemia: piętro 1 /.test(rows[0]) && /zamki Serca/.test(rows[2]) && /przystanki windy/.test(rows[3]) &&
        /piętro 100 \(Komnata Serca\)/.test(rows[4]) && /piętro 100 \(Komnata Serca\)/.test(rows[5]), rows);
    await t.eval("SceneManager.pop(); 0");
    await t.until(t.onMap(), 10);
});
