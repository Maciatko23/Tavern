// audyt rogów (resztki starego obrzeża, łączenia łuków): node tools/wzgorza/audyt.js 990 991 13  (z nakładką: GAME_OVERLAY=tools/wzgorza/staging GAME_OVERLAY_JS=1)
const kit = require("../../tests/lib/kit.js");
const maps = process.argv.slice(2).map(Number);
kit.test({ port: Number(process.env.CDP_PORT) || 9413, bootCheck: "gra", errorCheck: "bez błędów" }, async t => {
    await t.eval("window.WZGORZA_AUDIT = true; 0");
    for (const map of maps) {
        await t.newGame({ map, x: 24, y: 40, day: 12, hour: 11, quiet: true, minimap: false });
        for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
        const r = await t.json("Wzgorza.audit()");
        console.log("MAP", map, "rogi", r.corners, "resztki", JSON.stringify(r.strays), "połączeń", r.joinCount, "złe", JSON.stringify(r.joins), "prostokąty", JSON.stringify(r.blocks), "kreski_lica", JSON.stringify(r.faceLines));
    }
});
