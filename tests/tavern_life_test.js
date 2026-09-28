// Tavern life (TavernLife.js) on the installed tavern: Map001 "Pod Złotym Kuflem" (101 x 84), Map025 "Pokoje gości", Map026
// "Apartamenty", with the builders' <Tavern:...> events (tools/tavern/links.json "tags"). Borgar's card of dishes and a meal at a
// real table, a room for the night (rented at Borgar, up the stairs to Map025, its door opened by self switch A, in through the door,
// the candle, a full and safe sleep, breakfast, out again, the door shut after 10:00 - never with him inside), the bath with Wanda,
// Melia's song on the stage at 19:00 (once an evening), arm-wrestling with Grum and darts (seeded, won and lost, the stakes moved),
// Story's Borgar menu with "Zjedz coś" / "Wynajmij pokój", the premia (Survival.defineBuff), the tavern's reputation (QuestBoard.js:
// the discounts, the big chamber, the gilded gate, the Apartament Złoty on Map026) and no console errors.
// Loads TavernLife.js / QuestBoard.js into the page when js/plugins.js does not have them. Screenshots: docs/tawerna_zycie/uslugi_*.png
//   CDP_PORT=9384 node tests/tavern_life_test.js
process.env.CDP_PORT = process.env.CDP_PORT || "9384";
const { launch, sleep } = require("./cdp.js");
const fs = require("fs");
const path = require("path");
const SHOTS = path.join(__dirname, "..", "docs", "tawerna_zycie");

// the events of the installed maps (tools/tavern/links.json "tags")
const MAP = { hall: 1, rooms: 25, suites: 26 };
const EV = {
    borgar: 1, melia: 2, grum: 3, ozzy: 4, counter: 38, stage: 110, arm: 148, darts: 174, tub: 159, wanda: 172,
    door1: 35, door2: 37, door3: 33, bed1: 136, bed2: 143, candle1: 132, komnataDoor: 9, komnataBed: 264, gate: 298,
    zlotyDoor: 21, zlotyBed: 103, suiteDoor: 1
};
const MEALTABLES = [60, 61, 77, 78, 188, 189];

// the driver: presses O on messages and answers a choice with the next label from `picks` (a prefix)
const DRIVER = String.raw`
(function() {
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
                    cw.deactivate();
                    cw.callOkHandler();
                    T.waiting = null;
                }
            } else if ($gameMessage.hasText() && !$gameMessage.isChoice() && mw && mw.isOpen() && !(T.holdAt >= 0 && T.log.length >= T.holdAt)) {
                if (T.f % 4 === 0) I.ok = true;
            }
        }
        _update.call(this);
    };
    // where to stand by an event: a free tile next to all it covers (<Occupy:...>), below it first; the hero faces it
    window.__standBy = function(id) {
        const e = $gameMap.event(id), p = $gamePlayer;
        if (!e) return null;
        const m = /<Occupy:([^>]*)>/i.exec((e.event() && e.event().note) || ""), o = { left: 0, right: 0, up: 0, down: 0 };
        if (m) for (const part of m[1].split(",")) { const kv = part.split("=").map(t => t.trim()); if (kv[0] in o) o[kv[0]] = Number(kv[1]) || 0; }
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
})();
`;

