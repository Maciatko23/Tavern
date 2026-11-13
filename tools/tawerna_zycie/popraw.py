# -*- coding: utf-8 -*-
# Tawerna zycie: rebuilds tools/tawerna_zycie/staging from the CURRENT live files (tests, plugins, maps) with exact-string patches.
# A missing anchor = STOP. Binary mode, LF. Test: GAME_OVERLAY=tools/tawerna_zycie/staging GAME_OVERLAY_JS=1 CDP_PORT=947x node tools/tawerna_zycie/staging/tests/<test>.js
import os, sys, shutil, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STAGING = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W


def rd(rel):
    return open(os.path.join(ROOT, rel), "rb").read().decode("utf-8").replace("\r\n", "\n")


def wr(rel, text):
    p = os.path.join(STAGING, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "wb").write(text.encode("utf-8"))
    print("staged", rel)


def patch(rel, pairs):
    """pairs: (old, new[, count]); old must occur exactly `count` (default 1) times in the CURRENT live file"""
    t = rd(rel)
    for pr in pairs:
        old, new = pr[0], pr[1]
        n = pr[2] if len(pr) > 2 else 1
        if t.count(old) != n:
            raise SystemExit("STOP: %s: anchor x%d (wanted %d): %s" % (rel, t.count(old), n, old[:90]))
        t = t.replace(old, new)
    wr(rel, t)


# ------------------------------------------------------------------ the maps (W.map_text, round trip, events index == id, ids < 500)
def map_patch(n, fn):
    rel = "data/Map%03d.json" % n
    raw = open(os.path.join(ROOT, rel), "rb").read()
    m = json.loads(raw.decode("utf-8"))
    if W.map_text(m).encode("utf-8") != raw:
        raise SystemExit("STOP: %s is not in the editor's layout" % rel)
    fn(m)
    for i, e in enumerate(m["events"]):
        if e is not None and e["id"] != i:
            raise SystemExit("STOP: %s events index != id at %d" % (rel, i))
        if e is not None and e["id"] >= 500:
            raise SystemExit("STOP: %s event id >= 500" % rel)
    txt = W.map_text(m)
    if json.loads(txt) != m:
        raise SystemExit("STOP: round trip %s" % rel)
    p = os.path.join(STAGING, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "wb").write(txt.encode("utf-8"))
    print("staged", rel)


if os.path.isdir(STAGING):
    shutil.rmtree(STAGING)
os.makedirs(STAGING)

exec(open(os.path.join(HERE, "zmiany.py"), "rb").read().decode("utf-8"))
