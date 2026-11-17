# -*- coding: utf-8 -*-
"""Schody w dół mają wyglądać jak zejście (gracz 2026-11-16: „te na obrazku wyglądają, jakby szły w górę”): na każdym biegu w dół
leży obrazek-cień (3 x 6 kratek) - u góry czerń łącząca się z ciemnym pasem napisu, niżej coraz jaśniej, przy bokach cień ścian
studni schodów. Zdarzenie rysowane NAD postaciami: schodzący bohater wchodzi w ciemność. Stare cienie kafli na biegach znikają.
  python tools/tawerna/schody_dol.py            (Map025: x2, x26; Map026: x6, x30; edytor zamknięty)"""
import datetime, importlib.util, os, re, shutil, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)
NAME = "!$1_Schody_Dol_Cien"


def picture():
    w, h = 144, 288
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); px = im.load()
    for y in range(h):
        t = 1 - y / (h * 0.86)                               # 1 at the top, 0 a little above the bottom
        a = 0 if t <= 0 else 255 * min(1, t * 1.25) ** 1.5
        a = int(a // 8 * 8)                                   # (soft bands, as pixel art shades)
        for x in range(w):
            side = min(x, w - 1 - x)
            reach = 6 + 16 * max(0, t)                        # the well's walls throw more shadow the deeper it goes
            b = a + (90 * max(0, 1 - side / reach) if side < reach else 0) * (0.35 + 0.65 * max(0, t))
            px[x, y] = (10, 8, 14, int(max(0, min(255, b))))
    return im


def main():
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "tawerna_schody_dol_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    picture().save(os.path.join(ROOT, "img", "characters", NAME + ".png"))
    cond = {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1, "switch1Valid": False,
            "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0}
    for n, xs in ((25, (2, 26)), (26, (6, 30))):
        rel = os.path.join(ROOT, "data", "Map%03d.json" % n); m, lay = RW.read_json("data/Map%03d.json" % n); shutil.copy2(rel, bak)
        W, H = m["width"], m["height"]
        d = np.array(m["data"], dtype=np.int64).reshape(6, H, W)
        for cx in xs: d[4, 33:40, cx - 1:cx + 2] = 0
        m["data"] = [int(v) for v in d.reshape(-1)]
        for cx in xs:
            if any(e and e["name"] == "Cień schodów w dół" and e["x"] == cx for e in m["events"]): continue
            pg = {"conditions": dict(cond), "directionFix": True, "image": {"tileId": 0, "characterName": NAME, "direction": 2, "pattern": 1, "characterIndex": 0},
                  "list": [{"code": 0, "indent": 0, "parameters": []}], "moveFrequency": 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
                  "moveSpeed": 3, "moveType": 0, "priorityType": 2, "stepAnime": False, "through": True, "trigger": 0, "walkAnime": False}
            m["events"].append({"id": len(m["events"]), "name": "Cień schodów w dół", "note": "", "pages": [pg], "x": cx, "y": 39})
        open(rel, "wb").write(RW.json_text(m, lay))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak); s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano; kopia:", bak)


if __name__ == "__main__":
    main()
