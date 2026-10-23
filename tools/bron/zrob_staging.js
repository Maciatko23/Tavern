// Broń i zbroje: dane do instalacji z jednego źródła - js/plugins/Bron_Data.js (PRZEDMIOTY, MATERIALY).
//   node tools/bron/zrob_staging.js
// Pisze do tools/bron/staging/:
//   Items_dopisek.json  - nowe przedmioty 300-406 w układzie RPG Maker MZ (tablica, jeden przedmiot w wierszu)
//   Items_notatki.json  - notatki dopisywane do starych przedmiotów (bronie 60, 63, 115, 116, 154, 156, łuk 126, proca 125, tarcza 155)
//   ikony.json          - co narysować na ikonach 576+ (tools/bron/ikony.py): rodzaj / rysunek, rampa materiału, akcent
// Potem: python tools/bron/ikony.py (IconSet_nowe.png), python tools/bron/instaluj_dane.py (przy zamkniętym edytorze).
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "staging");
const FIRST_ID = 300, FIRST_ICON = 576;

function loadData() {
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, "js", "plugins", "Bron_Data.js"), "utf8"), sandbox, { filename: "Bron_Data.js" });
    if (!sandbox.window.Bron_Data) throw new Error("Bron_Data.js nie dał danych (window.Bron_Data)");
    return sandbox.window.Bron_Data;
}

// one item as RPG Maker MZ writes it (the key order of data/Items.json; like 155 / 156: a key item, not used up)
function mzItem(p, D) {
    const price = D.cenaOf(p) || D.wartoscOf(p) || 0;
    return {
        id: p.id, animationId: 0, consumable: false,
        damage: { critical: false, elementId: 0, formula: "0", type: 0, variance: 20 },
        description: p.opis, effects: [], hitType: 0, iconIndex: p.ikona, itypeId: 2, name: p.nazwa,
        note: "<Weight:" + D.wagaOf(p) + ">\n" + D.notatka(p), occasion: 3, price, repeats: 1, scope: 0, speed: 0, successRate: 100, tpGain: 0
    };
}
// the trinkets' stone / fang / coin (the icon's accent)
const AKCENT = { 381: "#efe6cf", 382: "#e8a33a", 383: "#c9773c", 384: "#3b3f48", 385: "#d9c8a0", 386: "#2a2a30", 387: "#ece2c8", 388: "#5fc4d0",
    389: "#c98f3f", 390: "#a8a49a", 391: "#9aa3ad", 392: "#f0d8c8", 393: "#3f8a4e", 394: "#c9b46a", 395: "#f2ead2", 404: "#9fe6f2" };

function main() {
    const D = loadData();
    const fresh = D.PRZEDMIOTY.filter(p => !p.istnieje).sort((a, b) => a.id - b.id);
    const errors = [];
    fresh.forEach((p, i) => {
        if (p.id !== FIRST_ID + i) errors.push("numer " + p.id + " (oczekiwany " + (FIRST_ID + i) + ")");
        if (p.ikona !== FIRST_ICON + i) errors.push(p.nazwa + ": ikona " + p.ikona + " (oczekiwana " + (FIRST_ICON + i) + ")");
        if (!p.opis) errors.push(p.nazwa + ": brak opisu");
        if (!D.MATERIALY[p.material]) errors.push(p.nazwa + ": nieznany materiał " + p.material);
        if (p.typ === "bron" && !D.RODZAJE[p.rodzaj]) errors.push(p.nazwa + ": nieznany rodzaj " + p.rodzaj);
        if (p.typ === "zbroja" && !D.MIEJSCA[p.miejsce]) errors.push(p.nazwa + ": nieznane miejsce " + p.miejsce);
        if (p.typ !== "dodatek" && !D.trwalosc(p)) errors.push(p.nazwa + ": brak trwałości");
        if (!D.wartoscOf(p)) errors.push(p.nazwa + ": brak ceny / wartości");
    });
    const names = new Set();
    for (const p of D.PRZEDMIOTY) { if (names.has(p.nazwa)) errors.push("nazwa dwa razy: " + p.nazwa); names.add(p.nazwa); }
    if (errors.length) { console.error("BŁĘDY:\n  " + errors.join("\n  ")); process.exit(1); }

    fs.mkdirSync(OUT, { recursive: true });
    const items = fresh.map(p => mzItem(p, D));
    fs.writeFileSync(path.join(OUT, "Items_dopisek.json"), "[\n" + items.map(x => JSON.stringify(x)).join(",\n") + "\n]\n");
    const notes = {};
    for (const p of D.PRZEDMIOTY.filter(x => x.istnieje)) notes[p.id] = D.notatka(p);
    fs.writeFileSync(path.join(OUT, "Items_notatki.json"), JSON.stringify(notes, null, 2) + "\n");
    const icons = fresh.map(p => ({ ikona: p.ikona, id: p.id, typ: p.typ, nazwa: p.nazwa, rodzaj: p.rodzaj || "", material: p.material,
        rysunek: p.typ === "bron" ? p.rodzaj : p.rys || p.rodzaj, rampa: D.MATERIALY[p.material].kolor, akcent: AKCENT[p.id] || null, unikat: !!p.unikat }));
    fs.writeFileSync(path.join(OUT, "ikony.json"), JSON.stringify(icons, null, 1) + "\n");
    console.log("Items_dopisek.json: " + items.length + " przedmiotów (" + items[0].id + "-" + items[items.length - 1].id + "), ikony " + icons[0].ikona + "-" + icons[icons.length - 1].ikona +
        "; notatki starych: " + Object.keys(notes).join(", "));
}

main();
