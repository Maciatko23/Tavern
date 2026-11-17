// Zejście do studni na rynku Kruczogrodu (Map220, „Studnia miejska: zejście” 48,42) po linie (2026-11-17, gracz: „zmień na linę”):
// bez liny i z samymi sznurkami - popup „Potrzebujesz liny…”, z 1× Lina (492) - pytanie „Zejść / Zostać” i dno studni (Map118),
// lina zostaje w torbie; na dnie „Wspiąć się po linie na górę?” wraca na rynek.
// Zrzut: docs/miejsca_zadan/zejscie_po_linie.png
// Uruchom: node tests/run.js studnia_lina --port 9498
const path = require("path");
const kit = require("./lib/kit.js");
const LINA = 492, SZNUREK = 93;
const byName = n => `$gameMap.events().find(e => e.event().name === ${JSON.stringify(n)})`;

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const pick = async label => {
        const up = await t.until("!!(SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active && $gameMessage.isChoice())", 15);
        if (!up) return "no choice";
        return t.json(`(function(){ const cw = SceneManager._scene._choiceListWindow, labels = $gameMessage.choices();
            const i = labels.findIndex(l => l.indexOf(${JSON.stringify(label)}) === 0); if (i < 0) return labels;
            cw.select(i); cw.deactivate(); cw.callOkHandler(); return labels; })()`);
    };
    await t.newGame({ map: 220, x: 49, y: 42, dir: 4, day: 3, hour: 11, quiet: true, minimap: false });
    const d = await t.json(`(function(){ const d = ${byName("Studnia miejska: zejście")}; return d && [d.eventId(), d.x, d.y]; })()`);
    t.check("na rynku jest „Studnia miejska: zejście” (266 na 48,42)", d && d[0] === 266 && d[1] === 48 && d[2] === 42, d);
    await t.eval(`$gameParty.loseItem($dataItems[${LINA}], 999); $gameParty.loseItem($dataItems[${SZNUREK}], 999); 0`);
    const refuse = async () => {
        await t.popups({ clear: true });
        await t.locate(49, 42, 4);
        await t.frames(5);
        await t.press("ok");
        await t.frames(40);
        return { pops: await t.popups({ clear: true }), map: await t.json("$gameMap.mapId()"), msg: await t.json("$gameMessage.isBusy()") };
    };
    const r0 = await refuse();
    t.check("bez liny: popup „Potrzebujesz liny, żeby zejść do studni.”, bez rozmowy, dalej na rynku",
        r0.pops.some(p => /Potrzebujesz liny, żeby zejść do studni/.test(p)) && r0.map === 220 && !r0.msg, r0);
    await t.give(SZNUREK, 9);
    const r1 = await refuse();
    t.check("z 9 sznurkami (bez liny) tak samo", r1.pops.some(p => /Potrzebujesz liny/.test(p)) && r1.map === 220 && !r1.msg, r1);
    await t.give(LINA, 1);
    await t.frames(240);
    await t.locate(49, 42, 4);
    await t.frames(5);
    await t.press("ok");
    await t.until("!!(SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active)", 15);
    const ask = await t.json("$gameMessage._texts.join(' ')");
    await t.frames(30);
    await t.shot(path.join(__dirname, "..", "docs", "miejsca_zadan", "zejscie_po_linie.png"));
    const q = await pick("Zejść");
    const down = await t.until(t.onMap(118), 20);
    await t.frames(30);
    const bottom = await t.json(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, lina: $gameParty.numItems($dataItems[${LINA}]) })`);
    t.check("z 1× Lina: „Zejść na dno studni po linie?” (Zejść / Zostać), potem dno studni (Map118, 7,6), lina zostaje w torbie",
        /po linie/.test(ask) && Array.isArray(q) && q[0] === "Zejść" && down && bottom.map === 118 && bottom.x === 7 && bottom.y === 6 && bottom.lina === 1, { ask, q, bottom });
    await t.calm();
    await t.locate(7, 6, 8);
    await t.frames(5);
    await t.press("ok");
    await t.until("$gameMessage.isChoice()", 15);
    const ask2 = await t.json("$gameMessage._texts.join(' ')");
    const q2 = await pick("Wspiąć się");
    const up = await t.until(t.onMap(220), 20);
    await t.frames(20);
    const top = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    t.check("na dnie: „Wspiąć się po linie na górę?” - z powrotem na rynku przy studni", /po linie/.test(ask2) && Array.isArray(q2) && up && top.map === 220, { ask2, q2, top });
});
