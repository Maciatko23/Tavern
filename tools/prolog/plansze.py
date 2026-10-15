# Plansze prologu do gry: img/pictures/Prolog_*.png (1280x720) z tools/prolog/art/*.png (PixelLab 640x360, x2 bez wygładzania),
# lekko wyrównane barwy. Bez napisów, pasów i efektów - ruch, dymki i popiersia rysuje Prologue.js.
# Warstwy ruchome (2026-10-14): chorągiew we wsi i flaga w porcie wycięte z planszy (Prolog_Wies_Flaga / Prolog_Port_Flaga,
# ich miejsce zamalowane przez PixelLab inpaint: art/anim/*_inpaint.png), chłopiec z plaży zdjęty z planszy - jego klatki
# to osobny arkusz Prolog_Plaza_Chlopiec.png (art/anim/chlopiec_*.png, PixelLab animate_with_skeleton_v3).
# Ikona wisiorka: art/ikona_wisiorek.png -> img/system/IconSet.png, pole 437 (puste przed wstawieniem; skrypt tego pilnuje).
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "ekran_tytulowy"))
sys.path.insert(0, os.path.join(HERE, "..", "ui_pomysly"))
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from tytul import grade, glow_spot, vignette, W, H

ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ART = os.path.join(HERE, "art")
PICS = os.path.join(ROOT, "img", "pictures")
ICON_INDEX = 437
ANIM = os.path.join(ART, "anim")
# zamalowane miejsca: (plik art, wycinek, lewy górny róg wycinka w pikselach art 640x360)
PATCHES = {"wies.png": [("wies_flaga", (452, 92))], "port.png": [("port_flaga", (112, 24))], "plaza.png": [("plaza_chlopiec", (228, 200))]}
MIRRORS = {"plaza.png": [("plaza_chlopiec", 426, 484)]}   # (od x0 do krawędzi wycinka x1: lustro piasku zza krawędzi)
CLONES = {"plaza.png": [((482, 318, 508, 344), (26, 0))]}   # (róg listu wystający poza wycinek: piasek znad niego)
# kontury chorągwi w pikselach wycinka (proste boki), w środku tylko ciemne płótno (+ godło: zamknięte dziury)
FLAG_POLY = {"wies_flaga": [(31, 23), (64, 23), (64, 89), (61, 93), (55, 88), (50, 84), (44, 84), (39, 88), (34, 93), (31, 91)],
             "port_flaga": [(4, 21), (60, 19), (100, 21), (150, 20), (180, 26), (182, 62), (110, 70), (80, 76), (4, 78)]}
GRADES = {"wies.png": dict(bright=0.98, contrast=1.05), "port.png": dict(bright=0.96, contrast=1.05), "plaza.png": dict(bright=1.02, contrast=1.02)}


def art(name, patched=True):
    im = Image.open(os.path.join(ART, name)).convert("RGBA")
    if patched:
        for box, off in CLONES.get(name, []):   # (bits outside the inpainted box: plain sand copied over them)
            src = im.crop((box[0] + off[0], box[1] + off[1], box[2] + off[0], box[3] + off[1]))
            m = Image.new("L", src.size, 0)
            ImageDraw.Draw(m).rectangle((1, 1, src.width - 2, src.height - 2), fill=255)
            im.paste(src, box[:2], m.filter(ImageFilter.GaussianBlur(1)))
        for key, at in PATCHES.get(name, []):
            fill, m = seamless(im, key, at)
            im.paste(fill, at, m)
        for key, x0, x1 in MIRRORS.get(name, []):   # (the patch's end at the box edge: the sand beyond it, mirrored in)
            at = dict(PATCHES[name])[key]
            M = np.zeros((im.height, im.width), np.float32)
            mk = np.asarray(Image.open(os.path.join(ANIM, key + "_mask.png")).convert("L").filter(ImageFilter.GaussianBlur(1.5)), np.float32) / 255
            M[at[1]:at[1] + mk.shape[0], at[0]:at[0] + mk.shape[1]] = mk
            ramp = np.clip((np.arange(im.width) - x0) / 12.0, 0, 1)[None, :]
            M = M * ramp * (np.arange(im.width) < x1)[None, :]
            a = np.asarray(im).astype(np.float32)
            xs = np.clip(2 * x1 - 1 - np.arange(im.width), 0, im.width - 1)
            mir = a[:, xs]
            im = Image.fromarray((a * (1 - M[..., None]) + mir * M[..., None]).round().astype(np.uint8))
    return im.resize((im.width * 2, im.height * 2), Image.NEAREST)


