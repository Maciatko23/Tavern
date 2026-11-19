// Makao at the card table in the games room (TavernLife_Makao.js, 2026-11-19): the rules (the deal, suit or rank, the queen on
// anything, war and its defence, the king of spades backwards, stop, the jack's request for a round, the ace's suit, the deck
// reshuffled), the rivals' play (hundreds of turns, only legal plays, every game ends), "Makao!" said or forgotten (+5), a whole game
// played by a bot (the pot), the talk at the table (who sits there, the stake, given up). CDP_PORT=9592.
// With the seat events on Map001 (<Tavern:makao>, 35,37 and 36,36): the "O Zagraj w makao" plate from every side.
const kit = require("./lib/kit.js");
const path = require("path");
const SHOTS = path.join(__dirname, "..", "docs", "makao");
require("fs").mkdirSync(SHOTS, { recursive: true });

kit.test({ port: Number(process.env.CDP_PORT) || 9592, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    await t.newGame({ map: 1, x: 36, y: 39, day: 3, hour: 19, quiet: true, minimap: false });
    await t.frames(60);
    await t.dismiss(10);

    // ================= the rules
    const R = await t.json(`(function(){
        const M = TavernLife.MAKAO, C = (r, s) => s * 13 + r - 2, out = {};
        const seeded = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
        const st0 = M.newGame(3, seeded(3)), d = M.deal(st0);
        out.deal = [st0.hands.map(h => h.length).join(), d.order.length, M.rankOf(d.starter) >= 5 && M.rankOf(d.starter) <= 10, st0.draw.length];
        const S = (top, extra) => Object.assign(M.newGame(3, seeded(5)), { discard: [top] }, extra || {});
        let st = S(C(7, 1));   // 7 kier on top
        out.plain = [M.fits(st, C(9, 1)), M.fits(st, C(7, 3)), M.fits(st, C(9, 3)), M.fits(st, C(12, 0)), M.fits(Object.assign(S(C(12, 0))), C(5, 2))];
        st = S(C(2, 1), { war: 2 });   // war: a 2 of hearts
        out.war = [M.fits(st, C(2, 0)), M.fits(st, C(3, 1)), M.fits(st, C(13, 1)), M.fits(st, C(13, 0)), M.fits(st, C(5, 1)), M.fits(st, C(12, 1))];
        st = S(C(2, 1), { war: 2 }); st.hands[1] = [C(3, 1), C(9, 0)];
        M.play(st, 1, [C(3, 1)], null);
        const tk = M.take(st, 2, seeded(9));
        out.warSum = [tk.kind, tk.cards.length, st.war, st.hands[2].length];
        st = S(C(6, 0)); st.hands[1] = [C(13, 0), C(9, 0)];
        const back = M.play(st, 1, [C(13, 0)], null);
        out.kingBack = back.back ? [back.back.to, back.back.n, st.war] : null;
        st = S(C(6, 1)); st.hands[0] = [C(13, 1), C(9, 0)];
        M.play(st, 0, [C(13, 1)], null);
        out.kingFwd = [st.war, M.fits(st, C(13, 0)), M.fits(st, C(9, 1))];
        st = S(C(4, 2)); st.hands[0] = [C(4, 0), C(4, 3), C(8, 0)];
        M.play(st, 0, [C(4, 0), C(4, 3)], null);
        out.stop = [st.stop, M.fits(st, C(4, 1)), M.fits(st, C(5, 3))];
        const so = M.take(st, 1, seeded(1));
        out.stopTake = [so.kind, st.skip[1], st.stop];
        st = S(C(11, 2)); st.hands[0] = [C(11, 3), C(5, 1)];
        M.play(st, 0, [C(11, 3)], 7);
        const req = [st.req, M.fits(st, C(7, 0)), M.fits(st, C(8, 3)), M.fits(st, C(11, 1))];
        for (let i = 0; i < 2; i++) M.next(st);
        req.push(st.req);
        M.next(st); req.push(st.req);
        M.next(st); req.push(st.req);
        out.req = req;
        st = S(C(14, 2)); st.hands[0] = [C(14, 0), C(5, 1)];
        M.play(st, 0, [C(14, 0)], 1);
        out.ace = [st.suit, M.fits(st, C(9, 1)), M.fits(st, C(9, 0)), M.fits(st, C(14, 3))];
        st.hands[1] = [C(9, 1), C(6, 0)];
        M.play(st, 1, [C(9, 1)], null);
        out.ace.push(st.suit);
        st = S(C(7, 1)); st.hands[0] = [C(7, 0), C(7, 2), C(7, 3), C(5, 0)];
        out.multi = [M.canPlay(st, [C(7, 0), C(7, 2), C(7, 3)]), M.canPlay(st, [C(7, 0), C(5, 0)])];
        M.play(st, 0, [C(7, 0), C(7, 2), C(7, 3)], null);
        out.multi.push(st.hands[0].length, st.discard.length);
        st = S(C(7, 1)); st.draw = []; st.discard = [C(5, 0), C(6, 0), C(8, 2), C(7, 1)];
        const got = M.drawCards(st, 0, 2, seeded(4));
        out.reshuffle = [got.length, st.discard.join(), st.draw.length];
        return out; })()`);
    t.check("rozdanie: po 5 kart, pierwsza karta na stosie zwykła (5-10)", R.deal[0] === "5,5,5" && R.deal[1] === 15 && R.deal[2] && R.deal[3] === 36, R.deal);
    t.check("kolor albo figura; dama na wszystko, wszystko na damę", R.plain.join() === "true,true,false,true,true", R.plain);
    t.check("wojna: odbić tylko 2/3/król kier lub pik w kolorze albo figurze", R.war.join() === "true,true,true,false,false,false", R.war);
    t.check("wojna się sumuje (2+3), kto nie odbije, bierze 5", R.warSum.join() === "war,5,0,5", R.warSum);
    t.check("król pik: 5 kart od razu dla poprzedniego", R.kingBack && R.kingBack.join() === "0,5,0", R.kingBack);
    t.check("król kier: 5 dla następnego, odbić królem pik (figura) można", R.kingFwd.join() === "5,true,false", R.kingFwd);
    t.check("czwórki: dwie naraz = 2 kolejki stania, tylko czwórka odbija", R.stop.join() === "2,true,false" && R.stopTake.join() === "stop,1,0", { stop: R.stop, take: R.stopTake });
    t.check("walet żąda siódemek na całą kolejkę (z żądającym), potem koniec", R.req.join() === "7,true,false,true,7,7,0", R.req);
    t.check("as zmienia kolor na kier; kier albo as; zagrany kier zdejmuje żądanie", R.ace.join() === "1,true,false,true,-1", R.ace);
    t.check("kilka kart jednej figury naraz", R.multi.join() === "true,false,1,4", R.multi);
    t.check("pusta talia: stos pod wierzchnią kartą tasowany na nowo", R.reshuffle[0] === 2 && R.reshuffle[1] === String(1 * 13 + 7 - 2) && R.reshuffle[2] === 1, R.reshuffle);

    // ================= the rivals' play: 60 games of three rivals
    const A = await t.json(`(function(){
        const M = TavernLife.MAKAO, keys = ["ozzy", "wiesiek", "kupiec"], wins = [0, 0, 0];
        let illegal = 0, longest = 0, unfinished = 0, worst = 0, cards = 0;
        for (let g = 0; g < 60; g++) {
            let s = 1000 + g; const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;
            const st = M.newGame(3, rng); M.deal(st);
            while (st.winner < 0 && st.turns < 400) {
                const p = st.turn, mind = M.RIVALS[keys[p]].mind;
                if (st.skip[p] > 0 && st.stop === 0) { st.skip[p]--; M.next(st); continue; }
                const t0 = performance.now(), d = M.decide(st, p, mind, rng);
                worst = Math.max(worst, performance.now() - t0);
                if (d) {
                    if (!M.canPlay(st, d.cards) || d.cards.some(c => !st.hands[p].includes(c))) illegal++;
                    const res = M.play(st, p, d.cards, d.choice);
                    if (res.back) M.drawCards(st, res.back.to, res.back.n, rng);
                } else {
                    const tk = M.take(st, p, rng);
                    if (tk.kind === "one" && tk.cards.length && M.fits(st, tk.cards[0])) M.play(st, p, [tk.cards[0]], M.choiceFor(st, p, [tk.cards[0]]));
                }
                if (st.winner < 0) M.next(st);
            }
            const all = st.hands.reduce((a, h) => a + h.length, 0) + st.draw.length + st.discard.length;
            if (all !== 52) cards++;
            if (st.winner < 0) unfinished++; else wins[st.winner]++;
            longest = Math.max(longest, st.turns);
        }
        return { wins, illegal, longest, unfinished, worstMs: Math.round(worst * 10) / 10, lostCards: cards }; })()`);
    t.check(`rywale: 60 partii, same legalne ruchy, każda się kończy (najdłuższa ${A.longest} tur), talia zawsze 52 karty; wygrane Ozzy/Wiesiek/kupiec ${A.wins.join("/")}`,
        A.illegal === 0 && A.unfinished === 0 && A.lostCards === 0 && A.worstMs < 20, A);
    t.check("kupiec wygrywa częściej niż Ozzy", A.wins[2] > A.wins[0], A.wins);

    // ================= the bot (the hero)
    await t.eval("$gameParty.loseGold($gameParty.gold()); $gameParty.gainGold(60); $gameSystem._minimapHidden = true; 0");
    const BOT = `(function(){
        let s = 77; const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;
        window.__q = []; window.__qTurn = -1; window.__hold = false; window.__endOk = true; window.__resign = false; window.__sayMakao = true; window.__said = 0;
        TavernLife.onTick = function(scene) {
            if (window.__hold) return;
            const I = Input._currentState; I.ok = false; I.shift = false;
            if (scene.card) {
                if (scene.card.kind === "choice") { if (scene.card.t > 8) scene.pickChoice(0); }
                else if (scene.t % 8 === 0 && (scene.phase !== "summary" || window.__endOk)) I.ok = true;
                return;
            }
            if (scene.phase === "makao") { if (window.__sayMakao && scene.phaseT > 10) I.shift = true; return; }
            if (scene.phase !== "you" || scene.phaseT < 3) return;
            if (window.__resign) { scene.giveUp(); return; }
            const M = TavernLife.MAKAO, st = scene.st;
            if (scene.drawn >= 0) { scene.heroPick(scene.drawn); return; }
            if (window.__qTurn !== st.turns) {
                window.__qTurn = st.turns;
                const d = M.decide(st, 0, { noise: 2, aggr: 2 }, rng);
                if (!d) { window.__q = ["take"]; }
                else {
                    window.__q = d.cards.slice();
                    if (d.cards.length > 1 || st.hands[0].some(c => !d.cards.includes(c) && M.rankOf(c) === M.rankOf(d.cards[0]))) window.__q.push(d.cards[0]);
                    if (window.__sayMakao && st.hands[0].length - d.cards.length === 1) { I.shift = true; window.__said++; return; }
                }
            }
            const a = window.__q.shift();
            if (a === undefined) return;
            if (a === "take") scene.heroTake(); else scene.heroPick(a);
        };
        return 0; })()`;
    await t.eval(BOT);

    // "Makao!" forgotten: two cards, one played, no Shift -> five more
    const setTwo = `(sc => { const M = TavernLife.MAKAO, st = sc.st, top = st.discard[st.discard.length - 1], s = M.suitOf(top), r = M.rankOf(top);
        const a = s * 13 + (r === 7 ? 8 : 7) - 2, b = ((s + 1) % 4) * 13 + (r === 9 || M.rankOf(a) === 9 ? 10 : 9) - 2;
        for (const h of st.hands) for (const c of [a, b]) { const i = h.indexOf(c); if (i >= 0) h.splice(i, 1); }
        for (const c of [a, b]) { const i = st.draw.indexOf(c); if (i >= 0) st.draw.splice(i, 1); }
        st.draw.push(...st.hands[0].splice(0)); st.hands[0].push(a, b); st.war = 0; st.stop = 0; st.req = 0; st.suit = -1;
        window.__two = [a, b]; })(SceneManager._scene); 0`;
    await t.eval("window.__hold = true; 0");
    await t.eval("TavernLife.makao({ stake: 5, rivals: ['wiesiek', 'bartek'], seed: 41, turbo: 2 }); 0");
    await t.until("SceneManager._scene instanceof Scene_Makao && SceneManager._scene.phase === 'card' && SceneManager._scene.card && SceneManager._scene.card.t > 20", 30);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "makao_1_karta.png"));
    await t.eval("SceneManager._scene.hideCard(); SceneManager._scene.dealOut(); 0");
    await t.until("SceneManager._scene.phase === 'you'", 30);
    await t.eval(setTwo);
    await t.frames(20);
    await t.eval("SceneManager._scene.heroPick(window.__two[0]); 0");
    await t.until("SceneManager._scene.phase === 'makao'", 10);
    await t.frames(10);
    await t.shot(path.join(SHOTS, "makao_2_krzyknij.png"));
    await t.until("SceneManager._scene.phase !== 'makao' && SceneManager._scene.phase !== 'anim'", 20);
    const forgot = await t.json("SceneManager._scene.st.hands[0].length");
    t.check("zapomniane „Makao!”: z jednej karty robi się sześć", forgot === 6, forgot);
    // said in time (Shift)
    await t.until("SceneManager._scene.phase === 'you'", 60);
    await t.eval(setTwo);
    await t.frames(10);
    await t.eval("Input._currentState.shift = true; 0"); await t.frames(3); await t.eval("Input._currentState.shift = false; 0");
    await t.eval("SceneManager._scene.heroPick(window.__two[0]); 0");
    await t.frames(60);
    const said = await t.json("({ n: SceneManager._scene.st.hands[0].length, said: SceneManager._scene.bubbleL.text })");
    t.check("„Makao!” pod Shift przed ruchem: zostaje jedna karta, dymek „Makao!”", said.n === 1 && said.said === "Makao!", said);
    await t.eval("window.__hold = false; SceneManager._scene.giveUp(); 0");
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 30);
    await t.frames(20);

    // ================= a whole game: the bot against Wiesiek and Ozzy for 5 G each (the pot 15 G)
    const gold0 = await t.json("$gameParty.gold()");
    await t.eval("window.__endOk = false; window.__stopAt = 6; 0");
    await t.eval("TavernLife.makao({ stake: 5, rivals: ['wiesiek', 'ozzy'], seed: 12, turbo: 3 }); 0");
    await t.until("SceneManager._scene instanceof Scene_Makao && SceneManager._scene.st.turns >= 6 && SceneManager._scene.phase === 'you'", 120);
    await t.eval("window.__hold = true; SceneManager._scene.turbo = 1; 0");
    await t.frames(40);
    await t.shot(path.join(SHOTS, "makao_3_gra.png"));
    await t.eval("(sc => { sc.zone = 'deck'; })(SceneManager._scene); 0");
    await t.frames(20);
    await t.shot(path.join(SHOTS, "makao_4_stos.png"));
    await t.eval("(sc => { sc.zone = 'hand'; sc.turbo = 3; window.__hold = false; })(SceneManager._scene); 0");
    await t.until("SceneManager._scene instanceof Scene_Makao && SceneManager._scene.phase === 'summary' && SceneManager._scene.card && SceneManager._scene.card.t > 30", 300);
    await t.eval("SceneManager._scene.turbo = 1; 0");
    await t.frames(30);
    await t.shot(path.join(SHOTS, "makao_5_koniec.png"));
    await t.eval("window.__endOk = true; 0");
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 30);
    await t.frames(30);
    const g1 = await t.json("({ gold: $gameParty.gold(), r: TavernLife.lastResult, st: TavernLife.stats().makao })");
    t.check(`partia do końca: ${g1.r && (g1.r.won ? "wygrana" : g1.r.draw ? "remis" : "wygrywa " + g1.r.winner)}, złoto ${gold0} -> ${g1.gold}`, g1.r && g1.r.game === "makao" && !g1.r.gaveUp
        && ((g1.r.won && g1.gold === gold0 + 10) || (g1.r.draw && g1.gold === gold0) || (!g1.r.won && !g1.r.draw && g1.gold === gold0 - 5)), g1);

    // ================= the talk (who sits at the table today, the stake), given up
    await t.eval("window.__resign = true; 0");
    const talk = await t.json(`(function(){ const L = TavernLife.lib; window.__today = TavernLife.MAKAO.tableToday(); return L.runOnMap(L.kind("makao")()); })()`);
    await t.frames(40);
    for (let i = 0; i < 8 && !(await t.json("$gameMessage.isChoice()")); i++) { await t.press("ok"); await t.frames(12); }
    await t.frames(10);
    const ch = await t.json("({ busy: $gameMessage.isBusy(), choices: $gameMessage.choices(), today: window.__today })");
    t.check(`rozmowa: przy stoliku dziś ${ch.today.join(" i ")}, pula 15 G / 30 G`, talk && ch.busy && ch.choices.join("|") === "Stawka 5 G (pula 15 G)|Stawka 10 G (pula 30 G)|Nie teraz" && ch.today.length === 2, ch);
    const gold1 = await t.json("$gameParty.gold()");
    await t.eval("Input._currentState.down = true; 0"); await t.frames(3); await t.eval("Input._currentState.down = false; 0"); await t.frames(6);
    await t.press("ok");
    await t.until("SceneManager._scene instanceof Scene_Makao", 20);
    const keys = await t.json("SceneManager._scene.rivalKeys");
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 60);
    await t.frames(30);
    const g2 = await t.json("({ gold: $gameParty.gold(), r: TavernLife.lastResult, st: TavernLife.stats().makao })");
    t.check("z rozmowy: 10 G, ci dwaj przy stole, poddana - −10 G", keys.join() === ch.today.join() && g2.r && g2.r.gaveUp && g2.gold === gold1 - 10, { keys, g2 });

    // ================= the plate beside the card table (when its seat events are on the map)
    const seats = await t.json("$gameMap.events().filter(e => /<Tavern:makao>/.test(JSON.stringify(e.event().pages[0].list))).length");
    if (seats) {
        const at = async (x, y, d) => { await t.locate(x, y, d); await t.frames(12);
            return t.json("({ label: SceneManager._scene._spotLabel || null, shown: !!(SceneManager._scene._spotPrompt && SceneManager._scene._spotPrompt.visible) })"); };
        const sides = { dol: await at(36, 38, 8), lewo: await at(34, 37, 6), prawo: await at(39, 37, 4), gora: await at(36, 35, 2), gora2: await at(37, 35, 2) };
        t.check("przy stoliku z kartami z każdej strony: O Zagraj w makao", Object.values(sides).every(s => s.label === "Zagraj w makao" && s.shown), sides);
        await at(36, 38, 8);
        await t.shot(path.join(SHOTS, "makao_0_okienko.png"));
    } else console.log("(brak miejsc <Tavern:makao> na Map001 - okienko nie sprawdzone)");
    await t.eval("TavernLife.onTick = null; 0");
});
