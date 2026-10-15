# Prolog „Ostatni prom” - klatki podglądu 1280x720 (docs/prolog/prolog_NN_*.png) + zestawienie. Uruchom: python klatki.py [numery]
# Plansze: PixelLab (art/*.png, 640x360 -> x2 bez wygładzania); dymki i popiersia jak w grze (Grafit i miedź); klatka 8 = zrzut z gry.
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "ekran_tytulowy"))
sys.path.insert(0, os.path.join(HERE, "..", "ui_pomysly"))
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from tytul import (W, H, font, text, tw, hexc, Over, put, grade, gradient, vignette, glow_spot, glow_spot_small, rain, snow, embers, mist,
                   dust, rays, metal_text, diamond_rule, spaced, keys_hint, GOLD, CU)

ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ART = os.path.join(HERE, "art")
OUT = os.path.join(ROOT, "docs", "prolog")
NAME = "Łukasz"
FM = lambda s: font("AlegreyaSans-Medium.ttf", s)
FB = lambda s: font("AlegreyaSans-Bold.ttf", s)
FR = lambda s: font("AlegreyaSans-Regular.ttf", s)
FSC = lambda s: font("AlegreyaSansSC-Medium.ttf", s)
FG = lambda s, w=500: font("EBGaramond.ttf", s, w)
FP = lambda s: font("PirataOne.ttf", s)
TXT, MUT, COP = "#ece6da", "#b8b0a2", "#d08a5a"


def art(name, scale=2):
    im = Image.open(os.path.join(ART, name)).convert("RGBA")
    return im.resize((im.width * scale, im.height * scale), Image.NEAREST)


def save(img, name):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    img.convert("RGB").save(p, optimize=True)
    return p


def letterbox(img, h=56):
    """kinowe pasy: prolog to film"""
    with Over(img) as o:
        o.rectangle((0, 0, W, h), fill=(0, 0, 0, 255))
        o.rectangle((0, H - h, W, H), fill=(0, 0, 0, 255))


def skip_hint(img, k=0.35, y=None):
    """„przytrzymaj P: pomiń” z miedzianym kółkiem postępu (w prawym górnym rogu, na czarnym pasie - dół zajmują popiersia)"""
    y = y or 28
    x = W - 30
    with Over(img) as o:
        o.ellipse((x - 11, y - 11, x + 11, y + 11), outline=(90, 92, 100, 220), width=2)
        o.arc((x - 11, y - 11, x + 11, y + 11), -90, -90 + 360 * k, fill=hexc(COP), width=2)
    text(img, (x, y), "P", FB(13), TXT, anchor="mm")
    text(img, (x - 20, y), "przytrzymaj: pomiń", FR(15), MUT, anchor="rm")


def scene_tag(img, n, title, y=28):
    spaced(img, (40, y), f"scena {n} · {title}".lower(), FSC(14), "#8a8478", sp=2, anchor="l")


def bust(name, mirror=False, scale=0.78):
    b = Image.open(os.path.join(ROOT, "img", "pictures", name + ".png")).convert("RGBA")
    b = b.resize((int(b.width * scale), int(b.height * scale)), Image.LANCZOS)
    return b.transpose(Image.FLIP_LEFT_RIGHT) if mirror else b


