//=============================================================================
// Survival.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Przetrwanie: jedzenie z premiami, oprawianie zwierzyny, buty / plecak / płaszcz, deszcz i śnieg oraz zimno. v1.0.0
 * @author Claude
 *
 * @param weather
 * @text Pogoda (deszcz i śnieg)
 * @desc Losowe dni z deszczem lub śniegiem na mapach zewnętrznych. Deszcz sam podlewa pola.
 * @type boolean
 * @default true
 *
 * @param coldCostFactor
 * @text Zimno: mnożnik kosztu wytrzymałości
 * @desc Zimą i podczas śniegu, na zewnątrz, bez płaszcza, ogniska w pobliżu i rozgrzewającego posiłku.
 * @type number
 * @decimals 2
 * @min 1
 * @default 1.25
 *
 * @param satedCostFactor
 * @text Najedzony: mnożnik kosztu wytrzymałości
 * @type number
 * @decimals 2
 * @min 0.3
 * @max 1
 * @default 0.85
 *
 * @param bootsSpeed
 * @text Buty: mnożnik prędkości chodzenia
 * @type number
 * @decimals 2
 * @min 1
 * @default 1.1
 *
 * @param backpackBonus
 * @text Plecak: dodatkowe sztuki każdego przedmiotu
 * @type number
 * @min 0
 * @default 51
 *
 * @help
 * ============================================================================
 * Survival.js
 * ============================================================================
 * JEDZENIE
 *   Jedzenie to zwykłe przedmioty z notatką <Food:stamina=40,buff=sated,hours=3>.
 *   Klucze: stamina (ile wytrzymałości odnawia), buff i hours (premia i na ile
 *   godzin gry), buff2 i hours2 (druga premia). Zjadasz z menu (Przedmioty).
 *   Premie:
 *     sated (Najedzony)  - koszt wytrzymałości niższy o 15%
 *     warm  (Rozgrzany)  - zimno ci niestraszne
 *   Nie zjesz nic, gdy masz pełne siły i posiłek nie daje premii.
 *
 * OPRAWIANIE
 *   Przedmiot z notatką <Butcher> (upolowana zwierzyna) użyty z menu daje mięso
 *   i skórę. Notatka <Need:90,91> wymaga któregoś z tych przedmiotów w plecaku
 *   (tu: noża). Z żelaznym nożem (91) dostajesz o 1 mięso więcej.
 *
 * WYPOSAŻENIE (przedmioty działają samym posiadaniem)
 *   Skórzane buty (113): chodzisz szybciej.    Plecak (114): większy limit sztuk.
 *   Płaszcz (112): chroni przed zimnem.
 *
 * POGODA I ZIMNO
 *   Zależnie od pory roku część dni ma deszcz (wiosna, lato, jesień) albo śnieg
 *   (zima), w ustalonych godzinach. Dotyczy map zewnętrznych (z tagiem <Clouds:on>
 *   albo <Weather:on>; <Weather:off> wyłącza). Deszcz podlewa wszystkie zaorane
 *   pola, a przy okazji ryby lepiej biorą.
 *   Zimą i podczas śniegu, na zewnątrz, gracz marznie: koszty wytrzymałości rosną
 *   o 25%, dopóki nie założy płaszcza, nie stanie przy płonącym ognisku (w
 *   promieniu 4 kratek) albo nie zje czegoś rozgrzewającego (premia warm).
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "Survival";
    const params = PluginManager.parameters(pluginName);
    const num = (v, d) => (v !== undefined && v !== "" && isFinite(Number(v)) ? Number(v) : d);
    const WEATHER_ON = params.weather !== "false";
    const COLD_FACTOR = num(params.coldCostFactor, 1.25);
    const SATED_FACTOR = num(params.satedCostFactor, 0.85);
    const BOOTS_SPEED = num(params.bootsSpeed, 1.1);
    const BACKPACK_BONUS = num(params.backpackBonus, 51);

    const ITEM = { knifeStone: 90, knifeIron: 91, rawMeat: 94, rawHide: 96, cloak: 112, boots: 113, backpack: 114 };
    const BUFFS = {
        sated: { name: "Najedzony", icon: 351, desc: "prace kosztują " + Math.round((1 - SATED_FACTOR) * 100) + "% mniej sił" },   // the icon of the roast meat
        warm: { name: "Rozgrzany", icon: 366, desc: "zimą i w śniegu nie marzniesz" }                                                // the icon of the herbal brew
    };

    const hasItem = id => !!$dataItems[id] && $gameParty.hasItem($dataItems[id], false);
    const nowHours = () => $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour();

    function hash(day, salt) {
        let h = Math.imul(day | 0, 374761393) ^ Math.imul(salt | 0, 668265263);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }

    // ------------------------------------------------------------------
    // Buffs (kept in the saved game: name -> the game hour they end)
    // ------------------------------------------------------------------
    Game_System.prototype.buffs = function() {
        if (!this._buffs) this._buffs = {};
        return this._buffs;
    };
    Game_System.prototype.addBuff = function(name, hours) {
        if (!BUFFS[name] || !(hours > 0)) return;
        const end = nowHours() + hours, buffs = this.buffs();
        buffs[name] = Math.max(buffs[name] || 0, end);
    };
    Game_System.prototype.hasBuff = function(name) {
        return (this.buffs()[name] || 0) > nowHours();
    };
    Game_System.prototype.activeBuffs = function() {
        const now = nowHours(), out = [];
        for (const name of Object.keys(this.buffs())) {
            const left = this.buffs()[name] - now;
            if (left > 0 && BUFFS[name]) out.push({ name, left });
            else if (left <= 0) delete this.buffs()[name];
        }
        return out;
    };

    // ------------------------------------------------------------------
    // Food and butchering: items used from the menu
    // ------------------------------------------------------------------
    function foodInfo(item) {
        const raw = item && item.meta && item.meta.Food;
        if (typeof raw !== "string") return null;
        const info = {};
        for (const pair of raw.split(",")) {
            const [k, v] = pair.split("=").map(s => s.trim());
            info[k] = isNaN(Number(v)) ? v : Number(v);
        }
        return info;
    }
    const isButcher = item => !!(item && item.meta && item.meta.Butcher);
    const needs = item => (item && item.meta && typeof item.meta.Need === "string" ? item.meta.Need.split(",").map(Number) : []);
    const isSurvivalItem = item => !!item && DataManager.isItem(item) && (!!foodInfo(item) || isButcher(item));

    function survivalCanUse(item) {
        const need = needs(item);
        if (need.length > 0 && !need.some(id => hasItem(id))) return false;
        const food = foodInfo(item);
        if (food) {
            const full = $gameSystem.staminaRatio() >= 0.995;
            if (full && !food.buff) return false;
            if (full && food.buff && $gameSystem.hasBuff(food.buff) && (!food.buff2 || $gameSystem.hasBuff(food.buff2))) return false;
        }
        return true;
    }

    const _Game_Party_canUse = Game_Party.prototype.canUse;
    Game_Party.prototype.canUse = function(item) {
        return isSurvivalItem(item) ? survivalCanUse(item) : _Game_Party_canUse.call(this, item);
    };

    // In the item menu the message goes to the help window; the menu re-selects the item right after using it
    // and that puts the item's own description back, so Scene_Item puts the message back once more.
    let lastFeedback = "";
    function feedback(icon, text) {
        const scene = SceneManager._scene;
        if (scene && scene._helpWindow && scene.constructor.name !== "Scene_Map") {
            lastFeedback = text;
            scene._helpWindow.setText(text);
        } else {
            $gameTemp.pushLootPopup(icon, text, "#9ff0a8");
        }
    }
    const _Scene_Item_determineItem = Scene_Item.prototype.determineItem;
    Scene_Item.prototype.determineItem = function() {
        lastFeedback = "";
        _Scene_Item_determineItem.call(this);
        if (lastFeedback) this._helpWindow.setText(lastFeedback);
    };

    function eat(item, food) {
        const before = $gameSystem.stamina();
        if (food.stamina) $gameSystem.changeStamina(food.stamina);
        const parts = [];
        const gained = Math.round($gameSystem.stamina() - before);
        if (gained > 0) parts.push("+" + gained + " wytrzymałości");
        for (const [b, h] of [[food.buff, food.hours], [food.buff2, food.hours2]]) {
            if (b && BUFFS[b] && h > 0) {
                $gameSystem.addBuff(b, h);
                parts.push(BUFFS[b].name + " (" + h + " godz.)");
            }
        }
        if (window.Needs) { const extra = Needs.eat(item, food); if (extra) parts.push(extra); }   // hunger / thirst (Needs.js)
        feedback(item.iconIndex, "Zjadłeś: " + item.name + (parts.length ? ". " + parts.join(", ") + "." : "."));
    }

    function butcher(item) {
        const iron = hasItem(ITEM.knifeIron), meat = 2 + (iron ? 1 : 0);
        if (window.Durability) Durability.use(iron ? ITEM.knifeIron : ITEM.knifeStone);
        $gameParty.gainItem($dataItems[ITEM.rawMeat], meat);
        $gameParty.gainItem($dataItems[ITEM.rawHide], 1);
        feedback(item.iconIndex, "Oprawiono: mięso ×" + meat + ", skóra ×1.");
    }

    const _Game_Battler_useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        _Game_Battler_useItem.call(this, item);
        if (!isSurvivalItem(item)) return;
        const food = foodInfo(item);
        if (food) eat(item, food);
        if (isButcher(item)) butcher(item);
    };

    // ------------------------------------------------------------------
    // Cost of stamina: fed is cheaper, cold is dearer
    // ------------------------------------------------------------------
    function isOutdoors() {
        const note = ($dataMap && $dataMap.note) || "";
        if (/<Weather:\s*off\s*>/i.test(note)) return false;
        if (/<Weather:\s*on\s*>/i.test(note) || /<Clouds:\s*on\s*>/i.test(note)) return true;
        return false;
    }
    function nearFire() {
        const list = ($gameSystem._farm && $gameSystem._farm.buildings && $gameSystem._farm.buildings[$gameMap.mapId()]) || [];
        return list.some(b => (b.type === "campfire" || b.type === "tripod" || b.type === "cauldron") && !b.site && (window.Farming && Farming.geoOf ?
            Farming.cellsOfGeo(Farming.geoOf(b), b.x, b.y).some(c => Math.abs(c.x - $gamePlayer.x) <= 4 && Math.abs(c.y - $gamePlayer.y) <= 4) :
            Math.abs(b.x - $gamePlayer.x) <= 4 && Math.abs(b.y - $gamePlayer.y) <= 4));
    }
    function seasonIndex(day) {
        return window.Farming && Farming.seasonIndex ? Farming.seasonIndex(day) : Math.floor(((Math.max(1, day) - 1) / 28) % 4);
    }
    Game_System.prototype.isCold = function() {
        if (!isOutdoors()) return false;
        const winter = seasonIndex(this.dayNightDay()) === 3, snowing = $gameScreen.weatherType() === "snow" && $gameScreen._weatherPowerTarget > 0;   // not while it fades out
        if (!winter && !snowing) return false;
        return !(hasItem(ITEM.cloak) || this.hasBuff("warm") || nearFire());
    };
    function costFactor() {
        let f = 1;
        if ($gameSystem.hasBuff("sated")) f *= SATED_FACTOR;
        if ($gameSystem.isCold()) f *= COLD_FACTOR;
        return f;
    }
    const _trySpendStamina = Game_System.prototype.trySpendStamina;
    Game_System.prototype.trySpendStamina = function(cost) {
        return _trySpendStamina.call(this, cost > 0 ? cost * costFactor() : cost);
    };

    // boots and the backpack work by being owned
    const _distancePerFrame = Game_CharacterBase.prototype.distancePerFrame;
    Game_CharacterBase.prototype.distancePerFrame = function() {
        const d = _distancePerFrame.call(this);
        return this === $gamePlayer && hasItem(ITEM.boots) ? d * BOOTS_SPEED : d;
    };
    const _maxItems = Game_Party.prototype.maxItems;
    Game_Party.prototype.maxItems = function(item) {
        const max = _maxItems.call(this, item);
        return item && item.itypeId !== 2 && hasItem(ITEM.backpack) ? max + BACKPACK_BONUS : max;
    };

    // ------------------------------------------------------------------
    // Weather: a fixed plan for every day of the year (rain, snow in winter)
    // ------------------------------------------------------------------
    function weatherPlan(day) {
        const s = seasonIndex(day), chance = [0.35, 0.2, 0.4, 0.45][s];
        if (hash(day, 1) >= chance) return null;
        const start = 5 + Math.floor(hash(day, 2) * 9), len = 4 + Math.floor(hash(day, 3) * 6);
        return { type: s === 3 ? "snow" : "rain", start, end: Math.min(24, start + len), power: 3 + Math.floor(hash(day, 4) * 3) };
    }
    function currentWeather() {
        const day = $gameSystem.dayNightDay(), hour = $gameSystem.dayNightHour(), plan = weatherPlan(day);
        return plan && hour >= plan.start && hour < plan.end ? plan : null;
    }

    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        if (!WEATHER_ON || Graphics.frameCount % 30 !== 0 || !$gameSystem.dayNightDay) return;
        const plan = isOutdoors() ? currentWeather() : null;
        // MZ keeps the old weather type after a fade out (power 0), so compare the power target, not the type.
        // Weather set by an event is left alone: only weather this plugin started is ever ended by it.
        const target = $gameScreen._weatherPowerTarget || 0;
        if (plan && (target !== plan.power || $gameScreen.weatherType() !== plan.type)) {
            $gameScreen.changeWeather(plan.type, plan.power, 90);
            $gameSystem._weatherOwn = true;
            if (target === 0) $gameTemp.pushLootPopup(0, plan.type === "snow" ? "Zaczyna padać śnieg" : "Zaczyna padać deszcz", "#bcd8ff");
        } else if (!plan && $gameSystem._weatherOwn) {
            $gameScreen.changeWeather("none", 0, 90);
            $gameSystem._weatherOwn = false;
        }
        if (plan && plan.type === "rain" && $gameSystem._rainDay !== $gameSystem.dayNightDay()) {
            $gameSystem._rainDay = $gameSystem.dayNightDay();
            if (window.Farming && typeof Farming.rainWater === "function") Farming.rainWater();
        }
    };

    // ------------------------------------------------------------------
    // The HUD: the active premia under the stamina bar, and a warning when it is cold
    // ------------------------------------------------------------------
    function Sprite_BuffIcons() {
        this.initialize(...arguments);
    }
    Sprite_BuffIcons.prototype = Object.create(Sprite.prototype);
    Sprite_BuffIcons.prototype.constructor = Sprite_BuffIcons;

    Sprite_BuffIcons.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(200, 30));
        this._iconSet = ImageManager.loadSystem("IconSet");
        this._key = null;
        this._coldWas = false;
    };

    Sprite_BuffIcons.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const hud = this.parent;
        if (hud && hud._gauge) {
            this.x = hud._gauge.x;
            this.y = hud._gauge.y + 36 + (window.Needs && Needs.enabled() ? Needs.HEIGHT : 0);   // under the hunger and thirst bars
            this.visible = hud._gauge.visible;
        }
        const list = $gameSystem.activeBuffs(), cold = $gameSystem.isCold();
        const key = list.map(b => b.name + Math.ceil(b.left)).join(",") + (cold ? "|cold" : "");
        if (cold && !this._coldWas) {
            $gameTemp.pushLootPopup(0, "Zimno! Płaszcz, ognisko albo ciepły posiłek pomoże", "#bcd8ff");
        }
        this._coldWas = cold;
        if (key === this._key || !this._iconSet.isReady()) return;
        this._key = key;
        const bmp = this.bitmap;
        bmp.clear();
        let x = 0;
        for (const b of list) {
            const idx = BUFFS[b.name].icon;
            bmp.blt(this._iconSet, (idx % 16) * 32, Math.floor(idx / 16) * 32, 32, 32, x, 2, 26, 26);
            bmp.fontSize = 13;
            bmp.textColor = "#fff8e6";
            bmp.outlineColor = "rgba(20,10,4,0.95)";
            bmp.outlineWidth = 4;
            bmp.drawText(Math.ceil(b.left) + "h", x + 20, 12, 30, 20, "left");
            x += 56;
        }
        if (cold) {
            bmp.fontSize = 15;
            bmp.textColor = "#bfe0ff";
            bmp.outlineColor = "rgba(10,20,40,0.95)";
            bmp.outlineWidth = 4;
            bmp.drawText("Zimno!", x, 2, 80, 26, "left");
        }
    };

    const _Scene_Map_createSurvivalHud = Scene_Map.prototype.createSurvivalHud;
    Scene_Map.prototype.createSurvivalHud = function() {
        _Scene_Map_createSurvivalHud.call(this);
        if (this._survivalHud) {
            this._buffIcons = new Sprite_BuffIcons();
            this._survivalHud.addChild(this._buffIcons);
        }
    };

    window.Survival = { foodInfo, feedback, butcher, weatherPlan, currentWeather, costFactor, BUFFS };
})();
