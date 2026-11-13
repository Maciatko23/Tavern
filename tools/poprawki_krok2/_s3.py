import sys,json,copy
sys.path.insert(0,'tools/rozszerzenia'); import wspolne as WS
for mid in [162,24,13,111,4,125,3,20]:
    m=json.load(open('data/Map%03d.json'%mid,encoding='utf-8'))
    W,H=m['width'],m['height']; d0=list(m['data'])
    mm=copy.deepcopy(m)
    WS.reshape(mm,0,[(x,y) for y in range(H) for x in range(W)])
    diff=[(i%W,i//W) for i in range(W*H) if mm['data'][i]!=d0[i]]
    print(mid,len(diff),diff[:6])