def talk(img, speaker, line, left=None, right="Hero_Bust", who_left="", speaking="left", dim_other=True, y0=None):
    """rozmowa jak w grze: popiersie rozmówcy w lewym dolnym rogu (odbite), bohatera w prawym; dymek Grafit z ogonkiem do mówiącego"""
    bl = bust(left, mirror=True) if left else None
    br = bust(right) if right else None
    for b, x, on in ((bl, 0, speaking == "left"), (br, W - (br.width if br else 0), speaking == "right")):
        if not b:
            continue
        if dim_other and not on:
            a = np.asarray(b).astype(np.float32); a[..., :3] *= 0.55; b = Image.fromarray(a.astype(np.uint8))
        img.alpha_composite(b, (int(x), H - b.height))
    f = FM(21)
    lines = []
    for raw in line.split("\n"):
        words, cur = raw.split(), ""
        for w_ in words:
            t = (cur + " " + w_).strip()
            if tw(t, f) <= 600: cur = t
            else: lines.append(cur); cur = w_
        lines.append(cur)
    bw = max(tw(l, f) for l in lines) + 40
    bh = 24 + 30 * len(lines)
    x0 = 268 if speaking == "left" else W - 268 - bw
    y0 = y0 or H - 120 - bh // 2
    with Over(img) as o:
        o.rounded_rectangle((x0 + 2, y0 + 4, x0 + bw + 2, y0 + bh + 5), radius=6, fill=(0, 0, 0, 80))
        o.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), radius=6, fill=(22, 23, 26, 228), outline=(64, 66, 72, 255))
        tx = x0 if speaking == "left" else x0 + bw
        sgn = -1 if speaking == "left" else 1
        o.polygon([(tx, y0 + bh / 2 - 9), (tx + sgn * 80, y0 + bh / 2 + 2), (tx, y0 + bh / 2 + 9)], fill=(22, 23, 26, 228))
        for cx, cy, dx, dy in ((x0, y0, 1, 1), (x0 + bw, y0 + bh, -1, -1)):
            o.line((cx, cy, cx + dx * 12, cy), fill=hexc(COP), width=2); o.line((cx, cy, cx, cy + dy * 12), fill=hexc(COP), width=2)
    for i, l in enumerate(lines):
        text(img, (x0 + 20, y0 + 12 + i * 30), l, f, TXT)
    # tabliczka z imieniem
    pw = tw(speaker, FB(18)) + 24
    px = x0 + 14 if speaking == "left" else x0 + bw - 14 - pw
    with Over(img) as o:
        o.rounded_rectangle((px, y0 - 18, px + pw, y0 + 10), radius=4, fill=(30, 32, 36, 245), outline=(64, 66, 72, 255))
    text(img, (px + pw / 2, y0 - 4), speaker, FB(18), "#e8c8a0", anchor="mm")


def head_bubble(img, x, y, line, speaker=None, w=None):
    """dymek nad postacią na planszy (postać bez popiersia)"""
    f = FM(19)
    bw = (w or tw(line, f)) + 32
    bh = 44
    x0, y0 = int(x - bw / 2), int(y - bh - 14)
    with Over(img) as o:
        o.rounded_rectangle((x0 + 2, y0 + 4, x0 + bw + 2, y0 + bh + 5), radius=6, fill=(0, 0, 0, 80))
        o.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), radius=6, fill=(22, 23, 26, 228), outline=(64, 66, 72, 255))
        o.polygon([(x - 8, y0 + bh), (x, y0 + bh + 12), (x + 8, y0 + bh)], fill=(22, 23, 26, 228))
        o.line((x0, y0, x0 + 12, y0), fill=hexc(COP), width=2); o.line((x0, y0, x0, y0 + 12), fill=hexc(COP), width=2)
    text(img, (x0 + 16, y0 + bh / 2), line, f, TXT, anchor="lm")
    if speaker:
        pw = tw(speaker, FB(16)) + 20
        with Over(img) as o:
            o.rounded_rectangle((x0 + 10, y0 - 16, x0 + 10 + pw, y0 + 8), radius=4, fill=(30, 32, 36, 245), outline=(64, 66, 72, 255))
        text(img, (x0 + 10 + pw / 2, y0 - 4), speaker, FB(16), "#e8c8a0", anchor="mm")


def ash(img, n=160, seed=3, box=(0, 0, W, H)):
    rng = np.random.default_rng(seed)
    with Over(img) as o:
        for _ in range(n):
            x, y = rng.uniform(box[0], box[2]), rng.uniform(box[1], box[3])
            s = int(rng.integers(1, 3))
            g = int(rng.uniform(120, 200))
            o.rectangle((x, y, x + s, y + s), fill=(g, g - 8, g - 16, int(rng.uniform(90, 200))))


