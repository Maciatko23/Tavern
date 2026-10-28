// The speed of the map measured as on an average computer (2026-10-24, docs/WYDAJNOSC.md): the processor slowed down 4 times (CDP
// Emulation.setCPUThrottlingRate), the time of a frame - the game's update (one, of the 60 a second) + the drawing, CPU side - and the
// frames a second on the heavy maps, standing or walking; a profile of it (CDP Profiler) on asking.
//
//   node tools/wydajnosc/pomiar.js                       every place, standing, 4x slower
//   node tools/wydajnosc/pomiar.js jar miasto --idzie    these places, the hero walking right and left (the map scrolls)
//   node tools/wydajnosc/pomiar.js jar --profil          + a profile: <wyniki>/<tag>_jar.txt (the costliest functions, the tree of
//                                                         the calls) and .cpuprofile (Edge's DevTools, Performance: load)
//   node tools/wydajnosc/pomiar.js --przed HEAD          the same with the game's js/ files as they are in git at HEAD (an overlay
//                                                         of the changed ones: tests/cdp.js GAME_OVERLAY) - "before" against "now"
//   node tools/wydajnosc/pomiar.js --jakosc srednia   at this level of the graphics' quality (Opcje -> Jakość grafiki: wysoka - the
//                                                         default here, so that a measurement never changes level under itself -,
//                                                         srednia, niska, auto); the tag gets the level
//   node tools/wydajnosc/pomiar.js jar --idzie --poziomy   the three levels one after another on the same map, in turns (wysoka,
//                                                         srednia, niska, wysoka, ...: --rundy of each), the median of each - the
//                                                         machine's load drifts, and only turns on the same map cancel it out
//   node tools/wydajnosc/pomiar.js przystan --efekty  each part of the quality on its own (gfx: mood, bloom, grass, particles,
//                                                         critters, lazyEvery, smallShadows, fireShadows, nightScale, skyFx): Wysoka's
//                                                         value against Niska's, in turns (A, B, A, B...), the difference of the medians
//   options: --port N (CDP, default 9652), --dlawienie N (default 4), --klatki N (frames measured, default 240), --rundy N (rounds,
//            the middle one counts; default 1), --tag NAME, --wyniki DIR (default: the system's temp folder / tawerna_wydajnosc),
//            --cicho (all that moves by itself off - the animals, the birds, the moths, the people: tests/lib/kit.js QUIET - so that
//            turns on the same map compare the picture's cost, not the game's life changing under them; for --poziomy / --efekty)
//   CDP_GPU=0 node tools/wydajnosc/pomiar.js ... --dlawienie 1   the drawing on the processor (SwiftShader, no graphics card): the
//            "rysowanie" is then what a weak card feels - the glow's passes, the night's canvases, the fill of the screen
// The places: jar (Kruczy Jar, Map003, noon), farma (the fixture day40_farm: the farm built up, 17:00), miasto (Map008), las
// (Leśna droga, Map021), podgrodzie (Map111), labirynt (the underground's floor 35, 80x60), przystan (Map125 at 22:00 - the lamps,
// the night's layer), burza (Map003, a storm raging). The game server (tools/serve.js) must answer on 8765 (tests/run.js starts it).
"use strict";
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execSync } = require("child_process");
const ROOT = path.join(__dirname, "..", "..");
const kit = require(path.join(ROOT, "tests", "lib", "kit.js"));

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = n => { const i = args.indexOf("--" + n); if (i < 0) return false; args.splice(i, 1); return true; };
const PORT = Number(opt("port", 9652)), THROTTLE = Number(opt("dlawienie", 4)), FRAMES = Number(opt("klatki", 240)), ROUNDS = Number(opt("rundy", 1));
const PRZED = opt("przed", null), PROFILE = flag("profil"), WALK = flag("idzie");
const JAKOSC = { wysoka: "high", srednia: "medium", niska: "low", auto: "auto" }, jakosc = String(opt("jakosc", "wysoka")).toLowerCase();
const POZIOMY = flag("poziomy"), EFEKTY = flag("efekty"), CICHO = flag("cicho");
if (!JAKOSC[jakosc]) { console.log("--jakosc: wysoka | srednia | niska | auto"); process.exit(2); }
const OUT = opt("wyniki", path.join(os.tmpdir(), "tawerna_wydajnosc")), TAG = opt("tag", (PRZED ? "przed" : "teraz") + (WALK ? "_idzie" : "_stoi") + (jakosc === "wysoka" ? "" : "_" + jakosc) + (POZIOMY ? "_poziomy" : EFEKTY ? "_efekty" : ""));
fs.mkdirSync(OUT, { recursive: true });

