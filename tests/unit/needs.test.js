// Needs.js (hunger and thirst) without the game: the browser test tests/needs_test.js's rules, on the game's own clock and stamina
// (DayNightCycle.js, SurvivalHUD.js), seasons (Farming.js), food table (FoodTable, Farming_Data.js) and premia (Survival.js) - loaded
// in the plugin list's order with the list's parameters. A new game at 90 / 90; the meters by the hour (awake 1.6 / 2.5, asleep
// half, the work's share, summer's thirst and winter's hunger 25% faster, the rain outdoors giving water); the dearer work by the
// levels (x1.15 / 1.35 / 1.6 hungry, x1.2 / 1.5 / 2 thirsty, multiplied together and with Survival's sated premium); the stamina's
// ceiling (85 / 55, 70 / 40) that a rest cannot pass; starving and parched draining the strength; the warnings once per level;
// eating from the menu (the roast, the soup, the milk) also at full strength when hungry; the waterskin (none, empty, a sip of 35,
// not wasted when not thirsty, from the menu, not used up, 4 or 8 sips); faint below 10 (slower, the bubble), the bubbles below 20
// every 2 hours; the skills' perks; switched off.
"use strict";
const unit = require("../lib/unit.js");
const W = require("../lib/wtyczki.js");

const PAGE = W.merge(W.lista(), W.edytor());
const ORDER = PAGE.map(p => p.name), PARAMS = Object.fromEntries(PAGE.map(p => [p.name, p.parameters || {}]));
const FILES = ["TawernaCore", "DayNightCycle", "SurvivalHUD", "Farming_Data", "Farming", "Farming_Plots", "Farming_Build", "Farming_Stations", "Farming_UI", "Survival", "Needs"]
    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
const near = (a, b, tol) => Math.abs(a - b) <= tol;

