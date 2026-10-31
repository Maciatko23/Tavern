# -*- coding: utf-8 -*-
"""Próba „Przytulna sala”: kopia OBECNEJ data/Map001.json z dołożonymi ozdobami sali, baru i sceny.
  python tools/tavern/przytulna/build.py            -> tools/tavern/przytulna/staging/Map001.json + overlay/data/Map001.json
Nie zapisuje nic w data/. Zapisuje skrót (sha256) pliku, z którego powstała kopia: staging/baza.json (install.py go sprawdza).
Zmienia tylko: obraz chorągwi (zdarzenia 40, 41) i NOWE zdarzenia (id 350+: świece na stołach, półki z butelkami za ladą,
latarnie, grajek na scenie). Kafle i wszystkie stare zdarzenia zostają bez zmian (sprawdza to --porownaj)."""
import copy, hashlib, json, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SRC = os.path.join(ROOT, "data", "Map001.json")
OUT = os.path.join(ROOT, "tools", "tavern", "przytulna", "staging")
OVL = os.path.join(ROOT, "tools", "tavern", "przytulna", "overlay", "data")
HALL = (37, 27, 83, 44)


def wczytaj(path):
    raw = open(path, "rb").read()
    return raw, json.loads(raw.decode("utf-8"))


def strona(char, idx, dir_, pat, prio=0, through=True, note=""):
    return {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False,
                           "switch1Id": 1, "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
            "directionFix": True, "image": {"tileId": 0, "characterName": char, "direction": dir_, "pattern": pat, "characterIndex": idx},
            "list": [{"code": 0, "indent": 0, "parameters": []}], "moveFrequency": 3,
            "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": prio, "stepAnime": False, "through": through, "trigger": 0, "walkAnime": False}


def zdarzenie(i, nazwa, x, y, char, idx=0, dir_=2, pat=0, prio=0, through=True, note=""):
    return {"id": i, "name": nazwa, "note": note, "pages": [strona(char, idx, dir_, pat, prio, through)], "x": x, "y": y}


# miękkie ciepłe wypełnienie świateł nocą w miejscach, gdzie między kręgami lamp zostawał ciemny ukośny pas (przy ścianach sali, za ladą)
for (fx, fy) in ((64, 29), (64, 33), (64, 37), (64, 41), (36, 29), (36, 33), (36, 37), (36, 41), (41, 31), (59, 31), (47, 27), (53, 27), (45, 43), (55, 43), (45, 37), (55, 37), (50, 31)):
    NOWE_FILL = globals().setdefault("NOWE_FILL", [])
    NOWE_FILL.append(("Poswiata sali (Przytulna)", fx, fy, "", 0, 2, 0, 0, True, "<Light:280,20,14,5><LightWhen:night><LightSoft>"))
# (nazwa, x, y, arkusz, indeks, kierunek, wzór, priorytet, through, notatka)
NOWE = []
SW = "<Light:110,120,80,30><LightWhen:night>"
# świece na długich stołach sali (stoły: kolumny 40, 44, 56, 60; kratki 33-34 to blat) - jedna w środku każdego stołu
for x in (40, 44, 56, 60):
    NOWE.append(("Świeca na stole", x, 34, "!Decoration2", 1, 6, 0, 0, True, SW + "<Px:0,-6>"))
# butelki na stołach dolnych (stoliki 39/42/45 i lustro 53/56/59, kratki 38-39)
for x in (42, 58):
    NOWE.append(("Butelki na stole", x, 38, "!Tavern_Props", 0, 6, 0, 0, True, "<Px:0,22>"))
