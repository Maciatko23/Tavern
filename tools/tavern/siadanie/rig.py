# -*- coding: utf-8 -*-
"""Szkielety siedzącego gościa dla PixelLab animate_with_skeleton_v3 (2026-11-05; gracz: „ludzie w tawernie dziwnie siedzą, zrób ładną profesjonalną grafikę siedzenia”).
Postacie PixelLab mają 64x64; płótno 96x96 (OX, OY: przesunięcie), zwrot na wschód (RIGHT = bliższa strona). Współrzędne w pikselach płótna.
Nogi tych postaci są krótkie (16 px: udo 9, goleń 7), więc siedzący opada o SIAD = 8 px, udo idzie do przodu, goleń w dół, stopy zostają na tym samym wierszu podłogi.
  python tools/tavern/siadanie/rig.py <wyjście.json> [podgląd.png]   -> { "stoi": [...18 stawów], "siedzi_pije": [[...], ...], "siedzi_je": [...], "wstaje": [...] }"""
import json, sys
from PIL import Image, ImageDraw

SIZE = 96
OX, OY = 16, 28
SIAD = 8
Z = {"NOSE": 8, "NECK": 6, "RIGHT SHOULDER": 7, "RIGHT ELBOW": 9, "RIGHT ARM": 10, "LEFT SHOULDER": 3, "LEFT ELBOW": 2, "LEFT ARM": 2, "RIGHT HIP": 6, "RIGHT KNEE": 7, "RIGHT LEG": 7,
     "LEFT HIP": 4, "LEFT KNEE": 3, "LEFT LEG": 3, "RIGHT EYE": 8, "LEFT EYE": 8, "RIGHT EAR": 8, "LEFT EAR": 5}
# stojący (z rotacji east): głowa, tułów, ręce, nogi - w pikselach 64x64
STOI = {"NOSE": (39, 16), "NECK": (32, 23), "RIGHT SHOULDER": (31, 27), "RIGHT ELBOW": (29, 37), "RIGHT ARM": (32, 41), "LEFT SHOULDER": (33, 27), "LEFT ELBOW": (33, 37), "LEFT ARM": (35, 42),
        "RIGHT HIP": (30, 44), "RIGHT KNEE": (29, 53), "RIGHT LEG": (30, 60), "LEFT HIP": (32, 44), "LEFT KNEE": (31, 53), "LEFT LEG": (33, 60),
        "RIGHT EYE": (37, 14), "LEFT EYE": (38, 14), "RIGHT EAR": (30, 14), "LEFT EAR": (32, 14)}


def poza(stawy):
    return [{"label": k, "x": round(v[0] / SIZE, 4), "y": round(v[1] / SIZE, 4), "z_index": Z[k]} for k, v in stawy.items()]


def stoi():
    return {k: (x + OX, y + OY) for k, (x, y) in STOI.items()}


def siedzi(reka=(58, 72), reka2=None, glowa=(0, 0), tulow=0):
    """siedzi na stołku: biodra niżej o SIAD, udo do przodu, goleń w dół; reka: nadgarstek bliższej ręki; glowa: (dx, dy) głowy; tulow: pochylenie barków w px do przodu"""
    s = stoi()
    d = {k: (x, y + SIAD) for k, (x, y) in s.items() if k in ("NOSE", "NECK", "RIGHT SHOULDER", "LEFT SHOULDER", "RIGHT EYE", "LEFT EYE", "RIGHT EAR", "LEFT EAR", "RIGHT HIP", "LEFT HIP")}
    for k in ("NOSE", "RIGHT EYE", "LEFT EYE", "RIGHT EAR", "LEFT EAR"): d[k] = (d[k][0] + glowa[0] + tulow, d[k][1] + glowa[1])
    for k in ("NECK", "RIGHT SHOULDER", "LEFT SHOULDER"): d[k] = (d[k][0] + tulow, d[k][1])
    hx, hy = d["RIGHT HIP"]
    d["RIGHT KNEE"] = (hx + 11, hy - 1)
    d["RIGHT LEG"] = (hx + 12, hy + 7)
    hx2, hy2 = d["LEFT HIP"]
    d["LEFT KNEE"] = (hx2 + 12, hy2 - 1)
    d["LEFT LEG"] = (hx2 + 13, hy2 + 7)
    sx, sy = d["RIGHT SHOULDER"]
    # łokieć: w połowie drogi bark - nadgarstek, wypchnięty w dół
    d["RIGHT ARM"] = reka
    d["RIGHT ELBOW"] = (int(round((sx + reka[0]) / 2)) - 1, int(round((sy + reka[1]) / 2)) + 5)
    r2 = reka2 or (60, 72)
    sx2, sy2 = d["LEFT SHOULDER"]
    d["LEFT ARM"] = r2
    d["LEFT ELBOW"] = (int(round((sx2 + r2[0]) / 2)) - 1, int(round((sy2 + r2[1]) / 2)) + 5)
    return d


