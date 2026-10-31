# -*- coding: utf-8 -*-
"""Palisada Osady Milczących (Map120) z jedną bramą + stara brama na Map013 traci rolę (2026-10-31).
Po przebudowie świata (docs/mapy/SWIAT.md) Osada leży na wschód od Gór, a brama na Map013 prowadzi w skałę. Tu:
  - Map120: palisada z pali wokół wioski (zachód x 3, wschód x 36, południe y 29; od północy zamyka ją skalna ściana), jedna brama
    z pali na drodze od południa (środek 20,29): zamknięta, dopóki przełącznik 16 (Osada_Milczacych) jest wyłączony - ten sam
    obrazek, popup i strony co dawna brama z Map013; znacznik „Miejsce: osada_brama" przed bramą (20,30)
  - Map013: brama (6,3) zostaje, jak była narysowana, ale to stara, zawalona brama bez roli (jedna strona, nowy popup);
    znacznik osada_brama stąd znika (przenosi się na Map120)
  - js/plugins/TownQuests_Data.js: spot w8_gate na mapie 120 (marker osada_brama +1)
  - js/teksty/w8.txt: dwa zdania o „bramie w wąwozie"
Palisada to zdarzenia z obrazkami garnizonu (tools/garnizon/art/palisada.py: !Garnizon_Palisada czołowa 3 kratki, _Bok boczna 2 kratki)
z <Occupy>; kratki palisady dostają region 2 (RegionLayers: na równi, zawsze blokuje); brama region zostawia.
Czyta TYLKO data/ i js/ (zainstalowane), pisze do tools/osada/staging/ (nakładka: data/, js/, docs/).
  python tools/osada/brama.py"""
import os, sys, json, copy, shutil, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
STG = HERE + "/staging/"
sys.path.insert(0, ROOT + "tools/mapy")
import popraw
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

# ----- układ (kratki Map120)
X0, X1, Y1 = 3, 36, 29          # zachodnia i wschodnia ściana palisady, południowa ściana (od północy skała x 4-35, y 4-7)
Y_TOP = 8                       # pierwszy rząd wnętrza pod skalną ścianą
GATE_X = 20                     # środek bramy (kratki 19-21), na drodze od południa
FRONT_LEFT = [5, 8, 11, 14, 17]          # południe, odcinki 3-kratkowe od x 4 do bramy (ostatni ze słupem bramy)
FRONT_RIGHT = [23, 26, 29, 32, 35]       # od x 22 do x 36 (pierwszy ze słupem bramy)
SIDE_W = list(range(9, 30, 2))           # zachód: dolne kratki odcinków 2-kratkowych: pokrywają rzędy 8..29
SIDE_E = list(range(8, 29, 2))           # wschód: pokrywają 7..28 (kratka 36,29 należy do ostatniego odcinka południa)
MARKER = (GATE_X, Y1 + 1)       # osada_brama: przed bramą, twarzą do niej (Grum o kratkę dalej: dx 1)
DECOR = ("Sosna", "Małe drzewo", "Płaski kamień", "Stos płaskich kamieni", "Pęknięty kamień", "Skała", "Kamień z kreskami", "Mszysty", "Omszały",
         "Wysoka skała", "Skalna iglica", "Sterta kamieni", "Kamienny kopiec", "Wysoki pieniek")

