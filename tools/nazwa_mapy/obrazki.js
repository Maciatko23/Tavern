// Gotowe obrazki nazw map (gracz 2026-11-06: „po prostu miej gotowe obrazki dostosowane już”, „chodzi priorytetowo o wydajność
// zawsze”): każda nazwa z podpisem, kreską i zdaniem jako jeden PNG w img/nazwy_map/<klucz>.png + spis.json (gdzie stoi na ekranie i co
// HUD musi o nim wiedzieć). Gra je tylko wczytuje; rysuje sama jedynie to, czego tu nie ma. Uruchomić po każdej zmianie nazw, podpisów
// i zdań (js/teksty/miejsca.txt, nazwy map w edytorze) albo wyglądu (CleanHUD PIC.ver) - tests/nazwy_map_test.js powie, czego brak.
//   CDP_PORT=9466 node tools/nazwa_mapy/obrazki.js        (potem: node tests/run.js nazwy_map_test)
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.resolve(__dirname, "..", "..", "img", "nazwy_map");
kit.test({ port: Number(process.env.CDP_PORT) || 9466, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 240000 }, async t => {
    await t.newGame({ map: 19, x: 4, y: 6, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    const ver = await t.json("CleanHUD.nameArt && CleanHUD.nameArt.ver");
    t.check("wtyczka ma gotowe obrazki (CleanHUD.nameArt)", !!ver, ver);
    if (!ver) return;
    await t.eval(require("./warianty.js"));
    const ids = await t.json("__nazwy.ids()"), floors = await t.json("__nazwy.floors()");
    fs.mkdirSync(OUT, { recursive: true });
    const spis = {}, skad = {};
    let bytes = 0;
    const save = list => { for (const r of list) { const buf = Buffer.from(r.png, "base64"); fs.writeFileSync(path.join(OUT, r.key + ".png"), buf); bytes += buf.length; spis[r.key] = r.meta; skad[r.key] = r.what; } };
    for (const id of ids) save(await t.json(`__nazwy.map(${id}).then(vs => vs.map(v => __nazwy.draw(v)))`));
    for (const f of floors) save(await t.json(`__nazwy.draw ? __nazwy.floor(${f}).map(v => __nazwy.draw(v)) : []`));
    // the old pictures (a changed text, a map gone) go
    let gone = 0;
    for (const f of fs.readdirSync(OUT)) if (/^[0-9a-f]{16}\.png$/.test(f) && !spis[f.slice(0, 16)]) { fs.unlinkSync(path.join(OUT, f)); gone++; }
    const keys = Object.keys(spis).sort(), obrazki = {}, mapy = {};
    for (const k of keys) { obrazki[k] = spis[k]; mapy[k] = skad[k]; }
    fs.writeFileSync(path.join(OUT, "spis.json"), JSON.stringify({ wersja: ver, obrazki, skad: mapy }) + "\n");
    console.log("obrazków: " + keys.length + " (" + (bytes / 1048576).toFixed(1) + " MB), map: " + ids.length + ", pięter: " + floors.length + ", usuniętych starych: " + gone + " -> " + OUT);
    // the same pixels, smaller files (PIL)
    const r = require("child_process").spawnSync("python", [path.join(__dirname, "kompresuj.py")], { encoding: "utf8" });
    console.log((r.stdout || "").trim() || "kompresja: " + (r.stderr || r.error || "").toString().trim());
    t.check("są obrazki", keys.length > 100, keys.length);
});
