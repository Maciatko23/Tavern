// Carcasses and meats (Hunting.js, Farming.js, Birds.js): a killed animal lies where it fell; only with a knife the action button
// dresses it (its own meat, raw hide, sinews); without one nothing, it waits until it rots (a day); the snare's rabbit; each meat
// roasts on its own, the soups / stew / smokehouse take any raw meat; the bow wants sinews; a bird gives 1-3 feathers.
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
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(4, 29, 9, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===4").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); Hunting.auto(false); if (window.Birds) Birds.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gameSystem.setDayNightHour(12); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const give = (id, n) => ev(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);
        const take = (id, n) => ev(`$gameParty.loseItem($dataItems[${id}], ${n}, true); 0`);
        await ev("window.__pops = []; const _pp = $gameTemp.pushLootPopup; $gameTemp.pushLootPopup = function(i, t, c) { window.__pops.push(t); return _pp.apply(this, arguments); }; 0");
        const press = async () => { await ev("Input._currentState.ok = true; Input._latestButton = 'ok'; Input._pressedTime = 0; 0"); await frames(2); await ev("Input._currentState.ok = false; 0"); await frames(2); };

        // ================= 1. the new things =================
        const names = await J("[94, 95, 157, 158, 159, 160, 161, 162, 163].map(i => $dataItems[i] && $dataItems[i].name)");
        check("the meats of the hare, deer, boar and wolf (raw / roasted) and the sinews", names.join() === "Surowe mięso zająca,Pieczone mięso zająca,Surowe mięso jelenia,Pieczone mięso jelenia,Surowe mięso dzika,Pieczone mięso dzika,Surowe mięso wilka,Pieczone mięso wilka,Ścięgna", names);
        const icons = await ev(`new Promise(res => { const bmp = ImageManager.loadSystem("IconSet"); const chk = () => { if (!bmp.isReady()) return setTimeout(chk, 50); const out = []; for (const i of [420, 421, 422, 423, 424, 425, 426]) { const d = bmp.context.getImageData((i % 16) * 32, Math.floor(i / 16) * 32, 32, 32).data; let n = 0; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++; out.push(n); } res(out); }; chk(); })`);
        check("their icons are drawn (420-426)", icons.every(n => n > 80), icons);

        // ================= 2. a rabbit killed: it lies there; no knife, nothing =================
        const px = 29, py = 9;
        const reset = () => ev(`$gamePlayer.locate(${px}, ${py}); $gamePlayer.setDirection(6); for (const c of Hunting.carcasses().slice()) Hunting.removeCarcass(c); 0`);
        await reset();
        const car0 = await count(101);
        await ev(`(function(){ const a = Hunting.spawn("rabbit", ${px + 1}, ${py}); a._frozen = true; Hunting.hit(a, 999, "melee", {}); })(); 0`);
        await frames(10);
        const dead = await J("Hunting.carcasses().map(c => ({ kind: c.kind, x: Math.round(c.x * 10) / 10, y: Math.round(c.y * 10) / 10 }))");
        check("killed: the rabbit lies where it fell (a carcass), nothing went into the bag", dead.length === 1 && dead[0].kind === "rabbit" && Math.abs(dead[0].x - (px + 1.5)) < 0.3 && (await count(101)) === car0 && (await count(94)) === 0, dead);
        const sprite = await ev("(function(){ const tm = SceneManager._scene._spriteset._tilemap; return tm.children.some(s => s.children && s.children.length === 2 && s.z > 1.5 && s.z < 3); })()");
        check("it is drawn on the ground: over the herbs and stones lying there (z 1.5), under the characters (z 3)", sprite);
        if (OUT) { await frames(10); await b.shot(OUT + "carcass_rabbit.png"); }
        await ev("window.__pops.length = 0; 0");
        await press();
        await frames(40);
        const noKnife = await J("({ left: Hunting.carcasses().length, meat: $gameParty.numItems($dataItems[94]), pops: window.__pops.slice() })");
        check("the action button without a knife: 'Potrzebujesz noża', nothing taken, the carcass stays", noKnife.left === 1 && noKnife.meat === 0 && noKnife.pops.some(t => /Potrzebujesz noża/.test(t)), noKnife);

        // ================= 3. with a knife: crouch, meat + hide + sinews, the knife wears =================
        await give(90, 1);
        const wear0 = await ev("Durability.left(90)");
        await press();
        const swinging = await ev("$gamePlayer.isToolSwinging()");
        await frames(70);
        const got = await J(`({ meat: $gameParty.numItems($dataItems[94]), hide: $gameParty.numItems($dataItems[96]), sinew: $gameParty.numItems($dataItems[163]), left: Hunting.carcasses().length, wear: Durability.left(90) })`);
        check("with a knife: the hero crouches, +1 hare meat, +1 raw hide, +1 sinew; the carcass is gone, the knife wears", swinging && got.meat === 1 && got.hide === 1 && got.sinew === 1 && got.left === 0 && got.wear === wear0 - 1, { swinging, wear0, ...got });

        // ================= 4. the others =================
        const yieldOf = async kind => {
            await reset();
            const before = await J("[157, 159, 161, 96, 163].map(i => $gameParty.numItems($dataItems[i]))");
            await ev(`(function(){ const a = Hunting.spawn("${kind}", ${px + 1}, ${py}); a._frozen = true; Hunting.hit(a, 9999, "melee", {}); })(); 0`);
            await frames(6);
            await press();
            await frames(70);
            const after = await J("[157, 159, 161, 96, 163].map(i => $gameParty.numItems($dataItems[i]))");
            return after.map((n, i) => n - before[i]);
        };
        const deer = await yieldOf("deer"), boar = await yieldOf("boar"), wolf = await yieldOf("wolf");
        check("a deer gives 3 deer meat, 2 hides, 2 sinews", deer.join() === "3,0,0,2,2", deer);
        check("a boar gives 4 boar meat, 2 hides, 2 sinews", boar.join() === "0,4,0,2,2", boar);
        check("a wolf gives 2 wolf meat, 1 hide, 2 sinews", wolf.join() === "0,0,2,1,2", wolf);

        // ================= 5. saved, and rotting after a day =================
        await reset();
        await ev(`Hunting.dropCarcass("deer", ${px + 1.5}, ${py + 0.5}, 6); 0`);
        await ev("$gameSystem.onBeforeSave(); window.__save = JsonEx.stringify(DataManager.makeSaveContents()); $gameSystem._carcasses = {}; DataManager.extractSaveContents(JsonEx.parse(window.__save)); 0");
        check("a carcass is kept in the save", (await ev("Hunting.carcasses().length")) === 1);
        await ev("$gameSystem.advanceDayNight(20); 0");
        await frames(130);
        const at20 = await ev("Hunting.carcasses().length");
        await ev("$gameSystem.advanceDayNight(5); 0");
        await frames(130);
        check("it rots away after a day (still there after 20 h, gone after 25 h)", at20 === 1 && (await ev("Hunting.carcasses().length")) === 0, at20);
        await ev("$gameSystem.setDayNightHour(12); 0");

        // ================= 6. the snare's rabbit =================
        const snareRabbit = async knife => {
            await reset();
            await (knife ? give(90, 1) : take(90, 9));
            const before = await J("[94, 96, 163].map(i => $gameParty.numItems($dataItems[i]))");
            await ev(`Hunting.takeFromSnare(${px + 2}, ${py}); 0`);
            await frames(4);
            const after = await J("[94, 96, 163].map(i => $gameParty.numItems($dataItems[i]))");
            return { got: after.map((n, i) => n - before[i]), carcasses: await J("Hunting.carcasses().map(c => c.kind)") };
        };
        const withK = await snareRabbit(true), withoutK = await snareRabbit(false);
        check("the snare's rabbit with a knife: dressed at once (+1 meat, hide, sinew)", withK.got.join() === "1,1,1" && withK.carcasses.length === 0, withK);
        check("...without a knife: it lies at the snare as a carcass", withoutK.got.join() === "0,0,0" && withoutK.carcasses.join() === "rabbit", withoutK);

        // ================= 7. the kitchen and the bow =================
        const fire = await J("Farming.BUILDINGS.campfire.recipes.map(r => r.id + ':' + r.inputs[0][0] + '>' + r.output[0])");
        check("the fire roasts each meat on its own (hare, deer, boar, wolf)", ["roast_meat:94>95", "roast_deer:157>158", "roast_boar:159>160", "roast_wolf:161>162"].every(x => fire.includes(x)), fire);
        const pot = await J("({ soup: Farming.BUILDINGS.cauldron.recipes.find(r => r.id === 'soup').meat, stew: Farming.BUILDINGS.cauldron.recipes.find(r => r.id === 'stew').meat, smoke: Farming.BUILDINGS.smokehouse.recipes.find(r => r.id === 'smoke_meat').meat })");
        check("the soup (1), the stew (2) and the smokehouse (2) take any raw meat", pot.soup === 1 && pot.stew === 2 && pot.smoke === 2, pot);
        // the smokehouse: wolf + boar meat together make the 2 pieces; the kinds there are most of go first
        const smoke = await J(`(function(){ const f = $gameSystem._farm, B = f.buildings[4] = f.buildings[4] || []; const b = { id: f.nextId++, type: "smokehouse", x: ${px - 4}, y: ${py - 3}, last: $gameSystem.dayNightDay() }; B.push(b); f.rev++;
            for (const i of [94, 157, 159, 161]) $gameParty.loseItem($dataItems[i], 99, true);
            $gameParty.gainItem($dataItems[161], 1); $gameParty.gainItem($dataItems[159], 1); $gameParty.gainItem($dataItems[61], 2);
            const e = Farming.menuFor(b.x, b.y).entries.find(e => e.name === "Wędź mięso");
            const row = e.costs.find(c => /dowolne/.test(c[3]));
            return { enabled: e.enabled !== false, row, ok: Farming.startJob(b, "smoke_meat") !== false, wolf: $gameParty.numItems($dataItems[161]), boar: $gameParty.numItems($dataItems[159]) }; })()`);
        check("the smokehouse shows 'surowe mięso (dowolne)' 2/2 and takes one wolf and one boar piece", smoke.enabled && smoke.row && smoke.row[1] === 2 && smoke.row[2] === 2 && smoke.ok && smoke.wolf === 0 && smoke.boar === 0, smoke);
        const bow = await J("Farming.BUILDINGS.workbench.recipes.find(r => r.id === 'bow').inputs");
        check("the bow: 2 wood, 1 rope, 2 sinews, 1 raw hide", JSON.stringify(bow) === JSON.stringify([[61, 2], [93, 1], [163, 2], [96, 1]]), bow);

        // ================= 8. birds: feathers only =================
        const birds = await J(`(function(){ const out = []; for (let i = 0; i < 12; i++) { Birds.reset(); const f = Birds.startGrounded("pigeon", { x: ${px + 3}, y: ${py} }); const b = f.birds[0]; const f0 = $gameParty.numItems($dataItems[146]), p0 = $gameParty.numItems($dataItems[145]); Birds.killBird(b); out.push([$gameParty.numItems($dataItems[146]) - f0, $gameParty.numItems($dataItems[145]) - p0]); } Birds.reset(); return out; })()`);
        check("a bird hit gives 1-3 feathers and no bird to pluck", birds.every(([f, p]) => f >= 1 && f <= 3 && p === 0) && new Set(birds.map(x => x[0])).size >= 2, birds);

        // ================= 8b. the F9 row "Jeleń w pobliżu": a deer 6-9 tiles away, whatever the hour =================
        await ev(`for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gameSystem.setDayNightHour(13); $gamePlayer.locate(${px}, ${py}); Hunting.pending = "deer"; 0`);
        await frames(10);
        await ev("Hunting.populate(); 0");   // (13:00 is not the deer's hour: an ordinary one would be sent home)
        const f9deer = await J(`Hunting.animals.filter(a => a.kind() === "deer").map(a => ({ kind: a.kind(), summoned: !!a._summoned, d: Math.round(Math.hypot(a._x - $gamePlayer.x, a._y - $gamePlayer.y) * 10) / 10 }))`);
        check("F9 'Jeleń w pobliżu': a deer 6-9 tiles away, and it stays out of its hours", f9deer.length === 1 && f9deer[0].kind === "deer" && f9deer[0].summoned && f9deer[0].d >= 6 && f9deer[0].d <= 9.5, f9deer);
        await ev("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gameSystem.setDayNightHour(12); 0");

        // ================= 9. a hurt deer limps; a hurt boar does not =================
        const limp = await J(`(function(){ const d = Hunting.spawn("deer", ${px + 3}, ${py + 2}); d._frozen = true; const s0 = d.realMoveSpeed(); d._hp = Math.round(d._maxHp * 0.6); const s1 = d.realMoveSpeed(); d._hp = Math.round(d._maxHp * 0.1); const s2 = d.realMoveSpeed();
            const b = Hunting.spawn("boar", ${px + 5}, ${py + 2}); b._frozen = true; const b0 = b.realMoveSpeed(); b._hp = 10; const b1 = b.realMoveSpeed(); Hunting.removeAnimal(d); Hunting.removeAnimal(b);
            return { s0, s1: Math.round(s1 * 100) / 100, s2: Math.round(s2 * 100) / 100, b0, b1 }; })()`);
        check("a hurt deer limps: slower the more life it has lost (a bit at 60%, ~a third near the end); a hurt boar keeps its speed", limp.s1 < limp.s0 - 0.2 && limp.s2 < limp.s1 - 0.2 && limp.s0 - limp.s2 <= 0.75 && limp.b1 === limp.b0, limp);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