BLANK = {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1,
         "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0}
FRONT = [(2, 0), (2, 1), (2, 2), (4, 0), (4, 1), (4, 2), (6, 0), (6, 1), (6, 2), (8, 0), (8, 1), (8, 2)]     # (kierunek, wzór) komórek 0-11
SIDE = [(2, 0), (2, 1), (2, 2), (4, 0), (4, 1), (4, 2), (6, 0), (6, 1)]
GATE_POST_L, GATE_POST_R = 10, 11        # słupy bramy (kierunek 8, wzór 1 i 2) - jak w Garnizonie


def page(image=None, priority=0, through=False, trigger=0, cond=None, cmds=None, direction_fix=True):
    img = {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0}
    if image: img.update(image)
    c = dict(BLANK)
    if cond: c.update(cond)
    return {"conditions": c, "directionFix": direction_fix, "image": img, "list": (cmds or []) + [{"code": 0, "indent": 0, "parameters": []}],
            "moveFrequency": 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": priority, "stepAnime": False, "through": through, "trigger": trigger, "walkAnime": False}


def popup(text):
    return [{"code": 355, "indent": 0, "parameters": ["Tawerna.popup(%s);" % json.dumps(text, ensure_ascii=False)]}]


def load(m):
    return json.loads(open(ROOT + "data/Map%03d.json" % m, "rb").read().decode("utf-8"))


def put(j, e):
    ev = j["events"]
    while len(ev) <= e["id"]: ev.append(None)
    ev[e["id"]] = e


def region(j, x, y, v):
    W, H = j["width"], j["height"]
    j["data"][(5 * H + y) * W + x] = v


def build120():
    j = load(120)
    W, H = j["width"], j["height"]
    ev = [e for e in j["events"] if e]
    nid = max(e["id"] for e in ev) + 1
    ring = set()
    for y in range(Y_TOP - 1, Y1 + 1): ring |= {(X0, y), (X1, y)}
    ring |= {(x, Y1) for x in range(X0, X1 + 1)}
    gate = {(GATE_X - 1, Y1), (GATE_X, Y1), (GATE_X + 1, Y1)}
    ring -= gate
    # ---- trees and stones that would stand in the palisade (or in its south strip) go away
    zdjete = []
    for e in ev:
        n, x, y = e["name"], e["x"], e["y"]
        if not n.startswith(DECOR): continue
        if (x, y) in ring or (x, y) in gate or (X0 <= x <= X1 and Y1 - 2 <= y <= Y1) or (x in (X0, X1) and Y_TOP - 1 <= y <= Y1):
            zdjete.append((e["id"], n, x, y)); j["events"][e["id"]] = None
    # ---- the palisade
    def event(name, x, y, sheet, cell, note):
        nonlocal nid
        d, p = cell
        e = {"id": nid, "name": name, "note": note, "pages": [page({"characterName": sheet, "characterIndex": 0, "direction": d, "pattern": p}, priority=1)], "x": x, "y": y}
        nid += 1; put(j, e)
    n = 0
    for cx in FRONT_LEFT:
        event("Palisada Milczących", cx, Y1, "!Garnizon_Palisada", FRONT[GATE_POST_L if cx == FRONT_LEFT[-1] else n % 10], "<Occupy:left=1,right=1>"); n += 1
    for i, cx in enumerate(FRONT_RIGHT):
        event("Palisada Milczących", cx, Y1, "!Garnizon_Palisada", FRONT[GATE_POST_R if i == 0 else n % 10], "<Occupy:left=1,right=1>"); n += 1
    for k, yb in enumerate(SIDE_W): event("Palisada Milczących", X0, yb, "!Garnizon_Palisada_Bok", SIDE[k % 8], "<Occupy:up=1>")
    for k, yb in enumerate(SIDE_E): event("Palisada Milczących", X1, yb, "!Garnizon_Palisada_Bok", SIDE[(k + 3) % 8], "<Occupy:up=1>")
    for (x, y) in ring: region(j, x, y, 2)
    # ---- the gate of the Silent (the same as the old one on Map013: closed + popup until switch 16, then open)
    sw16 = {"switch1Valid": True, "switch1Id": 16}
    closed = {"characterName": "!$Mt_Gate", "direction": 2, "pattern": 0}
    opened = {"characterName": "!$Mt_Gate", "direction": 4, "pattern": 0}
    g = {"id": nid, "name": "Brama Milczących", "note": "<Occupy:left=1,right=1>", "pages": [
        page(closed, priority=1, cmds=popup("Brama z pali, zamknięta od środka. Ani głosu po drugiej stronie.")),
        page(opened, priority=0, through=True, cond=sw16)], "x": GATE_X, "y": Y1}
    nid += 1; put(j, g)
    # ---- the place before the gate (W8 ch5: Grum waits there)
    mark = copy.deepcopy([e for e in ev if e["name"] == "Miejsce: osada_wejscie"][0])
    mark.update({"id": nid, "name": "Miejsce: osada_brama", "x": MARKER[0], "y": MARKER[1]}); mark["pages"][0]["image"]["direction"] = 8
    nid += 1; put(j, mark)
    return j, zdjete


def build13():
    j = load(13)
    g = [e for e in j["events"] if e and e["name"] == "Brama Milczących"][0]
    assert len(g["pages"]) == 2
    g["pages"] = g["pages"][:1]          # no open page: it is an old collapsed gate, no part in anything
    g["pages"][0]["list"] = popup("Stara brama, zawalona belkami. Za nią lita skała. Milczący przenieśli wejście.") + [{"code": 0, "indent": 0, "parameters": []}]
    m = [e for e in j["events"] if e and e["name"] == "Miejsce: osada_brama"]
    assert len(m) == 1
    j["events"][m[0]["id"]] = None
    return j


PLIKI = ["data/Map120.json", "data/Map013.json", "js/plugins/TownQuests_Data.js", "js/teksty/w8.txt", "docs/miasta_miejsca_zadan.md"]


def sub(path, old, new):
    b = open(ROOT + path, "rb").read()
    assert b.count(old.encode("utf-8")) == 1, (path, old)
    return b.replace(old.encode("utf-8"), new.encode("utf-8"))


def main():
    shutil.rmtree(STG, ignore_errors=True)
    for d in ("data", "js/plugins", "js/teksty", "docs"): os.makedirs(STG + d, exist_ok=True)
    j120, zdjete = build120()
    open(STG + "data/Map120.json", "wb").write(popraw.tekst_mapy(j120))
    open(STG + "data/Map013.json", "wb").write(popraw.tekst_mapy(build13()))
    open(STG + "js/plugins/TownQuests_Data.js", "wb").write(sub(
        "js/plugins/TownQuests_Data.js",
        'w8_gate: { map: 13, id: 953, marker: "osada_brama", dx: 1, x: 7, y: 4,',
        'w8_gate: { map: 120, id: 953, marker: "osada_brama", dx: 1, x: %d, y: %d,' % (MARKER[0] + 1, MARKER[1])))
    t = sub("js/teksty/w8.txt", "za bramą w wąwozie, w górach (Akt II", "za bramą w palisadzie, w dolinie na wschód od Gór (Akt II")
    b = t.decode("utf-8").replace("Za bramą w wąwozie mieszkają Milczący", "Za bramą w palisadzie, w dolinie na wschód od Gór, mieszkają Milczący")
    assert "w wąwozie" not in b.split("[zadania.W8.lines.noteOsada]")[1].split("\n\n")[0]
    open(STG + "js/teksty/w8.txt", "wb").write(b.encode("utf-8"))
    d = sub("docs/miasta_miejsca_zadan.md", "| `osada_brama` | 13 | 6 | 4 | 8 | przed Bramą Milczących |",
            "| `osada_brama` | 120 | %d | %d | 8 | przed Bramą Milczących w palisadzie Osady (przeniesiona z Map013, 2026-10-31) |" % MARKER)
    open(STG + "docs/miasta_miejsca_zadan.md", "wb").write(d)
    sumy = {}
    for rel in PLIKI:
        sumy[rel] = hashlib.sha256(open(ROOT + rel, "rb").read()).hexdigest()          # skróty zainstalowanych plików, z których zbudowano kopię
    json.dump(sumy, open(STG + "sumy.json", "w"), indent=1)
    print("zdjęte zdarzenia (drzewa, kamienie w palisadzie):", zdjete)
    print("staging:", STG)


if __name__ == "__main__":
    main()
