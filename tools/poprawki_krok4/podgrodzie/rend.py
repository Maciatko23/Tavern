import sys,os,json
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),"..","..",".."))
sys.path.insert(0,os.path.join(ROOT,"tools","mapy"));sys.path.insert(0,os.path.join(ROOT,"tools","rozszerzenia"))
import mapylib as L
def rend(box,out,stg=False,scale=1.0,grid=True):
    raw=json.load(open(os.path.join(ROOT,"tools","poprawki_krok4","podgrodzie","staging","data","Map111.json"),encoding="utf-8")) if stg else None
    mp=L.Mapa(111,raw=raw) if raw else L.Mapa(111)
    L.render(mp,region=box,grid=grid,scale=scale).save(out)
if __name__=="__main__":
    box=tuple(map(int,sys.argv[1].split(",")));rend(box,sys.argv[2],"--stg" in sys.argv,grid="--nogrid" not in sys.argv)
