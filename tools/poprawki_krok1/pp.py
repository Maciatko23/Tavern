import sys,json
sys.path.insert(0,"tools/mapy"); import mapylib
mid=int(sys.argv[1]); x0,y0,x1,y1=map(int,sys.argv[2:6]); out=sys.argv[6]; sc=float(sys.argv[7]) if len(sys.argv)>7 else 0.75
from PIL import Image
ims=[]
for p in ("data","tools/poprawki_krok1/staging/data"):
    mp=mapylib.Mapa(mid, raw=json.load(open("%s/Map%03d.json"%(p,mid),encoding="utf-8")))
    ims.append(mapylib.render(mp,region=(x0,y0,x1,y1),scale=sc))
w,h=ims[0].size; im=Image.new("RGB",(w,h*2+6),(255,0,0)); im.paste(ims[0],(0,0)); im.paste(ims[1],(0,h+6)); im.save(out)
