# Wspólne kawałki SZKICÓW sześciu nowych miejsc Kruczej Wyspy (koncepcja: docs/miejsca_wyspy/KONCEPCJA.md).
# To są tylko szkice do zatwierdzenia: mapy powstają w pamięci i jako obrazy w docs/miejsca_wyspy/, NIC nie trafia do data/.
#   - Szkic: mapa na tilesecie 11 (tileset autora Winlu z pełnymi flagami, jak miasteczko, Podgrodzie i przystań) z tarasami
#     skał (tools/mountains/mtlib.py MMap) i z domami / rzeczami / drzewami Podgrodzia (tools/podgrodzie/plib.py Pod), morze jak
#     na przystani (A1 rodzaj 6 = twardy brzeg, 10 = piaszczysty, 1 = głębia, 2 = deski pomostu na warstwie 1)
#   - obrysy rzeczy, których grafiki jeszcze nie ma (latarnia, wrak, palisada...), i numery miejsc do legendy
#   - rysunek do dokumentu: mapa 1:1 (tools/town/mzrender.py), zmniejszona do 1280x720 z numerami, obrysami i legendą
import os, sys, json, copy, math
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
for p in ("tools/newstart", "tools/town", "tools/podgrodzie", "tools/mountains", "tools/underground"):
    if ROOT + p not in sys.path: sys.path.insert(0, ROOT + p)
from PIL import Image, ImageDraw, ImageFont                                     # noqa: E402
import mtlib                                                                    # noqa: E402
from mtlib import MMap                                                          # noqa: E402
import plib                                                                     # noqa: E402
from plib import Pod, THINGS, CLUMPS                                            # noqa: E402
from nslib import NewMap, B, C, D, E, A5, noise, lowfreq                        # noqa: E402
import prefabs as PF                                                            # noqa: E402
import mzrender as R                                                            # noqa: E402

DOCS = ROOT + "docs/miejsca_wyspy/"
FONTS = ROOT + "fonts/"
T = 48

# A1 (morze), A2 (grunt) - tileset 11
SEA, SEA_SAND, DEEP, PLANKS = 6, 10, 1, 2
GRASS, DIRT, GRASS_LIGHT, TALL, STONES, EARTH, MUD = 16, 17, 27, 21, 23, 24, 26
TUFTS, DRY, PEBBLES, HEDGE, FENCE, FENCE_DARK, COBBLE = 21, 39, 47, 20, 22, 38, 40
FLOWERS, DARK_GRASS, WALKBOARDS = 28, 46, 33
# A3 / A4 (ściany i dachy)
WALL_FACE, WALL_TOP = 105, 97          # mur twierdzy: lico (2 rzędy) i korona
LOGS = 72                              # ściana z bali (palisada w szkicu)


