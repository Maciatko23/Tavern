# -*- coding: utf-8 -*-
"""Wrak z trzech ostrych części (gracz 2026-11-07: „da się bardziej szczegółowo wygenerować ten statek? nie rozmazany, ostrzejszy”
-> wybór „3 ostre części”): dziób i rufa w natywnej ostrości PixelLab (612x340, 606x356 - te sprzed powiększenia x1.35) i nowy
środek (tools/wrak_duzy/ostry/srodek.png, 448x336; jego zaokrąglone końce przemalowane w PixelLab inpaint na połamane, urwane
deski - ostry/konce/srodek_konce_1.png, gracz: „wybierz najlepsze” -, barwy dopasowane do dzioba i rufy). Każda część to obrazek
„!$1_” (jedna klatka); pełne obrazki (z piaskiem) zostają też w tools/wrak_duzy/pelne - z nich grunt.py robi kadłub, piasek i maskę.
Map165: dziób (zdarzenie 1) w (9,16), środek (nowe zdarzenie) w (19,15) - rząd wyżej, z obrazkiem podłożonym o rząd: rysowany
za dziobem i rufą, które na niego zachodzą -, rufa (2) w (29,16); kadłub zamknięty niewidocznymi blokadami w rzędach 12-16 od x 5
do 34, dziura w burcie na kratkach 28 i 29 (rząd 16) - wejście prosto w otwór z (28|29,17); Map166: wyjście przez dziurę na (28,17). Cienie z masek (tools/wrak_duzy/cien_maska.py).
  python tools/wrak_duzy/trzy.py             (obrazki + kopia Map165/166 w staging)
  python tools/wrak_duzy/trzy.py --wykonaj   (mapy do data/ - przy zamkniętym edytorze)"""
import copy, datetime, glob, json, os, re, shutil, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CH = os.path.join(ROOT, "img", "characters")
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
STG = os.path.join(HERE, "staging", "data")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
NAT = os.path.join(HERE, "kopie_zapasowe", "obrazki_20261107_143752")   # (the native halves, before x1.35 - zloz135.py's copy)
HOLE = (28, 29)
PAD = 48   # (the middle stands a row up - drawn behind the bow and the stern where they overlap - its picture padded by a row below)


