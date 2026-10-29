// The hero (HeroLook.js - the only look since 2026-10-28: the old Reid and his F9 switch are gone): the player is drawn from Hero_Walk /
// Hero_Run / Hero_Sneak - 8 directions (the diagonals from the move itself), 8 frames a cycle chosen by the distance walked, standing
// still = column 0; every swing plays its Hero_ sheet (none the archived Swing_*); the database's old sheet ($Reid_Poor) asked for
// gives the hero's own.
const { launch, sleep } = require("./cdp.js");
const OUT = process.argv[2] || "";
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); $gameSystem.setDayNightHour(12); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const S = () => J(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(c => c._character === $gamePlayer); const f = s._frame;
            return { sheet: s._heroSheet || null, url: s.bitmap && s.bitmap._url ? s.bitmap._url.split("/").pop() : "", col: s._heroCell ? s._heroCell.col : null, row: s._heroCell ? s._heroCell.row : null,
                frame: [f.x, f.y, f.width, f.height], visible: s.visible, dir8: $gamePlayer._heroDir8, dir: $gamePlayer.direction(), dash: $gamePlayer.isDashing() }; })()`);
        // a free stretch of meadow to walk on
        const R = await J(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.isPassable(x, y, 6) && $gameMap.isPassable(x, y, 2) && $gameMap.eventsXy(x, y).length === 0 && !Farming.buildingAt(x, y);
            for (let y = 3; y < $gameMap.height() - 8; y++) for (let x = 2; x < $gameMap.width() - 12; x++) {
                let ok = true;
                for (let j = 0; j < 6 && ok; j++) for (let i = 0; i < 10 && ok; i++) ok = free(x + i, y + j);
                if (ok) return { x, y };
            }
            return null; })()`);
        check("found an open stretch of meadow", !!R, R);
        const start = async () => { await ev(`$gamePlayer.locate(${R.x + 1}, ${R.y + 1}); $gamePlayer.setDirection(2); 0`); await frames(10); };

        const s0 = await S();
        check("a new game: the hero's sheet Hero_Walk; no switch to the old hero any more", s0.sheet === "Hero_Walk" && (await ev("HeroLook.active()")) === true && (await ev("HeroLook.setActive === undefined")), s0);
        await start();
        const s1 = await S();
        check("the sheet Hero_Walk (visible), standing = column 0, facing down = row 0, 64x64 cells", s1.sheet === "Hero_Walk" && /Hero_Walk/.test(s1.url) && s1.visible === true && s1.col === 0 && s1.row === 0 && s1.frame[2] === 64 && s1.frame[3] === 64, s1);

        // walking right: row 6, the columns go round 1..8 with the distance
        // (2026-10-23: the frames noted in the game's own loop - read from outside every 3 frames, a busy machine skipped one)
        await ev(`(function(){ window.__walkCols = {}; const u = window.__walkU = SceneManager.updateMain; SceneManager.updateMain = function() { u.apply(this, arguments);
            const s = SceneManager._scene && SceneManager._scene._spriteset && SceneManager._scene._spriteset._characterSprites.find(c => c._character === $gamePlayer);
            if (s && s._heroCell) { window.__walkCols[s._heroCell.col] = 1; window.__walkRow = s._heroCell.row; } }; return 0; })()`);
        await ev("Input._currentState.right = true; 0");
        await frames(48);
        if (OUT) await b.shot(OUT + "hero_walk_right.png");
        await ev("Input._currentState.right = false; 0");
        const walk = await J("(function(){ SceneManager.updateMain = window.__walkU; return { cols: Object.keys(window.__walkCols).map(Number), row: window.__walkRow }; })()");
        const cols = new Set(walk.cols), rowR = walk.row;
        check("walking right: row 6 (right), the legs go through all 8 frames", rowR === 6 && [1, 2, 3, 4, 5, 6, 7, 8].every(c => cols.has(c)), { rowR, cols: [...cols].sort() });
        await frames(12);
        check("stopped: he stands (column 0), still facing right", (await S()).col === 0 && (await S()).row === 6);

        // on the slant: down-left -> row 1
        await start();
        await ev("Input._currentState.down = true; Input._currentState.left = true; 0");
        await frames(20);
        const sd = await S();
        await ev("Input._currentState.down = false; Input._currentState.left = false; 0");
        check("down-left on the slant: the diagonal row (1), though the 4-way facing is left or down", sd.dir8 === 1 && sd.row === 1 && (sd.dir === 4 || sd.dir === 2), sd);
        // tired (slow: the free movement steps one axis at a time on some frames), on the slant: the facing does not flick
        await start();
        await ev("$gameSystem.setStamina(10); Input._currentState.down = true; Input._currentState.right = true; 0");
        const seen = [];
        for (let i = 0; i < 30; i++) { await frames(2); seen.push((await S()).row); }
        await ev("Input._currentState.down = false; Input._currentState.right = false; $gameSystem.setStamina(100); 0");
        check("tired, walking down-right: the down-right row (7) all the way - no flicking between two ways", seen.slice(2).every(r => r === 7), { seen, pos: await J("({ x: $gamePlayer._realX, y: $gamePlayer._realY, can: $gamePlayer.canMove(), msg: $gameMessage.isBusy(), ev: $gameMap.isEventRunning() })") });
        await frames(12);
        await ev("$gamePlayer.setDirection(8); 0");   // turned where he stands
        await frames(3);
        check("turned in place to face up: the up row (4)", (await S()).row === 4);

        // drawn facing a slant, the tile in front stays the 4-way one (the user's, 2026-09-25): the brackets, the action button
        const E = await J(`(function(){
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.isPassable(x, y, 6) && $gameMap.isPassable(x, y, 2) && $gameMap.eventsXy(x, y).length === 0 && !Farming.buildingAt(x, y);
            for (const e of $gameMap.events()) {
                if (!e.page() || e.isTransparent() || !e.isNormalPriority() || !e.isTriggerIn([0])) continue;
                if ($gameMap.eventsXy(e.x, e.y).length !== 1 || !free(e.x - 1, e.y)) continue;
                return { id: e.eventId(), x: e.x, y: e.y };
            }
            return null; })()`);
        check("found an action-button event with a free tile left of it", !!E, E);
        await ev(`$gamePlayer.locate(${E.x - 1}, ${E.y}); $gamePlayer.setDirection(6); $gamePlayer._heroDir8 = 3; 0`);
        await frames(20);
        const mk = await J(`(function(){ const m = SceneManager._scene._spriteset._targetMarker;
            return { row: SceneManager._scene._spriteset._characterSprites.find(c => c._character === $gamePlayer)._heroCell.row, visible: m.visible,
                at: [m.x, m.y], want: [Math.round($gameMap.adjustX(${E.x}) * $gameMap.tileWidth()), Math.round($gameMap.adjustY(${E.y}) * $gameMap.tileHeight())] }; })()`);
        check("drawn down-right (row 7), the 4-way facing right: the brackets on the ground mark the tile to the right (the event's)", mk.row === 7 && mk.visible && mk.at[0] === mk.want[0] && mk.at[1] === mk.want[1], mk);
        const started = await J(`(function(){ const o = Game_Event.prototype.start, out = []; Game_Event.prototype.start = function() { out.push(this.eventId()); };
            try { $gamePlayer.checkEventTriggerThere([0, 1, 2]); } finally { Game_Event.prototype.start = o; } return out; })()`);
        check("...the action button starts that event (the tile to the right)", started.includes(E.id), { started, E });
        // letting go of the two keys of a slant one after the other: he stays facing the slant
        await start();
        await ev("Input._currentState.down = true; Input._currentState.right = true; 0");
        await frames(15);
        await ev("Input._currentState.right = false; 0");
        await frames(3);
        await ev("Input._currentState.down = false; 0");
        await frames(12);
        const rel = await J("({ d8: $gamePlayer._heroDir8, d: $gamePlayer.direction() })");
        check("let go of right, then of down 3 frames later: still drawn facing down-right", rel.d8 === 3, rel);

        // running: Hero_Run
        await start();
        await ev("Input._currentState.shift = true; Input._currentState.right = true; 0");
        await frames(20);
        const sr = await S();
        if (OUT) await b.shot(OUT + "hero_run_right.png");
        await ev("Input._currentState.shift = false; Input._currentState.right = false; 0");
        check("running (Shift): the run sheet Hero_Run, row 6", sr.sheet === "Hero_Run" && sr.row === 6 && sr.dash, sr);
        await frames(15);
        check("...stopped: back to the walking sheet, standing", (await S()).sheet === "Hero_Walk" && (await S()).col === 0);

        // the legs keep time with the speed: tired (half the speed) goes through the frames at half the pace
        const pace = async () => { await start(); await ev("Input._currentState.right = true; 0"); const a = await ev("$gamePlayer._heroStep || 0"); await frames(40); const bb = await ev("$gamePlayer._heroStep || 0"); await ev("Input._currentState.right = false; 0"); return bb - a; };
        const p1 = await pace();
        await ev("$gameSystem.setStamina(10); 0");
        const p2 = await pace();
        await ev("$gameSystem.setStamina(100); 0");
        check("tired (half the speed): the legs cover half the distance - the frames follow the ground covered", Math.abs(p2 - p1 / 2) < p1 * 0.2, { rested: p1, tired: p2 });

        // the side axe swing (a standing tree) plays the new sheet when it is there
        // every kind of swing plays a new sheet, and every sheet loads: 4 rows of 96x96 cells, at least 13 frames
        const kinds = await J(`(function(){ const out = []; for (let k = 0; k < 22; k++) out.push(ChoppableTree.swingKind(k).sheet); return out; })()`);
        check("every kind of swing (0-21, the torch 20, the sword 21: Hero_Sword) plays a new Hero_ sheet", kinds.every(n => /^Hero_/.test(n)) && kinds[21] === "Hero_Sword", kinds);
        const sheets = [...new Set(kinds)];
        await ev(`window.__sheets = ${JSON.stringify(sheets)}.map(n => ImageManager.loadSystem(n)); 0`);
        for (let i = 0; i < 40 && !(await ev("__sheets.every(b => b.isReady() || b.isError())")); i++) await frames(5);
        const dims = await J("__sheets.map(b => ({ url: b._url.split('/').pop(), ok: b.isReady() && !b.isError(), w: b.width, h: b.height }))");
        check("...all " + sheets.length + " sheets load: 4 rows of 96, 13 frames or more", dims.every(d => d.ok && d.h === 384 && d.w % 96 === 0 && d.w / 96 >= 13), dims.filter(d => !(d.ok && d.h === 384 && d.w / 96 >= 13)));
        // sneaking (C): the bent-low sheet, also standing still
        await ev("Hunting.setSneak(true); 0");
        await frames(5);
        const sk = await S();
        await ev("Hunting.setSneak(false); 0");
        await frames(5);
        check("sneaking (C): the sneak sheet Hero_Sneak", sk.sheet === "Hero_Sneak" && /Hero_Sneak/.test(sk.url), sk);

        // the old hero's sheets are archived: no swing plays a Swing_* sheet, and the database's $Reid_Poor (data/Actors.json) asked for
        // gives the hero's own sheet - nothing tries to load a file that is not there
        const old = await J(`(function(){ const n = Tawerna.api("ChoppableTree_parts").core.SWING_KINDS.length, sheets = [];
            for (let k = 0; k < n; k++) sheets.push(ChoppableTree.swingKind(k).sheet || null);
            return { sheets, reid: ImageManager.loadCharacter("$Reid_Poor")._url.split("/").pop(), sneak: ImageManager.loadCharacter("$Reid_Poor_Sneak")._url.split("/").pop(),
                actor: $gameParty.leader().characterName(), named: $gamePlayer.characterName() }; })()`);
        check("no swing plays an old Swing_* sheet (each its Hero_ sheet), $Reid_Poor / $Reid_Poor_Sneak asked for -> Hero_Walk / Hero_Sneak",
            old.sheets.length >= 22 && old.sheets.every(n => n === null || /^Hero_/.test(n)) && old.sheets.slice(0, 22).every(n => /^Hero_/.test(n)) &&
            old.reid === "Hero_Walk.png" && old.sneak === "Hero_Sneak.png", old);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    await ev("Input.clear(); 0").catch(() => 0);
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-5) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
