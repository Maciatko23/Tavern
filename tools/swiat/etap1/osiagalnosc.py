# -*- coding: utf-8 -*-
"""Osiagalnosc map od Domu dziadka (20): flood po mapach i przejsciach. Przed (data/) i po (staging/data/ + Swiat_Data).
  python tools/swiat/etap1/osiagalnosc.py"""
import os, sys, json, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
# przejscia doklejane w czasie gry przez wtyczki (Wyspa.js EDGES/LINKS, Orzel: wspinaczka) - dane stale
WYSPA = [(125, 155), (125, 162), (13, 159), (155, 125), (155, 157), (157, 155), (157, 159), (159, 157), (159, 13), (162, 125), (162, 165), (165, 162), (167, 157), (157, 167), (147, 167), (167, 147)]
ORZEL = [(13, 175), (175, 13)]


def graf(dane, swiat_js=None):
    g = {}
    infos = {m["id"]: m["name"] for m in json.load(open(os.path.join(ROOT, "data", "MapInfos.json"), encoding="utf-8")) if m}
    if os.path.exists(os.path.join(dane, "MapInfos.json")):
        infos = {m["id"]: m["name"] for m in json.load(open(os.path.join(dane, "MapInfos.json"), encoding="utf-8")) if m}
    for mid in infos:
        p = os.path.join(dane, "Map%03d.json" % mid)
        if not os.path.exists(p): p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
        if not os.path.exists(p): continue
        d = json.load(open(p, encoding="utf-8"))
        for e in d["events"]:
            if not e: continue
            for pg in e["pages"]:
                for c in pg["list"]:
                    if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] != mid: g.setdefault(mid, set()).add(c["parameters"][1])
    for a, b in WYSPA + ORZEL: g.setdefault(a, set()).add(b)
    if swiat_js:
        txt = open(swiat_js, encoding="utf-8").read()
        blok = txt[txt.rindex("links:"):txt.rindex("later:")]
        for o in re.findall(r"\{[^{}]*\}", blok):
            l = json.loads(o); g.setdefault(l["a"], set()).add(l["b"])
    return g, infos


def flood(g, s):
    seen = {s}; st = [s]
    while st:
        x = st.pop()
        for y in g.get(x, ()):
            if y not in seen: seen.add(y); st.append(y)
    return seen


if __name__ == "__main__":
    g0, inf0 = graf(os.path.join(ROOT, "data"))
    r0 = flood(g0, 20)
    g1, inf1 = graf(os.path.join(HERE, "staging", "data"), os.path.join(HERE, "staging", "js", "plugins", "Swiat_Data.js"))
    r1 = flood(g1, 20)
    print("PRZED: osiagalne %d z %d map z przejsciami; nieosiagalne dzis: %s" % (len(r0), len(inf0), sorted(m for m in inf0 if m not in r0)))
    print("PO:    osiagalne %d z %d; nieosiagalne: %s" % (len(r1), len(inf1), sorted(m for m in inf1 if m not in r1)))
    straty = sorted(m for m in r0 if m not in r1)
    print("STRACONE wzgledem dzis (osiagalne dzis, nie po): %s" % (straty or "brak"))
    print("nowo osiagalne: %s" % sorted(m for m in r1 if m not in r0))
    sys.exit(1 if straty else 0)
