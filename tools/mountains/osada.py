# Map120 "Osada Milczących" (STORY.md "Osada Milczących", W8 ch5 "Co Serce robi z człowiekiem", Act II): a hidden valley
# in the mountains behind the ravine of Map013, closed by the Silent's gate until Act II (switch 16 "Osada_Milczacych").
# People who once "knew too much" live here apart: a few huts (the Winlu author's own prefabs, as in Podgrodzie), a circle
# of standing stones with a flat stone in the middle where they sit in silence, cairns and posts tied with white strips (the
# sign of the Silent - a strip over the mouth), dry garden beds (the drought), the high smooth rock face in the north they
# stand and look at. Residents: figures in the hero's style (PixelLab), silent - the action button gives a popup of what one
# sees, not talk (the quests may give them more). Tileset 11; trees and rocks are Map003's own kinds.
# (2026-10-07) The huts open: each front door leads into its interior Map121-124 (tools/osada: huts.py builds them, osada_data.py
# says which door goes where); hut 3's side door stays shut. The Silent keep hours (tools/osada/osada_data.py RESIDENTS): outside
# at theirs, else at home - page 2 of each resident (self switch A, set by the parallel event "Milczący: pora dnia") is
# nobody. Rebuild order: this map (tools/mountains/build.py or tools/osada/build.py), then the huts (tools/osada/build.py).
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "town"))
sys.path.insert(0, os.path.join(HERE, "..", "osada"))
from mtlib import *   # noqa: F401,F403
import props as PR
import prefabs as PF
import osada_data as OD      # tools/osada/osada_data.py

MAP_ID, W, H = 120, 40, 34
NOTE = "<Clouds:on>\n<Hunt:off>\n<Bear:off>\n<Camp:off>\n<Humans:off>\n<Farm:off>\n<Build:off>\n<Poziom:6>"
EXIT = [(19, 33), (20, 33), (21, 33)]
EXIT_TO = (13, 6, 1, 2)          # Map013: the ravine north of the gate (x 5..7 for 19..21), facing down


