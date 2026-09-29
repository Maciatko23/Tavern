// Smoke: the farm on grandpa's field (Map003) - Q opens the build menu, a bench put up on a site with the hammer blow by blow, the
// workbench makes a stone axe, the kiln burns charcoal while the hours pass, potatoes raked, hoed, sown, grown and dug up, and the
// farm's state in a save. (site_test, workbench_test, craft_test, survival_test... have each part in full.)
// Stage 3 (batch E1, Farming on the core and split in five): the files in the page, each once; what building, crafting and a harvest
// tell the bus (build, craft, harvest). REGISTERED=1: the parts stand in the page's plugin list right under Farming, as the plugin
// manager will list them (js/plugins.js itself is not touched); without it Farming.js puts them into the page itself.
const kit = require("../lib/kit.js");
const PARTS = ["Farming_Plots", "Farming_Build", "Farming_Stations", "Farming_UI"];
const REGISTERED = process.env.REGISTERED ? `(function(){
    let real;
    const mk = name => ({ name, status: true, description: "", parameters: {} });
    Object.defineProperty(window, "$plugins", { configurable: true, get() { return real; }, set(v) {
        const list = v.filter(p => !${JSON.stringify(PARTS)}.includes(p.name)), at = list.findIndex(p => p.name === "Farming");
        list.splice(at + 1, 0, ...${JSON.stringify(PARTS)}.map(mk));
        real = list;
    } });
})();` : undefined;

