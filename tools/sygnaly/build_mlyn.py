# -*- coding: utf-8 -*-
# python tools/sygnaly/build_mlyn.py [--render PATH]
#   -> tools/sygnaly/staging/data/Map217.json (+ Map217_meta.json)
# W19 "Sygnaly z mlyna": the ONE interior of the windmill of Kruczogrod (Map008 x95-99 y83-87, door event "Drzwi: Wiatrak" at 97,87).
# Tileset 8. Two parts of one house joined by a wide opening: the ground floor (left: two millstones with the hopper over them,
# sacks, the flour bin, the stairs' ladder) and the axle chamber (right: the great axle with its wheel, the brake lever, the window to the road).
# Interactive things call Mlyn.* (script commands); the residents' places are "Miejsce: <key>_wnetrze" (TownLife).
import os, sys, json, argparse
CH_HERE = os.path.dirname(os.path.abspath(__file__))
HERE = CH_HERE
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/wnetrza")
sys.path.insert(0, ROOT + "tools/interiors")
import rooms as RM                  # noqa: E402
from ilib import *                  # noqa: F401,F403,E402

STAGING = os.path.join(CH_HERE, "staging")
SDATA = os.path.join(STAGING, "data")
MAP_ID, TOWN, DOOR_NAME = 217, 8, "Drzwi: Wiatrak"
TOWN_FRONT = (97, 88)               # Map008: the cell in front of the windmill's door
B_WOOD, B_STONE = 24, 16
W_PANEL, W_STONE_BEAM = 54, 50
F_DARK, F_COBBLE = 83, 96
RUG_BROWN = 21
NOTE = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Widok:off>\n<LightEdges:soft>\n<Zoom:1.25>\n<DarkDay:70>\n<DarkNight:185>\n<Ambience:interior>\n<Mlyn:mlyn>"
L_CANDLE = "<Light:110,120,80,30><LightWhen:night>"
L_LAMP = "<Light:200,130,60,26><LightFlicker:0.12,255,150,70>"


def script(code): return {"code": 355, "indent": 0, "parameters": [code]}


def act(mp, x, y, name, code, floor=False, trigger=0):
    """an action-button event with no picture of its own, on the cell in FRONT of a visible object, running `code` (a Mlyn.* call)"""
    e = {"name": name, "note": "", "pages": [blank_page(priority=1 if floor else 0, trigger=trigger, cmds=[script(code)], through=not floor)]}
    mp.add(x, y, e)
    return e


def marker(mp, key, x, y, d=2):
    e = {"name": "Miejsce: %s" % key, "note": "", "pages": [blank_page(priority=0, through=True, image={"direction": d})]}
    mp.add(x, y, e)
    mp.spots[key] = [x, y, d]
    return e


def prop(mp, sheet, x, y, name, occupy="", code=None, prio=1, note=""):
    """a drawn prop of the !$Mlyn_* sheets standing on (x, y) (its bottom-middle cell); the cells it covers are solid via <Occupy>"""
    tags = ("<Occupy:%s>" % occupy if occupy else "") + note
    e = mp.ev(x, y, sheet, 0, 2, 1, name=name, priority=prio, through=prio != 1, step=False, note=tags)
    cells = {(x, y)}
    if occupy:
        kv = dict(t.split("=") for t in occupy.split(","))
        cells |= {(x + dx, y + dy) for dy in range(-int(kv.get("up", 0)), int(kv.get("down", 0)) + 1)
                  for dx in range(-int(kv.get("left", 0)), int(kv.get("right", 0)) + 1)}
    if prio == 1:
        mp.solid |= cells; mp.blocked |= cells
    return e


