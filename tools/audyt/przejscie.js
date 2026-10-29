// tools/audyt/przejscie.js - statyczny przegląd przechodniości zadań i wątków (bez przeglądarki), 2026-10-24.
//
// Wczytuje pliki danych gry (TawernaCore + Watki + każda wtyczka *_Data z listy js/tawerna_wtyczki.js) w piaskownicy testów
// (tests/lib/sandbox.js), karmi je tekstami z js/teksty/*.txt i sprawdza każde zadanie TownQuests (K / D / W, paczki, D21, kroki
// W4 z Kasztelan_Data i W9 z Rywal_Data):
//   - dawca i osoby kroków istnieją (mieszkańcy TownLife i paczek, Lord / dziadek / Borgar, bywalcy tawerny);
//   - osoba jest osiągalna w godzinach kroku (plan dnia: na zewnątrz, w tawernie jako gość albo we własnym wnętrzu ze znacznikiem
//     „Miejsce: <klucz>_wnetrze”; „away” = poza mapą);
//   - potrzebne przedmioty istnieją w bazie i mają znane źródło (receptury Farming / Bron, uprawy, zbiór, polowanie, sklepy, nagrody
//     zadań, łup, kod wtyczek);
//   - rzeczy spoza bazy („v:klucz”) są w VITEMS i ktoś je daje (vgives / kod);
//   - miejsca zadań (SPOTS) stoją na istniejącej mapie, na znaczniku „Miejsce: …” albo na własnych współrzędnych w granicach mapy;
//   - haki FX nazwane w danych istnieją w kodzie; flagi wymagane w warunkach startu są gdzieś ustawiane; `done` wskazuje istniejące
//     zadania, a łańcuch wymagań nie ma pętli;
//   - każdy krok ma tekst do dziennika.
// Osobno: plany dnia mieszkańców (miejsca, warunki, wnętrza) i zleceniodawcy tablicy.
//
//   node tools/audyt/przejscie.js            tabela problemów na konsoli, pliki tools/audyt/wynik.json i tools/audyt/wynik.md
//   node tools/audyt/przejscie.js --cicho    tylko podsumowanie
//
// Wagi: blokada (nie da się przejść), uciążliwość (da się, ale gracz się namęczy albo musi trafić w wąskie okno), kosmetyka (tekst,
// dziennik). Każdy wpis: zadanie / mieszkaniec, krok, opis, waga.
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const sandbox = require(path.join(ROOT, "tests", "lib", "sandbox.js"));