def _morph(m, k, grow):
    f = ImageFilter.MaxFilter(k) if grow else ImageFilter.MinFilter(k)
    return np.asarray(Image.fromarray(m.astype(np.uint8) * 255).filter(f)) > 0


def seamless(base, key, at, pad=16):
    """the inpainted patch with its tone bent to meet the picture around it: the offset (picture just outside - patch
    just inside) is fixed on the mask's edge and spread smoothly inwards (a harmonic membrane, as in Poisson cloning).
    Returns the patch and its paste mask (edge softened by a pixel so no seam shows)."""
    I0 = Image.open(os.path.join(ANIM, key + "_inpaint.png")).convert("RGB")
    M0 = Image.open(os.path.join(ANIM, key + "_mask.png")).convert("L")
    w, h = I0.size
    box = (max(0, at[0] - pad), max(0, at[1] - pad), min(base.width, at[0] + w + pad), min(base.height, at[1] + h + pad))
    ox, oy = at[0] - box[0], at[1] - box[1]
    O = np.asarray(base.convert("RGB").crop(box), np.float32)
    I = O.copy()
    I[oy:oy + h, ox:ox + w] = np.asarray(I0, np.float32)
    M = np.zeros(O.shape[:2], bool)
    M[oy:oy + h, ox:ox + w] = np.asarray(M0) > 127
    out, inn = _morph(M, 11, True) & ~M, M & ~_morph(M, 11, False)
    def local_mean(img, sel):
        k = ImageFilter.GaussianBlur(5)
        wgt = np.asarray(Image.fromarray((sel * 255).astype(np.uint8)).filter(k), np.float32)[..., None] + 1e-3
        ch = [np.asarray(Image.fromarray(np.clip(img[..., c] * sel, 0, 255).astype(np.uint8)).filter(k), np.float32) for c in range(3)]
        return np.stack(ch, 2) / wgt * 255
    d = local_mean(O, out) - local_mean(I, inn)
    edge = M & ~_morph(M, 3, False)
    C = np.where(edge[..., None], d, 0).astype(np.float32)
    free = M & ~edge
    for _ in range(3000):
        avg = (np.roll(C, 1, 0) + np.roll(C, -1, 0) + np.roll(C, 1, 1) + np.roll(C, -1, 1)) / 4
        C[free] = avg[free]
    J = np.clip(I + np.where(M[..., None], C, 0), 0, 255).astype(np.uint8)[oy:oy + h, ox:ox + w]
    return Image.fromarray(J).convert("RGBA"), M0.filter(ImageFilter.GaussianBlur(1.5))


def largest(a):
    h, w = a.shape
    lab = np.zeros((h, w), int)
    best, n = (0, 0), 0
    for y in range(h):
        for x in range(w):
            if a[y, x] and not lab[y, x]:
                n += 1
                q, c = deque([(y, x)]), 0
                lab[y, x] = n
                while q:
                    cy, cx = q.popleft()
                    c += 1
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            yy, xx = cy + dy, cx + dx
                            if 0 <= yy < h and 0 <= xx < w and a[yy, xx] and not lab[yy, xx]:
                                lab[yy, xx] = n
                                q.append((yy, xx))
                if c > best[0]:
                    best = (c, n)
    return lab == best[1]


