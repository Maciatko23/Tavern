// Zejście do studni na rynku Kruczogrodu po linie (2026-11-17, gracz: „zmień na linę”); od 2026-11-18 (gracz: „sprawdź, czy są
// niewidzialne blokady”) zejście nie stoi już niewidzialnym zdarzeniem na placu przed studnią - leży pod samą studnią (48,41, pod
// postaciami, przechodnie), a uruchamia je menu studni: „Zejdź na dno studni”. Bez liny i z samymi sznurkami - popup „Potrzebujesz
// liny…”, z 1× Lina (492) - pytanie „Zejść / Zostać” i dno studni (Map118), lina zostaje w torbie; na dnie „Wspiąć się po linie na
// górę?” wraca na rynek. Pole przed studnią (48,42) jest wolne.
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
    // the well's menu: O facing the well from the square, then its entry "Zejdź na dno studni" (W / S to it, O)
    const wellMenuDown = async () => {
        await t.locate(48, 42, 8);
        await t.frames(5);
        await t.press("ok");
        await t.until("!!(SceneManager._scene._farmMenu && SceneManager._scene._farmMenu.active)", 10);
        await t.frames(6);
        const names = await t.json("(function(){ const m = SceneManager._scene._farmMenu; return m && m._list ? m._list.map(e => e.name) : []; })()");
        const i = names.indexOf("Zejdź na dno studni");
        if (i >= 0) {
            const at = await t.json("SceneManager._scene._farmMenu.index()");
            for (let k = at; k < i; k++) { await t.press("down"); await t.frames(4); }
            await t.press("ok");
        }
        return names;
    };
    await t.newGame({ map: 220, x: 48, y: 43, dir: 8, day: 3, hour: 11, quiet: true, minimap: false });
    const d = await t.json(`(function(){ const d = ${byName("Studnia miejska: zejście")}; return d && [d.eventId(), d.x, d.y, d.isThrough(), d.isNormalPriority()]; })()`);
    t.check("„Studnia miejska: zejście” (266) leży pod studnią (48,41): przechodnie, pod postaciami - nie blokuje placu", d && d[0] === 266 && d[1] === 48 && d[2] === 41 && d[3] === true && d[4] === false, d);
    const free = await t.json("$gameMap.isPassable(48, 42, 8) && $gameMap.eventsXyNt(48, 42).filter(e => e.isNormalPriority()).length === 0");
    t.check("pole przed studnią (48,42) wolne - da się na nim stanąć", free === true, free);
    await t.eval(`$gameParty.loseItem($dataItems[${LINA}], 999); $gameParty.loseItem($dataItems[${SZNUREK}], 999); 0`);
    const refuse = async () => {
        await t.popups({ clear: true });
        const names = await wellMenuDown();
        await t.frames(40);
        return { names, pops: await t.popups({ clear: true }), map: await t.json("$gameMap.mapId()"), msg: await t.json("$gameMessage.isBusy()") };
    };
    const r0 = await refuse();
    t.check("menu studni ma „Zejdź na dno studni” (obok picia i bukłaka)", r0.names.includes("Zejdź na dno studni") && r0.names.includes("Napij się"), r0.names);
    t.check("bez liny: popup „Potrzebujesz liny, żeby zejść do studni.”, bez rozmowy, dalej na rynku",
        r0.pops.some(p => /Potrzebujesz liny, żeby zejść do studni/.test(p)) && r0.map === 220 && !r0.msg, r0);
    await t.give(SZNUREK, 9);
    const r1 = await refuse();
    t.check("z 9 sznurkami (bez liny) tak samo", r1.pops.some(p => /Potrzebujesz liny/.test(p)) && r1.map === 220 && !r1.msg, r1);
    await t.give(LINA, 1);
    await t.frames(240);
    await wellMenuDown();
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
