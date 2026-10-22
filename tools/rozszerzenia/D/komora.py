# Paczka D (docs/rozszerzenia/PLAN.md 7.4): mapa 176 „Komora pod menhirami” - kafle komory pierwszego strażnika warty.
# Pisze tools/rozszerzenia/D/Map176.json w układzie edytora (wspolne.map_text); instaluje go instalator:
#   python tools/rozszerzenia/instaluj.py --paczka D --mapa 176 tools/rozszerzenia/D/Map176.json [--wykonaj]
# Kafle jak w ręcznych piętrach podziemi (Map146 „Sala jednego pytania”, tileset 12): sufit 6800, ściana z niszami 7042/7048,
# posadzka 3728. Zdarzenia (schody, sarkofag, misa, ściana z wieżami, skrzynia, posągi) wstawia Zakon.js (Tawerna.inject 2770-2779),
# więc mapa ma tylko kafle. Uruchomienie: python tools/rozszerzenia/D/komora.py  (bez argumentów; nic nie pisze do data/)
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from wspolne import ROOT, map_text   # noqa: E402

W, H = 20, 14
C, E = 256, 768                       # tileset 12: C = Fantasy_Dungeon_C, E = Fantasy_Dungeon_E


def tid(base, col, row):
    return base + (row * 8 + col if col < 8 else 128 + row * 8 + col - 8)


def main():
    src = json.load(open(os.path.join(ROOT, "data", "Map176.json"), encoding="utf-8"))
    data = [0] * (W * H * 6)
    put = lambda z, x, y, v: data.__setitem__((z * H + y) * W + x, v)
    for y in range(H):
        for x in range(W):
            put(0, x, y, 6800)
    x0, x1 = 3, 16                    # the floor's columns; the room's walls round them
    # the ceiling's edge, the wall with niches (two rows), the floor, the bottom edge
    put(0, 2, 1, 6804); put(0, 17, 1, 6808)
    for x in range(x0, x1 + 1): put(0, x, 1, 6828)
    for y in range(2, 11):
        put(0, 2, y, 6824); put(0, 17, y, 6816)
    for x in range(x0, x1 + 1):
        put(0, x, 2, 7043 if x == x0 else 7046 if x == x1 else 7042)
        put(0, x, 3, 7049 if x == x0 else 7052 if x == x1 else 7048)
        put(0, x, 4, 3762 if x == x0 else 3764 if x == x1 else 3748)
        for y in range(5, 10):
            put(0, x, y, 3744 if x == x0 else 3752 if x == x1 else 3728)
        put(0, x, 10, 3768 if x == x0 else 3766 if x == x1 else 3756)
    put(0, 2, 11, 6802); put(0, 17, 11, 6801)
    for x in range(x0, x1 + 1): put(0, x, 11, 6820)
    # the sarcophagus of the first watchman (x 9-10, y 6-7: the lid, the carved front)
    put(2, 9, 6, tid(E, 4, 6)); put(2, 10, 6, tid(E, 5, 6)); put(2, 9, 7, tid(E, 4, 7)); put(2, 10, 7, tid(E, 5, 7))
    # two hooded stone brothers beside it (head, body, base)
    for x, col in ((7, 14), (12, 15)):
        put(2, x, 5, tid(C, col, 13)); put(2, x, 6, tid(C, col, 14)); put(2, x, 7, tid(C, col, 15))
    # two columns by the side walls, urns in the corners
    for x in (4, 15):
        put(2, x, 8, tid(C, 11, 9)); put(2, x, 9, tid(C, 11, 10))
    put(2, 3, 4, tid(E, 6, 13)); put(2, 16, 4, tid(E, 7, 13)); put(2, 16, 10, tid(E, 6, 13))
    # the shadow of the left wall (as on Map146)
    for y in range(4, 11): put(4, x0, y, 5)
    src["data"] = data
    src["width"], src["height"] = W, H
    src["events"] = [None]
    src["note"] = "<Dust:on>\n<Dark:on>\n<DayNight:off>\n<DarkDay:226>\n<DarkNight:226>\n<Ambience:cave>\n<Hunt:off>\n<Build:off>\n<Farm:off>\n<Minimap:off>\n<Zakon:komora>"
    src["displayName"] = "Komora pod menhirami"
    out = os.path.join(HERE, "Map176.json")
    open(out, "wb").write(map_text(src).encode("utf-8"))
    print("zapisano", out)


if __name__ == "__main__":
    main()
