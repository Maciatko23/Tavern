// Farming's data without the game (Farming_Data.js + Farming.js, data/Items.json): the seasons by the day, the crops, the buildings'
// costs and recipes and the hand recipes naming real items, and the one food table (FoodTable): its rows real items, the notes in
// the database agreeing with it, raw food not eaten as it is, the fed / water values, the dog's columns, the meats that tame a dog.
// Stage 3 (batch E1): Farming on the core and split in five - loaded with the core and its parts in the list's order; the family's bag,
// window.Farming's names, and a clear error when a part stands above Farming.js or Farming.js has no core.
const unit = require("../lib/unit.js");
const FAMILY = ["TawernaCore", "Farming_Data", "Farming", "Farming_Plots", "Farming_Build", "Farming_Stations", "Farming_UI"];

unit.test(t => {
    const $dataItems = unit.data("Items");
    const DataManager = { isItem: o => !!o && $dataItems.includes(o), onLoad() {} };
    const w = unit.load(FAMILY, { globals: { $dataItems, DataManager } });
    const F = w.Farming, FT = w.FoodTable;
    const real = id => !!($dataItems[id] && $dataItems[id].name);

    // ---- the seasons: four of 28 days from day 1 (0 spring .. 3 winter), round again in year 2
    t.eq("seasonIndex: days 1, 28, 29, 56, 57, 84, 85, 112, 113, 0 (as day 1)", [1, 28, 29, 56, 57, 84, 85, 112, 113, 0].map(d => F.seasonIndex(d)), [0, 0, 1, 1, 2, 2, 3, 3, 0, 0]);
    t.eq("seasonOf: the names", [1, 29, 57, 85].map(d => F.seasonOf(d)), ["Wiosna", "Lato", "Jesień", "Zima"]);

    // ---- the crops
    const crops = Object.entries(F.CROPS).filter(([k, c]) => !(real(c.seed) && real(c.produce) && c.days > 0 && c.yield[0] >= 1 && c.yield[1] >= c.yield[0] && c.seasons.length && c.seasons.every(s => s >= 0 && s <= 3)));
    t.check("every crop (" + Object.keys(F.CROPS).length + "): a real seed and produce, its days, a sane yield, seasons 0-3", crops.length === 0, crops.map(c => c[0]));

    // ---- the buildings and the recipes name real items
    const bad = [];
    const items = (list, where) => { for (const [id, n] of list || []) if (!real(id) || !(n > 0)) bad.push(where + ": " + id + " x" + n); };
    for (const [key, b] of Object.entries(F.BUILDINGS)) {
        items(b.cost, key + " cost");
        if (!(b.w >= 1) || (b.h !== undefined && !(b.h >= 1))) bad.push(key + ": size " + b.w + "x" + b.h);
        for (const r of b.recipes || []) { items(r.inputs, key + "/" + r.id + " in"); if (r.output) items([r.output], key + "/" + r.id + " out"); }
        if (b.produce && !real(b.produce.item)) bad.push(key + ": produce " + b.produce.item);
    }
    for (const r of F.HAND_RECIPES) { items(r.inputs, "hand/" + r.id + " in"); if (r.output) items([r.output], "hand/" + r.id + " out"); }
    t.check("every building (" + Object.keys(F.BUILDINGS).length + ") and hand recipe (" + F.HAND_RECIPES.length + "): real items in the costs, inputs and outputs, a size", bad.length === 0, bad.slice(0, 8));
    const inOne = Object.entries(F.BUILDINGS).map(([k, b]) => [k, (b.recipes || []).map(r => r.id)]).filter(([k, l]) => new Set(l).size !== l.length);
    t.check("recipe ids are unique within each building (the same dish may be cooked at two stations)", inOne.length === 0, inOne.map(x => x[0]));

    // ---- the food table
    const rows = Object.keys(FT.ROWS).map(Number);
    t.check("every food row (" + rows.length + ") is a real item", rows.every(real), rows.filter(id => !real(id)));
    const diffs = FT.check();
    t.check("the database's <Food:> notes agree with the table (FoodTable.check)", diffs.length === 0, diffs.slice(0, 6));
    const raw = rows.filter(id => FT.ROWS[id].raw);
    t.check("raw food (" + raw.length + ": raw meat, fish, the old carcass) is not eaten as it is", raw.length >= 5 && raw.every(id => !FT.edible(id) && FT.eatInfo(id) === null), raw);
    const eat = rows.filter(id => FT.edible(id));
    t.check("what is eaten gives strength and food: stamina > 0, fed >= 0, water >= 0", eat.every(id => { const e = FT.eatInfo(id); return e.stamina > 0 && e.fed >= 0 && e.water >= 0; }), eat.filter(id => !(FT.eatInfo(id).stamina > 0)));
    t.eq("fedWater: soup 109 [55, 20], wild apples 139 [8, 18], bread 83 [30, 0]", [FT.fedWater(109), FT.fedWater(139), FT.fedWater(83)], [[55, 20], [8, 18], [30, 0]]);
    t.eq("fedWater of a food with no row (a note only): 80% of its stamina, no water", FT.fedWater(9999, { stamina: 50 }), [40, 0]);
    t.check("the old tables come from it: Spoilage's LIFE (spoil) and Needs' FEED (fed, water)", rows.every(id => (FT.ROWS[id].spoil || undefined) === FT.LIFE[id]) && eat.every(id => JSON.stringify(FT.FEED[id]) === JSON.stringify([FT.ROWS[id].fed, FT.ROWS[id].water])));
    t.eq("a non-food and a weapon of the same id are no food", [FT.get(61), FT.has(null)], [null, false]);

    // ---- the dog's columns
    t.eq("the meats that tame the dog, in their order (raw hare first, smoked fish last)", FT.tameMeats(), rows.filter(id => FT.ROWS[id].tame).sort((a, b) => FT.ROWS[a].tame - FT.ROWS[b].tame));
    t.check("...every tame meat is meat or fish: raw, roasted or smoked", FT.tameMeats()[0] === 94 && FT.tameMeats().every(id => FT.ROWS[id].dog >= 40), FT.tameMeats());
    const forage = FT.dogForage(F.GATHER);
    t.check("the dog eats what it finds by kind (Farming.GATHER): the berry bush gives more than its berries alone", Object.keys(forage).length >= 3 && forage.bush === FT.ROWS[102].dogPickBush, forage);
    t.eq("a food without a dog value gives the default (" + FT.DOG_DEFAULT + ")", FT.dogValue(130), FT.DOG_DEFAULT);

    // ---- the family (batch E1): the bag, window.Farming with the old names (the parts' functions plain, writable members), the errors
    t.eq("Farming's bag: core, plots, build, stations, ui", Object.keys(w.Tawerna.api("Farming_parts")), ["core", "plots", "build", "stations", "ui"]);
    const names = ["addMenuHook", "farm", "plotAt", "gatherAt", "GATHER", "harvest", "whyNotBuild", "placeSite", "sleepInTent", "startJob", "craftManual", "putInChest", "menuFor", "openBuildKeyMenu"];
    const plain = names.filter(n => { const d = Object.getOwnPropertyDescriptor(F, n); return d && "value" in d && (typeof d.value !== "function" || d.writable); });
    t.check("window.Farming (= Tawerna.api(\"Farming\")) answers for every file's names, the functions writable; Scene_Chest from Farming_Stations",
        w.Tawerna.api("Farming") === F && plain.length === names.length && typeof F.Scene_Chest === "function", names.filter(n => !plain.includes(n)));
    let err = "";
    try { unit.load(["TawernaCore", "Farming_Plots"]); } catch (e) { err = String(e.message); }
    t.check("a part above Farming.js: a clear error", /Farming_Plots\.js: musi być pod Farming\.js/.test(err), err);
    err = "";
    try { unit.load(["Farming_Data", "Farming"], { globals: { $dataItems, DataManager } }); } catch (e) { err = String(e.message); }
    t.check("Farming.js without the core: a clear error", /Farming\.js: brak TawernaCore\.js/.test(err), err);
});
