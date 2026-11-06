# -*- coding: utf-8 -*-
"""KONTRAKT KRAWĘDZI świata (statycznie, z prawdziwych kafli map; nic nie zapisuje do data/ ani js/).
Świat to jedna siatka kratek (js/plugins/Swiat_Data.js: maps {id: [x0, y0, szer, wys]}, links). Krawedzie.js przenosi bohatera pchającego w krawędź
w TĘ SAMĄ kratkę świata sąsiada, ale tylko gdy strona jest otwarta: aktywne zdarzenie „Przenieś gracza” na tej krawędzi do tej mapy (cała strona)
albo odcinek w SwiatData.links. Zdarzenie prowadzące gdzie indziej w promieniu 3 kratek (BESPOKE) ma pierwszeństwo.
Kontrakt, dla KAŻDEJ kratki krawędzi, na której da się stanąć (kafle + blokujące zdarzenia, jak Game_Map.checkPassage):
  - sąsiad w tej samej kratce świata ma też kratkę chodliwą i przejście jest otwarte (w obie strony),
  - inaczej to niewidzialna ściana / przeskok / ląd donikąd (BŁĄD). Kratka krawędzi zablokowana (morze, klif, las, mur) jest zawsze w porządku.
Liczniki, które na koniec mają być 0: sciana (lad-lad zamknięte), jednokierunkowe, skok (otwarte na zablokowaną), zamkniete_blok (chodliwa
kratka, za nią zablokowana i zamknięte: niewidzialna ściana), donikad (chodliwy ląd bez mapy za krawędzią), dziury (ląd maski bez mapy),
mapy bez pliku. Wyjątki fabularne (WYJATKI) liczone osobno.
  python tools/mapy/swiat_styki.py [--staging DIR | --zywe] [--linki] [--obraz PLIK] [--json PLIK] [--pary]
--linki: zapisuje staging/ogon_styki.json (links z prawdziwych kafli: cały odcinek, gdzie obie kratki są chodliwe) - czyta go swiat_do_gry.py."""
import os, sys, json, re, collections
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import mapylib as L

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

STAGING = os.path.join(ROOT, "tools", "swiat", "styki", "staging")
if "--zywe" in sys.argv: STAGING = None
if "--staging" in sys.argv: STAGING = os.path.abspath(sys.argv[sys.argv.index("--staging") + 1])
MASKA = os.path.join(ROOT, "docs", "mapy", "swiat_maska.png")
BESPOKE = 3
POZA_WYSPA = 1500    # x0 świata, od którego leżą mapy próbne (poza wyspą)
PADX = 24           # margines rastra na zachód od x 0 świata
WASKI = 17          # pas lądu bez mapy węższy niż ekran (17 kratek): gracz go nie zobaczy, krawędzie przy nim mają być zablokowane (licznik donikad)
OPP = {"N": "S", "S": "N", "E": "W", "W": "E"}

# Wyjątki fabularne (a, b): przejście z a do b ma być ZAMKNIĘTE (kratki a na krawędzi z b widocznie zablokowane albo bramka).
#  13 -> 175: Orla Grań tylko wspinaczką (Orzel.wayUp); 175 <-> 934/120: bez pieszego styku; 165 <-> 162: tylko łacha w odpływie.
WYJATKI = {(13, 175), (175, 13), (175, 934), (934, 175), (175, 120), (120, 175), (162, 165), (165, 162),
           (175, 962), (962, 175), (935, 962), (962, 935)}      # (962|175, 962|935: też tylko wspinaczka orła; gracz 2026-10-31)
# 175 -> 13: zejście pieszo zostaje (Orzel_Data), jak jest (nie otwieram go na całej długości); 931 i 935 osiągalne tylko przez 175 (nowe mapy przy 175: dopisz je tu).


