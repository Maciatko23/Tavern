import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from krajobraz import *
K = Krajobraz(3)
print(K.W, K.H, K.liczba())
x0,y0,x1,y1 = 0,56,119,119
sym = {16:'.',17:'=',27:',',24:'~',None:' '}
ev = {}
for e in K.eventy():
    k = klasa(e) or '?'
    ch = {'sosnaA':'A','sosnaB':'B','sosnaC':'C','male':'t','jablon':'J','grusza':'G','martwe':'D','pieniekW':'S','krzak':'b','skala':'R','ruda':'O','pieniek':'s','kloda':'l','?':'?'}[k]
    for c in stopa(e): ev[c]=ch
for y in range(y0,y1+1):
    row=''
    for x in range(x0,x1+1):
        if (x,y) in ev: row+=ev[(x,y)]; continue
        k=K.kind(0,x,y); k1=K.kind(1,x,y)
        if k1 in (22,): row+='#'; continue
        if k1 in (46,): row+='f'; continue
        if k1 is not None: row+='o'; continue
        row+=sym[k] if k in sym else str((k or 0)%10)
    print("%3d %s"%(y,row))
