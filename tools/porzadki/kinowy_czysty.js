    // ---- the map's name as one comes in, "Kinowy" (the user 2026-10-23: "możemy przejść z kroniki na kinowy?"; 2026-11-06: "napis mapy
    // po prostu w całości się pojawia i przy końcu zanika, bez zbędnych animacji, wydajność ważniejsza", "po prostu miej gotowe obrazki",
    // "niech zawsze będzie ten mniejszy opis, taki jak przy drugim wejściu", "niech przy opisie nie będzie tego »pokaż mapę«"): in the
    // bottom left corner the place's words in gold capitals, its name (44 px; a room's 32 px) and a gold line, as ONE picture made ahead
    // by tools/nazwa_mapy/obrazki.js (img/nazwy_map/<key>.png, listed in spis.json), shown whole from its first frame and faded out at the
    // end - only its alpha moves. No file for it (a new map, a changed text): drawn here once, into one picture, by the same code the
    // tool draws with. Under it only the underground's "najgłębiej: piętro N". (2026-11-07: the old "Kronika" at the top centre and the
    // long first visit with the black bars and the sentence taken out - a scene's bars are CleanHUD.sceneBars now.)
    const cinemaMode = info => (info.kind === "inside" ? "inside" : "again");
    const KN = {
        left: 70, foot: 22,
        again: { size: 44, sp: 2, tag: 15, tagSp: 4, line: 90 },
        inside: { size: 32, sp: 2, tag: 14, tagSp: 3, line: 64 },
        cream: [[252, 247, 234], [214, 204, 182]], night: [[255, 236, 200], [236, 170, 92]], red: [[255, 182, 156], [178, 30, 24]],
        glow: "rgba(255,146,52,0.5)", line: [255, 210, 63], redLine: [226, 86, 58], tagColour: "#ffd23f",
        // frames: hold - when it starts to go, out - how long it goes
        times: { again: { hold: 156, out: 24 }, inside: { hold: 126, out: 24 } }
    };
    // the pictures made ahead: their folder, the look's version (a new one when the drawing below changes: every picture made again)
    const PIC = { dir: "img/nazwy_map/", ver: "kn1" };
    let picList = null;   // spis.json: { key: [x, y, w, h, hintY, wide, top0, count, size, tot, blockH] }
    (function loadPicList() {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", PIC.dir + "spis.json");
            xhr.overrideMimeType("application/json");
            xhr.onload = () => { try { picList = xhr.status < 400 ? JSON.parse(xhr.responseText).obrazki || {} : {}; } catch (e) { picList = {}; } };
            xhr.onerror = () => { picList = {}; };
            xhr.send();
        } catch (e) { picList = {}; }
    })();
    // the picture's key: what it shows (its texts, the look, night, red) - a changed text has no file, so it is drawn here (the last
    // field was the sentence of the long first visit: kept empty, so the pictures made keep their keys)
    function picKey(info, mode, night) {
        const s = [PIC.ver, W(), H(), mode, night ? 1 : 0, info.boss ? 1 : 0, info.title || "", info.sub || "", ""].join("\u0001");
        let a = 0x811c9dc5, b = 0x5bd1e995;
        for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193); b = Math.imul(b ^ c, 0x5bd1e995) ^ (b >>> 13); }
        return (a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0");
    }
    // where each part goes on the screen (measured only, nothing drawn): the words, the letters, the gold line
    function cinemaLayout(info, mode, night) {
        const L = KN[mode], Wd = W(), Hd = H(), maxW = Wd - 2 * KN.left;
        // the name: smaller when it does not fit
        const caps = Array.from(String(info.title));
        let size = L.size, ws = [], tot = 0;
        for (let i = 0; i < 5; i++) {
            ws = caps.map(ch => measure(ch, size, "caps"));
            tot = ws.reduce((a, b) => a + b, 0) + L.sp * Math.max(0, caps.length - 1);
            if (tot <= maxW || size <= 20) break;
            size = Math.max(20, Math.floor(size * maxW / tot));
        }
        // the block from its foot up: the small line (always room for it), the gold line, the name, the words
        const tagH = info.sub ? L.tag + 10 : 0, nameH = Math.round(size * 1.28);
        const foot = Hd - KN.foot, blockH = tagH + nameH + 14 + 20;
        let y = foot - blockH;
        const lay = { size, tot, top0: y, blockH, night: !!night, parts: [], rects: {}, count: 0, tagW: 0 };
        const put = (p, px, py, w, h) => { Object.assign(p, { x: px, y: py, w, h }); lay.parts.push(p); return { x: px, y: py, w, h }; };
        if (info.sub) {
            const f = capsFit(info.sub, L.tag, L.tagSp, maxW);
            lay.rects.tag = put({ k: "tag", f }, KN.left - 12, y - 4, f.w, f.h);
            lay.tagW = Math.ceil(f.tot);
            y += tagH;
        }
        const fill = info.boss ? KN.cream : night ? KN.night : KN.cream;
        let x = KN.left, n0 = Infinity, n1 = -Infinity, nh = 0;
        caps.forEach((ch, i) => {
            if (ch.trim()) {
                const bx = letterBox(ch, size), p = bx.pad, lx = Math.round(x) - p;
                put({ k: "letter", ch, fill }, lx, y - p, bx.w, bx.h);
                if (info.boss) put({ k: "red", ch }, lx, y - p, bx.w, bx.h);   // (the guardians' floors: the fill red)
                n0 = Math.min(n0, lx + p);
                n1 = Math.max(n1, lx + bx.w - p);
                nh = Math.max(nh, bx.h - 2 * p);
                lay.count++;
            }
            x += ws[i] + L.sp;
        });
        if (lay.count) lay.rects.letters = { x: n0, y, w: n1 - n0, h: nh };
        y += nameH + 4;
        lay.rects.line = put({ k: "line", colour: info.boss ? KN.redLine : KN.line }, KN.left, y, L.line, 3);
        y += 10;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const p of lay.parts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + p.w); y1 = Math.max(y1, p.y + p.h); }
        return Object.assign(lay, { x: x0, y: y0, w: Math.max(1, Math.ceil(x1 - x0)), h: Math.max(1, Math.ceil(y1 - y0)), hintY: y, wide: Math.max(tot, lay.tagW) });
    }
    // the picture: every part straight into one canvas (no picture of its own for each letter)
    function cinemaDraw(lay) {
        const b = new Bitmap(lay.w, lay.h), glow = lay.night ? KN.glow : null;
        for (const p of lay.parts) {
            const x = p.x - lay.x, y = p.y - lay.y;
            if (p.k === "tag") capsDraw(b, p.f, KN.tagColour, x, y);
            else if (p.k === "letter") kronikaLetter(p.ch, lay.size, p.fill, { glow, into: { bmp: b, x, y } });
            else if (p.k === "red") kronikaLetter(p.ch, lay.size, KN.red, { fillOnly: true, into: { bmp: b, x, y } });
            else if (p.k === "line") {
                const c = b.context;
                c.fillStyle = rgbOf(p.colour);
                c.fillRect(x, y, p.w, 2);
                c.fillStyle = "rgba(0,0,0,0.5)";
                c.fillRect(x, y + 2, p.w, 1);
            }
        }
        b._baseTexture.update();
        return b;
    }
    // what spis.json keeps of a layout: the picture's place and what the HUD needs of it (nothing measured when it comes from a file)
    const r2 = v => Math.round(v * 100) / 100;
    const picMeta = lay => [lay.x, lay.y, lay.w, lay.h, lay.hintY, r2(lay.wide), lay.top0, lay.count, lay.size, r2(lay.tot), lay.blockH];
    const metaLay = m => ({ x: m[0], y: m[1], w: m[2], h: m[3], hintY: m[4], wide: m[5], top0: m[6], count: m[7], size: m[8], tot: m[9], blockH: m[10] });
    // the shade under it and the small line: drawn once each and kept between the shows (a few kinds only)
    const kept = { shade: new Map(), hint: new Map() };
    function keptBitmap(map, key, make) {
        let b = map.get(key);
        if (b) return b;
        if (map.size >= 10) { const [k0, b0] = map.entries().next().value; map.delete(k0); b0.destroy(); }
        b = make();
        map.set(key, b);
        return b;
    }
    // (a soft corner: a quarter circle reaching exactly the picture's edges, stretched sideways)
    function cinemaShade(shadeH) {
        return keptBitmap(kept.shade, "c" + shadeH, () => {
            const sh = new Bitmap(shadeH, shadeH), cx = sh.context, g = cx.createRadialGradient(0, shadeH, 0, 0, shadeH, shadeH);
            g.addColorStop(0, "rgba(0,0,0,0.5)");
            g.addColorStop(1, "rgba(0,0,0,0)");
            cx.fillStyle = g;
            cx.fillRect(0, 0, sh.width, shadeH);
            sh._baseTexture.update();
            return sh;
        });
    }
    function cinemaHint(text) {
        return keptBitmap(kept.hint, text, () => {
            const b = new Bitmap(Math.ceil(measure(text, 12)) + 30, 18);
            textOut(b, text, 0, 0, b.width, 18, "left", { size: 12, color: C.muted, ow: 3 });
            return b;
        });
    }
    let lastShow = null;   // (the tests read how the last one went: its map, mode, frames, why it ended)
    function Sprite_CleanCinema() {
        this.initialize(...arguments);
    }
    Sprite_CleanCinema.prototype = Object.create(Sprite.prototype);
    Sprite_CleanCinema.prototype.constructor = Sprite_CleanCinema;
    Sprite_CleanCinema.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._info = null;
        this._t = -1;        // the frame of its show; -1: nothing shown
        this._parts = null;  // its sprites, made on its first frame (the faces and its file ready)
        this._bitmaps = [];
        this._h = 0;
        this._box = null;
        this.visible = false;
    };
    // (its look decided as it starts - night, the key -, its file asked for at once: it loads while the map fades in)
    Sprite_CleanCinema.prototype.start = function(info) {
        this.clear("new");
        this._info = info;
        this._mode = cinemaMode(info);
        this._T = KN.times[this._mode];
        this._mapId = $gameMap.mapId();
        this._t = 0;
        this._cut = Infinity;   // (a message, the name turned off: it fades from that frame)
        this._wait = 0;
        const S = T.api("Survival"), outdoors = !S || !S.isOutdoors || S.isOutdoors();
        this._night = this._mode !== "inside" && !info.floor && outdoors && !!(T.time && T.time.isNight());
        this._key = picKey(info, this._mode, this._night);
        const m = picList && picList[this._key];
        this._file = m ? { meta: m, bmp: this.keep(Bitmap.load(PIC.dir + this._key + ".png")), dec: 0 } : null;
    };
    Sprite_CleanCinema.prototype.duration = function() {
        return this._T ? this._T.hold + this._T.out : 0;
    };
    Sprite_CleanCinema.prototype.clear = function(why) {
        if (this._t >= 0 && this._info) lastShow = { mapId: this._mapId, title: this._info.title, mode: this._mode, frames: this._t, why: why || "" };
        this.removeChildren();
        for (const b of this._bitmaps) b.destroy();
        this._bitmaps = [];
        this._parts = null;
        this._file = null;
        this._t = -1;
        this._h = 0;
        this._box = null;
        this.visible = false;
    };
    Sprite_CleanCinema.prototype.keep = function(b) {
        this._bitmaps.push(b);
        return b;
    };
    Sprite_CleanCinema.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (this._t < 0) return;
        // it goes at once when he leaves the map (a transfer, another scene - the menu too) or the look is the classic one
        if (!isClean()) { this.clear("look"); return; }
        if ($gameMap.mapId() !== this._mapId || $gamePlayer.isTransferring() || SceneManager.isSceneChanging()) { this.clear("map"); return; }
        const tl = this._T;
        if (this._cut === Infinity && ($gameMessage.isBusy() || !nameShown())) this._cut = Math.min(this._t, tl.hold);
        if (!this._parts) {
            if (!this.ready() && this._wait++ < 90) return;   // (the faces, its file still loading: it waits for them, 1.5 s at most)
            this.build();
        }
        const hint = this.hintText();
        if (hint !== this._parts.hintText) this.buildHint(hint);
        this.visible = true;
        this.animate(this._t);
        if (++this._t >= Math.min(tl.hold, this._cut) + tl.out) this.clear("end");
    };
    // ready: the faces (the small line) and its file loaded and decoded off the main thread (a file that fails: drawn here instead)
    Sprite_CleanCinema.prototype.ready = function() {
        const f = this._file;
        if (f && f.dec < 2) {
            const b = f.bmp, img = b._image;
            if (b.isError()) f.dec = 2;
            else if (b.isReady() && f.dec === 0) {
                if (!img || !img.decode) f.dec = 2;
                else { f.dec = 1; img.decode().then(() => { f.dec = 2; }, () => { f.dec = 2; }); }
            }
        }
        return facesReady() && (!f || f.dec === 2);
    };
    Sprite_CleanCinema.prototype.build = function() {
        const info = this._info, mode = this._mode, Wd = W(), Hd = H(), night = this._night;
        const f = this._file && this._file.bmp.isReady() ? this._file : null;
        const lay = f ? metaLay(f.meta) : cinemaLayout(info, mode, night);
        const P = this._parts = { hintText: null, night, lay: f ? null : lay, file: !!f, count: lay.count, size: lay.size, w: lay.tot,
            top0: lay.top0, hintY: lay.hintY, wide: lay.wide };
        this.x = this.y = 0;
        const shadeH = lay.blockH + 120, sh = cinemaShade(shadeH);
        P.shade = new Sprite(sh);
        P.shade.scale.x = Math.min(Wd, Math.round(lay.tot + 260)) / sh.width;
        P.shade.y = Hd - shadeH;
        this.addChild(P.shade);
        // the picture: the file made ahead, or drawn here once
        P.pic = new Sprite(f ? f.bmp : this.keep(cinemaDraw(lay)));
        P.pic.x = lay.x;
        P.pic.y = lay.y;
        this.addChild(P.pic);
        this.buildHint(this.hintText());
    };
    // the small line under it: only the deepest floor (the underground)
    Sprite_CleanCinema.prototype.hintText = function() {
        const i = this._info;
        return i.floor > 0 && i.deepest > i.floor ? "najgłębiej: piętro " + i.deepest : "";
    };
    Sprite_CleanCinema.prototype.buildHint = function(text) {
        const P = this._parts;
        if (P.hint) { this.removeChild(P.hint); P.hint = null; }
        P.hintText = text;
        if (text) {
            P.hint = new Sprite(cinemaHint(text));
            P.hint.x = KN.left;
            P.hint.y = P.hintY;
            this.addChild(P.hint);
        }
        this._h = 0;
        this._box = { w: Math.round(P.wide + 8), h: Math.round(P.hintY + 20 - P.top0) };
    };
    // the parts' boxes on the screen (the tests): measured again when the picture came from a file
    Sprite_CleanCinema.prototype.rects = function() {
        const P = this._parts;
        if (!P) return null;
        if (!P.lay) P.lay = cinemaLayout(this._info, this._mode, P.night);
        return P.lay.rects;
    };
    // whole from its first frame; at the end all of it fades as one - the only thing that moves
    Sprite_CleanCinema.prototype.animate = function(t) {
        const tl = this._T, cut = Math.min(tl.hold, this._cut);
        this.opacity = t < cut ? 255 : Math.round(255 * clamp01(1 - (t - cut) / tl.out));
    };
    // what it shows now (the tests, the F9)
    Sprite_CleanCinema.prototype.info = function() {
        const i = this._info, P = this._parts;
        if (!i || this._t < 0) return null;
        const n = P ? P.count : 0;   // (all its letters there from its first frame)
        return { style: "kinowy", mapId: this._mapId, title: i.title, sub: i.sub, opis: "", hint: P ? P.hintText : "", mode: this._mode, kind: i.kind,
            first: !!i.first, floor: i.floor, boss: !!i.boss, night: !!(P && P.night), t: this._t, dur: this.duration(), visible: !!this.visible,
            size: P ? P.size : 0, w: P ? Math.round(P.w) : 0, h: this._h, y: Math.round(this.y), opacity: this.opacity,
            letters: n, lettersIn: n, red: P && i.boss ? 1 : 0, file: !!(P && P.file), key: this._key,
            box: this._box ? { x: Math.round(this.x - this._box.w / 2), y: Math.round(this.y), w: this._box.w, h: this._box.h } : null };
    };
    // (for tools/nazwa_mapy/obrazki.js and the tests: the same layout, drawing and key as on the map)
    const nameArt = { dir: PIC.dir, ver: PIC.ver, mode: cinemaMode, key: picKey, layout: cinemaLayout, draw: cinemaDraw, meta: picMeta, list: () => picList, times: KN.times };

