// The test kit: one boot, one new game, the usual helpers and the PASS / FAIL summary of the end-to-end tests (over tests/cdp.js).
//
//   const kit = require("./lib/kit.js");
//   kit.test({ plugins: ["HomeDecor"] }, async t => {
//       await t.newGame({ story: true, skipIntro: true });
//       t.check("grandpa is at home", await t.eval("!!$gameMap.event(901)"));
//   });
//
// kit.test(opts, body): opens the game, runs the body (an exception: an "ERR" line and a failed result), then t.done().
// kit.open(opts) / t.done(): the same by hand. The old tests (their own boot code) keep working - this only adds.
// The port: CDP_PORT, else opts.port, else 9333. docs/TESTY.md has the whole story.
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");
const { execSync } = require("child_process");
const { Report } = require("./report.js");

const TESTS = path.join(__dirname, "..");
const FIXTURES = path.join(TESTS, "fixtures");
const GAME = "http://127.0.0.1:8765/index.html";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const js = v => JSON.stringify(v);

// console lines that count as errors, and the noise that does not
const ERROR_RE = /EXC|rror|Failed to load/;
const NOISE_RE = /favicon|net::ERR/;

// put into every page before the game's own scripts: MZ's Retry button (a file the busy server did not deliver) is pressed by itself
const PAGE_SETUP = `(function(){
    window.__kit = { retries: [], pops: [], tops: [] };
    setInterval(function(){ var r = document.getElementById("retryButton"); if (r) { window.__kit.retries.push(Date.now()); r.click(); } }, 400);
})();`;

// after the boot (and the injected plugins): what pops up over the hero and at the top is noted (t.popups(), t.notices())
const HOOKS = `(function(){
    const K = window.__kit;
    if (!K || K.hooked) return 0;
    K.hooked = true;
    const _pop = Game_Temp.prototype.pushLootPopup;
    if (_pop) Game_Temp.prototype.pushLootPopup = function(icon, text, color, opts) { K.pops.push({ text: String(text), gain: !!(opts && opts.gain) }); return _pop.apply(this, arguments); };
    const _top = Game_Temp.prototype.pushTopNotice;
    if (_top) Game_Temp.prototype.pushTopNotice = function(text, color, opts) { K.tops.push([text, (opts && opts.sub) || ""].join(" | ")); return _top.apply(this, arguments); };
    return 0;
})()`;

// everything that moves by itself off: needs, animals, the dog, birds, livestock, the weather; the minimap hidden, combat mode off
const QUIET = `if (window.Needs && Needs.setEnabled) Needs.setEnabled(false);
    if (window.Hunting) { Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); }
    if (window.Livestock && Livestock.auto) Livestock.auto(false); if (window.Dog && Dog.auto) Dog.auto(false); if (window.Birds && Birds.auto) Birds.auto(false);
    if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); }
    if (window.Creatures && Creatures.auto) { Creatures.auto(false); Creatures.clear(); }
    if (window.Act3 && Act3.auto) Act3.auto(false);   // (the siege of the tavern does not arm itself in other systems' tests)
    if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather();
    $gameSystem._minimapHidden = true; $gameSystem._combatMode = false;`;

