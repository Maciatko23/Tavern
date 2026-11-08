# -*- coding: utf-8 -*-
"""Refaktor 2026-11-07, krok „pomocnicze”: te same małe funkcje (clamp, pick, hash, lerp, rand...) przepisane w wielu wtyczkach.
Wypisuje grupy DOKŁADNIE takich samych (po zwinięciu odstępów i nazw parametrów) - tylko takie można zastąpić jedną wspólną
(Tawerna.util), bo inna wersja (np. inny hash - zapisane losowanie, inne zachowanie przy odwróconych granicach) zmieniłaby grę.
  python tools/porzadki/pomocnicze.py [nazwa ...]"""
import collections, glob, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
NAMES = sys.argv[1:] or ["clamp", "pick", "hash", "lerp", "rand", "smooth", "ease", "shuffle", "popup", "dist", "sign", "hash01", "mix", "smoothstep", "randInt", "chance", "between"]


def body_of(src, start):
    """the definition starting at `start`: an arrow to the end of its statement, or a function to its closing brace"""
    i, depth, n = start, 0, len(src)
    head = src[start:start + 200]
    is_fn = re.match(r"\s*function\b", head) is not None
    seen_brace = False
    while i < n:
        c = src[i]
        if c in "([{": depth += 1; seen_brace = seen_brace or c == "{"
        elif c in ")]}":
            depth -= 1
            if is_fn and depth == 0 and c == "}" and seen_brace: return src[start:i + 1]
        elif c == ";" and depth == 0 and not is_fn: return src[start:i + 1]
        elif c == "\n" and depth == 0 and not is_fn and i > start + 5: return src[start:i]
        i += 1
    return src[start:]


def norm(text, name):
    t = re.sub(r"\s+", " ", text).strip().rstrip(";")
    t = re.sub(r"^(const|let|var) " + name + r" = ", "ARROW ", t)
    t = re.sub(r"^function " + name + r"\s*\(", "FUNC (", t)
    # parameter names do not matter: rename them in order
    m = re.match(r"^(ARROW |FUNC )\(?([\w\s,=.]*?)\)? ?(=>|\{)", t)
    if m:
        params = [p.split("=")[0].strip() for p in m.group(2).split(",") if p.strip()]
        for k, p in enumerate(params):
            t = re.sub(r"\b" + re.escape(p) + r"\b", "p%d" % k, t)
    return t


for name in NAMES:
    groups = collections.defaultdict(list)
    for path in sorted(glob.glob(os.path.join(ROOT, "js", "plugins", "*.js"))):
        if os.path.basename(path) == "Watki.js": continue
        src = open(path, "rb").read().decode("utf-8")
        for m in re.finditer(r"(?m)^ {4}((?:const|let|var) " + name + r" = |function " + name + r"\s*\()", src):
            text = body_of(src, m.start(1))
            groups[norm(text, name)].append((os.path.basename(path), src.count("\n", 0, m.start()) + 1))
    if not groups: continue
    print("=== %s: %d definicji, %d różnych" % (name, sum(len(v) for v in groups.values()), len(groups)))
    for k, v in sorted(groups.items(), key=lambda kv: -len(kv[1])):
        print("  %2dx  %s" % (len(v), k[:150]))
        print("       " + ", ".join("%s:%d" % f for f in v))
