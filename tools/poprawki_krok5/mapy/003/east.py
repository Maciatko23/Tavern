import sys,os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from krajobraz import *
K=Krajobraz(3)
T=[e for e in K.eventy() if 90<=e["x"]<=112 and 70<=e["y"]<=86]
for e in sorted(T,key=lambda e:(e["y"],e["x"])): print(e["id"],e["x"],e["y"],e["pages"][0]["image"]["characterName"] or "tile%d"%e["pages"][0]["image"]["tileId"])
print(len(T))
