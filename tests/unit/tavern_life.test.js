// TavernLife.js (and TavernLife_Darts.js) without the game: Borgar's prices - the dish of the day (-30%) and the tavern's reputation
// (QuestBoard.js's tiers: Swój chłop -5%, Pewna ręka -10%, Chluba tawerny -15%) on every dish, the rooms and the bath, the editor's
// own discounts; the darts' scoring over the whole board (bull, ring, the 20 wedges and their edges, the rim); the <Tavern:...>
// attributes read the old way (a value keeps its commas: plate=0,-2) on the core's tags.
const unit = require("../lib/unit.js");

// a fake QuestBoard (its tiers as QuestBoard.js has them) and a clock, both changed by the test
function world(params) {
    const w = { rep: 0, day: 1 };
    const QuestBoard = { reputation: () => w.rep, TIERS: [{ rep: 0, name: "Nowy w okolicy" }, { rep: 20, name: "Znajoma twarz" }, { rep: 40, name: "Swój chłop" },
        { rep: 60, name: "Pewna ręka" }, { rep: 80, name: "Chluba tawerny" }] };
    const $gameSystem = { dayNightDay: () => w.day, dayNightHour: () => 12 };
    w.win = unit.load(["TawernaCore", "TawernaUI", "TavernLife", "TavernLife_Darts"], { globals: { QuestBoard, $gameSystem }, params });
    w.TL = w.win.TavernLife;
    return w;
}
// the old way, written out: the day's dish 30% off, then the reputation's; never below 1 G
function expected(price, dayDish, disc, dayK) {
    const k = (dayDish ? 1 - (dayK === undefined ? 0.3 : dayK) : 1) * (1 - disc);
    return k < 1 ? Math.max(1, Math.round(price * k)) : price;
}

