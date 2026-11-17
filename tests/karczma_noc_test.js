// Noc w tawernie (js/plugins/Karczma_Noc.js, js/teksty/karczma_noc.txt): Borgar drzemie za ladą 2-6 (Zzz, budzi się zagadnięty,
// obsługa działa), Wanda śpi 22-6 (łaźnia nieczynna, nie znika na oczach), izba służby zamknięta 22-6.
// Uruchom: node tests/run.js karczma_noc --port 9472
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const pl = await J(`({ api: !!window.Karczma_Noc, list: $plugins.filter(p => p.status).map(p => p.name) })`);
    t.check("wtyczka Karczma_Noc działa, pod Pokojowka", pl.api && pl.list.indexOf("Karczma_Noc") > pl.list.indexOf("Pokojowka"), pl.list.slice(-5));

    // ---- Borgar at 3:00: dozes, wakes when spoken to, serves
    await t.newGame({ map: 1, x: 14, y: 17, dir: 8, hour: 3, quiet: true, minimap: false });
    await t.frames(60);
    await t.eval(`window.__zzz = 0; (function(){ const r = Game_Temp.prototype.requestBalloon; if (!window.__zzzW) { window.__zzzW = 1; Game_Temp.prototype.requestBalloon = function(t, id) { if (id === 10 && t && t.event && /^Borgar/.test(t.event().name)) window.__zzz++; return r.apply(this, arguments); }; } })(); 0`);
    await t.frames(900);
    const z = await J("({ zzz: window.__zzz, dozing: Karczma_Noc.dozing() })");
    t.check("3:00, bohater przy ladzie: Borgar drzemie - nad nim „Zzz”", z.dozing && z.zzz >= 1, z);
    await t.eval(`window.__said = []; (function(){ const SB = Tawerna.api("SpeechBubbles"); if (!window.__saidW) { window.__saidW = 1; const s = SB.say; SB.say = function(ev, text) { window.__said.push(String(text)); return s.apply(this, arguments); }; } })(); 0`);
    const talk = await t.talkTo("$gameMap.events().find(e => /^Lada/.test(e.event().name))", ["Wynajmij"]);
    const said = await J("window.__said");
    t.check("zagadnięty przy ladzie budzi się („Hę?!...”/„Mhm...”) i obsługuje: karta pokoi się otwiera", said.some(s => /Hę|Mhm|nie zamknąłem|nie śpię|Chyba/.test(s)) && talk.text.length > 0, { said, t: talk.text.slice(0, 160) });
    await t.setHour(10); await t.frames(120);
    t.check("10:00: Borgar nie drzemie", !(await J("Karczma_Noc.dozing()")));

    // ---- floor I at 23:00: Wanda away (the bath shut), the servants' room shut
    await t.go(25, 47, 21, 8);
    await t.setHour(23);
    await t.eval("$gamePlayer.requestMapReload(); 0"); await t.go(25, 47, 21, 8); await t.frames(60);
    const w1 = await J(`(function(){ const w = $gameMap.events().find(e => /Łaziebn/.test(e.event().name)); return w ? { hid: w.isTransparent(), away: !!w._kNocAway } : null; })()`);
    t.check("23:00: Wanda śpi w izbie służby - jej zdarzenia w łaźni nie ma (łaźnia nieczynna)", !!w1 && w1.hid && w1.away, w1);
    await t.popups({ clear: true });
    await t.eval("$gamePlayer.locate(47, 21); $gamePlayer.setDirection(8); 0");
    await t.hold("up", 40); await t.frames(30);
    const shut = await J("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })"), pops = await t.popups();
    t.check("23:00: drzwi izby służby zamknięte - „Służba śpi”, bohater zostaje na korytarzu", shut.map === 25 && shut.y <= 21 && shut.y >= 19 && pops.some(p => /Służba śpi/.test(p)), { shut, pops });
    // the morning: back, but never before the hero's eyes - he stands in the bath, then looks away
    await t.eval("$gamePlayer.locate(35, 27); 0"); await t.frames(20);
    await t.setHour(7); await t.frames(90);
    const w2 = await J(`(function(){ const w = $gameMap.events().find(e => /Łaziebn/.test(e.event().name)); return { hid: w.isTransparent(), sx: w.screenX(), sy: w.screenY() }; })()`);
    await t.eval("$gamePlayer.locate(4, 26); $gamePlayer.center(4, 26); 0"); await t.frames(90);
    const w3 = await J(`(function(){ const w = $gameMap.events().find(e => /Łaziebn/.test(e.event().name)); return { hid: w.isTransparent(), away: !!w._kNocAway }; })()`);
    t.check("7:00: Wanda nie pojawia się na oczach bohatera w łaźni; gdy odejdzie - wraca (łaźnia czynna)", w2.hid && !w3.hid && !w3.away, { w2, w3 });
    await t.eval("$gamePlayer.locate(47, 21); $gamePlayer.setDirection(8); 0");
    await t.hold("up", 40);
    const inRoom = await t.until("$gamePlayer.y >= 24", 6);
    t.check("7:00: izba służby otwarta - wejście prowadzi do środka", inRoom, await J("[$gamePlayer.x, $gamePlayer.y]"));
});
