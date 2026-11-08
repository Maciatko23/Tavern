# -*- coding: utf-8 -*-
"""Refaktor 2026-11-07, krok „pomocnicze”: te same małe funkcje przepisane w wielu wtyczkach -> jedna w Tawerna.util (TawernaCore.js).
Tylko DOKŁADNIE takie same (tools/porzadki/pomocnicze.py): każda wtyczka dostaje w tym samym miejscu, pod tą samą nazwą,
  const clamp = T.util.clamp;
więc reszta jej kodu się nie zmienia. Inne wersje (clamp z ? :, inne hashe, popupy z innymi kolorami) zostają, jak są.
Kopie do tools/porzadki/staging/js/plugins (nic w grze); raport: co, gdzie, czy coś woła funkcję wyżej w pliku niż jej definicja.
  python tools/porzadki/pomocnicze_zmiany.py               (staging + raport)
  python tools/porzadki/pomocnicze_zmiany.py --wykonaj     (do js/plugins; kopie: tools/porzadki/kopie_zapasowe/<czas>_pomocnicze)"""
import datetime, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
PLUG = os.path.join(ROOT, "js", "plugins")
STG = os.path.join(HERE, "staging", "js", "plugins")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

# shared name -> (its text in TawernaCore, the exact local texts it replaces: (local name, definition as written))
H = "let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296;"
SHARED = [
    ("clamp", "const clamp = (v, a, b) => Math.max(a, Math.min(b, v));"),
    ("pick", "const pick = list => list[Math.floor(Math.random() * list.length)];"),
    ("rand", "const rand = (a, b) => a + Math.random() * (b - a);"),
    ("lerp", "const lerp = (a, b, t) => a + (b - a) * t;"),
    ("smooth", "const smooth = t => t * t * (3 - 2 * t);"),
    ("easeOut", "const easeOut = t => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);"),
    ("dist", "const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);"),
    ("distXY", "const distXY = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);"),
    ("hash", "function hash(a, b) { " + H + " }"),
    ("hash01", "function hash01(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }"),
]


def norm(text):
    return re.sub(r"\s+", " ", text).strip()


# the local definitions to replace: (file, local name, shared name, the definition's exact text in the file - found below)
WANT = {
    "clamp": ["Act3", "Creatures", "QuestBoard", "QuestBoard_Art", "QuestBoard_Scene", "TavernDice", "TavernDice_Art", "TavernLife", "TavernShift", "TownQuests", "Wrak"],
    "pick": ["Act3", "Atmosphere", "Birds", "Bron", "Creatures", "Dwor", "Garnizon", "Humans", "Kantor", "Kasztelan", "Kruk", "Latarnia", "Lowy", "Ludzie", "Motyle",
             "Orzel", "Podroznicy", "Przystan", "Pustelnia", "Rywal", "Starcia", "Storm", "TownLife", "TownQuests", "Ubior_Sklepy", "Wrak"],
    "rand": ["Atmosphere", "Birds", "Kruk", "Motyle", "Orzel", "Storm", "WaterFx"],
    "lerp": ["HomeAmbience", "Mood", "TavernDice_Art", "TavernLife", "TavernShift", "TerenKit"],
    "smooth": ["Okolice", "Sky"],
    "ease": ["Prologue", "TitleScreen", "TavernLife", "TavernShift", "MenuRing"],
    "dist": ["Dezerter", "Dwor", "Kantor", "Podroznicy5", "Poselstwo", "Rywal", "SwieteKosci", "TownQuests"],
    "dist4": ["CleanHUD_Compass", "Lowy", "Ludzie", "Zakon"],
    "hash": ["Birds", "Motyle", "Survival", "TavernLife", "Ubior_Sklepy", "Goscie_Sala", "Lowy", "Zasoby"],
    "hash01": ["Latarnia", "Sky", "HomeLife"],
}
LOCAL = {"dist4": "dist", "ease": "ease"}           # the local name in those files
TARGET = {"ease": "easeOut", "dist4": "distXY"}     # the shared one
# the local name in each group (hash01 is "hash" in HomeLife)
LOCAL_OF = lambda grp, f: "hash" if (grp == "hash01" and f == "HomeLife") else LOCAL.get(grp, grp)
# the forms that count as the same (parameters renamed in order, spaces folded): the shared one's body
SAME = {
    "clamp": [r"\((\w+), (\w+), (\w+)\) => Math\.max\(\2, Math\.min\(\3, \1\)\)"],
    "pick": [r"(\w+) => \1\[Math\.floor\(Math\.random\(\) \* \1\.length\)\]"],
    "rand": [r"\((\w+), (\w+)\) => \1 \+ Math\.random\(\) \* \(\2 - \1\)"],
    "lerp": [r"\((\w+), (\w+), (\w+)\) => \1 \+ \(\2 - \1\) \* \3"],
    "smooth": [r"(\w+) => \1 \* \1 \* \(3 - 2 \* \1\)"],
    "ease": [r"(\w+) => 1 - Math\.pow\(1 - Math\.max\(0, Math\.min\(1, \1\)\), 3\)", r"(\w+) => 1 - Math\.pow\(1 - clamp\(\1, 0, 1\), 3\)", r"(\w+) => 1 - Math\.pow\(1 - clamp01\(\1\), 3\)"],
    "dist": [r"\((\w+), (\w+)\) => Math\.hypot\(\1\.x - \2\.x, \1\.y - \2\.y\)"],
    "dist4": [r"\((\w+), (\w+), (\w+), (\w+)\) => Math\.hypot\(\1 - \3, \2 - \4\)"],
    "hash": [r"\((\w+), (\w+)\) (?:=> )?\{ let h = Math\.imul\(\1 \| 0, 374761393\) \^ Math\.imul\(\2 \| 0, 668265263\); h = Math\.imul\(h \^ \(h >>> 13\), 1274126177\); return \(\(h \^ \(h >>> 16\)\) >>> 0\) / 4294967296; \}"],
    "hash01": [r"\((\w+), (\w+)\) \{ let h = \(\1 \* 374761393 \+ \2 \* 668265263\) \| 0; h = Math\.imul\(h \^ \(h >>> 13\), 1274126177\); return \(\(h \^ \(h >>> 16\)\) >>> 0\) / 4294967296; \}"],
}


