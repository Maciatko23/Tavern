# -*- coding: utf-8 -*-
"""Nieużywane obrazki i dźwięki (gracz 2026-11-07: „wywal co się da, np. nieużywane png”). Plik jest UŻYWANY, gdy jego nazwa (bez
rozszerzenia) albo początek nazwy składanej w kodzie występuje gdziekolwiek: w data/*.json, js/ (wtyczki, teksty, lista wtyczek,
silnik), index.html, css/, tests/ i tools/ (narzędzia robią z nich inne obrazki). Początek składanej nazwy: napis z kodu kończący się
na _ - albo cyfrę przed złączeniem ("Bird_" + gatunek, `Hero_${kind}`) - chroni każdy plik, który się nim zaczyna.
  python tools/porzadki/nieuzywane.py                  (lista podejrzanych, nic nie rusza)
  python tools/porzadki/nieuzywane.py --wykonaj        (przenosi je do ../Tawerna_archiwum_<data>/ z tymi samymi ścieżkami)"""
import datetime, glob, os, re, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_" + datetime.date.today().isoformat())
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
os.chdir(ROOT)

texts = []
for pat in ["data/*.json", "js/*.js", "js/plugins/*.js", "js/teksty/**/*", "js/libs/*.js", "index.html", "css/*", "tests/**/*.js", "tools/**/*.py", "tools/**/*.js", "tools/**/*.json"]:
    for p in glob.glob(pat, recursive=True):
        if os.path.isfile(p) and os.path.getsize(p) < 30 * 1048576 and "kopie_zapasowe" not in p and "staging" not in p:
            texts.append(open(p, "rb").read().decode("utf-8", "replace"))
blob = "\n".join(texts)
# the starts of names put together in code: "Abc_" + x, 'Abc-' + x, `Abc_${x}`, "Abc" + n (a digit after it)
prefixes = set()
for m in re.finditer(r"""["'`]([A-Za-z0-9_!$\-]{3,})(?:["']\s*\+|\$\{)""", blob):
    prefixes.add(m.group(1))
for m in re.finditer(r"""["'`]([!$]*[A-Za-z][A-Za-z0-9_]*[_-])["'`]""", blob):   # (a bare "Abc_" kept in a table and joined later)
    prefixes.add(m.group(1))

files = sorted(glob.glob("img/*/*.png") + glob.glob("audio/*/*.ogg") + glob.glob("audio/*/*.m4a"))
groups = {}
for p in files:
    groups.setdefault(os.path.splitext(p)[0], []).append(p)   # (an .ogg and its .m4a go together)
unused, size = [], 0
for base, ps in groups.items():
    name = os.path.basename(base)
    if name in blob:
        continue
    if any(name.startswith(pf) for pf in prefixes if len(pf) >= 3):
        continue
    unused.append(ps)
    size += sum(os.path.getsize(p) for p in ps)
print("plików razem: %d, podejrzanych o nieużywanie: %d (%.1f MB)" % (len(files), sum(len(u) for u in unused), size / 1048576))
by = {}
for ps in unused:
    by.setdefault(os.path.dirname(ps[0]), []).append(os.path.basename(os.path.splitext(ps[0])[0]))
for d, names in sorted(by.items()):
    print("%s (%d): %s" % (d, len(names), ", ".join(sorted(names))))
if "--wykonaj" in sys.argv:
    moved = []
    for ps in unused:
        for p in ps:
            dst = os.path.join(ARCH, p)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.move(p, dst)
            moved.append(p)
    open(os.path.join(ARCH, "nieuzywane_" + datetime.datetime.now().strftime("%H%M%S") + ".txt"), "w", encoding="utf-8").write("\n".join(moved) + "\n")
    print("przeniesione do", ARCH)
