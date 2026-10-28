// The P menu (MenuRing.js v4.1): a row of eight tabs across the top (Postać, Ekwipunek, Umiejętności, Plecak, Dziennik, Opcje, Zapisz
// grę, Wyjdź - the user, 2026-10-23: "opcje główne na górze ... połączyć z bieżącym", "żeby nie było podzakładek") and under it one
// panel the whole width with the pages of "Lista v2" (2026-10-22, docs/ui_proste/POMYSLY.md). Two levels: A / D along the tabs (the
// page shows at once), O into the page, P back, P on the tabs closes the menu; a smaller step inside at most. The bar of keys at the
// foot. Every page: Postać (the attribute's bubble - what it gives now and with a point more -, a point given, the opinion "Obcy"),
// Ekwipunek (places W/S/A/D, the chosen place's bubble, the choice and its look tried on with the thing's bubble, on / off, X, Tab
// turns, RAZEM), Umiejętności (the fields' row A / D, O into the tree, W/S/A/D along its boxes, a skill learnt after a question, P
// twice), Plecak (use, throw out, the order), Dziennik (A/D section, pin, J), Opcje, Zapisz grę (a save, the question over a file, the
// load), Wyjdź (the question, back; to the title). The mouse. No errors. Screenshots: docs/ui_proste/gra_*.png and gra_vs_makieta.png
// (the mock-ups beside the game, tools/ui_proste/gra_vs_makieta.py). CDP_PORT=9579.
"use strict";
const path = require("path");
const { execFileSync } = require("child_process");
const kit = require("./lib/kit.js");
const OUT = path.join(__dirname, "..", "docs", "ui_proste");

