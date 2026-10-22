# python tools/orzel/gniazda.py
#   -> img/system/Farm_OrzelKosz.png, Farm_OrzelGniazdo.png, Farm_OrzelGrzeda.png        the eagle's nests (Farming buildings), whole
#   -> img/system/Farm_OrzelKosz_Przod.png, ..._Przod.png                                 their front rims only (the same canvas): drawn
#                                                                                         again over the bird sitting in the bowl
#   -> tools/orzel/gniazda.json   each nest's bowl: its middle (px from the picture's bottom-middle - the building's anchor) and the
#                                 lip's height at the middle (px up from the picture's bottom) - copied into Orzel_Data.js NESTS
# Biały orzeł, gniazda na miarę ptaka (2026-10-18). Raw pictures from PixelLab: tools/orzel/raw3/gn_kosz.png, gn_gniazdo.png,
# gn_grzeda.png. The bowl's opening is an ellipse measured on the raw picture (CAVITY); the front rim is everything below its lower arc
# (and below its middle line beside it). The old pictures go to backup_art_2026-10-18/orzel/ once.
import json, math, os, shutil
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
RAW = os.path.join(HERE, "raw3")
SYS = os.path.join(ROOT, "img", "system")
BACKUP = os.path.join(ROOT, "backup_art_2026-10-18", "orzel")

# raw name -> building picture, the bowl's ellipse on the raw canvas (cx, cy, rx, ry), the x the picture is centred on (the nest's own
# middle - the basket has its water bowl on one side)
NESTS = {
    "orzel_kosz": {"raw": "gn_kosz", "out": "Farm_OrzelKosz", "cavity": (29, 27, 19, 12), "centre": 29},
    "orzel_gniazdo": {"raw": "gn_gniazdo", "out": "Farm_OrzelGniazdo", "cavity": (95, 56, 45, 17), "centre": 93},
    # (the perch made bigger 2026-10-18 - the user: "dalej widać wystające skrzydło z lewej na gnieździe; może obraz gniazda polepszyć,
    # powiększyć": a wider, deeper nest of its own (raw3/gn_grzeda2.png, no tree) with the old one's dead trunk put behind it on the left
    # (trunk: the box of raw3/gn_grzeda.png and where it goes on the nest's canvas, `top` px of room added over it)
    "orzel_grzeda": {"raw": "gn_grzeda2", "out": "Farm_OrzelGrzeda", "cavity": (131, 111, 83, 29), "centre": 131,
                     "trunk": {"raw": "gn_grzeda", "box": (0, 0, 95, 100), "at": (8, -22), "top": 70}},
}


SIDE = 6   # the side walls' front edge: it rises this many x ry for each rx outwards from the opening's end


def backup(name):
    src = os.path.join(SYS, name + ".png")
    dst = os.path.join(BACKUP, name + "_przed_gniazdami.png")
    if os.path.exists(src) and not os.path.exists(dst):
        os.makedirs(BACKUP, exist_ok=True)
        shutil.copy2(src, dst)


def build(key, cfg):
    raw = Image.open(os.path.join(RAW, cfg["raw"] + ".png")).convert("RGBA")
    cx, cy, rx, ry = cfg["cavity"]
    # the front layer: all of the nest that stands before the bird - the lip below the bowl's opening and the side walls with their
    # sticks (beside the opening) - not the bowl's inside, not its back wall (over the opening's upper arc). The bird lying in the bowl
    # goes out of sight behind branches, not behind a line
    rim = Image.new("RGBA", raw.size, (0, 0, 0, 0))
    rp, sp = rim.load(), raw.load()
    for y in range(raw.height):
        for x in range(raw.width):
            if sp[x, y][3] == 0:
                continue
            u = (x - cx) / rx
            if abs(u) < 1:
                half = ry * math.sqrt(1 - u * u)
                if y < cy + half - 1:   # (the inside and the back wall)
                    continue
            # the side walls: their front part (over the opening's middle line, rising outwards - the edge goes up the wall's slope, not
            # straight across it) stands before the bird; the back part near the opening stays behind
            elif y < cy - ry * SIDE * (abs(u) - 1):
                continue
            rp[x, y] = sp[x, y]
    # a dead trunk behind it (the perch): only in the whole picture, never in the front layer
    tr = cfg.get("trunk")
    if tr:
        top = tr["top"]
        full = Image.new("RGBA", (raw.width, raw.height + top), (0, 0, 0, 0))
        trunk = Image.open(os.path.join(RAW, tr["raw"] + ".png")).convert("RGBA").crop(tr["box"])
        full.alpha_composite(trunk, (tr["at"][0], top + tr["at"][1]))
        full.alpha_composite(raw, (0, top))
        rim2 = Image.new("RGBA", full.size, (0, 0, 0, 0))
        rim2.alpha_composite(rim, (0, top))
        raw, rim, cy = full, rim2, cy + top
    # the canvas: trimmed to the picture, then padded so that the nest's middle is the picture's middle (the anchor)
    x0, y0, x1, y1 = raw.getbbox()
    half = max(cfg["centre"] - x0, x1 - cfg["centre"])
    left = cfg["centre"] - half
    w = 2 * half + (2 * half) % 2
    h = y1 - y0
    out, outRim = Image.new("RGBA", (w, h), (0, 0, 0, 0)), Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.alpha_composite(raw.crop((max(0, left), y0, x1, y1)), (max(0, -left) if left < 0 else 0, 0))
    outRim.alpha_composite(rim.crop((max(0, left), y0, x1, y1)), (max(0, -left) if left < 0 else 0, 0))
    backup(cfg["out"])
    out.save(os.path.join(SYS, cfg["out"] + ".png"))
    outRim.save(os.path.join(SYS, cfg["out"] + "_Przod.png"))
    info = {"image": cfg["out"], "rim": cfg["out"] + "_Przod", "size": [w, h],
            "cx": cx - (left + half),                # the bowl's middle from the anchor (px, + right)
            "lip": y1 - (cy + ry),                    # the lip at the middle: px up from the picture's bottom
            "rx": rx, "ry": ry, "floor": y1 - cy}     # the bowl's half width, half depth, its middle's height
    print(key, info)
    return info


def main():
    data = {k: build(k, c) for k, c in NESTS.items()}
    with open(os.path.join(HERE, "gniazda.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=1)
    print("-> tools/orzel/gniazda.json")


if __name__ == "__main__":
    main()
