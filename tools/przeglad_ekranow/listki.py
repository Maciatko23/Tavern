# kontaktowe arkusze: 6 ekranów (2 kolumny x 3 rzędy) na obraz  -> zrzuty/_arkusze/<mapa>_<n>.png
import os, sys, glob, re
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__)); Z=os.path.join(HERE,'zrzuty'); O=os.path.join(Z,'_arkusze'); os.makedirs(O,exist_ok=True)
def key(f):
    m=re.match(r'(\d+)_(\d+)\.png',os.path.basename(f)); return (int(m.group(2)),int(m.group(1)))
def sheet(files,out,cols=2):
    ims=[Image.open(f).convert('RGB') for f in files]
    w=max(i.width for i in ims); h=max(i.height for i in ims); rows=(len(ims)+cols-1)//cols
    S=Image.new('RGB',(w*cols,h*rows),(40,0,40))
    for i,im in enumerate(ims): S.paste(im,((i%cols)*w,(i//cols)*h))
    S.save(out)
import numpy as np
def morze(f):
    a=np.array(Image.open(f).convert('RGB').crop((0,18,640,360))).astype(int)
    d=np.abs(a-np.array([107,138,113])).max(axis=2)
    red=(a[:,:,0]>a[:,:,1]+25)&(a[:,:,0]>90)&(a[:,:,2]<110)
    return ((d<14)|red).mean()
def main(maps):
    for m in maps:
        fs=sorted(glob.glob(os.path.join(Z,str(m),'*.png')),key=key); skip=[f for f in fs if morze(f)>0.93]; fs=[f for f in fs if f not in skip]; print(m,'morze pominięte',len(skip),[os.path.basename(f) for f in skip][:12])
        for o in glob.glob(os.path.join(O,str(m)+'_*.png')): os.remove(o)
        for n in range(0,len(fs),6): sheet(fs[n:n+6],os.path.join(O,'%s_%02d.png'%(m,n//6)))
if __name__=='__main__': main(sys.argv[1:])
