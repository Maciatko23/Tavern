//=============================================================================
// CharacterPolish.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Szlif grafiki: cień i kontur postaci. v1.0.0
 * @author Claude
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

    const pluginName = "CharacterPolish";
    const params = PluginManager.parameters(pluginName);
    const CHAR_SHADOW = params.characterShadow !== "false";
    const CHAR_OUTLINE = params.characterOutline !== "false";

    // duplicated in GroundDetail.js (kept self-contained so either file can load alone)
    function polishOn() {
        const note = ($dataMap && $dataMap.note) || "";
        return !/<Polish:\s*off\s*>/i.test(note);
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
    Sprite_Character.prototype.isPerson = function() {
        const c = this._character;
        return !!c && !!this._characterName && !this._tileId && !this.isObjectCharacter() &&
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

    // the shadow is a sibling of the sprite (in the tilemap, so it sorts under every character): it has to go with it - a rabbit shot
    // or caught in a snare (Hunting.js drops its sprite) once left its shadow lying on the grass until the map was built again
    const _Sprite_Character_destroy = Sprite_Character.prototype.destroy;
    Sprite_Character.prototype.destroy = function(options) {
        const shadow = this._groundShadow;
        if (shadow && shadow.parent) shadow.parent.removeChild(shadow);
        this._groundShadow = null;
        _Sprite_Character_destroy.call(this, options);
    };

    Sprite_Character.prototype.updateOutline = function(show) {
        const filter = show ? sharedOutlineFilter() : null;
        const has = !!this._polishOutline;
        if (filter && !has) {
            this.filters = (this.filters || []).concat([filter]);
            this._polishOutline = true;
        } else if (!filter && has) {
            this.filters = (this.filters || []).filter(f => f !== outlineFilter);
            this._polishOutline = false;
        }
    };

    window.CharacterPolish = { sharedOutlineFilter };
})();
