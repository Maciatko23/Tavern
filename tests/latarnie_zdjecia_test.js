// Zdjęcia latarni (Podgrodzie przy bramie i Przystań), dzień i wieczór: LAT_TAG=przed (bez overlaya) albo po (GAME_OVERLAY=tools/swiat/etap1/staging)
const kit = require("./lib/kit.js");
const path = require("path");
const OUT = path.join(__dirname, "..", "docs", "swiat_etap1");
const TAG = process.env.LAT_TAG || "po";
kit.test({ port: Number(process.env.CDP_PORT) || 9382, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    for (const [name, map, x, y, hour] of [["podgrodzie_dzien", 111, 85, 18, 11], ["podgrodzie_wieczor", 111, 85, 18, 21], ["przystan_wieczor", 125, 23, 10, 21], ["przystan_dzien", 125, 23, 10, 11]]) {
        await t.newGame({ map, x, y, day: 12, hour, quiet: true, minimap: false });
        await t.frames(40);
        await t.shot(path.join(OUT, `latarnie_${name}_${TAG}.png`));
    }
    const lamp = await t.json(`(function(){ const e = $gameMap.events().find(e => /^Latarnia/.test(e.event().name)); return e ? [e.eventId(), e.x, e.y, e.characterName()] : null; })()`);
    console.log("LAMP", JSON.stringify(lamp));
});
