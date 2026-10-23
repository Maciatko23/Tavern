// Spoilage.js (food going bad) without the game, on the game's own clock (DayNightCycle.js), food table (FoodTable, Farming_Data.js)
// and buildings (Farming.js's pantry: keeps 0.2) - loaded in the plugin list's order with its parameters. Mirrors the browser test
// tests/pantry_fresh_test.js (the pantry keeps raw meat 300 h - "13 dni" - against 60 h - "3 dni" - in a chest or the bag, a day
// later about a day less) and the rules of the plugin's help: every food's life is the table's spoil column; the bag in batches
// (gained together = one age, oldest first, lost from the oldest); the warning at 80% of the life, once; at its life a batch turns
// into Zepsute jedzenie (122) and only that batch; the time left in Polish words; a chest keeps the ages of what goes in and out;
// food going bad in a chest; a stack changed behind gainItem made to match; the speed parameter, off; the skills' perks.
"use strict";
const unit = require("../lib/unit.js");
const W = require("../lib/wtyczki.js");

const PAGE = W.merge(W.lista(), W.edytor());
const ORDER = PAGE.map(p => p.name), PARAMS = Object.fromEntries(PAGE.map(p => [p.name, p.parameters || {}]));
const FILES = ["TawernaCore", "DayNightCycle", "Farming_Data", "Farming", "Farming_Plots", "Farming_Build", "Farming_Stations", "Farming_UI", "Spoilage"]
    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
const ITEMS = unit.data("Items");

// one game in its own window (the plugins wrap the engine's classes: fresh ones each time)
function world(spoilage) {
    const $dataItems = ITEMS;
    function Game_System() { this.initialize(); }
    Game_System.prototype.initialize = function() {};
    function Game_Party() { this._items = {}; }
    Game_Party.prototype.numItems = function(item) { return item ? this._items[item.id] || 0 : 0; };
    Game_Party.prototype.gainItem = function(item, n) { if (item) this._items[item.id] = Math.max(0, Math.min(99, this.numItems(item) + n)); };
    class Scene_Map { update() {} }
    const popups = [], env = { $gameSystem: null, $gameParty: null };
    const globals = { $dataItems, Game_System, Game_Party, Scene_Map, SceneManager: { _scene: new Scene_Map() }, AudioManager: { playSe() {} },
        DataManager: { isItem: o => !!o && $dataItems.includes(o), onLoad() {} }, $gameTemp: { pushLootPopup: (icon, text) => popups.push(text) } };
    for (const k of Object.keys(env)) Object.defineProperty(globals, k, { get: () => env[k], enumerable: true, configurable: true });
    const w = unit.load(FILES, { globals, params: Object.assign({}, PARAMS, { Spoilage: Object.assign({}, PARAMS.Spoilage, spoilage || {}) }) });
    const sys = env.$gameSystem = new Game_System(), party = env.$gameParty = new Game_Party();
    sys._dayNightDay = 3; sys.setDayNightHour(8);
    const S = w.Spoilage;
    return { w, S, sys, party, popups, hours: h => { sys.advanceDayNight(h); S.tick(); }, batches: id => (S.state().bag[id] || []).map(b => [+b.age.toFixed(3), b.n]) };
}

