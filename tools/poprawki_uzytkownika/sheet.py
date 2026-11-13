import sys, json, os
from PIL import Image, ImageDraw
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
T=json.load(open(ROOT+'/data/Tilesets.json',encoding='utf-8'))
def sheet_for(ts, tid):
    names=T[ts]['tilesetNames']
    if tid<256: return Image.open(ROOT+'/img/tilesets/'+names[5]+'.png').convert('RGBA'), tid
    if tid<512: return Image.open(ROOT+'/img/tilesets/'+names[6]+'.png').convert('RGBA'), tid-256
    if tid<768: return Image.open(ROOT+'/img/tilesets/'+names[7]+'.png').convert('RGBA'), tid-512
    return Image.open(ROOT+'/img/tilesets/'+names[8]+'.png').convert('RGBA'), tid-768
def cell(ts,t):
    im,n=sheet_for(ts,t); col=n%8+(n//128)*8; row=(n%128)//8
    return im.crop((col*48,row*48,col*48+48,row*48+48))
def show(ts, ids, out, ncol=8, scale=2):
    W=Image.new('RGBA',(ncol*100,((len(ids)+ncol-1)//ncol)*100),(60,110,60,255)); d=ImageDraw.Draw(W)
    for k,t in enumerate(ids):
        c=cell(ts,t).resize((96,96),Image.NEAREST); x=(k%ncol)*100; y=(k//ncol)*100
        W.alpha_composite(c,(x,y)); d.text((x+2,y+2),str(t),fill=(255,255,0,255))
    W.save(out)
if __name__=="__main__":
    ts=int(sys.argv[1]); ids=[int(a) for a in sys.argv[3:]]; show(ts,ids,sys.argv[2])