def build():
    mp = MMap(MAP_ID, W, H, "Osada Milczących", NOTE, seed=1200, bgm="")
    mp.props["bgs"] = {"name": "Wind1", "pan": 0, "pitch": 80, "volume": 18}
    mp.props["autoplayBgs"] = True
    rnd = mp.rnd
    # ---- the valley's walls: the north face the Silent look at (tall), rock along the west and east
    wall = mp.rect(0, 0, 39, 3) | mp.rect(0, 0, 3, 26) | mp.rect(36, 0, 39, 24)
    mp.raise_to(wall, 1, "dirt")
    mp.face_h[1] = 4
    mp.terraces(lambda l, x, y: G_DIRT if l else G_GRASS)
    # ---- the ways
    walk = path(mp, [(20, 34), (20, 29), (19, 24), (19.5, 17), (17, 12), (15.5, 9)], 2.0)
    walk |= path(mp, [(19, 24), (12, 21), (8.5, 17)], 1.6) | path(mp, [(20, 22), (27, 22), (29.5, 27)], 1.6)
    walk |= path(mp, [(19.5, 16), (27, 15), (30, 16)], 1.6)
    walk = {c for c in walk if mp.lv(*c) == 0 and c not in mp.faces}
    for c in walk:
        mp.layers[1][c] = ("k", G_PATH)
        mp.region[c] = 7
    mp.keep_free |= walk | ring(mp, walk, 1)
    for c in EXIT: mp.keep_free |= ring(mp, [c], 2) | {c}
    # ---- the ground: worn grass, bare earth round the huts, dry beds
    grass = {c for c in mp.all if mp.lv(*c) == 0 and c not in mp.faces}
    for c in grass:
        if c in walk: continue
        if lowfreq(*c, 211, 5.0) > 0.64: mp.layers[0][c] = ("k", G_LIGHT)
        if 0.46 < lowfreq(*c, 213, 2.4) < 0.53: mp.layers[1][c] = ("k", G_TALL)
    feet = {(x, y + 1) for (x, y), (part, l) in mp.faces.items() if part == "L"}
    for c in feet | ring(mp, feet, 1):
        if c in grass and c not in walk and noise(*c, 215) < 0.6: mp.layers[1][c] = ("k", G_STONES)

    # ---- the huts (doors closed: "silence behind them")
    huts = [("chata_strzecha", 5, 13, 1), ("chata_strzecha", 26, 11, 2), ("chata_z_bali", 26, 19, 3), ("chata_strzecha", 5, 22, 4)]
    doors = {}
    for key, hx, hy, n in huts:
        n0 = len(mp.events)
        pf = PF.stamp(mp, key, hx, hy, ground=False)
        for c in mp.rect(hx, hy, hx + pf["w"] - 1, hy + pf["h"] - 1):
            mp.layers[1].pop(c, None); mp.region.pop(c, None)
            mp.keep_free.add(c)
        for (cx, cy) in pf.get("closed_by_tiles", []): mp.solid.add((hx + cx, hy + cy))
        for i in range(n0, len(mp.events)):
            x, y, e = mp.events[i]
            pic = e["pages"][0]["image"]["characterName"]
            if pic == "!Signs":
                e["pages"][0]["image"]["characterName"] = ""          # (no shop sign here)
                e["name"] = "(bez szyldu)"
            elif pic.startswith("!Fantasy_door"):
                if n not in doors:          # the hut's front door: walk into it -> the hut (fade, facing up)
                    e["name"] = "Drzwi chaty %d" % n
                    mid = OD.HUT_OF_DOOR[e["name"]]
                    e["pages"][0]["list"] = OD.door_list(mid, *OD.LANDINGS[mid])
                    e["pages"][0]["trigger"] = 1
                    doors[n] = (x, y)
                else:                       # (hut 3's lean-to door)
                    e["name"] = "Boczne drzwi chaty %d" % n
                    e["pages"][0]["list"] = PR.popup(OD.SIDE_DOOR_TEXT) + [{"code": 0, "indent": 0, "parameters": []}]
    # ---- the circle of the Silent: four standing stones round a flat stone, cairns with white strips
    cx, cy = 19, 19
    # (plain pictures, not Map003's mineable rocks: nobody breaks the Silent's stones)
    for (x, y) in ((cx - 3, cy - 2), (cx + 3, cy - 2), (cx - 3, cy + 2), (cx + 3, cy + 2)):
        mp.ev(x, y, "!$Rock_Column", 0, 2, 0, name="Kamień kręgu", priority=1, through=False, note="<Occupy:up=1>",
              cmds=PR.popup("Kamień kręgu. Gładki od dłoni, które go dotykały."))
        mp.solid.add((x, y - 1))
    mp.ev(cx, cy, "!$Rock_Flat", 0, 2, 0, name="Płaski kamień pośrodku kręgu", priority=1, through=False,
          cmds=PR.popup("Płaski kamień. Leżą na nim drobne, białe kamyki - po jednym na każdego, kto tu zamilkł."))
    mp.keep_free |= mp.rect(cx - 4, cy - 3, cx + 4, cy + 3)
    for (x, y, pat) in ((cx - 5, cy, 0), (cx + 5, cy, 0), (17, 26, 1), (23, 26, 1), (12, 10, 2), (24, 8, 0), (9, 18, 2)):
        PR.silent(mp, x, y, pat)
    # ---- dry garden beds by the huts (the drought)
    for (x0, y0, x1, y1) in ((11, 13, 13, 15), (31, 15, 33, 16), (11, 23, 13, 25)):
        for c in mp.rect(x0, y0, x1, y1):
            mp.layers[1][c] = ("k", G_MUD_FILM); mp.keep_free.add(c)
        PR.dry_stalks(mp, x0 + 1, y0 + 1)
    # ---- lanterns at the doors (fire), a woodpile
    for n, (x, y) in doors.items():
        if n in (1, 2): PR.lantern_wall(mp, x + 1, y - 1, "Latarnia przy drzwiach")
    # ---- trees and rocks: pines along the walls and in the south, rocks on the edges
    edge = {c for c in grass if (c[1] >= 27 or c[0] <= 6 or c[0] >= 33 or c[1] <= 10) and c not in walk}
    mp.forest_var({c for c in edge if c[1] >= 26}, 2.2, 3.4, seed=1201)
    mp.scatter(edge, 8, lambda x, y: mp.put(x, y, rnd.choice(["!$Pine_C", "!$Tree_Small", "!$Pine_B"])), 4)
    mp.scatter(edge, 7, lambda x, y: mp.put(x, y, rnd.choice(ROCK_SMALL + ["!$Rock_Mossy", "!$Boulder_A"])), 3)
    top = {c for c in wall if c not in mp.rims and c not in mp.faces}
    mp.scatter(top, 16, lambda x, y: mp.put(x, y, rnd.choice(["!$Pine_A", "!$Pine_B", "!$Pine_C", "!$Rock_Spire", "!$Rock_Tall"])), 3)

    # ---- the way out (south edge -> the ravine of Map013)
    for i, (x, y) in enumerate(EXIT):
        mp.transfer(x, y, EXIT_TO[0], EXIT_TO[1] - 1 + i, EXIT_TO[2], EXIT_TO[3], name="Przejście -> Góry i kamieniołom")
        mp.region[(x, y)] = 7

    # ---- the Silent (figures, silent: the action button shows what one sees); page 2 (self switch A: at home) - nobody
    for name, sheet, x, y, d, line in RESIDENTS:
        sheet = sheet if PR.have(sheet) else "$Npc_Zebrak"
        mp.add(x, y, {"name": name, "note": "<BustName:%s>" % name, "pages": [
            PR.page(image={"characterName": sheet, "characterIndex": 0, "direction": d, "pattern": 1}, priority=1, trigger=0,
                    cmds=PR.popup(line), direction_fix=True),
            PR.page(priority=0, through=True, cond={"selfSwitchValid": True, "selfSwitchCh": "A"})]})
        mp.solid.add((x, y))

    for key, x, y, d in MARKERS:
        mp.marker(x, y, key, d)
    for n, (x, y) in sorted(doors.items()):
        mp.marker(x, y + 1, "osada_dom_%d" % n, 8)
    # ---- the hours of the Silent (last, so the ids above stay as they were)
    sch = OD.schedule_event(blank_page)
    sch["pages"][0]["list"] = OD.schedule_list(MAP_ID) + [{"code": 0, "indent": 0, "parameters": []}]
    mp.add(0, 0, sch)
    for n, (x, y) in doors.items():
        mid = OD.HUT_OF_DOOR["Drzwi chaty %d" % n]
        assert OD.HUTS[mid][3] == (x, y) and OD.HUTS[mid][4] == (x, y + 1), (n, x, y)
    return mp


