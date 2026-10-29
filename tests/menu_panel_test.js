// MenuPanel.js since 2026-10-28 (one look, docs/UI_JEDEN_WYGLAD.md): the old panel menu (its card, bag, journal, options, save and
// end-of-game screens in a panel in the middle) is gone - the P menu and its screens are MenuRing.js's. What is left and checked here:
// another plugin's command (MenuPanel.addCommand) as its own tab in the P menu - shown only when its when() says so, O calls its ok;
// addFoot still takes Story's entry; no touch buttons on the menu screens nor on the map; the title's "Opcje" in the same look (no
// panel of MenuPanel); the bag's card window (Window_ItemDetail: the description and the note after use); the bag's list "all" (the
// things and the tools); the keepsakes; the files' time stamp.
"use strict";
const kit = require("./lib/kit.js");

kit.test({ port: 9473, errorCheck: "bez błędów w konsoli" }, async t => {
    t.check("nowa gra na Kruczym Jarze (Map003)", await t.newGame({ map: 3, x: 22, y: 14, hour: 11, quiet: true }));
    await t.eval("window.dispatchEvent(new Event('pointerdown')); 0");   // (Fullscreen.js's one-shot request used up: Esc not eaten)
    const inMenu = "SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging() && !!MenuRing.info()";
    const api = await t.json(`(function(){ const M = window.MenuPanel; return { keys: Object.keys(M).sort(), panel: !!M.Sprite_MenuPanel, feet: M.feet() }; })()`);
    t.check("MenuPanel: tylko części wspólne (bez panelu menu), Story wpisał swoją stopkę (addFoot)", !api.panel && ["addCommand", "addFoot", "Window_ItemDetail", "isKeepsake", "questNeeds", "stampText"].every(k => api.keys.includes(k))
        && api.feet.includes("Story"), api);

    // ---------------------------------------------------------------- another plugin's command: its own tab, when() and ok()
    await t.eval(`(function(){ window.__cmdOn = false; window.__cmdOk = 0;
        MenuPanel.addCommand({ symbol: "proba", label: "Próba", owner: "menu_panel_test", when: () => window.__cmdOn, ok: () => { window.__cmdOk++; } }); return 0; })()`);
    await t.key("P");
    t.check("P otwiera menu (MenuRing)", await t.until(inMenu, 10));
    await t.frames(30);
    let m = await t.json("MenuRing.info()");
    t.check("polecenie z when() = false: nie ma jego zakładki; bez panelu MenuPanel", !m.tabs.includes("proba") && !(await t.eval("!!SceneManager._scene._menuPanel")), m.tabs);
    await t.key("Escape");
    await t.until(t.onMap(3), 10);
    await t.frames(10);
    await t.eval("window.__cmdOn = true; 0");
    await t.key("P");
    await t.until(inMenu, 10);
    await t.frames(30);
    m = await t.json("MenuRing.info()");
    t.check("when() = true: zakładka „Próba” za zakładkami menu", m.tabs[m.tabs.length - 1] === "proba" && m.labels[m.labels.length - 1] === "Próba", { tabs: m.tabs, labels: m.labels });
    for (let i = 0; i < 12 && m.active !== "proba"; i++) { await t.key("A"); await t.frames(10); m = await t.json("MenuRing.info()"); }
    await t.key("O");
    await t.frames(10);
    t.check("O na niej woła ok(scena) polecenia", (await t.eval("window.__cmdOk")) === 1, await t.eval("window.__cmdOk"));
    await t.eval("SceneManager.goto(Scene_Map); 0");
    await t.until(t.onMap(3), 10);
    await t.frames(10);

    // ---------------------------------------------------------------- no touch buttons
    const btn = await t.json(`({ cancel: Scene_MenuBase.prototype.needsCancelButton(), pages: [Scene_MenuBase, Scene_Options, Scene_Skill, Scene_Equip, Scene_Status].map(S => S.prototype.needsPageButtons()),
        mapButton: !!SceneManager._scene._menuButton })`);
    t.check("bez przycisków dotykowych: ani strzałki powrotu i stron w menu, ani przycisku menu na mapie", btn.cancel === false && btn.pages.every(p => p === false) && !btn.mapButton, btn);

    // ---------------------------------------------------------------- the bag's card window, the list "all", the keepsakes
    const bag = await t.json(`(function(){ $gameParty.gainItem($dataItems[102], 2); $gameParty.gainItem($dataItems[60], 1); if ($dataWeapons[1]) $gameParty.gainItem($dataWeapons[1], 1);
        const w = new MenuPanel.Window_ItemDetail(new Rectangle(0, 0, 400, 300)); let drawn = 0; w.refresh = function() { drawn++; };
        w.setItem($dataItems[102]); const desc = w._desc, n0 = drawn; w.setText("Zjadłeś jagody."); const note = w._note;
        w.clear(); const cleared = !w._item && !w._desc && !w._note;
        const list = new Window_ItemList(new Rectangle(0, 0, 400, 300)); list.setCategory("all");
        const ids = list._data.map(it => it && (DataManager.isItem(it) ? "i" : DataManager.isWeapon(it) ? "w" : "a") + it.id);
        const out = { desc, note, refreshed: n0 >= 1 && drawn > n0, cleared, ids, quest: list._questIds instanceof Set,
            keepsake: MenuPanel.isKeepsake($dataItems[172]), axe: MenuPanel.isKeepsake($dataItems[60]), berries: MenuPanel.isKeepsake($dataItems[102]),
            stamp: MenuPanel.stampText(new Date(2026, 9, 28, 16, 8).getTime()) };
        w.destroy(); list.destroy(); return out; })()`);
    t.check("karta Plecaka (Window_ItemDetail): opis rzeczy w _desc, to, co po użyciu - w _note, każda zmiana rysuje ją od nowa", !!bag.desc && bag.note === "Zjadłeś jagody." && bag.refreshed && bag.cleared, bag);
    t.check("lista Plecaka „all”: rzeczy i narzędzia (jagody, siekiera), bez broni z bazy; rzeczy do zadań policzone", bag.ids.includes("i102") && bag.ids.includes("i60") && !bag.ids.some(x => /^w/.test(x)) && bag.quest, bag.ids);
    t.check("pamiątki: wisiorek (172) tak, siekiera i jagody nie", bag.keepsake === true && bag.axe === false && bag.berries === false, bag);
    t.check("czas zapisu jak na liście plików: 28.10.2026, 16:08", bag.stamp === "28.10.2026, 16:08", bag.stamp);

    // ---------------------------------------------------------------- the title's "Opcje": the same look (MenuRing.js), no MenuPanel panel
    t.check("ekran tytułowy", await t.toTitle());
    await t.eval("SceneManager.push(Scene_Options); 0");
    await t.until("SceneManager._scene instanceof Scene_Options && SceneManager._scene._started && !SceneManager.isSceneChanging()", 10);
    await t.frames(20);
    const opt = await t.json(`(function(){ const s = SceneManager._scene, w = s._optionsWindow, cr = w._cursorRect;
        return { panel: !!s._menuPanel, bg: !!s._optBg, keys: !!s._optKeys, flat: w.opacity === 0 && !w.frameVisible, cursor: cr.width * cr.height, first: w.commandSymbol(0), rows: w._list.map(c => c.symbol),
            x: w.x, w: w.width, cancel: !!(s._cancelButton && s._cancelButton.visible) }; })()`);
    t.check("Opcje z tytułu: panel jak ekran plików (MenuRing), okno bez ramki i bez kursora okna, pierwsza „Jakość grafiki”, bez „Wygląd”", !opt.panel && opt.bg && opt.keys && opt.flat && opt.cursor === 0
        && opt.first === "gfxQuality" && !opt.rows.includes("uiClean") && !opt.cancel && opt.x > 100 && opt.x + opt.w < 1180, opt);
    await t.shot("../docs/ui_jeden_wyglad/test_opcje_tytul.png");
    await t.key("Escape");
    t.check("Esc wraca do tytułu", await t.until("SceneManager._scene instanceof Scene_Title && !SceneManager.isSceneChanging()", 10));
});
