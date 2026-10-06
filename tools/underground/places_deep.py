# The hand-made floors of bands 2-6 (tools/underground/build.py stages and installs them; docs/PODZIEMIA.md):
#   Map145  "Podziemia: piętra 11-99 (skorupa)" - the one empty shell every generated floor 11-99 loads (as map 1000 + N)
#   Map146  floor 20 Sala jednego pytania (band 2)  - the rite's hall, the book of questions, the prior's cell; boss_20
#   Map147  floor 30 Wielka cysterna (band 2)       - the dry basin, the main sluice (W1 / W2), the rats' nest; boss_30
#   Map148  floor 40 Bród Milczącej (band 3)        - the river through a great cave, the rope bridge, the spiders; boss_40
#   Map149  floor 50 Przekop kopaczy (band 3)       - the diggers' camp, their collapsed tunnel, the spring (water!); boss_50
#   Map150  floor 60 Brama Pierwszych (band 4)      - the gate older than the order, its doorkeeper; boss_60
#   Map151  floor 70 Sala płaskorzeźb (band 4)      - seven reliefs of the first ones; boss_70
#   Map152  floor 80 Sala echa (band 5)             - whispers, visions, the scholar's last note; boss_80
#   Map153  floor 90 Ostatnia straż (band 5)        - the order's last watch, the names on the wall; boss_90
#   Map011  floor 100 Komnata Serca (band 6)        - the door of three locks (key W4, bell W2, song W3), the Heart, the choice
# Every hand-made floor 20-90 has a stop of the lift (a windlass and a cage: Underground.windlass / cage), its stairs up and down
# (Underground.stairs - the stairs down wait for the boss while a creature maker for it is registered) and the order's notes
# (Underground_Data NOTES "20a"...). Where one arrives is in Underground_Data.js FLOORS (build.py checks the numbers).
# Nothing here writes data/.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from uglib import *   # noqa: F401,F403
from places import UG_NOTE, TORCH, TORCH_OUT, TORCH_LIGHT, BRAZIER, BRAZIER_LIGHT, torch, brazier, note_event, say_lines   # noqa: F401
from chunks_deep import (W_BEIGE, W_BLOCKS, W_GREYBRICK, W_NICHES, W_GOTHIC, W_GOTHIC2, W_SPIKES, W_PALE, W_ICE, W_CAVE,   # noqa: F401
                         W_CAVE_MOSS, W_CAVE_BEAMS, W_CAVE_BROWN, W_CAVE_ROOTS, F_ORNATE, F_BLUEGREY, F_GREENTILE, F_ICE,
                         FILM_MIST, FILM_HOLE, WATER, CANDLE, CANDELABRUM, CANDLE_BLUE, CANDELABRUM_BLUE, CANDLE_LIGHT,
                         CANDELABRUM_LIGHT, BLUE_LIGHT, LANTERN, LANTERN_LIGHT, RELIEFS)

SHELL = 145
FLOOR_MAPS = {20: 146, 30: 147, 40: 148, 50: 149, 60: 150, 70: 151, 80: 152, 90: 153, 100: 11}
UNLIT_BOWL = ("!Decoration", 0, 4, 0)
HEART_LIGHT = "<Light:165,255,236,200><LightFlicker:0.05,255,220,165><LightHeight:64>"


