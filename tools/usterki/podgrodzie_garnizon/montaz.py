# usage: montaz.py MAP before|after out.png [x0 y0 x1 y1 (tiles)] [scale]  - whole map (or window) from the 0.5-scale screen shots
import sys, os, glob
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..','..'))
mid=sys.argv[1]; mode=sys.argv[2]; out=sys.argv[3]
d=os.path.join(ROOT,'tools','przeglad_ekranow','zrzuty',mid) if mode=='before' else os.path.join(HERE,'zrzuty_po',mid)
big=Image.new('RGB',(120*24,120*24),(0,0,0))
for f in glob.glob(os.path.join(d,'*.png')):
    x,y=map(int,os.path.basename(f)[:-4].split('_')); im=Image.open(f).convert('RGB'); big.paste(im,(x*24,y*24))
a=[int(v) for v in sys.argv[4:8]] if len(sys.argv)>7 and sys.argv[4].lstrip('-').isdigit() else None
if a: big=big.crop((a[0]*24,a[1]*24,(a[2]+1)*24,(a[3]+1)*24))
sc=float(sys.argv[8]) if len(sys.argv)>8 else 1.0
if sc!=1: big=big.resize((int(big.width*sc),int(big.height*sc)),Image.LANCZOS)
big.save(os.path.join(HERE,'tmp',out) if not os.path.isabs(out) else out); print(big.size)
