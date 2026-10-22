# python tools/rozszerzenia/C/build_map177.py [--preview]
# PACZKA C „Ludzie” (docs/rozszerzenia/PLAN.md, C6): mapa 177 „Jaskinia przemytników” pod zatoczką przystani (Map125, wylot
# (16-17,64)). Szkielet pakietu 0 (20x14, tileset 12 „Podziemia: kwatery zakonu”) zostaje: jego właściwości (nazwa, wymiary, tileset,
# muzyka) - tu tylko kafle, zdarzenia i notatka. Na tych samych narzędziach co ręczne piętra podziemi i cysterna (tools/underground/
# uglib.py: DMap, kawałki D/C/E, pochodnie).
#   - zapis TYLKO do tools/rozszerzenia/C/Map177.json (układ edytora: wspolne.map_text); instaluje tools/rozszerzenia/instaluj.py
#     --paczka C --mapa 177 tools/rozszerzenia/C/Map177.json --wykonaj (edytor zamknięty)
#   - kontrakt z Ludzie_Data.js (CAVE): lądowanie (3,11), wyjście (3,12) -> Map125 (16,65), nisza ze skrzynią (13,3), stół z rejestrem
#     (9,5; 2 pola), miejsce Sławka (10,6), beczki (6,4); woda morska (słona: <Water:salt>) w zalewisku x 12-16, y 9-11
#   - podgląd: tools/rozszerzenia/C/out/map177.png (--preview)
# Pliki zapisuję binarnie, LF.
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/underground")
sys.path.insert(0, ROOT + "tools/rozszerzenia")
from uglib import (DMap, TILESET2, F_DIRT, W_ROUGH, FILM_DUST, FILM_MOSS, FILM_RUBBLE, FILM_CRACKS, script, page, render)   # noqa: E402
from places import UG_NOTE, torch                                                                                            # noqa: E402
from chunks_deep import CANDLE_LIGHT                                                                                         # noqa: E402
from wspolne import map_text                                                                                                 # noqa: E402

MAP_ID, W, H = 177, 20, 14
OUT_JSON = HERE + "/Map177.json"
OUT = HERE + "/out/"
SKELETON = ROOT + "data/Map177.json"
NOTE = UG_NOTE % (226, 226) + "\n<Water:salt>\n<Ludzie:jaskinia>"
WATER_KIND = 0                  # A1 rodzaj 0 zestawu Dungeon: woda o kamiennych, omszałych brzegach
LANDING, EXIT = (3, 11), (3, 12)
NICHE, TABLE, SEAT, BARRELS = (13, 3), (9, 5), (10, 6), (6, 4)
POOL = (12, 9, 16, 11)


def rect(x0, y0, x1, y1):
    return {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}


