# -*- coding: utf-8 -*-
"""Porządek w projekcie (gracz 2026-11-07: „przenieś do archiwum”): stare kopie zapasowe, kopie robocze (staging) i zrzuty z tools/ oraz
obrazki z docs/ (podglądy) - te, których nie ma w repozytorium - do ../Tawerna_archiwum_<data>/ z tymi samymi ścieżkami.
Zostają: wszystko w repozytorium, świeże (ostatnie DNI dni), obrazki z docs/, do których odwołuje się opis .md albo kod (testy, narzędzia).
  python tools/porzadki/archiwum.py            (tylko policz)
  python tools/porzadki/archiwum.py --wykonaj  (przenieś)"""
import datetime, os, re, shutil, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DNI = 3
ARCH = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_" + datetime.date.today().isoformat())
IMG = re.compile(r"\.(png|gif|jpe?g|webp|mp4)$", re.I)
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
os.chdir(ROOT)

tracked = set(subprocess.run(["git", "ls-files", "-z"], capture_output=True, text=True, encoding="utf-8").stdout.split("\0"))
untracked = [p for p in subprocess.run(["git", "ls-files", "-z", "--others", "--exclude-standard"], capture_output=True, text=True, encoding="utf-8").stdout.split("\0") if p]
# what the docs and the code name (an image named there stays)
named = set()
for p in tracked:
    if p.endswith((".md", ".js", ".py", ".html")) and (p.startswith(("docs/", "tests/", "tools/")) or p.endswith(".md")) and os.path.exists(p):
        txt = open(p, "rb").read().decode("utf-8", "replace")
        for m in re.finditer(r"[A-Za-z0-9_./\-]+\.(?:png|gif|jpe?g|webp)", txt):
            named.add(os.path.basename(m.group(0)))
old = time.time() - DNI * 86400
moves, skip_named, skip_new = [], 0, 0
for p in untracked:
    segs = p.split("/")
    work = p.startswith("tools/") and any(s == "kopie_zapasowe" or s.startswith("staging") or s.startswith("zrzuty") for s in segs[:-1])
    docimg = p.startswith("docs/") and IMG.search(p)
    if not (work or docimg) or not os.path.isfile(p):
        continue
    if os.path.getmtime(p) > old:
        skip_new += 1; continue
    if docimg and os.path.basename(p) in named:
        skip_named += 1; continue
    moves.append(p)
size = sum(os.path.getsize(p) for p in moves)
print("do archiwum: %d plików, %.2f GB -> %s" % (len(moves), size / 1073741824, ARCH))
print("zostają: świeże (%d dni) %d, obrazki nazwane w opisach/kodzie %d" % (DNI, skip_new, skip_named))
by = {}
for p in moves:
    k = "/".join(p.split("/")[:2]); by[k] = by.get(k, 0) + os.path.getsize(p)
for k, v in sorted(by.items(), key=lambda x: -x[1])[:12]: print("  %7.1f MB  %s" % (v / 1048576, k))
if "--wykonaj" in sys.argv:
    for p in moves:
        dst = os.path.join(ARCH, p)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.move(p, dst)
    # the folders left empty
    for top in ("docs", "tools"):
        for d, subs, files in sorted(os.walk(top), key=lambda x: -len(x[0])):
            if not os.listdir(d): os.rmdir(d)
    print("przeniesione")
