# -*- coding: utf-8 -*-
"""Generator danych mapy wyspy w grze (ETAP 4 świata): js/plugins/MapaWyspy_Data.js z TEGO SAMEGO świata co swiat_podglad.png.

  python tools/mapy/swiat_mapa_wyspy.py            -> tools/swiat/etap4/staging/js/plugins/MapaWyspy_Data.js (+ MapaWyspy.js ze stagingu: kopia po zmianach)
  python tools/mapy/swiat_mapa_wyspy.py --podglad  -> docs/swiat_etap4/schemat_danych.png (rysunek z samych danych, bez gry)

Źródła (nic nie jest liczone od nowa):
  docs/mapy/swiat_maska.png    wygładzony kontur lądu -> BRZEG (główna wyspa) i BRZEGI (wysepki, np. Wrak)
  docs/mapy/swiat_uklad.json   położenia map -> MIEJSCA (środek prostokąta mapy, znormalizowany do pudełka wyspy), ASPEKT pudełka
  js/plugins/Swiat_Data.js     przejścia na krawędziach (links) + zdarzenia przejść w data/*.json -> DROGI (przez mapy brzegowe bez nazwy
                               miejsca łączymy przechodnio); wyjątki: łacha 162/165 (w odpływie), wspinaczka orła 13/175
  docs/mapy/swiat.json         suche koryto -> KORYTO (cienka linia)
  obecny js/plugins/MapaWyspy_Data.js   nazwy miejsc, WNETRZA, LUDZIE_FABULY (bez zmian), PODZIEMIA
Pisze tylko do tools/swiat/etap4/ i docs/swiat_etap4/ (nic w data/ ani js/)."""
import os, re, sys, json, math
import numpy as np
import cv2
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
STY = "--styki" in sys.argv       # staging styków (tools/swiat/styki/staging): nowe mapy, links z kafli; DROGI = pary MIEJSC (nie odcinki styków), więc setki linków nie zmieniają schematu
STYD = os.path.join(ROOT, "tools", "swiat", "styki", "staging")
OUT_JS = os.path.join(STYD, "js", "plugins") if STY else os.path.join(ROOT, "tools", "swiat", "etap4", "staging", "js", "plugins")
CUR = os.path.join(ROOT, "js", "plugins", "MapaWyspy_Data.js")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

PAD = 10            # kratek świata wokół wyspy w pudełku
WYJATKI_DROGI = [(162, 165), (13, 175)]
POMIN_DROGI = {(4, 23)}                       # 4 i 23 łączy też Pola pod grzbietem (900), ale to ten sam szlak co przez Kruczy Jar: bez trójkąta na schemacie      # łacha w odpływie (Garnizon -> Wrak), wspinaczka orła (Góry -> Orla Grań)
PODZIEMIA_ODSUNIECIE = (-36, -48)              # podziemia: nad miastem, pod wzgórzem zamkowym (kratki świata względem środka mapy 8)
PX_W = 640.0                                 # szerokość pudełka w menu P (MapaWyspy.js MAP_W) - do układu etykiet
ASPEKT_UI = 1.5                              # proporcja pudełka na ekranie (pole mapy w menu ~640 x 430 px): wyspa jest o ok. 15% wyższa niż w świecie, żeby 21 napisów się zmieściło
CZCIONKA = 8.3                               # px na znak etykiety (16 px)


def czytaj_obecny():
    t = open(CUR, encoding="utf-8").read()
    nazwy = {int(m.group(1)): m.group(2) for m in re.finditer(r'\{ id: (\d+), nazwa: "([^"]+)"', t)}
    def blok(start):
        i = t.index(start); j = t.index("};", i) + 2
        return t[i:j]
    pod = re.search(r'const PODZIEMIA = \{ id: "podziemia", nazwa: "([^"]+)"', t).group(1)
    return nazwy, blok("const WNETRZA = {"), blok("const LUDZIE_FABULY = {"), pod


