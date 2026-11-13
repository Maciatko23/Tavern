import sys, os
MYDIR=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(MYDIR,"..",".."))
import krajobraz
from krajobraz import *
krajobraz.STG=os.path.join(MYDIR,"tmp")
K=Krajobraz(111)
# clear test zone x30-60,y5-25
for y in range(4,28):
    for x in range(30,62):
        K.ground(x,y,16); K.over(x,y,0)
# hedge kind 20: 1-row and 2-row, ring
for x in range(32,44): K.over(x,6,20)
for x in range(32,44): K.over(x,9,20); K.over(x,10,20)
for y in range(12,18):
    K.over(32,y,20); K.over(40,y,20)
for x in range(32,41): K.over(x,12,20); K.over(x,17,20)
# tilled soil kinds
for (kk,x0) in ((26,46),(24,50),(25,54)):
    for y in range(6,10):
        for x in range(x0,x0+3): K.ground(x,y,kk)
# fields: kind 26 with crops 278
for y in range(12,16):
    for x in range(46,58): K.ground(x,y,26)
for x in range(46,58,2):
    K.kafel(x,13,278,2); K.kafel(x,15,279,2)
# gate posts
for x,y in [(36,20),(37,20),(38,20),(39,20)]: K.ground(x,y,16); K.over(x,y,22)
K.kafel(40,20,216,2);K.kafel(40,20,217,3)
for (x,y,a) in [(46,20,213),(50,20,0)]:
    pass
def hay(x,y):
    C=256
    for i,t in enumerate((213,214,215)): K.kafel(x+i,y,C+t,3)
    for i,t in enumerate((221,222,223)): K.kafel(x+i,y+1,C+t,3)
    K.kafel(x,y+2,C+229,2); K.kafel(x+1,y+2,C+230,2)
hay(46,19); hay(52,19)
K.kafel(58,19,450,2); K.kafel(58,22,352,2)
for x,t in zip(range(46,58),(696,705,710,716,734,725,732,677,683,742,727,678)): K.kafel(x,24,t,2)
K.kafel(60,24,741,2)
print(K.zapisz("test.json"))
