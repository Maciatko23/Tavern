

# ====================================================================================================================
# 2. Ludzie (K63 mielerz, K64 owca, K65 juk, handlarz, pastwisko przy menhirach): Leśna droga / Omszała łąka / Polna droga -> Łąka (4)
# ====================================================================================================================
def sec_ludzie():
    LD, L = PLUG("Ludzie_Data"), PLUG("Ludzie")
    PR(LD, [
        ("    const MAP = { droga: 21, polna: 22, laka: 4, domek: 3, menhiry: 18, omszala: 17, gory: 13, przystan: 125, jaskinia: 177, zagroda: 168,\n",
         "    // (2026-11-11 plansza: the kiln, the pedlar's home stop and the lost sheep are on Łąka (4); menhiry 18 is only the key of the second pasture)\n"
         "    const MAP = { droga: 4, polna: 4, laka: 4, domek: 3, menhiry: 18, omszala: 4, gory: 13, przystan: 125, jaskinia: 177, zagroda: 168,\n"),
        # the places (Okolice.registerSpots): the kiln, the shed, the lost pack, the second pasture
        ('        { key: "mielerz", map: 21, kind: "kiln", mode: "reach", x: 48, y: 17, w: 3, h: 3 },\n'
         '        { key: "szalas_wegl", map: 21, kind: "shed", mode: "reach", x: 52, y: 20, w: 3, h: 2 },\n'
         '        { key: "postoj_021", map: 21, kind: "wagon", mode: "reach", x: 54, y: 16, w: 2, h: 2 },\n'
         '        { key: "juk_021", map: 21, kind: "pack", mode: "reach", cells: [[55, 12], [61, 11], [67, 8]] },\n'
         '        { key: "postoj_handlarza", map: 22, kind: "wagon", mode: "reach", x: 49, y: 19, w: 6, h: 4 },\n',
         '        { key: "mielerz", map: 4, kind: "kiln", mode: "reach", x: 45, y: 22, w: 3, h: 3 },\n'
         '        { key: "szalas_wegl", map: 4, kind: "shed", mode: "reach", x: 49, y: 23, w: 3, h: 2 },\n'
         '        { key: "postoj_021", map: 21, kind: "wagon", mode: "reach", x: 54, y: 16, w: 2, h: 2 },   // (parked since 2026-11-11: the pedlar keeps two stops, Łąka and Kruczy Jar; its words stay)\n'
         '        { key: "juk_021", map: 4, kind: "pack", mode: "reach", cells: [[52, 15], [64, 14], [66, 16]] },\n'
         '        { key: "postoj_handlarza", map: 22, kind: "wagon", mode: "reach", x: 49, y: 19, w: 6, h: 4 },   // (parked, as above)\n'),
        ('        { key: "pastwisko_018", map: 18, kind: "pasture", mode: "reach", x: 65, y: 29, w: 7, h: 5 },\n'
         '        { key: "owca_017", map: 17, kind: "sheep", mode: "reach", cells: [[40, 40], [60, 38], [72, 30]] },\n',
         '        { key: "pastwisko_018", map: 4, kind: "pasture", mode: "reach", x: 44, y: 61, w: 7, h: 5 },\n'
         '        { key: "owca_017", map: 4, kind: "sheep", mode: "reach", cells: [[40, 50], [62, 45], [31, 54]] },\n'),
        ('        { key: "lud_mielerz", map: 21, x: 49, y: 20, near: 2, icon: 334 },\n', '        { key: "lud_mielerz", map: 4, x: 46, y: 25, near: 2, icon: 334 },\n'),
        ('        { key: "lud_postoj", map: 22, x: 51, y: 21, near: 2, icon: 496 },\n', '        { key: "lud_postoj", map: 4, x: 61, y: 13, near: 2, icon: 496 },\n'),
        # the pedlar: two stops (Łąka, Kruczy Jar)
        ('        stops: [22, 21, 4, 3], dawn: 6,                          // the pedlar: d % 4 -> the map (a "day" from 6:00)\n',
         '        stops: [4, 3], dawn: 6,                                  // the pedlar: d % 2 -> the map (a "day" from 6:00); 2026-11-11: Polna droga and Leśna droga are gone\n'),
        # the shepherd with the flock by the menhirs: the same map now (a second pasture on Łąka); the menhirs stand on Łąka too
        ('                map: MAP.menhiry, when: "ludPasterz018",\n', '                map: MAP.laka, when: "ludPasterz018",\n'),
        # the spots of the residents
        ("        21: { mielerz_praca: [51, 19, 4], mielerz_obchod: [50, 21, 8], szalas_przed: [53, 22, 2], szalas_drzwi: [53, 22, 8],\n"
         "              handlarz_lada: [54, 17, 2], handlarz_sen: [54, 16, 6], handlarz_woz: [54, 16, 6] },\n"
         "        22: { handlarz_lada: [53, 21, 2], handlarz_sen: [54, 22, 4], handlarz_woz: [52, 21, 8] },\n"
         "        4: { koszar_brama: [52, 44, 8], pastwisko: [46, 46, 2], pastwisko_cien: [44, 44, 2], pastwisko_brzeg: [50, 45, 4],\n",
         "        4: { mielerz_praca: [48, 24, 4], mielerz_obchod: [47, 26, 8], szalas_przed: [50, 26, 2], szalas_drzwi: [50, 26, 8],   // (the kiln, 2026-11-11: was Map021 (51,19))\n"
         "             pastwisko_018: [47, 63, 2], pastwisko_018_kamien: [45, 62, 6],   // (the second pasture by the menhirs, Łąka (44,61))\n"
         "             koszar_brama: [52, 44, 8], pastwisko: [46, 46, 2], pastwisko_cien: [44, 44, 2], pastwisko_brzeg: [50, 45, 4],\n"),
        ("        18: { pastwisko_018: [68, 31, 2], pastwisko_018_kamien: [66, 30, 6] },\n", ""),
        # the quests' places
        ("    const JUK_SPOTS = [[55, 12], [61, 11], [67, 8]];\n    const SHEEP_SPOTS = [[40, 40], [60, 38], [72, 30]];\n",
         "    const JUK_SPOTS = [[52, 15], [64, 14], [66, 16]];   // (Łąka, east of the kiln; was Map021)\n    const SHEEP_SPOTS = [[40, 50], [62, 45], [31, 54]];   // (Łąka, round the fold; was Map017)\n"),
        ("    const PASTURE = { 4: { x: 43, y: 44, w: 7, h: 6 }, 18: { x: 65, y: 29, w: 7, h: 5 } };\n",
         "    const PASTURE = { 4: { x: 43, y: 44, w: 7, h: 6 }, 18: { x: 44, y: 61, w: 7, h: 5 } };   // (18: the second pasture on Łąka (44,61), by the menhirs; the key is only a name)\n"),
        ("    const KILN_AT = { x: 49, y: 19 }, SHED_AT = { x: 53, y: 21 };\n", "    const KILN_AT = { x: 46, y: 24 }, SHED_AT = { x: 50, y: 24 };   // (Łąka; was Map021 (49,19), (53,21))\n"),
        ("        22: { woz: [51, 20], osiol: [49, 20], ogien: [53, 22] },\n        21: { ogien: [55, 16], tobol: [55, 17] },\n", ""),
        ("    const KILN_AMBUSH = { map: 21, r: 14, kinds:", "    const KILN_AMBUSH = { map: 4, r: 14, kinds:"),
    ])
    PR(L, [
        ("    const stopIndex = () => ((workDay(D.CYCLE.dawn) % 4) + 4) % 4;\n",
         "    const stopIndex = () => ((workDay(D.CYCLE.dawn) % D.CYCLE.stops.length) + D.CYCLE.stops.length) % D.CYCLE.stops.length;\n"),
        # the flock: always on Łąka; "by the menhirs" = the second pasture there
        ('    // where the flock is now: 18 (by the menhirs) or 4; "pasture" / "fold"\n    const flockMap = () => (pasterz018() ? M.menhiry : M.laka);\n',
         '    // where the flock is now: always Łąka (4); on the shepherd\'s third day on the second pasture by the menhirs; "pasture" / "fold"\n'
         "    const flockMap = () => M.laka;\n"
         "    const pastureNow = () => D.PASTURE[pasterz018() ? M.menhiry : M.laka];\n"),
        ('        const id = $gameMap.mapId(), fm = flockMap();\n        if (id === M.menhiry) return fm === M.menhiry ? "pasture" : "";\n        if (id !== M.laka) return "";\n        if (fm === M.menhiry) return "";\n        return flockOut() ? "pasture" : "fold";\n',
         '        const id = $gameMap.mapId();\n        if (id !== flockMap()) return "";\n        return flockOut() || pasterz018() ? "pasture" : "fold";\n'),
        ('            const n = flockSize(), z = D.PASTURE[sheepMap], cells = want === "pasture" ? zoneCells(z) : D.FOLD.cells.slice();\n            for (let i = 0; i < n && cells.length; i++) {',
         '            const n = flockSize(), z = pastureNow(), cells = want === "pasture" ? zoneCells(z) : D.FOLD.cells.slice();\n            flockZone = z;\n            for (let i = 0; i < n && cells.length; i++) {'),
        ('    let sheep = [], flockMode = "", sheepMap = 0;\n', '    let sheep = [], flockMode = "", sheepMap = 0, flockZone = null;\n'),
        ('        const want = flockWanted();\n        if (want === flockMode) return;\n        const flock = sheep.filter(a => a._lud.role === "flock");\n',
         '        const want = flockWanted();\n        if (want === flockMode && (want !== "pasture" || flockZone === pastureNow())) return;   // (the shepherd\'s third day: the flock walks over to the second pasture)\n        const flock = sheep.filter(a => a._lud.role === "flock");\n'),
        ('        const z = D.PASTURE[sheepMap], cells = want === "pasture" ? zoneCells(z) : D.FOLD.cells.slice();\n        flock.forEach((a, i) => {',
         '        const z = pastureNow(), cells = want === "pasture" ? zoneCells(z) : D.FOLD.cells.slice();\n        flockZone = z;\n        flock.forEach((a, i) => {'),
        # the kiln's and the pedlar's stop events: two plain ifs (Łąka has both now); the pedlar's old Leśna droga fire and bundle are gone
        ('            out.push(fireEv(EV.ogien021, D.STOPS[21].ogien, "ogien"));\n'
         '            out.push(eventData(EV.tobol021, TK.kod.build[2], D.STOPS[21].tobol[0], D.STOPS[21].tobol[1], { key: "tobol", img: ["!$Lud_Juk", 0, 2, 1] }));\n', ""),
        ("        } else if (mapId === M.polna || mapId === M.laka || mapId === M.domek) {\n",
         "        }\n        if (mapId === M.polna || mapId === M.laka || mapId === M.domek) {   // (Łąka has the kiln AND the pedlar's stop since 2026-11-11)\n"),
        ("            setShown(evOf(EV.ogien021), stop === M.droga && night);\n            setShown(evOf(EV.tobol021), stop === M.droga);\n", ""),
        ("        } else if (D.STOPS[id] && id !== M.droga) {\n", "        }\n        if (D.STOPS[id]) {\n"),
        # F9
        ("        [21, 49, 21, 8], [21, 53, 23, 8], [22, 52, 23, 8],\n        [21, 54, 18, 8], [4, 62, 12, 8], [3, 61, 12, 8],\n        [4, 52, 45, 8], [18, 68, 34, 8], [17, 60, 40, 8],\n        [21, 55, 13, 8], [13, 101, 101, 8], [13, 105, 97, 8],\n",
         "        [4, 46, 26, 8], [4, 50, 26, 8], [4, 62, 13, 8],\n        [3, 62, 13, 8], [4, 62, 12, 8], [3, 61, 12, 8],\n        [4, 52, 45, 8], [4, 47, 64, 8], [4, 62, 46, 8],\n        [4, 52, 16, 8], [13, 101, 101, 8], [13, 105, 97, 8],\n"),
        ('return { go: ["Mielerz", 21, 49, 21, 8] }; }', 'return { go: ["Mielerz", 4, 46, 26, 8] }; }'),
        ("jumpDay(d => ((d % 4) + 4) % 4 === i, 10); const p = PLACES.find(x => x[1] === m && /Postój/.test(x[0])); return { go: p || [TK.kod.ok[1], m, 50, 20, 2] }; }",
         "jumpDay(d => ((d % D.CYCLE.stops.length) + D.CYCLE.stops.length) % D.CYCLE.stops.length === i, 10); const p = PLACES.find(x => x[1] === m && /Postój/.test(x[0])); return { go: p || [TK.kod.ok[1], m, 62, 13, 2] }; }"),
        ("return { go: [TK.kod.ok[2], 18, 68, 34, 8] }; }", "return { go: [TK.kod.ok[2], 4, 47, 64, 8] }; }"),
        ("f9Stop = row.pick = ((row.pick || 0) + delta + 4) % 4;", "f9Stop = row.pick = ((row.pick || 0) + delta + D.CYCLE.stops.length) % D.CYCLE.stops.length;"),
    ])
