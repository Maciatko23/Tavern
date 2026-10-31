# Mapa świata (2026-10-30, gracz: „pokaż mi mapę wszystkiego, jak poszczególne kawałki mapy są połączone - czy linia brzegowa jest ok
# i wejścia na daną mapę z danej strony mają sens”).
# Wszystkie mapy plenerowe jako miniaturki z prawdziwych kafli, ułożone tak, jak prowadzą przejścia: zaczynając od Okolic Tawerny,
# sąsiad stoi tam, gdzie wypada jego lądowanie z przesunięciem przejścia (jak liczy Krawedzie.js: miejsce wzdłuż krawędzi zostaje).
# Przejścia: zdarzenia „Przenieś gracza” na krawędziach map (data/), EDGES i LINKS z js/plugins/Wyspa_Data.js, ścieżka na Orlą Grań
# (Orzel_Data.js WAY_UP / WAY_DOWN). Linie: zielona - przejście zgodne z ułożeniem; czerwona - niezgodne (wejście z innej strony,
# lądowanie daleko od miejsca wyjścia, mapy na sobie); fioletowa przerywana - przejście nie przez krawędź (wspinaczka).
#   python tools/mapy/swiat.py [--skala 6] [--wyjscie docs/mapy/swiat.png]
import os, sys, re, json, collections
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import mapylib as L
from PIL import Image, ImageDraw, ImageFont

args = sys.argv[1:]
def opt(name, d):
    return args[args.index("--" + name) + 1] if "--" + name in args else d
PX = int(opt("skala", 6))                                   # pixels per tile in the picture
OUT = os.path.join(ROOT, opt("wyjscie", "docs/mapy/swiat.png"))
DATA = os.path.join(ROOT, "data")

OUTDOOR = [8, 24, 111, 125, 22, 20, 21, 13, 120, 175, 23, 168, 3, 4, 17, 18, 162, 165, 155, 157, 159]   # (MapaWyspy_Data MIEJSCA)
info = {m["id"]: m["name"] for m in json.load(open(os.path.join(DATA, "MapInfos.json"), encoding="utf-8")) if m}
size = {}
for mid in OUTDOOR:
    m = json.load(open(os.path.join(DATA, "Map%03d.json" % mid), encoding="utf-8"))
    size[mid] = (m["width"], m["height"])

def side_of(mid, x, y):
    w, h = size[mid]
    if x <= 0: return "W"
    if x >= w - 1: return "E"
    if y <= 0: return "N"
    if y >= h - 1: return "S"
    return None

# ---- the links: (from, (x, y) cells, to, (x, y) landing, source)
links = []
for mid in OUTDOOR:
    m = json.load(open(os.path.join(DATA, "Map%03d.json" % mid), encoding="utf-8"))
    seen = set()
    for e in m["events"]:
        if not e: continue
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] in size:
                    k = (e["x"], e["y"], c["parameters"][1])
                    if k in seen: continue
                    seen.add(k)
                    links.append((mid, (e["x"], e["y"]), c["parameters"][1], (c["parameters"][2], c["parameters"][3]), "zdarzenie"))
wy = open(os.path.join(ROOT, "js", "plugins", "Wyspa_Data.js"), encoding="utf-8").read()
for mo in re.finditer(r"from:\s*(\d+),\s*to:\s*(\d+),[^{}]*?cells:\s*(\[\[[^\]]*\](?:,\s*\[[^\]]*\])*\]),\s*land:\s*(\[\[[^\]]*\](?:,\s*\[[^\]]*\])*\])", wy):
    a, b, cells, land = int(mo.group(1)), int(mo.group(2)), json.loads(mo.group(3)), json.loads(mo.group(4))
    for c, l in zip(cells, land): links.append((a, tuple(c), b, tuple(l), "Wyspa_Data"))
