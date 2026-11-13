import os, numpy as np
from PIL import Image, ImageDraw
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,"..",".."))
im=np.array(Image.open(os.path.join(ROOT,"img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/tilesets/Fantasy_Inside_Shops.png")).convert("RGBA")).astype(int)
boxes={"kufel":(258,566,290,610),"chleb":(194,462,232,496),"miska_pusta":(194,552,232,594),"miska":(294,568,334,606),"pieczen":(96,560,140,600)}
tiles=[]
for k,(x0,y0,x1,y1) in boxes.items():
    tiles.append((k,Image.fromarray(im[y0:y1,x0:x1].astype(np.uint8))))
W=sum(t.width*6+10 for _,t in tiles)+10; H=max(t.height*6 for _,t in tiles)+30
o=Image.new("RGB",(W,H),(40,40,40)); d=ImageDraw.Draw(o); x=10
for k,t in tiles:
    o.paste(t.convert("RGB").resize((t.width*6,t.height*6),Image.NEAREST),(x,25)); d.text((x,5),k,fill=(255,255,0))
    for gx in range(0,t.width+1,8): d.line([(x+gx*6,25),(x+gx*6,25+t.height*6)],fill=(90,90,90))
    x+=t.width*6+10
o.save(os.path.join(HERE,"kandydaci.png")); print(o.size)
