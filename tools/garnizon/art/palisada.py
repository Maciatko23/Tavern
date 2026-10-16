# python tools/garnizon/art/palisada.py   -> img/characters/!Garnizon_Palisada.png, !Garnizon_Palisada_Bok.png, !$Garnizon_Wieza.png,
#                                            !$Garnizon_Dyby.png (+ docs/miejsca_wyspy/garnizon/palisada_arkusze.png)
# Palisada garnizonu (pakiet D, docs/miejsca_wyspy/PAKIETY.md): z JEDNEGO obrazka PixelLab (raw/pale_proflash_1.png - sześć
# zaostrzonych pali z dwoma wiązaniami z liny, Pro Flash 128x96, wzór stylu = drwa z Fantasy_Outside_C Winlu) składam w kodzie:
#   - ODCINKI CZOŁOWE (północ i południe): 3 pola szerokości (144 px) x 2,5 pola wysokości (120 px); pale w różnej kolejności
#     (ziarno), każdy pal to kolumna obrazka między dwiema ciemnymi obwódkami - sąsiednie pale dzielą obwódkę, więc szew jest
#     niewidoczny. Odcinek „lewy przy bramie” / „prawy przy bramie” kończy się grubym słupem bramy (dwa pale + 14 px wyżej)
#   - ODCINKI BOCZNE (zachód i wschód): 1 pole szerokości x 2 pola wysokości podstawy (komórka 48x192 - wierzchołki sięgają
#     2 pola wyżej): pale widziane z boku, jeden za drugim co 9 px, każdy następny przykrywa poprzedni (tak autor rysuje płoty)
# Arkusze bez "$" (8 postaci x 12 komórek): komórka = (indeks postaci, kierunek, wzór). Zdarzenie stoi na ŚRODKOWYM polu odcinka
# czołowego (obrazek wyśrodkowany, komórka 144x120) z <Occupy:left=1,right=1>; boczne - na DOLNYM polu odcinka z <Occupy:up=1>.
# Wieża strażnicza i dyby: osobne obrazki PixelLab (raw/wieza_proflash_1.png, raw/dyby_proflash_1.png) jako arkusze "!$" (12 takich
# samych komórek). Deterministyczne: te same pliki dają te same bajty.
import os, sys, random, json
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
RAW = os.path.join(HERE, "raw")
CHARS = os.path.join(ROOT, "img", "characters")
DOCS = os.path.join(ROOT, "docs", "miejsca_wyspy", "garnizon")
OUT_FRONT = os.path.join(CHARS, "!Garnizon_Palisada.png")
OUT_SIDE = os.path.join(CHARS, "!Garnizon_Palisada_Bok.png")
OUT_TOWER = os.path.join(CHARS, "!$Garnizon_Wieza.png")
OUT_STOCKS = os.path.join(CHARS, "!$Garnizon_Dyby.png")
T = 48
FW, FH = 3 * T, 2 * T + 24     # a front segment's cell (2.5 rows: the gate posts are taller)
SW, SH = T, 4 * T              # a side segment's cell (2 rows of base + 2 rows of tips above)

# the stakes of the raw picture: the dark outline columns between them (measured: tops' valleys) and the rows taken
BOUNDS = [23, 36, 48, 60, 74, 86, 99]
TOP, BOTTOM = 0, 93            # rows 0..92 (the mound's last row is 92)


def stakes():
    im = Image.open(os.path.join(RAW, "pale_proflash_1.png")).convert("RGBA")
    out = []
    for a, b in zip(BOUNDS, BOUNDS[1:]):
        out.append(im.crop((a, TOP, b + 1, BOTTOM)))      # both outline columns: neighbours overlap by one
    return out


def taller(st, extra):
    """a stake made `extra` px taller: the body above the upper rope band copied up (a gate post)"""
    w, h = st.size
    cut = 26                                             # (rows 0..25 = the tip and the top of the body)
    out = Image.new("RGBA", (w, h + extra), (0, 0, 0, 0))
    out.alpha_composite(st.crop((0, 0, w, cut)), (0, 0))
    body = st.crop((0, 40, w, 46))                       # a plain piece of the body (between the ropes), repeated
    for y in range(cut, cut + extra, 6):
        out.alpha_composite(body, (0, y))
    out.alpha_composite(st.crop((0, cut, w, h)), (0, cut + extra))
    return out


def front_segment(seq, all_st, rnd):
    """144x120: stakes in the order of seq (indices), bottoms on the cell's bottom"""
    cell = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    parts = [all_st[i] for i in seq]
    # lay them from x = -2 (so the cell is full: the first and last stakes are cut by the cell's edges and continue in the neighbour)
    x = -3 + rnd.randint(0, 2)
    for st in parts:
        w, h = st.size
        tmp = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
        tmp.paste(st, (x, FH - h + 1), st)
        cell = Image.alpha_composite(cell, tmp)
        x += w - 1
        if x >= FW: break
    return cell


