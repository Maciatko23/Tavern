# -*- coding: utf-8 -*-
"""Plansza 3x3 od zera do kopii próbnej (tools/plansza/staging) - wszystkie kroki po kolei; data/ i js/ gry nietknięte:
  przesun -> granice -> wtyczki_kratki -> odstaw -> wyspa -> przystan -> zlew -> teren -> latarnia -> gladz -> drogi -> dostep -> furtki -> swiat -> dane brzegu i łąki -> mapa wyspy
  python tools/plansza/wszystko.py"""
import os, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
# (after tools/plansza/zainstaluj.py the game IS the board: these steps would shift its maps a second time)
if "plansza 3x3" in open(os.path.join(ROOT, "js", "plugins", "Swiat_Data.js"), encoding="utf-8").read():
    raise SystemExit("STOP: plansza jest już zainstalowana w grze - wszystko.py działa tylko na grze sprzed instalacji (poprawki: na mapach gry)")
for d in ("data", "js", "testy", "dzienniki"):
    shutil.rmtree(os.path.join(STG, d), ignore_errors=True)
py = sys.executable
def run(args, cwd=HERE):
    r = subprocess.run([py] + args, cwd=cwd, capture_output=True, text=True, encoding="utf-8", env=dict(os.environ, PYTHONIOENCODING="utf-8"))
    out = (r.stdout or "").strip().splitlines()
    os.makedirs(os.path.join(STG, "dzienniki"), exist_ok=True)   # (every step's whole output: staging/dzienniki/<step>.txt)
    open(os.path.join(STG, "dzienniki", os.path.basename(args[0]).replace(".py", ".txt")), "w", encoding="utf-8").write((r.stdout or "") + (r.stderr or ""))
    print("== %s: %s" % (args[0], out[-1] if out else ""))
    for l in out:
        if "BRAK" in l or "UWAGA" in l: print("   ! " + l)
    if r.returncode: print(r.stdout, r.stderr); raise SystemExit("błąd w " + args[0])
for s in ("przesun.py", "granice.py", "wtyczki_kratki.py", "odstaw.py", "wyspa.py", "przystan.py", "zlew.py", "teren.py", "latarnia.py", "gladz.py", "drogi.py", "dostep.py", "furtki.py", "swiat.py"):
    run([s])
U, D, PL = os.path.join(STG, "swiat_uklad.json"), os.path.join(STG, "data"), os.path.join(STG, "js", "plugins")
run([os.path.join("tools", "mapy", "czerwona_brzegi2.py"), "--tylko-dane", "--uklad", U, "--dane-z", D, "--cw", os.path.join(PL, "CzerwonaWoda.js"), "--do", PL], cwd=ROOT)
run([os.path.join("tools", "laka", "woda_sasiadow.py"), "--uklad", U, "--dane-z", D, "--do", PL], cwd=ROOT)
run(["mapa_wyspy.py"])   # (the P menu's island map: its data; the real map's pictures - tools/plansza/obrazy.py, after shots)
print("gotowe: %s" % STG)
