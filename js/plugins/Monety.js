//=============================================================================
// Monety.js
//=============================================================================
// The coins of Jasnomir (2026-11-17, the player: „miedź, srebro i złoto - zrób tak, jak sugerujesz”): the purse is one number, as it
// always was (the database's „G”), counted in miedziaki - and shown as three coins: 1 złoty = 10 srebrników = 100 miedziaków.
// Every sum written „N G” (the texts, the code's own words, TextManager.currencyUnit) is shown so:
//   - in a talk or any window text (Window_Base.convertEscapeCharacters): the long way - „25 złotych”, „2 srebrniki i 5 miedziaków”
//   - drawn straight on a picture (Bitmap.drawText / measureTextWidth: the menus, the shops, the popups, the gains): the number and
//     the coin's picture (the player, 2026-11-17: „widok monet zamiast liter”) - img/system/Monety.png: złoty, srebrnik, miedziak;
//     until the picture is loaded: the letters „25 zł”, „2 sr 5 m”
//   - the gold window (drawCurrencyValue): the coins, right-aligned
// Nothing is converted in the data: the texts keep „N G”, so a sum the code puts into a text is shown the same way.
/*:
 * @target MZ
 * @plugindesc Monety: miedziaki, srebrniki, złote (1 zł = 10 sr = 100 m) - sumy „N G” pokazane jako monety. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * Sakiewka to jedna liczba w miedziakach (w bazie: G). Gra pokazuje ją jako monety:
 * w rozmowach „2 srebrniki i 5 miedziaków”, w menu i sklepach „2 sr 5 m”.
 * W tekstach (js/teksty) kwoty pisze się jak dotąd: „25 G”.
 *
 * W skryptach: Monety.krotko(n) -> "2 sr 5 m", Monety.dlugo(n) -> "2 srebrniki i 5 miedziaków",
 * Monety.tekst(s, dlugo) - zamienia w napisie każde „N G”.
 */