def mix(a, b, t):
    return {k: (int(round(a[k][0] + (b[k][0] - a[k][0]) * t)), int(round(a[k][1] + (b[k][1] - a[k][1]) * t))) for k in a}


def main():
    wy = sys.argv[1]
    R = siedzi()
    pije = [R, R, siedzi(glowa=(0, 1)), siedzi(reka=(60, 67)), siedzi(reka=(60, 61), glowa=(0, 0)), siedzi(reka=(59, 57), glowa=(-1, -1)), siedzi(reka=(58, 55), glowa=(-2, -2)),
            siedzi(reka=(58, 55), glowa=(-2, -2)), siedzi(reka=(60, 61)), siedzi(reka=(60, 67)), R, R]
    je = [R, R, siedzi(reka=(59, 69), tulow=1, glowa=(1, 1)), siedzi(reka=(59, 63), tulow=1, glowa=(1, 1)), siedzi(reka=(58, 58), tulow=1, glowa=(1, 0)), siedzi(reka=(58, 58), tulow=1, glowa=(1, 1)),
          siedzi(reka=(59, 63), tulow=1, glowa=(1, 1)), siedzi(reka=(59, 69), tulow=1, glowa=(1, 1)), R, R]
    S = stoi()
    wstaje = [S, S, mix(S, R, 0.2), mix(S, R, 0.4), mix(S, R, 0.6), mix(S, R, 0.8), R, R]
    # (5 klatek na arkusz: kolumny arkusz.py) odpoczynek, unoszenie, przy ustach
    pije5 = [pije[0], pije[3], pije[4], pije[5], pije[6]]
    je5 = [R, je[2], je[3], je[4], je[5]]
    out = {"stoi": poza(S), "pije5": [poza(p) for p in pije5], "je5": [poza(p) for p in je5], "siedzi_pije": [poza(p) for p in pije], "siedzi_je": [poza(p) for p in je], "wstaje": [poza(p) for p in wstaje]}
    json.dump(out, open(wy, "w"))
    print({k: (len(v) if k != "stoi" else 18) for k, v in out.items()})
    for k in ("stoi", "pije5", "je5"): open(wy.replace(".json", "_" + k + ".json"), "w").write(json.dumps(out[k], separators=(",", ":")))
    if len(sys.argv) > 2:
        kosci = [("NECK", "RIGHT SHOULDER"), ("RIGHT SHOULDER", "RIGHT ELBOW"), ("RIGHT ELBOW", "RIGHT ARM"), ("NECK", "LEFT SHOULDER"), ("LEFT SHOULDER", "LEFT ELBOW"), ("LEFT ELBOW", "LEFT ARM"),
                 ("NECK", "RIGHT HIP"), ("RIGHT HIP", "RIGHT KNEE"), ("RIGHT KNEE", "RIGHT LEG"), ("NECK", "LEFT HIP"), ("LEFT HIP", "LEFT KNEE"), ("LEFT KNEE", "LEFT LEG"), ("NECK", "NOSE"), ("NOSE", "RIGHT EYE"), ("RIGHT EYE", "RIGHT EAR")]
        lista = [S] + pije
        sh = Image.new("RGB", (SIZE * 4 * len(lista), SIZE * 4), (40, 40, 44))
        d = ImageDraw.Draw(sh)
        for i, p in enumerate(lista):
            for a, b in kosci:
                c = (255, 120, 90) if "RIGHT" in a + b else (120, 170, 255)
                d.line([(i * SIZE * 4 + p[a][0] * 4, p[a][1] * 4), (i * SIZE * 4 + p[b][0] * 4, p[b][1] * 4)], fill=c, width=3)
            d.line([(i * SIZE * 4, OY * 4 + 60 * 4), ((i + 1) * SIZE * 4, OY * 4 + 60 * 4)], fill=(90, 90, 90))
        sh.resize((sh.width // 2, sh.height // 2)).save(sys.argv[2])


if __name__ == "__main__":
    main()
