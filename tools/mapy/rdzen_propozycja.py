# -*- coding: utf-8 -*-
"""Propozycja „tawerna w środku, mały świat wokół, głębia pod ziemią” (gracz 2026-11-08: „główne wątki na mapie tawerny, na powierzchni
tylko miasteczko i dosłownie kilka map na koło - tam cała fabuła; pod ziemią może być więcej generowanych map”). TYLKO CZYTA grę:
  - rysunek wyspy z grupami map: docs/mapy/rdzen_propozycja.png
  - lista wszystkich map w grupach, z tym, co na nich jest i co by się zmieniło: docs/mapy/RDZEN.md
Dane o zadaniach / ludziach: plik JSON z pomiarem (--info <plik>, z tests/lib/sandbox jak tools/audyt/przejscie.js).
  python tools/mapy/rdzen_propozycja.py --info <mapy_info.json>"""
import json, os, re, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
INFO = json.load(open(sys.argv[sys.argv.index("--info") + 1], encoding="utf-8"))
uk = {int(k): v for k, v in json.load(open(os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json"), encoding="utf-8"))["mapy"].items()}
mi = {m["id"]: m["name"] for m in json.load(open(os.path.join(ROOT, "data", "MapInfos.json"), encoding="utf-8")) if m}

# ------------------------------------------------------------------ the groups (the proposal, variant B: the town's ring stays)
SWIAT = {
    "rdzen": [8, 111, 125, 3, 20, 24, 22, 4, 23, 13, 901, 961],
    "dzikie": [17, 18, 21, 168],
    "wyprawy": [120, 155, 157, 159, 162, 165, 175],
    "wysepki": [914, 917, 918, 920, 922, 923, 935, 951],
    "usun": [900, 910, 912, 931, 933, 934, 950, 960, 962, 963, 964],
}
UNDER = [10, 11, 14, 118, 176, 177] + list(range(130, 154))
ROBOCZE = [101, 990, 991]
WYPRAWY_WN = {121: 120, 122: 120, 123: 120, 124: 120, 156: 155, 160: 159, 161: 159, 163: 162, 166: 165, 167: 155}
OPIS = {
    "rdzen": ("Rdzeń - chodzi się pieszo, bez szwów, najbardziej dopieszczone", (70, 200, 90)),
    "dzikie": ("Tereny dzikie przy rdzeniu - łowy, zbieractwo, kilka zadań (zostają)", (230, 200, 60)),
    "wyprawy": ("Cele wypraw - jedno porządne miejsce, dojazd wozem / łodzią / orłem", (80, 150, 240)),
    "wysepki": ("Wysepki (Wyspy.js) - łacha, łódka, orzeł (już tak jest)", (150, 200, 245)),
    "usun": ("Do usunięcia - mapy z budowy świata, bez zadań i ludzi", (230, 70, 60)),
}
grp = {m: g for g, l in SWIAT.items() for m in l}
assert set(grp) == set(uk), set(uk) ^ set(grp)

# ------------------------------------------------------------------ the drawing
P = 1.5
X0 = min(r["x0"] for r in uk.values()) - 6; Y0 = min(r["y0"] for r in uk.values()) - 6
X1 = max(r["x0"] + r["szer"] for r in uk.values()) + 6; Y1 = max(r["y0"] + r["wys"] for r in uk.values()) + 6
W, H = int((X1 - X0) * P), int((Y1 - Y0) * P)
LEG = 200
img = Image.new("RGBA", (W, H + LEG), (24, 24, 24, 255))
pics = os.path.join(ROOT, "img", "mapa_wyspy")
sea = Image.open(os.path.join(pics, "morze.png")).convert("RGBA").resize((int(32 * P), int(32 * P)))
for y in range(0, H, sea.size[1]):
    for x in range(0, W, sea.size[0]): img.paste(sea, (x, y))
for m, r in uk.items():
    p = os.path.join(pics, "%d.png" % m)
    if not os.path.exists(p): continue
    pic = Image.open(p).convert("RGBA").resize((int(r["szer"] * P), int(r["wys"] * P)), Image.LANCZOS)
    img.alpha_composite(pic, (int((r["x0"] - X0) * P), int((r["y0"] - Y0) * P)))
ov = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
for m, r in uk.items():
    c = OPIS[grp[m]][1]; box = (int((r["x0"] - X0) * P), int((r["y0"] - Y0) * P), int((r["x0"] + r["szer"] - X0) * P) - 1, int((r["y0"] + r["wys"] - Y0) * P) - 1)
    if grp[m] == "usun":   # (dimmed and hatched inside its own box only)
        bw, bh = box[2] - box[0] + 1, box[3] - box[1] + 1
        hat = Image.new("RGBA", (bw, bh), (0, 0, 0, 120)); hd = ImageDraw.Draw(hat)
        for k in range(-bh, bw, 14): hd.line((k, bh, k + bh, 0), fill=c + (150,), width=2)
        ov.alpha_composite(hat, (box[0], box[1]))
    d.rectangle(box, outline=c + (255,), width=3)
img.alpha_composite(ov)
d = ImageDraw.Draw(img)
try:
    f = ImageFont.truetype("arialbd.ttf", 13); fl = ImageFont.truetype("arialbd.ttf", 16); ft = ImageFont.truetype("arialbd.ttf", 20)
except Exception:
    f = fl = ft = ImageFont.load_default()
def halo(xy, text, font, fill):
    x, y = xy
    for dx in (-2, -1, 0, 1, 2):
        for dy in (-2, -1, 0, 1, 2): d.text((x + dx, y + dy), text, font=font, fill=(0, 0, 0))
    d.text(xy, text, font=font, fill=fill)
for m, r in uk.items():
    name = re.sub(r"\s*\(.*\)", "", mi.get(m, str(m)))
    cx, cy = (r["x0"] + r["szer"] / 2 - X0) * P, (r["y0"] + r["wys"] / 2 - Y0) * P
    words = name.split(" "); lines = []
    for w_ in words:
        if lines and d.textlength(lines[-1] + " " + w_, font=f) < r["szer"] * P - 6: lines[-1] += " " + w_
        else: lines.append(w_)
    for k, l in enumerate(lines):
        tw = d.textlength(l, font=f); halo((cx - tw / 2, cy - len(lines) * 8 + k * 16), l, f, OPIS[grp[m]][1])
# the legend
y = H + 14
halo((14, y), "Propozycja: tawerna w środku, mały świat wokół, głębia pod ziemią (wariant B - pierścień miasta zostaje)", ft, (255, 230, 90))
y += 34
for g in ("rdzen", "dzikie", "wyprawy", "wysepki", "usun"):
    t, c = OPIS[g]; n = len(SWIAT[g])
    d.rectangle((16, y + 2, 34, y + 18), fill=c + (255,)); halo((44, y), "%s: %d map" % (t, n), fl, (240, 240, 240)); y += 26
img.convert("RGB").save(os.path.join(ROOT, "docs", "mapy", "rdzen_propozycja.png"), optimize=True)
print("rysunek:", W, "x", H + LEG)

# ------------------------------------------------------------------ the list
def info(m):
    i = INFO.get(str(m), {})
    bits = []
    q = i.get("quests") or []
    if q: bits.append("zadania: " + ", ".join(q[:8]) + (" …" if len(q) > 8 else ""))
    if i.get("residents"): bits.append("mieszka %d os." % len(i["residents"]))
    if i.get("insideOf"): bits.append("dom: " + ", ".join(i["insideOf"][:4]))
    if i.get("story"): bits.append("; ".join(s for s in i["story"] if not re.match(r"^[KDW]\d", s))[:60])
    return "; ".join(bits) or "-"
ZMIANA = {
    4: "północna krawędź (60 kratek do Pól pod grzbietem) zamknięta naturalnie - brzeg lasu / skarpa",
    13: "zachodnia krawędź (24 kratki do Zach. Stoku Gór) zamknięta naturalnie - skała",
    23: "krawędź do Pól pod grzbietem (75 kratek) zamknięta naturalnie",
    111: "11 kratek krawędzi do Stoku nad Garnizonem zamknięte (Garnizon dalej przez zachodnią bramę)",
    18: "traci dojście pieszo (dziś przez Sosnowy Klif / Łąkę pod Klifem) - postój wozu albo przejście z Leśnej drogi",
    918: "łacha szła z Sosnowego Klifu - łacha z Łąki menhirów albo łódka",
    155: "granice z Sosnowym Klifem i Zboczem zamknięte - dojście od Garnizonu / Przystani (wóz, łódź)",
    157: "granica ze Stokiem nad Garnizonem i Zach. Stokiem zamknięta - zostaje od Przesieki",
    159: "granica z Polami pod grzbietem zamknięta - dojście z Łąki pod Gawrą / wozem",
    162: "granice ze Zboczem i Stokiem zamknięte - dalej od Podgrodzia (zachodnia brama)",
    165: "granice ze Zboczem i Łąką pod Klifem zamknięte - łacha od Garnizonu jak dziś",
    168: "granice z Polami, Ugorami i Zatoką Kłód zamknięte - dalej od Skraju lasu",
    17: "granica z Zatoką Kłód (80 kratek) zamknięta - brzeg zatoki",
    120: "granica z Miedzami zamknięta - dalej od Polnej drogi / Gór",
    175: "bez zmian w dojściu (wspinaczka / orzeł)",
    935: "bez zmian (tylko orzeł)",
}
L = ["# Propozycja: tawerna w środku, mały świat wokół, głębia pod ziemią", "",
     "Gracz 2026-11-08: „główne wątki na mapie tawerny, na powierzchni tylko miasteczko i dosłownie kilka map na koło - tam dzieje się",
     "cała fabuła (ewentualnie pod ziemią więcej generowanych map)”. To jest PROPOZYCJA - nic w grze nie jest zmienione.",
     "Rysunek: `docs/mapy/rdzen_propozycja.png` (narzędzie `tools/mapy/rdzen_propozycja.py`, tylko czyta).", "",
     "## W skrócie", "",
     "| | dziś | po zmianie (wariant B) |", "|---|---|---|",
     "| mapy w grze | 146 | 135 |", "| mapy świata (powierzchnia na wyspie) | 42 | 31 |",
     "| granice między mapami do dopieszczenia | 86 | 50 |", "| mapy, do których dojdziesz pieszo z domu dziadka | 38 | 26 |", "",
     "- **Tawerna sercem**: wątki zaczynają się i wracają do tawerny (bywalcy, tablica zleceń, Borgar, plotki); ludzi z dalekich miejsc",
     "  lepiej sprowadzać do tawerny niż gracza do nich.",
     "- **Rdzeń** dopieszczony najbardziej; **cele wypraw** każdy jako jedno porządne miejsce, dojazd wozem (już jest: Woz.js, wybór na",
     "  mapie wyspy), łodzią (Wyspy.js) albo orłem; **pod ziemią** generowane piętra (już 100).",
     "- **Znika 11 map** z budowy świata (2026-10-30/31): żadna nie ma zadania, mieszkańca ani miejsca fabuły - tylko teren, drzewa i",
     "  przejścia między sąsiadkami.",
     "- **Na Twoich mapach** zmieniają się tylko krawędzie do znikających map: Łąka pod Gawrą (60 kratek), Skraj lasu (75), Góry (24),",
     "  Podgrodzie (11) - zamknięte naturalnie (brzeg, skarpa, las), nigdy niewidzialną ścianą; każda pokazana przed / po.",
     "- **Wariant A** (pełny: znika też Sady pod dworem i Przesieka pod Murami) daje 42 granice zamiast 50, ale zamyka po 80-113 kratek",
     "  krawędzi na Posiadłości, Okolicach i Podgrodziu - dlatego polecam B.", ""]
order = ["rdzen", "dzikie", "wyprawy", "wysepki", "usun"]
for g in order:
    L += ["## " + OPIS[g][0] + " (%d)" % len(SWIAT[g]), "", "| mapa | nazwa | co na niej jest | co się zmieni |", "|---|---|---|---|"]
    for m in sorted(SWIAT[g]):
        ch = ZMIANA.get(m, "zostaje bez zmian" if g != "usun" else "znika (z listy świata, mapy wyspy, danych brzegu / łąki; plik do archiwum)")
        L.append("| %d | %s | %s | %s |" % (m, mi.get(m, ""), info(m).replace("|", "/"), ch))
    L.append("")
inter_core = [m for m in sorted(mi) if m not in uk and m not in UNDER and m not in ROBOCZE and m not in WYPRAWY_WN]
L += ["## Wnętrza w rdzeniu (zostają: %d)" % len(inter_core), "",
      "Tawerna, dom dziadka, budynki miasta i Podgrodzia, dwór, kantor, domy mieszkańców (żeby nikt nie znikał - ludzie wchodzą i wychodzą",
      "drzwiami), domy na wypadek utraty działki.", "", "| mapa | nazwa | co na niej jest |", "|---|---|---|"]
for m in inter_core: L.append("| %d | %s | %s |" % (m, mi[m], info(m).replace("|", "/")))
L += ["", "## Wnętrza celów wypraw (zostają razem ze swoim miejscem: %d)" % len(WYPRAWY_WN), "", "| mapa | nazwa | należy do |", "|---|---|---|"]
for m, p in sorted(WYPRAWY_WN.items()): L.append("| %d | %s | %s |" % (m, mi.get(m, ""), mi.get(p, "")))
L += ["", "## Pod ziemią (zostaje, tu może być więcej generowanych map: %d)" % len(UNDER), "", ", ".join("%d %s" % (m, mi.get(m, "")) for m in sorted(UNDER)), "",
      "## Robocze (nie w grze: %d)" % len(ROBOCZE), "", ", ".join("%d %s" % (m, mi.get(m, "")) for m in ROBOCZE), "",
      "## Co trzeba by zrobić (po zgodzie, etapami, każdy etap przed / po)", "",
      "1. Krawędzie Twoich map i map zostających przy znikających: brzeg / skarpa / las (obrazy przed / po do zgody).",
      "2. Świat bez 11 map: `docs/mapy/swiat_uklad.json`, `Swiat_Data.js` (przejścia), mapa wyspy (`MapaWyspy_Data.js`, obrazy),",
      "   orzeł (`Orzel_Data.js`), dane brzegu i łąki (przeliczane narzędziami), listy map we wtyczkach (Laka, Ziemia, Wzgorza,",
      "   CzerwonaWoda, Widok); pliki map do archiwum (nie kasowane).",
      "3. Dojazdy: postój wozu dla Łąki menhirów (albo przejście z Leśnej drogi), łacha na Wysepkę Samotnej Sosny.",
      "4. Testy świata (styki, przejścia, mapa wyspy, orzeł, krawędzie) na nowo; pełny przebieg testów - za Twoją zgodą.",
      "5. Dalej: treść przenosić do rdzenia i tawerny (zlecenia, rozmowy), cele wypraw dopieszczać jedno po drugim."]
open(os.path.join(ROOT, "docs", "mapy", "RDZEN.md"), "wb").write(("\n".join(L) + "\n").encode("utf-8"))
print("lista: docs/mapy/RDZEN.md,", len(L), "wierszy; wnętrza rdzenia", len(inter_core))
