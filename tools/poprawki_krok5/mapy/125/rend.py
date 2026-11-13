import sys,os
sys.path.insert(0,'tools/mapy'); sys.stdout.reconfigure(encoding='utf-8')
import mapylib as L
src=sys.argv[1]; out=sys.argv[2]; reg=tuple(int(v) for v in sys.argv[3].split(','))
mp=L.Mapa(125, path=src if src!='-' else None)
im=L.render(mp, region=reg, grid=True, scale=float(sys.argv[4]) if len(sys.argv)>4 else 0.6)
im.save(out); print(im.size)
