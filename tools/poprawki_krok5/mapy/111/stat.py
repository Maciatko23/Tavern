import sys, os, collections
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from krajobraz import *
K = Krajobraz(111)
for (x0,y0,x1,y1) in [(22,0,100,29),(30,98,110,119)]:
    for z in range(4):
        c=collections.Counter()
        for y in range(y0,y1+1):
            for x in range(x0,x1+1):
                t=K.g(z,x,y)
                if z<2: t = ("k%s"%K.kind(z,x,y)) if t>=2048 else t
                c[t]+=1
        print((x0,y0),z,dict(c.most_common(25)))
    ev=[e for e in K.eventy() if x0<=e["x"]<=x1 and y0<=e["y"]<=y1]
    print(len(ev),"events"); 
    for e in ev:
        im=e["pages"][0]["image"]; print(e["id"],e["name"],e["x"],e["y"],im["characterName"],im["tileId"],e["note"][:40].replace("\n"," "))
print(K.liczba(), len(K.ev))