# =====================================================================================================================
def f01_imie():
    """Ekran „Jak masz na imię?” (po „Nowa gra”, przed filmem)"""
    bg = Image.open(os.path.join(ROOT, "img", "titles1", "Tawerna_Title_Kufel.png")).convert("RGBA").filter(ImageFilter.GaussianBlur(4))
    img = grade(bg, bright=0.45)
    embers(img, n=40, seed=5, box=(900, 150, 1220, 450), size=(1, 2))
    X, Y, PW, PH = 290, 86, 700, 548
    with Over(img) as o:
        o.rounded_rectangle((X + 2, Y + 6, X + PW + 2, Y + PH + 8), radius=14, fill=(0, 0, 0, 110))
        o.rounded_rectangle((X, Y, X + PW, Y + PH), radius=14, fill=(20, 21, 24, 238), outline=(64, 66, 72, 255))
    text(img, (640, Y + 46), "Jak masz na imię?", FG(36, 600), TXT, anchor="mm")
    text(img, (640, Y + 84), "Tak będą cię wołać matka, dziadek i wszyscy na wyspie.", FR(17), MUT, anchor="mm")
    # pole z imieniem
    fx0, fx1, fy = 420, 860, Y + 150
    with Over(img) as o:
        o.rounded_rectangle((fx0, fy - 32, fx1, fy + 30), radius=8, fill=(30, 32, 36, 255), outline=(64, 66, 72, 255))
        o.rectangle((fx0 + 16, fy + 20, fx1 - 16, fy + 21), fill=hexc(COP))
    nw = tw(NAME, FB(36))
    text(img, (640 - 8, fy - 2), NAME, FB(36), TXT, anchor="mm")
    with Over(img) as o:
        cx = 640 - 8 + nw / 2 + 5
        o.rectangle((cx, fy - 18, cx + 2, fy + 16), fill=hexc(COP))
    text(img, (fx1 - 14, fy + 44), f"{len(NAME)} / 12", FR(14), MUT, anchor="rm")
    text(img, (fx0 + 2, fy + 44), "Wołają cię:", FR(15), "#8a8478", anchor="lm")
    text(img, (fx0 + 86, fy + 44), "Łukaszu!", FM(16), "#e8c8a0", anchor="lm")
    text(img, (fx0 + 160, fy + 44), "(zmień: Tab)", FR(14), "#77736b", anchor="lm")
    # siatka liter (z polskimi znakami)
    rows = ["A Ą B C Ć D E Ę F G", "H I J K L Ł M N Ń O", "Ó P R S Ś T U W Y Z", "Ź Ż a ą b c ć d e ę", "f g h i j k l ł m n", "ń o ó p r s ś t u w"]
    gx, gy, cw, ch = 380, Y + 226, 52, 40
    sel = (1, 5)   # Ł
    for r, row in enumerate(rows):
        for c, ch_ in enumerate(row.split()):
            x, y = gx + c * cw, gy + r * ch
            on = (r, c) == sel
            with Over(img) as o:
                o.rounded_rectangle((x, y, x + cw - 6, y + ch - 6), radius=6, fill=(48, 50, 56, 255) if on else (30, 32, 36, 255),
                                    outline=hexc(COP) if on else (52, 54, 60, 255), width=2 if on else 1)
            text(img, (x + (cw - 6) / 2, y + (ch - 6) / 2), ch_, FB(20) if on else FM(19), TXT if on else "#cfc9bd", anchor="mm")
    # przyciski
    by = gy + len(rows) * ch + 10
    bx = gx
    for lab, main in (("Spacja", False), ("Cofnij", False), ("Losuj", False), ("Gotowe", True)):
        bw = 120 if lab != "Gotowe" else 140
        with Over(img) as o:
            o.rounded_rectangle((bx, by, bx + bw, by + 36), radius=8, fill=hexc(COP) if main else (30, 32, 36, 255), outline=None if main else (64, 66, 72, 255))
        text(img, (bx + bw / 2, by + 18), lab, FB(17) if main else FM(17), "#1a1310" if main else TXT, anchor="mm")
        bx += bw + 12
    text(img, (640, Y + PH - 18), "Puste pole = „Reid” (imię z bazy)", FR(14), "#77736b", anchor="mm")
    keys_hint(img, 640, 676, [("W/S/A/D", "litera"), ("O", "wpisz"), ("P", "cofnij literę"), ("Enter", "gotowe")], anchor="m")
    return img


