import sys, os
MYDIR=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(MYDIR,"..",".."))
sys.path.insert(0, os.path.join(MYDIR,"..","..","..","mapy"))
import mapylib as L
ROOT=os.path.abspath(os.path.join(MYDIR,"..","..","..",".."))
def load(p): return L.Mapa(111,path=p)
b=load(os.path.join(ROOT,"data","Map111.json")); a=load(os.path.join(MYDIR,"staging","data","Map111.json"))
starts=[(107,10),(50,2)]
rb=b.flood(starts); ra=a.flood(starts)
print("reach before",len(rb),"after",len(ra))
ZON=[(26,3,101,29),(29,98,110,116)]
def inz(c): return any(x0<=c[0]<=x1 and y0<=c[1]<=y1 for (x0,y0,x1,y1) in ZON)
def inside(m): return {(x,y) for x in range(m.W) for y in range(m.H) if m.stoi(x,y)}
sb,sa=inside(b),inside(a)
print("standable cells in zones before",len([c for c in sb if inz(c)]),"after",len([c for c in sa if inz(c)]),"reach in zones before",len([c for c in rb if inz(c)]),"after",len([c for c in ra if inz(c)]))
pockets=[c for c in sa if inz(c) and c not in ra]; pb=[c for c in sb if inz(c) and c not in rb]
print("pockets (standable, unreachable) in zones before",len(pb),"after",len(pockets), pockets[:30])
print("outside zones reach diff", len({c for c in rb if not inz(c)} ^ {c for c in ra if not inz(c)}))
miej=[(e["name"],e["x"],e["y"]) for e in a.raw["events"] if e and e["name"].startswith("Miejsce")]
bad=[m for m in miej if (m[1],m[2]) not in ra and (m[1],m[2]) in rb]
print("spots unreachable that were reachable:",bad)
# edges
for name,cells in (("N band",[(x,y) for x in range(20,118) for y in range(0,3)]),("S band",[(x,y) for x in range(4,120) for y in range(117,120)])):
    print(name,"reach before",sum(c in rb for c in cells),"after",sum(c in ra for c in cells))
