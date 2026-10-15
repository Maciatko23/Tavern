# Wspólne narzędzia makiet ekranu tytułowego (docs/ekran_tytulowy): tła, nakładki (deszcz, śnieg, mgła, iskry, świetliki, kurz,
# promienie, winieta), napis gry w metalu (miedź / złoto / srebro), menu (Nowa gra, Kontynuuj, Opcje, Wyjdź) w kilku układach.
import os, sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "ui_pomysly"))
from uikit import font, text, tw, hexc, mix, Over, put, load, noise, quant, circle_mask   # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "docs", "ekran_tytulowy")
ART = os.path.join(HERE, "art")
SHOTS = os.path.join(HERE, "zrzuty")
W, H = 1280, 720
MENU = ["Nowa gra", "Kontynuuj", "Opcje", "Wyjdź"]
SAVE = "Dzień 40 · lato · Pole dziadka"
CU = ["#5a2e14", "#8a4a22", "#c27a42", "#e8a868", "#ffd8a8"]        # miedź: cień -> blask
GOLD = ["#5a3e10", "#8a6420", "#c99a3a", "#f0cc6a", "#fff0b8"]
SILV = ["#2a3038", "#4a5560", "#8a98a8", "#c8d4e0", "#f4f8ff"]
TEAL = ["#0c3a38", "#1a6a64", "#2fb0a2", "#7ff0e0", "#e0fffa"]


def bg_art(name, scale=2):
    im = Image.open(os.path.join(ART, name)).convert("RGBA")
    return im.resize((im.width * scale, im.height * scale), Image.NEAREST)


def bg_shot(name):
    return Image.open(os.path.join(SHOTS, name)).convert("RGBA")


def save(img, name):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    img.convert("RGB").save(p, optimize=True)
    return p


# ------------------------------------------------------------------ obróbka tła
def grade(img, bright=1.0, contrast=1.0, sat=1.0, tint=None, tint_a=0.0):
    a = np.asarray(img.convert("RGB"), np.float32) / 255
    if sat != 1.0:
        g = a.mean(axis=2, keepdims=True)
        a = g + (a - g) * sat
    a = (a - 0.5) * contrast + 0.5
    a = a * bright
    if tint is not None:
        t = np.array(hexc(tint)[:3], np.float32) / 255
        a = a * (1 - tint_a) + (a * t * 1.6) * tint_a
    out = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).convert("RGBA")
    return out


def vignette(img, strength=0.55, power=2.2, color=(0, 0, 0)):
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / math.sqrt(2)
    a = np.clip(d, 0, 1) ** power * strength
    lay = Image.new("RGBA", (W, H), color + (0,)); lay.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    img.alpha_composite(lay)


def gradient(img, y0, y1, a0, a1, color=(0, 0, 0), x0=0, x1=W, horizontal=False):
    """pas przyciemnienia (np. pod napis albo menu): alfa od a0 do a1 między y0 a y1 (albo x0..x1)"""
    if horizontal:
        n = x1 - x0
        col = np.linspace(a0, a1, n)
        a = np.tile(col[None, :], (H, 1))
        lay = Image.new("RGBA", (n, H), color + (0,)); lay.putalpha(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)))
        img.alpha_composite(lay, (x0, 0))
    else:
        n = y1 - y0
        row = np.linspace(a0, a1, n)
        a = np.tile(row[:, None], (1, x1 - x0))
        lay = Image.new("RGBA", (x1 - x0, n), color + (0,)); lay.putalpha(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)))
        img.alpha_composite(lay, (x0, y0))


def glow_spot(img, cx, cy, r, color, a=0.5):
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    al = np.clip(1 - d, 0, 1) ** 2 * a
    lay = Image.new("RGBA", (W, H), hexc(color)[:3] + (0,)); lay.putalpha(Image.fromarray((al * 255).astype(np.uint8)))
    img.alpha_composite(lay)


# ------------------------------------------------------------------ nakładki (w grze: animowane)
def rain(img, n=420, seed=1, ang=0.22, length=(14, 30), color=(190, 205, 230), alpha=(60, 130), box=None):
    rng = np.random.default_rng(seed)
    with Over(img) as o:
        for _ in range(n):
            x0 = rng.uniform(-60, W); y0 = rng.uniform(-30, H)
            if box and not (box[0] <= x0 <= box[2] and box[1] <= y0 <= box[3]):
                continue
            L = rng.uniform(*length)
            o.line((x0, y0, x0 + L * ang, y0 + L), fill=color + (int(rng.uniform(*alpha)),), width=1)


