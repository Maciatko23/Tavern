import sys,json
sys.path.insert(0,"tools/mapy")
import mapylib
from PIL import ImageDraw
def load(n):
    return mapylib.Mapa(n, raw=json.load(open("data/Map%03d.json"%n,encoding="utf-8")))
def crop(mp,x0,y0,x1,y1,scale,out,box=None,grid=True):
    im=mapylib.render(mp,region=(x0,y0,x1,y1),scale=scale).convert("RGB")
    d=ImageDraw.Draw(im); s=48*scale
    if grid:
        for x in range(x0,x1+1):
            if x%5==0:
                X=(x-x0)*s; d.line([(X,0),(X,im.height)],fill=(255,255,255),width=1); d.text((X+2,2),str(x),fill=(255,255,0))
        for y in range(y0,y1+1):
            if y%5==0:
                Y=(y-y0)*s; d.line([(0,Y),(im.width,Y)],fill=(255,255,255),width=1); d.text((2,Y+2),str(y),fill=(255,255,0))
    if box:
        a,b,c,e=box; d.rectangle([(a-x0)*s,(b-y0)*s,(c+1-x0)*s,(e+1-y0)*s],outline=(255,0,0),width=3)
    im.save(out); return im
if __name__=="__main__":
    n=int(sys.argv[1]); mp=load(n)
    crop(mp,0,0,120,120,0.2,"docs/audyt_map/_robocze2/ov%d.png"%n,grid=True)
    for i in range(4):
        for j in range(4):
            crop(mp,j*30,i*30,j*30+30,i*30+30,0.5,"docs/audyt_map/_robocze2/c%d_%d%d.png"%(n,i,j))
