# -*- coding: utf-8 -*-
"""USUWANIE STARYCH MAP (tools/mapy/usun_stare.py) - stary świat z folderu 223 „STARY ŚWIAT (archiwum)”.

Decyzje czyta z tools/mapy/stare_mapy.json (opis i dowody: docs/NOWY_SWIAT/STARE_MAPY.md). Usuwa TYLKO mapy z werdyktem USUN;
ZOSTAW i PRZENIES zostają (ZOSTAW z polem „rodzic” dostaje nowe miejsce w drzewku edytora). Folder 223 znika, gdy nic w nim
nie zostanie.

  python tools/mapy/usun_stare.py                  próba (to samo co --proba): wypisuje, co by zrobił; nic nie zmienia
  python tools/mapy/usun_stare.py --wykonaj        usuwa (TYLKO przy zamkniętym edytorze RPGMZ.exe)
  python tools/mapy/usun_stare.py --cofnij <folder kopii>   przywraca usunięte mapy i MapInfos.json z kopii (edytor zamknięty)
  dodatkowo: --mimo-testow  (pozwala usunąć mapę, na której stoi test szybkiego zestawu albo zapis testowy z tests/fixtures)

Przy --wykonaj:
  1. sprawdza wszystko jeszcze raz na żywych plikach (zatrzymuje się i nic nie zmienia, gdy coś się nie zgadza):
     - mapa do usunięcia leży w folderze 223, ma wpis w MapInfos.json i nie jest mapą startową (System.json startMapId),
     - żadne przejście (zdarzenie „Przenieś gracza”, kod 201) z mapy, która zostaje, nie prowadzi na mapę do usunięcia,
     - żadna włączona wtyczka nie przenosi na nią wprost (reserveTransfer(N, ...) / polecenie 201 z numerem) ani przez znany
       przypadek z listy ZNANE poniżej,
     - na mapie nie stoi zapis gracza (save/file*.rmmzsave) - taki zapis by się nie wczytał,
     - test szybkiego zestawu (tests/run.js SMOKE) ani zapis testowy (tests/fixtures) jej nie używa (chyba że --mimo-testow);
  2. kopiuje każdy dotknięty plik (data/MapNNN.json usuwanych map, data/MapInfos.json, data/System.json) do
     ..\\Tawerna_archiwum_2026-11-08\\stare_mapy_<czas>\\ i sprawdza kopie (sha1) + zapisuje tam spis.json;
  3. zapisuje nowe data/MapInfos.json w układzie edytora (wpis usuniętej mapy = null, numer = miejsce w tablicy; mapy, które
     zostają, a stały pod usuniętą - pod nowym rodzicem); tekst jest najpierw zbudowany, wczytany z powrotem i porównany
     wiersz po wierszu ze starym (różnią się tylko zmienione wpisy) - pliku, którego nie sprawdzono, nie zapisuje;
  4. usuwa pliki data/MapNNN.json map z werdyktem USUN;
  5. daje nową wersję projektu (System.json versionId, jak tools/drzewa/drzewa.py) - zapisy wczytają mapy na nowo.
Po --wykonaj: otworzyć projekt w edytorze na nowo (Plik - Otwórz), żeby nie zapisał starego drzewka map.
"""
import datetime, glob, hashlib, importlib.util, json, os, re, shutil, sys, zlib

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DATA = os.path.join(ROOT, "data")
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
DECYZJE = os.path.join(HERE, "stare_mapy.json")
try: sys.stdout.reconfigure(encoding="utf-8"); sys.stderr.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

# the transfers no data file shows: a plugin moving the hero to a map through a constant (found by hand, 2026-11-17,
# docs/NOWY_SWIAT/STARE_MAPY.md "Ryzyka"); a map listed here must not be removed until the line is changed
ZNANE = {
    # (19: Debug.js F9 „kot” - since 2026-11-17 HomeLife.MAP = 224 and the row checks the map first: off the list)
    100: "js/plugins/Farming_Build.js:838 - wejście do własnej chaty gracza przenosi na HUT_MAP (Farming.js:720 = 100)",
    160: "js/plugins/Latarnia.js:466 - drzwi latarni na Map219 przenoszą do izby latarnika (Latarnia_Data.js:38 IZBA = 160)",
    161: "js/plugins/Latarnia.js:461 - schody latarni prowadzą do laterny (Latarnia_Data.js:38 LATERNA = 161)",
}
# the names of a map constant in the plugins (const HUT_MAP = 100, URWISKO = 157, ...) - for the notes on what still names a map
CONST_WORDS = re.compile(r"MAP|IZBA|LATERNA|ARCHIVE|CAVE|HOUSE|HUT|FIELD|TOWN|ROAD|HARBOUR|WRECK|QUARTERS|URW|ZAGRODA|ELDER|INNER|GORY|JAR|"
                         r"MANOR|YARD|PODG|KOMORA|GARRISON|HERMITAGE")
