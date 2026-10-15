//=============================================================================
// Drops.js
//=============================================================================
// Tobołki (the user's, 2026-10-14): what the hero throws out of his bag (the P menu, Plecak, X "Wyrzuć") does not vanish - it lies on
// the ground in a bundle: on the free tile in front of him, else under him. Another drop on the same place goes into the same bundle.
// The action button (O) in front of a bundle, or standing on it: he crouches and takes it all back (the gains' list says what - as
// when gathering). The bundles stay on their map and in the save (TawernaCore state "drops"). The food in a bundle keeps its age and
// ages on the ground (Spoilage's chest calls), a bundle that does not fit in the bag (the load, a full stack) leaves the rest lying.
// What cannot be thrown out: the keepsakes (the pendant - MenuPanel.isKeepsake), what an active quest asks for (TownQuests' step,
// the quest board's contracts: the surplus may go). A worn thing whose last one goes is taken off first (Equipment).
// No events: the bundles are pictures (img/system/Gather_Bundle_0.png - PixelLab in the look of the ground's things, Gather_*,
// tools/art/ground_pixellab.py finish()) on a layer of the map, over the ground, under the characters.

/*:
 * @target MZ
 * @plugindesc Tobołki: rzeczy wyrzucone z plecaka (menu P, Plecak, X) leżą na ziemi; O na tobołku zabiera je z powrotem. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Torch
 * @orderAfter Equipment
 *
 * @help
 * ============================================================================
 * Tobołki
 * ============================================================================
 * W plecaku (menu P, zakładka Plecak) klawisz X przy wybranej rzeczy:
 * „Wyrzuć”. Najpierw ile (A/D o 1, W/S o 10, Tab wszystko), potem Tak/Nie.
 *
 * Wyrzucone rzeczy lądują w tobołku na kafelku przed bohaterem (jeśli wolny),
 * albo pod nim. Kolejne wyrzucenie w to samo miejsce dokłada do tobołka.
 * O przed tobołkiem albo stojąc na nim zabiera wszystko z powrotem (tyle, ile
 * udźwigniesz; reszta zostaje). Tobołki zostają na swojej mapie i w zapisie.
 *
 * Nie wyrzucisz pamiątek (wisior) ani tego, czego potrzebuje aktywne zadanie
 * (nadwyżkę tak). Noszona rzecz, której ostatnią sztukę wyrzucasz, zdejmuje
 * się sama.
 *
 * Dla innych wtyczek: Drops.refuse(przedmiot), Drops.maxDrop(przedmiot),
 * Drops.drop(id, ile), Drops.at(mapa, x, y), Drops.list(), Drops.spot(),
 * Drops.pickUp(tobołek), Drops.wornLast(przedmiot, ile).
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Drops.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const PLUGIN = "Drops";
    const PIC = "Gather_Bundle_0";
    const Z_LITTER = 1.5;   // (Farming_Render's Z.litter: over the ground and the soil, under the characters)

    // _tw.drops = { list: [{ id, map, x, y, items: { itemId: n }, fresh: { itemId: [{ age, n }] } (Spoilage), t: clock hours }], seq }
    const store = T.state.define("drops", () => ({ list: [], seq: 0 }), { version: 1, owner: PLUGIN });
    const all = () => store().list;
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const at = (map, x, y) => all().find(b => b.map === map && b.x === x && b.y === y) || null;
    const hoursNow = () => (window.$gameSystem && $gameSystem.dayNightDay ? $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour() : 0);
    let rev = 0;   // (the layer draws again when it changes)

    // ------------------------------------------------------------------
    // What may go
    // ------------------------------------------------------------------
    const isKeep = it => { const mp = T.api("MenuPanel"); return !!(mp && mp.isKeepsake && mp.isKeepsake(it)); };
    // how many of the item the active quests ask for: the town quests' current step (what to bring, the tools) and the board's contracts
    function questNeed(id) {
        let n = 0;
        try {
            const TQ = T.api("TownQuests");
            if (TQ && TQ.QUESTS && TQ.rec) for (const q of TQ.QUESTS) {
                const r = TQ.rec(q.id), st = r && r.s === "active" ? q.steps[r.step] : null;
                for (const x of ((st && st.need) || []).concat((st && st.tools) || [])) if (x[0] === id) n += x[1] || 1;
            }
        } catch (e) { /* (no quests: nothing) */ }
        try {
            const QB = T.api("QuestBoard");
            if (QB && QB.active) for (const c of QB.active()) for (const q of c.req || []) if (q.k === "item" && q.id === id) n += q.n || 1;
        } catch (e) { /* (no board: nothing) */ }
        return n;
    }
    // how many may go now (0: none)
    function maxDrop(it) {
        if (!it || !window.$gameParty || !DataManager.isItem(it) || isKeep(it)) return 0;
        return Math.max(0, $gameParty.numItems(it) - questNeed(it.id));
    }
    // why it cannot go (the popup's words), "" when it can
    function refuse(it) {
        if (!it || !DataManager.isItem(it)) return "Tego nie wyrzucę.";
        if (isKeep(it)) return "Tego nie wyrzucę. To pamiątka.";
        if (!($gameParty.numItems(it) > 0)) return "Nie mam tego.";
        if (maxDrop(it) <= 0) return "Tego nie wyrzucę. Potrzebne do zadania.";
        if (!spot()) return "Tu nie mam gdzie tego położyć.";
        return "";
    }
    // a worn thing whose last one goes (the jacket, the boots, the cloak, the backpack, the shield, the weapon in his hand); the
    // torch: the burning one is not in the bag, so the ones there are spares
    function wornLast(it, n) {
        const E = T.api("Equipment");
        return !!(it && E && E.worn && it.id !== E.TORCH && E.worn(it.id) && n >= $gameParty.numItems(it));
    }
    function takeOff(it) {
        const E = T.api("Equipment");
        if (!E) return;
        const slot = E.WEARABLE && E.WEARABLE[it.id];
        E.unequip(slot || "right");
    }

    // ------------------------------------------------------------------
    // Where: the bundle in front of him, the one under him, a free tile in front, under him
    // ------------------------------------------------------------------
    function frontTile() {
        const p = $gamePlayer, d = p.direction();
        return { x: $gameMap.roundXWithDirection(p.x, d), y: $gameMap.roundYWithDirection(p.y, d) };
    }
    function canPlace(x, y) {
        if (!$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f)) return false;
        const FP = T.api("Farming_parts");
        if (FP && FP.plots && FP.plots.isWaterTile && FP.plots.isWaterTile(x, y)) return false;
        if (T.call("Farming", "buildingAt", x, y)) return false;
        if (T.call("Torch", "stuckAt", $gameMap.mapId(), x, y)) return false;
        return !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority());
    }
    function spot() {
        if (!window.$gameMap || !$gameMap.mapId() || !window.$gamePlayer || $gamePlayer.isInVehicle()) return null;
        const map = $gameMap.mapId(), f = frontTile(), p = { x: $gamePlayer.x, y: $gamePlayer.y };
        if (at(map, f.x, f.y)) return f;
        if (at(map, p.x, p.y)) return p;
        return canPlace(f.x, f.y) && $gamePlayer.canPass(p.x, p.y, $gamePlayer.direction()) ? f : p;   // (in front: where he could step)
    }

    // ------------------------------------------------------------------
    // Throwing out, taking back
    // ------------------------------------------------------------------
    // the food in a bundle ages on the ground as in a chest
    function age(b) {
        const now = hoursNow(), dt = Math.max(0, now - (b.t || now));
        if (b.fresh && dt > 0) for (const key of Object.keys(b.fresh)) for (const x of b.fresh[key]) x.age += dt;
        b.t = now;
    }
    // n of item id out of the bag into the bundle (made or added to); the bundle, or null
    function drop(id, n) {
        const it = item(id);
        n = Math.floor(Number(n) || 0);
        if (!it || n <= 0 || refuse(it) || n > maxDrop(it)) return null;
        const s = spot(), map = $gameMap.mapId(), st = store();
        let b = at(map, s.x, s.y);
        if (b) age(b);
        else {
            st.seq = (st.seq || 0) + 1;
            b = { id: st.seq, map, x: s.x, y: s.y, items: {}, t: hoursNow() };
            all().push(b);
            ($gameTemp._dropsNew = $gameTemp._dropsNew || []).push(b.id);   // (falls onto the ground when the map is seen again)
        }
        if (wornLast(it, n)) takeOff(it);
        $gameParty.loseItem(it, n);
        const Sp = window.Spoilage;
        if (Sp && Sp.chestPut) Sp.chestPut(b, it, n);
        b.items[id] = (b.items[id] || 0) + n;
        rev++;
        return b;
    }
    // everything that fits back into the bag (the gains' list says what); the rest stays lying
    function takeAll(b) {
        const list = all(), i = list.indexOf(b);
        if (i < 0) return 0;
        age(b);
        const Sp = window.Spoilage;
        let got = 0;
        for (const key of Object.keys(b.items)) {
            const it = item(Number(key)), n = b.items[key];
            if (!it || !(n > 0)) { delete b.items[key]; continue; }
            const take = Math.min(n, Math.max(0, $gameParty.maxItems(it) - $gameParty.numItems(it)));
            if (take <= 0) continue;
            if (Sp && Sp.chestPreload) Sp.chestPreload(b, it, take);
            $gameParty.gainItem(it, take);
            got += take;
            if (n - take > 0) b.items[key] = n - take;
            else { delete b.items[key]; if (b.fresh) delete b.fresh[key]; }
        }
        if (!Object.keys(b.items).length) list.splice(list.indexOf(b), 1);
        else T.popup("Za ciężkie, więcej nie uniosę", { icon: item(Number(Object.keys(b.items)[0])).iconIndex, kind: "need" });
        rev++;
        return got;
    }
    // O on a bundle: a short crouch, then all of it into the bag
    let busy = false;
    function pickUp(b, opts) {
        const o = opts || {};
        const go = () => {
            if (takeAll(b) > 0) AudioManager.playSe({ name: "Equip1", volume: 70, pitch: 90, pan: 0 });
            else SoundManager.playBuzzer();
        };
        if (o.instant) { go(); return true; }
        const CT = T.api("ChoppableTree"), kind = CT && CT.swingKindOf ? CT.swingKindOf("Swing_Crouch") : -1;
        busy = true;
        if (kind >= 0 && $gamePlayer.startToolSwing && $gamePlayer.startToolSwing(kind, go, () => { busy = false; })) return true;
        go();
        busy = false;
        return true;
    }
    const _Game_Player_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && !this._swingEvent && !busy && all().length) {
            const t = frontTile(), map = $gameMap.mapId(), b = at(map, t.x, t.y) || at(map, this.x, this.y);
            if (b) return pickUp(b);
        }
        return _Game_Player_triggerButtonAction.call(this);
    };

    // ------------------------------------------------------------------
    // The bundles on the map
    // ------------------------------------------------------------------
    function Sprite_DropLayer() {
        this.initialize(...arguments);
    }
    Sprite_DropLayer.prototype = Object.create(Sprite.prototype);
    Sprite_DropLayer.prototype.constructor = Sprite_DropLayer;
    Sprite_DropLayer.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = Z_LITTER;
        this._pic = ImageManager.loadSystem(PIC);
        this._entries = [];
        this._stamp = null;
    };
    Sprite_DropLayer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!this._pic.isReady()) return;
        const stamp = $gameMap.mapId() + ":" + rev + ":" + all().length;
        if (stamp !== this._stamp) { this._stamp = stamp; this.rebuild(); }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const e of this._entries) {
            let dy = 0;
            if (e.fall !== undefined && e.fall < 1) {   // (a new one falls onto the ground and settles)
                e.fall = Math.min(1, e.fall + 1 / 14);
                dy = -14 * Math.pow(1 - e.fall, 2) + (e.fall > 0.8 ? -1.5 * Math.sin((e.fall - 0.8) / 0.2 * Math.PI) : 0);
            }
            e.sprite.x = Math.round($gameMap.adjustX(e.b.x) * tw + e.ox);
            e.sprite.y = Math.round($gameMap.adjustY(e.b.y) * th + e.oy + dy);
        }
    };
    Sprite_DropLayer.prototype.rebuild = function() {
        for (const e of this._entries) this.removeChild(e.sprite);
        this._entries = [];
        const map = $gameMap.mapId(), news = ($gameTemp && $gameTemp._dropsNew) || [], pic = this._pic;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const b of all()) {
            if (b.map !== map) continue;
            const sprite = new Sprite(pic);
            const e = { b, sprite, ox: Math.floor((tw - pic.width) / 2), oy: th - pic.height - 6 };
            if (news.includes(b.id)) e.fall = 0;
            this._entries.push(e);
            this.addChild(sprite);
        }
        if ($gameTemp) $gameTemp._dropsNew = [];
    };
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this._dropLayer = new Sprite_DropLayer();
        this._tilemap.addChild(this._dropLayer);
    };
    // (the picture loads with the map scene - no bundle coming in a moment after the map)
    const _Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _Scene_Map_create.call(this);
        ImageManager.loadSystem(PIC);
    };

    window.Drops = T.register(PLUGIN, {
        PIC, refuse, maxDrop, questNeed, wornLast, drop, pickUp, takeAll, spot, frontTile, canPlace,
        at: (map, x, y) => at(map, x, y),
        list: () => all().map(b => ({ id: b.id, map: b.map, x: b.x, y: b.y, items: Object.assign({}, b.items) })),
        layer: () => { const s = SceneManager._scene, ss = s && s._spriteset; return ss && ss._dropLayer ? ss._dropLayer._entries.map(e => ({ id: e.b.id, x: e.sprite.x, y: e.sprite.y, pic: PIC })) : []; }
    });
})();
