//=============================================================================
// Spoilage.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Psucie się jedzenia: świeże mięso, ryby i potrawy z czasem się psują. Spiżarnia (Farming.js) spowalnia psucie. Zepsute jedzenie idzie do kompostownika. v1.0.0
 * @author Tawerna
 *
 * @param enabled
 * @text Jedzenie się psuje
 * @type boolean
 * @default true
 *
 * @param speed
 * @text Szybkość psucia (%)
 * @desc 100 = czasy z tabeli w kodzie (LIFE). 50 = jedzenie trzyma się dwa razy dłużej, 200 = psuje się dwa razy szybciej.
 * @type number
 * @min 10
 * @max 1000
 * @default 100
 *
 * @help
 * ============================================================================
 * PSUCIE SIĘ JEDZENIA
 * ============================================================================
 * Każda partia jedzenia (kupka zdobyta w jednym momencie) ma swój wiek. Gdy wiek
 * dojdzie do czasu życia z tabeli LIFE (godziny gry), partia zamienia się w
 * "Zepsute jedzenie" (przedmiot 122), a nad postacią pojawia się dymek. Kilka
 * godzin wcześniej dymek ostrzega, że coś zaraz się zepsuje.
 *
 *   surowe mięso ~2,5 doby, surowa ryba ~1,5 doby, zwierzyna 2 doby,
 *   upieczone mięso 5 dób, jajecznica ~1 doba, zupa 3 doby, chleb 5 dób,
 *   mleko 2 doby, warzywa 15-20 dób, wędzone mięso 20 dób, ser 30 dób.
 *   Zboże, miód, piwo, mąka i surowce się nie psują.
 *
 * Jedzenie zjadasz najstarsze pierwsze. Na liście przedmiotów liczba jest żółta,
 * gdy najstarsza partia ma za sobą połowę życia, i czerwona, gdy zostało jej
 * niewiele; w opisie stoi, za ile się zepsuje.
 *
 * SPIŻARNIA (budynek z Farming.js): jedzenie w niej starzeje się 5 razy wolniej.
 * Zwykła skrzynia trzyma jedzenie tak samo, jak plecak. Zepsute jedzenie w skrzyni
 * zamienia się w zepsute jedzenie. Kompostownik zamienia je w ziemię.
 *
 * Dla innych wtyczek: Spoilage.LIFE, Spoilage.ROT, Spoilage.chestPut(b, przedmiot,
 * ile) po włożeniu do skrzyni, Spoilage.chestPreload(b, przedmiot, ile) tuż przed
 * wyjęciem ze skrzyni, Spoilage.freshnessText(id).
 * ============================================================================
 */

