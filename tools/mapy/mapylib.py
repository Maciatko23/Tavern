# -*- coding: utf-8 -*-
"""Wspólna biblioteka narzędzi map (tools/mapy).

Czyta mapy i zestawy kafli tak, jak robi to gra (RPG Maker MZ), bez uruchamiania gry:
  - Zestaw: flagi kafli (przejście, gwiazdka, krzak, lada, teren), obrazki kafli (A1-A5 i B-E), maski przezroczystości;
  - Mapa: kafle na warstwach 0-3, cienie, regiony, zdarzenia (strona widoczna w nowej grze), obszar zajęty przez
    zdarzenie (<Occupy:...> i grafiki z tabeli SOLID_GRAPHICS z ChoppableTree.js), przejścia jak Game_Map.checkPassage,
    wejścia na mapę (przeniesienia z innych map, start gry, wyjścia na krawędziach - Krawedzie.js), flood fill;
  - render(): obraz mapy 1:1 (48 px na kratkę) z siatką i znacznikami problemów.
Nic tutaj nie zapisuje do data/ ani js/.
"""
import os, re, json, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
DATA = ROOT + "data/"
DOCS = ROOT + "docs/mapy/"
CHARS = ROOT + "img/characters/"
T = 48
H1 = T // 2

# mapy wzorcowe: zrobione przez użytkownika albo uznane za ładne (z nich uczy się katalog)
WZORCE = [1, 19, 25, 26, 101, 8]
WNETRZA_ZESTAWY = (8, 10, 12)          # zestawy kafli wnętrz / podziemi
ZESTAWY = (8, 9, 10, 11, 12)           # zestawy używane przez mapy gry

ARKUSZE = ["A1", "A2", "A3", "A4", "A5", "B", "C", "D", "E"]

# ------------------------------------------------------------------------------------------------ pliki


def load_json(p):
    with open(p, "rb") as f:
        return json.loads(f.read().decode("utf-8"))


def save_json(p, obj, indent=None):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    txt = json.dumps(obj, ensure_ascii=False, indent=indent, separators=(",", ":") if indent is None else (",", ": "))
    with open(p, "wb") as f:
        f.write(txt.encode("utf-8"))


def save_text(p, txt):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "wb") as f:
        f.write(txt.replace("\r\n", "\n").encode("utf-8"))


_MAPINFOS = None


def map_infos():
    global _MAPINFOS
    if _MAPINFOS is None:
        _MAPINFOS = {m["id"]: m for m in load_json(DATA + "MapInfos.json") if m}
    return _MAPINFOS


def map_name(mid):
    m = map_infos().get(mid)
    return m["name"] if m else "Map%03d" % mid


def all_map_ids():
    return sorted(int(re.search(r"Map(\d+)\.json$", p).group(1)) for p in glob.glob(DATA + "Map[0-9][0-9][0-9].json"))


_FONTS = {}


def font(size, bold=False):
    key = (size, bold)
    if key not in _FONTS:
        for p in (("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"), "C:/Windows/Fonts/segoeui.ttf"):
            if os.path.exists(p):
                _FONTS[key] = ImageFont.truetype(p, size)
                break
        else:
            _FONTS[key] = ImageFont.load_default()
    return _FONTS[key]

# ------------------------------------------------------------------------------------------------ tablice autokafli (rmmz_core.js)