(() => {
    "use strict";
    const T = window.Tawerna;
    const KINDS = [["zł", 100, ["złoty", "złote", "złotych"]], ["sr", 10, ["srebrnik", "srebrniki", "srebrników"]], ["m", 1, ["miedziak", "miedziaki", "miedziaków"]]];
    const form = (c, f) => (c === 1 ? f[0] : c % 10 >= 2 && c % 10 <= 4 && (c % 100 < 12 || c % 100 > 14) ? f[1] : f[2]);
    function parts(n) {
        let left = Math.floor(Math.abs(n));
        const out = [];
        for (const [short, v, f] of KINDS) { const c = Math.floor(left / v); left -= c * v; if (c) out.push([c, short, f]); }
        return out;
    }
    // short: „3 zł 4 sr 7 m” (zeros left out; nothing: „0 m”)
    function krotko(n) {
        const p = parts(n);
        if (!p.length) return "0 m";
        return (n < 0 ? "-" : "") + p.map(([c, s]) => c + " " + s).join(" ");
    }
    // long: „3 złote, 4 srebrniki i 7 miedziaków”
    function dlugo(n) {
        const p = parts(n).map(([c, , f]) => c + " " + form(c, f));
        if (!p.length) return "0 miedziaków";
        const s = p.length === 1 ? p[0] : p.slice(0, -1).join(", ") + " i " + p[p.length - 1];
        return (n < 0 ? "minus " : "") + s;
    }
    const SUM = /([+\-−]?)(\d+) G\b/g;
    function tekst(s, long) {
        if (typeof s !== "string" || s.indexOf(" G") < 0) return s;
        return s.replace(SUM, (all, sign, d) => {
            const n = Number(d), neg = sign === "-" || sign === "−";
            return long ? (neg ? "minus " : sign) + dlugo(n) : (neg ? "-" : sign) + krotko(n);
        });
    }

    // a window's text (talks, help lines, descriptions): the long way
    const _convert = Window_Base.prototype.convertEscapeCharacters;
    Window_Base.prototype.convertEscapeCharacters = function(text) {
        return tekst(_convert.call(this, text), true);
    };
    // ---- drawn on a picture (the menus, the shops, the popups, the gains): each coin its number and its picture (32 x 32 cells of
    // img/system/Monety.png - PixelLab 2026-11-17: the gold with a crown, the silver with the raven, the copper with a crown -, drawn
    // as tall as the font), measured the same way, so a layout fits what is drawn
    const KIND_AT = { "zł": 0, "sr": 1, "m": 2 };
    let sheet = null;
    function sheetReady() {
        if (!sheet && window.ImageManager) sheet = ImageManager.loadSystem("Monety");
        return !!sheet && sheet.isReady() && !(sheet.isError && sheet.isError());
    }
    const _loadSystemImages = Scene_Boot.prototype.loadSystemImages;
    Scene_Boot.prototype.loadSystemImages = function() {
        _loadSystemImages.call(this);
        sheetReady();
    };
    const HAS = /\d+ G\b/;
    // the text's pieces: [{ t: plain text }, { n: count, k: 0 złoty | 1 srebrnik | 2 miedziak }]
    function pieces(s) {
        const re = /([+\-−]?)(\d+) G\b/g, out = [];
        let last = 0, m;
        while ((m = re.exec(s))) {
            if (m.index > last) out.push({ t: s.slice(last, m.index) });
            if (m[1]) out.push({ t: m[1] === "+" ? "+" : "-" });
            const p = parts(Number(m[2]));
            if (!p.length) out.push({ n: 0, k: 2 });
            p.forEach(([c, short], i) => out.push({ n: c, k: KIND_AT[short], gap: i < p.length - 1 }));
            last = m.index + m[0].length;
        }
        if (last < s.length) out.push({ t: s.slice(last) });
        return out;
    }
    // the pieces' widths on this bitmap (its font): the coin: its number, 2 px, its picture (the font's size), a third of the font
    // before the next coin of the same sum
    function layout(bmp, ps) {
        const size = Math.round(bmp.fontSize * 1.05), gap = Math.max(2, Math.round(bmp.fontSize * 0.12)), sep = Math.round(bmp.fontSize * 0.32);
        let w = 0;
        for (const p of ps) {
            if (p.t !== undefined) { p.w = _measure.call(bmp, p.t); w += p.w; }
            else { p.nw = _measure.call(bmp, String(p.n)); p.w = p.nw + gap + size + (p.gap ? sep : 0); w += p.w; }
        }
        return { w: Math.ceil(w), size, gap };
    }
    const _drawText = Bitmap.prototype.drawText;
    Bitmap.prototype.drawText = function(text, x, y, maxWidth, lineHeight, align) {
        if (typeof text !== "string" || text.indexOf(" G") < 0 || !HAS.test(text)) return _drawText.apply(this, arguments);
        if (!sheetReady()) return _drawText.call(this, tekst(text, false), x, y, maxWidth, lineHeight, align);
        const ps = pieces(text), L = layout(this, ps), mw = maxWidth || L.w;
        let cx = align === "center" ? x + (mw - L.w) / 2 : align === "right" ? x + mw - L.w : x;
        const ctx = this.context, img = sheet._canvas || sheet._image, iy = Math.round(y + lineHeight / 2 - L.size / 2 - 1);
        for (const p of ps) {
            if (p.t !== undefined) { _drawText.call(this, p.t, cx, y, p.w + 8, lineHeight, "left"); cx += p.w; continue; }
            _drawText.call(this, String(p.n), cx, y, p.nw + 8, lineHeight, "left");
            const ix = Math.round(cx + p.nw + L.gap);
            ctx.save();
            ctx.globalAlpha = this.paintOpacity / 255;
            ctx.imageSmoothingEnabled = true;
            if (img) ctx.drawImage(img, p.k * 32, 0, 32, 32, ix, iy, L.size, L.size);
            ctx.restore();
            cx += p.w;
        }
        this._baseTexture.update();
    };
    const _measure = Bitmap.prototype.measureTextWidth;
    Bitmap.prototype.measureTextWidth = function(text) {
        if (typeof text !== "string" || text.indexOf(" G") < 0 || !HAS.test(text)) return _measure.call(this, text);
        if (!sheetReady()) return _measure.call(this, tekst(text, false));
        return layout(this, pieces(text)).w;
    };
    // the gold window: the sum as coins, right-aligned (the database's unit „G” is not drawn)
    Window_Base.prototype.drawCurrencyValue = function(value, unit, x, y, width) {
        this.resetTextColor();
        this.drawText(value + " G", x, y, width, "right");
    };

    const api = { VERSION: "1.1.0", krotko, dlugo, tekst, pieces, sheetReady };
    window.Monety = T && T.register ? T.register("Monety", api) : api;
})();
