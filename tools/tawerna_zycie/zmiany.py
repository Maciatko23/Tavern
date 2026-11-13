# -*- coding: utf-8 -*-
# the patches (executed by popraw.py: patch(), map_patch(), wr(), rd() are in scope)

# ---------------------------------------------------------------- tests/tavern_life_test.js: the test of the rebuilt tavern (63 x 55)
patch("tests/tavern_life_test.js", [
    ('(101 x 55 since 2026-10-05)', '(63 x 55 since the rebuild of 2026-11-09; the bath and Wanda are on Map025 now)'),
    ('const { launch, sleep } = require("./cdp.js");\nconst fs = require("fs");\nconst path = require("path");\nconst SHOTS = path.join(__dirname, "..", "docs", "tawerna_zycie");',
     'const fs = require("fs");\nconst path = require("path");\n'
     '// (runs from tests/ and from the staging copy tools/tawerna_zycie/staging/tests/)\n'
     'const ROOT = [path.join(__dirname, ".."), path.join(__dirname, "..", "..", "..", "..")].find(d => fs.existsSync(path.join(d, "tests", "cdp.js")));\n'
     'const { launch, sleep } = require(path.join(ROOT, "tests", "cdp.js"));\nconst SHOTS = path.join(ROOT, "docs", "tawerna_zycie");'),
    # the events of the rebuilt maps (tags: the builders', now in the maps' own events)
    ('    borgar: 1, melia: 2, grum: 3, ozzy: 4, counter: 38, stage: 110, arm: 148, darts: 174, tub: 159, wanda: 172,\n'
     '    door1: 35, door2: 37, door3: 33, bed1: 136, bed2: 143, candle1: 132, komnataDoor: 9, komnataBed: 264, gate: 298,\n'
     '    zlotyDoor: 21, zlotyBed: 103, suiteDoor: 1\n};\nconst MEALTABLES = [60, 61, 77, 78, 188, 189];',
     '    borgar: 1, melia: 2, grum: 3, ozzy: 4, counter: 38, stage: 110, arm: 148, darts: 174, tub: 365, wanda: 367,\n'
     '    door1: 35, door2: 37, door3: 33, bed1: 136, bed2: 143, candle1: 132, komnataDoor: 9, komnataBed: 264, gate: 298,\n'
     '    zlotyDoor: 21, zlotyBed: 135, suiteDoor: 3\n};\nconst MEALTABLES = [60, 61, 77, 78];'),
    ('const inTavern = await go(MAP.hall, 49, 70, 8);', 'const inTavern = await go(MAP.hall, 14, 31, 8);'),
    ("tags: ['meal','mealtable','bath','stage','arm','darts','attendant'].map(", "tags: ['meal','mealtable','stage','arm','darts'].map("),
    ('check("the installed tavern (Map001, 101 x 55) with the builders\' tagged places", inTavern && map1.w === 101 && map1.h === 55 && map1.tags.join() === "meal:1,mealtable:6,bath:4,stage:1,arm:1,darts:2,attendant:1", map1);',
     'check("the rebuilt tavern (Map001, 63 x 55) with its tagged places (the bath and Wanda are upstairs on Map025)", inTavern && map1.w === 63 && map1.h === 55 && map1.tags.join() === "meal:1,mealtable:4,stage:1,arm:1,darts:2", map1);'),
    # rooms: the east staircase of Map001 (x 25-27, y 47) leads up to Map025, arriving at (x, 53)
    ('await ev("$gamePlayer.locate(38, 50); $gamePlayer.setDirection(8); 0");', 'await ev("$gamePlayer.locate(26, 50); $gamePlayer.setDirection(8); 0");'),
    ("// up the west staircase (its top steps are touch events -> Map025)", "// up the east staircase (its top steps are touch events -> Map025)"),
    ('check("up the stairs: Map025 \'Pokoje gości\', the landing (48,62)", upstairs && land.map === 25 && land.x === 48 && land.y === 62, land);',
     'check("up the stairs: Map025 \'Pokoje gości\', the landing (26,53)", upstairs && land.map === 25 && land.x === 26 && land.y === 53, land);'),
    ('await ev(`$gamePlayer.locate(38, 49); $gamePlayer.setDirection(8); 0`);', 'await ev(`$gamePlayer.locate(18, 17); $gamePlayer.setDirection(8); 0`);'),
    ('const inRoom = await walk("up", "$gamePlayer.x === 38 && $gamePlayer.y === 44 && !$gameMap.isEventRunning()", 15);\n'
     '        check("in through the door: its own page takes him inside (38,44)"',
     'const inRoom = await walk("up", "$gamePlayer.x === 18 && $gamePlayer.y === 11 && !$gameMap.isEventRunning()", 25);\n'
     '        check("in through the door: its own page takes him inside (18,11)"'),
    ('await ev(`$gamePlayer.locate(39, 40); $gamePlayer.setDirection(8); 0`);', 'await ev(`$gamePlayer.locate(18, 7); $gamePlayer.setDirection(8); 0`);'),
    ('await ev(`$gamePlayer.locate(38, 44); $gamePlayer.setDirection(2); 0`);', 'await ev(`$gamePlayer.locate(18, 11); $gamePlayer.setDirection(2); 0`);'),
    ('const out = await walk("down", "$gamePlayer.x === 38 && $gamePlayer.y === 49 && !$gameMap.isEventRunning()", 15);',
     'const out = await walk("down", "$gamePlayer.x === 18 && $gamePlayer.y === 16 && !$gameMap.isEventRunning()", 25);'),
    ('await ev(`$gamePlayer.locate(58, 44); 0`);', 'await ev(`$gamePlayer.locate(27, 8); 0`);'),
    ('await ev(`$gamePlayer.locate(58, 49); 0`);', 'await ev(`$gamePlayer.locate(27, 17); 0`);'),
    # Map026: a suite's door without a bed (the Lord's suite)
    ('await go(MAP.suites, 16, 21, 8);', 'await go(MAP.suites, 3, 24, 8);'),
    ('check("Map026: a suite\'s door (room=suite1, no bed): only its own words, its self switch untouched", /Zamknięte\\. Apartament można wynająć u Borgara/.test(suite.flat)',
     'check("Map026: a suite\'s door (room=lordsuite, no bed): only its own words, its self switch untouched", /Zamknięte\\. Apartament zarezerwowany dla gości Lorda/.test(suite.flat)'),
    # the bath: Map025 now
    ('await go(MAP.hall, 6, 59, 8);', 'await go(MAP.rooms, 40, 26, 8);', 2),
    ('check("Wanda (event 172, <Tavern:attendant>)', 'check("Wanda (event 367, <Tavern:attendant>)'),
    # the stage, arm-wrestling, darts
    ('await go(MAP.hall, 72, 36, 8);', 'await go(MAP.hall, 38, 36, 8);'),
    ('await go(MAP.hall, 92, 39, 8);', 'await go(MAP.hall, 58, 36, 8);'),
    ('await go(MAP.hall, 89, 59, 8);', 'await go(MAP.hall, 51, 50, 8);'),
    # reputation
    ('await go(MAP.rooms, 67, 18, 8);', 'await go(MAP.rooms, 42, 50, 8);'),
    ('await go(MAP.hall, 49, 70, 8);', 'await go(MAP.hall, 14, 31, 8);'),
    ('await go(MAP.rooms, 67, 17, 8);\n        const inKomnata = await walk("up", "$gamePlayer.x === 67 && $gamePlayer.y === 12 && !$gameMap.isEventRunning()", 15);\n'
     '        check("upstairs the chamber\'s door lets him in (67,12)"',
     'await go(MAP.rooms, 42, 50, 8);\n        const inKomnata = await walk("up", "$gamePlayer.x === 42 && $gamePlayer.y === 44 && !$gameMap.isEventRunning()", 25);\n'
     '        check("upstairs the chamber\'s door lets him in (42,44)"'),
    ('await ev(`$gamePlayer.locate(67, 29); $gamePlayer.setDirection(2); 0`);\n        await frames(20);\n'
     '        const inZloty = await walk("down", "$gamePlayer.x === 67 && $gamePlayer.y === 35 && !$gameMap.isEventRunning()", 15);\n'
     '        check("in through the Apartament\'s door (67,35)"',
     'await ev(`$gamePlayer.locate(27, 24); $gamePlayer.setDirection(2); 0`);\n        await frames(20);\n'
     '        const inZloty = await walk("down", "$gamePlayer.x === 27 && $gamePlayer.y === 30 && !$gameMap.isEventRunning()", 25);\n'
     '        check("in through the Apartament\'s door (27,30)"'),
    # Natchniony: the hero is brought to 0 xp first (the discoveries of the floors upstairs, +50 each, had him on the edge of level 2)
    ('const xp0 = await J("({ lv: Combat.hero().level, xp: Combat.hero().xp })");',
     'await ev("Combat.hero().xp = 0; 0");\n        const xp0 = await J("({ lv: Combat.hero().level, xp: Combat.hero().xp })");'),
    # the welcome at the gate: caught as it is said (SpeechBubbles.log keeps 20 and the busy tavern's other talk pushes the bell's welcome out before the check)
    ('SpeechBubbles.log.slice(-4)', 'window.__gateBarks'),
    ('await go(MAP.rooms, 92, 18, 8);', 'await ev("window.__gateBarks = []; const _say = SpeechBubbles.say; SpeechBubbles.say = function(ch, text) { if (/Witamy/.test(String(text))) window.__gateBarks.push(String(text)); return _say.apply(this, arguments); }; 0");\n        await go(MAP.rooms, 2, 52, 8);'),
    # the way DOWN: Map025's east stairs (x 25-27, y 47) lead back to Map001 (x, 53)
    ('        // an Apartamenty door without a bed to rent: words only, the plugin leaves it alone\n',
     '        await go(MAP.rooms, 26, 50, 8);\n'
     '        const downstairs = await walk("up", onMap(MAP.hall), 25);\n'
     '        const dland = await J("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");\n'
     '        check("down the stairs: Map025\'s east stairs lead back to the tavern, Map001 at the stairs\' foot (26,53)", downstairs && dland.map === 1 && dland.x === 26 && dland.y === 53, dland);\n'
     '        // an Apartamenty door without a bed to rent: words only, the plugin leaves it alone\n'),
])

