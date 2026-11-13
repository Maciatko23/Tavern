import sys,json
sys.path.insert(0,'tools/mapy'); import mapylib as L
mid,x0,y0,x1,y1=map(int,sys.argv[1:6]); src=sys.argv[6] if len(sys.argv)>6 else None
mp=L.Mapa(mid,path=src) if src else L.Mapa(mid)
for z in (0,1,2,3,4,5):
    print('layer',z)
    for y in range(y0,y1+1):
        print('%3d '%y+' '.join('%4d'%mp.t(z,x,y) for x in range(x0,x1+1)))
for e in mp.raw['events']:
    if e and x0<=e['x']<=x1 and y0<=e['y']<=y1:
        g=e['pages'][0]['image']; print('ev',e['id'],e['name'],e['x'],e['y'],g.get('characterName'),g.get('tileId'))
