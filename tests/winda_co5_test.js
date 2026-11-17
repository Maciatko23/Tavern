// The lift every 5th floor (2026-11-17, the player: "winda jako szybkie przejście musi działać co 5 poziomów: 5, 10, 15, 20 itd."):
// Underground_Data.LIFT.stops 5, 10 ... 95; the hand-made floors 10-90 keep their drawn cage, the generated floors 5, 15 ... 95 get a
// cage and a windlass from the generator (Underground_Gen.js liftPlace: in the stairs-up hall a few steps from the stairs, by its north
// wall when there is room). Here, on one save's seed:
//   - floor 5 (Map135) and floor 25 (map 1025): the cage and the windlass stand where the floor's facts say, on free floor, the place
//     in front of the cage free; the windlass turned ("Zakręcić"): the stop works for good, its lever shows down, the discovery noted;
//     floor 15's windlass too
//   - the cage's menu lists Ruiny Zamku and the stops in order ("Piętro 5", "Piętro 10 - ...", "Piętro 15", "Piętro 25")
//   - a ride from Ruiny Zamku's shaft down to floor 15 and one from floor 25 up to floor 5: the hero lands in front of the cage, on a
//     tile he can walk off, facing down
//   - the other generated stops of bands 3-5 (35 ... 95): their cage and windlass in place (a shot of each)
// Shots: docs/podziemia/winda_co5_*.png.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "podziemia");
const SEED = 12345;   // (floor 5: the cage by the north wall beside the stairs; 15 and 25: standing free in the stairs-up hall)

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const stops = await t.json("Underground_Data.LIFT.stops");
    t.check("the lift stops every 5th floor: 5, 10, 15 ... 95", stops && stops.join() === Array.from({ length: 19 }, (_, k) => 5 + k * 5).join(), stops);

    await t.newGame({ map: 10, x: 14, y: 7, dir: 2, hour: 12, quiet: true });
    // (the creatures of stage 4 stay out of these rides: they have their own test)
    await t.eval(`(function(){ if (window.Creatures && Creatures.auto) Creatures.auto(false); Underground.setSeed(${SEED}); Underground.open();
        $gameParty.gainItem($dataItems[59], 1); if (window.Torch && Torch.light) Torch.light(); return 0; })()`);   // (a lit torch in hand, as one goes down: the shots not black)

    // a floor by Underground.go (its stairs up), its lift's facts and events
    const visit = async f => {
        await t.eval(`Underground.go(${f}); 0`);
        const mid = await t.eval(`Underground.mapOf(${f})`);
        const ok = await t.until(t.onMap(mid), 30);
        await t.frames(20);
        await t.calm();
        return ok && t.json(`(function(){ const i = Underground.info(), ev = n => $gameMap.events().find(e => e.event() && e.event().name === n);
            const c = ev("Winda kasztelana"), k = ev("Kołowrót windy"), L = i.spots.lift;
            const free = (x, y) => [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d)) && !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough());
            return { map: $gameMap.mapId(), lift: i.lift, spot: L, up: i.spots.up, cage: c ? [c.x, c.y, c.eventId()] : null, wl: k ? [k.x, k.y, k.eventId()] : null,
                look: c && k ? [c.characterName(), k.characterName(), k.direction()] : null, frontFree: !!L && free(L[0], L[1]),
                count: $gameMap.events().filter(e => e.event() && /^Winda|^Kołowrót/.test(e.event().name)).length }; })()`);
    };
    const placed = (o, f) => o && o.lift && o.cage && o.wl && o.count === 2 && o.cage[0] === o.lift.cage[0] && o.cage[1] === o.lift.cage[1] &&
        o.wl[0] === o.lift.windlass[0] && o.wl[1] === o.lift.windlass[1] && o.spot[0] === o.cage[0] && o.spot[1] === o.cage[1] + 1 && o.frontFree &&
        o.look[0] === "!Fantasy_hanging_cage" && o.look[1] === "!Fantasy_switches2" && o.look[2] === 2 && o.map === (f === 5 ? 135 : 1000 + f);
    const turn = async (o, f) => {
        const r = await t.talkTo(o.wl[2], ["Zakręcić"]);
        await t.frames(10);
        const after = await t.json(`({ stops: Underground.liftStops(), dir: $gameMap.event(${o.wl[2]}).direction(), sw: $gameSelfSwitches.value([$gameMap.mapId(), ${o.wl[2]}, "A"]),
            seen: !!(window.Combat && Combat.hero().seen["d:ug_lift_${f}"]) })`);
        return Object.assign(after, { text: r.text, ok: after.stops.includes(f) && after.dir === 6 && after.sw && after.seen && /Winda znów chodzi/.test(r.text) });
    };

    // ---- floor 5 (Map135, generated): the cage and the windlass; the windlass turned
    const f5 = await visit(5);
    t.check("floor 5 (Map135, a generated floor): one cage 'Winda kasztelana' and one windlass 'Kołowrót windy' (floor 10's pictures) where the floor's facts say, the place in front of the cage free",
        placed(f5, 5), f5);
    t.check("...in the stairs-up hall a few steps from the stairs (not beside them)", f5 && f5.lift && f5.lift.hall === 0 &&
        Math.max(Math.abs(f5.cage[0] - f5.up[0]), Math.abs(f5.cage[1] - f5.up[1])) >= 3 && Math.abs(f5.cage[0] - f5.up[0]) + Math.abs(f5.cage[1] - f5.up[1]) <= 12, f5 && { lift: f5.lift, up: f5.up });
    const cageStuck = await t.talkTo(f5.cage[2], []);
    t.check("...the cage before its windlass is turned: stuck on its chain (no ride)", /zablokowana/.test(cageStuck.text) && !cageStuck.choices.length, cageStuck.text);
    const t5 = await turn(f5, 5);
    t.check("floor 5's windlass turned ('Zakręcić'): a stop of the lift for good, the lever shows down (self switch A), the discovery 'ug_lift_5'", t5.ok, t5);
    await t.locate(f5.spot[0], f5.spot[1], 8);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "winda_co5_pietro5.png"));

    // ---- floors 15 and 25 (map 1015 / 1025, the shared shell): the same, their windlasses turned
    const f15 = await visit(15);
    t.check("floor 15 (map 1015): its cage and windlass in place, the front free", placed(f15, 15), f15);
    const t15 = await turn(f15, 15);
    t.check("...floor 15's windlass turned: a stop", t15.ok, t15);
    const f25 = await visit(25);
    t.check("floor 25 (map 1025): its cage and windlass in place, the front free", placed(f25, 25), f25);
    const t25 = await turn(f25, 25);
    t.check("...floor 25's windlass turned: a stop", t25.ok, t25);
    await t.locate(f25.spot[0], f25.spot[1], 8);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "winda_co5_pietro25.png"));

    // ---- Ruiny Zamku's shaft: the menu in order, down to floor 15 - in front of its cage
    await t.eval("Underground.liftOn(10); 0");   // (floor 10's hand-made stop as well: the menu mixes both kinds)
    await t.eval("Underground.go(0); 0");
    await t.until(t.onMap(10), 30);
    await t.frames(20);
    await t.calm();
    const shaft = await t.eval(`$gameMap.events().find(e => e.event().name === "Winda (szyb)").eventId()`);
    const ride15 = await t.talkTo(shaft, ["Piętro 15"], { shotAtChoice: path.join(SHOTS, "winda_co5_menu.png") });
    const labels = (ride15.choices[0] || []).filter(c => /^Piętro/.test(c));
    t.check("the shaft's menu: the working stops top down - Piętro 5, Piętro 10 (by name), Piętro 15, Piętro 25 - and 'Zostać'",
        labels.length === 4 && /^Piętro 5$/.test(labels[0]) && /^Piętro 10 - /.test(labels[1]) && labels[2] === "Piętro 15" && labels[3] === "Piętro 25" &&
        (ride15.choices[0] || []).slice(-1)[0] === "Zostać", ride15.choices);
    const on15 = await t.until(t.onMap(1015), 30);
    await t.frames(20);
    await t.calm();
    const at15 = await t.json(`({ at: [$gamePlayer.x, $gamePlayer.y], dir: $gamePlayer.direction(), walk: [2, 4, 6].some(d => $gamePlayer.canPass($gamePlayer.x, $gamePlayer.y, d)) })`);
    t.check("...down to floor 15: the hero lands in front of its cage (" + f15.spot + "), facing down, free to walk off",
        on15 && at15.at.join() === f15.spot.slice(0, 2).join() && at15.dir === 2 && at15.walk, at15);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "winda_co5_przyjazd15.png"));

    // ---- from floor 25 up to floor 5 with floor 25's cage
    await visit(25);
    const ride5 = await t.talkTo(f25.cage[2], ["Piętro 5"]);
    const on5 = await t.until(t.onMap(135), 30);
    await t.frames(20);
    await t.calm();
    const at5 = await t.json(`({ at: [$gamePlayer.x, $gamePlayer.y], dir: $gamePlayer.direction(), walk: [2, 4, 6].some(d => $gamePlayer.canPass($gamePlayer.x, $gamePlayer.y, d)) })`);
    t.check("floor 25's cage offers Ruiny Zamku and the other stops (not 25 itself); up to floor 5: the hero lands in front of its cage (" + f5.spot + ")",
        on5 && at5.at.join() === f5.spot.slice(0, 2).join() && at5.dir === 2 && at5.walk && (ride5.choices[0] || []).some(c => /^Ruiny/.test(c)) &&
        !(ride5.choices[0] || []).includes("Piętro 25"), { at5, choices: ride5.choices });
    await t.frames(20);
    await t.shot(path.join(SHOTS, "winda_co5_przyjazd5.png"));
    const lever5 = await t.json(`$gameMap.event(${f5.wl[2]}).direction()`);
    t.check("...floor 5's windlass still shows its lever down (turned for good)", lever5 === 6, lever5);

    // ---- the other generated stops of bands 3-5 (35 ... 95): each its cage and windlass in place - a shot of each
    const more = [];
    for (const f of [35, 45, 55, 65, 75, 85, 95]) {
        const o = await visit(f);
        if (!placed(o, f)) more.push({ f, o });
        if (!o || !o.spot) continue;
        await t.locate(o.spot[0], o.spot[1], 8);
        await t.frames(20);
        await t.shot(path.join(SHOTS, "winda_co5_pietro" + f + ".png"));
    }
    t.check("floors 35, 45, 55, 65, 75, 85, 95 (bands 3-5): each a cage and a windlass in place, the place in front of the cage free", more.length === 0, more);
});
