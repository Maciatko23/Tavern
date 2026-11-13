import sys, json
sys.path.insert(0,"tools/mapy")
import mapylib
from PIL import ImageDraw
def load(mid):
    return mapylib.Mapa(mid, raw=json.load(open("data/Map%03d.json"%mid,encoding="utf-8")))
def crop(mp,x0,y0,x1,y1,scale=0.6,grid=5):
    im=mapylib.render(mp,region=(x0,y0,x1,y1),scale=scale).convert("RGB")
    d=ImageDraw.Draw(im); c=48*scale
    for x in range(x0,x1+1):
        if x%grid==0:
            px=(x-x0)*c; d.line([(px,0),(px,im.height)],fill=(255,255,0),width=1); d.text((px+2,2),str(x),fill=(255,255,0))
    for y in range(y0,y1+1):
        if y%grid==0:
            py=(y-y0)*c; d.line([(0,py),(im.width,py)],fill=(0,255,255),width=1); d.text((2,py+2),str(y),fill=(0,255,255))
    return im
if __name__=="__main__":
    mid=int(sys.argv[1]); mp=load(mid)
    import os; os.makedirs("docs/audyt_map/_robocze/k%d"%mid,exist_ok=True)
    for j in range(4):
        for i in range(4):
            x0,y0=i*30,j*30
            crop(mp,x0,y0,min(x0+31,120),min(y0+31,120)).save("docs/audyt_map/_robocze/k%d/%d_%d.png"%(mid,j,i))
    mapylib.render(mp,scale=0.2).save("docs/audyt_map/_robocze/k%d/all.png"%mid)
