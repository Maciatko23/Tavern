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
 * ZDROWIE I RANY
 *   Zdrowie to HP bohatera (czerwony pasek z serduszkiem nad wytrzymałością).
 *   Szarżujący dzik (Hunting.js) zabiera 35% zdrowia, część sił i rani: przez 24
 *   godziny gry wytrzymałość nie podniesie się powyżej 60% (na pasku widać
 *   "Ranny" z liczbą godzin), a zdrowie nie odrasta. Bez rany zdrowie wraca samo,
 *   3% na godzinę gry, a noc snu przywraca je całe. Przedmiot z notatką <Bandage>
 *   (opatrunek z krwawnika, "Wytwórz...") użyty z menu Przedmioty od razu leczy
 *   ranę i 20% zdrowia; bez rany nie da się go użyć. Zdrowie 0 = koniec gry.
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
 *   BURZA: część deszczowych dni to burze (wiosna 30%, lato 60%, jesień 20% dni
 *   z deszczem, zimą nigdy), po południu albo wieczorem, na 1,5-3 godziny. Godzinę
 *   wcześniej "Zbiera się na burzę" (wiatr, ciemne niebo, dalekie grzmoty), potem
 *   ulewa (pogoda MZ "storm"), a po burzy zwykły deszcz. Siłę burzy (0..1) liczy
 *   stormLevel; pokazuje ją i daje jej dźwięk wtyczka Storm.js. Menu F9: "Burza
 *   teraz" i "Koniec pogody na dziś".
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
    // Total carry weight: on top of (not instead of) the per-item stack caps above. Items are tagged
    // <Weight:N> in their note (untagged items, mostly small foraged things and seeds, weigh nothing
    // and are never weight-limited). The backpack raises this the same way it raises the stack caps.
    const WEIGHT_CAP_BASE = num(params.weightCapBase, 120);   // must clear the biggest single carry-and-place cost (the hut: 30+40+20+6 = 96) with room to spare
    const WEIGHT_CAP_BACKPACK = num(params.weightCapBackpack, 80);

    const ITEM = { knifeStone: 90, knifeIron: 91, rawMeat: 94, rawHide: 96, cloak: 112, boots: 113, backpack: 114 };
    // a wound (a boar's tusks, Hunting.js): the strength cannot rise above WOUND_CAP of the maximum until it heals (WOUND_HOURS of
    // game time) or is dressed with a bandage (<Bandage> item, made of yarrow)
    const WOUND_CAP = 0.6, WOUND_HOURS = 24;
    const BUFFS = {
        sated: { name: "Najedzony", icon: 351, desc: "prace kosztują " + Math.round((1 - SATED_FACTOR) * 100) + "% mniej sił" },   // the icon of the roast meat
        warm: { name: "Rozgrzany", icon: 366, desc: "zimą i w śniegu nie marzniesz" },                                               // the icon of the herbal brew
        wound: { name: "Ranny", icon: 414, bad: true, desc: "wytrzymałość najwyżej " + Math.round(WOUND_CAP * 100) + "%, dopóki rana się nie zagoi (opatrunek leczy od razu)" }
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
    // Wounds: a hit costs strength at once and leaves a wound that keeps the strength down until it heals or is dressed
    // ------------------------------------------------------------------
    Game_System.prototype.injure = function(loss, hours) {
        if (loss > 0) this.changeStamina(-loss);
        this.addBuff("wound", hours || WOUND_HOURS);
    };
    Game_System.prototype.isWounded = function() {
        return this.hasBuff("wound");
    };
    Game_System.prototype.healWound = function() {
        delete this.buffs().wound;
    };
    const _Game_System_stamina = Game_System.prototype.stamina;
    Game_System.prototype.stamina = function() {
        const s = _Game_System_stamina.call(this);
        return this._buffs && this.isWounded() ? Math.min(s, Math.round(this.maxStamina() * WOUND_CAP)) : s;
    };

    // ------------------------------------------------------------------
    // Health: the hero's own HP (the leader of the party). A boar's charge takes a part of it (Hunting.js: hurt); it comes back
    // slowly by itself - HEAL_PER_HOUR of the maximum an hour, not while wounded - and fully in a night's sleep (the beds call
    // recoverAll); a bandage heals BANDAGE_HEAL of it. At 0 the engine's own check ends the game (Scene_Map.checkGameover).
    // ------------------------------------------------------------------
    const HEAL_PER_HOUR = 0.03, BANDAGE_HEAL = 0.2;
    const hero = () => ($gameParty ? $gameParty.leader() : null);
    Game_System.prototype.healthRatio = function() {
        const a = hero();
        return a && a.mhp > 0 ? a.hp / a.mhp : 1;
    };
    // takes `fraction` of the maximum HP (at least 1); true when that was the end
    Game_System.prototype.hurt = function(fraction) {
        const a = hero();
        if (!a || a.isDead()) return false;
        a.gainHp(-Math.max(1, Math.round(a.mhp * fraction)));
        return a.hp <= 0;
    };
    Game_System.prototype.heal = function(fraction) {
        const a = hero();
        if (a && !a.isDead()) a.gainHp(Math.max(1, Math.round(a.mhp * fraction)));
    };
    // the slow healing, with the clock (whole HP only: the fractions wait in _healAcc)
    const _advanceDayNight = Game_System.prototype.advanceDayNight;
    Game_System.prototype.advanceDayNight = function(hours) {
        _advanceDayNight.call(this, hours);
        const a = hero();
        if (!a || a.isDead() || !(hours > 0) || a.hp >= a.mhp || this.isWounded()) { this._healAcc = 0; return; }
        this._healAcc = (this._healAcc || 0) + a.mhp * HEAL_PER_HOUR * hours;
        const whole = Math.floor(this._healAcc);
        if (whole > 0) { a.gainHp(whole); this._healAcc -= whole; }
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
    const isBandage = item => !!(item && item.meta && item.meta.Bandage);
    const needs = item => (item && item.meta && typeof item.meta.Need === "string" ? item.meta.Need.split(",").map(Number) : []);
    const isSurvivalItem = item => !!item && DataManager.isItem(item) && (!!foodInfo(item) || isButcher(item) || isBandage(item));

    function survivalCanUse(item) {
        if (isBandage(item)) return $gameSystem.isWounded();   // a bandage is for a wound
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

    // Why survivalCanUse just refused this item - shown only when the player actually tries to pick a
    // disabled item (see the playBuzzerSound hook below), never during list drawing.
    function whyCanNotUse(item) {
        if (isBandage(item)) return "Nie jesteś ranny";
        const need = needs(item);
        if (need.length > 0 && !need.some(id => hasItem(id))) {
            const req = $dataItems[need[0]];
            return "Potrzebujesz: " + (req ? req.name : "?");
        }
        if (foodInfo(item) && $gameSystem.staminaRatio() >= 0.995) return "Masz pełną wytrzymałość";
        return "";
    }

    // The engine already plays a buzzer when OK is pressed on a disabled item (once per press, not per
    // frame) - piggyback on that moment to say why, matching the "always a popup" rule for other gates.
    const _Window_ItemList_playBuzzerSound = Window_ItemList.prototype.playBuzzerSound;
    Window_ItemList.prototype.playBuzzerSound = function() {
        _Window_ItemList_playBuzzerSound.call(this);
        const item = this.item();
        if (item && isSurvivalItem(item) && !survivalCanUse(item)) {
            const why = whyCanNotUse(item);
            if (why) feedback(item.iconIndex, why);
        }
    };

    // In the item menu the message goes to the help window; the menu re-selects the item right after using it
    // and that puts the item's own description back, so Scene_Item puts the message back once more.
    let lastFeedback = "";
    function feedback(icon, text, color) {
        const scene = SceneManager._scene;
        if (scene && scene._helpWindow && scene.constructor.name !== "Scene_Map") {
            lastFeedback = text;
            scene._helpWindow.setText(text);
        } else {
            $gameTemp.pushLootPopup(icon, text, color || "#9ff0a8");
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

    const FEATHERS = 146;
    function butcher(item) {
        const iron = hasItem(ITEM.knifeIron), meat = 2 + (iron ? 1 : 0);
        if (window.Durability) Durability.use(iron ? ITEM.knifeIron : ITEM.knifeStone);
        if (item.meta.Butcher === "bird") {   // <Butcher:bird> (Birds.js): plucked and dressed - a little meat and the feathers
            $gameParty.gainItem($dataItems[ITEM.rawMeat], 1);
            $gameParty.gainItem($dataItems[FEATHERS], 3);
            feedback(item.iconIndex, "Oskubano: mięso ×1, pióra ×3.");
            return;
        }
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
        if (isBandage(item)) {
            $gameSystem.healWound();
            $gameSystem.changeStamina(10);
            $gameSystem.heal(BANDAGE_HEAL);
            feedback(item.iconIndex, "Opatrzono ranę: krew przestała płynąć, zdrowie i siły wracają.");
        }
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
        const stackMax = item && item.itypeId !== 2 && hasItem(ITEM.backpack) ? max + BACKPACK_BONUS : max;
        const w = itemWeight(item);
        if (!item || w <= 0) return stackMax;
        const budget = weightCap() - carriedWeight(item);
        if (budget <= 0) return Math.min(stackMax, this.numItems(item));
        return Math.min(stackMax, Math.floor(budget / w));
    };
    // <Weight:N> on the item's note (RPG Maker parses it into item.meta.Weight already); untagged = weightless
    function itemWeight(item) {
        const w = item && item.meta && item.meta.Weight;
        return w !== undefined ? Number(w) || 0 : 0;
    }
    function weightCap() {
        return WEIGHT_CAP_BASE + (hasItem(ITEM.backpack) ? WEIGHT_CAP_BACKPACK : 0);
    }
    // total weight carried, optionally excluding one item type (to work out how much room is left for it)
    function carriedWeight(exclude) {
        let total = 0;
        for (const it of $gameParty.items()) {
            if (exclude && it.id === exclude.id) continue;
            total += itemWeight(it) * $gameParty.numItems(it);
        }
        // the bucket's carried water is one shared level (see Farming.js), not per-copy weight, so it is added once
        if (window.Farming && Farming.bagWaterWeight) total += Farming.bagWaterWeight();
        return total;
    }

    // ------------------------------------------------------------------
    // Weather: a fixed plan for every day of the year (rain, snow in winter)
    // ------------------------------------------------------------------
    // Some rainy days are storm days (summer most often, never in winter): plan.storm = { start, end } in hours. A storm comes in the
    // afternoon or the evening (so it can also be seen at night), the rain starts with it and goes on as ordinary rain after it passes.
    // The storm itself is drawn and heard by Storm.js; this file only plans it and says how strong it is at any moment (stormLevel).
    const STORM_CHANCE = [0.3, 0.6, 0.2, 0];   // of the rainy days, per season
    const STORM_GATHER = 1;                    // hours of wind and darkening sky before the first drop
    const STORM_FADE = 1;                      // hours over which it dies away (the last quarter of them after its end)
    function weatherPlan(day) {
        const forced = $gameSystem && $gameSystem._stormForce;
        if (forced && forced.day === day) {   // the debug menu (F9): a storm right now, or no weather at all today
            return forced.off ? null : { type: "rain", start: forced.start, end: Math.min(24, forced.end + 1), power: 4, storm: { start: forced.start, end: forced.end } };
        }
        const s = seasonIndex(day), chance = [0.35, 0.2, 0.4, 0.45][s];
        if (hash(day, 1) >= chance) return null;
        if (hash(day, 6) < STORM_CHANCE[s]) {
            const start = 14 + Math.floor(hash(day, 7) * 8), len = 1.5 + Math.round(hash(day, 8) * 6) / 4;
            const end = Math.min(24, start + len);
            return { type: "rain", start, end: Math.min(24, end + 1 + Math.floor(hash(day, 3) * 3)), power: 3 + Math.floor(hash(day, 4) * 3), storm: { start, end } };
        }
        const start = 5 + Math.floor(hash(day, 2) * 9), len = 4 + Math.floor(hash(day, 3) * 6);
        return { type: s === 3 ? "snow" : "rain", start, end: Math.min(24, start + len), power: 3 + Math.floor(hash(day, 4) * 3) };
    }
    function currentWeather() {
        const day = $gameSystem.dayNightDay(), hour = $gameSystem.dayNightHour(), plan = weatherPlan(day);
        return plan && hour >= plan.start && hour < plan.end ? plan : null;
    }
    const smooth = t => { const k = Math.max(0, Math.min(1, t)); return k * k * (3 - 2 * k); };
    // 0..1: how strong the storm is at this hour of that day (0 = no storm). It gathers for STORM_GATHER hours before the rain (up to
    // 0.55: wind, a dark sky, far thunder), breaks with the rain, rages with small surges, then dies away.
    function stormLevel(day, hour) {
        const plan = weatherPlan(day), s = plan && plan.storm;
        if (!s) return 0;
        const a = s.start, z = s.end;
        if (hour < a - STORM_GATHER || hour >= z + STORM_FADE / 4) return 0;
        if (hour < a) return 0.55 * smooth((hour - (a - STORM_GATHER)) / STORM_GATHER);
        if (hour < a + 0.4) return 0.55 + 0.45 * smooth((hour - a) / 0.4);
        const surge = 0.9 + 0.1 * Math.sin(hour * 11);
        if (hour < z - STORM_FADE * 0.75) return surge;
        return surge * (1 - smooth((hour - (z - STORM_FADE * 0.75)) / STORM_FADE));
    }
    // "gather" (before the rain), "rage", "pass" (dying away) or null
    function stormPhase(day, hour) {
        const plan = weatherPlan(day), s = plan && plan.storm;
        if (!s || stormLevel(day, hour) <= 0) return null;
        return hour < s.start ? "gather" : hour < s.end - STORM_FADE * 0.75 ? "rage" : "pass";
    }
    // F9: a storm starting in a moment and lasting `hours`; calm = no weather at all for the rest of today
    function forceStorm(hours) {
        const day = $gameSystem.dayNightDay(), start = Math.min(23, $gameSystem.dayNightHour() + 0.35);   // already gathering (no waiting a whole hour)
        $gameSystem._stormForce = { day, start, end: Math.min(24, start + (hours || 2)) };
    }
    function calmWeather() {
        $gameSystem._stormForce = { day: $gameSystem.dayNightDay(), off: true };
    }
    const stormNow = () => stormLevel($gameSystem.dayNightDay(), $gameSystem.dayNightHour());

    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        if (!WEATHER_ON || Graphics.frameCount % 30 !== 0 || !$gameSystem.dayNightDay) return;
        const plan = isOutdoors() ? currentWeather() : null;
        const day = $gameSystem.dayNightDay(), hour = $gameSystem.dayNightHour(), storm = stormLevel(day, hour);
        // the sky warns you: wind and far thunder an hour before the storm breaks (outdoors, once per storm)
        if (isOutdoors() && storm > 0 && stormPhase(day, hour) === "gather" && $gameSystem._stormWarned !== day) {
            $gameSystem._stormWarned = day;
            $gameTemp.pushLootPopup(0, "Zbiera się na burzę", "#bcd8ff");
        }
        // while the storm rages the rain is MZ's "storm" (heavier, slanted, see Storm.js), as hard as the storm is strong
        const raging = !!plan && !!plan.storm && hour >= plan.storm.start && storm > 0.35;
        const type = plan ? (raging ? "storm" : plan.type) : "none", power = plan ? (raging ? Math.round(4 + 5 * storm) : plan.power) : 0;
        // MZ keeps the old weather type after a fade out (power 0), so compare the power target, not the type.
        // Weather set by an event is left alone: only weather this plugin started is ever ended by it.
        const target = $gameScreen._weatherPowerTarget || 0;
        if (plan && (target !== power || $gameScreen.weatherType() !== type)) {
            $gameScreen.changeWeather(type, power, 90);
            $gameSystem._weatherOwn = true;
            if (target === 0) $gameTemp.pushLootPopup(0, plan.type === "snow" ? "Zaczyna padać śnieg" : raging ? "Burza!" : "Zaczyna padać deszcz", "#bcd8ff");
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
        Sprite.prototype.initialize.call(this, new Bitmap(230, HUD().row));
        this._iconSet = ImageManager.loadSystem("IconSet");
        this._key = null;
        this._coldWas = false;
    };

    // The rows under the stamina one (SurvivalHUD.js): sizes from UITheme.js's UIStyle.HUD, symbols on its small plates
    const HUD = () => (window.UIStyle && UIStyle.HUD) || { row: 20, step: 23, gap: 6, barW: 112, barH: 8 };
    function hudRowY(hud, i) {
        return hud.rowY ? hud.rowY(i) : hud._gauge.y + i * HUD().step;
    }
    function hudSymbol(bmp, sheet, kind, idx, x, fill) {   // (without UITheme.js: the IconSet icon instead)
        const s = HUD().row;
        if (window.UIStyle) UIStyle.chip(bmp.context, kind, x, 0, s, fill);
        else if (idx) bmp.blt(sheet, (idx % 16) * 32, Math.floor(idx / 16) * 32, 32, 32, x, 0, s, s);
    }
    function hudText(bmp, text, x, w, colour) {
        bmp.fontSize = 15;
        bmp.textColor = colour;
        bmp.outlineColor = "rgba(0,0,0,0.9)";
        bmp.outlineWidth = 3;
        bmp.drawText(text, x, 0, w, HUD().row, "left");
    }

    // one row: the load as a number next to the kettlebell, "carried / what you can carry" - no bar; amber when heavy, red when full
    function Sprite_WeightBar() {
        this.initialize(...arguments);
    }
    Sprite_WeightBar.prototype = Object.create(Sprite.prototype);
    Sprite_WeightBar.prototype.constructor = Sprite_WeightBar;
    Sprite_WeightBar.HEIGHT = HUD().step;
    const WEIGHT_ICON = 370;   // the backpack's own icon
    Sprite_WeightBar.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(150, HUD().row));
        this._iconSet = ImageManager.loadSystem("IconSet");
        this._key = "";
    };
    Sprite_WeightBar.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const hud = this.parent;
        if (hud && hud._gauge) {
            this.x = hud._gauge.x;
            this.y = hudRowY(hud, 1 + (window.Needs && Needs.enabled() ? 2 : 0));   // under the hunger and thirst rows
            this.visible = hud._gauge.visible;
        }
        if (!window.UIStyle && !this._iconSet.isReady()) return;
        const carried = Math.round(carriedWeight()), cap = weightCap();
        const key = carried + "/" + cap;
        if (key === this._key) return;
        this._key = key;
        const bmp = this.bitmap;
        bmp.clear();
        hudSymbol(bmp, this._iconSet, "weight", WEIGHT_ICON, 0);
        const full = carried / Math.max(1, cap);
        hudText(bmp, carried + " / " + cap, HUD().row + 6, 120, full >= 0.95 ? "#ff5a4f" : full >= 0.75 ? "#ffb347" : "#eceef0");
        bmp._baseTexture.update();
    };
    const _Scene_Map_createSurvivalHud2 = Scene_Map.prototype.createSurvivalHud;
    Scene_Map.prototype.createSurvivalHud = function() {
        _Scene_Map_createSurvivalHud2.call(this);
        if (this._survivalHud) {
            this._weightBar = new Sprite_WeightBar();
            this._survivalHud.addChild(this._weightBar);
        }
    };

    Sprite_BuffIcons.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const hud = this.parent;
        if (hud && hud._gauge) {
            this.x = hud._gauge.x;
            this.y = hudRowY(hud, 2 + (window.Needs && Needs.enabled() ? 2 : 0));   // under the hunger/thirst rows and the load
            this.visible = hud._gauge.visible;
        }
        const list = $gameSystem.activeBuffs(), cold = $gameSystem.isCold();
        const key = list.map(b => b.name + Math.ceil(b.left)).join(",") + (cold ? "|cold" : "");
        if (cold && !this._coldWas) {
            $gameTemp.pushLootPopup(0, "Zimno! Płaszcz, ognisko albo ciepły posiłek pomoże", "#bcd8ff");
        }
        this._coldWas = cold;
        if (key === this._key || (!window.UIStyle && !this._iconSet.isReady())) return;
        this._key = key;
        // one row of symbols in the style of the ones above: each premium with the hours it has left, then the cold
        const bmp = this.bitmap;
        bmp.clear();
        let x = 0;
        for (const b of list) {
            const bad = !!BUFFS[b.name].bad;   // a wound: red
            hudSymbol(bmp, this._iconSet, b.name, BUFFS[b.name].icon, x, bad ? "#ff6a52" : undefined);
            hudText(bmp, Math.ceil(b.left) + " h", x + HUD().row + 5, 40, bad ? "#ff9f8f" : "#eceef0");
            x += 64;
        }
        if (cold) {
            hudSymbol(bmp, this._iconSet, "cold", 0, x, "#bfe0ff");
            hudText(bmp, "Zimno!", x + (window.UIStyle ? HUD().row + 5 : 0), 70, "#bfe0ff");
        }
        bmp._baseTexture.update();
    };

    const _Scene_Map_createSurvivalHud = Scene_Map.prototype.createSurvivalHud;
    Scene_Map.prototype.createSurvivalHud = function() {
        _Scene_Map_createSurvivalHud.call(this);
        if (this._survivalHud) {
            this._buffIcons = new Sprite_BuffIcons();
            this._survivalHud.addChild(this._buffIcons);
        }
    };

    window.Survival = { foodInfo, feedback, butcher, weatherPlan, currentWeather, stormLevel, stormPhase, stormNow, forceStorm, calmWeather, isOutdoors, costFactor, BUFFS, itemWeight, weightCap, carriedWeight: () => carriedWeight(),
        WOUND_CAP, WOUND_HOURS, HEAL_PER_HOUR, BANDAGE_HEAL };
})();
