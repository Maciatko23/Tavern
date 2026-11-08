# -*- coding: utf-8 -*-
"""Scena pierwszej rozmowy z dziadkiem (gracz 2026-11-07): zmiany w kopiach wtyczek w tools/dziadek_scena/staging/js/plugins
(CleanHUD: paski sceny i nazwa po scenie; SurvivalHUD: HUD schowany na czas sceny; Pokoje: widok tylko z oczu bohatera).
Story.js jest już zmieniony w kopii; tu tylko jego poprawki.
  python tools/dziadek_scena/zmiany.py"""
import os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
D = os.path.join(HERE, "staging", "js", "plugins")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

for f in ["CleanHUD.js", "SurvivalHUD.js", "Pokoje.js"]:
    shutil.copy(os.path.join(ROOT, "js", "plugins", f), os.path.join(D, f))


def edit(name, pairs):
    p = os.path.join(D, name)
    s = open(p, "rb").read().decode("utf-8")
    crlf = "\r\n" in s   # (the file's own line endings kept: SurvivalHUD.js is CRLF)
    for a, b in pairs:
        if crlf: a, b = a.replace("\n", "\r\n"), b.replace("\n", "\r\n")
        if s.count(a) != 1:
            raise SystemExit("nie pasuje w " + name + ": " + a[:80])
        s = s.replace(a, b)
    open(p, "wb").write(s.encode("utf-8"))


edit("SurvivalHUD.js", [(
"""            // (2026-10-23) the map's name, "Kinowy" (CleanHUD): while its bars are in, the HUD goes (all but what keeps itself)
            if (window.$gameTemp && $gameTemp._hudCinema && !el._cinemaKeep) target = 0;""",
"""            // (2026-10-23) the map's name, "Kinowy" (CleanHUD): while its bars are in, the HUD goes (all but what keeps itself); the same
            // while a scene's black bars are in (2026-11-07, CleanHUD.sceneBars: grandpa's first talk)
            if (window.$gameTemp && ($gameTemp._hudCinema || $gameTemp._hudScene) && !el._cinemaKeep) target = 0;""")])

edit("Pokoje.js", [(
"""        if ($gameMap.isEventRunning() || $gameMap.isScrolling()) {
            const keep = m.blocked.slice();""",
"""        // (a scene seen through the hero's own eyes - $gameTemp._sightHeroOnly, never saved; 2026-11-07: grandpa's first talk, the hero
        // in his bed and grandpa coming out of the dark - looks only from him)
        if (($gameMap.isEventRunning() || $gameMap.isScrolling()) && !(window.$gameTemp && $gameTemp._sightHeroOnly)) {
            const keep = m.blocked.slice();""")])

