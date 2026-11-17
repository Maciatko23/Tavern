# -*- coding: utf-8 -*-
"""Nazwy 5 map nowego świata (gracz 2026-11-13: „twoja propozycja jest ok”): nazwa w grze (displayName w data/MapNNN.json), nazwa
w edytorze (data/MapInfos.json, bez dopisku - stare mapy o tych samych nazwach leżą w archiwum edytora), podpis
i zdanie przy pierwszej wizycie (js/teksty/miejsca.txt: mapa.<id>.pod / .opis - tylko gdy ich jeszcze nie ma).
  python tools/nowy_swiat/nazwy.py [--wykonaj]
Po zapisie: node tools/nazwa_mapy/obrazki.js (gotowe obrazki nazw) i node tools/teksty.js sprawdz miejsca."""
import datetime, json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

NAMES = {
    219: ("Słony Brzeg", "wraki, sól i wyrzucone drewno", "Morze daje tu wszystko, tylko nie wodę do picia."),
    218: ("Podgrodzie", "chałupy nad suchym korytem", "Rzeka płynęła tu kiedyś; zostały po niej kamienie i pamięć."),
    220: ("Kruczogród", "miasteczko z tawerną i studnią", "Studnia na rynku daje mało, za to plotek nigdy nie brakuje."),
    221: ("Dwór nad Jazem", "dwór Zaleskich i jaz na rzece", "Nad jazem woda stoi pełna, a poniżej ledwie się sączy."),
    222: ("Krucze Turnie", "kopalnia, lasy i dzika zwierzyna", "W skale drzemie żelazo, a w lasach czeka zwierzyna."),
}
SUFFIX = ""   # (bez dopisku: Okolice.js bierze nazwę z listy edytora do „Odkrycie · ...” - dopisek „(nowy świat)” wychodził w grze)


def main():
    infos_raw = open(os.path.join(ROOT, "data", "MapInfos.json"), "rb").read()
    infos = json.loads(infos_raw.decode("utf-8"))
    if W.db_text(infos).encode("utf-8") != infos_raw: raise SystemExit("STOP: MapInfos.json nie w układzie edytora")
    out = {}
    for mid, (name, pod, opis) in NAMES.items():
        rel = "data/Map%03d.json" % mid
        raw = open(os.path.join(ROOT, rel), "rb").read()
        m = json.loads(raw.decode("utf-8"))
        if W.map_text(m).encode("utf-8") != raw: raise SystemExit("STOP: %s nie w układzie edytora" % rel)
        print("  %d  edytor: %-30s -> %-30s  w grze: %-18s -> %s" % (mid, infos[mid]["name"], name + SUFFIX, m.get("displayName"), name))
        infos[mid]["name"] = name + SUFFIX
        if m.get("displayName") != name:
            m["displayName"] = name
            out[rel] = (raw, W.map_text(m).encode("utf-8"))
    out["data/MapInfos.json"] = (infos_raw, W.db_text(infos).encode("utf-8"))
    tp = os.path.join(ROOT, "js", "teksty", "miejsca.txt")
    traw = open(tp, "rb").read()
    txt = traw.decode("utf-8")
    add = ["# %d %s\nmapa.%d.pod = %s\nmapa.%d.opis = %s\n" % (mid, n, mid, p, mid, o) for mid, (n, p, o) in NAMES.items() if ("mapa.%d.pod" % mid) not in txt]
    if add:
        marker = "# ======================================================================== Miejsca na zewnątrz"
        block = "\n# (2026-11-13) nowy świat: 5 map w dolinie\n" + "\n".join(add)
        i = txt.index(marker)
        j = txt.find("\n# ====", i + len(marker))
        new = txt[:j] + "\n" + block + txt[j:] if j >= 0 else txt.rstrip("\n") + "\n" + block
        out["js/teksty/miejsca.txt"] = (traw, new.encode("utf-8"))
        print("  miejsca.txt: +%d podpisów" % len(add))
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    W.need_editor_closed()
    bak = os.path.join(ARCH, "nazwy_nowy_swiat_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel, (orig, new) in out.items():
        dst = os.path.join(bak, *rel.split("/")); os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, "wb").write(orig)
        open(os.path.join(ROOT, *rel.split("/")), "wb").write(new)
    print("Zapisano %d plików; kopie: %s" % (len(out), bak))


if __name__ == "__main__":
    main()
