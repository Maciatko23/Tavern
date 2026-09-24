//=============================================================================
// Needs.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Głód i pragnienie: dwa paski pod wytrzymałością. Kto jest głodny albo spragniony, traci więcej sił przy pracy, a jego wytrzymałość ma niższy sufit. Woda ze stawu, studni, deszczu i bukłaka. v1.0.0
 * @author Tawerna
 * @orderAfter Survival
 *
 * @param enabled
 * @text Głód i pragnienie działają
 * @type boolean
 * @default true
 *
 * @param foodRate
 * @text Głód: ile sytości ubywa na godzinę
 * @type number
 * @decimals 2
 * @min 0
 * @default 1.6
 *
 * @param waterRate
 * @text Pragnienie: ile nawodnienia ubywa na godzinę
 * @type number
 * @decimals 2
 * @min 0
 * @default 2.5
 *
 * @help
 * ============================================================================
 * GŁÓD I PRAGNIENIE
 * ============================================================================
 * Postać ma dwie miary od 0 do 100: sytość i nawodnienie. Ubywają z upływem czasu
 * gry (na sen i odpoczynek o połowę wolniej) i od pracy: im więcej sił wydajesz,
 * tym bardziej chce ci się pić i jeść. Latem pragnienie rośnie szybciej, zimą
 * głód. W deszczu na dworze nawodnienie zamiast spadać rośnie.
 *
 *   SYTOŚĆ           50+  w porządku
 *                    25+  Głodny: wszystko kosztuje 15% więcej sił
 *                     1+  Bardzo głodny: +35% sił i sufit wytrzymałości 85%
 *                      0  Głodujesz: +60% sił, sufit 55% i wytrzymałość co godzinę spada
 *   NAWODNIENIE      50+  w porządku
 *                    25+  Spragniony: +20% sił
 *                     1+  Odwodniony: +50% sił i sufit 70%
 *                      0  Wysuszony: dwa razy więcej sił, sufit 40% i wytrzymałość szybko spada
 *
 * Sufit oznacza, że wytrzymałość nie wróci powyżej tej wartości, nawet po spaniu:
 * najpierw trzeba się napić albo najeść. Koszty głodu i pragnienia mnożą się ze sobą
 * i z premiami z Survival.js (Najedzony, zimno).
 *
 * JEDZENIE: potrawy z menu Przedmioty syci (tablica FEED w kodzie albo klucze fed=
 * i water= w notatce <Food:...> przedmiotu). Zjeść można też przy pełnych siłach,
 * jeśli jesteś głodny albo spragniony.
 * PICIE: przy stawie i studni "Napij się" (+40). BUKŁAK (Zrób bukłak w menu
 * Wytwórz...) mieści 4 łyki po 35, napełniasz go przy wodzie, a pijesz z niego
 * klawiszem G albo z menu Przedmioty.
 *
 * Dla innych wtyczek: Needs.state(), Needs.eat(przedmiot), Needs.drink(ile),
 * Needs.drinkFromSkin(), Needs.fillSkin(), Needs.setEnabled(bool).
 * ============================================================================
 */

