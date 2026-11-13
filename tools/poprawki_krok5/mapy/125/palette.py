import sys
sys.path.insert(0,'tools/mapy'); sys.stdout.reconfigure(encoding='utf-8')
import mapylib as L
from PIL import Image, ImageDraw
Z=L.zestaw(11)
lo,hi,cols=int(sys.argv[1]),int(sys.argv[2]),8
rows=(hi-lo+cols-1)//cols
S=2
im=Image.new('RGBA',(cols*(48*S+4)+0,rows*(48*S+14)),(60,90,60,255))
d=ImageDraw.Draw(im)
for i,t in enumerate(range(lo,hi)):
    x=(i%cols)*(48*S+4);y=(i//cols)*(48*S+14)
    try:
        tl=Z.tile(t)
        tl=tl.resize((48*S,48*S),Image.NEAREST)
        im.alpha_composite(tl,(x,y+12))
    except Exception as e: pass
    d.text((x+1,y),str(t),fill=(255,255,0,255))
im.save(sys.argv[3]);print(im.size)
