# python plan_parter.py  -> docs/tawerna_nowa/plan_parter.png
# The zone plan of the big ground floor (parter_layout.py): every room as a coloured block with its Polish name, the
# walls (north wall faces) as darker bands, openings, the stairs, the key features (bar, stage, fireplaces, the quest
# board, the loose brick) and numbered pins with a legend. No game needed.
import os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import parter_layout as L

ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "docs", "tawerna_nowa", "plan_parter.png")
S = 12                      # px per cell
F = "C:/Windows/Fonts/"
font = lambda n, s: ImageFont.truetype(F + n, s)
f_title, f_sub = font("arialbd.ttf", 30), font("arial.ttf", 15)
f_room_b, f_room, f_small = font("arialbd.ttf", 15), font("arialbd.ttf", 12), font("arial.ttf", 11)
f_pin, f_leg, f_head = font("arialbd.ttf", 12), font("arial.ttf", 14), font("arialbd.ttf", 17)

def mix(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))

fm = L.floor_map()
face = L.face_map(fm)
MX, MY = 24, 96
LEG = 470
img = Image.new("RGB", (MX + L.W * S + 24 + LEG, MY + L.H * S + 30), (22, 19, 17))
d = ImageDraw.Draw(img, "RGBA")
colour = {r[0]: r[4] for r in L.ROOMS}
BORDER_C, VOID_C = (38, 30, 26), (6, 5, 5)

def cell_box(x, y, pad=0):
    return [MX + x * S + pad, MY + y * S + pad, MX + (x + 1) * S - 1 - pad, MY + (y + 1) * S - 1 - pad]

def box(x0, y0, x1, y1, pad=0):
    return [MX + x0 * S + pad, MY + y0 * S + pad, MX + (x1 + 1) * S - 1 - pad, MY + (y1 + 1) * S - 1 - pad]

# ---- cells
for y in range(L.H):
    for x in range(L.W):
        c = (x, y)
        if c in fm:
            col = mix(colour[fm[c]], (255, 250, 240), 0.35)
        elif c in face:
            col = mix(colour[face[c]], (70, 50, 35), 0.55)
        else:
            col = BORDER_C
        d.rectangle(cell_box(x, y), fill=col)
# the wall faces get a thin wainscot line on their bottom row
for (x, y), n in face.items():
    if (x, y + 1) in fm:
        d.line([MX + x * S, MY + (y + 1) * S - 3, MX + (x + 1) * S - 1, MY + (y + 1) * S - 3], fill=(40, 28, 20, 150))
# a faint grid every 5 cells in the floors
for (x, y) in fm:
    if x % 5 == 0: d.line([MX + x * S, MY + y * S, MX + x * S, MY + (y + 1) * S - 1], fill=(0, 0, 0, 18))
    if y % 5 == 0: d.line([MX + x * S, MY + y * S, MX + (x + 1) * S - 1, MY + y * S], fill=(0, 0, 0, 18))

# ---- stairs up (vestibule, east end)
for y in range(L.STAIRS_TOP, L.STAIRS_BOTTOM + 1):
    for x in L.STAIRS_X:
        d.rectangle(cell_box(x, y), fill=(150, 110, 70))
        d.line([MX + x * S, MY + y * S + 2, MX + (x + 1) * S - 1, MY + y * S + 2], fill=(90, 60, 35))
for y in L.STAIRS_VOID:
    for x in L.STAIRS_X: d.rectangle(cell_box(x, y), fill=VOID_C)
d.line([MX + L.STAIRS_X[0] * S - 2, MY + L.STAIRS_TOP * S, MX + L.STAIRS_X[0] * S - 2, MY + (L.STAIRS_BOTTOM + 1) * S], fill=(60, 40, 25), width=3)

# ---- features
WOOD, WOOD_D = (125, 82, 48), (70, 44, 26)
def counter(x0, y0, x1, y1):
    d.rectangle(box(x0, y0, x1, y1), fill=WOOD, outline=WOOD_D, width=2)