// the talk driver (story_test.js / tavern_life_test.js): while on, O on every message (each 4th frame) and the next label of `picks`
// (a prefix) on a choice; each message is logged with the one it is drawn over (0 the hero, an event id, null the plain window).
// __standBy(id): the hero put on a free tile beside an event (all it covers, <Occupy:...>), below it first, facing it.
const DRIVER = String.raw`(function() {
    if (window.__drv) return;
    const T = window.__drv = { on: false, f: 0, picks: [], log: [], choices: [], waiting: null, holdAt: -1, missing: [] };
    const _startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() {
        _startMessage.call(this);
        const b = this._bubbleOf, talk = window.SpeechBubbles && SpeechBubbles.talk ? SpeechBubbles.talk() : null;
        T.log.push({ t: $gameMessage.allText().replace(/ /g, " "), who: b ? (b === $gamePlayer ? 0 : b.eventId()) : null, name: $gameMessage.speakerName(),
            bust: !!(talk && talk.on && talk.npc), map: $gameMap.mapId() });
    };
    const _update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        if (T.on) {
            const I = Input._currentState, cw = this._choiceListWindow, mw = this._messageWindow;
            I.ok = false;
            T.f++;
            if (cw && cw.active && cw.isOpen() && $gameMessage.isChoice()) {
                const labels = $gameMessage.choices().slice();
                if (!T.waiting) { T.waiting = labels; T.choices.push(labels); }
                if (T.picks.length) {
                    const want = T.picks.shift();
                    let i = labels.findIndex(l => l.indexOf(want) === 0);
                    if (i < 0) { T.missing.push(want + " not in " + labels.join(" | ")); i = labels.length - 1; }
                    cw.select(i);
                    cw.deactivate();   // (as processOk does: an active choice window would keep the next message from opening)
                    cw.callOkHandler();
                    T.waiting = null;
                }
            } else if ($gameMessage.hasText() && !$gameMessage.isChoice() && mw && mw.isOpen() && !(T.holdAt >= 0 && T.log.length >= T.holdAt)) {
                if (T.f % 4 === 0) I.ok = true;   // (no O on a message with choices: a press landing as they open would take the first)
            }
        }
        _update.call(this);
    };
    window.__standBy = function(id) {
        const e = $gameMap.event(id), p = $gamePlayer;
        if (!e) return null;
        const m = /<Occupy:([^>]*)>/i.exec((e.event() && e.event().note) || ""), o = { left: 0, right: 0, up: 0, down: 0 };
        if (m) for (const part of m[1].split(",")) { const kv = part.split("=").map(s => s.trim()); if (kv[0] in o) o[kv[0]] = Number(kv[1]) || 0; }
        const x0 = e.x - o.left, x1 = e.x + o.right, y0 = e.y - o.up, y1 = e.y + o.down, cand = [];
        for (let x = x0; x <= x1; x++) cand.push([x, y1 + 1, 8]);
        for (let y = y0; y <= y1; y++) { cand.push([x0 - 1, y, 6]); cand.push([x1 + 1, y, 4]); }
        for (let x = x0; x <= x1; x++) cand.push([x, y0 - 1, 2]);
        for (const [x, y, d] of cand) {
            if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXy(x, y).some(q => q !== e && q.isNormalPriority() && !q.isThrough())) {
                p.locate(x, y); p.setDirection(d); return [x, y];
            }
        }
        return null;
    };
})()`;

// real keys for t.key(): [keyCode, code, key]
const KEYS = {
    Enter: [13, "Enter", "Enter"], Escape: [27, "Escape", "Escape"], Space: [32, "Space", " "], Tab: [9, "Tab", "Tab"], Shift: [16, "ShiftLeft", "Shift"],
    ArrowUp: [38, "ArrowUp", "ArrowUp"], ArrowDown: [40, "ArrowDown", "ArrowDown"], ArrowLeft: [37, "ArrowLeft", "ArrowLeft"], ArrowRight: [39, "ArrowRight", "ArrowRight"],
    F4: [115, "F4", "F4"], F9: [120, "F9", "F9"], "[": [219, "BracketLeft", "["], "]": [221, "BracketRight", "]"], "?": [191, "Slash", "/"]
};
function keyInfo(name) {
    if (KEYS[name]) return KEYS[name];
    if (/^[A-Za-z]$/.test(name)) { const U = name.toUpperCase(); return [U.charCodeAt(0), "Key" + U, name.toLowerCase()]; }
    if (/^[0-9]$/.test(name)) return [48 + Number(name), "Digit" + name, name];
    throw new Error("unknown key: " + name);
}

// event commands for t.run(): a message (face [name, index] or null), a choice, the end
const cmd = {
    text: (face, lines, extra) => [{ code: 101, indent: 0, parameters: [face ? face[0] : "", face ? face[1] : 0, 0, 2, ""] }].concat(lines.map(l => ({ code: 401, indent: 0, parameters: [l] }))).concat(extra || []),
    choice: labels => [{ code: 102, indent: 0, parameters: [labels, labels.length - 1, 0, 2, 0] }].concat(...labels.map((l, i) => [{ code: 402, indent: 0, parameters: [i, l] }, { code: 0, indent: 1, parameters: [] }]), [{ code: 404, indent: 0, parameters: [] }]),
    end: () => [{ code: 0, indent: 0, parameters: [] }]
};

