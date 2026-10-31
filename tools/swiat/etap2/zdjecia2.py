# -*- coding: utf-8 -*-
"""docs/swiat_etap2/: przed (data/, po etapie 1) i po (staging etapu 2) z renderera map; zestawienie map gracza (3, 4, 23, 24)."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as M
from PIL import Image, ImageDraw, ImageFont
OUT = os.path.join(ROOT, "docs", "swiat_etap2"); os.makedirs(OUT, exist_ok=True)
STG = os.path.join(HERE, "staging", "data")
def pa(mid, region, name, w=None, only_after=False):
    for tag, path in (("przed", None), ("po", os.path.join(STG, "Map%03d.json" % mid) if os.path.exists(os.path.join(STG, "Map%03d.json" % mid)) else None)):
        if only_after and tag == "przed": continue
        im = M.render(M.Mapa(mid, path=path), region=region).convert("RGB")
        if w: im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
        im.save(os.path.join(OUT, "%s_%s.png" % (name, tag)))
if __name__ == "__main__":
    pa(20, (0, 0, 79, 63), "m020_dom_dziadka_calosc", w=1200)
    pa(20, (0, 0, 28, 14), "m020_wyjscie_N_droga")
    pa(3, (0, 44, 24, 59), "m003_poludnie_do_domu_dziadka")
    pa(3, (0, 10, 14, 27), "m003_zachod_do_dworu_i_laki3")
    pa(24, (30, 8, 79, 30), "m024_wschod_do_pola", w=1100)
    pa(24, (28, 50, 52, 59), "m024_poludnie_do_sadow")
    pa(4, (56, 28, 79, 46), "m004_wschod_bez_zmian")
    pa(3, (0, 40, 24, 59), "m003_poludnie_istniejaca_sciezka")
    pa(23, (28, 46, 52, 59), "m023_poludnie_do_laki2")
    pa(23, (12, 0, 36, 10), "m023_polnoc_do_pol")
    pa(17, (28, 0, 52, 12), "m017_polnoc_do_skraju")
    pa(900, (0, 0, 74, 59), "m900_pola_pod_grzbietem", w=1100, only_after=True)
    pa(901, (0, 0, 79, 41), "m901_sady_pod_dworem", w=1100, only_after=True)
    rows = [("m003_poludnie_istniejaca_sciezka", "Kruczy Jar (3): południe - istniejąca ścieżka kończy się w przerwie lasu x 8-10: tu wejście na Dom dziadka (bez zmian kafli)"),
            ("m024_wschod_do_pola", "Posiadłość Lorda (24): wschód - 3 kratki pasa lasu na krawędzi i nowa kręta ścieżka z dziedzińca (omija żywopłot i kwiaty)"),
            ("m024_poludnie_do_sadow", "Posiadłość Lorda (24): południe - 3 kratki pasa lasu na dolnej krawędzi (wyjście do Sadów, x 39-41)"),
            ("m023_poludnie_do_laki2", "Skraj lasu (23): południe - nowa kręta ścieżka od istniejącej drogi do wyjścia na Łąkę#2 (x 39-41)"),
            ("m004_wschod_bez_zmian", "Łąka#1 (4): wschód - bez zmian (otwarta krawędź x 79, y 36-38, przejście do Pól pod grzbietem w Swiat_Data)")]
    f = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 18); W = 600
    tiles = []
    for n, t in rows:
        a = Image.open(os.path.join(OUT, n + "_przed.png")).convert("RGB"); b = Image.open(os.path.join(OUT, n + "_po.png")).convert("RGB")
        h = int(a.height * W / a.width); tiles.append((t, a.resize((W, h), Image.LANCZOS), b.resize((W, h), Image.LANCZOS)))
    H = sum(34 + t[1].height + 8 for t in tiles) + 40
    out = Image.new("RGB", (W * 2 + 30, H), (24, 24, 28)); d = ImageDraw.Draw(out)
    y = 6; d.text((10, y), "PRZED", fill=(255, 200, 120), font=f); d.text((W + 30, y), "PO (staging, etap 2)", fill=(140, 230, 150), font=f); y += 30
    for t, a, b in tiles:
        d.text((10, y), t, fill=(235, 235, 235), font=f); y += 26
        out.paste(a, (0, y)); out.paste(b, (W + 30, y)); y += a.height + 10
    out.save(os.path.join(OUT, "zestawienie_mapy_gracza.png")); print(out.size)
