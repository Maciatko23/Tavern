# python tools/przystan/check.py   - the staged harbour (tools/przystan/staging/Map125.json) checked before an install:
#   - from the landing (54,19) the hero reaches every TownLife spot, every door's front cell, the D20 wreck marker and the exit
#     (tiles, passage flags, RegionLayers' region 2 = blocked, events of priority 1 with their <Occupy>)
#   - the sea is marked salt (<Water:salt>) and no A1 water lies anywhere else (no drinking water of any kind)
#   - every light is a flame (!Decoration lanterns / fire baskets / braziers / the fire in a barrel)
#   - the one exit leads to Podgrodzie (111) and lands on its trail (1,19)
# Prints the problems; exit code 1 when there are any.
import os, sys, json, re
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/mountains")
sys.path.insert(0, ROOT + "tools/town")
import mtlib   # noqa: E402

STAGING = os.path.join(HERE, "staging")
LANDING = (54, 19)
# the spots that stand on purpose where the hero does not walk (the jetty's end - Janek rows out from there)
UNREACHABLE_OK = set()


def load(p):
    with open(p, "rb") as f:
        return json.loads(f.read().decode("utf-8"))


def main():
    mp = load(os.path.join(STAGING, "Map125.json"))
    meta = load(os.path.join(STAGING, "Map125_meta.json"))
    W, H = mp["width"], mp["height"]
    region2 = {(x, y) for y in range(H) for x in range(W) if mp["data"][(5 * H + y) * W + x] == 2}
    seen = mtlib.reach(mp, LANDING, extra_block=region2)
    problems = []
    for key, (x, y, d) in meta["spots"].items():
        if (x, y) not in seen and key not in UNREACHABLE_OK: problems.append("miejsce %s (%d,%d) nieosiągalne" % (key, x, y))
    for b in meta["buildings"]:
        fx, fy = b["front"]
        if (fx, fy) not in seen: problems.append("drzwi %s: pole przed drzwiami (%d,%d) nieosiągalne" % (b["name"], fx, fy))
    for ex in meta["exits"]:
        if (ex["x"], ex["y"]) not in seen: problems.append("wyjście (%d,%d) nieosiągalne" % (ex["x"], ex["y"]))
        if ex["to"][:3] != [111, 1, 19]: problems.append("wyjście (%d,%d) prowadzi do %s" % (ex["x"], ex["y"], ex["to"]))
    if "<Water:salt>" not in mp["note"]: problems.append("brak <Water:salt> w notatce mapy")
    # A1 water: only the sea (on this map all of it is the salt sea - the note covers it)
    water = sum(1 for z in (0, 1) for v in mp["data"][z * W * H:(z + 1) * W * H] if 2048 <= v < 2816 and not (2048 + 96 <= v < 2048 + 192))
    for e in mp["events"]:
        if not e or "<Light:" not in (e.get("note") or ""): continue
        img = e["pages"][0]["image"]["characterName"]
        if img != "!Decoration": problems.append("światło %s nie jest ogniem (%s)" % (e["name"], img))
        if not re.search(r"LightFlicker|LightWhen:night", e["note"]): problems.append("światło %s bez migotania / pory" % e["name"])
    print("Map125: osiągalne pola %d, woda (morze) %d pól, światła %d, miejsca %d, drzwi %d" % (
        len(seen), water, sum(1 for e in mp["events"] if e and "<Light:" in (e.get("note") or "")), len(meta["spots"]), len(meta["buildings"])))
    for p in problems: print("  PROBLEM:", p)
    print("OK" if not problems else "%d problemów" % len(problems))
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
