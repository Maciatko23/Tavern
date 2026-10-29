//=============================================================================
// Prologue.js
//=============================================================================
// The prologue "Ostatni prom" (the user's, approved 2026-10-12; docs/prolog/SCENOPIS.md): after "Nowa gra" on the title screen the
// player names the hero (Scene_HeroName: Polish letters, typed on the keyboard or picked from a grid), then watches a short film
// (Scene_Prologue: painted boards brought to life - fire, ash, rain, lightning, mist, a rocking deck - with the game's talk bubbles
// and busts): the chronicle, the burning village on the mainland and the mother, the port and the smuggler, the storm, the beach
// at dawn. Then the game begins as before in grandpa's house (Map019), where Story.js's new intro talk picks the story up.
// Only a NEW game from the title runs it: a loaded save, the tests' t.newGame (they skip the title) and old saves never see it.
// Skipping: O / Enter / a click - the next line; a short P / Esc / right click - the next scene; P held ~1.2 s - the whole film.
// The boards: img/pictures/Prolog_*.png (tools/prolog/plansze.py, PixelLab art in tools/prolog/art/); the mother's bust
// img/pictures/Matka_Bust.png (tools/busts/make_matka.py). For tests: Prologue.info(), Prologue.speed(n), Prologue.log.
// 2026-10-14: the Watch's banners (village, port) are layers of their own waving on a PIXI mesh (FLAGS), and the boy on the
// beach is a sheet of frames (BOY) - he stirs, gets up, staggers up the beach and falls in a puff of sand.