def swiat_data_zywe():
    txt = open(os.path.join(ROOT, "js", "plugins", "Swiat_Data.js"), encoding="utf-8").read()
    maps = json.loads(re.search(r"maps: (\{.*?\}),\s*\n\s*links", txt, re.S).group(1))
    links = json.loads("[" + re.search(r"links: \[(.*?)\]\s*,\s*\n\s*//", txt, re.S).group(1) + "]")
    later = json.loads(re.search(r"later: (\{.*?\})\s*\n", txt, re.S).group(1))
    # (2026-11-01) mapy próbne leżą celowo poza wyspą (x0 >= POZA_WYSPA, tools/mapa_probna): nie należą do kontraktu świata
    maps = {k: v for k, v in maps.items() if v[0] < POZA_WYSPA}
    links = [l for l in links if str(l["a"]) in maps and str(l["b"]) in maps]
    return {int(k): v for k, v in maps.items()}, links, {int(k): v for k, v in later.items()}


def plik_mapy(mid):
    if STAGING:
        p = os.path.join(STAGING, "data", "Map%03d.json" % mid)
        if os.path.exists(p): return p
    p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
    return p if os.path.exists(p) else None


class Swiat:
    def __init__(self, raws=None, uklad=None):
        """raws: {id: surowy słownik mapy} nadpisuje pliki (praca w pamięci); uklad: {id: [x0, y0, szer, wys]} dopisane/nadpisane położenia"""
        maps, links, later = swiat_data_zywe()
        self.later = later
        raws = raws or {}
        self.bez_pliku = []
        if STAGING and os.path.exists(os.path.join(STAGING, "uklad.json")):
            u = json.load(open(os.path.join(STAGING, "uklad.json"), encoding="utf-8"))
            for k, v in u.get("mapy", {}).items(): maps[int(k)] = v
            for k in u.get("usun", []): maps.pop(int(k), None)
            for k in u.get("later_usun", []): self.later.pop(int(k), None)
        for k, v in (uklad or {}).items(): maps[int(k)] = v      # (po uklad.json ze stagingu: bieżący układ budowy ma pierwszeństwo)
        self.M = {}
        self.rect = {}
        for mid, (x0, y0, w, h) in sorted(maps.items()):
            p = plik_mapy(mid)
            if mid in raws: self.M[mid] = L.Mapa(mid, raw=raws[mid])
            elif not p: self.bez_pliku.append(mid); continue
            else: self.M[mid] = L.Mapa(mid, path=p)
            self.rect[mid] = (x0, y0, self.M[mid].W, self.M[mid].H)
        self.links = [l for l in links if l["a"] in self.M and l["b"] in self.M]
        self.generowane = []
        if STAGING and os.path.exists(os.path.join(STAGING, "ogon_styki.json")):
            self.generowane = json.load(open(os.path.join(STAGING, "ogon_styki.json"), encoding="utf-8"))["linki"]
            klucze = {(l["a"], l["b"], l["side"]) for l in self.generowane}
            self.links = [l for l in self.links if (l["a"], l["b"], l["side"]) not in klucze] + self.generowane
        m0 = np.array(Image.open(MASKA).convert("L")) > 127
        self.PX = PADX      # świat z marginesem na zachodzie: mapa może sięgać morzem na x < 0 (964: x0 = -14); kratka świata (wx, wy) = raster [wy, wx + PX]
        self.maska = np.concatenate([np.zeros((m0.shape[0], PADX), bool), m0], axis=1)
        self.WH, self.WW = self.maska.shape
        self.O = np.zeros((self.WH, self.WW), np.int32)    # kto (id) zajmuje kratkę świata, 0: nikt
        for mid, (x, y, w, h) in self.rect.items():
            blok = self.O[y:y + h, x + PADX:x + PADX + w]
            if (blok != 0).any(): print("UWAGA: nakładanie map", mid, "z", sorted(set(blok[blok != 0].tolist())))
            self.O[y:y + h, x + PADX:x + PADX + w] = mid
        self._ev = {}
        self._wolne = {}
        self._glowny = {}

    def wolna(self, mid, x, y):
        """da się stanąć (kafle + zdarzenia blokujące) - w pamięci podręcznej"""
        w = self._wolne.get(mid)
        if w is None:
            m = self.M[mid]
            w = np.zeros((m.H, m.W), bool)
            blk = m.ev_block()
            for yy in range(m.H):
                for xx in range(m.W):
                    w[yy, xx] = m.teren(xx, yy) and m.kratka_wolna(xx, yy) and (xx, yy) not in blk
            self._wolne[mid] = w
        return bool(w[y, x])

    def glowny(self, mid):
        """tablica: kratka należy do obszaru chodliwego o >= 40 kratek (małe kieszenie nie liczą się)"""
        g = self._glowny.get(mid)
        if g is not None: return g
        m = self.M[mid]
        self.wolna(mid, 0, 0)
        w = self._wolne[mid]
        lab = np.zeros((m.H, m.W), np.int32); n = 0
        g = np.zeros((m.H, m.W), bool)
        for y0 in range(m.H):
            for x0 in range(m.W):
                if not w[y0, x0] or lab[y0, x0]: continue
                n += 1; lab[y0, x0] = n; st = [(x0, y0)]; comp = []
                while st:
                    x, y = st.pop(); comp.append((x, y))
                    for d in (2, 4, 6, 8):
                        dx, dy = L.DIRS[d]; u, v = x + dx, y + dy
                        if 0 <= u < m.W and 0 <= v < m.H and w[v, u] and not lab[v, u] and m.przechodnia(x, y, d) and m.przechodnia(u, v, L.REV[d]):
                            lab[v, u] = n; st.append((u, v))
                if len(comp) >= 40:
                    for (x, y) in comp: g[y, x] = True
        self._glowny[mid] = g
        return g

    def przeniesienia(self, mid):
        """zdarzenia przeniesienia na krawędziach: {strona: [(poz. wzdłuż, cel mapa, w warunku)]}"""
        if mid in self._ev: return self._ev[mid]
        m = self.M[mid]; out = {"N": [], "S": [], "W": [], "E": []}
        if not re.search(r"<EdgeWalk:\s*off>", m.note, re.I):
            for e in m.raw["events"]:
                if not e: continue
                cmds = [c for p in e["pages"] for c in p["list"] if c["code"] == 201 and c["parameters"] and c["parameters"][0] == 0 and c["parameters"][1] != mid]
                for c in cmds:
                    for side, on in (("W", e["x"] == 0), ("E", e["x"] == m.W - 1), ("N", e["y"] == 0), ("S", e["y"] == m.H - 1)):
                        if on: out[side].append((e["y"] if side in "WE" else e["x"], c["parameters"][1], (c.get("indent") or 0) > 0))
        self._ev[mid] = out
        return out

    def bramy(self, mid):
        """kratki ze zdarzeniem przejścia (dowolne polecenie 201): brama / ścieżka z własnym celem - zdarzenie niesie bohatera, kratka nie jest „ścianą”"""
        b = getattr(self, "_bramy", {}).get(mid)
        if b is None:
            b = {(e["x"], e["y"]) for e in self.M[mid].raw["events"] if e and (any(c["code"] == 201 for p in e["pages"] for c in p["list"]))}
            if not hasattr(self, "_bramy"): self._bramy = {}
            self._bramy[mid] = b
        return b

    def otwarte(self, a, side, i):
        """czy Krawedzie.js przepuści bohatera z mapy a (kratka wzdłuż krawędzi i) w sąsiada pod nią w świecie: (b, otwarte, powód, kratka świata)"""
        x0, y0, W, H = self.rect[a]
        wx = x0 - 1 if side == "W" else x0 + W if side == "E" else x0 + i
        wy = y0 - 1 if side == "N" else y0 + H if side == "S" else y0 + i
        if not (-PADX <= wx < self.WW - PADX and 0 <= wy < self.WH): return 0, False, "poza_swiatem", None
        b = int(self.O[wy, wx + PADX])
        evs = self.przeniesienia(a)[side]
        if any(abs(p - i) <= BESPOKE and t != b for p, t, g in evs): return b, False, "bespoke", (wx, wy)
        if b == 0: return 0, False, "brak_mapy", (wx, wy)
        if any(t == b for p, t, g in evs): return b, True, "zdarzenie", (wx, wy)
        along = wy if side in "WE" else wx
        if any(l["a"] == a and l["b"] == b and l["side"] == side and l["from"] <= along <= l["to"] for l in self.links): return b, True, "link", (wx, wy)
        return b, False, "zamkniete", (wx, wy)

    def krawedz(self, a, side):
        """lista kratek krawędzi mapy a: dict(i, x, y, a, side, b, bx, by, wolna, bwolna, otw, powod, glowny, swiat)"""
        x0, y0, W, H = self.rect[a]
        n = W if side in "NS" else H
        out = []
        for i in range(n):
            x = 0 if side == "W" else W - 1 if side == "E" else i
            y = 0 if side == "N" else H - 1 if side == "S" else i
            b, otw, powod, wc = self.otwarte(a, side, i)
            r = dict(i=i, x=x, y=y, a=a, side=side, b=b, otw=otw, powod=powod, wolna=self.wolna(a, x, y), glowny=bool(self.glowny(a)[y, x]),
                     swiat=(x0 + x, y0 + y), bwolna=None, bx=None, by=None, bglowny=False, brama=(x, y) in self.bramy(a))
            if b > 0 and wc:
                bx0, by0 = self.rect[b][:2]
                r["bx"], r["by"] = wc[0] - bx0, wc[1] - by0
                r["bwolna"] = self.wolna(b, r["bx"], r["by"])
                r["bglowny"] = bool(self.glowny(b)[r["by"], r["bx"]])
            out.append(r)
        return out

    def klasyfikuj(self, c):
        """None = w porządku; inaczej nazwa błędu albo ('wyj', nazwa) dla wyjątków fabularnych"""
        if not c["wolna"] or not c["glowny"]: return None
        a, b = c["a"], c["b"]
        wyj = (a, b) in WYJATKI
        if c["powod"] == "bespoke" or c.get("brama"): return None
        if any(p == c["i"] and t == b for p, t, g in self.przeniesienia(a)[c["side"]]): return None   # kratka z własnym zdarzeniem przejścia do b (brama): zdarzenie niesie bohatera
        if b == 0: return "donikad"
        if c["bwolna"] and c["bglowny"]:
            if c["otw"]: return None
            return ("wyj", "wyjatek_zamkniete") if wyj else "sciana"
        if c["otw"]: return ("wyj", "wyjatek_skok") if wyj else "skok"
        return ("wyj", "wyjatek_zamkniete_blok") if wyj else "zamkniete_blok"

    def analiza(self):
        wyn = collections.defaultdict(list)
        for a in self.M:
            for side in "NSWE":
                for c in self.krawedz(a, side):
                    k = self.klasyfikuj(c)
                    if k is not None: wyn[k if isinstance(k, str) else k[1]].append(c)
                    if c["wolna"] and c["glowny"] and c["b"] > 0 and c["bwolna"] and c["otw"] and (a, c["b"]) not in WYJATKI and (c["b"], a) not in WYJATKI and c["bglowny"]:
                        _, otw_b, powod_b, _ = self.otwarte(c["b"], OPP[c["side"]], c["by"] if c["side"] in "EW" else c["bx"])
                        if not otw_b and powod_b != "bespoke": wyn["jednokierunkowe"].append(c)   # (bespoke: własne wyjście miejsca po tamtej stronie)
        return wyn

    def dziury(self, min_kratek=1):
        h = self.maska & (self.O == 0)
        seen = np.zeros_like(h); out = []
        for y0 in range(self.WH):
            for x0 in range(self.WW):
                if h[y0, x0] and not seen[y0, x0]:
                    st = [(x0, y0)]; seen[y0, x0] = True; c = []
                    while st:
                        x, y = st.pop(); c.append((x, y))
                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            u, v = x + dx, y + dy
                            if 0 <= u < self.WW and 0 <= v < self.WH and h[v, u] and not seen[v, u]: seen[v, u] = True; st.append((u, v))
                    if len(c) >= min_kratek:
                        xs = [q[0] for q in c]; ys = [q[1] for q in c]
                        out.append((len(c), min(xs) - PADX, min(ys), max(xs) - PADX, max(ys)))
        out.sort(reverse=True)
        return out

    def linki_z_kafli(self):
        """links: cały chodliwy odcinek (obie kratki chodliwe w głównych obszarach) każdej pary sąsiadów; luka >= 1 kratki rozdziela odcinki"""
        out = []
        for a in sorted(self.M):
            for side in "NSWE":
                seg = collections.defaultdict(list)
                for c in self.krawedz(a, side):
                    b = c["b"]
                    if b <= 0 or (a, b) in WYJATKI or c["powod"] == "bespoke": continue
                    if c["wolna"] and c["glowny"] and c["bwolna"] and c["bglowny"]:
                        seg[b].append(c["swiat"][1] if side in "WE" else c["swiat"][0])
                for b, lst in seg.items():
                    lst.sort(); s = p = lst[0]
                    for v in lst[1:]:
                        if v - p > 1:
                            out.append({"a": a, "side": side, "from": s, "to": p, "b": b}); s = v
                        p = v
                    out.append({"a": a, "side": side, "from": s, "to": p, "b": b})
        return out


