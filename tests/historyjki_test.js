// Podróżni z promu - etap 7: historyjki ilustrowane H1, H2, H3, H5 i zakładka „Wspomnienia” w Dzienniku (docs/PODROZNI.md 8.2;
// js/plugins/Historyjki_Data.js + Historyjki.js, js/teksty/historyjki.txt, img/pictures/Hist_*.png). Sprawdza:
//   - wtyczki na liście, teksty bez błędów, plansze Hist_<id>_1.png są, zakładka „Wspomnienia” w Dzienniku, stan z wersją
//   - wyzwalacze: H1 po pierwszej poszlace D43, H2 przy tymonBrzozowa, H3 przy gasparZdemaskowany, H5 gdy list posła w rękach bohatera
//   - odtwarzacz: myśl nad bohaterem, potem historyjka (scena, plansza, ujęcia, napisy), O - następna kwestia, krótkie P - następne ujęcie,
//     przytrzymane P - koniec całości, powrót na mapę; raz na grę
//   - bez planszy: sepia z napisami (cichy fallback, bez błędów); zakładka: obejrzane, „Obejrzyj jeszcze raz”; zapis i wczytanie
// Uruchom: node tests/run.js historyjki_test --port 9791
const kit = require("./lib/kit.js");

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const info = () => J("Historyjki.info()");
    const onMap = () => J("SceneManager._scene instanceof Scene_Map");

    // ---------------------------------------------------------------- wtyczki, teksty, plansze, zakładka
    const base = await J(`({ list: $plugins.filter(p => p.status).map(p => p.name), file: Watki.pliki().find(f => f.name === "historyjki"), api: !!window.Historyjki,
        tab: Journal.TABS.includes("Wspomnienia"), ids: Historyjki.list(), st: Historyjki.state(),
        boards: Historyjki.D.STORIES.map(s => [s.id, s.boards, s.shots.length]) })`);
    t.check("wtyczki Historyjki_Data i Historyjki na liście; teksty historyjki.txt bez błędów; zakładka „Wspomnienia” w Dzienniku; cztery historyjki",
        base.api && base.list.includes("Historyjki") && base.list.indexOf("Historyjki") > base.list.indexOf("Journal") && base.file && base.file.st === "ok" && !base.file.errors.length && base.tab && base.ids.join() === "H1,H2,H3,H5", base);
    const fs = require("fs"), path = require("path");
    const ROOT = path.join(__dirname, "..");
    const missing = ["H1", "H2", "H3", "H5"].filter(h => !fs.existsSync(path.join(ROOT, "img", "pictures", "Hist_" + h + "_1.png")));
    t.check("plansze img/pictures/Hist_<H1|H2|H3|H5>_1.png są (1280x720)", missing.length === 0, missing);

    // ---------------------------------------------------------------- wyzwalacze
    await t.newGame({ map: 8, x: 46, y: 49, dir: 8, hour: 10, quiet: true, minimap: false });
    await t.eval("Historyjki.auto(true); 0");   // (the tests' quiet mode turns the triggers off)
    const g0 = await J(`(function(){ const D = Historyjki.D, g = id => D.STORIES.find(s => s.id === id).gdy(); return { h1: g("H1"), h2: g("H2"), h3: g("H3"), h5: g("H5") }; })()`);
    await t.eval(`PodroznicyData.watek.S().d43.slady.test = 1; TownQuests.state().flags.tymonBrzozowa = 1; TownQuests.state().flags.gasparZdemaskowany = 1; Poselstwo.stan().list = "bohater"; 0`);
    const g1 = await J(`(function(){ const D = Historyjki.D, g = id => D.STORIES.find(s => s.id === id).gdy(); return { h1: g("H1"), h2: g("H2"), h3: g("H3"), h5: g("H5") }; })()`);
    t.check("wyzwalacze: nic na starcie; po poszlace D43 / tymonBrzozowa / gasparZdemaskowany / liście posła w rękach - każda historyjka gotowa",
        Object.values(g0).every(v => !v) && Object.values(g1).every(Boolean), { g0, g1 });
    await t.eval(`PodroznicyData.watek.S().d43.slady = {}; TownQuests.state().flags.tymonBrzozowa = 0; TownQuests.state().flags.gasparZdemaskowany = 0; Poselstwo.stan().list = ""; 0`);

    // ---------------------------------------------------------------- H1 sama: myśl, potem scena
    await t.eval(`PodroznicyData.watek.S().d43.slady.test = 1; 0`);
    await t.eval("Historyjki.tick(); 0");
    const p1 = await J("({ pending: Historyjki.state().pending, running: !!Historyjki.info() })");
    t.check("po pierwszej poszlace D43 na spokojnej mapie: myśl nad bohaterem, historyjka H1 czeka (jeszcze nie gra)", p1.pending === "H1" && !p1.running, p1);
    await t.until("!!Historyjki.info()", 15, 200).catch(() => 0);
    await t.eval("Historyjki.tick(); 0");
    for (let i = 0; i < 12 && !(await info()); i++) { await t.frames(30); await t.eval("Historyjki.tick(); 0"); }
    await t.until("!!Historyjki.info() && Historyjki.info().phase === 'play'", 15, 200);
    await t.frames(60);
    const a = await info();
    await t.shot("out/historyjki_H1_karta.png");
    t.check("H1: scena historyjki, faza play, pierwsze ujęcie z planszą (nie sepia), efekty (mgła), karta tytułowa", a && a.id === "H1" && a.phase === "play" && a.shot === 0 && !a.sepia && a.fx >= 7 && a.card > 0 && a.shots === 4, a);
    await t.frames(110);
    await t.shot("out/historyjki_H1_napis.png");
    const b = await info();
    t.check("po karcie: pierwsza kwestia - „Olszynka...”, kamera się rusza", b && /Olszynka/.test(b.text) && b.card === 0, b);
    await t.press("ok");
    await t.frames(30);
    const c = await info();
    t.check("O - następna kwestia (to samo ujęcie, druga linia @Urszula)", c && c.shot === 0 && c.line === 1 && /bęben/.test(c.text), c);
    await t.press("escape", 8);
    await t.frames(60);
    const d = await info();
    t.check("krótkie P - następne ujęcie (drugie)", d && d.shot === 1, d);
    await t.press("escape", 90);
    await t.until("!Historyjki.info()", 20, 200);
    await t.frames(30);
    const e = await J("({ map: SceneManager._scene instanceof Scene_Map, seen: Historyjki.seen('H1'), last: Historyjki.D && Historyjki.state(), run: Historyjki.running })");
    t.check("przytrzymane P - cała historyjka pominięta, powrót na mapę; H1 obejrzana (raz na grę)", e.map && e.seen > 0 && !e.run, e);
    await t.eval("Historyjki.tick(); 0");
    await t.frames(60);
    t.check("po obejrzeniu nie wraca (ani sama, ani przez play bez replay)", !(await info()) && (await J("Historyjki.play('H1')")) === false, await info());

    // ---------------------------------------------------------------- H5 przez play do końca (bez klawiszy: sam czas)
    await t.eval("window.__hend = null; Tawerna.on('historyjkaObejrzana', e => { window.__hend = e; }); 0");
    t.check("H5 przez play(): ruszyła", (await J("Historyjki.play('H5', { onEnd: r => { window.__hr = r; } })")) === true, await info());
    await t.until("!!Historyjki.info() && Historyjki.info().phase === 'play'", 15, 200);
    await t.frames(30);
    await t.shot("out/historyjki_H5.png");
    await t.press("escape", 90);
    await t.until("!Historyjki.info()", 20, 200);
    await t.frames(20);
    const h5 = await J("({ end: window.__hend, r: window.__hr, seen: Historyjki.seen('H5') })");
    t.check("H5: szyna historyjkaObejrzana { id, all }, onEnd z wynikiem (plansze użyte, nie sepia), obejrzana", h5.end && h5.end.id === "H5" && h5.end.all === true && h5.r && h5.r.id === "H5" && h5.seen > 0, h5);

    // ---------------------------------------------------------------- bez planszy: sepia
    await t.eval(`Historyjki.D.STORIES.push({ id: "HX", boards: 1, shots: [{ board: 7, len: 120, cam: [[0.5, 0.5, 1], [0.5, 0.5, 1.1]], fx: ["rain", "embers", "smoke", "dust", "candle"] }], gdy: () => false }); 0`);
    await t.eval("Historyjki.play('HX'); 0");
    await t.until("!!Historyjki.info() && Historyjki.info().phase === 'play'", 15, 200);
    await t.frames(20);
    const sp = await info();
    await t.press("escape", 90);
    await t.until("!Historyjki.info()", 20, 200);
    const spl = await J("Historyjki.last");
    t.check("plansza nie istnieje: sepia (kolor), efekty bez błędów, historyjka się kończy; wynik: sepia 1, planszy 0", sp && sp.sepia && sp.fx >= 5 && spl && spl.sepia >= 1 && !spl.boards, { sp, spl });
    await t.eval(`Historyjki.D.STORIES.pop(); delete Historyjki.state().seen.HX; 0`);

    // ---------------------------------------------------------------- zakładka „Wspomnienia”
    const tab = await J(`(function(){ const def = Journal.TAB_DEFS.find(x => x.name === "Wspomnienia"), it = def.items(), d = def.detail(it[0]);
        return { n: it.length, labels: it.map(i => i.label), right: it.map(i => i.right), ops: d.ops.map(o => o.k + ":" + String(o.text || "").slice(0, 40)), leg: def.legend() }; })()`);
    t.check("zakładka: dwie obejrzane (H5, H1 - najnowsza pierwsza), opis z kwestiami i „O - obejrzyj jeszcze raz”, legenda „2 z 4”",
        tab.n === 2 && tab.labels[0] === "Pieczęć" && tab.labels[1] === "Olszynka, dzień poboru" && tab.ops.some(o => /Obejrzyj|obejrzyj/.test(o)) && /2 z 4/.test(tab.leg), tab);
    const ro = await J(`(function(){ const def = Journal.TAB_DEFS.find(x => x.name === "Wspomnienia"); return def.ok(def.items()[1]); })()`);
    // (items()[1] is H1, the older one)
    await t.until("!!Historyjki.info() && Historyjki.info().phase === 'play'", 15, 200);
    const rp = await info();
    await t.press("escape", 90);
    await t.until("!Historyjki.info()", 20, 200);
    t.check("OK na wspomnieniu: ta sama historyjka jeszcze raz (replay, bez nowego wpisu)", ro !== false && rp && rp.id === "H1" && (await J("Object.keys(Historyjki.state().seen).length")) === 2, { ro, rp });
    const empty = await J(`(function(){ const def = Journal.TAB_DEFS.find(x => x.name === "Wspomnienia"); return def.ok({ empty: true }); })()`);
    t.check("OK na pustym wierszu: nic", empty === false, empty);

    // ---------------------------------------------------------------- zapis i wczytanie
    const st0 = await J("Historyjki.state()");
    await t.saveTo(1);
    await t.loadFrom(1, { quiet: true });
    await t.eval("Historyjki.auto(true); 0");
    const st1 = await J("Historyjki.state()");
    t.check("zapis i wczytanie: obejrzane historyjki zostają", JSON.stringify(st0.seen) === JSON.stringify(st1.seen) && Object.keys(st1.seen).length === 2, { st0, st1 });
});