VERDICTS = {"USUN": "USUN", "USUŃ": "USUN", "ZOSTAW": "ZOSTAW", "PRZENIES": "PRZENIES", "PRZENIEŚ": "PRZENIES"}


def stop(msg): raise SystemExit("STOP: " + msg + "\nNic nie zmieniono.")
def sha1(b): return hashlib.sha1(b).hexdigest()
def map_path(i): return os.path.join(DATA, "Map%03d.json" % i)
def kb(i): return os.path.getsize(map_path(i)) // 1024 if os.path.exists(map_path(i)) else 0


# ------------------------------------------------------------------ what the project holds now
def load_decisions():
    if not os.path.exists(DECYZJE): stop("brak " + DECYZJE)
    d = json.load(open(DECYZJE, encoding="utf-8"))
    out = {}
    for e in d.get("mapy", []):
        w = VERDICTS.get(str(e.get("werdykt", "")).strip().upper())
        if not w: stop("mapa %s: nieznany werdykt %r (USUN / ZOSTAW / PRZENIES)" % (e.get("id"), e.get("werdykt")))
        if int(e["id"]) in out: stop("mapa %s jest w stare_mapy.json dwa razy" % e["id"])
        out[int(e["id"])] = {"werdykt": w, "rodzic": e.get("rodzic"), "nazwa": e.get("nazwa", "")}
    return int(d.get("folder", 223)), out


def subtree(infos, root):
    kids = {}
    for e in infos:
        if e: kids.setdefault(e["parentId"], []).append(e["id"])
    out, st = [], list(kids.get(root, []))
    while st:
        i = st.pop()
        out.append(i)
        st.extend(kids.get(i, []))
    return set(out)


def event_transfers():
    """{map id: {target map id: [where]}} - the "Transfer Player" commands (code 201, direct) of every map file, the common
    events and the troops"""
    out = {}
    def walk(src, where, lst):
        for c in lst or []:
            if c.get("code") == 201 and c["parameters"][0] == 0:
                out.setdefault(src, {}).setdefault(int(c["parameters"][1]), []).append(where)
    for p in sorted(glob.glob(os.path.join(DATA, "Map[0-9][0-9][0-9].json"))):
        mid = int(os.path.basename(p)[3:6])
        m = json.loads(open(p, "rb").read().decode("utf-8"))
        for ev in m.get("events") or []:
            if not ev: continue
            for k, pg in enumerate(ev.get("pages") or []):
                walk(mid, "Map%03d zdarzenie %d „%s” (%d,%d) strona %d" % (mid, ev["id"], ev.get("name", ""), ev["x"], ev["y"], k + 1), pg.get("list"))
    for c in json.loads(open(os.path.join(DATA, "CommonEvents.json"), "rb").read().decode("utf-8")):
        if c: walk("wspólne", "wspólne zdarzenie %d" % c["id"], c.get("list"))
    for t in json.loads(open(os.path.join(DATA, "Troops.json"), "rb").read().decode("utf-8")):
        if t:
            for pg in t.get("pages") or []: walk("oddziały", "oddział %d" % t["id"], pg.get("list"))
    # the world's seams (Krawedzie.js walks over a map's edge where SwiatData.links says so - no event on the map)
    for f in ("Swiat_Data.js", "Swiat_Data_Nowy.js"):
        p = os.path.join(ROOT, "js", "plugins", f)
        if not os.path.exists(p): continue
        for a, side, b in re.findall(r'\{"a":\s*(\d+),\s*"side":\s*"(\w)",[^}]*?"b":\s*(\d+)\}', open(p, "rb").read().decode("utf-8")):
            out.setdefault(int(a), {}).setdefault(int(b), [])
            w = "Map%03d szew świata (%s, krawędź %s)" % (int(a), f, side)
            if w not in out[int(a)][int(b)]: out[int(a)][int(b)].append(w)
    return out


