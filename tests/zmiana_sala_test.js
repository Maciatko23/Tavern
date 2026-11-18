// The tavern shift live on the tavern's map (Zmiana_Sala.js, 2026-11-18): a bot plays it as the hero would - the real tables wiped (O
// held), wood from the pile to the hall's fireplaces, the rubbish out by the door, the keg's and the stove's close-ups, the evening's
// guests served from the counter - and the summary pays as the shift always did. CDP_PORT=9566.
const kit = require("./lib/kit.js");
const path = require("path");
const SHOTS = path.join(__dirname, "..", "docs", "zmiana_sala");
require("fs").mkdirSync(SHOTS, { recursive: true });

kit.test({ port: Number(process.env.CDP_PORT) || 9566, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    await t.newGame({ map: 1, x: 14, y: 19, day: 3, hour: 17, quiet: true, minimap: false });
    await t.frames(60);
    const S = () => t.json("ZmianaSala.state()");
    const gold0 = await t.gold();
    const done0 = await t.json("TavernShift.stats().done");
    await t.eval(`window.__end = null; TavernShift.start({ intro: "Do roboty!", onEnd: r => { window.__end = r; } }); 0`);
    let s = await S();
    t.check("zmiana idzie na mapie karczmy, nie w osobnej scenie", !!s && s.phase === "intro" && (await t.scene()) === "Scene_Map" && await t.json("TavernShift.liveRunning()"));
    t.check("zapis gry zablokowany w czasie zmiany", (await t.json("$gameSystem.isSaveEnabled()")) === false);
    for (let i = 0; i < 40 && (await S()).phase === "intro"; i++) { await t.dismiss(5); await t.frames(15); }
    s = await S();
    t.check(`przed otwarciem: ${s.tables.length} prawdziwych stołów sali, brudne ${s.dirty.length}, worki ${s.sacks.length}, drewno 0/${s.wood.need}`, s.phase === "clean" && s.tables.length >= 12 && s.dirty.length >= 4 && s.sacks.length >= 2);
    await t.shot(path.join(SHOTS, "1_przed_otwarciem.png"));

    // a free cell beside a table (8 round it)
    const STAND = (tb) => `(function(){ const tb = ${JSON.stringify(tb)}; for (let y = tb.y0 - 1; y <= tb.y1 + 1; y++) for (let x = tb.x0 - 1; x <= tb.x1 + 1; x++) {
        if (x >= tb.x0 && x <= tb.x1 && y >= tb.y0 && y <= tb.y1) continue;
        if ($gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority())) return [x, y]; } return null; })()`;
    const go = async (x, y, d) => { await t.locate(x, y, d || 2); await t.frames(8); };
    // the dirty tables: O held by each
    let shotTable = false;
    for (const id of s.dirty) {
        const tb = s.tables.find(q => q.id === id), at = await t.json(STAND(tb));
        if (!at) continue;
        await go(at[0], at[1], 8);
        if (!shotTable) {
            shotTable = true;
            await t.frames(10);
            const tg = (await S()).target;
            t.check(`przy brudnym stole napis „O: ${tg && tg.label}”`, !!tg && tg.kind === "wipe" && /Przetrzyj/.test(tg.label));
            await t.shot(path.join(SHOTS, "1b_przy_stole.png"));
        }
        await t.press("ok", 70);
        await t.frames(4);
    }
    s = await S();
    t.check(`stoły przetarte (zostało brudnych: ${s.dirty.length})`, s.dirty.length === 0 || s.phase !== "clean");
    // the wood: two logs, a fire, one more
    const P = await t.json("ZmianaSala.PLACES");
    for (let trip = 0; trip < 2 && (await S()).phase === "clean"; trip++) {
        await go(21, 37, 8); await t.press("ok"); await t.frames(6); await t.press("ok"); await t.frames(6);
        await go(trip ? 23 : 5, 14, 4); await t.press("ok"); await t.frames(6); await t.press("ok"); await t.frames(6);
    }
    // the rubbish
    for (const sk of (await S()).sacks.filter(q => q.state === "lying")) {
        if ((await S()).phase !== "clean") break;
        await go(sk.x, sk.y, 2); await t.press("ok"); await t.frames(6);
        await go(14, 40, 2); await t.press("ok"); await t.frames(6);
    }
    await t.frames(20);
    s = await S();
    t.check(`przed otwarciem zrobione, teraz piwo (${s.phase}, wyniki: ${s.results})`, s.phase === "beer" && s.results.includes("clean"));

    // the keg: its close-up (the scene's beer part), skipped to its end, back on the map
    await go(11, 15, 8); await t.press("ok"); await t.frames(40);
    t.check("przy beczce otwiera się zbliżenie nalewania", await t.json("TavernShift.isRunning() && TavernShift.state().parts.join() === 'beer'"));
    await t.until("TavernShift.state() && TavernShift.state().phase === 'card'", 20);
    await t.press("ok"); await t.frames(20);
    await t.eval("TavernShift.skip(90); 0"); await t.frames(30);
    for (let i = 0; i < 6 && await t.json("TavernShift.isRunning()"); i++) { await t.press("ok"); await t.frames(30); }
    await t.until("SceneManager._scene instanceof Scene_Map && !TavernShift.isRunning()", 20);
    s = await S();
    t.check(`po piwie: kuchnia (${s.phase})`, s.phase === "kitchen" && s.results.includes("beer"));
    // the stove
    await go(9, 6, 8); await t.press("ok"); await t.frames(40);
    t.check("przy piecu otwiera się zbliżenie kuchni", await t.json("TavernShift.isRunning() && TavernShift.state().parts.join() === 'kitchen'"));
    await t.until("TavernShift.state() && TavernShift.state().phase === 'card'", 20);
    await t.press("ok"); await t.frames(20);
    await t.eval("TavernShift.skip(85); 0"); await t.frames(30);
    for (let i = 0; i < 6 && await t.json("TavernShift.isRunning()"); i++) { await t.press("ok"); await t.frames(30); }
    await t.until("SceneManager._scene instanceof Scene_Map && !TavernShift.isRunning()", 20);
    s = await S();
    t.check(`po kuchni: wieczór na sali (${s.phase}), na ladzie ${s.slots.length} dań`, s.phase === "serve" && s.slots.length >= 4);

    // the evening: guests come in and order; the bot carries their dishes from the counter
    await go(14, 20, 2);
    await t.until("ZmianaSala.state().guests.some(g => g.state === 'wait')", 60);
    await t.frames(120);
    await t.shot(path.join(SHOTS, "2_wieczor_zamowienia.png"));
    let served = 0, shotCounter = false;
    for (let round = 0; round < 24 && served < 4; round++) {
        await t.until("ZmianaSala.state().guests.some(g => g.state === 'wait')", 25);
        s = await S();
        const g = s.guests.find(q => q.state === "wait");
        if (!g) continue;
        const want = g.order.find((k, i) => !g.got[i]), slot = s.slots.find(q => q.key === want);
        await go(slot.x, 18, 8);
        if (!shotCounter) { shotCounter = true; await t.frames(10); await t.shot(path.join(SHOTS, "2b_przy_ladzie.png")); }
        await t.press("ok"); await t.frames(6);
        const seat = await t.json(`GoscieSala.shift.seats().find(q => q.x === ${g.seat[0]} && q.y === ${g.seat[1]})`);
        await go(seat.ax, seat.ay, seat.side === 6 ? 6 : 4); await t.frames(4);
        await t.press("ok"); await t.frames(8);
        const after = (await S()).guests.find(q => q.id === g.id);
        if (after && after.got.some(Boolean)) served++;
    }
    s = await S();
    t.check(`goście obsłużeni z lady przy prawdziwych stołach (podane ${s.stats.served}, zamówienia ${s.stats.orders}, napiwki ${Math.round(s.tips)} G)`, s.stats.served >= 3);
    await t.frames(300);
    await t.shot(path.join(SHOTS, "3_wieczor_jedza.png"));
    // the end: the summary, the pay
    await t.eval("ZmianaSala.skip(); 0");
    await t.until("TavernShift.isRunning() && TavernShift.state().phase === 'summary'", 30);
    await t.shot(path.join(SHOTS, "4_podsumowanie.png"));
    await t.frames(40); await t.press("ok");
    await t.until("window.__end && SceneManager._scene instanceof Scene_Map", 30);
    const end = await t.json("window.__end");
    const gold1 = await t.gold(), done1 = await t.json("TavernShift.stats().done");
    t.check(`podsumowanie wypłaciło (${end.total} G: dniówka ${end.pay} + napiwki ${end.tips}, ocena ${end.grade}), sakiewka ${gold0} -> ${gold1}`, gold1 - gold0 === end.total && end.total > 0 && end.live);
    t.check(`zmiana policzona (${done0} -> ${done1}), już nie trwa, zapis znowu działa`, done1 === done0 + 1 && !(await t.json("TavernShift.liveRunning()")) && (await t.json("$gameSystem.isSaveEnabled()")));
    t.check("goście sali wrócili do swoich godzin", (await t.json("GoscieSala.shift.running()")) === false);
});
