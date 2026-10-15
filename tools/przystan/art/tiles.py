"""Tła z prawdziwych kafelków tilesetu 11 do prób i podglądu obiektów przystani.

backdrop(W, H, water=..., ...) -> PIL.Image RGB: woda A1 rodzaj 6 (basen portu) / 10 (zatoka z plażą),
ziemia (rodzaj 17), trawa (16), deski pomostu (A1 rodzaj 2 na warstwie 1).
"""
import sys
ROOT = "c:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/"
for p in ("tools/newstart", "tools/town", "tools/podgrodzie"):
    if ROOT + p not in sys.path:
        sys.path.insert(0, ROOT + p)
from nslib import NewMap  # noqa: E402
import mzrender as R  # noqa: E402

DIRT, GRASS, PLANKS, DEEP = 17, 16, 2, 1


def backdrop(W, H, water=(), water_kind=6, deep=(), pier=(), grass=(), base=DIRT):
    m = NewMap(999, W, H, 11, "t", "")
    m.kind(0, m.all, base)
    if water:
        m.kind(0, set(water), water_kind)
    if deep:
        m.kind(1, set(deep), DEEP)
    if pier:
        m.kind(1, set(pier), PLANKS)
    if grass:
        m.kind(0, set(grass), GRASS)
    data = m.resolve()
    mp = {"width": W, "height": H, "tilesetId": 11, "data": data, "events": [None]}
    S = R.Sheets(11)
    S.lenient = True
    return R.render(mp, sheets=S).convert("RGB")


def rect(x0, y0, x1, y1):
    return {(x, y) for y in range(y0, y1) for x in range(x0, x1)}


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "bg.png"
    img = backdrop(8, 6, water=rect(0, 0, 6, 6), pier=rect(0, 4, 6, 5))
    img.save(out)
    print(img.size)
