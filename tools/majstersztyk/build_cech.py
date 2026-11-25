# python tools/majstersztyk/build_cech.py [--render PATH]
#   -> tools/majstersztyk/staging/data/Map215.json (+ Map215_meta.json), MapInfos.json (copy of the live one + entry 215)
# W22 "Majstersztyk": the guild house (Cech) of Kruczogrod, interior of the building on Map008 (x87-93 y79-88, door 194 at 91,87).
# Two rooms on tileset 8: the guild hall (left: Ostap's long table, the guild board, the trial shelf, the wall of trophies) and
# the workshop (right: forge, anvil, grindstone, bench, tannery frames and vat). The hall and workshop join by a wide opening.
# Interactive things call Majster.* (script commands); the residents' places are "Miejsce: <key>_wnetrze" (TownLife).
import os, sys, json, copy, argparse
CH_HERE = os.path.dirname(os.path.abspath(__file__))
HERE = CH_HERE
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/wnetrza")
sys.path.insert(0, ROOT + "tools/interiors")
import rooms as RM                  # noqa: E402
from ilib import *                  # noqa: F401,F403,E402

STAGING = os.path.join(CH_HERE, "staging")
SDATA = os.path.join(STAGING, "data")
MAP_ID, TOWN, DOOR_ID = 215, 8, 194
TOWN_FRONT = (91, 88)               # Map008: the cell in front of the Cech door
B_WOOD, B_STONE = 24, 16
W_PANEL, W_STONE_BEAM, W_PLASTER_BEAM = 54, 50, 51
F_DARK, F_COBBLE, F_RED = 83, 96, 84
RUG_BROWN, RUG_RED = 21, 36
NOTE = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.15>\n<DarkDay:70>\n<DarkNight:185>\n<Ambience:interior>\n<Majster:cech>"
L_FORGE = "<Light:260,130,55,10>"
L_CANDLE = "<Light:110,120,80,30><LightWhen:night>"


def script(code): return {"code": 355, "indent": 0, "parameters": [code]}


def act(mp, x, y, name, code, floor=False):
    """an invisible action-button event that runs `code` (a Majster.* call)"""
    e = {"name": name, "note": "", "pages": [blank_page(priority=1 if floor else 0, trigger=0, cmds=[script(code)], through=not floor)]}
    mp.add(x, y, e)
    return e


def marker(mp, key, x, y, d=2):
    e = {"name": "Miejsce: %s" % key, "note": "", "pages": [blank_page(priority=0, through=True, image={"direction": d})]}
    mp.add(x, y, e)
    mp.spots[key] = [x, y, d]
    return e


