// Nowy ekwipunek (docs/ekwipunek/NOWE_80.md, 2026-11-17): dane do instalacji z jednego źródła - js/plugins/Bron_Data.js (PRZEDMIOTY 419-482,
// SUROWCE 483-491) i js/plugins/Ubior_Data.js (PRZEDMIOTY 284-299: ubrania, płaszcze, pasy).
//   node tools/ekwipunek_nowy/zrob_staging.js
// Pisze do tools/ekwipunek_nowy/staging/:
//   Items_284_299.json   - ubrania 284-299 w układzie RPG Maker MZ (na miejsca rezerwy <Rezerwa:ubior> w data/Items.json)
//   Items_419_491.json   - broń, zbroje, tarcze, dodatki 419-482 i surowce 483-491 (dopisywane za ostatnim przedmiotem, 418)
//   ikony_plan.json      - ikony: zastępcza teraz (ikona najbardziej podobnej rzeczy) i docelowa (Bron_Data.ikonaOf / Ubior_Data ikona) - dla
//                          skryptu, który po narysowaniu ikon wpisze iconIndex
// Potem: python tools/ekwipunek_nowy/instaluj.py (przy zamkniętym edytorze).
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "staging");

function loadData() {
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    for (const f of ["Ubior_Data.js", "Bron_Data.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, "js", "plugins", f), "utf8"), sandbox, { filename: f });
    if (!sandbox.window.Bron_Data || !sandbox.window.Ubior_Data) throw new Error("Bron_Data.js / Ubior_Data.js nie dały danych");
    return { D: sandbox.window.Bron_Data, U: sandbox.window.Ubior_Data };
}

// the icon each new thing carries until its own is drawn: the most like old thing's (its iconIndex read from data/Items.json now)
const IKONA_JAK = {
    // ubrania 284-299
    284: 171, 285: 171, 286: 263, 287: 260, 288: 269, 289: 280, 290: 255, 291: 276, 292: 114, 293: 112, 294: 112, 295: 112, 296: 112, 297: 279, 298: 277, 299: 277,
    // głowa, tors, ręce, nogi, stopy
    419: 343, 420: 340, 421: 346, 422: 345, 423: 345, 424: 347, 425: 347, 426: 345, 427: 349, 428: 350, 429: 358, 430: 358, 431: 357, 432: 355, 433: 357, 434: 359,
    435: 360, 436: 360, 437: 363, 438: 366, 439: 366, 440: 366, 441: 366, 442: 371, 443: 371, 444: 372,
    // tarcze
    445: 155, 446: 155, 447: 377, 448: 375, 449: 378, 450: 377, 451: 378,
    // bronie
    452: 301, 453: 312, 454: 315, 455: 306, 456: 326, 457: 313, 458: 331, 459: 309, 460: 324, 461: 333, 462: 306, 463: 307, 464: 315, 465: 322,
    466: 332, 467: 306, 468: 322, 469: 309, 470: 324, 471: 335, 472: 336,
    // dodatki
    473: 385, 474: 386, 475: 386, 476: 395, 477: 383, 478: 386, 479: 391, 480: 385, 481: 384, 482: 391
};

const base = () => ({ animationId: 0, consumable: false, damage: { critical: false, elementId: 0, formula: "0", type: 0, variance: 20 } });
function mz(id, name, description, iconIndex, itypeId, note, price) {
    return Object.assign({ id }, base(), { description, effects: [], hitType: 0, iconIndex, itypeId, name, note, occasion: 3, price, repeats: 1, scope: 0,
        speed: 0, successRate: 100, tpGain: 0 });
}

function main() {
    const { D, U } = loadData();
    const items = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "Items.json"), "utf8"));
    const errors = [];
    const iconOf = (id, jak) => {
        const src = items[jak];
        if (!src || !src.name || !(src.iconIndex > 0)) { errors.push(id + ": brak ikony zastępczej (" + jak + ")"); return 0; }
        return src.iconIndex;
    };
    const plan = [];

    // ---- 284-299: the clothes
    const clothes = U.PRZEDMIOTY.filter(p => p.id >= 284 && p.id <= 299).sort((a, b) => a.id - b.id);
    clothes.forEach((p, i) => {
        if (p.id !== 284 + i) errors.push("ubrania: numer " + p.id + " (oczekiwany " + (284 + i) + ")");
        if (!U.WZORY[p.wzor] || !U.MIEJSCA[p.miejsce]) errors.push(p.id + ": wzór / miejsce");
        if (!p.opis) errors.push(p.id + ": brak opisu");
    });
    const A = clothes.map(p => {
        const icon = iconOf(p.id, IKONA_JAK[p.id]);
        plan.push({ id: p.id, nazwa: p.nazwa, teraz: icon, docelowa: p.ikona, jak: IKONA_JAK[p.id], wzor: p.wzor });
        return mz(p.id, p.nazwa, p.opis, icon, 2, "<Weight:" + p.waga + ">\n" + U.notatka(p), p.cena || 0);
    });

    // ---- 419-482: the gear, 483-491: the materials
    const gear = D.PRZEDMIOTY.filter(p => p.id >= 419).sort((a, b) => a.id - b.id);
    gear.forEach((p, i) => {
        if (p.id !== 419 + i) errors.push("numer " + p.id + " (oczekiwany " + (419 + i) + ")");
        if (!p.opis) errors.push(p.id + ": brak opisu");
        if (!D.MATERIALY[p.material]) errors.push(p.id + ": nieznany materiał " + p.material);
        if (p.typ === "bron" && !D.RODZAJE[p.rodzaj]) errors.push(p.id + ": nieznany rodzaj " + p.rodzaj);
        if (p.typ !== "dodatek" && !D.trwalosc(p)) errors.push(p.id + ": brak trwałości");
        if (!D.wartoscOf(p)) errors.push(p.id + ": brak ceny / wartości");
    });
    const B = gear.map(p => {
        const icon = iconOf(p.id, IKONA_JAK[p.id]);
        plan.push({ id: p.id, nazwa: p.nazwa, teraz: icon, docelowa: D.ikonaOf(p.id), jak: IKONA_JAK[p.id], wyglad: p.typ === "dodatek" ? "" : D.wygladOf(p) });
        return mz(p.id, p.nazwa, p.opis, icon, 2, "<Weight:" + D.wagaOf(p) + ">\n" + D.notatka(p), D.cenaOf(p) || D.wartoscOf(p) || 0);
    });
    const mats = D.SUROWCE.slice().sort((a, b) => a.id - b.id);
    mats.forEach((s, i) => { if (s.id !== 483 + i) errors.push("surowce: numer " + s.id + " (oczekiwany " + (483 + i) + ")"); });
    const C = mats.map(s => {
        const icon = iconOf(s.id, s.jak);
        plan.push({ id: s.id, nazwa: s.nazwa, teraz: icon, docelowa: D.ikonaOf(s.id), jak: s.jak });
        return mz(s.id, s.nazwa, s.opis, icon, 1, "<Weight:" + s.waga + ">", s.cena || s.wartosc || 0);
    });
    if (B.length && C.length && B[B.length - 1].id + 1 !== C[0].id) errors.push("przerwa między " + B[B.length - 1].id + " a " + C[0].id);

    // names: unique over the whole database (the old ones and the new)
    const names = new Map();
    for (const it of items) if (it && it.name && !(it.id >= 284 && it.id <= 299) && it.id < 419) names.set(it.name, it.id);
    for (const it of A.concat(B, C)) { if (names.has(it.name)) errors.push("nazwa dwa razy: " + it.name + " (" + names.get(it.name) + ", " + it.id + ")"); names.set(it.name, it.id); }
    // the recipes' inputs and tools exist (after the install)
    const known = id => (id >= 284 && id <= 299) || (id >= 419 && id <= 491) || !!(items[id] && items[id].name);
    for (const st of Object.keys(D.PRZEPISY)) if (Array.isArray(D.PRZEPISY[st])) for (const [id, inputs, , , tool] of D.PRZEPISY[st]) {
        if (!known(id)) errors.push(st + ": wynik " + id);
        for (const [i] of inputs) if (!known(i)) errors.push(st + " " + id + ": składnik " + i);
        if (tool && !known(tool)) errors.push(st + " " + id + ": narzędzie " + tool);
    }
    if (errors.length) { console.error("BŁĘDY:\n  " + errors.join("\n  ")); process.exit(1); }

    fs.mkdirSync(OUT, { recursive: true });
    const write = (f, list) => fs.writeFileSync(path.join(OUT, f), "[\n" + list.map(x => JSON.stringify(x)).join(",\n") + "\n]\n");
    write("Items_284_299.json", A);
    write("Items_419_491.json", B.concat(C));
    fs.writeFileSync(path.join(OUT, "ikony_plan.json"), JSON.stringify(plan, null, 1) + "\n");
    console.log("Items_284_299.json: " + A.length + " (ubrania), Items_419_491.json: " + B.length + " rzeczy + " + C.length + " surowców; ikony zastępcze: ikony_plan.json");
}

main();