kit.test({ beforeLoad: REGISTERED }, async t => {
    await t.newGame({ map: 3, x: 22, y: 14, hour: 9, quiet: true });
    const count = id => t.count(id);
    // ---- Farming in five files, each in the page once (registered: right under Farming); the bus listened to from here on
    const fam = await t.json(`({ parts: Object.keys(Tawerna.api("Farming_parts") || {}), scripts: ["Farming"].concat(${JSON.stringify(PARTS)}).map(n => document.querySelectorAll('script[src$="/' + n + '.js"]').length),
        order: $plugins.map(p => p.name).filter(n => /^Farming/.test(n)), api: Tawerna.api("Farming") === Farming })`);
    t.check("Farming in five files (the state, the API and the hooks; the ground; building; the stations; the menus), each in the page once" + (REGISTERED ? " - registered: " + fam.order.join(", ") : " - the parts put in by Farming.js"),
        fam.api && fam.parts.join() === "core,plots,build,stations,ui" && fam.scripts.join() === "1,1,1,1,1" && (!REGISTERED || fam.order.join() === "Farming_Data,Farming," + PARTS.join() + ",Farming_Render"), fam);
    await t.eval(`window.__fe = []; for (const n of ["build", "craft", "harvest"]) Tawerna.on(n, e => window.__fe.push(Object.assign({ ev: n }, e)), { owner: "smoke/farm" }); 0`);
    // an open meadow for it all (natural soil, no bush, nothing standing: 10 x 6 tiles)
    const B = await t.json(`(function(){
        for (let by = 2; by < $gameMap.height() - 8; by++) for (let bx = 2; bx < $gameMap.width() - 12; bx++) {
            let ok = true;
            for (let y = by; y < by + 6 && ok; y++) for (let x = bx; x < bx + 10; x++) { const p = Farming.plotAt(x, y); if (!p || p.s !== "cleared" || $gameMap.eventsXy(x, y).length) { ok = false; break; } }
            if (ok) return { bx, by };
        }
        return null; })()`);
    t.check("an open meadow on the field", !!B, B);
    const { bx, by } = B;
    await t.locate(bx + 2, by + 3, 6);
    await t.eval("$gameSystem.setStamina(100); 0");

    // ---- Q: the build menu
    await t.key("Q");
    await t.frames(10);
    const menu = await t.json("(function(){ const sc = SceneManager._scene, m = sc._farmMenu; return { open: !!$gameTemp._farmMenuOpen, kind: sc._farmKind, names: (m && m._entries || []).map(e => e.name) }; })()");
    t.check("Q opens the build menu with the workbench and the bench in it", menu.open && menu.kind === "build" && menu.names.includes("Warsztat") && menu.names.includes("Ławka"), menu);
    await t.key("Q");
    await t.frames(10);
    t.check("...Q again closes it", !(await t.eval("!!$gameTemp._farmMenuOpen")));

    // ---- a bench: a building site, the hammer blow by blow
    await t.give(80, 2); await t.give(89, 1);
    const sx = bx + 3, sy = by + 3;
    const placed = await t.eval(`Farming.placeSite("bench", ${sx}, ${sy})`);
    const need = await t.eval(`(Farming.buildingAt(${sx}, ${sy}) || {}).site ? Farming.buildingAt(${sx}, ${sy}).site.need : 0`);
    t.check("the bench's site is marked (its planks spent)", placed && need > 0 && (await count(80)) === 0, { placed, need });
    let blows = 0;
    while (blows < 20 && (await t.eval(`!!(Farming.buildingAt(${sx}, ${sy}) || {}).site`))) {
        await t.eval(`$gameSystem.setStamina(100); Farming.strikeSite(Farming.buildingAt(${sx}, ${sy}), ${sx}, ${sy}); 0`);
        await t.until("!$gamePlayer.isToolSwinging()", 10, 100);
        await t.frames(4);
        blows++;
    }
    t.check("the hammer's blows finish it: " + blows + " blows, 'Gotowe: Ławka'", blows === need && (await t.popups()).some(p => /Gotowe: Ławka/.test(p)), { blows, need });

    // ---- the workbench (F9's placer: finished) makes a stone axe
    await t.eval(`Farming.placeFree("workbench", ${bx + 6}, ${by + 1}); 0`);
    await t.give(77, 5); await t.give(64, 2); await t.give(92, 3);
    const axe = await t.eval(`(function(){ $gameSystem.setStamina(100); const b = Farming.buildingAt(${bx + 6}, ${by + 1}); return Farming.craftManual(b, Farming.BUILDINGS.workbench.recipes.find(r => r.id === "axe_stone")); })()`);
    await t.until("!$gamePlayer.isToolSwinging() && !($gameTemp._farmLock > 0)", 15, 100);
    await t.frames(30);
    t.check("the workbench makes a stone axe from branches, stones and flax", axe && (await count(60)) === 1 && (await count(77)) === 0, { axe, axes: await count(60) });

    // ---- the kiln burns charcoal while the hours pass
    await t.eval(`Farming.placeFree("kiln", ${bx + 3}, ${by + 5}); 0`);
    await t.give(61, 6); await t.give(78, 2);
    const kx = bx + 3, ky = by + 5;
    const job = await t.eval(`(function(){ $gameSystem.setStamina(100); return Farming.startJob(Farming.buildingAt(${kx}, ${ky}), "charcoal"); })()`);
    await t.frames(20);
    await t.eval("$gameSystem.advanceDayNight(7); 0");
    await t.frames(10);
    const ready = await t.eval(`Farming.jobReady(Farming.buildingAt(${kx}, ${ky}))`);
    await t.eval(`Farming.collectJob(Farming.buildingAt(${kx}, ${ky})); 0`);
    await t.frames(10);
    t.check("the kiln: a charcoal job started, ready 7 hours later, collected (3 charcoal)", job && ready && (await count(79)) === 3, { job, ready, coal: await count(79) });

    // ---- potatoes: raked, hoed, sown, grown (the days Farming.daysLeft says), dug up (spring)
    await t.setDay(3, 9);
    await t.give(65, 1); await t.give(66, 1); await t.give(67, 2);
    const px = bx + 8, py = by + 4;
    await t.eval(`Farming.placeFree("scarecrow", ${px - 1}, ${py - 2}); 0`);   // (birds raid a patch with no scarecrow near - even while away)
    for (const step of [`Farming.rake(${px}, ${py})`, `Farming.till(${px}, ${py})`, `Farming.plant(${px}, ${py}, "potato")`]) {
        await t.eval(`$gameSystem.setStamina(100); ${step}; 0`);
        await t.until("!$gamePlayer.isToolSwinging()", 10, 100);
        await t.frames(6);
    }
    const sown = await t.json(`Farming.plotAt(${px}, ${py})`);
    t.check("a potato sown in a hoed plot", sown && sown.s === "tilled" && sown.crop === "potato", sown);
    const left = await t.eval(`Farming.daysLeft(${px}, ${py}, Farming.plotAt(${px}, ${py}))`);   // (the growth rate: Farming's params)
    await t.eval(`$gameSystem.advanceDayNight(24 * ${left}); $gameSystem.setDayNightHour(10); 0`);
    await t.frames(20);
    const ripe = await t.eval(`Farming.isRipe(${px}, ${py}, Farming.plotAt(${px}, ${py}))`);
    const had = await count(71);
    await t.eval(`$gameSystem.setStamina(100); Farming.harvest(${px}, ${py}); 0`);
    await t.until("!$gamePlayer.isToolSwinging()", 10, 100);
    await t.frames(10);
    t.check("the days it needs later it is ripe and dug up: potatoes in the bag", ripe && (await count(71)) > had, { left, ripe, potatoes: await count(71) });

    // ---- what the bus heard (Farming's events: build, craft, harvest)
    const fe = await t.json("window.__fe.map(e => e.ev + ':' + (e.type || e.station || e.crop) + ':' + (e.done === undefined ? e.item + 'x' + e.n : e.done + ':' + e.how))");
    const heard = s => fe.includes(s);
    t.check("the bus heard it: build (the bench's site, then done with the hammer; the F9 placer), craft (the workbench's axe, the kiln's charcoal), harvest (potatoes)",
        heard("build:bench:false:site") && heard("build:bench:true:hammer") && heard("build:workbench:true:free") && heard("craft:workbench:60x1") && heard("craft:kiln:79x3") &&
        fe.some(s => /^harvest:potato:71x\d+$/.test(s)), fe);

    // ---- the farm in a save
    const farm = () => t.json(`(function(){ const f = Farming.farm(); return { buildings: (f.buildings[3] || []).map(b => b.type + "@" + b.x + "," + b.y), plots: Object.keys(f.plots[3] || {}).length }; })()`);
    const before = await farm();
    await t.saveTo(1);
    await t.loadFrom(1, { quiet: true });
    const after = await farm();
    t.check("saved and loaded: the same buildings and plots", JSON.stringify(before) === JSON.stringify(after) && before.buildings.length === 4, { before, after });
});
