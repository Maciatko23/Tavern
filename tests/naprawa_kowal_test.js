// Naprawa u kowala Tadka w oknie sklepu, samymi klawiszami (2026-11-17: autopilot naprawiał w kółko - czy naprawa w grze naprawdę
// przywraca wytrzymałość?): żelazny miecz w ręku i druga zużyta rzecz z metalu w torbie, obie mocno zużyte; zakładka „Napraw”
// (strzałka w prawo z „Kup”), O na wierszu - wytrzymałość wraca do pełna, złoto ubywa, wiersz znika; po obu lista pusta.
// Uruchom: node tests/run.js naprawa_kowal --port 9502
const kit = require("./lib/kit.js");

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ map: 220, x: 40, y: 40, dir: 2, day: 12, hour: 10, quiet: true, minimap: false });
    const pick = await t.json(`(function(){ const d = Bron_Data, s = d.SKLEPY.kowal, ok = p => p && $dataItems[p.id] && s.naprawia.includes(p.material) && Durability.TOOLS[p.id];
        const sword = d.PRZEDMIOTY.find(p => p.id === 305) || d.PRZEDMIOTY.find(p => ok(p) && p.typ === "bron");
        const other = d.PRZEDMIOTY.find(p => ok(p) && p.id !== sword.id && p.typ !== "bron");
        return [sword.id, other ? other.id : 0]; })()`);
    const [sword, other] = pick;
    await t.eval(`(function(){ $gameParty.gainGold(2000); for (const id of ${JSON.stringify(pick)}) if (id) { $gameParty.gainItem($dataItems[id], 1); Durability.setUsed(id, Math.floor(Durability.lifeOf(id) * 0.8)); }
        if (window.Combat && Combat.setHand) Combat.setHand("m${sword}"); return 0; })()`);
    const before = await t.json(`${JSON.stringify(pick)}.map(id => id ? [id, Durability.left(id), Durability.lifeOf(id)] : null)`);
    t.check("dwie zużyte rzeczy z metalu (miecz w ręku i druga): zostało po 20%", before.every(b => !b || b[1] <= Math.ceil(b[2] * 0.2) + 1), before);
    await t.eval(`(function(){ Bron.otworz("kowal", "kup"); return 0; })()`);
    await t.until("SceneManager._scene && SceneManager._scene._tabs && SceneManager._scene._list", 10);
    await t.frames(20);
    await t.press("right");
    await t.frames(10);
    const tab = await t.json(`({ tab: SceneManager._scene._tab, rows: SceneManager._scene.rows().map(r => r.id) })`);
    t.check("strzałka w prawo z „Kup” (przez „Sprzedaj”?) - zakładka; dochodzę do „Napraw”", !!tab.tab, tab);
    for (let i = 0; i < 3 && (await t.json("SceneManager._scene._tab")) !== "napraw"; i++) { await t.press("right"); await t.frames(10); }
    const rows0 = await t.json(`({ tab: SceneManager._scene._tab, rows: SceneManager._scene.rows().map(r => r.id), index: SceneManager._scene._list.index })`);
    t.check("w zakładce „Napraw” obie rzeczy", rows0.tab === "napraw" && pick.filter(Boolean).every(id => rows0.rows.includes(id)), rows0);
    const g0 = await t.json("$gameParty.gold()");
    await t.press("ok");
    await t.frames(20);
    const after1 = await t.json(`({ rows: SceneManager._scene.rows().map(r => r.id), msg: SceneManager._scene._msg ? SceneManager._scene._msg.text : "", gold: $gameParty.gold(),
        left: ${JSON.stringify(pick)}.map(id => id ? [id, Durability.left(id), Durability.lifeOf(id)] : null) })`);
    const fixed1 = after1.left.filter(l => l && l[1] === l[2]).map(l => l[0]);
    t.check("O na pierwszym wierszu: ta rzecz wraca do pełna, złoto ubywa, wiersz znika", fixed1.length === 1 && after1.gold < g0 && !after1.rows.includes(fixed1[0]) && /Naprawione/.test(after1.msg), { g0, after1 });
    await t.press("ok");
    await t.frames(20);
    const after2 = await t.json(`({ rows: SceneManager._scene.rows().map(r => r.id), left: ${JSON.stringify(pick)}.map(id => id ? [id, Durability.left(id), Durability.lifeOf(id)] : null) })`);
    t.check("drugie O: druga też cała, lista pusta", after2.left.every(l => !l || l[1] === l[2]) && after2.rows.length === 0, after2);
    await t.press("cancel");
    await t.frames(20);
});
