# -*- coding: utf-8 -*-
"""Cofnięcie „za wzgórzem” na mapach (gracz 2026-11-03 20:05: „jednak przywracamy normalne działanie - można wejść na wzgórze, ale nie za
wzgórze”): region 3, który tools/za_wzgorzem/maluj.py dał tylnym krawędziom, wraca do numeru sprzed malowania (0; 9 - łąka Map003; 2 - Map991),
z kopii zapasowych malowania. Kratki, które miały 3 już wcześniej (12 kratek gracza na Map990), zostają. Tylko te liczby, reszta pliku ta sama.
  python tools/za_wzgorzem/cofnij_regiony.py --dry-run | --wykonaj   (edytor zamknięty!)"""
import os, sys, json, hashlib, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
KOPIE = ["20261103_191749_mapy", "20261103_194912_mapy"]


def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    plan = []
    for k in KOPIE:
        d = os.path.join(HERE, "kopie_zapasowe", k)
        for f in sorted(os.listdir(d)):
            przed = json.load(open(os.path.join(d, f), encoding="utf-8"))
            p = os.path.join(ROOT, "data", f)
            b = open(p, "rb").read()
            teraz = json.loads(b.decode("utf-8"))
            W, H = teraz["width"], teraz["height"]
            assert (przed["width"], przed["height"]) == (W, H)
            zm = {}
            for i in range(5 * W * H, 6 * W * H):
                if teraz["data"][i] == 3 and przed["data"][i] != 3: zm[i] = przed["data"][i]
            i0 = b.find(b'"data":[') + 8; j0 = b.find(b"]", i0)
            vals = b[i0:j0].split(b",")
            for i, v in zm.items():
                assert vals[i] == b"3"; vals[i] = str(v).encode()
            nb = b[:i0] + b",".join(vals) + b[j0:]
            from collections import Counter
            print("%s: %d kratek 3 -> %s" % (f, len(zm), dict(Counter(zm.values()))))
            plan.append((p, b, nb))
    if not wykonaj:
        print("(dry-run: nic nie zapisano; przy zamkniętym edytorze: --wykonaj)")
        return
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_przed_cofnieciem_map")
    os.makedirs(kop, exist_ok=True)
    for p, b, nb in plan:
        open(os.path.join(kop, os.path.basename(p)), "wb").write(b)
        open(p, "wb").write(nb)
    print("zapisano; kopie zapasowe:", kop)


if __name__ == "__main__":
    main()
