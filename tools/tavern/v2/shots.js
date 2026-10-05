// node tools/tavern/v2/shots.js [hour=12] [name ...]   (CDP_PORT 9431; the game at 127.0.0.1:8765)
// Game screens (1280x720, HUD hidden) of the staged ground floor (map coordinates: the 101x55 map since 2026-10-05) (tools/tavern/v2/overlay, served over the game's files):
// the hero put in each room, the screen saved as docs/tawerna_nowa/v2_ekran_<name>[_noc].png.
const path = require("path");
const fs = require("fs");
process.env.CDP_PORT = process.env.CDP_PORT || "9431";
const kit = require(path.join(__dirname, "..", "..", "..", "tests", "lib", "kit.js"));
const hour = Number(process.argv[2] || 12);
const only = process.argv.slice(3);
const OUT = path.join(__dirname, "..", "..", "..", "docs", "tawerna_nowa");
const SPOTS = {
    sala: [50, 34, 8], bar: [50, 31, 8], sien: [50, 49, 8], biesiadna: [26, 32, 8], mysliwski: [9, 32, 8], scena: [74, 33, 8],
    gry: [91, 33, 8], laznia: [13, 48, 2], jadalnia: [30, 51, 8], palarnia: [70, 50, 8], rzutki: [87, 48, 8],
    korytarz: [50, 21, 4], kuchnia: [45, 14, 8], piekarnia: [59, 14, 8], spizarnia: [32, 13, 8], wedzarnia: [68, 14, 8],
    browar: [22, 13, 8], sluzba: [78, 12, 8], gabinet: [91, 9, 8], komorka: [9, 6, 8], sklad: [9, 17, 8], magazyn: [91, 17, 8]
};
kit.test({ port: Number(process.env.CDP_PORT), overlay: "tools/tavern/v2/overlay", bootCheck: "the game boots" }, async t => {
    const ok = await t.newGame({ map: 1, x: 50, y: 53, dir: 8, hour, quiet: true, minimap: false });
    t.check("the staged Map001 comes up", ok);
    fs.mkdirSync(OUT, { recursive: true });
    for (const [name, s] of Object.entries(SPOTS)) {
        if (only.length && !only.includes(name)) continue;
        await t.eval(`(function(){ $gamePlayer.locate(${s[0]}, ${s[1]}); $gamePlayer.setDirection(${s[2]}); $gameSystem.setDayNightHour(${hour});
            const sc = SceneManager._scene; for (const c of sc.children) if (c !== sc._spriteset) c.visible = false; return 0; })()`);
        await t.frames(45);
        const f = path.join(OUT, `v2_ekran_${name}${hour >= 19 || hour < 6 ? "_noc" : ""}.png`);
        await t.shot(f);
        console.log("saved", f);
    }
});
