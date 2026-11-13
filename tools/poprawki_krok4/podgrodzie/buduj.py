# -*- coding: utf-8 -*-
"""Krok 4, Map111 Podgrodzie: poprawki 3-8, 10-12 (9 = brzeg morza: patrz raport). TYLKO staging/data/Map111.json.
   python tools/poprawki_krok4/podgrodzie/buduj.py"""
import json, os, sys, copy
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy")); sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import mapylib as L, wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
SRC = os.path.join(ROOT, "data", "Map111.json"); OUT = os.path.join(HERE, "staging", "data", "Map111.json")
raw = open(SRC, "rb").read(); m = json.loads(raw.decode("utf-8"))
assert W.map_text(m).encode("utf-8") == raw, "Map111 nie w ukladzie edytora"
Wd, Hd = m["width"], m["height"]; d = m["data"]
at = lambda z, x, y: d[(z * Hd + y) * Wd + x]
def put(z, x, y, v): d[(z * Hd + y) * Wd + x] = v
kind = lambda t: (t - 2048) // 48 if t >= 2048 else None
def setk(z, x, y, k): put(z, x, y, 2048 + k * 48)
ev = {e["id"]: e for e in m["events"] if e}
rep = []
c0, c1 = set(), set()
def box(x0, y0, x1, y1): return [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
before = L.Mapa(111, raw=json.loads(raw.decode("utf-8"))); reach0 = before.flood(before.starty())

# ---- 12: the editor's shadow pen (layer 4) out - Cienie.js draws the soft ones
n4 = sum(1 for i in range(Wd * Hd) if d[4 * Wd * Hd + i])
for i in range(Wd * Hd): d[4 * Wd * Hd + i] = 0
rep.append("12: warstwa cieni (4): %d kratek wyczyszczone" % n4)

# ---- 11: loose fence bits, lone tuft, the rubble chain (x38-41,y19-24)
for (x, y) in box(32, 21, 48, 30):
    if at(1, x, y) and kind(at(1, x, y)) in (22, 21): put(1, x, y, 0); c1.add((x, y))
for (x, y) in box(38, 19, 41, 24):
    if at(1, x, y) and kind(at(1, x, y)) == 47: put(1, x, y, 0); c1.add((x, y))
rep.append("11: luzne kawalki plotu, kepka i lancuszek kamieni usuniete")

# ---- 3: paddock (x34-55, y110-118) closed on four sides; gates: west (y116-117, the path), south (x44-45)
FENCE = 22
for (x, y) in box(34, 110, 55, 119):
    if kind(at(1, x, y)) == FENCE: put(1, x, y, 0)
    c1.add((x, y))
for (x, y) in box(35, 118, 54, 119): put(1, x, y, 0)
fen = [(x, 110) for x in range(34, 56)] + [(x, 118) for x in range(34, 56) if x not in (44, 45)] \
    + [(34, y) for y in range(111, 118) if y not in (116, 117)] + [(55, y) for y in range(111, 118)]
for (x, y) in fen: setk(1, x, y, FENCE)
for (x, y) in box(35, 118, 54, 119): setk(0, x, y, 16)
for (x, y) in box(44, 118, 45, 119): setk(0, x, y, 17)
for (x, y) in box(35, 111, 54, 117): setk(0, x, y, 17)
for (x, y) in box(31, 117, 34, 117): setk(0, x, y, 17)
c0.update(box(28, 108, 58, 119))
rep.append("3: wybieg: plot z 4 stron, furtka zachodnia (y116-117, 2 kratki) przy sciezce, furtka poludniowa (x44-45); dolny plot y118, pas y119 wolny (szwy S x35-54 zostaja)")

# ---- 10 + 4: north road straight, 3 wide (x106-108 at the seam, jogs west to x104-106 before the moat's head, joins the bridge plaza)
def road_row(y):
    a = 106 if y <= 11 else 107 if y <= 21 else 106 if y <= 29 else 105 if y <= 37 else 104
    return (a, a + 2)
roadc = set()
for y in range(0, 49):
    a, b = road_row(y)
    for x in range(a, b + 1): roadc.add((x, y))
for (x, y) in box(103, 0, 111, 48):
    k = kind(at(0, x, y))
    if (x, y) in roadc: setk(0, x, y, 17)
    elif k in (17, 24, 26): setk(0, x, y, 16)
for (x, y) in box(104, 28, 117, 47):
    if kind(at(0, x, y)) in (17, 19, 26, 41) and (x, y) not in roadc: setk(0, x, y, 16)
for (x, y) in sorted(roadc):
    if at(1, x, y) and kind(at(1, x, y)) != 38 and not (x <= 105 and y >= 49): put(1, x, y, 0); c1.add((x, y))
for (x, y) in box(103, 0, 111, 48):
    if at(1, x, y) and kind(at(1, x, y)) == 36: put(1, x, y, 0); c1.add((x, y))
c0.update(box(101, 0, 112, 50))

# ---- 4 + 5 + 7: the moat: one stone bank (kind 41), rounded heads
BED = 19; BANK = 41
beds = box(110, 39, 116, 47) + box(110, 54, 116, 104)
bank = box(109, 38, 117, 38) + [(x, y) for y in range(39, 48) for x in (109, 117)] + \
       [(x, y) for y in range(54, 105) for x in (109, 117)] + box(109, 105, 117, 105)
bs, ks = set(beds), set(bank)
for (x, y) in box(109, 29, 117, 47) + box(109, 54, 117, 108):
    if (x, y) not in bs and (x, y) not in ks and kind(at(0, x, y)) in (17, 19, 26, 41, 27): setk(0, x, y, 16)
for (x, y) in beds: setk(0, x, y, BED)
for (x, y) in bank: setk(0, x, y, BANK)
for (x, y) in box(109, 106, 117, 108):
    if kind(at(0, x, y)) in (19, 26, 41): setk(0, x, y, 16)
for (x, y) in [(117, 105), (117, 109)]:
    if at(1, x, y): put(1, x, y, 0)
c0.update(box(109, 28, 117, 108)); c1.update(box(109, 28, 117, 108))
rep.append("4/5/7: fosa: jedno pobocze z ciemnego kamienia (rodzaj 41) od glowy y38 do konca y105, zaokraglone glowy, loze y39-47 i y54-104")

for y in list(range(39, 48)) + list(range(55, 105)):
    if at(1, 107, y) and kind(at(1, 107, y)) in (21, 23): put(1, 107, y, 0); c1.add((107, y))
# ---- 6: mud on layer 1 (kind 26), dry reeds, stones
for (x, y) in box(109, 36, 117, 108):
    if at(1, x, y): put(1, x, y, 0)
MUDK = int(os.environ.get("MUDK", "39"))
MUD = [(113, 42, 115, 43), (111, 45, 112, 46), (111, 57, 112, 58), (114, 62, 115, 64), (111, 69, 113, 70), (113, 76, 115, 77),
       (111, 84, 112, 86), (114, 90, 115, 91), (112, 97, 114, 98), (111, 102, 112, 103)]
for (x0, y0, x1, y1) in MUD:
    for (x, y) in box(x0, y0, x1, y1): setk(1, x, y, MUDK); c1.add((x, y))
nid = max(ev) + 1
def clone(src, x, y):
    global nid
    e = copy.deepcopy(ev[src]); e["id"] = nid; e["x"], e["y"] = x, y
    while len(m["events"]) <= nid: m["events"].append(None)
    m["events"][nid] = e; ev[nid] = e; nid += 1; return e
REEDS = [(110, 41), (116, 44), (110, 59), (116, 66), (110, 73), (116, 80), (110, 93), (116, 96), (110, 100)]
STONES = [(47, 115, 72), (47, 110, 86), (44, 114, 94), (44, 111, 66), (47, 116, 54)]
id6 = nid
for (x, y) in REEDS: clone(326, x, y)
for (s, x, y) in STONES: clone(s, x, y)
rep.append("6: bloto (warstwa 1, rodzaj 26) %d plam, trzciny (suche wysokie) %d, kamienie %d (nowe zdarzenia id %d-%d)" % (len(MUD), len(REEDS), len(STONES), id6, nid - 1))

for e in ev.values():
    if (e['x'], e['y']) in roadc and e['id'] != 466 and e['y'] < 49: rep.append('UWAGA zdarzenie %d %s na drodze (%d,%d)' % (e['id'], e['name'], e['x'], e['y']))
# tree 466 stood where the road runs
e = ev[466]
if (e["x"], e["y"]) in roadc: rep.append("drzewo 466 (%d,%d) -> (107,41)" % (e["x"], e["y"])); e["x"], e["y"] = 107, 41

# ---- 8: the west pine row: one axis x19, every 4 rows, a gap (y48-57) for the palisade gate's road, symmetric about y52.5
rows = [38, 42, 46] + list(range(59, 96, 4))
old = [e for e in ev.values() if e["name"] == "Drzewo" and e["x"] == 19 and 36 <= e["y"] <= 99]
tmpl = copy.deepcopy(ev[170])
def size_of(map_id, x, y):
    h = 2166136261
    for ch in "%d:%d:%d" % (map_id, x, y): h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    u = (h >> 8) / float(1 << 24); return 0 if u < 0.25 else 1 if u < 0.60 else 2
def fmt(v): return ("%.2f" % v).rstrip("0").rstrip(".")
def tag(scale):
    hits, dmin, dmax, sway = 20, 6, 8, 0.6
    h = max(3, int(round(hits * scale))); a = max(1, int(round(dmin * scale))); b = max(a, int(round(dmax * scale)))
    return "<Tree:hits=%d,sway=%s,%sdropmin=%d,dropmax=%d>" % (h, fmt(sway), "" if scale >= 0.999 else "scale=%s," % fmt(scale), a, b)
free = sorted(e["id"] for e in old)
for e in old: m["events"][e["id"]] = None; del ev[e["id"]]
placed = []
for i, y in enumerate(rows):
    if free: eid = free.pop(0)
    else: eid = nid; nid += 1
    while len(m["events"]) <= eid: m["events"].append(None)
    e = copy.deepcopy(tmpl); e["id"] = eid; e["x"], e["y"] = 19, y
    im = e["pages"][0]["image"]; im["direction"], im["pattern"] = (4, 1) if i % 2 == 0 else (2, 2)
    e["note"] = tag((0.7, 0.85, 1.0)[size_of(111, 19, y)])
    m["events"][eid] = e; ev[eid] = e; placed.append((eid, y))
rep.append("8: szpaler sosen: %d drzew na osi x19 co 4 kratki (y %s), przerwa y47-58 na droge do bramy palisady; zdarzenia: %s; zwolnione id: %s" % (len(rows), rows, [p[0] for p in placed], free))
while m["events"] and m["events"][-1] is None: m["events"].pop()

# ---- autotiles
W.reshape(m, 0, W.ring(c0, 1)); W.reshape(m, 1, W.ring(c1, 1))
# ---- checks
for i, e in enumerate(m["events"]): assert (e is None) or e["id"] == i, ("indeks != id", i)
after = L.Mapa(111, raw=m); reach1 = after.flood(after.starty())
lost = sorted(reach0 - reach1)
rep.append("osiagalne kratki przed %d, po %d, utracone %d %s" % (len(reach0), len(reach1), len(lost), lost[:20]))
out = W.map_text(m).encode("utf-8"); assert json.loads(out.decode("utf-8")) == m and b"\r" not in out
os.makedirs(os.path.dirname(OUT), exist_ok=True); open(OUT, "wb").write(out)
print("\n".join(rep))
