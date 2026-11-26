# -*- coding: utf-8 -*-
"""GÓRY ZAMIAST SKARP (tools/gory/ustaw.py, 2026-11-26)

Gracz: "teraz oddzielone mapy są wzgórzami zamiast prawdziwymi górami ładnymi" - "skarpy wywal te stare, tylko góry ładne, wysokie,
wielkie" - "żeby na ogródki nie wchodziły" - "po środku krawędzi na Kruczogrodzie musi być przejście pomiędzy górami".

Pas skarp przy północnej i południowej krawędzi mapy (kafle A5 ciągiem od brzegu mapy, kolumna po kolumnie) zamienia się w góry:
wtyczka Gory.js przy wczytaniu mapy podmienia te kafle na trawę z regionem 2 (nie do przejścia) i rysuje na nich obrazy gór
(img/pictures/gory/Gory_*.png, PixelLab, styl kafli Winlu). Pliki map zostają bez zmian (edytor może być otwarty).

To narzędzie rozstawia góry i zapisuje js/plugins/Gory_Data.js:
  - północ: dwa rzędy - tylny wyżej i większy, przedni dociśnięty do linii skarp; żaden nieprzezroczysty piksel góry nie schodzi
    niżej niż pas skarp w swojej kolumnie (ogródki, płoty, domy pod pasem zostają odkryte);
  - południe: dwa rzędy; żaden piksel nie wychodzi wyżej niż pas skarp (nic nad pasem nie jest zasłonięte), dół może wyjść za mapę;
  - przełęcz pośrodku krawędzi (PRZELECZ): żadna góra jej nie dotyka, pas tam jest trawą do przejścia, tylko ostatnie rzędy przy
    brzegu mapy blokują (dopóki za nią nie ma mapy).
Po zmianie map w edytorze albo obrazów: python tools/gory/ustaw.py (bez --wykonaj: tylko liczy i pisze podgląd do tools/gory/podglad).
--mapy (tylko przy ZAMKNIĘTYM edytorze): pas zapisany też w plikach map (trawa + region 2; w edytorze nie widać już skarp), kopie w
tools/gory/kopie/<czas>/, System.json versionId + 1. Pas każdej mapy z jej dawnych skarp zostaje w tools/gory/pasy.json - narzędzie można puszczać dalej.
"""
import os, sys, json, random
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
T = 48
OBRAZY = {"lancuch": "Gory_lancuch", "szczyt": "Gory_szczyt", "masyw": "Gory_masyw", "turnie": "Gory_turnie"}
# the maps and their edges; the pass: tile columns [from, to) left open in the middle of the edge
BRAK = (0, 0)   # (no pass on that edge)
MAPY = {
    220: {"N": True, "S": True, "przelecz": {"N": (37, 44), "S": (37, 44)}, "rodzaje": ["lancuch", "szczyt", "masyw"]},   # Kruczogród
    218: {"N": True, "S": True, "przelecz": {"N": BRAK, "S": BRAK}, "rodzaje": ["lancuch", "szczyt", "masyw"]},           # Podgrodzie
    221: {"N": True, "S": True, "przelecz": {"N": BRAK, "S": BRAK}, "rodzaje": ["lancuch", "szczyt", "masyw"]},           # Dwór nad Jazem
}
ZAMKNIETE = 2   # (rows of the pass at the map's very edge kept blocked while no map lies beyond)


def profile(name):
    im = Image.open(os.path.join(ROOT, "img", "pictures", "gory", OBRAZY[name] + ".png")).convert("RGBA")
    W, H = im.size
    a = im.getchannel("A").load()
    top, bot = [None] * W, [None] * W
    for x in range(W):
        for y in range(H):
            if a[x, y] > 40:
                if top[x] is None: top[x] = y
                bot[x] = y
    return {"w": W, "h": H, "top": top, "bot": bot}


PASY = os.path.join(HERE, "pasy.json")   # (each map's band as its old cliffs made it - kept, since --mapy takes the cliffs away)


def pasy(mid):
    zap = json.load(open(PASY, encoding="utf-8")) if os.path.exists(PASY) else {}
    if str(mid) in zap:
        z = zap[str(mid)]
        W, n, s = z["w"], z["n"], z["s"]
        # (a lone spur of the cliff, one column deeper than both its neighbours - Map218 x=76 - stays a cliff: no mountain would
        # cover it, it would be an invisible wall)
        n = [min(n[x], max(n[max(0, x - 1)], n[min(W - 1, x + 1)])) for x in range(W)]
        s = [max(s[x], min(s[max(0, x - 1)], s[min(W - 1, x + 1)])) for x in range(W)]
        return W, z["h"], n, s
    d = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), encoding="utf-8"))
    W, H, a = d["width"], d["height"], d["data"]
    A5 = lambda t: 1536 <= t < 2048   # (the old cliffs - region 2 is no sign: maps use it for other walls too)
    n = [next((y for y in range(H) if not A5(a[y * W + x])), H) for x in range(W)]
    s = [H - next((k for k in range(H) if not A5(a[(H - 1 - k) * W + x])), H) for x in range(W)]
    zap[str(mid)] = {"w": W, "h": H, "n": n, "s": s}
    json.dump(zap, open(PASY, "w", encoding="utf-8"), separators=(",", ":"))
    return pasy(mid)


