import sys,json
sys.path.insert(0,"tools/mapy")
import mapylib
from PIL import ImageDraw
for mid in (4,3,20):
    mp=mapylib.Mapa(mid,raw=json.load(open("data/Map%03d.json"%mid,encoding="utf-8")))
    for gy in range(0,120,30):
        for gx in range(0,120,30):
            im=mapylib.render(mp,region=(gx,gy,gx+29,gy+29),scale=0.5).convert("RGB")
            if im.width>1000: im=im.resize((720,720))
            s=im.width/30
            d=ImageDraw.Draw(im)
            for i in range(0,30,5):
                d.line([(i*s,0),(i*s,im.height)],fill=(255,255,0),width=1)
                d.line([(0,i*s),(im.width,i*s)],fill=(255,255,0),width=1)
                d.text((i*s+2,2),str(gx+i),fill=(255,255,0))
                d.text((2,i*s+2),str(gy+i),fill=(255,255,0))
            im.save("docs/audyt_map/_robocze3/c/%d_%d_%d.png"%(mid,gx,gy))
    im=mapylib.render(mp,scale=0.15).convert("RGB"); im.save("docs/audyt_map/_robocze3/c/%d_all.png"%mid); print(mid,im.size)
