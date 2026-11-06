// Makieta „łąki” (2026-11-03): zrzuty z gry z mapy próbnej A w trzech miejscach (1920x1080, bohater ukryty), z kamerą i zdarzeniami - do nich
// tools/laka/makieta.py dokłada nakładkę i robi obrazki przed / po.  node tools/laka/zrzuty.js
"use strict";
const kit = require("../../tests/lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "zrzuty");
const SPOTS = [["brzeg", 44, 9], ["sosny", 22, 42], ["wzgorze", 50, 30]];
kit.test({ port: Number(process.env.CDP_PORT) || 9419, width: 1280, height: 720, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    await t.newGame({ map: 990, x: 40, y: 16, day: 12, hour: 11, quiet: true, minimap: false });
    for (const [name, x, y] of SPOTS) {
        await t.go(990, x, y, 2);
        await t.eval(`$gamePlayer.setTransparent(true); $gamePlayer.center(${x}, ${y}); 0`);
        await t.frames(420);
        const info = await t.json(`({ dx: $gameMap.displayX(), dy: $gameMap.displayY(), w: Graphics.width, h: Graphics.height,
            ev: $gameMap.events().filter(e => e.characterName() && !e._erased).map(e => [e.x, e.y, e.characterName(), e.characterIndex(), e.isNormalPriority()]),
            stopy: SceneManager._scene._spriteset._characterSprites.filter(s => s._character && s._character !== $gamePlayer && s._character.characterName && s._character.characterName() && s._frame)
                .map(s => [Math.round(s.x), Math.round(s.y), Math.round(s._frame.width * Math.abs(s.scale.x)), s._character.characterName()]) })`);
        fs.writeFileSync(path.join(OUT, name + ".json"), JSON.stringify(info));
        await t.shot(path.join(OUT, name + ".png"));
        // (the same frame without the characters - trees, rocks, people: the ground alone, for the occlusion of the mock-up)
        await t.eval("$gameMap.events().forEach(e => { e._opacityKeep = e.opacity(); e.setOpacity(0); }); 0");
        await t.frames(8);
        await t.shot(path.join(OUT, name + "_grunt.png"));
        await t.eval("$gameMap.events().forEach(e => e.setOpacity(e._opacityKeep === undefined ? 255 : e._opacityKeep)); 0");
        t.check("zrzut " + name, true);
    }
});
