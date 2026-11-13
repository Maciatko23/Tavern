

# ====================================================================================================================
# 6. Homes (D21 / K58 / K62 Spalona zagroda, strażnicy zamkniętej działki): kieszeń 168/169 przez Podgrodzie, strażnicy przy bramach płotu działki
# ====================================================================================================================
GATE111 = (110, 20)          # Podgrodzie, the north-east corner: the cell of the passage of the gate (Mt_Gate, 3 wide; posts at x-1 and x+1)
SIGN111 = (112, 22)          # the signpost beside it
FARM_IN = (1, 25)            # the burnt farm (Map168): the landing beside its west exit (0,24..26)
PLOT_GUARD_N = (67, 33)      # the plot's fence on Kruczy Jar: the north gate (x 68-71, y 34), the south gate (x 48-51, y 59)
PLOT_GUARD_S = (47, 60)
PLOT_OUT = (40, 47)          # outside the west gate (x 42, y 46-48): where the escort / the hut's door lets the hero out when the field is shut
PLOT_RECT = (42, 34, 77, 59)

def sec_homes():
    H = PLUG("Homes")
    PR(H, [
        ("    const FIELD = 3, HUT_MAP = 100, EDGE = 23, MEADOW = 4, PODGRODZIE = 111, ZAGRODA = 168;\n",
         "    // (2026-11-11 plansza: EDGE is Podgrodzie (111) now - the gate to the burnt farm is in its north-east corner; the two guards of the shut field stand\n"
         "    // at the gates of the plot's fence on Kruczy Jar (PLOT), not on Skraj lasu / Łąka any more)\n"
         "    const FIELD = 3, HUT_MAP = 100, EDGE = 111, MEADOW = 4, PODGRODZIE = 111, ZAGRODA = 168;\n"
         "    const PLOT = { rect: [%d, %d, %d, %d], guardN: [%d, %d], guardS: [%d, %d], out: [%d, %d] };\n"
         "    const inPlot = (x, y) => x >= PLOT.rect[0] && y >= PLOT.rect[1] && x <= PLOT.rect[2] && y <= PLOT.rect[3];\n"
         % (PLOT_RECT + PLOT_GUARD_N + PLOT_GUARD_S + PLOT_OUT)),
        # the cast on the field + the two guards (ids 704, 705 are in the field's range now)
        ("    T.inject([FIELD], { ids: [CAST.butler, SIGN], owner: PLUGIN, when: () => storyGame(), build() {\n",
         "    T.inject([FIELD], { ids: [CAST.butler, GUARD_MEADOW], owner: PLUGIN, when: () => storyGame(), build() {\n"),
        ("            shownOnA(SIGN, TK.kod.build[1], sx, sy, { characterName: \"!$Lord_Sign\", direction: 2, pattern: 1 },\n"
         "                stub(\"Tawerna.popup(\" + JSON.stringify(WORDS.znak) + \", { color: \\\"info\\\" })\"), { stepAnime: true, walkAnime: false, moveSpeed: 2, moveFrequency: 2 })\n        ];\n",
         "            shownOnA(SIGN, TK.kod.build[1], sx, sy, { characterName: \"!$Lord_Sign\", direction: 2, pattern: 1 },\n"
         "                stub(\"Tawerna.popup(\" + JSON.stringify(WORDS.znak) + \", { color: \\\"info\\\" })\"), { stepAnime: true, walkAnime: false, moveSpeed: 2, moveFrequency: 2 }),\n"
         "            // the guards of the shut field, at the gates of the plot's fence (shown from the dawn that shuts it)\n"
         "            shownOnA(GUARD_EDGE, TK.kod.build[0], PLOT.guardN[0], PLOT.guardN[1], { characterName: \"$Npc_Straznik\", direction: 2 }, stub(GUARD_TALK)),\n"
         "            shownOnA(GUARD_MEADOW, TK.kod.build[0], PLOT.guardS[0], PLOT.guardS[1], { characterName: \"$Npc_Straznik\", direction: 8 }, stub(GUARD_TALK))\n        ];\n"),
        # the old guards' injections are gone: Łąka's, and Skraj lasu's (the way west and the signpost go to Podgrodzie below)
        ("    // the guards at the two ways onto the field (shown once it is shut)\n    const GUARD_TALK = \"Tawerna.call(\\\"Homes\\\", \\\"guardTalk\\\", this)\";\n"
         "    T.inject([MEADOW], { ids: [GUARD_MEADOW, GUARD_MEADOW], owner: PLUGIN, when: () => storyGame(), build: () => [\n"
         "        // (2026-10-18) Łąka (Map004) doubled to 80x60: its south exit to the field moved from row 29 to row 59 - he stands beside it\n"
         "        shownOnA(GUARD_MEADOW, TK.kod.build[0], 27, 58, { characterName: \"$Npc_Straznik\", direction: 4 }, stub(GUARD_TALK))] });\n",
         "    // the guards at the gates of the plot (shown once the field is shut; they are built with the field's events above)\n"
         "    const GUARD_TALK = \"Tawerna.call(\\\"Homes\\\", \\\"guardTalk\\\", this)\";\n"),
    ])
    # the way to the burnt farm: a pocket - one gate in the north-east corner of Podgrodzie (the old way was three strips of the west edge of Map023)
    old = _get(H)["b"].decode("utf-8")
    i0 = old.index("    // Skraj lasu: the guard (story), the way west to the burnt farm")
    i1 = old.index("    // the burnt farm: the chimney's smoke once the house is rebuilt")
    block = old[i0:i1]
    new = ("    // (2026-11-11 plansza) the way to the burnt farm is a pocket (Map168, its other exits are closed) through ONE gate in the north-east corner of\n"
           "    // Podgrodzie: the gate, its posts and the signpost are EVENTS OF Map111 (tools/questy_mapa/zastosuj.py; so the compass knows the way), not injected\n")
    P(H, block, new)
    PR(H, [
        ("        sw(EDGE, GUARD_EDGE, true); sw(MEADOW, GUARD_MEADOW, true);\n", "        sw(FIELD, GUARD_EDGE, true); sw(FIELD, GUARD_MEADOW, true);\n"),
        ("        sw(EDGE, GUARD_EDGE, false); sw(MEADOW, GUARD_MEADOW, false);\n", "        sw(FIELD, GUARD_EDGE, false); sw(FIELD, GUARD_MEADOW, false);\n"),
        ("const here = window.$gameMap ? $gameMap.mapId() : 0, there = here === FIELD || here === HUT_MAP ? EDGE : here;",
         "const here = window.$gameMap ? $gameMap.mapId() : 0, there = here === FIELD || here === HUT_MAP ? FIELD : here;"),
        # the shut field: only the plot itself is refused (Kruczy Jar is open land)
        ("        if (mapId === FIELD && fieldLocked() && !($gameTemp && $gameTemp._homesLetIn) && window.$gameMap && $gameMap.mapId() !== FIELD) {\n"
         "            if ($gameMap.mapId() === HUT_MAP) return _reserveTransfer.call(this, EDGE, 1, 13, 6, fadeType);\n",
         "        if (mapId === FIELD && fieldLocked() && !($gameTemp && $gameTemp._homesLetIn) && window.$gameMap && $gameMap.mapId() !== FIELD && inPlot(x, y)) {\n"
         "            if ($gameMap.mapId() === HUT_MAP) return _reserveTransfer.call(this, FIELD, PLOT.out[0], PLOT.out[1], 4, fadeType);\n"),
    ])
    # Story.js: the escort of the shut field - out of the plot, onto Kruczy Jar beside the west gate (was Map023 (1,13))
    P(PLUG("Story"), "        o.push(C(201, [0, 23, 1, 13, 6, 0]));   // (Skraj lasu, where the way from the field comes out)\n",
      "        o.push(C(201, [0, 3, %d, %d, 4, 0]));   // (Kruczy Jar, outside the west gate of the plot's fence; was Skraj lasu, Map023 (1,13))\n" % PLOT_OUT)
