// NOWE MIASTO - ośmiu mieszkańców nowych domów Map008 (docs/miasteczko/NOWE_MIASTO.md „Nowi mieszkańcy”, js/plugins/TownLife_Data.js
// blok „THE NEW TOWN”, id 2940-2947; 2026-10-22).
// Sprawdza:
//   - dane: 8 mieszkańców w TownLife.RESIDENTS z numerami, imionami i domami z dokumentu (woźnica ma klucz „kolodziej” - „woznica” to
//     Wojciech), mapa 8, każdy wraca na noc do swoich drzwi („inside <dom>_drzwi”), dzieci w domu matki
//   - arkusze: img/characters/$Npc_<Klucz>.png (192x256) i Npc_<Klucz>_Walk8.png (576x512) są na dysku i wczytują się w grze
//   - plany: każde miejsce planu to klucz z dokumentu (<budynek>_drzwi, plac_1..12, plac_studnia, plac_tablica, stragan_1..6, skwer,
//     brama_pd, stajnia_woz, straznica_warta, kaplica_lawka, ciesla_warsztat), żadne dwie osoby nie stoją/pracują w jednym miejscu
//     o tej samej porze, często przez plac
//   - zaczepki po porach dnia (rano / dzień / wieczór + deszcz, noc) i rozmowy (morning / day / evening / night / rain) po polsku
//   - popiersia: SpeechBubbles.BUSTS[$Npc_<Klucz>:0] = <Klucz>_Bust, plik jest
//   - mapa: jeśli Map008 ma już „Miejsce:” nowych kluczy - każdy klucz planów jest na mapie; jeśli nie (stara mapa) - mieszkańcy są
//     nieobecni (ukryci, nie stoją w rogu mapy), a resztę testu robią z miejscami zastępczymi wpisanymi tylko w stronie
//   - o 11:00 wszyscy na mieście; rozmowa z każdym nie rzuca błędu i daje jego kwestię, popiersie w rozmowie jego; o 23:30 wszyscy w domach
//   - wnętrza: jeśli mapy 181-189 są w grze - każdy ma w swoim domu „Miejsce: <klucz>_wnetrze”
// Uruchom: CDP_PORT=9572 node tests/miasto_mieszkancy_test.js   (serwer: node tools/serve.js)
const fs = require("fs");
const path = require("path");
const kit = require("./lib/kit.js");
const ROOT = path.join(__dirname, "..");

// ---------------------------------------------------------------- the document: the residents' table and the place keys
const KEY_OF = { woznica: "kolodziej" };   // (the doc's key -> the TownLife key: "woznica" is Wojciech's since 2026-10-05)
function readDoc() {
    const md = fs.readFileSync(path.join(ROOT, "docs", "miasteczko", "NOWE_MIASTO.md"), "utf8").replace(/\r\n/g, "\n");
    const part = (from) => md.split(from)[1].split("\n## ")[0];
    const keys = new Set();
    for (const line of part("## Nowe budynki").split("\n")) {
        const m = /^\|\s*([a-z0-9_]+)\s*\|/.exec(line);
        if (m && m[1] !== "klucz") keys.add(m[1] + "_drzwi");
    }
    const places = part("## Miejsca");
    for (const m of places.matchAll(/`([a-z0-9_]+)`/g)) keys.add(m[1]);
    for (const m of places.matchAll(/`([a-z_]+)_1`\s*\.\.\.\s*`\1_(\d+)`/g)) for (let i = 1; i <= +m[2]; i++) keys.add(m[1] + "_" + i);
    const people = [];
    for (const line of part("## Nowi mieszkańcy").split("\n")) {
        const m = /^\|\s*(29\d\d)\s*\|\s*([a-z_]+)[^|]*\|\s*([^|]+?)\s*\|[^|]*\|\s*([a-z0-9_]+)\s*\|/.exec(line);
        if (m) people.push({ id: +m[1], key: KEY_OF[m[2]] || m[2], name: m[3], home: m[4] });
    }
    return { keys, people };
}
// PNG width / height from the file's header
function pngSize(file) {
    if (!fs.existsSync(file)) return null;
    const b = fs.readFileSync(file);
    return [b.readUInt32BE(16), b.readUInt32BE(20)];
}
const INTERIOR = { kolodziej: 181, przekupka: 182, szwaczka: 184, wdowa: 185, kostek: 185, jagodka: 185, ciesla: 187, weteran: 189 };

