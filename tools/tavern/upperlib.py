# The two upper floors of the new tavern "Pod Złotym Kuflem": Map025 "Pokoje gości" and Map026 "Apartamenty".
# This file holds (1) the floor plans as data - every room, corridor, hall, door, arch and stairwell with its cells -
# so the zone-plan pictures and the real maps come from one source, and (2) the helpers build_upper.py uses: room
# shells on tileset 8, doors that open, a furnishing kit that keeps things centred and symmetric, and the checks
# ("równo, schludnie": spacing of wall items, symmetry round beds and tables, nothing on a table's edge, clear doors).
#
# tavlib.py / props.py belong to the ground-floor work and are only imported, never changed.
#
# Map geometry used everywhere below (the Winlu/RPG Maker top-down convention):
#   a room = its floor rectangle; above its top floor row stands its north wall face (3 rows); round it all runs the
#   wall top ("border", one cell). A room north of a corridor is entered through a door picture standing on the bottom
#   row of the corridor's wall face; a room south of a corridor through a gap in the corridor's border line (its own
#   door picture is then inside, on the room's wall face).
import os, sys, json, math, copy
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

# ======================================================================================================== plans (data)
class Space:
    """one room / corridor / hall. rect = the floor (x0, y0, x1, y1); face = rows of wall face above the floor (0 =
    none, the floor runs on into the space above); kind picks the colour on the plan and the furnishing template"""
    def __init__(self, key, label, kind, x0, y0, x1, y1, face=3, **kw):
        self.key, self.label, self.kind = key, label, kind
        self.x0, self.y0, self.x1, self.y1 = x0, y0, x1, y1
        self.face = face
        self.number = kw.pop("number", None)
        self.size = kw.pop("size", None)          # single / double / family (guest rooms)
        self.style = kw.pop("style", None)        # wallpaper style (guest rooms)
        self.rent = kw.pop("rent", None)          # (room id for TavernLife, price) - the three rentable rooms
        self.door = kw.pop("door", None)          # ("front", x) | ("gap", x) | ("arch", x0, x1) | ("side", x, y) ...
        self.lock = kw.pop("lock", None)          # TavernLife door id when the door is locked ("1", "suite", "lordsuite", ...)
        self.note = kw.pop("note", "")            # a short Polish line for the plan legend
        self.extra = kw
    @property
    def w(self): return self.x1 - self.x0 + 1
    @property
    def h(self): return self.y1 - self.y0 + 1
    @property
    def cx(self): return (self.x0 + self.x1) / 2.0
    def cells(self):
        return {(x, y) for y in range(self.y0, self.y1 + 1) for x in range(self.x0, self.x1 + 1)}
    def __repr__(self):
        return "<%s %s %d,%d-%d,%d>" % (self.key, self.label, self.x0, self.y0, self.x1, self.y1)


# ------------------------------------------------------------------------------------------------ Map025 "Pokoje gości"
# 97 x 71, symmetric round column 48 (mirror x -> 96 - x). An "H" of two long corridors joined in the middle by the
# Galeria (a wide hall round an open well over the tavern's great hall, railings, a chandelier seen from above); the
# stairs from the tavern arrive in the stair hall at the bottom middle, on the same axis: stair hall -> south corridor
# -> Galeria -> north corridor -> the lounge's arch. Four bands of rooms: north (outer wall, windows), core north and
# core south (between the corridors, split by the Galeria), south (outer wall).
W25, H25 = 97, 71
ROWS25 = {"n": (4, 12), "nc": (17, 20), "cn": (25, 32), "cs": (37, 44), "sc": (49, 52), "s": (57, 65)}
# wall styles for the guest rooms (A3 wall kind, A4 floor kind, curtain colour column on B, bed, rug kind, label)
STYLES = {
    "kremowy":   {"wall": 52, "floor": 81, "curtain": 0, "bed": "red",   "rug": 36, "pl": "tynk kremowy z boazerią"},
    "zielony":   {"wall": 72, "floor": 84, "curtain": 5, "bed": "green", "rug": 30, "pl": "szałwiowy tynk z boazerią"},
    "niebieski": {"wall": 62, "floor": 83, "curtain": 3, "bed": "patch", "rug": 28, "pl": "niebieski adamaszek"},
    "bale":      {"wall": 48, "floor": 82, "curtain": 2, "bed": "straw", "rug": 21, "pl": "ściany z bali"},
    "bezowy":    {"wall": 56, "floor": 80, "curtain": 0, "bed": "red",   "rug": 38, "pl": "beżowa tapeta, czerwony cokół"},
    "ciemny":    {"wall": 59, "floor": 83, "curtain": 2, "bed": "green", "rug": 29, "pl": "ciemne bale"},
}
SIZE_PL = {"single": "1-os.", "double": "2-os.", "family": "rodzinny"}

def layout25():
    n0, n1 = ROWS25["n"]; c0, c1 = ROWS25["cn"]; s0, s1 = ROWS25["cs"]; b0, b1 = ROWS25["s"]
    G = []
    add = G.append
    # ---- corridors and halls
    add(Space("nc", "Korytarz północny", "corridor", 1, 17, 95, 20, face=3, note="boazeria, latarnie, obrazy, chodnik"))
    add(Space("sc", "Korytarz południowy", "corridor", 1, 49, 95, 52, face=3, note="boazeria, latarnie, obrazy, chodnik"))
    add(Space("gal", "Galeria", "gallery", 43, 21, 53, 48, face=0, note="otwarta studnia nad salą tawerny, balustrada"))
    add(Space("hall", "Hall schodowy", "stairhall", 40, 57, 56, 69, face=3, door=("arch", 46, 50),
              note="schody z sali, księga gości, zegar"))
    # ---- north band (outer wall): doors on the north corridor's wall face
    add(Space("r23", "Pokój 23", "guest", 1, n0 + 2, 7, n1, number=23, size="single", style="bale", door=("front", 4)))
    add(Space("r22", "Pokój 22", "guest", 9, n0, 17, n1, number=22, size="double", style="zielony", door=("front", 13)))
    add(Space("r21", "Pokój 21", "guest", 19, n0 + 2, 25, n1, number=21, size="single", style="kremowy", door=("front", 22)))
    add(Space("r20", "Pokój 20", "guest", 27, n0, 37, n1, number=20, size="family", style="niebieski", door=("front", 32)))
    add(Space("lounge", "Salonik gości", "lounge", 39, n0, 57, n1, door=("arch", 46, 50), note="kominek, fotele, sofa, biblioteczka"))
    add(Space("chamber", "Komnata", "chamber", 59, n0, 76, n1, door=("front", 67), lock="komnata",
              rent=("komnata", 30), note="do wynajęcia (reputacja 60): łoże, kominek"))
    add(Space("r24", "Pokój 24", "guest", 78, n0, 87, n1, number=24, size="double", style="bezowy", door=("front", 83)))
    add(Space("up", "Schody na górę", "stairs", 90, n0, 94, n1, face=0, door=("arch", 90, 94), note="do Apartamentów (Map026)"))
    # ---- core north (between the corridors, upper half): gaps in the north corridor's border; the door sits in a
    # corner of the room so the bed stays centred on its wall
    add(Space("bath", "Łazienka", "bath", 1, c0, 17, c1, door=("gap", 9), note="balie za parawanami, umywalki"))
    add(Space("linen", "Bieliźniarka", "service", 19, c0, 25, c1, door=("gap", 22), note="półki z pościelą, kosze"))
    add(Space("maid", "Pokój pokojówki", "service", 27, c0, 33, c1, door=("gap", 30), note="łóżko, szafa, wózek"))
    add(Space("r15", "Pokój 15", "guest", 35, c0, 41, c1, number=15, size="single", style="bezowy", door=("gap", 41)))
    add(Space("r16", "Pokój 16", "guest", 55, c0, 61, c1, number=16, size="single", style="zielony", door=("gap", 55)))
    add(Space("r17", "Pokój 17", "guest", 63, c0, 71, c1, number=17, size="double", style="kremowy", door=("gap", 64)))
    add(Space("r18", "Pokój 18", "guest", 73, c0, 83, c1, number=18, size="family", style="niebieski", door=("gap", 74)))
    add(Space("r19", "Pokój 19", "guest", 85, c0, 95, c1, number=19, size="family", style="bale", door=("gap", 94)))
    # ---- core south (lower half): doors on the south corridor's wall face; rooms 1-3 are for rent (TavernLife)
    add(Space("r7", "Pokój 7", "guest", 1, s0, 9, s1, number=7, size="single", style="niebieski", door=("front", 5)))
    add(Space("r5", "Pokój 5", "guest", 11, s0, 20, s1, number=5, size="double", style="bezowy", door=("front", 16)))
    add(Space("r3", "Pokój 3", "guest", 22, s0, 33, s1, number=3, size="family", style="zielony", door=("front", 28),
              rent=("3", 20), lock="3"))
    add(Space("r1", "Pokój 1", "guest", 35, s0, 41, s1, number=1, size="single", style="bale", door=("front", 38),
              rent=("1", 8), lock="1"))
    add(Space("r2", "Pokój 2", "guest", 55, s0, 61, s1, number=2, size="double", style="kremowy", door=("front", 58),
              rent=("2", 15), lock="2"))
    add(Space("r4", "Pokój 4", "guest", 63, s0, 74, s1, number=4, size="family", style="niebieski", door=("front", 68)))
    add(Space("r6", "Pokój 6", "guest", 76, s0, 85, s1, number=6, size="double", style="ciemny", door=("front", 80)))
    add(Space("r8", "Pokój 8", "guest", 87, s0, 95, s1, number=8, size="single", style="zielony", door=("front", 91)))
    # ---- south band (outer wall): gaps in the south corridor's border
    add(Space("r13", "Pokój 13", "guest", 1, b0, 12, b1 + 2, number=13, size="family", style="zielony", door=("gap", 2)))
    add(Space("r11", "Pokój 11", "guest", 14, b0, 25, b1, number=11, size="family", style="bale", door=("gap", 15)))
    add(Space("r9", "Pokój 9", "guest", 27, b0, 38, b1, number=9, size="double", style="kremowy", door=("gap", 37)))
    add(Space("r10", "Pokój 10", "guest", 58, b0, 69, b1, number=10, size="double", style="niebieski", door=("gap", 59)))
    add(Space("r12", "Pokój 12", "guest", 71, b0, 82, b1, number=12, size="double", style="bezowy", door=("gap", 81)))
    add(Space("r14", "Pokój 14", "guest", 84, b0, 95, b1 + 2, number=14, size="family", style="ciemny", door=("gap", 94)))
    return {"W": W25, "H": H25, "spaces": G, "title": "Piętro 1 — Pokoje gości (Map025)",
            "well": (46, 28, 50, 38), "stairs_down": (46, 63, 50, 69), "stairs_up": (90, 5, 94, 16), "gate": (90, 16, 94, 16)}


# ------------------------------------------------------------------------------------------------ Map026 "Apartamenty"
# 81 x 57, symmetric round column 40 (mirror x -> 80 - x). A palazzo: the stairs from the guest floor come up into the
# middle of the Wielka galeria (a marble hall with columns; the stairwell with its balustrade is the gallery edge),
# the guard's place at the stair head. North of the hall: three suites' worth of rooms - the Lord's suite on the axis
# between the library and the servants' corner, a suite at each end. South: the grand salon and the private dining
# hall side by side on the axis, a suite at each end; behind the salon and the dining hall a terrace (balcony).
W26, H26 = 81, 57
ROWS26 = {"n": (4, 15), "hall": (20, 30), "s": (35, 46), "terrace": (48, 53)}

