// przejście bohatera wzdłuż krawędzi: node tools/wzgorza/idz.js mapa kierunek(right|left) fyStart fxStart delty...  (fy: lewy górny róg sprite'a; ruch co klatkę przez wciśnięty klawisz)
const kit = require("../../tests/lib/kit.js");
const [map, dir, fx0, ...deltas] = process.argv.slice(2);
kit.test({ port: Number(process.env.CDP_PORT) || 9413, bootCheck: "gra", errorCheck: "bez błędów" }, async t => {
    await t.newGame({ map: Number(map), x: 40, y: 22, day: 12, hour: 11, quiet: true, minimap: false });
    for (let i = 0; i < 80 && (await t.json("Wzgorza.stats().todo")) > 0; i++) await t.frames(10);
    for (const d of deltas) {
        const [fy, steps] = d.split(":").map(Number);
        await t.eval(`$gamePlayer.setTransparent(false); $gamePlayer._realX = ${fx0} / 48; $gamePlayer._realY = ${fy} / 48; $gamePlayer._x = Math.round(${fx0} / 48); $gamePlayer._y = Math.round(${fy} / 48); 0`);
        await t.frames(6);
        const out = [];
        for (let k = 0; k < (steps || 12); k++) { await t.hold(dir, 20); out.push(await t.json("[Math.round($gamePlayer._realX * 48), Math.round($gamePlayer._realY * 48), Wzgorza.standing(Math.round($gamePlayer._realX * 48), Math.round($gamePlayer._realY * 48))].join(',')")); }
        console.log("fy", fy, out.join(" | "));
    }
});
