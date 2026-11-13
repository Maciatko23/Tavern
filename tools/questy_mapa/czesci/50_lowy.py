

# ====================================================================================================================
# 5. Lowy (K59 wilcza nora, D33 obóz CzO, kontrakty tablicy, obóz rabusiów): Skraj lasu -> Kruczy Jar (3), Leśna droga -> Łąka (4)
# ====================================================================================================================
def sec_lowy():
    LD, L = PLUG("Lowy_Data"), PLUG("Lowy")
    PR(LD, [
        # --- B1 the den: Kruczy Jar, the east edge of the forest (was Map023 (65,50): moved by +30, -20)
        ("        map: 23, x: 65, y: 50, cells: { x: 64, y: 49, w: 3, h: 2 }, zone: 6, rest: [65, 52], restNear: 2.5,\n"
         "        bounty: [66, 51], gift: [66, 52], dayHours: [5, 20], adults: 2, pups: [2, 3], pupScale: 0.55,\n"
         "        meatR: 3, meatDays: 3, emptyDays: 28, giftEvery: 7, friendMaps: [21, 23], discoverNear: 8\n",
         "        // (2026-11-11 plansza: Skraj lasu is the east edge of Kruczy Jar - the den was Map023 (65,50), moved by +30, -20)\n"
         "        map: 3, x: 95, y: 30, cells: { x: 94, y: 29, w: 3, h: 2 }, zone: 6, rest: [95, 32], restNear: 2.5,\n"
         "        bounty: [96, 31], gift: [96, 32], dayHours: [5, 20], adults: 2, pups: [2, 3], pupScale: 0.55,\n"
         "        meatR: 3, meatDays: 3, emptyDays: 28, giftEvery: 7, friendMaps: [3, 4], discoverNear: 8\n"),
        # --- B5 the fixed camps: the robbers on Łąka (was Map021 (60,41)), the hunters of the CzO on Kruczy Jar (was Map023 (66,21))
        ("        rabusie: { map: 21, x: 60, y: 41, area: { x: 58, y: 39, w: 6, h: 5 }, tent: [62, 39], tag: \"camp\", every: 4, mielerz: [50, 21],\n",
         "        rabusie: { map: 4, x: 87, y: 39, area: { x: 85, y: 37, w: 6, h: 5 }, tent: [89, 37], tag: \"camp\", every: 4, mielerz: [46, 26],\n"),
        ("        czo: { map: 23, x: 66, y: 21, area: { x: 64, y: 18, w: 6, h: 5 }, tent: [68, 19], tag: \"lowCzo\", hours: [6, 20],\n",
         "        czo: { map: 3, x: 96, y: 42, area: { x: 94, y: 40, w: 6, h: 5 }, tent: [98, 41], tag: \"lowCzo\", hours: [6, 20],\n"),
        # --- the places
        ('        { key: "nora_wilcza", map: 23, kind: "den", mode: "reach", x: 64, y: 49, w: 3, h: 2 },\n'
         '        { key: "szary_kiel", map: 23, kind: "bounty", mode: "reach", cells: [[66, 51]] },\n'
         '        { key: "oboz_czo", map: 23, kind: "camp", mode: "reach", x: 64, y: 18, w: 6, h: 5 },\n'
         '        { key: "oboz_bandytow", map: 21, kind: "camp", mode: "reach", x: 58, y: 39, w: 6, h: 5 },\n',
         '        { key: "nora_wilcza", map: 3, kind: "den", mode: "reach", x: 94, y: 29, w: 3, h: 2 },\n'
         '        { key: "szary_kiel", map: 3, kind: "bounty", mode: "reach", cells: [[96, 31]] },\n'
         '        { key: "oboz_czo", map: 3, kind: "camp", mode: "reach", x: 94, y: 40, w: 6, h: 5 },\n'
         '        { key: "oboz_bandytow", map: 4, kind: "camp", mode: "reach", x: 85, y: 37, w: 6, h: 5 },\n'),
        ('        { key: "nora", map: 23, x: 65, y: 51, near: 8, icon: 481, xp: 30, day: true },\n', '        { key: "nora", map: 3, x: 95, y: 31, near: 8, icon: 481, xp: 30, day: true },\n'),
        ('        { key: "oboz_rabusiow", map: 21, x: 60, y: 41, near: 7, icon: 156, xp: 20, camp: "rabusie" },\n'
         '        { key: "oboz_czo", map: 23, x: 66, y: 21, near: 8, icon: 485, xp: 30, camp: "czo" },\n',
         '        { key: "oboz_rabusiow", map: 4, x: 87, y: 39, near: 7, icon: 156, xp: 20, camp: "rabusie" },\n'
         '        { key: "oboz_czo", map: 3, x: 96, y: 42, near: 8, icon: 485, xp: 30, camp: "czo" },\n'),
        # --- the board's contracts: the robbers on Łąka, the hunters on Kruczy Jar
        ('req: [{ kill: "bandit", maps: [21], n:', 'req: [{ kill: "bandit", maps: [4], n:'),
        ('req: [{ kill: "archer", maps: [23], n:', 'req: [{ kill: "archer", maps: [3], n:'),
    ])
    PR(L, [
        # the events by the map (Map003 has the den and the hunters' tent; Łąka the robbers' tent)
        ("        23: () => [\n            ev(IDS.nora,", "        3: () => [\n            ev(IDS.nora,"),
        ('            ev(IDS.bloto, TK.kod.n21[0], BLOTO.ev[0], BLOTO.ev[1], [page({ image: img("!$Low_Bloto"), priority: 0, through: true, list: look("bloto") })]),\n'
         '            ev(IDS.rabNamiot, TK.kod.n21[1], OBOZY.rabusie.tent[0], OBOZY.rabusie.tent[1], [hidden(), pageW("campRab", { image: img("!$Mt_Tent"), list: look("namiotRab") })])\n        ],\n',
         '            ev(IDS.bloto, TK.kod.n21[0], BLOTO.ev[0], BLOTO.ev[1], [page({ image: img("!$Low_Bloto"), priority: 0, through: true, list: look("bloto") })])\n        ],\n'),
        ('            ev(IDS.poroze, TK.kod.n4[0], LIZAWKA.antler[0], LIZAWKA.antler[1], [hidden(), pageW("antler", { image: img("!$Low_Poroze"), list: scr("Lowy.pickAntler(this)") })])\n',
         '            ev(IDS.poroze, TK.kod.n4[0], LIZAWKA.antler[0], LIZAWKA.antler[1], [hidden(), pageW("antler", { image: img("!$Low_Poroze"), list: scr("Lowy.pickAntler(this)") })]),\n'
         '            // (2026-11-11 plansza: the robbers\' camp is on Łąka now, was Map021)\n'
         '            ev(IDS.rabNamiot, TK.kod.n21[1], OBOZY.rabusie.tent[0], OBOZY.rabusie.tent[1], [hidden(), pageW("campRab", { image: img("!$Mt_Tent"), list: look("namiotRab") })])\n'),
        ("        nora: [23, 65, 55, 8], gawra: [13, 99, 73, 8],", "        nora: [3, 95, 34, 8], gawra: [13, 99, 73, 8],"),
        ("        oboz_rabusiow: [21, 60, 45, 8], oboz_czo: [23, 66, 24, 8],", "        oboz_rabusiow: [4, 87, 43, 8], oboz_czo: [3, 96, 46, 8],"),
    ])
