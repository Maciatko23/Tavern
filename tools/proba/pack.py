import random
def pack(items, seed=0, tries=4000):
    """items: name->(w,h); two bins 8x16. returns name->(half,x,y) or None"""
    names=list(items); rnd=random.Random(seed)
    for _ in range(tries):
        order=sorted(names,key=lambda n:-items[n][1]*(1+rnd.random()*0.6)) if rnd.random()<.5 else rnd.sample(names,len(names))
        grids=[[[0]*8 for _ in range(16)] for _ in range(2)]; res={}; ok=True
        for n in order:
            w,h=items[n]; placed=False
            opts=[(b,y,x) for b in range(2) for y in range(16-h+1) for x in range(8-w+1)]
            if rnd.random()<.5: opts.sort()
            else: rnd.shuffle(opts)
            for b,y,x in opts:
                g=grids[b]
                if all(g[y+j][x+i]==0 for j in range(h) for i in range(w)):
                    for j in range(h):
                        for i in range(w): g[y+j][x+i]=1
                    res[n]=(b,x,y); placed=True; break
            if not placed: ok=False; break
        if ok: return res
    return None
