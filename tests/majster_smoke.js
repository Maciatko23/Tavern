// quick smoke of W22 on the overlay: node tests/majster_smoke.js   (CDP_PORT 9930)
const kit = require("./lib/kit.js");
kit.test({ port: 9930, overlay: "tools/majstersztyk/overlay", overlayJs: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const base = await t.json(`({ m: !!window.Majster, d: !!window.MajsterData, q: !!TownQuests.Q.W22, thr: Watki.watki().includes("majster"),
        inj: Tawerna.inject.list().filter(x => x.owner === 'Majster').map(x => x.ids), tx: Watki.stan("majster") })`);
    t.check("Majster i dane działają", base.m && base.d && base.q && base.thr, base);
    await t.newGame({ story: true, skipIntro: true, map: 215, x: 7, y: 15, dir: 8, day: 14, hour: 10, quiet: true });
    await t.frames(60);
    const m = await t.json(`({ id: $gameMap.mapId(), w: $dataMap.width, ev: $gameMap.events().length })`);
    t.check("mapa Cech 215 wczytana", m.id === 215 && m.w === 30, m);
    await t.shot("../docs/zadania_nowe/majstersztyk_gra/cech_dzien.png");
});
