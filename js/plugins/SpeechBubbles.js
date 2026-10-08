//=============================================================================
// SpeechBubbles.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Rozmowy w dymkach: tekst wiadomości w dymku nad postacią, która mówi, a w rozmowie z postacią z popiersiem - popiersia w rogach ekranu i dymek z popiersia mówiącego. Krótkie okrzyki postaci. v1.4.0
 * @author Claude
 * @base TawernaCore
 * @base TawernaUI
 * @orderAfter TawernaCore
 * @orderAfter TawernaUI
 *
 * @param heroSide
 * @text Strona bohatera w rozmowie
 * @type select
 * @option right
 * @option left
 * @desc W którym dolnym rogu stoi popiersie bohatera; rozmówca po drugiej stronie.
 * @default right
 *
 * @help
 * Na mapie każda wiadomość (polecenie "Pokaż tekst") pojawia się w dymku nad
 * tym, kto mówi, zamiast w oknie na dole ekranu. Ogonek dymka wskazuje
 * mówiącego. Kto mówi:
 *  - wiadomość z twarzą bohatera (pierwszej osoby w drużynie) - gracz;
 *  - wiadomość z inną twarzą - zdarzenie, które ją pokazuje (np. Borgar);
 *  - wiadomość bez twarzy (opis, myśl, pytanie "Położyć się spać?") - gracz.
 * Twarzy w dymku nie ma. Wybory ("Pokaż wybory") pojawiają się obok dymka.
 * Gdy nad głową nie ma miejsca, dymek staje obok postaci (ogonek w bok),
 * a gdy i tam go brak - pod stopami (ogonek w górę).
 *
 * Rozmowa z popiersiami: gdy mówi postać, która ma popiersie (duży obrazek
 * z img/pictures), albo bohater w rozmowie z taką postacią, w dolnych
 * rogach ekranu wysuwają się popiersia: bohater po jednej stronie,
 * rozmówca po drugiej. Mówiący jest jasny i ma tabliczkę z imieniem,
 * słuchający jest przyciemniony. Dymek wychodzi z popiersia mówiącego
 * (ogonek do ust), a nad mówiącym na mapie miga żółta strzałka (nad
 * dymkiem, gdy ten go zasłania). Wiersze tekstu zostają takie, jak je napisano, jeśli mieszczą
 * się między popiersiami; dłuższe łamią się tak, by tekst zmieścił się
 * w jednym dymku. Wybory odpowiedzi stają w dymku bohatera, przy jego
 * popiersiu. Na czas rozmowy znika pasek doświadczenia z prawego dolnego
 * rogu. Po rozmowie popiersia się chowają.
 *
 * Strony: bohater po prawej, rozmówca po lewej (parametr heroSide).
 *
 * Kto ma popiersie:
 *  - postać z arkusza RTP Actor1-3 / People1-4 (także nasze kopie _Tall)
 *    o indeksie i ma obrazek <Arkusz>_<i+1>, np. People3_Tall 4 -> People3_5;
 *  - postacie z własnych arkuszy według tabeli w tej wtyczce (BUSTS),
 *    np. dziadek Stach ($Npc_Dziadek) -> Stach_Bust, mieszkańcy miasteczka
 *    i Podgrodzia, Lord i jego ludzie ($Npc_Soltys -> Soltys_Bust itd.);
 *  - znacznik w notatce zdarzenia albo w komentarzu na jego stronie:
 *      <Bust:Nazwa>      popiersie img/pictures/Nazwa.png
 *      <Bust:none>       bez popiersia (zwykły dymek nad głową)
 *      <BustName:Imię>   imię na tabliczce (inaczej: nazwa zdarzenia)
 *  - bohater: Hero_Bust (wygląd z HeroLook.js), inaczej obrazek aktora
 *    z ActorPictures.
 * Brak pliku oznacza po prostu brak popiersia. Postacie bez popiersia
 * (zwierzęta, drzwi, przypadkowi goście) i okrzyki zostają przy dymku nad
 * głową.
 *
 * Kod w tekście wiadomości (w grze niewidoczny) wskazuje mówiącego wprost:
 *   \SPK[0]    gracz
 *   \SPK[5]    zdarzenie nr 5 na tej mapie
 *   \SPK[-1]   zwykłe okno na dole ekranu, bez dymka (i bez popiersi)
 * W bitwie i poza mapą wiadomości są w zwykłym oknie; tak samo, gdy mówiący
 * bez popiersia jest poza ekranem (popiersia wtedy się chowają).
 *
 * Dla innych wtyczek:
 *   SpeechBubbles.say(postać, "tekst", klatki)
 * krótki dymek nad postacią ($gamePlayer albo zdarzenie), który po chwili
 * sam znika i nie zatrzymuje gry (np. "Idzie burza..." z Survival.js).
 * Klatki można pominąć: czas zależy wtedy od długości tekstu.
 *   SpeechBubbles.bustOf(postać), heroBust(), hasBust(nazwa), bustBitmap(nazwa)
 * popiersie postaci i jego obrazek (ten sam, co w mini-grach: Tawerna.ui).
 * Bywalcy tawerny (Borgar, Melia, Grum, Ozzy, Wanda) mają własne popiersia
 * (Borgar_Bust...) pod starymi nazwami RTP (People3_5...): bustFile(nazwa).
 *
 * KOLEJNOŚĆ: pod TawernaCore.js i TawernaUI.js.
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("SpeechBubbles.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const ui = T.ui;
    if (!ui || !ui.loadBust) throw new Error("SpeechBubbles.js: brak TawernaUI.js - musi być wyżej na liście wtyczek (the UI kit is missing)");
    const PLUGIN = "SpeechBubbles";

    const MAX_W = 760;                              // the widest a bubble's text gets (px)
    const TAIL = { w: 18, h: 14, inset: 20 };       // the tail: base width, length, how near the corners its base may go
    const GAP = 2;                                  // px between the tail's tip and the speaker's head (or feet)
    const EDGE = 8;                                 // px kept free at the screen's edges
    const CUT = 5;                                  // the cut corners of the panel (as the windows)
    const BARK = { font: 20, line: 28, padX: 14, padY: 7, fadeIn: 10, fadeOut: 18 };
    const FILL = "rgba(11,12,15,0.72)";            // the panel: a little see-through (user, 2026-09-27: "trochę przezroczyste")
    // talks with busts (user, 2026-09-27: mock-ups docs/postacie/makieta2_*.png)
    // which bottom corner the hero's bust takes in a talk (user, 2026-09-29: the hero right, the other left)
    const HERO_SIDE = String((PluginManager.parameters(PLUGIN) || {}).heroSide || "right").trim().toLowerCase() === "left" ? "left" : "right";
    const NPC_SIDE = HERO_SIDE === "left" ? "right" : "left";
    const sideName = side => (side === HERO_SIDE ? talk.hero : talk.npc);   // (the bust shown on a side now)
    const TALK = {
        height: 273,                 // the busts on the screen: 330 x 350 files at 0.78 (any file is scaled to this height)
        top: 250,                    // a bubble's top at most this far above the screen's bottom (a taller one goes higher)
        text: 540,                   // lines too long for the room between the busts are broken to this width (px; Story's lines
                                     // are as wide) - wider only when that keeps the text to one bubble
        lines: 4,                    // lines in a bubble (more: the next page)
        gap: 8,                      // px between a bubble and its bust
        mouth: { x: 90, y: 158 },    // where the tail points: px of the file from the bust's inner edge and from its top
        tail: 22,                    // the tail's base (px)
        slide: 12, fade: 8,          // frames: a bust slides in / out; the bright-dim swap and the cross-fade to another bust
        dim: 0.45,                   // the listener's brightness
        hold: 24,                    // frames without a message (a wait, a move route) before the busts go
        plate: { font: 20, h: 26, up: 15, pad: 12, inset: 14 }   // the name plate on the bubble's top edge, by the bust
    };
    const RTP_BUST = /^(Actor[1-3]|People[1-4])_[1-8]$/;        // the RTP busts in img/pictures (all there)
    const RTP_SHEET = /^(Actor[1-3]|People[1-4])(?:_Tall)?$/;   // their map sheets (_Tall: our stretched copies)
    // "sheet:index" -> bust, for sheets of our own: grandpa, then the residents (TownLife; RTP busts repainted by
    // tools/busts/make_<key>.py, 2026-10-06 - a file not there means no bust, the bubble over the head as before)
    const BUSTS = { "$Npc_Dziadek:0": "Stach_Bust" };
    ["Kowal", "Piekarka", "Woziwoda", "Kapral", "Dzwonnik", "Kupiec", "Soltys", "Garbarz", "Feliks", "Lord", "Kamerdyner",
        "Straznik", "Bronek", "Zosia", "Ludmila", "Ela", "Rafal", "Praczka", "Franek", "Drwal", "Klusownik", "Znachorka",
        "Szmaciarz", "Uchodzca", "Zebrak", "Zlodziej", "Gracz", "Bartek", "Woznica", "Marek"].forEach(k => { BUSTS["$Npc_" + k + ":0"] = k + "_Bust"; });
    // the tavern regulars' RTP busts did not look like their map sheets ($Npc_Borgar...): drawn anew (tools/busts/make_<key>.py,
    // 2026-10-07). Their old names stay the keys (event tags, the plugins' data, the tests); the picture loaded for one is the new
    // file once it is found there (Tawerna.ui.loadBust asks bustFile; a file not there - the RTP picture as before)
    const RENAMED = { People3_5: "Borgar_Bust", People2_8: "Melia_Bust", Actor2_5: "Grum_Bust", People2_1: "Ozzy_Bust", People1_6: "Wanda_Bust" };
    const HERO_BUST = "Hero_Bust";                              // the hero while HeroLook's peasant look is on
    const FACES_RIGHT = new Set();                              // busts drawn facing right (the RTP ones face left)
    const HERO_NAME = "Ty";

    const style = () => ui.style();   // (UITheme.js's UIStyle; without it the kit's plain one - the same colours)
    const easeOut = ui.ease.out;
    const ON_MAP = { only: ["onMap"] };   // (the core's "calm" check: the scene is the map)

    // ------------------------------------------------------------------
    // The picture: a panel like the windows (cut corners, a thin grey line, yellow brackets on two corners) with a tail on one
    // edge, pointing at the speaker. tail = { edge: "bottom" | "top" | "left" | "right", base, tipX, tipY, w }: base = the middle
    // of the tail's root along that edge (px from the panel's left or top), the tip in the bitmap's px, w its base width; no tail:
    // a plain panel. The panel starts at off = { ox, oy } in the bitmap (by default the bitmap is the panel plus TAIL.h on the
    // tail's side).
    // ------------------------------------------------------------------
    const tailOffset = edge => ({ ox: edge === "left" ? TAIL.h : 0, oy: edge === "top" ? TAIL.h : 0 });
    const bubbleSize = (w, h, edge) => (edge === "left" || edge === "right" ? { bw: w + TAIL.h, bh: h } : { bw: w, bh: h + TAIL.h });
    function paintBubble(bmp, w, h, tail, off) {
        const ctx = bmp.context, S = style(), c = CUT, e = tail ? tail.edge : "", hw = ((tail && tail.w) || TAIL.w) / 2;
        const { ox, oy } = off || tailOffset(e), L0 = ox + 0.5, T0 = oy + 0.5, R0 = ox + w - 0.5, B0 = oy + h - 0.5;
        const tip = () => ctx.lineTo(tail.tipX, tail.tipY);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(L0 + c, T0);
        if (e === "top") { ctx.lineTo(ox + tail.base - hw, T0); tip(); ctx.lineTo(ox + tail.base + hw, T0); }
        ctx.lineTo(R0 - c, T0);
        ctx.lineTo(R0, T0 + c);
        if (e === "right") { ctx.lineTo(R0, oy + tail.base - hw); tip(); ctx.lineTo(R0, oy + tail.base + hw); }
        ctx.lineTo(R0, B0 - c);
        ctx.lineTo(R0 - c, B0);
        if (e === "bottom") { ctx.lineTo(ox + tail.base + hw, B0); tip(); ctx.lineTo(ox + tail.base - hw, B0); }
        ctx.lineTo(L0 + c, B0);
        ctx.lineTo(L0, B0 - c);
        if (e === "left") { ctx.lineTo(L0, oy + tail.base + hw); tip(); ctx.lineTo(L0, oy + tail.base - hw); }
        ctx.lineTo(L0, T0 + c);
        ctx.closePath();
        ctx.fillStyle = FILL;
        ctx.fill();
        ctx.strokeStyle = S.line;
        ctx.lineWidth = 1;
        ctx.stroke();
        // the yellow brackets of the windows: top-left and bottom-right
        const L = Math.max(3, Math.min(10, w / 4, h / 2 - c)), x0 = ox, y0 = oy, x1 = ox + w, y1 = oy + h;
        ctx.strokeStyle = S.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0 + 1, y0 + c + L); ctx.lineTo(x0 + 1, y0 + c); ctx.lineTo(x0 + c, y0 + 1); ctx.lineTo(x0 + c + L, y0 + 1);
        ctx.moveTo(x1 - 1, y1 - c - L); ctx.lineTo(x1 - 1, y1 - c); ctx.lineTo(x1 - c, y1 - 1); ctx.lineTo(x1 - c - L, y1 - 1);
        ctx.stroke();
        ctx.restore();
        bmp._baseTexture.update();
    }
    // where a w x h panel goes for a speaker (head: headOf): above the head (the tail down to it); with no room there, beside
    // the face (right, else left; the tail sideways); else under the feet (the tail up). keep: rects it keeps clear of across (the
    // busts in a talk; window-layer px) where it would meet them. -> { x, y, tail } (the panel's top-left)
    const SIDE_GAP = 14;   // px from the head's middle to the tail's tip, sideways
    function placePanel(w, h, head, keep) {
        const W = Graphics.boxWidth, H = Graphics.boxHeight;
        const band = y => spanAcross(y, h, w, keep);
        const clampX = (x, y) => { const b = band(y); return Math.max(b.lo, Math.min(b.hi - w, Math.round(x))); };
        const clampY = y => Math.max(EDGE, Math.min(H - EDGE - h, Math.round(y)));
        const root = (size, point) => Math.max(TAIL.inset, Math.min(size - TAIL.inset, Math.round(point)));
        if (head.top - GAP - TAIL.h - h >= EDGE) {
            const y = Math.round(head.top - GAP - TAIL.h - h), x = clampX(head.x - w / 2, y);
            const tipX = Math.max(CUT + 2, Math.min(w - CUT - 2, Math.round(head.x - x)));
            return { x, y, tail: { edge: "bottom", base: root(w, tipX), tipX, tipY: h + TAIL.h } };
        }
        const faceY = head.top + Math.min(20, (head.foot - head.top) / 3);   // (level with the face)
        const sy = clampY(faceY - Math.min(h / 2, 26)), b = band(sy);
        const rightX = head.x + SIDE_GAP + TAIL.h, leftX = head.x - SIDE_GAP - TAIL.h - w;
        const onRight = rightX + w <= b.hi;
        if (onRight || leftX >= b.lo) {
            const x = Math.round(onRight ? rightX : leftX), at = Math.round(faceY - sy);
            const tipY = Math.max(2, Math.min(h - 2, at));
            return { x, y: sy, tail: { edge: onRight ? "left" : "right", base: root(h, at), tipX: onRight ? 0 : w + TAIL.h, tipY } };
        }
        const y = Math.min(H - EDGE - h, Math.round(head.foot + GAP + TAIL.h)), x = clampX(head.x - w / 2, y);
        const tipX = Math.max(CUT + 2, Math.min(w - CUT - 2, Math.round(head.x - x)));
        return { x, y, tail: { edge: "top", base: root(w, tipX), tipX, tipY: 0 } };
    }
    // the room across for a w px wide panel from y to y + h: the screen less the rects of keep it would meet (one on the left half
    // of the screen bounds it on the left, one on the right on the right) -> { lo, hi }; no room for it between them: the screen
    function spanAcross(y, h, w, keep) {
        const W = Graphics.boxWidth;
        let lo = EDGE, hi = W - EDGE;
        for (const r of keep || []) {
            if (y + h <= r.y || y >= r.y + r.h) continue;
            if (r.x + r.w / 2 < W / 2) lo = Math.max(lo, r.x + r.w + EDGE);
            else hi = Math.min(hi, r.x - EDGE);
        }
        return hi - lo >= w ? { lo, hi } : { lo: EDGE, hi: W - EDGE };
    }
    // a sprite's picture swapped for a new one (the old one freed); the frame is the whole new picture (Sprite keeps the x and y
    // of a frame set before)
    function swapBitmap(sprite, bmp) {
        const old = sprite.bitmap;
        sprite.bitmap = bmp;
        sprite.setFrame(0, 0, bmp.width, bmp.height);
        if (old && old !== bmp) old.destroy();
    }

    // ------------------------------------------------------------------
    // Where a character is on the screen: just above its head, and its feet (window-layer coordinates; the map may be zoomed)
    // ------------------------------------------------------------------
    function spriteOf(ch) {
        const set = SceneManager._scene && SceneManager._scene._spriteset;
        // (a character with a sprite of its own in the tilemap - RoamingActor: the men of Humans.js, the creatures of Creatures.js)
        if (ch && ch._sprite && ch._sprite._character === ch && ch._sprite.parent) return ch._sprite;
        return set && set._characterSprites ? set._characterSprites.find(s => s._character === ch) : null;
    }
    function layerOffset() {
        const layer = SceneManager._scene && SceneManager._scene._windowLayer;
        return { x: layer ? layer.x : 0, y: layer ? layer.y : 0 };
    }
    function headOf(ch) {
        const s = spriteOf(ch);
        if (!s || !s.bitmap || !s.parent) return null;
        const h = typeof s.patternHeight === "function" ? s.patternHeight() : 48;
        const off = layerOffset();
        const top = s.toGlobal(new Point(0, -h)), foot = s.toGlobal(new Point(0, 0));
        return { x: top.x - off.x, top: top.y - off.y, foot: foot.y - off.y };
    }
    const onScreen = p => !!p && p.x >= 0 && p.x <= Graphics.boxWidth && p.foot >= 0 && p.top <= Graphics.boxHeight;

    // ------------------------------------------------------------------
    // Who speaks: "Pokaż tekst" notes the event running it (and a \SPK[n] in the text); the face tells the rest
    // ------------------------------------------------------------------
    const _Game_Message_clear = Game_Message.prototype.clear;
    Game_Message.prototype.clear = function() {
        _Game_Message_clear.call(this);
        this._speaker = null;
    };
    const _command101 = Game_Interpreter.prototype.command101;
    Game_Interpreter.prototype.command101 = function(params) {
        const busy = $gameMessage.isBusy();
        const result = _command101.call(this, params);
        if (!busy && $gameMessage.hasText()) {
            const sp = { eventId: this.eventId() };
            $gameMessage._texts = $gameMessage._texts.map(t => t.replace(/\\SPK\[(-?\d+)\]/gi, (m, n) => { sp.forced = Number(n); return ""; }));
            $gameMessage._speaker = sp;
        }
        return result;
    };
    // the character the message comes from (wherever it stands), or null (\SPK[-1], off the map)
    function speakerFor(sp) {
        if (!T.isCalm(null, ON_MAP) || !$gameMap || !$gamePlayer) return null;
        if (sp.forced !== undefined) return sp.forced < 0 ? null : sp.forced === 0 ? $gamePlayer : $gameMap.event(sp.forced) || null;
        const face = $gameMessage.faceName(), lead = $gameParty.leader();
        if (!face || (lead && lead.faceName() === face && lead.faceIndex() === $gameMessage.faceIndex())) return $gamePlayer;
        return sp.eventId > 0 ? $gameMap.event(sp.eventId) || null : null;
    }
    // the character a bubble over the head points at, or null (the usual window)
    function speakerOf() {
        const ch = speakerFor($gameMessage._speaker || {});
        return ch && onScreen(headOf(ch)) ? ch : null;
    }

    // the size of a message's text, measured by a plain window (the message window's own measuring would already run its \. \! waits
    // and page breaks)
    let measurer = null;
    function measure(text) {
        if (!measurer) measurer = new Window_Base(new Rectangle(0, 0, MAX_W + 64, 640));
        return measurer.textSizeEx(text);
    }

    // ------------------------------------------------------------------
    // Busts: which picture a character has, and whether the file is there (no requests for files that are not: the RTP busts are
    // all in img/pictures, the others are asked for once - a missing one simply means no bust). Asked for only once the database is
    // loaded: before that it is not known whether the images are encrypted (Hero_Bust.png_ in a deployed game)
    // ------------------------------------------------------------------
    const found = new Map();     // bust -> true | false | null (being checked)
    let booted = false;          // (Scene_Boot has set the encryption info)
    function probe(name) {
        if (!name || !booted || RTP_BUST.test(name) || found.has(name)) return;
        found.set(name, null);
        const file = "img/pictures/" + name + ".png" + (Utils.hasEncryptedImages() ? "_" : "");
        if (Utils.isNwjs()) {
            try {
                const fs = require("fs"), path = require("path");
                found.set(name, fs.existsSync(path.join(path.dirname(process.mainModule.filename), file)));
                return;
            } catch (e) {}
        }
        fetch(Utils.encodeURI(file), { method: "HEAD", cache: "no-store" }).then(r => found.set(name, r.ok)).catch(() => found.set(name, false));
    }
    const hasBust = name => !!name && found.get(name) !== false && (RTP_BUST.test(name) || found.get(name) === true);
    const usable = name => (hasBust(name) ? name : (probe(name), null));
    // the file drawn for a bust's name (RENAMED: the regular's own bust when it is there)
    function bustFile(name) {
        const own = RENAMED[name];
        if (!own) return name;
        probe(own);
        return found.get(own) === true ? own : name;
    }
    ui.bustFile = bustFile;
    // the picture of a bust that is there, else null. Loaded by the kit (Tawerna.ui.loadBust: outside ImageManager's cache - a file
    // gone after all must not stop the game with a load error), so the talks and the mini-games' busts share one picture
    function bustBitmap(name) {
        if (!hasBust(name)) return null;
        const bmp = ui.loadBust(name);
        if (bmp.isError()) { found.set(name, false); return null; }
        return bmp;
    }
    // a tag of an event, read by the core: in a comment of its page, else in its note (<Bust:Name>, <Bust:none>, <BustName:...>);
    // an empty one does not count. (The page's comments go to the core as a new object each time: its tag cache is per object and
    // would not see a comment put into the page later - the tests do that.)
    function tagOf(ev, key) {
        const page = ev.page && ev.page(), data = ev.event && ev.event();
        const inPage = page ? T.tag({ list: page.list }, key) : null;
        if (inPage && inPage.raw) return inPage.raw;
        const inNote = data && data.note ? T.tag(data.note, key) : null;
        return inNote && inNote.raw ? inNote.raw : null;
    }
    function heroBust() {
        if (T.call("HeroLook", "active")) return usable(HERO_BUST);
        const a = $gameParty && $gameParty.leader();
        return usable(a && a.pictureName ? a.pictureName() : "");
    }
    // a character's bust (a picture name) or null
    function bustOf(ch) {
        if (!ch) return null;
        if (ch === $gamePlayer) return heroBust();
        if (!(ch instanceof Game_Event)) return null;
        const tag = tagOf(ch, "Bust");
        if (tag) return /^none$/i.test(tag) ? null : usable(tag);
        const sheet = ch.characterName(), index = ch.characterIndex(), own = BUSTS[sheet + ":" + index];
        if (own) return usable(own);
        const m = RTP_SHEET.exec(sheet);
        return m ? usable(m[1] + "_" + (index + 1)) : null;
    }
    // the name on the plate: the message's own speaker name, <BustName:...>, else the event's name
    function nameOf(ch) {
        const given = $gameMessage.speakerName();
        if (given) return given;
        if (ch === $gamePlayer) return HERO_NAME;
        const tag = tagOf(ch, "BustName");
        if (tag) return tag;
        const n = (ch.event && ch.event() && ch.event().name) || "";
        return /^EV\d*$/i.test(n) ? "" : n;
    }
    // the busts of our own asked for as soon as it is known how (before the first talk needs them)
    const _Scene_Boot_onDatabaseLoaded = Scene_Boot.prototype.onDatabaseLoaded;
    Scene_Boot.prototype.onDatabaseLoaded = function() {
        _Scene_Boot_onDatabaseLoaded.call(this);
        booted = true;
        [HERO_BUST].concat(Object.values(BUSTS), Object.values(RENAMED)).forEach(probe);
    };

    // ------------------------------------------------------------------
    // The talk: on while messages of a character with a bust (or the hero's words to one) come; the busts stay up between its
    // messages and go when the event is over (or waits a while, or the screen fades out). Only here - nothing of it is saved.
    // ------------------------------------------------------------------
    const talk = { on: false, owner: 0, partner: null, hero: null, npc: null, lit: null, speaker: null, idle: 0 };
    function endTalk() {
        Object.assign(talk, { on: false, partner: null, lit: null, speaker: null, idle: 0 });
    }
    // the message about to show in a talk -> { side: "hero" | "npc", partner }, else null (a bubble over the head)
    function talkFor(ch, sp) {
        if (!ch) return null;
        if (ch === $gamePlayer) {
            if (!heroBust()) return null;
            let partner = talk.on && talk.npc && talk.partner && $gameMap.events().includes(talk.partner) ? talk.partner : null;
            if (!partner) { const e = sp.eventId > 0 ? $gameMap.event(sp.eventId) : null; if (e && bustOf(e)) partner = e; }
            return partner ? { side: "hero", partner } : null;
        }
        return bustOf(ch) ? { side: "npc", partner: ch } : null;
    }
    // every map frame (the core's map clock): the talk ends once no message has come for a while, or as the screen goes dark (a fade
    // in counts as light - not the core's "fade" check)
    T.onMapUpdate(function talkTick() {
        if (!talk.on) return;
        if ($gameMessage.isBusy()) { talk.idle = 0; return; }
        talk.idle++;
        const running = $gameMap.isEventRunning() && $gameMap._interpreter.eventId() === talk.owner;
        const dark = $gameScreen.brightness() < 255 && !($gameScreen._fadeInDuration > 0);
        if ((talk.idle > 4 && !running) || talk.idle > TALK.hold || dark) endTalk();
    }, { owner: PLUGIN, name: "talk" });
    // where a side's bust stands (screen px) and where its tail points: { x, w, top, inner, tipX, tipY, has }
    function bustBox(side, name) {
        const bmp = name ? bustBitmap(name) : null, ready = !!bmp && bmp.isReady() && bmp.height > 0;
        const s = TALK.height / (ready ? bmp.height : 350), w = Math.round((ready ? bmp.width : 330) * s);
        const left = side === "left", x = left ? 0 : Graphics.width - w, top = Graphics.height - TALK.height, inner = left ? w : x;
        const mx = Math.round(TALK.mouth.x * s);
        return { x, w, top, inner, tipX: left ? inner - mx : inner + mx, tipY: top + Math.round(TALK.mouth.y * s), has: !!bmp };
    }
    // a bubble's top (screen px): level with the mouth, no higher than TALK.top above the bottom unless it is too tall for that
    const talkY = (h, tipY) => Math.round(Math.min(Graphics.height - EDGE - h, Math.max(Graphics.height - TALK.top, tipY - h / 2)));
    // a talk bubble: the w x h panel at (px, py) (screen px), its tail from the bust's side to tip (screen px; none: no tail) and
    // the name plate on its top edge by the bust -> { bmp, ox, oy } (the panel's top-left in the bitmap)
    function talkBubble(w, h, px, py, left, tip, name) {
        const len = tip ? Math.max(TAIL.h, left ? px - tip.x : tip.x - px - w) : 0, ox = left ? len : 0, oy = TALK.plate.up;
        const bmp = new Bitmap(w + len + 2, oy + h + 2);
        let tail = null;
        if (tip) {
            const at = Math.round(tip.y - py);
            tail = { edge: left ? "left" : "right", base: Math.max(TAIL.inset, Math.min(h - TAIL.inset, at)), tipX: left ? 1 : w + len, tipY: oy + at, w: TALK.tail };
        }
        paintBubble(bmp, w, h, tail, { ox, oy });
        if (name) paintPlate(bmp, ox, oy, w, left, name);
        return { bmp, ox, oy };
    }
    function paintPlate(bmp, ox, oy, w, left, name) {
        const P = TALK.plate, S = style(), ctx = bmp.context, r = plateRect(w, left, name), px = ox + r.x, py = oy + r.y;
        bmp.fontFace = $gameSystem.mainFontFace();
        bmp.fontSize = P.font;
        const theme = T.api("UITheme");   // (UIStyle)
        if (theme) theme.panel(ctx, px, py, r.w, r.h, { cut: 3, fill: S.solid, accent: false });
        else { ctx.fillStyle = S.solid || "#0b0c0f"; ctx.fillRect(px, py, r.w, r.h); }
        bmp.textColor = S.accent;
        bmp.outlineWidth = 0;
        bmp.drawText(name, px + P.pad, py, r.w - P.pad * 2, r.h, "left");
    }
    // a name plate's width (the name in the plate's font and its padding)
    let plateMeasurer = null;
    function plateWidth(name) {
        const b = plateMeasurer || (plateMeasurer = new Bitmap(8, 8));
        b.fontFace = $gameSystem.mainFontFace();
        b.fontSize = TALK.plate.font;
        return Math.ceil(b.measureTextWidth(name)) + TALK.plate.pad * 2;
    }
    // where the plate stands on a w px wide panel (px from the panel's top-left; it sits over the top edge by the bust)
    function plateRect(w, left, name) {
        const P = TALK.plate, pw = Math.min(w - P.inset * 2, plateWidth(name));
        return { x: left ? P.inset : w - P.inset - pw, y: -P.up, w: pw, h: P.h };
    }
    // the hero's bubble for choices after someone else's words: at his bust (screen px)
    function heroChoiceSlot(c) {
        const box = bustBox(HERO_SIDE, talk.on ? talk.hero : null);
        const x = HERO_SIDE === "left" ? box.inner + TALK.gap : box.inner - TALK.gap - c.w;
        return { x, y: talkY(c.h, box.tipY), w: c.w, h: c.h, own: true, box };
    }
    // in a talk, the busts' places (window-layer px) - bubbles over heads and the choices beside them keep clear of them; else null
    function bustKeepOut() {
        if (!talk.on) return null;
        const off = layerOffset(), out = [];
        for (const [side, name] of [[HERO_SIDE, talk.hero], [NPC_SIDE, talk.npc]]) {
            const b = bustBox(side, name);
            if (b.has) out.push({ x: b.x - off.x, y: b.top - off.y, w: b.w, h: TALK.height });
        }
        return out;
    }
    // the panels of a talk now on the screen (screen px): the bubble and the hero's choices, and their name plates
    function talkPanels() {
        const sc = SceneManager._scene, off = layerOffset(), out = [];
        const add = win => {
            if (!win || win.openness <= 0) return;
            const x = win.x + off.x, y = win.y + off.y, p = win._talkPlate;
            out.push({ x, y, w: win.width, h: win.height });
            if (p) out.push({ x: x + p.x, y: y + p.y, w: p.w, h: p.h });
        };
        if (sc && sc._messageWindow && sc._messageWindow._talkSide) add(sc._messageWindow);
        if (sc && sc._choiceListWindow && sc._choiceListWindow._talkChoice) add(sc._choiceListWindow);
        return out;
    }

    // ------------------------------------------------------------------
    // The message window as a bubble: sized to its text, over the speaker (or out of the speaker's bust in a talk), no face, the
    // window itself invisible (the bubble sprite behind the text is the panel)
    // ------------------------------------------------------------------
    const _Window_Message_initialize = Window_Message.prototype.initialize;
    Window_Message.prototype.initialize = function(rect) {
        _Window_Message_initialize.call(this, rect);
        this._bubbleOf = null;
        this._talkSide = null;
        this._bubbleSprite = new Sprite();
        this._bubbleSprite.visible = false;
        this.addChildToBack(this._bubbleSprite);
    };
    const _startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() {
        const sp = $gameMessage._speaker || {}, ch = speakerFor(sp), t = talkFor(ch, sp);
        if (t) Object.assign(talk, { on: true, owner: sp.eventId || 0, partner: t.partner, hero: heroBust(), npc: bustOf(t.partner), lit: t.side, speaker: ch, idle: 0 });
        else if (sp.forced !== undefined && sp.forced < 0) endTalk();                         // (\SPK[-1]: the usual window, no busts)
        else if (talk.on) Object.assign(talk, { lit: null, speaker: null, idle: 0 });           // (someone else, over the head: both dimmed)
        this._talkSide = t ? t.side : null;
        this._bubbleOf = t ? ch : ch && onScreen(headOf(ch)) ? ch : null;
        if (!this._bubbleOf) endTalk();   // (the usual window - no one to point at on the screen: the busts go, as for \SPK[-1])
        if (t) this.wrapTalk();
        _startMessage.call(this);
    };
    // a talk's text in its bubble: as written when every line fits in the room between the busts, else broken again (flowTalk)
    Window_Message.prototype.wrapTalk = function() {
        const max = this.talkTextWidth(), texts = $gameMessage._texts;
        if (!texts.every(t => measure(t).width <= max)) $gameMessage._texts = flowTalk(texts, max);
    };
    // lines too long for max px broken at spaces: the author's lines kept where they can be - as few of them run together as it
    // takes to keep the text to one bubble (TALK.lines lines) - at the narrowest width from TALK.text up to max that does; longer
    // than one bubble even as one paragraph: that, at max (full pages; the last one's bubble as high as its own lines)
    function flowTalk(texts, max) {
        const known = new Map(), width = t => { if (!known.has(t)) known.set(t, measure(t).width); return known.get(t); };
        const wrapTo = (text, w) => {
            const out = [];
            let line = "";
            for (const word of text.split(" ").filter(s => s)) {
                const trial = line ? line + " " + word : word;
                if (line && width(trial) > w) { out.push(line); line = word; } else line = trial;
            }
            return line || !out.length ? out.concat([line]) : out;
        };
        const lay = (paras, w) => [].concat(...paras.map(p => wrapTo(p, w)));
        const fits = (paras, w) => lay(paras, w).length <= TALK.lines;
        // the author's lines with none, one, two of their breaks given up, then all of them (drop: the lines joined to the one before)
        const join = drop => { const out = []; texts.forEach((t, i) => (i && drop.includes(i) ? (out[out.length - 1] += " " + t) : out.push(t))); return out; };
        const tiers = [[[]], [], [], [texts.map((t, i) => i).slice(1)]];
        for (let i = 1; i < texts.length; i++) {
            tiers[1].push([i]);
            for (let j = i + 1; j < texts.length; j++) tiers[2].push([i, j]);
        }
        for (const tier of tiers) {
            let best = null;
            for (const drop of tier) {
                const paras = join(drop);
                if (!fits(paras, max)) continue;
                let lo = Math.min(TALK.text, max), hi = max;   // (the narrowest width that still fits: halving the range)
                if (fits(paras, lo)) hi = lo;
                else while (hi - lo > 4) { const mid = Math.round((lo + hi) / 2); if (fits(paras, mid)) hi = mid; else lo = mid; }
                if (!best || hi < best.w) best = { paras, w: hi };
            }
            if (best) return lay(best.paras, best.w);
        }
        return lay([texts.join(" ")], max);
    }
    // the widest a talk's text may be: the room between the busts (with the hero's choices at his bust - someone else's question -
    // what they leave of it)
    Window_Message.prototype.talkTextWidth = function() {
        let right = bustBox("right", sideName("right")).inner - TALK.gap;
        let left = bustBox("left", sideName("left")).inner + TALK.gap;
        if (this._talkSide === "npc" && $gameMessage.isChoice()) {   // (the hero's choices at his bust take their room)
            const c = heroChoiceSlot(this.choiceBox());
            if (HERO_SIDE === "left") left = c.x + c.w + 16; else right = c.x - 16;
        }
        return Math.max(220, right - left - this.padding * 2 - 12);
    };
    // the choice list's size for this message's choices
    Window_Message.prototype.choiceBox = function() {
        const cl = this._choiceListWindow, n = Math.min($gameMessage.choices().length, 8);
        return { w: Math.max(160, cl ? Math.ceil(cl.windowWidth()) : 200), h: cl ? cl.fittingHeight(n) : n * 44 + 24 };
    };
    const _newLineX = Window_Message.prototype.newLineX;
    Window_Message.prototype.newLineX = function(textState) {
        if (!this._bubbleOf) return _newLineX.call(this, textState);
        return textState.rtl ? this.innerWidth - 4 : 4;
    };
    const _drawMessageFace = Window_Message.prototype.drawMessageFace;
    Window_Message.prototype.drawMessageFace = function() {
        if (!this._bubbleOf) _drawMessageFace.call(this);
    };
    // (in a talk the name is on the bubble's plate, not in the name box)
    const _updateSpeakerName = Window_Message.prototype.updateSpeakerName;
    Window_Message.prototype.updateSpeakerName = function() {
        if (this._talkSide) this._nameBoxWindow.setName("");
        else _updateSpeakerName.call(this);
    };
    const _updateBackground = Window_Message.prototype.updateBackground;
    Window_Message.prototype.updateBackground = function() {
        _updateBackground.call(this);
        if (this._bubbleOf) this.setBackgroundType(2);   // (transparent: the bubble is the panel)
    };
    const _updatePlacement = Window_Message.prototype.updatePlacement;
    Window_Message.prototype.updatePlacement = function() {
        if (!this._classicRect) this._classicRect = new Rectangle(this.x, this.y, this.width, this.height);
        this._choiceSlot = null;
        if (this._talkSide && this.placeTalk()) return;
        this._talkSide = null;
        if (this._bubbleOf && this.placeBubble()) return;
        this._bubbleOf = null;
        this._bubbleEdge = null;
        this._bubbleSprite.visible = false;
        const r = this._classicRect;
        if (this.x !== r.x || this.width !== r.width || this.height !== r.height) {
            this.move(r.x, this.y, r.width, r.height);
            this.createContents();
        }
        _updatePlacement.call(this);
    };
    Window_Message.prototype.placeAt = function(x, y, w, h) {
        if (this.x !== x || this.y !== y || this.width !== w || this.height !== h) {
            this.move(x, y, w, h);
            this.createContents();
        }
    };
    Window_Message.prototype.placeBubble = function() {
        const head = headOf(this._bubbleOf);
        if (!onScreen(head)) return false;
        const size = measure($gameMessage.allText()), pad = this.padding;
        const w = Math.min(MAX_W + pad * 2, Math.ceil(size.width) + 12 + pad * 2), h = Math.ceil(size.height) + pad * 2;
        const at = placePanel(w, h, head, bustKeepOut());   // (someone without a bust in a talk: clear of the busts)
        this.placeAt(at.x, at.y, w, h);
        const { bw, bh } = bubbleSize(w, h, at.tail.edge), off = tailOffset(at.tail.edge), bmp = new Bitmap(bw, bh), bs = this._bubbleSprite;
        paintBubble(bmp, w, h, at.tail);
        swapBitmap(bs, bmp);
        bs.x = -off.ox;
        bs.y = -off.oy;
        bs.visible = true;
        this._bubbleEdge = at.tail.edge;
        return true;
    };
    // in a talk: beside the speaker's bust (the hero's on HERO_SIDE, the other's across), the tail to its mouth, the name on a
    // plate; the hero's choices under his words in the same bubble - or, after someone else's words, in a bubble of their own at
    // his bust (this._choiceSlot, screen px). text: what is left to show (a later page), else the whole message
    Window_Message.prototype.placeTalk = function(text) {
        const hero = this._talkSide === "hero", pad = this.padding, off = layerOffset();
        const side = hero ? HERO_SIDE : NPC_SIDE, onLeft = side === "left";
        const box = bustBox(side, hero ? talk.hero : talk.npc);
        const size = measure(text === undefined ? $gameMessage.allText() : text), name = nameOf(this._bubbleOf);
        const c = $gameMessage.isChoice() ? this.choiceBox() : null;
        let w = Math.min(this.talkTextWidth(), Math.ceil(size.width)) + 12 + pad * 2;
        if (c && hero) w = Math.max(w, c.w);
        if (name) w = Math.max(w, plateWidth(name) + TALK.plate.inset * 2);   // (the name on its plate in full, however short the words)
        const h = Math.min(Math.ceil(size.height), this.lineHeight() * TALK.lines) + pad * 2, total = h + (c && hero ? c.h - pad : 0);
        const x = onLeft ? box.inner + TALK.gap : box.inner - TALK.gap - w, y = talkY(total, box.tipY);
        this.placeAt(x - off.x, y - off.y, w, h);
        const paint = [w, total, x, y, onLeft, box.has ? { x: box.tipX, y: box.tipY } : null, name];
        const p = talkBubble(...paint), bs = this._bubbleSprite;
        swapBitmap(bs, p.bmp);
        bs.x = -p.ox;
        bs.y = -p.oy;
        bs.visible = true;
        this._talkPlate = name ? plateRect(w, onLeft, name) : null;
        this._bubbleEdge = "talk-" + side;
        this._choiceSlot = c ? (hero ? { x, y: y + h - pad, w, h: c.h, own: false, paint, part: h - pad } : heroChoiceSlot(c)) : null;
        return true;
    };
    // a talk's next page: its bubble as high as that page's own lines (not the first page's four)
    const _newPage = Window_Message.prototype.newPage;
    Window_Message.prototype.newPage = function(textState) {
        _newPage.call(this, textState);
        if (this._talkSide && textState.index > 0) this.placeTalk(textState.text.slice(textState.index));
    };
    // the bubble opens and closes with the window
    const _Window_Message_update = Window_Message.prototype.update;
    Window_Message.prototype.update = function() {
        _Window_Message_update.call(this);
        const bs = this._bubbleSprite;
        if (!bs) return;
        const k = this.openness / 255;
        bs.visible = !!this._bubbleOf && k > 0;
        bs.alpha = k;
    };
    // the choices: beside the bubble (right, else left), level with it; in a talk, in the hero's bubble at his bust (also choices
    // with no words before them - no message window open)
    const _choicePlacement = Window_ChoiceList.prototype.updatePlacement;
    Window_ChoiceList.prototype.updatePlacement = function() {
        _choicePlacement.call(this);
        const mw = this._messageWindow, open = !!(mw && mw.isOpen()), bubble = open && !!mw._bubbleOf;
        const slot = open && mw._talkSide ? mw._choiceSlot : !open && talk.on && T.isCalm(null, ON_MAP)
            ? heroChoiceSlot({ w: Math.max(160, Math.ceil(this.windowWidth())), h: this.windowHeight() }) : null;
        this._talkChoice = !!slot;
        // ...as see-through as the bubble (the options' window opacity scaled like FILL against the old 0.94; the rows' bands too)
        this.updateBackOpacity();
        if (bubble || slot) this.backOpacity = Math.round(this.backOpacity * 0.77);
        if (this._contentsBackSprite) this._contentsBackSprite.alpha = bubble || slot ? 0.55 : 1;
        if (slot) return this.placeInTalk(slot);
        if (this._talkBubble) this._talkBubble.visible = false;
        this._talkOwn = false;
        if (!bubble) return;
        // (in a talk - someone without a bust asking - clear of the busts too)
        const y = Math.max(EDGE, Math.min(Graphics.boxHeight - EDGE - this.height, mw.y)), b = spanAcross(y, this.height, this.width, bustKeepOut());
        const right = mw.x + mw.width + 8, left = mw.x - 8 - this.width;
        this.x = right + this.width <= b.hi ? right : left >= b.lo ? left : right + this.width <= Graphics.boxWidth - EDGE ? right : Math.max(EDGE, left);
        this.y = y;
    };
    Window_ChoiceList.prototype.placeInTalk = function(slot) {
        const off = layerOffset();
        this.move(slot.x - off.x, slot.y - off.y, slot.w, slot.h);
        if (!this._talkBubble) {
            this._talkBubble = new Sprite();
            this.addChildToBack(this._talkBubble);
        }
        const b = this._talkBubble;
        this._talkOwn = !!slot.own;
        this._talkPlate = null;
        if (!slot.own) {
            // under the hero's words: the lower part of his bubble (the window layer leaves out what a window above covers - the
            // message window's own bubble is not drawn under this one)
            const p = talkBubble(...slot.paint);
            swapBitmap(b, p.bmp);
            b.setFrame(p.ox, p.oy + slot.part, slot.w, slot.h);
            b.x = b.y = 0;
            return;
        }
        const box = slot.box, p = talkBubble(slot.w, slot.h, slot.x, slot.y, HERO_SIDE === "left", box.has ? { x: box.tipX, y: box.tipY } : null, HERO_NAME);
        swapBitmap(b, p.bmp);
        b.x = -p.ox;
        b.y = -p.oy;
        this._talkPlate = plateRect(slot.w, HERO_SIDE === "left", HERO_NAME);   // (by his bust, as talkBubble draws it)
    };
    const _choiceBackground = Window_ChoiceList.prototype.updateBackground;
    Window_ChoiceList.prototype.updateBackground = function() {
        _choiceBackground.call(this);
        if (this._talkChoice) this.setBackgroundType(2);   // (the bubble is the panel)
    };
    const _choiceUpdate = Window_ChoiceList.prototype.update;
    Window_ChoiceList.prototype.update = function() {
        _choiceUpdate.call(this);
        const b = this._talkBubble;
        if (!b) return;
        b.visible = !!this._talkChoice && this.openness > 0;
        b.alpha = this.openness / 255;
    };

    // ------------------------------------------------------------------
    // The busts on the screen: in the bottom corners (the one on the left mirrored to look right), sliding in and out, the listener dimmed;
    // a small yellow marker over the speaker on the map; the HUD under the busts hidden meanwhile
    // ------------------------------------------------------------------
    let markerBmp = null;
    function markerBitmap() {
        if (markerBmp) return markerBmp;
        const b = new Bitmap(20, 16), ctx = b.context;
        ctx.beginPath();
        ctx.moveTo(2.5, 2.5); ctx.lineTo(17.5, 2.5); ctx.lineTo(10, 13); ctx.closePath();
        ctx.fillStyle = style().accent;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(8,9,11,0.92)";
        ctx.stroke();
        b._baseTexture.update();
        return (markerBmp = b);
    }
    function Sprite_TalkBusts() {
        this.initialize(...arguments);
    }
    Sprite_TalkBusts.prototype = Object.create(Sprite.prototype);
    Sprite_TalkBusts.prototype.constructor = Sprite_TalkBusts;
    Sprite_TalkBusts.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._sides = {};
        for (const side of ["left", "right"]) {
            const ghost = new Sprite(), s = new Sprite();   // (ghost: a bust going as another one comes in its place, under it)
            for (const sp of [ghost, s]) {
                sp.anchor.set(0, 1);
                sp.visible = false;
                this.addChild(sp);
            }
            this._sides[side] = { side, sprite: s, ghost, name: "", k: 0, light: 1, blend: -1, fade: 1, gone: 0 };
        }
        // the marker: the scene puts it over the windows (a bubble may stand over the speaker on the map)
        this._marker = new Sprite(markerBitmap());
        this._marker.anchor.set(0.5, 1);
        this._marker.visible = false;
        this._markerK = 0;
        this._markerAt = null;
        this._lift = 0;
    };
    Sprite_TalkBusts.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const sc = SceneManager._scene, cl = sc && sc._choiceListWindow, choosing = !!(talk.on && cl && cl.active && cl.openness > 0);
        this.updateSide(this._sides[HERO_SIDE], talk.on ? talk.hero : "", talk.lit === "hero" || choosing);
        this.updateSide(this._sides[NPC_SIDE], talk.on ? talk.npc : "", talk.lit === "npc");
        this.updateMarker();
    };
    // a side: its bust slides in when wanted, out when not; another one in its place comes by a short cross-fade where it stands
    // (the old one dimmed at once - the new bubble's tail keeps pointing at a face); bright when it speaks, else dimmed
    Sprite_TalkBusts.prototype.updateSide = function(p, want, lit) {
        want = want || "";
        const aim = lit ? 1 : TALK.dim;
        if (p.name !== want) {
            const next = want && p.name && p.sprite.visible ? bustBitmap(want) : null;
            if (next) {
                if (next.isReady() && next.height > 0) { this.fadeAway(p); p.name = want; p.light = aim; p.fade = 0; }
                // (not loaded yet: the old one stays meanwhile)
            } else {
                p.k = Math.max(0, p.k - 1 / TALK.slide);
                if (p.k === 0) { p.name = want; p.light = aim; p.fade = 1; }
            }
        }
        const bmp = p.name ? bustBitmap(p.name) : null, ready = !!bmp && bmp.isReady() && bmp.height > 0, s = p.sprite;
        if (!ready) p.k = 0;
        else if (p.name === want) {
            p.k = Math.min(1, p.k + 1 / TALK.slide);
            p.fade = Math.min(1, p.fade + 1 / TALK.fade);
        }
        const step = (1 - TALK.dim) / TALK.fade;
        p.light = p.light < aim ? Math.min(aim, p.light + step) : Math.max(aim, p.light - step);
        this.updateGhost(p);
        s.visible = ready && p.k > 0;
        if (!s.visible) return;
        if (s.bitmap !== bmp) s.bitmap = bmp;
        const left = p.side === "left", sc = TALK.height / bmp.height, w = bmp.width * sc, e = easeOut(p.k);
        const mirror = left !== FACES_RIGHT.has(p.name);   // (the left one looks right, the right one left)
        const x0 = left ? 0 : Graphics.width - w, slide = (1 - e) * (w + 16) * (left ? -1 : 1);
        s.scale.set(mirror ? -sc : sc, sc);
        s.x = Math.round(x0 + slide + (mirror ? w : 0));
        s.y = Graphics.height;
        s.opacity = Math.round(255 * Math.min(1, e * 1.4) * p.fade);
        const blend = Math.round((1 - p.light) * 255);
        if (blend !== p.blend) { p.blend = blend; s.setBlendColor([0, 0, 0, blend]); }
    };
    // the bust shown on a side handed to its ghost, dimmed, to fade out where it stands
    Sprite_TalkBusts.prototype.fadeAway = function(p) {
        const s = p.sprite, g = p.ghost;
        g.bitmap = s.bitmap;
        g.scale.set(s.scale.x, s.scale.y);
        g.x = s.x;
        g.y = s.y;
        g.setBlendColor([0, 0, 0, Math.round((1 - TALK.dim) * 255)]);
        p.gone = s.opacity / 255;
        g.opacity = s.opacity;
        g.visible = true;
    };
    Sprite_TalkBusts.prototype.updateGhost = function(p) {
        const g = p.ghost;
        if (!g.visible) return;
        p.gone = Math.max(0, p.gone - 1 / TALK.fade);
        g.opacity = Math.round(255 * p.gone);
        if (p.gone > 0) return;
        g.visible = false;
        g.bitmap = null;
    };
    Sprite_TalkBusts.prototype.updateMarker = function() {
        const m = this._marker, ch = talk.on && talk.lit === "npc" ? talk.speaker : null;
        const head = ch && $gameMessage.isBusy() ? headOf(ch) : null, want = onScreen(head);
        if (want) {
            const off = layerOffset(), x = Math.round(head.x + off.x), top = Math.round(head.top + off.y), lift = top - markerSpot(ch, x, top);
            // (up over a balloon or a panel and back smoothly; where it first shows, at once)
            this._lift = this._markerK > 0 && Math.abs(lift - this._lift) > 1 ? this._lift + (lift - this._lift) * 0.35 : lift;
            this._markerAt = { x, y: top };
        }
        this._markerK = want ? Math.min(1, this._markerK + 1 / 8) : Math.max(0, this._markerK - 1 / 6);
        m.visible = this._markerK > 0 && !!this._markerAt;
        if (!m.visible) return;
        m.x = this._markerAt.x;
        m.y = this._markerAt.y - Math.round(this._lift) - 1 + Math.round(Math.sin(Graphics.frameCount / 9) * 2);
        m.opacity = Math.round(255 * this._markerK * ($gameScreen.brightness() / 255));
    };
    // where the marker's tip goes (screen px) over a speaker with the head's top at (x, top): above an RPG Maker balloon of his (a
    // drop, a note, zzz), and above a panel of the talk that covers that spot (the speaker behind the bubble) - on its top edge
    function markerSpot(ch, x, top) {
        const set = SceneManager._scene && SceneManager._scene._spriteset;
        let y = top;
        for (const b of (set && set._balloonSprites) || []) {
            if (b.targetObject !== ch || !b.visible) continue;
            const r = b.getBounds();
            if (r.width > 0) y = Math.min(y, Math.round(r.y) - 1);
        }
        const panels = talkPanels();
        for (let i = 0; i < 4; i++) {   // (the marker: 20 x 16 over its tip, bobbing 2 px)
            const r = panels.find(r => x + 12 > r.x && x - 12 < r.x + r.w && y + 3 > r.y && y - 19 < r.y + r.h);
            if (!r) break;
            y = r.y - 3;
        }
        return y;
    }
    Sprite_TalkBusts.prototype.isShown = function() {
        return Object.values(this._sides).some(p => p.sprite.visible || p.ghost.visible);
    };
    // the screen rects of the busts shown
    Sprite_TalkBusts.prototype.rects = function() {
        const out = [];
        for (const p of Object.values(this._sides)) for (const s of [p.sprite, p.ghost]) if (s.visible) out.push(s.getBounds());
        return out;
    };
    // the HUD under the busts: the XP bar, the weapon plate and the gains' list (bottom right) always, the minimap and the goal
    // tracker when they reach down to a bust; back when the busts are gone
    Sprite_TalkBusts.prototype.coverHud = function(scene) {
        const on = this.isShown(), rects = on ? this.rects() : [];
        const always = [scene._xpBar, scene._weaponPlate, scene._gainFeed], maybe = [scene._goalTracker, scene._minimap];
        const hits = s => rects.some(r => { const b = s.getBounds(); return b.width > 0 && b.x < r.x + r.width && b.x + b.width > r.x && b.y < r.y + r.height && b.y + b.height > r.y; });
        for (const s of always.concat(maybe)) {
            if (!s) continue;
            if (on && (always.includes(s) || (s.visible && hits(s)) || s._talkWas !== undefined)) {
                if (s._talkWas === undefined) s._talkWas = s.visible;
                s.visible = false;
            } else if (s._talkWas !== undefined) {
                s.visible = s._talkWas;
                s._talkWas = undefined;
            }
        }
    };
    T.onMapUpdate(scene => {   // (after the map's frame: the HUD sprites have set their own visibility)
        if (scene._talkBusts) scene._talkBusts.coverHud(scene);
    }, { owner: PLUGIN, name: "coverHud" });

    // ------------------------------------------------------------------
    // Short cries: a small bubble over a character for a few seconds while the game goes on
    // ------------------------------------------------------------------
    const barks = [];   // { ch, text, t, life }
    const log = [];     // what was said (tests read it)
    function say(ch, text, frames) {
        if (!ch || !text) return;
        text = String(text);
        for (const b of barks) if (b.ch === ch && b.t < b.life - BARK.fadeOut) b.t = b.life - BARK.fadeOut;   // the speaker's last cry goes
        barks.push({ ch, text, t: 0, life: frames || Math.min(360, 150 + text.length * 5), map: window.$gameMap ? $gameMap.mapId() : 0 });
        log.push(text);
        if (log.length > 20) log.shift();
    }

    function Sprite_Barks() {
        this.initialize(...arguments);
    }
    Sprite_Barks.prototype = Object.create(Sprite.prototype);
    Sprite_Barks.prototype.constructor = Sprite_Barks;
    Sprite_Barks.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._shown = new Map();   // bark -> its sprite
    };
    Sprite_Barks.prototype.update = function() {
        Sprite.prototype.update.call(this);
        for (const b of barks.slice()) {
            b.t++;
            // (a character that is not an event - a man of Humans.js, a creature of Creatures.js - speaks while it lives on this map)
            const lost = b.ch instanceof Game_Event ? !$gameMap.events().includes(b.ch) : !!b.ch._dead || b.map !== $gameMap.mapId();
            const gone = b.t >= b.life || (b.ch !== $gamePlayer && lost);
            let s = this._shown.get(b);
            if (gone) {
                barks.splice(barks.indexOf(b), 1);
                if (s) { this.removeChild(s); this._shown.delete(b); }
                continue;
            }
            const head = headOf(b.ch);
            if (!s) {
                s = new Sprite();
                s._w = 0;
                this.addChild(s);
                this._shown.set(b, s);
            }
            if (!onScreen(head)) { s.visible = false; continue; }
            if (!s._w) {   // measured once
                const probe = new Bitmap(8, 8);
                probe.fontSize = BARK.font;
                s._w = Math.ceil(probe.measureTextWidth(b.text)) + BARK.padX * 2;
                s._h = BARK.line + BARK.padY * 2;
            }
            const at = placePanel(s._w, s._h, head, bustKeepOut()), key = at.tail.edge + ":" + at.tail.tipX + ":" + at.tail.tipY;
            if (s._key !== key) {   // drawn again only when the tail has to turn or move (the speaker near an edge of the screen)
                s._key = key;
                const { bw, bh } = bubbleSize(s._w, s._h, at.tail.edge), off = tailOffset(at.tail.edge), bmp = new Bitmap(bw, bh);
                paintBubble(bmp, s._w, s._h, at.tail);
                bmp.fontSize = BARK.font;
                bmp.textColor = style().text;
                bmp.outlineWidth = 0;
                bmp.drawText(b.text, off.ox, off.oy + BARK.padY, s._w, BARK.line, "center");
                s.bitmap = bmp;
                s._off = off;
            }
            s.visible = true;
            s.x = at.x - s._off.ox;
            s.y = at.y - s._off.oy - Math.round(4 * (1 - Math.min(1, b.t / BARK.fadeIn)));   // (it rises a little as it appears)
            s.opacity = Math.round(255 * Math.min(1, b.t / BARK.fadeIn, (b.life - b.t) / BARK.fadeOut));
        }
    };
    // screen space, over the map and the HUD, under the windows (the busts over the cries); the talk's marker over the windows
    const _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _Scene_Map_createDisplayObjects.call(this);
        this._barks = new Sprite_Barks();
        this.addChildAt(this._barks, this.getChildIndex(this._windowLayer));
        this._talkBusts = new Sprite_TalkBusts();
        this.addChildAt(this._talkBusts, this.getChildIndex(this._windowLayer));
        this.addChildAt(this._talkBusts._marker, this.getChildIndex(this._windowLayer) + 1);
        [heroBust()].concat($gameMap.events().map(bustOf)).forEach(n => n && bustBitmap(n));   // (loaded before the first talk)
    };
    // a new map: the cries of the old one are gone, and any talk (before the other listeners: a cry on arrival stays)
    T.on("mapEnter", () => {
        barks.length = 0;
        endTalk();
    }, { owner: PLUGIN, priority: -1 });
    // a new or loaded game: no talk of the one before
    T.on("newGame", endTalk, { owner: PLUGIN });
    T.on("load", endTalk, { owner: PLUGIN });

    window.SpeechBubbles = T.register(PLUGIN, {
        say, get barks() { return barks; }, log, speakerOf, headOf, bustOf, heroBust, hasBust, bustBitmap, bustFile, RENAMED, talk: () => talk, BUSTS, FACES_RIGHT, TALK,
        HERO_SIDE, NPC_SIDE
    });
})();
