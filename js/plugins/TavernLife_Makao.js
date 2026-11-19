//=============================================================================
// TavernLife_Makao.js
//=============================================================================
// Makao at the card table in the games room (<Tavern:makao>): the talk (who sits at the table - two of Dziadek Ozzy, the carter
// Wiesiek, Bartek Kmieć, the merchant Wawrzyniec - and the stake into the pot), the game on Tawerna.ui.Scene_MiniGame (TawernaUI.js:
// the cards, the pause, the key hints, the hero's bust, seed and turbo for the tests), the rules and the rivals' play. TavernLife.js
// settles the end on the map (the pot, the time, the numbers).

/*:
 * @target MZ
 * @plugindesc Makao przy stoliku z kartami w pokoju gier (część TavernLife.js): dwóch rywali z sali, pula, wojna, stop, żądania, „Makao!” pod Shift. v1.0.0
 * @author Claude
 * @base TavernLife
 * @orderAfter TavernLife
 *
 * @param stakes
 * @text Stawki
 * @desc Stawki do wyboru w miedziakach (G), po przecinku. Każdy gracz wkłada tyle do puli; kto pierwszy pozbędzie się kart, zgarnia pulę.
 * @default 5,10
 *
 * @help
 * ============================================================================
 * TavernLife_Makao.js - makao
 * ============================================================================
 * Część TavernLife.js. Stolik z kartami to zdarzenie z komentarzem
 * <Tavern:makao> (krzesło albo stół); przy nim okienko „O - Zagraj
 * w makao”. Przy stoliku siedzi dwóch z: Dziadek Ozzy (gdy jest w sali),
 * furman Wiesiek, Bartek Kmieć (14-21), kupiec Wawrzyniec (18-23) -
 * każdego dnia inna para. Każdy wkłada stawkę do puli, wygrany ją
 * zgarnia.
 *
 * Zasady: talia 52 kart, po 5 na rękę. Kładzie się kartę w tym samym
 * kolorze albo tej samej figury, kilka kart jednej figury naraz. Nie masz
 * czym - dobierasz jedną (pasującą możesz od razu położyć).
 *   2, 3 - następny bierze 2 / 3 karty, chyba że odbije (2, 3, król kier
 *          albo pik w kolorze albo figurze); kary się sumują
 *   król kier - 5 kart dla następnego; król pik - od razu dla poprzedniego
 *   4 - następny stoi kolejkę albo dokłada czwórkę
 *   walet - żądanie figury od 5 do 10 na całą kolejkę (albo bez żądania)
 *   as - zmiana koloru
 *   dama - na wszystko, wszystko na damę
 * Jedna karta na ręce: trzeba krzyknąć „Makao!” (Shift), inaczej +5 kart.
 *
 * KOLEJNOŚĆ: pod TavernLife.js.
 * Dla testów: TavernLife.makao({ stake, rivals: ["wiesiek", "ozzy"], seed,
 * turbo, onEnd }), TavernLife.MAKAO (zasady i ruchy rywali).
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("makao");   // (the words of this file: js/teksty/makao.txt)

    const T = window.Tawerna;
    if (!T) throw new Error("TavernLife_Makao.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const TL = T.api("TavernLife");
    if (!TL || !TL.lib) throw new Error("TavernLife_Makao.js: brak TavernLife.js - musi być nad tą wtyczką na liście (TavernLife is missing)");
    const lib = TL.lib, ui = T.ui;
    const { lerp, hash, pick, U, GOOD, BAD, se, gold, needGold, bark, cached, dirty, S, npc, spots, bustOf, say, sayAs, choose, run, q, hour, day, heroSay } = lib;
    const STAKES = lib.nums(PluginManager.parameters("TavernLife_Makao").stakes, "5,10");
    const GAME = { minutes: 25, stamina: 1, xpWin: 10, xpLose: 3, maxTurns: 400, hand: 5, makaoWindow: 80 };
    const cardText = (b, s, x, y, w, size, colour, bold, align) => ui.text(b, s, x, y, w, { size, color: colour || U().text, bold, align, lh: Math.round(size * 1.3) });
    const kart = n => (n === 1 ? "kartę" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "karty" : "kart");
    const kolejki = n => (n === 1 ? "kolejka" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "kolejki" : "kolejek");
    const cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);

    // ==================================================================
    // THE RULES. A card: 0-51, suit = id / 13 (0 pik, 1 kier, 2 karo, 3 trefl), rank = id % 13 + 2 (11 walet, 12 dama, 13 król, 14 as).
    // st: { n, hands[], draw[], discard[] (the top last), turn, war (cards to take), stop (turns to stand), skip[], req (the jack's rank),
    // reqLeft, reqFresh, suit (the ace's, -1 none), turns, winner }
    // ==================================================================
    const rankOf = c => (c % 13) + 2, suitOf = c => Math.floor(c / 13);
    const red = c => suitOf(c) === 1 || suitOf(c) === 2;
    const isWar = c => { const r = rankOf(c); return r === 2 || r === 3 || (r === 13 && suitOf(c) <= 1); };
    const warValue = c => { const r = rankOf(c); return r === 2 ? 2 : r === 3 ? 3 : isWar(c) ? 5 : 0; };
    const plain = r => r >= 5 && r <= 10;
    const topOf = st => st.discard[st.discard.length - 1];
    function shuffle(list, rng) {
        for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)) % (i + 1); const t = list[i]; list[i] = list[j]; list[j] = t; }
        return list;
    }
    function newGame(n, rng) {
        const st = { n, hands: [], draw: shuffle(Array.from({ length: 52 }, (_, i) => i), rng), discard: [], turn: 0, war: 0, stop: 0, skip: new Array(n).fill(0),
            req: 0, reqLeft: 0, reqFresh: false, suit: -1, turns: 0, winner: -1 };
        for (let i = 0; i < n; i++) st.hands.push([]);
        return st;
    }
    // five each, one by one, then the first plain card (5-10) from the top of the deck starts the pile: [{ p, c }], starter
    function deal(st) {
        const order = [];
        for (let k = 0; k < GAME.hand; k++) for (let p = 0; p < st.n; p++) { const c = st.draw.pop(); st.hands[p].push(c); order.push({ p, c }); }
        let i = st.draw.length - 1;
        while (i > 0 && !plain(rankOf(st.draw[i]))) i--;
        const starter = st.draw.splice(i, 1)[0];
        st.discard.push(starter);
        return { order, starter };
    }
    // may this card start a play now
    function fits(st, c) {
        const top = topOf(st), r = rankOf(c), s = suitOf(c);
        if (st.war > 0) return isWar(c) && (r === rankOf(top) || s === suitOf(top));
        if (st.stop > 0) return r === 4;
        if (st.req) return r === st.req || r === 11;
        if (st.suit >= 0) return s === st.suit || r === 14;
        return r === 12 || rankOf(top) === 12 || r === rankOf(top) || s === suitOf(top);
    }
    const canPlay = (st, cards) => cards.length > 0 && fits(st, cards[0]) && cards.every(c => rankOf(c) === rankOf(cards[0]));
    // the deck runs out: the pile under its top card is shuffled into it
    function drawCards(st, p, n, rng) {
        const got = [];
        for (let i = 0; i < n; i++) {
            if (!st.draw.length && st.discard.length > 1) { const top = st.discard.pop(); st.draw = shuffle(st.discard, rng); st.discard = [top]; }
            if (!st.draw.length) break;
            const c = st.draw.pop();
            st.hands[p].push(c);
            got.push(c);
        }
        return got;
    }
    // a play (checked by canPlay): the cards to the pile (the last one on top) and what they do. choice: the ace's suit 0-3, the
    // jack's rank 5-10 (0 none). -> { p, cards, back: { to, n } (the king of spades: the cards for the one before, to be taken now) }
    function play(st, p, cards, choice) {
        const hand = st.hands[p];
        for (const c of cards) { hand.splice(hand.indexOf(c), 1); st.discard.push(c); }
        const top = cards[cards.length - 1], r = rankOf(top), out = { p, cards: cards.slice(), back: null };
        if (cards.some(isWar)) {
            const add = cards.reduce((a, c) => a + warValue(c), 0);
            if (r === 13 && suitOf(top) === 0) { out.back = { to: (p - 1 + st.n) % st.n, n: st.war + add }; st.war = 0; }
            else st.war += add;
        }
        if (r === 4) st.stop += cards.length;
        if (r === 11) { st.req = plain(choice) ? choice : 0; st.reqFresh = !!st.req; st.reqLeft = st.n; }
        if (r === 14) st.suit = choice >= 0 && choice <= 3 ? choice : suitOf(top);
        else if (st.suit >= 0 && cards.some(c => suitOf(c) === st.suit)) st.suit = -1;
        if (!hand.length) st.winner = p;
        return out;
    }
    // not playing: the war's cards taken, the stop stood (this turn the first of them), or one card drawn -> { kind, cards }
    function take(st, p, rng) {
        if (st.war > 0) { const n = st.war; st.war = 0; return { kind: "war", cards: drawCards(st, p, n, rng) }; }
        if (st.stop > 0) { st.skip[p] += st.stop - 1; st.stop = 0; return { kind: "stop", cards: [] }; }
        return { kind: "one", cards: drawCards(st, p, 1, rng) };
    }
    function next(st) {
        if (st.req) { if (st.reqFresh) st.reqFresh = false; else if (--st.reqLeft <= 0) st.req = 0; }
        st.turn = (st.turn + 1) % st.n;
        st.turns++;
    }

    // ------------------------------------------------------------------
    // The rivals' play: every legal play scored (cards shed, the jokers kept for the end, war and stop at whoever is close to
    // winning, the top's suit one they hold); the easier ones pick at random now and then and forget to say "Makao"
    // ------------------------------------------------------------------
    function choiceFor(st, p, cards) {
        const r = rankOf(cards[cards.length - 1]), rest = st.hands[p].filter(c => !cards.includes(c));
        if (r === 14) {
            const n = [0, 0, 0, 0];
            for (const c of rest) if (rankOf(c) !== 14) n[suitOf(c)]++;
            return n.indexOf(Math.max.apply(null, n));
        }
        if (r === 11) {
            let best = 0, bestN = 0;
            for (let k = 5; k <= 10; k++) { const m = rest.filter(c => rankOf(c) === k).length; if (m > bestN) { best = k; bestN = m; } }
            return best;
        }
        return null;
    }
    function decide(st, p, mind, rng) {
        const hand = st.hands[p], starts = hand.filter(c => fits(st, c));
        if (!starts.length) return null;
        const nx = (p + 1) % st.n, pv = (p - 1 + st.n) % st.n, close = i => st.hands[i].length <= 2;
        const options = [];
        for (const c of starts) {
            const same = hand.filter(x => x !== c && rankOf(x) === rankOf(c));
            options.push([c]);
            if (same.length) {
                const rest = hand.filter(x => x !== c && rankOf(x) !== rankOf(c)), n = [0, 0, 0, 0];
                for (const x of rest) n[suitOf(x)]++;
                same.sort((a, b) => n[suitOf(a)] - n[suitOf(b)]);   // (the suit it holds most of ends on top)
                options.push([c].concat(same));
            }
        }
        if (rng() < (mind.random || 0)) { const o = options[Math.floor(rng() * options.length) % options.length]; return { cards: o, choice: choiceFor(st, p, o) }; }
        let best = null, bestS = -Infinity;
        for (const o of options) {
            const top = o[o.length - 1], r = rankOf(top), after = hand.filter(c => !o.includes(c));
            let s = o.length * 10;
            if (!after.length) s += 1000;
            if (r === 12) s -= after.length > 2 ? 14 : 0;
            if (r === 14) s -= after.length > 2 ? 10 : 0;
            if (r === 11) { const want = choiceFor(st, p, o); s += want ? after.filter(c => rankOf(c) === want).length * 6 - 4 : -8; }
            if (o.some(isWar)) {
                if (st.war > 0) s += 60;
                else if (r === 13 && suitOf(top) === 0) s += close(pv) ? 30 : 4 * (mind.aggr || 1);
                else s += close(nx) ? 30 : 4 * (mind.aggr || 1);
            }
            if (r === 4) s += st.stop > 0 ? 50 : close(nx) ? 24 : 2;
            if (r !== 14) s += 2 * after.filter(c => suitOf(c) === suitOf(top)).length;
            s += rng() * (mind.noise || 0);
            if (s > bestS) { bestS = s; best = o; }
        }
        return { cards: best, choice: choiceFor(st, p, best) };
    }

    // ==================================================================
    // THE RIVALS: the words in js/teksty/makao.txt (rywale.<key>); when they sit at the table; how they play
    // ==================================================================
    const RIVALS = {
        ozzy: { role: "ozzy", mind: { random: 0.45, noise: 20, forget: 0.25, aggr: 1 }, think: 60 },
        wiesiek: { bust: "Rzutki_Wiesiek_Bust", face: ["People2", 6], mind: { random: 0.1, noise: 8, forget: 0.06, aggr: 2 }, think: 40 },
        bartek: { bust: "Bartek_Bust", face: ["People1", 4], hours: [14, 21], mind: { random: 0.25, noise: 12, forget: 0.14, aggr: 1 }, think: 50 },
        kupiec: { bust: "Kosci_Kupiec_Bust", face: ["People4", 4], hours: [18, 23], mind: { random: 0, noise: 3, forget: 0, aggr: 3 }, think: 55 }
    };
    Watki.scal(RIVALS, "makao", "rywale");
    const ORDER = ["ozzy", "wiesiek", "bartek", "kupiec"];
    const rivalBust = o => (o.role ? bustOf(o.role) : o.bust);
    function present(key) {
        const o = RIVALS[key];
        if (o.role) return !!npc(o.role);
        if (o.hours) { const h = hour(); return h >= o.hours[0] && h < o.hours[1]; }
        return true;
    }
    // who sits at the table today: two of those here (another pair every day), or the one there is
    function tableToday() {
        const here = ORDER.filter(present);
        if (here.length <= 2) return here;
        const pairs = [];
        for (let i = 0; i < here.length; i++) for (let j = i + 1; j < here.length; j++) pairs.push([here[i], here[j]]);
        return pairs[Math.abs(day()) % pairs.length];
    }

    // ==================================================================
    // THE PICTURES (drawn once): the cards (cream, the pips and indices drawn, the court figures from PixelLab - img/pictures/
    // Makao_Figury.png: walet, dama, król, each 68x48, double-headed), the back, the oak table
    // ==================================================================
    const CW = 104, CH = 146, BW = CW + 6, BH = CH + 6;   // a card; its picture with the shadow
    const INK = { red: "#c3242b", black: "#1c1c22" };
    let FIG = null;   // (the court figures' sheet: loaded by the scene, ready before the first card is drawn)
    function pipPath(ctx, s, x, y, size) {
        const k = size / 20;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(k, k);
        ctx.beginPath();
        if (s === 1) {   // kier
            ctx.moveTo(0, 9); ctx.bezierCurveTo(-12, 0, -11, -9, -5.5, -9); ctx.bezierCurveTo(-2, -9, 0, -6.5, 0, -4.5);
            ctx.bezierCurveTo(0, -6.5, 2, -9, 5.5, -9); ctx.bezierCurveTo(11, -9, 12, 0, 0, 9);
        } else if (s === 2) {   // karo
            ctx.moveTo(0, -10); ctx.lineTo(7.5, 0); ctx.lineTo(0, 10); ctx.lineTo(-7.5, 0); ctx.closePath();
        } else if (s === 0) {   // pik
            ctx.moveTo(0, -10); ctx.bezierCurveTo(-12, -1, -11, 7, -5.5, 7); ctx.bezierCurveTo(-3, 7, -1, 5.5, -0.8, 4);
            ctx.lineTo(-3, 10); ctx.lineTo(3, 10); ctx.lineTo(0.8, 4);
            ctx.bezierCurveTo(1, 5.5, 3, 7, 5.5, 7); ctx.bezierCurveTo(11, 7, 12, -1, 0, -10);
        } else {   // trefl
            ctx.arc(0, -5, 4.6, 0, Math.PI * 2); ctx.moveTo(-1.5, 1.5);
            ctx.arc(-5, 1.5, 4.6, 0, Math.PI * 2); ctx.moveTo(9.6, 1.5);
            ctx.arc(5, 1.5, 4.6, 0, Math.PI * 2);
            ctx.moveTo(-1.2, 2); ctx.lineTo(-3.2, 10); ctx.lineTo(3.2, 10); ctx.lineTo(1.2, 2); ctx.closePath();
        }
        ctx.restore();
    }
    function pip(ctx, s, x, y, size, flip) {
        ctx.save();
        if (flip) { ctx.translate(x, y); ctx.rotate(Math.PI); ctx.translate(-x, -y); }
        pipPath(ctx, s, x, y, size);
        ctx.fillStyle = s === 1 || s === 2 ? INK.red : INK.black;
        ctx.fill();
        ctx.restore();
    }
    const LABEL = r => (r <= 10 ? String(r) : ["W", "D", "K", "A"][r - 11]);
    // where the pips lie: [column -1/0/1, row 0..1] (rows past the middle drawn upside down)
    const PIPS = {
        2: [[0, 0], [0, 1]], 3: [[0, 0], [0, 0.5], [0, 1]], 4: [[-1, 0], [1, 0], [-1, 1], [1, 1]],
        5: [[-1, 0], [1, 0], [0, 0.5], [-1, 1], [1, 1]], 6: [[-1, 0], [1, 0], [-1, 0.5], [1, 0.5], [-1, 1], [1, 1]],
        7: [[-1, 0], [1, 0], [0, 0.25], [-1, 0.5], [1, 0.5], [-1, 1], [1, 1]],
        8: [[-1, 0], [1, 0], [0, 0.25], [-1, 0.5], [1, 0.5], [0, 0.75], [-1, 1], [1, 1]],
        9: [[-1, 0], [1, 0], [-1, 1 / 3], [1, 1 / 3], [0, 0.5], [-1, 2 / 3], [1, 2 / 3], [-1, 1], [1, 1]],
        10: [[-1, 0], [1, 0], [0, 1 / 6], [-1, 1 / 3], [1, 1 / 3], [-1, 2 / 3], [1, 2 / 3], [0, 5 / 6], [-1, 1], [1, 1]]
    };
    function cardBase(ctx, x, y) {
        ctx.fillStyle = "rgba(0,0,0,0.38)";   // its shadow on the table
        roundRect(ctx, x + 3, y + 4, CW, CH, 7); ctx.fill();
        const g = ctx.createLinearGradient(x, y, x + CW, y + CH);
        g.addColorStop(0, "#fbf6ea"); g.addColorStop(1, "#ece2cb");
        ctx.fillStyle = g;
        roundRect(ctx, x, y, CW, CH, 7); ctx.fill();
        ctx.strokeStyle = "#5c4a36"; ctx.lineWidth = 1.2;
        roundRect(ctx, x + 0.5, y + 0.5, CW - 1, CH - 1, 7); ctx.stroke();
    }
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    }
    // the corner index: the rank over a small pip (drawn once, put at the top left and upside down at the bottom right)
    function indexBitmap(c) {
        return cached("makaoIdx" + c, () => {
            const b = new Bitmap(18, 42), r = rankOf(c), s = suitOf(c);
            cardText(b, LABEL(r), 0, 0, 18, r === 10 ? 14 : 17, red(c) ? INK.red : INK.black, true, "center");
            pip(b.context, s, 9, 31, 11, false);
            dirty(b);
            return b;
        });
    }
    function faceBitmap(c) {
        return cached("makaoCard" + c, () => {
            const b = new Bitmap(BW, BH), ctx = b.context, r = rankOf(c), s = suitOf(c), x0 = 1, y0 = 1;
            ctx.save();
            cardBase(ctx, x0, y0);
            const idx = indexBitmap(c), src = idx._canvas || idx.canvas;
            ctx.drawImage(src, x0 + 1, y0 + 4);
            ctx.save(); ctx.translate(x0 + CW - 1, y0 + CH - 4); ctx.rotate(Math.PI); ctx.drawImage(src, 0, 0); ctx.restore();
            const cx = x0 + CW / 2;
            if (r <= 10) {
                for (const [col, row] of PIPS[r]) pip(ctx, s, cx + col * 20, y0 + 34 + row * 78, 17, row > 0.5);
            } else if (r === 14) {
                if (s === 0) {   // the ace of spades: a ring round a big pip
                    ctx.strokeStyle = "rgba(28,28,34,0.55)"; ctx.lineWidth = 1.2;
                    ctx.beginPath(); ctx.arc(cx, y0 + CH / 2, 32, 0, Math.PI * 2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(cx, y0 + CH / 2, 28, 0, Math.PI * 2); ctx.stroke();
                }
                pip(ctx, s, cx, y0 + CH / 2, s === 0 ? 42 : 46, false);
            } else {   // the court: a frame, the figure twice (the lower half upside down)
                const fx = x0 + 18, fy = y0 + 16, fw = 68, fh = 114;
                ctx.fillStyle = red(c) ? "#f6e3d6" : "#e4e6ea";
                ctx.fillRect(fx, fy, fw, fh);
                const img = FIG && FIG.isReady() && !FIG.isError() ? (FIG._canvas || FIG._image) : null;
                if (img) {
                    ctx.imageSmoothingEnabled = false;
                    const sx = (r - 11) * 68;
                    ctx.save(); ctx.beginPath(); ctx.rect(fx, fy, fw, fh / 2); ctx.clip();
                    ctx.drawImage(img, sx, 0, 68, 48, fx, fy + 6, 68, 48);
                    ctx.restore();
                    ctx.save(); ctx.beginPath(); ctx.rect(fx, fy + fh / 2, fw, fh / 2); ctx.clip();
                    ctx.translate(fx + fw, fy + fh); ctx.rotate(Math.PI);
                    ctx.drawImage(img, sx, 0, 68, 48, 0, 6, 68, 48);
                    ctx.restore();
                }
                ctx.strokeStyle = red(c) ? INK.red : INK.black; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(fx, fy + fh / 2 + 0.5); ctx.lineTo(fx + fw, fy + fh / 2 + 0.5); ctx.stroke();
                ctx.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);
                pip(ctx, s, fx + 9, fy + 10, 11, false);
                pip(ctx, s, fx + fw - 9, fy + fh - 10, 11, true);
            }
            ctx.restore();
            dirty(b);
            return b;
        });
    }
    function backBitmap() {
        return cached("makaoBack", () => {
            const b = new Bitmap(BW, BH), ctx = b.context, x0 = 1, y0 = 1;
            ctx.save();
            cardBase(ctx, x0, y0);
            const ix = x0 + 6, iy = y0 + 6, iw = CW - 12, ih = CH - 12;
            ctx.fillStyle = "#7a1d22"; ctx.fillRect(ix, iy, iw, ih);
            ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip();
            ctx.strokeStyle = "rgba(232,190,96,0.55)"; ctx.lineWidth = 1;
            for (let k = -ih; k < iw + ih; k += 10) {
                ctx.beginPath(); ctx.moveTo(ix + k, iy); ctx.lineTo(ix + k + ih, iy + ih); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(ix + k, iy + ih); ctx.lineTo(ix + k + ih, iy); ctx.stroke();
            }
            ctx.restore();
            ctx.strokeStyle = "#e8be60"; ctx.lineWidth = 2; ctx.strokeRect(ix + 3, iy + 3, iw - 6, ih - 6);
            const cx = x0 + CW / 2, cy = y0 + CH / 2;   // the medallion: a gold tankard (the tavern's sign)
            ctx.fillStyle = "#5a1216"; ctx.beginPath(); ctx.ellipse(cx, cy, 22, 26, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "#e8be60"; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = "#e8be60";
            ctx.fillRect(cx - 9, cy - 9, 16, 20); ctx.fillRect(cx - 11, cy - 12, 20, 4);
            ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx + 8, cy + 1, 5, -Math.PI / 2, Math.PI / 2); ctx.stroke();
            ctx.fillStyle = "#fff3c4"; ctx.fillRect(cx - 7, cy - 7, 3, 15);
            ctx.restore();
            dirty(b);
            return b;
        });
    }
    function tableBitmap() {
        return cached("makaoTable", () => {
            const W = 1280, H = 720, b = new Bitmap(W, H), ctx = b.context, x = 110, y = 54, w = 1060, h = 600;
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.filter = "blur(10px)"; roundRect(ctx, x + 6, y + 14, w, h, 40); ctx.fill(); ctx.filter = "none";
            const g = ctx.createLinearGradient(0, y, 0, y + h);
            g.addColorStop(0, "#5b3a22"); g.addColorStop(1, "#45291a");
            ctx.fillStyle = g; roundRect(ctx, x, y, w, h, 40); ctx.fill();
            ctx.save(); roundRect(ctx, x, y, w, h, 40); ctx.clip();
            for (let k = 0; k < 9; k++) {   // the planks and their grain
                const py = y + k * (h / 9);
                ctx.fillStyle = k % 2 ? "rgba(0,0,0,0.06)" : "rgba(255,220,170,0.03)"; ctx.fillRect(x, py, w, h / 9);
                ctx.fillStyle = "rgba(20,10,4,0.55)"; ctx.fillRect(x, Math.round(py), w, 2);
                for (let j = 0; j < 14; j++) {
                    ctx.fillStyle = "rgba(25,12,5," + (0.12 + hash(k, j + 3) * 0.16) + ")";
                    ctx.fillRect(x + hash(k, j) * w, Math.round(py + 4 + hash(j, k + 9) * (h / 9 - 8)), 40 + hash(k + j, 5) * 200, 1);
                }
            }
            const l = ctx.createRadialGradient(640, 330, 60, 640, 360, 640);   // the lamp over the table
            l.addColorStop(0, "rgba(255,206,140,0.20)"); l.addColorStop(0.6, "rgba(0,0,0,0)"); l.addColorStop(1, "rgba(0,0,0,0.35)");
            ctx.fillStyle = l; ctx.fillRect(x, y, w, h);
            ctx.restore();
            ctx.strokeStyle = "rgba(255,220,170,0.18)"; ctx.lineWidth = 2; roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 40); ctx.stroke();
            ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 3; roundRect(ctx, x - 1, y - 1, w + 2, h + 2, 41); ctx.stroke();
            ctx.restore();
            dirty(b);
            return b;
        });
    }
    function cursorBitmap() {
        return cached("makaoCursor", () => {
            const w = CW + 12, h = CH + 12, b = new Bitmap(w, h), ctx = b.context, L = 18;
            for (const [col, lw] of [["rgba(0,0,0,0.8)", 6], [U().accent, 3]]) {
                ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "square";
                ctx.beginPath();
                ctx.moveTo(3, 3 + L); ctx.lineTo(3, 3); ctx.lineTo(3 + L, 3);
                ctx.moveTo(w - 3 - L, 3); ctx.lineTo(w - 3, 3); ctx.lineTo(w - 3, 3 + L);
                ctx.moveTo(w - 3, h - 3 - L); ctx.lineTo(w - 3, h - 3); ctx.lineTo(w - 3 - L, h - 3);
                ctx.moveTo(3 + L, h - 3); ctx.lineTo(3, h - 3); ctx.lineTo(3, h - 3 - L);
                ctx.stroke();
            }
            dirty(b);
            return b;
        });
    }
    // a speech box under a rival's portrait (its tail up, towards him)
    function sayBitmap(text, side) {
        const probe = new Bitmap(8, 8);
        probe.fontFace = $gameSystem.mainFontFace(); probe.fontSize = 19;
        const w = Math.min(320, Math.ceil(probe.measureTextWidth(text)) + 40), h = 40, b = new Bitmap(w, h + 12), ctx = b.context, S0 = U();
        const tx = side === "right" ? w - 40 : side === "centre" ? w / 2 - 10 : 20;
        ctx.fillStyle = "rgba(11,12,15,0.92)"; ctx.strokeStyle = S0.line;
        ctx.beginPath();
        ctx.moveTo(0.5, 12.5); ctx.lineTo(tx, 12.5); ctx.lineTo(tx + 8, 0.5); ctx.lineTo(tx + 18, 12.5); ctx.lineTo(w - 0.5, 12.5);
        ctx.lineTo(w - 0.5, h + 11.5); ctx.lineTo(0.5, h + 11.5); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = S0.accent; ctx.fillRect(1, 13, 2, h - 2);
        cardText(b, text, 14, 19, w - 22, 19, S0.text);
        dirty(b);
        return b;
    }

    // seats round the table: the rival's portrait, his cards (backs) beside it, his words under it
    const SEATS = {
        left: { px: 22, py: 16, fan: { x: 206, y: 96, dir: 1 }, say: { x: 22, y: 200, ax: 0 } },
        right: { px: 1258 - 148, py: 16, fan: { x: 1074, y: 96, dir: -1 }, say: { x: 1258, y: 200, ax: 1 } },
        centre: { px: 566, py: 8, fan: { x: 750, y: 90, dir: 1 }, say: { x: 640, y: 192, ax: 0.5 } }
    };
    const DECK = { x: 556, y: 318 }, PILE = { x: 724, y: 318 }, HAND_Y = 578, HAND_SPAN = 660;   // (card centres: 310-970, between the bust and the panel)

    class Say extends Sprite {
        initialize() { super.initialize(); this.life = 0; this.t = 0; this.opacity = 0; }
        say(text, side, frames) { if (!text) return; this.bitmap = sayBitmap(text, side); this.life = frames || 110; this.t = 0; }
        update() {
            super.update();
            if (!this.life) return;
            this.t++;
            this.opacity = Math.round(255 * Math.min(1, this.t / 8, (this.life - this.t) / 14));
            if (this.t >= this.life) { this.life = 0; this.opacity = 0; }
        }
    }

    // ==================================================================
    // THE SCENE
    // ==================================================================
    class Scene_Makao extends lib.gameScene() {
        createGame() {
            const keys = (this.opts.rivals || ["wiesiek", "ozzy"]).filter(k => RIVALS[k]).slice(0, 2);
            this.rivalKeys = keys.length ? keys : ["wiesiek"];   // (not this.keys: the mini-game's keys held)
            this.rivals = this.rivalKeys.map(k => RIVALS[k]);
            this.n = this.rivals.length + 1;
            this.pot = this.stake * this.n;
            this.first = !S().firsts.makao;
            FIG = ImageManager.loadPicture("Makao_Figury");
            this.preload(FIG);
            this.st = newGame(this.n, this.rng);
            this.table = new Sprite(tableBitmap());
            this.root.addChild(this.table);
            this.seats = this.rivals.length === 1 ? ["centre"] : ["left", "right"];
            this.portraits = this.rivals.map((o, i) => {
                const s = new Sprite(new Bitmap(148, 178)), seat = SEATS[this.seats[i]];
                s.x = seat.px; s.y = seat.py;
                this.root.addChild(s);
                return s;
            });
            this.busts = this.rivals.map(o => this.pic(rivalBust(o)));
            this.fans = this.rivals.map(() => { const s = new Sprite(); this.root.addChild(s); return s; });
            this.counts = this.rivals.map((o, i) => {
                const s = new Sprite(new Bitmap(160, 24)), seat = SEATS[this.seats[i]];
                s.anchor.set(seat.fan.dir > 0 ? 0 : 1, 0);
                s.x = seat.fan.x - (seat.fan.dir > 0 ? 24 : -24); s.y = seat.fan.y + 42;
                this.root.addChild(s);
                return s;
            });
            this.deckSpr = new Sprite();
            this.root.addChild(this.deckSpr);
            this.pileSpr = new Sprite();
            this.root.addChild(this.pileSpr);
            this.status = new Sprite(new Bitmap(300, 34));
            this.status.anchor.set(0, 0.5); this.status.x = 796; this.status.y = PILE.y;
            this.root.addChild(this.status);
            this.deckLabel = new Sprite(new Bitmap(260, 30));
            this.deckLabel.anchor.set(0.5, 0); this.deckLabel.x = DECK.x; this.deckLabel.y = DECK.y + CH / 2 + 8;
            this.root.addChild(this.deckLabel);
            this.handLayer = new Sprite();
            this.root.addChild(this.handLayer);
            this.flyLayer = new Sprite();
            this.root.addChild(this.flyLayer);
            this.cursorSpr = new Sprite(cursorBitmap());
            this.cursorSpr.anchor.set(0.5, 0.5);
            this.cursorSpr.visible = false;
            this.root.addChild(this.cursorSpr);
            this.says = this.rivals.map((o, i) => {
                const s = new Say(), seat = SEATS[this.seats[i]];
                s.anchor.set(seat.say.ax, 0); s.x = seat.say.x; s.y = seat.say.y;
                this.root.addChild(s);
                return s;
            });
            this.handSprites = new Map();
            this.incoming = new Set();
            this.flights = [];
            this.popups = [];
            this.pileHold = 0;
            this.lifted = []; this.drawn = -1; this.zone = "hand"; this.ci = 0; this.curCard = -1; this.makaoSaid = false; this.cont = null;
            this.pic(ui.heroBust());
            this.showBusts(ui.heroBust());
            this.bubbleL.move(24, 438);
        }
        begin() {
            const k = TK.kod.begin, names = this.rivals.map(o => o.with).join(k[11]);
            this.showCard({ wait: 16, bust: rivalBust(this.rivals[0]), who: this.rivals[0].name, whoSub: this.rivals[0].role ? k[0] : k[1],
                kicker: "MAKAO" + (this.stake ? Watki.wstaw(k[2], { stake: this.stake, pot: this.pot }) : ""), title: Watki.wstaw(k[3], { kto: names }),
                say: this.rivals[0].hello, lines: this.first ? [k[4], k[5], k[6], k[7]] : [k[8]],
                keys: [[k[9], TK.kod.hud[3]], ["O", TK.kod.hud[4]], ["Shift", TK.kod.hud[5]], ["P", TK.kod.hud[6]]], foot: k[10], h: this.first ? 580 : 520 }, () => this.dealOut());
            this.setPhase("card");
        }
        // ---- positions
        seatOf(p) { return SEATS[this.seats[p - 1]]; }
        display() {   // the hero's hand as shown: by suit, then by rank
            return this.st.hands[0].slice().sort((a, b) => suitOf(a) - suitOf(b) || rankOf(a) - rankOf(b));
        }
        // the hero's hand (2026-11-19, the user: "inne karty musi być jakoś widać"): few cards lie side by side, not overlapping;
        // many overlap left over right (each shows its corner - the rank and the suit), and the fan opens at the cursor: the card
        // under it gets a whole card's room, nothing covers it, the others share the rest. Nothing is pulled on top of the others.
        handPos(list, i) {
            const n = list.length, full = CW + 8, span = HAND_SPAN;
            if (n <= 1) return { x: 640, y: HAND_Y };
            const sp = Math.min(full, span / (n - 1)), cur = list.indexOf(this.curCard);
            if (sp >= full - 0.5 || cur < 0 || cur === n - 1) { const w = sp * (n - 1); return { x: 640 - w / 2 + i * sp, y: HAND_Y }; }
            const other = (span - full) / (n - 2);
            return { x: 640 - span / 2 + other * i + (i > cur ? full - other : 0), y: HAND_Y };
        }
        fanPos(p, i) {
            const f = this.seatOf(p).fan, n = this.st.hands[p].length, sp = Math.min(18, 220 / Math.max(1, n - 1));
            return { x: f.x + f.dir * i * sp, y: f.y };
        }
        cardFrom(p, c) {
            if (p === 0) { const s = this.handSprites.get(c); return s ? { x: s.x, y: s.y, sc: 1 } : { x: 640, y: HAND_Y, sc: 1 }; }
            const n = this.st.hands[p].length;
            return Object.assign(this.fanPos(p, n), { sc: 0.5 });
        }
        pileSpot(c) { return { x: PILE.x + (hash(c, 7) - 0.5) * 8, y: PILE.y + (hash(c, 8) - 0.5) * 8, r: (hash(c, 9) - 0.5) * 0.24 }; }
        // ---- flights: a card's picture from one place to another (the state has changed already; what it shows waits for it)
        fly(o) {
            const s = new Sprite(o.flip ? backBitmap() : o.face ? faceBitmap(o.c) : backBitmap());
            s.anchor.set(0.5, 0.5);
            s.visible = false;
            this.flyLayer.addChild(s);
            this.flights.push(Object.assign({ s, t: 0, dur: 16, delay: 0, r0: 0, r1: 0, sc0: 1, sc1: 1 }, o));
        }
        flyTick() {
            for (let i = this.flights.length - 1; i >= 0; i--) {
                const f = this.flights[i];
                if (f.delay > 0) { f.delay--; continue; }
                f.t++;
                const k = Math.min(1, f.t / f.dur), e = k * k * (3 - 2 * k), s = f.s, sc = lerp(f.sc0, f.sc1, e);
                s.visible = true;
                s.x = lerp(f.x0, f.x1, e); s.y = lerp(f.y0, f.y1, e) - Math.sin(Math.PI * k) * 18;
                s.rotation = lerp(f.r0, f.r1, e);
                if (f.flip) {
                    if (k < 0.5) { s.bitmap = backBitmap(); s.scale.set(sc * Math.max(0.04, 1 - 2 * k), sc); }
                    else { s.bitmap = faceBitmap(f.c); s.scale.set(sc * Math.max(0.04, 2 * k - 1), sc); }
                } else s.scale.set(sc, sc);
                if (f.t >= f.dur) { this.flyLayer.removeChild(s); this.flights.splice(i, 1); if (f.then) f.then(); }
            }
        }
        wait(then) { this.cont = then; this.setPhase("anim"); }
        // ---- the deal
        dealOut() {
            const d = deal(this.st);
            d.order.forEach(({ p, c }, i) => {
                this.incoming.add(c);
                const to = p === 0 ? this.handPos(this.display(), this.display().indexOf(c)) : this.fanPos(p, this.st.hands[p].indexOf(c));
                this.fly({ c, x0: DECK.x, y0: DECK.y, x1: to.x, y1: to.y, sc1: p === 0 ? 1 : 0.5, delay: i * 4, dur: 14, flip: p === 0,
                    then: () => { this.incoming.delete(c); se("Book1", 30, 150); } });
            });
            this.pileHold = 1;
            const sp = this.pileSpot(d.starter);
            this.fly({ c: d.starter, x0: DECK.x, y0: DECK.y, x1: sp.x, y1: sp.y, r1: sp.r, delay: d.order.length * 4 + 6, dur: 16, flip: true,
                then: () => { this.pileHold = 0; se("Book1", 40, 130); } });
            this.wait(() => {
                this.banner.show("turn", TK.kod.hud[1], null, 50);
                this.startTurn();
            });
        }
        // ---- the turns
        startTurn() {
            const st = this.st, p = st.turn;
            if (st.turns >= GAME.maxTurns) return this.finishByCount();
            if (st.skip[p] > 0 && st.stop === 0) {
                st.skip[p]--;
                this.hint(p === 0 ? TK.kod.hint[10] : Watki.wstaw(TK.kod.hint[9], { short: this.rivals[p - 1].short }));
                return this.endTurn();
            }
            this.active = p;
            this.lifted = []; this.drawn = -1;
            if (p === 0) {
                this.zone = "hand";
                if (st.war > 0) this.hint(TK.kod.hint[1], "#ffb070");
                else if (st.stop > 0) this.hint(TK.kod.hint[2], "#ffb070");
                this.setPhase("you");
            } else this.setPhase("opp");
        }
        endTurn() {
            if (this.active === 0) this.makaoSaid = false;
            next(this.st);
            this.setPhase("pause");
        }
        tick() {
            this.flyTick();
            switch (this.phase) {
                case "anim": if (!this.flights.length && this.phaseT > 2 && this.cont) { const c = this.cont; this.cont = null; c(); } break;
                case "you": this.youTick(); break;
                case "opp": this.oppTick(); break;
                case "makao": this.makaoTick(); break;
                case "pause": if (this.phaseT >= 10) this.startTurn(); break;
                case "ending": if (this.phaseT >= 60 && !this.flights.length) { this.setPhase("summary"); this.endCard(); } break;
            }
        }
        canPause() { return this.phase === "you"; }
        onBack() {
            if (this.phase === "you" && this.lifted.length) { this.lifted = []; se("Cancel1", 40); return true; }
            return super.onBack();
        }
        helpLines() { return [TK.kod.help[0], TK.kod.help[1]]; }
        youTick() {
            const list = this.display();
            if (this.curCard >= 0 && list.includes(this.curCard)) this.ci = list.indexOf(this.curCard);
            this.ci = Math.max(0, Math.min(list.length - 1, this.ci));
            if (this.zone === "hand") {
                const was = this.ci;
                if (this.rep.left) this.ci = Math.max(0, this.ci - 1);
                if (this.rep.right) this.ci = Math.min(list.length - 1, this.ci + 1);
                if (this.ci !== was) se("Cursor1", 35, 120);
                if (this.trig.up) { this.zone = "deck"; se("Cursor1", 35, 110); }
            } else if (this.trig.down || this.rep.left || this.rep.right) { this.zone = "hand"; se("Cursor1", 35, 110); }
            this.curCard = list[this.ci];
            if (this.trig.shift) this.callMakao();
            if (this.trig.ok && this.phaseT > 4) { if (this.zone === "deck") this.heroTake(); else this.heroPick(this.curCard); }
        }
        stateHint() {
            const st = this.st, k = TK.kod;
            if (st.war > 0) return k.hint[1];
            if (st.stop > 0) return k.hint[2];
            if (st.req) return Watki.wstaw(k.hint[3], { rank: k.ranksMany[st.req - 2] });
            if (st.suit >= 0) return Watki.wstaw(k.hint[4], { suit: k.suits[st.suit] });
            return k.hint[0];
        }
        heroPick(c) {
            const st = this.st, k = TK.kod;
            if (c === undefined) return;
            if (this.drawn >= 0 && c !== this.drawn) { this.hint(k.hint[11]); SoundManager.playBuzzer(); return; }
            if (this.lifted.length) {
                if (this.lifted.includes(c)) return this.heroPlay(this.lifted.slice());
                if (rankOf(c) === rankOf(this.lifted[0])) { this.lifted.push(c); se("Book1", 40, 140); return; }
                this.hint(Watki.wstaw(k.hint[5], { rank: k.ranksMany[rankOf(this.lifted[0]) - 2] })); SoundManager.playBuzzer();
                return;
            }
            if (!fits(st, c)) { this.hint(this.stateHint(), "#ffb070"); SoundManager.playBuzzer(); return; }
            if (this.drawn < 0 && st.hands[0].some(x => x !== c && rankOf(x) === rankOf(c))) { this.lifted = [c]; se("Book1", 40, 140); return; }
            this.heroPlay([c]);
        }
        // a jack or an ace on top: what it asks for first (P goes back to the cards)
        heroPlay(cards) {
            const r = rankOf(cards[cards.length - 1]), k = TK.kod;
            if (r === 14) return this.showChoice({ title: k.choice[0], options: k.suits.map(cap), cancel: -1, foot: k.choice[3], w: 420, onPick: i => this.doPlay(0, cards, i) });
            if (r === 11) return this.showChoice({ title: k.choice[1], options: [5, 6, 7, 8, 9, 10].map(n => cap(k.ranks[n - 2])).concat([k.choice[2]]), cancel: -1, foot: k.choice[3], w: 420,
                onPick: i => this.doPlay(0, cards, i < 6 ? i + 5 : 0) });
            this.doPlay(0, cards, null);
        }
        heroTake() {
            if (this.drawn >= 0) { this.drawn = -1; se("Cancel1", 40); return this.endTurn(); }
            this.lifted = [];
            const res = take(this.st, 0, this.rng);
            if (res.kind === "stop") { this.hint(TK.kod.hint[10]); return this.endTurn(); }
            if (res.kind === "war") this.hint(Watki.wstaw(TK.kod.hint[13], { n: res.cards.length, kart: kart(res.cards.length) }), "#ffb070");
            this.give(0, res.cards, () => {
                const c = res.cards[0];
                if (res.kind === "one" && res.cards.length && fits(this.st, c)) {
                    this.drawn = c; this.curCard = c; this.zone = "hand";
                    this.hint(TK.kod.hint[11]);
                    this.setPhase("you");
                } else this.endTurn();
            });
        }
        callMakao() {
            if (this.makaoSaid) return;
            this.makaoSaid = true;
            this.bubbleL.say(TK.kod.say[0], 80);
            se("Decision2", 50, 110);
        }
        oppTick() {
            const st = this.st, p = st.turn, o = this.rivals[p - 1];
            if (this.phaseT === 1) { this.plan = decide(st, p, o.mind, this.rng); this.thinkFor = o.think + Math.floor(this.rng() * 30); }
            if (this.phaseT < this.thinkFor) return;
            if (this.plan) return this.doPlay(p, this.plan.cards, this.plan.choice);
            const res = take(st, p, this.rng);
            if (res.kind === "stop") { this.hint(Watki.wstaw(TK.kod.hint[9], { short: o.short })); return this.endTurn(); }
            if (res.kind === "war") { this.hint(Watki.wstaw(TK.kod.hint[12], { short: o.short, n: res.cards.length, kart: kart(res.cards.length) })); this.speak(p, pick(o.hitLines, this.rng)); }
            this.give(p, res.cards, () => {
                const c = res.cards[0];
                if (res.kind === "one" && res.cards.length && fits(this.st, c)) this.doPlay(p, [c], choiceFor(this.st, p, [c]));
                else this.endTurn();
            });
        }
        // cards into a hand: from the deck, one after another
        give(p, cards, then) {
            if (!cards.length) { this.wait(then); return; }
            cards.forEach((c, i) => {
                this.incoming.add(c);
                const to = p === 0 ? this.handPos(this.display(), this.display().indexOf(c)) : this.fanPos(p, this.st.hands[p].indexOf(c));
                this.fly({ c, x0: DECK.x, y0: DECK.y, x1: to.x, y1: to.y, sc1: p === 0 ? 1 : 0.5, delay: i * 5, dur: 14, flip: p === 0,
                    then: () => { this.incoming.delete(c); se("Book1", 30, 150); } });
            });
            this.wait(then);
        }
        doPlay(p, cards, choice) {
            const from = cards.map(c => this.cardFrom(p, c));
            const res = play(this.st, p, cards, choice);
            this.lifted = []; this.drawn = -1;
            this.pileHold += cards.length;
            cards.forEach((c, i) => {
                const sp = this.pileSpot(c), f = from[i];
                if (p === 0) { const s = this.handSprites.get(c); if (s) { this.handLayer.removeChild(s); this.handSprites.delete(c); } }
                this.fly({ c, x0: f.x, y0: f.y, x1: sp.x, y1: sp.y, sc0: f.sc, r1: sp.r, delay: i * 6, dur: 14, flip: p !== 0, face: p === 0,
                    then: () => { this.pileHold--; se("Book1", 45, 120); } });
            });
            const r = rankOf(cards[cards.length - 1]);
            if (p > 0) {
                const o = this.rivals[p - 1];
                if (cards.some(isWar) || r === 4) this.speak(p, pick(o.attackLines, this.rng));
                else if (this.rng() < 0.15) this.speak(p, pick(o.playLines, this.rng));
            }
            this.wait(() => this.afterPlay(p, res));
        }
        afterPlay(p, res) {
            const st = this.st;
            if (res.back) {   // the king of spades: the one before takes them now
                const to = res.back.to, got = drawCards(st, to, res.back.n, this.rng);
                this.hint(to === 0 ? Watki.wstaw(TK.kod.hint[13], { n: got.length, kart: kart(got.length) })
                    : Watki.wstaw(TK.kod.hint[12], { short: this.rivals[to - 1].short, n: got.length, kart: kart(got.length) }), "#ffb070");
                if (to > 0) this.speak(to, pick(this.rivals[to - 1].hitLines, this.rng));
                return this.give(to, got, () => this.afterPlay(p, Object.assign({}, res, { back: null })));
            }
            if (st.winner >= 0) return this.finish(st.winner);
            if (st.hands[p].length === 1) {
                if (p === 0) {
                    if (!this.makaoSaid) { this.hint(TK.kod.hint[6], U().accent); this.setPhase("makao"); return; }
                } else {
                    const o = this.rivals[p - 1];
                    if (this.rng() < (o.mind.forget || 0)) {
                        const got = drawCards(st, p, 5, this.rng);
                        this.hint(Watki.wstaw(TK.kod.hint[8], { short: o.short }), "#ffb070");
                        this.speak(p, o.forgot);
                        return this.give(p, got, () => this.endTurn());
                    }
                    this.speak(p, o.makao);
                    se("Decision2", 40, 90);
                }
            }
            this.endTurn();
        }
        // one card left in his hand: Shift in time, or five more
        makaoTick() {
            if (this.trig.shift) { this.callMakao(); return this.endTurn(); }
            if (this.phaseT < GAME.makaoWindow) return;
            const got = drawCards(this.st, 0, 5, this.rng);
            this.hint(TK.kod.hint[7], BAD);
            SoundManager.playBuzzer();
            this.rivals.forEach((o, i) => { if (this.rng() < 0.6) this.speak(i + 1, pick(o.attackLines, this.rng)); });
            this.give(0, got, () => this.endTurn());
        }
        speak(p, text) {
            if (!text || p < 1) return;
            this.says[p - 1].say(text, this.seats[p - 1], 110);
        }
        giveUp() { this.finish(-1, true); }
        finishByCount() {
            const n = this.st.hands.map(h => h.length), min = Math.min.apply(null, n), who = n.map((v, i) => (v === min ? i : -1)).filter(i => i >= 0);
            this.finish(who.length === 1 ? who[0] : -2);
        }
        // winner: a player's index; -1 given up (lost), -2 a draw (the stakes back)
        finish(winner, gaveUp) {
            const won = winner === 0, draw = winner === -2, k = TK.kod.finish, w = winner > 0 ? this.rivals[winner - 1] : null;
            if (winner >= 0) { if (winner === 0) this.bubbleL.say(TK.kod.say[1], 100); else this.speak(winner, w.win); }
            this.result = { game: "makao", won, draw, stake: won ? this.stake * (this.n - 1) : draw ? 0 : this.stake, pot: this.pot, rivals: this.rivalKeys.slice(),
                opponent: this.rivalKeys[0], rival: this.rivalKeys[0], winner: winner === 0 ? "hero" : w ? this.rivalKeys[winner - 1] : null, cards: this.st.hands[0].length,
                turns: this.st.turns, gaveUp: !!gaveUp, minutes: GAME.minutes, stamina: GAME.stamina };
            const speaker = w || this.rivals[0], line = won ? speaker.lost : draw ? "" : w ? w.won : this.rivals[0].won;
            this.result.line = line;
            if (won) se("Applause1", 55);
            this.cursorSpr.visible = false;
            const after = () => this.showCard({ wait: 30, bust: rivalBust(speaker), who: speaker.name, whoSub: "makao", kicker: k[0],
                title: won ? "Wygrana!" : gaveUp ? k[1] : draw ? k[2] : "Przegrana", titleColor: won ? U().accent : draw ? U().text : BAD,
                sub: (won ? k[6] : w ? Watki.wstaw(k[5], { name: w.name }) : draw ? k[7] : k[8]) + (this.stake && !draw ? "   ·   " + (won ? "+" + this.stake * (this.n - 1) : "−" + this.stake) + " G" : ""),
                subColor: won ? GOOD : draw ? U().text : BAD, say: line || null,
                lines: [[Watki.wstaw(k[3], { minutes: GAME.minutes, turns: Math.ceil(this.st.turns / this.n) }), U().muted]], foot: k[4], h: 440 }, () => this.leave());
            this.endCard = after;
            if (gaveUp) { this.setPhase("summary"); after(); } else this.setPhase("ending");
        }
        // ---- the pictures every frame
        frame() {
            this.drawHand();
            this.drawFans();
            this.drawPiles();
            this.drawPortraits();
            this.drawStatus();
            for (let i = this.popups.length - 1; i >= 0; i--) {
                const s = this.popups[i];
                s._t++;
                s.opacity = Math.round(255 * Math.min(1, (90 - s._t) / 20));
                if (s._t >= 90) { this.root.removeChild(s); this.popups.splice(i, 1); }
            }
            this.drawHud();
        }
        drawHand() {
            const list = this.display(), you = this.phase === "you", st = this.st, shown = list.filter(c => !this.incoming.has(c));
            for (const [c, s] of this.handSprites) if (!list.includes(c) || this.incoming.has(c)) { this.handLayer.removeChild(s); this.handSprites.delete(c); }
            list.forEach((c, i) => {
                if (this.incoming.has(c)) return;
                let s = this.handSprites.get(c);
                const to = this.handPos(list, i);
                if (!s) { s = new Sprite(faceBitmap(c)); s.anchor.set(0.5, 0.5); s.x = to.x; s.y = to.y; this.handSprites.set(c, s); }
                const cur = you && this.zone === "hand" && c === this.curCard, lift = this.lifted.includes(c) || c === this.drawn;
                const ty = to.y - (lift ? 28 : 0) - (cur ? 12 : 0);
                s.x += (to.x - s.x) * 0.35; s.y += (ty - s.y) * 0.35;
                const ok = !you || (this.lifted.length ? this.lifted.includes(c) || rankOf(c) === rankOf(this.lifted[0]) : this.drawn >= 0 ? c === this.drawn : fits(st, c));
                if (s._ok !== ok) { s._ok = ok; s.setBlendColor(ok ? [0, 0, 0, 0] : [8, 8, 12, 120]); }
            });
            // (left to right in the layer, as they overlap; the card under the cursor has the room after it - nothing covers it, so its
            // frame never lies over another card)
            const onCard = you && this.zone === "hand" && this.handSprites.get(this.curCard), onDeck = you && this.zone === "deck";
            const order = shown.map(c => this.handSprites.get(c)).filter(Boolean);
            if (order.length !== this.handLayer.children.length || order.some((s, i) => this.handLayer.children[i] !== s)) { this.handLayer.removeChildren(); for (const s of order) this.handLayer.addChild(s); }
            this.cursorSpr.visible = !!(onCard || onDeck);
            if (onCard) { this.cursorSpr.x = onCard.x; this.cursorSpr.y = onCard.y; }
            else if (onDeck) { this.cursorSpr.x = DECK.x; this.cursorSpr.y = DECK.y; }
            this.cursorSpr.opacity = 190 + Math.round(65 * Math.sin(this.t * 0.12));
        }
        drawFans() {
            this.rivals.forEach((o, i) => {
                const p = i + 1, n = this.st.hands[p].filter(c => !this.incoming.has(c)).length, fan = this.fans[i];
                if (fan._n !== n || fan._all !== this.st.hands[p].length) {
                    fan._n = n; fan._all = this.st.hands[p].length;
                    fan.removeChildren();
                    for (let j = 0; j < n; j++) {
                        const s = new Sprite(backBitmap()), at = this.fanPos(p, j);
                        s.anchor.set(0.5, 0.5); s.scale.set(0.5); s.x = at.x; s.y = at.y; s.rotation = (j - (n - 1) / 2) * 0.03 * this.seatOf(p).fan.dir;
                        fan.addChild(s);
                    }
                    const b = this.counts[i].bitmap;
                    b.clear();
                    if (n) cardText(b, n + " " + (n === 1 ? "karta" : kart(n) === "karty" ? "karty" : "kart"), 0, 0, 160, 17, "#e8dcc4", true, this.seatOf(p).fan.dir > 0 ? "left" : "right");
                }
            });
        }
        drawPiles() {
            const st = this.st, deckN = st.draw.length, vis = st.discard.slice(0, st.discard.length - this.pileHold).slice(-4);
            const key = deckN + "|" + vis.join(",");
            if (key === this._pileKey) return;
            this._pileKey = key;
            this.deckSpr.removeChildren();
            const layers = Math.min(5, Math.ceil(deckN / 8));
            for (let j = 0; j < layers; j++) {
                const s = new Sprite(backBitmap());
                s.anchor.set(0.5, 0.5); s.x = DECK.x - j * 1.5; s.y = DECK.y - j * 2;
                this.deckSpr.addChild(s);
            }
            this.pileSpr.removeChildren();
            for (const c of vis) {
                const s = new Sprite(faceBitmap(c)), sp = this.pileSpot(c);
                s.anchor.set(0.5, 0.5); s.x = sp.x; s.y = sp.y; s.rotation = sp.r;
                this.pileSpr.addChild(s);
            }
        }
        drawPortraits() {
            this.rivals.forEach((o, i) => {
                const p = i + 1, act = this.st.turn === p && (this.phase === "opp" || this.phase === "anim"), bust = this.busts[i], ready = bust.isReady() && !bust.isError();
                const key = act + "|" + ready;
                const spr = this.portraits[i];
                if (spr._key === key) return;
                spr._key = key;
                const b = spr.bitmap, ctx = b.context, S0 = U();
                b.clear();
                ui.panel(b, 0, 0, 148, 178, { cut: 6 });
                if (ready) {
                    const img = bust._canvas || bust._image, sc = 140 / bust.width, h = bust.height * sc;
                    ctx.save(); ctx.beginPath(); ctx.rect(4, 4, 140, 146); ctx.clip();
                    ctx.imageSmoothingEnabled = true;
                    if (this.seats[i] === "left") { ctx.translate(148, 0); ctx.scale(-1, 1); }
                    ctx.drawImage(img, 0, 0, bust.width, bust.height, 4, 150 - h, 140, h);
                    ctx.restore();
                }
                ctx.fillStyle = act ? S0.accent : S0.line; ctx.fillRect(4, 150, 140, 2);
                cardText(b, o.short, 4, 153, 140, 18, act ? S0.accent : S0.text, true, "center");
                if (act) { ctx.strokeStyle = S0.accent; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, 145, 175); }
                dirty(b);
            });
        }
        drawStatus() {
            const st = this.st, k = TK.kod;
            let text = "";
            if (st.war > 0) text = Watki.wstaw(k.state[0], { n: st.war, kart: kart(st.war) });
            else if (st.stop > 0) text = Watki.wstaw(k.state[1], { n: st.stop, kolejki: kolejki(st.stop) });
            else if (st.req) text = Watki.wstaw(k.state[2], { rank: k.ranksMany[st.req - 2] });
            else if (st.suit >= 0) text = Watki.wstaw(k.state[3], { suit: k.suits[st.suit] });
            const you = this.phase === "you", deck = !you ? "" : this.drawn >= 0 ? k.deck[3] : st.war > 0 ? Watki.wstaw(k.deck[1], { n: st.war, kart: kart(st.war) })
                : st.stop > 0 ? Watki.wstaw(k.deck[2], { n: st.stop }) : k.deck[0];
            const key = text + "|" + deck + "|" + this.zone;
            if (key === this._statusKey) return;
            this._statusKey = key;
            const b = this.status.bitmap, S0 = U();
            b.clear();
            if (text) {
                ui.panel(b, 0, 0, 300, 32, { cut: 4 });
                cardText(b, text, 0, 6, 300, 17, "#ffb070", true, "center");
            }
            const d = this.deckLabel.bitmap;
            d.clear();
            if (deck) cardText(d, deck, 0, 4, 260, 17, this.zone === "deck" ? S0.accent : "#e8dcc4", true, "center");
        }
        hint(text, colour) {
            for (const p of this.popups) this.root.removeChild(p);
            this.popups.length = 0;
            const b = new Bitmap(640, 40);
            cardText(b, text, 2, 6, 640, 22, "rgba(0,0,0,0.9)", true, "center");
            cardText(b, text, 0, 4, 640, 22, colour || U().text, true, "center");
            const s = new Sprite(b);
            s.anchor.set(0.5, 1); s.x = 640; s.y = 476; s._t = 0;
            this.root.addChild(s);
            this.popups.push(s);
        }
        drawHud() {
            const play = this.phase !== "card" && this.phase !== "summary", H = TK.kod.hud, mine = this.st.turn === 0;
            this.showHud(play, [[TK.kod.begin[9], H[3]], ["O", H[4]], ["Shift", H[5]], ["P", H[6]]]);
            const key = [play, mine, this.st.turn, this.st.draw.length].join("|");
            if (key === this._hudKey) return;
            this._hudKey = key;
            const b = this.panels.bitmap, S0 = U();
            b.clear();
            if (!play) return;
            ui.panel(b, 1040, 560, 220, 96, { cut: 6 });
            cardText(b, H[0] + (this.stake ? Watki.wstaw(H[9], { stake: this.stake }) : ""), 1054, 566, 200, 15, S0.muted, true);
            cardText(b, mine ? H[1] : Watki.wstaw(H[2], { short: this.rivals[this.st.turn - 1].short }), 1054, 586, 200, 22, mine ? S0.accent : "#ff9f8f", true);
            cardText(b, (this.stake ? Watki.wstaw(H[8], { pot: this.pot }) + "  ·  " : "") + Watki.wstaw(H[7], { n: this.st.draw.length }), 1054, 618, 200, 16, S0.text);
            dirty(b);
        }
        state() {
            const st = this.st;
            return Object.assign(super.state(), { phase: this.phase, turn: st.turn, hands: st.hands.map(h => h.slice()), top: topOf(st), war: st.war, stop: st.stop, req: st.req, suit: st.suit,
                draw: st.draw.length, turns: st.turns, zone: this.zone, cur: this.curCard, lifted: this.lifted.slice(), drawn: this.drawn, makaoSaid: this.makaoSaid,
                paused: this.paused, result: this.result || null });
        }
    }
    Scene_Makao.gameId = "makao";
    window.Scene_Makao = Scene_Makao;

    // ==================================================================
    // The talk at the table: who sits there, the stake into the pot; back on the map the coins and a word (TavernLife.js)
    // ==================================================================
    const stats = () => {
        const s = S();
        if (!s.makao) s.makao = { played: 0, won: 0, lost: 0, net: 0, draws: 0, makao: 0 };
        return s.makao;
    };
    function rivalSay(out, key, text) {
        const o = RIVALS[key];
        if (o.role) return sayAs(out, o.role, text);
        return say(out, -1, text, o.face, o.name);
    }
    function talk() {
        const o = [], here = tableToday(), k = TK.kod.talk;
        if (!here.length) { heroSay(o, k[3]); return o; }
        const a = RIVALS[here[0]], n = here.length + 1;
        rivalSay(o, here[0], Watki.wstaw(k[0], { hello: a.hello, n: n === 2 ? k[4] : k[5], kto: n === 2 ? k[6] : Watki.wstaw(k[7], { other: RIVALS[here[1]].other }) }));
        choose(o, STAKES.map(s => ({ label: Watki.wstaw(k[1], { n: s, pot: s * n }), js: ["TavernLife.step(this, 'makao', " + s + ", " + q(here.join(",")) + ")", "TavernLife.step(this, 'gameAfter')"] }))
            .concat([{ label: k[2], js: [] }]));
        return o;
    }
    lib.addKind("makao", () => talk());
    lib.addStep("makao", (interp, ev, arg, arg2) => {
        const stake = Number(arg) || 0, rivals = String(arg2 || "wiesiek").split(",").filter(k => RIVALS[k]);
        if (gold() < stake) { needGold(stake); return; }
        stats();
        if (lib.startGame(Scene_Makao, { stake, rivals })) lib.setGameAfter({ game: "makao", stake, opponent: rivals[0], rivals });
    });
    lib.defineGame("makao", {
        xpWin: GAME.xpWin, xpLose: GAME.xpLose, reason: "makao",
        apply(st, res) {
            st.draws = st.draws || 0;
            if (res.draw) { st.lost--; st.draws++; }
        },
        note: () => ["Makao", Watki.wstaw(TK.kod.note[0], { "1": STAKES.join(", ") })],
        who: g => ((g.rivals || []).includes("ozzy") ? npc("ozzy") : (spots("makao")[0] || {}).ev || null),
        after(r, g, who) {
            if (who && (g.rivals || []).includes("ozzy")) bark(who, r.won ? TK.kod.after[0] : TK.kod.after[1], 120);
        }
    });

    const MAKAO = { GAME, STAKES, RIVALS, rankOf, suitOf, isWar, newGame, deal, fits, canPlay, play, take, next, drawCards, decide, choiceFor, tableToday };
    Object.assign(TL, { MAKAO, makao: opts => { stats(); return lib.startGame(Scene_Makao, opts); } });
    TL.modules.TavernLife_Makao = true;
})();
