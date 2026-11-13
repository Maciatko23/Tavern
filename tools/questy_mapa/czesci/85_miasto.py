

# ====================================================================================================================
# 8b. The town (Map008): markers before the doors of the six new buildings (tools/questy_mapa/markery_miasta.py; the same table is a section of
# tools/miasto5/build5.py) + the seamstress goes to the cloth hall's front in the mornings (TownLife_Data.js)
# ====================================================================================================================
sys.path.insert(0, HERE)
import markery_miasta as QM
def sec_miasto():
    m = M(8)
    have = {e["name"] for e in m["events"] if e}
    for key, (x, y, d, what) in QM.MARKERY.items():
        if "Miejsce: " + key in have: raise SystemExit("STOP: Map008 ma juz znacznik " + key)
        add_event(m, "Miejsce: " + key, x, y, [page(None, d, 0, None, pri=0, through=True)])
    TD = PLUG("TownLife_Data")
    P(TD, "        // (2026-10-05, the quests' new people) Lucjan's dice by the right stall;",
          "        // (2026-11-11 questy_mapa) the fronts of the six new buildings (Map008 markers \"Miejsce: <key>\": tools/questy_mapa/markery_miasta.py)\n"
          + "        " + ", ".join('%s: [%d, %d, %d]' % (k, v[0], v[1], v[2]) for k, v in QM.MARKERY.items()) + ",\n"
          "        // (2026-10-05, the quests' new people) Lucjan's dice by the right stall;")
    P(TD, '[[0, "inside", "dom3_drzwi"], [9.5, "wander", "stragan_4"], [11, "wander", "plac_2"]',
          '[[0, "inside", "dom3_drzwi"], [9.5, "wander", "sukiennice_przed"], [11, "wander", "plac_2"]')
