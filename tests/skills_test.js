// The skill trees reach every system (Combat.perk): a sample from each field - melee and defence numbers, carrying, stamina costs,
// hunger, food, growth, building, stations, tool wear, sneaking, the shop, the birds' raids, chopping a tree.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(12); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const skills = o => ev(`(function(){ const h = Combat.hero(); h.skills = ${JSON.stringify(o)}; h.rev = (h.rev || 0) + 1; const a = $gameParty.leader(); if (a) a.refresh(); })(); 0`);
        const with_ = async (o, expr) => { await skills(o); const v = await J(expr); await skills({}); return v; };
        const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-6);

        // ---- the sums
        const sum = await with_({ m_power: 2, m_master: 1 }, "({ dmg: Combat.perk('melee.dmg'), crit: Combat.perk('melee.crit'), none: Combat.perk('crop.growth') })");
        check("Combat.perk adds up the ranks: Mocna ręka 2 (+10%) + Mistrz oręża (+10%) = +20% melee damage, +5% crit", near(sum.dmg, 0.2) && near(sum.crit, 0.05) && sum.none === 0, sum);

        // ---- Obrona / Przetrwanie: health, carrying, stamina costs
        const hp0 = await J("({ m: Combat.heroMhp(), cap: Survival.weightCap(), cost: Survival.costFactor() })");
        const hp1 = await with_({ d_body: 3, s_carry: 2, s_tough: 3 }, "({ m: Combat.heroMhp(), cap: Survival.weightCap(), cost: Survival.costFactor() })");
        check("Hart ciała 3: +36 health; Juczny 2: +8 carried; Wytrwały 3: work 15% cheaper", hp1.m === hp0.m + 36 && hp1.cap === hp0.cap + 8 && near(hp1.cost, hp0.cost * 0.85, 0.001), { hp0, hp1 });

        // ---- Przetrwanie / Kuchnia: hunger and food (Needs.js)
        await ev("Needs.setEnabled(true); 0");
        const hunger = async o => { await skills(o); const v = await J("(function(){ const n = Needs.state(); n.food = 100; n.water = 100; Needs.decay(10, 1); return { food: 100 - n.food, water: 100 - n.water, fed: Needs.foodValues($dataItems[95], Survival.foodInfo($dataItems[95]) || {})[0] }; })()"); await skills({}); return v; };
        const n0 = await hunger({}), n1 = await hunger({ s_food: 3, s_water: 2, k_value: 3 });
        check("Mały żołądek 3 / Wielbłąd 2: hunger 24% and thirst 16% slower; Kucharz 3: food feeds 24% more", near(n1.food, n0.food * 0.76, 0.01) && near(n1.water, n0.water * 0.84, 0.01) && near(n1.fed, n0.fed * 1.24, 0.01), { n0, n1 });
        await ev("Needs.setEnabled(false); 0");

        // ---- Rolnictwo: growth, the can
        const g0 = await J("({ rate: Farming.growthRate(0, 0, {}), can: Farming.canMax() })");
        const g1 = await with_({ f_grow: 3, f_can: 2 }, "({ rate: Farming.growthRate(0, 0, {}), can: Farming.canMax() })");
        check("Zielona ręka 3: crops grow 24% faster; Duża konewka 2: the can holds 4 more", near(g1.rate, g0.rate * 1.24, 0.001) && g1.can === g0.can + 4, { g0, g1 });

        // ---- Budownictwo: blows and strength on a site
        const s0 = await J("({ hits: Farming.siteHits(Farming.BUILDINGS.workbench), cost: Farming.hitCost() })");
        const s1 = await with_({ b_hits: 3, b_cost: 2 }, "({ hits: Farming.siteHits(Farming.BUILDINGS.workbench), cost: Farming.hitCost() })");
        check("Cieśla 3: a site needs 30% fewer blows; Lekki młot 2: a blow costs 40% less", s1.hits === Math.max(1, Math.round(s0.hits * 0.7)) && near(s1.cost, s0.cost * 0.6, 0.051), { s0, s1 });

        // ---- Rzemiosło / Kuchnia: the stations' time
        const r = "Farming.BUILDINGS.kiln.recipes[0]", c = "Farming.BUILDINGS.campfire.recipes[0]";
        const j0 = await J(`({ kiln: Farming.jobHours({ type: "kiln" }, ${r}), fire: Farming.jobHours({ type: "campfire" }, ${c}), hand: Farming.jobHours(null, ${r}) })`);
        const j1 = await with_({ c_fast: 3, c_smelt: 2, k_speed: 2 }, `({ kiln: Farming.jobHours({ type: "kiln" }, ${r}), fire: Farming.jobHours({ type: "campfire" }, ${c}), hand: Farming.jobHours(null, ${r}) })`);
        check("Sprawne ręce 3 (-24%), Hutnik 2 (-30% in the kiln), Szybki ruszt 2 (-30% at the fire)", near(j1.hand, j0.hand * 0.76, 0.001) && near(j1.kiln, j0.kiln * 0.46, 0.001) && near(j1.fire, j0.fire * 0.46, 0.001), { j0, j1 });

        // ---- Rzemiosło: tools wear slower
        await ev("$gameParty.gainItem($dataItems[60], 1); 0");
        const w0 = await J("(function(){ const u0 = Durability.used(60); Durability.use(60); return Durability.used(60) - u0; })()");
        const w1 = await with_({ c_wear: 3 }, "(function(){ const u0 = Durability.used(60); Durability.use(60); return Durability.used(60) - u0; })()");
        check("Dbały 3: a use wears the axe 36% less", near(w0, 1) && near(w1, 0.64, 0.001), { w0, w1 });

        // ---- Łowiectwo: the animals notice him later
        const nr = "Hunting.noticeRate($gamePlayer._realX + 2.5, $gamePlayer._realY + 0.5, 8)";
        const k0 = await ev(nr), k1 = await with_({ h_sneak: 3, h_track: 2 }, nr);
        check("Ciche kroki 3 + Tropiciel 2: noticed 50% slower", k0 > 0 && near(k1, k0 * 0.5, 0.0001), { k0, k1 });

        // ---- Rzemiosło: the shop
        const price = "Scene_Shop.prototype.sellingPrice.call({ _item: $dataItems[95] })";
        const p0 = await ev(price), p1 = await with_({ c_trade: 2 }, price);
        check("Kupiecka żyłka 2: things sell 30% dearer", p1 === Math.floor(p0 * 1.3), { p0, p1 });

        // ---- Rolnictwo: fewer raids of the birds
        const raids = "(function(){ let n = 0; for (let d = 1; d <= 80; d++) n += Birds.visitsOf(3, d).length; return n; })()";
        const v0 = await ev(raids), v1 = await with_({ f_birds: 2 }, raids);
        check("Strach na wróble 2: about 60% of the flocks do not come", v1 < v0 * 0.55 && v1 > v0 * 0.25, { v0, v1 });

        // ---- Walka wręcz / Obrona: the fight's numbers
        const f0 = await J("({ crit: Combat.critChance(), down: Combat.knockdownAt(), iframes: Combat.rollIFrames() })");
        const f1 = await with_({ m_crit: 2, d_knock: 2, d_roll: 2 }, "({ crit: Combat.critChance(), down: Combat.knockdownAt(), iframes: Combat.rollIFrames() })");
        check("Oko rzeźnika 2 (+6% crit), Twarde nogi 2 (+40% to be knocked down), Unik mistrza 2 (+6 frames untouchable)", near(f1.crit, f0.crit + 0.06, 0.0001) && f1.down === Math.round(f0.down * 1.4) && f1.iframes === f0.iframes + 6, { f0, f1 });

        // ---- Zbieractwo: chopping a tree takes fewer blows (the real strike of a tree event)
        const T = await J(`(function(){ const e = $gameMap.events().find(e => ChoppableTree.isTree(e) && !$gameSelfSwitches.value([3, e.eventId(), "A"])); return e ? { id: e.eventId(), x: e.x, y: e.y, hits: ChoppableTree.treeConfig(e).hits } : null; })()`);
        check("found a standing tree", !!T, T);
        const chop = async o => {
            await skills(o);
            await ev(`$gameParty.gainItem($dataItems[60], 1); $gameSystem.setStamina(100); $gamePlayer.locate(${T.x}, ${T.y} + 1); $gamePlayer.setDirection(8); $gameMap.event(${T.id})._pendingAction = null; $gameMap.event(${T.id}).start(); 0`);
            let a = null;
            for (let i = 0; i < 40 && !a; i++) { await frames(2); a = await J(`(function(){ const p = $gameMap.event(${T.id})._pendingAction; return p ? { needed: p.needed, cost: p.cost } : null; })()`); }
            for (let i = 0; i < 60 && (await ev("$gameMap.isEventRunning() || $gamePlayer.isToolSwinging()")); i++) await frames(5);
            await skills({});
            return a;
        };
        const c0 = await chop({}), c1 = await chop({ g_chop: 3, g_cost: 2 });
        check("Drwal 3: the tree takes 30% fewer blows; Oszczędny zamach 2: each blow 24% cheaper", !!c0 && !!c1 && c1.needed === Math.max(1, Math.round(c0.needed * 0.7)) && near(c1.cost, Math.max(0.5, c0.cost * 0.76), 0.01), { c0, c1 });
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
