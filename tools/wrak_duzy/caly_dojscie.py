# -*- coding: utf-8 -*-
"""Dojście do wraku (gracz 2026-11-14, rysunek z czerwoną ramką: „żeby gracz mógł tak dojść, żeby był częściowo widoczny za statkiem
... pod samiutki statek też podejść”, „z prawej strony statku jakieś blokady niewidzialne są”):
  - zamknięty tylko korpus kadłuba: 2 rzędy (y-1, y); rząd wyżej wolny - idąc za statkiem w dół bohater chowa się za burtą, od kotwicy do rufy; dziób z bukszprytem i rząd wyżej wolne (za statkiem bohater
    wystaje nad pokład, pod dziobem chodzi się swobodnie);
  - obrazek statku 42 px niżej (<Dy:42>: stopy bohatera w rzędzie pod statkiem stają równo z dolną krawędzią kadłuba, TawernaCore): bohater podchodzi pod same deski, staje na tle najniższych klepek;
  - dwie niewidzialne „Blokada: ...” dawnej rufy (na prawo od statku) znikają.
  Ostatecznie (gracz, zrzuty z gry): zamknięte x cx-5..cx+7, y cy-1..cy+1 - FreeMovement wpuszcza bohatera pół kratki w zamknięte pole,
  więc rząd pod kadłubem też jest zamknięty (inaczej stał na deskach); drzwi ładowni w (cx+1, cy+1).
  python tools/wrak_duzy/caly_dojscie.py [--wykonaj]"""
import datetime, importlib.util, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)
REL = "data/Map219.json"
m, lay = RW.read_json(REL)
W, H, d = m["width"], m["height"], m["data"]
ship = next(e for e in m["events"] if e and e["pages"][0]["image"]["characterName"] == "!$1_Wrak_Caly")
cx, cy = ship["x"], ship["y"]
ship["note"] = "<Cienie:maska><Dy:42>"
freed = closed = 0
for y in range(cy - 3, cy + 3):
    for x in range(cx - 9, cx + 10):
        i = (5 * H + y) * W + x
        want = 2 if (cy - 1 <= y <= cy + 1 and cx - 5 <= x <= cx + 7) else None
        if want == 2 and d[i] in (0, 1, 31): d[i] = 2; closed += 1
        elif want is None and d[i] == 2: d[i] = 0; freed += 1
gone = [e["id"] for e in m["events"] if e and e["name"].startswith("Blokada:") and abs(e["x"] - cx) <= 14 and abs(e["y"] - cy) <= 4]
print("statek (%d,%d): zwolnione pola %d, domknięte %d, znikają blokady %s" % (cx, cy, freed, closed, gone))
if "--wykonaj" in sys.argv:
    RW.need_editor_closed()
    for i in gone: m["events"][i] = None
    bak = os.path.join(ARCH, "wrak_dojscie_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    sp = os.path.join(ROOT, "data", "System.json")
    shutil.copy2(os.path.join(ROOT, REL), bak); shutil.copy2(sp, bak)
    open(os.path.join(ROOT, REL), "wb").write(RW.json_text(m, lay))
    s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano; kopie: %s" % bak)
