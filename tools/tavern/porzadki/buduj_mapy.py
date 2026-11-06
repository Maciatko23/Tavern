# -*- coding: utf-8 -*-
"""Porządki w tawernie, część mapowa (gracz 2026-11-05: „napraw co się da”, „ma być ładnie i równo”). Z planu przedmiotów (tools/mapy/staging, plan_przedmiotow.py) robi staging/data/MapNNN.json:
  przedmioty, których popraw.py nie umie: obrazek przesunięty <Px:0,dy> (kafel -> zdarzenie z obrazkiem kafla), przyjęte tylko, gdy kontrola potwierdza; w jednym rzędzie stołu ta sama wysokość;
  Map001: notatka światła, ciągły chodnik w korytarzu, cienie z edytora, niewidzialne blokady przechodnie, obrazy niżej na ścianie, bez szarych rombów na ladzie; Map025: cienie z edytora.
Każda operacja sprawdza starą wartość. Do data/ zapisuje dopiero instaluj.py.
  python tools/tavern/porzadki/buduj_mapy.py"""
import os, re, sys, json, copy
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
os.chdir(ROOT)
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
import popraw as P
import mapylib as L
HERE = os.path.dirname(os.path.abspath(__file__))
WY = os.path.join(HERE, "staging", "data")
os.makedirs(WY, exist_ok=True)
DY = [-4, -8, -12, -16, -20, 4, 8, 12, 16, 20]
POMIN = {(1, 8, 47)}   # stołek z ręcznikami stoi na podłodze: kontrola bierze go za przedmiot w powietrzu


def p2(raw, mid):
    return [p for p in P.problemy(raw, mid)[0] if p["kod"] == "P2"]


def klucze(lista):
    return {(p["x"], p["y"], p["opis"].split(" w (")[0][:18]) for p in lista}


def px_przedmiotow(raw, mid):
    ed = P.Edycja(mid, copy.deepcopy(raw))
    zrobione, wiersz = [], {}
    for p in p2(ed.raw, mid):
        x, y = p["x"], p["y"]
        if (mid, x, y) in POMIN: continue
        m_e = re.search(r"zdarzenie (\d+) '", p["opis"])
        m_k = re.search(r"kafel (\d+) ", p["opis"])
        proby = [d for d in wiersz.get(y, [])] + [d for d in DY if d not in wiersz.get(y, [])]
        ile = len(p2(ed.raw, mid))
        for dy in proby:
            e2 = ed.kopia()
            if m_e:
                eid = int(m_e.group(1))
                ev = next(e for e in e2.raw["events"] if e and e["id"] == eid)
                ev["note"] = re.sub(r"<Px:-?\d+,-?\d+>", "", ev.get("note") or "") + "<Px:0,%d>" % dy
            elif m_k:
                t = int(m_k.group(1))
                z = 3 if e2.t(3, x, y) == t else 2 if e2.t(2, x, y) == t else None
                if z is None: break
                eid = e2.wolny_numer()
                e2.kafel(z, x, y, 0)
                e2.dodaj_zd(P.zd_przedmiot(eid, x, y, t, dy))
            else:
                break
            nowe = p2(e2.raw, mid)
            if not [q for q in nowe if (q["x"], q["y"]) == (x, y)] and len(nowe) < ile:
                ed = e2
                wiersz.setdefault(y, []).insert(0, dy)
                zrobione.append((x, y, dy, m_e.group(0) if m_e else "kafel " + m_k.group(1)))
                print("  + (%d,%d) %+d px  %s" % (x, y, dy, zrobione[-1][3]), flush=True)
                break
        else:
            print("  - (%d,%d) bez zmian: %s" % (x, y, p["opis"][:70]), flush=True)
    return ed.raw


def stare(raw, z, x, y, st, nw):
    W, H = raw["width"], raw["height"]
    i = (z * H + y) * W + x
    assert raw["data"][i] == st, ("kafel", z, x, y, raw["data"][i], st)
    raw["data"][i] = nw


def cienie(raw):
    W, H = raw["width"], raw["height"]
    n = 0
    for i in range(4 * H * W, 5 * H * W):
        if raw["data"][i]: raw["data"][i] = 0; n += 1
    return n


def map001(raw):
    n = raw["note"]
    assert "<DarkDay:180>" in n and "<DarkNight:225>" in n
    raw["note"] = n.replace("<DarkDay:180>", "<DarkDay:30>").replace("<DarkNight:225>", "<DarkNight:185>") + "\n<LightEdges:soft>"
    for x, st in ((35, 3821), (37, 3819), (47, 3821), (49, 3819), (51, 3821), (53, 3819), (63, 3821), (65, 3819)):   # jeden chodnik od (17,21) do (83,21)
        stare(raw, 1, x, 21, st, 3809)
    print("  cienie z edytora:", cienie(raw))
    for eid in (77, 78, 110, 174, 176):   # stoły, scena, rzutki: da się przejść, akcja zostaje
        pg = raw["events"][eid]["pages"][0]
        assert pg["priorityType"] == 1 and not pg["through"] and not pg["image"]["characterName"], eid
        pg["through"] = True
    for eid in (150, 151, 152, 153):      # obrazy korytarza: na ścianie, nie na jej górnej krawędzi
        ev = raw["events"][eid]
        assert "Px" not in (ev.get("note") or ""), eid
        ev["note"] = (ev.get("note") or "") + "<Px:0,22>"
    # szare romby na ladzie i w kuchni: dwa kafle (góra, dół na przodzie lady) -> zwykły blat
    for z, x, y, st, nw in ((3, 49, 29, 802, 0), (2, 49, 29, 771, 769), (2, 51, 29, 802, 769), (3, 51, 29, 895, 0), (3, 49, 30, 810, 777), (2, 49, 30, 777, 0), (3, 51, 30, 810, 777), (2, 51, 30, 777, 0),
                            (2, 42, 11, 801, 769), (3, 42, 11, 895, 0), (3, 42, 12, 809, 777), (2, 42, 12, 777, 0)):
        stare(raw, z, x, y, st, nw)
    return raw


for mid in (1, 25):
    src = os.path.join("tools", "mapy", "staging", "Map%03d.json" % mid)
    raw = L.load_json(src)
    print("Map%03d" % mid, "P2 na starcie:", len(p2(raw, mid)), flush=True)
    raw = px_przedmiotow(raw, mid)
    if mid == 1: raw = map001(raw)
    else: print("  cienie z edytora:", cienie(raw))
    print("Map%03d" % mid, "P2 na końcu:", len(p2(raw, mid)), flush=True)
    tekst = P.tekst_mapy(raw)
    open(os.path.join(WY, "Map%03d.json" % mid), "wb").write(tekst if isinstance(tekst, bytes) else tekst.encode("utf-8"))
print("gotowe")