# the L-shaped bar: back-bar along the wall, the long arm E-W, the short arm N-S on the axis
d.rectangle(box(38, 62, 48, 62, 1), fill=(95, 60, 40), outline=WOOD_D)                 # back-bar (barrels, taps, shelves)
counter(38, 66, 48, 67); counter(49, 62, 49, 67)
for x in range(39, 48, 2): d.ellipse(box(x, 68, x, 68, 3), fill=(110, 75, 45))      # stools
for y in (63, 65): d.ellipse(box(50, y, 50, y, 3), fill=(110, 75, 45))
# the serving hatch and the kitchen door
d.rectangle(box(53, 62, 58, 62, 1), fill=(120, 95, 70), outline=WOOD_D)
# the stage (NE hall): a raised platform against the north wall, steps in the middle, curtains
d.rectangle(box(66, 30, 78, 34), fill=(190, 150, 100), outline=(110, 70, 40), width=2)
d.rectangle(box(71, 35, 73, 35), fill=(160, 120, 80))
d.rectangle(box(66, 30, 66, 34, 1), fill=(170, 30, 40)); d.rectangle(box(78, 30, 78, 34, 1), fill=(170, 30, 40))
# fireplaces: small hearths on north walls
def hearth(x0, y_face_bottom, w=4):
    d.rectangle(box(x0, y_face_bottom - 1, x0 + w - 1, y_face_bottom), fill=(95, 90, 90), outline=(50, 45, 45))
    cx, cy = MX + (x0 + w / 2) * S, MY + (y_face_bottom + 0.6) * S
    d.polygon([(cx - 7, cy + 4), (cx, cy - 9), (cx + 7, cy + 4)], fill=(255, 140, 40))
    d.polygon([(cx - 3, cy + 4), (cx, cy - 3), (cx + 3, cy + 4)], fill=(255, 230, 120))
FIRES = [(25, 52), (70, 52), (6, 29), (70, 73), (27, 29)]
for (x0, yb) in FIRES: hearth(x0, yb)
# the quest board (3x3 showpiece) in the vestibule
qx, qy = 42, 76
d.rectangle(box(qx, qy, qx + 2, qy + 2, 1), fill=(160, 120, 70), outline=(70, 45, 25), width=2)
for i, (dx, dy) in enumerate(((0.3, 0.4), (1.3, 0.3), (2.1, 0.6), (0.6, 1.3), (1.6, 1.2))):
    d.rectangle([MX + (qx + dx) * S, MY + (qy + dy) * S, MX + (qx + dx) * S + 7, MY + (qy + dy) * S + 8], fill=(240, 225, 190))
# coat racks (west end of the vestibule)
for x in (39, 40, 41): d.rectangle(box(x, 78, x, 78, 3), fill=(90, 60, 40))
# the loose brick
bx, by = L.SPOTS["Luźna cegła"]
d.rectangle(box(bx, by, bx, by, 1), fill=(200, 80, 60), outline=(255, 230, 200), width=2)
# long tables in the halls (a hint of the furniture rhythm)
def table_h(x0, x1, y):
    d.rectangle(box(x0, y, x1, y + 1, 2), fill=(150, 105, 65), outline=(90, 60, 35))
def table_v(x, y0, y1):
    d.rectangle(box(x, y0, x, y1, 2), fill=(150, 105, 65), outline=(90, 60, 35))
def round_t(x, y):
    d.ellipse(box(x, y, x, y, 1), fill=(150, 105, 65), outline=(90, 60, 35))
for x in (22, 27, 32):                             # banquet hall: three long tables north-south
    table_v(x, 35, 44)
for x in (24, 30): table_v(x, 58, 64)              # front hall west
for x in (69, 75): table_v(x, 58, 64)              # front hall east
for (x, y) in ((20, 57), (34, 57), (20, 66), (34, 66), (65, 57), (79, 57), (65, 66), (79, 66), (55, 68), (59, 69)): round_t(x, y)
for (x, y) in ((67, 40), (71, 42), (75, 40), (79, 44), (65, 45)): round_t(x, y)       # tables before the stage
table_h(22, 32, 77)                                # private dining: the banquet table
for (x, y) in ((86, 34), (90, 34), (94, 34), (86, 40), (90, 40)): round_t(x, y)       # gaming tables
table_h(4, 13, 40)                                 # hunters' table
for (x, y) in ((4, 58), (9, 58), (4, 64), (9, 64)): d.ellipse(box(x, y, x + 1, y + 1, 2), fill=(170, 200, 220), outline=(90, 110, 130))  # bath tubs
d.ellipse(box(91, 54, 92, 55, 1), fill=(220, 60, 50), outline=(60, 30, 20))          # dartboard
d.line([MX + 88 * S, MY + 59.5 * S, MX + 95 * S, MY + 59.5 * S], fill=(250, 250, 250), width=2)   # throwing line

