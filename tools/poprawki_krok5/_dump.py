import json,sys
src=sys.argv[5] if len(sys.argv)>5 else 'data/Map004.json'
m=json.load(open(src,encoding='utf-8'))
W,H=m['width'],m['height'];d=m['data'];n=W*H
x0,y0,x1,y1=map(int,sys.argv[1:5])
ev={}
for e in m['events']:
    if e: ev[(e['x'],e['y'])]=e
k=lambda t:(t-2048)//48 if t>=2048 else -1
ch={16:'.',6:'~',27:'g',17:'=',97:'#',24:'d',105:'#',22:'|',30:'|',38:'|'}
l1={46:'o',21:'-',39:':',28:'f',36:'s',31:'z',29:'y',17:'=',16:'.',27:'g',22:'|',30:'|',38:'|'}
def evc(e):
    nm=e['pages'][0]['image']['characterName']; t=e['pages'][0]['image']['tileId']
    if nm=='!$Pine_A':return 'A'
    if nm=='!$Pine_B':return 'B'
    if nm=='!$Pine_C':return 'C'
    if nm=='!$Tree_Small':return 't'
    if nm in('!$Tree_Apple','!$Tree_Pear'):return 'F'
    if 'Ore' in nm:return 'R'
    if 'Rock' in nm or 'Boulder' in nm:return 'r'
    if 'Bush' in nm:return 'u'
    if 'Stump' in nm:return 'S'
    if 'Trunk' in nm:return 'D'
    if nm=='' and t==516:return 'p'
    if nm=='' and t==678:return 'l'
    return 'E'
print('    '+''.join(str((x//10)%10) if x%10==0 else ' ' for x in range(x0,x1+1)))
print('    '+''.join(str(x%10) for x in range(x0,x1+1)))
for y in range(y0,y1+1):
    row=''
    for x in range(x0,x1+1):
        c=ch.get(k(d[y*W+x]),'?')
        t1=d[n+y*W+x]
        if t1: c=l1.get(k(t1),'!') if c in '.g=d' else c
        e=ev.get((x,y))
        if e: c=evc(e)
        row+=c
    print('%3d '%y+row)
