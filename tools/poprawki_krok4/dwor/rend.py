import sys, os, json
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as L
src = sys.argv[1]; box = tuple(int(v) for v in sys.argv[2:6]); out = sys.argv[6]; sc = float(sys.argv[7]) if len(sys.argv) > 7 else 0.667
m = L.Mapa(24) if src == "cur" else L.Mapa(24, raw=json.load(open(src, encoding="utf-8")))
L.render(m, region=box, scale=sc).convert("RGB").save(out)