kit.test({ port: 9579, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    // ---------------------------------------------------------------- the game of the mock-ups: a new story game, day 1, grandpa's house
    t.check("nowa gra (dom dziadka)", await t.newGame({ story: true, skipIntro: true, hour: 10, quiet: true, minimap: false }));
    const setup = await t.json(`(function(){ ConfigManager.uiClean = true; ConfigManager.bagSort = "groups"; window.dispatchEvent(new Event("pointerdown"));
        const give = [[64, 12], [77, 9], [61, 5], [92, 4], [102, 6], [103, 3], [139, 4], [149, 2], [129, 1], [90, 1], [60, 1], [260, 1], [270, 1], [275, 1], [277, 1], [131, 1]];
        for (const [id, n] of give) if ($dataItems[id]) $gameParty.gainItem($dataItems[id], n);
        $gameParty.gainGold(14);
        if (window.Needs && Needs.setEnabled) Needs.setEnabled(true);
        const n = Needs && Needs.state ? Needs.state() : null; if (n) { n.food = 72; n.water = 58; }
        if ($gameSystem.setStamina) $gameSystem.setStamina(84);
        if (Combat.setHand) Combat.setHand("m60");
        // (a free tile in front of the hero for the bundle of "Wyrzuć")
        let dir = 0;
        for (const d of [2, 4, 6, 8]) { $gamePlayer.setDirection(d); const f = Drops.frontTile(); if (Drops.canPlace(f.x, f.y)) { dir = d; break; } }
        return { dir, slots: Equipment.slots().map(s => s.id + ":" + s.item), ubior: !!window.Ubior && !!Ubior.tryOn, sklepy: !!Tawerna.api("Ubior_Sklepy") }; })()`);
    t.check("rzeczy z pierwszych dni w plecaku, ubranie założone (tors, nogi, stopy, pas), siekiera w ręce", setup.slots.includes("torso:260") && setup.slots.includes("belt:277") && setup.slots.includes("right:60"), setup);
    t.check("Ubior.tryOn jest (podgląd stroju)", setup.ubior);
    await t.frames(60);
    const info = () => t.json("MenuRing.info()");
    const inMenu = "SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()";
    const key = async (k, n) => { await t.key(k); await t.frames(n || 4); return info(); };
    const shot = name => t.shot(path.join(OUT, "gra_" + name + ".png"));
    // (the menu is shown smaller round the middle - MenuRing.UI.s: its own places turned into the screen's for the mouse)
    const scr = (x, y) => t.json(`MenuRing.UI.toScreen(${x}, ${y})`);
    const clickL = async (x, y) => { const q = await scr(x, y); await t.click(q.x, q.y); };
    const moveL = async (x, y) => { const q = await scr(x, y); await t.mouseMove(q.x, q.y); };
    const open = async () => { await t.key("P"); const ok = await t.until(inMenu, 10); await t.frames(40); return ok; };
    const goTo = async sym => {   // (on the tabs: D until the tab is chosen)
        let m = await info();
        for (let i = 0; i < 10 && m.active !== sym; i++) m = await key("D", 12);
        return m;
    };

    // ---------------------------------------------------------------- P: the tabs (level 1), Postać first, its page as a preview
    t.check("P otwiera menu", await open());
    let m = await info();
    // (2026-10-24: the ninth tab "Mapa" between Dziennik and Opcje - MapaWyspy.js, tests/mapa_woz_test.js)
    t.check("rząd 9 zakładek u góry: Postać, Ekwipunek, Umiejętności, Plecak, Dziennik, Mapa, Opcje, Zapisz grę, Wyjdź", m && m.labels.join() === "Postać,Ekwipunek,Umiejętności,Plecak,Dziennik,Mapa,Opcje,Zapisz grę,Wyjdź"
        && m.rows.length === 9 && m.rows.every(r => r.y1 <= 84) && m.rows.every((r, i) => i === 0 || r.x0 > m.rows[i - 1].x1), m && m.rows);
    t.check("na początku zakładki (poziom 1), Postać, podgląd bez klawiszy", m.level === 1 && m.active === "hero" && m.activeWindows.length === 0, { level: m.level, active: m.active });
    t.check("pasek klawiszy: A/D zakładka · O wybierz · P wróć do gry", m.keyCaps.join() === "A/D,O,P" && m.keys.join() === "zakładka,wybierz,wróć do gry", m.keys);
    t.check("stare okno poleceń i panel MenuPanel ukryte", !m.window.visible && !m.window.active && !(await t.eval("SceneManager._scene._menuPanel && SceneManager._scene._menuPanel.visible")));
    t.check("Postać: popiersie, walka (broń w ręce), odporności, atrybuty bez zaznaczenia i bez dymka", m.stats && m.stats.bust && m.stats.focus === null && !m.stats.popup
        && m.stats.fight[0] === "Broń: Kamienna siekiera" && m.stats.defense.length === 5, m.stats);
    const opinion = await t.eval("TownQuests.tierName()");
    t.check("opinia: samo słowo stopnia („" + opinion + "”), bez liczby i „w miasteczku”", m.stats.opinion === opinion && opinion === "Obcy", m.stats.opinion);
    await shot("postac");

    // ---------------------------------------------------------------- A / D along the tabs (round), the arrows too; the page follows
    const order = [];
    for (let i = 0; i < 9; i++) order.push((await key("D", 12)).active);
    t.check("D: w prawo po całym rzędzie, w kółko", order.join() === "equip,skills,item,journal,mapa,options,save,gameEnd,hero", order);
    m = await key("A", 12);
    t.check("A: w lewo (z Postaci na Wyjdź)", m.active === "gameEnd" && m.level === 1, m.active);
    m = await key("ArrowRight", 12);
    t.check("strzałka w prawo działa jak D", m.active === "hero", m.active);
    m = await key("S", 6);
    t.check("W / S na zakładkach nic nie robią", m.active === "hero" && m.level === 1, m.active);

    // ---------------------------------------------------------------- Postać: O in - the attributes (W / S) with their bubble, O gives a point
    m = await key("O", 6);
    t.check("O: w Postać (poziom 2), klawisze W/S atrybut · P wróć", m.level === 2 && m.active === "hero" && m.stats.focus === "str" && m.keys.includes("atrybut") && m.keyCaps.includes("P"), m.keys);
    const str = await t.json("Combat.attrInfo('str')");
    t.check("dymek przy Sile: co daje teraz i z punktem więcej (te same liczby co Combat)", m.stats.popup && m.stats.popup.attr === "str" && m.stats.popup.rows.length === str.rows.length
        && m.stats.popup.rows[0] === str.rows[0].label + ": " + str.rows[0].now + " -> " + str.rows[0].next, m.stats.popup);
    await t.eval("(function(){ const h = Combat.hero(); h.points = 2; SceneManager._scene._view.redraw(); SceneManager._scene.drawKeys(); SceneManager._scene.drawList(); return 0; })()");
    m = await info();
    t.check("są punkty: „O dodaj punkt” w pasku, „+” przy atrybutach", m.stats.plus && m.keys.includes("dodaj punkt"), m.keys);
    await shot("postac_dymek");
    const str0 = await t.eval("Combat.hero().attr.str");
    m = await key("O", 6);
    t.check("O: punkt do Siły, dymek liczy na nowo", (await t.eval("Combat.hero().attr.str")) === str0 + 1 && m.stats.points === 1 && m.stats.popup.rows[0] === (await t.json("Combat.attrInfo('str')")).rows.map(r => r.label + ": " + r.now + " -> " + r.next)[0], m.stats.popup);
    m = await key("S");
    t.check("S: Zręczność - dymek przy niej", m.stats.focus === "dex" && m.stats.popup.attr === "dex", m.stats.focus);
    m = await key("Enter", 6);
    t.check("Enter jak O: ostatni punkt rozdany, „dodaj punkt” znika", m.stats.points === 0 && !m.keys.includes("dodaj punkt"), m.keys);
    const dex0 = await t.eval("Combat.hero().attr.dex");
    await key("O", 6);
    t.check("bez punktów O nic nie zmienia", (await t.eval("Combat.hero().attr.dex")) === dex0);
    m = await key("P", 6);
    t.check("P: z powrotem na zakładki (poziom 1), dymek znika", m.level === 1 && m.active === "hero" && !m.stats.popup, m.level);

    // ---------------------------------------------------------------- Ekwipunek: the places, the bubble, RAZEM, X, Tab
    m = await key("D", 12);
    t.check("D: Ekwipunek - podgląd (bez dymka)", m.active === "equip" && m.level === 1 && m.equip && m.equip.cells.length === 11 && !m.equip.bubble, m.equip && m.equip.cells);
    await shot("ekwipunek");
    m = await key("O", 6);
    t.check("O: w Ekwipunek, miejsce Głowa; klawisze W/S/A/D miejsce · O wybierz · X zdejmij · Tab obróć · P wróć", m.level === 2 && m.equip.cell === "head" && m.keyCaps.join() === "W/S/A/D,O,X,Tab,P", m.keyCaps);
    t.check("dymek przy pustej głowie: „pusto” i skąd wziąć", m.equip.bubble && m.equip.bubble.title === "pusto" && m.equip.bubble.lines.length >= 1, m.equip.bubble);
    m = await key("D");
    t.check("D: Tors (w prawo)", m.equip.cell === "torso", m.equip.cell);
    m = await key("S");
    const belt = m.equip.bubble, cellB = (await t.json("MenuRing.eqCells()")).find(c => c.id === "belt");
    t.check("S: Pas - dymek obok komórki: nazwa, opis z gry, co daje, zużycie, waga", m.equip.cell === "belt" && belt && belt.title === "Brązowy skórzany pas" && belt.lines.length >= 2
        && /\d+ \/ \d+/.test(belt.wear) && belt.weight > 0 && belt.x > cellB.x + 72, belt);
    const fig = await t.json("(function(){ const s = SceneManager._scene._view._fig; return { x: s.x, y: s.y, w: s.bitmap.width }; })()");
    t.check("dymek nie zasłania postaci (jej środka)", belt.x + belt.w < fig.x + fig.w / 2 - 60, { belt, fig });
    const tot = m.equip.totals, udz = await t.eval("Tawerna.api('Ubior_Sklepy') ? Tawerna.api('Ubior_Sklepy').udzwig() : 0");
    t.check("RAZEM: zbroja, ciepło, udźwig, schludność, chód - z prawdziwych bonusów (pas: udźwig +" + udz + ")", tot.length === 5 && tot[0].startsWith("Zbroja") && tot.includes("Udźwig: " + (udz ? "+" + udz : "brak")), tot);
    await shot("ekwipunek_dymek");
    m = await key("D");
    t.check("D z drugiej kolumny „Ubioru”: do „Okrycia i rąk” (ten sam rząd: Prawa ręka), dymek po jej lewej", m.equip.cell === "right" && m.equip.bubble && m.equip.bubble.x + m.equip.bubble.w < 1046, m.equip.cell);
    m = await key("A");
    m = await key("A");
    t.check("A, A: z powrotem przez Pas na Rękawice", m.equip.cell === "hands", m.equip.cell);
    m = await key("D");
    // Tab: the figure turns (front, side, back, side)
    const turns = [];
    for (let i = 0; i < 4; i++) { m = await key("Tab", 6); turns.push(m.equip.turn + ":" + /:(\d)$/.exec(m.equip.figKey || "")[1]); }
    t.check("Tab obraca postać: bok, tył, bok, przód (inny wiersz arkusza za każdym razem)", turns.join() === "bok:2,tył:4,bok:6,przód:0", turns);
    // X: off; X on an empty place: a word in the bubble, nothing else
    m = await key("X", 6);
    t.check("X: pas zdjęty", m.equip.cell === "belt" && (await t.eval("Equipment.current('belt')")) === 0, m.equip);
    m = await key("X", 6);
    t.check("X na pustym miejscu: „Tu nic nie ma do zdjęcia.” w dymku, bez okna wiadomości", /nic nie ma/.test(m.equip.note) && /nic nie ma/.test(m.equip.bubble.note) && !(await t.eval("$gameMessage.isBusy()")), m.equip.note);
    m = await key("O", 6);
    t.check("O na pasie: lista pod postacią - pas z torby i „Nic”, dymek przy wybranym", m.equip.mode === "list" && m.equip.rows.some(r => r.id === 277) && m.equip.rows[m.equip.rows.length - 1].name === "Nic"
        && m.keyCaps.join() === "W/S,O,P" && m.equip.bubble && m.equip.bubble.title === "Brązowy skórzany pas", m.equip.rows);
    m = await key("O", 6);
    t.check("O: pas z powrotem założony, z listy na miejsca", m.equip.mode === "cells" && (await t.eval("Equipment.current('belt')")) === 277, m.equip.mode);

    // the head: two hats in the bag (not worn) - the choice with the look tried on
    await t.eval("(function(){ $gameParty.gainItem($dataItems[250], 1); $gameParty.gainItem($dataItems[255], 1); Equipment.unequip('head'); SceneManager._scene._view.redraw(); return 0; })()");
    m = await key("W");
    m = await key("A");
    t.check("W, A: Głowa (pusta)", m.equip.cell === "head" && (await t.eval("Equipment.current('head')")) === 0, m.equip.cell);
    m = await key("O", 8);
    const rowNames = m.equip.rows.map(r => r.name);
    t.check("O na głowie: Słomkowy kapelusz, Brązowa filcowa czapka, Nic", m.equip.mode === "list" && rowNames.join() === "Słomkowy kapelusz,Brązowa filcowa czapka,Nic", rowNames);
    await t.until("(function(){ const i = MenuRing.info(); return !!(i && i.equip && /^p:/.test(i.equip.figKey)); })()", 5, 100);
    m = await info();
    t.check("podgląd: postać od razu w słomkowym kapeluszu (Ubior.tryOn), a na głowie dalej nic", m.equip.preview && m.equip.preview.glowa === "kapelusz_slomkowy" && /^p:/.test(m.equip.figKey) && (await t.eval("Equipment.current('head')")) === 0, { preview: m.equip.preview, fig: m.equip.figKey });
    t.check("dymek kapelusza: opis z gry i co daje", m.equip.bubble && m.equip.bubble.title === "Słomkowy kapelusz" && m.equip.bubble.lines.some(l => /upał/.test(l)), m.equip.bubble);
    await t.frames(6);
    await shot("ekwipunek_wybor");
    m = await key("S", 8);
    t.check("S: podgląd filcowej czapki (dymek za nią)", m.equip.preview && m.equip.preview.glowa === "czapka_filc_braz" && m.equip.bubble.title === "Brązowa filcowa czapka", m.equip.preview);
    m = await key("S", 8);
    t.check("S: „Nic” - podgląd bez nakrycia", m.equip.preview && m.equip.preview.glowa === "", m.equip.preview);
    m = await key("P", 6);
    t.check("P: z powrotem do miejsc, nic nie założone, podglądu już nie ma", m.level === 2 && m.equip.mode === "cells" && !m.equip.preview && (await t.eval("Equipment.current('head')")) === 0, m.equip);
    await key("O", 6);
    await key("S", 6);
    m = await key("O", 8);
    t.check("O, S, O: filcowa czapka założona (widać ją na postaci - Ubior)", (await t.eval("Equipment.current('head')")) === 255 && (await t.eval("Ubior.outfit().glowa")) === "czapka_filc_braz" && m.equip.mode === "cells", await t.eval("Ubior.outfit().glowa || ''"));
    m = await key("O", 6);
    t.check("O na czapce: lista zaczyna na założonej", m.equip.rows[m.equip.row].id === 255 && m.equip.rows[m.equip.row].worn, m.equip.rows[m.equip.row]);
    await key("S", 6);
    m = await key("O", 6);
    t.check("„Nic”: czapka zdjęta", (await t.eval("Equipment.current('head')")) === 0, m.equip.mode);
    // the right hand: the weapons of the combat mode, the fists among them
    m = await key("D"); m = await key("D"); m = await key("S");
    t.check("D, D, S: Prawa ręka", m.equip.cell === "right", m.equip.cell);
    m = await key("O", 6);
    t.check("Prawa ręka: bronie trybu walki (pięści też), bez „Nic”", m.equip.rows.some(r => r.name === "Pięści") && !m.equip.rows.some(r => r.name === "Nic"), m.equip.rows.map(r => r.name));
    m = await key("P", 6);
    // the mouse: over a place - it is chosen; a click on it opens its list; a click on a row of the list chooses it, again - on
    const cellsXY = await t.json("MenuRing.eqCells()"), feet = cellsXY.find(c => c.id === "feet");
    await moveL(feet.x + 30, feet.y + 30);
    await t.frames(4);
    await moveL(feet.x + 36, feet.y + 36);
    await t.frames(6);
    m = await info();
    t.check("myszą: nad „Stopy” - zaznaczone", m.equip.cell === "feet" && m.equip.mode === "cells", m.equip.cell);
    await clickL(feet.x + 36, feet.y + 36);
    await t.frames(6);
    m = await info();
    t.check("myszą: klik - lista dla stóp", m.equip.mode === "list" && m.equip.rows.some(r => r.id === 275), m.equip.rows);
    const nic = m.equip.rows.findIndex(r => r.name === "Nic"), ly = m.equip.list.y + (nic - m.equip.list.top) * m.equip.list.row + m.equip.list.row / 2;
    await clickL(m.equip.list.x, ly);
    await t.frames(6);
    m = await info();
    t.check("myszą: klik w „Nic” - zaznaczone (podgląd boso)", m.equip.mode === "list" && m.equip.row === nic && m.equip.preview && m.equip.preview.stopy === "", m.equip);
    await clickL(m.equip.list.x, ly);
    await t.frames(6);
    t.check("myszą: drugi klik - łapcie zdjęte", (await t.eval("Equipment.current('feet')")) === 0 && (await info()).equip.mode === "cells");
    await t.eval("Equipment.equip('feet', 275); SceneManager._scene._view.redraw(); 0");
    m = await key("P", 6);
    t.check("P (na miejscach): z powrotem na zakładki", m.level === 1 && m.active === "equip", m.level);

    // ---------------------------------------------------------------- Umiejętności: the fields' row (A / D), O - the tree, O learns, P twice
    m = await key("D", 12);
    t.check("Umiejętności: podgląd drzewka pierwszej dziedziny (węzły z danych drzewek)", m.active === "skills" && m.level === 1 && m.skills.cells.length === m.skills.count && m.skills.count > 3, m.skills);
    m = await key("O", 6);
    t.check("O: wiersz dziedzin ma klawisze - A/D dziedzina · O drzewko · P wróć", m.level === 2 && m.skills.zone === "fields" && m.skills.tree === 0 && m.keyCaps.join() === "A/D,O,P" && m.keys.join() === "dziedzina,drzewko,wróć", m.keys);
    await shot("umiejetnosci");
    m = await key("D", 6);
    t.check("D: następna dziedzina (inne drzewko)", m.skills.tree === 1 && m.skills.zone === "fields", m.skills);
    m = await key("A", 6);
    m = await key("A", 6);
    t.check("A, A: w kółko na ostatnią", m.skills.tree === m.skills.trees - 1, m.skills);
    m = await key("D", 6);
    await t.eval("(function(){ Combat.hero().skillPoints = 1; SceneManager._scene._view.redraw(); return 0; })()");
    m = await key("O", 6);
    t.check("O: w drzewko - W/S/A/D umiejętność · O naucz się · P wróć, zaznaczony węzeł", m.skills.zone === "tree" && m.skills.id && m.keyCaps.join() === "W/S/A/D,O,P", m.skills);
    const n0 = m.skills.node;
    m = await key("S", 6);
    const n1 = m.skills.node;
    m = await key("D", 6);
    const n2 = m.skills.node;
    m = await key("W", 6);
    t.check("S, D, W: kursor chodzi po węzłach drzewka", n1 !== n0 && m.skills.zone === "tree" && [n1, n2, m.skills.node].some(k => k !== n0), { n0, n1, n2, n3: m.skills.node });
    await shot("umiejetnosci_drzewko");
    const learn = await t.eval(`(function(){ const v = SceneManager._scene._view, l = v.list(); return l.findIndex(s => !Combat.skillBlock(s.id) && Combat.skillRank(s.id) < s.ranks); })()`);
    if (learn >= 0) {
        if ((await info()).skills.node === learn) await key("S", 6);
        const c = (await info()).skills.cells.find(q => q.i === learn);
        await moveL(c.x - 5, c.y);
        await t.frames(4);
        await moveL(c.x, c.y);
        await t.frames(6);
        m = await info();
        t.check("myszą: nad węzłem - zaznaczony", m.skills.node === learn && m.skills.zone === "tree" && !m.skills.ask, m.skills);
        const id = m.skills.id;
        await clickL(c.x, c.y);
        await t.frames(6);
        m = await info();
        t.check("myszą: klik w zaznaczony węzeł - pytanie Tak / Nie", m.skills.ask && m.keys.join() === "wybierz,potwierdź,nie", m.keys);
        m = await key("P", 6);
        t.check("P: bez nauki (pytanie znika, dalej w drzewku)", !m.skills.ask && m.skills.zone === "tree" && (await t.eval(`Combat.skillRank(${JSON.stringify(id)})`)) === 0, m.skills);
        m = await key("O", 6);
        t.check("O na umiejętności: pytanie Tak / Nie", m.skills.ask && m.keys.join() === "wybierz,potwierdź,nie", m.keys);
        m = await key("P", 6);
        t.check("P: bez nauki (pytanie znika, dalej w drzewku)", !m.skills.ask && m.skills.zone === "tree" && (await t.eval(`Combat.skillRank(${JSON.stringify(id)})`)) === 0, m.skills);
        await key("O", 6);
        m = await key("O", 8);
        t.check("O, O (Tak): umiejętność wyuczona, punkt wydany", !m.skills.ask && (await t.eval(`Combat.skillRank(${JSON.stringify(id)})`)) === 1 && (await t.eval("Combat.hero().skillPoints")) === 0, id);
    } else t.check("(nic do nauczenia w pierwszej dziedzinie - nauka pominięta)", true);
    m = await key("P", 6);
    t.check("P: z drzewka na wiersz dziedzin", m.level === 2 && m.skills.zone === "fields", m.skills);
    m = await key("P", 6);
    t.check("P drugi raz: na zakładki", m.level === 1 && m.active === "skills", m.level);

    // ---------------------------------------------------------------- Plecak: one list with the groups, the card; O uses, X throws out, Tab
    m = await key("D", 12);
    t.check("Plecak: podgląd (jedna lista z nagłówkami grup, bez kategorii)", m.active === "item" && m.bag && m.bag.heads.length >= 3 && m.bag.heads[0].label === "Narzędzia i ubiór" && !m.bag.active, m.bag && m.bag.heads.map(h => h.label));
    m = await key("O", 6);
    t.check("O: w Plecak - lista ma klawisze; W/S rzecz · O użyj · X wyrzuć · Tab porządek · P wróć", m.level === 2 && m.bag.active && m.keyCaps.join() === "W/S,O,X,Tab,P", m.keys);
    const pick = id => t.eval(`(function(){ const v = SceneManager._scene._views.item, l = v._list, i = l._data.findIndex(it => it && it.id === ${id}); if (i >= 0) { l.select(i); l.ensureCursorVisible(false); v._detail.setItem(l.item()); v.drawHead(); } return i; })()`);
    m = await key("S");
    t.check("S: następna rzecz (karta za nią)", m.bag.index === 1 && m.bag.card === m.bag.item, m.bag);
    await pick(131);
    await t.frames(8);
    await shot("plecak");
    t.check("jagody wybrane", (await pick(102)) >= 0);
    const berries = await t.count(102);
    m = await key("O", 8);
    t.check("O na jagodach: zjedzone (jedna mniej)", (await t.count(102)) === berries - 1 && m.bag.active, { before: berries, after: await t.count(102), note: m.bag.note });
    t.check("kamień wybrany", (await pick(64)) >= 0);
    const stones = await t.count(64);
    m = await key("X", 6);
    t.check("X: pytanie „ile” (A/D ±1 · W/S ±10 · Tab wszystko · O dalej · P anuluj)", m.bag.drop && m.bag.drop.step === "qty" && m.keyCaps.join() === "A/D,W/S,Tab,O,P", m.bag.drop);
    m = await key("D");
    m = await key("O", 6);
    t.check("D, O: „Wyrzucić 2?” Tak / Nie", m.bag.drop && m.bag.drop.step === "ask" && m.bag.drop.n === 2, m.bag.drop);
    await t.frames(4);
    await shot("plecak_wyrzuc");
    m = await key("O", 8);
    const drops = await t.json("Drops.list()");
    t.check("O (Tak): 2 kamienie w tobołku przed bohaterem, plakietka „Wyrzucone”", (await t.count(64)) === stones - 2 && drops.length === 1 && drops[0].items[64] === 2 && /^Wyrzucone/.test(m.bag.toast), { drops, toast: m.bag.toast });
    m = await key("Tab", 6);
    t.check("Tab: porządek Nazwa (bez nagłówków)", m.bag.sort === "name" && m.bag.heads.length === 0, m.bag.sort);
    for (let i = 0; i < 3; i++) m = await key("Tab", 6);
    t.check("Tab ×3: z powrotem Grupy", m.bag.sort === "groups" && m.bag.heads.length >= 3, m.bag.sort);
    // put on and take off from the bag (the user, 2026-10-23): O on a thing to wear - on, on again - off; a swap says what came off
    t.check("słomkowy kapelusz wybrany (głowa pusta)", (await pick(250)) >= 0 && (await t.eval("Equipment.current('head')")) === 0);
    await t.frames(4);
    m = await info();
    t.check("rzecz do założenia: w pasku „O załóż”, bez znacznika", m.keys.includes("załóż") && !m.bag.worn.includes(250), m.keys);
    m = await key("O", 8);
    t.check("O: kapelusz założony (widać go - Ubior), znacznik „założone”, karta „ZAŁOŻONE · GŁOWA”, pasek „O zdejmij”", (await t.eval("Equipment.current('head')")) === 250
        && (await t.eval("Ubior.outfit().glowa")) === "kapelusz_slomkowy" && m.bag.worn.includes(250) && /^ZAŁOŻONE/.test(m.bag.cardCap) && /GŁOWA/.test(m.bag.cardCap)
        && m.keys.includes("zdejmij") && /^Założone: Słomkowy kapelusz/.test(m.bag.wear), m.bag);
    await t.frames(6);
    await shot("plecak_zalozone");
    t.check("filcowa czapka wybrana", (await pick(255)) >= 0);
    await t.frames(4);
    m = await key("O", 8);
    t.check("O na czapce: zamiana - czapka założona, kapelusz zdjęty (napis mówi, co zdjął)", (await t.eval("Equipment.current('head')")) === 255 && /zdjęte: Słomkowy kapelusz/.test(m.bag.wear)
        && m.bag.worn.includes(255) && !m.bag.worn.includes(250), m.bag.wear);
    m = await key("O", 8);
    t.check("O jeszcze raz: czapka zdjęta, znacznik znika", (await t.eval("Equipment.current('head')")) === 0 && /^Zdjęte: Brązowa filcowa czapka/.test(m.bag.wear) && !m.bag.worn.includes(255), m.bag.wear);
    t.check("siekiera wybrana (w ręce)", (await pick(60)) >= 0 && (await t.eval("Combat.hand()")) === "m60");
    await t.frames(4);
    m = await key("O", 8);
    t.check("O na broni w ręce: prawa ręka - pięści (jak w Ekwipunku)", (await t.eval("Combat.hand()")) === "m0" && !m.bag.worn.includes(60), m.bag.wear);
    m = await key("O", 8);
    t.check("O jeszcze raz: siekiera z powrotem w ręce, znacznik „w ręce”", (await t.eval("Combat.hand()")) === "m60" && m.bag.worn.includes(60) && /^W RĘCE/.test(m.bag.cardCap), m.bag.cardCap);
    m = await key("P", 6);
    t.check("P: zakładki", m.level === 1 && m.active === "item", m.level);

    // ---------------------------------------------------------------- Dziennik: A / D the section, W / S the entry, O pins
    // (the user, 2026-10-23: one tab "Zadania" instead of "Cele" and "Miasteczko" - FABUŁA, POBOCZNE, ROZWÓJ, ..., UKOŃCZONE; one
    // thing pinned: a goal or a quest). A thread of the town (W1) and an errand (K1, followed by itself) for its groups.
    const q0 = await t.json(`(function(){ TownQuests.start("W1"); TownQuests.start("K1"); return { w1: TownQuests.rec("W1").s, k1: TownQuests.rec("K1").s, pin: Journal.pinnedNow() }; })()`);
    t.check("wątek W1 i zadanie K1 przyjęte (K1 śledzone samo)", q0.w1 === "active" && q0.k1 === "active" && q0.pin && q0.pin.owner === "town" && q0.pin.id === "K1", q0);
    m = await key("D", 12);
    m = await key("O", 6);
    t.check("Dziennik: w środku, dział Zadania, klawisze A/D dział · W/S wpis · O przypnij · P wróć", m.level === 2 && m.journal.name === "Zadania" && m.keyCaps.join() === "A/D,W/S,O,P" && m.keys.join() === "dział,wpis,przypnij,wróć" && m.activeWindows.includes("Window_JournalList"), m.journal);
    t.check("Dziennik: działy Zadania, Zlecenia, Surowce, Notatki, Okolice, Gablotka (bez Cele, Miasteczko, Budynki, Receptury, Zapasy)",
        m.journal.names && m.journal.names.join() === "Zadania,Zlecenia,Surowce,Notatki,Okolice,Gablotka", m.journal.names);
    const heads = (m.journal.heads || []).map(h => h.label);
    const rows = await t.json("SceneManager._scene._views.journal._list._items.map(i => ({ label: i.label, head: !!i.head, group: i.group || null, goal: i.goal ? i.goal.id : null, quest: i.quest ? i.quest.id : null, mark: i.mark || null }))");
    const inGroup = (g, f) => rows.some(r => !r.head && r.group === g && f(r));
    t.check("Zadania: grupy z nagłówkami i licznikami - FABUŁA, POBOCZNE, ROZWÓJ ... UKOŃCZONE na końcu",
        heads[0] === "FABUŁA" && heads[1] === "POBOCZNE" && heads[2] === "ROZWÓJ" && heads[heads.length - 1] === "UKOŃCZONE" && m.journal.heads.every(h => h.count > 0), m.journal.heads);
    t.check("FABUŁA: dług dziadka i wątek W1; POBOCZNE: K1 (z rombem - śledzone); ROZWÓJ: otwarte cele (np. młotek); UKOŃCZONE: rozmowa z dziadkiem i kamienie z plecaka",
        inGroup("story", r => r.goal === "story_debt") && inGroup("story", r => r.quest === "W1") && inGroup("side", r => r.quest === "K1" && r.mark === "pin") && inGroup("growth", r => r.goal === "hammer") && inGroup("done", r => r.goal === "story_talk") && inGroup("done", r => r.goal === "stone"), rows.filter(r => !r.head).map(r => r.group + ":" + (r.goal || r.quest) + ":" + r.mark));
    t.check("kursor na pierwszym wpisie (nie na nagłówku), pod listą „w toku N · wykonane M”", m.journal.index === 1 && m.journal.kind === "goal" && /^w toku \d+ {2}· {2}wykonane \d+$/.test(m.journal.legend), m.journal);
    await shot("dziennik");
    m = await key("D", 6);
    t.check("D: następny dział (Zlecenia)", m.journal.name === "Zlecenia", m.journal);
    m = await key("A", 6);
    t.check("A: z powrotem Zadania", m.journal.name === "Zadania", m.journal);
    m = await key("S");
    t.check("S: następny wpis", m.journal.index === 2, m.journal);
    // the last row of FABUŁA, then S: over POBOCZNE's heading straight to its first row
    const lastStory = rows.reduce((k, r, i) => (!r.head && r.group === "story" ? i : k), -1);
    await t.eval(`(function(){ const l = SceneManager._scene._views.journal._list; l.select(${lastStory}); l.ensureCursorVisible(false); l.updateHelp(); return 0; })()`);
    m = await key("S");
    t.check("S z ostatniego wpisu FABUŁY: przez nagłówek prosto na pierwszy wpis POBOCZNYCH", m.journal.index === lastStory + 2 && m.journal.group === "side", m.journal);
    m = await key("W");
    t.check("W: z powrotem (nagłówek pominięty)", m.journal.index === lastStory, m.journal);
    // the debt's goal: O pins it - K1 is let go
    const debtAt = rows.findIndex(r => r.goal === "story_debt");
    await t.eval(`(function(){ const l = SceneManager._scene._views.journal._list; l.select(${debtAt}); l.ensureCursorVisible(false); l.updateHelp(); return 0; })()`);
    m = await key("O", 6);
    t.check("O na celu: przypięty (romb), K1 już nie śledzone - jedno naraz", m.journal.pinned === "story_debt" && m.journal.pin && m.journal.pin.owner === "goal" && (await t.eval("TownQuests.state().track")) === null && m.journal.marks.length === 1 && /^Spłać dług dziadka/.test(m.journal.marks[0]), { pin: m.journal.pin, marks: m.journal.marks });
    t.check("okienko celu idzie za przypiętym celem", (await t.json("Journal.tracked() && Journal.tracked().id")) === "story_debt");
    // the thread W1, with its words on the right
    const w1At = rows.findIndex(r => r.quest === "W1");
    await t.eval(`(function(){ const l = SceneManager._scene._views.journal._list; l.select(${w1At}); l.ensureCursorVisible(false); l.updateHelp(); return 0; })()`);
    await t.frames(6);
    const w1Ops = await t.json("SceneManager._scene._views.journal._detail._ops.map(o => o.k + ':' + (o.text || ''))");
    t.check("wątek W1 zaznaczony: z prawej jego opis, rozdział, gdzie i kiedy", w1Ops.some(o => /^gtitle:Woda spod Kruczych Skał/.test(o)) && w1Ops.some(o => /^gh:Rozdział 1/.test(o)) && w1Ops.some(o => /Gdzie: /.test(o)), w1Ops);
    await shot("dziennik_zadanie");
    m = await key("O", 6);
    t.check("O na wątku: przypięty (śledzi go okienko celu - WĄTEK), cel odpięty", m.journal.pin && m.journal.pin.owner === "town" && m.journal.pin.id === "W1" && m.journal.pinned === null && m.journal.marks.join() === "Woda spod Kruczych Skał" &&
        (await t.json("(function(){ const x = Journal.tracked(); return x && x.source + ':' + x.id + ':' + x.label; })()")) === "town:W1:WĄTEK", { pin: m.journal.pin, marks: m.journal.marks });
    m = await key("O", 6);
    t.check("O jeszcze raz: odpięty (nic nie przypięte)", m.journal.pin === null && m.journal.marks.length === 0, m.journal.pin);
    m = await key("P", 6);
    t.check("P: zakładki", m.level === 1 && m.active === "journal", m.level);

    // ---------------------------------------------------------------- Opcje: W / S, A / D a value
    m = await goTo("options");   // (2026-10-24: past the Mapa tab)
    m = await key("O", 6);
    t.check("Opcje: lista opcji ma klawisze, pierwsza „Wygląd”", m.level === 2 && m.options.symbol === "uiClean" && m.activeWindows.includes("Window_Options"), m.options);
    m = await key("S");
    t.check("S: następna opcja", m.options.index === 1, m.options);
    await t.eval(`(function(){ const w = SceneManager._scene._views.options._win; w.select(w.findSymbol("seVolume")); w.ensureCursorVisible(false); return 0; })()`);
    const se0 = await t.eval("ConfigManager.seVolume");
    await key("A");
    const se1 = await t.eval("ConfigManager.seVolume");
    await key("D");
    t.check("A / D zmieniają głośność (i z powrotem)", se1 !== se0 && (await t.eval("ConfigManager.seVolume")) === se0, { se0, se1 });
    await t.eval(`(function(){ const w = SceneManager._scene._views.options._win; w.select(0); w.ensureCursorVisible(false); return 0; })()`);
    await t.frames(4);
    await shot("opcje");
    m = await key("P", 6);
    t.check("P: zakładki", m.level === 1 && m.active === "options", m.level);

    // ---------------------------------------------------------------- Zapisz grę: a file, O saves; over a file - a question first
    m = await key("D", 12);
    m = await key("O", 6);
    t.check("Zapisz grę: lista plików ma klawisze", m.level === 2 && m.activeWindows.includes("Window_SavefileList") && m.save.allowed, m.save);
    const free = await t.eval("(function(){ for (let id = 1; id < 20; id++) if (!DataManager.savefileInfo(id)) return id; return 19; })()");
    await t.eval(`(function(){ SceneManager._scene._views.save._list.selectSavefile(${free}); return 0; })()`);
    m = await key("S");
    t.check("S: następny plik", m.save.id === free + 1, m.save);
    m = await key("W");
    const gold0 = await t.eval("$gameParty.gold()");
    await t.key("O");
    const saved = await t.until("(function(){ const i = MenuRing.info(); return !!(i && i.save && /^Zapisano/.test(i.save.note)); })()", 15);
    const sinfo = await t.json(`DataManager.savefileInfo(${free})`);
    t.check("O na pustym pliku: zapisane od razu (dzień, miejsce, czas gry w opisie)", saved && sinfo && sinfo.day === 1 && !!sinfo.place && !!sinfo.playtime, sinfo);
    await t.frames(10);
    await shot("zapis");
    m = await key("O", 6);
    t.check("O na zapisanym pliku: pytanie „Nadpisać?” (Nie wybrane)", m.save.ask && m.keys.join() === "wybierz,potwierdź,nie", m.save);
    await t.frames(4);
    await shot("zapis_pytanie");
    m = await key("P", 6);
    t.check("P: bez nadpisania", !m.save.ask && m.level === 2, m.save);
    await key("O", 6);
    await key("A", 4);
    const ts0 = await t.eval(`DataManager.savefileInfo(${free}).timestamp`);
    await t.wait(20);
    await t.key("O");
    const saved2 = await t.until(`DataManager.savefileInfo(${free}).timestamp !== ${ts0}`, 15);
    t.check("A (Tak), O: nadpisane", saved2);
    m = await key("P", 6);
    t.check("P: zakładki", m.level === 1 && m.active === "save", m.level);

    // ---------------------------------------------------------------- Wyjdź: the question; Wróć - back to the tabs
    m = await key("D", 12);
    t.check("Wyjdź: podgląd pytania", m.active === "gameEnd" && m.end && m.end.sel === "title", m.end);
    m = await key("O", 6);
    t.check("O: pytanie ma klawisze (Do ekranu tytułowego wybrane)", m.level === 2 && m.end.sel === "title" && m.keys.join() === "wybierz,potwierdź,wróć", m.keys);
    await shot("wyjdz");
    m = await key("S");
    t.check("S: Wyjdź z gry", m.end.sel === "exit", m.end);
    m = await key("S");
    m = await key("O", 6);
    t.check("S, O na „Wróć”: z powrotem na zakładkach (gra trwa)", m.level === 1 && m.active === "gameEnd" && (await t.eval(inMenu)), m.level);

    // ---------------------------------------------------------------- the mouse on the tabs: a tab - chosen and in; another while inside
    const mid = r => [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2];
    await clickL(...mid(m.rows[3]));
    await t.frames(14);
    m = await info();
    t.check("myszą: klik w „Plecak” - wybrany i od razu w środku", m.active === "item" && m.level === 2 && m.bag.active, { active: m.active, level: m.level });
    await clickL(...mid(m.rows[1]));
    await t.frames(14);
    m = await info();
    t.check("myszą: klik w „Ekwipunek” z Plecaka - od razu w Ekwipunku", m.active === "equip" && m.level === 2 && m.equip.mode === "cells", { active: m.active, level: m.level });
    m = await key("P", 6);
    m = await key("P", 6);
    t.check("P na zakładkach zamyka menu", await t.until(t.onMap(), 10));
    await t.frames(10);

    // ---------------------------------------------------------------- J: the menu on Dziennik at once, inside
    await t.key("J");
    t.check("J otwiera menu od razu na Dzienniku, na Zadaniach (w środku, lista wpisów ma klawisze)", (await t.until(inMenu, 10)) && (await t.frames(20), (m = await info()).active === "journal" && m.level === 2 && m.journal.name === "Zadania" && m.activeWindows.includes("Window_JournalList")), m && { active: m.active, level: m.level, tab: m.journal && m.journal.name });
    m = await key("P", 6);
    t.check("P: zakładki (Dziennik wybrany)", m.level === 1 && m.active === "journal", m.level);
    await t.key("Escape");
    t.check("Esc na zakładkach zamyka menu (jak P)", await t.until(t.onMap(), 10));
    await t.frames(10);

    // ---------------------------------------------------------------- the save loads: the purse as it was saved
    await t.eval("$gameParty.gainGold(100); 0");
    t.check("wczytanie zapisu z menu", await t.loadFrom(free));
    t.check("po wczytaniu: sakiewka jak w chwili zapisu", (await t.eval("$gameParty.gold()")) === gold0, { gold0, now: await t.eval("$gameParty.gold()") });

    // ---------------------------------------------------------------- the classic look still: MenuPanel's panel
    await t.eval("ConfigManager.uiClean = false; window.dispatchEvent(new Event('pointerdown')); 0");
    await t.key("P");
    await t.until(inMenu, 10);
    await t.frames(20);
    t.check("Klasyczny (Opcje -> Wygląd): stare menu (panel i lista poleceń), bez zakładek Grafit", (await t.eval("!!SceneManager._scene._menuPanel && SceneManager._scene._menuPanel.visible && SceneManager._scene._commandWindow.visible && !SceneManager._scene._grafit")) && (await info()) === null);
    await t.key("Escape");
    await t.until(t.onMap(), 10);
    await t.eval("ConfigManager.uiClean = true; 0");
    await t.frames(10);

    // ---------------------------------------------------------------- Wyjdź -> Do ekranu tytułowego
    await open();
    await goTo("gameEnd");
    await key("O", 6);
    await t.key("O");
    t.check("Wyjdź -> Do ekranu tytułowego: ekran tytułowy", await t.until("SceneManager._scene instanceof Scene_Title && !SceneManager.isSceneChanging()", 15));

    // ---------------------------------------------------------------- the mock-ups beside the game
    try {
        const log = execFileSync(process.env.PYTHON || "python", [path.join(__dirname, "..", "tools", "ui_proste", "gra_vs_makieta.py")], { encoding: "utf8" });
        console.log(log.trim());
        t.check("docs/ui_proste/gra_vs_makieta.png złożone", /5 par/.test(log), log.trim());
    } catch (e) {
        t.check("docs/ui_proste/gra_vs_makieta.png złożone", false, String(e.message).slice(0, 300));
    }
});
