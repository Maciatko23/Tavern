# -*- coding: utf-8 -*-
"""Jarmark (W17) w nowym Kruczogrodzie (Map220), 2026-11-16 (gracz: jarmark „na łące na południowym wschodzie”, pościg „uliczkami”).
Łąkę zajmuje pole jęczmienia (<Pole:16,8>, x 50..65, y 55..62) i wiatrak (45,60) - zostają; jarmark stoi DOOKOŁA nich:
kramy przy placyku młyna i pod polem, scena w rogu przy dolnej drodze (widownia na drodze), beczki przy scenie.
Ten skrypt NICZEGO nie zapisuje do mapy (wszystko wstrzykuje Jarmark.js): sprawdza kratki układu z js/plugins/Jarmark_Data.js
(wolne, nie na drodze młyna, nie na polu) i robi podgląd.
  python tools/jarmark/uklad_220.py [podglad.png]"""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as L
from PIL import ImageDraw

POLE = (50, 55, 65, 62)
MLYN = [(x, y) for x in (44, 45, 46) for y in range(54, 67)]      # the tower and the mill's path down to the road


def dane():
    js = r"""
    global.window = global; window.Tawerna = { api(){}, on(){}, register(n,o){return o;} };
    window.Watki = { zTekstu: () => ({}), watek: () => ({ tx: null, Q: {} }) };
    require(process.argv[1]);
    const D = window.JarmarkData; process.stdout.write(JSON.stringify(D));"""
    r = subprocess.run(["node", "-e", js, os.path.join(ROOT, "js", "plugins", "Jarmark_Data.js")], capture_output=True, text=True, encoding="utf-8")
    if r.returncode: raise SystemExit(r.stderr[-800:])
    return json.loads(r.stdout)


