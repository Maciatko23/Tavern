p = 'tools/osada_laka/popraw.py'
s = open(p, 'rb').read().decode('utf-8')
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:60], s.count(a))
    s = s.replace(a, b)

# ---- new_events: build the list only (the plugin injects it)
i = s.index('def new_events(m, m120):')
j = s.index('# ------------------------------------------------------------------ 2. Map013')
new = '''def new_events(m120):
    """the Osada's events (copies from Map120, moved by (DX, DY)): -> (EV: full events, PAL: palisade templates + points). Injected at runtime by
    js/plugins/Osada.js (ids 5300-5399 - the map file keeps no event of them: ids in the map files stay below 500)"""
    EV = []
    def clone(old_id, x=None, y=None, patch=None):
        e = copy.deepcopy(m120["events"][old_id])
        e["x"] = nx(e["x"] if x is None else x); e["y"] = ny(e["y"] if y is None else y)
        if patch: patch(e)
        return e
    for oid in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] + list(range(12, 22)) + [27, 28]:   # huts' doors, chimneys, ring stones, mounds, posts, lamps (22: a mound on the rock shelf - outside the new palisade; 24-26: the dry stalks - the beds replace them)
        EV.append(clone(oid))
    def wall_words(e):
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 355:
                    c["parameters"][0] = (c["parameters"][0]
                        .replace("Stoi twarzą do skały.", "Stoi twarzą do pali palisady.")
                        .replace("Patrzy w kamień, jakby coś na nim czytała.", "Patrzy w pale, jakby coś na nich czytała."))
    for oid in range(86, 100): EV.append(clone(oid, patch=wall_words))
    EV.append(clone(338)); EV.append(clone(339))               # the gate (shut / open by switch 16), the marker osada_brama
    south = clone(306, x=5, y=29); bok = clone(316, x=3, y=11)
    pts = []
    for x in (5, 8, 11, 14, 17, 23, 26, 29, 32, 35): pts.append([0, nx(x), ny(29)])
    for x in (5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35): pts.append([0, nx(x), ny(9)])   # north: the same row, unbroken
    for y in range(11, 30, 2): pts.append([1, nx(3), ny(y)]); pts.append([1, nx(37), ny(y)])   # sides: poles, top = the north palisade's top, bottom = the south one's
    for e in (south, bok):
        for k in ("id", "x", "y"): e.pop(k, None)
    return EV, dict(tpl=[south, bok], pts=pts)

OSADA_JS_HEAD = open(os.path.join(HERE, "Osada_head.js"), "rb").read().decode("utf-8")
def osada_plugin(EV, PAL):
    for e in EV: e.pop("id", None)
    dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
    txt = OSADA_JS_HEAD.replace("__EV__", dump(EV)).replace("__PAL__", dump(PAL))
    stage("js/plugins/Osada.js", txt.encode("utf-8")); print("  js/plugins/Osada.js:", len(EV), "events +", len(PAL["pts"]), "palisade pieces")

'''
s = s[:i] + new + s[j:]
rep('''    created = new_events(m, m120)
    print("  nowe zdarzenia na Map003:", len(created), "id", created[0], "-", created[-1])
''', '''    EV, PAL = new_events(m120)
    osada_plugin(EV, PAL)
''')
rep('map013(); interiors(); parked(); mapinfos(); code(); tests()', 'map013(); interiors(); parked(); mapinfos(); code(); core_and_list(); tests()')

# ---- beds + the note
rep('''    # (c) regiony:''', '''    # (b3) the dark flat squares beside huts 1, 2, 4 (A2 36 + its rim) -> little vegetable beds of Winlu's C-sheet plants (cabbage, lettuce: tiles 277-279, 285-287)
    BEDS = [(11, 13, 13, 15), (11, 13, 23, 25), (31, 33, 15, 16)]
    PLANTS = [[277, 278, 279], [286, 285, 287], [279, 277, 278]]
    for (xa, xb, ya, yb) in BEDS:
        for y in range(ya - 1, yb + 2):
            for x in range(xa - 1, xb + 2):
                if WS.kind_of(at(m, 1, nx(x), ny(y))) in (36, 21) and (at(m120, 1, x, y) == at(m, 1, nx(x), ny(y))): put(m, 1, nx(x), ny(y), 0)
        for y in range(ya, yb + 1):
            for x in range(xa, xb + 1): put(m, 2, nx(x), ny(y), PLANTS[(y - ya) % 3][(x - xa) % 3])
    # (c) regiony:''')