def snow(img, n=380, seed=2, big=0.25, color=(240, 246, 255)):
    rng = np.random.default_rng(seed)
    with Over(img) as o:
        for _ in range(n):
            x, y = rng.uniform(0, W), rng.uniform(0, H)
            s = 2 if rng.random() < big else 1
            a = int(rng.uniform(120, 230))
            o.rectangle((x, y, x + s, y + s), fill=color + (a,))
            if s == 2 and rng.random() < 0.5:
                o.point((x - 1, y + 1), fill=color + (a // 2,))


def embers(img, n=60, seed=3, box=(0, 0, W, H), colors=("#ffd27a", "#ff9a3a", "#ff6a2a"), size=(1, 3)):
    rng = np.random.default_rng(seed)
    with Over(img) as o:
        for _ in range(n):
            x, y = rng.uniform(box[0], box[2]), rng.uniform(box[1], box[3])
            s = int(rng.integers(size[0], size[1] + 1))
            c = hexc(colors[int(rng.integers(0, len(colors)))])
            o.rectangle((x, y, x + s - 1, y + s - 1), fill=c[:3] + (int(rng.uniform(150, 255)),))
            if s >= 2:
                o.rectangle((x - 1, y - 1, x + s, y + s), outline=c[:3] + (40,))


def fireflies(img, n=24, seed=4, box=(0, 0, W, H), color="#e8ff9a"):
    rng = np.random.default_rng(seed)
    for _ in range(n):
        x, y = rng.uniform(box[0], box[2]), rng.uniform(box[1], box[3])
        glow_spot_small(img, x, y, 7, color, 0.35)
        with Over(img) as o:
            o.rectangle((x, y, x + 1, y + 1), fill=hexc(color)[:3] + (230,))


def glow_spot_small(img, cx, cy, r, color, a=0.4):
    S = int(r * 2 + 2)
    yy, xx = np.mgrid[0:S, 0:S]
    d = np.sqrt((xx - S / 2) ** 2 + (yy - S / 2) ** 2) / r
    al = np.clip(1 - d, 0, 1) ** 2 * a
    lay = Image.new("RGBA", (S, S), hexc(color)[:3] + (0,)); lay.putalpha(Image.fromarray((al * 255).astype(np.uint8)))
    img.alpha_composite(lay, (int(cx - S / 2), int(cy - S / 2)))


def mist(img, y0, y1, seed=5, color=(220, 225, 235), alpha=0.45, cell=90):
    n = noise(W, y1 - y0, cell=cell, seed=seed, octaves=3, aniso=(2.5, 0.6))
    fade = np.sin(np.linspace(0, math.pi, y1 - y0))[:, None]
    a = np.clip((n - 0.35) * 1.6, 0, 1) * fade * alpha
    lay = Image.new("RGBA", (W, y1 - y0), color + (0,)); lay.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    img.alpha_composite(lay, (0, y0))


def dust(img, n=80, seed=6, box=(0, 0, W, H), color="#bff8ee"):
    rng = np.random.default_rng(seed)
    with Over(img) as o:
        for _ in range(n):
            x, y = rng.uniform(box[0], box[2]), rng.uniform(box[1], box[3])
            o.point((x, y), fill=hexc(color)[:3] + (int(rng.uniform(60, 200)),))


def rays(img, cx, cy, n=7, length=520, spread=70, color="#7ff0e0", alpha=0.18, up=True, seed=7):
    rng = np.random.default_rng(seed)
    lay = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(lay)
    for i in range(n):
        ang = math.radians((-90 if up else 90) + rng.uniform(-spread, spread) / 2)
        w = rng.uniform(10, 34)
        L = length * rng.uniform(0.6, 1.0)
        x1, y1 = cx + math.cos(ang) * L, cy + math.sin(ang) * L
        nx, ny = -math.sin(ang) * w, math.cos(ang) * w
        d.polygon([(cx, cy), (x1 + nx, y1 + ny), (x1 - nx, y1 - ny)], fill=int(255 * alpha * rng.uniform(0.5, 1)))
    lay = lay.filter(ImageFilter.GaussianBlur(10))
    c = Image.new("RGBA", (W, H), hexc(color)[:3] + (0,)); c.putalpha(lay)
    img.alpha_composite(c)


# ------------------------------------------------------------------ napis gry w metalu
def metal_text(img, xy, s, f, ramp=CU, anchor="mm", outline="#1a0e06", shadow=(0, 4, 160), glow=None, spacing=0, bevel=True):
    """napis wypełniony pionowym gradientem metalu, z ciemnym obrysem, cieniem, blaskiem i fazą (jasna linia u góry liter)"""
    # maska liter
    layer = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(layer)
    if spacing:
        widths = [tw(ch, f) if ch != " " else tw("n", f) for ch in s]
        total = sum(widths) + spacing * (len(s) - 1)
        x = xy[0] - total / 2 if anchor[0] == "m" else (xy[0] - total if anchor[0] == "r" else xy[0])
        for ch, w_ in zip(s, widths):
            if ch != " ":
                d.text((x, xy[1]), ch, font=f, fill=255, anchor="l" + anchor[1])
            x += w_ + spacing
    else:
        d.text(xy, s, font=f, fill=255, anchor=anchor)
    m = np.asarray(layer) > 100
    ys, xs = np.nonzero(m)
    if not len(ys):
        return
    y0, y1 = ys.min(), ys.max()
    if glow:
        g = layer.filter(ImageFilter.GaussianBlur(glow[1]))
        gl = Image.new("RGBA", img.size, hexc(glow[0])[:3] + (0,)); gl.putalpha(g.point(lambda v: int(v * glow[2])))
        img.alpha_composite(gl)
    if shadow:
        sh = layer.filter(ImageFilter.GaussianBlur(3))
        sl = Image.new("RGBA", img.size, (0, 0, 0, 0)); sl.putalpha(sh.point(lambda v: int(v * shadow[2] / 255)))
        img.alpha_composite(sl, (shadow[0], shadow[1]))
    # obrys 2 px
    dil = layer.filter(ImageFilter.MaxFilter(5))
    ol = Image.new("RGBA", img.size, hexc(outline)[:3] + (0,)); ol.putalpha(dil)
    img.alpha_composite(ol)
    # gradient
    hgt = max(1, y1 - y0)
    rows = np.arange(img.size[1])
    t = np.clip((rows - y0) / hgt, 0, 1)
    stops = [hexc(c)[:3] for c in (ramp[4], ramp[3], ramp[2], ramp[3], ramp[1])]
    pos = [0, 0.18, 0.5, 0.62, 1.0]
    col = np.zeros((img.size[1], 3), np.float32)
    for ch in range(3):
        col[:, ch] = np.interp(t, pos, [s_[ch] for s_ in stops])
    fill = np.zeros((img.size[1], img.size[0], 4), np.uint8)
    fill[..., :3] = col[:, None, :].astype(np.uint8)
    fill[..., 3] = np.asarray(layer)
    img.alpha_composite(Image.fromarray(fill, "RGBA"))
    if bevel:   # jasna krawędź u góry każdej litery
        up = m & ~np.roll(m, 2, axis=0)
        b = np.zeros((img.size[1], img.size[0], 4), np.uint8)
        b[up] = hexc(ramp[4])[:3] + (150,)
        img.alpha_composite(Image.fromarray(b, "RGBA"))


def diamond_rule(img, cx, y, half, color="#c27a42", gap=12, alpha=220):
    with Over(img) as o:
        c = hexc(color)[:3] + (alpha,)
        o.line((cx - half, y, cx - gap, y), fill=c)
        o.line((cx + gap, y, cx + half, y), fill=c)
        o.polygon([(cx, y - 5), (cx + 5, y), (cx, y + 5), (cx - 5, y)], fill=c)
        for s in (-1, 1):
            o.polygon([(cx + s * half, y - 2), (cx + s * (half + 3), y), (cx + s * half, y + 2)], fill=c)


def spaced(img, xy, s, f, fill, sp=3, anchor="m", stroke=0, sfill=(0, 0, 0, 200)):
    ws = [tw(ch, f) if ch != " " else tw("n", f) for ch in s]
    total = sum(ws) + sp * (len(s) - 1)
    x, y = xy
    if anchor == "m":
        x -= total / 2
    elif anchor == "r":
        x -= total
    for ch, w_ in zip(s, ws):
        if ch != " ":
            text(img, (x, y), ch, f, fill, stroke=stroke, sfill=sfill, anchor="lm")
        x += w_ + sp
    return total


# ------------------------------------------------------------------ menu
FM = lambda s: font("AlegreyaSans-Medium.ttf", s)
FB = lambda s: font("AlegreyaSans-Bold.ttf", s)
FSC = lambda s: font("AlegreyaSansSC-Medium.ttf", s)
TXT = "#ece6da"; MUT = "#b8b0a2"; COPPER = "#d08a5a"


def menu_column(img, x, y, sel=1, step=40, f=None, color=TXT, mut=MUT, accent=COPPER, align="l", marker="bar", save_line=True, shadow=True):
    f = f or FM(24)
    extra = 0
    for i, it in enumerate(MENU):
        yy = y + i * step + extra
        if save_line and i == sel and it == "Kontynuuj":
            extra = 20
        on = i == sel
        anchor = {"l": "lm", "m": "mm", "r": "rm"}[align]
        text(img, (x, yy), it, FB(26) if on else f, color if on else mut, anchor=anchor, stroke=2 if shadow else 0, sfill=(0, 0, 0, 160))
        w_ = tw(it, FB(26) if on else f)
        if on:
            if marker == "bar":
                xs = x - 18 if align == "l" else (x - w_ / 2 - 22 if align == "m" else x - w_ - 18)
                with Over(img) as o:
                    o.rounded_rectangle((xs, yy - 11, xs + 3, yy + 11), radius=1, fill=hexc(accent))
            elif marker == "diamonds":
                cx = x if align == "m" else (x + w_ / 2 if align == "l" else x - w_ / 2)
                with Over(img) as o:
                    for s in (-1, 1):
                        px = cx + s * (w_ / 2 + 18)
                        o.polygon([(px, yy - 5), (px + 5, yy), (px, yy + 5), (px - 5, yy)], fill=hexc(accent))
            elif marker == "underline":
                cx = x if align == "m" else (x + w_ / 2 if align == "l" else x - w_ / 2)
                with Over(img) as o:
                    o.rounded_rectangle((cx - w_ / 2, yy + 15, cx + w_ / 2, yy + 17), radius=1, fill=hexc(accent))
            if save_line and it == "Kontynuuj":
                sx = x if align != "l" else x
                text(img, (sx if align != "m" else x, yy + 26), SAVE, FM(15), accent, anchor={"l": "lm", "m": "mm", "r": "rm"}[align], stroke=2 if shadow else 0, sfill=(0, 0, 0, 160))


def menu_row(img, cy, sel=1, gap=56, f=None, color=TXT, mut=MUT, accent=COPPER, cx=W / 2):
    f = f or FM(22)
    fsel = FB(22)
    ws = [tw(it, fsel if i == sel else f) for i, it in enumerate(MENU)]
    total = sum(ws) + gap * (len(MENU) - 1)
    x = cx - total / 2
    for i, it in enumerate(MENU):
        on = i == sel
        text(img, (x, cy), it, fsel if on else f, color if on else mut, anchor="lm", stroke=2, sfill=(0, 0, 0, 170))
        if on:
            with Over(img) as o:
                o.rounded_rectangle((x, cy + 15, x + ws[i], cy + 17), radius=1, fill=hexc(accent))
            text(img, (x + ws[i] / 2, cy + 34), SAVE, FM(14), accent, anchor="mm", stroke=2, sfill=(0, 0, 0, 160))
        if i < len(MENU) - 1:
            with Over(img) as o:
                px = x + ws[i] + gap / 2
                o.polygon([(px, cy - 3), (px + 3, cy), (px, cy + 3), (px - 3, cy)], fill=hexc(accent)[:3] + (150,))
        x += ws[i] + gap


def menu_panel(img, box, sel=1, title=None, accent=COPPER, fill=(22, 23, 26, 205), line=(64, 66, 72, 255), r=12, step=44):
    x0, y0, x1, y1 = box
    with Over(img) as o:
        o.rounded_rectangle((x0 + 2, y0 + 5, x1 + 2, y1 + 6), radius=r, fill=(0, 0, 0, 70))
        o.rounded_rectangle(box, radius=r, fill=fill, outline=line)
    y = y0 + 34
    for i, it in enumerate(MENU):
        on = i == sel
        if on:
            with Over(img) as o:
                o.rounded_rectangle((x0 + 10, y - 18, x1 - 10, y + 18 + (16 if it == "Kontynuuj" else 0)), radius=7, fill=(48, 50, 56, 255))
                o.rounded_rectangle((x0 + 10, y - 10, x0 + 13, y + 10), radius=1, fill=hexc(accent))
        text(img, (x0 + 28, y), it, FB(22) if on else FM(22), TXT if on else MUT, anchor="lm")
        if on and it == "Kontynuuj":
            text(img, (x0 + 28, y + 22), SAVE, FM(14), accent, anchor="lm")
            y += 16
        y += step


def keys_hint(img, x, y, pairs, color=MUT, accent=COPPER, anchor="r"):
    f = FM(14)
    parts = []
    total = 0
    for k, l in pairs:
        kw = max(22, tw(k, f) + 12)
        total += kw + 6 + tw(l, f) + 18
        parts.append((k, l, kw))
    total -= 18
    xx = x - total if anchor == "r" else (x - total / 2 if anchor == "m" else x)
    for k, l, kw in parts:
        with Over(img) as o:
            o.rounded_rectangle((xx, y - 11, xx + kw, y + 11), radius=4, fill=(20, 21, 24, 170), outline=(90, 92, 100, 200))
        text(img, (xx + kw / 2, y), k, f, TXT, anchor="mm")
        text(img, (xx + kw + 6, y), l, f, color, anchor="lm", stroke=2, sfill=(0, 0, 0, 140))
        xx += kw + 6 + tw(l, f) + 18