class Szkic(MMap, Pod):
    """szkic mapy: tarasy MMap + domy i rzeczy Pod + morze; numery i obrysy do rysunku"""

    def __init__(self, map_id, w, h, name, note="<Clouds:on>", seed=1):
        MMap.__init__(self, map_id, w, h, name, note, seed=seed)
        self.buildings, self.lights, self.doors, self.exits, self.notes = [], [], [], [], []
        self.labels = []        # (nr, x, y, tytuł, opis)
        self.outlines = []      # (x0, y0, x1, y1, kształt "rect" | "ellipse", podpis, kolor)
        self.arrows = []        # (x, y, kierunek, podpis) - wejścia / wyjścia
        self.crows = []         # (x, y, poza) - kruki na rysunku (ozdoba szkicu, nie zdarzenia)
        self.sea_cells = set()
        self.dashes = []        # linie przerywane: (punkty w polach, kolor, podpis)

    def picture(self, x, y, char, index=0, direction=2, pattern=0, name="", priority=1, through=False, note="", cmds=None,
                trigger=0, step=False, dfix=True, freq=3, speed=3, cells=None):
        e = plib.event(name, x, y, plib.pic(char, index, direction, pattern), priority, through, trigger, cmds, note, step, dfix, freq, speed)
        return self.add(x, y, e, cells)

    def put(self, x, y, template, pic=None, name=None, force=False):
        """zdarzenie z Map003 (TMPL), a gdy takiego tam nie ma - zwykły obrazek, który blokuje"""
        import nslib
        if (pic or template) in nslib.TMPL or template in nslib.TMPL:
            return MMap.put(self, x, y, template, pic, name, force)
        self.picture(x, y, pic or template, 0, 2, 0, name=name or "", priority=1)
        self.solid.add((x, y))
        return True

    # ---- teren
    def sea(self, cells, kind=SEA):
        for c in cells:
            if self.inside(*c):
                self.layers[0][c] = ("k", kind)
                for z in (1, 2, 3): self.layers[z].pop(c, None)
                self.sea_cells.add(c)
                self.solid.add(c)

    def deep(self, cells):
        self.kind(1, {c for c in cells if c in self.sea_cells}, DEEP)

    def planks(self, cells):
        self.kind(1, cells, PLANKS)
        for c in cells: self.solid.discard(c)

    def lane(self, pts, width, kind=DIRT, z=0, wobble=0.3, seed=5, keep_rims=True):
        cells = set()
        for (ax, ay), (bx, by) in zip(pts, pts[1:]):
            n = int(max(abs(bx - ax), abs(by - ay)) * 3) + 1
            for i in range(n + 1):
                t = i / n
                cx, cy = ax + (bx - ax) * t, ay + (by - ay) * t
                r = width / 2.0 + wobble * (noise(int(cx * 2), int(cy * 2), seed) - 0.5) * 2
                for y in range(int(cy - r - 1), int(cy + r + 2)):
                    for x in range(int(cx - r - 1), int(cx + r + 2)):
                        if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r and self.inside(x, y): cells.add((x, y))
        cells = {c for c in cells if c not in self.sea_cells and c not in self.faces and c not in self.stair_cells
                 and (not keep_rims or c not in self.rims)}
        self.kind(z, cells, kind)
        self.keep_free |= cells
        return cells

    def blob(self, cx, cy, rx, ry, seed=3, rough=0.25):
        out = set()
        for y in range(int(cy - ry - 2), int(cy + ry + 3)):
            for x in range(int(cx - rx - 2), int(cx + rx + 3)):
                a = math.atan2(y - cy, x - cx)
                k = 1 + rough * (lowfreq(int(20 + 6 * math.cos(a)), int(20 + 6 * math.sin(a)), seed, 2.0) - 0.5) * 2
                if ((x + 0.5 - cx) / (rx * k)) ** 2 + ((y + 0.5 - cy) / (ry * k)) ** 2 <= 1 and self.inside(x, y): out.add((x, y))
        return out

    def overlay(self, cells, kind, chance=1.0, seed=7):
        for (x, y) in cells:
            if (x, y) in self.sea_cells or (x, y) in self.faces or (x, y) in self.rims or (x, y) in self.stair_cells: continue
            if chance >= 1 or noise(x, y, seed) < chance: self.layers[1][(x, y)] = ("k", kind)

    # ---- rzeczy
    def stamp(self, key, x, y, ground=False, skip_events=None):
        """prefabrykat autora (tools/town/prefabs) bez wybranych zdarzeń (skip_events(nazwa, obrazek) -> True)"""
        pf = PF.load(key)
        for z in range(4):
            for j, row in enumerate(pf["layers"][z]):
                for i, t in enumerate(row):
                    if not t: continue
                    if not ground and z < 2 and 2048 <= t < 2048 + 48 * 48: continue
                    self.tile(z, x + i, y + j, t)
        for j, row in enumerate(pf["layers"][4]):
            for i, v in enumerate(row):
                if v: self.shadow[(x + i, y + j)] = v
        for ev in pf["events"]:
            img = ev["pages"][0]["image"]["characterName"] if ev["pages"] else ""
            if skip_events and skip_events(ev.get("name", ""), img): continue
            e = {k: copy.deepcopy(ev[k]) for k in ("name", "note", "pages")}
            self.add(x + ev["x"], y + ev["y"], e)
        for i in range(pf["w"]):
            for j in range(pf["h"]):
                self.keep_free.add((x + i, y + j))
        return pf

    def wall_run(self, x0, x1, y_top, face_rows=2, broken=()):
        """mur twierdzy: korona A4 k97 w rzędzie y_top, lico k105 w face_rows rzędach pod nią; broken = kolumny wyburzone"""
        for x in range(x0, x1 + 1):
            if x in broken: continue
            self.layers[0][(x, y_top)] = ("k", WALL_TOP)
            for k in range(1, face_rows + 1):
                self.layers[0][(x, y_top + k)] = ("k", WALL_FACE)
                self.solid.add((x, y_top + k))
            for k in range(0, face_rows + 1): self.keep_free.add((x, y_top + k))

    def crenels(self, x0, x1, y):
        for x in range(x0, x1 + 1):
            self.tl(x, y, B(9, 0) if x % 2 else B(9, 1), 3)

    def tower(self, x, y_top):
        """okrągła baszta autora B(13..14, 0..6) na warstwie 3 (2 pola szerokości, 7 rzędów)"""
        for j in range(7):
            for i in range(2):
                self.tl(x + i, y_top + j, B(13 + i, j), 3)
                if j >= 4: self.solid.add((x + i, y_top + j))

    def label(self, nr, x, y, title, desc=""):
        self.labels.append((nr, x, y, title, desc))

    def outline(self, x0, y0, x1, y1, text="", shape="rect", color=(255, 255, 255)):
        self.outlines.append((x0, y0, x1, y1, shape, text, color))

    def arrow(self, x, y, d, text):
        self.arrows.append((x, y, d, text))

    def crow(self, x, y, pose=0):
        self.crows.append((x, y, pose))

    def dash(self, pts, color=(255, 216, 102), text=""):
        self.dashes.append((pts, color, text))

    # ---- zapis do pamięci (nigdy do data/)
    def to_map(self):
        data = self.resolve()
        events = self.build_events()
        m = dict(self.props)
        m["data"], m["events"] = data, events
        return m


