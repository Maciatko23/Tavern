# -*- coding: utf-8 -*-
"""INSTALACJA MAP PRÓBNYCH A (990) i B (991) - tylko nowe pliki i dopiski, nic istniejącego się nie zmienia poza listami:
  data/Map990.json, data/Map991.json (nowe)              z tools/mapa_probna/staging/data
  data/MapInfos.json                                      + 2 wpisy (i puste miejsca do 990)
  js/plugins/Swiat_Data.js                                + położenia A i B (x0 = 2000 / 2064, daleko od świata) i linki na wspólnej krawędzi
  js/plugins/Debug.js, js/teksty/f9.txt                   + wiersze F9 (zakładka „Wyspa i fabuła”, „Przenieś mnie do:”): „Mapa próbna A”, „Mapa próbna B”
  js/teksty/miejsca.txt                                   + nazwy miejsc (podpis i zdanie przy wejściu)
  js/plugins/CzerwonaWoda.js                              BRZEG_MAPS + 990
  js/plugins/Ziemia.js, js/tawerna_wtyczki.js             (runda 3) Ziemia na 990/991: parametr maps="3,990,991", ALLOW/OVERLAY zależne od zestawu (11) (zaokrąglony brzeg morza jak na Map159)
  python tools/mapa_probna/install.py --dry-run           (domyślnie; nic nie zapisuje, wypisuje różnice)
  python tools/mapa_probna/install.py --wykonaj           (zamknięty edytor RPG Makera!; sha256 plików, kopie zapasowe w tools/mapa_probna/kopie_zapasowe/<czas>)
  python tools/mapa_probna/install.py --nakladka          (tylko buduje nakładkę do prób w grze: staging/nakladka/{data,js}; GAME_OVERLAY=tools/mapa_probna/staging/nakladka GAME_OVERLAY_JS=1)
Wzorzec użycia plików: teksty i listy czytane z żywych plików w chwili instalacji (zmiany gracza z edytora zostają)."""
import os, sys, json, re, hashlib, shutil, datetime
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
STG = os.path.join(HERE, "staging")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

A, B = 990, 991
POLOZENIE = {A: [2000, 0, 64, 60], B: [2064, 0, 64, 60]}
START = {A: (24, 34, 2), B: (29, 34, 2)}           # (x, y, kierunek) - kratki, na których da się stać (sprawdza zbuduj/kontrola)


def sha(b): return hashlib.sha256(b).hexdigest()


def czytaj(rel): return open(ROOT + rel, "rb").read()


def lf(t): return t.replace("\r\n", "\n")


# ---------------------------------------------------------------------------------------- łaty (czyste funkcje bajty -> bajty)
def lata_mapinfos(raw):
    t = raw.decode("utf-8")
    if '"id":%d,' % A in t: return raw
    arr = json.loads(t)
    mx = max(m["order"] for m in arr if m)
    nxt = len(arr)
    linie = t.rstrip("\n").split("\n")
    assert linie[-1] == "]"
    linie[-2] = linie[-2] + ","
    nowe = ["null," for _ in range(A - nxt)]
    nowe.append(json.dumps({"id": A, "expanded": False, "name": "Mapa próbna A", "order": mx + 1, "parentId": 0, "scrollX": 0, "scrollY": 0}, ensure_ascii=False, separators=(",", ":")) + ",")
    nowe += ["null,"] * (B - A - 1)
    nowe.append(json.dumps({"id": B, "expanded": False, "name": "Mapa próbna B", "order": mx + 2, "parentId": 0, "scrollX": 0, "scrollY": 0}, ensure_ascii=False, separators=(",", ":")))
    out = "\n".join(linie[:-1] + nowe + ["]"]) + ("\n" if t.endswith("\n") else "")
    json.loads(out)
    return out.encode("utf-8")


def lata_swiat(raw):
    t = raw.decode("utf-8")
    if '"%d":' % A in t: return raw
    m = re.search(r'(maps: \{.*?)(\},\n\s*links)', t, re.S)
    dop = ", " + ", ".join('"%d": %s' % (k, json.dumps(v)) for k, v in POLOZENIE.items())
    t = t[:m.end(1)] + dop + t[m.end(1):]
    x0, y0, w, h = POLOZENIE[A]
    lin = ['            {"a": %d, "side": "E", "from": %d, "to": %d, "b": %d}' % (A, y0, y0 + h - 1, B),
           '            {"a": %d, "side": "W", "from": %d, "to": %d, "b": %d}' % (B, y0, y0 + h - 1, A)]
    m2 = re.search(r'(\{"a": 950, "side": "W", "from": 225, "to": 251, "b": 963\})\n(\s*\],\n\s*// mapy)', t)
    assert m2, "nie znaleziono końca listy links w Swiat_Data.js"
    t = t[:m2.end(1)] + ",\n" + ",\n".join(lin) + "\n" + t[m2.start(2):]
    return t.encode("utf-8")


