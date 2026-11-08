# -*- coding: utf-8 -*-
"""Refaktor 2026-11-07, krok 4 (gracz: „Kronika” i długa pierwsza wizyta - „Usuń”): z CleanHUD.js znika stara nazwa mapy u góry na
środku (Sprite_CleanChronicle, KR, ornament z rombem, miejsce między rogami), długa pierwsza wizyta (pasy, zdanie, $gameTemp._hudCinema),
przełączniki NAME_STYLE / KN_FIRST_LONG i krój EB Garamond (tylko do zdania). Obecna mała nazwa (Sprite_CleanCinema) staje się
samodzielna: te same rozmiary, miejsca i klucze gotowych obrazków. SurvivalHUD chowa HUD już tylko na pasy sceny ($gameTemp._hudScene).
Testy: bez „Kroniki” na próbę (clean_hud_test), mood_test czeka na koniec sceny, nie pasów nazwy.
Kopie do tools/porzadki/staging (js/plugins/CleanHUD.js, SurvivalHUD.js; tests/clean_hud_test.js, mood_test.js).
  python tools/porzadki/kronika.py"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass


def load(rel):
    raw = open(os.path.join(ROOT, rel), "rb").read()
    return raw.decode("utf-8"), b"\r\n" in raw


def save(rel, s, crlf):
    p = os.path.join(STG, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "wb").write((s.replace("\r\n", "\n").replace("\n", "\r\n") if crlf else s).encode("utf-8"))


def rep(s, a, b, name):
    if s.count(a) != 1:
        raise SystemExit("nie pasuje (" + str(s.count(a)) + "x) w " + name + ": " + a[:100])
    return s.replace(a, b)


def cut(s, start, end, name, keep_end=True, insert=""):
    """removes from `start` (included) to `end` (kept when keep_end), putting `insert` there"""
    i = s.find(start)
    j = s.find(end, i + 1)
    if i < 0 or j < 0 or s.count(start) != 1:
        raise SystemExit("nie ma odcinka w " + name + ": " + start[:80] + " ... " + end[:60])
    return s[:i] + insert + (s[j:] if keep_end else s[j + len(end):])


# ---------------------------------------------------------------- CleanHUD.js
N = "CleanHUD.js"
s, crlf = load("js/plugins/CleanHUD.js")
s = s.replace("\r\n", "\n")
# the header and the help
s = rep(s, """//   top centre    the map's name as one comes in ("Kronika", 2026-10-23: the golden name, a line from a diamond, the place's words,
//                 the first time one sentence about it - js/teksty/miejsca.txt), the notices, the banners""",
"""//   top centre    the notices, the banners
//   bottom left   the map's name as one comes in ("Kinowy": the place's words, the name and a gold line as one ready picture -
//                 js/teksty/miejsca.txt, img/nazwy_map), shown whole and faded out""", N)
s = rep(s, """ *  - Góra, środek: nazwa miejsca po wejściu w stylu „Kronika” (złoty napis,
 *    ornament z rombem, podpis; przy pierwszej wizycie jedno zdanie
 *    o miejscu - teksty w js/teksty/miejsca.txt; we wnętrzach mniejsza,
 *    w podziemiach „Piętro N” i nazwa pasma) i komunikaty (doświadczenie,
 *    cele, „Poziom N!”, powitanie dnia).""",
""" *  - Lewy dolny róg: nazwa miejsca po wejściu (podpis, nazwa i złota kreska
 *    jako jeden gotowy obrazek z img/nazwy_map - teksty w js/teksty/miejsca.txt;
 *    we wnętrzach mniejsza, w podziemiach „Piętro N” i nazwa pasma).
 *  - Góra, środek: komunikaty (doświadczenie, cele, „Poziom N!”, powitanie dnia).""", N)
s = rep(s, """The map's name ("Kronika", below): Alegreya
    // SC Bold for the name, EB Garamond for its sentence (OFL, fonts/ - the game's FontManager loads neither under a name of its own:
    // TawernaUI's "QB Caps" is the same file, the title screen and the prologue load the Garamond under theirs)""",
"""The map's name (below): Alegreya
    // SC Bold (OFL, fonts/ - the game's FontManager does not load it under a name of its own: TawernaUI's "QB Caps" is the same file)""", N)
