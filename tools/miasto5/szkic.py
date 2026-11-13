# -*- coding: utf-8 -*-
"""Szkic czterech dzielnic Kruczogrodu (2026-11-09) do akceptacji gracza: stare części mapy Winlu (kopia
../Tawerna_archiwum_2026-11-08/kruczogrod_miasto_20261108_154456) na swoich miejscach, przeniesione stare domy w nowych miejscach,
nowe dzielnice jako strefy z prostokątami budynków.   python tools/miasto5/szkic.py <plik.png>"""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy")); import mapylib
from PIL import Image, ImageDraw
OLD = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "kruczogrod_miasto_20261108_154456", "data", "Map008.json")
T = 12
raw = json.load(open(OLD, encoding="utf-8")); mp = mapylib.Mapa(8, raw=raw)
old = mapylib.render(mp, scale=T / 48).convert("RGB")
def box(x0, y0, x1, y1): return (x0 * T, y0 * T, (x1 + 1) * T, (y1 + 1) * T)
im = Image.new("RGB", (120 * T, 120 * T), (96, 128, 80))
d = ImageDraw.Draw(im, "RGBA")
# kept old parts, in place
KEEP = [(0, 0, 78, 36), (0, 35, 101, 66), (0, 66, 74, 91)]
for k in KEEP: im.paste(old.crop(box(*k)), box(*k)[:2])
# relocated old houses: (name, old box, new top-left)
MOVE = [("Dom Agaty", (80, 5, 89, 14), (3, 94)), ("Kamienica", (91, 19, 100, 30), (15, 92)), ("Dom 13", (75, 65, 82, 75), (36, 93)),
        ("Dzwonnica", (84, 26, 88, 32), (46, 97)), ("Dom 14 + weterana", (76, 83, 88, 89), (52, 97)), ("Izba do wynajęcia", (91, 83, 101, 89), (65, 97))]
F = mapylib.font(13, True); FS = mapylib.font(11, True); FB = mapylib.font(22, True)
def label(x, y, t, f=FS, c=(255, 255, 255)): d.text((x * T, y * T), t, font=f, fill=c, stroke_width=3, stroke_fill=(0, 0, 0))
ROAD = (120, 116, 108); DIRT = (150, 124, 86); GRASS = (98, 140, 78); FIELD = (196, 170, 90); WALL = (150, 150, 150)
def fill(b, c, a=255): d.rectangle(box(*b), fill=c + (a,))
# new ground: east half + south band
fill((79, 5, 117, 34), (140, 128, 100)); fill((102, 35, 117, 66), (140, 128, 100)); fill((75, 67, 117, 113), GRASS); fill((2, 92, 74, 113), GRASS)
# roads
for b in [(101, 5, 103, 113), (104, 10, 119, 12), (104, 48, 119, 50), (2, 104, 74, 106), (0, 104, 1, 107), (29, 92, 33, 119), (75, 89, 100, 91), (79, 35, 81, 66)]:
    fill(b, ROAD)
# outer walls on the map edge: N wall extended, E and S new (old E/S walls removed)
fill((79, 0, 119, 4), WALL); fill((118, 0, 119, 119), WALL); fill((0, 114, 119, 119), WALL); fill((0, 92, 1, 113), WALL)
for b in [(24, 0, 26, 4), (0, 50, 1, 52), (0, 104, 1, 107), (118, 10, 119, 12), (118, 48, 119, 50), (30, 114, 32, 119)]: fill(b, ROAD)
for x, y, t in [(22, 5, "brama N (dwór)"), (2, 53, "brama W (Podgrodzie)"), (2, 107, "brama W2 (Podgrodzie)"), (106, 7, "brama E (Łąka)"),
                (106, 51, "brama E2 (Łąka)"), (34, 116, "brama S (Kruczy Jar)")]: label(x, y, t, FS, (255, 230, 120))
for nm, (x0, y0, x1, y1), (nx, ny) in MOVE:
    im.paste(old.crop(box(x0, y0, x1, y1)), (nx * T, ny * T)); d = ImageDraw.Draw(im, "RGBA")
    d.rectangle((nx * T, ny * T, (nx + x1 - x0 + 1) * T, (ny + y1 - y0 + 1) * T), outline=(120, 200, 255), width=2)
d = ImageDraw.Draw(im, "RGBA")
# stable A (event picture) in its yard
st = Image.open(os.path.join(ROOT, "img", "characters", "!$Stajnia_Duza_A.png")).convert("RGBA")
fw, fh = st.width // 3, st.height // 4; fr = st.crop((fw, 0, fw * 2, fh)).resize((12 * T, int(fh * 12 * T / fw)), Image.NEAREST)
fill((80, 5, 100, 26), DIRT); d.rectangle(box(80, 5, 100, 26), outline=(90, 60, 30), width=3)
im.paste(fr, (85 * T, 6 * T + 6 * T - fr.height), fr); d = ImageDraw.Draw(im, "RGBA")
fill((81, 16, 81, 18), (90, 140, 200)); fill((81, 20, 81, 22), (90, 140, 200))
for i, (hx, hy) in enumerate([(85, 15), (90, 18), (95, 14), (88, 22), (96, 21)]): d.ellipse(box(hx, hy, hx + 1, hy), fill=(110, 70, 40))
label(82, 24, "stajnia + 5 koni, 2 wodopoje")
NEW = [((80, 28, 92, 34), "Browar i słodownia"), ((94, 27, 99, 34), "Kruczarnia"), ((104, 14, 112, 20), "Kuźnia podkuwacza"),
       ((104, 22, 117, 33), "Targ koński (zagrody)"), ((104, 35, 117, 46), "TARG ZWIERZĄT"), ((104, 53, 117, 66), "Zajazd + podwórze"),
       ((105, 68, 114, 80), "Wiatrak na pagórku"), ((104, 82, 112, 90), "Spichlerz"), ((76, 68, 99, 87), "Pola zboża"),
       ((77, 93, 88, 100), "Stodoła z oborą"), ((76, 102, 99, 112), "Pastwisko"), ((104, 92, 117, 102), "Sad + pasieka"),
       ((104, 104, 117, 112), "Obóz uchodźców (W6)"), ((2, 108, 27, 112), "Łaźnia + ogrody"), ((35, 108, 60, 112), "Cech, przytułek"),
       ((4, 19, 15, 33), "(wolne: przyszłe domy)")]
for b, t in NEW:
    c = (196, 170, 90, 200) if "Pola" in t else (200, 140, 60, 170)
    if "Pastwisko" in t: c = (120, 170, 90, 200)
    d.rectangle(box(*b), fill=c, outline=(60, 30, 10), width=2); label(b[0] + 0.3, b[1] + 0.2, t)
for (x0, y0, x1, y1) in [(0, 0, 78, 36), (0, 37, 101, 66), (0, 67, 74, 113), (75, 67, 117, 113)]:
    d.rectangle(box(x0, y0, x1, y1), outline=(255, 215, 0), width=4)
d.line([(79 * T, 5 * T), (118 * T, 5 * T), (118 * T, 67 * T), (102 * T, 67 * T), (102 * T, 35 * T), (79 * T, 35 * T), (79 * T, 5 * T)],
       fill=(255, 215, 0), width=4)
for x, y, t in [(36, 30, "ZAMEK I TAWERNA"), (36, 63, "RYNEK + RATUSZ"), (36, 90, "STARE MIASTO"), (82, 1, "STAJNIE I TARGI"), (77, 88.4, "POLA I MŁYN")]:
    label(x, y, t, FB, (255, 225, 90))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "szkic.png")
im.save(out); print(out, im.size)
