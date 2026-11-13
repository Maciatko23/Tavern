import sys, os, json
from PIL import Image
MYDIR=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(MYDIR,"..",".."))
from krajobraz import *
# usage: render.py out.png x0 y0 x1 y1 [staging|data]
out=sys.argv[1]; x0,y0,x1,y1=map(int,sys.argv[2:6]); src=sys.argv[6] if len(sys.argv)>6 else "data"
p = os.path.join(ROOT,"data","Map111.json") if src=="data" else os.path.join(MYDIR,"staging","data","Map111.json")
mp=L.Mapa(111,path=p)
im=L.render(mp,region=(x0,y0,x1,y1),grid=("grid" in sys.argv))
im=im.convert("RGB")
im.save(out); print(im.size)
if "half" in sys.argv:
    im.resize((im.width//2, im.height//2), Image.LANCZOS).save(out)