# ---------------------------------------------------------------- TavernLife_Render.js: the breakfast tray lies ON the bed, whatever row its picture stands in
patch("js/plugins/TavernLife_Render.js", [
    ('                case "tray":\n                    s.x = p.x; s.y = p.y - 6; s.z = 3;\n                    s._sortY = s.y + 40;   // (on the blanket: over the bed)\n',
     '                case "tray":\n                    s.x = p.x; s.y = p.y - 6; s.z = 3;\n'
     '                    s._sortY = Math.max(s.y + 40, coverBottom(o.x, o.y) + 1);   // (on the blanket: over the bed - and over its picture, which may stand a row below the bed\'s tag)\n'),
    ('    // every map frame: move what moves, draw what changed, take away what is over\n',
     '    // the bottom edge (screen px) of the lowest picture event (a bed, a chest) covering the tile of (x, y), by its <Occupy:...> - what a thing lying on it must come after\n'
     '    function coverBottom(x, y) {\n'
     '        const tx = Math.round(x), ty = Math.round(y);\n'
     '        let bottom = 0;\n'
     '        for (const e of $gameMap.events()) {\n'
     '            if (!e.characterName() || e.isThrough() || !e.isNormalPriority()) continue;\n'
     '            const m = /<Occupy:([^>]*)>/i.exec((e.event() && e.event().note) || ""), o = { left: 0, right: 0, up: 0, down: 0 };\n'
     '            if (m) for (const part of m[1].split(",")) { const [k, v] = part.split("=").map(t => t.trim()); if (k in o) o[k] = Number(v) || 0; }\n'
     '            if (tx >= e.x - o.left && tx <= e.x + o.right && ty >= e.y - o.up && ty <= e.y + o.down) bottom = Math.max(bottom, e.screenY());\n'
     '        }\n'
     '        return bottom;\n'
     '    }\n'
     '    // every map frame: move what moves, draw what changed, take away what is over\n'),
])

