// Speech bubbles (SpeechBubbles.js): messages on the map come in a bubble over whoever speaks, with a tail to them; choices beside
// it; \SPK[n] picks the speaker; short cries (the storm) float over the hero and go by themselves.
// (Characters with a bust - Borgar, Grum - talk out of their busts in the corners: tests/talk_busts_test.js; here Borgar's page gets
// <Bust:none> for the bubble over the head.)
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(1, 50, 64, 4, 0);   /* (the new tavern: in front of the bar, Borgar across the counter) */ SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===1").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(12); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(3); await ev(`Input._currentState.${k} = false; 0`); await frames(3); };
        const win = () => J(`(function(){ const s = SceneManager._scene, m = s._messageWindow, bs = m._bubbleSprite, who = m._bubbleOf, head = who ? SpeechBubbles.headOf(who) : null;
            return { open: m.isOpen(), who: who === $gamePlayer ? "player" : who ? "event " + who.eventId() : null, x: m.x, y: m.y, w: m.width, h: m.height, bubble: !!(bs && bs.visible), edge: m._bubbleEdge,
                head: head && { x: Math.round(head.x), top: Math.round(head.top), foot: Math.round(head.foot) }, opacity: m.opacity, text: m._textState ? m._textState.text.slice(0, 30) : "",
                choice: s._choiceListWindow && s._choiceListWindow.isOpen() ? { x: s._choiceListWindow.x, y: s._choiceListWindow.y, w: s._choiceListWindow.width } : null }; })()`);
        const run = list => ev(`(function(){ $gameMap._interpreter.setup(${JSON.stringify(list)}, 0); })(); 0`);
        const T = (face, lines, extra) => [{ code: 101, indent: 0, parameters: [face ? face[0] : "", face ? face[1] : 0, 0, 2, ""] }].concat(lines.map(t => ({ code: 401, indent: 0, parameters: [t] }))).concat(extra || []).concat([{ code: 0, indent: 0, parameters: [] }]);
        const finish = async () => { for (let i = 0; i < 20 && (await ev("$gameMessage.isBusy() || $gameMap.isEventRunning() || SceneManager._scene._messageWindow.openness > 0")); i++) { await press("ok"); await frames(12); } };
        await frames(300);   // (the popups of the start fade away)

        // ---- Borgar speaks (his face, his event): the bubble over him
        await ev("$gamePlayer.setDirection(8); $gameMap.event(1).start(); 0");
        await frames(40);
        let w = await win();
        check("talking to Borgar: the message is a bubble over him (event 1), the window itself invisible", w.open && w.who === "event 1" && w.bubble && w.opacity === 0, w);
        // (Borgar has a bust - People3_5 - so his words come out of it at the bottom right: tests/talk_busts_test.js checks the talk)
        check("...he has a bust: the bubble at the bottom right, beside it (a talk)", w.edge === "talk-right" && w.x + w.w <= 1272 - 250 && w.y > 400, w);
        for (let i = 0; i < 12 && !(await win()).choice; i++) { await press("ok"); await frames(20); }
        w = await win();
        check("his question with choices: the choice list beside the bubble", !!w.choice && (w.choice.x >= w.x + w.w || w.choice.x + w.choice.w <= w.x), w);
        await press("escape"); await frames(10);
        await finish();
        // ---- the same without his bust (<Bust:none> on his page): the bubble over his head
        await ev(`$gameMap.event(1).page().list.unshift({ code: 108, indent: 0, parameters: ["<Bust:none>"] }); 0`);
        await ev("$gamePlayer.setDirection(8); $gameMap.event(1).start(); 0");
        await frames(40);
        w = await win();
        const beside = w => w.head && ({ bottom: w.y + w.h <= w.head.top, left: w.x >= w.head.x, right: w.x + w.w <= w.head.x, top: w.y >= w.head.foot })[w.edge];
        check("without a bust: the bubble is by his head (above it; with no room there beside him, the tail sideways - not over the hero below), on the screen", w.who === "event 1" && beside(w) && (w.edge === "bottom" || w.edge === "left" || w.edge === "right") && w.x >= 0 && w.x + w.w <= 1280 && w.w < 1000, w);
        await b.shot("bubble_borgar.png");
        for (let i = 0; i < 12 && !(await win()).choice; i++) { await press("ok"); await frames(20); }
        w = await win();
        check("...his question with choices: the choice list beside the bubble", !!w.choice && (w.choice.x >= w.x + w.w || w.choice.x + w.choice.w <= w.x) && Math.abs(w.choice.y - w.y) <= 2, w);
        await b.shot("bubble_choices.png");
        await press("escape"); await frames(10);
        await finish();
        await ev("$gameMap.event(1).page().list.shift(); 0");

        // ---- no face (a thought, a description): the hero's bubble
        await run(T(null, ["Hmm... trzeba się napić."]));
        await frames(30);
        w = await win();
        check("a message without a face: the hero's bubble, over his head", w.open && w.who === "player" && w.bubble, w);
        await b.shot("bubble_player.png");
        await finish();

        // ---- \SPK[n]: the speaker named in the text; \SPK[-1]: the old window at the bottom
        await run(T(null, ["\\SPK[3]Ja się nie boję."]));
        await frames(30);
        w = await win();
        check("\\SPK[3]: Grum (event 3) speaks, and the code is not shown", w.who === "event 3" && w.bubble && !/SPK/.test(w.text), w);
        await finish();
        await run(T(["People3", 4], ["\\SPK[-1]Zwykłe okno na dole."]));
        await frames(30);
        w = await win();
        check("\\SPK[-1]: the usual window at the bottom (its own size back), no bubble", w.open && !w.who && !w.bubble && w.w >= 800 && w.y > 400 && w.opacity > 0, w);
        await finish();
        await run(T(null, ["I znowu dymek."]));
        await frames(30);
        w = await win();
        check("...and the next message is a bubble again (sized to its text)", w.who === "player" && w.bubble && w.w < 600, w);
        await finish();

        // ---- a short cry: over the hero for a few seconds, the game goes on
        await ev(`SpeechBubbles.say($gamePlayer, "Idzie burza..."); 0`);
        await frames(20);
        const bark = await J(`(function(){ const L = SceneManager._scene._barks, s = L.children[0], head = SpeechBubbles.headOf($gamePlayer); return { n: L.children.length, visible: !!(s && s.visible), x: s && s.x, y: s && s.y, w: s && s._w, h: s && s._h, head: head && { x: Math.round(head.x), top: Math.round(head.top) }, busy: $gameMessage.isBusy(), move: $gamePlayer.canMove() }; })()`);
        check("SpeechBubbles.say: a small bubble over the hero's head; no message window, he can still walk", bark.visible && bark.y + bark.h <= bark.head.top && Math.abs(bark.x + bark.w / 2 - bark.head.x) <= 2 && !bark.busy && bark.move, bark);
        await b.shot("bubble_bark.png");
        await frames(260);
        check("...it goes by itself after a few seconds", (await ev("SceneManager._scene._barks.children.length")) === 0 && (await ev("SpeechBubbles.barks.length")) === 0);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
