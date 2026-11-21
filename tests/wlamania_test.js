// Nocne włamania (js/plugins/Wlamania.js, 2026-11-19): drzwi domów nocą na wytrych (skradanie, O), domownicy śpią w łóżkach (głowa na
// poduszce), łóżko tam, gdzie go nie było, budzenie hałasem - „Złodziej!”, opinia w dół; strażnicy w wartowni też śpią.
//   CDP_PORT=9476 node tests/wlamania_test.js        (ZRZUTY=folder: śpiąca w łóżku, łóżko w lepiance, wartownia)
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9476, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    const SHOTS = process.env.ZRZUTY ? require("path").resolve(process.env.ZRZUTY) : "";
    t.check("wtyczka wczytana", await t.json("!!window.Wlamania && !!window.Zamki"));
    const sneak = on => t.eval(`Tawerna.state("hunt").sneak = ${on ? "true" : "false"}; 0`);
    const shotAt = async (name, x, y) => { if (!SHOTS) return; await t.eval(`$gameMap.setDisplayPos(${x} - 6, ${y} - 4); 0`); await t.frames(8); await t.shot(SHOTS + "/" + name); };
    // 1. by day the house door opens as before
    await t.newGame({ map: 220, x: 13, y: 35, dir: 8, day: 12, hour: 11, quiet: true, minimap: false });
    await t.eval(`if (window.ZamkiGra) ZamkiGra.enabled(false); 0`);   // (the rules by the ring here; the mini-games: tests/zamki_gra_test.js)
    await t.frames(30);
    const day = await t.json(`(() => { const ev = $gameMap.event(4); return { door: !!Wlamania.doorOf(ev), shut: Wlamania.doorShut(Wlamania.doorOf(ev)) }; })()`);
    t.check("drzwi domu Doroty: za dnia otwarte (wytrych niepotrzebny)", day.door && day.shut === false, day);
    // 2. at night: shut; sneaking with a lockpick - picked (a solid lock, the town), in at once
    await t.setHour(23);
    await t.eval(`$gamePlayer.locate(13, 35); $gamePlayer.setDirection(8); $gameParty.gainItem($dataItems[515], 3); for (const k in Zamki.LEVEL) Zamki.LEVEL[k].brk = 0; 0`);
    // (2026-11-19, the user: touching the door - "milion wiadomości") touched again and again: one "Zamknięte." in 5 s, no lockpick talk
    await t.popups({ clear: true });
    for (let i = 0; i < 20; i++) { await t.eval(`$gameMap.event(4).start(); 0`); await t.frames(3); }
    let pops = await t.popups({ clear: true });
    t.check("dotykanie zamkniętych drzwi 20 razy: jedno „Zamknięte.”, bez gadania o wytrychu", pops.filter(p => /Zamknięte/.test(p)).length === 1 && !pops.some(p => /Wytrychem/.test(p)), pops);
    await t.key("O", 4);
    pops = await t.popups({ clear: true });
    t.check("nocą bez skradania: „Zamek solidny. Wytrychem otworzysz tylko w skradaniu (C).”", pops.some(p => /Zamek solidny\. Wytrychem/.test(p)), pops);
    await sneak(true);
    await t.eval(`$gamePlayer.locate(13, 35); $gamePlayer.setDirection(8); 0`);
    await t.key("O", 4);
    const p0 = await t.json(`Zamki.picking()`);
    await t.key("O", 300);
    await t.until("$gameMap.mapId() === 184 && !$gamePlayer.isTransferring()", 20);
    await t.frames(30);
    const inside = await t.json(`(() => { const S = Wlamania.sleepers(), r = Wlamania.room(); return { map: $gameMap.mapId(), level: ${p0 ? p0.level : 0}, picked: Wlamania.state().picked[184] === Wlamania.nightKey(),
        sleepers: S.map(e => ({ key: Wlamania.sleepOf(e).key, bed: Wlamania.sleepOf(e).bed, transparent: e.isTransparent() })), beds: r ? r.beds.length : 0 }; })()`);
    t.check("wytrychem (zamek solidny, 2) i od razu do środka; drzwi otwarte do rana", inside.map === 184 && inside.level === 2 && inside.picked, inside);
    t.check("szwaczka śpi w swoim łóżku (głowa na poduszce), jej stojąca postać schowana", inside.sleepers.length === 1 && inside.sleepers[0].key === "szwaczka" && inside.sleepers[0].transparent
        && inside.sleepers[0].bed.x === 15 && inside.sleepers[0].bed.y === 4, inside);
    const view = await t.json(`(() => { const L = SceneManager._scene._spriteset._spiacy; const e = [...L._s.values()][0]; return e ? { head: e.head.visible, framed: e.framed, h: e.head.height, z: e.z.visible } : null; })()`);
    t.check("na poduszce widać głowę, nad nią „z”", view && view.head && view.framed && view.h > 10 && view.h < 30, view);
    const sees = await t.json(`Widzenie.watchers().map(e => e.event().name)`);
    t.check("śpiąca nic nie widzi (nie ma jej wśród patrzących)", !sees.some(n => /Dorota|szwaczk/i.test(n)), sees);
    if (SHOTS) { await t.eval(`$gamePlayer.locate(12, 7); 0`); await shotAt("wlamanie_spiaca.png", 15, 5); }
    // 3. sneaking by the bed: she sleeps on; walking by without sneaking: she wakes - "Złodziej!", the opinion down
    await t.eval(`$gamePlayer.locate(14, 6); 0`);
    await t.frames(120);
    const still = await t.json(`({ n: Wlamania.sleepers().length, wake: Wlamania.wakeOf("szwaczka") })`);
    t.check("skradając się obok łóżka - śpi dalej", still.n === 1 && still.wake < 0.6, still);
    const op0 = await t.json(`TownQuests.state().opinion`);
    await sneak(false);
    for (let i = 0; i < 6; i++) { await t.eval(`$gamePlayer.moveStraight(${i % 2 ? 4 : 6}); 0`); await t.frames(20); }
    await t.frames(30);
    const woke = await t.json(`(() => { const ev = TownLife.eventOf("szwaczka"); return { n: Wlamania.sleepers().length, visible: ev && !ev.isTransparent(), woke: Wlamania.state().woke.szwaczka === Wlamania.nightKey(), op: TownQuests.state().opinion }; })()`);
    t.check("bez skradania obok łóżka - budzi się, wstaje, „Złodziej!”, opinia miasteczka w dół", woke.n === 0 && woke.visible && woke.woke && woke.op < op0, { op0, woke });
    // 4. the straw beds (events "Posłanie..."): the child of Lepianka 1 asleep on one of them, no bed put in
    await t.go(204, 6, 8);
    await t.frames(30);
    const lep = await t.json(`(() => { const beds = $gameMap.events().filter(e => e.eventId() >= 5200 && e.eventId() <= 5229); const S = Wlamania.sleepers();
        return { put: beds.length, sleepers: S.map(e => ({ key: Wlamania.sleepOf(e).key, bed: Wlamania.sleepOf(e).bed })) }; })()`);
    t.check("lepianka: dziecko śpi na słomianym posłaniu (już było), nic nie dostawione", lep.put === 0 && lep.sleepers.length >= 1 && lep.sleepers[0].bed.straw === true, lep);
    if (SHOTS && lep.sleepers.length) await shotAt("wlamanie_lepianka.png", lep.sleepers[0].bed.x, lep.sleepers[0].bed.y);
    // 4b. a house with no bed of any kind (the rag-and-bone stall, Map116): a plain bed of the interior sheet by the wall, he sleeps in it
    await t.go(116, 3, 6);
    await t.frames(30);
    const kram = await t.json(`(() => { const beds = $gameMap.events().filter(e => e.eventId() >= 5200 && e.eventId() <= 5229); const S = Wlamania.sleepers();
        return { beds: beds.map(e => [e.eventId(), e.x, e.y, e.tileId(), e._priorityType]), sleepers: S.map(e => ({ key: Wlamania.sleepOf(e).key, bed: Wlamania.sleepOf(e).bed })) }; })()`);
    t.check("kram bez łóżka: dostawione zwykłe łóżko (rama, poduszka, koc) przy ścianie, szmaciarz w nim śpi", kram.beds.length === 3 && kram.sleepers.length >= 1 && kram.sleepers[0].bed.x === kram.beds[1][1] && kram.sleepers[0].bed.y === kram.beds[1][2], kram);
    if (SHOTS && kram.beds.length) await shotAt("wlamanie_kram.png", kram.beds[1][1], kram.beds[1][2]);
    // 5. the guardhouse: the guards asleep in their three beds
    await t.go(180, 15, 7);
    await t.frames(30);
    const war = await t.json(`Wlamania.sleepers().map(e => Wlamania.sleepOf(e).key)`);
    t.check("wartownia nocą: strażnicy śpią w łóżkach", war.length >= 1 && war.every(k => /kapral|straz/.test(k)), war);
    if (SHOTS) await shotAt("wlamanie_wartownia.png", 15, 5);
    // 6. by day nobody sleeps
    await t.setHour(12);
    await t.frames(20);
    const noon = await t.json(`Wlamania.sleepers().length`);
    t.check("w dzień nikt nie śpi", noon === 0, noon);
    await sneak(false);
});
