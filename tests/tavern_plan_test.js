// "Plan karczmy" (TavernLife_Plan.js, a part of TavernLife.js - put into the page until it is registered): the tavern's plan on Map001 (the vestibule - placed in the editor, found by its <Tavern:plan> tag),
// Map025 and Map026 (at the stairs, put into the maps' data by the plugin: event 950) - on free cells, reachable, cutting nobody off,
// O from every cell in front of one opens the plan
// scene on the floor he is on, "Tu jesteś" where he stands (his map cell through the plan's scale), the tabs (Q / E and the tab
// row), the cursor over the rooms and the side panel's words, the services lit by the hour (Melia's stage at 12:00 and 19:00, the
// dice), the way (O), no secret on the plan, P back to the map, "Plan karczmy" in the P menu inside the tavern only, a game saved
// before the easels came, no QuestBoard / no story, no console errors. Screenshots: docs/tawerna_nowa/plan_karczmy_*.png
//   CDP_PORT=9386 node tests/tavern_plan_test.js
process.env.CDP_PORT = process.env.CDP_PORT || "9386";
const { launch, sleep } = require("./cdp.js");
const fs = require("fs");
const path = require("path");
const SHOTS = path.join(__dirname, "..", "docs", "tawerna_nowa");

const KEYS = { O: [79, "KeyO", "o"], P: [80, "KeyP", "p"], Q: [81, "KeyQ", "q"], E: [69, "KeyE", "e"],
    up: [38, "ArrowUp", "ArrowUp"], down: [40, "ArrowDown", "ArrowDown"], left: [37, "ArrowLeft", "ArrowLeft"], right: [39, "ArrowRight", "ArrowRight"] };

