// Nowe uprawy i dzikie rośliny (2026-11-19, docs: pamięć project_new_crops): len, owies, buraki, cebula, czosnek, groch na polu;
// jabłoń z pestek (Forestry); poziomki i dzikie formy nowych upraw na łąkach; krzaki: borówki, maliny, jeżyny, leszczyna; boczniaki
// na pniakach (Boczniaki.js); owies jako pasza; barszcz, grochówka, owsianka; nasiona u zielarki (Nasiona_Zielarki.js).
//   CDP_PORT=9471 node tests/uprawy_nowe_test.js        (ZRZUTY=folder: zrzuty do obejrzenia)
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9471, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    const SHOTS = process.env.ZRZUTY ? require("path").resolve(process.env.ZRZUTY) : "";
    // ================= 1. the data =================
    const d = await t.json(`(() => {
        const ids = []; for (let i = 493; i <= 513; i++) ids.push(i);
        return { items: ids.map(id => ({ id, name: $dataItems[id] && $dataItems[id].name, icon: $dataItems[id] && $dataItems[id].iconIndex })),
            crops: Object.keys(Farming.CROPS), rows: Object.values(Farming.CROPS).map(c => c.row),
            pot: Farming.BUILDINGS.cauldron.recipes.map(r => r.id),
            diffs: FoodTable.check().filter(s => /^5\\d\\d /.test(s)),
            food: [501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513].every(id => FoodTable.edible(id)),
            oatsNoFood: !FoodTable.edible(500), feed: ["coop", "cowshed", "pen"].map(k => Farming.BUILDINGS[k].feed),
            bushKinds: Farming.BUSH_KINDS.map(k => k.key), plugins: [!!window.Boczniaki, !!window.Nasiona_Zielarki, !!(window.Forestry && Forestry.SPECIES && Forestry.SPECIES.apple)] };
    })()`);
    t.check("21 nowych przedmiotów 493-513, każdy z ikoną PixelLab (688+)", d.items.every(i => i.name && i.icon >= 688), d.items.filter(i => !(i.icon >= 688)));
    t.check("10 upraw: 4 stare + len, owies, buraki, cebula, czosnek, groch (wiersze 0-9 obrazka)",
        d.crops.join() === "potato,carrot,cabbage,barley,flax,oats,beet,onion,garlicCrop,pea" && d.rows.join() === "0,1,2,3,4,5,6,7,8,9", d);
    t.check("kociołek: barszcz, grochówka, owsianka z owsa (obok starych)", ["borscht", "pea_soup", "oatmeal", "soup", "nettle_soup"].every(r => d.pot.includes(r)), d.pot);
    t.check("tabela jedzenia: nowe jedzenie jadalne, owies nie (pasza), notatki zgodne z tabelą", d.food && d.oatsNoFood && d.diffs.length === 0, d.diffs);
    t.check("owies jako pasza: kurnik, obora, owczarnia", d.feed.every(f => f === 500), d.feed);
    t.check("krzaki: borówki, maliny, jeżyny, leszczyna", d.bushKinds.join() === "blueberry,raspberry,blackberry,hazel", d.bushKinds);
    t.check("wtyczki: Boczniaki, Nasiona_Zielarki, jabłoń w Forestry", d.plugins.every(Boolean), d.plugins);
    const pics = await t.eval(`new Promise(res => { const names = ["Farm_Crops", "Gather_Strawberry_0", "Gather_Strawberry_1", "Gather_WildOat_0", "Gather_WildOat_1", "Gather_WildPea_0", "Gather_WildPea_1",
        "Gather_WildBeet_0", "Gather_WildBeet_1", "Gather_WildOnion_0", "Gather_WildOnion_1", "Gather_Bush_4", "Gather_Bush_5", "Gather_Boczniak_0", "Gather_Boczniak_1"];
        const bs = names.map(n => ImageManager.loadSystem(n)).concat(["!$Sapling_Apple", "!$Sapling_Apple_2", "!$Sapling_Apple_3"].map(n => ImageManager.loadCharacter(n)));
        const chk = () => { if (bs.some(b => !b.isReady() && !b.isError())) return setTimeout(chk, 50); res(JSON.stringify(bs.map(b => [b._url.split("/").pop(), b.isError() ? 0 : b.width, b.isError() ? 0 : b.height]))); };
        chk(); })`);
    const P = JSON.parse(pics);
    t.check("obrazki: pole 192x480, 10 dzikich roślin, 2 krzaki, 2 boczniaki, 3 siewki jabłoni", P[0][1] === 192 && P[0][2] === 480 && P.every(p => p[1] > 0), P.filter(p => !(p[1] > 0)));

    // ================= 2. the field: sowing in season, growing, the harvest =================
    await t.newGame({ map: 218, day: 5, hour: 10, quiet: true, minimap: false });   // (grandpa's field is on Podgrodzie, Map218)
    await t.frames(60);
    // a block of free ground near the hero: 4 columns (the stages) x 6 rows (the new crops)
    const block = await t.json(`(() => {
        const hx = $gamePlayer.x, hy = $gamePlayer.y, ok = (x, y) => { const p = Farming.plotAt(x, y); return !!p && (p.s === "cleared" || p.s === "tilled") && !p.crop && !Farming.buildingAt(x, y); };
        let best = null;
        for (let y = 1; y < $gameMap.height() - 9; y++) for (let x = 1; x < $gameMap.width() - 6; x++) {
            let all = true; for (let dy = 0; dy < 6 && all; dy++) for (let dx = 0; dx < 5 && all; dx++) all = ok(x + dx, y + dy);
            if (all) { const dd = Math.abs(x - hx) + Math.abs(y - hy); if (!best || dd < best.d) best = { x, y, d: dd }; }
        }
        // (grandpa's field is overgrown - stones and stumps every few tiles: for the test they are taken off the block, this session only)
        if (best) for (let y = best.y; y < best.y + 9; y++) for (let x = best.x; x < best.x + 5; x++) $gameMap.eventsXy(x, y).forEach(e => e.erase());
        return best; })()`);
    t.check("na polu dziadka (Podgrodzie) jest ziemia 5x6", !!block, block);
    if (block) {
        // sowing: in spring flax, oats, onion, garlic and peas; the beet not (summer, autumn)
        const sow = await t.json(`(() => {
            const out = {}, P = Farming.farm().plots[218] = Farming.farm().plots[218] || {};
            [493, 494, 495, 496, 497, 498].forEach(id => $gameParty.gainItem($dataItems[id], 3));
            $gameSystem.setStamina && $gameSystem.setStamina(100);
            const crops = ["flax", "oats", "beet", "onion", "garlicCrop", "pea"];
            crops.forEach((c, i) => { const x = ${block.x} + 4, y = ${block.y} + i; P[x + "," + y] = { s: "tilled" }; });
            Farming.farm().rev = (Farming.farm().rev || 0) + 1;
            return crops.map((c, i) => Farming.plant(${block.x} + 4, ${block.y} + i, c)); })()`);
        await t.frames(120);
        const sown = await t.json(`["flax", "oats", "beet", "onion", "garlicCrop", "pea"].map((c, i) => (Farming.plotAt(${block.x} + 4, ${block.y} + i) || {}).crop || null)`);
        t.check("wiosną zasiane: len, owies, cebula, czosnek, groch; burak nie (lato, jesień)", sown.join() === "flax,oats,,onion,garlicCrop,pea" && sow[2] === false, { sow, sown });
        // the stages of every new crop drawn: columns 0..3 = sown, sprout, growing, ripe
        await t.json(`(() => {
            const P = Farming.farm().plots[218], crops = ["flax", "oats", "beet", "onion", "garlicCrop", "pea"], today = $gameSystem.dayNightDay();
            crops.forEach((c, i) => { for (let k = 0; k < 4; k++) { const def = Farming.CROPS[c]; const age = k === 3 ? def.days : Math.ceil(def.days * k / 3);
                P[(${block.x} + k) + "," + (${block.y} + i)] = { s: "tilled", crop: c, day: today - age }; } });
            Farming.farm().rev = (Farming.farm().rev || 0) + 1; return 0; })()`);
        await t.eval(`$gamePlayer.locate(${block.x} + 2, ${block.y} + 6); $gameMap.setDisplayPos(${block.x} - 10, ${block.y} - 4); 0`);
        await t.frames(40);
        const stages = await t.json(`["flax", "oats", "beet", "onion", "garlicCrop", "pea"].map((c, i) => [0, 1, 2, 3].map(k => Farming.cropStage(${block.x} + k, ${block.y} + i, Farming.plotAt(${block.x} + k, ${block.y} + i))).join(""))`);
        t.check("każda nowa uprawa ma 4 fazy (0 zasiane .. 3 dojrzałe)", stages.every(s => s === "0123"), stages);
        if (SHOTS) await t.shot(SHOTS + "/pole_nowe_uprawy.png");
        // the harvest of ripe flax: fibre
        const f0 = await t.json("$gameParty.numItems($dataItems[92])");
        await t.eval(`$gamePlayer.locate(${block.x} + 3, ${block.y} + 1); $gamePlayer.setDirection(8); $gameSystem.setStamina && $gameSystem.setStamina(100); Farming.harvest(${block.x} + 3, ${block.y}); 0`);
        await t.frames(120);
        const f1 = await t.json("$gameParty.numItems($dataItems[92])");
        t.check("zbiór lnu daje włókno (3-5)", f1 - f0 >= 3 && f1 - f0 <= 5, { f0, f1 });

        // ================= 3. the apple tree from pips =================
        await t.setDay(40, 10);
        const ax = block.x + 2, ay = block.y + 8;
        const apple = await t.json(`(() => {
            const P = Farming.farm().plots[218]; P["${ax},${ay}"] = { s: "cleared" }; Farming.farm().rev++;
            $gameParty.gainItem($dataItems[499], 2); $gameSystem.setStamina && $gameSystem.setStamina(100);
            $gamePlayer.locate(${ax}, ${ay} + 1);
            return { why: Forestry.whyNot(${ax}, ${ay}), entry: Forestry.appleEntry(${ax}, ${ay}).name, ok: Forestry.plant(${ax}, ${ay}, "apple") }; })()`);
        await t.frames(120);
        const young = await t.json(`(() => { const e = $gameMap.events().find(e => e.x === ${ax} && e.y === ${ay} && e.eventId() >= 1000); if (!e) return null;
            return { id: e.eventId(), name: e.event().name, pic: e.characterName(), page: e._pageIndex, C: $gameSelfSwitches.value([218, e.eventId(), "C"]), fruit: ChoppableTree.treeConfig(e).fruit }; })()`);
        t.check("„Posadź jabłoń”: siewka stoi na mapie, bez owoców (strona gołego drzewa)", apple.ok && young && young.name === "Posadzona jabłoń" && young.pic === "!$Sapling_Apple" && young.page === 1 && young.C && !young.fruit, { apple, young });
        if (young) {
            await t.eval(`(() => { const rec = Forestry.treesOf(218).find(r => r.id === ${young.id}); rec.day -= 12; const e = $gameMap.event(${young.id}); Forestry.applyGrowth(e); e.refresh(); $gameMap.requestRefresh(); return 0; })()`);
            await t.frames(30);
            const g = await t.json(`(() => { const e = $gameMap.event(${young.id}); return { pic: e.characterName(), page: e._pageIndex, fruit: ChoppableTree.treeConfig(e).fruit, scale: ChoppableTree.treeConfig(e).scale }; })()`);
            t.check("po 12 dniach dorosła jabłoń latem rodzi Jabłka (strona z owocami)", g.page === 0 && g.pic === "!$Tree_Apple" && g.fruit === 505 && g.scale > 0.6, g);
            const a0 = await t.json("$gameParty.numItems($dataItems[505])");
            await t.eval(`Tawerna.api("ChoppableTree_parts").objects.pickFruit({ _eventId: ${young.id} }); 0`);
            await t.frames(20);
            const a1 = await t.json(`({ n: $gameParty.numItems($dataItems[505]), page: $gameMap.event(${young.id})._pageIndex })`);
            t.check("zerwane jabłka trafiają do plecaka, drzewo zostaje gołe", a1.n > a0 && a1.page === 1, { a0, a1 });
        }

        // ================= 4. the oats in the trough =================
        const feed = await t.json(`(() => { const today = $gameSystem.dayNightDay(), b = { type: "coop", x: 0, y: 0, last: today - 1 };
            const r = [Farming.readyProduce(b)]; b.fed = true; r.push(Farming.readyProduce(b)); b.last = today; r.push(Farming.readyProduce(b)); return r; })()`);
        t.check("owies w korycie: o jedno jajko więcej, ale tylko do tego, co już jest (2 -> 3, 0 zostaje 0)", feed.join() === "2,3,0", feed);
    }

    // ================= 5. the wild ones on Podgrodzie's meadows =================
    await t.go(218, 30, 18);
    await t.setDay(40, 10);   // summer
    await t.frames(30);
    const wild = await t.json(`(() => { const n = {}; const L = Farming.gatherTiles(); for (let i = 0; i < L.length; i += 3) { const k = Farming.gatherAt(L[i], L[i + 1]); if (k) n[k] = (n[k] || 0) + 1; } return n; })()`);
    t.check("latem na łąkach: poziomki, dziki owies, groszek, burak, cebula", ["strawberry", "wildOat", "wildPea", "wildBeet", "wildOnion"].every(k => wild[k] > 0), wild);
    const pickOne = async (kind, itemId) => {
        const spot = await t.json(`(() => { const L = Farming.gatherTiles(); for (let i = 0; i < L.length; i += 3) { const x = L[i], y = L[i + 1];
            if (Farming.gatherAt(x, y) === "${kind}" && $gameMap.isPassable(x, y + 1, 8) && !$gameMap.eventsXy(x, y + 1).length) return { x, y }; } return null; })()`);
        if (!spot) return null;
        const n0 = await t.json(`$gameParty.numItems($dataItems[${itemId}])`);
        await t.eval(`$gamePlayer.locate(${spot.x}, ${spot.y} + 1); $gamePlayer.setDirection(8); $gameSystem.setStamina && $gameSystem.setStamina(100); Farming.pickGather(${spot.x}, ${spot.y}); 0`);
        await t.frames(90);
        return { spot, got: (await t.json(`$gameParty.numItems($dataItems[${itemId}])`)) - n0 };
    };
    const straw = await pickOne("strawberry", 506);
    t.check("zerwane poziomki trafiają do plecaka", straw && straw.got >= 1, straw);
    if (SHOTS && straw) { await t.eval(`$gameMap.setDisplayPos(${straw.spot.x} - 12, ${straw.spot.y} - 7); 0`); await t.frames(20); await t.shot(SHOTS + "/laka_lato.png"); }
    const onion = await pickOne("wildOnion", 502);
    t.check("dzika cebula daje cebulę (czasem z dymką)", onion && onion.got >= 1, onion);

    // bushes by kind: in autumn all bear; in spring only the blueberries
    await t.setDay(62, 10);
    await t.frames(20);
    const bushes = await t.json(`(() => { const out = {}; const L = Farming.gatherTiles(); for (let i = 0; i < L.length; i += 3) { if (L[i + 2] !== "bush") continue;
        const x = L[i], y = L[i + 1], k = Farming.bushKind(x, y).key; if (!Farming.gatherAt(x, y)) continue; out[k] = out[k] || { n: 0, full: 0, at: null }; out[k].n++;
        if (Farming.bushState(x, y) === "full") { out[k].full++; if (!out[k].at && $gameMap.isPassable(x, y + 1, 8)) out[k].at = { x, y }; } } return out; })()`);
    t.check("jesienią owocują wszystkie cztery rodzaje krzaków", ["blueberry", "raspberry", "blackberry", "hazel"].every(k => bushes[k] && bushes[k].full > 0), bushes);
    const ITEM_OF = { blueberry: 102, raspberry: 507, blackberry: 508, hazel: 509 };
    const gotBush = {};
    for (const k of Object.keys(ITEM_OF)) {
        const at = bushes[k] && bushes[k].at;
        if (!at) continue;
        const n0 = await t.json(`$gameParty.numItems($dataItems[${ITEM_OF[k]}])`);
        await t.eval(`$gamePlayer.locate(${at.x}, ${at.y} + 1); $gamePlayer.setDirection(8); $gameSystem.setStamina && $gameSystem.setStamina(100); Farming.pickGather(${at.x}, ${at.y}); 0`);
        await t.frames(90);
        gotBush[k] = (await t.json(`$gameParty.numItems($dataItems[${ITEM_OF[k]}])`)) - n0;
    }
    t.check("krzak daje swoje: jagody, maliny, jeżyny, orzechy laskowe", Object.keys(ITEM_OF).every(k => gotBush[k] >= 2), gotBush);
    if (SHOTS && bushes.hazel && bushes.hazel.at) { await t.eval(`$gameMap.setDisplayPos(${bushes.hazel.at.x} - 12, ${bushes.hazel.at.y} - 7); 0`); await t.frames(20); await t.shot(SHOTS + "/krzaki_jesien.png"); }
    await t.setDay(10, 10);
    await t.frames(20);
    const spring = await t.json(`(() => { const out = {}; const L = Farming.gatherTiles(); for (let i = 0; i < L.length; i += 3) { if (L[i + 2] !== "bush") continue;
        const k = Farming.bushKind(L[i], L[i + 1]).key; out[k] = out[k] || 0; if (Farming.bushState(L[i], L[i + 1]) === "full") out[k]++; } return out; })()`);
    t.check("wiosną owocują tylko borówki (maliny i jeżyny od lata, leszczyna jesienią)", spring.blueberry > 0 && !spring.raspberry && !spring.blackberry && !spring.hazel, spring);

    // ================= 6. oyster mushrooms on the stumps =================
    const oy = await t.json(`(() => { const stumps = $gameMap.events().filter(e => Boczniaki.isStump(e)); const by = {};
        for (let d = 57; d <= 112; d++) { $gameSystem._dayNightDay = d; by[d] = stumps.filter(e => Boczniaki.hasOyster(e)).length; }
        $gameSystem._dayNightDay = 5; const spring = stumps.filter(e => Boczniaki.hasOyster(e)).length;
        const days = Object.keys(by).filter(d => by[d] > 0); return { stumps: stumps.length, days: days.length, best: days.sort((a, b) => by[b] - by[a])[0], spring }; })()`);
    t.check("boczniaki rosną na pniakach jesienią i zimą (wiosną nie)", oy.stumps > 5 && oy.days > 10 && oy.spring === 0, oy);
    if (oy.best) {
        await t.setDay(Number(oy.best), 10);
        await t.frames(20);
        const st = await t.json(`(() => { const free = e => [[0, 1], [0, 2], [-1, 1], [1, 1], [1, 0]].every(([dx, dy]) => !$gameMap.eventsXy(e.x + dx, e.y + dy).some(o => o !== e && o.characterName()));
            const all = $gameMap.events().filter(e => Boczniaki.hasOyster(e) && $gameMap.isPassable(e.x + 1, e.y, 4)); const e = all.find(free) || all[0];   // (one no tree stands in front of)
            return e ? { id: e.eventId(), x: e.x, y: e.y } : null; })()`);
        if (st) {
            const n0 = await t.json("$gameParty.numItems($dataItems[510])");
            await t.eval(`$gamePlayer.locate(${st.x} + 1, ${st.y}); $gamePlayer.setDirection(4); $gameMap.setDisplayPos(${st.x} - 12, ${st.y} - 7); 0`);
            await t.frames(30);
            const drawn = await t.json(`(() => { const sp = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gameMap.event(${st.id})); return !!(sp && sp._oyster && sp._oyster.visible && sp._oyster.bitmap.isReady()); })()`);
            t.check("boczniaki narysowane na pniaku", drawn);
            if (SHOTS) await t.shot(SHOTS + "/boczniaki.png");
            await t.eval(`Tawerna.api("ChoppableTree_parts").objects.strike({ _eventId: ${st.id} }, "dig"); 0`);
            await t.frames(90);
            const after = await t.json(`({ n: $gameParty.numItems($dataItems[510]), oy: Boczniaki.hasOyster($gameMap.event(${st.id})), stump: Boczniaki.isStump($gameMap.event(${st.id})) })`);
            t.check("O przy pniaku: najpierw boczniaki (2-4), pień zostaje", after.n - n0 >= 2 && !after.oy && after.stump, { n0, after });
        }
    }

    // ================= 7. the herbalist's seeds =================
    const herb = await t.json(`(() => { $gameSystem._dayNightDay = 5; const g = Nasiona_Zielarki.goods(); $gameParty.gainGold(100); const g0 = $gameParty.gold(), n0 = $gameParty.numItems($dataItems[493]);
        const ok = Nasiona_Zielarki.kup(493); return { g, ok, paid: g0 - $gameParty.gold(), got: $gameParty.numItems($dataItems[493]) - n0, rows: Nasiona_Zielarki.rows().length }; })()`);
    t.check("zielarka wiosną: nasiona na wiosnę i lato (len, owies, buraki...) i pestki; kupno: 6 miedziaków, 1 nasiono",
        [493, 494, 495, 496, 497, 498, 499, 67].every(id => herb.g.includes(id)) && herb.ok && herb.paid === 6 && herb.got === 1 && herb.rows === herb.g.length, herb);
});
