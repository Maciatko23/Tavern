# -*- coding: utf-8 -*-
"""Kruczarnia (Map214), wnetrze: izba pocztowa (stol do sortowania, przegrodki, kominek, poslanie Gawrona, biurko Cyryla)
i wieza (zerdzie z krukami). Wejscie: drzwi "Drzwi: Kruczarnia" na Map008 (112,13), wyjscie na (112,14).
Buduje na narzedziach wnetrz (tools/interiors/ilib.py + build_interiors.py: ta sama skorupa, swiatla, przejscia).
   python tools/listonosz/kruczarnia.py [katalog_wyjsciowy]   (domyslnie tools/listonosz/staging/ : Map214.json + Map214_meta.json)
Nic nie pisze w data/. Zdarzenia ravenow/stolu maja polecenia Poczta.* (wtyczka Poczta.js)."""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "interiors"))
import build_interiors as BI
from build_interiors import *   # noqa
import ilib

MINE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(MINE, "staging")
MAP_ID, DOOR_ID, DOOR_TOWN = 214, 364, (112, 14)
SCRIPT = lambda s: [{"code": 355, "indent": 0, "parameters": [s]}]


def kruczarnia():
    W, H = 19, 13
    mp = Interior(MAP_ID, W, H, "Kruczarnia", "kruczarnia", note=NOTE + "\n<LightEdges:soft>\n<Widok:off>")
    DOOR_X = 5
    rooms = [("Izba", [(1, 4, 9, 11)], F_DARK, W_PLASTER_BEAM),
             ("Wieża", [(11, 4, 17, 11)], F_COBBLE, W_RAW)]
    mp.shell(rooms, openings=[("Izba", (10, 8, 10, 10)), ("Izba", (DOOR_X, H - 1, DOOR_X, H - 1))], border=B_WOOD2 if False else B_STONE)
    mp.shadows()
    g = "Izba"
    # ---- north wall of the post room: pigeonholes (racks), window, the hearth in the middle, window, racks
    mp.piece("C", 0, 0, 1, 3, 1, 1, group=g + " przegródki", kind="regał z przegródkami na listy")
    mp.piece("C", 0, 0, 1, 3, 2, 1, group=g + " przegródki", kind="regał z przegródkami na listy")
    window(mp, 4, 1, curtain=1, group=g + " okna", length=120)
    fireplace_pic(mp, 6, 4, kind=2, group=g)
    firewood(mp, 5, 4, group=g + " drewno"); firewood(mp, 7, 4, group=g + " drewno")
    mp.restyle_face(mp.rect(5, 1, 7, 3), W_RAW)
    window(mp, 9, 1, curtain=1, group=g + " okna", length=120)
    # ---- Gawron's cot in the south-west corner with a candle; the sorting table (x 3..6, rows 7-8) with the sealing candle and wax
    bed(mp, (9, 13), 1, 9, group=g, kind="prycza Gawrona")
    nightstand_candle(mp, 2, 10, group=g)
    table_h(mp, 3, 7, 4, style=6, group=g + " stół do sortowania")
    candle(mp, 3, 8, group=g + " stół")
    on_table(mp, 3, 7, "D", 5, 12); on_table(mp, 4, 7, "D", 6, 13); on_table(mp, 6, 7, "D", 4, 10)
    stool(mp, 3, 9, group=g + " stołki"); stool(mp, 6, 9, group=g + " stołki")
    # the writing desk of the town hall's clerk (he tidies the official letters here): by the east wall
    mp.piece("C", 3, 2, 1, 2, 9, 6, group=g, kind="pulpit do pisania urzędnika")
    rug(mp, 3, 10, 7, 11, RUG_BROWN)
    mp.piece("D", 10, 2, 1, 2, 9, 10, group=g, kind="beczka", solid_rows=[1])
    # ---- the tower part: the old perches of the Order, with the ravens; a ladder, the banner and the carved raven, a window
    t = "Wieża"
    if "kruk_choragiew" in TOWN_IDX:
        mp.tprop("kruk_choragiew", 11, 2, group=t + " chorągwie"); mp.tprop("kruk_choragiew", 17, 2, group=t + " chorągwie")
    window(mp, 12, 1, curtain=2, group=t + " okna", length=150); window(mp, 16, 1, curtain=2, group=t + " okna", length=150)
    if "kruk_plaskorzezba" in TOWN_IDX: mp.tprop("kruk_plaskorzezba", 14, 1, group=t)
    window(mp, 14, 4 - 3, curtain=1, group=t + " okno", length=130) if False else None
    mp.tprop("schody_luk", 14, 3, group=t, name="Schody na szczyt wieży (zamknięte)")
    mp.tprop("drabina", 17, 4, group=t)
    sconce(mp, 13, 2, group=t + " pochodnie"); sconce(mp, 15, 2, group=t + " pochodnie")
    # braziers: the tower's own fire, burning day and night (every light is fire)
    for (bx, by) in ((17, 9), (11, 4)):
        mp.ev(bx, by, "!Decoration", 2, 4, 0, name="Kosz żarowy", priority=1, through=False, step=True, note="<Light:230,120,52,14>")
        mp.solid.add((bx, by)); mp.blocked.add((bx, by))
        mp.rec("brazier", "floorprop", {(bx, by)}, t + " żar", x=bx, y=by, event=True, art=None, fw=48, fh=48)
    fill_light(mp, 14, 7); fill_light(mp, 5, 6)
    sconce(mp, 11, 2, group=t + " pochodnie") if False else None
    perches = [(12, 6, "r1"), (14, 6, "r2"), (16, 6, "r3"), (13, 9, "r4"), (15, 9, "r5")]
    for i, (x, y, k) in enumerate(perches, 1):
        e = mp.ev(x, y, "!$Kruczarnia_Zerdz", 0, 2 if i % 2 else 6, 0, name="Żerdź (kruk %d)" % i, priority=1, through=False,
                  note="<Occupy:up=0>", trigger=0, cmds=SCRIPT("Poczta.kruk(this, %d)" % i))
        mp.rec("zerdz", "floorprop", {(x, y)}, t + " żerdzie", x=x, y=y, event=True, art=None, fw=96, fh=128)
    mp.piece("D", 14, 0, 1, 2, 11, 10, group=t, kind="beczka (ziarno dla kruków)", solid_rows=[1])
    mp.piece("D", 13, 7, 1, 1, 17, 1, z=3, group=t, kind="pajęczyna", solid_rows=[])
    wall_lantern(mp, 11, 1 + 1, style=1, group=t) if False else None
    # ---- events: the table (take / sort the letters), the pigeonholes (read the names), the clerk's desk; the door out
    for x in (4, 5):
        mp.add(x, 8, {"name": "Stół do sortowania listów", "note": "", "pages": [blank_page(priority=1, trigger=0, cmds=SCRIPT("Poczta.stol(this)"))]})
    mp.add(1, 4, {"name": "Przegródki na listy", "note": "", "pages": [blank_page(priority=1, trigger=0, cmds=SCRIPT("Poczta.przegrodki(this)"))]})
    mp.add(2, 4, {"name": "Przegródki na listy", "note": "", "pages": [blank_page(priority=1, trigger=0, cmds=SCRIPT("Poczta.przegrodki(this)"))]})
    mp.add(9, 7, {"name": "Biurko pisarza", "note": "", "pages": [blank_page(priority=1, trigger=0, cmds=SCRIPT("Poczta.biurko(this)"))]})
    mp.exit_to(DOOR_X, DOOR_ID, DOOR_TOWN, "Drzwi -> Kruczogród (kruczarnia)", room="Izba")
    # ---- the people (TownLife shows them on these spots while they are "inside"): Gawron behind the table, the apprentice by the
    # racks, the clerk at his desk; the night watch spot for the S5 scene; the side door of the traitor (S5 / S7)
    mp.resident("gawron", 5, 6, 2)
    mp.resident("wicek", 3, 5, 2)
    e = mp.add(8, 6, {"name": "Miejsce: cyryl_w_kruczarni", "note": "", "pages": [blank_page(priority=0, through=True, image={"direction": 6})]})
    mp.residents.append({"key": "cyryl", "x": 8, "y": 6, "dir": 6}); mp.spots["res_cyryl"] = [8, 6, 6]
    mp.spot("straz", 9, 9, 4)
    return mp


if __name__ == "__main__":
    mp = kruczarnia()
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, "Map%03d.json" % MAP_ID)
    n = mp.write(path, os.path.join(OUT, "Map%03d_meta.json" % MAP_ID))
    print("Map%03d %s: %dx%d, %d zdarzen -> %s" % (MAP_ID, mp.display, mp.W, mp.H, n, path))
