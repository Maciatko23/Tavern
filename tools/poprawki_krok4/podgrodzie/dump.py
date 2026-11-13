import sys,os,json
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),"..","..",".."))
def load(stg=False):
    p=os.path.join(ROOT,"tools","poprawki_krok4","podgrodzie","staging","data","Map111.json") if stg else os.path.join(ROOT,"data","Map111.json")
    return json.load(open(p,encoding="utf-8"))
def code(t):
    if t==0: return "  . "
    if t>=2048: return "a%02d%02d"%((t-2048)//48,(t-2048)%48) if False else "%2d.%02d"%((t-2048)//48,(t-2048)%48)
    if t>=1536: return "5:%03d"%(t-1536)
    return "%4d"%t
if __name__=="__main__":
    x0,y0,x1,y1=map(int,sys.argv[1].split(","));z=int(sys.argv[2]);stg="--stg" in sys.argv
    m=load(stg);W=m["width"];H=m["height"]
    print("     "+" ".join("%5d"%x for x in range(x0,x1+1)))
    for y in range(y0,y1+1):
        print("%3d: "%y+" ".join("%5s"%code(m["data"][(z*H+y)*W+x]) for x in range(x0,x1+1)))
