// The spike hunter (2026-11-12, docs/WYDAJNOSC.md): a player feels a frame that suddenly takes long (a hitch) more than an average
// a little lower. The hero walks and runs about each map of the world's board, by day and by night, at the processor's own speed;
// every frame's cost (the game's update + the drawing, CPU side) is recorded beside a CPU profile of the same time, and every frame
// far over the usual (SPIKE: over 3x the map's median and over --prog ms) is laid against the profile's samples of its own
// milliseconds: what took them. In the end the causes summed over all the spikes - the first thing to make cheaper.
//
//   node tools/wydajnosc/szarpniecia.js                    the 9 maps, noon and 22:00, 25 s each
//   node tools/wydajnosc/szarpniecia.js 8 3 --sekundy 40   these maps only, longer
//   options: --port N (CDP, default 9655), --sekundy N (per map and hour), --prog MS (the least a spike costs, default 12),
//            --dlawienie N (the processor slowed, default 1), --godziny 12,22, --wyniki DIR (default: the system's temp folder /
//            tawerna_wydajnosc), --tag NAME
// The game server (tools/serve.js) must answer on 8765.
"use strict";
const path = require("path");
const fs = require("fs");
const os = require("os");
const ROOT = path.join(__dirname, "..", "..");
const kit = require(path.join(ROOT, "tests", "lib", "kit.js"));

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const PORT = Number(opt("port", 9655)), SECS = Number(opt("sekundy", 25)), PROG = Number(opt("prog", 12)), THROTTLE = Number(opt("dlawienie", 1));
const HOURS = String(opt("godziny", "12,22")).split(",").map(Number);
const OUTDIR = opt("wyniki", path.join(os.tmpdir(), "tawerna_wydajnosc")), TAG = opt("tag", "szarpniecia");
const BOARD = [162, 24, 13, 111, 8, 4, 125, 3, 20];
const MAPS = args.length ? args.map(Number) : BOARD;

// the hero walks a loop of legs (right, down, left, up), running every other loop; a leg that gets nowhere for a while turns early
const WALK = `(function(){ if (window.__walk) return 0; const legs = ["right", "down", "left", "up"]; const W = window.__walk = { leg: 0, t: 0, loop: 0, last: null, still: 0 };
    const step = () => { if (!window.__walkOn) { for (const k of legs) Input._currentState[k] = false; Input._currentState.shift = false; return; }
        const p = $gamePlayer, here = p._realX.toFixed(2) + "," + p._realY.toFixed(2);
        W.still = here === W.last ? W.still + 1 : 0; W.last = here;
        if (++W.t > 150 || W.still > 20) { W.t = 0; W.still = 0; W.leg = (W.leg + 1) % 4; if (W.leg === 0) W.loop++; }
        for (const k of legs) Input._currentState[k] = k === legs[W.leg];
        Input._currentState.shift = W.loop % 2 === 1; };
    const um = SceneManager.updateMain; SceneManager.updateMain = function() { step(); return um.apply(this, arguments); };
    return 0; })()`;
// the frames' record: [start (performance.now), update ms, drawing ms]
const RECORD = `(function(){ if (window.__rec) return 0; const R = window.__rec = { on: false, frames: [] }; const app = Graphics._app, um = SceneManager.updateMain, rr = app.render;
    let u = 0, t0 = 0;
    SceneManager.updateMain = function() { const a = performance.now(); if (!t0) t0 = a; um.apply(this, arguments); u += performance.now() - a; };
    app.render = function() { const a = performance.now(); rr.apply(this, arguments); const b = performance.now(); if (R.on) R.frames.push([t0 || a, +u.toFixed(2), +(b - a).toFixed(2)]); u = 0; t0 = 0; };
    return 0; })()`;
const KEEP_ALIVE = `(function(){ if (window.__keep) return 0; window.__keep = setInterval(() => { const a = $gameParty.leader(); if (a && a.hp < a.mhp * 0.6) a.setHp(a.mhp); if ($gameSystem.setStamina && $gameSystem.stamina && $gameSystem.stamina() < 30) $gameSystem.setStamina(100); }, 500); return 0; })()`;
const near = (x, y) => `(function(){ for (let r = 0; r < 30; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = ${x} + dx, Y = ${y} + dy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f) && !$gameMap.eventsXyNt(X, Y).length) { $gamePlayer.locate(X, Y); $gamePlayer.center(X, Y); return [X, Y]; } } return null; })()`;

const median = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };

kit.test({ port: PORT, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    fs.mkdirSync(OUTDIR, { recursive: true });
    const report = [], causes = new Map();
    await t.newGame({ map: MAPS[0], x: 30, y: 30, day: 40, hour: 12 });
    await t.eval(KEEP_ALIVE);
    for (const map of MAPS) for (const hour of HOURS) {
        if ((await t.eval("$gameMap.mapId()")) !== map) {
            await t.go(map, 30, 30, 2);
            await t.until(`SceneManager._scene instanceof Scene_Map && $gameMap.mapId() === ${map} && !SceneManager.isSceneChanging()`, 60);
        }
        const size = await t.json("[$gameMap.width(), $gameMap.height()]");
        await t.eval(near(Math.floor(size[0] / 2), Math.floor(size[1] / 2)));
        await t.setDay(40, hour);
        await t.frames(120);
        await t.eval(WALK); await t.eval(RECORD);
        await t.eval("window.__walkOn = true; 0");
        await t.frames(120);   // (under way before the record starts: the map's first builds are not a hitch of play)
        if (THROTTLE !== 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
        await t.b.send("Profiler.enable"); await t.b.send("Profiler.setSamplingInterval", { interval: 250 });
        await t.b.send("Profiler.start");
        // (the clocks matched by a mark: a busy loop of a known name, its first sample in the profile is its start on the page's clock)
        const mark = await t.eval("(function(){ const a = performance.now(); (function __szarpniecieZnak() { while (performance.now() - a < 25) {} })(); window.__rec.frames = []; window.__rec.on = true; return a; })()");
        await t.eval(`new Promise(res => setTimeout(res, ${SECS * 1000}))`, SECS * 1000 + 60000);
        await t.eval("window.__rec.on = false; 0");
        const prof = (await t.b.send("Profiler.stop")).profile;
        if (THROTTLE !== 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        await t.eval("window.__walkOn = false; 0");
        const frames = await t.json("window.__rec.frames");
        const nodes = new Map(), parent = new Map();
        for (const nd of prof.nodes) { nodes.set(nd.id, nd); for (const ch of nd.children || []) parent.set(ch, nd.id); }
        // the profile's clock (us) against the page's (ms): the mark's first sample
        let off = null; { let tm = prof.startTime; for (let i = 0; i < prof.samples.length; i++) { tm += prof.timeDeltas[i] || 0; if (nodes.get(prof.samples[i]).callFrame.functionName === "__szarpniecieZnak") { off = tm / 1000 - mark; break; } } }
        if (off === null) { console.log("NOTE no mark in the profile: Map" + map); off = prof.startTime / 1000 - mark; }
        const label = id => { const cf = nodes.get(id).callFrame; if (cf.url) return cf.functionName + " " + cf.url.split("/").slice(-1)[0] + ":" + (cf.lineNumber + 1);
            let p = parent.get(id); while (p !== undefined) { const q = nodes.get(p).callFrame; if (q.url) return "(" + cf.functionName + ") < " + q.functionName + " " + q.url.split("/").slice(-1)[0] + ":" + (q.lineNumber + 1); p = parent.get(p); }
            return "(" + cf.functionName + ")"; };
        const chain = id => { const out = []; let p = id; while (p !== undefined && out.length < 6) { const cf = nodes.get(p).callFrame; if (cf.url && !/rmmz_|pixi/.test(cf.url)) out.push(cf.functionName + " " + cf.url.split("/").slice(-1)[0] + ":" + (cf.lineNumber + 1)); p = parent.get(p); }
            return out.slice(0, 4).join(" < "); };
        const samples = []; let tt = prof.startTime;
        prof.samples.forEach((id, i) => { tt += prof.timeDeltas[i] || 0; samples.push([tt / 1000 - off, id, (prof.timeDeltas[i + 1] || 0) / 1000]); });
        const costs = frames.map(f => f[1] + f[2]), med = median(costs), lim = Math.max(PROG, med * 3);
        const spikes = frames.filter(f => f[1] + f[2] > lim).sort((a, b) => (b[1] + b[2]) - (a[1] + a[2]));
        const head = `Map${String(map).padStart(3, "0")} ${hour}:00  frames ${frames.length}  median ${med.toFixed(2)} ms  p95 ${pct(costs, 0.95).toFixed(2)}  p99 ${pct(costs, 0.99).toFixed(2)}  max ${Math.max(0, ...costs).toFixed(2)}  spikes (> ${lim.toFixed(1)} ms): ${spikes.length}`;
        console.log(head); report.push(head);
        for (const f of spikes.slice(0, 6)) {
            const t0 = f[0], t1 = f[0] + f[1] + f[2] + 1, own = new Map();
            for (const [ts, id, dur] of samples) if (ts >= t0 && ts <= t1) { const k = label(id); if (/\((idle|program)\)/.test(k)) continue; own.set(k, (own.get(k) || 0) + dur); }
            const top = [...own.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
            const line = `   ${(f[1] + f[2]).toFixed(1)} ms (update ${f[1]}, drawing ${f[2]}): ` + top.map(([k, v]) => `${k} ${v.toFixed(1)}`).join(" | ");
            console.log(line); report.push(line);
            // (who called it: the samples' stacks, the game's own frames, the first one outside the engine's lookups)
            const via = new Map();
            for (const [ts, id, dur] of samples) if (ts >= t0 && ts <= t1) { const k = chain(id); if (k) via.set(k, (via.get(k) || 0) + dur); }
            for (const [k, v] of [...via.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)) { const l = `      ${v.toFixed(1)} ms via ${k}`; console.log(l); report.push(l); }
        }
        for (const f of spikes) {
            const t0 = f[0], t1 = f[0] + f[1] + f[2] + 1;
            for (const [ts, id, dur] of samples) if (ts >= t0 && ts <= t1) { const k = label(id); if (/\((idle|program)\)/.test(k)) continue; causes.set(k, (causes.get(k) || 0) + dur); }
        }
    }
    const top = [...causes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
    report.push("", "== the causes summed over all the spikes (ms of samples inside them)");
    for (const [k, v] of top) report.push(`${v.toFixed(1).padStart(8)}  ${k}`);
    console.log(report.slice(-41).join("\n"));
    const file = path.join(OUTDIR, TAG + ".txt");
    fs.writeFileSync(file, report.join("\n") + "\n");
    console.log("raport: " + file);
});