def layout26():
    n0, n1 = ROWS26["n"]; s0, s1 = ROWS26["s"]
    G = []
    add = G.append
    add(Space("hall", "Wielka galeria", "gallery", 9, 20, 71, 30, face=3,
              note="marmur, kolumny, kandelabry, klatka schodowa z balustradą; na osi herb Zaleskich"))
    add(Space("serv", "Kącik służby", "service", 1, 20, 7, 30, door=("side", 8, 26), note="srebra, pościel, łóżko służącego"))
    add(Space("bathlux", "Łazienka", "bath", 73, 20, 79, 30, door=("side", 72, 26), note="miedziana wanna, toaletka"))
    # north band: suite Różany (bedchamber at the outer wall, salonik by the hall), the Lord's suite (its salon on the
    # axis, the bedchamber beside it), the library, suite Błękitny (mirrored)
    add(Space("s1b", "Apartament Różany — sypialnia", "suite_bed", 1, n0, 10, n1, door=("side", 11, 13), style="rozany"))
    add(Space("s1a", "Apartament Różany — salonik", "suite", 12, n0, 20, n1, door=("front", 16), lock="suite1", style="rozany"))
    add(Space("lordb", "Apartament Lorda — sypialnia", "lord_bed", 22, n0, 31, n1, door=("front", 24), lock="lordsuite", style="lord",
              side=(32, 13)))
    add(Space("lorda", "Apartament Lorda — salon", "lord", 33, n0, 47, n1, door=("front", 40), lock="lordsuite", style="lord",
              note="herb Zaleskich, chorągwie"))
    add(Space("lib", "Biblioteka", "library", 49, n0, 58, n1, door=("front", 56), note="regały, pulpit, biurka, fotele"))
    add(Space("s2a", "Apartament Błękitny — salonik", "suite", 60, n0, 68, n1, door=("front", 64), lock="suite2", style="blekitny"))
    add(Space("s2b", "Apartament Błękitny — sypialnia", "suite_bed", 70, n0, 79, n1, door=("side", 69, 13), style="blekitny"))
    # south band: suites at the ends (salonik on the hall side), the grand salon and the dining hall on the axis
    add(Space("s3b", "Apartament Zielony — sypialnia", "suite_bed", 1, s0, 10, s1, door=("side", 11, 40), style="zielony"))
    add(Space("s3a", "Apartament Zielony — salonik", "suite", 12, s0, 19, s1, door=("gap", 13), lock="suite3", style="zielony"))
    add(Space("salon", "Wielki salon", "salon", 21, s0, 39, s1, door=("gaps", 25, 35), note="kominek, sofy, fotele, harfa, szpinet"))
    add(Space("dining", "Jadalnia", "dining", 41, s0, 59, s1, door=("gaps", 45, 55), note="długi stół, srebra, kandelabry"))
    add(Space("s4a", "Apartament Złoty — salonik", "suite", 61, s0, 68, s1, door=("gap", 67), lock="zloty", style="zloty",
              rent=("zloty", 50)))
    add(Space("s4b", "Apartament Złoty — sypialnia", "suite_bed", 70, s0, 79, s1, door=("side", 69, 40), style="zloty"))
    add(Space("terrace", "Taras", "terrace", 21, 48, 59, 53, face=0, door=("gaps", 30, 50), note="balkon z balustradą, donice"))
    return {"W": W26, "H": H26, "spaces": G, "title": "Piętro 2 — Apartamenty (Map026)",
            "stairs_down": (38, 24, 42, 30), "guard": (36, 22)}


# ======================================================================================================== plan pictures
def _font(size, bold=False):
    from PIL import ImageFont
    return ImageFont.truetype("C:/Windows/Fonts/" + ("arialbd.ttf" if bold else "arial.ttf"), size)

KIND_COL = {
    "guest": (120, 170, 220), "rent": (240, 196, 80), "corridor": (214, 196, 160), "gallery": (206, 176, 132),
    "stairhall": (190, 160, 225), "stairs": (190, 160, 225), "lounge": (236, 150, 90), "chamber": (170, 120, 200),
    "bath": (110, 200, 200), "service": (170, 170, 170), "suite": (230, 150, 170), "suite_bed": (215, 125, 150),
    "lord": (220, 70, 60), "lord_bed": (200, 55, 50), "library": (150, 190, 110), "salon": (236, 150, 90),
    "dining": (240, 196, 80), "terrace": (150, 200, 150),
}
KIND_PL = {
    "guest": "pokój gościnny", "rent": "pokój do wynajęcia (TavernLife)", "corridor": "korytarz", "gallery": "galeria / hall",
    "stairhall": "hall schodowy", "stairs": "schody", "lounge": "salonik", "chamber": "komnata (zamknięta)",
    "bath": "łaźnia", "service": "zaplecze / służba", "suite": "apartament — salonik", "suite_bed": "apartament — sypialnia",
    "lord": "apartament Lorda", "lord_bed": "apartament Lorda — sypialnia", "library": "biblioteka", "salon": "wielki salon",
    "dining": "jadalnia", "terrace": "taras (balkon)",
}