// "before": the js/ files that differ from REF, as they are at REF, served instead of the working ones
function overlayOf(ref) {
    const dir = path.join(OUT, "overlay_" + ref.replace(/[^\w.-]/g, "_"));
    fs.rmSync(dir, { recursive: true, force: true });
    const changed = execSync(`git diff --name-only ${ref} -- js index.html`, { cwd: ROOT }).toString().split(/\r?\n/).filter(Boolean);
    const added = execSync("git ls-files --others --exclude-standard -- js", { cwd: ROOT }).toString().split(/\r?\n/).filter(Boolean);
    for (const f of changed) {
        let body;
        try { body = execSync(`git show ${ref}:${f}`, { cwd: ROOT, maxBuffer: 64 << 20 }); } catch (e) { continue; }   // (new since REF: not on REF's list)
        fs.mkdirSync(path.join(dir, path.dirname(f)), { recursive: true });
        fs.writeFileSync(path.join(dir, f), body);
    }
    console.log("before (" + ref + "): " + changed.length + " changed file(s) served as at " + ref + (added.length ? "; new, not on its list: " + added.join(", ") : ""));
    return dir;
}

const near = (x, y) => `(function(){ for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = ${x} + dx, Y = ${y} + dy;
    if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f) && !$gameMap.eventsXyNt(X, Y).length) { $gamePlayer.locate(X, Y); $gamePlayer.center(X, Y); return [X, Y]; } } return null; })()`;
const PLACES = {
    jar: async t => { await t.newGame({ map: 3, x: 22, y: 14, day: 40, hour: 12, minimap: true }); },
    farma: async t => { await t.loadFixture("day40_farm"); },
    miasto: async t => { await t.newGame({ map: 8, x: 50, y: 53, day: 40, hour: 12 }); await t.eval(near(50, 53)); },
    las: async t => { await t.newGame({ map: 21, x: 40, y: 30, day: 40, hour: 12 }); await t.eval(near(40, 30)); },
    podgrodzie: async t => { await t.newGame({ map: 111, x: 43, y: 37, day: 40, hour: 12 }); await t.eval(near(43, 37)); },
    labirynt: async t => {
        await t.newGame({ map: 3, x: 22, y: 14, day: 40, hour: 12 });
        await t.eval("Underground.go(35); 0");
        await t.until("$gameMap.mapId() !== 3 && " + t.onMap(), 60);
        await t.frames(60);
        await t.calm();
    },
    przystan: async t => { await t.newGame({ map: 125, x: 24, y: 14, day: 40, hour: 22 }); await t.eval(near(24, 14)); },
    burza: async t => {
        await t.newGame({ map: 3, x: 22, y: 14, day: 40, hour: 14, calm: false });
        await t.eval("Survival.forceStorm(2); $gameSystem.setDayNightHour($gameSystem._stormForce.start + 0.6); 0");
        await t.frames(400);
    }
};

