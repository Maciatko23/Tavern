# python showroom.py  -> tools/tavern/staging/Showroom.json (+ Showroom_meta.json: where every prop stands)
# Small maps on tileset 8 to look at the new props in the game, next to Winlu pieces: cream plaster walls (A3 52) and
# red-brown boards (A4 84) like the tavern. Rendered by render.js (as map id 98, data/ untouched); doc_props.py cuts the
# render into the labelled sheet docs/tawerna_nowa/rekwizyty.png.
#   python showroom.py          - every prop (for rekwizyty.png)
#   python showroom.py board    - only the quest board (for tablica_zlecen.png)
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tavlib import *
from props import light, wall_lantern, round_table, table_h, chair, stool, counter_h, candelabra, deer_head, banner, window

IDX = json.load(open(os.path.join(HERE, "props_index.json"), encoding="utf-8"))
NOTE = "<Dust:off>\n<Dark:on>\n<DayNight:off>"

def prop_event(mp, x, y, key, priority=None, name=None, note=""):
    p = IDX[key]
    if priority is None: priority = 1 if p["place"] in ("floor", "floor2", "floor3") else 0
    e = mp.picture(x, y, p["sheet"], p["index"], p["direction"], p["pattern"], name=name or p.get("name", key), priority=priority,
                   through=priority != 1, note=note, step=bool(p.get("anim")))
    return e

class Show:
    def __init__(self, W, H):
        self.mp = TavernMap(W, H, NOTE, display="Showroom", seed=5)
        self.mp.id = 98
        self.mp.keep_slots = 0
        self.mp.kind(0, self.mp.all, 24)
        self.labels = []      # (text, x, y, "new" | "winlu")
    def room(self, x0, y0, x1, y1, wall=52, floor=84):
        mp = self.mp
        mp.kind(0, mp.rect(x0, y0 - 3, x1, y0 - 1), wall)
        mp.kind(0, mp.rect(x0, y0, x1, y1), floor)
    def put(self, x, y, key, label_y=None, **kw):
        prop_event(self.mp, x, y, key, **kw)
        self.labels.append((IDX[key].get("name", key), x, label_y if label_y is not None else y + 1, "new"))
    def winlu(self, text, x, y):
        self.labels.append((text, x, y, "winlu"))

def board_only():
    s = Show(18, 10)
    s.room(1, 4, 16, 8)
    prop_event(s.mp, 8, 4, "tablica_zlecen", note="<Occupy:left=1,right=1>")
    light(s.mp, 9, 3, "<Light:210,120,90,40>", "latarnia tablicy")
    light(s.mp, 8, 6, "<Light:280,34,26,12>", "wypelnienie")
    wall_lantern(s.mp, 3, 1, 0); wall_lantern(s.mp, 14, 1, 0)
    return s

