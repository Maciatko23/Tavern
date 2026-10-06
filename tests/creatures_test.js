// The creatures of the ruins (combat stage 4, docs/WALKA.md 11.4; Creatures.js + Creatures_Data.js, Combat.js): the eight kinds and their
// sheets, the experience and the skills of Hart ducha; each kind: it spawns, shows its attack first, hits, can be beaten, leaves remains;
// the kinds' own rules (the swarm's two at a time, the web, the armour's plate and its fall to pieces, the bats out of a blade's reach, the
// drowned one's grip, the stone's front, the wraith unseen and its truths against Hart ducha, the shadow with a resident's face); the
// bosses' mechanics (the guardian of the tenth gate as a real fight, floors 20-90); the underground's markers on a generated floor (the
// creatures there, an emptied place stays empty for days); F9.
// CDP_PORT=9465 node tests/creatures_test.js        (SHOTS=1: pictures into docs/walka/)
const fs = require("fs");
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = !!process.env.SHOTS;
// (while the underground's deeper bands are being built their chunk maps may not be in data/ yet - the game would not boot: those
// bands are left out of this run, the rest is the same)
const missingBands = [141, 142, 143, 144].filter(id => !fs.existsSync(path.join(__dirname, "..", "data", "Map" + id + ".json")));
const TRAP = `(function(){ let v; Object.defineProperty(window, "Underground_Data", { configurable: true, get(){ return v; },
    set(x){ if (x && x.BANDS) x.BANDS = x.BANDS.filter(b => !b.chunkMap || ${JSON.stringify(missingBands)}.indexOf(b.chunkMap) < 0); v = x; } }); })();`;
if (missingBands.length) console.log("NOTE chunk maps " + missingBands.join(", ") + " not in data/ yet: their bands are left out of this run");