(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 30000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(!!ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
    const until = async (cond, secs) => { const t0 = Date.now(); while (Date.now() - t0 < secs * 1000) { if (await ev(cond).catch(() => false)) return true; await sleep(200); } return false; };
    const onMap = id => `(SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && $gameMap.mapId() === ${id})`;
    const calm = `(SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging() && !$gameMap.isEventRunning() && !$gameMessage.isBusy() && !TavernLife.busy())`;
    const quiet = "(function(){ if (window.Needs) Needs.setEnabled(false); if (window.Hunting) { Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); } if (window.Livestock) Livestock.auto(false); if (window.Dog) Dog.auto(false); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather(); $gameSystem._minimapHidden = true; return 0; })()";
    const setClock = (d, h) => ev(`(function(){ $gameSystem._dayNightDay = ${d}; $gameSystem._dayNightHour = ${h}; return 0; })()`);
    const gold = () => ev("$gameParty.gold()");
    const setGold = n => ev(`(function(){ $gameParty.loseGold($gameParty.gold()); $gameParty.gainGold(${n}); return $gameParty.gold(); })()`);
    const popups = () => J("window.__pops.splice(0)");
    const closeSummary = () => ev("if (SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_DaySummary' && SceneManager._scene._started && !SceneManager.isSceneChanging()) SceneManager.pop(); 0").catch(() => 0);
    const go = async (map, x, y, dir) => {
        await ev(`(function(){ $gamePlayer.reserveTransfer(${map}, ${x}, ${y}, ${dir || 2}, 0); return 0; })()`);
        const ok = await until(onMap(map), 40);
        await frames(20);
        await ev(quiet);
        return ok;
    };
    // walks: a direction key held until the condition holds (the maps' own touch events move him)
    const walk = async (key, cond, secs) => {
        await ev(`(function(){ Input.clear(); Input._currentState["${key}"] = true; return 0; })()`);
        const ok = await until(cond, secs || 15);
        await ev(`(function(){ Input._currentState["${key}"] = false; return 0; })()`);
        await frames(20);
        return ok;
    };
    // talks to an event (the hero put beside it) and waits till the talk (and what it started) is over
    const talkTo = async (id, picks, secs, opts) => {
        opts = opts || {};
        const at = await J(`(function(){ const T = window.__drv; T.on = true; T.picks = ${JSON.stringify(picks || [])}; T.waiting = null; T.mark = T.log.length; T.cmark = T.choices.length; T.missing = [];
            const at = window.__standBy(${id}); $gameMap.event(${id}).start(); return at; })()`);
        await frames(4);
        if (opts.card) {   // the card opens: a screenshot, then the line chosen
            const open = await until("!!TavernLife.openCard", 20);
            await frames(24);
            if (opts.shot) await b.shot(path.join(SHOTS, opts.shot));
            const card = await J("TavernLife.openCard");
            const ok = await ev(`TavernLife.cardChoose(${opts.card === "close" ? "null" : "TavernLife.openCard.entries.findIndex(e => e.name.indexOf(" + JSON.stringify(opts.card) + ") === 0)"})`);
            opts.cardInfo = { open, card, ok };
        }
        if (opts.during) await opts.during();
        let done = false;
        const t0 = Date.now();
        while (Date.now() - t0 < (secs || 40) * 1000) {
            await closeSummary();
            if (await ev(calm).catch(() => false)) { done = true; break; }
            await sleep(200);
        }
        const out = await J("({ log: window.__drv.log.slice(window.__drv.mark), choices: window.__drv.choices.slice(window.__drv.cmark), missing: window.__drv.missing })");
        out.done = done;
        out.text = out.log.map(l => l.t).join(" / ");
        out.flat = out.text.replace(/\n/g, " ");
        out.card = opts.cardInfo;
        out.at = at;
        return out;
    };
    fs.mkdirSync(SHOTS, { recursive: true });
    try {
        // ---- boot, the plugins, a story game in the tavern at 10:00 on day 3
        let booted = false;
        for (let a = 0; a < 4 && !booted; a++) {
            await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
            for (let i = 0; i < 120; i++) {
                if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title' && DataManager._globalInfo)").catch(() => false)) { booted = true; break; }
                await sleep(500);
            }
        }
        check("the game boots", booted);
        const bootLogs = b.logs.splice(0);   // (a boot the busy server broke halfway is not an error of the game: only what comes after counts)
        if (bootLogs.some(l => /^EXC/.test(l))) console.log("(a first boot broke off and was retried)");
        const load = name => ev(`new Promise(res => { if (window.${name}) return res(true); const s = document.createElement("script"); s.src = "js/plugins/${name}.js?" + Date.now(); s.onload = () => res(!!window.${name}); s.onerror = () => res(false); document.body.appendChild(s); })`);
        check("TavernLife.js and QuestBoard.js are in the game", (await load("TavernLife")) && (await load("QuestBoard")));
        await ev(DRIVER + "; 0");
        // (the local server sometimes drops a file under load - MZ then shows "Failed to load ... Retry": pressed, as a player would)
        await ev("window.__retries = []; setInterval(() => { const r = document.getElementById('retryButton'); if (r) { const t = (document.getElementById('errorPrinter') || {}).innerText || ''; window.__retries.push(t.replace(/\\s+/g, ' ').trim()); r.click(); } }, 400); 0");
        await ev("window.__pops = []; (function(){ const _p = Game_Temp.prototype.pushLootPopup; Game_Temp.prototype.pushLootPopup = function(i, t, c, o) { window.__pops.push(String(t)); return _p.apply(this, arguments); }; const _n = Game_Temp.prototype.pushTopNotice; window.__notices = []; Game_Temp.prototype.pushTopNotice = function(t) { window.__notices.push(String(t)); return _n.apply(this, arguments); }; })(); 0");
        await ev("DataManager.setupNewGame(); SceneManager.goto(Scene_Map); 0");
        await until(onMap(19), 40);
        await ev("Story.skipIntro(); Story.setDeadlineOn(false); $gameSystem._story.flags.hired = true; $gameSystem._story.flags.field = true; QuestBoard.state().rep = 0; 0");
        const inTavern = await go(MAP.hall, 49, 70, 8);
        await setClock(3, 10);
        await ev("TavernLife.TL.waitScale = 0.35; $gameSystem._combatMode = false; 0");
        const map1 = await J("({ w: $gameMap.width(), h: $gameMap.height(), tags: ['meal','mealtable','bath','stage','arm','darts','attendant'].map(k => k + ':' + TavernLife.spots(k).length) })");
        check("the installed tavern (Map001, 101 x 84) with the builders' tagged places", inTavern && map1.w === 101 && map1.h === 84 && map1.tags.join() === "meal:1,mealtable:6,bath:4,stage:1,arm:1,darts:2,attendant:1", map1);
        const npcs = await J("['borgar','melia','grum','ozzy'].map(r => { const e = TavernLife.npc(r); return e ? e.eventId() : 0; })");
        check("Borgar, Melia, Grum and Ozzy are found by name (events 1-4), their parallel 'Atmosfera' events are not", npcs.join() === "1,2,3,4", npcs);

        // ================= premia: Survival.defineBuff
        const buffs = await J("({ fn: typeof Survival.defineBuff, names: ['clean','inspired','hosted','rested'].map(k => Survival.BUFFS[k] && Survival.BUFFS[k].name), cost: Survival.BUFFS.clean.cost })");
        check("Survival.defineBuff registers the premia: Czysty, Natchniony, Ugoszczony, Wypoczęty", buffs.fn === "function" && buffs.names.join() === "Czysty,Natchniony,Ugoszczony,Wypoczęty" && Math.abs(buffs.cost - 0.9) < 1e-9, buffs);
        const cf = await J("(function(){ delete $gameSystem.buffs().clean; const f0 = Survival.costFactor(); $gameSystem.addBuff('clean', 2); const f1 = Survival.costFactor(); $gameSystem.setStamina(100); $gameSystem.trySpendStamina(20); const left = $gameSystem.stamina(); delete $gameSystem.buffs().clean; return { f0, f1, left }; })()");
        check("Czysty: work costs 10% less strength (costFactor x0.9: 20 costs 18)", Math.abs(cf.f1 / cf.f0 - 0.9) < 1e-6 && Math.abs(cf.left - (100 - 20 * cf.f1)) < 0.01, cf);

        // ================= Story's Borgar menu
        const menu = await talkTo(EV.borgar, ["Nie teraz"]);
        const labels = menu.choices[0] || [];
        check("Story's Borgar menu has 'Zjedz coś' and 'Wynajmij pokój' (before 'Pogadaj' and 'Nie teraz'; no shift in the morning)", menu.done && labels.includes("Zjedz coś") && labels.includes("Wynajmij pokój") &&
            labels.indexOf("Wynajmij pokój") < labels.indexOf("Pogadaj") && labels[labels.length - 1] === "Nie teraz" && !labels.includes("Weź zmianę"), { labels, done: menu.done });
        check("...Borgar speaks from his bust (the talk busts of SpeechBubbles)", menu.log.some(l => l.who === EV.borgar && l.bust), menu.log.map(l => [l.who, l.bust]));

        // ================= a meal at a real table
        const dd = await J("({ name: TavernLife.dishOfDay().name, full: TavernLife.dishOfDay().price, now: TavernLife.priceOf(TavernLife.dishOfDay()) })");
        check("the dish of the day is cheaper (-30%)", dd.now < dd.full && dd.now === Math.max(1, Math.round(dd.full * 0.7)), dd);
        await setGold(200);
        await ev("if (window.Needs) { Needs.setEnabled(true); const n = Needs.state(); n.food = 52; n.water = 52; n.lf = Needs.levels().food; n.lw = Needs.levels().water; } $gameSystem.setStamina(30); 0");
        const before = await J("({ gold: $gameParty.gold(), st: $gameSystem.stamina(), food: Needs.state().food, water: Needs.state().water, h: $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour() })");
        let seated = null, expectSeat = null;
        const meal = await talkTo(EV.borgar, ["Zjedz coś"], 90, { card: "Gulasz", shot: "uslugi_1_karta_dan.png", during: async () => {
            // the free seat nearest to where he ordered (TavernLife picks it the same way)
            expectSeat = await J(`(function(){ const p = $gamePlayer, s = TavernLife.spots('mealtable').slice().sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
                const d = Number(s.a.dir), pl = s.a.plate ? s.a.plate.split(',').map(Number) : [d === 6 ? 1 : d === 4 ? -1 : 0, d === 2 ? 1 : d === 8 ? -1 : 0]; return { id: s.id, x: s.x, y: s.y, dir: d, px: s.x + pl[0], py: s.y + pl[1] }; })()`);
            await until("TavernLife.fx.some(f => f.kind === 'plate') && $gamePlayer._toolSwing && $gamePlayer._toolSwing._waiting", 40);
            await frames(20);
            seated = await J("({ x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction(), plate: TavernLife.fx.filter(f => f.kind === 'plate').map(f => [f.x, f.y, f.dish.id]) })");
            await b.shot(path.join(SHOTS, "uslugi_2_posilek_przy_stole.png"));
        } });
        const after = await J("({ gold: $gameParty.gold(), st: $gameSystem.stamina(), food: Needs.state().food, water: Needs.state().water, h: $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour(), hosted: $gameSystem.hasBuff('hosted'), sated: $gameSystem.hasBuff('sated'), warm: $gameSystem.hasBuff('warm'), meals: TavernLife.stats().meals, x: $gamePlayer.x, y: $gamePlayer.y, pass: $gameMap.checkPassage($gamePlayer.x, $gamePlayer.y, 0x0f), note: Journal.data().notes.some(n => n.title === 'Karczma Borgara') })");
        const cardInfo = meal.card || {};
        const gPrice = await ev("TavernLife.priceOf(TavernLife.DISHES[0])");
        check("the card opens with the 7 dishes and drinks, prices, the day's dish marked", cardInfo.open && cardInfo.card && cardInfo.card.entries.map(e => e.name).join() === "Gulasz,Kapuśniak,Pieczeń z kaszą,Placek z serem,Chleb ze smalcem,Kufel piwa,Miód pitny", cardInfo.card && cardInfo.card.entries.map(e => e.name + " " + e.right));
        check("Gulasz ordered: its price taken", meal.done && before.gold - after.gold === gPrice, { before: before.gold, after: after.gold, price: gPrice });
        check("he sat at the nearest free table (a real <Tavern:mealtable>) facing its way, the plate on the table where the tag says", seated && expectSeat && seated.x === expectSeat.x && seated.y === expectSeat.y && seated.d === expectSeat.dir &&
            seated.plate.some(p => p[0] === expectSeat.px && p[1] === expectSeat.py && p[2] === "gulasz"), { seated, expectSeat });
        check("about 30 minutes passed", Math.abs(after.h - before.h - 0.5) < 0.12, after.h - before.h);
        check("the food worked: +65 stamina, hunger and thirst down, Najedzony + Rozgrzany, and Ugoszczony on top", after.st >= Math.min(100, before.st + 60) && after.food > before.food + 40 && after.water > before.water + 10 && after.sated && after.warm && after.hosted, after);
        check("afterwards he stands on a free tile beside the chair; a note 'Karczma Borgara' the first time", after.pass && expectSeat && Math.abs(after.x - expectSeat.x) + Math.abs(after.y - expectSeat.y) === 1 && after.note, { at: [after.x, after.y], seat: expectSeat });
        check("Borgar's lines came in his bubbles (event 1)", meal.log.some(l => l.who === 1 && /danie dnia/.test(l.t)) && meal.log.some(l => l.who === 1 && /Gulasz!/.test(l.t)), meal.log.map(l => [l.who, l.t.slice(0, 40)]));
        const hosted = await J("(function(){ const n = Needs.state(); n.food = 80; n.water = 80; $gameSystem.advanceDayNight(4); const withIt = [80 - n.food, 80 - n.water]; delete $gameSystem.buffs().hosted; n.food = 80; n.water = 80; $gameSystem.advanceDayNight(4); const without = [80 - n.food, 80 - n.water]; return { withIt, without }; })()");
        check("Ugoszczony: 4 hours take 30% less hunger and thirst", Math.abs(hosted.withIt[0] / hosted.without[0] - 0.7) < 0.02 && Math.abs(hosted.withIt[1] / hosted.without[1] - 0.7) < 0.02, hosted);
        await ev("Needs.setEnabled(false); 0");
        await setClock(3, 12);
        await setGold(3);
        await popups();
        const poor = await ev("TavernLife.meal('gulasz')");
        const poorPops = await popups();
        check("without the money: no meal, the gold untouched, 'Brakuje ci ... G' pops up over the player", poor === false && (await gold()) === 3 && poorPops.some(t => /^Brakuje ci \d+ G$/.test(t)), poorPops);
        await setGold(5);
        const poorCard = await talkTo(EV.counter, ["Zjedz coś"], 30, { card: "Gulasz" });
        const pc = poorCard.card || {};
        check("on the card the dishes too dear are greyed out; choosing one only buzzes (the card stays, then closes with P)", pc.card && pc.card.entries.some(e => !e.enabled) && pc.card.entries.some(e => e.enabled) && pc.ok === false, pc.card && pc.card.entries.map(e => [e.name, e.enabled]));
        await ev("TavernLife.cardChoose(null); 0");
        await until(calm, 20);
        check("the counter <Tavern:meal> (event 38) offers the meal and the room", (poorCard.choices[0] || []).join("|") === "Zjedz coś|Wynajmij pokój|Nic, dzięki", poorCard.choices);

        // ================= a room: rented at Borgar, up the stairs to Map025, in through its door, the candle, the night, out again
        await setClock(3, 21);
        await setGold(5);
        await popups();
        const noRoom = await ev("TavernLife.rentRoom(1)");
        const noRoomPops = await popups();
        check("no money for the room: no rent, 'Brakuje ci 3 G' over the player", noRoom === false && !(await ev("TavernLife.rentedRoom()")) && (await gold()) === 5 && noRoomPops.some(t => /Brakuje ci 3 G/.test(t)), noRoomPops);
        await setGold(100);
        const rooms = await J("TavernLife.rooms().map(r => r.room + ':' + r.price + ':' + r.minrep)");
        check("the rooms come from the beds' tags on Map025 / Map026: 1 (8 G), 2 (15), 3 (20), the chamber (30, from 60), the Apartament Złoty (50, from 80)", rooms.join("|") === "1:8:0|2:15:0|3:20:0|komnata:30:60|zloty:50:80", rooms);
        const doorsBefore = await J(`[$gameSelfSwitches.value([25, ${EV.door1}, "A"]), $gameSelfSwitches.value([25, ${EV.door2}, "A"])]`);
        check("before renting the doors on Map025 are shut (self switch A off)", doorsBefore.join() === "false,false", doorsBefore);
        const rent = await talkTo(EV.borgar, ["Wynajmij pokój"], 40, { card: "Pokój nr 1", shot: "uslugi_3_pokoje.png" });
        const rc = (rent.card && rent.card.card && rent.card.card.entries) || [];
        const rented = await J(`({ gold: $gameParty.gold(), rent: TavernLife.state().rent, d1: $gameSelfSwitches.value([25, ${EV.door1}, "A"]), d2: $gameSelfSwitches.value([25, ${EV.door2}, "A"]) })`);
        check("the rooms card lists the real rooms (the chamber and the Apartament greyed at reputation 0), the bed's name said once", rc.map(e => e.name).join("|") === "Pokój nr 1|Pokój nr 2|Pokój nr 3|Komnata z kominkiem|Apartament Złoty" &&
            rc.filter(e => !e.enabled).length === 2 && !/pokój nr/.test(rc[0].sub), rc.map(e => [e.name, e.right, e.enabled, e.sub]));
        check("room 1 rented at Borgar: 8 G, till 10:00 tomorrow; its door on Map025 opened (self switch A), room 2's not", 100 - rented.gold === 8 && rented.rent && String(rented.rent.room) === "1" && rented.rent.until === 4 * 24 + 10 &&
            rented.d1 === true && rented.d2 === false, rented);
        check("Borgar's word after renting", /Pokój nr 1 twój do rana/.test(rent.flat), rent.flat.slice(-120));
        // up the west staircase (its top steps are touch events -> Map025)
        await ev("$gamePlayer.locate(38, 79); $gamePlayer.setDirection(8); 0");
        await frames(6);
        const upstairs = await walk("up", onMap(MAP.rooms), 20);
        await ev(quiet);
        const land = await J("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
        check("up the stairs: Map025 'Pokoje gości', the landing (48,62)", upstairs && land.map === 25 && land.x === 48 && land.y === 62, land);
        const door1 = await J(`(function(){ const e = $gameMap.event(${EV.door1}); return { page: e._pageIndex, a: $gameSelfSwitches.value([25, ${EV.door1}, "A"]), candles: TavernLife.litCandles(), other: $gameMap.event(${EV.door2})._pageIndex }; })()`);
        check("upstairs: room 1's door is on its open page, room 2's on the locked one; room 1's candle is lit", door1.page === 1 && door1.a && door1.other === 0 && door1.candles.map(String).includes("1"), door1);
        await ev(`$gamePlayer.locate(38, 49); $gamePlayer.setDirection(8); 0`);
        await frames(6);
        const inRoom = await walk("up", "$gamePlayer.x === 38 && $gamePlayer.y === 44 && !$gameMap.isEventRunning()", 15);
        check("in through the door: its own page takes him inside (38,44)", inRoom, await J("[$gamePlayer.x, $gamePlayer.y]"));
        await ev(`$gamePlayer.locate(39, 40); $gamePlayer.setDirection(8); 0`);
        await frames(30);
        await b.shot(path.join(SHOTS, "uslugi_4_pokoj_swieca.png"));
        await popups();
        const twice = await talkTo(EV.bed2, [], 10);
        const notMine = await popups();
        check("the bed of room 2: 'To nie twój pokój' pops up over the player", notMine.some(t => /To nie twój pokój/.test(t)), notMine);
        // the night: no wolves may come even when they surely would outdoors
        await ev("window.__raids = 0; (function(){ const _r = Hunting.nightRaid; Hunting.nightRaid = function() { window.__raids++; return _r.apply(this, arguments); }; Hunting.RAID.calm = 1; Hunting.RAID._p = Hunting.RAID.perHour; Hunting.RAID.perHour = 10; })(); $gameSystem.setStamina(20); $gameParty.leader().setHp(10); 0");
        const bread0 = await ev("$gameParty.numItems($dataItems[83])");
        const night = await talkTo(EV.bed1, ["Śpij do rana"], 60);
        await until("$gameScreen.brightness() >= 255", 10);
        const morning = await J(`({ map: $gameMap.mapId(), day: $gameSystem.dayNightDay(), hour: $gameSystem.dayNightHour(), st: $gameSystem.stamina(), hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp, bread: $gameParty.numItems($dataItems[83]), raids: window.__raids, wolves: Hunting.animals.filter(a => a.kind() === 'wolf').length, banner: $gameTemp._lastDayBanner || '', slept: TavernLife.state().rent && TavernLife.state().rent.slept })`);
        await ev("Hunting.RAID.perHour = Hunting.RAID._p; 0");
        check("the bed asks 'Położyć się spać?' and he sleeps till the morning (day 4, 7:00) in his room", night.done && /Położyć się spać/.test(night.text) && morning.map === 25 && morning.day === 4 && Math.abs(morning.hour - 7) < 0.01, { text: night.text, morning });
        check("a full rest: stamina and health full; safe: no raid asked, no wolves", morning.st >= 99.9 && morning.hp === morning.mhp && morning.raids === 0 && morning.wolves === 0, morning);
        check("breakfast: a slice of bread by the bed, 'Borgar zostawił ci pajdę chleba'", morning.bread === bread0 + 1 && /Borgar zostawił ci pajdę chleba/.test(morning.banner), morning);
        await until(onMap(MAP.rooms), 20);
        await popups();
        await talkTo(EV.bed1, [], 10);
        const again = await popups();
        check("once a night: the bed says he has slept already", again.some(t => /Już się wyspałeś/.test(t)), again);
        // out through the room's own exit, then past 10:00 the door shuts
        await ev(`$gamePlayer.locate(38, 44); $gamePlayer.setDirection(2); 0`);
        await frames(6);
        const out = await walk("down", "$gamePlayer.x === 38 && $gamePlayer.y === 49 && !$gameMap.isEventRunning()", 15);
        await setClock(4, 9.5);
        await frames(40);
        const stillOpen = await ev(`$gameSelfSwitches.value([25, ${EV.door1}, "A"])`);
        await setClock(4, 10.5);
        await frames(40);
        const shut = await J(`({ a: $gameSelfSwitches.value([25, ${EV.door1}, "A"]), page: $gameMap.event(${EV.door1})._pageIndex, rent: TavernLife.rentedRoom(), candles: TavernLife.litCandles() })`);
        check("out through the room's exit; the door stays open till 10:00, then shuts (self switch A off, the locked page), the candle goes out", out && stillOpen === true && shut.a === false && shut.page === 0 && !shut.rent && !shut.candles.length, { out, stillOpen, shut });
        // with him inside when the rent ends, the door waits till he is out (the room's floor, found from its bed, walls all round)
        await ev("TavernLife.rentRoom(2); 0");
        await ev(`$gamePlayer.locate(58, 44); 0`);
        await frames(40);
        const inside0 = await ev(`$gameSelfSwitches.value([25, ${EV.door2}, "A"])`);
        await setClock(5, 11);
        await frames(40);
        const inside1 = await ev(`$gameSelfSwitches.value([25, ${EV.door2}, "A"])`);
        await ev(`$gamePlayer.locate(58, 49); 0`);
        await frames(40);
        const inside2 = await ev(`$gameSelfSwitches.value([25, ${EV.door2}, "A"])`);
        check("the rent over with him in room 2: the door stays open until he has left", inside0 === true && inside1 === true && inside2 === false, [inside0, inside1, inside2]);
        const twiceRent = await J("TavernLife.state().rooms");
        check("two rents counted", twiceRent === 2, twiceRent);
        // an Apartamenty door without a bed to rent: words only, the plugin leaves it alone
        await go(MAP.suites, 16, 21, 8);
        const suite = await talkTo(EV.suiteDoor, [], 20);
        check("Map026: a suite's door (room=suite1, no bed): only its own words, its self switch untouched", /Zamknięte\. Apartament można wynająć u Borgara/.test(suite.flat) && !(await ev(`$gameSelfSwitches.value([26, ${EV.suiteDoor}, "A"])`)), suite.flat);

        // ================= the bath with Wanda
        await go(MAP.hall, 6, 59, 8);
        await setClock(5, 14);
        await setGold(30);
        await ev("$gameSystem.setStamina(60); delete $gameSystem.buffs().clean; 0");
        const h0 = await ev("$gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour()");
        let inTub = null, tub = null;
        await ev("TavernLife.TL.waitScale = 1; 0");   // (the bath at its own pace: time for the picture)
        const bath = await talkTo(EV.tub, ["Wykąp się"], 60, { during: async () => {
            tub = await J(`({ x: $gameMap.event(${EV.tub}).x, y: $gameMap.event(${EV.tub}).y })`);
            await until("!!TavernLife.bathing && TavernLife.fx.some(f => f.kind === 'steam')", 20);
            await frames(70);   // (the "-6 G" over his head has floated away)
            inTub = await J(`({ x: $gamePlayer.x, y: $gamePlayer.y, water: TavernLife.fx.some(f => f.kind === 'water') })`);
            await b.shot(path.join(SHOTS, "uslugi_5_laznia.png"));
        } });
        await ev("TavernLife.TL.waitScale = 0.35; 0");
        const bathed = await J("({ gold: $gameParty.gold(), clean: $gameSystem.hasBuff('clean'), h: $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour(), baths: TavernLife.stats().baths, bathing: TavernLife.bathing, x: $gamePlayer.x, y: $gamePlayer.y, note: Journal.data().notes.some(n => n.title === 'Łaźnia') })");
        check("the bath: 6 G paid, an hour passed, 'Czysty' on, a note the first time", bath.done && bathed.gold === 24 && Math.abs(bathed.h - h0 - 1) < 0.1 && bathed.clean && bathed.baths === 1 && bathed.note, bathed);
        check("in the tub: he sits in the water at the tub (the water drawn round him), steam rises; afterwards back where he stood", inTub && tub && inTub.x === tub.x && inTub.y === tub.y && inTub.water && !bathed.bathing && bath.at && bathed.x === bath.at[0] && bathed.y === bath.at[1], { inTub, tub, after: [bathed.x, bathed.y], from: bath.at });
        check("Wanda (event 172, <Tavern:attendant>) speaks from her bust: the offer, then a funny word afterwards", bath.log.filter(l => l.who === EV.wanda && l.bust).length >= 2 && /Kąpiel\?/.test(bath.log[0].t), bath.log.map(l => [l.who, l.bust, l.t.slice(0, 40)]));
        await setGold(4);
        await popups();
        const poorBath = await talkTo(EV.tub, ["Wykąp się"], 20);
        const pbp = await popups();
        check("no money for the bath: 'Brakuje ci 2 G' over the player, no bath", poorBath.done && (await gold()) === 4 && pbp.some(t => /Brakuje ci 2 G/.test(t)) && (await ev("TavernLife.stats().baths")) === 1, pbp);

        // ================= Melia's song on the stage
        await go(MAP.hall, 72, 36, 8);
        await setGold(20);
        await setClock(5, 15);
        const early = await talkTo(EV.stage, [], 20);
        check("before 18:00 Melia only says when she sings", /Śpiewam wieczorami, od 18:00/.test(early.flat) && !early.choices.length, early.flat);
        await setClock(5, 19);
        const xp0 = await J("({ lv: Combat.hero().level, xp: Combat.hero().xp })");
        let singingShot = false;
        const song = await talkTo(EV.stage, ["Wrzuć"], 60, { during: async () => {
            if (await until("TavernLife.singing && TavernLife.fx.some(f => f.kind === 'note') && $gameMessage.hasText()", 20)) {
                await ev("window.__drv.holdAt = window.__drv.log.length; 0");
                await frames(40);
                await b.shot(path.join(SHOTS, "uslugi_6_piesn_melii.png"));
                singingShot = true;
                await ev("window.__drv.holdAt = -1; 0");
            }
        } });
        const sung = await J("({ gold: $gameParty.gold(), left: ($gameSystem.buffs().inspired || 0) - ($gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour()), st: TavernLife.stats(), note: (Journal.data().notes.find(n => n.title === 'Pieśni Melii') || {}).text || '' })");
        const verses = song.log.filter(l => l.who === EV.melia && /♪/.test(l.t));
        check("at 19:00 on the stage: 2 G tip, four verses (+ the refrain for the tip) in Melia's bubbles (event 2, her bust)", song.done && sung.gold === 18 && verses.length === 5 && verses.every(v => v.bust) && singingShot, { verses: verses.map(v => v.t.slice(0, 30)) });
        check("'Natchniony' for 6 hours with the tip; the first ballad heard; its lyrics in the journal's 'Pieśni Melii'", Math.abs(sung.left - 6) < 0.3 && sung.st.heard[0] === "kruk" && /Czarny kruku/.test(sung.note) && /w sercu skały/.test(sung.note), { left: sung.left, heard: sung.st.heard });
        await ev("Combat.gainXp(100, 'test'); 0");
        await frames(10);
        const xp1 = await J("({ lv: Combat.hero().level, xp: Combat.hero().xp })");
        const gained = xp1.lv === xp0.lv ? xp1.xp - xp0.xp : null;
        check("Natchniony: 100 experience brings 110", gained !== null && gained >= 110 && gained <= 116, { xp0, xp1, gained });
        const twiceSong = await talkTo(EV.stage, [], 20);
        check("once an evening: a second time she says she has sung today (no choice, no second buff)", /Dziś już śpiewałam/.test(twiceSong.flat) && !twiceSong.choices.length && (await ev("TavernLife.stats().songs")) === 1, twiceSong.flat);
        await setClock(6, 20);
        const song2 = await talkTo(EV.stage, ["Posłuchaj za darmo"], 60);
        const sung2 = await J("({ gold: $gameParty.gold(), left: ($gameSystem.buffs().inspired || 0) - ($gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour()), heard: TavernLife.stats().heard })");
        check("the next evening the next ballad ('Jedno pytanie'), free: 4 hours, no gold taken", /Jedno pytanie/.test(song2.text) && sung2.gold === 18 && Math.abs(sung2.left - 4) < 0.3 && sung2.heard.join() === "kruk,pytanie", sung2);
        await setClock(7, 19);
        await setGold(1);
        const song3 = await talkTo(EV.stage, ["Wrzuć"], 60);
        const sung3 = await J("({ gold: $gameParty.gold(), left: ($gameSystem.buffs().inspired || 0) - ($gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour()) })");
        check("a tip without the money: 'Pusta sakiewka? Nie szkodzi' - she sings anyway, 4 hours, nothing taken", /Pusta sakiewka\? Nie szkodzi/.test(song3.flat) && sung3.gold === 1 && Math.abs(sung3.left - 4) < 0.3, { text: song3.flat.slice(0, 80), sung3 });

        // ================= arm-wrestling with Grum (seeded bots)
        await go(MAP.hall, 92, 39, 8);
        const armBot = mode => ev(`(function(){ window.__bt = 0; window.__endOk = true; TavernLife.onTick = function(scene) { const I = Input._currentState; I.ok = false; const s = scene.state(); window.__bt++;
            if (s.phase === "card" || (s.phase === "summary" && window.__endOk)) { if (window.__bt % 8 === 0) I.ok = true; return; }
            if (s.phase === "pull" && ${JSON.stringify(mode)} === "good") I.ok = s.n < (s.lo + s.hi) / 2 - 0.015; }; return 0; })()`);
        await setGold(50);
        await ev("$gameSystem.setStamina(100); 0");
        await armBot("good");
        await ev("window.__endOk = false; 0");
        const lv0 = await ev("TavernLife.stats().arm.level");
        await ev("TavernLife.armWrestle({ stake: 10, seed: 11, turbo: 6 }); 0");
        await until("TavernLife.gameState() && TavernLife.gameState().phase === 'pull' && TavernLife.gameState().b > 0.25", 30);
        await ev("SceneManager._scene.turbo = 1; 0");
        await frames(20);
        await b.shot(path.join(SHOTS, "uslugi_7_silowanie.png"));
        await ev("SceneManager._scene.turbo = 6; 0");
        await until("TavernLife.gameState() && TavernLife.gameState().phase === 'summary'", 60);
        await ev("SceneManager._scene.turbo = 1; 0");
        await frames(30);
        await b.shot(path.join(SHOTS, "uslugi_8_silowanie_wygrana.png"));
        await ev("window.__endOk = true; 0");
        await until(onMap(MAP.hall), 30);
        await frames(20);
        const armWin = await J("({ gold: $gameParty.gold(), r: TavernLife.lastResult, st: TavernLife.stats().arm })");
        check("arm-wrestling, a good bot (seed 11): won 2 rounds, +10 G, Grum takes it harder next time", armWin.r && armWin.r.won && armWin.r.you === 2 && armWin.gold === 60 && armWin.st.won === 1 && armWin.st.level === lv0 + 1, armWin);
        await armBot("bad");
        await ev("TavernLife.armWrestle({ stake: 20, seed: 12, turbo: 8 }); 0");
        await until("TavernLife.gameState() && TavernLife.gameState().phase === 'summary'", 60);
        await until(onMap(MAP.hall), 40);
        await frames(20);
        const armLose = await J("({ gold: $gameParty.gold(), r: TavernLife.lastResult, st: TavernLife.stats().arm })");
        check("arm-wrestling, a bot that does nothing (seed 12): lost 0:2, −20 G", armLose.r && !armLose.r.won && armLose.r.grum === 2 && armLose.r.you === 0 && armLose.gold === 40 && armLose.st.lost === 1, armLose);
        await armBot("good");
        await ev("TavernLife.TL.gameTurbo = 6; 0");
        const armTalk = await talkTo(EV.arm, ["Stawka 5 G"], 90);
        await ev("TavernLife.TL.gameTurbo = 1; 0");
        check("at the real table (event 148): Grum asks for a stake, the game runs, the talk ends on the map with the stake won", armTalk.done && (armTalk.choices[0] || []).join("|") === "Stawka 5 G|Stawka 10 G|Stawka 20 G|Nie teraz" && armTalk.log.some(l => l.who === EV.grum) && (await gold()) === 45, { choices: armTalk.choices, gold: await gold() });
        await setGold(3);
        await popups();
        await talkTo(EV.arm, ["Stawka 10 G"], 20);
        const armPoor = await popups();
        check("no money for the stake: 'Brakuje ci 7 G', no game", armPoor.some(t => /Brakuje ci 7 G/.test(t)) && !(await ev("!!TavernLife.gameState()")), armPoor);
        await ev("TavernLife.onTick = null; 0");

        // ================= darts (seeded bots)
        await go(MAP.hall, 89, 59, 8);
        const dartBot = mode => ev(`(function(){ window.__bt = 0; window.__endOk = true; TavernLife.onTick = function(scene) { const I = Input._currentState; I.ok = false; I.left = false; const s = scene.state(); window.__bt++;
            if (s.phase === "card" || (s.phase === "summary" && window.__endOk)) { if (window.__bt % 8 === 0) I.ok = true; return; }
            if (s.phase !== "aim") return;
            if (${JSON.stringify(mode)} === "good") { if (scene.phaseT > 12 && Math.hypot(s.cross.x - s.centre.x, s.cross.y - s.centre.y) < 5) I.ok = true; }
            else { if (scene.phaseT < 90) I.left = true; else if (scene.phaseT > 96) I.ok = true; } }; return 0; })()`);
        await setGold(40);
        await dartBot("good");
        await ev("window.__endOk = false; 0");
        await ev("TavernLife.darts({ stake: 15, seed: 21, turbo: 4, opponent: 'ozzy' }); 0");
        await until("TavernLife.gameState() && TavernLife.gameState().round === 2 && TavernLife.gameState().phase === 'aim' && TavernLife.gameState().dart === 1", 60);
        await ev("SceneManager._scene.turbo = 1; 0");
        await frames(12);
        await b.shot(path.join(SHOTS, "uslugi_9_rzutki.png"));
        await ev("SceneManager._scene.turbo = 4; 0");
        await until("TavernLife.gameState() && TavernLife.gameState().phase === 'summary'", 90);
        await ev("SceneManager._scene.turbo = 1; 0");
        await frames(30);
        await b.shot(path.join(SHOTS, "uslugi_10_rzutki_wynik.png"));
        await ev("window.__endOk = true; 0");
        await until(onMap(MAP.hall), 30);
        await frames(20);
        const dWin = await J("({ gold: $gameParty.gold(), r: TavernLife.lastResult, st: TavernLife.stats().darts })");
        check("darts vs Ozzy, a good bot (seed 21): the higher total, +15 G", dWin.r && dWin.r.won && dWin.r.score > dWin.r.opp && dWin.gold === 55 && dWin.st.won === 1, { you: dWin.r && dWin.r.score, opp: dWin.r && dWin.r.opp, gold: dWin.gold });
        await dartBot("bad");
        await ev("TavernLife.darts({ stake: 5, seed: 22, turbo: 6, opponent: 'wiesiek' }); 0");
        await until("TavernLife.gameState() && TavernLife.gameState().phase === 'summary'", 120);
        await until(onMap(MAP.hall), 40);
        await frames(20);
        const dLose = await J("({ gold: $gameParty.gold(), r: TavernLife.lastResult, st: TavernLife.stats().darts })");
        check("darts vs Wiesiek, a bot throwing off the board (seed 22): 0 points, lost, −5 G", dLose.r && !dLose.r.won && dLose.r.score === 0 && dLose.gold === 50 && dLose.st.lost === 1, { you: dLose.r && dLose.r.score, opp: dLose.r && dLose.r.opp, gold: dLose.gold });
        const scoring = await J("[TavernLife.dartScore(0, 0), TavernLife.dartScore(20, 0), TavernLife.dartScore(0, -100), TavernLife.dartScore(0, 100), TavernLife.dartScore(100, 0), TavernLife.dartScore(0, -200)]");
        check("the scoring: bull 50, the ring 25, the top wedge 20, bottom 3, right 6, off the board 0", scoring.join() === "50,25,20,3,6,0", scoring);
        const dTalk = await talkTo(EV.darts, ["Z Dziadkiem Ozzym", "Nie teraz"], 20);
        check("at the real darts line (event 174): the choice of the opponent, then Ozzy (event 4) asks for the stake", (dTalk.choices[0] || []).join("|") === "Z Dziadkiem Ozzym|Z furmanem Wieśkiem|Nie teraz" && dTalk.log.some(l => l.who === EV.ozzy && /Ile stawiasz/.test(l.t)), { choices: dTalk.choices });
        await setGold(3);
        await popups();
        await talkTo(EV.darts, ["Z Dziadkiem Ozzym", "Stawka 15 G"], 20);
        const dPoor = await popups();
        check("no money for the darts' stake: 'Brakuje ci 12 G', no game", dPoor.some(t => /Brakuje ci 12 G/.test(t)) && !(await ev("!!TavernLife.gameState()")), dPoor);
        await ev("TavernLife.onTick = null; 0");

        // ================= the tavern's reputation (QuestBoard.js): discounts, the big chamber, the gilded gate, the Apartament Złoty
        const setRep = n => ev(`(function(){ QuestBoard.state().rep = ${n}; return QuestBoard.reputation(); })()`);
        await setClock(12, 19);
        await setGold(300);
        await setRep(10);
        const r10 = await J("({ d: TavernLife.repDiscount(), bath: TavernLife.bathPrice(), room1: TavernLife.roomPrice(1), komnata: TavernLife.roomPrice('komnata'), tier: TavernLife.repTier() })");
        check("reputation 10 (Nowy w okolicy): no discount (bath 6 G, room 1: 8 G, the chamber 30 G)", r10.d === 0 && r10.bath === 6 && r10.room1 === 8 && r10.komnata === 30 && r10.tier === 0, r10);
        await popups();
        const noKomnata = await ev("TavernLife.rentRoom('komnata')");
        const nkPops = await popups();
        check("below 60 the chamber cannot be rented: 'tylko dla stałych, zaufanych gości (sława „Pewna ręka”)'", noKomnata === false && (await gold()) === 300 && nkPops.some(t => /tylko dla stałych, zaufanych gości \(sława „Pewna ręka”\)/.test(t)), nkPops);
        await go(MAP.rooms, 67, 18, 8);
        const kDoor = await talkTo(EV.komnataDoor, [], 20);
        check("Map025, the chamber's door below the reputation: „Komnatę wynajmujemy tylko stałym, zaufanym gościom.”", /Komnatę wynajmujemy tylko stałym, zaufanym gościom/.test(kDoor.flat) && !(await ev(`$gameSelfSwitches.value([25, ${EV.komnataDoor}, "A"])`)), kDoor.flat);
        const gate0 = await talkTo(EV.gate, [], 20);
        check("the gilded gate below 80: „Apartamenty tylko dla dostojnych gości.” and it stays shut", /Apartamenty tylko dla dostojnych gości/.test(gate0.flat) && !(await ev(`$gameSelfSwitches.value([25, ${EV.gate}, "A"])`)), gate0.flat);
        await go(MAP.hall, 49, 70, 8);
        await setRep(45);
        const m45 = await talkTo(EV.counter, ["Zjedz coś"], 30, { card: "close" });
        const p45 = await J("({ d: TavernLife.repDiscount(), g: TavernLife.priceOf(TavernLife.DISHES[0]) })");
        const e45 = (m45.card && m45.card.card && m45.card.card.entries) || [];
        check("reputation 45 (Swój chłop): Borgar says it once - 5% off everything", p45.d === 0.05 && m45.log.some(l => l.who === 1 && /Swój chłop z ciebie/.test(l.t)), m45.log.map(l => l.t.slice(0, 60)));
        check("on the card the old prices are crossed out beside the new ones, the foot says why", e45[0] && e45[0].right === p45.g + " G" && e45[0].oldRight === "16 G" && p45.g < 16 && /Swój chłop/.test(m45.card.card.foot || ""), e45.slice(0, 2));
        const m45b = await talkTo(EV.counter, ["Zjedz coś"], 30, { card: "close" });
        check("...and does not repeat it the next time", !m45b.log.some(l => /Swój chłop z ciebie/.test(l.t)), m45b.log.map(l => l.t.slice(0, 50)));
        await setRep(65);
        const gold65 = await gold();
        const k65 = await talkTo(EV.borgar, ["Wynajmij pokój"], 40, { card: "Komnata", shot: "uslugi_11_pokoje_slawa.png" });
        const kk = await J(`({ gold: $gameParty.gold(), rent: TavernLife.state().rent, a: $gameSelfSwitches.value([25, ${EV.komnataDoor}, "A"]), zlotyA: $gameSelfSwitches.value([26, ${EV.zlotyDoor}, "A"]) })`);
        const kEntries = (k65.card && k65.card.card && k65.card.card.entries) || [];
        check("reputation 65 (Pewna ręka): Borgar's word; the chamber on the card for 27 G (30 crossed out), the Apartament Złoty greyed", k65.log.some(l => /Pewna ręka/.test(l.t)) &&
            kEntries.some(e => /Komnata/.test(e.name) && e.enabled && e.right === "27 G" && e.oldRight === "30 G") && kEntries.some(e => /Apartament Złoty/.test(e.name) && !e.enabled), kEntries.map(e => [e.name, e.right, e.oldRight, e.enabled]));
        check("the chamber rented: 27 G, its door on Map025 opened, the Apartament's on Map026 not; Borgar: the fire lit, the bear shaken out", gold65 - kk.gold === 27 && kk.rent && kk.rent.room === "komnata" && kk.a === true && kk.zlotyA === false && /wytrzepać niedźwiedzia/.test(k65.flat), { gold: [gold65, kk.gold], rent: kk.rent, a: kk.a });
        await go(MAP.rooms, 67, 17, 8);
        const inKomnata = await walk("up", "$gamePlayer.x === 67 && $gamePlayer.y === 12 && !$gameMap.isEventRunning()", 15);
        check("upstairs the chamber's door lets him in (67,12)", inKomnata, await J("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]"));
        const perk0 = await ev("Combat.perk('sleep.rest')");
        const bread1 = await ev("$gameParty.numItems($dataItems[83])"), cheese1 = await ev("$gameParty.numItems($dataItems[124])");
        const kNight = await talkTo(EV.komnataBed, ["Śpij do rana"], 60);
        await until("$gameScreen.brightness() >= 255", 10);
        const kMorning = await J("({ rested: ($gameSystem.buffs().rested || 0) - ($gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour()), perk: Combat.perk('sleep.rest'), bread: $gameParty.numItems($dataItems[83]), cheese: $gameParty.numItems($dataItems[124]), banner: $gameTemp._lastDayBanner || '' })");
        check("a night in the chamber: 'Wypoczęty' for 8 hours - resting gives 25% more (the perk the rests ask), bread and cheese", kNight.done && Math.abs(kMorning.rested - 8) < 0.1 &&
            Math.abs(kMorning.perk - perk0 - 0.25) < 1e-9 && kMorning.bread === bread1 + 1 && kMorning.cheese === cheese1 + 1 && /kominku/.test(kMorning.banner), kMorning);
        // 85: the gate on Map025 opens by itself, with a welcome when he comes by
        await setClock(13, 11);
        await setRep(85);
        await go(MAP.rooms, 92, 18, 8);
        await frames(60);
        const g85 = await J(`({ a: $gameSelfSwitches.value([25, ${EV.gate}, "A"]), page: $gameMap.event(${EV.gate})._pageIndex, barks: SpeechBubbles.log.slice(-4), note: Journal.data().notes.some(n => n.title === 'Apartamenty'), notice: window.__notices.find(t => /Apartamenty/.test(t)) || '' })`);
        check("reputation 85 (Chluba tawerny): the gilded gate opens by itself and stays open, with a welcome (the bell, a word, a note)", g85.a === true && g85.page === 1 && g85.barks.some(t => /Witamy w Apartamentach/.test(t)) && g85.note && /Apartamenty/.test(g85.notice), g85);
        const upToSuites = await walk("up", onMap(MAP.suites), 25);
        check("...through the open gate and up the stairs to Map026 'Apartamenty'", upToSuites, await J("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]"));
        await ev(quiet);
        await setClock(13, 21);
        await ev("if (window.Needs) { Needs.setEnabled(true); const n = Needs.state(); n.food = 40; n.water = 40; } 0");
        const gold85 = await gold();
        const zRent = await ev("TavernLife.rentRoom('zloty')");
        check("the Apartament Złoty rented at 85: 43 G (50 − 15%); its door opens", zRent === true && gold85 - (await gold()) === 43 && (await ev(`$gameSelfSwitches.value([26, ${EV.zlotyDoor}, "A"])`)), { gold: [gold85, await gold()] });
        await ev(`$gamePlayer.locate(67, 29); $gamePlayer.setDirection(2); 0`);
        await frames(20);
        const inZloty = await walk("down", "$gamePlayer.x === 67 && $gamePlayer.y === 35 && !$gameMap.isEventRunning()", 15);
        check("in through the Apartament's door (67,35)", inZloty, await J("[$gamePlayer.x, $gamePlayer.y]"));
        const zNight = await talkTo(EV.zlotyBed, ["Śpij do rana"], 60);
        await until("$gameScreen.brightness() >= 255", 10);
        await frames(30);
        const zMorning = await J("({ rested: ($gameSystem.buffs().rested || 0) - ($gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour()), hosted: $gameSystem.hasBuff('hosted'), food: Needs.state().food, water: Needs.state().water, tray: TavernLife.fx.some(f => f.kind === 'tray'), banner: $gameTemp._lastDayBanner || '' })");
        check("a night in the Apartament Złoty: breakfast in bed (hunger and thirst down, Ugoszczony, the tray on the blanket), Wypoczęty for 12 hours", zNight.done && zMorning.hosted && zMorning.food >= 70 && zMorning.water >= 48 && zMorning.tray &&
            Math.abs(zMorning.rested - 12) < 0.1 && /Śniadanie do łóżka, na srebrnej tacy/.test(zMorning.banner), zMorning);
        await frames(20);
        await b.shot(path.join(SHOTS, "uslugi_12_apartament_sniadanie.png"));
        await ev("Needs.setEnabled(false); 0");
        await go(MAP.hall, 6, 59, 8);
        await setClock(14, 15);
        const bath85 = await talkTo(EV.tub, ["Nie teraz"], 20);
        check("the bath at 85: 'Wykąp się (5 G zamiast 6 G)'", (bath85.choices[0] || [])[0] === "Wykąp się (5 G zamiast 6 G)", bath85.choices);

        // ================= the numbers, the saved game, the console
        const stats = await J("TavernLife.stats()");
        check("the numbers in $gameSystem._tavernLife (meals, rooms, nights, baths, songs, games, firsts)", stats.meals === 1 && stats.rooms === 4 && stats.nights === 3 && stats.baths === 1 && stats.songs === 3 && stats.arm.played === 3 && stats.darts.played === 2 &&
            ["meal", "room", "bath", "arm", "darts"].every(k => stats.firsts[k] > 0), stats);
        const round = await J("(function(){ const c = JsonEx.parse(JsonEx.stringify($gameSystem)); return !!c._tavernLife && c._tavernLife.meals === 1; })()");
        check("it goes into the saved game (JsonEx round trip)", round);
        check("the API: TavernLife.buffs lists the premia", (await J("Object.keys(TavernLife.buffs)")).join() === "clean,inspired,hosted,rested");
        const errs = b.logs.filter(l => /^EXC|TypeError|ReferenceError|is not a function|Cannot read/.test(l));
        check("no console errors", errs.length === 0, errs.slice(0, 5));
        const retries = await J("window.__retries");
        if (retries.length) console.log("(the server dropped " + retries.length + " file(s), Retry pressed: " + retries.join(" | ") + ")");
    } catch (e) {
        console.log("ERROR " + e.message);
        results.push(false);
        try { await b.shot(path.join(SHOTS, "uslugi_blad.png")); } catch (_) {}
        console.log(b.logs.filter(l => l !== "Object").slice(-15).join("\n"));
        try { console.log("STATE " + JSON.stringify(await J("({ scene: SceneManager._scene && SceneManager._scene.constructor.name, map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, running: $gameMap.isEventRunning(), msg: $gameMessage.isBusy(), busy: TavernLife.busy(), ev: $gameMap._interpreter._eventId, wait: $gameMap._interpreter._waitMode })"))); } catch (_) {}
    }
    const passed = results.filter(Boolean).length;
    console.log(passed + "/" + results.length + " passed");
    await b.close();
    process.exit(passed === results.length ? 0 : 1);
})();
