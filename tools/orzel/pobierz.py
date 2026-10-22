# python tools/orzel/pobierz.py <nazwa> <id postaci PixelLab>
#   -> tools/orzel/raw2/<nazwa>/  obroty (south.png ... south-west.png) i animacje (<animacja>/<kierunek>/<n>.png) z paczki ZIP postaci
# Biały orzeł, etap 2: pobiera to, co PixelLab już wygenerował (nic nie generuje).
import io, os, sys, zipfile, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    name, cid = sys.argv[1], sys.argv[2]
    out = os.path.join(HERE, "raw2", name)
    os.makedirs(out, exist_ok=True)
    url = "https://api.pixellab.ai/mcp/characters/%s/download" % cid
    with urllib.request.urlopen(url) as r:
        data = r.read()
    z = zipfile.ZipFile(io.BytesIO(data))
    n = 0
    for info in z.infolist():
        if info.is_dir() or not info.filename.lower().endswith(".png"):
            continue
        rel = info.filename.replace("\\", "/")
        if ".." in rel.split("/"):
            continue
        parts = rel.split("/")
        # rotations/south.png -> south.png; animations/<anim>/<dir>/frame_000.png -> <anim>/<dir>/000.png
        if parts[0] == "rotations":
            dst = os.path.join(out, parts[-1])
        elif parts[0] == "animations" and len(parts) >= 4:
            dst = os.path.join(out, parts[1], parts[2], parts[-1].replace("frame_", ""))
        else:
            dst = os.path.join(out, *parts)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, "wb") as f:
            f.write(z.read(info))
        n += 1
    print(name, n, "plików ->", out)


if __name__ == "__main__":
    main()
