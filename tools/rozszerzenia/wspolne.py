# Wspólne narzędzia rozszerzeń nowego terenu (docs/rozszerzenia/PLAN.md): układ plików edytora, kafle, blokada, archiwum.
# Używają ich: pakiet0.py (staging pakietu 0), kafle.py (przejście w żywopłocie, zatoczka, płycizny), instaluj.py (instalator).
import os, sys, json, hashlib, subprocess, time, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DATA = os.path.join(ROOT, "data")
ARCH = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-10-18", "dane_przed_rozszerzeniami")
STAGING = os.path.join(HERE, "staging")
LOCK = os.path.join(HERE, ".blokada")
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
import nslib as N   # (floor_shape: the editor's autotile shapes)

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass


def sha1_bytes(b): return hashlib.sha1(b).hexdigest()
def sha1(p): return sha1_bytes(open(p, "rb").read()) if os.path.exists(p) else "-"


# ------------------------------------------------------------------ the editor's layout of the JSON files
def dump(o): return json.dumps(o, ensure_ascii=False, separators=(",", ":"))
def map_text(m):
    props = {k: v for k, v in m.items() if k not in ("data", "events")}
    lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(m["data"]) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(m["events"]) - 1 else "") for i, e in enumerate(m["events"])]
    lines += ["]", "}"]
    return "\n".join(lines)
def db_text(arr): return "[\n" + ",\n".join(dump(e) for e in arr) + "\n]"


def read_json(rel):
    """(object, layout) of data/<rel>; layout: 'map' | 'db' | 'line' - the file must be exactly in one of them"""
    raw = open(os.path.join(ROOT, rel), "rb").read()
    o = json.loads(raw.decode("utf-8"))
    name = os.path.basename(rel)
    if name.startswith("Map") and name[3:6].isdigit() and map_text(o).encode("utf-8") == raw: return o, "map"
    if isinstance(o, list) and db_text(o).encode("utf-8") == raw: return o, "db"
    if dump(o).encode("utf-8") == raw: return o, "line"
    raise SystemExit("STOP: %s nie jest w układzie edytora (otwórz i zapisz w edytorze)" % rel)


def json_text(o, layout):
    return {"map": map_text, "db": db_text, "line": dump}[layout](o).encode("utf-8")


# ------------------------------------------------------------------ tiles
def kind_of(t): return (t - 2048) // 48 if t >= 2048 else None
def shapes_by_floor(k):
    if k is None: return False
    if k < 16: return k < 4 or k % 2 == 0
    return 16 <= k < 48 or (k >= 80 and ((k - 80) // 8) % 2 == 0)
def reshape(m, z, cells):
    """the editor's floor-autotile shapes for these cells of layer z (off the map counts as the same kind)"""
    W, H, data = m["width"], m["height"], m["data"]
    base = z * W * H
    for (x, y) in cells:
        if not (0 <= x < W and 0 <= y < H): continue
        k = kind_of(data[base + y * W + x])
        if not shapes_by_floor(k): continue
        def same(dx, dy, x=x, y=y, k=k):
            nx, ny = x + dx, y + dy
            if nx < 0 or ny < 0 or nx >= W or ny >= H: return True
            return kind_of(data[base + ny * W + nx]) == k
        data[base + y * W + x] = 2048 + k * 48 + N.floor_shape(same)
def ring(cells, r=1):
    out = set()
    for (x, y) in cells:
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1): out.add((x + dx, y + dy))
    return out
def at(m, z, x, y): return m["data"][(z * m["height"] + y) * m["width"] + x]
def put(m, z, x, y, v): m["data"][(z * m["height"] + y) * m["width"] + x] = v


# ------------------------------------------------------------------ the editor, the lock, the archive
def editor_closed():
    try:
        out = subprocess.run(["tasklist", "/FI", "IMAGENAME eq RPGMZ.exe"], capture_output=True, text=True).stdout
    except Exception as e:
        raise SystemExit("STOP: nie da się sprawdzić tasklist (%s). Nic nie zmieniono." % e)
    return "RPGMZ.exe" not in out
def need_editor_closed():
    if not editor_closed(): raise SystemExit("STOP: edytor RPG Maker MZ (RPGMZ.exe) jest otwarty - zamknij go. Nic nie zmieniono.")
def take_lock(who, wait=120):
    t0 = time.time()
    while True:
        try:
            fd = os.open(LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, ("%s %s\n" % (who, datetime.datetime.now().isoformat(timespec="seconds"))).encode("utf-8"))
            os.close(fd)
            return
        except FileExistsError:
            if time.time() - t0 > wait:
                raise SystemExit("STOP: blokada %s trzymana przez: %s" % (LOCK, open(LOCK, encoding="utf-8").read().strip()))
            time.sleep(1)
def drop_lock():
    try: os.remove(LOCK)
    except FileNotFoundError: pass
def archive(rel, who):
    """a copy of the file as it is now, into the archive (the first copy keeps its name, the next ones get the time)"""
    cur = os.path.join(ROOT, *rel.split("/"))
    if not os.path.exists(cur): return None
    bak = os.path.join(ARCH, who, *rel.split("/"))
    os.makedirs(os.path.dirname(bak), exist_ok=True)
    if os.path.exists(bak):
        stem, ext = os.path.splitext(bak)
        bak = stem + datetime.datetime.now().strftime("_%Y%m%d_%H%M%S") + ext
    with open(cur, "rb") as a, open(bak, "wb") as b: b.write(a.read())
    return bak
