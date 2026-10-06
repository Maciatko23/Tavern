// The bear (combat stage 2, docs/WALKA.md 11.2; Hunting.js / Hunting_AI.js + Combat.js): what it is and where it comes from (rare,
// more at dawn and dusk), the F9 row, its sheets; the warning (it rears up and roars) and backing off; the paw (telegraphed - a roll
// gets out of it, a raised shield and a parry do NOT hold it); the pin (a leap that knocks the hero down; a roll through the leap saves
// him); it reels only from heavy blows; it turns back home when he is far (a fight lived through - the journal's goal); killed: XP, a
// carcass, dressed with a knife - bear meat, the bear's hide, sinews.
// CDP_PORT=9464 node tests/bear_test.js        (SHOTS=1: pictures into docs/walka/)
const kit = require("./lib/kit.js");
const SHOTS = !!process.env.SHOTS;

kit.test({ port: 9464 }, async t => {
    t.check("a new game on the meadow (Map004), 10:00", await t.newGame({ map: 4, x: 20, y: 14, hour: 10, quiet: true }));
    await t.eval("Hunting.RAID.perHour = 0; Hunting.BEAR_AI.warnChance = 1; $gameSystem.setStamina(100); $gameParty.leader().recoverAll(); 0");
    const shot = async name => { if (SHOTS) { await t.frames(2); await t.shot("../docs/walka/" + name); } };

    // ================= 1. what it is, where it comes from, its pictures =================
    const sp = await t.json("Hunting.SPECIES.bear");
    t.check("the bear: slower than the hero walks (3 < 4), much life and balance, heavy, about 4-22", !!sp && sp.speed < 4 && sp.trot < 4 && sp.hp >= 200 && sp.poise >= 120 &&
        sp.heavy && sp.bear && JSON.stringify(sp.hours) === "[[4,22]]", sp);
    const maps = await t.json("Object.keys(Hunting.BEAR_SPAWN.maps).map(Number)");
    t.check("it may come out on grandpa's field (3), the meadows (4, 17, 18), Leśna droga (21), Skraj lasu (23)", [3, 4, 17, 18, 21, 23].every(m => maps.includes(m)), maps);
    const ch = await t.json("({ noon: Hunting.bearChance(12), dusk: Hunting.bearChance(19), dawn: Hunting.bearChance(5), night: Hunting.bearChance(23) })");
    const all = await t.json("Object.values(Hunting.BEAR_SPAWN.maps)");
    t.check("10% an hour on every forest map (the user's, 2026-10-05), the same at any hour", all.every(p => p === 0.1) && [ch.noon, ch.dusk, ch.dawn, ch.night].every(p => p === 0.1), { all, ch });
    const sheets = await t.json(`new Promise(res => { const out = {}, list = ["anim8/Bear_Walk8", "anim8/Bear_Run8", "anim8/Bear_Rear8", "anim8/Bear_Swipe8", "anim8/Bear_Pounce8",
        "anim8/Bear_Roar8", "$Animal_Bear", "$Animal_Bear_Run", "$Animal_Bear_Rear", "$Animal_Bear_Swipe", "$Animal_Bear_Pounce", "$Animal_Bear_Roar"]; let left = list.length;
        for (const n of list) { const b = ImageManager.loadCharacter(n); const iv = setInterval(() => { if (!b.isReady() && !b.isError()) return; clearInterval(iv); out[n] = b.isError() ? null : [b.width, b.height]; if (--left === 0) res(out); }, 20); } })`);
    const cells = await t.json("Object.fromEntries(Object.values(Hunting.LOOK8).filter(l => /Bear/.test(l.sheet)).map(l => [l.sheet, l.cell]))");
    const okSheets = Object.entries(sheets).every(([n, s]) => s && (n.startsWith("anim8/") ? !!cells[n] && s[1] === cells[n] * 8 && s[0] % cells[n] === 0 && s[0] / cells[n] >= 7 : s[0] % 3 === 0 && s[1] % 4 === 0));
    t.check("its sheets load: six 8-way ones (8 rows) - walking, running, rearing up, the roar, the paw, the leap - and the old 4-way ones", okSheets, { sheets, cells });

    // an open field round the hero (the fights below)
    const room = await t.json(`(function(){
        const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && !Farming.buildingAt(x, y);
        let best = null;
        for (let y = 5; y < $gameMap.height() - 5; y++) for (let x = 6; x < $gameMap.width() - 6; x++) {
            let ok = true;
            for (let dx = -5; dx <= 5 && ok; dx++) for (let dy = -2; dy <= 2; dy++) if (!free(x + dx, y + dy)) { ok = false; break; }
            if (ok && (!best || Math.abs(x - $gameMap.width() / 2) < Math.abs(best.x - $gameMap.width() / 2))) best = { x, y };
        }
        return best; })()`);
    t.check("an open field 11 x 5 on the meadow", !!room, room);
    const cx = room.x, cy = room.y;
    const clear = () => t.eval("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); for (const c of Hunting.carcasses().slice()) Hunting.removeCarcass(c); 0");
    const heroAt = (x, y, d) => t.eval(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${d || 6}); $gameMap.setDisplayPos(${x} - 13, ${y} - 7); 0`);
    await heroAt(cx, cy);

    // ================= 2. how it comes: by itself (rare) and from F9 =================
    await t.eval("Hunting.BEAR_SPAWN.maps[4] = 1; 0");   // (a sure thing for the test)
    const natural = await t.json(`(function(){ ${"for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a);"} Hunting.bearCheck(); const a = Hunting.animals.filter(a => a.kind() === "bear");
        Hunting.bearCheck(); const b = Hunting.animals.filter(a => a.kind() === "bear");
        return { n1: a.length, n2: b.length, d: a.length ? Math.round(Math.hypot(a[0]._x - $gamePlayer.x, a[0]._y - $gamePlayer.y) * 10) / 10 : 0, home: a.length ? a[0]._home : null, x: a.length ? a[0]._x : -1, y: a.length ? a[0]._y : -1 }; })()`);
    t.check("a bear walks out of the forest far off (13+ tiles), its home where it came out; once an hour, one at a time", natural.n1 === 1 && natural.n2 === 1 && natural.d >= 13 &&
        natural.home && natural.home.x === natural.x && natural.home.y === natural.y, natural);
    await t.eval("Hunting.BEAR_SPAWN.maps[4] = 0.03; 0");
    await clear();
    await t.eval("Hunting.pending = 'bear'; 0");
    await t.frames(6);
    const f9 = await t.json("(function(){ const b = Hunting.animals.find(a => a.kind() === 'bear'); return b ? { d: Math.round(Math.hypot(b._x - $gamePlayer.x, b._y - $gamePlayer.y) * 10) / 10, summoned: !!b._summoned, lv: b._level, hp: b._maxHp } : null; })()");
    t.check("F9 'Niedźwiedź w pobliżu': a bear 7-10 tiles away, any hour (it stays)", !!f9 && f9.d >= 6.9 && f9.d <= 10.1 && f9.summoned, f9);
    await clear();

    // ================= 3. the warning: up on its hind legs, a roar - back off and it lets you be =================
    await heroAt(cx - 2, cy);
    await t.eval(`window.__bear = Hunting.spawn("bear", ${cx + 3}, ${cy}); __bear._home = { x: ${cx + 3}, y: ${cy} }; __bear._summoned = true; __bear._aware = 1; 0`);
    await t.until("__bear._mode === 'warn'", 5, 30);
    await t.frames(30);
    const warn = await t.json(`({ mode: __bear._mode, sheet: __bear.characterName(), drawn: __bear._sprite && __bear._sprite._look8Sheet, mark: !!(__bear._markSprite && __bear._markSprite.visible), f8: __bear.face8(), engaged: __bear._engaged,
        col: __bear._sprite ? Math.round(__bear._sprite._frame.x / 128) : -1 })`);
    t.check("it notices him 5 tiles off: it rises and roars (the roar's own 8-way sheet, past the rising frames) under a '!', facing him - not yet after him",
        warn.mode === "warn" && warn.sheet === "$Animal_Bear_Roar" && warn.drawn === "anim8/Bear_Roar8" && warn.col >= 5 && warn.mark && warn.f8 === 4 && !warn.engaged, warn);
    await shot("niedzwiedz_ostrzega.png");
    await heroAt(cx - 4, cy, 4);   // (he backs off: 7 tiles)
    await t.until("__bear._mode !== 'warn'", 6, 50);
    const calm = await t.json("({ mode: __bear._mode, engaged: __bear._engaged, bears: Hunting.hunt().bears || null })");
    t.check("he backed off: when it drops back on all fours it lets him be (roams, not after him)", calm.mode === "roam" && !calm.engaged, calm);
    await heroAt(cx + 1, cy, 6);   // (back again, 2 tiles from it)
    await t.until("__bear._mode === 'chase'", 6, 50);
    const came = await t.json("({ mode: __bear._mode, engaged: __bear._engaged, met: (Hunting.hunt().bears || {}).met || 0 })");
    t.check("he comes close again (2 tiles): no second warning, it comes at him", came.mode === "chase" && came.engaged && came.met === 1, came);

    // the fights below: the bear right beside him (or a few tiles off), after him, its own attacks held back (the test starts them)
    const arena = async (dx, opts = {}) => {
        await t.eval(`(function(){ const b = __bear; Combat.resetAct(); $gameParty.leader().recoverAll(); $gameSystem.setStamina(100);
            $gamePlayer.locate(${cx}, ${cy}); $gamePlayer.setDirection(6); b.locate(${cx + dx}, ${cy}); b._stun = 0; b._poise = b._maxPoise; b._hp = b._maxHp;
            b._engaged = true; b.setMode("chase"); b._gapT = 99999; b._f8 = 0; b._home = { x: ${cx + dx}, y: ${cy} }; window.__bus.length = 0; return 0; })()`);
        await t.frames(opts.settle || 4);
    };
    await t.eval("window.__bus = []; for (const n of ['heroHit', 'heroDown', 'bearSurvived', 'kill']) Tawerna.on(n, e => __bus.push(Object.assign({ n }, e, { animal: undefined })), { owner: 'BearTest' }); 0");
    // __auto presses keys inside the game loop at the right frame: "roll" (Space and the arrow away from the bear) when the paw is
    // about to fall (swipeWind, A.at frames left) or as the leap starts (lunge); "guard" holds P from the start; the keys are let go
    // when the attack is over
    await t.eval(`window.__auto = null; const _au = Scene_Map.prototype.update; Scene_Map.prototype.update = function() {
        const A = window.__auto, b = window.__bear;
        if (A && b && !A.done) {
            const now = A.on === "lunge" ? b._mode === "lunge" : b._mode === "swipeWind" && b._modeT <= A.at;
            if (!A.pressed && now) { A.pressed = true; A.keys = A.kind === "roll" ? [37, 32] : [80]; for (const k of A.keys) Input._onKeyDown({ keyCode: k, preventDefault() {} }); A.t = 0; }
            if (A.pressed && ++A.t > 6 && b._mode === "recover") { for (const k of A.keys) Input._onKeyUp({ keyCode: k }); A.done = true; }
        }
        _au.call(this);
    }; 0`);
    const atk = await t.eval("Hunting.atkOf(__bear)");

    // ================= 4. the paw: shown first, a roll gets out of it =================
    // (since 2026-10-06 the paw lands 6 frames into the sweep - on its frame: 'at: 4' rolls 10 frames before it, as 'at: 10' did before)
    await arena(1);
    await t.eval("$gameSystem._combatMode = true; window.__auto = { kind: 'roll', on: 'swipe', at: 4 }; __bear.startSwipe(); 0");
    await t.frames(6);
    const tele = await t.json("({ mode: __bear._mode, sheet: __bear.characterName(), mark: !!(__bear._markSprite && __bear._markSprite.visible), t: __bear._modeT })");
    t.check("the paw is shown first: it draws it back (its own sheet) under a '!' for a moment (about half a second)", tele.mode === "swipeWind" && tele.sheet === "$Animal_Bear_Swipe" && tele.mark && tele.t >= 20, tele);
    await shot("niedzwiedz_lapa.png");
    await t.until("__auto.done", 6, 50);
    const rolled = await t.json("({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result), mode: __bear._mode })");
    t.check("Space as the paw falls: the hero rolls out of it - no damage; the bear stands after it (the opening)", rolled.hp === rolled.mhp && !rolled.hits.includes("hit") && rolled.mode === "recover", rolled);

    // ================= 5. a raised shield does not hold it, nor a parry =================
    await t.give(155, 1);
    await arena(1);
    await t.eval("window.__auto = { kind: 'guard', on: 'swipe', at: 99 }; __bear.startSwipe(); 0");   // (P held from the start)
    await t.until("__bus.some(e => e.n === 'heroHit')", 4, 30);
    const fl = await t.json("Tawerna.api('Combat_parts').fight.floaters.map(f => f.text)");
    await t.until("__auto.done", 4, 50);
    const blocked = await t.json("({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result + ':' + e.damage) })");
    t.check("guarding with the shield (P held): the paw comes through whole - '" + atk + "' taken, not a quarter; 'Tego nie zatrzymasz!' over him",
        blocked.hits.length === 1 && blocked.hits[0] === "hit:" + atk && blocked.mhp - blocked.hp === atk && fl.includes("Tego nie zatrzymasz!"), { atk, blocked, fl });
    await arena(1);
    await t.eval("window.__auto = { kind: 'guard', on: 'swipe', at: 3 }; __bear.startSwipe(); 0");   // (P pressed just before the blow: a parry for anything else)
    await t.until("__auto.done", 6, 50);
    const parried = await t.json("({ hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result), stun: __bear._stun })");
    t.check("P just before the paw (the parry window): no parry - it hits, the bear does not reel", parried.hits.join() === "hit" && parried.stun === 0, parried);

    // ================= 6. the pin: rears up, leaps - he is knocked down =================
    await arena(3);
    await t.eval("__bear.startPin(); 0");
    await t.frames(12);
    const rear = await t.json("({ mode: __bear._mode, sheet: __bear.characterName(), mark: !!(__bear._markSprite && __bear._markSprite.visible) })");
    t.check("the pin is shown first: 3 tiles off it rears up high (the rearing sheet) under a '!'", rear.mode === "pinWind" && rear.sheet === "$Animal_Bear_Rear" && rear.mark, rear);
    await shot("niedzwiedz_staje_deba.png");
    await t.eval("window.__downAt = null; Tawerna.on('heroDown', () => { if (!window.__downAt) window.__downAt = { stun: Combat.act.stun, kind: Combat.act.stunKind }; }, { owner: 'BearTest' }); 0");
    await t.until("__bus.some(e => e.n === 'heroDown')", 5, 30);
    await shot("niedzwiedz_przygniata.png");
    const pin = await t.json("({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, down: __bus.filter(e => e.n === 'heroDown').map(e => e.by), at: window.__downAt, hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result + ':' + e.damage) })");
    const pinDmg = await t.eval("Math.round(Hunting.atkOf(__bear) * Hunting.BEAR_AI.pin.mult)");
    t.check("it leaps and comes down on him: knocked flat for a while (" + pinDmg + " taken)", pin.down.join() === "bear" && pin.at && pin.at.kind === "down" && pin.at.stun >= 50 &&
        pin.hits[0] === "hit:" + pinDmg, { pin, pinDmg });
    await t.until("__bear._mode === 'recover'", 3, 30);
    await t.frames(80);
    await arena(3);
    await t.eval("window.__auto = { kind: 'roll', on: 'lunge' }; __bear.startPin(); 0");
    await t.until("__auto.done", 6, 50);
    const dodgedPin = await t.json("({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result), down: __bus.filter(e => e.n === 'heroDown').length, mode: __bear._mode, t: __bear._modeT })");
    t.check("a roll as it leaps: it comes down beside him - no damage, not knocked down; it stands longer after the miss",
        dodgedPin.hp === dodgedPin.mhp && dodgedPin.down === 0 && !dodgedPin.hits.includes("hit") && dodgedPin.mode === "recover" && dodgedPin.t > 70, dodgedPin);
    await t.eval("window.__auto = null; 0");

    // ================= 7. it reels only from heavy blows =================
    await arena(1);
    const reel = await t.json(`(function(){ const b = __bear, out = { max: b._maxPoise };
        Hunting.hit(b, 4, "melee", { poise: 100 }); out.light1 = { poise: b._poise, stun: b._stun };
        for (let i = 0; i < 3; i++) Hunting.hit(b, 4, "melee", { poise: 100 }); out.light4 = { poise: b._poise, stun: b._stun };
        Hunting.hit(b, 4, "melee", { poise: 130, heavy: true }); out.heavy = { poise: b._poise, stun: b._stun };
        return out; })()`);
    t.check("light blows hardly move its balance (100 takes 30, four of them still no reel); a heavy one breaks it - it reels",
        reel.light1.poise === reel.max - 30 && reel.light1.stun === 0 && reel.light4.stun === 0 && reel.light4.poise === reel.max - 120 && reel.heavy.stun > 60, reel);
    await t.until("__bear._stun === 0", 4, 30);

    // ================= 7b. it fights to the death (the user's, 2026-10-05: no flight at low health) =================
    await arena(1);
    await t.eval("__bear._hp = Math.round(__bear._maxHp * 0.06); Hunting.hit(__bear, 3, 'melee', {}); 0");
    await t.frames(40);
    const last = await t.json("({ mode: __bear._mode, engaged: __bear._engaged, hp: __bear._hp, max: __bear._maxHp, dead: __bear._dead })");
    t.check("down to a few % of its life it does not run: it fights on", last.mode !== "flee" && last.engaged && !last.dead && last.hp > 0 && last.hp < last.max * 0.1, last);

    // ================= 8. it does not follow far: he gets away, it goes home =================
    await arena(1);
    await t.eval(`__bear._home = { x: ${cx + 5}, y: ${cy} }; $gamePlayer.locate(${cx - 11}, ${cy}); 0`);   // (12 tiles from it; its home 4 tiles behind it)
    await t.until("__bear._mode === 'leave'", 4, 30);
    const left = await t.json("({ mode: __bear._mode, engaged: __bear._engaged, bears: Hunting.hunt().bears, ev: __bus.filter(e => e.n === 'bearSurvived').length, goal: Journal.GOALS.find(g => g.id === 'bear').done() })");
    t.check("12 tiles away: it gives up and turns back home - a bear met and lived through (the journal's 'Przeżyj spotkanie z niedźwiedziem' counts it)",
        left.mode === "leave" && !left.engaged && left.bears.survived === 1 && left.ev === 1 && left.goal === true, left);
    await t.until(`__bear._mode === 'roam'`, 10, 50);
    const home = await t.json(`({ mode: __bear._mode, d: Math.hypot(__bear._x - ${cx + 5}, __bear._y - ${cy}) })`);
    t.check("it walks back to its home and calms down there", home.mode === "roam" && home.d <= 1.6, home);

    // ================= 9. killed: XP, a carcass, meat and its hide =================
    await arena(1);
    await t.eval("for (const it of $dataItems) if (it) Combat.hero().firsts['i' + it.id] = true; 0");   // (no "first item" XP in the sums below)
    const xp0 = await t.json("({ lv: Combat.hero().level, xp: Combat.hero().xp, want: Combat.killXp('bear', __bear._level) })");
    await t.eval("Hunting.hit(__bear, 99999, 'melee', {}); 0");
    await t.frames(40);
    const dead = await t.json("({ lv: Combat.hero().level, xp: Combat.hero().xp, carcasses: Hunting.carcasses().map(c => ({ kind: c.kind, x: c.x, y: c.y })), kills: Hunting.hunt().kills.bear, bears: Hunting.hunt().bears })");
    t.check("killed: the XP of a bear (" + xp0.want + " at its level; 60 a level-1 one), it lies there (a carcass)",
        xp0.want >= 60 && (dead.lv > xp0.lv || dead.xp - xp0.xp === xp0.want) && dead.carcasses.length === 1 && dead.carcasses[0].kind === "bear" && dead.kills === 1, { xp0, dead });
    await shot("niedzwiedz_zwloki.png");
    const c = dead.carcasses[0];
    await t.give(90, 1);
    await t.eval(`$gamePlayer.locate(${Math.floor(c.x) - 1}, ${Math.floor(c.y)}); $gamePlayer.setDirection(6); 0`);
    await t.frames(4);
    const before = await t.json("[168, 170, 163].map(i => $gameParty.numItems($dataItems[i]))");
    await t.press("ok");
    await t.frames(80);
    const after = await t.json("[168, 170, 163].map(i => $gameParty.numItems($dataItems[i]))");
    t.check("dressed with a knife: 5 pieces of bear meat, the bear's hide (not a plain raw hide), 3 sinews",
        after[0] - before[0] === 5 && after[1] - before[1] === 1 && after[2] - before[2] === 3, { before, after });
    const items = await t.json("[168, 169, 170].map(i => $dataItems[i] && { name: $dataItems[i].name, price: $dataItems[i].price })");
    const tan = await t.json("(function(){ const r = Farming.BUILDINGS.tannery.recipes.find(r => r.id === 'tan_bear'); return r ? { in: r.inputs, out: r.output } : null; })()");
    const roast = await t.json("(function(){ const r = Farming.BUILDINGS.campfire.recipes.find(r => r.id === 'roast_bear'); return r ? { in: r.inputs, out: r.output } : null; })()");
    t.check("the bear's things: raw / roasted bear meat, the bear's hide - valuable (sells dear); the tannery makes 3 hides of it, the fire roasts the meat",
        items.every(Boolean) && items[2].price >= 50 && tan && tan.in[0][0] === 170 && tan.out[0] === 97 && tan.out[1] === 3 && roast && roast.in[0][0] === 168 && roast.out[0] === 169, { items, tan, roast });
});
