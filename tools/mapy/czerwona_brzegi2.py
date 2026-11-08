# -*- coding: utf-8 -*-
"""Pas brzegu przez granice map (A2; gracz 2026-11-07: „rób tak, żeby było profesjonalnie”). Pas przy morzu (kamienie, ubita ziemia,
sucha trawa - CzerwonaWoda.js, nie kafle) był liczony z wody TYLKO swojej mapy: przy krawędzi urywał się prosto (np. 950 | 963:
brązowy pas obok zielonej trawy), a woda kończąca się na krawędzi przy lądzie sąsiadki nie miała brzegu. Teraz pole odległości od
wody liczy się na mapie powiększonej o kratki sąsiadów (do M kratek za krawędzią) i przycina z powrotem: w środku mapy wynik ten sam
co dotąd (ten sam szum, te same liczby), przy krawędzi - z wodą i lądem sąsiadek.
  - dane js/plugins/CzerwonaWoda_Brzegi.js v2: dla każdej mapy z morzem { l: ląd sąsiadów za krawędzią (odcinki [y, x0, x1]),
    r: prostokąty sąsiadów (w kratkach tej mapy, przycięte do pasa M), m: [lewo, góra, prawo, dół] - M tam, gdzie jest sąsiadka },
  - CzerwonaWoda.js v1.3.0: geometry() składa g.ext (typ kratek w pasie: ląd / woda sąsiadki, poza sąsiadkami - jak krawędź mapy),
    buildFieldCore liczy na nim, wątki w tle dostają g.ext; tintLand bierze l jak dotąd.
  python tools/mapy/czerwona_brzegi2.py              (kopie w tools/mapy/staging_czerwona/js)
  python tools/mapy/czerwona_brzegi2.py --wykonaj    (do gry; kopie: tools/mapy/kopie_zapasowe/<czas>_czerwona2)"""