def fill_holes(a):
    im = Image.fromarray(np.pad(~a, 1, constant_values=True).astype(np.uint8) * 255).copy()
    ImageDraw.floodfill(im, (0, 0), 128)
    return ~(np.asarray(im)[1:-1, 1:-1] == 128)


def flag_alpha(key):
    o = np.asarray(Image.open(os.path.join(ANIM, key + "_crop.png")).convert("RGB"), int)
    poly = Image.new("L", (o.shape[1], o.shape[0]), 0)
    ImageDraw.Draw(poly).polygon(FLAG_POLY[key], fill=255)
    P = np.asarray(poly) > 0
    mx, sat = o.max(2), o.max(2) - o.min(2)
    if key == "wies_flaga":   # (straight sides from the outline; the ragged bottom: dark cloth only)
        rows = np.arange(o.shape[0])[:, None] + np.zeros(o.shape[1], int)
        return fill_holes(largest(P & (((mx < 62) & (sat < 40)) | (rows < 80))))
    dark = (mx < 36) & ((o[..., 2] - o[..., 0]) < 16)   # (the flag's black, not the blue night sky behind it)
    im = Image.fromarray((dark & P).astype(np.uint8) * 255).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    return fill_holes(largest(np.asarray(im) > 0))


def flag_layer(name, key, out):
    """the banner cut from the ORIGINAL art (graded like its board), x2, 2 px of clear edge; prints its board position"""
    at = PATCHES[name][0][1]
    a = flag_alpha(key)
    ys, xs = np.nonzero(a)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    src = Image.open(os.path.join(ANIM, key + "_crop.png")).convert("RGBA").crop((x0, y0, x1, y1))
    g = grade(src.resize((src.width * 2, src.height * 2), Image.NEAREST), **GRADES[name])
    alpha = Image.fromarray((a[y0:y1, x0:x1] * 255).astype(np.uint8)).resize(g.size, Image.NEAREST)
    g.putalpha(alpha)
    pad = 2
    lay = Image.new("RGBA", (g.width + pad * 2, g.height + pad * 2), (0, 0, 0, 0))
    lay.paste(g, (pad, pad))
    p = os.path.join(PICS, out + ".png")
    lay.save(p, optimize=True)
    print(p, "x", (at[0] + x0) * 2 - pad, "y", (at[1] + y0) * 2 - pad, "w", lay.width, "h", lay.height)


def save(im, name):
    p = os.path.join(PICS, name + ".png")
    im.convert("RGB").save(p, optimize=True)
    print(p)


def kronika():
    img = Image.new("RGBA", (W, H), (6, 5, 4, 255))
    atlas = Image.open(os.path.join(ROOT, "tools", "ekran_tytulowy", "art", "atlas.png")).convert("RGBA").resize((W, H), Image.NEAREST)
    atlas = grade(atlas, bright=0.42, sat=0.7)
    a = np.asarray(atlas).copy()
    fade = np.clip((np.arange(H)[:, None] - 200) / 320, 0, 1) ** 1.4
    a[..., 3] = (fade * 255).astype(np.uint8)
    img.alpha_composite(Image.fromarray(a))
    vignette(img, 0.6)
    return img


def boards():
    save(kronika(), "Prolog_Kronika")
    save(grade(art("wies.png"), **GRADES["wies.png"]), "Prolog_Wies")
    save(grade(art("chata.png"), bright=0.94, contrast=1.04), "Prolog_Chata")
    save(grade(art("port.png"), **GRADES["port.png"]), "Prolog_Port")
    save(grade(art("sztorm.png"), bright=1.0, contrast=1.1, sat=0.9), "Prolog_Sztorm")
    save(grade(art("plaza.png"), **GRADES["plaza.png"]), "Prolog_Plaza")
    flag_layer("wies.png", "wies_flaga", "Prolog_Wies_Flaga")
    flag_layer("port.png", "port_flaga", "Prolog_Port_Flaga")
    chlopiec()