class HM(DMap):
    """a hand-made floor: rooms cut out of the rock, its stairs, its lift stop, its boss, its notes"""

    def __init__(self, floor, W, H, name, dark, level, tileset=TILESET, bgs=None):
        DMap.__init__(self, FLOOR_MAPS[floor], W, H, "Podziemia - piętro %d (%s)" % (floor, name),
                      UG_NOTE % (dark, dark) + "\n<Poziom:%d>" % level, tileset=tileset)
        self.fl = floor
        self.water = set()
        if bgs:
            self.props["bgs"] = {"name": bgs[0], "pan": 0, "pitch": bgs[2], "volume": bgs[1]}
            self.props["autoplayBgs"] = True

    # ---- the ground
    def cut(self, *rects):
        out = set()
        for r in rects: out |= self.rect(*r)
        return out

    def paint_faces(self, region, wall):
        """the wall faces in a region of another kind (the rock tops stay one kind: tops of two kinds would show a seam)"""
        for c in self.faces & set(region): self.layers[0][c] = ("k", wall[1])

    def paint_floor(self, cells, kind):
        for c in cells:
            if c in self.floor: self.layers[0][c] = ("k", kind)

    def pool(self, cells, kind=WATER):
        """water inside the floor (no walls round it): drawn, not walked on (the engine's flags; reach() keeps off it)"""
        for c in cells:
            self.layers[0][c] = ("k", kind)
            self.water.add(c)
            self.solid.add(c)

    def waterfall(self, x0, x1, rows, kind=9):
        for y in rows:
            for x in range(x0, x1 + 1):
                self.layers[0][(x, y)] = ("t", 2048 + kind * 48 + ((0 if x > x0 else 1) | (0 if x < x1 else 2)))

    def deck(self, cells):
        """bridge planks over water: walked on again"""
        for c in cells: self.solid.discard(c)

    def finish(self):
        self.shadows()
        for c in self.water: self.shadow.pop(c, None)

    # ---- the ways in and out
    def stairs_up(self, x, y):
        self.ev(x, y, "!Fantasy_door5", 0, 2, 0, name="Schody w górę (piętro %d)" % (self.fl - 1), priority=1, through=False, trigger=1,
                cmds=[se("Move1", 80, 95), *script('Underground.stairs("up")')])
        self.spot("up", x, y + 1, 2)

    def stairs_down(self, x, y):
        self.ev(x, y, "!Fantasy_door5", 1, 2, 0, name="Schody w dół (piętro %d)" % (self.fl + 1), priority=1, through=False, trigger=1,
                cmds=[se("Move1", 80, 85), *script('Underground.stairs("down")')])
        self.spot("down", x, y + 1, 2)

    def lift(self, cx, cy, lx, ly):
        """the lift's stop: the cage (cx, cy - one gets in from below it) and the windlass (lx, ly), chains beside the cage"""
        self.ev(cx, cy, "!Fantasy_hanging_cage", 0, 2, 0, name="Winda kasztelana", priority=1, through=False,
                cmds=script("Underground.cage(this)"))
        lever = {"characterName": "!Fantasy_switches2", "characterIndex": 0, "direction": 2, "pattern": 0}
        self.add(lx, ly, {"name": "Kołowrót windy", "note": "", "pages": [
            page(image=lever, priority=1, cmds=script("Underground.windlass(this)")),
            page(image=dict(lever, direction=6), priority=1, cond=self_cond("A"), cmds=script("Underground.windlass(this)"))]})
        self.solid.add((lx, ly))
        self.ev(cx - 1, cy - 1, "!Fantasy_switches2", 3, 2, 0, name="Łańcuch", priority=0, through=True)
        self.ev(cx + 1, cy - 1, "!Fantasy_switches2", 3, 2, 1, name="Łańcuch", priority=0, through=True)
        self.spot("lift", cx, cy + 1, 2)

    def boss(self, x, y):
        self.marker(x, y, "Stwór: boss_%d" % self.fl, "<Stwor:boss_%d>" % self.fl)
        self.spot("boss", x, y, 2)

    def spawn(self, kind, x, y):
        self.marker(x, y, "Stwór: " + kind, "<Stwor:%s>" % kind)

    def whisper(self, x, y):
        self.marker(x, y, "Szept", "<Szept>")

    def vision(self, x, y):
        self.ev(x, y, "", name="Zjawa", priority=1, through=True, note="<Zjawa>")

    def note(self, x, y, key, art, name):
        note_event(self, x, y, key, art, name)

    def chest(self, x, y, items, gold, line, name="Skrzynia straży", art=("!Dungeon_chest", 0)):
        cmds = [se("Chest1", 80, 100)] + [cmd(126, [it, 0, 0, n]) for it, n in items] + ([cmd(125, [0, 0, gold])] if gold else [])
        cmds += text([line]) + [cmd(123, ["A", 0])]
        p1 = page(image={"characterName": art[0], "characterIndex": art[1], "direction": 2, "pattern": 0}, priority=1, cmds=cmds)
        p2 = page(image={"characterName": art[0], "characterIndex": art[1], "direction": 8, "pattern": 0}, priority=1, cond=self_cond("A"),
                  cmds=text(["Pusta."]))
        self.add(x, y, {"name": name, "note": "", "pages": [p1, p2]})

    def candle(self, x, y, big=False, blue=False):
        art = (CANDELABRUM_BLUE if blue else CANDELABRUM) if big else (CANDLE_BLUE if blue else CANDLE)
        light = BLUE_LIGHT if blue else CANDELABRUM_LIGHT if big else CANDLE_LIGHT
        self.ev(x, y, *art, name="Świecznik" if big else "Świeca", priority=1 if big else 0, through=not big, step=True, note=light)

    def bluetorch(self, x, y):
        self.ev(x, y, "!Decoration2_blue", 3, 4, 0, name="Niebieski płomień", priority=0, through=True, step=True, note=BLUE_LIGHT)

    def relief(self, x, y, idx):
        self.ev(x, y, RELIEFS, idx, 2, 0, name="Płaskorzeźba", priority=0, through=True)


def shell_map():
    """the one file floors 11-99 load (map 1000 + N): empty rock with a note - Underground.js makes each floor as it loads"""
    mp = DMap(SHELL, 17, 13, "Podziemia - piętra 11-99",
              "Skorupa pięter 11-99: każde z nich wczytuje ten plik jako mapa 1000+N i składa się z kawałków swojego pasma\n"
              "(Map141-144) według ziarna zapisu. Tu nic nie rysuj - gra i tak tego nie użyje. Opis: docs/PODZIEMIA.md")
    for c in mp.all: mp.layers[0][c] = ("k", 99)
    return mp