# =============================================================================================== rysunek do dokumentu
def font(name, size):
    return ImageFont.truetype(FONTS + name, size)


BG = (11, 12, 15)
KEY = (255, 216, 102)
TEXT = (235, 232, 223)
MUTED = (160, 159, 163)


def render_map(m, tileset=11):
    if tileset in (10, 12):
        import uglib
        return uglib.render(m, None)
    S = R.Sheets(tileset)
    S.lenient = True
    return R.render(m, S)


def dashed_line(dr, p0, p1, color, width=3, dash=10, gap=7):
    (x0, y0), (x1, y1) = p0, p1
    L = math.hypot(x1 - x0, y1 - y0)
    if L == 0: return
    dx, dy = (x1 - x0) / L, (y1 - y0) / L
    t = 0
    while t < L:
        e = min(L, t + dash)
        dr.line([(x0 + dx * t, y0 + dy * t), (x0 + dx * e, y0 + dy * e)], fill=color, width=width)
        t = e + gap


def dashed_ellipse(dr, box, color, width=3, n=48):
    x0, y0, x1, y1 = box
    cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
    for i in range(0, n, 2):
        a0, a1 = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
        dr.line([(cx + rx * math.cos(a0), cy + ry * math.sin(a0)), (cx + rx * math.cos(a1), cy + ry * math.sin(a1))], fill=color, width=width)


