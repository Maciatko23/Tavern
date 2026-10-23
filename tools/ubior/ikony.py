# Ubiór: ikony przedmiotów 250+ (rzędy IconSet od 528) - rysowane kodem, bez PixelLab.
#   python tools/ubior/ikony.py [--podglad PLIK.png]
# Czyta tools/ubior/staging/ikony.json (node tools/ubior/zrob_staging.js), pisze tools/ubior/staging/IconSet_nowe.png: tylko nowe rzędy
# (512 x 32*n), ikona k na miejscu (k - 528). Styl ikon gry „grube piksele” (buty 369, plecak 370, chusta 446): rysunek 16x16
# powiększony x2, obrys #2c1e1e, światło z lewej góry. Jeden rysunek na rodzaj rzeczy, kolory z rampy wzoru (Ubior_Data.js WZORY) -
# warianty to ta sama ikona w innej rampie. Kurta i czarne buty: stare ikony 435 / 369 przemalowane przez rampę (po jasności).
#
# Znaki rysunku: '.' pusto, '#' materiał (ton z rampy wg położenia: jaśniej u góry z lewej), 'h' światło (najjaśniejszy ton),
# 'd' fałd / szew (ton ciemniej), 's' cień (najciemniejszy), 'a' akcent (wstążka, haft, sprzączka - kolor akcentu), 'm' / 'n' metal
# jasny / ciemny, 'o' obrys. Obrys dookoła kształtu dokłada się sam.
import json
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
STAGING = os.path.join(HERE, "staging")
OUTLINE = (0x2C, 0x1E, 0x1E, 255)
METAL = {"m": (0xC8, 0xC2, 0xB4, 255), "n": (0x6E, 0x6A, 0x62, 255)}