# chłopiec z plaży: klatki z PixelLab (płótno 192, skrajne klatki wstawania 0 i 14 wyszły rozmyte - pominięte), ułożone
# tak, by stojąca postać każdej serii wypadła w tym samym miejscu komórki: sznurek-pasek (biodra) w x kotwicy, stopy na y 177.
# Chód: każda klatka przesunięta tak, by biodra stały w miejscu (marsz w miejscu - ruch po plaży robi Prologue.js).
BOY_SEQS = [("getup", range(1, 14)), ("walk", range(0, 8)), ("fall", range(0, 9))]
BOY_CELL, BOY_COLS, BOY_GROUND = (256, 192), 8, 177


def rope_x(im):
    a = np.asarray(im.convert("RGBA")).astype(int)
    m = (a[..., 3] > 0) & (a[..., 0] - a[..., 2] > 25) & (a[..., 0] > 80)
    xs = np.nonzero(m[60:110])[1]
    return float(xs.mean())


def chlopiec():
    cw, ch = BOY_CELL
    src = lambda seq, i: Image.open(os.path.join(ANIM, "chlopiec", "%s_%02d.png" % (seq, i))).convert("RGBA")
    ax = rope_x(src("getup", 13))                       # (the anchor: where the boy stands when he is up)
    offs = {("getup", i): 0 for i in BOY_SEQS[0][1]}
    for i in BOY_SEQS[1][1]:
        offs[("walk", i)] = int(round(ax - rope_x(src("walk", i))))
    fo = int(round(ax - rope_x(src("fall", 0))))
    for i in BOY_SEQS[2][1]:
        offs[("fall", i)] = fo
    frames = [(seq, i) for seq, rng in BOY_SEQS for i in rng]
    rows = (len(frames) + BOY_COLS - 1) // BOY_COLS
    sheet = Image.new("RGBA", (cw * BOY_COLS, ch * rows), (0, 0, 0, 0))
    index, heads = {}, []
    for k, (seq, i) in enumerate(frames):
        im, off = src(seq, i), offs[(seq, i)]
        a = np.where(np.asarray(im)[..., 3] > 0, 255, 0).astype(np.uint8)   # (no half-clear pixels: crisp at x2)
        im.putalpha(Image.fromarray(a))
        ys, xs = np.nonzero(a)
        assert xs.min() + off >= 0 and xs.max() + off < cw, (seq, i, off)
        sheet.paste(im, ((k % BOY_COLS) * cw + off, (k // BOY_COLS) * ch), im)
        top = ys.min()
        hx = xs[ys < top + 12].mean()
        heads.append([int(round((hx + off - ax) * 2)), int((top - BOY_GROUND) * 2)])
        index.setdefault(seq, []).append(k)
    p = os.path.join(PICS, "Prolog_Plaza_Chlopiec.png")
    sheet.save(p, optimize=True)
    print(p, sheet.size, "anchor x", round(ax, 1), "offsets", sorted(set(offs.values())), "frames", index)
    print("heads", heads)


def icon():
    p = os.path.join(ROOT, "img", "system", "IconSet.png")
    s = Image.open(p).convert("RGBA")
    r, c = divmod(ICON_INDEX, 16)
    box = (c * 32, r * 32, c * 32 + 32, r * 32 + 32)
    cell = np.asarray(s.crop(box))
    ic = Image.open(os.path.join(ART, "ikona_wisiorek.png")).convert("RGBA")
    if cell[..., 3].max() > 0 and not np.array_equal(cell, np.asarray(ic)):
        print("pole", ICON_INDEX, "zajęte - ikona NIE wstawiona")
        return
    s.paste(ic, box)
    s.save(p)
    print("ikona", ICON_INDEX, "->", p)


if __name__ == "__main__":
    boards()
    if "ikona" in sys.argv:
        icon()
