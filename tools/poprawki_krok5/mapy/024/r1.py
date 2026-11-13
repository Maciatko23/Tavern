import sys
sys.path.insert(0,'../..')
import krajobraz as KJ
L=KJ.L
mp=L.Mapa(24)
L.render(mp,region=(0,46,119,80),grid=True,scale=0.5).save('tmp/r1.png')
m=KJ.json.load(open(KJ.ROOT+'/data/Map024.json',encoding='utf-8'))
W,H=120,120;n=W*H;d=m['data']
# coast per x
cy=[max([y for y in range(0,40) if d[y*W+x]>=2048 and (d[y*W+x]-2048)//48 in (6,)]+[-1]) for x in range(W)]
print('coast',cy)
# region ids in north
from collections import Counter
print(Counter(d[5*n+y*W+x] for y in range(18,60) for x in range(W)))
print(Counter(d[4*n+y*W+x] for y in range(18,60) for x in range(W)))
