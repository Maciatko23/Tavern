// The P menu in the graphite look (MenuRing.js v3.3, the user's choices 2026-10-08 / 10-12): ONE window with six tabs - Postać,
// Plecak, Dziennik, Opcje, Zapisz grę, Zakończ grę; Postać as the mock-up "A" (Statystyki / Ekwipunek / Umiejętności). Layers as in
// RPG Maker (the user, 2026-10-12): 1 the tabs - A / D choose (the content shows dimmed), O in, P out of the menu; 2 the sub-tabs
// (Postać's parts, the bag's categories, the journal's sections) - A / D, O in, P up; 3 the content - W / S (A / D in a grid or on a
// value), O chooses, P up; deeper parts (the choice for an equipment place, a skill tree) the same. No Q / E, no Z / C. The arrows,
// Enter, Esc and the mouse work too; J opens the journal's list. The bag in groups (or by name / count / the newest - Tab, kept in the
// config). Screenshots to docs/ui_grafit/test_menu_<part>.png. CDP_PORT=9460.
"use strict";
const path = require("path");
const kit = require("./lib/kit.js");
const OUT = path.join(__dirname, "..", "docs", "ui_grafit");

kit.test({ port: 9460, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", plugins: ["CleanHUD", "CleanHUD_Compass", "MenuRing"] }, async t => {
    t.check("zapis wczytany (dzień 40, farma)", await t.loadFixture("day40_farm", {}));
    await t.eval(`(function(){ ConfigManager.uiClean = true; if (window.Hunting) Hunting.auto(false); if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); }
        if (window.Birds && Birds.auto) Birds.auto(false); const h = Combat.hero(); h.points = 2; h.skillPoints = 2;
        for (const id of [171, 155]) if (!$gameParty.numItems($dataItems[id])) $gameParty.gainItem($dataItems[id], 1);
        ConfigManager.bagSort = "groups"; $gameParty.gainItem($dataItems[95], 2); $gameParty.gainItem($dataItems[129], 1); $gameParty.gainItem($dataItems[67], 3);
        if ($dataItems[172] && !$gameParty.numItems($dataItems[172])) $gameParty.gainItem($dataItems[172], 1);   // (the prologue's pendant: a keepsake)
        window.dispatchEvent(new Event("pointerdown")); return 0; })()`);   // (Fullscreen.js asks for fullscreen at the first key - the browser would then eat the first Esc to leave it: used up here without a real gesture)
    await t.frames(30);
    const info = () => t.json("MenuRing.info()");
    const inMenu = "SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()";
    const open = async () => { await t.key("P"); const ok = await t.until(inMenu, 10); await t.frames(45); return ok; };
    const key = async (k, n) => { await t.key(k); await t.frames(n || 4); return info(); };
    const tab = async k => { await t.key(k); await t.frames(18); return info(); };   // (the slide takes 12 frames)
    const shot = name => t.shot(path.join(OUT, "test_menu_" + name + ".png"));

    // ---------------------------------------------------------------- P: one window, level 1 (the tabs), Postać first
    t.check("P otwiera menu", await open());
    let m = await info();
    t.check("jedno okno z sześcioma zakładkami: Postać, Plecak, Dziennik, Opcje, Zapisz grę, Zakończ grę", m && m.tabs.join() === "hero,item,journal,options,save,gameEnd", m && m.tabs);
    t.check("na początku poziom 1: pasek zakładek, Postać (podgląd Statystyk, nic aktywnego)", m.level === 1 && m.active === "hero" && m.sub === "stats" && m.activeWindows.length === 0, { level: m.level, active: m.active });
    t.check("podpowiedzi poziomu 1: A/D zakładka · O wybierz · P wróć do gry", m.keyCaps.join() === "A/D,O,P" && m.keys.join() === "zakładka,wybierz,wróć do gry", m.keyCaps);
    t.check("stare okno poleceń i panel MenuPanel ukryte", !m.window.visible && !m.window.active && !(await t.eval("SceneManager._scene._menuPanel.visible")));
    await shot("poziom1");

    // ---------------------------------------------------------------- level 1: A / D through every tab, the slide and the line
    const under0 = await t.eval("SceneManager._scene._underTX");
    await t.key("D");
    await t.frames(2);
    const mid = await info();
    t.check("D: następna zakładka, widok wjeżdża (podgląd, poziom 1)", mid.slide === true && mid.active === "item" && mid.level === 1, mid);
    await t.frames(16);
    t.check("...a miedziana kreska przesuwa się pod nową zakładkę", (await t.eval("SceneManager._scene._underTX")) > under0 && !(await info()).slide);
    const order = ["item"];
    for (let i = 0; i < 5; i++) order.push((await tab("D")).active);
    t.check("D: kolejno w prawo przez wszystkie zakładki, w kółko", order.join() === "item,journal,options,save,gameEnd,hero", order);
    const back = [];
    for (let i = 0; i < 3; i++) back.push((await tab("A")).active);
    t.check("A: w lewo (z początku na koniec: Zakończ grę, Zapisz grę, Opcje)", back.join() === "gameEnd,save,options", back);
    m = await tab("ArrowRight");
    t.check("→ działa jak D", m.active === "save" && m.level === 1, m.active);
    m = await tab("Q");
    t.check("Q nie przełącza już zakładek", m.active === "save", m.active);
    const boxes = await t.json("SceneManager._scene._tabBoxes");
    const jb = boxes[2];
    await t.click((jb.x0 + jb.x1) / 2, 42);
    await t.frames(20);
    m = await info();
    t.check("myszą: klik w „Dziennik” - wybrana i od razu wejście (poziom 2: działy)", m.active === "journal" && m.level === 2, { active: m.active, level: m.level });
    await key("P", 6);
    const hero = boxes[0];
    await t.click((hero.x0 + hero.x1) / 2, 42);
    await t.frames(20);
    m = await info();
    t.check("myszą: klik w „Postać” - poziom 2 (podzakładki)", m.active === "hero" && m.level === 2 && m.keys[0] === "podzakładka", { active: m.active, level: m.level });
    await shot("poziom2_postac");

    // ---------------------------------------------------------------- level 2 of Postać: A / D the parts, O in, P up
    m = await tab("D");
    t.check("poziom 2: D - Ekwipunek (podgląd)", m.sub === "equip" && m.level === 2, m.sub);
    m = await tab("A");
    t.check("A - z powrotem Statystyki", m.sub === "stats", m.sub);
    m = await tab("A");
    t.check("A ze Statystyk - Umiejętności (w kółko)", m.sub === "skills" && m.activeWindows.length === 0, m.sub);
    m = await tab("D");
    m = await key("P", 6);
    t.check("P na podzakładkach: z powrotem poziom 1", m.level === 1 && m.active === "hero", m.level);
    m = await key("O", 6);
    t.check("O na Postaci: poziom 2", m.level === 2 && m.sub === "stats", m.level);
    m = await key("O", 6);
    t.check("O na Statystykach: poziom 3 (atrybuty)", m.level === 3 && m.sub === "stats" && m.keys.includes("atrybut"), { level: m.level, keys: m.keys });

    // ---------------------------------------------------------------- Statystyki (level 3)
    t.check("Statystyki: kursor na Sile, „+” widoczne (2 pkt do rozdania)", m.stats && m.stats.focus === "str" && m.stats.plus && m.stats.xp.points === 2, m.stats && m.stats.focus);
    t.check("nic nie wyskakuje (opis Siły w stałym panelu)", m.stats.popups === 0 && m.stats.desc && m.stats.desc.attr === "str" && m.stats.desc.rows.every(r => r.now && r.next), m.stats.desc);
    const fi = await t.json("Combat.fightInfo()"), mhp = await t.eval("$gameParty.leader().mhp");
    t.check("Obrażenia: broń w prawej ręce - te same liczby co w walce", m.stats.fight.length === 6 && m.stats.fight[0] === "Cios: " + fi.weapon.hit && /^Seria: \d+( \/ \d+)+$/.test(m.stats.fight[1]), m.stats.fight);
    t.check("Odporności: życie, oddech, zbroja, blok, rana, przewrócenie, zimno, strach", m.stats.defense.length === 8 && m.stats.defense[0] === "Życie (najwięcej): " + mhp && /Zbroja · Skórzana kurtka/.test(m.stats.defense[2]), m.stats.defense);
    await shot("postac");
    const str0 = await t.eval("Combat.hero().attr.str");
    m = await key("O");
    t.check("O: punkt do Siły", (await t.eval("Combat.hero().attr.str")) === str0 + 1 && m.stats.xp.points === 1, { str0, points: m.stats.xp.points });
    m = await key("S");
    t.check("S: Zręczność - opis idzie za kursorem", m.stats.focus === "dex" && m.stats.desc.attr === "dex", m.stats.focus);
    m = await key("Enter");
    t.check("ostatni punkt rozdany (Enter jak O): „+” znika, podpowiedzi bez „rozdaj”", !m.stats.plus && m.stats.xp.points === 0 && !m.keys.some(k => /rozdaj/.test(k)), { plus: m.stats.plus, keys: m.keys });
    const dex0 = await t.eval("Combat.hero().attr.dex");
    m = await key("O");
    t.check("bez punktów O nic nie zmienia", (await t.eval("Combat.hero().attr.dex")) === dex0);
    const rowY = await t.eval("MenuRing.HA.attrY + 3 * MenuRing.HA.rowStep");
    await t.mouseMove(await t.eval("MenuRing.HA.attrX + 60"), rowY);
    await t.frames(6);
    m = await info();
    t.check("myszą nad „Czujność”: zaznaczona, opis o niej", m.stats.focus === "per" && m.stats.desc.attr === "per", m.stats.focus);
    m = await key("P", 6);
    t.check("P w atrybutach: poziom 2 (podzakładki)", m.level === 2, m.level);
    const subBox = await t.json("SceneManager._scene._subBoxes[1]");
    await t.click((subBox.x0 + subBox.x1) / 2, 109);
    await t.frames(20);
    m = await info();
    t.check("myszą: klik w „Ekwipunek” - od razu komórki (poziom 3)", m.sub === "equip" && m.level === 3, { sub: m.sub, level: m.level });

    // ---------------------------------------------------------------- Ekwipunek (level 3): the places, the choice (deeper), X, P
    t.check("ekwipunek: 11 miejsc wokół postaci, na początku Prawa ręka", m.equip.cells.length === 11 && m.equip.cell === "right" && m.equip.mode === "cells", m.equip.cell);
    t.check("podpowiedzi: komórka · wybierz · X zdejmij · P wróć", m.keyCaps.includes("X") && m.keyCaps.includes("O") && m.keyCaps.includes("P"), m.keyCaps);
    m = await key("W");
    t.check("W: Płaszcz (kolumna w górę)", m.equip.cell === "cloak", m.equip.cell);
    m = await key("D");
    t.check("D: druga kolumna na tej wysokości", ["back", "torso"].includes(m.equip.cell), m.equip.cell);
    const goCell = async id => { await t.eval(`(function(){ const v = SceneManager._scene._view; v._cell = ${JSON.stringify(["head", "cloak", "right", "hands", "legs", "feet", "back", "torso", "left", "belt", "extra"])}.indexOf("${id}"); v._mode = "cells"; v.draw(); return 0; })()`); await t.frames(3); return info(); };
    m = await goCell("torso");
    t.check("Tors: obok wybór (kurtka założona, „Zdejmij”)", m.equip.rows.some(r => r.id === 171 && r.worn) && m.equip.rows.some(r => r.act === "off"), m.equip.rows);
    m = await key("O", 6);
    t.check("O: w wybór (poziom niżej, na założonej)", m.equip.mode === "list" && m.equip.rows[m.equip.row].id === 171, m.equip);
    await shot("postac_wybor");
    m = await key("P", 6);
    t.check("P: z wyboru z powrotem na komórki (dalej poziom 3)", m.equip.mode === "cells" && m.level === 3, { mode: m.equip.mode, level: m.level });
    await key("O", 6);
    m = await key("S", 4);
    t.check("S w wyborze: „Zdejmij”", m.equip.rows[m.equip.row].act === "off", m.equip.rows[m.equip.row]);
    m = await key("O", 6);
    t.check("O: kurtka zdjęta (nie chroni)", m.equip.mode === "cells" && (await t.eval("Equipment.current('torso') === 0 && !Combat.armor()")));
    await key("O", 6);
    m = await key("O", 6);
    t.check("O, O: kurtka z powrotem założona", await t.eval("Equipment.current('torso') === 171 && Combat.armor() && Combat.armor().id === 171"));
    m = await key("X", 6);
    t.check("X: zdejmuje to, co na miejscu", await t.eval("Equipment.current('torso') === 0"));
    await t.eval("Equipment.equip('torso', 171); SceneManager._scene._view.draw(); 0");
    m = await goCell("right");
    t.check("Prawa ręka: bronie jak w trybie walki (pięści też)", m.equip.rows.some(r => r.name === "Pięści") && m.equip.rows.length >= 2, m.equip.rows.map(r => r.name));
    m = await goCell("head");
    m = await key("O", 6);
    t.check("Głowa: w grze jeszcze nic - bez wyboru, napis", m.equip.mode === "cells" && /nie ma jeszcze/.test(m.equip.note || ""), m.equip.note);
    m = await key("P", 6);
    t.check("P na komórkach: poziom 2", m.level === 2 && m.sub === "equip", m.level);

    // ---------------------------------------------------------------- Umiejętności: D, O - the fields, the tree (deeper), a point spent
    m = await tab("D");
    m = await key("O", 6);
    t.check("D, O: Umiejętności - dziedziny mają klawisze (poziom 3)", m.sub === "skills" && m.level === 3 && m.skills && m.skills.focus === "domains" && m.activeWindows.includes("Window_SkillDomains"), m.skills);
    m = await key("S");
    t.check("umiejętności: S następna dziedzina", m.skills.domain === 1, m.skills);
    m = await key("W");
    m = await key("O", 6);
    t.check("umiejętności: O wchodzi w drzewko", m.skills.focus === "tree" && m.activeWindows.includes("Window_SkillTree") && m.skills.node >= 0, m.skills);
    const node0 = m.skills.node;
    m = await key("D", 6);
    m = await key("S", 6);
    t.check("umiejętności: W/S/A/D chodzą po drzewku", m.skills.node !== node0 || m.skills.node >= 0, m.skills);
    m = await key("P", 6);
    t.check("umiejętności: P z drzewka wraca do dziedzin (dalej poziom 3)", m.skills && m.skills.focus === "domains" && m.level === 3 && (await t.eval(inMenu)), m.skills);
    const pick = await t.json(`(function(){ const v = SceneManager._scene._views.skills, C = window.Combat;
        for (let d = 0; d < v._domains.maxItems(); d++) { v._domains.select(d); v.showDomain(d); const nodes = v._tree._nodes || [];
            for (let i = 0; i < nodes.length; i++) { const s = nodes[i].skill || nodes[i], id = s.id || s; if (id && !C.skillBlock(id)) return { d, i, id }; } }
        return null; })()`);
    if (pick) {
        await t.eval(`(function(){ const v = SceneManager._scene._views.skills; v._domains.select(${pick.d}); v.showDomain(${pick.d}); return 0; })()`);
        await key("O", 6);
        await t.eval(`(function(){ const v = SceneManager._scene._views.skills; v._tree.select(${pick.i}); v.refreshDetail(); return 0; })()`);
        await t.frames(4);
        const sp0 = await t.eval("Combat.hero().skillPoints");
        m = await key("O", 6);
        t.check("umiejętności: O na umiejętności pyta „Tak / Nie”", m.skills.ask === true, m.skills);
        await shot("umiejetnosci");
        m = await key("O", 8);
        t.check("Tak: umiejętność wyuczona, punkt wydany", !m.skills.ask && (await t.eval("Combat.hero().skillPoints")) === sp0 - 1 && (await t.eval(`Combat.skillRank(${JSON.stringify(pick.id)})`)) >= 1, { pick, sp0 });
        await key("P", 6);
    } else {
        t.check("umiejętności: (nic do nauczenia teraz - pytanie pominięte)", true);
        await shot("umiejetnosci");
    }
    m = await key("P", 6);
    m = await key("P", 6);
    t.check("P, P: z dziedzin na poziom 2, potem na poziom 1", m.level === 1 && m.active === "hero", m.level);

    // ---------------------------------------------------------------- Plecak: D, O - the categories (level 2), O - the grid (level 3)
    m = await tab("D");
    t.check("D: Plecak (podgląd, poziom 1)", m.active === "item" && m.level === 1 && m.activeWindows.length === 0, { active: m.active, level: m.level });
    m = await key("O", 6);
    t.check("O: kategorie plecaka (poziom 2)", m.level === 2 && m.bag.cats && m.activeWindows.includes("Window_ItemCategory") && m.keys[0] === "kategoria", { level: m.level, keys: m.keys });
    m = await key("D", 8);
    t.check("kategorie: D następna (Materiały), siatka pokazuje tylko je", m.bag.category === "mat" && m.bag.cats, m.bag);
    t.check("Materiały: tylko nagłówki Materiały / Nasiona", m.bag.heads.length >= 1 && m.bag.heads.every(h => h.label === "Materiały" || h.label === "Nasiona"), m.bag.heads.map(h => h.label));
    await shot("poziom2_plecak");
    m = await key("A", 8);
    m = await key("O", 6);
    t.check("A, O: z powrotem „Wszystko” i siatka (poziom 3)", m.bag.category === "all" && !m.bag.cats && m.level === 3 && m.activeWindows.includes("Window_ItemList"), m.bag);
    t.check("plecak: rzecz wybrana", m.bag.items > 4 && m.bag.index === 0 && m.bag.item > 0, m.bag);
    m = await key("D");
    t.check("plecak: D następna rzecz", m.bag.index === 1, m.bag);
    m = await key("S");
    t.check("plecak: S rząd niżej (8 w rzędzie)", m.bag.index === 9 || (m.bag.items <= 9 && m.bag.index === 1), m.bag);
    await key("W");
    m = await key("W");
    t.check("plecak: W z górnego rzędu - kategorie (poziom 2)", m.bag.cats === true && m.level === 2, m.bag);
    m = await key("O", 6);
    m = await info();
    t.check("O: z powrotem siatka", !m.bag.cats && m.level === 3, m.bag);
    await shot("poziom3_plecak");
    // the order: groups (the headings in the user's order, what is worn first, what spoils soonest first), Tab -> name / count / newest
    const G = ["Narzędzia i broń", "Jedzenie", "Picie", "Materiały", "Nasiona", "Do zadań", "Inne", "Pamiątki"];
    const labels = m.bag.heads.map(h => h.label);
    t.check("porządek domyślny: Grupy - nagłówki w kolejności (Narzędzia i broń, Jedzenie, Picie, Materiały, Nasiona...)", m.bag.sort === "groups" && labels.length >= 4 && labels.every((l, i) => i === 0 || G.indexOf(l) > G.indexOf(labels[i - 1])) && labels[0] === "Narzędzia i broń", labels);
    t.check("każda grupa zaczyna nowy rząd", m.bag.heads.every(h => h.index % 8 === 0), m.bag.heads);
    const grp = await t.json(`(function(){ const l = SceneManager._scene._views.item._list, heads = l._heads, out = {};
        for (let k = 0; k < heads.length; k++) { const end = k + 1 < heads.length ? heads[k + 1].index : l._data.length; out[heads[k].key] = l._data.slice(heads[k].index, end).filter(Boolean).map(it => it.id); }
        const worn = (out.tools || []).map(id => Equipment.worn(id)), food = (out.food || []).map(id => { const h = Spoilage.hoursLeft(id); return h === null ? 1e9 : h; });
        return { out, worn, food }; })()`);
    const wornFirst = grp.worn.indexOf(false) < 0 || grp.worn.slice(grp.worn.indexOf(false)).every(w => !w);
    t.check("Narzędzia i broń: założone pierwsze (miedziany róg na kafelku)", grp.worn.some(Boolean) && wornFirst, grp.worn);
    t.check("Jedzenie: najpierw to, co najszybciej się zepsuje", grp.food.every((h, i) => i === 0 || h >= grp.food[i - 1]), grp.food);
    t.check("Picie osobno (bukłak), Nasiona osobno", (grp.out.drink || []).includes(129) && (grp.out.seed || []).includes(67), { drink: grp.out.drink, seed: grp.out.seed });
    // the keepsakes (the user, 2026-10-14): the pendant in "Pamiątki" (the last group), not with the tools, never to wear
    t.check("Pamiątki: wisiorek z krukiem w osobnej grupie na końcu, nie w „Narzędzia i broń”", labels[labels.length - 1] === "Pamiątki" && (grp.out.keep || []).includes(172) && !(grp.out.tools || []).includes(172), { labels, keep: grp.out.keep });
    t.check("wisiorka nie ma w żadnym wyborze ekwipunku (ręce, części ciała)", await t.eval("Equipment.SLOTS.every(s => !Equipment.choices(s.id).some(c => c.id === 172))"));
    const pend = await t.json(`(function(){ const v = SceneManager._scene._views.item, l = v._list, i = l._data.findIndex(it => it && it.id === 172); l.select(i); l.ensureCursorVisible(false); v._detail.setItem(l.item());
        return { i, item: v._detail._item ? v._detail._item.id : 0, keep: MenuPanel.isKeepsake($dataItems[172]), axe: MenuPanel.isKeepsake($dataItems[60]) }; })()`);
    await t.frames(6);
    t.check("karta wisiorka: „Pamiątka” (nie do sprzedania ani wyrzucenia); siekiera nie jest pamiątką", pend.i >= 0 && pend.item === 172 && pend.keep && !pend.axe, pend);
    await t.shot(path.join(OUT, "plecak_pamiatki.png"));
    const ends = await t.json(`(function(){ const l = SceneManager._scene._views.item._list, h = l._heads; for (let k = 1; k < h.length; k++) if (h[k].index - 1 >= 0 && !l._data[h[k].index - 1]) { let i = h[k].index - 1; while (!l._data[i]) i--; l.select(i); return { from: i, to: h[k].index }; } return null; })()`);
    if (ends) {
        m = await key("D");
        t.check("D na końcu grupy: pierwsza rzecz następnej grupy (puste miejsca pominięte)", m.bag.index === ends.to, { ends, index: m.bag.index });
    }
    m = await key("Tab", 6);
    const names = await t.json("SceneManager._scene._views.item._list._data.filter(Boolean).map(it => it.name)");
    t.check("Tab: porządek Nazwa (alfabetycznie, bez nagłówków)", m.bag.sort === "name" && !m.bag.heads.length && names.every((n, i) => i === 0 || names[i - 1].localeCompare(n, "pl") <= 0), names.slice(0, 6));
    m = await key("Tab", 6);
    const counts = await t.json("SceneManager._scene._views.item._list._data.filter(Boolean).map(it => $gameParty.numItems(it))");
    t.check("Tab: porządek Ilość (najwięcej pierwsze)", m.bag.sort === "count" && counts.every((n, i) => i === 0 || counts[i - 1] >= n), counts.slice(0, 8));
    await t.eval("$gameParty.gainItem($dataItems[104], 1); SceneManager._scene._views.item.refresh(); 0");
    m = await key("Tab", 6);
    t.check("Tab: porządek Najnowsze (ostatnio zdobyte zioła pierwsze)", m.bag.sort === "new" && m.bag.data[0] === 104, m.bag.data.slice(0, 5));
    await shot("plecak_najnowsze");
    t.check("porządek zapamiętany w ustawieniach", (await t.eval("ConfigManager.makeData().bagSort")) === "new");
    const nb = await t.json("SceneManager._scene._views.item._sortBoxes.find(b => b.mode === 'groups')");
    await t.click((nb.x0 + nb.x1) / 2, (nb.y0 + nb.y1) / 2);
    await t.frames(8);
    m = await info();
    t.check("klik w „Grupy” w stopce: z powrotem grupy", m.bag.sort === "groups" && m.bag.heads.length >= 4, m.bag.sort);
    await t.eval("(function(){ const l = SceneManager._scene._views.item._list; l.select(0); l.ensureCursorVisible(false); SceneManager._scene._views.item.focusGrid(true); return 0; })()");
    await t.frames(4);
    const mat = await t.json(`(function(){ const v = SceneManager._scene._views.item, l = v._list; const i = l._data.findIndex(it => it && !$gameParty.canUse(it)); if (i >= 0) l.select(i); return { i, id: l.item() ? l.item().id : 0 }; })()`);
    const n0 = await t.count(mat.id);
    await key("O", 6);
    const note = await t.eval("SceneManager._scene._views.item._detail._note");
    t.check("O na materiale: karta mówi, czemu nie (nic nie ubywa)", mat.i >= 0 && /^Tego/.test(note || "") && (await t.count(mat.id)) === n0, { mat, note });
    m = await key("P", 6);
    t.check("P w siatce: kategorie (poziom 2)", m.level === 2 && m.bag.cats, m.level);
    m = await key("P", 6);
    t.check("P w kategoriach: pasek zakładek (poziom 1)", m.level === 1, m.level);
    await t.key("P");
    t.check("P na pasku zakładek zamyka menu", await t.until(t.onMap(), 10));
    await t.frames(10);

    // ---------------------------------------------------------------- J: the journal's list at once (level 3); its sections: level 2
    await t.key("J");
    t.check("J otwiera menu na liście Dziennika (poziom 3)", (await t.until(inMenu, 10)) && (await t.frames(30), (await info()).active === "journal"));
    m = await info();
    t.check("dziennik: lista ma klawisze", m.level === 3 && m.activeWindows.includes("Window_JournalList") && m.journal.tab === 0, m.journal);
    const items0 = m.journal.items;
    m = await key("D", 6);
    t.check("dziennik: D w liście nie zmienia działu (działy są poziom wyżej)", m.journal.tab === 0, m.journal);
    m = await key("P", 6);
    t.check("P: działy dziennika (poziom 2)", m.level === 2 && m.keys[0] === "dział", m.keys);
    m = await key("D", 6);
    t.check("działy: D następny (lista pokazuje go od razu)", m.journal.tab === 1, m.journal);
    m = await key("A", 6);
    m = await key("O", 6);
    t.check("A, O: z powrotem pierwszy dział i lista (poziom 3)", m.journal.tab === 0 && m.journal.items === items0 && m.level === 3, m.journal);
    if (items0 > 1) {
        m = await key("S");
        t.check("dziennik: S następna pozycja", m.journal.index === 1, m.journal);
    }
    const long = await t.json(`(function(){ const v = SceneManager._scene._views.journal, J = Journal, d = v._detail;
        for (let tab = 0; tab < J.TABS.length; tab++) { const items = J.itemsForTab(tab);
            for (let i = 0; i < items.length; i++) { d.setDetail(J.detailFor(tab, items[i])); if (d.contentsHeight() > d.innerHeight + 40) { v._tab = tab; v.showTab(false); v._list.select(i); v._list.updateHelp(); return { tab, i }; } } }
        v._tab = 0; v.showTab(false); return null; })()`);
    if (long) {
        await t.eval("Input._currentState.shift = true; 0");
        await t.key("ArrowDown");
        await t.key("ArrowDown");
        await t.eval("Input._currentState.shift = false; 0");
        await t.frames(4);
        m = await info();
        t.check("dziennik: Shift + ↓ przewija opis (pozycja zostaje)", m.journal.scroll > 0 && m.journal.index === long.i, { long, j: m.journal });
    } else t.check("dziennik: (żaden opis nie jest dłuższy od okna - przewijanie pominięte)", true);
    await shot("dziennik");

    // ---------------------------------------------------------------- Zakończ grę: no sub-tabs - O straight to the list; Anuluj -> level 1
    await key("P", 6);
    m = await key("P", 6);
    t.check("P, P: z listy dziennika na pasek zakładek", m.level === 1 && m.active === "journal", m.level);
    await tab("D");
    await tab("D");
    m = await tab("D");
    m = await key("O", 6);
    t.check("D trzy razy (Opcje, Zapisz grę), O: Zakończ grę od razu na liście (bez podzakładek)", m.active === "gameEnd" && m.level === 3 && m.end && m.end.sel === "title", { active: m.active, level: m.level });
    await shot("koniec");
    m = await key("S");
    t.check("zakończ: S „Wyjdź z gry”", m.end.sel === "exit", m.end);
    m = await key("S");
    t.check("zakończ: S „Anuluj”", m.end.sel === "back", m.end);
    m = await key("O", 6);
    t.check("O na „Anuluj”: z powrotem pasek zakładek (gra trwa)", m.active === "gameEnd" && m.level === 1 && (await t.eval(inMenu)), { active: m.active, level: m.level });

    // ---------------------------------------------------------------- Opcje: A A, O; W / S the rows, A / D a value; P up
    await tab("A");
    m = await tab("A");
    m = await key("O", 6);
    t.check("opcje: lista ma klawisze (poziom 3), pierwszy wiersz „Wygląd”", m.active === "options" && m.level === 3 && m.options.symbol === "uiClean" && m.activeWindows.includes("Window_Options"), m.options);
    m = await key("S");
    t.check("opcje: S następny wiersz", m.options.index === 1, m.options);
    await t.eval(`(function(){ const w = SceneManager._scene._views.options._win; w.select(w.findSymbol("seVolume")); return 0; })()`);
    const se0 = await t.eval("ConfigManager.seVolume");
    await key("A");
    const se1 = await t.eval("ConfigManager.seVolume");
    await key("D");
    t.check("opcje: A / D zmieniają głośność (i z powrotem)", se1 !== se0 && (await t.eval("ConfigManager.seVolume")) === se0, { se0, se1 });
    await shot("opcje");
    m = await key("P", 6);
    t.check("P w opcjach: pasek zakładek (bez podzakładek)", m.level === 1 && m.active === "options", m.level);

    // ---------------------------------------------------------------- Zapisz grę: D, O; S a file, O saves there
    await tab("D");
    m = await key("O", 6);
    t.check("zapis: lista plików ma klawisze (poziom 3)", m.active === "save" && m.level === 3 && m.activeWindows.includes("Window_SavefileList"), m.save);
    const id0 = m.save.id;
    m = await key("S");
    t.check("zapis: S następny plik", m.save.id === id0 + 1, m.save);
    await t.key("O");
    const saved = await t.until("(function(){ const i = MenuRing.info(); return !!(i && i.save && /^Zapisano/.test(i.save.note)); })()", 15);
    m = await info();
    const sinfo = await t.json(`DataManager.savefileInfo(${m.save.id})`);
    t.check("O zapisuje grę w tym pliku (dzień, miejsce, czas gry w opisie pliku)", saved && sinfo && sinfo.day === 40 && !!sinfo.place && !!sinfo.playtime, sinfo);
    // (2026-10-17) a save from before the place was kept: the place read once from the file itself (its map's name), never a "-"
    await t.eval(`(function(){ const id = ${m.save.id}; delete DataManager._globalInfo[id].place; MenuRing.placeFill.tried.delete(id); MenuRing.fillOldPlaces(); return 0; })()`);
    const oldPlace = await t.until(`!!(DataManager.savefileInfo(${m.save.id}) || {}).place`, 10);
    const pinfo = await t.json(`DataManager.savefileInfo(${m.save.id})`);
    t.check("stary zapis bez miejsca: miejsce odczytane z pliku (nazwa mapy) i zapamiętane na liście", oldPlace && pinfo.place === sinfo.place, { before: sinfo.place, after: pinfo.place });
    await shot("zapis");

    // ---------------------------------------------------------------- P up, P out
    m = await key("P", 6);
    t.check("P: pasek zakładek", m.level === 1, m.level);
    await t.key("Escape");
    t.check("Esc na pasku zakładek zamyka menu (jak P)", await t.until(t.onMap(), 10));
    await t.frames(10);

    // ---------------------------------------------------------------- the classic look: the old menu as it was
    await t.eval("ConfigManager.uiClean = false; 0");
    await t.key("P");
    await t.until(inMenu, 10);
    await t.frames(20);
    t.check("Klasyczny: stare menu (panel i lista poleceń), bez zakładek", (await t.eval("SceneManager._scene._menuPanel.visible && SceneManager._scene._commandWindow.visible && !SceneManager._scene._grafit")) && (await info()) === null);
    await t.key("Escape");
    await t.until(t.onMap(), 10);
    await t.eval("ConfigManager.uiClean = true; 0");
});
