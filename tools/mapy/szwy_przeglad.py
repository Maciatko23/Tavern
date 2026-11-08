# -*- coding: utf-8 -*-
"""Przegląd łączeń map świata (gracz 2026-11-07 przy prawdziwej mapie: „na tym przybliżeniu fajnie widać, jak przejścia pomiędzy
niektórymi mapami wyjątkowo brzydko są zrobione i nie pasują, a mają być super naturalne i płynne”). Tylko czyta: każda para map,
które się stykają w świecie (docs/mapy/swiat_uklad.json), każdy wspólny odcinek krawędzi; ocena z obrazów map (8 px na kratkę,
tools/mapy/zrzuty_prawdziwa - mapa_prawdziwa_zrzuty.js) i z kafli:
  - wzrok: średnia różnica barw dwóch pasów po 1 kratce po obu stronach granicy (kratka w kratkę; ciągły teren = mała),
  - kafle: ile kratek wzdłuż granicy ma po drugiej stronie inny rodzaj gruntu (woda / ląd / ściana-urwisko) - teren urwany,
  - ocena = wzrok x (1 + 2 x kafle); najgorsze pierwsze.
Wynik: docs/mapy/szwy/ranking.txt i obrazy najgorszych: docs/mapy/szwy/<nr>_<a>_<b>.png (po 8 kratek z każdej strony, granica
zaznaczona), docs/mapy/szwy/przeglad.png (zestawienie 12 najgorszych).
  python tools/mapy/szwy_przeglad.py [ile=12]"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
SHOTS = os.path.join(HERE, "zrzuty_prawdziwa")
OUT = os.path.join(ROOT, "docs", "mapy", "szwy")
os.makedirs(OUT, exist_ok=True)
N = int(sys.argv[1]) if len(sys.argv) > 1 else 12
P, SIDE = 8, 8
uk = {int(k): v for k, v in json.load(open(os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json"), encoding="utf-8"))["mapy"].items()}
infos = {m["id"]: m for m in json.load(open(os.path.join(ROOT, "data", "MapInfos.json"), encoding="utf-8")) if m}
pics, kinds = {}, {}


def pic(m):
    if m not in pics: pics[m] = np.array(Image.open(os.path.join(SHOTS, "%d.png" % m)).convert("RGB")).astype(float)
    return pics[m]


def kind(m):   # per tile: 0 water, 1 land, 2 a wall / cliff (A3 / A4 walls)
    if m not in kinds:
        d = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % m), encoding="utf-8"))
        W, H, t = d["width"], d["height"], d["data"]
        k = np.ones((H, W), np.uint8)
        for y in range(H):
            for x in range(W):
                v = t[y * W + x]
                if 2048 <= v < 2816: k[y, x] = 0
                elif 4352 <= v < 8192 and ((v - 2048) // 48) % 16 >= 8: k[y, x] = 2   # (A3 walls, A4 wall faces)
        kinds[m] = k
    return kinds[m]


built = {}
def budowla(m):   # per tile: a wall, a tower, a roof, a cliff's face (A3 / A4 on layers 0-1, B-E on 1-3, A5 rock faces 72-87 / 112-127)
    if m not in built:
        d = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % m), encoding="utf-8"))
        W, H, t = d["width"], d["height"], d["data"]; n = W * H
        k = np.zeros((H, W), bool)
        for y in range(H):
            for x in range(W):
                v0, v1, v2, v3 = (t[z * n + y * W + x] for z in range(4))
                a5 = v0 - 1536
                k[y, x] = (v0 >= 4352 or v1 >= 4352 or (0 < v1 < 1536) or v2 > 0 or v3 > 0 or (0 <= a5 < 512 and (72 <= a5 < 88 or 112 <= a5 < 128)))
        built[m] = k
    return built[m]


seams = []
ids = sorted(uk)
for a in ids:
    ra = uk[a]
    for b in ids:
        if b <= a: continue
        rb = uk[b]
        for (A, B, ra_, rb_) in ((a, b, ra, rb), (b, a, rb, ra)):
            # A on the left / top, B on the right / below
            if ra_["x0"] + ra_["szer"] == rb_["x0"]:   # (a vertical border)
                y0, y1 = max(ra_["y0"], rb_["y0"]), min(ra_["y0"] + ra_["wys"], rb_["y0"] + rb_["wys"])
                if y1 - y0 >= 2: seams.append(dict(a=A, b=B, dir="pion", x=rb_["x0"], y0=y0, y1=y1))
            if ra_["y0"] + ra_["wys"] == rb_["y0"]:   # (a horizontal border)
                x0, x1 = max(ra_["x0"], rb_["x0"]), min(ra_["x0"] + ra_["szer"], rb_["x0"] + rb_["szer"])
                if x1 - x0 >= 2: seams.append(dict(a=A, b=B, dir="poziom", y=rb_["y0"], x0=x0, x1=x1))

for s in seams:
    A, B, ra, rb = s["a"], s["b"], uk[s["a"]], uk[s["b"]]
    pa, pb, ka, kb = pic(A), pic(B), kind(A), kind(B)
    if s["dir"] == "pion":
        la, lb = s["x"] - 1 - ra["x0"], s["x"] - rb["x0"]          # (the last column of A, the first of B, local)
        ya, yb = s["y0"] - ra["y0"], s["y0"] - rb["y0"]
        L = s["y1"] - s["y0"]
        sa = pa[ya * P:(ya + L) * P, la * P:(la + 1) * P]; sb = pb[yb * P:(yb + L) * P, lb * P:(lb + 1) * P]
        diff = np.abs(sa.reshape(L, P, P, 3).mean((1, 2)) - sb.reshape(L, P, P, 3).mean((1, 2))).mean(1)
        cut = (ka[ya:ya + L, la] != kb[yb:yb + L, lb])
        bud = budowla(A)[ya:ya + L, la] | budowla(B)[yb:yb + L, lb]
    else:
        la, lb = s["y"] - 1 - ra["y0"], s["y"] - rb["y0"]
        xa, xb = s["x0"] - ra["x0"], s["x0"] - rb["x0"]
        L = s["x1"] - s["x0"]
        sa = pa[la * P:(la + 1) * P, xa * P:(xa + L) * P]; sb = pb[lb * P:(lb + 1) * P, xb * P:(xb + L) * P]
        diff = np.abs(sa.reshape(P, L, P, 3).mean((0, 2)) - sb.reshape(P, L, P, 3).mean((0, 2))).mean(1)
        cut = (ka[la, xa:xa + L] != kb[lb, xb:xb + L])
        bud = budowla(A)[la, xa:xa + L] | budowla(B)[lb, xb:xb + L]
    s["mur"] = float(bud.mean()) >= 0.5   # (2026-11-07: a wall / a cliff along the border - meant so, a colour change by design)
    s["L"] = L; s["wzrok"] = float(diff.mean()); s["kafle"] = float(cut.mean()); s["ocena"] = s["wzrok"] * (1 + 2 * s["kafle"])
    s["zle"] = int((diff > 40).sum() + cut.sum())

seams.sort(key=lambda s: (s["mur"], -s["ocena"]))
name = lambda m: (infos.get(m) or {}).get("name", str(m))
lines = ["%2d. %3d %-26s | %3d %-26s %-6s %3d kratek  wzrok %5.1f  urwany teren %3d%%  ocena %5.1f%s" % (k + 1, s["a"], name(s["a"])[:26], s["b"], name(s["b"])[:26], s["dir"], s["L"], s["wzrok"], 100 * s["kafle"], s["ocena"], "  [mur / urwisko na granicy - zamierzone, poza oceną]" if s["mur"] else "") for k, s in enumerate(seams)]
open(os.path.join(OUT, "ranking.txt"), "w", encoding="utf-8").write("Łączenia map świata, najgorsze pierwsze (tools/mapy/szwy_przeglad.py)\n" + "\n".join(lines) + "\n")
print("łączeń: %d (map: %d)" % (len(seams), len(uk)))
print("\n".join(lines[:N]))

# the pictures of the worst: both sides of the border, SIDE tiles each, the border marked
try: font = ImageFont.truetype("arialbd.ttf", 16)
except Exception: font = ImageFont.load_default()
crops = []
for k, s in enumerate(seams[:N]):
    A, B, ra, rb = s["a"], s["b"], uk[s["a"]], uk[s["b"]]
    pa, pb = pic(A), pic(B)
    if s["dir"] == "pion":
        L = s["L"]; ya, yb = s["y0"] - ra["y0"], s["y0"] - rb["y0"]
        xa0 = max(0, s["x"] - SIDE - ra["x0"]); left = pa[ya * P:(ya + L) * P, xa0 * P:(s["x"] - ra["x0"]) * P]
        right = pb[yb * P:(yb + L) * P, 0:min(SIDE, rb["szer"]) * P]
        img = np.concatenate([left, right], 1); border = left.shape[1]
    else:
        L = s["L"]; xa, xb = s["x0"] - ra["x0"], s["x0"] - rb["x0"]
        ya0 = max(0, s["y"] - SIDE - ra["y0"]); top = pa[ya0 * P:(s["y"] - ra["y0"]) * P, xa * P:(xa + L) * P]
        bot = pb[0:min(SIDE, rb["wys"]) * P, xb * P:(xb + L) * P]
        img = np.concatenate([top, bot], 0); border = top.shape[0]
    im = Image.fromarray(img.astype(np.uint8))
    d = ImageDraw.Draw(im)
    if s["dir"] == "pion": d.line([(border, 0), (border, im.height)], fill=(255, 60, 60), width=1)
    else: d.line([(0, border), (im.width, border)], fill=(255, 60, 60), width=1)
    label = "%d. %d %s | %d %s" % (k + 1, A, name(A), B, name(B))
    d.text((6, 4), label, fill=(255, 230, 90), font=font, stroke_width=3, stroke_fill=(0, 0, 0))
    im.save(os.path.join(OUT, "%02d_%d_%d.png" % (k + 1, A, B)))
    crops.append(im)
# the sheet: each scaled to 560 wide (a vertical border turned to lie along, as the horizontal ones)
rows = []
for im in crops:
    if im.height > im.width: im = im.rotate(90, expand=True)
    sc = 560 / im.width
    rows.append(im.resize((560, max(1, int(im.height * sc))), Image.LANCZOS))
cols = 2
hs = [max(r.height for r in rows[i:i + cols]) for i in range(0, len(rows), cols)]
sheet = Image.new("RGB", (cols * 560 + (cols + 1) * 8, sum(hs) + (len(hs) + 1) * 8), (24, 24, 28))
y = 8
for ri, i in enumerate(range(0, len(rows), cols)):
    for j, r in enumerate(rows[i:i + cols]): sheet.paste(r, (8 + j * 568, y))
    y += hs[ri] + 8
sheet.save(os.path.join(OUT, "przeglad.png"))
print("obrazy:", OUT)