# ======================================================================================================== floor 20
def floor20():
    """Sala jednego pytania: the antechamber; the great hall of the rite (the carved circle, the asker's chair, the brothers in stone
    with their backs to the light, the book of questions on the lectern); the prior's cell; the room of the stairs down; the lift"""
    mp = HM(20, 37, 26, "Sala jednego pytania", 222, 13, tileset=TILESET2)
    ante, link1 = mp.rect(2, 6, 9, 12), mp.rect(10, 8, 12, 10)
    nave, link2, east = mp.rect(13, 6, 27, 19), mp.rect(28, 8, 29, 10), mp.rect(30, 6, 34, 12)
    link3, liftr = mp.rect(4, 13, 5, 17), mp.rect(2, 18, 10, 23)
    link4, cell = mp.rect(28, 16, 28, 17), mp.rect(29, 15, 34, 20)
    floor = ante | link1 | nave | link2 | east | link3 | liftr | link4 | cell
    mp.shell(floor, F_GREY_TILE, W_GREY_PILLARS)
    mp.paint_faces(mp.rect(12, 0, 28, 25), W_ARCHES); mp.paint_floor(nave, F_BLUEGREY)
    mp.paint_faces(mp.rect(29, 0, 36, 13), W_GREY); mp.paint_floor(east, F_SLATE_SQ)
    mp.paint_faces(mp.rect(29, 14, 36, 25), W_BEIGE); mp.paint_floor(cell, F_ORNATE)
    mp.paint_faces(mp.rect(0, 14, 11, 25), W_GREY)
    mp.finish()
    # ---- the antechamber
    mp.stairs_up(4, 5)
    torch(mp, 7, 5); torch(mp, 2, 5, lit=False)
    mp.piece("posag_kaptur", 9, 6)
    mp.piece("kosci", 3, 11); mp.film(FILM_DUST, {(5, 9), (6, 9), (8, 11)})
    mp.spawn("szczur", 7, 11)
    # ---- the hall of the rite
    for dy in range(3):
        for dx in range(3): mp.t("A5", 3 + dx, 11 + dy, 19 + dx, 11 + dy, z=1)
    mp.piece("in_tron2", 20, 9)
    for x in (15, 25):
        for y in (7, 12, 16): mp.piece("filar", x, y)
    mp.piece("posag_kaptur", 17, 11); mp.piece("posag_kaptur2", 23, 11)
    for (x, y) in ((18, 10), (22, 10), (18, 14), (22, 14)): mp.candle(x, y, big=True)
    for x in (17, 21): mp.piece("in_lawa", x, 18)
    mp.ev(20, 15, "!$Altar", 0, 2, 0, name="Zapiski: Księga pytań", priority=1, through=False, step=True,
          cmds=script('Underground.read("20a")'), note="<Light:120,255,190,120><LightFlicker:0.06><Zapiski:20a>")
    mp.note(17, 7, "20b", "zwoj", "Reguła rytuału")
    torch(mp, 14, 5); torch(mp, 26, 5); torch(mp, 20, 5)
    mp.boss(20, 12)
    mp.spawn("zbroja", 16, 18); mp.spawn("zbroja", 26, 7)
    mp.film(FILM_DUST, {(14, 18), (15, 19), (24, 18), (27, 17), (19, 7), (21, 7)})
    # ---- the prior's cell
    mp.piece("in_lozko", 34, 15); mp.piece("in_biurko", 31, 15); mp.piece("in_szafa", 29, 15)
    mp.note(33, 19, "20c", "kartki", "Przeor do kasztelana")
    mp.chest(30, 19, [(152, 2), (59, 2), (143, 1)], 40, "Skrzynia przeora: dwa opatrunki, dwie pochodnie, sztaba stali i garść starych monet.",
             name="Skrzynia przeora")
    # ---- the room of the stairs down
    mp.stairs_down(32, 5)
    torch(mp, 34, 5); mp.piece("posag_szata", 30, 6)
    mp.film(FILM_DUST, {(31, 9), (33, 11)})
    # ---- the lift
    mp.lift(7, 18, 9, 18)
    mp.piece("skrzynie_wysokie", 2, 18); mp.piece("skrzynka_zamknieta", 3, 22)
    torch(mp, 3, 16)
    return mp