def enabled_plugins():
    src = open(os.path.join(ROOT, "js", "tawerna_wtyczki.js"), "rb").read().decode("utf-8")
    names = [n for n, s in re.findall(r'\{"name":"([^"]+)","status":(true|false)', src) if s == "true"]
    if len(names) < 50: stop("js/tawerna_wtyczki.js: nie umiem odczytać listy wtyczek (%d)" % len(names))
    return names


def plugin_transfers(ids):
    """literal transfers in the enabled plugins: reserveTransfer(N, ...), C(201, [0, N, ...]), {code: 201, ... [0, N, ...]}"""
    rx = [re.compile(r"reserveTransfer\(\s*(\d+)\s*,"), re.compile(r"\b201\s*,\s*\[\s*0\s*,\s*(\d+)\s*,"),
          re.compile(r"(?:code|polecenie)\s*:\s*201\b[^\n]{0,80}?\[\s*0\s*,\s*(\d+)\s*,")]
    hits = {}
    for name in enabled_plugins():
        p = os.path.join(ROOT, "js", "plugins", name + ".js")
        if not os.path.exists(p): continue
        for ln, line in enumerate(open(p, "rb").read().decode("utf-8").split("\n"), 1):
            if line.lstrip().startswith("//"): continue
            for r in rx:
                for m in r.finditer(line):
                    n = int(m.group(1))
                    if n in ids: hits.setdefault(n, []).append("js/plugins/%s.js:%d" % (name, ln))
    return hits


def plugin_mentions(ids):
    """{map id: ["file:line", ...]} - the enabled plugins' map constants (HUT_MAP = 100), the map tables (MAP = { town: 8 }) and
    the data's "map: N" fields that name these maps (dead data once the map is gone - unless a thread of the new world reads it)"""
    rx_const = re.compile(r"\b([A-Z][A-Z0-9_]*)\s*=\s*(\d{1,3})\b(?!\s*[.\d])")
    rx_table = re.compile(r"\bMAPS?\s*=\s*\{")
    rx_key = re.compile(r"\b[A-Za-z_]\w*\s*:\s*(\d{1,3})\b(?!\s*[.\d])")
    rx_map = re.compile(r"\bmap\s*:\s*(\d{1,3})\b(?!\s*[.\d])")
    hits = {}
    for name in enabled_plugins():
        p = os.path.join(ROOT, "js", "plugins", name + ".js")
        if not os.path.exists(p): continue
        for ln, line in enumerate(open(p, "rb").read().decode("utf-8").split("\n"), 1):
            code = line.split("//")[0]
            if not code.strip() or code.lstrip().startswith("*"): continue
            found = {int(n) for c, n in rx_const.findall(code) if CONST_WORDS.search(c)}
            if rx_table.search(code): found |= {int(n) for n in rx_key.findall(code)}
            found |= {int(n) for n in rx_map.findall(code)}
            for n in found & ids:
                w = "%s.js:%d" % (name, ln)
                if w not in hits.setdefault(n, []): hits[n].append(w)
    return hits


def smoke_names():
    src = open(os.path.join(ROOT, "tests", "run.js"), "rb").read().decode("utf-8")
    m = re.search(r"const SMOKE = \[(.*?)\];", src, re.S)
    return re.findall(r'"([^"]+)"', m.group(1)) if m else []


TEST_RX = [re.compile(p) for p in (r"\.go\(\s*(\d+)\s*,", r"reserveTransfer\(\s*(\d+)\s*,", r"onMap\(\s*(\d+)\s*\)", r"mapId\(\)\s*={2,3}\s*(\d+)",
                                   r"newGame\(\{[^}]*\bmap:\s*(\d+)", r"startMapId:\s*(\d+)")]
def test_maps():
    """{test name: maps it goes to} for tests/*.js and tests/smoke/*.js"""
    out = {}
    for p in sorted(glob.glob(os.path.join(ROOT, "tests", "*.js")) + glob.glob(os.path.join(ROOT, "tests", "smoke", "*.js"))):
        s = open(p, "rb").read().decode("utf-8", "replace")
        rel = os.path.relpath(p, os.path.join(ROOT, "tests")).replace("\\", "/")[:-3]
        ids = set()
        for r in TEST_RX: ids |= {int(m.group(1)) for m in r.finditer(s)}
        out[rel] = ids
    return out


