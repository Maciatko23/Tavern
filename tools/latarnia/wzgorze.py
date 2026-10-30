# python tools/latarnia/wzgorze.py [--write] [--png PLIK]
# 2026-10-29: wzgórze latarni w trzech piętrach (terrain() w build.py). Generator build.py rysuje tylko blok 44 x 40 (lewy górny róg
# Map159 po powiększeniu x2 zostaje bajt w bajt), więc tu: generuje nowy blok i wkleja go (kafle, 6 warstw) do obecnej data/Map159.json,
# zostawiając wschodnią i południową część oraz ręczne łatki (kolumna szwu x=43, wiersz 39, warstwa 3 w (17,14-16)).
# Bez --write: tylko podgląd (--png) i raport. Z --write: zapisuje data/Map159.json w układzie edytora (edytor MUSI być zamknięty).
import sys, os, json, importlib.util
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
spec = importlib.util.spec_from_file_location("lb", os.path.join(HERE, "build.py"))
lb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lb)


def dump(o): return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def map_text(m):
    props = {k: v for k, v in m.items() if k not in ("data", "events")}
    lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(m["data"]) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(m["events"]) - 1 else "") for i, e in enumerate(m["events"])]
    lines += ["]", "}"]
    return "\n".join(lines)


def main():
    path = os.path.join(ROOT, "data", "Map159.json")
    raw = open(path, "rb").read()
    cur = json.loads(raw.decode("utf-8"))
    assert map_text(cur).encode("utf-8") == raw, "Map159.json nie jest w układzie edytora"
    mp = lb.build159()
    data = mp.resolve()
    events = mp.build_events()
    # decorations (flowers, ferns) on layers 1-3 over rims, faces and flights would cancel their flags: the top tile that is not a star
    # decides the passage - clear them so the cliffs stay shut (only the flights lead up)
    Wg, Hg = lb.W, lb.H
    for (x, y) in set(mp.rims) | set(mp.faces) | set(mp.stair_cells):
        for z in (1, 2, 3):
            data[(z * Hg + y) * Wg + x] = 0
    lb.paint_regions(data, events)
    W, H, W2, H2 = lb.W, lb.H, cur["width"], cur["height"]
    changed = 0
    for z in range(6):
        for y in range(H - 1):
            for x in range(W - 1):
                if z == 3 and x == 17 and y in (14, 15, 16):
                    continue
                a = data[(z * H + y) * W + x]
                i = (z * H2 + y) * W2 + x
                if cur["data"][i] != a:
                    cur["data"][i] = a
                    changed += 1
    print("zmienionych kafli:", changed)
    if "--png" in sys.argv:
        import mtlib
        mtlib.render(cur, sys.argv[sys.argv.index("--png") + 1])
    if "--write" in sys.argv:
        open(path, "wb").write(map_text(cur).encode("utf-8"))
        print("zapisano", path)
    return cur


if __name__ == "__main__":
    main()
