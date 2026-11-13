# -*- coding: utf-8 -*-
"""The eight buildings on the test map Map027 (tileset 17).  Each building: a picture event (priority 'same as characters', <Occupy>
over its walls), a door event (the _Drzwi picture, the opening route, a placeholder 'Tu jeszcze nie ma wnetrza.' popup until it is
linked), a label event.  Row A base y=44 from x=61 (one cell clear of the bell tower at x57-59), row B base y=54.  The ground (round
cobble, A2 kind 19) is left as it is; old 'Budynek:/Drzwi budynku:/Etykieta:' events are replaced, every event keeps index == id.
  python tools/budynki/ustaw.py              -> tools/budynki/staging/data/Map027.json (copy)
  python tools/budynki/ustaw.py --wykonaj    -> data/Map027.json (editor closed, backup in ../Tawerna_archiwum_2026-11-08/)"""
import json, os, sys, shutil, datetime
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'rozszerzenia'))
import wspolne as WS
DO = '--wykonaj' in sys.argv
if DO: WS.need_editor_closed()
spis = json.load(open(os.path.join(HERE, 'spis.json'), encoding='utf-8'))
m = json.load(open(os.path.join(ROOT, 'data', 'Map027.json'), encoding='utf-8'))
W, H = m['width'], m['height']; n = W * H
ROWS = [(44, ['Kamienica', 'Kuznia', 'Spichlerz', 'Rybak']), (54, ['Karczma', 'Wieza', 'Ciesla', 'Mieszczanin'])]
X0, GAP = 61, 3
def page(img=None, trigger=0, prio=1, lst=None, fix=True, through=False, pattern=1):
    return {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1,
            "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
            "directionFix": fix, "image": {"tileId": 0, "characterName": img or "", "direction": 2, "pattern": pattern if img else 0, "characterIndex": 0},
            "list": (lst or []) + [{"code": 0, "indent": 0, "parameters": []}], "moveFrequency": 3,
            "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False}, "moveSpeed": 3,
            "moveType": 0, "priorityType": prio, "stepAnime": False, "through": through, "trigger": trigger, "walkAnime": False}
def route(codes): return {"list": [{"code": c, "indent": None, **({"parameters": [3]} if c == 15 else {})} for c in codes] + [{"code": 0}], "repeat": False, "skippable": False, "wait": True}
def route_cmds(codes):
    r = route(codes); out = [{"code": 205, "indent": 0, "parameters": [0, r]}]
    out += [{"code": 505, "indent": 0, "parameters": [c]} for c in r["list"][:-1]]; return out
def msg(text): return [{"code": 101, "indent": 0, "parameters": ["", 0, 0, 2]}, {"code": 401, "indent": 0, "parameters": [text]}]
removed = {e['id'] for e in m['events'] if e and (e['name'].startswith('Budynek:') or e['name'].startswith('Drzwi budynku:') or e['name'].startswith('Etykieta:'))}
for i in removed: m['events'][i] = None
while m['events'] and m['events'][-1] is None and len(m['events']) > 1: m['events'].pop()
nid = max(e['id'] for e in m['events'] if e) + 1
assert len(m['events']) == nid
for by, names in ROWS:
    x = X0
    for nm in names:
        s = spis[nm]; wt, ht = s['tiles']; left = x; cx = left + s['center_col']; dx = left + s['door_col']; o = s['occupy']
        ev = {"id": nid, "name": "Budynek: " + s['label'], "note": "<Occupy:left=%d,right=%d,up=%d>" % (o['left'], o['right'], o['up']),
              "x": cx, "y": by, "pages": [page('!$Bud_' + nm, 0, 1)]}; m['events'].append(ev); nid += 1
        door_cmds = [{"code": 250, "indent": 0, "parameters": [{"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}]}]
        door_cmds += route_cmds([36, 17, 15, 18, 15, 19, 15])
        door_cmds += [{"code": 355, "indent": 0, "parameters": ["const t = $gameTemp, k = this.eventId(); t._budDoorPop = t._budDoorPop || {}; if (!(t._budDoorPop[k] > Graphics.frameCount - 60)) { t._budDoorPop[k] = Graphics.frameCount; Tawerna.popup(\"Tu jeszcze nie ma wnętrza.\", { color: \"info\" }); }"]}]
        door_cmds += [{"code": 230, "indent": 0, "parameters": [20]}] + route_cmds([18, 15, 17, 15, 16])
        ev = {"id": nid, "name": "Drzwi budynku: " + s['label'], "note": "<DrzwiBudynku:%s>" % nm, "x": dx, "y": by,
              "pages": [page('!$Bud_%s_Drzwi' % nm, 1, 1, door_cmds)]}; m['events'].append(ev); nid += 1
        lab = msg("%s - %dx%d kratek, drzwi w kolumnie %d od lewej, <Occupy:left=%d,right=%d,up=%d>." % (s['label'], wt, ht, s['door_col'] + 1, o['left'], o['right'], o['up']))
        ev = {"id": nid, "name": "Etykieta: " + s['label'], "note": "", "x": cx, "y": by + 1, "pages": [page(None, 0, 0, lab, through=True)]}; m['events'].append(ev); nid += 1
        x += wt + GAP
    print('row base', by, 'ends at x', x - GAP)
assert all(e is None or e['id'] == i for i, e in enumerate(m['events'])), 'event index != id'
text = WS.map_text(m).encode('utf-8')
if not DO:
    os.makedirs(os.path.join(HERE, 'staging', 'data'), exist_ok=True)
    open(os.path.join(HERE, 'staging', 'data', 'Map027.json'), 'wb').write(text)
    print('events', len(m['events']), 'staged (copy only; --wykonaj installs)'); raise SystemExit(0)
WS.take_lock('budynki Map027')
try:
    P = os.path.join(ROOT, 'data', 'Map027.json')
    bak = os.path.join(os.path.dirname(ROOT), 'Tawerna_archiwum_2026-11-08', 'budynki_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S'))
    os.makedirs(bak, exist_ok=True); shutil.copy2(P, bak)
    open(P, 'wb').write(text)
    print('installed data/Map027.json, events', len(m['events']), '(backup: %s)' % bak)
finally:
    WS.drop_lock()
