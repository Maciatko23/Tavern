// Autopilot i woda na głębsze zejścia (2026-11-17, gracz: „a gracz robi wiadra, beczki, garnki i zbiera wodę?”): autopilot fabuły stawia
// własną studnię na działce dziadka (Podgrodzie, Map218: dół łopatą, wiadro, lina z dziesięciu sznurków, kamienie, deski - plan AP
// „Studnia”), pije z niej do pełna i napełnia bukłak bez dziennego przydziału studni miejskiej, a w garbarni powiększa bukłak (wyprawiona
// skóra + 2 ścięgna: 8 łyków zamiast 4). Zapis gry: tests/fixtures/nowy_dzien40.json (dzień 40 na działce).
// Uruchom: node tests/run.js woda_autopilot --port 9503
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    await t.loadFixture("nowy_dzien40");
    await t.setHour(7);
    await t.eval(`(function(){ if (window.Needs && Needs.setEnabled) Needs.setEnabled(true); $gameSystem.setStamina(100); const a = $gameParty.leader(); a.setHp(a.mhp);
        if (window.Creatures && Creatures.auto) Creatures.auto(false); if (window.Humans && Humans.auto) Humans.auto(false); return 0; })()`);
    const has = await J(`(function(){ const l = (Farming.farm().buildings || {})[218] || []; return { map: $gameMap.mapId(), well: l.filter(b => b && b.type === "well").length, tannery: l.some(b => b && b.type === "tannery" && !b.site), skin: $gameParty.numItems($dataItems[129]), big: Needs.skinBig() }; })()`);
    t.check("dzień 40 na działce (Map218): garbarnia stoi, bukłak w plecaku (zwykły)", has.map === 218 && has.tannery && has.skin > 0 && !has.big, has);
    // (the day-40 save has the base autopilot's well already: taken down first - the story autopilot puts it up again)
    const down = await J(`(function(){ const l = (Farming.farm().buildings || {})[218] || [], b = l.find(b => b && b.type === "well"); if (!b) return "none"; const ok = Farming.demolish(b);
        for (const id of [492, 138]) $gameParty.loseItem($dataItems[id], 99); return ok && !l.some(b => b && b.type === "well") ? "down" : "kept"; })()`);
    t.check("stara studnia z zapisu rozebrana (jej wiadro i lina wyjęte z plecaka)", down === "down" || down === "none", down);
    await t.eval("window.FAB_GRAPH = null; 0");
    await t.eval(fs.readFileSync(path.join(__dirname, "autopilot", "ap.js"), "utf8"));
    const v = await t.eval(fs.readFileSync(path.join(__dirname, "autopilot_fabula", "fab.js"), "utf8"));
    t.check("autopilot fabuły w stronie (" + v + ")", /^ok|same/.test(String(v)));

    // ---- the own well: the plan's way, with its things in the bag (the shovel's pit dug by him)
    await t.eval(`(function(){ for (const [id, n] of [[64, 12], [80, 3], [492, 1], [138, 1], [62, 1], [89, 1]]) if ($gameParty.numItems($dataItems[id]) < n) $gameParty.gainItem($dataItems[id], n - $gameParty.numItems($dataItems[id])); return 0; })()`);
    await t.eval("AP.run([['fab_water', 'well']]); 0");
    const built = await t.until("!AP.cur && !AP.queue.length", 400);
    const w = await J(`(function(){ const l = (Farming.farm().buildings || {})[218] || []; const b = l.find(b => b && b.type === "well"); return { well: b ? [b.x, b.y, !!b.site] : null, lina: $gameParty.numItems($dataItems[492]), log: AP.log.slice(-6) }; })()`);
    t.check("studnia na działce: dół wykopany, studnia postawiona (lina i wiadro zużyte)", built && w.well && !w.well[2] && w.lina === 0, w);
    await t.shot(path.join(__dirname, "..", "docs", "NOWY_SWIAT", "autopilot_studnia.png"));

    // ---- a drink to the full and the skin filled there - the town's ration untouched
    const r0 = await J(`JSON.stringify(Farming.farm().rations || {})`);
    await t.eval("Needs.state().water = 25; 0");
    await t.eval("AP.run([['fab_water', 'drink']]); 0");
    await t.until("!AP.cur && !AP.queue.length", 120);
    const d = await J(`({ water: Math.round(Needs.state().water), log: AP.log.slice(-3) })`);
    t.check("spragniony (woda 25): pije z własnej studni do ~90 (kilka łyków, bez przydziału)", d.water >= 85, d);
    if (!(await J("$gameParty.numItems($dataItems[129]) > 0"))) await t.eval("$gameParty.gainItem($dataItems[129], 1); 0");
    await t.eval("Needs.state().skin = 0; 0");
    await t.eval("AP.run([['fab_water', 'fill']]); 0");
    await t.until("!AP.cur && !AP.queue.length", 120);
    const f = await J(`({ sips: Needs.skinCharges(), max: Needs.SKIN.max, rations: JSON.stringify(Farming.farm().rations || {}), log: AP.log.slice(-3) })`);
    t.check("bukłak napełniony przy własnej studni (" + f.sips + "/" + f.max + "); przydział studni miejskiej nietknięty", f.sips === f.max && f.rations === r0, f);

    // ---- the bigger skin at the tannery: a tanned hide, two sinews
    await t.eval(`(function(){ $gameParty.gainItem($dataItems[97], 1); $gameParty.gainItem($dataItems[163], 2); return 0; })()`);
    await t.eval("AP.run([['fab_water', 'big']]); 0");
    await t.until("!AP.cur && !AP.queue.length", 240);
    const big = await J(`({ big: Needs.skinBig(), max: Needs.SKIN.max, hide: $gameParty.numItems($dataItems[97]), sinew: $gameParty.numItems($dataItems[163]), log: AP.log.slice(-4) })`);
    t.check("w garbarni „Powiększ bukłak”: bukłak mieści 8 łyków (skóra i 2 ścięgna zużyte)", big.big && big.max === 8, big);
});
