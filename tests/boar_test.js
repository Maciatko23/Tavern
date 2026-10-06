// The boar (Hunting.js, in the combat of Combat.js): it warns, charges and knocks the player down, backs off; the spear in hand
// jabs it (the attack key "["), it turns on him and flees when badly hurt; a bandage (yarrow) heals a wound, which otherwise heals
// by itself after a day.
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
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Birds) Birds.auto(false); Hunting.auto(false); Hunting.animate(false); $gameSystem.setDayNightHour(10); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const give = (id, n) => ev(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);
        await ev("window.__popups = []; const _pp = $gameTemp.pushLootPopup; $gameTemp.pushLootPopup = function(i, t, c) { window.__popups.push(t); return _pp.apply(this, arguments); }; 0");
        const popups = () => J("window.__popups");
        const clearPopups = () => ev("window.__popups.length = 0; 0");

        // ================= 1. the pictures and the map =================
        const sizes = await ev(`new Promise(res => { const out = {}, list = [["c", "$Animal_Boar"], ["c", "$Animal_Boar_Run"], ["s", "Swing_Spear"]]; let left = list.length; for (const [k, n] of list) { const bmp = k === "c" ? ImageManager.loadCharacter(n) : ImageManager.loadSystem(n); bmp.addLoadListener(() => { out[n] = [bmp.width, bmp.height]; if (--left === 0) res(out); }); } })`);
        check("the boar's walk and charge sheets (3 x 4) and the spear jab sheet (8 x 4 cells of 96) load", sizes["$Animal_Boar"][0] % 3 === 0 && sizes["$Animal_Boar"][1] % 4 === 0 && sizes["$Animal_Boar_Run"][0] % 3 === 0 && sizes["Swing_Spear"][0] === 768 && sizes["Swing_Spear"][1] === 384, sizes);
        const tg = await J("Hunting.mapTargets()");
        check("Map003 has one boar (besides the rabbits); it is out at dawn and dusk", tg.boar === 1 && (await J("Hunting.SPECIES.boar.hours")).join() === "5,9,17,21", tg);

        // ================= 2. the wound and the bandage =================
        await ev("$gameSystem.setStamina(100); 0");
        check("a bandage cannot be used without a wound", !(await ev("$gameParty.canUse($dataItems[152])")));
        await ev("$gameSystem.injure(22); 0");
        const hurt = await J(`({ st: $gameSystem.stamina(), wounded: $gameSystem.isWounded(), buffs: $gameSystem.activeBuffs().map(b => b.name + ":" + Math.round(b.left)) })`);
        check("a wound: -22 strength and a ceiling of 60% while it lasts (24 h, shown with the premia)", hurt.st === 60 && hurt.wounded && hurt.buffs.includes("wound:24"), hurt);
        await ev("$gameSystem.changeStamina(30); 0");
        check("resting does not lift it above 60% while wounded", (await ev("$gameSystem.stamina()")) === 60);
        await give(152, 1);
        check("with a wound the bandage can be used", await ev("$gameParty.canUse($dataItems[152])"));
        await ev("$gameParty.leader().useItem($dataItems[152]); 0");
        const healed = await J(`({ st: $gameSystem.stamina(), wounded: $gameSystem.isWounded(), left: $gameParty.numItems($dataItems[152]) })`);
        check("the bandage heals the wound at once (+10 strength, the ceiling gone) and is used up", !healed.wounded && healed.st === 100 && healed.left === 0, healed);
        await ev("$gameSystem.setStamina(100); $gameSystem.injure(22); $gameSystem.advanceDayNight(25); 0");
        check("left alone, a wound heals by itself in a day", !(await ev("$gameSystem.isWounded()")));

        // ================= 3. the boar charges =================
        const room = await J(`(function(){
            for (let y = 6; y < $gameMap.height() - 6; y++) for (let x = 6; x < $gameMap.width() - 14; x++) {
                let ok = true;
                for (let dx = 0; dx < 12 && ok; dx++) for (let dy = -2; dy <= 2; dy++) { if (!$gameMap.checkPassage(x + dx, y + dy, 0x0f) || $gameMap.eventsXy(x + dx, y + dy).length > 0 || Farming.hasObjectTile(x + dx, y + dy) || Farming.buildingAt(x + dx, y + dy)) { ok = false; break; } }
                if (ok) return { x, y };
            }
            return null; })()`);
        check("found an open lane of 12 tiles", !!room, room);
        const { x: lx, y: ly } = room;
        const standAt = (x, y, d) => ev(`for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${d}); $gameMap.setDisplayPos(${x} - 6, ${y} - 7); $gameSystem.setStamina(100); $gameSystem.healWound(); Hunting.resetCooldown(); 0`);
        await standAt(lx, ly, 6);
        await ev(`(function(){ const a = Hunting.spawn("boar", ${lx + 5}, ${ly}); a._wait = 9999; a._aware = 1; })()`);
        await clearPopups();
        await frames(6);
        const warn = await J("({ mode: Hunting.animals[0]._mode, dir: Hunting.animals[0].direction() })");
        check("noticed, the boar stops, turns to the player and warns (\"!\")", warn.mode === "warn" && warn.dir === 4, warn);
        let charged = null;
        for (let i = 0; i < 40 && !charged; i++) { await frames(4); const m = await ev("Hunting.animals[0]._mode"); if (m === "charge") charged = await J("({ sheet: Hunting.animals[0].characterName(), speed: Hunting.animals[0].moveSpeed() })"); }
        check("after the warning it charges: the running sheet, faster than the player walks", !!charged && charged.sheet === "$Animal_Boar_Run" && charged.speed > 4, charged);
        const full = await ev("$gameParty.leader().mhp");
        let gored = null;
        for (let i = 0; i < 60 && !gored; i++) { await frames(4); if ((await ev("$gameParty.leader().hp")) < full) gored = await J("({ hp: $gameParty.leader().hp, atk: Hunting.atkOf(Hunting.animals[0]), mode: Hunting.animals[0]._mode, stun: Combat.act.stunKind })"); }
        check("it reaches the player: its attack off his health (30+), he is knocked down, and it backs off", !!gored && full - gored.hp === gored.atk && gored.atk >= 30 && gored.stun === "down" && gored.mode === "retreat", { full, ...gored });

        // ================= 4. the spear =================
        await give(154, 1);
        await standAt(lx, ly, 6);
        await ev("$gameParty.leader().recoverAll(); Combat.resetAct(); 0");
        await ev(`(function(){ const a = Hunting.spawn("boar", ${lx + 2}, ${ly}); a._frozen = true; })()`);
        await frames(4);
        const inReach = await ev("!!Hunting.spearTarget()");
        check("a boar 2 tiles in front is within the spear's reach", inReach);
        const dur0 = await ev("window.Durability ? Durability.left(154) : 0").catch(() => null);
        await clearPopups();
        const boarMax = await ev("Hunting.animals[0]._maxHp");
        check("the attack key with the spear in hand jabs (no aiming)", (await ev("Combat.hand()")) === "m154" && await ev("Hunting.pressShoot()") && !(await ev("!!Hunting.aim")));
        await frames(30);
        const jab1 = await J("({ hp: Hunting.animals[0]._hp, mode: Hunting.animals[0]._mode, st: $gameSystem.stamina(), breath: Combat.breath, maxBreath: Combat.maxBreath() })");
        check("the jab: the spear's 20 (32 when critical) off its life (110+); breath spent, not the day's strength", (jab1.hp === boarMax - 20 || jab1.hp === boarMax - 32) && jab1.st === 100 && jab1.breath < jab1.maxBreath, { boarMax, ...jab1 });
        // it recovers and comes again (stagger -> warn -> charge); caught in reach, the second jab
        await ev("Hunting.animals[0]._frozen = false; 0");
        let again = false;
        for (let i = 0; i < 40 && !again; i++) { await frames(3); again = (await ev("Hunting.animals[0]._mode")) === "charge"; }
        check("after reeling back it gathers itself and charges again", again);
        await ev(`(function(){ const a = Hunting.animals[0]; a._frozen = true; a.locate(${lx + 2}, ${ly}); a._hp = 12; a._stun = 0; a.setMode("warn", 999); })()`);
        const car0 = await ev("Hunting.carcasses().length");
        await ev("Hunting.resetCooldown(); Combat.resetAct(); 0");
        await ev("Hunting.pressShoot()");
        await frames(30);
        check("a jab finishes it off (12 life left): its carcass lies there, the boar counted", (await ev("Hunting.animals.length")) === 0 && (await ev("Hunting.carcasses().length")) === car0 + 1 && (await ev("Hunting.carcasses().slice(-1)[0].kind")) === "boar" && (await ev("Hunting.hunt().kills.boar")) === 1, { carcasses: await ev("Hunting.carcasses().length"), kills: await J("Hunting.hunt().kills") });
        if (dur0 !== null) check("the spear wears (Durability: jabs)", (await ev("window.Durability ? Durability.left(154) : 0")) < dur0 || dur0 === 0, { dur0, now: await ev("window.Durability ? Durability.left(154) : 0") });

        // the weapon in hand decides: the spear jabs even with a bow in the bag; the switch key puts the bow in hand, then the key aims it
        await standAt(lx, ly, 6);
        await ev(`(function(){ const a = Hunting.spawn("rabbit", ${lx + 6}, ${ly}); a._frozen = true; })()`);
        await give(126, 1); await give(127, 3);
        await ev("Combat.resetAct(); 0");
        const b0 = await ev("Combat.maxBreath()");
        const jabAir = await ev("Hunting.pressShoot()");
        await frames(40);
        check("the spear in hand, nothing in reach: it jabs at the air (breath spent, not strength, nothing hit), no aiming", jabAir && !(await ev("!!Hunting.aim")) && (await ev("Combat.breath")) < b0 && (await ev("$gameSystem.stamina()")) === 100 && (await ev("Hunting.animals.length")) === 1);
        await ev("Combat.resetAct(); Hunting.resetCooldown(); for (let i = 0; i < 6 && Combat.hand() !== 'ranged'; i++) Combat.switchHand(); 0");
        await ev("Hunting.pressShoot()");
        check("switched to the bow: the key aims it at the rabbit 6 tiles away", (await ev("Combat.hand()")) === "ranged" && (await ev("Hunting.aim && Hunting.aim.weapon")) === "bow");
        await ev("Hunting.endAim(); $gameParty.loseItem($dataItems[126], 1, true); Hunting.resetCooldown(); Combat.resetAct(); 0");

        // a shot makes it charge; badly hurt (15% of its life or less) it runs away
        await standAt(lx, ly, 6);
        await ev(`(function(){ const a = Hunting.spawn("boar", ${lx + 6}, ${ly}); a._wait = 9999; })()`);
        await ev("Hunting.hit(Hunting.animals[0], 2, 'shot')");
        check("hit by an arrow it does not flee - it charges at once", (await ev("Hunting.animals[0]._mode")) === "charge");
        await ev("(function(){ const a = Hunting.animals[0]; a._hp = Math.round(a._maxHp * 0.2); Hunting.hit(a, Math.round(a._maxHp * 0.1), 'shot'); })()");
        await frames(8);
        check("badly hurt (under 15% of its life) it runs away for good", (await ev("Hunting.animals[0]._mode")) === "flee", await ev("Hunting.animals[0]._mode"));

        // ================= 5. the jab with its animation, and the F9 row =================
        await standAt(lx, ly, 6);
        // (it faces him: an open jab - an unaware boar struck from behind would take a blow from hiding, x2.5, Combat_Fight.js SNEAK)
        await ev(`(function(){ const a = Hunting.spawn("boar", ${lx + 2}, ${ly}); a._frozen = true; a.setDirection(4); })()`);
        await ev("Hunting.animate(true); Combat.resetAct(); 0");
        await frames(2);
        const max5 = await ev("Hunting.animals[0]._maxHp");
        await ev("Hunting.pressShoot()");
        await frames(4);
        const mid = await J("({ swinging: $gamePlayer.isToolSwinging(), kind: $gamePlayer._swingEvent && $gamePlayer._swingEvent._swingKind, hp: Hunting.animals[0]._hp })");
        await frames(40);
        const after = await ev("Hunting.animals[0]._hp");
        check("with the animation the body plays the jab (swing kind 15) and the hit lands on its strike frame", mid.swinging && mid.kind === 15 && mid.hp === max5 && (after === max5 - 20 || after === max5 - 32), { max5, mid, after });
        await ev("Hunting.animate(false); 0");
        await standAt(lx, ly, 6);
        await ev("Hunting.pending = 'boar'; 0");
        await frames(10);
        const f9 = await J("Hunting.animals.map(a => ({ kind: a.kind(), d: Math.round(Math.hypot(a._x - $gamePlayer.x, a._y - $gamePlayer.y)) }))");
        check("the F9 row puts a boar 5-8 tiles away", f9.length === 1 && f9[0].kind === "boar" && f9[0].d >= 5 && f9[0].d <= 8, f9);
        // out of its hours (noon) the F9 boar and an F9 pack stay; an ordinary calm boar goes home
        await ev("$gameSystem.setDayNightHour(12); Hunting.pending = 'wolves'; 0");
        await frames(10);
        await ev(`Hunting.spawn("boar", ${lx + 3}, ${ly + 2}); Hunting.populate(); 0`);
        await frames(4);
        const noon = await J("Hunting.animals.map(a => a.kind() + (a._summoned ? '*' : ''))");
        check("at noon (not their hours) the F9 boar and the F9 wolves stay, an ordinary boar goes home", noon.filter(k => k === "boar*").length === 1 && noon.filter(k => k === "wolf*").length === 3 && !noon.includes("boar"), noon);
        await ev("$gameSystem.setDayNightHour(10); 0");

        // ================= 6. eight directions =================
        await standAt(lx, ly, 6);
        const flee = await ev(`(function(){ const a = Hunting.spawn("rabbit", ${lx + 3}, ${ly}); a._frozen = true; return RoamingActor.fleeDirection(a, 1, 1, { diagonal: true }); })()`);
        check("a frightened animal may bolt on a slant (the player up-left of it: it runs down-right, numpad 3)", flee === 3, flee);
        await standAt(lx, ly - 2, 6);
        await ev(`(function(){ const a = Hunting.spawn("boar", ${lx + 4}, ${ly + 1}); a._wait = 9999; a.setMode("charge", 240); })()`);
        await frames(30);
        const slant = await J("({ x: Hunting.animals[0]._x, y: Hunting.animals[0]._y })");
        check("the charging boar cuts the corner (diagonal steps: both x and y came closer)", slant.x < lx + 4 && slant.y < ly + 1, { slant, from: [lx + 4, ly + 1] });

        // ================= 7. health =================
        await standAt(lx, ly, 6);
        const hud = await J("(function(){ const g = SceneManager._scene._survivalHud._gauge; return { h: g.bitmap.height, want: UIStyle.HUD.step + UIStyle.HUD.row }; })()");
        check("the HUD gauge holds two rows now: health (heart) over stamina (bolt)", hud.h === hud.want, hud);
        const hp0 = await J("(function(){ $gameParty.leader().recoverAll(); Combat.resetAct(); return { hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp }; })()");   // (full again: the charge above hurt him)
        const goreAtk = await ev(`(function(){ const a = Hunting.spawn("boar", ${lx + 1}, ${ly}); Hunting.gore(a); $gameSystem.injure(0); return Hunting.atkOf(a); })()`);   // (the wound comes by chance: here for sure)
        const hp1 = await ev("$gameParty.leader().hp");
        check("a boar's hit takes its attack (30 at level 1, +12% a level) off the health", hp0.hp === hp0.mhp && hp1 === hp0.mhp - goreAtk, { hp0, goreAtk, hp1 });
        await ev("$gameSystem.advanceDayNight(5); 0");
        check("while wounded the health does not come back", (await ev("$gameParty.leader().hp")) === hp1);
        await ev("$gameSystem.healWound(); $gameSystem.advanceDayNight(5); 0");
        const hp2 = await ev("$gameParty.leader().hp");
        check("without the wound it heals by itself, 3% an hour (+15% in 5 hours)", Math.abs(hp2 - (hp1 + Math.round(hp0.mhp * 0.15))) <= 1, { hp1, hp2 });
        await ev("$gameSystem.injure(0); $gameParty.gainItem($dataItems[152], 1); $gameParty.leader().useItem($dataItems[152]); 0");
        const hp3 = await ev("$gameParty.leader().hp");
        check("a bandage heals 20% of the health (and the wound)", Math.abs(hp3 - Math.min(hp0.mhp, hp2 + Math.round(hp0.mhp * 0.2))) <= 1 && !(await ev("$gameSystem.isWounded()")), { hp2, hp3 });
        // the end: at 0 the engine's own check sends the game to the game-over screen
        await ev(`$gameParty.leader().setHp(1); Combat.resetAct(); Hunting.gore(Hunting.animals.find(a => a.kind() === "boar") || Hunting.spawn("boar", ${lx + 1}, ${ly})); 0`);
        let over = false;
        for (let i = 0; i < 40 && !over; i++) { await sleep(100); over = (await ev("SceneManager._scene.constructor.name")) === "Scene_Gameover"; }
        check("health 0: game over (Scene_Gameover)", over && (await ev("$gameParty.isAllDead()")));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
