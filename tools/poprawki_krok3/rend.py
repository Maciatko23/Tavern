import sys,os,json
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),"..",".."))
sys.path.insert(0,os.path.join(ROOT,"tools","mapy"));sys.path.insert(0,os.path.join(ROOT,"tools","rozszerzenia"))
import mapylib as L
def rend(mid,box,out,stg=False,scale=1.0,grid=True):
    raw=None
    if stg: raw=json.load(open(os.path.join(ROOT,"tools","poprawki_krok3","staging","data","Map%03d.json"%mid),encoding="utf-8"))
    mp=L.Mapa(mid,raw=raw) if raw else L.Mapa(mid)
    im=L.render(mp,region=box,grid=grid,scale=scale)
    im.save(out)
if __name__=="__main__":
    mid=int(sys.argv[1]);box=tuple(map(int,sys.argv[2].split(",")));rend(mid,box,sys.argv[3],"--stg" in sys.argv)
