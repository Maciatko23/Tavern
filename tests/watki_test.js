// The thread engine in the game (Watki.js, docs/WATKI_DANE.md; the pilot W4 "Krew kasztelana" ch. 6-8: Kasztelan_Data.js +
// js/teksty/kasztelan.txt). The unit test (tests/unit/watki.test.js) checks the engine and the pilot's talks against the old code;
// here the real game:
//   - the list: Watki under Journal, Kasztelan_Data under Dwor and over Kasztelan; the texts read before the title, without mistakes
//   - a text changed in the file is what the game shows (the file served changed: Borgar's topic), and a text read again while the
//     game runs is used at once (the journal's chapter text) - the game keeps no copies
//   - W4's steps 6-9 come from the data at their old indexes (old saves: the same numbers), the journal shows their words
//   - the save: W4 in the cellar's night saved and loaded - the same step, Kasztelan's state as it was (key "kasztelan", version 1);
//     nothing new in the save but the chapter 1's own record (2026-10-28: Story's thread "fabula" - _tw.watki.w.fabula); the old
//     saves of tests/fixtures load and play
// Port: CDP_PORT (9625 for this work). The changed file: tests/watki/nakladka/js/teksty/kasztelan.txt (made by the test).
const fs = require("fs");
const path = require("path");
const kit = require("./lib/kit.js");
const ROOT = path.join(__dirname, "..");
const NEW_TOPIC = "Borgarze... chodzi o twój ród. (zmienione w pliku)";
const OVER = path.join(__dirname, "watki", "nakladka");
fs.mkdirSync(path.join(OVER, "js", "teksty"), { recursive: true });
const original = fs.readFileSync(path.join(ROOT, "js", "teksty", "kasztelan.txt"), "utf8");
fs.writeFileSync(path.join(OVER, "js", "teksty", "kasztelan.txt"), original.replace(/^topic = .*$/m, "topic = " + NEW_TOPIC));

