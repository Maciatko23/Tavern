# A deterministic picture of an RPG Maker MZ map, drawn in Python the way the game's Tilemap and Sprite_Character draw it
# (no game, no clocks, no animation frames): the same input always gives the same bytes.
#   - tiles: A1..A4 autotiles (FLOOR / WALL tables of rmmz_core.js, A1 water only as a flat frame 0), A5 and B..E normal
#     tiles, layer order 0, 1, shadows, 2, 3; tiles with the star flag (0x10) go to the upper pass above the characters
#   - events: the first page with no conditions (the page a new game shows), character frames bottom-centred on the cell
#     ("!" pictures without the 6 px lift), tile-picture events, z order like the game (priority, then y, then id);
#     ChoppableTree's <Tree:...scale=> shrinks a tree around its foot
# Used by render_town.py for the concept pictures (docs/miasteczko/). Nothing here writes data/.
import os, re, json
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
T = 48
H1 = T // 2
WINLU_EXT_CHARS = ROOT + "img/tilesets/Winlu Fantasy Tileset - Exterior/Winlu Fantasy Exterior/characters/"
WINLU_GREEN_CHARS = ROOT + "img/tilesets/Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/characters/"
STAGED_CHARS = os.path.join(HERE, "staging", "characters")

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

def load_json(p):
    with open(p, "rb") as f:
        return json.loads(f.read().decode("utf-8"))

