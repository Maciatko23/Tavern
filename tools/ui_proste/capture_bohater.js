// Ubrany bohater (Ubior.js) do makiet docs/ui_proste/: arkusz Hero_Walk i popiersie Hero_Bust tak, jak je daje gra po założeniu
// koszuli, spodni, łapci i pasa (to samo co capture_obecne.js).
//   CDP_PORT=9578 node tools/ui_proste/capture_bohater.js   ->  tools/ui_proste/zrzuty/hero_walk_ubrany.png, hero_bust_ubrany.png
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const RAW = path.join(__dirname, "zrzuty");

kit.test({ port: 9578, errorCheck: false }, async t => {
    fs.mkdirSync(RAW, { recursive: true });
    t.check("nowa gra", await t.newGame({ story: true, skipIntro: true, hour: 10, quiet: true, minimap: false }));
    await t.eval(`(function(){ for (const [id, n] of [[60, 1], [260, 1], [270, 1], [275, 1], [277, 1]]) $gameParty.gainItem($dataItems[id], n); return 0; })()`);
    await t.frames(60);
    const pics = { hero_walk_ubrany: `ImageManager.loadCharacter("Hero_Walk")`, hero_bust_ubrany: `ImageManager.loadPicture("Hero_Bust")` };
    for (const name in pics) {
        await t.until(`${pics[name]}.isReady()`, 20);
        await t.frames(10);
        const url = await t.eval(`(function(){ const b = ${pics[name]}; return b.canvas.toDataURL("image/png"); })()`);
        fs.writeFileSync(path.join(RAW, name + ".png"), Buffer.from(String(url).split(",")[1], "base64"));
        console.log(name, String(url).length);
    }
    t.check("zapisane", true);
});
