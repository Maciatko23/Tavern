R = "C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/tools/miasto3/"
p = R + "kit.py"
s = open(p, "rb").read().decode("utf-8")
for key in ['add("chata_d"', 'add("siano"']:
    i = s.index(key); j = s.index("\n", i); s = s[:i] + s[j + 1:]
s = s.replace('# bramy / studnia', 'add("dzwonnica", rect("Rural_TileE", 0, 0, 5, 5), door=(3, 5), walk=[(2, 5)], status="sprawdzić", what="drewniana dzwonnica z dzwonem (lina i dzwonnik w lewej kratce drzwi)")\n# bramy / studnia', 1)
open(p, "wb").write(s.encode("utf-8"))

p = R + "build.py"
s = open(p, "rb").read().decode("utf-8")
a = s.index("def inn_yard():"); b = s.index("def herb_garden():")
new = '''def inn_yard():
    """podwórze zajazdu: stajnia i wozownia wzdłuż północy, wspólne podwórze z ubitej ziemi (wiersze 9-18), zagroda z trawą na południu, płot z bramami"""
    L.put("stajnia", 63, 5)
    L.put("wozownia", 71, 4)
    yard = blobc(71, 13.5, 8.6, 4.8, 31, 0.4) & rectc(63, 9, 79, 18)
    L.kind(0, yard | band([(62, 13.5), (66, 13.5), (72, 13.5)], 2.4, 0.15, 7) | band([(72, 14), (79, 14)], 3, 0.15, 8), YARD)
    fence = {(62, y) for y in range(5, 27) if y not in (13, 14)} | {(x, 26) for x in range(62, 80)} | {(79, y) for y in range(9, 13)} | {(79, y) for y in range(16, 26)}
    fence |= {(x, 19) for x in range(63, 79) if x not in (70, 71)}      # płot między podwórzem a zagrodą (brama x70-71)
    L.kind(1, fence, 22)
    L.kind(0, blobc(58, 25, 4.6, 3.6, 33, 0.45) & rectc(54, 21, 62, 28), 32)
    L.put("beczki", 65, 10); L.put("beczki", 75, 15)


'''
s = s[:a] + new + s[b:]
s = s.replace("band([(53.5, 20.5), (57, 19.8), (60, 19.3), (62.5, 19)], 2.2, 0.1, 41)", "band([(53.5, 20.5), (57, 19.2), (60, 16), (62.5, 13.8)], 2.2, 0.1, 41)")
# yard props repositioned
a = s.index("    # podwórze stajenne:"); b = s.index("    # dziedziniec: grupy drzew")
new = '''    # podwórze stajenne: stogi, wozy, skrzynie, worki, beczki, poręcze do koni, latarnie
    clone(190, 77, 11, name="Stóg siana", note="<Occupy:left=1,right=1>", characterName="!Tavern_Yard", characterIndex=2, direction=4, pattern=2)
    clone(190, 77, 16, name="Stóg siana", note="<Occupy:left=1,right=1>", characterName="!Tavern_Yard", characterIndex=2, direction=4, pattern=2)
    keep(149, 67, 15); clone(272, 74, 12, name="Wóz z sianem"); clone(272, 72, 17, name="Wóz z sianem")
    clone(190, 66, 12, name="Skrzynie i beczka", characterName="!Tavern_Yard", characterIndex=1, direction=2, pattern=0)
    clone(190, 68, 17, name="Worki", characterName="!Tavern_Yard", characterIndex=1, direction=8, pattern=0)
    clone(190, 79, 13, name="Worki", characterName="!Tavern_Yard", characterIndex=1, direction=8, pattern=1)
    clone(189, 64, 17, name="Beczki piwa")
    clone(190, 78, 18, name="Beczka"); clone(190, 63, 12, name="Beczka")
    clone(148, 66, 10, name="Poręcz do wiązania koni"); clone(148, 73, 10, name="Poręcz do wiązania koni"); clone(148, 65, 15, name="Poręcz do wiązania koni")
    for (x, y) in ((79, 17), (62, 15), (67, 12)): clone(48, x, y, name="Latarnia")
'''
s = s[:a] + new + s[b:]
s = s.replace('("big_g", 33, 26), ("pine_b", 31, 23), ("pear", 43, 26), ("small", 46, 25), ("pine_a", 41, 28), ("apple", 57, 26)', '("big_g", 33, 26), ("pear", 31, 23), ("pear", 43, 26), ("small", 46, 25), ("apple", 41, 28)')
s = s.replace('("small", 40, 5), ("small", 61, 6), ("pine_b", 40, 8), ("pine_b", 60, 5), ("pear", 41, 14), ("pine_a", 38, 19)', '("small", 40, 5), ("small", 61, 6), ("apple", 40, 8), ("pear", 60, 5), ("pear", 41, 14), ("apple", 38, 19)')
s = s.replace("    old31 = {(i % W, (i // W) % H) for i in range(5 * W * H, 6 * W * H) if BASE[\"data\"][i] == 31}\n", "    old31 = set(getattr(sys.modules[__name__], 'SQUARE_CELLS', set()))\n")
open(p, "wb").write(s.encode("utf-8"))
print("ok")