def uklad():
    return {int(k): v for k, v in json.load(open(os.path.join(STYD, "swiat_uklad.json") if STY else os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json"), encoding="utf-8"))["mapy"].items()}


def maska():
    from PIL import Image
    return np.array(Image.open(os.path.join(ROOT, "docs", "mapy", "swiat_maska.png")).convert("L")) > 127


def pary_swiat():
    t = open(os.path.join(ROOT, "js", "plugins", "Swiat_Data.js"), encoding="utf-8").read()      # (--styki też ŻYWY plik: DROGI to dawne drogi (3-kratkowe przejścia), nie setki odcinków styków z kafli)
    lk = re.search(r"links: (\[.*?\]),\s*\n\s*(//|later)", t, re.S)
    links = json.loads(lk.group(1))
    par = set(tuple(sorted((l["a"], l["b"]))) for l in links)
    return par


def pary_zdarzenia(ids):
    par = set()
    for m in ids:
        p = os.path.join(ROOT, "data", "Map%03d.json" % m)
        if STY and os.path.exists(os.path.join(STYD, "data", "Map%03d.json" % m)): p = os.path.join(STYD, "data", "Map%03d.json" % m)
        if not os.path.exists(p): continue
        d = json.load(open(p, encoding="utf-8"))
        for e in d["events"]:
            if not e: continue
            for pg in e["pages"]:
                for c in pg["list"]:
                    if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] in ids and c["parameters"][1] != m:
                        par.add(tuple(sorted((m, c["parameters"][1]))))
    return par


def drogi(miejsca):
    """pary miejsc połączonych w świecie: przejścia na krawędziach (Swiat_Data.links) + zdarzenia przejść + wyjątki; przez mapy bez miejsca przechodnio"""
    uk = uklad()
    wszystkie = set(uk)
    par = pary_swiat() | pary_zdarzenia(wszystkie) | {tuple(sorted(p)) for p in WYJATKI_DROGI}
    g = {}
    for a, b in par:
        if a in wszystkie and b in wszystkie: g.setdefault(a, set()).add(b); g.setdefault(b, set()).add(a)
    out = set()
    for a in miejsca:
        # DFS od miejsca a przez mapy, które nie są miejscami; każde napotkane miejsce b = droga a-b
        seen = {a}; st = [a]
        while st:
            k = st.pop()
            for n in g.get(k, ()):
                if n in seen: continue
                seen.add(n)
                if n in miejsca:
                    if n != a: out.add(tuple(sorted((a, n))))
                else: st.append(n)
    return sorted(out - POMIN_DROGI), g


def kontur(M, x0, y0, W, H):
    """gładki kontur lądu: główny (największy) i wysepki, w kratkach świata"""
    m8 = (M * 255).astype(np.uint8)
    big = cv2.resize(m8, None, fx=4, fy=4, interpolation=cv2.INTER_NEAREST)
    big = cv2.GaussianBlur(big, (0, 0), 6)
    big = (big > 127).astype(np.uint8) * 255
    cs, _ = cv2.findContours(big, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cs = sorted(cs, key=lambda c: -cv2.contourArea(c))
    out = []
    for c in cs:
        if cv2.contourArea(c) / 16.0 < 40: continue
        eps = 3.2
        ap = cv2.approxPolyDP(c, eps, True)[:, 0, :] / 4.0
        out.append(ap)
    return out


def norm(p, box):
    return [round((p[0] - box[0]) / box[2], 4), round((p[1] - box[1]) / box[3], 4)]


def etykiety(miejsca, poz, drogi_, aspekt):
    """strona etykiety każdego miejsca (n/s/e/w), żeby napisy się nie nakładały (rozmiar pudełka w menu: PX_W x PX_W/aspekt)"""
    BH = PX_W / aspekt
    pt = {k: (v[0] * PX_W, v[1] * BH) for k, v in poz.items()}
    wid = {k: len(str(miejsca[k])) * CZCIONKA + 6 for k in miejsca}
    def rect(k, s):
        x, y = pt[k]; w, h = wid[k], 20
        if s == "s": return (x - w / 2, y + 9, x + w / 2, y + 9 + h)
        if s == "n": return (x - w / 2, y - 9 - h, x + w / 2, y - 9)
        if s == "e": return (x + 10, y - h / 2, x + 10 + w, y + h / 2)
        return (x - 10 - w, y - h / 2, x - 10, y + h / 2)
    def hit(a, b):
        return max(0, min(a[2], b[2]) - max(a[0], b[0])) * max(0, min(a[3], b[3]) - max(a[1], b[1]))
    pref = {}
    order = sorted(miejsca, key=lambda k: -len([1 for q in miejsca if q != k and math.hypot(pt[q][0] - pt[k][0], pt[q][1] - pt[k][1]) < 110]))
    chosen = {}
    for k in order:
        best = None
        for s, bias in (("s", 0), ("n", 4), ("e", 9), ("w", 9)):
            r = rect(k, s)
            cost = bias
            for q, sq in chosen.items(): cost += hit(r, rect(q, sq)) * 1.0
            for q in miejsca:
                if q == k: continue
                x, y = pt[q]; cost += hit(r, (x - 8, y - 8, x + 8, y + 8)) * 2.0
            if r[0] < -4 or r[2] > PX_W + 4: cost += 400
            if r[1] < -2 or r[3] > BH + 2: cost += 400
            # drogi: etykieta nie na linii drogi do sąsiada (grubo: nie licz)
            if best is None or cost < best[0]: best = (cost, s)
        chosen[k] = best[1]
    return chosen


def main():
    nazwy, wnetrza, ludzie, pod_nazwa = czytaj_obecny()
    uk = uklad()
    M = maska()
    ys, xs = np.where(M)
    bx0, by0, bx1, by1 = xs.min() - PAD, ys.min() - PAD, xs.max() + PAD, ys.max() + PAD
    box = (bx0, by0, bx1 - bx0, by1 - by0)
    aspekt_swiata = box[2] / box[3]
    aspekt = ASPEKT_UI
    miejsca = {}
    poz = {}
    for m, nm in nazwy.items():
        r = uk[m]
        c = (r["x0"] + r["szer"] / 2.0, r["y0"] + r["wys"] / 2.0)
        poz[m] = norm(c, box)
        miejsca[m] = nm
    c8 = uk[8]; pc = (c8["x0"] + c8["szer"] / 2.0 + PODZIEMIA_ODSUNIECIE[0], c8["y0"] + c8["wys"] / 2.0 + PODZIEMIA_ODSUNIECIE[1])
    pz = norm(pc, box)
    dr, graf = drogi(set(miejsca))
    # etykiety
    allp = dict(poz); allm = dict(miejsca)
    allp["podziemia"] = pz; allm["podziemia"] = pod_nazwa
    lab = etykiety(allm, allp, dr, aspekt)
    # kontury
    cs = kontur(M, *box)
    glowny = [norm(p, box) for p in cs[0]]
    wyspy = [[norm(p, box) for p in c] for c in cs[1:]]
    # suche koryto
    sw = json.load(open(os.path.join(ROOT, "docs", "mapy", "swiat.json"), encoding="utf-8"))
    koryto = []
    for part in sw["suche_koryto"]:
        pts = part[::6] + [part[-1]]
        koryto.append([norm(p, box) for p in pts])
    # las / puszcza: ląd poza mapami, z dala od brzegu: delikatny wzór (kropki)
    cov = np.zeros(M.shape, bool)
    for m, r in uk.items(): cov[r["y0"]:r["y0"] + r["wys"], r["x0"]:r["x0"] + r["szer"]] = True
    dist = cv2.distanceTransform(M.astype(np.uint8), cv2.DIST_L2, 5)
    zone = M & ~cov & (dist > 6)
    rng = np.random.RandomState(5)
    las = []
    step = 8
    for yy in range(0, M.shape[0], step):
        for xx in range(0, M.shape[1], step):
            jx, jy = xx + rng.randint(0, step), yy + rng.randint(0, step)
            if jy < M.shape[0] and jx < M.shape[1] and zone[jy, jx]: las.append(norm((jx, jy), box))
    # --- plik
    L = []
    L.append("//=============================================================================")
    L.append("// MapaWyspy_Data.js")
    L.append("//=============================================================================")
    L.append("// The island's places for the P menu's \"Mapa\" tab (MapaWyspy.js). GENEROWANE (etap 4 świata): tools/mapy/swiat_mapa_wyspy.py z tego samego świata co")
    L.append("// docs/mapy/swiat_podglad.png: BRZEG z maski lądu (swiat_maska.png), MIEJSCA w środku prostokąta swojej mapy (swiat_uklad.json), DROGI z przejść w świecie")
    L.append("// (Swiat_Data.js links, zdarzenia przejść w mapach; przez mapy brzegowe bez nazwy łączone przechodnio; wyjątki: łacha 162/165 w odpływie, wspinaczka 13/175),")
    L.append("// KORYTO suchego koryta rzeki, LAS puszczy bez map. WNETRZA, PODZIEMIA i LUDZIE_FABULY bez zmian. Nie edytuj ręcznie: zmień świat i przelicz.")
    L.append("")
    L.append("/*:")
    L.append(" * @target MZ")
    L.append(" * @plugindesc Dane mapy wyspy: miejsca na zewnątrz i ich położenie na schemacie, drogi między nimi, wnętrza przypisane do miejsc. v2.0.0")
    L.append(" * @author Claude")
    L.append(" * @help Same dane - czyta je MapaWyspy.js (ma stać pod tym plikiem na liście).")
    L.append(" * x, y - położenie na schemacie (0..1 szerokości i wysokości pudełka wyspy, y w dół); ASPEKT - stosunek szerokości do wysokości pudełka;")
    L.append(" * lab - strona etykiety (n/s/e/w); drogi - pary numerów map, między którymi jest przejście (droga na schemacie).")
    L.append(" */")
    L.append("")
    L.append("(() => {")
    L.append("    \"use strict\";")
    L.append("")
    L.append("    // the proportion of the island's box (the world's island with a margin)")
    L.append("    const ASPEKT = %.4f;" % aspekt)
    L.append("    // the outdoor places: the map, its name (the map's display name), the place on the sketch (the middle of the map's rectangle in the world), the label's side")
    L.append("    const MIEJSCA = [")
    items = []
    for m in miejsca:
        items.append("        { id: %d, nazwa: \"%s\", x: %.3f, y: %.3f, lab: \"%s\" }" % (m, miejsca[m], poz[m][0], poz[m][1], lab[m]))
    L.append(",\n".join(items))
    L.append("    ];")
    L.append("    // the underground as one point (all its floors): under the castle hill, north of the town")
    L.append("    const PODZIEMIA = { id: \"podziemia\", nazwa: \"%s\", x: %.3f, y: %.3f, lab: \"%s\", wejscie: 8 };" % (pod_nazwa, pz[0], pz[1], lab["podziemia"]))
    L.append("    // the roads: a transfer between two maps (both ways); through the nameless coast maps they join the places on either side")
    rows = ["[%d, %d]" % p for p in dr] + ["[\"podziemia\", 8]"]
    ln = "        "; txt = []
    for r in rows:
        if len(ln) + len(r) > 150: txt.append(ln.rstrip()); ln = "        "
        ln += r + ", "
    txt.append(ln.rstrip().rstrip(","))
    L.append("    const DROGI = [")
    L.append("\n".join(txt))
    L.append("    ];")
    L.append("    // the island's shore on the sketch (0..1), drawn as a smooth shape; BRZEGI: the islets (the wreck's shoal)")
    def pts(p): return "[" + ", ".join("[%.4f, %.4f]" % (a, b) for a, b in p) + "]"
    def wrap(p, ind="        "):
        s = [("[%.3f, %.3f]" % (a, b)) for a, b in p]; out = []; ln = ind
        for q in s:
            if len(ln) + len(q) > 150: out.append(ln.rstrip()); ln = ind
            ln += q + ", "
        out.append(ln.rstrip().rstrip(","))
        return "\n".join(out)
    L.append("    const BRZEG = [")
    L.append(wrap(glowny))
    L.append("    ];")
    L.append("    const BRZEGI = [" + ("\n" if wyspy else ""))
    L.append(",\n".join("      [\n" + wrap(w, "        ") + "\n      ]" for w in wyspy))
    L.append("    ];")
    L.append("    // the dry riverbed (a thin line) and the trackless forest between the maps (a soft pattern of dots)")
    L.append("    const KORYTO = [")
    L.append(",\n".join("      [\n" + wrap(k, "        ") + "\n      ]" for k in koryto))
    L.append("    ];")
    L.append("    const LAS = [")
    L.append(wrap(las))
    L.append("    ];")
    L.append("    // every other map -> the place it belongs to (\"podziemia\": a floor, the cellar's ruins, the cistern); made from the maps' transfers,")
    L.append("    // the name is the map's display name (the card of a place lists its interiors by these)")
    L.append("    " + wnetrza)
    L.append("    // the people of the story who are not TownLife residents: their place (the card's \"Ludzie\")")
    L.append("    " + ludzie)
    L.append("")
    L.append("    window.MapaWyspyData = { ASPEKT, MIEJSCA, PODZIEMIA, DROGI, BRZEG, BRZEGI, KORYTO, LAS, WNETRZA, LUDZIE_FABULY };")
    L.append("})();")
    os.makedirs(OUT_JS, exist_ok=True)
    open(os.path.join(OUT_JS, "MapaWyspy_Data.js"), "w", encoding="utf-8", newline="\n").write("\n".join(L) + "\n")
    import hashlib
    sp = os.path.join(ROOT, "tools", "swiat", "etap4", "staging", "sumy.json")
    if not STY:
        sumy = json.load(open(sp)) if os.path.exists(sp) else {}
        sumy["MapaWyspy_Data.js"] = hashlib.sha256(open(CUR, "rb").read()).hexdigest()
        json.dump(sumy, open(sp, "w"), indent=1)
    print("MIEJSCA %d, DROGI %d, BRZEG %d pkt + %d wysp, KORYTO %d, LAS %d pkt, ASPEKT %.3f" % (len(miejsca), len(dr), len(glowny), len(wyspy), len(koryto), len(las), aspekt))
    print("drogi:", dr)
    print("etykiety:", lab)
    if "--podglad" in sys.argv: podglad(miejsca, poz, pz, dr, glowny, wyspy, koryto, las, lab, aspekt, pod_nazwa)


def podglad(miejsca, poz, pz, dr, glowny, wyspy, koryto, las, lab, aspekt, pod_nazwa):
    from PIL import Image, ImageDraw, ImageFont
    W = 1400; H = int(W / aspekt)
    im = Image.new("RGB", (W, H), (14, 18, 22)); d = ImageDraw.Draw(im)
    f = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 22)
    S = lambda p: (p[0] * W, p[1] * H)
    for p in [glowny] + wyspy: d.polygon([S(q) for q in p], fill=(31, 37, 33), outline=(74, 84, 76))
    for p in las: x, y = S(p); d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(52, 64, 56))
    for k in koryto: d.line([S(q) for q in k], fill=(90, 84, 70), width=2)
    allp = dict(poz); allp["podziemia"] = pz
    for a, b in dr: d.line([S(allp[a]), S(allp[b])], fill=(96, 100, 108), width=3)
    d.line([S(allp["podziemia"]), S(allp[8])], fill=(96, 100, 108), width=3)
    allm = dict(miejsca); allm["podziemia"] = pod_nazwa
    for k, p in allp.items():
        x, y = S(p); d.ellipse([x - 8, y - 8, x + 8, y + 8], fill=(255, 210, 63))
        t = allm[k]; tw = d.textlength(t, font=f)
        s = lab[k]
        pos = {"s": (x - tw / 2, y + 11), "n": (x - tw / 2, y - 36), "e": (x + 14, y - 12), "w": (x - 14 - tw, y - 12)}[s]
        d.text(pos, t, fill=(236, 238, 240), font=f)
    os.makedirs(os.path.join(ROOT, "docs", "swiat_etap4"), exist_ok=True)
    im.save(os.path.join(ROOT, "docs", "swiat_etap4", "schemat_danych.png")); print(im.size)


if __name__ == "__main__":
    main()
