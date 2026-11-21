// Mąka z młyna (2026-11-19): piekarnia już tylko piecze; mieli młynarz w Podgrodziu (Mlynarz.js, za miedziaki), własny młyn na działce
// (Farming_Data: mill - skrzydła kręcą się przy mieleniu) albo żarna (ręcznie, długo, 1 mąka z 3 garści). Obrazki: bez szyb, bez worków.
//   CDP_PORT=9473 node tests/mlyn_test.js        (ZRZUTY=folder: zrzut młyna na działce)
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9473, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    const SHOTS = process.env.ZRZUTY ? require("path").resolve(process.env.ZRZUTY) : "";
    const d = await t.json(`({ bakery: Farming.BUILDINGS.bakery.recipes.map(r => r.id), mill: Farming.BUILDINGS.mill && Farming.BUILDINGS.mill.recipes.map(r => [r.id, r.inputs, r.output, !!r.manual]),
        quern: Farming.BUILDINGS.quern && Farming.BUILDINGS.quern.recipes.map(r => [r.id, r.inputs, r.output, !!r.manual]), sails: Farming.BUILDINGS.mill && Farming.BUILDINGS.mill.sails,
        miller: !!window.Mlynarz })`);
    t.check("piekarnia tylko piecze (chleb, placek), mielenia w niej nie ma", d.bakery.join() === "bread,berry_pie", d.bakery);
    t.check("własny młyn: 3 jęczmienia -> 2 mąki, sam (nie ręcznie), ze skrzydłami", JSON.stringify(d.mill) === JSON.stringify([["flour", [[74, 3]], [82, 2], false]]) && !!d.sails, d.mill);
    t.check("żarna: 3 jęczmienia -> 1 mąka, ręcznie", JSON.stringify(d.quern) === JSON.stringify([["quern_flour", [[74, 3]], [82, 1], true]]), d.quern);
    t.check("wtyczka młynarza wczytana", d.miller);
    const pics = JSON.parse(await t.eval(`new Promise(res => { const bs = ["Farm_Mill_L", "Farm_Mill_Sails", "Farm_Quern", "Farm_Bakery_L"].map(n => ImageManager.loadSystem(n));
        const chk = () => { if (bs.some(b => !b.isReady() && !b.isError())) return setTimeout(chk, 50); res(JSON.stringify(bs.map(b => [b._url.split("/").pop(), b.isError() ? 0 : b.width, b.isError() ? 0 : b.height]))); }; chk(); })`));
    t.check("obrazki młyna, skrzydeł, żaren", pics.every(p => p[1] > 0), pics);

    // ---- the miller of Podgrodzie
    await t.newGame({ map: 218, day: 40, hour: 9, quiet: true, minimap: false });
    await t.frames(60);
    const m = await t.json(`(() => { $gameParty.gainItem($dataItems[74], 7); $gameParty.gainGold(50);
        const ev = $gameMap.events().find(e => TownLife && TownLife.keyOf ? TownLife.keyOf(e) === "nowy_mlynarz" : false);
        const rows = Mlynarz.rows().map(r => r.label);
        const b0 = $gameParty.numItems($dataItems[74]), f0 = $gameParty.numItems($dataItems[82]), g0 = $gameParty.gold();
        const k = Mlynarz.miel(2);
        return { rows, k, barley: b0 - $gameParty.numItems($dataItems[74]), flour: $gameParty.numItems($dataItems[82]) - f0, paid: g0 - $gameParty.gold(), seen: !!ev,
            talkRows: Tawerna.talk.rows ? Tawerna.talk.rows("nowy_mlynarz", { who: "nowy_mlynarz", ev: ev || null }, []).map(r => r.label) : null }; })()`);
    t.check("młynarz: 2 razy po 3 jęczmienia -> 4 mąki za 6 miedziaków (jego wiersze w rozmowie)", m.k === 2 && m.barley === 6 && m.flour === 4 && m.paid === 6 && m.rows.length === 2
        && (!m.talkRows || m.talkRows.some(l => /Zmiel jęczmień/.test(l))), m);
    const none = await t.json(`(() => { const f0 = $gameParty.numItems($dataItems[82]); const k = Mlynarz.miel(1); return { k, flour: $gameParty.numItems($dataItems[82]) - f0 }; })()`);
    t.check("bez 3 garści jęczmienia nic nie zmieli", none.k === 0 && none.flour === 0, none);

    // ---- the own mill and the quern on grandpa's field: built (put straight into the farm), the sails turn faster while it grinds
    const spot = await t.json(`(() => { for (let y = 12; y < 24; y++) for (let x = 22; x < 38; x++) {
            const ok = [[0, 0], [1, 0], [2, 0], [0, -1], [1, -1], [2, -1], [4, 0]].every(([dx, dy]) => { const p = Farming.plotAt(x + dx, y + dy); return p && p.s === "cleared" && !Farming.buildingAt(x + dx, y + dy); });
            if (ok) return { x, y }; } return null; })()`);
    t.check("na polu dziadka jest miejsce na młyn i żarna", !!spot, spot);
    if (spot) {
        await t.eval(`(() => { const f = Farming.farm(), L = f.buildings[218] = f.buildings[218] || [];
            $gameMap.eventsXy(${spot.x}, ${spot.y}).concat($gameMap.eventsXy(${spot.x} + 1, ${spot.y}), $gameMap.eventsXy(${spot.x}, ${spot.y} - 1), $gameMap.eventsXy(${spot.x} + 1, ${spot.y} - 1), $gameMap.eventsXy(${spot.x} + 2, ${spot.y}), $gameMap.eventsXy(${spot.x} + 2, ${spot.y} - 1), $gameMap.eventsXy(${spot.x} + 4, ${spot.y})).forEach(e => e.erase());
            L.push({ id: 9901, type: "mill", x: ${spot.x}, y: ${spot.y}, v: 2 }, { id: 9902, type: "quern", x: ${spot.x} + 4, y: ${spot.y}, v: 2 });
            f.rev = (f.rev || 0) + 1; $gamePlayer.locate(${spot.x} + 3, ${spot.y} + 1); $gameMap.setDisplayPos(${spot.x} - 12, ${spot.y} - 9); return 0; })()`);
        await t.frames(40);
        const sailsOf = `(() => { const bs = SceneManager._scene._spriteset._farmBuildings || SceneManager._scene._spriteset._buildingSprites; const L = bs && bs._sprites ? bs._sprites : [];
            const e = L.find(e => e.b.id === 9901); return e && e.sails ? { rot: e.sails.rotation, ready: e.sails.bitmap.isReady(), speed: e.sailSpeed } : null; })()`;
        let s0 = await t.json(sailsOf);
        if (!s0) {   // (the layer's field name: look for it)
            const names = await t.json(`Object.keys(SceneManager._scene._spriteset).filter(k => { const v = SceneManager._scene._spriteset[k]; return v && v._sprites && Array.isArray(v._sprites); })`);
            console.log("   warstwy z _sprites: " + JSON.stringify(names));
        }
        t.check("własny młyn stoi na polu ze skrzydłami", !!s0 && s0.ready, s0);
        await t.frames(120);
        const idle = await t.json(sailsOf);
        const started = await t.json(`(() => { $gameParty.gainItem($dataItems[74], 3); const b = Farming.farm().buildings[218].find(b => b.id === 9901); return Farming.startJob(b, "flour", 1); })()`);
        await t.frames(240);
        const busy = await t.json(sailsOf);
        await t.frames(60);
        const busy2 = await t.json(sailsOf);
        t.check("przy mieleniu skrzydła kręcą się wyraźnie szybciej niż bez pracy", s0 && idle && busy && busy2 && started !== false && (busy2.rot - busy.rot) > 4 * Math.max(0.01, idle.rot - s0.rot) / 2 && busy2.speed > 0.03,
            { s0, idle, started, busy, busy2 });
        if (SHOTS) await t.shot(SHOTS + "/mlyn_na_polu.png");
        // the quern by hand: 3 barley -> 1 flour, the hours pass
        $: {
            const q = await t.json(`(() => { $gameParty.gainItem($dataItems[74], 3); $gameSystem.setStamina && $gameSystem.setStamina(100);
                const b = Farming.farm().buildings[218].find(b => b.id === 9902), r = Farming.recipeOf(b, "quern_flour");
                window.__q = { f0: $gameParty.numItems($dataItems[82]), h0: $gameSystem.dayNightHour(), b0: $gameParty.numItems($dataItems[74]) };
                return { ok: Farming.craftManual(b, r) }; })()`);
            await t.frames(150);
            const q2 = await t.json(`({ flour: $gameParty.numItems($dataItems[82]) - __q.f0, barley: __q.b0 - $gameParty.numItems($dataItems[74]), hours: +(($gameSystem.dayNightHour() - __q.h0 + 24) % 24).toFixed(1) })`);
            t.check("żarna: 3 jęczmienia na 1 mąkę, mija kilka godzin", q.ok !== false && q2.flour === 1 && q2.barley === 3 && q2.hours >= 2.5, { q, q2 });
        }
    }
});
