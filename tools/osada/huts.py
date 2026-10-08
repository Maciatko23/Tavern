# The four hut interiors of Osada Milczących (children of Map120), on tileset 8 like the town's and Podgrodzie's
# interiors (tools/interiors/ilib.py: grandpa's cottage shell - 3-row wall faces, the dark rim border, windows with a
# sunbeam by day, a hearth with its glow, things against the walls, the middle free). The Silent are people who once
# "knew too much" (docs/STORY.md "Osada Milczących") - they do not speak; their homes tell what they cannot:
#   121 Wspólna izba        the shared hearth and stores: one long table with a bowl for each, seed sacks marked with
#                           cut signs instead of words, an empty water barrel (the drought), the gardener's pallet
#   122 Chata tkaczki       the loom with white linen - the strips the Silent tie over their mouths are woven here; a rack
#                           of them drying (one place empty), a woven raven in a circle, the spinning wheel
#   123 Chata Najstarszego  the keeper's hut (the log cabin): what is left of the order's watch - the black raven banner,
#                           the raven relief, the order's sword, the iron-bound chest with a dark-blue habit, the watch's
#                           roll on a lectern (a journal note), a bowl of white pebbles, chalk tallies of years
#   124 Chata rzeźbiarza    the former soldier's: a carver's bench with a half-carved raven, planks cut over and over with
#                           NIE PYTAJ (a journal note), little wooden ravens, a shield of a continental army painted white
# Every light is a flame (hearths, fire pits, candles; window shafts only by day). The resident of each hut is there at
# the hours he/she is not outside (tools/osada/osada_data.py RESIDENTS, the parallel event "Milczący: pora dnia").
# The doorway in the bottom border -> Map120 in front of the hut's door (facing down); the door lands on the cell above it.
# Never writes data/ (build.py --install does).
import os, sys, json, copy
OHERE = os.path.dirname(os.path.abspath(__file__))       # (the star import below brings the tavern's HERE / ROOT)
OROOT = os.path.abspath(os.path.join(OHERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, OROOT + "tools/interiors")
from ilib import *     # noqa: F401,F403  (Interior, the cottage / tavern macros, B C D E A5, blank_page)
sys.path.insert(0, OHERE)
import osada_data as OD      # noqa: E402

STAGING_O = os.path.join(OHERE, "staging")
B_WOOD, B_STONE, B_LOG = 24, 16, 33
W_PLANKS, W_STONE_BEAM, W_PLASTER_BEAM, W_GREY_BEAM, W_LOGS, W_WHITE, W_RAW = 48, 50, 51, 58, 59, 64, 71
F_DARK, F_PLANKS, F_COBBLE, F_FLAGS = 83, 84, 96, 97
RUG_MAT, RUG_BROWN = 37, 21
# dim mountain huts (like Podgrodzie's poor homes) + HomeAmbience: sparks over the hearth, the sky in the night windows,
# the fire's crackle, rain on the roof
NOTE_HUT = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:85>\n<DarkNight:185>\n<HomeAmbience>"
HEARTH_FIRE = "<Light:300,120,60,16><LightFlicker:0.12,255,120,40>"
PIT_FIRE = "<Light:200,120,52,14><LightFlicker:0.16,255,110,40>"
OIDX = json.load(open(os.path.join(OHERE, "props_index.json"), encoding="utf-8"))


class Hut(Interior):
    """a hut of the Silent: the exit goes to Map120, its things say something when looked at"""

    def __init__(self, mid, W, H):
        key, display, door_name, door_xy, front = OD.HUTS[mid]
        Interior.__init__(self, mid, W, H, display, key, note=NOTE_HUT)
        self.door_name, self.front = door_name, front
        self.looks = []

    def exit_here(self, x):
        tx, ty = self.front
        cmds = [{"code": 250, "indent": 0, "parameters": [dict(DOOR_SE)]},
                {"code": 201, "indent": 0, "parameters": [0, OD.MAP_OSADA, tx, ty, 2, 0]}]
        e = {"name": "Drzwi -> Osada Milczących", "note": "", "pages": [blank_page(priority=0, trigger=1, cmds=cmds)]}
        self.add(x, self.H - 1, e)
        self.exits.append({"x": x, "y": self.H - 1, "door": self.door_name, "town": [tx, ty], "landing": [x, self.H - 2, 8],
                           "name": e["name"]})
        self.hooks.append(("exit", x, self.H - 1))
        self.spots["landing"] = [x, self.H - 2, 8]
        assert (x, self.H - 2) == OD.LANDINGS[self.id], (self.id, x, self.H - 2)
        return e

    def silent(self, key, x, y, d):
        """the resident: page 1 nobody (below, through), page 2 (self switch A = at home) the figure, same as characters,
        the action button shows what he/she does (popups); plus the marker 'Miejsce: osada_<key>_wnetrze'"""
        sheet, _, name, home, _, lines = OD.RESIDENTS[key]
        assert home == self.id
        gone = blank_page(priority=0, through=True)
        here = blank_page(priority=1, trigger=0, cmds=OD.popups(lines),
                          image={"characterName": sheet, "characterIndex": 0, "direction": d, "pattern": 1}, direction_fix=True)
        here["conditions"].update({"selfSwitchValid": True, "selfSwitchCh": "A"})
        self.add(x, y, {"name": name, "note": "<BustName:%s>" % name, "pages": [gone, here]})
        self.residents.append({"key": key, "x": x, "y": y, "dir": d})
        self.spots["res_" + key] = [x, y, d]
        m = {"name": "Miejsce: osada_%s_wnetrze" % key, "note": "", "pages": [blank_page(priority=0, through=True, image={"direction": d})]}
        self.add(x, y, m)

    def oprop(self, key, x, y, group=None, note="", name=None, priority=None, cmds=None):
        """one of the Silent's own props (tools/osada/props_index.json, !Osada_Props) as an event"""
        p = OIDX[key]
        floor = p["place"] == "floor"
        prio = priority if priority is not None else (1 if floor else 0)
        occ = p.get("occupy")
        e = self.ev(x, y, p["sheet"], p["index"], p["direction"], p["pattern"], name=name or p["name"], priority=prio,
                    through=prio != 1, note=("<Occupy:%s>" % occ if occ else "") + note)
        cells = {(x, y)}
        if occ:
            kv = dict(t.split("=") for t in occ.split(","))
            cells |= {(x + dx, y) for dx in range(-int(kv.get("left", 0)), int(kv.get("right", 0)) + 1)}
        if floor and prio == 1:
            self.solid |= cells; self.blocked |= cells
        cat = {"floor": "floorprop", "wall": "wallitem", "table": "tableitem"}[p["place"]]
        self.rec(key, cat, cells, group, x=x, y=y, event=True, art=p.get("art"), fw=p["w"], fh=p["h"])
        if cat == "wallitem": self.wall_items.append((group, key, x, y))
        return e

    def look(self, x, y, lines, name="Przyjrzyj się"):
        """an invisible thing to look at on a closed cell (furniture, the wall's lowest row): the action button -> popups"""
        e = {"name": name, "note": "", "pages": [blank_page(priority=1, trigger=0, cmds=OD.popups(lines))]}
        self.add(x, y, e)
        self.looks.append((x, y, name))
        return e

    def look_note(self, x, y, lines, title, text, again, name="Przyjrzyj się"):
        """the first look adds a journal note (self switch B), later ones only the short popup `again`"""
        first = blank_page(priority=1, trigger=0, cmds=OD.note_once(title, text, lines))
        later = blank_page(priority=1, trigger=0, cmds=OD.popups(again))
        later["conditions"].update({"selfSwitchValid": True, "selfSwitchCh": "B"})
        self.add(x, y, {"name": name, "note": "", "pages": [first, later]})
        self.looks.append((x, y, name))

    def hours(self):
        """the parallel event that puts the resident in (or out) by the hour"""
        e = OD.schedule_event(blank_page)
        e["pages"][0]["list"] = OD.schedule_list(self.id) + [{"code": 0, "indent": 0, "parameters": []}]
        self.add(0, 0, e)

    def meta(self):
        m = Interior.meta(self)
        m["looks"] = self.looks
        return m

    def stage(self):
        os.makedirs(STAGING_O, exist_ok=True)
        path = os.path.join(STAGING_O, "Map%03d.json" % self.id)
        n = self.write(path, os.path.join(STAGING_O, "Map%03d_meta.json" % self.id))
        return path, n


def wall_piece(mp, sheet, c, r, w, h, x, y, group, kind):
    """a thing hung on a wall face (no floor cell taken)"""
    mp.piece(sheet, c, r, w, h, x, y, group=group, kind=kind, solid_rows=[], cat="wallitem")
    mp.wall_items.append((group, kind, x, y))


def hearth(mp, x, y, group, wood=True):
    """the hearth with a cauldron (!$Fireplace, HomeAmbience's sparks and steam) and its flickering glow"""
    mp.ev(x, y, "!$Fireplace", 0, 4, 0, name="Palenisko z kotłem", priority=1, through=False, step=True, note=HEARTH_FIRE)
    mp.rec("hearth", "floorprop", {(x, y)}, group, x=x, y=y)
    if wood:
        firewood(mp, x - 1, y, group=group + " drewno"); firewood(mp, x + 1, y, group=group + " drewno")


def cobweb(mp, x, y, right=False):
    mp.piece("D", 15 if right else 13, 7, 1, 1, x, y, z=3, kind="pajęczyna", solid_rows=[])


# ================================================================================================ 121 Wspólna izba
def wspolna():
    W, H = 15, 11
    mp = Hut(121, W, H)
    DOOR_X = 7
    mp.shell([("Izba", [(1, 4, 13, 9)], F_DARK, W_STONE_BEAM)], border=B_WOOD, exit_x=DOOR_X)
    mp.kind(0, mp.rect(5, 4, 9, 5), F_COBBLE)                     # flagstones before the hearth
    mp.restyle_face(mp.rect(6, 1, 8, 3), W_RAW)                   # the stone chimney breast
    mp.shadows()
    g = "Izba"
    hearth(mp, 7, 4, g)
    window(mp, 4, 1, curtain=7, group=g + " okna", length=110)
    window(mp, 10, 1, curtain=7, group=g + " okna", length=110)
    hang(mp, 2, 2, "herbs", group=g + " zioła"); hang(mp, 12, 2, "garlic", group=g + " zioła")
    mp.tprop("kreda_kreski", 9, 2, group=g + " kreski")
    # the stores (left): food shelves against the wall, the empty water barrel, seed sacks
    mp.piece("C", 4, 6, 1, 2, 1, 3, group=g + " półki", kind="półka z chlebem")
    mp.piece("C", 7, 6, 1, 2, 2, 3, group=g + " półki", kind="półka z dzbanami")
    mp.piece("D", 14, 0, 1, 2, 3, 3, group=g, kind="pusta beczka na wodę")
    mp.piece("D", 8, 2, 2, 2, 1, 8, group=g + " worki", kind="worki z ziarnem", solid_rows=[1])
    mp.piece("D", 3, 10, 1, 1, 3, 9, group=g, kind="kosz z korzeniami")
    # the shared table: benches along the hearth side, a stool at each end; a bowl for each
    rug(mp, 3, 6, 11, 9, RUG_BROWN)
    table_h(mp, 5, 7, 5, style=6, group=g + " stół")
    bench_h(mp, 5, 6, group=g + " ławy"); bench_h(mp, 8, 6, group=g + " ławy")
    stool(mp, 4, 7, group=g + " stołki"); stool(mp, 10, 7, group=g + " stołki")
    for x in (5, 6, 8, 9): on_table(mp, x, 7, "D", 0, 11)
    candles_table(mp, 7, 8, group=g + " stół")
    # the gardener's corner (right): the seed cupboard, her pallet, a basket and a broom
    mp.piece("C", 7, 9, 1, 2, 11, 3, group=g, kind="szafka z nasionami")
    bed(mp, (9, 13), 13, 4, group=g, kind="siennik")
    mp.piece("D", 9, 4, 1, 1, 12, 9, group=g, kind="worek z nasionami")
    mp.piece("D", 7, 6, 1, 2, 13, 8, group=g, kind="miotła")
    cobweb(mp, 1, 1)
    # what the things say
    mp.look(7, 7, ["Wspólny stół. Miski ustawione równo - po jednej na każdego.",
                   "Jedna stoi dnem do góry. Nikt jej nie odwraca."], "Wspólny stół")
    mp.look(7, 4, ["W kotle polewka z korzeni, rzadka, ale ciepła.",
                   "Nikt tu nie woła na posiłek. Wszyscy po prostu przychodzą."], "Kocioł")
    mp.look(3, 4, "Beczka na wodę. Pusta - na dnie zaschnięty muł.", "Pusta beczka")
    mp.look(1, 9, ["Worki z ziarnem. Zamiast napisów znaki wycięte nożem:", "kłos, korzeń, liść."], "Worki z ziarnem")
    mp.look(11, 4, ["Szafka pełna woreczków z nasionami, każdy z innym znakiem.",
                    "Ktoś je przebiera ziarnko po ziarnku. Czekają na deszcz."], "Szafka z nasionami")
    mp.look(9, 3, "Kreski kredą: ile porcji zostało. Liczą tu palcami, nie głosem.", "Kreski kredą")
    mp.silent("ogrodniczka", 11, 5, 8)
    mp.hours()
    mp.exit_here(DOOR_X)
    return mp


# ================================================================================================ 122 Chata tkaczki
def tkaczka():
    W, H = 13, 10
    mp = Hut(122, W, H)
    DOOR_X = 6
    mp.shell([("Izba", [(1, 4, 11, 8)], F_PLANKS, W_WHITE)], border=B_WOOD, exit_x=DOOR_X)
    mp.restyle_face(mp.rect(8, 1, 10, 3), W_RAW)
    mp.shadows()
    g = "Izba"
    hearth(mp, 9, 4, g)
    window(mp, 4, 1, curtain=1, group=g + " okna", length=100)
    mp.oprop("tkanina_kruk", 6, 2, group=g + " tkanina")
    # the loom in the left corner (the weaver before it), the spinning wheel, baskets of flax and rolls of linen
    mp.oprop("krosno", 1, 4, group=g)
    mp.hprop("kolowrotek", 3, 4, group=g)
    mp.piece("D", 3, 10, 1, 1, 1, 6, group=g, kind="kosz z lnem")
    mp.piece("D", 2, 10, 1, 1, 1, 7, group=g, kind="zwój płótna")
    # the strips drying, the chest of linen, her pallet
    mp.oprop("stojak_pasy", 8, 7, group=g)
    plain_chest(mp, 11, 7, group=g, name="Skrzynia z płótnem")
    bed(mp, (9, 13), 11, 4, group=g, kind="siennik")
    stool_candle(mp, 4, 8, group=g)
    rug(mp, 5, 5, 7, 6, RUG_MAT)
    cobweb(mp, 11, 1, right=True)
    mp.look(1, 4, ["Krosno. Na nim biały len, tkany ciasno i równo.",
                   "Z takiego płótna są pasy, które Milczący wiążą sobie na ustach."], "Krosno")
    mp.look(8, 7, ["Białe pasy płótna, każdy tej samej długości.",
                   "Jedno miejsce na drążku puste. Ktoś już swój zabrał - albo dopiero zabierze."], "Stojak z pasami")
    mp.look(6, 3, ["Tkanina: krąg, a w nim czarny kruk.",
                   "Ten sam znak co na kamieniach twierdzy - tylko utkany, nitka po nitce."], "Tkanina z krukiem")
    mp.look(3, 4, "Kołowrotek z lnem. Koło nie skrzypi - nawet ono tu milczy.", "Kołowrotek")
    mp.look(11, 7, "Skrzynia pełna zwojów białego płótna. Dość na wiele lat milczenia.", "Skrzynia z płótnem")
    mp.silent("tkaczka", 2, 5, 8)
    mp.hours()
    mp.exit_here(DOOR_X)
    return mp


# ================================================================================================ 123 Chata Najstarszego
ROLL_TEXT = ("W chacie Najstarszego z Milczących leży stara księga: „Rejestr straży przy kamieniu”. Imiona strażników, "
             "przy każdym dzień objęcia warty - pismo równe, zakonne. Pod koniec przy imionach nie ma już dat, tylko białe "
             "kamyki przyklejone woskiem. Ostatnia strona ma jedno zdanie: „Kto dotknął skały, niech milczy, póki prawda "
             "w nim nie ostygnie.”\nNajstarszy nosi ciemnoniebieską szatę - taką jak ta w okutej skrzyni, z krukiem w kręgu. "
             "Czy Milczący to resztka straży zakonu?")


def starszy():
    W, H = 15, 11
    mp = Hut(123, W, H)
    DOOR_X = 7
    mp.shell([("Izba", [(1, 4, 13, 9)], F_DARK, W_LOGS)], border=B_LOG, exit_x=DOOR_X)
    mp.kind(0, mp.rect(6, 4, 8, 5), F_COBBLE)
    mp.restyle_face(mp.rect(6, 1, 8, 3), W_RAW)
    mp.shadows()
    g = "Izba"
    mp.ev(7, 4, "!$Fireplace2", 0, 4, 0, name="Kominek", priority=1, through=False, step=True, note=HEARTH_FIRE)
    mp.rec("fireplace", "floorprop", {(7, 4)}, g)
    firewood(mp, 6, 4, group=g + " drewno"); firewood(mp, 8, 4, group=g + " drewno")
    # the order's things on the back wall: the black raven banner and the raven relief either side of the chimney,
    # the order's sword; windows at the ends
    window(mp, 2, 1, curtain=None, group=g + " okna", length=110)
    window(mp, 12, 1, curtain=None, group=g + " okna", length=110)
    mp.tprop("kruk_choragiew", 4, 2, group=g + " znaki")
    mp.tprop("kruk_plaskorzezba", 10, 2, group=g + " znaki")
    wall_piece(mp, "D", 4, 0, 1, 2, 5, 1, g + " miecz", "miecz zakonu")
    mp.tprop("kreda_kreski", 9, 2, group=g + " kreski")
    # the elder's corner (left): his pallet, the iron-bound chest of the order
    bed(mp, (9, 13), 1, 4, group=g, kind="siennik")
    mp.ev(3, 4, "!Fantasy_chest", 0, 2, 0, name="Okuta skrzynia zakonu", priority=1, through=False)
    mp.rec("skrzynia zakonu", "floorprop", {(3, 4)}, g, x=3, y=4)
    # the lectern with the watch's roll (right), a candelabra by it; the table with the bowl of white pebbles
    mp.ev(11, 5, "!Decoration_static", 6, 2, 2, name="Pulpit z księgą", priority=1, through=False)
    mp.rec("pulpit", "floorprop", {(11, 5)}, g, x=11, y=5)
    candelabra(mp, 12, 6, group=g)
    mp.piece("C", 0, 0, 1, 2, 13, 3, group=g, kind="regał z księgami zakonu")
    table_sq(mp, 4, 7, style=6, group=g + " stół")
    chair(mp, 6, 8, 4, group=g + " stół")
    mp.oprop("miska_kamykow", 4, 8, group=g + " stół")
    candles_table(mp, 5, 8, group=g + " stół")
    rug(mp, 8, 7, 11, 8, RUG_BROWN)
    mp.piece("D", 12, 3, 1, 2, 13, 8, group=g, kind="skrzynia")
    cobweb(mp, 13, 1, right=True)
    mp.look_note(11, 5, ["Rejestr straży. Imiona strażników, przy każdym data warty.",
                         "Przy ostatnich imionach zamiast dat - białe kamyki w wosku."],
                 "Rejestr straży", ROLL_TEXT, "Rejestr straży. Ostatnie imiona mają zamiast dat białe kamyki.", "Rejestr straży")
    mp.look(3, 4, ["Okuta skrzynia. W środku złożona ciemnoniebieska szata",
                   "z wyhaftowanym krukiem w kręgu. Pod nią zapasowy pas białego płótna."], "Okuta skrzynia")
    mp.look(4, 3, ["Czarna chorągiew z białym krukiem.", "Wyblakła i zacerowana w kilku miejscach - ktoś o nią dbał."], "Chorągiew")
    mp.look(10, 3, ["Kruk w kamieniu, w kręgu. Pod nim wydrapane: STRAŻ.",
                    "Obok było drugie słowo. Ktoś je starł - dłonią, bardzo dawno."], "Płaskorzeźba z krukiem")
    mp.look(13, 4, ["Księgi zakonu: rachunki kamieniołomu, spisy wart, zielnik.",
                    "Z jednej wyrwano wszystkie kartki - zostały same grzbiety."], "Regał z księgami")
    mp.look(5, 3, "Miecz zakonu. Ostrze naoliwione, choć nikt go już nie dobywa.", "Miecz zakonu")
    mp.look(9, 3, "Kreski kredą na belce, w rzędach po siedem. Całe lata dni.", "Kreski kredą")
    mp.look(4, 8, ["Miska białych kamyków - takich jak na płaskim kamieniu w kręgu.",
                   "Po jednym na każdego, kto zamilkł. Jest ich więcej, niż ludzi w Osadzie."], "Miska kamyków")
    mp.silent("starszy", 10, 5, 6)
    mp.hours()
    mp.exit_here(DOOR_X)
    return mp


# ================================================================================================ 124 Chata rzeźbiarza
PLANKS_TEXT = ("Rzeźbiarz z Osady Milczących - dawny żołnierz z kontynentu, jego tarcza wisi zamalowana na biało - wycina "
               "na deskach te same znaki: krąg z krukiem, rzędy kresek i dwa słowa powtarzane setki razy: NIE PYTAJ. "
               "Najstarsze litery są głębokie i równe, najnowsze płytkie, jakby ręka traciła siłę.\n"
               "Borgar mówi gościom w tawernie coś bardzo podobnego. Dla żartu.")


def rzezbiarz():
    W, H = 13, 10
    mp = Hut(124, W, H)
    DOOR_X = 6
    mp.shell([("Izba", [(1, 4, 11, 8)], F_PLANKS, W_RAW)], border=B_STONE, exit_x=DOOR_X)
    mp.shadows()
    g = "Izba"
    # the carved planks against the stone corner, the bench before them, the shelf of little ravens
    mp.oprop("deski_znaki", 1, 4, group=g)
    mp.oprop("deski_znaki", 2, 4, group=g)
    mp.oprop("warsztat_rzezbiarza", 3, 6, group=g)
    mp.oprop("polka_kruki", 5, 2, group=g + " półka")
    stool_candle(mp, 5, 6, group=g)
    window(mp, 7, 1, curtain=7, group=g + " okna", length=100)
    # his soldier's past on the wall: the shield painted white, the sword wrapped and hung up high
    wall_piece(mp, "D", 3, 1, 1, 1, 9, 2, g + " tarcza", "tarcza")
    wall_piece(mp, "D", 5, 0, 1, 2, 10, 1, g + " miecz", "miecz")
    bed(mp, (9, 13), 11, 4, group=g, kind="siennik")
    # the fire pit with a pot, blocks of the order's quarry, firewood and offcuts
    mp.ev(7, 6, "!Decoration", 2, 6, 0, name="Palenisko", priority=1, through=False, step=True, note=PIT_FIRE)
    mp.rec("cauldron", "floorprop", {(7, 6)}, g, x=7, y=6)
    if have_char("!$Mt_Blocks"):      # (a 2-cell picture: the event on its left cell)
        mp.ev(9, 8, "!$Mt_Blocks", 0, 2, 0, name="Ciosany kamień z krukiem", priority=1, through=False, note="<Occupy:right=1>")
        mp.rec("blok", "floorprop", {(9, 8), (10, 8)}, g, x=9, y=8)
        mp.solid |= {(10, 8)}; mp.blocked |= {(10, 8)}
    else:
        mp.ev(10, 8, "!Mt_Props", 0, 2, 1, name="Ciosany kamień z krukiem", priority=1, through=False)
        mp.rec("blok", "floorprop", {(10, 8)}, g, x=10, y=8)
    firewood(mp, 11, 8, group=g + " drewno")
    mp.piece("D", 10, 5, 1, 1, 1, 8, group=g, kind="odcięte deski")
    stool(mp, 8, 7, small=True, group=g)
    cobweb(mp, 11, 1, right=True)
    mp.look_note(1, 4, ["Deski pocięte znakami: krąg z krukiem, kreski... i dwa słowa,",
                        "wycięte setki razy, coraz płycej: NIE PYTAJ."],
                 "Deski rzeźbiarza", PLANKS_TEXT, "Deski pocięte w kółko tymi samymi słowami: NIE PYTAJ.", "Deski ze znakami")
    mp.look(2, 4, "Na tej desce same kreski. Pięć, pięć, pięć... Ktoś liczy, ile razy nie zapytał.", "Deski ze znakami")
    mp.look(3, 6, ["Na warsztacie niedokończony kruk z drewna.", "Dłuta ułożone równo, od najmniejszego do największego."],
            "Warsztat")
    mp.look(5, 3, "Drewniane kruki, każdy trochę inny. Jeden ma dziób owinięty nitką.", "Półka z krukami")
    mp.look(9, 3, ["Tarcza żołnierza z kontynentu. Herb zamalowany na biało.",
                   "Ktoś przypłynął tu na wojnę o Serce - i został z dłutem."], "Tarcza")
    mp.look(10, 3, "Miecz owinięty płótnem i powieszony wysoko, żeby nie kusił.", "Miecz")
    mp.look(10, 8, "Kamień z kamieniołomu zakonu. Ten sam kruk w kręgu - ale wycięty świeżo.", "Kamień z krukiem")
    mp.silent("rzezbiarz", 3, 5, 2)
    mp.hours()
    mp.exit_here(DOOR_X)
    return mp


def have_char(sheet):
    return os.path.exists(OROOT + "img/characters/%s.png" % sheet)


BUILDERS = {121: wspolna, 122: tkaczka, 123: starszy, 124: rzezbiarz}


def stage(ids=None):
    out = {}
    for i in ids or sorted(BUILDERS):
        mp = BUILDERS[i]()
        path, n = mp.stage()
        print("Map%03d %s: %dx%d, %d zdarzeń -> %s" % (i, mp.display, mp.W, mp.H, n, os.path.relpath(path, OROOT)))
        out[i] = path
    return out


if __name__ == "__main__":
    stage([int(a) for a in sys.argv[1:] if a.isdigit()] or None)
