// Speech bubbles (SpeechBubbles.js): messages on the map come in a bubble over whoever speaks, with a tail to them; choices beside
// it; \SPK[n] picks the speaker; short cries (the storm) float over the hero and go by themselves.
// (Characters with a bust - Borgar, Grum - talk out of their busts in the corners: tests/talk_busts_test.js; here Borgar's page gets
// <Bust:none> for the bubble over the head.)
const kit = require("./lib/kit.js");
const { text: T, end: END } = kit.cmd;

kit.test({}, async t => {
    // (the new tavern: in front of the bar, Borgar across the counter)
    await t.newGame({ map: 1, x: 50, y: 64, dir: 4, hour: 12 });
    const win = () => t.json(`(function(){ const s = SceneManager._scene, m = s._messageWindow, bs = m._bubbleSprite, who = m._bubbleOf, head = who ? SpeechBubbles.headOf(who) : null;
        return { open: m.isOpen(), who: who === $gamePlayer ? "player" : who ? "event " + who.eventId() : null, x: m.x, y: m.y, w: m.width, h: m.height, bubble: !!(bs && bs.visible), edge: m._bubbleEdge,
            head: head && { x: Math.round(head.x), top: Math.round(head.top), foot: Math.round(head.foot) }, opacity: m.opacity, text: m._textState ? m._textState.text.slice(0, 30) : "",
            choice: s._choiceListWindow && s._choiceListWindow.isOpen() ? { x: s._choiceListWindow.x, y: s._choiceListWindow.y, w: s._choiceListWindow.width } : null }; })()`);
    const say = (face, lines) => t.run(T(face, lines).concat(END()));
    const untilChoice = async () => { for (let i = 0; i < 12 && !(await win()).choice; i++) { await t.press("ok"); await t.frames(20); } };
    await t.frames(300);   // (the popups of the start fade away)

    // ---- Borgar speaks (his face, his event): the bubble over him
    await t.eval("$gamePlayer.setDirection(8); $gameMap.event(1).start(); 0");
    await t.frames(40);
    let w = await win();
    t.check("talking to Borgar: the message is a bubble over him (event 1), the window itself invisible", w.open && w.who === "event 1" && w.bubble && w.opacity === 0, w);
    // (Borgar has a bust - People3_5 - so his words come out of it in his bottom corner, SpeechBubbles.NPC_SIDE - the hero's bust
    // takes HERO_SIDE: tests/talk_busts_test.js checks the talk; an older plugin without them: the other right)
    const NS = await t.eval("(window.SpeechBubbles && SpeechBubbles.NPC_SIDE) || 'right'");
    t.check(`...he has a bust: the bubble at the bottom ${NS}, beside it (a talk)`, w.edge === "talk-" + NS && (NS === "right" ? w.x + w.w <= 1272 - 250 : w.x >= 250) && w.y > 400, w);
    await untilChoice();
    w = await win();
    t.check("his question with choices: the choice list beside the bubble", !!w.choice && (w.choice.x >= w.x + w.w || w.choice.x + w.choice.w <= w.x), w);
    await t.press("escape"); await t.frames(10);
    await t.finish(20);
    // ---- the same without his bust (<Bust:none> on his page): the bubble over his head
    await t.eval(`$gameMap.event(1).page().list.unshift({ code: 108, indent: 0, parameters: ["<Bust:none>"] }); 0`);
    await t.eval("$gamePlayer.setDirection(8); $gameMap.event(1).start(); 0");
    await t.frames(40);
    w = await win();
    const beside = w => w.head && ({ bottom: w.y + w.h <= w.head.top, left: w.x >= w.head.x, right: w.x + w.w <= w.head.x, top: w.y >= w.head.foot })[w.edge];
    t.check("without a bust: the bubble is by his head (above it; with no room there beside him, the tail sideways - not over the hero below), on the screen", w.who === "event 1" && beside(w) && (w.edge === "bottom" || w.edge === "left" || w.edge === "right") && w.x >= 0 && w.x + w.w <= 1280 && w.w < 1000, w);
    await t.shot("bubble_borgar.png");
    await untilChoice();
    w = await win();
    t.check("...his question with choices: the choice list beside the bubble", !!w.choice && (w.choice.x >= w.x + w.w || w.choice.x + w.choice.w <= w.x) && Math.abs(w.choice.y - w.y) <= 2, w);
    await t.shot("bubble_choices.png");
    await t.press("escape"); await t.frames(10);
    await t.finish(20);
    await t.eval("$gameMap.event(1).page().list.shift(); 0");

    // ---- no face (a thought, a description): the hero's bubble
    await say(null, ["Hmm... trzeba się napić."]);
    await t.frames(30);
    w = await win();
    t.check("a message without a face: the hero's bubble, over his head", w.open && w.who === "player" && w.bubble, w);
    await t.shot("bubble_player.png");
    await t.finish(20);

    // ---- \SPK[n]: the speaker named in the text; \SPK[-1]: the old window at the bottom
    await say(null, ["\\SPK[3]Ja się nie boję."]);
    await t.frames(30);
    w = await win();
    t.check("\\SPK[3]: Grum (event 3) speaks, and the code is not shown", w.who === "event 3" && w.bubble && !/SPK/.test(w.text), w);
    await t.finish(20);
    await say(["People3", 4], ["\\SPK[-1]Zwykłe okno na dole."]);
    await t.frames(30);
    w = await win();
    t.check("\\SPK[-1]: the usual window at the bottom (its own size back), no bubble", w.open && !w.who && !w.bubble && w.w >= 800 && w.y > 400 && w.opacity > 0, w);
    await t.finish(20);
    await say(null, ["I znowu dymek."]);
    await t.frames(30);
    w = await win();
    t.check("...and the next message is a bubble again (sized to its text)", w.who === "player" && w.bubble && w.w < 600, w);
    await t.finish(20);

    // ---- a short cry: over the hero for a few seconds, the game goes on
    await t.eval(`SpeechBubbles.say($gamePlayer, "Idzie burza..."); 0`);
    await t.frames(20);
    const bark = await t.json(`(function(){ const L = SceneManager._scene._barks, s = L.children[0], head = SpeechBubbles.headOf($gamePlayer); return { n: L.children.length, visible: !!(s && s.visible), x: s && s.x, y: s && s.y, w: s && s._w, h: s && s._h, head: head && { x: Math.round(head.x), top: Math.round(head.top) }, busy: $gameMessage.isBusy(), move: $gamePlayer.canMove() }; })()`);
    t.check("SpeechBubbles.say: a small bubble over the hero's head; no message window, he can still walk", bark.visible && bark.y + bark.h <= bark.head.top && Math.abs(bark.x + bark.w / 2 - bark.head.x) <= 2 && !bark.busy && bark.move, bark);
    await t.shot("bubble_bark.png");
    await t.frames(260);
    t.check("...it goes by itself after a few seconds", (await t.eval("SceneManager._scene._barks.children.length")) === 0 && (await t.eval("SpeechBubbles.barks.length")) === 0);
});