(() => {
    "use strict";

    const params = PluginManager.parameters("Spoilage");
    const ENABLED = params.enabled !== "false";
    const SPEED = Math.max(0.1, Number(params.speed || 100) / 100);
    const ROT = 122;
    // item id -> hours of game time it stays good
    const LIFE = {
        94: 60, 95: 120, 98: 40, 99: 96, 101: 48, 102: 72, 103: 72, 104: 168,
        105: 480, 106: 360, 107: 30, 108: 96, 109: 72, 110: 120,
        71: 480, 72: 360, 73: 480, 75: 240, 83: 120, 123: 48, 124: 720,
        130: 96, 131: 96, 132: 60, 133: 72, 134: 48, 135: 240, 136: 96   // gulasz, kapuśniak, zupa grzybowa, owsianka, grzyby, pieczony ser, placek (the mead keeps)
    };
    const WARN_AT = 0.8;   // of the life: the popup "zaraz się zepsuje"

    const enabled = () => ENABLED && !!$gameSystem && typeof $gameSystem.dayNightDay === "function";
    const isPerishable = item => !!item && DataManager.isItem(item) && !!LIFE[item.id];
    const hoursNow = () => $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour();

    // $gameSystem._fresh = { bag: { itemId: [{ age (hours), n, w? }, ...] oldest first }, last: hours of the last tick }
    function state() {
        if (!$gameSystem._fresh) $gameSystem._fresh = { bag: {}, last: hoursNow() };
        return $gameSystem._fresh;
    }
    const batchesOf = id => state().bag[id] || (state().bag[id] = []);
    const total = list => list.reduce((s, b) => s + b.n, 0);

    let lastRemoved = {};   // item id -> the batches taken out by the last loseItem (for a chest to keep their age)
    let preloaded = {};     // item id -> batches the next gainItem should get (from a chest)

    // ---- every change of the bag goes through gainItem
    const _gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(item, amount, includeEquip) {
        if (!enabled() || !isPerishable(item)) return _gainItem.call(this, item, amount, includeEquip);
        const before = this.numItems(item);
        _gainItem.call(this, item, amount, includeEquip);
        const delta = this.numItems(item) - before;
        if (delta > 0) addBatches(item.id, delta);
        else if (delta < 0) lastRemoved[item.id] = takeOldest(item.id, -delta);
    };

    function addBatches(id, n) {
        const list = batchesOf(id);
        let left = n;
        const pre = preloaded[id];
        delete preloaded[id];
        for (const b of pre || []) {
            if (left <= 0) break;
            const take = Math.min(left, b.n);
            list.push({ age: b.age, n: take, w: b.w });
            left -= take;
        }
        if (left > 0) list.push({ age: 0, n: left });
        list.sort((p, q) => q.age - p.age);   // oldest first
    }
    function takeOldest(id, n) {
        const list = batchesOf(id), out = [];
        let left = n;
        while (left > 0 && list.length > 0) {
            const b = list[0], take = Math.min(left, b.n);
            out.push({ age: b.age, n: take, w: b.w });
            b.n -= take;
            left -= take;
            if (b.n <= 0) list.shift();
        }
        return out;
    }

    // ---- chests: Farming.js calls these when it moves food in and out (b.fresh[id] = [{ age, n }] like the bag)
    function chestPut(b, item, moved) {
        if (!enabled() || !isPerishable(item)) return;
        const taken = lastRemoved[item.id] || [];
        lastRemoved = {};
        if (!b.fresh) b.fresh = {};
        const list = b.fresh[item.id] || (b.fresh[item.id] = []);
        let left = moved;
        for (const t of taken) { list.push({ age: t.age, n: Math.min(left, t.n), w: t.w }); left -= t.n; }
        if (left > 0) list.push({ age: 0, n: left });
        list.sort((p, q) => q.age - p.age);
    }
    function chestPreload(b, item, moved) {
        if (!enabled() || !isPerishable(item)) return;
        const list = (b.fresh && b.fresh[item.id]) || [];
        const out = [];
        let left = moved;
        while (left > 0 && list.length > 0) {
            const c = list[0], take = Math.min(left, c.n);
            out.push({ age: c.age, n: take, w: c.w });
            c.n -= take;
            left -= take;
            if (c.n <= 0) list.shift();
        }
        preloaded[item.id] = out;
    }

    // ---- time
    function reconcile() {
        // stacks that were changed behind gainItem (an old save, a script): make the batches match the bag again
        for (const key of Object.keys(LIFE)) {
            const id = Number(key), item = $dataItems[id], have = $gameParty.numItems(item), list = batchesOf(id), sum = total(list);
            if (have > sum) addBatches(id, have - sum);
            else if (have < sum) takeOldest(id, sum - have);
        }
    }
    function popup(icon, text, color) {
        if (window.Survival && Survival.feedback) Survival.feedback(icon, text, color);
        else $gameTemp.pushLootPopup(icon, text, color);
    }
    function spoilBag(dt) {
        const rotItem = $dataItems[ROT];
        for (const key of Object.keys(LIFE)) {
            const id = Number(key), item = $dataItems[id], list = batchesOf(id), life = LIFE[id];
            let bad = 0, warn = false;
            for (const b of list) {
                b.age += dt;
                if (b.age >= life) bad += b.n;
                else if (b.age >= life * WARN_AT && !b.w) { b.w = true; warn = true; }
            }
            if (bad > 0) {
                state().bag[id] = list.filter(b => b.age < life);
                _gainItem.call($gameParty, item, -bad);
                if (rotItem) _gainItem.call($gameParty, rotItem, bad);
                AudioManager.playSe({ name: "Down1", volume: 70, pitch: 80, pan: 0 });
                popup(item.iconIndex, "Zepsuło się: " + item.name + " ×" + bad, "#d9b26a");
            } else if (warn) {
                popup(item.iconIndex, item.name + ": zaraz się zepsuje", "#ffd98f");
            }
        }
    }
    function ageChests(dt) {
        const f = $gameSystem._farm, F = window.Farming;
        if (!f || !f.buildings) return;
        for (const list of Object.values(f.buildings)) {
            for (const b of list || []) {
                if (!b.fresh) continue;
                const keeps = F && F.BUILDINGS[b.type] && F.BUILDINGS[b.type].keeps !== undefined ? F.BUILDINGS[b.type].keeps : 1;
                for (const key of Object.keys(b.fresh)) {
                    const id = Number(key), life = LIFE[id];
                    if (!life) { delete b.fresh[key]; continue; }
                    let bad = 0;
                    for (const c of b.fresh[key]) { c.age += dt * keeps; if (c.age >= life) bad += c.n; }
                    if (bad > 0) {
                        b.fresh[key] = b.fresh[key].filter(c => c.age < life);
                        const k = "i" + id;
                        if (b.store) {
                            b.store[k] = Math.max(0, (b.store[k] || 0) - bad);
                            if (b.store[k] <= 0) delete b.store[k];
                            b.store["i" + ROT] = (b.store["i" + ROT] || 0) + bad;
                        }
                    }
                }
            }
        }
    }
    function tick() {
        if (!enabled()) return;
        const s = state(), now = hoursNow();
        if (s.last === undefined || now < s.last) s.last = now;
        const dt = (now - s.last) * SPEED;
        if (now - s.last < 0.25) return;
        s.last = now;
        reconcile();
        spoilBag(dt);
        ageChests(dt);
    }
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        tick();
    };

    // ------------------------------------------------------------------
    // What the player sees
    // ------------------------------------------------------------------
    // hours left of the oldest batch of the item (null when it does not spoil or none is in the bag)
    function hoursLeft(id) {
        if (!enabled() || !LIFE[id]) return null;
        const list = batchesOf(id).filter(b => b.n > 0);
        return list.length ? Math.max(0, LIFE[id] - list[0].age) / SPEED : null;
    }
    function timeText(h) {
        if (h >= 48) return Math.round(h / 24) + " dni";
        if (h >= 24) return "około doby";
        const n = Math.max(1, Math.round(h));
        return n + (n === 1 ? " godzinę" : n % 10 >= 2 && n % 10 <= 4 && (n < 10 || n > 20) ? " godziny" : " godzin");
    }
    function freshnessText(id) {
        const h = hoursLeft(id);
        return h === null ? "" : "Najstarsza sztuka zepsuje się za " + timeText(h) + ".";
    }
    const _drawItemNumber = Window_ItemList.prototype.drawItemNumber;
    Window_ItemList.prototype.drawItemNumber = function(item, x, y, width) {
        if (enabled() && isPerishable(item) && this.needsNumber()) {
            const h = hoursLeft(item.id), ratio = h === null ? 1 : h * SPEED / LIFE[item.id];
            this.changeTextColor(ColorManager.textColor(ratio <= 1 - WARN_AT ? 18 : ratio <= 0.5 ? 17 : 0));
            this.drawText("×" + $gameParty.numItems(item), x, y, width, "right");
            this.resetTextColor();
            return;
        }
        _drawItemNumber.call(this, item, x, y, width);
    };
    const _Window_Help_setItem = Window_Help.prototype.setItem;
    Window_Help.prototype.setItem = function(item) {
        if (enabled() && isPerishable(item) && $gameParty.numItems(item) > 0) {
            this.setText(item.description + "\n" + freshnessText(item.id));
            return;
        }
        _Window_Help_setItem.call(this, item);
    };

    window.Spoilage = { LIFE, ROT, tick, chestPut, chestPreload, freshnessText, hoursLeft, enabled, state, isPerishable };
})();
