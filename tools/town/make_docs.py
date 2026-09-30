# python make_docs.py [--game]   -> docs/miasteczko/ (and tools/town/staging/, tools/town/prefabs/)
# One command for everything of the town: the author's sample maps rendered (winlu.py -> docs/miasteczko/winlu_probki/), the
# fidelity test against the user's reference pictures (fidelity.py -> wiernosc_N.png), the prefab library and its gallery
# (prefabs.py -> tools/town/prefabs/, prefaby.png), the proposed town tileset 11 (town_tileset.py), a street of prefabs
# (street_test.py -> proba_ulicy.png); the chosen town C of prefabs (build_miasteczko.py, check_miasteczko.py,
# render_miasteczko.py -> miasteczko_C*.png); then the first layout concepts: the props sheet (build_town_props.py), the staged tileset 9 with its C / E sheets
# (build_tileset.py), the three concept maps (build_town.py), the placement checks (check_town.py - stops if anything
# fails), the pictures (render_town.py: koncepcja_X.png, _blokady.png, _czysta.png - drawn in Python, byte-identical on a
# rerun) and the harness overlays (make_overlay.py). --game also takes the daytime game screens in the real game
# (shot_town.js, CDP port 9412, the game served at 127.0.0.1:8765): koncepcja_X_gra_N.png - these depend on the renderer
# (GPU, clouds), so they are not byte-identical. Nothing here writes data/, js/ or img/.
import os, sys, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))

def run(*args):
    r = subprocess.run([sys.executable] + list(args), cwd=HERE)
    if r.returncode: sys.exit("%s failed" % args[0])

def main():
    # the prefab route (2026-09-29 evening): the author's sample maps, the fidelity test, the prefabs, the town tileset, the street
    run("winlu.py", "render")
    run("fidelity.py")
    run("prefabs.py")
    run("town_tileset.py")
    run("street_test.py")
    # the first layout concepts A / B / C (generated buildings; kept as layout ideas)
    run("build_town_props.py")
    run("build_tileset.py")
    run("build_town.py")
    run("check_town.py")
    run("render_town.py")
    run("make_overlay.py")
    # the chosen town (2026-09-29 evening): layout C built from the author's prefabs on tileset 11, walls all round
    run("build_miasteczko.py")
    run("check_miasteczko.py")
    run("render_miasteczko.py", *(["--game"] if "--game" in sys.argv else []))
    if "--game" in sys.argv:
        env = dict(os.environ, CDP_PORT=os.environ.get("CDP_PORT", "9412"))
        for c in "ABC":
            subprocess.run(["node", os.path.join(HERE, "shot_town.js"), c, os.path.join(ROOT, "docs", "miasteczko")], cwd=ROOT, env=env)
    print("docs ->", os.path.join(ROOT, "docs", "miasteczko"))

if __name__ == "__main__":
    main()
