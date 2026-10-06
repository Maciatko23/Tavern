# The changes the mountain maps need on maps that are not theirs - each one small, found by name, re-runnable:
#   Map021 "Leśna droga" - the exit at the end of the trail going east (the user's own trail, rows 8-10 at the east edge):
#                          three touch transfers (39, 8..10) -> Map013 (1, 38..40); the small tree that stood on the trail's
#                          last cell (39, 8) moves beside it (38, 5)
#   Map149 floor 50      - "Przekop: przejście do Jaskini" in the north wall at the end of its east tunnel (37, 8): rubble
#                          (page 1) / the passage dug through (page 2, switch 15) -> Map014 below the tunnel's fallen-in end
#   MapInfos             - 13 "Góry i kamieniołom" (was "Góry"), 14 "Jaskinia" under it, 120 "Osada Milczących" under 13
#   System               - the names of switches 15 "Gory_TunelKopaczy" and 16 "Osada_Milczacych"
import json
from mtlib import blank_page
import props as PR

SW_TUNNEL, SW_OSADA = 15, 16
SWITCH_NAMES = {SW_TUNNEL: "Gory_TunelKopaczy", SW_OSADA: "Osada_Milczacych"}
ROAD_EXIT = [(39, 8, 38), (39, 9, 39), (39, 10, 40)]     # Map021 cell -> Map013 landing row (x 1)
TREE_FROM, TREE_TO = (39, 8), (38, 5)
UG_EVENT = "Przekop: przejście do Jaskini"
UG_AT = (37, 8)
CAVE_LAND = (3, 10)                                      # Map014: below its tunnel's fallen-in end, facing down
NEW_INFOS = [(13, "Góry i kamieniołom", 0), (14, "Jaskinia", 13), (120, "Osada Milczących", 13)]


def _transfer(name, to_map, x, y, d):
    p = blank_page(priority=0, trigger=1)
    p["list"] = [{"code": 201, "indent": 0, "parameters": [0, to_map, x, y, d, 0]}, {"code": 0, "indent": 0, "parameters": []}]
    return {"name": name, "note": "", "pages": [p]}


def _put(mp, x, y, ev, name):
    """our event `name` on the map: replaced where it is (found by name), else in the first free slot / appended"""
    evs = mp["events"]
    for i, e in enumerate(evs):
        if e and e["name"] == name and (e["x"], e["y"]) == (x, y):
            ev.update({"id": i, "x": x, "y": y}); evs[i] = {k: ev[k] for k in ("id", "name", "note", "pages", "x", "y")}
            return "updated %s (%d)" % (name, i)
    i = len(evs)
    ev.update({"id": i, "x": x, "y": y})
    evs.append({k: ev[k] for k in ("id", "name", "note", "pages", "x", "y")})
    return "added %s (%d at %d,%d)" % (name, i, x, y)


def patch_road(mp):
    """Map021: the exit east"""
    done = []
    for e in mp["events"]:
        if e and (e["x"], e["y"]) == TREE_FROM and e["pages"][0]["image"]["characterName"] == "!$Tree_Small":
            e["x"], e["y"] = TREE_TO
            done.append("moved the small tree %d %s -> %s" % (e["id"], TREE_FROM, TREE_TO))
    W, H = mp["width"], mp["height"]
    for (x, y, ty) in ROAD_EXIT:
        done.append(_put(mp, x, y, _transfer("Przejście -> Góry i kamieniołom", 13, 1, ty, 6), "Przejście -> Góry i kamieniołom"))
        mp["data"][5 * W * H + y * W + x] = 7          # (region 7: no bush grows on the way out)
    return done


def patch_floor50(mp):
    """Map149: the passage to the diggers' cave in the north wall of its east tunnel's end"""
    closed = PR.page(image=PR.img("!$Mt_Cave", 0, 4, 0), priority=1, trigger=0,
                     cmds=PR.popup("Boczny przekop, zasypany. Między kamieniami ciągnie zimne powietrze - z góry."))
    opened = PR.page(image=PR.img("!$Mt_Cave", 0, 2, 0), priority=1, trigger=1, cond=PR.sw(SW_TUNNEL),
                     cmds=[PR.se("Move1", 70, 70), PR.cmd(201, [0, 14, CAVE_LAND[0], CAVE_LAND[1], 2, 0])])
    ev = {"name": UG_EVENT, "note": "", "pages": [closed, opened]}
    return [_put(mp, UG_AT[0], UG_AT[1], ev, UG_EVENT)]


def patch_mapinfos(raw):
    text = raw.decode("utf-8")
    lines = text.split("\n")
    assert lines[0] == "[" and lines[-1] == "]", "MapInfos.json: unexpected layout"
    rows = [l[:-1] if l.endswith(",") else l for l in lines[1:-1]]
    infos = json.loads(text)
    ours = {mid for mid, _, _ in NEW_INFOS}
    order0 = max(o["order"] for o in infos if o and o["id"] not in ours) + 1
    for k, (mid, name, parent) in enumerate(NEW_INFOS):
        old = infos[mid] if mid < len(infos) and infos[mid] else None
        if old:          # (13, 14: the editor's entries - only the name and the parent change, the rest stays)
            o = dict(old); o["name"] = name; o["parentId"] = parent
            line = json.dumps(o, ensure_ascii=False, separators=(",", ":"))
        else:
            line = json.dumps({"id": mid, "expanded": False, "name": name, "order": order0, "parentId": parent, "scrollX": 0, "scrollY": 0},
                              ensure_ascii=False, separators=(",", ":"))
        while len(rows) < mid: rows.append("null")
        if len(rows) == mid: rows.append(line)
        else: rows[mid] = line
    out = "\n".join(["["] + [r + ("," if i < len(rows) - 1 else "") for i, r in enumerate(rows)] + ["]"])
    js = json.loads(out)
    for mid, name, parent in NEW_INFOS:
        assert js[mid]["id"] == mid and js[mid]["name"] == name and js[mid]["parentId"] == parent
    return out.encode("utf-8")


def patch_system(raw):
    s = json.loads(raw.decode("utf-8"))
    if json.dumps(s, ensure_ascii=False, separators=(",", ":")).encode("utf-8") != raw:
        raise SystemExit("System.json: the writer does not reproduce it byte for byte - not touching it")
    sw = s["switches"]
    for i, n in SWITCH_NAMES.items():
        while len(sw) <= i: sw.append("")
        if sw[i] and sw[i] != n:
            raise SystemExit("System.json: switch %d is already '%s'" % (i, sw[i]))
        sw[i] = n
    return json.dumps(s, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