# ======================================================================================================== floor 30
def floor30():
    """Wielka cysterna: the order's great cistern, long dry - a walkway round a sunken basin (its north wall seen from the walkway),
    steps down into it, a stale puddle on its bottom and the rats' nest; the main sluice in the north wall with the raven and the
    signal of water cut into it (W1 ch. 7 / W2: Underground only shows it - the bus "undergroundSluice"); stairs, lift"""
    mp = HM(30, 38, 27, "Wielka cysterna", 224, 18, tileset=TILESET2, bgs=("River", 22, 70))
    ante, link1 = mp.rect(2, 6, 8, 12), mp.rect(9, 8, 10, 10)
    hall = mp.rect(11, 6, 30, 23)
    ring = mp.rect(14, 11, 27, 20) - mp.rect(15, 13, 26, 19)
    gap = mp.rect(20, 20, 21, 20)
    link2, ne = mp.rect(31, 8, 31, 9), mp.rect(32, 6, 36, 11)
    link3, se_ = mp.rect(31, 21, 31, 22), mp.rect(32, 19, 36, 24)
    floor = ante | link1 | (hall - ring) | gap | link2 | ne | link3 | se_
    mp.shell(floor, F_GREEN_BRICK, W_MOSSY)
    basin = mp.rect(15, 13, 26, 19)
    mp.paint_floor(basin, F_SLATE)
    mp.paint_faces(mp.rect(31, 0, 37, 26), W_GREY)
    for c in ring - mp.faces: mp.layers[0][c] = ("k", W_MOSSY[0])
    mp.finish()
    mp.film(FILM_DUST, {(20, 20), (21, 20)})
    # ---- the antechamber
    mp.stairs_up(4, 5)
    torch(mp, 7, 5)
    mp.piece("dzbany_grupa", 2, 11); mp.piece("wiadro_puste", 7, 12)
    mp.spawn("szczur", 6, 10)
    # ---- the hall and the basin
    for x in (19, 20, 21): mp.ev(x, 5, "!Fantasy_door6", 2, 2, 0, name="Zasuwa główna" + ("" if x == 20 else " (bok)"), priority=1,
                                 through=False, cmds=script('Underground.read("30b"); Tawerna.emit("undergroundSluice", { floor: 30 })'),
                                 note="<Zapiski:30b>" if x == 20 else "")
    mp.piece("okienko", 17, 4); mp.piece("okienko", 23, 4)
    mp.note(12, 6, "30a", "ksiega", "Dziennik cysterny")
    torch(mp, 13, 5); torch(mp, 28, 5)
    brazier(mp, 12, 22); brazier(mp, 29, 22)
    mp.pool(mp.rect(16, 17, 17, 18), kind=0)
    mp.film(FILM_MOSS, {(15, 15), (16, 15), (18, 18), (19, 19), (24, 14), (25, 15), (22, 18), (15, 19), (26, 19), (18, 16)})
    mp.film(FILM_RUBBLE, {(20, 14), (21, 14), (25, 18), (24, 19)})
    mp.piece("in_siennik", 23, 16); mp.piece("kosci", 22, 17); mp.piece("czaszki", 25, 17); mp.piece("szkielet", 24, 15)
    mp.piece("kosci2", 19, 17)
    mp.boss(22, 15)
    mp.note(25, 16, "30c", "kartki", "Gniazdo")
    mp.t("A5", 2, 0, 13, 9, z=1); mp.t("A5", 3, 0, 28, 9, z=1)
    mp.spawn("szczur", 17, 14); mp.spawn("szczur", 25, 13); mp.spawn("pajak", 28, 16)
    mp.film(FILM_DUST, {(12, 15), (13, 16), (29, 12), (28, 13), (16, 22), (24, 22)})
    # ---- the stairs down (north-east) and the lift (south-east)
    mp.stairs_down(34, 5); torch(mp, 36, 5)
    mp.chest(36, 10, [(152, 2), (59, 2)], 45, "Skrzynia brata od zasuwy: dwa opatrunki, dwie pochodnie i stare monety.", name="Skrzynia brata od zasuwy")
    mp.lift(34, 19, 36, 19)
    mp.piece("skrzynka_plotno", 32, 23)
    return mp


# ======================================================================================================== floor 40
def floor40():
    """Bród Milczącej: a great cave cut by the river - it falls out of the north wall and runs south; the order's rope bridge over
    it; on the west bank the scouts' camp, on the east the spiders' webs, the stairs down and the scouts' hoist (the lift)"""
    mp = HM(40, 40, 26, "Bród Milczącej", 228, 23, bgs=("River", 40, 80))
    cave = mp.rect(2, 6, 37, 22) - mp.rect(2, 19, 4, 22) - mp.rect(10, 6, 13, 7) - mp.rect(25, 20, 30, 22) - mp.rect(35, 10, 37, 14) \
        - mp.rect(2, 6, 2, 8) - mp.rect(36, 20, 37, 22)
    mp.shell(cave, F_DIRT, W_CAVE)
    mp.paint_faces(mp.rect(22, 0, 39, 25), W_CAVE_ROOTS)
    river = mp.rect(18, 6, 20, 22)
    mp.pool(river)
    mp.waterfall(18, 20, (4, 5))
    mp.paint_floor(mp.rect(2, 6, 16, 22), F_DIRT)
    mp.finish()
    mp.piece("most_poziomy", 17, 13)
    mp.deck(mp.rect(18, 14, 20, 14))
    # ---- the west bank: the stairs up, the scouts' camp
    mp.stairs_up(4, 5)
    torch(mp, 7, 5); torch(mp, 15, 5)
    brazier(mp, 9, 12)
    mp.piece("poslanie", 7, 11); mp.piece("poslanie", 11, 11)
    mp.chest(6, 15, [(152, 2), (59, 3), (93, 1)], 55, "Skrzynia zwiadowców: opatrunki, pochodnie, lina i trochę monet.", name="Skrzynia zwiadowców")
    mp.note(12, 14, "40a", "zwoj", "Zwiadowcy przy brodzie")
    mp.piece("stalagmit_br", 15, 9); mp.piece("glazy_br", 5, 18); mp.piece("stalagmit_br2", 14, 18); mp.piece("kamyki_br", 10, 20)
    for (x, y, a) in ((3, 10, "!$Rock_Ore_Iron"), (13, 21, "!$Rock_Ore_Iron_Chunk")):
        mp.ev(x, y, a, 0, 2, 0, name="Skała z rudą", priority=1, through=False)
    mp.piece("grzyb_duzy", 8, 20); mp.piece("grzybki", 11, 17)
    mp.spawn("nietoperz", 12, 9); mp.spawn("topielec", 16, 17)
    mp.film(FILM_DIRT, {(5, 9), (6, 9), (9, 15), (10, 16), (15, 12), (16, 14)})
    mp.film(FILM_MOSS, {(17, 8), (17, 19), (21, 9), (21, 18), (16, 21), (22, 21)})
    # ---- the east bank: the spiders, the stairs down, the hoist
    for (x, y) in ((24, 6), (30, 8), (27, 12)): mp.piece("pajeczyna", x, y, z=3)
    mp.piece("pajeczyna_rog", 22, 6, z=3)
    mp.piece("korzenie2", 26, 9); mp.piece("kosci", 28, 11); mp.piece("czaszki", 25, 13); mp.piece("szkielet", 30, 10)
    mp.boss(28, 10)
    mp.spawn("pajak", 24, 15); mp.spawn("pajak", 32, 13)
    mp.stairs_down(33, 5); torch(mp, 35, 5)
    mp.lift(33, 19, 35, 19)
    mp.note(31, 19, "40b", "kartki", "Winda zwiadowców")
    mp.piece("stalagmit_br3", 23, 20); mp.piece("glaz_brazowy", 31, 16)
    mp.film(FILM_DIRT, {(23, 17), (24, 17), (29, 18), (34, 16)})
    return mp


