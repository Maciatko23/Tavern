import sys, os
MYDIR=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(MYDIR,"..",".."))
from krajobraz import *
from PIL import Image, ImageDraw
S=L.zestaw(11)
for name,base in (("B",0),("C",256),("D",512),("E",768)):
    for half in (0,1):
        im=Image.new("RGBA",(8*64,16*64),(60,60,70,255)); d=ImageDraw.Draw(im)
        for j in range(128):
            tid=base+half*128+j
            cx,cy=(j%8)*64,(j//8)*64
            if (j//8+j%8)%2: d.rectangle([cx,cy,cx+63,cy+63],fill=(70,70,84,255))
            im.alpha_composite(S.tile(tid),(cx+8,cy+10)) if S.tile(tid) else None
            d.text((cx+2,cy+1),str(tid),fill=(255,255,0,255))
        im.convert("RGB").save(os.path.join(MYDIR,"tmp","t_%s%d.png"%(name,half)))
