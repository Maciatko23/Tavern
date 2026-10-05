// The tavern shift (TavernShift.js): a mini-game scene of four parts (cleaning + wood, pouring beer, the kitchen in rhythm,
// serving the hall). A bot plays it through the keys only (Input._currentState, the same way the keyboard and a pad do): a good
// shift must pay more than a bad one, the result comes back to onEnd, gold is added, 4 hours pass, stamina goes down, the map
// comes back with the hero where he was, and nothing throws. TavernShift in its three files (TavernShift, TavernShift_Hall,
// TavernShift_Parts; the ones js/plugins.js does not have yet the plugin puts into the page itself), its scene on TawernaUI's
// Scene_MiniGame. REGISTERED=1: the parts put into the page's plugin list as they will be registered. Screenshots of every part go
// to docs/tawerna_zmiana/.
//   CDP_PORT=9350 node tests/tavern_shift_test.js
const { launch, sleep } = require("./cdp.js");
const fs = require("fs");
const path = require("path");
const SHOTS = path.join(__dirname, "..", "docs", "tawerna_zmiana");
// (REGISTERED=1: the parts in $plugins under TavernShift, as the plugin manager will list them - js/plugins.js itself is not touched)
const REGISTERED = process.env.REGISTERED ? `(function(){
    let real;
    const mk = name => ({ name, status: true, description: "", parameters: {} });
    Object.defineProperty(window, "$plugins", { configurable: true, get() { return real; }, set(v) {
        const list = v.filter(p => !["TavernShift_Hall", "TavernShift_Parts"].includes(p.name)), at = list.findIndex(p => p.name === "TavernShift");
        list.splice(at + 1, 0, mk("TavernShift_Hall"), mk("TavernShift_Parts"));
        real = list;
    } });
})();` : null;

