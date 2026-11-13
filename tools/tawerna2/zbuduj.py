# -*- coding: utf-8 -*-
"""Buduje staging Tawerny 2: mapy (build025/026/001), lacza miedzy mapami, przepiecia wtyczek i tekstow, plan karczmy."""
import subprocess, sys, os
H = os.path.dirname(os.path.abspath(__file__))
for s in ("build025.py", "build026.py", "build001.py", "patch_data.py", "przepinaj.py", "plan/make_plan.py", "plan/make_board.py", "przepinaj_plan.py"):
    r = subprocess.run([sys.executable, os.path.join(H, s)])
    if r.returncode: raise SystemExit("STOP w " + s)
subprocess.run([sys.executable, os.path.join(H, "check.py"), "all"])