def fixture_maps():
    """{fixture: the map its save stands on} (tests/fixtures/*.json: the save's $gameMap)"""
    out = {}
    for p in sorted(glob.glob(os.path.join(ROOT, "tests", "fixtures", "*.json"))):
        s = open(p, "rb").read().decode("utf-8", "replace")
        m = re.search(r'"_mapId":\s*([1-9]\d*)\s*,\s*"_tilesetId"', s)
        if m: out[os.path.basename(p)] = int(m.group(1))
    return out


def save_maps():
    """{save file: its map} for the player's saves (save/file*.rmmzsave: zlib, text written as UTF-8 of a byte string)"""
    out = {}
    for p in sorted(glob.glob(os.path.join(ROOT, "save", "file*.rmmzsave"))):
        try:
            raw = open(p, "rb").read().decode("utf-8").encode("latin-1")
            s = zlib.decompress(raw).decode("utf-8", "replace")
            m = re.search(r'"_mapId":\s*(\d+)\s*,\s*"_tilesetId"', s)
            out[os.path.basename(p)] = int(m.group(1)) if m else None
        except Exception as e:
            out[os.path.basename(p)] = "nie da się odczytać (%s)" % e
    return out


# ------------------------------------------------------------------ the plan
def plan(force_tests):
    infos, lay = RW.read_json("data/MapInfos.json")
    if lay != "db": stop("data/MapInfos.json nie jest w układzie edytora (jeden wpis w wierszu).")
    folder, dec = load_decisions()
    if not (len(infos) > folder and infos[folder]): stop("brak folderu %d w MapInfos.json" % folder)
    old = subtree(infos, folder)
    errors, warns = [], []
    for i in sorted(old - set(dec)):
        warns.append("Map%03d „%s” leży w folderze %d, a nie ma jej w stare_mapy.json - zostaje (ZOSTAW)" % (i, infos[i]["name"], folder))
        dec[i] = {"werdykt": "ZOSTAW", "rodzic": None, "nazwa": infos[i]["name"]}
    for i in sorted(set(dec) - old):
        # (already removed - an earlier run: no entry in MapInfos, no file - nothing to do; 2026-11-17, the second round)
        if dec[i]["werdykt"] == "USUN" and not (len(infos) > i and infos[i]) and not os.path.exists(os.path.join(ROOT, "data", "Map%03d.json" % i)): continue
        if dec[i]["werdykt"] == "USUN": errors.append("Map%03d „%s” nie leży w folderze %d - tego skrypt nie usuwa" % (i, dec[i]["nazwa"], folder))
    gone = sorted(i for i in dec if dec[i]["werdykt"] == "USUN" and i in old)
    for i in gone:
        if not os.path.exists(map_path(i)): warns.append("Map%03d: pliku już nie ma (tylko wpis w MapInfos zostanie wyczyszczony)" % i)
    gone_set = set(gone)

    # the start of a new game
    sysobj, slay = RW.read_json("data/System.json")
    if sysobj.get("startMapId") in gone_set: errors.append("Map%03d to mapa startowa nowej gry (System.json startMapId)" % sysobj["startMapId"])

    # the transfers: what the live world (every map outside the folder, the ZOSTAW maps, the start map, the common events) can reach
    # over the events and the seams must not lead to a removed map; a kept map nobody reaches (PRZENIES in the archive) only warns
    tr = event_transfers()
    roots = [m for m in (e["id"] for e in infos if e) if m not in old or dec.get(m, {}).get("werdykt") == "ZOSTAW"]
    roots += [sysobj.get("startMapId"), "wspólne", "oddziały"]
    live, st = set(), list(roots)
    while st:
        a = st.pop()
        if a in live or a in gone_set: continue
        live.add(a)
        st.extend(tr.get(a, {}).keys())
    for src, to in tr.items():
        if src in gone_set: continue
        for t, where in to.items():
            if t not in gone_set: continue
            if src in live:
                errors.append("Map%03d: prowadzi tu przejście z mapy, do której gracz nowego świata może dojść - %s" % (t, "; ".join(where[:3])))
            else:
                warns.append("Map%03d: prowadzi tu wyjście z mapy, która zostaje do przeniesienia (gracz do niej nie dochodzi) - %s"
                             % (t, "; ".join(where[:2])))
    # the plugins
    for i, where in sorted(plugin_transfers(gone_set).items()):
        errors.append("Map%03d: wtyczka przenosi tu wprost - %s" % (i, ", ".join(where)))
    for i in gone:
        if i in ZNANE: errors.append("Map%03d: %s" % (i, ZNANE[i]))
    mentions = plugin_mentions(gone_set)
    # the player's saves
    for f, m in save_maps().items():
        if isinstance(m, str): warns.append("save/%s: %s" % (f, m))
        elif m in gone_set: errors.append("zapis gracza save/%s stoi na Map%03d - po usunięciu się nie wczyta" % (f, m))
    # the tests
    tm, smoke = test_maps(), smoke_names()
    test_errors = []
    for name in smoke:
        hit = sorted(tm.get(name, set()) & gone_set)
        if hit: test_errors.append("test szybkiego zestawu %s gra na mapie %s" % (name, ", ".join("Map%03d" % i for i in hit)))
    for f, m in fixture_maps().items():
        if m in gone_set: test_errors.append("zapis testowy tests/fixtures/%s stoi na Map%03d (smoke/fixtures)" % (f, m))
    if test_errors:
        if force_tests: warns += [t + " (--mimo-testow)" for t in test_errors]
        else: errors += [t + " - przestaw test albo dopisz --mimo-testow" for t in test_errors]
    per_map = {i: sorted(n for n, ids in tm.items() if i in ids) for i in gone}

    # the new tree: the removed entries null, the kept ones under their new parents
    new = [dict(e) if e else None for e in infos]
    for i in gone: new[i] = None
    def alive(i): return i == 0 or (len(new) > i and new[i] is not None)
    moves = {}
    for i, d in sorted(dec.items()):
        r = d.get("rodzic")
        if d["werdykt"] == "USUN" or r is None: continue
        r = int(r)
        if not alive(r): errors.append("Map%03d: nowy rodzic %d nie istnieje albo jest usuwany" % (i, r)); continue
        if r == i or (r in subtree(infos, i)): errors.append("Map%03d: rodzic %d leży pod nią samą" % (i, r)); continue
        if new[i]["parentId"] != r: moves[i] = (new[i]["parentId"], r, "decyzja w stare_mapy.json")
        new[i]["parentId"] = r
    for e in new:
        if not e or alive(e["parentId"]): continue
        p = e["parentId"]
        while not alive(p): p = infos[p]["parentId"]
        moves[e["id"]] = (e["parentId"], p, "dawny rodzic usunięty - najbliższy zachowany przodek")
        e["parentId"] = p
    folder_gone = not any(e and e["parentId"] == folder for e in new)
    if folder_gone:
        new[folder] = None
        gone_files = gone + [folder]
    else:
        gone_files = list(gone)
    # no loops, every entry reaches the top
    for e in new:
        if not e: continue
        p, n = e["parentId"], 0
        while p:
            if not alive(p) or n > len(new): errors.append("Map%03d: drzewko się nie zamyka (rodzic %s)" % (e["id"], p)); break
            p, n = new[p]["parentId"], n + 1

    # the new texts, checked before anything is written
    old_raw = open(os.path.join(DATA, "MapInfos.json"), "rb").read()
    new_raw = RW.json_text(new, "db")
    if json.loads(new_raw.decode("utf-8")) != new: errors.append("MapInfos.json: nowy tekst nie wczytuje się z powrotem tak samo")
    ol, nl = old_raw.decode("utf-8").split("\n"), new_raw.decode("utf-8").split("\n")
    if len(ol) != len(nl): errors.append("MapInfos.json: inna liczba wierszy (%d -> %d)" % (len(ol), len(nl)))
    else:
        changed_ids = set(gone) | set(moves) | ({folder} if folder_gone else set())
        diff = {k - 1 for k in range(len(ol)) if ol[k] != nl[k]}   # (line k = entry k - 1: line 0 is "[")
        if diff != changed_ids: errors.append("MapInfos.json: zmieniłyby się inne wiersze niż zmienione wpisy (%s)" % sorted(diff ^ changed_ids)[:10])
    sraw = open(os.path.join(DATA, "System.json"), "rb").read()
    mv = re.search(rb'"versionId":(\d+)', sraw)
    if not mv: errors.append("System.json: brak versionId")
    return dict(infos=infos, new=new, new_raw=new_raw, old_raw=old_raw, gone=gone, gone_files=gone_files, moves=moves, folder=folder,
                folder_gone=folder_gone, dec=dec, errors=errors, warns=warns, per_map=per_map, sraw=sraw, mv=mv, smoke=smoke,
                mentions=mentions)