s = rep(s, """caps: ["TwAlegreyaSCBold", "AlegreyaSC-Bold.ttf"], serif: ["TwHudGaramond", "EBGaramond-Variable.ttf", { weight: "400 800" }] };""",
"""caps: ["TwAlegreyaSCBold", "AlegreyaSC-Bold.ttf"] };""", N)
# the place's name section's own description (its states, timings, look) - what it is now
i = s.find("    // ---- the top centre, first: the map's name as one comes in - \"Kronika\"")
j = s.find("    const TXM = ")
if i < 0 or j < 0: raise SystemExit("nie ma opisu nazwy miejsca")
s = s[:i] + """    // ---- the map's name as one comes in (the look: "Kinowy", further down). Which show: a room (<NazwaMapy:wnetrze>, else Atmosphere's
    // profile "interior" / "tavern") its own, smaller one; any other place the same small one on every visit; the underground: a
    // generated floor is "Piętro N" with its band's name as the words, a hand-made one its hall's name with "piętro N · band", every
    // 10th floor (the guardians) red. Night outdoors: a warmer gold with a faint glow. It goes at once when he leaves the map and fades
    // out early when a message comes or the map's name is turned off (as the old window closed then).
    // The words: js/teksty/miejsca.txt (mapa.<id>.pod); a map without them: its name and the line.
    // The visits: Tawerna.state("nazwaMapy") - { odw: { mapId: visits }, pasma: { band: true }, gotowe }; an older save counts as
    // visited what the game already remembers (Combat's discoveries "odkrycie", Underground's floors, the raven's places, the map
    // he stands on).
""" + s[j:]
s = cut(s, "    const KR = {", "    const rgbOf = c => ", N)
s = rep(s, "    // what the chronicle shows on this map now", "    // what the map's name shows on this map now", N)
s = rep(s, "    // a map entered: the visit counted (in either look), the chronicle started (the clean look draws it)",
        "    // a map entered: the visit counted (in either look), the map's name started (the clean look draws it)", N)
s = rep(s, """        const top = scene && scene._cleanTop, chron = NAME_STYLE === "kinowy" ? scene && scene._cleanCinema : top && top._items ? top._items.name : null;
        if (chron && chron.start) chron.start(info);""",
"""        const name = scene && scene._cleanCinema;
        if (name && name.start) name.start(info);""", N)
s = cut(s, "    // the room between the corners' HUD at the top (the left column's right edge", "    // one letter of the name: the glow (night)", N)
# the chronicle's own pictures (the words, the sentence, the half lines, the diamond) and the chronicle itself
s = cut(s, "    function kronikaCaps(text, size, sp, colour, maxW) {", "    // ---- the map's name, \"Kinowy\"", N)
s = rep(s, "    // the place's words: spaced capitals in the main face, centred in one picture, smaller when wider than maxW\n    // (capsFit measures - the picture's size -, capsDraw draws it into a picture at ox, oy)",
        "    // the place's words: spaced capitals in the main face, smaller when wider than maxW (capsFit measures - the picture's size -,\n    // capsDraw draws it into a picture at ox, oy)", N)
# the Kinowy section: the clean one
new = open(os.path.join(HERE, "kinowy_czysty.js"), "rb").read().decode("utf-8").replace("\r\n", "\n")
s = cut(s, "    // ---- the map's name, \"Kinowy\"", "    // ---- the top centre: the map's name as one comes in, the dog's stockpile strip", N, insert=new)
s = rep(s, """    // ---- the top centre: the map's name as one comes in, the dog's stockpile strip, the level banner, the day's greeting, the
    // notices""", """    // ---- the top centre: the dog's stockpile strip, the level banner, the day's greeting, the
    // notices""", N)
s = rep(s, """        for (const k of ["name", "dog", "level", "day", "notice"]) {
            // (the map's name: the chronicle - its own sprites and timeline, see below; the rest: one picture each)
            const s = k === "name" ? new Sprite_CleanChronicle() : new Sprite();
            if (k !== "name") s.anchor.set(0.5, 0);""",
"""        for (const k of ["dog", "level", "day", "notice"]) {
            const s = new Sprite();   // (one picture each)
            s.anchor.set(0.5, 0);""", N)
s = rep(s, "        const I = this._items;   // (the map's name runs itself: Sprite_CleanChronicle.update, as a child of this)\n",
        "        const I = this._items;\n", N)
s = rep(s, """        for (const k of ["name", "dog", "level", "day", "notice"]) if (I[k].visible && (I[k].bitmap || I[k]._h)) place(I[k], I[k]._h || I[k].bitmap.height);""",
"""        for (const k of ["dog", "level", "day", "notice"]) if (I[k].visible && I[k].bitmap) place(I[k], I[k].bitmap.height);""", N)
s = rep(s, "        this._cleanTop._cinemaKeep = true;   // (its notices stay while the name's bars hide the rest)",
        "        this._cleanTop._cinemaKeep = true;   // (its notices stay while a scene's bars hide the rest)", N)
