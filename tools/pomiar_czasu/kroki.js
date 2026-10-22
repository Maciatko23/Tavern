// Kroki zadań z danych (TownQuests_Data + paczki miejsc): ile kroków, ile z oknem godzin, ile czeka na dni/datę - tylko czyta.
"use strict";
const { loadPlugins } = require("../../tests/lib/sandbox.js");
const w = loadPlugins(["TawernaCore", "TownQuests_Data", "Kantor_Data", "Dwor_Data", "Pustelnia_Data", "Kruk_Data", "Latarnia_Data", "Garnizon_Data", "Wrak_Data", "Cysterna_Data"]);
const all = [];
const add = q => { if (q && q.id && q.kind && !all.some(x => x.id === q.id)) all.push(q); };
for (const q of (w.TownQuestsData && w.TownQuestsData.QUESTS) || []) add(q);
for (const k of ["KantorData", "DworData", "PustelniaData", "KrukData", "LatarniaData", "GarnizonData", "WrakData", "CysternaData"]) {
    const d = w[k]; if (!d) continue;
    for (const v of Object.values(d)) { if (Array.isArray(v)) v.forEach(add); else if (v && v.id && v.kind) add(v); else if (v && typeof v === "object") for (const x of Object.values(v)) if (x && x.id && x.kind) add(x); }
}
const rows = [];
for (const q of all) {
    const st = q.steps || [];
    let hours = 0, days = 0, kinds = {};
    for (const s of st) {
        kinds[s.type] = (kinds[s.type] || 0) + 1;
        if (s.hours || (s.when && s.when.hours)) hours++;
        const wn = s.when || {};
        if (s.dayRel || s.after || s.dayIs || wn.dayRel || wn.after || wn.dayIs || s.type === "wait" || s.days) days++;
    }
    const ch = new Set(st.map(s => s.ch).filter(Boolean)).size;
    rows.push({ id: q.id, kind: q.kind, steps: st.length, ch, hours, days, kinds: JSON.stringify(kinds), repeat: q.repeat || "" });
}
rows.sort((a, b) => a.kind.localeCompare(b.kind) || parseInt(a.id.slice(1)) - parseInt(b.id.slice(1)));
for (const r of rows) console.log([r.id, r.steps, "rozdz:" + r.ch, "godz:" + r.hours, "dni:" + r.days, r.repeat, r.kinds].join("\t"));
const by = k => rows.filter(r => r.kind === k);
for (const k of ["K", "D", "W"]) { const x = by(k); console.log(k, x.length, "śr. kroków", (x.reduce((a, r) => a + r.steps, 0) / x.length).toFixed(1), "z godz.", (x.reduce((a, r) => a + r.hours, 0) / x.length).toFixed(1), "z dniami", (x.reduce((a, r) => a + r.days, 0) / x.length).toFixed(1)); }
require("fs").writeFileSync(require("path").join(__dirname, "kroki.json"), JSON.stringify(rows, null, 1));
