# -*- coding: utf-8 -*-
"""Wygląd „B” (B2: barwa z odcieniem - gracz 2026-11-08: budynki Fantastic Buildings - Medieval w oryginale, a „od Winlu zrobić ładniejsze i spójniejsze pod
styl”; wybrał wersję B próby): kafle Winlu na zewnątrz i obrazki przyrody przeniesione kolorem pod paczkę - transfer Reinharda w Lab
(średnia i rozrzut Winlu -> średnia i rozrzut budynków paczki) w części SILA, jasność z kontrastem KONTRAST. Liczby stałe (policzone raz
z próby: scratch proba_tlo.png i arkusze paczki), więc każdy plik wychodzi tak samo, a przebieg da się powtórzyć.
Pisze NOWE pliki, oryginały zostają:
  - img/tilesets/Styl_B/<ta sama ścieżka>.png   arkusze zestawów 9 (łąki) i 11 (miasto, Przystań, Podgrodzie...)
  - tools/styl/staging/img/characters/*.png      przyroda (drzewa, krzaki, kamienie, pnie, kłody) - do próby przez nakładkę
  - tools/styl/staging/data/Tilesets.json        zestawy 9 i 11 wskazują arkusze Styl_B (do próby; data/ nietknięte)
  python tools/styl/styl_b.py"""
import json, os, re, shutil, sys
import numpy as np
import cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

SILA, KONTRAST = 0.55, 1.12
# (Lab, OpenCV 8-bit scale: L 0-255, a/b 128-centred) Winlu: the town's south strip in the game (ground, grass, trees, a wall);
# the pack: the opaque pixels of City_TileC/D and Rural_TileD/E - computed once by stats() below and kept
SRC_MU, SRC_SD = None, None
TGT_MU, TGT_SD = None, None
PACK = r"C:\Program Files (x86)\Steam\steamapps\common\RPG Maker MZ\dlc\Fantastic Buildings - Medieval\Tilesets"
PROBE = os.path.join(HERE, "proba_tlo.png")
STATS = os.path.join(HERE, "styl_b_liczby.json")
TILESETS = (9, 11)
NATURE = re.compile(r"^!\$(Pine|Tree|Big_Trees|Bush|Rock|Boulder|Trunk|Stump|Log|Logs|Sapling)", re.I)


def lab_of(rgb):
    return cv2.cvtColor(rgb.reshape(-1, 1, 3).astype(np.uint8), cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float32)


def stats():
    if os.path.exists(STATS):
        d = json.load(open(STATS, encoding="utf-8"))
        return [np.array(d[k], np.float32) for k in ("src_mu", "src_sd", "tgt_mu", "tgt_sd")]
    px = []
    for n in ("City_TileC", "City_TileD", "Rural_TileD", "Rural_TileE"):
        a = np.asarray(Image.open(os.path.join(PACK, n + ".png")).convert("RGBA"))
        px.append(a[..., :3][a[..., 3] > 200])
    tgt = lab_of(np.concatenate(px))
    src = lab_of(np.asarray(Image.open(PROBE).convert("RGB")).reshape(-1, 3))
    d = {"src_mu": src.mean(0).tolist(), "src_sd": src.std(0).tolist(), "tgt_mu": tgt.mean(0).tolist(), "tgt_sd": tgt.std(0).tolist()}
    json.dump(d, open(STATS, "w", encoding="utf-8"), indent=1)
    return [np.array(d[k], np.float32) for k in ("src_mu", "src_sd", "tgt_mu", "tgt_sd")]


# (2026-11-08, after the first try on the game: the plain transfer turned grey stone pinkish and the teal pines blue-black) B2 - a
# hue-aware grade in LCh: saturation down (greens a little more - the pack's greens are olive), contrast up, a little darker, warmth
# on the yellow axis only where there is colour (greys stay neutral), the teal of Winlu's leaves and grass turned toward yellow-green
B2 = dict(sat=0.78, con=1.10, dark=4.0, warm=5.0, teal_from=150.0, teal_to=235.0, teal_target=125.0, teal_k=0.55, green_sat=0.72)


def grade(img, p=B2):
    """an RGBA picture -> its B2 look (alpha kept)"""
    a = np.asarray(img.convert("RGBA"))
    rgb, al = a[..., :3], a[..., 3:]
    lab = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    L, aa, bb = lab[..., 0], lab[..., 1] - 128, lab[..., 2] - 128
    C = np.hypot(aa, bb)
    H = (np.degrees(np.arctan2(bb, aa)) + 360) % 360
    band = np.clip(np.minimum(H - p["teal_from"], p["teal_to"] - H) / 25.0, 0, 1)
    wch = np.clip((C - 6) / 14.0, 0, 1)
    H2 = H + (p["teal_target"] - H) * p["teal_k"] * band * wch
    green = np.clip(1 - np.abs(((H2 - 125 + 180) % 360) - 180) / 50.0, 0, 1)
    C2 = C * p["sat"] * (1 - (1 - p["green_sat"]) * green)
    a2, b2 = C2 * np.cos(np.radians(H2)), C2 * np.sin(np.radians(H2)) + p["warm"] * wch
    L2 = (L - 128) * p["con"] + 128 - p["dark"]
    out = cv2.cvtColor(np.clip(np.dstack([L2, a2 + 128, b2 + 128]), 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB)
    return Image.fromarray(np.dstack([out, al]), "RGBA")


def main():
    if not os.path.exists(PROBE):
        shutil.copy(os.path.join(os.environ.get("PROBA_TLO", ""), "proba_tlo.png"), PROBE)
    ts = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))
    done = set()
    for tid in TILESETS:
        names = ts[tid]["tilesetNames"]
        for i, n in enumerate(names):
            if not n: continue
            src = os.path.join(ROOT, "img", "tilesets", n + ".png")
            dst = os.path.join(ROOT, "img", "tilesets", "Styl_B", n + ".png")
            if n not in done:
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                grade(Image.open(src)).save(dst, optimize=True)
                done.add(n)
            names[i] = "Styl_B/" + n
    os.makedirs(os.path.join(STG, "data"), exist_ok=True)
    open(os.path.join(STG, "data", "Tilesets.json"), "w", encoding="utf-8").write(json.dumps(ts, ensure_ascii=False, separators=(",", ":")))
    chars = [f for f in os.listdir(os.path.join(ROOT, "img", "characters")) if f.endswith(".png") and NATURE.match(f)]
    os.makedirs(os.path.join(STG, "img", "characters"), exist_ok=True)
    for f in chars:
        grade(Image.open(os.path.join(ROOT, "img", "characters", f))).save(os.path.join(STG, "img", "characters", f), optimize=True)
    print("wygląd B: arkuszy %d (img/tilesets/Styl_B), przyrody %d (staging), zestawy %s -> staging/data/Tilesets.json" % (len(done), len(chars), TILESETS))


if __name__ == "__main__":
    main()
