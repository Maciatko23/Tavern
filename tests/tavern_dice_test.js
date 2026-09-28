// The dice game (TavernDice.js): the scoring (fixed cases + every throw of 1-6 dice against an independent reference), the exact bust
// chances, the game model (bust, hot dice, banking), full seeded games against every rival both headless and in the scene (they must
// agree), the stakes and the gold, refusing without money, the special dice's weights (seeded statistics), the <Tavern:dice> event
// opening the table (and the empty table at night), a turn played with the real keys and the mouse, leaving mid-game (the stake is
// lost), the rewards back on the map (experience, a journal note, a notice, a gift die), the tavern's fame from the quest board
// (QuestBoard.js: the merchant from 40, the stranger's high-stakes game from 80, his die or gold), and no console errors. The plugins
// are not in js/plugins.js yet, so the test loads them into the page. Screenshots: docs/tawerna_zycie/kosci_*.png
//   CDP_PORT=9380 node tests/tavern_dice_test.js
const { launch, sleep } = require("./cdp.js");
const fs = require("fs");
const path = require("path");
const SHOTS = path.join(__dirname, "..", "docs", "tawerna_zycie");

// ---- in the page: freezing the scene for a screenshot, and a bot that plays the hero's turn with the keys
const DRIVER = String.raw`
window.__td = { shot: null, shots: {}, freeze: null, kb: null, t: 0, turbo: 1 };
(function() {
    const KEYS = ["ok", "up", "down", "left", "right", "escape"];
    function kbStep(K, st, scene, I) {
        if (st.phase !== "play") return;
        if (st.wait === "throw") {
            if (st.focus.row === "btn" && st.focus.i === 1) { I.ok = true; K.keys.push("O-throw"); }
            else { I.right = true; K.keys.push("right"); }
            return;
        }
        if (st.wait !== "choose") { K.want = null; return; }
        if (!K.want) {
            const faces = st.dice.map(d => d.face), b = K.pick ? K.pick(faces) : TavernDice.best(faces);
            K.want = b.idx.slice(); K.points = b.points; K.faces = faces; K.turns++;
        }
        const need = K.want.filter(i => !st.dice[i].sel);
        if (need.length) {
            const target = need[0];
            if (st.focus.row === "die" && st.focus.i === target) { I.ok = true; K.keys.push("O"); return; }
            if (st.focus.row !== "die") { I.up = true; K.keys.push("up"); return; }
            // the shortest way over the dice with the scene's own arrow rule
            const dirs = [["left", -1, 0], ["right", 1, 0], ["up", 0, -1], ["down", 0, 1]], prev = {}, q = [st.focus.i];
            prev[st.focus.i] = null;
            while (q.length) {
                const c = q.shift();
                if (c === target) break;
                for (const [k, dx, dy] of dirs) { const n = scene.nextDie(c, dx, dy); if (n >= 0 && !(n in prev)) { prev[n] = [c, k]; q.push(n); } }
            }
            if (!(target in prev)) { K.stuck++; return; }
            let n = target;
            while (prev[n] && prev[n][0] !== st.focus.i) n = prev[n][0];
            I[prev[n][1]] = true; K.keys.push(prev[n][1]);
            return;
        }
        if (K.hold) return;   // (a screenshot of the choice first)
        const want = K.action === "roll" ? 1 : 2;
        if (st.focus.row === "die") { I.down = true; K.keys.push("down"); return; }
        if (st.focus.i !== want) { I[st.focus.i < want ? "right" : "left"] = true; K.keys.push("lr"); return; }
        I.ok = true; K.keys.push(want === 2 ? "O-bank" : "O-roll"); K.done++; K.want = null;
    }
    TavernDice.onTick = function(scene) {
        const D = window.__td, I = Input._currentState;
        D.t++;
        if (D.kb) for (const k of KEYS) I[k] = false;
        const st = TavernDice.state();
        if (!st) return;
        if (D.freeze) {
            const tag = D.freeze(st, scene);
            if (tag && !D.shots[tag]) { D.shots[tag] = 1; D.shot = tag; D.turbo = scene.turbo; scene.turbo = 0; return; }
        }
        if (D.kb && D.t % 2 === 0) kbStep(D.kb, st, scene, I);
    };
})();
`;

// an independent way to count a throw: every split of the dice into groups, each group a known figure
const REFERENCE = String.raw`
window.__ref = function(faces) {
    const n = faces.length, blocks = [];
    let best = -1;
    const value = b => {
        const s = b.slice().sort((x, y) => x - y), k = s.length, key = s.join("");
        if (k === 1) return s[0] === 1 ? 100 : s[0] === 5 ? 50 : -1;
        if (k >= 3 && s.every(v => v === s[0])) return (s[0] === 1 ? 1000 : s[0] * 100) * Math.pow(2, k - 3);
        return key === "12345" ? 500 : key === "23456" ? 750 : key === "123456" ? 1500 : -1;
    };
    const rec = i => {
        if (i === n) { let sum = 0; for (const b of blocks) { const v = value(b); if (v < 0) return; sum += v; } if (sum > best) best = sum; return; }
        for (const b of blocks) { b.push(faces[i]); rec(i + 1); b.pop(); }
        blocks.push([faces[i]]); rec(i + 1); blocks.pop();
    };
    rec(0);
    return best;
};
`;

