// Ikony z PixelLab w grze (2026-11-17): plecak pełen rzeczy, ekwipunek. Zrzuty: docs/ekwipunek/ikony/gra_*.png
// Uruchom: node tests/run.js ikony_shot --port 9486
const kit = require("./lib/kit.js");
const path = require("path");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const OUT = path.join(__dirname, "..", "docs", "ekwipunek", "ikony");
    await t.newGame({ map: 220, x: 33, y: 36, dir: 2, hour: 10, quiet: true, minimap: false });
    const setup = await t.json(`(function(){ ConfigManager.uiClean = true; ConfigManager.bagSort = "groups";
        const give = [7, 8, 61, 64, 77, 88, 92, 102, 103, 115, 116, 119, 120, 142, 144, 164, 130, 133, 139, 129, 138, 121, 143, 485, 486, 487, 488, 489, 490, 491,
            302, 308, 311, 323, 346, 353, 355, 362, 368, 378, 406, 407, 419, 420, 425, 431, 432, 441, 444, 450, 455, 466, 471, 480];
        for (const id of give) if ($dataItems[id] && $dataItems[id].name) $gameParty.gainItem($dataItems[id], 2);
        Equipment.equip('head', 346); Equipment.equip('torso', 353);
        const icons = give.map(id => $dataItems[id] ? $dataItems[id].iconIndex : 0);
        return { n: give.length, icons, min: Math.min(...icons), max: Math.max(...icons) }; })()`);
    t.check("rzeczy w plecaku mają nowe ikony (komórki 688-1107)", setup.min >= 688 && setup.max <= 1107, setup);
    const sheet = await t.json(`new Promise(res => { const b = ImageManager.loadSystem("IconSet"); const chk = () => { if (!b.isReady()) return setTimeout(chk, 50); res({ h: b.height }); }; chk(); })`);
    t.check("IconSet w grze ma 2240 px wysokości (nowe rzędy)", sheet.h === 2240, sheet);
    await t.frames(30);
    const info = () => t.json("MenuRing.info()");
    const key = async (k, n) => { await t.key(k); await t.frames(n || 6); return info(); };
    await t.key("P");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.frames(40);
    let m = await info();
    for (let i = 0; i < 10 && m.active !== "equip"; i++) m = await key("D", 12);
    await t.frames(20);
    await t.shot(path.join(OUT, "gra_ekwipunek.png"));
    for (let i = 0; i < 10 && m.active !== "item"; i++) m = await key("D", 12);
    m = await key("O", 12);
    await t.frames(20);
    await t.shot(path.join(OUT, "gra_plecak.png"));
    for (let i = 0; i < 8; i++) await key("S", 3);
    await t.frames(10);
    await t.shot(path.join(OUT, "gra_plecak_2.png"));
    t.check("plecak otwarty", m.active === "item", m.active);
});
