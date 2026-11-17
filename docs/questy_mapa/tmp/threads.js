// dziennik). Każdy wpis: zadanie / mieszkaniec, krok, opis, waga.
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = "C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna";
const sandbox = require(path.join(ROOT, "tests", "lib", "sandbox.js"));

const QUIET = process.argv.includes("--cicho");
const PLUG = path.join(ROOT, "js", "plugins");
const OUT_JSON = "x", OUT_MD = "y";

// ------------------------------------------------------------------ dane gry
const items = sandbox.withMeta(sandbox.loadData("Items"));
const mapInfos = sandbox.loadData("MapInfos");
const itemOf = id => (items[id] && items[id].name ? items[id] : null);
const mapName = id => { const m = mapInfos[id]; return m ? m.name : null; };
const mapFile = id => path.join(ROOT, "data", "Map" + String(id).padStart(3, "0") + ".json");
const maps = new Map();   // id -> { width, height, events, markers: Set }
for (const m of mapInfos) {
    if (!m) continue;
    const f = mapFile(m.id);
    if (!fs.existsSync(f)) continue;
    const d = JSON.parse(fs.readFileSync(f, "utf8"));
    const markers = new Set();
    for (const e of d.events || []) { const mm = e && /^Miejsce:\s*(.+?)\s*$/i.exec(e.name || ""); if (mm) markers.add(mm[1]); }
    maps.set(m.id, { id: m.id, name: m.name, width: d.width, height: d.height, events: d.events || [], markers });
}
const markerMaps = new Map();   // marker -> [mapId]
for (const m of maps.values()) for (const k of m.markers) (markerMaps.get(k) || markerMaps.set(k, []).get(k)).push(m.id);

// Farming.js's ITEM map (its data plugin builds the tables from it: Farming_Data.build(ITEM))
function farmingItemMap() {
    const src = fs.readFileSync(path.join(PLUG, "Farming.js"), "utf8");
    const m = /const ITEM = \{([\s\S]*?)\n    \};/.exec(src);
    const out = {};
    if (!m) return out;
    for (const e of m[1].matchAll(/(\w+): num\(params\.\w+, (\d+)\)/g)) out[e[1]] = Number(e[2]);
    for (const e of m[1].matchAll(/(\w+): (\d+)/g)) if (out[e[1]] === undefined) out[e[1]] = Number(e[2]);
    return out;
}
const FARM_ITEM = farmingItemMap();