# półki z butelkami na ścianie za ladą (obok drzwi na zaplecze)
NOWE.append(("Półka z butelkami", 45, 26, "!Tavern_Props", 3, 6, 1, 0, True, ""))
NOWE.append(("Półka z butelkami", 55, 26, "!Tavern_Props", 3, 6, 1, 0, True, ""))
# latarnie wiszące na filarach hali (nad bohaterem)
for x, y in ((48, 34), (52, 34), (48, 41), (52, 41)):
    NOWE.append(("Latarnia filarowa", x, y, "!Decoration", 7, 2, 0, 2, True, "<Light:150,90,62,24><LightWhen:night>"))
# grajek na scenie: zdarzenie bez obrazu (rysuje je Przytulna.js, wieczorem), stoi na scenie i blokuje kratkę
BARD = ("Grajek na scenie (Przytulna)", 70, 29)


# goście z miejsc „gosc_N” siedzą na stołkach (zdarzenie: nowe kratki; id i tagi bez zmian); reszta stołków zajęta wieczorem
# przez „gości stołowych” (zdarzenia bez obrazu, rysuje je Przytulna.js z arkuszy Przytulna_Siedzi_*)
PRZENIES = {53: (43, 33), 54: (45, 33), 55: (39, 35), 62: (61, 35)}
STOLKI_FIG = [(39, 33), (41, 33), (41, 34), (43, 34), (45, 34), (55, 33), (55, 34), (57, 34), (59, 33), (59, 34), (61, 34), (38, 38), (40, 38), (44, 38), (46, 38), (66, 34), (68, 34), (66, 38), (80, 34), (82, 34), (82, 38)]
KLUCZE_FIG = ["Pula_M", "Pula_K", "Pula_S", "Pula_Z", "Pula_M2", "Pula_K2", "Pula_S2", "Pula_Z2", "Pula_M3", "Pula_K3"]


# dwa stoliki (krzesło - stół - krzesło) po bokach lady, symetrycznie: kafle warstwy 2 jak w sali ze sceną (387/386 krzesła, 842/850 stół)
STAMPY = [(38, 30, (842, 850)), (60, 30, (863, 871))]
FIG_STAMPY = [(38, 31), (62, 31)]


def stempel(m, x0, y0, stol):
    W, H = m["width"], m["height"]
    kafle = {(0, 0): 387, (1, 0): stol[0], (2, 0): 386, (0, 1): 395, (1, 1): stol[1], (2, 1): 394}
    komorki = []
    for (dx, dy), t in kafle.items():
        i = (2 * H + y0 + dy) * W + x0 + dx
        assert m["data"][i] == 0, "kratka stempla zajęta"
        m["data"][i] = t; komorki.append((x0 + dx, y0 + dy))
    return komorki


def zbuduj(map_):
    m = copy.deepcopy(map_)
    ev = m["events"]
    for e in ev:
        if e and e["id"] in (40, 41):
            im = e["pages"][0]["image"]
            im["characterName"] = "!$Przytulna_Kruk"; im["characterIndex"] = 0; im["pattern"] = 0; im["direction"] = 2
    wolne = max(i for i, e in enumerate(ev) if e) + 1
    nid = 361
    while nid < len(ev) and ev[nid]:
        nid += 1
    ids = []
    for (nazwa, x, y, ch, idx, d, pat, prio, thr, note) in NOWE:
        while nid < len(ev) and ev[nid]:
            nid += 1
        while len(ev) <= nid:
            ev.append(None)
        ev[nid] = zdarzenie(nid, nazwa, x, y, ch, idx, d, pat, prio, thr, note); ids.append(nid); nid += 1
    for (nazwa, x, y, ch, idx, d, pat, prio, thr, note) in NOWE_FILL:
        while nid < len(ev) and ev[nid]: nid += 1
        while len(ev) <= nid: ev.append(None)
        ev[nid] = zdarzenie(nid, nazwa, x, y, ch, idx, d, pat, prio, thr, note); ids.append(nid); nid += 1
    # grajek: stałe id 360, jeśli wolne (Przytulna.js: BARD_ID); inaczej bierze następne wolne i trzeba poprawić wtyczkę
    while len(ev) <= 360:
        ev.append(None)
    assert ev[360] is None, "id 360 zajęte"
    bz = zdarzenie(360, BARD[0], BARD[1], BARD[2], "", 0, 2, 0, 1, False, "")
    bz["pages"][0]["image"] = {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0}
    ev[360] = bz
    for i, e in enumerate(ev):
        if e and e["id"] in PRZENIES:
            e["x"], e["y"] = PRZENIES[e["id"]]
    for (sx, sy, st) in STAMPY: stempel(m, sx, sy, st)
    for k, (x, y) in enumerate(STOLKI_FIG + FIG_STAMPY):
        fid = 400 + k
        while len(ev) <= fid: ev.append(None)
        assert ev[fid] is None
        z = zdarzenie(fid, "Gość stołowy (Przytulna)", x, y, "", 0, 2, 0, 1, True, "<Siedzi:%s>" % KLUCZE_FIG[k % len(KLUCZE_FIG)])
        ev[fid] = z; ids.append(fid)
    return m, ids


