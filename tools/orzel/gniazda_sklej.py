# python tools/orzel/gniazda_sklej.py
#   tools/orzel/zrzuty_gniazda/*.png (tools/orzel/gniazda_zrzut.js) -> docs/orzel/gniazda_po.png (dzień), docs/orzel/gniazda_noc.png (noc)
# Sześć wycinków jak w docs/orzel/gniazda_teraz.png: pisklę w koszu, młody w koszu, podrostek w gnieździe, prawie dorosły w gnieździe,
# dorosły w Orlej grzędzie, dorosły przy gnieździe 3x3.
import json, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(HERE, "zrzuty_gniazda")
NAMES = ["1_piskle_kosz", "2_mlody_kosz", "3_podrostek_gniazdo", "4_prawie_gniazdo", "5_dorosly_grzeda", "6_dorosly_przy_gniezdzie"]
# the crop round the nest's anchor (its picture's bottom-middle on the screen): width, height over it, below it
CROP = {"orzel_kosz": (150, 150, 40), "orzel_gniazdo": (300, 300, 40), "orzel_grzeda": (330, 340, 30)}
H = 300


def main():
    boxes = json.load(open(os.path.join(SRC, "boxes.json"), encoding="utf-8"))
    for hour, out in ((11, "gniazda_po.png"), (21, "gniazda_noc.png")):
        tiles = []
        for n in NAMES:
            b = boxes["%s_%d" % (n, hour)]
            im = Image.open(os.path.join(SRC, "%s_%d.png" % (n, hour))).convert("RGBA")
            w, up, down = CROP[b["type"]] if not n.startswith("6_") else (420, 340, 30)
            cx = b["x"] + (b["side"] * 130 if n.startswith("6_") else 0)   # (the adult beside the nest: both in the picture)
            box = (int(cx - w / 2), int(b["y"] - up), int(cx + w / 2), int(b["y"] + down))
            tile = im.crop(box)
            k = H / tile.height
            tiles.append(tile.resize((round(tile.width * k), H), Image.NEAREST) if k != 1 else tile)
        W = sum(t.width for t in tiles) + 4 * (len(tiles) - 1)
        sheet = Image.new("RGBA", (W, H), (20, 20, 22, 255))
        x = 0
        for t in tiles:
            sheet.alpha_composite(t, (x, 0))
            x += t.width + 4
        sheet.convert("RGB").save(os.path.join(ROOT, "docs", "orzel", out))
        print("->", out, sheet.size)


if __name__ == "__main__":
    main()