def find_def(src, name):
    """(start, end, text, kind) of the 4-space-indented definition of `name` (arrow to the end of its line / function to its brace)"""
    m = re.search(r"(?m)^ {4}(const " + re.escape(name) + r" = (.*);[ \t]*$)", src)
    if m: return m.start(1), m.end(1), m.group(1), "arrow", m.group(2)
    m = re.search(r"(?m)^ {4}function " + re.escape(name) + r"\s*\(", src)
    if not m: return None
    i, depth = m.end() - 1, 0
    while i < len(src):
        c = src[i]
        if c in "({[": depth += 1
        elif c in ")}]":
            depth -= 1
            if c == "}" and depth == 0: break
        i += 1
    text = src[m.start() + 4:i + 1]
    return m.start() + 4, i + 1, text, "func", norm(text[len("function " + name):])


changes, problems = {}, []
for grp, files in WANT.items():
    for f in files:
        path = os.path.join(PLUG, f + ".js")
        src = changes.get(f) or open(path, "rb").read().decode("utf-8")
        local = LOCAL_OF(grp, f)
        d = find_def(src, local)
        if not d: problems.append("%s: brak definicji %s" % (f, local)); continue
        start, end, text, kind, body = d
        body = norm(body)
        if not any(re.fullmatch(p, body) for p in SAME[grp]): problems.append("%s: %s nie taki sam: %s" % (f, local, body[:120])); continue
        shared = TARGET.get(grp, grp)
        tname = "T" if re.search(r"const T = (window\.)?Tawerna\b", src[:start]) else "Tawerna"
        # a use of the name above its definition (the function form is hoisted, the const one is not): told, not changed
        above = [m.start() for m in re.finditer(r"(?<![\w.$])" + re.escape(local) + r"\(", src[:start])]
        if kind == "func" and above:
            problems.append("%s: %s używany wyżej niż definicja (%d razy) - zostaje" % (f, local, len(above))); continue
        new = "const %s = %s.util.%s;" % (local, tname, shared)
        src = src[:start] + new + src[end:]
        changes[f] = src
        print("  %-18s %-7s -> %s.util.%s" % (f, local, tname, shared))
print("plików:", len(changes))
for p in problems: print("  UWAGA", p)

# TawernaCore: the shared helpers next to num, flag, clamp01
core = open(os.path.join(PLUG, "TawernaCore.js"), "rb").read().decode("utf-8")
a = """    let seq = 0;   // registration order (stable sorts)
    T.util = { num, flag, clamp01, warnOnce };"""
b = """    let seq = 0;   // registration order (stable sorts)
    // (2026-11-07) the small ones the plugins wrote each for itself, exactly as they wrote them - one copy here; a plugin takes them
    // under its own name (const clamp = T.util.clamp). Not the other forms: another hash would change what is saved as drawn.
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const pick = list => list[Math.floor(Math.random() * list.length)];   // (a random one of a list)
    const rand = (a, b) => a + Math.random() * (b - a);                   // (a random number from a to b)
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = t => t * t * (3 - 2 * t);                              // (smoothstep of 0..1)
    const easeOut = t => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);   // (cubic, slows to the end; t held to 0..1)
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);              // (two things with x, y)
    const distXY = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
    // two whole numbers -> 0..1, the same each time (two forms the plugins used: the saved and the seen randomness keep their own)
    function hash(a, b) { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
    function hash01(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
    T.util = { num, flag, clamp01, warnOnce, clamp, pick, rand, lerp, smooth, easeOut, dist, distXY, hash, hash01 };"""
assert core.count(a) == 1
changes["TawernaCore"] = core.replace(a, b)

if "--wykonaj" in sys.argv:
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_pomocnicze")
    os.makedirs(kop, exist_ok=True)
    for f, s in changes.items():
        p = os.path.join(PLUG, f + ".js")
        shutil.copy(p, os.path.join(kop, f + ".js"))
        open(p, "wb").write(s.encode("utf-8"))
    print("zapisane do js/plugins; kopie:", kop)
else:
    shutil.rmtree(STG, ignore_errors=True)
    os.makedirs(STG, exist_ok=True)
    for f, s in changes.items(): open(os.path.join(STG, f + ".js"), "wb").write(s.encode("utf-8"))
    print("kopie w", STG)