RESIDENTS = [   # name, sheet, x, y, facing, what one sees (popup)
    ("Milczący przy ścianie", "$Npc_Milczacy1", 14, 10, 8, "Stoi twarzą do skały. Usta ma przewiązane białym płótnem. Nie odwraca się."),
    ("Milcząca przy ścianie", "$Npc_Milczaca2", 17, 10, 8, "Patrzy w kamień, jakby coś na nim czytała. Na ustach biały pas płótna."),
    ("Najstarszy z Milczących", "$Npc_Milczacy3", 19, 21, 8, "Stoi przy płaskim kamieniu. Unosi dłoń - bez słowa każe ci być cicho."),
    ("Milcząca przy grządce", "$Npc_Milczaca4", 12, 16, 2, "Grzebie palcami w suchej ziemi. Spogląda na ciebie i kręci głową."),
]

MARKERS = [
    ("osada_wejscie", 20, 31, 8),            # where one comes in from the ravine (Map013)
    ("osada_krag", 19, 22, 8),               # before the flat stone in the circle (the elder sits by it)
    ("osada_sciana", 15, 10, 8),             # the face of the rock the Silent stand and look at
    ("osada_grum", 21, 25, 8),               # where Grum stops and looks at them (W8 ch5)
    ("osada_starszy", 19, 21, 8),            # the elder's place
]

if __name__ == "__main__":
    mp = build()
    j = mp.to_json()
    render(j, sys.argv[1] if len(sys.argv) > 1 else "osada.png", scale=float(sys.argv[2]) if len(sys.argv) > 2 else 0.6, grid=True)
