import sys
sys.path.insert(0,'../../mapy')
import mapylib as L
from PIL import Image
S='C:/Users/macie/AppData/Local/Temp/claude/c3e57add150ad202/b44c9f90-008a-41ac-a5d8-008fb42ca7be/scratchpad/'
boxes=[(13,(92,56,112,74)),(13,(91,90,110,106)),(13,(10,93,31,108)),(13,(29,93,48,108)),(125,(101,26,115,40)),(125,(92,42,108,55))]
ims=[]
for mid,r in boxes:
    mp=L.Mapa(mid,path='staging/data/Map%03d.json'%mid)
    ims.append(L.render(mp,region=r,scale=0.5).convert('RGB'))
def row(a):
    o=Image.new('RGB',(sum(i.width for i in a),max(i.height for i in a)));x=0
    for i in a: o.paste(i,(x,0)); x+=i.width
    return o
row(ims[:3]).save(S+'h1.png'); row(ims[3:]).save(S+'h2.png')
