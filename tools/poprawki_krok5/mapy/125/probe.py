import sys, os
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..','..','..'))
sys.path.insert(0, os.path.join(ROOT,'tools','poprawki_krok5'))
import krajobraz as KR
from krajobraz import *
KR.STG=os.path.join(HERE,'tmp','probe')
HERE=os.path.dirname(os.path.abspath(__file__)); KR.STG=os.path.join(HERE,"tmp","probe")
K=Krajobraz(125)
# strip probe at 46..56, 40..46
def beds(x0,x1,y,furrow=True):
    pass
for (x,y) in [(a,b) for a in range(44,57) for b in range(39,46)]: pass
import random
# variant A: earth under
for y in (40,41): 
    for x in range(46,55): K.ground(x,y,17)
for x in range(46,55): K.kafel(x,40,712 if x==46 else 714 if x==54 else 713,2)
for x in range(46,55): K.kafel(x,41,[277,278,279,285,286,287][x%6],2)
# variant B: no earth under
for x in range(46,55): K.kafel(x,44,712 if x==46 else 714 if x==54 else 713,2)
for x in range(46,55): K.kafel(x,45,[277,278,279,285,286,287][x%6],2)
print(K.zapisz('Map125.json'))
