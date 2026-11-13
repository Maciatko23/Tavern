import sys; sys.path.insert(0,'C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/tools/miasto3')
from mlib import *
import mapylib, json
ts=load(STAGING+"data/Tilesets.json")
def mz(raw,mid):
    tid=raw['tilesetId']; t=ts[tid]
    z=mapylib.Zestaw(11); z.id=tid; z.pliki=t['tilesetNames']; z.flags=list(t['flags'])+[0]*(8192-len(t['flags'])); z._sheets={};z._tiles={};z._alpha={};z._bbox={}
    mapylib.zestaw=lambda i: z
    mp=mapylib.Mapa(mid,raw=raw); mp.zest=z; return mp
def shot(mid,reg,out,scale=0.4,staged=True):
    raw=load((STAGING+"data/Map%03d.json"%mid) if staged else ROOT+"data/Map%03d.json"%mid)
    im=mapylib.render(mz(raw,mid),region=reg,scale=scale); im.convert("RGB").save(out); return im.size
if __name__=="__main__":
    for mid,reg in ((24,(0,100,60,119)),(4,(0,0,20,60)),(3,(0,0,60,19)),(111,(100,30,119,119))):
        print(shot(mid,reg,ROOT+"docs/miasto3/sasiad_%d_po.png"%mid))
