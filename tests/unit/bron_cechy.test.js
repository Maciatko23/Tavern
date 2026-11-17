// The weapons' traits without the game (2026-11-17; Bron_Cechy_Data.js - made by tools/bron/cechy_wtyczka.py from tools/bron/cechy.json -,
// Bron_Data.js's words, Bron_Cechy.js's side that needs no map): every weapon of cechy.json a real weapon (Bron_Data, data/Items.json) and
// every weapon there in cechy.json, the plugin the same as the json (the tool was run), every trait known with a sane value, the words of
// every trait as the user agreed them ("ogłuszenie 12% na 1,5 s"...), the cards' damage range (±10%: "obrażenia 12-14") with the traits,
// "udane kucie": the trait it picks (its kind's pool, its material's strength, none left: +1 damage), the save's forged trait merged
// into the weapon's and on its card, the chance with the skills Hutnik and Mistrz cechu, the forged one gone with the last copy, the
// wear's life longer by "trwalosc".
// The fight itself (a stun, a bleed, the range across hits, krew za krew, the plate pierced, the forge in the game): tests/bron_cechy_test.js
const fs = require("fs");
const path = require("path");
const unit = require("../lib/unit.js");

const FILES = ["TawernaCore", "Durability", "Skills_Data", "Combat", "Combat_Fight", "Combat_UI", "Humans_Data", "Creatures_Data", "Equipment", "Ubior_Data",
    "Bron_Data", "Bron_Cechy_Data", "Bron", "Bron_Cechy"];

