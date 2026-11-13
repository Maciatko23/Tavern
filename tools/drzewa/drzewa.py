# -*- coding: utf-8 -*-
"""Każde drzewo do ścinania, w trzech wielkościach (gracz 2026-11-07: „niech każde drzewo w grze da się ściąć i niech będą różnorodne,
małe, średnie i duże”). Po każdym budowaniu / powiększaniu map uruchomić znowu: daje zawsze to samo (wielkość z miejsca na mapie).
  - sosny (Pine_A/B/C), małe drzewka (Tree_Small), duże drzewa z !$Big_Trees_green (wysoka sosna, liściaste - klatki drzew; nie drzewa
    ze skał ani korony krzaków) i owocowe: zdarzenie drzewa do ścinania - 3 strony jak w ChoppableTree (drzewo / pniak / puste),
    notatka <Tree:...>; duże drzewa na arkuszu !$Big_Trees_scinane (bez namalowanego cienia: tools/drzewa/arkusz.py)
  - ZOSTAJĄ jak są: drzewa z <Zapora:...> (ściana na brzegu mapy - ścięte otworzyłyby drogę poza mapę), martwe pnie (już <Log>)
  - wielkość: małe ~25% / średnie ~35% / duże ~40%, stała dla miejsca (hash mapy i pola); uderzenia i drewno jak u dużego (liczby
    gracza z 2026-09-24/26), razy wielkość; szyszki zrzuca tylko duża sosna (ChoppableTree: skala >= 0.9)
  python tools/drzewa/drzewa.py                  (kopie zmienionych map do tools/drzewa/staging/data, raport; nic w grze)
  python tools/drzewa/drzewa.py [--mapy 3,4,8] --wykonaj   (zapis do data/ - TYLKO przy zamkniętym edytorze; kopie: tools/drzewa/kopie_zapasowe)"""
import collections, copy, datetime, glob, json, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DATA = os.path.join(ROOT, "data")
STG = os.path.join(HERE, "staging", "data")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

# full size (large): hits, wood min, wood max, sway - the user's numbers (memory: blow counts 2026-09-24, wood 2026-09-26)
KINDS = {
    "!$Pine_A": (20, 6, 8, 0.8), "!$Pine_B": (16, 4, 6, 0.9), "!$Pine_C": (12, 3, 4, 0.9), "!$Tree_Small": (10, 2, 3, 0.8),
    "big": (20, 6, 8, 0.6),
}
SIZES = {"tree": (0.6, 0.8, 1.0), "big": (0.7, 0.85, 1.0), "fruit": (0.5, 0.6, 0.7)}
SHARE = (0.25, 0.60)   # (below the first: small, below the second: medium, else large)
BIG_OLD, BIG_NEW = "!$Big_Trees_green", "!$Big_Trees_scinane"
# the big sheet's tree frames: (direction, pattern) - row 0..3 = direction 2/4/6/8, column = pattern (tools/drzewa/arkusz.py TREES)
BIG_TREES = {(2, 2), (4, 1), (4, 2), (6, 1), (6, 2), (8, 0), (8, 1), (8, 2)}


def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def map_text(m):   # (the editor's own layout: tools/apply_laki.py)
    props = {k: v for k, v in m.items() if k not in ("data", "events")}
    lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(m["data"]) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(m["events"]) - 1 else "") for i, e in enumerate(m["events"])]
    lines += ["]", "}"]
    return "\n".join(lines)


def size_of(map_id, x, y):
    h = 2166136261
    for ch in "%d:%d:%d" % (map_id, x, y):
        h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    u = (h >> 8) / float(1 << 24)
    return 0 if u < SHARE[0] else 1 if u < SHARE[1] else 2


def fmt(v):
    return ("%.2f" % v).rstrip("0").rstrip(".")


# the pages of a tree to chop: taken from a real one (its commands - the plugin's own - exactly as the editor wrote them)
TEMPLATE = None
for p in sorted(glob.glob(os.path.join(DATA, "Map[0-9]*.json"))):
    for e in json.loads(open(p, "rb").read().decode("utf-8"))["events"]:
        if e and "<Tree" in (e.get("note") or "") and len(e["pages"]) == 3 and e["pages"][0]["image"]["characterName"] == "!$Pine_A":
            TEMPLATE = e
            break
    if TEMPLATE: break
if not TEMPLATE: raise SystemExit("nie ma wzoru drzewa do ścinania")


def make_choppable(e):
    """a one-page decorative tree -> the three pages of a tree to chop (its own picture kept on the first)"""
    p0 = copy.deepcopy(e["pages"][0])
    t0 = TEMPLATE["pages"][0]
    for k in ("list", "trigger", "priorityType", "directionFix", "walkAnime", "stepAnime", "through", "moveType", "moveFrequency", "moveSpeed"):
        p0[k] = copy.deepcopy(t0[k])
    e["pages"] = [p0, copy.deepcopy(TEMPLATE["pages"][1]), copy.deepcopy(TEMPLATE["pages"][2])]


