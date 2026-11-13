# -*- coding: utf-8 -*-
"""Gotowe obrazki pogody dla Klimat_Pogoda.js (gracz 2026-11-09: „wszystko, co się da i doda klimatu”): mokry bruk po deszczu
i śnieg zimą, wypalone z kafli mapy, w kawałkach CxC kratek (tylko te, w których coś jest):
  img/klimat/pogoda/MapNNN/mokro_X_Y.png     - mokra ziemia: przyciemnienie gruntu (bruk najmocniej, ziemia, deski, trawa słabo) i połysk
                                       na wierzchu kamieni (pod postaciami, nad gruntem)
  img/klimat/pogoda/MapNNN/snieg_X_Y.png     - śnieg na dolnej warstwie: grunt (na ulicach wydeptany pośrodku), dachy z kaflowych A3
                                       (z zarysem dachówek), czapy na górnych krawędziach płotów, murków i rzeczy, sople pod okapami
  img/klimat/pogoda/MapNNN/snieg_gora_X_Y.png - śnieg na kaflach rysowanych nad postaciami (☆ i region 3): dachy z arkusza dachów, czapy
                                       na blankach, kominach, wieżach
  img/system/Klimat_Slady.png         - ślady: stopa lewa / prawa, kopyto, łapa; błoto i śnieg; 8 kierunków (16 x 16)
  img/system/Klimat_Odbicie.png       - odbicie światła na mokrym (pionowa smuga z falami, 32 x 112)
Dane do wtyczki (spis kawałków, rodzaje gruntu A2 dla zestawów) wpisuje między znaczniki POGODA_DANE w js/plugins/Klimat_Pogoda.js.
Po każdej zmianie mapy w edytorze uruchomić znowu.   python tools/klimat/pogoda_miasta.py [mapy, domyślnie 8]"""
import json, math, os, re, sys
import numpy as np
import cv2
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
T, C, M = 48, 20, 1                      # tile px, chunk cells, margin cells
MAPS = [int(a) for a in sys.argv[1:] if a.isdigit()] or [8]
PLUGIN = os.path.join(ROOT, "js", "plugins", "Klimat_Pogoda.js")
# A3 kinds that are roofs on Winlu's sheet (tileset 11 - read off the sheet: tiles, slate, thatch, shingles; the rest are walls)
ROOF_A3 = {11: {48, 49, 53, 55, 56, 57, 59, 60, 63, 67, 68, 71}}
PATH_KINDS = {11: {40}, 9: {39}}   # (the cobbled streets / the author's dirt road: trodden; a dirt path in the grass stays white)   # the walked roads: the snow trodden in their middle
G_NONE, G_STONE, G_EARTH, G_GRASS = 0, 1, 2, 3
CL_NONE, CL_G, CL_F, CL_R, CL_W, CL_O, CL_WATER = 0, 1, 2, 3, 4, 5, 6
SNOW = np.array([232, 238, 247], np.float32); SNOW_HI = np.array([249, 251, 255], np.float32); SNOW_LO = np.array([194, 207, 226], np.float32)
WET = np.array([12, 16, 28], np.float32); SHEEN = np.array([206, 220, 238], np.float32)
ICE = np.array([214, 232, 250], np.float32)

# ------------------------------------------------------------------ the A2 ground kinds of every tileset: their look decides the class
def kind_classes(z):
    """A2 kinds 16..47: G_STONE / G_EARTH / G_GRASS by the full tile's colour; 0 for blocking (fences) and empty ones"""
    out = [0] * 48
    for k in range(16, 48):
        tid = 2048 + k * 48
        a = np.asarray(z.tile(tid)).astype(np.float32)
        al = a[..., 3] > 128
        if al.sum() < 0.5 * T * T or (z.flag(tid) & 0x0F) == 0x0F and not (z.flag(tid) & 0x10): continue
        r, g, b = [a[..., i][al].mean() for i in range(3)]
        if g > r + 8 and g > b + 8: out[k] = G_GRASS
        elif r > b + 22 and r - b > abs(g - b) * 0.6: out[k] = G_EARTH
        else: out[k] = G_STONE
    return out

