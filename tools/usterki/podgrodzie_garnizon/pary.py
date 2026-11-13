import os, sys
from PIL import Image, ImageDraw, ImageFont
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..','..'))
import glob
def big(mid,mode):
    d=os.path.join(ROOT,'tools','przeglad_ekranow','zrzuty',str(mid)) if mode=='before' else os.path.join(HERE,'zrzuty_po',str(mid))
    b=Image.new('RGB',(120*24,120*24))
    for f in glob.glob(os.path.join(d,'*.png')):
        x,y=map(int,os.path.basename(f)[:-4].split('_')); b.paste(Image.open(f).convert('RGB'),(x*24,y*24))
    return b
PAIRS={111:[
 ('12-18','rows 12-18: row of trees on a fence (north palisade removed, trees spread irregularly)',(22,26,60,38)),
 ('02','row 02: paddock - one ground, hay stack inside',(25,2,45,17)),
 ('23-37','rows 23,34,37: bushes/trees on the village palisade moved off it',(28,34,50,46)),
 ('23-37b','rows 23,34,37 (east): trees off the palisade',(60,34,98,46)),
 ('36','row 36: pens - gates with posts',(74,38,96,50)),
 ('21-26','rows 21,22,26,44,46,66,69: yard gates with posts',(20,64,50,74)),
 ('53-54','rows 53,54: fence stub + gap closed',(34,54,52,64)),
 ('55-72','rows 55,72: plaza outline rounded, dead tree on grass',(48,52,80,76)),
 ('118-119','rows 118,119,120: big pen - gates with posts, west side closed, rounded ground',(30,106,60,119)),
 ('96-104','rows 96,97,104: trees off the south palisade',(26,88,80,99)),
 ('86-94','rows 86,94,101: gaps get gate posts',(74,66,106,76)),
 ('09','row 09: gate by the north road gets a matching palisade run on its west side',(98,14,118,26)),
 ('03-04','rows 03,04: right field block - the two bare ridge rows get planted beds',(59,8,96,22)),
 ('74-82','rows 74,82,36: rain barrels moved off the wall / fence',(72,60,86,70)),
 ('ground','rows 05,08,24-31,35,39,65,67,71,73,88-90,98-100,105-109,117: dark-grass and dirt patches rounded',(26,36,60,52)),
 ],162:[
 ('27','row 27: trees off the garrison south palisade',(44,54,82,72)),
 ('32-33','rows 32,33: horse pasture - tree off fence, one ground',(90,78,116,96)),
 ('03-09','rows 03,04,07,09,15,19,22: garrison ground patches rounded, irregular edges',(36,26,70,44)),
 ('10-23','rows 10,15,22,23: north-east dirt/grass edges',(74,20,122,50)),
 ]}
try: F=ImageFont.truetype('arial.ttf',18)
except Exception: F=ImageFont.load_default()
for mid,lst in PAIRS.items():
    B,A=big(mid,'before'),big(mid,'after')
    od=os.path.join(ROOT,'docs','usterki',str(mid)); os.makedirs(od,exist_ok=True)
    for n,cap,(x0,y0,x1,y1) in lst:
        box=((x0)*24,(y0)*24,(x1+1)*24,(y1+1)*24)
        a,b=B.crop(box),A.crop(box)
        sc=min(1.6, 1000/ a.width) if a.width<700 else 1.0
        if sc!=1: a=a.resize((int(a.width*sc),int(a.height*sc)),Image.LANCZOS); b=b.resize(a.size,Image.LANCZOS)
        im=Image.new('RGB',(a.width*2+10,a.height+30),(20,20,20)); im.paste(a,(0,30)); im.paste(b,(a.width+10,30))
        d=ImageDraw.Draw(im); d.text((6,6),'BEFORE  | Map%d %s'%(mid,cap),fill=(255,230,80),font=F); d.text((a.width+16,6),'AFTER',fill=(120,255,120),font=F)
        im.save(os.path.join(od,'%s.png'%n)); print(mid,n,im.size)