def lata_debug(raw):
    t = raw.decode("utf-8")
    if "probnaA" in t: return raw
    st = '{ id: "zagroda", map: 168, x: 98, y: 12, d: 4 }\n    ];'
    assert st in t, "Debug.js: nie znaleziono ISLE_GO"
    nowe = '{ id: "zagroda", map: 168, x: 98, y: 12, d: 4 },\n        // (2026-11-01) mapy próbne A (zestaw 11) i B (zestaw 9), tools/mapa_probna: tylko do porównania wyglądu\n'
    nowe += "        { id: \"probnaA\", map: %d, x: %d, y: %d, d: %d },\n        { id: \"probnaB\", map: %d, x: %d, y: %d, d: %d }\n    ];" % ((A,) + START[A] + (B,) + START[B])
    return t.replace(st, nowe).encode("utf-8")


def lata_f9(raw):
    t = lf(raw.decode("utf-8"))
    if "probnaA" in t: return raw
    blok = ("# probnaA\nwyspa.miejsca.probnaA.nazwa = Mapa próbna A (zestaw 11)\n"
            "wyspa.miejsca.probnaA.opis = Map990: zatoka z brzegiem, półka ze schodami, wzgórze, plamy i rumowisko, zagroda z furtką, koniec muru. Styk z mapą B po wschodzie.\n"
            "# probnaB\nwyspa.miejsca.probnaB.nazwa = Mapa próbna B (zestaw 9)\n"
            "wyspa.miejsca.probnaB.opis = Map991: las, pole skał, wzgórze z wejściem, sad, zagroda z furtką. Styk z mapą A po zachodzie.\n")
    m = re.search(r"(wyspa\.miejsca\.zagroda\.opis = [^\n]*\n)", t)
    assert m, "f9.txt: brak wiersza zagroda.opis"
    return (t[:m.end()] + blok + t[m.end():]).encode("utf-8")


def lata_miejsca(raw):
    t = lf(raw.decode("utf-8"))
    if "mapa.990." in t: return raw
    if not t.endswith("\n"): t += "\n"
    t += ("\n# 990 Mapa próbna A\nmapa.990.pod = próba pieczątek, zestaw 11\nmapa.990.opis = Kawałek po kawałku wszystko, co jest w świecie, z map wzorcowych.\n"
          "\n# 991 Mapa próbna B\nmapa.991.pod = próba pieczątek, zestaw 9\nmapa.991.opis = To samo w zestawie Kruczego Jaru; do porównania z mapą A.\n")
    return t.encode("utf-8")


def lata_woda(raw):
    t = raw.decode("utf-8")
    if "BRZEG_MAPS = [990," in t or " 990," in t.split("BRZEG_MAPS = [")[1].split("]")[0]: return raw
    return t.replace("const BRZEG_MAPS = [125,", "const BRZEG_MAPS = [990, 125,", 1).encode("utf-8")


def lata_ziemia(raw):
    """Ziemia.js: rodzaje gruntu ALLOW/OVERLAY zależne od zestawu kafli (9: jak dotąd; 11: bez A2-34/35 mur z cegieł, A2-46 ramka i A2-47 półka)"""
    t = raw.decode("utf-8")
    if "ALLOW_11" in t: return raw
    a = "    const ALLOW = new Set([0, 1, 3, 4, 5, 8, 9, 10, 11, 15, 18, 19, 20, 21, 23, 30]);"
    b = "    const OVERLAY = new Set([12, 13, 31]);"
    c = "        const W = $gameMap.width(), H = $gameMap.height(), flags = $gameMap.tilesetFlags(),"
    assert a in t and b in t and c in t, "Ziemia.js: nie znaleziono ALLOW / OVERLAY / początku geometry()"
    NL = "\n"
    t = t.replace(a, "    const ALLOW_9 = new Set([0, 1, 3, 4, 5, 8, 9, 10, 11, 15, 18, 19, 20, 21, 23, 30]);" + NL
                  + "    // (zestaw 11, mapy próbne 990/991: A2-34/35 to mur z cegieł, 46 ramka, 47 półka skalna - nie są gruntem do mieszania)" + NL
                  + "    const ALLOW_11 = new Set([0, 1, 3, 4, 5, 8, 9, 10, 11, 15, 20, 21, 23]);")
    t = t.replace(b, "    const OVERLAY_9 = new Set([12, 13, 31]);" + NL + "    const OVERLAY_11 = new Set([12, 13]);")
    t = t.replace(c, "        const ALLOW = $gameMap.tilesetId() === 11 ? ALLOW_11 : ALLOW_9, OVERLAY = $gameMap.tilesetId() === 11 ? OVERLAY_11 : OVERLAY_9;" + NL + c, 1)
    return t.encode("utf-8")


