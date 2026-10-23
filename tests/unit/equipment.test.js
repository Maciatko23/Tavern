// Ekwipunek without the game (Equipment.js with Combat.js / Combat_Fight.js for the right hand, the shield and the armour, Bron.js for the
// gear's words; the notes of data/Items.json): the parts in the card's order, an old save's things going on by themselves, the empty parts, only what is worn
// working in the fight (the jacket, the shield), taken off stays off, a thing leaving the bag leaving its part and a new one going on,
// a second thing for a taken part waiting in the bag, the right hand being Combat's weapon, the refusals, the choices of a part, the
// card's rows, the state kept through a save.
// Mirrors tests/equipment_test.js (the old save's things on, the empty parts, the jacket and the shield only worn, taken off stays off,
// the right hand = Combat.hand, the jacket torn and a new one, the state after loading).
const unit = require("../lib/unit.js");

const FILES = ["TawernaCore", "Skills_Data", "Combat", "Combat_Fight", "Combat_UI", "Equipment", "Ubior_Data", "Bron_Data", "Bron"];

unit.test(t => {
    const $dataItems = unit.data("Items");
    function Game_System() {}
    let sys = new Game_System();
    const bag = {};
    const $gameParty = { numItems: it => bag[it.id] || 0, hasItem: it => (bag[it.id] || 0) > 0, leader: () => null };
    const globals = { Game_System, $gameParty, $dataItems };
    Object.defineProperty(globals, "$gameSystem", { get: () => sys, enumerable: true, configurable: true });
    const w = unit.load(FILES, { globals });
    const E = w.Equipment, C = w.Combat;
    const parts = () => Object.fromEntries(E.SLOTS.map(s => [s.id, E.current(s.id)]));

    // ---- the parts
    t.check("11 parts in the card's order; the old things' places: jacket torso, cloak, boots feet, backpack back, wooden shield left hand",
        E.SLOTS.map(s => s.id).join() === "head,cloak,torso,back,right,left,hands,belt,legs,feet,extra" &&
        E.WEARABLE[171] === "torso" && E.WEARABLE[112] === "cloak" && E.WEARABLE[113] === "feet" && E.WEARABLE[114] === "back" && E.WEARABLE[155] === "left" && E.SHIELD === 155 && E.TORCH === 59);

    // ---- an old save: what is owned goes on by itself
    for (const id of [171, 155, 112, 113, 114]) bag[id] = 1;
    const s0 = parts();
    t.check("an old save's things go on by themselves (jacket, shield, cloak, boots, backpack); the parts with nothing owned are empty; the fists in the right hand",
        s0.torso === 171 && s0.left === 155 && s0.cloak === 112 && s0.feet === 113 && s0.back === 114 && !s0.head && !s0.hands && !s0.belt && !s0.legs && !s0.extra && s0.right === 0, s0);
    t.check("... and only that works in the fight: the jacket is the armour, the wooden shield the shield", C.armor().id === 171 && C.shield().id === 155);

    // ---- taking off, putting on
    const off = [E.unequip("torso"), E.worn(171), C.armor()];
    E.ensure();
    t.check("the jacket taken off: not worn, no armour - and it stays off (the bag still has it)", off[0] === true && off[1] === false && off[2] === null && !E.worn(171) && bag[171] === 1, off);
    t.check("put on again it works; the shield off and on the same", E.equip("torso", 171) && E.worn(171) && C.armor().id === 171 && E.unequip("left") && C.shield() === null &&
        E.equip("left", 155) && C.shield().id === 155);
    bag[171] = 0;
    const torn = [E.worn(171), E.current("torso"), C.armor()];
    bag[171] = 1;
    t.check("the jacket leaves the bag (torn): its part empty; a new one comes: on by itself", torn[0] === false && torn[1] === 0 && torn[2] === null && E.worn(171) && C.armor().id === 171, torn);
    bag[353] = 1;
    const second = [E.current("torso"), E.worn(353)];
    t.check("a second thing for a taken part (the mail while the jacket is on) waits in the bag; put on by hand it takes the part",
        second[0] === 171 && second[1] === false && E.equip("torso", 353) && E.current("torso") === 353 && !E.worn(171) && C.armor().id === 353, second);
    t.eq("refused: a thing not owned, a thing of another part, an unknown part; nothing to take off", [E.equip("torso", 359), E.equip("head", 171), E.equip("wings", 171), E.unequip("head")],
        [false, false, false, false]);

    // ---- the right hand is Combat's weapon
    bag[156] = 1;
    bag[154] = 1;
    const right = [E.equip("right", 156), C.hand(), E.current("right"), E.worn(156)];
    const fists = [E.unequip("right"), C.hand(), E.current("right")];
    t.eq("the right hand: the club put there is Combat's hand (m156), worn; taken off - the fists (m0)", right.concat(fists), [true, "m156", 156, true, true, "m0", 0]);
    const choices = E.choices("right").map(c => c.hand + ":" + c.worn), torso = E.choices("torso").map(c => c.id + ":" + c.worn);
    t.check("the choices: the right hand - the spear, the club, the fists (worn), the torso - the jacket and the mail (worn); each with its words",
        choices.join() === "m154:false,m156:false,m0:true" && torso.join() === "171:false,353:true" && E.choices("torso").every(c => c.name && c.note) &&
        /obrażenia 13/.test(E.choices("right")[1].note), { choices, torso });

    // ---- the card
    const card = E.slots(), row = id => card.find(r => r.id === id);
    t.check("the card: every part with its label; the mail with its words (28%, 30% weaker at hero level 1), the right hand 'Pięści'; an empty head says where such things are bought",
        card.length === 11 && card.every(r => r.label) && row("torso").item === 353 && /^cios słabszy o 28%.*słabiej o 30%$/.test(row("torso").note) && row("right").name === "Pięści" &&
        row("head").item === 0 && /^kupisz: /.test(row("head").note), { torso: row("torso").note, head: row("head").note });

    // ---- the state through a save
    E.unequip("cloak");
    const before = parts();
    sys = Object.setPrototypeOf(JSON.parse(JSON.stringify(sys)), Game_System.prototype);
    const after = parts();
    t.check("the state goes with the save (_tw.equip): after loading the cloak stays off, the mail and the rest as they were", JSON.stringify(after) === JSON.stringify(before) &&
        after.cloak === 0 && after.torso === 353 && after.left === 155 && !!sys._tw.equip, { before, after });
});