def everything():
    """three rooms: 1) wall things, 2) floor things, 3) tables and counters with the small things on them"""
    s = Show(32, 26)
    mp = s.mp
    s.room(1, 4, 30, 7)          # room 1: the wall props on its north wall
    s.room(1, 12, 30, 16)        # room 2: floor props
    s.room(1, 21, 30, 24)        # room 3: tables, counter
    # ---- room 1 wall (face rows 1..3): events on row 3 (wall) or 2 (wall_hi)
    s.put(2, 2, "gobelin_polowanie", 5)
    s.put(4, 2, "gobelin_kufel", 5)
    banner(mp, 6, 2, 2); s.winlu("chorągiew Winlu", 6, 5)
    s.put(8, 3, "glowa_dzika", 5)
    deer_head(mp, 10, 2); s.winlu("jeleń Winlu", 10, 5)
    s.put(13, 3, "tablica_kreda", 5)
    s.put(16, 3, "cennik", 5)
    s.put(19, 3, "kufle_wieszak", 5)
    s.put(22, 3, "mapa", 5)
    s.put(25, 3, "wlocznie", 5)
    s.put(27, 3, "tarcza_rzutki", 5)
    s.put(29, 3, "klucze", 5)
    # room 1 floor: the hanging sign, the no-spit plaque, the spice shelf, a mouse hole, the Winlu mouse hole
    window(mp, 12, 9, "night")
    # ---- room 2 (wall face rows 9..11): more wall things, then floor props on row 14
    s.put(2, 11, "szyld_kufel", 13)
    s.put(5, 11, "nie_pluc", 13)
    s.put(7, 11, "polka_przyprawy", 13)
    s.put(9, 11, "mysia_dziura", 13)
    mp.t("D", 14, 10, 10, 11, z=2); s.winlu("mysia dziura Winlu", 10, 13)
    mp.tiles("D", 6, 2, 1, 2, 11, 10); s.winlu("półka Winlu", 11, 13)
    s.put(14, 14, "kot_spiacy", 15)
    s.put(16, 14, "pies_spiacy", 15)
    s.put(18, 14, "kapelusz_monety", 15)
    s.put(19, 14, "bebenek", 16)
    s.put(20, 14, "szkatula", 15)
    s.put(22, 14, "lutnia_stojak", 15)
    s.put(23, 14, "pulpit_nuty", 16)
    s.put(25, 14, "wieszak", 15)
    s.put(26, 14, "stojak_laski", 16)
    s.put(28, 14, "cebrzyk", 15)
    s.put(29, 14, "stolek_reczniki", 16)
    table_h(mp, 2, 14, 5, style=4)                  # a long table with things on it (events on its lower row)
    s.put(3, 15, "flet", 16); s.put(4, 15, "ksiega_rachunkowa", 17); s.put(5, 15, "butelki", 16)
    mp.t("D", 3, 13, 2, 14, z=3); s.winlu("kufel Winlu (kafelek)", 2, 17)
    mp.t("D", 1, 12, 6, 14, z=3); s.winlu("butelka Winlu", 6, 17)
    mp.tiles("D", 13, 0, 1, 2, 13, 13); s.winlu("beczka Winlu", 13, 16)
    chair(mp, 12, 14, 2); s.winlu("krzesło Winlu", 12, 16)
    # ---- room 3 (wall face rows 18..20): the big floor props and the tables
    s.put(3, 22, "kociol_miedziany", 24)
    s.put(6, 22, "kadz", 24)
    s.put(9, 22, "balia", 24)
    s.put(12, 22, "worki_chmiel", 24)
    s.put(15, 22, "worki_slod", 24)
    mp.tiles("D", 8, 2, 2, 2, 17, 21); s.winlu("worki Winlu", 17, 24)
    # counter with the bar things (events on the counter's front row, the pictures on its top)
    counter_h(mp, 20, 29, 21)
    for (x, key) in ((21, "dzwonek"), (22, "kasetka"), (23, "butelki_lada"), (25, "krany"), (28, "swieca_lada")):
        s.put(x, 22, key, 20 if x % 2 else 19)
    # tables with the gaming things (events on the tables' lower row)
    for i, (x, key) in enumerate(((20, "kubek_kosci"), (22, "karty"), (24, "monety"), (26, "warcaby"), (28, "swieca"))):
        mp.tiles("E", 7, 11, 1, 2, x, 23)
        s.put(x, 24, key, 25)
    # the water barrel with the ladle
    mp.tiles("D", 13, 0, 1, 2, 18, 22)
    s.put(18, 23, "chochla", 25)
    # light: an even soft light everywhere (the doc wants the colours, not the mood)
    for (x, y) in ((6, 5), (16, 5), (26, 5), (6, 14), (16, 14), (26, 14), (6, 23), (16, 23), (26, 23)):
        light(mp, x, y, "<Light:330,20,16,8>", "swiatlo")
    return s

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    s = board_only() if which == "board" else everything()
    path = os.path.join(STAGING, "Showroom.json" if which == "board" else "Showroom_all.json")
    s.mp.write_to(path)
    with open(path.replace(".json", "_meta.json"), "wb") as f:
        f.write(json.dumps({"W": s.mp.W, "H": s.mp.H, "labels": s.labels}, ensure_ascii=False).encode("utf-8"))
    print("wrote", path, len(s.labels), "labels")
