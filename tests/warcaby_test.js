// Draughts at the chess-board table in the games room (TavernLife_Warcaby.js, 2026-11-19): the rules (the start, captures a must and
// to the end, men capture backwards, crowned only at the end, flying kings, no move = lost), the rivals' minds (legal, quick enough,
// stronger than a random mover), the "O Zagraj w warcaby" plate from every side of the table, O there opens the talk, a whole game
// played by a bot (the stake won, the numbers), a game given up from the talk (the stake lost). CDP_PORT=9591.
const kit = require("./lib/kit.js");
const path = require("path");
const SHOTS = path.join(__dirname, "..", "docs", "warcaby");
require("fs").mkdirSync(SHOTS, { recursive: true });

kit.test({ port: Number(process.env.CDP_PORT) || 9591, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    await t.newGame({ map: 1, x: 43, y: 39, day: 3, hour: 19, quiet: true, minimap: false });
    await t.frames(60);
    await t.dismiss(10);

    // ================= the rules
    const R = await t.json(`(function(){
        const W = TavernLife.WARCABY, at = W.at;
        const B = list => { const b = new Int8Array(64); for (const [r, c, v] of list) b[at(r, c)] = v; return b; };
        const out = {};
        const s = W.newBoard();
        out.start = [W.count(s, 1), W.count(s, -1), W.legalMoves(s, 1).length, W.legalMoves(s, -1).every(m => (m.to >> 3) === 3)];
        let b = B([[5, 2, 1], [4, 3, -1], [5, 6, 1]]);
        out.must = W.legalMoves(b, 1).map(m => [m.from, m.path.join("-"), m.caps.join("-")]);
        b = B([[3, 2, 1], [4, 3, -1]]);
        out.back = W.legalMoves(b, 1).map(m => [m.from, m.to, m.caps.join("-")]);
        b = B([[6, 1, 1], [5, 2, -1], [3, 4, -1], [7, 7, -1]]);
        out.multi = W.legalMoves(b, 1).map(m => [m.path.join("-"), m.caps.length]);
        b = B([[2, 1, 1], [1, 2, -1], [1, 4, -1]]);
        out.crown = W.legalMoves(b, 1).map(m => [m.path.join("-"), m.promote]);
        b = B([[1, 2, 1]]);
        out.crownEnd = W.legalMoves(b, 1).map(m => [m.to, m.promote]);
        b = B([[7, 0, 2], [3, 4, -1]]);
        out.king = W.legalMoves(b, 1).map(m => [m.to, m.caps.join("-")]);
        b = B([[7, 0, 2]]);
        out.kingSteps = W.legalMoves(b, 1).length;
        b = B([[4, 1, 1], [3, 0, -1], [3, 2, -1], [2, 3, -1]]);
        out.stuck = W.legalMoves(b, 1).length;
        b = W.applyMove(B([[2, 1, 1], [1, 2, -1]]), W.legalMoves(B([[2, 1, 1], [1, 2, -1]]), 1)[0]);
        out.applied = [b[at(0, 3)], b[at(1, 2)], b[at(2, 1)]];
        return out; })()`);
    t.check("start: 12 na 12, 7 ruchów białych, czarne idą w dół", R.start.join() === "12,12,7,true", R.start);
    t.check("bicie obowiązkowe: jedyny ruch to bicie (5,2)x(4,3)", R.must.length === 1 && R.must[0][1] === "28" && R.must[0][2] === "35", R.must);
    t.check("pionek bije do tyłu", R.back.some(m => m[1] === 44 && m[2] === "35"), R.back);
    t.check("bicie wielokrotne do końca: dwa pionki w jednym ruchu", R.multi.length === 1 && R.multi[0][0] === "35-21" && R.multi[0][1] === 2, R.multi);
    t.check("przejście przez ostatni rząd w trakcie bicia nie daje damki, bije dalej", R.crown.length === 1 && R.crown[0][0] === "3-21" && R.crown[0][1] === false, R.crown);
    t.check("pionek kończący ruch w ostatnim rzędzie zostaje damką", R.crownEnd.length === 2 && R.crownEnd.every(m => m[1] === true), R.crownEnd);
    t.check("damka bije z daleka i ląduje na każdym wolnym polu za zbitym", R.king.length === 3 && R.king.every(m => m[1] === "28"), R.king);
    t.check("damka chodzi na całą przekątną (7 pól)", R.kingSteps === 7, R.kingSteps);
    t.check("bez ruchu (zablokowany pionek)", R.stuck === 0, R.stuck);
    t.check("po ruchu: damka na końcu, zbity zdjęty", R.applied.join() === "2,0,0", R.applied);

    // ================= the rivals' minds: legal, quick, stronger than a random mover
    const M = await t.json(`(function(){
        const W = TavernLife.WARCABY, out = {};
        const seeded = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
        for (const key of ["ozzy", "wiesiek", "kupiec"]) {
            const rng = seeded(11), mind = W.OPPONENTS[key].mind;
            let b = W.newBoard(), side = 1, plies = 0, worst = 0, illegal = 0, nodes = 0, loser = 0;
            while (plies < 300) {
                const ms = W.legalMoves(b, side);
                if (!ms.length) { loser = side; break; }
                let m;
                if (side === 1) m = ms[Math.floor(rng() * ms.length)];
                else {
                    const t0 = performance.now(), r = W.chooseMove(b, side, mind, rng);
                    worst = Math.max(worst, performance.now() - t0);
                    nodes = Math.max(nodes, r.nodes);
                    m = r.move;
                    if (!ms.some(x => x.from === m.from && x.path.join() === m.path.join())) illegal++;
                }
                b = W.applyMove(b, m); side = -side; plies++;
            }
            out[key] = { loser, plies, worstMs: Math.round(worst), nodes, illegal };
        }
        return out; })()`);
    for (const key of ["ozzy", "wiesiek", "kupiec"]) {
        const r = M[key];
        t.check(`${key}: same legalne ruchy, wygrywa z losowym graczem (${r.plies} półruchów), najdłuższy namysł ${r.worstMs} ms`, r.illegal === 0 && r.loser === 1 && r.worstMs < 250, r);
    }

    // ================= the plate beside the table, from every side
    await t.eval("$gameSystem._minimapHidden = true; 0");
    const at = async (x, y, d) => { await t.locate(x, y, d); await t.frames(12);
        return t.json("({ label: SceneManager._scene._spotLabel || null, shown: !!(SceneManager._scene._spotPrompt && SceneManager._scene._spotPrompt.visible) })"); };
    const sides = { dol: await at(43, 38, 8), lewo: await at(41, 37, 6), prawo: await at(46, 37, 4), gora: await at(43, 35, 2), gora2: await at(44, 35, 2) };
    t.check("przy stoliku z szachownicą z każdej strony: O Zagraj w warcaby", Object.values(sides).every(s => s.label === "Zagraj w warcaby" && s.shown), sides);
    await at(43, 38, 8);
    await t.shot(path.join(SHOTS, "warcaby_0_okienko.png"));
    const far = await at(43, 40, 8);
    t.check("dwa kroki dalej: bez okienka", !far.shown, far);
    // O there: the talk (with whom)
    await at(43, 38, 8);
    await t.press("ok");
    await t.frames(40);
    const talk = await t.json("({ busy: $gameMessage.isBusy(), choices: $gameMessage.choices() })");
    t.check("O przy stoliku: z kim zagrać (Wiesiek, kupiec wieczorem, Nie teraz)", talk.busy && talk.choices.includes("Z furmanem Wieśkiem") && talk.choices.includes("Z kupcem Wawrzyńcem") && talk.choices[talk.choices.length - 1] === "Nie teraz", talk);
    for (let i = 0; i < 6 && (await t.json("$gameMessage.isBusy()")); i++) {
        if (await t.json("$gameMessage.isChoice()")) await t.press("escape"); else await t.press("ok");
        await t.frames(12);
    }
    await t.dismiss(10);

    // ================= a whole game, a bot as the hero (depth 4) against Ozzy
    await t.eval("$gameParty.loseGold($gameParty.gold()); $gameParty.gainGold(60); 0");
    const BOT = `(function(){
        let s = 5; const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;
        window.__wq = []; window.__hold = false; window.__endOk = true; window.__resign = false; window.__stopAt = 12;
        TavernLife.onTick = function(scene) {
            const I = Input._currentState; I.ok = false;
            if (window.__hold) return;
            if (scene.phase === "card" || (scene.phase === "summary" && window.__endOk)) { if (scene.t % 8 === 0) I.ok = true; return; }
            if (scene.phase !== "you" || scene.phaseT < 3) return;
            if (window.__resign) { scene.giveUp(); return; }
            if (window.__stopAt && scene.plies >= window.__stopAt && !scene.path.length && !window.__wq.length) {   // (a piece picked for the screenshot)
                window.__stopAt = 0; window.__hold = true; scene.turbo = 1; scene.press(scene.legal[0].from); return;
            }
            if (!window.__wq.length) {
                const r = TavernLife.WARCABY.chooseMove(scene.board, 1, { depth: 4, nodes: 20000 }, rng);
                if (!r.move) return;
                window.__wq = [r.move.from].concat(r.move.path);
            }
            if (!scene.press(window.__wq.shift())) window.__wq = [];
        };
        return 0; })()`;
    await t.eval(BOT);
    await t.eval("window.__hold = true; 0");
    await t.eval("TavernLife.warcaby({ stake: 5, seed: 11, turbo: 3, opponent: 'ozzy' }); 0");
    await t.until("SceneManager._scene instanceof Scene_Warcaby && SceneManager._scene.phase === 'card' && SceneManager._scene.card && SceneManager._scene.card.t > 20", 30);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "warcaby_1_karta.png"));
    await t.eval("window.__hold = false; 0");
    await t.until("SceneManager._scene instanceof Scene_Warcaby && window.__hold && SceneManager._scene.sel >= 0", 120);
    await t.frames(30);
    const mid = await t.json("(s => ({ sel: s.sel, legal: s.legal.length, you: s.you, opp: s.opp, plies: s.plies }))(SceneManager._scene.state())");
    t.check(`w trakcie (półruch ${mid.plies}): wybrany pionek, pola ruchu zaznaczone`, mid.sel >= 0, mid);
    await t.shot(path.join(SHOTS, "warcaby_2_wybor.png"));
    await t.eval("(sc => { sc.press(sc.sel); sc.turbo = 3; window.__hold = false; })(SceneManager._scene); 0");
    await t.eval("window.__endOk = false; 0");
    await t.until("SceneManager._scene instanceof Scene_Warcaby && SceneManager._scene.phase === 'summary' && SceneManager._scene.card && SceneManager._scene.card.t > 30", 240);
    await t.eval("SceneManager._scene.turbo = 1; 0");
    await t.frames(30);
    await t.shot(path.join(SHOTS, "warcaby_3_koniec.png"));
    await t.eval("window.__endOk = true; 0");
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 30);
    await t.frames(30);
    const g1 = await t.json("({ gold: $gameParty.gold(), r: TavernLife.lastResult, st: TavernLife.stats().warcaby })");
    t.check(`partia z Ozzym do końca: ${g1.r && g1.r.won ? "wygrana" : g1.r && g1.r.draw ? "remis" : "przegrana"} ${g1.r && g1.r.you}:${g1.r && g1.r.opp}, złoto ${g1.gold}`, g1.r && g1.r.game === "warcaby" && g1.st && g1.st.played === 1
        && ((g1.r.won && g1.gold === 65 && g1.st.won === 1) || (g1.r.draw && g1.gold === 60 && g1.st.draws === 1) || (!g1.r.won && !g1.r.draw && g1.gold === 55 && g1.st.lost === 1)), g1);
    t.check("bot (głębokość 4) ogrywa Ozzego", !!(g1.r && g1.r.won), g1.r);

    // ================= from the talk: Wiesiek for 10 G, given up
    await t.eval("window.__resign = true; 0");
    await t.locate(43, 38, 8);
    await t.frames(10);
    const tk = await t.talkTo("$gameMap.eventsXy(42, 37).find(e => /warcaby/.test(e.event().name))", ["Z furmanem Wieśkiem", "Stawka 10 G"], { secs: 60, place: false });
    t.check("rozmowa: Wiesiek pyta o stawkę", tk.log.some(l => /O ile gramy/.test(l.t)), tk.text);
    await t.frames(30);
    const g2 = await t.json("({ gold: $gameParty.gold(), r: TavernLife.lastResult, st: TavernLife.stats().warcaby })");
    t.check("poddana partia z Wieśkiem: −10 G, przegrana w liczbach", g2.r && g2.r.gaveUp && g2.r.opponent === "wiesiek" && g2.gold === g1.gold - 10 && g2.st.played === 2, g2);
    await t.eval("TavernLife.onTick = null; 0");
});