// the game's plugin list (js/tawerna_wtyczki.js): the data plugins in their order
const listSrc = fs.readFileSync(path.join(ROOT, "js", "tawerna_wtyczki.js"), "utf8");
const pluginOrder = Array.from(listSrc.matchAll(/\{"name":"([A-Za-z0-9_]+)","status":(true|false)/g)).filter(m => m[2] === "true").map(m => m[1]);
const dataPlugins = pluginOrder.filter(n => /_Data$/.test(n) && n !== "Skills_Data" && n !== "Act3_Data" && n !== "Creatures_Data" && n !== "Humans_Data" && n !== "TavernDice_Data");
const sources = {};   // plugin name -> source text (for the code searches)
for (const f of fs.readdirSync(PLUG)) if (/\.js$/.test(f)) sources[f.replace(/\.js$/, "")] = fs.readFileSync(path.join(PLUG, f), "utf8");
const allCode = Object.values(sources).join("\n");

// ------------------------------------------------------------------ piaskownica
const globals = { $dataItems: items, $dataMapInfos: mapInfos, $dataSystem: { variables: [], switches: [] }, $gameVariables: { value: () => 0 }, $gameSwitches: { value: () => false } };
const win = sandbox.makeWindow({ globals });
const loadErrors = [];
function load(name) {
    try { sandbox.loadPlugins([name], { window: win }); return true; } catch (e) { loadErrors.push(name + ": " + (e && e.message)); return false; }
}
load("TawernaCore");
load("Watki");
for (const n of dataPlugins) load(n);
// (Homes.js pushes D21 into TownQuests when it is there - here the quest is read from its API)
const homesOk = load("Homes");
// the words
const TEXT_DIR = path.join(ROOT, "js", "teksty");
for (const f of fs.readdirSync(TEXT_DIR).filter(f => /\.txt$/.test(f)).sort()) {
    try { win.Watki.wczytaj(f.replace(/\.txt$/, ""), fs.readFileSync(path.join(TEXT_DIR, f), "utf8")); } catch (e) { loadErrors.push("teksty " + f + ": " + e.message); }
}
const TQ = win.TownQuestsData, TL = win.TownLifeData, W = win.Watki;
if (!TQ || !TL) { console.error("Brak TownQuestsData / TownLifeData - nie da się zrobić przeglądu.", loadErrors); process.exit(2); }

// ------------------------------------------------------------------ zadania
const QUESTS = TQ.QUESTS.slice();
if (homesOk && win.Homes && win.Homes.D21 && !QUESTS.some(q => q.id === "D21")) QUESTS.push(win.Homes.D21);
// W9 rozdz. 3 (Rywal_Data: Watki.watek(zadanie: "W9") - its steps 1-2 come in the loop below with W4's)
// W4 rozdz. 6-8 (Watki.watek(zadanie: "W4") puts its chapters at their indexes when TownQuests is there)
const threadSteps = [];   // { quest, kroki, tx }
for (const id of (W && W.watki ? W.watki() : [])) {
    const w = W.get(id);
    if (!w || !w.def || !w.def.zadanie || !w.def.kroki) continue;
    const q = QUESTS.find(x => x.id === w.def.zadanie);
    if (!q) { continue; }
    const tx = W.teksty(w.def.teksty || id);
    for (const k of w.def.kroki) {
        const key = k.tekst || "kroki." + k.nazwa, text = key.split(".").reduce((o, p) => (o && typeof o === "object" ? o[p] : undefined), tx);
        const s = { ch: k.ch, type: k.typ || "custom", nazwa: k.nazwa, text: typeof text === "string" ? text : "", watek: id, indeks: k.indeks };
        if (k.rozmowy || k.temat) s.talk = k.nazwa;
        if (k.gotowe !== undefined) s.check = k.nazwa;
        if (k.indeks !== undefined && q.steps.length !== k.indeks) threadSteps.push({ quest: q.id, krok: k.nazwa, indeks: k.indeks, ma: q.steps.length });
        q.steps.push(s);
        for (const e of k.rozmowy || []) if (e.kto) s.rozmowyKto = (s.rozmowyKto || []).concat(e.kto);
        if (k.temat && k.temat.kto) s.rozmowyKto = (s.rozmowyKto || []).concat(k.temat.kto);
    }
}
const Q = {};
for (const q of QUESTS) Q[q.id] = q;

// ------------------------------------------------------------------ osoby
const RES = TL.RESIDENTS.concat(Array.isArray(win.TownLifeExtra) ? win.TownLifeExtra : []);
const resOf = key => RES.find(r => r.key === key) || null;
const GUESTS = RES.filter(r => r.plan && r.plan.some(p => p[2] === "tawerna")).map(r => r.key);
const rep = (k, v) => typeof v === "function" ? "fn:" + (v.name || "anon") : v;
const th = {};
for (const id of W.watki()) { const w = W.get(id); th[id] = { zadanie: w.def.zadanie, teksty: w.def.teksty, def: JSON.parse(JSON.stringify(w.def, rep)) }; }
fs.writeFileSync("C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/docs/questy_mapa/tmp/threads.json", JSON.stringify(th));
// texts per thread
const txt = {};
for (const f of fs.readdirSync(TEXT_DIR).filter(f => /\.txt$/.test(f))) { try { txt[f.replace(/\.txt$/, "")] = W.teksty(f.replace(/\.txt$/, "")); } catch (e) {} }
fs.writeFileSync("C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/docs/questy_mapa/tmp/texts.json", JSON.stringify(txt));
console.log("threads", Object.keys(th).join(","));
// TownQuests raw defs
const raw = {};
for (const q of QUESTS) raw[q.id] = JSON.parse(JSON.stringify(q, rep));
fs.writeFileSync("C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/docs/questy_mapa/tmp/qraw.json", JSON.stringify(raw));
