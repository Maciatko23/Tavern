// Zasady budowania i wytwarzania w nowym świecie (gracz 2026-11-16):
//   - lista Q ma dwie zakładki: „Budowa” i „Akcja”;
//   - „Budowa”: rzeczy robione ręcznie, bez stołu i budynku (młotek, bukłak, lina, opatrunek, włókno z pokrzyw) - na każdej mapie;
//     budynki: wszystkie tylko wtedy, gdy bohater stoi na działce dziadka (Map218, w płocie); poza nią tylko ognisko, pułapka i
//     leśne legowisko (robione raz, od razu na miejscu - nie składa się go);
//   - „Akcja”: to, co się nosi i stawia - rozłóż namiot, postaw garnek / gliniany garnek / beczkę / wiadro;
//   - łuskania nasion sosny nie ma: szyszka idzie na rozpałkę albo cała w ziemię (sadzenie drzewa);
//   - pod dachem nic się nie postawi.
// Zdjęcia: docs/budowa_zasady/*.png
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "budowa_zasady");

const HAND = ["Zrób bukłak", "Skręć linę", "Zrób opatrunek", "Wyskub włókno z pokrzyw"];   // (+ "Zrób młotek", the first line while there is none)
const OFF_PLOT = ["Ognisko", "Pułapka", "Leśne legowisko"];
const ACTION = ["Rozłóż namiot", "Postaw garnek", "Postaw gliniany garnek", "Postaw beczkę", "Postaw wiadro"];
const BIG = ["Warsztat", "Płot", "Kuźnia", "Kurnik", "Studnia", "Chatka", "Tartak"];
const same = (a, b) => a.slice().sort().join() === b.slice().sort().join();

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    require("fs").mkdirSync(SHOTS, { recursive: true });
    // the Q list as the window gets it: the title, the tabs with their lines
    const q = () => J(`(function(){ const scene = SceneManager._scene; let got = null; const _o = scene.openFarmMenu;
        scene.openFarmMenu = function(title, en, kind, index, tabs) { got = { title, kind, all: en.map(x => x.name), tabs: tabs ? tabs.map(t => ({ name: t.name, names: t.entries.map(e => e.name) })) : null }; };
        Farming.openBuildKeyMenu(); scene.openFarmMenu = _o; return got; })()`);
    const tab = (m, name) => ((m.tabs || []).find(x => x.name === name) || { names: [] }).names;
    const why = (type, x, y) => J(`Farming.whyNotBuild(${JSON.stringify(type)}, ${x}, ${y})`);
    const place = async (type, x, y) => {
        await t.locate(x, y + 1, 8); await t.frames(6);   // (beside the place: the placer has its reach)
        await t.eval(`Farming.startPlacement(${JSON.stringify(type)}, ${x}, ${y}); 0`); await t.frames(8);
        await t.eval(`$gameTemp._buildMode.x = ${x}; $gameTemp._buildMode.y = ${y}; 0`); await t.frames(4);
        await t.press("ok");
        await t.until(`!!Farming.buildingAt(${x}, ${y})`, 12);
        await t.frames(20);
        return J(`(function(){ const b = Farming.buildingAt(${x}, ${y}); return b ? { type: b.type, site: !!b.site } : null; })()`);
    };

    t.check("nowa gra (działka dziadka)", await t.newGame());
    const I = await J("Farming.ITEM");
    await t.eval(`for (const [id, n] of [[${I.branch}, 10], [${I.fiber}, 14], [${I.tent}, 1], [${I.wood}, 12], [${I.stone}, 12]]) $gameParty.gainItem($dataItems[id], n); 0`);
    const hand = await J("Farming.HAND_RECIPES.map(r => r.id)");
    t.check("ręcznie, bez stołu i budynku: młotek, bukłak, lina, opatrunek, włókno z pokrzyw (bez łuskania nasion sosny; legowisko buduje się od razu)",
        hand.join() === "hammer,waterskin,rope,bandage,nettle_fiber", hand);

    // ---- on the plot
    await t.go(218, 33, 14, 6);
    await t.frames(20);
    const on = await q();
    t.check("Q na działce dziadka: zakładki „Budowa” i „Akcja”; w „Budowie” wszystkie budynki, legowisko i rzeczy ręczne, pierwsza linia „Zrób młotek”",
        on.title === "Budowa" && on.tabs && on.tabs.map(x => x.name).join() === "Budowa,Akcja" && tab(on, "Budowa")[0] === "Zrób młotek" &&
        BIG.concat(OFF_PLOT, HAND).every(n => tab(on, "Budowa").includes(n)) && !tab(on, "Budowa").some(n => ACTION.includes(n) || n === "Namiot"), on.tabs);
    t.check("...„Akcja”: rozłóż namiot, postaw garnek, gliniany garnek, beczkę, wiadro - i nic więcej", same(tab(on, "Akcja"), ACTION), tab(on, "Akcja"));
    t.check("...i budynek da się tam postawić (płot)", (await why("fence", 34, 14)) === null, await why("fence", 34, 14));

    // ---- Podgrodzie outside the fence
    await t.go(218, 44, 21, 2);
    await t.frames(20);
    const off = await q();
    t.check("Q na Podgrodziu poza płotem: „Budowa” = młotek, bukłak, lina, opatrunek, włókno + ognisko, pułapka, leśne legowisko; „Akcja” jak wszędzie",
        same(tab(off, "Budowa"), ["Zrób młotek"].concat(HAND, OFF_PLOT)) && same(tab(off, "Akcja"), ACTION), off.tabs);
    t.check("...budynku nie postawisz („Tu nie twoja ziemia”), ognisko i legowisko tak", /nie twoja ziemia/.test(await why("workbench", 44, 23)) && (await why("campfire", 44, 23)) === null && (await why("bedroll", 44, 23)) === null,
        [await why("workbench", 44, 23), await why("campfire", 44, 23), await why("bedroll", 44, 23)]);

    // ---- the coast: a camp really put up
    await t.go(219, 45, 36, 8);
    await t.frames(20);
    const coast = await q();
    t.check("na Słonym Brzegu te same dwie krótkie zakładki", same(tab(coast, "Budowa"), ["Zrób młotek"].concat(HAND, OFF_PLOT)) && same(tab(coast, "Akcja"), ACTION), coast.tabs);
    const spots = await J("(function(){ const free = (k, x0) => { for (let y = 37; y < 44; y++) for (let x = x0; x < x0 + 8; x++) if (Farming.whyNotBuild(k, x, y) === null && $gameMap.isPassable(x, y + 1, 8)) return [x, y]; return null; }; return { bed: free('bedroll', 47), fire: free('campfire', 56), tent: free('tent', 38) }; })()");
    const bed = spots.bed ? await place("bedroll", spots.bed[0], spots.bed[1]) : null;
    const bag = await J(`[$gameParty.numItems($dataItems[${I.branch}]), $gameParty.numItems($dataItems[${I.fiber}])]`);
    const fire = spots.fire ? await place("campfire", spots.fire[0], spots.fire[1]) : null;
    const tent = spots.tent ? await place("tent", spots.tent[0], spots.tent[1]) : null;
    t.check("obóz na Słonym Brzegu naprawdę staje: leśne legowisko od razu (10 gałęzi i 10 lnu z torby), namiot od razu, ognisko jako plac budowy",
        !!bed && bed.type === "bedroll" && !bed.site && bag.join() === "0,4" && !!tent && tent.type === "tent" && !tent.site && !!fire && fire.type === "campfire" && fire.site, { bed, bag, fire, tent, spots });
    await t.eval(`$gameParty.gainItem($dataItems[${I.branch}], 10); $gameParty.gainItem($dataItems[${I.fiber}], 10); 0`);
    const second = await q();
    t.check("leśne legowisko robi się raz: drugiego nie postawisz, póki to stoi („Masz już leśne legowisko.”)",
        (await why("bedroll", 60, 40)) === "Masz już leśne legowisko." && tab(second, "Budowa").indexOf("Leśne legowisko") > tab(second, "Budowa").indexOf("Ognisko"), [await why("bedroll", 60, 40), tab(second, "Budowa")]);
    if (spots.bed) { await t.locate(spots.bed[0], spots.bed[1] + 2, 8); await t.frames(20); }
    await t.shot(path.join(SHOTS, "oboz_slony_brzeg.png"));
    t.check("...budynku tam nie postawisz", (await why("workbench", 46, 44)) !== null, await why("workbench", 46, 44));

    // ---- the town, the mountains, under a roof
    await t.go(220, 50, 42, 2);
    await t.frames(20);
    const town = await q();
    t.check("w Kruczogrodzie: te same zakładki, budynku nie postawisz („tylko na działce dziadka”), ognisko tak",
        same(tab(town, "Akcja"), ACTION) && !tab(town, "Budowa").includes("Warsztat") && /działce dziadka/.test(await why("workbench", 50, 44)) && (await why("campfire", 50, 44)) === null, [town.tabs, await why("workbench", 50, 44)]);
    await t.go(222, 20, 30, 2);
    await t.frames(20);
    t.check("w górach: ognisko i namiot tak, kuźnia nie", (await why("campfire", 20, 32)) === null && (await why("forge", 20, 32)) !== null, [await why("campfire", 20, 32), await why("forge", 20, 32)]);
    await t.go(1, 14, 33, 2);
    await t.frames(20);
    const inn = await q();
    t.check("w tawernie (pod dachem): rzeczy ręczne są na liście, ale nic się nie postawi („Pod dachem tego nie postawisz.”)",
        HAND.every(n => tab(inn, "Budowa").includes(n)) && (await why("campfire", 14, 35)) === "Pod dachem tego nie postawisz." && (await why("tent", 14, 35)) === "Pod dachem tego nie postawisz.", [inn.tabs, await why("campfire", 14, 35)]);

    // ---- hand crafting straight from the Q list, anywhere: a rope out of flax on the town's market
    await t.go(220, 50, 42, 2);
    await t.frames(20);
    const rope0 = await J(`$gameParty.numItems($dataItems[${I.rope}])`);
    await t.eval(`(function(){ const scene = SceneManager._scene; const _o = scene.openFarmMenu; let tabs = null; scene.openFarmMenu = function(title, en, kind, index, tb) { tabs = tb; };
        Farming.openBuildKeyMenu(); scene.openFarmMenu = _o; tabs[0].entries.find(e => e.name === "Skręć linę").run(); return 0; })()`);
    await t.until(`$gameParty.numItems($dataItems[${I.rope}]) > ${rope0}`, 30);
    t.check("Q -> „Budowa” -> „Skręć linę” na rynku Kruczogrodu: lina powstaje ręcznie, bez budynku", (await J(`$gameParty.numItems($dataItems[${I.rope}])`)) === rope0 + 1);

    // ---- the keys: Q opens "Budowa", right goes to "Akcja", left back
    await t.frames(30);
    await t.eval("Farming.openBuildKeyMenu(); 0"); await t.frames(12);
    const win = () => J("(function(){ const s = SceneManager._scene, m = s._farmMenu, p = s._farmTitle; return { open: !!m && m.active, tab: m ? m._tab : null, n: m && m._entries ? m._entries.length : 0, names: p && p._tabs ? p._tabs : null }; })()");
    const w0 = await win();
    await t.shot(path.join(SHOTS, "q_budowa.png"));
    await t.press("right"); await t.frames(8);
    const w1 = await win();
    await t.shot(path.join(SHOTS, "q_akcja.png"));
    await t.press("left"); await t.frames(8);
    const w2 = await win();
    await t.press("escape"); await t.frames(10);
    t.check("klawisze: lista Q otwiera się na „Budowa”, strzałka w prawo przechodzi do „Akcja” (5 linii), w lewo wraca",
        w0.open && w0.tab === 0 && w1.tab === 1 && w1.n === 5 && w2.tab === 0 && (w0.names || []).join() === "Budowa,Akcja", { w0, w1, w2 });

    // ---- the cone: kindling as before, and planted whole (on the plot's ground menu)
    await t.go(218, 33, 14, 6);
    await t.frames(20);
    await t.eval(`$gameParty.gainItem($dataItems[${I.cone}], 2); 0`);
    const plant = await J(`(function(){ const m = Farming.menuFor(34, 14); return { names: m && m.entries ? m.entries.map(e => e.name) : null, seed: Forestry.SEED, cone: ${I.cone} }; })()`);
    t.check("szyszka idzie cała w ziemię: z szyszką w torbie menu ziemi na działce ma „Posadź sosnę” (bez nasion)", plant.seed === plant.cone && !!plant.names && plant.names.some(n => /Posadź sosnę/.test(n)), plant);
});
