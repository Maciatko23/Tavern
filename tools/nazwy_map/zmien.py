# -*- coding: utf-8 -*-
"""Unikatowe nazwy map (gracz 2026-11-07: „każda mapa musi mieć unikatową nazwę, nie może być bla bla bla 1 albo bla bla bla 2;
nazwa ma określać, co tam się znajduje albo znajdzie”). Dla każdej mapy z listy:
  - nazwa w edytorze (data/MapInfos.json) i nazwa w grze (displayName w data/MapNNN.json),
  - podpis i zdanie przy pierwszej wizycie (js/teksty/miejsca.txt: mapa.<id>.pod / .opis) - tylko gdy ich jeszcze nie ma,
  - nazwy zdarzeń przejść na innych mapach („Przejście -> <stara nazwa>”, tylko nazwa zdarzenia w edytorze).
Mapy, których nazwa w grze jest już jedyna i mówi, co tam jest (Omszała łąka, Łąka menhirów), dostają tylko tę samą nazwę w edytorze.
Leśna droga, Polna droga, Skraj lasu zostają (jedyne, prawdziwe; ~90 miejsc w tekstach w odmianach).
  python tools/nazwy_map/zmien.py             (raport + kopie w tools/nazwy_map/staging; nic w grze)
  python tools/nazwy_map/zmien.py --wykonaj   (do data/ i js/teksty - TYLKO przy zamkniętym edytorze; kopie: kopie_zapasowe/<czas>)
Po zapisie: node tools/nazwa_mapy/obrazki.js (gotowe obrazki nazw) i node tools/teksty.js sprawdz miejsca."""
import datetime, json, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
STG = os.path.join(HERE, "staging")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

# id: (name, subtitle or None, first-visit sentence or None)
NAMES = {
    4:   ("Łąka pod Gawrą", None, None),
    17:  ("Omszała łąka", None, None),
    18:  ("Łąka menhirów", None, None),
    910: ("Sosnowy Klif", "sosny nad urwistym brzegiem", "Wiatr od morza czesze korony sosen na samej krawędzi."),
    912: ("Ugory za Spaloną Zagrodą", "pola, których nikt już nie orze", "Zdziczałe zagony i kłody po dawnym płocie."),
    917: ("Wyspa Kormoranów", "gniazda kormoranów na skałach", "Przy odpływie wiedzie tu z brzegu mielizna; potem morze ją zabiera."),
    918: ("Wysepka Samotnej Sosny", "jedno drzewo pośrodku fal", "Sosna rośnie tu sama, jakby ktoś posadził ją morzu na przekór."),
    920: ("Wyspa Solna", "biała sól na nadbrzeżnych głazach", "Fale zostawiają na kamieniach sól, a sól na wyspie jest w cenie."),
    922: ("Wyspa Przemytników", "gęsty las i ukryta przystań", "Między sosnami łatwo schować łódź i to, czego nie powinien zobaczyć celnik."),
    923: ("Kamień Rybaków", "kamienny kopiec za cyplem", "Rybacy układali tu kamienie, prosząc morze o spokojny połów."),
    933: ("Zatoka Kłód", "wyrzucone na brzeg pnie", "Morze znosi tu drewno ze wszystkich stron wyspy."),
    934: ("Miedze za Osadą", "skrawki pól za Osadą Milczących", "Wąskie miedze, na których nikt nie zostawia śladów."),
    935: ("Orla Iglica", "skała, na którą wzlatują tylko orły", "Z dołu widać tylko pióra krążące nad szczytem."),
    951: ("Skała Strażnicza", "skalna twierdza naprzeciw garnizonu", "Stąd widać każdy żagiel, który wpływa do zatoki."),
}