for mo in re.finditer(r"from:\s*(\d+),\s*cells:\s*(\[\[[^\]]*\](?:,\s*\[[^\]]*\])*\]),\s*to:\s*(\d+),\s*land:\s*(\[\[[^\]]*\](?:,\s*\[[^\]]*\])*\])", wy):
    a, cells, b, land = int(mo.group(1)), json.loads(mo.group(2)), int(mo.group(3)), json.loads(mo.group(4))
    if a in size and b in size:
        for c, l in zip(cells, land): links.append((a, tuple(c), b, tuple(l), "Wyspa_Data"))
links.append((13, (53, 6), 175, (20, 57), "wspinaczka"))     # (Orzel_Data.js WAY_UP / WAY_DOWN)
links.append((175, (20, 59), 13, (53, 7), "wspinaczka"))

# one link per (from, side, to) for the layout: the middle cell of the group
groups = collections.defaultdict(list)
for (a, c, b, l, src) in links:
    groups[(a, side_of(a, *c) if src != "wspinaczka" else "wspin", b)].append((c, l, src))

def place_from(a, pos_a, side, c, l, b):
    ax, ay = pos_a; wa, ha = size[a]; wb, hb = size[b]
    if side == "E": return (ax + wa, ay + c[1] - l[1])
    if side == "W": return (ax - wb, ay + c[1] - l[1])
    if side == "S": return (ax + c[0] - l[0], ay + ha)
    if side == "N": return (ax + c[0] - l[0], ay - hb)
    return None