unit.test(t => {
    const g = world();
    const { S, sys, party, popups } = g, FT = g.w.FoodTable;
    const MEAT = ITEMS[94], BREAD = ITEMS[83], ROT = ITEMS[122];

    // ---------------------------------------------------------------- the table
    const life = id => S.LIFE[id];
    t.check("every food's life is the food table's spoil column (game hours): raw hare meat 60, fish 40, roast 120, bread 120, soup 72, milk 48, cheese 720, smoked meat 480, scrambled eggs 30",
        S.LIFE === FT.LIFE && [[94, 60], [98, 40], [95, 120], [83, 120], [109, 72], [123, 48], [124, 720], [105, 480], [107, 30]].every(([id, h]) => life(id) === h) &&
        Object.keys(S.LIFE).every(id => FT.spoilHours(Number(id)) === S.LIFE[id]), S.LIFE);
    t.check("honey, beer, mead, wild apples and pears keep (not perishable); every perishable row is a real item; item 122 is Zepsute jedzenie (ROT)",
        [76, 81, 137, 139, 140].every(id => !S.isPerishable(ITEMS[id])) && S.isPerishable(MEAT) && Object.keys(S.LIFE).every(id => ITEMS[id] && ITEMS[id].name) &&
        S.ROT === 122 && ROT.name === "Zepsute jedzenie", ROT && ROT.name);

    // ---------------------------------------------------------------- the bag in batches
    party.gainItem(MEAT, 3);
    g.hours(10);
    party.gainItem(MEAT, 2);
    const two = g.batches(94);
    party.gainItem(MEAT, -4);
    const left = g.batches(94);
    t.check("the bag in batches: what is gained at once is one batch of age 0, the oldest first; what is lost (eaten, sold) comes off the oldest",
        JSON.stringify(two) === "[[10,3],[0,2]]" && JSON.stringify(left) === "[[0,1]]" && party.numItems(MEAT) === 1, { two, left });
    party.gainItem(MEAT, -1);
    sys.advanceDayNight(0.2);
    party.gainItem(BREAD, 1);
    S.tick();
    const quarter = g.batches(83);
    sys.setDayNightHour(1);
    S.tick();
    const back = [g.batches(83), S.state().last === sys.dayNightDay() * 24 + 1];
    t.check("a quarter of an hour or less ages nothing; the clock going back (a load) only moves the mark", JSON.stringify(quarter) === "[[0,1]]" && JSON.stringify(back) === "[[[0,1]],true]",
        { quarter, back });
    party.gainItem(BREAD, -1);

    // ---------------------------------------------------------------- the warning, going bad
    party.gainItem(MEAT, 2);
    g.hours(30);
    party.gainItem(MEAT, 1);
    popups.length = 0;
    g.hours(18);
    const warned = popups.slice();
    g.hours(1);
    const notAgain = popups.length;
    g.hours(11);
    t.check("at 80% of its life (48 of 60 h) a batch warns once ('Surowe mięso zająca: zaraz się zepsuje'); at its life it turns into Zepsute jedzenie (x2) - only that batch, the younger one stays",
        warned.length === 1 && warned[0] === MEAT.name + ": zaraz się zepsuje" && notAgain === 1 && party.numItems(MEAT) === 1 && party.numItems(ROT) === 2 &&
        JSON.stringify(g.batches(94)) === "[[30,1]]" && popups[1] === "Zepsuło się: " + MEAT.name + " ×2", { warned, popups, batches: g.batches(94) });

    // ---------------------------------------------------------------- the time left
    const leftAt = age => { S.state().bag[94][0].age = age; return S.freshnessText(94); };
    const texts = [0, 12, 30, 38, 39, 47, 55, 58, 59, 59.9].map(leftAt);
    t.eq("the time left of the oldest piece in Polish: 3 dni, 2 dni, około doby, 22 godziny, 21 godzin, 13 godzin, 5 godzin, 2 godziny, 1 godzinę (also under an hour)",
        texts.map(s => s.replace("Najstarsza sztuka zepsuje się za ", "").replace(/\.$/, "")), ["3 dni", "2 dni", "około doby", "22 godziny", "21 godzin", "13 godzin", "5 godzin", "2 godziny", "1 godzinę", "1 godzinę"]);
    t.check("... nothing to say for a food that keeps or one not in the bag (hoursLeft null)", S.hoursLeft(76) === null && S.hoursLeft(83) === null && S.freshnessText(83) === "" && S.hoursLeft(94) !== null);
    party.gainItem(MEAT, -1);
    party.gainItem(ROT, -2);

    // ---------------------------------------------------------------- chests and the pantry
    party.gainItem(MEAT, 4);
    g.hours(20);
    const P = { type: "pantry", x: 1, y: 1, store: {} }, C = { type: "chest_s", x: 5, y: 1, store: {} };
    const put = (b, n) => { party.gainItem(MEAT, -n); b.store.i94 = (b.store.i94 || 0) + n; S.chestPut(b, MEAT, n); };
    put(P, 2);
    put(C, 2);
    const kept = [P.fresh[94].map(c => c.age), C.fresh[94].map(c => c.age)];
    S.chestPreload(C, MEAT, 1);
    C.store.i94 -= 1;
    party.gainItem(MEAT, 1);
    const out = g.batches(94);
    t.check("a chest keeps the ages: food put in keeps the age it had in the bag (20 h), taken out it brings it back", kept[0][0] === 20 && kept[1][0] === 20 && JSON.stringify(out) === "[[20,1]]" &&
        C.fresh[94][0].n === 1, { kept, out });
    party.gainItem(MEAT, -1);
    P.fresh[94][0].age = 0; C.fresh[94][0].age = 0;
    const fP = S.chestFreshness(P, 94), fC = S.chestFreshness(C, 94);
    sys._farm = { buildings: { 3: [P, C], 4: [{ type: "chest_s", store: { i999: 1 }, fresh: { 999: [{ age: 1, n: 1 }] } }] } };
    g.hours(24);
    const day = S.chestFreshness(P, 94);
    t.check("in the pantry (Farming's keeps 0.2) raw meat keeps 5x longer: 300 h - '13 dni' - against 60 h - '3 dni' - in a plain chest; a day later the pantry's meat has 276 h left (a day ages it 4.8 h there)",
        Math.round(fP.hours) === 300 && fP.text === "13 dni" && fP.ratio === 1 && Math.round(fC.hours) === 60 && fC.text === "3 dni" && near(day.hours, 276) && near(P.fresh[94][0].age, 4.8) &&
        near(C.fresh[94][0].age, 24) && !sys._farm.buildings[4][0].fresh[999], { fP, fC, day });
    g.hours(36);
    t.check("food going bad in a chest turns into Zepsute jedzenie in its store (the pantry's still good); a food the table does not know leaves the chest's list",
        !C.store.i94 && C.store.i122 === 1 && C.fresh[94].length === 0 && P.store.i94 === 2 && !P.store.i122 && S.chestFreshness(C, 94) === null, { C, P });

    // ---------------------------------------------------------------- a stack changed behind gainItem
    party._items[83] = 5;
    g.hours(1);
    const up = g.batches(83);
    party._items[83] = 2;
    g.hours(1);
    const down = g.batches(83);
    t.check("a stack changed behind gainItem (an old save, a script): the batches match the bag again at the next tick (5 new, then 2 left of them)",
        up.reduce((s, b) => s + b[1], 0) === 5 && down.reduce((s, b) => s + b[1], 0) === 2, { up, down });

    // ---------------------------------------------------------------- the speed, off, the skills
    const fast = world({ speed: "200" });
    fast.party.gainItem(BREAD, 1);
    fast.hours(59);
    const before = fast.party.numItems(BREAD), hoursLeft = fast.S.hoursLeft(83);
    fast.hours(1);
    const off = world({ enabled: "false" });
    off.party.gainItem(MEAT, 3);
    off.hours(100);
    t.check("the speed parameter 200%: bread (120 h) goes bad after 60 h of the game, 1 h before it says 1 h left; off: no batches, nothing goes bad",
        before === 1 && near(hoursLeft, 1) && fast.party.numItems(BREAD) === 0 && fast.party.numItems(ROT) === 1 && !off.S.enabled() && off.party.numItems(MEAT) === 3 &&
        off.S.hoursLeft(94) === null, { before, hoursLeft });
    const sk = world();
    sk.w.Combat = { perk: k => ({ spoil: 0.5, "spoil.store": 0.5 })[k] || 0 };
    sk.party.gainItem(MEAT, 1);
    const Q = { type: "chest_s", store: { i94: 1 }, fresh: { 94: [{ age: 0, n: 1 }] } };
    sk.sys._farm = { buildings: { 3: [Q] } };
    sk.hours(10);
    const qf = sk.S.chestFreshness(Q, 94);
    t.check("the skills: Spiżarnik (spoil 0.5) halves the ageing in the bag (10 h -> 5 h); with Solarz (spoil.store 0.5) a chest ages a quarter (2.5 h) and says so",
        JSON.stringify(sk.batches(94)) === "[[5,1]]" && near(Q.fresh[94][0].age, 2.5) && near(qf.hours, (60 - 2.5) / 0.25), { bag: sk.batches(94), chest: Q.fresh[94], qf });
});

function near(a, b) { return Math.abs(a - b) < 1e-6; }
