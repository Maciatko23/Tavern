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
