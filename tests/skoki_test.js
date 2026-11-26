// Hops over low things (the user, 2026-11-26: "królik i pies mogą przeskakiwać przez płotek, małe kamienie, krzaczki i tym podobne
// rzeczy blokujące"; "jeleń też może"): by a fence of Kruczogród (Map220, a garden's wooden fence - an A2 overlay that blocks every
// way), the rabbit, the deer and the dog find their way OVER it (the path's first step is a two-tile hop) and really jump; a wolf
// (it does not hop) goes round; a small rock and a big one; nothing landing on a building. CDP_PORT=9465.
"use strict";
const kit = require("./lib/kit.js");

kit.test({ port: 9465, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    t.check("a new game", await t.newGame({ hour: 12, quiet: true }));
    await t.eval(`(function(){ $gamePlayer.reserveTransfer(220, 40, 30, 2, 2); return 0; })()`);
    await t.until(t.onMap(220), 30);
    await t.frames(30);
    await t.eval("if (window.Hunting) { Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); } if (window.Dog) Dog.auto(false); 0");
    // a fence tile with free ground just above and below it (a vertical crossing), the way round it long
    const spot = await t.json(`(function(){ const P = Tawerna.api("Hunting_parts").path, W = $gameMap.width(), H = $gameMap.height();
        const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !P.fenceTileAt(x, y) && $gameMap.eventsXy(x, y).length === 0;
        for (let y = 10; y < H - 10; y++) for (let x = 5; x < W - 5; x++) {
            if (!P.fenceTileAt(x, y) || !P.fenceTileAt(x - 1, y) || !P.fenceTileAt(x + 1, y) || !free(x, y - 1) || !free(x, y + 1) || !free(x, y - 2) || !free(x, y + 2)) continue;
            return { x, y };
        }
        return null; })()`);
    t.check("found a fence with free ground on both sides", !!spot, spot);
    if (!spot) return;
    // the way from above the fence to below it, for each kind: its first step a hop (two tiles), the path short
    const way = kind => t.json(`(function(){ const S = ${JSON.stringify(spot)}, P = Tawerna.api("Hunting_parts").path;
        let a;
        if (${JSON.stringify(kind)} === "dog") { Dog.removeDog && Dog.removeDog(); Dog.spawnDog(S.x, S.y - 1); a = Dog.dog; a._frozen = true; }
        else { a = Hunting.spawn(${JSON.stringify(kind)}, S.x, S.y - 1); a._wait = 99999; }
        a.locate(S.x, S.y - 1); a._p8 = null;
        P.resetGrid();
        const r = Hunting.path8(a, S.x, S.y + 1, { animal: ${JSON.stringify(kind)} !== "dog", key: "test" });
        const first = a._p8 && a._p8.path.length ? a._p8.path[0] : -1, w = $gameMap.width();
        const fx = first % w, fy = Math.floor(first / w);
        // the hop itself: the straight step down from above the fence
        const before = { x: a._x, y: a._y };
        a.moveStraight(2);
        const out = { kind: ${JSON.stringify(kind)}, canHop: !!(a.canHop && a.canHop()), dir: r.dir, steps: r.steps, firstTo: [fx, fy], hopFirst: fx === S.x && fy === S.y + 1, jumping: a.isJumping(), landed: [a._x, a._y], from: before };
        if (${JSON.stringify(kind)} === "dog") Dog.removeDog && Dog.removeDog(); else Hunting.removeAnimal(a);
        return out; })()`);
    const rabbit = await way("rabbit"), deer = await way("deer"), dog = await way("dog"), wolf = await way("wolf");
    t.check("the rabbit: its way goes over the fence (the first step a two-tile hop) and the step down is a jump to the other side", rabbit.canHop && rabbit.hopFirst && rabbit.jumping && rabbit.landed[1] === spot.y + 1, rabbit);
    t.check("the deer too (jeleń też może)",deer.canHop && deer.hopFirst && deer.jumping && deer.landed[1] === spot.y + 1, deer);
    t.check("the dog too", dog.canHop && dog.hopFirst && dog.jumping && dog.landed[1] === spot.y + 1, dog);
    t.check("a wolf does not hop: its way is not over the fence, its step down does not go through", !wolf.canHop && !wolf.hopFirst && !wolf.jumping && wolf.landed[1] === spot.y - 1, wolf);
    // the low things: a small rock low, a big one not; a log low
    const low = await t.json(`(function(){ const CT = ChoppableTree; const mk = (name, x, y) => { const ev = $gameMap.events().find(e => e && e.characterName && e.characterName() === name); return ev ? CT.isLow(ev) : null; };
        return { flat: mk("!$Rock_Flat"), round: mk("!$Rock_Round"), huge: mk("!$Rock_Huge"), spire: mk("!$Rock_Spire"), tall: mk("!$Rock_Tall") }; })()`);
    t.check("small rocks (flat, round) are low, the big ones (huge, spire, tall) are not - where the map has them", [low.flat, low.round].every(v => v === null || v === true) && [low.huge, low.spire, low.tall].every(v => v === null || v === false), low);
});
