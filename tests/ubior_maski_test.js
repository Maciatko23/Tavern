// Maski wszystkich arkuszy bohatera - kontrola jakości (js/plugins/Ubior.js, tools/ubior/maski.py). Nowa gra, Ubior.js włożony do
// strony (nie ma go w js/plugins.js), kolejno trzy stroje: A czerwony kaftan + łapcie + kapelusz, B lniana koszula + łapcie +
// kapelusz, C niebieskie spodnie + skórzany pas + szare rękawice (części, których A i B nie ruszają). Każdy arkusz (27) przebrany
// w grze i wyjęty (canvas) do tests/ubior_maski/shots/, do tego: czas składania, klatki z kapeluszem schowanym / źle siedzącym
// (Ubior.problems), błędy w konsoli. Na końcu tools/ubior/przeglad_masek.py składa docs/ekwipunek/maski/<arkusz>.png
// (oryginał / maska / A / B / C) i docs/ekwipunek/maski/PRZEGLAD.md.
//   node tests/ubior_maski_test.js          (port CDP 9575)
"use strict";
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "ubior_maski");
const SHOTS = path.join(OUT, "shots");
fs.mkdirSync(SHOTS, { recursive: true });
const NONE = { glowa: "", tors: "", nogi: "", stopy: "", pas: "", rece: "", plecy: "" };
const OUTFITS = [
    { key: "A", label: "czerwony kaftan + łapcie + kapelusz", o: Object.assign({}, NONE, { glowa: "kapelusz_slomkowy", tors: "kaftan_czerwony", stopy: "lapcie" }) },
    { key: "B", label: "lniana koszula + łapcie + kapelusz", o: Object.assign({}, NONE, { glowa: "kapelusz_slomkowy", tors: "koszula_lniana_biala", stopy: "lapcie" }) },
    { key: "C", label: "niebieskie spodnie + skórzany pas + szare rękawice", o: Object.assign({}, NONE, { nogi: "spodnie_plocienne_niebieskie", pas: "pas_skorzany_braz", rece: "rekawice_szare" }) }
];

kit.test({ port: 9575, plugins: ["Ubior"], evalTimeout: 90000 }, async t => {
    t.check("Ubior.js w stronie", ["injected", "registered"].includes(t.plugins.Ubior), t.plugins);
    const ok = await t.newGame({ hour: 10, quiet: true, minimap: false });
    t.check("nowa gra", ok);
    if (!ok) return;
    const sheets = await t.json("Object.keys(Ubior.SHEETS)");
    t.check("Ubior zna wszystkie arkusze bohatera (27)", sheets.length === 27, sheets.length);
    t.clearErrors();
    const meta = { outfits: OUTFITS.map(o => ({ key: o.key, label: o.label })), sheets: {}, problems: {}, stats: [] };
    const before = await t.eval("Ubior.stats().length");
    let allDressed = true;
    for (const of of OUTFITS) {
        await t.eval(`Ubior.set(${JSON.stringify(of.o)}); 0`);
        for (const name of sheets) {
            const n = JSON.stringify(name);
            const ready = await t.until(`(function(){ const b = Ubior.sheet(${n}); return !!(b && b._ubiorDressed && b.isReady() && Ubior.liveKey(${n}) === Ubior.key()); })()`, 20, 100);
            if (!ready) { allDressed = false; console.log("NOTE not dressed:", of.key, name); continue; }
            const url = await t.eval(`Ubior.sheet(${n}).canvas.toDataURL("image/png")`);
            const file = `${of.key}_${name}.png`;
            fs.writeFileSync(path.join(SHOTS, file), Buffer.from(url.split(",")[1], "base64"));
            (meta.sheets[name] = meta.sheets[name] || {})[of.key] = file;
            if (of.key === "A") meta.problems[name] = await t.json(`Ubior.problems(${n})`);
        }
    }
    t.check("każdy arkusz przebrany w każdym stroju", allDressed);
    // the plain sheets too (the original for the review): straight from the files
    meta.stats = (await t.json("Ubior.stats()")).slice(before);
    const per = {};
    for (const s of meta.stats) (per[s.sheet] = per[s.sheet] || []).push(s.ms);
    meta.ms = {};
    for (const [name, v] of Object.entries(per)) meta.ms[name] = { n: v.length, min: Math.min(...v), max: Math.max(...v), avg: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) };
    const worst = Math.max(...meta.stats.map(s => s.ms));
    console.log("składanie: " + meta.stats.length + " arkuszy, najdłużej " + worst.toFixed(1) + " ms");
    t.check("składanie: każdy arkusz poniżej 60 ms", worst < 60, worst);
    let off = 0, bad = 0;
    for (const [name, p] of Object.entries(meta.problems)) {
        if (!p) continue;
        const b = p.list.filter(x => !x.note), o = p.list.filter(x => x.off);
        off += o.length; bad += b.length;
        console.log(`${name}: kapelusz schowany w ${o.length} klatkach, problemy ${b.length}` + (b.length ? ": " + b.slice(0, 6).map(x => "k" + x.c + "w" + x.r + " " + x.what).join("; ") : ""));
    }
    console.log("razem: kapelusz schowany w " + off + " klatkach, problemów " + bad);
    fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 1));
    try {
        const log = execFileSync(process.env.PYTHON || "python", [path.join(__dirname, "..", "tools", "ubior", "przeglad_masek.py"), OUT], { encoding: "utf8" });
        console.log(log.trim().split("\n").slice(-4).join("\n"));
        t.check("przegląd masek złożony (docs/ekwipunek/maski)", /PRZEGLAD\.md/.test(log));
    } catch (e) {
        t.check("przegląd masek złożony (docs/ekwipunek/maski)", false, String(e.message).slice(0, 300));
    }
});
