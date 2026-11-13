# render of a (staged) map region with the STAGED Tilesets.json:  SC=0.75 python rend.py <map> x0 y0 x1 y1 out.png [staging|live]
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy")); import mapylib as L
mid = int(sys.argv[1]); x0, y0, x1, y1 = map(int, sys.argv[2:6]); out = sys.argv[6]; mode = sys.argv[7] if len(sys.argv) > 7 else "staging"
sc = float(os.environ.get("SC", "0.5"))
stg = os.path.join(HERE, "staging", "data")
if mode == "staging":
    orig = L.load_json
    def lj(p, *a, **k):
        if p.endswith("Tilesets.json") and os.path.exists(os.path.join(stg, "Tilesets.json")): p = os.path.join(stg, "Tilesets.json")
        return orig(p, *a, **k)
    L.load_json = lj
src = os.path.join(stg, "Map%03d.json" % mid) if mode == "staging" and os.path.exists(os.path.join(stg, "Map%03d.json" % mid)) else None
mp = L.Mapa(mid, path=src) if src else L.Mapa(mid)
im = L.render(mp, region=(x0, y0, x1, y1), scale=sc)
im.convert("RGB").save(out)