def zapis(m):
    """format pliku jak z edytora RPG Maker MZ: klucze najwyższego poziomu po wierszu, zdarzenia po wierszu"""
    j = lambda v: json.dumps(v, ensure_ascii=False, separators=(",", ":"))
    out = "{" + "\n"
    for n, (k, v) in enumerate(m.items()):
        if k == "events":
            txt = '"events":[' + "\n" + ("," + "\n").join(j(e) for e in v) + "\n" + "]"
        else:
            txt = j(k) + ":" + j(v)
        if n:
            out += ("," + "\n" if (isinstance(v, list) and v) or (isinstance(prev, list) and prev) else ",")
        out += txt
        prev = v
    return out + "\n" + "}"


def porownaj(a, b):
    """to, co ma zostać identyczne: wymiary, wszystkie kafle, wszystkie stare zdarzenia poza obrazem 40 i 41"""
    bad = []
    for k in ("width", "height", "tilesetId", "note", "autoplayBgm", "bgm", "parallaxName"):
        if a.get(k) != b.get(k): bad.append(k)
    W, H = a["width"], a["height"]
    zn = {(2 * H + y0 + dy) * W + x0 + dx for (x0, y0, _) in STAMPY for dx in range(3) for dy in range(2)}
    if any(u != v for i, (u, v) in enumerate(zip(a["data"], b["data"])) if i not in zn): bad.append("data")
    for i, e in enumerate(a["events"]):
        if not e: continue
        f = b["events"][i]
        if f is None: bad.append("brak %d" % i); continue
        if e == f: continue
        if e["id"] in (40, 41):
            g = copy.deepcopy(f); g["pages"][0]["image"] = e["pages"][0]["image"]
            if g == e: continue
        if e["id"] in PRZENIES:
            g = copy.deepcopy(f); g["x"], g["y"] = e["x"], e["y"]
            if g == e: continue
        bad.append("zmienione %d" % i)
    return bad


def main():
    raw, m = wczytaj(SRC)
    nowa, ids = zbuduj(m)
    zle = porownaj(m, nowa)
    os.makedirs(OUT, exist_ok=True); os.makedirs(OVL, exist_ok=True)
    assert zapis(m).encode("utf-8") == raw, "format zapisu nie odtwarza oryginału bajt w bajt"
    txt = zapis(nowa)
    for p in (os.path.join(OUT, "Map001.json"), os.path.join(OVL, "Map001.json")):
        open(p, "wb").write(txt.encode("utf-8"))
    json.dump({"sha256": hashlib.sha256(raw).hexdigest(), "nowe_id": ids + [360]}, open(os.path.join(OUT, "baza.json"), "w"), indent=1)
    print("zapisano staging/Map001.json; nowe zdarzenia:", ids + [360], "; niezgodności ze starą mapą:", zle or "brak")
    return 1 if zle else 0


if __name__ == "__main__":
    sys.exit(main())
