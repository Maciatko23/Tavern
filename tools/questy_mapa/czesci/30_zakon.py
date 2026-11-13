

# ====================================================================================================================
# 3. Zakon (K67 kapliczki, K68 strażnice i kopce, D36 krąg menhirów): Polna droga / Leśna droga / Omszała łąka / Skraj lasu / Łąka pod Gawrą
# ====================================================================================================================
def _line(rel, start):
    """the whole line of a file beginning with `start` (STOP unless exactly one)"""
    t = _get(rel)["b"].decode("utf-8").split("\n")
    hit = [l for l in t if l.startswith(start)]
    if len(hit) != 1: raise SystemExit("STOP: %s: %d linii zaczynajacych sie od %r" % (rel, len(hit), start))
    return hit[0]

def sec_zakon():
    ZD, Z = PLUG("Zakon_Data"), PLUG("Zakon")
    # the five moved places and their 6x6 / 2x2 areas (x, y = the top left cell); Farming's random dry bushes under them: computed with its hash
    def bushes(x, y, w, h, skip=()): return json.dumps([c for c in bush_cells(x, y, w, h) if tuple(c) not in skip]).replace(" ", "").replace(",", ", ")
    old_t = _line(ZD, '        { key: "straznica_022", map: 22, x: 71, y: 36,')
    P(ZD, old_t, '        { key: "straznica_022", map: 3, x: 59, y: 13, card: true, ids: { ring: 2700, slab: 2701, blank: 2702 }, bushes: %s },   // (Kruczy Jar, the road north of the plot; 2026-11-11, was Map022 (71,36))' % bushes(59, 13, 6, 6, [(61, 16)]))
    P(ZD, _line(ZD, '        { key: "kapliczka_022", map: 22, x: 72, y: 16,'),
          '        { key: "kapliczka_022", map: 3, x: 69, y: 13, id: 2710, at: [69, 14], bushes: %s },   // (Kruczy Jar; was Map022 (72,16))' % bushes(69, 13, 2, 2, [(69, 14)]))
    P(ZD, _line(ZD, '        { key: "kapliczka_021", map: 21, x: 58, y: 12,'),
          '        { key: "kapliczka_021", map: 4, x: 42, y: 14, id: 2712, at: [42, 15], bushes: %s },   // (Łąka, the north-west copses, just east of the old part; was Map021 (58,12); id 2712: Łąka has kapliczka_004 = 2710)' % bushes(42, 14, 2, 2, [(42, 15)]))
    P(ZD, _line(ZD, '        { key: "kopiec_017", map: 17, x: 50, y: 36,'),
          '        { key: "kopiec_017", map: 3, x: 8, y: 78, ids: { cairn: 2750, stone: 2751 }, at: [8, 79] },   // (Kruczy Jar, Omszała łąka in the south-west; was Map017 (50,36))')
    P(ZD, _line(ZD, '        { key: "kopiec_023", map: 23, x: 58, y: 51,'),
          '        { key: "kopiec_023", map: 3, x: 92, y: 25, ids: { cairn: 2755, stone: 2756 }, at: [92, 26] },   // (Kruczy Jar, Skraj lasu in the east; was Map023 (58,51); ids 2755/2756: Kruczy Jar has kopiec_017 = 2750/2751)')
    # D36: the ring of menhirs on Łąka under the Gawra, its centre (50,78); every cell moved by (-3, +33) from the old Map018 ring
    P(ZD, "        map: 18, centre: [53, 45], r: 4,\n"
          "        stones: [[53, 41], [56, 42], [57, 45], [56, 48], [53, 49], [50, 48], [49, 45]], stoneIds: 2760,\n"
          '        watchman: { x: 50, y: 42, id: 2767, img: "!$Rock_Spire" }, stoneImg: "!$Rock_Column",\n'
          "        plate: { x: 53, y: 45, id: 2768 }, hole: { x: 52, y: 43, id: 2769 },\n",
          "        map: 4, centre: [50, 78], r: 4,   // (2026-11-11: Łąka under the Gawra; was Map018 centre (53,45), every cell moved by (-3, +33))\n"
          "        stones: [[50, 74], [53, 75], [54, 78], [53, 81], [50, 82], [47, 81], [46, 78]], stoneIds: 2760,\n"
          '        watchman: { x: 47, y: 75, id: 2767, img: "!$Rock_Spire" }, stoneImg: "!$Rock_Column",\n'
          "        plate: { x: 50, y: 78, id: 2768 }, hole: { x: 49, y: 76, id: 2769 },\n")
    P(ZD, "        back: [53, 46]   // where the steps of the chamber come out\n", "        back: [50, 79]   // where the steps of the chamber come out\n")
    P(ZD, '    SPOTS.push({ key: "menhiry_krag", map: 18, kind: "ring", mode: "reach",\n', '    SPOTS.push({ key: "menhiry_krag", map: RING.map, kind: "ring", mode: "reach",\n')
    P(ZD, '        { key: "menhiry_krag", map: 18, x: 53, y: 45, near: 4, icon: ICON.plyta, xp: 30 },\n'
          '        { key: "cien_straznika", map: 18, x: 52, y: 43, near: -1, icon: ICON.klucz, xp: 60 },\n',
          '        { key: "menhiry_krag", map: 4, x: 50, y: 78, near: 4, icon: ICON.plyta, xp: 30 },\n'
          '        { key: "cien_straznika", map: 4, x: 49, y: 76, near: -1, icon: ICON.klucz, xp: 60 },\n')
    # the discoveries of the moved places
    PR(ZD, [
        ('        { key: "straznica_022", map: 22, x: 73, y: 38, near: 3, icon: ICON.plyta, xp: 30 },\n', '        { key: "straznica_022", map: 3, x: 61, y: 15, near: 3, icon: ICON.plyta, xp: 30 },\n'),
        ('        { key: "kapliczka_022", map: 22, x: 72, y: 17, near: 2, icon: ICON.kapliczka, xp: 20 },\n', '        { key: "kapliczka_022", map: 3, x: 69, y: 15, near: 2, icon: ICON.kapliczka, xp: 20 },\n'),
        ('        { key: "kapliczka_021", map: 21, x: 58, y: 13, near: 2, icon: ICON.kapliczka, xp: 20 },\n', '        { key: "kapliczka_021", map: 4, x: 42, y: 16, near: 2, icon: ICON.kapliczka, xp: 20 },\n'),
        ('        { key: "kopiec_017", map: 17, x: 50, y: 37, near: 2, icon: ICON.kruk, xp: 20 },\n', '        { key: "kopiec_017", map: 3, x: 8, y: 80, near: 2, icon: ICON.kruk, xp: 20 },\n'),
        ('        { key: "kopiec_023", map: 23, x: 58, y: 52, near: 2, icon: ICON.kruk, xp: 20 },\n', '        { key: "kopiec_023", map: 3, x: 92, y: 27, near: 2, icon: ICON.kruk, xp: 20 },\n'),
        ("    const MAPS = { polna: 22, gory: 13, urwisko: 157, lesna: 21, laka: 4, omszala: 17, skraj: 23, pustelnia: 155, menhiry: 18,\n",
         "    // (2026-11-11: the places of Polna droga, Leśna droga, Omszała łąka, Skraj lasu and the menhirs are on Kruczy Jar (3) and Łąka (4) now)\n"
         "    const MAPS = { polna: 3, gory: 13, urwisko: 157, lesna: 4, laka: 4, omszala: 3, skraj: 3, pustelnia: 155, menhiry: 4,\n"),
    ])
    # F9: the ring (the map and the cell beside the plate)
    P(Z, "        [[TK.f9.krag, 18, 52, 44], [TK.f9.komora, 176,", "        [[TK.f9.krag, D.RING.map, D.RING.plate.x - 1, D.RING.plate.y - 1], [TK.f9.komora, 176,")