def crow_frames():
    im = Image.open(ROOT + "img/system/Bird_Crow.png").convert("RGBA")
    return [im.crop((i * 32, 0, (i + 1) * 32, 32)) for i in range(im.width // 32)]


def draw_doc(mp, m, out, title, sub, legend_extra=(), tileset=11, map_box=(12, 14, 972, 706), legend_x=990, foot=""):
    """mapa + numery + obrysy + legenda -> 1280x720"""
    full = render_map(m, tileset)
    # kruki (ozdoba szkicu) na pełnej mapie
    if mp.crows:
        fr = crow_frames()
        for (x, y, pose) in mp.crows:
            f = fr[pose % len(fr)].resize((48, 48), Image.NEAREST)
            full.alpha_composite(f, (int(x * T), int(y * T)))
    bx0, by0, bx1, by1 = map_box
    sc = min((bx1 - bx0) / full.width, (by1 - by0) / full.height)
    small = full.resize((int(full.width * sc), int(full.height * sc)), Image.LANCZOS)
    out_im = Image.new("RGBA", (1280, 720), BG + (255,))
    ox, oy = bx0, by0 + ((by1 - by0) - small.height) // 2
    out_im.alpha_composite(small, (ox, oy))
    dr = ImageDraw.Draw(out_im)
    P = lambda x, y: (ox + x * T * sc, oy + y * T * sc)
    f_num = font("AlegreyaSans-Bold.ttf", 15)
    f_small = font("AlegreyaSans-Medium.ttf", 14)
    for (x0, y0, x1, y1, shape, text, color) in mp.outlines:
        a, b = P(x0, y0), P(x1 + 1, y1 + 1)
        if shape == "ellipse":
            dashed_ellipse(dr, (a[0], a[1], b[0], b[1]), color + (235,), 3)
        else:
            for p, q in ((a, (b[0], a[1])), ((b[0], a[1]), b), (b, (a[0], b[1])), ((a[0], b[1]), a)):
                dashed_line(dr, p, q, color + (235,), 3)
        if text:
            tw = dr.textlength(text, font=f_small)
            tx, ty = (a[0] + b[0]) / 2 - tw / 2, b[1] + 2
            dr.rectangle([tx - 3, ty, tx + tw + 3, ty + 17], fill=(11, 12, 15, 200))
            dr.text((tx, ty), text, font=f_small, fill=color)
    for (pts, color, text) in mp.dashes:
        pp = [P(x + 0.5, y + 0.5) for (x, y) in pts]
        for p, q in zip(pp, pp[1:]): dashed_line(dr, p, q, color + (235,), 3, 8, 6)
        if text:
            tx, ty = pp[len(pp) // 2]
            tw = dr.textlength(text, font=f_small)
            dr.rectangle([tx - 3, ty - 20, tx + tw + 3, ty - 3], fill=(11, 12, 15, 210))
            dr.text((tx, ty - 20), text, font=f_small, fill=color)
    for (x, y, d, text) in mp.arrows:
        cx, cy = P(x + 0.5, y + 0.5)
        v = {2: (0, 1), 4: (-1, 0), 6: (1, 0), 8: (0, -1)}[d]
        n = (-v[1], v[0])
        tip = (cx + v[0] * 16, cy + v[1] * 16)
        base = (cx - v[0] * 6, cy - v[1] * 6)
        dr.polygon([tip, (base[0] + n[0] * 11, base[1] + n[1] * 11), (base[0] - n[0] * 11, base[1] - n[1] * 11)], fill=KEY + (255,), outline=(0, 0, 0, 255))
        tw = dr.textlength(text, font=f_small)
        tx = min(max(cx - tw / 2, ox + 2), ox + small.width - tw - 4)
        ty = cy + (22 if d != 2 else -40) if d in (2, 8) else cy + 14
        dr.rectangle([tx - 3, ty, tx + tw + 3, ty + 17], fill=(11, 12, 15, 215))
        dr.text((tx, ty), text, font=f_small, fill=KEY)
    for (nr, x, y, t_, d_) in mp.labels:
        cx, cy = P(x + 0.5, y + 0.5)
        dr.ellipse([cx - 11, cy - 11, cx + 11, cy + 11], fill=KEY + (255,), outline=(0, 0, 0, 255), width=2)
        s = str(nr)
        tw = dr.textlength(s, font=f_num)
        dr.text((cx - tw / 2, cy - 9), s, font=f_num, fill=(0, 0, 0))
    # legenda
    f_t = font("AlegreyaSC-Bold.ttf", 28)
    f_sub = font("AlegreyaSans-Medium.ttf", 15)
    f_name = font("AlegreyaSans-Bold.ttf", 16)
    f_desc = font("AlegreyaSans-Regular.ttf", 13)
    x = legend_x
    size = 28
    while dr.textlength(title, font=f_t) > 1270 - x and size > 18:
        size -= 1
        f_t = font("AlegreyaSC-Bold.ttf", size)
    dr.text((x, 14), title, font=f_t, fill=KEY)
    yy = 50
    for line in sub.split("\n"):
        dr.text((x, yy), line, font=f_sub, fill=MUTED)
        yy += 18
    yy += 6
    n_items = len(mp.labels)
    step = max(26, min(36, (690 - yy - 20 * len(legend_extra)) // max(1, n_items)))
    for (nr, _x, _y, t_, d_) in sorted(mp.labels, key=lambda l: l[0]):
        dr.ellipse([x, yy + 1, x + 20, yy + 21], fill=KEY, outline=(0, 0, 0), width=2)
        s = str(nr)
        tw = dr.textlength(s, font=f_num)
        dr.text((x + 10 - tw / 2, yy + 2), s, font=f_num, fill=(0, 0, 0))
        dr.text((x + 28, yy), t_, font=f_name, fill=TEXT)
        if d_ and step >= 30:
            dr.text((x + 28, yy + 17), d_, font=f_desc, fill=MUTED)
        yy += step
    for (txt, col) in legend_extra:
        dr.text((x, yy), txt, font=f_desc, fill=col)
        yy += 18
    if foot:
        dr.text((bx0, 704), foot, font=f_desc, fill=MUTED)
    out_im.convert("RGB").save(out)
    return out_im
