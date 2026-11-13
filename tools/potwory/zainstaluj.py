# -*- coding: utf-8 -*-
"""W23 "Coś z głębin" - potwory z morza (docs/POTWORY_Z_MORZA.md): instalator. Nakłada zmiany NA AKTUALNE pliki gry w chwili instalacji.

  python tools/potwory/zainstaluj.py                    próba: co się zmieni (nic nie jest zapisywane)
  python tools/potwory/zainstaluj.py --do <katalog>     buduje nakładkę do testów: kopie zmienianych plików gry (po zmianach) + nowe pliki
                                                        (GAME_OVERLAY=<katalog względem projektu> GAME_OVERLAY_JS=1)
  python tools/potwory/zainstaluj.py --wykonaj          zapisuje do gry (edytor zamknięty), kopia do ..\\Tawerna_archiwum_2026-11-08\\potwory_<czas>\\

Nowe pliki (tools/potwory/nowe/): js/plugins/Morze_Data.js, Morze_Potwory.js, Morze.js, js/teksty/morze.txt, arkusze potworów
(img/characters/anim8/Cr_Sea*_{Walk8,Atk8,Die8}.png, img/characters/$Cr_Sea*.png), img/characters/Morze_Macka.png.
Zmiany w istniejących (kotwice dokładne, idempotentne; brak kotwicy = STOP z komunikatem):
  js/tawerna_wtyczki.js         Morze_Data pod Poselstwo_Data (nad TownLife i TownQuests_Data), Morze_Potwory i Morze pod Poselstwo
  js/plugins/Farming_Build.js   restDanger(): potwór z morza w 8 polach = „nie zaśniesz”
  data/Items.json               siedem przedmiotów (Wodorost, Mięso kraba, Pancerz kraba, Łuska rybołaka, Perła mgły, Muszla śpiewająca,
                                Atrament krakena) - numery: pierwsze wolne po ostatnim; po nazwach (wtyczki szukają ich po nazwie)
Zdarzenia: numery 4700-4799 zarezerwowane (Tawerna.inject.reserve w Morze.js); potwory i macki to duszki, nie zdarzenia - zero zmian w mapach."""
import datetime, json, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
NOWE = os.path.join(HERE, "nowe")
G = lambda rel: os.path.join(ROOT, *rel.split("/"))
def rd(p): return open(p, "rb").read()
def stop(msg): raise SystemExit("STOP: " + msg)

# ---------------------------------------------------------------- patches (bytes -> bytes)
PLUGINS = [("Morze_Data", "Poselstwo_Data"), ("Morze_Potwory", "Poselstwo"), ("Morze", "Morze_Potwory")]
def plugindesc(name):
    t = rd(os.path.join(NOWE, "js", "plugins", name + ".js")).decode("utf-8")
    m = re.search(r"@plugindesc\s+(.*)", t)
    return m.group(1).strip() if m else name
def patch_list(b):
    t = b.decode("utf-8")
    nl = "\r\n" if "\r\n" in t else "\n"
    for name, after in PLUGINS:
        if '{"name":"%s",' % name in t: continue
        m = re.search(r'^\{"name":"%s",.*\},?\r?$' % re.escape(after), t, re.M)
        if not m: stop("js/tawerna_wtyczki.js: brak wpisu %s (kotwica dla %s)" % (after, name))
        line = m.group(0).rstrip("\r")
        entry = json.dumps({"name": name, "status": True, "description": plugindesc(name), "parameters": {}}, ensure_ascii=False, separators=(",", ":"))
        if not line.endswith(","): stop("js/tawerna_wtyczki.js: wpis %s jest ostatni - nie wstawiam pod nim" % after)
        t = t[:m.end()] + nl + entry + "," + t[m.end():]
    return t.encode("utf-8")
REST_ANCHOR = "        // people fighting him (Humans.js, combat stage 3: a bandit, an archer, a mercenary) - not one who gave up or ran"
REST_NEW = ("        // the sea's creatures (W23, Morze_Potwory.js): one within 8 tiles that is not going back to the water\n"
            "        const sea = T.api(\"Creatures\");\n"
            "        for (const c of (sea && sea.creatures ? sea.creatures() : [])) {\n"
            "            if (c && c._def && c._def.sea && !c._dead && !c._dying && !c._retreat && c._mode !== \"flee\" && c.playerDistance() < 8) return c.name();\n"
            "        }\n")
def patch_rest(b):
    t = b.decode("utf-8")
    if "c._def.sea" in t: return b
    if REST_ANCHOR not in t: stop("js/plugins/Farming_Build.js: brak kotwicy restDanger (komentarz „people fighting him”)")
    nl = "\r\n" if "\r\n" in t else "\n"
    return t.replace(REST_ANCHOR, REST_NEW.replace("\n", nl) + REST_ANCHOR, 1).encode("utf-8")
