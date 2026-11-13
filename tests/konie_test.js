// The stable yard's horses (Konie.js, Map008): three walking horses and the trough, inside the fence only, grazing and drinking,
// into the stable at night and out in the morning, a talk (bubble + snort), a save and a load. Screenshots: docs/konie/.
//   CDP_PORT=9600 node tests/konie_test.js
const kit = require("./lib/kit.js");
const SHOTS = require("path").join(__dirname, "..", "docs", "konie");

kit.test({ port: 9600, bootCheck: "gra startuje", errorCheck: "bez błędów w konsoli", evalTimeout: 60000 }, async t => {
    const HERO = [103, 18];   // outside the fence, south of the gate gap: out of the horses' way
    await t.newGame({ map: 8, x: HERO[0], y: HERO[1], dir: 8, day: 40, hour: 12, quiet: true, minimap: false });
    await t.eval("$gameScreen.clearWeather(); 0");
    await t.frames(60);

    // ------------------------------------------------------------ the events and the pictures
    const evs = await t.json("(function(){ return Konie.IDS.horses.concat([3263, 3270]).map(id => { const e = $gameMap.event(id); return e && [e.eventId(), e.event().name, e._characterName]; }); })()");
    t.check("5 horses and the two troughs are injected on Map008", evs.every(Boolean) && evs.length === 7, evs);
    const sheets = await t.json(`Promise.all(["$Kon_Gniady", "$Kon_Gniady_Pasie", "$Kon_Gniady_Pije", "$Kon_Siwy", "$Kon_Siwy_Pasie", "$Kon_Siwy_Pije", "$Kon_Kary", "$Kon_Kary_Pasie", "$Kon_Kary_Pije", "$Kon_Kasztan", "$Kon_Kasztan_Pasie", "$Kon_Kasztan_Pije", "$Kon_Srokaty", "$Kon_Srokaty_Pasie", "$Kon_Srokaty_Pije", "!$Wodopoj"].map(n => new Promise(res => { const b = ImageManager.loadCharacter(n); b.addLoadListener(() => res(n + " " + b.width + "x" + b.height)); })))`);
    t.check("the sheets load: wide horse sheets (walk 8 frames, graze / drink 6 frames x 4 rows), the trough 144x624", sheets.filter(s => / 144x624$/.test(s) || (/_P/.test(s) ? Number(s.split(" ")[1].split("x")[0]) % 6 === 0 : /^\$Kon/.test(s) && Number(s.split(" ")[1].split("x")[0]) % 8 === 0)).length === 16, sheets);
    const geo = await t.json(`(function(){ const out = []; const r = Konie.YARD;
        for (let x = r.x0 - 1; x <= r.x1 + 1; x++) for (const y of [r.y0 - 1, r.y1 + 1]) out.push(!$gameMap.checkPassage(x, y, 0x0f) ? 0 : 1);
        return { rect: r, walls: out.reduce((a, b) => a + b, 0), door: Konie.door() }; })()`);
    const blk = await t.json("[3263, 3264, 3265, 3266, 3270, 3271, 3272, 3273].map(id => { const e = $gameMap.event(id); return e && [e.x, e.y, e.isNormalPriority(), e.isThrough()]; })");
    t.check("the two vertical troughs block their 3 cells each against the west fence (83, 15-17 and 19-21, row 18 free): the picture (below the characters) and three invisible blockers", JSON.stringify(blk) === JSON.stringify([[83, 17, false, false], [83, 17, true, false], [83, 16, true, false], [83, 15, true, false], [83, 21, false, false], [83, 21, true, false], [83, 20, true, false], [83, 19, true, false]]), blk);
    t.check("the yard's rectangle is inside the fence; the stable door is event 209", geo.door.x === 92 && geo.door.y === 10, geo);

    // ------------------------------------------------------------ walking by day
    // every frame: did a horse move (its real position changed) while a clip (grazing / drinking sheet, or a running clip) was on? That is a slide.
    await t.eval(`window.__slide = []; window.__dirs = []; window.__fixed = 0; window.__moves = 0; window.__last = {}; window.__rafOn = true; (function f() { if (!window.__rafOn) return;
        for (const s of Konie.state()) { const l = __last[s.id]; if (l && !s.hidden && (Math.abs(l.rx - s.rx) + Math.abs(l.ry - s.ry)) > 0 && (s.seq || /_(Pasie|Pije)$/.test(s.sheet)) && Math.abs(l.rx - s.rx) + Math.abs(l.ry - s.ry) < 1.2) __slide.push([s.id, s.mode, s.sheet, s.rx, s.ry]); if (s.fixed) __fixed++;
            if (l && !s.hidden) { const dx = s.rx - l.rx, dy = s.ry - l.ry, dd = Math.abs(dx) + Math.abs(dy);
                if (dd > 0 && dd < 1.2) { __moves++; const md = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 6 : 4) : (dy > 0 ? 2 : 8); if (md !== s.d && !s.backing) __dirs.push([s.id, s.mode, md, s.d, s.sheet]); } }
            __last[s.id] = s; }
        requestAnimationFrame(f); })(); 0`);
    await t.eval(`window.__ks = []; window.__sample = setInterval(() => { for (const s of Konie.state()) __ks.push(Object.assign({ f: Graphics.frameCount, hour: $gameSystem.dayNightHour() }, s)); }, 250); 0`);
    // (a horse that should drink soon: the trough is part of what is checked)
    await t.eval("for (const e of Konie.horses()) e._k.thirst = 6; 0");
    const t0 = Date.now();
    await t.wait(60000);
    await t.eval("clearInterval(window.__sample); window.__rafOn = false; 0");
    t.check("the row shown is always the real move direction (outside the backing step), no fixed direction ever: " + await t.json("window.__moves") + " move frames in 60 s", (await t.json("window.__dirs")).length === 0 && (await t.json("window.__fixed")) === 0 && (await t.json("window.__moves")) > 300, await t.json("[window.__dirs.slice(0, 3), window.__fixed, window.__moves]"));
    t.check("a horse never moves (even a fraction of a cell) while a grazing / drinking clip plays", (await t.json("window.__slide")).length === 0, await t.json("window.__slide.slice(0, 3)"));
    const ks = await t.json("window.__ks");
    const by = {};
    for (const s of ks) (by[s.id] = by[s.id] || []).push(s);
    const R = { x0: 84, x1: 98, y0: 11, y1: 22 };
    const outside = ks.filter(s => !s.hidden && (s.x < R.x0 || s.x > R.x1 || s.y < R.y0 || s.y > R.y1));
    t.check("the horses never leave the fenced rectangle (" + ks.length + " samples)", outside.length === 0, outside.slice(0, 3));
    const onWay = ks.filter(s => !s.hidden && Math.abs(s.x - 75) <= 1 && s.y > 13 && s.y <= 15);
    t.check("they stay off the cells in front of the stable door", onWay.length === 0, onWay.slice(0, 3));
    const moved = Object.values(by).map(a => new Set(a.map(s => s.x + "," + s.y)).size);
    t.check("each horse wanders (at least 4 different cells in 60 s)", moved.every(n => n >= 4), moved);
    const modes = new Set(ks.map(s => s.mode));
    t.check("they graze (the grazing sheet is drawn)", ks.some(s => s.mode === "graze" && /_Pasie$/.test(s.sheet)), [...modes]);
    const drank = ks.filter(s => s.mode === "drink");
    const nearT = drank.every(s => s.x === 84 && [15, 16, 19, 20].includes(s.y) && /_Pije$/.test(s.sheet));
    t.check("they walk to the trough and drink at its sides", drank.length > 0 && nearT, drank.slice(0, 2));
    t.check("while it sips the rings are on the water", drank.some(s => s.rip && s.fr >= 4) && drank.some(s => !s.rip), drank.filter(s => s.rip).length);
    // both troughs, nearest free spot, no two horses on one spot (a spot is reserved by the one walking to it): three thirsty horses put at different heights
    await t.eval(`(function(){ Konie.setAuto(true); [[89, 15], [89, 20], [89, 18], [91, 16], [93, 20]].forEach((c, i) => { Konie.pose(i, c[0], c[1], 6, 'stand'); const k = Konie.horses()[i]._k; k.thirst = 20; k.t = 1 + i * 3; k.mode = 'wait'; }); window.__both = []; window.__bs = setInterval(() => { const st = Konie.state(); __both.push(st.map(s => [s.x, s.y, s.mode, s.goal])); }, 200); return 0; })()`);
    await t.wait(30000);
    await t.eval("clearInterval(window.__bs); 0");
    const both = await t.json("window.__both");
    const spotsUsed = new Set(), clash = [];
    for (const row of both) { const seen = {}; for (const [x, y, mode, goal] of row) { if (mode === "drink") { spotsUsed.add(x + "," + y); } const key = mode === "goto" || mode === "drink" ? (goal ? goal.x + "," + goal.y : x + "," + y) : null; if (key) { if (seen[key]) clash.push(key); seen[key] = 1; } } }
    const rowsUsed = [...spotsUsed].map(k => Number(k.split(",")[1]));
    t.check("a thirsty horse goes to the nearest trough with a free spot: both troughs get used, never two horses on one spot (" + [...spotsUsed].join(" ") + ")", rowsUsed.some(y => y <= 18) && rowsUsed.some(y => y >= 19) && clash.length === 0, { spotsUsed: [...spotsUsed], clash: clash.slice(0, 3) });
    await t.eval("Konie.setAuto(false); Konie.pose(0, 87, 15, 6, 'stand'); Konie.pose(1, 93, 17, 6, 'stand'); Konie.pose(2, 91, 20, 6, 'stand'); Konie.pose(3, 95, 14, 6, 'stand'); Konie.pose(4, 88, 19, 6, 'stand'); 0");
    // the BODY: side-on a horse lies over its cell and half of each neighbour; never over the trough (only the head, drinking), the fence
    // (x 82 / 100, y 24; since 2026-11-12 the town yard of Map008, door 209 at 92,10), the stable door's way, nor another horse / the hero's cell
    const bad = [];
    for (const s of ks) {
        if (s.hidden || s.mode === "inside") continue;
        const side = s.d === 4 || s.d === 6, cells = side ? [s.x - 1, s.x, s.x + 1] : [s.x];
        const headX = s.d === 4 ? s.x - 1 : s.x + 1;
        for (const cx of cells) {
            const trough = cx === 83 && ((s.y >= 15 && s.y <= 17) || (s.y >= 19 && s.y <= 21)), drinkingHead = trough && s.d === 4 && s.x === 84 && cx === headX && [15, 16, 19, 20].includes(s.y);
            if ((trough && !drinkingHead) || cx <= 82 || cx >= 100 || s.y >= 24 || s.y <= 10) bad.push([s.id, s.x, s.y, s.d, s.mode, cx]);
        }
    }
    t.check("no horse's body is ever over the trough, the fence or the buildings (" + ks.length + " samples; only the drinking head is over the water)", bad.length === 0, bad.slice(0, 4));
    const near = [];
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length && ks[j].f === ks[i].f; j++) {
        const a = ks[i], b = ks[j]; if (a.hidden || b.hidden || a.y !== b.y) continue;
        if (Math.abs(a.x - b.x) <= ((a.d === 4 || a.d === 6) || (b.d === 4 || b.d === 6) ? 1 : 0)) near.push([a.id, b.id, a.x, b.x, a.y]);
    }
    t.check("two horses never share a row closer than their bodies", near.length === 0, near.slice(0, 3));
    const hrs = ks.map(s => s.hour);
    console.log("note: the clock ran " + Math.min(...hrs).toFixed(2) + " - " + Math.max(...hrs).toFixed(2));

    // ------------------------------------------------------------ the day shots (the hero out of sight in the yard's middle)
    // a horse in a standing / grazing / drinking pose keeps its real x / y to the last decimal, over a whole clip; the frame does change
    await t.eval("Konie.pose(0, 91, 18, 6, 'graze'); Konie.pose(1, 84, 16, 4, 'drink'); Konie.pose(2, 93, 11, 4, 'stand'); Konie.pose(3, 97, 18, 4, 'stand'); Konie.pose(4, 95, 22, 6, 'stand'); window.__p0 = Konie.state().map(s => [s.rx, s.ry]); window.__frs = [new Set(), new Set(), new Set(), new Set(), new Set()]; 0");
    for (let i = 0; i < 40; i++) { await t.wait(150); await t.eval("Konie.state().forEach((s, i) => __frs[i].add(s.fr)); 0"); }
    const still = await t.json("Konie.state().map((s, i) => s.rx === __p0[i][0] && s.ry === __p0[i][1])");
    t.check("posed horses (graze / drink / stand) keep their real x / y over 6 s, and the grazing and drinking frames do change", still.every(Boolean) && (await t.json("[__frs[0].size, __frs[1].size]")).every(n => n >= 4), [still, await t.json("[__frs[0].size, __frs[1].size, __frs[2].size]")]);
    await t.eval("Konie.pose(0, 87, 15, 6, 'stand'); Konie.pose(1, 93, 17, 6, 'stand'); Konie.pose(2, 91, 20, 6, 'stand'); Konie.pose(3, 95, 14, 6, 'stand'); Konie.pose(4, 88, 19, 6, 'stand'); 0");
    await t.eval("$gamePlayer.setOpacity(0); $gamePlayer.locate(91, 15); 0");
    await t.frames(240);
    await t.eval("for (const e of Konie.horses()) { if (!e._k) continue; } 0");
    await t.shot(SHOTS + "/konie_dzien.png");
    await t.eval("(function(){ const e = Konie.horses()[1]; const r = Konie.state(); return 0; })()");
    // a grazing horse for the second shot
    await t.eval("Konie.pose(0, 89, 18, 6, 'graze'); 0");
    await t.frames(100);
    await t.shot(SHOTS + "/konie_pasa_sie.png");
    // the trough close-up: the camera on it, one horse drinking
    await t.eval("Konie.pose(1, 84, 16, 4, 'drink'); Konie.pose(2, 84, 20, 4, 'drink'); Konie.pose(0, 88, 15, 6, 'stand'); Konie.pose(3, 92, 19, 6, 'graze'); Konie.pose(4, 90, 13, 4, 'stand'); $gamePlayer.locate(90, 17); 0");
    await t.frames(70);
    await t.shot(SHOTS + "/wodopoj.png");
    await t.shot(SHOTS + "/dwa_wodopoje_piec_koni.png");
    // the comparison with the buildings: the stable (log), the horses on its doorstep side, the trough by the fence, the hero for scale
    await t.eval(`(function(){ Konie.setAuto(false); const P = [[87, 13, 6], [92, 14, 6], [88, 17, 4], [94, 16, 4], [90, 20, 6]];
        Konie.horses().forEach((e, i) => { Konie.pose(i, P[i][0], P[i][1], P[i][2], "stand"); });
        $gamePlayer.setOpacity(255); $gamePlayer.locate(90, 15); $gamePlayer.setDirection(2); return 0; })()`);
    await t.frames(60);
    await t.shot(SHOTS + "/porownanie_z_budynkami.png");
    await t.eval("Konie.setAuto(true); 0");
    await t.eval("$gamePlayer.setOpacity(255); $gamePlayer.locate(103, 18); for (let i = 0; i < 5; i++) Konie.pose(i, 87 + i * 2, 18, 6, 'stand'); for (const e of Konie.horses()) e._k.t = 60; 0");

    // ------------------------------------------------------------ talking
    await t.eval(`window.__says = []; if (window.SpeechBubbles) { const o = SpeechBubbles.say; SpeechBubbles.say = function(c, tx, f) { __says.push(tx); return o.apply(this, arguments); }; }
        window.__se = []; const os = AudioManager.playSe; AudioManager.playSe = function(se) { __se.push(se.name); return os.apply(this, arguments); }; 0`);
    await t.eval("for (const e of Konie.horses()) e._k.t = 99999; 0");
    await t.eval(`(function(){ const e = Konie.horses()[2]; e.locate(91, 18); e._k.mode = "wait"; e._k.t = 99999; $gamePlayer.locate(91, 19); $gamePlayer.setDirection(8); e.start(); return 0; })()`);
    await t.frames(40);
    t.check("talking to a horse: a line in a bubble and the snort", (await t.json("window.__says")).length === 1 && (await t.json("window.__se")).includes("Horse"), await t.json("[window.__says, window.__se]"));
    await t.eval("$gamePlayer.locate(103, 18); 0");

    // ------------------------------------------------------------ the night
    await t.setHour(22);
    await t.eval("for (const e of Konie.horses()) { e._k.t = 5; } 0");
    const gone = await t.until("Konie.state().every(s => s.hidden && s.mode === 'inside')", 120);
    t.check("at 22:00 the horses walk to the stable and are gone into it", gone, await t.json("Konie.state()"));
    const atDoor = await t.json("Konie.state().map(s => [s.x, s.y])");
    t.check("they went in through the door (hidden on its cell)", atDoor.every(c => c[0] === 92 && c[1] === 10), atDoor);
    await t.setHour(7.5);
    const back = await t.until("Konie.state().every(s => !s.hidden && s.mode !== 'inside')", 60);
    t.check("at 7:30 they are back out of the door", back, await t.json("Konie.state()"));
    await t.until("Konie.state().every(s => !(Math.abs(s.x - 75) <= 1 && s.y > 13 && s.y <= 15) && s.mode !== 'out')", 120);   // (five horses file out of the one door: each takes its turn)
    const after = await t.json("Konie.state()");
    t.check("and in the yard again, out of the door's way", after.every(s => s.x >= 83 && s.x <= 99 && s.y >= 11 && s.y <= 23 && !(Math.abs(s.x - 92) <= 1 && s.y <= 12 && s.y > 10)), after);

    // ------------------------------------------------------------ save + load
    await t.saveTo(1);
    t.check("the game loads again", await t.loadFrom(1));
    await t.frames(120);
    const loaded = await t.json("Konie.state()");
    t.check("after the load the horses are there, in the yard", loaded.length === 5 && loaded.every(s => s.x >= 83 && s.x <= 99 && s.y >= 11 && s.y <= 23 || s.hidden), loaded);
});
