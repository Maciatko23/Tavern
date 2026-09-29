// Puddles.js: after rain 3-5 puddles gather on an outdoor map, in new places after every wet spell (rain on dry ground ... dry again),
// filling and drying with the weather plan; drawn on the ground, rings in the rain; a building or worked ground on one - no puddle; none in
// winter; a step in one splashes. Farming.js: the puddle's menu "Kałuża" - "Wykop glinę" (shovel, 1-2 wet clay, 3 times a puddle a spell).
const { launch, sleep } = require("./cdp.js");
const OUT = process.argv[2] || "";
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(12); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const layer = () => J(`(function(){ const L = SceneManager._scene._spriteset._puddles; const items = [...L._items.values()];
            return { n: items.length, visible: items.filter(i => i.water.visible).length, steps: items.map(i => i.step), ripples: L._ripples.length }; })()`);

        // where they may gather
        for (let i = 0; i < 20 && !(await ev("Puddles.candidates().length > 0")); i++) await frames(10);
        const C = await J("Puddles.candidates().length");
        check("the farm has places where a puddle may gather", C >= 8, C);
        const bad = await J(`(function(){ const out = []; for (const h of Puddles.candidates()) for (const [x, y] of h.tiles) {
            const g = Farming.groundInfoAt(x, y);
            if (!g || !g.kind || !$gameMap.checkPassage(x, y, 0x0f) || $gameMap.eventsXy(x, y).length || Farming.hasObjectTile(x, y) || Farming.gatherKindOf(x, y) === "bush") out.push([h.id, x, y]); } return out; })()`);
        check("...every tile of them bare natural ground: passable, no event, object or berry bush", bad.length === 0, bad.slice(0, 5));

        // dry: none
        await ev("Puddles.setLevel(0); 0");
        await frames(25);
        const dry = await layer();
        check("dry ground: no puddles", dry.n === 0 && (await J("Puddles.hollows().length")) === 0, dry);

        // a wet spell: 3-5 of them, 6+ tiles apart; another spell - other places
        const sets = await J(`(function(){ const out = []; for (let sp = 1; sp <= 12; sp++) { Puddles.setLevel(1.1, sp * 37); const hs = Puddles.hollows();
            let gap = 99; for (const a of hs) for (const b of hs) if (a !== b) gap = Math.min(gap, Math.hypot(a.cx - b.cx, a.cy - b.cy));
            out.push({ n: hs.length, gap, ids: hs.map(h => h.id).sort().join(" ") }); } return out; })()`);
        check("every wet spell: 3 to 5 puddles on the map, at least 6 tiles apart", sets.every(s => s.n >= 3 && s.n <= 5 && s.gap >= 6), sets.map(s => [s.n, Math.round(s.gap)]));
        check("...in new places after each such rain (not the same set every time)", new Set(sets.map(s => s.ids)).size >= 10, new Set(sets.map(s => s.ids)).size);
        check("...and each spell the same while it lasts (worked out, nothing saved)", JSON.stringify(await J("(function(){ Puddles.setLevel(1.1, 37); return Puddles.hollows().map(h => h.id).sort().join(' '); })()")) === JSON.stringify(sets[0].ids));

        // full: stand by the biggest one and look
        await ev("Puddles.setLevel(1.1, 37); 0");
        const H = await J(`Puddles.hollows().map(h => ({ id: h.id, cx: h.cx, cy: h.cy, thr: h.thr, tiles: h.tiles }))`);
        const big = H.slice().sort((a, b) => b.tiles.length - a.tiles.length)[0];
        await ev(`(function(){ const h = Puddles.hollows().find(h => h.id === ${JSON.stringify(big.id)}); $gamePlayer.locate(Math.round(h.cx), Math.round(h.cy) + 3); $gamePlayer.center($gamePlayer.x, $gamePlayer.y); return 0; })()`);
        await frames(30);
        const full = await layer();
        check("after a long rain: every puddle of the spell holds water, the ones on the screen are drawn", full.n === H.length && full.visible > 0 && full.steps.every(s => s === 12), full);
        if (OUT) await b.shot(OUT + "puddles_full.png");
        const mid = await J(`(function(){ const h = Puddles.hollows().find(h => h.id === ${JSON.stringify(big.id)}); const x = Math.floor(h.cx), y = Math.floor(h.cy);
            return { x, y, wet: Puddles.wetAt(x, y), at: !!Puddles.at(x, y), dryFar: Puddles.wetAt(x + 9, y + 9) }; })()`);
        check("...its middle tile stands in water (at / wetAt), ground far off does not", mid.wet && mid.at && !mid.dryFar, mid);

        // drying: smaller
        await ev("Puddles.setLevel(0.4, 37); 0");
        await frames(25);
        const half = await layer();
        check("drying: the puddles shrink (the shallow ones first)", half.n <= H.length && half.steps.every(s => s < 12), half);
        if (OUT) await b.shot(OUT + "puddles_half.png");

        // the weather plan: rain yesterday -> water this morning, in the same spell; four days on -> dry, no spell
        await ev("$gameSystem.advanceDayNight(24 * 5); 0");   // (a few days in: day 1 has no yesterday)
        const lv = await J(`(function(){ const plan0 = Survival.weatherPlan, d = $gameSystem.dayNightDay();
            Puddles.setLevel(null);
            Survival.weatherPlan = day => (day === d - 1 ? { type: "rain", start: 8, end: 16, power: 4 } : null);
            $gameSystem.setDayNightHour(10.05); const next = Puddles.level(), sp1 = Puddles.spell();
            Survival.weatherPlan = day => (day === d - 4 ? { type: "rain", start: 8, end: 16, power: 4 } : null);
            $gameSystem.setDayNightHour(11.1); const later = Puddles.level(), sp2 = Puddles.spell();
            Survival.weatherPlan = day => (day === d ? { type: "rain", start: 5, end: 14, power: 5 } : null);
            $gameSystem.setDayNightHour(12.2); const now = Puddles.level(), sp3 = Puddles.spell();
            Survival.weatherPlan = plan0; $gameSystem.setDayNightHour(12);
            return { next, sp1, later, sp2, now, sp3, d }; })()`);
        check("from the weather plan: the morning after a day of rain there is water, four days on it is dry, in a downpour full",
            lv.next > 0.5 && lv.later === 0 && lv.now >= 1, lv);
        check("...each wet spell is marked by the hour its rain began (none when dry)", lv.sp1 === (lv.d - 1) * 24 + 8 && lv.sp2 === null && lv.sp3 === lv.d * 24 + 5, lv);

        // a building on a puddle: gone; winter: none
        await ev("Puddles.setLevel(1.1, 37); 0");
        const built = await J(`(function(){ const h = Puddles.hollows().find(h => h.id === ${JSON.stringify(big.id)});
            const f = Farming.farm(), list = f.buildings[3] || (f.buildings[3] = []), [x, y] = h.tiles[0];
            const fake = { id: 99999, type: "bench", x, y, last: 1 }; list.push(fake); f.rev = (f.rev || 0) + 1;
            const withIt = Puddles.fillOf(h); list.splice(list.indexOf(fake), 1); f.rev++;
            return { withIt, after: Puddles.fillOf(h) }; })()`);
        check("a building on the puddle: no water there; taken away: back", built.withIt === 0 && built.after > 0.9, built);
        const win = await J(`(function(){ const s0 = Farming.seasonIndex; Farming.seasonIndex = () => 3; const h = Puddles.hollows()[0]; const v = Puddles.fillOf(h); Farming.seasonIndex = s0; return v; })()`);
        check("winter (snow on the ground): no puddles", win === 0, win);

        // rain on them: rings
        await ev("window.__cw = Survival.currentWeather; Survival.currentWeather = () => ({ type: 'rain', start: 0, end: 24, power: 5 }); 0");
        let rings = 0;
        for (let i = 0; i < 12 && !rings; i++) { await frames(10); rings = (await layer()).ripples; }
        if (OUT) await b.shot(OUT + "puddles_rain.png");
        await ev("Survival.currentWeather = window.__cw; 0");
        check("in the rain, rings spread on the puddles", rings > 0, rings);
        await frames(40);
        check("...the rain over: the rings die away", (await layer()).ripples === 0);
        // (Atmosphere.js asks Puddles.wetAt - through the core since 2026-09-29, so its ground under the feet is looked at, not its source)
        const step = await J(`({ wet: Puddles.wetAt(${mid.x}, ${mid.y}), kind: Atmosphere.groundKindAt(${mid.x}, ${mid.y}), far: Atmosphere.groundKindAt(${mid.x} + 9, ${mid.y} + 9) })`);
        check("a step in the water splashes (Atmosphere asks Puddles.wetAt: the ground under the feet is 'water')", step.wet && step.kind === "water" && step.far !== "water", step);

        // ---- clay
        const menu = await J(`(function(){ const m = Farming.menuFor(${mid.x}, ${mid.y}); return { title: m && m.title, names: m ? m.entries.map(e => e.name) : [] }; })()`);
        check("the puddle's menu: \"Kałuża\", \"Wykop glinę\" first; no sitting down in the water, no digging plain soil", menu.title === "Kałuża" && menu.names[0] === "Wykop glinę" && !menu.names.includes("Odpocznij") && !menu.names.includes("Wykop ziemię"), menu);
        const dryMenu = await J(`(function(){ const m = Farming.menuFor(${mid.x} + 9, ${mid.y} + 9); return m ? m.entries.map(e => e.name) : []; })()`);
        check("...dry ground next to it: the usual menu (no clay)", !dryMenu.includes("Wykop glinę"), dryMenu);
        const noShovel = await J(`(function(){ const n0 = $gameParty.numItems($dataItems[164]); const r = Farming.digClay(${mid.x}, ${mid.y}); return { r, n: $gameParty.numItems($dataItems[164]) - n0 }; })()`);
        check("without a shovel: no clay", noShovel.r === false && noShovel.n === 0, noShovel);
        await ev("$gameParty.gainItem($dataItems[62], 1); $gameSystem.setStamina(100); 0");
        const digs = [];
        for (let k = 0; k < 4; k++) {
            await ev(`window.__c0 = $gameParty.numItems($dataItems[164]); window.__r = Farming.digClay(${mid.x}, ${mid.y}); 0`);
            await frames(70);
            digs.push(await J(`({ r: window.__r, got: $gameParty.numItems($dataItems[164]) - window.__c0, left: Puddles.clayLeft(Puddles.at(${mid.x}, ${mid.y}).hollow) })`));
        }
        check("with the shovel: each dig 1-2 wet clay, 3 times a puddle, then there is none left", digs.slice(0, 3).every(d => d.r && d.got >= 1 && d.got <= 2) && digs.map(d => d.left).join() === "2,1,0,0" && !digs[3].r && digs[3].got === 0, digs);
        const item = await J("({ name: $dataItems[164].name, icon: $dataItems[164].iconIndex, weight: $dataItems[164].note })");
        check("the item: Mokra glina, its own icon (427), heavy", item.name === "Mokra glina" && item.icon === 427 && /Weight:2/.test(item.weight), item);
        const off = await J(`(function(){ const m = Farming.menuFor(${mid.x}, ${mid.y}); const e = m.entries.find(e => e.name === "Wykop glinę"); return { enabled: e.enabled, help: e.help }; })()`);
        check("...the entry greyed out then, saying the clay is gone", off.enabled === false && /Gliny tu już nie ma/.test(off.help), off);
        const next = await J(`(function(){ Puddles.setLevel(1.1, 999); const hs = Puddles.hollows(); return { left: hs.map(h => Puddles.clayLeft(h)), saved: Object.keys(($gameSystem._puddleClay || {})[3] || {}).length }; })()`);
        check("the next wet spell: new puddles, full of clay again", next.left.every(n => n === 3), next);
        await ev("Puddles.setLevel(null); 0");
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