def side_segment(all_st, rnd, step=12):
    """48x192: a palisade running north-south seen from the south: two staggered rows of stakes (a double palisade, ~22 px
    thick), one behind another every `step` px, each next one in front; the bottom one stands on the cell's bottom"""
    cell = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    bases = list(range(SH - 2 * T + 6, SH + 1, step // 2))   # the stakes' bottoms through the two base rows, the rows alternating
    if bases[-1] != SH: bases.append(SH)
    for i, by in enumerate(bases):
        st = all_st[rnd.randrange(len(all_st))]
        w, h = st.size
        x = (SW - w) // 2 + (-5 if i % 2 == 0 else 5) + rnd.choice((-1, 0, 0, 1))
        tmp = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
        tmp.paste(st, (x, by - h), st)
        cell = Image.alpha_composite(cell, tmp)
    return cell


def sheet(cells, cw, ch):
    """a sheet without "$": 8 characters (4 x 2) of 3 x 4 cells; cells fill char 0 dir 2 p0,p1,p2, dir 4 ..., then char 1..."""
    im = Image.new("RGBA", (cw * 12, ch * 8), (0, 0, 0, 0))
    index = []
    for n, c in enumerate(cells):
        k, j = divmod(n, 12)
        d, p = j // 3, j % 3
        cx, cy = (k % 4) * 3 + p, (k // 4) * 4 + d
        im.paste(c, (cx * cw, cy * ch))
        index.append({"index": k, "direction": (d + 1) * 2, "pattern": p})
    return im, index


def single(img, cw, ch):
    """a "!$" sheet: 12 equal cells (3 x 4), the picture centred, its bottom on the cell's bottom"""
    bb = img.getbbox()
    img = img.crop(bb)
    cell = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    cell.paste(img, ((cw - img.width) // 2, ch - img.height), img)
    out = Image.new("RGBA", (cw * 3, ch * 4), (0, 0, 0, 0))
    for r in range(4):
        for c in range(3):
            out.paste(cell, (c * cw, r * ch))
    return out


def main():
    rnd = random.Random(162)
    st = stakes()
    n = len(st)
    # 12 front segments: 0-9 plain, 10 = left of the gate (post on the right), 11 = right of the gate (post on the left)
    fronts = []
    for k in range(10):
        seq = [rnd.randrange(n) for _ in range(14)]
        fronts.append(front_segment(seq, st, rnd))
    # the gate's segments: the post sits at the cell's edge by the gate
    fronts.append(post_segment(st, rnd, "right"))
    fronts.append(post_segment(st, rnd, "left"))
    sides = [side_segment(st, rnd) for _ in range(8)]
    front_im, front_idx = sheet(fronts, FW, FH)
    side_im, side_idx = sheet(sides, SW, SH)
    os.makedirs(CHARS, exist_ok=True)
    front_im.save(OUT_FRONT)
    side_im.save(OUT_SIDE)
    tower = Image.open(os.path.join(RAW, "wieza_proflash_1.png")).convert("RGBA")
    single(tower, 128, 192).save(OUT_TOWER)
    made = ["!Garnizon_Palisada", "!Garnizon_Palisada_Bok", "!$Garnizon_Wieza"]
    p = os.path.join(RAW, "dyby_proflash_1.png")
    if os.path.exists(p):
        single(Image.open(p).convert("RGBA"), 64, 64).save(OUT_STOCKS)
        made.append("!$Garnizon_Dyby")
    with open(os.path.join(HERE, "palisada.json"), "wb") as f:
        f.write(json.dumps({"front": front_idx, "side": side_idx, "front_cell": [FW, FH], "side_cell": [SW, SH],
                            "gate_left": front_idx[10], "gate_right": front_idx[11]}, ensure_ascii=False, indent=1).encode("utf-8"))
    # a preview for the docs: a small compound corner on grass
    os.makedirs(DOCS, exist_ok=True)
    prev = Image.new("RGBA", (FW * 4 + 40, SH + FH + 60), (92, 128, 70, 255))
    for i in range(4): prev.alpha_composite(fronts[i], (20 + i * FW, 20))
    for j in range(2): prev.alpha_composite(sides[j], (20 + 48, 20 + FH - SH + 2 * T + j * 2 * T + 48))
    prev = prev.resize((prev.width * 2, prev.height * 2), Image.NEAREST)
    prev.save(os.path.join(DOCS, "palisada_arkusze.png"))
    print("zapisano:", ", ".join(made))


def post_segment(st, rnd, where):
    """a front segment that ends at the gate with a thick post (two stakes, 10 px taller): where = the post's side"""
    post = [taller(st[3], 10), taller(st[1], 10)]
    cell = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    seq = [rnd.randrange(len(st)) for _ in range(14)]
    parts = [st[i] for i in seq]
    if where == "right":
        # from the right edge leftwards: the post first
        x = FW + 1
        for s in post[::-1] + parts:
            w, h = s.size
            x -= w - 1
            tmp = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
            tmp.paste(s, (x, FH - h + 1), s)
            cell = Image.alpha_composite(tmp, cell)            # (each further one goes behind: the post stays in front)
            if x <= -12: break
    else:
        x = -1
        for s in post + parts:
            w, h = s.size
            tmp = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
            tmp.paste(s, (x, FH - h + 1), s)
            cell = Image.alpha_composite(tmp, cell)
            x += w - 1
            if x >= FW: break
    return cell


if __name__ == "__main__":
    main()