rep('''            r = 2 if blocked else (3 if star else 7)
            put(m, 5, nx(x), ny(y), r); nb += r == 2; ns += r == 3''', '''            r = 2 if blocked else (3 if star else 7)
            if any(xa <= x <= xb and ya <= y <= yb for (xa, xb, ya, yb) in BEDS): r = 2     # the beds are not walked over
            put(m, 5, nx(x), ny(y), r); nb += r == 2; ns += r == 3''')
rep('''    WS.reshape(m, 1, [(nx(x), ny(y)) for x in (18, 19, 20, 21, 22) for y in range(29, 35)])''', '''    WS.reshape(m, 1, [(nx(x), ny(y)) for x in (18, 19, 20, 21, 22) for y in range(29, 35)])
    # (f) Cienie: the tile huts (A3 roof band + A4 face) throw a box shadow with a hard rectangle in front of the wall - they throw none (the note's <CienieBez:x0,y0,x1,y1>, Cienie.js)
    if "<CienieBez:" not in m["note"]: m["note"] = m["note"].rstrip("\\n") + "\\n<CienieBez:%d,%d,%d,%d>" % (nx(OLD["x0"]), ny(OLD["y0"]), nx(OLD["x1"]), ny(OLD["y1"]))''')

# ---- core reserved list, plugin list, Cienie
rep('''def tests():''', """def core_and_list():
    patch("js/plugins/TawernaCore.js", [
        ('''        { owner: "Ziemia", from: 3100, to: 3139,''', '''        // (2026-11-11) the Silent's settlement on the east meadow of Kruczy Jar (Osada.js): doors, residents, stones, palisade, gate (Map003)
        { owner: "Osada", from: 5300, to: 5399, what: "Osada Milczących na łące Kruczego Jaru (mapa 3): drzwi chat, mieszkańcy, kamienie, palisada, brama" },
        { owner: "Ziemia", from: 3100, to: 3139,''')])
    t, crlf = read_text("js/tawerna_wtyczki.js")
    a = '{"name":"Zakon","status":true,'
    k = t.index(a); e = t.index("\\n", k)
    assert t[e - 1] == ","
    entry = '{"name":"Osada","status":true,"description":"Osada Milczących na łące Kruczego Jaru (Map003): drzwi chat, mieszkańcy, kamienie kręgu, palisada i brama wstawiane przy wczytaniu mapy. v1.0.0","parameters":{}},'
    t = t[:e + 1] + entry + "\\n" + t[e + 1:]
    write_text("js/tawerna_wtyczki.js", t, crlf)
    patch("js/plugins/Cienie.js", [
        ('''        // a tile drawn over the characters (a "star" B-E tile: a roof of the roofs' sheet, a chimney, a crown) lies on the cell
''', '''        // (2026-11-11) <CienieBez:x0,y0,x1,y1> in the map's note (any number): tile buildings in these cells throw no shadow (the Silent's huts on
        // Kruczy Jar: an A3 roof band over an A4 face is one hard box; the B-E things there are left out of "things" too)
        const bez = new Uint8Array(n), reBez = /<CienieBez:(\\d+),(\\d+),(\\d+),(\\d+)>/g;
        for (let q; (q = reBez.exec($dataMap.note || ""));) {
            for (let y = +q[2]; y <= +q[4] && y < H; y++) for (let x = +q[1]; x <= +q[3] && x < W; x++) { kind[y * W + x] = 0; bez[y * W + x] = 1; }
        }
        // a tile drawn over the characters (a "star" B-E tile: a roof of the roofs' sheet, a chimney, a crown) lies on the cell
'''),
        ('''            if (comp[i] >= 0 || extra[i]) continue;
            const t = topBE(i);''', '''            if (comp[i] >= 0 || extra[i] || bez[i]) continue;
            const t = topBE(i);''')])

def tests():""")
open(p, 'wb').write(s.encode('utf-8'))
