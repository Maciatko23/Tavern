// Act III - the faction strikes the tavern (Act3.js + Act3_Data.js, docs/AKT3.md): the trigger (floor 50 with the grate open -> armed,
// the next night on the tavern / town map -> the siege; nights away -> the siege without the hero), the warnings (the people's calls,
// the journal's note, Ambroży's talk), the bell 3 + 1 (Ambroży who trusts the hero, or the rope and the bell's mini-game) and the town's
// help at Opinia 60+, the waves (outside on the town map, inside to the old door), the doors (broken: in / down into the cellar), the
// defenders by the state of the game (Grum ally / faction / sitting it out / gone, Rafał and Marek - W6, the manor's guards, Borgar),
// their fights with the men (Humans.setFoe), the outcomes held / costly / fallen (the bus, the flags, the rewards), the hero beaten
// (robbed, the rest without him), the siege without the hero, a save and a load in the middle of it, the F9 rows.
// CDP_PORT=9470 node tests/act3_test.js        (SHOTS=1: pictures into docs/akt3/)
const kit = require("./lib/kit.js");
const SHOTS = !!process.env.SHOTS;

kit.test({ port: 9470, plugins: ["Act3_Data", "Act3"] }, async t => {
    t.check("Act3 and its data in the page (registered or put in by the test)", ["registered", "injected"].includes(t.plugins.Act3) && ["registered", "injected"].includes(t.plugins.Act3_Data), t.plugins);
    t.check("a new story game", await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, hour: 10 }));
    // (the kit's quiet settings are put back after every transfer and they switch Act3 off - 2026-10-07: on again after each one)
    const go0 = t.go.bind(t);
    t.go = async (...a) => { const r = await go0(...a); await t.eval("if (window.Act3) Act3.auto(true); 0"); return r; };
    const shot = async name => { if (SHOTS) { await t.frames(2); await t.shot("../docs/akt3/" + name); } };
    await t.eval(`(function(){ Act3.auto(true); Combat.gainXp(6000, 'test'); $gameParty.leader().recoverAll(); Act3.DATA.PACE.gap = 40; Act3.DATA.PACE.firstGap = 30;
        window.__bus = []; for (const n of ['act3Armed', 'act3Start', 'act3Wave', 'act3Bell', 'act3Done']) Tawerna.on(n, e => __bus.push(Object.assign({ n }, e)), { owner: 'Act3Test' });
        if (window.TownQuests) TownQuests.bellOpts = { bot: 'target' }; return 0; })()`);
    await t.eval("(function(){ const _cc = Spriteset_Map.prototype.createCharacters; Spriteset_Map.prototype.createCharacters = function() { const n = $gameMap.events().filter(e => !e.event()).map(e => e.eventId()); if (n.length) console.error('Error NULLEV map ' + $gameMap.mapId() + ': ' + n.join(',') + ' phase ' + Act3.phase() + ' scene-from ' + (SceneManager._previousClass ? SceneManager._previousClass.name : '?') + ' inj ' + JSON.stringify(Tawerna.injected(8)) + ' T ' + Graphics.frameCount); return _cc.call(this); }; return 0; })()");
    // a fresh start of every scenario: the siege's state cleared, TownQuests' flags and Opinia as wanted
    const fresh = async (flags, opinion) => {
        await t.eval(`(function(){ Act3.reset(); Act3.auto(true); Humans.clear(); const f = TownQuests.state().flags;
            for (const k of ['grumAlly','w8Faction','grumGone','grumDead','ambrozyTrust','marekSaved','rafalAlly','rafalEnemy','lordAlly','tadekFriend','act3Held','act3Costly','act3Fallen','bellKey']) delete f[k];
            Object.assign(f, ${JSON.stringify(flags || {})}); TownQuests.state().opinion = ${opinion === undefined ? 30 : opinion};
            $gameParty.leader().recoverAll(); $gameSystem.setStamina && $gameSystem.setStamina(100); window.__bus.length = 0; return 0; })()`);
    };
    const S = expr => t.json(expr);
    const siege = () => S(`(function(){ const s = Act3.state().siege; return s ? { t: s.t, wave: s.wave, bell: s.bell, helpers: s.helpers, damage: Math.round(s.damage), doors: s.doors, broken: s.broken, wentDown: s.wentDown,
        waves: s.waves.map(w => w.state), defs: Object.keys(s.defenders) } : null; })()`);
    const live = () => S("Act3.live().filter(h => !h._dead).map(h => ({ kind: h._kind, name: h._label, x: h._x, y: h._y, mode: h._mode, tag: h._tag, foe: h._foe ? h._foe._id : null, hx: h._home.x, hy: h._home.y }))");
    const defs = () => S("Act3.defenders().map(d => ({ id: d._id, x: d._x, y: d._y, down: d._down, hp: d._hp, max: d._maxHp, mode: d._mode }))");
    // beat the wave on: wait till its men are on the map, every one of them beaten (the bus tallies them), then the next one may come
    const clearWave = async () => {
        await t.until("(function(){ const s = Act3.siege(); if (!s) return true; const W = s.waves[s.wave]; return !W || W.state !== 'pending' && (W.spawned || W.state !== 'live') && Act3.members(s.wave).length > 0 || (W && W.state === 'breached'); })()", 20);
        await t.eval("Act3.clearWave(); 0");
        await t.frames(70);
    };
    // the hero kept on his feet while the defenders fight (the archers shoot him from afar): his life refilled every 0.1 s
    const god = on => t.eval(on ? "window.__god = window.__god || setInterval(() => { if ($gameParty.leader()) $gameParty.leader().recoverAll(); }, 100); 0" : "clearInterval(window.__god); window.__god = null; 0");
    const heroAt = (x, y, d) => t.eval(`(function(){ $gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${d || 2}); $gameMap.setDisplayPos(${x} - 13, ${y} - 7); $gameParty.leader().recoverAll(); return 0; })()`);

    // ================= 1. what it is =================
    const api = await S(`({ api: Tawerna.api('Act3') === window.Act3, out: Act3.outcome(), ph: Act3.phase(), waves: Act3.DATA.WAVES.map(w => w.id + '@' + w.map),
        inj: Tawerna.inject.list().filter(o => o.owner === 'Act3').map(o => o.ids) })`);
    t.check("Act3 on the API (Tawerna.api), no outcome yet (null), idle; four waves (2 outside on the town map, 2 inside); its ids 859 (the rope) + 840-858 kept",
        api.api && api.out === null && api.ph === "idle" && api.waves.join() === "w1@8,w2@8,w3@1,w4@1" && api.inj.includes("859") && api.inj.includes("840-858"), api);
    const sheets = await S(`new Promise(res => { const list = Act3.DATA.DEFENDERS.map(d => d.sheet).filter((v, i, a) => a.indexOf(v) === i), out = {}; let left = list.length;
        for (const n of list) { const b = ImageManager.loadCharacter(n); const iv = setInterval(() => { if (!b.isReady() && !b.isError()) return; clearInterval(iv); out[n] = b.isError() ? null : [b.width, b.height, !!Hunting.LOOK8[n]]; if (--left === 0) res(out); }, 20); } })`);
    t.check("every defender's 8-way walk loads and is in Hunting's LOOK8 (its own name - the town's residents keep their $Npc_ sheets)",
        Object.values(sheets).every(s => s && s[1] === 512 && s[2]), sheets);
    const cap = await S(`new Promise(res => { const keys = Object.keys(Hunting.LOOK8).filter(k => k.indexOf("$Human_Captain") === 0), list = keys.concat(keys.map(k => Hunting.LOOK8[k].sheet)), out = {}; let left = list.length;
        for (const n of list) { const b = ImageManager.loadCharacter(n); const iv = setInterval(() => { if (!b.isReady() && !b.isError()) return; clearInterval(iv); out[n] = b.isError() ? null : [b.width, b.height]; if (--left === 0) res({ keys, out, look: !!Humans.LOOKS.Captain }); }, 20); } })`);
    t.check("the commander's own look (Captain): 6 LOOK8 keys, every 8-way sheet and its 4-way $Human_Captain_* file loads (a missing one would halt every map)",
        cap.keys.length === 6 && cap.look && Object.values(cap.out).every(Boolean), cap);

    // ================= 2. the trigger =================
    await fresh();
    await t.eval("Underground.state().deepest = 30; Underground.open(); 0");
    await t.go(8, 24, 19, 8);
    await t.frames(80);
    t.check("floor 30 only: nothing (idle) on the town map", (await S("Act3.phase()")) === "idle");
    await t.eval("Underground.state().deepest = 50; Underground.open(); Act3.auto(false); 0");
    await t.frames(80);
    t.check("Act3.auto(false) (the other systems' tests): floor 50 and the grate open, yet nothing by itself", (await S("Act3.phase()")) === "idle");
    await t.eval("Act3.auto(true); Underground.state().deepest = 50; Underground.close(); 0");
    await t.frames(80);
    t.check("floor 50 but the grate shut: still idle", (await S("Act3.phase()")) === "idle");
    await t.eval("Underground.open(); 0");
    await t.frames(80);
    const armed = await S("({ ph: Act3.phase(), sd: Act3.state().siegeDay, d: $gameSystem.dayNightDay(), bus: __bus.filter(b => b.n === 'act3Armed').length })");
    t.check("floor 50 with the grate open, up in the town: armed, the strike planned for the next night (act3Armed)", armed.ph === "armed" && armed.sd === armed.d + 1 && armed.bus === 1, armed);
    const note = await S("(Journal.notes ? Journal.notes() : ($gameSystem._journal && $gameSystem._journal.notes) || []).map(n => n.title || n[0] || '').join('|')");
    t.check("the journal's note \"Obcy w miasteczku\"", /Obcy w miasteczku/.test(JSON.stringify(note)) || (await S("JSON.stringify($gameSystem).indexOf('Obcy w miasteczku') >= 0")), note);
    // the warnings: a resident near the hero calls out (once a day each)
    const warned = await S(`new Promise(res => { const L = TownLife, ev = L.residents().find(e => !e.isTransparent()); if (!ev) return res(null);
        $gamePlayer.locate(ev.x, ev.y + 1); let n = 0; const iv = setInterval(() => { const who = Act3.state().warn.who; if (Object.keys(who).length || ++n > 100) { clearInterval(iv); res({ who, key: (ev.event().note || '').replace(/<Town:|>/g, '') }); } }, 50); })`);
    t.check("the warnings: a resident by the hero says what the town has seen (one call each a day)", !!warned && Object.keys(warned.who).length >= 1, warned);
    // the day: no strike yet (15:00 of the planned day); the night but away (grandpa's house): none either
    await t.eval("$gameSystem._dayNightDay = Act3.state().siegeDay; $gameSystem.setDayNightHour(15); 0");
    await t.frames(60);
    t.check("the planned day at 15:00: no strike yet", (await S("Act3.phase()")) === "armed");
    await t.go(19, 8, 6, 2);
    await t.setHour(22);
    await t.frames(60);
    t.check("the night, but the hero at grandpa's: they wait (armed)", (await S("Act3.phase()")) === "armed");
    await t.go(8, 24, 19, 8);
    await t.frames(60);
    const started = await S("({ ph: Act3.phase(), bus: __bus.filter(b => b.n === 'act3Start').length, rope: !!$gameMap.event(859), ropeAt: $gameMap.event(859) ? [$gameMap.event(859).x, $gameMap.event(859).y] : null })");
    t.check("the night on the town map: the siege (act3Start); the bell's rope (event 859) under the bell", started.ph === "siege" && started.bus === 1 && started.rope && started.ropeAt.join() === "47,29", started);

    // ================= 3. the bell: nobody trusts the hero - the rope and the mini-game; Opinia 30 - the doors stay shut =================
    await god(true);
    await t.frames(200);
    let s1 = await siege();
    t.check("Ambroży does not trust him: no bell by itself", s1 && s1.bell === null, s1);
    await t.eval("Act3.bellRope(); 0");
    const rung = await t.until("Act3.siege() && Act3.siege().bell === 'hero'", 40);
    await t.until(t.onMap(8), 20);
    s1 = await siege();
    t.check("the rope: the bell's mini-game, four strikes -> the alarm rung by the hero (act3Bell)", rung && s1.bell === "hero" && (await S("__bus.some(b => b.n === 'act3Bell' && b.by === 'hero')")), s1);
    t.check("Opinia 30: the town keeps its doors shut (no helpers)", s1.helpers === false, s1);
    // the first wave: at the yard's gate, marching to the tavern's door
    await t.until("Act3.live().length > 0", 20);
    let L1 = await live();
    t.check("wave 1 on the town map: 2 bandits and a knife bandit of the faction (tag act3_w1), their way to the tavern's door (24,17)",
        L1.length === 3 && L1.every(h => h.tag === "act3_w1" && h.hx === 24 && h.hy === 17) && L1.filter(h => h.kind === "bandit").length === 2, L1);
    await shot("akt3_fala1.png");

    // ================= 4. the doors: the hero far away - the men work at the door, it breaks, they go in =================
    await heroAt(9, 19, 6);
    await t.eval("Act3.live().forEach(h => { if (h._engaged) h.disengage(); h._aware = 0; }); 0");
    const doorFell = await t.until("Act3.siege() && Act3.siege().doors[8] < 100", 60);
    t.check("the men at the door (nobody stops them): its life goes down", doorFell, await siege());
    await t.eval("Act3.siege().doors[8] = 2; 0");
    const broke = await t.until("Act3.siege() && Act3.siege().broken[8]", 30);
    s1 = await siege();
    t.check("the town door broken: damage +20, the ones at it go in (carried to the wave inside)", broke && s1.damage >= 20 && (await S("Act3.siege().waves[2].carry.length + Act3.siege().waves[3].carry.length")) >= 1, s1);
    await t.eval("for (const h of Act3.live()) if (!h._dead) Humans.kill(h, 'melee'); 0");
    await t.until("Act3.siege() && Act3.siege().wave === 1 && Act3.siege().waves[1].state === 'live'", 20);
    s1 = await siege();
    t.check("wave 1 beaten: wave 2 next (act3Wave)", s1.wave === 1 && (await S("__bus.filter(b => b.n === 'act3Wave').length")) >= 2, s1);
    await clearWave();
    // the wave inside while the hero is outside: an hour of the game's clock and they are through the old door
    await t.until("Act3.siege() && Act3.siege().wave === 2 && Act3.siege().waves[2].state === 'live'", 20);
    await t.eval("$gameSystem.advanceDayNight(1.05); 0");
    await t.frames(30);
    s1 = await siege();
    t.check("wave 3 (inside) left alone for an hour: the old door gives, they go down into the cellar (damage, wentDown) - the three from the town door with them", s1.waves[2] === "breached" && s1.wentDown >= 4 && s1.broken[1] && s1.damage >= 100, s1);
    const fall = await S("({ ph: Act3.phase(), out: Act3.outcome(), f: TownQuests.state().flags.act3Fallen, bus: __bus.filter(b => b.n === 'act3Done').map(b => b.result) })");
    t.check("the faction down in the cellar (damage 100): the tavern has fallen at once - outcome { result: 'fallen', defenders, lost }, the bus act3Done, the flag act3Fallen",
        fall.ph === "done" && fall.out && fall.out.result === "fallen" && Array.isArray(fall.out.defenders) && Array.isArray(fall.out.lost) && fall.bus.join() === "fallen" && !!fall.f, fall);

    // ================= 5. all the help: Grum ally, Ambroży, Opinia 70, Rafał and Marek, the manor's guards =================
    await fresh({ grumAlly: 1, ambrozyTrust: 1, marekSaved: 1, rafalAlly: 1, lordAlly: 1 }, 70);
    await heroAt(10, 19, 6);
    await t.eval("Act3.debugStart(); 0");
    await t.frames(30);
    const g1 = await defs();
    t.check("Grum (ally, W8) comes at once by the hero's side", g1.some(d => d.id === "grum"), g1);
    const bellA = await t.until("Act3.siege() && Act3.siege().bell === 'ambrozy'", 20);
    s1 = await siege();
    t.check("Ambroży trusts him: he rings three and one himself; Opinia 70 -> the town comes", bellA && s1.helpers === true, s1);
    await t.until("Act3.defenders().length >= 10", 40);
    const g2 = await defs();
    const ids2 = g2.map(d => d.id).sort();
    t.check("the defenders outside: Grum, Rafał and Marek (W6), the manor's two guards, Tadek, Ignac, Kuba and two refugees",
        ["grum", "rafal", "marek", "straz0", "straz1", "tadek", "ignac", "kuba", "uchodzcy0", "uchodzcy1"].every(k => ids2.includes(k)), ids2);
    // they fight the faction's men: a man struck by a defender fights it back (Humans.setFoe)
    await heroAt(10, 19, 6);
    const duel = await t.until("Act3.live().some(h => !h._dead && h._foe && h._foe.isDefender)", 40);
    t.check("a defender fights a man: the man fights it back (his foe - Humans.setFoe)", duel, await live());
    const hurt = await t.until("Act3.defenders().some(d => d._hp < d._maxHp)", 40);
    t.check("...and the man's blows land on the defender (its life goes down)", hurt, await defs());
    await shot("akt3_obroncy.png");
    // the waves outside beaten by them (the hero stands aside), then the ones inside by the test
    const out1 = await t.until("Act3.siege() && Act3.siege().wave >= 2", 120);
    t.check("the defenders beat both waves outside by themselves (the hero aside)", out1, await siege());

    // ================= 6. inside: Borgar at the old door, the hero goes in =================
    await t.go(1, 50, 52, 8, { calm: false });   // (not the kit's calm: it clears Humans.js's men - the wave coming in)
    await t.frames(30);
    const inside = await S("({ ev1: $gameMap.event(1).isTransparent(), ev3: $gameMap.event(3).isTransparent(), defs: Act3.defenders().map(d => d._id) })");
    t.check("in the tavern: Borgar (his event hidden, he fights) and Grum by the hero", inside.ev1 && inside.ev3 && inside.defs.includes("borgar") && inside.defs.includes("grum"), inside);
    await t.until("Act3.live().length > 0", 20);
    const L3 = await live();
    t.check("wave 3 inside: through the kitchen, to the old door by the cellar (9,14)", L3.length >= 3 && L3.every(h => h.tag === "act3_w3") && L3.filter(h => h.hx === 9 && h.hy === 14).length >= 3, L3);
    await shot("akt3_w_srodku.png");
    await clearWave();
    await t.until("Act3.siege() && Act3.siege().wave === 3 && Act3.live().some(h => !h._dead && h._tag === 'act3_w4')", 30);
    const L4 = await live();
    t.check("wave 4: the commander of the diggers (Dowódca kopaczy) through the front door, with his men", L4.some(h => h.name === "Dowódca kopaczy") && L4.length >= 3, L4);
    await clearWave();
    await t.until("Act3.phase() === 'done'", 20);
    const held = await S("({ out: Act3.outcome(), f: TownQuests.state().flags.act3Held })");
    t.check("all four waves beaten, little damage: the tavern held ('held'), its defenders listed, the flag act3Held",
        held.out && held.out.result === "held" && held.out.defenders.includes("borgar") && held.out.defenders.includes("grum") && held.out.bell === "ambrozy" && !!held.f, held);
    await t.frames(500);
    const after = await S("({ ev1: $gameMap.event(1).isTransparent(), defs: Act3.defenders().length })");
    t.check("afterwards the defenders go, Borgar is at his bar again", !after.ev1 && after.defs === 0, after);

    // ================= 7. Grum on the faction's side, Rafał given away: they are among the men =================
    await fresh({ w8Faction: 1, rafalEnemy: 1 }, 30);
    await t.go(1, 50, 52, 8);
    await t.setHour(22);
    await t.eval("Act3.debugStart({ wave: 3 }); 0");
    await t.until("Act3.live().some(h => !h._dead && h._tag === 'act3_w4')", 30);
    const L7 = await live();
    const ev3 = await S("$gameMap.event(3).isTransparent()");
    t.check("w8Faction: Grum is with the commander (a mercenary named Grum), his seat in the tavern empty", L7.some(h => h.name === "Grum" && h.kind === "mercenary") && ev3, L7);
    await t.eval("(function(){ const g = Act3.live().find(h => h._label === 'Grum'); Humans.surrender(g); Humans.decide(g._hid, 'spare'); return 0; })()");
    await clearWave();
    await t.until("Act3.phase() === 'done'", 20);
    const gf = await S("({ out: Act3.outcome(), gone: TownQuests.state().flags.grumGone, away: TownQuests.grumAway() })");
    t.check("Grum beaten and spared: he leaves on the ferry (outcome grum 'gone', the flag grumGone - gone from the tavern)", gf.out && gf.out.grum === "gone" && !!gf.gone && gf.away, gf);
    await t.eval("(function(){ Act3.reset(); const f = TownQuests.state().flags; f.rafalEnemy = 1; delete f.w8Faction; delete f.grumGone; return 0; })()");
    await t.go(8, 24, 19, 8);
    await t.eval("Act3.debugStart({ wave: 1 }); 0");
    await t.until("Act3.live().length > 0", 20);
    const L7b = await live();
    t.check("Rafał given to the Lord (W6 rafalEnemy): he is a knife bandit in wave 2", L7b.some(h => h.name === "Rafał" && h.kind === "knifer"), L7b);
    // Grum sitting it out (no choice in W8): he stays at his table
    await fresh({}, 30);
    await t.go(1, 50, 52, 8);
    await t.eval("Act3.debugStart({ wave: 2 }); 0");
    await t.frames(60);
    const neutral = await S("({ ev3: !$gameMap.event(3).isTransparent(), defs: Act3.defenders().map(d => d._id), grum: Act3.ctx().grum })");
    t.check("no choice in W8: Grum sits it out (his event visible, not a defender)", neutral.ev3 && !neutral.defs.includes("grum") && neutral.grum === "neutral", neutral);

    // ================= 8. a save and a load in the middle of the siege =================
    await t.eval("Act3.reset(); 0");
    await fresh({ grumAlly: 1 }, 30);
    await t.go(8, 10, 19, 6);
    await t.eval("Act3.debugStart(); 0");
    await t.until("Act3.live().length === 3", 20);
    await t.eval("(function(){ const h = Act3.live()[0]; Humans.kill(h, 'melee'); return 0; })()");
    await t.frames(40);
    await t.saveTo(3);
    const before = await siege();
    t.check("saved in the middle: wave 1 with 2 men left", before.wave === 0 && (await S("Act3.live().filter(h => !h._dead).length")) === 2, before);
    await t.loadFrom(3, { quiet: false });
    await t.frames(60);
    const loaded = await S("({ ph: Act3.phase(), wave: Act3.siege() && Act3.siege().wave, men: Act3.live().filter(h => !h._dead).map(h => h._tag), defs: Act3.defenders().map(d => d._id) })");
    t.check("loaded: still the siege, wave 1, its 2 men back, Grum by the hero again", loaded.ph === "siege" && loaded.wave === 0 && loaded.men.length === 2 && loaded.men.every(x => x === "act3_w1") && loaded.defs.includes("grum"), loaded);

    // ================= 9. the hero beaten: robbed, not killed - the rest without him =================
    await god(false);
    await t.eval("Act3.reset(); Humans.clear(); 0");
    await fresh({}, 30);
    await t.go(8, 24, 19, 8);
    await t.eval("$gameParty.gainGold(100); Act3.debugStart(); 0");
    await t.until("Act3.live().length > 0", 20);
    const g0 = await t.gold();
    await t.eval("(function(){ const h = Act3.live().find(x => !x._dead); Humans.beatenBy(h); return 0; })()");
    await t.until("Act3.phase() === 'done'", 30);
    const beat = await S("({ out: Act3.outcome(), hp: $gameParty.leader().hp })");
    t.check("beaten by the faction's men: robbed (gold taken), alive; without allies the tavern falls ('fallen', heroBeaten)",
        beat.out && beat.out.result === "fallen" && beat.out.heroBeaten && beat.hp > 0 && (await t.gold()) < g0, beat);
    await fresh({ grumAlly: 1, ambrozyTrust: 1, marekSaved: 1, rafalAlly: 1, lordAlly: 1 }, 70);
    await t.eval("Act3.debugStart({ wave: 3 }); 0");
    await t.frames(400);
    await t.eval("(function(){ const h = Act3.live().find(x => !x._dead) || Humans.spawn('bandit', $gamePlayer.x + 2, $gamePlayer.y, { tag: 'act3_w4' }); Humans.beatenBy(h); return 0; })()");
    await t.until("Act3.phase() === 'done'", 30);
    const beat2 = await S("Act3.outcome()");
    t.check("beaten too, but with strong allies and only the last wave left: they hold it ('costly')", beat2 && beat2.result === "costly" && beat2.heroBeaten, beat2);

    // ================= 10. the siege without the hero: three nights away =================
    await t.eval("Act3.reset(); 0");
    await fresh({}, 30);
    await t.go(19, 8, 6, 2);
    await t.eval("Act3.arm(); 0");
    await t.eval("$gameSystem._dayNightDay = Act3.state().siegeDay + 3; $gameSystem.setDayNightHour(10); 0");
    await t.frames(60);
    const off = await S("Act3.outcome()");
    t.check("three nights away: they struck without him - fallen (only Borgar), offscreen", off && off.result === "fallen" && off.offscreen && off.defenders.join() === "borgar", off);
    await t.go(1, 50, 52, 8);
    await t.frames(40);
    const told = await S("({ told: Act3.state().told, tops: window.__kit.tops.slice(-3) })");
    t.check("told when he comes to the tavern (\"Kiedy cię nie było...\")", told.told && told.tops.some(x => /Kiedy cię nie było/.test(x)), told);
    await t.eval("Act3.reset(); 0");
    await fresh({ grumAlly: 1, ambrozyTrust: 1, marekSaved: 1, rafalAlly: 1, lordAlly: 1 }, 70);
    await t.eval("Act3.arm(); $gameSystem._dayNightDay = Act3.state().siegeDay + 3; 0");
    await t.go(19, 8, 6, 2);
    await t.frames(60);
    const off2 = await S("Act3.outcome()");
    t.check("...with every ally (Ambroży rings, the town comes): costly, not fallen", off2 && off2.result === "costly" && off2.offscreen, off2);

    // ================= 11. the costly outcome, F9 =================
    await t.eval("Act3.reset(); 0");
    await fresh({}, 30);
    await t.go(1, 50, 52, 8);
    await t.eval("Act3.debugStart({ wave: 3 }); Act3.damage(50); 0");
    await t.until("Act3.live().some(h => !h._dead)", 20);
    await clearWave();
    await t.until("Act3.phase() === 'done'", 20);
    const costly = await S("({ out: Act3.outcome(), f: TownQuests.state().flags.act3Costly, scars: Act3.state().scarsUntil })");
    t.check("the waves beaten but the tavern half burnt (damage 50): 'costly', the flag act3Costly, the scars on the walls for some days",
        costly.out && costly.out.result === "costly" && !!costly.f && costly.scars > 0, costly);
    await t.eval("SceneManager.push(Scene_Debug); 0");
    await t.until("SceneManager._scene instanceof Scene_Debug && SceneManager._scene._list", 10);
    await t.frames(10);
    const rows = await S("SceneManager._scene._list._all.filter(r => /^act3_/.test(r.kind)).map(r => r.kind)");
    t.check("F9: three rows of Act III (arm, start now, clear)", rows.join() === "act3_arm,act3_start,act3_reset", rows);
    await t.eval("SceneManager.pop(); 0");
    await t.until(t.onMap(), 10);
});
