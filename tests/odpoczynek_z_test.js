// Odpoczynek klawiszem Z (2026-11-16, gracz: „można odpoczywać na ziemi pod niebem wszędzie”, „możesz dać z jako bazowy odpoczynek”):
// Z sadza bohatera tam, gdzie stoi, wszędzie pod gołym niebem (mapa z pogodą) - to samo tempo co „Odpocznij” na trawie działki
// (+20/godz., w deszczu +10), wstaje sam po wypoczęciu albo na klawisz. Pod dachem i w trybie walki - tylko komunikat, dlaczego nie.
// Uruchom: node tests/run.js odpoczynek_z --port 9474
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    t.check("Z w tabeli klawiszy to „rest”", await J("Input.keyMapper[90] === 'rest'"), await J("Input.keyMapper[90]"));

    // a free cell near (x, y) on this map: walkable, no event, open around it
    const freeNear = (x, y) => J(`(function(){ const ok = (a, b) => $gameMap.isValid(a, b) && $gameMap.checkPassage(a, b, 0x0f) && $gameMap.eventsXy(a, b).length === 0;
        for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const a = ${x} + dx, b = ${y} + dy;
            if (ok(a, b) && ok(a + 1, b) && ok(a - 1, b) && ok(a, b + 1) && ok(a, b - 1)) return [a, b]; } return null; })()`);
    const calm = "if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); $gameSystem._lastSleep = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour(); if (window.Farming && Farming.farm) Farming.farm().lastSleep = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour();";
    const state = () => J("({ st: Math.round($gameSystem.stamina()), sitting: !!$gamePlayer._toolSwing, h: $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour(), map: $gameMap.mapId() })");

    // ---- Podgrodzie, off grandpa's plot (no plot menu there - the grass by the road)
    await t.newGame({ map: 218, x: 40, y: 38, dir: 2, hour: 10, quiet: true, minimap: false });
    const c1 = await freeNear(40, 38);
    await t.eval(`$gamePlayer.locate(${c1[0]}, ${c1[1]}); ${calm} $gameSystem.setStamina(30); 0`);
    await t.frames(30);
    const off = await J(`({ plot: !!Farming.plotAt($gamePlayer.x, $gamePlayer.y), menu: !!Farming.menuFor($gamePlayer.x, $gamePlayer.y + 1) })`);
    const s0 = await state();
    await t.key("Z"); await t.frames(40);
    const s1 = await state();
    t.check("Podgrodzie poza działką (" + c1 + "): Z - siada na ziemi tam, gdzie stoi", s1.sitting && !off.plot, { off, s1 });
    await t.frames(150);
    const s2 = await state();
    t.check("siedząc: mijają godziny i wracają siły (+20/godz.)", s2.st >= s0.st + 30 && s2.h - s0.h >= 1.5, { s0, s2 });
    await t.until("!$gamePlayer._toolSwing", 15);
    const s3 = await state();
    t.check("wypoczęty wstaje sam (pełne siły)", !s3.sitting && s3.st >= 95, s3);

    // ---- Kruczogród, the street by the market: anywhere under the sky; a direction key gets him up
    const c2 = await (async () => { await t.go(220, 47, 45, 2); return freeNear(47, 45); })();
    await t.eval(`$gamePlayer.locate(${c2[0]}, ${c2[1]}); ${calm} $gameSystem.setStamina(40); 0`);
    await t.frames(30);
    await t.key("Z"); await t.frames(40);
    const s4 = await state();
    t.check("Kruczogród na ulicy (" + c2 + "): Z - siada", s4.sitting, s4);
    await t.frames(60);   // (sat down - resting)
    const s4b = await state();
    await t.hold("down", 4);
    await t.until("!$gamePlayer._toolSwing", 6);   // (standing up takes ~1.5 s at the calm pace)
    const s5 = await state();
    await t.frames(60);
    const s5b = await state();
    t.check("klawisz kierunku - przerywa odpoczynek i wstaje (siły przestają rosnąć)", s4b.st > 40 && !s5.sitting && s5b.st - s5.st <= 1, { s4b, s5, s5b });

    // ---- under a roof: the tavern's hall - no sitting on the floor, a popup says where
    await t.go(1, 16, 18, 2);
    await t.eval(`${calm} $gameSystem.setStamina(30); 0`);
    await t.popups({ clear: true });
    await t.key("Z"); await t.frames(40);
    const s6 = await state(), p6 = await t.popups();
    t.check("w tawernie (pod dachem): Z nie sadza, komunikat „Pod dachem usiądź na ławce albo połóż się do łóżka”", !s6.sitting && p6.some(p => /Pod dachem/.test(p)), { s6, p6 });

    // ---- the combat mode: no rest
    await t.go(218, c1[0], c1[1], 2);
    await t.eval(`${calm} $gameSystem.setStamina(30); 0`);
    await t.key("Tab"); await t.frames(20);
    await t.popups({ clear: true });
    await t.key("Z"); await t.frames(40);
    const s7 = await state(), p7 = await t.popups(), cm = await J("!!(window.Combat && Combat.combatMode())");
    t.check("w trybie walki: Z nie sadza, komunikat „W trybie walki nie odpoczniesz (Tab)”", cm && !s7.sitting && p7.some(p => /trybie walki/.test(p)), { cm, s7, p7 });
    await t.key("Tab"); await t.frames(20);

    // ---- the plot's own grass menu still says so, and the tired popup tells the key
    const help = await J(`(function(){ const p = $gamePlayer; for (let y = 11; y < 24; y++) for (let x = 22; x < 39; x++) { const m = Farming.menuFor(x, y); const e = m && m.entries && m.entries.find(e => e.name === "Odpocznij"); if (e) return e.help || ""; } return null; })()`);
    t.check("„Odpocznij” na działce mówi o klawiszu Z", !!help && /klawiszem Z/.test(help), help && help.slice(0, 120));
});