(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 30000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(!!ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
    const until = async (cond, secs) => { const t0 = Date.now(); while (Date.now() - t0 < secs * 1000) { if (await ev(cond).catch(() => false)) return true; await sleep(150); } return false; };
    const onMap = id => `(SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && $gameMap.mapId() === ${id})`;
    const inPlan = "(SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_TavernPlan' && SceneManager._scene._started && !SceneManager.isSceneChanging() && !SceneManager._scene.isFading())";
    const quiet = "(function(){ if (window.Needs) Needs.setEnabled(false); if (window.Hunting) { Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); } if (window.Livestock) Livestock.auto(false); if (window.Dog) Dog.auto(false); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather(); $gameSystem._minimapHidden = true; $gameSystem._combatMode = false; return 0; })()";
    const setClock = (d, h) => ev(`(function(){ $gameSystem._dayNightDay = ${d}; $gameSystem._dayNightHour = ${h}; return 0; })()`);
    // a real key: down, held for a few frames, up (the engine reads the keys once a frame)
    const press = async (k, hold) => {
        const [code, name, key] = KEYS[k];
        await b.send("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, code: name, key });
        await frames(hold || 3);
        await b.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, code: name, key });
        await frames(3);
    };
    const go = async (map, x, y, dir) => {
        await ev(`(function(){ $gamePlayer.reserveTransfer(${map}, ${x}, ${y}, ${dir || 2}, 0); return 0; })()`);
        const ok = await until(onMap(map), 40);
        await frames(20);
        await ev(quiet);
        return ok;
    };
    const state = () => J("TavernLife.plan.state()");
    fs.mkdirSync(SHOTS, { recursive: true });
    try {
        // ---- boot, a story game in the tavern
        let booted = false;
        for (let a = 0; a < 4 && !booted; a++) {
            await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
            for (let i = 0; i < 120; i++) {
                if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title' && DataManager._globalInfo)").catch(() => false)) { booted = true; break; }
                await sleep(500);
            }
        }
        check("the game boots", booted);
        b.logs.splice(0);
        // a plugin not in js/plugins.js yet goes into the page (TavernLife's parts - TavernLife_*.js - until they are registered)
        const load = name => ev(`new Promise(res => { if ($plugins.some(p => p.name === "${name}" && p.status) || window.${name} || (window.TavernLife && TavernLife.modules && TavernLife.modules["${name}"])) return res(true);
            const s = document.createElement("script"); s.src = "js/plugins/${name}.js?" + Date.now(); s.onload = () => res(true); s.onerror = () => res(false); document.body.appendChild(s); })`);
        const PARTS = ["TavernLife_Render", "TavernLife_ArmWrestle", "TavernLife_Darts", "TavernLife_Plan"];
        const loadAll = async names => { let ok = true; for (const n of names) ok = (await load(n)) && ok; return ok; };
        check("TavernLife.js (with the plan: TavernLife_Plan.js) and QuestBoard.js are in the game", (await loadAll(["TavernLife", "QuestBoard"].concat(PARTS))) && (await ev("!!(TavernLife.plan && window.Scene_TavernPlan)")));
        await ev("window.__retries = []; setInterval(() => { const r = document.getElementById('retryButton'); if (r) { window.__retries.push(1); r.click(); } }, 400); 0");
        await ev("Object.assign($dataSystem, { startMapId: 19, startX: 2, startY: 5 }); /* (a story game in grandpa's cottage, whatever data/System.json says) */ DataManager.setupNewGame(); SceneManager.goto(Scene_Map); 0");
        await until(onMap(19), 40);
        await ev("Story.skipIntro(); Story.setDeadlineOn(false); $gameSystem._story.flags.hired = true; QuestBoard.state().rep = 0; 0");
        const BOARDS = await J("TavernLife.plan.BOARDS");

        // ================= the easels on the three maps
        const landing = { 1: [50, 82, 8], 25: [48, 62, 8], 26: [40, 23, 8] };
        const floorOf = { 1: 0, 25: 1, 26: 2 };
        for (const map of [1, 25, 26]) {
            const [lx, ly, ld] = landing[map], bd = BOARDS[map];
            await go(map, lx, ly, ld);
            await setClock(3, 12);
            // the plan is the event with <Tavern:plan> (its note or a comment): on Map001 the one placed in the editor (event 349 today),
            // on Map025 / Map026 the plugin's easel (event 950); its cells = its own cell + its <Occupy:...> cells
            const info = await J(`(function(){
                const tagged = q => { const d = q.event(); return /<Tavern:plan>/i.test(d.note || "") || d.pages.some(pg => pg.list.some(c => (c.code === 108 || c.code === 408) && /<Tavern:plan>/i.test(String(c.parameters[0] || "")))); };
                const occ = q => { const cells = [[q.x, q.y]], m = /<Occupy:([^>]*)>/i.exec(q.event().note || "");
                    if (m) { const kv = {}; for (const p of m[1].split(",")) { const [k, v] = p.split("="); kv[k.trim()] = Number(v); }
                        for (let dy = -(kv.up || 0); dy <= (kv.down || 0); dy++) for (let dx = -(kv.left || 0); dx <= (kv.right || 0); dx++) if (dx || dy) cells.push([q.x + dx, q.y + dy]); }
                    return cells; };
                const plans = $gameMap.events().filter(tagged), e = plans[0] || null;
                const cells = e ? occ(e) : [];
                const others = cells.map(c => $gameMap.eventsXy(c[0], c[1]).filter(q => q !== e).map(q => q.eventId()));
                const floor = cells.length > 0 && cells.every(c => $gameMap.checkPassage(c[0], c[1], 0x0f));
                const wallAbove = cells.length > 0 && cells.every(c => !$gameMap.checkPassage(c[0], c[1] - 1, 0x0f));
                // what blocks: every event 'same as characters', not walk-through, on all of its <Occupy> cells (no transfers)
                const solidCells = new Map();
                for (const q of $gameMap.events()) {
                    if (!q.isNormalPriority() || q.isThrough() || q.event().pages.some(p => p.list.some(c => c.code === 201))) continue;
                    for (const c of occ(q)) solidCells.set(c[0] + ',' + c[1], q);
                }
                // the cells he can reach from the landing, the plan standing and taken away (Game_Map's own passability, the events)
                function reach(skip) {
                    const seen = new Set([${lx} + ',' + ${ly}]), todo = [[${lx}, ${ly}]];
                    const solid = (x, y) => { const q = solidCells.get(x + ',' + y); return !!q && !(skip && q === e); };
                    while (todo.length) {
                        const [x, y] = todo.pop();
                        for (const [dx, dy, dd] of [[0, 1, 2], [0, -1, 8], [1, 0, 6], [-1, 0, 4]]) {
                            const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
                            if (seen.has(k) || !$gameMap.isValid(nx, ny) || !$gameMap.isPassable(x, y, dd) || !$gameMap.isPassable(nx, ny, 10 - dd) || solid(nx, ny)) continue;
                            seen.add(k); todo.push([nx, ny]);
                        }
                    }
                    return seen;
                }
                const withIt = reach(false), without = reach(true);
                const fronts = cells.filter(c => !cells.some(o => o[0] === c[0] && o[1] === c[1] + 1)).map(c => [c[0], c[1] + 1]);
                const lost = [...without].filter(k => !withIt.has(k));
                return { n: plans.length, id: e ? e.eventId() : 0, at: e ? [e.x, e.y] : null, cells, fronts, sheet: e ? e.characterName() : '', prio: e ? e._priorityType : -1,
                    trigger: e ? e._trigger : -1, others, floor, wallAbove, reachFront: fronts.length > 0 && fronts.every(f => withIt.has(f.join(','))), lost };
            })()`);
            const planCells = info.cells.map(c => c.join(","));
            const where = map === 1 ? "the plan placed in the editor (event " + info.id + ")" : `the easel (event 950) at (${bd.x},${bd.y})`;
            check(`Map${String(map).padStart(3, "0")}: one plan with <Tavern:plan> - ${where}, ${bd.sheet}, 'same as characters', action button`,
                info.n === 1 && info.sheet === bd.sheet && info.prio === 1 && info.trigger === 0 &&
                (map === 1 ? info.id > 0 && info.cells.length >= 2 : info.id === 950 && info.at && info.at[0] === bd.x && info.at[1] === bd.y), info);
            check(`Map${String(map).padStart(3, "0")}: its cells ${JSON.stringify(info.cells)} are free floor (no other event), in front of it reachable from the landing` + (map === 1 ? ", a wall behind it" : ""),
                info.floor && info.others.every(o => o.length === 0) && info.reachFront && (map !== 1 || info.wallAbove), info);
            check(`Map${String(map).padStart(3, "0")}: it blocks nothing - with it standing only its own cells are out of reach`, info.lost.every(k => planCells.includes(k)), info.lost);
            const [fx, fy] = info.fronts[0] || [bd.x, bd.y + 1];
            if (map === 1) {
                await ev(`$gamePlayer.locate(${fx}, ${fy + 1}); $gamePlayer.setDirection(8); 0`);
                await frames(30);
                await b.shot(path.join(SHOTS, "plan_karczmy_tablica.png"));
            } else {
                await ev(`$gamePlayer.locate(${bd.x - 1}, ${bd.y}); $gamePlayer.setDirection(6); 0`);
                await frames(30);
                await b.shot(path.join(SHOTS, "plan_karczmy_tablica_" + (map === 25 ? "pietro1" : "pietro2") + ".png"));
            }
            // O in front of it (from every cell in front of it) opens the plan on this floor; P goes back where he stood
            for (let k = 0; k < info.fronts.length; k++) {
                const [ox, oy] = info.fronts[k];
                await ev(`$gamePlayer.locate(${ox}, ${oy}); $gamePlayer.setDirection(8); 0`);
                await frames(8);
                const at = await J("[$gamePlayer._realX, $gamePlayer._realY]");
                await press("O");
                const opened = await until(inPlan, 15);
                const st = opened ? await state() : null;
                check(`Map${String(map).padStart(3, "0")}: O from (${ox},${oy}) in front of the plan opens it on its floor (${["Parter", "Pokoje gości", "Apartamenty"][floorOf[map]]}), the tab of his floor marked`, opened && st.floor === floorOf[map] && st.here === floorOf[map], st && { floor: st.floor, here: st.here });
                if (k === 0) {
                    const want = opened ? await J(`TavernLife.plan.point(${floorOf[map]}, ${at[0]}, ${at[1]})`) : null;
                    check(`Map${String(map).padStart(3, "0")}: "Tu jesteś" stands where he stands: map cell (${at.join(",")}) -> plan pixel`, st && st.marker && Math.abs(st.marker.x - Math.round(want.x)) <= 1 && Math.abs(st.marker.y - Math.round(want.y)) <= 1, { marker: st && st.marker, want });
                    const roomHere = await ev(`TavernLife.plan.roomAt(${floorOf[map]}, ${at[0]}, ${at[1]})`);
                    check(`Map${String(map).padStart(3, "0")}: the cursor starts on the room he is in (${roomHere})`, st && st.sel === roomHere, st && st.sel);
                    if (map === 1) await b.shot(path.join(SHOTS, "plan_karczmy_parter.png"));
                }
                await press("P");
                const back = await until(onMap(map), 15);
                const pos = await J("[$gamePlayer.x, $gamePlayer.y, $gamePlayer.direction()]");
                check(`Map${String(map).padStart(3, "0")}: P closes the plan - back on the map where he stood (${ox},${oy})`, back && pos[0] === ox && pos[1] === oy, pos);
            }
        }

        // ================= tabs, cursor, panel (Map001)
        await go(1, 50, 80, 8);
        await setClock(3, 19);
        await ev("TavernLife.plan.open(); 0");
        await until(inPlan, 15);
        let st = await state();
        check("opened from the vestibule: floor Parter, the cursor on the Sień", st.floor === 0 && st.sel === "sien", { floor: st.floor, sel: st.sel });
        await press("E");
        await frames(16);
        const f1 = (await state()).floor;
        await press("E");
        await frames(16);
        const f2 = (await state()).floor;
        await press("E");   // (past the last floor: stays)
        const f2b = (await state()).floor;
        await press("Q");
        await frames(16);
        const f1b = (await state()).floor;
        check("E / Q switch the floors: Parter -> Pokoje gości -> Apartamenty (stays at the last), Q back", f1 === 1 && f2 === 2 && f2b === 2 && f1b === 1, [f1, f2, f2b, f1b]);
        await b.shot(path.join(SHOTS, "plan_karczmy_pokoje_goscie.png"));
        await press("Q");
        await frames(16);
        // up from the top rooms reaches the tab row; left / right there switch the floor; down comes back
        for (let i = 0; i < 12 && (await state()).focus !== "tabs"; i++) await press("up");
        const focusTabs = (await state()).focus;
        await press("right");
        await frames(16);
        const tabFloor = (await state()).floor;
        await press("left");
        await frames(16);
        await press("down");
        st = await state();
        check("the tab row: up from the top rooms, then right / left switch the floor, down back to the rooms", focusTabs === "tabs" && tabFloor === 1 && st.floor === 0 && st.focus === "rooms", { focusTabs, tabFloor, floor: st.floor, focus: st.focus });
        // the cursor with the arrows: from the vestibule up into the great hall, the panel follows
        await ev("TavernLife.plan.select('sien'); 0");
        await press("up");
        st = await state();
        check("the cursor: up from the Sień is the Wielka sala; the panel says who is there (Borgar) and the day's dish", st.sel === "sala" && st.panel.title === "Wielka sala" &&
            JSON.stringify(st.panel).includes("Borgar") && JSON.stringify(st.panel).includes("Danie dnia") && JSON.stringify(st.panel).includes("Zmiany u Borgara 16:00–21:00"), { sel: st.sel, panel: st.panel && st.panel.sections.map(s => s.lines.map(l => l.text)) });
        const seen = [st.sel];
        for (const k of ["right", "up", "right", "left", "down", "left"]) { await press(k); seen.push((await state()).sel); }
        check("the arrows walk the rooms (every press lands on a room of this floor)", seen.every(k => !!k) && new Set(seen).size >= 4, seen);
        // the stage at 19:00 (Melia sings 18-24) and the game room's dice players
        await ev("TavernLife.plan.select('scena'); 0");
        st = await state();
        const stage19 = st.icons.find(i => i.kind === "stage");
        check("at 19:00 the stage is lit, the panel: 'Melia Srebrogłosa - śpiewa 18:00-24:00', open now, the tip", stage19 && stage19.lit && st.panel.status.tone === "open" &&
            JSON.stringify(st.panel).includes("śpiewa 18:00–24:00") && JSON.stringify(st.panel).includes("Napiwek"), { lit: stage19 && stage19.lit, status: st.panel.status });
        await ev("TavernLife.plan.select('gry'); 0");
        st = await state();
        const dice19 = st.icons.filter(i => i.kind === "dice");
        check("the game room at 19:00: dice lit (Ozzy, Bartek, Grum at the table), Grum's arm-wrestling and stakes in the panel", dice19.length === 2 && dice19.every(i => i.lit) &&
            /Przy kościach: .*Grum/.test(st.panel.status.text) && JSON.stringify(st.panel).includes("Siłowanie: stawki 5 / 10 / 20 G"), { dice: dice19.map(i => i.lit), status: st.panel.status.text });
        await b.shot(path.join(SHOTS, "plan_karczmy_pokoj_gier.png"));
        // the way: O on a room draws it from "Tu jesteś"
        await press("O");
        st = await state();
        check("O on the game room: the way from him to it is drawn on the plan (a path of cells), the panel says so", st.target && st.target.key === "gry" && st.way > 10 && JSON.stringify(st.panel || {}).length > 0, { target: st.target, way: st.way });
        await b.shot(path.join(SHOTS, "plan_karczmy_droga.png"));
        await press("O");
        check("O again takes the way off", !(await state()).target);
        await press("P");
        await until(onMap(1), 15);

        // ================= lit and dimmed by the hour: 12:00
        await setClock(3, 12);
        await ev("TavernLife.plan.open(); 0");
        await until(inPlan, 15);
        await ev("TavernLife.plan.select('scena'); 0");
        st = await state();
        const stage12 = st.icons.find(i => i.kind === "stage");
        const dice8 = await J("(function(){ const h = $gameSystem._dayNightHour; $gameSystem._dayNightHour = 8; const r = TavernLife.plan.icons(0).filter(i => i.kind === 'dice').map(i => i.lit); $gameSystem._dayNightHour = h; return r; })()");
        check("at 12:00 the stage is dimmed and the panel says she sings from 18:00; at 8:00 the dice tables are dimmed (nobody plays before 10)", stage12 && !stage12.lit &&
            st.panel.status.tone === "closed" && /od 18:00/.test(st.panel.status.text) && dice8.length === 2 && dice8.every(l => !l), { stage: stage12 && stage12.lit, status: st.panel.status, dice8 });
        await b.shot(path.join(SHOTS, "plan_karczmy_scena_w_poludnie.png"));
        // the always-open ones stay lit
        const always = st.icons.filter(i => ["bar", "kitchen", "board", "bath", "darts", "arm"].includes(i.kind));
        check("the bar, the kitchen, the board, the bath, the darts and Grum's table are lit at noon too", always.length === 6 && always.every(i => i.lit), always.map(i => i.kind + ":" + i.lit));
        // the rooms upstairs: keys on rooms 1-3, a padlock on the chamber (fame 60) and on the gilded gate (80)
        await press("E");
        await frames(16);
        st = await state();
        const beds = st.icons.filter(i => i.kind === "room"), gate = st.icons.find(i => i.kind === "gate");
        check("Pokoje gości at fame 0: rooms 1-3 lit with a key, the chamber dimmed with a padlock, the gate dimmed", beds.length === 4 && beds.filter(i => i.lit && i.badge === "key").length === 3 &&
            beds.filter(i => !i.lit && i.badge === "lock").length === 1 && gate && !gate.lit, beds.map(i => [i.room, i.lit, i.badge]).concat([["gate", gate && gate.lit]]));
        await ev("TavernLife.plan.select('chamber'); 0");
        st = await state();
        check("the chamber's panel: 30 G a night, for guests of fame 'Pewna ręka' (60), shut now", JSON.stringify(st.panel).includes("30 G") && JSON.stringify(st.panel).includes("Pewna ręka") && st.panel.status.tone === "closed", st.panel);
        await ev("QuestBoard.state().rep = 85; TavernLife.plan.floor(1); 0");
        await frames(20);
        st = await state();
        const beds85 = st.icons.filter(i => i.kind === "room");
        check("at fame 85 the chamber is to be had (a key) and the gate is lit", beds85.every(i => i.lit && i.badge === "key") && st.icons.find(i => i.kind === "gate").lit, beds85.map(i => [i.room, i.lit, i.badge]));
        await ev("QuestBoard.state().rep = 0; 0");
        // a room on another floor: the way goes to the stairs here, and on on the next floor
        await ev("TavernLife.plan.floor(2); 0");
        await frames(20);
        await ev("TavernLife.plan.select('s4'); 0");
        await press("O");
        st = await state();
        const w2 = st.way;
        await press("Q");
        await frames(16);
        const w1 = (await state()).way;
        await press("Q");
        await frames(16);
        const w0 = (await state()).way;
        check("the way to the Apartament Złoty from the vestibule: drawn on all three floors (to the stairs, across the guest floor, from the landing)", w2 > 5 && w1 > 20 && w0 > 5, [w0, w1, w2]);
        await press("E"); await frames(16); await press("E"); await frames(16);
        await b.shot(path.join(SHOTS, "plan_karczmy_apartamenty.png"));
        await press("P");
        await until(onMap(1), 15);

        // ================= no secret on the plan
        const secret = await J(`(function(){
            const D = TavernLife.plan.DATA, text = JSON.stringify(D), f0 = D.floors[0];
            const names = D.floors.flatMap(f => f.rooms.map(r => r.n));
            const raw = atob(f0.walk), bit = (x, y) => (raw.charCodeAt((y * f0.w + x) >> 3) >> ((y * f0.w + x) & 7)) & 1;
            const panels = TavernLife.plan.items(0).map(it => JSON.stringify(TavernLife.plan.info(0, it.key))).join(' ');
            const icons = f0.icons.filter(i => Math.abs(i[1] - 4) < 2 && Math.abs(i[2] - 3) < 2);
            return { names: names.filter(n => /mury|cegł|piwnic/i.test(n)), words: /cegł|piwnic|Krucz|lochu|tajn/i.test(text + panels), exitTo9: Object.keys(f0.exits).includes('9'), brickWalk: bit(4, 3), icons: icons.length, komorka: names.includes('Komórka') };
        })()`);
        check("no secret on the plan: no 'Stare mury' / loose brick / cellar (the old room is a plain 'Komórka'), no way out to Map009, nothing drawn or walkable at the brick", secret.names.length === 0 && !secret.words && !secret.exitTo9 && !secret.brickWalk && !secret.icons && secret.komorka, secret);

        // ================= the P menu: "Plan karczmy" in the tavern only
        const menuCmds = async () => {
            await press("P", 4);
            await until("SceneManager._scene instanceof Scene_Menu && SceneManager._scene._started && !SceneManager.isSceneChanging()", 15);
            await frames(10);
            return J("SceneManager._scene._commandWindow._list.map(c => c.symbol)");
        };
        const inTavern = await menuCmds();
        await b.shot(path.join(SHOTS, "plan_karczmy_menu.png"));
        const idx = inTavern.indexOf("tavernPlan");
        await ev(`SceneManager._scene._commandWindow.select(${idx}); SceneManager._scene._commandWindow.processOk(); 0`);
        const fromMenu = await until(inPlan, 15);
        const stm = fromMenu ? await state() : null;
        await press("P");
        const backToMenu = await until("SceneManager._scene instanceof Scene_Menu && SceneManager._scene._started && !SceneManager.isSceneChanging()", 15);
        await ev("SceneManager.pop(); 0");
        await until(onMap(1), 15);
        await go(19, 7, 7, 2);
        const outside = await menuCmds();
        await ev("SceneManager.pop(); 0");
        await until(onMap(19), 15);
        check("the P menu: 'Plan karczmy' inside the tavern (it opens the plan on his floor, P goes back to the menu), not elsewhere", idx >= 0 && fromMenu && stm.floor === 0 && backToMenu && !outside.includes("tavernPlan"), { inTavern, outside, floor: stm && stm.floor });

        // ================= a game saved before the easels: the map's saved events lack 950 -> it comes back
        await go(25, 48, 62, 8);
        await ev("delete $gameMap._events[950]; 0");
        const gone = await ev("!$gameMap.event(950)");
        await press("P", 4);
        await until("SceneManager._scene instanceof Scene_Menu && SceneManager._scene._started", 15);
        await ev("SceneManager.pop(); 0");
        await until(onMap(25), 15);
        await frames(10);
        const again = await J("(function(){ const e = $gameMap.event(950); return e ? [e.x, e.y, e.characterName()] : null; })()");
        check("an old save without the easel: back on the map (no transfer) the easel is there again", gone && again && again[0] === 53 && again[1] === 61 && again[2] === "!$Tavern_Plan_Small", again);

        // ================= without the story and without QuestBoard: nothing breaks, no word of fame
        const bare = await J(`(function(){
            const qb = window.QuestBoard, story = $gameSystem._story;
            window.QuestBoard = undefined; Tawerna.register("QuestBoard", null); $gameSystem._story = null;
            try {
                const hall = TavernLife.plan.info(0, 'sala'), ch = TavernLife.plan.info(1, 'chamber'), gate = TavernLife.plan.info(1, 'schody_gora'), sien = TavernLife.plan.info(0, 'sien');
                const lit = TavernLife.plan.icons(1).filter(i => i.kind === 'room' && i.room === 'chamber').map(i => i.lit);
                return { shift: JSON.stringify(hall).includes('Zmiany'), fame: /sław/i.test(JSON.stringify([ch, gate, sien])), chamber: ch.status, gate: gate.status, lit };
            } finally { window.QuestBoard = qb; Tawerna.register("QuestBoard", qb); $gameSystem._story = story; }
        })()`);
        check("no story (an old game) and no QuestBoard: the plan still tells the rooms; no shifts, no word of fame, the chamber and the gate shut", !bare.shift && !bare.fame && bare.chamber.tone === "closed" && bare.gate.tone === "closed" && bare.lit.every(l => !l), bare);
        // the scene itself without QuestBoard: it opens on the guest floor and draws the chamber's card
        const qbScene = await J(`(function(){ window.__qb = window.QuestBoard; window.QuestBoard = undefined; Tawerna.register("QuestBoard", null); return TavernLife.plan.open({ floor: 1 }); })()`);
        await until(inPlan, 15);
        await ev("TavernLife.plan.select('chamber'); 0");
        const qbState = await state();
        await ev("window.QuestBoard = window.__qb; Tawerna.register('QuestBoard', window.__qb); 0");
        check("...and the plan scene opens without QuestBoard too (the chamber's card: shut, no fame)", qbScene && qbState && qbState.sel === "chamber" && !/sław/i.test(JSON.stringify(qbState.panel)), qbState && qbState.panel && qbState.panel.status);
        await press("P");
        await until(onMap(25), 15);

        const errors = b.logs.filter(l => /^EXC|Error|TypeError|ReferenceError/.test(l));
        check("no console errors", errors.length === 0, errors.slice(0, 5));
    } catch (e) {
        console.log("FAIL (exception) " + e.message);
        results.push(false);
    }
    const passed = results.filter(Boolean).length;
    console.log(`\n${passed}/${results.length} passed`);
    await b.close();
    process.exit(passed === results.length ? 0 : 1);
})();
