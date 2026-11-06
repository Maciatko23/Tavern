# -*- coding: utf-8 -*-
"""Generator js/plugins/Swiat_Data.js ze swiat.json (położenia map w świecie kratek + przejścia danych).
  python tools/mapy/swiat_do_gry.py [--wlacz] [--out plik]
Bez --wlacz: enabled=false (wtyczka Krawedzie liczy po staremu). Z --wlacz: enabled=true (robi to install.py etapu 1).
Etap 1: mapy ETAP1 (te, które etap przebudowuje albo które z nimi graniczą). Kolejne etapy dopisują mapy do ETAP."""
import json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
ETAP = [8, 125, 21, 111, 13, 22, 914, 917, 920, 922, 923, 3, 4, 20, 23, 24, 900, 901, 17, 120, 159, 168, 912, 933, 934, 111, 162, 165, 18, 155, 157, 910, 918, 950, 951, 175, 931, 935, 960, 961, 962, 963, 964]   # 175: nie budowana w etapie 1 (inny agent) - jako "later"
# Przejścia danych (a, strona z a, od, do - kratki świata WZDŁUŻ krawędzi; 3 kratki drogi). Pozycje z swiat.json, z poprawkami:
#  - brama północna miasta stoi w kratce x 444-446 (nie 469-471): pod x 469-471 stoi tawerna (dach przy murze), ulica x 24-26 kończy się
#    w murze; szlak górski w Górach 13 zaczyna się więc w x 444-446 (lokalnie 40-42).
LINKI = [
    (8, "N", 444, 446, 13),
    (8, "S", 453, 455, 125),   # w Przystani x 24-26 zajmuje chata (x 22-28, y 0-5): wyjscie przesuniete na x 33-35
    (8, "E", 233, 235, 22),     # brama wschodnia miasta (etap 1)
]
# 13 <-> 175: BEZ przejścia piechotą: wspinaczka orła (Orzel_Data WAY_UP/WAY_DOWN) i zadania D29 / W13 zostają bez zmian.
# Dalsze przejścia (ścieżki brzegowe do nowych map, 125 <-> 21) dopisuje tools/swiat/etap1/zbuduj.py do staging/ogon.json.
def main():
    STY = os.path.abspath(os.environ["SWIAT_STY"]) if os.environ.get("SWIAT_STY") else os.path.join(ROOT, "tools/swiat/styki/staging")      # styki: nowe mapy 960-964, układ bez 930/932/936, links z kafli
    uk = os.path.join(STY, "swiat_uklad.json") if "--styki" in sys.argv else os.path.join(ROOT, "docs/mapy/swiat_uklad.json")
    sw = json.load(open(uk, encoding="utf-8"))
    maps = {}
    import re
    live = {}
    lp = os.path.join(ROOT, "js/plugins/Swiat_Data.js")
    if os.path.exists(lp):
        mt = re.search(r"maps: (\{.*?\}),\s*\n\s*links", open(lp, encoding="utf-8").read(), re.S)
        if mt: live = {int(k): v for k, v in json.loads(mt.group(1)).items()}
    def rozmiar_pliku(m):
        for d in ([os.path.join(STY, "data")] if "--styki" in sys.argv else []) + ["tools/swiat/etap3/staging/data", "tools/swiat/etap2/staging_b/data", "tools/swiat/etap2/staging/data", "data"]:
            pp = os.path.join(ROOT, d, "Map%03d.json" % m)
            if os.path.exists(pp):
                j = json.load(open(pp, encoding="utf-8")); return j["width"], j["height"]
    for m in ETAP + [k for k in live if k not in ETAP and not ('--styki' in sys.argv and k == 936)]:
        if str(m) in sw["mapy"]:
            v = sw["mapy"][str(m)]; x0, y0 = v["x0"], v["y0"]
        elif m in live: x0, y0 = live[m][0], live[m][1]; print("z zywego Swiat_Data (nie ma w swiat.json):", m)
        else: print("POMINIETA:", m); continue
        wh = rozmiar_pliku(m)   # rozmiar = prawdziwej mapy (swiat.json mogl sie zmienic po instalacji)
        maps[m] = [x0, y0, wh[0], wh[1]] if wh else live.get(m, [x0, y0, 1, 1])
    links = [{"a": a, "side": s, "from": f, "to": t, "b": b} for (a, s, f, t, b) in LINKI]
    for og in ("tools/swiat/etap1/staging/ogon.json", "tools/swiat/etap2/staging/ogon2.json", "tools/swiat/etap2/staging_b/ogon2b.json", "tools/swiat/etap3/staging/ogon3.json"):
        og = os.path.join(ROOT, og)
        if not os.path.exists(og): continue
        for l in json.load(open(og, encoding="utf-8"))["linki"]:
            if not any(x["a"] == l["a"] and x["b"] == l["b"] and x["side"] == l["side"] for x in links): links.append(l)
    if "--styki" in sys.argv:       # links z prawdziwych kafli (swiat_styki.py --linki): zastępują dawne wpisy tych samych par/stron (cały odcinek, obie strony)
        ls = json.load(open(os.path.join(STY, "ogon_styki.json"), encoding="utf-8"))["linki"]
        kl = {(l["a"], l["b"], l["side"]) for l in ls}
        links = [l for l in links if (l["a"], l["b"], l["side"]) not in kl] + ls
    # symetrycznie: przejście w drugą stronę
    opp = {"N": "S", "S": "N", "E": "W", "W": "E"}
    later = {int(k): [v["x0"], v["y0"], v["szer"], v["wys"]] for k, v in sw["mapy"].items() if int(k) not in maps}
    if "--styki" not in sys.argv: links += [{"a": l["b"], "side": opp[l["side"]], "from": l["from"], "to": l["to"], "b": l["a"]} for l in list(links)]
    else: links = [l for l in links if l["a"] in maps and l["b"] in maps]      # (ogon_styki ma już obie strony; dawne wpisy symetryzuje poniżej tylko te bez pary)
    if "--styki" in sys.argv:
        have = {(l["a"], l["b"], l["side"], l["from"], l["to"]) for l in links}
        for l in list(links):
            r = {"a": l["b"], "side": opp[l["side"]], "from": l["from"], "to": l["to"], "b": l["a"]}
            if not any(x["a"] == r["a"] and x["b"] == r["b"] and x["side"] == r["side"] and x["from"] <= r["from"] and x["to"] >= r["to"] for x in links): links.append(r)
    en = "true" if "--wlacz" in sys.argv else "false"
    out = ROOT + "/js/plugins/Swiat_Data.js"
    if os.path.exists(out) and b"enabled: true" in open(out, "rb").read() and "--wlacz" not in sys.argv and "--out" not in sys.argv:
        sys.exit("STOP: zywy js/plugins/Swiat_Data.js ma enabled: true (etap 1 zainstalowany) - nie nadpisuje; uzyj --out <staging> --wlacz")
    if "--out" in sys.argv: out = sys.argv[sys.argv.index("--out") + 1]
    txt = """//=============================================================================
// Swiat_Data.js  (GENEROWANE: tools/mapy/swiat_do_gry.py ze swiat.json - nie edytuj ręcznie)
//=============================================================================
/*:
 * @target MZ
 * @plugindesc Świat w kratkach: położenia map (x0, y0, szer., wys.) i przejścia danych; czyta je Krawedzie.js. Wyłączone, dopóki dane map nie są zainstalowane. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * Tylko dane (window.SwiatData). Kratka świata = początek mapy + kratka lokalna. enabled=false: przejścia na krawędziach
 * liczone po staremu (Krawedzie.js). links: otwarte przejścia danych {a, side, from, to, b} - kratki ŚWIATA wzdłuż krawędzi
 * mapy a (x dla N/S, y dla E/W), bez zdarzeń w mapie.
 */
(() => {
    "use strict";
    window.SwiatData = {
        enabled: %s,
        // id mapy: [x0, y0, szerokość, wysokość] w kratkach świata
        maps: %s,
        links: %s,
        // mapy świata jeszcze nieprzebudowane (etapy 2-3): Krawedzie.js zostawia tam przejścia po staremu
        later: %s
    };
})();
""" % (en, json.dumps(maps), "[\n            " + ",\n            ".join(json.dumps(l) for l in links) + "\n        ]", json.dumps(later))
    open(out, "wb").write(txt.replace("\n", "\r\n").encode("utf-8") if b"\r\n" in open(os.path.join(ROOT, "js/plugins/Krawedzie.js"), "rb").read() else txt.encode("utf-8"))
    print("zapisano", out, "enabled=" + en, "map:", len(maps), "linków:", len(links))
main()