# ---------------------------------------------------------------- the drawings (16 x 16)
RYSUNKI = {
    "kapelusz": [
        "................",
        "................",
        "................",
        "................",
        ".....######.....",
        "....##d##d##....",
        "...####d##d##...",
        "...##d###d###...",
        "...aaaaaaaaaa...",
        ".##############.",
        "#hhhh#d####d####",
        "##d####d####d###",
        ".#dddddddddddd#.",
        "..............  ",
        "................",
        "................",
    ],
    "chusta": [
        "................",
        "................",
        "................",
        "..############..",
        ".#hhhhhhhhhhhh#.",
        ".dddddddddddddd.",
        "..#h####h####d..",
        "...###h####h#...",
        "...#h####h##d...",
        "....###h####....",
        ".....#h###d.....",
        "......###d......",
        ".......#d.......",
        "................",
        "................",
        "................",
    ],
    "czapka": [
        "................",
        "................",
        ".......##.......",
        ".....######.....",
        "....###d####....",
        "...####d#####...",
        "..#####d######..",
        "..h####d######..",
        "..#####d#####d..",
        ".hhhhhhhhhhhhhh.",
        ".##############.",
        ".dddddddddddddd.",
        "................",
        "................",
        "................",
        "................",
    ],
    "opaska": [
        "................",
        "................",
        "................",
        "................",
        ".....######.....",
        "...##hhhhhh##...",
        "..##........##..",
        ".##..........##.",
        ".#............#.",
        ".##..........##.",
        "..##........d#..",
        "...##dddddd##...",
        ".....######.a...",
        "...........aa...",
        "............a...",
        "................",
    ],
    "koszula": [
        "................",
        ".....##..##.....",
        "...####..####...",
        ".#####dddd#####.",
        ".######dd######.",
        ".###d######d###.",
        ".###d######d###.",
        "..##d######d##..",
        "....########....",
        "....########....",
        "....###d####....",
        "....########....",
        "....########....",
        "....dddddddd....",
        "................",
        "................",
    ],
    "koszula_haft": [
        "................",
        ".....##..##.....",
        "...####..####...",
        ".####aaddaa####.",
        ".#####aa#a#####.",
        ".###d##a#a#d###.",
        ".###d##aa##d###.",
        ".aaad######daaa.",
        "....###a####....",
        "....##a#a###....",
        "....###a####....",
        "....########....",
        "....########....",
        "....aaaaaaaa....",
        "................",
        "................",
    ],
    "kaftan": [
        "................",
        ".....hh..hh.....",
        "...##hh..hh##...",
        ".######dd######.",
        ".####d#ad#d####.",
        ".##d##d##d##d##.",
        ".##d###ad###d##.",
        ".##d##d##d##d##.",
        ".##d###ad###d##.",
        ".hh.##d##d##.hh.",
        "....###ad###....",
        "....##d##d##....",
        "....###dd###....",
        "....########....",
        "....dddddddd....",
        "................",
    ],
    "spodnie": [
        "................",
        "................",
        "...dddddddddd...",
        "...##########...",
        "...##########...",
        "...####dd####...",
        "...####..####...",
        "...####..####...",
        "...####..####...",
        "...###d..###d...",
        "...####..####...",
        "...####..####...",
        "...####..####...",
        "..d####..d####..",
        "................",
        "................",
    ],
    "spodnie_welna": [
        "................",
        "................",
        "...dddddddddd...",
        "...##########...",
        "...#d##d#d##d...",
        "...#d#ddd#d#d...",
        "...#d#d..#d#d...",
        "...#d#d..#d#d...",
        "...#d#d..#d#d...",
        "...#d#d..#d#d...",
        "...#d#d..#d#d...",
        "...#d#d..#d#d...",
        "...dddd..dddd...",
        "..######.######.",
        "................",
        "................",
    ],
    "spodnie_skora": [
        "................",
        "................",
        "...dddddddddd...",
        "...##h#####h#...",
        "...##########...",
        "...h###dd###h...",
        "...####..####...",
        "...h###..###h...",
        "...#dd#..#dd#...",
        "...hdd#..#ddh...",
        "...####..####...",
        "...h###..###h...",
        "...####..####...",
        "..d####..d####..",
        "................",
        "................",
    ],
    "lapcie": [
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        ".##.....##......",
        ".#d#h...#d#h....",
        ".##d#d#.##d#d#..",
        ".#d#d#d.#d#d#d#.",
        "..dddddd.dddddd.",
        "................",
        "................",
        "................",
        "................",
    ],
    "pas": [
        "................",
        "................",
        ".....######.....",
        "...##hhhhhh##...",
        "..#hh######hh#..",
        ".##d###..###d##.",
        ".#d##......##d#.",
        ".##d#......#d##.",
        "..##dmmmmmmd##..",
        "...##mnnnnm##...",
        ".....mmmmmm#....",
        "..........###...",
        "...........#h#..",
        "............##..",
        "................",
        "................",
    ],
    "pas_sakiewka": [
        "................",
        ".....######.....",
        "...##hhhhhh##...",
        "..#hh######hh#..",
        ".##d###..###d##.",
        ".#d##......##d#.",
        ".##d#......#d##.",
        "..##dmmmmmmd##..",
        "...##mnnnnm##...",
        ".....mmmmmm..a..",
        "...........aaa..",
        "..........#####.",
        "..........#h###.",
        "..........#####.",
        "...........ddd..",
        "................",
    ],
    "rekawice": [
        "................",
        "....##.##.##....",
        "....##.##.##.##.",
        "....##d##d##d##.",
        "..#.###########.",
        ".##.###########.",
        ".###d##########.",
        "..###########...",
        "...##########...",
        "....########....",
        "....aaaaaaaa....",
        "....##d##d##....",
        "....########....",
        "................",
        "................",
        "................",
    ],
    "torba": [
        "................",
        ".....######.....",
        "....#......#....",
        "...#........#...",
        "..#..........#..",
        "..#..........#..",
        ".##############.",
        ".#hhhhhhhhhhhh#.",
        ".##############.",
        ".#dddddaaddddd#.",
        ".######aa######.",
        ".##############.",
        ".##############.",
        "..dddddddddddd..",
        "................",
        "................",
    ],
}
# the accent when the wzor has none: the hat's band, the shirt's embroidery, the buckle, the cuff
AKCENT = {"kapelusz": "#4a2c18", "chusta": None, "koszula_haft": "#b8342c", "kaftan": "#c8b88a", "rekawice": None, "torba": "#b9b3a6",
          "pas_sakiewka": "#8b5a33", "opaska": None}


def hexrgb(s):
    return (int(s[1:3], 16), int(s[3:5], 16), int(s[5:7], 16), 255)


