// Zdjecia dla docs/zadania_nowe/dawcy_w_miescie/: sala tawerny wieczorem z gośćmi z zewnątrz, tablica zleceń z nowymi ogłoszeniami.
// GAME_OVERLAY=tools/dawcy_miasto/staging_testy GAME_OVERLAY_JS=1 CDP_PORT=9919 node tools/dawcy_miasto/zdjecia.js
const path = require("path");
const kit = require(path.join(__dirname, "..", "..", "tests", "lib", "kit.js"));
const OUT = path.join(__dirname, "..", "..", "docs", "zadania_nowe", "dawcy_w_miescie");
const shot = (t, n) => t.shot(path.join(OUT, n + ".png"));
kit.test({ port: 9919, bootCheck: "gra", errorCheck: false, evalTimeout: 120000, overlay: process.env.GAME_OVERLAY, overlayJs: process.env.GAME_OVERLAY_JS === "1" }, async t => {
    const at = async (hour, x, y, dir) => {
        await t.newGame({ map: 8, x: 50, y: 40, day: 40, hour, quiet: true, minimap: false, settle: 10 });
        await t.eval("window.__kit = window.__kit; Tawerna.api('Needs') && Needs.setEnabled && Needs.setEnabled(false); 0").catch(() => 0);
        for (let i = 0; i < 4 && !(await t.eval("$gameMap.mapId() === 1")); i++) { await t.go(1, x, y, dir); await t.frames(30); }
        await t.go(1, x, y, dir);
        await t.frames(150);
    };
    // 1. the entrance hall: the board's corner (Marta, Franek, Jadwiga) and the hearth (Józek, Zbych, Darin, Rysiek)
    await at(19.2, 14, 50, 8);
    await shot(t, "1a_sien_19_10_Marta_Franek_Jadwiga_Jozek_Zbych_Darin");
    await at(20.2, 14, 50, 8);
    await shot(t, "1b_sien_20_10_Jadwiga_Jozek_Zbych_Darin_Rysiek");
    // 2. the front of the bar: Kłos (17-19:30) early in the evening, Sambor Kwit (19:30-21:30) later
    await at(18.4, 14, 33, 8);
    await shot(t, "2a_lada_18_25_Klos");
    await at(20.4, 14, 33, 8);
    await shot(t, "2b_lada_20_25_Sambor");
    // 3. afternoon at the bar: Bazyli the lighthouse keeper
    await at(16, 14, 33, 8);
    await shot(t, "3_lada_popoludnie_Bazyli");
    // 4. Janek seated at the table (the right-hand tables)
    await at(20.5, 25, 37, 8);
    await t.eval("TownQuests.state().flags.janekMet = 1; 0");
    await t.frames(60);
    await shot(t, "4_Janek_siedzi_przy_stole_za_nim_stoly_gosci");
    // 5. the notice board with the new jobs of the outside
    await at(20.2, 7, 51, 8);
    await t.eval(`(function(){ const d = QuestBoard.state(); d.rep = 45; d.tutorial = true; QuestBoard.refresh(4242);
        for (const [id, tier] of [["tran_bazyli", 2], ["herring_janek", 1], ["wood_klos", 2], ["wool_wawrzyn", 2], ["kiln_zbych", 2]]) QuestBoard.post(id, tier, 9000 + id.length);
        return 0; })()`);
    await t.eval("QuestBoard.open(); 0");
    await t.until("(SceneManager._scene instanceof Scene_QuestBoard && SceneManager._scene._started && !SceneManager.isSceneChanging() && !SceneManager._scene.isBusy())", 15);
    await t.frames(90);
    await shot(t, "5_tablica_zlecen_nowe_ogloszenia");
    const list = await t.json("QuestBoard.board().map(n => n.giver + ': ' + n.title)");
    console.log(JSON.stringify(list));
});
