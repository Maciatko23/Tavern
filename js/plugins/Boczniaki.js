//=============================================================================
// Boczniaki.js
//=============================================================================
// (2026-11-19, the user: more wild food - the year had nothing to gather in winter) oyster mushrooms on the stumps: on every stump -
// a natural one (<Stump>, "Pieniek") and the stump of a felled tree (a <Tree> on its stump page) - a cluster may grow in autumn
// and in winter, far more often in the days after rain or snow, and stays LIFE days unless it is picked. Nothing is stored but the
// day a stump's cluster was picked (Tawerna.state "boczniaki"); where and when they grow is a hash of the stump and the day, like
// Farming's mushrooms. The cluster is drawn on the stump (img/system/Gather_Boczniak_0/_1); O at the stump ("Kop pieniek") takes the
// mushrooms first (a crouch), the next O digs as before.

/*:
 * @target MZ
 * @plugindesc Boczniaki na pniakach: jesienią i zimą (po deszczu i śniegu częściej) rosną na pniach, zbierasz je przed wykopaniem pnia. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter ChoppableTree_Render
 * @orderAfter Forestry
 *
 * @help
 * ============================================================================
 * Boczniaki.js - boczniaki na pniakach
 * ============================================================================
 * Jesienią i zimą na pniakach (naturalnych i po ściętych drzewach) rosną
 * boczniaki - najczęściej dzień po deszczu albo śniegu. Stoją kilka dni.
 * Przy pniaku O: najpierw zbierasz boczniaki, dopiero następne O kopie pień.
 * Obrazki: img/system/Gather_Boczniak_0.png i _1.png.
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "Boczniaki";
    const T = window.Tawerna;
    if (!T) throw new Error("Boczniaki.js: brak TawernaCore.js (the Tawerna core is missing)");

    const OYSTER = 510;                          // Boczniaki (the item)
    const LIFE = 4;                              // days a cluster stays on its stump
    const CHANCE = [0, 0, 0.1, 0.08];            // a day, a stump, by the season (spring, summer, autumn, winter)
    const WET = 3, MAX_CHANCE = 0.4;             // after rain or snow (that day or the day before): three times as often
    const COUNT = [2, 4];
    const CROUCH_KIND = 6;                       // ChoppableTree's crouch
    // the clusters: 48x48 layers made on the Winlu stump tile itself (PixelLab edit of tile 516, only the mushrooms' pixels kept), so
    // they lie exactly over the stump's tile - on the left side / on the right side of the bark
    const PICTURES = ["Gather_Boczniak_0", "Gather_Boczniak_1"];

    const store = T.state.define("boczniaki", () => ({ picked: {} }), { version: 1, owner: PLUGIN });
    let rev = 0;                                 // bumped on a pick: the sprites look again
    const day = () => T.time.day();
    const keyOf = e => e._mapId + ":" + e._eventId;
    const sw = (e, ch) => $gameSelfSwitches.value([e._mapId, e._eventId, ch]);

    // a stump standing now: its page shows the stump tile and it is not dug out (B)
    function isStump(e) {
        if (!e || !(e instanceof Game_Event) || e._erased || !(e.tileId() > 0) || sw(e, "B")) return false;
        const data = e.event(), CT = T.api("ChoppableTree");
        if (!data) return false;
        if (/<Stump\b/i.test(data.note || "")) return true;
        return !!(CT && CT.treeConfig && CT.treeConfig(e)) && sw(e, "A");
    }
    const wetDay = d => { const p = T.call("Survival", "weatherPlan", d); return !!p && (p.type === "rain" || p.type === "snow"); };
    function chance(d) {
        const base = CHANCE[T.time.season(d)] || 0;
        return base > 0 ? Math.min(MAX_CHANCE, base * (wetDay(d) || wetDay(d - 1) ? WET : 1)) : 0;
    }
    // the day the cluster on this stump now was born (the newest of the last LIFE days), or null
    function bornOn(e) {
        const today = day(), seed = e._mapId * 7919 + e._eventId * 104729;
        for (let d = today; d > today - LIFE && d >= 1; d--) {
            const c = chance(d);
            if (c > 0 && T.util.hash(seed, d * 31 + 7) < c) return d;
        }
        return null;
    }
    function hasOyster(e) {
        if (!isStump(e)) return false;
        const born = bornOn(e), picked = store().picked[keyOf(e)];
        return born !== null && (picked === undefined || born > picked);
    }
    function pick(e) {
        const item = $dataItems[OYSTER];
        if (!item || !hasOyster(e)) return false;
        const done = () => {
            if (!hasOyster(e)) return;
            const n = COUNT[0] + Math.floor(Math.random() * (COUNT[1] - COUNT[0] + 1));
            store().picked[keyOf(e)] = day();
            rev++;
            $gameParty.gainItem(item, n);
            T.audio.se("Item1", { volume: 80, pitch: 112 });
        };
        if (!($gamePlayer.startToolSwing && $gamePlayer.startToolSwing(CROUCH_KIND, done))) done();
        return true;
    }

    // O at a stump with mushrooms: the mushrooms first (the stump's command is ChoppableTree's "dig")
    const parts = T.api("ChoppableTree_parts");
    if (parts && parts.objects && typeof parts.objects.strike === "function") {
        const strike = parts.objects.strike;
        parts.objects.strike = function(interpreter, kind) {
            if (kind === "dig") {
                const e = $gameMap.event(interpreter && interpreter._eventId);
                if (e && hasOyster(e) && !e.isTreeAnimating()) { pick(e); return; }
            }
            return strike.apply(this, arguments);
        };
    }

    // the cluster on the stump's sprite (worked out again only when the day, a pick or the stump's look changes)
    const _update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _update.call(this);
        const e = this._character;
        if (!(e instanceof Game_Event)) return;
        const stamp = day() + ":" + rev + ":" + e.tileId() + ":" + e._pageIndex;
        if (this._oyStamp === stamp) return;
        this._oyStamp = stamp;
        const on = hasOyster(e);
        if (!on) { if (this._oyster) this._oyster.visible = false; return; }
        if (!this._oyster) {
            const pic = PICTURES[Math.floor(T.util.hash(e._mapId * 31 + e._eventId, 911) * PICTURES.length)];
            const s = new Sprite(ImageManager.loadSystem(pic));
            s.anchor.x = 0.5;
            s.anchor.y = 1;
            this._oyster = s;
            this.addChild(s);
        }
        this._oyster.visible = true;
        this._oyster.x = 0;
        this._oyster.y = 0;   // (the character sprite's foot is the tile's bottom edge: the layer covers the tile exactly)
    };

    window.Boczniaki = T.register(PLUGIN, { OYSTER, LIFE, CHANCE, isStump, bornOn, hasOyster, pick, chance, state: store });
})();
