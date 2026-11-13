import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from krajobraz import *
K = Krajobraz(3)
for y in range(56,70):
    print(y, [ (x,K.kind(0,x,y),K.kind(1,x,y)) for x in list(range(5,13))+list(range(44,54)) if K.kind(1,x,y) is not None or K.kind(0,x,y)!=16])
# distinct tile ids on layers 2,3 in region
from collections import Counter
c=Counter(); c0=Counter(); c1=Counter()
for y in range(62,90):
    for x in range(120):
        for z in (2,3):
            v=K.g(z,x,y)
            if v: c[(z,v)]+=1
        c0[K.kind(0,x,y)]+=1; c1[K.kind(1,x,y)]+=1
print(c.most_common(40)); print(c0, c1)
print(K.m['tilesetId'])