def f02_kronika():
    """Kronika: czerń, mapa wyspy na pergaminie, spadający popiół, słowa narratora"""
    img = Image.new("RGBA", (W, H), (6, 5, 4, 255))
    atlas = Image.open(os.path.join(ROOT, "tools", "ekran_tytulowy", "art", "atlas.png")).convert("RGBA").resize((1280, 720), Image.NEAREST)
    atlas = grade(atlas, bright=0.42, sat=0.7)
    a = np.asarray(atlas).copy()
    yy = np.arange(H)[:, None]
    fade = np.clip((yy - 200) / 320, 0, 1) ** 1.4
    a[..., 3] = (fade * 255).astype(np.uint8)
    img.alpha_composite(Image.fromarray(a))
    glow_spot(img, 640, 640, 420, "#ff7a2a", 0.10)      # łuna z lądu (dół ekranu)
    ash(img, 220, seed=4)
    vignette(img, 0.7)
    letterbox(img)
    lines = [("Trzeci rok wojny.", FG(40, 600), "#f0e4cc"),
             ("Królestwa na lądzie walczą o coś, czego nikt nie widział — o pewność.", FG(26), "#e2d6be"),
             ("Za morzem leży Krucza Wyspa. Ziemia niczyja.", FG(26), "#e2d6be"),
             ("Płyną tam ci, którym nie zostało już nic.", FG(26, 400), "#b8ad98")]
    y = 200
    for i, (s, f, c) in enumerate(lines):
        text(img, (640, y), s, f, c, anchor="mm", alpha=0.45 if i == 3 else 1.0)
        y += 62 if i == 0 else 46
    diamond_rule(img, 640, 158, 120, "#8a6a4a")
    scene_tag(img, 1, "kronika")
    skip_hint(img, 0.0)
    return img


def f03_wies():
    img = art("wies.png")
    img = grade(img, bright=0.98, contrast=1.05)
    embers(img, n=90, seed=7, box=(0, 60, W, 600), size=(1, 3))
    ash(img, 120, seed=8)
    vignette(img, 0.5)
    letterbox(img)
    text(img, (640, 98), "Ląd. Wieś Brzozowa Wola, noc.", FG(24, 500), "#e8d8bc", anchor="mm", stroke=2, sfill=(0, 0, 0, 200))
    scene_tag(img, 2, "płonąca wieś")
    skip_hint(img, 0.0)
    return img


def f04_chata():
    img = art("chata.png")
    img = grade(img, bright=0.92, contrast=1.04)
    glow_spot(img, 640, 300, 420, "#ff9a40", 0.10)
    vignette(img, 0.55)
    letterbox(img, 40)
    talk(img, "Matka", "Weź list do dziadka Stacha. I to... wisiorek z krukiem. Był twojego ojca, Łukaszu.", left="Ludmila_Bust", speaking="left")
    scene_tag(img, 2, "chata · matka", y=20)
    skip_hint(img, 0.6, y=20)
    return img


def f05_port():
    img = art("port.png")
    img = grade(img, bright=0.96, contrast=1.05)
    rain(img, n=160, seed=5, ang=0.12, length=(10, 22), alpha=(30, 80))
    vignette(img, 0.5)
    letterbox(img)
    head_bubble(img, 900, 330, "Prom jest dla wojska, chłopcze. Ale mój kuter... za tyle monet.", speaker="Przemytnik")
    scene_tag(img, 3, "port")
    skip_hint(img, 0.0)
    return img


