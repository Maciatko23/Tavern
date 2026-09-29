// Life in grandpa's house (HomeLife.js): grandpa Stach's day in a story game (the cauldron at 8, pottering at 11, rocking in his chair
// at 15, the pipe with smoke rings at 19, asleep in bed with "Zzz" at 23), talking to him wherever he is (him, the chair, the wheel in
// front of it, the bed), the chair and grandpa rocking together, the wheel turning and the churn's plunger going, the pipe taken from
// its table; the soup from the cauldron once a day; the cat Mruczek (it sleeps by the hearth, walks, jumps on the sill, purrs on O
// with a rest bonus once a day); the hero never blocked and the doorway free; an old-style game (no story) with the cat and no grandpa;
// a save made before the cat came gets it. (The test kit puts TawernaCore.js - HomeLife.js is built on it - then HomeAmbience.js,
// HomeDecor.js and HomeLife.js into the page when js/plugins.js does not have them.)
// Screenshots: docs/dom_dziadka/zycie_dziadek_*.png, GIF docs/dom_dziadka/dziadek_bujany.gif
//   CDP_PORT=9392 node tests/home_life_test.js
const kit = require("./lib/kit.js");
const sleep = kit.sleep;
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const SHOTS = path.join(__dirname, "..", "docs", "dom_dziadka");
const ONLY = process.env.ONLY || "";
const SIBLINGS = process.env.SIBLINGS !== "0";   // (SIBLINGS=0: HomeLife alone, without HomeAmbience.js / HomeDecor.js)

// the talk driver (as in story_test.js): logs every message with the one it is drawn over, presses O on messages while on
const DRIVER = String.raw`
(function() {
    if (window.__drv) return;
    const T = window.__drv = { on: false, f: 0, log: [] };
    const _startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() {
        _startMessage.call(this);
        const b = this._bubbleOf;
        T.log.push({ t: $gameMessage.allText().replace(/ /g, " "), who: b ? (b === $gamePlayer ? 0 : b.eventId()) : null });
    };
    const _update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        if (T.on) {
            const I = Input._currentState, mw = this._messageWindow;
            I.ok = false;
            T.f++;
            if ($gameMessage.hasText() && !$gameMessage.isChoice() && mw && mw.isOpen() && T.f % 4 === 0) I.ok = true;
        }
        _update.call(this);
    };
    // the watch: every frame, is grandpa or the cat standing in the doorway, on the hero's feet
    const M = window.__mon = { frames: 0, door: [], onHero: [], catDoor: [] };
    const _upd2 = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _upd2.call(this);
        if (!window.HomeLife || !$gameMap || $gameMap.mapId() !== 19) return;
        const L = HomeLife.layout(), g = $gameMap.event(901), c = $gameMap.event(960), feet = $gamePlayer.feetTiles ? $gamePlayer.feetTiles() : [{ x: $gamePlayer.x, y: $gamePlayer.y }];
        M.frames++;
        if (g && L.doorZone(g.x, g.y) && !g.isMoving()) M.door.push([g.x, g.y]);
        if (g && !g.isThrough() && feet.some(t => t.x === g.x && t.y === g.y)) M.onHero.push([g.x, g.y]);
        if (c && L.doorZone(c.x, c.y)) M.catDoor.push([c.x, c.y]);
    };
    // the popups over the hero
    window.__pops = [];
    const _pushLoot = Game_Temp.prototype.pushLootPopup;
    Game_Temp.prototype.pushLootPopup = function(icon, text, color, opts) { if (!opts || !opts.gain) window.__pops.push(text); return _pushLoot.apply(this, arguments); };
    // the sounds played
    window.__se = [];
    const _playSe = AudioManager.playSe;
    AudioManager.playSe = function(se) { window.__se.push(se.name); return _playSe.call(this, se); };
    // (and the ones through the core's safe pool - HomeLife.js's purr and snore since 2026-09-28)
    if (window.Tawerna && Tawerna.audio && !Tawerna.audio.__rec) {
        const _se = Tawerna.audio.se;
        Tawerna.audio.se = function(name) { window.__se.push(name); return _se.apply(this, arguments); };
        Tawerna.audio.__rec = true;
    }
})();
`;

