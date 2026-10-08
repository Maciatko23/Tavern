// The torch (Torch.js + HeroLook / Combat_Fight / ChoppableTree / RoomLighting / Farming_Render): lit from the bag (a popup, no
// message window, no engine timer), held in his hand while he stands, walks, runs and sneaks in all 8 directions (the torch sheets,
// the flame where the measured table says, behind him from the back), stuck in the ground beside him while he works, a weapon in the
// combat mode (its own sweep, the fire burns a wolf and frightens it off, a boar runs), it burns down by the game's clock (faster in
// the rain, a downpour puts it out), sleep puts it out, the save keeps it, the light comes from the flame, the gauge under the compass.
// CDP_PORT=9487 node tests/torch_test.js        (SHOTS=1: pictures into docs/pochodnia/)
const kit = require("./lib/kit.js");
const SHOTS = !!process.env.SHOTS;

kit.test({ port: 9487 }, async t => {
    t.check("a new game on the meadow (Map004), noon", await t.newGame({ map: 4, x: 20, y: 14, hour: 12, quiet: true }));
    await t.eval("$gameSystem.setStamina(100); $gameParty.leader().recoverAll(); Hunting.RAID.perHour = 0; 0");
    const shot = async name => { if (SHOTS) { await t.frames(2); await t.shot("../docs/pochodnia/" + name); } };
    const room = await t.json(`(function(){
        const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && !Farming.buildingAt(x, y);
        let best = null;
        for (let y = 6; y < $gameMap.height() - 6; y++) for (let x = 7; x < $gameMap.width() - 7; x++) {
            let ok = true;
            for (let dx = -6; dx <= 6 && ok; dx++) for (let dy = -4; dy <= 4; dy++) if (!free(x + dx, y + dy)) { ok = false; break; }
            if (ok && (!best || Math.abs(x - $gameMap.width() / 2) < Math.abs(best.x - $gameMap.width() / 2))) best = { x, y };
        }
        return best; })()`);
    t.check("an open field to walk in (13 x 9 tiles)", !!room, room);
    const cx = room.x, cy = room.y;
    const home = async (dir) => { await t.eval(`(function(){ Combat.resetAct(); $gamePlayer._toolSwing = null; $gamePlayer._swingEvent = null; $gamePlayer.locate(${cx}, ${cy}); $gamePlayer.setDirection(${dir || 2}); $gamePlayer._heroDir8 = ${dir || 2}; return 0; })()`); await t.frames(8); };
    await home();
    // what is drawn: the hero's sheet / cell, the flame's holder and where the flame is
    const look = () => t.json(`(function(){
        const set = SceneManager._scene._spriteset, L = set._torchLayer, s = set._characterSprites.find(c => c._character === $gamePlayer), c = s._heroCell || {};
        return { sheet: s._heroSheet || null, row: c.row, col: c.col, swing: !!(s._swingBody && s._swingBody.visible), swingSheet: s._swingBody && s._swingBody.visible && s._swingBody.bitmap ? s._swingBody.bitmap._url.split("/").pop() : null,
            hold: L._hold.visible, flame: L._flame.visible && L._hold.visible, behind: L._hold.y < s.y, front: L._hold.y > s.y,
            fx: L._hold.x + L._flame.x, fy: L._hold.y + L._flame.y, hx: s.x, hy: s.y, ground: L._ground.visible, gx: L._ground.x, gy: L._ground.y,
            spot: Torch.lightSpot(), sparks: L._sparks.length, stick: L._stick.visible }; })()`);
    const useTorch = () => t.eval(`(function(){ const a = $gameParty.leader(), it = $dataItems[59]; a.useItem(it); const act = new Game_Action(a); act.setItemObject(it); act.applyGlobal(); return $gameParty.numItems(it); })()`);

    // ================= 1. the data: the item, its common events =================
    const data = await t.json(`({ eff: $dataItems[59].effects, ce5: $dataCommonEvents[5].list.map(c => [c.code, c.parameters]), ce6: $dataCommonEvents[6].list.map(c => c.code),
        reg: !!window.Torch && $plugins.some(p => p.name === "Torch" && p.status), sw: Number(PluginManager.parameters("RoomLighting").torchSwitch) })`);
    t.check("item 59 calls common event 5; it is the plugin command Torch 'light' (no timer 124, no message 101); event 6 has no message; Torch.js is in the list",
        data.eff.some(e => e.code === 44 && e.dataId === 5) && data.ce5.some(c => c[0] === 357 && c[1][0] === "Torch" && c[1][1] === "light") &&
        !data.ce5.some(c => c[0] === 124 || c[0] === 101) && !data.ce6.includes(101) && data.reg && data.sw === 2, data);

    // ================= 2. lighting it: a popup, no message window =================
    await t.give(59, 3);
    await t.popups({ clear: true });
    const n0 = await t.count(59);
    await useTorch();
    let msg = false;
    for (let i = 0; i < 12; i++) { await t.frames(3); if (await t.eval("$gameMessage.isBusy()")) msg = true; }
    const lit = await t.json("({ lit: Torch.isLit(), sw: $gameSwitches.value(2), left: Torch.state().left, timer: $gameTimer.isWorking(), n: $gameParty.numItems($dataItems[59]) })");
    const pops = await t.popups({ clear: true });
    t.check("used from the bag: the torch burns (switch 2 ON, 3 game hours), one torch fewer, no engine timer", lit.lit && lit.sw && Math.abs(lit.left - 3) < 0.05 && lit.n === n0 - 1 && !lit.timer, lit);
    t.check("lighting it says so in a popup over the hero ('Zapalasz pochodnię'), never in the message window", pops.some(p => /Zapalasz pochodnię/.test(p)) && !msg, { pops, msg });
    await useTorch();
    await t.frames(20);
    const again = await t.popups({ clear: true });
    const sec = await t.json("({ stuck: Torch.stuck(), lit: Torch.isLit(), left: Torch.state().left, n: $gameParty.numItems($dataItems[59]) })");
    t.check("a second torch used while one burns: the burning one is stuck in the ground in front of him, the new one lit (full time), one more torch fewer",
        again.some(p => /Wbijasz pochodnię w ziemię i zapalasz nową/.test(p)) && sec.stuck.length === 1 && sec.stuck[0].x === cx && sec.stuck[0].y === cy + 1 &&
        sec.lit && Math.abs(sec.left - 3) < 0.05 && sec.n === n0 - 2, { again, sec });
    await t.eval("Torch.state().planted = []; 0");   // (out of the way of the rest)

    // ================= 3. in his hand: standing, walking, running, sneaking - 8 directions =================
    await home(2);
    let L = await look();
    const tipOf = async (sheet, row, col) => t.json(`Torch.TIPS[${JSON.stringify(sheet)}][${row}][${col}]`);
    const near = async (l) => { const tip = await tipOf(l.sheet, l.row, l.col); return !!tip && Math.abs(l.fx - (l.hx + tip[0] - 32)) <= 1.5 && Math.abs(l.fy - (l.hy + tip[1] - 64 + 1)) <= 1.5; };
    t.check("standing with it: the sheet Hero_TorchWalk (column 0), the flame drawn where the table says, in front of him facing down", L.sheet === "Hero_TorchWalk" && L.col === 0 && L.flame && L.front && (await near(L)), L);
    const KEYS = { 2: ["down"], 1: ["down", "left"], 4: ["left"], 7: ["up", "left"], 8: ["up"], 9: ["up", "right"], 6: ["right"], 3: ["down", "right"] };
    const ROW = { 2: 0, 1: 1, 4: 2, 7: 3, 8: 4, 9: 5, 6: 6, 3: 7 };
    const walk = async (d, mode) => {
        await home(2);
        const pre = mode === "run" ? "Input._currentState.shift = true;" : "";
        if (mode === "sneak") await t.eval("Hunting.setSneak(true); 0");
        await t.eval(`(function(){ ${pre} for (const k of ${JSON.stringify(KEYS[d])}) Input._currentState[k] = true; return 0; })()`);
        const seen = [];
        let okTip = true, behindOk = true, cols = new Set();
        for (let i = 0; i < 10; i++) {
            await t.frames(3);
            const l = await look();
            seen.push(l.sheet + ":" + l.row + ":" + l.col);
            cols.add(l.col);
            if (!l.flame || !(await near(l))) okTip = false;
            // in his fist on our side: in front of him; behind only where the hand itself is hidden behind the body (the table's 1)
            const tip = await tipOf(l.sheet, l.row, l.col), wantBehind = !!(tip && tip[2]);
            if (wantBehind ? !l.behind : !l.front) behindOk = false;
        }
        if (SHOTS && mode === "walk") await shot("chod_" + d + ".png");
        await t.eval(`(function(){ Input._currentState.shift = false; for (const k of ["up", "down", "left", "right"]) Input._currentState[k] = false; return 0; })()`);
        if (mode === "sneak") await t.eval("Hunting.setSneak(false); 0");
        await t.frames(6);
        const last = seen[seen.length - 1].split(":");
        return { seen, okTip, behindOk, row: Number(last[1]), sheet: last[0], cols: cols.size };
    };
    const layers = await t.json(`Object.fromEntries(Object.entries(Torch.TIPS).map(([k, rows]) => [k, rows.map(r => r.filter(c => c[2]).length)]))`);
    t.check("the torch is drawn in his hand in front of him on every frame of every way (the user: 'za ręką'); behind only where the hand is hidden (one walking frame facing up)",
        layers.Hero_TorchWalk.reduce((a, b) => a + b, 0) <= 2 && layers.Hero_TorchRun.every(n => n === 0) && layers.Hero_TorchSneak.every(n => n === 0) &&
        layers.Hero_TorchWalk.every((n, r) => n === 0 || r === 4), layers);
    for (const mode of ["walk", "run", "sneak"]) {
        const sheet = { walk: "Hero_TorchWalk", run: "Hero_TorchRun", sneak: "Hero_TorchSneak" }[mode];
        const res = {};
        let all = true;
        for (const d of [2, 1, 4, 7, 8, 9, 6, 3]) {
            const r = await walk(d, mode);
            res[d] = { row: r.row, sheet: r.sheet, tip: r.okTip, layer: r.behindOk, cols: r.cols };
            if (r.sheet !== sheet || r.row !== ROW[d] || !r.okTip || !r.behindOk || r.cols < 2) all = false;
        }
        t.check(mode + " with the torch in all 8 directions: " + sheet + ", the row of the way, the legs move, the flame on the measured head every frame, in front of him (in his hand)", all, res);
    }

    // ================= 4. at work: stuck in the ground beside him =================
    await home(2);
    const crouch = await t.eval("ChoppableTree.swingKindOf('Swing_Crouch')");
    await t.eval(`$gamePlayer.startToolSwing(${crouch}, null, null); 0`);
    await t.frames(10);
    L = await look();
    const pl = await t.json("Torch.planted()");
    t.check("crouching (work): the torch stuck in the ground beside him (to his side), its own flame there, none in his hand", !!pl && L.ground && !L.hold && L.swing && Math.abs(pl.gx - (await t.eval("$gamePlayer._realX + 0.5"))) > 0.4, { pl, L });
    t.check("its light comes from the stuck torch (the night layer reads Torch.lightSpot)", !!L.spot && Math.abs(L.spot.x - L.gx) < 1 && L.spot.gy === L.gy, L.spot);
    await shot("praca_wbita.png");
    await t.until("!$gamePlayer._swingEvent", 5, 50);
    await t.frames(5);
    L = await look();
    t.check("the swing over, he stays: the torch still stands there, his own sheet without it (Hero_Walk)", L.ground && L.sheet === "Hero_Walk", L);
    await t.eval("Input._currentState.right = true; 0");
    await t.frames(18);
    await t.eval("Input._currentState.right = false; 0");
    await t.frames(4);
    L = await look();
    t.check("he walks on: he takes it up again (torch sheet, the flame in hand, nothing in the ground)", !L.ground && L.sheet === "Hero_TorchWalk" && L.flame && !(await t.json("Torch.planted()")), L);
    // sitting down: also stuck in the ground
    await home(2);
    await t.eval(`$gamePlayer.startToolSwing(ChoppableTree.swingKindOf("Swing_Sit"), null, null); 0`);
    await t.frames(20);
    t.check("sitting down (rest): the torch stuck in the ground too", !!(await t.json("Torch.planted()")) && (await look()).ground);
    await t.until("!$gamePlayer._swingEvent", 6, 50);
    await home(2);
    await t.frames(70);
    t.check("standing still a while after the work: he takes it up by himself", !(await t.json("Torch.planted()")) && (await look()).sheet === "Hero_TorchWalk");

    // ================= 5. the weapon: the combat mode =================
    await home(6);
    await t.eval("Combat.setCombatMode(true); 0");
    await t.eval("$gameSystem._combatHand = 'm59'; 0");
    const hand = await t.json("({ hand: Combat.hand(), melee: Combat.handMelee(), def: Combat.MELEE[59] })");
    t.check("while it burns the torch is a weapon of the combat mode (m59 'Pochodnia', fire, a little weaker than the club)", hand.hand === "m59" && hand.melee === 59 && !!hand.def && hand.def.fire && hand.def.dmg < (await t.eval("Combat.MELEE[156].dmg")), hand);
    // a wolf (level 1) right in front of him, frozen
    await t.eval(`(function(){ const a = Hunting.spawn("wolf", ${cx + 1}, ${cy}); a._frozen = true; a._level = 1; a._maxHp = a._hp = 50; a._engaged = true; window.__w = a; return 0; })()`);
    await t.frames(4);
    await t.eval("Combat.resetAct(); $gamePlayer.setDirection(6); $gamePlayer._heroDir8 = 6; 0");
    const left0 = await t.eval("Torch.state().left");
    await t.eval("window.__kills = []; Tawerna.on('kill', e => window.__kills.push(e.how)); 0");
    await t.key("O", 3);
    const sw = await t.json(`({ kind: $gamePlayer._swingEvent ? $gamePlayer._swingEvent._swingKind : -1, torch: ChoppableTree.swingKindOf("torch"), sheet: ChoppableTree.swingKind(ChoppableTree.swingKindOf("torch")).sheet })`);
    await t.frames(6);
    const sL = await look();
    await shot("atak_pochodnia.png");
    t.check("O with the torch: its own sweep (swing kind 'torch', the sheet Hero_Torch), the flame in hand hidden (the sheet's own fire)", sw.kind === sw.torch && sw.kind >= 0 && sw.sheet === "Hero_Torch" && sL.swing && /Hero_Torch/.test(sL.swingSheet || "") && !sL.flame, { sw, sL });
    await t.until("!$gamePlayer._swingEvent", 5, 50);
    await t.frames(4);
    const w1 = await t.json("({ hp: __w._hp, fear: __w._fireFear || 0, burning: Torch.burning().length, left: Torch.state().left })");
    t.check("the blow lands: the wolf hurt, it burns (Torch.burning), it fears the fire (_fireFear), the torch lost a little of its time", w1.hp < 50 && w1.burning === 1 && w1.fear > 0 && w1.left < left0 - 0.05, { w1, left0 });
    const hp1 = w1.hp;
    await t.frames(130);
    const w2 = await t.json("({ hp: __w._hp, burning: Torch.burning().length })");
    t.check("it keeps burning a moment (3 ticks of fire, 3 each)", w2.hp <= hp1 - 6 && w2.burning === 0, { hp1, w2 });
    // let it go: it backs off and keeps away from the flame
    await t.eval("__w._frozen = false; __w._fireFear = 180; __w.setMode('stalk'); 0");
    const dist = [];
    for (let i = 0; i < 12; i++) { await t.frames(10); dist.push(+(await t.eval("Math.hypot(__w._realX - $gamePlayer._realX, __w._realY - $gamePlayer._realY)")).toFixed(2)); }
    const bit = await t.eval("$gameParty.leader().hp === $gameParty.leader().mhp");
    t.check("the frightened wolf backs off and keeps its distance (3+ tiles), it does not leap at him", Math.max(...dist) >= 3 && dist[dist.length - 1] >= 2.8 && bit, { dist, bit });
    // killed by the fire itself
    await t.eval(`(function(){ __w._frozen = true; __w._fireFear = 0; __w.locate(${cx + 1}, ${cy}); __w._hp = 50; return 0; })()`);
    await t.frames(4);
    await t.eval("Combat.resetAct(); $gamePlayer.setDirection(6); $gamePlayer._heroDir8 = 6; 0");
    await t.key("O", 3);
    await t.until("!$gamePlayer._swingEvent", 5, 50);
    await t.eval("__w._hp = 2; 0");
    await t.frames(60);
    t.check("a wolf with little life left dies of the burning (the kill: how 'fire')", (await t.json("window.__kills")).includes("fire"), await t.json("window.__kills"));
    // the boar runs from the fire
    await t.eval(`(function(){ const a = Hunting.spawn("boar", ${cx + 1}, ${cy}); a._frozen = true; a._level = 1; a._maxHp = a._hp = 110; window.__b = a; return 0; })()`);
    await t.frames(4);
    await t.eval("Combat.resetAct(); $gamePlayer.setDirection(6); $gamePlayer._heroDir8 = 6; 0");
    await t.key("O", 3);
    await t.until("!$gamePlayer._swingEvent", 5, 50);
    const boar = await t.json("({ hp: __b._hp, mode: __b._mode })");
    t.check("a boar hit by the torch runs back from the fire (retreat)", boar.hp < 110 && boar.mode === "retreat", boar);
    await t.eval("Hunting.removeAnimal(__b); 0");
    // a pack keeps farther from a burning torch
    const ring = await t.json(`(function(){ const W = Hunting.WOLF.ring; const p = Hunting.spawnPack(${cx + 4}, ${cy}, 3); const m = p.members[0]; p.engaged = true; p.nextAttack = 100;
        for (const w of p.members) { w._engaged = true; w.setMode("stalk"); }
        let seen = W; const _u = Hunting.Game_Animal.prototype.thinkWolf; Hunting.Game_Animal.prototype.thinkWolf = function(d) { seen = Hunting.WOLF.ring; return _u.call(this, d); };
        for (let i = 0; i < 10; i++) m.update();
        Hunting.Game_Animal.prototype.thinkWolf = _u;
        const out = { base: W, during: seen, after: Hunting.WOLF.ring, next: p.nextAttack };
        for (const w of p.members) Hunting.removeAnimal(w);
        return out; })()`);
    t.check("while the torch burns a pack circles wider (the ring +0.9 inside its thinking, back after) and its next leap waits longer", ring.during > ring.base + 0.5 && ring.after === ring.base && ring.next > 100 - 10, ring);
    await t.eval("Combat.setCombatMode(false); 0");

    // ================= 6. burning down, the weather =================
    await home(2);
    await t.popups({ clear: true });
    const h0 = await t.eval("$gameSystem.dayNightHour()");
    const l0 = await t.eval("Torch.state().left");
    await t.eval(`$gameSystem.setDayNightHour(${h0} + 0.5); 0`);
    await t.frames(3);
    const dry = l0 - (await t.eval("Torch.state().left"));
    t.check("the game's clock burns it: half an hour = half an hour of its time", Math.abs(dry - 0.5) < 0.03, { dry });
    await t.eval("$gameScreen.changeWeather('rain', 5, 1); 0");
    await t.frames(4);
    const l1 = await t.eval("Torch.state().left");
    await t.eval(`$gameSystem.setDayNightHour($gameSystem.dayNightHour() + 0.25); 0`);
    await t.frames(3);
    const wet = l1 - (await t.eval("Torch.state().left"));
    const rp = await t.popups({ clear: true });
    t.check("in the rain (under the sky) it burns twice as fast, and he is told ('Deszcz przygasza pochodnię')", Math.abs(wet - 0.5) < 0.04 && rp.some(p => /Deszcz przygasza/.test(p)), { wet, rp, out: await t.eval("Survival.isOutdoors()") });
    await shot("deszcz.png");
    await t.eval("$gameScreen.changeWeather('storm', 8, 1); 0");
    await t.frames(4);
    await t.eval(`$gameSystem.setDayNightHour($gameSystem.dayNightHour() + 0.12); 0`);
    await t.frames(4);
    const st = await t.json("({ lit: Torch.isLit(), sw: $gameSwitches.value(2) })");
    const sp = await t.popups({ clear: true });
    t.check("a downpour (storm) puts it out after a few minutes: 'Ulewa zgasiła pochodnię', switch 2 OFF", !st.lit && !st.sw && sp.some(p => /Ulewa zgasiła/.test(p)), { st, sp });
    const nb = await t.count(59);
    await useTorch();
    await t.frames(20);
    const refused = await t.popups({ clear: true });
    t.check("in the downpour it will not light: 'W taką ulewę pochodni nie zapalisz', the torch back in the bag", !(await t.eval("Torch.isLit()")) && refused.some(p => /nie zapalisz/.test(p)) && (await t.count(59)) === nb, { refused, n: await t.count(59), nb });
    await t.eval("$gameScreen.changeWeather('none', 0, 1); $gameScreen._weatherPowerTarget = 0; $gameScreen._weatherPower = 0; 0");
    await t.frames(4);
    await useTorch();
    await t.frames(15);
    await t.eval("Torch.state().left = 0.004; 0");
    await t.eval(`$gameSystem.setDayNightHour($gameSystem.dayNightHour() + 0.02); 0`);
    await t.frames(6);
    const out = await t.json("({ lit: Torch.isLit(), sw: $gameSwitches.value(2), sheet: SceneManager._scene._spriteset._characterSprites.find(c => c._character === $gamePlayer)._heroSheet })");
    const op = await t.popups({ clear: true });
    t.check("burnt down: out by itself, 'Pochodnia się wypaliła' in a popup, the hero without it (Hero_Walk)", !out.lit && !out.sw && out.sheet === "Hero_Walk" && op.some(p => /wypaliła/.test(p)), { out, op });

    // ================= 7. the gauge, the night light, the old hero =================
    await useTorch();
    await t.frames(15);
    await t.eval("Torch.state().left = 1.5; 0");
    await t.frames(4);
    const g = await t.json(`(function(){ const set = SceneManager._scene._spriteset, gg = set._torchGauge, C = window.CleanCompass && CleanCompass.info ? CleanCompass.info() : null;
        return { has: !!gg, ratio: gg ? gg._ratio : null, y: gg ? gg.y : null, vis: gg ? gg.visible && !!gg.parent : false, clean: window.CleanHUD ? CleanHUD.isClean() : null, bottom: C ? C.bottom : null }; })()`);
    t.check("the torch's gauge shows its own time (1.5 of 3 h = half) and, in the clean look, stands under the compass", g.has && g.vis && Math.abs(g.ratio - 0.5) < 0.02 && (!g.clean || (g.bottom !== null && g.y >= g.bottom - 1)), g);
    await t.eval("Torch.state().left = 40; 0");   // (the clock moved on to the night: it would burn down on the way)
    await t.setHour(23);
    await t.frames(10);
    L = await look();
    const night = await t.json(`(function(){ const nl = SceneManager._scene._spriteset._nightLight; const l = nl && nl.visible ? nl.lights().find(x => x.id === 7000) : null; return l ? { x: l.x, y: l.y } : null; })()`);
    t.check("at night the light (campfire-like, Farming_Render) stands on the flame in his hand", !!night && !!L.spot && Math.abs(night.x - L.spot.x) < 3 && Math.abs(night.y - L.spot.y) < 3, { night, spot: L.spot });
    await shot("noc_stoi.png");
    await t.eval("HeroLook.setActive(false); 0");
    await t.frames(6);
    L = await look();
    t.check("the old hero (F9: Reid): a torch drawn beside him (the stick and the flame), no torch sheets", L.stick && L.flame && !L.sheet, L);
    await t.eval("HeroLook.setActive(true); 0");
    await t.frames(4);
    await t.setHour(12);

    // ================= 8. the save, sleep =================
    t.check("still burning before the save", await t.eval("Torch.isLit()"));
    await t.eval("Torch.state().left = 1.25; 0");
    await t.saveTo(1);
    await t.eval("Torch.douse(''); 0");
    t.check("loaded again (the save made with it burning)", await t.loadFrom(1));
    await t.frames(10);
    const ld = await t.json("({ lit: Torch.isLit(), sw: $gameSwitches.value(2), left: Torch.state().left, sheet: SceneManager._scene._spriteset._characterSprites.find(c => c._character === $gamePlayer)._heroSheet })");
    t.check("after loading it still burns with the time it had (1.25 h), in his hand", ld.lit && ld.sw && Math.abs(ld.left - 1.25) < 0.05 && ld.sheet === "Hero_TorchWalk", ld);
    await t.popups({ clear: true });
    await t.eval("$gameSystem.sleepUntilHour(6); 0");
    await t.frames(10);
    const sl = await t.json("({ lit: Torch.isLit(), sw: $gameSwitches.value(2) })");
    const slp = await t.popups({ clear: true });
    t.check("sleep puts it out (told on waking: 'Pochodnię zgasiłeś przed snem')", !sl.lit && !sl.sw && slp.some(p => /zgasiłeś przed snem/.test(p)), { sl, slp });

    // ================= 9. stuck in the ground by hand: it stays, lights, burns on, is taken up again =================
    await t.dismiss();   // (the day's summary after the night)
    await t.setHour(22);
    await t.give(59, 6);
    await home(2);
    await useTorch();
    await t.until("Torch.isLit()", 6, 50);
    await t.frames(10);
    await t.popups({ clear: true });
    const menu = await t.json(`Farming.menuFor(${cx}, ${cy + 1})`);
    t.check("holding it, the ground's menu in front of him starts with 'Wbij pochodnię w ziemię'", !!menu && menu.entries[0].name === "Wbij pochodnię w ziemię" && /ziemia/.test(menu.title), { title: menu && menu.title, first: menu && menu.entries.map(e => e.name).slice(0, 3), why: await t.json(`({ lit: Torch.isLit(), held: Torch.held(), can: Torch.canPlantAt(${cx}, ${cy + 1}), stuck: Torch.stuck(), pos: [$gamePlayer.x, $gamePlayer.y, $gamePlayer.direction()], map: $gameMap.mapId(), w: Torch.weatherHere(), n: $gameParty.numItems($dataItems[59]) })`) });
    await t.press("ok");
    await t.frames(20);
    const first = await t.json("SceneManager._scene._farmMenu._entries[0].name");
    await t.press("ok");
    await t.until("Torch.stuck().length === 1 && !$gamePlayer._swingEvent", 6, 50);
    await t.frames(6);
    const st1 = await t.json(`({ stuck: Torch.stuck(), lit: Torch.isLit(), sw: $gameSwitches.value(2), n: $gameParty.numItems($dataItems[59]),
        pool: SceneManager._scene._spriteset._torchLayer._pool.size })`);
    const pp = await t.popups({ clear: true });
    t.check("O on the free ground in front, then the line: the torch is stuck there (its tile, its time), none in his hand (switch 2 off), no torch spent, drawn there",
        first === "Wbij pochodnię w ziemię" && st1.stuck.length === 1 && st1.stuck[0].x === cx && st1.stuck[0].y === cy + 1 && st1.stuck[0].left > 2.9 && !st1.lit && !st1.sw && st1.pool === 1 &&
        pp.some(p => /Wbijasz pochodnię w ziemię/.test(p)), { first, st1, pp });
    await shot("wbita_noc.png");
    const stuckLight = async () => t.json(`(function(){ const nl = SceneManager._scene._spriteset._nightLight, L = SceneManager._scene._spriteset._torchLayer, g = [...L._pool.values()][0];
        const l = nl && nl.visible ? nl.lights().filter(x => x.id >= 7100 && x.id < 7900) : [];
        return { lights: l.map(x => [Math.round(x.x), Math.round(x.y)]), g: g ? [g.box.x, g.box.y, g.box.visible] : null, tile: [$gameMap.adjustX(${cx} + 0.5) * 48, $gameMap.adjustY(${cy} + 1 + 0.82) * 48] }; })()`);
    const sl1 = await stuckLight();
    t.check("at night it lights its spot like a small fire (the night layer: a light of its own over it)", sl1.lights.length === 1 && !!sl1.g && Math.abs(sl1.lights[0][0] - sl1.g[0]) <= 1 && Math.abs(sl1.g[0] - sl1.tile[0]) <= 1 && Math.abs(sl1.g[1] - sl1.tile[1]) <= 1, sl1);
    // he walks away: it stays, still lit
    await t.eval(`$gamePlayer.locate(${cx + 5}, ${cy}); 0`);
    await t.frames(10);
    const sl2 = await stuckLight();
    t.check("he walks away: it stays where it was, still lit (its light and its sprite on the same tile)", sl2.lights.length === 1 && !!sl2.g && sl2.g[2] && Math.abs(sl2.g[0] - sl2.tile[0]) <= 1 && Math.abs(sl2.g[1] - sl2.tile[1]) <= 1 && Math.abs(sl2.lights[0][0] - sl2.g[0]) <= 1, sl2);
    const left1 = await t.eval("Torch.stuck()[0].left");
    await t.eval("$gameSystem.setDayNightHour($gameSystem.dayNightHour() + 0.5); 0");
    await t.frames(3);
    const left2 = await t.eval("Torch.stuck()[0].left");
    t.check("it burns on by its own time (half an hour of the clock = half an hour of it)", Math.abs(left1 - left2 - 0.5) < 0.03, { left1, left2 });
    // taken up again with the time it has left
    await t.eval(`$gamePlayer.locate(${cx}, ${cy}); $gamePlayer.setDirection(2); 0`);
    await t.frames(6);
    await t.press("ok");
    await t.until("Torch.stuck().length === 0 && !$gamePlayer._swingEvent", 6, 50);
    await t.frames(4);
    const up = await t.json("({ lit: Torch.isLit(), sw: $gameSwitches.value(2), left: Torch.state().left, stuck: Torch.stuck().length })");
    const upp = await t.popups({ clear: true });
    t.check("O in front of it: back in his hand with the time it had left ('Podnosisz pochodnię')", up.lit && up.sw && Math.abs(up.left - left2) < 0.03 && up.stuck === 0 && upp.some(p => /Podnosisz pochodnię/.test(p)), { up, left2, upp });
    // several at once: a torch used from the bag sticks the burning one in, the ground's menu the last
    await useTorch();
    await t.frames(10);
    await t.eval(`$gamePlayer.locate(${cx + 2}, ${cy}); $gamePlayer.setDirection(2); 0`);
    await t.frames(4);
    await useTorch();
    await t.frames(10);
    await t.eval(`$gamePlayer.locate(${cx + 4}, ${cy}); $gamePlayer.setDirection(2); 0`);
    await t.frames(4);
    await t.eval(`Torch.state().left = 1.1; Torch.plantTorch(${cx + 4}, ${cy + 1}, { instant: true }); 0`);
    await t.frames(4);
    const many = await t.json("Torch.stuck().map(p => ({ x: p.x, y: p.y, left: +p.left.toFixed(2) }))");
    t.check("several at once: three torches stuck in three places, each with its own time", many.length === 3 && new Set(many.map(m => m.x + "," + m.y)).size === 3 && many.some(m => Math.abs(m.left - 1.1) < 0.05), many);
    await useTorch();
    await t.frames(10);
    await t.popups({ clear: true });
    await t.eval(`$gamePlayer.locate(${cx + 4}, ${cy}); $gamePlayer.setDirection(2); 0`);
    await t.frames(4);
    await t.press("ok");
    await t.frames(10);
    const hp = await t.popups({ clear: true });
    t.check("holding a burning one, O at a stuck one: 'Masz już zapaloną pochodnię w ręce' - it stays", hp.some(p => /Masz już zapaloną/.test(p)) && (await t.eval("Torch.stuck().length")) === 3, hp);
    await shot("wbite_trzy.png");
    // only on their own map
    t.check("another map: none of them there (no sprite, no light)", await t.go(17, 10, 10, 2));
    const other = await t.json("({ pool: SceneManager._scene._spriteset._torchLayer._pool.size, lights: Torch.groundLights().length, stuck: Torch.stuck().length })");
    t.check("... they are not drawn on another map, but kept (3)", other.pool === 0 && other.lights === 0 && other.stuck === 3, other);
    await t.go(4, cx, cy, 2);
    await t.frames(6);
    t.check("back on their map: all three again", (await t.eval("SceneManager._scene._spriteset._torchLayer._pool.size")) === 3);
    // the save keeps them
    await t.saveTo(1);
    const before = await t.json("Torch.stuck().map(p => [p.x, p.y, +p.left.toFixed(2)])");
    await t.eval("Torch.state().planted = []; 0");
    t.check("loaded again (saved with three stuck in the ground)", await t.loadFrom(1));
    await t.frames(10);
    const after = await t.json("({ s: Torch.stuck().map(p => [p.x, p.y, +p.left.toFixed(2)]), pool: SceneManager._scene._spriteset._torchLayer._pool.size })");
    t.check("after loading the three stand where they were with their time", after.s.length === 3 && before.every((b, i) => after.s[i][0] === b[0] && after.s[i][1] === b[1] && Math.abs(after.s[i][2] - b[2]) < 0.05) && after.pool === 3, { before, after });
    // burnt down: out with a puff of smoke, gone
    await t.popups({ clear: true });
    await t.eval("Torch.state().planted[0].left = 0.004; 0");
    await t.eval("$gameSystem.setDayNightHour($gameSystem.dayNightHour() + 0.02); 0");
    await t.frames(6);
    const gone = await t.json("({ n: Torch.stuck().length, pool: SceneManager._scene._spriteset._torchLayer._pool.size })");
    const gp = await t.popups({ clear: true });
    t.check("one burnt down: gone (2 left, its sprite too), 'Wbita pochodnia się wypaliła'", gone.n === 2 && gone.pool === 2 && gp.some(p => /Wbita pochodnia się wypaliła/.test(p)), { gone, gp });
    // a dark room (RoomLighting, grandpa's house at night): a stuck torch cuts its own hole in the darkness
    t.check("grandpa's house (a dark room) at night", await t.go(19, 2, 5, 2));
    await t.setHour(23);
    await t.frames(20);
    const dk = await t.json(`(function(){
        if (!Torch.isLit()) { $gameParty.gainItem($dataItems[59], 1); const a = $gameParty.leader(), it = $dataItems[59]; a.useItem(it); const act = new Game_Action(a); act.setItemObject(it); act.applyGlobal(); }
        return { dark: !!SceneManager._scene._spriteset._darknessSprite }; })()`);
    await t.frames(20);
    const spotD = await t.json(`(function(){ for (let r = 1; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = $gamePlayer.x + dx, y = $gamePlayer.y + dy;
        if (Torch.canPlantAt(x, y)) { Torch.plantTorch(x, y, { instant: true, quiet: true }); return { x, y }; } } return null; })()`);
    await t.eval("$gamePlayer.locate(Math.max(1, $gamePlayer.x - 0), $gamePlayer.y); 0");
    await t.frames(10);
    const hole = await t.json(`(function(){ const set = SceneManager._scene._spriteset, d = set._darknessSprite; if (!d) return null;
        const L = Torch.groundLights()[0]; if (!L) return { none: true };
        const a = (x, y) => d.bitmap.context.getImageData(Math.round(x / 2), Math.round(y / 2), 1, 1).data[3];
        return { at: a(L.x, L.y + 20), far: a(Math.min(Graphics.width - 4, L.x + 400), Math.min(Graphics.height - 4, L.y + 250)), lit: Torch.isLit() }; })()`);
    t.check("... its light cuts the darkness there (the dark layer clear at the torch, dark far off)", dk.dark && !!spotD && !!hole && !hole.none && hole.at < hole.far * 0.6, { dk, spotD, hole });
});
