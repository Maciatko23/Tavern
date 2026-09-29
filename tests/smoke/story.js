// Smoke: the story's start (Story.js) - a new game in grandpa's house, his intro talk heard in bubbles to its end (the soup, the
// journal's chapter 1 and its note), the debt on the P menu's card, grandpa's field reached, the tavern and Borgar hiring the hero,
// a save in the middle of it all loaded back the same. (story_test.js has it all in full.)
const kit = require("../lib/kit.js");

kit.test({}, async t => {
    t.check("a new story game starts in grandpa's house (Map019 2,5)", await t.newGame({ story: true }) && JSON.stringify(await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]")) === "[19,2,5]");
    const s0 = await t.json("$gameSystem._story");
    t.check("the story: debt 2500 to be paid by day 60, nothing paid", s0 && s0.debt === 2500 && s0.deadline === 60 && s0.paid === 0 && !s0.pending, s0);

    // ---- grandpa's intro: it begins by itself, the driver presses O through his words
    await t.eval(kit.DRIVER + "; window.__drv.on = true; window.__drv.picks = []; window.__drv.mark = window.__drv.log.length; 0");
    const heard = await t.until("$gameSystem._story.intro === 2 && !$gameMap.isEventRunning() && !$gameMessage.isBusy()", 60);
    await t.eval("window.__drv.on = false; 0");
    const intro = await t.json("({ log: window.__drv.log.slice(window.__drv.mark), soup: $gameParty.numItems($dataItems[131]), note: !!$gameSystem._journal.notes.find(n => n.title === 'Dług dziadka Stacha') })");
    t.check("the intro: grandpa (event 901) and the hero talk in bubbles, about the debt and Borgar's tavern", heard && intro.log.length >= 6 && intro.log[0].who === 901 && intro.log.some(l => l.who === 0) &&
        /2500/.test(intro.log.map(l => l.t).join(" ")) && /Borgar/.test(intro.log.map(l => l.t).join(" ")), intro.log.map(l => l.who));
    t.check("...after it: a cabbage soup from grandpa and the journal's note about the debt", intro.soup === 1 && intro.note, intro);
    await t.eval("Journal.evaluateGoals(); 0");
    const jr = await t.json("({ chapter: Journal.CHAPTERS[(Journal.GOALS.find(g => g.story) || {}).ch], cur: Journal.currentGoal().id })");
    t.check("the journal: chapter 'Rozdział 1: Dług dziadka', the tracker says go to the field", jr.chapter === "Rozdział 1: Dług dziadka" && jr.cur === "story_field", jr);

    // ---- the P menu: the debt on the card
    await t.eval("SceneManager.push(Scene_Menu); 0");
    await t.until("SceneManager._scene instanceof Scene_Menu && SceneManager._scene._started && !SceneManager.isSceneChanging()", 15);
    await t.frames(10);
    const line = await t.eval("Story.lastMenuLine");
    t.check("the P menu's foot shows the debt (0 / 2500 G, day 60)", /^0 \/ 2500 G/.test(line) && /60/.test(line), line);
    await t.eval("SceneManager.pop(); 0");
    await t.until(t.onMap(19), 15);

    // ---- the field, the tavern, Borgar
    await t.go(3, 26, 14);
    t.check("grandpa's field (Map003, 'Pole dziadka') reached: the story's step done", await t.eval("!!$gameSystem._story.flags.field && $gameMap.displayName() === 'Pole dziadka'"));
    await t.go(1, 50, 82, 8);
    await t.setHour(10);
    const hire = await t.talkTo("Story.borgarEvent()", [], { secs: 40 });
    t.check("Borgar hires the hero (the tavern, 10:00)", hire.done && (await t.eval("!!$gameSystem._story.flags.hired")), hire.text.slice(0, 160));

    // ---- a save now, loaded back
    const before = await t.json("({ s: $gameSystem._story, gold: $gameParty.gold(), map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    await t.saveTo(1);
    const up = await t.loadFrom(1, { calm: true, needsOff: true });
    const after = await t.json("({ s: $gameSystem._story, gold: $gameParty.gold(), map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    t.check("saved in the tavern and loaded: the story's state, the purse and the place are the same", up && JSON.stringify(before) === JSON.stringify(after), { before: before.s.flags, after: after.s.flags });
});