def draw_plan(L, out, subtitle, legend_rows, S=12):
    """a labelled block plan: walls dark, wall faces a darker shade of the zone colour, floors the zone colour, doors
    and arches marked, stairs hatched, the well black with its railing. S = pixels per cell."""
    from PIL import Image, ImageDraw
    W, H = L["W"], L["H"]
    col = {}
    face = {}
    owner = {}
    for sp in L["spaces"]:
        k = "rent" if sp.rent else sp.kind
        c = KIND_COL.get(k, (200, 200, 200))
        for cell in sp.cells():
            col[cell] = c; owner[cell] = sp
        for y in range(sp.y0 - sp.face, sp.y0):
            for x in range(sp.x0, sp.x1 + 1):
                if (x, y) not in col: face[(x, y)] = tuple(int(v * 0.62) for v in c)
    # arches / openings through faces and borders
    def open_col(sp, xa, xb):
        # the cells between the space's floor and the corridor/hall it opens onto
        for x in range(xa, xb + 1):
            y = sp.y1 + 1
            while (x, y) not in col and y < H - 1:
                col[(x, y)] = KIND_COL["corridor"]; face.pop((x, y), None); y += 1
    PAD_T, PAD_L = 92, 14
    LEG = 470
    img = Image.new("RGB", (PAD_L * 2 + W * S + LEG, max(PAD_T + H * S + 40, PAD_T + 420 + 20 * len(legend_rows))), (24, 21, 26))
    d = ImageDraw.Draw(img)
    def cell_box(x, y, pad=0):
        return [PAD_L + x * S + pad, PAD_T + y * S + pad, PAD_L + (x + 1) * S - 1 - pad, PAD_T + (y + 1) * S - 1 - pad]
    # walls first (everything), then faces and floors
    d.rectangle([PAD_L, PAD_T, PAD_L + W * S - 1, PAD_T + H * S - 1], fill=(52, 44, 40))
    for (x, y), c in face.items():
        d.rectangle(cell_box(x, y), fill=c)
    for (x, y), c in col.items():
        d.rectangle(cell_box(x, y), fill=c)
    # the arches cut through the faces: the space whose door is an arch shows floor there
    for sp in L["spaces"]:
        if sp.door and sp.door[0] == "arch":
            xa, xb = sp.door[1], sp.door[2]
            if sp.kind in ("lounge", "stairs"):         # north band opening down into the north corridor
                for x in range(xa, xb + 1):
                    for y in range(sp.y1 + 1, sp.y1 + 5):
                        d.rectangle(cell_box(x, y), fill=KIND_COL["corridor"])
            else:                                        # the stair hall opening up into the south corridor
                for x in range(xa, xb + 1):
                    for y in range(sp.y0 - 4, sp.y0):
                        d.rectangle(cell_box(x, y), fill=KIND_COL["corridor"])
    # the Galeria runs into both corridors: no wall there
    for sp in L["spaces"]:
        if sp.kind == "gallery" and sp.face == 0:
            for x in range(sp.x0, sp.x1 + 1):
                for y in range(sp.y0, sp.y1 + 1):
                    d.rectangle(cell_box(x, y), fill=KIND_COL["gallery"])
    # the well (void) with its railing
    if L.get("well"):
        x0, y0, x1, y1 = L["well"]
        d.rectangle([PAD_L + x0 * S, PAD_T + y0 * S, PAD_L + (x1 + 1) * S - 1, PAD_T + (y1 + 1) * S - 1], fill=(8, 8, 10), outline=(150, 110, 60), width=3)
        cx, cy = PAD_L + (x0 + x1 + 1) * S / 2, PAD_T + (y0 + y1 + 1) * S / 2
        d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], outline=(250, 210, 120), width=2)
    # stairs: hatching across the steps, an arrow for the way down/up
    for key, down in (("stairs_down", True), ("stairs_up", False)):
        if not L.get(key): continue
        x0, y0, x1, y1 = L[key]
        d.rectangle([PAD_L + x0 * S, PAD_T + y0 * S, PAD_L + (x1 + 1) * S - 1, PAD_T + (y1 + 1) * S - 1], fill=(172, 140, 110))
        for y in range(y0, y1 + 1):
            yy = PAD_T + y * S + S - 2
            d.line([PAD_L + x0 * S, yy, PAD_L + (x1 + 1) * S - 1, yy], fill=(96, 70, 50), width=2)
        cx = PAD_L + (x0 + x1 + 1) * S / 2
        ya, yb = PAD_T + y0 * S + 4, PAD_T + (y1 + 1) * S - 4
        tip = yb if down else ya
        d.line([cx, ya, cx, yb], fill=(255, 255, 255), width=3)
        d.polygon([(cx - 7, tip - (7 if down else -7)), (cx + 7, tip - (7 if down else -7)), (cx, tip)], fill=(255, 255, 255))
    if L.get("gate"):
        x0, y0, x1, y1 = L["gate"]
        d.rectangle([PAD_L + x0 * S, PAD_T + y0 * S + 2, PAD_L + (x1 + 1) * S - 1, PAD_T + (y1 + 1) * S - 2], fill=(236, 190, 60), outline=(60, 40, 10), width=2)
        for x in range(x0, x1 + 1):
            d.line([PAD_L + x * S + S // 2, PAD_T + y0 * S + 3, PAD_L + x * S + S // 2, PAD_T + (y1 + 1) * S - 3], fill=(90, 60, 14), width=1)
    # doors: front doors on the corridor face (brown blocks), gaps in the border (light), numbers
    for sp in L["spaces"]:
        dr = sp.door
        if not dr: continue
        if dr[0] == "front":
            x = dr[1]; y = sp.y1 + 4
            box = [PAD_L + x * S + 1, PAD_T + (y - 1) * S + 2, PAD_L + (x + 1) * S - 2, PAD_T + (y + 1) * S - 1]
            d.rectangle(box, fill=(250, 216, 120) if sp.lock else (132, 84, 48), outline=(30, 20, 14))
            d.rectangle([PAD_L + x * S, PAD_T + sp.y1 * S + S, PAD_L + (x + 1) * S - 1, PAD_T + (sp.y1 + 2) * S - 1], fill=KIND_COL["corridor"])
        elif dr[0] in ("gap", "gap2", "gaps"):
            xs = [dr[1]] if dr[0] == "gap" else list(dr[1:]) if dr[0] == "gaps" else list(range(dr[1], dr[2] + 1))
            for x in xs:
                y = sp.y0 - sp.face - 1 if sp.kind != "terrace" else sp.y0 - 1
                d.rectangle(cell_box(x, y), fill=(250, 216, 120) if sp.lock else (230, 214, 180))
                for yy in range(sp.y0 - sp.face, sp.y0):
                    pass
                if sp.kind != "terrace":
                    dy = sp.y0 - 1
                    d.rectangle([PAD_L + x * S + 1, PAD_T + (dy - 1) * S + 2, PAD_L + (x + 1) * S - 2, PAD_T + (dy + 1) * S - 1],
                                fill=(250, 216, 120) if sp.lock else (132, 84, 48), outline=(30, 20, 14))
        elif dr[0] == "side":
            x, y = dr[1], dr[2]
            d.rectangle(cell_box(x, y), fill=KIND_COL.get(sp.kind, (200, 200, 200)))
            d.rectangle(cell_box(x, y + 1), fill=KIND_COL.get(sp.kind, (200, 200, 200)))
    # thin outlines round every space
    for sp in L["spaces"]:
        d.rectangle([PAD_L + sp.x0 * S, PAD_T + (sp.y0 - sp.face) * S, PAD_L + (sp.x1 + 1) * S - 1, PAD_T + (sp.y1 + 1) * S - 1],
                    outline=(24, 20, 18), width=1)
    # labels
    f_big, f_mid, f_small = _font(15, True), _font(12, True), _font(11)
    for sp in L["spaces"]:
        if sp.kind in ("corridor",):
            t = sp.label
            tw = d.textlength(t, font=f_mid)
            d.text((PAD_L + sp.cx * S + S / 2 - tw / 2, PAD_T + (sp.y0 + sp.y1 + 1) * S / 2 - 8), t, fill=(60, 44, 30), font=f_mid)
            continue
        if sp.number is not None:
            lines = [str(sp.number)]
            sub = SIZE_PL.get(sp.size, "")
            if sp.rent: sub += "  %d G" % sp.rent[1]
            lines.append(sub)
            fonts = [_font(17 if sp.w >= 8 else 15, True), f_small]
        else:
            words = sp.label.replace(" — ", "\n").split("\n")
            lines, fonts = [], []
            for wds in words:
                # wrap to the space's width
                cur = ""
                for wd in wds.split(" "):
                    t = (cur + " " + wd).strip()
                    if d.textlength(t, font=f_mid) > sp.w * S - 6 and cur:
                        lines.append(cur); fonts.append(f_mid); cur = wd
                    else:
                        cur = t
                lines.append(cur); fonts.append(f_mid)
        hs = [f.size + 3 for f in fonts]
        ty = PAD_T + (sp.y0 + sp.y1 + 1) * S / 2 - sum(hs) / 2
        if sp.kind == "gallery" and L.get("well") and sp.key == "gal":
            ty = PAD_T + (sp.y0 + 2) * S
        if sp.kind == "gallery" and sp.key == "hall" and L.get("stairs_down"):
            ty = PAD_T + (sp.y0 + 1) * S
        if sp.kind == "stairhall":
            ty = PAD_T + (sp.y0 + 0.5) * S
        if sp.kind == "stairs":
            ty = PAD_T + (sp.y0 - 3) * S + 1
        for t, f, hh in zip(lines, fonts, hs):
            tw = d.textlength(t, font=f)
            tx = PAD_L + (sp.x0 + sp.x1 + 1) * S / 2 - tw / 2
            d.text((tx + 1, ty + 1), t, fill=(250, 246, 236), font=f)
            d.text((tx, ty), t, fill=(26, 20, 16), font=f)
            ty += hh
    # title, subtitle, legend
    d.text((PAD_L, 14), L["title"], fill=(255, 214, 90), font=_font(26, True))
    d.text((PAD_L, 50), subtitle, fill=(222, 216, 206), font=_font(14))
    lx = PAD_L * 2 + W * S + 6
    yy = PAD_T
    d.text((lx, yy), "Legenda", fill=(255, 214, 90), font=_font(17, True)); yy += 28
    used = []
    for sp in L["spaces"]:
        k = "rent" if sp.rent else sp.kind
        if k not in used: used.append(k)
    for k in used:
        d.rectangle([lx, yy + 2, lx + 18, yy + 16], fill=KIND_COL[k], outline=(240, 240, 240))
        d.text((lx + 28, yy), KIND_PL[k], fill=(236, 232, 224), font=_font(13))
        yy += 21
    yy += 4
    d.rectangle([lx, yy, lx + 10, yy + 18], fill=(132, 84, 48), outline=(240, 240, 240)); d.text((lx + 28, yy + 1), "drzwi", fill=(236, 232, 224), font=_font(13)); yy += 23
    d.rectangle([lx, yy, lx + 10, yy + 18], fill=(250, 216, 120), outline=(240, 240, 240)); d.text((lx + 28, yy + 1), "drzwi zamykane (TavernLife)", fill=(236, 232, 224), font=_font(13)); yy += 23
    d.rectangle([lx, yy + 2, lx + 18, yy + 16], fill=(172, 140, 110)); d.text((lx + 28, yy), "schody (strzałka: w dół / w górę)", fill=(236, 232, 224), font=_font(13)); yy += 30
    for row in legend_rows:
        bold = row.startswith("#")
        t = row.lstrip("#")
        d.text((lx, yy), t, fill=(255, 214, 90) if bold else (226, 222, 214), font=_font(13, bold))
        yy += 19 if not bold else 22
    d.text((PAD_L, PAD_T + H * S + 10), "Mapa %d × %d kratek; 1 kratka = 48 px w grze. Północ u góry." % (W, H), fill=(160, 160, 170), font=_font(12))
    img.save(out)
    return img.size


# ======================================================================================================== offline renderer
# Draws a staged map the way MZ's Tilemap does (the same autotile tables, shadows, star tiles over the characters) and
# its events' pictures (the same frame maths as Sprite_Character), without the game: a whole-map render in a couple of
# seconds for checking the layout. The lighting (RoomLighting) is not drawn; the in-game renders (render.js) show it.
ROOT_DIR = os.path.abspath(os.path.join(HERE, "..", "..")).replace(os.sep, "/") + "/"
WINLU_DIR = ROOT_DIR + "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/"
_FLOOR_TABLE = [
    [[2,4],[1,4],[2,3],[1,3]],[[2,0],[1,4],[2,3],[1,3]],[[2,4],[3,0],[2,3],[1,3]],[[2,0],[3,0],[2,3],[1,3]],
    [[2,4],[1,4],[2,3],[3,1]],[[2,0],[1,4],[2,3],[3,1]],[[2,4],[3,0],[2,3],[3,1]],[[2,0],[3,0],[2,3],[3,1]],
    [[2,4],[1,4],[2,1],[1,3]],[[2,0],[1,4],[2,1],[1,3]],[[2,4],[3,0],[2,1],[1,3]],[[2,0],[3,0],[2,1],[1,3]],
    [[2,4],[1,4],[2,1],[3,1]],[[2,0],[1,4],[2,1],[3,1]],[[2,4],[3,0],[2,1],[3,1]],[[2,0],[3,0],[2,1],[3,1]],
    [[0,4],[1,4],[0,3],[1,3]],[[0,4],[3,0],[0,3],[1,3]],[[0,4],[1,4],[0,3],[3,1]],[[0,4],[3,0],[0,3],[3,1]],
    [[2,2],[1,2],[2,3],[1,3]],[[2,2],[1,2],[2,3],[3,1]],[[2,2],[1,2],[2,1],[1,3]],[[2,2],[1,2],[2,1],[3,1]],
    [[2,4],[3,4],[2,3],[3,3]],[[2,4],[3,4],[2,1],[3,3]],[[2,0],[3,4],[2,3],[3,3]],[[2,0],[3,4],[2,1],[3,3]],
    [[2,4],[1,4],[2,5],[1,5]],[[2,0],[1,4],[2,5],[1,5]],[[2,4],[3,0],[2,5],[1,5]],[[2,0],[3,0],[2,5],[1,5]],
    [[0,4],[3,4],[0,3],[3,3]],[[2,2],[1,2],[2,5],[1,5]],[[0,2],[1,2],[0,3],[1,3]],[[0,2],[1,2],[0,3],[3,1]],
    [[2,2],[3,2],[2,3],[3,3]],[[2,2],[3,2],[2,1],[3,3]],[[2,4],[3,4],[2,5],[3,5]],[[2,0],[3,4],[2,5],[3,5]],
    [[0,4],[1,4],[0,5],[1,5]],[[0,4],[3,0],[0,5],[1,5]],[[0,2],[3,2],[0,3],[3,3]],[[0,2],[1,2],[0,5],[1,5]],
    [[0,4],[3,4],[0,5],[3,5]],[[2,2],[3,2],[2,5],[3,5]],[[0,2],[3,2],[0,5],[3,5]],[[0,0],[1,0],[2,0],[3,0]]]
_WALL_TABLE = [
    [[2,2],[1,2],[2,1],[1,1]],[[0,2],[1,2],[0,1],[1,1]],[[2,0],[1,0],[2,1],[1,1]],[[0,0],[1,0],[0,1],[1,1]],
    [[2,2],[3,2],[2,1],[3,1]],[[0,2],[3,2],[0,1],[3,1]],[[2,0],[3,0],[2,1],[3,1]],[[0,0],[3,0],[0,1],[3,1]],
    [[2,2],[1,2],[2,3],[1,3]],[[0,2],[1,2],[0,3],[1,3]],[[2,0],[1,0],[2,3],[1,3]],[[0,0],[1,0],[0,3],[1,3]],
    [[2,2],[3,2],[2,3],[3,3]],[[0,2],[3,2],[0,3],[3,3]],[[2,0],[3,0],[2,3],[3,3]],[[0,0],[3,0],[0,3],[3,3]]]

_IMG_CACHE = {}
def _img(path):
    if path not in _IMG_CACHE:
        from PIL import Image
        _IMG_CACHE[path] = Image.open(path).convert("RGBA") if os.path.exists(path) else None
    return _IMG_CACHE[path]

def tileset_images(tileset_id=8):
    ts = json.load(open(ROOT_DIR + "data/Tilesets.json", encoding="utf-8"))[tileset_id]
    return [(_img(ROOT_DIR + "img/tilesets/" + n + ".png") if n else None) for n in ts["tilesetNames"]], ts["flags"]

def character_image(name):
    for p in (ROOT_DIR + "img/characters/" + name + ".png", WINLU_DIR + "characters/" + name + ".png",
              os.path.join(HERE, "props_upper", "out", name + ".png").replace(os.sep, "/")):
        im = _img(p)
        if im is not None: return im
    return None

def character_frame(name, index, direction, pattern):
    im = character_image(name)
    if im is None: return None
    big = name.startswith("$") or name.startswith("!$")
    pw, ph = (im.width // 3, im.height // 4) if big else (im.width // 12, im.height // 8)
    bx = 0 if big else (index % 4) * 3
    by = 0 if big else (index // 4) * 4
    sx = (bx + pattern) * pw
    sy = (by + (direction // 2 - 1)) * ph
    return im.crop((sx, sy, sx + pw, sy + ph))

def event_page_shown(e):
    """the page the game shows when no switch is on: the last page without conditions"""
    pg = None
    for p in e["pages"]:
        c = p["conditions"]
        if not any(c.get(k) for k in ("switch1Valid", "switch2Valid", "variableValid", "selfSwitchValid", "itemValid", "actorValid")):
            pg = p
    return pg

def render_offline(mapdata, out=None, region=None, scale=1, grid=False, flags=None, marks=None):
    """mapdata: a map dict (the staged JSON). region: (x0, y0, x1, y1) cells. marks: {(x, y): (r, g, b, a)} overlays.
    Returns the PIL image."""
    from PIL import Image, ImageDraw
    W, H = mapdata["width"], mapdata["height"]
    data = mapdata["data"]
    sheets, flags0 = tileset_images(mapdata["tilesetId"])
    flags = flags or flags0
    x0, y0, x1, y1 = region or (0, 0, W - 1, H - 1)
    T, h1 = 48, 24
    img = Image.new("RGBA", ((x1 - x0 + 1) * T, (y1 - y0 + 1) * T), (0, 0, 0, 255))
    upper = Image.new("RGBA", img.size, (0, 0, 0, 0))
    shade = Image.new("RGBA", (h1, h1), (0, 0, 0, 128))
    def rd(x, y, z):
        if 0 <= x < W and 0 <= y < H: return data[(z * H + y) * W + x]
        return 0
    def put(layer, tid, dx, dy):
        if tid <= 0: return
        if tid >= 2048:
            kind = (tid - 2048) // 48; shape = (tid - 2048) % 48
            tx, ty = kind % 8, kind // 8
            table = _FLOOR_TABLE
            if 16 <= kind < 48: sn, bx, by = 1, tx * 2, (ty - 2) * 3
            elif 48 <= kind < 80: sn, bx, by, table = 2, tx * 2, (ty - 6) * 2, _WALL_TABLE
            elif kind >= 80:
                sn, bx, by = 3, tx * 2, int((ty - 10) * 2.5 + (0.5 if ty % 2 == 1 else 0))
                if ty % 2 == 1: table = _WALL_TABLE
            else: return
            sh = sheets[sn]
            if sh is None: return
            q = table[shape] if shape < len(table) else table[0]
            for i in range(4):
                qsx, qsy = q[i]
                sx1, sy1 = (bx * 2 + qsx) * h1, (by * 2 + qsy) * h1
                layer.alpha_composite(sh.crop((sx1, sy1, sx1 + h1, sy1 + h1)), (dx + (i % 2) * h1, dy + (i // 2) * h1))
        else:
            if 1536 <= tid < 1664:
                sn = 4; t = tid - 1536; sx, sy = (t % 8) * T, (t // 8) * T
            else:
                sn = 5 + tid // 256
                sx = ((tid // 128) % 2 * 8 + tid % 8) * T; sy = ((tid % 256) // 8) % 16 * T
            sh = sheets[sn] if sn < len(sheets) else None
            if sh is None: return
            layer.alpha_composite(sh.crop((sx, sy, sx + T, sy + T)), (dx, dy))
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            dx, dy = (x - x0) * T, (y - y0) * T
            for z in (0, 1):
                t = rd(x, y, z)
                put(upper if (t and t < len(flags) and flags[t] & 0x10) else img, t, dx, dy)
            sb = rd(x, y, 4)
            for i in range(4):
                if sb & (1 << i): img.alpha_composite(shade, (dx + (i % 2) * h1, dy + (i // 2) * h1))
            for z in (2, 3):
                t = rd(x, y, z)
                put(upper if (t and t < len(flags) and flags[t] & 0x10) else img, t, dx, dy)
    chars = []
    for e in mapdata["events"]:
        if not e: continue
        pg = event_page_shown(e)
        if pg is None: continue
        if not (x0 - 3 <= e["x"] <= x1 + 3 and y0 - 3 <= e["y"] <= y1 + 4): continue
        chars.append((pg["priorityType"], e["y"], e["x"], pg["image"], e))
    chars.sort(key=lambda c: (c[0] * 2 + 1, c[1]))
    big = Image.new("RGBA", (img.width + 6 * T, img.height + 8 * T), (0, 0, 0, 0))
    OX, OY = 3 * T, 4 * T
    over = Image.new("RGBA", big.size, (0, 0, 0, 0))
    for (prio, ey, ex, im, e) in chars:
        tgt = over if prio == 2 else big
        if im.get("tileId"):
            layer = Image.new("RGBA", (T, T), (0, 0, 0, 0)); put(layer, im["tileId"], 0, 0)
            tgt.alpha_composite(layer, (OX + (ex - x0) * T, OY + (ey - y0) * T))
            continue
        if not im.get("characterName"): continue
        fr = character_frame(im["characterName"], im["characterIndex"], im["direction"], im["pattern"])
        if fr is None: continue
        obj = im["characterName"].startswith("!")
        px = OX + (ex - x0) * T + T // 2 - fr.width // 2
        py = OY + (ey - y0) * T + T - (0 if obj else 6) - fr.height
        tgt.alpha_composite(fr, (px, py))
    img.alpha_composite(big.crop((OX, OY, OX + img.width, OY + img.height)))
    img.alpha_composite(upper)
    img.alpha_composite(over.crop((OX, OY, OX + img.width, OY + img.height)))
    d = ImageDraw.Draw(img)
    if marks:
        for (mx, my), c in marks.items():
            if x0 <= mx <= x1 and y0 <= my <= y1:
                ov = Image.new("RGBA", (T, T), c)
                img.alpha_composite(ov, ((mx - x0) * T, (my - y0) * T))
    if grid:
        for x in range(x0, x1 + 2):
            d.line([((x - x0) * T, 0), ((x - x0) * T, img.height)], fill=(255, 255, 255, 50))
        for y in range(y0, y1 + 2):
            d.line([(0, (y - y0) * T), (img.width, (y - y0) * T)], fill=(255, 255, 255, 50))
    if scale != 1:
        img = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)
    if out: img.convert("RGB").save(out)
    return img


# ======================================================================================================== the map builder
from tavlib import TavernMap, B, C, D, E, A5, write_map, blank_page, FLAGS8, STAGING   # noqa: E402
PROPS_SHEET = "!Tavern_Props_Upper"          # my own props (48x96 frames), img/characters
PROPS_BIG = "!$Tavern_Props_Upper_Big"       # my own big props (144x192 frames)
DOORS_SHEET = "!Tavern_Props_Upper_Doors"    # numbered room doors (48x96 frames, 4 opening steps)

# lights: the shared tags of links.json "lighting" (the ground floor uses the same ones, so the floors match)
def _light_tags():
    try:
        with open(os.path.join(HERE, "links.json"), "rb") as f:
            return json.loads(f.read().decode("utf-8"))["lighting"]["tags"]
    except Exception:
        return {}
_LT = _light_tags()
L_CANDLE = _LT.get("candle", "<Light:110,120,80,30><LightWhen:night>")
L_CANDLES3 = _LT.get("candles3", "<Light:150,130,90,34><LightWhen:night>")
L_LANTERN = _LT.get("lantern", "<Light:210,90,62,24><LightWhen:night>")
L_SCONCE = _LT.get("sconce", "<Light:170,90,60,22><LightWhen:night>")
L_CANDELABRA = _LT.get("candelabra", "<Light:150,130,90,34><LightWhen:night>")
L_CHANDELIER = _LT.get("chandelier", "<Light:330,40,28,10><LightWhen:night>")
L_FIRE = _LT.get("fireplace", "<Light:330,120,60,16>")
L_FILL = _LT.get("fill", "<Light:300,14,10,4><LightWhen:night>")
L_FILL_WIDE = "<Light:420,14,10,4><LightWhen:night>"     # the same fill, wider: the upper floors' big rooms need fewer
L_WINDOW_DAY = _LT.get("window_day", "<LightCone:length=150,angle=30,dir=90,width=24,anchor=top,offsety=-10,blur=5,dust=8,dustsize=1,r=255,g=228,b=190,when=day>")

STAGED_FLAGS = os.path.join(HERE, "staging", "tileset8_flags.json")
def load_flags():
    """the ground floor's staged passage flags for tileset 8 (installed by its apply script), else today's"""
    if os.path.exists(STAGED_FLAGS):
        with open(STAGED_FLAGS, "rb") as f:
            return json.loads(f.read().decode("utf-8")), True
    return list(FLAGS8), False
FLAGS_UP, FLAGS_STAGED = load_flags()

def engine_blocks(data, W, H, x, y, flags=None):
    """what the game decides for cell (x, y): the topmost tile that is not a star decides (all four ways closed)"""
    flags = flags or FLAGS_UP
    for z in (3, 2, 1, 0):
        t = data[(z * H + y) * W + x]
        f = flags[t] if t < len(flags) else 0
        if t == 0: continue
        if f & 0x10: continue
        return (f & 0xF) == 0xF
    return True
SE_DOOR = {"name": "Door1", "volume": 70, "pitch": 100, "pan": 0}
SE_LOCKED = {"name": "Key", "volume": 70, "pitch": 90, "pan": 0}
SE_STAIRS = {"name": "Move1", "volume": 70, "pitch": 100, "pan": 0}

def cmd(code, params, indent=0):
    return {"code": code, "indent": indent, "parameters": params}

def comment(text):
    lines = text.split("\n")
    return [cmd(108, [lines[0]])] + [cmd(408, [l]) for l in lines[1:]]

def show_text(line):
    return [cmd(101, ["", 0, 0, 2, ""]), cmd(401, [line])]

def move_route(target, moves, wait=True, indent=0):
    """Set Movement Route (205) + the editor's display lines (505). moves: [(code, [params])...]"""
    lst = [{"code": c, "indent": None, "parameters": p} for (c, p) in moves] + [{"code": 0, "parameters": []}]
    out = [cmd(205, [target, {"list": lst, "repeat": False, "skippable": True, "wait": wait}], indent)]
    for (c, p) in moves:
        out.append(cmd(505, [{"code": c, "indent": None, "parameters": p}], indent))
    return out

OPEN = [(36, []), (17, []), (15, [3]), (18, []), (15, [3]), (19, []), (35, [])]      # closed -> open (dirs 2 4 6 8)
CLOSE = [(36, []), (18, []), (15, [3]), (17, []), (15, [3]), (16, []), (35, [])]     # open -> closed
SHOW_OPEN = [(36, []), (19, []), (35, [])]

def page(priority=0, trigger=0, image=None, cmds=None, through=False, step=False, self_switch=None):
    pg = blank_page(priority=priority, trigger=trigger, image=image, through=through, cmds=cmds, step=step, direction_fix=True)
    if self_switch:
        pg["conditions"]["selfSwitchValid"] = True
        pg["conditions"]["selfSwitchCh"] = self_switch
    return pg


class UpperMap(TavernMap):
    """one upper floor. Keeps records of everything it places for the checks (occupied cells, surfaces and what
    stands on them, wall items per wall, doors, stairs, lights)."""
    keep_slots = 0

    def __init__(self, map_id, layout, display, note, seed, border=25):
        TavernMap.__init__(self, layout["W"], layout["H"], note, display=display, seed=seed)
        self.id = map_id
        self.L = layout
        self.spaces = {sp.key: sp for sp in layout["spaces"]}
        self.border = border
        self.occ = {}              # (x, y) -> piece name: solid furniture / wall pieces standing on floor cells
        self.pieces = []           # (name, room key, cells, solid cells)
        self.surfaces = {}         # (x, y) -> (x0, y0, x1, y1) px rect of a table top in that cell
        self.on_top = []           # (x, y, what, (bx0, by0, bx1, by1) px)
        self.wall_items = []       # (wall key, kind, x, row)
        self.clear = set()         # cells that must stay free (door approaches, stairs, walkways)
        self.doors = []            # dicts for links.json / checks
        self.tags = []             # TavernLife tagged events: dicts
        self.floor_kind = {}       # space key -> A4 kind
        self.wall_kind = {}        # space key -> A3 kind
        self.room_of = {}          # (x, y) -> space key (floor cells)
        self.ev_index = {}         # name -> event id (1-based)
        self.landings = {}

    # ------------------------------------------------------------------ events with known ids
    def next_id(self):
        return len(self.events) + 1

    def add_event(self, x, y, name, pages, note=""):
        eid = self.next_id()
        self.events.append((x, y, {"name": name, "note": note, "pages": pages}))
        self.taken.add((x, y))
        return eid

    # ------------------------------------------------------------------ the shell
    def build_shell(self):
        spaces = self.L["spaces"]
        self.kind(0, self.all, self.border)
        floors = set()
        for sp in spaces:
            floors |= sp.cells()
        for sp in spaces:
            wk = self.wall_kind.get(sp.key)
            if sp.face and wk:
                face = {(x, y) for y in range(sp.y0 - sp.face, sp.y0) for x in range(sp.x0, sp.x1 + 1)} - floors
                self.kind(0, face, wk)
        for sp in spaces:
            self.kind(0, sp.cells(), self.floor_kind[sp.key])
            for c in sp.cells(): self.room_of[c] = sp.key
        self.border_kinds = {self.border}

    def face_rows(self, sp):
        return (sp.y0 - sp.face, sp.y0 - 1)

    def floor_at(self, x, y, kind):
        self.kind(0, {(x, y)}, kind)

    def mat(self, x, y, kind=37):
        self.kind(1, {(x, y)}, kind)

    # ------------------------------------------------------------------ doors
    def door_front(self, sp, corridor, dx, pic, number=None, lock=None, lock_msg=None, name=None):
        """a room NORTH of a corridor: the door picture stands on the bottom row of the corridor's wall face; inside,
        the gap in the room's south wall (with a mat) leads back out. pic = (sheet, index, pattern)."""
        fb = sp.y1 + 4                      # the corridor face's bottom row
        inside = (dx, sp.y1)
        outside = (dx, fb + 1)
        gap = (dx, sp.y1 + 1)
        self.floor_at(gap[0], gap[1], self.floor_kind[sp.key])
        self.mat(gap[0], gap[1])
        label = name or sp.label
        door_id = self.next_id()
        exit_id = door_id + 1
        img = {"characterName": pic[0], "characterIndex": pic[1], "direction": 2, "pattern": pic[2]}
        go_in = [cmd(250, [SE_DOOR])] + move_route(0, OPEN, True) + \
                [cmd(201, [0, self.id, inside[0], inside[1], 8, 0])] + move_route(0, CLOSE, False)
        pages = []
        tag = []
        if lock:
            tag = comment("<Tavern:door room=%s>" % lock)
            msg = lock_msg or "Zamknięte. Pokój można wynająć u Borgara."
            pages.append(page(1, 1, img, tag + [cmd(250, [SE_LOCKED])] + show_text(msg)))
            pages.append(page(1, 1, img, tag + go_in, self_switch="A"))
        else:
            pages.append(page(1, 1, img, go_in))
        self.add_event(dx, fb, "Drzwi -> " + label, pages)
        # the way out: stepping into the gap takes him out in front of the door, which shows open and closes
        out_cmds = [cmd(250, [SE_DOOR])] + move_route(door_id, SHOW_OPEN, False) + \
                   [cmd(201, [0, self.id, outside[0], outside[1], 2, 0])] + move_route(door_id, [(15, [8])] + CLOSE, False)
        self.add_event(gap[0], gap[1], "Wyjście z pokoju: " + label, [page(0, 1, None, out_cmds)])
        self.clear |= {inside, outside, (dx, sp.y1 - 1)}
        self.wall_items.append((corridor, "door", dx, fb))
        rec = {"room": sp.key, "label": label, "door_event": door_id, "door_xy": [dx, fb], "exit_event": exit_id,
               "exit_xy": list(gap), "inside": list(inside), "outside": list(outside), "lock": lock}
        self.doors.append(rec)
        if lock:
            self.tags.append({"kind": "door", "room": lock, "event": door_id, "x": dx, "y": fb, "label": label,
                              "inside": list(inside), "outside": list(outside), "unlock": "self switch A"})
        return rec

    def door_gap(self, sp, corridor, dx, pic, lock=None, lock_msg=None, name=None):
        """a room SOUTH of a corridor: a gap in the corridor's border line takes him in; inside, the door picture on
        the room's own wall face takes him back (the door opens, and it closes behind him when he comes in)."""
        gy = sp.y0 - sp.face - 1            # the corridor's south border row
        fb = sp.y0 - 1                      # the room's face bottom row
        inside = (dx, sp.y0)
        outside = (dx, gy - 1)
        self.floor_at(dx, gy, self.floor_kind[sp.key])
        self.mat(dx, gy)
        label = name or sp.label
        gap_id = self.next_id()
        door_id = gap_id + 1
        go_in = [cmd(250, [SE_DOOR])] + move_route(door_id, SHOW_OPEN, False) + \
                [cmd(201, [0, self.id, inside[0], inside[1], 2, 0])] + move_route(door_id, [(15, [8])] + CLOSE, False)
        pages = []
        if lock:
            tag = comment("<Tavern:door room=%s>" % lock)
            msg = lock_msg or "Zamknięte. Pokój można wynająć u Borgara."
            pages.append(page(1, 1, None, tag + [cmd(250, [SE_LOCKED])] + show_text(msg)))
            pages.append(page(0, 1, None, tag + go_in, self_switch="A"))
        else:
            pages.append(page(0, 1, None, go_in))
        self.add_event(dx, gy, "Wejście -> " + label, pages)
        img = {"characterName": pic[0], "characterIndex": pic[1], "direction": 2, "pattern": pic[2]}
        go_out = [cmd(250, [SE_DOOR])] + move_route(0, OPEN, True) + \
                 [cmd(201, [0, self.id, outside[0], outside[1], 8, 0])] + move_route(0, CLOSE, False)
        self.add_event(dx, fb, "Drzwi (wyjście): " + label, [page(1, 1, img, go_out)])
        self.clear |= {inside, outside, (dx, sp.y0 + 1)}
        self.wall_items.append((sp.key, "door", dx, fb))
        rec = {"room": sp.key, "label": label, "door_event": door_id, "door_xy": [dx, fb], "exit_event": gap_id,
               "exit_xy": [dx, gy], "inside": list(inside), "outside": list(outside), "lock": lock}
        self.doors.append(rec)
        if lock:
            self.tags.append({"kind": "door", "room": lock, "event": gap_id, "x": dx, "y": gy, "label": label,
                              "inside": list(inside), "outside": list(outside), "unlock": "self switch A"})
        return rec

    def arch(self, x0, x1, y0, y1, kind):
        """an opening cut through border and wall face rows (floor kind `kind`)"""
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                self.floor_at(x, y, kind)

    # ------------------------------------------------------------------ bookkeeping of furniture
    def occupy(self, cells, name, room=None, solid=True):
        cells = [tuple(c) for c in cells]
        for c in cells:
            if c in self.occ and solid:
                raise ValueError("%s overlaps %s at %s" % (name, self.occ[c], c))
        if solid:
            for c in cells:
                self.occ[c] = name
                self.solid.add(c)
        self.pieces.append((name, room, cells, cells if solid else []))

    def tile_piece(self, name, room, tiles, solid, z=2):
        """tiles: [(x, y, sheet, col, row)]; solid: cells the piece stands on (blocking)"""
        for (x, y, s, c, r) in tiles:
            self.t(s, c, r, x, y, z)
        self.occupy(solid, name, room)

    def surface(self, cells_rects):
        for (x, y), rect in cells_rects.items():
            self.surfaces[(x, y)] = rect

    def item(self, x, y, s, c, r, what="drobiazg"):
        """a small thing (a D tile) standing on a table top (layer 3); recorded for the 'nothing on an edge' check"""
        self.t(s, c, r, x, y, z=3)
        self.on_top.append((x, y, what, ITEM_BBOX.get((s, c, r))))

    def pic_event(self, x, y, char, idx, direction, pattern, name, priority=1, solid=False, step=False, note="",
                  through=None, trigger=0, cmds=None):
        img = {"characterName": char, "characterIndex": idx, "direction": direction, "pattern": pattern}
        thr = (not solid) if through is None else through
        eid = self.add_event(x, y, name, [page(priority, trigger, img, cmds, through=thr, step=step)], note)
        if solid and priority == 1:
            self.blocked.add((x, y))
        return eid

    def light_at(self, x, y, tag, name="swiatlo"):
        return self.add_event(x, y, name, [page(0, 0, None, None)], tag)


# ------------------------------------------------------------------------------------------------ item bboxes (D items)
def _item_bboxes():
    """opaque (alpha 255) pixel boxes of the D sheet's small things, per cell: the base of a thing = its box's bottom"""
    from PIL import Image
    im = Image.open(WINLU_DIR + "tilesets/Fantasy_Inside_D.png").convert("RGBA")
    out = {}
    for r in range(16):
        for c in range(16):
            t = im.crop((c * 48, r * 48, c * 48 + 48, r * 48 + 48))
            a = t.getchannel("A").point(lambda v: 255 if v == 255 else 0)
            out[("D", c, r)] = a.getbbox()
    return out
ITEM_BBOX = _item_bboxes()

# table tops: the px rectangle (x0, y0, x1, y1) of the top board inside the cell where things may stand
TOPS = {
    ("C", 4, 0): (9, 26, 38, 47),      # round table on a pedestal (1x2), its top cell
    ("C", 5, 0): (4, 21, 43, 37),      # bedside table with a drawer (1x2)
    ("C", 6, 0): (3, 26, 44, 42),      # small desk (1x2)
    ("C", 5, 2): (3, 20, 44, 38),      # small table (1x2)
    ("C", 9, 4): (4, 27, 48, 48), ("C", 10, 4): (0, 27, 48, 48), ("C", 11, 4): (0, 27, 44, 48),   # long table, back row
    ("C", 12, 4): (6, 25, 48, 48), ("C", 13, 4): (0, 25, 42, 48),                                  # square table, back row
    ("C", 14, 8): (4, 22, 48, 48), ("C", 15, 8): (0, 22, 44, 48),                                  # table with turned legs
    ("C", 12, 8): (4, 22, 48, 48), ("C", 13, 8): (0, 22, 44, 48),                                  # table with drawers
    ("C", 8, 4): (4, 12, 44, 48), ("C", 8, 5): (4, 0, 44, 48),                                     # the long table running down
}


# ======================================================================================================== furniture kit
# Every function places tiles/events AND records what it occupies (UpperMap.occupy / surface / wall_items), so the
# checks can prove the rules: nothing overlaps, nothing on a table's edge, wall items in line, doors and paths free.
# Coordinates: sp = the Space; y0 = its first floor row; yb = y0 - 1 = the bottom row of its wall face.
BED = {   # kind -> (col, row of the top-left tile, width); 3 rows: headboard (on yb), pillow (y0), foot (y0+1)
    "green": (12, 10, 1), "green2": (13, 10, 2), "patch": (15, 10, 1), "straw": (9, 13, 1),
    "red": (13, 13, 1), "red2": (14, 13, 2), "royal": (11, 13, 2),
}
CURTAIN = {"red": 0, "white": 1, "orange": 2, "violet": 3, "black": 4, "green": 5, "beige": 6}
WINDOW = {"night": (0, 2), "lit": (1, 2), "arch": (4, 2), "arch_lit": (5, 2), "gothic": (0, 4), "small_arch": (6, 4)}

def window(mp, wall, x, sp, curtain=None, kind="night"):
    """a 1x2 window in the upper two rows of the wall face above sp's floor, curtains over it (layer 3)"""
    c, r = WINDOW[kind]
    top = sp.y0 - 3
    mp.t("B", c, r, x, top); mp.t("B", c, r + 1, x, top + 1)
    if curtain is not None:
        mp.t("B", curtain, 12, x, top, z=3); mp.t("B", curtain, 13, x, top + 1, z=3)
    mp.wall_items.append((wall, "window", x, top))
    mp.light_at(x, top, L_WINDOW_DAY, "okno (światło dnia)")

def wall_tile(mp, wall, x, y, s, c, r, kind="decor", z=2):
    mp.t(s, c, r, x, y, z)
    mp.wall_items.append((wall, kind, x, y))

PAINTINGS = [   # (idx, dir, pattern) of !Decoration_static, small framed pictures: they hang in the face's middle
    (7, 6, 0), (7, 6, 1), (7, 4, 1), (7, 4, 2), (6, 6, 2), (7, 6, 2), (7, 8, 1), (6, 8, 2), (7, 8, 2), (6, 4, 2)]
BIG_PAINTINGS = [(6, 8, 1), (7, 8, 0), (7, 4, 0)]    # 1x2 pictures (the river valley, two dark ones)

def painting(mp, wall, x, sp, which, name="Obraz"):
    """a framed picture on the wall face: the event stands on the face's bottom row, the picture hangs in its middle"""
    idx, d, p = which
    mp.pic_event(x, sp.y0 - 1, "!Decoration_static", idx, d, p, name, priority=1, through=True)
    mp.wall_items.append((wall, "painting", x, sp.y0 - 2))

def lantern_over(mp, wall, x, sp, light=L_LANTERN, name="Latarnia"):
    """a lantern hanging from an iron bracket high on the wall face (above a door): event on the face's middle row,
    the light on the same event"""
    mp.pic_event(x, sp.y0 - 2, "!Decoration", 7, 2, 0, name, priority=1, through=True, step=True, note=light)
    mp.wall_items.append((wall, "lantern", x, sp.y0 - 3))

def sconce(mp, wall, x, sp, light=L_SCONCE, name="Kinkiet"):
    mp.pic_event(x, sp.y0 - 2, "!Decoration2", 0, 2, 0, name, priority=1, through=True, step=True, note=light)
    mp.wall_items.append((wall, "sconce", x, sp.y0 - 3))

# ---------------------------------------------------------------- against the back wall (they stand on row y0)
def bed(mp, room, x, y0, kind, name="Łóżko"):
    c, r, w = BED[kind]
    for dx in range(w):
        for dy in range(3):
            mp.t("C", c + dx, r + dy, x + dx, y0 - 1 + dy)
    mp.occupy([(x + dx, y0 + dy) for dx in range(w) for dy in range(2)], name, room)
    return (x, y0)

def nightstand(mp, room, x, y0, name="Stolik nocny"):
    mp.t("C", 5, 0, x, y0 - 1); mp.t("C", 5, 1, x, y0)
    mp.occupy([(x, y0)], name, room)
    mp.surface({(x, y0 - 1): TOPS[("C", 5, 0)]})

def wardrobe(mp, room, x, y0, kind="plain", name="Szafa"):
    if kind == "plain":            # plank doors, iron handles (1x2)
        mp.t("C", 5, 11, x, y0 - 1); mp.t("C", 5, 12, x, y0)
        mp.occupy([(x, y0)], name, room)
    elif kind == "cabinet":        # cupboard with doors (1x2)
        mp.t("C", 6, 9, x, y0 - 1); mp.t("C", 6, 10, x, y0)
        mp.occupy([(x, y0)], name, room)
    elif kind == "ornate":         # carved wardrobe (2x3)
        for dx in range(2):
            for dy in range(3): mp.t("C", 6 + dx, 10 + dy, x + dx, y0 - 2 + dy)
        mp.occupy([(x, y0), (x + 1, y0)], name, room)
    elif kind == "dresser":        # low chest of drawers (2x1 on the floor row)
        mp.t("C", 3, 11, x, y0); mp.t("C", 4, 11, x + 1, y0)
        mp.occupy([(x, y0), (x + 1, y0)], name, room)

def shelf(mp, room, x, y0, kind="books", name="Regał"):
    col = {"books": 3, "glass": 5, "jars": 7, "open": 2}[kind]
    if kind == "books":
        mp.t("C", 3, 0, x, y0 - 1); mp.t("C", 3, 1, x, y0)
    else:
        mp.t("C", col, 9, x, y0 - 1); mp.t("C", col, 10, x, y0)
    mp.occupy([(x, y0)], name, room)

def tall_bookcase(mp, room, x, y0, w=2, name="Regał z książkami"):
    """the tall library bookcase (C 0..4, 6..8): top row on the face's middle row"""
    cols = [0, 1] if w == 2 else [2]
    for i, c in enumerate(cols):
        for dy in range(3): mp.t("C", c, 6 + dy, x + i, y0 - 2 + dy)
    mp.occupy([(x + i, y0) for i in range(len(cols))], name, room)

def vanity(mp, room, x, y0, name="Toaletka"):
    mp.t("C", 8, 13, x, y0 - 2); mp.t("C", 8, 14, x, y0 - 1); mp.t("C", 8, 15, x, y0)
    mp.occupy([(x, y0)], name, room)

def plant(mp, room, x, y, kind="big", name="Roślina"):
    """plants (D sheet). big: a leafy plant growing out of a big clay jar (the jar D 3,6..7, the leaves D 4,6 over
    its mouth); flower / bush: one-cell pots with their shadow (D 5,7 / 6,7); vase: blue flowers in a dark vase
    (D 7,8, its shadow D 7,9 on the cell below). The thing stands on (x, y)."""
    if kind == "big":
        mp.t("D", 3, 6, x, y - 1, z=2 if (x, y - 1) not in mp.occ else 3); mp.t("D", 3, 7, x, y)
        mp.t("D", 4, 6, x, y - 1, z=3)
    elif kind in ("flower", "bush"):
        mp.t("D", 5 if kind == "flower" else 6, 7, x, y)
    elif kind == "vase":
        mp.t("D", 7, 8, x, y - 1, z=3 if (x, y - 1) in mp.occ else 2); mp.t("D", 7, 9, x, y)
    mp.occupy([(x, y)], name, room)

def fireplace(mp, room, x, sp, kind=1, name="Kominek", light=L_FIRE):
    """a lit fireplace against the wall (!$Fireplace1 stone arch / 2 chimney breast / 4 marble): the event stands on
    the first floor row (its hearth; the pictures are drawn so they rise from there up the wall face), it closes that
    cell, the fire's light on the same event"""
    eid = mp.pic_event(x, sp.y0, "!$Fireplace%d" % kind, 0, 4, 0, name, priority=1, solid=True, step=True, note=light)
    mp.wall_items.append((room, "fireplace", x, sp.y0 - 1))
    return eid

# ---------------------------------------------------------------- in the room
def round_table(mp, room, x, y, name="Stolik"):
    """a round table on one leg (C 4,0..1): the top on (x, y), the leg on (x, y+1); both cells closed"""
    mp.t("C", 4, 0, x, y); mp.t("C", 4, 1, x, y + 1)
    mp.occupy([(x, y), (x, y + 1)], name, room)
    mp.surface({(x, y): TOPS[("C", 4, 0)]})

def desk(mp, room, x, y, name="Biurko"):
    mp.t("C", 6, 0, x, y); mp.t("C", 6, 1, x, y + 1)
    mp.occupy([(x, y), (x, y + 1)], name, room)
    mp.surface({(x, y): TOPS[("C", 6, 0)]})

def long_table(mp, room, x, y, length, style=4, name="Stół"):
    """a table running across (C 9..11, style..style+1): its top row y (where things stand), its front row y+1"""
    for i in range(length):
        col = 9 if i == 0 else 11 if i == length - 1 else 10
        mp.t("C", col, style, x + i, y); mp.t("C", col, style + 1, x + i, y + 1)
        mp.surface({(x + i, y): TOPS.get(("C", col, 4), (0, 27, 48, 48))})
    mp.occupy([(x + i, y + j) for i in range(length) for j in range(2)], name, room)

def square_table(mp, room, x, y, kind="plain", name="Stół"):
    c, r = {"plain": (12, 4), "turned": (14, 8), "drawers": (12, 8)}[kind]
    for dx in range(2):
        for dy in range(2): mp.t("C", c + dx, r + dy, x + dx, y + dy)
    mp.occupy([(x + dx, y + dy) for dx in range(2) for dy in range(2)], name, room)
    mp.surface({(x, y): TOPS[("C", c, r)], (x + 1, y): TOPS[("C", c + 1, r)]})

def chair(mp, room, x, y, facing, arm=False, name="Krzesło"):
    """a chair on (x, y); its back reaches into the cell above (layer 3). facing 2 down, 8 up, 4 left, 6 right"""
    r0 = 2 if arm else 0
    if facing == 2: mp.t("C", 8, r0, x, y - 1, z=3); mp.t("C", 8, r0 + 1, x, y)
    elif facing == 8: mp.t("C", 9, r0 + 1, x, y)
    elif facing == 4: mp.t("C", 10, r0, x, y - 1, z=3); mp.t("C", 10, r0 + 1, x, y)
    elif facing == 6: mp.t("C", 11, r0, x, y - 1, z=3); mp.t("C", 11, r0 + 1, x, y)
    mp.occupy([(x, y)], name if not arm else "Fotel", room)

def stool(mp, room, x, y, name="Taboret"):
    mp.t("C", 14, 0, x, y)
    mp.occupy([(x, y)], name, room)

def bench_h(mp, room, x, y, name="Ława"):
    mp.t("C", 14, 1, x, y); mp.t("C", 15, 1, x + 1, y)
    mp.occupy([(x, y), (x + 1, y)], name, room)

def settee(mp, room, x, y, name="Ława tapicerowana"):
    """the upholstered bench (C 0..1, 14..15): its seat on row y"""
    mp.t("C", 0, 14, x, y - 1, z=3); mp.t("C", 1, 14, x + 1, y - 1, z=3)
    mp.t("C", 0, 15, x, y); mp.t("C", 1, 15, x + 1, y)
    mp.occupy([(x, y), (x + 1, y)], name, room)

def rug(mp, x0, y0, x1, y1, kind):
    mp.kind(1, mp.rect(x0, y0, x1, y1), kind)
    if not hasattr(mp, "rugs"): mp.rugs = []
    mp.rugs.append((x0, y0, x1, y1))

def round_rug(mp, room, x, y, kind="red"):
    """a 2x2 round rug (B sheet, layer 2): red ornate / brown / brown ornate"""
    c, r = {"red": (14, 12), "brown": (12, 14), "ornate": (14, 14)}[kind]
    for dx in range(2):
        for dy in range(2): mp.t("B", c + dx, r + dy, x + dx, y + dy)

def chest(mp, room, x, y, idx=6, name="Kufer"):
    """a chest (!Fantasy_chest: 0 iron-bound, 1 gilded, 3 gold ornate, 6 plain wood, 7 steel ornate)"""
    mp.pic_event(x, y, "!Fantasy_chest", idx, 2, 0, name, priority=1, solid=True)
    mp.occupy([(x, y)], name, room)

def prop(mp, room, x, y, frame, name, solid=True, cells=None, note="", step=False, priority=1):
    """one of my own props: frame = (sheet, index, direction, pattern)"""
    s, i, d, p = frame
    mp.pic_event(x, y, s, i, d, p, name, priority=priority, solid=solid, note=note, step=step)
    if solid:
        mp.occupy(cells or [(x, y)], name, room)

def candle_on(mp, x, y, kind="one", name="Świeca", light=None, rent_room=None):
    """a lit candle standing on a table top at (x, y) (my sheet: frames drawn so the candle's foot sits on the top).
    rent_room: the candle of a rentable room - unlit, TavernLife lights it while the room is rented (<Tavern:candle>)"""
    if rent_room is not None:
        eid = mp.add_event(x, y, "Świeca pokoju (%s)" % rent_room,
                           [page(1, 0, {"characterName": PROPS_SHEET, "characterIndex": 2, "direction": 4, "pattern": 0},
                                 comment("<Tavern:candle room=%s>" % rent_room), through=True)])
        mp.on_top.append((x, y, "candle_one", CANDLE_BASE["one"]))
        mp.tags.append({"kind": "candle", "room": rent_room, "event": eid, "x": x, "y": y})
        return eid
    d = {"one": 2, "three": 4, "silver": 6}[kind]
    light = light or (L_CANDLE if kind == "one" else L_CANDLES3)
    mp.pic_event(x, y, PROPS_SHEET, 0, d, 0, name, priority=1, through=True, step=True, note=light)
    mp.on_top.append((x, y, "candle_" + kind, CANDLE_BASE[kind]))

# where my candle frames put the candle's foot inside the cell it stands on (px box of its lowest pixels)
CANDLE_BASE = {"one": (19, 24, 29, 31), "three": (10, 30, 38, 38), "silver": (13, 30, 35, 38)}


# ======================================================================================================== guest rooms
# One furnisher for all 24 guest rooms. The rules (the user's "równo, schludnie"):
#   - the beds are centred on the back wall, a bedside table on each side (single: [stolik][łóżko][stolik], twin:
#     [łóżko][stolik][łóżko], double: [stolik][łoże 2][stolik], family: three beds or the double bed + two beds
#     along the side walls), windows above the beds (or above the bedside tables of a double bed);
#   - the rug is centred under the foot of the beds, the chest (or a bench) at the foot, on the rug;
#   - one free cell between the bed group and the wardrobe / washstand at the ends of the wall;
#   - the table with its chairs in the lower part, mirrored by the luggage or a desk on the other side; the column of
#     the door stays free from the door to the middle of the room;
#   - one candle per room, standing on a bedside table (its own light).
STYLE_BEDS = {"kremowy": ("red", "red2"), "zielony": ("green", "green2"), "niebieski": ("patch", "green2"),
              "bale": ("straw", "red2"), "bezowy": ("red", "red2"), "ciemny": ("green", "green2")}
NS_ITEMS = [("D", 7, 11), ("D", 6, 11), ("D", 3, 11), ("D", 2, 11)]      # a book, an open book, two mugs, a mug
# things narrow enough for the small round table's top (foot and sides checked by check_map)
TABLE_ITEMS = [("D", 3, 13), ("D", 0, 13), ("D", 6, 11), ("D", 3, 11), ("D", 4, 11), ("D", 0, 14), ("D", 2, 13), ("D", 3, 14)]

def luggage(mp, room, x, y, which=0):
    prop(mp, room, x, y, (PROPS_SHEET, 1, 4, which), ["Kufer podróżny", "Torba podróżna"][which])

def washstand(mp, room, x, y0):
    """the washstand with a jug and a basin (my prop) against the back wall"""
    prop(mp, room, x, y0, (PROPS_SHEET, 1, 2, 2), "Umywalka")

def table_group(mp, room, tx, ty, chairs=(True, True), arm=False):
    """a round table (top on ty, leg on ty+1) with a chair on each side of its leg row"""
    round_table(mp, room, tx, ty)
    if chairs[0]: chair(mp, room, tx - 1, ty + 1, 6, arm=arm)
    if chairs[1]: chair(mp, room, tx + 1, ty + 1, 4, arm=arm)

def furnish_guest(mp, sp, variant=0):
    st = STYLES[sp.style]
    single_kind, double_kind = STYLE_BEDS[sp.style]
    if sp.rent and sp.rent[0] == "1": single_kind = "straw"         # the cheap room: a straw mattress
    x0, x1, y0, y1 = sp.x0, sp.x1, sp.y0, sp.y1
    w, h = sp.w, sp.h
    room = sp.key
    kind, dx = sp.door[0], sp.door[1]
    top_entry = kind == "gap"
    even = w % 2 == 0
    c = (x0 + x1) // 2                      # the middle column (the left one of the two middles when even)
    beds, stands, windows = [], [], []
    # ---------------------------------------------------------------- the bed group on the back wall
    if sp.size == "single" or (sp.size == "double" and not even) or (sp.size == "family" and not even):
        if sp.size == "single":
            beds = [(c, single_kind)]; stands = [c - 1, c + 1]; windows = [c]
        elif sp.size == "double":
            beds = [(c - 1, single_kind), (c + 1, single_kind)]; stands = [c]; windows = [c - 1, c + 1]
        else:
            beds = [(c - 2, single_kind), (c, single_kind), (c + 2, single_kind)]; stands = [c - 1, c + 1]
            windows = [c - 2, c + 2]
    else:                                   # an even room: the double bed exactly in the middle
        beds = [(c, double_kind)]; stands = [c - 1, c + 2]; windows = [c - 1, c + 2]
    span_l = min([b[0] for b in beds] + stands)
    span_r = max([b[0] + BED[b[1]][2] - 1 for b in beds] + stands)
    pillow = None
    for (bx, bk) in beds:
        p = bed(mp, room, bx, y0, bk)
        if pillow is None or (sp.size != "single" and BED[bk][2] == 2): pillow = p
    for i, sx in enumerate(stands):
        nightstand(mp, room, sx, y0)
        if i == 0:
            candle_on(mp, sx, y0 - 1, "one", name="Świeca", rent_room=sp.rent[0] if sp.rent else None)
        else:
            it = NS_ITEMS[(sp.number or 0) % len(NS_ITEMS)]
            mp.item(sx, y0 - 1, *it, what="na stoliku nocnym")
    for wx in windows:
        window(mp, room, wx, sp, curtain=st["curtain"])
    if sp.size == "family" and not even:
        painting(mp, room, c, sp, PAINTINGS[(sp.number or 0) % len(PAINTINGS)])
    # ---------------------------------------------------------------- the ends of the back wall
    door_cols = {dx} if top_entry else set()
    left = [x for x in range(x0, span_l - 1) if x not in door_cols and x - 1 not in door_cols and x + 1 not in door_cols]
    right = [x for x in range(span_r + 2, x1 + 1) if x not in door_cols and x - 1 not in door_cols and x + 1 not in door_cols]
    if top_entry and dx <= c: left = []     # the door's side of the wall stays clear
    if top_entry and dx > c: right = []
    big = sp.size != "single" and w >= 10
    n = sp.number or 0
    used_top = set()
    if left:
        if big and len(left) >= 2 and left[0] + 1 in left:
            wardrobe(mp, room, left[0], y0, "ornate"); used_top |= {left[0], left[0] + 1}
        else:
            [lambda: shelf(mp, room, left[0], y0, "books"), lambda: wardrobe(mp, room, left[0], y0, "plain"),
             lambda: wardrobe(mp, room, left[0], y0, "cabinet")][n % 3]()
            used_top.add(left[0])
    if right:
        if sp.size == "family" and even and len(right) >= 3:
            fireplace(mp, room, right[-2], sp, kind=1, name="Kominek"); used_top.add(right[-2])
            firewood(mp, room, right[-1], y0); used_top.add(right[-1])
        elif sp.size == "double" and n % 2 == 0:
            vanity(mp, room, right[-1], y0); used_top.add(right[-1])
        else:
            washstand(mp, room, right[-1], y0); used_top.add(right[-1])
        if len(right) >= 3 and sp.size != "single" and not (sp.size == "family" and even):
            px = right[-3] if right[-3] > span_r + 1 else right[-2]
            plant(mp, room, px, y0, "vase"); used_top.add(px)
    # pictures in the wall's free stretches, mirrored: one left of the bed group, one right of it
    if w >= 9:
        cand_l = [x for x in range(x0 + 1, span_l - 1) if x not in used_top and x not in door_cols and x not in windows]
        cand_r = [x for x in range(span_r + 2, x1) if x not in used_top and x not in door_cols and x not in windows]
        if cand_l and cand_r and not top_entry:
            painting(mp, room, cand_l[-1], sp, PAINTINGS[n % len(PAINTINGS)])
            painting(mp, room, cand_r[0], sp, PAINTINGS[(n + 3) % len(PAINTINGS)])
    # ---------------------------------------------------------------- the rug, the chest / bench at the foot
    rx0, rx1 = span_l, span_r
    ry0, ry1 = y0 + 2, min(y0 + 4, y1 - 2)
    rug(mp, rx0, ry0, rx1, ry1, st["rug"])
    if beds[0][1] in ("green2", "red2", "royal") and len(beds) == 1:
        bench_h(mp, room, beds[0][0], y0 + 2, name="Ława w nogach łóżka")
    elif len(beds) == 1:
        luggage(mp, room, c, y0 + 2, 0)                           # the travelling chest at the foot of the bed
    else:                                                        # several beds: a chest at the foot of the outer ones
        luggage(mp, room, beds[0][0], y0 + 2, 0)
        luggage(mp, room, beds[-1][0], y0 + 2, 1)
    # ---------------------------------------------------------------- side beds of an even family room: 2x1 beds
    # lying along the side walls (pillow at the wall), their posts reach into the row above (layer 3)
    if sp.size == "family" and even:
        yb = y0 + 3
        mp.t("C", 8, 11, x0, yb); mp.t("C", 9, 11, x0 + 1, yb)
        mp.t("C", 10, 11, x1 - 1, yb); mp.t("C", 11, 11, x1, yb)
        mp.t("C", 8, 10, x0, yb - 1, z=3); mp.t("C", 9, 10, x0 + 1, yb - 1, z=3)
        mp.t("C", 10, 10, x1 - 1, yb - 1, z=3); mp.t("C", 11, 10, x1, yb - 1, z=3)
        mp.occupy([(x0, yb), (x0 + 1, yb)], "Łóżko dziecięce", room)
        mp.occupy([(x1 - 1, yb), (x1, yb)], "Łóżko dziecięce", room)
    # ---------------------------------------------------------------- the lower part: table and chairs, luggage
    ty = y1 - 2
    walk = {dx}
    if h >= 9 and even and w >= 10:
        # a deep room: the family / dinner table in the middle of the lower part, four chairs round it, the luggage
        # in one lower corner and a plant in the other (mirrored)
        tx, tyy = c, y1 - 3
        square_table(mp, room, tx, tyy, "plain")
        mp.item(tx, tyy, *TABLE_ITEMS[(sp.number or 0) % len(TABLE_ITEMS)], what="na stole")
        mp.item(tx + 1, tyy, *TABLE_ITEMS[((sp.number or 0) + 3) % len(TABLE_ITEMS)], what="na stole")
        chair(mp, room, tx - 1, tyy + 1, 6); chair(mp, room, tx + 2, tyy + 1, 4)
        chair(mp, room, tx, tyy + 2, 8); chair(mp, room, tx + 1, tyy + 2, 8)
        lx, px = (x1 - 1, x0 + 1) if (not top_entry or dx < c) else (x0 + 1, x1 - 1)
        luggage(mp, room, lx, y1 - 1, 0)
        plant(mp, room, px, y1 - 1, "big")
        return pillow
    if w >= 11:
        tl, tr = x0 + 2, x1 - 2
        if sp.size == "family" and even: tl, tr = x0 + 3, x1 - 3
        table_group(mp, room, tl, ty)
        if tr not in walk and tr - 1 not in walk and tr + 1 not in walk:
            desk(mp, room, tr, ty, name="Pulpit do pisania")
            mp.item(tr, ty, "D", 2, 13, what="papier i kałamarz")
            chair(mp, room, tr, ty + 2, 8) if ty + 2 <= y1 and not top_entry else None
    else:
        tl = x0 + 1
        table_group(mp, room, tl, ty, chairs=(False, True))
        tr = x1 - 1
        if tr not in walk and (tr, ty + 1) not in mp.occ:
            k = (sp.number or 0) % 3
            if k == 0: luggage(mp, room, tr, ty + 1, 1)
            elif k == 1: plant(mp, room, tr, ty + 1, "big")
            else: chest(mp, room, tr, ty + 1, 0)
    it = TABLE_ITEMS[(sp.number or 0) % len(TABLE_ITEMS)]
    mp.item(tl, ty, *it, what="na stoliku")
    return pillow


# ======================================================================================================== corridors
def bay_spots2(a, b):
    """evenly spaced spots in a stretch of wall a..b: odd - the middle (and two more a quarter away when long), even -
    a symmetric pair; nothing in stretches shorter than 3"""
    n = b - a + 1
    if n < 3: return []
    if n % 2 == 1:
        c = (a + b) // 2
        if n >= 15:
            k = (n + 1) // 4
            return [c - k, c, c + k]
        return [c]
    c2 = a + b                                 # twice the middle
    if n >= 12: return [(c2 - 5) // 2, (c2 + 5) // 2]
    if n >= 6: return [(c2 - 3) // 2, (c2 + 3) // 2]
    return []

VASE_BASE = (16, 20, 32, 31)          # my vase-on-a-console frames put the vase's foot at cell y 31

def dress_corridor(mp, sp, openings, doors, pictures, windows=(), runner=36, lantern_light=L_LANTERN, consoles=True):
    """a corridor's wall face: a lantern above every door, pictures evenly in every stretch between the openings
    (windows at the stretches listed in `windows`), a runner down the middle of the floor"""
    for x in doors:
        lantern_over(mp, sp.key, x, sp, light=lantern_light)
    for (a, b) in openings:
        if b > a:                                          # an arch / a wide opening: its two ends bound the stretches
            mp.wall_items.append((sp.key, "arch", a, sp.y0 - 1)); mp.wall_items.append((sp.key, "arch", b, sp.y0 - 1))
    k = 0
    for (a, b) in bays(openings, sp.x0, sp.x1):
        for x in bay_spots2(a, b):
            if (a, b) in windows:
                window(mp, sp.key, x, sp, curtain=CURTAIN["red"], kind="night")
            else:
                painting(mp, sp.key, x, sp, pictures[k % len(pictures)])
                if consoles:
                    nightstand(mp, sp.key, x, sp.y0)
                    mp.pic_event(x, sp.y0 - 1, PROPS_SHEET, 0, 8, k % 2, "Wazon z kwiatami", priority=1, through=True)
                    mp.on_top.append((x, sp.y0 - 1, "wazon", VASE_BASE))
                k += 1
    if runner:
        rug(mp, sp.x0 + 1, sp.y0 + 1, sp.x1 - 1, sp.y0 + 2, runner)

def benches_along(mp, room, y, x0, x1, gaps):
    """benches (2 wide) against the wall opposite the doors: one in the middle of every even stretch between the
    gaps (doorways) at least 6 cells long, a potted flower in the middle of every odd one"""
    for (a, b) in bays([(g, g) for g in gaps], x0, x1):
        n = b - a + 1
        if n < 6: continue
        if n % 2 == 0:
            bench_h(mp, room, (a + b) // 2, y, name="Ławka")
        else:
            plant(mp, room, (a + b) // 2, y, "flower")

def bays(openings, x0, x1):
    out, cur = [], x0
    for (a, b) in sorted(openings):
        if a - 1 >= cur: out.append((cur, a - 1))
        cur = max(cur, b + 1)
    if cur <= x1: out.append((cur, x1))
    return out

def candelabra(mp, room, x, y, name="Kandelabr", light=L_CANDELABRA):
    """a standing candelabra (!Decoration2 idx 4, the brown/silver one), lit, on the floor"""
    mp.pic_event(x, y, "!Decoration2", 4, 6, 0, name, priority=1, solid=True, step=True, note=light)
    mp.occupy([(x, y)], name, room)

def clock(mp, room, x, y0, name="Zegar stojący"):
    mp.pic_event(x, y0, "!clock", 0, 2, 0, name, priority=1, solid=True, step=True)
    mp.occupy([(x, y0)], name, room)

def chandelier(mp, x, y, light=L_CHANDELIER, name="Żyrandol"):
    """an iron chandelier with candles hanging over (x, y-2..y), above everything; its light on the same event"""
    mp.pic_event(x, y, "!$Chandelier", 0, 4, 0, name, priority=2, through=True, step=True, note=light)

def column(mp, room, x, y, kind="wood", name="Kolumna"):
    """a free-standing column (B sheet cols 12 wood / 13 marble / 14 dark, rows 8..11): its lower two cells block
    (tileset flags), the capital and the upper shaft are drawn over whoever walks behind"""
    c = {"wood": 12, "marble": 13, "dark": 14}[kind]
    for i, r in enumerate((8, 9, 10, 11)):
        mp.t("B", c, r, x, y - 3 + i, z=3 if i < 3 else 2)
    mp.occupy([(x, y - 1), (x, y)], name, room)

def bench_v(mp, room, x, y, length, name="Ława"):
    for i in range(length):
        row = 2 if i == 0 else 4 if i == length - 1 else 3
        mp.t("C", 14, row, x, y + i)
    mp.occupy([(x, y + i) for i in range(length)], name, room)

def firewood(mp, room, x, y, name="Drewno na opał"):
    mp.pic_event(x, y, "!Decoration_static", 3, 8, 2, name, priority=1, solid=True)
    mp.occupy([(x, y)], name, room)

def big_prop(mp, room, x, y, d, p, name, w=2, h=1, note_extra=""):
    """one of the 144x192 props (!$Tavern_Props_Upper_Big): stands on (x, y) and reaches w cells right, h up"""
    parts = []
    if w > 1: parts.append("right=%d" % (w - 1))
    if h > 1: parts.append("up=%d" % (h - 1))
    note = ("<Occupy:%s>" % ",".join(parts) if parts else "") + note_extra
    mp.pic_event(x, y, PROPS_BIG, 0, d, p, name, priority=1, solid=True, note=note)
    mp.occupy([(x + i, y - j) for i in range(w) for j in range(h)], name, room)

def screen(mp, room, x, y0, facing="right", name="Parawan"):
    """a three-panel folding screen (C 4..5 or 6..7, 13..15), 2 wide: its foot row blocks"""
    c = 4 if facing == "right" else 6
    for dx in range(2):
        for dy in range(3): mp.t("C", c + dx, 13 + dy, x + dx, y0 - 2 + dy, z=2)
    mp.occupy([(x, y0), (x + 1, y0)], name, room)

def barrel(mp, room, x, y0, kind="water", name="Beczka"):
    c = {"water": 13, "plain": 14, "cloth": 15}[kind]
    mp.t("D", c, 0, x, y0 - 1); mp.t("D", c, 1, x, y0)
    mp.occupy([(x, y0)], name, room)


# ======================================================================================================== checks
import re as _re

def occupy_cells(e):
    """the cells an event closes: its own + ChoppableTree's <Occupy:...> extents (when on a blocking page)"""
    pg = event_page_shown(e)
    if pg is None or pg["priorityType"] != 1 or pg["through"]: return []
    cells = [(e["x"], e["y"])]
    m = _re.search(r"<Occupy:([^>]*)>", e.get("note") or "")
    if m:
        o = {"left": 0, "right": 0, "up": 0, "down": 0}
        for part in m.group(1).split(","):
            if "=" in part:
                k, v = part.split("="); o[k.strip()] = int(v)
        cells = [(e["x"] + dx, e["y"] + dy) for dx in range(-o["left"], o["right"] + 1) for dy in range(-o["up"], o["down"] + 1)]
    return cells

def seal_blockers(mp):
    """invisible blockers where a piece should stop the player but neither the tiles (staged flags) nor an event do:
    greedy rectangles, one event each with <Occupy:right=,up=> (its cell = the rectangle's bottom-left)"""
    data, W, H = mp.resolve(), mp.W, mp.H
    by_events = set()
    for (x, y, e) in mp.events:
        for c in occupy_cells(dict(e, x=x, y=y)): by_events.add(c)
    need = {c for c in mp.solid if not engine_blocks(data, W, H, c[0], c[1]) and c not in by_events}
    todo, n = set(need), 0
    while todo:
        x0, y0 = min(todo, key=lambda c: (c[1], c[0]))
        x1 = x0
        while (x1 + 1, y0) in todo: x1 += 1
        y1 = y0
        while all((x, y1 + 1) in todo for x in range(x0, x1 + 1)): y1 += 1
        parts = []
        if x1 > x0: parts.append("right=%d" % (x1 - x0))
        if y1 > y0: parts.append("up=%d" % (y1 - y0))
        note = "<Occupy:%s>" % ",".join(parts) if parts else ""
        mp.add_event(x0, y1, "Blokada", [page(1, 0, None, None)], note)
        todo -= mp.rect(x0, y0, x1, y1)
        n += 1
    return n, sorted(need)

def passable_grid(m, flags=None, openable=()):
    """(W, H, pass[y][x]) as the game sees it: tiles by the flags, events on their blocking pages (cells in
    `openable` - a gate TavernLife opens - count as open)"""
    W, H, data = m["width"], m["height"], m["data"]
    grid = [[not engine_blocks(data, W, H, x, y, flags) for x in range(W)] for y in range(H)]
    for e in m["events"]:
        if not e: continue
        for (x, y) in occupy_cells(e):
            if 0 <= x < W and 0 <= y < H and (x, y) not in openable: grid[y][x] = False
    return grid

def transfers_of(m):
    """same-map jumps: (event cell, target cell, touch cell list) of every page (a locked door's second page too)"""
    out = []
    for e in m["events"]:
        if not e: continue
        for pg in e["pages"]:
            for c in pg["list"]:
                if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == m["_id"]:
                    out.append(((e["x"], e["y"]), (c["parameters"][2], c["parameters"][3]), pg["priorityType"]))
    return out

def reach(m, start, grid, use_doors=True, open_locked=True):
    W, H = m["width"], m["height"]
    jumps = transfers_of(m) if use_doors else []
    seen, todo = {start}, [start]
    def push(c):
        if c not in seen:
            seen.add(c); todo.append(c)
    while todo:
        x, y = todo.pop()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if 0 <= n[0] < W and 0 <= n[1] < H and grid[n[1]][n[0]]:
                push(n)
            # a door (priority 1, touch) is used by walking into it; a gap (priority 0) by stepping on it
            for (src, dst, prio) in jumps:
                if src == n: push(dst)
    return seen

def check_map(mp, m, start, label):
    """prints and returns the report of the rules"""
    m = dict(m); m["_id"] = mp.id
    grid = passable_grid(m, openable=getattr(mp, "openable", set()))
    seen = reach(m, start, grid)
    rep = {"map": label, "problems": []}
    P = rep["problems"]
    # every room reachable, and its free floor all reachable (no pockets behind furniture)
    rooms = {}
    for (x, y), k in mp.room_of.items():
        if grid[y][x]: rooms.setdefault(k, []).append((x, y))
    for k, cells in sorted(rooms.items()):
        got = [c for c in cells if c in seen]
        if not got: P.append("pomieszczenie nieosiągalne: %s" % k)
        elif len(got) < len(cells):
            miss = sorted(set(cells) - set(got))
            P.append("%s: %d wolnych pól odciętych, np. %s" % (k, len(miss), miss[:4]))
    # doors: both sides free
    for d in mp.doors:
        for key in ("inside", "outside"):
            x, y = d[key]
            if not grid[y][x]: P.append("drzwi %s: pole %s %s zablokowane" % (d["label"], key, d[key]))
    # things on table tops: the thing's foot on the top board
    for (x, y, what, bb) in mp.on_top:
        rect = mp.surfaces.get((x, y))
        if rect is None:
            P.append("%s na (%d,%d): nie stoi na blacie" % (what, x, y)); continue
        if bb is None: continue
        bx0, by0, bx1, by1 = bb
        foot = by1
        if not (rect[1] + 3 <= foot <= rect[3] + 2) or bx0 < rect[0] - 2 or bx1 > rect[2] + 2:
            P.append("%s na (%d,%d): stopa y=%d poza blatem %s" % (what, x, y, foot, rect))
    # dead-end nooks: a free floor cell closed on three sides by furniture (looks squeezed)
    solid = set(mp.occ)
    for k, cells in rooms.items():
        for (x, y) in cells:
            walls = sum(1 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                        if (x + dx, y + dy) in solid)
            seat = lambda n: n.startswith("Krzesło") or n.startswith("Fotel")
            between_beds = (mp.occ.get((x - 1, y), "").startswith("Łóżko") and mp.occ.get((x + 1, y), "").startswith("Łóżko")) or                            (seat(mp.occ.get((x - 1, y), "")) and seat(mp.occ.get((x + 1, y), "")))
            if walls >= 3 and not between_beds: P.append("%s: ciasna wnęka (%d,%d)" % (k, x, y))
    # wall rhythm: equal steps between repeated pictures / lanterns of a corridor stretch are checked by bay_spots2;
    # here: every wall item on its wall's proper row
    rows = {}
    for (wall, kind, x, row) in mp.wall_items:
        rows.setdefault((wall, kind), set()).add(row)
    for (wall, kind), rs in rows.items():
        if len(rs) > 1: P.append("%s: %s na różnych wysokościach %s" % (wall, kind, sorted(rs)))
    # symmetry: in every guest room / suite bedchamber the bed group (beds + bedside tables) is centred on the back
    # wall, and the rug under the foot of the bed is centred under the bed group
    for sp in mp.L["spaces"]:
        if sp.kind not in ("guest", "suite_bed", "lord_bed", "chamber"): continue
        group = [c for (name, room, cells, solid) in mp.pieces if room == sp.key and
                 (name.startswith("Łóżko") and name != "Łóżko dziecięce" or name == "Stolik nocny") for c in cells if c[1] == sp.y0]
        if not group: continue
        gl, gr = min(x for x, y in group), max(x for x, y in group)
        if abs((gl + gr) / 2.0 - (sp.x0 + sp.x1) / 2.0) > 0.01:
            P.append("%s: łóżka nie na środku ściany (%d..%d w %d..%d)" % (sp.key, gl, gr, sp.x0, sp.x1))
        for (rx0, ry0, rx1, ry1) in getattr(mp, "rugs", []):
            if sp.x0 <= rx0 and rx1 <= sp.x1 and ry0 == sp.y0 + 2:
                if abs((rx0 + rx1) / 2.0 - (gl + gr) / 2.0) > 0.01:
                    P.append("%s: dywan nie pod łóżkami (%d..%d, łóżka %d..%d)" % (sp.key, rx0, rx1, gl, gr))
    # rhythm: the pictures of every corridor stretch sit symmetrically in it (equal margins at both ends)
    by_wall = {}
    for (wall, kind, x, row) in mp.wall_items:
        by_wall.setdefault(wall, []).append((x, kind))
    for wall, items in by_wall.items():
        sp = mp.spaces.get(wall)
        if not sp or sp.kind != "corridor": continue
        stops = sorted([x for x, k in items if k in ("door", "window", "arch")] + [sp.x0 - 1, sp.x1 + 1])
        pics = sorted(x for x, k in items if k == "painting")
        for a, b in zip(stops, stops[1:]):
            inside = [x for x in pics if a < x < b]
            if not inside: continue
            gaps = [inside[0] - a] + [q - p for p, q in zip(inside, inside[1:])] + [b - inside[-1]]
            if gaps[0] != gaps[-1]:
                P.append("%s: obrazy między %d a %d nie symetrycznie %s" % (wall, a, b, gaps))
    rep["reached"] = len(seen)
    return rep


def night_lights(mp):
    out = []
    for (x, y, e) in mp.events:
        note = e.get("note") or ""
        m = _re.search(r"<Light:(\d+)", note)
        if m: out.append((x, y, int(m.group(1)) / 48.0))
    return out

def auto_fill(mp, reach=0.72, radius=300, skip=(), max_n=80, min_gain=14):
    """dim fill lights (the shared "fill" tag) wherever a floor cell is further than `reach` of a lamp's radius from
    every lamp: greedy, each new light covers the most dark cells"""
    tag = L_FILL                                  # the shared fill tag (links.json lighting), as on the ground floor
    r_cells = int(_re.search(r"<Light:(\d+)", tag).group(1)) / 48.0
    floor = {c for c, k in mp.room_of.items() if k not in skip}
    lights = night_lights(mp)
    def dark_cells():
        return {(x, y) for (x, y) in floor if all(((x - lx) ** 2 + (y - ly) ** 2) ** 0.5 > reach * lr for (lx, ly, lr) in lights)}
    todo = dark_cells()
    added = 0
    while todo and added < max_n:
        best, gain = None, -1
        for (cx, cy) in todo:
            g = sum(1 for (x, y) in todo if ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 <= reach * r_cells)
            if g > gain: best, gain = (cx, cy), g
        if gain < min_gain: break                  # only corners are left dark: leave them
        mp.light_at(best[0], best[1], tag, "wypelnienie")
        lights.append((best[0], best[1], r_cells))
        added += 1
        todo = {(x, y) for (x, y) in todo if ((x - best[0]) ** 2 + (y - best[1]) ** 2) ** 0.5 > reach * r_cells}
    return added


# ======================================================================================================== zone pictures
def strefy(L, base_png, out, title, subtitle, pins, SC=0.5):
    """the map (a plain render, no darkness) toned down, every space framed in its zone colour with its Polish name,
    numbered pins for the key places, a legend on the right"""
    from PIL import Image, ImageDraw
    T = 48 * SC
    base = Image.open(base_png).convert("RGB")
    base = base.resize((int(base.width * SC), int(base.height * SC)), Image.LANCZOS)
    base = Image.blend(base, Image.new("RGB", base.size, (12, 10, 14)), 0.35).convert("RGBA")
    over = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    f_lab, f_pin = _font(13, True), _font(14, True)
    for sp in L["spaces"]:
        k = "rent" if sp.rent else sp.kind
        col = KIND_COL.get(k, (200, 200, 200))
        r = [sp.x0 * T + 2, (sp.y0 - sp.face) * T + 2, (sp.x1 + 1) * T - 2, (sp.y1 + 1) * T - 2]
        d.rectangle(r, fill=col + (40,), outline=col + (235,), width=3)
    for sp in L["spaces"]:
        k = "rent" if sp.rent else sp.kind
        col = KIND_COL.get(k, (200, 200, 200))
        name = sp.label if not sp.number else "%s (%s%s)" % (sp.label, SIZE_PL[sp.size], (", %d G" % sp.rent[1]) if sp.rent else "")
        if sp.key == "chamber": name = "Komnata (30 G, rep. 60)"
        if sp.key == "s4a": name = "Apartament Złoty — salonik (50 G, rep. 80)"
        lines = [name]
        if d.textlength(name, font=f_lab) > sp.w * T - 10 and " — " in name:
            lines = name.split(" — ")
        lx, ly = sp.x0 * T + 7, (sp.y0 - sp.face) * T + 6
        for t in lines:
            tw = d.textlength(t, font=f_lab)
            d.rounded_rectangle([lx - 4, ly - 2, lx + tw + 5, ly + 17], radius=4, fill=(14, 12, 16, 225), outline=col + (255,), width=1)
            d.text((lx, ly), t, fill=col + (255,), font=f_lab)
            ly += 20
    for i, (name, x, y) in enumerate(pins, 1):
        cx, cy = x * T + T / 2, y * T + T / 2
        d.ellipse([cx - 11, cy - 11, cx + 11, cy + 11], fill=(255, 214, 60, 255), outline=(20, 16, 10, 255), width=2)
        sn = str(i)
        d.text((cx - d.textlength(sn, font=f_pin) / 2, cy - 9), sn, fill=(20, 16, 10, 255), font=f_pin)
    base.alpha_composite(over)
    LEG = 430
    Hc = max(base.size[1] + 100, 160 + 25 * len(pins))
    canvas = Image.new("RGB", (base.size[0] + LEG, Hc), (22, 20, 24))
    canvas.paste(base.convert("RGB"), (0, 90))
    dd = ImageDraw.Draw(canvas)
    dd.text((16, 14), title, fill=(255, 214, 90), font=_font(26, True))
    dd.text((16, 52), subtitle, fill=(220, 214, 204), font=_font(14))
    lx = base.size[0] + 18
    dd.text((lx, 100), "Punkty", fill=(255, 214, 90), font=_font(17, True))
    for i, (name, x, y) in enumerate(pins, 1):
        yy = 130 + (i - 1) * 25
        dd.ellipse([lx, yy, lx + 20, yy + 20], fill=(255, 214, 60), outline=(20, 16, 10))
        sn = str(i)
        dd.text((lx + 10 - dd.textlength(sn, font=_font(13, True)) / 2, yy + 2), sn, fill=(20, 16, 10), font=_font(13, True))
        dd.text((lx + 30, yy + 2), "%s  (%d, %d)" % (name, x, y), fill=(236, 232, 224), font=_font(13))
    dd.text((16, Hc - 30), "Mapa %d × %d kratek (1 kratka = 48 px). Pola w nawiasach: x, y." % (L["W"], L["H"]), fill=(160, 160, 170), font=_font(12))
    canvas.save(out)
    return canvas.size
