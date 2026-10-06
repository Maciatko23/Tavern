// The men (combat stage 3, docs/WALKA.md 11.3; Humans.js + Humans_Data.js, Combat.js): the three kinds and their sheets, the F9 rows,
// the level by place; the bandit's blow (telegraphed: a roll, a parry, a shield), his guard; the mercenary's shield (light blows from the
// front blocked, a heavy one breaks it, from behind it hurts more, blows on the shield make him hit back), his overhead blow that breaks
// the hero's guard; the archer (backs off, aims with a line that locks, the arrow - a roll lets it through, a shield stops it); begging
// for mercy (not a target any more, the choice: spare, rob, finish - the town's opinion), the body searched; beaten down - robbed, not
// killed; a night camp (fire, its light, sleepers, a blow from hiding, the noise wakes them, the sack, dawn); an ambush and the band's
// end on the bus; the skills Rozbrojenie and Postrach.
// CDP_PORT=9465 node tests/humans_test.js        (SHOTS=1: pictures into docs/walka/)
const kit = require("./lib/kit.js");
const SHOTS = !!process.env.SHOTS;

kit.test({ port: 9465 }, async t => {
    t.check("a new game on the meadow (Map004), 10:00", await t.newGame({ map: 4, x: 20, y: 14, hour: 10, quiet: true }));
    await t.eval("Hunting.RAID.perHour = 0; $gameSystem.setStamina(100); $gameParty.leader().recoverAll(); 0");
    const shot = async name => { if (SHOTS) { await t.frames(2); await t.shot("../docs/walka/" + name); } };

    // ================= 1. what they are, their pictures =================
    const kinds = await t.json("Object.fromEntries(Object.entries(Humans.KINDS).map(([k, d]) => [k, { hp: d.hp, poise: d.poise, mercy: d.mercy, look: d.look }]))");
    t.check("four kinds: the bandit, the knife bandit, the archer, the mercenary (the strongest: most life and balance); their blows never kill",
        kinds.bandit && kinds.knifer && kinds.archer && kinds.mercenary && kinds.knifer.look === "Knife" && kinds.mercenary.hp > kinds.bandit.hp && kinds.bandit.hp > kinds.archer.hp && kinds.mercenary.poise > kinds.bandit.poise &&
        Object.values(kinds).every(k => k.mercy), kinds);
    const sheets = await t.json(`new Promise(res => { const names = Object.keys(Hunting.LOOK8).filter(k => /^\\$Human_/.test(k)), list = names.concat(names.map(k => Hunting.LOOK8[k].sheet)), out = {};
        let left = list.length;
        for (const n of list) { const b = ImageManager.loadCharacter(n); const iv = setInterval(() => { if (!b.isReady() && !b.isError()) return; clearInterval(iv); out[n] = b.isError() ? null : [b.width, b.height]; if (--left === 0) res({ out, cells: Object.fromEntries(names.map(k => [Hunting.LOOK8[k].sheet, Hunting.LOOK8[k].cell])) }); }, 20); } })`);
    const sheetsOk = Object.entries(sheets.out).every(([n, s]) => s && (n.startsWith("anim8/") ? s[1] === sheets.cells[n] * 8 && s[0] % sheets.cells[n] === 0 : s[0] % 3 === 0 && s[1] % 4 === 0));
    t.check("every sheet loads: 8-way ones (walking, the blows, on his knees, by the fire, lying; the shield) and their 4-way $Human_* sheets", sheetsOk && Object.keys(sheets.out).length >= 30,
        Object.entries(sheets.out).filter(([n, s]) => !s).map(([n]) => n));
    const sk = await t.json("({ xp: [Combat.KILL_XP.bandit, Combat.KILL_XP.archer, Combat.KILL_XP.mercenary], n: Combat.SKILLS.length, d: !!Combat.SKILLS.find(s => s.id === 'd_disarm'), m: !!Combat.SKILLS.find(s => s.id === 'm_fear') })");
    t.check("experience for beating them (bandit 30, archer 30, mercenary 60) and two new skills: Rozbrojenie (Obrona), Postrach (Walka wręcz)",
        sk.xp.join() === "30,30,60" && sk.d && sk.m && sk.n >= 100, sk);

    // an open field round the hero (the fights below)
    const room = await t.json(`(function(){
        const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && !Farming.buildingAt(x, y);
        let best = null;
        for (let y = 6; y < $gameMap.height() - 6; y++) for (let x = 8; x < $gameMap.width() - 8; x++) {
            let ok = true;
            for (let dx = -7; dx <= 7 && ok; dx++) for (let dy = -2; dy <= 2; dy++) if (!free(x + dx, y + dy)) { ok = false; break; }
            if (ok && (!best || Math.abs(x - $gameMap.width() / 2) < Math.abs(best.x - $gameMap.width() / 2))) best = { x, y };
        }
        return best; })()`);
    t.check("an open field 15 x 5 on the meadow", !!room, room);
    const cx = room.x, cy = room.y;
    const clear = () => t.eval("Humans.clear(); for (const d of Humans.drops().slice()) Humans.removeDrop(d); Combat.resetAct(); 0");
    const heroAt = (x, y, d) => t.eval(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${d || 6}); $gameMap.setDisplayPos(${x} - 13, ${y} - 7); 0`);
    await heroAt(cx, cy);

    // ================= 2. F9 and the level by place =================
    for (const [kind, lo, hi] of [["bandit", 5, 7], ["archer", 6, 8], ["mercenary", 5, 7]]) {
        await clear();
        await t.eval(`Humans.pending = '${kind}'; 0`);
        await t.frames(4);
        const f9 = await t.json(`(function(){ const h = Humans.list.find(o => o._kind === '${kind}'); return h ? { d: Math.round(Math.hypot(h._x - $gamePlayer.x, h._y - $gamePlayer.y) * 10) / 10, lv: h._level, place: Combat.placeLevel(), hp: h._maxHp } : null; })()`);
        t.check("F9 '" + kind + "': one " + lo + "-" + hi + " tiles away, his level by the place (meadow " + (f9 && f9.place) + ")", !!f9 && f9.d >= lo - 0.1 && f9.d <= hi + 0.1 &&
            f9.lv >= f9.place + (kind === "mercenary" ? 1 : 0) && f9.lv <= f9.place + (kind === "mercenary" ? 2 : 1), f9);
    }
    await clear();

    // the bus, and the key presses inside the game loop (__auto): "roll" (Space and the arrow away) / "parry" (P) when the man's wind-up has
    // A.at frames left (or the archer's aim locks), "guard" holds P from the start; the keys go up once the blow is over
    await t.eval("window.__bus = []; for (const n of ['heroHit', 'heroDown', 'humanSurrender', 'humanDefeated', 'humansDone', 'kill', 'heroRobbed', 'campCleared']) Tawerna.on(n, e => __bus.push(Object.assign({ n }, e, { human: undefined, animal: undefined, isHuman: !!e.human })), { owner: 'HumansTest' }); 0");
    await t.eval(`window.__auto = null; const _au = Scene_Map.prototype.update; Scene_Map.prototype.update = function() {
        const A = window.__auto, h = window.__h;
        if (A && h && !A.done) {
            const now = A.on === "aim" ? !!(h._aim && h._aim.locked) : h._mode === "windup" && h._modeT <= A.at;
            if (!A.pressed && (now || A.kind === "guard")) { A.pressed = true; A.keys = A.kind === "roll" ? [A.arrow || 37, 32] : [80]; for (const k of A.keys) Input._onKeyDown({ keyCode: k, preventDefault() {} }); A.t = 0; }
            A.wound = A.wound || h._mode === "windup" || h._mode === "draw";
            const over = h._stun > 0 || (A.wound && h._mode !== "windup" && h._mode !== "strike" && h._mode !== "draw" && h._mode !== "loose" && !Humans.arrows.length);
            if (A.pressed && ++A.t > 8 && over) { for (const k of A.keys) Input._onKeyUp({ keyCode: k }); A.done = true; }
        }
        _au.call(this);
    }; 0`);
    // a man right beside the hero, after him, his blows held back (the test starts them); no feints, no second blow
    const arena = async (kind, dx, opts = {}) => {
        await t.eval("for (const k of [32, 37, 38, 39, 40, 80]) Input._onKeyUp({ keyCode: k }); 0");   // (keys an earlier check may have left down)
        await clear();
        await t.eval(`(function(){ $gameParty.leader().recoverAll(); $gameSystem.setStamina(100); $gamePlayer.locate(${cx}, ${cy}); $gamePlayer.setDirection(6);
            const h = window.__h = Humans.spawn('${kind}', ${cx + dx}, ${cy}, { level: 1 });
            h._def = JSON.parse(JSON.stringify(h._def)); h._def.feint = 0; h._def.blow.combo = 0; if (h._def.guard) h._def.guard.chance = 0; h._def.surrender.chance = ${opts.surrender || 0};
            h.engage(false); h._band.gapT = 99999; h._gapT = 99999; h._faceAng = Math.PI; window.__bus.length = 0; window.__auto = null; return 0; })()`);
        await t.frames(opts.settle || 4);
    };
    const blow = name => t.eval(`__h.locate(${cx + 1}, ${cy}); __h._faceAng = Math.PI; __h.startBlow('` + name + `'); 0`);
    const hits = () => t.json("__bus.filter(e => e.n === 'heroHit').map(e => e.result)");

    // ================= 3. the bandit's blow: shown first; a roll, a parry, a shield =================
    await t.eval("$gameSystem._combatMode = true; 0");
    await arena("bandit", 1);
    await blow("main");
    await t.frames(6);
    const tele = await t.json("({ mode: __h._mode, sheet: __h.characterName(), drawn: __h._sprite && __h._sprite._look8Sheet, mark: !!(__h._markSprite && __h._markSprite.visible), t: __h._modeT })");
    t.check("the blow is shown first: he draws the club back (his own 96 px sheet) under a '!' for a moment", tele.mode === "windup" && tele.sheet === "$Human_Bandit_Atk" && tele.drawn === "anim8/Bandit_Atk8" && tele.mark && tele.t >= 12, tele);
    await shot("bandyta_zamach.png");
    await t.until("__h._mode === 'recover'", 4, 30);
    const clean = await t.json("({ hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result + ':' + e.by), hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp })");
    t.check("no guard, no roll: the club lands (heroHit 'hit' by the bandit), it hurts", clean.hits.join() === "hit:bandit" && clean.hp < clean.mhp, clean);

    await arena("bandit", 1);
    await t.eval("window.__auto = { kind: 'roll', at: 4, arrow: 37 }; 0");
    await blow("main");
    await t.until("__auto.done", 5, 30);
    const rolled = await t.json("({ hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result), hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, mode: __h._mode })");
    t.check("Space as the club comes: he rolls away - no damage; the bandit stands open after it", rolled.hp === rolled.mhp && !rolled.hits.includes("hit") && rolled.mode === "recover", rolled);

    await arena("bandit", 1);
    await t.eval("window.__auto = { kind: 'parry', at: 3 }; 0");
    await blow("main");
    await t.until("__auto.done", 5, 30);
    const par = await t.json("({ hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result), stun: __h._stun, hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp })");
    t.check("P just before the blow: parried - the bandit reels (the hero is not hurt)", par.hits.join() === "parried" && par.stun > 0 && par.hp === par.mhp, par);
    await shot("bandyta_parowanie.png");

    await t.give(155, 1);
    await arena("bandit", 1);
    await t.eval("window.__auto = { kind: 'guard', at: 99 }; 0");
    await t.frames(3);
    await blow("main");
    await t.until("__bus.some(e => e.n === 'heroHit')", 4, 30);
    const blk = await t.json("({ hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result + ':' + e.damage), hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp })");
    t.check("the shield up from the start: blocked - only a little gets through", blk.hits.length === 1 && /^blocked:/.test(blk.hits[0]) && blk.mhp - blk.hp <= 5, blk);
    await t.eval("Input._onKeyUp({ keyCode: 80 }); 0");

    // ================= 4. the bandit's guard =================
    await arena("bandit", 1);
    await t.eval("__h.setMode('guard', 200); 0");
    const g1 = await t.json("(function(){ const hp = __h._hp; Humans.hit(__h, 20, 'melee', { poise: 20 }); return { lost: hp - __h._hp, stun: __h._stun, words: Tawerna.api('Combat_parts').fight.floaters.map(f => f.text).slice(-2) }; })()");
    t.check("his club raised against a light blow from the front: most of it stopped ('Blok'), the hero's arms jar", g1.lost <= 5 && g1.stun === 0 && g1.words.some(w => /Blok|Zablokowane/.test(w)), g1);
    const g2 = await t.json("(function(){ const hp = __h._hp; Humans.hit(__h, 20, 'melee', { poise: 40, heavy: true }); return { lost: hp - __h._hp, stun: __h._stun, words: Tawerna.api('Combat_parts').fight.floaters.map(f => f.text).slice(-2) }; })()");
    t.check("a heavy blow breaks his guard: he reels, open, most of the blow gets through", g2.lost >= 12 && g2.stun > 0 && g2.words.some(w => /przełamana/.test(w)), g2);

    // ================= 5. the mercenary's shield =================
    await arena("mercenary", 1);
    await t.frames(10);
    const m1 = await t.json("(function(){ const h = __h; h._faceAng = Math.PI; const hp = h._hp; Humans.hit(h, 30, 'melee', { poise: 30 }); return { lost: hp - h._hp, up: h.guarding(), blocks: h._blocks.length, stun: h._stun }; })()");
    t.check("his shield stops a light blow from the front ('Zablokowane' - next to nothing gets through)", m1.lost <= 3 && m1.blocks === 1 && m1.stun === 0, m1);
    const m2 = await t.json("(function(){ const h = __h; h._faceAng = 0; h._blocks = []; const hp = h._hp; Humans.hit(h, 20, 'melee', { poise: 10 }); return { lost: hp - h._hp }; })()");
    t.check("from behind (he faces away): no shield, and it hurts more (x1.25: 'Cios w plecy!')", m2.lost === 25, m2);
    await t.eval("__h._faceAng = Math.PI; __h._stun = 0; __h._poise = __h._maxPoise; __h._guardBroken = false; __h.setMode('chase'); 0");
    const m3 = await t.json("(function(){ const h = __h; const hp = h._hp; Humans.hit(h, 30, 'melee', { poise: 60, heavy: true }); return { lost: hp - h._hp, stun: h._stun, broken: !!h._guardBroken }; })()");
    t.check("a heavy blow breaks his guard: he reels a long moment (70 frames), most of the blow gets through", m3.stun >= 60 && m3.broken && m3.lost >= 18, m3);
    await t.eval("__h._stun = 0; __h._poise = __h._maxPoise; __h._guardBroken = false; __h.setMode('chase'); __h._band.gapT = 0; __h._gapT = 0; __h._faceAng = Math.PI; 0");
    await t.eval(`__h.locate(${cx + 1}, ${cy}); for (let i = 0; i < 3; i++) Humans.hit(__h, 10, 'melee', { poise: 5 }); __h._band.gapT = 99999; __h._gapT = 99999; 0`);
    await t.frames(3);
    const m4 = await t.json("({ mode: __h._mode, blow: __h._blow })");
    t.check("three blows on his shield: he hits back with it at once (the shield bash)", m4.mode === "windup" && m4.blow === "bash", m4);
    await shot("najemnik_tarcza.png");
    // his overhead blow against the hero's guard: it breaks it
    await arena("mercenary", 1);
    await t.eval("window.__auto = { kind: 'guard', at: 99 }; 0");
    await t.frames(3);
    await blow("heavy");
    await t.frames(8);
    await shot("najemnik_cios_z_gory.png");
    await t.until("__bus.some(e => e.n === 'heroHit')", 4, 30);
    const hv = await t.json("({ hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result), stun: Combat.act.stun, kind: Combat.act.stunKind })");
    t.check("his overhead blow against a raised shield: the guard is broken (the hero staggers)", hv.hits.join() === "guardbreak" && hv.stun > 0, hv);
    await t.eval("Input._onKeyUp({ keyCode: 80 }); Combat.resetAct(); 0");

    // ================= 6. the archer =================
    await arena("archer", 2);
    await t.eval("__h._gapT = 0; __h._band.gapT = 0; 0");
    await t.frames(150);
    const back = await t.json("({ d: Math.round(__h.playerDistance() * 10) / 10, mode: __h._mode })");
    t.check("the hero 2 tiles from the archer: he backs off to 3.4+ tiles", back.d >= 3.3, back);
    await arena("archer", 5);
    await t.eval("__h._gapT = 0; 0");
    await t.until("__h._mode === 'draw'", 4, 30);
    await t.frames(16);
    const aim = await t.json("({ mode: __h._mode, aim: !!__h._aim, line: SceneManager._scene._spriteset._humansLayer._aims.size, mark: !!(__h._markSprite && __h._markSprite.visible), sheet: __h.characterName() })");
    t.check("he draws the bow under a '!': a line shows where he aims", aim.mode === "draw" && aim.aim && aim.line === 1 && aim.mark && aim.sheet === "$Human_Archer_Atk", aim);
    await shot("lucznik_celuje.png");
    await t.until("__h._aim && __h._aim.locked", 4, 20);
    const locked = await t.json("({ x: __h._aim.x, y: __h._aim.y, t: __h._modeT })");
    await t.until("__bus.some(e => e.n === 'heroHit') || (__h._mode === 'reload' && !Humans.arrows.length)", 4, 20);
    const arrowHit = await t.json("({ hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result + ':' + e.name), hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp })");
    t.check("the aim locks a moment before the shot (" + locked.t + " frames), then the arrow flies - standing still, the hero takes it", locked.t >= 8 && arrowHit.hits.join() === "hit:strzała" && arrowHit.hp < arrowHit.mhp, { locked, arrowHit });
    await arena("archer", 5);
    await t.eval("__h._gapT = 0; window.__auto = { kind: 'roll', on: 'aim', arrow: 38 }; 0");
    await t.until("__auto.done || (__h._mode === 'reload' && !Humans.arrows.length && __auto.pressed)", 6, 30);
    await t.until("!Humans.arrows.length", 3, 20);
    const dodge = await t.json("({ hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result), hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp })");
    t.check("a roll when the line locks: the arrow goes by (no damage)", dodge.hp === dodge.mhp && !dodge.hits.includes("hit"), dodge);
    await arena("archer", 5);
    await t.eval("$gamePlayer.setDirection(6); __h._gapT = 0; window.__auto = { kind: 'guard', at: 99 }; 0");
    await t.until("__bus.some(e => e.n === 'heroHit')", 6, 30);
    const sblk = await t.json("({ hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result), hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp })");
    t.check("the shield up towards him: the arrow is blocked", sblk.hits[0] === "blocked" && sblk.mhp - sblk.hp <= 5, sblk);
    await t.eval("Input._onKeyUp({ keyCode: 80 }); Combat.resetAct(); 0");

    // ================= 7. begging for mercy: spare, rob, finish =================
    const surrenderOne = async () => {
        await arena("bandit", 2, { surrender: 1 });
        await t.eval("__h._hp = 14; Humans.hit(__h, 4, 'melee', { poise: 1 }); 0");
        await t.frames(4);
    };
    const choose = async i => {
        await t.eval(`$gamePlayer.locate(__h._x - 1, __h._y); $gamePlayer.setDirection(6); 0`);
        const up = await t.until("$gameMessage.isChoice() && SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active", 6, 50);
        if (up) await t.eval(`(function(){ const cw = SceneManager._scene._choiceListWindow; cw.select(${i}); cw.deactivate(); cw.callOkHandler(); return 0; })()`);
        await t.until("!$gameMessage.isBusy() && !$gameMap.isEventRunning()", 4, 30);
        return up;
    };
    await t.eval("$gameSystem._combatMode = false; 0");
    const xp0 = await t.eval("Combat.hero().xp + Combat.hero().level * 100000");
    await surrenderOne();
    const kneel = await t.json("({ mode: __h._mode, sheet: __h.characterName(), said: SpeechBubbles.log.slice(-1)[0], target: Hunting.allTargets().some(t => t.ref === __h), bus: __bus.filter(e => e.n === 'humanSurrender').length, xp: Combat.hero().xp + Combat.hero().level * 100000 })");
    t.check("under a quarter of his life he begs: on his knees ('Litości' / 'Nie zabijaj'), no target any more (no blow finishes him by chance); experience for beating him",
        kneel.mode === "surrender" && kneel.sheet === "$Human_Bandit_Kneel" && /Litości|Nie zabijaj|Dość/.test(kneel.said) && !kneel.target && kneel.bus === 1 && kneel.xp > xp0, kneel);
    await shot("bandyta_poddaje_sie.png");
    const op0 = await t.eval("window.TownQuests && TownQuests.opinion ? TownQuests.opinion() : -1");
    const up1 = await choose(0);
    await t.frames(10);
    const sp = await t.json("({ how: __bus.filter(e => e.n === 'humanDefeated').map(e => e.how), mode: __h._mode, op: window.TownQuests && TownQuests.opinion ? TownQuests.opinion() : -1 })");
    t.check("the hero comes up to him: the choice (spare / take his purse / finish / leave); spared - he walks off, the town thinks better of the hero",
        up1 && sp.how.join() === "spared" && sp.mode === "leave" && (op0 < 0 || sp.op >= op0), { up1, sp, op0 });
    await surrenderOne();
    const gold0 = await t.eval("$gameParty.gold()");
    await t.eval("__h._gold = 9; 0");
    await choose(1);
    const rob = await t.json("({ how: __bus.filter(e => e.n === 'humanDefeated').map(e => e.how), gold: $gameParty.gold(), mode: __h._mode })");
    t.check("'Zabierz mu sakiewkę': his coins are the hero's, he runs", rob.how.join() === "robbed" && rob.gold === gold0 + 9 && rob.mode === "flee", { rob, gold0 });
    await surrenderOne();
    const op1 = await t.eval("window.TownQuests && TownQuests.opinion ? TownQuests.opinion() : -1");
    await t.eval("__h._gold = 7; __h._loot = [[83, 1]]; 0");
    await choose(2);
    await t.until("__bus.some(e => e.n === 'kill')", 4, 30);
    const fin = await t.json("({ kill: __bus.filter(e => e.n === 'kill').map(e => e.kind + ':' + e.noXp + ':' + e.isHuman), how: __bus.filter(e => e.n === 'humanDefeated').map(e => e.how + ':' + e.begged), drops: Humans.drops().map(d => d.kind + ':' + d.gold), op: window.TownQuests && TownQuests.opinion ? TownQuests.opinion() : -1 })");
    t.check("'Dobij go': the hero's blow, he is dead - a body on the ground; 'kill' on the bus (no second experience); a beggar killed - the opinion drops",
        fin.kill.join() === "bandit:true:true" && fin.how.join() === "killed:true" && fin.drops.some(d => /^body:7/.test(d)) && (op1 < 0 || fin.op < op1), { fin, op1 });
    await shot("bandyta_cialo.png");
    // the body searched
    const body = await t.json("(function(){ const d = Humans.drops().find(d => d.kind === 'body'); return d ? { x: d.x, y: d.y } : null; })()");
    await t.eval(`$gamePlayer.locate(Math.floor(${body.x}) - 1, Math.floor(${body.y})); $gamePlayer.setDirection(6); 0`);
    await t.until("!$gamePlayer.isToolSwinging()", 3, 20);
    const g0 = await t.eval("$gameParty.gold()"), bread0 = await t.eval("$gameParty.numItems($dataItems[83])");
    await t.eval("Humans.searchDrop(Humans.dropAhead()); 0");
    await t.frames(60);
    const loot = await t.json(`({ gold: $gameParty.gold() - ${g0}, bread: $gameParty.numItems($dataItems[83]) - ${bread0}, left: Humans.drops().filter(d => d.kind === 'body').map(d => d.gold) })`);
    t.check("the action button by the body: the hero crouches and takes what he had (7 G, bread); the body stays, empty", loot.gold === 7 && loot.bread === 1 && loot.left.join() === "0", loot);

    // ================= 8. beaten down: robbed, not killed =================
    await arena("bandit", 1);
    await t.eval("$gameParty.gainGold(100 - $gameParty.gold()); $gameParty.leader().setHp(5); window.__h0 = Tawerna.time.day() * 24 + Tawerna.time.hour(); 0");
    await blow("main");
    await t.until("!!Humans.robbery", 4, 30);
    const rob1 = await t.json("({ hp: $gameParty.leader().hp, dead: $gameParty.leader().isDead(), mode: __h._mode, stun: Combat.act.stun })");
    await t.until("__bus.some(e => e.n === 'heroRobbed')", 8, 50);
    await t.frames(40);
    const rob2 = await t.json("({ gold: $gameParty.gold(), hp: $gameParty.leader().hp, men: Humans.list.length, hours: Math.round((Tawerna.time.day() * 24 + Tawerna.time.hour() - __h0) * 10) / 10, wounded: $gameSystem.isWounded ? $gameSystem.isWounded() : null, scene: SceneManager._scene.constructor.name })");
    t.check("their blow brings him to his last life, not past it: he lies, they stand over him", rob1.hp === 1 && !rob1.dead && rob1.mode === "gloat" && rob1.stun > 0, rob1);
    t.check("he comes to an hour later, robbed (40% of his gold), wounded, alive; they are gone", rob2.gold === 60 && rob2.hp >= 1 && rob2.men === 0 && rob2.hours >= 0.9 && rob2.scene === "Scene_Map", rob2);

    // ================= 9. a night camp =================
    t.check("to Leśna droga (Map021) at night", await t.go(21, 20, 15, 2));
    await t.eval("Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gameSystem.setDayNightHour(23); $gameParty.leader().recoverAll(); Combat.resetAct(); 0");
    const chance = await t.json("({ here: Humans.campChance(), town: Humans.CAMP.maps[8] || 0, field: Humans.CAMP.maps[3] || 0, house: Humans.CAMP.maps[20] || 0 })");
    t.check("camps on the forest road (a chance a night), never in the town, on grandpa's field or by his house", chance.here > 0 && !chance.town && !chance.field && !chance.house, chance);
    await t.eval("Humans.pending = 'camp'; 0");
    await t.frames(10);
    const camp = await t.json(`(function(){ const c = Humans.campHere(); if (!c) return null; const set = SceneManager._scene._spriteset;
        return { x: c.x, y: c.y, d: Math.round(Math.hypot(c.x - $gamePlayer.x, c.y - $gamePlayer.y) * 10) / 10, men: Humans.list.map(h => h._kind + ':' + h._mode), fire: !!set._humansLayer._fire,
            light: set._nightLight.lights().some(l => l.id >= 7100 && l.id < 7200 && l.glow), sack: Humans.drops().some(d => d.kind === 'sack') }; })()`);
    t.check("F9 'Obóz bandytów': a fire some tiles off, 2-4 men - some asleep, one or two awake by it -, a sack; the fire lights the night (glow)",
        !!camp && camp.men.length >= 2 && camp.men.some(m => /sleep/.test(m)) && camp.men.some(m => /sit/.test(m)) && camp.fire && camp.light && camp.sack && camp.d >= 8, camp);
    if (camp) {
        await t.eval(`$gamePlayer.locate(${camp.x}, ${camp.y} + 4); $gameMap.setDisplayPos(${camp.x} - 13, ${camp.y} - 7); 0`);
        await t.frames(30);
        await shot("oboz_noc.png");
        // a sleeper: sneaking up behind him, a blow from hiding - he reels; the noise of it wakes the others (a camp of 3: 1-2 awake, so one asleep)
        await t.eval("Humans.clear(); for (const d of Humans.drops().slice()) Humans.removeDrop(d); const c3 = Humans.camp({ size: 3, kinds: ['bandit', 'bandit', 'bandit'] }); 0");
        await t.frames(5);
        await t.eval("for (const h of Humans.list) { h._aware = 0; h._frozen = false; } Hunting.setSneak(true); $gameSystem._combatMode = true; 0");
        // (beside him on the side away from THIS camp's fire - not the first camp's - and never on another man's or the fire's tile)
        const sl = await t.json(`(function(){ const h = Humans.list.find(o => o._mode === 'sleep'); if (!h) return null; window.__s = h;
            const c = Humans.campHere() || { x: ${camp.x}, y: ${camp.y} };
            const taken = (x, y) => Humans.list.some(o => o !== h && o._x === x && o._y === y) || (c.x === x && c.y === y);
            let x = h._x + (h._x >= c.x ? 1 : -1); if (taken(x, h._y)) x = 2 * h._x - x; $gamePlayer.locate(x, h._y); $gamePlayer.setDirection(x > h._x ? 4 : 6); for (const o of Humans.list) o._aware = 0; return { x: h._x, y: h._y }; })()`);
        t.check("a camp of three: one asleep at least", !!sl, sl);
        if (sl) {
            await t.frames(2);
            const s0 = await t.eval("Combat.act.sneaks || 0");
            await t.key("O");
            await t.until("__s._stun > 0 || __s._dead", 3, 30);
            const sn = await t.json(`({ sneaks: (Combat.act.sneaks || 0) - ${s0}, stun: __s._stun, dead: __s._dead, hp: __s._hp, max: __s._maxHp })`);
            t.check("a blow from hiding on a sleeper (sneaking, C): 'Atak z ukrycia!' - he reels", sn.sneaks === 1 && (sn.stun > 0 || sn.dead), sn);
            await t.frames(150);
            const woke = await t.json("Humans.list.map(h => h._kind + ':' + h._mode + ':' + h._engaged)");
            t.check("the noise of the fight wakes the camp: they come at him", woke.filter(w => /:true$/.test(w)).length >= 2, woke);
            await shot("oboz_walka.png");
        }
        await t.eval("Hunting.setSneak(false); $gameSystem._combatMode = false; 0");
        // the sack stolen from a sleeping camp
        await t.eval("Humans.clear(); for (const d of Humans.drops().slice()) Humans.removeDrop(d); 0");
        // (asleep a few tiles from the sack: one lying right by it would wake at the rustle)
        const c2 = await t.json("(function(){ const c = Humans.camp({ size: 2, kinds: ['bandit', 'bandit'] }); Humans.list.forEach((h, i) => { h.locate(c.x + (i ? 2 : -2), c.y - 1); h.setMode('sleep'); h._aware = 0; }); const s = Humans.drops().find(d => d.kind === 'sack'); return c && s ? { x: s.x, y: s.y, gold: s.gold } : null; })()");
        if (c2) {
            await t.eval(`$gamePlayer.locate(Math.floor(${c2.x}) - 1, Math.floor(${c2.y})); $gamePlayer.setDirection(6); Hunting.setSneak(true); 0`);
            const gs = await t.eval("$gameParty.gold()");
            await t.eval("Humans.searchDrop(Humans.dropAhead()); 0");
            await t.frames(60);
            const stole = await t.json(`({ gold: $gameParty.gold() - ${gs}, sack: Humans.drops().some(d => d.kind === 'sack'), engaged: Humans.list.filter(h => h._engaged).length })`);
            t.check("the camp's sack taken while they sleep (sneaking): its coins, the sack gone, nobody up", stole.gold === c2.gold && !stole.sack && stole.engaged === 0, stole);
            await t.eval("Hunting.setSneak(false); 0");
        }
        // dawn: the camp packs up
        await t.eval("$gameSystem.setDayNightHour(6); Humans.auto(true); Humans.campCheck(); Humans.auto(false); 0");
        await t.frames(5);
        const dawn = await t.json("({ camp: !!Humans.campHere(), men: Humans.list.filter(h => h._mode !== 'leave').length })");
        t.check("dawn: the camp packs up (they go; no fire)", !dawn.camp && dawn.men === 0, dawn);
    }

    // ================= 10. an ambush (for the quests) and the band's end on the bus =================
    await t.eval("$gameSystem.setDayNightHour(12); Humans.clear(); __bus.length = 0; Combat.resetAct(); 0");
    const amb = await t.json("(function(){ const b = Humans.ambush(['bandit', 'archer'], { tag: 'test_amb' }); return b ? { n: b.members.length, engaged: b.members.every(m => m._engaged), tag: b.tag, said: SpeechBubbles.log.slice(-1)[0], d: b.members.map(m => Math.round(m.playerDistance())) } : null; })()");
    t.check("Humans.ambush(['bandit', 'archer'], { tag }): two men 7-10 tiles off, after him at once, with a shout", !!amb && amb.n === 2 && amb.engaged && amb.d.every(d => d >= 6 && d <= 11) && /Sakiewka|Stój|grosz/.test(amb.said), amb);
    await t.eval("for (const h of Humans.list.slice()) Humans.kill(h, 'melee'); 0");
    const done = await t.json("__bus.filter(e => e.n === 'humansDone').map(e => e.tag + ':' + e.killed)");
    t.check("all of them beaten: 'humansDone' { tag, killed: 2 } on the bus", done.join() === "test_amb:2", done);

    // ================= 11. Rozbrojenie: a parry may knock his weapon away =================
    await t.eval("Combat.hero().skills.d_disarm = 2; Combat.hero().rev = (Combat.hero().rev || 0) + 1; 0");
    const dis = await t.json(`(function(){ let tries = 0, h = null;
        for (; tries < 20; tries++) { Humans.clear(); for (const d of Humans.drops().slice()) Humans.removeDrop(d); h = Humans.spawn('bandit', ${cx + 1}, ${cy}, { level: 1 }); h.onParried(); if (h._disarmed) break; }
        return { perk: Combat.perk('disarm'), disarmed: !!(h && h._disarmed), pile: Humans.drops().some(d => d.kind === 'pile' && d.items.some(i => i[0] === 156)), tries }; })()`);
    t.check("Rozbrojenie (2 ranks: 60%): a parried bandit drops his club ('Rozbrojony!') - it lies on the ground", dis.perk > 0.5 && dis.disarmed && dis.pile, dis);
    await t.eval("delete Combat.hero().skills.d_disarm; Combat.hero().rev++; Humans.clear(); 0");

    // ================= 12. the knife bandit (2026-10-06): quicker and weaker than the club, up to three stabs in a row, springs back =================
    t.check("back to the meadow (Map004)", await t.go(4, cx, cy, 6));
    await t.eval(`Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gameSystem.setDayNightHour(12); Combat.resetAct(); Humans.clear(); __bus.length = 0; $gameParty.leader().recoverAll(); 0`);
    const kn = await t.json(`(function(){ const h = Humans.spawn('knifer', ${cx + 1}, ${cy}, { level: 1, engaged: true }), b = h._def.blow, bb = Humans.KINDS.bandit.blow;
        h._band.gapT = 0; h._gapT = 0; h.startBlow('main'); return { look: h._look, sheet: h.characterName(), chain: b.chain, dmg: [b.dmg, bb.dmg], windup: [b.windup, bb.windup], combo: [b.combo, bb.combo],
            mode: h._mode, xp: Combat.KILL_XP.knifer, dodge: !!h._def.dodge, guard: !!h._def.guard, weapon: h._def.weapon && h._def.weapon[0] }; })()`);
    t.check("the knife bandit: his own sheets ($Human_Knife...), weaker stabs (7 vs the club's 12) with shorter wind-ups, up to three in a row; no guard - he springs back; a knife to take; 30 experience",
        kn.look === "Knife" && kn.sheet === "$Human_Knife_Atk" && kn.mode === "windup" && kn.chain === 3 && kn.dmg[0] < kn.dmg[1] && kn.windup[0] < kn.windup[1] && kn.combo[0] > kn.combo[1] &&
        kn.dodge && !kn.guard && kn.weapon === 90 && kn.xp === 30, kn);
    // three stabs: the chance of the next one made sure - the strikes on the bus
    await t.eval(`(function(){ const h = Humans.list[0]; h._def = JSON.parse(JSON.stringify(h._def)); h._def.blow.combo = 1; h._def.feint = 0; window.__kn = h; return 0; })()`);
    await t.until("__kn._mode === 'recover'", 8, 20);
    const stabs = await t.json("__bus.filter(e => e.n === 'heroHit' && e.by === 'knifer').length");
    t.check("three stabs in a row when each 'again' comes up (the club: two at most)", stabs === 3, stabs);
    // the hero swings at him: he jumps back out of reach
    const spring = await t.json(`(function(){ const h = __kn; h._def.dodge.chance = 1; h._guardCd = 0; h._sawSwing = false; h.setMode('chase'); const d0 = h.playerDistance();
        const act = Combat.act; act.mode = 'attack'; h.thinkBandit(d0); const jumping = h.isJumping(); act.mode = 'idle'; return { d0: Math.round(d0 * 10) / 10, jumping, to: [h._x, h._y] }; })()`);
    await t.frames(30);
    const sprung = await t.json("({ d: Math.round(__kn.playerDistance() * 10) / 10 })");
    t.check("the hero swings at him: he springs back out of reach (a jump), no guard raised", spring.jumping && sprung.d > spring.d0 + 0.6, Object.assign(spring, sprung));
    await t.eval("Humans.clear(); Combat.resetAct(); 0");

    // ================= 13. bandits for a sleeper (2026-10-06): like the wolves - on the camp maps, at night, more by a fire or a camp =================
    t.check("to Leśna droga (Map021) again", await t.go(21, 20, 15, 2));
    await t.eval("Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); Humans.clear(); Combat.resetAct(); 0");
    const rate = await t.json(`(function(){ Humans.auto(true); const R = Humans.RAID, keep = Object.assign({}, R), now = Tawerna.time.day() * 24 + 22, out = {};
        out.rate = Humans.raidRate(); out.calm = +(Humans.raidChance(1) * 100).toFixed(2); out.full = +(Humans.raidChance(40) * 100).toFixed(2); out.fire = +(Humans.raidChance(40, true) * 100).toFixed(2);
        R.perHour = 1; R.calm = 1; out.at = Humans.nightRaid(now, now + 9, {}); out.at = out.at === null ? null : out.at - now;
        Object.assign(R, keep); R.perHour = 0; out.none = Humans.nightRaid(now, now + 9, {}); Object.assign(R, keep); Humans.auto(false);
        out.town = Humans.CAMP.maps[8] || 0; return out; })()`);
    t.check("a raid on a sleeper: only where the camps are (here), rare the first days (" + rate.calm + "%/h), " + rate.full + "%/h later, more by a fire; in its hours (from 23:00)",
        rate.rate > 0 && rate.calm < rate.full && rate.fire > rate.full && rate.at === 1 && rate.none === null && !rate.town, rate);
    // asleep on a bedroll on the forest road: woken by them
    const bed = await t.json(`(function(){ const f = $gameSystem._farm, id = $gameMap.mapId(), list = (f.buildings[id] = f.buildings[id] || []), p = $gamePlayer;
        for (let r = 1; r < 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const x = p.x + dx, y = p.y + dy;
            if (Farming.whyNotBuild("bedroll", x, y, false, true)) continue;
            list.push({ id: f.nextId++, type: "bedroll", x, y, last: 1, v: 3 }); f.rev++; return { x, y };
        }
        return null; })()`);
    t.check("a bedroll on the forest road", !!bed, bed);
    if (bed) {
        await t.eval(`(function(){ Humans.auto(true); const R = Humans.RAID; window.__keepRaid = Object.assign({}, R); R.perHour = 1; R.calm = 1; Hunting.RAID.perHour = 0;
            $gameSystem.setDayNightHour(22.5); $gameSystem.setStamina(10); __kit.tops.length = 0;
            const m = Farming.menuFor(${bed.x}, ${bed.y}); return String(m.entries.find(e => e.name === "Prześpij noc").run()); })()`);
        for (let i = 0; i < 40; i++) {
            await t.frames(10);
            await t.eval("if (SceneManager._scene.constructor.name === 'Scene_DaySummary' && !SceneManager.isSceneChanging()) SceneManager.pop(); 0");
            if (await t.eval("SceneManager._scene.constructor.name === 'Scene_Map' && Humans.list.length > 0 && !$gameScreen._fadeOutDuration")) break;
        }
        await t.frames(80);
        const woke = await t.json(`({ hour: +$gameSystem.dayNightHour().toFixed(2), men: Humans.list.map(h => ({ kind: h._kind, engaged: !!h._engaged, d: Math.round(h.playerDistance()) })),
            raid: !!(Humans.list[0] && Humans.list[0]._band && Humans.list[0]._band.raid), tops: __kit.tops.slice(-3), said: SpeechBubbles.log.slice(-3) })`);
        await shot("napad_na_spiacego.png");
        t.check("he sleeps outdoors where the camps are: woken at 23:00 by 2-3 of them coming at him - some tiles off, they run in at once ('Obudzili cię bandyci!', 'Bandyci!')",
            Math.abs(woke.hour - 23) < 0.1 && woke.men.length >= 2 && woke.men.length <= 3 && woke.men.every(m => m.engaged && m.d <= 12) && woke.raid &&
            woke.tops.some(s => /Obudzili cię bandyci/.test(s)) && woke.said.includes("Bandyci!"), woke);
        await t.eval("Object.assign(Humans.RAID, window.__keepRaid); Humans.auto(false); Humans.clear(); Combat.resetAct(); $gameSystem._farm.buildings[$gameMap.mapId()] = []; $gameSystem._farm.rev++; 0");
    }

    console.log("console errors:", t.errors().length ? t.errors().slice(-6) : "none");
    t.check("no errors in the console", t.errors().length === 0, t.errors().slice(-4));
});
