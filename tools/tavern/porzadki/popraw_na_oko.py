# -*- coding: utf-8 -*-
"""Porządki w tawernie: poprawki po obejrzeniu każdego przedmiotu (2026-11-05). Kontrola (P2) przyjmowała też zmiany, które źle wyglądały: kufle i księga nad stołem, butelka na ławce, tort zwisający z przodu, stołek na stole.
Każda operacja sprawdza starą wartość. Zapis do data/ i staging/data (edytor zamknięty).
  python tools/tavern/porzadki/popraw_na_oko.py"""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
os.chdir(ROOT)
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
import popraw as P
if any(n in subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout.lower() for n in ("rpgmz", "rpg maker", "rmmz")):
    print("STOP: edytor otwarty"); sys.exit(1)


def kafel(raw, z, x, y, st, nw):
    W, H = raw["width"], raw["height"]
    i = (z * H + y) * W + x
    assert raw["data"][i] == st, (z, x, y, raw["data"][i], st)
    raw["data"][i] = nw


def wolny(raw):
    uzyte = {e["id"] for e in raw["events"] if e}
    n = 423
    while n in uzyte: n += 1
    return n


def dodaj(raw, x, y, t, dx, dy):
    eid = wolny(raw)
    e = P.zd_przedmiot(eid, x, y, t, dy)
    e["note"] = "<Px:%d,%d>" % (dx, dy)
    while len(raw["events"]) <= eid: raw["events"].append(None)
    raw["events"][eid] = e


def px(raw, x, y, t, dx, dy):
    """zdarzenie z obrazkiem kafla t w (x,y): nowe przesunięcie"""
    ev = [e for e in raw["events"] if e and e["x"] == x and e["y"] == y and e["pages"][0]["image"]["tileId"] == t]
    assert len(ev) == 1, (x, y, t, len(ev))
    ev[0]["note"] = re.sub(r"<Px:-?\d+,-?\d+>", "", ev[0]["note"] or "") + "<Px:%d,%d>" % (dx, dy)


def m001(raw):
    for x, ys, t, dy in ((6, 36, 619, -12), (7, 36, 602, -12)):   # butelka i kufel: z ławki z powrotem na stół
        kafel(raw, 3, x, ys, t, 0)
        dodaj(raw, x, 35, t, 0, dy)
    for x in (19, 33):                                             # kufle na środek okrągłego stołu
        kafel(raw, 3, x, 36, 603, 0)
        dodaj(raw, x, 36, 603, 0, -16)
    kafel(raw, 3, 30, 53, 592, 0)                                  # miska na środek okrągłego stołu
    dodaj(raw, 30, 53, 592, 0, -18)
    px(raw, 30, 48, 626, 0, -4)                                    # tort na stole, nie przed nim
    px(raw, 70, 47, 598, 0, 22)                                    # księga na stole, nie nad nim
    px(raw, 23, 14, 633, -10, -4)                                  # dzban nie na rogu
    ev = raw["events"][116]                                        # stołek z ręcznikami: na podłogę obok stołu
    assert ev["name"] == "ręczniki" and ev["x"] == 19 and ev["y"] == 49, (ev["name"], ev["x"], ev["y"])
    assert not [e for e in raw["events"] if e and e["x"] == 17 and e["y"] == 49]
    ev["x"] = 17
    ev["note"] = re.sub(r"<Px:-?\d+,-?\d+>", "", ev["note"] or "")


def m025(raw):
    px(raw, 83, 9, 603, 0, 28)                                     # kufle na stole, nie na podłodze nad nim
    px(raw, 19, 62, 603, 0, 24)


for mid, fn in ((1, m001), (25, m025)):
    p = "data/Map%03d.json" % mid
    raw = json.loads(open(p, "rb").read().decode("utf-8"))
    fn(raw)
    t = P.tekst_mapy(raw)
    t = t if isinstance(t, bytes) else t.encode("utf-8")
    open(p, "wb").write(t)
    open(os.path.join(HERE, "staging", "data", "Map%03d.json" % mid), "wb").write(t)
    print("zapisano", p)
