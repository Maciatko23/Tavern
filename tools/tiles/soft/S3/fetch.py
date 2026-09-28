"""Download PixelLab results into the scratch gen/ folder and make x4 preview sheets.
  python fetch.py tiles <tile_id> <name>        (create_tiles_pro: tile_0..tile_N)
  python fetch.py image <job_id> <name>         (create_image_pro_flash etc.)"""
import os, sys, urllib.request
from PIL import Image
GEN = os.path.join(os.environ.get("S3_SCRATCH", "."), "gen")
os.makedirs(GEN, exist_ok=True)

def get(url, path):
    if not os.path.exists(path):
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        open(path, "wb").write(urllib.request.urlopen(req).read())
    return Image.open(path).convert("RGBA")

kind, jid, name = sys.argv[1:4]
if kind == "tiles":
    d = os.path.join(GEN, name); os.makedirs(d, exist_ok=True)
    tiles = []
    for i in range(64):
        try:
            tiles.append(get("https://backblaze.pixellab.ai/file/pixellab-tiles/028dbfa8-5f36-44f0-b776-f333514951f1/%s/tile_%d.png" % (jid, i), os.path.join(d, "tile_%d.png" % i)))
        except Exception as e:
            break
    S = tiles[0].size[0]; Z = 4; G = 4; C = 4
    R = (len(tiles) + C - 1) // C
    out = Image.new("RGBA", (C * (S * Z + G), R * (S * Z + G)), (255, 0, 255, 255))
    for i, t in enumerate(tiles):
        out.paste(t.resize((S * Z, S * Z), Image.NEAREST), ((i % C) * (S * Z + G), (i // C) * (S * Z + G)))
    out.save(os.path.join(GEN, name + "_x4.png"))
    print(name, len(tiles), "tiles", tiles[0].size)
else:
    im = get("https://api.pixellab.ai/mcp/images/%s/download" % jid, os.path.join(GEN, name + ".png"))
    im.resize((im.width * 4, im.height * 4), Image.NEAREST).save(os.path.join(GEN, name + "_x4.png"))
    print(name, im.size, len(set(im.getdata())), "colours")
