# python tools/w7/build_dwor.py [--render DIR]
#   -> tools/w7/staging/data/Map172.json, Map173.json, Map174.json (+ *_meta.json obok) i tools/w7/staging/data/MapInfos.json
#      (kopia data/MapInfos.json z trzema nowymi wpisami pod Posiadłością Lorda, Map024). Nigdy nie zapisuje data/ - instalacja:
#      tools/w7/install.py (tylko przy zamkniętym edytorze RPG Maker).
#
# WNĘTRZE DWORU LORDA (wątek W7 „Dwór z kamieni twierdzy”, Dwor.js), tileset 8 jak odnowione wnętrza miasteczka
# (tools/interiors/ilib.py + makra tools/house i tools/tavern). Mapa dworu Map024 to mapa autora - jej kafelki zostają bez zmian;
# do środka prowadzą drzwi dworu (zdarzenie 1) - w kodzie (Dwor.js), kiedy bohater jest zaproszony. Trzy mapy:
#   - Map172 „Dwór - Hol”: mur z kamieni dawnej twierdzy (A3 rodzaj 67), co dziesiąty kamień z wyrytym krukiem (nakładki
#     !W7_Dwor), trzy kruki wyjęte i zastąpione zwykłym kamieniem na świeżej zaprawie (robota Feliksa - W7 rozdz. 2 i 4);
#     wielkie schody na piętro (!$W7_Schody), dwa kominki, chorągwie Zaleskich, zbroje, portrety przodków, żyrandol, gwiazda w
#     posadzce, pulpit kamerdynera z księgą gości (Feliks / Teodor stoją tu za dnia - TownLife), drzwi do biblioteki i gabinetu
#   - Map173 „Dwór - Biblioteka”: ściana półek z księgami, regały, kominek, pulpit z kroniką rodu (W3 - piąta zwrotka; W7 rozdz. 2),
#     stół do czytania, fotele, drabina, globus
#   - Map174 „Dwór - Gabinet”: biurko jaśnie pana (rachunki, które podpisuje, nie czytając), kantorek Feliksa z szufladą (listy -
#     W7 rozdz. 4), szkatuła, mapa wyspy z dopiskami, portret syna Kazimierza (W7 rozdz. 7), kominek, okno; klapa w podłodze -
#     stary kanał zakonu pod dworem, którym nocą chodzi Feliks: do włazu z krukiem za oranżerią (Map024 3,20 - zdarzenie autora)
# Każde światło to ogień: kominki, świece, kandelabry, kinkiety, żyrandol.
import os, sys, json, copy, argparse
W7_HERE = os.path.dirname(os.path.abspath(__file__))
W7_ROOT = os.path.abspath(os.path.join(W7_HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, W7_ROOT + "tools/wnetrza")
sys.path.insert(0, W7_ROOT + "tools/interiors")
import rooms as RM                  # noqa: E402  (barrel, crate, bookcase, rug_k, plant_pot...)
from ilib import *                  # noqa: F401,F403  Interior, house / tavern macros, blank_page, A5...

W7_STAGING = os.path.join(W7_HERE, "staging")
W7_DATA = os.path.join(W7_STAGING, "data")
MANOR = 24
HOL, BIB, GAB = 172, 173, 174
NAMES = {HOL: "Dwór - Hol", BIB: "Dwór - Biblioteka", GAB: "Dwór - Gabinet"}
# where one lands (the contract with Dwor_Data.js PLACES - the test checks it)
HOL_LAND, HOL_FROM_BIB, HOL_FROM_GAB = (11, 13, 8), (3, 4, 2), (19, 4, 2)
BIB_LAND, GAB_LAND, GAB_TRAP_LAND = (8, 10, 8), (7, 9, 8), (11, 8, 4)
MANOR_DOOR_LAND = (20, 13, 2)        # Map024: before the manor's door (event 1 "Drzwi dworu" at 20,12)
MANOR_HATCH_LAND = (3, 21, 2)        # Map024: below the author's wooden hatch with the raven (3,20)
NOTE_HALL = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:85>\n<DarkNight:190>\n<Dwor:mapa>"
NOTE_ROOM = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:70>\n<DarkNight:185>\n<Dwor:mapa>"
B_STONE, B_WOOD = 16, 24
W_FORT, W_PANEL, W_PAPER = 67, 54, 56
F_CHECK, F_PARQ, F_DARK = 87, 80, 83
RUG_RED, RUG_RED_GOLD, RUG_PURPLE = 36, 38, 22
L_CANDLE_DESK = "<Light:120,120,80,30><LightWhen:night>"


def se(name, vol=80, pitch=100):
    return {"code": 250, "indent": 0, "parameters": [{"name": name, "volume": vol, "pitch": pitch, "pan": 0}]}


def go(mid, x, y, d, fade=0):
    return {"code": 201, "indent": 0, "parameters": [0, mid, x, y, d, fade]}


def script(js):
    return {"code": 355, "indent": 0, "parameters": [js]}


def dwor_ev(mp, x, y, key, name, char="", idx=0, d=2, pat=0, priority=1, trigger=0, through=False, note="", step=False):
    """an event that answers through Dwor.js (Dwor.act(this) - by its <Dwor:key> tag)"""
    e = mp.ev(x, y, char, idx, d, pat, name=name, priority=priority, through=through, step=step, note="<Dwor:%s>%s" % (key, note),
              trigger=trigger, cmds=[script("Dwor.act(this);")])
    return e


def look(mp, x, y, name, text, priority=1):
    """a thing that says what it is (a popup over the hero): action button"""
    cmds = [script("Tawerna.popup(%s, { kind: \"info\" });" % json.dumps(text, ensure_ascii=False))]
    e = {"name": name, "note": "", "pages": [blank_page(priority=priority, trigger=0, cmds=cmds, through=priority != 1)]}
    mp.add(x, y, e)
    return e


def marker(mp, key, x, y, d=2):
    e = {"name": "Miejsce: %s" % key, "note": "", "pages": [blank_page(priority=0, through=True, image={"direction": d})]}
    mp.add(x, y, e)
    mp.spots[key] = [x, y, d]
    return e


def door(mp, x, y, name, cmds, idx=2):
    """a door in a back wall: the arched stone door (!Fantasy_door2) on the wall face's bottom row; walking into it opens it"""
    e = mp.ev(x, y, "!Fantasy_door2", idx, 2, 0, name=name, priority=1, through=False, trigger=1, cmds=cmds)
    mp.hooks.append(("door", x, y))
    return e


def raven_wall(mp, cells, fresh, lookable):
    """the raven stones over the wall face: !W7_Dwor 0 dir 2 (carved, 3 variants), dir 4 (a plain stone in its place)"""
    for i, (x, y) in enumerate(sorted(cells)):
        if (x, y) in fresh:
            d, pat, name = 4, i % 3, "Kamień bez kruka (świeża zaprawa)"
            text = "Tu powinien być kruk. Kamień jaśniejszy od innych, zaprawa wokół biała i świeża. Ktoś go niedawno wymienił."
        else:
            d, pat, name = 2, (x + y) % 3, "Kamień z krukiem"
            text = "Kamień z dawnej twierdzy z wyrytym krukiem. Co dziesiąty kamień w tej ścianie ma takiego kruka."
        prio = 1 if (x, y) in lookable else 0
        cmds = [script("Dwor.act(this);")] if prio == 1 else None
        mp.ev(x, y, "!W7_Dwor", 0, d, pat, name=name, priority=prio, through=prio != 1, note="<Dwor:%s>" % ("brak" if (x, y) in fresh else "kruk"),
              cmds=cmds)
    mp.notes.append("kruki: %d, w tym bez kruka: %d" % (len(cells), len(fresh)))


# ======================================================================================================================
def hol():
    W, H = 23, 15
    mp = Interior(HOL, W, H, NAMES[HOL], "dwor_hol", note=NOTE_HALL)
    mp.shell([("Hol", [(1, 4, 21, 13)], F_CHECK, W_FORT)], border=B_STONE, exit_x=11)
    mp.shadows()
    g = "Hol"
    # ---- the floor: the star of the Order in the middle, a red runner from the door to the stairs
    mp.tiles("A5", 3, 8, 3, 3, 10, 8, z=0)
    RM.rug_k(mp, 10, 11, 12, 13, RUG_RED)
    RM.rug_k(mp, 10, 6, 12, 7, RUG_RED)
    # ---- the back wall, left to right
    taken = set()
    door(mp, 3, 3, "Drzwi do biblioteki", [se("Door1"), go(BIB, *BIB_LAND)])
    taken |= {(3, 2), (3, 3)}
    mp.ev(3, 1, "!W7_Dwor", 0, 6, 0, name="Kruk nad drzwiami", priority=0, through=True)
    taken.add((3, 1))
    dwor_ev(mp, 19, 3, "gabinetDrzwi", "Drzwi do gabinetu", "!Fantasy_door2", 2, 2, 0, trigger=1)
    mp.hooks.append(("door", 19, 3))
    taken |= {(19, 2), (19, 3)}
    mp.ev(19, 1, "!W7_Dwor", 0, 6, 0, name="Kruk nad drzwiami", priority=0, through=True)
    taken.add((19, 1))
    # two fireplaces (stone, the chimney up the wall), the Zaleskis' banners beside them
    for fx in (6, 16):
        mp.ev(fx, 4, "!$Fireplace2", 0, 4, 0, name="Kominek", priority=1, through=False, step=True, note=lamp_note("fireplace"))
        mp.rec("fireplace", "floorprop", {(fx, 4)}, g, x=fx, y=4)
        mp.solid.add((fx, 4))
        taken |= {(fx, 1), (fx, 2), (fx, 3)}
    for bx in (7, 15):
        banner(mp, bx, 2, 0, group=g)
        taken |= {(bx, 1), (bx, 2)}
    # suits of armour flanking the stairs, candelabras before them
    for sx in (8, 14):
        statue(mp, sx, 4, pattern=1, group=g)
        taken |= {(sx, 2), (sx, 3)}
    candelabra(mp, 9, 5, group=g)
    candelabra(mp, 13, 5, group=g)
    # the grand stairs up to the Lord's rooms (a 3 x 5 picture standing on row 5)
    mp.ev(11, 5, "!$W7_Schody", 0, 2, 0, name="Schody na piętro", priority=1, through=False, note="<Occupy:left=1,right=1,up=1><Dwor:schody>",
          cmds=[script("Dwor.act(this);")])
    mp.solid |= mp.rect(10, 4, 12, 5); mp.blocked |= mp.rect(10, 4, 12, 5)
    taken |= mp.rect(10, 1, 12, 3)
    # the ancestors: the grandfather who built the manor (left), the Lady (right); a deer head and crossed spears between
    painting(mp, 2, 2, 7, 8, 2, group=g)
    look(mp, 2, 3, "Portret", "Stary pan Zaleski - dziadek jaśnie pana, który postawił dwór z kamieni twierdzy. Ręka na mapie wyspy.")
    taken |= {(2, 2), (2, 3)}
    deer_head(mp, 9, 1, group=g)
    taken |= {(9, 1), (9, 2)}
    mp.tprop("kruk_plaskorzezba", 13, 2, group=g, name="Płaskorzeźba z krukiem")
    taken |= {(13, 1), (13, 2)}
    # ---- the raven stones: on the free cells of the wall face, a fixed pattern (every fifth cell or so); three of them gone -
    # plain stones on fresh mortar, by the study's door (Feliks's work)
    face = {(x, y) for x in range(1, 22) for y in range(1, 4)} - taken
    ravens = {(x, y) for (x, y) in face if (x * 7 + y * 13) % 2 == 0}
    fresh = {(18, 3), (21, 3), (15, 3)} & ravens
    if len(fresh) < 3:   # (keep three by the study's door, whatever the pattern gave)
        for c in [(18, 3), (21, 1), (15, 3), (12, 3), (18, 1)]:
            if c in face and len(fresh) < 3:
                ravens.add(c); fresh.add(c)
    raven_wall(mp, ravens, fresh, lookable={c for c in ravens if c[1] == 3})
    mp.spots["kruki"] = sorted(ravens); mp.spots["kruki_brak"] = sorted(fresh)
    # ---- the butler's lectern with the guest book by the study's door; the butler stands behind it by day (TownLife)
    mp.piece("C", 3, 2, 1, 2, 18, 6, group=g, kind="pulpit kamerdynera")
    dwor_ev(mp, 18, 7, "ksiegaGosci", "Księga gości", priority=1)
    marker(mp, "feliks_hol", 18, 5, 2)
    marker(mp, "kamerdyner_hol", 18, 5, 2)
    # ---- the sides: benches under the portraits, plants in the corners, a chandelier over the star
    bench_v(mp, 1, 7, 3, group=g)
    bench_v(mp, 21, 7, 3, group=g)
    plant(mp, 1, 5, group=g, kind=0); plant(mp, 21, 5, group=g, kind=0)
    plant(mp, 1, 12, group=g, kind=2); plant(mp, 21, 12, group=g, kind=2)
    chandelier(mp, 11, 9, group=g)
    candelabra(mp, 4, 12, group=g)
    candelabra(mp, 18, 12, group=g)
    # ---- the way out: the manor's door (Map024, before event 1)
    mp.exits.append({"x": 11, "y": H - 1, "to": MANOR, "at": list(MANOR_DOOR_LAND)})
    mp.ev(11, H - 1, "", 0, 2, 0, name="Wyjście -> Posiadłość Lorda", priority=0, through=False, trigger=1,
          note="<Dwor:wyjscie>", cmds=[se("Door1"), go(MANOR, *MANOR_DOOR_LAND)])
    mp.spot("landing", *HOL_LAND)
    marker(mp, "lord_hol", 12, 12, 4)
    marker(mp, "lord_kruki", 16, 5, 8)
    return mp


# ======================================================================================================================
def biblioteka():
    W, H = 17, 12
    mp = Interior(BIB, W, H, NAMES[BIB], "dwor_biblioteka", note=NOTE_ROOM)
    mp.shell([("Biblioteka", [(1, 4, 15, 10)], F_PARQ, W_PANEL)], border=B_WOOD, exit_x=8)
    mp.shadows()
    g = "Biblioteka"
    # ---- the back wall: walls of books (A5 bookcase faces) on rows 2..3, the fireplace in the middle, a window each side
    for x in (1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15):
        mp.tiles("A5", x % 6, 14, 1, 2, x, 2, z=0)
    fireplace_pic(mp, 8, 4, kind=2, group=g)
    mp.tprop("kruk_choragiew", 8, 1, group=g, name="Stara czarna chorągiew z krukiem")
    PP.window(mp, 4, 1, kind="gothic", curtain=0, group=g, length=120)
    PP.window(mp, 12, 1, kind="gothic", curtain=0, group=g, length=120)
    sconce(mp, 6, 1, group=g); sconce(mp, 10, 1, group=g)
    # ---- the stacks: free-standing shelves (C 0..4, 6..7) left and right
    mp.piece("C", 0, 6, 4, 2, 1, 6, group=g, kind="regały")
    mp.piece("C", 0, 6, 4, 2, 12, 6, group=g, kind="regały")
    mp.tprop("drabina", 5, 6, group=g)
    # ---- the chronicle on its lectern before the fireplace (the Lord's place beside it during his tour)
    mp.piece("C", 4, 0, 1, 2, 8, 6, group=g, kind="pulpit", solid_rows=[0, 1])
    mp.ev(8, 6, "!W7_Dwor", 0, 8, 1, name="Kronika rodu (księga)", priority=0, through=True)
    dwor_ev(mp, 8, 7, "kronika", "Kronika rodu Zaleskich", priority=1)
    marker(mp, "lord_kronika", 7, 7, 6)
    # ---- reading: a table with a candle and open books, two armchairs; a globe; a red-gold rug
    RM.rug_k(mp, 4, 8, 12, 9, RUG_RED_GOLD)
    table_h(mp, 11, 8, 3, style=6, group=g + " stół")
    on_table(mp, 11, 8, "D", 6, 10)
    on_table(mp, 13, 8, "D", 7, 10)
    mp.prop("swieca", 12, 9, group=g, note=L_CANDLE_DESK)
    chair(mp, 12, 10, 8, group=g)
    chair(mp, 4, 9, 6, arm=True, group=g)
    chair(mp, 5, 10, 8, arm=True, group=g)
    round_table(mp, 2, 9, group=g)
    on_table(mp, 2, 9, "D", 5, 12)            # the globe
    look(mp, 2, 10, "Globus", "Globus z kontynentem i maleńką Kruczą Wyspą. Ktoś dorysował na niej atramentem kruka.")
    candelabra(mp, 15, 9, group=g)
    candelabra(mp, 1, 5, group=g)
    look(mp, 3, 7, "Regały", "Herbarze, kroniki wojen, rachunki dziadka. Kurz grubości palca - jaśnie pan tu nie czyta.")
    look(mp, 13, 7, "Regały", "Księgi o koniach, o sokołach, o dworskich ucztach. Na półce z bajkami - wolne miejsce, jakby ktoś coś zabrał.")
    # ---- the way out: back to the hall, before the library's door
    mp.ev(8, H - 1, "", 0, 2, 0, name="Wyjście -> Hol", priority=0, through=False, trigger=1, note="<Dwor:wyjscie>",
          cmds=[se("Door1"), go(HOL, *HOL_FROM_BIB)])
    mp.exits.append({"x": 8, "y": H - 1, "to": HOL, "at": list(HOL_FROM_BIB)})
    mp.spot("landing", *BIB_LAND)
    RM.doormat(mp, 8, 10)
    return mp


# ======================================================================================================================
def gabinet():
    W, H = 15, 11
    mp = Interior(GAB, W, H, NAMES[GAB], "dwor_gabinet", note=NOTE_ROOM)
    mp.shell([("Gabinet", [(1, 4, 13, 9)], F_DARK, W_PAPER)], border=B_WOOD, exit_x=7)
    mp.shadows()
    g = "Gabinet"
    # ---- the back wall: Feliks's writing desk (left), the window, the son's portrait over the Lord's desk, the fireplace, the map
    mp.piece("C", 3, 2, 1, 2, 2, 4, group=g, kind="kantorek Feliksa")
    dwor_ev(mp, 2, 5, "szuflada", "Kantorek Feliksa (szuflada)", priority=1)
    marker(mp, "listy", 2, 4, 2)                        # (the bundle of letters shows on the desk's top once the drawer is open)
    mp.prop("klucze", 3, 2, group=g, name="Tablica z kluczami")
    PP.window(mp, 5, 1, kind="gothic", curtain=0, group=g, length=110)
    painting(mp, 7, 2, 7, 8, 1, group=g)
    look(mp, 7, 3, "Portret", "Młody mężczyzna w mundurze, z szablą. Podpis na ramie: „Kazimierz Zaleski”. W rogu czarna wstążka.")
    mp.tprop("mapa_wyspy", 9, 2, group=g, name="Mapa Kruczej Wyspy")
    dwor_ev(mp, 9, 3, "mapa", "Mapa Kruczej Wyspy", priority=1)
    fireplace_pic(mp, 11, 4, kind=2, group=g)
    banner(mp, 13, 2, 0, group=g)
    sconce(mp, 1, 2, group=g)
    # ---- the Lord's desk: accounts he signs without reading, a candle, his armchair
    RM.rug_k(mp, 5, 5, 9, 8, RUG_PURPLE)
    table_h(mp, 6, 6, 3, style=6, group=g + " biurko")
    on_table(mp, 6, 6, "D", 7, 13)
    mp.prop("ksiega_rachunkowa", 8, 7, group=g)   # (a table thing: its event on the table's lower row, the book on the top)
    mp.prop("swieca", 7, 7, group=g, note=L_CANDLE_DESK)
    chair(mp, 7, 5, 2, arm=True, group=g)
    dwor_ev(mp, 6, 7, "biurko", "Biurko jaśnie pana", priority=1)
    # the strongbox, a bookcase, a candelabra
    mp.prop("szkatula", 12, 6, group=g)
    look(mp, 12, 6, "Szkatuła jaśnie pana", "Okuta szkatuła, zamknięta na dwa zamki. Nie po to tu przyszedłeś.")
    RM.bookcase(mp, 13, 5, w=1)
    candelabra(mp, 1, 9, group=g)
    # ---- the trapdoor in the floor: the Order's old canal under the manor (Feliks's way to the hatch behind the orangery)
    dwor_ev(mp, 12, 8, "klapa", "Klapa w podłodze", "!Fantasy_door2", 7, 2, 0, priority=1)
    mp.solid.add((12, 8))
    mp.spot("klapa_land", *GAB_TRAP_LAND)
    marker(mp, "feliks_klapa", 12, 9, 8)               # (Feliks comes up here when he catches the hero)
    # ---- the door to the hall (the bottom border): Dwor.js (shut at night)
    dwor_ev(mp, 7, H - 1, "gabinetWyjscie", "Drzwi do holu", priority=0, trigger=1)
    mp.exits.append({"x": 7, "y": H - 1, "to": HOL, "at": list(HOL_FROM_GAB)})
    mp.spot("landing", *GAB_LAND)
    return mp


def map_infos():
    src = json.loads(open(W7_ROOT + "data/MapInfos.json", "rb").read().decode("utf-8"))
    out = copy.deepcopy(src)
    for mid in (HOL, BIB, GAB):
        if mid < len(out) and out[mid] and out[mid].get("name") not in (NAMES[mid],):
            raise SystemExit("MapInfos: numer %d jest już zajęty (%s) - przerwano" % (mid, out[mid].get("name")))
    while len(out) <= GAB: out.append(None)
    order = max(e["order"] for e in out if e and e["id"] not in (HOL, BIB, GAB)) + 1
    for i, (mid, parent) in enumerate(((HOL, MANOR), (BIB, HOL), (GAB, HOL))):
        out[mid] = {"id": mid, "expanded": False, "name": NAMES[mid], "order": order + i, "parentId": parent, "scrollX": 1104, "scrollY": 708}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--render")
    a = ap.parse_args()
    os.makedirs(W7_DATA, exist_ok=True)
    built = []
    for mp in (hol(), biblioteka(), gabinet()):
        mp.props.update({"autoplayBgm": False, "autoplayBgs": False})
        path = os.path.join(W7_DATA, "Map%03d.json" % mp.id)
        n = mp.write(path, os.path.join(W7_STAGING, "Map%03d_meta.json" % mp.id))
        built.append(path)
        print("Map%03d %s: %dx%d, %d zdarzeń%s" % (mp.id, mp.display, mp.W, mp.H, n, ("  (" + "; ".join(mp.notes) + ")") if mp.notes else ""))
    infos = map_infos()
    text = "[\n" + ",\n".join(json.dumps(e, ensure_ascii=False, separators=(",", ":")) for e in infos) + "\n]"
    open(os.path.join(W7_DATA, "MapInfos.json"), "wb").write(text.encode("utf-8"))
    if a.render:
        sys.path.insert(0, W7_ROOT + "tools/town")
        import mzrender as R, irender as I
        os.makedirs(a.render, exist_ok=True)
        for path in built:
            img = I.grid(I.render(R.load_json(path)))
            out = os.path.join(a.render, os.path.basename(path).replace(".json", ".png"))
            img.save(out)
            print("obraz:", out)


if __name__ == "__main__":
    main()
