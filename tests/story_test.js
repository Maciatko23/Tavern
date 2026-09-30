// The story start (Story.js): a new game begins in grandpa's house with his talk about the debt (2500 G to Lord Zaleski by day 60),
// the journal gets chapter 1, the way in to the tavern is walked (Polna droga -> Okolice Tawerny -> the door), Borgar hires the hero
// and gives a shift (TavernShift.js), the Lord takes the money (a part, then all: chapter 1 ends), letters come on the way, the debt
// counts till dawn after the deadline (a late shift on the last day, the butler at night), an unpaid debt at dawn ends the game (not
// while the hero still sits resting), an old-style game (begun elsewhere) has no story at all, and a game saved in the middle of a talk
// loads fine. The talks run as ordinary event commands in speech bubbles; a driver in the page presses O and picks the choices the
// test names. The payments and the steps of chapter 1 are told on the Tawerna bus (debtPayment, debtPaid, storyStep).
// (Loads Story.js into the page when js/plugins.js does not have it.) Screenshots: docs/nowy_start/fabula_*.png
//   CDP_PORT=9350 node tests/story_test.js
const { launch, sleep } = require("./cdp.js");
const fs = require("fs");
const path = require("path");
const SHOTS = path.join(__dirname, "..", "docs", "nowy_start");

