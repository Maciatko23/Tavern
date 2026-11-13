import sys
sys.path.insert(0,"docs/audyt_map/_robocze")
import kadry
mid,x0,y0,x1,y1=map(int,sys.argv[1:6]); sc=float(sys.argv[6]) if len(sys.argv)>6 else 1.0
mp=kadry.load(mid); kadry.crop(mp,x0,y0,x1,y1,scale=sc,grid=1000).save(sys.argv[7] if len(sys.argv)>7 else "docs/audyt_map/_robocze/z.png")
