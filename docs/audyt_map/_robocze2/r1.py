import sys; sys.path.insert(0,"docs/audyt_map/_robocze2")
from rend import *
n=int(sys.argv[1]); x0,y0,x1,y1=map(int,sys.argv[2:6]); sc=float(sys.argv[6]); out=sys.argv[7]
box=tuple(map(int,sys.argv[8].split(","))) if len(sys.argv)>8 else None
crop(load(n),x0,y0,x1,y1,sc,out,box)