def mlyn():
    W, H = 26, 15
    mp = Interior(MAP_ID, W, H, "Młyn", "mlyn", note=NOTE)
    DOOR_X = 7
    rooms = [("Parter", [(1, 4, 15, 13)], F_COBBLE, W_STONE_BEAM),
             ("Komora osi", [(17, 4, 24, 13)], F_DARK, W_PANEL)]
    mp.shell(rooms, openings=[("Parter", (16, 8, 16, 11))], border=B_STONE, exit_x=DOOR_X)
    mp.shadows()
    g, k = "Parter", "Komora osi"
    # ------------------------------------------------------------------ the ground floor
    window(mp, 4, 1, curtain=None, group=g + " okna", length=130)
    window(mp, 11, 1, curtain=None, group=g + " okna", length=130)
    # the two millstones (2x2 cells each) side by side, a hopper (the sacks) over the left one; the flour bin and the barrels on the right wall
    prop(mp, "!$Mlyn_Kamien", 4, 8, "Kamień młyński", occupy="right=1,up=1")
    prop(mp, "!$Mlyn_Kamien", 9, 8, "Kamień młyński", occupy="right=1,up=1")
    RM.sacks(mp, 2, 5, wide=False)
    RM.sacks(mp, 6, 5)
    RM.sacks(mp, 10, 5)
    RM.crate(mp, 13, 5, kind="tall")
    RM.barrel(mp, 14, 6, "plain")
    RM.barrel(mp, 14, 8, "water")
    mp.tprop("drabina", 15, 6, group=g + " drabina")
    RM.sacks(mp, 2, 10, wide=False)
    RM.sacks(mp, 10, 12)
    RM.crate(mp, 13, 12, kind="two")
    RM.barrel(mp, 2, 13, "cloth")
    mp.tprop("taczka", 4, 12, group=g + " taczka")
    RM.doormat(mp, DOOR_X, 14)
    RM.lantern(mp, 3, 2, style=0)
    RM.lantern(mp, 13, 2, style=0)
    mp.ev(7, 6, "!Decoration2", 4, 6, 0, name="Lampa nad kamieniami", priority=0, through=True, step=True, note=L_LAMP)
    mp.ev(7, 11, "!Decoration2", 1, 6, 0, name="Świeca przy drzwiach", priority=0, through=True, step=True, note=L_CANDLE)
    # ------------------------------------------------------------------ the axle chamber
    window(mp, 19, 1, curtain=None, group=k + " okna", length=130)
    window(mp, 22, 1, curtain=None, group=k + " okna", length=130)
    prop(mp, "!$Mlyn_Os", 20, 8, "Wielka oś ze kołem zębatym", occupy="left=1,right=1,up=1")
    prop(mp, "!$Mlyn_Dzwignia", 23, 8, "Dźwignia hamulca")
    act(mp, 23, 9, "Dźwignia hamulca", "Mlyn.dzwignia(this)")
    act(mp, 22, 8, "Dźwignia hamulca", "Mlyn.dzwignia(this)")
    # the window to the road (the sill: the wax drops of the helper's candle; "look out" = the view of the road)
    mp.ev(20, 3, "!Decoration2", 1, 6, 0, name="Ogarek na parapecie", priority=0, through=True, step=True, note=L_CANDLE)
    act(mp, 19, 4, "Okno na drogę", "Mlyn.okno(this)")
    act(mp, 20, 4, "Okno na drogę", "Mlyn.okno(this)")
    act(mp, 20, 3, "Wosk na parapecie", "Mlyn.slad('wosk')")
    # the miller's notes (a table with a ledger) at the wall of the chamber: the hint of the helper's tricks (the second clue)
    table_h(mp, 18, 10, 3, style=6, group=k + " stół")
    on_table(mp, 18, 10, "D", 1, 15); on_table(mp, 20, 10, "D", 5, 10)
    stool(mp, 19, 11, group=k + " stołek")
    act(mp, 19, 12, "Zeszyt młynarza", "Mlyn.slad('zeszyt')", floor=True)
    RM.sacks(mp, 23, 12)
    RM.barrel(mp, 24, 6, "water")
    RM.lantern(mp, 17, 2, style=0)
    mp.ev(22, 11, "!Decoration2", 4, 6, 0, name="Lampa komory", priority=0, through=True, step=True, note=L_LAMP)
    # the places the scenes use and the residents
    # fire baskets (every light is fire): one in each room against the wall, big soft light; the day's light comes through the windows
    mp.ev(14, 11, "!Decoration", 0, 2, 0, name="Kosz żarowy", priority=1, through=False, step=True, note="<Light:260,120,52,14>")
    mp.solid.add((14, 11))
    mp.ev(24, 5, "!Decoration", 0, 2, 0, name="Kosz żarowy", priority=1, through=False, step=True, note="<Light:260,120,52,14>")
    mp.solid.add((24, 5))
    mp.ev(8, 9, "!Decoration2", 4, 6, 0, name="Lampa przy kamieniach", priority=0, through=True, step=True, note=L_LAMP)
    marker(mp, "m_dzwignia", 22, 9, 4)
    marker(mp, "m_nocne", 12, 10, 8)
    mp.resident("mlynarz", 8, 11, 2)
    mp.resident("pomocnik", 21, 6, 2)
    mp.exit_to(DOOR_X, 440, TOWN_FRONT, "Drzwi -> Kruczogród (młyn)", room="Parter")
    mp.props.update({"autoplayBgm": True, "bgm": {"name": "", "pan": 0, "pitch": 100, "volume": 90}})
    return mp


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--render")
    a = ap.parse_args()
    mp = mlyn()
    os.makedirs(SDATA, exist_ok=True)
    path = os.path.join(SDATA, "Map%03d.json" % MAP_ID)
    n = mp.write(path, os.path.join(STAGING, "Map%03d_meta.json" % MAP_ID))
    print("Map217 Mlyn: %dx%d, %d events -> %s" % (mp.W, mp.H, n, os.path.relpath(path, ROOT)))
    if a.render:
        sys.path.insert(0, ROOT + "tools/town")
        import mzrender as R, irender as I
        img = I.grid(I.render(R.load_json(path)))
        img.save(a.render)
        print("picture:", a.render)


if __name__ == "__main__":
    main()
