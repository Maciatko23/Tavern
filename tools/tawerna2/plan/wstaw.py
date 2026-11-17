# -*- coding: utf-8 -*-
"""Wstawia świeży plan do gry: plan_data.json -> JEDEN wiersz „const PLAN_DATA = ...;” w js/plugins/TavernLife_Plan.js (cały stary
blok, także wielowierszowy, jest zastępowany) i obrazki TavernPlan_*.png do img/pictures. Uruchamiać po make_plan.py.
  python tools/tawerna2/plan/wstaw.py"""
import json, os, re, shutil, glob, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
p = os.path.join(ROOT, "js", "plugins", "TavernLife_Plan.js")
s = open(p, "rb").read()
d = json.dumps(json.load(open(os.path.join(HERE, "plan_data.json"), encoding="utf-8")), ensure_ascii=False, separators=(",", ":")).encode("utf-8")
i = s.index(b"    const PLAN_DATA = "); m = s.index(b"// </plan-data>", i)
j = s.rindex(b"\n", i, m) + 1                              # the start of the marker's line: the old block ends before it
eol = b"\r\n" if s[j - 2:j] == b"\r\n" else b"\n"
s = s[:i] + b"    const PLAN_DATA = " + d + b";" + eol + s[j:]
open(p, "wb").write(s)
for f in glob.glob(os.path.join(HERE, "..", "staging", "img", "pictures", "TavernPlan_*.png")): shutil.copy2(f, os.path.join(ROOT, "img", "pictures"))
r = subprocess.run(["node", "-e", "new Function(require('fs').readFileSync(process.argv[1],'utf8'))", p], capture_output=True, text=True)
if r.returncode: sys.exit("TavernLife_Plan.js NIE parsuje się:\n" + r.stderr[-400:])
print("plan wstawiony, plik się parsuje")