// ---- the bot: runs inside the page before every logic tick of the scene (TavernShift.onTick) and presses keys
const BOT = String.raw`
window.__bot = { mode: "good", t: 0, path: null, goal: "", last: null, still: 0, cardWait: 0, freeze: null, frozen: null, shot: {}, log: [] };
(function() {
    const KEYS = ["ok", "up", "down", "left", "right", "shift", "escape", "cancel"];
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const near = (a, b) => Math.abs(a.x - b.x) <= 3 && Math.abs(a.y - b.y) <= 3;   // the same dead zone as the keys below
    const nearest = (h, list) => list.reduce((best, p) => (!best || dist(h, p) < dist(h, best) ? p : best), null);
    // the stand picked for a thing stays picked while going there (the nearest one flips as the hero walks)
    function stand(bot, key, h, list) {
        const c = bot.stick && bot.stick.key === key && list.find(p => p.x === bot.stick.p.x && p.y === bot.stick.p.y);
        if (c) return c;
        const p = nearest(h, list);
        bot.stick = { key, p };
        return p;
    }
    function steer(bot, I, h, goal) {
        const key = Math.round(goal.x) + "," + Math.round(goal.y);
        if (bot.goal !== key || !bot.path) { bot.goal = key; bot.path = TavernShift.path(h.x, h.y, goal.x, goal.y) || [goal]; }
        while (bot.path.length && near(bot.path[0], h)) bot.path.shift();
        if (near(goal, h)) return true;
        if (bot.mode === "medium" && bot.t % 3 === 0) return false;   // a slower walker
        const p = bot.path[0] || goal, dx = p.x - h.x, dy = p.y - h.y;
        if (Math.abs(dx) > 3) I[dx > 0 ? "right" : "left"] = true;
        if (Math.abs(dy) > 3) I[dy > 0 ? "down" : "up"] = true;
        if (bot.mode === "good") I.shift = true;
        // stuck (a corner): think again
        if (bot.last && dist(bot.last, h) < 0.5) { if (++bot.still > 20) { bot.path = null; bot.still = 0; } } else bot.still = 0;
        bot.last = { x: h.x, y: h.y };
        return false;
    }
    function clean(bot, I, d) {
        if (bot.mode === "bad") return;   // stands about doing nothing
        const h = d.hero;
        let goal = null, kind = null;
        if (d.carry === "log") { goal = stand(bot, "fire", h, d.fire); kind = "fire"; }
        else if (d.carry === "trash") { goal = d.door; kind = "door"; }
        else {
            const opts = [];
            d.tables.forEach(tb => { if (tb.dirty > 0) opts.push({ kind: "wipe", key: "table" + tb.i, list: tb.stands }); });
            if (d.wood.done < d.wood.need) opts.push({ kind: "log", key: "pile", list: d.pile });
            d.sacks.forEach((s, i) => { if (s.state === "lying") opts.push({ kind: "sack", key: "sack" + i, list: s.stands }); });
            if (!opts.length) return;
            const o = opts.find(x => bot.stick && x.key === bot.stick.key) || opts.reduce((best, x) => (!best || dist(h, nearest(h, x.list)) < dist(h, nearest(h, best.list)) ? x : best), null);
            goal = stand(bot, o.key, h, o.list); kind = o.kind;
        }
        if (steer(bot, I, h, goal)) {
            if (kind === "wipe") { if (d.target === "wipe") I.ok = true; }
            else if (d.target === kind && bot.t % 2 === 0) I.ok = true;
        }
    }
    function beer(bot, I, d) {
        if (d.phase === "ready") { if (bot.t % 2 === 0) I.ok = true; }
        else if (d.phase === "pour") {
            if (bot.mode === "bad") I.ok = true;                       // holds it till it runs over
            else if (bot.mode === "medium") { if (d.level < d.line - 0.004) I.ok = true; }   // lets go at the line: a bit too much
            else if (d.after < d.line - 0.003) I.ok = true;           // lets go early: the tap keeps running a moment
        }
    }
    function kitchen(bot, I, d) {
        if (bot.mode === "bad") { if (bot.t % 37 === 0) I.left = true; return; }   // chops at random
        d.notes.forEach((n, i) => {
            const off = bot.mode === "medium" ? ((i * 7) % 15) - 7 : 0;
            if (!n.res && n.t + off === d.t && !(bot.mode === "medium" && i % 6 === 5)) I[n.key] = true;
        });
    }
    function serve(bot, I, d) {
        const h = d.hero, waiting = d.guests.filter(g => g.state === "wait").sort((a, b) => a.patience - b.patience);
        let goal = null, kind = null;
        if (bot.mode === "bad") {
            // carries bread to whoever waits, wanted or not
            if (!d.hands.length) { goal = d.spots.find(s => s.key === "bread").stand; kind = "spot"; }
            else if (waiting.length) { goal = stand(bot, "guest" + waiting[0].id, h, waiting[0].stands); kind = "guest"; }
            else return;
        } else if (d.hands[0] === "log") { goal = stand(bot, "fire", h, d.fireStand); kind = "fire"; }
        else {
            const servable = waiting.filter(g => g.want.some(k => d.hands.includes(k)));
            const needed = [];
            for (const g of waiting) for (const k of g.want) needed.push(k);
            for (const k of d.hands) { const i = needed.indexOf(k); if (i >= 0) needed.splice(i, 1); }
            const useless = d.hands.length && !servable.length;
            const nearBar = h.y < 190;
            if (useless) { goal = d.tray; kind = "tray"; }
            else if (d.fire < 0.7 && !d.hands.length && bot.mode !== "medium") { goal = stand(bot, "pile", h, d.pile); kind = "log"; }
            else if (needed.length && d.hands.length < (bot.mode === "medium" ? 1 : 2) && (d.hands.length === 0 || nearBar)) { goal = d.spots.find(s => s.key === needed[0]).stand; kind = "spot"; }
            else if (servable.length) { goal = stand(bot, "guest" + servable[0].id, h, servable[0].stands); kind = "guest"; }
            else if (d.fire < 1.5 && !d.hands.length && bot.mode !== "medium") { goal = stand(bot, "pile", h, d.pile); kind = "log"; }
            else {
                const dirty = d.tables.filter(t => t.dirty > 0 && !t.busy);
                const tb = dirty.find(t => bot.stick && bot.stick.key === "table" + t.i) || dirty[0];
                if (tb) { goal = stand(bot, "table" + tb.i, h, tb.stands); kind = "wipe"; }
                else { goal = d.spots[1].stand; kind = "idle"; }
            }
        }
        if (steer(bot, I, h, goal)) {
            if (kind === "wipe") { if (d.target === "wipe") I.ok = true; }
            else if (kind !== "idle" && d.target === kind && bot.t % 2 === 0) I.ok = true;
        }
    }
    TavernShift.onTick = function(scene) {
        const bot = window.__bot, I = Input._currentState;
        for (const k of KEYS) I[k] = false;
        bot.t++;
        const st = TavernShift.state();
        if (!st) return;
        // screenshot stops: the bot freezes the scene (turbo 0) and the test shoots and lets it go on
        if (bot.freeze) {
            const tag = bot.freeze(st, scene);
            if (tag && !bot.shot[tag]) { bot.shot[tag] = true; bot.frozen = tag; bot.turbo = scene.turbo; scene.turbo = 0; return; }
        }
        const where = st.phase + "|" + st.card + "|" + st.part;
        if (where !== bot.where) { bot.where = where; bot.cardWait = 0; }
        if (st.phase === "card" || st.phase === "banner" || st.phase === "summary") {
            if (++bot.cardWait > 30 && bot.t % 2 === 0) { I.ok = true; }
            return;
        }
        bot.cardWait = 0;
        if (st.phase !== "play" || !st.data) return;
        const d = st.data;
        if (st.part === "clean") clean(bot, I, d);
        else if (st.part === "beer") beer(bot, I, d);
        else if (st.part === "kitchen") kitchen(bot, I, d);
        else if (st.part === "serve") serve(bot, I, d);
    };
})();
`;

