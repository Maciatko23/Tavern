# python tools/w5/build_piwnica.py [--render PATH]
#   -> tools/w5/staging/data/Map171.json (+ tools/w5/staging/Map171_meta.json) i tools/w5/staging/data/MapInfos.json (kopia
#      data/MapInfos.json z nowym wpisem 171 pod Kantorem, Map103). Nigdy nie zapisuje data/ - instalacja: tools/w5/install.py
#      (tylko przy zamkniętym edytorze RPG Maker).
#
# PIWNICA KANTORU (Map171, wątek W5 „Towary z kontynentu”, Kantor.js), tileset 8 jak wnętrza miasteczka (tools/interiors/ilib.py,
# wzór: Archiwum zakonu w tools/quest_places/places.py). Pod kantorem Baltazara Veya (Map103, mapa użytkownika - bez zmian; do
# piwnicy prowadzi klapa w podłodze zaplecza (5,9), zdarzenie wstrzykiwane przez Kantor.js):
#   - skład (x1-11): kamienne schody w łuku w górę (2,3) -> Map103 (5,10); dwadzieścia beczek „wina” pod północną ścianą (sterty
#     beczek i beczki z czerwonym winem - D9 „Spis beczek”: „pachnie mułem i żelazem”), skrzynie, worki, latarnia na ścianie;
#     miejsca, które Kantor.js wypełnia nocą: sterta skrzyń do wyniesienia, worki zboża z rekwizycji, skrzynia z kamieniami z
#     krukiem, Sławek (pomocnik Baltazara)
#   - gabinet (x13-17, wejście przez otwór w ścianie (12,8)): biurko Baltazara z wagą i monetami (rejestr - zdarzenie Kantor.js),
#     krzesło, świeca, kandelabr, mapa Kruczej Wyspy na ścianie, regał z księgami rachunkowymi, szkatuła (karta 1 kronik -
#     Kantor.js), dywan, kufer
# Każde światło to ogień: latarnia, świece, kandelabr; w piwnicy ciemno o każdej porze (<DarkDay:200>).
import os, sys, json, copy, argparse
W5_HERE = os.path.dirname(os.path.abspath(__file__))     # (before the star imports: they bring the tavern's HERE)
HERE = W5_HERE
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/wnetrza")
sys.path.insert(0, ROOT + "tools/interiors")
import rooms as RM                  # noqa: E402  (barrel, sacks, crate, bookcase, rug_k...)
from ilib import *                  # noqa: F401,F403  Interior, the cottage / tavern macros, blank_page, A5...

W5_STAGING = os.path.join(W5_HERE, "staging")
W5_DATA = os.path.join(W5_STAGING, "data")
MAP_ID, KANTOR = 171, 103
KANTOR_LAND = (5, 10, 2)            # Map103: the floor below the trapdoor (5,9), facing down
LAND = (2, 4, 2)                    # Map171: the foot of the stairs, facing down
B_STONE, W_RAW = 16, 71
F_COBBLE, F_SLATE = 96, 117
DUST = 23
W5_NOTE = "<Dust:on>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:200>\n<DarkNight:205>\n<Ambience:interior>\n<Kantor:piwnica>"
L_LANTERN = "<Light:210,90,62,24>"            # (no LightWhen: the cellar is dark day and night - the flame always burns)
L_CANDLE = "<Light:120,120,80,30>"
L_CANDELABRA = "<Light:150,130,90,34>"


def w5_se(name, vol=80, pitch=100):
    return {"code": 250, "indent": 0, "parameters": [{"name": name, "volume": vol, "pitch": pitch, "pan": 0}]}


def w5_transfer(mid, x, y, d, fade=0):
    return {"code": 201, "indent": 0, "parameters": [0, mid, x, y, d, fade]}


