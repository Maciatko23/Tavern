//=============================================================================
// TavernLife_Darts.js
//=============================================================================
// Darts at the darts line (<Tavern:darts>) with Dziadek Ozzy or the carter Wiesiek: the talk (the opponent, the stake), the mini-game on
// Tawerna.ui.Scene_MiniGame (TawernaUI.js: the rules and result cards, the pause, the key hints, the turn banner, the busts in the
// corners, seed and turbo for the tests), and the scoring. TavernLife.js settles the end on the map; the stakes are its "dartsStakes".

/*:
 * @target MZ
 * @plugindesc Rzutki z Dziadkiem Ozzym albo z furmanem Wieśkiem (część TavernLife.js): rozmowa, mini-gra z chwiejnym celownikiem, punkty. Stawki ustawiasz w TavernLife. v1.0.0
 * @author Claude
 * @base TavernLife
 * @orderAfter TavernLife
 *
 * @help
 * ============================================================================
 * TavernLife_Darts.js - rzutki
 * ============================================================================
 * Część TavernLife.js. Linia rzutu to zdarzenie z komentarzem
 * <Tavern:darts>; O przy niej: z kim grasz (Dziadek Ozzy, gdy jest w sali,
 * albo furman Wiesiek), o jaką stawkę (parametr „Rzutki: stawki”
 * w TavernLife), potem mini-gra.
 *
 * Celownik chwieje się sam - strzałki przesuwają cel, O rzuca. Trzy rundy
 * po trzy lotki na zmianę; wygrywa większa suma (remis: jeszcze po jednej
 * lotce, bliżej środka wygrywa). Środek (byk) 50, pierścień przy nim 25,
 * reszta tarczy tyle, ile liczba wycinka; poza tarczą pudło. Zręczność
 * i Czujność uspokajają rękę. P - pauza (grać dalej albo się poddać).
 *
 * KOLEJNOŚĆ: pod TavernLife.js.
 * Dla testów: TavernLife.darts({ stake, seed, turbo, opponent, onEnd }),
 * TavernLife.dartScore(dx, dy) - punkty za trafienie (dx, dy) od środka.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("TavernLife_Darts.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const TL = T.api("TavernLife");
    if (!TL || !TL.lib) throw new Error("TavernLife_Darts.js: brak TavernLife.js - musi być nad tą wtyczką na liście (TavernLife is missing)");
    const lib = TL.lib, ui = T.ui;
    const { lerp, hash, pick, U, GOOD, BAD, se, attr, gold, needGold, bark, cached, dirty, S, npc, spots, bustOf, say, sayAs, heroSay, choose, run, q } = lib;
    const DARTS_STAKES = lib.config.DARTS_STAKES;
    const DARTS = { minutes: 30, stamina: 3, xpWin: 10, xpLose: 3 };
    const W1 = 1280, H1 = 720;
    // (the old cards' text: a line 1.4 times the size)
    const cardText = (b, s, x, y, w, size, colour, bold, align) => ui.text(b, s, x, y, w, { size, color: colour || U().text, bold, align, lh: Math.round(size * 1.4) });

    // ------------------------------------------------------------------
    // DARTS: a painted board, a swaying sight (the arrows move the aim, O throws), three darts a round, three rounds against Ozzy or
    // the carter Wiesiek. Bull 50, the ring round it 25, the rest of the board the number of its wedge. Zręczność and Czujność
    // steady the hand.
    // ------------------------------------------------------------------
    const DB = { cx: 540, cy: 356, rs: 176, bull: 12, outer: 28, frame: 212 };
    const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    function dartScore(dx, dy) {
        const r = Math.hypot(dx, dy);
        if (r <= DB.bull) return 50;
        if (r <= DB.outer) return 25;
        if (r > DB.rs) return 0;
        const deg = ((Math.atan2(dx, -dy) * 180 / Math.PI) + 360 + 9) % 360;
        return ORDER[Math.floor(deg / 18) % 20];
    }
    // (2026-10-06) Wiesiek's bust: RTP People2_7 (a weathered carter with road goggles on his brow) - unused anywhere else since the
    // arm-wrestling's carter got Woznica_Bust; People1_5 was the Sołtys bust's face
    const OPPONENTS = {
        ozzy: { name: "Dziadek Ozzy", short: "Ozzy", role: "ozzy", sway: 50, scatter: 15, lucky: 0.16, aim: "bull",
            hello: "*czkawka* Rzutki? Kiedyś trafiałem muchę w locie. Dziś trafiam tarczę. Zazwyczaj.",
            throwLines: ["Hop!", "*czkawka*", "Ups...", "Celuję w środkową z trzech tarcz..."], good: ["Byk! Widziałeś? Nikt nie widział...", "Hehe, stara ręka!"],
            won: "Hehe! Stary Ozzy jeszcze umie! Postawisz mi piwo z tej stawki? Nie? No trudno.", lost: "Trzy tarcze to jednak za dużo dla jednego oka... Wygrałeś, synu. Uczciwie." },
        wiesiek: { name: "Furman Wiesiek", short: "Wiesiek", role: null, bust: "People2_7", face: ["People2", 6], sway: 38, scatter: 10, lucky: 0.05, aim: "twenty",
            hello: "Rzucamy? Ja furman: oko mam jak jastrząb - od patrzenia na drogę między końskimi uszami.",
            throwLines: ["Rzut furmański!", "Prosto jak droga do młyna.", "Wiooo!"], good: ["Dwadzieścia! Wiedziałem.", "I kto tu jest jastrząb?"],
            won: "Ha! Nie ma to jak oko furmana. Stawka moja - dziękuję uprzejmie.", lost: "Eee, wiatr zawiał od drzwi. Ale wygrałeś, nie ma co gadać." }
    };
    function dartBoardBitmap() {
        return cached("dartBoard", () => {
            const size = 460, c = size / 2, b = new Bitmap(size, size), ctx = b.context, S0 = U();
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.beginPath(); ctx.arc(c + 8, c + 12, DB.frame + 6, 0, Math.PI * 2); ctx.fill();   // its shadow on the wall
            const wood = ctx.createRadialGradient(c - 40, c - 50, 20, c, c, DB.frame);
            wood.addColorStop(0, "#7a5230"); wood.addColorStop(1, "#4a2e18");
            ctx.fillStyle = wood; ctx.beginPath(); ctx.arc(c, c, DB.frame, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "#2a190c"; ctx.lineWidth = 3; ctx.stroke();
            for (let i = 0; i < 40; i++) {   // the grain of the wooden rim
                const a = hash(i, 21) * Math.PI * 2, r = DB.rs + 6 + hash(i, 22) * (DB.frame - DB.rs - 10);
                ctx.strokeStyle = "rgba(30,18,8,0.35)"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(c, c, r, a, a + 0.3 + hash(i, 23) * 0.5); ctx.stroke();
            }
            // the wedges
            for (let i = 0; i < 20; i++) {
                const a0 = (i * 18 - 9 - 90) * Math.PI / 180, a1 = a0 + 18 * Math.PI / 180;
                ctx.fillStyle = i % 2 ? "#e6d9ba" : "#221d19";
                ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, DB.rs, a0, a1); ctx.closePath(); ctx.fill();
            }
            // the sisal: fine speckles
            for (let i = 0; i < 1400; i++) {
                const a = hash(i, 31) * Math.PI * 2, r = Math.sqrt(hash(i, 32)) * DB.rs;
                ctx.fillStyle = "rgba(" + (hash(i, 33) < 0.5 ? "0,0,0,0.14" : "255,255,255,0.08") + ")";
                ctx.fillRect(Math.round(c + Math.cos(a) * r), Math.round(c + Math.sin(a) * r), 1, 1);
            }
            // the bull
            ctx.fillStyle = "#2f7d3c"; ctx.beginPath(); ctx.arc(c, c, DB.outer, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#b8252c"; ctx.beginPath(); ctx.arc(c, c, DB.bull, 0, Math.PI * 2); ctx.fill();
            // the wires
            ctx.strokeStyle = "rgba(200,200,205,0.75)"; ctx.lineWidth = 1;
            for (let i = 0; i < 20; i++) {
                const a = (i * 18 - 9 - 90) * Math.PI / 180;
                ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * DB.outer, c + Math.sin(a) * DB.outer); ctx.lineTo(c + Math.cos(a) * DB.rs, c + Math.sin(a) * DB.rs); ctx.stroke();
            }
            for (const r of [DB.bull, DB.outer, DB.rs]) { ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke(); }
            // a thin painted ring and the numbers on the rim
            ctx.strokeStyle = "#b8923a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c, c, DB.rs + 3, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
            for (let i = 0; i < 20; i++) {
                const a = (i * 18 - 90) * Math.PI / 180, r = (DB.rs + DB.frame) / 2 + 1;
                cardText(b, String(ORDER[i]), Math.round(c + Math.cos(a) * r) - 20, Math.round(c + Math.sin(a) * r) - 13, 40, 19, "#f3e3bb", true, "center");
            }
            dirty(b);
            void S0;
            return b;
        });
    }
    function dartWallBitmap() {
        return cached("dartWall", () => {
            const b = new Bitmap(W1, H1), ctx = b.context;
            for (let i = 0; i < 12; i++) {   // the planks
                const x = i * 112;
                ctx.fillStyle = i % 2 ? "#3b2818" : "#412c1a"; ctx.fillRect(x, 0, 112, H1);
                ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(x, 0, 2, H1);
                for (let k = 0; k < 7; k++) { ctx.fillStyle = "rgba(20,12,6,0.25)"; ctx.fillRect(x + 10 + hash(i, k) * 90, hash(k, i) * H1, 2, 40 + hash(i + k, 3) * 120); }
            }
            const g = ctx.createRadialGradient(DB.cx, DB.cy - 60, 60, DB.cx, DB.cy, 900);   // the lamp above the board
            g.addColorStop(0, "rgba(255,200,120,0.22)"); g.addColorStop(0.5, "rgba(0,0,0,0.25)"); g.addColorStop(1, "rgba(0,0,0,0.75)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, W1, H1);
            dirty(b);
            return b;
        });
    }
    function dartBitmap(colour) {
        return cached("dart" + colour, () => {
            const b = new Bitmap(16, 64), ctx = b.context;   // pointing up: the tip at the top (8, 0)
            ctx.fillStyle = "#c9ccd2"; ctx.fillRect(7, 0, 2, 12);                       // the steel tip
            ctx.fillStyle = "#7a5a2c"; ctx.fillRect(6, 12, 4, 16); ctx.fillStyle = "#d4a83a"; ctx.fillRect(6, 13, 1, 14);   // the brass barrel
            ctx.fillStyle = "#3a2a1a"; ctx.fillRect(7, 28, 2, 14);                     // the shaft
            ctx.fillStyle = colour; ctx.beginPath(); ctx.moveTo(8, 38); ctx.lineTo(1, 60); ctx.lineTo(8, 55); ctx.lineTo(15, 60); ctx.closePath(); ctx.fill();   // the flights
            ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 1; ctx.stroke();
            dirty(b);
            return b;
        });
    }
    function sightBitmap(colour) {
        return cached("sight" + colour, () => {
            const b = new Bitmap(48, 48), ctx = b.context;
            ctx.strokeStyle = "rgba(0,0,0,0.75)"; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(24, 24, 12, 0, Math.PI * 2); ctx.stroke();
            for (const [x0, y0, x1, y1] of [[24, 2, 24, 14], [24, 34, 24, 46], [2, 24, 14, 24], [34, 24, 46, 24]]) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
            ctx.strokeStyle = colour; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(24, 24, 12, 0, Math.PI * 2); ctx.stroke();
            for (const [x0, y0, x1, y1] of [[24, 2, 24, 14], [24, 34, 24, 46], [2, 24, 14, 24], [34, 24, 46, 24]]) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
            ctx.fillStyle = colour; ctx.fillRect(23, 23, 2, 2);
            dirty(b);
            return b;
        });
    }

    class Scene_Darts extends lib.gameScene() {
        // the wall with the board's lamp behind (no blurred tavern here)
        createBackground() {
            this.back = new Sprite(dartWallBitmap());
            this.addChild(this.back);
        }
        createGame() {
            this.opp = OPPONENTS[this.opts.opponent] || OPPONENTS.ozzy;
            this.dex = attr("dex"); this.per = attr("per");
            this.amp = Math.max(16, 58 * (1 - 0.011 * (this.dex - 5)) * (1 - 0.005 * (this.per - 5)));
            this.first = !S().firsts.darts;
            this.board = new Sprite(dartBoardBitmap());
            this.board.anchor.set(0.5, 0.5);
            this.board.x = DB.cx; this.board.y = DB.cy;
            this.root.addChild(this.board);
            this.stuck = new Sprite();   // the darts in the board
            this.root.addChild(this.stuck);
            this.sight = new Sprite(sightBitmap("#ffd23f"));
            this.sight.anchor.set(0.5, 0.5);
            this.sight.visible = false;
            this.root.addChild(this.sight);
            this.flyer = new Sprite(dartBitmap("#d8b43a"));
            this.flyer.anchor.set(0.5, 0);
            this.flyer.visible = false;
            this.root.addChild(this.flyer);
            this.slate = new Sprite(new Bitmap(360, 470));
            this.slate.x = 880; this.slate.y = 110;
            this.root.addChild(this.slate);
            // the two of them in the bottom corners (the UI kit's busts): the one not throwing is dimmed
            this.oppBust = this.opp.role ? bustOf(this.opp.role) : this.opp.bust;
            this.pic(ui.heroBust());
            this.pic(this.oppBust);
            this.showBusts(ui.heroBust(), this.oppBust);
            this.bubbleL.move(270, 610);
            this.bubbleR.move(1010, 610);
            this.fx.removeChild(this.banner);   // (the turn's banner across the board only, the slate beside it stays clear)
            this.banner = new ui.Banner(DB.cx, DB.cy, 600);
            this.banner.ticked = true;           // (it lives the "banner" phase's 70 logic steps, turbo or not)
            this.fx.addChild(this.banner);
            this.popups = [];
            this.scores = { you: [[], [], []], opp: [[], [], []] };
            this.round = 0; this.turn = "you"; this.dartNo = 0; this.bulls = 0;
            this.aim = { x: DB.cx, y: DB.cy }; this.cross = { x: DB.cx, y: DB.cy };
            this.ph = [this.rng() * 6, this.rng() * 6, this.rng() * 6, this.rng() * 6];
        }
        begin() {
            this.showCard({ wait: 16, bust: this.opp.role ? bustOf(this.opp.role) : this.opp.bust, who: this.opp.name, whoSub: this.opp.role ? "stały bywalec" : "gość karczmy",
                kicker: "RZUTKI" + (this.stake ? " · STAWKA " + this.stake + " G" : ""), title: "Rzutki z " + (this.opp.role ? "Ozzym" : "Wieśkiem"), say: this.opp.hello,
                lines: this.first ? ["Celownik chwieje się sam - strzałkami przesuwasz cel, O rzuca lotkę.", "Środek (byk) 50, zielony pierścień 25, reszta tarczy tyle, ile liczba wycinka. Poza tarczą: pudło.",
                    "Trzy rundy po trzy lotki na zmianę; wygrywa większa suma. Zręczność i Czujność uspokajają rękę."]
                    : ["Strzałki - cel, O - rzut. Trzy rundy po trzy lotki."],
                keys: [["strzałki", "cel"], ["O", "rzut"], ["P", "pauza"]], foot: "O - do tarczy" }, () => this.nextTurn());
            this.setPhase("card");
        }
        tick() {
            switch (this.phase) {
                case "banner": if (this.phaseT >= 70) this.setPhase(this.turn === "you" ? "aim" : "oppAim"); break;
                case "aim":
                    this.moveAim();
                    if (this.trig.ok && this.phaseT > 10) this.throwDart("you");
                    break;
                case "oppAim": this.oppAim(); break;
                case "flight": this.flight(); break;
                case "stuck": if (this.phaseT >= 34) this.afterDart(); break;
                case "pull": if (this.phaseT >= 40) { this.clearDarts(); this.nextTurn(); } break;
            }
            this.swayTick();
            this.banner.tick();
        }
        canPause() { return this.phase === "aim"; }
        helpLines() {
            return ["Celownik chwieje się sam - strzałki przesuwają cel, O rzuca lotkę.",
                "Środek (byk) 50, zielony pierścień 25, reszta tarczy tyle, ile liczba wycinka. Trzy rundy po trzy lotki; wygrywa większa suma."];
        }
        swayTick() {
            const t = this.t, a = this.phase === "oppAim" ? this.opp.sway : this.amp, p = this.ph;
            this.cross.x = this.aim.x + a * (0.72 * Math.sin(t * 0.031 + p[0]) + 0.33 * Math.sin(t * 0.077 + p[1]));
            this.cross.y = this.aim.y + a * (0.72 * Math.sin(t * 0.043 + p[2]) + 0.3 * Math.sin(t * 0.091 + p[3]));
        }
        moveAim() {
            const k = this.keys, sp = 3.2;
            if (k.left) this.aim.x -= sp; if (k.right) this.aim.x += sp;
            if (k.up) this.aim.y -= sp; if (k.down) this.aim.y += sp;
            const dx = this.aim.x - DB.cx, dy = this.aim.y - DB.cy, r = Math.hypot(dx, dy), max = DB.frame + 30;
            if (r > max) { this.aim.x = DB.cx + dx / r * max; this.aim.y = DB.cy + dy / r * max; }
        }
        gauss() { const u = Math.max(1e-6, this.rng()), v = this.rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
        nextTurn() {
            if (this.turn === "opp" || this.round === 0) {
                if (this.round >= 3) return this.decide();
                this.round++;
                this.turn = "you";
            } else this.turn = "opp";
            this.dartNo = 0;
            this.aim = { x: DB.cx, y: DB.cy };
            if (this.turn === "opp") {
                const target = this.opp.aim === "twenty" && this.rng() < 0.6 ? { x: DB.cx, y: DB.cy - DB.rs * 0.7 } : { x: DB.cx, y: DB.cy };
                this.oppTarget = target;
                this.aim = { x: DB.cx + (this.rng() - 0.5) * 120, y: DB.cy + (this.rng() - 0.5) * 120 };
            }
            this.bannerText = this.turn === "you" ? "Runda " + this.round + " z 3 · twój rzut" : "Runda " + this.round + " z 3 · rzuca " + this.opp.short;
            this.showTurn();
            this.setPhase("banner");
        }
        // the turn's banner over the board (the UI kit's, in the thrower's colour); the bust of the one not throwing dimmed
        showTurn() {
            const B = ui.BANNERS.turn, was = B.text;
            B.text = this.turn === "you" ? U().accent : "#ff9f8f";
            this.banner.show("turn", this.bannerText, null, 70);
            B.text = was;
            this.bustL.dim(this.turn !== "you");
            this.bustR.dim(this.turn === "you");
        }
        oppAim() {
            if (this.phaseT === 1) { this.oppWait = 50 + Math.floor(this.rng() * 60); if (this.rng() < 0.45) this.sayOver("bubbleR", pick(this.opp.throwLines, this.rng), 70); }
            const t = this.oppTarget;
            this.aim.x += (t.x - this.aim.x) * 0.06;
            this.aim.y += (t.y - this.aim.y) * 0.06;
            if (this.phaseT >= this.oppWait) this.throwDart("opp");
        }
        throwDart(who) {
            let x = this.cross.x, y = this.cross.y;
            if (who === "you") { const s = 3 + this.amp * 0.07; x += this.gauss() * s; y += this.gauss() * s; }
            else if (this.rng() < this.opp.lucky) { x = DB.cx + this.gauss() * 7; y = DB.cy + this.gauss() * 7; }
            else { x += this.gauss() * this.opp.scatter; y += this.gauss() * this.opp.scatter; }
            this.shot = { who, x, y, from: { x: lerp(DB.cx, x, 0.3) + (who === "you" ? -120 : 140), y: H1 + 60 }, t: 0, life: 24 };
            this.flyer.bitmap = dartBitmap(who === "you" ? "#d8b43a" : "#b8303a");
            this.flyer.visible = true;
            se("Wind1", 45, 150);
            this.setPhase("flight");
        }
        flight() {
            const s = this.shot, k = ++s.t / s.life;
            const x = lerp(s.from.x, s.x, k), y = lerp(s.from.y, s.y, k) - Math.sin(Math.PI * k) * 150;
            const nx = lerp(s.from.x, s.x, k + 0.05), ny = lerp(s.from.y, s.y, k + 0.05) - Math.sin(Math.PI * Math.min(1, k + 0.05)) * 150;
            this.flyer.x = x; this.flyer.y = y;
            this.flyer.rotation = Math.atan2(nx - x, -(ny - y)) * 0.6;
            this.flyer.scale.set(lerp(2.2, 1, k));
            if (s.t >= s.life) this.land();
        }
        land() {
            const s = this.shot, score = dartScore(s.x - DB.cx, s.y - DB.cy), onBoard = Math.hypot(s.x - DB.cx, s.y - DB.cy) <= DB.frame;
            this.flyer.visible = false;
            const d = new Sprite(dartBitmap(s.who === "you" ? "#d8b43a" : "#b8303a"));
            d.anchor.set(0.5, 0.04);
            d.x = s.x; d.y = s.y;
            d.scale.set(0.9, 0.5);   // (seen nearly from behind: short)
            d.rotation = -0.5 + (s.x - DB.cx) / 700;
            d._wob = onBoard ? 1 : 0; d._t = 0; d._rot = d.rotation;
            if (!onBoard) d.opacity = 0;
            this.stuck.addChild(d);
            (s.who === "you" ? this.scores.you : this.scores.opp)[this.round - 1].push(score);
            if (s.who === "you" && score === 50) this.bulls++;
            se(onBoard ? "Blow1" : "Miss", onBoard ? 70 : 60, onBoard ? 150 : 100);
            if (score >= 25) se("Chime2", 40, score === 50 ? 120 : 100);
            this.board.x = DB.cx + (onBoard ? 2 : 0);
            this.popup(score === 50 ? "BYK! 50" : score === 25 ? "25" : score > 0 ? "+" + score : onBoard ? "W ramę!" : "Pudło!", s.x, s.y, score >= 25 ? U().accent : score > 0 ? "#eceef0" : BAD);
            if (s.who === "opp" && score >= 25 && this.rng() < 0.7) this.sayOver("bubbleR", pick(this.opp.good, this.rng), 80);
            this.setPhase("stuck");
        }
        afterDart() {
            this.board.x = DB.cx;
            this.dartNo++;
            if (this.dartNo < 3) { this.setPhase(this.turn === "you" ? "aim" : "oppAim"); if (this.turn === "opp") this.aim = { x: this.aim.x + (this.rng() - 0.5) * 60, y: this.aim.y + (this.rng() - 0.5) * 60 }; }
            else this.setPhase("pull");
        }
        clearDarts() {
            for (const d of this.stuck.children.slice()) this.stuck.removeChild(d);
            se("Equip2", 40, 120);
        }
        sum(who) { return this.scores[who].reduce((a, r) => a + r.reduce((x, y) => x + y, 0), 0); }
        decide() {
            const you = this.sum("you"), opp = this.sum("opp");
            if (you === opp && !this.extra) {   // a tie: one more dart each, the nearer to the bull wins
                this.extra = true;
                const dYou = Math.hypot(this.gauss() * (4 + this.amp * 0.4), this.gauss() * (4 + this.amp * 0.4)), dOpp = Math.hypot(this.gauss() * this.opp.scatter * 1.6, this.gauss() * this.opp.scatter * 1.6);
                this.tieBreak = dYou <= dOpp ? "you" : "opp";
            }
            this.finish(false);
        }
        giveUp() { this.finish(true); }
        finish(gaveUp) {
            const you = this.sum("you"), opp = this.sum("opp");
            const won = !gaveUp && (you > opp || (you === opp && this.tieBreak === "you"));
            this.result = { game: "darts", won, stake: this.stake, score: you, opp: opp, opponent: this.opp.role || "wiesiek", bulls: this.bulls, gaveUp: !!gaveUp,
                tie: you === opp, minutes: DARTS.minutes, stamina: DARTS.stamina, rounds: this.scores };
            const line = won ? this.opp.lost : this.opp.won;
            this.result.line = line;
            if (won) se("Applause1", 55);
            this.sight.visible = false;
            this.bustL.dim(false);
            this.bustR.dim(false);
            this.showCard({ wait: 30, bust: this.opp.role ? bustOf(this.opp.role) : this.opp.bust, who: this.opp.name, whoSub: "rzutki", kicker: "RZUTKI · KONIEC",
                title: won ? "Wygrana!" : gaveUp ? "Poddałeś się" : "Przegrana", titleColor: won ? U().accent : BAD,
                sub: "Ty " + you + " : " + opp + " " + this.opp.short + (you === opp && !gaveUp ? " (dogrywka: " + (won ? "twoja lotka bliżej środka" : "jego lotka bliżej środka") + ")" : "") + (this.stake ? "   ·   " + (won ? "+" : "−") + this.stake + " G" : ""),
                subColor: won ? GOOD : BAD, say: line,
                lines: [["Czas: " + DARTS.minutes + " minut gry" + (this.bulls ? "   ·   byki: " + this.bulls : ""), U().muted]], foot: "O - wracam do sali", h: 440 }, () => this.leave());
            this.setPhase("summary");
        }
        popup(text, x, y, colour) {
            const b = new Bitmap(220, 44);
            cardText(b, text, 2, 6, 220, 28, "rgba(0,0,0,0.85)", true, "center");   // (a shadow: it reads on the board)
            cardText(b, text, 0, 4, 220, 28, colour, true, "center");
            const s = new Sprite(b);
            s.anchor.set(0.5, 1);
            s.x = x; s.y = y - 12;
            s._t = 0;
            this.root.addChild(s);
            this.popups.push(s);
        }
        frame() {
            this.sight.visible = this.phase === "aim" || this.phase === "oppAim";
            if (this.sight.visible) {
                this.sight.bitmap = sightBitmap(this.phase === "aim" ? "#ffd23f" : "#ff6a5a");
                this.sight.x = this.cross.x; this.sight.y = this.cross.y;
            }
            for (const d of this.stuck.children) {   // a dart just in the board wobbles a moment
                if (!d._wob) continue;
                d._t++;
                d.rotation = d._rot + Math.sin(d._t * 0.9) * 0.22 * Math.exp(-d._t / 9);
                if (d._t > 40) d._wob = 0;
            }
            for (let i = this.popups.length - 1; i >= 0; i--) {
                const s = this.popups[i];
                s._t++;
                s.y -= 0.7;
                s.opacity = Math.round(255 * Math.min(1, (70 - s._t) / 20));
                if (s._t >= 70) { this.root.removeChild(s); this.popups.splice(i, 1); }
            }
            this.drawSlate();
            this.drawHud();
        }
        drawSlate() {
            const key = JSON.stringify(this.scores) + this.round + this.turn + this.phase;
            if (key === this._slateKey) return;
            this._slateKey = key;
            const b = this.slate.bitmap, ctx = b.context, S0 = U();
            b.clear();
            ctx.fillStyle = "#5a3a1e"; ctx.fillRect(0, 0, 360, 330);
            ctx.fillStyle = "#1f2623"; ctx.fillRect(10, 10, 340, 310);
            ctx.fillStyle = "rgba(255,255,255,0.03)"; for (let i = 0; i < 30; i++) ctx.fillRect(10 + hash(i, 41) * 320, 10 + hash(i, 42) * 290, 20 + hash(i, 43) * 60, 1);
            const chalk = "rgba(236,236,228,0.92)", dim = "rgba(236,236,228,0.45)";
            cardText(b, "TY", 130, 22, 100, 22, chalk, true, "center");
            cardText(b, this.opp.short.toUpperCase(), 240, 22, 100, 22, chalk, true, "center");
            ctx.fillStyle = dim; ctx.fillRect(24, 56, 312, 1); ctx.fillRect(126, 24, 1, 270); ctx.fillRect(236, 24, 1, 270);
            for (let r = 0; r < 3; r++) {
                const y = 70 + r * 66, cur = this.round === r + 1;
                cardText(b, "Runda " + (r + 1), 24, y + 10, 100, 19, cur ? S0.accent : chalk, cur);
                for (const [who, x] of [["you", 130], ["opp", 240]]) {
                    const list = this.scores[who][r], sum = list.reduce((a, v) => a + v, 0);
                    cardText(b, list.length ? String(sum) : "-", x, y, 100, 26, chalk, true, "center");
                    cardText(b, list.map(v => v || "0").join(" · "), x, y + 30, 100, 15, dim, false, "center");
                }
            }
            ctx.fillStyle = chalk; ctx.fillRect(24, 272, 312, 2);
            cardText(b, "Razem", 24, 282, 100, 20, chalk, true);
            cardText(b, String(this.sum("you")), 130, 278, 100, 28, S0.accent, true, "center");
            cardText(b, String(this.sum("opp")), 240, 278, 100, 28, "#ff9f8f", true, "center");
            dirty(b);
        }
        // the round, whose throw and the darts left at the top (the key hints are the UI kit's, at the bottom), none over a card
        drawHud() {
            const play = this.phase !== "card" && this.phase !== "summary";
            this.showHud(play, [["strzałki", "cel"], ["O", "rzut"], ["P", "pauza"]]);
            const key = [this.phase, this.round, this.turn, this.dartNo, this.bannerText].join("|");
            if (key === this._hudKey) return;
            this._hudKey = key;
            const b = this.panels.bitmap, S0 = U();
            b.clear();
            if (!play) return;
            ui.panel(b, 20, 16, 420, 70, { cut: 6 });
            cardText(b, "RZUTKI" + (this.stake ? "  ·  STAWKA " + this.stake + " G" : ""), 36, 22, 380, 15, S0.muted, true);
            cardText(b, (this.turn === "you" ? "Twój rzut" : "Rzuca " + this.opp.short) + "  ·  runda " + this.round + " z 3", 36, 42, 380, 22, this.turn === "you" ? S0.accent : "#ff9f8f", true);
            // the darts left
            for (let i = 0; i < 3; i++) {
                const left = i >= this.dartNo || this.phase === "banner";
                b.context.globalAlpha = left ? 1 : 0.25;
                b.blt(dartBitmap(this.turn === "you" ? "#d8b43a" : "#b8303a"), 0, 0, 16, 64, 30 + i * 26, 100, 16, 64);
                b.context.globalAlpha = 1;
            }
            dirty(b);
        }
        state() {
            return Object.assign(super.state(), { phase: this.phase, round: this.round, turn: this.turn, dart: this.dartNo, aim: Object.assign({}, this.aim), cross: Object.assign({}, this.cross),
                you: this.sum("you"), opp: this.sum("opp"), amp: this.amp, paused: this.paused, result: this.result || null, centre: { x: DB.cx, y: DB.cy } });
        }
    }
    Scene_Darts.gameId = "darts";
    window.Scene_Darts = Scene_Darts;

    // ------------------------------------------------------------------
    // The talks at the darts line: with whom, then the stake; back on the map the coins and a word from Ozzy (TavernLife.js)
    // ------------------------------------------------------------------
    function oppSay(out, key, text) {
        const o = OPPONENTS[key];
        if (o.role) return sayAs(out, o.role, text);
        return say(out, -1, text, o.face || ["People2", 6], o.name);
    }
    function dartsTalk() {
        const o = [], ozzy = !!npc("ozzy"), options = [];
        heroSay(o, "Rzutki... Z kim by tu zagrać?");
        if (ozzy) options.push({ label: "Z Dziadkiem Ozzym", js: "TavernLife.step(this, 'dartsWho', 'ozzy')" });
        options.push({ label: "Z furmanem Wieśkiem", js: "TavernLife.step(this, 'dartsWho', 'wiesiek')" });
        options.push({ label: "Nie teraz", js: [] });
        choose(o, options);
        return o;
    }
    function dartsStakes(key) {
        const o = [];
        oppSay(o, key, OPPONENTS[key].hello + " Ile stawiasz?");
        choose(o, DARTS_STAKES.map(n => ({ label: "Stawka " + n + " G", js: ["TavernLife.step(this, 'darts', " + n + ", " + q(key) + ")", "TavernLife.step(this, 'gameAfter')"] }))
            .concat([{ label: "Nie teraz", js: [] }]));
        return o;
    }
    lib.addKind("darts", () => dartsTalk());
    lib.addStep("dartsWho", (interp, ev, arg) => run(interp, dartsStakes(OPPONENTS[arg] ? arg : "wiesiek")));
    lib.addStep("darts", (interp, ev, arg, arg2) => {
        const stake = Number(arg) || 0, who = OPPONENTS[arg2] ? arg2 : "wiesiek";
        if (gold() < stake) { needGold(stake); return; }
        if (lib.startGame(Scene_Darts, { stake, opponent: who })) lib.setGameAfter({ game: "darts", stake, opponent: who });
    });
    lib.defineGame("darts", {
        xpWin: DARTS.xpWin, xpLose: DARTS.xpLose, reason: "rzutki",
        apply(st, res) {
            st.best = Math.max(st.best || 0, res.score || 0);
            st.bulls = (st.bulls || 0) + (res.bulls || 0);
        },
        note: () => ["Rzutki", "Przy tarczy w karczmie gra się w rzutki o stawkę (" + DARTS_STAKES.join(", ") + " G): trzy rundy po trzy lotki, strzałki przesuwają cel, O rzuca. Środek (byk) 50, pierścień przy nim 25, reszta tarczy tyle, ile liczba wycinka. Zręczność i Czujność uspokajają rękę."],
        who: g => (g.opponent === "ozzy" ? npc("ozzy") : spots("darts")[0] ? spots("darts")[0].ev : null),
        after(r, g, who) {
            if (who && g.opponent === "ozzy") bark(who, r.won ? "Trzy tarcze to jednak za dużo..." : "Hehe! Stary Ozzy jeszcze umie!", 120);
        }
    });

    Object.assign(TL, { DARTS, DB, OPPONENTS, dartScore, darts: opts => lib.startGame(Scene_Darts, opts) });
    TL.modules.TavernLife_Darts = true;
})();
