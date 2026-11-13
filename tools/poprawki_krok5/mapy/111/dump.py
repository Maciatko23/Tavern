import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from krajobraz import *
K = Krajobraz(111)
x0,y0,x1,y1 = map(int, sys.argv[1:5])
print("tileset", K.m["tilesetId"], K.W, K.H)
def ch(x,y):
    k0=K.kind(0,x,y); k1=K.kind(1,x,y)
    s=K.g(2,x,y) or K.g(3,x,y)
    c = {16:'.',27:',',17:'=',None:'?'}.get(k0, chr(ord('a')+ (k0 or 0)%26) if k0 else '?')
    if k0 is None: c='?'
    if k1: c = {22:'#',21:'^',46:'%'}.get(k1,'k') 
    if s and not k1: c='*'
    return c
print("    "+"".join(str((x//10)%10) if x%10==0 else ' ' for x in range(x0,x1+1)))
for y in range(y0,y1+1):
    print("%3d "%y+"".join(ch(x,y) for x in range(x0,x1+1)))
