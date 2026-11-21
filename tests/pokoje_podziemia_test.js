// Zasięg widzenia w podziemiach (js/plugins/Pokoje.js, 2026-11-19, gracz: "tu jest ściana, ale widać za nią"): skała pięter to szczyty
// ścian (A4) zamknięte tylko od strony podłogi, w środku otwarte - cienka ściana boczna przepuszczała wzrok. Piętro 1 z ziarnem z jego
// zapisu: sala (59-69, 5-11), za nią ściana jednej kratki (x 70) i wąski korytarz (x 71).
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9447, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ map: 1, x: 14, y: 35, day: 12, hour: 12, quiet: true, minimap: false });
    await t.eval("Underground.setSeed(2859706888); 0");
    await t.go(131, 69, 8, 6);
    await t.eval("window.Creatures && Creatures.auto && Creatures.auto(false); 0");
    t.check("na piętrze 1 działa zasięg widzenia", await t.json("Pokoje.active()"));
    const c = (x, y) => t.json(`Pokoje.cover(${x}, ${y})`);
    const widzi = (x, y) => t.json(`Pokoje.sees(${x}, ${y})`);
    const go = async (x, y) => { await t.eval(`$gamePlayer.locate(${x}, ${y}); 0`); await t.frames(10); await t.until("Pokoje.settled()", 15); await t.frames(4); };
    await go(69, 8);
    t.check("salę widać", (await c(64, 8)) === 0 && (await c(60, 10)) === 0, [await c(64, 8), await c(60, 10)]);
    // skała to sufit nad ścianami: nie widać jej (2026-11-19, "od sufitu gracz nie widzi"), podłogę sali do samej ściany tak
    t.check("skały cienkiej ściany obok nie widać, podłogi przy niej tak", (await c(70, 8)) > 0.95 && (await c(69, 8)) === 0, [await c(70, 8), await c(69, 8)]);
    const za = [[71, 6], [71, 8], [71, 10], [73, 10], [75, 10]];
    const wz = [];
    for (const [x, y] of za) wz.push(await widzi(x, y));
    t.check("korytarza za cienką ścianą nie widać", wz.every(s => !s), wz);
    const cz = [];
    for (const [x, y] of za) cz.push(await c(x, y));
    t.check("i jest czarny", cz.every(a => a > 0.95), cz);
    await t.shot("out/pokoje_podziemia_sala.png");
    // ściana sali od północy: lico widać do jego górnej krawędzi, skały nad nim nie
    await go(64, 8);
    t.check("lico ściany sali (rzędy 4-5) widać, skały nad nim nie", (await c(64, 5)) < 0.1 && (await c(64, 4)) < 0.1 && (await c(64, 3)) > 0.95, [await c(64, 5), await c(64, 4), await c(64, 3)]);
    // z korytarza: sali za ścianą też nie
    await go(71, 8);
    t.check("z korytarza sali za ścianą nie widać", !(await widzi(66, 8)) && !(await widzi(62, 10)), [await widzi(66, 8), await widzi(62, 10)]);
    t.check("a korytarz widać", (await c(71, 6)) === 0 && (await c(71, 10)) === 0, [await c(71, 6), await c(71, 10)]);
    // ściana spotkana z boku nie odsłania tego, co za nią w tym rzędzie: lica ściany sali (69,5) ani drugiej kratki grubej ściany (73,8)
    t.check("ściana z boku nie odsłania kratki za sobą", (await c(69, 5)) > 0.95 && (await c(73, 8)) > 0.95, [await c(69, 5), await c(73, 8)]);
    await t.shot("out/pokoje_podziemia_korytarz.png");
});