pos = {8: (0, 0)}
queue = collections.deque([8])
order = [8]
while queue:
    a = queue.popleft()
    for (fa, side, b), lst in sorted(groups.items(), key=lambda kv: (kv[0][0], str(kv[0][1]), kv[0][2])):
        if fa != a or b in pos or side in (None, "wspin"): continue
        c, l, _ = lst[len(lst) // 2]
        p = place_from(a, pos[a], side, c, l, b)
        pos[b] = p; queue.append(b); order.append(b)
    # (the way back: a link b -> a placed b too, when a has none to b)
    for (fb, side, ta), lst in sorted(groups.items(), key=lambda kv: (kv[0][0], str(kv[0][1]), kv[0][2])):
        if ta != a or fb in pos or side in (None, "wspin"): continue
        c, l, _ = lst[len(lst) // 2]
        # b's exit c on its side lands at l in a: b.origin = a.origin + l - c - step
        ax, ay = pos[a]; wb, hb = size[fb]
        if side == "E": p = (ax - wb, ay + l[1] - c[1])
        elif side == "W": p = (ax + size[a][0], ay + l[1] - c[1])
        elif side == "S": p = (ax + l[0] - c[0], ay - hb)
        else: p = (ax + l[0] - c[0], ay + size[a][1])
        pos[fb] = p; queue.append(fb); order.append(fb)
# the maps reached only by a climb or not at all: east of the rest, in a column
free_x = max(pos[m][0] + size[m][0] for m in pos) + 20
fy = min(p[1] for p in pos.values())
for mid in OUTDOOR:
    if mid not in pos:
        pos[mid] = (free_x, fy); fy += size[mid][1] + 12

# overlaps (two maps on the same ground)
def rect(m): return (pos[m][0], pos[m][1], pos[m][0] + size[m][0], pos[m][1] + size[m][1])
overl = []
for i, a in enumerate(OUTDOOR):
    for b in OUTDOOR[i + 1:]:
        A, B = rect(a), rect(b)
        ix, iy = min(A[2], B[2]) - max(A[0], B[0]), min(A[3], B[3]) - max(A[1], B[1])
        if ix > 0 and iy > 0: overl.append((a, b, ix, iy))

# ---- the picture
minx = min(p[0] for p in pos.values()) - 4; miny = min(p[1] for p in pos.values()) - 4
maxx = max(pos[m][0] + size[m][0] for m in pos) + 4; maxy = max(pos[m][1] + size[m][1] for m in pos) + 4
W, H = (maxx - minx) * PX, (maxy - miny) * PX + 140
img = Image.new("RGBA", (W, H), (18, 22, 30, 255))
d = ImageDraw.Draw(img)
def font(sz):
    for f in ("C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"):
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()
F, FS = font(max(14, PX * 3)), font(max(12, PX * 2))
for mid in OUTDOOR:
    mp = L.Mapa(mid)
    th = L.render(mp, scale=PX / 48.0)
    x, y = (pos[mid][0] - minx) * PX, (pos[mid][1] - miny) * PX
    img.alpha_composite(th, (x, y))
    d.rectangle([x, y, x + th.width - 1, y + th.height - 1], outline=(255, 255, 255, 110), width=1)
for mid in OUTDOOR:   # (the names over everything)
    x, y = (pos[mid][0] - minx) * PX, (pos[mid][1] - miny) * PX
    lab = "%d %s" % (mid, info.get(mid, ""))
    tw = d.textlength(lab, font=F)
    d.rectangle([x + 4, y + 4, x + 12 + tw, y + 10 + F.size], fill=(0, 0, 0, 200))
    d.text((x + 8, y + 5), lab, fill=(255, 235, 140, 255), font=F)
def wpt(m, c): return ((pos[m][0] + c[0] + 0.5 - minx) * PX, (pos[m][1] + c[1] + 0.5 - miny) * PX)
bad = []
for (a, c, b, l, src) in links:
    p1, p2 = wpt(a, c), wpt(b, l)
    dist = ((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2) ** 0.5 / PX
    if src == "wspinaczka":
        col = (190, 110, 255, 255)
    elif dist <= 3.5:
        col = (90, 240, 110, 255)
    else:
        col = (255, 70, 70, 255); bad.append((a, c, b, l, round(dist)))
    d.line([p1, p2], fill=col, width=max(2, PX // 2))
    r = max(2, PX // 2)
    d.rectangle([p1[0] - r, p1[1] - r, p1[0] + r, p1[1] + r], fill=col)
for (a, b, ix, iy) in overl:
    A, B = rect(a), rect(b)
    x0, y0, x1, y1 = max(A[0], B[0]), max(A[1], B[1]), min(A[2], B[2]), min(A[3], B[3])
    d.rectangle([(x0 - minx) * PX, (y0 - miny) * PX, (x1 - minx) * PX, (y1 - miny) * PX], outline=(255, 70, 70, 255), width=max(2, PX // 2))
# the key
ky = H - 130
d.rectangle([0, ky, W, H], fill=(10, 12, 18, 255))
d.text((12, ky + 8), "Mapa świata Kruczej Wyspy - mapy plenerowe ułożone według przejść (od 8 Okolice Tawerny). %d px na kratkę." % PX, fill=(240, 240, 240, 255), font=FS)
d.line([(12, ky + 48), (60, ky + 48)], fill=(90, 240, 110, 255), width=4); d.text((70, ky + 38), "przejście zgodne z ułożeniem", fill=(220, 220, 220, 255), font=FS)
d.line([(12, ky + 78), (60, ky + 78)], fill=(255, 70, 70, 255), width=4); d.text((70, ky + 68), "niezgodne: wejście z innej strony / daleko / mapy na sobie (czerwona ramka)", fill=(220, 220, 220, 255), font=FS)
d.line([(12, ky + 108), (60, ky + 108)], fill=(190, 110, 255, 255), width=4); d.text((70, ky + 98), "wspinaczka (Góry -> Orla Grań), nie krawędź mapy", fill=(220, 220, 220, 255), font=FS)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.convert("RGB").save(OUT)
print("zapisano", OUT, img.size)
print("niezgodne przejścia:", len(bad))
for (a, c, b, l, dd) in bad: print("   %d %s %s -> %d %s (%d kratek od miejsca wyjścia)" % (a, info.get(a, ""), c, b, info.get(b, ""), dd))
print("mapy na sobie:", [(a, b, ix, iy) for a, b, ix, iy in overl])
