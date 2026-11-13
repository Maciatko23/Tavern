import sys,os
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),"..","..",".."))
sys.path.insert(0,os.path.join(ROOT,"tools","mapy"))
import mapylib as L
from PIL import Image,ImageDraw
Z=L.Zestaw(11)
blk=[[3,2,6],[1,0,4],[9,8,12]]
a,b=int(sys.argv[1]),int(sys.argv[2]); cols=int(sys.argv[3])
rows=(b-a+cols)//cols
S=int(sys.argv[4]) if len(sys.argv)>4 else 32
im=Image.new("RGB",(cols*(3*S+10),rows*(3*S+16)),(60,0,60));d=ImageDraw.Draw(im)
for k in range(a,b+1):
    i=k-a;ox=(i%cols)*(3*S+10);oy=(i//cols)*(3*S+16)
    d.text((ox,oy),str(k),fill=(255,255,0))
    for r in range(3):
        for c in range(3):
            t=Z.tile(2048+k*48+blk[r][c]).resize((S,S),Image.NEAREST)
            im.paste(t,(ox+c*S,oy+14+r*S),t)
im.save(sys.argv[5] if len(sys.argv)>5 else "kinds.png")