# ======================================================================================================== floor 50
def floor50():
    """Przekop kopaczy: where the diggers' cut from the mountains (W8) broke into the caves - their camp, carts, the lamp still lit,
    the tunnel east collapsed behind them; the river along the south; the only clean spring under the fortress (drinkable,
    three draws a day - Farming.rationWell, <Studnia:3>)"""
    mp = HM(50, 40, 26, "Przekop kopaczy", 230, 28, bgs=("River", 35, 75))
    west = mp.rect(2, 6, 14, 18) - mp.rect(2, 16, 3, 18)
    link1, camp = mp.rect(15, 10, 16, 12), mp.rect(17, 6, 27, 18)
    tunnel = mp.rect(28, 9, 37, 11)
    river = mp.rect(6, 19, 27, 20)
    floor = west | link1 | camp | tunnel | river | mp.rect(6, 18, 27, 18)
    mp.shell(floor, F_DIRT, W_CAVE)
    mp.paint_faces(mp.rect(17, 0, 27, 25), W_CAVE_BEAMS)
    mp.paint_faces(mp.rect(28, 0, 39, 25), W_CAVE_BEAMS)
    mp.paint_floor(tunnel, F_DIRT_SLABS)
    mp.pool(river)
    spring = mp.rect(11, 6, 12, 7)
    mp.pool(spring, kind=0)
    mp.waterfall(11, 12, (4, 5))
    mp.finish()
    # ---- the west cave: the stairs up, the spring, the lift
    mp.stairs_up(4, 5)
    torch(mp, 8, 5)
    for (x, y) in ((11, 7), (12, 7)):
        mp.add(x, y, {"name": "Źródło pod skałą", "note": "<Studnia:3>",
                      "pages": [page(priority=1, trigger=0, cmds=script("Farming.rationWell(this);"))]})
    mp.note(13, 8, "50b", "zwoj", "Źródło")
    mp.lift(6, 13, 8, 13)
    mp.piece("glazy_br", 2, 10); mp.piece("stalagmit_br", 13, 15); mp.piece("kamyki_br", 9, 16)
    mp.ev(3, 14, "!$Rock_Ore_Iron_Spire", 0, 2, 0, name="Skała z rudą", priority=1, through=False)
    mp.spawn("nietoperz", 9, 10)
    # ---- the diggers' camp
    for (x, y) in ((19, 6), (25, 6)): mp.piece("stempel_t", x, y)
    mp.ev(22, 9, *LANTERN, name="Latarnia kopaczy", priority=0, through=True, step=True, note=LANTERN_LIGHT)
    mp.piece("poslanie", 18, 9); mp.piece("poslanie", 20, 9); mp.piece("poslanie", 18, 13)
    mp.ev(24, 12, "!wagon", 3, 2, 0, name="Wózek kopaczy", priority=1, through=False)
    mp.ev(26, 14, "!wagon", 0, 2, 0, name="Pusty wózek", priority=1, through=False)
    mp.piece("rumowisko", 23, 15); mp.piece("kilof_oparty", 27, 7)
    mp.piece("skrzynka_zamknieta", 17, 15); mp.piece("worki_stos", 20, 15)
    mp.chest(21, 13, [(83, 2), (93, 1), (59, 2), (85, 3)], 30, "Skrzynka kopaczy: dwa bochenki chleba, lina, pochodnie i ruda.",
             name="Skrzynka kopaczy", art=("!Dungeon_chest", 2))
    mp.note(19, 11, "50a", "kartki", "Obóz kopaczy")
    mp.stairs_down(22, 5); torch(mp, 26, 5)
    mp.boss(15, 17)
    mp.spawn("topielec", 24, 17); mp.spawn("pajak", 26, 9)
    # ---- the tunnel east: timbered, its end fallen in
    for x in (30, 34): mp.piece("stempel_t", x, 9)
    mp.piece("gruz_belka", 36, 9); mp.piece("rumowisko", 36, 10)
    mp.film(FILM_RUBBLE, {(35, 9), (35, 10), (35, 11), (34, 11), (37, 11)})
    mp.add(37, 11, {"name": "Zawał", "note": "<Zapiski:50c>", "pages": [page(priority=1, cmds=script('Underground.read("50c")'))]})
    mp.film(FILM_DIRT, {(18, 12), (21, 11), (25, 11), (29, 10), (31, 11)})
    mp.film(FILM_MOSS, {(6, 17), (10, 18), (14, 18), (20, 17), (26, 18), (12, 8)})
    return mp


