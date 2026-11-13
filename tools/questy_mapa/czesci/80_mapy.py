

# ====================================================================================================================
# 8. The maps: three pockets (gates, edges), nothing else (the places of the quests are plugin events at data coordinates)
# ====================================================================================================================
def gate_events(m, name, x, y, tr_cmd, left=2, right=2):
    """an open wooden gate (Mt_Gate, 3 x 3 tiles, the arch above the hero): the passage cell (x, y) with a touch trigger and two posts (x-1, x+1) that block"""
    g = add_event(m, name, x, y, [page("!$Mt_Gate", 4, 0, [tr_cmd], pri=2, through=True, trig=1, dirfix=True)])
    pl = add_event(m, "Słup bramy", x - 1, y, [page(pri=1)])
    pr = add_event(m, "Słup bramy", x + 1, y, [page(pri=1)])
    # a palisade run on each side (Garnizon art, 3-tile fronts, as the Silent's palisade of Map120): the gate is a gap in a stockade, not a lone frame
    for side, n in (("L", left), ("R", right)):
        for k in range(n):
            cx = x - 3 - 3 * k if side == "L" else x + 3 + 3 * k
            add_event(m, "Palisada przy bramie", cx, y, [page("!Garnizon_Palisada", (2, 4, 6)[(k + (side == "R")) % 3] if False else 2, (k + (side == "R")) % 3, pri=1, dirfix=True)], "<Occupy:left=1,right=1>")
    return g, pl, pr

def sec_maps():
    # ---- Pocket 1: Osada Milczących (120-124): the gate of Góry (6,27) -> the south edge of Map120 (the old way in); the other edges of 120 closed
    m = M(13)
    e = m["events"][6]
    if e["name"] != "Brama Milczących" or e["x"] != 6 or e["y"] != 27: raise SystemExit("STOP: Map013 zdarzenie 6 to nie brama")
    e["note"] = ""      # (it blocked three cells with <Occupy:left=1,right=1>: now the posts below do, the middle is the passage)
    e["pages"] = [page("!$Mt_Gate", 4, 0, [transfer(120, OSADA_IN[0], OSADA_IN[1], 8)], pri=2, through=True, trig=1, dirfix=True)]
    add_event(m, "Słup bramy", 5, 27, [page(pri=1)])
    add_event(m, "Słup bramy", 7, 27, [page(pri=1)])
    m = M(120)
    for i in (146, 150, 154): set_transfer(m["events"][i], 13, GATE13[0], GATE13[1] + 1, 2)
    del_events(m, [155, 156, 157, 158, 165, 172])
    # ---- Pocket 2: Pustelnia + Urwisko (155, 156, 157): the gate "Ścieżka na klif" on Przystań beside the lighthouse hill; 155's south edge leads out to it
    m = M(125)
    g, pl, pr = gate_events(m, "Brama: Ścieżka na klif", GATE125[0], GATE125[1], transfer(155, HERMIT_IN[0], HERMIT_IN[1], 8))
    add_event(m, "Drogowskaz: Ścieżka na klif", SIGN125[0], SIGN125[1],
              [page("!$Drogowskaz", 2, 1, [popup_cmd("Ścieżka na klif. W górę, do pustelni na skale.")], dirfix=True)])
    m = M(155)
    for i in (66, 67, 68): set_transfer(m["events"][i], 125, GATE125[0], GATE125[1] + 1, 2)
    m = M(157)
    del_events(m, [93, 94, 95])
    # ---- Pocket 3: Spalona zagroda (168, 169): the gate in the north-east corner of Podgrodzie is Homes.js's; 168's west edge leads out to it, the others are closed
    m = M(168)
    for i in (33, 56, 57): set_transfer(m["events"][i], 111, GATE111[0], GATE111[1] + 1, 2)
    del_events(m, [58, 261, 262])
    # the gate in the north-east corner of Podgrodzie (a map event: the compass reads the exits from the map's file) and its signpost
    m = M(111)
    gate_events(m, "Brama: Spalona zagroda", GATE111[0], GATE111[1], transfer(168, FARM_IN[0], FARM_IN[1], 6), left=0, right=2)
    add_event(m, "Drogowskaz: Spalona zagroda", SIGN111[0], SIGN111[1],
              [page("!$Drogowskaz", 2, 1, [cmd(355, ['Tawerna.call("Homes", "signpost");'])], dirfix=True)])
