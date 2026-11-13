# composite non-autotile tiles (layers 2,3) of a region over a magenta bg: python comp.py x0 y0 x1 y1 out.png [stg]
import sys, json, os
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
x0,y0,x1,y1=map(int,sys.argv[1:5]); out=sys.argv[5]
p = os.path.join(ROOT,"tools/usterki/miasto/staging/data/Map008.json") if len(sys.argv)>6 else os.path.join(ROOT,"data/Map008.json")
m=json.load(open(p,encoding='utf-8'));W=m['width'];H=m['height'];D=m['data']
base="img/tilesets/Styl_B/Winlu Fantasy Tileset - Exterior/"
names=["Fantasy_Tileset_Green_Edition_upgrade/tilesets/Fantasy_Outside_B_green.png","Winlu Fantasy Exterior/tilesets/Fantasy_Outside_C.png","Fantasy_Tileset_Green_Edition_upgrade/tilesets/Fantasy_Outside_D_green.png","Winlu Fantasy Exterior/tilesets/Fantasy_Roofs.png"]
sh=[Image.open(os.path.join(ROOT,base+n)).convert('RGBA') for n in names]
bg=Image.new('RGBA',((x1-x0+1)*48,(y1-y0+1)*48),(255,0,255,255))
for z in (2,3):
  for y in range(y0,y1+1):
    for x in range(x0,x1+1):
      v=D[z*W*H+y*W+x]
      if 0<v<2048:
        si=v//256; j=v%256; sx=(j//128)*8+j%8; sy=(j%128)//8
        t=sh[si].crop((sx*48,sy*48,sx*48+48,sy*48+48)) if si<4 else None
        if t: bg.paste(t,((x-x0)*48,(y-y0)*48),t)
bg.resize((bg.width*2,bg.height*2),Image.NEAREST).save(out)