// ---------------------------------------------------------------- the port: a browser left on it (a test killed) is closed first
const getJson = url => new Promise((res, rej) => {
    const rq = http.get(url, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); });
    rq.on("error", rej);
    rq.setTimeout(2000, () => rq.destroy(new Error("timeout")));
});
async function freePort(port) {
    if (process.env.CDP_ATTACH === "1") return true;   // (a tab of tests/run.js's shared browser: that browser stays)
    let v;
    try { v = await getJson(`http://127.0.0.1:${port}/json/version`); } catch (e) { return true; }   // (nothing there)
    try {
        const ws = new WebSocket(v.webSocketDebuggerUrl);
        await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
        ws.send(JSON.stringify({ id: 1, method: "Browser.close" }));
        await sleep(500);
        try { ws.close(); } catch (e) {}
    } catch (e) {}
    for (let i = 0; i < 20; i++) { try { await getJson(`http://127.0.0.1:${port}/json/version`); } catch (e) { return true; } await sleep(250); }
    return false;
}
const portOf = opts => Number(process.env.CDP_PORT) || Number(opts && opts.port) || 9333;

// ---------------------------------------------------------------- fixtures: saves made by the game, kept in tests/fixtures/<name>.json
function fixture(name) {
    const file = path.join(FIXTURES, name.replace(/\.json$/, "") + ".json");
    if (!fs.existsSync(file)) throw new Error("no fixture " + file);
    const fx = JSON.parse(fs.readFileSync(file, "utf8"));
    fx.file = file;
    return fx;
}
function fixtures() {
    return fs.existsSync(FIXTURES) ? fs.readdirSync(FIXTURES).filter(f => /\.json$/.test(f)).map(f => f.replace(/\.json$/, "")) : [];
}

class Test extends Report {
    constructor(b, opts, port) {
        super();
        this.b = b;
        this.opts = opts;
        this.port = port;
        this.plugins = {};
        this.settings = {};
        this.booted = false;
        this.evalTimeout = opts.evalTimeout || 30000;
        this._errMark = 0;
        this.cmd = cmd;
    }

