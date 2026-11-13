

# ====================================================================================================================
# 10. Tests (staged copies in staging/tests/, same names; they go to tests/ at install): the old maps / coordinates -> the new homes
# ====================================================================================================================
def PT(name, pairs):
    for a in pairs:
        P("tests/%s.js" % name, *a)

def sec_tests():
    PT("zakon_test", [
        ("    const MAPS = [22, 13, 157, 21, 4, 17, 23, 155, 18, 125, 168, 175, 8, 120, 165];", "    const MAPS = [3, 13, 157, 4, 155, 125, 168, 175, 8, 120, 165];   // (2026-11-11 plansza: 22, 21, 17, 23, 18 are places of Kruczy Jar (3) and Łąka (4))"),
        ("    await go(22, 73, 41, 10);\n    await t.eval(`__near(73, 39); 0`);", "    await go(3, 61, 18, 10);\n    await t.eval(`__near(61, 16); 0`);"),
        ('$gameSelfSwitches.value([22, 2701, "B"])', '$gameSelfSwitches.value([3, 2701, "B"])'),
        ("    await go(22, 72, 18, 10);", "    await go(3, 69, 16, 10);"),
        ("    await go(17, 50, 39, 10);\n    await t.eval(`__near(50, 37); 0`);", "    await go(3, 8, 81, 10);\n    await t.eval(`__near(8, 79); 0`);"),
        ('$gameSelfSwitches.value([17, 2751, "B"])', '$gameSelfSwitches.value([3, 2751, "B"])'),
        ("    await go(18, 52, 45, 12);\n    await t.eval(`__near(52, 43); window.__kit.pops.length = 0; 0`);", "    await go(4, 49, 78, 12);\n    await t.eval(`__near(49, 76); window.__kit.pops.length = 0; 0`);"),
        ("$gameScreen.clearWeather(); __near(52, 43); return 0;", "$gameScreen.clearWeather(); __near(49, 76); return 0;"),
        ('$gameSelfSwitches.value([18, 2769, "B"])', '$gameSelfSwitches.value([4, 2769, "B"])'),
        ("$gamePlayer.locate(53, 46); 0", "$gamePlayer.locate(50, 79); 0"),
        ("    const up = await t.until(t.onMap(18), 30);\n    t.check(\"schody komory wyprowadzają na Łąkę menhirów (53,46)\", up && (await t.json(`[$gamePlayer.x, $gamePlayer.y]`)).join() === \"53,46\");",
         "    const up = await t.until(t.onMap(4), 30);\n    t.check(\"schody komory wyprowadzają na Łąkę menhirów (50,79)\", up && (await t.json(`[$gamePlayer.x, $gamePlayer.y]`)).join() === \"50,79\");"),
    ])
    PT("zasoby_test", [
        ('JSON.stringify([[2900, 17, "$Npc_Jagna"]])', 'JSON.stringify([[2900, 3, "$Npc_Jagna"]])'),
        ("mieszkanka TownLife 2900 na Map017", "mieszkanka TownLife 2900 na Map003 (Omszała łąka)"),
        ("out.push([17, h.id, h.x, h.y])", "out.push([3, h.id, h.x, h.y])"),
        ("out.push([17, r.ids[i], c[0], c[1]])", "out.push([3, r.ids[i], c[0], c[1]])"),
        ("    const MAPS = [17, 21, 13, 155, 168, 3, 111, 125, 162, 8];", "    const MAPS = [4, 13, 155, 168, 3, 111, 125, 162, 8];   // (2026-11-11: Map017 is built with Map003, Map021's spring is on Map004)"),
        ("    await t.go(17, 71, 55, 8);", "    await t.go(3, 40, 80, 8);"),
        ("$gameSelfSwitches.value([17, id, 'A'])", "$gameSelfSwitches.value([3, id, 'A'])"),
        ("    await t.locate(54, 42, 8);", "    await t.locate(43, 72, 8);"),
        ("$gameSelfSwitches.value([17, 2107, 'A'])", "$gameSelfSwitches.value([3, 2107, 'A'])"),
        ("    await t.locate(54, 44, 2);", "    await t.locate(43, 74, 2);"),
        ("Zasoby.herbState(17, 2104, 'arcydziegiel')", "Zasoby.herbState(3, 2104, 'arcydziegiel')"),
        ("    await t.go(17, 67, 17, 8);", "    await t.go(3, 20, 76, 8);"),
        ("    await t.go(21, 20, 15);", "    await t.go(4, 20, 15);"),
        ("przy swojej polance (67,15)\", !!jg && jg.x === 67 && jg.y === 15", "przy swojej polance (20,75)\", !!jg && jg.x === 20 && jg.y === 75"),
    ])
    PT("lowy_test", [
        ("fixed: [!!Humans.fixedCamp(21), !!Humans.fixedCamp(23)]", "fixed: [!!Humans.fixedCamp(4), !!Humans.fixedCamp(3)]"),
        ("stałe obozy na Map021 i Map023", "stałe obozy na Łące (4) i Kruczym Jarze (3)"),
        ("        23: [[2300, 65, 50], [2301, 68, 19]], 13: [[2320, 100, 46], [2321, 99, 46]], 21: [[2340, 67, 48], [2341, 62, 39]],\n        4: [[2360, 73, 51], [2361, 70, 53], [2362, 74, 52]],",
         "        3: [[2300, 95, 30], [2301, 98, 41]], 13: [[2320, 100, 46], [2321, 99, 46]], 21: [[2340, 67, 48]],\n        4: [[2341, 89, 37], [2360, 73, 51], [2361, 70, 53], [2362, 74, 52]],"),
        ("__put(65, 55, 4, 7);", "__put(95, 35, 4, 7);"),
        ("__put(65, 50, 7, 10);", "__put(95, 30, 7, 10);"),
        ("    await t.eval(\"(function(){ Lowy.state().camps.forceRab", "    await go(4, 6);\n    await t.eval(\"(function(){ Lowy.state().camps.forceRab"),
        ("__put(64, 51, 1, 3);", "__put(94, 31, 1, 3);"),
        ("Math.hypot(c.x - 66.5, c.y - 52.5) < 1", "Math.hypot(c.x - 96.5, c.y - 32.5) < 1"),
        ("__put(66, 26, 5, 8);", "__put(96, 47, 5, 8);"),
        ("__put(60, 46, 5, 8);", "__put(87, 44, 5, 8);"),
        ("na swoim miejscu (60,41) nocą, 2-4 ludzi, namiot widać\", rab && rab.fixed && rab.x === 60 && rab.y === 41", "na swoim miejscu (87,39) nocą, 2-4 ludzi, namiot widać\", rab && rab.fixed && rab.x === 87 && rab.y === 39"),
        ("    await go(23, 10);", "    await go(3, 10);", 3),
        ("Czarnych Oczu za dnia na (66,21):", "Czarnych Oczu za dnia na (96,42):"),
        ("czo.fixed && czo.x === 66 && czo.y === 21", "czo.fixed && czo.x === 96 && czo.y === 42"),
        ("__put(66, 21, 2, 4);", "__put(96, 42, 2, 4);"),
    ])
    PT("ludzie_test", [
        ("homes: [3, 4, 18, 21, 22, 159, 162].filter(m => TownLife.HOMES.has(m)),", "homes: [3, 4, 18, 21, 22, 159, 162].filter(m => TownLife.HOMES.has(m)),   // (2026-11-11: the pedlar stops on 4 and 3 only)"),
        ("ma „alt” na Map021 w dni mielerza", "ma „alt” na Łące (Map004) w dni mielerza"),
        ('JSON.stringify([21, "ludMielerz", true])', 'JSON.stringify([4, "ludMielerz", true])'),
        ("postoje handlarza (3, 4, 21, 22), menhiry (18), przylądek (159), garnizon (162)\", d.homes.length === 7", "postoje handlarza (3, 4), przylądek (159), garnizon (162)\", d.homes.length === 4"),
        ("        for (const m of [21, 22, 4, 3, 13, 125, 168]) {", "        for (const m of [4, 3, 13, 125, 168]) {"),
        ("        await t.go(21, 51, 21, 8);", "        await t.go(4, 48, 26, 8);", 2),
        ("        await t.go(21, 50, 21, 8, { calm: false });", "        await t.go(4, 47, 26, 8, { calm: false });"),
        ("mieszka wtedy na Leśnej drodze (alt) i stoi przy kopcu\", k.home === 21 && zb && !zb.hidden && zb.map === 21", "mieszka wtedy na Leśnej drodze (alt, Łąka) i stoi przy kopcu\", k.home === 4 && zb && !zb.hidden && zb.map === 4"),
        ("const stops = [[12, 22, [52, 23]], [13, 21, [54, 19]], [14, 4, [62, 13]], [15, 3, [61, 13]]], seen = [];", "const stops = [[12, 4, [62, 13]], [13, 3, [61, 13]], [14, 4, [62, 13]], [15, 3, [61, 13]]], seen = [];"),
        ("const wagon = m === 21 ? true : await shown({ 22: 2520, 4: 2554, 3: 2570 }[m]);", "const wagon = await shown({ 4: 2554, 3: 2570 }[m]);"),
        ("handlarz krąży: dzień % 4 = 0 Polna droga, 1 Leśna droga, 2 Łąka, 3 Kruczy Jar", "handlarz krąży: dzień % 2 = 0 Łąka, 1 Kruczy Jar"),
        ("spots = [[55, 12], [61, 11], [67, 8]], at = spots[k.spot];\n        await t.go(21, at[0], at[1] + 1, 8);", "spots = [[52, 15], [64, 14], [66, 16]], at = spots[k.spot];\n        await t.go(4, at[0], at[1] + 1, 8);"),
        ("spot = { 22: [52, 23], 21: [54, 19], 4: [62, 13], 3: [61, 13] }[m];", "spot = { 4: [62, 13], 3: [61, 13] }[m];"),
        ("        await t.go(18, 68, 34, 8);", "        await t.go(4, 47, 64, 8);"),
        ("at = [[40, 40], [60, 38], [72, 30]][k.spot];", "at = [[40, 50], [62, 45], [31, 54]][k.spot];"),
        ("        await t.go(stop.o.go[1], stop.o.go[2], stop.o.go[3], stop.o.go[4]);\n        const here = await resHere(\"handlarz\");", "        await t.go(8, 60, 60, 2);\n        await t.go(stop.o.go[1], stop.o.go[2], stop.o.go[3], stop.o.go[4]);\n        await t.frames(40);\n        const here = await resHere(\"handlarz\");"),
        ("pastwisku przy menhirach (Map018)\", c.home === 18 &&", "pastwisku przy menhirach (Łąka, drugie pastwisko)\", c.home === 4 &&"),
        ('        const e17 = await t.json("OkoliceData.ENTRY[17]");\n        await t.go(17, e17[0], e17[1], 8);', '        const e17 = await t.json("OkoliceData.ENTRY[4]");\n        await t.go(4, e17[0], e17[1], 8);'),
        ("przenosi na miejsce paczki (mielerz, Map021)\", row.go[1] === 21 && (await t.eval(\"$gameMap.mapId()\")) === 21", "przenosi na miejsce paczki (mielerz, Łąka)\", row.go[1] === 4 && (await t.eval(\"$gameMap.mapId()\")) === 4"),
    ])
    PT("w5_test", [
        ("    await go(23, 24, 1, 2);", "    await go(3, 87, 49, 2);", 3),
        ("    await go(22, 12, 2, 2);", "    await go(3, 76, 8, 2);", 5),
        ("obóz przemytników na Skraju lasu (Map023, noc)", "obóz przemytników na Skraju lasu (Kruczy Jar, noc)"),
        ("Hunting.setSneak(true); $gamePlayer.locate(30, 4);", "Hunting.setSneak(true); $gamePlayer.locate(93, 52);"),
        ("$gamePlayer.locate(25, 20); Kantor.promMen()", "$gamePlayer.locate(84, 16); Kantor.promMen()"),
        ("$gamePlayer.locate(31, 22);", "$gamePlayer.locate(90, 18);", 1),
        ("$gamePlayer.locate(29, 19);", "$gamePlayer.locate(88, 15);", 2),
    ])
    PT("field_loss_test", [
        ("    await t.until(t.onMap(23), 20);\n    await t.frames(40);\n    const D = await J(", "    await t.until(t.onMap(3), 20);\n    await t.frames(40);\n    const D = await J("),
        ("guard: ${shown(23, 704)}", "guard: ${shown(3, 704)}"),
        ("to Skraj lasu (1,13); 'Działka należy teraz do Lorda.' over the hero\",\n        escort && D.map === 23 && D.x === 1 && D.y === 13 &&", "out of the plot onto Kruczy Jar (40,47); 'Działka należy teraz do Lorda.' over the hero\",\n        escort && D.map === 3 && D.x === 40 && D.y === 47 &&"),
        ("D.dog.map === 23 && D.dog.mode", "D.dog.map === 3 && D.dog.mode"),
        ("    await t.eval(\"$gamePlayer.reserveTransfer(3, 78, 13, 4, 0); 0\");   // (2026-10-18: the field doubled to 80x60)\n    await t.frames(20);\n    await t.eval(\"$gamePlayer.locate(1, 13); $gameMap.event(99).start(); 0\");\n    await t.frames(30);",
         "    await t.go(8, 60, 60, 2);   // (2026-11-11: only the plot is refused now - a transfer from another map onto a cell inside its fence)\n    await t.eval(\"$gamePlayer.reserveTransfer(3, 60, 45, 8, 0); 0\");\n    await t.frames(30);"),
        ("the way onto the field refused (a transfer and the passage event): still Skraj lasu, the popup over the hero\", (await t.eval(\"$gameMap.mapId()\")) === 23", "the way onto the plot refused (a transfer onto a cell inside the fence): still the town, the popup over the hero\", (await t.eval(\"$gameMap.mapId()\")) === 8"),
        ("    await t.locate(2, 13, 4);", "    await t.go(3, 40, 47, 4);"),
        ("// ---- the burnt farm: the way from Skraj lasu", "// ---- the burnt farm: the way from Podgrodzie"),
        ("    await t.go(23, 77, 28, 6);", "    await t.go(111, 110, 22, 8);"),
        ("const way = await J(\"({ sign: ($gameMap.event(709) || { characterName: () => '' }).characterName(), way: [706, 707, 708].map(id => { const e = $gameMap.event(id); return e ? e.x + ',' + e.y : null; }) })\");",
         "const way = await J(\"(function(){ const f = re => $gameMap.events().find(e => e.event() && re.test(e.event().name)); const s = f(/^Drogowskaz: Spalona/), g = f(/^Brama: Spalona/); return { sign: s ? s.characterName() : '', gate: g ? [g.x, g.y] : null, gid: g ? g.eventId() : 0 }; })()\");"),
        ("    await t.locate(78, 28, 6);\n    await t.frames(10);\n    await t.shot(path.join(SHOTS, \"zagroda_wejscie.png\"));\n    await t.eval(\"$gameMap.event(707).start(); 0\");",
         "    await t.locate(110, 21, 8);\n    await t.frames(10);\n    await t.shot(path.join(SHOTS, \"zagroda_wejscie.png\"));\n    await t.eval(`$gameMap.event(${way.gid}).start(); 0`);"),
        ("E7 Skraj lasu's east edge (rows 27-29, Homes' events with the signpost) -> the burnt farm (Map168, 1,72 - its west edge, the world)", "E7 the gate in the north-east corner of Podgrodzie (110,20, with the signpost) -> the burnt farm (Map168, 1,25 - its west edge)"),
        ("way.way.join() === \"79,27,79,28,79,29\" && onFarm && Z0.x === 1 && Z0.y === 72", "way.gate.join() === \"110,20\" && onFarm && Z0.x === 1 && Z0.y === 25"),
        ("guard: $gameSelfSwitches.value([23, 704, 'A'])", "guard: $gameSelfSwitches.value([3, 704, 'A'])"),
        ("await t.go(23, 2, 13, 4) && (await t.go(3, 77, 44, 4))", "await t.go(3, 40, 47, 4) && (await t.go(3, 77, 44, 4))"),
    ])
    PT("okolice_integracja_test", [
        ("    await t.go(17, 66, 16);", "    await t.go(3, 20, 76);"),
    ])
