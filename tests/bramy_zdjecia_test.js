// Zdjęcia nowych bram miasta (Map008 staging): N (x 24-26) i E (y 17-19), dzień i wieczór. GAME_OVERLAY=tools/swiat/etap1/staging GAME_OVERLAY_JS=1
const kit = require("./lib/kit.js");
const path = require("path");
const OUT = path.join(__dirname, "..", "docs", "swiat_etap1");
kit.test({ port: Number(process.env.CDP_PORT) || 9382, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    for (const [tag, hour] of [["dzien", 11], ["noc", 21]]) {
        for (const [name, x, y] of [["N", 25, 6], ["E", 100, 18]]) {
            await t.newGame({ map: 8, x, y, day: 12, hour, quiet: true, minimap: false });
            await t.frames(40);
            await t.shot(path.join(OUT, `brama_${name}_${tag}.png`));
        }
    }
});
