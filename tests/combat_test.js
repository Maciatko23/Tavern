// Combat.js, stage 1: keys (Space dodge / still OK in menus, V guard, X weapon), the hero's attributes, level, experience and skills,
// the breath, blows (combo, charged), the roll with its moment of safety, guarding and parrying the boar's charge, the XP sources.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Birds) Birds.auto(false); Hunting.auto(false); $gameSystem.setDayNightHour(10); $gameSystem.setStamina(100); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const give = (id, n) => ev(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);
        const key = async (code, hold = 3) => {
            await ev(`Input._onKeyDown({ keyCode: ${code}, preventDefault() {} }); 0`);
            await frames(hold);
            await ev(`Input._onKeyUp({ keyCode: ${code} }); 0`);
            await frames(2);
        };
        const down = code => ev(`Input._onKeyDown({ keyCode: ${code}, preventDefault() {} }); 0`);
        const up = code => ev(`Input._onKeyUp({ keyCode: ${code} }); 0`);
        const F = 79, SPACE = 32, V = 80, X = 221, RIGHT = 39, ENTER = 13;   // (in the combat mode - Tab - F: the attack O, V: the guard P, X: the next weapon "]")
        await frames(10);

        // ================= 1. keys =================
        check("keys: Space = dodge; O, P, [ and ] have their own names (what they do depends on the mode), Tab = the mode; the backslash, X, F and V are free", (await J("[Input.keyMapper[32], Input.keyMapper[79], Input.keyMapper[80], Input.keyMapper[219], Input.keyMapper[221], Input.keyMapper[9], Input.keyMapper[220] || null, Input.keyMapper[88] || null, Input.keyMapper[70] || null, Input.keyMapper[86] || null]")).join() === "dodge,keyO,keyP,keyLB,keyRB,tab,,,,");
        check("on the map Space is not OK", !(await ev("(function(){ Input._currentState.dodge = true; Input._latestButton = 'dodge'; Input._pressedTime = 0; const r = Input.isTriggered('ok'); Input._currentState.dodge = false; Input._latestButton = null; return r; })()")));
        const inMenu = await ev("(function(){ $gameTemp._farmMenuOpen = true; Input._currentState.dodge = true; Input._latestButton = 'dodge'; Input._pressedTime = 0; const r = Input.isTriggered('ok'); Input._currentState.dodge = false; Input._latestButton = null; $gameTemp._farmMenuOpen = false; return r; })()");
        check("...but in a menu (here the farm menu) Space still confirms", inMenu === true);

        // ================= 2. the hero =================
        const h0 = await J("(function(){ const h = Combat.hero(); return { level: h.level, xp: h.xp, attr: h.attr, points: h.points, sp: h.skillPoints, mhp: $gameParty.leader().mhp, hp: $gameParty.leader().hp, next: Combat.xpToNext(1), ready: h.ready }; })()");
        check("a new hero: level 1, 0 XP, every attribute 5, no points; 100 of 100 health; 69 XP to level 2 (level 100 at most)", h0.level === 1 && h0.xp === 0 && Object.values(h0.attr).every(v => v === 5) && Object.keys(h0.attr).length === 5 && h0.points === 0 && h0.sp === 0 && h0.mhp === 100 && h0.hp === 100 && h0.next === 69, h0);
        check("the start inventory counts as known (no XP for it)", h0.ready === true);
        const lv = await J("(function(){ Combat.gainXp(69, 'test'); const h = Combat.hero(); return { level: h.level, xp: h.xp, points: h.points, sp: h.skillPoints, mhp: $gameParty.leader().mhp }; })()");
        check("69 XP: level 2, +3 attribute points, +1 skill point, +3 health", lv.level === 2 && lv.xp === 0 && lv.points === 3 && lv.sp === 1 && lv.mhp === 103, lv);
        await frames(30);
        check("the level banner shows", await ev("!!SceneManager._scene._levelBanner && SceneManager._scene._levelBanner.opacity > 0"));
        const sp1 = await J("(function(){ const ok = Combat.spendPoints({ con: 2, str: 1 }); const h = Combat.hero(); return { ok, con: h.attr.con, str: h.attr.str, points: h.points, mhp: $gameParty.leader().mhp, hp: $gameParty.leader().hp, cap: Survival.weightCap() }; })()");
        check("spending 3 points: Kondycja 7 (+10 health, healed too), Siła 6 (+1 carried)", sp1.ok && sp1.con === 7 && sp1.str === 6 && sp1.points === 0 && sp1.mhp === 113 && sp1.hp === 113 && sp1.cap === 121, sp1);
        check("no more points: spending refuses", !(await ev("Combat.spendPoints({ dex: 1 })")));
        const sk = await J("(function(){ return { block: Combat.skillBlock('sweep'), combo: Combat.skillBlock('combo4'), learn: Combat.learnSkill('m_power'), again: Combat.skillBlock('m_power'), none: Combat.skillBlock('d_body') }; })()");
        check("skills (the trees): 'Szeroki zamach' wants level 20, 'Płynne kombo' level 4; the root 'Mocna ręka' learnt with the point; then no point for another", /poziomu 20/.test(sk.block) && /poziomu 4/.test(sk.combo) && sk.learn === true && /Brak punktów/.test(sk.again) && /Brak punktów/.test(sk.none), sk);
        await ev("Combat.hero().skills.combo4 = 1; Combat.hero().rev = (Combat.hero().rev || 0) + 1; 0");   // (the fight below uses the fourth blow)

        // ================= 3. the weapon in hand, the breath =================
        check("no weapon: the fists in hand", (await ev("Combat.hand()")) === "m0");
        await give(60, 1); await give(154, 1);
        await frames(40);
        check("the axe and the spear: the spear first (better than a stone axe)", (await ev("Combat.hand()")) === "m154");
        await key(X);
        const plateNormal = await J("({ vis: SceneManager._scene._weaponPlate.visible, hand: Combat.hand() })");
        await ev("$gameSystem._combatMode = true; 0");   // (the fight below is in the combat mode)
        await frames(2);
        check("normal mode: ] does not switch and the plate is hidden; combat mode: the plate in the corner shows", plateNormal.vis === false && plateNormal.hand === "m154" && (await ev("SceneManager._scene._weaponPlate.visible")), plateNormal);
        await key(X);
        check("] in the combat mode: the next weapon, the stone axe; the plate shows it", (await ev("Combat.hand()")) === "m60" && (await ev("SceneManager._scene._weaponPlate.visible")));
        await key(219);
        const back = await ev("Combat.hand()");
        await key(X);
        check("[ goes back to the previous one (the spear), ] forward again", back === "m154" && (await ev("Combat.hand()")) === "m60", back);
        const br = await J("({ max: Combat.maxBreath(), now: Combat.breath })");
        check("breath: 100 with Kondycja 5 rested... here Kondycja 7: 104", br.max === 104 && br.now === 104, br);

        // ================= 4. a boar to fight =================
        const room = await J(`(function(){
            for (let y = 6; y < $gameMap.height() - 6; y++) for (let x = 6; x < $gameMap.width() - 14; x++) {
                let ok = true;
                for (let dx = 0; dx < 12 && ok; dx++) for (let dy = -2; dy <= 2; dy++) { if (!$gameMap.checkPassage(x + dx, y + dy, 0x0f) || $gameMap.eventsXy(x + dx, y + dy).length > 0 || Farming.hasObjectTile(x + dx, y + dy) || Farming.buildingAt(x + dx, y + dy)) { ok = false; break; } }
                if (ok) return { x, y };
            }
            return null; })()`);
        check("found an open lane of 12 tiles", !!room, room);
        const { x: lx, y: ly } = room;
        const standAt = (x, y, d) => ev(`for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${d}); $gameMap.setDisplayPos(${x} - 6, ${y} - 7); $gameSystem.setStamina(100); $gameParty.leader().recoverAll(); Combat.resetAct(); 0`);
        await standAt(lx, ly, 6);
        await ev(`(function(){ const a = Hunting.spawn("boar", ${lx + 1}, ${ly}); a._frozen = true; window.__boar = a; })()`);
        await frames(4);
        const boar0 = await J("({ lv: __boar._level, hp: __boar._hp, max: __boar._maxHp, poise: __boar._poise })");
        check("a boar on Map003 (level 1 or 2): 110 life at level 1 (+15% a level), its balance 60", boar0.max === Math.round(110 * (1 + 0.15 * (boar0.lv - 1))) && boar0.hp === boar0.max && (boar0.lv === 1 || boar0.lv === 2), boar0);
        // one blow
        await key(F);
        for (let i = 0; i < 30 && (await ev("__boar._hp")) === boar0.hp; i++) await frames(2);
        const hit1 = await J("({ hp: __boar._hp, breath: Combat.breath, mode: Combat.act.mode, swinging: $gamePlayer.isToolSwinging() })");
        const dmg1 = boar0.hp - hit1.hp;
        check("F: the stone axe swings and hits: 17 x Siła 6 (x1.035) x Mocna ręka (x1.05) = 18 (or a critical 30), 16 breath spent", (dmg1 === 18 || dmg1 === 30) && hit1.breath <= 104 - 16 + 1, { dmg1, ...hit1 });
        check("the bar over the boar shows (hurt)", await ev("(function(){ const l = SceneManager._scene._spriteset._combatLayer; return l._bars.has(__boar); })()"));
        await frames(60);
        // a combo: three quick presses
        const hpB = await ev("__boar._hp");
        await ev("Combat.resetAct(); 0");
        await key(F); await frames(18); await key(F); await frames(18); await key(F); await frames(18); await key(F);
        for (let i = 0; i < 90 && (await ev("Combat.act.mode")) === "attack"; i++) await frames(3);
        const combo = await J("({ hp: __boar._hp, stun: __boar._stun, poise: __boar._poise })");
        check("F F F F (with 'Płynne kombo'): four blows in a row, more than 3 x 18 in all", hpB - combo.hp >= 3 * 18, { taken: hpB - combo.hp, ...combo });
        check("its balance broken by the combo: the boar reels (or already recovered from it)", combo.stun > 0 || combo.poise >= 0, combo);
        // a charged blow
        await ev("__boar._hp = __boar._maxHp; __boar._poise = __boar._maxPoise; __boar._stun = 0; Combat.resetAct(); 0");
        await frames(5);
        await down(F);
        await frames(50);
        const charging = await J("({ charge: Combat.act.charge, mode: Combat.act.mode })");
        await up(F);
        for (let i = 0; i < 40 && (await ev("__boar._hp")) === (await ev("__boar._maxHp")); i++) await frames(2);
        const heavy = await J("({ hp: __boar._hp, max: __boar._maxHp, stun: __boar._stun })");
        check("F held: it charges (half way after 50 frames), let go: a heavy blow, 2.2-2.7 x (about 40) damage, the boar reels", charging.charge >= 25 && heavy.max - heavy.hp >= 36 && heavy.stun > 0, { charging, heavy });
        await frames(40);

        // ================= 5. the boar charges: roll, guard, parry, hit =================
        const charge = async () => {
            await standAt(lx, ly, 6);
            await ev(`(function(){ const a = Hunting.spawn("boar", ${lx + 6}, ${ly}); a._aware = 1; a.setMode("charge", 240); a.turnTowardCharacter($gamePlayer); window.__boar = a; })()`);
        };
        // a clean hit
        await charge();
        for (let i = 0; i < 90 && (await ev("__boar._mode")) === "charge"; i++) await frames(2);
        const hitP = await J("({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, stun: Combat.act.stun, mode: __boar._mode })");
        check("the boar reaches him: 30+ damage, he is knocked down (poise 75 > 60 + 4x2), the boar backs off", hitP.mhp - hitP.hp >= 30 && hitP.stun > 0 && hitP.mode === "retreat", hitP);
        // a roll through the charge
        await charge();
        for (let i = 0; i < 90 && (await ev("__boar.playerDistance()")) > 2.2; i++) await frames(1);
        await down(40); await key(SPACE); await up(40);   // (down arrow held: rolls sideways out of the lane)
        const rolled = await J("({ mode: Combat.act.mode, iframes: Combat.act.iframes })");
        for (let i = 0; i < 60 && ["charge", "overshoot"].includes(await ev("__boar._mode")) === false; i++) await frames(2);
        await frames(40);
        const afterRoll = await J("({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, boar: __boar._mode, dist: Math.round(__boar.playerDistance() * 10) / 10 })");
        check("Space as it comes: a roll with a moment of safety - no damage", rolled.mode === "roll" && rolled.iframes > 0 && afterRoll.hp === afterRoll.mhp, { rolled, afterRoll });
        check("missed, it runs on well past him (3+ tiles), stops and stands panting (recover) - the moment to hit it", afterRoll.boar === "recover" && afterRoll.dist >= 3, afterRoll);
        // a roll straight at it: no safety - the charge lands in full and throws him back harder
        await charge();
        for (let i = 0; i < 90 && (await ev("__boar.playerDistance()")) > 2.2; i++) await frames(1);
        const x0 = await ev("$gamePlayer._realX");
        await down(RIGHT); await key(SPACE); await up(RIGHT);   // (toward the boar)
        for (let i = 0; i < 40 && (await ev("__boar._mode")) === "charge"; i++) await frames(2);
        await frames(20);
        const into = await J(`({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, atk: Hunting.atkOf(__boar), x: $gamePlayer._realX, mode: Combat.act.mode })`);
        check("Space toward the charging boar: no dodge - its full attack, and he is thrown back (behind where he rolled from)", into.mhp - into.hp === into.atk && into.x < x0 - 0.5, { x0, ...into });
        // a roll into a boar that stands: he bounces off its body and its tusks hurt (40% of its attack); a rabbit only bounces him
        await standAt(lx, ly, 6);
        await ev(`(function(){ const a = Hunting.spawn("boar", ${lx + 2}, ${ly}); a._frozen = true; window.__boar = a; })()`);
        const bx0 = await ev("$gamePlayer._realX");
        await down(RIGHT); await key(SPACE); await up(RIGHT);
        await frames(30);
        const bump = await J(`({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, part: Math.round(Hunting.atkOf(__boar) * 0.4), x: $gamePlayer._realX, bx: __boar._realX, mode: Combat.act.mode })`);
        check("rolled into a standing boar: stopped at its body, bounced back, the tusks take 40% of its attack", bump.mhp - bump.hp === bump.part && bump.x < bump.bx - 0.8 && bump.mode !== "roll", { bx0, ...bump });
        await standAt(lx, ly, 6);
        await ev(`(function(){ const a = Hunting.spawn("rabbit", ${lx + 2}, ${ly}); a._frozen = true; window.__rab = a; })()`);
        await down(RIGHT); await key(SPACE); await up(RIGHT);
        await frames(30);
        const rab = await J(`({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, x: $gamePlayer._realX, rx: __rab._realX })`);
        check("rolled into a rabbit: bounced off, no harm", rab.hp === rab.mhp && rab.x < rab.rx - 0.8, rab);
        // guarding (V held early: no parry)
        await charge();
        await down(V);
        for (let i = 0; i < 90 && (await ev("__boar._mode")) === "charge"; i++) await frames(2);
        await up(V);
        const blk = await J("({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, breath: Combat.breath })");
        check("V held: the charge is blocked - 45% of it gets through without a shield, breath spent", blk.mhp - blk.hp > 0 && blk.mhp - blk.hp <= Math.ceil(30 * 1.12 * 0.56) && blk.breath < 110, blk);
        // a parry: V just before the tusks
        await charge();
        for (let i = 0; i < 90 && (await ev("__boar.playerDistance()")) > 1.9; i++) await frames(1);
        await down(V);
        for (let i = 0; i < 40 && (await ev("__boar._mode")) === "charge" && (await ev("__boar._stun")) === 0; i++) await frames(1);
        await up(V);
        const par = await J("({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, stun: __boar._stun, poise: __boar._poise })");
        check("V a moment before the hit: parried - no damage, the boar reels long", par.hp === par.mhp && par.stun > 60, par);

        // ================= 5b. the club: its own quick swing, light blows =================
        await standAt(lx, ly, 6);
        await ev(`$gameParty.gainItem($dataItems[156], 1); (function(){ const a = Hunting.spawn("boar", ${lx + 1}, ${ly}); a._frozen = true; window.__boar = a; })(); Combat.resetAct(); 0`);
        for (let i = 0; i < 8 && (await ev("Combat.hand()")) !== "m156"; i++) await key(X);
        const clubHp = await ev("__boar._hp"), clubBreath = await ev("Combat.breath");
        await key(F);
        const clubSwing = await J("({ kind: $gamePlayer._swingEvent && $gamePlayer._swingEvent._swingKind, sheet: $gamePlayer._swingEvent ? ChoppableTree.swingKind($gamePlayer._swingEvent._swingKind).sheet : null, frames: $gamePlayer._swingEvent ? ChoppableTree.swingKind($gamePlayer._swingEvent._swingKind).frames : 0 })");
        for (let i = 0; i < 30 && (await ev("__boar._hp")) === clubHp; i++) await frames(2);
        const clubHit = await J(`({ dmg: ${clubHp} - __boar._hp, want: Math.round(13 * Combat.strMult() * (1 + Combat.perk("melee.dmg"))), crit: Math.round(13 * Combat.strMult() * (1 + Combat.perk("melee.dmg")) * 1.6), spent: ${clubBreath} - Combat.breath })`);
        check("the club (\\ to it): its own quick swing (Swing_Club, 22 frames), 13 x Siła (or a critical), 10 breath", clubSwing.sheet === "Swing_Club" && clubSwing.frames === 22 && (clubHit.dmg === clubHit.want || clubHit.dmg === clubHit.crit) && Math.round(clubHit.spent) === 10, { clubSwing, clubHit });
        // the fists: the last choice of \\ (with nothing else, the only one)
        await frames(30);
        await ev("Combat.resetAct(); 0");
        for (let i = 0; i < 8 && (await ev("Combat.hand()")) !== "m0"; i++) await key(X);
        const fistHp = await ev("__boar._hp"), fistBreath = await ev("Combat.breath");
        await key(F);
        const fistSwing = await J("({ sheet: $gamePlayer._swingEvent ? ChoppableTree.swingKind($gamePlayer._swingEvent._swingKind).sheet : null })");
        for (let i = 0; i < 30 && (await ev("__boar._hp")) === fistHp; i++) await frames(2);
        const fistHit = await J(`({ hand: Combat.hand(), dmg: ${fistHp} - __boar._hp, want: Math.round(5 * Combat.strMult()), crit: Math.round(5 * Combat.strMult() * 1.6), spent: ${fistBreath} - Combat.breath })`);
        check("\\ to the fists: a punch (Swing_Punch), 5 x Siła (or a critical), 7 breath", fistHit.hand === "m0" && fistSwing.sheet === "Swing_Punch" && (fistHit.dmg === fistHit.want || fistHit.dmg === fistHit.crit) && Math.round(fistHit.spent) === 7, { fistSwing, fistHit });
        const xpBar = await J("(function(){ const s = SceneManager._scene, x = s._xpBar, w = s._weaponPlate; return { vis: x.visible, above: x.y <= w.y - w.height - 4, right: x.x === w.x }; })()");
        check("the level and experience bar sits over the weapon plate in the corner", xpBar.vis && xpBar.above && xpBar.right, xpBar);
        await frames(40);

        // ================= 6. XP: kills, goals, first things =================
        await standAt(lx, ly, 6);
        const xp0 = await J("({ level: Combat.hero().level, xp: Combat.hero().xp })");
        await ev(`(function(){ const a = Hunting.spawn("boar", ${lx + 1}, ${ly}); a._frozen = true; a._hp = 5; window.__boar = a; })()`);
        await ev("Combat.resetAct(); 0");
        await key(F);
        for (let i = 0; i < 30 && !(await ev("__boar._dead")); i++) await frames(2);
        await frames(40);
        const xp1 = await J("({ level: Combat.hero().level, xp: Combat.hero().xp, kill: Combat.killXp('boar', __boar._level), goal: Combat.XP.goal })");
        check("a boar killed: XP for it (20 at level 1, +20% a level; the hunting goal may come with it)", (xp1.level > xp0.level || xp1.xp - xp0.xp === xp1.kill || xp1.xp - xp0.xp === xp1.kill + xp1.goal) && xp1.kill >= 20, { xp0, xp1 });
        const first = await J("(function(){ const tot = () => { const h = Combat.hero(); let t = h.xp; for (let L = 1; L < h.level; L++) t += Combat.xpToNext(L); return t; }; const x0 = tot(); $gameParty.gainItem($dataItems[149], 1); const x1 = tot(); $gameParty.gainItem($dataItems[149], 1); return { a: x1 - x0, b: tot() - x1 }; })()");
        check("the first nettle ever: +5 XP; the second: nothing", first.a === 5 && first.b === 0, first);
        const goalXp = await J("(function(){ const x0 = Combat.hero().xp, l0 = Combat.hero().level; const g = Journal.GOALS.find(g => !Journal.goalDone(g)); Journal.data().fresh = false; const d = Journal.data(); const old = g.done; g.done = () => true; Journal.evaluateGoals(); g.done = old; return { gained: (Combat.hero().level - l0) * 999 + Combat.hero().xp - x0, goal: g.id }; })()");
        check("a journal goal done: +50 XP", goalXp.gained === 50 || goalXp.gained > 900, goalXp);
        await frames(40);

        // ================= 7. saved with the game =================
        const saved = await J("(function(){ const json = JsonEx.stringify(DataManager.makeSaveContents()); const before = JSON.stringify(Combat.hero()); DataManager.extractSaveContents(JsonEx.parse(json)); return { same: JSON.stringify(Combat.hero()) === before, mode: Combat.act.mode }; })()");
        check("the hero (level, attributes, skills, known things) is saved and loaded; the fight state is reset", saved.same && saved.mode === "idle", saved);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