(() => {
    "use strict";

    const params = PluginManager.parameters("Needs");
    let ON = params.enabled !== "false";
    const FOOD_RATE = Number(params.foodRate || 1.6);
    const WATER_RATE = Number(params.waterRate || 2.5);
    const SLEEP_FACTOR = 0.5;
    const WORK_FOOD = 0.04, WORK_WATER = 0.07;      // extra loss per point of stamina spent
    const RAIN_GAIN = 1.5;                          // nawodnienie per hour outdoors in the rain
    const SKIN = { item: 129, max: 4, sip: 35 };
    const TAP_DRINK = 40;
    Input.keyMapper[71] = "drink";   // G

    // level 0..3 for each meter: thresholds, the cost factor, the ceiling of stamina (share of the maximum), the name
    const FOOD = { steps: [50, 25, 0.5], factor: [1, 1.15, 1.35, 1.6], cap: [1, 1, 0.85, 0.55], name: ["", "Głodny", "Bardzo głodny", "Głodujesz"], drain: [0, 0, 0, 1] };
    const WATER = { steps: [50, 25, 0.5], factor: [1, 1.2, 1.5, 2], cap: [1, 1, 0.7, 0.4], name: ["", "Spragniony", "Odwodniony", "Wysuszony"], drain: [0, 0, 0, 2] };
    // fullness and water an eaten item gives: [fed, water]
    const FEED = {
        71: [6, 0], 72: [8, 0], 73: [10, 0], 75: [6, 0], 76: [8, 0], 81: [5, 10], 83: [30, 0], 95: [45, 0], 99: [38, 0], 102: [8, 10], 103: [8, 0],
        105: [55, 0], 106: [48, 0], 107: [30, 0], 108: [35, 0], 109: [55, 20], 110: [6, 25], 123: [8, 30], 124: [32, 0]
    };

    const enabled = () => ON && !!$gameSystem && typeof $gameSystem.dayNightDay === "function";
    const clamp = v => Math.max(0, Math.min(100, v));
    const level = (v, t) => (v >= t.steps[0] ? 0 : v >= t.steps[1] ? 1 : v >= t.steps[2] ? 2 : 3);

    // $gameSystem._needs = { food, water, skin (charges), lf, lw (last levels, for the warnings), drinks (how many times), meals }
    function needs() {
        if (!$gameSystem._needs) $gameSystem._needs = { food: 90, water: 90, skin: 0, lf: 0, lw: 0, drinks: 0, meals: 0 };
        return $gameSystem._needs;
    }
    const levels = () => ({ food: level(needs().food, FOOD), water: level(needs().water, WATER) });
    function factor() {
        const l = levels();
        const p = Math.min(1, perk("needs.penalty")), soft = f => 1 + (f - 1) * (1 - p);   // (Żelazny organizm)
        return soft(FOOD.factor[l.food]) * soft(WATER.factor[l.water]);
    }
    function capRatio() {
        const l = levels();
        const p = Math.min(1, perk("needs.penalty")), soft = c => 1 - (1 - c) * (1 - p);
        return Math.min(soft(FOOD.cap[l.food]), soft(WATER.cap[l.water]));
    }
    function popup(icon, text, color) {
        $gameTemp.pushLootPopup(icon, text, color);
    }
    const FOOD_ICON = 390, WATER_ICON = 391;
    function warn() {
        const n = needs(), l = levels();
        if (l.food > n.lf) popup(FOOD_ICON, ["", "Jesteś głodny", "Bardzo głodny: wszystko kosztuje więcej sił", "Głodujesz! Zjedz coś"][l.food], l.food >= 3 ? "#ff8f8f" : l.food === 2 ? "#ffb070" : "#ffd98f");
        if (l.water > n.lw) popup(WATER_ICON, ["", "Chce ci się pić", "Odwodnienie! Napij się wody", "Umierasz z pragnienia! Napij się"][l.water], l.water >= 3 ? "#ff8f8f" : l.water === 2 ? "#ffb070" : "#ffd98f");
        n.lf = l.food;
        n.lw = l.water;
    }

    // ---- outdoors (the same rule as Survival.js) and the season
    function outdoors() {
        const note = ($dataMap && $dataMap.note) || "";
        if (/<Weather:\s*off\s*>/i.test(note)) return false;
        return /<Weather:\s*on\s*>/i.test(note) || /<Clouds:\s*on\s*>/i.test(note);
    }
    const seasonNow = () => (window.Farming && Farming.seasonIndex ? Farming.seasonIndex($gameSystem.dayNightDay()) : 0);
    const raining = () => outdoors() && ["rain", "storm"].includes($gameScreen.weatherType()) && $gameScreen._weatherPowerTarget > 0;

    // the hero's skills (Combat.js, Skills_Data.js): perk(key) = what the learnt skills add up to for an effect, perkRoll(key) = a
    // roll against it (a chance), knowsSkill(id) = that one skill is learnt
    const perk = key => (window.Combat && Combat.perk ? Combat.perk(key) : 0);
    const perkRoll = key => { const c = perk(key); return c > 0 && Math.random() < c; };
    const knowsSkill = id => !!(window.Combat && Combat.hasSkill && Combat.hasSkill(id));
    // hours of game time have passed (k: 1 awake, less asleep)
    function decay(hours, k) {
        if (!enabled() || !(hours > 0)) return;
        const n = needs(), season = seasonNow();
        const foodLoss = FOOD_RATE * (season === 3 ? 1.25 : 1) * k * hours * (1 - Math.min(0.8, perk("hunger")));   // (Mały żołądek, Wielbłąd)
        let waterLoss = WATER_RATE * (season === 1 ? 1.25 : 1) * k * hours * (1 - Math.min(0.8, perk("thirst")));
        if (raining() && k >= 1) waterLoss = -RAIN_GAIN * hours;
        n.food = clamp(n.food - foodLoss);
        n.water = clamp(n.water - waterLoss);
        const l = levels();
        const drain = (FOOD.drain[l.food] + WATER.drain[l.water]) * k * hours;   // starving and parched: the strength runs out
        if (drain > 0 && typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(-drain);
        warn();
    }
    const _advance = Game_System.prototype.advanceDayNight;
    Game_System.prototype.advanceDayNight = function(hours) {
        _advance.call(this, hours);
        decay(hours, 1);
    };
    const _sleepUntilHour = Game_System.prototype.sleepUntilHour;
    Game_System.prototype.sleepUntilHour = function(hour) {
        const t0 = this.dayNightDay() * 24 + this.dayNightHour();
        const result = _sleepUntilHour.call(this, hour);
        decay(this.dayNightDay() * 24 + this.dayNightHour() - t0, SLEEP_FACTOR);
        return result;
    };

    // ---- the effect on stamina: dearer work and a ceiling
    const _trySpendStamina = Game_System.prototype.trySpendStamina;
    Game_System.prototype.trySpendStamina = function(cost) {
        if (!enabled() || !(cost > 0)) return _trySpendStamina.call(this, cost);
        const ok = _trySpendStamina.call(this, cost * factor());
        if (ok) {
            const n = needs();
            n.food = clamp(n.food - cost * WORK_FOOD * (1 - Math.min(0.8, perk("hunger"))));   // effort makes you hungry and thirsty
            n.water = clamp(n.water - cost * WORK_WATER * (1 - Math.min(0.8, perk("thirst"))));
            warn();
        }
        return ok;
    };
    const _stamina = Game_System.prototype.stamina;
    Game_System.prototype.stamina = function() {
        const s = _stamina.call(this);
        return enabled() ? Math.min(s, Math.round(this.maxStamina() * capRatio())) : s;
    };

    // ---- eating and drinking
    function foodValues(item, food) {
        const t = FEED[item.id] || [Math.round((food.stamina || 0) * 0.8), 0];
        const k = 1 + perk("food.value");   // (Kuchnia: Kucharz)
        return [(food.fed !== undefined ? food.fed : t[0]) * k, (food.water !== undefined ? food.water : t[1]) * k];
    }
    function eat(item, food) {
        if (!enabled()) return "";
        const n = needs(), [fed, water] = foodValues(item, food || {});
        const parts = [];
        if (fed > 0) { const before = n.food; n.food = clamp(n.food + fed); if (n.food > before) parts.push("sytość +" + Math.round(n.food - before)); }
        if (water > 0) { const before = n.water; n.water = clamp(n.water + water); if (n.water > before) parts.push("nawodnienie +" + Math.round(n.water - before)); }
        n.meals = (n.meals || 0) + 1;
        n.lf = levels().food; n.lw = levels().water;
        return parts.join(", ");
    }
    // is this food worth eating now for the hunger or thirst alone?
    function usefulFood(item, food) {
        if (!enabled()) return false;
        const n = needs(), [fed, water] = foodValues(item, food || {});
        return (fed > 0 && n.food <= 95) || (water > 0 && n.water <= 95);
    }
    function drink(amount) {
        const n = needs(), before = n.water;
        n.water = clamp(n.water + amount);
        n.lw = levels().water;
        n.drinks = (n.drinks || 0) + 1;
        return Math.round(n.water - before);
    }
    const skinCharges = () => needs().skin || 0;
    const ownsSkin = () => !!$dataItems[SKIN.item] && $gameParty.hasItem($dataItems[SKIN.item]);
    function fillSkin() {
        if (!ownsSkin()) return false;
        needs().skin = SKIN.max;
        return true;
    }
    function feedback(icon, text) {
        if (window.Survival && Survival.feedback) Survival.feedback(icon, text); else popup(icon, text, "#9fd4ff");
    }
    function drinkFromSkin() {
        const icon = ($dataItems[SKIN.item] || {}).iconIndex || WATER_ICON;
        if (!ownsSkin()) { popup(icon, "Potrzebujesz bukłaka", "#ff9f8f"); return false; }
        if (skinCharges() <= 0) { popup(icon, "Bukłak jest pusty", "#ff9f8f"); return false; }
        if (needs().water >= 95) { popup(WATER_ICON, "Nie chce ci się pić", "#ff9f8f"); return false; }
        needs().skin = skinCharges() - 1;
        const got = drink(SKIN.sip);
        AudioManager.playSe({ name: "Liquid", volume: 90, pitch: 105, pan: 0 });
        feedback(icon, "Napiłeś się: nawodnienie +" + got + " (bukłak " + skinCharges() + "/" + SKIN.max + ")");
        return true;
    }

    // an item is used from the menu: food works also at full stamina when hunger / thirst ask for it; the flask drinks
    const isSkin = item => !!item && DataManager.isItem(item) && item.id === SKIN.item;
    const _canUse = Game_Party.prototype.canUse;
    Game_Party.prototype.canUse = function(item) {
        if (enabled() && isSkin(item)) return skinCharges() > 0 && needs().water < 95;
        const ok = _canUse.call(this, item);
        if (ok || !enabled() || !window.Survival || !item || !DataManager.isItem(item)) return ok;
        const food = Survival.foodInfo(item);
        return !!food && usefulFood(item, food) && !(item.meta && item.meta.Need);
    };

    // Same reasons drinkFromSkin() already pops up when used from the G-key shortcut, shown here too when
    // the flask is picked (and rejected) from the item menu - it was silent there before.
    const _Window_ItemList_playBuzzerSound = Window_ItemList.prototype.playBuzzerSound;
    Window_ItemList.prototype.playBuzzerSound = function() {
        _Window_ItemList_playBuzzerSound.call(this);
        const item = this.item();
        if (enabled() && isSkin(item)) {
            if (skinCharges() <= 0) feedback(item.iconIndex, "Bukłak jest pusty");
            else if (needs().water >= 95) feedback(item.iconIndex, "Nie chce ci się pić");
        }
    };
    const _useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        _useItem.call(this, item);
        if (enabled() && isSkin(item)) drinkFromSkin();
    };
    // the flask is not used up when drunk from
    const _consumeItem = Game_Party.prototype.consumeItem;
    Game_Party.prototype.consumeItem = function(item) {
        if (isSkin(item)) return;
        _consumeItem.call(this, item);
    };

    // ------------------------------------------------------------------
    // What the player sees: the flask in the item list, the two bars under the stamina gauge
    // ------------------------------------------------------------------
    const _drawItemNumber = Window_ItemList.prototype.drawItemNumber;
    Window_ItemList.prototype.drawItemNumber = function(item, x, y, width) {
        if (enabled() && isSkin(item)) {
            this.changeTextColor(ColorManager.textColor(skinCharges() === 0 ? 18 : 23));
            this.drawText(skinCharges() + "/" + SKIN.max, x, y, width, "right");
            this.resetTextColor();
            return;
        }
        _drawItemNumber.call(this, item, x, y, width);
    };
    const _Window_Help_setItem = Window_Help.prototype.setItem;
    Window_Help.prototype.setItem = function(item) {
        if (enabled() && isSkin(item)) {
            this.setText(item.description + "\nWoda: " + skinCharges() + " z " + SKIN.max + " łyków.");
            return;
        }
        _Window_Help_setItem.call(this, item);
    };

    function Sprite_NeedsBars() {
        this.initialize(...arguments);
    }
    Sprite_NeedsBars.prototype = Object.create(Sprite.prototype);
    Sprite_NeedsBars.prototype.constructor = Sprite_NeedsBars;
    // two rows under the stamina one, in its look (UITheme.js's UIStyle.hudRow): the drumstick and the drop, bars without numbers
    const HUD = () => (window.UIStyle && UIStyle.HUD) || { row: 20, step: 23, gap: 6, barW: 112, barH: 8 };
    Sprite_NeedsBars.HEIGHT = 2 * HUD().step;
    Sprite_NeedsBars.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(150, Sprite_NeedsBars.HEIGHT));
        this._iconSet = ImageManager.loadSystem("IconSet");
        this._key = "";
        this._pulse = 0;
    };
    Sprite_NeedsBars.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const hud = this.parent;
        if (hud && hud._gauge) {
            this.x = hud._gauge.x;
            this.y = hud.rowY ? hud.rowY(1) : hud._gauge.y + HUD().step;
            this.visible = hud._gauge.visible && enabled();
        }
        if (!enabled()) return;
        const n = needs(), l = levels();
        this._pulse = (this._pulse + 1) % 40;
        const blink = (l.food === 3 || l.water === 3) && this._pulse < 20;
        const key = Math.round(n.food) + "/" + Math.round(n.water) + (blink ? "b" : "");
        if (key === this._key || !(window.UIStyle || this._iconSet.isReady())) return;
        this._key = key;
        const bmp = this.bitmap, ctx = bmp.context;
        bmp.clear();
        [["food", FOOD_ICON, n.food, l.food, ["#e0b24a", "#c98a2c", "#d9622c", "#c2372b"]], ["water", WATER_ICON, n.water, l.water, ["#62b6ee", "#4a94d6", "#5a78c4", "#3e58b0"]]].forEach(([kind, icon, value, lv, colors], i) => {
            const H = HUD(), y = i * H.step, bx = H.row + H.gap, by = y + (H.row - H.barH) / 2;
            if (window.UIStyle) UIStyle.hudRow(ctx, kind, 0, y, value / 100, colors[lv]);
            else {   // (without UITheme.js: the old icons and a plain bar)
                bmp.blt(this._iconSet, (icon % 16) * 32, Math.floor(icon / 16) * 32, 32, 32, 0, y, H.row, H.row);
                ctx.fillStyle = "#16181c"; ctx.fillRect(bx, by, H.barW, H.barH); ctx.fillStyle = colors[lv]; ctx.fillRect(bx, by, Math.round(H.barW * value / 100), H.barH);
            }
            if (lv === 3 && blink) { ctx.fillStyle = "rgba(255,80,60,0.5)"; ctx.fillRect(bx, by, H.barW, H.barH); }   // the last level flashes red
        });
        bmp._baseTexture.update();
    };
    const _Scene_Map_createSurvivalHud = Scene_Map.prototype.createSurvivalHud;
    Scene_Map.prototype.createSurvivalHud = function() {
        _Scene_Map_createSurvivalHud.call(this);
        if (this._survivalHud) {
            this._needsBars = new Sprite_NeedsBars();
            this._survivalHud.addChild(this._needsBars);
        }
    };

    // G: a sip from the flask
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (!enabled() || !Input.isTriggered("drink")) return;
        if ($gamePlayer.canMove() && !$gameMessage.isBusy() && !$gameMap.isEventRunning() && !$gameTemp._farmMenuOpen && !$gameTemp._buildMode) drinkFromSkin();
    };

    window.Needs = {
        state: needs, levels, factor, capRatio, eat, usefulFood, foodValues, drink, drinkFromSkin, fillSkin, skinCharges, ownsSkin, decay, warn,
        enabled: () => enabled(), setEnabled: v => { ON = !!v; }, FOOD, WATER, FEED, SKIN, TAP_DRINK, HEIGHT: Sprite_NeedsBars.HEIGHT,
        foodText: () => FOOD.name[levels().food], waterText: () => WATER.name[levels().water]
    };
})();
