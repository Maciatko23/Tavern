import sys,json
sys.path.insert(0,"tools/mapy")
import mapylib
from PIL import ImageDraw
_c={}
def crop(mid,x0,y0,x1,y1,out,sc=0.6,box=None,grid=True):
    if mid not in _c: _c[mid]=mapylib.Mapa(mid,raw=json.load(open("data/Map%03d.json"%mid,encoding="utf-8")))
    im=mapylib.render(_c[mid],region=(x0,y0,x1,y1),scale=sc).convert("RGB")
    s=48*sc;d=ImageDraw.Draw(im)
    if grid:
        for x in range(x0,x1+1):
            if x%5==0:
                d.line([((x-x0)*s,0),((x-x0)*s,im.height)],fill=(255,255,0)); d.text(((x-x0)*s+2,2),str(x),fill=(255,255,0))
        for y in range(y0,y1+1):
            if y%5==0:
                d.line([(0,(y-y0)*s),(im.width,(y-y0)*s)],fill=(255,255,0)); d.text((2,(y-y0)*s+2),str(y),fill=(255,255,0))
    if box:
        bx0,by0,bx1,by1=box
        d.rectangle([(bx0-x0)*s,(by0-y0)*s,(bx1+1-x0)*s,(by1+1-y0)*s],outline=(255,0,0),width=3)
    im.save(out); return im
if __name__=="__main__":
    a=sys.argv; crop(int(a[1]),*map(int,a[2:6]),a[6],float(a[7]) if len(a)>7 else 0.6)
