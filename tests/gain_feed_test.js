// What the hero gains (SurvivalHUD: Sprite_GainFeed): a plate slides in from the right edge at the bottom right, over the XP bar;
// newer ones under the older ones, which move up; the same item again adds up on its plate; experience there too; what is missing
// still floats over the player; a finished journal goal is said at the top centre (the user's, 2026-09-25).
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(12); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        await frames(120);   // (what the start of the game says has gone)
        const F = () => J(`(function(){ const s = SceneManager._scene, f = s._gainFeed, bar = s._xpBar;
            return { plates: f.children.map(p => ({ text: p.text(), x: Math.round(p.x), y: Math.round(p.y), w: p.bitmap.width, h: p.bitmap.height, op: p.opacity, fading: p.isFading(), color: p._data.color })),
                floating: s._lootLayer.children.map(p => p._data.text), barTop: bar ? Math.round(bar.y - bar.bitmap.height) : null, W: Graphics.width }; })()`);
        const clear = () => ev("SceneManager._scene._gainFeed.children.forEach(p => p.fadeNow()); 0");
        // the experience notice at the top centre: on screen or still waiting in the queue
        const XPN = () => J(`(function(){ const n = SceneManager._scene._topNotice, d = n._data;
            if (n._age >= 0 && d && d.sum && d.sum.key === "xp") return { amount: d.sum.amount, text: d.text, color: d.color, shown: true };
            const q = ($gameTemp._topNotices || []).find(x => x.sum && x.sum.key === "xp");
            return q ? { amount: q.sum.amount, text: q.text, color: q.color, shown: false } : null; })()`);
        await clear(); await frames(40);
        // (a watcher: where the goal's plate stands once it is fully shown - checked at the end)
        await ev(`(function(){ const n = SceneManager._scene._topNotice, up = n.update; window.__goalPlate = null;
            n.update = function() { up.call(this); const d = this._data;
                if (!window.__goalPlate && this._age > 20 && d && /^Cel wykonany/.test(d.text)) window.__goalPlate = { x: Math.round(this.x), y: Math.round(this.y), h: this.bitmap.height, W: Graphics.width, text: d.text, sub: d.sub }; }; })(); 0`);

        // ---- one item: slides in from the right edge, stops at the right, over the XP bar; nothing floats over the player
        await ev("$gameParty.gainItem($dataItems[61], 1); 0");   // Drewno
        await frames(3);
        const a = await F();
        check("an item gained: a plate '+1 Drewno' in the list at the bottom right, nothing over the player", a.plates.length === 1 && a.plates[0].text === "+1 Drewno" && a.floating.length === 0, a);
        check("...it comes in from beyond the right edge (partly off screen at first)", a.plates[0].x - a.plates[0].w > a.W - 14 - a.plates[0].w && a.plates[0].x > a.W - 14, a.plates[0]);
        await frames(30);
        const a2 = await F();
        const wood = a2.plates.find(p => p.text === "+1 Drewno"), low2 = a2.plates.reduce((m, p) => (p.y > m.y ? p : m));
        check("...and stops at the right edge; the lowest plate just over the XP bar", wood.x === a2.W - 14 && wood.op === 255 && low2.y <= a2.barTop && a2.barTop - low2.y < 20, { plates: a2.plates.map(p => p.text + " @" + p.x + "," + p.y), barTop: a2.barTop });
        // (the first wood is new and finishes the goal 'Zdobądź drewno': experience comes into the list, the goal is said at the top)
        // (the goal's plate and the new item's experience come one after the other at the top centre, in either order)
        const GOAL = () => J(`(function(){ const n = SceneManager._scene._topNotice, d = n._data, shown = n._age >= 0 && d && /^Cel wykonany: /.test(d.text);
            const q = ($gameTemp._topNotices || []).find(x => /^Cel wykonany: /.test(x.text)), g = shown ? d : q;
            return { text: g ? g.text : null, sub: g ? g.sub : null, shown: !!shown, floating: SceneManager._scene._lootLayer.children.map(p => p._data.text) }; })()`);
        const goal = await GOAL();
        check("the first wood finishes a journal goal: 'Cel wykonany: ...' for the top centre, not over the player", /^Cel wykonany: /.test(goal.text || "") && !goal.floating.some(t => /Cel wykonany/.test(t)), goal);
        check("...with the goal's experience on it, a second line: '+50 dośw.'", goal.sub === "+" + (await ev("Combat.XP.goal")) + " dośw.", goal);
        await frames(30);
        const noGoalPlate = await J("SceneManager._scene._gainFeed.children.map(p => p.text())");
        const xpWaits = await XPN();
        check("...no experience in the list at the bottom right; the new item's '+5 dośw.' waits for its turn at the top centre", !noGoalPlate.some(t => /dośw\./.test(t)) && xpWaits && xpWaits.amount === 5 && /nowe: Drewno/.test(xpWaits.text), { list: noGoalPlate, xp: xpWaits });
        await b.shot("gain_goal.png");

        // ---- a second one comes in under it, the first moves up
        await ev("$gameParty.gainItem($dataItems[64], 2); 0");   // Kamień
        await frames(40);
        const c = await F();
        const byText = t => c.plates.find(p => p.text === t);
        // (the list is in order of coming: each newer plate one row lower, the newest just over the XP bar)
        const ys = c.plates.map(p => p.y), rowsOk = ys.every((y, i) => i === 0 || y - ys[i - 1] === 42);
        check("another item: '+2 Kamień' comes in under '+1 Drewno', which moved up; each newer plate one row lower, the newest just over the bar",
            byText("+2 Kamień").y > byText("+1 Drewno").y && byText("+1 Drewno").y < wood.y && rowsOk && ys[ys.length - 1] === low2.y, c.plates.map(p => p.text + " @" + p.y));
        await b.shot("gain_feed.png");

        // ---- the same item again: adds up on its plate
        const nItems = c.plates.filter(p => !/dośw\./.test(p.text)).length;
        await ev("$gameParty.gainItem($dataItems[61], 2); 0");
        await frames(10);
        const d = await F();
        check("Drewno again while it is shown: the same plate says '+3 Drewno' (no new plate for it)", d.plates.filter(p => !/dośw\./.test(p.text)).length === nItems && d.plates.some(p => p.text === "+3 Drewno"), d.plates.map(p => p.text));

        // ---- experience: at the top centre, adding up on one plate while it is up
        const x0 = await XPN();
        await ev("Combat.gainXp(7, 'test'); 0");
        await frames(40);
        const e = await F(), x1 = await XPN();
        check("experience gained: added to the plate at the top centre (+7), in its colour; not in the list, not over the player",
            x1 && x1.amount === (x0 ? x0.amount : 0) + 7 && x1.color === "#c9a6ff" && !e.plates.some(p => /dośw\./.test(p.text)) && !e.floating.some(t => /dośw\./.test(t)), { before: x0, after: x1 });
        for (let i = 0; i < 80 && !((await XPN()) || {}).shown; i++) await frames(10);   // (its turn comes after the goal)
        const x2 = await XPN();
        await ev("Combat.gainXp(4, 'test'); 0");
        await frames(40);
        const x3 = await XPN();
        check("...on screen it keeps adding up: +4 more on the same plate, no reason once it is a sum", x2 && x2.shown && x3 && x3.shown && x3.amount === x2.amount + 4 && x3.text === "+" + x3.amount + " dośw.", { x2, x3 });
        const top = await J(`(function(){ const n = SceneManager._scene._topNotice; return { x: Math.round(n.x), y: Math.round(n.y), W: Graphics.width }; })()`);
        check("...at the top centre", top.x === top.W / 2 && top.y < 80, top);
        await b.shot("gain_xp_top.png");

        // ---- what is missing: still over the player
        await ev("$gameTemp.pushLootPopup(0, 'Potrzebujesz siekiery', '#ff9f8f'); 0");
        await frames(5);
        const m = await F();
        check("a 'missing' popup still floats over the player (not in the list)", m.floating.includes("Potrzebujesz siekiery") && !m.plates.some(p => p.text === "Potrzebujesz siekiery"), m.floating);

        // ---- too many at once: at most 7 shown, the oldest go
        await clear(); await frames(40);
        await ev("[61, 64, 77, 78, 80, 84, 85, 86, 92, 93].forEach(id => $gameParty.gainItem($dataItems[id], 1)); 0");
        await frames(40);
        const many = await F();
        check("ten things at once: at most 7 plates stay, the oldest fade out", many.plates.filter(p => !p.fading && p.op > 0).length <= 7 && many.plates.length >= 7, many.plates.map(p => p.text + (p.fading ? " (znika)" : "")));

        // ---- they go by themselves
        await frames(340);
        check("after a few seconds the plates are gone", (await F()).plates.length === 0);
        const gp = await J("window.__goalPlate");
        check("the goal's plate was shown at the top centre of the screen, two lines high (the goal, its experience)", !!gp && gp.x === gp.W / 2 && gp.y < 80 && gp.h > 40 && /^\+\d+ dośw\.$/.test(gp.sub), gp);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
