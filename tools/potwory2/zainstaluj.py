# -*- coding: utf-8 -*-
"""W23 "Coś z głębin", fala 2 (2026-11-12): potwory z morza to utopieni żołnierze wojny - SZKIELETY z pałką, mieczem, włócznią i młotem, potem kraby, rzadki
krab-kolos i kraken z dużymi mackami. Instalator nakłada zmiany NA AKTUALNE pliki gry w chwili instalacji.

  python tools/potwory2/zainstaluj.py                    próba: co się zmieni (nic nie jest zapisywane)
  python tools/potwory2/zainstaluj.py --do <katalog>     buduje nakładkę do testów: kopie zmienianych plików gry (po zmianach) + nowe pliki
                                                         (GAME_OVERLAY=<katalog względem projektu> GAME_OVERLAY_JS=1)
  python tools/potwory2/zainstaluj.py --wykonaj          zapisuje do gry (edytor zamknięty), kopia do ..\\Tawerna_archiwum_2026-11-08\\potwory2_<czas>\\

Pliki W23 w całości nowe (tools/potwory2/nowe/): js/plugins/Morze_Data.js, Morze_Potwory.js, Morze.js, js/teksty/morze.txt - zastępują wersje z pierwszej fali.
Kotwica: skrót (sha256) pliku ŻYWEGO musi być skrótem wersji z pierwszej fali (base_hashes.json) albo już nową wersją; inaczej STOP (ktoś go zmienił: scal ręcznie).
Nowe arkusze: img/characters/anim8/Cr_Sk{Club,Sword,Spear,Hammer,Captain}_{Walk8,Atk8,Die8}.png, $Cr_Sk*.png, Morze_Macka_Duza.png.
Zmiany w istniejących (kotwice dokładne, idempotentne; brak kotwicy = STOP z komunikatem):
  data/Items.json               trzy NIEUŻYWANE przedmioty z pierwszej fali na MIEJSCU (te same numery): 413 Łuska rybołaka -> Zardzewiałe ostrze,
                                414 Perła mgły -> Grot włóczni, 415 Muszla śpiewająca -> Znak chorągwi
  js/plugins/Debug.js           trasa wiersza F9 "Morze:fog" -> "Morze:captain" (wiersz "Kapitan z chorągwią teraz")
  js/tawerna_wtyczki.js         opisy trzech wpisów Morze* (z @plugindesc)
Zdarzenia: bez zmian (numery 4700-4799 jak dotąd; potwory, ślady, kości i macki to duszki)."""
import datetime, hashlib, json, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
NOWE = os.path.join(HERE, "nowe")
G = lambda rel: os.path.join(ROOT, *rel.split("/"))
def rd(p): return open(p, "rb").read()
def stop(msg): raise SystemExit("STOP: " + msg)
sha = lambda b: hashlib.sha256(b).hexdigest()
BASE = json.load(open(os.path.join(HERE, "base_hashes.json"), encoding="utf-8"))

# ---------------------------------------------------------------- items (in place)
ITEMS = {
    413: ("Łuska rybołaka", "Zardzewiałe ostrze", "Złamane, zardzewiałe ostrze z kontynentu, mokre od morza. Kowal bierze na złom, kupcy dają za nie parę groszy.", 581, 14),
    414: ("Perła mgły", "Grot włóczni", "Rdzawy grot włóczni z liściastym ostrzem, po którym został kawałek spróchniałego drzewca. Kowal przetopi na złom.", 607, 18),
    415: ("Muszla śpiewająca", "Znak chorągwi", "Strzęp wyblakłej chorągwi w czerwono-szare pasy, zdarty z kapitana utopionej kompanii. Pamiątka po ludziach, którzy zginęli na wojnie.", 318, 0),
}
def patch_items(b):
    t = b.decode("utf-8")
    for iid, (old, new, desc, icon, price) in ITEMS.items():
        m = re.search(r'^\{"id":%d,.*$' % iid, t, re.M)
        if not m: stop("data/Items.json: brak przedmiotu %d" % iid)
        line = m.group(0).rstrip("\r")
        have = re.search(r'"name":"((?:[^"\\]|\\.)*)"', line).group(1)
        if have == new: continue
        if have != old: stop("data/Items.json: przedmiot %d nazywa się %r, oczekiwano %r albo %r" % (iid, have, old, new))
        comma = line.endswith(",")
        o = json.loads(line.rstrip(","))
        o["name"] = new; o["description"] = desc; o["iconIndex"] = icon; o["price"] = price
        o["note"] = "<Weight:0>" if iid == 415 else "<Weight:1>"
        nl = json.dumps(o, ensure_ascii=False, separators=(",", ":")) + ("," if comma else "")
        t = t.replace(line, nl, 1)
    return t.encode("utf-8")

# ---------------------------------------------------------------- Debug.js route
DBG_OLD = '"Morze:fog": [FIGHT_TAB, "potwory", 4]'
DBG_NEW = '"Morze:captain": [FIGHT_TAB, "potwory", 4]'
def patch_debug(b):
    t = b.decode("utf-8")
    if DBG_NEW in t: return b
    if t.count(DBG_OLD) != 1: stop("js/plugins/Debug.js: brak kotwicy " + DBG_OLD)
    return t.replace(DBG_OLD, DBG_NEW).encode("utf-8")

# ---------------------------------------------------------------- plugin list descriptions
def plugindesc(name):
    t = rd(os.path.join(NOWE, "js", "plugins", name + ".js")).decode("utf-8")
    m = re.search(r"@plugindesc\s+(.*)", t)
    return m.group(1).strip()
def patch_list(b):
    t = b.decode("utf-8")
    for name in ("Morze_Data", "Morze_Potwory", "Morze"):
        m = re.search(r'^\{"name":"%s",.*$' % re.escape(name), t, re.M)
        if not m: stop("js/tawerna_wtyczki.js: brak wpisu " + name)
        line = m.group(0).rstrip("\r"); comma = line.endswith(",")
        e = json.loads(line.rstrip(","))
        e["description"] = plugindesc(name)
        nl = json.dumps(e, ensure_ascii=False, separators=(",", ":")) + ("," if comma else "")
        t = t.replace(line, nl, 1)
    return t.encode("utf-8")
PATCHES = [("data/Items.json", patch_items), ("js/plugins/Debug.js", patch_debug), ("js/tawerna_wtyczki.js", patch_list)]

def new_files():
    out = []
    for dp, dn, fn in os.walk(NOWE):
        for f in fn:
            full = os.path.join(dp, f)
            rel = os.path.relpath(full, NOWE).replace("\\", "/")
            if f.endswith(".md"): continue
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
        if rel in BASE and os.path.exists(p):
            h = sha(rd(p))
            if h != BASE[rel] and h != sha(b): stop(rel + ": żywy plik różni się od wersji z pierwszej fali (ktoś go zmienił) - scal ręcznie")
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
    W.take_lock("potwory2 - instalacja")
    try:
        bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "potwory2_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
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
