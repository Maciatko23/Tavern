// Zdjęcia wariantów mostu w Podgrodziu (Map111, staging): dzień i noc, 1280x720. docs/swiat_etap1/most_<A|B|C>_<dzien|noc>.png
// GAME_OVERLAY=tools/swiat/etap1/staging GAME_OVERLAY_JS=1 CDP_PORT=9382 node tests/most_zdjecia_test.js
const kit = require("./lib/kit.js");
const path = require("path");
const OUT = path.join(__dirname, "..", "docs", "swiat_etap1");
kit.test({ port: Number(process.env.CDP_PORT) || 9382, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    for (const [tag, hour] of [["dzien", 11], ["noc", 21]]) {
        await t.newGame({ map: 111, x: 92, y: 18, day: 12, hour, quiet: true, minimap: false });
        await t.frames(40);
        for (const v of (process.env.MOST_V || "ABC").split("")) {
            await t.eval(`(function(){ const ev = $gameMap.events().find(e => /^Most kamienny: obraz/.test(e.event().name)); ev.setImage("!$Most_${v}", 0); return 0; })()`);
            await t.frames(30);
            await t.shot(path.join(OUT, `most_${v}_${tag}.png`));
        }
    }
    const ok = await t.json(`(function(){ const o = []; for (const x of [91, 95, 99]) for (const y of [15, 16, 19, 20]) o.push([x, y, $gameMap.isPassable(x, y, 6) || $gameMap.isPassable(x, y, 4) || $gameMap.isPassable(x, y, 8) || $gameMap.isPassable(x, y, 2)]); return o; })()`);
    t.check("most: deska (y 16-19) przechodnia, attyka (y 15, 20) nie", ok.filter(c => c[1] === 16 || c[1] === 19).every(c => c[2]) && ok.filter(c => c[1] === 15 || c[1] === 20).every(c => !c[2]), ok);
});
