# -*- coding: utf-8 -*-
"""Porządki w tawernie, część kodu: z żywych wtyczek robi staging/js/plugins (RoomLighting, Przytulna, TavernLife). Do gry trafiają dopiero przez instaluj.py.
  python tools/tavern/porzadki/buduj_js.py"""
import os
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
HERE = os.path.dirname(os.path.abspath(__file__))
WY = os.path.join(HERE, "staging", "js", "plugins")
os.makedirs(WY, exist_ok=True)
NOC = 0        # o ile ciemniej noc w tawernie niż w notatce mapy (Przytulna)
WYP = 1.5      # siła świateł wypełniających
GLOW = "45 + 30 * f"


def patch(nazwa, reps):
    p = os.path.join(ROOT, "js", "plugins", nazwa + ".js")
    s = open(p, "rb").read().decode("utf-8")
    crlf = "\r\n" in s
    for o, n in reps:
        if crlf: o, n = o.replace("\n", "\r\n"), n.replace("\n", "\r\n")
        assert s.count(o) == 1, (nazwa, o[:70], s.count(o))
        s = s.replace(o, n)
    open(os.path.join(WY, nazwa + ".js"), "wb").write(s.encode("utf-8"))


patch("RoomLighting", [
("""                    this._roomHoles.push({ shape: "circle", sprite: light, radius: marker.radius, soft: !!marker.soft });
""", """                    // (<LightEdges:soft> in the map's note: every light's hole fades out softly, no scalloped dark edges between lights; flicker and people's shadows as before)
                    this._roomHoles.push({ shape: "circle", sprite: light, radius: marker.radius, soft: !!marker.soft, edge: /<LightEdges:\\s*soft\\s*>/i.test(($dataMap && $dataMap.note) || "") });
"""),
("""                    punchCircleHole(c, cx - ox, cy - oy, rad, w, hole.soft);
""", """                    punchCircleHole(c, cx - ox, cy - oy, rad, w, hole.soft || hole.edge);
"""),
("""                punchCircleHole(context, hole.sprite.x, hole.sprite.y, reach, w, hole.soft);
""", """                punchCircleHole(context, hole.sprite.x, hole.sprite.y, reach, w, hole.soft || hole.edge);
"""),
("""                placeHole(holes, LightGpu.holeTexture(hole.soft ? 1 : 0, w), s.x * k, s.y * k, reach * k, w);
""", """                placeHole(holes, LightGpu.holeTexture(hole.soft || hole.edge ? 1 : 0, w), s.x * k, s.y * k, reach * k, w);
"""),
("""            placeHole(g.sg, LG.holeTexture(hole.soft ? 1 : 0, w), cx, cy, rad, w);
""", """            placeHole(g.sg, LG.holeTexture(hole.soft || hole.edge ? 1 : 0, w), cx, cy, rad, w);
"""),
])

patch("Przytulna", [
("""    const DARK_PLUS = 22;                                // o tyle ciemniejsza noc (0-255)
""", """    const DARK_PLUS = %d;                                 // o tyle ciemniejsza noc (0-255; 2026-11-05: 0, pomieszczenia bez lamp były czarne)
""" % NOC),
("""        for (const e of $dataMap.events) {
            if (!e || !inHall(e.x, e.y) || !e.note) continue;
            const name = String(e.name || "");
""", """        // (2026-11-05) płomienie: światła dodają się do obrazu, więc za mocne przepalają podłogę i wchodzą w limonkę (czerwony na maksimum, rośnie zielony): słabiej i cieplej w całej tawernie
        for (const e of $dataMap.events) {
            if (!e || !e.note || !/^(Świeca|Latarnia|Lampa|Kaganek|Pochodnia)|randol/i.test(String(e.name || ""))) continue;
            e.note = e.note.replace(/<Light:(\\d+),(\\d+),(\\d+),(\\d+)>/i, (m, r, a, b, c) => "<Light:" + r + "," + Math.round(a * 0.72) + "," + Math.round(b * 0.58) + "," + Math.round(c * 0.4) + ">");
        }
        for (const e of $dataMap.events) {
            if (!e || !inHall(e.x, e.y) || !e.note) continue;
            const name = String(e.name || "");
"""),
("""Math.round(a * 3.2) + "," + Math.round(b * 3.2) + "," + Math.round(c * 3.2)""", """Math.round(a * %s) + "," + Math.round(b * %s) + "," + Math.round(c * %s)""" % (WYP, WYP, WYP)),
("""e.note.replace(/<Light:(\\d+),(\\d+),(\\d+),(\\d+)>/i, "<Light:330,185,98,30>");""", """e.note.replace(/<Light:(\\d+),(\\d+),(\\d+),(\\d+)>/i, "<Light:330,120,58,14>");"""),
("""g.opacity = 70 + 50 * f;""", """g.opacity = %s;""" % GLOW),
("""                this.playAnim("grajek", ev, f + 1);
            } else this.stopAnim("grajek", ev);
""", """                this.playAnim("grajek", ev, f + 1);
                if (ev.isThrough()) ev.setThrough(false);
            } else {
                this.stopAnim("grajek", ev);
                if (!ev.isThrough()) ev.setThrough(true);   // (poza jego godzinami na scenie nie ma nikogo: nie ma też niewidzialnej blokady)
            }
"""),
])

patch("TavernLife", [
("""    const CORE_KINDS = new Set(["meal", "mealtable", "bath", "stage", "bed"]);
""", """    const CORE_KINDS = new Set(["meal", "mealtable", "bath", "stage", "bed"]);
    // (2026-11-05) miejsca na wolnej podłodze (mata do rzutek, miejsce słuchacza...) nie blokują już przejścia: stojąc na takim, przycisk nadal działa
    const _standOnSpot = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && !$gameMap.isEventRunning()) {
            const e = $gameMap.eventsXy(this.x, this.y).find(q => q.isThrough() && q.isNormalPriority() && q.isTriggerIn([0]) && /^Tavern:/.test(String((q.event() || {}).name || "")));
            if (e) { e.start(); if ($gameMap.setupStartingEvent()) return true; }
        }
        return _standOnSpot.call(this);
    };
"""),
])
print("ok")
