import sys,os
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),"..","..",".."))
sys.path.insert(0,os.path.join(ROOT,"tools","mapy"))
import mapylib as L
from PIL import Image,ImageDraw
Z=L.Zestaw(11)
ids=[int(a) for a in sys.argv[2:]]
S=int(os.environ.get("S","64"))
im=Image.new("RGB",(len(ids)*(S+6),S+16),(120,100,140));d=ImageDraw.Draw(im)
for i,t in enumerate(ids):
    x=i*(S+6); d.text((x,0),str(t),fill=(255,255,0))
    tt=Z.tile(t).resize((S,S),Image.NEAREST); im.paste(tt,(x,14),tt)
im.save(sys.argv[1])