# ======================================================================================================== floor 60
def floor60():
    """Brama Pierwszych: the arrival hall of the order's scholars; the forecourt before a gate older than everything the order knew,
    stone figures facing inward and the doorkeeper; through the open gate the inner hall with the stairs down; the lift"""
    mp = HM(60, 34, 26, "Brama Pierwszych", 232, 33)
    arr, link1 = mp.rect(2, 6, 7, 12), mp.rect(4, 13, 5, 15)
    fore = mp.rect(2, 16, 31, 23)
    gate = mp.rect(16, 10, 18, 15)
    inner = mp.rect(11, 4, 23, 9)
    floor = arr | link1 | fore | gate | inner
    mp.shell(floor, F_SLATE_SQ, W_NICHES)
    mp.paint_faces(mp.rect(8, 0, 33, 15), W_GOTHIC)
    mp.paint_floor(fore, F_BLUEGREY); mp.paint_floor(inner, F_GREENTILE); mp.paint_floor(gate, F_GREENTILE)
    mp.finish()
    # ---- the arrival hall
    mp.stairs_up(4, 5)
    torch(mp, 6, 5)
    mp.note(7, 7, "60a", "kartki", "Brama Pierwszych")
    mp.piece("kamyki_c", 3, 11)
    # ---- the forecourt and the gate
    mp.add(17, 15, {"name": "Brama Pierwszych", "note": "", "pages": [page(image={"characterName": "!Gate_Dungeon1", "characterIndex": 1,
           "direction": 8, "pattern": 0}, priority=0, through=True)]})
    for x in (14, 20): mp.piece("totem", x, 16)
    for x in (6, 10, 24, 28): mp.piece("posag_kaptur" if x < 17 else "posag_kaptur2", x, 16)
    mp.piece("cokol", 21, 20)
    mp.note(21, 21, "60b", "none", "Napis nad bramą")
    mp.boss(17, 18)
    brazier(mp, 12, 22); brazier(mp, 22, 22)
    mp.spawn("kamiennik", 8, 21); mp.spawn("kamiennik", 26, 21); mp.spawn("zbroja", 4, 22)
    mp.film(FILM_CRACKS, {(15, 18), (16, 19), (18, 19), (19, 20), (17, 21)})
    mp.film(FILM_DUST, {(3, 18), (9, 23), (25, 19), (30, 22)})
    # ---- the inner hall: reliefs, the stairs down, a reliquary
    mp.relief(13, 3, 0); mp.relief(21, 3, 2)
    mp.stairs_down(17, 3)
    mp.chest(12, 8, [(143, 1), (152, 2)], 70, "Relikwiarz Pierwszych: sztaba stali, opatrunki i garść monet, których nikt nie bił na wyspie.",
             name="Relikwiarz Pierwszych", art=("!Dungeon_chest", 3))
    mp.piece("popiersie", 22, 7)
    torch(mp, 11, 3)
    # ---- the lift
    mp.lift(29, 16, 31, 16)
    return mp


# ======================================================================================================== floor 70
def floor70():
    """Sala płaskorzeźb: a long gallery with seven reliefs of the first ones in its north wall, skeletons kneeling before them,
    fire baskets burning with no wood; the armour without a coat of arms; the lift and the stairs down in rooms to the south"""
    mp = HM(70, 38, 24, "Sala płaskorzeźb", 234, 38)
    arr, link1 = mp.rect(2, 6, 8, 12), mp.rect(9, 8, 9, 9)
    gal = mp.rect(10, 6, 35, 13)
    link2, liftr = mp.rect(5, 13, 6, 16), mp.rect(3, 17, 10, 21)
    link3, stair = mp.rect(31, 14, 32, 16), mp.rect(28, 17, 35, 21)
    floor = arr | link1 | gal | link2 | liftr | link3 | stair
    mp.shell(floor, F_SLATE_SQ, W_GOTHIC)
    mp.paint_faces(mp.rect(0, 0, 9, 13), W_NICHES)
    mp.paint_floor(gal, F_BLUEGREY)
    mp.finish()
    mp.stairs_up(4, 5)
    torch(mp, 7, 5)
    mp.note(3, 11, "70a", "zwoj", "Sala płaskorzeźb")
    for k, x in enumerate((12, 15, 18, 21, 24, 27, 30)): mp.relief(x, 5, (0, 0, 0, 0, 0, 1, 2)[k])
    for k, x in enumerate((12, 15, 18, 21, 24)): mp.piece("szkielet", x, 7)
    for x in (13, 19, 25, 31): mp.piece("filar_osm" if x != 19 else "filar_osm_zlamany", x, 11)
    mp.ev(11, 12, *BRAZIER, name="Kosz z ogniem (płonie bez drewna)", priority=1, through=False, step=True, note=BRAZIER_LIGHT)
    mp.ev(34, 12, *BRAZIER, name="Kosz z ogniem (płonie bez drewna)", priority=1, through=False, step=True, note=BRAZIER_LIGHT)
    mp.boss(22, 10)
    mp.spawn("kamiennik", 16, 9); mp.spawn("zbroja", 28, 9)
    mp.note(33, 7, "70b", "kartki", "Wincenty o twarzach")
    mp.film(FILM_CRACKS, {(20, 9), (21, 10), (23, 11), (27, 8)})
    mp.film(FILM_DUST, {(14, 10), (26, 12), (32, 10)})
    mp.lift(6, 17, 8, 17)
    mp.stairs_down(34, 16); torch(mp, 29, 16)
    mp.chest(28, 20, [(152, 3), (143, 1)], 90, "Skrzynia uczonych: opatrunki, stal i monety bez herbu.", name="Skrzynia uczonych", art=("!Dungeon_chest", 7))
    mp.piece("kolumna_lezaca2", 33, 19)
    return mp


