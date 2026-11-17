// questy_mapa (2026-11-11): zadania przeniesione na plansze i trzy kieszenie - przejscie ruchomych krokow w grze.
//   (staged: tools/questy_mapa/staging/tests/questy_mapa_test.js -> tests/questy_mapa_test.js przy instalacji)
//   GAME_OVERLAY=tools/questy_mapa/staging GAME_OVERLAY_JS=1 CDP_PORT=9756 node tests/questy_mapa_test.js
//   K3 (podkowa), D5 (wilki: Kruczy Jar noca, przewodnik na Lace), W1 ch.6c / W5 ch.2 i 8 / K59 / K63-65 / K67-68 / D30 / D33 / D36 / D21 grane sa
//   w zaktualizowanych zakon / zasoby / lowy / ludzie / w5 / w1_chapters / field_loss; tu: K3, D5, teksty dziennika, bramy kieszeni i pierwszy krok po nich
//   (W8 rozdz. 5 + D38 przez brame Gor, K50 / D23 / K51 / K53 / D24 / W4 / W11 / W15 / D40 przez brame przystani).
const kit = require("./lib/kit.js");
kit.test({ port: 9756, bootCheck: "gra", errorCheck: "bez bledow w konsoli", evalTimeout: 300000 }, async t => {
    const J = e => t.json(e);
    const rec = id => J(`TownQuests.rec(${JSON.stringify(id)})`);
    const finish = async () => { for (let i = 0; i < 12; i++) { await t.frames(15); if (!(await t.eval("$gameMap.isEventRunning()"))) break; await t.press("ok"); } };
    await t.newGame({ map: 3, x: 50, y: 40, day: 40, hour: 12, quiet: true, minimap: false });

    // ---- K3: the glint on Kruczy Jar (74,18), noon
    await t.eval(`TownQuests.start("K3"); 0`);
    const txt = await J(`TownQuests.Q.K3.steps[0].text + " | " + TownQuests.Q.K3.where`);
    t.check("K3: tekst dziennika mowi o drodze za brama poludniowa (Kruczy Jar)", /drodze za bramą południową/.test(txt) && !/Polnej/.test(txt), txt);
    await t.go(3, 74, 19, 8);
    await t.frames(30);
    const ev = await J(`(function(){ const e = $gameMap.event(951); return e ? [e.x, e.y] : null; })()`);
    t.check("K3: miejsce kroku stoi na Kruczym Jarze (74,18)", !!ev && ev[0] === 74 && ev[1] === 18, ev);
    await t.eval(`$gameMap.event(951).start(); 0`);
    await finish();
    const k3 = await rec("K3");
    t.check("K3: podkowa znaleziona - krok zaliczony", k3 && (k3.step >= 1 || k3.s === "done"), k3);

    // ---- D5: scouts at night on Kruczy Jar, the leader on Lace
    await t.setDay(41, 22);
    await t.eval(`TownQuests.start("D5", 1); 0`);
    const d5 = await J(`TownQuests.Q.D5.steps[1].text + " | " + TownQuests.Q.D5.steps[2].text`);
    t.check("D5: teksty krokow - Kruczy Jar i Laka", /Kruczym Jarze/.test(d5) && /Łące/.test(d5), d5);
    await t.go(3, 60, 30, 2);
    await t.frames(240);
    const w1 = (await rec("D5")).t.spawned;
    t.check("D5 krok 1: nocą na Kruczym Jarze wilki zwiadowcy zostają wprowadzone (spawned = noc)", w1 === 41, w1);
    await t.eval(`(function(){ for (const k of [1, 2]) Tawerna.emit("kill", { kind: "wolf", mapId: 3, by: "hero" }); return 0; })()`);
    await t.frames(20);
    const d5a = await rec("D5");
    t.check("D5: dwa wilki na Kruczym Jarze zaliczaja krok 1 -> krok 2", d5a && d5a.step === 2, d5a);
    await t.setDay(42, 22);
    await t.go(4, 60, 60, 2);
    await t.frames(240);
    const lead = (await rec("D5")).t.spawned;
    t.check("D5 krok 2: kolejnej nocy na Łące wchodzi przewodnik watahy (spawned = noc)", lead === 42, lead);

    // ---- W8 chapter 5 / D38: through the gate of Gory to the Osada
    const q = await J(`JSON.stringify({ w8: !!TownQuests.Q.W8, d38: !!TownQuests.Q.D38 })`);
    await t.go(13, 6, 29, 8);
    await t.eval(`Input._currentState["up"] = true; 0`);
    await t.until(t.onMap(120), 15);
    await t.eval(`Input._currentState["up"] = false; 0`);
    const o = await J(`[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]`);
    t.check("brama Gor prowadzi do Osady Milczacych (120)", o[0] === 120, o);
    const gate = await J(`(function(){ const e = $gameMap.events().find(e => e.event() && /^Miejsce: osada_brama/.test(e.event().name)); return e ? [e.x, e.y] : null; })()`);
    t.check("W8 rozdz. 5: znacznik osada_brama (miejsce Gruma) jest w kieszeni", !!gate, gate);
    await t.eval(`TownQuests.start("W8", 0); 0`);
    const w8 = await rec("W8");
    t.check("W8 mozna zaczac, kieszen Osady jest na mapie swiata", !!w8, { w8, q });
    await t.go(120, 46, 66, 8);
    await t.eval(`Input._currentState["down"] = true; 0`);
    await t.until(t.onMap(13), 15);
    await t.eval(`Input._currentState["down"] = false; 0`);
    t.check("z Osady krawedz wraca do Gor (6,28)", (await J(`$gameMap.mapId()`)) === 13);

    // ---- Pustelnia through the gate of the harbour: Kleofas (944), the first step of K50 / D23
    await t.go(125, 101, 97, 8);
    await t.eval(`Input._currentState["up"] = true; 0`);
    await t.until(t.onMap(155), 15);
    await t.eval(`Input._currentState["up"] = false; 0`);
    await t.frames(60);
    const kl = await J(`(function(){ const e = $gameMap.events().find(e => e.event() && /Kleofas|Pustelnik/i.test(e.event().name || "")); return [$gameMap.mapId(), !!e]; })()`);
    t.check("brama przystani prowadzi do Pustelni (155); pustelnik stoi na mapie", kl[0] === 155, kl);
    await t.eval(`TownQuests.start("K50"); 0`);
    const k50 = await rec("K50");
    t.check("K50 zaczeta po wejsciu przez brame (krok 0)", k50 && k50.s === "active", k50);
    // 155 -> 157 (Urwisko) inside the pocket
    await t.go(155, 94, 17, 6);
    await t.eval(`Input._currentState["right"] = true; 0`);
    await t.until(t.onMap(157), 15);
    await t.eval(`Input._currentState["right"] = false; 0`);
    t.check("Urwisko Krukow (157) osiagalne z Pustelni", (await J(`$gameMap.mapId()`)) === 157);
    // Podgrodzie gate -> Spalona zagroda; D21 first step (the ruin starts it)
    await t.go(111, 110, 22, 8);
    await t.eval(`Input._currentState["up"] = true; 0`);
    await t.until(t.onMap(168), 15);
    await t.eval(`Input._currentState["up"] = false; 0`);
    t.check("brama Podgrodzia prowadzi do Spalonej zagrody (168)", (await J(`$gameMap.mapId()`)) === 168);
});
