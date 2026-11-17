// Stach w nowym wyglądzie (2026-11-17: legendarny wojownik w przebraniu - filcowy kapelusz z piórkiem, długie białe włosy, cienka
// broda) w NOWEJ chacie dziadka (Map224): rozmowa na start nowej gry z jego nowym popiersiem, on sam na mapie w kapeluszu (arkusz
// $Npc_Dziadek), chodzący w 8 kierunkach (Npc_Dziadek_Walk8). Zrzuty: docs/postacie/stach_nowy_*.png
// Uruchom: node tests/run.js stach_nowy --port 9490
const kit = require("./lib/kit.js");
const path = require("path");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const shot = f => t.shot(path.join(__dirname, "..", "docs", "postacie", f));
    await t.newGame({ story: true, minimap: false });
    const intro = await t.until("$gameMessage.isBusy() && SceneManager._scene._messageWindow.isOpen()", 30);
    await t.frames(50);
    const s0 = await J(`(function(){ const tb = SpeechBubbles.talk(), g = $gameMap.event(901);
        return { map: $gameMap.mapId(), on: tb.on, npc: tb.npc, sheet: g && g.characterName(), bust: g && SpeechBubbles.bustOf(g) }; })()`);
    t.check("nowa gra: rozmowa z dziadkiem w nowej chacie (Map224), jego popiersie Stach_Bust, on na mapie z arkusza $Npc_Dziadek",
        intro && s0.map === 224 && s0.bust === "Stach_Bust" && s0.sheet === "$Npc_Dziadek", s0);
    await shot("stach_nowy_rozmowa.png");
    await t.eval("Story.skipIntro(); 0");
    await t.finish(30);
    await t.frames(60);
    // the camera on grandpa, a close look at him on the map (x2 crop in the screenshot below)
    const g = await J(`(function(){ const g = $gameMap.event(901); if (!g) return null; $gamePlayer.locate(g.x + 2, g.y + 1); $gamePlayer.setDirection(4); return { x: g.x, y: g.y, sx: Math.round(g.screenX()), sy: Math.round(g.screenY()), name: g.characterName() }; })()`);
    await t.frames(30);
    const g2 = await J(`(function(){ const g = $gameMap.event(901); return g ? { sx: Math.round(g.screenX()), sy: Math.round(g.screenY()), name: g.characterName(), dir: g.direction() } : null; })()`);
    t.check("po rozmowie dziadek stoi w chacie (Map224) w nowym arkuszu", !!g2 && g2.name === "$Npc_Dziadek", { g, g2 });
    await shot("stach_nowy_mapa.png");
    // the eight-way walk sheet (Npc_Dziadek_Walk8) loads and has all 72 cells drawn
    const w8 = await J(`new Promise(res => { const b = ImageManager.loadCharacter("Npc_Dziadek_Walk8"); const chk = () => { if (!b.isReady()) return setTimeout(chk, 50);
        let n = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < 9; c++) { const d = b.context.getImageData(c * 64, r * 64, 64, 64).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) k++; if (k > 300) n++; }
        res({ w: b.width, h: b.height, cells: n }); }; chk(); })`);
    t.check("arkusz chodu w 8 kierunkach: 576x512, wszystkie 72 klatki narysowane", w8.w === 576 && w8.h === 512 && w8.cells === 72, w8);
    t.note && t.note("dziadek na ekranie: " + JSON.stringify(g2));
});
