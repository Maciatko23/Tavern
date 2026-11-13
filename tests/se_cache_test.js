// SE cache (Atmosphere.js, "Sound-effect cache"): a decoded sound effect is kept, so playing it again does not fetch or decode.
// Run: CDP_PORT=9471 node tests/se_cache_test.js
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9471, lightGpu: true, bootCheck: "game boots", errorCheck: "no console errors" }, async t => {
    await t.newGame({ map: 125, x: 24, y: 14 });
    const J = e => t.json(e);
    await t.eval(`(function(){ window.__fetches = []; const f = window.fetch; window.fetch = function(u){ window.__fetches.push(String(u && u.url || u)); return f.apply(this, arguments); };
        const x = XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open = function(m, u){ window.__fetches.push(String(u)); return x.apply(this, arguments); };
        const d = BaseAudioContext.prototype.decodeAudioData; window.__decodes = 0; BaseAudioContext.prototype.decodeAudioData = function(){ window.__decodes++; return d.apply(this, arguments); }; return 0; })()`);
    const count = name => J(`window.__fetches.filter(u => u.indexOf("audio/se/${name}") >= 0).length`);
    const wait = async (expr, n = 200) => { for (let i = 0; i < n; i++) { if (await t.eval(expr)) return true; await t.frames(3); } return false; };

    const on = await J(`Atmosphere.seCache.on`);
    t.check("cache is on", on === true);
    // 20 plays of one SE in different frames
    for (let i = 0; i < 20; i++) { await t.eval(`AudioManager.playSe({ name: "Attack3", volume: 90, pitch: 100, pan: 0 }); 0`); await t.frames(2); }
    await wait(`Atmosphere.seCache.map.size > 0`);
    t.check("20 plays of Attack3 fetch its file once", (await count("Attack3")) === 1, await count("Attack3"));
    t.check("20 plays decode it once", (await J(`window.__decodes`)) === 1, await J(`window.__decodes`));
    t.check("entry is in the cache", await J(`[...Atmosphere.seCache.map.keys()].some(k => k.indexOf("Attack3") >= 0) && Atmosphere.seCache.pending.size === 0`));

    // a cached WebAudio is ready at once and equals the first one's data
    const r = await J(`(function(){ const a = AudioManager.createBuffer("se/", "Attack3"); const b = AudioManager.createBuffer("se/", "Attack3");
        const e = [...Atmosphere.seCache.map].find(([k]) => k.indexOf("Attack3") >= 0)[1];
        return { ready: a.isReady() === true, loaded: a._isLoaded, same: a._buffers[0] === b._buffers[0] && a._buffers[0] === e.buffer, dur: a._totalTime === e.buffer.duration && a._totalTime > 0,
            loopEnd: a._loopLengthTime === a._totalTime || a._loopLength > 0, err: !!a.isError() }; })()`);
    t.check("cached WebAudio is ready at once, same buffer and duration", r.ready && r.loaded && r.same && r.dur && !r.err, r);
    // play behaves: volume/pitch/pan, source nodes
    const p = await J(`(function(){ const b = AudioManager.createBuffer("se/", "Attack3"); AudioManager.updateSeParameters(b, { volume: 50, pitch: 120, pan: -40 }); b.play(false);
        const o = { playing: b.isPlaying(), nodes: b._sourceNodes.length, vol: b._volume, pitch: b._pitch, pan: b._pan, src: b._sourceNodes[0] && b._sourceNodes[0].buffer === b._buffers[0] }; b.stop(); return o; })()`);
    t.check("cached SE plays with volume/pitch/pan", p.playing && p.nodes === 1 && p.src && Math.abs(p.pitch - 1.2) < 1e-6 && Math.abs(p.pan + 0.4) < 1e-6 && p.vol > 0, p);
    t.check("still one fetch after the extra creates", (await count("Attack3")) === 1);

    // a follower created while the first load runs waits for it (no second fetch) and gets onLoad
    const f = await J(`(function(){ window.__w = [AudioManager.createBuffer("se/", "Bell1"), AudioManager.createBuffer("se/", "Bell1"), AudioManager.createBuffer("se/", "Bell1")];
        window.__got = 0; window.__w[2].addLoadListener(() => { window.__got++; }); return window.__w.map(w => w.isReady()); })()`);
    t.check("fresh SE is not ready at first (loading)", f[0] === false && f[1] === false, f);
    t.check("followers become ready and fire the load listener", await wait(`window.__w.every(w => w.isReady()) && window.__got === 1`));
    t.check("3 creates of Bell1 fetched once, buffers shared", (await count("Bell1")) === 1 && await J(`window.__w[0]._buffers[0] === window.__w[2]._buffers[0]`), await count("Bell1"));
    // autoplay of a waiting one
    await t.eval(`(function(){ const w = AudioManager.createBuffer("se/", "Bell2"); const v = AudioManager.createBuffer("se/", "Bell2"); v.play(false); window.__v = v; return 0; })()`);
    t.check("a waiting buffer told to play starts when loaded", await wait(`window.__v._sourceNodes.length === 1 && window.__v.isPlaying()`));
    await t.eval(`window.__v.stop(); 0`);

    // a missing file: error, never cached, followers do not hang forever
    await t.eval(`(function(){ window.__m = [AudioManager.createBuffer("se/", "NoSuchSound"), AudioManager.createBuffer("se/", "NoSuchSound")]; return 0; })()`);
    t.check("a missing SE ends in error and is not cached", await wait(`window.__m[0].isError() && window.__m[1].isError()`) && await J(`!Atmosphere.seCache.map.has(window.__m[0]._url) && Atmosphere.seCache.pending.size === 0`));

    // a different SE still loads
    t.check("a different SE still loads", await wait(`Atmosphere.seCache.map.size >= 3`) && (await J(`[...Atmosphere.seCache.map.keys()].some(k => k.indexOf("Bell2") >= 0)`)));

    // bounded: a tiny fake fill goes over the count limit
    const bnd = await J(`(function(){ const C = Atmosphere.seCache; const buf = Atmosphere.seCache.map.values().next().value.buffer;
        // push many urls through the real store path via fake leaders
        for (let i = 0; i < C.maxFiles + 20; i++) { const w = Object.create(WebAudio.prototype); w._buffers = []; w._sourceNodes = []; w._loadListeners = []; w._sampleRate = 0; w._loopStart = 0; w._loopLength = 0; w._url = "audio/se/Fake" + i + ".ogg"; w._isLoaded = true; w._seUpdates = 1; const pend = { leader: w, followers: [] }; w._sePend = pend; C.pending.set(w._url, pend); WebAudio.prototype._onDecode.call(w, buf); }
        return { size: C.map.size, max: C.maxFiles, bytes: C.bytes(), maxBytes: C.maxBytes, pend: C.pending.size, oldGone: !C.map.has("audio/se/Fake0.ogg"), newKept: C.map.has("audio/se/Fake" + (C.maxFiles + 19) + ".ogg") }; })()`);
    t.check("cache is bounded (count, bytes, LRU order)", bnd.size <= bnd.max && bnd.bytes <= bnd.maxBytes && bnd.oldGone && bnd.newKept && bnd.pend === 0, bnd);
});
