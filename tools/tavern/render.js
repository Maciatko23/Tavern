// node render.js <jobs.json>   - renders staged tavern maps in the real game (never writes data/).
// Each job: { map: "<staged MapXXX json path>", id: 1, out: "<png>", mode: "full" | "screen", hour: 18,
//             player: [x, y, dir] | null, probe: "<json out>" | null, wait: frames }
//   full   - the whole map in one picture at 1:1 (48 px a tile), the zoom tag ignored, lights and darkness as in the game
//   screen - the 1280x720 game screen with the map's own zoom, the hero standing at `player`
//   probe  - also writes what the game itself says about the map: passability of every cell and the events
// The staged map is handed to the game in place of data/Map%03d.json by overriding DataManager.loadDataFile in the page;
// Winlu Interior character sheets that are not (yet) in img/characters are loaded from the Winlu folder the same way.
// Every job gets a freshly loaded page (a second transfer to the same map id in one page could stall).
// CDP_PORT (env) picks the debugging port (use 9372 for this tool).
const path = require("path"), fs = require("fs");
const { launch, sleep } = require(path.join(__dirname, "..", "..", "tests", "cdp.js"));
const ROOT = path.join(__dirname, "..", "..");
const WINLU_CHARS = "Winlu Fantasy Tileset - Interior/Remaster/characters/";
const winluNames = fs.readdirSync(path.join(ROOT, "img", "tilesets", WINLU_CHARS)).filter(f => f.endsWith(".png")).map(f => f.slice(0, -4));
const ownNames = new Set(fs.readdirSync(path.join(ROOT, "img", "characters")).filter(f => f.endsWith(".png")).map(f => f.slice(0, -4)));
const fromWinlu = winluNames.filter(n => !ownNames.has(n));
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout: " + what)), ms))]);