def main():
    run = "--wykonaj" in sys.argv
    infos_raw = open(os.path.join(ROOT, "data", "MapInfos.json"), "rb").read()
    infos = json.loads(infos_raw.decode("utf-8"))
    if W.db_text(infos).encode("utf-8") != infos_raw: raise SystemExit("MapInfos.json nie w układzie edytora - nie ruszam")
    old = {}
    out_files = {}
    for mid, (name, pod, opis) in NAMES.items():
        e = infos[mid]
        old[mid] = e["name"]
        p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
        raw = open(p, "rb").read()
        m = json.loads(raw.decode("utf-8"))
        if W.map_text(m).encode("utf-8") != raw: raise SystemExit("Map%03d nie w układzie edytora" % mid)
        print("  %3d  %-34s -> %-26s (w grze: %r -> %r)" % (mid, e["name"], name, m.get("displayName", ""), name))
        e["name"] = name
        if m.get("displayName") != name:
            m["displayName"] = name
            out_files["data/Map%03d.json" % mid] = (raw, W.map_text(m).encode("utf-8"))
    out_files["data/MapInfos.json"] = (infos_raw, W.db_text(infos).encode("utf-8"))
    # the transfer events' names on the other maps (only their names in the editor)
    pat = {mid: re.compile(r"(Przejście -> )" + re.escape(o) + r"(?![\w#])") for mid, o in old.items() if o != NAMES[mid][0]}
    for p in sorted(os.listdir(os.path.join(ROOT, "data"))):
        if not re.match(r"Map\d{3}\.json$", p): continue
        rel = "data/" + p
        raw = out_files[rel][1] if rel in out_files else open(os.path.join(ROOT, rel), "rb").read()
        m = json.loads(raw.decode("utf-8"))
        n = 0
        for e in m["events"]:
            if not e: continue
            for mid, rx in pat.items():
                if rx.search(e["name"]): e["name"] = rx.sub(r"\g<1>" + NAMES[mid][0], e["name"]); n += 1
        if n:
            if W.map_text(m).encode("utf-8") != W.map_text(json.loads(raw.decode("utf-8"))).encode("utf-8") or True:
                orig = out_files[rel][0] if rel in out_files else raw
                out_files[rel] = (orig, W.map_text(m).encode("utf-8"))
            print("     %s: %d nazw zdarzeń przejść" % (p, n))
    # the places' words
    tp = os.path.join(ROOT, "js", "teksty", "miejsca.txt")
    traw = open(tp, "rb").read()
    txt = traw.decode("utf-8")
    add = []
    for mid, (name, pod, opis) in NAMES.items():
        if pod and ("mapa.%d.pod" % mid) not in txt:
            add.append("# %d %s\nmapa.%d.pod = %s\nmapa.%d.opis = %s\n" % (mid, name, mid, pod, mid, opis))
    if add:
        marker = "# ======================================================================== Miejsca na zewnątrz"
        block = "\n# (2026-11-07) wyspy i mapy brzegowe z nowymi nazwami\n" + "\n".join(add)
        i = txt.index(marker)
        j = txt.find("\n# ====", i + len(marker))
        new = txt[:j] + "\n" + block + txt[j:] if j >= 0 else txt + block
        out_files["js/teksty/miejsca.txt"] = (traw, new.encode("utf-8"))
        print("  miejsca.txt: +%d podpisów" % len(add))
    if run:
        W.need_editor_closed()
        kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
        for rel, (orig, new) in out_files.items():
            dst = os.path.join(kop, *rel.split("/")); os.makedirs(os.path.dirname(dst), exist_ok=True)
            open(dst, "wb").write(orig)
            open(os.path.join(ROOT, *rel.split("/")), "wb").write(new)
        print("zapisane (%d plików); kopie: %s" % (len(out_files), kop))
    else:
        shutil.rmtree(STG, ignore_errors=True)
        for rel, (orig, new) in out_files.items():
            dst = os.path.join(STG, *rel.split("/")); os.makedirs(os.path.dirname(dst), exist_ok=True)
            open(dst, "wb").write(new)
        print("kopie w %s (%d plików)" % (STG, len(out_files)))


main()
