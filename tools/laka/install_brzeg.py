# -*- coding: utf-8 -*-
"""Zaokrąglony brzeg na pozostałych mapach z morzem (2026-11-05; gracz: „kanciaste wybrzeże, mapa Leśna droga - czy inne mapy mają podobnie?”; tools/laka/brzeg_audyt.py,
obrazki docs/laka/brzegi/para_*.png):
  js/plugins/CzerwonaWoda.js                  BRZEG_MAPS + mapy z NOWE (bez Map020, dopóki gracz nie zdecyduje: --z-20)
  data/Map900, 901, 912, 933, 934.json        w notatce mapy <Water:salt> - to morze wyspy; bez tego niebieskie (sąsiedzi czerwoni) i wolno z niego pić (zasada gracza: susza)
  python tools/laka/install_brzeg.py [--z-20] --dry-run | --wykonaj    (edytor zamknięty! kopie zapasowe: tools/laka/kopie_zapasowe/<czas>_brzeg)
W mapach zmienia się tylko notatka mapy, reszta pliku bajt w bajt ta sama."""
import os, sys, re, json, hashlib, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
NOWE = [21, 900, 901, 910, 912, 914, 917, 918, 920, 922, 923, 931, 933, 934, 935, 950, 951]
SOL = [900, 901, 912, 933, 934]
PLUGIN = os.path.join(ROOT, "js", "plugins", "CzerwonaWoda.js")


def sha(b): return hashlib.sha256(b).hexdigest()[:16]


def nowa_notatka(b):
    """bajty mapy z <Water:salt> na końcu notatki MAPY (ona stoi przed "data":[, notatki zdarzeń za nią)"""
    k = b.find(b'"data":[')
    i = b.rfind(b'"note":"', 0, k)
    if i < 0: i = b.find(b'"note":"', k + 1)   # (RPG Maker pisze notatkę mapy po tablicy data, przed zdarzeniami - ale po "encounterStep" itd.)
    assert i >= 0
    j = i + 8
    while True:
        j = b.find(b'"', j)
        if b[j - 1:j] != b"\\" or b[j - 2:j] == b"\\\\": break
        j += 1
    return b[:j] + b" <Water:salt>" + b[j:]


def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    nowe = NOWE + ([20] if "--z-20" in sys.argv else [])
    zmiany = []
    b = open(PLUGIN, "rb").read()
    m = re.search(rb"const BRZEG_MAPS = \[([^\]]*)\];", b)
    stare = [int(v) for v in m.group(1).replace(b" ", b"").split(b",")]
    lista = stare + [v for v in nowe if v not in stare]
    nb = b[:m.start()] + b"const BRZEG_MAPS = [" + ", ".join(map(str, lista)).encode() + b"];" + b"   // (2026-11-05: every map with the island's sea, tools/laka/install_brzeg.py)" + b[m.end():]
    zmiany.append((PLUGIN, b, nb))
    print("js/plugins/CzerwonaWoda.js  BRZEG_MAPS: %d -> %d map  %s -> %s" % (len(stare), len(lista), sha(b), sha(nb)))
    for mid in SOL:
        p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
        b = open(p, "rb").read()
        a = json.loads(b.decode("utf-8"))
        if re.search(r"<Water:\s*salt\s*>", a.get("note") or ""): print("Map%03d: już ma" % mid); continue
        nb = nowa_notatka(b)
        c = json.loads(nb.decode("utf-8"))
        assert c["note"] == (a.get("note") or "") + " <Water:salt>", mid
        c["note"] = a.get("note")
        assert c == a, mid
        print("Map%03d: notatka %r -> %r  %s -> %s" % (mid, a.get("note"), a.get("note") + " <Water:salt>", sha(b), sha(nb)))
        zmiany.append((p, b, nb))
    if not wykonaj: print("(dry-run: nic nie zapisano; przy zamkniętym edytorze: python tools/laka/install_brzeg.py --wykonaj)"); return
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_brzeg")
    os.makedirs(kop, exist_ok=True)
    for p, b, nb in zmiany:
        open(os.path.join(kop, os.path.basename(p)), "wb").write(b)
        open(p, "wb").write(nb)
    print("zapisano; kopie zapasowe:", kop)


if __name__ == "__main__": main()
