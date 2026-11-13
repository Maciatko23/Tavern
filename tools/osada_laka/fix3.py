import re
p = 'tools/osada_laka/popraw.py'
s = open(p, 'rb').read().decode('utf-8')
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:70], s.count(a))
    s = s.replace(a, b)

rep('HOST = 3\n', 'HOST = 4\n')
rep('DX, DY = 79, 32 ', 'DX, DY = 55, 86 ')
rep('GROVE_NEW = dict(x=102, y=31, w=9, h=7, centre=(106, 34))', 'GROVE_NEW = dict(x=62, y=86, w=9, h=7, centre=(66, 89))')

# ---- (a): general clearing of the footprint and of the grove
i = s.index('    # (a) zwolnic prostokat')
j = s.index('    # (b) kafle: wnetrze')
new_a = '''    # (a) free the footprint (palisade ring + the gate path) and the grove: trees, rocks, bushes MOVED (nearest free cell outside), the tile things of
    #     the ring cells cleared; the interior's tiles are replaced below
    x0, x1, y0, y1 = nx(OLD["x0"]), nx(OLD["x1"]), ny(OLD["y0"]), ny(OLD["y1"])
    gx, gy, gw, gh = GROVE_NEW["x"], GROVE_NEW["y"], GROVE_NEW["w"], GROVE_NEW["h"]
    zones = [(x0 - 2, y0 - 3, x1 + 2, y1 + 3), (gx - 1, gy - 1, gx + gw, gy + gh)]
    inzone = lambda x, y: any(a <= x <= c and b <= y <= d for (a, b, c, d) in zones)
    inside = [e for e in m["events"] if e and inzone(e["x"], e["y"])]
    print("  zdarzenia do przeniesienia:", [(e["id"], e["name"], e["x"], e["y"]) for e in inside])
    ids_moving = {e["id"] for e in inside}
    W, H = m["width"], m["height"]
    def free_spot(ex, ey):
        best = None
        for y in range(3, H - 3):
            for x in range(3, W - 5):
                if inzone(x, y) or inzone(x - 1, y) or inzone(x + 1, y) or inzone(x, y - 1) or inzone(x, y - 2): continue
                d = (x - ex) ** 2 + (y - ey) ** 2
                if best and d >= best[0]: continue
                if any(WS.kind_of(at(m, 0, x + i, y + j)) not in (16, 27) for i in (-1, 0, 1) for j in (-1, 0)): continue
                if any(at(m, z, x + i, y + j) for z in (1, 2, 3) for i in (-1, 0, 1) for j in (-1, 0)) or any(at(m, 5, x + i, y + j) for i in (-1, 0, 1) for j in (-1, 0)): continue
                if any(e and e["id"] not in ids_moving and abs(e["x"] - x) <= 2 and abs(e["y"] - y) <= 2 for e in m["events"]): continue
                best = (d, x, y)
        if not best: stop("brak wolnej kratki dla %s" % ((ex, ey),))
        return best[1], best[2]
    for e in inside:
        if not e["pages"][0]["image"].get("characterName") and e["pages"][0]["image"].get("tileId", 0) == 0: stop("w obszarze stoi zdarzenie bez obrazka: %s" % e["name"])
    for e in sorted(inside, key=lambda e: e["id"]):
        ox_, oy_ = e["x"], e["y"]
        e["x"], e["y"] = -50, -50
        nxy = free_spot(ox_, oy_)
        m["events"][e["id"]]["x"], m["events"][e["id"]]["y"] = nxy
        print("   %s %d (%d,%d) -> %s" % (e["name"], e["id"], ox_, oy_, nxy))
        ids_moving.discard(e["id"])
    # tile things in the ring's cells / the gate path: cleared (layers 1-3 + region)
    for y in range(y0 - 1, y1 + 6):
        for x in range(x0 - 1, x1 + 2):
            for z in (1, 2, 3): put(m, z, x, y, 0)
            put(m, 5, x, y, 0)
'''
s = s[:i] + new_a + s[j:]

