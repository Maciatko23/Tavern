

# ====================================================================================================================
# 7. Pockets as part of the world: SwiatData.extra (F9 pickers, ...), Debug.js, the island map's interiors, K51's raven (Kruk.js)
# ====================================================================================================================
POCKET_MAPS = [120, 121, 122, 123, 124, 155, 156, 157, 168, 169]   # (Osada Milczących + its four rooms, Pustelnia + Skryptorium + Urwisko, Spalona zagroda + Dom Ługów)
MINE_MAPS = [175, 213]                                              # (Orla Grań and the mine: the mine agent builds them; they belong to the world from here on)
GATE125 = (101, 95)          # Przystań, beside the lighthouse hill (x 86-98, y 98-110) on the cliff path: the gate "Ścieżka na klif" (posts at x-1, x+1)
SIGN125 = (104, 96)          # its signpost
HERMIT_IN = (22, 70)         # Pustelnia (Map155): the landing beside the south edge (21-23,71)
GATE13 = (6, 27)             # Góry: the Silent's gate (it exists: event 6); the cell below it is the landing back
OSADA_IN = (46, 65)          # Map120: the landing at the south edge (45-47,67), the old way in

def sec_swiat():
    ext = POCKET_MAPS + MINE_MAPS
    SW = PLUG("Swiat_Data")
    P(SW, "        // id mapy: [x0, y0, szerokość, wysokość] w kratkach świata\n        maps: {",
      "        // (2026-11-11 questy_mapa) maps that are not on the board but are part of the world: the three pockets (Osada Milczących, Pustelnia + Urwisko,\n"
      "        // Spalona zagroda: each through one gate of a board map) and the mine with Orla Grań - no seams, no world position; the F9 pickers read it\n"
      "        extra: %s,\n        // id mapy: [x0, y0, szerokość, wysokość] w kratkach świata\n        maps: {" % json.dumps(ext))
    D = PLUG("Debug")
    PR(D, [
        ("    const inWorld = map => !window.SwiatData || !SwiatData.maps || !!SwiatData.maps[map] || WORLD_EXTRA.includes(Number(map));\n",
         "    // (2026-11-11) SwiatData.extra: the pockets (Osada Milczących, Pustelnia + Urwisko, Spalona zagroda) and the mine with Orla Grań belong to the world too\n"
         "    const inWorld = map => !window.SwiatData || !SwiatData.maps || !!SwiatData.maps[map] || (SwiatData.extra || []).includes(Number(map)) || WORLD_EXTRA.includes(Number(map));\n"),
        ('    const OFF_ORZEL = ["kradziez", "gran"];\n    const OFF_CHAPTERS = { kantor: [6] };\n',
         '    const OFF_ORZEL = (window.SwiatData && (SwiatData.extra || []).includes(175)) ? [] : ["kradziez", "gran"];   // (the Orla Grań is in the world now: through the mine)\n'
         '    const OFF_CHAPTERS = {};   // (2026-11-11: W5 chapter 6, the ferry night, is on Kruczy Jar now)\n'),
        ('"Lowy:den": false,', '"Lowy:den": [FIGHT_TAB, "lowy", 1],'),
        ('"Lowy:rab": false, "Lowy:czo": false,', '"Lowy:rab": [FIGHT_TAB, "lowy", 5], "Lowy:czo": [FIGHT_TAB, "lowy", 6],'),
        ('"Lowy:strays": false,', '"Lowy:strays": [FIGHT_TAB, "lowy", 9],'),
        ('"Ludzie:kiln": false, "Ludzie:stop": false, "Ludzie:p018": false,',
         '"Ludzie:kiln": [STORY_TAB, "ludziePaczka", 1], "Ludzie:stop": [STORY_TAB, "ludziePaczka", 2], "Ludzie:p018": [STORY_TAB, "ludziePaczka", 3],'),
        ('"Zakon:grove": false,', '"Zakon:grove": [STORY_TAB, "zakon", 5],'),
    ])
    # the island map's list of interiors: the pockets' rooms and the mine
    P(PLUG("MapaWyspy_Data"), '        210: [111, "Chałupa z desek"], 211: [111, "Szopa"], 212: [111, "Komórka"]\n',
      '        210: [111, "Chałupa z desek"], 211: [111, "Szopa"], 212: [111, "Komórka"],\n'
      '        // (2026-11-11 questy_mapa) the pockets: Osada Milczących (through the gate in Góry), Pustelnia + Urwisko (the gate on Przystań), Spalona zagroda (Podgrodzie)\n'
      '        120: [13, "Osada Milczących"], 121: [13, "Wspólna izba"], 122: [13, "Chata tkaczki"], 123: [13, "Chata Najstarszego"], 124: [13, "Chata rzeźbiarza"],\n'
      '        155: [125, "Pustelnia na klifie"], 156: [125, "Skryptorium"], 157: [125, "Urwisko Kruków"], 168: [111, "Spalona zagroda"], 169: [111, "Dom Ługów"],\n'
      '        175: [13, "Orla Grań"], 213: [13, "Kopalnia"]\n')
    # K51: the raven waits at the harbour's gate of the cliff path (was the harbour's north edge)
    PR(PLUG("Kruk"), [
        ("            { map: HARBOUR, at: mastPoint, near: 4.5, go: () => ({ x: 15.5, y: 2.6, z: 0 }), dawn: true },\n"
         "            { map: HARBOUR, at: () => ({ x: 15.5, y: 2.6, z: 0 }), near: 4, go: () => ({ x: 15.5, y: -3, z: 90, off: true }) },\n",
         "            // (2026-11-11 questy_mapa: the way to Pustelnia is the gate of the cliff path beside the lighthouse hill, Przystań (%d,%d))\n"
         "            { map: HARBOUR, at: mastPoint, near: 4.5, go: () => ({ x: %d.5, y: %d.7, z: 0 }), dawn: true },\n"
         "            { map: HARBOUR, at: () => ({ x: %d.5, y: %d.7, z: 0 }), near: 4, go: () => ({ x: %d.5, y: %d, z: 90, off: true }) },\n"
         % (GATE125[0], GATE125[1], GATE125[0], GATE125[1] + 1, GATE125[0], GATE125[1] + 1, GATE125[0], GATE125[1] - 5)),
    ])
