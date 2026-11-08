# -*- coding: utf-8 -*-
"""Czerwona woda przez granice map (gracz 2026-11-07 przy prawdziwej mapie: przejścia między mapami „wyjątkowo brzydko zrobione,
nie pasują, a mają być super naturalne i płynne”; ranking łączeń: docs/mapy/szwy). CzerwonaWoda.js liczył odcień morza z odległości
od brzegu TYLKO na swojej mapie - przy krawędzi brzeg sąsiedniej mapy się nie liczył i czerwień urywała się prostą linią.
Tu, raz: dla każdej mapy z morzem (<Water:salt>) ląd sąsiednich map świata (docs/mapy/swiat_uklad.json) w pasie RANGE kratek za jej
krawędziami - odcinki [y, x0, x1] w kratkach tej mapy (ujemne / poza szerokością: za krawędzią). Ląd = kratka bez wody na warstwach
0-1 (jak Tilemap.isWaterTile i „sea” w CzerwonaWoda.js). Wynik: js/plugins/CzerwonaWoda_Brzegi.js (dane), plus zmiana w
CzerwonaWoda.js (geometry: tintLand; tintBitmap go używa) i wpis na liście wtyczek przed CzerwonaWoda.
  python tools/mapy/czerwona_brzegi.py              (kopie w tools/mapy/staging_czerwona/js)
  python tools/mapy/czerwona_brzegi.py --wykonaj    (do gry; kopie: tools/mapy/kopie_zapasowe/<czas>_czerwona)"""
import datetime, json, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
PLUG = os.path.join(ROOT, "js", "plugins")
STG = os.path.join(HERE, "staging_czerwona", "js")
RANGE = 10   # (CzerwonaWoda's RED_RANGE 9 and one cell more)
uk = {int(k): v for k, v in json.load(open(os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json"), encoding="utf-8"))["mapy"].items()}
maps = {}


def mapa(m):
    if m not in maps: maps[m] = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % m), encoding="utf-8"))
    return maps[m]


def water_id(v): return 2048 <= v < 2816 and not (2048 + 96 <= v < 2048 + 192)   # (Tilemap.isWaterTile)


def land(d, x, y):
    W, H, t = d["width"], d["height"], d["data"]; n = W * H
    return not (water_id(t[y * W + x]) or water_id(t[n + y * W + x]))


out, cells = {}, 0
for m, r in sorted(uk.items()):
    d = mapa(m)
    if not re.search(r"<Water:\s*salt\s*>", d.get("note") or "", re.I): continue
    runs = []
    for wy in range(r["y0"] - RANGE, r["y0"] + r["wys"] + RANGE):
        row = []
        for wx in range(r["x0"] - RANGE, r["x0"] + r["szer"] + RANGE):
            if r["x0"] <= wx < r["x0"] + r["szer"] and r["y0"] <= wy < r["y0"] + r["wys"]: continue   # (its own tiles)
            hit = False
            for n, q in uk.items():
                if n != m and q["x0"] <= wx < q["x0"] + q["szer"] and q["y0"] <= wy < q["y0"] + q["wys"]:
                    hit = land(mapa(n), wx - q["x0"], wy - q["y0"]); break
            if hit: row.append(wx - r["x0"])
        y = wy - r["y0"]
        i = 0
        while i < len(row):
            j = i
            while j + 1 < len(row) and row[j + 1] == row[j] + 1: j += 1
            runs.append([y, row[i], row[j]]); cells += row[j] - row[i] + 1
            i = j + 1
    if runs: out[str(m)] = runs
print("map z morzem i lądem sąsiadów za krawędzią: %d, kratek lądu: %d, odcinków: %d" % (len(out), cells, sum(len(v) for v in out.values())))

body = ",\n".join('        "%s": %s' % (k, json.dumps(v, separators=(",", ":"))) for k, v in out.items())
data_js = """//=============================================================================
// CzerwonaWoda_Brzegi.js
//=============================================================================
// GENEROWANE (tools/mapy/czerwona_brzegi.py, 2026-11-07) - nie edytuj ręcznie: zmień mapy i przelicz. Dla każdej mapy z morzem
// (<Water:salt>): ląd sąsiednich map świata w pasie %d kratek za jej krawędziami, odcinki [y, x0, x1] w kratkach tej mapy (ujemne / od
// szerokości mapy: za krawędzią). CzerwonaWoda.js liczy z nim odległość od brzegu dla czerwieni: odcień przechodzi przez granicę map.

/*:
 * @target MZ
 * @plugindesc Dane czerwonej wody: ląd sąsiednich map za krawędziami (odcień morza płynnie przez granice map). v1.0.0
 * @author Claude
 * @help Same dane - czyta je CzerwonaWoda.js (ma stać pod tym plikiem na liście).
 */

(() => {
    "use strict";
    window.CzerwonaWodaBrzegi = {
%s
    };
})();
""" % (RANGE, body)

