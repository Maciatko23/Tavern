import sys,os,glob
from PIL import Image
def mosaic(d, W, H, out, cell=24, box=None):
    im=Image.new('RGB',(W*cell,H*cell),(0,0,0))
    for f in sorted(glob.glob(os.path.join(d,'*.png'))):
        x,y=map(int,os.path.basename(f)[:-4].split('_'))
        s=Image.open(f).convert('RGB'); s=s.crop((0,16,s.width,s.height)) if False else s
        im.paste(s,(x*cell,y*cell))
    if box: im=im.crop(tuple(v*cell for v in box))
    im.save(out)
if __name__=='__main__':
    d,W,H,out=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),sys.argv[4]
    box=tuple(map(int,sys.argv[5].split(','))) if len(sys.argv)>5 else None
    mosaic(d,W,H,out,box=box)
