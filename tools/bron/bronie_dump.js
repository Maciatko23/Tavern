// dump every weapon of Bron_Data.js (stats, price, recipe, where) to JSON - for the weapons page
const path = require("path");
const ROOT = "c:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna";
process.chdir(ROOT);
const unit = require(path.join(ROOT, "tests/lib/unit.js"));
const $dataItems = unit.data("Items");
function Game_System() {}
const bag = {};
const $gameParty = { _items: {}, numItems: it => bag[it.id] || 0, hasItem: () => false, gainItem() {}, loseItem() {}, maxItems: () => 99, leader: () => null };
const globals = { Game_System, $gameParty, $dataItems, DataManager: { isItem: o => !!o && $dataItems.includes(o) } };
Object.defineProperty(globals, "$gameSystem", { get: () => new Game_System(), enumerable: true, configurable: true });
const FILES = ["TawernaCore", "Durability", "Skills_Data", "Combat", "Combat_Fight", "Combat_UI", "Humans_Data", "Creatures_Data", "Equipment", "Ubior_Data", "Bron_Data", "Bron_Cechy_Data", "Bron"];   // (2026-11-17: the traits' words in "slowa")
const w = unit.load(FILES, { globals });
const D = w.Bron_Data;
const name = id => ($dataItems[id] && $dataItems[id].name) || ("#" + id);
const ST = { forge: "Kuźnia", tannery: "Garbarnia", workbench: "Warsztat", loom: "Krosno" };
const recipes = {};
for (const [st, list] of Object.entries(D.PRZEPISY)) {
    if (!Array.isArray(list)) continue;
    for (const [id, inputs, hours, stamina, tool] of list) {
        (recipes[id] = recipes[id] || []).push({ stacja: ST[st] || st, skladniki: inputs.map(([i, n]) => n + "× " + name(i)), godziny: hours, sily: stamina, narzedzie: tool ? name(tool) : null });
    }
}
const out = [];
for (const p of D.PRZEDMIOTY) {
    if (p.typ !== "bron") continue;
    const s = D.staty(p) || {}, R = D.RODZAJE[p.rodzaj] || {}, M = D.MATERIALY[p.material] || {};
    const it = $dataItems[p.id] || {};
    out.push({
        id: p.id, nazwa: it.name || p.nazwa, rodzaj: p.rodzaj, rodzajNazwa: R.nazwa || p.rodzaj, material: p.material, materialNazwa: M.nazwa || p.material,
        poziom: p.poziom, unikat: !!p.unikat, istnieje: !!p.istnieje,
        dmg: s.dmg, zachwianie: s.poise, zasieg: s.reach, oddech: s.cost, krytyk: s.crit || 0, pancerz: s.pancerz || 1, zwierz: s.zwierz || 1, ukrycie: s.ukrycie || 1,
        zamach: !!s.sweep, klasa: s.klasa, dystans: !!s.dystans, strzal: s.damage, zasiegStrzalu: s.range,
        trwalosc: D.trwalosc(p), jednostka: D.jednostka(p), cena: D.cenaOf(p) || null, wartosc: D.wartoscOf(p), waga: D.wagaOf(p),
        gdzie: D.gdzie(p.id), zrodla: p.zrodla || [], opis: (it.description || p.opis || "").replace(/\s+/g, " "), slowa: D.opis(p.id),
        reka: p.reka || null, przepisy: recipes[p.id] || []
    });
}
const kinds = {};
for (const [k, R] of Object.entries(D.RODZAJE)) kinds[k] = { nazwa: R.nazwa || k, klasa: R.klasa, opis: R.opis || "", dystans: !!R.dystans };
const mats = {};
for (const [k, M] of Object.entries(D.MATERIALY)) mats[k] = { nazwa: M.nazwa || k, poziom: M.poziom || null };
require("fs").writeFileSync(process.argv[2], JSON.stringify({ bronie: out, rodzaje: kinds, materialy: mats, kara: D.KARA }, null, 1));
console.log(out.length, "broni;", out.filter(b => b.przepisy.length).length, "z przepisem;", out.filter(b => b.dystans).length, "dystansowe");
