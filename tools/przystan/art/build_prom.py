"""Prom 2026-10-17: płaska barka-prom z PixelLab (zamiast kolażu z kadłuba kutra) -> !$Przystan_Prom.png.

Źródło: raw/prom_pixellab_2.png (Pro Flash 256x128, seed 11; wzór stylu = pierwsza próba prom_pixellab_1.png
wyprostowana, a ta - łódź Janka raw/janka_proflash_1.png). 2 generacje po 9 = 18.
Kroki:
 1. okruchy precz, przycięcie do obrazu,
 2. głębszy pokład (prom wiezie wozy i wojsko): wszystko nad bliższą poręczą (daleka burta z poręczą, skrzynie, zwój
    liny, beczki, wiosło sterowe) idzie DEEP px w górę, w szczelinę wchodzą deski pokładu z czystego środka (DECK_*),
    na dziobie i rufie (ściany końców) powtarza się rząd z linii cięcia; pod beczkami bliższa poręcz z czystego odcinka,
 3. barka wydłużona do ~SZER px: pusty środek pokładu (kolumny MID_X0..MID_X1, deski biegną wzdłuż, poręcz ciągła)
    powtórzony w poziomie - skrzynie, beczki i wiosło sterowe zostają w swojej skali,
 4. wynik zapisany jako raw/prom_final.png (build_objects.py bierze go odtąd zamiast kolażu),
 5. te same poprawki co reszta przystani (build_objects.finish: obwódka Winlu, paleta, zanurzenie + cień na wodzie),
 6. arkusz 3x4 o TEJ SAMEJ komórce 384x168 i tym samym kotwiczeniu (dół-środek komórki, kołysanie 0/1/1),
    tylko !$Przystan_Prom.png (pozostałe łodzie nietknięte) + wpis "Prom" w objects.json.
Kopia starej grafiki: backup_art_2026-10-17/poprawki/!$Przystan_Prom.png.
Run: python tools/przystan/art/build_prom.py raw/prom_pixellab_2.png 104 129 350 22   (ŹRÓDŁO MID_X0 MID_X1 SZER DEEP)
"""
import json
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_objects as bo  # noqa: E402

CELL = (384, 168)
# (prom_pixellab_2.png po przycięciu) rząd cięcia = góra bliższej poręczy; kolumny pokładu; deski do wstawienia (rzędy z
# czystego środka DECK_X0..DECK_X1); bliższa poręcz pod beczkami (FIX_*) z odcinka na tej samej wysokości (RAIL_X0..RAIL_X1)
SPLIT, DECK_COLS, DECK_ROWS, DECK_X0, DECK_X1 = 35, (17, 202), (20, 35), 66, 166
FIX_COLS, FIX_ROWS, RAIL_X0, RAIL_X1 = (162, 199), 7, 120, 166


def deepen(img, d):
    """Pokład głębszy o d px: część nad bliższą poręczą w górę, w szczelinę deski (na końcach powtórzony rząd cięcia)."""
    w, h = img.size
    src = img.load()
    out = Image.new("RGBA", (w, h + d), (0, 0, 0, 0))
    out.alpha_composite(img.crop((0, 0, w, SPLIT)), (0, 0))
    out.alpha_composite(img.crop((0, SPLIT, w, h)), (0, SPLIT + d))
    px = out.load()
    for x in range(w):
        if DECK_COLS[0] <= x < DECK_COLS[1]:
            xs = x if DECK_X0 <= x < DECK_X1 else DECK_X0 + (x - DECK_X0) % (DECK_X1 - DECK_X0)
            for k in range(d):
                px[x, SPLIT + k] = src[xs, DECK_ROWS[0] + k % (DECK_ROWS[1] - DECK_ROWS[0])]
        else:
            for k in range(d):
                px[x, SPLIT + k] = src[x, SPLIT]
    for x in range(*FIX_COLS):
        xs = RAIL_X0 + (x - RAIL_X0) % (RAIL_X1 - RAIL_X0)
        for k in range(FIX_ROWS):
            px[x, SPLIT + d + k] = src[xs, SPLIT + k]
    return out


def widen(img, x0, x1, width):
    """Powtarza kolumny x0..x1 (pusty środek) aż obraz ma `width` px szerokości."""
    w, h = img.size
    if width <= w:
        return img
    piece = img.crop((x0, 0, x1, h))
    pw = x1 - x0
    extra = width - w
    out = Image.new("RGBA", (width, h), (0, 0, 0, 0))
    out.alpha_composite(img.crop((0, 0, x1, h)), (0, 0))
    x = x1
    left = extra
    while left > 0:
        part = piece if left >= pw else piece.crop((0, 0, left, h))
        out.alpha_composite(part, (x, 0))
        x += part.size[0]
        left -= part.size[0]
    out.alpha_composite(img.crop((x1, 0, w, h)), (x, 0))
    return out


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join("raw", "prom_pixellab_2.png")
    if not os.path.isabs(src):
        src = os.path.join(HERE, src)
    x0 = int(sys.argv[2]) if len(sys.argv) > 2 else 104
    x1 = int(sys.argv[3]) if len(sys.argv) > 3 else 129
    width = int(sys.argv[4]) if len(sys.argv) > 4 else 350
    deep = int(sys.argv[5]) if len(sys.argv) > 5 else 22
    img = bo.crop_bbox(bo.drop_specks(Image.open(src).convert("RGBA")))
    if deep > 0:
        img = deepen(img, deep)
    img = widen(img, x0, x1, width)
    final_raw = os.path.join(bo.RAW, "prom_final.png")
    img.save(final_raw)

    spec = bo.SPEC["Prom"]
    fin = bo.finish("Prom", img)
    cw, ch = CELL
    bob = spec["bob"]
    mdx = max(d for d, _ in bob)
    mdy = max(d for _, d in bob)
    assert fin.size[0] + mdx <= cw and fin.size[1] + mdy <= ch, fin.size
    sh, (sx, sy) = bo.sheet(fin, cw, ch, bob)
    out = os.path.join(bo.CHARS, "!$Przystan_Prom.png")
    sh.save(out)

    with open(bo.JSON_OUT, "rb") as f:
        meta = json.loads(f.read().decode("utf8"))
    bb = (sx, sy, sx + fin.size[0], sy + fin.size[1])
    o = meta["obiekty"]["Prom"]
    o.update({
        "rozmiar_arkusza": list(sh.size),
        "komorka": [cw, ch],
        "obraz_w_komorce": list(bb),
        "pola": bo.tiles_of(cw, ch, bb),
        "szerokosc_w_polach": round(fin.size[0] / bo.TILE, 2),
        "wysokosc_w_polach": round(fin.size[1] / bo.TILE, 2),
        "opis": "prom: płaska barka z burtami i poręczą, wiosło sterowe na rufie, skrzynie i zwój liny na dziobie, beczki na rufie",
        "zrodlo": "raw/prom_final.png (build_prom.py z raw/" + os.path.basename(src) + ", PixelLab Pro Flash)",
    })
    o.pop("cumy", None)
    with open(bo.JSON_OUT, "wb") as f:
        f.write((bo.compact_json(meta) + "\n").encode("utf8"))
    print("prom", fin.size, "w komórce", bb, "->", out)


if __name__ == "__main__":
    main()