kit.test({ port: 9572, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const doc = readDoc();
    t.check("dokument: 8 nowych mieszkańców 2940-2947 i klucze miejsc (" + doc.keys.size + ")", doc.people.length === 8 && doc.keys.has("plac_12") &&
        doc.keys.has("stragan_6") && doc.keys.has("dom4_drzwi") && doc.keys.has("stajnia_woz"), { people: doc.people, keys: [...doc.keys] });

    // ---------------------------------------------------------------- the data
    const R = await t.json(`TownLife.RESIDENTS.filter(r => r.id >= 2940 && r.id <= 2949).map(r => ({ id: r.id, key: r.key, name: r.name, map: r.map,
        sheet: r.sheet, plan: r.plan.map(p => [p[0], p[1], p[2]]), z: r.zaczepki, talk: r.talk, speed: r.speed, away: r.away || [] }))`);
    const byKey = Object.fromEntries(R.map(r => [r.key, r]));
    const bad = doc.people.filter(p => { const r = byKey[p.key]; return !r || r.id !== p.id || r.name !== p.name || r.map !== 8; });
    t.check("8 mieszkańców w TownLife z numerami, kluczami i imionami z dokumentu, na mapie 8", R.length === 8 && !bad.length, { bad, R: R.map(r => [r.id, r.key, r.name]) });
    const homes = doc.people.filter(p => !byKey[p.key] || !byKey[p.key].plan.some(e => e[1] === "inside" && e[2] === p.home + "_drzwi"));
    t.check("każdy wraca do swoich drzwi (inside <dom>_drzwi), dzieci do domu matki (dom4)", !homes.length, homes);

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
    t.check("plany: każde miejsce to klucz z NOWE_MIASTO.md, czynności TownLife (" + used.size + " miejsc)", !wrong.length, { wrong, used: [...used] });
    const clash = [];
    for (let h = 0; h < 24; h += 0.25) {
        const at = {};
        for (const r of R) {
            let e = null;
            for (const p of r.plan) if (p[0] <= h) e = p;
            if (!e) e = r.plan[r.plan.length - 1];
            if (e[1] === "stand" || e[1] === "work") { if (at[e[2]]) clash.push([h, e[2], at[e[2]], r.key]); at[e[2]] = r.key; }
        }
    }
    t.check("żadne dwie osoby nie stoją / nie pracują w jednym miejscu o tej samej porze", !clash.length, clash);
    const square = R.map(r => [r.key, r.plan.filter(p => /^(plac_|stragan_|skwer)/.test(p[2])).length]);
    t.check("wszyscy bywają na placu / przy straganach / na skwerze", square.every(s => s[1] >= 1), square);

    // ---------------------------------------------------------------- the barks and the talk
    const lines = R.map(r => ({ key: r.key, z: ["rano", "dzien", "wieczor", "deszcz"].every(k => r.z && r.z[k] && r.z[k].length) && Array.isArray(r.z.noc),
        talk: ["morning", "day", "evening", "night", "rain"].every(k => r.talk[k] && r.talk[k].length),
        n: Object.values(r.talk).reduce((a, l) => a + l.length, 0), b: Object.values(r.z).reduce((a, l) => a + l.length, 0),
        pl: /[ąćęłńóśźż]/i.test(JSON.stringify(r.talk)) }));
    t.check("zaczepki rano / dzień / wieczór / deszcz (+ noc) i rozmowy na każdą porę i deszcz, po polsku, 6+ kwestii",
        lines.every(l => l.z && l.talk && l.n >= 6 && l.b >= 6 && l.pl), lines);
    const pory = await t.json(`(function(){ const out = {}, h0 = $gameSystem.dayNightHour();
        for (const r of TownLife.RESIDENTS.filter(r => r.id >= 2940 && r.id <= 2947)) {
            $gameSystem.setDayNightHour(8); const a = r.barks.wander; $gameSystem.setDayNightHour(14); const b = r.barks.work; $gameSystem.setDayNightHour(19); const c = r.barks.stand;
            out[r.key] = [a === r.zaczepki.rano, b === r.zaczepki.dzien, c === r.zaczepki.wieczor, r.barks.rain === r.zaczepki.deszcz, r.barks.night === r.zaczepki.noc]; }
        $gameSystem.setDayNightHour(h0); return out; })()`);
    t.check("zaczepki zależą od pory dnia (8:00 ranne, 14:00 dzienne, 19:00 wieczorne), deszcz i noc osobno", Object.values(pory).every(v => v.every(Boolean)), pory);

    // ---------------------------------------------------------------- the busts
    const busts = await t.json(`${JSON.stringify(R.map(r => r.sheet))}.map(s => ({ s, b: SpeechBubbles.BUSTS[s + ":0"] || null, has: SpeechBubbles.hasBust(SpeechBubbles.BUSTS[s + ":0"]) }))`);
    const bfiles = await t.json(`Promise.all(${JSON.stringify(busts.map(b => b.b))}.map(n => n ? fetch("img/pictures/" + n + ".png", { method: "HEAD", cache: "no-store" }).then(r => r.ok).catch(() => false) : false))`);
    t.check("popiersia: SpeechBubbles.BUSTS[$Npc_<Klucz>:0] = <Klucz>_Bust, plik jest", busts.every((b, i) => b.b === b.s.slice(5) + "_Bust" && b.has && bfiles[i]), { busts, bfiles });

    // ---------------------------------------------------------------- the town map: the new one or the old one
    await t.newGame({ map: 8, x: 24, y: 37, dir: 2, hour: 11, quiet: true, minimap: false, timeout: 180 });
    await t.until(t.onMap(8), 120);   // (Map008 is big: a busy server may need longer)
    await t.setHour(11);
    const onMap = await t.json(`(function(){ const keys = ${JSON.stringify([...used])}; return { has: keys.filter(k => !!TownLife.spot(k)), miss: keys.filter(k => !TownLife.spot(k)) }; })()`);
    const installed = onMap.has.length > 0 && onMap.has.some(k => /_drzwi$/.test(k) && /^(dom\d|stajnia)/.test(k));
    if (installed) {
        t.check("nowa mapa: każdy klucz planów ma na Map008 „Miejsce:”", !onMap.miss.length, onMap);
    } else {
        console.log("NOTE nowa Map008 jeszcze nie zainstalowana (brak „Miejsce:” drzwi nowych domów): sprawdzam nieobecność i miejsca zastępcze");
        const away = await t.json(`(function(){ const out = {}; for (const r of TownLife.RESIDENTS.filter(r => r.id >= 2940 && r.id <= 2947)) { const e = TownLife.eventOf(r.key);
            out[r.key] = e ? [TownLife.absent(r.key), e._town.hidden, e.isTransparent()] : null; } return out; })()`);
        t.check("stara mapa: nowi mieszkańcy są nieobecni (ukryci, przezroczyści) - nie stoją w rogu mapy", Object.values(away).every(v => v && v.every(Boolean)), away);
        // stand-in places, only in the page: free cells round the hero, one per key; then the map once more
        await t.eval(`(function(){ const keys = ${JSON.stringify([...used])}, D = window.TownLifeData, px = $gamePlayer.x, py = $gamePlayer.y, cells = [];
            for (let r = 2; r < 14 && cells.length < keys.length; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || cells.length >= keys.length) continue;
                const x = px + dx, y = py + dy;
                if ((dx + dy) % 2 || !$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f) || $gameMap.eventsXy(x, y).length) continue;
                cells.push([x, y, 2]); }
            keys.forEach((k, i) => { D.SPOTS[k] = cells[i % cells.length]; }); window.__standIn = keys.length; return 0; })()`);
        await t.newGame({ map: 8, x: 24, y: 37, dir: 2, hour: 11, quiet: true, minimap: false, timeout: 180 });
        await t.until(t.onMap(8), 120);
        await t.setHour(11);
    }

    // ---------------------------------------------------------------- out at 11:00 (everyone is out then), the talk, the busts in it
    await t.eval("TownLife.placeAll(); 0");
    await t.frames(20);
    const out11 = await t.json(`(function(){ const out = {}; for (const r of TownLife.RESIDENTS.filter(r => r.id >= 2940 && r.id <= 2947)) { const e = TownLife.eventOf(r.key);
        out[r.key] = e ? { id: e.eventId(), hidden: !!e._town.hidden, act: TownLife.entryAt(r, 11).act, sheet: e.characterName() } : null; } return out; })()`);
    t.check("o 11:00 wszyscy na mieście (nikt nie jest wtedy w domu), własne arkusze, zdarzenia 2940-2947",
        Object.entries(out11).every(([k, v]) => v && !v.hidden && v.sheet === byKey[k].sheet && v.id === byKey[k].id), out11);
    for (const r of R) {
        if (!out11[r.key]) { t.check(`rozmowa: ${r.name} - brak zdarzenia na mapie`, false); continue; }
        // (2026-10-22: przekupka i szwaczka mają sklep z ubraniami - rozmowa zaczyna się od menu sklepu, tu „Porozmawiaj”)
        const sklep = await t.eval(`!!(window.Ubior_Data && Ubior_Data.SKLEPY && Ubior_Data.SKLEPY[${JSON.stringify(r.key)}])`);
        const talk = await t.talkTo(`TownLife.eventOf(${JSON.stringify(r.key)})`, sklep ? ["Porozmawiaj"] : [], { secs: 20 });
        const mine = Object.values(r.talk).flat().map(l => l.slice(0, 18));
        const bust = await t.eval(`SpeechBubbles.bustOf(TownLife.eventOf(${JSON.stringify(r.key)}))`);
        t.check(`rozmowa: ${r.name} odpowiada swoją kwestią, popiersie ${bust}`, talk.done && mine.some(s => talk.text.replace(/\s+/g, " ").includes(s.replace(/\s+/g, " ").slice(0, 12))) &&
            bust === r.sheet.slice(5) + "_Bust", { text: talk.text.slice(0, 160), bust });
        await t.frames(10);
    }
    await t.setHour(23.5);
    await t.frames(20);
    const night = await t.json(`(function(){ const out = {}; for (const r of TownLife.RESIDENTS.filter(r => r.id >= 2940 && r.id <= 2947)) { const e = TownLife.eventOf(r.key);
        out[r.key] = [e._town.hidden, e.isThrough(), e.isTransparent()]; } return out; })()`);
    t.check("o 23:30 wszyscy w domach (ukryci, przechodni)", Object.values(night).every(v => v.every(Boolean)), night);

    // ---------------------------------------------------------------- the interiors
    const maps = await t.json(`${JSON.stringify([...new Set(Object.values(INTERIOR))])}.filter(id => !!$dataMapInfos[id])`);
    if (maps.length) {
        const spots = await t.json(`Promise.all(${JSON.stringify(Object.entries(INTERIOR))}.map(([k, id]) => fetch("data/Map" + String(id).padStart(3, "0") + ".json", { cache: "no-store" })
            .then(r => r.ok ? r.json() : null).then(d => [k, id, !!(d && d.events.some(e => e && new RegExp("^Miejsce:\\\\s*" + k + "_wnetrze\\\\s*$", "i").test(e.name)))]).catch(() => [k, id, false])))`);
        t.check("wnętrza: każdy ma w swoim domu „Miejsce: <klucz>_wnetrze”", spots.every(s => s[2]), spots);
    } else console.log("NOTE wnętrza nowych domów (Map181-189) jeszcze nie zainstalowane - „Miejsce: <klucz>_wnetrze” do sprawdzenia po instalacji");
});