# ---------------------------------------------------------------- TavernLife.js: the tray in the middle of a wide bed (<Occupy:right=1> = two tiles wide)
patch("js/plugins/TavernLife.js", [
    ('        if (bed) addFx({ kind: "tray", x: bed.ev.x, y: bed.ev.y + 0.75, life: 3600 });\n',
     '        if (bed) {   // (in the middle of the bed: a bed <Occupy:right=1> is two tiles wide)\n'
     '            const wide = /<Occupy:[^>]*right=(\\d+)/i.exec((bed.ev.event() && bed.ev.event().note) || "");\n'
     '            addFx({ kind: "tray", x: bed.ev.x + (wide ? Number(wide[1]) / 2 : 0), y: bed.ev.y + 0.75, life: 3600 });\n'
     '        }\n'),
])

# ---------------------------------------------------------------- Map001: the 4 meal seats on real stools beside the long tables, facing the table side-on
# (invisible markers; the old plate=dx,dy is not read by the plugin since 2026-10-07 and is dropped from the tags). Tables stand at x = 3, 6, 9 and
# 19, 22, 25 (rows 38-39 and 41-42); the stools beside them. The Wesele's tables use rows 33-35, the guests of Goscie_Sala skip a chair with an
# event of its own on it.
SEATS_NEW = {60: (2, 42, 6), 61: (5, 42, 6), 77: (18, 42, 6), 78: (23, 42, 4)}
def seats(m):
    for i, (x, y, d) in SEATS_NEW.items():
        e = m["events"][i]
        assert e["name"].startswith("Tavern:mealtable"), e["name"]
        e["x"], e["y"] = x, y
        c = e["pages"][0]["list"][0]
        assert c["code"] == 108 and c["parameters"][0].startswith("<Tavern:mealtable"), c
        c["parameters"][0] = "<Tavern:mealtable dir=%d>" % d
map_patch(1, seats)
