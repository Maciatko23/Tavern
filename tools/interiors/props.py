# python props.py  -> img/characters/!House_Town.png + tools/interiors/props_index.json (+ props/out/preview.png)
# The town interiors' own props as an RPG Maker character sheet (144x144 frames: 8 blocks x 3 patterns x 4 directions).
# A frame is centred on its event's cell: a 1-cell-wide piece sits in the frame's middle third, a 2-wide one in its right
# two thirds (the event stands on the piece's LEFT cell), a 3-wide one fills it (the event on the middle cell); every
# piece stands on the frame's bottom (= the bottom of the event's cell).
# Sources, all in the Winlu look:
#   - the same author's Fantasy_Outside_C sheet (carts, hides on frames, wash tub, water barrels, ladder...), cut out;
#   - the Winlu interior !Decoration campfire with the stone ring taken away (embers in the bread oven);
#   - PixelLab Pro Flash pictures in props/src/ (made at 2x on Winlu crops, props/ref; SOURCES.txt), finished like the
#     tavern's (tools/tavern/props_upper/make_props.py: premultiplied downscale, hard alpha, dark rim, floor shadow);
#   - a few drawn here pixel by pixel (chalk tally on the wall).
import os, sys, json
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "tavern", "props_upper"))
import make_props as MP     # noqa: E402  (downscale, outline, with_shadow, place)

SRC = os.path.join(HERE, "props", "src")
OUT = os.path.join(HERE, "props", "out")
SHEET_NAME = "!House_Town"
SHEET = os.path.join(ROOT, "img", "characters", SHEET_NAME + ".png")
INDEX = os.path.join(HERE, "props_index.json")
EXT_C = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Winlu Fantasy Exterior", "tilesets", "Fantasy_Outside_C.png")
F = 144

def ext(c, r, w=1, h=1):
    im = Image.open(EXT_C).convert("RGBA")
    return im.crop((c * 48, r * 48, (c + w) * 48, (r + h) * 48))

