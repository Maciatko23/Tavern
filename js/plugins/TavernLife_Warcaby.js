//=============================================================================
// TavernLife_Warcaby.js
//=============================================================================
// Draughts at the chess-board table in the games room (<Tavern:warcaby>): the talk (the opponent - Dziadek Ozzy, the carter Wiesiek,
// the merchant Wawrzyniec in the evening - and the stake), the game on Tawerna.ui.Scene_MiniGame (TawernaUI.js: the cards, the pause,
// the key hints, the busts in the corners, seed and turbo for the tests), the rules and the rivals' minds. TavernLife.js settles the
// end on the map (the stake, the time, the numbers).

/*:
 * @target MZ
 * @plugindesc Warcaby przy stoliku z szachownicą w pokoju gier (część TavernLife.js): Ozzy, furman Wiesiek, kupiec Wawrzyniec; bicie obowiązkowe, damki. v1.0.0
 * @author Claude
 * @base TavernLife
 * @orderAfter TavernLife
 *
 * @param stakes
 * @text Stawki
 * @desc Stawki do wyboru w miedziakach (G), po przecinku. Wygrany zgarnia pulę: dwa razy stawkę.
 * @default 5,10
 *
 * @help
 * ============================================================================
 * TavernLife_Warcaby.js - warcaby
 * ============================================================================
 * Część TavernLife.js. Stolik z szachownicą to zdarzenie z komentarzem
 * <Tavern:warcaby> (krzesło albo stół); przy nim okienko „O - Zagraj
 * w warcaby”. O: z kim grasz (Dziadek Ozzy, gdy jest w sali; furman
 * Wiesiek; kupiec Wawrzyniec od 18 do 23), o jaką stawkę, potem gra.
 *
 * Zasady (warcaby 8x8): grasz jasnymi i zaczynasz. Pionki idą na skos
 * do przodu, biją w obie strony. Bicie jest obowiązkowe i trzeba bić
 * do końca (zbite pionki znikają po ruchu). Pionek, który skończy ruch
 * w ostatnim rzędzie, zostaje damką: chodzi i bije na całą przekątną.
 * Przegrywa ten, kto nie ma ruchu. Remis: 50 ruchów samymi damkami
 * bez bicia albo 300 ruchów w ogóle.
 *
 * Strzałki - kursor, O - pionek, potem pole (przy biciu wielokrotnym
 * pole po polu). P - pauza (grać dalej albo się poddać).
 *
 * KOLEJNOŚĆ: pod TavernLife.js.
 * Dla testów: TavernLife.warcaby({ stake, seed, turbo, opponent, onEnd }),
 * TavernLife.WARCABY (zasady: nowa plansza, ruchy, ruch rywala).
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("warcaby");   // (the words of this file: js/teksty/warcaby.txt)

    const T = window.Tawerna;
    if (!T) throw new Error("TavernLife_Warcaby.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const TL = T.api("TavernLife");
    if (!TL || !TL.lib) throw new Error("TavernLife_Warcaby.js: brak TavernLife.js - musi być nad tą wtyczką na liście (TavernLife is missing)");
    const lib = TL.lib, ui = T.ui;
    const { lerp, hash, pick, U, GOOD, BAD, se, gold, needGold, bark, cached, dirty, S, npc, spots, bustOf, say, sayAs, heroSay, choose, run, q, hour } = lib;
    const STAKES = lib.nums(PluginManager.parameters("TavernLife_Warcaby").stakes, "5,10");
    const GAME = { minutes: 30, stamina: 2, xpWin: 12, xpLose: 4, quietDraw: 50, maxPlies: 300 };
    const cardText = (b, s, x, y, w, size, colour, bold, align) => ui.text(b, s, x, y, w, { size, color: colour || U().text, bold, align, lh: Math.round(size * 1.4) });

    // ==================================================================
    // THE RULES (8x8 draughts): Int8Array(64), index r * 8 + c, row 0 at the top. 1 the hero's man (light, moving up), 2 his king;
    // -1 / -2 the rival's (dark, moving down). Men capture both ways; capturing is a must and goes on to the end; the pieces taken stay
    // on the board until the move ends (no jumping one twice); a man ending its move on the far row is crowned; kings fly
    // ==================================================================
    const DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const inside = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
    const at = (r, c) => r * 8 + c;
    const sideOf = v => (v > 0 ? 1 : v < 0 ? -1 : 0);
    const isKing = v => v === 2 || v === -2;
    const lastRow = side => (side > 0 ? 0 : 7);
    function newBoard() {
        const b = new Int8Array(64);
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 !== 1) continue;
            if (r < 3) b[at(r, c)] = -1; else if (r > 4) b[at(r, c)] = 1;
        }
        return b;
    }
    function moveOf(side, king, from, path, caps) {
        const to = path[path.length - 1];
        return { from, path, caps, to, promote: !king && (to >> 3) === lastRow(side) };
    }
    // every complete capture of a piece: a path of landings (the piece has left its square: it may come back over it)
    function jumpsFrom(b, side, king, from, cur, path, caps, out) {
        const r = cur >> 3, c = cur & 7;
        let any = false;
        for (const [dr, dc] of DIRS) {
            if (king) {
                let rr = r + dr, cc = c + dc;
                while (inside(rr, cc) && !b[at(rr, cc)]) { rr += dr; cc += dc; }
                if (!inside(rr, cc)) continue;
                const mid = at(rr, cc);
                if (sideOf(b[mid]) !== -side || caps.includes(mid)) continue;
                for (let lr = rr + dr, lc = cc + dc; inside(lr, lc) && !b[at(lr, lc)]; lr += dr, lc += dc) {
                    const land = at(lr, lc);
                    any = true;
                    jumpsFrom(b, side, king, from, land, path.concat(land), caps.concat(mid), out);
                }
            } else {
                const lr = r + 2 * dr, lc = c + 2 * dc;
                if (!inside(lr, lc)) continue;
                const mid = at(r + dr, c + dc), land = at(lr, lc);
                if (sideOf(b[mid]) !== -side || caps.includes(mid) || b[land]) continue;
                any = true;
                jumpsFrom(b, side, king, from, land, path.concat(land), caps.concat(mid), out);
            }
        }
        if (!any && path.length) out.push(moveOf(side, king, from, path, caps));
    }
    function captures(b, side) {
        const out = [];
        for (let i = 0; i < 64; i++) {
            const v = b[i];
            if (sideOf(v) !== side) continue;
            b[i] = 0;
            jumpsFrom(b, side, isKing(v), i, i, [], [], out);
            b[i] = v;
        }
        return out;
    }
    function steps(b, side) {
        const out = [];
        for (let i = 0; i < 64; i++) {
            const v = b[i];
            if (sideOf(v) !== side) continue;
            const r = i >> 3, c = i & 7, king = isKing(v);
            for (const [dr, dc] of DIRS) {
                if (!king && dr !== -side) continue;
                for (let rr = r + dr, cc = c + dc; inside(rr, cc) && !b[at(rr, cc)]; rr += dr, cc += dc) {
                    out.push(moveOf(side, king, i, [at(rr, cc)], []));
                    if (!king) break;
                }
            }
        }
        return out;
    }
    // (the minds' leaves: is there any plain move at all - without making the list)
    function hasStep(b, side) {
        for (let i = 0; i < 64; i++) {
            const v = b[i];
            if (sideOf(v) !== side) continue;
            const r = i >> 3, c = i & 7, king = isKing(v);
            for (const [dr, dc] of DIRS) {
                if (!king && dr !== -side) continue;
                if (inside(r + dr, c + dc) && !b[at(r + dr, c + dc)]) return true;
            }
        }
        return false;
    }
    function legalMoves(b, side) {
        const c = captures(b, side);
        return c.length ? c : steps(b, side);
    }
    function applyMove(b, m) {
        const nb = b.slice(), v = nb[m.from];
        nb[m.from] = 0;
        for (const c of m.caps) nb[c] = 0;
        nb[m.to] = m.promote ? v * 2 : v;
        return nb;
    }
    const count = (b, side) => { let n = 0; for (let i = 0; i < 64; i++) if (sideOf(b[i]) === side) n++; return n; };

    // ------------------------------------------------------------------
    // The rivals' minds: negamax with alpha-beta, captures searched on past the depth (no piece hangs at the horizon), a cap on the
    // positions looked at (the frame never stalls); the easier ones look less deep, blunder now and then and misjudge a little
    // ------------------------------------------------------------------
    const WIN = 100000;
    function evaluate(b, side) {
        let s = 0, mine = 0, theirs = 0;
        for (let i = 0; i < 64; i++) {
            const v = b[i];
            if (!v) continue;
            const p = v > 0 ? 1 : -1, r = i >> 3, c = i & 7, king = isKing(v);
            let val;
            if (king) val = 300 + (r + c === 7 ? 12 : 0) + (r > 0 && r < 7 && c > 0 && c < 7 ? 6 : 0);   // (the long diagonal, off the edge)
            else {
                const adv = p > 0 ? 7 - r : r;
                val = 100 + adv * 4 + (adv === 0 ? 8 : 0) + (c >= 2 && c <= 5 && r >= 2 && r <= 5 ? 4 : 0);   // (forward, the back row kept, the centre)
            }
            if (p === side) { s += val; mine += king ? 3 : 1; } else { s -= val; theirs += king ? 3 : 1; }
        }
        if (mine !== theirs) s += (mine - theirs) * (40 - mine - theirs) * 1.5;   // ahead: trade down
        return s;
    }
    const order = (a, b) => (b.caps.length - a.caps.length) || ((b.promote ? 1 : 0) - (a.promote ? 1 : 0));
    function negamax(b, side, depth, alpha, beta, ctx, ply) {
        ctx.nodes++;
        let moves = captures(b, side);
        if (moves.length) {
            if (depth <= 0 && ply > ctx.qmax) return evaluate(b, side);
        } else if (depth <= 0 || ctx.nodes > ctx.max) {
            return hasStep(b, side) ? evaluate(b, side) : -WIN + ply;
        } else {
            moves = steps(b, side);
            if (!moves.length) return -WIN + ply;
        }
        moves.sort(order);
        let best = -Infinity;
        for (const m of moves) {
            const sc = -negamax(applyMove(b, m), -side, depth - 1, -beta, -alpha, ctx, ply + 1);
            if (sc > best) best = sc;
            if (sc > alpha) alpha = sc;
            if (alpha >= beta) break;
        }
        return best;
    }
    function gauss(rng) { const u = Math.max(1e-6, rng()), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    // the rival's move: { move, nodes }
    function chooseMove(b, side, mind, rng) {
        const moves = legalMoves(b, side);
        if (!moves.length) return { move: null, nodes: 0 };
        if (moves.length === 1) return { move: moves[0], nodes: 0 };
        if (rng() < (mind.blunder || 0)) return { move: moves[Math.floor(rng() * moves.length) % moves.length], nodes: 0 };
        const ctx = { nodes: 0, max: mind.nodes || 40000, qmax: mind.depth + 8 };
        moves.sort(order);
        let best = -Infinity, pickM = moves[0];
        for (const m of moves) {
            const alpha = best === -Infinity ? -WIN - 1 : best - 80;   // (far worse than the best so far: not worth the exact number)
            let sc = -negamax(applyMove(b, m), -side, mind.depth - 1, -WIN - 1, -alpha, ctx, 1);
            sc += gauss(rng) * (mind.noise || 0) + rng() * 2;   // (misjudging; and the equal ones in a different order every game)
            if (sc > best) { best = sc; pickM = m; }
        }
        return { move: pickM, nodes: ctx.nodes };
    }

    // ==================================================================
    // THE RIVALS: the words in js/teksty/warcaby.txt (rywale.<key>); the mind: depth, blunders, misjudging, positions looked at
    // ==================================================================
    const OPPONENTS = {
        ozzy: { role: "ozzy", mind: { depth: 2, blunder: 0.28, noise: 70, nodes: 6000 }, think: 50 },
        wiesiek: { role: null, bust: "Rzutki_Wiesiek_Bust", face: ["People2", 6], mind: { depth: 4, blunder: 0.05, noise: 14, nodes: 20000 }, think: 40 },
        kupiec: { role: null, bust: "Kosci_Kupiec_Bust", face: ["People4", 4], mind: { depth: 6, blunder: 0, noise: 0, nodes: 60000 }, think: 60, hours: [18, 23] }
    };
    Watki.scal(OPPONENTS, "warcaby", "rywale");
    const oppBust = o => (o.role ? bustOf(o.role) : o.bust);
    const atTable = key => {
        const o = OPPONENTS[key];
        if (!o) return false;
        if (o.role) return !!npc(o.role);
        if (o.hours) { const h = hour(); return h >= o.hours[0] && h < o.hours[1]; }
        return true;
    };

    // ==================================================================
    // THE PICTURES (drawn once): the board in its walnut frame with the letters and numbers, the pieces (ivory and cherry, a king is
    // two stacked with a gold crown), the cursor
    // ==================================================================
    const SQ = 56, BX = 640 - 4 * SQ, BY = 352 - 4 * SQ, FR = 26, PAD = 16;
    const PW = 56, PH = 64, PCY = 30;   // a piece's picture; the square's centre falls on (28, PCY)
    const cx = i => BX + (i & 7) * SQ + SQ / 2, cy = i => BY + (i >> 3) * SQ + SQ / 2;
    function boardBitmap() {
        return cached("warcabyBoard", () => {
            const n = 8 * SQ, o = FR + PAD, size = n + 2 * o, b = new Bitmap(size, size), ctx = b.context;
            ctx.save();
            // its shadow on the table
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(PAD + 6, PAD + 12, n + 2 * FR, n + 2 * FR);
            ctx.filter = "blur(6px)"; ctx.fillRect(PAD + 2, PAD + 8, n + 2 * FR + 8, n + 2 * FR + 8); ctx.filter = "none";
            // the walnut frame
            const fx = PAD, fy = PAD, fw = n + 2 * FR;
            const g = ctx.createLinearGradient(fx, fy, fx + fw, fy + fw);
            g.addColorStop(0, "#6e4527"); g.addColorStop(0.5, "#56341c"); g.addColorStop(1, "#3c2312");
            ctx.fillStyle = g; ctx.fillRect(fx, fy, fw, fw);
            for (let i = 0; i < 90; i++) {   // the grain
                const y = fy + hash(i, 61) * fw, x = fx + hash(i, 62) * fw, horiz = i % 2 === 0;
                ctx.fillStyle = "rgba(25,14,6," + (0.12 + hash(i, 63) * 0.18) + ")";
                if (horiz) ctx.fillRect(x, Math.round(y), 30 + hash(i, 64) * 120, 1); else ctx.fillRect(Math.round(x), y, 1, 30 + hash(i, 64) * 120);
            }
            ctx.fillStyle = "rgba(255,220,170,0.22)"; ctx.fillRect(fx, fy, fw, 2); ctx.fillRect(fx, fy, 2, fw);   // the bevel: light top-left,
            ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(fx, fy + fw - 2, fw, 2); ctx.fillRect(fx + fw - 2, fy, 2, fw);   // dark bottom-right
            ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 2;   // the gold inlay round the squares
            ctx.strokeRect(o - 5, o - 5, n + 10, n + 10);
            ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 2;
            ctx.strokeRect(o - 1, o - 1, n + 2, n + 2);
            // the squares: maple and walnut, each with its own grain
            for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
                const dark = (r + c) % 2 === 1, x = o + c * SQ, y = o + r * SQ, k = r * 8 + c;
                ctx.fillStyle = dark ? "#5c3920" : "#d6b98a";
                ctx.fillRect(x, y, SQ, SQ);
                for (let j = 0; j < 9; j++) {
                    const gy = y + Math.round(hash(k, j + 70) * SQ);
                    ctx.fillStyle = dark ? "rgba(20,10,4," + (0.18 + hash(k, j + 80) * 0.2) + ")" : "rgba(120,80,40," + (0.1 + hash(k, j + 80) * 0.14) + ")";
                    ctx.fillRect(x + Math.round(hash(k, j + 90) * 10), gy, SQ - Math.round(hash(k, j + 95) * 20), 1);
                }
                ctx.fillStyle = dark ? "rgba(255,200,150,0.07)" : "rgba(255,255,240,0.18)";
                ctx.fillRect(x, y, SQ, 1); ctx.fillRect(x, y, 1, SQ);
            }
            const v = ctx.createLinearGradient(o, o, o + n, o + n);   // the varnish: the lamp's light from the top left
            v.addColorStop(0, "rgba(255,230,180,0.14)"); v.addColorStop(0.6, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.18)");
            ctx.fillStyle = v; ctx.fillRect(o, o, n, n);
            ctx.restore();
            // the letters and numbers on the frame
            for (let i = 0; i < 8; i++) {
                cardText(b, "abcdefgh"[i], o + i * SQ, o + n + 5, SQ, 14, "#e8cf94", true, "center");
                cardText(b, String(8 - i), PAD, o + i * SQ + SQ / 2 - 10, FR - 2, 14, "#e8cf94", true, "center");
            }
            dirty(b);
            return b;
        });
    }
    function disc(ctx, x, y, light, thick) {
        const R = 22, top = light ? ["#fff7e2", "#eadbb8", "#c9b48a"] : ["#a3423a", "#7c2a24", "#561a15"], edge = light ? "#a8916a" : "#3a100d";
        ctx.fillStyle = edge;   // the side
        ctx.beginPath(); ctx.ellipse(x, y + thick, R, R * 0.92, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(x - R, y, 2 * R, thick);
        ctx.fillStyle = light ? "rgba(255,255,255,0.18)" : "rgba(255,140,120,0.12)";
        ctx.fillRect(x - R + 2, y + 1, 2 * R - 4, Math.max(1, thick - 2));
        const g = ctx.createRadialGradient(x - 7, y - 8, 3, x, y, R);   // the top
        g.addColorStop(0, top[0]); g.addColorStop(0.55, top[1]); g.addColorStop(1, top[2]);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.92, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = light ? "rgba(90,70,40,0.55)" : "rgba(20,4,2,0.6)"; ctx.lineWidth = 1.2;
        ctx.stroke();
        for (const [rr, a] of [[15.5, 0.32], [8, 0.26]]) {   // the turned grooves
            ctx.strokeStyle = light ? "rgba(110,85,45," + a + ")" : "rgba(25,5,3," + (a + 0.12) + ")";
            ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.92, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.strokeStyle = light ? "rgba(255,255,255,0.6)" : "rgba(255,190,170,0.35)"; ctx.lineWidth = 1.5;   // the shine
        ctx.beginPath(); ctx.ellipse(x, y, R - 3, (R - 3) * 0.92, 0, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
    }
    function crown(ctx, x, y) {
        ctx.save();
        ctx.fillStyle = "#e9c04c"; ctx.strokeStyle = "#5a3b08"; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x - 10, y + 6); ctx.lineTo(x - 11, y - 5); ctx.lineTo(x - 5, y + 0); ctx.lineTo(x, y - 8); ctx.lineTo(x + 5, y + 0); ctx.lineTo(x + 11, y - 5); ctx.lineTo(x + 10, y + 6);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#fff1b8"; ctx.fillRect(x - 8, y + 2, 16, 2);
        ctx.fillStyle = "#b8302c"; ctx.beginPath(); ctx.arc(x, y + 3, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    function pieceBitmap(v) {
        return cached("warcabyPiece" + v, () => {
            const b = new Bitmap(PW, PH), ctx = b.context, light = v > 0, king = isKing(v), x = PW / 2;
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.42)";   // its shadow on the square
            ctx.beginPath(); ctx.ellipse(x + 2, PCY + 6, 23, 19, 0, 0, Math.PI * 2); ctx.fill();
            if (king) { disc(ctx, x, PCY + 1, light, 5); disc(ctx, x, PCY - 7, light, 5); crown(ctx, x, PCY - 8); }
            else disc(ctx, x, PCY - 2, light, 6);
            ctx.restore();
            dirty(b);
            return b;
        });
    }
    function cursorBitmap() {
        return cached("warcabyCursor", () => {
            const b = new Bitmap(SQ + 8, SQ + 8), ctx = b.context, a = U().accent, L = 15, w = SQ + 8;
            ctx.fillStyle = "rgba(255,210,63,0.13)"; ctx.fillRect(4, 4, SQ, SQ);
            for (const [col, lw] of [["rgba(0,0,0,0.8)", 6], [a, 3]]) {
                ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "square";
                ctx.beginPath();
                ctx.moveTo(3, 3 + L); ctx.lineTo(3, 3); ctx.lineTo(3 + L, 3);
                ctx.moveTo(w - 3 - L, 3); ctx.lineTo(w - 3, 3); ctx.lineTo(w - 3, 3 + L);
                ctx.moveTo(w - 3, w - 3 - L); ctx.lineTo(w - 3, w - 3); ctx.lineTo(w - 3 - L, w - 3);
                ctx.moveTo(3 + L, w - 3); ctx.lineTo(3, w - 3); ctx.lineTo(3, w - 3 - L);
                ctx.stroke();
            }
            dirty(b);
            return b;
        });
    }
    // under the board: a dark oak table top in the lamp's pool of light (the tavern blurred behind it)
    function tableBitmap() {
        return cached("warcabyTable", () => {
            const W = 1280, H = 720, b = new Bitmap(W, H), ctx = b.context;
            const g = ctx.createRadialGradient(640, 330, 80, 640, 360, 620);
            g.addColorStop(0, "rgba(255,200,130,0.16)"); g.addColorStop(0.55, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.35)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            dirty(b);
            return b;
        });
    }

    // ==================================================================
    // THE SCENE
    // ==================================================================
    class Scene_Warcaby extends lib.gameScene() {
        createGame() {
            this.oppKey = OPPONENTS[this.opts.opponent] ? this.opts.opponent : "wiesiek";
            this.opp = OPPONENTS[this.oppKey];
            this.first = !S().firsts.warcaby;
            this.board = this.opts.board ? Int8Array.from(this.opts.board) : newBoard();   // (opts.board: the tests' positions)
            this.turn = 1; this.plies = 0; this.quiet = 0; this.last = null;
            this.cursor = at(5, 2); this.sel = -1; this.selFrom = -1; this.path = []; this.legal = [];
            this.light = new Sprite(tableBitmap());
            this.root.addChild(this.light);
            this.table = new Sprite(boardBitmap());
            this.table.x = BX - FR - PAD; this.table.y = BY - FR - PAD;
            this.root.addChild(this.table);
            this.marks = new Sprite(new Bitmap(8 * SQ, 8 * SQ));
            this.marks.x = BX; this.marks.y = BY;
            this.root.addChild(this.marks);
            this.pieces = new Sprite();
            this.root.addChild(this.pieces);
            this.cursorSpr = new Sprite(cursorBitmap());
            this.cursorSpr.visible = false;
            this.root.addChild(this.cursorSpr);
            this.sprites = new Array(64).fill(null);
            this.fading = []; this.popups = []; this.anim = null;
            this.syncPieces();
            this.pic(ui.heroBust());
            this.pic(oppBust(this.opp));
            this.showBusts(ui.heroBust(), oppBust(this.opp));
            this.bubbleL.move(24, 438);
            this.bubbleR.move(1256, 438);
        }
        begin() {
            const k = TK.kod.begin;
            this.showCard({ wait: 16, bust: oppBust(this.opp), who: this.opp.name, whoSub: this.opp.role ? k[0] : k[1],
                kicker: "WARCABY" + (this.stake ? Watki.wstaw(k[2], { stake: this.stake }) : ""), title: Watki.wstaw(k[3], { "1": this.opp.with }),
                sub: Watki.wstaw(k[10], { "1": this.opp.level }), subColor: U().muted, say: this.opp.hello,
                lines: this.first ? [k[4], k[5], k[6]] : [k[7]],
                keys: [[k[8], TK.kod.hud[4]], ["O", TK.kod.hud[5]], ["P", TK.kod.hud[6]]], foot: k[9] }, () => {
                this.banner.show("turn", TK.kod.turn[0], null, 60);
                this.nextTurn();
            });
            this.setPhase("card");
        }
        // ---- the turns
        nextTurn() {
            this.legal = legalMoves(this.board, this.turn);
            this.sel = -1; this.selFrom = -1; this.path = [];
            if (!this.legal.length) return this.finish(this.turn === 1 ? "lost" : "won");
            if (this.quiet >= GAME.quietDraw || this.plies >= GAME.maxPlies) return this.finish("draw");
            this.bustL.dim(this.turn !== 1);
            this.bustR.dim(this.turn === 1);
            if (this.turn === 1 && this.legal[0].caps.length) this.hint(TK.kod.hint[0], this.legal[0].from, "#ffb070");
            this.setPhase(this.turn === 1 ? "you" : "think");
        }
        tick() {
            switch (this.phase) {
                case "you": this.youTick(); break;
                case "think": this.thinkTick(); break;
                case "anim": this.animTick(); break;
                case "pause": if (this.phaseT >= 8) this.nextTurn(); break;
            }
            for (let i = this.fading.length - 1; i >= 0; i--) {   // the pieces taken: they lift and fade
                const f = this.fading[i];
                f.t++;
                f.s.opacity = Math.round(120 * Math.max(0, 1 - f.t / 18));
                f.s.y = f.y - f.t * 0.6;
                if (f.t >= 18) { this.pieces.removeChild(f.s); this.fading.splice(i, 1); }
            }
        }
        canPause() { return this.phase === "you"; }
        helpLines() { return [TK.kod.help[0], TK.kod.help[1]]; }
        youTick() {
            const k = this.rep;
            let r = this.cursor >> 3, c = this.cursor & 7;
            if (k.up) r--; if (k.down) r++; if (k.left) c--; if (k.right) c++;
            r = Math.max(0, Math.min(7, r)); c = Math.max(0, Math.min(7, c));
            if (at(r, c) !== this.cursor) { this.cursor = at(r, c); se("Cursor1", 35, 120); }
            if (this.trig.ok && this.phaseT > 4) this.press(this.cursor);
        }
        // the moves that go on from what he has picked so far (the piece, the landings)
        going() { return this.legal.filter(m => m.from === this.selFrom && this.path.every((s, i) => m.path[i] === s)); }
        targets() { return this.selFrom < 0 ? [] : Array.from(new Set(this.going().map(m => m.path[this.path.length]).filter(s => s !== undefined))); }
        // O on a square (the keys, and the tests' bots)
        press(sq) {
            if (this.phase !== "you") return false;
            if (this.path.length) {   // partway through a capture: only on to the next landing
                if (this.targets().includes(sq)) return this.stepTo(sq);
                this.hint(TK.kod.hint[2], this.sel, "#ffb070"); SoundManager.playBuzzer();
                return false;
            }
            if (this.sel >= 0 && this.targets().includes(sq)) return this.stepTo(sq);
            if (this.board[sq] > 0) {
                if (sq === this.sel) { this.sel = this.selFrom = -1; se("Cancel1", 40); return true; }
                if (this.legal.some(m => m.from === sq)) { this.sel = this.selFrom = sq; se("Cursor2", 50, 110); return true; }
                this.hint(this.legal[0].caps.length ? TK.kod.hint[0] : TK.kod.hint[1], sq, "#ffb070");
                SoundManager.playBuzzer();
                return false;
            }
            if (this.sel >= 0) SoundManager.playBuzzer();
            return false;
        }
        stepTo(sq) {
            const i = this.path.length, path = this.path.concat(sq), going = this.going().filter(m => m.path[i] === sq);
            const done = going.find(m => m.path.length === path.length) || null, cap = going[0].caps.length ? going[0].caps[i] : -1;
            this.hop(this.sel, sq, cap, () => {
                if (done) return this.commit(done, 1);
                this.path = path; this.sel = sq; this.cursor = sq;
                this.hint(TK.kod.hint[2], sq, "#ffb070");
                this.setPhase("you");
            });
            return true;
        }
        thinkTick() {
            if (this.phaseT === 1) {
                const t0 = performance.now(), r = chooseMove(this.board, -1, this.opp.mind, this.rng);
                this.oppMove = r.move; this.lastThink = { nodes: r.nodes, ms: Math.round(performance.now() - t0) };
                this.thinkFor = this.opp.think + Math.floor(this.rng() * 40);
            }
            if (this.phaseT >= this.thinkFor && this.oppMove) this.playMove(this.oppMove, -1);
        }
        playMove(m, side) {
            let i = 0;
            const next = () => {
                if (i >= m.path.length) return this.commit(m, side);
                const from = i ? m.path[i - 1] : m.from, to = m.path[i], cap = m.caps.length ? m.caps[i] : -1;
                i++;
                this.hop(from, to, cap, next);
            };
            next();
        }
        // one slide or jump of a piece's picture (the board itself changes when the whole move is done)
        hop(from, to, cap, then) {
            const s = this.sprites[from], dist = Math.max(Math.abs((to >> 3) - (from >> 3)), 1);
            this.anim = { s, from, to, cap, then, t: 0, per: (cap >= 0 ? 16 : 10) + dist * 3, jump: cap >= 0 };
            if (s) { this.pieces.removeChild(s); this.pieces.addChild(s); }   // (in front while it moves)
            se(cap >= 0 ? "Equip2" : "Equip1", 35, 140);
            this.setPhase("anim");
        }
        animTick() {
            const a = this.anim;
            if (!a) return;
            a.t++;
            const k = Math.min(1, a.t / a.per), e = k * k * (3 - 2 * k);
            if (a.s) {
                a.s.x = lerp(cx(a.from), cx(a.to), e);
                a.s.y = lerp(cy(a.from), cy(a.to), e) - Math.sin(Math.PI * k) * (a.jump ? 22 : 5);
                a.s.scale.set(1 + Math.sin(Math.PI * k) * (a.jump ? 0.12 : 0.04));
            }
            if (a.t < a.per) return;
            this.anim = null;
            if (a.s) { a.s.x = cx(a.to); a.s.y = cy(a.to); a.s.scale.set(1); }
            this.sprites[a.from] = null;
            this.sprites[a.to] = a.s;
            if (a.cap >= 0 && this.sprites[a.cap]) this.sprites[a.cap].opacity = 120;   // (taken: it stays dimmed until the move ends)
            se("Knock", 30, 150);
            a.then();
        }
        commit(m, side) {
            const wasKing = isKing(this.board[m.from]);
            for (const c of m.caps) {
                const s = this.sprites[c];
                if (s) this.fading.push({ s, t: 0, y: s.y });
                this.sprites[c] = null;
            }
            this.board = applyMove(this.board, m);
            this.plies++;
            this.quiet = m.caps.length || !wasKing ? 0 : this.quiet + 1;
            this.last = { from: m.from, to: m.to };
            if (m.promote) {
                const s = this.sprites[m.to];
                if (s) s.bitmap = pieceBitmap(this.board[m.to]);
                this.hint(TK.kod.hint[3], m.to, U().accent, true);
                se("Item3", 45, 110);
            }
            if (m.caps.length) se("Blow1", 40, 130);
            if (side < 0 && m.caps.length && this.rng() < 0.65) this.sayOver("bubbleR", pick(this.opp.captureLines, this.rng), 100);
            else if (side < 0 && !m.caps.length && this.rng() < 0.14) this.sayOver("bubbleR", pick(this.opp.moveLines, this.rng), 90);
            else if (side > 0 && m.caps.length && this.rng() < 0.45) this.sayOver("bubbleR", pick(this.opp.lostLines, this.rng), 100);
            this.sortPieces();
            this.sel = this.selFrom = -1; this.path = [];
            this.turn = -side;
            this.setPhase("pause");
        }
        giveUp() { this.finish("lost", true); }
        finish(kind, gaveUp) {
            const won = kind === "won", draw = kind === "draw", you = count(this.board, 1), opp = count(this.board, -1), k = TK.kod.finish;
            this.result = { game: "warcaby", won, draw, stake: draw ? 0 : this.stake, opponent: this.oppKey, rival: this.oppKey, you, opp, moves: this.plies,
                gaveUp: !!gaveUp, minutes: GAME.minutes, stamina: GAME.stamina };
            const line = draw ? this.opp.draw : won ? this.opp.lost : this.opp.won;
            this.result.line = line;
            if (won) se("Applause1", 55);
            this.cursorSpr.visible = false;
            this.bustL.dim(false);
            this.bustR.dim(false);
            this.showCard({ wait: 30, bust: oppBust(this.opp), who: this.opp.name, whoSub: "warcaby", kicker: k[0],
                title: won ? "Wygrana!" : gaveUp ? k[1] : draw ? k[2] : "Przegrana", titleColor: won ? U().accent : draw ? U().text : BAD,
                sub: Watki.wstaw(k[5], { you, opp, short: this.opp.short }) + (draw ? "   ·   " + k[6] : this.stake ? "   ·   " + (won ? "+" : "−") + this.stake + " G" : ""),
                subColor: won ? GOOD : draw ? U().text : BAD, say: line,
                lines: [[Watki.wstaw(k[3], { minutes: GAME.minutes, moves: Math.ceil(this.plies / 2) }), U().muted]], foot: k[4], h: 440 }, () => this.leave());
            this.setPhase("summary");
        }
        // ---- the pictures
        syncPieces() {
            for (const s of this.pieces.children.slice()) this.pieces.removeChild(s);
            this.sprites.fill(null);
            for (let i = 0; i < 64; i++) {
                if (!this.board[i]) continue;
                const s = new Sprite(pieceBitmap(this.board[i]));
                s.anchor.set(0.5, PCY / PH);
                s.x = cx(i); s.y = cy(i);
                this.sprites[i] = s;
                this.pieces.addChild(s);
            }
            this.sortPieces();
        }
        sortPieces() {
            const keep = new Set(this.fading.map(f => f.s));
            this.pieces.children.sort((a, b) => (keep.has(a) ? -1 : 0) - (keep.has(b) ? -1 : 0) || a.y - b.y);
        }
        // a word over the board (above its frame: it never covers the pieces); onPiece - over that piece ("Damka!")
        hint(text, sq, colour, onPiece) {
            if (!onPiece) for (const p of this.popups.filter(p => p._top)) { this.root.removeChild(p); this.popups.splice(this.popups.indexOf(p), 1); }
            const b = new Bitmap(300, 40);
            cardText(b, text, 2, 6, 300, 24, "rgba(0,0,0,0.9)", true, "center");
            cardText(b, text, 0, 4, 300, 24, colour || U().text, true, "center");
            const s = new Sprite(b);
            s.anchor.set(0.5, 1);
            s.x = onPiece ? Math.max(BX + 100, Math.min(BX + 8 * SQ - 100, cx(sq))) : BX + 4 * SQ;
            s.y = onPiece ? cy(sq) - 26 : BY - FR - 4;
            s._t = 0; s._top = !onPiece;
            this.root.addChild(s);
            this.popups.push(s);
        }
        frame() {
            const you = this.phase === "you";
            this.cursorSpr.visible = you;
            if (you) {
                this.cursorSpr.x = BX + (this.cursor & 7) * SQ - 4;
                this.cursorSpr.y = BY + (this.cursor >> 3) * SQ - 4;
                this.cursorSpr.opacity = 190 + Math.round(65 * Math.sin(this.t * 0.12));
            }
            for (let i = this.popups.length - 1; i >= 0; i--) {
                const s = this.popups[i];
                s._t++;
                if (!s._top) s.y -= 0.5;
                s.opacity = Math.round(255 * Math.min(1, (80 - s._t) / 20));
                if (s._t >= 80) { this.root.removeChild(s); this.popups.splice(i, 1); }
            }
            this.drawMarks();
            this.drawHud();
        }
        // the squares lit: the last move, the pieces that must capture, the piece picked and where it may go
        drawMarks() {
            const you = this.phase === "you", must = you && this.legal.length && this.legal[0].caps.length;
            const key = [this.phase === "anim" ? "anim" : you ? "you" : "-", this.turn, this.sel, this.path.join(","), this.last ? this.last.from + ">" + this.last.to : "", this.plies].join("|");
            if (key === this._marksKey) return;
            this._marksKey = key;
            const b = this.marks.bitmap, ctx = b.context, A = U().accent;
            b.clear();
            const sqRect = i => [(i & 7) * SQ, (i >> 3) * SQ];
            if (this.last && this.phase !== "anim") for (const i of [this.last.from, this.last.to]) { const [x, y] = sqRect(i); ctx.fillStyle = "rgba(255,210,63,0.16)"; ctx.fillRect(x, y, SQ, SQ); }
            if (you) {
                if (must && this.sel < 0) {
                    for (const f of new Set(this.legal.map(m => m.from))) {
                        const [x, y] = sqRect(f);
                        ctx.strokeStyle = "rgba(255,150,70,0.95)"; ctx.lineWidth = 3; ctx.strokeRect(x + 2.5, y + 2.5, SQ - 5, SQ - 5);
                    }
                }
                if (this.sel >= 0) {
                    const [x, y] = sqRect(this.sel);
                    ctx.fillStyle = "rgba(255,210,63,0.26)"; ctx.fillRect(x, y, SQ, SQ);
                    ctx.strokeStyle = A; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, SQ - 3, SQ - 3);
                    for (const p of [this.selFrom].concat(this.path)) if (p !== this.sel) { const [px, py] = sqRect(p); ctx.fillStyle = "rgba(255,210,63,0.12)"; ctx.fillRect(px, py, SQ, SQ); }
                    for (const t of this.targets()) {
                        const [tx, ty] = sqRect(t), mx = tx + SQ / 2, my = ty + SQ / 2;
                        ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.beginPath(); ctx.arc(mx, my + 1, 10, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = must ? "#ffb070" : A; ctx.beginPath(); ctx.arc(mx, my, 8, 0, Math.PI * 2); ctx.fill();
                    }
                }
            }
            dirty(b);
        }
        // whose move and how many pieces each has (top left); the key hints at the bottom; none over a card
        drawHud() {
            const play = this.phase !== "card" && this.phase !== "summary", H = TK.kod.hud;
            this.showHud(play, [[TK.kod.begin[8], H[4]], ["O", H[5]], ["P", H[6]]]);
            const you = count(this.board, 1), opp = count(this.board, -1), mine = this.turn === 1;
            const key = [play, mine, you, opp, this.stake].join("|");
            if (key === this._hudKey) return;
            this._hudKey = key;
            const b = this.panels.bitmap, S0 = U();
            b.clear();
            if (!play) return;
            ui.panel(b, 20, 16, 330, 118, { cut: 6 });
            cardText(b, H[0] + (this.stake ? Watki.wstaw(TK.kod.begin[2], { stake: this.stake }) : ""), 36, 22, 300, 15, S0.muted, true);
            cardText(b, mine ? H[1] : Watki.wstaw(H[2], { short: this.opp.short }), 36, 42, 300, 22, mine ? S0.accent : "#ff9f8f", true);
            b.context.imageSmoothingEnabled = true;
            const L = pieceBitmap(1), D = pieceBitmap(-1);
            b.blt(L, 0, 0, PW, PH, 34, 76, 28, 32);
            cardText(b, "Ty  " + you, 66, 80, 110, 20, S0.text, true);
            b.blt(D, 0, 0, PW, PH, 178, 76, 28, 32);
            cardText(b, this.opp.short + "  " + opp, 210, 80, 130, 20, S0.text, true);
            dirty(b);
        }
        state() {
            return Object.assign(super.state(), { phase: this.phase, turn: this.turn, board: Array.from(this.board), cursor: this.cursor, sel: this.sel, path: this.path.slice(),
                legal: this.legal.map(m => ({ from: m.from, path: m.path.slice(), caps: m.caps.slice() })), plies: this.plies, quiet: this.quiet, paused: this.paused,
                you: count(this.board, 1), opp: count(this.board, -1), think: this.lastThink || null, result: this.result || null });
        }
    }
    Scene_Warcaby.gameId = "warcaby";
    window.Scene_Warcaby = Scene_Warcaby;

    // ==================================================================
    // The talk at the table: with whom, then the stake; back on the map the coins and a word (TavernLife.js)
    // ==================================================================
    const stats = () => {
        const s = S();
        if (!s.warcaby) s.warcaby = { played: 0, won: 0, lost: 0, net: 0, draws: 0 };
        return s.warcaby;
    };
    function oppSay(out, key, text) {
        const o = OPPONENTS[key];
        if (o.role) return sayAs(out, o.role, text);
        return say(out, -1, text, o.face, o.name);
    }
    function talk() {
        const o = [], options = [], k = TK.kod.talk;
        heroSay(o, k[0]);
        [["ozzy", 1], ["wiesiek", 2], ["kupiec", 3]].forEach(([key, n]) => {
            if (atTable(key)) options.push({ label: k[n], js: "TavernLife.step(this, 'warcabyWho', " + q(key) + ")" });
        });
        options.push({ label: k[4], js: [] });
        choose(o, options);
        return o;
    }
    function stakesTalk(key) {
        const o = [], k = TK.kod.stakes;
        oppSay(o, key, Watki.wstaw(k[0], { hello: OPPONENTS[key].hello }));
        choose(o, STAKES.map(n => ({ label: Watki.wstaw(k[1], { n }), js: ["TavernLife.step(this, 'warcaby', " + n + ", " + q(key) + ")", "TavernLife.step(this, 'gameAfter')"] }))
            .concat([{ label: k[2], js: [] }]));
        return o;
    }
    lib.addKind("warcaby", () => talk());
    lib.addStep("warcabyWho", (interp, ev, arg) => run(interp, stakesTalk(OPPONENTS[arg] ? arg : "wiesiek")));
    lib.addStep("warcaby", (interp, ev, arg, arg2) => {
        const stake = Number(arg) || 0, who = OPPONENTS[arg2] ? arg2 : "wiesiek";
        if (gold() < stake) { needGold(stake); return; }
        stats();
        if (lib.startGame(Scene_Warcaby, { stake, opponent: who })) lib.setGameAfter({ game: "warcaby", stake, opponent: who });
    });
    lib.defineGame("warcaby", {
        xpWin: GAME.xpWin, xpLose: GAME.xpLose, reason: "warcaby",
        apply(st, res) {
            st.draws = st.draws || 0;
            if (res.draw) { st.lost--; st.draws++; }
        },
        note: () => ["Warcaby", Watki.wstaw(TK.kod.note[0], { "1": STAKES.join(", ") })],
        who: g => (g.opponent === "ozzy" ? npc("ozzy") : (spots("warcaby")[0] || {}).ev || null),
        after(r, g, who) {
            if (who && g.opponent === "ozzy") bark(who, r.won ? TK.kod.after[0] : TK.kod.after[1], 120);
        }
    });

    const WARCABY = { GAME, STAKES, OPPONENTS, newBoard, legalMoves, captures, steps, applyMove, chooseMove, evaluate, count, at };
    Object.assign(TL, { WARCABY, warcaby: opts => { stats(); return lib.startGame(Scene_Warcaby, opts); } });
    TL.modules.TavernLife_Warcaby = true;
})();
