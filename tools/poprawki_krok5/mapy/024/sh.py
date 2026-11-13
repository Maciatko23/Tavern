import sys,os
sys.path.insert(0,'../..')
import krajobraz as KJ
from PIL import Image,ImageDraw
L=KJ.L
S=L.zestaw(11)
# A2 kinds 16..47 sample (autotile base = 2048+k*48)
im=Image.new('RGBA',(8*72,5*72),(40,40,40,255));d=ImageDraw.Draw(im)
for i,k in enumerate(range(16,56)):
    t=S.tile(2048+k*48); 
    x,y=(i%8)*72,(i//8)*72; im.alpha_composite(t,(x,y)); d.text((x+34,y+34),str(k),fill=(255,255,0,255))
im.save('tmp/a2.png')
# D tiles 512..? B-E: ids: B=0-255,C=256-511,D=512-767,E=768-1023
for nm,base in (('D',512+0),('C',256),('B',0)):
    im=Image.new('RGBA',(16*40,16*40),(60,60,60,255));d=ImageDraw.Draw(im)
    for i in range(256):
        t=S.tile(base+i)
        x,y=(i%16)*40,(i//16)*40
        im.alpha_composite(t.resize((32,32)) if t.size!=(32,32) else t,(x,y))
        d.text((x,y),str(base+i),fill=(255,255,0,255))
    im.save('tmp/sh_%s.png'%nm)
print(S.tile(2048+16*48).size)
