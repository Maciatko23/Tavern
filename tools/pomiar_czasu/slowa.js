// Liczy słowa tekstu, który gracz czyta (napisy w danych wtyczek i w zdarzeniach map) - tylko czyta pliki.
// node tools/pomiar_czasu/slowa.js  ->  tabela na wyjściu + tools/pomiar_czasu/slowa.json
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const PL = path.join(ROOT, "js", "plugins");

// prosty tokenizer JS: napisy ("...", '...', `...`), bez komentarzy; zwraca [{ s, pos }]
function strings(src) {
    const out = []; let i = 0, n = src.length, lastSig = "";
    while (i < n) {
        const c = src[i], d = src[i + 1];
        if (c === "/" && d === "/") { const e = src.indexOf("\n", i); i = e < 0 ? n : e; continue; }
        if (c === "/" && d === "*") { const e = src.indexOf("*/", i + 2); i = e < 0 ? n : e + 2; continue; }
        if (c === '"' || c === "'" || c === "`") {
            let j = i + 1, s = "";
            while (j < n && src[j] !== c) {
                if (src[j] === "\\") { const nx = src[j + 1]; s += nx === "n" ? "\n" : nx; j += 2; continue; }
                if (c === "`" && src[j] === "$" && src[j + 1] === "{") {   // ${ ... } - pomiń wyrażenie (z zagnieżdżeniem)
                    let depth = 1; j += 2;
                    while (j < n && depth) { if (src[j] === "{") depth++; else if (src[j] === "}") depth--; j++; }
                    s += " X "; continue;
                }
                s += src[j]; j++;
            }
            out.push({ s, pos: i });
            i = j + 1; lastSig = "s"; continue;
        }
        if (c === "/" && /[(,=:\[!&|?{};+\-*%<>~^]$/.test(lastSig || "(")) {   // wyrażenie regularne
            let j = i + 1, inCls = false;
            while (j < n && (inCls || src[j] !== "/")) { if (src[j] === "\\") j++; else if (src[j] === "[") inCls = true; else if (src[j] === "]") inCls = false; else if (src[j] === "\n") break; j++; }
            i = j + 1; lastSig = "r"; continue;
        }
        if (!/\s/.test(c)) lastSig = c;
        i++;
    }
    return out;
}
const LETTER = /[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ]/;
const POLISH = /[ąćęłńóśźż]|\b(się|nie|jest|to|na|w|z|do|że|co|jak|ale|już|tu|tam|go|mi|ci|ja|ty|on|ona|i|a|o|po|od|za)\b/i;
function wordsOf(s) { return s.split(/\s+/).filter(w => LETTER.test(w)).length; }
// napis do czytania: >= 3 słowa i po polsku (bez ścieżek, kluczy, kodu)
function isProse(s) {
    if (/^[\w.\/\-]+$/.test(s)) return false;
    if (/\b(function|return|const|let|var)\b|=>|\$game|\.prototype/.test(s)) return false;
    const w = wordsOf(s);
    return w >= 3 && POLISH.test(s);
}
function countFile(file, splitter) {
    const src = fs.readFileSync(file, "utf8"), list = strings(src).filter(x => isProse(x.s));
    const res = { words: 0, strings: list.length, parts: {} };
    for (const x of list) {
        const w = wordsOf(x.s); res.words += w;
        if (splitter) { const k = splitter(x.pos); res.parts[k] = res.parts[k] || { words: 0, strings: 0 }; res.parts[k].words += w; res.parts[k].strings++; }
    }
    return res;
}
// podział pliku danych na zadania: od `id: "K1", kind:` do następnego
function questSplitter(file) {
    const src = fs.readFileSync(file, "utf8"), marks = [];
    const re = /id:\s*"([KDW]\d+)",\s*kind:/g; let m;
    while ((m = re.exec(src))) marks.push([m.index, m[1]]);
    return pos => { let k = "(wspólne)"; for (const [p, id] of marks) { if (p <= pos) k = id; else break; } return k; };
}

const result = { files: {}, maps: {}, quests: {} };
const files = fs.readdirSync(PL).filter(f => f.endsWith(".js"));
for (const f of files) {
    const full = path.join(PL, f);
    const isQ = /TownQuests_Data|Kantor_Data|Dwor_Data|Pustelnia_Data|Kruk_Data|Latarnia_Data|Garnizon_Data|Wrak_Data|Cysterna_Data|Rywal_Data|Act3_Data|Homes|Przystan|CzerwonaWoda|Kasztelan|TavernLife_Regulars|Wyspa_Data/.test(f);
    result.files[f] = countFile(full, isQ ? questSplitter(full) : null);
}
// zdarzenia map: 401 (tekst), 102 (wybory), 405 (przewijany tekst)
const infos = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "MapInfos.json"), "utf8"));
for (const inf of infos) {
    if (!inf) continue;
    const f = path.join(ROOT, "data", "Map" + String(inf.id).padStart(3, "0") + ".json");
    if (!fs.existsSync(f)) continue;
    const m = JSON.parse(fs.readFileSync(f, "utf8")); let w = 0, msgs = 0;
    for (const e of m.events) { if (!e) continue; for (const pg of e.pages) for (const c of pg.list) {
        if (c.code === 401 || c.code === 405) w += wordsOf(String(c.parameters[0]).replace(/\[A-Za-z]+\[[^\]]*\]/g, " "));
        if (c.code === 101) msgs++;
        if (c.code === 102) w += c.parameters[0].reduce((a, s) => a + wordsOf(s), 0);
    } }
    if (w) result.maps[inf.id + " " + inf.name] = { words: w, msgs };
}
// kody zadań we wszystkich danych
for (const f of files) {
    const src = fs.readFileSync(path.join(PL, f), "utf8"), re = /id:\s*"([KDW]\d+)",\s*kind:\s*"([KDW])"/g; let m;
    while ((m = re.exec(src))) result.quests[m[1]] = f;
}
fs.writeFileSync(path.join(__dirname, "slowa.json"), JSON.stringify(result, null, 1));
const rows = Object.entries(result.files).sort((a, b) => b[1].words - a[1].words);
let tot = 0; for (const [f, r] of rows) { tot += r.words; if (r.words > 300) console.log(String(r.words).padStart(7), String(r.strings).padStart(6), f); }
console.log("RAZEM wtyczki:", tot);
let mt = 0; for (const [k, r] of Object.entries(result.maps)) mt += r.words;
console.log("RAZEM mapy:", mt, Object.entries(result.maps).sort((a, b) => b[1].words - a[1].words).slice(0, 12).map(([k, r]) => k + ":" + r.words).join(" | "));
const q = Object.keys(result.quests).sort();
console.log("zadania:", q.length, "K", q.filter(x => x[0] === "K").length, "D", q.filter(x => x[0] === "D").length, "W", q.filter(x => x[0] === "W").length);
console.log(q.join(" "));