FLOOR = [
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
WALL = [
    [[2,2],[1,2],[2,1],[1,1]],[[0,2],[1,2],[0,1],[1,1]],[[2,0],[1,0],[2,1],[1,1]],[[0,0],[1,0],[0,1],[1,1]],
    [[2,2],[3,2],[2,1],[3,1]],[[0,2],[3,2],[0,1],[3,1]],[[2,0],[3,0],[2,1],[3,1]],[[0,0],[3,0],[0,1],[3,1]],
    [[2,2],[1,2],[2,3],[1,3]],[[0,2],[1,2],[0,3],[1,3]],[[2,0],[1,0],[2,3],[1,3]],[[0,0],[1,0],[0,3],[1,3]],
    [[2,2],[3,2],[2,3],[3,3]],[[0,2],[3,2],[0,3],[3,3]],[[2,0],[3,0],[2,3],[3,3]],[[0,0],[3,0],[0,3],[3,3]]]
WATERFALL = [[[2,0],[1,0],[2,3],[1,3]],[[0,0],[1,0],[0,3],[1,3]],[[2,0],[3,0],[2,3],[3,3]],[[0,0],[3,0],[0,3],[3,3]]]

DIRS = {2: (0, 1), 4: (-1, 0), 6: (1, 0), 8: (0, -1)}
REV = {2: 8, 8: 2, 4: 6, 6: 4}
BIT = {2: 0x01, 4: 0x02, 6: 0x04, 8: 0x08}

# ------------------------------------------------------------------------------------------------ zestaw kafli


def arkusz(tid):
    """nazwa arkusza kafla: A1..A5, B..E (None dla 0 i nieużywanych numerów)"""
    if tid <= 0: return None
    if tid >= 2048:
        k = (tid - 2048) // 48
        return "A1" if k < 16 else "A2" if k < 48 else "A3" if k < 80 else "A4" if k < 128 else None
    if 1536 <= tid < 1664: return "A5"
    if tid < 1024: return "BCDE"[tid // 256]
    return None


def kol_wiersz(tid):
    """kolumna i wiersz kafla na jego arkuszu (B-E: 16 x 16, A5: 8 x 16)"""
    if 1536 <= tid < 1664:
        t = tid - 1536
        return t % 8, t // 8
    return (tid // 128) % 2 * 8 + tid % 8, (tid % 256) // 8 % 16


def z_kol_wiersza(sheet, col, row):
    """numer kafla B-E z kolumny i wiersza arkusza"""
    base = "BCDE".index(sheet) * 256
    return base + (128 if col >= 8 else 0) + row * 8 + col % 8


def rodzaj_autokafla(tid):
    return (tid - 2048) // 48 if tid >= 2048 else None


def baza_autokafla(kind):
    return 2048 + kind * 48


class Zestaw:
    """zestaw kafli z data/Tilesets.json: flagi i obrazki"""

    def __init__(self, tsid):
        ts = load_json(DATA + "Tilesets.json")[tsid]
        self.id = tsid
        self.nazwa = ts["name"]
        self.pliki = ts["tilesetNames"]
        fl = list(ts["flags"])
        self.flag_len = len(fl)
        self.flags = fl + [0] * max(0, 8192 - len(fl))
        self._sheets, self._tiles, self._alpha, self._bbox = {}, {}, {}, {}

    def sheet(self, i):
        if i not in self._sheets:
            n = self.pliki[i] if i < len(self.pliki) else ""
            p = ROOT + "img/tilesets/" + n + ".png"
            self._sheets[i] = Image.open(p).convert("RGBA") if n and os.path.exists(p) else None
        return self._sheets[i]

    def sheet_of(self, tid):
        a = arkusz(tid)
        return ARKUSZE.index(a) if a else None

    def flag(self, tid):
        return self.flags[tid] if 0 <= tid < 8192 else 0

    def tile(self, tid):
        """obrazek kafla 48x48 RGBA (autokafel w kształcie zapisanym w numerze)"""
        if tid in self._tiles: return self._tiles[tid]
        img = Image.new("RGBA", (T, T), (0, 0, 0, 0))
        if tid >= 2048:
            kind, shape = (tid - 2048) // 48, (tid - 2048) % 48
            tx, ty = kind % 8, kind // 8
            table, sheet = FLOOR, None
            if kind < 16:                       # A1: woda, płaska klatka 0
                sheet = self.sheet(0)
                if kind == 0: bx, by = 0, 0
                elif kind == 1: bx, by = 0, 3
                elif kind == 2: bx, by = 6, 0
                elif kind == 3: bx, by = 6, 3
                else:
                    bx = (tx // 4) * 8
                    by = ty * 6 + ((tx // 2) % 2) * 3
                    if kind % 2 == 1:
                        bx += 6; table = WATERFALL
            elif kind < 48:
                sheet = self.sheet(1); bx, by = tx * 2, (ty - 2) * 3
            elif kind < 80:
                sheet = self.sheet(2); bx, by = tx * 2, (ty - 6) * 2; table = WALL
            else:
                sheet = self.sheet(3); bx = tx * 2
                by = int((ty - 10) * 2.5 + (0.5 if ty % 2 == 1 else 0))
                if ty % 2 == 1: table = WALL
            q = table[shape] if shape < len(table) else table[0]
            if sheet is not None:
                for i in range(4):
                    qsx, qsy = q[i]
                    sx, sy = (bx * 2 + qsx) * H1, (by * 2 + qsy) * H1
                    if sx + H1 <= sheet.width and sy + H1 <= sheet.height:
                        img.alpha_composite(sheet.crop((sx, sy, sx + H1, sy + H1)), ((i % 2) * H1, (i // 2) * H1))
        elif tid > 0:
            sn = 4 if 1536 <= tid < 2048 else 5 + tid // 256
            sheet = self.sheet(sn) if sn < 9 else None
            if sheet is not None:
                if sn == 4:
                    c, r = kol_wiersz(tid)
                    sx, sy = c * T, r * T
                else:
                    sx = ((tid // 128) % 2 * 8 + tid % 8) * T
                    sy = ((tid % 256) // 8 % 16) * T
                if sx + T <= sheet.width and sy + T <= sheet.height:
                    img = sheet.crop((sx, sy, sx + T, sy + T))
        self._tiles[tid] = img
        return img

    def alfa(self, tid):
        """maska nieprzezroczystych pikseli kafla (48x48 bool)"""
        if tid not in self._alpha:
            self._alpha[tid] = np.array(self.tile(tid))[:, :, 3] > 40 if tid > 0 else np.zeros((T, T), bool)
        return self._alpha[tid]

    def pusty(self, tid):
        return not self.alfa(tid).any()

    def pokrycie(self, tid):
        return float(self.alfa(tid).mean())

    def bbox(self, tid):
        """prostokąt nieprzezroczystych pikseli kafla (x0, y0, x1, y1) albo None"""
        if tid not in self._bbox:
            a = self.alfa(tid)
            ys, xs = np.where(a)
            self._bbox[tid] = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())) if len(xs) else None
        return self._bbox[tid]

    # ---- flagi
    def gwiazdka(self, tid): return bool(self.flag(tid) & 0x10)
    def drabina(self, tid): return bool(self.flag(tid) & 0x20)
    def krzak(self, tid): return bool(self.flag(tid) & 0x40)
    def lada(self, tid): return bool(self.flag(tid) & 0x80)
    def uszkadza(self, tid): return bool(self.flag(tid) & 0x100)
    def teren(self, tid): return (self.flag(tid) >> 12) & 0xF

    def przejscie(self, tid):
        """'X' blokuje, 'O' przechodni, '*' gwiazdka (nie wpływa), albo kierunki zablokowane np. 'blok:2,8'"""
        f = self.flag(tid)
        if f & 0x10: return "*"
        p = f & 0x0F
        if p == 0x0F: return "X"
        if p == 0: return "O"
        return "blok:" + ",".join(str(d) for d in (2, 4, 6, 8) if p & BIT[d])


_ZESTAWY = {}


def zestaw(tsid):
    if tsid not in _ZESTAWY: _ZESTAWY[tsid] = Zestaw(tsid)
    return _ZESTAWY[tsid]

# ------------------------------------------------------------------------------------------------ grafiki postaci / obiektów


_CHAR, _FRAME = {}, {}


def char_sheet(name):
    if name not in _CHAR:
        p = CHARS + name + ".png"
        _CHAR[name] = Image.open(p).convert("RGBA") if os.path.exists(p) else None
    return _CHAR[name]


def is_big(name):
    return "$" in re.match(r"^[!$]*", name).group(0)


def frame(name, index, direction, pattern):
    """klatka grafiki (RGBA) albo None"""
    key = (name, index, direction, pattern)
    if key not in _FRAME:
        bm = char_sheet(name)
        if bm is None:
            _FRAME[key] = None
        else:
            big = is_big(name)
            pw, ph = bm.width // (3 if big else 12), bm.height // (4 if big else 8)
            bx = 0 if big else index % 4 * 3
            by = 0 if big else index // 4 * 4
            d = direction if direction in (2, 4, 6, 8) else 2
            sx, sy = (bx + pattern) * pw, (by + (d - 2) // 2) * ph
            _FRAME[key] = bm.crop((sx, sy, sx + pw, sy + ph))
    return _FRAME[key]


def tree_scale(note):
    m = re.search(r"<Tree:[^>]*scale=([0-9.]+)", note or "")
    return float(m.group(1)) if m else 1.0

# ------------------------------------------------------------------------------------------------ obszary zajęte (ChoppableTree)


_SOLID = None


def solid_graphics():
    """tabela SOLID_GRAPHICS z js/plugins/ChoppableTree.js: grafika -> {left, right, up, down, soft}"""
    global _SOLID
    if _SOLID is None:
        _SOLID = {}
        try:
            with open(ROOT + "js/plugins/ChoppableTree.js", "rb") as f:
                src = f.read().decode("utf-8")
            m = re.search(r"const SOLID_GRAPHICS = \{(.*?)\n    \};", src, re.S)
            if m:
                for name, body in re.findall(r'"([^"]+)":\s*\{([^}]*)\}', m.group(1)):
                    _SOLID[name] = {k: int(v) for k, v in re.findall(r"(\w+):\s*(\d+)", body)}
        except OSError:
            pass
    return _SOLID


def occupy_tag(note):
    m = re.search(r"<Occupy:([^>]*)>", note or "", re.I)
    if not m: return None
    out = {}
    for k, v in re.findall(r"(\w+)\s*=\s*(-?\d+)", m.group(1)):
        if k in ("left", "right", "up", "down", "soft"): out[k] = int(v)
    return out

# ------------------------------------------------------------------------------------------------ zdarzenia


def page_shown(e):
    """strona widoczna w nowej grze: ostatnia strona bez warunków (None: zdarzenie niewidoczne i nie blokuje)"""
    for pg in reversed(e["pages"]):
        c = pg["conditions"]
        if not any(c.get(k) for k in ("switch1Valid", "switch2Valid", "variableValid", "selfSwitchValid", "itemValid", "actorValid")):
            return pg
    return None


TAGI_NATURY = ("<Tree", "<Rock", "<Bush", "<Stump", "<Log")
NATURA_RX = re.compile(r"^!?\$?(Rock|Bush|Tree|Pine|Stump|Trunk|Log|Boulder|Big_Trees|Mushroom|Flower|Grass|Fern)", re.I)


class Zdarzenie:
    def __init__(self, e, mapa):
        self.e = e
        self.id = e["id"]
        self.name = e.get("name", "")
        self.x, self.y = e["x"], e["y"]
        self.note = e.get("note", "") or ""
        self.page = page_shown(e)
        pg = self.page
        self.img = pg["image"] if pg else {"tileId": 0, "characterName": "", "characterIndex": 0, "direction": 2, "pattern": 0}
        self.prio = pg["priorityType"] if pg else 0
        self.through = pg["through"] if pg else True
        self.trigger = pg["trigger"] if pg else None
        self.char = self.img.get("characterName") or ""
        self.tile_id = self.img.get("tileId") or 0
        self.widoczne = bool(self.char or self.tile_id)
        self.obiekt = self.char.startswith("!") or bool(self.tile_id)
        self.postac = bool(self.char) and not self.char.startswith("!")
        self.komendy = [c for p in e["pages"] for c in p["list"] if c["code"] not in (0, 108, 408)]
        self.komendy_strony = [c for c in (pg["list"] if pg else []) if c["code"] not in (0, 108, 408)]
        self.przeniesienia = [tuple(c["parameters"][1:4]) for p in e["pages"] for c in p["list"]
                              if c["code"] == 201 and c["parameters"] and c["parameters"][0] == 0]
        self.przenosi = any(c["code"] == 201 for p in e["pages"] for c in p["list"])
        self.drzwi = self.przenosi or "<Drzwi" in self.note or bool(re.match(r"^(Drzwi|Wyj[sś]cie|Wej[sś]cie)", self.name))
        self.natura = any(t in self.note for t in TAGI_NATURY) or bool(NATURA_RX.match(self.char))
        self.blokuje = bool(pg) and self.prio == 1 and not self.through
        o = None
        sg = solid_graphics().get(self.char) if self.char else None
        tg = occupy_tag(self.note)
        if sg or tg:
            o = {"left": 0, "right": 0, "up": 0, "down": 0, "soft": 0}
            o.update(sg or {}); o.update(tg or {})
        self.occupy = o
        m = re.search(r"<Px:(-?\d+),(-?\d+)>", self.note, re.I)        # obrazek przesunięty o piksele (TawernaCore)
        self.px = (int(m.group(1)), int(m.group(2))) if m else (0, 0)
        self._sprite = None

    def klucz(self):
        """klucz grafiki do profili w katalogu"""
        if self.tile_id: return "kafel:%d" % self.tile_id
        im = self.img
        return "%s|%d|%d|%d" % (self.char, im.get("characterIndex", 0), im.get("direction", 2), im.get("pattern", 0))

    def komorki(self):
        """kratki zajęte (pos z ChoppableTree: <Occupy> albo SOLID_GRAPHICS)"""
        o = self.occupy
        if not o: return [(self.x, self.y)]
        return [(x, y) for y in range(self.y - o["up"], self.y + o["down"] + 1)
                for x in range(self.x - o["left"], self.x + o["right"] + 1)]

    def komorki_blokujace(self):
        """kratki, na które gracz nie wejdzie (bez miękkich brzegów krzaków)"""
        o = self.occupy
        cells = self.komorki()
        if not o or not o.get("soft"): return cells
        s = o["soft"]
        l, r, t, b = self.x - o["left"], self.x + o["right"], self.y - o["up"], self.y + o["down"]
        if r - l + 1 <= 2 * s or b - t + 1 <= 2 * s: return cells
        return [(x, y) for (x, y) in cells if not (x < l + s or x > r - s or y < t + s or y > b - s)]

    def sprite(self, zest):
        """(obraz RGBA, x0, y0) w pikselach mapy albo None"""
        if self._sprite is not None: return self._sprite or None
        out = False
        if self.tile_id:
            out = (zest.tile(self.tile_id), self.x * T, self.y * T)
        elif self.char:
            fr = frame(self.char, self.img.get("characterIndex", 0), self.img.get("direction", 2), self.img.get("pattern", 0))
            if fr is not None:
                sc = tree_scale(self.note)
                if sc != 1.0:
                    fr = fr.resize((max(1, round(fr.width * sc)), max(1, round(fr.height * sc))), Image.LANCZOS)
                shift = 0 if self.char.startswith("!") else 6
                out = (fr, self.x * T + H1 - fr.width // 2, self.y * T + T - shift - fr.height)
        if out and self.px != (0, 0):
            out = (out[0], out[1] + self.px[0], out[2] + self.px[1])
        self._sprite = out
        return out or None

    def bbox(self, zest, th=120):
        """prostokąt pikseli obrazu (alfa > th: bez miękkiej poświaty płomieni) w pikselach mapy (x0, y0, x1, y1) albo None"""
        sp = self.sprite(zest)
        if not sp: return None
        im, x0, y0 = sp
        a = np.array(im)[:, :, 3] > th
        ys, xs = np.where(a)
        if not len(xs): return None
        return (x0 + int(xs.min()), y0 + int(ys.min()), x0 + int(xs.max()), y0 + int(ys.max()))

    def maska(self, zest, th=40):
        """(maska bool, x0, y0)"""
        sp = self.sprite(zest)
        if not sp: return None
        im, x0, y0 = sp
        return np.array(im)[:, :, 3] > th, x0, y0

# ------------------------------------------------------------------------------------------------ mapa


_TRANSFERY = None


def przeniesienia_do_map():
    """{mapId: [(x, y, skąd)]}: przeniesienia gracza ze wszystkich map, zdarzeń wspólnych, startu gry i (dosłowne liczby)
    z wtyczek js/plugins (reserveTransfer(map, x, y))"""
    global _TRANSFERY
    if _TRANSFERY is not None: return _TRANSFERY
    out = {}

    def add(mid, x, y, src):
        out.setdefault(mid, []).append((x, y, src))
    for mid in all_map_ids():
        try:
            d = load_json(DATA + "Map%03d.json" % mid)
        except Exception:
            continue
        for e in d["events"]:
            if not e: continue
            for p in e["pages"]:
                for c in p["list"]:
                    if c["code"] == 201 and c["parameters"] and c["parameters"][0] == 0:
                        add(c["parameters"][1], c["parameters"][2], c["parameters"][3], "Map%03d:%d" % (mid, e["id"]))
    try:
        for ce in load_json(DATA + "CommonEvents.json"):
            if not ce: continue
            for c in ce["list"]:
                if c["code"] == 201 and c["parameters"] and c["parameters"][0] == 0:
                    add(c["parameters"][1], c["parameters"][2], c["parameters"][3], "CE%d" % ce["id"])
    except Exception:
        pass
    try:
        s = load_json(DATA + "System.json")
        add(s["startMapId"], s["startX"], s["startY"], "start gry")
    except Exception:
        pass
    rx = re.compile(r"reserveTransfer\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)")
    for p in glob.glob(ROOT + "js/plugins/*.js"):
        try:
            with open(p, "rb") as f:
                src = f.read().decode("utf-8", "replace")
        except OSError:
            continue
        for m in rx.finditer(src):
            add(int(m.group(1)), int(m.group(2)), int(m.group(3)), os.path.basename(p))
    _TRANSFERY = out
    return out


_ORZEL = None


def tylko_z_orla():
    """{mapId: [(x, y)]} ziarna miejsc dostępnych tylko z orła (Okolice_Data.js / Zakon_Data.js: mode "eagle")"""
    global _ORZEL
    if _ORZEL is None:
        _ORZEL = {}
        rx = re.compile(r'map:\s*(\d+)[^\n]*?mode:\s*"eagle"[^\n]*?seed:\s*\[(\d+),\s*(\d+)\]')
        for n in ("Okolice_Data.js", "Zakon_Data.js"):
            try:
                with open(ROOT + "js/plugins/" + n, "rb") as f:
                    src = f.read().decode("utf-8", "replace")
            except OSError:
                continue
            for m in rx.finditer(src):
                _ORZEL.setdefault(int(m.group(1)), set()).add((int(m.group(2)), int(m.group(3))))
    return _ORZEL


RL = {1: "pod", 2: "rowno", 3: "nad"}     # RegionLayers.js (parametry below=1, level=2, above=3)


def podnoszony(t):
    """kafel, który region 3 (RegionLayers) rysuje nad bohaterem: B-E, A3, A4"""
    if t <= 0: return False
    if t < 1536: return True
    if t >= 2048:
        k = (t - 2048) // 48
        return 48 <= k < 128
    return False


class Mapa:
    def __init__(self, mid, path=None, raw=None):
        """mapa z data/ (albo z pliku path, albo ze słownika raw - np. kopia robocza w pamięci)"""
        self.id = mid
        self.path = path or DATA + "Map%03d.json" % mid
        if raw is None: raw = load_json(self.path)
        self.raw = raw
        self.W, self.H = raw["width"], raw["height"]
        self.tsid = raw["tilesetId"]
        self.zest = zestaw(self.tsid)
        self.data = raw["data"]
        self.note = raw.get("note", "") or ""
        self.nazwa = map_name(mid)
        self.zd = [Zdarzenie(e, self) for e in raw["events"] if e]
        self.wnetrze = self.tsid in WNETRZA_ZESTAWY
        self._ev_block = None
        self._tile_ev = None

    def inside(self, x, y):
        return 0 <= x < self.W and 0 <= y < self.H

    def t(self, z, x, y):
        if not self.inside(x, y): return 0
        return self.data[(z * self.H + y) * self.W + x]

    def region(self, x, y):
        return self.t(5, x, y)

    def gorne(self, x, y):
        """kafle B-E / A5 na warstwach 2 i 3 (od góry)"""
        return [t for t in (self.t(3, x, y), self.t(2, x, y)) if t]

    def tile_events(self):
        if self._tile_ev is None:
            d = {}
            for e in self.zd:
                if e.tile_id and e.prio == 0 and e.page:
                    d.setdefault((e.x, e.y), []).append(e.tile_id)
            self._tile_ev = d
        return self._tile_ev

    def rl(self, x, y):
        """RegionLayers.js: region 1 'pod' (zawsze przechodnie), 2 'rowno' (zawsze blokuje), 3 'nad' (kafle budynków i B-E
        rysowane nad bohaterem, przejście wg gruntu pod nimi); inaczej None"""
        return RL.get(self.t(5, x, y))

    def check_passage(self, x, y, bit, layers=(3, 2, 1, 0), with_events=True):
        """Game_Map.checkPassage: od górnej warstwy, gwiazdki pomijane, pierwsza decyduje (z regionami RegionLayers.js)"""
        r = self.rl(x, y) if layers == (3, 2, 1, 0) else None
        if r == "pod": return True
        if r == "rowno": return False
        tiles = (self.tile_events().get((x, y), []) if with_events else []) + [self.t(z, x, y) for z in layers]
        if r == "nad": tiles = [t for t in tiles if not podnoszony(t)]
        fl = self.zest.flags
        for t in tiles:
            f = fl[t] if 0 <= t < 8192 else 0
            if f & 0x10: continue
            if (f & bit) == 0: return True
            if (f & bit) == bit: return False
        return r == "nad"

    def nad_postacia(self, t, x, y):
        """kafel rysowany nad bohaterem: gwiazdka albo kafel podniesiony regionem 3"""
        return self.zest.gwiazdka(t) or (self.rl(x, y) == "nad" and podnoszony(t))

    def przechodnia(self, x, y, d, layers=(3, 2, 1, 0)):
        return self.check_passage(x, y, BIT[d], layers)

    def kratka_wolna(self, x, y, layers=(3, 2, 1, 0)):
        """kratka, na której da się stanąć: przechodnia w którymś kierunku"""
        if not self.inside(x, y): return False
        return any(self.check_passage(x, y, BIT[d], layers) for d in (2, 4, 6, 8))

    def teren(self, x, y):
        """kratka ma podłoże (kafel na warstwie 0 albo 1)"""
        return bool(self.t(0, x, y) or self.t(1, x, y))

    def sciana(self, x, y):
        """kratka zablokowana już przez warstwy 0-1 (ściana, strop, urwisko, woda)"""
        if not self.teren(x, y): return True
        return not any(self.check_passage(x, y, BIT[d], (1, 0), False) for d in (2, 4, 6, 8))

    def lico_sciany(self, x, y):
        """ściana z licem (A3 albo nieparzysty wiersz A4) - tam wiszą obrazy, okna, półki"""
        if not self.sciana(x, y): return False
        for z in (1, 0):
            t = self.t(z, x, y)
            if t >= 2048:
                k = rodzaj_autokafla(t)
                if 48 <= k < 80: return True
                if k >= 80 and ((k - 80) // 8) % 2 == 1: return True
        return False

    def ev_block(self):
        """{(x, y): [zdarzenia blokujące]}"""
        if self._ev_block is None:
            d = {}
            for e in self.zd:
                if not e.blokuje: continue
                for c in e.komorki_blokujace():
                    d.setdefault(c, []).append(e)
            self._ev_block = d
        return self._ev_block

    def mozna_wejsc(self, x, y, d):
        """gracz z (x, y) w stronę d (jak Game_CharacterBase.canPass, bez pojazdów)"""
        dx, dy = DIRS[d]
        x2, y2 = x + dx, y + dy
        if not self.inside(x2, y2): return False
        if not self.przechodnia(x, y, d): return False
        if not self.przechodnia(x2, y2, REV[d]): return False
        if (x2, y2) in self.ev_block(): return False
        return True

    def stoi(self, x, y):
        """da się tu stać (kafle przechodnie, podłoże, bez blokującego zdarzenia)"""
        return self.teren(x, y) and self.kratka_wolna(x, y) and (x, y) not in self.ev_block()

    def flood(self, starts):
        seen = set()
        stack = [s for s in starts if self.inside(*s)]
        for s in stack: seen.add(s)
        while stack:
            x, y = stack.pop()
            for d in (2, 4, 6, 8):
                if self.mozna_wejsc(x, y, d):
                    dx, dy = DIRS[d]
                    n = (x + dx, y + dy)
                    if n not in seen:
                        seen.add(n); stack.append(n)
        return seen

    # ---- wejścia
    def przybycia(self):
        """[(x, y, skąd)] miejsca, w których gracz pojawia się na tej mapie"""
        return list(przeniesienia_do_map().get(self.id, []))

    def krawedzie_otwarte(self):
        """strony mapy otwarte dla Krawedzie.js (jest na nich zdarzenie przeniesienia): {'N','S','W','E'}"""
        if re.search(r"<EdgeWalk:\s*off>", self.note, re.I): return set()
        out = set()
        for e in self.zd:
            if not e.przenosi: continue
            if e.y == 0: out.add("N")
            if e.y == self.H - 1: out.add("S")
            if e.x == 0: out.add("W")
            if e.x == self.W - 1: out.add("E")
        return out

    def starty(self):
        """kratki startowe flood fill: miejsca przybycia, kratki obok wyjść, otwarte krawędzie"""
        st = []
        for (x, y, src) in self.przybycia():
            if self.inside(x, y) and self.stoi(x, y): st.append((x, y))
        for side in self.krawedzie_otwarte():
            if side in "NS":
                yy = 0 if side == "N" else self.H - 1
                st += [(x, yy) for x in range(self.W) if self.stoi(x, yy)]
            else:
                xx = 0 if side == "W" else self.W - 1
                st += [(xx, y) for y in range(self.H) if self.stoi(xx, y)]
        return st

# ------------------------------------------------------------------------------------------------ render


def render(mp, region=None, grid=False, hide=None, marks=None, scale=1.0, dim=None):
    """obraz mapy (RGBA). region=(x0, y0, x1, y1) kratki włącznie; marks=[(x, y, (r,g,b), etykieta)];
    dim: zbiór kratek do przyciemnienia (np. poza obszarem przeglądu)"""
    W, H = mp.W, mp.H
    x0, y0, x1, y1 = region or (0, 0, W - 1, H - 1)
    S = mp.zest
    w, h = (x1 - x0 + 1) * T, (y1 - y0 + 1) * T
    lower = Image.new("RGBA", (w, h), (20, 18, 30, 255))
    upper = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shade = Image.new("RGBA", (H1, H1), (0, 0, 0, 128))
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            px, py = (x - x0) * T, (y - y0) * T
            for z in (0, 1):
                t = mp.t(z, x, y)
                if t: (upper if mp.nad_postacia(t, x, y) else lower).alpha_composite(S.tile(t), (px, py))
            sb = mp.t(4, x, y)
            for i in range(4):
                if sb & (1 << i): lower.alpha_composite(shade, (px + (i % 2) * H1, py + (i // 2) * H1))
            for z in (2, 3):
                t = mp.t(z, x, y)
                if t: (upper if mp.nad_postacia(t, x, y) else lower).alpha_composite(S.tile(t), (px, py))
    sprites = []
    for e in mp.zd:
        if hide and hide(e): continue
        if not e.page or not e.widoczne: continue
        if not (x0 - 4 <= e.x <= x1 + 4 and y0 - 2 <= e.y <= y1 + 8): continue
        z = {0: 1, 1: 3, 2: 5}.get(e.prio, 3)
        sprites.append((z, e.y, e.id, e))
    sprites.sort(key=lambda s: (s[0], s[1], s[2]))
    out = lower
    done = False
    for z, _, _, e in sprites:
        if z > 4 and not done:
            out.alpha_composite(upper); done = True
        sp = e.sprite(S)
        if not sp: continue
        im, sx, sy = sp
        _paste(out, im, sx - x0 * T, sy - y0 * T)
    if not done: out.alpha_composite(upper)
    d = ImageDraw.Draw(out, "RGBA")
    if dim:
        ov = Image.new("RGBA", (T, T), (0, 0, 0, 150))
        for (cx, cy) in dim:
            if x0 <= cx <= x1 and y0 <= cy <= y1: out.alpha_composite(ov, ((cx - x0) * T, (cy - y0) * T))
    if grid:
        for gx in range(0, w + 1, T): d.line([(gx, 0), (gx, h)], fill=(255, 255, 255, 46))
        for gy in range(0, h + 1, T): d.line([(0, gy), (w, gy)], fill=(255, 255, 255, 46))
    if marks:
        f = font(15, True)
        ov = Image.new("RGBA", out.size, (0, 0, 0, 0))
        do = ImageDraw.Draw(ov)
        for (mx, my, col, lab) in marks:
            if not (x0 <= mx <= x1 and y0 <= my <= y1): continue
            px, py = (mx - x0) * T, (my - y0) * T
            do.rectangle([px + 3, py + 3, px + T - 4, py + T - 4], fill=col + (60,))
        out.alpha_composite(ov)
        d = ImageDraw.Draw(out)
        for (mx, my, col, lab) in marks:
            if not (x0 <= mx <= x1 and y0 <= my <= y1): continue
            px, py = (mx - x0) * T, (my - y0) * T
            d.rectangle([px + 1, py + 1, px + T - 2, py + T - 2], outline=col + (255,), width=3)
        for (mx, my, col, lab) in marks:
            if not lab or not (x0 <= mx <= x1 and y0 <= my <= y1): continue
            px, py = (mx - x0) * T, (my - y0) * T
            tw = d.textlength(lab, font=f)
            d.rectangle([px + 2, py + 2, px + 6 + tw, py + 20], fill=(0, 0, 0, 215))
            d.text((px + 4, py + 2), lab, fill=col + (255,), font=f)
    if scale != 1.0:
        out = out.resize((max(1, int(out.width * scale)), max(1, int(out.height * scale))), Image.LANCZOS)
    return out


def _paste(dst, src, x, y):
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(dst.width, x + src.width), min(dst.height, y + src.height)
    if x1 <= x0 or y1 <= y0: return
    dst.alpha_composite(src.crop((x0 - x, y0 - y, x1 - x, y1 - y)), (x0, y0))