class Sheets:
    """the tileset's sheets and the character sheets, loaded once"""
    def __init__(self, tileset_id, tilesets=None):
        ts = load_json(tilesets or (ROOT + "data/Tilesets.json"))[tileset_id]
        self.flags = ts["flags"]
        self.sets = []
        for n in ts["tilesetNames"]:
            p = n if os.path.isabs(n) else ROOT + "img/tilesets/" + n + ".png"
            self.sets.append(Image.open(p).convert("RGBA") if n else None)
        self.chars = {}
        self.tiles = {}
    def char(self, name):
        if name not in self.chars:
            for d in (STAGED_CHARS + "/", ROOT + "img/characters/", WINLU_EXT_CHARS, WINLU_GREEN_CHARS):
                p = d + name + ".png"
                if os.path.exists(p):
                    self.chars[name] = Image.open(p).convert("RGBA")
                    break
            else:
                if not getattr(self, "lenient", False): raise FileNotFoundError("character sheet " + name)
                self.missing = getattr(self, "missing", set()) | {name}
                self.chars[name] = None
        return self.chars[name]
    def flag(self, tid):
        return self.flags[tid] if 0 <= tid < len(self.flags) else 0

    def tile(self, tid, same=None):
        """one tile (48x48 RGBA) of a normal tile id, or of an autotile id (the shape is in the id)"""
        if tid in self.tiles: return self.tiles[tid]
        img = Image.new("RGBA", (T, T), (0, 0, 0, 0))
        if tid >= 2048:
            kind, shape = (tid - 2048) // 48, (tid - 2048) % 48
            tx, ty = kind % 8, kind // 8
            table, sheet = FLOOR, None
            if kind < 16:                      # A1 (no water in the town: a flat frame 0 so it would show up)
                sheet = self.sets[0]
                if kind == 0: bx, by = 0, 0
                elif kind == 1: bx, by = 0, 3
                elif kind == 2: bx, by = 6, 0
                elif kind == 3: bx, by = 6, 3
                else:
                    bx = (tx // 4) * 8
                    by = ty * 6 + ((tx // 2) % 2) * 3
                    if kind % 2 == 1:
                        bx += 6; table = WATERFALL
            elif kind < 48:                    # A2
                sheet = self.sets[1]; bx, by = tx * 2, (ty - 2) * 3
            elif kind < 80:                    # A3
                sheet = self.sets[2]; bx, by = tx * 2, (ty - 6) * 2; table = WALL
            else:                              # A4
                sheet = self.sets[3]; bx = tx * 2
                by = int((ty - 10) * 2.5 + (0.5 if ty % 2 == 1 else 0))
                if ty % 2 == 1: table = WALL
            q = table[shape] if shape < len(table) else table[0]
            if sheet is not None:
                for i in range(4):
                    qsx, qsy = q[i]
                    sx, sy = (bx * 2 + qsx) * H1, (by * 2 + qsy) * H1
                    img.alpha_composite(sheet.crop((sx, sy, sx + H1, sy + H1)), ((i % 2) * H1, (i // 2) * H1))
        elif tid > 0:
            sn = 4 if 1536 <= tid < 2048 else 5 + tid // 256
            sheet = self.sets[sn] if sn < len(self.sets) else None
            if sheet is not None:
                sx = ((tid // 128) % 2 * 8 + tid % 8) * T
                sy = ((tid % 256) // 8 % 16) * T
                img = sheet.crop((sx, sy, sx + T, sy + T))
        self.tiles[tid] = img
        return img

    def frame(self, name, index, direction, pattern):
        bm = self.char(name)
        if bm is None: return None
        big = "$" in re.match(r"^[!$]*", name).group(0)
        pw, ph = bm.width // (3 if big else 12), bm.height // (4 if big else 8)
        bx = 0 if big else index % 4 * 3
        by = 0 if big else index // 4 * 4
        sx, sy = (bx + pattern) * pw, (by + (direction - 2) // 2) * ph
        return bm.crop((sx, sy, sx + pw, sy + ph))


def first_page(e):
    """the page a new game shows: the highest page whose conditions are all off"""
    for pg in reversed(e["pages"]):
        c = pg["conditions"]
        if not any(c.get(k) for k in ("switch1Valid", "switch2Valid", "variableValid", "selfSwitchValid", "itemValid", "actorValid")):
            return pg
    return None

def tree_scale(note):
    m = re.search(r"<Tree:[^>]*scale=([0-9.]+)", note or "")
    return float(m.group(1)) if m else 1.0


def render(mp, sheets=None, hide=None, tilesets=None):
    """the whole map at 1:1 (48 px a tile) as an RGBA picture. hide(event) -> True leaves an event out."""
    W, H = mp["width"], mp["height"]
    S = sheets or Sheets(mp["tilesetId"], tilesets)
    data = mp["data"]
    at = lambda z, x, y: data[(z * H + y) * W + x]
    lower = Image.new("RGBA", (W * T, H * T), (0, 0, 0, 255))
    upper = Image.new("RGBA", (W * T, H * T), (0, 0, 0, 0))
    shade = Image.new("RGBA", (H1, H1), (0, 0, 0, 128))
    for y in range(H):
        for x in range(W):
            px, py = x * T, y * T
            for z in (0, 1):
                t = at(z, x, y)
                if t:
                    (upper if S.flag(t) & 0x10 else lower).alpha_composite(S.tile(t), (px, py))
            sb = at(4, x, y)
            for i in range(4):
                if sb & (1 << i):
                    lower.alpha_composite(shade, (px + (i % 2) * H1, py + (i // 2) * H1))
            for z in (2, 3):
                t = at(z, x, y)
                if t:
                    (upper if S.flag(t) & 0x10 else lower).alpha_composite(S.tile(t), (px, py))
    # the characters: (screen z, bottom y, id) like the game's sort
    sprites = []
    for e in mp["events"]:
        if not e: continue
        if hide and hide(e): continue
        pg = first_page(e)
        if not pg: continue
        im = pg["image"]
        if not im["characterName"] and not im["tileId"]: continue
        z = {0: 1, 1: 3, 2: 5}[pg["priorityType"]]
        sprites.append((z, e["y"], e["id"], e, im))
    sprites.sort(key=lambda s: (s[0], s[1], s[2]))
    out = lower
    upper_done = False
    for z, y, eid, e, im in sprites:
        if z > 4 and not upper_done:
            out.alpha_composite(upper); upper_done = True
        if im["tileId"]:
            out.alpha_composite(S.tile(im["tileId"]), (e["x"] * T, e["y"] * T))
            continue
        name = im["characterName"]
        fr = S.frame(name, im["characterIndex"], im["direction"], im["pattern"])
        if fr is None: continue
        sc = tree_scale(e.get("note"))
        if sc != 1.0:
            fr = fr.resize((max(1, round(fr.width * sc)), max(1, round(fr.height * sc))), Image.LANCZOS)
        shift = 0 if name.startswith("!") else 6
        bx, by = e["x"] * T + H1, e["y"] * T + T - shift
        _paste(out, fr, bx - fr.width // 2, by - fr.height)
    if not upper_done:
        out.alpha_composite(upper)
    return out

def _paste(dst, src, x, y):
    """alpha_composite that clips at the picture's edges"""
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(dst.width, x + src.width), min(dst.height, y + src.height)
    if x1 <= x0 or y1 <= y0: return
    dst.alpha_composite(src.crop((x0 - x, y0 - y, x1 - x, y1 - y)), (x0, y0))
