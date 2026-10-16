# python tools/garnizon/build_kwatera.py   -> tools/miejsca_wyspy/staging_D/data/Map163.json (+ tools/garnizon/staging/Map163_meta.json)
# KWATERA ROTMISTRZA (Map163, wnętrze kamiennego domu w garnizonie, tileset 8 - jak wnętrza miasteczka, Podgrodzia i przystani;
# powłoka i meble z tools/interiors/ilib.py i tools/wnetrza/rooms.py, wzór: tools/przystan/build_wnetrza.py, komora celna):
#   - kancelaria rotmistrza Bełzy: biurko z listą zaginionych, kałamarzem i świecą (rotmistrz za biurkiem 7-12 i 16-20 -
#     „Miejsce: rotmistrz_wnetrze”), dwie chorągwie z feniksem, mapa wyspy z zaznaczonym wrakiem, tablica z rozkazami,
#     polowe łóżko i skrzynia, kominek (jedyne ciepło - płomień), regał z księgami garnizonu
#   - wyjście: drzwi w dolnej ścianie -> Map162 przed drzwiami kwatery (42,18), twarzą w dół; drzwi kwatery na Map162 prowadzą na
#     (6,8) twarzą w górę (Garnizon.js, godziny 7-20)
# Nigdy nie zapisuje data/.
import os, sys, json
PHERE = os.path.dirname(os.path.abspath(__file__))
PROOT = os.path.abspath(os.path.join(PHERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, PROOT + "tools/wnetrza")
sys.path.insert(0, PROOT + "tools/interiors")
import rooms as RM                  # noqa: E402
from rooms import *                 # noqa: F401,F403
import ilib                         # noqa: E402

STAGING_DATA = PROOT + "tools/miejsca_wyspy/staging_D/data/"
STAGING_META = os.path.join(PHERE, "staging")
GARRISON, MAP_ID = 162, 163
EXIT_TO = (42, 18)                  # the cell in front of the quarters' door on Map162 (its door event: (42,17))
B_STONE = 16
W_PLASTER_BEAM = 51
F_FLAGS = 97
NOTE = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:85>\n<DarkNight:185>\n<Garnizon:kwatera>"


class Quarters(ilib.Interior):
    def exit_to(self, x, door_id, town_xy, name, room=None):
        tx, ty = town_xy
        cmds = [{"code": 250, "indent": 0, "parameters": [dict(ilib.DOOR_SE)]},
                {"code": 201, "indent": 0, "parameters": [0, GARRISON, tx, ty, 2, 0]}]
        e = {"name": name, "note": "", "pages": [blank_page(priority=0, trigger=1, cmds=cmds)]}
        self.add(x, self.H - 1, e)
        self.exits.append({"x": x, "y": self.H - 1, "door": door_id, "town": [tx, ty], "landing": [x, self.H - 2, 8], "name": name})
        self.hooks.append(("exit", x, self.H - 1))
        self.spots.setdefault("landing", [x, self.H - 2, 8])
        return e

    def look(self, x, y, name, text, floor=False):
        cmds = [{"code": 355, "indent": 0, "parameters": ["Tawerna.popup(%s, { color: \"info\" });" % json.dumps(text, ensure_ascii=False)]}]
        e = {"name": name, "note": "", "pages": [blank_page(priority=1 if floor else 0, trigger=0, cmds=cmds, through=not floor)]}
        self.add(x, y, e)
        return e


def kwatera():
    W, H = 13, 10
    mp = Quarters(MAP_ID, W, H, "Kwatera rotmistrza", "kwatera", note=NOTE)
    DOOR_X = 6
    mp.shell([("Kancelaria", [(1, 4, 11, 8)], F_FLAGS, W_PLASTER_BEAM)], border=B_STONE, exit_x=DOOR_X)
    mp.shadows()
    g = "Kancelaria"
    window2(mp, 2, 1, curtain=3, length=90)
    window2(mp, 9, 1, curtain=3, length=90)
    # the royal standard: two phoenix banners on the wall behind the desk, the island's map between them
    banner(mp, 5, 2, 1, group=g)
    banner(mp, 8, 2, 1, group=g)
    mp.tprop("mapa_wyspy", 6, 2, group=g, name="Mapa Kruczej Wyspy")
    mp.look(6, 3, "Mapa Kruczej Wyspy", "Mapa wyspy. Węglem zaznaczony wrak na mieliźnie, przystań, garnizon - i znak zapytania nad Kruczymi Skałami.")
    mp.tprop("tablica_kartki", 4, 2, group=g, name="Rozkazy garnizonu")
    mp.look(4, 3, "Rozkazy garnizonu", "„Warta przy beczkach dzień i noc. Łódź do wraku 9-15. Pobór tylko według listy. Kto pije wodę morską - do lazaretu.”")
    # the desk: the list of the missing, the inkwell, a candle; the captain behind it
    table_h(mp, 5, 5, 3, style=6, group=g + " biurko")
    on_top(mp, 5, 5, "D", 6, 11); on_top(mp, 6, 5, "D", 4, 14); on_top(mp, 7, 5, "D", 7, 13)
    candle_on(mp, 7, 5)
    mp.look(6, 6, "Lista zaginionych", "Lista zaginionych czterech chorągwi. Same chorągwie i liczby. „Chorągiew brzozowska: 22 - zaginiony.”")
    # the camp bed and the captain's chest (right), the fireplace (left), books of the garrison
    bed(mp, (9, 13), 11, 4, group=g, kind="łóżko polowe")
    plain_chest(mp, 11, 7, group=g, name="Skrzynia rotmistrza")
    mp.look(11, 6, "Skrzynia rotmistrza", "Zamknięta. Na wieku wypalony feniks i inicjały „F.B.”.")
    fireplace_pic(mp, 1, 4, kind=2, group=g)
    bookcase(mp, 3, 4, w=1)
    sacks(mp, 1, 7, wide=False)
    rug_k(mp, 5, 6, 7, 7, RUG_RED)
    doormat(mp, DOOR_X, 8)
    mp.resident("rotmistrz", 6, 4, 2)
    mp.exit_to(DOOR_X, 0, EXIT_TO, "Drzwi -> Garnizon")
    return mp


def main():
    mp = kwatera()
    os.makedirs(STAGING_DATA, exist_ok=True)
    os.makedirs(STAGING_META, exist_ok=True)
    path = STAGING_DATA + "Map%03d.json" % MAP_ID
    n = mp.write(path, os.path.join(STAGING_META, "Map%03d_meta.json" % MAP_ID))
    print("Map163 Kwatera rotmistrza: %dx%d, %d zdarzeń -> %s" % (mp.W, mp.H, n, os.path.relpath(path, PROOT)))


if __name__ == "__main__":
    main()
