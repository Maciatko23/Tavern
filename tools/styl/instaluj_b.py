# -*- coding: utf-8 -*-
"""Wygląd „B” do gry (gracz 2026-11-08: „tak działaj” - na całej powierzchni): zestawy 9 i 11 w data/Tilesets.json wskazują arkusze
img/tilesets/Styl_B (tools/styl/styl_b.py), obrazki przyrody z tools/styl/staging/img/characters zastępują swoje oryginały w
img/characters. Przed zmianą kopia (Tilesets.json i podmieniane obrazki) do ../Tawerna_archiwum_2026-11-08/styl_b_<czas>/ ze spisem.
Edytor musi być zamknięty; plik Tilesets.json zmieniany tylko w wierszach zestawów 9 i 11 (układ edytora zostaje).
  python tools/styl/instaluj_b.py [--wykonaj]
  python tools/styl/instaluj_b.py --przywroc <folder kopii> [--wykonaj]"""
import datetime, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
DO = "--wykonaj" in sys.argv
TS = os.path.join(ROOT, "data", "Tilesets.json")
STG = os.path.join(HERE, "staging")
IDS = (9, 11)

W.need_editor_closed()
if "--przywroc" in sys.argv:
    src = sys.argv[sys.argv.index("--przywroc") + 1]
    spis = json.load(open(os.path.join(src, "spis.json"), encoding="utf-8"))
    for rel in spis["pliki"]:
        print(("przywracam " if DO else "przywróciłby ") + rel)
        if DO: shutil.copy2(os.path.join(src, *rel.split("/")), os.path.join(ROOT, *rel.split("/")))
    raise SystemExit(0)

text = open(TS, "rb").read().decode("utf-8")
lines = text.split("\n")
ts = json.loads(text)
changed_lines = 0
for i, ln in enumerate(lines):
    m = re.match(r'^\{"id":(\d+),', ln)
    if not m or int(m.group(1)) not in IDS: continue
    tid = int(m.group(1))
    names = ts[tid]["tilesetNames"]
    new = [("Styl_B/" + n if n and not n.startswith("Styl_B/") else n) for n in names]
    for n in new:
        if n and not os.path.exists(os.path.join(ROOT, "img", "tilesets", n + ".png")): raise SystemExit("STOP: brak arkusza %s - najpierw python tools/styl/styl_b.py" % n)
    old_s = '"tilesetNames":' + json.dumps(names, ensure_ascii=False, separators=(",", ":"))
    new_s = '"tilesetNames":' + json.dumps(new, ensure_ascii=False, separators=(",", ":"))
    if old_s not in ln: raise SystemExit("STOP: nie znalazłem tilesetNames zestawu %d w wierszu" % tid)
    if old_s != new_s:
        lines[i] = ln.replace(old_s, new_s); changed_lines += 1
chars = sorted(f for f in os.listdir(os.path.join(STG, "img", "characters")) if f.endswith(".png"))
print("Tilesets.json: zestawy %s -> Styl_B (%d wierszy); przyroda: %d obrazków" % (IDS, changed_lines, len(chars)))
if not DO:
    print("(próba - nic nie zmieniono; --wykonaj)"); raise SystemExit(0)
W.take_lock("styl B")
try:
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "styl_b_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    files = ["data/Tilesets.json"] + ["img/characters/" + f for f in chars]
    for rel in files:
        d = os.path.join(bak, *rel.split("/")); os.makedirs(os.path.dirname(d), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, *rel.split("/")), d)
    json.dump({"czas": datetime.datetime.now().isoformat(timespec="seconds"), "pliki": files}, open(os.path.join(bak, "spis.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(TS, "wb").write("\n".join(lines).encode("utf-8"))
    json.loads(open(TS, encoding="utf-8").read())   # (still JSON)
    for f in chars: shutil.copyfile(os.path.join(STG, "img", "characters", f), os.path.join(ROOT, "img", "characters", f))
    print("zainstalowane (kopia: %s)" % bak)
finally:
    W.drop_lock()
