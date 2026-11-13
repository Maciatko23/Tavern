// zdjęcia scen W23 do docs/zadania_nowe/potwory_gra/ (o zmierzchu, żeby było widać): uruchom z nakładką jak morze_test.js
const kit = require("./lib/kit.js");
const S = "../docs/zadania_nowe/potwory_gra/";
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", port: Number(process.env.CDP_PORT) || 9954 }, async t => {
    const J = e => t.json(e);
    const spawn = (k, dx, dy, n) => t.eval(`(function(){ const x = $gamePlayer.x + ${dx}, y = $gamePlayer.y + ${dy}; Creatures.spawn(${JSON.stringify(k)}, x, y, { tag: "morze", engaged: true, level: 1, single: ${n ? "false" : "true"}, count: ${n || 1} }); MorzePotwory.seaList().forEach(c => { c._hunt = true; c._hp = 9999; c._maxHp = 9999; }); return 0; })()`);
    // 1. the landing on the harbour: the drowned coming over the beach, tracks behind him
    await t.newGame({ map: 125, x: 60, y: 70, hour: 19.6, day: 12 });
    await t.eval(`Morze.force("topielec_morski"); 0`);
    await t.until("MorzePotwory.seaList().length > 0", 60, 300);
    await t.eval(`(function(){ const c = MorzePotwory.seaList()[0]; c._x = $gamePlayer.x - 3; c._y = $gamePlayer.y - 4; c._realX = c._x; c._realY = c._y; c._hp = 9999; c.setMode("chase"); return 0; })()`);
    await t.frames(50);
    await t.shot(S + "10_lad_topielec_slady.png");
    // 2. the crab, the fish-folk, the fog-wraith and the witch
    await t.eval("Creatures.clear('morze'); 0");
    await spawn("krab_olbrzym", -3, -3); await spawn("rybolak", 3, -4, 3);
    await t.frames(40); await t.eval("Creatures.creatures().forEach(c => { c._frozen = true; }); 0"); await t.shot(S + "11_krab_rybolaki.png");
    await t.eval("Creatures.clear('morze'); 0");
    await spawn("wiedzma", 0, -5); await spawn("mglak", -4, -3); await spawn("topielec_morski", 4, -3);
    await t.frames(40); await t.eval("Creatures.creatures().forEach(c => { c._frozen = true; c._hidden = false; c._opacity = 255; }); 0"); await t.shot(S + "12_wiedzma_mglak_topielec.png");
    // 3. the song: rings, the witch's bubble
    await t.eval("Creatures.clear('morze'); Combat.mindResist = () => 0; 0");
    await spawn("wiedzma", 0, 6);
    await t.frames(150); await t.shot(S + "13_piesn.png");
    // 4. the tentacles at the quay
    await t.eval("Creatures.clear('morze'); Morze.state().ostatniaMacka = 0; Morze.force('macki'); 0");
    await t.frames(60); await t.shot(S + "14_macki_kregi.png");
    await t.frames(200); await t.eval(`(function(){ const t0 = MorzePotwory.tentacles.list()[0]; for (let r = 1; r < 5; r++) for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const x = t0.x + dx * r, y = t0.y + dy * r; if ($gameMap.checkPassage(x, y, 0x0f)) { $gamePlayer.locate(x, y); MorzePotwory.tentacles.list().forEach(t => { t.phase = "idle"; t.t = 999; t.cd = 0; }); return 0; } } return 0; })()`);
    await t.frames(40); await t.shot(S + "15_macka_uderza.png");
    // 5. the town: the watch comes out of the guardhouse
    await t.eval("MorzePotwory.tentacles.clear(); 0");
    await t.go(8, 98, 44, 2);
    await t.setDay(14, 19.8);
    await t.eval(`(function(){ Creatures.clear("morze"); Creatures.spawn("topielec_morski", 98, 41, { tag: "morze", engaged: true, level: 1, single: true }); MorzePotwory.seaList().forEach(c => { c._hunt = true; c._hp = 60; }); MorzePotwory.watch.begin(); return 0; })()`);
    await t.frames(130); await t.shot(S + "16_miasto_straz_idzie.png");
    await t.frames(70); await t.shot(S + "17_miasto_straz_walczy.png");
    // 6. the morning: tracks on a beach
    await t.eval("Creatures.clear('morze'); MorzePotwory.watch.clear(); 0");
    await t.go(125, 60, 70, 2);
    await t.setDay(13, 7.5);
    await t.eval(`(function(){ const pts = Morze.shorePoints(); const pt = pts.slice().sort((a, b) => Math.hypot(a.x - $gamePlayer.x, a.y - $gamePlayer.y) - Math.hypot(b.x - $gamePlayer.x, b.y - $gamePlayer.y))[0]; $gamePlayer.locate(pt.x, Math.min(pt.y + 5, $gameMap.height() - 3)); Morze.state().noce["12:125"] = { l: 1, k: "topielec_morski", c: 1, o: 0.4, sp: 1, left: 0, tr: null, pt, ghost: 1 }; Tawerna.emit("mapReady"); return 0; })()`);
    await t.frames(90); await t.shot(S + "18_slady_rano.png");
});