cw = open(os.path.join(PLUG, "CzerwonaWoda.js"), "rb").read().decode("utf-8")
if "tintLand" in cw: raise SystemExit("już zrobione: CzerwonaWoda.js ma tintLand")
def rep(s, old, new):
    if s.count(old) != 1: raise SystemExit("CzerwonaWoda.js: %r (%d)" % (old[:70], s.count(old)))
    return s.replace(old, new)
cw = rep(cw, """        const toLand = bfs(i => !sea[i]), toWater = bfs(i => !!water[i]);   // (toLand: from the real shore - a pier is no shore)""",
"""        const toLand = bfs(i => !sea[i]), toWater = bfs(i => !!water[i]);   // (toLand: from the real shore - a pier is no shore)
        // (2026-11-07, the real map of the island: the red stopped in a straight line at a map's edge - the shore over the edge did not
        // count) the tint's distance from the shore counts the neighbours' land too, RED_RANGE cells beyond the edges
        // (CzerwonaWoda_Brzegi.js, tools/mapy/czerwona_brzegi.py): the red goes on smooth over the border
        let tintLand = toLand;
        const beyond = window.CzerwonaWodaBrzegi && window.CzerwonaWodaBrzegi[$gameMap.mapId()];
        if (beyond && beyond.length) {
            const M = RED_RANGE + 1, EW = W + 2 * M, EH = H + 2 * M, d = new Int16Array(EW * EH).fill(-1), q = [];
            const seed = (x, y) => { if (x < -M || y < -M || x >= W + M || y >= H + M) return; const i = (y + M) * EW + x + M; if (d[i] < 0) { d[i] = 0; q.push(i); } };
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!sea[y * W + x]) seed(x, y);
            for (const [y, x0, x1] of beyond) for (let x = x0; x <= x1; x++) seed(x, y);
            for (let h = 0; h < q.length; h++) {
                const i = q[h], x = i % EW, y = (i / EW) | 0;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= EW || ny >= EH) continue;
                    const j = ny * EW + nx;
                    if (d[j] < 0) { d[j] = d[i] + 1; q.push(j); }
                }
            }
            tintLand = new Int16Array(W * H);
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tintLand[y * W + x] = d[(y + M) * EW + x + M];
        }""")
cw = rep(cw, """        geo = { map: $dataMap, W, H, water, sea, toLand, toWater, shore, type,""", """        geo = { map: $dataMap, W, H, water, sea, toLand, tintLand, toWater, shore, type,""")
cw = rep(cw, """            const d = g.toLand[i];
            const fall = Math.max(0, 1 - (d - 1) / R);""", """            const d = (g.tintLand || g.toLand)[i];   // (with the neighbours' shores over the edges)
            const fall = Math.max(0, 1 - (d - 1) / R);""")
cw = rep(cw, "nie da się go pić ani przegotować; po deszczu szare i słone. Mapy z <Water:salt>. v1.1.0", "nie da się go pić ani przegotować; po deszczu szare i słone. Mapy z <Water:salt>; odcień płynnie przez granice map. v1.2.0")

import wtyczki
do = "--wykonaj" in sys.argv
dst = os.path.join(ROOT, "js") if do else STG
os.makedirs(os.path.join(dst, "plugins"), exist_ok=True)
if do:
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_czerwona"); os.makedirs(kop, exist_ok=True)
    shutil.copy(os.path.join(PLUG, "CzerwonaWoda.js"), kop); shutil.copy(os.path.join(ROOT, "js", "tawerna_wtyczki.js"), kop)
    print("kopie:", kop)
open(os.path.join(dst, "plugins", "CzerwonaWoda_Brzegi.js"), "wb").write(data_js.encode("utf-8"))
open(os.path.join(dst, "plugins", "CzerwonaWoda.js"), "wb").write(cw.encode("utf-8"))
# the plugin list: the data right above CzerwonaWoda
lista = open(os.path.join(ROOT, "js", "tawerna_wtyczki.js"), "rb").read().decode("utf-8")
if '"name":"CzerwonaWoda_Brzegi"' not in lista:
    entry = json.dumps({"name": "CzerwonaWoda_Brzegi", "status": True, "description": re.search(r"@plugindesc (.*)", data_js).group(1).strip(), "parameters": {}}, ensure_ascii=False, separators=(",", ":")) + ","
    L = lista.split("\n"); i = next(k for k, l in enumerate(L) if l.startswith('{"name":"CzerwonaWoda",'))
    L.insert(i, entry); lista = "\n".join(L)
open(os.path.join(dst, "tawerna_wtyczki.js"), "wb").write(lista.encode("utf-8"))
print("zapisane w", dst)
