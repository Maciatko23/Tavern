# -*- coding: utf-8 -*-
"""Cały łańcuch stagingu poprawy krawędzi: zbuduj -> links z kafli -> Swiat_Data -> kontrakt -> estetyka -> punkty zrzutów.
   python tools/krawedzie_poprawa/wszystko.py"""
import os, sys, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ST = "tools/krawedzie_poprawa/staging"
def run(*a, env=None):
    print(">>", " ".join(a)); e = dict(os.environ); e.update(env or {})
    return subprocess.run([sys.executable, "-X", "utf8"] + list(a), cwd=ROOT, env=e).returncode
run("tools/krawedzie_poprawa/zbuduj.py")
run("tools/mapy/swiat_styki.py", "--staging", ST, "--linki")
run("tools/mapy/swiat_do_gry.py", "--styki", "--wlacz", "--out", ST + "/js/plugins/Swiat_Data.js", env={"SWIAT_STY": ST})
rc = run("tools/mapy/swiat_styki.py", "--staging", ST)
run("tools/mapy/estetyka.py", "--staging", ST)
run("tools/krawedzie_poprawa/punkty.py")
sys.exit(rc)
