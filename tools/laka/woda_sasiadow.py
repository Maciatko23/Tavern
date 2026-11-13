# -*- coding: utf-8 -*-
"""Woda sąsiednich map dla łąki (Laka.js; gracz 2026-11-07: „przejścia pomiędzy mapami mają być super naturalne i płynne”).
Łąka suszy i żółci trawę przy wodzie, a bujna jest dopiero daleko od niej - liczyła to tylko z wody SWOJEJ mapy: przy granicy z
mapą, której morze jest tuż za krawędzią (111 Podgrodzie nad wodą 917 Wyspy Kormoranów), trawa urywała się prosto (sucha | bujna).
Tu, dla każdej mapy łąki, woda sąsiednich map do M kratek za jej krawędziami; Laka.js liczy odległość od wody na mapie powiększonej
o ten pas i przycina z powrotem - w środku mapy wynik ten sam co dotąd, przy krawędzi z wodą sąsiadek.
  - dane js/plugins/Laka_Woda.js: { "<mapa>": { m: [lewo, góra, prawo, dół] (M tam, gdzie jest sąsiadka z wodą w pasie),
    w: odcinki wody [y, x0, x1] w kratkach tej mapy (ujemne / od jej szerokości: za krawędzią) } }
  python tools/laka/woda_sasiadow.py                         (podgląd: ile map, ile kratek)
  python tools/laka/woda_sasiadow.py --do <folder>            (zapis Laka_Woda.js do folderu, np. staging)
  python tools/laka/woda_sasiadow.py --wykonaj                (zapis do js/plugins; kopia starego w tools/laka/kopie_zapasowe)
  [--dane-z <folder>]  mapy najpierw z tego folderu (np. tools/mapy/staging_szwy/data)
Po zmianach map przelicz (jak tools/mapy/czerwona_brzegi2.py --tylko-dane)."""
import datetime, json, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
PLUG = os.path.join(ROOT, "js", "plugins")
M = 18   # (Laka.js: the lush grass is full LUSH_FULL = 17 cells off the water, and one more)
UKLAD = sys.argv[sys.argv.index("--uklad") + 1] if "--uklad" in sys.argv else os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json")   # (plansza 3x3: tools/plansza/staging/swiat_uklad.json)
uk = {int(k): v for k, v in json.load(open(UKLAD, encoding="utf-8"))["mapy"].items()}
lista = open(os.path.join(ROOT, "js", "tawerna_wtyczki.js"), "rb").read().decode("utf-8")
laka = json.loads(re.search(r'^(\{"name":"Laka",.*\}),?\r?$', lista, re.M).group(1))
MAPS = [int(v) for v in re.split(r"[^0-9]+", laka["parameters"].get("maps", "")) if v]
DANE_Z = sys.argv[sys.argv.index("--dane-z") + 1] if "--dane-z" in sys.argv else None
maps = {}


def mapa(m):
    if m not in maps:
        p = os.path.join(DANE_Z, "Map%03d.json" % m) if DANE_Z and os.path.exists(os.path.join(DANE_Z, "Map%03d.json" % m)) else os.path.join(ROOT, "data", "Map%03d.json" % m)
        maps[m] = json.load(open(p, encoding="utf-8"))
    return maps[m]


def water(d, x, y):   # (as Laka.js: an A1 tile on layer 0)
    v = d["data"][y * d["width"] + x]
    return 2048 <= v < 2816


out, cells = {}, 0
for m in MAPS:
    if m not in uk: continue
    r = uk[m]; W, H = r["szer"], r["wys"]
    runs, sides = [], [0, 0, 0, 0]
    for y in range(-M, H + M):
        row = []
        for x in range(-M, W + M):
            if 0 <= x < W and 0 <= y < H: continue
            wx, wy = r["x0"] + x, r["y0"] + y
            for n, q in uk.items():
                if n != m and q["x0"] <= wx < q["x0"] + q["szer"] and q["y0"] <= wy < q["y0"] + q["wys"]:
                    if water(mapa(n), wx - q["x0"], wy - q["y0"]): row.append(x)
                    break
        i = 0
        while i < len(row):
            j = i
            while j + 1 < len(row) and row[j + 1] == row[j] + 1: j += 1
            runs.append([y, row[i], row[j]]); cells += row[j] - row[i] + 1
            for x in (row[i], row[j]):
                if x < 0: sides[0] = M
                if x >= W: sides[2] = M
            if y < 0: sides[1] = M
            if y >= H: sides[3] = M
            i = j + 1
    if runs: out[str(m)] = {"m": sides, "w": runs}
print("map łąki: %d, z wodą sąsiadek w pasie %d kratek: %d (%s), kratek wody za krawędzią: %d" % (len(MAPS), M, len(out), ", ".join(out), cells))

body = ",\n".join('        "%s": %s' % (k, json.dumps(v, separators=(",", ":"))) for k, v in out.items())
data_js = """//=============================================================================
// Laka_Woda.js
//=============================================================================
// GENEROWANE (tools/laka/woda_sasiadow.py, 2026-11-07) - nie edytuj ręcznie: zmień mapy i przelicz. Dla każdej mapy łąki (Laka.js),
// w kratkach tej mapy (ujemne / od jej szerokości: za krawędzią), do %d kratek za krawędzią:
//   w - woda sąsiednich map: odcinki [y, x0, x1]; m - [lewo, góra, prawo, dół]: ile kratek dołożyć z każdej strony.
// Laka.js liczy z nimi odległość od wody: sucha trawa przy brzegu i bujna w głębi lądu przechodzą płynnie przez granice map.

/*:
 * @target MZ
 * @plugindesc Dane łąki: woda sąsiednich map za krawędziami (sucha trawa przy brzegu płynnie przez granice map). v1.0.0
 * @author Claude
 * @help Same dane - czyta je Laka.js (ma stać pod tym plikiem na liście).
 */

(() => {
    "use strict";
    window.LakaWoda = {
%s
    };
})();
""" % (M, body)
dst = sys.argv[sys.argv.index("--do") + 1] if "--do" in sys.argv else (PLUG if "--wykonaj" in sys.argv else None)
if dst:
    if dst == PLUG and os.path.exists(os.path.join(PLUG, "Laka_Woda.js")):
        os.makedirs(os.path.join(HERE, "kopie_zapasowe"), exist_ok=True)
        shutil.copy(os.path.join(PLUG, "Laka_Woda.js"), os.path.join(HERE, "kopie_zapasowe", "Laka_Woda_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + ".js"))
    os.makedirs(dst, exist_ok=True)
    open(os.path.join(dst, "Laka_Woda.js"), "wb").write(data_js.encode("utf-8"))
    print("zapisane: %s (%.1f KB)" % (os.path.join(dst, "Laka_Woda.js"), len(data_js.encode("utf-8")) / 1024.0))