def lata_wtyczki(raw):
    t = raw.decode("utf-8")
    if '"maps":"3,990,991"' in t: return raw
    a = '"parameters":{"maps":"3","on":"true","edges":"true"'
    assert a in t, "tawerna_wtyczki.js: nie znaleziono parametrów Ziemi"
    return t.replace(a, '"parameters":{"maps":"3,990,991","on":"true","edges":"true"', 1).encode("utf-8")


PLIKI = [("js/plugins/Ziemia.js", lata_ziemia), ("js/tawerna_wtyczki.js", lata_wtyczki), ("data/MapInfos.json", lata_mapinfos), ("js/plugins/Swiat_Data.js", lata_swiat), ("js/plugins/Debug.js", lata_debug),
         ("js/teksty/f9.txt", lata_f9), ("js/teksty/miejsca.txt", lata_miejsca), ("js/plugins/CzerwonaWoda.js", lata_woda)]
MAPY = ["data/Map%03d.json" % A, "data/Map%03d.json" % B]
# skróty (pierwsze 16 znaków sha256) map w data/, które wolno nadpisać (990: wersja gracza dc61145d, A w rundzie 3 jest jego mapą plus dodatki; 991: runda 1); nadpisanie tylko wtedy, gdy plik w data/ jest nadal taki (gracz nie zmienił go w edytorze)
ZAINSTALOWANE_R1 = {"data/Map990.json": "dc61145dff540fc3", "data/Map991.json": "dfaa5049c9adcdc7"}   # 990: wersja GRACZA (po poprawce wzgórza w edytorze, 2026-11-01 12:21); 991: runda 1


def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    zle = []
    for rel in MAPY:
        src = os.path.join(STG, rel)
        if not os.path.exists(src): zle.append("brak %s (uruchom: python tools/mapa_probna/zbuduj.py)" % src)
        if os.path.exists(ROOT + rel):
            cur = sha(czytaj(rel))[:16]
            if cur != ZAINSTALOWANE_R1.get(rel) and "--nadpisz-zmienione" not in sys.argv:
                zle.append("%s w data/ ma skrót %s (inny niż zainstalowany w rundzie 1: %s) - gracz zmienił mapę po zbudowaniu rundy 3? Zbuduj od nowa na jego wersji (tools/mapa_probna/gracz/); nadpisz tylko z --nadpisz-zmienione" % (rel, cur, ZAINSTALOWANE_R1.get(rel)))
    nowe = {}
    for rel, f in PLIKI:
        stary = czytaj(rel)
        try: nowy = f(stary)
        except AssertionError as e: zle.append(str(e)); continue
        nowe[rel] = (stary, nowy)
    if "--nakladka" in sys.argv:
        out = os.path.join(STG, "nakladka")
        shutil.rmtree(out, ignore_errors=True)
        for rel, (s, n) in nowe.items():
            p = os.path.join(out, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "wb").write(n)
        for rel in MAPY:
            p = os.path.join(out, rel); os.makedirs(os.path.dirname(p), exist_ok=True); shutil.copyfile(os.path.join(STG, rel), p)
        print("nakładka:", out); return
    if zle:
        print("STOP:"); [print(" -", z) for z in zle]; sys.exit(1)
    for rel in MAPY: print(("NADPISZ" if os.path.exists(ROOT + rel) else "NOWA   ") + " %-30s %8d B  sha256 %s" % (rel, os.path.getsize(os.path.join(STG, rel)), sha(open(os.path.join(STG, rel), "rb").read())[:16]))
    for rel, (s, n) in nowe.items():
        print("%-6s %-30s %s" % ("ZMIEN" if s != n else "BEZ ZM.", rel, "(+%d B)" % (len(n) - len(s)) if s != n else "(już zainstalowane)"))
    if not wykonaj:
        print("\n(dry-run: nic nie zapisano; po zgodzie: --wykonaj, edytor RPG Makera zamknięty)"); return
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel, (s, n) in nowe.items():
        if s != n:
            p = os.path.join(kop, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "wb").write(s)
    for rel in MAPY:
        if os.path.exists(ROOT + rel):
            p = os.path.join(kop, rel); os.makedirs(os.path.dirname(p), exist_ok=True); shutil.copyfile(ROOT + rel, p)
    for rel in MAPY: shutil.copyfile(os.path.join(STG, rel), ROOT + rel)
    for rel, (s, n) in nowe.items():
        if s != n: open(ROOT + rel, "wb").write(n)
    print("zainstalowano; kopie zapasowe zmienionych plików:", kop)


if __name__ == "__main__":
    main()
