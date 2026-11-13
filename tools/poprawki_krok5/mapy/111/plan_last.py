
# ------------------------------------------------------------------ last look: nic wysokiego na plocie/zywoplocie, za pniem, na innym drzewie
def _img(e): return e["pages"][0]["image"]["characterName"]
def _tree(e): return _img(e).startswith(("!$Pine", "!$Tree"))
ZONY = [(26, 3, 101, 29), (29, 98, 110, 116)]
def w_zonie(e): return any(a <= e["x"] <= c and b <= e["y"] <= d for (a, b, c, d) in ZONY)
def _oddal(e):
    occ = K.zajete(pomin={e["id"]}); best = None
    inne = [t for t in K.eventy() if _tree(t) and t["id"] != e["id"]]
    tall = [t for t in K.eventy() if _img(t) in ("!$Stump_Tall", "!$Trunk_Dead")]
    zak = ZK | ZT | ZS | ZST
    for r in range(2, 10):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if max(abs(dx), abs(dy)) != r or best: continue
                x, y = e["x"] + dx, e["y"] + dy
                if not any(a <= x <= c and b <= y <= d for (a, b, c, d) in ZONY) or (x, y) in occ or (x, y) in zak: continue
                if K.kind(0, x, y) not in (16, 27) or K.kind(1, x, y) not in (None, 21, 46) or K.g(2, x, y) or K.g(3, x, y): continue
                if any(math.hypot(t["x"] - x, t["y"] - y) < 2.6 for t in inne): continue
                if any(abs(t["x"] - x) <= 1 and -1 <= t["y"] - y <= 3 for t in tall): continue
                best = (x, y)
        if best: break
    if best: K.przenies(e["id"], *best)
    else: K.log.append("BRAK MIEJSCA: %d %s (%d,%d)" % (e["id"], e["name"], e["x"], e["y"]))
for e in [t for t in K.eventy() if _tree(t) and w_zonie(t)]:
    if (e["x"], e["y"]) in ZT or (e["x"], e["y"]) in ZST: _oddal(e)
for s_ in [t for t in K.eventy() if _img(t) in ("!$Stump_Tall", "!$Trunk_Dead")]:
    for e in [t for t in K.eventy() if _tree(t)]:
        if abs(e["x"] - s_["x"]) <= 1 and -1 <= e["y"] - s_["y"] <= 0: _oddal(e)
_d = [t for t in K.eventy() if _tree(t) and w_zonie(t)]
for i_, a_ in enumerate(_d):
    for b_ in _d[i_ + 1:]:
        if abs(a_["x"] - b_["x"]) <= 1 and abs(a_["y"] - b_["y"]) <= 1: _oddal(b_)