def look(mp, x, y, name, text, floor=False):
    """a thing that says what it is (a popup over the hero): action button, priority as given"""
    cmds = [{"code": 355, "indent": 0, "parameters": ["Tawerna.popup(%s, { kind: \"info\" });" % json.dumps(text, ensure_ascii=False)]}]
    e = {"name": name, "note": "", "pages": [blank_page(priority=1 if floor else 0, trigger=0, cmds=cmds, through=not floor)]}
    mp.add(x, y, e)
    return e


def marker(mp, key, x, y, d=2):
    e = {"name": "Miejsce: %s" % key, "note": "", "pages": [blank_page(priority=0, through=True, image={"direction": d})]}
    mp.add(x, y, e)
    mp.spots[key] = [x, y, d]
    return e


def piwnica():
    W, H = 19, 12
    mp = Interior(MAP_ID, W, H, "Piwnica kantoru", "piwnica_kantoru", note=W5_NOTE)
    mp.shell([("Skład", [(1, 4, 11, 10)], F_COBBLE, W_RAW), ("Gabinet", [(13, 4, 17, 10)], F_SLATE, W_RAW)],
             openings=[("Gabinet", (12, 8, 12, 8))], border=B_STONE)
    mp.shadows()
    g, o = "Skład", "Gabinet"
    # ---- the stairs up (north-west corner): stone stairs in an arch; walking into them -> the kantor's back room
    mp.tprop("schody_luk", 2, 3, group=g, name="Schody do kantoru")
    mp.ev(2, 3, "", 0, 2, 0, name="Schody -> Kantor", priority=1, through=False, trigger=1,
          cmds=[w5_se("Move1", 80, 100), w5_transfer(KANTOR, KANTOR_LAND[0], KANTOR_LAND[1], KANTOR_LAND[2])])
    mp.spot("landing", LAND[0], LAND[1], LAND[2])
    marker(mp, "schody", LAND[0], LAND[1], 8)
    mp.ev(4, 3, "!Decoration", 7, 2, 0, name="Latarnia", priority=0, through=True, step=True, note=L_LANTERN)
    # ---- the twenty barrels of "wine" along the north wall: two piles of barrels and red-wine barrels at the ends
    for x in (6, 9):
        mp.tprop("sterta_beczek", x, 4, group=g + " beczki", name="Beczki „wina”")
    for x in (4, 11):
        RM.barrel(mp, x, 5, kind="wine")
    look(mp, 7, 5, "Beczki „wina”", "Dwadzieścia beczek. Baltazar mówi, że to wino. Pachnie mułem i żelazem.", floor=True)
    # ---- crates and sacks: the west wall and the south-east corner
    RM.crate(mp, 1, 7, kind="tall"); RM.crate(mp, 1, 8, kind="two")
    RM.sacks(mp, 1, 10, wide=True)
    RM.crate(mp, 10, 10, kind="jug"); RM.crate(mp, 11, 10, kind="tall")
    mp.t("D", 11, 5, 9, 10, z=2)                                  # rubble on the floor
    mp.piece("D", 13, 7, 1, 1, 1, 1, z=3, group=g, kind="pajęczyna", solid_rows=[])
    # the places Kantor.js fills at night (only markers here)
    marker(mp, "w5_sterta", 8, 9, 2)        # the pile of crates to carry up
    marker(mp, "w5_worki", 5, 9, 2)         # the grain sacks with the court's seal (night 1)
    marker(mp, "w5_kamienie", 3, 8, 2)      # the open crate with raven stones (night 2)
    marker(mp, "w5_slawek", 9, 7, 8)        # Sławek, Baltazar's man, by the barrels - three steps from the office's door
    marker(mp, "w5_siedzisko", 3, 6, 2)     # a crate to sit on and wait (night 3)
    RM.rug_k(mp, 5, 7, 7, 8, RM.RUG_BROWN)
    mp.kind(1, {(2, 9), (3, 9), (4, 10), (9, 6), (10, 6), (10, 7), (2, 6)}, DUST)
    # ---- the office: the desk (14..16 x 5..6) with scales and coins, the chair behind it, a candle, a candelabra by the door
    table_h(mp, 14, 5, 3, style=6, group=o + " biurko")
    on_table(mp, 14, 5, "D", 4, 14)     # the scales
    on_table(mp, 16, 5, "D", 4, 15)     # coins
    on_table(mp, 16, 6, "D", 6, 13)     # a rolled paper
    mp.ev(14, 6, "!Decoration2", 1, 6, 0, name="Świeca na biurku", priority=0, through=True, step=True, note=L_CANDLE)
    chair(mp, 15, 4, 2, arm=True, group=o)
    marker(mp, "w5_baltazar", 15, 4, 2)     # Baltazar at his desk
    marker(mp, "w5_biurko", 15, 6, 2)       # the register (Kantor.js: the desk's event)
    mp.ev(13, 9, "!Decoration2", 4, 6, 0, name="Kandelabr", priority=1, through=False, step=True, note=L_CANDELABRA)
    # the walls: the island's map, the ledgers; the strongbox and a chest; a rug
    mp.tprop("mapa_wyspy", 15, 2, group=o, name="Mapa Kruczej Wyspy")
    look(mp, 15, 3, "Mapa Kruczej Wyspy", "Mapa wyspy. Kamienne kręgi zaznaczone kredą: Urwisko, kopiec przy chacie dziadka, wzgórze tawerny. Przy Kruczych Skałach: „drzwi?”.")
    RM.bookcase(mp, 17, 4, w=1)
    look(mp, 17, 5, "Księgi rachunkowe", "Księgi rachunkowe kantoru. Sukno, przyprawy, sól. Same uczciwe pozycje - za uczciwe.")
    thing(mp, 17, 10, "!Fantasy_chest", 0, 2, 0, "Okuty kufer", kind="kufer", group=o)
    marker(mp, "w5_szkatula", 17, 8, 4)     # the strongbox (Kantor.js: card 1 of the chronicles)
    RM.rug_k(mp, 14, 8, 16, 9, RM.RUG_RED_GOLD)
    mp.piece("D", 15, 7, 1, 1, 17, 1, z=3, group=o, kind="pajęczyna", solid_rows=[])
    # the silence of a cellar (the town's music stops)
    mp.props.update({"autoplayBgm": True, "bgm": {"name": "", "pan": 0, "pitch": 100, "volume": 90}})
    return mp