def build():
    mp = DMap(MAP_ID, W, H, "Jaskinia przemytników", NOTE, tileset=TILESET2)
    mp.props["autoplayBgs"] = False
    hall = rect(3, 3, 16, 8)
    lower = rect(5, 9, 16, 11)
    passage = rect(2, 9, 4, 12)
    floor = hall | lower | passage
    mp.shell(floor, F_DIRT, W_ROUGH)
    # the tidal pool (sea water: salt - Map177's note), its edge mossy
    x0, y0, x1, y1 = POOL
    water = rect(x0, y0, x1, y1)
    for c in water:
        mp.layers[0][c] = ("k", WATER_KIND)
        mp.solid.add(c)
    mp.floor -= water
    mp.shadows()
    for c in water: mp.shadow.pop(c, None)
    edge = {(x, y) for (x, y) in mp.floor if any((x + dx, y + dy) in water for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))}
    mp.film(FILM_MOSS, edge)
    mp.film(FILM_DUST, {(4, 4), (7, 6), (12, 4), (5, 7), (14, 6), (8, 10)})
    mp.film(FILM_RUBBLE, {(16, 3), (3, 8), (11, 11)})
    mp.film(FILM_CRACKS, {(6, 6), (11, 7)})
    # ---- the store: sacks, barrels, crates, planks, the niche in the north wall
    mp.piece("worki_stos", 3, 3)
    mp.piece("beczki_piramida", 5, 3)
    mp.piece("beczka", 8, 3)
    mp.piece("skrzynie_wysokie", 15, 3)
    mp.piece("deski_oparte", 16, 3)
    mp.piece("skrzynka_zamknieta", 11, 3)
    mp.piece("skrzynka_plotno", 3, 6)
    mp.piece("worek_rozsypany", 7, 8)
    mp.piece("kilof_oparty", 16, 6)
    mp.piece("mech_kepy", 5, 10)
    mp.piece("paprocie", 9, 10)
    mp.piece("nisza", NICHE[0], NICHE[1] - 2)
    mp.piece("lancuch", 4, 2)
    mp.piece("pajeczyna_rog", 16, 3, z=3)
    mp.piece("in_siennik", 13, 6)
    # ---- the events (Ludzie.js: Ludzie.act(this) by the note <Ludzie:...>)
    act = script("Ludzie.act(this);")
    mp.add(*EXIT, {"name": "Wyjście z jaskini (zatoczka)", "note": "<Ludzie:jaskinia_wyjscie>",
                   "pages": [page(image={"characterName": ""}, priority=0, trigger=1, through=True, cmds=act)]})
    mp.ev(*NICHE, "!$Lud_Skrzynia", 0, 2, 1, name="Nisza ze skrzynią", priority=1, through=False, cmds=act, note="<Ludzie:nisza>")
    mp.ev(*TABLE, "!$Lud_Stol", 0, 2, 1, name="Stół z rejestrem", priority=1, through=False, cmds=act,
          note="<Ludzie:stol><Occupy:right=1><LudOff:24,0>")
    mp.solid.add((TABLE[0] + 1, TABLE[1]))
    mp.ev(*BARRELS, "", 0, 2, 0, name="Beczki przemytników", priority=1, through=False, cmds=act, note="<Ludzie:beczki>")
    mp.light(TABLE[0] + 1, TABLE[1], CANDLE_LIGHT, name="Świeca na stole")
    torch(mp, 2, 8)
    torch(mp, 12, 2)
    mp.marker(*SEAT, "Miejsce: slawek_jaskinia", d=8)
    mp.marker(*LANDING, "Miejsce: jaskinia_ladowanie", d=8)
    return mp


def check(mp):
    reach = mp.reach(LANDING)
    need = {"lądowanie (3,11)": LANDING, "przed niszą (13,4)": (13, 4), "przy stole (9,6)": (9, 6), "miejsce Sławka (10,6)": SEAT,
            "przed beczkami (6,5)": (6, 5), "brzeg zalewiska (11,10)": (11, 10)}
    bad = [k for k, c in need.items() if c not in reach]
    if bad: raise SystemExit("nieosiągalne: " + ", ".join(bad))
    return len(reach)


def main(preview=False):
    mp = build()
    n = check(mp)
    skel = json.loads(open(SKELETON, "rb").read().decode("utf-8"))
    m = {k: v for k, v in skel.items() if k not in ("data", "events")}
    assert (m["width"], m["height"], m["tilesetId"]) == (W, H, TILESET2), "szkielet ma inne wymiary/tileset"
    m["note"] = NOTE
    m["data"] = mp.resolve()
    m["events"] = mp.build_events()
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    open(OUT_JSON, "wb").write(map_text(m).encode("utf-8"))
    print("Map177 -> %s (%d pól osiągalnych, %d zdarzeń)" % (OUT_JSON, n, len([e for e in m["events"] if e])))
    if preview:
        os.makedirs(OUT, exist_ok=True)
        render(mp.to_json(), OUT + "map177.png", scale=1.0)
        print("podgląd: " + OUT + "map177.png")


if __name__ == "__main__":
    main("--preview" in sys.argv)
