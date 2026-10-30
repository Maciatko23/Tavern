# python tools/latarnia/zszyj.py : skleja docs/latarnia/_far_a.png (wiersze 0-15) i _far_b.png (14-29) w wzgorze_z_daleka.png
import os
from PIL import Image
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs", "latarnia")
a, b = Image.open(os.path.join(D, "_far_a.png")).convert("RGB"), Image.open(os.path.join(D, "_far_b.png")).convert("RGB")
off = 14 * 48
out = Image.new("RGB", (a.width, off + b.height))
out.paste(a, (0, 0))
out.paste(b, (0, off))
out.save(os.path.join(D, "wzgorze_z_daleka.png"))
os.remove(os.path.join(D, "_far_a.png")); os.remove(os.path.join(D, "_far_b.png"))
print(out.size)
