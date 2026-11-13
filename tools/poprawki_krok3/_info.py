import sys,json
sys.path.insert(0,"tools/wzgorza_popraw")
import popraw as P
mid=int(sys.argv[1]);x0,y0,x1,y1=map(int,sys.argv[2].split(","))
import os;m=json.load(open((os.environ.get("STG","data")+"/Map%03d.json")%mid if "%" in os.environ.get("STG","data") else os.environ.get("STG","data")+"/Map%03d.json"%mid,encoding="utf-8"));W,H=m["width"],m["height"];d=m["data"]
for y in range(y0,y1+1):
    print("%3d "%y+" ".join(("%4d"%(d[y*W+x]-1536) if P.a5_of(d[y*W+x]) is not None else ("  g%d"%((d[y*W+x]-2048)//48) if d[y*W+x]>=2048 else "   .")) for x in range(x0,x1+1)))
print("    "+" ".join("%4d"%x for x in range(x0,x1+1)))
for e in m["events"]:
    if e and x0<=e["x"]<=x1 and y0<=e["y"]<=y1: print(e["id"],e["name"],e["x"],e["y"],e["pages"][0]["image"].get("characterName"))