def show(P):
    infos, dec = P["infos"], P["dec"]
    cnt = {}
    for d in dec.values(): cnt[d["werdykt"]] = cnt.get(d["werdykt"], 0) + 1
    print("Decyzje (tools/mapy/stare_mapy.json): USUN %d, ZOSTAW %d, PRZENIES %d" % (cnt.get("USUN", 0), cnt.get("ZOSTAW", 0), cnt.get("PRZENIES", 0)))
    print("\nDo usunięcia: %d map, razem %d KB" % (len(P["gone"]), sum(kb(i) for i in P["gone"])))
    for i in P["gone"]:
        t = P["per_map"].get(i) or []
        print("   %4d  %-46s %6d KB%s" % (i, infos[i]["name"][:46], kb(i), ("   testy: %d (%s)" % (len(t), ", ".join(t[:4]) + (", ..." if len(t) > 4 else ""))) if t else ""))
    print("\nZostają w folderze %d (PRZENIES - najpierw przenieść treść):" % P["folder"])
    for i, d in sorted(dec.items()):
        if d["werdykt"] == "PRZENIES": print("   %4d  %s" % (i, infos[i]["name"]))
    print("\nNowe miejsca w drzewku edytora:")
    for i, (a, b, why) in sorted(P["moves"].items()):
        print("   %4d  %-40s  rodzic %d -> %d  (%s)" % (i, infos[i]["name"][:40], a, b, why))
    if not P["moves"]: print("   (brak)")
    print("\nFolder %d „%s”: %s" % (P["folder"], infos[P["folder"]]["name"], "znika (pusty) - też data/Map%03d.json" % P["folder"] if P["folder_gone"] else "zostaje (są w nim jeszcze mapy)"))
    if P["mv"]: print("System.json versionId: %s -> nowa losowa (zapisy wczytają mapy na nowo)" % P["mv"].group(1).decode())
    if P["mentions"]:
        print("\nWtyczki nadal nazywają te mapy (stałe, tabele map, pola „map:” - martwe dane, gdy wątek nie gra już na starej mapie;")
        print("przejścia sprawdzane są osobno niżej):")
        for i in sorted(P["mentions"]):
            w = P["mentions"][i]
            print("   %4d  %s%s" % (i, ", ".join(w[:6]), " i %d innych" % (len(w) - 6) if len(w) > 6 else ""))
    if P["warns"]:
        print("\nUWAGI:")
        for w in P["warns"]: print("   - " + w)
    zwykle = sorted({t for i in P["gone"] for t in P["per_map"].get(i) or []})
    if zwykle: print("\nTesty, które zajrzą na usunięte mapy (przestaw je na nowy świat albo przenieś do tests/stary_swiat.txt): %d" % len(zwykle))
    if P["errors"]:
        print("\nBLOKADY (z nimi --wykonaj nic nie zrobi):")
        for e in P["errors"]: print("   - " + e)


