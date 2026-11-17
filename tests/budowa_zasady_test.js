// Zasady budowania i wytwarzania w nowym świecie (gracz 2026-11-16):
//   - lista Q ma dwie zakładki: „Budowa” i „Akcja”;
//   - „Budowa”: rzeczy robione ręcznie, bez stołu i budynku (młotek, bukłak, sznurek, lina, opatrunek) - na każdej mapie;
//     (2026-11-17: sznurek z 4 sztuk lnu i pokrzywy w dowolnej mieszance - najpierw pokrzywa; lina z 10 sznurków; włókna z pokrzyw już nie ma)
//     budynki: wszystkie tylko wtedy, gdy bohater stoi na działce dziadka (Map218, w płocie); poza nią tylko ognisko, pułapka i
//     leśne legowisko (robione raz, od razu na miejscu - nie składa się go);
//   - „Akcja”: to, co się nosi i stawia - rozłóż namiot, postaw garnek / gliniany garnek / beczkę / wiadro;
//   - łuskania nasion sosny nie ma: szyszka idzie na rozpałkę albo cała w ziemię (sadzenie drzewa);
//   - pod dachem nic się nie postawi.
// Zdjęcia: docs/budowa_zasady/*.png
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "budowa_zasady");

const HAND = ["Zrób bukłak", "Skręć sznurek", "Spleć linę", "Zrób opatrunek"];   // (+ "Zrób młotek", the first line while there is none)
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
    t.check("ręcznie, bez stołu i budynku: młotek, bukłak, sznurek, lina, opatrunek (bez łuskania nasion sosny i bez włókna z pokrzyw; legowisko buduje się od razu)",
        hand.join() === "hammer,waterskin,rope,lina,bandage", hand);

    // ---- on the plot
    await t.go(218, 33, 14, 6);
    await t.frames(20);
    const on = await q();
    t.check("Q na działce dziadka: zakładki „Budowa” i „Akcja”; w „Budowie” wszystkie budynki, legowisko i rzeczy ręczne, pierwsza linia „Zrób młotek”",
        on.title === "Budowa" && on.tabs && on.tabs.map(x => x.name).join() === "Budowa,Akcja" && tab(on, "Budowa")[0] === "Zrób młotek" &&
        BIG.concat(OFF_PLOT, HAND).every(n => tab(on, "Budowa").includes(n)) && !tab(on, "Budowa").some(n => ACTION.includes(n) || n === "Namiot"), on.tabs);
    t.check("...„Akcja”: rozłóż namiot, postaw garnek, gliniany garnek, beczkę, wiadro - i nic więcej", same(tab(on, "Akcja"), ACTION), tab(on, "Akcja"));
    t.check("...i budynek da się tam postawić (płot)", (await why("fence", 34, 14)) === null, await why("fence", 34, 14));

    // ---- (2026-11-17, the user) the string: 4 of flax and nettle in any mix (the nettle first), the thick rope of 10 strings, the well on the Lina
    const cnt = id => J(`$gameParty.numItems($dataItems[${id}])`);
    const qEntry = name => `(function(){ const scene = SceneManager._scene; const _o = scene.openFarmMenu; let tabs = null; scene.openFarmMenu = function(title, en, kind, index, tb) { tabs = tb; };
        Farming.openBuildKeyMenu(); scene.openFarmMenu = _o; return tabs[0].entries.find(e => e.name === ${JSON.stringify(name)}); })()`;
    await t.eval(`$gameParty.gainItem($dataItems[${I.nettle}], 2); 0`);
    const both = (await cnt(I.fiber)) + (await cnt(I.nettle));
    const line = await J(`(function(){ const e = ${qEntry("Skręć sznurek")}; return e ? { costs: e.costs, enabled: e.enabled } : null; })()`);
    t.check("„Skręć sznurek” na liście Q: jedna linia kosztu „4× Włókno lub pokrzywa” (w torbie: len + 2 pokrzywy razem), dostępna",
        !!line && line.enabled && line.costs.length === 1 && line.costs[0][1] === 4 && line.costs[0][2] === both && line.costs[0][3] === "Włókno lub pokrzywa", [line, both]);
    const [rope0, fib0, net0] = [await cnt(I.rope), await cnt(I.fiber), await cnt(I.nettle)];
    await t.eval(`(${qEntry("Skręć sznurek")}).run(); 0`);
    await t.until(`$gameParty.numItems($dataItems[${I.rope}]) > ${rope0}`, 30);
    t.check("Q -> „Budowa” -> „Skręć sznurek”: sznurek powstaje ręcznie, bez budynku - najpierw idą 2 pokrzywy (więdną), potem 2 lnu",
        (await cnt(I.rope)) === rope0 + 1 && (await cnt(I.nettle)) === net0 - 2 && (await cnt(I.fiber)) === fib0 - 2, { rope: [rope0, await cnt(I.rope)], nettle: [net0, await cnt(I.nettle)], fibre: [fib0, await cnt(I.fiber)] });
    // only nettle: 4 nettle make a string too; then with 3 pieces in all the line is dimmed and says what is short
    await t.frames(30);
    await t.eval(`$gameParty.loseItem($dataItems[${I.fiber}], 99); $gameParty.gainItem($dataItems[${I.nettle}], 4); 0`);
    const rope1 = await cnt(I.rope);
    await t.eval(`(${qEntry("Skręć sznurek")}).run(); 0`);
    await t.until(`$gameParty.numItems($dataItems[${I.rope}]) > ${rope1}`, 30);
    t.check("...same pokrzywy (4) też dają sznurek", (await cnt(I.rope)) === rope1 + 1 && (await cnt(I.nettle)) === 0);
    await t.frames(30);
    await t.eval(`$gameParty.gainItem($dataItems[${I.nettle}], 1); $gameParty.gainItem($dataItems[${I.fiber}], 2); 0`);
    const short = await J(`(function(){ const e = ${qEntry("Skręć sznurek")}; return { enabled: e.enabled, help: e.help, ok: Farming.craftManual(null, Farming.HAND_RECIPES.find(r => r.id === "rope")) }; })()`);
    t.check("...z 3 sztukami (1 pokrzywa + 2 lnu) linia jest wygaszona: „Brakuje: Włókno lub pokrzywa (3/4)”, nic nie powstaje",
        short.enabled === false && /Brakuje: Włókno lub pokrzywa \(3\/4\)/.test(short.help) && short.ok === false, short);
    // the thick rope: 10 strings braided by hand
    await t.eval(`$gameParty.gainItem($dataItems[${I.rope}], 10); 0`);
    const [lina0, str0] = [await cnt(I.lina), await cnt(I.rope)];
    const lline = await J(`(function(){ const e = ${qEntry("Spleć linę")}; return e ? { costs: e.costs, enabled: e.enabled } : null; })()`);
    t.check("„Spleć linę” na liście Q zaraz po „Skręć sznurek”: koszt 10× Sznurek, dostępna",
        !!lline && lline.enabled && lline.costs.length === 1 && lline.costs[0][1] === 10 && lline.costs[0][3] === "Sznurek" &&
        (await J(`(function(){ const n = Farming.HAND_RECIPES.map(r => r.name); return n.indexOf("Spleć linę") === n.indexOf("Skręć sznurek") + 1; })()`)), lline);
    await t.eval(`(${qEntry("Spleć linę")}).run(); 0`);
    await t.until(`$gameParty.numItems($dataItems[${I.lina}]) > ${lina0}`, 30);
    t.check("Q -> „Spleć linę”: z 10 sznurków powstaje 1 lina", (await cnt(I.lina)) === lina0 + 1 && (await cnt(I.rope)) === str0 - 10, { lina: [lina0, await cnt(I.lina)], str: [str0, await cnt(I.rope)] });

    const wellQ = await J(`(function(){ const e = ${qEntry("Studnia")}; return e ? e.costs.map(c => c[3] + " x" + c[1]) : null; })()`);
    t.check("„Studnia” na liście Q (działka): w koszcie 1× Lina, sznurka już nie", !!wellQ && wellQ.includes("Lina x1") && !wellQ.some(c => /^Sznurek/.test(c)), wellQ);
    const jl = await J(`(function(){ const g = id => Journal.GOALS.find(x => x.id === id); const l = g("lina"), w = g("well"), r = g("rope"); return { lina: !!l && l.title + "|" + l.recipe.join("/") + "|" + l.after.join(), ref: !!(l && Journal.recipeRef(l.recipe)), well: w.after.join(), rope: r.title }; })()`);
    t.check("dziennik: cel „Skręć sznurek”, nowy cel „Spleć linę” (po wiadrze, przed studnią), studnia po linie",
        jl.rope === "Skręć sznurek" && jl.lina === "Spleć linę|hand/lina|rope,bucket" && jl.ref && jl.well === "lina,stone,bucket", jl);
    // (the bag back as the sections below expect it: 14 flax, no nettle, no string, no rope)
    await t.frames(30);
    await t.eval(`for (const id of [${I.fiber}, ${I.nettle}, ${I.rope}, ${I.lina}]) $gameParty.loseItem($dataItems[id], 999); $gameParty.gainItem($dataItems[${I.fiber}], 14); 0`);

    // ---- Podgrodzie outside the fence
    await t.go(218, 44, 21, 2);
    await t.frames(20);
    const off = await q();
    t.check("Q na Podgrodziu poza płotem: „Budowa” = młotek, bukłak, sznurek, lina, opatrunek + ognisko, pułapka, leśne legowisko; „Akcja” jak wszędzie",
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

    // ---- hand crafting straight from the Q list, anywhere: a string out of flax on the town's market
    await t.go(220, 50, 42, 2);
    await t.frames(20);
    const ropeT = await cnt(I.rope);
    await t.eval(`(${qEntry("Skręć sznurek")}).run(); 0`);
    await t.until(`$gameParty.numItems($dataItems[${I.rope}]) > ${ropeT}`, 30);
    t.check("Q -> „Budowa” -> „Skręć sznurek” na rynku Kruczogrodu: sznurek powstaje ręcznie, bez budynku", (await cnt(I.rope)) === ropeT + 1);

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