s = rep(s, "        this._cleanCinema = new Sprite_CleanCinema();   // (the map's name, \"Kinowy\": over all of it, not in the fade under the hero)\n        this._cleanBars = new Sprite_CleanBars();   // (a scene's black bars - CleanHUD.sceneBars)\n        if (window.$gameTemp) $gameTemp._hudCinema = false;\n        // (the top stack over the name's bars: its notices are on the bar, not under it - 2026-10-24, clean_hud_test's shot)",
        "        this._cleanCinema = new Sprite_CleanCinema();   // (the map's name, \"Kinowy\": over all of it, not in the fade under the hero)\n        this._cleanBars = new Sprite_CleanBars();   // (a scene's black bars - CleanHUD.sceneBars)\n        // (the top stack over a scene's bars: its notices are on the bar, not under it)", N)
s = rep(s, """    // the map's name window opens as one comes in: in the clean look it is not drawn, the chronicle at the top centre starts then
    // (Window_MapName.open, above) and runs on its own timeline (SurvivalHUD hides the window in the fade list: fine, it is not drawn)""",
"""    // the map's name window opens as one comes in: in the clean look it is not drawn, the name in the bottom left corner starts then
    // (Window_MapName.open, above) and runs on its own (SurvivalHUD hides the window in the fade list: fine, it is not drawn)""", N)
s = re.sub(r"        const nameSprite = NAME_STYLE === \"kinowy\" \? scene\._cleanCinema : top && top\._items\.name;\n",
           "        const nameSprite = scene._cleanCinema;\n", s)
s = rep(s, "(the map's name now: Sprite_CleanCinema / Sprite_CleanChronicle .info)", "(the map's name now: Sprite_CleanCinema.info)", N)
s = rep(s, "visits: () => visits(), saysFloor, KR, nameArt, sceneBars,", "visits: () => visits(), saysFloor, nameArt, sceneBars,", N)
for gone in ["Sprite_CleanChronicle", "chronicleRoom", "NAME_STYLE", "KN_FIRST_LONG", "_hudCinema", "kronikaHalf", "kronikaDiamond", "kronikaCaps",
             "kronikaLine", "lineFit", "lineDraw", "easeOut", "easeBack", "KR."]:
    if gone in s: raise SystemExit("zostało w CleanHUD: " + gone)
save("js/plugins/CleanHUD.js", s, crlf)

# ---------------------------------------------------------------- SurvivalHUD.js
s, crlf = load("js/plugins/SurvivalHUD.js")
s = s.replace("\r\n", "\n")
s = rep(s, """            // (2026-10-23) the map's name, "Kinowy" (CleanHUD): while its bars are in, the HUD goes (all but what keeps itself); the same
            // while a scene's black bars are in (2026-11-07, CleanHUD.sceneBars: grandpa's first talk)
            if (window.$gameTemp && ($gameTemp._hudCinema || $gameTemp._hudScene) && !el._cinemaKeep) target = 0;""",
"""            // while a scene's black bars are in (CleanHUD.sceneBars - grandpa's first talk), the HUD goes (all but what keeps itself)
            if (window.$gameTemp && $gameTemp._hudScene && !el._cinemaKeep) target = 0;""", "SurvivalHUD.js")
save("js/plugins/SurvivalHUD.js", s, crlf)

# ---------------------------------------------------------------- the tests
s, crlf = load("tests/mood_test.js")
s = s.replace("\r\n", "\n")
s = rep(s, "!(window.CleanHUD && CleanHUD.debug() && CleanHUD.debug().name) && !$gameTemp._hudCinema",
        "!(window.CleanHUD && CleanHUD.debug() && CleanHUD.debug().name) && !$gameTemp._hudScene", "mood_test.js")
save("tests/mood_test.js", s, crlf)

s, crlf = load("tests/clean_hud_test.js")
s = s.replace("\r\n", "\n")
s = s.replace("cinema: !!$gameTemp._hudCinema", "cinema: !!$gameTemp._hudScene")
s = s.replace("$gameTemp._hudCinema", "$gameTemp._hudScene")
s = cut(s, "    // the old look \"Kronika\" (NAME_STYLE = \"kronika\"", "!(await dbg()).top.some(x => x.k === \"name\"), end);\n", "clean_hud_test.js", keep_end=False)
s = cut(s, "    // (the old chronicle's box: between the left column and the clock / the compass)\n", "    let lastDbg = null;", "clean_hud_test.js")
s = rep(s, "// old \"Kronika\" (Sprite_CleanChronicle, still in the top stack) driven by hand once (docs/ui_nazwa_mapy);", "// (docs/ui_nazwa_mapy);", "clean_hud_test.js")
s = rep(s, "a transfer while it shows clears it at once; the old \"Kronika\" by hand; an older save", "a transfer while it shows clears it at once; an older save", "clean_hud_test.js")
s = rep(s, "    // the chronicle of map `id` up, at its frame `at` at least", "    // the name of map `id` up, at its frame `at` at least", "clean_hud_test.js")
if "Chronicle" in s or "boxOk" in s: raise SystemExit("zostało w clean_hud_test")
save("tests/clean_hud_test.js", s, crlf)
print("kopie w", STG)