NIEDOSTEPNE_PIESZO = {175, 931, 935, 165}      # tylko wspinaczka orła (175, 931, 935) i łacha w odpływie (165)
START_PIESZO = 8


def osiagalne_pieszo(sw, start=START_PIESZO):
    """mapy osiągalne PIESZO z mapy start: krawędzie z links (kratki chodliwe po obu stronach) i zdarzenia przejścia na krawędziach (poza tymi w warunku);
    bez wyjątków fabularnych (13 <-> 175, 162 <-> 165)"""
    graf = collections.defaultdict(set)
    for l in sw.links:
        if (l["a"], l["b"]) in WYJATKI or l["a"] not in sw.M or l["b"] not in sw.M: continue
        graf[l["a"]].add(l["b"])
    for a in sw.M:
        for side in "NSWE":
            for p, t, g in sw.przeniesienia(a)[side]:
                if not g and t in sw.M and (a, t) not in WYJATKI: graf[a].add(t)
    seen = {start}; st = [start]
    while st:
        u = st.pop()
        for v in graf[u]:
            if v not in seen: seen.add(v); st.append(v)
    return seen


def licznik(sw, wyn):
    return collections.OrderedDict([
        ("sciana", len(wyn.get("sciana", []))), ("jednokierunkowe", len(wyn.get("jednokierunkowe", []))), ("skok", len(wyn.get("skok", []))),
        ("zamkniete_blok", len(wyn.get("zamkniete_blok", []))), ("donikad", len(wyn.get("donikad", []))),
        ("osiagalne_zakazane", len(osiagalne_pieszo(sw) & NIEDOSTEPNE_PIESZO)), ("nieosiagalne_inne", len(set(sw.M) - osiagalne_pieszo(sw) - NIEDOSTEPNE_PIESZO)),
        ("dziury_kratek", sum(d[0] for d in sw.dziury() if min(d[3] - d[1] + 1, d[4] - d[2] + 1) >= WASKI)), ("mapy_bez_pliku", len(sw.bez_pliku)),
    ])


