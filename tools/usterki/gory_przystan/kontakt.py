import sys
from PIL import Image
S='C:/Users/macie/AppData/Local/Temp/claude/c3e57add150ad202/b44c9f90-008a-41ac-a5d8-008fb42ca7be/scratchpad/'
mid=int(sys.argv[1]); name=sys.argv[2]; ids=sys.argv[3:]
w=int(640); cols=2; ims=[]
for i in ids:
    im=Image.open('../../../docs/przeglad_ekranow/%d/%s.png'%(mid,i)).convert('RGB')
    r=w/im.width; ims.append(im.resize((w,int(im.height*r))))
rows=(len(ims)+cols-1)//cols
hs=[max(i.height for i in ims[r*cols:(r+1)*cols]) for r in range(rows)]
S_=Image.new('RGB',(w*cols,sum(hs)),(0,0,0));y=0
for r in range(rows):
    for c in range(cols):
        k=r*cols+c
        if k<len(ims): S_.paste(ims[k],(c*w,y))
    y+=hs[r]
S_.save(S+name)