def ustaw(mid, cfg, P, seed):
    rnd = random.Random(seed)
    W, H, n, s = pasy(mid)
    out = []
    kinds = cfg["rodzaje"]

    def col_of(px): return max(0, min(W - 1, int(px // T)))

    def place(edge, row, x0, kind, sc, lift):
        pr = P[kind]
        w = pr["w"] * sc
        lo, hi = cfg["przelecz"][edge]
        if hi > lo and x0 + w > lo * T and x0 < hi * T: return None   # (never over the pass)
        if edge == "N":   # the lowest the piece may go: no opaque pixel below the band of its column
            ytop = None
            for i in range(pr["w"]):
                if pr["bot"][i] is None: continue
                lim = n[col_of(x0 + i * sc)] * T - (pr["bot"][i] + 1) * sc
                ytop = lim if ytop is None else min(ytop, lim)
            ytop -= lift
        else:             # the highest it may go: no opaque pixel above the band of its column
            ytop = None
            for i in range(pr["w"]):
                if pr["top"][i] is None: continue
                lim = s[col_of(x0 + i * sc)] * T - pr["top"][i] * sc
                ytop = lim if ytop is None else max(ytop, lim)
            ytop += lift
        return [kind, round(x0), round(ytop), round(sc, 3)]

    for edge in ("N", "S"):
        if not cfg.get(edge): continue
        lo, hi = cfg["przelecz"][edge]
        # (the north: a far, hazy row high up - seen when the camera rises by the ridge, Gory.js LIFT - a back row and the front one)
        rows = [("far", (1.8, 2.2), (3.6, 5.0), 0.42), ("back", (1.45, 1.85), (1.0, 2.4), 0.5), ("front", (1.05, 1.35), (0.0, 0.0), 0.55)] if edge == "N" else \
               [("back", (1.15, 1.45), (0.0, 0.0), 0.55), ("front", (1.2, 1.5), (1.0, 2.0), 0.6)]
        for name, (s0, s1), (l0, l1), step in rows:
            for side in (("L", "R") if hi > lo else ("A",)):   # left of the pass rightwards to it, right of it to the map's end (A: no pass)
                x = -T * 1.5 if side in ("L", "A") else hi * T + T * 0.3
                end = lo * T - T * 0.3 if side == "L" else W * T + T * 1.5
                while x < end:
                    kind = rnd.choice(kinds)
                    sc = rnd.uniform(s0, s1)
                    w = P[kind]["w"] * sc
                    last = side == "L" and x + w > end
                    if last: x = end - w   # (the last one before the pass: pulled back so it ends at the pass)
                    p = place(edge, name, x, kind, sc, rnd.uniform(l0, l1) * T)
                    if p: out.append(p + [edge] + ([1] if name == "far" else []))
                    if last: break
                    x += w * (step + rnd.uniform(-0.08, 0.08))
    # (the north pass: through it, far hazy peaks on the horizon - their foot on the pass's blocked edge row (row 0), the free ground stays clear; seen when
    # the camera rises by the ridge. Without them the grass ended in a straight line against the sky, "the end of the world")
    if cfg.get("N") and cfg["przelecz"]["N"][1] > cfg["przelecz"]["N"][0]:
        lo, hi = cfg["przelecz"]["N"]
        mid = (lo + hi) / 2 * T
        for kind, sc, dx in (("masyw", 1.25, -0.35), ("szczyt", 1.05, 0.55), ("lancuch", 0.95, 0.05)):
            w, h = P[kind]["w"] * sc, P[kind]["h"] * sc
            out.append([kind, round(mid - w / 2 + dx * w), round(40 - h + (0 if kind == "lancuch" else -8)), round(sc, 3), "N", 1])
    # (the draw order: by the foot - the plugin sorts by the bottom with the characters anyway)
    out.sort(key=lambda p: p[2] + P[p[0]]["h"] * p[3])
    return {"w": W, "h": H, "n": n, "s": s, "przelecz": {k.lower(): list(v) for k, v in cfg["przelecz"].items()}, "p": out}


def podglad(mid, M, P):
    """the band and the mountains drawn over the map's tiles as plain colours (to look at without the game)"""
    W, H = M["w"], M["h"]
    im = Image.new("RGBA", (W * T // 4, H * T // 4), (60, 110, 50, 255))
    from PIL import ImageDraw
    dr = ImageDraw.Draw(im)
    for x in range(W):
        dr.rectangle([x * 12, 0, x * 12 + 11, M["n"][x] * 12 - 1], fill=(90, 80, 70, 255))
        dr.rectangle([x * 12, M["s"][x] * 12, x * 12 + 11, H * 12], fill=(90, 80, 70, 255))
    for kind, x, y, sc, edge, *far in M["p"]:
        src = Image.open(os.path.join(ROOT, "img", "pictures", "gory", OBRAZY[kind] + ".png")).convert("RGBA")
        src = src.resize((max(1, int(src.width * sc / 4)), max(1, int(src.height * sc / 4))))
        im.alpha_composite(src, (int(x / 4), int(y / 4))) if x >= 0 and y >= 0 else im.paste(src, (int(x / 4), int(y / 4)), src)
    os.makedirs(os.path.join(HERE, "podglad"), exist_ok=True)
    p = os.path.join(HERE, "podglad", "Map%03d.png" % mid)
    im.save(p)
    return p


ZAMKNIETE_RZEDY = 2   # (Gory.js PASS_EDGE)


def zapisz_mapy(data):
    """the band into the map files: ground + region 2 (the pass: ground you may walk, its edge rows blocked) - only the "data" array is
    replaced, the rest of each file stays as the editor wrote it; copies in tools/gory/kopie/<time>/; System.json versionId + 1"""
    import re, time, shutil
    kop = os.path.join(HERE, "kopie", time.strftime("%Y%m%d_%H%M%S"))
    os.makedirs(kop, exist_ok=True)
    for key, M in data["maps"].items():
        mid = int(key)
        p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
        shutil.copy2(p, kop)
        raw = open(p, "rb").read().decode("utf-8")
        d = json.loads(raw)
        W, H, a = d["width"], d["height"], list(d["data"])
        at = lambda x, y, z: (z * H + y) * W + x
        pn, ps = M["przelecz"]["n"], M["przelecz"]["s"]
        for x in range(W):
            fn, fs = M["n"][x], M["s"][x]
            gN = a[at(x, min(H - 1, fn), 0)]
            gS = a[at(x, max(0, fs - 1), 0)]
            inN, inS = pn[0] <= x < pn[1], ps[0] <= x < ps[1]
            for y in range(0, min(fn, H)):
                for z in (1, 2, 3, 4): a[at(x, y, z)] = 0
                a[at(x, y, 0)] = gN
                a[at(x, y, 5)] = 0 if inN and y >= ZAMKNIETE_RZEDY else 2
            for y in range(max(0, fs), H):
                for z in (1, 2, 3, 4): a[at(x, y, z)] = 0
                a[at(x, y, 0)] = gS
                a[at(x, y, 5)] = 0 if inS and y < H - ZAMKNIETE_RZEDY else 2
        m = re.search(r'"data":\[[0-9,]*\]', raw)
        if not m: raise SystemExit("Map%03d: nie ma tablicy data" % mid)
        raw = raw[:m.start()] + '"data":[' + ",".join(str(v) for v in a) + "]" + raw[m.end():]
        open(p, "wb").write(raw.encode("utf-8"))
        print("zapisane: data/Map%03d.json (kopia: %s)" % (mid, os.path.relpath(kop, ROOT)))
    sp = os.path.join(ROOT, "data", "System.json")
    shutil.copy2(sp, kop)
    sraw = open(sp, "rb").read().decode("utf-8")
    m = re.search(r'"versionId":(\d+)', sraw)
    sraw = sraw[:m.start()] + '"versionId":%d' % (int(m.group(1)) + 1) + sraw[m.end():]
    open(sp, "wb").write(sraw.encode("utf-8"))
    print("System.json versionId:", int(m.group(1)) + 1)


def main():
    P = {k: profile(k) for k in OBRAZY}
    data = {"files": OBRAZY, "maps": {}}
    for mid, cfg in MAPY.items():
        M = ustaw(mid, cfg, P, seed=mid * 7919)
        data["maps"][str(mid)] = M
        print("mapa %d: %d gór (N %d, S %d), podgląd %s" % (mid, len(M["p"]), sum(1 for p in M["p"] if p[4] == "N"), sum(1 for p in M["p"] if p[4] == "S"), podglad(mid, M, P)))
    js = ("//=============================================================================\n"
          "// Gory_Data.js  (GENEROWANE: tools/gory/ustaw.py; nie edytuj ręcznie)\n"
          "//=============================================================================\n"
          "/*:\n * @target MZ\n * @plugindesc Dane gór zamiast skarp: pas skarp każdej kolumny (n / s) i rozstawienie obrazów gór. v1.0.0\n"
          " * @author Claude\n *\n * @help\n * Tylko dane dla Gory.js. Po zmianach map albo obrazów: python tools/gory/ustaw.py --wykonaj\n */\n"
          "window.GoryData = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    if "--wykonaj" in sys.argv:
        open(os.path.join(ROOT, "js", "plugins", "Gory_Data.js"), "w", encoding="utf-8", newline="\n").write(js)
        print("zapisane: js/plugins/Gory_Data.js")
    if "--mapy" in sys.argv:   # (only with the editor CLOSED: the band written into the map files too)
        zapisz_mapy(data)


if __name__ == "__main__":
    main()