def main():
    D = dane()
    m = L.Mapa(220)
    blk = set()
    for z in m.zd:
        if z.blokuje: blk.update(z.komorki_blokujace())
    S = D["SCENA"]
    rzeczy = []                                       # (x, y, what, cells that must be free)
    for i, (x, y) in enumerate(D["KRAMY"]): rzeczy.append((x, y, "kram%d" % i, [(x - 1, y), (x, y), (x + 1, y), (x, y + 1)]))
    for i, (x, y) in enumerate(D["LAMPY"]): rzeczy.append((x, y, "lampa%d" % i, [(x, y)]))
    for i, (x, y) in enumerate(D["BECZKI"]): rzeczy.append((x, y, "beczka%d" % i, [(x, y)]))
    rzeczy.append((S["x"], S["y"], "scena", [(x, y) for x in range(S["x"] - 3, S["x"] + 4) for y in range(S["y"] - 2, S["y"] + 1)]))
    for i, (x, y) in enumerate(S["torches"]): rzeczy.append((x, y, "pochodnia%d" % i, [(x, y)]))
    for k in ("poduszka", "widz", "zakulisy"): rzeczy.append((S[k][0], S[k][1], k, [(S[k][0], S[k][1])]))
    for k, v in D["TRUPA"].items(): rzeczy.append((v["pos"][0], v["pos"][1], k, [(v["pos"][0], v["pos"][1])]))
    for i, c in enumerate(D["TLUM"]): rzeczy.append((c[1], c[2], "widz%d" % i, [(c[1], c[2])]))
    for k, v in S.get("aktorzy", {}).items(): pass
    zle = 0
    zajete = {}
    for x, y, co, cells in rzeczy:
        for c in cells:
            why = None
            if not m.kratka_wolna(*c): why = "ściana/kafel"
            elif c in blk: why = "zdarzenie mapy"
            elif POLE[0] <= c[0] <= POLE[2] and POLE[1] <= c[1] <= POLE[3]: why = "pole jęczmienia"
            elif c in MLYN and not co.startswith(("lampa",)): why = "wiatrak/ścieżka młyna"
            if why: print("ZLE", co, c, why); zle += 1
        if (x, y) in zajete and {co, zajete[(x, y)]} != {"szept", "zakulisy"}: print("DUBEL", co, "i", zajete[(x, y)], (x, y)); zle += 1
        zajete[(x, y)] = co
    print("rzeczy:", len(rzeczy), "błędów:", zle)
    # the chase: every leg of Szept's run walkable (4 ways, the map's passability + the fair's solid things), and with the barrels
    # knocked over in the gap the hero still gets from the start to the end
    solid = set()
    for x, y in D["KRAMY"]: solid.update([(x - 1, y), (x, y), (x + 1, y)])
    for c in D["LAMPY"] + D["BECZKI"] + S["torches"]: solid.add(tuple(c))
    solid.update((x, y) for x in range(S["x"] - 3, S["x"] + 4) for y in range(S["y"] - 2, S["y"] + 1))
    for c in D["NOC_DZWONNICA"]["lampy"] + D["NOC_DZWONNICA"]["ogniska"]: solid.add(tuple(c))
    DIRS = {2: (0, 1), 4: (-1, 0), 6: (1, 0), 8: (0, -1)}
    OPP = {2: 8, 8: 2, 4: 6, 6: 4}
    def droga(a, b, extra=()):
        from collections import deque
        bl = solid | blk | set(extra)
        prev = {a: None}; q = deque([a])
        while q:
            c = q.popleft()
            if c == b: break
            for d, (dx, dy) in DIRS.items():
                n = (c[0] + dx, c[1] + dy)
                if n in prev or not m.inside(*n) or n in bl: continue
                if not m.przechodnia(c[0], c[1], d) or not m.przechodnia(n[0], n[1], OPP[d]): continue
                prev[n] = c; q.append(n)
        if b not in prev: return None
        n, k = b, 0
        while prev[n]: n = prev[n]; k += 1
        return k
    P = D["POGON"]
    pts = [tuple(P["szept"][:2])] + [tuple(c) for c in P["trasa"]]
    for c in [tuple(P["start"][:2])] + pts:
        if c in solid or c in blk or not m.kratka_wolna(*c): print("ZLE trasa: kratka zajęta", c); zle += 1
    total = 0
    for a, b in zip(pts, pts[1:]):
        k = droga(a, b)
        if k is None: print("ZLE trasa: brak drogi", a, "->", b); zle += 1
        else: total += k
    pz = P["przeszkoda"]
    k1 = droga(tuple(P["start"][:2]), pts[-1]); k2 = droga(tuple(P["start"][:2]), pts[-1], [(pz["x"], pz["y"])])
    print("pościg: %d kratek biegu Szepta; bohater do mety %s, z beczkami w przejściu %s" % (total, k1, k2))
    if k2 is None: print("ZLE: beczki zamykają jedyną drogę"); zle += 1
    if droga(pts[pz["po"]], pts[pz["po"] + 1]) is None or droga(pts[pz["po"] + 1], pts[pz["po"] + 2], [(pz["x"], pz["y"])]) is None:
        print("ZLE: beczki na trasie Szepta po ich przewróceniu"); zle += 1
    for sl in D["SLADY"]:
        mm = m if sl["map"] == 220 else L.Mapa(sl["map"])
        if not mm.kratka_wolna(sl["x"], sl["y"]): print("ZLE ślad", sl["k"], "na ścianie"); zle += 1
    png = next((a for a in sys.argv[1:] if a.endswith(".png")), None)
    if png:
        raw = json.loads(json.dumps(m.raw))
        def ev(x, y, ch, idx=0, d=2, p=1, note=""):
            raw["events"].append({"id": len(raw["events"]), "name": "x", "note": note, "x": x, "y": y, "pages": [{"conditions": {}, "image": {"tileId": 0,
                "characterName": ch, "characterIndex": idx, "direction": d, "pattern": p}, "priorityType": 1, "through": False, "trigger": 0, "list": []}]})
        for i, (x, y) in enumerate(D["KRAMY"]): ev(x, y, "!Town_Props", 2, 6, i % 3)
        for x, y in D["LAMPY"]: ev(x, y, "!lamp", 0, 2, 0)
        for x, y in D["BECZKI"]: ev(x, y, "!Tavern_Yard", 0, 8, 0)
        ev(S["x"], S["y"], "!$Jarmark_Scena")
        for x, y in S["torches"]: ev(x, y, "!Decoration", 3, 4, 1)
        ev(S["poduszka"][0], S["poduszka"][1], "!$Jarmark_Kruk")
        for k, v in D["TRUPA"].items(): ev(v["pos"][0], v["pos"][1], v["sheet"], 0, v["pos"][2])
        for c in D["TLUM"]: ev(c[1], c[2], c[0], 0, 8)
        mm = L.Mapa(220, raw=raw)
        reg = (34, 44, 79, 72)
        im = L.render(mm, region=reg).convert("RGB")
        dr = ImageDraw.Draw(im, "RGBA")
        dr.rectangle(((POLE[0] - reg[0]) * 48, (POLE[1] - reg[1]) * 48, (POLE[2] - reg[0] + 1) * 48 - 1, (POLE[3] - reg[1] + 1) * 48 - 1), fill=(220, 190, 60, 70), outline=(220, 190, 60, 255))
        im.save(png); print("podgląd:", png)
    return zle


if __name__ == "__main__":
    sys.exit(1 if main() else 0)