unit.test(t => {
    const $dataItems = unit.data("Items");
    // the engine as far as these plugins need it (the clock and the stamina are the plugins' own)
    function Game_System() { this.initialize(); }
    Game_System.prototype.initialize = function() {};
    function Game_Party() { this._items = {}; }
    Game_Party.prototype.numItems = function(item) { return item ? this._items[item.id] || 0 : 0; };
    Game_Party.prototype.hasItem = function(item) { return this.numItems(item) > 0; };
    Game_Party.prototype.gainItem = function(item, n) { if (item) this._items[item.id] = Math.max(0, this.numItems(item) + n); };
    Game_Party.prototype.items = function() { return Object.keys(this._items).filter(id => this._items[id] > 0).map(id => $dataItems[id]); };
    Game_Party.prototype.canUse = function() { return false; };
    Game_Party.prototype.consumeItem = function(item) { this.gainItem(item, -1); };
    Game_Party.prototype.maxItems = function() { return 99; };
    Game_Party.prototype.leader = function() { return null; };
    function Game_Battler() {}
    Game_Battler.prototype.useItem = function() {};
    function Game_CharacterBase() {}
    Game_CharacterBase.prototype.distancePerFrame = function() { return 0.125; };
    class Scene_Map {}
    const popups = [], barks = [];
    const env = {
        $gameSystem: null, $gameParty: null, $dataMap: { note: "<Clouds:on>" },
        $gameScreen: { type: "none", power: 0, get _weatherPowerTarget() { return this.power; }, weatherType() { return this.type; }, weatherPower() { return this.power; } },
        $gameMap: { mapId: () => 3, isEventRunning: () => false }, $gameMessage: { isBusy: () => false },
        $gameTemp: { pushLootPopup: (icon, text, color) => popups.push(text) }, $gamePlayer: new Game_CharacterBase()
    };
    const globals = { $dataItems, Game_System, Game_Party, Game_Battler, Game_CharacterBase, Scene_Map, SceneManager: { _scene: new Scene_Map() },
        DataManager: { isItem: o => !!o && $dataItems.includes(o), onLoad() {} }, SpeechBubbles: { say: (ev, text) => barks.push(text) } };
    for (const k of Object.keys(env)) Object.defineProperty(globals, k, { get: () => env[k], enumerable: true, configurable: true });
    const w = unit.load(FILES, { globals, params: PARAMS });
    const N = w.Needs, S = w.Survival;
    const newGame = () => { env.$gameSystem = new Game_System(); env.$gameParty = new Game_Party(); return env.$gameSystem; };
    let sys = newGame();
    const set = (f, wv) => { const n = N.state(); n.food = f; n.water = wv; const l = N.levels(); n.lf = l.food; n.lw = l.water; sys._buffs = {}; sys.setStamina(100); };
    const food = () => N.state().food, water = () => N.state().water;
    const spend = c => { const before = sys.stamina(); sys.trySpendStamina(c); return before - sys.stamina(); };   // (the stamina really taken by one action of cost c)
    const day = d => { sys._dayNightDay = d; sys.setDayNightHour(10); };
    const use = item => new Game_Battler().useItem(item);

    // ---------------------------------------------------------------- the meters
    t.check("a new game: food and water at 90 / 90, Needs on, the 129 flask item is Bukłak (not consumed, <Drink:35>)",
        food() === 90 && water() === 90 && N.enabled() && $dataItems[129].name === "Bukłak" && $dataItems[129].consumable === false && /<Drink:35>/.test($dataItems[129].note),
        { food: food(), water: water() });
    day(3);
    set(100, 100);
    sys.advanceDayNight(10);
    const awake = [food(), water()];
    set(100, 100);
    sys.setDayNightHour(22);
    sys.sleepUntilHour(7);
    const asleep = [food(), water(), sys.dayNightDay()];
    set(100, 100);
    sys.trySpendStamina(10);
    const work = [food(), water()];
    t.check("10 hours awake in spring: food 100 -> 84, water 100 -> 75; 9 hours of sleep cost half (-7.2, -11.25); 10 stamina of work: -0.4 food, -0.7 water on top",
        near(awake[0], 84, 1e-9) && near(awake[1], 75, 1e-9) && near(asleep[0], 92.8, 1e-9) && near(asleep[1], 88.75, 1e-9) && asleep[2] === 4 && near(work[0], 99.6, 1e-9) && near(work[1], 99.3, 1e-9),
        { awake, asleep, work });
    day(40);
    set(100, 100);
    sys.advanceDayNight(4);
    const summer = [food(), water()];
    day(90);
    set(100, 100);
    sys.advanceDayNight(4);
    const winter = [food(), water()];
    t.check("summer (day 40): thirst 25% faster (4 h: -12.5, food -6.4); winter (day 90): hunger 25% faster (4 h: -8, water -10)",
        near(summer[1], 87.5, 1e-9) && near(summer[0], 93.6, 1e-9) && near(winter[0], 92, 1e-9) && near(winter[1], 90, 1e-9), { summer, winter });
    day(3);
    set(50, 50);
    Object.assign(env.$gameScreen, { type: "rain", power: 5 });
    sys.advanceDayNight(4);
    const rain = [food(), water()];
    env.$dataMap = { note: "<Weather:off>" };
    set(50, 50);
    sys.advanceDayNight(4);
    const roof = water();
    env.$dataMap = { note: "<Clouds:on>" };
    Object.assign(env.$gameScreen, { type: "none", power: 0 });
    t.check("in the rain outdoors the water rises instead (4 h: +6), the food still goes down; under a roof (<Weather:off>) the rain gives nothing",
        near(rain[1], 56, 1e-9) && near(rain[0], 43.6, 1e-9) && near(roof, 40, 1e-9), { rain, roof });

    // ---------------------------------------------------------------- what work costs
    const costs = [[100, 100], [40, 100], [20, 100], [0, 100], [100, 40], [100, 20], [100, 0], [40, 40]].map(([f, wv]) => { set(f, wv); return +spend(10).toFixed(4); });
    t.eq("an action of 10: full 10; Głodny x1.15, Bardzo głodny x1.35, Głodujesz x1.6; Spragniony x1.2, Odwodniony x1.5, Wysuszony x2; hungry AND thirsty multiply (13.8)",
        costs, [10, 11.5, 13.5, 16, 12, 15, 20, 13.8]);
    set(40, 40);
    sys.addBuff("sated", 3);
    const sated = +spend(10).toFixed(4);
    day(90);
    set(40, 100);
    const cold = +spend(10).toFixed(4);
    day(3);
    t.check("the costs multiply with Survival's premia: hungry and thirsty but sated (Najedzony x0.85): 11.73; hungry in the winter cold outdoors (x1.25): 14.375",
        near(sated, 11.73, 1e-6) && near(cold, 14.375, 1e-6), { sated, cold });

    // ---------------------------------------------------------------- the ceiling and the drain
    const ceil = [[100, 100], [100, 20], [100, 0], [0, 100], [20, 100], [40, 40]].map(([f, wv]) => { set(f, wv); return sys.stamina(); });
    set(100, 20);
    sys.setStamina(100);
    sys.changeStamina(15);
    const rested = [sys.stamina(), Math.round(sys.staminaRatio() * 100)];
    t.check("the stamina's ceiling: full 100, Odwodniony 70, Wysuszony 40, Głodujesz 55, Bardzo głodny 85, only hungry and thirsty: none; a rest cannot lift it above (70, the ratio too)",
        ceil.join(",") === "100,70,40,55,85,100" && rested.join(",") === "70,70", { ceil, rested });
    set(0, 0);
    sys.setStamina(30);
    const drain0 = sys.stamina();
    sys.advanceDayNight(2);
    const drained = drain0 - sys.stamina();
    set(0, 0);
    sys.setStamina(30);
    sys.setDayNightHour(22);
    sys.sleepUntilHour(7);
    const sleptDrain = 30 - sys.stamina();
    t.check("starving and parched: the strength drains by the hour (2 h awake: -6), asleep half of it (9 h: -13.5)", near(drained, 6, 1e-9) && near(sleptDrain, 13.5, 1e-9), { drained, sleptDrain });

    // ---------------------------------------------------------------- the warnings
    const warnAt = (setup, hours) => { set(100, 100); popups.length = 0; setup(N.state()); sys.advanceDayNight(hours); return popups.slice(); };
    const w50 = warnAt(n => { n.water = 52; }, 2), w25 = warnAt(n => { n.water = 27; }, 2), w0 = warnAt(n => { n.water = 1; }, 2), f25 = warnAt(n => { n.food = 27; }, 2);
    popups.length = 0;
    sys.advanceDayNight(0.1);
    t.check("the warnings: crossing 50 'Chce ci się pić', crossing 25 'Odwodnienie! Napij się wody', at 0 'Umierasz z pragnienia!', hunger below 25 'Bardzo głodny'; the same warning not again every tick",
        w50.includes("Chce ci się pić") && w25.some(p => /Odwodnienie/.test(p)) && w0.some(p => /Umierasz z pragnienia/.test(p)) && f25.some(p => /Bardzo głodny/.test(p)) && popups.length === 0,
        { w50, w25, w0, f25, again: popups });

    // ---------------------------------------------------------------- eating
    set(30, 100);
    sys.addBuff("sated", 3);
    const canHungry = env.$gameParty.canUse($dataItems[95]);
    set(100, 100);
    sys.addBuff("sated", 3);
    const canFull = env.$gameParty.canUse($dataItems[95]), usefulFull = N.usefulFood($dataItems[95], {});
    set(30, 100);
    use($dataItems[95]);
    const roast = food();
    set(70, 60);
    use($dataItems[109]);
    const soup = [food(), water()];
    set(50, 50);
    use($dataItems[123]);
    const milk = [food(), water()];
    t.check("eating: hungry at full strength and already sated - the roast can still be eaten (Survival alone would refuse), full in every way - not; roast meat 30 -> 75; soup +55 / +20 (to 100); milk +8 food, +30 water",
        canHungry === true && canFull === false && roast === 75 && soup.join() === "100,80" && milk.join() === "58,80" && usefulFull === false,
        { canHungry, canFull, usefulFull, roast, soup, milk });

    // ---------------------------------------------------------------- the waterskin
    const party = env.$gameParty, skin = $dataItems[129];
    set(100, 40);
    popups.length = 0;
    const noSkin = N.drinkFromSkin();
    party.gainItem(skin, 1);
    const empty = N.drinkFromSkin();
    const filled = N.fillSkin(), full4 = N.skinCharges();
    const sip = N.drinkFromSkin(), afterSip = [water(), N.skinCharges()];
    set(100, 100);
    const notThirsty = N.drinkFromSkin();
    t.check("the flask: none - 'Potrzebujesz bukłaka'; empty - 'Bukłak jest pusty'; filled at the water 4/4; a sip of 35 (water 40 -> 75, 3/4 left); not thirsty - 'Nie chce ci się pić', no sip wasted",
        noSkin === false && empty === false && filled === true && full4 === 4 && sip === true && afterSip.join() === "75,3" && notThirsty === false && N.skinCharges() === 3 &&
        ["Potrzebujesz bukłaka", "Bukłak jest pusty", "Nie chce ci się pić"].every(s => popups.includes(s)) && popups.some(p => /Napiłeś się: nawodnienie \+35 \(bukłak 3\/4\)/.test(p)), popups);
    set(100, 30);
    const canThirsty = party.canUse(skin);
    use(skin);
    const fromMenu = [water(), N.skinCharges()];
    party.consumeItem(skin);
    set(100, 100);
    const canQuenched = party.canUse(skin);
    N.enlargeSkin();
    N.fillSkin();
    t.check("from the item menu: usable while thirsty (not when quenched), drunk (water 30 -> 65, 2 left), never used up; enlarged at the tannery: 8 sips",
        canThirsty === true && canQuenched === false && fromMenu.join() === "65,2" && party.numItems(skin) === 1 && N.skinBig() && N.skinCharges() === 8 && N.SKIN.max === 8,
        { canThirsty, canQuenched, fromMenu });
    set(100, 50);
    const drank = N.drink(N.TAP_DRINK), drank2 = N.drink(N.TAP_DRINK);
    t.check("a drink at the pond or the well: +40 (50 -> 90), then only what fits (+10), counted", drank === 40 && drank2 === 10 && water() === 100 && N.state().drinks >= 2, { drank, drank2 });

    // ---------------------------------------------------------------- the signals
    const n = N.state();
    set(80, 50);
    const d0 = env.$gamePlayer.distancePerFrame();
    n.water = 5;
    const d1 = env.$gamePlayer.distancePerFrame();
    n.nagAt = null; barks.length = 0;
    N.nag();
    const faint = barks.slice();
    n.water = 15; n.nagAt = null; barks.length = 0;
    N.nag();
    N.nag();
    const once = barks.length;
    sys.advanceDayNight(2.2);
    n.water = 15;
    N.nag();
    t.check("below 10 the hero walks slower (x0.85) and says his head is spinning; thirsty below 20: 'Muszę się czegoś napić...' once, again after 2 hours",
        near(d1 / d0, 0.85, 1e-9) && /Kręci mi się w głowie\.\.\. muszę się napić!/.test(faint[0] || "") && once === 1 && barks.length === 2 && /Muszę się czegoś napić/.test(barks[0]),
        { ratio: d1 / d0, faint, barks });
    set(24, 100);
    const need1 = N.inNeed();
    set(25, 25);
    t.check("the last strength: below 25 food or water the hero is in need (gathering food costs nothing - Farming asks Needs.inNeed)", need1 === true && N.inNeed() === false);

    // ---------------------------------------------------------------- the skills, switched off
    w.Combat = { perk: k => ({ "needs.penalty": 1, hunger: 0.5, thirst: 0.9 })[k] || 0 };
    set(0, 0);
    const iron = [N.factor(), N.capRatio()];
    day(3);
    set(100, 100);
    sys.advanceDayNight(10);
    const small = [food(), water()];
    w.Combat = undefined;
    N.setEnabled(false);
    set(0, 0);
    const off = [spend(10), sys.stamina()];
    N.setEnabled(true);
    t.check("the skills: Żelazny organizm (needs.penalty 1) - no dearer work and no ceiling; hunger 0.5 halves the food lost (10 h: -8), thirst caps at 0.8 (10 h: -5); switched off: no factor, no ceiling",
        iron.join() === "1,1" && near(small[0], 92, 1e-9) && near(small[1], 95, 1e-9) && off.join() === "10,90", { iron, small, off });
});
