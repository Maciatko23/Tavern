# -*- coding: utf-8 -*-
"""Tawerna 2: applies the re-pins (tools/tawerna2/przepiecia*.json) to STAGED COPIES of the plugins / texts.
Each entry: {"plik": "js/plugins/X.js", "stare": "exact old text", "nowe": "new text", "ile": 1, "po": "why"}.
Precondition: `stare` occurs exactly `ile` times (default 1) in the file as it is in the game NOW; otherwise STOP (nothing is written).
Several entries per file are applied in order to the same staged copy. Text is matched with LF; files with CRLF are matched/written with CRLF.
Output: tools/tawerna2/staging/<plik>  +  tools/tawerna2/staging/SHA_przepiecia.json (sha1 of the game file the copy was made from).
   python tools/tawerna2/przepinaj.py"""
import os, sys, json, glob, hashlib
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
entries = []
for f in sorted(glob.glob(os.path.join(HERE, "przepiecia*.json"))):
    entries += json.load(open(f, encoding="utf-8"))
by = {}
for e in entries:
    if "plik" not in e: continue          # (documentation entries, e.g. the room remap table)
    by.setdefault(e["plik"], []).append(e)
bad, sha = [], {}
for rel, lst in by.items():
    raw = open(os.path.join(ROOT, *rel.split("/")), "rb").read()
    sha[rel] = hashlib.sha1(raw).hexdigest()
    crlf = b"\r\n" in raw
    txt = raw.decode("utf-8")
    if crlf: txt = txt.replace("\r\n", "\n")
    for e in lst:
        n = txt.count(e["stare"])
        if n != e.get("ile", 1): bad.append("%s: '%s...' occurs %d times, expected %d" % (rel, e["stare"][:60].replace("\n", "\n"), n, e.get("ile", 1))); continue
        txt = txt.replace(e["stare"], e["nowe"])
    if crlf: txt = txt.replace("\n", "\r\n")
    out = os.path.join(STG, *rel.split("/"))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "wb").write(txt.encode("utf-8"))
if bad:
    for b in bad: print("STOP:", b)
    sys.exit(1)
json.dump(sha, open(os.path.join(STG, "SHA_przepiecia.json"), "w"), indent=1)
print("re-pins applied: %d entries in %d files" % (len(entries), len(by)))
