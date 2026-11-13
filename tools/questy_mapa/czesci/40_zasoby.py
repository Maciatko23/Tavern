

# ====================================================================================================================
# 4. Zasoby (D30 Jagna, polanka, kręgi grzybów, źródełka 017 / 021): Omszała łąka -> Kruczy Jar (3), Leśna droga spring -> Łąka (4)
# ====================================================================================================================
def sec_zasoby():
    ZD, Z, OD = PLUG("Zasoby_Data"), PLUG("Zasoby"), PLUG("Okolice_Data")
    R1 = [[43, 71], [45, 72], [46, 74], [45, 76], [43, 77], [41, 76], [40, 74], [41, 72]]
    R2 = [[52, 71], [54, 72], [55, 74], [54, 76], [52, 77], [50, 76], [49, 74], [50, 72]]
    j = lambda c: json.dumps(c).replace(" ", "").replace(",", ", ")
    # --- Zasoby_Data.js
    PR(ZD, [
        ("        17: [2100, 2129], 21: [2130, 2139], 13: [2140, 2154], 155: [2155, 2164], 168: [2165, 2184], 3: [2185, 2204],\n",
         "        // (2026-11-11 plansza: Omszała łąka (17) is built on Kruczy Jar (3) now - its ids 2100-2129 join Map003's; the spring of Leśna droga (21) is on Łąka (4))\n"
         "        17: [2100, 2129], 21: [2130, 2139], 4: [2130, 2139], 13: [2140, 2154], 155: [2155, 2164], 168: [2165, 2184], 3: [2100, 2204],\n"),
        ('        { key: "zrodlo_017", map: 17, x: 70, y: 54, w: 3, h: 2, sx: 71, sy: 54, id: 2100,',
         '        { key: "zrodlo_017", map: 3, x: 39, y: 79, w: 3, h: 2, sx: 40, sy: 79, id: 2100,'),
        ('        { key: "zrodlo_021", map: 21, x: 23, y: 42, w: 3, h: 2, sx: 24, sy: 42, id: 2130,',
         '        { key: "zrodlo_021", map: 4, x: 41, y: 28, w: 3, h: 2, sx: 42, sy: 28, id: 2130,'),
        ("        { key: \"grzyby_krag1\", centre: [54, 44], ids: [2107, 2108, 2109, 2110, 2111, 2112, 2113, 2114],\n"
         "          cells: [[54, 41], [56, 42], [57, 44], [56, 46], [54, 47], [52, 46], [51, 44], [52, 42]] },\n"
         "        { key: \"grzyby_krag2\", centre: [63, 44], ids: [2115, 2116, 2117, 2118, 2119, 2120, 2121, 2122],\n"
         "          cells: [[63, 41], [65, 42], [66, 44], [65, 46], [63, 47], [61, 46], [60, 44], [61, 42]] }\n",
         "        { key: \"grzyby_krag1\", centre: [43, 74], ids: [2107, 2108, 2109, 2110, 2111, 2112, 2113, 2114],\n"
         "          cells: %s },\n"
         "        { key: \"grzyby_krag2\", centre: [52, 74], ids: [2115, 2116, 2117, 2118, 2119, 2120, 2121, 2122],\n"
         "          cells: %s }\n" % (j(R1), j(R2))),
        ('    const GLADE = { map: 17, x: 65, y: 12, w: 5, h: 3, stand: [67, 15],\n'
         '        herbs: [{ id: 2104, kind: "arcydziegiel", x: 66, y: 12 }, { id: 2105, kind: "dziurawiec", x: 68, y: 13 }, { id: 2106, kind: "kozlek", x: 66, y: 14 }] };\n',
         '    // (2026-11-11 plansza: Omszała łąka is the south-west of Kruczy Jar (3); the glade was Map017 (65,12))\n'
         '    const GLADE = { map: 3, x: 18, y: 72, w: 5, h: 3, stand: [20, 75],\n'
         '        herbs: [{ id: 2104, kind: "arcydziegiel", x: 19, y: 72 }, { id: 2105, kind: "dziurawiec", x: 21, y: 73 }, { id: 2106, kind: "kozlek", x: 19, y: 74 }] };\n'),
        ('    const JAGNA_SPOTS = { jagna_polanka: [67, 15, 8], jagna_krag: [58, 44, 2], jagna_las: [69, 16, 2] };\n',
         '    const JAGNA_SPOTS = { jagna_polanka: [20, 75, 8], jagna_krag: [47, 74, 2], jagna_las: [22, 76, 2] };\n'),
        ('        key: "jagna", id: 2900, sheet: "$Npc_Jagna", map: 17, speed: 2,\n', '        key: "jagna", id: 2900, sheet: "$Npc_Jagna", map: 3, speed: 2,\n'),
        ('    const JAGNA_SPOT = { key: "jagna_miejsce", map: 17, kind: "npc", mode: "zone", x: 67, y: 15, w: 1, h: 1 };\n',
         '    const JAGNA_SPOT = { key: "jagna_miejsce", map: 3, kind: "npc", mode: "zone", x: 20, y: 75, w: 1, h: 1 };\n'),
        ('        { key: "grzyby_krag1", map: 17, x: 54, y: 44, near: -1 },\n        { key: "grzyby_krag2", map: 17, x: 63, y: 44, near: -1 },\n        { key: "ziola_jagny", map: 17, x: 67, y: 13, near: 2 },\n',
         '        { key: "grzyby_krag1", map: 3, x: 43, y: 74, near: -1 },\n        { key: "grzyby_krag2", map: 3, x: 52, y: 74, near: -1 },\n        { key: "ziola_jagny", map: 3, x: 20, y: 73, near: 2 },\n'),
        ("        TLD.SPOTS_BY_MAP[17] = Object.assign({}, TLD.SPOTS_BY_MAP[17] || {}, JAGNA_SPOTS);\n",
         "        TLD.SPOTS_BY_MAP[3] = Object.assign({}, TLD.SPOTS_BY_MAP[3] || {}, JAGNA_SPOTS);\n"),
    ])
    # --- Zasoby.js: Map017's events are built with Map003's; the spring of Map021 goes to Map004
    PR(Z, [
        ("    // ---- Map017: the spring, Jagna's glade, the fairy rings\n    T.inject(17, { ids: D.IDS[17], owner: PLUGIN, build: () => {\n        const out = springEvents(springOf(17));\n",
         "    // ---- Omszała łąka (2026-11-11 plansza: the south-west of Kruczy Jar, Map003): the spring, Jagna's glade, the fairy rings - built with Map003's events\n"
         "    const omszalaEvents = () => {\n        const out = springEvents(springOf(3));\n"),
        ('            reg(17, h.id, "herb", { kind: h.kind, glade: true, x: h.x, y: h.y });\n', '            reg(3, h.id, "herb", { kind: h.kind, glade: true, x: h.x, y: h.y });\n'),
        ('            reg(17, id, "mushroom", { ring: r.key, i, look: [2 + 2 * ((i + ri) % 2), (i * 2 + ri) % 3] });\n',
         '            reg(3, id, "mushroom", { ring: r.key, i, look: [2 + 2 * ((i + ri) % 2), (i * 2 + ri) % 3] });\n'),
        ("        return withBlanks(17, out);\n    } });\n    T.inject(21, { ids: D.IDS[21], owner: PLUGIN, build: () => withBlanks(21, springEvents(springOf(21))) });\n",
         "        return out;\n    };\n    // (Leśna droga's spring is on Łąka (4) now)\n    T.inject(4, { ids: D.IDS[4], owner: PLUGIN, build: () => withBlanks(4, springEvents(springOf(4))) });\n"),
        ("        return withBlanks(3, out);\n    } });\n\n    // ---- Map111: the gardens", "        return withBlanks(3, out.concat(omszalaEvents()));\n    } });\n\n    // ---- Map111: the gardens"),
        ("        if (!has() || mapId() !== 17 || !night(hour())) return;\n", "        if (!has() || mapId() !== 3 || !night(hour())) return;\n"),
        ('["polanka", 17, 67, 16, 8],\n        ["krag", 17, 54, 45, 8],', '["polanka", 3, 20, 76, 8],\n        ["krag", 3, 43, 75, 8],'),
    ])
    # --- Okolice_Data.js: the plan's places of package A (until the package registers its own)
    PR(OD, [
        ('        {key: "zrodlo_017", pkg: "A", map: 17, kind: "spring", name: "Źródełko w mchu", mode: "reach", x: 70, y: 54, w: 3, h: 2},\n',
         '        {key: "zrodlo_017", pkg: "A", map: 3, kind: "spring", name: "Źródełko w mchu", mode: "reach", x: 39, y: 79, w: 3, h: 2},   // (2026-11-11 plansza: Omszała łąka = Kruczy Jar south-west; was Map017)\n'),
        ('        {key: "zrodlo_021", pkg: "A", map: 21, kind: "spring", name: "Źródełko w lesie", mode: "reach", x: 23, y: 42, w: 3, h: 2},\n',
         '        {key: "zrodlo_021", pkg: "A", map: 4, kind: "spring", name: "Źródełko w lesie", mode: "reach", x: 41, y: 28, w: 3, h: 2},   // (Leśna droga = Łąka north-west; was Map021)\n'),
        ('        {key: "grzyby_krag1", pkg: "A", map: 17, kind: "ring", name: "Czarci krąg", mode: "reach", cells: [[54, 41], [56, 42], [57, 44], [56, 46], [54, 47], [52, 46], [51, 44], [52, 42], [54, 44]]},\n'
         '        {key: "grzyby_krag2", pkg: "A", map: 17, kind: "ring", name: "Czarci krąg (drugi)", mode: "reach", cells: [[63, 41], [65, 42], [66, 44], [65, 46], [63, 47], [61, 46], [60, 44], [61, 42], [63, 44]]},\n'
         '        {key: "ziola_jagny", pkg: "A", map: 17, kind: "herbs", name: "Polanka Jagny", mode: "reach", x: 65, y: 12, w: 5, h: 3},\n',
         '        {key: "grzyby_krag1", pkg: "A", map: 3, kind: "ring", name: "Czarci krąg", mode: "reach", cells: %s},\n'
         '        {key: "grzyby_krag2", pkg: "A", map: 3, kind: "ring", name: "Czarci krąg (drugi)", mode: "reach", cells: %s},\n'
         '        {key: "ziola_jagny", pkg: "A", map: 3, kind: "herbs", name: "Polanka Jagny", mode: "reach", x: 18, y: 72, w: 5, h: 3},\n' % (j(R1 + [[43, 74]]), j(R2 + [[52, 74]]))),
    ])