# the Cienie note goes to HOST's note: already generic (m["note"]). Texts
s = s.replace('w8_gate: { map: %d, id: 953, marker: "osada_brama"', 'w8_gate: { map: %d, id: 956, marker: "osada_brama"')
s = s.replace('map: %d, id: 952, marker: "osada_grum"', 'map: %d, id: 957, marker: "osada_grum"')
s = s.replace('   # (951 on Kruczy Jar is the horseshoe\'s place (K3))', '   # (ids 951-955 of Lake pod Gawra are taken by the packages\' places, TQ_SPOTS)')
s = s.replace('"za bramą w palisadzie, na łące na wschód od działki dziadka (Akt II:"', '"za bramą w palisadzie, na łące na wschód od Gawry (Akt II:"')
s = s.replace('"Za bramą w palisadzie, na łące na wschód od działki dziadka, mieszkają Milczący"', '"Za bramą w palisadzie, na łące na wschód od Gawry, mieszkają Milczący"')
# tests: literal map numbers and names
s = s.replace('t.onMap(3)', 't.onMap(4)').replace('t.go(3, ', 't.go(4, ').replace('{ map: 3, x: ', '{ map: 4, x: ')
s = s.replace('await go(3, 106, 35, 12);', 'await go(4, 66, 90, 12);').replace('locate(106, 34); return 0;', 'locate(66, 89); return 0;').replace('locate(106, 39); 0', 'locate(66, 94); 0')
s = s.replace('Kruczy Jar (Map003, on the meadow north of the Silent\'s settlement; 2026-11-11: was Map120 (57, 54))', 'Lake pod Gawra (Map004, on the meadow north-west of the Silent\'s settlement; 2026-11-11: was Map120 (57, 54))')
s = s.replace("the grove of the Silent (Map003, north of the Silent's settlement)", "the grove of the Silent (Map004, north-west of the Silent's settlement)")
s = s.replace('stands on the east meadow of Kruczy Jar (no map of its own any more); its four huts belong to Kruczy Jar', 'stands on the south-east meadow of Lake pod Gawra (Map004; no map of its own any more); its four huts belong to it')
s = s.replace('on the east meadow of Kruczy Jar (Osada.js)', 'on the south-east meadow of Lake pod Gawra (Osada.js)').replace('(mapa 3): drzwi chat', '(mapa 4): drzwi chat').replace('Osada Milczących na łące Kruczego Jaru"', 'Osada Milczących na łące Łąki pod Gawrą"')
s = s.replace('na łące Kruczego Jaru (Map003)', 'na łące pod Gawrą (Map004)').replace('Kruczy Jar: an A3 roof', 'Lake pod Gawra: an A3 roof').replace('(the Silent\'s huts on\n        // Kruczy Jar', '(the Silent\'s huts on\n        // Lake pod Gawra')
s = s.replace('Kruczy Jar', 'Laka pod Gawra').replace('Map003', 'Map004').replace('(Map003', '(Map004')
# w8 test: the gate and Grum ids
s = s.replace('''        ("const s6 = await spot(951);", "const s6 = await spot(952);", 1),
        ('const os = await talkTo("$gameMap.event(951)"', 'const os = await talkTo("$gameMap.event(952)"', 1)])''',
'''        ("const s6 = await spot(951);", "const s6 = await spot(957);", 1),
        ('const os = await talkTo("$gameMap.event(951)"', 'const os = await talkTo("$gameMap.event(957)"', 1),
        ("const s5 = await spot(953);", "const s5 = await spot(956);", 1),
        ('const gate = await talkTo("$gameMap.event(953)"', 'const gate = await talkTo("$gameMap.event(956)"', 1)])''')
# staging cleaned at the start; Map004 instead of Map003 everywhere in the main
rep('def main():\n    m120 = load(120)', 'def main():\n    import shutil\n    if os.path.isdir(STG): shutil.rmtree(STG)\n    m120 = load(120)')
open(p, 'wb').write(s.encode('utf-8'))
print('ok')