def draw(name, ramp, accent):
    grid = [row.ljust(16, ".")[:16].replace(" ", ".") for row in RYSUNKI[name]]
    assert len(grid) == 16, name
    tones = [hexrgb(c) for c in ramp]
    n = len(tones)
    acc = hexrgb(accent) if accent else tones[max(0, n - 4)]
    filled = [[grid[y][x] != "." for x in range(16)] for y in range(16)]
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()
    for y in range(16):
        for x in range(16):
            ch = grid[y][x]
            if ch == ".":
                continue
            # the light from the top left: 4 steps over the icon, the top rim a step lighter, the right / bottom edge a step darker
            t = 4.4 - (x * 0.10 + y * 0.14)
            if y == 0 or not filled[y - 1][x]:
                t += 1
            if x == 15 or not filled[y][x + 1] or y == 15 or not filled[y + 1][x]:
                t -= 0.8
            if ch == "h":
                t = n - 1
            elif ch == "d":
                t -= 1.6
            elif ch == "s":
                t = 0
            k = max(0, min(n - 1, int(round(t))))
            if ch == "#" or ch in "hds":
                k = max(1 if ch != "s" else 0, min(n - 1 if ch == "h" else n - 2, k))
            col = tones[k]
            if ch == "a":
                col = acc
            elif ch in METAL:
                col = METAL[ch]
            elif ch == "o":
                col = OUTLINE
            px[x, y] = col
    # the outline: every empty pixel next to the drawing (4 ways)
    out = img.copy()
    op = out.load()
    for y in range(16):
        for x in range(16):
            if px[x, y][3]:
                continue
            if any(0 <= x + dx < 16 and 0 <= y + dy < 16 and px[x + dx, y + dy][3] and px[x + dx, y + dy] != OUTLINE for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                op[x, y] = OUTLINE
    return out.resize((32, 32), Image.NEAREST)


def recolor(icon_index, ramp):
    """an old icon of the game through the ramp: the outline stays, the rest by brightness (its own darkest -> the ramp's darkest)"""
    iconset = Image.open(os.path.join(ROOT, "img", "system", "IconSet.png")).convert("RGBA")
    x, y = (icon_index % 16) * 32, (icon_index // 16) * 32
    ic = iconset.crop((x, y, x + 32, y + 32))
    tones = [hexrgb(c) for c in ramp]
    lum = lambda p: 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]
    cols = sorted({p for p in (ic.get_flattened_data() if hasattr(ic, 'get_flattened_data') else ic.getdata()) if p[3] > 0 and lum(p) > 40}, key=lum)
    if not cols:
        return ic
    lo, hi = lum(cols[0]), lum(cols[-1])
    out = ic.copy()
    op = out.load()
    for yy in range(32):
        for xx in range(32):
            p = op[xx, yy]
            if p[3] == 0 or lum(p) <= 40:
                continue   # (the outline and the darkest lines stay)
            t = (lum(p) - lo) / max(1, hi - lo)
            r = tones[max(0, min(len(tones) - 1, int(round(t * (len(tones) - 1)))))]
            op[xx, yy] = (r[0], r[1], r[2], p[3])
    return out


def main():
    data = json.load(open(os.path.join(STAGING, "ikony.json"), encoding="utf-8"))
    first = 528
    last = max(d["ikona"] for d in data)
    rows = (last - first) // 16 + 1
    sheet = Image.new("RGBA", (512, rows * 32), (0, 0, 0, 0))
    for d in data:
        k = d["ikona"] - first
        name = d["rysunek"]
        if name == "kurta":
            ic = recolor(435, d["rampa"])
        elif name == "buty":
            ic = recolor(369, d["rampa"])
        else:
            ic = draw(name, d["rampa"], d.get("akcent") or AKCENT.get(name))
        sheet.alpha_composite(ic, ((k % 16) * 32, (k // 16) * 32))
    out = os.path.join(STAGING, "IconSet_nowe.png")
    sheet.save(out)
    print("IconSet_nowe.png: %dx%d, ikony %d-%d" % (sheet.width, sheet.height, first, last))
    if "--podglad" in sys.argv:
        dest = sys.argv[sys.argv.index("--podglad") + 1]
        big = Image.new("RGBA", (512 * 3, rows * 32 * 3), (58, 60, 66, 255))
        big.alpha_composite(sheet.resize((512 * 3, rows * 32 * 3), Image.NEAREST))
        big.save(dest)
        print("podgląd:", dest)


if __name__ == "__main__":
    main()
