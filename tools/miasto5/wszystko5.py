# -*- coding: utf-8 -*-
"""Cały nowy Kruczogród do kopii roboczej (tools/miasto5/staging), po kolei: build5 (mapa) -> wnetrza5 (wyjścia wnętrz, drzwi tawerny)
-> szwy5 (mury u sąsiadów) -> swiat5 (przejścia świata) -> przepnij5 (wtyczki i testy).   python tools/miasto5/wszystko5.py"""
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
for s in ("build5.py", "wnetrza5.py", "szwy5.py", "swiat5.py", "przepnij5.py"):
    print("==", s); r = subprocess.run([sys.executable, os.path.join(HERE, s)], capture_output=True, text=True, encoding="utf-8", errors="replace")
    print("\n".join(r.stdout.strip().splitlines()[-3:]))
    if r.returncode: print(r.stderr); raise SystemExit("STOP: %s" % s)