# ------------------------------------------------------------------ doing it
def write_checked(path, data):
    with open(path, "wb") as fh: fh.write(data)
    if open(path, "rb").read() != data: raise SystemExit("BŁĄD: %s zapisał się inaczej - przywróć z kopii (--cofnij)." % path)


def execute(P):
    RW.need_editor_closed()
    stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    bak = os.path.join(ARCH, "stare_mapy_" + stamp)
    os.makedirs(os.path.join(bak, "data"), exist_ok=False)
    files = ["Map%03d.json" % i for i in P["gone_files"] if os.path.exists(map_path(i))] + ["MapInfos.json", "System.json"]
    sums = {}
    for f in files:
        src, dst = os.path.join(DATA, f), os.path.join(bak, "data", f)
        shutil.copy2(src, dst)
        a, b = sha1(open(src, "rb").read()), sha1(open(dst, "rb").read())
        if a != b: stop("kopia %s różni się od oryginału" % f)
        sums[f] = a
    ver = None
    sraw, mv = P["sraw"], P["mv"]
    import random
    ver = random.randint(10000000, 99999999)
    while ver == int(mv.group(1)): ver = random.randint(10000000, 99999999)
    sout = sraw[:mv.start(1)] + str(ver).encode() + sraw[mv.end(1):]
    so, sn = json.loads(sraw.decode("utf-8")), json.loads(sout.decode("utf-8"))
    so.pop("versionId"); sn.pop("versionId")
    if so != sn: stop("System.json: zmieniłoby się coś poza versionId")
    spis = {"czas": stamp, "usuniete": P["gone_files"], "przepiete": {str(k): [a, b] for k, (a, b, _) in P["moves"].items()},
            "sha1_kopii": sums, "sha1_nowego_MapInfos": sha1(P["new_raw"]), "versionId": [int(mv.group(1)), ver]}
    with open(os.path.join(bak, "spis.json"), "wb") as fh: fh.write(json.dumps(spis, ensure_ascii=False, indent=1).encode("utf-8"))
    print("Kopia: %s (%d plików, sprawdzone)" % (bak, len(files)))
    write_checked(os.path.join(DATA, "MapInfos.json"), P["new_raw"])
    write_checked(os.path.join(DATA, "System.json"), sout)
    for i in P["gone_files"]:
        if os.path.exists(map_path(i)): os.remove(map_path(i))
    print("Usunięto %d plików map, MapInfos.json zapisany (%d wpisów przepiętych), versionId %s -> %d."
          % (len(P["gone_files"]), len(P["moves"]), mv.group(1).decode(), ver))
    print("Cofnięcie: python tools/mapy/usun_stare.py --cofnij \"%s\"" % bak)
    print("Teraz: otwórz projekt w edytorze na nowo (Plik - Otwórz), zanim cokolwiek w nim zapiszesz.")


