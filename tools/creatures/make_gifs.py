# python tools/creatures/make_gifs.py <recordings folder>
# The GIFs of docs/walka/ from the recordings of tools/creatures/record.js (<folder>/rec_<scene>/f_*.png + info.json): cropped round the
# hero and the creature, real time (the pictures were taken every `every` frames), 96 colours - a few MB each.
import os, sys, json
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "docs", "walka"))
# scene, gif, every (frames between the pictures), crop centre from the hero (dx, dy), crop size (w, h)
JOBS = [("zbroja", "stwory_zbroja_cios.gif", 2, 100, -40, 440, 250), ("zbroja_fall", "stwory_zbroja_rozsypuje_sie.gif", 2, 90, -40, 400, 240),
        ("kamiennik", "stwory_kamiennik_uderzenie.gif", 3, 100, -50, 480, 300), ("pajak", "stwory_pajak_siec.gif", 2, 150, -40, 480, 240),
        ("nietoperz", "stwory_nietoperze.gif", 2, 60, -60, 460, 300), ("topielec", "stwory_topielec_chwyt.gif", 2, 90, -40, 420, 240),
        ("upior", "stwory_upior_prawda.gif", 3, 110, -70, 480, 280), ("cien", "stwory_cien_twarz.gif", 2, 120, -60, 480, 260),
        ("boss_20", "boss_przeor_krag.gif", 3, 100, -40, 520, 320), ("boss_40", "boss_matka_pajakow_nic.gif", 3, 80, -60, 520, 320),
        ("boss_60", "boss_odzwierny_odlamki.gif", 3, 90, -30, 560, 340), ("boss_80", "boss_upior_pytajacego.gif", 3, 110, -60, 520, 300),
        ("boss_90", "boss_ostatni_straznik.gif", 3, 110, -60, 520, 300),
        # (2026-10-06: the bosses' own art)
        ("boss_30", "boss_krolowa_szczurow.gif", 3, 110, -50, 540, 320), ("boss_50", "boss_topielec_glebiny.gif", 3, 110, -50, 520, 320),
        ("boss_70", "boss_zbroja_bez_herbu.gif", 3, 110, -50, 520, 300)]


def main():
    base = sys.argv[1]
    only = sys.argv[2:]   # (just these scenes)
    for scene, gif, every, dx, dy, w, h in JOBS:
        if only and scene not in only:
            continue
        folder = os.path.join(base, "rec_" + scene)
        if not os.path.isdir(folder):
            print(scene, "no recording")
            continue
        info = json.load(open(os.path.join(folder, "info.json")))
        hx, hy = info["hero"]
        cx, cy = hx + dx, hy + dy
        files = sorted(f for f in os.listdir(folder) if f.startswith("f_") and f.endswith(".png"))
        crops = [Image.open(os.path.join(folder, f)).convert("RGB").crop((cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2)) for f in files]
        # one palette for the whole GIF (from a few pictures side by side): the frames then differ only where something moved
        probe = Image.new("RGB", (w, h * 4))
        for k, im in enumerate(crops[:: max(1, len(crops) // 4)][:4]):
            probe.paste(im, (0, k * h))
        pal = probe.quantize(colors=128, method=Image.MEDIANCUT)
        frames = [im.quantize(palette=pal, dither=Image.Dither.NONE) for im in crops]
        out = os.path.join(OUT, gif)
        frames[0].save(out, save_all=True, append_images=frames[1:], duration=int(every * 16.7), loop=0, optimize=True)
        print(gif, len(frames), "frames", os.path.getsize(out) // 1024, "KB")


main()