unit.test(t => {
    const $dataItems = unit.data("Items");
    function Game_System() {}
    let sys = new Game_System();
    const bag = {};
    const $gameParty = { _items: {}, numItems: it => bag[it.id] || 0, hasItem: it => (bag[it.id] || 0) > 0,
        gainItem(it, n) { bag[it.id] = Math.max(0, (bag[it.id] || 0) + n); this._items = Object.assign({}, bag); },
        loseItem(it, n) { this.gainItem(it, -n); }, maxItems: () => 99, leader: () => null };
    const globals = { Game_System, $gameParty, $dataItems, DataManager: { isItem: o => !!o && $dataItems.includes(o) } };
    Object.defineProperty(globals, "$gameSystem", { get: () => sys, enumerable: true, configurable: true });
    const w = unit.load(FILES, { globals });
    const D = w.Bron_Data, CD = w.Bron_Cechy_Data, BC = w.Bron_Cechy, C = w.Combat, DU = w.Durability;
    const json = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "tools", "bron", "cechy.json"), "utf8"));

    // ---- the data
    const weapons = D.PRZEDMIOTY.filter(p => p.typ === "bron").map(p => p.id).sort((a, b) => a - b);
    const ids = Object.keys(CD.CECHY).map(Number).sort((a, b) => a - b);
    const notReal = ids.filter(id => !D.przedmiot(id) || D.przedmiot(id).typ !== "bron" || !($dataItems[id] && $dataItems[id].name && /<Bron:/.test($dataItems[id].note)));
    t.check("every weapon of cechy.json (" + ids.length + ") is a weapon of Bron_Data with its item in data/Items.json (<Bron:...>), and every weapon of Bron_Data has its line",
        ids.length === 77 && notReal.length === 0 && JSON.stringify(ids) === JSON.stringify(weapons), { notReal, missing: weapons.filter(id => !ids.includes(id)) });
    const sameAsJson = Object.keys(json).length === ids.length && Object.keys(json).every(k => JSON.stringify(json[k]) === JSON.stringify(CD.CECHY[k]));
    t.check("js/plugins/Bron_Cechy_Data.js holds tools/bron/cechy.json as it is (python tools/bron/cechy_wtyczka.py --wykonaj was run)", sameAsJson);
    const bad = [];
    const isNum = (v, lo, hi) => typeof v === "number" && v >= lo && v <= hi;
    const SHAPE = {
        szybkosc: v => isNum(v, 0.05, 0.3), obrazenia: v => Number.isInteger(v) && v >= 1 && v <= 6, przebicie: v => isNum(v, 0.05, 0.5), odrzut: v => Number.isInteger(v) && v >= 1 && v <= 2,
        zasieg: v => isNum(v, 0.05, 0.3), oddech: v => Number.isInteger(v) && v >= 1 && v <= 3, parowanie: v => isNum(v, 0.05, 0.3), krytyk_mocniej: v => isNum(v, 1.61, 2.2),
        trwalosc: v => isNum(v, 0.1, 0.5), stwory: v => isNum(v, 0.05, 0.3), krew_za_krew: v => isNum(v, 0.01, 0.05), postrach: v => isNum(v, 0.01, 0.1),
        przebijajaca_strzala: v => Number.isInteger(v) && v >= 2 && v <= 3,
        ogluszenie: v => v && isNum(v.szansa, 0.05, 0.2) && isNum(v.s, 0.5, 3), ogluszajacy_kamien: v => v && isNum(v.szansa, 0.05, 0.2) && isNum(v.s, 0.5, 3),
        krwawienie: v => v && isNum(v.szansa, 0.05, 0.2) && Number.isInteger(v.dps) && v.dps >= 1 && v.dps <= 4 && isNum(v.s, 2, 8)
    };
    for (const id of ids) for (const [c, v] of Object.entries(CD.CECHY[id])) if (!CD.ZNANE.includes(c) || !SHAPE[c] || !SHAPE[c](v)) bad.push(id + ":" + c + "=" + JSON.stringify(v));
    t.check("every trait known (" + CD.ZNANE.length + ": " + CD.ZNANE.join(", ") + ") with a sane value; the strengths of levels 1-5 for each", bad.length === 0 && CD.ZNANE.length === 16 &&
        CD.ZNANE.every(c => SHAPE[c] && CD.MOC[c].length === 5 && CD.MOC[c].every(SHAPE[c])), bad.slice(0, 8));
    const ranged = ids.filter(id => ["luk", "proca"].includes(D.przedmiot(id).rodzaj)), melee = ids.filter(id => !ranged.includes(id));
    const wrongSide = ranged.filter(id => Object.keys(CD.CECHY[id]).some(c => !["szybkosc", "obrazenia", "stwory", "przebijajaca_strzala", "ogluszajacy_kamien"].includes(c)))
        .concat(melee.filter(id => Object.keys(CD.CECHY[id]).some(c => ["przebijajaca_strzala", "ogluszajacy_kamien"].includes(c))));
    t.check("the bows and the slings only shot traits (speed, damage, creatures, the arrow through, the stunning stone); the melee weapons none of those two", wrongSide.length === 0, wrongSide);
    const tiers = id => Object.keys(CD.CECHY[id]).length;
    t.eq("better weapons more: the wooden staff and the stone hammer none, the iron sword 1, the steel sword 2, the order's 3, Bogumił's sword 4",
        [312, 326, 305, 308, 311, 396].map(tiers), [0, 0, 1, 2, 3, 4]);

    // ---- the words
    const S = (c, v, k) => CD.slowo(c, v, k);
    t.eq("the words of each trait (the cards)", [S("szybkosc", 0.15, "szabla"), S("szybkosc", 0.15, "luk"), S("obrazenia", 3), S("ogluszenie", { szansa: 0.12, s: 1.5 }),
        S("krwawienie", { szansa: 0.12, dps: 2, s: 4 }), S("przebicie", 0.2), S("odrzut", 1), S("zasieg", 0.2), S("oddech", 1), S("parowanie", 0.15), S("krytyk_mocniej", 1.8),
        S("trwalosc", 0.25), S("stwory", 0.15), S("krew_za_krew", 0.02), S("postrach", 0.05), S("przebijajaca_strzala", 2), S("ogluszajacy_kamien", { szansa: 0.1, s: 1 })],
        ["szybkość ataku +15%", "szybkość celowania +15%", "obrażenia +3", "ogłuszenie 12% na 1,5 s", "krwawienie 12%: 2 na sekundę przez 4 s", "przebicie pancerza 20%",
            "odrzut +1 pole", "zasięg +0,2", "oddech -1 na cios", "parowanie +15%", "krytyk ×1,8", "wytrzymałość +25%", "na stwory podziemi +15%",
            "krew za krew: 2% życia za trafienie", "postrach 5%", "strzała przebija 2 wrogów", "ogłuszający kamień 10% na 1 s"]);
    t.eq("the damage's range on the cards (±10%, Bron_Data.ROZRZUT 0.1): 13 -> 12-14, 31 -> 28-34, 38 -> 34-42, 1 -> 1",
        [D.ROZRZUT, D.zakres(13), D.zakres(31), D.zakres(38), D.zakres(1)], [0.1, "12-14", "28-34", "34-42", "1"]);
    t.eq("Bron_Data.opis with the traits: the steel sword, the mace of the order, the long bow, the leather sling; without the traits (the shop's numbers); the rows of the iron mace",
        [D.opis(308), D.opis(319), D.opis(335), D.opis(338), D.opis(308, true), D.wiersze(317).map(r => r.join(" ")).join(" | ")],
        ["obrażenia 28-34 · zasięg 1,55 · oddech 10 · krytyk +6% · obrażenia +3 · parowanie +15%",
            "obrażenia 30-36 · zasięg 1,45 · oddech 11 · krytyk +5% · na pancerz +30% · obrażenia +5 · ogłuszenie 15% na 2 s · na stwory podziemi +15%",
            "strzał 34-42 · zasięg 10,5 pól · strzała przebija 2 wrogów", "strzał 16-20 · zasięg 6,5 pól · ogłuszający kamień 10% na 1 s",
            "obrażenia 28-34 · zasięg 1,55 · oddech 10 · krytyk +6%",
            "Obrażenia 23-28 | Zachwianie 40 | Zasięg 1,45 | Oddech 13 | Krytyk +2% | Ogłuszenie 10% · 1,5 s | Poziom 11"]);
    const noWords = ids.filter(id => tiers(id) && CD.slowa(CD.of(id), D.przedmiot(id).rodzaj).length !== tiers(id));
    t.check("every weapon with traits has a word for each of them on its card", noWords.length === 0, noWords);

    // ---- udane kucie: the trait picked
    const P = id => D.przedmiot(id), L = (id, r) => CD.wylosuj(P(id), CD.of(id), () => r);
    t.eq("udane kucie picks a trait of the kind's pool it does not have, at its material's strength: the stone hammer (level 1) ogłuszenie 8% / 1 s; the iron sword " +
        "(has parowanie; level 2) obrażenia +2 or trwalosc 20%; the steel dagger (stal, level 3) przebicie 20%; the long bow (its own pool) szybkość 10%; the steel axe (its pool done) obrażenia +1",
        [L(326, 0), L(305, 0), L(305, 0.99), L(302, 0), L(335, 0), L(407, 0)],
        [{ c: "ogluszenie", v: { szansa: 0.08, s: 1 }, plus: false }, { c: "obrazenia", v: 2, plus: false }, { c: "trwalosc", v: 0.2, plus: false },
            { c: "przebicie", v: 0.2, plus: false }, { c: "szybkosc", v: 0.1, plus: false }, { c: "obrazenia", v: 1, plus: true }]);

    // ---- Bron_Cechy.js: the save's forged trait, the chance, the wear
    sys = new Game_System();
    BC.refresh();
    const base = [BC.of(305), BC.udaneSlowo(305), BC.of(312)];
    BC.state().kucie[305] = { c: "obrazenia", v: 2, plus: false, d: 1 };
    BC.state().kucie[308] = { c: "obrazenia", v: 1, plus: true, d: 1 };
    BC.refresh();
    t.check("the save's forged trait merged into the weapon's own (the iron sword: parowanie + obrazenia 2; the steel sword: obrazenia 3 + 1 = 4); the card says it; a weapon without traits: the frozen empty one",
        JSON.stringify(base[0]) === '{"parowanie":0.12}' && base[1] === "" && base[2] === BC.NONE && BC.of(305).obrazenia === 2 && BC.of(305).parowanie === 0.12 &&
        BC.of(308).obrazenia === 4 && BC.udaneSlowo(305) === "obrażenia +2" && /· Udane kucie: obrażenia \+2$/.test(D.opis(305)) && BC.of(305) === BC.of(305) &&
        BC.slowa(305) === "parowanie +12% · udane kucie: obrażenia +2", { of305: BC.of(305), opis: D.opis(305), slowa: BC.slowa(305) });
    const lost = BC.lose(305);
    t.check("none left in the bag (nor in a chest, nor on the ground): the forged trait is gone; one in the bag keeps it", lost && !BC.state().kucie[305] && BC.of(305).obrazenia === undefined &&
        (bag[308] = 1) && !BC.lose(308) && BC.of(308).obrazenia === 4);
    const h = C.hero();
    const chance = [BC.szansaKucia()];
    h.skills = { c_smelt: 2 };
    h.rev = (h.rev || 0) + 1;   // (Combat.perk keeps its sums until the hero's rev changes)
    chance.push(BC.szansaKucia());
    h.skills = { c_smelt: 2, c_master: 1 };
    h.rev++;
    chance.push(BC.szansaKucia());
    t.eq("the chance of udane kucie: 20%; with Hutnik 2 (+5% a rank) 30%; with Mistrz cechu too 40%", chance.map(v => Math.round(v * 100)), [20, 30, 40]);
    h.skills = {};
    h.rev++;
    BC.rng = () => 0;
    const made = BC.forged({ station: "forge", item: 326, n: 1, recipe: "bron_326" }), none = BC.forged({ station: "forge", item: 345, n: 1, recipe: "bron_345" });
    BC.rng = () => 0.99;
    const failed = BC.forged({ station: "workbench", item: 312, n: 1, recipe: "bron_312" });
    BC.rng = null;
    t.check("a weapon made at a station: forced well (rng 0) - the stone hammer gets ogłuszenie, kept in the save; armour (the mail coif) never; a roll over the chance - nothing",
        made && made.c === "ogluszenie" && BC.of(326).ogluszenie && BC.of(326).ogluszenie.szansa === 0.08 && none === null && failed === null && !BC.state().kucie[312] &&
        BC.state().udane === 1 && BC.state().proby === 2, { made, st: BC.state() });
    // the wear: the steel axe and pick last 25% longer (their trait), the iron sword as it was
    const B = w.Bron;
    B.wire();
    const lives = [DU.lifeOf(407), DU.lifeOf(408), DU.lifeOf(305), D.trwalosc(P(407)), D.trwalosc(P(305))];
    t.check("trwalosc: the steel axe's and pick's life 25% longer than their data (Durability.lifeOf), the iron sword's its own",
        lives[0] === Math.round(lives[3] * 1.25) && lives[1] === Math.round(D.trwalosc(P(408)) * 1.25) && lives[2] === lives[4], lives);
});
