import sys,collections
sys.path.insert(0,'tools/mapy'); import mapylib as L
import numpy as np
for mid in [162,24,13,111,8,4,125,3,20]:
    mp=L.Mapa(mid); W,H=mp.W,mp.H;n=W*H
    r=np.array(mp.data[5*n:6*n]).reshape(H,W)
    for v in sorted(set(r.flatten())-{0}):
        ys,xs=np.where(r==v); print(mid,'reg',v,len(xs),'bbox',xs.min(),ys.min(),xs.max(),ys.max())
    c=collections.Counter()
    for e in mp.zd:
        if e.occupy and e.char and not L.NATURA_RX.match(e.char): c[e.char]+=1
        elif e.przenosi: c['TRANSFER']+=1
        elif e.widoczne and not e.occupy: c['vis:'+(e.char or 'tile%d'%e.tile_id)[:22]]+=1
    print(mid,dict(c.most_common(30)))
