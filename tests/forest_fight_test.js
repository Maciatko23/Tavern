// Fights among the trees (Hunting.js path8, the user's 2026-09-26: "żeby postacie nie blokowały się w gęstym lesie albo nie czekały,
// jak jest przeszkoda pomiędzy nimi"): (a) a boar with a row of trees between it and the hero goes round to a clear run and charges -
// it does not stand, nor run into the trees; (b) a boar running flat out along a line with a tree in it hits the tree and stands
// stunned (a thud, the tree shakes); (c) a pack of 3 wolves round the hero in a wood reaches him from different sides, none standing
// still for long while it hunts; (d) the tame dog gets to a tile behind a row of trees; (e) the path search is fast; (f) wolves after a
// hero by the map's edge and in its corners keep moving and come at him (the 6-day marathon), a straggler does not call the hunt off,
// a killed attacker gives the turn back, none is born in a berry bush and one put there gets out.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 160; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Birds) Birds.auto(false); if (window.Dog) { Dog.auto(false); Dog.removeDog(); } Hunting.auto(false); Hunting.animate(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); Survival.calmWeather(); $gameScreen.clearWeather(); $gameSystem.setDayNightHour(8); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const clear = () => ev("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gameParty.leader().recoverAll(); if (window.Combat) Combat.resetAct(); 0");
        // the sounds played (the boar's thud), and a per-frame recorder in the game loop (the hero kept on his tile and whole)
        await ev(`window.__se = []; const _ps = AudioManager.playSe; AudioManager.playSe = function(se) { window.__se.push(se.name); return _ps.apply(this, arguments); };
            window.__rec = null; const _up = Scene_Map.prototype.update; Scene_Map.prototype.update = function() { _up.call(this); const R = window.__rec; if (R && R.on) R.tick(); }; 0`);
        // helpers in the page: the tiles of the map as the path search sees them
        await ev(`window.__T = {
            G: () => Hunting.pathGrid(),
            open: (x, y, animal) => { const G = Hunting.pathGrid(); return x >= 0 && y >= 0 && x < G.w && y < G.h && G.pass[y * G.w + x] === 15 && !G.ev[y * G.w + x] && !G.bld[y * G.w + x] && !Farming.hasObjectTile(x, y); },
            // the event tiles on the straight line between two tiles
            treesOn: (x0, y0, x1, y1) => { const G = Hunting.pathGrid(); let n = 0; const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0); let x = x0, y = y0, err = dx - dy;
                while (x !== x1 || y !== y1) { const e2 = 2 * err; if (e2 > -dy) { err -= dy; x += sx; } if (e2 < dx) { err += dx; y += sy; } if (G.ev[y * G.w + x]) n++; } return n; },
            // the length of the way (steps) from one tile to another, 0 when there is none
            way: (x0, y0, x1, y1, animal) => { const a = { _x: x0, _y: y0 }, keep = Hunting.PATH.perFrame; Hunting.PATH.perFrame = 1e9; const r = Hunting.path8(a, x1, y1, { animal, key: "way" }); Hunting.PATH.perFrame = keep; return r.reached ? a._p8.path.length : 0; }
        }; 0`);

        // ================= (e) the search is fast =================
        const perf = await J(`(function(){
            const keep = Hunting.PATH.perFrame, a = { _x: 0, _y: 0 }, G = Hunting.pathGrid();
            Hunting.PATH.perFrame = 1e9;
            let times = [], reached = 0;
            for (let run = 0; run < 2; run++) {   // (the first run warms the code up)
                times = []; reached = 0;
                for (let k = 0; k < 200; k++) {
                    const sx = 2 + (k * 7) % (G.w - 4), sy = 2 + (k * 13) % (G.h - 4), tx = 2 + (k * 11) % (G.w - 4), ty = 2 + (k * 5) % (G.h - 4);
                    a._x = sx; a._y = sy; a._p8 = null;
                    const t0 = performance.now(); const r = Hunting.path8(a, tx, ty, { animal: true, key: "perf" }); times.push(performance.now() - t0);
                    if (r.reached) reached++;
                }
            }
            Hunting.PATH.perFrame = keep;
            const tiles = Hunting.PATH.tiles, t1 = performance.now(); Hunting.PATH.tiles = -1; Hunting.pathGrid(); Hunting.PATH.tiles = tiles; const grid = performance.now() - t1;
            times.sort((p, q) => p - q);
            return { n: times.length, reached, avg: +(times.reduce((s, t) => s + t, 0) / times.length).toFixed(3), p95: +times[Math.floor(times.length * 0.95)].toFixed(3), max: +times[times.length - 1].toFixed(3), grid: +grid.toFixed(2), perFrame: Hunting.PATH.perFrame, map: [G.w, G.h] }; })()`);
        // (a single slow one is the machine - a garbage collection, another program - not the search: the 95th percentile is asked)
        check("(e) a search across the map (A*, 8 ways) is quick: under 1 ms on average, 95% under 2 ms; at most " + perf.perFrame + " a frame", perf.avg < 1 && perf.p95 < 2, perf);

        // ================= (a) a boar round a row of trees =================
        // the hero and a boar 6-9 tiles apart with at least 3 trees on the straight line between them, a way round (not too long)
        const A = await J(`(function(){
            const G = __T.G(); let best = null;
            for (let hy = 3; hy < G.h - 3; hy++) for (let hx = 3; hx < G.w - 3; hx++) {
                if (!__T.open(hx, hy)) continue;
                for (let by = hy - 9; by <= hy + 9; by++) for (let bx = hx - 9; bx <= hx + 9; bx++) {
                    const d = Math.hypot(bx - hx, by - hy);
                    if (d < 6 || d > 9 || !__T.open(bx, by)) continue;
                    const n = __T.treesOn(bx, by, hx, hy);
                    if (n < 3 || (best && n <= best.n)) continue;
                    best = { h: { x: hx, y: hy }, b: { x: bx, y: by }, n, d: +d.toFixed(1) };
                }
            }
            if (best) best.way = __T.way(best.b.x, best.b.y, best.h.x, best.h.y, true);
            return best; })()`);
        check("(a) found a boar's place with a row of trees (3+) on the straight line to the hero, and a way round", !!A && A.way > 0, A);
        if (A && A.way > 0) {
            await clear();
            await ev(`(function(){ $gamePlayer.locate(${A.h.x}, ${A.h.y}); $gamePlayer.center(${A.h.x}, ${A.h.y}); const a = Hunting.spawn("boar", ${A.b.x}, ${A.b.y}); a._aware = 1; a._alarm = 5000; a._wait = 0; window.__boar = a;
                window.__rec = { on: true, t: 0, modes: [], still: 0, maxStill: 0, last: "", commitClear: null, hit: false, tick() {
                    const a = __boar; this.t++;
                    if ($gamePlayer.x !== ${A.h.x} || $gamePlayer.y !== ${A.h.y}) $gamePlayer.locate(${A.h.x}, ${A.h.y});
                    if ($gameParty.leader().hp < $gameParty.leader().mhp) { this.hit = true; $gameParty.leader().recoverAll(); }
                    if (this.modes[this.modes.length - 1] !== a._mode) this.modes.push(a._mode);
                    const pos = a._realX.toFixed(3) + "," + a._realY.toFixed(3);
                    this.still = (a._mode === "approach" || a._mode === "charge") && pos === this.last ? this.still + 1 : 0;
                    this.maxStill = Math.max(this.maxStill, this.still);
                    this.last = pos;
                    if (a._commit && this.commitClear === null) this.commitClear = { clear: a.clearRun(), at: [a.x, a.y], t: this.t };
                } }; return 0; })()`);
            let res = null;
            for (let i = 0; i < 90 && !res; i++) { await frames(10); res = await J("(__rec.commitClear || __rec.hit) ? { commit: __rec.commitClear, hit: __rec.hit, t: __rec.t } : null"); }
            const recA = await J("({ modes: __rec.modes, maxStill: __rec.maxStill, bashed: __boar._bashed || 0, t: __rec.t, at: [__boar.x, __boar.y], mode: __boar._mode })");
            await ev("__rec.on = false; 0");
            check("(a) it goes round (approach) and gets a clear run at him: a locked charge on a clear line, or it reaches him - within 15 s",
                !!res && recA.modes.includes("approach") && (res.hit || (res.commit && res.commit.clear)), { res, recA });
            check("(a) ...without running into the trees, and it never stands still for 2 s on the way", recA.bashed === 0 && recA.maxStill < 120, recA);
        }

        // ================= (b) flat out into a tree: stunned =================
        // a tree with 7 open tiles in a straight line in front of it (the hero on the one next to it, the boar at the far end) and room
        // two tiles to the side for his step aside
        const B = await J(`(function(){
            const G = __T.G();
            for (const e of $gameMap.events()) {
                if (!e.isNormalPriority() || e.isThrough() || !(window.ChoppableTree && ChoppableTree.isTree(e))) continue;
                for (const [vx, vy] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
                    let ok = true;
                    for (let k = 1; k <= 7 && ok; k++) if (!__T.open(e.x + vx * k, e.y + vy * k)) ok = false;
                    if (!ok) continue;
                    const hx = e.x + vx, hy = e.y + vy, side = [[vy, vx], [-vy, -vx]].map(([px, py]) => ({ x: hx + px * 2, y: hy + py * 2 })).find(s => __T.open(s.x, s.y));
                    if (side) return { tree: { x: e.x, y: e.y, id: e.eventId() }, h: { x: hx, y: hy }, b: { x: e.x + vx * 7, y: e.y + vy * 7 }, side };
                }
            }
            return null; })()`);
        check("(b) found a tree with a straight lane of 7 tiles in front of it", !!B, B);
        if (B) {
            await clear();
            await ev(`(function(){ window.__se.length = 0; $gamePlayer.locate(${B.h.x}, ${B.h.y}); $gamePlayer.center(${B.h.x}, ${B.h.y}); const a = Hunting.spawn("boar", ${B.b.x}, ${B.b.y}); a._aware = 1; window.__boar = a;
                a.turnTowardCharacter($gamePlayer); a.setMode("charge", 240); $gameMap.event(${B.tree.id})._treeKickAt = undefined;
                window.__rec = { on: true, t: 0, stun: 0, bashAt: null, tick() { const a = __boar; this.t++; $gameParty.leader().recoverAll();
                    if (a._commit && !this.moved) { this.moved = true; $gamePlayer.locate(${B.side.x}, ${B.side.y}); }   // (the step aside at the last moment)
                    if (a._bashed && !this.bashAt) this.bashAt = { t: this.t, at: [a.x, a.y], stun: a._stun, mode: a._mode };
                    this.stun = Math.max(this.stun, a._stun); } }; return 0; })()`);
            let bashed = null;
            for (let i = 0; i < 60 && !bashed; i++) { await frames(5); bashed = await J("__rec.bashAt"); }
            const recB = await J(`({ moved: !!__rec.moved, stun: __rec.stun, se: window.__se.slice(), kicked: $gameMap.event(${B.tree.id})._treeKickAt !== undefined, hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp })`);
            const nextTo = bashed && Math.max(Math.abs(bashed.at[0] - B.tree.x), Math.abs(bashed.at[1] - B.tree.y)) === 1;
            check("(b) he steps aside as it locks its charge: it runs on into the tree and is stunned there (~1.5 s, the stars)", recB.moved && !!bashed && nextTo && recB.stun >= 80, { bashed, recB: { moved: recB.moved, stun: recB.stun }, tree: B.tree });
            check("(b) ...with a thud (Blow1) and the tree shakes", recB.se.includes("Blow1") && recB.kicked, { se: recB.se, kicked: recB.kicked });
            // it gathers itself after the stun and comes again
            let again = null;
            for (let i = 0; i < 40 && !again; i++) { await frames(5); again = await J("__boar._stun <= 0 && ['warn', 'charge', 'approach'].includes(__boar._mode) ? __boar._mode : null"); }
            check("(b) after the stun it gathers itself and comes again", !!again, again);
            await ev("__rec.on = false; 0");
        }

        // ================= (c) a wolf pack in a wood =================
        // the hero on an open tile with the most trees round him (within 3 tiles) that still has open ground on several sides; the pack
        // 6-9 tiles off
        const C = await J(`(function(){
            const G = __T.G(); let best = null;
            for (let hy = 4; hy < G.h - 4; hy++) for (let hx = 4; hx < G.w - 4; hx++) {
                if (!__T.open(hx, hy)) continue;
                let trees = 0, near = 0;
                for (let y = hy - 3; y <= hy + 3; y++) for (let x = hx - 3; x <= hx + 3; x++) if (G.ev[y * G.w + x]) trees++;
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) if (__T.open(hx + dx, hy + dy)) near++;
                if (near < 5 || (best && trees <= best.trees)) continue;
                best = { h: { x: hx, y: hy }, trees, near };
            }
            if (!best) return null;
            for (let r = 6; r <= 9 && !best.p; r++) for (let y = best.h.y - r; y <= best.h.y + r && !best.p; y++) for (let x = best.h.x - r; x <= best.h.x + r && !best.p; x++) {
                if (Math.round(Math.hypot(x - best.h.x, y - best.h.y)) !== r || !__T.open(x, y) || !__T.open(x + 1, y) || !__T.open(x, y + 1)) continue;
                if (__T.way(x, y, best.h.x, best.h.y, true) > 0) best.p = { x, y };
            }
            return best; })()`);
        check("(c) found a spot in a wood (many trees within 3 tiles) and room for a pack 6-9 tiles off", !!C && !!C.p && C.trees >= 8, C);
        if (C && C.p) {
            await clear();
            await ev(`(function(){ $gameSystem.setDayNightHour(22); $gamePlayer.locate(${C.h.x}, ${C.h.y}); $gamePlayer.center(${C.h.x}, ${C.h.y});
                const p = Hunting.spawnPack(${C.p.x}, ${C.p.y}, 3); for (const w of p.members) w._summoned = true; Hunting.wolfEngage(p.members[0]); window.__pack = p;
                window.__rec = { on: true, t: 0, lunges: [], bites: 0, mode: [], last: [], still: [], maxStill: [0, 0, 0], nearest: [99, 99, 99], tick() {
                    this.t++;
                    if ($gamePlayer.x !== ${C.h.x} || $gamePlayer.y !== ${C.h.y}) $gamePlayer.locate(${C.h.x}, ${C.h.y});   // (he stands: a bite's shove is put back)
                    if ($gameParty.leader().hp < $gameParty.leader().mhp) { this.bites++; $gameParty.leader().recoverAll(); }
                    __pack.members.forEach((w, k) => {
                        if (w._dead) return;
                        const pos = w._realX.toFixed(3) + "," + w._realY.toFixed(3);
                        if (w._mode === "lunge" && this.mode[k] !== "lunge") this.lunges.push({ k, ang: +Math.atan2(w._realY - $gamePlayer._realY, w._realX - $gamePlayer._realX).toFixed(2), d: +w.playerDistance().toFixed(1) });
                        this.mode[k] = w._mode;
                        this.still[k] = (w._mode === "stalk" || w._mode === "close") && pos === this.last[k] ? (this.still[k] || 0) + 1 : 0;
                        if (this.still[k] > this.maxStill[k]) { this.maxStill[k] = this.still[k]; (this.stillAt = this.stillAt || [])[k] = [w.x, w.y, w._mode, w._slotBad ? "bad" : ""]; }
                        this.nearest[k] = Math.min(this.nearest[k], +w.playerDistance().toFixed(1));
                        this.last[k] = pos;
                    });
                } }; return 0; })()`);
            for (let i = 0; i < 30; i++) await frames(50);
            const recC = await J("({ t: __rec.t, lunges: __rec.lunges, bites: __rec.bites, maxStill: __rec.maxStill, stillAt: __rec.stillAt || null, nearest: __rec.nearest, modes: __pack.members.map(w => w._mode), alive: __pack.members.filter(w => !w._dead).length })");
            await ev("__rec.on = false; 0");
            const gap = (a, c) => { const d = Math.abs(a - c) % (Math.PI * 2); return d > Math.PI ? Math.PI * 2 - d : d; };
            let sides = 0;
            for (let i = 0; i < recC.lunges.length; i++) for (let j = i + 1; j < recC.lunges.length; j++) sides = Math.max(sides, gap(recC.lunges[i].ang, recC.lunges[j].ang));
            check("(c) the pack reaches him among the trees: leaps from at least 2 sides (60+ degrees apart), every wolf comes within 3 tiles",
                recC.lunges.length >= 2 && sides >= Math.PI / 3 && recC.nearest.every(d => d <= 3), { lunges: recC.lunges, sidesDeg: Math.round(sides * 180 / Math.PI), nearest: recC.nearest, bites: recC.bites, t: recC.t });
            check("(c) ...and none stands still for 2 s while it hunts (on the ring or going round)", recC.maxStill.every(s => s < 120), { maxStill: recC.maxStill, at: recC.stillAt, modes: recC.modes });
            await ev("$gameSystem.setDayNightHour(8); 0");
        }

        // ================= (d) the dog round a row of trees =================
        const D = await J(`(function(){
            const G = __T.G(); let best = null;
            for (let ty = 3; ty < G.h - 3; ty++) for (let tx = 3; tx < G.w - 3; tx++) {
                if (!__T.open(tx, ty)) continue;
                for (let sy = ty - 9; sy <= ty + 9; sy++) for (let sx = tx - 9; sx <= tx + 9; sx++) {
                    const d = Math.hypot(sx - tx, sy - ty);
                    if (d < 5 || d > 9 || !__T.open(sx, sy)) continue;
                    const n = __T.treesOn(sx, sy, tx, ty);
                    if (n < 3 || (best && n <= best.n)) continue;
                    best = { t: { x: tx, y: ty }, s: { x: sx, y: sy }, n, d: +d.toFixed(1) };
                }
            }
            if (best) best.way = __T.way(best.s.x, best.s.y, best.t.x, best.t.y, false);
            return best; })()`);
        check("(d) found a place for the dog with a row of trees (3+) between it and its target, and a way round", !!D && D.way > 0, D);
        if (D && D.way > 0) {
            await clear();
            await ev(`(function(){ $gameSystem.setDayNightHour(10); $gamePlayer.locate(${D.t.x}, ${D.t.y}); $gamePlayer.center(${D.t.x}, ${D.t.y}); $gamePlayer.locate(${D.t.x}, ${D.t.y});
                Object.assign(Dog.state(), { tame: true, trust: 3, mode: "stay", map: 3, hp: 50, st: 50, food: 95, water: 95, hurtUntil: 0, carry: [] });
                const g = Dog.spawnDog(${D.s.x}, ${D.s.y}); window.__dog = g;
                g.think = function() { if (this.stepTo(${D.t.x}, ${D.t.y})) { if (!window.__rec.at) window.__rec.at = window.__rec.t; } };
                window.__rec = { on: true, t: 0, at: null, stuck: 0, jump: 0, lx: g._realX, ly: g._realY, tick() { this.t++; const g = __dog; this.stuck = Math.max(this.stuck, g._stuck);
                    this.jump = Math.max(this.jump, Math.hypot(g._realX - this.lx, g._realY - this.ly)); this.lx = g._realX; this.ly = g._realY; } }; return 0; })()`);
            let at = null;
            for (let i = 0; i < 90 && !at; i++) { await frames(10); at = await ev("__rec.at"); }
            const recD = await J("({ at: __rec.at, t: __rec.t, stuck: __rec.stuck, jump: +__rec.jump.toFixed(2), pos: [__dog.x, __dog.y] })");
            await ev("__rec.on = false; 0");
            // (the dog walks 4: 16 frames a tile; the way is D.way steps)
            check("(d) the tame dog goes round the trees to the tile behind them without getting stuck (no teleport, in good time)",
                !!at && recD.stuck < 30 && recD.jump < 1.5 && at < D.way * 16 * 2 + 120, { recD, way: D.way });
        }

        // ================= (f) wolves at the map's edge and in its corners =================
        // (the 6-day marathon, night of day 3: the hero right by the east edge of Map003 - half on the wall there - and a wolf of the
        // engaged pack stood 1.2 tiles from him in "stalk" for half an hour: one of the pack out past WOLF.lose called the hunt off and
        // the one by him called it on again, every frame; the ring's places off the map, or out on the map's edge behind the wall)
        // packRun: the hero at (hx, hy) (real, he may stand half on the wall), a pack of 3 engaged 7-10 tiles off (on ground they can walk
        // from to him), `n` frames: how long each stood still hunting, the leaps, whether the pack kept the hunt on
        const packRun = async (hx, hy, n) => {
            await clear();
            const ok = await J(`(function(){ $gameSystem.setDayNightHour(23); const tx = Math.round(${hx}), ty = Math.round(${hy});
                $gamePlayer.locate(tx, ty); $gamePlayer._realX = ${hx}; $gamePlayer._realY = ${hy}; $gamePlayer.center(tx, ty);
                window.__H = { x: ${hx}, y: ${hy} };
                const G = Hunting.pathGrid(); let at = null;
                for (let r = 7; r <= 10 && !at; r++) for (let y = ty - r; y <= ty + r && !at; y++) for (let x = tx - r; x <= tx + r && !at; x++) {
                    if (Math.round(Math.hypot(x - tx, y - ty)) !== r || !__T.open(x, y) || !__T.open(x + 1, y) || !__T.open(x, y + 1)) continue;
                    const a = { _x: x, _y: y }, keep = Hunting.PATH.perFrame; Hunting.PATH.perFrame = 1e9; const res = Hunting.path8(a, tx, ty, { animal: true, key: "pack", near: 1.5 }); Hunting.PATH.perFrame = keep;
                    if (res.reached && res.steps <= 2 * r + 6) at = { x, y };   // (not the long way round the wall)
                }
                if (!at) return false;
                const p = Hunting.spawnPack(at.x, at.y, 3); for (const w of p.members) w._summoned = true; Hunting.wolfEngage(p.members[0]); window.__pack = p;
                window.__rec = { on: true, t: 0, still: [0, 0, 0], maxStill: [0, 0, 0], last: [], mode: [], lunges: 0, offs: 0, tick() {
                    this.t++;
                    if (Math.abs($gamePlayer._realX - __H.x) + Math.abs($gamePlayer._realY - __H.y) > 0.01) { $gamePlayer._realX = __H.x; $gamePlayer._realY = __H.y; $gamePlayer._x = Math.round(__H.x); $gamePlayer._y = Math.round(__H.y); }
                    if ($gameParty.leader().hp < $gameParty.leader().mhp) $gameParty.leader().recoverAll();
                    if (!__pack.engaged) this.offs++;
                    __pack.members.forEach((w, k) => {
                        if (w._dead) return;
                        const pos = w._realX.toFixed(3) + "," + w._realY.toFixed(3);
                        if (w._mode === "lunge" && this.mode[k] !== "lunge") this.lunges++;
                        this.mode[k] = w._mode;
                        this.still[k] = (w._mode === "stalk" || w._mode === "close") && pos === this.last[k] ? this.still[k] + 1 : 0;
                        this.maxStill[k] = Math.max(this.maxStill[k], this.still[k]);
                        this.last[k] = pos;
                    });
                } }; return true; })()`);
            if (!ok) return null;
            for (let i = 0; i < Math.ceil(n / 50); i++) await frames(50);
            const r = await J("({ t: __rec.t, maxStill: __rec.maxStill, lunges: __rec.lunges, offs: __rec.offs, modes: __pack.members.map(w => w._mode), at: __pack.members.map(w => [w.x, w.y]) })");
            await ev("__rec.on = false; 0");
            return r;
        };
        for (const [name, hx, hy] of [["by the east edge (half on the wall, the marathon's place)", 37.6, 21], ["in the south-east corner", 37, 26], ["by the north edge, in the east corner", 37, 5]]) {
            const r = await packRun(hx, hy, 1200);
            check("(f) " + name + ": the pack keeps the hunt on, every wolf moves (none stands 2 s), and they leap at him", !!r && r.offs === 0 && r.maxStill.every(s => s < 120) && r.lunges >= 2, r);
        }
        // a straggler past WOLF.lose must not call the hunt off while the others are by him (it froze the pack: off and on every frame)
        const strag = await J(`(function(){ const far = [[3, 26], [3, 5], [20, 26]].find(([x, y]) => __T.open(x, y) && Math.hypot(x - $gamePlayer.x, y - $gamePlayer.y) > Hunting.WOLF.lose + 1);
            const w = __pack.members.find(m => !m._dead); w.locate(far[0], far[1]); window.__strag = w; __rec.on = true; __rec.offs = 0; __rec.maxStill = [0, 0, 0]; __rec.still = [0, 0, 0];
            return { at: far, d: +w.playerDistance().toFixed(1) }; })()`);
        for (let i = 0; i < 8; i++) await frames(50);
        const back = await J("({ offs: __rec.offs, engaged: __pack.engaged, maxStill: __rec.maxStill, d: +__strag.playerDistance().toFixed(1), mode: __strag._mode })");
        await ev("__rec.on = false; 0");
        check("(f) one of the pack left far behind (past WOLF.lose) does not call the hunt off: the pack stays on, it comes back, nobody freezes",
            back.offs === 0 && back.engaged && back.d < strag.d - 3 && back.maxStill.every(s => s < 120), { strag, back });
        // the attacker killed in its leap gives the pack's turn back
        const killed = await J(`(function(){ const p = __pack, w = p.members.find(m => !m._dead && !m._leader); p.attacker = w; w.setMode("windup", 30); Hunting.hit(w, 9999, "melee", {});
            return { dead: !!w._dead, attacker: p.attacker ? p.members.indexOf(p.attacker) : -1 }; })()`);
        check("(f) the pack's attacker killed: its turn is given back (the others may come)", killed.dead && killed.attacker === -1, killed);
        // a wolf in a berry bush (no event - Farming's passage keeps it in): none is born there, and one put there gets out
        const bush = await J(`(function(){ const G = Hunting.pathGrid(); for (let y = 2; y < G.h - 2; y++) for (let x = 2; x < G.w - 2; x++) if (Farming.bushSolid(x, y, 3) && !$gameMap.eventsXy(x, y).length) return { x, y }; return null; })()`);
        if (bush) {
            await clear();
            const born = await J(`(function(){ const p = Hunting.spawnPack(${bush.x}, ${bush.y}, 3); const r = p ? p.members.map(w => [w.x, w.y]) : []; for (const w of p ? p.members : []) Hunting.removeAnimal(w); return r; })()`);
            await ev(`(function(){ const w = Hunting.spawn("wolf", ${bush.x}, ${bush.y}); w._summoned = true; window.__bw = w; return 0; })()`);
            await frames(40);
            const out = await J("({ at: [__bw.x, __bw.y], d: Math.hypot(__bw.x - " + bush.x + ", __bw.y - " + bush.y + ") })");
            check("(f) a berry bush: no wolf of a pack is born in it, and one put there gets out onto open ground within a moment",
                !born.some(([x, y]) => x === bush.x && y === bush.y) && out.d >= 1, { bush, born, out });
        }
        await ev("$gameSystem.setDayNightHour(8); 0");
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