// on the page: n drawn frames, each its updates (their mean) + its drawing; walk: right 90 frames, left 90, ...
const MEASURE = (n, walk) => `new Promise(res => {
    const app = Graphics._app, um = SceneManager.updateMain, rr = app.render, fr = [];
    let u = 0, ups = 0;
    const step = () => { if (!${walk}) return; const k = Math.floor(fr.length / 90) % 2; Input._currentState.right = k === 0; Input._currentState.left = k === 1; };
    SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); u += performance.now() - a; ups++; };
    app.render = function() { const a = performance.now(); rr.apply(this, arguments); fr.push([u, ups, performance.now() - a, a]); u = 0; ups = 0; step();
        if (fr.length >= ${n} + 20) { SceneManager.updateMain = um; app.render = rr; Input._currentState.right = Input._currentState.left = false; done(); } };
    function done() {
        const f = fr.slice(20), U = f.map(x => x[1] ? x[0] / x[1] : 0), R = f.map(x => x[2]), C = f.map((x, i) => U[i] + R[i]);
        const mean = a => a.reduce((s, v) => s + v, 0) / a.length, pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(a.length * p)];
        const secs = (f[f.length - 1][3] - f[0][3]) / 1000;
        res(JSON.stringify({ upd: +mean(U).toFixed(2), rnd: +mean(R).toFixed(2), frame: +mean(C).toFixed(2), p95: +pct(C, 0.95).toFixed(2),
            fps: +((f.length - 1) / secs).toFixed(1), ups: +(f.reduce((s, x) => s + x[1], 0) / secs).toFixed(1),
            sprites: SceneManager._scene._spriteset ? SceneManager._scene._spriteset._characterSprites.length : 0 }));
    }
})`;

