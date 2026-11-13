import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from krajobraz import *
K = Krajobraz(3)
from collections import Counter
# regions: layer 5
n=K.n
reg=lambda x,y:K.d[5*n+y*K.W+x]
print(Counter(reg(x,y) for x in range(120) for y in range(62,95)))
for e in K.eventy():
    if e["y"]>=60 and e["y"]<=96:
        print(e["id"], e["name"], e["x"], e["y"], e["pages"][0]["image"]["characterName"] or e["pages"][0]["image"]["tileId"], e["note"][:60].replace("\n"," "), len(e["pages"]))