# ======================================================================================================== floor 80
def floor80():
    """Sala echa: the pale hall where every word comes back twice - voices from the walls, people from up there standing in a ring
    and gone again, the upiór of the one who asked; the scholar Radost's last note; stairs down, the lift"""
    mp = HM(80, 34, 26, "Sala echa", 240, 44, bgs=("Darkness", 25, 70))
    arr, link1 = mp.rect(2, 6, 8, 12), mp.rect(9, 9, 10, 10)
    hall = mp.rect(11, 6, 30, 20)
    link2, liftr = mp.rect(5, 13, 6, 16), mp.rect(2, 17, 9, 22)
    floor = arr | link1 | hall | link2 | liftr
    mp.shell(floor, F_BLUEGREY, W_PALE)
    mp.paint_faces(mp.rect(11, 0, 33, 25), W_ICE)
    mp.paint_floor(hall, F_SLATE_SQ)
    mp.finish()
    mist = {(x, y) for x in range(12, 30) for y in range(7, 20) if (x * 7 + y * 3) % 5 < 2}
    mp.film(FILM_MIST, mist)
    mp.stairs_up(4, 5)
    mp.bluetorch(7, 5)
    import math
    for k in range(8):
        a = k * math.pi / 4
        mp.vision(20 + round(math.cos(a) * 6), 13 + round(math.sin(a) * 5))
    for (x, y) in ((12, 7), (29, 7), (12, 19), (29, 19), (20, 7)): mp.whisper(x, y)
    for x in (14, 26): mp.piece("kolumna_lodu", x, 9); mp.piece("kolumna_lodu", x, 15)
    mp.piece("krysztaly_nieb", 12, 18); mp.piece("krysztaly_ziel", 29, 7); mp.piece("krysztal_nieb", 11, 7)
    mp.piece("szkielet", 13, 11); mp.piece("czaszki", 24, 8); mp.piece("kosci2", 17, 18)
    mp.ev(20, 13, "!$Altar", 0, 4, 0, name="Zapiski: Sala echa", priority=1, through=False, step=True,
          cmds=script('Underground.read("80a")'), note=BLUE_LIGHT + "<Zapiski:80a>")
    mp.note(28, 18, "80b", "kartki", "Ostatni zapis Radosta")
    mp.boss(20, 16)
    mp.spawn("upior", 15, 12); mp.spawn("cien", 25, 14)
    for x in (13, 27): mp.bluetorch(x, 5)
    mp.stairs_down(28, 5)
    mp.lift(5, 17, 7, 17)
    mp.chest(3, 21, [(152, 3), (59, 2)], 110, "Skrzynia bez zamka: opatrunki, pochodnie, monety. Nikt jej nie pilnował.", name="Skrzynia bez zamka")
    mp.bluetorch(9, 16)
    return mp


# ======================================================================================================== floor 90
def floor90():
    """Ostatnia straż: the order's last watch before the Heart - bedrolls, a cold fire basket, the watch's book, the last prior's
    letter, the names cut into a slab with room for one more; the Last Guardian; the lowest stop of the lift; the stairs down"""
    mp = HM(90, 36, 26, "Ostatnia straż", 238, 49, bgs=("Darkness", 18, 60))
    arr, link1 = mp.rect(2, 6, 8, 12), mp.rect(9, 9, 10, 10)
    hall = mp.rect(11, 6, 26, 16)
    link2, east = mp.rect(27, 9, 28, 10), mp.rect(29, 6, 34, 12)
    link3, liftr = mp.rect(4, 13, 5, 16), mp.rect(2, 17, 9, 22)
    floor = arr | link1 | hall | link2 | east | link3 | liftr
    mp.shell(floor, F_SLATE_SQ, W_GOTHIC2)
    mp.paint_faces(mp.rect(11, 0, 26, 25), W_PALE)
    mp.paint_floor(hall, F_BLUEGREY)
    mp.finish()
    mp.film(FILM_MIST, {(x, y) for x in range(12, 26) for y in range(12, 17) if (x + y) % 3 == 0})
    mp.stairs_up(4, 5)
    mp.bluetorch(7, 5)
    # ---- the watch
    for (x, y) in ((12, 7), (12, 10), (25, 7), (25, 10)): mp.piece("poslanie", x, y)
    mp.ev(18, 10, *UNLIT_BOWL, name="Wygasły kosz", priority=1, through=False)
    mp.piece("lawa_kamienna", 16, 12); mp.piece("plyta", 19, 12)
    mp.ev(21, 7, "!$Altar", 0, 4, 0, name="Zapiski: Ostatnia straż", priority=1, through=False, step=True,
          cmds=script('Underground.read("90a")'), note=BLUE_LIGHT + "<Zapiski:90a>")
    mp.note(23, 13, "90b", "papiery", "Ostatni przeor")
    mp.piece("plyta", 14, 15)
    mp.note(15, 15, "90c", "none", "Lista tych, co zeszli")
    mp.boss(19, 14)
    mp.whisper(13, 13); mp.whisper(24, 15); mp.vision(17, 8)
    mp.spawn("cien", 14, 9); mp.spawn("upior", 23, 9)
    for x in (13, 24): mp.bluetorch(x, 5)
    # ---- the stairs down and the lowest stop of the lift
    mp.stairs_down(31, 5); mp.bluetorch(33, 5)
    mp.vision(32, 10)
    mp.lift(6, 17, 8, 17)
    mp.chest(2, 21, [(152, 3), (59, 3)], 80, "Skrzynia ostatniej straży: opatrunki, pochodnie i ostatnie monety zakonu.", name="Skrzynia ostatniej straży")
    return mp