// a profile as text: the costliest functions by their own time and with what they call, and the tree of the calls (over 0.5%)
function profileText(profile) {
    const nodes = new Map(), dt = new Map(), parent = new Map();
    for (const n of profile.nodes) nodes.set(n.id, n);
    for (let i = 0; i < profile.samples.length; i++) dt.set(profile.samples[i], (dt.get(profile.samples[i]) || 0) + (profile.timeDeltas[i + 1] || 0));
    for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
    const key = n => { const cf = n.callFrame; return (cf.functionName || "(anon)") + " " + (cf.url || "").replace(/.*\//, "") + ":" + (cf.lineNumber + 1); };
    const self = new Map(), total = new Map();
    let all = 0;
    for (const [id, t] of dt) {
        all += t;
        self.set(key(nodes.get(id)), (self.get(key(nodes.get(id))) || 0) + t);
        const seen = new Set();
        for (let p = id; p !== undefined; p = parent.get(p)) { const k = key(nodes.get(p)); if (!seen.has(k)) { seen.add(k); total.set(k, (total.get(k) || 0) + t); } }
    }
    const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => (v / 1000).toFixed(0).padStart(6) + " ms " + (100 * v / all).toFixed(1).padStart(5) + "%  " + k);
    const incl = new Map();
    const inc = id => { if (incl.has(id)) return incl.get(id); let v = dt.get(id) || 0; for (const c of nodes.get(id).children || []) v += inc(c); incl.set(id, v); return v; };
    inc(profile.nodes[0].id);
    const lines = [];
    const show = (ids, depth) => {
        const groups = new Map();
        for (const id of ids) { const k = key(nodes.get(id)); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(id); }
        const list = [...groups.entries()].map(([k, l]) => [k, l, l.reduce((s, id) => s + incl.get(id), 0), l.reduce((s, id) => s + (dt.get(id) || 0), 0)]).sort((a, b) => b[2] - a[2]);
        for (const [k, l, v, sv] of list) {
            if (v / all < 0.005 || depth > 60) continue;
            lines.push(" ".repeat(depth) + (100 * v / all).toFixed(1) + "% (self " + (100 * sv / all).toFixed(1) + ") " + k);
            show([].concat(...l.map(id => nodes.get(id).children || [])), depth + 1);
        }
    };
    show([profile.nodes[0].id], 0);
    return "TOTAL " + (all / 1000).toFixed(0) + " ms\n--- SELF\n" + top(self, 50).join("\n") + "\n--- TOTAL (inclusive)\n" + top(total, 150).join("\n") +
        "\n--- TREE\n" + lines.join("\n") + "\n";
}

const median = runs => runs.slice().sort((a, b) => a.frame - b.frame)[Math.floor(runs.length / 2)];
const fmt = m => String(m.frame).padStart(6) + " ms (" + m.upd + " + " + m.rnd + "), " + String(m.fps).padStart(5) + " kl/s";
// the three levels in turns on this place (the same map, the same load drifting under all of them): { high, medium, low } medians
async function measureLevels(t, name) {
    const order = ["high", "medium", "low"], runs = { high: [], medium: [], low: [] };
    for (let r = 0; r < ROUNDS; r++) {
        for (const level of order) {
            await t.eval(`Wydajnosc.quality.set(${JSON.stringify(level)}); 0`);
            await t.frames(30);   // (the grass laid again, the night's picture at its size)
            runs[level].push(JSON.parse(await t.eval(MEASURE(FRAMES, WALK), 600000)));
        }
    }
    const out = {};
    for (const level of order) { out[level] = median(runs[level]); out[level].rounds = runs[level].map(x => x.frame + " ms / " + x.fps + " fps"); }
    console.log((name + (WALK ? " (idzie)" : " (stoi)")).padEnd(22) + " poziomy:");
    for (const level of order) console.log("   " + ({ high: "Wysoka", medium: "Średnia", low: "Niska" })[level].padEnd(8) + fmt(out[level]) + "  [" + out[level].rounds.join(", ") + "]");
    return out;
}
// each part of the quality on its own: Wysoka's value (A) against Niska's (B), in turns; the medians and the saving B - A (ms)
const EFFECTS = ["mood", "bloom", "grass", "particles", "critters", "lazyEvery", "smallShadows", "fireShadows", "nightScale", "skyFx"];
async function measureEffects(t, name) {
    const presets = await t.json("Wydajnosc.quality.PRESETS"), out = {};
    await t.eval("Wydajnosc.quality.set('high'); 0");
    await t.frames(30);
    for (const key of EFFECTS) {
        if (presets.high[key] === presets.low[key]) continue;
        const runs = { a: [], b: [] };
        for (let r = 0; r < ROUNDS; r++) {
            for (const [k, value] of [["a", presets.high[key]], ["b", presets.low[key]]]) {
                // (the field set by hand, with the version up: GroundDetail lays the grass again; nothing else of the level changes)
                await t.eval(`(function(){ const g = Wydajnosc.gfx; g[${JSON.stringify(key)}] = ${JSON.stringify(value)}; g.version++; return 0; })()`);
                await t.frames(30);
                runs[k].push(JSON.parse(await t.eval(MEASURE(FRAMES, WALK), 600000)));
            }
        }
        await t.eval(`(function(){ const g = Wydajnosc.gfx; g[${JSON.stringify(key)}] = ${JSON.stringify(presets.high[key])}; g.version++; return 0; })()`);
        const a = median(runs.a), b = median(runs.b);
        out[key] = { a: a.frame, b: b.frame, saves: +(a.frame - b.frame).toFixed(2), fpsA: a.fps, fpsB: b.fps, upd: +(a.upd - b.upd).toFixed(2), rnd: +(a.rnd - b.rnd).toFixed(2),
            roundsA: runs.a.map(x => x.frame), roundsB: runs.b.map(x => x.frame) };
        console.log("   " + key.padEnd(13) + String(presets.high[key]).padStart(5) + " -> " + String(presets.low[key]).padEnd(5) + " klatka " + a.frame + " -> " + b.frame + " ms (oszczędza " +
            out[key].saves + " ms: krok " + out[key].upd + ", rysowanie " + out[key].rnd + ")  [" + out[key].roundsA.join(", ") + " | " + out[key].roundsB.join(", ") + "]");
    }
    return out;
}

const opts = Object.assign({ port: PORT, evalTimeout: 120000 }, PRZED ? { overlay: overlayOf(PRZED), overlayJs: true } : {});
kit.test(opts, async t => {
    const list = args.length ? args : Object.keys(PLACES), results = {};
    for (const name of list) {
        if (!PLACES[name]) { console.log("NOTE no such place: " + name + " (" + Object.keys(PLACES).join(", ") + ")"); continue; }
        await PLACES[name](t);
        if (CICHO) {
            await t.quiet();
            if (name === "burza") {   // (the quiet calms the weather too: the storm raised again - it is the place's point)
                await t.eval("Survival.forceStorm(2); $gameSystem.setDayNightHour($gameSystem._stormForce.start + 0.6); 0");
                await t.frames(400);
            }
        }
        if (POZIOMY || EFEKTY) {
            await t.frames(90);
            await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
            await t.frames(30);
            if (POZIOMY) { console.log(""); results[name] = await measureLevels(t, name); }
            if (EFEKTY) { console.log((name + (WALK ? " (idzie)" : " (stoi)")).padEnd(22) + " efekty (Wysoka -> Niska, każdy osobno):"); results[name] = Object.assign(results[name] || {}, { efekty: await measureEffects(t, name) }); }
            await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
            await t.eval("Wydajnosc.quality.set('high'); 0");
            continue;
        }
        // the level of the graphics' quality (only in the page; "auto" starts at Wysoka and may step down while measuring - that is the point)
        await t.eval(`(function(){ const W = window.Wydajnosc; if (W && W.quality) W.quality.set(${JSON.stringify(JAKOSC[jakosc])}, { auto: "high" }); return 0; })()`);
        await t.frames(90);
        const info = await t.json("({ map: $gameMap.mapId(), hour: +$gameSystem.dayNightHour().toFixed(2), events: $gameMap.events().length, wydajnosc: !!window.Wydajnosc, " +
            "jakosc: window.Wydajnosc && Wydajnosc.quality ? Wydajnosc.quality.level() : null, trawa: window.GroundDetail && GroundDetail.count ? GroundDetail.count() : null })");
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
        await t.frames(30);
        if (PROFILE) { await t.b.send("Profiler.enable"); await t.b.send("Profiler.setSamplingInterval", { interval: 200 }); await t.b.send("Profiler.start"); }
        const runs = [];
        for (let r = 0; r < ROUNDS; r++) runs.push(JSON.parse(await t.eval(MEASURE(FRAMES, WALK), 600000)));
        runs.sort((a, b) => a.frame - b.frame);
        const m = runs[Math.floor(runs.length / 2)];
        if (ROUNDS > 1) m.rounds = runs.map(r => r.frame + " ms / " + r.fps + " fps");
        if (PROFILE) {
            const p = (await t.b.send("Profiler.stop")).profile;
            await t.b.send("Profiler.disable");
            fs.writeFileSync(path.join(OUT, TAG + "_" + name + ".cpuprofile"), JSON.stringify(p));
            fs.writeFileSync(path.join(OUT, TAG + "_" + name + ".txt"), profileText(p));
        }
        await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        if (jakosc === "auto") info.jakoscPo = await t.eval("Wydajnosc.quality.level()");   // (where Automatycznie ended up)
        results[name] = Object.assign(m, info);
        console.log((name + (WALK ? " (idzie)" : " (stoi)") + (jakosc === "wysoka" ? "" : " " + jakosc)).padEnd(30), "klatka " + String(m.frame).padStart(6) + " ms (aktualizacja " + m.upd + " + rysowanie " + m.rnd + "), " +
            m.fps + " kl/s, gra " + m.ups + " akt./s" + (m.rounds ? "  [" + m.rounds.join(", ") + "]" : "") + (info.jakoscPo ? "  auto -> " + info.jakoscPo : ""));
        await t.shot(path.join(OUT, TAG + "_" + name + ".png"));
    }
    fs.writeFileSync(path.join(OUT, TAG + ".json"), JSON.stringify(results, null, 1));
    console.log("wyniki: " + path.join(OUT, TAG + ".json"));
});
