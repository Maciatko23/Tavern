# python tools/orzel/dorosly_poza_sklej.py
#   tools/orzel/zrzuty_gniazda/przed/ (stara poza dorosłego) + tools/orzel/zrzuty_gniazda/ (nowa, gniazda_zrzut.js) -> docs/orzel/dorosly_poza_po.png
# Górny rząd: przed (w misie grzędy dzień, noc; obok gniazda 3x3), dolny: po - dorosły leży w gnieździe jak wysiadujący ptak.
import json, os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(HERE, "zrzuty_gniazda")
SHOTS = [("5_dorosly_grzeda_11", (330, 340, 30), 0), ("5_dorosly_grzeda_21", (330, 340, 30), 0), ("6_dorosly_przy_gniezdzie_11", (420, 340, 30), 130)]
H = 300


def row(folder):
    boxes = json.load(open(os.path.join(folder, "boxes.json"), encoding="utf-8"))
    tiles = []
    for name, (w, up, down), side in SHOTS:
        b = boxes[name]
        im = Image.open(os.path.join(folder, name + ".png")).convert("RGBA")
        cx = b["x"] + side * b.get("side", 1)
        tile = im.crop((int(cx - w / 2), int(b["y"] - up), int(cx + w / 2), int(b["y"] + down)))
        k = H / tile.height
        tiles.append(tile.resize((round(tile.width * k), H), Image.NEAREST))
    return tiles


def main():
    rows = [row(os.path.join(SRC, "przed")), row(SRC)]
    W = max(sum(t.width for t in r) + 4 * (len(r) - 1) for r in rows) + 70
    sheet = Image.new("RGBA", (W, H * 2 + 4), (20, 20, 22, 255))
    d = ImageDraw.Draw(sheet)
    for j, (r, label) in enumerate(zip(rows, ("PRZED", "PO"))):
        y = j * (H + 4)
        d.text((8, y + H // 2 - 6), label, fill=(240, 220, 160, 255))
        x = 70
        for t in r:
            sheet.alpha_composite(t, (x, y))
            x += t.width + 4
    sheet.convert("RGB").save(os.path.join(ROOT, "docs", "orzel", "dorosly_poza_po.png"))
    print("-> docs/orzel/dorosly_poza_po.png", sheet.size)


if __name__ == "__main__":
    main()