# ======================================================================================================== floor 100
def floor100():
    """Komnata Serca (Map011): the stairs from floor 99, the antechamber under the last wall with the door of three locks - the
    raven's keyhole (W4), the stone bell (W2), the stone of empty verses (W3) - and behind the door the chamber of the Heart: a
    carved circle, a pedestal and on it a light without a shape (STORY.md leaves the Heart's form open), the guardian's bench"""
    mp = HM(100, 30, 26, "Komnata Serca", 236, 54)
    mp.id = 11
    mp.props["displayName"] = "Komnata Serca"
    arr, link1 = mp.rect(2, 6, 5, 11), mp.rect(3, 12, 4, 15)
    ante = mp.rect(2, 16, 27, 22)
    passage = mp.rect(14, 12, 16, 15)
    chamber = mp.rect(9, 3, 21, 11)
    floor = arr | link1 | ante | passage | chamber
    mp.shell(floor, F_SLATE_SQ, W_GOTHIC2)
    mp.paint_faces(mp.rect(8, 0, 22, 11), W_GOTHIC)
    mp.paint_floor(chamber, F_BLUEGREY); mp.paint_floor(passage, F_BLUEGREY)
    mp.finish()
    # ---- the arrival and the antechamber
    mp.stairs_up(4, 5)
    torch(mp, 2, 5)
    torch(mp, 9, 14); torch(mp, 21, 14)
    brazier(mp, 3, 21); brazier(mp, 26, 21)
    mp.piece("szkielet", 13, 18); mp.piece("czaszki", 18, 21); mp.piece("kosci3", 24, 18)
    # the door: the gate in the passage's mouth, its sides; open (self switch A, Underground.syncDoor) once two locks are open
    shut = {"characterName": "!Gate_Dungeon1", "characterIndex": 0, "direction": 6, "pattern": 0}
    opened = {"characterName": "!Gate_Dungeon1", "characterIndex": 1, "direction": 8, "pattern": 0}
    mp.add(15, 15, {"name": "Drzwi Komnaty Serca", "note": "", "pages": [
        page(image=shut, priority=1, cmds=script("Underground.door(this)")),
        page(image=opened, priority=0, through=True, cond=self_cond("A"))]})
    for x in (14, 16):
        mp.add(x, 15, {"name": "Drzwi Komnaty Serca (bok)", "note": "", "pages": [
            page(priority=1, cmds=script("Underground.door(this)")), page(priority=0, through=True, cond=self_cond("A"))]})
    mp.add(12, 16, {"name": "Zamek z krukiem", "note": "", "pages": [page(image={"characterName": "!$Ug_Lock", "characterIndex": 0,
           "direction": 2, "pattern": 0}, priority=1, cmds=script('Underground.lock("key", this)'))]})
    mp.add(10, 19, {"name": "Kamienny dzwon", "note": "", "pages": [page(image={"characterName": "!$Ug_Bell", "characterIndex": 0,
           "direction": 2, "pattern": 0}, priority=1, cmds=script('Underground.lock("signal", this)'))]})
    mp.add(20, 19, {"name": "Kamień pieśni", "note": "", "pages": [page(image={"characterName": "!$Ug_SongStone", "characterIndex": 0,
           "direction": 2, "pattern": 0}, priority=1, cmds=script('Underground.lock("song", this)'))]})
    mp.piece("cokol", 18, 16)
    mp.note(18, 17, "100a", "none", "Napis nad drzwiami")
    # ---- the chamber of the Heart
    for dy in range(3):
        for dx in range(3): mp.t("A5", 3 + dx, 11 + dy, 14 + dx, 6 + dy, z=1)
    mp.t("C", 9, 8, 15, 6); mp.t("C", 9, 10, 15, 7)          # a short square pedestal: a pillar's cap on its foot
    mp.solid.add((15, 7))
    # the Heart: what one talks to (the pedestal's foot) and its light above the cap (drawn over everything, walk-through)
    mp.add(15, 7, {"name": "Serce Twierdzy", "note": "", "pages": [page(priority=1, cmds=script("Underground.heart(this)"))]})
    mp.add(15, 7, {"name": "Serce Twierdzy (blask)", "note": HEART_LIGHT, "pages": [page(image={"characterName": "!$Ug_Heart",
           "characterIndex": 0, "direction": 2, "pattern": 0}, priority=2, through=True, step=True)]})
    mp.piece("lawa_kamienna", 12, 8)
    mp.relief(12, 2, 0); mp.relief(18, 2, 2)
    mp.piece("posag_kaptur", 9, 3); mp.piece("posag_kaptur2", 21, 3)
    brazier(mp, 10, 10); brazier(mp, 20, 10)
    mp.spot("heart", 15, 8, 8)
    mp.spot("door", 15, 16, 8)
    return mp


FLOOR_BUILDERS = {20: floor20, 30: floor30, 40: floor40, 50: floor50, 60: floor60, 70: floor70, 80: floor80, 90: floor90, 100: floor100}
