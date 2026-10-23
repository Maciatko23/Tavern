// Ubiór: dane do instalacji z jednego źródła - js/plugins/Ubior_Data.js (PRZEDMIOTY, WZORY).
//   node tools/ubior/zrob_staging.js
// Pisze do tools/ubior/staging/:
//   Items_dopisek.json  - nowe przedmioty 250+ w układzie RPG Maker MZ (tablica, jeden przedmiot w wierszu)
//   Items_notatki.json  - notatki <Ubior:miejsce,wzor> dopisywane do starych przedmiotów (113, 114, 171)
//   ikony.json          - co narysować na ikonach 528+ (tools/ubior/ikony.py): rysunek, rampa, akcent
// Potem: python tools/ubior/ikony.py (IconSet_nowe.png), python tools/ubior/instaluj_dane.py (przy zamkniętym edytorze).
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "staging");

function loadData() {
    const src = fs.readFileSync(path.join(ROOT, "js", "plugins", "Ubior_Data.js"), "utf8");
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(src, sandbox, { filename: "Ubior_Data.js" });
    if (!sandbox.window.Ubior_Data) throw new Error("Ubior_Data.js nie dał danych (window.Ubior_Data)");
    return sandbox.window.Ubior_Data;
}

// one item as RPG Maker MZ writes it (the key order of data/Items.json; a thing to wear: like 113 / 171 - a key item, not used up)
function mzItem(p, D) {
    return {
        id: p.id, animationId: 0, consumable: false,
        damage: { critical: false, elementId: 0, formula: "0", type: 0, variance: 20 },
        description: p.opis, effects: [], hitType: 0, iconIndex: p.ikona, itypeId: 2, name: p.nazwa,
        note: "<Weight:" + p.waga + ">\n" + D.notatka(p), occasion: 3, price: p.cena || 0, repeats: 1, scope: 0, speed: 0, successRate: 100, tpGain: 0
    };
}

function main() {
    const D = loadData();
    const fresh = D.PRZEDMIOTY.filter(p => !p.istnieje).sort((a, b) => a.id - b.id);
    // checks: the numbers 250-299 in a row, the icons 528+ in a row, every wzor and place known, no name twice
    const errors = [];
    fresh.forEach((p, i) => {
        if (p.id !== 250 + i) errors.push("numer " + p.id + " (oczekiwany " + (250 + i) + ")");
        if (p.id > 299) errors.push("numer " + p.id + " poza 250-299");
        if (p.ikona !== 528 + i) errors.push(p.wzor + ": ikona " + p.ikona + " (oczekiwana " + (528 + i) + ")");
        if (!D.WZORY[p.wzor]) errors.push(p.wzor + ": brak w WZORY");
        if (!D.MIEJSCA[p.miejsce]) errors.push(p.wzor + ": nieznane miejsce " + p.miejsce);
        if (!p.opis) errors.push(p.wzor + ": brak opisu");
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
    const icons = fresh.map(p => ({ ikona: p.ikona, id: p.id, wzor: p.wzor, nazwa: p.nazwa, rysunek: p.rysunek, rampa: D.WZORY[p.wzor].rampa, akcent: D.WZORY[p.wzor].akcent || null }));
    fs.writeFileSync(path.join(OUT, "ikony.json"), JSON.stringify(icons, null, 1) + "\n");
    console.log("Items_dopisek.json: " + items.length + " przedmiotów (" + items[0].id + "-" + items[items.length - 1].id + "), ikony " + icons[0].ikona + "-" + icons[icons.length - 1].ikona);
    console.log("Items_notatki.json: " + Object.keys(notes).map(k => k + " " + notes[k]).join(", "));
}
main();
