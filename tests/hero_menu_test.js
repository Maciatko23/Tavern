// P -> Postać (Combat.js + Skills_Data.js + MenuPanel.js): the command with its count of points, the Atrybuty page (←/→ plan, Enter
// asks, Tak gives them out, Esc drops a plan), Umiejętności (the ten fields on the left, → into a tree, ← / Esc out; the arrows walk
// the boxes; a closed one buzzes, an open one is learnt after the question, rank by rank; Q/E only the two tabs), level 100, attributes 60.
const { launch, sleep } = require("./cdp.js");
const OUT = process.argv[2] || "";
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev("ConfigManager.uiClean = false; 0");   // (the classic look: this test checks the old panels' places - CleanHUD.js's clean look is tests/clean_hud_test.js)
        await ev(`(function(){ DataManager.setupNewGame(); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging()").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const down = code => ev(`Input._onKeyDown({ keyCode: ${code}, preventDefault() {} }); 0`);
        const up = code => ev(`Input._onKeyUp({ keyCode: ${code} }); 0`);
        const key = async (code, hold = 3) => { await down(code); await frames(hold); await up(code); await frames(4); };
        const ENTER = 13, ESC = 27, RIGHT = 39, LEFT = 37, DOWNK = 40, UPK = 38, E = 69, Q = 81;
        const scene = () => ev("SceneManager._scene.constructor.name");
        const waitScene = async name => { for (let i = 0; i < 60 && (await scene()) !== name; i++) await frames(3); return scene(); };

        check("the numbers: level 100 at most, attributes up to 60, 3 attribute points and 1 skill point a level; 10 trees, ~100 skills",
            (await J("({ max: Combat.MAX_LEVEL, attr: Combat.ATTR_MAX, pts: Combat.POINTS_PER_LEVEL, trees: Combat.TREES.length, skills: Combat.SKILLS.length })")).max === 100 &&
            (await ev("Combat.ATTR_MAX")) === 60 && (await ev("Combat.TREES.length")) === 10 && (await ev("Combat.SKILLS.length")) >= 90);
        // level 2: 3 attribute points, 1 skill point
        await ev("SceneManager._scene.startFadeIn(1,false); Combat.gainXp(Combat.xpToNext(1), 'test'); 0");
        await frames(40);
        const h0 = await J("({ lv: Combat.hero().level, p: Combat.hero().points, s: Combat.hero().skillPoints, unspent: Combat.unspent() })");
        check("level 2 brings 3 attribute points and 1 skill point", h0.lv === 2 && h0.p === 3 && h0.s === 1 && h0.unspent === 4, h0);

        // ================= the P menu =================
        await ev("SceneManager.push(Scene_Menu); 0");
        await waitScene("Scene_Menu");
        await frames(20);
        const menu = await J("(function(){ const w = SceneManager._scene._commandWindow; return { list: w._list.map(c => c.symbol), i: w._list.findIndex(c => c.symbol === 'hero') }; })()");
        check("the P menu has 'Postać' first (then Plecak, Dziennik - MenuPanel)", menu.i === 0 && menu.list[1] === "item" && menu.list[2] === "journal", menu);
        await ev(`SceneManager._scene._commandWindow.select(${menu.i}); 0`);
        await key(ENTER);
        check("Enter on it opens the Postać scene", (await waitScene("Scene_Hero")) === "Scene_Hero");
        await frames(20);

        // ================= Atrybuty =================
        const t0 = await J("(function(){ const s = SceneManager._scene; return { tab: s._tab, items: s._list.maxItems(), panel: !!s._menuPanel, active: s._list.active, tree: s._tree.visible, index: s._list.index() }; })()");
        check("it opens on Atrybuty: five attributes in the panel, the first chosen (the tree hidden)", t0.tab === 0 && t0.items === 5 && t0.panel && t0.active && !t0.tree && t0.index === 0, t0);
        await key(RIGHT); await key(RIGHT);
        const p1 = await J("({ plan: SceneManager._scene._plan, str: Combat.hero().attr.str, points: Combat.hero().points })");
        check("→ twice on Siła: two points planned, nothing given out yet", p1.plan.str === 2 && p1.str === 5 && p1.points === 3, p1);
        await key(RIGHT); await key(RIGHT);
        check("no more than the free points (3)", (await J("SceneManager._scene._plan.str")) === 3);
        // the table "co daje teraz -> po rozdaniu": no two texts on one line run over each other (the user's screenshot, 2026-09-25)
        const overlap = await J(`(function(){ const s = SceneManager._scene, w = s._detail, t = [];
            const d = w.drawText; w.drawText = function(text, x, y, width, align) { const tw = this.textWidth(String(text)), l = align === "right" ? x + width - tw : align === "center" ? x + (width - tw) / 2 : x;
                t.push({ text: String(text), y, l, r: l + tw }); return d.apply(this, arguments); };
            s.refreshDetail(); w.drawText = d;
            const bad = [];
            for (const a of t) for (const b of t) if (a !== b && a.y === b.y && a.l < b.l && a.r > b.l - 4) bad.push(a.text + " / " + b.text);
            return { bad, rows: t.filter(x => /^zwykłe$|^→ o .* mniej uderzeń$/.test(x.text)).map(x => x.text + " @" + Math.round(x.l) + "-" + Math.round(x.r) + "," + x.y) }; })()`);
        check("Siła with 3 planned: its table has no texts running over each other ('zwykłe' → 'o 1,5% mniej uderzeń')", overlap.bad.length === 0 && overlap.rows.length === 2, overlap);
        await b.shot(OUT + "hero_attr_table.png");
        await key(LEFT);
        await key(DOWNK); await key(DOWNK);   // Kondycja
        await key(RIGHT);
        const p2 = await J("SceneManager._scene._plan");
        check("← takes one back, ↓↓ → puts one on Kondycja", p2.str === 2 && p2.con === 1, p2);
        await key(ESC);
        const p3 = await J("({ plan: SceneManager._scene._plan, scene: SceneManager._scene.constructor.name })");
        check("Esc with a plan: the plan is dropped, the scene stays", Object.keys(p3.plan).length === 0 && p3.scene === "Scene_Hero", p3);
        await key(RIGHT); await key(RIGHT);   // (Kondycja is still chosen)
        await key(ENTER);
        const ask = await J("(function(){ const c = SceneManager._scene._confirm; return { visible: c.visible, active: c.active, lines: c._lines, index: c.index() }; })()");
        check("Enter asks first: 'Rozdać punkty?' with what changes", ask.visible && ask.active && ask.lines[0] === "Rozdać punkty?" && /Kondycja 5 → 7/.test(ask.lines[1]), ask);
        const mhp0 = await ev("$gameParty.leader().mhp");
        await key(ENTER);   // Tak
        const given = await J("({ con: Combat.hero().attr.con, points: Combat.hero().points, mhp: $gameParty.leader().mhp, hp: $gameParty.leader().hp, confirm: SceneManager._scene._confirm.visible, plan: SceneManager._scene._plan })");
        check("Tak: Kondycja 7, one point left, +10 health (5 a point), full", given.con === 7 && given.points === 1 && given.mhp === mhp0 + 10 && given.hp === given.mhp && !given.confirm && Object.keys(given.plan).length === 0, { mhp0, ...given });
        if (OUT) { await frames(6); await b.shot(OUT + "hero_attributes.png"); }

        // ================= the trees =================
        const tree = () => J(`(function(){ const s = SceneManager._scene, t = s._tree, d = s._domains, sk = t._nodes[t.index()]; return { tab: s._tab, tabIndex: s._tabs.index(), focus: s._focus,
            domains: d.visible, domainsActive: d.active, field: d.index(), treeVisible: t.visible, treeActive: t.active, list: s._list.visible,
            treeId: t._treeId, nodes: t._nodes.length, chosen: sk ? sk.id : null, splits: s._menuPanel && s._menuPanel._spec.splits }; })()`);
        await key(E);
        let t1 = await tree();
        check("E: Umiejętności - the ten fields on the left (Walka wręcz chosen), its tree beside them (not entered yet), the panel split in three",
            t1.tab === 1 && t1.tabIndex === 1 && t1.focus === "domains" && t1.domains && t1.domainsActive && t1.field === 0 && t1.treeVisible && !t1.treeActive && !t1.list &&
            t1.treeId === "melee" && t1.nodes === 12 && t1.chosen === null && JSON.stringify(t1.splits) === "[235,795]", t1);
        await key(DOWNK);
        t1 = await tree();
        check("↓ on the list: Obrona, and its tree shows at once", t1.field === 1 && t1.treeId === "defense" && t1.focus === "domains", t1);
        if (OUT) { await frames(6); await b.shot(OUT + "hero_fields.png"); }
        await key(UPK);
        await key(RIGHT);
        t1 = await tree();
        check("→ goes into the tree (Walka wręcz): its root chosen", t1.focus === "tree" && t1.treeActive && !t1.domainsActive && t1.chosen === "m_power", t1);
        // the arrows walk the boxes
        await key(DOWNK);
        const d1 = (await tree()).chosen;
        await key(RIGHT);
        const d2 = (await tree()).chosen;
        await key(UPK);
        const d3 = (await tree()).chosen;
        check("↓ goes to a box of the next row, → to its neighbour, ↑ back up", ["combo4", "charge"].includes(d1) && d2 !== d1 && d3 === "m_power", { d1, d2, d3 });
        // a closed one: Rozpęd (Mocna ręka first)
        const iCharge = await ev("SceneManager._scene._tree._nodes.findIndex(s => s.id === 'charge')");
        await ev(`SceneManager._scene._tree.select(${iCharge}); 0`);
        await key(ENTER);
        const locked = await J("({ confirm: SceneManager._scene._confirm.visible, known: Combat.skillRank('charge'), why: Combat.skillBlock('charge') })");
        check("a closed skill (Rozpęd: Mocna ręka first, Siła 12, level 4): no question, not learnt", !locked.confirm && locked.known === 0 && /Najpierw|Wymaga/.test(locked.why), locked);
        // the root: learnt after the question, rank 1 of 3
        await ev(`SceneManager._scene._tree.select(0); 0`);
        await key(ENTER);
        const ask2 = await J("SceneManager._scene._confirm._lines");
        await key(ENTER);
        const learnt = await J("({ rank: Combat.skillRank('m_power'), s: Combat.hero().skillPoints, perk: Combat.perk('melee.dmg'), unspent: Combat.unspent() })");
        check("Mocna ręka: asked (1/3), then learnt - rank 1, the point spent, melee damage +5%", /Mocna ręka/.test(ask2[0]) && /1\/3/.test(ask2[0]) && learnt.rank === 1 && learnt.s === 0 && Math.abs(learnt.perk - 0.05) < 1e-9 && learnt.unspent === 1, { ask2, learnt });
        await key(ENTER);
        check("no point left: the next rank is not given", (await ev("Combat.skillRank('m_power')")) === 1 && !(await ev("SceneManager._scene._confirm.visible")));
        if (OUT) { await frames(6); await b.shot(OUT + "hero_tree_melee.png"); }
        // out of the tree: ← at its left edge, Esc
        await key(DOWNK);   // (a box of the second row, left: Płynne kombo)
        await ev(`SceneManager._scene._tree.select(SceneManager._scene._tree._nodes.findIndex(s => s.id === 'combo4')); 0`);
        await key(LEFT);
        t1 = await tree();
        check("← with nothing more to the left: back on the list of fields", t1.focus === "domains" && t1.domainsActive && !t1.treeActive && t1.field === 0, t1);
        await key(RIGHT);
        await key(ESC);
        t1 = await tree();
        check("Esc in the tree: back on the list too (the scene stays)", t1.focus === "domains" && (await scene()) === "Scene_Hero", t1);
        // Q / E: only the two tabs, the chosen field is kept
        for (let i = 0; i < 9; i++) await key(DOWNK);
        t1 = await tree();
        check("↓ down the list to the last field: Kuchnia", t1.field === 9 && t1.treeId === "cooking", t1);
        if (OUT) { await frames(6); await b.shot(OUT + "hero_tree_cooking.png"); }
        await key(E);
        check("E: Atrybuty (only two tabs)", (await tree()).tab === 0);
        await key(Q);
        t1 = await tree();
        check("Q: Umiejętności again, still on Kuchnia", t1.tab === 1 && t1.field === 9 && t1.treeId === "cooking", t1);
        await key(ESC);
        check("Esc on the list: back to the P menu", (await waitScene("Scene_Menu")) === "Scene_Menu");

        // ================= a skill's way and its ranks, without the screen =================
        await ev("SceneManager.goto(Scene_Map); 0");
        await waitScene("Scene_Map");
        await frames(20);
        const low = await J("({ lv: Combat.hero().level, why: Combat.skillBlock('riposte') })");
        check("at a low level the second rows are closed: Kontra wants level 10", low.why === "Wymaga poziomu 10.", low);
        await ev("while (Combat.hero().level < 12) Combat.gainXp(Combat.xpToNext(Combat.hero().level), 'test'); Combat.hero().skillPoints = 20; 0");
        const way = await J(`({ riposte: Combat.skillBlock('riposte'), combo: Combat.learnSkill('combo4'), riposte2: Combat.skillBlock('riposte'), deep: Combat.skillBlock('m_master') })`);
        check("the way (level 12): Kontra opens only after Płynne kombo, then wants Czujność 12; the deepest want level 48", /Najpierw: Płynne kombo/.test(way.riposte) && way.combo === true && way.riposte2 === "Wymaga: Czujność 12." && way.deep === "Wymaga poziomu 48.", way);
        const ranks = await J(`(function(){ const a = Combat.learnSkill('m_power'), b = Combat.learnSkill('m_power'), c = Combat.learnSkill('m_power'); return { a, b, c, rank: Combat.skillRank('m_power'), perk: Math.round(Combat.perk('melee.dmg') * 100) / 100, why: Combat.skillBlock('m_power') }; })()`);
        check("ranks: Mocna ręka up to 3 (+15% melee damage), no fourth", ranks.a && ranks.b && !ranks.c && ranks.rank === 3 && ranks.perk === 0.15 && /najwyższy/.test(ranks.why), ranks);

        // ================= what the points really do: one more point in each attribute, through the screen =================
        const stats = () => J(`({ str: Combat.hero().attr.str, dex: Combat.hero().attr.dex, con: Combat.hero().attr.con, per: Combat.hero().attr.per, wil: Combat.hero().attr.wil,
            strMult: Math.round(Combat.strMult() * 1000) / 1000, poise: Math.round(Combat.poiseMult() * 1000) / 1000, carry: Combat.carryBonus(), cap: Survival.weightCap(),
            combo: Combat.comboWindow(), aim: Math.round(Combat.aimSteady() * 1000) / 1000,
            mhp: $gameParty.leader().mhp, breath: Combat.baseBreath(), down: Combat.knockdownAt(), crit: Math.round(Combat.critChance() * 1000) / 10 })`);
        await ev("Combat.gainXp(Combat.xpToNext(Combat.hero().level) + Combat.xpToNext(Combat.hero().level + 1), 'test'); 0");   // two levels: 6 more points
        await frames(30);
        const b0 = await stats();
        await ev("SceneManager.push(Combat.Scene_Hero); 0");
        await waitScene("Scene_Hero");
        await frames(20);
        for (let row = 0; row < 4; row++) { await ev(`SceneManager._scene._list.select(${row}); 0`); await key(RIGHT); }
        await key(ENTER); await key(ENTER);   // "Rozdać punkty?" -> Tak
        await key(ESC);
        await waitScene("Scene_Menu"); await ev("SceneManager.goto(Scene_Map); 0"); await waitScene("Scene_Map"); await frames(20);
        const b1 = await stats();
        check("one point each through the screen: Siła, Zręczność, Kondycja, Czujność +1 (Hart ducha untouched)", b1.str === b0.str + 1 && b1.dex === b0.dex + 1 && b1.con === b0.con + 1 && b1.per === b0.per + 1 && b1.wil === b0.wil, { b0, b1 });
        check("Siła (small steps now, up to 60): blows +3.5%, balance +4.5%, 1 more carried", Math.abs(b1.strMult - b0.strMult - 0.035) < 0.002 && Math.abs(b1.poise - b0.poise - 0.045) < 0.002 && b1.carry === b0.carry + 1 && b1.cap === b0.cap + 1, { b0, b1 });
        check("Zręczność: 1 frame more for the series, aiming 1% quicker", b1.combo === b0.combo + 1 && Math.abs(b0.aim - b1.aim - 0.01) < 0.002, { b0, b1 });
        check("Kondycja: +5 health, +2 breath, knocked down only by a harder blow (+1.8)", b1.mhp === b0.mhp + 5 && b1.breath === b0.breath + 2 && b1.down - b0.down >= 1 && b1.down - b0.down <= 2, { b0, b1 });
        check("Czujność: criticals 0.7% likelier", Math.abs(b1.crit - b0.crit - 0.7) < 0.05, { b0, b1 });
        // they stay after a save and a load (and so do the skills)
        await ev("$gameSystem.onBeforeSave(); window.__save = JsonEx.stringify(DataManager.makeSaveContents()); 0");
        await ev("Combat.hero().attr.str = 5; Combat.hero().attr.con = 5; Combat.hero().skills = {}; 0");
        await ev("DataManager.extractSaveContents(JsonEx.parse(window.__save)); 0");
        await frames(5);
        const b2 = await stats();
        check("after saving and loading the points and the skills are still there", b2.str === b1.str && b2.con === b1.con && b2.mhp === b1.mhp && (await ev("Combat.skillRank('m_power')")) === 3 && Math.abs((await ev("Combat.perk('melee.dmg')")) - 0.15) < 1e-9, { b1, b2 });

        // ================= level 100 =================
        await ev("(function(){ let t = 0; for (let L = 1; L < 100; L++) t += Combat.xpToNext(L); Combat.gainXp(t, 'test'); })(); 0");   // (all of it to 100)
        await frames(10);
        const top = await J("({ lv: Combat.hero().level, xp: Combat.hero().xp, more: Combat.gainXp(100, 'x') })");
        check("level 100 is the top: no more experience after it", top.lv === 100 && top.xp === 0 && top.more === 0, top);
        const deep = await J("({ ok: Combat.skillBlock('m_master'), row: Combat.ROW_LEVEL })");
        check("the deepest skills ask for level 48 (rows: 1, 4, 10, 20, 32, 48)", JSON.stringify(deep.row) === "[1,4,10,20,32,48]", deep);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