(async () => {
    const jobs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
    // mode "region": job.region = [x, y, w, h] in cells, drawn at 1:1 like "full" (for maps too big for one picture)
    const sizeOf = j => { const d = JSON.parse(fs.readFileSync(j.map, "utf8"));
        if (j.mode === "region") return [j.region[2] * 48, j.region[3] * 48];
        return j.mode === "full" ? [d.width * 48, d.height * 48] : [1280, 720]; };
    // job.flags8: a staged passage-flag list for tileset 8 (the page uses it instead of data/Tilesets.json's)
    const maxW = Math.max(1280, ...jobs.map(j => sizeOf(j)[0])), maxH = Math.max(720, ...jobs.map(j => sizeOf(j)[1]));
    const b = await launch({ width: maxW, height: maxH, dpr: 1 });
    const ev = e => withTimeout(b.evaluate(e), 30000, e.slice(0, 60));
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
    for (const job of jobs) {
        const t0 = Date.now();
        try {
            const data = JSON.parse(fs.readFileSync(job.map, "utf8"));
            const id = job.id || 1, file = "Map" + String(id).padStart(3, "0") + ".json";
            const full = job.mode === "full" || job.mode === "region";
            const origin = job.mode === "region" ? job.region.slice(0, 2) : [0, 0];
            if (full) data.note = String(data.note || "").replace(/<Zoom:[^>]*>/ig, "");
            if (job.nodark) data.note = String(data.note || "").replace(/<Dark:\s*on\s*>/ig, "<Dark:off>");   // the plain tiles, for plans
            const [W, H] = sizeOf(job);
            const pl = job.player || [Math.floor(data.width / 2), data.height - 2, 8];
            await b.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
            // (the local server sometimes drops a file while other tests load the game too: reload up to 4 times)
            for (let attempt = 0; attempt < 4; attempt++) {
                await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
                await sleep(500);
                let ok = false;
                for (let i = 0; i < 120; i++) {
                    if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) { ok = true; break; }
                    if (await ev("(function(){ const e = document.getElementById('errorPrinter'); return !!(e && /Failed|Error/i.test(e.innerText || '')); })()").catch(() => false)) break;
                    await sleep(400);
                }
                if (ok) break;
                console.log("  (page did not load, again)");
            }
            await ev(`(function(){ window.__over = { ${JSON.stringify(file)}: ${JSON.stringify(JSON.stringify(data))} }; const _load = DataManager.loadDataFile;
                DataManager.loadDataFile = function(name, src) { if (window.__over[src]) { window[name] = null; const t = window.__over[src]; setTimeout(() => this.onXhrLoad({ status: 200, responseText: t }, name, src, "data/" + src), 0); return; } return _load.call(this, name, src); };
                const Wn = new Set(${JSON.stringify(fromWinlu)}); const _lc = ImageManager.loadCharacter;
                ImageManager.loadCharacter = function(f) { return Wn.has(f) ? this.loadBitmap("img/tilesets/", ${JSON.stringify(WINLU_CHARS)} + f) : _lc.call(this, f); };
                ${job.flags8 ? "$dataTilesets[8].flags = " + fs.readFileSync(job.flags8, "utf8") + ";" : ""}
                return 0; })()`);
            await ev(`(function(){ Graphics.resize(${W}, ${H}); Graphics.boxWidth = ${W}; Graphics.boxHeight = ${H};
                DataManager.setupNewGame(); $gameSystem._minimapHidden = true; if (window.Story && Story.skipIntro) Story.skipIntro();
                $gamePlayer.reserveTransfer(${id}, ${pl[0]}, ${pl[1]}, ${pl[2] || 8}, 0); ${job.player ? "" : "$gamePlayer.setTransparent(true);"}
                SceneManager.goto(Scene_Map); return 0; })()`);
            for (let i = 0; i < 120; i++) { if (await ev(`SceneManager._scene.constructor.name==='Scene_Map' && !!SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===${id}`).catch(() => false)) break; await sleep(300); }
            await frames(30);
            await ev(`(function(){ const s = SceneManager._scene; s.startFadeIn(1, false); if (window.Birds) Birds.auto(false); if (window.Hunting) Hunting.auto(false);
                if (window.Needs && Needs.setEnabled) Needs.setEnabled(false);
                $gameSystem.setDayNightHour(${job.hour == null ? 18 : job.hour}); $gameScreen.changeWeather("none", 0, 0); if (window.Survival && Survival.calmWeather) Survival.calmWeather();
                ${job.player ? "" : "$gamePlayer.setTransparent(true);"}
                for (const e of $gameMap.events()) e._moveType = 0;   // the people stand where the map puts them (a picture, not a walk)
                ${full ? `$gameMap._displayX = ${origin[0]}; $gameMap._displayY = ${origin[1]}; $gamePlayer.center = () => {}; $gamePlayer.updateScroll = () => {};` : ""}
                for (const c of s.children) if (c !== s._spriteset) { c.visible = false; c.renderable = false; }
                return 0; })()`);
            await frames(job.wait || 150);
            const failed = await ev("(function(){ const e = document.getElementById('errorPrinter'); return e && /Failed|Error/i.test(e.innerText || '') ? e.innerText.replace(/\\s+/g, ' ') : ''; })()");
            if (failed) { console.log("ERR page:", failed); continue; }
            if (job.probe) {
                const probe = await ev(`(function(){ const w = $gameMap.width(), h = $gameMap.height(), pass = [];
                    for (let y = 0; y < h; y++) { let row = ""; for (let x = 0; x < w; x++) {
                        const ev1 = $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority());
                        const tile = [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d));
                        row += ev1 ? "#" : tile ? "." : "x"; } pass.push(row); }
                    return JSON.stringify({ pass, events: $gameMap.events().map(e => ({ id: e.eventId(), name: e.event().name, x: e.x, y: e.y, img: e.characterName(), prio: e._priorityType })) }); })()`);
                fs.writeFileSync(job.probe, probe);
            }
            await withTimeout(b.shot(job.out), 30000, "shot");
            console.log("saved", job.out, W + "x" + H, ((Date.now() - t0) / 1000).toFixed(1) + " s");
        } catch (e) { console.log("ERR", job.out, e.message); }
    }
    const errs = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("errors:", errs.slice(-8));
    await b.close();
    process.exit(0);
})();