def pary_raport(wyn):
    p = collections.Counter()
    for k, lst in wyn.items():
        for c in lst: p[(k, c["a"], c["b"], c["side"])] += 1
    return p


def obraz(sw, wyn, plik, S=3):
    px = np.zeros((sw.WH, sw.WW, 3), np.uint8); px[:] = (40, 70, 110); px[sw.maska] = (120, 140, 90); px[sw.maska & (sw.O == 0)] = (200, 170, 60)
    im = Image.fromarray(px).resize((sw.WW * S, sw.WH * S), Image.NEAREST)
    d = ImageDraw.Draw(im)
    try: f = ImageFont.truetype("arial.ttf", 13)
    except Exception: f = None
    for mid, (x, y, w, h) in sw.rect.items():
        d.rectangle([(x + PADX) * S, y * S, (x + PADX + w) * S - 1, (y + h) * S - 1], outline=(20, 20, 20))
        d.text(((x + PADX) * S + 4, y * S + 3), "%d %s" % (mid, L.map_name(mid)[:18]), fill=(0, 0, 0), font=f)
    zle = {}
    for k, lst in wyn.items():
        for c in lst: zle[(c["a"], c["side"], c["i"])] = k
    for a in sw.M:
        for side in "NSWE":
            for c in sw.krawedz(a, side):
                if not (c["wolna"] and c["glowny"]): continue
                kol = None
                k = zle.get((a, side, c["i"]))
                if k:
                    kol = (110, 0, 150) if k == "donikad" else (230, 0, 0) if k in ("sciana", "jednokierunkowe") else (240, 140, 0) if k in ("skok", "zamkniete_blok") else (150, 150, 150)
                elif c["b"] > 0 and c["otw"] and c["bwolna"]: kol = (0, 220, 0)
                if kol:
                    wx, wy = c["swiat"]; wx += PADX; d.rectangle([wx * S - 1, wy * S - 1, wx * S + S, wy * S + S], fill=kol)
    xs = [v[0] for v in sw.rect.values()]; ys = [v[1] for v in sw.rect.values()]
    x1 = max(v[0] + v[2] for v in sw.rect.values()); y1 = max(v[1] + v[3] for v in sw.rect.values())
    im = im.crop((max(0, min(xs) + PADX - 10) * S, max(0, min(ys) - 10) * S, min(sw.WW, x1 + PADX + 10) * S, min(sw.WH, y1 + 10) * S))
    im.save(plik)
    print("obraz:", plik, im.size)


