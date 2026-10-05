// The market well gives water, but little (user 2026-10-05: "Główna studnia na środku daje wodę" -> "studnia daje, ale mało"):
// the two "Studnia miejska" events on Map008 (<Studnia:2>, page: Farming.rationWell(this)) open the water menu; each draw (a
// drink, the skin, the can, the bucket) takes one of the day's two; the third is refused; the next day there are two again.
const kit = require("./lib/kit.js");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    await t.newGame({ map: 8, x: 24, y: 36, dir: 8, day: 3, hour: 9, quiet: true, minimap: false });
    const evs = await t.json(`$gameMap.events().filter(e => e.event().name === "Studnia miejska").map(e => [e.eventId(), e.x, e.y, e.event().note])`);
    t.check("the market well (24-25,32-35) has its two 'Studnia miejska' events with <Studnia:2> on its bottom row", evs.length === 2 && evs.every(e => e[2] === 35 && /<Studnia:2>/.test(e[3])), evs);
    const thirsty = `(function(){ $gameSystem.changeStamina(-60); const N = Tawerna.api("Needs"); if (N && N.state) N.state().water = 40; return 0; })()`;
    const menu = () => t.json(`(function(){ const m = SceneManager._scene._farmMenu; return m && m.visible !== false && m._entries ? { title: SceneManager._scene._farmTitle && SceneManager._scene._farmTitle._text || m._title || "",
        names: m._entries.map(e => e.name + (e.enabled === false ? "(x)" : "")), open: !!(m.active || m.isOpen && m.isOpen()) } : null; })()`);
    const draw = async () => {
        await t.eval(thirsty);
        await t.locate(24, 36, 8);
        await t.frames(5);
        await t.press("ok");
        await t.frames(20);
        const m = await menu();
        const ran = await t.json(`(function(){ const m = SceneManager._scene._farmMenu; if (!m || !m._entries) return "no menu";
            const e = m._entries.find(e => e.name === "Napij się"); if (!e) return "no drink"; if (e.enabled === false) return "disabled"; return String(e.run()); })()`);
        await t.frames(60);
        await t.press("cancel");
        await t.frames(20);
        return { m, ran, left: await t.json(`Farming.rationLeft(Farming.rationOf($gameMap.event(${evs[0][0]})))`) };
    };
    const a = await draw();
    t.check("facing the well and pressing OK opens its water menu (drink, skin, can, bucket) with the day's draws", !!a.m && a.m.names.some(n => /^Napij się/.test(n)) && a.m.names.length >= 4, a);
    t.check("...a drink takes one of the two (1 left)", a.ran === "true" && a.left === 1, a);
    const b = await draw();
    t.check("...a second drink takes the last one (0 left)", b.ran === "true" && b.left === 0, b);
    await t.eval("window.__pops = []; 0");
    await t.eval(thirsty);
    await t.locate(24, 36, 8);
    await t.frames(5);
    await t.press("ok");
    await t.frames(20);
    const c = { menu: await menu(), pops: await t.popups({ clear: true }) };
    t.check("...a third time: no menu, a popup says the day's ration is over", !(c.menu && c.menu.open) && c.pops.some(p => /koniec przydziału/i.test(p)), c);
    // the next day: two again
    await t.eval(`(function(){ const f = $gameSystem._farm; Object.values(f.rations || {}).forEach(r => r.day -= 1); return 0; })()`);
    const next = await t.json(`Farming.rationLeft(Farming.rationOf($gameMap.event(${evs[0][0]})))`);
    t.check("the next day the well gives two draws again", next === 2, next);
});