const QUIET = process.argv.includes("--cicho");
const PLUG = path.join(ROOT, "js", "plugins");
const OUT_JSON = path.join(__dirname, "wynik.json"), OUT_MD = path.join(__dirname, "wynik.md");

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
const TOWN = 8;
const COND_REGISTERED = new Set(["market"].concat(Array.from(allCode.matchAll(/addCondition\(\s*"([A-Za-z0-9_]+)"/g)).map(m => m[1])));
const STORY = { lord: { name: "Lord Zaleski", map: 24, hours: [8, 20], note: "Lord przed dworem 8-20 (nocą kamerdyner przy drzwiach)" },
    grandpa: { name: "Dziadek Stach", map: 19, hours: [0, 24] }, borgar: { name: "Borgar", map: 1, hours: [0, 24] } };
const REGULAR = { melia: { name: "Melia", map: 1, hours: [0, 24] }, ozzy: { name: "Dziadek Ozzy", map: 1, hours: [6, 23], note: "Ozzy 23-6 śpi (mruczy przez sen)" }, grum: { name: "Grum", map: 1, hours: [0, 24] } };
function personKnown(key) { return !!(resOf(key) || STORY[key] || REGULAR[key]); }
function personName(key) { const r = resOf(key); return r ? r.name : STORY[key] ? STORY[key].name : REGULAR[key] ? REGULAR[key].name : key; }
// the spots a resident's plan may use on its map
function spotKnown(res, where) {
    if (Array.isArray(where)) return where.every(w => spotKnown(res, w));
    const map = res.map || TOWN;
    if (map === TOWN && TL.SPOTS[where]) return true;
    if (TL.SPOTS_BY_MAP && TL.SPOTS_BY_MAP[map] && TL.SPOTS_BY_MAP[map][where]) return true;
    const m = maps.get(map);
    return !!(m && m.markers.has(where));
}
// where an "inside" entry puts the resident: "tawerna" (Map001 guest), his interior (a map with "Miejsce: <key>_wnetrze"), or away
function insideReach(res, where) {
    if (res.away && res.away.includes(where)) return { ok: false, why: "poza mapą (" + where + ")" };
    if (where === "tawerna") { const n = GUESTS.indexOf(res.key) + 1; const m = maps.get(1); return m && (m.markers.has("gosc_" + n) || (TL.SPOTS_BY_MAP && TL.SPOTS_BY_MAP[1] && TL.SPOTS_BY_MAP[1]["gosc_" + n])) ? { ok: true, where: "tawerna" } : { ok: false, why: "brak miejsca gosc_" + n + " w tawernie" }; }
    const name = res.indoor && res.indoor[where] ? res.indoor[where] : res.key + "_wnetrze";
    const ms = markerMaps.get(name);
    if (ms && ms.length) return { ok: true, where: "wnętrze " + ms.map(id => id + " " + mapName(id)).join(", ") };
    for (const [mid, spots] of Object.entries(TL.SPOTS_BY_MAP || {})) if (spots[name]) return { ok: true, where: "wnętrze " + mid };
    return { ok: false, why: "w domu bez wnętrza (brak znacznika Miejsce: " + name + ")" };
}
const inHours = (h, hs) => { const [a, b] = hs; return a <= b ? h >= a && h < b : h >= a || h < b; };
// the plan entry at hour h: plain - the unconditional entries only (an ordinary day); all - the conditional ones counted as holding
function planAt(res, h, all) {
    const plan = (res.plan || []).filter(p => all || !p[3]);
    if (!plan.length) return null;
    let cur = plan[plan.length - 1];
    for (const p of plan) if (p[0] <= h) cur = p;
    return cur;
}
const condName = c => (typeof c === "function" ? "warunek z kodu" : String(c));
// the share of the hours window the resident can be talked to (and where); whys: the reasons of the unreachable part; conds: the
// conditions that would make him reachable when the plain day does not (frac: the plain day, fracAll: with every condition holding)
function reach(res, hours) {
    const hs = hours || [0, 24];
    let n = 0, ok = 0, okAll = 0; const whys = new Map(), wheres = new Set(), conds = new Set();
    const isOk = p => (!p ? { ok: true } : p[1] !== "inside" ? { ok: true, where: "mapa " + (res.map || TOWN) } : insideReach(res, p[2]));
    for (let h = 0; h < 24; h += 0.25) {
        if (!inHours(h, hs)) continue;
        n++;
        const p = planAt(res, h, false), r = isOk(p);
        if (r.ok) { ok++; if (r.where) wheres.add(r.where); } else whys.set(r.why, (whys.get(r.why) || 0) + 1);
        const pa = planAt(res, h, true), ra = isOk(pa);
        if (ra.ok) { okAll++; if (!r.ok && pa && pa[3]) conds.add(condName(pa[3])); }
    }
    return { frac: n ? ok / n : 1, fracAll: n ? okAll / n : 1, whys: Array.from(whys.keys()), wheres: Array.from(wheres), conds: Array.from(conds) };
}
const condOkName = c => typeof c === "function" || COND_REGISTERED.has(String(c).replace(/^!/, ""));

// ------------------------------------------------------------------ źródła przedmiotów
const srcOf = new Map();   // id -> Set(source)
const addSrc = (id, s) => { id = Number(id); if (!id) return; (srcOf.get(id) || srcOf.set(id, new Set()).get(id)).add(s); };
let FD = null;
try { FD = win.Farming_Data && typeof win.Farming_Data.build === "function" ? win.Farming_Data.build(FARM_ITEM) : null; } catch (e) { loadErrors.push("Farming_Data.build: " + e.message); }
if (FD) {
    for (const [k, b] of Object.entries(FD.BUILDINGS || {})) {
        for (const r of b.recipes || []) if (r.output) addSrc(r.output[0], "receptura: " + (b.name || k));
        if (b.produce) addSrc(b.produce.item, "budynek: " + (b.name || k));
        for (const r of b.gather || []) addSrc(r.item || r[0], "budynek: " + (b.name || k));
    }
    for (const r of FD.HAND_RECIPES || []) if (r.output) addSrc(r.output[0], "ręcznie");
    for (const c of Object.values(FD.CROPS || {})) { addSrc(c.produce, "uprawa"); addSrc(c.seed, "uprawa (nasiona ze zbioru)"); }
}
// the ground, the trees, the water, the hunt (Farming.js GATHER, ChoppableTree, Puddles, Hunting_Weapons YIELD, fishing)
for (const id of [64, 92, 102, 103, 104, 77, 149, 150, 151, 147, 71, 72, 67, 68]) addSrc(id, "zbiór z ziemi");
for (const id of [61, 64, 85, 77, 139, 140]) addSrc(id, "ścinanie / kopanie (ChoppableTree)");
addSrc(164, "kałuże po deszczu (Puddles)");
for (const id of [94, 157, 159, 161, 168, 96, 170, 163, 101]) addSrc(id, "oprawianie zwierzyny");
for (const id of [145, 146]) addSrc(id, "ptaki (proca)");
for (const id of [98, 173, 174, 186]) addSrc(id, "wędkowanie");
addSrc(148, "ręcznie (szyszki)"); addSrc(152, "ręcznie (opatrunek)");
const BD = win.Bron_Data;
if (BD) {
    for (const [k, s] of Object.entries(BD.SKLEPY || {})) { for (const id of s.sprzedaje || []) if (typeof id === "number") addSrc(id, "sklep broni: " + (s.kto || k)); for (const id of (s.uzywane && s.uzywane.z) || []) if (typeof id === "number") addSrc(id, "sklep broni (używane): " + (s.kto || k)); }
    for (const [k, list] of Object.entries(BD.PRZEPISY || {})) if (Array.isArray(list)) for (const r of list) addSrc(r[0], "receptura Bron: " + k);
    const L = BD.LUP || {};
    for (const grp of Object.values(L)) if (grp && typeof grp === "object") for (const v of Object.values(grp)) if (Array.isArray(v)) for (const e of v) if (Array.isArray(e)) addSrc(e[0], "łup (Bron LUP)"); else if (e && typeof e === "object" && e.id) addSrc(e.id, "łup (Bron LUP)");
}
const UD = win.Ubior_Data;
const tagItem = new Map();   // Ubior tag -> item id
for (const it of items) { const m = it && it.meta && typeof it.meta.Ubior === "string" ? it.meta.Ubior.split(",")[1] : null; if (m) tagItem.set(m.trim(), it.id); }
if (UD) for (const [k, s] of Object.entries(UD.SKLEPY || {})) { for (const t of s.sprzedaje || []) if (tagItem.has(t)) addSrc(tagItem.get(t), "sklep ubrań: " + (s.kto || k)); for (const t of (s.uzywane && s.uzywane.z) || []) if (tagItem.has(t)) addSrc(tagItem.get(t), "sklep ubrań (używane): " + (s.kto || k)); }
// shops in the maps' events (code 302 + 605)
for (const m of maps.values()) for (const e of m.events) for (const p of (e && e.pages) || []) { const l = p.list || []; for (let i = 0; i < l.length; i++) if (l[i].code === 302) { const rows = [l[i].parameters]; for (let k = i + 1; k < l.length && l[k].code === 605; k++) rows.push(l[k].parameters); for (const r of rows) if (r[0] === 0) addSrc(r[1], "sklep w zdarzeniu (mapa " + m.id + " " + (e.name || "")+ ")"); } }
// the quests' rewards and hand-outs
function rewardItems(rw, tag) { if (!rw) return; for (const it of rw.items || []) addSrc(it[0], tag); }
for (const q of QUESTS) {
    const tag = "nagroda " + q.id;
    rewardItems(q.reward, tag);
    if (q.offer) { for (const g of q.offer.gives || []) addSrc(g[0], tag); for (const op of q.offer.options || []) rewardItems(op.reward, tag); }
    for (const st of q.steps || []) { for (const g of st.gives || []) addSrc(g[0], tag); rewardItems(st.reward, tag); if (st.choice) for (const op of st.choice.options || []) rewardItems(op.reward, tag); }
}
const QB = win.QuestBoard && win.QuestBoard.data;
const QBD = (() => { try { const m = /const GIVERS = \{([\s\S]*?)\n    \};/.exec(sources.QuestBoard_Data || ""); return m ? m[1] : ""; } catch (e) { return ""; } })();
for (const m of QBD.matchAll(/gift: \[((?:\[\d+, \d+\],? ?)*)\]/g)) for (const g of m[1].matchAll(/\[(\d+), (\d+)\]/g)) addSrc(g[1], "tablica zleceń (podarek)");
// every data export (window.<X>Data): a thing with a numeric `item` (loot, herbs), a row { id, price / n } (a shop's goods)
(function walkData() {
    const seen = new Set();
    const walk = (o, owner, depth) => {
        if (!o || typeof o !== "object" || seen.has(o) || depth > 7) return;
        seen.add(o);
        if (Array.isArray(o)) { for (const v of o) walk(v, owner, depth + 1); return; }
        if (typeof o.item === "number" && o.item > 50) addSrc(o.item, "dane: " + owner);
        if (typeof o.id === "number" && o.id > 50 && (o.price !== undefined || o.n !== undefined) && !o.type) addSrc(o.id, "sklep / dane: " + owner);
        for (const v of Object.values(o)) walk(v, owner, depth + 1);
    };
    for (const [k, v] of Object.entries(win)) if (/Data$/.test(k) && v && typeof v === "object" && k !== "TownQuestsData" && k !== "TownLifeData") { try { walk(v, k, 0); } catch (e) { /* (a getter that needs the game) */ } }
})();
// code: gainItem($dataItems[N]) / item(N) / ITEM.x of the plugin's own map on a hand-out line / lines with a hand-out word and [N, n] pairs
const HAND_OUT = /\b(gainItem|gives|items|output|loot|drop|gift|sprzedaje|produce|nagroda|przedmiot|towar|stock|lup|skarb|reward|daje|give|yield|sells|SELLS|GOODS)\b/i;
const TAKES = /\b(need|needs|cost|inputs|take|zabiera|loseItem|hasItem|numItems|count\()\b/;
for (const [name, src] of Object.entries(sources)) {
    for (const m of src.matchAll(/gainItem\(\$dataItems\[(\d+)\]/g)) addSrc(m[1], "kod: " + name);
    for (const m of src.matchAll(/gainItem\(item\((\d+)\)/g)) addSrc(m[1], "kod: " + name);
    // the plugin's ITEM map: its data plugin's (XData.ITEM) or Farming's
    const dataExport = win[name.replace(/_Data$/, "") + "Data"] || win[name + "Data"];
    const ITEM = Object.assign({}, /^Farming/.test(name) ? FARM_ITEM : {}, dataExport && dataExport.ITEM && typeof dataExport.ITEM === "object" ? dataExport.ITEM : {});
    for (const line of src.split("\n")) {
        if (TAKES.test(line) && !/gainItem/.test(line)) continue;
        if (/gainItem\(/.test(line)) for (const m of line.matchAll(/ITEM\.(\w+)/g)) if (typeof ITEM[m[1]] === "number") addSrc(ITEM[m[1]], "kod: " + name);
        if (!HAND_OUT.test(line)) continue;
        for (const m of line.matchAll(/\[(\d{2,3}), *(\d+)(?:, *[\d.]+)?\]/g)) addSrc(m[1], "kod: " + name);
        for (const m of line.matchAll(/\[ITEM\.(\w+), *\d/g)) if (typeof ITEM[m[1]] === "number") addSrc(ITEM[m[1]], "kod: " + name);
    }
}
// quest-board items: anything a notice asks for the hero makes or gathers (not a source - left out)

// ------------------------------------------------------------------ flagi, haki FX, rzeczy spoza bazy
const flagsSet = new Set();
for (const m of allCode.matchAll(/setFlag\(\s*["']([A-Za-z0-9_]+)["']/g)) flagsSet.add(m[1]);
for (const m of allCode.matchAll(/\bflags?\.([A-Za-z0-9_]+)\s*=\s*(?!=)/g)) flagsSet.add(m[1]);
for (const m of allCode.matchAll(/\bflag\(\s*["']([A-Za-z0-9_]+)["']\s*,\s*(?:true|1|day)/g)) flagsSet.add(m[1]);
for (const m of allCode.matchAll(/\bflag:\s*["']([A-Za-z0-9_]+)["']/g)) flagsSet.add(m[1]);
for (const m of allCode.matchAll(/\bflaga:\s*["']([A-Za-z0-9_]+)["']/g)) flagsSet.add(m[1]);
for (const m of allCode.matchAll(/\bflagi:\s*\[([^\]]*)\]/g)) for (const f of m[1].matchAll(/["']([A-Za-z0-9_]+)["']/g)) flagsSet.add(f[1]);
for (const m of allCode.matchAll(/\bflags:\s*\{([^}]*)\}/g)) for (const f of m[1].matchAll(/([A-Za-z0-9_]+)\s*:/g)) flagsSet.add(f[1]);
for (const m of allCode.matchAll(/\.flags\[\s*["']([A-Za-z0-9_]+)["']\s*\]\s*=/g)) flagsSet.add(m[1]);
const flagsSetSoft = new Set();   // named anywhere at all (a flag given through a variable): a weaker "set"
for (const m of allCode.matchAll(/["']([A-Za-z][A-Za-z0-9_]{3,})["']/g)) flagsSetSoft.add(m[1]);
// (2026-10-28, etap 3) the threads with their own quests (Watki.watek({ zadania })): the engine makes the FX handlers of their steps
// (by the steps' names), their start and their offer - and the hooks the data names must be in the thread's plugin (w.haki({...}))
const engineFx = new Set(), threadHooks = [];   // { watek, zadanie, hak }
// the hooks a piece of the data names: mode "cond" (a string without ":" is a hook), "talk" (a string is a text key), "action"
// (a string in a list of actions is a hook); { hak } anywhere, zmienne: "hook"
const COND_KEYS = new Set(["gdy", "jesli", "znacznik", "gotowy", "nie", "lub", "i", "start", "oferta", "gotowe"]);
function hooksOf(v, out, mode) {
    if (v === undefined || v === null || typeof v === "boolean" || typeof v === "number") return out;
    if (typeof v === "string") { const s = v.replace(/^!+/, ""); if ((mode === "cond" || mode === "action") && s && !s.includes(":")) out.push(s); return out; }
    if (Array.isArray(v)) { for (const x of v) hooksOf(x, out, mode); return out; }
    for (const [k, x] of Object.entries(v)) {
        if (k === "hak" && typeof x === "string") out.push(x);
        else if (k === "zmienne" && typeof x === "string") out.push(x);
        else if (COND_KEYS.has(k)) hooksOf(x, out, "cond");
        else if (k === "zrob") { if (Array.isArray(x)) hooksOf(x, out, "action"); }
        else if (typeof x === "object") hooksOf(x, out, mode === "cond" ? "value" : mode === "action" ? "value" : mode);
    }
    return out;
}
for (const id of (W && W.watki ? W.watki() : [])) {
    const w = W.get(id);
    if (!w || !w.def || !(w.def.zadania || w.def.obce)) continue;
    const hook = (zid, list) => { for (const h of list) threadHooks.push({ watek: id, zadanie: zid, hak: h }); };
    for (const k of w.def.obce || []) {   // (the handlers of a step of someone else's quest: W2's w2Pytanie...)
        engineFx.add(k.nazwa);
        hook(k.zadanie || "-", hooksOf(k.gotowe, [], "cond").concat(typeof k.zmienne === "string" ? [k.zmienne] : hooksOf(k.zmienne, [], "value"), hooksOf([k.rozmowy, k.temat], [], "talk"), Object.values(k.haki || {})));
    }
    for (const [zid, z] of Object.entries(w.def.zadania || {})) {
        const q = w.Q && w.Q[zid];
        if (q && q.autoStart) engineFx.add(q.autoStart);
        if (q && q.offer && q.offer.cond && q.offer.cond.fn && z.oferta !== undefined) engineFx.add(q.offer.cond.fn);
        hook(zid, hooksOf([z.start, z.oferta], [], "cond"));
        (z.kroki || []).forEach((k, i) => {
            engineFx.add(k.nazwa);
            if (k.nagrodaFx) { engineFx.add(k.nagrodaFx.nazwa); hook(zid, [k.nagrodaFx.hak]); }
            hook(zid, hooksOf(k.gotowe, [], "cond").concat(typeof k.zmienne === "string" ? [k.zmienne] : hooksOf(k.zmienne, [], "value"), hooksOf([k.rozmowy, k.temat], [], "talk")));
            hook(zid, Object.values(k.haki || {}));
            const st = q && q.steps ? q.steps[i] : null;
            if (st) for (const e of [].concat(k.rozmowy || [], k.temat ? [k.temat] : [])) if (e.kto) st.rozmowyKto = (st.rozmowyKto || []).concat(e.kto);
        });
    }
    for (const list of Object.values(w.def.akcje || {})) hook("-", hooksOf(list, [], "action"));
    for (const list of Object.values(w.def.rozmowy || {})) hook("-", hooksOf(list, [], "talk"));
    for (const sk of Object.values((w.def.skoki && w.def.skoki.lista) || {})) hook("-", hooksOf(sk.zrob, [], "action"));
}
function fxExists(name) {
    if (!name) return true;
    if (engineFx.has(name)) return true;
    const n = name.replace(/[^\w]/g, "\\$&");
    // (a thread in a plugin of its own - Przystan.js: obce: [{ nazwa: "d20Noc", ... }] - the engine makes that handler)
    if (new RegExp("\\bnazwa:\\s*[\"']" + n + "[\"']").test(allCode)) return true;
    const re = new RegExp("(^|[^A-Za-z0-9_$.])" + n + "\\s*[:(]|\\." + n + "\\s*=[^=]|[\"']" + n + "[\"']\\s*[:\\]]|FX\\[\"" + n + "\"\\]", "m");
    return re.test(allCode);
}
// things of VITEMS a plugin defines in code (Homes: D.VITEMS "konik")
const vitemsInCode = new Set(Array.from(allCode.matchAll(/VITEMS,\s*["']([A-Za-z0-9_]+)["']/g)).map(m => m[1]));
const logicCode = Object.entries(sources).filter(([n]) => !/_Data$/.test(n)).map(([, s]) => s).join("\n");
const dataCode = Object.entries(sources).filter(([n]) => /_Data$/.test(n)).map(([, s]) => s).join("\n");
// a key named in a data list the code walks (Zasoby: D31_THINGS -> s.v[next] = 1)
function vgivenSoft(k) {
    if (new RegExp("[\"']" + k + "[\"']").test(logicCode)) return true;
    for (const m of dataCode.matchAll(/const ([A-Z0-9_]+) = \[([^\]]*)\]/g)) if (new RegExp("[\"']" + k + "[\"']").test(m[2]) && new RegExp("\\b" + m[1] + "\\b").test(logicCode)) return true;
    return false;
}
const vgiven = new Set();
for (const q of QUESTS) {
    if (q.offer && q.offer.vgives) for (const k of Object.keys(q.offer.vgives)) vgiven.add(k);
    for (const st of q.steps || []) if (st.vgives) for (const k of Object.keys(st.vgives)) vgiven.add(k);
}
for (const m of allCode.matchAll(/vgive\(\s*["']([A-Za-z0-9_]+)["']/g)) vgiven.add(m[1]);
for (const m of allCode.matchAll(/vgives:\s*\{([^}]*)\}/g)) for (const f of m[1].matchAll(/([A-Za-z0-9_]+)\s*:/g)) vgiven.add(f[1]);
for (const m of allCode.matchAll(/\.v\[\s*["']([A-Za-z0-9_]+)["']\s*\]\s*=/g)) vgiven.add(m[1]);
for (const m of allCode.matchAll(/\bv\.([A-Za-z0-9_]+)\s*=\s*\(?\s*\(?\s*(?:v\.|S\(\)\.v|\d)/g)) vgiven.add(m[1]);

// ------------------------------------------------------------------ przegląd
const problems = [];
const note = (waga, zadanie, krok, co) => problems.push({ waga, zadanie, krok, co });
const stepLabel = (q, i, st) => "krok " + i + (st.ch ? " (rozdz. " + st.ch + ")" : "") + (st.nazwa ? " " + st.nazwa : st.type ? " " + st.type : "");
// the hooks the threads' data names (Watki.watek: conditions, words, actions, talks) - each in some plugin's code (w.haki({ nazwa: ... }))
{
    const seen = new Set();
    for (const h of threadHooks) {
        const key = h.watek + "|" + h.hak;
        if (seen.has(key)) continue;
        seen.add(key);
        const n = h.hak.replace(/[^\w]/g, "\\$&");
        if (!new RegExp("(^|[^A-Za-z0-9_$.])" + n + "\\s*[:(]", "m").test(allCode)) note("blokada", h.zadanie === "-" ? h.watek : h.zadanie, "wątek " + h.watek, "hak „" + h.hak + "” z danych wątku - brak w kodzie (w.haki)");
    }
}
const FX_FIELDS = ["talk", "check", "tick", "fx", "custom", "vars", "spotFx", "rewardFx", "show", "at", "talkFx"];
const rows = [];   // the table of quests
for (const q of QUESTS) {
    const before = problems.length;
    const title = q.title || "";
    if (!title) note("kosmetyka", q.id, "-", "zadanie bez tytułu (brak tekstu zadania.<id>.title)");
    // the giver
    if (q.giver && !personKnown(q.giver)) note("blokada", q.id, "oferta", "dawca „" + q.giver + "” nie jest nikim w grze (ani mieszkańcem, ani Lordem / dziadkiem / Borgarem / bywalcem)");
    if (!q.giver && !q.autoStart && !(q.offer && q.offer.custom) && !q.kind.startsWith("W") && !["D21", "D24", "K53", "K37"].includes(q.id) && !fxExists(q.id.toLowerCase() + "Start")) {
        // (an arc or a quest another plugin starts by code - say so only when nothing in the code names it)
        if (!new RegExp("start\\(\\s*[\"']" + q.id + "[\"']|start\\(Q\\." + q.id + "\\b|TownQuests\\.start\\([^)]*" + q.id, "m").test(allCode)) note("do sprawdzenia", q.id, "start", "zadanie bez dawcy i bez oferty - kod nigdzie nie woła start(\"" + q.id + "\")");
    }
    // the offer
    const o = q.offer;
    if (o) {
        const c = o.cond || {};
        if (c.hours && (!Array.isArray(c.hours) || c.hours.length !== 2)) note("blokada", q.id, "oferta", "godziny oferty nie są parą: " + JSON.stringify(c.hours));
        if (c.day !== undefined && c.day > 112) note("uciążliwość", q.id, "oferta", "oferta dopiero od dnia " + c.day + " (po pierwszym roku)");
        for (const d of c.done || []) if (!Q[d]) note("blokada", q.id, "oferta", "warunek done: zadanie „" + d + "” nie istnieje");
        for (const f of c.flags || []) if (!flagsSet.has(f)) note(flagsSetSoft.has(f) ? "do sprawdzenia" : "blokada", q.id, "oferta", "warunek flagi „" + f + "” - " + (flagsSetSoft.has(f) ? "nazwa jest w kodzie, ale nie widać wprost, gdzie ją ustawia" : "nikt jej nie ustawia"));
        if (c.fn && !fxExists(c.fn)) note("blokada", q.id, "oferta", "warunek fn „" + c.fn + "” - brak haka w kodzie");
        if (o.custom && !fxExists(o.custom)) note("blokada", q.id, "oferta", "oferta custom „" + o.custom + "” - brak haka");
        if (c.opinion !== undefined && c.opinion > 60) note("uciążliwość", q.id, "oferta", "wymaga Opinii " + c.opinion + " (długo zbierać)");
        if (q.giver && c.hours) {
            const r = resOf(q.giver);
            if (r) { const rr = reach(r, c.hours); if (rr.fracAll === 0) note("blokada", q.id, "oferta", personName(q.giver) + " w godzinach oferty " + c.hours.join("-") + " jest niedostępny: " + rr.whys.join("; ")); else if (rr.frac === 0) note("info", q.id, "oferta", personName(q.giver) + " w godzinach oferty " + c.hours.join("-") + " tylko pod warunkiem: " + rr.conds.join(", ")); else if (rr.frac < 0.5) note("uciążliwość", q.id, "oferta", personName(q.giver) + " dostępny tylko przez " + Math.round(rr.frac * 100) + "% okna " + c.hours.join("-") + " (" + rr.whys.join("; ") + ")"); }
            else if (STORY[q.giver] && STORY[q.giver].hours) { const h = STORY[q.giver].hours, ov = [Math.max(h[0], c.hours[0]), Math.min(h[1], c.hours[1])]; if (ov[0] >= ov[1]) note("blokada", q.id, "oferta", personName(q.giver) + " przyjmuje " + h.join("-") + ", oferta w " + c.hours.join("-")); }
        }
        if (!o.custom && !o.auto && (!o.say || !o.say.length)) note("kosmetyka", q.id, "oferta", "oferta bez słów (say puste)");
        for (const op of o.options || []) { if (op.fx && !fxExists(op.fx)) note("blokada", q.id, "oferta", "opcja z hakiem „" + op.fx + "” - brak w kodzie"); if (op.cond && op.cond.fn && !fxExists(op.cond.fn)) note("blokada", q.id, "oferta", "warunek opcji „" + op.cond.fn + "” - brak haka"); }
        if (o.gives) for (const g of o.gives) if (!itemOf(g[0])) note("blokada", q.id, "oferta", "daje przedmiot " + g[0] + " - nie ma go w bazie");
    }
    if (q.autoStart && !fxExists(q.autoStart)) note("blokada", q.id, "start", "autoStart „" + q.autoStart + "” - brak haka");
    // the steps
    (q.steps || []).forEach((st, i) => {
        const lbl = stepLabel(q, i, st);
        if (!["bring", "talk", "spot", "wait", "kill", "custom", "pause"].includes(st.type)) note("blokada", q.id, lbl, "nieznany typ kroku „" + st.type + "”");
        if (!st.watek) for (const f of FX_FIELDS) if (st[f] && !fxExists(st[f])) note("blokada", q.id, lbl, f + " „" + st[f] + "” - brak haka w kodzie");   // (a thread's steps: Watki makes their handlers)
        if (st.hours && (!Array.isArray(st.hours) || st.hours.length !== 2)) note("blokada", q.id, lbl, "godziny kroku nie są parą: " + JSON.stringify(st.hours));
        if (st.dayIs !== undefined && (st.dayIs < 1 || st.dayIs > 112)) note("uciążliwość", q.id, lbl, "dzień " + st.dayIs + " poza rokiem");
        // the person
        const who = st.to ? [st.to] : (st.rozmowyKto || []);
        if (st.targets) who.push(...st.targets);
        if (st.signers) who.push(...st.signers);
        for (const key of who) {
            if (!personKnown(key)) { note("blokada", q.id, lbl, "osoba „" + key + "” nie istnieje w grze"); continue; }
            const r = resOf(key);
            if (r) {
                if (r.when && !condOkName(r.when)) note("blokada", q.id, lbl, personName(key) + ": warunek obecności „" + r.when + "” nie jest zarejestrowany");
                else if (r.when) note("info", q.id, lbl, personName(key) + " bywa tylko, gdy „" + condName(r.when) + "”" + (r.when === "market" ? " (dzień targowy co 7 dni)" : ""));
                const rr = reach(r, st.hours), win = st.hours ? st.hours.join("-") : "0-24";
                if (rr.fracAll === 0) note("blokada", q.id, lbl, personName(key) + " niedostępny w godzinach kroku " + win + ": " + rr.whys.join("; "));
                else if (rr.frac === 0) note("info", q.id, lbl, personName(key) + " w godzinach kroku " + win + " tylko pod warunkiem: " + rr.conds.join(", "));
                else if (rr.frac < 0.34) note("uciążliwość", q.id, lbl, personName(key) + " dostępny tylko przez " + Math.round(rr.frac * 100) + "% okna " + win + " (" + rr.whys.join("; ") + ")");
            } else if (STORY[key] && STORY[key].hours && st.hours) {
                const h = STORY[key].hours;
                let ov = 0; for (let x = 0; x < 24; x += 0.25) if (inHours(x, st.hours) && inHours(x, h)) ov++;
                if (!ov) note("blokada", q.id, lbl, personName(key) + " przyjmuje " + h.join("-") + ", krok w " + st.hours.join("-"));
            } else if (REGULAR[key] && REGULAR[key].hours && st.hours) {
                const h = REGULAR[key].hours; let ov = 0; for (let x = 0; x < 24; x += 0.25) if (inHours(x, st.hours) && inHours(x, h)) ov++;
                if (!ov) note("blokada", q.id, lbl, personName(key) + ": " + REGULAR[key].note + ", krok w " + st.hours.join("-"));
            }
        }
        // the things
        const needs = [].concat(st.need || [], ...(st.needAny || []), st.tools || []);
        for (const [idOrKey, n] of needs) {
            if (typeof idOrKey === "string" && idOrKey.startsWith("v:")) {
                const k = idOrKey.slice(2);
                if (!TQ.VITEMS[k] && !vitemsInCode.has(k)) note("blokada", q.id, lbl, "rzecz spoza bazy „" + k + "” nie jest w VITEMS (dziennik nie pokaże ikony ani nazwy)");
                if (!vgiven.has(k)) { if (vgivenSoft(k)) note("info", q.id, lbl, "rzecz spoza bazy „" + k + "” daje kod wtyczki (nie vgives w danych)"); else note("blokada", q.id, lbl, "rzecz spoza bazy „" + k + "” - nikt jej nie daje (brak vgives / vgive w danych i kodzie)"); }
                continue;
            }
            const it = itemOf(idOrKey);
            if (!it) { note("blokada", q.id, lbl, "przedmiot " + idOrKey + " nie istnieje w bazie"); continue; }
            const s = srcOf.get(Number(idOrKey));
            const others = s ? Array.from(s).filter(x => x !== "nagroda " + q.id) : [];
            if (!s || !s.size) note("do sprawdzenia", q.id, lbl, "przedmiot „" + it.name + "” (" + idOrKey + ") ×" + n + " - nie znalazłem źródła (receptura, zbiór, sklep, łup, nagroda)");
            else if (!others.length) { /* (handed out by this quest itself, asked back later: a chain) */ }
            else if (others.every(x => x.startsWith("nagroda ") || x.startsWith("tablica"))) note("uciążliwość", q.id, lbl, "przedmiot „" + it.name + "” ×" + n + " tylko z nagród: " + others.join(", "));
        }
        if (st.gold && st.gold > 300) note("uciążliwość", q.id, lbl, "krok wymaga " + st.gold + " G");
        for (const g of st.gives || []) if (!itemOf(g[0])) note("blokada", q.id, lbl, "daje przedmiot " + g[0] + " - nie ma go w bazie");
        if (st.reward) for (const it of st.reward.items || []) if (!itemOf(it[0])) note("blokada", q.id, lbl, "nagroda: przedmiot " + it[0] + " nie istnieje");
        // the places
        const spots = [].concat(st.spot ? [st.spot] : [], st.spots || []);
        for (const key of spots) {
            const s = TQ.SPOTS[key];
            if (!s) { note("blokada", q.id, lbl, "miejsce „" + key + "” nie jest w SPOTS"); continue; }
            const m = maps.get(s.map);
            if (!m) { note("blokada", q.id, lbl, "miejsce „" + key + "” na mapie " + s.map + ", której nie ma"); continue; }
            if (s.marker && !m.markers.has(s.marker)) { if (s.x === undefined) note("blokada", q.id, lbl, "miejsce „" + key + "”: brak znacznika „Miejsce: " + s.marker + "” na mapie " + s.map + " i brak współrzędnych zapasowych"); else note("uciążliwość", q.id, lbl, "miejsce „" + key + "”: brak znacznika „Miejsce: " + s.marker + "” na mapie " + s.map + " (" + m.name + ") - stoi na zapasowych " + s.x + "," + s.y); }
            if (!s.at && s.x !== undefined && (s.x >= m.width || s.y >= m.height)) note("blokada", q.id, lbl, "miejsce „" + key + "” poza mapą " + s.map + " (" + s.x + "," + s.y + " a mapa " + m.width + "x" + m.height + ")");
        }
        if (st.type === "spot" && !st.spot) note("blokada", q.id, lbl, "krok spot bez miejsca");
        if (st.type === "bring" && !st.to) note("blokada", q.id, lbl, "krok bring bez osoby (to)");
        if (st.type === "talk" && !st.to && !st.talk) note("blokada", q.id, lbl, "krok talk bez osoby (to) i bez haka");
        // the text
        const text = typeof st.text === "string" ? st.text : "";
        if (!text.trim() && st.type !== "pause") note("kosmetyka", q.id, lbl, "krok bez tekstu do dziennika (zadania.<id>.steps." + i + ".text)");
        if (st.choice) for (const op of st.choice.options || []) { if (op.fx && !fxExists(op.fx)) note("blokada", q.id, lbl, "wybór z hakiem „" + op.fx + "” - brak w kodzie"); if (!op.label) note("kosmetyka", q.id, lbl, "opcja wyboru bez etykiety"); }
        if (st.deadline && st.deadline.day !== undefined && st.deadline.day < 0) note("blokada", q.id, lbl, "termin ujemny");
    });
    const closesAtOffer = !!(o && (o.custom || q.repeat === "trade" || (o.options || []).some(op => op.then === "close")));
    if (!(q.steps || []).length && !closesAtOffer) note("blokada", q.id, "-", "zadanie bez kroków i bez wyjścia „close” w ofercie");
    if (q.reward) for (const it of q.reward.items || []) if (!itemOf(it[0])) note("blokada", q.id, "nagroda", "przedmiot " + it[0] + " nie istnieje");
    const mine = problems.slice(before);
    rows.push({ id: q.id, kind: q.kind, title, giver: q.giver || "-", steps: (q.steps || []).length, blokady: mine.filter(p => p.waga === "blokada").length, inne: mine.length - mine.filter(p => p.waga === "blokada").length });
}
// the chains of `done`: a quest that needs itself through others
(function cycles() {
    const seen = new Set();
    for (const q of QUESTS) {
        const stack = [q.id], path = new Set([q.id]);
        const walk = id => { const qq = Q[id]; const req = (qq && qq.offer && qq.offer.cond && qq.offer.cond.done) || []; for (const d of req) { if (path.has(d)) { const key = [...path, d].sort().join(">"); if (!seen.has(key)) { seen.add(key); note("blokada", q.id, "oferta", "pętla wymagań done: " + [...path, d].join(" -> ")); } continue; } if (Q[d]) { path.add(d); walk(d); path.delete(d); } } };
        walk(q.id);
    }
})();
for (const t of threadSteps) note("blokada", t.quest, t.krok, "krok wątku ma stać na " + t.indeks + ", a zadanie ma " + t.ma + " kroków (stare zapisy!)");

// ------------------------------------------------------------------ mieszkańcy
const resRows = [];
for (const r of RES) {
    const before = problems.length;
    if (!r.plan || !r.plan.length) { note("blokada", "mieszkaniec " + r.key, "plan", "bez planu dnia"); continue; }
    const map = r.map || TOWN;
    if (!maps.get(map)) note("blokada", "mieszkaniec " + r.key, "mapa", "mieszka na mapie " + map + ", której nie ma");
    if (r.when && !condOkName(r.when)) note("blokada", "mieszkaniec " + r.key, "when", "warunek obecności „" + r.when + "” nie jest zarejestrowany (TownLife.addCondition) - mieszkaniec zawsze obecny");
    if (r.alt && r.alt.when && !condOkName(r.alt.when)) note("uciążliwość", "mieszkaniec " + r.key, "alt", "warunek przeprowadzki „" + r.alt.when + "” nie jest zarejestrowany");
    if (r.alt && r.alt.map && !maps.get(r.alt.map)) note("blokada", "mieszkaniec " + r.key, "alt", "mapa przeprowadzki " + r.alt.map + " nie istnieje");
    const insideWhere = new Set();
    for (const p of r.plan) {
        if (p[3] && !condOkName(p[3])) note("uciążliwość", "mieszkaniec " + r.key, "plan " + p[0], "warunek wpisu planu „" + p[3] + "” nie jest zarejestrowany (wpis zawsze liczony)");
        if (p[1] === "patrol") { if (!spotKnown(r, p[2])) note("uciążliwość", "mieszkaniec " + r.key, "plan " + p[0], "trasa patrolu ma nieznane miejsce: " + JSON.stringify(p[2])); continue; }
        if (!spotKnown(r, p[2])) note("uciążliwość", "mieszkaniec " + r.key, "plan " + p[0], "miejsce „" + p[2] + "” nie istnieje na mapie " + map + " (ani w SPOTS, ani jako „Miejsce: " + p[2] + "”) - stoi w rogu mapy");
        if (p[1] === "inside") insideWhere.add(p[2]);
    }
    for (const w of insideWhere) { const ir = insideReach(r, w); if (!ir.ok && !(r.away && r.away.includes(w))) note("info", "mieszkaniec " + r.key, "inside " + w, r.name + " w środku jest nieosiągalny: " + ir.why); }
    const rr = reach(r, [0, 24]);
    resRows.push({ key: r.key, name: r.name, map, reach: Math.round(rr.frac * 100), whys: rr.whys, problems: problems.length - before });
}

// ------------------------------------------------------------------ tablica zleceń
(function board() {
    const src = sources.QuestBoard_Data || "";
    const givers = new Set(Array.from((/const GIVERS = \{([\s\S]*?)\n    \};/.exec(src) || ["", ""])[1].matchAll(/^\s+([a-z]+): \{/gm)).map(m => m[1]));
    const all = Object.values(sources).join("\n");
    for (const m of all.matchAll(/\{ id: "([a-z0-9_]+)", type: "([a-z]+)", giver: "([a-z]+)"/g)) if (!givers.has(m[3])) note("blokada", "tablica " + m[1], "giver", "zleceniodawca „" + m[3] + "” nie jest w GIVERS tablicy");
    for (const m of src.matchAll(/\{ item: (\d+)/g)) if (!itemOf(m[1])) note("blokada", "tablica", "req", "przedmiot " + m[1] + " nie istnieje");
})();

// ------------------------------------------------------------------ ekonomia: złoto z zadań (dla docs/AUDYT_PRZEJSCIA.md, rozdz. długu)
// day: od którego dnia zadanie jest w ogóle dostępne (oferta `day`, inaczej 1); gold: nagroda końcowa + największa z opcji + kroki;
// debt: złoto idące na dług (debt: true) albo odpis (debtCredit); W: wątki liczone osobno (ich złoto zależy od wyborów)
const econ = [];
for (const q of QUESTS) {
    const c = (q.offer && q.offer.cond) || {};
    let gold = (q.reward && q.reward.gold) || 0, debt = (q.reward && q.reward.debtCredit) || 0, optMax = 0, items = [];
    if (q.reward && q.reward.debt) { debt += gold; gold = 0; }
    const rwOf = rw => { if (!rw) return 0; return (rw.gold || 0) + (rw.debtCredit || 0); };
    if (q.offer) for (const op of q.offer.options || []) optMax = Math.max(optMax, rwOf(op.reward));
    for (const st of q.steps || []) { gold += (st.reward && !st.reward.debt && st.reward.gold) || 0; debt += (st.reward && st.reward.debtCredit) || 0; if (st.reward && st.reward.debt) debt += st.reward.gold || 0; let m = 0; if (st.choice) for (const op of st.choice.options || []) m = Math.max(m, rwOf(op.reward)); optMax += m; }
    for (const it of (q.reward && q.reward.items) || []) { const d = itemOf(it[0]); if (d) items.push(d.name + " ×" + it[1] + " (" + d.price * it[1] + " G)"); }
    econ.push({ id: q.id, kind: q.kind, title: q.title || "", day: c.day || 1, gold, optMax, debt, repeat: q.repeat || "", items });
}

// ------------------------------------------------------------------ wynik
const order = { blokada: 0, "do sprawdzenia": 1, uciążliwość: 2, kosmetyka: 3, info: 4 };
problems.sort((a, b) => order[a.waga] - order[b.waga] || String(a.zadanie).localeCompare(String(b.zadanie)) || String(a.krok).localeCompare(String(b.krok)));
const counts = {};
for (const p of problems) counts[p.waga] = (counts[p.waga] || 0) + 1;
const summary = { zadania: QUESTS.length, mieszkancy: RES.length, mapy: maps.size, znaczniki: markerMaps.size, problemy: counts, bledyWczytania: loadErrors };
if (!QUIET) {
    for (const p of problems) if (p.waga !== "info") console.log(p.waga.padEnd(14), String(p.zadanie).padEnd(12), String(p.krok).padEnd(34), p.co);
    console.log("");
}
console.log("Zadań: " + QUESTS.length + " (" + QUESTS.filter(q => q.kind === "K").length + " K, " + QUESTS.filter(q => q.kind === "D").length + " D, " + QUESTS.filter(q => q.kind === "W").length + " W), mieszkańców: " + RES.length + ", map: " + maps.size + ", znaczników Miejsce: " + markerMaps.size);
console.log("Problemy: " + Object.entries(counts).map(([k, v]) => k + " " + v).join(", ") + (loadErrors.length ? " | błędy wczytania: " + loadErrors.join(" | ") : ""));
fs.writeFileSync(OUT_JSON, JSON.stringify({ summary, problems, quests: rows, residents: resRows, ekonomia: econ }, null, 1));
{
    const kd = econ.filter(e => e.kind !== "W" && e.day <= 60 && !e.repeat);
    const sum = (a, f) => a.reduce((t, e) => t + f(e), 0);
    console.log("Ekonomia (zadania K/D dostępne do dnia 60, bez powtarzalnych): " + kd.length + " zadań, złoto pewne " + sum(kd, e => e.gold) + " G, najlepsze opcje +" + sum(kd, e => e.optMax) + " G, na dług / odpisy " + sum(kd, e => e.debt) + " G; do dnia 30: złoto " + sum(kd.filter(e => e.day <= 30), e => e.gold) + " G");
}
const md = [];
md.push("# Przegląd statyczny zadań (tools/audyt/przejscie.js)", "", "Stan: " + new Date().toISOString().slice(0, 16).replace("T", " ") + ". Zadań " + QUESTS.length + ", mieszkańców " + RES.length + ", map " + maps.size + ".", "",
    "Problemy: " + Object.entries(counts).map(([k, v]) => k + " " + v).join(", "), "", "| waga | zadanie | krok | co |", "|---|---|---|---|");
for (const p of problems) md.push("| " + p.waga + " | " + p.zadanie + " | " + p.krok + " | " + p.co.replace(/\|/g, "/") + " |");
md.push("", "## Zadania", "", "| id | rodzaj | tytuł | dawca | kroki | blokady | inne |", "|---|---|---|---|---|---|---|");
for (const r of rows) md.push("| " + r.id + " | " + r.kind + " | " + r.title.replace(/\|/g, "/") + " | " + r.giver + " | " + r.steps + " | " + r.blokady + " | " + r.inne + " |");
md.push("", "## Mieszkańcy (osiągalność w dobie)", "", "| klucz | imię | mapa | osiągalny % | powody niedostępności |", "|---|---|---|---|---|");
for (const r of resRows) md.push("| " + r.key + " | " + r.name + " | " + r.map + " | " + r.reach + " | " + r.whys.join("; ") + " |");
fs.writeFileSync(OUT_MD, md.join("\n") + "\n");
console.log("Zapisano " + path.relative(ROOT, OUT_JSON) + " i " + path.relative(ROOT, OUT_MD));