def main():
    sw = Swiat()
    if "--linki" in sys.argv:
        if not STAGING: sys.exit("--linki wymaga stagingu")
        sw.links = [l for l in sw.links if l not in sw.generowane]
        sw.generowane = []; sw._ev = {}
        lk = sw.linki_z_kafli()
        os.makedirs(STAGING, exist_ok=True)
        json.dump({"opis": "links z prawdziwych kafli (swiat_styki.py --linki): cały chodliwy odcinek, obie strony", "linki": lk}, open(os.path.join(STAGING, "ogon_styki.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
        print("zapisano ogon_styki.json: %d odcinków (%d kratek)" % (len(lk), sum(l["to"] - l["from"] + 1 for l in lk)))
        sw.generowane = lk
        klucze = {(l["a"], l["b"], l["side"]) for l in lk}
        sw.links = [l for l in sw.links if (l["a"], l["b"], l["side"]) not in klucze] + lk
    wyn = sw.analiza()
    lic = licznik(sw, wyn)
    print("Map: %d, linków: %d (z kafli: %d), staging: %s" % (len(sw.M), len(sw.links), len(sw.generowane), STAGING))
    for k, v in lic.items(): print("  %-18s %d" % (k, v))
    print("  wyjątki fabularne (zamknięte celowo):", {k: len(v) for k, v in wyn.items() if k.startswith("wyjatek")})
    for (k, a, b, side), n in sorted(pary_raport(wyn).items()):
        if k.startswith("wyjatek") and "--pary" not in sys.argv: continue
        print("   %-22s mapa %4d str %s -> %4d : %d kratek" % (k, a, side, b, n))
    os_ = osiagalne_pieszo(sw)
    print("  osiągalne pieszo z mapy %d: %d z %d map; zakazane osiągalne: %s; nieosiągalne inne: %s" % (START_PIESZO, len(os_), len(sw.M), sorted(os_ & NIEDOSTEPNE_PIESZO) or "brak", sorted(set(sw.M) - os_ - NIEDOSTEPNE_PIESZO) or "brak"))
    for (n, x0, y0, x1, y1) in sw.dziury(30): print("   %s: %d kratek, świat x %d-%d y %d-%d" % ("wąski pasek (krawędzie zablokowane)" if min(x1 - x0 + 1, y1 - y0 + 1) < WASKI else "DZIURA", n, x0, x1, y0, y1))
    if sw.bez_pliku: print("   mapy w układzie bez pliku:", sw.bez_pliku)
    if "--obraz" in sys.argv: obraz(sw, wyn, os.path.abspath(sys.argv[sys.argv.index("--obraz") + 1]))
    if "--json" in sys.argv:
        json.dump({"licznik": lic, "pary": [[*k, n] for k, n in pary_raport(wyn).items()]}, open(sys.argv[sys.argv.index("--json") + 1], "w", encoding="utf-8"), ensure_ascii=False)
    bad = sum(lic.values())
    print("WYNIK:", "OK" if bad == 0 else "BŁĄD (%d)" % bad)
    sys.exit(0 if bad == 0 else 1)


if __name__ == "__main__":
    main()