kit.test({ port: 9625, overlay: "tests/watki/nakladka", overlayJs: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e), E = e => t.eval(e);
    const boot = await J(`({ n: $plugins.filter(p => p.status).map(p => p.name), files: Watki.pliki(), ready: Watki.gotowe(), title: SceneManager._scene instanceof Scene_Title, th: Watki.watki() })`);
    const at = name => boot.n.indexOf(name);
    t.check("lista gry: Watki zaraz pod Journal, Kasztelan_Data pod Dwor i zaraz nad Kasztelan; wątek „kasztelan” w silniku",
        at("Watki") === at("Journal") + 1 && at("Kasztelan_Data") > at("Dwor") && at("Kasztelan") === at("Kasztelan_Data") + 1 && boot.th.includes("kasztelan"), boot.n.slice(at("Journal"), at("Journal") + 2));
    const kf = boot.files.find(f => f.name === "kasztelan");
    t.check("teksty wczytane przed ekranem tytułowym: js/teksty/kasztelan.txt bez błędów (" + (kf && kf.keys) + " kluczy)",
        boot.title && boot.ready && kf && kf.st === "ok" && kf.errors.length === 0 && kf.keys > 100, boot.files);

    await t.newGame({ story: true, skipIntro: true, deadline: false, day: 62, hour: 10, quiet: true, minimap: false });
    const steps = await J("TownQuests.Q.W4.steps.map(s => [s.nazwa || s.talk || s.check || s.vars || s.type, s.ch])");
    t.check("W4 ma 10 kroków: 0-5 z TownQuests_Data, 6-9 z danych wątku na swoich miejscach (w4Rod 6, w4Konfrontacja 7, w4Piwnica 7, w4Serce 8)",
        steps.length === 10 && steps.slice(6).map(s => s.join(":")).join() === "w4Rod:6,w4Konfrontacja:7,w4Piwnica:7,w4Serce:8", steps);

    // a text changed in the file: the game shows it (Borgar's topic at the bar)
    await J("Kasztelan.debugJump(7)");
    const topics = await J("TownQuests.borgarTopics().map(x => x.label)");
    t.check("tekst zmieniony w pliku (podany grze zmieniony plik) - gra pokazuje zmieniony: temat u Borgara „" + NEW_TOPIC + "”", topics.includes(NEW_TOPIC), topics);
    // a text read again while the game runs: used at once (the journal's chapter text - no copies kept)
    const ops = () => J("(function(){ const x = TownQuests.journalItems().find(i => i.quest && i.quest.id === 'W4'); return x ? TownQuests.journalOps(x).map(o => o.text || '').join(' | ') : ''; })()");
    const before = await ops();
    await E("window.__kt = null; fetch('js/teksty/kasztelan.txt').then(r => r.text()).then(x => { window.__kt = x; }); 0");
    await t.until("!!window.__kt", 10);
    await E(`Watki.wczytaj("kasztelan", window.__kt.replace(/^kroki\.w4Konfrontacja = .*$/m, "kroki.w4Konfrontacja = Inne słowa rozdziału. Na próbę.")); 0`);
    const after = await ops();
    await E("Watki.wczytaj('kasztelan', window.__kt); 0");
    const back = await ops();
    t.check("tekst przeczytany na nowo w trakcie gry - od razu w dzienniku (rozdział 7), a potem z powrotem",
        /Konfrontacja\. Pokaż Borgarowi klucz/.test(before) && /Inne słowa rozdziału\. Na próbę\./.test(after) && !/Konfrontacja\. Pokaż/.test(after) && /Konfrontacja\. Pokaż Borgarowi klucz/.test(back),
        { before: before.slice(0, 200), after: after.slice(0, 200) });

    // the save: W4 in the cellar's night - saved, loaded, the same
    await J("Kasztelan.debugJump(8)");
    await t.setDay(62, 23.6);
    const s0 = await J("({ step: Kasztelan.step(), r: TownQuests.rec('W4').step, k: Kasztelan.state(), v: Tawerna.state.version('kasztelan'), night: Kasztelan.cellarNight() })");
    await t.saveTo(1);
    const loaded = await t.loadFrom(1);
    await t.frames(20);
    const s1 = await J("({ step: Kasztelan.step(), r: TownQuests.rec('W4').step, k: Kasztelan.state(), tw: Object.keys($gameSystem._tw || {}), own: Object.keys((($gameSystem._tw || {}).watki || {}).w || {}), night: Kasztelan.cellarNight(), text: TownQuests.Q.W4.steps[8].text })");
    t.check("zapis i wczytanie: W4 w nocy w piwnicy (krok 8 „w4Piwnica”), stan Kasztelan taki sam (klucz kasztelan, wersja 1), z silnika w zapisie tylko rekord rozdziału 1",
        loaded && s0.step === "w4Piwnica" && s1.step === "w4Piwnica" && s1.r === 8 && JSON.stringify(s1.k) === JSON.stringify(s0.k) && s0.v === 1 &&
        s1.tw.includes("kasztelan") && s1.own.every(k => k === "fabula") && /czeka w piwnicy przy kracie/.test(s1.text), { s0, s1 });

    // the old saves of tests/fixtures (made before the engine): load and play, nothing of the engine in them
    for (const name of ["new_story_day1", "tavern_evening", "day40_farm"]) {
        const ok = await t.loadFixture(name, { calm: true, needsOff: true });
        await t.frames(30);
        const f = await J("({ map: $gameMap.mapId(), w4: TownQuests.Q.W4.steps.length, tw: Object.keys($gameSystem._tw || {}), own: Object.keys((($gameSystem._tw || {}).watki || {}).w || {}), step: Kasztelan.step(), sb: SceneManager._scene.constructor.name })");
        t.check("stary zapis " + name + " wstaje i gra: W4 ma swoje 10 kroków, z silnika w zapisie tylko rekord rozdziału 1", ok && f.map > 0 && f.w4 === 10 && f.own.every(k => k === "fabula") && f.sb === "Scene_Map", f);
    }
});
