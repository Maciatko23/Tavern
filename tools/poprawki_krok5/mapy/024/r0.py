import sys,os
sys.path.insert(0,'../..')
import krajobraz as KJ
L=KJ.L
mp=L.Mapa(24)
from collections import Counter
m=KJ.json.load(open(os.path.join(KJ.ROOT,'data/Map024.json'),encoding='utf-8'))
W,H=m['width'],m['height'];n=W*H;d=m['data']
for nm,(x0,y0,x1,y1) in {'N':(0,18,119,60),'SW':(0,86,45,116)}.items():
    c0=Counter();c1=Counter();c23=Counter()
    for y in range(y0,y1+1):
        for x in range(x0,x1+1):
            for z,c in ((0,c0),(1,c1)):
                t=d[z*n+y*W+x]
                if t: c[(t-2048)//48 if t>=2048 else t]+=1
            for z in (2,3):
                t=d[z*n+y*W+x]
                if t: c23[(z,t)]+=1
    print(nm,'z0',c0.most_common(),'\n z1',c1.most_common(),'\n z23',c23.most_common(30))
    im=L.render(mp,region=(x0,y0,x1,y1),grid=True,scale=0.5 if nm=='N' else 1.0)
    im.save('tmp/r0_%s.png'%nm)
print([ (e['id'],e['x'],e['y'],e['pages'][0]['image']['characterName']) for e in m['events'] if e and 18<=e['y']<=60 and e['pages'][0]['image']['characterName']])
