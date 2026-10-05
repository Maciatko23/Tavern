# python tools/podgrodzie/check_wnetrza.py [112 ...] [--png DIR]  -> the town interiors' checks (tools/interiors/check_interiors.py:
# table items on their tops, nothing squeezed, every floor cell reachable from the landing, the doorway free, the residents'
# spots free and reachable) on the staged Podgrodzie interiors; --png: the walking previews (tools/interiors/preview.py) and
# the plain pictures into DIR (default docs/podgrodzie/). Exit code 1 on any problem.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/interiors")
import check_interiors as CI
import preview as PV

STAGING_P = os.path.join(HERE, "staging")
CI.STAGING = STAGING_P
PV.STAGING = STAGING_P
FILES = {112: "wnetrze_praczka", 113: "wnetrze_drwal", 114: "wnetrze_klusownik", 115: "wnetrze_znachorka",
         116: "wnetrze_szmaciarz", 117: "wnetrze_uchodzcy"}

def main():
    ids = [int(a) for a in sys.argv[1:] if a.isdigit()] or sorted(FILES)
    bad = sum(CI.check(i)[0] for i in ids)
    if "--png" in sys.argv:
        k = sys.argv.index("--png")
        out = sys.argv[k + 1] if k + 1 < len(sys.argv) and not sys.argv[k + 1].isdigit() else ROOT + "docs/podgrodzie"
        os.makedirs(out, exist_ok=True)
        for i in ids:
            PV.preview(i, os.path.join(out, FILES[i] + "_przejscia.png"))
            PV.preview(i, os.path.join(out, FILES[i] + ".png"), plain=True)
        print("pictures ->", out)
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
