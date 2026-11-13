import sys, os, json
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,"..","..",".."))
def load(stg=False):
    p=os.path.join(HERE,"staging","data","Map125.json") if stg else os.path.join(ROOT,"data","Map125.json")
    return json.load(open(p,encoding="utf-8"))
def d(t):
    if t==0: return "."
    if t>=2048: return "a%d.%d"%((t-2048)//48,(t-2048)%48)
    if 1536<=t<1664: return "5:%d"%(t-1536)
    if t<256: return "B%d"%t
    if t<512: return "C%d"%(t-256)
    if t<768: return "D%d"%(t-512)
    if t<1024: return "E%d"%(t-768)
    return "t%d"%t
if __name__=="__main__":
    m=load(len(sys.argv)>6)
    x0,y0,x1,y1=map(int,sys.argv[1:5]); zs=[int(c) for c in sys.argv[5]]
    W,H=m["width"],m["height"]
    for z in zs:
        print("layer",z)
        print("     "+" ".join("%6d"%x for x in range(x0,x1+1)))
        for y in range(y0,y1+1):
            print("%4d "%y+" ".join("%6s"%d(m["data"][(z*H+y)*W+x]) for x in range(x0,x1+1)))
