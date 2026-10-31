// The lights on the graphics card (2026-10-30, docs/wydajnosc/etap3_swiatla.md): Wydajnosc.opts.lightGpu off (the 2D canvases) against
// on (RenderTextures), in ONE game session, in turns, so that the machine's load cancels out.
//
//   node tools/wydajnosc/swiatla.js tawerna przystan jar    both parts for these places (default: all three)
//   options: --port N (CDP, default 9860), --rundy N (turns of off / on, default 5), --klatki N (frames a round, default 200),
//            --dlawienie N (CPU slowed N times, default 4), --zrzuty DIR (a picture "off | on | the difference x8" of the frozen
//            frame for every place: docs/wydajnosc/swiatla/), --bez-czasu (only the pictures), --bez-obrazu (only the times)
// The picture: one frame frozen (no clouds, the clock and the flicker's clock put back), drawn with the key off, on and off again;
// the numbers are how many bytes differ and by how much, against what two drawings of the same version differ by anyway.
"use strict";
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const ROOT = path.join(__dirname, "..", "..");
const kit = require(path.join(ROOT, "tests", "lib", "kit.js"));

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = n => { const i = args.indexOf("--" + n); if (i < 0) return false; args.splice(i, 1); return true; };
const PORT = Number(opt("port", 9860)), ROUNDS = Number(opt("rundy", 5)), FRAMES = Number(opt("klatki", 200)), THROTTLE = Number(opt("dlawienie", 4));
const SHOTS = opt("zrzuty", null), NO_TIME = flag("bez-czasu"), NO_PIC = flag("bez-obrazu");

const near = (x, y) => `(function(){ for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = ${x} + dx, Y = ${y} + dy;
    if ($gameMap.isValid(X, Y) && $gameMap.checkPassage(X, Y, 0x0f) && !$gameMap.eventsXyNt(X, Y).length) { $gamePlayer.locate(X, Y); $gamePlayer.center(X, Y); return [X, Y]; } } return null; })()`;
const PLACES = {
    tawerna: async t => {
        await t.newGame({ map: 1, x: 50, y: 34, day: 40, hour: 20 });
        await t.eval(`(function(){ for (const k of ["tobiasz", "kartograf", "grajek", "kompania"]) { try { Podroznicy.przyplyn(k); } catch (e) {} } Podroznicy.przyplyn("pula"); return 0; })()`);
        await t.go(1, 50, 34, 8);
        await t.eval(near(50, 34));
        await t.setHour(20);
        await t.frames(120);
    },
    przystan: async t => { await t.newGame({ map: 125, x: 24, y: 14, day: 40, hour: 22 }); await t.eval(near(24, 14)); await t.frames(60); },
    burza: async t => {
        await t.newGame({ map: 3, x: 22, y: 14, day: 40, hour: 14, calm: false });
        await t.eval("Survival.forceStorm(2); $gameSystem.setDayNightHour($gameSystem._stormForce.start + 0.6); 0");
        await t.frames(400);
    },
    jar: async t => { await t.newGame({ map: 3, x: 22, y: 14, day: 40, hour: 22 }); await t.eval(near(22, 14)); await t.frames(60); }
};

const MEASURE = n => `new Promise(res => {
    const app = Graphics._app, um = SceneManager.updateMain, rr = app.render, fr = [];
    let u = 0, ups = 0;
    SceneManager.updateMain = function() { const a = performance.now(); um.apply(this, arguments); u += performance.now() - a; ups++; };
    app.render = function() { const a = performance.now(); rr.apply(this, arguments); fr.push([ups ? u / ups : 0, performance.now() - a, a]); u = 0; ups = 0;
        if (fr.length < ${n} + 20) return;
        SceneManager.updateMain = um; app.render = rr;
        const f = fr.slice(20), mean = k => f.reduce((s, x) => s + x[k], 0) / f.length;
        res(JSON.stringify({ upd: +mean(0).toFixed(2), rnd: +mean(1).toFixed(2), frame: +(mean(0) + mean(1)).toFixed(2) })); };
})`;

// one frozen frame drawn with the key off / on / off; returns the pixels (base64) of each and the numbers
const FREEZE = (key, keep) => `(function(){
    const W = Wydajnosc, scene = SceneManager._scene, set = scene._spriteset, app = Graphics._app, saved = Object.assign({}, W.opts);
    if (set._cloudSprites) { for (const c of set._cloudSprites) if (c.parent) c.parent.removeChild(c); set._cloudSprites.length = 0; }
    if (set._dustContainer) set._dustContainer.visible = false;
    const mk = set._targetMarker; if (mk) { mk.update = function() {}; mk.visible = false; }
    app.ticker.stop();
    const F = Graphics.frameCount, C = window.Storm && Storm.state ? Storm.state.clock : 0, A = set._tilemap.animationCount, nl = set._nightLight, age0 = nl ? nl._age : 0;
    const sway = (set._swaySprites || []).map(s => s._phase);
    const draw = on => {
        W.opts[${JSON.stringify(key)}] = on;
        W.settleFilters(scene);
        (set._swaySprites || []).forEach((s, i) => { s._phase = sway[i]; });
        if (window.Mood && Mood.snap) Mood.snap();
        if (nl) nl._age = age0;
        for (let i = 0; i < 4; i++) {
            Graphics.frameCount = F; if (window.Storm && Storm.state) Storm.state.clock = C; set._tilemap.animationCount = A;
            if (nl) nl._nightSig = null;
            set._darkKey = "";
            set.update();
        }
        W.settleFilters(scene);
        app.render();
        const px = app.renderer.extract.pixels(), w = app.renderer.width;
        let s = ""; const CH = 8192;
        for (let i = 0; i < px.length; i += CH) s += String.fromCharCode.apply(null, px.subarray(i, i + CH));
        return { b64: btoa(s), w, n: px.length };
    };
    const off = draw(false), on = draw(true), again = draw(false);
    Object.assign(W.opts, saved);
    W.settleFilters(scene);
    app.ticker.start();
    return JSON.stringify({ off, on, again });
})()`;