def pictures():
    kop = os.path.join(HERE, "kopie_zapasowe", "obrazki_135_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(kop, exist_ok=True)
    for n in ("Dziob", "Rufa"):
        dst = os.path.join(CH, "!$1_Wrak_%s_Duzy.png" % n)
        shutil.copy(dst, kop)                                         # (the x1.35 one kept)
        shutil.copy(os.path.join(NAT, "!$1_Wrak_%s_Duzy.png" % n), dst)
    m = Image.open(os.path.join(HERE, "ostry", "konce", "srodek_konce_1.png")).convert("RGBA")
    m = m.crop(m.split()[3].point(lambda v: 255 if v > 16 else 0).getbbox())
    if m.width % 2: m = m.crop((0, 0, m.width - 1, m.height))
    # the bow's and the stern's colours (it was drawn a little greyer)
    a = Image.open(os.path.join(CH, "!$1_Wrak_Dziob_Duzy.png")).convert("RGB"); b = Image.open(os.path.join(CH, "!$1_Wrak_Rufa_Duzy.png")).convert("RGB")
    both = Image.new("RGB", (a.width + b.width, max(a.height, b.height))); both.paste(a, (0, 0)); both.paste(b, (a.width, 0))
    pal = both.quantize(colors=128, method=Image.MEDIANCUT)
    rgb = m.convert("RGB").quantize(palette=pal, dither=Image.NONE).convert("RGBA")
    rgb.putalpha(m.split()[3].point(lambda v: 255 if v > 100 else 0))
    padded = Image.new("RGBA", (rgb.width, rgb.height + PAD), (0, 0, 0, 0)); padded.alpha_composite(rgb, (0, 0))
    rgb = padded
    rgb.save(os.path.join(CH, "!$1_Wrak_Srodek_Duzy.png"))
    # (the whole pictures, the sand with them: grunt.py's source - img/characters gets the hull only)
    full = os.path.join(HERE, "pelne"); os.makedirs(full, exist_ok=True)
    for n in ("Dziob", "Srodek", "Rufa"): shutil.copy(os.path.join(CH, "!$1_Wrak_%s_Duzy.png" % n), full)
    print("  obrazki: dziób %s, środek %s, rufa %s; kopie x1.35: %s" % (a.size, rgb.size, b.size, kop))


def map165():
    path = os.path.join(ROOT, "data", "Map165.json")
    raw = open(path, "rb").read()
    m = json.loads(raw.decode("utf-8"))
    if W.map_text(m).encode("utf-8") != raw: raise SystemExit("Map165 nie w układzie edytora")
    ev = m["events"]
    for i in (1, 2): ev[i]["pages"][0]["image"]["characterName"] = "!$1_Wrak_%s_Duzy" % ("Dziob" if i == 1 else "Rufa")
    ev[1]["x"], ev[1]["y"] = 9, 16
    ev[2]["x"], ev[2]["y"] = 29, 16
    # the middle: the bow's event copied, its own picture and words
    mid = next((e for e in ev if e and "<Wrak:srodek>" in (e.get("note") or "")), None)
    if mid is None:
        mid = copy.deepcopy(ev[1]); mid["id"] = len(ev); ev.append(mid)
    mid["name"] = "Wrak: śródokręcie"; mid["note"] = "<Wrak:srodek><Cienie:maska>"; mid["x"], mid["y"] = 19, 15
    mid["pages"][0]["image"]["characterName"] = "!$1_Wrak_Srodek_Duzy"
    for c in mid["pages"][0]["list"]:
        if c["code"] == 355:
            c["parameters"][0] = re.sub(r'Tawerna\.popup\("[^"]*"', 'Tawerna.popup("Śródokręcie „Białej Źrenicy”. Kikut grotmasztu, żebra kadłuba sterczą nad piachem jak kości."', c["parameters"][0])
    blank = copy.deepcopy(ev[3]["pages"][0])
    def blocker(i, x, y, spec, name):
        while len(ev) <= i: ev.append(None)
        ev[i] = {"id": i, "name": name, "note": "<Occupy:" + spec + ">", "pages": [copy.deepcopy(blank)], "x": x, "y": y}
    h0, h1 = HOLE
    blocker(3, 5, 16, "right=%d,up=4" % (h0 - 1 - 5), "Blokada: kadłub (dziób, środek, rufa do dziury)")
    blocker(4, h0, 15, "right=%d,up=3" % (h1 - h0), "Blokada: kadłub nad dziurą")
    blocker(56, h1 + 1, 16, "right=%d,up=4" % (34 - h1 - 1), "Blokada: kadłub rufy (za dziurą)")
    if len(ev) > 57: ev[57] = None
    ev[40]["x"], ev[40]["y"] = h0, 16
    ev[58]["x"], ev[58]["y"] = h1, 16
    return path, raw, W.map_text(m).encode("utf-8"), mid["id"]


def map166():
    path = os.path.join(ROOT, "data", "Map166.json")
    raw = open(path, "rb").read()
    m = json.loads(raw.decode("utf-8"))
    for e in m["events"]:
        if not e: continue
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == 165:
                    c["parameters"][2], c["parameters"][3], c["parameters"][4] = HOLE[0], 17, 2
    return path, raw, W.map_text(m).encode("utf-8")


if "--wykonaj" not in sys.argv: pictures()
a = map165(); b = map166()
print("  Map165: środek = zdarzenie %d; dziura na %s" % (a[3], HOLE))
if "--wykonaj" in sys.argv:
    W.need_editor_closed()
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_trzy")
    os.makedirs(kop, exist_ok=True)
    for path, raw, new in (a[:3], b):
        open(os.path.join(kop, os.path.basename(path)), "wb").write(raw)
        open(path, "wb").write(new)
    print("zapisane; kopie:", kop)
else:
    os.makedirs(STG, exist_ok=True)
    for path, raw, new in (a[:3], b): open(os.path.join(STG, os.path.basename(path)), "wb").write(new)
    print("kopie w", STG)