def tile_np(z, tid, cache):
    if tid not in cache: cache[tid] = np.asarray(z.tile(tid)).astype(np.float32) / 255.0
    return cache[tid]

def tile_class(z, tid, layer, roofs, kcls):
    """the class of a tile's pixels and its ground class"""
    if tid >= 2048:
        k = (tid - 2048) // 48
        if k < 16: return CL_WATER, 0
        if k < 48:
            blocking = (z.flag(tid) & 0x0F) == 0x0F and not (z.flag(tid) & 0x10)
            if blocking: return (CL_F if layer >= 1 else CL_O), 0
            return CL_G, kcls[k] or G_GRASS
        if k < 80: return (CL_R if k in roofs else CL_W), 0
        return CL_W, 0
    if 1536 <= tid < 2048:
        return (CL_G, G_STONE) if (z.flag(tid) & 0x0F) != 0x0F else (CL_W, 0)
    if 768 <= tid < 1024 and "Roof" in (z.pliki[8] if len(z.pliki) > 8 else ""): return CL_R, 0
    return CL_O, 0

PAD = 2 * T                                  # (the noise reaches PAD px past the map on every side: the chunks' margins)
def noise_field(H, W, cell, seed):
    rng = np.random.default_rng(seed)
    return rng.random(((H + 2 * PAD) // cell + 6, (W + 2 * PAD) // cell + 6)).astype(np.float32)

def noise_crop(field, cell, px0, py0, w, h):
    """bilinear-cubic noise over the map's pixel grid, the same at the chunks' seams"""
    gx0, gy0 = px0 // cell, py0 // cell
    sub = field[gy0:gy0 + h // cell + 4, gx0:gx0 + w // cell + 4]
    big = cv2.resize(sub, (sub.shape[1] * cell, sub.shape[0] * cell), interpolation=cv2.INTER_CUBIC)
    ox, oy = px0 - gx0 * cell, py0 - gy0 * cell
    return big[oy:oy + h, ox:ox + w]

def hash2(x, y, k=0):
    h = (np.int64(x) * 374761393 + np.int64(y) * 668265263 + k * 1442695041) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((h ^ (h >> 16)) & 0xFFFF) / 65535.0

def bake(mid):
    mp = mapylib.Mapa(mid); z = mp.zest; W, H = mp.W, mp.H
    roofs = ROOF_A3.get(mp.tsid, set(range(48, 56)) | set(range(64, 72)))
    kcls = kind_classes(z); paths = PATH_KINDS.get(mp.tsid, set())
    cache = {}
    out_dir = os.path.join(ROOT, "img", "klimat", "pogoda", "Map%03d" % mid); os.makedirs(out_dir, exist_ok=True)   # (own folder: Klimat_Ziemia bakes into img/klimat/MapNNN)
    for f in os.listdir(out_dir):
        if f.endswith(".png"): os.remove(os.path.join(out_dir, f))
    nA = noise_field(H * T, W * T, 6, mid * 7 + 1); nB = noise_field(H * T, W * T, 20, mid * 7 + 2)
    files = {"mokro": [], "snieg": [], "gora": []}
    cols, rows = -(-W // C), -(-H // C)
    sizes = 0
    for cy in range(rows):
        for cx in range(cols):
            X0, Y0 = cx * C - M, cy * C - M
            nx, ny = C + 2 * M, C + 2 * M
            w, h = nx * T, ny * T
            low = np.zeros((h, w, 4), np.float32); up = np.zeros((h, w, 4), np.float32)
            cl = np.zeros((h, w), np.uint8); gk = np.zeros((h, w), np.uint8); ucl = np.zeros((h, w), np.uint8)
            path = np.zeros((h, w), np.uint8)
            for yy in range(ny):
                for xx in range(nx):
                    x, y = X0 + xx, Y0 + yy
                    if not mp.inside(x, y): continue
                    py, px = yy * T, xx * T
                    t0 = mp.t(0, x, y)
                    if t0 >= 2048 and (t0 - 2048) // 48 in paths: path[py:py + T, px:px + T] = 1
                    for layer in (0, 1, 2, 3):
                        tid = mp.t(layer, x, y)
                        if not tid: continue
                        a = tile_np(z, tid, cache)
                        upper = mp.nad_postacia(tid, x, y)
                        dst = up if upper else low
                        al = a[..., 3:4]
                        dst[py:py + T, px:px + T, :3] = a[..., :3] * al + dst[py:py + T, px:px + T, :3] * (1 - al)
                        dst[py:py + T, px:px + T, 3:4] = al + dst[py:py + T, px:px + T, 3:4] * (1 - al)
                        c, g = tile_class(z, tid, layer, roofs, kcls)
                        solid = a[..., 3] >= 0.5
                        if upper: ucl[py:py + T, px:px + T][solid] = c if c else CL_O
                        else:
                            cl[py:py + T, px:px + T][solid] = c
                            gk[py:py + T, px:px + T][solid] = g
            lum = (low[..., 0] * 0.3 + low[..., 1] * 0.59 + low[..., 2] * 0.11) * 255
            ulum = (up[..., 0] * 0.3 + up[..., 1] * 0.59 + up[..., 2] * 0.11) * 255
            gx0, gy0 = X0 * T, Y0 * T
            na = noise_crop(nA, 6, gx0 + PAD, gy0 + PAD, w, h); nb = noise_crop(nB, 20, gx0 + PAD, gy0 + PAD, w, h)
            Yi, Xi = np.mgrid[0:h, 0:w]; GX, GY = Xi + gx0, Yi + gy0
            # ---------------- wet ground
            wet = np.zeros((h, w, 4), np.float32)
            g_mask = cl == CL_G
            tint = np.select([gk == G_STONE, gk == G_EARTH, gk == G_GRASS], [0.42, 0.33, 0.14], 0.0) * g_mask
            wet[..., :3] = WET; wet[..., 3] = tint
            # the sheen: in soft patches (the 20 px noise) the stones' faces get a faint cool sky tint instead of plain darkening (one layer:
            # result = base * (1 - a) + colour * a with the same a - darker than dry everywhere, a little cooler and lighter in the
            # patches); inside the strongest patches a few single bright pixels on the stones' upper-left rims
            if g_mask.any():
                lum_s = cv2.GaussianBlur(lum, (0, 0), 3.0)
                face = g_mask & (lum > lum_s - 2)
                patch = np.clip((nb - 0.5) / 0.3, 0, 1)
                sh = face & (gk == G_STONE) & (patch > 0.02)          # (earth: only darker - pale spots on it read as dust)
                s = (0.09 * patch)[sh][:, None]
                a = np.maximum(wet[sh, 3:4], 0.05)
                wet[sh, :3] = (s * SHEEN + np.maximum(a - s, 0) * WET) / a
                dark_ul = np.roll(np.roll(lum, 2, 0), 2, 1)
                spark = sh & (gk == G_STONE) & (lum - dark_ul > 18) & (patch > 0.6) & (hash2(GX, GY, 17) < 0.22)
                wet[spark, :3] = SHEEN; wet[spark, 3] = 0.32
            # ---------------- snow (lower)
            sn = np.zeros((h, w, 4), np.float32)
            # ground: thick, with soft lumps (noise), trodden in the middle of the roads
            dist = cv2.distanceTransform((path > 0).astype(np.uint8), cv2.DIST_L2, 3)
            trod = np.clip((dist - 10) / 26, 0, 1)
            # a thick, even cover; soft big shades (the 20 px noise), a few bare spots; on the roads a trodden, greyer crust with the
            # stones showing through in the middle
            cover = 0.78 + 0.45 * (nb - 0.5) + 0.12 * (na - 0.5)
            trod_n = trod + 0.22 * (nb - 0.5) + 0.08 * (na - 0.5)          # (the crust's edge wavy, not a ruler line)
            gs = g_mask & (cover > 0.5) & (trod_n < 0.35)
            # (the ground's shades are gentle: a flat white with soft, slightly bluer drifts - no spots)
            tone = np.where(nb > 0.8, 2, np.where(nb < 0.18, 0, 1))
            col = np.where(tone[..., None] == 2, np.array([246, 249, 253], np.float32), np.where(tone[..., None] == 0, np.array([221, 229, 241], np.float32), SNOW))
            sn[gs, :3] = col[gs]; sn[gs, 3] = 0.97
            crust = g_mask & (trod_n >= 0.35)                                 # an even, walked-down crust
            ct = (206 + 10 * nb)[..., None] * np.array([1.0, 1.03, 1.09], np.float32)
            sn[crust, :3] = np.minimum(255, ct[crust]); sn[crust, 3] = 0.9
            dirt = crust & (hash2(GX // 2, GY // 2, 13) < 0.012)
            sn[dirt, :3] = np.array([168, 166, 168], np.float32)
            # the snow's own rims: 1 px shadow below, 1 px light above (crisp, like painted)
            anyS = sn[..., 3] > 0.5
            below_open = anyS & ~np.roll(anyS, -1, 0) & g_mask; above_open = anyS & ~np.roll(anyS, 1, 0) & g_mask
            sn[below_open, :3] = SNOW_LO * 0.92; sn[above_open, :3] = SNOW_HI
            sparkle = gs & (hash2(GX, GY, 11) < 0.004)
            sn[sparkle, :3] = 255
            # roofs (A3): snow over the tiles in three tones from the roof's own light, so the rows of tiles still show
            r_mask = cl == CL_R
            def roof_snow(dst, mask, L, X):
                if not mask.any(): return
                q1, q2 = np.percentile(L[mask], 30), np.percentile(L[mask], 72)
                t3 = np.where(L < q1, 0, np.where(L < q2, 1, 2))
                cc = np.where(t3[..., None] == 2, SNOW_HI, np.where(t3[..., None] == 0, SNOW_LO, SNOW))
                dst[mask, :3] = cc[mask]; dst[mask, 3] = 0.95
                # the eave: the roof's lowest 2 px a hanging overhang (lighter), then icicles below where the wall begins
                eave = mask & ~np.roll(mask, -1, 0)
                dst[eave, :3] = SNOW_LO; dst[eave, 3] = 0.98
                ey, ex = np.where(eave)
                for y, x in zip(ey, ex):
                    gxx, gyy = x + gx0, y + gy0
                    if hash2(gxx, gyy, 3) > 0.34 or y + 1 >= h: continue
                    if X[min(h - 1, y + 1), x] in (CL_R,) or X[min(h - 1, y + 1), x] == CL_NONE and low[min(h - 1, y + 1), x, 3] < 0.5: continue
                    L2 = 2 + int(hash2(gxx, gyy, 5) * 6)
                    for k in range(1, L2 + 1):
                        if y + k >= h: break
                        c2 = ICE if k < L2 else ICE * 1.04
                        dst[y + k, x, :3] = np.minimum(255, c2); dst[y + k, x, 3] = 0.92 if k < L2 else 0.7
                    if hash2(gxx, gyy, 7) < 0.5 and x + 1 < w and L2 > 3:      # a thicker icicle: a second, shorter column
                        for k in range(1, L2 - 1):
                            if y + k < h: dst[y + k, x + 1, :3] = SNOW_LO; dst[y + k, x + 1, 3] = 0.85
            roof_snow(sn, r_mask, lum, cl)
            # caps: the top edges of fences, low walls and things standing on the ground (the pixel above them open or ground)
            def caps(dst, solid_mask, above_ok, L):
                top = solid_mask & above_ok
                for k, (cc, a) in enumerate(((SNOW_HI, 0.98), (SNOW, 0.96), (SNOW_LO, 0.9))):
                    m = np.roll(top, k, 0) & solid_mask
                    if k == 2: m &= (na > 0.35)
                    dst[m, :3] = cc; dst[m, 3] = a
                pile = np.roll(top, -1, 0) & ~solid_mask & (na > 0.45)      # a 1 px heap over the edge here and there
                dst[pile, :3] = SNOW_HI; dst[pile, 3] = 0.95
            open_above = (np.roll(low[..., 3], 1, 0) < 0.5) | (np.roll(cl, 1, 0) == CL_G)
            caps(sn, np.isin(cl, (CL_F, CL_O)), open_above, lum)
            wall_top = (cl == CL_W) & open_above & (np.roll(cl, 1, 0) != CL_R)
            caps(sn, cl == CL_W, wall_top, lum)
            # ---------------- snow (upper: ☆ / region 3)
            su = np.zeros((h, w, 4), np.float32)
            roof_snow(su, ucl == CL_R, ulum, ucl)
            u_solid = up[..., 3] >= 0.5
            caps(su, u_solid & (ucl != CL_R), ~np.roll(u_solid, 1, 0), ulum)
            # ---------------- write (the chunk without its margin)
            sl = (slice(M * T, M * T + C * T), slice(M * T, M * T + C * T))
            for key, arr in (("mokro", wet), ("snieg", sn), ("gora", su)):
                part = arr[sl]
                if part[..., 3].max() <= 0.01: continue
                img = np.zeros(part.shape, np.uint8)
                img[..., :3] = np.clip(part[..., :3], 0, 255).astype(np.uint8)
                img[..., 3] = np.clip(part[..., 3] * 255, 0, 255).astype(np.uint8)
                name = {"mokro": "mokro", "snieg": "snieg", "gora": "snieg_gora"}[key] + "_%d_%d.png" % (cx, cy)
                p = os.path.join(out_dir, name)
                # (a palette of 96 colours with alpha: a few tones of dark / snow are all there is - a quarter of the bytes)
                Image.fromarray(img, "RGBA").quantize(colors=96, method=Image.Quantize.FASTOCTREE).save(p, optimize=True)
                sizes += os.path.getsize(p); files[key].append("%d_%d" % (cx, cy))
            print("  kawałek %d,%d" % (cx, cy), end="\r")
    print("Map%03d: mokro %d, śnieg %d, śnieg nad postaciami %d kawałków, %.1f MB" % (mid, len(files["mokro"]), len(files["snieg"]), len(files["gora"]), sizes / 1e6))
    return {"c": C, "cols": cols, "rows": rows, "mokro": files["mokro"], "snieg": files["snieg"], "gora": files["gora"]}

# ------------------------------------------------------------------ the shared small pictures
def prints_sheet():
    """8 directions (cols, 0 = up, clockwise by 45 deg) x 8 rows: foot L, foot R, hoof, paw - mud (rows 0-3), snow (rows 4-7)"""
    base = {}
    def blank(): return Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    def put(im, pts, col):
        px = im.load()
        for (x, y) in pts:
            if 0 <= x < 16 and 0 <= y < 16: px[x, y] = col
    # a bare foot, pointing up (toes at the top): sole 3-4 px wide, 7 px long, 3 toe dots
    sole = [(x, y) for y in range(7, 13) for x in range(6, 10) if not ((y in (7, 12)) and x in (6, 9))] + [(6, 13), (7, 13), (8, 13)]
    toes = [(6, 5), (7, 5), (8, 5), (9, 6)]
    hoof = [(x, y) for y in range(5, 11) for x in range(5, 11) if (x in (5, 10) or y == 5) and not (y == 5 and x in (5, 10))]
    hoof = [(5, 6), (5, 7), (5, 8), (5, 9), (10, 6), (10, 7), (10, 8), (10, 9), (6, 5), (7, 5), (8, 5), (9, 5), (6, 10), (9, 10)]
    paw = [(7, 8), (8, 8), (7, 9), (8, 9), (6, 9), (9, 9), (7, 10), (8, 10)] + [(5, 6), (7, 5), (8, 5), (10, 6)]
    shapes = {"L": (sole, toes), "R": ([(15 - x, y) for x, y in sole], [(15 - x, y) for x, y in toes]), "H": (hoof, []), "P": (paw, [])}
    sheet = Image.new("RGBA", (16 * 8, 16 * 8), (0, 0, 0, 0))
    for vi, (main, rim) in enumerate((((60, 42, 30, 175), (44, 30, 22, 190)), ((146, 164, 196, 225), (126, 144, 182, 235)))):
        for si, key in enumerate("LRHP"):
            body, extra = shapes[key]
            im = blank(); put(im, body, main); put(im, extra, rim)
            if vi == 1:   # pressed snow: a light rim on the lower side of each print
                px = im.load()
                for (x, y) in body:
                    if y + 1 < 16 and px[x, y + 1][3] == 0: px[x, y + 1] = (250, 252, 255, 150)
            for d in range(8):
                r = im.rotate(-45 * d, resample=Image.NEAREST, center=(7.5, 8.5))
                sheet.alpha_composite(r, (d * 16, (vi * 4 + si) * 16))
    sheet.save(os.path.join(ROOT, "img", "system", "Klimat_Slady.png"))

def reflection():
    w, h = 32, 112
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    across = np.exp(-((xx - 15.5) / 4.2) ** 2)
    down = np.clip(1 - yy / h, 0, 1) ** 1.4
    rng = np.random.default_rng(5)
    waves = np.ones(h, np.float32)
    y = 4
    while y < h:
        gap = int(rng.integers(2, 4)); waves[y:y + gap] = 0.25 + 0.2 * rng.random(); y += gap + int(rng.integers(3, 8))
    shift = np.round(np.sin(yy / 5.0) * 1.2).astype(int)
    a = across * down * waves[:, None]
    a = np.take_along_axis(a, np.clip(xx.astype(int) + shift, 0, w - 1), axis=1)
    img = np.zeros((h, w, 4), np.uint8)
    img[..., 0], img[..., 1], img[..., 2] = 255, 214, 150
    img[..., 3] = np.clip(a * 255, 0, 255).astype(np.uint8)
    Image.fromarray(img, "RGBA").save(os.path.join(ROOT, "img", "system", "Klimat_Odbicie.png"))

if __name__ == "__main__":
    baked = {}
    for mid in MAPS: baked[mid] = bake(mid)
    prints_sheet(); reflection()
    tss = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))
    kinds = {}
    for t in tss:
        if not t or not (t.get("tilesetNames") or [""])[1]: continue
        try: kinds[t["id"]] = kind_classes(mapylib.zestaw(t["id"]))
        except Exception: pass
    data = "    const BAKED = %s;\n    const KIND_CLASS = %s;\n" % (json.dumps({str(k): v for k, v in baked.items()}, separators=(",", ":")),
                                                                json.dumps({str(k): v for k, v in kinds.items()}, separators=(",", ":")))
    if os.path.exists(PLUGIN):
        b = open(PLUGIN, "rb").read().decode("utf-8")
        i = b.index("    // <POGODA_DANE>\n") + len("    // <POGODA_DANE>\n"); j = b.index("    // </POGODA_DANE>")
        open(PLUGIN, "wb").write((b[:i] + data + b[j:]).encode("utf-8")); print("dane wpisane do Klimat_Pogoda.js")
    else: print(data[:400])