def f06_sztorm():
    src = art("sztorm.png")
    img = Image.new("RGBA", (W, H), (10, 14, 24, 255))
    img.alpha_composite(src, (0, 34))   # (kamera nieco wyżej: kruk na szczycie masztu nad czarnym pasem)
    img = grade(img, bright=1.0, contrast=1.1, sat=0.9)
    # błysk: chwilowe rozjaśnienie (w filmie trwa 3 klatki)
    flash = Image.new("RGBA", (W, H), (220, 230, 255, 38)); img.alpha_composite(flash)
    rain(img, n=520, seed=6, ang=0.35, length=(22, 44), color=(200, 215, 240), alpha=(70, 150))
    rain(img, n=120, seed=16, ang=0.35, length=(40, 70), color=(230, 238, 255), alpha=(110, 180))
    vignette(img, 0.6)
    letterbox(img)
    scene_tag(img, 4, "sztorm")
    skip_hint(img, 0.0)
    return img


def f07_plaza():
    img = art("plaza.png")
    img = grade(img, bright=1.02, contrast=1.02)
    mist(img, 300, 640, seed=9, color=(236, 232, 240), alpha=0.42, cell=110)
    vignette(img, 0.4)
    letterbox(img)
    text(img, (640, 100), "Krucza Wyspa. Świt.", FG(24, 500), "#4a3e46", anchor="mm")
    scene_tag(img, 5, "plaża")
    skip_hint(img, 0.0)
    return img


def f08_dziadek():
    img = Image.open(os.path.join(HERE, "zrzuty", "dziadek_1.png")).convert("RGBA")
    spaced(img, (640, 704), "scena 6 · dom dziadka - już w grze (zrzut z silnika, proponowany tekst)", FSC(13), "#8a8478", sp=2, anchor="m")
    return img


FRAMES = [(1, "ekran_imienia", f01_imie), (2, "kronika", f02_kronika), (3, "plonaca_wies", f03_wies), (4, "chata_matka", f04_chata),
          (5, "port_przemytnik", f05_port), (6, "sztorm", f06_sztorm), (7, "plaza_swit", f07_plaza), (8, "dom_dziadka", f08_dziadek)]


def zestawienie():
    files = [os.path.join(OUT, f"prolog_{n:02d}_{nm}.png") for n, nm, _ in FRAMES]
    files = [f for f in files if os.path.exists(f)]
    TWD, THD, GAP, COLS = 480, 270, 16, 4
    rows = (len(files) + COLS - 1) // COLS
    Wd, Hd = GAP + COLS * (TWD + GAP), 70 + rows * (THD + 44)
    img = Image.new("RGBA", (Wd, Hd), hexc("#121316"))
    text(img, (GAP, 16), "Prolog „Ostatni prom” · klatki podglądu", FM(30), COP)
    d = ImageDraw.Draw(img)
    labels = ["Ekran imienia", "1. Kronika", "2. Płonąca wieś", "2. Chata: matka", "3. Port: przemytnik", "4. Sztorm", "5. Plaża o świcie", "6. Dom dziadka (gra)"]
    for i, f in enumerate(files):
        c, r = i % COLS, i // COLS
        x, y = GAP + c * (TWD + GAP), 70 + r * (THD + 44)
        text(img, (x, y), labels[i], FB(19), TXT)
        th = Image.open(f).convert("RGBA").resize((TWD, THD), Image.LANCZOS)
        d.rectangle((x - 1, y + 27, x + TWD, y + 28 + THD), outline=hexc(COP))
        img.alpha_composite(th, (x, y + 28))
    img.convert("RGB").save(os.path.join(OUT, "zestawienie.png"), optimize=True)
    print("zestawienie", img.size)


if __name__ == "__main__":
    want = [int(a) for a in sys.argv[1:] if a.isdigit()]
    for n, nm, fn in FRAMES:
        if want and n not in want:
            continue
        try:
            print(save(fn(), f"prolog_{n:02d}_{nm}.png"))
        except FileNotFoundError as e:
            print("brak:", e)
    if not want or "z" in sys.argv:
        zestawienie()
