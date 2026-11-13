import sys, os, json
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,"..","..",".."))
sys.path.insert(0, os.path.join(ROOT,"tools","mapy"))
import mapylib as L
# usage: rend.py out.png x0 y0 x1 y1 [staged]
out=sys.argv[1]; box=tuple(int(a) for a in sys.argv[2:6]); stg=len(sys.argv)>6
mp=L.Mapa(125, raw=json.load(open(os.path.join(HERE,"staging","data","Map125.json"),encoding="utf-8"))) if stg else L.Mapa(125)
L.render(mp, region=box, grid=True).convert("RGB").save(out)