    // ---------------------------------------------------------------- the page
    eval(expr, ms) {
        let timer;
        const limit = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error("evaluate timeout: " + String(expr).slice(0, 100))), ms || this.evalTimeout); });
        return Promise.race([this.b.evaluate(expr), limit]).finally(() => clearTimeout(timer));
    }
    // a value as JSON (a promise is waited for)
    async json(expr, ms) {
        const s = await this.eval("Promise.resolve(" + expr + ").then(v => JSON.stringify(v))", ms);
        return s === undefined ? undefined : JSON.parse(s);
    }
    frames(n) {
        return this.eval(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`, Math.max(this.evalTimeout, n * 100));
    }
    wait(ms) { return sleep(ms); }
    async until(expr, secs = 30, poll = 200) {
        const t0 = Date.now();
        while (Date.now() - t0 < secs * 1000) {
            if (await this.eval(expr).catch(() => false)) return true;
            await sleep(poll);
        }
        return false;
    }
    scene() { return this.eval("SceneManager._scene ? SceneManager._scene.constructor.name : null"); }
    // an expression: the map scene of map `id` is running (no transfer, no scene change)
    onMap(id) {
        return `(SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring()${id ? " && $gameMap.mapId() === " + id : ""})`;
    }
    get idle() { return "(!$gameMap.isEventRunning() && !$gameMessage.isBusy())"; }
    async shot(file) {
        const f = path.isAbsolute(file) ? file : path.join(TESTS, file);
        fs.mkdirSync(path.dirname(f), { recursive: true });
        await this.b.shot(f);
        return f;
    }
    // console errors since the start (or since t.clearErrors())
    errors() { return this.b.logs.slice(this._errMark).filter(l => ERROR_RE.test(l) && !NOISE_RE.test(l)); }
    clearErrors() { this._errMark = this.b.logs.length; }

    // ---------------------------------------------------------------- the boot
    async _boot() {
        await this.b.send("Page.addScriptToEvaluateOnNewDocument", { source: PAGE_SETUP });
        if (this.opts.beforeLoad) await this.b.send("Page.addScriptToEvaluateOnNewDocument", { source: this.opts.beforeLoad });
        const title = "!!(window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && DataManager.isGlobalInfoLoaded())";
        for (let a = 0; a < 4 && !this.booted; a++) {   // (a busy server sometimes leaves the page half-loaded: go again)
            await this.b.send("Page.navigate", { url: GAME });
            this.booted = await this.until(title, 60, 300);
        }
        if (!this.booted) return false;
        await this.injectPlugins(this.opts.plugins || []);
        await this.eval(HOOKS);
        return true;
    }
    // plugins not in js/plugins.js yet: put into the page (a script tag); t.plugins[name] = "registered" / "injected" / "failed".
    // The core (TawernaCore.js, which the newer plugins need) goes in first when it is not registered either.
    async injectPlugins(names) {
        if (names.length && !names.includes("TawernaCore") && fs.existsSync(path.join(TESTS, "..", "js", "plugins", "TawernaCore.js"))) names = ["TawernaCore"].concat(names);
        for (const name of names) {
            this.plugins[name] = await this.eval(`new Promise(res => { if ($plugins.some(p => p.name === ${js(name)} && p.status)) return res("registered");
                const s = document.createElement("script"); s.src = "js/plugins/" + ${js(name)} + ".js?" + Date.now();
                s.onload = () => res("injected"); s.onerror = () => res("failed"); document.body.appendChild(s); })`);
            if (this.plugins[name] === "failed") console.log("NOTE " + name + ".js did not load into the page");
        }
        return this.plugins;
    }
    async toTitle() {
        await this.eval("(function(){ if (window.__drv) window.__drv.on = false; if (!(SceneManager._scene instanceof Scene_Title)) SceneManager.goto(Scene_Title); return 0; })()");
        return this.until("SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && !SceneManager.isSceneChanging()", 30);
    }

    // ---------------------------------------------------------------- a new game
    // o: story (grandpa's house, Map019 2,5 - the story begins), map/x/y/dir (else Map003 22,14 - an old-style game without the
    // story), hour, day, skipIntro, deadline (false: no end of the game), calm (no storm today, default on), needsOff (default on),
    // quiet (all that moves by itself off, see QUIET), minimap (false: hidden), settle (frames after the map is up, default 30),
    // fade (false: the scene's own fade-in)
    async newGame(o = {}) {
        const story = !!o.story;
        const map = o.map || (story ? 19 : 3), x = o.x !== undefined ? o.x : story ? 2 : 22, y = o.y !== undefined ? o.y : story ? 5 : 14, dir = o.dir || 2;
        this.settings = Object.assign({ calm: true, needsOff: true }, o);
        if (!(await this.eval("SceneManager._scene instanceof Scene_Title"))) await this.toTitle();
        // (the story's start set in the page: data/System.json starts in the tavern on purpose)
        const start = story ? `Object.assign($dataSystem, { startMapId: ${map}, startX: ${x}, startY: ${y} }); DataManager.setupNewGame();`
            : `DataManager.setupNewGame(); $gamePlayer.reserveTransfer(${map}, ${x}, ${y}, ${dir}, 0);`;
        await this.eval(`(function(){ ${start} SceneManager.goto(Scene_Map); return 0; })()`);
        if (!(await this.until(this.onMap(map), o.timeout || 60))) {
            console.log("NOTE the new game's map " + map + " did not come up (scene " + (await this.scene().catch(() => "?")) + ")");
            return false;
        }
        await this.frames(o.settle !== undefined ? o.settle : 30);
        if (o.fade !== false) await this.eval("SceneManager._scene.startFadeIn(1, false); 0");
        if (story && (o.skipIntro || o.deadline === false)) {
            await this.eval(`(function(){ if (window.Story) { ${o.skipIntro ? "Story.skipIntro();" : ""} ${o.deadline === false ? "Story.setDeadlineOn(false);" : ""} } return 0; })()`);
        }
        await this.calm();
        if (o.day !== undefined) await this.setDay(o.day);
        if (o.hour !== undefined) await this.setHour(o.hour);
        await this.until("!SceneManager._scene.isFading()", 10, 100);
        await this.frames(2);
        return true;
    }
    // the settings of the new game again (after a transfer, a load): calm, needsOff, quiet, minimap
    calm(o) {
        const s = Object.assign({}, this.settings, o || {}), parts = [];
        if (s.needsOff) parts.push("if (window.Needs && Needs.setEnabled) Needs.setEnabled(false);");
        if (s.calm) parts.push("if (window.Survival && Survival.calmWeather) Survival.calmWeather();");
        if (s.quiet) parts.push(QUIET);
        if (s.minimap === false) parts.push("$gameSystem._minimapHidden = true;");
        return this.eval(`(function(){ ${parts.join(" ")} return 0; })()`);
    }
    quiet() { return this.eval(`(function(){ ${QUIET} return 0; })()`); }
    // a transfer; true when the map is up (the new game's settings applied again)
    async go(map, x, y, dir, o = {}) {
        await this.eval(`(function(){ $gamePlayer.reserveTransfer(${map}, ${x}, ${y}, ${dir || 2}, 0); return 0; })()`);
        const ok = await this.until(this.onMap(map), o.timeout || 40);
        await this.frames(20);
        if (o.fade !== false) await this.eval("SceneManager._scene.startFadeIn(1, false); 0");
        if (o.calm !== false) await this.calm();
        return ok;
    }

    // ---------------------------------------------------------------- input
    // a virtual button (Input's names: ok, cancel, escape, up, shift, drink, keyO...) held for `hold` frames
    async press(button, hold = 3) {
        await this.eval(`(function(){ Input._currentState[${js(button)}] = true; Input._latestButton = ${js(button)}; Input._pressedTime = 0; return 0; })()`);
        await this.frames(hold);
        await this.eval(`(function(){ Input._currentState[${js(button)}] = false; return 0; })()`);
        await this.frames(3);
    }
    hold(button, frames) { return this.press(button, frames); }
    tapOk() { return this.press("ok"); }
    // a real key through the browser (the keyboard handler and the plugins' key maps): "O", "Space", "Escape", "F9"...
    async key(name, hold = 3) {
        const [code, id, key] = keyInfo(name);
        await this.b.send("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, code: id, key });
        await this.frames(hold);
        await this.b.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, code: id, key });
        await this.frames(3);
    }
    mouseMove(x, y) { return this.b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: Math.round(x), y: Math.round(y) }); }
    async click(x, y) {
        await this.mouseMove(x, y);
        await this.b.send("Input.dispatchMouseEvent", { type: "mousePressed", x: Math.round(x), y: Math.round(y), button: "left", clickCount: 1 });
        await this.frames(3);
        await this.b.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: Math.round(x), y: Math.round(y), button: "left", clickCount: 1 });
        await this.frames(3);
    }
    face(dir) { return this.eval(`$gamePlayer.setDirection(${dir}); 0`); }
    locate(x, y, dir) { return this.eval(`(function(){ $gamePlayer.locate(${x}, ${y}); ${dir ? "$gamePlayer.setDirection(" + dir + ");" : ""} return 0; })()`); }

    // ---------------------------------------------------------------- messages and talks
    // event commands run on the map's interpreter (t.cmd.text / choice / end build them)
    run(list, eventId) { return this.eval(`(function(){ $gameMap._interpreter.setup(${js(list)}, ${eventId || 0}); return 0; })()`); }
    // presses through what is on the screen (messages, choices: cancel) until the map is free
    async finish(max = 30) {
        for (let i = 0; i < max && (await this.eval("$gameMessage.isBusy() || $gameMap.isEventRunning() || SceneManager._scene._messageWindow.openness > 0")); i++) {
            if (await this.eval("!!(SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active)")) await this.press("escape");
            else await this.press("ok");
            await this.frames(12);
        }
    }
    // closes what waits for a key after the nights and talks - the day's summary (it opens on the map by itself), a message - as a
    // player would; true when the map is free again
    async dismiss(max = 60) {
        for (let i = 0; i < max; i++) {
            if ((await this.scene()) !== "Scene_Map" || (await this.eval("$gameMessage.isBusy()"))) { await this.press("ok"); await this.frames(10); continue; }
            if (await this.eval("!!$gameTemp._pendingSummary")) { await this.eval("$gameScreen.startFadeIn(1); 0"); await this.frames(10); continue; }
            return true;
        }
        return false;
    }
    // talks to an event (id or an expression): the hero put beside it, the talk driven to its end (picks: the choices, by prefix).
    // o: secs, shotAtChoice (a file: a screenshot at the first choice, then the picks), place (false: the hero stays), keep (the
    // driver stays on). Returns { log: [{ t, who, name, bust, map }], text, choices, missing, waiting, done }
    async talkTo(ev, picks, o = {}) {
        await this.eval(DRIVER + "; 0");
        const e = typeof ev === "number" ? `$gameMap.event(${ev})` : ev;
        await this.eval(`(function(){ const T = window.__drv; T.on = true; T.picks = ${js(o.shotAtChoice ? [] : picks || [])}; T.waiting = null; T.mark = T.log.length; T.cmark = T.choices.length; T.missing = [];
            const e = ${e}; ${o.place === false ? "" : "__standBy(e.eventId());"} e.start(); return 0; })()`);
        await this.frames(4);
        if (o.shotAtChoice) {
            await this.until("!!window.__drv.waiting", 30);
            await this.frames(20);
            await this.shot(o.shotAtChoice);
            await this.eval(`window.__drv.picks = ${js(picks || [])}; 0`);
        }
        const done = await this.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy() && !(window.TavernShift && TavernShift.isRunning()) && SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", o.secs || 30);
        const out = await this.json("({ log: window.__drv.log.slice(window.__drv.mark), choices: window.__drv.choices.slice(window.__drv.cmark), missing: window.__drv.missing, waiting: window.__drv.waiting })");
        if (!o.keep) await this.eval("window.__drv.on = false; 0");
        out.done = done;
        out.text = out.log.map(l => l.t).join(" / ");
        return out;
    }
    // what popped up over the hero (texts) and at the top of the screen since the boot or the last clear
    async popups(o = {}) { const p = await this.json(`window.__kit.pops${o.clear ? ".splice(0)" : ""}`); return p.filter(x => o.gains || !x.gain).map(x => x.text); }
    notices(o = {}) { return this.json(`window.__kit.tops${o.clear ? ".splice(0)" : ""}`); }

    // ---------------------------------------------------------------- the game's state
    setHour(h) { return this.eval(`$gameSystem.setDayNightHour(${h}); 0`); }
    setDay(d, h) { return this.eval(`(function(){ $gameSystem._dayNightDay = ${d}; ${h !== undefined ? "$gameSystem.setDayNightHour(" + h + ");" : ""} return 0; })()`); }
    // the purse: set it to n (or just read it)
    gold(n) { return this.eval(n === undefined ? "$gameParty.gold()" : `$gameParty.gainGold(${n} - $gameParty.gold()); $gameParty.gold()`); }
    give(itemId, n = 1) { return this.eval(`$gameParty.gainItem($dataItems[${itemId}], ${n}); $gameParty.numItems($dataItems[${itemId}])`); }
    count(itemId) { return this.eval(`$gameParty.numItems($dataItems[${itemId}])`); }

    // ---------------------------------------------------------------- saves
    // as the save screen does (slot 0 is the autosave's)
    saveTo(slot = 1) {
        return this.eval(`(async function(){ ${slot > 0 ? "$gameSystem.setSavefileId(" + slot + ");" : ""} $gameSystem.onBeforeSave(); await DataManager.saveGame(${slot}); return true; })()`, 60000);
    }
    // as the load screen does (from the title); true when the saved map is up. o: calm, needsOff, quiet (default: the save as it is)
    async loadFrom(slot = 1, o = {}) {
        await this.toTitle();
        const map = await this.eval(`(async function(){ await DataManager.loadGame(${slot}); $gameSystem.onAfterLoad();
            if ($gameSystem.versionId() !== $dataSystem.versionId) { $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), 0); $gamePlayer.requestMapReload(); }
            SceneManager.goto(Scene_Map); return $gamePlayer.isTransferring() ? $gamePlayer.newMapId() : $gameMap.mapId(); })()`, 60000);
        const ok = await this.until(this.onMap(map), o.timeout || 60);
        await this.frames(o.settle !== undefined ? o.settle : 20);
        if (o.fade !== false) await this.eval("SceneManager._scene.startFadeIn(1, false); 0");
        this.settings = Object.assign({}, o);
        await this.calm();
        await this.until("!SceneManager._scene.isFading()", 10, 100);
        return ok;
    }
    // a fixture (kit.fixture: a save made by the game) written into a slot as it was saved, then loaded
    async loadFixture(name, o = {}) {
        const fx = typeof name === "string" ? fixture(name) : name, slot = o.slot || 1;
        if (!(await this.eval("SceneManager._scene instanceof Scene_Title"))) await this.toTitle();
        await this.eval(`(async function(){ const zip = await StorageManager.jsonToZip(${js(JSON.stringify(fx.save))}); await StorageManager.saveZip(DataManager.makeSavename(${slot}), zip);
            DataManager._globalInfo[${slot}] = Object.assign(${js(fx.info || {})}, { timestamp: Date.now() }); DataManager.saveGlobalInfo(); return true; })()`, 60000);
        return this.loadFrom(slot, o);
    }
    // the game saved (as the save screen would) and kept as tests/fixtures/<name>.json - the exact text the game stored
    async saveFixture(name, meta = {}) {
        const slot = meta.slot || 1;
        await this.saveTo(slot);
        const r = await this.json(`(async function(){ const text = await StorageManager.zipToJson(await StorageManager.loadZip(DataManager.makeSavename(${slot})));
            const F = window.Farming && Farming.farm ? Farming.farm() : null, bl = F && F.buildings ? Object.values(F.buildings).reduce((a, l) => a.concat(l || []), []) : [];
            return { text, info: DataManager.savefileInfo(${slot}), versionId: $dataSystem.versionId, summary: { day: $gameSystem.dayNightDay(), hour: +$gameSystem.dayNightHour().toFixed(2),
                map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, gold: $gameParty.gold(), items: $gameParty.items().length, story: !!$gameSystem._story,
                buildings: bl.filter(b => !b.site).map(b => b.type), dog: !!(window.Dog && Dog.state && Dog.state().tame), level: window.Combat && Combat.hero ? Combat.hero().level : null,
                reputation: window.QuestBoard ? QuestBoard.reputation() : null } }; })()`, 60000);
        let commit = "";
        try { commit = execSync("git rev-parse --short HEAD", { cwd: TESTS, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch (e) {}
        const head = { name, desc: meta.desc || "", made: new Date().toISOString(), commit, versionId: r.versionId, summary: r.summary, info: r.info, save: "__SAVE__" };
        fs.mkdirSync(FIXTURES, { recursive: true });
        const file = path.join(FIXTURES, name + ".json");
        fs.writeFileSync(file, JSON.stringify(head, null, 2).replace('"__SAVE__"', () => r.text) + "\n");
        return { file, bytes: fs.statSync(file).size, summary: r.summary };
    }

    // ---------------------------------------------------------------- the end
    // o.errorCheck: a name - the console errors are a check of that name (pass or fail); false - only the "console errors:" line;
    // default - the line, and a failed "no console errors" check when there are any
    async done(o = {}) {
        const errs = this.errors(), ec = o.errorCheck !== undefined ? o.errorCheck : this.opts.errorCheck;
        if (typeof ec === "string") this.check(ec, errs.length === 0, errs.slice(-6));
        else {
            console.log("console errors:", errs.length ? JSON.stringify(errs.slice(-5)) : "none");
            if (errs.length && ec !== false) this.check("no console errors", false, errs.slice(-6));
        }
        const retries = await this.eval("window.__kit ? window.__kit.retries.length : 0", 5000).catch(() => 0);
        if (retries) console.log("NOTE the Retry button was pressed " + retries + "x (files the server did not deliver at once)");
        const ok = this.summary();
        await this.b.close();
        process.exit(ok ? 0 : 1);
    }
}

// opts: port, width, height, dpr, plugins (put into the page when not registered), overlay (GAME_OVERLAY), profile, beforeLoad (a
// script run in the page before the game's own), bootCheck (a name: "the game boots" as a check), errorCheck (see done), evalTimeout
async function open(opts = {}) {
    const port = portOf(opts);
    process.env.CDP_PORT = String(port);
    await freePort(port);
    const { launch } = require("../cdp.js");
    const b = await launch({ port, width: opts.width || 1280, height: opts.height || 720, dpr: opts.dpr || 1, overlay: opts.overlay, profile: opts.profile });
    const t = new Test(b, opts, port);
    const booted = await t._boot().catch(e => { console.log("NOTE boot: " + e.message); return false; });
    if (opts.bootCheck) t.check(opts.bootCheck, booted);
    else if (!booted) t.error(new Error("BOOT FAILED: the title screen did not come"));
    return t;
}

// the whole test: open, the body, done (an exception: ERR and a failed result)
async function test(opts, body) {
    if (typeof opts === "function") { body = opts; opts = {}; }
    let t;
    try { t = await open(opts); }
    catch (e) {
        const r = new Report();
        console.log("BOOT FAILED", e.message);
        r.error(e);
        r.summary();
        process.exit(1);
    }
    if (t.booted) {
        try { await body(t); } catch (e) { t.error(e); }
    }
    await t.done();
}

module.exports = { open, test, fixture, fixtures, freePort, portOf, cmd, sleep, TESTS, FIXTURES, QUIET, DRIVER, Test };
