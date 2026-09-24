// Wolves (Hunting.js + Combat.js): a pack at night, the ring round the hero, one attacker at a time (bark -> leap -> bite -> stands),
// a roll through the leap, a parry, XP for a wolf, the pack running when its leader dies.
const { launch, sleep } = require("./cdp.js");
const OUT = process.argv[2] || "";
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(4, 24, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===4").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Birds) Birds.auto(false); Hunting.auto(false); $gameSystem.setDayNightHour(22); $gameSystem.setStamina(100); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const down = code => ev(`Input._onKeyDown({ keyCode: ${code}, preventDefault() {} }); 0`);
        const up = code => ev(`Input._onKeyUp({ keyCode: ${code} }); 0`);
        const key = async (code, hold = 3) => { await down(code); await frames(hold); await up(code); await frames(2); };
        const F = 79, SPACE = 32, V = 80, DOWNK = 40;   // (in the combat mode: the attack O and the guard P)

        // ================= 1. the pictures, where they live =================
        const sizes = await ev(`new Promise(res => { const out = {}, list = ["$Animal_Wolf", "$Animal_Wolf_Run", "$Animal_Wolf_Stalk", "$Animal_Wolf_Bark"]; let left = list.length; for (const n of list) { const bmp = ImageManager.loadCharacter(n); bmp.addLoadListener(() => { out[n] = [bmp.width, bmp.height]; if (--left === 0) res(out); }); } })`);
        check("the four wolf sheets load (3 x 4 cells of 68)", Object.values(sizes).every(s => s[0] === 204 && s[1] === 272), sizes);
        check("wolves: out at night (20-5), in packs of 2-4; three on the meadow (Map004)", (await J("Hunting.SPECIES.wolf.hours")).join() === "20,24,0,5" && (await J("Hunting.SPECIES.wolf.pack")).join() === "2,4" && (await J("Hunting.mapTargets()")).wolf === 3);

        // ================= 2. a pack =================
        const room = await J(`(function(){
            for (let y = 8; y < $gameMap.height() - 8; y++) for (let x = 8; x < $gameMap.width() - 8; x++) {
                let ok = true;
                for (let dx = -4; dx <= 4 && ok; dx++) for (let dy = -3; dy <= 3; dy++) { if (!$gameMap.checkPassage(x + dx, y + dy, 0x0f) || $gameMap.eventsXy(x + dx, y + dy).length > 0 || Farming.hasObjectTile(x + dx, y + dy) || Farming.buildingAt(x + dx, y + dy)) { ok = false; break; } }
                if (ok) return { x, y };
            }
            return null; })()`);
        check("found an open field 9 x 7", !!room, room);
        const { x: cx, y: cy } = room;
        await ev(`$gamePlayer.locate(${cx}, ${cy}); $gameMap.setDisplayPos(${cx} - 13, ${cy} - 7); $gameParty.leader().recoverAll(); Combat.resetAct(); $gameParty.gainItem($dataItems[115], 1); $gameSystem._combatMode = true; 0`);
        await ev(`window.__pack = Hunting.spawnPack(${cx + 4}, ${cy}, 3); for (const w of __pack.members) w._frozen = true; 0`);
        await frames(4);
        const p0 = await J("({ n: __pack.members.length, leader: __pack.leader._maxHp, other: __pack.members[1]._maxHp, lv: __pack.members.map(w => w._level), engaged: __pack.engaged, modes: __pack.members.map(w => w._mode) })");
        check("a pack of 3: the leader has 20% more life; they roam, not yet after him", p0.n === 3 && p0.leader > p0.other && !p0.engaged && p0.modes.every(m => m === "roam"), p0);
        // they notice him: a howl, the ring
        await ev("for (const w of __pack.members) w._frozen = false; Hunting.wolfEngage(__pack.members[0]); __pack.nextAttack = 9999; 0");
        for (let i = 0; i < 40; i++) await frames(6);
        const ring = await J("({ engaged: __pack.engaged, howled: __pack.howled, modes: __pack.members.map(w => w._mode), sheets: __pack.members.map(w => w.characterName()), dist: __pack.members.map(w => Math.round(w.playerDistance() * 10) / 10) })");
        check("engaged: a howl, all three stalk (the crouching sheet) on a ring about 3 tiles round him", ring.engaged && ring.howled && ring.modes.every(m => m === "stalk") && ring.sheets.every(s => s === "$Animal_Wolf_Stalk") && ring.dist.every(d => d > 1.8 && d < 4.8), ring);
        if (OUT) { await frames(20); await b.shot(OUT + "wolves_ring.png"); }

        // ================= 3. one attacks: bark, leap, bite =================
        await ev("__pack.nextAttack = 0; 0");
        let wind = null;
        for (let i = 0; i < 60 && !wind; i++) { await frames(3); wind = await J("(function(){ const w = __pack.members.find(w => w._mode === 'windup'); return w ? { i: __pack.members.indexOf(w), sheet: w.characterName(), attacker: __pack.attacker === w, mark: !!(w._markSprite && w._markSprite.visible), others: __pack.members.filter(o => o !== w).map(o => o._mode) } : null; })()"); }
        check("one wolf (and only one) comes: it barks (its sheet) under a '!', the others keep circling", wind && wind.sheet === "$Animal_Wolf_Bark" && wind.attacker && wind.others.every(m => m === "stalk" || m === "recover"), wind);
        const hp0 = await ev("$gameParty.leader().hp");
        let lunged = false;
        for (let i = 0; i < 60; i++) { await frames(2); if (await ev(`__pack.members[${wind ? wind.i : 0}]._mode === 'lunge'`)) { lunged = true; break; } }
        for (let i = 0; i < 40 && (await ev(`__pack.members[${wind ? wind.i : 0}]._mode`)) === "lunge"; i++) await frames(2);
        const bit = await J(`({ hp: $gameParty.leader().hp, mode: __pack.members[${wind ? wind.i : 0}]._mode, attacker: !!__pack.attacker, next: __pack.nextAttack })`);
        check("it leaps and bites: 12+ damage (level 1-2), then stands (recover) and the pack waits before the next", lunged && hp0 - bit.hp >= 12 && bit.mode === "recover" && !bit.attacker && bit.next >= 60, { lunged, hp0, ...bit });

        // ================= 4. a roll through the leap, a parry =================
        const nextAttacker = async () => {
            await ev("$gameParty.leader().recoverAll(); Combat.resetAct(); for (const w of __pack.members) { w._stun = 0; if (w._mode !== 'stalk') w.setMode('stalk'); } __pack.attacker = null; __pack.nextAttack = 0; 0");
            let w = null;
            for (let i = 0; i < 80 && w === null; i++) { await frames(2); w = await ev("(function(){ const w = __pack.members.find(w => w._mode === 'windup'); return w ? __pack.members.indexOf(w) : null; })()"); }
            return w;
        };
        // __auto presses the keys inside the game loop: "roll" - Space and an arrow across the leap as it starts; "parry" - face the
        // wolf and P (the guard, combat mode) when it is 1.7 tiles off (the bite comes at 0.95); the keys are let go once the leap is over
        await ev(`window.__auto = null; const _au = Scene_Map.prototype.update; Scene_Map.prototype.update = function() {
            const A = window.__auto;
            if (A && !A.done) {
                const w = __pack.members[A.wi];
                const dx = w.centerX() - ($gamePlayer._realX + 0.5), dy = w.centerY() - ($gamePlayer._realY + 0.5);
                if (!A.pressed && w._mode === "lunge" && (A.kind === "roll" || Math.hypot(dx, dy) < 1.7)) {
                    A.pressed = true;
                    if (A.kind === "roll") {   // out of its way: the arrow that heads least toward the wolf (a roll INTO it gets bitten)
                        const d = Math.hypot(dx, dy) || 1, dirs = [[37, -1, 0], [38, 0, -1], [39, 1, 0], [40, 0, 1]];
                        dirs.sort((a, b) => (a[1] * dx + a[2] * dy) / d - (b[1] * dx + b[2] * dy) / d);
                        A.keys = [dirs[0][0], 32];
                    }
                    else { if (Math.abs(dx) >= Math.abs(dy)) $gamePlayer.setDirection(dx < 0 ? 4 : 6); else $gamePlayer.setDirection(dy < 0 ? 8 : 2); A.keys = [80]; }
                    for (const k of A.keys) Input._onKeyDown({ keyCode: k, preventDefault() {} });
                    A.t = 0;
                }
                if (A.pressed) (A.log = A.log || []).push([w._mode, Math.round(Math.hypot(dx, dy) * 100) / 100, Combat.act.mode, Combat.act.iframes, Combat.act.blockT, $gameParty.leader().hp].join(" "));
                if (A.pressed && ++A.t > 4 && w._mode !== "lunge") { for (const k of A.keys) Input._onKeyUp({ keyCode: k }); A.done = true; }
            }
            _au.call(this);
        }; 0`);
        const autoAttack = async kind => {
            const wi = await nextAttacker();
            await ev(`window.__auto = { kind: "${kind}", wi: ${wi} }; 0`);
            for (let i = 0; i < 60 && !(await ev("__auto.done")); i++) await frames(3);
            await frames(6);
            return wi;
        };
        await autoAttack("roll");
        const dodged = await J("({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, done: __auto.done, log: __auto.log })");
        check("Space as it leaps: rolled out of the way, no bite", dodged.done && dodged.hp === dodged.mhp, dodged);
        const wi = await autoAttack("parry");
        const parried = await J(`({ hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, stun: __pack.members[${wi}]._stun, done: __auto.done })`);
        check("V just before the bite: parried, no damage, the wolf reels", parried.done && parried.hp === parried.mhp && parried.stun > 30, parried);
        await ev("window.__auto = null; 0");

        // ================= 5. killing them: XP, the leader, the pack runs =================
        await ev("__pack.nextAttack = 9999; 0");
        await ev('for (const it of $dataItems) if (it) Combat.hero().firsts["i" + it.id] = true; 0');
        const xp0 = await J("({ lv: Combat.hero().level, xp: Combat.hero().xp })");
        const other = await ev("__pack.members.findIndex(w => !w._leader && !w._dead)");
        await ev(`Hunting.hit(__pack.members[${other}], 999, "melee", {}); 0`);
        await frames(30);
        // (the first wolf also finishes the journal goal "Odeprzyj wilki": its 60 come on top)
        const xp1 = await J(`({ lv: Combat.hero().level, xp: Combat.hero().xp, want: Combat.killXp("wolf", __pack.members[${other}]._level), goal: Journal.GOALS.some(g => g.id === "wolves" && Journal.goalDone(g)) ? Combat.XP.goal : 0 })`);
        check("a wolf killed: its XP (30 at level 1, +20% a level), plus the goal 'Odeprzyj wilki' the first time", xp1.lv > xp0.lv || xp1.xp - xp0.xp === xp1.want + xp1.goal, { xp0, xp1 });
        await ev("Hunting.hit(__pack.leader, 999, 'melee', {}); 0");
        for (let i = 0; i < 20; i++) await frames(3);
        const fled = await J("({ broken: __pack.broken, modes: __pack.members.filter(w => !w._dead).map(w => w._mode) })");
        check("the leader killed: the pack is broken, the last one runs", fled.broken && fled.modes.every(m => m === "flee"), fled);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