def frame_xy(idx, d, p):
    return (((idx % 4) * 3 + p) * F, ((idx // 4) * 4 + (d // 2 - 1)) * F)

class Sheet:
    def __init__(self):
        self.im = Image.new("RGBA", (12 * F, 8 * F), (0, 0, 0, 0))
        self.index = {}
        self.used = set()
    def put(self, key, idx, d, p, art, cells_w, place, name, dx=0, dy=0, anim=False, occupy=None, extra=None):
        """art: the piece (any size); cells_w 1/2/3 sets where it goes in the frame (see the header); dx/dy nudge it"""
        assert (idx, d, p) not in self.used, (key, idx, d, p)
        self.used.add((idx, d, p))
        fr = Image.new("RGBA", (F, F), (0, 0, 0, 0))
        left = {1: 48, 2: 48, 3: 0}[cells_w]
        span = cells_w * 48
        x = left + (span - art.width) // 2 + dx
        y = F - art.height + dy
        fr.alpha_composite(art, (x, max(0, y)) if y >= 0 else (x, 0))
        if y < 0:
            fr = Image.new("RGBA", (F, F), (0, 0, 0, 0)); fr.alpha_composite(art.crop((0, -y, art.width, art.height)), (x, 0))
        fx, fy = frame_xy(idx, d, p)
        self.im.alpha_composite(fr, (fx, fy))
        bb = fr.getbbox() or (0, 0, 1, 1)
        if key:
            e = {"sheet": SHEET_NAME, "index": idx, "direction": d, "pattern": p, "place": place, "w": F, "h": F,
                 "art": list(bb), "name": name}
            if anim: e["anim"] = True
            if occupy: e["occupy"] = occupy
            if extra: e.update(extra)
            self.index[key] = e
    def save(self):
        self.im.save(SHEET)
        with open(INDEX, "wb") as f:
            f.write(json.dumps(self.index, ensure_ascii=False, indent=1).encode("utf-8"))

def embers(p):
    """the campfire of the Winlu interior !Decoration (index 2, dir 4, pattern p) without its stone ring: flames + logs"""
    im = Image.open(os.path.join(ROOT, "img", "characters", "!Decoration.png")).convert("RGBA")
    fr = im.crop(((6 + p) * 48, 96, (7 + p) * 48, 192))
    px = fr.load()
    for y in range(fr.height):
        for x in range(fr.width):
            r, g, b, a = px[x, y]
            if not a: continue
            mx, mn = max(r, g, b), min(r, g, b)
            sat = (mx - mn) / mx if mx else 0
            warm = r >= g >= b * 0.9 and sat > 0.5
            inner = ((x - 24) / 13.0) ** 2 + ((y - 74) / 15.0) ** 2 <= 1.0 or y < 66
            if not (warm and inner) or (a < 200 and mx < 200): px[x, y] = (0, 0, 0, 0)
    return fr.crop(fr.getbbox())

def chalk_tally():
    """chalk strokes on a wall face (the bell's code: 3, 1 - 2, 2 - 3, 1 ...), white-grey, a little uneven"""
    im = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    groups = [(3, 1), (2, 2), (3, 1), (1, 3)]
    y = 6
    for (a, b) in groups:
        x = 5
        for i in range(a):
            d.line((x, y, x + (i % 2), y + 7), fill=(226, 222, 210, 235)); x += 3
        x += 4
        for i in range(b):
            d.line((x, y, x + ((i + 1) % 2), y + 7), fill=(226, 222, 210, 235)); x += 3
        y += 10
    return im

def build():
    S = Sheet()
    # ---- block 0: the bread oven's embers (3 patterns, step anime), 1 cell; and more fire things later
    for p in range(3):
        e = embers(p)
        S.put("zar_piec" if p == 0 else None, 0, 2, p, e, 1, "floor", "żar w piecu chlebowym (animowany)", anim=True)
    # ---- block 0 dir 4: carts (2 wide), dir 6: hides on frames, dir 8: water things
    S.put("woz_beczki", 0, 4, 0, ext(12, 8, 2, 2).crop(ext(12, 8, 2, 2).getbbox()), 2, "floor",
          "wóz z beczkami i dzbanami", occupy="right=1")
    S.put("taczka", 0, 4, 1, ext(10, 6, 2, 2).crop(ext(10, 6, 2, 2).getbbox()), 2, "floor", "wózek ręczny", occupy="right=1")
    S.put("woz_siano", 0, 4, 2, ext(10, 8, 2, 2).crop(ext(10, 8, 2, 2).getbbox()), 2, "floor", "wózek z sianem", occupy="right=1")
    S.put("skora_rama", 0, 6, 0, ext(1, 2, 1, 2).crop(ext(1, 2, 1, 2).getbbox()), 1, "floor", "skóra rozpięta na ramie")
    S.put("skora_rama2", 0, 6, 1, ext(2, 2, 1, 2).crop(ext(2, 2, 1, 2).getbbox()), 1, "floor", "skóra na pochyłej ramie")
    S.put("kowadlo", 0, 6, 2, ext(3, 2, 1, 2).crop(ext(3, 2, 1, 2).getbbox()), 1, "floor", "kowadło")
    S.put("balia_tarka", 0, 8, 0, ext(3, 10, 1, 1).crop(ext(3, 10, 1, 1).getbbox()), 1, "floor", "balia z tarą")
    S.put("cebrzyk_woda", 0, 8, 1, ext(4, 10, 1, 1).crop(ext(4, 10, 1, 1).getbbox()), 1, "floor", "cebrzyk z wodą")
    S.put("wiadro_woda", 0, 8, 2, ext(5, 7, 1, 1).crop(ext(5, 7, 1, 1).getbbox()), 1, "floor", "wiadro z wodą")
    # ---- block 1: barrels and boards of the exterior set
    S.put("beczka_woda_otwarta", 1, 2, 0, ext(3, 8, 1, 2).crop(ext(3, 8, 1, 2).getbbox()), 1, "floor", "beczka z wodą (otwarta)")
    S.put("beczka_dzban", 1, 2, 1, ext(4, 6, 1, 2).crop(ext(4, 6, 1, 2).getbbox()), 1, "floor", "beczka z dzbanem")
    S.put("tablica_kartki", 1, 2, 2, ext(0, 13, 1, 2).crop(ext(0, 13, 1, 2).getbbox()), 1, "floor", "tablica z kartkami (deski)")
    S.put("drabina", 1, 4, 0, ext(0, 3, 1, 3).crop(ext(0, 3, 1, 3).getbbox()), 1, "floor", "drabina oparta o ścianę")
    S.put("szlifierka", 1, 4, 1, ext(1, 4, 1, 2).crop(ext(1, 4, 1, 2).getbbox()), 1, "floor", "toczydło (kamień szlifierski)")
    S.put("sterta_beczek", 1, 4, 2, MP.with_shadow(ext(2, 11, 3, 2).crop(ext(2, 11, 3, 2).getbbox())), 3, "floor",
          "sterta beczek", occupy="left=1,right=1")
    # ---- block 1 dir 6: drawn here
    S.put("kreda_kreski", 1, 6, 0, chalk_tally(), 1, "wall", "kreski kredą na ścianie (rytm dzwonu)", dy=-6)
    # ---- block 3: Winlu interior frames we need as our own (the stone stairs up in an arch of !Fantasy_door5)
    st = MP.winlu_char("!Fantasy_door5", 0, 2, 0)
    S.put("schody_luk", 3, 2, 0, st.crop(st.getbbox()), 1, "wall", "kamienne schody w łuku (na wieżę)")
    # ---- PixelLab pieces (props/src) - only those already made
    for (key, fname, idx, d, p, scale, w, place, name, extra) in PL:
        path = os.path.join(SRC, fname)
        if not os.path.exists(path): continue
        art = MP.downscale(Image.open(path).convert("RGBA"), scale)
        extra = dict(extra or {})
        if not extra.pop("nooutline", False): art = MP.outline(art)
        if place in ("floor", "floor2"): art = MP.with_shadow(art)
        S.put(key, idx, d, p, art, w, place, name, **extra)
    S.save()
    # a preview: every frame on a mid-grey with its key
    pv = Image.new("RGBA", S.im.size, (70, 60, 70, 255)); pv.alpha_composite(S.im)
    dr = ImageDraw.Draw(pv)
    for k, v in S.index.items():
        fx, fy = frame_xy(v["index"], v["direction"], v["pattern"])
        dr.rectangle((fx, fy, fx + F - 1, fy + F - 1), outline=(20, 20, 20))
        dr.text((fx + 3, fy + 3), k, fill=(255, 255, 0))
    os.makedirs(OUT, exist_ok=True)
    pv.save(os.path.join(OUT, "preview.png"))
    print("%s: %d props" % (SHEET_NAME, len(S.index)))

# PixelLab pieces: key, file in props/src, block, dir, pattern, downscale, cells wide, place, name, extra
PL = [
    ("kruk_plaskorzezba", "raven_relief.png", 2, 2, 0, 0.5, 1, "wall", "kamienna płaskorzeźba z krukiem (znak zakonu)", {}),
    ("kruk_choragiew", "raven_banner.png", 2, 2, 1, 0.5, 1, "wall", "stara czarna chorągiew z krukiem", {}),
    ("lawa_szewska", "cobbler_bench.png", 2, 4, 0, 0.5, 2, "floor", "ława szewska z kopytami i butem", {"occupy": "right=1"}),
    ("polka_buty", "shoe_shelf.png", 2, 4, 1, 0.5, 1, "floor", "regał z butami i kopytami szewskimi", {}),
    ("lopata_chleb", "bread_peel.png", 2, 4, 2, 0.5, 1, "floor", "drewniana łopata do chleba", {}),
    ("dzwon", "bell.png", 2, 6, 0, 0.5, 2, "floor", "stary dzwon zakonu na belce", {"occupy": "right=1"}),
    ("mapa_wyspy", "island_map.png", 2, 6, 1, 0.5, 2, "wall", "mapa Kruczej Wyspy", {"nooutline": True}),
    ("niecka_ciasto", "dough_trough.png", 2, 6, 2, 0.5, 1, "table", "niecka z ciastem", {}),
    ("nosidla", "yoke.png", 2, 8, 0, 0.5, 1, "floor", "nosidła z dwoma wiadrami", {}),
    ("zelazna_roza", "iron_rose.png", 2, 8, 1, 0.5, 1, "table", "żelazna róża", {}),
]

if __name__ == "__main__":
    build()