edit("CleanHUD.js", [
(
"""    const _nameOpen = Window_MapName.prototype.open;
    Window_MapName.prototype.open = function() {
        _nameOpen.call(this);
        const scene = SceneManager._scene;
        if (scene instanceof Scene_Map && scene._mapNameWindow === this) startPlaceName(scene);
    };""",
"""    const _nameOpen = Window_MapName.prototype.open;
    Window_MapName.prototype.open = function() {
        _nameOpen.call(this);
        const scene = SceneManager._scene;
        if (!(scene instanceof Scene_Map && scene._mapNameWindow === this)) return;
        if (window.$gameTemp && $gameTemp._hudScene) { nameWaits = $gameMap.mapId(); return; }   // (a scene's bars are in: after the scene)
        startPlaceName(scene);
    };
    // ---- a scene's black bars (2026-11-07, the user: grandpa's first talk - "wyłączyć HUD i dać paski kinowe"): a plugin's scene turns
    // them on and off (CleanHUD.sceneBars(on)); while on, the HUD goes (SurvivalHUD's fade reads $gameTemp._hudScene - Game_Temp, never
    // saved), the top stack's notices stay on the bar, and the map's name waits for the end of the scene. Two plain black bars of
    // SCENE_BAR px, faded in and out (alpha only); a scene that begins as the map is made has them at once.
    const SCENE_BAR = 64, SCENE_FADE = 12;
    let nameWaits = 0;
    function sceneBars(on) {
        if (!window.$gameTemp) return false;
        $gameTemp._hudScene = !!on;
        if (!on && nameWaits) {
            const scene = SceneManager._scene, was = nameWaits;
            nameWaits = 0;
            if (scene instanceof Scene_Map && $gameMap.mapId() === was) startPlaceName(scene);
        }
        return !!on;
    }
    function Sprite_CleanBars() {
        this.initialize(...arguments);
    }
    Sprite_CleanBars.prototype = Object.create(Sprite.prototype);
    Sprite_CleanBars.prototype.constructor = Sprite_CleanBars;
    Sprite_CleanBars.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        const bm = new Bitmap(4, 4);
        bm.fillAll("rgba(0,0,0,0.94)");
        this._top = new Sprite(bm);
        this._bottom = new Sprite(bm);
        for (const s of [this._top, this._bottom]) { s.scale.x = W() / 4; s.scale.y = SCENE_BAR / 4; this.addChild(s); }
        this._bottom.y = H() - SCENE_BAR;
        this.alpha = window.$gameTemp && $gameTemp._hudScene ? 1 : 0;   // (on as the map is made: there at once, the screen fades in anyway)
        this.visible = this.alpha > 0;
    };
    Sprite_CleanBars.prototype.update = function() {
        const want = window.$gameTemp && $gameTemp._hudScene ? 1 : 0;
        if (this.alpha !== want) this.alpha = want > this.alpha ? Math.min(1, this.alpha + 1 / SCENE_FADE) : Math.max(0, this.alpha - 1 / SCENE_FADE);
        this.visible = this.alpha > 0;
    };"""),
(
"""        this._cleanCinema = new Sprite_CleanCinema();   // (the map's name, "Kinowy": over all of it, not in the fade under the hero)
        if (window.$gameTemp) $gameTemp._hudCinema = false;
        // (the top stack over the name's bars: its notices are on the bar, not under it - 2026-10-24, clean_hud_test's shot)
        for (const s of [this._cleanClock, this._cleanLoad, this._cleanGoal, this._cleanNeeds, this._cleanWeapon, this._cleanGains, this._cleanSneak, this._cleanCinema, this._cleanTop]) {""",
"""        this._cleanCinema = new Sprite_CleanCinema();   // (the map's name, "Kinowy": over all of it, not in the fade under the hero)
        this._cleanBars = new Sprite_CleanBars();   // (a scene's black bars - CleanHUD.sceneBars)
        if (window.$gameTemp) $gameTemp._hudCinema = false;
        // (the top stack over the name's bars: its notices are on the bar, not under it - 2026-10-24, clean_hud_test's shot)
        for (const s of [this._cleanClock, this._cleanLoad, this._cleanGoal, this._cleanNeeds, this._cleanWeapon, this._cleanGains, this._cleanSneak, this._cleanCinema, this._cleanBars, this._cleanTop]) {"""),
(
"""        placeInfo: () => (window.$gameMap && $gameMap.mapId() ? placeInfo() : null), visits: () => visits(), saysFloor, KR, nameArt,""",
"""        placeInfo: () => (window.$gameMap && $gameMap.mapId() ? placeInfo() : null), visits: () => visits(), saysFloor, KR, nameArt, sceneBars,"""),
])

# Story (already staged): the hero's eyes only while he lies; the head higher, on the pillow (the user: "głowa gracza może być wyżej,
# na poduszce"); grandpa starts at his pot out of sight and goes back under it
edit("Story.js", [
(
"""            s.y -= Math.round(f.height * 0.36);""",
"""            s.y -= Math.round(f.height * 0.52);   // (the head on the pillow - the user 2026-11-07: "głowa może być wyżej, na poduszce")"""),
(
"""        $gamePlayer.setDirection(2);
        T.call("CleanHUD", "sceneBars", true);""",
"""        $gamePlayer.setDirection(2);
        $gameTemp._sightHeroOnly = true;   // (Pokoje.js: the line of sight from the bed only, not from grandpa's place - he comes out of the dark)
        T.call("CleanHUD", "sceneBars", true);"""),
(
"""        $gamePlayer.setDirection(6);
        T.call("CleanHUD", "sceneBars", false);""",
"""        $gamePlayer.setDirection(6);
        $gameTemp._sightHeroOnly = false;
        T.call("CleanHUD", "sceneBars", false);"""),
(
"""    const BED = { x: 1, y: 4, standX: 2, standY: 5, sides: [[2, 5, 4], [2, 6, 4], [1, 6, 8]] };   // (sides: where grandpa stands, facing)""",
"""    const BED = { x: 1, y: 4, standX: 2, standY: 5, sides: [[2, 5, 4], [2, 6, 4], [1, 6, 8]] };   // (sides: where grandpa stands, facing)
    const POT = [[9, 5, 8], [10, 6, 8], [10, 5, 8], [8, 5, 8], [9, 6, 8]];   // (under the pot on the hearth - Map019's fireplace at 9,4 - facing it)"""),
(
"""        const targets = where === "bed" ? BED.sides : [[NPCS.grandpa.at[0], NPCS.grandpa.at[1], 8]];""",
"""        const targets = where === "bed" ? BED.sides : POT;"""),
(
"""        s.intro = 1;
        lieDown();
        g.setDirection(8);   // (at his pot)""",
"""        s.intro = 1;
        lieDown();
        // (at his pot, his back to the bed: out of the hero's sight, so put there as the map is made)
        const at = POT.find(([x, y]) => $gameMap.isPassable(x, y, 2) && !$gameMap.eventsXyNt(x, y).some(e => e !== g));
        if (at) g.locate(at[0], at[1]);
        g.setDirection(8);"""),
])
print("zmiany w kopiach zrobione")
