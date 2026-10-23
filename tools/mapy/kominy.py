# python tools/mapy/kominy.py [--wykonaj] [--podglad PLIK.png]
# Kominy na dach (gracz 2026-10-23: „kominy mają źle ustawioną animację na dachu”): kominy z kafli B zestawów 9 i 11 (daszek 83-85 nad
# trzonem 91-93, warstwa 3) stały daszkiem kratkę NAD dachem - na trawie za domem - a dym (!Fantasy_chimney, z własnym kamiennym
# klockiem) siedział na tym daszku. Tu cały komin schodzi o kratkę w dół: daszek na górny rząd dachu, trzon pod nim, dym na daszku;
# region 2 (blokada za kominem) z dawnego miejsca daszka wraca do regionu sąsiadów. Tylko tam, gdzie pod daszkiem jest dach (A3) na
# dwa rzędy i nic innego w warstwie 3. Bez --wykonaj: tylko raport (i podgląd przed/po). Zapis: układ edytora (popraw.tekst_mapy),
# kopia do archiwum, edytor RPG Maker musi być zamknięty.
import os, sys, copy, json, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import mapylib as L      # noqa: E402
import popraw as P       # noqa: E402

CAPS, COLS = (83, 84, 85), (91, 92, 93)
A3 = range(4352, 5888)            # dachy i ściany zewnętrzne (A3)
GROUND = range(1536, 4352)        # ziemia (A5, A1, A2): daszek stoi na niej = za domem, nie na dachu
POMIN = {1, 101}                  # tawerna (gracz ją poprawia), paleta
ARCH = os.path.abspath(os.path.join(L.ROOT, "..", "Tawerna_archiwum_2026-10-18", "dane_przed_kominami"))


def smoke_ids(raw, x, y):
    return [e["id"] for e in raw["events"] if e and e["x"] == x and e["y"] == y
            and any("chimney" in (pg["image"]["characterName"] or "") for pg in e["pages"])]


def plan(raw):
    W, H = raw["width"], raw["height"]
    i = lambda z, x, y: (z * H + y) * W + x
    t = lambda z, x, y: raw["data"][i(z, x, y)] if 0 <= x < W and 0 <= y < H else None
    out, pominiete = [], []
    for y in range(H - 2):
        for x in range(W):
            if t(3, x, y) not in CAPS or t(3, x, y + 1) not in COLS: continue
            ok = t(0, x, y) in GROUND and t(0, x, y + 1) in A3 and t(0, x, y + 2) in A3 and not t(3, x, y + 2)
            (out if ok else pominiete).append((x, y))
    return out, pominiete


def popraw_mape(raw, kominy):
    W, H = raw["width"], raw["height"]
    i = lambda z, x, y: (z * H + y) * W + x
    d = raw["data"]
    opis = []
    for (x, y) in kominy:
        cap, col = d[i(3, x, y)], d[i(3, x, y + 1)]
        d[i(3, x, y)], d[i(3, x, y + 1)], d[i(3, x, y + 2)] = 0, cap, col
        if d[i(5, x, y)] == 2:
            sasiad = [d[i(5, xx, y)] for xx in (x - 1, x + 1) if 0 <= xx < W and d[i(5, xx, y)] != 2]
            d[i(5, x, y)] = sasiad[0] if sasiad else 0
            if d[i(5, x, y + 1)] == 0: d[i(5, x, y + 1)] = 2
        ids = smoke_ids(raw, x, y)
        for e in raw["events"]:
            if e and e["id"] in ids: e["y"] = y + 1
        opis.append("(%d,%d) -> (%d,%d)%s" % (x, y, x, y + 1, " + dym %s" % ids if ids else ""))
    return opis


def podglad(przed, po, mid, kominy, plik):
    from PIL import Image
    tiles = []
    for (x, y) in kominy:
        reg = lambda mp: (max(0, x - 3), max(0, y - 3), min(mp.W - 1, x + 3), min(mp.H - 1, y + 4))
        a = L.Mapa(mid, raw=przed); b = L.Mapa(mid, raw=po)
        tiles.append((L.render(a, region=reg(a)), L.render(b, region=reg(b))))
    if not tiles: return
    w = max(p[0].width for p in tiles); h = max(p[0].height for p in tiles)
    cols = 4
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * (2 * w + 16), rows * (h + 8)), (20, 20, 20, 255))
    for n, (a, b) in enumerate(tiles):
        ox, oy = (n % cols) * (2 * w + 16), (n // cols) * (h + 8)
        sheet.alpha_composite(a, (ox, oy)); sheet.alpha_composite(b, (ox + w + 4, oy))
    sheet = sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS)
    sheet.save(plik)


def main():
    wykonaj = "--wykonaj" in sys.argv
    pod = sys.argv[sys.argv.index("--podglad") + 1] if "--podglad" in sys.argv else None
    if wykonaj and P.edytor_otwarty():
        print("Edytor RPG Maker MZ jest otwarty - nic nie zapisano."); return 1
    for mid in L.all_map_ids():
        if mid in POMIN: continue
        path = L.DATA + "Map%03d.json" % mid
        bajty = P.wczytaj_bajty(path)
        raw = json.loads(bajty.decode("utf-8"))
        if raw.get("tilesetId") not in (9, 11): continue      # (oba z tym samym arkuszem B Winlu)
        kominy, pominiete = plan(raw)
        if not kominy and not pominiete: continue
        po = copy.deepcopy(raw)
        opis = popraw_mape(po, kominy)
        print("Map%03d %s: %d kominów%s" % (mid, L.map_name(mid), len(kominy), (", pominięte %s" % pominiete) if pominiete else ""))
        for o in opis: print("   ", o)
        if pod and kominy: podglad(raw, po, mid, kominy, pod.replace(".png", "_%03d.png" % mid))
        if not wykonaj or not kominy: continue
        if P.tekst_mapy(raw) != bajty:
            print("    POMINIĘTA: plik nie jest w układzie edytora"); continue
        os.makedirs(ARCH, exist_ok=True)
        stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        with open(os.path.join(ARCH, "Map%03d_%s.json" % (mid, stamp)), "wb") as f: f.write(bajty)
        if P.wczytaj_bajty(path) != bajty or P.edytor_otwarty():
            print("    POMINIĘTA: plik zmienił się w trakcie albo otworzono edytor"); continue
        with open(path, "wb") as f: f.write(P.tekst_mapy(po))
        print("    zapisano")
    return 0


if __name__ == "__main__":
    sys.exit(main())
