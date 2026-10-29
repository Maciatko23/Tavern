// NOWE PODGRODZIE - czterech mieszkańców nowych domów Map111 (docs/podgrodzie/NOWE_PODGRODZIE.md „Nowi mieszkańcy”,
// js/plugins/TownLife_Data.js blok „NOWE PODGRODZIE”, id 2950-2953 z trzeciego zakresu TownLife; 2026-10-22).
// Sprawdza:
//   - dokument: 4 mieszkańców z numerami, imionami i domami, klucze miejsc (<budynek>_drzwi, placyk_1..6, szynk_lawy, ...)
//   - rejestr: TownLife ma trzeci zakres 2950-2959 (TawernaCore + TownLifeData.EXTRA_RANGES), obcy właściciel na nim odrzucony
//   - dane: 4 mieszkańców w TownLife.RESIDENTS z numerami, kluczami i imionami z dokumentu, mapa 111, każdy wraca na noc do swoich
//     drzwi; szynkarz i opiekunka chodzą do miasta (away: brama_zach - nie ma ich wtedy w żadnym wnętrzu)
//   - arkusze: img/characters/$Npc_<Klucz>.png (192x256) i Npc_<Klucz>_Walk8.png (576x512) są na dysku i wczytują się w grze
//   - plany: każde miejsce to klucz z dokumentu (nowe albo przeniesione stare), żadne dwie osoby Podgrodzia (starzy też) nie
//     stoją/pracują w jednym miejscu o tej samej porze; szynk do późna, garncarz rano w gliniance i na placyku, Tośka biega z Frankiem
//   - zaczepki po porach dnia (rano / dzień / wieczór + deszcz, noc) i rozmowy (morning / day / evening / night / rain) po polsku
//   - popiersia: SpeechBubbles.BUSTS[$Npc_<Klucz>:0] = <Klucz>_Bust, plik jest
//   - mapa: jeśli Map111 ma już „Miejsce:” nowych kluczy - każdy klucz planów jest na mapie; jeśli nie (stara mapa) - nowi są
//     nieobecni (ukryci, nie stoją w rogu), a resztę testu robią z miejscami zastępczymi wpisanymi tylko w stronie
//   - o 17:00 wszyscy na dworze; rozmowa z każdym daje jego kwestię i jego popiersie; o 3:00 wszyscy w domach
//   - wnętrza: jeśli mapy 201-204 są w grze - każdy ma w swoim domu „Miejsce: <klucz>_wnetrze”
// Uruchom: CDP_PORT=9582 node tests/podgrodzie_mieszkancy_test.js   (serwer: node tools/serve.js)
const fs = require("fs");
const path = require("path");
const kit = require("./lib/kit.js");
const ROOT = path.join(__dirname, "..");
const IDS = [2950, 2953];
const sel = `TownLife.RESIDENTS.filter(r => r.id >= ${IDS[0]} && r.id <= ${IDS[1]})`;