(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 60000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(!!ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const until = async (cond, secs) => { const t0 = Date.now(); while (Date.now() - t0 < secs * 1000) { if (await ev(cond).catch(() => false)) return true; await sleep(150); } return false; };
    const onMap = "(SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && $gameMap.mapId() === 1)";
    const inScene = "(TavernDice.isRunning() && SceneManager._scene === TavernDice.scene() && SceneManager._scene._started && !SceneManager.isSceneChanging())";
    const tap = async (k, ms) => { await ev(`Input._currentState["${k}"] = true; 0`); await sleep(ms || 120); await ev(`Input._currentState["${k}"] = false; 0`); await sleep(160); };
    // waits for a screenshot stop of the driver; shoots it and lets the scene go on
    const shotStop = async (tag, secs) => {
        const ok = await until(`window.__td.shot === "${tag}"`, secs || 60);
        if (ok) {
            await sleep(300);
            await b.shot(path.join(SHOTS, tag + ".png"));
            await ev("TavernDice.scene().turbo = window.__td.turbo || 1; window.__td.shot = null; 0");
            await sleep(400);   // (the scene takes keys a few ticks after a panel opens)
        }
        return ok;
    };
    fs.mkdirSync(SHOTS, { recursive: true });
    try {
        // ================= boot: a new game in the tavern (Map001) at 19:00
        let booted = false;
        for (let a = 0; a < 4 && !booted; a++) {
            await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
            booted = await until("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title' && DataManager._globalInfo)", 60);
        }
        check("the game boots", booted);
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(1, 8, 6, 2, 0); SceneManager.goto(Scene_Map); })()`);
        await until(onMap, 60);
        await sleep(1200);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Livestock) Livestock.auto(false); if (window.Dog && Dog.auto) Dog.auto(false); $gameScreen.clearWeather(); $gameSystem._minimapHidden = true; $gameSystem.setDayNightHour(19); 0");
        const loaded = await ev(`new Promise(res => { if (window.TavernDice) return res(true); const s = document.createElement("script"); s.src = "js/plugins/TavernDice.js?" + Date.now(); s.onload = () => res(!!window.TavernDice); s.onerror = () => res(false); document.body.appendChild(s); })`);
        check("TavernDice.js loads into the page", loaded);
        await ev(DRIVER + REFERENCE + "; 0");
        // (the first sections are about the table without the quest board; it comes back for the fame at the end)
        await ev("if (window.QuestBoard) { window.__QB = window.QuestBoard; window.QuestBoard = undefined; } 0");
        await ev("window.__xp = []; const _gx = Combat.gainXp; Combat.gainXp = function(a, r, q) { window.__xp.push([a, r]); return _gx.call(this, a, r, q); }; 0");
        await ev("window.__notices = []; const _tn = Game_Temp.prototype.pushTopNotice; Game_Temp.prototype.pushTopNotice = function(t, c, o) { window.__notices.push(String(t)); return _tn.call(this, t, c, o); }; 0");

        // ================= 1. scoring
        const fixed = await J(`(function(){
            const sc = d => { const s = TavernDice.score(d); return s.valid ? s.points : null; };
            const cases = [
                [[1], 100], [[5], 50], [[2], null], [[3], null], [[1, 5], 150], [[1, 1], 200], [[5, 5], 100], [[1, 1, 5, 5], 300],
                [[1, 1, 1], 1000], [[2, 2, 2], 200], [[3, 3, 3], 300], [[4, 4, 4], 400], [[5, 5, 5], 500], [[6, 6, 6], 600],
                [[4, 4, 4, 4], 800], [[4, 4, 4, 4, 4], 1600], [[4, 4, 4, 4, 4, 4], 3200], [[1, 1, 1, 1], 2000], [[1, 1, 1, 1, 1], 4000],
                [[1, 1, 1, 1, 1, 1], 8000], [[2, 2, 2, 2, 2, 2], 1600], [[5, 5, 5, 5, 5, 5], 4000], [[5, 5, 5, 5], 1000],
                [[1, 2, 3, 4, 5], 500], [[2, 3, 4, 5, 6], 750], [[6, 5, 4, 3, 2, 1], 1500], [[1, 1, 2, 3, 4, 5], 600], [[1, 2, 3, 4, 5, 5], 550],
                [[5, 2, 3, 4, 6, 5], 800], [[2, 3, 4, 5, 6, 6], null], [[2, 2, 2, 3, 3, 3], 500], [[1, 1, 1, 5, 5, 5], 1500],
                [[1, 1, 1, 1, 5], 2050], [[2, 2, 2, 2, 5, 5], 500], [[4, 4], null], [[1, 2, 3, 4], null], [[6, 6, 6, 1], 700], [[3, 3, 3, 5], 350],
                [[], null], [[2, 3, 4, 6, 6, 2], null], [[1, 2, 3, 4, 5, 2], null]
            ];
            const bad = cases.filter(([d, want]) => sc(d) !== want).map(([d, want]) => ({ d, want, got: sc(d) }));
            const names = [TavernDice.score([4, 4, 4, 1]).name, TavernDice.score([1, 1, 5]).name, TavernDice.score([6, 6, 6, 6, 6]).name, TavernDice.score([1, 2, 3, 4, 5, 6]).name, TavernDice.score([2, 3, 4, 5, 6]).name];
            return { n: cases.length, bad, names, best: TavernDice.best([1, 1, 1, 1, 5, 2]).points, hot: TavernDice.best([1, 5, 2, 3, 4, 6]).n };
        })()`);
        check("scoring: " + fixed.n + " fixed cases (singles, 3-6 of a kind, straights, straight + extra, two triples, invalid ones)", fixed.bad.length === 0, fixed.bad.slice(0, 5));
        check("scoring: the names of the figures", fixed.names.join("|") === "Trzy czwórki + jedynka|Dwie jedynki + piątka|Pięć szóstek|Pełny strit|Duży strit", fixed.names);
        check("scoring: the best set-aside of [1,1,1,1,5,2] is 2050; a full straight takes all six", fixed.best === 2050 && fixed.hot === 6, fixed);
        const exhaustive = await J(`(function(){
            let n = 0; const bad = [];
            const rec = (a, from, len) => {
                if (a.length === len) { n++; const s = TavernDice.score(a), got = s.valid ? s.points : -1, want = window.__ref(a); if (got !== want && bad.length < 5) bad.push({ a: a.slice(), got, want }); return; }
                for (let f = from; f <= 6; f++) { a.push(f); rec(a, f, len); a.pop(); }
            };
            for (let len = 1; len <= 6; len++) rec([], 1, len);
            return { n, bad };
        })()`);
        check("scoring: every throw of 1-6 dice (" + exhaustive.n + " sets of faces) agrees with an independent reference (all ways to split into figures)", exhaustive.n === 923 && exhaustive.bad.length === 0, exhaustive.bad);
        const pb = await J(`(function(){
            const out = [];
            for (let n = 1; n <= 6; n++) { let bust = 0, tot = 0; const rec = a => { if (a.length === n) { tot++; if (!TavernDice.hasScore(a)) bust++; return; } for (let f = 1; f <= 6; f++) { a.push(f); rec(a); a.pop(); } }; rec([]); out.push(+(bust / tot).toFixed(4)); }
            return { exact: out, table: TavernDice.P_BUST.slice(1) };
        })()`);
        check("bust chances counted over every throw match the AI's table (1 die 66.7% ... 6 dice 3.1%)", JSON.stringify(pb.exact) === JSON.stringify(pb.table), pb);

        // ================= 2. the model: bust, hot dice, banking
        const model = await J(`(function(){
            const M = TavernDice.Match, R = TavernDice.makeRng(9);
            const mk = () => new M({ target: 2000, rng: R, first: 0, players: [{ key: "hero", dice: Array(6).fill("std") }, { key: "ozzy", dice: Array(6).fill("std") }] });
            const out = {};
            let m = mk(); m.forced = [[1, 2, 3, 4, 6, 6], [2, 3, 4, 6, 6]];
            m.roll(); const t1 = m.take([0]); const pts = m.turn.pts; const r2 = m.roll();
            out.bust = { pts, bust: r2.bust, lost: m.turn.lost, after: m.turn.pts, dice: r2.dice.length, invalid: m.take([1]) };
            m = mk(); m.forced = [[1, 1, 5, 2, 3, 3], [1, 1, 1, 5, 5, 5], [2, 2, 3, 4, 6, 1]];
            m.roll(); const first = m.take([0, 1, 2]); const r2b = m.roll(); const hot1 = m.take([0, 1, 2]);   // three of six, then three more of the rest
            out.hot = { first: first && first.group.points, second: r2b.dice.length, hot: hot1 && hot1.hot, pts: m.turn.pts, free: m.turn.free.length, hotNext: m.hotNext };
            const r3 = m.roll(); out.hot.next = r3.dice.length;
            m = mk(); m.forced = [[1, 2, 3, 4, 6, 6], [5, 2, 2]];
            m.roll(); m.take([0]); m.roll(); m.take([0]); const bk = m.bank(); m.endTurn();
            out.bank = { bk, total: m.players[0].total, cur: m.cur, turn: m.turn.pts, invalidTake: m.take([0]) };
            m = mk(); m.forced = [[1, 1, 1, 2, 3, 4]]; m.roll(); m.take([0, 1, 2]); m.players[0].total = 1500; const w = m.bank();
            out.win = { w, over: m.over, winner: m.winner };
            return out;
        })()`);
        check("model: a throw with no scoring die is a bust - the turn's points are lost", model.bust.pts === 100 && model.bust.bust && model.bust.lost === 100 && model.bust.after === 0 && model.bust.dice === 5 && model.bust.invalid === null, model.bust);
        check("model: all six set aside (over two throws) = hot dice - the next throw is all six again, the points stay", model.hot.first === 250 && model.hot.second === 3 && model.hot.hot === true && model.hot.pts === 250 + 1000 && model.hot.hotNext && model.hot.next === 6, model.hot);
        check("model: banking writes the turn down and passes the dice; a non-scoring set-aside is refused", model.bank.bk.points === 150 && model.bank.total === 150 && model.bank.cur === 1 && model.bank.turn === 0 && model.bank.invalidTake === null, model.bank);
        check("model: reaching the target wins the game", model.win.w.won && model.win.over && model.win.winner === 0, model.win);

        // ================= 3. the rivals' heads: many seeded games headless
        const sims = await J(`(function(){
            const out = {};
            for (const k of ["grum", "ozzy", "kupiec", "bartek", "nieznajomy"]) {
                let wins = 0, errors = 0, noWinner = 0, badEnd = 0, banks = [], busts = 0, turns = 0;
                for (let s = 1; s <= 300; s++) {
                    const r = TavernDice.simulate({ opponent: k, hero: "steady", seed: s });
                    if (r.winner === 0) wins++; if (r.winner < 0) noWinner++; errors += r.errors;
                    if (r.winner >= 0 && r.totals[r.winner] < r.target) badEnd++;
                    for (const l of r.log) if (l.p === 1 && l.bank !== undefined) banks.push(l.bank);
                    busts += r.busts[1]; turns += r.turns[1];
                }
                out[k] = { heroWins: wins / 300, errors, noWinner, badEnd, avgBank: Math.round(banks.reduce((a, x) => a + x, 0) / Math.max(1, banks.length)), bustRate: +(busts / turns).toFixed(2) };
            }
            return out;
        })()`);
        check("300 seeded headless games against each rival: always a winner at the target, no invalid move", Object.values(sims).every(x => x.errors === 0 && x.noWinner === 0 && x.badEnd === 0), sims);
        check("the games are fair-ish: a steady player wins 30-70% against each rival", Object.values(sims).every(x => x.heroWins >= 0.3 && x.heroWins <= 0.7), Object.fromEntries(Object.entries(sims).map(([k, x]) => [k, x.heroWins])));
        check("personalities: Grum (risky) writes down bigger turns and busts more often than cautious Ozzy", sims.grum.avgBank > sims.ozzy.avgBank + 100 && sims.grum.bustRate > sims.ozzy.bustRate, { grum: sims.grum, ozzy: sims.ozzy });

        // ================= 4. who sits at the table by the hour
        const pres = await J(`(function(){ const k = h => TavernDice.present(h, 2).map(p => p.key).join(","); return { h3: k(3), h9: k(9), h12: k(12), h15: k(15), h19: k(19), h23: k(23.5), rareDay: TavernDice.present(19, 1).map(p => p.key).join(",") }; })()`);
        check("who sits there depends on the hour: the night empty, Ozzy from 10, Bartek 14-21, Grum from 17; the merchant only some days", pres.h3 === "" && pres.h9 === "" && pres.h12 === "ozzy" && pres.h15 === "ozzy,bartek" && pres.h19 === "grum,ozzy,bartek" && pres.h23 === "grum" && pres.rareDay === "grum,ozzy,kupiec,bartek", pres);

        // ================= 5. refusing without money
        await ev("$gameParty.loseGold($gameParty.gold()); $gameParty.gainGold(3); 0");
        const refused = await J(`({ a: TavernDice.start({ opponent: "ozzy", stake: 5 }), why: TavernDice.lastRefusal, b: TavernDice.start({}), why2: TavernDice.lastRefusal, running: TavernDice.isRunning(), changing: SceneManager.isSceneChanging(), gold: $gameParty.gold() })`);
        check("no game without the stake: start() says no and a popup says why (3 G for a 5 G stake; the table: 'Za mało złota')", refused.a === false && refused.b === false && !refused.running && !refused.changing && refused.gold === 3 && /Nie stać cię/.test(refused.why) && /Za mało złota/.test(refused.why2), refused);
        await ev("$gameParty.gainGold(497); 0");   // 500 G

        // ================= 6. the <Tavern:dice> table on the map (added at run time): the lobby, then the empty table at night
        await ev(`(function(){
            const id = $dataMap.events.length;
            const page = { conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 },
                directionFix: false, image: { characterIndex: 0, characterName: "", direction: 2, pattern: 0, tileId: 0 },
                list: [{ code: 108, indent: 0, parameters: ["Stół do gry w kości"] }, { code: 408, indent: 0, parameters: ["<Tavern:dice>"] }, { code: 0, indent: 0, parameters: [] }],
                moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true };
            $dataMap.events[id] = window.__tableData = { id, name: "Stół do kości", note: "", x: 8, y: 8, pages: [page] };
            $gameMap._events[id] = new Game_Event($gameMap.mapId(), id);
            window.__tableId = id;
            // (coming back from a scene the map's data is read from the file again: the table added here is put back into it)
            const _onLoad = DataManager.onLoad;
            DataManager.onLoad = function(object) { _onLoad.call(this, object); if (object === $dataMap && window.__tableData && $gameMap && $gameMap.mapId() === 1) $dataMap.events[window.__tableData.id] = window.__tableData; };
            $gamePlayer.locate(8, 7); $gamePlayer.setDirection(2);
            return 0;
        })()`);
        await sleep(400);
        await ev("window.__td.freeze = (st, sc) => st.phase === 'rules' && sc.phaseT > 30 ? 'kosci_zasady' : st.phase === 'lobby' && sc.phaseT > 24 ? 'kosci_start' : null; 0");
        let viaKey = false;
        for (let i = 0; i < 3 && !viaKey; i++) { await tap("ok", 150); viaKey = await until(inScene, 4); }
        if (!viaKey) await ev(`$gamePlayer.checkEventTriggerThere([0, 1, 2]); 0`);
        const opened = await until(inScene, 15);
        check("O at an event with <Tavern:dice> opens the dice table" + (viaKey ? " (with the O key)" : " (triggered directly)"), opened && viaKey);
        const rulesFirst = await J("TavernDice.state()");
        check("the first time the rules card comes up by itself", rulesFirst && rulesFirst.phase === "rules", rulesFirst && rulesFirst.phase);
        await shotStop("kosci_zasady", 10);
        await tap("ok");
        await shotStop("kosci_start", 10);
        const lobby = await J("TavernDice.state()");
        check("the lobby lists who sits at the table at 19:00 on day 1 (Grum, Ozzy, the merchant, Bartek) with their stakes", lobby.phase === "lobby" && lobby.lobby.cards.map(c => c.key).join(",") === "grum,ozzy,kupiec,bartek" && lobby.lobby.stake === 10, lobby.lobby);
        await tap("escape");
        await until(onMap, 15);
        await sleep(1000);
        await ev("$gameSystem.setDayNightHour(3); window.__td.freeze = null; TavernDice.lastRefusal = ''; $gamePlayer.locate(8, 7); $gamePlayer.setDirection(2); 0");
        for (let i = 0; i < 3 && !(await ev("TavernDice.lastRefusal")); i++) { await tap("ok", 150); await sleep(700); }
        const night = await J(`({ running: TavernDice.isRunning(), why: TavernDice.lastRefusal, map: SceneManager._scene instanceof Scene_Map })`);
        check("at night the table is empty: 'Stoły puste. Wróć wieczorem.' and no scene", !night.running && night.map && night.why === "Stoły puste. Wróć wieczorem.", night);
        await ev(`$gameSystem.setDayNightHour(19); $gameMap.event(window.__tableId).erase(); 0`);

        // ================= 7. full seeded games in the scene, the hero on autopilot, against every rival
        const findSeed = async (opp, stake, heroWins, from) => ev(`(function(){ for (let s = ${from || 1}; s < 400; s++) { const r = TavernDice.simulate({ opponent: "${opp}", hero: "steady", seed: s, stake: ${stake}, heroDice: TavernDice.dice().set }); if ((r.winner === 0) === ${heroWins}) return s; } return -1; })()`);
        const runAuto = async (opp, stake, seed, extra, freeze) => {
            const sim = await J(`TavernDice.simulate({ opponent: "${opp}", hero: "steady", seed: ${seed}, stake: ${stake}, heroDice: TavernDice.dice().set })`);   // (the hero's own six, special dice too)
            await ev(`window.__end = null; window.__td.freeze = ${freeze || "null"}; window.__td.shots = {}; 0`);
            const before = await J(`({ gold: $gameParty.gold(), stats: TavernDice.stats(), hour: $gameSystem.dayNightHour() })`);
            const started = await ev(`TavernDice.start(Object.assign({ opponent: "${opp}", stake: ${stake}, seed: ${seed}, turbo: 8, auto: "steady", rules: false, onEnd: r => { window.__end = r; window.__endScene = SceneManager._scene.constructor.name; } }, ${JSON.stringify(extra || {})}))`);
            await until(inScene, 15);
            const shots = [];
            const t0 = Date.now();
            while (Date.now() - t0 < 150000) {
                const tag = await ev("window.__td.shot");
                if (tag) { await sleep(300); await b.shot(path.join(SHOTS, tag + ".png")); shots.push(tag); await ev("TavernDice.scene().turbo = window.__td.turbo || 8; window.__td.shot = null; 0"); }
                const st = await J("TavernDice.state() && { phase: TavernDice.state().phase, end: TavernDice.state().end }");
                if (st && st.phase === "end" && st.end && (await ev("TavernDice.scene().phaseT")) > 30) break;
                await sleep(120);
            }
            const st = await J("TavernDice.state()");
            return { sim, started, st, before, shots };
        };
        const leaveEnd = async () => {
            await sleep(500);
            for (let i = 0; i < 20 && !(await ev(onMap)); i++) { await tap("escape"); await sleep(400); }
            await until(onMap + " && !!window.__end", 15);
            await sleep(300);
            return J(`({ end: window.__end, endScene: window.__endScene, gold: $gameParty.gold(), stats: TavernDice.stats(), hour: $gameSystem.dayNightHour(), notices: window.__notices.slice(), notes: (window.Journal ? Journal.data().notes.map(n => n.title) : []), xp: window.__xp.slice() })`);
        };
        const games = {};
        // Grum 15 G: a win; the moment the dice are in the air is shot
        const sGrum = await findSeed("grum", 15, true);
        const FREEZE_WIN = `function(st, scene) {
            if (st.phase === "play" && st.cup === "poured" && st.dice.some(d => d.h > 14) && st.game.turnNo >= 2) return "kosci_rzut";
            if (st.phase === "play" && st.game && st.game.over && st.game.potShown > 0 && st.game.potShown < st.game.pot) return "kosci_pula";
            if (st.phase === "end" && scene.phaseT > 12) return "kosci_wygrana";
            return null;
        }`;
        games.grum = await runAuto("grum", 15, sGrum, {}, FREEZE_WIN);
        games.grum.after = await leaveEnd();
        // Ozzy 5 G: a loss (and his "vision" forced on)
        const sOzzy = await findSeed("ozzy", 5, false);
        games.ozzy = await runAuto("ozzy", 5, sOzzy, { visions: 1 }, `function(st) { if (st.phase === "end" && TavernDice.scene().phaseT > 12) return "kosci_przegrana"; if (st.phase === "play" && /Mówiłem/.test(st.bubbles.rival)) return "kosci_ozzy"; return null; }`);
        games.ozzy.after = await leaveEnd();
        // the merchant 25 G: a win (a pot of 50: a big win)
        const sKup = await findSeed("kupiec", 25, true);
        games.kupiec = await runAuto("kupiec", 25, sKup);
        games.kupiec.after = await leaveEnd();
        // Bartek 5 G twice (two wins: he gives his pear-wood die)
        const sB1 = await findSeed("bartek", 5, true), sB2 = await findSeed("bartek", 5, true, sB1 + 1);
        games.bartek = await runAuto("bartek", 5, sB1);
        games.bartek.after = await leaveEnd();
        games.bartek2 = await runAuto("bartek", 5, sB2);
        games.bartek2.after = await leaveEnd();
        const brief = g => g && { sim: { winner: g.sim.winner, totals: g.sim.totals }, scene: g.st && g.st.game && { winner: g.st.game.winner, totals: g.st.game.totals }, gold: [g.before.gold, g.after.gold], end: g.after.end && g.after.end.last };
        for (const k of ["grum", "ozzy", "kupiec", "bartek"]) {
            const g = games[k];
            check("a full seeded game against " + k + " in the scene ends, and matches the same seed played headless (winner and scores)",
                g.started && g.st && g.st.game && g.st.game.over && g.st.game.winner === g.sim.winner && JSON.stringify(g.st.game.totals) === JSON.stringify(g.sim.totals), brief(g));
        }
        const goldOk = ["grum", "ozzy", "kupiec", "bartek", "bartek2"].map(k => { const g = games[k], st = g.st.game.stake, won = g.st.game.winner === 0; return { k, d: g.after.gold - g.before.gold, want: won ? st : -st }; });
        check("the gold: the stake goes into the pot at the start, the winner takes the pot (+stake net, or -stake)", goldOk.every(x => x.d === x.want), goldOk);
        check("onEnd gets the result back on the map ({ played, won, lost, net, last })", ["grum", "ozzy"].every(k => games[k].after.endScene === "Scene_Map" && games[k].after.end && games[k].after.end.played === 1 && games[k].after.end.last && games[k].after.end.last.opponent === k)
            && games.grum.after.end.won === 1 && games.grum.after.end.net === 15 && games.ozzy.after.end.lost === 1 && games.ozzy.after.end.net === -5, { grum: games.grum.after.end, ozzy: games.ozzy.after.end && games.ozzy.after.end.net });
        const st1 = games.bartek2.after.stats;
        check("the statistics in $gameSystem._dice: games, wins, losses, the biggest pot, the best throw, per rival", st1.games === 5 && st1.wins === 4 && st1.losses === 1 && st1.biggestPot === 50 && st1.bestThrow && st1.bestThrow.points > 0 && st1.vs.bartek.wins === 2 && st1.vs.ozzy.losses === 1,
            { games: st1.games, wins: st1.wins, losses: st1.losses, biggestPot: st1.biggestPot, best: st1.bestThrow, net: st1.net });
        const xp = games.grum.after.xp;
        check("a win gives a little experience via Combat.gainXp (Grum 15 G: 13, 'wygrana w kości'); a loss gives none", xp.length === 1 && xp[0][0] === 13 && xp[0][1] === "wygrana w kości" && games.ozzy.after.xp.length === 1, xp);
        check("the first win leaves a note in the journal ('Pierwsza wygrana w kości')", games.grum.after.notes.includes("Pierwsza wygrana w kości"), games.grum.after.notes.slice(-3));
        check("a big win (the merchant's 50 G pot) shows a notice at the top of the map", games.kupiec.after.notices.some(n => /Wielka wygrana w kości: \+50/.test(n)), games.kupiec.after.notices.slice(-3));
        check("Ozzy's 'vision': he mutters the throw before it lands, says 'Mówiłem', the hero wonders how he knew", games.ozzy.st.talk.some(t => t.who === 1 && /Mówiłem/.test(t.text)) && games.ozzy.st.talk.some(t => t.who === 0 && /wiedział/.test(t.text)), games.ozzy.st.talk.slice(-6));
        check("two wins over Bartek: he gives his die ('Kość z gruszy'); the second time he is tired for the day", games.bartek2.st.game.gift === "grusza" && games.bartek2.after.stats.owned.grusza === 1 && games.bartek2.st.end.why && /nie zagra/.test(games.bartek2.st.end.why),
            { gift: games.bartek2.st.game.gift, owned: games.bartek2.after.stats.owned, why: games.bartek2.st.end.why });
        check("time passes while playing (10 min + 2 min a turn)", games.grum.after.hour > games.grum.before.hour, { before: games.grum.before.hour, after: games.grum.after.hour });
        check("screenshots of the throw, the pot and the win", ["kosci_rzut", "kosci_wygrana"].every(t => games.grum.shots.includes(t)), games.grum.shots);

        // ================= 8. the special dice
        const weights = await J(`(function(){
            const N = 60000, p = (t, f, s) => TavernDice.rollStats(t, N, s)[f - 1] / N;
            const std = TavernDice.rollStats("std", N, 11), chi = std.reduce((a, c) => a + Math.pow(c - N / 6, 2) / (N / 6), 0);
            // through the game model: six lucky dice, the first throws of many turns
            const m = new TavernDice.Match({ target: 99999, rng: TavernDice.makeRng(77), first: 0, players: [{ key: "hero", dice: Array(6).fill("szczesciarz") }, { key: "x", dice: Array(6).fill("std") }] });
            let ones = 0, all = 0;
            for (let i = 0; i < 3000; i++) { const r = m.roll(); for (const d of r.dice) { all++; if (d.face === 1) ones++; } m.beginTurn(); }
            return { lucky1: p("szczesciarz", 1, 3), widow5: p("wdowa", 5, 4), raven1: p("krucze", 1, 5), raven3: p("krucze", 3, 5), pear1: p("grusza", 1, 6), chi: +chi.toFixed(2), match1: +(ones / all).toFixed(4) };
        })()`);
        check("special dice are weighted (60 000 seeded throws): lucky 1s ~26%, widow's 5s ~28%, raven's 1s ~25% and 3s ~12%, pear 1s ~20%",
            Math.abs(weights.lucky1 - 0.2647) < 0.01 && Math.abs(weights.widow5 - 0.2754) < 0.01 && Math.abs(weights.raven1 - 0.25) < 0.01 && Math.abs(weights.raven3 - 0.1176) < 0.01 && Math.abs(weights.pear1 - 0.1953) < 0.01, weights);
        check("a plain die is fair (chi-square of 60 000 throws < 15.1, p > 1%) and the game model rolls the lucky die's weights too", weights.chi < 15.09 && Math.abs(weights.match1 - 0.2647) < 0.012, { chi: weights.chi, match1: weights.match1 });
        const sd = await J(`(function(){
            const give = TavernDice.giveDie("szczesciarz"), bad = TavernDice.giveDie("nie-ma-takiej");
            const a = TavernDice.setDie(0, "szczesciarz"), b2 = TavernDice.setDie(1, "szczesciarz"), c = TavernDice.setDie(5, "grusza");
            return { give, bad, a, b2, c, dice: TavernDice.dice() };
        })()`);
        check("TavernDice.giveDie adds a special die (not a database item); the hero puts it into his six (one die, one slot)", sd.give && !sd.bad && sd.a && !sd.b2 && sd.c && sd.dice.set.join() === "szczesciarz,std,std,std,std,grusza" && sd.dice.owned.length === 2, sd);
        // the lobby with the special dice, then a game with them (they look different on the table)
        await ev("window.__td.freeze = (st) => st.phase === 'lobby' && TavernDice.scene().phaseT > 20 ? 'kosci_specjalne' : null; window.__td.shots = {}; 0");
        await ev("TavernDice.start({ seed: 3 }); 0");
        await until(inScene, 15);
        await ev("TavernDice.scene().lobby.row = 'dice'; TavernDice.scene().lobby.slot = 0; 0");
        await shotStop("kosci_specjalne", 10);
        const inLobby = await J("TavernDice.state()");
        await tap("escape");
        await until(onMap, 15);
        check("the lobby shows the hero's six with the special ones", inLobby.phase === "lobby");

        // ================= 9. a turn with the real keys (and a click), a bust and hot dice from set throws
        const firstSeed = await ev(`(function(){ for (let s = 1; s < 200; s++) if (TavernDice.setupGame("ozzy", TavernDice.streams(s).start).first === 0) return s; return -1; })()`);
        // (a) the hero throws with O, picks the best dice with the arrows + O, writes them down on "Zapisz"
        await ev(`window.__td.kb = { keys: [], done: 0, stuck: 0, turns: 0, hold: true, action: "bank" }; window.__td.shots = {}; window.__td.freeze = (st) => {
            const K = window.__td.kb; if (K && K.hold && st.wait === "choose" && K.want && K.want.every(i => st.dice[i] && st.dice[i].sel) && !st.dice.some(d => d.busy)) { K.hold = false; return "kosci_wybor"; } return null; }; 0`);
        await ev(`window.__end = null; TavernDice.start({ opponent: "ozzy", stake: 5, seed: ${firstSeed}, rules: false, heroDice: ["std","std","std","std","std","std"], script: [[1, 5, 3, 4, 6, 2]], target: 3000, onEnd: r => window.__end = r }); 0`);
        await until(inScene, 15);
        await shotStop("kosci_wybor", 60);
        await until("TavernDice.state() && TavernDice.state().game && TavernDice.state().game.totals[0] > 0", 30);
        const kb = await J(`({ kb: window.__td.kb, st: TavernDice.state() })`);
        check("the keys: O throws, arrows + O pick the dice (1-6 straight: all six), O on 'Zapisz' writes the turn down",
            kb.kb.done === 1 && kb.kb.stuck === 0 && kb.st.game.totals[0] === 1500 && kb.kb.keys.includes("O-throw") && kb.kb.keys.filter(k => k === "O").length === 6 && kb.kb.keys.includes("O-bank"), { keys: kb.kb.keys.join(" "), total: kb.st.game.totals });
        await ev("window.__td.kb = null; window.__td.freeze = null; 0");
        // (b) leaving in the middle: P, then "Odchodzę" - the stake is lost
        const goldMid = await ev("$gameParty.gold()");
        await until("TavernDice.state() && TavernDice.state().phase === 'play'", 10);
        await ev("window.__td.freeze = (st) => st.phase === 'confirm' && TavernDice.scene().phaseT > 6 ? 'kosci_wyjscie' : null; 0");
        await tap("escape");
        await shotStop("kosci_wyjscie", 10);
        const conf = await J("TavernDice.state()");
        await tap("right"); await tap("ok");
        await until(onMap + " && !!window.__end", 20);
        const left = await J(`({ end: window.__end, gold: $gameParty.gold(), stats: TavernDice.stats() })`);
        check("P in the middle of a game asks first; 'Odchodzę' ends it - the stake stays in the pot (no gold back), counted as left",
            conf.phase === "confirm" && left.end && left.end.left === 1 && left.end.net === -5 && left.gold === goldMid && left.stats.left === 1, { conf: conf.phase, end: left.end && { left: left.end.left, net: left.end.net }, gold: [goldMid, left.gold] });
        // (c) a bust and hot dice from set throws; the mouse picks a die
        await ev(`window.__td.shots = {}; window.__td.freeze = (st) => st.banner === "bust" && TavernDice.scene().banner.t > 14 ? "kosci_pudlo" : st.banner === "hot" && TavernDice.scene().banner.t > 16 ? "kosci_gorace" : null; 0`);
        await ev(`window.__end = null; TavernDice.start({ opponent: "grum", stake: 10, seed: ${await ev(`(function(){ for (let s = 1; s < 200; s++) if (TavernDice.setupGame("grum", TavernDice.streams(s).start).first === 0) return s; return -1; })()`)}, rules: false, heroDice: ["szczesciarz","std","std","std","std","grusza"], script: [[1, 1, 1, 5, 5, 5], [2, 3, 4, 6, 6, 2]], onEnd: r => window.__end = r }); 0`);
        await until(inScene, 15);
        await until("TavernDice.state().wait === 'throw'", 30);
        await ev("TavernDice.act('throw'); 0");
        await until("TavernDice.state().wait === 'choose' && !TavernDice.state().dice.some(d => d.busy)", 30);
        const d0 = await J("TavernDice.state().dice[0]");
        const click = async (x, y) => { for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) { await b.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }); await sleep(60); } await sleep(200); };
        await click(d0.x, d0.y);
        const clicked = await J("TavernDice.state().dice[0].sel");
        await click(d0.x, d0.y);
        const unclicked = await J("TavernDice.state().dice[0].sel");
        check("the mouse: a click on a die sets it aside, another click takes it back", clicked === true && unclicked === false, { d0, clicked, unclicked });
        await ev("TavernDice.act('select', [0,1,2,3,4,5]); TavernDice.act('roll'); 0");
        await shotStop("kosci_gorace", 30);
        const hot = await J("TavernDice.state().game");
        await shotStop("kosci_pudlo", 30);
        const bust = await J("TavernDice.state()");
        check("hot dice: all six set aside and thrown again ('Gorące kości!'), then a bust ('Pudło!') loses the turn's 1500",
            hot.hot[0] === 1 && bust.banner === "bust" && bust.game.totals[0] === 0 && bust.game.busts[0] === 1, { hot: hot.hot, busts: bust.game.busts, totals: bust.game.totals });
        check("the hero's special dice go to the table (lucky die and the pear die in his six)", JSON.stringify(bust.game.heroDice) === JSON.stringify(["szczesciarz", "std", "std", "std", "std", "grusza"]), bust.game.heroDice);
        await ev("window.__td.freeze = null; TavernDice.scene().turbo = 10; TavernDice.scene().opts.auto = 'steady'; 0");
        await until("TavernDice.state() && TavernDice.state().phase === 'end'", 120);
        await leaveEnd();

        // ================= 10. the tavern's fame (QuestBoard.js): the merchant from "Swój chłop" (40), the stranger from "Chluba tawerny" (80)
        const qb = await ev(`new Promise(res => { if (window.__QB) { window.QuestBoard = window.__QB; return res(true); } if (window.QuestBoard) return res(true); const s = document.createElement("script"); s.src = "js/plugins/QuestBoard.js?" + Date.now(); s.onload = () => res(!!window.QuestBoard); s.onerror = () => res(false); document.body.appendChild(s); })`);
        check("QuestBoard.js is there (the fame is read from QuestBoard.reputation())", qb && (await ev("typeof QuestBoard.reputation === 'function'")));
        const fameAt = (rep, hour) => J(`(function(){ QuestBoard.state().rep = ${rep}; return { fame: TavernDice.fame(), present: TavernDice.present(${hour}, 1).map(p => p.key), locked: TavernDice.locked(${hour}, 1) }; })()`);
        const f0 = await fameAt(0, 19.5), f45 = await fameAt(45, 19.5), f45n = await fameAt(45, 22), f85 = await fameAt(85, 22), f85d = await fameAt(85, 19.5);
        check("fame 0 (Nowy w okolicy): the merchant is in the hall but does not play with the hero", f0.fame === 0 && !f0.present.includes("kupiec") && f0.locked.includes("kupiec"), f0);
        check("fame 45 (Swój chłop): the merchant plays; the stranger does not come yet", f45.present.includes("kupiec") && !f45n.present.includes("nieznajomy") && f45n.locked.includes("nieznajomy"), { f45, f45n });
        const strangerCfg = await J(`[TavernDice.OPPONENTS.nieznajomy.stakes.join(), TavernDice.targetFor(100, "nieznajomy"), TavernDice.OPPONENTS.nieznajomy.bust]`);
        check("fame 85 (Chluba tawerny): the stranger in the hood sits down in the evening (21-24) - 100 G, to 3000, bust Evil_8", f85.present.includes("nieznajomy") && !f85d.present.includes("nieznajomy") && strangerCfg.join() === "100,3000,Evil_8", { f85, f85d, strangerCfg });
        // the lobby at fame 10: why the merchant does not sit down
        await ev("QuestBoard.state().rep = 10; $gameSystem.setDayNightHour(19.5); window.__td.shots = {}; window.__td.freeze = (st, sc) => st.phase === 'lobby' && sc.phaseT > 24 ? 'kosci_slawa' : null; 0");
        await ev("TavernDice.start({ seed: 8 }); 0");
        await until(inScene, 15);
        await shotStop("kosci_slawa", 15);
        const lh = await J("TavernDice.state().lobby");
        await tap("escape");
        await until(onMap, 15);
        check("the lobby says why the merchant does not play: 'gra tylko z ludźmi, których zna'", lh && /gra tylko z ludźmi, których zna/.test(lh.hint) && !lh.cards.some(c => c.key === "kupiec"), lh);
        const sHint = await findSeed("ozzy", 5, false);
        games.hint = await runAuto("ozzy", 5, sHint);
        games.hint.after = await leaveEnd();
        check("...and a rival says it at the table (Ozzy)", games.hint.st.talk.some(t => t.who === 1 && /których zna/.test(t.text)), games.hint.st.talk.map(t => t.text).slice(0, 4));
        // the stranger: the first win gives his die from Krucze Skały (the hero has none yet)
        await ev("QuestBoard.state().rep = 85; $gameSystem.setDayNightHour(22); 0");
        const sN = await findSeed("nieznajomy", 100, true);
        const hadKrucze = await ev("TavernDice.dice().owned.some(d => d.key === 'krucze')");
        const FREEZE_N = `function(st, scene) {
            if (st.phase === "play" && st.game.cur === 1 && st.game.turnNo >= 2 && st.dice.length >= 3 && !st.dice.some(d => d.busy) && st.dice.some(d => d.sel)) return "kosci_nieznajomy";
            if (st.phase === "end" && scene.phaseT > 12) return "kosci_nieznajomy_wygrana";
            return null;
        }`;
        games.n1 = await runAuto("nieznajomy", 100, sN, {}, FREEZE_N);
        games.n1.after = await leaveEnd();
        check("the stranger's game: 100 G each, to 3000, the same as the headless game", games.n1.st.game.target === 3000 && games.n1.st.game.stake === 100 && games.n1.st.game.winner === games.n1.sim.winner && JSON.stringify(games.n1.st.game.totals) === JSON.stringify(games.n1.sim.totals), brief(games.n1));
        check("the first win over him gives the rare die from Krucze Skały (+100 G net from the pot)", !hadKrucze && games.n1.st.game.gift === "krucze" && games.n1.after.stats.owned.krucze === 1 && games.n1.after.gold - games.n1.before.gold === 100,
            { gift: games.n1.st.game.gift, owned: games.n1.after.stats.owned, d: games.n1.after.gold - games.n1.before.gold });
        // a game (save) where the quest board gave that die first: the stranger's first win gives a purse instead
        await ev("$gameSystem._dice.vs.nieznajomy = { games: 0, wins: 0, losses: 0, day: 0, lostToday: 0, given: false }; 0");
        games.n2 = await runAuto("nieznajomy", 100, sN);
        games.n2.after = await leaveEnd();
        check("...and when the hero has it already (e.g. from the quest board): a purse of 100 G instead (pot +100, purse +100)", !games.n2.st.game.gift && games.n2.st.game.giftGold === 100 && games.n2.after.gold - games.n2.before.gold === 200 && games.n2.after.stats.owned.krucze === 1,
            { gift: games.n2.st.game.gift, giftGold: games.n2.st.game.giftGold, d: games.n2.after.gold - games.n2.before.gold });
        const shots = fs.readdirSync(SHOTS).filter(f => /^kosci_.*\.png$/.test(f));
        check("screenshots saved in docs/tawerna_zycie/ (start, rules, mid-throw, selection, bust, hot dice, win, fame, the stranger)", ["kosci_start", "kosci_zasady", "kosci_rzut", "kosci_wybor", "kosci_pudlo", "kosci_gorace", "kosci_wygrana", "kosci_slawa", "kosci_nieznajomy"].every(n => shots.includes(n + ".png")), shots);
        check("nothing left running, back on the map", !(await ev("TavernDice.isRunning()")) && (await ev(onMap)));
    } catch (e) { console.log("ERR", e.stack || e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    check("no errors in the console", !err.length, err.slice(-6));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
