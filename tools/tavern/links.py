# tools/tavern/links.json: the facts the ground floor (build_parter.py) and the upper floors (build_upper.py) share -
# the stairs' cells on both sides, the lighting conventions, the gameplay hook events. Each generator owns its keys and
# only merges them in (read - update - write), never rewrites the other's.
#   python links.py lighting      - writes the "lighting" key (the ground floor's map note and light tags)
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(HERE, "links.json")

def read():
    if not os.path.exists(PATH): return {}
    with open(PATH, "rb") as f:
        return json.loads(f.read().decode("utf-8") or "{}")

def merge(**keys):
    data = read()
    data.update(keys)
    tmp = PATH + ".tmp"
    with open(tmp, "wb") as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=1).encode("utf-8"))
    os.replace(tmp, PATH)
    return data

# the ground floor's lighting (RoomLighting.js v1.1.0): the map note and the light tag of every kind of lamp
MAP_NOTE = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<DarkDay:30>\n<DarkNight:185>\n<Zoom:1.5>"
LIGHTS = {
    "candle":      "<Light:110,120,80,30><LightWhen:night>",
    "candles3":    "<Light:150,130,90,34><LightWhen:night>",
    "candelabra":  "<Light:150,130,90,34><LightWhen:night>",
    "sconce":      "<Light:170,90,60,22><LightWhen:night>",
    "lantern":     "<Light:210,90,62,24><LightWhen:night>",
    "lantern_small": "<Light:150,90,62,24><LightWhen:night>",   # (a wall with a room behind it close by: the light stays this side)
    "chandelier":  "<Light:330,40,28,10><LightWhen:night>",
    "fill":        "<Light:300,14,10,4><LightWhen:night><LightSoft>",
    "fireplace":   "<Light:330,120,60,16>",
    "stove":       "<Light:230,120,64,20>",
    "oven":        "<Light:130,120,50,14>",
    "window_day":  "<LightCone:length=150,angle=30,dir=90,width=24,anchor=top,offsety=-10,blur=5,dust=8,dustsize=1,r=255,g=228,b=190,when=day>",
}
LIGHTING = {
    "map001_note": MAP_NOTE,
    "plugin": "RoomLighting.js v1.1.1: <DarkDay:N> map note = darkness by day, <DarkNight:N> = at night (default the plugin's 200); "
              "evening 16-19 (lamps come up), dawn 6-8; <LightWhen:night|day> on a light event (no tag = always); <LightSoft> = "
              "an even fall-off to the edge (big fill lights); lights off the screen are skipped; all glows are painted into one "
              "half-resolution layer; light holes are filled squares (no seam on the software renderer).",
    "tags": LIGHTS,
    "rules": [
        "the <Light> note goes on the lamp's own picture event when there is one (one event per lamp), else on an empty event",
        "candles, lanterns, sconces, candelabras, chandeliers and fill lights: <LightWhen:night>",
        "fireplaces, stoves and ovens: always (no LightWhen)",
        "windows: night panes (B 0,2 / 0,3 dark blue) on the wall; by day a LightCone with when=day from the window's top",
        "fill lights only where the evening would leave a dark hole between lamps; none in storerooms (dim on purpose)",
    ],
}

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "lighting":
        merge(lighting=LIGHTING)
        print("links.json: lighting written")