def undo(folder):
    RW.need_editor_closed()
    spis_p = os.path.join(folder, "spis.json")
    if not os.path.exists(spis_p): stop("brak %s" % spis_p)
    spis = json.load(open(spis_p, encoding="utf-8"))
    cur = open(os.path.join(DATA, "MapInfos.json"), "rb").read()
    if sha1(cur) != spis["sha1_nowego_MapInfos"]:
        stop("data/MapInfos.json zmienił się po usuwaniu (np. zapis w edytorze) - przywróć ręcznie z %s" % folder)
    back = [f for f in spis["sha1_kopii"] if f.startswith("Map") and f != "MapInfos.json"]
    for f in back:
        if os.path.exists(os.path.join(DATA, f)): stop("data/%s już jest - nie nadpisuję" % f)
    for f in back + ["MapInfos.json"]:
        src = os.path.join(folder, "data", f)
        if sha1(open(src, "rb").read()) != spis["sha1_kopii"][f]: stop("kopia %s jest uszkodzona" % f)
    for f in back + ["MapInfos.json"]: shutil.copy2(os.path.join(folder, "data", f), os.path.join(DATA, f))
    sp = os.path.join(DATA, "System.json")
    sraw = open(sp, "rb").read()
    mv = re.search(rb'"versionId":(\d+)', sraw)
    if mv:
        import random
        ver = random.randint(10000000, 99999999)
        sout = sraw[:mv.start(1)] + str(ver).encode() + sraw[mv.end(1):]
        json.loads(sout.decode("utf-8"))
        write_checked(sp, sout)
    print("Przywrócono %d map i MapInfos.json z %s (nowe versionId). Otwórz projekt w edytorze na nowo." % (len(back), folder))


def main():
    if "--cofnij" in sys.argv:
        k = sys.argv.index("--cofnij")
        if k + 1 >= len(sys.argv): stop("podaj folder kopii po --cofnij")
        undo(os.path.abspath(sys.argv[k + 1])); return
    P = plan("--mimo-testow" in sys.argv)
    show(P)
    if "--wykonaj" not in sys.argv:
        print("\n(próba - nic nie zmieniono; usunięcie: --wykonaj, przy zamkniętym edytorze)")
        return
    if P["errors"]: stop("są blokady (lista wyżej).")
    if not P["gone"]: print("Nic do usunięcia."); return
    execute(P)


if __name__ == "__main__":
    main()