// the driver: every map frame it presses O on a message (every 4th frame) and answers a choice with the next label from `picks`
// (a prefix); with no pick left it waits at the choice (the test reads `waiting`). Every message shown is logged with the one it
// is drawn over (0 the hero, an event id, null the plain window).
const DRIVER = String.raw`
(function() {
    if (window.__drv) return;
    const T = window.__drv = { on: false, f: 0, picks: [], log: [], choices: [], waiting: null, holdAt: -1, missing: [] };
    const _startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() {
        _startMessage.call(this);
        const b = this._bubbleOf;
        T.log.push({ t: $gameMessage.allText().replace(/ /g, " "), who: b ? (b === $gamePlayer ? 0 : b.eventId()) : null, map: $gameMap.mapId() });   // (Story keeps "79 G" together with a no-break space)
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
                // (no O on a message with choices: a press landing as the choices open would take the first one)
                if (T.f % 4 === 0) I.ok = true;
            }
        }
        _update.call(this);
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
    const until = async (cond, secs) => { const t0 = Date.now(); while (Date.now() - t0 < secs * 1000) { if (await ev(cond).catch(() => false)) return true; await sleep(250); } return false; };
    const onMap = id => `(SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && $gameMap.mapId() === ${id})`;
    const calmMap = "(!$gameMap.isEventRunning() && !$gameMessage.isBusy())";
    const quiet = "(function(){ if (window.Needs) Needs.setEnabled(false); if (window.Hunting) { Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); } if (window.Livestock) Livestock.auto(false); if (window.Dog) Dog.auto(false); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather(); $gameSystem._minimapHidden = true; return 0; })()";
    const go = async (map, x, y, dir) => {
        await ev(`(function(){ $gamePlayer.reserveTransfer(${map}, ${x}, ${y}, ${dir || 2}, 0); return 0; })()`);
        const ok = await until(onMap(map), 40);
        await frames(20);
        await ev(quiet);
        return ok;
    };
    // talks to an event (the hero put in front of it) and waits till the talk is over; picks: the choices to take
    const talkTo = async (evExpr, picks, secs, shotAtChoice) => {
        await ev(`(function(){ const T = window.__drv; T.on = true; T.picks = ${JSON.stringify(shotAtChoice ? [] : picks || [])}; T.waiting = null; T.mark = T.log.length; T.cmark = T.choices.length; T.missing = [];
            const e = ${evExpr}; const p = $gamePlayer; const spots = [[0, 1, 8], [0, -1, 2], [-1, 0, 6], [1, 0, 4]];
            for (const [dx, dy, d] of spots) { const x = e.x + dx, y = e.y + dy; if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXy(x, y).some(o => o !== e && o.isNormalPriority() && !o.isThrough())) { p.locate(x, y); p.setDirection(d); break; } }
            e.start(); return 0; })()`);
        await frames(4);
        if (shotAtChoice) {   // (it waits at the first choice: a screenshot, then the picks)
            await until("!!window.__drv.waiting", 30);
            await frames(20);
            await b.shot(path.join(SHOTS, shotAtChoice));
            await ev(`window.__drv.picks = ${JSON.stringify(picks || [])}; 0`);
        }
        const done = await until(`!$gameMap.isEventRunning() && !$gameMessage.isBusy() && !(window.TavernShift && TavernShift.isRunning()) && SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()`, secs || 30);
        const out = await J("({ log: window.__drv.log.slice(window.__drv.mark), choices: window.__drv.choices.slice(window.__drv.cmark), missing: window.__drv.missing, waiting: window.__drv.waiting })");
        out.done = done;
        out.text = out.log.map(l => l.t).join(" / ");
        return out;
    };
    // walks: the arrow key held until the map changes (the transfers are the maps' own events)
    const walkTo = async (key, map, secs) => {
        await ev(`(function(){ if ($gameMessage.isBusy()) $gameMessage.clear(); Input.clear(); Input._currentState["${key}"] = true; return 0; })()`);
        const ok = await until(onMap(map), secs || 20);
        await ev(`(function(){ Input._currentState["${key}"] = false; return 0; })()`);
        await frames(20);
        await ev(quiet);
        return ok;
    };
    // the story's driven shift: every part skipped with a score of 90, O on the cards
    const driveShift = () => ev(`(function(){ window.__shiftT = 0; window.__shiftIntro = "";
        TavernShift.onTick = function(scene) { const st = TavernShift.state(), I = Input._currentState; I.ok = false; if (!st) return; if (!window.__shiftIntro) window.__shiftIntro = scene.opts.intro;
            if (st.phase === "play") TavernShift.skip(90); else if (++window.__shiftT % 8 === 0) I.ok = true; }; return 0; })()`);
    const menuLine = async () => {
        await ev("SceneManager.push(Scene_Menu); 0");
        await until("SceneManager._scene instanceof Scene_Menu && SceneManager._scene._started && !SceneManager.isSceneChanging()", 15);
        await frames(10);
        const r = await J("({ line: Story.lastMenuLine, label: Story.lastMenuLabel })");
        await ev("SceneManager.pop(); 0");
        await until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 15);
        await frames(10);
        return r;
    };
    // (from the title, as the game does: a new game set up under a running map scene leaves that scene's sprites on a new, empty map)
    const toTitle = async () => {
        await ev("(function(){ window.__drv.on = false; if (!(SceneManager._scene instanceof Scene_Title)) SceneManager.goto(Scene_Title); return 0; })()");
        return until("SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && !SceneManager.isSceneChanging()", 30);
    };
    // (the story's start - grandpa's cottage beside the hero's straw bed - set in the page: data/System.json may point elsewhere
    // while the user tests something, e.g. the tavern)
    const START = [19, 2, 5];
    const newStoryGame = async () => {
        await toTitle();
        await ev(`(function(){ window.__drv.on = false; Object.assign($dataSystem, { startMapId: ${START[0]}, startX: ${START[1]}, startY: ${START[2]} }); DataManager.setupNewGame(); SceneManager.goto(Scene_Map); return 0; })()`);
        const ok = await until(onMap(19), 40);
        await ev(quiet);
        return ok;
    };
    fs.mkdirSync(SHOTS, { recursive: true });
    try {
        // ---- boot (a busy server sometimes leaves the page half-loaded: go again)
        let booted = false;
        for (let a = 0; a < 4 && !booted; a++) {
            await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
            for (let i = 0; i < 120; i++) {
                if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title' && DataManager._globalInfo)").catch(() => false)) { booted = true; break; }
                await sleep(500);
            }
        }
        check("the game boots", booted);
        const loaded = await ev(`new Promise(res => { if (window.Story) return res(true); const s = document.createElement("script"); s.src = "js/plugins/Story.js?" + Date.now(); s.onload = () => res(!!window.Story); s.onerror = () => res(false); document.body.appendChild(s); })`);
        check("Story.js loads into the page", loaded);
        await ev(DRIVER + "; 0");
        // the steps of chapter 1 on the Tawerna bus (storyStep { step }), noted from here on
        await ev("window.__steps = []; Tawerna.on('storyStep', e => window.__steps.push(e.step), { owner: 'StoryTest' }); 0");

        // ================= 1. a new game: grandpa's house and the intro
        const started = await newStoryGame();
        const st0 = await J("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, s: $gameSystem._story })");
        check("a new game starts in grandpa's house (Map019, 2,5 - beside the hero's straw bed)", started && st0.map === 19 && st0.x === 2 && st0.y === 5, { map: st0.map, x: st0.x, y: st0.y });
        check("the story state: debt 2500, nothing paid, deadline day 60, not pending", st0.s && st0.s.debt === 2500 && st0.s.paid === 0 && st0.s.deadline === 60 && !st0.s.pending && Array.isArray(st0.s.payments), st0.s);
        const gp = await J("(function(){ const e = $gameMap.event(901); return e && { name: e.event().name, sheet: e.characterName(), index: e.characterIndex(), x: e.x, y: e.y, list: e.list().length }; })()");
        check("grandpa Stach is in his house ($Npc_Dziadek - the hero's style, by his armchair)", gp && gp.name === "Dziadek Stach" && gp.sheet === "$Npc_Dziadek" && gp.index === 0 && gp.x === 10 && gp.y === 6, gp);   // (Story NPCS.grandpa.at: on the rug beside his rocking chair)
        // the intro starts by itself after the fade-in; the driver holds at the 3rd message for a screenshot
        await ev("window.__drv.on = true; window.__drv.picks = []; window.__drv.mark = window.__drv.log.length; window.__drv.holdAt = window.__drv.log.length + 3; 0");
        const introOn = await until("$gameMap.isEventRunning() && $gameSystem._story.intro === 1", 20);
        check("the intro begins by itself once the screen is bright", introOn);
        await until("window.__drv.log.length >= window.__drv.holdAt && $gameMessage.hasText() && SceneManager._scene._messageWindow.isOpen()", 20);
        await frames(30);
        await b.shot(path.join(SHOTS, "fabula_1_dziadek.png"));
        await ev("window.__drv.holdAt = -1; 0");
        await until(`$gameSystem._story.intro === 2 && ${calmMap}`, 60);
        const intro = await J("({ log: window.__drv.log.slice(window.__drv.mark), s: $gameSystem._story, soup: $gameParty.numItems($dataItems[131]), notes: $gameSystem._journal.notes.map(n => n.title) })");
        const introText = intro.log.map(l => l.t).join(" / ");
        check("the intro: grandpa and the hero talk in bubbles (grandpa over 901, the hero over 0), 10 messages", intro.log.length === 10 && intro.log[0].who === 901 && intro.log[1].who === 0 && intro.log.filter(l => l.who === 0).length === 3,
            intro.log.map(l => l.who));
        check("it tells the debt (2500, Lord Zaleski, day 60), the field (build only there), the tavern job (Borgar, afternoons and evenings)",
            /2500/.test(introText) && /Lordowi Zaleskiemu/.test(introText) && /Termin: dzień 60/.test(introText) && /stawiaj na nim/.test(introText) && /Tylko tam/.test(introText) && /Borgar/.test(introText) &&
            /po południu i wieczorem/.test(introText) && /A pieniądze\.\.\./.test(introText) && !/Hrabi/.test(introText), introText.slice(0, 200));
        const note = await ev("($gameSystem._journal.notes.find(n => n.title === 'Dług dziadka Stacha') || {}).text || ''");
        check("after the intro: talk done, a cabbage soup from grandpa, a journal note (with the way to the field and to the tavern, the dawn rule)", intro.s.intro === 2 && intro.s.flags.talk && intro.soup === 1 &&
            /Droga na pole:/.test(note) && /Droga do tawerny: podwórze - Leśna droga - Polna droga - ścieżką na północ/.test(note) && /na wschód od tawerny/.test(note) && /do świtu/.test(note),
            { flags: intro.s.flags, soup: intro.soup, note });
        await ev("Journal.evaluateGoals(); 0");
        const jr = await J(`(function(){ const G = Journal.GOALS, ids = G.map(g => g.id), story = G.filter(g => g.story), at = id => ids.indexOf(id);
            return { chapter: Journal.CHAPTERS[story[0] && story[0].ch], ids: story.map(g => g.id), first: ids.slice(0, 4), debtAfter: ids[at('story_debt') - 1], debtBefore: ids[at('story_debt') + 1], cellarBefore: ids[at('story_debt') + 2],
                shelterAfter: ids[at('story_shelter') - 1], cur: Journal.currentGoal().id,
                talkDone: Journal.goalDone(G.find(g => g.id === 'story_talk')), debtTitle: G.find(g => g.id === 'story_debt').title, debtLine: Journal.goalProgress(G.find(g => g.id === 'story_debt')),
                listed: Journal.itemsForTab(0).map(i => i.label).slice(0, 4) }; })()`);
        check("the journal has chapter 'Rozdział 1: Dług dziadka' with its goals (talk, field, work, shift, shelter, debt)", jr.chapter === "Rozdział 1: Dług dziadka" &&
            ["story_talk", "story_field", "story_work", "story_shift", "story_shelter", "story_debt"].every(i => jr.ids.includes(i)), jr);
        check("the tracker's order: talk, field, the job, the shift first; the shelter after the workbench; the debt right after the first steps (campfire), then the clue, before the sawmill",
            jr.first.join() === "story_talk,story_field,story_work,story_shift" && jr.shelterAfter === "workbench" && jr.debtAfter === "campfire" && jr.debtBefore === "story_cellar" && jr.cellarBefore === "sawmill", jr);
        check("'Porozmawiaj z dziadkiem' is done; the tracker now says go to the field; the debt goal shows 0/2500 and the days", jr.talkDone && jr.cur === "story_field" && jr.debtTitle === "Spłać dług dziadka (0/2500 G)" && /zostało 60 dni/.test(jr.debtLine), jr);

        // ---- the P menu: a line with the debt on the card
        await ev("SceneManager.push(Scene_Menu); 0");
        await until("SceneManager._scene instanceof Scene_Menu && SceneManager._scene._started && !SceneManager.isSceneChanging()", 15);
        await frames(20);
        await b.shot(path.join(SHOTS, "fabula_2_menu_dlug.png"));
        const ml = await J("({ line: Story.lastMenuLine, label: Story.lastMenuLabel })");
        check("the P menu's foot shows the debt with its label (DŁUG DZIADKA, 0 / 2500 G, day 60, days left)", /^0 \/ 2500 G\s+·\s+do dnia 60\s+·\s+zostało 60 dni$/.test(ml.line) && ml.label === true, ml);
        await ev("SceneManager.pop(); 0");
        await until(onMap(19), 15);
        // ---- the journal: the debt goal's page (chapter 1, what is paid, the day count)
        await ev("SceneManager.push(Journal.Scene_Journal); 0");
        await until("SceneManager._scene instanceof Journal.Scene_Journal && SceneManager._scene._started && !SceneManager.isSceneChanging()", 15);
        const jd = await J(`(function(){ const w = SceneManager._scene._list, i = w._items.findIndex(it => it.goal && it.goal.id === 'story_debt'); if (i >= 0) w.select(i);
            const ops = Journal.detailFor(0, w._items[i]).ops; return { i, sub: (ops.find(o => o.k === 'sub') || {}).text, p: (ops.find(o => o.k === 'p') || {}).text }; })()`);
        await frames(20);
        await b.shot(path.join(SHOTS, "fabula_2b_dziennik.png"));
        check("the journal: the debt goal's page says chapter 1, what is paid, today's day and the deadline", jd.i >= 0 && jd.sub === "Rozdział 1: Dług dziadka" && /Spłacono 0 z 2500 G/.test(jd.p) && /Dziś dzień 1, termin: dzień 60/.test(jd.p), jd);
        await ev("SceneManager.pop(); 0");
        await until(onMap(19), 15);

        // ---- grandpa again: the debt and a hint
        const g2 = await talkTo("$gameMap.event(901)");
        check("talking to grandpa again: where the debt stands (no praise for nothing paid) and a hint (the way to the field)", g2.done && g2.log.length === 2 && /nie oddaliśmy jeszcze ani grosza/.test(g2.text) &&
            /Czasu jeszcze sporo, ale nie zwlekaj/.test(g2.text) && !/Idzie ci lepiej/.test(g2.text) && /Pole jest za lasem/.test(g2.text) && g2.log.every(l => l.who === 901), g2.text);

        // ================= 2. the field, the tavern: Borgar
        await go(3, 26, 14);
        await ev("Journal.evaluateGoals(); 0");
        const fld = await J("({ f: $gameSystem._story.flags.field, done: Journal.goalDone(Journal.GOALS.find(g => g.id === 'story_field')), cur: Journal.currentGoal().id, name: $gameMap.displayName() })");
        check("reaching grandpa's field (Map003, shown as 'Pole dziadka') ticks 'Dojdź na pole dziadka'; the tracker then says find the job", fld.f && fld.done && fld.cur === "story_work" && fld.name === "Pole dziadka", fld);
        // the way in, walked with the keys: Polna droga north -> Okolice Tawerny (Map008) -> the tavern's door -> the tavern (Map001), out and in again
        await go(22, 12, 1, 8);
        const to8 = await walkTo("up", 8);
        const at8 = await J("({ x: $gamePlayer.x, y: $gamePlayer.y, door: ($gameMap.events().find(e => /^Drzwi tawerny/.test(e.event().name)) || { x: -1 }).x })");
        await ev("(function(){ $gamePlayer.locate(19, 14); $gamePlayer.setDirection(8); return 0; })()");   // (in front of the tavern door on town C)
        const to1 = await walkTo("up", 1);
        const at1 = await J("({ x: $gamePlayer.x, y: $gamePlayer.y, borgar: !!Story.borgarEvent() })");
        const back8 = await walkTo("down", 8);
        const out8 = await J("({ x: $gamePlayer.x, y: $gamePlayer.y })");
        await ev("(function(){ $gamePlayer.locate(19, 14); $gamePlayer.setDirection(8); return 0; })()");
        const in1 = await walkTo("up", 1);
        check("the way in: Polna droga north -> Okolice Tawerny, its door -> the tavern with Borgar; the tavern's exit -> back in front of the door", to8 && at8.y >= 20 && at8.door === 19 && to1 && at1.borgar &&
            back8 && out8.x === 19 && out8.y === 14 && in1, { to8, at8, to1, at1, back8, out8, in1 });
        await ev("$gameSystem.setDayNightHour(10); $gameSystem.setStamina(100); 0");
        const bor = await J("(function(){ const e = Story.borgarEvent(); return e && { id: e.eventId(), name: e.event().name, stub: e.list().length === 2 && e.list()[0].code === 355, atmo: $gameMap.events().filter(x => /Atmosfera - Borgar/.test(x.event().name)).map(x => Story.roleOf(x)) }; })()");
        check("Borgar's event is found by its name; the story speaks through it (his 'Atmosfera' parallel event is left alone)", bor && bor.name === "Borgar Kowal" && bor.stub && bor.atmo.every(r => r === null), bor);
        const hire = await talkTo("Story.borgarEvent()");
        check("the first talk at 10:00: Borgar hires the hero (a short scene), no shift offered in the morning", hire.done && $bool(await ev("$gameSystem._story.flags.hired")) && /Po południu i wieczorem mam urwanie głowy/.test(hire.text) && hire.log.some(l => l.who === 0) && hire.choices.length === 0, { text: hire.text.slice(0, 160), choices: hire.choices });
        const morning = await talkTo("Story.borgarEvent()", ["Nie teraz"]);
        check("in the morning he says when to come; the choices have no 'Weź zmianę'", morning.done && /Zmiany są po południu i wieczorem, od 16 do 21/.test(morning.text) && morning.choices.length === 1 && !morning.choices[0].includes("Weź zmianę") && morning.choices[0].includes("Pogadaj"), { text: morning.text, choices: morning.choices });
        const chat = await talkTo("Story.borgarEvent()", ["Pogadaj", "Zapytaj o gości", "To wszystko"]);
        const chatQ = chat.choices[1] || [];
        check("'Pogadaj' for his own man: no greeting to a stranger, straight to his questions (without a second 'Sprzedaj towar'); a question, then 'To wszystko' ends it",
            chat.done && !/Witaj, podróżniku/.test(chat.text) && /Pytaj, byle szybko/.test(chat.text) && chatQ.join("|") === "Zapytaj o historię tawerny|Zapytaj o gości|Zamów piwo, nie drąż|Zapytaj wprost o zamek|To wszystko, dzięki" &&
            /Melia/.test(chat.text) && /Wracaj, kiedy zechcesz/.test(chat.text) && chat.choices.length === 3 && !chat.missing.length && chat.log.some(l => l.who === bor.id), { text: chat.text.slice(0, 300), choices: chat.choices, missing: chat.missing });
        await ev("Journal.evaluateGoals(); 0");
        check("'Znajdź pracę w tawernie' is done", await ev("Journal.goalDone(Journal.GOALS.find(g => g.id === 'story_work'))"));
        // the evening: a shift (TavernShift driven with its test hooks: every part skipped with a score of 90, O on the cards)
        // (the hook also notes the guests' looks of the hall part)
        const shiftHook = `(function(){ $gameSystem.setStamina(100); window.__shiftT = 0; window.__shiftIntro = ""; window.__looks = [];
            TavernShift.onTick = function(scene) { const st = TavernShift.state(), I = Input._currentState; I.ok = false; if (!st) return; if (!window.__shiftIntro) window.__shiftIntro = scene.opts.intro;
                if (scene.part && scene.part.looks && !window.__looks.length) window.__looks = scene.part.looks.map(l => l.name + "/" + l.index);
                if (st.phase === "play") TavernShift.skip(90); else if (++window.__shiftT % 8 === 0) I.ok = true; }; return 0; })()`;
        await ev("$gameSystem.setDayNightHour(17); 0");
        await ev(shiftHook);
        const gold0 = await ev("$gameParty.gold()");
        const shift = await talkTo("Story.borgarEvent()", ["Weź zmianę"], 120, "fabula_5_borgar_zmiana.png");
        const sh = await J("({ gold: $gameParty.gold(), last: TavernShift.lastResult && { total: TavernShift.lastResult.total, grade: TavernShift.lastResult.grade }, s: $gameSystem._story, day: $gameSystem.dayNightDay(), hour: $gameSystem.dayNightHour(), done: TavernShift.stats().done })");
        await ev("TavernShift.onTick = null; Input._currentState.ok = false; 0");
        const introCard = await ev("window.__shiftIntro || ''");
        const looks = await J("window.__looks");
        check("in the evening Borgar offers 'Weź zmianę' and the shift runs (TavernShift.start with the story's intro: the debt left)", shift.choices[0] && shift.choices[0][0] === "Weź zmianę" && sh.done === 1 && sh.last && sh.last.total > 0 && /brakuje jeszcze 2500 G/.test(introCard), { choices: shift.choices, last: sh.last, introCard });
        check("the tavern's guests never wear the Lord's sheet (People2_Tall 4)", looks.length > 5 && !looks.includes("People2_Tall/4"), looks);
        check("after the shift Borgar tells the result and what is left of the debt; the pay is in the purse", shift.done && sh.gold - gold0 === sh.last.total && /Zarobiłeś dziś|Masz \d+ G/.test(shift.text) && /Lordowi wisicie jeszcze 2500 G/.test(shift.text), { text: shift.log.slice(-1), gold: [gold0, sh.gold] });
        check("the shift is marked for today (once a day)", sh.s.shiftDay === sh.day && sh.s.lastShift === null, { shiftDay: sh.s.shiftDay, day: sh.day });
        await ev("$gameSystem.setDayNightHour(18); 0");
        const again = await talkTo("Story.borgarEvent()", ["Nie teraz"]);
        check("the same evening again: no second shift ('Na dziś wystarczy')", again.done && /Na dziś wystarczy/.test(again.text) && again.choices.length === 1 && !again.choices[0].includes("Weź zmianę"), { text: again.text, choices: again.choices });
        await ev("Journal.evaluateGoals(); 0");
        check("'Przepracuj zmianę u Borgara' is done", await ev("Journal.goalDone(Journal.GOALS.find(g => g.id === 'story_shift'))"));

        // ================= 3. the Lord: a part, then all
        await go(24, 1, 15, 6);
        await ev("$gameSystem.setDayNightHour(10); 0");
        await frames(40);
        const lord = await J(`(function(){ const e = $gameMap.event(902), d = Story.doorEvent(); return e && d && { name: e.event().name, sheet: e.characterName(), index: e.characterIndex(), x: e.x, y: e.y, dx: e.x - d.x, dy: e.y - d.y, page: e._pageIndex, door: [d.x, d.y], doorStub: d.list()[0].code === 355 }; })()`);
        check("by day Lord Zaleski stands beside the manor's door (found by its name 'Drzwi dworu'), People2_Tall 4", lord && lord.name === "Lord Leopold Zaleski" && lord.sheet === "People2_Tall" && lord.index === 4 && Math.abs(lord.dx) <= 2 && lord.dy >= 1 && lord.dy <= 2 && lord.page === 0, lord);
        await ev("(function(){ const e = $gameMap.event(902); $gamePlayer.locate(e.x - 1, e.y + 3); $gamePlayer.setDirection(8); return 0; })()");
        await frames(30);
        await b.shot(path.join(SHOTS, "fabula_3_hrabia.png"));
        await ev("$gameParty.loseGold($gameParty.gold()); $gameParty.gainGold(700); window.__debt = []; for (const n of ['debtPayment', 'debtPaid']) Tawerna.on(n, e => window.__debt.push([n, n === 'debtPaid' ? e.total : e.amount]), { owner: 'StoryTest' }); 0");
        const pay1 = await talkTo("$gameMap.event(902)", ["Oddaj 500 G"], 40, "fabula_6_hrabia_splata.png");
        const p1 = await J("({ gold: $gameParty.gold(), s: $gameSystem._story })");
        check("the first meeting: he introduces himself, names the sum and the day, then only asks (no account read out)", pay1.done && /Lord Leopold Zaleski/.test(pay1.text) && /2500 złotych monet, płatne do dnia 60/.test(pay1.text) &&
            /Ile dziś przynosisz\?/.test(pay1.text) && !/Na razie nic nie oddałeś|Oddałeś już|Spłacono/.test(pay1.text) && pay1.log.some(l => l.who === 902) && pay1.log.some(l => l.who === 0), pay1.text.slice(0, 400));
        check("the payment menu: 100 / 500 / all you have / leave", pay1.choices[0] && pay1.choices[0].join("|") === "Oddaj 100 G|Oddaj 500 G|Oddaj wszystko, co masz (700 G)|Odejdź", pay1.choices);
        const said1 = pay1.log.slice(-1)[0].t.replace(/\n/g, " ");
        check("paying 500: gold 700 -> 200, paid 500, Feliks writes it down (in G, and what is still missing)", p1.gold === 200 && p1.s.paid === 500 && p1.s.payments.length === 1 &&
            /^Feliks, zapisz: 500 G od wnuka Stacha\. Brakuje jeszcze 2000 G\.$/.test(said1), { gold: p1.gold, paid: p1.s.paid, said1 });
        const pay2 = await talkTo("$gameMap.event(902)", ["Oddaj 100 G"]);
        check("paying 100 more (paid 600, gold 100); he says the state first", (await ev("$gameSystem._story.paid")) === 600 && (await ev("$gameParty.gold()")) === 100 &&
            /Oddałeś już 500 G, brakuje 2000 G\. Termin: dzień 60 - zostało 60 dni\. Ile dziś oddajesz\?/.test(pay2.text.replace(/\n/g, " ")) && pay2.choices[0] && pay2.choices[0].join("|") === "Oddaj 100 G|Oddaj wszystko, co masz (200 G)|Odejdź", { text: pay2.text.slice(0, 200), choices: pay2.choices });
        // the night: he is inside; the butler answers the door
        await ev("$gameSystem.setDayNightHour(23); 0");
        await frames(45);
        const night = await J("(function(){ const e = $gameMap.event(902); return { page: e._pageIndex, sheet: e.characterName(), through: e.isThrough(), sw: $gameSelfSwitches.value([24, 902, 'A']) }; })()");
        check("at night the Lord is not outside (self switch A: an empty, passable page)", night.page === 1 && night.sheet === "" && night.through && night.sw, night);
        const door = await talkTo("Story.doorEvent()", ["Odejdź"]);
        const doorId = await ev("Story.doorEvent().eventId()");
        check("the door at night: the butler Feliks answers and would take the money (with 100 G: 'all you have' only, no second 'Oddaj 100 G')", door.done && /Jaśnie pan już śpi/.test(door.text) && door.log.some(l => l.who === doorId) &&
            door.choices[0] && door.choices[0].join("|") === "Oddaj wszystko, co masz (100 G)|Odejdź" && (await ev("$gameSystem._story.paid")) === 600, { text: door.text.slice(0, 160), choices: door.choices });
        // all of it, by day
        await ev("$gameSystem.setDayNightHour(10); $gameParty.gainGold(4900); 0");
        await frames(45);
        const xp0 = await J("({ level: Combat.hero().level, xp: Combat.hero().xp })");
        const pay3 = await talkTo("$gameMap.event(902)", ["Spłać cały dług"]);
        const p3 = await J("({ gold: $gameParty.gold(), s: $gameSystem._story, xp: { level: Combat.hero().level, xp: Combat.hero().xp }, notice: $gameTemp._lastTopNotice, notes: $gameSystem._journal.notes.map(n => n.title), day: $gameSystem.dayNightDay() })");
        await ev("Journal.evaluateGoals(); 0");
        const debtDone = await ev("Journal.goalDone(Journal.GOALS.find(g => g.id === 'story_debt'))");
        const debtBus = await J("window.__debt");
        check("the payments are told on the Tawerna bus: 'debtPayment' { amount } each time (500, 100, 1900), then 'debtPaid' { total: 2500 } once",
            JSON.stringify(debtBus) === JSON.stringify([["debtPayment", 500], ["debtPayment", 100], ["debtPayment", 1900], ["debtPaid", 2500]]), debtBus);
        check("paying the rest (1900 of 5000): gold 3100, paid 2500, chapter 1 done", p3.gold === 3100 && p3.s.paid === 2500 && p3.s.done === p3.day && pay3.choices[0] && pay3.choices[0].includes("Spłać cały dług (1900 G)"), { gold: p3.gold, paid: p3.s.paid, done: p3.s.done, choices: pay3.choices });
        check("the Lord's last words: the old fortress under the tavern as a real clue (Krucze Skały; he means it; he knows the hero works for Borgar)", /Kruczych Skał/.test(pay3.text) && /pod jego tawerną/.test(pay3.text) &&
            /Pracujesz u Borgara, prawda\?/.test(pay3.text) && /ja też nie\s+żartuję/.test(pay3.text) && /przyjdź najpierw\s+do mnie/.test(pay3.text) && !/Hrabi/.test(pay3.text), pay3.log.slice(-2).map(l => l.t));
        // the clue as a goal: after the debt, "Drzwi pod Kruczymi Skałami" - done on reaching the tavern's cellar (Map009)
        const clue0 = await J("(function(){ Journal.evaluateGoals(); const g = Journal.GOALS.find(g => g.id === 'story_cellar'); const i = Journal.GOALS.indexOf(g), d = Journal.GOALS.findIndex(g => g.id === 'story_debt');" +
            " return { has: !!g, after: i === d + 1, done: !!(g && Journal.goalDone(g)), note: ($gameSystem._journal.notes.find(n => n.title === 'Pokwitowanie od Lorda') || {}).text || '' }; })()");
        await go(9, 5, 5, 2);
        const clue1 = await J("(function(){ Journal.evaluateGoals(); const g = Journal.GOALS.find(g => g.id === 'story_cellar'); return { cellar: !!$gameSystem._story.flags.cellar, done: !!(g && Journal.goalDone(g)) }; })()");
        check("the clue: goal 'Drzwi pod Kruczymi Skałami' right after the debt, open till the tavern's cellar is reached; the receipt says the Lord meant it",
            clue0.has && clue0.after && !clue0.done && /Lord nie żartował/.test(clue0.note) && clue1.cellar && clue1.done, { clue0, clue1 });
        check("the reward: experience, a top notice 'Rozdział 1 zakończony', a receipt in the notes, the debt goal done", (p3.xp.level > xp0.level || p3.xp.xp > xp0.xp) && /Rozdział 1 zakończony/.test(p3.notice || "") && p3.notes.includes("Pokwitowanie od Lorda") && debtDone,
            { xp0, xp: p3.xp, notice: p3.notice, notes: p3.notes });
        await go(19, 7, 7, 8);
        await ev("$gameSystem.setDayNightHour(11); 0");
        const soup0 = await ev("$gameParty.numItems($dataItems[131])");
        const thx = await talkTo("$gameMap.event(901)");
        check("grandpa thanks him when they meet next (and gives two soups)", thx.done && /Spłaciłeś wszystko/.test(thx.text) && (await ev("$gameParty.numItems($dataItems[131])")) === soup0 + 2 && (await ev("$gameSystem._story.flags.thanked")), thx.text.slice(0, 160));
        const steps = await J("window.__steps");
        check("the steps of chapter 1 are told on the Tawerna bus (storyStep), each once, in the order they happened",
            JSON.stringify(steps) === JSON.stringify(["talk", "field", "tavern", "hired", "firstShift", "manor", "lordMet", "chapterDone", "cellar", "thanked"]), steps);

        // ================= 4. a second new game: letters, the banner, a save in the middle of a talk, the deadline
        const again2 = await newStoryGame();
        await ev("window.__drv.on = true; window.__drv.picks = []; 0");
        await until(`$gameSystem._story.intro === 2 && ${calmMap}`, 60);
        check("a second new game: a fresh story (nothing paid) and its intro again", again2 && (await J("({ p: $gameSystem._story.paid, i: $gameSystem._story.intro, d: $gameSystem._story.done })")).p === 0 && (await ev("$gameSystem._story.done")) === 0);
        // a letter on day 20
        await ev("$gameSystem._dayNightDay = 20; $gameSystem.setDayNightHour(8); $gameTemp._lastTopNotice = ''; 0");
        await until("$gameSystem._story.letters[20] === true", 10);
        const let20 = await J("({ n: $gameTemp._lastTopNotice, sub: $gameTemp._lastTopNoticeSub, notes: $gameSystem._journal.notes.map(n => n.title + ': ' + n.text) })");
        check("day 20: a letter from the Lord (a notice at the top and a note in the journal)", /List od Lorda/.test(let20.n) && /zostało 41 dni/.test(let20.sub || "") && let20.notes.some(t => /^List od Lorda \(dzień 20\)/.test(t) && /2500 G do dnia 60/.test(t)), let20);
        await ev("$gameTemp.queueDayBanner('Wyspałeś się.'); 0");
        const banner = await ev("$gameTemp._lastDayBanner");
        check("the morning plate of the day adds what is left to pay", /Wyspałeś się\.\s+·\s+Do spłaty 2500 G, zostało 41 dni/.test(banner), banner);
        // saved in the middle of grandpa's talk, loaded again
        await ev("window.__drv.holdAt = window.__drv.log.length + 1; window.__drv.picks = []; 0");
        await ev("(function(){ $gamePlayer.locate(7, 6); $gamePlayer.setDirection(8); $gameMap.event(901).start(); return 0; })()");
        await until("$gameMessage.hasText()", 10);
        const saved = await ev("DataManager.saveGame(7).then(() => true).catch(e => String(e))");
        const plain = await ev("(function(){ const s = JsonEx.stringify(DataManager.makeSaveContents()); return !/function|=>/.test(JSON.stringify($gameSystem._story)) && s.length > 0; })()");
        await ev("window.__drv.holdAt = -1; 0");
        await until(calmMap, 20);
        const loadedOk = await ev("DataManager.loadGame(7).then(() => { SceneManager.goto(Scene_Map); return true; }).catch(e => String(e))");
        await until(onMap(19), 30);
        await frames(30);
        const afterLoad = await J("(function(){ const e = $gameMap.event(901); return { grandpa: !!e && e.event().name, story: !!$gameSystem._story, paid: $gameSystem._story.paid, running: $gameMap.isEventRunning() }; })()");
        await until(calmMap, 20);
        check("a game saved in the middle of a talk: only data in the story state; it loads, grandpa is there, the talk ends cleanly", saved === true && plain && loadedOk === true && afterLoad.grandpa === "Dziadek Stach" && afterLoad.story && (await ev(calmMap)), { saved, plain, loadedOk, afterLoad });
        // (a talk's messages as one text: a long line wraps over two bubbles)
        const said = r => r.log.map(l => l.t).join(" ").replace(/\n/g, " ");
        // ---- the P menu's foot later in the chapter: the label stays (the day of the deadline gives way first)
        await ev("(function(){ $gameSystem._story.paid = 1250; $gameSystem._dayNightDay = 30; $gameSystem.setDayNightHour(10); return 0; })()");
        const m30 = await menuLine();
        await ev("(function(){ $gameSystem._story.paid = 2100; $gameSystem._dayNightDay = 60; return 0; })()");
        const m60 = await menuLine();
        await ev("(function(){ $gameSystem._story.paid = 0; return 0; })()");
        check("the P menu's foot at 1250 G (31 days left) and on the last day still has its label", m30.label === true && m60.label === true && /^1250 \/ 2500 G\s+·.*zostało 31 dni$/.test(m30.line) &&
            /^2100 \/ 2500 G\s+·.*dziś ostatni dzień$/.test(m60.line), { m30, m60 });
        // ---- grandpa on the last day
        await ev("$gameSystem._dayNightDay = 60; $gameSystem.setDayNightHour(10); 0");
        await frames(20);
        const g60 = await talkTo("$gameMap.event(901)");
        check("grandpa on the last day: 'Dziś mija termin!', what is missing and where to pay (no broken 'Do terminu dziś...', no random hint)", g60.done &&
            /Dziś mija termin! Brakuje jeszcze 2500 G - leć do Lorda z tym, co masz\./.test(said(g60)) && /Lord przyjmuje za dnia, od 8 do 20/.test(said(g60)) && !/Do terminu dziś/.test(said(g60)), g60.text);
        // ---- awake past midnight after the deadline day: the debt still counts till dawn
        await ev("window.__drv.on = true; window.__drv.picks = []; $gameSystem._dayNightDay = 60; $gameSystem.setDayNightHour(23.9); 0");
        await frames(20);
        await ev("$gameSystem.advanceDayNight(0.2); 0");
        await frames(60);
        const mid = await J(`({ day: $gameSystem.dayNightDay(), hour: $gameSystem.dayNightHour(), scene: SceneManager._scene.constructor.name, running: $gameMap.isEventRunning(), ended: $gameSystem._story.ended,
            save: $gameSystem.isSaveEnabled(), doomed: Story.doomed(), night: Story.lastNight(), status: Story.statusLine(), goal: Journal.goalProgress(Journal.GOALS.find(g => g.id === 'story_debt')) })`);
        check("awake past midnight (day 61, 0:xx): no ending yet, saving works, 'Termin: dzień 60 - mija o świcie'", mid.day === 61 && mid.hour < 1 && mid.scene === "Scene_Map" && !mid.running && !mid.ended && mid.save &&
            !mid.doomed && mid.night && /Termin: dzień 60 - mija o świcie\./.test(mid.status) && /termin mija o świcie/.test(mid.goal), mid);
        // ---- the deadline day at 20:30: a shift that ends after midnight - Borgar warns, the butler takes the pay before dawn
        await go(1, 50, 82);
        await ev("$gameSystem._dayNightDay = 60; $gameSystem.setDayNightHour(20.5); $gameSystem.setStamina(100); $gameParty.loseGold($gameParty.gold()); 0");
        await driveShift();
        const late = await talkTo("Story.borgarEvent()", ["Weź zmianę"], 150);
        const lt = await J("({ day: $gameSystem.dayNightDay(), hour: $gameSystem.dayNightHour(), gold: $gameParty.gold(), ended: $gameSystem._story.ended, scene: SceneManager._scene.constructor.name, save: $gameSystem.isSaveEnabled() })");
        await ev("TavernShift.onTick = null; Input._currentState.ok = false; 0");
        check("the deadline day, 20:30: Borgar hires him, warns that the shift ends after midnight (the butler takes money till dawn) and gives it", late.choices[0] && late.choices[0][0] === "Weź zmianę" &&
            /Dziś mija termin u Lorda, a brakuje jeszcze 2500 G! Zmiana skończy się po północy - potem prosto do dworu, kamerdyner przyjmuje pieniądze do świtu\./.test(said(late)), { text: said(late).slice(0, 500), choices: late.choices });
        check("back after midnight (day 61, before dawn) with the pay: no ending; Borgar says to run to the manor before dawn", late.done && lt.day === 61 && lt.hour < 6 && lt.gold > 0 && !lt.ended && lt.scene === "Scene_Map" && lt.save &&
            /o świcie mija termin u Lorda! Biegnij do dworu/.test(said(late)), { lt, last: late.log.slice(-1) });
        await go(24, 1, 15, 6);
        await frames(45);
        const earned = await ev("$gameParty.gold()");
        const nightPay = await talkTo("Story.doorEvent()", ["Oddaj wszystko"]);
        const np = await J("({ paid: $gameSystem._story.paid, gold: $gameParty.gold(), day: $gameSystem.dayNightDay(), hour: $gameSystem.dayNightHour(), ended: $gameSystem._story.ended, scene: SceneManager._scene.constructor.name })");
        check("the last night: the butler still takes the money ('Termin mija o świcie'), paid = the shift's pay, no ending", nightPay.done && np.paid === earned && earned > 0 && np.gold === 0 && np.day === 61 && np.hour < 6 && !np.ended &&
            np.scene === "Scene_Map" && /Termin mija o świcie - do tego czasu przyjmę każdą monetę\./.test(said(nightPay)) && /Termin: dzień 60 - mija o świcie\./.test(said(nightPay)) &&
            /Zapisuję: \d+ G od wnuka Stacha\. Brakuje jeszcze \d+ G\. O świcie termin mija\./.test(said(nightPay)), { np, earned, text: said(nightPay).slice(0, 500) });
        await go(19, 8, 6);
        // the deadline: day 60 at night, sleep -> day 61 (the day summary first), then the ending
        await ev("window.__drv.on = true; window.__drv.picks = []; $gameSystem._dayNightDay = 60; $gameSystem.setDayNightHour(23); 0");
        await frames(30);
        const lastDay = await J("({ save: $gameSystem.isSaveEnabled(), scene: SceneManager._scene.constructor.name, left: Story.daysLeft() })");
        await ev("$gameSystem.sleepUntilHour(7); 0");
        const summary = await until("SceneManager._scene.constructor.name === 'Scene_DaySummary'", 15);
        const doomedSave = await ev("$gameSystem.isSaveEnabled()");
        for (let i = 0; i < 40 && await ev("SceneManager._scene.constructor.name === 'Scene_DaySummary'"); i++) { await ev("Input._currentState.ok = true; 0"); await sleep(120); await ev("Input._currentState.ok = false; 0"); await sleep(200); }
        check("day 60 is still fine (1 day left, saving works); sleeping into day 61 shows the day summary first and saving is off", lastDay.save === true && lastDay.left === 1 && summary && doomedSave === false, { lastDay, summary, doomedSave });
        const ending = await until("SceneManager._scene.constructor.name === 'Scene_StoryEnding'", 30);
        const endLog = await J("window.__drv.log.slice(-1)[0]");
        check("then the ending: the hero's words at dawn, a fade, the ending screen", ending && /^Świta\.\.\. Termin minął/.test(endLog.t) && (await ev("$gameSystem._story.ended")) === 61, endLog);
        await sleep(1500);
        await b.shot(path.join(SHOTS, "fabula_4_koniec.png"));
        for (let i = 0; i < 30 && !(await ev("SceneManager._scene.constructor.name === 'Scene_Gameover'")); i++) { await ev("Input._currentState.ok = true; 0"); await sleep(120); await ev("Input._currentState.ok = false; 0"); await sleep(200); }
        check("O on the ending screen goes to the Game Over (and the title, where a save can be loaded)", await ev("SceneManager._scene.constructor.name === 'Scene_Gameover'"));

        // ---- a third new game for bots: Story.skipIntro() right away - no talk runs, it counts as heard; no deadline with setDeadlineOn(false)
        await newStoryGame();
        const skipped = await ev("Story.skipIntro()");
        await frames(90);
        const sk = await J("({ running: $gameMap.isEventRunning(), intro: $gameSystem._story.intro, talk: $gameSystem._story.flags.talk, soup: $gameParty.numItems($dataItems[131]) })");
        await ev("Story.setDeadlineOn(false); $gameSystem._dayNightDay = 70; 0");
        await frames(60);
        const noEnd = await J("({ scene: SceneManager._scene.constructor.name, running: $gameMap.isEventRunning(), save: $gameSystem.isSaveEnabled() })");
        check("Story.skipIntro() (bots): no talk runs, it counts as heard; Story.setDeadlineOn(false): day 70 ends nothing", skipped && !sk.running && sk.intro === 2 && sk.talk && sk.soup === 1 && noEnd.scene === "Scene_Map" && !noEnd.running && noEnd.save, { sk, noEnd });
        // Story.pay (other plugins, bots): the whole debt paid outside the talks ends chapter 1 at once
        // (every top notice noted: the debt goal's own "Cel wykonany" comes right after the chapter's)
        await ev("(function(){ $gameParty.gainGold(3000); window.__notices = []; const f = $gameTemp.pushTopNotice; $gameTemp.pushTopNotice = function(t) { window.__notices.push(t); return f.apply(this, arguments); }; return 0; })()");
        const paidOut = await ev("Story.pay(2500)");
        const sp = await J("({ s: $gameSystem._story, notices: window.__notices, notes: $gameSystem._journal.notes.map(n => n.title) })");
        await ev("delete $gameTemp.pushTopNotice; 0");
        check("Story.pay(2500) outside the talks: paid in full, chapter 1 done at once (top notice, receipt in the notes)", paidOut === 2500 && sp.s.paid === 2500 && sp.s.done === 70 &&
            sp.notices.some(t => /Rozdział 1 zakończony/.test(t)) && sp.notes.includes("Pokwitowanie od Lorda"), { paidOut, paid: sp.s.paid, done: sp.s.done, notices: sp.notices, notes: sp.notes });
        // the dawn ending waits while he sits resting: the debt open again, day 61 at 5:30 (not yet), a grass rest on the field runs past 6:00
        await go(3, 26, 14);
        await ev("(function(){ const s = $gameSystem._story; s.paid = 0; s.done = 0; s.payments = []; $gameSystem._dayNightDay = 61; $gameSystem.setDayNightHour(5.5); Story.setDeadlineOn(true); return 0; })()");
        await frames(10);
        const before6 = await J("({ doomed: Story.doomed(), night: Story.lastNight(), name: $gameMap.displayName(), save: $gameSystem.isSaveEnabled() })");
        const spot = await J(`(function(){ $gameSystem.setStamina(10); $gameSystem._lastSleep = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour();
            for (let y = 3; y < $gameMap.height() - 3; y++) for (let x = 3; x < $gameMap.width() - 3; x++) {
                if (!$gameMap.checkPassage(x, y - 1, 0x0f) || $gameMap.eventsXy(x, y - 1).length || $gameMap.eventsXy(x, y).length) continue;
                $gamePlayer.locate(x, y - 1); $gamePlayer.setDirection(2);
                const m = Farming.menuFor(x, y), e = m && m.entries && m.entries.find(e => e.name === "Odpocznij" && e.enabled !== false);
                if (e) { e.run(); return [x, y]; }
            } return null; })()`);
        await until("$gameSystem.dayNightHour() >= 6.4", 10);
        await frames(30);
        const resting = await J("({ hour: $gameSystem.dayNightHour(), sitting: $gamePlayer.isToolSwinging(), doomed: Story.doomed(), ended: $gameSystem._story.ended, running: $gameMap.isEventRunning(), save: $gameSystem.isSaveEnabled() })");
        check("day 61 before 6:00 (the field shown as 'Pole dziadka'): not over yet; resting past 6:00 the ending waits while he sits (doomed, saving off)", before6.night && !before6.doomed && before6.save &&
            before6.name === "Pole dziadka" && !!spot && resting.sitting && resting.hour >= 6.4 && resting.doomed && !resting.ended && !resting.running && resting.save === false, { before6, spot, resting });
        await ev("window.__drv.on = false; Input._currentState.ok = true; 0");
        await frames(4);
        await ev("Input._currentState.ok = false; 0");
        await until("!$gamePlayer.isToolSwinging()", 10);
        await ev("window.__drv.on = true; window.__drv.picks = []; 0");
        const ending3 = await until("SceneManager._scene.constructor.name === 'Scene_StoryEnding'", 30);
        const end3 = await J("({ log: window.__drv.log.slice(-1)[0], ended: $gameSystem._story.ended })");
        check("...he gets up (O) and only then the ending: 'Świta... Termin minął', the ending screen", ending3 && end3.ended === 61 && /^Świta\.\.\. Termin minął/.test(end3.log.t) && end3.log.who === 0, end3);

        // ================= 5. an old-style game: begun elsewhere (Map003) - no story, nothing changes
        await toTitle();
        await ev("(function(){ window.__drv.on = false; DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 26, 14, 2, 0); SceneManager.goto(Scene_Map); return 0; })()");
        await until(onMap(3), 40);
        await ev(quiet);
        await ev("Journal.evaluateGoals(); 0");
        const old = await J("({ story: $gameSystem._story === undefined, active: Story.active(), goals: Journal.GOALS.some(g => g.story), cur: Journal.currentGoal() && Journal.currentGoal().id, name: $gameMap.displayName() })");
        check("an old-style game (begun on Map003): no story state, no story goals, the journal's first goal is 'stone', the map keeps its own name", old.story && !old.active && !old.goals && old.cur === "stone" && old.name === "Domek - Zewnętrze", old);
        await go(1, 50, 82);
        const oldB = await J("(function(){ const e = $gameMap.events().find(x => x.event().name === 'Borgar Kowal'); return { first: e.list()[0].code, text: e.list()[1].parameters[0] }; })()");
        check("...Borgar keeps his own commands", oldB.first === 101 && /Witaj, podróżniku/.test(oldB.text), oldB);
        await go(24, 1, 15, 6);
        const oldL = await J("(function(){ const d = $gameMap.events().find(x => /^Drzwi dworu/.test(x.event().name)); return { lord: !!$gameMap.event(902), data: !!$dataMap.events[902], door: d.list()[1] && d.list()[1].parameters[0] }; })()");
        check("...no Lord at the manor, its door is shut as before", !oldL.lord && !oldL.data && /zamknięte/.test(oldL.door || ""), oldL);
        await go(19, 8, 6);
        const oldH = await J("({ grandpa: !!$gameMap.event(901), running: $gameMap.isEventRunning() })");
        await ev("$gameSystem._dayNightDay = 61; 0");
        await frames(60);
        const oldEnd = await J("({ scene: SceneManager._scene.constructor.name, save: $gameSystem.isSaveEnabled(), running: $gameMap.isEventRunning(), story: !!$gameSystem._story })");
        check("...no grandpa and no intro in his house; day 61 ends nothing, saving works", !oldH.grandpa && !oldH.running && oldEnd.scene === "Scene_Map" && oldEnd.save && !oldEnd.running && !oldEnd.story, { oldH, oldEnd });
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    check("no errors in the console", !err.length, err.slice(-6));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
function $bool(v) { return v === true; }
