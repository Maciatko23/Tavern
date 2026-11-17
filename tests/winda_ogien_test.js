// Ogień przy windzie (2026-11-17, gracz: „pochodnia obok klatki windy, zwłaszcza na ciemnych piętrach 75-95”): przy każdej klatce windy
// stale płonie ogień - pochodnia na ścianie obok klatki albo (klatka wolno w sali) kosz z ogniem na podłodze obok; w Warstwie Prawdy
// (76-99) niebieski płomień / niebieski świecznik. Ręczne piętra 10-90: ogień najwyżej 3 pola od klatki; generowane przystanki 5, 15 ... 95:
// generator stawia go sam (Underground_Gen liftPlace -> liftLight). Zrzut każdego przystanku: docs/podziemia/winda_ogien_<piętro>.png
// Uruchom: node tests/run.js winda_ogien --port 9499
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "podziemia");
const FIRE = /^(Pochodnia|Kosz z ogniem|Świecznik|Niebieski płomień)$/;

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const bad = [], seen = {};
    for (const f of [5, 10, 15, 20, 30, 40, 50, 60, 70, 75, 80, 85, 90, 95]) {
        const map = await t.json(`Underground.mapOf(${f})`);
        await t.newGame({ map, x: 1, y: 1, dir: 2, day: 3, hour: 12, quiet: true, minimap: false });
        await t.eval(`(function(){ if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); return 0; })()`);
        const cage = await t.json(`(function(){ const c = $gameMap.events().find(e => e.event().name === "Winda kasztelana" || (e.list() || []).some(l => l.code === 355 && /Underground\\.cage/.test(l.parameters[0])));
            return c ? [c.x, c.y] : null; })()`);
        if (!cage) { bad.push(f + ": brak klatki"); continue; }
        await t.eval(`(function(){ $gamePlayer.locate(${cage[0]}, ${cage[1] + 1}); $gamePlayer.setDirection(8); if (window.Creatures && Creatures.clear) Creatures.clear(); return 0; })()`);
        await t.frames(50);
        const fire = await t.json(`(function(){ const re = ${FIRE}; return $gameMap.events().filter(e => re.test(e.event().name) && e.characterName() && Math.abs(e.x - ${cage[0]}) <= 3 && Math.abs(e.y - ${cage[1]}) <= 5)
            .map(e => [e.event().name, e.x, e.y, /<Light/.test(e.event().note)]); })()`);
        seen[f] = { cage, fire };
        if (!fire.some(x => x[3])) bad.push(f + ": brak ognia przy klatce");
        await t.shot(path.join(SHOTS, "winda_ogien_" + f + ".png"));
    }
    t.check("przy każdej klatce windy (ręczne 10-90 i generowane 5 ... 95) płonie ogień ze światłem najwyżej 3 pola w bok", bad.length === 0, { bad, seen });
});
