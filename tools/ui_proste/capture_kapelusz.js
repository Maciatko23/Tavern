// Ubrany bohater w słomkowym kapeluszu (Ubior.js) do makiety „Lista v2 – ekwipunek, wybór na głowę” (docs/ui_proste/lista_v2_*).
//   CDP_PORT=9578 node tools/ui_proste/capture_kapelusz.js  ->  tools/ui_proste/zrzuty/hero_walk_kapelusz.png (+ bez kapelusza dla porównania)
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const RAW = path.join(__dirname, "zrzuty");

kit.test({ port: 9578, errorCheck: false }, async t => {
    fs.mkdirSync(RAW, { recursive: true });
    t.check("nowa gra", await t.newGame({ story: true, skipIntro: true, hour: 10, quiet: true, minimap: false }));
    await t.eval(`(function(){ for (const [id, n] of [[60, 1], [260, 1], [270, 1], [275, 1], [277, 1], [250, 1], [255, 1]]) $gameParty.gainItem($dataItems[id], n); return 0; })()`);
    await t.frames(30);
    const dump = async name => {
        await t.frames(20);
        await t.until(`ImageManager.loadCharacter("Hero_Walk").isReady()`, 20);
        const url = await t.eval(`ImageManager.loadCharacter("Hero_Walk").canvas.toDataURL("image/png")`);
        fs.writeFileSync(path.join(RAW, name + ".png"), Buffer.from(String(url).split(",")[1], "base64"));
    };
    console.log("slots", JSON.stringify(await t.json(`Equipment.slots().map(s => s.id + ":" + s.item)`)));
    await t.eval(`(function(){ Equipment.equip("head", 250); return 0; })()`);
    await dump("hero_walk_kapelusz");
    console.log("slots", JSON.stringify(await t.json(`Equipment.slots().map(s => s.id + ":" + s.item)`)));
    await t.eval(`(function(){ Equipment.unequip("head"); return 0; })()`);
    await dump("hero_walk_bez_kapelusza");
    t.check("zapisane", true);
});