def cech():
    W, H = 30, 19
    mp = Interior(MAP_ID, W, H, "Cech", "cech", note=NOTE)
    DOOR_X = 7
    rooms = [("Izba cechowa", [(1, 4, 13, 17)], F_DARK, W_PANEL),
             ("Pracownia", [(15, 4, 28, 17)], F_COBBLE, W_STONE_BEAM)]
    mp.shell(rooms, openings=[("Izba cechowa", (14, 9, 14, 13))], border=B_WOOD, exit_x=DOOR_X)
    mp.shadows()
    g, p = "Izba cechowa", "Pracownia"
    # ------------------------------------------------------------------ the guild hall
    banner(mp, 7, 2, 0, 0, group=g + " chorągiew")
    window(mp, 4, 1, curtain=0, group=g + " okna", length=130)
    window(mp, 10, 1, curtain=0, group=g + " okna", length=130)
    mp.piece("D", 0, 0, 1, 1, 2, 2, group=g + " tarcze", kind="tarcza", solid_rows=[])
    mp.piece("D", 2, 0, 1, 1, 12, 2, group=g + " tarcze", kind="tarcza", solid_rows=[])
    # Ostap's long table across the hall (x 4..10, y 7), his chair behind it, the guild's ledger and a candle on it
    table_h(mp, 4, 7, 7, style=6, group=g + " stół cechu")
    on_table(mp, 4, 7, "D", 6, 13); on_table(mp, 10, 7, "D", 5, 12)
    mp.ev(7, 7, "!Decoration2", 1, 6, 0, name="Świeca na stole", priority=0, through=True, step=True, note=L_CANDLE)
    chair(mp, 7, 6, 2, arm=True, group=g)
    for x in (5, 9):
        stool(mp, x, 9, group=g + " stołki")
    # the trial shelf (left wall): a weapon rack against the wall, the cells in front of it are the hero's place
    mp.piece("E", 8, 10, 2, 2, 2, 3, group=g, kind="półka próbna (stojak)")
    act(mp, 2, 5, "Półka próbna", "Majster.polka(this)")
    act(mp, 3, 5, "Półka próbna", "Majster.polka(this)")
    mp.kind(1, {(2, 6), (3, 6)}, 23)                     # ash on the floor under the shelf (the second clue)
    act(mp, 2, 6, "Popiół pod półką", "Majster.slad('odcisk')", floor=True)
    act(mp, 3, 6, "Popiół pod półką", "Majster.slad('odcisk')", floor=True)
    # the guild board (right wall of the hall)
    mp.tprop("tablica_kartki", 12, 4, group=g + " tablica")
    act(mp, 12, 5, "Tablica cechu", "Majster.tablica(this)", floor=True)
    RM.rug_k(mp, 5, 11, 9, 15, RUG_RED)
    for y in (12, 15):
        bench_h(mp, 2, y, group=g + " ławy")
    RM.barrel(mp, 12, 16, "water")
    RM.crate(mp, 1, 16, kind="tall")
    RM.doormat(mp, DOOR_X, 17)
    # ------------------------------------------------------------------ the workshop
    mp.piece("D", 0, 0, 1, 1, 16, 2, group=p + " tarcze", kind="tarcza", solid_rows=[])
    mp.tprop("zar_piec", 18, 4, group=p + " kuźnia")
    mp.ev(18, 4, "!Decoration2", 4, 6, 0, name="Żar kuźni", priority=0, through=True, step=True, note=L_FORGE)
    mp.tprop("kowadlo", 20, 6, group=p + " kuźnia")
    mp.tprop("szlifierka", 23, 5, group=p + " kuźnia")
    RM.barrel(mp, 21, 4, "water")
    RM.sacks(mp, 16, 5, wide=False)
    RM.crate(mp, 22, 8, kind="jug")                      # the coal crate (clue a: wet coal)
    act(mp, 22, 9, "Skrzynia z węglem", "Majster.slad('wegiel')", floor=True)
    table_h(mp, 18, 11, 4, style=6, group=p + " stół roboczy")
    on_table(mp, 18, 11, "D", 1, 15); on_table(mp, 20, 11, "D", 5, 10)
    stool(mp, 19, 12, group=p + " stołki")
    mp.tprop("skora_rama", 25, 4, group=p + " garbarnia")
    mp.tprop("skora_rama2", 27, 4, group=p + " garbarnia")
    mp.tprop("balia_tarka", 26, 8, group=p + " garbarnia")
    mp.tprop("cebrzyk_woda", 27, 8, group=p + " garbarnia")
    RM.lantern(mp, 24, 2, style=0)
    window(mp, 21, 1, curtain=None, group=p + " okna", length=130)
    window(mp, 27, 1, curtain=None, group=p + " okna", length=130)
    RM.rug_k(mp, 17, 14, 24, 16, RUG_BROWN)
    RM.sacks(mp, 27, 15)
    RM.crate(mp, 16, 16, kind="two")
    # the places the scenes use (Majster.js reads them: invisible markers) and the residents
    marker(mp, "m_polka", 3, 7, 8)
    marker(mp, "m_noc_ludwik", 12, 9, 4)
    mp.resident("ostap", 7, 6, 2)
    mp.resident("jas", 17, 12, 2)
    mp.resident("ludwik", 20, 9, 2)
    mp.exit_to(DOOR_X, DOOR_ID, TOWN_FRONT, "Drzwi -> Kruczogród (Cech)", room="Izba cechowa")
    mp.props.update({"autoplayBgm": True, "bgm": {"name": "", "pan": 0, "pitch": 100, "volume": 90}})
    return mp


def map_infos():
    src = json.loads(open(ROOT + "data/MapInfos.json", "rb").read().decode("utf-8"))
    out = copy.deepcopy(src)
    while len(out) <= MAP_ID: out.append(None)
    order = max(e["order"] for e in out if e) + 1
    out[MAP_ID] = {"id": MAP_ID, "expanded": False, "name": "Cech", "order": order, "parentId": TOWN, "scrollX": 1104, "scrollY": 708}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--render")
    a = ap.parse_args()
    mp = cech()
    os.makedirs(SDATA, exist_ok=True)
    path = os.path.join(SDATA, "Map%03d.json" % MAP_ID)
    n = mp.write(path, os.path.join(STAGING, "Map%03d_meta.json" % MAP_ID))
    print("Map215 Cech: %dx%d, %d events -> %s" % (mp.W, mp.H, n, os.path.relpath(path, ROOT)))
    if a.render:
        sys.path.insert(0, ROOT + "tools/town")
        import mzrender as R, irender as I
        img = I.grid(I.render(R.load_json(path)))
        img.save(a.render)
        print("picture:", a.render)


if __name__ == "__main__":
    main()
