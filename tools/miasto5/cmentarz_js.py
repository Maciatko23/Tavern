# -*- coding: utf-8 -*-
"""Cmentarz przy kaplicy w nowym układzie (gracz 2026-11-10): dane Zakon_Data.js / Zakon.js i test do mapy z build5.py (sekcja 7c.1): mur w
kaflach mapy zamiast 21 zdarzeń, oś kaplicy (x 8), trzy rzędy grobów, dwie latarnie przy bramie, nowe miejsca grabarza.
Plus obrazek dobudówki kaplicy (odbity, żeby stała przy ścianie): img/characters/!$Kaplica_Dobudowka.png (nowy plik - zawsze).
  python tools/miasto5/cmentarz_js.py --do <folder>    (kopie js/plugins + tests do folderu - nakładka do prób)
  python tools/miasto5/cmentarz_js.py --wykonaj        (w grze; razem z mapą, kopia do archiwum)"""
import datetime, os, re, shutil, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

# ---- the side tower's picture, mirrored (one frame of !Town_Props: index 2, row 3, pattern 1) as a sheet of its own
src = Image.open(os.path.join(ROOT, "img", "characters", "!Town_Props.png")).convert("RGBA")
fw, fh = src.width // 12, src.height // 8
fr = src.crop((2 * 3 * fw + fw, 3 * fh, 2 * 3 * fw + 2 * fw, 4 * fh)).transpose(Image.FLIP_LEFT_RIGHT)
sheet = Image.new("RGBA", (fw * 3, fh * 4))
for r in range(4):
    for c in range(3): sheet.paste(fr, (c * fw, r * fh))
sheet.save(os.path.join(ROOT, "img", "characters", "!$Kaplica_Dobudowka.png"))

