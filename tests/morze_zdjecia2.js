// zdjęcia W23 fala 2 (szkielety, kraby, krab-kolos, kapitan, duże macki, kości z dnia 10) do docs/zadania_nowe/potwory2_gra/ - w dzień, żeby było widać każdy szczegół.
// Uruchom z nakładką: GAME_OVERLAY=tools/potwory2/overlay GAME_OVERLAY_JS=1 CDP_PORT=9442 node tests/morze_zdjecia2.js
const kit = require("./lib/kit.js");
const S = "../docs/zadania_nowe/potwory2_gra/";
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", port: Number(process.env.CDP_PORT) || 9442 }, async t => {
    const J = e => t.json(e);
    // a creature frozen where it stands (no mind, facing the viewer): kind, offset from the hero
    const put = (k, dx, dy, face) => t.eval(`(function(){ const x = $gamePlayer.x + ${dx}, y = $gamePlayer.y + ${dy}; Creatures.spawn(${JSON.stringify(k)}, x, y, { tag: "morze", engaged: false, level: 1, single: true });
        const c = MorzePotwory.seaList().slice(-1)[0]; c._frozen = true; c._hunt = false; c._hp = 9999; c.setMode("idle"); c.setDirection(${face || 2}); c._idleF8 = 0; return 0; })()`);
    const free = (x, y) => t.eval(`(function(){ for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = ${x} + dx, Y = ${y} + dy;
        let ok = true; for (let a = -7; a <= 7 && ok; a++) for (let b = -5; b <= 5 && ok; b++) if (!$gameMap.isValid(X + a, Y + b) || !$gameMap.checkPassage(X + a, Y + b, 0x0f) || $gameMap.eventsXyNt(X + a, Y + b).length) ok = false;
        if (ok) { $gamePlayer.locate(X, Y); $gamePlayer.center(X, Y); return [X, Y]; } } return 0; })()`);
    await t.newGame({ map: 4, x: 30, y: 30, hour: 11, day: 45 });
    await t.eval("Object.assign(Morze.state(), { start: 1, pierwsze: 1 }); 0");
    const sz = await J("[$gameMap.width(), $gameMap.height()]");
    const spot = await free(Math.round(sz[0] / 2), Math.round(sz[1] / 2));
    await t.eval("$gamePlayer.setDirection(2); Creatures.clear('morze'); 0");
    // 1. the line-up: the five skeletons in a row, the hero, the two crabs under him
    for (const [k, dx] of [["szkielet_palka", -6], ["szkielet_miecz", -3], ["szkielet_wlocznia", 0], ["szkielet_mlot", 3], ["kapitan_szkieletow", 6]]) await put(k, dx, -3);
    await put("krab_olbrzym", -3, 3); await put("krab_kolos", 3, 3);
    await t.frames(60);
    await t.shot(S + "01_szeregiem_z_bohaterem.png");
    // 2. the giga crab next to the normal one and the hero
    await t.eval("Creatures.clear('morze'); 0");
    await put("krab_olbrzym", 1, 2); await put("krab_kolos", -4, 2);
    await t.frames(60);
    await t.shot(S + "02_krab_i_kolos.png");
    // 3. each kind alone, close up, next to the hero (south and east faces)
    const names = { szkielet_palka: "palka", szkielet_miecz: "miecz", szkielet_wlocznia: "wlocznia", szkielet_mlot: "mlot", kapitan_szkieletow: "kapitan", krab_olbrzym: "krab", krab_kolos: "kolos" };
    for (const [k, n] of Object.entries(names)) {
        await t.eval("Creatures.clear('morze'); 0");
        await put(k, k === "krab_kolos" ? 3 : 2, 0, 4);
        await t.eval("$gamePlayer.setDirection(6); 0");
        await t.frames(40);
        await t.shot(S + "03_obok_" + n + ".png");
    }
    // 4. blows: every weapon in the middle of its strike (a creature in front of the hero, its blow frozen at the hit frame)
    for (const [k, n] of Object.entries({ szkielet_palka: "palka", szkielet_miecz: "miecz", szkielet_wlocznia: "wlocznia", szkielet_mlot: "mlot", kapitan_szkieletow: "kapitan" })) {
        await t.eval("Creatures.clear('morze'); $gameParty.leader().setHp($gameParty.leader().mhp); 0");
        await put(k, 2, 0, 4);
        await t.eval(`(function(){ const c = MorzePotwory.seaList()[0]; c._frozen = false; c._ai = Object.assign({}, c._ai, { think() {}, calm() { return true; } }); c._engaged = true; c.startMove(${JSON.stringify(k === "kapitan_szkieletow" ? "over" : k === "szkielet_wlocznia" ? "thrust" : k === "szkielet_mlot" ? "smash" : k === "szkielet_palka" ? "bite" : "cut")}); return 0; })()`);
        const win = await J(`(function(){ const c = MorzePotwory.seaList()[0]; return c._modeT; })()`);
        await t.frames(Math.max(2, Math.round(win * 0.9)));
        await t.shot(S + "04_cios_" + n + "_zamach.png");
        await t.frames(8);
        await t.shot(S + "04_cios_" + n + "_trafia.png");
    }
    // 5. death: the heap of bones and what lies in it
    await t.eval("Creatures.clear('morze'); 0");
    await put("szkielet_miecz", 2, 0, 4);
    await t.eval(`(function(){ const c = MorzePotwory.seaList()[0]; c._frozen = false; Creatures.die(c, "test"); return 0; })()`);
    await t.frames(20); await t.shot(S + "05_smierc_w_trakcie.png");
    await t.frames(70); await t.shot(S + "05_smierc_stos_kosci.png");
    // 6. the big tentacles at the harbour (day 70 night): rings, then the arms
    await t.eval("Creatures.clear('morze'); Creatures.drops().length = 0; 0");
    await t.go(125, 60, 70, 2);
    await t.setDay(70, 12);
    await t.eval("$gamePlayer.locate(60, 70); $gamePlayer.center(60, 70); Morze.state().ostatniaMacka = 0; Morze.force('macki'); 0");
    const nearTent = (r) => t.eval(`(function(){ const t0 = MorzePotwory.tentacles.list()[0]; for (let rr = ${r}; rr >= 2; rr--) for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1]]) { const x = t0.x + dx * rr, y = t0.y + dy * rr; if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f)) { $gamePlayer.locate(x, y); $gamePlayer.center(x, y); return rr; } } return 0; })()`);
    await nearTent(6);
    await t.frames(70); await t.shot(S + "06_macki_kregi.png");
    await t.frames(160);
    await t.eval(`(function(){ MorzePotwory.tentacles.list().forEach(t => { t.phase = "idle"; t.t = 0; t.cd = 99999; }); return 0; })()`);
    await t.frames(30); await t.shot(S + "06_macki_wynurzone.png");
    await nearTent(3);
    await t.eval(`(function(){ const T = MorzePotwory.tentacles.list(); T.forEach((t, i) => { if (i) { t.phase = "sink"; t.t = 40; } }); T[0].phase = "strike"; T[0].t = 0; T[0].side = ($gamePlayer.x + 0.5 < T[0].x + 0.5) ? -1 : 1; $gameParty.leader().setHp($gameParty.leader().mhp); return 0; })()`);
    await t.frames(6); await t.shot(S + "06_macka_zamach.png");
    await t.frames(8); await t.shot(S + "06_macka_uderza.png");
    // 7. the day-10 beach: bones, a rusty sword, wet tracks
    await t.eval("MorzePotwory.tentacles.clear(); Morze.state().kosci = 0; Morze.state().noce = {}; 0");
    await t.setDay(10, 7.2);
    await t.eval(`Tawerna.emit("hourChange", { hour: 7, prev: 6, day: 10 }); 0`);
    await t.frames(60);
    await t.eval(`(function(){ const m = MorzePotwory.marks.list().find(x => x.kind === "bones"); if (m) { $gamePlayer.locate(Math.round(m.x) + 1, Math.round(m.y) + 3); $gamePlayer.center($gamePlayer.x, $gamePlayer.y); } return 0; })()`);
    await t.frames(40); await t.shot(S + "07_kosci_dzien10.png");
    // 8. the captain in the town by night (the street by the guardhouse), the watch coming
    await t.go(8, 98, 53, 2);
    await t.setDay(41, 21.5);
    const st = await t.eval(`(function(){ for (let r = 0; r < 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = 98 + dx, Y = 53 + dy; let ok = true;
        for (let a = -4; a <= 4 && ok; a++) for (let b = -5; b <= 2 && ok; b++) if (!$gameMap.isValid(X + a, Y + b) || !$gameMap.checkPassage(X + a, Y + b, 0x0f) || $gameMap.eventsXyNt(X + a, Y + b).some(e => !e._erased && e.isNormalPriority())) ok = false;
        if (ok) { $gamePlayer.locate(X, Y); $gamePlayer.center(X, Y); Creatures.clear("morze"); Creatures.spawn("kapitan_szkieletow", X + 1, Y - 5, { tag: "morze", engaged: true, level: 1, single: true }); const c = MorzePotwory.seaList()[0]; c._hunt = false; c._hp = 9999; MorzePotwory.watch.begin(); return [X, Y]; } } return 0; })()`);
    await t.eval("Combat && Combat.exit && Combat.exit(); 0"); await t.frames(50); await t.shot(S + "08_kapitan_miasto.png");
});
