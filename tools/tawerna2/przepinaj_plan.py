# -*- coding: utf-8 -*-
"""Tawerna 2: runs AFTER przepinaj.py. Replaces the single PLAN_DATA line of the STAGED js/plugins/TavernLife_Plan.js with the one built from
the staged maps (tools/tawerna2/plan/plan_data.json, written by tools/tawerna2/plan/make_plan.py). The line is ~50 kB, so it is not a
przepiecia entry. Binary mode, the file's line endings stay.
   python tools/tawerna2/przepinaj.py && python tools/tawerna2/przepinaj_plan.py"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
STG = os.path.join(HERE, "staging", "js", "plugins", "TavernLife_Plan.js")
DATA = os.path.join(HERE, "plan", "plan_data.json")
if not os.path.exists(STG): sys.exit("STOP: no staged TavernLife_Plan.js (run przepinaj.py first; it needs at least one entry for that file)")
src = open(STG, "rb").read()
key = b"    const PLAN_DATA = "
a = src.find(key)
if a < 0 or src.count(key) != 1: sys.exit("STOP: the PLAN_DATA line is not there exactly once")
b = src.find(b";\n", a)
if b < 0: b = src.find(b";\r\n", a)
if b < 0: sys.exit("STOP: the PLAN_DATA line has no end")
body = json.dumps(json.load(open(DATA, encoding="utf-8")), ensure_ascii=False, separators=(",", ":")).encode("utf-8")
if body in src[a:b + 1]:
    print("PLAN_DATA already current"); sys.exit(0)
open(STG, "wb").write(src[:a] + key + body + src[b:])
print("PLAN_DATA replaced in the staged TavernLife_Plan.js (%d bytes)" % len(body))
