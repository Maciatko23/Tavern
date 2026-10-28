//=============================================================================
// CharacterPolish.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Szlif grafiki: cień i kontur postaci. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @param characterShadow
 * @text Cień pod postaciami
 * @type boolean
 * @default true
 *
 * @param characterOutline
 * @text Ciemny kontur postaci
 * @desc Cienka ciemna obwódka, dzięki której postać nie ginie na brązowej ziemi.
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * CharacterPolish.js
 * ============================================================================
 * Dwie drobne poprawki wyglądu, które działają same, bez ustawiania czegokolwiek:
 *
 *  1. Miękki cień pod każdą postacią (gracz, NPC, towarzysze), żeby stała na
 *     ziemi, a nie unosiła się nad nią. Obiekty (grafiki z "!" w nazwie:
 *     drzewa, skały, krzaki, skrzynie) mają własne cienie i są pomijane.
 *     Na dworze, w dzień, postać rzuca też cień od słońca: własną sylwetkę
 *     położoną na ziemi od stóp - rano długą w lewo, w południe krótką pod
 *     sobą, wieczorem długą w prawo; rusza się z każdym krokiem i zamachem,
 *     blednie w deszczu i pod chmurą, w nocy i pod dachem go nie ma
 *     (słońce: ChoppableTree_Render.js, jak cienie drzew).
 *  2. Ciemny kontur postaci (jeden piksel), żeby brązowy ubiór nie zlewał się
 *     z brązową ziemią.
 *
 * WYŁĄCZANIE NA MAPIE:
 *   W notatce mapy wpisz <Polish:off>, aby wyłączyć obie poprawki na tej
 *   mapie (np. we wnętrzach). Ten sam tag wyłącza też szczegóły na trawie
 *   z GroundDetail.js.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("CharacterPolish.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");

    const pluginName = "CharacterPolish";
    const params = PluginManager.parameters(pluginName);
    const CHAR_SHADOW = params.characterShadow !== "false";
    const CHAR_OUTLINE = params.characterOutline !== "false";

    // no <Polish:off> in the map's note (it wins over a <Polish:on> beside it; GroundDetail.js reads the same)
    // (asked by every sprite on every frame: read once a frame - 2026-10-24, wydajność)
    let polishMemo = { f: -1, map: null, on: true };
    function polishOn() {
        if (polishMemo.f !== Graphics.frameCount || polishMemo.map !== window.$dataMap) polishMemo = { f: Graphics.frameCount, map: window.$dataMap, on: T.mapFlag("Polish", true, "off") };
        return polishMemo.on;
    }

    // ------------------------------------------------------------------
    // Characters: soft ground shadow + thin dark outline
    // ------------------------------------------------------------------
    let shadowBitmap = null;
    function characterShadowBitmap() {
        if (shadowBitmap) return shadowBitmap;
        const w = 48, h = 18, bitmap = new Bitmap(w, h), ctx = bitmap.context;
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(1, h / w);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
        g.addColorStop(0, "rgba(10,8,4,0.42)");
        g.addColorStop(0.65, "rgba(10,8,4,0.26)");
        g.addColorStop(1, "rgba(10,8,4,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (bitmap._baseTexture && bitmap._baseTexture.update) bitmap._baseTexture.update();
        shadowBitmap = bitmap;
        return bitmap;
    }

    const OUTLINE_FRAGMENT = [
        "precision mediump float;",
        "varying vec2 vTextureCoord;",
        "uniform sampler2D uSampler;",
        "uniform highp vec4 inputSize;",
        "uniform vec4 outlineColor;",
        "void main(void) {",
        "    vec4 c = texture2D(uSampler, vTextureCoord);",
        "    vec2 px = inputSize.zw;",
        "    float a = texture2D(uSampler, vTextureCoord + vec2(px.x, 0.0)).a;",
        "    a = max(a, texture2D(uSampler, vTextureCoord - vec2(px.x, 0.0)).a);",
        "    a = max(a, texture2D(uSampler, vTextureCoord + vec2(0.0, px.y)).a);",
        "    a = max(a, texture2D(uSampler, vTextureCoord - vec2(0.0, px.y)).a);",
        "    vec4 o = vec4(outlineColor.rgb * outlineColor.a, outlineColor.a) * a;",
        "    gl_FragColor = c + o * (1.0 - c.a);",
        "}"
    ].join("\n");

    let outlineFilter = null;   // one filter object is shared by all characters
    function sharedOutlineFilter() {
        if (outlineFilter !== null) return outlineFilter || null;
        try {
            outlineFilter = new PIXI.Filter(undefined, OUTLINE_FRAGMENT, { outlineColor: [0.09, 0.05, 0.03, 0.8] });
            outlineFilter.padding = 2;
        } catch (e) {
            outlineFilter = false;   // no WebGL filters: the shadow alone has to do
        }
        return outlineFilter || null;
    }

    // a person, not an object: the "!" prefix marks trees, rocks, chests and the like
    const objectNames = new Map();   // (the answer for each picture's name, read once: a regex per sprite per frame before)
    const isObjectName = name => {
        let v = objectNames.get(name);
        if (v === undefined) objectNames.set(name, (v = !!ImageManager.isObjectCharacter(name)));
        return v;
    };
    Sprite_Character.prototype.isPerson = function() {
        const c = this._character;
        // (by the picture's name: a character whose picture was changed without setImage - grandpa's cat lying down to sleep,
        // "!$Animal_Cat_Sleep" - keeps its old object flag)
        return !!c && !!this._characterName && !this._tileId && !isObjectName(this._characterName) &&
            !(typeof Game_Vehicle !== "undefined" && c instanceof Game_Vehicle);
    };

    const _Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _Sprite_Character_update.call(this);
        if (CHAR_SHADOW || CHAR_OUTLINE) this.updatePolish();
    };

    Sprite_Character.prototype.updatePolish = function() {
        const show = polishOn() && this.isPerson();
        if (CHAR_SHADOW) this.updateGroundShadow(show);
        if (CHAR_SHADOW) this.updateSunShadow(show);
        if (CHAR_OUTLINE) this.updateOutline(show);
    };

    Sprite_Character.prototype.updateGroundShadow = function(show) {
        if (!this._groundShadow) {
            if (!show || !this.parent) return;
            const shadow = new Sprite(characterShadowBitmap());
            shadow.anchor.x = 0.5;
            shadow.anchor.y = 0.5;
            shadow.z = 2;   // below every character, above the ground
            this._groundShadow = shadow;
            this.parent.addChild(shadow);
        }
        const c = this._character, shadow = this._groundShadow;
        shadow.visible = show && this.visible && this.opacity > 0 && !c.isTransparent();
        if (!shadow.visible) return;
        if (shadow.parent !== this.parent && this.parent) this.parent.addChild(shadow);
        shadow.x = this.x;
        shadow.y = this.y - 3 + (typeof c.jumpHeight === "function" ? c.jumpHeight() : 0);
        shadow.opacity = this.opacity;
        // a small jump shrinks the shadow a little
        const lift = typeof c.jumpHeight === "function" ? c.jumpHeight() : 0;
        shadow.scale.x = Math.max(0.6, 1 - lift / 120);
        shadow.scale.y = shadow.scale.x;
    };

    // ---- the sun's shadow of a person (user 2026-09-30): the figure's own shape, soft and dark, laid on the ground from its feet
    // the way the sun throws it (T.api("Sun") - the sun, the shared shadow layer and the laying of a silhouette are in
    // ChoppableTree_Render.js, with the trees' shadows): long to the left in the morning, short under it at noon, long to the right
    // in the evening. It is the frame on screen right now, so it walks with every step and swings with every blow (a swing is drawn
    // by _swingBody, a child sprite, while the walking frame is hidden). Under a roof, at night and in a storm there is none; the
    // soft spot under the feet stays anyway (it is the ground's own shade).
    const SUN_SHADOW_INSET = 2;   // px up inside the feet, where the figure hides the soft start of the blur
    Sprite_Character.prototype.updateSunShadow = function(show) {
        const Sun = T.api("Sun");
        let shadow = this._sunShadow;
        // only people: a tree keeps the occluder its own code gave it (ChoppableTree_Render.js) - this ran for every sprite and wiped
        // the trees' ones each frame, so no tree threw a shadow from a fire at night (user: "drzewa nie rzucają cienia od ogniska")
        if (!this.isPerson()) {
            if (shadow) shadow.visible = false;
            // (only the shape this plugin gave it: a cat that lay down to sleep - "!" - keeps none; a tree's or a rock's is their own)
            if (this._occluderByPolish) { this._occluder = null; this._occluderByPolish = false; }
            return;
        }
        const body = this._swingBody && this._swingBody.visible && this._swingBody.bitmap ? this._swingBody : null;
        const src = body || this, frame = src._frame, c = this._character;
        // (the shape in a light's way is kept on a map without polish too - <Polish:off>: a lamp there still makes people throw shadows)
        const on = Sun && Sun.occluder && this.parent && this.visible && this.opacity > 0 && !c.isTransparent() &&
            src.bitmap && src.bitmap.isReady() && frame && frame.width > 0 && frame.height > 0;
        const bmp = on ? (Sun.silhouetteOf ? Sun.silhouetteOf(this, src.bitmap, frame.x, frame.y, frame.width, frame.height, false) : Sun.silhouette(src.bitmap, frame.x, frame.y, frame.width, frame.height, false)) : null;
        if (bmp) {
            // the feet on the screen: the frame's lowest solid row under its anchor, on the ground (a jump lifts the figure, not its shadow)
            const sx = this.scale.x * (body ? body.scale.x : 1), sy = this.scale.y * (body ? body.scale.y : 1);
            const ox = this.x + (body ? body.x * this.scale.x : 0), oy = this.y + (body ? body.y * this.scale.y : 0) + (c.jumpHeight ? c.jumpHeight() : 0);
            const fw = frame.width, fh = frame.height;
            const fx = ox + (fw / 2 - src.anchor.x * fw) * sx, fy = oy + (bmp._footRow + 1 - src.anchor.y * fh - SUN_SHADOW_INSET) * sy;
            this._occluder = this._occPerson = Sun.occluder(bmp, fx, fy, fw / 2, sx, sy, 0, this.opacity / 255, this._occPerson);   // (a fire's light at night uses it too)
            this._occluderByPolish = true;
        } else {
            this._occluder = null;
            this._occluderByPolish = false;
        }
        if (!show || !bmp || !Sun.shadows || Sun.now().light <= 0.01) {
            if (shadow) shadow.visible = false;
            return;
        }
        const layer = Sun.layer(this.parent);
        if (!shadow) shadow = this._sunShadow = new Sprite();
        if (shadow.parent !== layer) layer.addChild(shadow);
        if (Sun.lay(shadow, this._occluder) === false) {   // (the whole shadow off the screen: shown, not drawn - Sky.js lay)
            shadow.visible = Sun.layerAlpha(layer) * (this.opacity / 255) > 0.005;
            return;
        }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const cloud = Sun.now().flash ? 0 : Sun.cloudCover((c._realX + 0.5) * tw, (c._realY + 1) * th);
        shadow.alpha = Sun.layerAlpha(layer) * (this.opacity / 255) * (1 - 0.85 * cloud);
        shadow.visible = shadow.alpha > 0.005;
    };

    // the shadows are siblings of the sprite (in the tilemap, so they sort under every character): they have to go with it - a rabbit
    // shot or caught in a snare (Hunting.js drops its sprite) once left its shadow lying on the grass until the map was built again
    const _Sprite_Character_destroy = Sprite_Character.prototype.destroy;
    Sprite_Character.prototype.destroy = function(options) {
        for (const shadow of [this._groundShadow, this._sunShadow, this._outlineSprite]) if (shadow && shadow.parent) shadow.parent.removeChild(shadow);
        this._groundShadow = null;
        this._sunShadow = null;
        if (this._outlineSprite) this._outlineSprite._owner = null;
        this._outlineSprite = null;
        _Sprite_Character_destroy.call(this, options);
    };

    // ---- the outline (2026-10-24, wydajność: a filter of its own on every person was a whole pass of its own - the batch broken,
    // a texture drawn and read back - for every one of them on every frame). A plain figure - its own frame only (no marker over the
    // head, no swing, no half body in a bush drawn by children), not scaled, not turned, not the hero (his sheet is dressed live) -
    // gets the outline as a picture of its own drawn right under it: the same dark pixels where the filter put them (every
    // pixel next to the figure on four sides: 0.8 x the most solid of those four neighbours, in the outline's colour), drawn
    // before the figure (the same z and y, just before it in the map's order), so the figure covers it as the filter's
    // "colour + outline x (1 - its alpha)" did. Anything else keeps the filter. Wydajnosc.js opts.outline false: the filter for all.
    const OUTLINE_RGB = [0.09, 0.05, 0.03], OUTLINE_A = 0.8;
    const outlineBitmaps = new Map();
    let outlineIds = 0;
    function outlineBitmap(src, f) {
        const id = src._outlineId || (src._outlineId = ++outlineIds);
        const key = id + ":" + (src._url || "") + ":" + f.x + "," + f.y + "," + f.width + "," + f.height;
        let out = outlineBitmaps.get(key);
        if (out) return out;
        const w = f.width, h = f.height, tmp = new Bitmap(w, h);
        tmp.blt(src, f.x, f.y, w, h, 0, 0);
        const d = tmp.context.getImageData(0, 0, w, h).data;
        tmp.destroy();
        const alpha = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
        out = new Bitmap(w + 2, h + 2);
        const img = out.context.createImageData(w + 2, h + 2), o = img.data, R = Math.round(OUTLINE_RGB[0] * 255), G = Math.round(OUTLINE_RGB[1] * 255),
            B = Math.round(OUTLINE_RGB[2] * 255);
        for (let Y = 0; Y < h + 2; Y++) {
            for (let X = 0; X < w + 2; X++) {
                const x = X - 1, y = Y - 1, a = Math.max(alpha(x - 1, y), alpha(x + 1, y), alpha(x, y - 1), alpha(x, y + 1));
                if (!a) continue;
                const i = (Y * (w + 2) + X) * 4;
                o[i] = R; o[i + 1] = G; o[i + 2] = B; o[i + 3] = Math.round(OUTLINE_A * a);
            }
        }
        out.context.putImageData(img, 0, 0);
        out._baseTexture.update();
        out.smooth = src.smooth;
        if (outlineBitmaps.size > 1500) outlineBitmaps.delete(outlineBitmaps.keys().next().value);   // (old frames go - they are made again when needed)
        outlineBitmaps.set(key, out);
        return out;
    }
    const outlineBySprite = () => { const W = T.api("Wydajnosc"); return !!(W && W.opts && W.opts.outline !== false); };
    // the figure is drawn by its own frame alone, at its size, upright
    function plainFigure(spr) {
        const c = spr._character, f = spr._frame;
        if (!c || c === $gamePlayer || c.isCreature || !spr.bitmap || spr.bitmap._ubior || !f || f.width <= 0 || f.height <= 0) return false;
        if (Math.abs(spr.scale.x) !== 1 || Math.abs(spr.scale.y) !== 1 || spr.rotation !== 0) return false;
        for (const ch of spr.children) {
            if (ch === spr._outlineSprite || !ch.visible || ch.renderable === false || !(ch.alpha > 0)) continue;
            if ((ch._frame && ch._frame.width > 0 && ch._bitmap) || (ch.children && ch.children.length) || !(ch instanceof Sprite)) return false;
        }
        return true;
    }
    function Sprite_PolishOutline() {
        this.initialize(...arguments);
    }
    Sprite_PolishOutline.prototype = Object.create(Sprite.prototype);
    Sprite_PolishOutline.prototype.constructor = Sprite_PolishOutline;
    Sprite_PolishOutline.prototype.initialize = function(owner) {
        Sprite.prototype.initialize.call(this);
        this._owner = owner;
        this._on = false;
    };
    Sprite_PolishOutline.prototype.update = function() {};
    // just before the drawing: the figure as it is now (after every plugin's update), its frame's outline under it
    Sprite_PolishOutline.prototype.updateTransform = function() {
        const o = this._owner, f = o && o._frame;
        const ok = this._on && !!o && o.parent === this.parent && o.visible && o.renderable !== false && plainFigure(o);
        if (ok) {
            const bmp = outlineBitmap(o.bitmap, f);
            if (this.bitmap !== bmp) this.bitmap = bmp;
            this.anchor.set((o.anchor.x * f.width + 1) / (f.width + 2), (o.anchor.y * f.height + 1) / (f.height + 2));
            this.x = o.x;
            this.y = o.y;
            this.scale.set(o.scale.x, o.scale.y);
            this.alpha = o.alpha;
            this.blendMode = o.blendMode;
        }
        this.renderable = ok;
        Sprite.prototype.updateTransform.call(this);
    };

    Sprite_Character.prototype.updateOutline = function(show) {
        const shared = show ? sharedOutlineFilter() : null;
        const bySprite = !!shared && !!this.parent && outlineBySprite() && plainFigure(this);
        const filter = bySprite ? null : shared;
        const has = !!this._polishOutline;
        if (filter && !has) {
            this.filters = (this.filters || []).concat([filter]);
            this._polishOutline = true;
        } else if (!filter && has) {
            this.filters = (this.filters || []).filter(f => f !== outlineFilter);
            this._polishOutline = false;
        }
        let ol = this._outlineSprite;
        if (bySprite && !ol) ol = this._outlineSprite = new Sprite_PolishOutline(this);
        if (!ol) return;
        ol._on = bySprite;
        ol.visible = bySprite;
        if (!bySprite) return;
        if (ol.parent !== this.parent) this.parent.addChild(ol);
        // its place in the map's order: right before the figure (the same z and y; the figure's id less a half)
        ol.z = this.z;
        ol.y = this.y;
        ol.spriteId = this.spriteId - 0.5;
        if (this._sortY !== undefined) ol._sortY = this._sortY;
        else if (ol._sortY !== undefined) delete ol._sortY;
    };

    window.CharacterPolish = { sharedOutlineFilter };
})();
