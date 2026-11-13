import sys, os
MYDIR=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(MYDIR,"..",".."))
from krajobraz import *
from PIL import Image, ImageDraw
S=L.zestaw(11)
# A2 kinds fill (shape 46) and isolated (shape 0)
im=Image.new("RGBA",(8*100,4*110),(40,40,40,255)); d=ImageDraw.Draw(im)
for i,k in enumerate(range(16,48)):
    cx,cy=(i%8)*100,(i//8)*110
    im.alpha_composite(S.tile(2048+k*48+46),(cx+2,cy+14)); im.alpha_composite(S.tile(2048+k*48+0),(cx+52,cy+14))
    d.text((cx+2,cy+1),str(k),fill=(255,255,0,255))
im.convert("RGB").save(os.path.join(MYDIR,"tmp","a2.png"))