kit.test({ port: 9465, beforeLoad: missingBands.length ? TRAP : "" }, async t => {
    t.check("a new game on the meadow (Map004), 10:00", await t.newGame({ map: 4, x: 20, y: 14, hour: 10, quiet: true }));
    await t.eval("Hunting.RAID.perHour = 0; Creatures.auto(false); $gameSystem.setStamina(100); $gameParty.leader().recoverAll(); 0");
    const shot = async name => { if (SHOTS) { await t.frames(2); await t.shot("../docs/walka/" + name); } };

    // ================= 1. what they are, their pictures, the experience, Hart ducha =================
    const kinds = await t.json("Object.keys(Creatures.KINDS)");
    t.check("eight kinds: rats, spiders, empty armours, bats, the drowned, stone sentinels, wraiths, shadows", kinds.join() === "szczur,pajak,zbroja,nietoperz,topielec,kamiennik,upior,cien", kinds);
    const sheets = await t.json(`new Promise(res => { const names = Object.keys(Hunting.LOOK8).filter(k => /^\\$Cr_/.test(k)), list = names.concat(names.map(k => Hunting.LOOK8[k].sheet)), out = {};
        let left = list.length;
        for (const n of list) { const b = ImageManager.loadCharacter(n); const iv = setInterval(() => { if (!b.isReady() && !b.isError()) return; clearInterval(iv); out[n] = b.isError() ? null : [b.width, b.height]; if (--left === 0) res({ out, cells: Object.fromEntries(names.map(k => [Hunting.LOOK8[k].sheet, Hunting.LOOK8[k].cell])) }); }, 20); } })`);
    const sheetsOk = Object.entries(sheets.out).every(([n, s]) => s && (/^(anim8\/|Npc_)/.test(n) ? s[1] === sheets.cells[n] * 8 && s[0] % sheets.cells[n] === 0 : s[0] % 3 === 0 && s[1] % 4 === 0));
    t.check("every sheet loads: the 8-way ones (walking, blows, ends; the shadows' faces) and their 4-way $Cr_* sheets", sheetsOk && Object.keys(sheets.out).length >= 30,
        Object.entries(sheets.out).filter(([n, s]) => !s).map(([n]) => n));
    const xp = await t.json("({ k: ['szczur','nietoperz','pajak','topielec','zbroja','upior','cien','kamiennik','guardian','boss_20','boss_90'].map(k => Combat.KILL_XP[k]), n: Combat.SKILLS.length, w: !!Combat.SKILLS.find(s => s.id === 'd_will'), tr: !!Combat.SKILLS.find(s => s.id === 'd_truth') })");
    t.check("experience for each kind and boss (rat 4 ... stone sentinel 70, guardian 250, floor 20's boss 300, floor 90's 2500); two skills of Hart ducha (Spokojna głowa, Prawda nie boli)",
        xp.k.join() === "4,4,25,35,45,50,50,70,250,300,2500" && xp.w && xp.tr && xp.n >= 102, xp);
    const mindR = await t.json(`(function(){ const h = Combat.hero(), keep = h.attr.wil, out = {};
        h.attr.wil = 5; out.r5 = Combat.mindResist(0); out.t5 = Combat.mindTime(100);
        h.attr.wil = 30; out.r30 = Combat.mindResist(0); out.t30 = Combat.mindTime(100); out.strong = Combat.mindResist(0, h.level + 8);
        h.attr.wil = keep; return out; })()`);
    t.check("Hart ducha: the chance to resist a truth (15% at 5, 90% at 30 - less against a stronger one) and fear / confusion shorter",
        Math.abs(mindR.r5 - 0.15) < 0.001 && Math.abs(mindR.r30 - 0.9) < 0.001 && mindR.strong < mindR.r30 && mindR.t30 < mindR.t5, mindR);

    // the floating words over the hero and a boss do not cover each other (2026-10-06: "Hart ducha", "Opierasz się!", "Odpowiedź!", "Utknął!"
    // were drawn one over another): a stack, the newer above; the same word again at once only pops (one plate)
    const stack = await t.json(`new Promise(res => { const F = Tawerna.api('Combat_parts').fight; F.floaters.length = 0;
        const x = $gamePlayer._realX + 0.5, y = $gamePlayer._realY + 0.5;
        F.numberAt(x, y - 1.45, 'Opierasz się!', '#c9e6ff', 0.9); F.numberAt(x, y - 1.9, 'Hart ducha', '#9fb8d8', 0.7); F.numberAt(x + 0.3, y - 1.5, 'Odpowiedź!', '#9ff0a8', 1);
        F.numberAt(x - 0.2, y - 1.4, 'Utknął!', '#ffd27f', 0.9); F.numberAt(x - 0.2, y - 1.4, 'Utknął!', '#ffd27f', 0.9); F.numberAt(x, y - 1.0, '-24', '#ff6b5e');
        const t0 = Graphics.frameCount; const iv = setInterval(() => { if (Graphics.frameCount - t0 < 14) return; clearInterval(iv);
            res(F.floaters.filter(f => f.sprite).map(f => ({ t: f.text, x: f.sprite.x, b: f.sprite.y - 6, w: f.w, h: f.h }))); }, 16); })`);
    const overlaps = [];
    for (let i = 0; i < stack.length; i++) for (let j = i + 1; j < stack.length; j++) {
        const a = stack[i], b = stack[j];
        if (Math.abs(a.x - b.x) * 2 < a.w + b.w - 2 && a.b - a.h < b.b - 1 && b.b - b.h < a.b - 1) overlaps.push(a.t + " / " + b.t);
    }
    t.check("the floating words stack instead of covering each other (five said at once over the hero - one 'Utknął!' only)",
        stack.length === 5 && stack.filter(f => f.t === "Utknął!").length === 1 && overlaps.length === 0, { overlaps, stack });
    if (SHOTS) { await t.frames(4); await t.shot("../docs/walka/napisy_stos.png"); }

    // an open field round the hero (the fights below)
    const room = await t.json(`(function(){
        const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && !Farming.buildingAt(x, y);
        let best = null;
        for (let y = 7; y < $gameMap.height() - 7; y++) for (let x = 9; x < $gameMap.width() - 9; x++) {
            let ok = true;
            for (let dx = -7; dx <= 7 && ok; dx++) for (let dy = -3; dy <= 3; dy++) if (!free(x + dx, y + dy)) { ok = false; break; }
            if (ok && (!best || Math.abs(x - $gameMap.width() / 2) < Math.abs(best.x - $gameMap.width() / 2))) best = { x, y };
        }
        return best; })()`);
    t.check("an open field 15 x 7 on the meadow", !!room, room);
    const cx = room.x, cy = room.y;
    await t.eval(`window.__bus = []; for (const n of ['heroHit', 'kill', 'creatureBoss', 'heroMind']) Tawerna.on(n, e => __bus.push(Object.assign({ n }, e, { animal: undefined })), { owner: 'CreaturesTest' }); 0`);
    // keys pressed inside the game loop (__auto): "roll" (Space + the arrow away) / "parry" (P) when the creature's wind-up has A.at frames left
    await t.eval(`window.__auto = null; const _au = Scene_Map.prototype.update; Scene_Map.prototype.update = function() {
        const A = window.__auto, c = window.__c;
        if (A && c && !A.done) {
            const now = (c._mode === "windup" || c._mode === "dive") && c._modeT <= A.at;
            if (!A.pressed && now) { A.pressed = true; A.keys = A.kind === "roll" ? [A.arrow || 37, 32] : [80]; for (const k of A.keys) Input._onKeyDown({ keyCode: k, preventDefault() {} }); A.t = 0; }
            if (A.pressed && ++A.t > 14) { for (const k of A.keys) Input._onKeyUp({ keyCode: k }); A.done = true; }
        }
        _au.call(this);
    }; 0`);
    const clear = () => t.eval("Creatures.clear(); for (const d of Creatures.drops().slice()) Creatures.drops().splice(Creatures.drops().indexOf(d), 1); Combat.resetAct(); 0");
    const keysUp = () => t.eval("for (const k of [32, 37, 38, 39, 40, 79, 80]) Input._onKeyUp({ keyCode: k }); 0");
    // a creature `dx` tiles right of the hero (level 3), after him; opts: count (a swarm), noAttack (its gap held)
    const arena = async (kind, dx, opts = {}) => {
        await keysUp();
        await clear();
        await t.eval(`(function(){ const a = $gameParty.leader(); a.recoverAll(); $gameSystem.setStamina(100); Combat.hero().attr.wil = 5;
            $gamePlayer.locate(${cx}, ${cy}); $gamePlayer.setDirection(6); $gameMap.setDisplayPos(${cx} - 13, ${cy} - 7);
            const c = window.__c = Creatures.spawn('${kind}', ${cx + dx}, ${cy + (opts.dy || 0)}, { level: ${opts.level || 3}, engaged: ${opts.engaged !== false}, count: ${opts.count || 0} || undefined, mode: ${opts.mode ? "'" + opts.mode + "'" : "undefined"} });
            if (${!!opts.noAttack}) for (const o of Creatures.list) o._gapT = 99999;
            window.__bus.length = 0; window.__auto = null; return 0; })()`);
        await t.frames(opts.settle || 4);
    };
    const heroHits = () => t.json("__bus.filter(e => e.n === 'heroHit').map(e => e.result + ':' + e.by)");
    const hp = () => t.json("({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp })");
    await t.eval("$gameSystem._combatMode = true; 0");

    // ================= 2. rats: a swarm, two bites at a time at most; one blow kills =================
    await arena("szczur", 3, { count: 4 });
    let most = 0;
    for (let i = 0; i < 40; i++) { const n = await t.eval("Creatures.list.filter(c => c._mode === 'windup' || c._mode === 'strike').length"); most = Math.max(most, n); await t.frames(5); }
    const rats = await t.json("({ n: Creatures.list.length, swarm: Creatures.list.every(c => c._swarm && c._swarm === Creatures.list[0]._swarm), hits: __bus.filter(e => e.n === 'heroHit' && e.by === 'szczur').length })");
    t.check("rats: a swarm of four round the hero, at most two biting at once, and they bite", rats.n === 4 && rats.swarm && most >= 1 && most <= 2 && rats.hits >= 1, Object.assign(rats, { most }));
    await shot("stwory_szczury.png");
    const ratKill = await t.json(`(function(){ const c = Creatures.list[0], xp0 = Combat.hero().xp + Combat.hero().level * 100000; Creatures.hit(c, 40, 'melee', { poise: 20 }); return { dying: !!c._dying, xp0 }; })()`);
    await t.frames(40);
    const ratEnd = await t.json("({ kill: __bus.filter(e => e.n === 'kill' && e.kind === 'szczur' && e.creature).length, left: Creatures.list.length, xp: Combat.hero().xp + Combat.hero().level * 100000, remains: Creatures.drops().filter(d => d.kind === 'rat').length })");
    t.check("a rat dies of one blow: 'kill' on the bus (a creature), experience, a body left", ratKill.dying && ratEnd.kill === 1 && ratEnd.left === 3 && ratEnd.xp > ratKill.xp0 && ratEnd.remains === 1, Object.assign(ratEnd, ratKill));

    // ================= 3. the spider: the web (slows; a patch on the floor), the bite; its silk to take =================
    await arena("pajak", 5, { noAttack: true });
    const speed0 = await t.eval("$gamePlayer.realMoveSpeed()");
    await t.eval("for (const o of Creatures.list) { o._gapT = 0; o._cd.web = 0; } 0");
    const spat = await t.until("Creatures.list[0]._mode === 'spit'", 8, 30);
    const spitPose = await t.json("({ sheet: __c.characterName(), mark: !!(__c._markSprite && __c._markSprite.visible) })");
    t.check("the spider rears up to spit (its blow sheet, a '!')", spat && spitPose.sheet === "$Cr_Spider_Atk" && spitPose.mark, spitPose);
    await t.until("Creatures.webs.length > 0 || Creatures.webbed()", 4, 20);
    await t.until("Creatures.webbed()", 4, 20);
    const web = await t.json("({ webbed: Creatures.webbed(), speed: $gamePlayer.realMoveSpeed(), patches: Creatures.patches.length, hits: __bus.filter(e => e.n === 'heroHit').map(e => e.result) })");
    t.check("the web sticks: the hero walks slower, the web lies on the floor", web.webbed && web.speed < speed0 && web.patches >= 1 && web.hits.includes("hit"), Object.assign(web, { speed0 }));
    await shot("stwory_pajak_siec.png");
    await t.eval("Creatures.setWeb(0); Creatures.patches.length = 0; __c._def = JSON.parse(JSON.stringify(__c._def)); __c._def.loot = [[92, 1, 3]]; 0");
    await t.eval(`__c.locate(${cx + 1}, ${cy}); __c._gapT = 0; __c.startMove('bite'); 0`);
    await t.until("__c._mode === 'recover' || __c._mode === 'chase'", 4, 20);
    const bite = await t.json("__bus.filter(e => e.n === 'heroHit' && e.by === 'pajak').map(e => e.result)");
    t.check("its bite lands (shown first by its wind-up)", bite.length >= 2, bite);
    await t.eval("Creatures.hit(__c, 999, 'melee', {}); 0");
    await t.frames(60);
    const silk = await t.json(`(function(){ const d = Creatures.drops()[0]; if (!d) return null; $gamePlayer.locate(Math.round(d.x - 0.5) - 1, Math.round(d.y - 0.5)); $gamePlayer.setDirection(6); return { items: d.items, n0: $gameParty.numItems($dataItems[92]) }; })()`);
    await t.eval("Creatures.searchDrop(Creatures.drops()[0]); 0");
    await t.frames(60);
    const took = await t.json("({ n: $gameParty.numItems($dataItems[92]), empty: Creatures.drops()[0] && Creatures.drops()[0].empty })");
    t.check("its remains: searched, its silk (Włókno) goes into the bag", !!silk && silk.items.length === 1 && took.n === silk.n0 + silk.items[0][1] && took.empty, Object.assign({}, silk, took));

    // ================= 4. the empty armour: dormant; the plate; the overhead blow breaks the guard; falls to pieces and rises once =================
    await arena("zbroja", 6, { engaged: false });
    const dorm = await t.json("({ mode: __c._mode, sheet: __c.characterName() })");
    await t.eval(`$gamePlayer.locate(${cx + 4}, ${cy}); 0`);
    const woke = await t.until("__c._engaged", 10, 30);
    t.check("the armour stands like a statue (dormant) until the hero comes near - then it wakes", dorm.mode === "dormant" && woke, dorm);
    await t.eval(`__c.locate(${cx + 1}, ${cy}); $gamePlayer.locate(${cx}, ${cy}); __c._faceAng = Math.PI; __c._gapT = 99999; __c._hp = __c._maxHp; 0`);
    const plate = await t.json(`(function(){ const c = __c, h0 = c._hp; Creatures.hit(c, 40, 'melee', { poise: 30 }); const light = h0 - c._hp, h1 = c._hp; Creatures.hit(c, 40, 'melee', { poise: 60, heavy: true }); const heavy = h1 - c._hp;
        c._faceAng = 0; const h2 = c._hp; Creatures.hit(c, 40, 'melee', { poise: 30 }); return { light, heavy, back: h2 - c._hp }; })()`);
    t.check("the plate: a light blow from the front only rings on it (15%), a heavy one or one in the back counts in full", plate.light === 6 && plate.heavy === 40 && plate.back === 40, plate);
    await t.eval(`__c._stun = 0; __c._faceAng = Math.PI; __c.setMode('chase'); __c.startMove('over'); 0`);
    await t.frames(10);
    const over = await t.json("({ mode: __c._mode, sheet: __c.characterName(), mark: !!(__c._markSprite && __c._markSprite.visible), big: Creatures.KINDS.zbroja.moves.over.guardBreak })");
    t.check("its overhead blow is shown first (the sword up, '!') and breaks a guard", over.mode === "windup" && over.sheet === "$Cr_Armor_Atk" && over.mark && over.big, over);
    await shot("stwory_zbroja_zamach.png");
    await t.until("__c._mode === 'recover'", 6, 30);
    await t.eval("__c._hp = 5; Creatures.hit(__c, 50, 'melee', { heavy: true, poise: 80 }); 0");
    const fell = await t.json("({ mode: __c._mode, dead: __c._dead || !!__c._dying, sheet: __c.characterName() })");
    await t.frames(30);
    await shot("stwory_zbroja_rozsypana.png");
    await t.eval("__c._modeT = 1; 0");
    await t.until("__c._mode === 'rise'", 4, 20);
    await t.until("__c._mode !== 'rise'", 4, 20);
    const rose = await t.json("({ hp: __c._hp, max: __c._maxHp, mode: __c._mode })");
    t.check("felled, it falls to pieces (its end sheet) - left alone, it puts itself together with 40% of its life", fell.mode === "collapsed" && !fell.dead && fell.sheet === "$Cr_Armor_Die" && Math.abs(rose.hp - Math.round(rose.max * 0.4)) <= 1, Object.assign(fell, rose));
    await t.eval("__c._hp = 5; Creatures.hit(__c, 50, 'melee', { heavy: true, poise: 80 }); 0");
    await t.frames(80);
    const done2 = await t.json("({ dead: __c._dead, left: Creatures.list.length, remains: Creatures.drops().filter(d => d.kind === 'armor').length })");
    t.check("felled a second time it stays down: its pieces lie there (remains)", done2.dead && done2.left === 0 && done2.remains === 1, done2);
    await arena("zbroja", 2, { noAttack: true });
    await t.eval("__c._hp = 1; Creatures.hit(__c, 30, 'melee', { heavy: true }); 0");
    const pile = await t.json("({ mode: __c._mode })");
    await t.eval("Creatures.hit(__c, 3, 'melee', {}); 0");
    const broken = await t.json("({ dying: !!__c._dying || __c._dead })");
    t.check("one blow on the pile while it lies: 'Rozbita!' - it does not get up", pile.mode === "collapsed" && broken.dying, Object.assign(pile, broken));

    // ================= 5. bats: high up out of a blade's reach (a shot reaches them); a dive along a line; low after it =================
    await arena("nietoperz", 2, { count: 3 });
    await t.frames(60);
    const bats = await t.json(`(function(){ const keep = Combat.hand; const melee = Hunting.allTargets().filter(x => x.ref && x.ref._kind === 'nietoperz').length;
        Combat.hand = () => 'ranged'; const ranged = Hunting.allTargets().filter(x => x.ref && x.ref._kind === 'nietoperz').length; Combat.hand = keep;
        return { alt: Creatures.list.map(c => Math.round(c._alt)), melee, ranged }; })()`);
    t.check("the bats circle high: no target for a blade, a target for a shot", bats.alt.every(a => a > 16) && bats.melee === 0 && bats.ranged === 3, bats);
    const dived = await t.until("Creatures.list.some(c => c._mode === 'dive')", 8, 20);
    await t.eval("window.__c = Creatures.list.find(c => c._mode === 'dive'); 0");
    await shot("stwory_nietoperze.png");
    await t.until("__c._mode === 'low'", 4, 20);
    const low = await t.json("({ alt: Math.round(__c._alt), target: Hunting.allTargets().some(x => x.ref === __c), hits: __bus.filter(e => e.n === 'heroHit' && e.by === 'nietoperz').length })");
    t.check("one dives along its line (shown on the floor) and hangs low after it - a target then", dived && low.alt <= 16 && low.target, low);

    // ================= 6. the drowned: its grip - held, the breath going; O again and again tears him free =================
    await arena("topielec", 1, { noAttack: true });
    await t.eval(`__c._faceAng = Math.PI; __c._gapT = 0; __c.startMove('grab'); 0`);
    await t.until("!!Creatures.grab", 4, 20);
    await t.frames(30);
    const held = await t.json("({ grab: !!Creatures.grab, kind: Combat.act.stunKind, breath: Combat.breath, max: Combat.maxBreath() })");
    t.check("its grab lands: the hero is held ('Złapał cię!'), his breath going", held.grab && held.kind === "held" && held.breath < held.max, held);
    await shot("stwory_topielec_chwyt.png");
    for (let i = 0; i < 8 && (await t.eval("!!Creatures.grab")); i++) { await t.eval("Input._onKeyDown({ keyCode: 79, preventDefault() {} }); 0"); await t.frames(2); await t.eval("Input._onKeyUp({ keyCode: 79 }); 0"); await t.frames(3); }
    const free = await t.json("({ grab: !!Creatures.grab, stun: __c._stun })");
    t.check("O pressed again and again: free ('Wyrwałeś się!'), the drowned one reels", !free.grab && free.stun > 0, free);
    await t.eval("Creatures.hit(__c, 9999, 'melee', {}); 0");
    await t.frames(80);
    t.check("killed, it sinks into a puddle (remains)", await t.eval("Creatures.drops().some(d => d.kind === 'drowned')"));

    // ================= 7. the stone sentinel: its front is stone, its back the crack; the slam's ring; a charge into a wall =================
    await arena("kamiennik", 2, { noAttack: true });
    const stone = await t.json(`(function(){ const c = __c; c._faceAng = Math.PI; const h0 = c._hp; Creatures.hit(c, 40, 'melee', { poise: 30 }); const front = h0 - c._hp;
        c._faceAng = 0; const h1 = c._hp; Creatures.hit(c, 40, 'melee', { poise: 30 }); return { front, back: h1 - c._hp }; })()`);
    t.check("the stone sentinel: nothing through its front ('Kamień!'), its back's crack x1.6", stone.front === 0 && stone.back === 64, stone);
    await t.eval(`__c._stun = 0; __c.locate(${cx + 1}, ${cy}); __c._faceAng = Math.PI; __c.setMode('chase'); __c.startMove('slam'); 0`);
    await t.frames(20);
    await shot("stwory_kamiennik_uderzenie.png");
    await t.until("__c._mode === 'recover'", 6, 20);
    const slam = await t.json("__bus.filter(e => e.n === 'heroHit' && e.by === 'kamiennik').map(e => e.result)");
    t.check("its slam (a ring on the floor) hits the hero inside it", slam.includes("hit"), slam);
    // a charge at a wall: the hero against the field's edge... a wall of events: the charge's line runs into a blocked tile
    // (the wall: one tile on its line the creature may not enter)
    await t.eval(`(function(){ const C2 = Creatures.Game_Creature.prototype, orig = C2.isMapPassable; C2.isMapPassable = function(x, y, d) { if ($gameMap.roundXWithDirection(x, d) === ${cx + 1} && $gameMap.roundYWithDirection(y, d) === ${cy}) return false; return orig.call(this, x, y, d); }; window.__restorePass = () => { C2.isMapPassable = orig; }; return 0; })()`);
    await t.eval(`(function(){ const c = __c; c._stun = 0; c.locate(${cx - 5}, ${cy}); $gamePlayer.locate(${cx - 1}, ${cy}); c._faceAng = 0; c.setMode('chase'); Creatures.startCharge(c, c._def.moves.charge);
        $gamePlayer.locate(${cx - 1}, ${cy + 3}); return 0; })()`);
    const crashed = await t.until("__c._mode === 'crashed'", 10, 30);
    const cr = await t.json("({ stunned: !!__c._stoneStunned, x: __c._x })");
    const crHit = await t.json(`(function(){ const c = __c; c._faceAng = Math.PI; $gamePlayer.locate(c._x + 1, c._y); const h0 = c._hp; Creatures.hit(c, 40, 'melee', { poise: 10 }); return h0 - c._hp; })()`);
    await t.eval("window.__restorePass(); 0");
    t.check("a charge into a wall: it stands stunned ('Utknął!') - open even from the front", crashed && cr.stunned && crHit > 0, Object.assign(cr, { crHit }));

    // ================= 8. the wraith of truth: unseen; it shows itself, speaks a truth - Hart ducha =================
    await arena("upior", 4, { engaged: false });
    const hidden = await t.json("({ hidden: __c._hidden, target: Hunting.allTargets().some(x => x.ref === __c), op: __c._sprite ? __c._sprite.opacity : -1 })");
    t.check("the wraith is unseen and no target while hidden", hidden.hidden && !hidden.target && hidden.op === 0, hidden);
    await t.eval("__c._cd.truth = 99999; __c._gapT = 99999; __c.engage(); __c._modeT = 1; 0");   // (no truth, no touch of its own here)
    const shown = await t.until("__c._mode === 'shown'", 8, 20);
    t.check("it shows itself near the hero - a target now", shown && (await t.eval("Hunting.allTargets().some(x => x.ref === __c)")));
    // a truth resisted (Hart ducha 60): it turns on the wraith
    await t.eval(`(function(){ Combat.hero().attr.wil = 60; __c._cd.truth = 0; __c._gapT = 0; Creatures.startTruth(__c, __c._def.moves.truth); window.__rand = Math.random; return 0; })()`);
    await t.frames(10);
    const truth = await t.json("({ mode: __c._mode, said: SpeechBubbles.log ? SpeechBubbles.log.slice(-1)[0] : null, mark: !!(__c._markSprite && __c._markSprite.visible) })");
    await shot("stwory_upior_prawda.png");
    await t.eval("Math.random = () => 0.01; 0");   // (95% to resist at 60: the 5% out of the way)
    await t.until("__bus.some(e => e.n === 'heroMind')", 6, 20);
    await t.eval("Math.random = window.__rand; 0");
    const res = await t.json("({ mind: __bus.filter(e => e.n === 'heroMind').map(e => e.kind + ':' + e.resisted), stun: __c._stun, act: Combat.act.stunKind })");
    t.check("it speaks a truth (a '!', its words in a bubble); Hart ducha 60 resists - the truth turns on it, it reels", truth.mode === "truth" && truth.mark && !!truth.said &&
        res.mind.length === 1 && /:true$/.test(res.mind[0]) && res.stun > 0 && res.act !== "fear", Object.assign(truth, res));
    // not resisted (Hart ducha 5, the roll forced high): fear (frozen) or confusion (the arrows turned round)
    await t.eval(`(function(){ __bus.length = 0; Combat.hero().attr.wil = 5; __c._stun = 0; __c.setMode('shown', 999); window.__rand = Math.random; Math.random = () => 0.99; Creatures.startTruth(__c, __c._def.moves.truth); __c._modeT = 1; return 0; })()`);
    await t.frames(4);
    await t.eval("Math.random = window.__rand; 0");
    const fail = await t.json("({ mind: __bus.filter(e => e.n === 'heroMind').map(e => e.kind + ':' + e.resisted), act: Combat.act.stunKind, confused: Creatures.confused() })");
    let reversed = null;
    if (fail.confused) {
        await t.eval("Input._onKeyDown({ keyCode: 39, preventDefault() {} }); 0"); await t.frames(2);
        reversed = await t.eval("Input.dir4");
        await t.eval("Input._onKeyUp({ keyCode: 39 }); 0");
    }
    t.check("Hart ducha 5, not resisted: fear (he stands frozen, trembling) or confusion (→ goes left)", fail.mind.length === 1 && /:false$/.test(fail.mind[0]) &&
        ((/^fear/.test(fail.mind[0]) && fail.act === "fear") || (/^confuse/.test(fail.mind[0]) && fail.confused && reversed === 4)), Object.assign(fail, { reversed }));
    await shot("stwory_upior_strach.png");
    // hit twice during its truth: broken off
    await t.eval(`(function(){ Combat.resetAct(); Creatures.mind.confuseT = 0; __bus.length = 0; __c._stun = 0; __c._hidden = false; __c._opacity = 255; __c.setMode('shown', 999); Creatures.startTruth(__c, __c._def.moves.truth); Creatures.hit(__c, 3, 'melee', { poise: 1 }); Creatures.hit(__c, 3, 'melee', { poise: 1 }); return 0; })()`);
    const broke = await t.json("({ mode: __c._mode, stun: __c._stun })");
    await t.frames(80);
    const noMind = await t.json("__bus.filter(e => e.n === 'heroMind').length");
    t.check("two blows during its truth break it off ('Przerwana!') - no truth comes", broke.mode !== "truth" && broke.stun > 0 && noMind === 0, Object.assign(broke, { noMind }));

    // ================= 9. the shadow: a resident's face and voice; up close the face drops (fear); hit twice it melts and comes out behind =================
    await arena("cien", 6, { engaged: false });
    const lure = await t.json("({ mode: __c._mode, sheet: __c.characterName(), name: __c.name(), face: __c._face.name, lines: __c._face.lines })");
    await t.eval(`$gamePlayer.locate(${cx + 3}, ${cy}); 0`);
    await t.frames(20);
    const spoke = await t.json("SpeechBubbles.log.slice(-2)");
    await shot("stwory_cien_twarz.png");
    await t.until("__c._revealed && __c._mode !== 'reveal'", 6, 20);
    const rev = await t.json("({ look: __c._look, sheet: __c.characterName(), face: !!__c._face, mind: __bus.filter(e => e.n === 'heroMind').length, engaged: __c._engaged })");
    t.check("the shadow stands as someone from the town (their sheet, their name, their line); up close the face drops into the dark - the shadow itself (its own sheet: smoke, claws, red eyes) - a fright on the mind",
        lure.mode === "lure" && /^\$Cr_Face_/.test(lure.sheet) && lure.name === lure.face && spoke.some(s => lure.lines.includes(s)) && rev.look === "Shadow" && rev.sheet === "$Cr_Shadow" && !rev.face && rev.mind === 1 && rev.engaged, Object.assign(lure, rev, { spoke }));
    await shot("stwory_cien_odslonia.png");
    await t.eval(`(function(){ Combat.resetAct(); __c._gapT = 0; Creatures.hit(__c, 4, 'melee', { poise: 1 }); Creatures.hit(__c, 4, 'melee', { poise: 1 }); __c._stun = 0; return 0; })()`);
    const melted = await t.until("__c._mode === 'under'", 6, 20);
    await t.until("__c._mode !== 'under'", 6, 20);
    const out = await t.json("({ d: Math.round(__c.playerDistance() * 10) / 10, hidden: __c._hidden })");
    t.check("hit twice it melts into smoke and comes out right behind the hero", melted && !out.hidden && out.d <= 3, out);
    // (2026-10-06) the shadow's own attack sheet; a bat's dive on a sheet of its own; the bosses of floors 30-70 in their own looks, untinted
    const polish = await t.json(`(function(){ const out = {};
        __c._stun = 0; __c._hidden = false; __c._opacity = 255; __c.setMode('chase'); __c.startMove('claw'); out.claw = __c.characterName();
        const bat = Creatures.spawn('nietoperz', ${cx + 3}, ${cy}, { level: 3, engaged: true, count: 1 }); Creatures.startDive(bat, Creatures.KINDS.nietoperz.moves.dive); bat.updateSheet(); out.dive = bat.characterName();
        out.bosses = ['boss_30', 'boss_40', 'boss_50', 'boss_60', 'boss_70'].map(k => { const b = Creatures.spawnOne(k, ${cx + 4}, ${cy - 2}, { level: 5 }); const r = [b.characterName(), b._drawScale, b._tone]; Creatures.clear(); return r; });
        return out; })()`);
    t.check("own art: the shadow strikes on its own sheet, a bat dives on its own, the bosses of floors 30-70 stand in their own looks (drawn 1:1 - the armour 1.2 -, untinted)",
        polish.claw === "$Cr_Shadow_Atk" && polish.dive === "$Cr_Bat_Atk" && polish.bosses.map(b => b[0]).join() === "$Cr_Queen,$Cr_Mother,$Cr_Deep,$Cr_Keeper,$Cr_Blank" &&
        polish.bosses.every(b => b[1] >= 1 && b[1] <= 1.2 && !b[2]), polish);

    // ================= 10. the bosses =================
    // (from here on the hero is not hurt - their blows still land and are told on the bus: the run is about their mechanics, a level-1 hero
    // would not live through them)
    await t.eval(`(function(){ window.__hitPlayer = Combat.hitPlayer; Combat.hitPlayer = o => window.__hitPlayer(Object.assign({}, o, { damage: 0 }));
        window.__heal = setInterval(() => { const a = $gameParty.leader(); if (a && !a.isDead()) a.setHp(a.mhp); }, 100); return 0; })()`);
    const bossArena = async (kind, dx) => {
        await keysUp();
        await clear();
        await t.eval(`(function(){ const a = $gameParty.leader(); a.recoverAll(); Combat.hero().attr.wil = 5; $gamePlayer.locate(${cx}, ${cy}); $gamePlayer.setDirection(6); $gameMap.setDisplayPos(${cx} - 13, ${cy} - 7);
            const c = window.__c = Creatures.spawn('${kind}', ${cx + dx}, ${cy}, { level: 5, engaged: true }); window.__bus.length = 0; return 0; })()`);
        await t.until("Creatures.boss === __c", 4, 20);   // (an armour wakes first)
        return t.json("({ boss: Creatures.boss && Creatures.boss._kind, bar: !!(SceneManager._scene._bossBar), name: __c.name() })");
    };
    // the guardian's fight is on floor 10 (below); the bosses of floors 20-90 here, each with its own mechanic
    let b = await bossArena("boss_20", 2);
    const rite = await t.json(`(function(){ const c = __c; $gamePlayer.locate(c._x + 6, c._y); const h0 = c._hp; Creatures.hit(c, 50, 'melee', { heavy: true, poise: 40 }); return { outside: h0 - c._hp, ring: Creatures.rings.some(r => r.kind === 'rite') }; })()`);
    await t.eval("__c._gapT = 99999; $gamePlayer.locate(Math.floor(__c._circle.x) + 2, Math.floor(__c._circle.y)); 0");   // (in the ring: 2 tiles from its middle)
    for (const dy of [1, 0, -1, 0]) { await t.eval(`$gamePlayer.locate($gamePlayer.x, $gamePlayer.y + ${dy === 0 ? 1 : dy}); 0`); await t.frames(3); }
    const answered = await t.until("__c._mode === 'answer'", 4, 20);
    await shot("boss_przeor_krag.png");
    t.check("Przeor w zbroi: the ring of the rite; from outside it no blow reaches him; three steps in it - the staff's answer", b.boss === "boss_20" && b.name === "Przeor w zbroi" &&
        rite.ring && rite.outside === 0 && answered, Object.assign(b, rite, { answered }));

    b = await bossArena("boss_30", 3);
    await t.eval("__c._hp = Math.round(__c._maxHp * 0.6); __c._gapT = 0; 0");
    await t.frames(4);
    const calls = await t.json("({ rats: Creatures.list.filter(c => c._ownerBoss === __c).length })");
    await t.eval(`$gamePlayer.locate(__c._x - 6, __c._y); for (const r of Creatures.list.filter(o => o._ownerBoss === __c)) r._gapT = 99999; __c._cd.ram = 0; __c.setMode('chase'); 0`);   // (on the open field's side)
    const rammed = await t.until("__c._mode === 'ram'", 10, 20);
    await shot("boss_krolowa_szczurow.png");
    t.check("Królowa szczurów: hurt by a third she squeals - rats pour out (hers); she rams in a straight line", b.name === "Królowa szczurów" && calls.rats >= 3 && rammed, Object.assign(calls, { rammed }));

    b = await bossArena("boss_40", 3);
    const webs40 = await t.json("Creatures.patches.length");
    await t.eval("__c._upT = 1; __c.setMode('chase'); 0");
    await t.until("__c._mode === 'above'", 6, 20);
    const above = await t.json("({ hidden: __c._hidden, ring: Creatures.rings.some(r => r.c === __c && (r.kind === 'shadow' || r.kind === 'thread')) })");
    await t.eval("__c._pulling = true; const r = Creatures.rings.find(o => o.c === __c && (o.kind === 'shadow' || o.kind === 'thread')); r.kind = 'thread'; r.r = 0.9; __c._modeT = 1; r.x = $gamePlayer._realX + 0.5; r.y = $gamePlayer._realY + 0.5; 0");
    await t.frames(30);
    const pulled = await t.json("({ pull: __c._mode === 'pull', kind: Combat.act.stunKind })");
    await shot("boss_matka_pajakow_nic.png");
    for (let i = 0; i < 8 && (await t.eval("__c._mode === 'pull'")); i++) { await t.eval("Input._onKeyDown({ keyCode: 79, preventDefault() {} }); 0"); await t.frames(2); await t.eval("Input._onKeyUp({ keyCode: 79 }); 0"); await t.frames(3); }
    const torn = await t.json("({ mode: __c._mode, hidden: __c._hidden })");
    t.check("Matka pająków: webs spun on the floor; up into the dark (her shadow / her thread follows the hero); the thread pulls him up - O again and again tears it",
        b.name === "Matka pająków" && webs40 >= 3 && above.hidden && above.ring && pulled.pull && pulled.kind === "held" && torn.mode !== "pull" && !torn.hidden, Object.assign(above, pulled, torn, { webs40 }));

    b = await bossArena("boss_50", 3);
    const pools = await t.json("Creatures.pools.length");
    await t.eval("Creatures.hit(__c, Math.round(__c._maxHp * 0.14), 'melee', { poise: 1 }); 0");
    const sank = await t.json("__c._mode");
    await t.until("__c._mode === 'underwater'", 4, 20);
    await shot("boss_topielec_glebina.png");
    await t.until("__c._mode !== 'underwater'", 6, 20);
    const up = await t.json("({ hidden: __c._hidden, d: Math.round(__c.playerDistance() * 10) / 10, mode: __c._mode })");
    t.check("Topielec z głębiny: pools round the room; hurt by a part of its life it goes under and comes up by the pool nearest the hero, grabbing",
        b.name === "Topielec z głębiny" && pools >= 3 && sank === "sinkAway" && !up.hidden, Object.assign(up, { pools, sank }));

    await keysUp(); await clear();
    await t.eval(`(function(){ $gameParty.leader().recoverAll(); $gamePlayer.locate(${cx - 6}, ${cy}); window.__c = Creatures.spawn('boss_60', ${cx}, ${cy}, { level: 5 }); window.__bus.length = 0; return 0; })()`);
    await t.frames(30);
    const sleeping = await t.json("({ mode: __c._mode, boss: !!Creatures.boss })");
    await t.eval(`$gamePlayer.locate(${cx - 3}, ${cy}); 0`);
    const woke60 = await t.until("__c._engaged", 6, 20);
    await t.eval(`(function(){ __c._stun = 0; __c._gapT = 0; __c._slams = 1; $gamePlayer.locate(${cx - 2}, ${cy}); __c._faceAng = Math.PI; __c.setMode('chase'); __c.startMove('slam'); return 0; })()`);
    await t.until("__c._mode === 'recover'", 6, 20);
    await t.frames(20);
    await shot("boss_odzwierny_fala.png");
    const waves = await t.json("({ hits: __bus.filter(e => e.n === 'heroHit' && e.name === 'odłamki').length, slam: __bus.filter(e => e.n === 'heroHit').length })");
    t.check("Kamienny Odźwierny: asleep until the hero is at its threshold; its slam sends rings of shards across the room", sleeping.mode === "dormant" && !sleeping.boss && woke60 && waves.slam >= 1, Object.assign(sleeping, waves, { woke60 }));

    b = await bossArena("boss_70", 1);
    await t.eval("__c._boss = JSON.parse(JSON.stringify(__c._boss)); __c._boss.parry.chance = 1; __c._gapT = 99999; __c._faceAng = Math.PI; __c.setMode('chase'); 0");
    const par = await t.json(`(function(){ const c = __c, h0 = c._hp; Creatures.hit(c, 40, 'melee', { poise: 20 }); const light = h0 - c._hp, mode = c._mode; c.setMode('chase'); c._stun = 0; const h1 = c._hp; Creatures.hit(c, 40, 'melee', { poise: 60, heavy: true }); return { light, mode, heavy: h1 - c._hp, recoil: Combat.act.stun }; })()`);
    t.check("Zbroja bez herbu: it parries a light blow from the front and answers at once ('Sparowała!'); a heavy blow goes through", b.name === "Zbroja bez herbu" &&
        par.light === 0 && par.mode === "windup" && par.heavy === 40, par);

    b = await bossArena("boss_80", 3);
    await t.eval("__c._askT = 1; __c._cd.truth = 99999; __c._gapT = 99999; __c._hidden = false; __c.setMode('shown', 999); 0");
    await t.frames(4);
    const asked = await t.json("({ asking: !!__c._asking, q: __c._asking && __c._asking.q, said: SpeechBubbles.log.slice(-1)[0] })");
    await shot("boss_upior_pytajacego.png");
    await t.eval("Creatures.hit(__c, 5, 'melee', { poise: 1 }); 0");
    const ans = await t.json("({ asking: !!__c._asking, stun: __c._stun })");
    await t.eval("__c._stun = 0; __c._askT = 1; __c.setMode('shown', 999); __bus.length = 0; Combat.hero().attr.wil = 5; 0");
    await t.frames(4);
    await t.eval("if (__c._asking) __c._asking.t = 9999; 0");
    await t.frames(4);
    const unans = await t.json("__bus.filter(e => e.n === 'heroMind').length");
    t.check("Upiór pytającego: asks in the hero's own voice (the bubble over the hero); a blow answers it (it reels); unanswered - it hits the mind",
        b.name === "Upiór pytającego" && asked.asking && asked.said === asked.q && !ans.asking && ans.stun > 0 && unans === 1, Object.assign(asked, ans, { unans }));

    await keysUp(); await clear();
    await t.eval(`(function(){ $gameParty.leader().recoverAll(); $gamePlayer.locate(${cx - 6}, ${cy}); window.__c = Creatures.spawn('boss_90', ${cx}, ${cy}, { level: 5 }); window.__bus.length = 0; return 0; })()`);
    await t.frames(10);
    const g90 = await t.json("({ mode: __c._mode, sheet: __c.characterName(), name: __c._face && __c._face.name })");
    await t.eval(`$gamePlayer.locate(${cx - 3}, ${cy}); 0`);
    await t.frames(20);
    await shot("boss_ostatni_straznik_dziadek.png");
    await t.until("__c._revealed && __c._mode !== 'reveal'", 6, 20);
    const habit = await t.json("({ look: __c._look, sheet: __c.characterName(), boss: Creatures.boss === __c })");
    await t.eval("__c._hp = Math.round(__c._maxHp * 0.6); 0");
    await t.frames(4);
    const parts = await t.json("({ n: (__c._parts || []).length, alive: Creatures.list.filter(c => c._partOf === __c).length })");
    await shot("boss_ostatni_straznik_trzy.png");
    await t.eval("Creatures.hit(__c, 99999, 'melee', {}); 0");
    const waiting = await t.json("({ mode: __c._mode, dead: !!__c._dying })");
    await t.eval("for (const p of Creatures.list.filter(c => c._partOf === __c)) Creatures.hit(p, 99999, 'melee', {}); 0");
    await t.frames(10);
    const beaten = await t.json("({ bus: __bus.filter(e => e.n === 'creatureBoss').map(e => e.kind + ':' + e.how), dying: !!__c._dying || __c._dead })");
    t.check("Ostatni Strażnik: grandpa's face first, then the order's habit; at two thirds three shadows - beaten only when all three are gone",
        g90.mode === "lure" && g90.name === "Dziadek" && g90.sheet === "$Cr_Face_Dziadek" && habit.look === "Last" && habit.boss && parts.n === 3 && parts.alive === 2 &&
        waiting.mode === "waitParts" && !waiting.dead && beaten.dying && beaten.bus.includes("boss_90:beaten"), Object.assign(g90, habit, parts, waiting, beaten));

    // ================= 11. F9: a creature called up near the hero =================
    await clear();
    await t.eval("Creatures.pending = 'zbroja'; 0");
    await t.frames(4);
    const f9 = await t.json("(function(){ const c = Creatures.list[0]; return c ? { kind: c._kind, d: Math.round(Math.hypot(c._x - $gamePlayer.x, c._y - $gamePlayer.y) * 10) / 10, lv: c._level } : null; })()");
    t.check("F9 'Stwór z ruin': one 4-6 tiles away", !!f9 && f9.kind === "zbroja" && f9.d >= 3.9 && f9.d <= 7.2, f9);
    await clear();

    // ================= 12. the underground: a generated floor's markers; an emptied place stays empty; floor 10's guardian =================
    await t.eval("Creatures.auto(true); Combat.hero().attr.wil = 5; Underground.go(1); 0");
    const on1 = await t.until(t.onMap(131), 30);
    await t.frames(40);
    const f1 = await t.json(`({ spawns: Underground.spawns().map(s => s.kind), markers: $gameMap.events().filter(e => e.eventId() >= 860 && e.eventId() <= 899 && /<Creature:/.test(e.event().note)).length,
        list: Creatures.list.map(c => c._kind + ':' + c._level), keys: [...new Set(Creatures.list.map(c => c._marker && c._marker.key))] })`);
    t.check("floor 1: Underground.js put a marker for every place (events 860+), the creatures stand there - the kinds that fit the floor, the floor's level",
        on1 && f1.markers === f1.spawns.length && f1.list.length >= f1.spawns.length && f1.list.every(s => /^(szczur|pajak):[345]$/.test(s)), f1);
    await shot("stwory_pietro1.png");
    const key = f1.keys[0];
    await t.eval(`for (const c of Creatures.list.filter(c => c._marker && c._marker.key === '${key}')) Creatures.hit(c, 99999, 'melee', {}); 0`);
    await t.frames(60);
    await t.eval("Underground.go(2); 0");
    await t.until(t.onMap(132), 30);
    await t.frames(20);
    await t.eval("Underground.go(1); 0");
    await t.until(t.onMap(131), 30);
    await t.frames(40);
    const again = await t.json(`({ killed: Creatures.state().killed['${key}'] !== undefined, here: Creatures.list.filter(c => c._marker && c._marker.key === '${key}').length, others: Creatures.list.length })`);
    t.check("an emptied place stays empty when the hero comes back (for 3 days); the others are there", again.killed && again.here === 0 && again.others > 0, again);
    // floor 10: the guardian - armed (the combat mode), the riddle is a fight
    await t.eval("Underground.go(10); 0");
    await t.until(t.onMap(140), 30);
    await t.frames(40);
    await t.eval(`(function(){ Creatures.clear(); $gameParty.leader().recoverAll(); $gameSystem._combatMode = true; const g = Creatures.guardianEvent(); $gamePlayer.locate(g.x, g.y + 2); $gameMap.setDisplayPos(g.x - 13, g.y - 7); g.start(); return 0; })()`);
    await t.until("Creatures.list.some(c => c._kind === 'guardian')", 6, 20);
    await t.until("!!Creatures.boss", 6, 20);   // (he wakes first)
    const gfight = await t.json("({ erased: Creatures.guardianEvent()._erased, boss: Creatures.boss && Creatures.boss._kind, msg: $gameMessage.isBusy() })");
    await shot("boss_straznik_bramy.png");
    t.check("floor 10, armed (combat mode): the guardian of the tenth gate fights instead of asking the riddle (no message, the boss bar)", gfight.erased && gfight.boss === "guardian" && !gfight.msg, gfight);
    await t.eval("const g2 = Creatures.list.find(c => c._kind === 'guardian'); window.__c = g2; g2._reassembled = true; g2._hp = 1; Creatures.hit(g2, 999, 'melee', { heavy: true }); 0");
    await t.frames(80);
    const gate = await t.json("({ sw: $gameSwitches.value(Underground_Data.SWITCHES.gate10), beaten: Creatures.state().guardian, remains: Creatures.drops().some(d => d.boss) })");
    t.check("the guardian beaten: the tenth gate opens (switch 14), his pieces lie there", gate.sw && gate.beaten && gate.remains, gate);
    await t.eval("Underground.go(9); 0");
    await t.until(t.onMap(139), 30);
    await t.eval("Underground.go(10); 0");
    await t.until(t.onMap(140), 30);
    await t.frames(30);
    t.check("back on floor 10: the guardian's armour stays a pile (its event gone)", await t.eval("Creatures.guardianEvent()._erased"));

    // ================= 13. every floor down to 99 with the creatures on: the hand-made ones with their bosses (the hero walks up to each), a few
    // generated ones of each band - no error (the hero cannot be hurt here: the run is about the code, not the fight)
    const sweep = [];
    for (const f of [11, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 76, 80, 85, 90, 99]) {
        t.clearErrors();
        const mid = await t.eval(`Underground.mapOf(${f})`);
        await t.eval(`Underground.go(${f}); 0`);
        const ok = await t.until(t.onMap(mid), 40);
        await t.frames(90);
        let boss = null;
        if (f % 10 === 0) {
            boss = await t.json("(function(){ const b = Creatures.list.find(c => c._boss); if (!b) return null; $gamePlayer.locate(b._x, b._y + 2); $gameMap.setDisplayPos(b._x - 13, b._y - 7); return b._kind; })()");
            await t.frames(240);
            boss = boss && (await t.eval("Creatures.boss ? Creatures.boss._kind : (Creatures.list.find(c => c._boss) || {})._mode || 'none'"));
        }
        const n = await t.eval("Creatures.list.length");
        sweep.push({ f, ok, n, boss, err: t.errors().length });
        if (f === 90 && SHOTS) await shot("boss_pietro90.png");
        await t.eval("Creatures.clear(); Combat.resetAct(); 0");
    }
    await t.eval("Combat.hitPlayer = window.__hitPlayer; clearInterval(window.__heal); 0");
    t.check("every floor 11-99 with the creatures on: no error; each hand-made floor 20-90 has its boss, who fights the hero coming up to him; at most 22 on a floor",
        sweep.every(s => s.ok && s.err === 0 && s.n <= 22 && (s.f % 10 !== 0 || s.boss === "boss_" + s.f)), sweep);

    // nothing to drink in what they leave (the drought)
    const drink = await t.json("Object.values(Creatures.KINDS).concat(Object.values(Creatures.BOSSES)).flatMap(k => (k.loot || []).map(l => l[0])).filter(id => [129, 123, 81, 137].includes(id))");
    t.check("no water or drink in what they leave (the drought)", drink.length === 0, drink);
    t.check("no errors in the console", t.errors().length === 0, t.errors().slice(0, 5));
});
