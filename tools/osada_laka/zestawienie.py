# -*- coding: utf-8 -*-
"""docs/osada_laka/zestawienie.png (all in-game screens + the offline before / after) and the two before/after pairs. Run after the tests made the shots."""
import os
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
D = os.path.join(ROOT, "docs", "osada_laka")
def font(sz):
    for p in ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"):
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
def im(n): return Image.open(os.path.join(D, n)).convert("RGB")
def pair(a, b, ta, tb, out, h=700):
    A, B = im(a), im(b)
    A = A.resize((int(A.width * h / A.height), h), Image.LANCZOS); B = B.resize((int(B.width * h / B.height), h), Image.LANCZOS)
    f = font(26); W = A.width + B.width + 30; c = Image.new("RGB", (W, h + 50), (24, 24, 28)); d = ImageDraw.Draw(c)
    c.paste(A, (0, 50)); c.paste(B, (A.width + 30, 50)); d.text((10, 8), ta, fill=(255, 224, 130), font=f); d.text((A.width + 40, 8), tb, fill=(255, 224, 130), font=f)
    c.save(os.path.join(D, out)); print(out)
pair("m20_przed.png", "m20_po.png", "Dom dziadka, poludniowa laka - przed", "po: Osada Milczacych (palisada i ludzie z Osada.js)", "laka_przed_po.png", h=900)
pair("g13_before.png", "brama13_po_render.png", "Map013 (6,27) - przed: brama", "po: otwarte przejscie", "brama13_przed_po_render.png", h=700)
pair("gra_brama13_przed.png", "gra_brama13_po.png", "w grze - przed", "w grze - po", "brama13_przed_po_gra.png", h=560)

SHOTS = [("gra_nw.png", "chata 1, pn.-zach."), ("gra_ne.png", "chata 2, pn.-wsch."), ("gra_sw.png", "chata 4 i brama od srodka"), ("gra_se.png", "chata 3, pd.-wsch."),
         ("gra_wschod.png", "wschodni bok, chata 3"), ("gra_brama.png", "brama od zewnatrz"), ("gra_pn.png", "polnoc: laka za palisada"), ("gra_gaj.png", "gaj Milczacych (Zakon)"),
         ("gra_noc.png", "brama noca"), ("gra_laka_przed.png", "laka PRZED (ta sama okolica)"), ("gra_brama13_przed.png", "Map013 PRZED"), ("gra_brama13_po.png", "Map013 PO")]
tw, th = 640, 360; cols = 3; rows = (len(SHOTS) + cols - 1) // cols; f = font(20)
c = Image.new("RGB", (cols * tw + (cols + 1) * 10, rows * (th + 34) + 10 + 700 * 0), (24, 24, 28)); d = ImageDraw.Draw(c)
for i, (n, cap) in enumerate(SHOTS):
    x = 10 + (i % cols) * (tw + 10); y = 10 + (i // cols) * (th + 34)
    c.paste(im(n).resize((tw, th), Image.LANCZOS), (x, y + 28)); d.text((x, y + 2), cap, fill=(255, 224, 130), font=f)
c.save(os.path.join(D, "zestawienie_gra.png")); print("zestawienie_gra.png")
# the one contact sheet: before / after of the meadow on top, then the game screens
top = im("laka_przed_po.png"); tw2 = c.width; top = top.resize((tw2, int(top.height * tw2 / top.width)), Image.LANCZOS)
z = Image.new("RGB", (tw2, top.height + c.height), (24, 24, 28)); z.paste(top, (0, 0)); z.paste(c, (0, top.height)); z.save(os.path.join(D, "zestawienie.png")); print("zestawienie.png", z.size)