ITEMS = [
    ("Wodorost", "Śliski, zielony wodorost wyrzucony na brzeg. Nie nadaje się do picia - z niczego tu wody nie będzie - ale brat Kleofas zrobi z niego atrament.", 360, 6, 1, "<Weight:1>"),
    ("Mięso kraba", "Białe, twarde mięso z kleszczy olbrzymiego kraba. Surowe nie nadaje się do jedzenia. Upieczone nad ogniem dobre na zupę krabową.", 350, 12, 1, "<Weight:1>"),
    ("Pancerz kraba", "Rdzawy pancerz z pąklami, lekki i twardy. Z kilku takich da się zrobić tarczę.", 635, 30, 1, "<Weight:3>"),
    ("Łuska rybołaka", "Cyrkonowo-zielona łuska rybołaka, twarda jak róg. Kupcy w mieście dają za nią dobre pieniądze.", 482, 20, 1, "<Weight:1>"),
    ("Perła mgły", "Blada perła ze skrzepniętej mgły. Świeci słabo, jak latarnia daleko na morzu. Wzmocni soczewkę latarnika.", 668, 80, 1, "<Weight:0>"),
    ("Muszla śpiewająca", "Muszla morskiej wiedźmy. Przyłożona do ucha szepcze pieśń, która nie wciąga, a uspokaja. Melia da za nią wiele.", 663, 150, 1, "<Weight:0>"),
    ("Atrament krakena", "Czarny jak noc atrament z ramion krakena. Nie blaknie, a litery pisane nim same się świecą w ciemności.", 475, 120, 1, "<Weight:1>"),
]
def patch_items(b):
    t = b.decode("utf-8")
    nl = "\r\n" if "\r\n" in t else "\n"
    arr = json.loads(t)
    have = {i["name"] for i in arr if i}
    last = max(i["id"] for i in arr if i)
    add = []
    for name, desc, icon, price, itype, note in ITEMS:
        if name in have: continue
        last += 1
        o = {"id": last, "animationId": 0, "consumable": False, "damage": {"critical": False, "elementId": 0, "formula": "0", "type": 0, "variance": 20}, "description": desc,
             "effects": [], "hitType": 0, "iconIndex": icon, "itypeId": itype, "name": name, "note": note, "occasion": 3, "price": price, "repeats": 1, "scope": 0,
             "speed": 0, "successRate": 100, "tpGain": 0}
        add.append(json.dumps(o, ensure_ascii=False, separators=(",", ":")))
    if not add: return b
    i = t.rstrip().rfind("]")
    body = t[:i].rstrip()
    return (body + "," + nl + ("," + nl).join(add) + nl + t[i:]).encode("utf-8")
PATCHES = [("js/tawerna_wtyczki.js", patch_list), ("js/plugins/Farming_Build.js", patch_rest), ("data/Items.json", patch_items)]

def new_files():
    out = []
    for dp, dn, fn in os.walk(NOWE):
        for f in fn:
            full = os.path.join(dp, f)
            rel = os.path.relpath(full, NOWE).replace("\\", "/")
            if rel.startswith("tests/") or f.endswith(".md"): continue
            out.append((rel, rd(full)))
    return sorted(out)

def main():
    a = sys.argv[1:]
    do = a[a.index("--do") + 1] if "--do" in a else None
    run = "--wykonaj" in a
    plan = []
    for rel, fn in PATCHES:
        cur = rd(G(rel)); nxt = fn(cur)
        plan.append((rel, nxt, nxt != cur))
    for rel, b in new_files():
        p = G(rel)
        plan.append((rel, b, not os.path.exists(p) or rd(p) != b))
    for rel, b, ch in plan: print(("  zmieni  " if ch else "  bez zmian ") + rel)
    if do:
        base = os.path.join(ROOT, do) if not os.path.isabs(do) else do
        for rel, b, ch in plan:
            dst = os.path.join(base, *rel.split("/")); os.makedirs(os.path.dirname(dst), exist_ok=True); open(dst, "wb").write(b)
        print("nakładka: " + base); return
    if not run:
        print("(próba - nic nie zmieniono; --do <katalog> buduje nakładkę, --wykonaj instaluje)"); return
    import wspolne as W
    W.need_editor_closed()
    W.take_lock("potwory - instalacja")
    try:
        bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "potwory_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
        byly = []
        for rel, b, ch in plan:
            if ch and os.path.exists(G(rel)):
                dst = os.path.join(bak, *rel.split("/")); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(G(rel), dst); byly.append(rel)
        os.makedirs(bak, exist_ok=True)
        json.dump({"byly": byly, "nowe": [r for r, _, c in plan if c and r not in byly]}, open(os.path.join(bak, "spis.json"), "w", encoding="utf-8"), indent=1)
        for rel, b, ch in plan:
            if ch:
                os.makedirs(os.path.dirname(G(rel)), exist_ok=True); open(G(rel), "wb").write(b)
        print("zainstalowano; kopia: " + bak)
    finally:
        W.drop_lock()
main()