// ---------------------------------------------------------------- the document: the residents' table and the place keys
function readDoc() {
    const md = fs.readFileSync(path.join(ROOT, "docs", "podgrodzie", "NOWE_PODGRODZIE.md"), "utf8").replace(/\r\n/g, "\n");
    const part = (from) => md.split(from)[1].split("\n## ")[0];
    const keys = new Set();
    for (const line of part("## Budynki z nowymi wnętrzami").split("\n")) {
        const m = /^\|\s*([a-z0-9_]+)\s*\|/.exec(line);
        if (m && m[1] !== "klucz") keys.add(m[1] + "_drzwi");
    }
    const places = part("## Miejsca");
    const old = /Map111 \(([^)]+)\)/.exec(places);   // (the old spots, moved to new places)
    if (old) for (const k of old[1].split(/,\s*/)) if (/^[a-z0-9_]+$/.test(k.trim())) keys.add(k.trim());
    for (const m of places.matchAll(/`([a-z0-9_]+)`/g)) keys.add(m[1]);
    for (const m of places.matchAll(/`([a-z_]+)_1`\s*\.\.\.\s*`\1_(\d+)`/g)) for (let i = 1; i <= +m[2]; i++) keys.add(m[1] + "_" + i);
    const people = [];
    for (const line of part("## Nowi mieszkańcy").split("\n")) {
        const m = /^\|\s*([a-z_]+)\s*\|[^|]*\|\s*([a-z0-9_]+)\s*\|\s*`(\$Npc_\w+)`\s*\|\s*(29\d\d)\s*\|\s*([^|]+?)\s*\|\s*Map(\d+)/.exec(line);
        if (m) people.push({ key: m[1], home: m[2], sheet: m[3], id: +m[4], name: m[5], interior: +m[6] });
    }
    return { keys, people };
}
// PNG width / height from the file's header
function pngSize(file) {
    if (!fs.existsSync(file)) return null;
    const b = fs.readFileSync(file);
    return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

kit.test({ port: 9582, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const doc = readDoc();
    t.check("dokument: 4 nowych mieszkańców 2950-2953 i klucze miejsc (" + doc.keys.size + ")", doc.people.length === 4 && doc.keys.has("placyk_6") &&
        doc.keys.has("szynk_lawy") && doc.keys.has("lepianka1_drzwi") && doc.keys.has("brama_zach") && doc.keys.has("glinianka"), { people: doc.people, keys: [...doc.keys] });

    // ---------------------------------------------------------------- the registry: the third range
    const reg = await t.json(`(function(){ const T = Tawerna, tryIt = ids => { try { T.inject(111, { ids, owner: "Obcy", build: () => [] }); return "ok"; } catch (e) { return e.message; } };
        return { list: T.inject.list().filter(r => r.owner === "TownLife").map(r => r.ids + (r.active ? "+" : "")), other: tryIt([2955, 2955]), ranges: TownLifeData.EXTRA_RANGES,
            old: TownLifeData.EXTRA_RANGE }; })()`);
    t.check("rejestr: TownLife 910-949, 2900-2949 i 2950-2959 (wstrzykiwane), obcy właściciel na 2955 odrzucony",
        reg.list.includes("2950-2959+") && reg.list.includes("2900-2949+") && reg.list.includes("910-949+") && /TownLife/.test(reg.other)
        && JSON.stringify(reg.ranges.slice(0, 2)) === "[[2900,2949],[2950,2959]]" && JSON.stringify(reg.old) === "[2900,2949]", reg);

    // ---------------------------------------------------------------- the data
    const R = await t.json(`${sel}.map(r => ({ id: r.id, key: r.key, name: r.name, map: r.map, title: r.title,
        sheet: r.sheet, plan: r.plan.map(p => [p[0], p[1], p[2]]), z: r.zaczepki, talk: r.talk, speed: r.speed, away: r.away || [] }))`);
    const byKey = Object.fromEntries(R.map(r => [r.key, r]));
    const bad = doc.people.filter(p => { const r = byKey[p.key]; return !r || r.id !== p.id || r.name !== p.name || r.map !== 111 || r.sheet !== p.sheet; });
    t.check("4 mieszkańców w TownLife z numerami, kluczami, imionami i arkuszami z dokumentu, na mapie 111", R.length === 4 && !bad.length, { bad, R: R.map(r => [r.id, r.key, r.name]) });
    const homes = doc.people.filter(p => !byKey[p.key] || !byKey[p.key].plan.some(e => e[1] === "inside" && e[2] === p.home + "_drzwi"));
    t.check("każdy wraca na noc do swoich drzwi (inside <dom>_drzwi)", !homes.length, homes);
    const away = await t.json(`(function(){ const o = {}; for (const r of ${sel}) { const e = TownLife.entryAt(r, 15); o[r.key] = [e.act, e.where, (r.away || []).includes(e.where)]; } return o; })()`);
    t.check("o 15:00 szynkarz poszedł do miasta po stary chleb na kwas (inside brama_zach, away - nie stoi w żadnym wnętrzu)",
        away.szynkarz && away.szynkarz[0] === "inside" && away.szynkarz[1] === "brama_zach" && away.szynkarz[2], away);

    // ---------------------------------------------------------------- the sheets
    const sizes = R.map(r => ({ key: r.key, sheet: pngSize(path.join(ROOT, "img", "characters", r.sheet + ".png")),
        walk8: pngSize(path.join(ROOT, "img", "characters", r.sheet.replace("$", "") + "_Walk8.png")) }));
    t.check("arkusze $Npc_<Klucz>.png 192x256 i Npc_<Klucz>_Walk8.png 576x512 na dysku",
        sizes.every(s => s.sheet && s.sheet.join() === "192,256" && s.walk8 && s.walk8.join() === "576,512"), sizes);
    await t.eval(`(function(){ window.__sheets = ${JSON.stringify(R.map(r => r.sheet))}.map(n => ImageManager.loadCharacter(n)); return 0; })()`);
    await t.until("window.__sheets.every(b => b.isReady())", 20);
    const loaded = await t.json("window.__sheets.map(b => [b.width, b.height, b.isError ? b.isError() : false])");
    t.check("...i wczytują się w grze (ImageManager, bez błędu)", loaded.every(l => l[0] === 192 && l[1] === 256 && !l[2]), loaded);

    // ---------------------------------------------------------------- the plans
    const ACTS = ["inside", "stand", "work", "wander", "patrol", "bell"];
    const used = new Set(), wrong = [];
    for (const r of R) for (const [h, act, where] of r.plan) {
        used.add(where);
        if (!doc.keys.has(where) || !ACTS.includes(act) || !(h >= 0 && h < 24)) wrong.push([r.key, h, act, where]);
    }
    t.check("plany: każde miejsce to klucz z NOWE_PODGRODZIE.md, czynności TownLife (" + used.size + " miejsc)", !wrong.length, { wrong, used: [...used] });
    // (with all of Podgrodzie: the old eight too)
    const ALL = await t.json(`TownLife.RESIDENTS.filter(r => r.map === 111).map(r => ({ key: r.key, plan: r.plan.map(p => [p[0], p[1], p[2]]) }))`);
    const entry = (r, h) => { let e = null; for (const p of r.plan) if (p[0] <= h) e = p; return e || r.plan[r.plan.length - 1]; };
    const clash = [];
    for (let h = 0; h < 24; h += 0.25) {
        const at = {};
        for (const r of ALL) { const e = entry(r, h); if (e[1] === "stand" || e[1] === "work") { if (at[e[2]]) clash.push([h, e[2], at[e[2]], r.key]); at[e[2]] = r.key; } }
    }
    t.check("żadne dwie osoby Podgrodzia (" + ALL.length + ", starzy też) nie stoją / nie pracują w jednym miejscu o tej samej porze", ALL.length === 12 && !clash.length, { n: ALL.length, clash });
    const franek = ALL.find(r => r.key === "franek");
    let together = 0;
    for (let h = 6; h < 20; h += 0.25) { const a = entry(byKey.dziecko, h), b = entry(franek, h); if (a[1] === "wander" && b[1] === "wander" && a[2] === b[2]) together += 0.25; }
    const szynk = entry(byKey.szynkarz, 22.5), clay = entry(byKey.garncarz, 6), sells = entry(byKey.garncarz, 14), soup = [7, 10, 17].map(h => entry(byKey.opiekunka, h)[2]);
    t.check(`dzień: Tośka biega z Frankiem (${together} h razem), szynk do późna (22:30 przy ławach), garncarz o świcie w gliniance i po południu na placyku, kocioł przytułku rano i wieczorem`,
        together >= 4 && szynk[2] === "szynk_lawy" && clay[2] === "glinianka" && /^placyk_/.test(sells[2]) && soup[1] === "przytulek_kociol" && soup[2] === "przytulek_kociol",
        { together, szynk, clay, sells, soup });

    // ---------------------------------------------------------------- the barks and the talk
    const lines = R.map(r => ({ key: r.key, z: ["rano", "dzien", "wieczor", "deszcz"].every(k => r.z && r.z[k] && r.z[k].length) && Array.isArray(r.z.noc),
        talk: ["morning", "day", "evening", "night", "rain"].every(k => r.talk[k] && r.talk[k].length),
        n: Object.values(r.talk).reduce((a, l) => a + l.length, 0), b: Object.values(r.z).reduce((a, l) => a + l.length, 0),
        pl: /[ąćęłńóśźż]/i.test(JSON.stringify(r.talk)) }));
    t.check("zaczepki rano / dzień / wieczór / deszcz (+ noc) i rozmowy na każdą porę i deszcz, po polsku, 6-10 kwestii i 13+ zaczepek",
        lines.every(l => l.z && l.talk && l.n >= 6 && l.n <= 10 && l.b >= 13 && l.pl), lines);
    const pory = await t.json(`(function(){ const out = {}, h0 = $gameSystem.dayNightHour();
        for (const r of ${sel}) {
            $gameSystem.setDayNightHour(8); const a = r.barks.wander; $gameSystem.setDayNightHour(14); const b = r.barks.work; $gameSystem.setDayNightHour(19); const c = r.barks.stand;
            out[r.key] = [a === r.zaczepki.rano, b === r.zaczepki.dzien, c === r.zaczepki.wieczor, r.barks.rain === r.zaczepki.deszcz, r.barks.night === r.zaczepki.noc]; }
        $gameSystem.setDayNightHour(h0); return out; })()`);
    t.check("zaczepki zależą od pory dnia (8:00 ranne, 14:00 dzienne, 19:00 wieczorne), deszcz i noc osobno", Object.values(pory).every(v => v.every(Boolean)), pory);

    // ---------------------------------------------------------------- the busts
    const busts = await t.json(`${JSON.stringify(R.map(r => r.sheet))}.map(s => ({ s, b: SpeechBubbles.BUSTS[s + ":0"] || null, has: SpeechBubbles.hasBust(SpeechBubbles.BUSTS[s + ":0"]) }))`);
    const bfiles = await t.json(`Promise.all(${JSON.stringify(busts.map(b => b.b))}.map(n => n ? fetch("img/pictures/" + n + ".png", { method: "HEAD", cache: "no-store" }).then(r => r.ok).catch(() => false) : false))`);
    t.check("popiersia: SpeechBubbles.BUSTS[$Npc_<Klucz>:0] = <Klucz>_Bust, plik jest", busts.every((b, i) => b.b === b.s.slice(5) + "_Bust" && b.has && bfiles[i]), { busts, bfiles });

    // ---------------------------------------------------------------- Podgrodzie: the new map or the old one
    await t.newGame({ map: 111, x: 20, y: 18, dir: 2, hour: 17, quiet: true, minimap: false, timeout: 180 });
    await t.until(t.onMap(111), 120);
    await t.setHour(17);
    const onMap = await t.json(`(function(){ const keys = ${JSON.stringify([...used])}; return { has: keys.filter(k => !!TownLife.spot(k)), miss: keys.filter(k => !TownLife.spot(k)) }; })()`);
    const installed = onMap.has.some(k => /^(szynk|przytulek|garncarnia|lepianka1)_drzwi$/.test(k));
    if (installed) {
        t.check("nowa mapa: każdy klucz planów ma na Map111 „Miejsce:”", !onMap.miss.length, onMap);
    } else {
        console.log("NOTE nowa Map111 jeszcze nie zainstalowana (brak „Miejsce:” drzwi nowych domów): sprawdzam nieobecność i miejsca zastępcze");
        const gone = await t.json(`(function(){ const out = {}; for (const r of ${sel}) { const e = TownLife.eventOf(r.key);
            out[r.key] = e ? [TownLife.absent(r.key), e._town.hidden, e.isTransparent(), e.isThrough()] : null; } return out; })()`);
        t.check("stara mapa: nowi mieszkańcy są nieobecni (ukryci, przezroczyści, przechodni) - nie stoją w rogu mapy", Object.values(gone).every(v => v && v.every(Boolean)), gone);
        // stand-in places, only in the page (the keys the old map has keep its own "Miejsce:"): free cells round the hero; then the map once more
        await t.eval(`(function(){ const keys = ${JSON.stringify(onMap.miss)}, D = window.TownLifeData, px = $gamePlayer.x, py = $gamePlayer.y, cells = [];
            for (let r = 2; r < 16 && cells.length < keys.length; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || cells.length >= keys.length) continue;
                const x = px + dx, y = py + dy;
                if ((dx + dy) % 2 || !$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f) || $gameMap.eventsXy(x, y).length) continue;
                cells.push([x, y, 2]); }
            D.SPOTS_BY_MAP[111] = D.SPOTS_BY_MAP[111] || {};
            keys.forEach((k, i) => { D.SPOTS_BY_MAP[111][k] = cells[i % cells.length]; }); window.__standIn = keys.length; return 0; })()`);
        // (the same map once more - a reload, not a new game: its events and spots set up again)
        await t.eval("(function(){ $gamePlayer.reserveTransfer(111, 20, 18, 2, 0); $gamePlayer.requestMapReload(); return 0; })()");
        await t.until(t.onMap(111), 180);
        await t.frames(20);
        await t.calm();
        await t.setHour(17);
    }

    // ---------------------------------------------------------------- out at 17:00 (everyone is out then), the talk, the busts in it
    await t.eval("TownLife.placeAll(); 0");
    await t.frames(20);
    const out17 = await t.json(`(function(){ const out = {}; for (const r of ${sel}) { const e = TownLife.eventOf(r.key);
        out[r.key] = e ? { id: e.eventId(), hidden: !!e._town.hidden, act: TownLife.entryAt(r, 17).act, sheet: e.characterName(), at: [e.x, e.y] } : null; } return out; })()`);
    t.check("o 17:00 wszyscy na dworze (szynk, kocioł, piec, zabawa), własne arkusze, zdarzenia 2950-2953",
        Object.entries(out17).every(([k, v]) => v && !v.hidden && v.sheet === byKey[k].sheet && v.id === byKey[k].id) && Object.keys(out17).length === 4, out17);
    for (const r of R) {
        if (!out17[r.key]) { t.check(`rozmowa: ${r.name} - brak zdarzenia na mapie`, false); continue; }
        const talk = await t.talkTo(`TownLife.eventOf(${JSON.stringify(r.key)})`, [], { secs: 20 });
        const mine = Object.values(r.talk).flat().map(l => l.slice(0, 18));
        const bust = await t.eval(`SpeechBubbles.bustOf(TownLife.eventOf(${JSON.stringify(r.key)}))`);
        t.check(`rozmowa: ${r.name} odpowiada swoją kwestią, popiersie ${bust}`, talk.done && mine.some(s => talk.text.replace(/\s+/g, " ").includes(s.replace(/\s+/g, " ").slice(0, 12))) &&
            bust === r.sheet.slice(5) + "_Bust", { text: talk.text.slice(0, 160), bust });
        await t.frames(10);
    }
    await t.setHour(3);
    await t.frames(20);
    const night = await t.json(`(function(){ const out = {}; for (const r of ${sel}) { const e = TownLife.eventOf(r.key);
        out[r.key] = [e._town.hidden, e.isThrough(), e.isTransparent()]; } return out; })()`);
    t.check("o 3:00 wszyscy w domach (ukryci, przechodni)", Object.values(night).every(v => v.every(Boolean)), night);

    // ---------------------------------------------------------------- the interiors
    const INTERIOR = Object.fromEntries(doc.people.map(p => [p.key, p.interior]));
    const maps = await t.json(`${JSON.stringify([...new Set(Object.values(INTERIOR))])}.filter(id => !!$dataMapInfos[id])`);
    if (maps.length) {
        const spots = await t.json(`Promise.all(${JSON.stringify(Object.entries(INTERIOR))}.map(([k, id]) => fetch("data/Map" + String(id).padStart(3, "0") + ".json", { cache: "no-store" })
            .then(r => r.ok ? r.json() : null).then(d => [k, id, !!(d && d.events.some(e => e && new RegExp("^Miejsce:\\\\s*" + k + "_wnetrze\\\\s*$", "i").test(e.name)))]).catch(() => [k, id, false])))`);
        t.check("wnętrza: każdy ma w swoim domu „Miejsce: <klucz>_wnetrze”", spots.every(s => s[2]), spots);
    } else console.log("NOTE wnętrza nowych domów Podgrodzia (Map201-204) jeszcze nie zainstalowane - „Miejsce: <klucz>_wnetrze” do sprawdzenia po instalacji");
});