unit.test(t => {
    const w = world();
    const TL = w.TL, lib = TL.lib;
    t.eq("the 7 dishes and drinks at their parameter prices", TL.DISHES.map(d => d.id + ":" + d.price),
        ["gulasz:16", "kapusniak:12", "pieczen:18", "placek:9", "chleb:5", "piwo:4", "miod:8"]);

    // ---- the dish of the day: a main dish (never a drink), the same all day, each main one on some day
    const mains = TL.DISHES.filter(d => !d.drink).map(d => d.id), seen = new Set();
    let drinks = 0;
    for (let d = 1; d <= 200; d++) { const dd = TL.dishOfDay(d); seen.add(dd.id); if (dd.drink) drinks++; }
    t.check("the dish of the day is always a main dish, and each of the five comes up in 200 days", drinks === 0 && mains.every(id => seen.has(id)), [...seen]);
    const dayOf = id => { for (let d = 1; d <= 200; d++) if (TL.dishOfDay(d).id === id) return d; return -1; };

    // ---- the reputation's tiers and discounts
    const tiers = [[0, 0, 0], [19, 0, 0], [20, 1, 0], [39, 1, 0], [40, 2, 0.05], [59, 2, 0.05], [60, 3, 0.1], [79, 3, 0.1], [80, 4, 0.15], [100, 4, 0.15]];
    const gotTiers = tiers.map(([rep]) => { w.rep = rep; return [rep, TL.repTier(), TL.repDiscount()]; });
    t.eq("the tiers by reputation (0/20/40/60/80) and Borgar's discounts (none, none, 5%, 10%, 15%)", gotTiers, tiers);

    // ---- every dish at every tier, the day's dish and not
    const bad = [];
    for (const [rep, , disc] of tiers) {
        w.rep = rep;
        for (const dish of TL.DISHES) {
            const dd = dish.drink ? -1 : dayOf(dish.id), other = dayOf(mains.find(id => id !== dish.id));
            if (!dish.drink && TL.priceOf(dish, dd) !== expected(dish.price, true, disc)) bad.push({ rep, dish: dish.id, day: true, got: TL.priceOf(dish, dd), want: expected(dish.price, true, disc) });
            if (TL.priceOf(dish, other) !== expected(dish.price, false, disc)) bad.push({ rep, dish: dish.id, day: false, got: TL.priceOf(dish, other), want: expected(dish.price, false, disc) });
        }
    }
    t.check("every dish at every tier, the day's dish and not: the price as before (" + tiers.length * 12 + " cases)", bad.length === 0, bad.slice(0, 4));
    w.rep = 80;
    t.eq("some prices by hand: gulasz 16 -> 10 (the day's dish at 15%), chleb 5 -> 3, piwo 4 -> 3, pieczeń 18 -> 15",
        [TL.priceOf(TL.DISHES[0], dayOf("gulasz")), TL.priceOf(TL.DISHES[4], dayOf("chleb")), TL.priceOf(TL.DISHES[5], 1), TL.priceOf(TL.DISHES[2], dayOf("gulasz"))], [10, 3, 3, 15]);

    // ---- the rooms and the bath: the reputation's discount on the base price
    const cases = [[0, 30, 30], [45, 30, 29], [65, 30, 27], [85, 50, 43], [85, 8, 7], [0, 6, 6], [45, 6, 6], [65, 6, 5], [85, 6, 5], [85, 1, 1]];
    const got = cases.map(([rep, base]) => { w.rep = rep; return [rep, base, lib.repPrice(base)]; });
    t.eq("rooms and the bath (repPrice): the chamber 30 -> 27 at 65, the Apartament 50 -> 43 at 85, the bath 6 -> 5 from 60, never below 1", got, cases);
    w.rep = 85;
    t.eq("the bath at 85: 5 G (TavernLife.bathPrice)", TL.bathPrice(), 5);

    // ---- without QuestBoard.js: reputation 0, no discount
    const saved = w.win.QuestBoard;
    w.win.QuestBoard = undefined;
    t.eq("without QuestBoard.js: reputation 0, tier 0, full prices", [TL.reputation(), TL.repTier(), TL.priceOf(TL.DISHES[0], dayOf("kapusniak")), TL.bathPrice()], [0, 0, 16, 6]);
    w.win.QuestBoard = saved;

    // ---- the editor's own numbers (TavernLife's parameters): the dish of the day 50%, the discounts 10/20/30
    const w2 = world({ TavernLife: { dayDiscount: "50", repDiscounts: "10,20,30", priceGulasz: "20" } });
    w2.rep = 80;
    const firstDay = test => { for (let d = 1; d <= 200; d++) if (test(w2.TL.dishOfDay(d).id)) return d; return -1; };
    const g2 = w2.TL.DISHES[0];
    t.eq("parameters: gulasz 20 G, the day's dish -50%, Chluba tawerny -30% -> 7 G; not the day's dish -> 14 G",
        [g2.price, w2.TL.priceOf(g2, firstDay(id => id === "gulasz")), w2.TL.priceOf(g2, firstDay(id => id !== "gulasz"))], [20, 7, 14]);

    // ---- darts: the scoring (TavernLife_Darts.js)
    const S = TL.dartScore, DB = TL.DB, ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    const at = (deg, r) => { const a = deg * Math.PI / 180; return S(Math.sin(a) * r, -Math.cos(a) * r); };
    t.eq("the bull: 50 in its circle (radius 12), 25 in the green ring (to 28), then the wedge (bottom: 3)", [S(0, 0), S(12, 0), S(0, -12), S(12.01, 0), S(19, 19), S(0, 28), S(0, 28.01)], [50, 50, 50, 25, 25, 25, 3]);
    t.eq("the 20 wedges clockwise from the top at radius 100: 20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5",
        ORDER.map((_, i) => at(i * 18, 100)), ORDER);
    const edges = [];
    for (let i = 0; i < 20; i++) edges.push([at(i * 18 + 8.9, 120), at(i * 18 + 9.1, 120)]);
    t.eq("each wedge's edge (±9° off its middle): the next wedge begins just past it", edges, ORDER.map((v, i) => [v, ORDER[(i + 1) % 20]]));
    t.eq("the board ends at radius " + DB.rs + ": on its rim a wedge, past it 0 (the wooden frame, the wall)", [at(0, DB.rs), at(0, DB.rs + 0.01), at(90, DB.frame), at(200, 400)], [20, 0, 0, 0]);
    t.eq("the named cases the game test uses: bull 50, ring 25, top 20, bottom 3, right 6, off the board 0",
        [S(0, 0), S(20, 0), S(0, -100), S(0, 100), S(100, 0), S(0, -200)], [50, 25, 20, 3, 6, 0]);
    t.check("the wedges' numbers add up to 210 (1-20 once each)", ORDER.reduce((a, b) => a + b, 0) === 210 && new Set(ORDER.map((_, i) => at(i * 18, 150))).size === 20);

    // ---- the tags: found by the core (Tawerna.tag), their attributes read the old way
    const page = text => ({ list: [{ code: 108, indent: 0, parameters: [text] }, { code: 0, indent: 0, parameters: [] }] });
    const tags = [
        ["<Tavern:mealtable dir=8 plate=0,-2>", { kind: "mealtable", a: { dir: "8", plate: "0,-2" } }],
        ['<Tavern:bed room=komnata price=30 minrep=60 name="Komnata z kominkiem">', { kind: "bed", a: { room: "komnata", price: "30", minrep: "60", name: "Komnata z kominkiem" } }],
        ["<Tavern:door room=1>", { kind: "door", a: { room: "1" } }],
        ["<Tavern:dice:grum>", { kind: "dice", a: {} }],
        ["<Tavern:plan>", { kind: "plan", a: {} }],
        ["<tavern:Bath lift=34>", { kind: "bath", a: { lift: "34" } }],
        ["no tag here", null]
    ];
    t.eq("<Tavern:...> on a page: the kind and the attributes as strings, a value keeps its commas (plate=0,-2), quotes keep spaces",
        tags.map(([text]) => lib.pageTag(page(text))), tags.map(x => x[1]));
    const ev = { note: "", pages: [page("<Tavern:candle room=3>"), page("<Tavern:candle room=3>")] };
    t.eq("an event's data: the tag of its pages (and the same object again from the cache)", [lib.dataTag(ev), lib.dataTag(ev) === lib.dataTag(ev)], [{ kind: "candle", a: { room: "3" } }, true]);
});