def map_infos():
    src = json.loads(open(ROOT + "data/MapInfos.json", "rb").read().decode("utf-8"))
    out = copy.deepcopy(src)
    while len(out) <= MAP_ID: out.append(None)
    order = max(e["order"] for e in out if e) + 1
    out[MAP_ID] = {"id": MAP_ID, "expanded": False, "name": "Piwnica kantoru", "order": order, "parentId": KANTOR,
                   "scrollX": 1104, "scrollY": 708}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--render")
    a = ap.parse_args()
    mp = piwnica()
    os.makedirs(W5_DATA, exist_ok=True)
    path = os.path.join(W5_DATA, "Map%03d.json" % MAP_ID)
    n = mp.write(path, os.path.join(W5_STAGING, "Map%03d_meta.json" % MAP_ID))
    infos = map_infos()
    text = "[\n" + ",\n".join(json.dumps(e, ensure_ascii=False, separators=(",", ":")) for e in infos) + "\n]"
    open(os.path.join(W5_DATA, "MapInfos.json"), "wb").write(text.encode("utf-8"))
    print("Map171 Piwnica kantoru: %dx%d, %d zdarzeń -> %s" % (mp.W, mp.H, n, os.path.relpath(path, ROOT)))
    if a.render:
        sys.path.insert(0, ROOT + "tools/town")
        import mzrender as R, irender as I
        img = I.grid(I.render(R.load_json(path)))
        img.save(a.render)
        print("obraz:", a.render)


if __name__ == "__main__":
    main()