# ---- room names
for (n, r, fk, wk, col, grp) in L.ROOMS:
    x0, y0, x1, y1 = r
    if n == "Wielka sala": x0, y0, x1, y1 = 38, 69, 61, 73
    cx, cy = MX + (x0 + x1 + 1) / 2 * S, MY + (y0 + y1 + 1) / 2 * S
    if n == "Wielka sala": cy = MY + 70.3 * S
    if n == "Korytarz": cx = MX + 45 * S
    fnt = f_room_b if (x1 - x0) >= 14 else f_room
    words = n.split(" ")
    lines = [n] if d.textlength(n, font=fnt) < (x1 - x0 + 1) * S - 6 else [" ".join(words[:len(words) // 2 or 1]), " ".join(words[len(words) // 2 or 1:])]
    lh = fnt.size + 3
    for i, ln in enumerate(lines):
        tw = d.textlength(ln, font=fnt)
        tx, ty = cx - tw / 2, cy - lh * len(lines) / 2 + i * lh
        d.text((tx, ty), ln, font=fnt, fill=(20, 16, 12), stroke_width=3, stroke_fill=mix(colour[n], (255, 255, 255), 0.55))
# small notes in rooms
NOTES = [("bar w kształcie L", 39, 63.6), ("okienko i drzwi kuchni", 51.5, 62.8), ("scena Melii", 68.5, 31.7),
         ("kominek", 25.4, 53.2), ("kominek", 70.4, 53.2), ("kominek", 6.5, 30.2), ("kominek", 27.4, 30.2), ("kominek", 70.4, 74.2),
         ("rzutki", 89.5, 56.2), ("balie", 5.3, 61.4), ("stół bankietowy", 23.5, 79.6), ("tablica", 41.7, 79.2),
         ("wieszaki", 38.6, 80.4), ("schody", 58.3, 82.2)]
for (t, x, y) in NOTES:
    d.text((MX + x * S, MY + y * S), t, font=f_small, fill=(25, 18, 12), stroke_width=2, stroke_fill=(250, 244, 232))

# ---- pins
PINS = [("Borgar (zdarzenie 1) - za ladą, rozmowa z osi wejścia", L.SPOTS["Borgar"]),
        ("Melia (2) - na scenie", L.SPOTS["Melia"]),
        ("Grum (3) - pokój gier", L.SPOTS["Grum"]),
        ("Dziadek Ozzy (4) - przy kominku myśliwych", L.SPOTS["Ozzy"]),
        ("Luźna cegła (9) -> piwnica (Map009)", L.SPOTS["Luźna cegła"]),
        ("Tablica zleceń (3x3, oświetlona)", (43, 77)),
        ("Schody na piętro -> Map025", (60, 78)),
        ("Wejście / wyjście -> podwórze (Map008)", (50, 83)),
        ("Atmosfera 5-8 (bez obrazka)", (0, 2))]
for i, (t, (x, y)) in enumerate(PINS, 1):
    cx, cy = MX + (x + 0.5) * S, MY + (y + 0.5) * S
    d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=(255, 214, 60), outline=(20, 16, 10), width=2)
    s = str(i)
    d.text((cx - d.textlength(s, font=f_pin) / 2, cy - 7), s, font=f_pin, fill=(20, 16, 10))
# the entrance arrow
ax = MX + 50.5 * S
d.polygon([(ax - 10, MY + L.H * S + 20), (ax + 10, MY + L.H * S + 20), (ax, MY + L.H * S + 4)], fill=(255, 214, 60))

# ---- header and legend
d.text((MX, 16), "Tawerna - parter (Map001), plan stref", font=f_title, fill=(255, 214, 90))
d.text((MX, 56), "Mapa %dx%d kratek. Styl koncepcji B: kremowy tynk z boazerią, ciepłe deski, bar w kształcie L. "
       "Od wejścia: tablica zleceń 8 kratek, schody 10, Borgar 18." % (L.W, L.H), font=f_sub, fill=(225, 218, 205))
lx = MX + L.W * S + 28
y = MY
d.text((lx, y), "Punkty", font=f_head, fill=(255, 214, 90)); y += 28
for i, (t, _) in enumerate(PINS, 1):
    d.ellipse([lx, y, lx + 20, y + 20], fill=(255, 214, 60), outline=(20, 16, 10))
    s = str(i)
    d.text((lx + 10 - d.textlength(s, font=f_pin) / 2, y + 3), s, font=f_pin, fill=(20, 16, 10))
    d.text((lx + 28, y + 1), t, font=f_leg, fill=(236, 232, 224))
    y += 26
y += 14
d.text((lx, y), "Strefy", font=f_head, fill=(255, 214, 90)); y += 28
groups = [("Część dla gości", "public"), ("Korytarz (galeria)", "corridor"), ("Zaplecze (służba)", "service")]
for gname, g in groups:
    d.text((lx, y), gname, font=f_room_b, fill=(200, 190, 175)); y += 22
    for (n, r, fk, wk, col, grp) in L.ROOMS:
        if grp != g: continue
        d.rectangle([lx + 4, y + 3, lx + 20, y + 17], fill=mix(col, (255, 250, 240), 0.35), outline=(240, 240, 240))
        w = r[2] - r[0] + 1; h = r[3] - r[1] + 1
        d.text((lx + 30, y + 1), "%s  (%dx%d)" % (n, w, h), font=f_leg, fill=(236, 232, 224))
        y += 22
    y += 8
d.text((lx, y + 6), "Ciemne pasy = ściany północne (3 kratki),\ncienkie linie = ściany boczne, przerwy = przejścia.",
       font=f_small, fill=(170, 165, 160))
img.save(OUT)
print("saved", OUT, img.size)