// (SIBLINGS=0: the kit still puts TawernaCore.js in first - HomeLife.js needs it)
const PLUGINS = SIBLINGS ? ["TawernaUI", "HomeAmbience", "HomeDecor", "HomeLife"] : ["HomeLife"];
kit.test({ port: 9392, plugins: PLUGINS, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const b = t.b;
    const ev = e => t.eval(e);
    const J = e => t.json(e);
    const check = (name, ok, info) => t.check(name, ok, info);
    const frames = n => t.frames(n);
    const until = (cond, secs) => t.until(cond, secs, 200);
    const onMap = id => `(SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && $gameMap.mapId() === ${id})`;
    const calmMap = "(!$gameMap.isEventRunning() && !$gameMessage.isBusy())";
    const quiet = "(function(){ if (window.Needs) Needs.setEnabled(false); if (window.Hunting) { Hunting.auto(false); if (Hunting.RAID) Hunting.RAID.perHour = 0; } if (window.Livestock) Livestock.auto(false); if (window.Dog) Dog.auto(false); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather(); $gameSystem._minimapHidden = true; if (window.Story) Story.setDeadlineOn(false); return 0; })()";
    const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(3); await ev(`Input._currentState.${k} = false; 0`); await frames(2); };
    // a close-up beside a picture: the part of the screen round a sprite (the character of `evExpr`), twice as big, whole pixels
    const closeup = async (name, evExpr, w, h, up) => {
        const box = await J(`(function(){ const ch = ${evExpr}, s = SceneManager._scene._spriteset._characterSprites.find(o => o._character === ch); if (!s) return null;
            const r = s.getBounds(), cx = r.x + r.width / 2, bottom = r.y + r.height;
            const x = Math.max(0, Math.min(Graphics.width - ${w}, Math.round(cx - ${w} / 2))), y = Math.max(0, Math.min(Graphics.height - ${h}, Math.round(bottom - ${h} + ${up || 0})));
            return { x, y }; })()`);
        if (!box) return false;
        const r = await b.send("Page.captureScreenshot", { format: "png", clip: { x: box.x, y: box.y, width: w, height: h, scale: 1 } });
        const tmp = path.join(os.tmpdir(), "home_closeup_" + Date.now() + ".png");
        fs.writeFileSync(tmp, Buffer.from(r.data, "base64"));
        try { execFileSync("python", [path.join(__dirname, "..", "tools", "homelife", "closeup.py"), tmp, path.join(SHOTS, name), "2"], { stdio: "ignore" }); } catch (e) { console.log("closeup:", e.message); }
        try { fs.rmSync(tmp); } catch (e) {}
        return true;
    };
    // (a picture waits for the notices at the top of the screen to go - a few seconds at most)
    const shot = async (f, noBarks) => {
        await until("!($gameTemp._topNotices || []).length && !(SceneManager._scene._topNotice && SceneManager._scene._topNotice.visible && SceneManager._scene._topNotice.opacity > 0)", 12);
        if (noBarks) await until("!SpeechBubbles.barks.length", 12);   // (and, when asked, for a bark over someone to be over)
        return b.shot(path.join(SHOTS, f));
    };
    const setHour = async h => { await ev(`(function(){ $gameSystem.setDayNightHour(${h}); return 0; })()`); await frames(12); };
    const G = () => J("HomeLife.grandpaState()");
    const K = () => J("HomeLife.catState()");
    const toTitle = async () => {
        await ev("(function(){ window.__drv.on = false; if (!(SceneManager._scene instanceof Scene_Title)) SceneManager.goto(Scene_Title); return 0; })()");
        return until("SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && !SceneManager.isSceneChanging()", 30);
    };
    const newGame = async (map, x, y) => {
        await toTitle();
        await ev(`(function(){ window.__drv.on = false; Object.assign($dataSystem, { startMapId: ${map}, startX: ${x}, startY: ${y} }); DataManager.setupNewGame(); SceneManager.goto(Scene_Map); return 0; })()`);
        const ok = await until(onMap(map), 40);
        await ev(quiet);
        return ok;
    };
    // the hero stands at (x, y) facing dir, presses O; returns what was said (the talk runs to its end)
    const talkFrom = async (x, y, dir) => {
        await ev(`(function(){ const T = window.__drv; T.on = false; T.mark = T.log.length; Input.clear(); $gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${dir}); return 0; })()`);
        await frames(8);
        await press("ok");
        const started = await until("$gameMap.isEventRunning()", 5);
        await ev("window.__drv.on = true; 0");
        const done = await until(`!$gameMap.isEventRunning() && !$gameMessage.isBusy() && SceneManager._scene._messageWindow.openness === 0`, 30);
        await ev("window.__drv.on = false; 0");
        const log = await J("window.__drv.log.slice(window.__drv.mark)");
        return { started, done, log, text: log.map(l => l.t).join(" / "), who: log.map(l => l.who) };
    };
    // an action that runs at once (the cauldron, the cat): the hero at (x, y) facing dir presses O
    const actAt = async (x, y, dir) => {
        await ev(`(function(){ window.__drv.on = false; Input.clear(); $gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${dir}); return 0; })()`);
        await frames(8);
        await press("ok");
        await frames(4);
    };
    // every walkable cell reachable from the doorway's landing with grandpa (and the cat) where they stand
    const reach = () => J(`(function(){
        const L = HomeLife.layout(), g = $gameMap.event(901), W = L.W, H = L.H, seen = new Set(), door = L.ev.door;
        const block = (x, y) => !L.ok(x, y) || (g && !g.isThrough() && g.x === x && g.y === y);
        const start = [door.x, door.y - 1], q = [start]; seen.add(start.join());
        while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy, k = nx + "," + ny; if (!seen.has(k) && !block(nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
        const miss = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!block(x, y) && !seen.has(x + "," + y)) miss.push([x, y]);
        return { miss, g: g ? [g.x, g.y] : null };
    })()`);
    fs.mkdirSync(SHOTS, { recursive: true });
    {
        // the house's other two plugins (HomeLife works with or without them): the steam, the fire and the window views of
        // HomeAmbience.js, the decorations of HomeDecor.js - put into the page by the kit, after the core (TawernaCore.js)
        t.clearErrors();   // (a half-loaded first page may have logged its own errors)
        console.log("(the house plugins: " + JSON.stringify(t.plugins) + ")");
        const loaded = t.plugins.HomeLife;
        check("HomeLife.js loads into the page", (loaded === "registered" || loaded === "injected") && (await ev("!!window.HomeLife")));
        await ev(DRIVER + "; 0");
        // (HomeAmbience.js may not be there yet: a stand-in notes the steam asked for)
        await ev("window.__steam = []; if (!window.HomeAmbience) window.HomeAmbience = { setSteam(l) { window.__steam.push(l); }, stub: true }; else { const f = HomeAmbience.setSteam; HomeAmbience.setSteam = function(l) { window.__steam.push(l); return f ? f.apply(this, arguments) : undefined; }; } 0");

        // ================= 1. a new story game in grandpa's house: the intro first, grandpa stays where Story put him
        const started = await newGame(19, 2, 5);
        await frames(20);
        const g0 = await J("(function(){ const e = $gameMap.event(901); return e && { x: e.x, y: e.y, intro: Story.state().intro, key: HomeLife.grandpaState().key }; })()");
        check("a new story game: grandpa at Story's spot (10,6) and still during the intro", started && g0 && g0.x === 10 && g0.y === 6 && g0.key === "intro", g0);
        await ev("Story.skipIntro(); 0");
        await until(calmMap, 10);
        await ev(quiet);
        await frames(300);   // (the notices of the start fade away before the pictures)
        const cat0 = await J("(function(){ const e = $gameMap.event(960); return e && { name: e.event().name, sheet: e.characterName(), through: e.isThrough(), prio: e.isNormalPriority(), st: HomeLife.catState() }; })()");
        check("the cat Mruczek is there (event 960, $Animal_Cat, never in the way), asleep by the hearth", cat0 && cat0.name === "Mruczek" && cat0.sheet === "$Animal_Cat" && cat0.through && cat0.prio &&
            cat0.st.spot === "hearth" && cat0.st.pose === "sleep" && cat0.st.x === 8 && cat0.st.y === 5, cat0);

        if (!ONLY || ONLY === "day") {   // (ONLY=cat: just the cat and what follows, for a quick run)
        // ================= 2. his day
        // 8:00 - the cauldron
        await setHour(8);
        let gs = await G();
        check("8:00 - at the cauldron (10,5), stirring (facing the hearth)", gs.key === "cook" && gs.pose === "stir" && gs.x === 10 && gs.y === 5, gs);
        const steam = await J("window.__steam.slice()");
        check("the soup cooks: HomeAmbience.setSteam(1) asked for", steam.includes(1), steam);
        const stirFrames = await J(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(o => o._character === $gameMap.event(901)); return { name: s._characterName, f: [s._frame.x, s._frame.y] }; })()`);
        await frames(20);
        const stirFrames2 = await J(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(o => o._character === $gameMap.event(901)); return { name: s._characterName, f: [s._frame.x, s._frame.y] }; })()`);
        check("stirring: his home sheet, the frames move", stirFrames.name === "Npc_Dziadek_Home" && stirFrames.f[1] === 128 && stirFrames.f[0] !== stirFrames2.f[0], [stirFrames, stirFrames2]);
        await ev("$gamePlayer.locate(9, 7); $gamePlayer.setDirection(8); 0");
        await frames(40);
        await shot("zycie_dziadek_rano_kociol.png");
        await closeup("zycie_dziadek_rano_kociol_zblizenie.png", "$gameMap.event(901)", 300, 190, 30);
        let tk = await talkFrom(10, 6, 8);
        check("talking to him at the cauldron (O on him): Story's talk over him", tk.started && tk.done && tk.log.length >= 1 && tk.who.every(w => w === 901), tk.text.slice(0, 120));
        // the soup
        await ev("HomeLife.state().soupDay = -1; window.__barks0 = SpeechBubbles.log.length; 0");
        await setHour(7);
        const soupN = () => ev("$gameParty.numItems($dataItems[131])");
        let n0 = await soupN();
        await actAt(9, 5, 8); await frames(10);
        let n1 = await soupN();
        let barks = await J("SpeechBubbles.log.slice(-2)");
        check("7:00 - the soup is not ready: nothing from the cauldron, grandpa says to wait", n1 === n0 && barks.some(t => /nie doszła|ósmej/.test(t)), { n0, n1, barks });
        await setHour(8.5);
        await actAt(9, 5, 8); await frames(10);
        let n2 = await soupN();
        barks = await J("SpeechBubbles.log.slice(-2)");
        check("8:30 - O at the cauldron: a bowl of Kapuśniak (item 131), grandpa: 'Nalej sobie, póki gorący!'", n2 === n1 + 1 && barks.some(t => /póki gorący|Jedz, jedz|Borgarowi/.test(t)), { n1, n2, barks });
        await frames(20);
        await actAt(9, 5, 8); await frames(10);
        let n3 = await soupN();
        barks = await J("SpeechBubbles.log.slice(-1)");
        check("the same day again: no second bowl (grandpa jokes the pot is empty)", n3 === n2 && /Wyjadłeś|pusty|Dno/.test(barks[0] || ""), { n3, barks });

        // 9:30 - the butter churn: its plunger goes up and down while he churns
        await setHour(9.5);
        gs = await G();
        const churnLook = () => J(`(function(){ const c = HomeLife.layout().ev.churn, s = SceneManager._scene._spriteset._characterSprites.find(o => o._character === c); return { name: s._characterName, fx: s._frame.x, fy: s._frame.y }; })()`);
        const ch1 = await churnLook();
        await frames(13);
        const ch2 = await churnLook();
        check("9:30 - at the butter churn (facing it), the plunger bobs", gs.key === "churn" && gs.pose === "churn" && ch1.name === "!$House_Churn" && (ch1.fx !== ch2.fx || ch1.fy !== ch2.fy), { gs, ch1, ch2 });

        // 11:00 - pottering
        await setHour(11);
        gs = await G();
        const potter = await J("HomeLife.activityAt(11)");
        const st11 = await J(`HomeLife.targetOf(${JSON.stringify(potter)})`);
        check("11:00 - pottering (shelves / window / chest / dresser) at that spot", ["shelves", "window", "chest", "kredens"].includes(gs.key) && gs.key === potter && gs.x === st11.x && gs.y === st11.y && gs.pose === "fiddle", { gs, st11 });
        const adj = await J(`(function(){ const g = $gameMap.event(901), L = HomeLife.layout(); for (const [dx, dy, d] of [[0,1,8],[1,0,4],[-1,0,6],[0,-1,2]]) { const x = g.x + dx, y = g.y + dy; if (L.ok(x, y)) return [x, y, d]; } return null; })()`);
        tk = await talkFrom(adj[0], adj[1], adj[2]);
        check("talking to him while he potters", tk.started && tk.done && tk.who.every(w => w === 901) && tk.log.length >= 1, tk.text.slice(0, 100));

        // 12:30 - at the spinning wheel: the wheel turns (the user took the wheel out of the house on 2026-09-29: then he rocks)
        await setHour(12.5);
        gs = await G();
        const hasWheel = await J("!!HomeLife.layout().ev.wheel");
        if (!hasWheel) check("12:30 - no spinning wheel in the house: he rocks in his chair instead", gs.key === "rock" && gs.seat === "chair" && gs.pose === "rock", gs);
        else {
        const wheel = await J(`(function(){ const w = HomeLife.layout().ev.wheel, s = SceneManager._scene._spriteset._characterSprites.find(o => o._character === w); return { name: s._characterName, fx: s._frame.x, fy: s._frame.y }; })()`);
        await frames(16);
        const wheel2 = await J(`(function(){ const w = HomeLife.layout().ev.wheel, s = SceneManager._scene._spriteset._characterSprites.find(o => o._character === w); return { name: s._characterName, fx: s._frame.x, fy: s._frame.y }; })()`);
        check("12:30 - spinning: seated in the chair behind the wheel, the wheel turns", gs.key === "spin" && gs.seat === "chair" && gs.pose === "sit" && wheel.name === "!$House_Wheel" && (wheel.fx !== wheel2.fx || wheel.fy !== wheel2.fy), { gs, wheel, wheel2 });
        }

        // 15:00 - rocking
        await setHour(15);
        gs = await G();
        const chairAt = await J("[HomeLife.layout().chair.x, HomeLife.layout().chair.y]");
        const rock = [];
        for (let i = 0; i < 8; i++) {   // (8 looks 22 frames apart: most of one swing there and back)
            rock.push(await J(`(function(){ const set = SceneManager._scene._spriteset, c = set._characterSprites.find(o => o._character === HomeLife.layout().ev.chair), g = set._characterSprites.find(o => o._character === $gameMap.event(901)); return { c: +c.rotation.toFixed(4), g: +g.rotation.toFixed(4) }; })()`));
            await frames(22);
        }
        check("15:00 - rocking in his chair (on the chair's cell)", gs.key === "rock" && gs.pose === "rock" && gs.seat === "chair" && gs.x === chairAt[0] && gs.y === chairAt[1], { gs, chairAt });
        check("the chair and grandpa rock together (the same swing, back and forth)", rock.every(r => r.c === r.g) && Math.max(...rock.map(r => r.c)) > 0.01 && Math.min(...rock.map(r => r.c)) < -0.01, rock);
        await ev(`$gamePlayer.locate(${chairAt[0] + 2}, ${chairAt[1] + 2}); $gamePlayer.setDirection(4); HomeLife.catGo("feet"); 0`);
        await until("HomeLife.catState().cur === 'stay' || HomeLife.catState().cur === 'stayFeet' || HomeLife.catState().cur === 'curl'", 25);
        const catFeet = await K();
        check("the cat comes to sit at his feet (beside the chair, or diagonally in front of it when the sides are taken - never straight in front)", Math.abs(catFeet.x - chairAt[0]) === 1 && (catFeet.y === chairAt[1] || catFeet.y === chairAt[1] + 1), catFeet);
        await frames(30);
        await shot("zycie_dziadek_popoludnie_bujany.png");
        await closeup("zycie_dziadek_popoludnie_bujany_zblizenie.png", "HomeLife.layout().ev.chair", 260, 200, 60);
        // the GIF: frames of the chair while he rocks (and the cat by him)
        const box = await J(`(function(){ const set = SceneManager._scene._spriteset, c = set._characterSprites.find(o => o._character === HomeLife.layout().ev.chair), r = c.getBounds(); const z = $gameScreen.zoomScale(), w = Math.round(230 * z), h = Math.round(200 * z); return { x: Math.round(r.x + r.width / 2 - w / 2 + 15 * z), y: Math.round(r.y + r.height - h + 50 * z), w, h }; })()`);
        const gifDir = fs.mkdtempSync(path.join(os.tmpdir(), "home_gif_"));
        const counts = [];
        // (the game's clock held and stepped by hand: 4 game frames between two pictures - the GIF loops smoothly)
        const perSwing = await ev("HomeLife.ROCK.period");
        const n = Math.round(perSwing / 4);   // (one whole swing: the GIF loops on it - the fire's light flickers over every pixel, so every frame weighs)
        await ev("Graphics._app.ticker.stop(); 0");
        try {
            for (let i = 0; i < n; i++) {
                counts.push(await ev("(function(){ for (let k = 0; k < 4; k++) Graphics._onTick(1); return Graphics.frameCount; })()"));
                const r = await b.send("Page.captureScreenshot", { format: "png", clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 1 } });
                fs.writeFileSync(path.join(gifDir, "f_" + String(i).padStart(3, "0") + ".png"), Buffer.from(r.data, "base64"));
            }
        } finally { await ev("Graphics._app.ticker.start(); 0"); }
        fs.writeFileSync(path.join(gifDir, "frames.json"), JSON.stringify(counts));
        let gifOk = false;
        try {
            execFileSync("python", [path.join(__dirname, "..", "tools", "homelife", "make_gif.py"), gifDir, path.join(SHOTS, "dziadek_bujany.gif")], { stdio: "inherit" });
            gifOk = fs.existsSync(path.join(SHOTS, "dziadek_bujany.gif"));
        } catch (e) { console.log("gif:", e.message); }
        try { fs.rmSync(gifDir, { recursive: true, force: true }); } catch (e) {}
        check("the rocking GIF is made (docs/dom_dziadka/dziadek_bujany.gif): one whole swing, looping", gifOk && counts[counts.length - 1] - counts[0] >= perSwing - 8, { frames: counts.length, span: counts[counts.length - 1] - counts[0] });
        // talking to him in the chair: O on the chair, O on the wheel in front of it
        tk = await talkFrom(chairAt[0] + 1, chairAt[1], 4);
        check("talking to him in the chair (O on the chair)", tk.started && tk.done && tk.who.every(w => w === 901) && tk.log.length >= 1, tk.text.slice(0, 100));
        const front = await J("HomeLife.layout().chair.front");
        tk = await talkFrom(front[0], front[1] + 1, 8);
        check(hasWheel ? "talking to him over the spinning wheel (O on the wheel in front of the chair)" : "talking to him from in front of his chair (O on the cell in front of it)", tk.started && tk.done && tk.who.every(w => w === 901) && tk.log.length >= 1, tk.text.slice(0, 100));
        gs = await G();
        check("after the talk he still sits and rocks", gs.seat === "chair" && gs.pose === "rock", gs);

        // 18:00 - he gets up, takes his pipe from the little table, sits down again; the hero stands in his way meanwhile
        await setHour(17.99);
        await frames(10);
        const pipeStand = await J("HomeLife.layout().st.pipeTable");
        const way = await J(`HomeLife.findPath(${chairAt[0] + 1}, ${chairAt[1]}, [[${pipeStand.x}, ${pipeStand.y}]], { who: "grandpa" })`);
        const mid = way[Math.floor(way.length / 2)];
        await ev(`$gamePlayer.locate(${mid[0]}, ${mid[1]}); $gamePlayer.setDirection(2); window.__mon.onHero = []; 0`);
        const pipeVisible = () => J(`(function(){ const p = HomeLife.layout().ev.pipe, s = SceneManager._scene._spriteset._characterSprites.find(o => o._character === p); return s.visible; })()`);
        const pv0 = await pipeVisible();
        // (the clock runs on: from 17:59 to 18:00 takes a second)
        const went = await until("HomeLife.grandpaState().key === 'pipe' && HomeLife.grandpaState().cur === 'go'", 20);
        await frames(200);
        const midSt = await G();
        // the hero steps away after a while (he is not stuck either)
        const heroY0 = await ev("$gamePlayer._realY");
        await ev("Input._currentState.down = true; 0");
        await frames(40);
        await ev("Input._currentState.down = false; 0");
        const heroY1 = await ev("$gamePlayer._realY");
        const seatedAgain = await until("HomeLife.grandpaState().pose === 'smoke' && HomeLife.grandpaState().seat === 'chair'", 60);
        gs = await G();
        const pv1 = await pipeVisible();
        const mon = await J("window.__mon");
        check("18:00 - he walks to the table for his pipe and back to his chair, smoking (the pipe is gone from the table)", went && seatedAgain && gs.pipe && pv0 === true && pv1 === false, { went, seatedAgain, gs, pv0, pv1, midSt });
        check("the hero in his way: grandpa never walks into him (waits or goes round), the hero can still move", mon.onHero.length === 0 && heroY1 > heroY0 + 0.3, { onHero: mon.onHero.slice(0, 5), heroY0, heroY1, mid });

        // 19:00 - the pipe: puffs and rings
        await setHour(19);
        gs = await G();
        await ev(`$gamePlayer.locate(${chairAt[0] + 2}, ${chairAt[1] + 2}); $gamePlayer.setDirection(4); 0`);
        const ringsSeen = await until("HomeLife.fx.some(f => f.kind === 'ring')", 20);
        const puffsSeen = await until("HomeLife.fx.some(f => f.kind === 'puff')", 20);
        check("19:00 - in the chair with his pipe: smoke puffs and smoke rings drift up", gs.key === "pipe" && gs.pose === "smoke" && ringsSeen && puffsSeen, { gs, ringsSeen, puffsSeen });
        const ringFx = await J("HomeLife.fx.filter(f => f.kind === 'ring')");
        await frames(30);
        const ringFx2 = await J("HomeLife.fx.filter(f => f.kind === 'ring')");
        check("the rings rise (drifting up and fading)", ringFx.length && ringFx2.length && Math.min(...ringFx2.map(f => f.y)) < Math.min(...ringFx.map(f => f.y)), { a: ringFx.slice(0, 2), b: ringFx2.slice(0, 2) });
        // (a ring in the air for the picture)
        await until("HomeLife.fx.filter(f => f.kind === 'ring').length >= 2", 20);
        await frames(20);
        await shot("zycie_dziadek_wieczor_fajka.png");
        await closeup("zycie_dziadek_wieczor_fajka_zblizenie.png", "HomeLife.layout().ev.chair", 240, 210, 60);
        tk = await talkFrom(chairAt[0] + 1, chairAt[1], 4);
        check("talking to him while he smokes", tk.started && tk.done && tk.who.every(w => w === 901), tk.text.slice(0, 100));

        // 23:00 - asleep
        await setHour(23);
        gs = await G();
        const bed = await J("HomeLife.layout().bed");
        const sleeper = await J(`(function(){ const s = SceneManager._scene._spriteset._homeSleeper; return { visible: s.visible, name: s.bitmap && s.bitmap.url, pipe: HomeLife.state().pipe }; })()`);
        check("23:00 - asleep in his bed: his sprite hidden, the sleeper under the quilt shown, the pipe back on its table", gs.key === "sleep" && gs.pose === "sleep" && gs.seat === "bed" && gs.opacity === 0 && gs.x === bed.x && gs.y === bed.y &&
            sleeper.visible && /Home_Sleeper/.test(sleeper.name || "") && !sleeper.pipe && await pipeVisible(), { gs, sleeper });
        await ev(`$gamePlayer.locate(${bed.exits[0][0]}, ${bed.exits[0][1] + 2}); $gamePlayer.setDirection(8); window.__se.length = 0; 0`);
        const zSeen = await until("HomeLife.fx.some(f => f.kind === 'z')", 10);
        check("'Zzz' floats up over the bed", zSeen);
        await until("HomeLife.fx.filter(f => f.kind === 'z').length >= 2", 10);
        await frames(20);
        // (his bed is in the room's top right corner, under the goal panel: the panel steps aside for the picture)
        await ev("(function(){ const t = SceneManager._scene._goalTracker; if (t) { window.__gtV = t.visible; t.visible = false; t.update = function() {}; } return 0; })()");
        await frames(2);
        await shot("zycie_dziadek_noc_zzz.png");
        await closeup("zycie_dziadek_noc_zzz_zblizenie.png", "HomeLife.layout().ev.quilt", 260, 190, 20);
        await ev("(function(){ const t = SceneManager._scene._goalTracker; if (t) { delete t.update; t.visible = window.__gtV !== false; } return 0; })()");
        // the snore: only near the bed
        await ev(`$gamePlayer.locate(${bed.exits[0][0]}, ${bed.exits[0][1]}); window.__se.length = 0; 0`);
        const snored = await until("window.__se.includes('Breath')", 16);
        await ev("$gamePlayer.locate(2, 9); window.__se.length = 0; 0");
        await frames(60 * 14);
        const farSnore = await J("window.__se.filter(n => n === 'Breath').length");
        check("a quiet snore now and then when the hero is by the bed, none from across the room", snored && farSnore === 0, { snored, farSnore });
        tk = await talkFrom(bed.exits[0][0], bed.exits[0][1], bed.exits[0][0] < bed.x ? 6 : 8);
        check("talking to him in bed (O on the bed): Story's night lines ('Chrrr... Hm?')", tk.started && tk.done && /^Chrrr/.test(tk.text) && tk.who.every(w => w === 901), tk.text.slice(0, 100));

        // ================= 3. the hero never blocked, the doorway free: every spot of his day leaves the whole house reachable
        const blocks = [];
        for (const h of [7, 9.5, 10.2, 10.7, 11.2, 11.7, 12.5, 15, 19, 23]) {
            await setHour(h);
            const r = await reach();
            if (r.miss.length) blocks.push({ h, r });
        }
        const mon2 = await J("window.__mon");
        check("wherever he stands in his day, every floor cell stays reachable from the door", blocks.length === 0, blocks.slice(0, 3));
        check("grandpa never stops in the doorway, the cat never goes there", mon2.door.length === 0 && mon2.catDoor.length === 0 && mon2.frames > 1000, { door: mon2.door.slice(0, 5), cat: mon2.catDoor.slice(0, 5), frames: mon2.frames });

        // ---- coming in: a word from grandpa now and then (made sure here: every time, no gap)
        await setHour(15);
        await ev("HomeLife.ARRIVE.chance = 1; HomeLife.ARRIVE.gapHours = 0; window.__barkN = SpeechBubbles.log.length; $gamePlayer.reserveTransfer(19, 9, 11, 8, 0); 0");
        await until(onMap(19), 20);
        const barked = await until("SpeechBubbles.log.length > window.__barkN", 12);
        const bk = await J("({ said: SpeechBubbles.log.slice(window.__barkN), who: SpeechBubbles.barks.map(b => b.ch && b.ch.eventId ? b.ch.eventId() : 0) })");
        await frames(40);
        await shot("zycie_dziadek_powitanie.png");
        check("coming into the house: grandpa says something (the weather, the debt, the cat...)", barked && bk.who.includes(901) && bk.said.length === 1, bk);
        await ev("HomeLife.ARRIVE.chance = 0.65; HomeLife.ARRIVE.gapHours = 2; 0");

        }
        // ================= 4. the cat
        await setHour(14);
        await ev("HomeLife.catGo('hearth'); 0");
        await until("HomeLife.catState().pose === 'sleep'", 30);
        const catAt = await K();
        await ev(`$gamePlayer.locate(${catAt.x + 1}, ${catAt.y + 1}); $gamePlayer.setDirection(4); 0`);
        await frames(30);
        await shot("zycie_dziadek_kot_przy_ogniu.png", true);
        await closeup("zycie_dziadek_kot_przy_ogniu_zblizenie.png", "$gameMap.event(960)", 260, 170, 50);
        const c1 = await K();
        await ev("$gamePlayer.locate(14, 9); 0");   // (off the rug: a cat does not walk onto the hero's feet)
        await ev("HomeLife.catGo('rug'); 0");
        const moved = await until(`HomeLife.catState().x !== ${c1.x} || HomeLife.catState().y !== ${c1.y}`, 15);
        const arrived = await until("HomeLife.catState().x === HomeLife.layout().cat.rug.x && HomeLife.catState().y === HomeLife.layout().cat.rug.y && !HomeLife.catState().moving", 30);
        check("the cat gets up and walks (to the rug)", moved && arrived, await K());
        await ev("HomeLife.catGo('sill'); 0");
        const onSill = await until("HomeLife.catState().x === HomeLife.layout().cat.sill.x && HomeLife.catState().y === HomeLife.layout().cat.sill.y && !HomeLife.catState().moving", 40);
        check("it jumps up onto the window sill (and never leaves the house)", onSill, await K());
        await ev("HomeLife.catGo('hearth'); 0");
        await until("HomeLife.catState().spot === 'hearth' && HomeLife.catState().pose === 'sleep'", 40);
        // purring: +5 once a day
        const k2 = await K();
        await ev("$gameSystem.setStamina(40); window.__se.length = 0; window.__pops.length = 0; HomeLife.state().purrDay = -1; 0");
        await actAt(k2.x + 1, k2.y, 4);
        await until("HomeLife.state().purrs >= 1", 5);
        await frames(24);
        const purr1 = await J("({ st: $gameSystem.stamina(), se: window.__se.slice(), cat: HomeLife.catState(), fx: HomeLife.fx.map(f => f.kind), pop: window.__pops.slice() })");
        await shot("zycie_dziadek_kot_mruczy.png");
        await closeup("zycie_dziadek_kot_mruczy_zblizenie.png", "$gameMap.event(960)", 300, 210, 40);
        check("O on the cat: it purrs (Cat.ogg), a heart and 'mrrr', +5 stamina with 'Kot mruczy - odpoczywasz chwilę'", purr1.st === 45 && purr1.se.includes("Cat") && purr1.fx.includes("heart") && purr1.fx.includes("mrrr") &&
            purr1.cat.purr > 0 && purr1.pop.some(t => /^Kot mruczy - odpoczywasz chwilę/.test(t)), purr1);
        await frames(260);
        await actAt(k2.x + 1, k2.y, 4);
        await until("HomeLife.state().purrs >= 2", 5);
        await frames(10);
        const purr2 = await J("({ st: $gameSystem.stamina(), purrs: HomeLife.state().purrs, pop: window.__pops.slice() })");
        check("purring again the same day: no more rest bonus", purr2.st === 45 && purr2.purrs === 2 && purr2.pop.length === 1, purr2);
        // the next day: the bonus again
        await ev("$gameSystem.advanceDayNight(24); $gameSystem.setStamina(40); 0");
        await frames(300);
        const k3 = await K();
        await actAt(k3.x + 1, k3.y, 4);
        await until("HomeLife.state().purrs >= 3", 5);
        const purr3 = await J("({ st: $gameSystem.stamina(), day: $gameSystem.dayNightDay(), purrDay: HomeLife.state().purrDay })");
        check("the next day: the cat's rest bonus again", purr3.st === 45 && purr3.purrDay === purr3.day, purr3);
        const back = await until("HomeLife.catState().pose === 'sleep'", 20);
        check("then it curls up again by the fire", back, await K());

        // ================= 5. a save from before the cat: the cat is added when it loads; grandpa goes straight to what he does
        await ev("delete $gameMap._events[960]; DataManager.saveGame(7); 0");
        await sleep(800);
        await ev("DataManager.loadGame(7).then(() => { SceneManager.goto(Scene_Map); }); 0");
        await until(onMap(19) + " && !!$gameMap.event(960)", 30);
        await frames(20);
        const loadedSt = await J("({ cat: !!$gameMap.event(960), g: HomeLife.grandpaState() })");
        check("a save made before the cat came: the cat is there after loading; grandpa where he should be", loadedSt.cat && loadedSt.g && loadedSt.g.key === (await J("HomeLife.activityAt()")), loadedSt);

        // ================= 6. an old-style game (no story): the cat, no grandpa, no soup
        await newGame(3, 26, 14);
        const noStory = await J("({ story: !!$gameSystem._story })");
        await ev("$gamePlayer.reserveTransfer(19, 9, 11, 8, 0); 0");
        await until(onMap(19), 30);
        await frames(30);
        await ev(quiet);
        const old = await J(`(function(){ const h = HomeLife.layout().ev.hearth; return { g: !!$gameMap.event(901), gs: HomeLife.grandpaState(), cat: HomeLife.catState(), hearthList: h.list().length }; })()`);
        await actAt(9, 5, 8); await frames(10);
        const oldSoup = await ev("$gameParty.numItems($dataItems[131])");
        check("an old-style game: no grandpa and no routine, but the cat lives in the house; the cauldron is only a cauldron", !noStory.story && !old.g && old.gs === null && old.cat && old.cat.spot && old.hearthList <= 1 && oldSoup === 0, { noStory, old, oldSoup });

        // (the console's errors: the kit's last check, "no errors in the console")
    }
});