def tree_tag(kind, k, scale):
    hits, dmin, dmax, sway = KINDS[kind]
    h = max(3, int(round(hits * k)))
    a = max(1, int(round(dmin * k)))
    b = max(a, int(round(dmax * k)))
    return "<Tree:hits=%d,sway=%s,%sdropmin=%d,dropmax=%d>" % (h, fmt(sway), "" if scale >= 0.999 else "scale=%s," % fmt(scale), a, b)


def set_tag(note, tag):
    return re.sub(r"<Tree(:[^>]*)?>", tag, note, count=1) if re.search(r"<Tree(:[^>]*)?>", note) else (tag + ("\n" + note if note else ""))


report = collections.Counter()
changed_maps = []
for path in sorted(glob.glob(os.path.join(DATA, "Map[0-9]*.json"))):
    raw = open(path, "rb").read()
    m = json.loads(raw.decode("utf-8"))
    map_id = int(re.search(r"Map(\d+)", path).group(1))
    if map_text(m).encode("utf-8") != raw:
        if any(e and re.search(r"Pine|Tree_|Big_Trees", e["pages"][0]["image"]["characterName"]) for e in m["events"]):
            report["mapa nie w układzie edytora (pominięta)"] += 1
            print("  pominięta (nie w układzie edytora):", os.path.basename(path))
        continue
    touched = False
    for e in m["events"]:
        if not e: continue
        note = e.get("note") or ""
        img = e["pages"][0]["image"]
        name = img["characterName"]
        if "<Zapora" in note:
            if re.search(r"Pine|Tree_|Big_Trees", name): report["zapora (zostaje)"] += 1
            continue
        size = size_of(map_id, e["x"], e["y"])
        fixed = re.search(r"<TreeSize:([012])>", note)   # (a size the map asks for: mirrored garden trees must match - tools/miasto5)
        if fixed: size = int(fixed.group(1))
        before = dump(e)
        if name in ("!$Tree_Apple", "!$Tree_Pear"):
            if "<Tree" not in note: continue
            scale = SIZES["fruit"][size]
            e["note"] = re.sub(r"scale=[0-9.]+", "scale=" + fmt(scale), note) if "scale=" in note else note.replace("<Tree:", "<Tree:scale=" + fmt(scale) + ",", 1)
            kind = "owocowe"
        elif name in KINDS:
            scale = SIZES["tree"][size]
            if len(e["pages"]) == 1: make_choppable(e); report["nowe do ścinania: " + name] += 1
            e["note"] = set_tag(note, tree_tag(name, scale, scale))
            kind = name
        elif name in (BIG_OLD, BIG_NEW) and (img["direction"], img["pattern"]) in BIG_TREES:
            scale = SIZES["big"][size]
            if len(e["pages"]) == 1: make_choppable(e); report["nowe do ścinania: duże drzewa"] += 1
            e["pages"][0]["image"]["characterName"] = BIG_NEW
            e["note"] = set_tag(note, tree_tag("big", scale, scale))
            kind = "duże"
        else:
            continue
        report["%s: %s" % (kind, ("małe", "średnie", "duże")[size])] += 1
        if dump(e) != before: touched = True
    if touched:
        changed_maps.append((path, raw, map_text(m).encode("utf-8")))

if "--mapy" in sys.argv:          # (only these maps, e.g. --mapy 3,4,8,24,111 after one area's rebuild)
    only = {int(v) for v in sys.argv[sys.argv.index("--mapy") + 1].split(",")}
    changed_maps = [c for c in changed_maps if int(re.search(r"Map(\d+)", c[0]).group(1)) in only]
print("map do zmiany: %d" % len(changed_maps))
for k, v in sorted(report.items()): print("  %-40s %d" % (k, v))
if "--wykonaj" in sys.argv:
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(kop, exist_ok=True)
    for path, raw, new in changed_maps:
        open(os.path.join(kop, os.path.basename(path)), "wb").write(raw)
        open(path, "wb").write(new)
    print("zapisane do data/; kopie:", kop)
    # (2026-11-11) a new project version, as the editor gives on each save: a save made on a changed map then reloads that map when
    # loaded (Scene_Load.reloadMapIfUpdated) - without it the save kept the old places of the trees and things over the new ground
    # (the player could not pick up a cone: something of the old layout stood on its tile). Every map install ends with this script.
    sp = os.path.join(ROOT, "data", "System.json")
    sraw = open(sp, "rb").read()
    mv = re.search(rb'"versionId":(\d+)', sraw)
    if mv:
        import random
        ver = random.randint(10000000, 99999999)
        while ver == int(mv.group(1)): ver = random.randint(10000000, 99999999)
        sout = sraw[:mv.start(1)] + str(ver).encode() + sraw[mv.end(1):]
        json.loads(sout.decode("utf-8"))
        open(sp, "wb").write(sout)
        print("nowa wersja projektu (System.json versionId): %s -> %d" % (mv.group(1).decode(), ver))
else:
    shutil.rmtree(STG, ignore_errors=True)
    os.makedirs(STG, exist_ok=True)
    for path, raw, new in changed_maps:
        open(os.path.join(STG, os.path.basename(path)), "wb").write(new)
    print("kopie w", STG)