(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 30000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(!!ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    fs.mkdirSync(SHOTS, { recursive: true });
    try {
        if (REGISTERED) await b.send("Page.addScriptToEvaluateOnNewDocument", { source: REGISTERED });
        // boot (a busy server sometimes leaves the page half-loaded: go again)
        let booted = false;
        for (let a = 0; a < 4 && !booted; a++) {
            await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
            for (let i = 0; i < 120; i++) {
                if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title' && DataManager._globalInfo)").catch(() => false)) { booted = true; break; }
                await sleep(500);
            }
        }
        check("the game boots", booted);
        // a new game in the tavern (Map001)
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(1, 50, 53, 8, 0);   /* (the tavern's vestibule) */ SceneManager.goto(Scene_Map); })()`);
        const onMap = () => ev("SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && $gameMap.mapId()===1").catch(() => false);
        for (let i = 0; i < 120; i++) { if (await onMap()) break; await sleep(500); }
        await sleep(1200);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); $gameScreen.clearWeather(); 0");
        // the plugin is not in plugins.js yet: load it as if it were
        const loaded = await ev(`new Promise(res => { if (window.TavernShift) return res(true);   /* (in js/plugins.js since 2026-09-27: already loaded) */ const s = document.createElement("script"); s.src = "js/plugins/TavernShift.js?" + Date.now(); s.onload = () => res(!!window.TavernShift); s.onerror = () => res(false); document.body.appendChild(s); })`);
        check("TavernShift.js loads into the page", loaded);
        const fam = await J(`(function(){ const P = Tawerna.api("TavernShift_parts") || {};
            return { kit: !!P.kit, hall: !!P.hall, parts: !!(P.parts && P.parts.PART_CLASSES), scene: !!(window.Scene_TavernShift && Scene_TavernShift.prototype instanceof Tawerna.ui.Scene_MiniGame),
                order: $plugins.map(p => p.name).filter(n => /^TavernShift/.test(n)) }; })()`);
        check("...in its three files (the hall, the four parts), its scene on TawernaUI's Scene_MiniGame" + (REGISTERED ? " (registered: " + fam.order.join(", ") + ")" : ""),
            fam.kit && fam.hall && fam.parts && fam.scene && (!REGISTERED || fam.order.join() === "TavernShift,TavernShift_Hall,TavernShift_Parts"), fam);
        await ev(BOT + "; 0");
        await ev("window.__shifts = []; Tawerna.on('shiftDone', e => window.__shifts.push({ grade: e.grade, pay: e.pay, level: e.level }), { owner: 'ShiftTest' }); 0");

        // one whole shift: bot mode, options -> { result from onEnd, gold/time/stamina before and after, the map afterwards }
        const runShift = async (mode, opts, freeze) => {
            await ev(`(function(){ $gameSystem.setDayNightHour(17); $gameSystem.setStamina(100); window.__res = null; window.__bot.mode = "${mode}"; window.__bot.freeze = ${freeze || "null"}; window.__bot.shot = {}; window.__bot.frozen = null; })()`);
            const before = await J("({ gold: $gameParty.gold(), hour: $gameSystem.dayNightHour(), day: $gameSystem.dayNightDay(), stamina: $gameSystem._stamina, x: $gamePlayer.x, y: $gamePlayer.y, map: $gameMap.mapId(), done: TavernShift.stats().done })");
            const started = await ev(`TavernShift.start(Object.assign(${JSON.stringify(opts)}, { onEnd: r => { window.__res = r; window.__endScene = SceneManager._scene.constructor.name; } }))`);
            const t0 = Date.now();
            let lastPart = null;
            for (let i = 0; i < 1500; i++) {
                const frozen = await ev("window.__bot.frozen");
                if (frozen) {
                    await sleep(250);
                    await b.shot(path.join(SHOTS, frozen + ".png"));
                    await ev("TavernShift.scene().turbo = window.__bot.turbo; window.__bot.frozen = null; 0");
                }
                const st = await J("TavernShift.state() && { phase: TavernShift.state().phase, part: TavernShift.state().part }");
                if (st && st.part !== lastPart) { lastPart = st.part; }
                if (await ev("!!window.__res") && await onMap()) break;
                await sleep(200);
            }
            await sleep(600);
            const after = await J("({ gold: $gameParty.gold(), hour: $gameSystem.dayNightHour(), day: $gameSystem.dayNightDay(), stamina: $gameSystem._stamina, x: $gamePlayer.x, y: $gamePlayer.y, map: $gameMap.mapId(), done: TavernShift.stats().done, scene: SceneManager._scene.constructor.name, endScene: window.__endScene, running: TavernShift.isRunning() })");
            const res = await J("window.__res");
            return { started, before, after, res, secs: Math.round((Date.now() - t0) / 1000) };
        };
        const brief = r => r && { total: r.total, pay: r.pay, tips: r.tips, grade: r.grade, score: r.score,
            parts: Object.fromEntries(Object.entries(r.parts || {}).map(([k, v]) => [k, v.score])) };

        // ---- 1. a good shift (level 0), fast (4 logic ticks a frame)
        const good = await runShift("good", { seed: 11, level: 0, turbo: 4 });
        await b.shot(path.join(SHOTS, "13_powrot_na_mape.png"));
        check("a shift starts from the map (TavernShift.start -> true)", good.started === true);
        check("the good shift ends and onEnd gets the result {pay, tips, total, grade, parts}", good.res && ["pay", "tips", "total", "grade", "parts"].every(k => k in good.res) &&
            ["clean", "beer", "kitchen", "serve"].every(k => good.res.parts[k] && typeof good.res.parts[k].score === "number"), brief(good.res));
        check("onEnd is called back on the map (Scene_Map), the shift scene is gone", good.after.endScene === "Scene_Map" && good.after.scene === "Scene_Map" && !good.after.running, good.after);
        check("the hero is back where he stood, on the same map", good.after.map === good.before.map && good.after.x === good.before.x && good.after.y === good.before.y, { before: good.before, after: good.after });
        check("the pay went into the purse (gold + total)", good.res && good.after.gold - good.before.gold === good.res.total && good.res.total > 0, { before: good.before.gold, after: good.after.gold, total: good.res && good.res.total });
        check("4 hours passed (17:00 -> 21:00)", Math.abs((good.after.day * 24 + good.after.hour) - (good.before.day * 24 + good.before.hour) - 4) < 0.05, { before: good.before.hour, after: good.after.hour });
        check("the shift took stamina (100 -> about 70)", Math.abs(good.after.stamina - (good.before.stamina - 30)) <= 3, { before: good.before.stamina, after: good.after.stamina });
        check("the good bot cleaned everything in time (clean >= 90)", good.res && good.res.parts.clean.score >= 90 && good.res.parts.clean.done === good.res.parts.clean.total, good.res && good.res.parts.clean);
        check("the good bot poured the mugs well (beer >= 80, nothing spilled)", good.res && good.res.parts.beer.score >= 80 && good.res.parts.beer.spilled === 0, good.res && good.res.parts.beer);
        check("the good bot hit the kitchen steps (kitchen >= 90)", good.res && good.res.parts.kitchen.score >= 90, good.res && good.res.parts.kitchen);
        check("the good bot served the hall (served most orders, no mistakes, tips > 0)", good.res && good.res.parts.serve.served >= good.res.parts.serve.orders * 0.7 && good.res.parts.serve.mistakes === 0 && good.res.tips > 0, good.res && good.res.parts.serve);
        check("finished shifts are counted (stats.done 0 -> 1)", good.before.done === 0 && good.after.done === 1);
        console.log("   good shift took " + good.secs + " s real time (turbo 4)");

        // ---- 2. a bad shift, the same seed and level
        const bad = await runShift("bad", { seed: 11, level: 0, turbo: 4 });
        check("the bad shift ends and comes back to the map too", bad.res && bad.after.scene === "Scene_Map" && bad.after.endScene === "Scene_Map", brief(bad.res));
        check("a good shift pays more than a bad one (total, pay and tips)", good.res && bad.res && good.res.total > bad.res.total && good.res.pay > bad.res.pay && good.res.tips >= bad.res.tips,
            { good: brief(good.res), bad: brief(bad.res) });
        check("and gets a better grade", good.res && bad.res && good.res.grade > bad.res.grade, { good: good.res && good.res.gradeName, bad: bad.res && bad.res.gradeName });
        check("the bad shift shows what went wrong (spilled mugs, mistakes, guests walking out)", bad.res && bad.res.parts.beer.spilled > 0 && bad.res.parts.serve.mistakes > 0 && bad.res.parts.serve.walkouts > 0 && bad.res.bad.length > 0,
            bad.res && { beer: bad.res.parts.beer.spilled, serve: bad.res.parts.serve, bad: bad.res.bad });
        check("the bad shift's gold is added as well", bad.res && bad.after.gold - bad.before.gold === bad.res.total, { d: bad.after.gold - bad.before.gold, total: bad.res && bad.res.total });

        // ---- 2b. a so-so shift (slower, a little off): between the two
        const mid = await runShift("medium", { seed: 11, level: 0, turbo: 4 });
        check("a so-so shift pays between the bad and the good one", mid.res && mid.res.total > bad.res.total && mid.res.total < good.res.total, brief(mid.res));

        // ---- 3. difficulty grows with the shifts done; skipping parts through the API
        const lvl = await ev("TavernShift.level()");
        check("difficulty grows with the shifts done (level 3 after three shifts)", lvl === 3, lvl);
        const cfg = await J("(function(){ const a = TavernShift.levelCfg(0), c = TavernShift.levelCfg(3); return { g0: a.serve.guests, g3: c.serve.guests, p0: a.serve.patience, p3: c.serve.patience, m0: a.beer.mugs, m3: c.beer.mugs }; })()");
        check("a harder level: more guests, less patience, more mugs", cfg.g3 > cfg.g0 && cfg.p3 < cfg.p0 && cfg.m3 > cfg.m0, cfg);
        await ev("$gameSystem.setDayNightHour(17); window.__bot.mode = 'idle'; TavernShift.onTick = null; window.__res = null; TavernShift.start({ seed: 3, parts: ['beer', 'serve'], cards: false, onEnd: r => window.__res = r }); 0");
        for (let i = 0; i < 100; i++) { const s = await J("TavernShift.state()"); if (s && s.phase === "play") break; await sleep(200); }
        const sk1 = await ev("TavernShift.skip(100)");
        for (let i = 0; i < 50; i++) { const s = await J("TavernShift.state()"); if (s && s.phase === "play" && s.part === "serve") break; await sleep(200); }
        const sk2 = await ev("TavernShift.skip(100)");
        for (let i = 0; i < 50; i++) { const s = await J("TavernShift.state()"); if (s && s.phase === "summary") break; await sleep(200); }
        const skSum = await J("TavernShift.state()");
        check("TavernShift.skip(score) ends parts at once; a shift of chosen parts (beer + serve)", sk1 && sk2 && skSum && skSum.phase === "summary" && skSum.result && skSum.result.grade === 5 && Object.keys(skSum.result.parts).join() === "beer,serve", skSum && brief(skSum.result));
        // O on the summary (it takes keys after half a second) until the map is back
        for (let i = 0; i < 60; i++) {
            if (await ev("!!window.__res") && await onMap()) break;
            await ev("Input._currentState.ok = true; 0"); await sleep(100); await ev("Input._currentState.ok = false; 0"); await sleep(250);
        }
        check("...and it returns to the map with that result", await onMap() && (await ev("window.__res && window.__res.grade")) === 5);

        // ---- 4. the pause: P in the middle of a part, "Przerwij zmianę" -> no pay, the map comes back
        await ev("$gameSystem.setDayNightHour(17); window.__res = null; TavernShift.start({ seed: 4, parts: ['clean'], cards: false, onEnd: r => window.__res = r }); 0");
        for (let i = 0; i < 100; i++) { const s = await J("TavernShift.state()"); if (s && s.phase === "play") break; await sleep(200); }
        const gold4 = await ev("$gameParty.gold()");
        const tap = async k => { await ev(`Input._currentState.${k} = true; 0`); await sleep(120); await ev(`Input._currentState.${k} = false; 0`); await sleep(150); };
        await tap("escape");
        const paused = await J("TavernShift.state()");
        await sleep(300);
        await b.shot(path.join(SHOTS, "10_pauza.png"));
        await tap("down"); await tap("ok");
        const ab = await J("TavernShift.state()");
        await sleep(900);
        await b.shot(path.join(SHOTS, "12_przerwana.png"));
        for (let i = 0; i < 60; i++) { if (await ev("!!window.__res") && await onMap()) break; await tap("ok"); await sleep(150); }
        const abRes = await J("window.__res");
        check("P pauses the part; 'Przerwij zmianę' ends the shift without pay and returns to the map", paused && paused.paused && ab && ab.phase === "summary" && abRes && abRes.aborted && abRes.pay === 0 && (await ev("$gameParty.gold()")) === gold4 + abRes.total && await onMap(),
            { paused: paused && paused.paused, phase: ab && ab.phase, res: abRes && { aborted: abRes.aborted, pay: abRes.pay, total: abRes.total, hours: abRes.hours } });
        const shifts = await J("window.__shifts");
        check("each finished shift is told on the Tawerna bus: 'shiftDone' { grade, pay, level } (four; the aborted one is not)", shifts.length === 4 && shifts.length === (await ev("TavernShift.stats().done")) &&
            shifts.every(s => s.grade > 0 && s.pay > 0 && s.level >= 0) && shifts[3].grade === 5, shifts);

        // ---- 5. screenshots of every part (the good bot again, 2 logic ticks a frame, stopping at the moments to shoot)
        await ev(BOT + "; 0");
        const FREEZE = `function(st, scene) {
            const d = st.data;
            if (st.phase === "card" && scene.phaseT > 16) return ({ intro: "01_karta_zmiany", clean: "02_sprzatanie_karta", beer: "04_piwo_karta", kitchen: "06_kuchnia_karta", serve: "08_obsluga_karta" })[st.card];
            if (st.phase === "summary" && scene.phaseT > 16) return "11_podsumowanie";
            if (st.phase === "banner" && st.part === "serve" && scene.phaseT > 16) return "10a_obsluga_wynik";
            if (!d || st.phase !== "play") return null;
            if (st.part === "clean" && d.carry === "log" && d.t > 300) return "03_sprzatanie";
            if (st.part === "beer" && d.phase === "pour" && d.level > d.line * 0.75 && d.i >= 1) return "05_piwo";
            if (st.part === "kitchen" && d.notes.filter(n => n.res).length >= 11) return "07_kuchnia";
            if (st.part === "serve" && d.t > 1500 && d.guests.filter(g => g.state === "wait").length >= 2 && d.hands.length) return "09_obsluga";
            return null;
        }`;
        const shotsRun = await runShift("good", { seed: 21, turbo: 2 }, FREEZE);
        const shots = fs.readdirSync(SHOTS).filter(f => f.endsWith(".png"));
        check("screenshots of every part saved in docs/tawerna_zmiana/", ["01_karta_zmiany", "03_sprzatanie", "05_piwo", "07_kuchnia", "09_obsluga", "11_podsumowanie"].every(n => shots.includes(n + ".png")), shots);
        check("a shift with no level given runs at the level of the shifts done (4 done -> level 4)", shotsRun.res && shotsRun.res.level === 4 && shotsRun.res.shift === 5, shotsRun.res && { level: shotsRun.res.level, shift: shotsRun.res.shift });
        console.log("   good: " + JSON.stringify(brief(good.res)));
        console.log("   bad:  " + JSON.stringify(brief(bad.res)));
        console.log("   so-so: " + JSON.stringify(brief(mid.res)));
        console.log("   level 4 run: " + JSON.stringify(brief(shotsRun.res)));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    check("no errors in the console", !err.length, err.slice(-6));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