EDITS = {
"js/plugins/Zakon_Data.js": [
    (r"    // 7\.7: the old cemetery on Map008 .*?\n.*?\n    const CEMETERY = \{.*?\n    \};\n",
     '''    // 7.7: the old cemetery on Map008 (2026-11-10 one walled yard on the chapel's axis, x 8): the wall, the gate and the alley are the
    // map's own tiles (tools/miasto5/build5.py); here the ground inside (x 5-11, y 25-30), the graves of its two upper rows (three with
    // the raven), the two lamps by the gate; the gravedigger's places (TownLifeData.SPOTS - Map008 reads only those)
    const CEMETERY = {
        map: 8, x: 5, y: 25, w: 7, h: 6,
        wall: null,
        gate: [[7, 32], [8, 32], [9, 32]], lamp: { id: 2821, x: 6, y: 33 }, lamp2: { id: 2822, x: 10, y: 33 },
        graves: [
            { id: 2830, x: 5, y: 26, img: "grob" }, { id: 2831, x: 6, y: 26, raven: 1 }, { id: 2833, x: 10, y: 26, raven: 2 },
            { id: 2835, x: 11, y: 26, img: "grob" }, { id: 2834, x: 5, y: 28, img: "grob2" }, { id: 2837, x: 6, y: 28, img: "grob" },
            { id: 2832, x: 10, y: 28, img: "grob" }, { id: 2836, x: 11, y: 28, raven: 3 }
        ],
        cleanHits: 4
    };
'''),
    (r'lampa: \["!\$Zak_Groby", 6, 2\],', 'lampa: ["!lamp", 2, 0],                        // (the street lamp of the town)'),
    (r'\{ key: "cmentarz", map: 8, x: 9, y: 27, near: 3,', '{ key: "cmentarz", map: 8, x: 8, y: 29, near: 3,'),
    (r'grabarz_groby: \[7, 25, 8\], grabarz_groby_2: \[10, 25, 8\], grabarz_kopie: \[10, 27, 8\], grabarz_furtka: \[9, 29, 2\],\n        grabarz_przerwa: \[11, 25, 4\], grabarz_lampa: \[9, 24, 8\],',
     'grabarz_groby: [6, 27, 8], grabarz_groby_2: [10, 27, 8], grabarz_kopie: [11, 27, 8], grabarz_furtka: [8, 33, 2],\n        grabarz_przerwa: [9, 30, 4], grabarz_lampa: [7, 33, 4],'),
],
"js/plugins/Zakon.js": [
    (r'            let id = G\.wall\.from;\n            for \(let x = G\.x; x <= x1; x\+\+\) for \(const y of \[G\.y, y1\]\) \{\n(.*?\n)            \}\n            for \(let y = G\.y \+ 1; y < y1; y\+\+\) for \(const x of \[G\.x, x1\]\) out\.push\(thing\(id\+\+, TK\.kod\.buildMap\[26\], x, y, IMG\.murekV, null\)\);\n',
     lambda m: '            if (G.wall) {   // (2026-11-10: the wall is in the map\'s tiles now - no pieces to lay)\n            let id = G.wall.from;\n            for (let x = G.x; x <= x1; x++) for (const y of [G.y, y1]) {\n' + m.group(1) + '            }\n            for (let y = G.y + 1; y < y1; y++) for (const x of [G.x, x1]) out.push(thing(id++, TK.kod.buildMap[26], x, y, IMG.murekV, null));\n            }\n'),
    (r'(            out\.push\(thing\(G\.lamp\.id, TK\.kod\.buildMap\[27\], G\.lamp\.x, G\.lamp\.y, IMG\.lampa, \["lamp"\], \{ note: LIGHT\.lamp \}\)\);\n)',
     lambda m: m.group(1) + '            if (G.lamp2) out.push(thing(G.lamp2.id, TK.kod.buildMap[27], G.lamp2.x, G.lamp2.y, IMG.lampa, ["lamp"], { note: LIGHT.lamp }));\n'),
    (r'\[TK\.f9\.cmentarz, 8, 9, 27\]', '[TK.f9.cmentarz, 8, 8, 29]'),
],
"tests/zakon_test.js": [
    (r'walls: \[2800, 2810, 2820, 2821\]\.map\(id => !!\$gameMap\.event\(id\)\) \}; \}\)\(\)`\);',
     'walls: [2821, 2822, 2830, 2836].map(id => !!$gameMap.event(id)), solid: [[4, 28], [8, 23], [5, 32]].every(c => !$gameMap.isPassable(c[0], c[1], 2)), gate: $gameMap.isPassable(8, 32, 2) }; })()`);'),
    (r'gr\.walls\.every\(Boolean\), gr\);', 'gr.walls.every(Boolean) && gr.solid && gr.gate, gr);'),
    (r'__near\(7, 24\)', '__near(6, 26)'),
    (r'__near\(10, 26\)', '__near(11, 28)'),
    (r'\$gamePlayer\.locate\(88, 126\)', '$gamePlayer.locate(114, 100)'),
],
}
out = {}
for rel, edits in EDITS.items():
    t = open(os.path.join(ROOT, *rel.split("/")), encoding="utf-8", newline="").read()
    for pat, rep in edits:
        t, n = re.subn(pat, rep if callable(rep) else (lambda m, r=rep: r), t, count=1, flags=re.S)
        if n != 1: raise SystemExit("STOP: %s: nie trafiono: %s" % (rel, pat[:70]))
    out[rel] = t
if "--do" in sys.argv:
    root = sys.argv[sys.argv.index("--do") + 1]
elif "--wykonaj" in sys.argv:
    root = ROOT
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "cmentarz_js_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel in out:
        d = os.path.join(bak, *rel.split("/")); os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy2(os.path.join(ROOT, *rel.split("/")), d)
    print("kopia:", bak)
else:
    print("(próba: %d plików; --do <folder> albo --wykonaj)" % len(out)); raise SystemExit(0)
for rel, t in out.items():
    d = os.path.join(root, *rel.split("/")); os.makedirs(os.path.dirname(d), exist_ok=True)
    open(d, "w", encoding="utf-8", newline="").write(t)
print("zapisane: %d plików -> %s" % (len(out), root))