const unb64 = s => Buffer.from(s, "base64");
function crc32(buf) { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; }
function png(w, h, rgba) {
    const raw = Buffer.alloc((w * 4 + 1) * h);
    for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
    const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); };
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 6 })), chunk("IEND", Buffer.alloc(0))]);
}
// the numbers of two pictures' difference: bytes that differ, by more than 2 / 8 / 32 of 255, the biggest, the mean of the changed
function compare(a, b) {
    let diff = 0, o2 = 0, o8 = 0, o32 = 0, max = 0, sum = 0;
    for (let i = 0; i < a.length; i++) {
        if (i % 4 === 3) continue;
        const d = Math.abs(a[i] - b[i]);
        if (d) { diff++; sum += d; if (d > 2) o2++; if (d > 8) o8++; if (d > 32) o32++; if (d > max) max = d; }
    }
    const px = a.length / 4 * 3;
    return { diff, pct: +(100 * diff / px).toFixed(3), over2: o2, over8: o8, over32: o32, max, mean: diff ? +(sum / diff).toFixed(2) : 0 };
}
function sideBySide(w, h, off, on) {
    const out = Buffer.alloc(w * 3 * h * 4);
    for (let y = 0; y < h; y++) {
        const sy = h - 1 - y;   // (extract.pixels() is bottom-up)
        off.copy(out, (y * w * 3) * 4, sy * w * 4, (sy + 1) * w * 4);
        on.copy(out, (y * w * 3 + w) * 4, sy * w * 4, (sy + 1) * w * 4);
        for (let x = 0; x < w; x++) {
            const i = (sy * w + x) * 4, o = (y * w * 3 + 2 * w + x) * 4;
            let d = 0;
            for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(off[i + c] - on[i + c]));
            const v = Math.min(255, d * 16);   // (the difference x16: 1/255 is a visible grey)
            out[o] = v; out[o + 1] = v; out[o + 2] = v; out[o + 3] = 255;
        }
    }
    return out;
}

kit.test({ port: PORT, evalTimeout: 300000 }, async t => {
    const list = args.length ? args : Object.keys(PLACES);
    const summary = {};
    for (const name of list) {
        if (!PLACES[name]) continue;
        await PLACES[name](t);
        await t.quiet();
        await t.frames(60);
        const res = summary[name] = {};
        if (!NO_PIC) {
            const r = JSON.parse(await t.eval(FREEZE("lightGpu"), 300000));
            const off = unb64(r.off.b64), on = unb64(r.on.b64), again = unb64(r.again.b64), w = r.off.w, h = r.off.n / 4 / w;
            res.picture = { gpuVsCanvas: compare(off, on), canvasTwice: compare(off, again) };
            console.log(name.padEnd(10), "picture  on-vs-off:", JSON.stringify(res.picture.gpuVsCanvas), " off-vs-off:", JSON.stringify(res.picture.canvasTwice));
            if (SHOTS) {
                fs.mkdirSync(SHOTS, { recursive: true });
                fs.writeFileSync(path.join(SHOTS, name + "_przed_po_roznica.png"), png(w * 3, h, sideBySide(w, h, off, on)));
            }
        }
        if (!NO_TIME) {
            await t.frames(60);
            await t.b.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
            await t.frames(30);
            const runs = { off: [], on: [] }; console.log("timing start");
            for (let r = 0; r < ROUNDS; r++) {
                for (const on of [false, true]) {
                    await t.eval(`Wydajnosc.opts.lightGpu = ${on}; 0`);
                    console.log("round", r, on); await t.frames(40);
                    runs[on ? "on" : "off"].push(JSON.parse(await t.eval(MEASURE(FRAMES), 600000)));
                }
            }
            await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
            await t.eval("Wydajnosc.opts.lightGpu = true; 0");
            const med = a => a.slice().sort((x, y) => x.frame - y.frame)[Math.floor(a.length / 2)];
            const m = { off: med(runs.off), on: med(runs.on) };
            res.time = { off: m.off, on: m.on, offRounds: runs.off.map(x => x.frame), onRounds: runs.on.map(x => x.frame) };
            console.log(name.padEnd(10), "time off:", m.off.frame, "ms (" + m.off.upd + " + " + m.off.rnd + ")  on:", m.on.frame, "ms (" + m.on.upd + " + " + m.on.rnd + ")  [off " + res.time.offRounds.join(", ") + " | on " + res.time.onRounds.join(", ") + "]");
        }
    }
    console.log(JSON.stringify(summary));
});
