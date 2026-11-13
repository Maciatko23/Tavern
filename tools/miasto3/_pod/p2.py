p="tools/miasto3/build.py"
s=open(p,"rb").read().decode("utf-8")
def rep(a,b,c=1):
    global s
    assert s.count(a)>=1,a
    s=s.replace(a,b)
rep("TABLES = [(62, 22), (66, 22), (64, 25)]","TABLES = [(56, 23), (60, 23), (58, 26)]")
rep("band([(53.5, 22), (58, 21), (61, 19.5), (62.5, 19)], 2.2, 0.25, 41)","band([(53.5, 20.5), (57, 19.8), (60, 19.3), (62.5, 19)], 2.2, 0.1, 41)")
rep("L.kind(0, blobc(64, 23.5, 4.6, 3.6, 33, 0.45) & rectc(59, 19, 69, 28), 32)","L.kind(0, blobc(58, 25, 4.6, 3.6, 33, 0.45) & rectc(54, 21, 62, 28), 32)")
rep("keep(275, 66, 24)","keep(275, 58, 28)")
rep("    clone(48, 60, 23, name=\"Latarnia\")\n    for (x, y) in ((59, 23), (61, 24), (60, 25)): clone(190, x, y, name=\"Beczka\")","    clone(48, 58, 24, name=\"Latarnia\")\n    for (x, y) in ((57, 24), (59, 24), (58, 23)): clone(190, x, y, name=\"Beczka\")")
rep("for (x, y) in ((60, 20), (68, 21), (68, 25)):","for (x, y) in ((54, 22), (62, 22), (54, 26)):")
rep('tree("pear", 68, 27); tree("small", 59, 27)','tree("pear", 54, 28); tree("small", 61, 27)')
rep("for (x, y) in ((79, 17), (62, 20), (70, 12)): clone(48","for (x, y) in ((79, 17), (62, 20), (67, 12)): clone(48")
rep('("apple", 57, 26), ("small", 55, 28),','')
rep("    for (x, y) in ((34, 24), (44, 24), (58, 22)): clone(190, x, y, name=\"Kwiaty\", characterName=\"!Tavern_Yard\", characterIndex=3, direction=2, pattern=0)\n","    L.kind(1, blobc(47, 27.6, 2.2, 0.8, 5, 0.2) | blobc(33, 28, 1.8, 0.7, 6, 0.2) | blobc(39, 20.5, 1.2, 0.8, 9, 0.2), 28)\n")
rep("band(pts, w, wobble=0.25, seed=hash(k) & 0xffff)","band(pts, w, wobble=0.08, seed=hash(k) & 0xffff)")
open(p,"wb").write(s.encode("utf-8"))