/*:
 * @target MZ
 * @plugindesc Prolog „Ostatni prom”: ekran imienia (polskie litery) i film przed pierwszym dniem (wieś, matka, port, sztorm, plaża). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter TitleScreen
 * @orderAfter Story
 *
 * @param enabled
 * @text Prolog włączony
 * @type boolean
 * @on Tak
 * @off Nie
 * @default true
 * @desc Nie = „Nowa gra” zaczyna od razu w domu dziadka, jak dawniej (bez ekranu imienia).
 *
 * @help
 * ============================================================================
 * Prologue.js - prolog „Ostatni prom”
 * ============================================================================
 * KOLEJNOŚĆ: pod TitleScreen.js i Story.js.
 * „Nowa gra” -> ekran „Jak masz na imię?” -> film (6 scen) -> dom dziadka.
 * Ekran imienia: pisanie z klawiatury (także ą ć ę ł ń ó ś ź ż) albo litery
 * na ekranie: W/S/A/D lub strzałki, O wpisz, P cofnij literę (przy pustym
 * polu: powrót do tytułu), Enter gotowe, mysz. Puste pole = „Reid”.
 * Film: O / Enter / klik - następna kwestia; krótko P / Esc - następna
 * scena; przytrzymaj P - pomiń cały prolog.
 * Plansze: img/pictures/Prolog_*.png, popiersie matki Matka_Bust.png,
 * bohater przed sztormem (całe ubranie) Hero_Bust_Lad.png.
 * Skrypt: Prologue.info() (stan), Prologue.speed(n) (testy: n kroków na
 * klatkę), Prologue.log (sceny po kolei).
 * Powtórka w trakcie gry (menu F9, zakładka „Wyspa i fabuła”): Prologue.replay()
 * - sam film, bez ekranu imienia; po nim powrót na mapę tam, gdzie się było
 * (stan gry bez zmian, muzyka mapy wraca).
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "Prologue";
    const T = window.Tawerna;
    const params = PluginManager.parameters(PLUGIN);
    const ON = params.enabled !== "false";
    const HOLD = 72;                     // frames P is held to skip the whole film
    const W = 1280, H = 720, BAR = 56;
    const HERO_BUST_LAD = "Hero_Bust_Lad";   // (the hero before the storm: whole clothes - tools/busts/make_hero_lad.py)
    // (the accent - the frames' corners, the chosen button, the name plates - is the game's one: UITheme.js's palette; the film's panels
    // stay their own darker graphite - Kruk.js and Orzel.js cover the name screen's title with that colour)
    const UIS = (window.UIStyle && window.UIStyle.C) || { accent: "#ffd23f", onAccent: "#100e06" };
    const C = { text: "#ece6da", muted: "#b8b0a2", dim: "#8a8478", accent: UIS.accent, onAccent: UIS.onAccent, plate: UIS.accent, panel: "rgba(22,23,26,0.92)",
        line: "rgba(64,66,72,1)", cell: "rgba(30,32,36,1)", cellOn: "rgba(48,50,56,1)" };
    const api = { log: [], speedK: 1, info: () => null, speed(n) { api.speedK = Math.max(1, Math.floor(n) || 1); return api.speedK; } };
    window.Prologue = T && T.register ? T.register(PLUGIN, api) : api;
    if (!ON) return;

    // ------------------------------------------------------------------
    // Fonts (fonts/, OFL): EB Garamond for the chronicle and captions, Alegreya Sans Bold for name plates (FontFace, no FontManager)
    // ------------------------------------------------------------------
    const FACES = { serif: ["TwProSerif", "EBGaramond-Variable.ttf", { weight: "400 800" }], bold: ["TwProBold", "AlegreyaSans-Bold.ttf", {}] };
    const faceState = {};
    for (const k in FACES) {
        faceState[k] = "loading";
        try {
            const f = new FontFace(FACES[k][0], "url(fonts/" + FACES[k][1] + ")", FACES[k][2]);
            f.load().then(() => { document.fonts.add(f); faceState[k] = "ok"; }, () => { faceState[k] = "error"; });
        } catch (e) { faceState[k] = "error"; }
    }
    const mainFace = () => (window.$gameSystem && $gameSystem.mainFontFace ? $gameSystem.mainFontFace() : "rmmz-mainfont");
    const face = kind => (kind && faceState[kind] === "ok" ? '"' + FACES[kind][0] + '", ' : "") + mainFace();
    const font = (size, kind, weight) => (weight ? weight + " " : "") + size + "px " + face(kind);
    const heroName = () => (window.$gameActors && $gameActors.actor(1) ? $gameActors.actor(1).name() : "Reid");
    const names = s => String(s).replace(/\\N\[(\d+)\]/gi, (m, n) => ($gameActors && $gameActors.actor(Number(n)) ? $gameActors.actor(Number(n)).name() : ""));
    const ease = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
    const rnd = (a, b) => a + Math.random() * (b - a);

    function rr(ctx, x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
        else ctx.rect(x, y, w, h);
    }
    function wrapText(ctx, text, maxW) {
        const out = [];
        for (const para of String(text).split("\n")) {
            let line = "";
            for (const word of para.split(" ")) {
                const t = line ? line + " " + word : word;
                if (line && ctx.measureText(t).width > maxW) { out.push(line); line = word; } else line = t;
            }
            out.push(line);
        }
        return out;
    }
    // a soft round light (ADD)
    const glowPics = {};
    function glowPic(color) {
        if (glowPics[color]) return glowPics[color];
        const b = new Bitmap(128, 128), ctx = b.context, g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, color.replace("A", "0.9")); g.addColorStop(0.4, color.replace("A", "0.35")); g.addColorStop(1, color.replace("A", "0"));
        ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
        b._baseTexture.update();
        return (glowPics[color] = b);
    }
    const dotPics = {};
    function dotPic(color, w, h) {
        const key = color + w + "x" + h;
        if (dotPics[key]) return dotPics[key];
        const b = new Bitmap(w, h);
        b.fillRect(0, 0, w, h, color);
        return (dotPics[key] = b);
    }
    let rainPic = null, mistPic = null;
    function rainBitmap() {
        if (rainPic) return rainPic;
        rainPic = new Bitmap(2, 36);
        const ctx = rainPic.context, g = ctx.createLinearGradient(0, 0, 0, 36);
        g.addColorStop(0, "rgba(200,214,240,0)"); g.addColorStop(1, "rgba(214,226,250,0.8)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 2, 36);
        rainPic._baseTexture.update();
        return rainPic;
    }
    function mistBitmap() {
        if (mistPic) return mistPic;
        mistPic = new Bitmap(1280, 260);
        const ctx = mistPic.context;
        let seed = 7;
        const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        for (let i = 0; i < 70; i++) {
            const x = rand() * 1280, y = 60 + rand() * 150, rx = 80 + rand() * 160, ry = 26 + rand() * 40;
            const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
            g.addColorStop(0, "rgba(236,232,240,0.16)"); g.addColorStop(1, "rgba(236,232,240,0)");
            ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y);
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
            for (const dx of [-1280, 1280]) {   // (wraps: the two ends meet)
                ctx.save(); ctx.translate(x + dx, y); ctx.scale(1, ry / rx); ctx.translate(-x - dx, -y);
                const g2 = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, rx);
                g2.addColorStop(0, "rgba(236,232,240,0.16)"); g2.addColorStop(1, "rgba(236,232,240,0)");
                ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(x + dx, y, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
            }
        }
        mistPic._baseTexture.update();
        return mistPic;
    }

    // ------------------------------------------------------------------
    // Audio: BGM, BGS, and one more looping sound beside the BGS (a crowd, rain, waves) on its own WebAudio buffer
    // ------------------------------------------------------------------
    let extra = null;
    function stopExtra(fade) {
        if (!extra) return;
        try { if (fade) extra.fadeOut(fade); else extra.stop(); } catch (e) { /* (gone) */ }
        extra = null;
    }
    function playExtra(name, volume) {
        stopExtra(1);
        try {
            const b = AudioManager.createBuffer("bgs/", name);
            AudioManager.updateBufferParameters(b, AudioManager.bgsVolume, { name, volume, pitch: 100, pan: 0 });
            b.play(true, 0);
            b.fadeIn(1.5);
            extra = b;
        } catch (e) { extra = null; }
    }
    const se = (name, volume, pitch) => AudioManager.playSe({ name, volume: volume === undefined ? 80 : volume, pitch: pitch || 100, pan: 0 });
    function sceneAudio(a) {
        if (!a) return;
        if (a.bgm) AudioManager.playBgm({ name: a.bgm[0], volume: a.bgm[1], pitch: 100, pan: 0 });
        if (a.bgs) { AudioManager.playBgs({ name: a.bgs[0], volume: a.bgs[1], pitch: 100, pan: 0 }); AudioManager.fadeInBgs(1); }
        else AudioManager.fadeOutBgs(1);
        if (a.extra) playExtra(a.extra[0], a.extra[1]);
        else stopExtra(1);
    }

    // ------------------------------------------------------------------
    // Moving layers (tools/prolog/plansze.py): the Watch's banners, cut from their boards and waved on a mesh, and the boy on
    // the beach - a sheet of 256 x 192 cells (PixelLab frames, shown x2 like the boards), every standing frame with its hips
    // at the anchor; heads: where the top of his head is in each frame, from the anchor, in board pixels.
    // ------------------------------------------------------------------
    const FLAGS = {
        wies: { pic: "Prolog_Wies_Flaga", x: 964, y: 228, cols: 6, rows: 14, mode: "hang", amp: 7, speed: 0.05, fire: true },
        port: { pic: "Prolog_Port_Flaga", x: 230, y: 88, cols: 20, rows: 6, mode: "fly", amp: 7, speed: 0.11 }
    };
    const BOY = {
        pic: "Prolog_Plaza_Chlopiec", cw: 256, ch: 192, cols: 8, scale: 2, ax: 142 / 256, ay: 177 / 192,
        at: [840, 642], speed: 0.9,
        walks: { walk: [950, 614], walk2: [1036, 590] },
        heads: [[-59, -82], [-12, -98], [-11, -112], [-18, -142], [-32, -170], [-27, -180], [-18, -188], [-11, -194], [-2, -202], [-7, -218],
            [-10, -240], [17, -272], [35, -310], [36, -310], [36, -310], [34, -324], [29, -328], [28, -318], [31, -318], [33, -326], [37, -324],
            [38, -326], [46, -314], [69, -270], [89, -232], [114, -194], [127, -144], [124, -106], [43, -74], [42, -74]],
        seqs: {
            lie: { f: [0, 1, 2, 1], d: [110, 14, 60, 14], loop: true },   // (lying; now and then the head comes up a little)
            getup: { f: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], d: [10, 9, 9, 18, 12, 9, 8, 9, 22, 11, 20, 11, 16] },
            walk: { f: [13, 14, 15, 16, 17, 18, 19, 20], d: 10, loop: true, pace: [0.35, 1.6, 1.6, 0.35, 0.35, 1.6, 1.6, 0.5] },
            stand: { f: [16, 17], d: [64, 46], loop: true },   // (both feet down, swaying where he stopped)
            fall: { f: [21, 22, 23, 24, 25, 26, 27, 28, 29], d: [7, 6, 6, 9, 6, 5, 6, 12, 40],
                dust: { 3: [40, 14], 6: [80, 36, "Down1"] } }
        }
    };

    // ------------------------------------------------------------------
    // The film: six scenes (board, camera, effects, sound, steps). Places are in the board's 1280 x 720 pixels.
    // ------------------------------------------------------------------
    const SCENES = [
        { id: "kronika", board: "Prolog_Kronika", cam: [1, 640, 372], cam2: [1, 640, 352],
            fx: { ash: 220, pulse: [640, 720, "rgba(255,110,40,A)", 9] },
            audio: { bgm: ["Theme5", 80], bgs: ["Wind1", 45] },
            steps: [["wait", 50], ["rule"],
                ["narr", "Trzeci rok wojny.", "big"],
                ["narr", "Królestwa na lądzie walczą o coś, czego nikt nie widział — o pewność."],
                ["narr", "Za morzem leży Krucza Wyspa. Ziemia niczyja."],
                ["narr", "Płyną tam ci, którym nie zostało już nic.", "dim"],
                ["wait", 110]] },
        { id: "wies", board: "Prolog_Wies", cam: [1.0, 640, 360], cam2: [1.07, 760, 380],
            fx: { ash: 110, embers: { box: [60, 110, 1180, 470], rate: 0.9 }, flags: ["wies"],
                glows: [[150, 170, 3.2], [330, 300, 3.0], [560, 260, 2.8], [620, 420, 2.6], [850, 290, 2.4], [1080, 250, 2.6]] },
            audio: { bgm: ["Theme5", 60], bgs: ["Fire2", 70], extra: ["People2", 55] },
            steps: [["wait", 40], ["caption", "Ląd. Wieś Brzozowa Wola, noc."], ["wait", 60], ["se", "Horn", 45, 90], ["wait", 50],
                ["head", 60, 405, "Uciekinier", "Idą od rzeki! Do portu, póki prom stoi!"],
                ["se", "Horse", 55], ["head", 905, 380, "Żołnierz", "Z drogi! Z rozkazu Straży Pewności!"],
                ["head", 405, 450, "Kobieta z wózkiem", "Czarne Oczy... Uciekaj, synku, uciekaj!"], ["wait", 50]] },
        { id: "chata", board: "Prolog_Chata", cam: [1.0, 640, 360], cam2: [1.05, 650, 330],
            fx: { glows: [[1150, 392, 1.5, "rgba(255,210,130,A)", 1.9], [1052, 362, 2.4], [178, 285, 2.8, "rgba(255,120,40,A)", 0.6]], dust: true },
            audio: { bgm: ["Scene4", 70], bgs: ["Fire1", 35] },
            steps: [["wait", 40],
                ["say", "matka", "Tobołek. Chleb, ser, koc. Nie otwieraj, dopóki nie wypłyniesz."],
                ["say", "hero", "Mamo, chodź ze mną. Prom jeszcze stoi."],
                ["say", "matka", "Nie mogę. Ktoś musi być w domu, kiedy ojciec wróci. Pójdę za wojskiem, rozpytam w obozach..."],
                ["dust"],
                ["say", "matka", "Weź ten list. Dla dziadka Stacha, na Kruczej Wyspie. Oddasz mu do rąk. On cię przyjmie."],
                ["say", "hero", "Dziadka? Przecież nigdy go nie widziałem."],
                ["say", "matka", "Ale on ciebie widział. Na chrzcinach. Płakał jak bóbr, choć się wypierał."],
                ["say", "matka", "I to... wisiorek z krukiem. Dał mi go mój ojciec, kiedy wyjeżdżałam z wyspy. Teraz jest twój. Nie zgub go, \\N[1]."],
                ["say", "hero", "A ty? Kiedy przypłyniesz?"],
                ["say", "matka", "Następnym promem. Obiecuję."],
                ["busts", false], ["wait", 70],
                ["say", "matka", "Biegnij. Nie oglądaj się."],
                ["busts", false], ["se", "Door2", 70], ["wait", 30], ["se", "Run", 60], ["wait", 30]] },
        { id: "port", board: "Prolog_Port", cam: [1.0, 640, 360], cam2: [1.05, 720, 350],
            fx: { rain: { n: 150, ang: 0.12, v: 15, a: 0.45 }, flags: ["port"], glows: [[60, 282, 1.3], [410, 282, 1.3], [745, 462, 1.6, "rgba(255,200,110,A)", 1.2], [120, 180, 4.0, "rgba(255,110,40,A)", 0.5]] },
            audio: { bgm: ["Scene4", 55], bgs: ["Sea", 60], extra: ["Rain1", 40] },
            steps: [["wait", 40],
                ["head", 85, 318, "Żołnierz", "Prom tylko dla wojska! Cofnąć się!"],
                ["head", 950, 296, "Przemytnik", "Prom jest dla wojska, chłopcze. Ale mój kuter... za tyle monet."],
                ["head", 1148, 210, "\\N[1]", "To wszystko, co mam."],
                ["se", "Coin", 80],
                ["head", 950, 296, "Przemytnik", "Wiem. Dlatego tyle kosztuje. Wskakuj. I trzymaj się masztu."],
                ["se", "Chain", 60],
                ["head", 950, 296, "Przemytnik", "Krucza Wyspa... Nikt rozsądny tam teraz nie płynie. Dobrze, że nie jestem rozsądny."],
                ["wait", 50]] },
        { id: "sztorm", board: "Prolog_Sztorm", cam: [1.09, 640, 380], cam2: [1.09, 640, 380],
            fx: { rain: { n: 420, ang: 0.35, v: 24, a: 0.75 }, rock: true, lightning: [230, 420], glows: [[775, 368, 1.4, "rgba(255,200,110,A)", 2.2]] },
            audio: { bgm: ["Ship3", 70], bgs: ["Storm2", 80], extra: ["Wave2", 70] },
            steps: [["wait", 70], ["flash"], ["wait", 40],
                ["head", 895, 345, "Przemytnik", "Trzymaj się! Zaraz będzie brzeg... albo dno!"],
                ["flash"], ["se", "Crow", 70], ["wait", 30],
                ["think", 580, 345, "Mamo..."],
                ["wait", 90], ["flash"], ["wait", 40], ["wave"], ["wait", 130], ["se", "Crow", 35, 90], ["wait", 80]] },
        { id: "plaza", board: "Prolog_Plaza", cam: [1.0, 640, 360], cam2: [1.04, 720, 374],
            fx: { mist: true, dawn: true, boy: true },
            audio: { bgm: ["Scene1", 65], bgs: ["Wave1", 40], extra: ["Wind2", 30] },
            steps: [["boy", "lie"], ["wait", 70], ["caption", "Krucza Wyspa. Świt."], ["wait", 120],
                ["think", "boy", "List... jeszcze go mam. I wisiorek."],
                ["think", "boy", "Tobołek... morze go wzięło. A przemytnik?"],
                ["se", "Crow", 40, 95], ["boy", "getup"], ["wait", 20],
                ["cam", 1.08, 900, 400, 240], ["boy", "walk"],
                ["think", "boy", "Dziadek Stach... gdzie ty mieszkasz..."],
                ["boy", "walk2"], ["boy", "fall"], ["wait", 50], ["blackout", 110], ["audioOut"], ["wait", 40],
                ["voice", "Głos", "Ej! Ej, chłopcze! Żyjesz?"],
                ["voice", "Głos", "Do Stacha go... To chyba jego wnuk. Ma ten jego wisiorek..."],
                ["wait", 70]] }
    ];
    api.SCENES = SCENES;

    // ------------------------------------------------------------------
    // A bubble: the film's graphite panel with yellow corners (the game's accent), a name plate, a tail (left / right / down) or thought dots
    // ------------------------------------------------------------------
    function Sprite_ProBubble() {
        this.initialize(...arguments);
    }
    Sprite_ProBubble.prototype = Object.create(Sprite.prototype);
    Sprite_ProBubble.prototype.constructor = Sprite_ProBubble;
    Sprite_ProBubble.prototype.initialize = function(o) {
        Sprite.prototype.initialize.call(this);
        this.setup(o);
    };
    // o: { text, speaker, tail: "left" | "right" | "down" | "think" | "none", maxW }
    Sprite_ProBubble.prototype.setup = function(o) {
        const probe = new Bitmap(8, 8).context;
        probe.font = font(21);
        const lines = wrapText(probe, names(o.text), o.maxW || 600);
        const tw = Math.max(...lines.map(l => probe.measureText(l).width), o.speaker ? 60 : 0);
        const bw = Math.ceil(tw) + 40, bh = 24 + 30 * lines.length, tail = o.tail || "none";
        const padL = tail === "left" ? 90 : 4, padR = tail === "right" ? 90 : 4, padT = o.speaker ? 22 : 4, padB = tail === "down" || tail === "think" ? 26 : 8;
        const b = new Bitmap(bw + padL + padR, bh + padT + padB), ctx = b.context, x0 = padL, y0 = padT;
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.32)"; rr(ctx, x0 + 2, y0 + 4, bw, bh, 6); ctx.fill();
        ctx.fillStyle = C.panel;
        rr(ctx, x0, y0, bw, bh, 6); ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 1; rr(ctx, x0 + 0.5, y0 + 0.5, bw - 1, bh - 1, 6); ctx.stroke();
        ctx.beginPath();
        if (tail === "left") { ctx.moveTo(x0, y0 + bh / 2 - 9); ctx.lineTo(x0 - 80, y0 + bh / 2 + 2); ctx.lineTo(x0, y0 + bh / 2 + 9); }
        else if (tail === "right") { ctx.moveTo(x0 + bw, y0 + bh / 2 - 9); ctx.lineTo(x0 + bw + 80, y0 + bh / 2 + 2); ctx.lineTo(x0 + bw, y0 + bh / 2 + 9); }
        else if (tail === "down") { ctx.moveTo(x0 + bw / 2 - 9, y0 + bh); ctx.lineTo(x0 + bw / 2, y0 + bh + 14); ctx.lineTo(x0 + bw / 2 + 9, y0 + bh); }
        ctx.closePath(); ctx.fill();
        if (tail === "think") {
            for (const [dx, dy, r] of [[0, 8, 5], [6, 18, 3]]) { ctx.beginPath(); ctx.arc(x0 + bw / 2 + dx, y0 + bh + dy, r, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.strokeStyle = C.accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0, y0 + 12); ctx.lineTo(x0, y0); ctx.lineTo(x0 + 12, y0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0 + bw, y0 + bh - 12); ctx.lineTo(x0 + bw, y0 + bh); ctx.lineTo(x0 + bw - 12, y0 + bh); ctx.stroke();
        ctx.font = font(21);
        ctx.textBaseline = "top";
        ctx.fillStyle = tail === "think" ? "#d8d2c6" : C.text;
        lines.forEach((l, i) => ctx.fillText(l, x0 + 20, y0 + 13 + i * 30));
        if (o.speaker) {
            const name = names(o.speaker);
            ctx.font = font(18, "bold", "bold");
            const pw = Math.ceil(ctx.measureText(name).width) + 24, px = tail === "right" ? x0 + bw - 14 - pw : x0 + 14;
            ctx.fillStyle = "rgba(30,32,36,0.96)"; rr(ctx, px, y0 - 18, pw, 28, 4); ctx.fill();
            ctx.strokeStyle = C.line; ctx.lineWidth = 1; rr(ctx, px + 0.5, y0 - 17.5, pw - 1, 27, 4); ctx.stroke();
            ctx.fillStyle = C.plate; ctx.textBaseline = "middle"; ctx.fillText(name, px + 12, y0 - 4);
        }
        ctx.restore();
        b._baseTexture.update();
        this.bitmap = b;
        this._geom = { padL, padT, bw, bh, padB };
        this.text = names(o.text);
    };

    // ------------------------------------------------------------------
    // Scene_Prologue
    // ------------------------------------------------------------------
    function Scene_Prologue() {
        this.initialize(...arguments);
    }
    Scene_Prologue.prototype = Object.create(Scene_Base.prototype);
    Scene_Prologue.prototype.constructor = Scene_Prologue;
    Scene_Prologue.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        for (const s of SCENES) ImageManager.loadPicture(s.board);
        for (const k in FLAGS) ImageManager.loadPicture(FLAGS[k].pic).smooth = true;
        ImageManager.loadPicture(BOY.pic).smooth = false;
        // (2026-10-17) the hero's bust: the clean one from before the storm (Hero_Bust_Lad - whole clothes, no patches) on the
        // mainland, the torn one (Hero_Bust, the game's) from the storm on
        this._bustPics = { matka: ImageManager.loadPicture("Matka_Bust"), hero: ImageManager.loadPicture("Hero_Bust"), heroLad: ImageManager.loadPicture(HERO_BUST_LAD) };
        this._world = new Sprite();          // the board and what sits on it (fires, lanterns), moved by the camera
        this._board = new Sprite();
        this._world.addChild(this._board);
        this._worldFx = new Sprite();
        this._world.addChild(this._worldFx);
        this.addChild(this._world);
        this._screenFx = new Sprite();       // rain, ash, mist: over the whole screen
        this.addChild(this._screenFx);
        this._worldTop = new Sprite();       // the boy on the beach and his sand: on the board, but in front of the mist
        this.addChild(this._worldTop);
        this._shade = new Sprite(dotPic("#000000", W, H));   // the board darkened (the beach: he falls)
        this._shade.opacity = 0;
        this.addChild(this._shade);
        this._black = new Sprite(dotPic("#000000", W, H));   // fades between scenes
        this.addChild(this._black);
        this._white = new Sprite(dotPic("#e8eeff", W, H));   // lightning, the great wave
        this._white.opacity = 0;
        this.addChild(this._white);
        this._text = new Sprite();           // the chronicle's lines, captions
        this.addChild(this._text);
        const bars = new Sprite(new Bitmap(W, H));
        bars.bitmap.fillRect(0, 0, W, BAR, "#000000");
        bars.bitmap.fillRect(0, H - BAR, W, BAR, "#000000");
        this.addChild(bars);
        this._busts = { matka: new Sprite(), hero: new Sprite() };
        for (const k in this._busts) { this._busts[k].visible = false; this.addChild(this._busts[k]); }
        this._bubbles = new Sprite();
        this.addChild(this._bubbles);
        this._skip = new Sprite(new Bitmap(320, BAR));
        this._skip.x = W - 320;
        this.addChild(this._skip);
        this._skipKey = "";
        this._t = 0;
        this._holdT = 0;
        this._hintT = 0;
        this._ignore = 12;
        this._index = -1;
        this._ending = false;
        this._log = api.log = [];
        this._lines = 0;
    };
    Scene_Prologue.prototype.start = function() {
        Scene_Base.prototype.start.call(this);
        this.beginScene(0);
    };
    Scene_Prologue.prototype.terminate = function() {
        Scene_Base.prototype.terminate.call(this);
        stopExtra(0);
        // (a replay from the game, Prologue.replay: the map's music and sounds back as they were)
        if (this._replay) {
            if (this._replay.bgm && this._replay.bgm.name) AudioManager.replayBgm(this._replay.bgm);
            if (this._replay.bgs && this._replay.bgs.name) AudioManager.replayBgs(this._replay.bgs);
        }
    };
    // (2026-10-16) a replay from the game (F9): the film alone, then back to the map scene it came from (SceneManager.pop - the
    // game's state untouched, no transfer); the map's music saved first
    Scene_Prologue.prototype.prepare = function(opts) {
        if (opts && opts.replay) this._replay = { bgm: AudioManager.saveBgm(), bgs: AudioManager.saveBgs() };
    };
    Scene_Prologue.prototype.beginScene = function(i) {
        this.clearScene();
        if (i >= SCENES.length) { this.finish(); return; }
        const s = this._scene = SCENES[i];
        this._index = i;
        this._log.push(s.id);
        this._steps = s.steps.slice();
        this._step = -1;
        this._wait = 0;
        this._sceneT = 0;
        this._out = 0;
        this._board.bitmap = ImageManager.loadPicture(s.board);
        this._cam = { from: s.cam, to: s.cam2, t: 0, len: 0, now: s.cam.slice() };
        this._black.opacity = 255;
        this._fadeIn = 34;
        this._shade.opacity = 0;
        this._white.opacity = 0;
        this.buildFx(s.fx || {});
        sceneAudio(s.audio);
        this.next();
    };
    Scene_Prologue.prototype.clearScene = function() {
        for (const layer of [this._worldFx, this._screenFx, this._worldTop, this._text, this._bubbles]) layer.removeChildren();
        for (const k in this._busts) this._busts[k].visible = false;
        this._fx = { parts: [], glows: [], rain: [], mist: [], pulse: null, flashes: [], thunder: [], flags: [] };
        this._boy = null;
        this._bubble = null;
        this._narr = [];
        this._caption = null;
        this._bust = { on: false, speaking: null, t: 0 };
        this._world.rotation = 0;
        this._narrSprite = null;
        this._narrRule = false;
        this._waveT = 0;
        this._blackT = 0;
    };
    // ---- effects ----
    Scene_Prologue.prototype.buildFx = function(fx) {
        const F = this._fx;
        F.def = fx;
        for (const key of fx.flags || []) F.flags.push(this.makeFlag(FLAGS[key]));
        if (fx.boy) this.makeBoy();
        for (const g of fx.glows || []) {
            const s = new Sprite(glowPic(g[3] || "rgba(255,150,60,A)"));
            s.anchor.set(0.5, 0.5);
            s.blendMode = PIXI.BLEND_MODES.ADD;
            s.x = g[0]; s.y = g[1];
            Object.assign(s, { _base: g[2], _speed: g[4] || 1, _ph: rnd(0, 6.3) });
            this._worldFx.addChild(s);
            F.glows.push(s);
        }
        if (fx.pulse) {
            const p = fx.pulse, s = new Sprite(glowPic(p[2]));
            s.anchor.set(0.5, 0.5); s.blendMode = PIXI.BLEND_MODES.ADD;
            s.x = p[0]; s.y = p[1]; s.scale.set(p[3], p[3] * 0.45);
            this._worldFx.addChild(s);
            F.pulse = s;
        }
        for (let i = 0; i < (fx.ash || 0); i++) {
            const g = 120 + Math.floor(Math.random() * 80), s = new Sprite(dotPic("rgb(" + g + "," + (g - 8) + "," + (g - 16) + ")", Math.random() < 0.3 ? 3 : 2, 2));
            Object.assign(s, { x: rnd(0, W), y: rnd(0, H), _vx: rnd(-0.25, 0.35), _vy: rnd(0.25, 0.7), _ph: rnd(0, 6.3) });
            s.opacity = rnd(90, 200);
            this._screenFx.addChild(s);
            F.parts.push(s);
        }
        if (fx.rain) {
            const r = fx.rain;
            for (let i = 0; i < r.n; i++) {
                const s = new Sprite(rainBitmap());
                s.anchor.set(0.5, 0.5);
                s.rotation = -Math.atan(r.ang);
                const v = r.v * rnd(0.75, 1.25);
                Object.assign(s, { x: rnd(-100, W + 100), y: rnd(-40, H), _vx: v * r.ang, _vy: v });
                s.scale.set(1, rnd(0.6, 1.3));
                s.opacity = 255 * r.a * rnd(0.5, 1);
                this._screenFx.addChild(s);
                F.rain.push(s);
            }
        }
        if (fx.mist) {   // two bands, each two copies side by side (the picture wraps), drifting right
            for (let i = 0; i < 2; i++) {
                const band = new Sprite();
                for (const dx of [0, 1280]) { const s = new Sprite(mistBitmap()); s.x = dx; band.addChild(s); }
                band.y = 330 + i * 70;
                band.x = -1280 + i * 400;
                band.opacity = 200;
                Object.assign(band, { _v: 0.25 + i * 0.2 });
                this._screenFx.addChild(band);
                F.mist.push(band);
            }
        }
        if (fx.lightning) F.nextFlash = Math.round(rnd(fx.lightning[0] * 0.4, fx.lightning[0]));
    };
    Scene_Prologue.prototype.flash = function(strong) {
        this._white.opacity = strong ? 255 : 210;
        this._fx.thunder.push({ at: this._sceneT + Math.round(rnd(16, 46)), name: Math.random() < 0.5 ? "Thunder3" : "Thunder9" });
    };
    Scene_Prologue.prototype.updateFx = function() {
        const F = this._fx, t = this._sceneT, def = F.def || {};
        for (const f of F.flags) this.waveFlag(f, t);
        if (this._boy) this.updateBoy();
        for (const g of F.glows) {
            const k = 0.5 + 0.22 * Math.sin(t * 0.071 * g._speed + g._ph) + 0.14 * Math.sin(t * 0.193 * g._speed + g._ph * 2) + 0.09 * Math.sin(t * 0.47 * g._speed + g._ph * 3);
            g.scale.set(g._base * (0.9 + 0.2 * k));
            g.opacity = Math.round(80 + 110 * k);
        }
        if (F.pulse) F.pulse.opacity = Math.round(70 + 60 * (0.5 + 0.5 * Math.sin(t * 0.03)));
        for (const s of F.parts) {
            if (s._rise) {
                s.x += s._vx + Math.sin(s._age * 0.14 + s._ph) * 0.35; s.y += s._vy; s._vy = s._vy * 0.993 + (s._g || 0); s._age++;
                if (s._floor !== undefined && s.y > s._floor) { s.y = s._floor; s._vy = 0; s._vx *= 0.6; }   // (grains land on the sand)
                const k = s._age / s._life;
                s.opacity = Math.round((s._o || 255) * Math.max(0, s._soft ? 1 - k * k : 1 - k));
                if (s._grow) { s._vx *= 0.95; s.scale.set(s.scale.x + s._grow, s.scale.y + s._grow * 0.45); }
                continue;
            }
            s.x += s._vx + Math.sin(t * 0.02 + s._ph) * 0.25;
            s.y += s._vy;
            if (s.y > H + 4) { s.y = -4; s.x = rnd(0, W); }
            if (s.x > W + 4) s.x = -4;
            if (s.x < -4) s.x = W + 4;
        }
        if (def.embers) {   // sparks: born in the fires' box, rising and fading
            const e = def.embers;
            if (Math.random() < e.rate) {
                const kind = Math.random() < 0.4 ? "#ff9a3a" : "#ffd27a", sz = Math.random() < 0.15 ? 3 : 2;
                const s = new Sprite(dotPic(kind, sz, sz));
                s.blendMode = PIXI.BLEND_MODES.ADD;
                Object.assign(s, { x: rnd(e.box[0], e.box[2]), y: rnd(e.box[1] + 120, e.box[3]), _vx: rnd(-0.3, 0.4), _vy: -rnd(0.8, 2.0), _rise: true, _age: 0, _life: Math.round(rnd(60, 140)), _ph: rnd(0, 6.3) });
                this._worldFx.addChild(s);
                F.parts.push(s);
            }
        }
        if (F.parts.some(p => p._rise && p._age >= p._life)) {
            for (const s of F.parts.filter(p => p._rise && p._age >= p._life)) s.parent.removeChild(s);
            F.parts = F.parts.filter(p => !(p._rise && p._age >= p._life));
        }
        for (const s of F.rain) {
            s.x += s._vx; s.y += s._vy;
            if (s.y > H + 30) { s.y = rnd(-60, -10); s.x = rnd(-160, W); }
        }
        for (const s of F.mist) { s.x += s._v; if (s.x > 0) s.x -= 1280; s.opacity = Math.round(150 + 50 * Math.sin(t * 0.01 + s._v * 10)); }
        if (def.lightning && !this._out) {
            if (--F.nextFlash <= 0) { this.flash(false); F.nextFlash = Math.round(rnd(def.lightning[0], def.lightning[1])); if (Math.random() < 0.5) se("Crow", 45, 100); }
        }
        for (const th of F.thunder.filter(x => x.at <= t)) se(th.name, 80, 100);
        F.thunder = F.thunder.filter(x => x.at > t);
        if (this._white.opacity > 0 && !this._waveT) this._white.opacity = Math.max(0, this._white.opacity - 24);
        if (def.dawn) this._board.setColorTone([Math.round(-20 + 20 * Math.min(1, t / 900)), Math.round(-20 + 20 * Math.min(1, t / 900)), Math.round(-10 + 10 * Math.min(1, t / 900)), 0]);
    };
    // ---- the camera: a slow move over the whole scene (cam -> cam2), a "cam" step on top; the storm's deck rocks ----
    Scene_Prologue.prototype.updateCamera = function() {
        const c = this._cam, s = this._scene, len = s.len || 1800;
        let now;
        if (c.len) { c.t++; const k = ease(c.t / c.len); now = c.from.map((v, i) => v + (c.to[i] - v) * k); }
        else { const k = Math.min(1, this._sceneT / len); now = s.cam.map((v, i) => v + (s.cam2[i] - v) * k); }
        // (the board always covers the screen: the centre kept far enough from its edges for the zoom)
        now[1] = Math.max(W / 2 / now[0], Math.min(W - W / 2 / now[0], now[1]));
        now[2] = Math.max(H / 2 / now[0], Math.min(H - H / 2 / now[0], now[2]));
        c.now = now;
        const w = this._world;
        w.pivot.set(now[1], now[2]);
        w.scale.set(now[0], now[0]);
        w.position.set(W / 2, H / 2);
        if (s.fx && s.fx.rock) {
            const t = this._sceneT;
            w.rotation = Math.sin(t * 0.034) * 0.022 + Math.sin(t * 0.081) * 0.006;
            w.position.y = H / 2 + Math.sin(t * 0.034 + 1.2) * 9;
        }
        const top = this._worldTop;   // (moved with the board)
        top.pivot.copyFrom(w.pivot); top.scale.copyFrom(w.scale); top.position.copyFrom(w.position); top.rotation = w.rotation;
    };
    // a point of the board on the screen (bubbles over heads)
    Scene_Prologue.prototype.toScreen = function(x, y) {
        const w = this._world, cs = Math.cos(w.rotation), sn = Math.sin(w.rotation), dx = (x - w.pivot.x) * w.scale.x, dy = (y - w.pivot.y) * w.scale.y;
        return { x: w.position.x + dx * cs - dy * sn, y: w.position.y + dx * sn + dy * cs };
    };
    // ---- steps ----
    const lineFrames = text => Math.round(Math.max(130, 70 + names(text).length * 3.6));
    Scene_Prologue.prototype.next = function() {
        for (;;) {
            this._step++;
            const st = this._steps[this._step];
            if (!st) { this._wait = 0; this._out = this._out || 1; return; }
            if (this.doStep(st)) return;   // (a step that takes time)
        }
    };
    Scene_Prologue.prototype.doStep = function(st) {
        const [k, a, b, c, d] = st;
        switch (k) {
            case "wait": this._wait = a; return true;
            case "se": se(a, b, c); return false;
            case "rule": this._narrRule = true; this.drawNarr(); return false;
            case "narr": this._narr.push([a, b || ""]); this.drawNarr(); this.lineOn(lineFrames(a) + (b === "big" ? 30 : 0)); return true;
            case "caption": this.showCaption(a); return false;
            case "say": this.showSay(a, b); return true;
            case "busts": this.bustsOut(); return false;
            case "head": this.showHead(a, b, c, d); return true;
            case "think": this.showThink(a, b, c); return true;
            case "boy": return this.boyDo(a);
            case "voice": this.showVoice(a, b); return true;
            case "flash": this.flash(true); return false;
            case "dust": se("Earth2", 45, 80); this.dustFall(); return false;
            case "wave": this._waveT = 1; se("Collapse4", 85); this._fx.def = Object.assign({}, this._fx.def, { lightning: null }); return true;
            case "cam": this._cam = { from: this._cam.now.slice(), to: [a, b, c], t: 0, len: d, now: this._cam.now.slice() }; return false;
            case "blackout": this._blackT = a; this._blackLen = a; this._wait = a; return true;
            case "audioOut": AudioManager.fadeOutBgm(2); AudioManager.fadeOutBgs(2); stopExtra(2); return false;
        }
        return false;
    };
    Scene_Prologue.prototype.lineOn = function(frames) {
        this._lineT = 0;
        this._lineMax = frames;
        this._lines++;
    };
    Scene_Prologue.prototype.lineDone = function() {
        if (this._bubble) { this._bubble._gone = true; this._bubble = null; }
        this._lineMax = 0;
        this.next();
    };
    Scene_Prologue.prototype.dustFall = function() {
        for (let i = 0; i < 40; i++) {
            const g = 150 + Math.floor(Math.random() * 60), s = new Sprite(dotPic("rgb(" + g + "," + (g - 20) + "," + (g - 40) + ")", 2, 2));
            // (the same rising-spark motion, only falling: a positive speed that slows a little)
            Object.assign(s, { x: rnd(200, 1000), y: rnd(60, 160), _vx: rnd(-0.1, 0.1), _vy: rnd(0.9, 1.7), _rise: true, _age: 0, _life: Math.round(rnd(60, 110)), _ph: 0 });
            this._worldFx.addChild(s);
            this._fx.parts.push(s);
        }
    };
    // the chronicle: centred lines under a little rule, each fading in
    Scene_Prologue.prototype.drawNarr = function() {
        if (!this._narrSprite) { this._narrSprite = new Sprite(new Bitmap(W, 420)); this._narrSprite.y = 130; this._text.addChild(this._narrSprite); }
        const b = this._narrSprite.bitmap, ctx = b.context;
        b.clear();
        ctx.save();
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        if (this._narrRule) {
            ctx.strokeStyle = "rgba(138,106,74,0.9)"; ctx.fillStyle = "rgba(138,106,74,0.9)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(520, 28.5); ctx.lineTo(628, 28.5); ctx.moveTo(652, 28.5); ctx.lineTo(760, 28.5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(640, 23); ctx.lineTo(645, 28.5); ctx.lineTo(640, 34); ctx.lineTo(635, 28.5); ctx.fill();
        }
        let y = 72;
        for (const [text, kind] of this._narr) {
            ctx.font = kind === "big" ? font(40, "serif", "600") : font(26, "serif", "500");
            ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineJoin = "round";
            ctx.strokeText(text, 640, y);
            ctx.fillStyle = kind === "dim" ? "rgba(184,173,152,0.55)" : kind === "big" ? "#f0e4cc" : "#e2d6be";
            ctx.fillText(text, 640, y);
            y += kind === "big" ? 62 : 46;
        }
        ctx.restore();
        b._baseTexture.update();
        this._narrSprite.opacity = 255;
    };
    Scene_Prologue.prototype.showCaption = function(text) {
        const s = new Sprite(new Bitmap(W, 60)), ctx = s.bitmap.context;
        ctx.font = font(24, "serif", "500"); ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,0.75)"; ctx.lineJoin = "round";
        ctx.strokeText(text, 640, 30);
        ctx.fillStyle = this._scene.id === "plaza" ? "#f4ecf0" : "#e8d8bc";
        ctx.fillText(text, 640, 30);
        s.bitmap._baseTexture.update();
        s.y = 70; s.opacity = 0;
        s._fadeIn = true;
        this._text.addChild(s);
        this._caption = s;
    };
    // the scenes before the storm (the mainland: the chronicle, the village, the hut, the port) - the hero still in whole clothes
    Scene_Prologue.prototype.beforeStorm = function() {
        const i = SCENES.indexOf(this._scene), storm = SCENES.findIndex(s => s.id === "sztorm");
        return i >= 0 && (storm < 0 || i < storm);
    };
    // a talk line: the busts in the bottom corners (the mother left, mirrored; the hero right), the bubble from the speaker's side
    Scene_Prologue.prototype.showSay = function(who, text) {
        const B = this._bust;
        if (!B.on) {
            B.on = true; B.t = 0;
            for (const k in this._busts) {
                const sp = this._busts[k];
                sp.bitmap = k === "hero" && this.beforeStorm() ? this._bustPics.heroLad : this._bustPics[k];
                sp.visible = true;
                sp.scale.set(k === "matka" ? -0.78 : 0.78, 0.78);
                sp.anchor.set(1, 1);   // (the mother mirrored: her right edge at x 0 + her width; the hero's right edge at the screen's)
                sp.y = H;
                sp.opacity = 0;
            }
        }
        B.speaking = who;
        const left = who !== "hero";
        const bub = new Sprite_ProBubble({ text, speaker: left ? "Matka" : heroName(), tail: left ? "left" : "right" });
        const g = bub._geom;
        bub.x = left ? 268 - g.padL : W - 268 - g.bw - g.padL;
        bub.y = H - 120 - g.bh / 2 - g.padT;
        this.putBubble(bub);
        this.lineOn(lineFrames(text));
    };
    Scene_Prologue.prototype.bustsOut = function() {
        this._bust.on = false;
        this._bust.speaking = null;
    };
    Scene_Prologue.prototype.showHead = function(x, y, speaker, text) {
        const bub = new Sprite_ProBubble({ text, speaker, tail: "down", maxW: 520 });
        bub._at = [x, y];
        this.placeHead(bub);
        this.putBubble(bub);
        this.lineOn(lineFrames(text));
    };
    Scene_Prologue.prototype.showThink = function(x, y, text) {
        if (x === "boy") { text = y; x = null; }   // (["think", "boy", text]: over the boy's head, wherever he is)
        const bub = new Sprite_ProBubble({ text, tail: "think", maxW: 520 });
        bub._at = x === null ? () => this.boyHead() : [x, y];
        this.placeHead(bub);
        this.putBubble(bub);
        this.lineOn(lineFrames(text));
    };
    Scene_Prologue.prototype.showVoice = function(speaker, text) {
        const bub = new Sprite_ProBubble({ text, speaker, tail: "none", maxW: 620 });
        const g = bub._geom;
        bub.x = Math.round(W / 2 - g.padL - g.bw / 2);
        bub.y = Math.round(H / 2 - g.padT - g.bh / 2);
        this.putBubble(bub);
        this.lineOn(lineFrames(text));
    };
    Scene_Prologue.prototype.placeHead = function(bub) {
        const at = typeof bub._at === "function" ? bub._at() : bub._at;
        const p = this.toScreen(at[0], at[1]), g = bub._geom;
        bub.x = Math.round(Math.max(8 - g.padL, Math.min(W - 8 - g.padL - g.bw, p.x - g.padL - g.bw / 2)));
        bub.y = Math.round(Math.max(BAR + 6 - g.padT + 18, p.y - 18 - g.padT - g.bh - 14));
    };
    Scene_Prologue.prototype.putBubble = function(bub) {
        if (this._bubble) this._bubble._gone = true;
        bub.opacity = 0;
        this._bubbles.addChild(bub);
        this._bubble = bub;
    };
    Scene_Prologue.prototype.updateBubbles = function() {
        for (const b of this._bubbles.children.slice()) {
            if (b._gone) { b.opacity -= 40; if (b.opacity <= 0) this._bubbles.removeChild(b); }
            else { b.opacity = Math.min(255, b.opacity + 40); if (b._at) this.placeHead(b); }
        }
        const B = this._bust;
        if (this._busts.matka.visible) {
            B.t = B.on ? Math.min(20, B.t + 1) : Math.max(0, B.t - 1);
            const k = ease(B.t / 20);
            for (const key in this._busts) {
                const sp = this._busts[key], on = B.speaking === (key === "hero" ? "hero" : "matka");
                sp.opacity = Math.round(255 * k);
                sp.x = key === "matka" ? Math.round(-60 * (1 - k)) : Math.round(W + 60 * (1 - k));   // (mirrored: anchor 1 = its left edge)
                sp.setColorTone(on || !B.speaking ? [0, 0, 0, 0] : [-90, -90, -90, 40]);
            }
            if (!B.on && B.t === 0) for (const key in this._busts) this._busts[key].visible = false;
        }
        if (this._caption && this._caption._fadeIn) this._caption.opacity = Math.min(255, this._caption.opacity + 8);
    };
    // ---- the banners: cut out of the board (their place painted over: tools/prolog/plansze.py), on a PIXI mesh that waves -
    // pinned at the pole (a hanging banner at its crossbar, a flag at its mast), freer towards the loose end, in a light wind ----
    Scene_Prologue.prototype.makeFlag = function(def) {
        const bmp = ImageManager.loadPicture(def.pic);
        bmp.smooth = true;   // (smooth sampling: a bent pixel picture would crawl at its edges)
        const plane = new PIXI.SimplePlane(new PIXI.Texture(bmp.baseTexture), def.cols, def.rows);
        plane.x = def.x; plane.y = def.y;
        this._worldFx.addChild(plane);
        return { def, plane, base: null, w: bmp.width, h: bmp.height, ph: rnd(0, 6.3), moved: 0 };
    };
    Scene_Prologue.prototype.waveFlag = function(f, t) {
        const d = f.def, buf = f.plane.geometry.getBuffer("aVertexPosition"), a = buf.data;
        if (!f.base || f.base.length !== a.length) f.base = Float32Array.from(a);   // (the flat grid, kept once)
        const b = f.base, sp = d.speed;
        // the wind: a slow swell with a softer gust now and then, never a jerk
        const wind = 0.75 + 0.25 * Math.sin(t * sp * 0.21 + f.ph) + 0.12 * Math.sin(t * sp * 0.53 + f.ph * 2);
        let moved = 0;
        for (let i = 0; i < a.length; i += 2) {
            const u = b[i] / f.w, v = b[i + 1] / f.h;
            let dx, dy;
            if (d.mode === "hang") {   // (from the crossbar down: the bottom swings and ripples, the top stays)
                const k = Math.pow(v, 1.4) * wind;
                dx = (Math.sin(t * sp + f.ph - v * 2.6) * d.amp + Math.sin(t * sp * 2.1 + f.ph - v * 6 + u * 2.5) * d.amp * 0.35 + d.amp * 0.5) * k;
                dy = -Math.abs(Math.sin(t * sp + f.ph - v * 2.6)) * d.amp * 0.2 * k;
            } else {                   // (from the mast out: waves run to the tails)
                const k = Math.pow(u, 1.2) * wind;
                dy = (Math.sin(t * sp + f.ph - u * 5.4) * d.amp + Math.sin(t * sp * 1.8 + f.ph - u * 10 + v * 2) * d.amp * 0.3) * k;
                dx = -(1 - Math.cos(t * sp + f.ph - u * 5.4)) * d.amp * 0.25 * k;
            }
            a[i] = b[i] + dx;
            a[i + 1] = b[i + 1] + dy;
            moved += Math.abs(dx) + Math.abs(dy);
        }
        buf.update();
        f.moved = moved;
        if (d.fire) {   // (the fire's light on the cloth, flickering with the glows)
            const k = 0.5 + 0.3 * Math.sin(t * 0.071 + 1.3) + 0.2 * Math.sin(t * 0.193 + 0.4);
            const g = Math.round(205 + 30 * k), bl = Math.round(185 + 30 * k);
            f.plane.tint = (255 << 16) | (g << 8) | bl;
        }
    };
    // ---- the boy on the beach: frames of one sheet (lying, getting up, a stagger, a fall), x2 like the boards, carried along
    // the sand while he walks; his thoughts follow his head; sand flies when he goes down ----
    Scene_Prologue.prototype.makeBoy = function() {
        const bmp = ImageManager.loadPicture(BOY.pic);
        bmp.smooth = false;
        const sp = new Sprite(bmp);
        sp.anchor.set(BOY.ax, BOY.ay);
        sp.scale.set(BOY.scale, BOY.scale);
        sp.x = BOY.at[0]; sp.y = BOY.at[1];
        this._worldTop.addChild(sp);
        this._boy = { sp, seq: null, i: 0, frame: -1, t: 0, done: true, path: null, played: [], frames: 0, head: null, dusted: {} };
        this.boyPlay("lie");
    };
    Scene_Prologue.prototype.boyFrame = function(n) {
        const b = this._boy;
        if (b.frame === n) return;
        b.frame = n;
        b.frames++;
        b.sp.setFrame((n % BOY.cols) * BOY.cw, Math.floor(n / BOY.cols) * BOY.ch, BOY.cw, BOY.ch);
    };
    // (keep: when the frame he is in now is one of the new run's, go on from there - no jump back to its start)
    Scene_Prologue.prototype.boyPlay = function(seq, keep) {
        const b = this._boy, f = BOY.seqs[seq].f;
        b.seq = seq; b.i = keep ? Math.max(0, f.indexOf(b.frame)) : 0; b.t = 0; b.done = false; b.dusted = {};
        b.played.push(seq);
        this.boyFrame(f[b.i]);
    };
    // the head, eased (the frames' heads jump a little; a thought bubble should glide)
    Scene_Prologue.prototype.boyHead = function() {
        const b = this._boy;
        return b && b.head ? [b.head[0], b.head[1]] : [0, 0];
    };
    Scene_Prologue.prototype.updateBoy = function() {
        const b = this._boy, q = BOY.seqs[b.seq];
        b.t++;
        const dur = i => (Array.isArray(q.d) ? q.d[i] : q.d);
        while (b.t >= dur(b.i)) {
            if (b.i + 1 < q.f.length) { b.t -= dur(b.i); b.i++; }
            else if (q.loop) { b.t -= dur(b.i); b.i = 0; }
            else { b.t = dur(b.i); if (!b.done) { b.done = true; const fn = b.onDone; b.onDone = null; if (fn) fn(); } break; }
        }
        this.boyFrame(q.f[b.i]);
        const dust = q.dust && q.dust[b.i];
        if (dust && !b.dusted[b.i]) {
            b.dusted[b.i] = true;
            this.sandPuff(b.sp.x + dust[0], b.sp.y, dust[1]);
            if (dust[2]) se(dust[2], 75, 90);
        }
        if (b.path) {   // (walking: carried along the sand at the pace of his steps - on when a foot swings through, nearly still
            // while both feet are down, so the feet hardly slide - and a little slower at both ends)
            const P = b.path, ends = Math.max(0.35, Math.min(1, P.s / 40, (P.len - P.s) / 40));
            P.s = Math.min(P.len, P.s + BOY.speed * (q.pace ? q.pace[b.i] : 1) * ends);
            const k = P.s / P.len;
            b.sp.x = P.from[0] + (P.to[0] - P.from[0]) * k;
            b.sp.y = P.from[1] + (P.to[1] - P.from[1]) * k;
            if (k >= 1) { b.path = null; this.boyPlay("stand"); const fn = P.done; if (fn) fn(); }
        }
        const hd = BOY.heads[b.frame], tx = b.sp.x + hd[0], ty = b.sp.y + hd[1];
        if (!b.head) b.head = [tx, ty];
        b.head[0] += (tx - b.head[0]) * 0.12;
        b.head[1] += (ty - b.head[1]) * 0.12;
        if (this._fx.def && this._fx.def.dawn) b.sp.setColorTone(this._board.getColorTone());
    };
    // a step: "lie" (stirring, the film goes on), "getup" / "fall" (the film waits for the end), "walk" / "walk2" (to the
    // next place on his way up the beach, at the pace of his steps; the film waits)
    Scene_Prologue.prototype.boyDo = function(what) {
        const b = this._boy;
        if (!b) return false;
        if (what === "lie") { this.boyPlay("lie"); return false; }
        if (what === "getup" || what === "fall") {
            this.boyPlay(what, true);
            b.onDone = () => { this._wait = 1; };
            this._wait = 1e9;
            return true;
        }
        const to = BOY.walks[what], from = [b.sp.x, b.sp.y];
        this.boyPlay("walk");
        b.path = { from, to, s: 0, len: Math.max(1, Math.hypot(to[0] - from[0], to[1] - from[1])), done: () => { this._wait = 1; } };
        this._wait = 1e9;
        return true;
    };
    Scene_Prologue.prototype.sandPuff = function(x, y, n) {
        for (let i = 0; i < Math.ceil(n / 9); i++) {   // (a soft cloud of sand dust, spreading and thinning out)
            const c = new Sprite(glowPic("rgba(206,198,214,A)"));
            c.anchor.set(0.5, 0.5);
            c.scale.set(0.35, 0.16);
            Object.assign(c, { x: x + rnd(-50, 50), y: y - rnd(6, 18), _vx: rnd(-0.6, 0.6), _vy: -rnd(0.1, 0.35), _rise: true, _soft: true,
                _grow: 0.012, _o: 150, _age: 0, _life: Math.round(rnd(60, 90)), _ph: 0 });
            this._worldTop.addChild(c);
            this._fx.parts.push(c);
        }
        for (let i = 0; i < n; i++) {   // (and grains, thrown up and falling back)
            const g = 118 + Math.floor(Math.random() * 60), z = Math.random() < 0.35 ? 4 : 2;   // (wet sand: darker than the beach)
            const s = new Sprite(dotPic("rgb(" + g + "," + (g - 6) + "," + (g + 6) + ")", z, z));
            const a = rnd(Math.PI * 1.08, Math.PI * 1.92), v = rnd(0.6, 2.2);
            Object.assign(s, { x: x + rnd(-70, 70), y: y - rnd(0, 10), _vx: Math.cos(a) * v * 1.4, _vy: Math.sin(a) * v, _g: 0.05, _rise: true, _soft: true,
                _floor: y + rnd(0, 8), _age: 0, _life: Math.round(rnd(40, 70)), _ph: 0 });
            this._worldTop.addChild(s);
            this._fx.parts.push(s);
        }
    };
    // ---- skipping and the hint (top right, on the black bar) ----
    Scene_Prologue.prototype.updateSkip = function() {
        const held = Input.isPressed("escape") || Input.isPressed("cancel");
        if ((Input._latestButton && Input._pressedTime === 0) || TouchInput.isTriggered()) this._hintT = 180;
        if (this._ignore > 0) { this._ignore--; this._holdT = held ? HOLD + 1 : 0; return; }   // (a key still down from the screen before)
        if (held) {
            this._holdT++;
            if (this._holdT === HOLD) { this.skipAll(); return; }
        } else {
            if (this._holdT > 0 && this._holdT < HOLD) this.skipScene();
            this._holdT = 0;
        }
        if (TouchInput.isCancelled()) this.skipScene();
    };
    Scene_Prologue.prototype.drawSkip = function() {
        const k = Math.min(1, this._holdT / HOLD), bright = this._hintT > 0 || this._holdT > 0;
        const key = Math.round(k * 40) + "|" + bright;
        if (key === this._skipKey) return;
        this._skipKey = key;
        const b = this._skip.bitmap, ctx = b.context, cx = 290, cy = 28;
        b.clear();
        ctx.save();
        ctx.globalAlpha = bright ? 1 : 0.45;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(90,92,100,0.9)"; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.stroke();
        if (k > 0) { ctx.strokeStyle = C.accent; ctx.beginPath(); ctx.arc(cx, cy, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke(); }
        ctx.font = font(13, "bold", "bold"); ctx.fillStyle = C.text; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("P", cx, cy + 1);
        ctx.font = font(15); ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.fillText("przytrzymaj: pomiń", cx - 20, cy);
        ctx.restore();
        b._baseTexture.update();
    };
    Scene_Prologue.prototype.skipScene = function() {
        if (this._ending || this._out) return;
        SoundManager.playCursor();
        this._skipped = (this._skipped || 0) + 1;
        this._out = 1;
        this._outLen = 16;
    };
    Scene_Prologue.prototype.skipAll = function() {
        if (this._ending) return;
        SoundManager.playOk();
        this._skippedAll = true;
        this.finish();
    };
    Scene_Prologue.prototype.finish = function() {
        if (this._ending) return;
        this._ending = true;
        api.lastRun = { log: this._log.slice(), skipped: this._skipped || 0, all: !!this._skippedAll };
        AudioManager.fadeOutBgm(1); AudioManager.fadeOutBgs(1); stopExtra(1);
        this.startFadeOut(30, false);
        if (this._replay) { SceneManager.pop(); return; }
        SceneManager.goto(Scene_Map);
    };
    // ---- the frame ----
    Scene_Prologue.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (this._ending) return;
        this.updateSkip();
        this._okNow = Input.isTriggered("ok") || TouchInput.isTriggered();   // (once a frame, however many steps the frame runs)
        const n = api.speedK;
        for (let i = 0; i < n && !this._ending; i++) this.tick();
        if (this._hintT > 0) this._hintT--;
        this.drawSkip();
    };
    Scene_Prologue.prototype.tick = function() {
        this._t++;
        this._sceneT++;
        this.updateCamera();
        this.updateFx();
        this.updateBubbles();
        if (this._fadeIn > 0) { this._fadeIn--; this._black.opacity = Math.round(255 * this._fadeIn / 34); }
        if (this._blackT > 0) { this._blackT--; this._shade.opacity = Math.round(255 * (1 - this._blackT / this._blackLen)); }
        if (this._waveT) {   // the great wave: white, then black
            this._waveT++;
            if (this._waveT < 14) this._white.opacity = Math.min(255, this._waveT * 20);
            else { this._white.opacity = Math.max(0, 255 - (this._waveT - 14) * 30); this._shade.opacity = 255; }
            if (this._waveT === 16) { AudioManager.stopBgm(); AudioManager.stopBgs(); stopExtra(0); for (const r of this._fx.rain) r.visible = false; }
            if (this._waveT > 26) { this._waveT = 0; this.next(); }
            return;
        }
        if (this._out) {   // leaving the scene: to black, then the next one
            const len = this._outLen || 34;
            this._out++;
            this._black.opacity = Math.round(255 * Math.min(1, this._out / len));
            if (this._out >= len) { this._outLen = 0; this.beginScene(this._index + 1); }
            return;
        }
        if (this._lineMax) {   // a line on the screen: its time, or O / a click
            this._lineT++;
            const okNow = this._lineT > 8 && this._okNow;
            if (okNow) this._okNow = false;
            if (this._lineT >= this._lineMax || okNow) this.lineDone();
            return;
        }
        if (this._wait > 0) { this._wait--; if (this._wait === 0) this.next(); }
    };

    // ------------------------------------------------------------------
    // Scene_HeroName: „Jak masz na imię?” (the graphite panel over the blurred title picture)
    // ------------------------------------------------------------------
    const LETTERS = Array.from("AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ-");
    const COLS = 11, MAXLEN = 12, DEFAULT_NAME = "Reid";
    const RANDOM = ["Jaś", "Antek", "Wojtek", "Bartek", "Staś", "Kuba", "Franek", "Józek", "Maciek", "Tomek", "Szymek", "Witek"];
    const TYPABLE = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźżÀ-ÿ' -]$/;
    const NAV = new Set(["w", "a", "s", "d", "o", "p"]);
    const PX = 290, PY = 110, PW = 700, PH = 500;
    const FIELD = { x: 130, y: 118, w: 440, h: 62 };
    const GRID = { x: 53, y: 226, cw: 54, ch: 48 };
    const BUTTONS = [["case", "Aa", 70], ["space", "Spacja", 108], ["del", "Cofnij", 108], ["random", "Losuj", 108], ["done", "Gotowe", 150]];
    const BTN_Y = 386;

    function Scene_HeroName() {
        this.initialize(...arguments);
    }
    Scene_HeroName.prototype = Object.create(Scene_Base.prototype);
    Scene_HeroName.prototype.constructor = Scene_HeroName;
    Scene_HeroName.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        const TS = window.TitleScreen, img = (TS && TS.IMAGE) || $dataSystem.title1Name;
        this._bg = new Sprite(ImageManager.loadTitle1(img));
        if (PIXI.filters && PIXI.filters.BlurFilter) this._bg.filters = [new PIXI.filters.BlurFilter(6)];
        this.addChild(this._bg);
        const dim = new Sprite(dotPic("rgba(8,6,4,0.58)", W, H));
        this.addChild(dim);
        this._panel = new Sprite(new Bitmap(PW, PH));
        this._panel.x = PX; this._panel.y = PY;
        this.addChild(this._panel);
        this._keys = new Sprite(new Bitmap(W, 40));
        this._keys.y = H - 56;
        this.addChild(this._keys);
        this._name = [];
        this._focus = "field";
        this._gi = 0;              // grid / buttons index
        this._upper = true;
        this._caseManual = false;
        this._t = 0;
        this._ignore = 12;
        this._dirty = true;
        this._onKey = this.onKey.bind(this);
    };
    Scene_HeroName.prototype.start = function() {
        Scene_Base.prototype.start.call(this);
        window.addEventListener("keydown", this._onKey, true);
        this.startFadeIn(this.fadeSpeed(), false);
    };
    Scene_HeroName.prototype.terminate = function() {
        Scene_Base.prototype.terminate.call(this);
        window.removeEventListener("keydown", this._onKey, true);
    };
    Scene_HeroName.prototype.text = function() { return this._name.join(""); };
    Scene_HeroName.prototype.add = function(ch) {
        if (this._name.length >= MAXLEN) { SoundManager.playBuzzer(); return; }
        if (ch === " " && (!this._name.length || this._name[this._name.length - 1] === " ")) return;
        this._name.push(ch);
        if (!this._caseManual) this._upper = false;
        SoundManager.playCursor();
        this._dirty = true;
    };
    Scene_HeroName.prototype.del = function() {
        if (!this._name.length) { this.back(); return; }
        this._name.pop();
        if (!this._name.length && !this._caseManual) this._upper = true;
        SoundManager.playCancel();
        this._dirty = true;
    };
    Scene_HeroName.prototype.back = function() {
        if (this._leaving) return;
        this._leaving = true;
        SoundManager.playCancel();
        SceneManager.goto(Scene_Title);
    };
    Scene_HeroName.prototype.done = function() {
        if (this._leaving) return;
        let n = this.text().trim().replace(/\s+/g, " ");
        if (!n) n = DEFAULT_NAME;
        n = n.charAt(0).toLocaleUpperCase("pl") + n.slice(1);
        $gameActors.actor(1).setName(n);
        api.chosenName = n;
        this._leaving = true;
        SoundManager.playOk();
        this.startFadeOut(30, false);
        SceneManager.goto(Scene_Prologue);
    };
    Scene_HeroName.prototype.button = function(id) {
        if (id === "case") { this._upper = !this._upper; this._caseManual = true; SoundManager.playCursor(); this._dirty = true; }
        else if (id === "space") this.add(" ");
        else if (id === "del") this.del();
        else if (id === "random") { this._name = Array.from(RANDOM[Math.floor(Math.random() * RANDOM.length)]); this._upper = false; SoundManager.playCursor(); this._dirty = true; }
        else if (id === "done") this.done();
    };
    // the keyboard: in the field every letter types (W A S D O P too); in the grid those six steer and the rest type into the field
    Scene_HeroName.prototype.onKey = function(e) {
        if (this._leaving || this._ignore > 0) return;
        const k = e.key, inField = this._focus === "field";
        let used = true;
        if (k === "Backspace") this.del();
        else if (k === "Enter") this.done();
        else if (inField && k === "Escape") this.del();
        else if (inField && (k === "ArrowDown" || k === "Tab")) { this._focus = "grid"; this._gi = 0; SoundManager.playCursor(); this._dirty = true; }
        else if (k && k.length === 1 && TYPABLE.test(k) && (inField || !NAV.has(k.toLowerCase()))) {
            if (!inField) { this._focus = "field"; this._dirty = true; }
            this.add(k);
        } else used = false;
        if (used) { e.preventDefault(); e.stopImmediatePropagation(); }
    };
    Scene_HeroName.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        this._t++;
        if (this._ignore > 0) { this._ignore--; }
        else if (!this._leaving) this.updateInput();
        if (this._dirty) { this._dirty = false; this.redraw(); this.drawKeys(); }
        else if (this._t % 30 === 0) this.redraw();   // (the caret blinks)
    };
    Scene_HeroName.prototype.updateInput = function() {
        if (TouchInput.isTriggered()) { this.onClick(TouchInput.x - PX, TouchInput.y - PY); return; }
        if (TouchInput.isCancelled()) { this.del(); return; }
        if (this._focus === "field") return;   // (the field is the DOM listener's)
        const nGrid = LETTERS.length, inGrid = this._focus === "grid";
        let i = this._gi;
        if (Input.isRepeated("left")) i = inGrid ? (i % COLS === 0 ? i + Math.min(COLS, nGrid - i) - 1 : i - 1) : (i + BUTTONS.length - 1) % BUTTONS.length;
        else if (Input.isRepeated("right")) i = inGrid ? ((i % COLS === COLS - 1 || i === nGrid - 1) ? i - (i % COLS) : i + 1) : (i + 1) % BUTTONS.length;
        else if (Input.isRepeated("down")) {
            if (inGrid) { if (i + COLS < nGrid) i += COLS; else { this._focus = "buttons"; i = Math.min(BUTTONS.length - 1, Math.floor((i % COLS) / 2.4)); } }
        } else if (Input.isRepeated("up")) {
            if (inGrid) { if (i >= COLS) i -= COLS; else { this._focus = "field"; } }
            else { this._focus = "grid"; i = Math.min(nGrid - 1, 2 * COLS + Math.round(i * 2.4)); }
        } else if (Input.isTriggered("keyEnter")) { this.done(); return; }
        else if (Input.isTriggered("ok")) {
            if (inGrid) this.add(this._upper ? LETTERS[i] : LETTERS[i].toLocaleLowerCase("pl"));
            else this.button(BUTTONS[i][0]);
            return;
        } else if (Input.isTriggered("escape") || Input.isTriggered("cancel")) { this.del(); return; }
        else return;
        if (i !== this._gi || this._focus !== (inGrid ? "grid" : "buttons")) { SoundManager.playCursor(); this._dirty = true; }
        this._gi = i;
    };
    Scene_HeroName.prototype.cellRect = function(i) {
        return { x: GRID.x + (i % COLS) * GRID.cw, y: GRID.y + Math.floor(i / COLS) * GRID.ch, w: GRID.cw - 6, h: GRID.ch - 8 };
    };
    Scene_HeroName.prototype.buttonRects = function() {
        const total = BUTTONS.reduce((a, b) => a + b[2], 0) + 10 * (BUTTONS.length - 1);
        let x = (PW - total) / 2;
        return BUTTONS.map(b => { const r = { x, y: BTN_Y, w: b[2], h: 38 }; x += b[2] + 10; return r; });
    };
    Scene_HeroName.prototype.onClick = function(x, y) {
        const inside = (r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
        if (inside(FIELD)) { this._focus = "field"; this._dirty = true; return; }
        for (let i = 0; i < LETTERS.length; i++) if (inside(this.cellRect(i))) { this._focus = "grid"; this._gi = i; this.add(this._upper ? LETTERS[i] : LETTERS[i].toLocaleLowerCase("pl")); return; }
        const br = this.buttonRects();
        for (let i = 0; i < br.length; i++) if (inside(br[i])) { this._focus = "buttons"; this._gi = i; this._dirty = true; this.button(BUTTONS[i][0]); return; }
    };
    Scene_HeroName.prototype.redraw = function() {
        const b = this._panel.bitmap, ctx = b.context;
        b.clear();
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.4)"; rr(ctx, 3, 7, PW - 4, PH - 8, 14); ctx.fill();
        ctx.fillStyle = "rgba(20,21,24,0.94)"; rr(ctx, 0, 0, PW - 4, PH - 8, 14); ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 1; rr(ctx, 0.5, 0.5, PW - 5, PH - 9, 14); ctx.stroke();
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = font(36, "serif", "600"); ctx.fillStyle = C.text; ctx.fillText("Jak masz na imię?", PW / 2, 46);
        ctx.font = font(17); ctx.fillStyle = C.muted; ctx.fillText("Tak będą cię wołać matka, dziadek i wszyscy na wyspie.", PW / 2, 84);
        // the field
        const F = FIELD, on = this._focus === "field";
        ctx.fillStyle = C.cell; rr(ctx, F.x, F.y, F.w, F.h, 8); ctx.fill();
        ctx.strokeStyle = on ? C.accent : C.line; ctx.lineWidth = on ? 2 : 1; rr(ctx, F.x + 0.5, F.y + 0.5, F.w - 1, F.h - 1, 8); ctx.stroke();
        ctx.fillStyle = C.accent; ctx.fillRect(F.x + 16, F.y + F.h - 10, F.w - 32, 1);
        const name = this.text();
        ctx.font = font(36, "bold", "bold"); ctx.fillStyle = name ? C.text : "#5e5a54";
        const shown = name || DEFAULT_NAME, tw = ctx.measureText(shown).width;
        ctx.fillText(shown, PW / 2, F.y + F.h / 2 - 2);
        if (on && Math.floor(this._t / 30) % 2 === 0) { ctx.fillStyle = C.accent; ctx.fillRect(PW / 2 + (name ? tw / 2 : -tw / 2 - 6) + 4, F.y + 14, 2, F.h - 30); }
        ctx.font = font(14); ctx.textAlign = "left"; ctx.fillStyle = C.dim;
        ctx.fillText(on ? "Pisz z klawiatury (także ą ć ę ł ń ó ś ź ż)  ·  ↓ litery na ekranie" : "Litery: W/S/A/D lub strzałki, O wpisz  ·  ↑ do pola", F.x + 2, F.y + F.h + 18);
        ctx.textAlign = "right"; ctx.fillStyle = C.muted; ctx.fillText(this._name.length + " / " + MAXLEN, F.x + F.w - 2, F.y + F.h + 18);
        // the letters
        ctx.textAlign = "center";
        LETTERS.forEach((L, i) => {
            const r = this.cellRect(i), sel = this._focus === "grid" && this._gi === i;
            ctx.fillStyle = sel ? C.cellOn : C.cell; rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.fill();
            ctx.strokeStyle = sel ? C.accent : "rgba(52,54,60,1)"; ctx.lineWidth = sel ? 2 : 1; rr(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 6); ctx.stroke();
            ctx.font = sel ? font(21, "bold", "bold") : font(20); ctx.fillStyle = sel ? C.text : "#cfc9bd";
            ctx.fillText(this._upper ? L : L.toLocaleLowerCase("pl"), r.x + r.w / 2, r.y + r.h / 2 + 1);
        });
        // the buttons
        this.buttonRects().forEach((r, i) => {
            const [id, label] = BUTTONS[i], sel = this._focus === "buttons" && this._gi === i, main = id === "done";
            ctx.fillStyle = main ? C.accent : sel ? C.cellOn : C.cell; rr(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
            if (!main || sel) { ctx.strokeStyle = sel ? (main ? "#fff0b8" : C.accent) : C.line; ctx.lineWidth = sel ? 2 : 1; rr(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 8); ctx.stroke(); }
            ctx.font = main || sel ? font(17, "bold", "bold") : font(17); ctx.fillStyle = main ? C.onAccent : C.text;
            ctx.fillText(id === "case" ? (this._upper ? "Aa" : "aA") : label, r.x + r.w / 2, r.y + r.h / 2 + 1);
        });
        ctx.font = font(14); ctx.fillStyle = "#77736b"; ctx.fillText("Puste pole = „" + DEFAULT_NAME + "”", PW / 2, PH - 34);
        ctx.restore();
        b._baseTexture.update();
    };
    Scene_HeroName.prototype.drawKeys = function() {
        const b = this._keys.bitmap, ctx = b.context;
        b.clear();
        const pairs = this._focus === "field" ? [["A–Ż", "pisz"], ["Backspace", "cofnij"], ["↓", "litery"], ["Enter", "gotowe"], ["Esc", "wróć"]]
            : [["W/S/A/D", "litera"], ["O", "wpisz"], ["P", "cofnij literę"], ["Enter", "gotowe"]];
        ctx.save();
        ctx.font = font(14); ctx.textBaseline = "middle";
        const widths = pairs.map(([k, l]) => Math.max(24, ctx.measureText(k).width + 14) + 6 + ctx.measureText(l).width);
        let x = (W - (widths.reduce((a, c) => a + c, 0) + 22 * (pairs.length - 1))) / 2;
        pairs.forEach(([k, l], i) => {
            const kw = Math.max(24, ctx.measureText(k).width + 14);
            ctx.fillStyle = "rgba(20,21,24,0.7)"; rr(ctx, x, 9, kw, 22, 4); ctx.fill();
            ctx.strokeStyle = "rgba(90,92,100,0.8)"; ctx.lineWidth = 1; rr(ctx, x + 0.5, 9.5, kw - 1, 21, 4); ctx.stroke();
            ctx.fillStyle = C.text; ctx.textAlign = "center"; ctx.fillText(k, x + kw / 2, 20);
            ctx.fillStyle = C.muted; ctx.textAlign = "left"; ctx.fillText(l, x + kw + 6, 20);
            x += widths[i] + 22;
        });
        ctx.restore();
        b._baseTexture.update();
    };

    // ------------------------------------------------------------------
    // „Nowa gra” on the title: the name, then the film (a new game from anywhere else - the tests, the debug - starts as before)
    // ------------------------------------------------------------------
    Scene_Title.prototype.commandNewGame = function() {
        DataManager.setupNewGame();
        this._commandWindow.close();
        this.startFadeOut(this.fadeSpeed(), false);
        SceneManager.goto(Scene_HeroName);
    };

    // ------------------------------------------------------------------
    // For tests
    // ------------------------------------------------------------------
    api.Scene_Prologue = Scene_Prologue;
    // (2026-10-16) the film again, from the map (F9's "Odtwórz prolog"): pushed over the map scene, popped back after it
    api.replay = () => {
        if (!(SceneManager._scene instanceof Scene_Map)) return false;
        SceneManager.push(Scene_Prologue);
        SceneManager.prepareNextScene({ replay: true });
        return true;
    };
    api.Scene_HeroName = Scene_HeroName;
    api.info = function() {
        const s = SceneManager._scene;
        if (s instanceof Scene_HeroName) {
            return { screen: "name", name: s.text(), focus: s._focus, index: s._gi, upper: s._upper, letters: LETTERS.join(""), leaving: !!s._leaving };
        }
        if (s instanceof Scene_Prologue) {
            const B = s._bust;
            return { screen: "film", scene: s._scene ? s._scene.id : null, index: s._index, step: s._step, log: s._log.slice(), lines: s._lines,
                bubble: s._bubble ? s._bubble.text : null, hold: s._holdT, ending: !!s._ending, out: s._out, busts: { on: B.on, speaking: B.speaking, hero: s._busts && s._busts.hero.visible ? (s._busts.hero.bitmap === s._bustPics.heroLad ? "Hero_Bust_Lad" : "Hero_Bust") : null },
                fx: { parts: s._fx.parts.length, rain: s._fx.rain.length, glows: s._fx.glows.length, mist: s._fx.mist.length, rot: +s._world.rotation.toFixed(4) },
                cam: s._cam.now.map(v => +v.toFixed(3)), skipped: s._skipped || 0,
                flags: s._fx.flags.map(f => ({ pic: f.def.pic, moved: +f.moved.toFixed(1), x: f.plane.x, y: f.plane.y })),
                boy: s._boy ? { seq: s._boy.seq, frame: s._boy.frame, frames: s._boy.frames, played: s._boy.played.slice(),
                    x: Math.round(s._boy.sp.x), y: Math.round(s._boy.sp.y), head: s.boyHead().map(Math.round) } : null };
        }
        return null;
    };
})();
