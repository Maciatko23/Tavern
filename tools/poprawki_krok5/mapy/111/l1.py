import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from krajobraz import *
K = Krajobraz(111)
import collections
for (x0,y0,x1,y1) in [(22,0,100,29),(30,98,110,119)]:
    c=collections.defaultdict(list)
    for y in range(y0,y1+1):
        for x in range(x0,x1+1):
            k=K.kind(1,x,y)
            if k: c[k].append((x,y))
            for z in (4,5):
                v=K.g(z,x,y)
                if v: c["z%d_%d"%(z,v)].append((x,y))
            if K.kind(0,x,y) not in (16,): c["g0_%s"%K.kind(0,x,y)].append((x,y))
    for k,v in c.items(): print((x0,y0),k,len(v),v[:14])
