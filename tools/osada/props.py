# python tools/osada/props.py  -> img/characters/!Osada_Props.png + tools/osada/props_index.json (+ props/out/preview.png)
# The Silent's own things for the four hut interiors of Osada Milczących (Map121-124), as one RPG Maker character sheet in
# the town interiors' layout (tools/interiors/props.py: 144x144 frames, 8 blocks x 3 patterns x 4 directions; a frame is
# centred on its event's cell - a 1-cell piece in the frame's middle third, a 2-cell piece in its right two thirds with the
# event on the piece's LEFT cell; every piece stands on the frame's bottom).
# Sources: PixelLab Pro Flash pictures in props/src/ made at 2x on the town props' own pictures as the style (SOURCES.txt),
# finished like the tavern's and the town's (tools/tavern/props_upper/make_props.py: premultiplied downscale, hard alpha,
# dark rim, a floor shadow for things standing on the floor).
import os, sys, json
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "tavern", "props_upper"))
import make_props as MP     # noqa: E402  (downscale, outline, with_shadow)

SRC = os.path.join(HERE, "props", "src")
OUT = os.path.join(HERE, "props", "out")
SHEET_NAME = "!Osada_Props"
SHEET = os.path.join(ROOT, "img", "characters", SHEET_NAME + ".png")
INDEX = os.path.join(HERE, "props_index.json")
F = 144


def frame_xy(idx, d, p):
    return (((idx % 4) * 3 + p) * F, ((idx // 4) * 4 + (d // 2 - 1)) * F)


# key, file, block, dir, pattern, downscale, cells wide, place, name, extra
PIECES = [
    ("krosno", "loom.png", 0, 2, 0, 0.67, 2, "floor", "krosno z białym lnem", {"occupy": "right=1"}),
    ("stojak_pasy", "strip_rack.png", 0, 2, 1, 0.5, 2, "floor", "stojak z białymi pasami płótna", {"occupy": "right=1"}),
    ("warsztat_rzezbiarza", "carver_bench.png", 0, 2, 2, 0.5, 2, "floor", "warsztat rzeźbiarza z niedokończonym krukiem", {"occupy": "right=1"}),
    ("tkanina_kruk", "raven_weave.png", 0, 4, 0, 0.5, 1, "wall", "tkanina z krukiem w kręgu", {}),
    ("deski_znaki", "carved_planks.png", 0, 4, 1, 0.5, 1, "floor", "deski pocięte znakami", {}),
    ("polka_kruki", "raven_shelf.png", 0, 4, 2, 0.5, 1, "wall", "półka z drewnianymi krukami", {}),
    ("miska_kamykow", "pebble_bowl.png", 0, 6, 0, 0.5, 1, "table", "miska białych kamyków", {"dx": 12}),   # (between two table cells)
]


class Sheet:
    def __init__(self):
        self.im = Image.new("RGBA", (12 * F, 8 * F), (0, 0, 0, 0))
        self.index = {}

    def put(self, key, idx, d, p, art, cells_w, place, name, dx=0, dy=0, occupy=None):
        fr = Image.new("RGBA", (F, F), (0, 0, 0, 0))
        left = {1: 48, 2: 48, 3: 0}[cells_w]
        x = left + (cells_w * 48 - art.width) // 2 + dx
        y = F - art.height + dy
        if y < 0:
            art = art.crop((0, -y, art.width, art.height)); y = 0
        fr.alpha_composite(art, (x, y))
        self.im.alpha_composite(fr, frame_xy(idx, d, p))
        e = {"sheet": SHEET_NAME, "index": idx, "direction": d, "pattern": p, "place": place, "w": F, "h": F,
             "art": list(fr.getbbox() or (0, 0, 1, 1)), "name": name}
        if occupy: e["occupy"] = occupy
        self.index[key] = e


def build():
    S = Sheet()
    for (key, fname, idx, d, p, scale, w, place, name, extra) in PIECES:
        art = MP.outline(MP.downscale(Image.open(os.path.join(SRC, fname)).convert("RGBA"), scale))
        if place == "floor": art = MP.with_shadow(art)
        dy = {"wall": -6, "table": -30}.get(place, 0)      # (a table thing: its event on the table's lower row)
        S.put(key, idx, d, p, art, w, place, name, dy=dy, **extra)
    S.im.save(SHEET)
    with open(INDEX, "wb") as f:
        f.write(json.dumps(S.index, ensure_ascii=False, indent=1).encode("utf-8"))
    pv = Image.new("RGBA", S.im.size, (70, 60, 70, 255)); pv.alpha_composite(S.im)
    dr = ImageDraw.Draw(pv)
    for k, v in S.index.items():
        fx, fy = frame_xy(v["index"], v["direction"], v["pattern"])
        dr.rectangle((fx, fy, fx + F - 1, fy + F - 1), outline=(20, 20, 20))
        dr.text((fx + 3, fy + 3), k, fill=(255, 255, 0))
    os.makedirs(OUT, exist_ok=True)
    pv.crop((0, 0, 3 * 3 * F, 3 * F)).save(os.path.join(OUT, "preview.png"))
    print("%s: %d props -> %s" % (SHEET_NAME, len(S.index), os.path.relpath(SHEET, ROOT)))


if __name__ == "__main__":
    build()
