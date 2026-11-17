// Nocne obozy bandytów w nowym świecie (2026-11-17, gracz: obozy na nowych mapach poza dworem): Słony Brzeg 219 (25%), Krucze Turnie 222
// (30%), góry 029 (25%) - Humans_Data CAMP.maps; nie ma ich w mieście 220, na działce 218, przy dworze 221 ani na Orlej Grani 030.
// Na każdej z trzech map obóz wymuszony (Humans.camp, jak F9): stoi na otwartym, przechodnim miejscu, ognisko i ludzie są, zrzut.
// Zrzuty: docs/NOWY_SWIAT/obozy_<mapa>.png
// Uruchom: node tests/run.js obozy_nowy_swiat --port 9497
const kit = require("./lib/kit.js");
const path = require("path");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const cm = await J(`Object.assign({}, HumansData.CAMP.maps)`);
    t.check("obozy na mapach nowego świata: 219, 222, 29 (bez 218, 220, 221, 030)", !!cm && cm[219] > 0 && cm[222] > 0 && cm[29] > 0 && !cm[218] && !cm[220] && !cm[221] && !cm[30], cm);
    const spots = { 219: [40, 46], 222: [40, 41], 29: [40, 40] };
    for (const [m, [x, y]] of Object.entries(spots)) {
        await t.newGame({ map: Number(m), x, y, dir: 2, hour: 22, quiet: true, minimap: false });
        await t.eval("if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); $gameSystem.setStamina(100); 0");
        // (the hero somewhere passable near the middle - the camp then 9-16 tiles off)
        await t.eval(`(function(){ const p = $gamePlayer; if ($gameMap.isPassable(p.x, p.y, 2)) return 0; for (let r = 1; r < 20; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = p.x + dx, Y = p.y + dy; if ($gameMap.isValid(X, Y) && $gameMap.isPassable(X, Y, 2) && $gameMap.eventsXy(X, Y).length === 0) { p.locate(X, Y); return 0; } } return 0; })()`);
        await t.frames(30);
        const c = await J(`(function(){ const c = Humans.camp({}); if (!c) return null; return { x: c.x, y: c.y, n: (c.members || []).length }; })()`);
        await t.frames(60);
        const look = await J(`(function(){ const c = Humans.campHere(); if (!c) return null; const g = $gameMap; return { x: c.x, y: c.y, pass: [2,4,6,8].some(d => g.isPassable(c.x, c.y, d)), men: Humans.list.filter(h => h._campRef).length, hero: [$gamePlayer.x, $gamePlayer.y] }; })()`);
        t.check("Map" + m + ": obóz stoi (ognisko na przechodnim polu, ludzie przy nim)", !!c && !!look && look.pass && c.n >= 2, { c, look });
        if (look) await t.eval(`(function(){ const c = Humans.campHere(); $gamePlayer.locate(c.x, Math.min($gameMap.height() - 3, c.y + 4)); return 0; })()`);
        await t.frames(40);
        await t.shot(path.join(__dirname, "..", "docs", "NOWY_SWIAT", "obozy_" + m + ".png"));
    }
});
