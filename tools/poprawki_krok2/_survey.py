import sys,json,collections
sys.path.insert(0,'tools/mapy'); import mapylib as L
for mid in [162,24,13,111,8,4,125,3,20]:
    mp=L.Mapa(mid); W,H=mp.W,mp.H; n=W*H
    out=[]
    for z in range(4):
        c=collections.Counter()
        for t in mp.data[z*n:(z+1)*n]:
            if t==0: continue
            if t>=2048: c['A2k%d'%((t-2048)//48)]+=1
            elif t>=1536: c['A5']+=1
            elif t>=1024: c['A1_4']+=1
            else: c['BE']+=1
        out.append(dict(c.most_common(9)))
    print(mid,mp.tsid,mp.nazwa); 
    for z,o in enumerate(out): print('  z%d'%z,o)
    r=collections.Counter(mp.data[5*n:6*n]); print('  reg',dict(r))
    cat=collections.Counter()
    for e in mp.zd:
        if e.occupy: cat[e.char or 'tile']+=1
    print('  occupy',dict(cat.most_common(25)))