import datetime, json, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
PLUG = os.path.join(ROOT, "js", "plugins")
STG = os.path.join(HERE, "staging_czerwona", "js")
M = 13   # (DMAX 576 px = 12 tiles of the strip, and one more)
uk = {int(k): v for k, v in json.load(open(os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json"), encoding="utf-8"))["mapy"].items()}
maps = {}


DANE_Z = sys.argv[sys.argv.index("--dane-z") + 1] if "--dane-z" in sys.argv else None   # (maps from a staging data folder first)
def mapa(m):
    if m not in maps:
        p = os.path.join(DANE_Z, "Map%03d.json" % m) if DANE_Z and os.path.exists(os.path.join(DANE_Z, "Map%03d.json" % m)) else os.path.join(ROOT, "data", "Map%03d.json" % m)
        maps[m] = json.load(open(p, encoding="utf-8"))
    return maps[m]


def water_id(v): return 2048 <= v < 2816 and not (2048 + 96 <= v < 2048 + 192)


def land(d, x, y):
    W, H, t = d["width"], d["height"], d["data"]; n = W * H
    return not (water_id(t[y * W + x]) or water_id(t[n + y * W + x]))


_cw = open(os.path.join(PLUG, "CzerwonaWoda.js"), "rb").read().decode("utf-8")
BRZEG = [int(v) for v in re.search(r"const BRZEG_MAPS = \[([^\]]*)\]", _cw).group(1).split(",")]
def strip_map(n):   # (does CzerwonaWoda.js draw the shore's strip on map n: <Water:salt> and in BRZEG_MAPS)
    return n in BRZEG and bool(re.search(r"<Water:\s*salt\s*>", mapa(n).get("note") or "", re.I))


out, cells = {}, 0
for m, r in sorted(uk.items()):
    d = mapa(m)
    if not re.search(r"<Water:\s*salt\s*>", d.get("note") or "", re.I): continue
    W, H = r["szer"], r["wys"]
    rects, sides = [], [0, 0, 0, 0]
    for n, q in uk.items():
        if n == m: continue
        # the neighbour's rectangle in this map's tiles, cut to the band M round it
        x0, y0, x1, y1 = q["x0"] - r["x0"], q["y0"] - r["y0"], q["x0"] + q["szer"] - r["x0"], q["y0"] + q["wys"] - r["y0"]
        cx0, cy0, cx1, cy1 = max(x0, -M), max(y0, -M), min(x1, W + M), min(y1, H + M)
        if cx0 >= cx1 or cy0 >= cy1: continue
        rects.append([cx0, cy0, cx1, cy1])
        if cx0 < 0 and cy1 > 0 and cy0 < H: sides[0] = M
        if cy0 < 0 and cx1 > 0 and cx0 < W: sides[1] = M
        if cx1 > W and cy1 > 0 and cy0 < H: sides[2] = M
        if cy1 > H and cx1 > 0 and cx0 < W: sides[3] = M
        if cx0 < 0 and cy0 < 0: sides[0] = sides[1] = M   # (a corner neighbour)
        if cx1 > W and cy0 < 0: sides[2] = sides[1] = M
        if cx0 < 0 and cy1 > H: sides[0] = sides[3] = M
        if cx1 > W and cy1 > H: sides[2] = sides[3] = M
    runs = []
    for y in range(-M, H + M):
        row = []
        for x in range(-M, W + M):
            if 0 <= x < W and 0 <= y < H: continue
            for n, q in uk.items():
                if n != m and q["x0"] <= r["x0"] + x < q["x0"] + q["szer"] and q["y0"] <= r["y0"] + y < q["y0"] + q["wys"]:
                    if land(mapa(n), r["x0"] + x - q["x0"], r["y0"] + y - q["y0"]): row.append(x)
                    break
        i = 0
        while i < len(row):
            j = i
            while j + 1 < len(row) and row[j + 1] == row[j] + 1: j += 1
            runs.append([y, row[i], row[j]]); cells += row[j] - row[i] + 1
            i = j + 1
    # (B 2026-11-07, 111 | 917) the border's stretches where the neighbour is LAND WITH NO STRIP of its own (a map off the sea, or one
    # CzerwonaWoda.js does not draw the strip on - BRZEG_MAPS): the strip fades out before the border there instead of ending in a
    # straight line along it - [side (0 left, 1 top, 2 right, 3 bottom), from, to] in this map's cells along that side
    fade = []
    for side in range(4):
        along = []
        for a in range(H if side in (0, 2) else W):
            x, y = {0: (-1, a), 1: (a, -1), 2: (W, a), 3: (a, H)}[side]
            wx, wy = r["x0"] + x, r["y0"] + y
            hit = next((n for n, q in uk.items() if n != m and q["x0"] <= wx < q["x0"] + q["szer"] and q["y0"] <= wy < q["y0"] + q["wys"]), None)
            if hit is not None and not strip_map(hit) and land(mapa(hit), wx - uk[hit]["x0"], wy - uk[hit]["y0"]): along.append(a)
        i = 0
        while i < len(along):
            j = i
            while j + 1 < len(along) and along[j + 1] == along[j] + 1: j += 1
            fade.append([side, along[i], along[j]]); i = j + 1
    if rects:
        out[str(m)] = {"m": sides, "r": rects, "l": runs}
        if fade: out[str(m)]["n"] = fade
print("map z morzem i sąsiadkami: %d, kratek lądu za krawędzią: %d; granice z lądem bez pasa: %s" % (len(out), cells,
      ", ".join("%s:%s" % (k, "+".join("%s%d-%d" % ("LGPD"[s], a, b) for s, a, b in v["n"])) for k, v in out.items() if "n" in v) or "-"))

body = ",\n".join('        "%s": %s' % (k, json.dumps(v, separators=(",", ":"))) for k, v in out.items())
data_js = """//=============================================================================
// CzerwonaWoda_Brzegi.js
//=============================================================================
// GENEROWANE (tools/mapy/czerwona_brzegi2.py, 2026-11-07) - nie edytuj ręcznie: zmień mapy i przelicz. Dla każdej mapy z morzem
// (<Water:salt>), w kratkach tej mapy (ujemne / od jej szerokości: za krawędzią), do %d kratek za krawędzią:
//   l - ląd sąsiednich map: odcinki [y, x0, x1]; r - prostokąty sąsiednich map [x0, y0, x1, y1) przycięte do tego pasa;
//   m - [lewo, góra, prawo, dół]: ile kratek dołożyć z każdej strony (0: nie ma tam sąsiadki);
//   n - odcinki granicy, za którymi jest ląd mapy bez pasa brzegu: [strona (0 lewo, 1 góra, 2 prawo, 3 dół), od, do] - pas tam
//       zanika przed granicą (nie urywa się na niej prosto).
// CzerwonaWoda.js liczy z nimi czerwień i pas brzegu: przechodzą płynnie przez granice map.

/*:
 * @target MZ
 * @plugindesc Dane czerwonej wody i pasa brzegu: woda i ląd sąsiednich map za krawędziami (płynnie przez granice map), zanik pasa przy lądzie bez pasa. v2.1.0
 * @author Claude
 * @help Same dane - czyta je CzerwonaWoda.js (ma stać pod tym plikiem na liście).
 */

(() => {
    "use strict";
    window.CzerwonaWodaBrzegi = {
%s
    };
})();
""" % (M, body)

if "--tylko-dane" in sys.argv:   # (after the maps changed: only the data again - js/plugins/CzerwonaWoda_Brzegi.js, or with --do <folder> there)
    dst = sys.argv[sys.argv.index("--do") + 1] if "--do" in sys.argv else PLUG
    if dst == PLUG: shutil.copy(os.path.join(PLUG, "CzerwonaWoda_Brzegi.js"), os.path.join(HERE, "kopie_zapasowe", "CzerwonaWoda_Brzegi_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + ".js"))
    os.makedirs(dst, exist_ok=True)
    open(os.path.join(dst, "CzerwonaWoda_Brzegi.js"), "wb").write(data_js.encode("utf-8"))
    print("dane zapisane w", dst)
    raise SystemExit(0)
cw = open(os.path.join(PLUG, "CzerwonaWoda.js"), "rb").read().decode("utf-8")
if "g.ext" in cw: raise SystemExit("już zrobione: CzerwonaWoda.js ma g.ext")
W_ = "CzerwonaWoda.js"
def rep(s, old, new):
    if s.count(old) != 1: raise SystemExit("%s: %r (%d)" % (W_, old[:70], s.count(old)))
    return s.replace(old, new)
cw = rep(cw, """        let tintLand = toLand;
        const beyond = window.CzerwonaWodaBrzegi && window.CzerwonaWodaBrzegi[$gameMap.mapId()];""",
"""        let tintLand = toLand;
        const nb = window.CzerwonaWodaBrzegi && window.CzerwonaWodaBrzegi[$gameMap.mapId()], beyond = nb && (Array.isArray(nb) ? nb : nb.l);""")
cw = rep(cw, """        const type = new Uint8Array(W * H);   // (1 open water, 0 land, 2 the rest of the sea: a pier)
        for (let i = 0; i < W * H; i++) type[i] = water[i] ? 1 : sea[i] ? 2 : 0;""",
"""        const type = new Uint8Array(W * H);   // (1 open water, 0 land, 2 the rest of the sea: a pier)
        for (let i = 0; i < W * H; i++) type[i] = water[i] ? 1 : sea[i] ? 2 : 0;
        // (2026-11-07, A2 - the player: "przejścia pomiędzy mapami mają być super naturalne i płynne") the shore's strip with the
        // neighbours' water and land: the map grown by m[] cells (left, top, right, bottom) - a neighbour's cell its land (0) or water
        // (1), a cell off every neighbour as the map's own edge (as before)
        let ext = null;
        if (nb && nb.m && nb.m.some(v => v > 0)) {
            const [L, Tm, R, B] = nb.m, EW = W + L + R, EH = H + Tm + B, et = new Uint8Array(EW * EH), cov = new Uint8Array(EW * EH), lb = new Uint8Array(EW * EH);
            for (const [x0, y0, x1, y1] of nb.r || []) for (let y = Math.max(y0, -Tm); y < Math.min(y1, H + B); y++) for (let x = Math.max(x0, -L); x < Math.min(x1, W + R); x++) cov[(y + Tm) * EW + x + L] = 1;
            for (const [y, x0, x1] of nb.l || []) if (y >= -Tm && y < H + B) for (let x = Math.max(x0, -L); x <= Math.min(x1, W + R - 1); x++) lb[(y + Tm) * EW + x + L] = 1;
            for (let y = -Tm; y < H + B; y++) for (let x = -L; x < W + R; x++) {
                const i = (y + Tm) * EW + x + L;
                if (x >= 0 && y >= 0 && x < W && y < H) et[i] = type[y * W + x];
                else if (cov[i]) et[i] = lb[i] ? 0 : 1;
                else et[i] = type[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
            }
            ext = { l: L, t: Tm, r: R, b: B, W: EW, H: EH, type: et };
        }""")
cw = rep(cw, """            ext = { l: L, t: Tm, r: R, b: B, W: EW, H: EH, type: et };
        }""", """            ext = { l: L, t: Tm, r: R, b: B, W: EW, H: EH, type: et };
        }
        // (A2) the land near a NEIGHBOUR's water gets its strip's chunks too: the distance from any open water, the neighbours' as well
        let nearWater = toWater;
        if (ext) {
            const EW = ext.W, EH = ext.H, d = new Int16Array(EW * EH).fill(-1), q = [];
            for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) {
                const ix = x - ext.l, iy = y - ext.t, inside = ix >= 0 && iy >= 0 && ix < W && iy < H;
                if (inside ? water[iy * W + ix] : ext.type[y * EW + x] === 1) { d[y * EW + x] = 0; q.push(y * EW + x); }
            }
            for (let h = 0; h < q.length; h++) {
                const i = q[h], x = i % EW, y = (i / EW) | 0;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= EW || ny >= EH) continue;
                    const j = ny * EW + nx;
                    if (d[j] < 0) { d[j] = d[i] + 1; q.push(j); }
                }
            }
            nearWater = new Int16Array(W * H);
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) nearWater[y * W + x] = d[(y + ext.t) * EW + x + ext.l];
        }""")
cw = rep(cw, """        geo = { map: $dataMap, W, H, water, sea, toLand, tintLand, toWater, shore, type,""", """        geo = { map: $dataMap, W, H, water, sea, toLand, tintLand, toWater, nearWater, shore, type, ext,""")
cw = rep(cw, """            if (!((t === 0 && g.toWater[i] >= 0 && g.toWater[i] <= 13) || (t === 1 && g.toLand[i] >= 0 && g.toLand[i] <= 2))) continue;""",
         """            const nw = (g.nearWater || g.toWater)[i];   // (A2: by the neighbours' water as well)
            if (!((t === 0 && nw >= 0 && nw <= 13) || (t === 1 && g.toLand[i] >= 0 && g.toLand[i] <= 2))) continue;""")
cw = rep(cw, """        const dW = chamfer(wm, TW, TH), dL = chamfer(lm, TW, TH), sd = new Float32Array(TW * TH);
        for (let i = 0; i < TW * TH; i++) sd[i] = (wm[i] ? -(dL[i] / 3 - 0.5) : (dW[i] / 3 - 0.5)) * SD_Q;""",
"""        const dW = chamfer(wm, TW, TH), dL = chamfer(lm, TW, TH), sd = new Float32Array(TW * TH);
        for (let i = 0; i < TW * TH; i++) sd[i] = (wm[i] ? -(dL[i] / 3 - 0.5) : (dW[i] / 3 - 0.5)) * SD_Q;
        // (2026-11-07, A2 - the player: "przejścia pomiędzy mapami mają być super naturalne i płynne") the land's distance from the
        // NEIGHBOURS' water too, so the strip goes on over the border: worked out on the map's tiles grown by g.ext (a few thousand
        // cells: no cost to speak of), sampled smooth at the field's cells near the grown sides; the map's own line stays as it was
        const X = g.ext;
        if (X) {
            const EW = X.W, EH = X.H, nd = new Float32Array(EW * EH).fill(1e9), q = [];
            for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) {
                const inside = x >= X.l && y >= X.t && x < X.l + g.W && y < X.t + g.H;
                if (!inside && X.type[y * EW + x] === 1) { nd[y * EW + x] = 0; q.push(y * EW + x); }   // (a neighbour's water)
            }
            if (q.length) {
                for (let pass = 0; pass < 2; pass++) {   // (chamfer 1 / 1.414 over the tiles, forwards and back)
                    const order = pass ? -1 : 1;
                    for (let k = 0; k < EW * EH; k++) {
                        const i = pass ? EW * EH - 1 - k : k, x = i % EW, y = (i - x) / EW;
                        let v = nd[i];
                        for (const [dx, dy, c] of [[-1, 0, 1], [0, -1, 1], [-1, -1, 1.4142], [1, -1, 1.4142]]) {
                            const nx = x + dx * order, ny = y + dy * order;
                            if (nx < 0 || ny < 0 || nx >= EW || ny >= EH) continue;
                            const w = nd[ny * EW + nx] + c;
                            if (w < v) v = w;
                        }
                        nd[i] = v;
                    }
                }
                // (only the field's cells within DMAX of a grown side; the corners' weights worked out once per column and per row)
                const B = Math.ceil(DMAX / SD_Q) + 2, cx = (v, n) => (v < 0 ? 0 : v >= n ? n - 1 : v);
                const xa = new Int32Array(TW), xb = new Int32Array(TW), wx = new Float32Array(TW), ya = new Int32Array(TH), yb = new Int32Array(TH), wy = new Float32Array(TH);
                for (let x = 0; x < TW; x++) { const f2 = (x + 0.5) * SD_Q / tw - 0.5 + X.l, x0 = Math.floor(f2); xa[x] = cx(x0, EW); xb[x] = cx(x0 + 1, EW); wx[x] = f2 - x0; }
                for (let y = 0; y < TH; y++) { const f2 = (y + 0.5) * SD_Q / th - 0.5 + X.t, y0 = Math.floor(f2); ya[y] = cx(y0, EH) * EW; yb[y] = cx(y0 + 1, EH) * EW; wy[y] = f2 - y0; }
                const cell = (x, y) => {
                    const i = y * TW + x;
                    if (sd[i] <= 0) return;   // (the map's own water and line: as they were)
                    const a = wx[x], b = wy[y], r0 = ya[y], r1 = yb[y];
                    const d = (nd[r0 + xa[x]] * (1 - a) + nd[r0 + xb[x]] * a) * (1 - b) + (nd[r1 + xa[x]] * (1 - a) + nd[r1 + xb[x]] * a) * b;
                    const px = (d - 0.5) * tw;   // (tiles from a water tile's middle -> px from its edge)
                    if (px < sd[i]) sd[i] = px > 0.5 * SD_Q ? px : 0.5 * SD_Q;
                };
                for (let y = 0; y < TH; y++) {
                    if ((X.t && y < B) || (X.b && y >= TH - B)) { for (let x = 0; x < TW; x++) cell(x, y); continue; }
                    if (X.l) for (let x = 0; x < Math.min(B, TW); x++) cell(x, y);
                    if (X.r) for (let x = Math.max(X.l ? B : 0, TW - B); x < TW; x++) cell(x, y);
                }
            }
        }""")
cw = rep(cw, """            "      const g = { W: m.W, H: m.H, tw: m.tw, th: m.th, type: m.type, paint: m.P, rim: m.rim, deco: m.deco, rimPx: m.rimPx, tilePx: m.tilePx };\\n" +""",
         """            "      const g = { W: m.W, H: m.H, tw: m.tw, th: m.th, type: m.type, ext: m.ext || null, paint: m.P, rim: m.rim, deco: m.deco, rimPx: m.rimPx, tilePx: m.tilePx };\\n" +""")
cw = rep(cw, """        const msg = { t: "init", id, W: g.W, H: g.H, tw: g.tw, th: g.th, type: g.type, P: g.paint,""", """        const msg = { t: "init", id, W: g.W, H: g.H, tw: g.tw, th: g.th, type: g.type, ext: g.ext || null, P: g.paint,""")
cw = rep(cw, "Mapy z <Water:salt>; odcień płynnie przez granice map. v1.2.0", "Mapy z <Water:salt>; odcień i pas brzegu płynnie przez granice map. v1.3.0")

do = "--wykonaj" in sys.argv
dst = os.path.join(ROOT, "js") if do else STG
os.makedirs(os.path.join(dst, "plugins"), exist_ok=True)
if do:
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_czerwona2"); os.makedirs(kop, exist_ok=True)
    for f in ("CzerwonaWoda.js", "CzerwonaWoda_Brzegi.js"): shutil.copy(os.path.join(PLUG, f), kop)
    print("kopie:", kop)
open(os.path.join(dst, "plugins", "CzerwonaWoda_Brzegi.js"), "wb").write(data_js.encode("utf-8"))
open(os.path.join(dst, "plugins", "CzerwonaWoda.js"), "wb").write(cw.encode("utf-8"))
if not do: shutil.copy(os.path.join(ROOT, "js", "tawerna_wtyczki.js"), os.path.join(dst, "tawerna_wtyczki.js"))
print("zapisane w", dst)
