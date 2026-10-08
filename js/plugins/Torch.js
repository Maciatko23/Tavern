/*:
 * @target MZ
 * @plugindesc Pochodnia jak narzędzie i broń: zapalona jest w ręku bohatera (żywy płomień, iskry), przy pracy wbita obok w ziemię, w trybie walki bije i podpala, zwierzęta boją się ognia; deszcz ją przygasza. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter RoomLighting
 * @orderAfter ChoppableTree
 * @orderAfter Hunting_AI
 * @orderAfter Combat_Fight
 * @orderAfter HeroLook
 *
 * @param hours
 * @text Czas palenia (godziny gry)
 * @type number
 * @decimals 1
 * @min 0.5
 * @default 3
 * @desc Ile godzin zegara gry pali się jedna pochodnia (60 s na godzinę: 3 = trzy minuty).
 *
 * @command light
 * @text Zapal pochodnię
 * @desc Zapala pochodnię (przedmiot jest już zużyty - tak woła to wspólne zdarzenie przedmiotu). Gdy już płonie albo leje: oddaje przedmiot.
 *
 * @command douse
 * @text Zgaś pochodnię
 * @desc Gasi pochodnię bez słowa (np. przed sceną).
 *
 * @help
 * ============================================================================
 * Torch.js - pochodnia w ręku i jako broń
 * ============================================================================
 * Przedmiot 59 "Pochodnia": użyty (z torby) woła wspólne zdarzenie 5, a ono
 * polecenie "Zapal pochodnię" (skrypt Torch.light()). Pochodnia pali się
 * 3 godziny zegara gry; przełącznik 2 "PochodniaZapalona" jest wtedy ON
 * (z niego czytają światło RoomLighting.js i Farming_Render.js).
 *
 * W RĘKU: bohater widocznie ją niesie - stojąc, idąc, biegnąc i skradając
 * się, w 8 kierunkach (arkusze img/characters/Hero_TorchWalk, Hero_TorchRun,
 * Hero_TorchSneak: chód bohatera z pochodnią w dłoni bliższej kamery, od
 * tyłu za ciałem). Płomień rysuje gra - żywy, w kolorach ogniska, z iskrami,
 * pochyla się przy ruchu. Gdzie jest głownia na każdej klatce: TIPS (z
 * pomiaru dłoni, tools/torch/).
 *
 * PRZY PRACY (zamach narzędziem, kucanie, łowienie, siadanie, leżenie):
 * pochodnia jest wbita w ziemię obok niego i stamtąd świeci; podnosi ją,
 * gdy odejdzie albo po chwili bez pracy. W walce cudzą bronią i przy
 * przewrocie płomienia nie widać (pochodnia w drugiej ręce), światło zostaje.
 *
 * BROŃ: w trybie walki (Tab) zapalona pochodnia jest na liście broni ([ ]),
 * między pałką a pięściami. Zamach: arkusz img/system/Hero_Torch (17 klatek).
 * Bije słabiej od pałki, ale podpala: zwierzę płonie kilka chwil (obrażenia
 * co 2/3 s), ludzie i stwory dostają dodatkowe obrażenia od ognia. Zwierzęta
 * boją się ognia: trafiony wilk odskakuje i trzyma się z dala, dzik ucieka,
 * niedźwiedź się cofa; dopóki pochodnia płonie, wataha krąży dalej i rzadziej
 * skacze. Każdy celny cios strąca żar - pochodnia wypala się szybciej.
 *
 * POGODA (pod gołym niebem): deszcz - pali się dwa razy szybciej, śnieg -
 * półtora raza; ulewa (burza) gasi ją po kilku minutach gry, a w ulewie nie
 * da się jej zapalić. Sen ją gasi. Komunikaty to dymki nad bohaterem.
 *
 * Wskaźnik czasu: RoomLighting.js (pasek pod kompasem w czystym widoku).
 * Stan w zapisie: $gameSystem._tw.torch (TawernaCore).
 * ============================================================================
 */
(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Torch.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");

    const params = PluginManager.parameters("Torch");
    const ITEM = 59, ICON = 436;   // (the torch's own icon, tools/torch/make_icon.py - 80 was the music notes)
    const SWITCH = Number((PluginManager.parameters("RoomLighting") || {}).torchSwitch || 2);
    // hours: a torch's life in game hours (the clock: 60 s an hour); hit: what one blow that lands knocks off (embers fly); rain / snow:
    // how much faster it burns under them; storm: game hours of a downpour it lives through; low: from this part left it burns small
    const TORCH = { hours: Math.max(0.5, Number(params.hours) || 3), hit: 4 / 60, rain: 2, snow: 1.5, storm: 6 / 60, low: 0.12 };
    // the fire of a blow (docs/WALKA.md, "Pochodnia"): an animal burns ticks x dmg (every `every` frames; a heavy blow heavyTicks); men and
    // creatures take `bonus` more at once (Combat_Fight.js MELEE[59].fireBonus)
    const FIRE = { dmg: 3, every: 40, ticks: 3, heavyTicks: 5 };
    // the animals' fear (frames): a wolf hit by fire backs off and keeps `keep` tiles away; a boar runs (retreat); a bear backs off a
    // moment. While the torch burns a pack circles ringPlus tiles farther and its next leap waits longer (gapSlow of each frame back)
    const FEAR = { wolf: 180, boar: 150, bear: 70, keep: 3.4, ringPlus: 0.9, gapSlow: 0.35, bearGap: 60 };
    // a torch stuck in the ground while he works: picked up when he moves `pick` tiles away or after `grace` frames without work
    const PLANT = { pick: 0.4, grace: 50 };
    // the swing kinds that are a fight's (a blow, a shot, the roll, the fall): the torch is only out of sight (the other hand); every other
    // swing - work, sitting, lying - sticks it in the ground. Filled once ChoppableTree is there (kind numbers by sheet / name).
    const FIGHT_SHEETS = ["Swing_Sling", "Swing_Bow", "Swing_Spear", "Swing_Roll", "knockdown", "Swing_Club", "Swing_Punch", "torch"];

    // ------------------------------------------------------------------
    // Where the torch's head is on every cell of the walking sheets (64x64; x, y from the cell's top left) - measured by
    // tools/torch/build_torch_walk.py (the hand on every frame, the torch's lean, steadied against the swing of the arm). Rows: S, SW, W,
    // NW, N, NE, E, SE; column 0 = standing. A third number 1: on that frame the hand is hidden behind his body, and so is the torch and
    // its flame (drawn behind him); else the torch is in his fist on our side, in front of him (the fingers round the stick).
    // ------------------------------------------------------------------
    const TIPS = {
        Hero_TorchWalk: [[[15,24],[17,26],[16,25],[16,26],[16,26],[16,25],[16,25],[16,24],[17,25]],[[47,26],[46,29],[47,27],[47,26],[46,28],[45,28],[42,29],[43,28],[44,28]],[[21,31],[20,32],[23,33],[24,33],[22,33],[19,31],[15,29],[14,28],[16,30]],[[16,26],[17,28],[19,30],[21,31],[19,30],[17,28],[14,25],[12,22],[14,26]],[[47,24],[47,22],[48,20],[48,20],[48,20,1],[47,25],[48,23],[46,27],[46,26]],[[48,26],[48,27],[49,26],[49,25],[48,27],[47,27],[45,29],[44,29],[44,30]],[[42,31],[46,31],[47,29],[48,28],[46,30],[43,32],[41,32],[39,33],[42,32]],[[17,26],[20,28],[20,28],[21,28],[20,28],[18,28],[17,26],[16,25],[17,27]]],
        Hero_TorchRun: [[[8,29],[12,26],[12,24],[12,24],[9,29],[10,20],[12,18],[12,20],[9,30]],[[54,32],[60,28],[58,20],[55,23],[54,36],[46,32],[46,29],[45,26],[57,34]],[[19,33],[42,22],[45,19],[43,21],[20,35],[7,33],[7,23],[12,30],[19,36]],[[14,27],[18,29],[19,35],[18,36],[16,28],[9,20],[10,18],[12,22],[15,28]],[[52,25],[50,19],[51,16],[50,18],[54,25],[53,24],[51,24],[52,26],[52,26]],[[50,26],[54,21],[54,20],[52,25],[50,29],[47,30],[44,30],[46,34],[49,28]],[[44,33],[50,26],[52,24],[48,26],[45,35],[21,18],[18,17],[20,19],[45,36]],[[10,32],[15,33],[16,32],[15,28],[8,34],[4,25],[7,15],[8,19],[7,33]]],
        Hero_TorchSneak: [[[16,28],[16,28],[14,23],[16,28],[18,30],[18,27],[18,30]],[[15,43],[15,43],[15,41],[16,42],[16,42],[16,43],[15,43]],[[7,36],[7,36],[7,36],[6,34],[5,34],[6,35],[5,34]],[[12,24],[12,24],[12,23],[11,22],[10,22],[10,22],[11,22]],[[47,30],[47,30],[48,28],[47,28],[45,32],[45,30],[46,30]],[[46,45],[46,45],[46,44],[46,44],[44,46],[44,45],[46,45]],[[58,32],[58,32],[56,33],[59,30],[58,32],[58,32],[58,34]],[[10,32],[10,32],[9,31],[11,35],[11,32],[10,30],[11,32]]]
    };
    // the torch blow's sheet (Hero_Torch, 96x96 cells, the feet at (48, 80); rows down, left, right, up): where its painted fire is on each
    // cell (null: behind the body) - the sparks fly from there (tools/torch/build_torch_swing.py)
    const SWING_TIPS = [[[28,30],[30,29],[35,28],null,null,[36,28],[31,29],[72,47],[73,53],[72,57],[68,60],[46,70],[26,65],[16,47],[19,40],[23,34],[28,30]],[[58,20],[58,23],[56,20],null,[61,49],[58,42],[30,49],[24,45],[24,45],[27,60],[38,66],[55,65],[64,58],[70,44],[58,23],[58,23],[58,20]],[[37,20],[37,23],[39,20],null,[34,49],[37,42],[65,49],[71,45],[71,45],[68,60],[57,66],[40,65],[31,58],[25,44],[37,23],[37,23],[37,20]],[[67,31],[68,32],[62,31],null,[35,29],[29,33],[25,39],[24,56],[29,66],null,[61,68],[74,64],[71,65],[71,65],[73,63],[73,49],[69,37]]];
    const CELL = 64, SWING_CELL = 96, SWING_FEET = { x: 48, y: 80 };
    // the old hero (Reid, F9): no torch sheets - a torch drawn beside him (feet-relative px, per 4-way facing; up: behind him)
    const OLD_HAND = { 2: [-12, -22, 0], 4: [-9, -24, 0], 6: [9, -24, 0], 8: [11, -24, 1] };

    // ------------------------------------------------------------------
    // The saved state: lit, the hours left of `max`, the clock it was looked at (`at`, day * 24 + hour), the downpour it has stood
    // (`storm`, hours), the weather already told (`wet`), why it went out last (`out`)
    // ------------------------------------------------------------------
    // planted: the torches stuck in the ground by hand [{ id, map, x, y (its tile), left, max, at, sky (under the sky), storm }]; seq: ids
    const store = T.state.define("torch", () => ({ lit: false, left: 0, max: 0, at: -1, storm: 0, wet: "", out: "", planted: [], seq: 0 }), { version: 1, owner: "Torch" });
    const clockNow = () => T.time.day() * 24 + T.time.hour();
    const se = (name, volume, pitch) => T.audio.se(name, { volume, pitch });
    const say = (text, color) => T.popup(text, { icon: ICON, color: color || "#ffc37a" });
    const switchOn = () => !!$gameSwitches && SWITCH > 0 && $gameSwitches.value(SWITCH);
    function setSwitch(on) { if (SWITCH > 0 && $gameSwitches) $gameSwitches.setValue(SWITCH, !!on); }

    // the weather where he stands: "" (none, or under a roof), "rain", "snow", "storm" (a downpour)
    function weatherHere() {
        const S = T.api("Survival");
        if (!S || !S.isOutdoors || !S.isOutdoors() || !$gameScreen) return "";
        if (!($gameScreen._weatherPowerTarget > 0)) return "";   // (not while it fades out)
        const type = $gameScreen.weatherType();
        return type === "storm" ? "storm" : type === "rain" ? "rain" : type === "snow" ? "snow" : "";
    }

    function isLit() {
        const s = store();
        if (switchOn() && !s.lit) adopt();
        return s.lit && switchOn();
    }
    // the switch turned on from elsewhere (an old save from before this plugin with the engine's timer running, an event): a torch of
    // its own from now on
    function adopt() {
        const s = store();
        let left = TORCH.hours;
        if ($gameTimer && $gameTimer.isWorking()) {   // (the old way: the engine's timer counted the torch down - its seconds become hours)
            const secPerHour = Number((PluginManager.parameters("DayNightCycle") || {}).secondsPerHour) || 60;
            left = Math.max(0.05, Math.min(TORCH.hours, $gameTimer.frames() / 60 / secPerHour));
            $gameTimer.stop();
        }
        Object.assign(s, { lit: true, left, max: TORCH.hours, at: clockNow(), storm: 0, wet: "", out: "" });
    }

    // ---- lighting it (the item's common event: the torch is already taken from the bag)
    function light() {
        const s = store();
        let planted = false;
        if (isLit()) {   // one burns in his hand: it goes into the ground (in front of him, else where he stands) and the new one is lit
            const t = frontTile(), here = { x: $gamePlayer.x, y: $gamePlayer.y };
            const spot = canPlantAt(t.x, t.y) ? t : canPlantAt(here.x, here.y) ? here : null;
            if (!spot) {
                $gameParty.gainItem($dataItems[ITEM], 1);
                say("Pochodnia już płonie");
                return false;
            }
            plantTorch(spot.x, spot.y, { instant: true, quiet: true });
            planted = true;
        }
        if (weatherHere() === "storm") {
            $gameParty.gainItem($dataItems[ITEM], 1);
            say("W taką ulewę pochodni nie zapalisz", "#bcd8ff");
            return false;
        }
        Object.assign(s, { lit: true, left: TORCH.hours, max: TORCH.hours, at: clockNow(), storm: 0, wet: weatherHere(), out: "" });
        setSwitch(true);
        if ($gameTimer && $gameTimer.isWorking()) $gameTimer.stop();   // (the old common event's timer, if the editor kept it)
        se("Fire1", 55, 130);
        say(planted ? "Wbijasz pochodnię w ziemię i zapalasz nową" : s.wet === "rain" ? "Zapalasz pochodnię - w deszczu wypali się szybciej" :
            s.wet === "snow" ? "Zapalasz pochodnię - śnieg ją przygasza" : "Zapalasz pochodnię");
        burstAt = Graphics.frameCount;
        return true;
    }
    // out: why - "burnt" (burnt down), "storm", "sleep" (told on waking), "" (quietly)
    function douse(why) {
        const s = store();
        if (!s.lit && !switchOn()) return false;
        s.lit = false;
        s.left = 0;
        s.out = why || "";
        setSwitch(false);
        plant = null;
        if (layerNow) layerNow.puff();
        if (why === "burnt") { se("Fire3", 40, 70); say("Pochodnia się wypaliła", "#ffb07f"); }
        else if (why === "storm") { se("Fire3", 50, 60); say("Ulewa zgasiła pochodnię", "#bcd8ff"); }
        return true;
    }
    const ratio = () => { const s = store(); return s.lit && s.max > 0 ? Math.max(0, Math.min(1, s.left / s.max)) : 0; };

    // one frame of the map: the clock burns it, the weather too
    function tick() {
        const s = store();
        tickPlanted();
        if (!switchOn()) {
            if (s.lit) { s.lit = false; plant = null; }   // (an event turned it off)
            updateBurning();
            return;
        }
        if (!s.lit) adopt();
        const now = clockNow();
        let dt = s.at < 0 ? 0 : now - s.at;
        s.at = now;
        if (!(dt > 0) || dt > 48) dt = 0;   // (a day turned over backwards, a test's clock set back)
        const w = weatherHere();
        if (w !== s.wet) {
            if (w === "rain" || w === "storm") say(w === "storm" ? "Ulewa! Pochodnia zaraz zgaśnie" : "Deszcz przygasza pochodnię", "#bcd8ff");
            else if (w === "snow") say("Śnieg syczy w płomieniu", "#bcd8ff");
            s.wet = w;
        }
        s.left -= dt * (w === "rain" ? TORCH.rain : w === "snow" ? TORCH.snow : w === "storm" ? TORCH.rain : 1);
        if (w === "storm") {
            s.storm += dt;
            if (s.storm >= TORCH.storm) { douse("storm"); return; }
        } else s.storm = 0;
        if (s.left <= 0) { douse("burnt"); return; }
        updatePlant();
        updateBurning();
    }

    // ---- sleep: he puts it out before he lies down (told on waking)
    T.on("sleep", () => { if (isLit()) douse("sleep"); }, { owner: "Torch" });
    T.on("wake", () => {
        const s = store();
        if (s.out === "sleep") { s.out = ""; say("Pochodnię zgasiłeś przed snem", "#ffd9a8"); }
    }, { owner: "Torch" });

    // ------------------------------------------------------------------
    // Stuck in the ground while he works
    // ------------------------------------------------------------------
    let plant = null;   // { gx, gy (tiles: the ground under it), map, px, py (where he stood), idle }
    let fightKinds = null;
    function fightKind(kind) {
        if (!fightKinds) {
            const CT = T.api("ChoppableTree");
            fightKinds = new Set(CT && CT.swingKindOf ? FIGHT_SHEETS.map(k => CT.swingKindOf(k)).filter(k => k >= 0) : []);
        }
        return fightKinds.has(kind);
    }
    function torchKind() {
        const CT = T.api("ChoppableTree");
        return CT && CT.swingKindOf ? CT.swingKindOf("torch") : -1;
    }
    function swingNow() {
        const sw = $gamePlayer._swingEvent;
        return sw && sw._swingT >= 0 && sw._swingKind !== undefined ? sw._swingKind : -1;
    }
    const inFight = () => { const C = T.api("Combat"), a = C && C.act; return !!a && (a.mode === "attack" || a.mode === "roll" || a.stun > 0); };
    // the spot beside him, out of the way of the work in front (to his side; facing left / right a little behind his back)
    const BESIDE = { 2: [-0.62, -0.08], 8: [0.62, 0.02], 4: [0.48, 0.18], 6: [-0.48, 0.18] };
    function updatePlant() {
        if (planting) { plant = null; return; }   // (crouching to stick it in the ground / to take one up: by hand, not this)
        const p = $gamePlayer, kind = swingNow();
        const working = kind >= 0 && !fightKind(kind) && !inFight();
        if (plant && (kind === torchKind() || plant.map !== $gameMap.mapId())) plant = null;   // (taken up to strike with it / another map)
        if (working && !plant) {
            const [ox, oy] = BESIDE[p.direction()] || BESIDE[2];
            plant = { gx: p._realX + 0.5 + ox, gy: p._realY + 1 - 6 / $gameMap.tileHeight() + oy, map: $gameMap.mapId(), px: p._realX, py: p._realY, idle: 0 };
        }
        if (!plant) return;
        if (working) { plant.idle = 0; plant.px = p._realX; plant.py = p._realY; return; }
        if (kind >= 0) return;   // (a roll, a blow of a fight while it stands there: it waits)
        plant.idle++;
        if (Math.hypot(p._realX - plant.px, p._realY - plant.py) > PLANT.pick || plant.idle > PLANT.grace) plant = null;
    }

    // ------------------------------------------------------------------
    // Stuck in the ground BY HAND (the user, 2026-10-08): the ground's menu (O on the free tile in front - Farming's "Nieuprawiana ziemia"
    // and the like, else a menu of its own) "Wbij pochodnię w ziemię", or a second torch used from the bag while one burns. It stays on
    // that tile (saved: map, tile, its time), lights like the one in his hand (a small fire), burns on by its own time (the rain, the
    // snow, a downpour as in his hand, under the sky) and, burnt down, goes out in a puff of smoke and is gone. O in front of it (or
    // standing on it): back into his hand with the time it has left - unless he holds a burning one already (it stays). It does not
    // block the way (a thin stick). The torch stuck in the ground while he works (above) stays as it was.
    // ------------------------------------------------------------------
    let planting = false;   // (he crouches to stick one in / to take one up)
    const plantedList = () => { const s = store(); return s.planted || (s.planted = []); };
    const plantedAt = (map, x, y) => plantedList().find(p => p.map === map && p.x === x && p.y === y) || null;
    function frontTile() {
        const p = $gamePlayer, d = p.direction();
        return { x: $gameMap.roundXWithDirection(p.x, d), y: $gameMap.roundYWithDirection(p.y, d) };
    }
    const outdoors = () => { const S = T.api("Survival"); return !!(S && S.isOutdoors && S.isOutdoors()); };
    // a free bit of ground: on the map, one can walk there, no water, no building, no other torch, no event standing there
    function canPlantAt(x, y) {
        if (!$gameMap || !$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f)) return false;
        const FP = T.api("Farming_parts");
        if (FP && FP.plots && FP.plots.isWaterTile && FP.plots.isWaterTile(x, y)) return false;
        if (T.call("Farming", "buildingAt", x, y)) return false;
        if (plantedAt($gameMap.mapId(), x, y)) return false;
        return !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority());
    }
    // a short crouch, and `fn` on its lowest point (none without the sheet: at once)
    function crouchThen(fn) {
        const CT = T.api("ChoppableTree"), kind = CT && CT.swingKindOf ? CT.swingKindOf("Swing_Crouch") : -1;
        planting = true;
        plant = null;
        if (kind >= 0 && $gamePlayer.startToolSwing(kind, fn, () => { planting = false; })) return true;
        fn();
        planting = false;
        return true;
    }
    // the torch in his hand into the ground at (x, y); opts: instant (no crouch), quiet (no word)
    function plantTorch(x, y, opts) {
        const o = opts || {};
        if (!isLit() || !canPlantAt(x, y)) return false;
        const go = () => {
            const s = store();
            if (!s.lit || !canPlantAt(x, y)) return;
            s.seq = (s.seq || 0) + 1;
            plantedList().push({ id: s.seq, map: $gameMap.mapId(), x, y, left: s.left, max: s.max || TORCH.hours, at: clockNow(), sky: outdoors(), storm: 0 });
            Object.assign(s, { lit: false, left: 0, out: "", storm: 0 });
            setSwitch(false);
            plant = null;
            se("Fire1", 40, 85);
            if (!o.quiet) say("Wbijasz pochodnię w ziemię");
        };
        if (o.instant) { go(); return true; }
        return crouchThen(go);
    }
    // one stuck in the ground back into his hand, with the time it has left
    function pickUp(p) {
        if (isLit()) { say("Masz już zapaloną pochodnię w ręce"); return true; }
        return crouchThen(() => {
            const list = plantedList(), i = list.indexOf(p);
            if (i < 0) return;
            list.splice(i, 1);
            Object.assign(store(), { lit: true, left: p.left, max: p.max || TORCH.hours, at: clockNow(), storm: 0, wet: weatherHere(), out: "" });
            setSwitch(true);
            se("Fire1", 40, 120);
            say("Podnosisz pochodnię");
        });
    }
    // the weather of a map the hero is not on: the day's plan (Survival.js) - a torch under the sky gets it too
    function planWeather() {
        const S = T.api("Survival"), plan = S && S.currentWeather ? S.currentWeather() : null;
        if (!plan) return "";
        if (plan.storm && S.stormNow && S.stormNow() > 0.35 && T.time.hour() >= plan.storm.start) return "storm";
        return plan.type === "snow" ? "snow" : "rain";
    }
    const rateOf = w => (w === "rain" || w === "storm" ? TORCH.rain : w === "snow" ? TORCH.snow : 1);
    // the clock burns them all (on any map); burnt down or drowned: gone (a puff of smoke, and a word when he is near)
    function tickPlanted() {
        const list = plantedList();
        if (!list.length) return;
        const now = clockNow(), map = $gameMap.mapId();
        for (let i = list.length - 1; i >= 0; i--) {
            const p = list[i];
            let dt = now - p.at;
            p.at = now;
            if (!(dt > 0) || dt > 48) dt = 0;
            const w = p.map === map ? weatherHere() : p.sky ? planWeather() : "";
            p.left -= dt * rateOf(w);
            p.storm = w === "storm" ? (p.storm || 0) + dt : 0;
            if (p.left > 0 && p.storm < TORCH.storm) continue;
            list.splice(i, 1);
            if (p.map !== map) continue;
            if (layerNow) layerNow.puffAt(p);
            if (Math.hypot(p.x - $gamePlayer.x, p.y - $gamePlayer.y) <= 14) {
                se("Fire3", 30, 70);
                say(p.storm >= TORCH.storm ? "Ulewa zgasiła wbitą pochodnię" : "Wbita pochodnia się wypaliła", p.storm >= TORCH.storm ? "#bcd8ff" : "#ffb07f");
            }
        }
    }
    // the ground's menu line (Farming's menus of bare ground; the menu of its own elsewhere)
    function plantEntry(x, y) {
        const s = store(), min = Math.max(1, Math.round(s.left * 60));
        return { name: "Wbij pochodnię w ziemię", icon: ICON, right: min >= 60 ? Math.floor(min / 60) + " godz. " + (min % 60) + " min" : min + " min",
            help: "Pochodnia zostaje tu i świeci jak małe ognisko, aż się wypali. Podniesiesz ją przyciskiem akcji (O).", run: () => plantTorch(x, y) };
    }
    function installGroundMenu() {
        const FP = T.api("Farming_parts");
        if (!FP || !FP.ui || typeof FP.ui.menuFor !== "function" || FP.ui._torchMenu) return;
        const _menuFor = FP.ui.menuFor;
        FP.ui.menuFor = function(x, y) {
            const m = _menuFor.apply(this, arguments);
            if (m && m.entries && /ziemia/i.test(m.title || "") && held() && canPlantAt(x, y)) m.entries.unshift(plantEntry(x, y));
            return m;
        };
        FP.ui._torchMenu = true;
    }
    installGroundMenu();
    // the action button: a torch stuck in front of him (or where he stands) first - taken up; nothing else answering and a torch in his
    // hand over free ground: the menu with "Wbij pochodnię w ziemię"
    const _Game_Player_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        const ok = Input.isTriggered("ok") && !this._swingEvent && !planting;
        if (ok) {
            const t = frontTile(), map = $gameMap.mapId(), p = plantedAt(map, t.x, t.y) || plantedAt(map, this.x, this.y);
            if (p) return pickUp(p);
        }
        if (_Game_Player_triggerButtonAction.call(this)) return true;
        if (ok && held()) {
            const t = frontTile(), scene = SceneManager._scene;
            if (canPlantAt(t.x, t.y) && scene && typeof scene.openFarmMenu === "function") {
                scene.openFarmMenu("Wolne miejsce", [plantEntry(t.x, t.y)]);
                return true;
            }
        }
        return false;
    };

    // ------------------------------------------------------------------
    // The fire of a blow: burning animals, the fear (Combat_Fight.js calls struck() for the torch's blows that landed)
    // ------------------------------------------------------------------
    const HP = () => T.api("Hunting_parts");
    const burning = [];   // { a (Game_Animal), left (ticks), t (frames to the next) }
    function struck(targets, opts) {
        const o = opts || {};
        const s = store();
        if (s.lit) { s.left -= TORCH.hit; if (s.left <= 0) douse("burnt"); }
        for (const t of targets || []) {
            const a = t && t.ref && t.ref.isAnimal ? t.ref : null;
            if (!a || a._dead) continue;
            const b = burning.find(x => x.a === a);
            const ticks = o.heavy ? FIRE.heavyTicks : FIRE.ticks;
            if (b) b.left = Math.max(b.left, ticks); else burning.push({ a, left: ticks, t: FIRE.every });
            scare(a, o);
        }
    }
    function updateBurning() {
        for (let i = burning.length - 1; i >= 0; i--) {
            const b = burning[i], a = b.a;
            const P = HP(), list = P && P.core && P.core.animals ? P.core.animals() : [];
            if (a._dead || a._hp <= 0 || !list.includes(a)) { burning.splice(i, 1); continue; }
            if (Graphics.frameCount % 3 === 0 && layerNow) layerNow.emberAt(a.centerX(), a.centerY() - 0.35, 0.5);
            if (--b.t > 0) continue;
            b.t = FIRE.every;
            burn(a, FIRE.dmg);
            if (--b.left <= 0) burning.splice(i, 1);
        }
    }
    // a tick of fire: straight off its life (no stagger, no knock - Hunting's hit() would reel it again and again); killed by it = "fire"
    function burn(a, dmg) {
        const C = T.api("Combat");
        a._hp -= dmg;
        a._flashT = 4;
        a._wounded = true;
        if (C && C.numberAt) C.numberAt(a.centerX(), a.centerY() - 0.9, String(dmg), "#ffa040", 0.85);
        if (C && C.sparksAt) C.sparksAt(a.centerX(), a.centerY() - 0.4, "#ffb43a", 4);
        if (a._hp <= 0) T.call("Hunting", "kill", a, "fire");
    }
    // the fear of fire, by kind
    function scare(a, o) {
        const P = HP(), sp = P && P.core && P.core.SPECIES ? P.core.SPECIES[a.kind()] || {} : {};
        if (a._hp <= 0) return;
        if (sp.pack) {
            a._fireFear = Math.max(a._fireFear || 0, FEAR.wolf * (o.heavy ? 1.4 : 1));
            if (a._pack && a._pack.attacker === a) { a._pack.attacker = null; a._pack.nextAttack = Math.max(a._pack.nextAttack, 90); }
            if (a._mode !== "flee" && a._mode !== "lunge") a.setMode("stalk");
            if (P && P.ai && P.ai.knockBack && !a.isJumping()) P.ai.knockBack(a);   // (it jumps back from the flame)
            yelp(a);
        } else if (sp.bear) {
            a._fireFear = Math.max(a._fireFear || 0, FEAR.bear);
            a._gapT = Math.max(a._gapT || 0, FEAR.bearGap);
        } else if (sp.aggressive) {
            if (a._mode !== "flee") a.setMode("retreat", FEAR.boar);
            yelp(a);
        }
    }
    function yelp(a) {
        const pan = Math.max(-80, Math.min(80, Math.round((a.centerX() - ($gamePlayer._realX + 0.5)) * 12)));
        T.audio.se("Growl", { volume: 60, pitch: 150, pan });
    }

    // ---- the animals' side: a frightened one backs off and keeps away; a pack keeps farther from a burning torch
    const BUSY_BEAR = { lunge: true, swipeWind: true, swipe: true, pinWind: true, flee: true };
    function installFear() {
        const P = HP(), GA = P && P.ai && P.ai.Game_Animal;
        if (!GA || GA.prototype._torchFear) return;
        GA.prototype._torchFear = true;
        // a step back from him (or a look at him from far enough); true when this frame was the fear's
        function backOff(a) {
            a._fireFear--;
            if (a.isMoving() || a.isJumping()) return true;
            const dx = a._realX - $gamePlayer._realX, dy = a._realY - $gamePlayer._realY;
            if (Math.hypot(dx, dy) < FEAR.keep) {
                const d = a.bestEscape(dx, dy);
                if (d && P.core.roamingStep) P.core.roamingStep(a, d); else a.turnTowardCharacter($gamePlayer);
            } else a.turnTowardCharacter($gamePlayer);
            return true;
        }
        const _updateWolf = GA.prototype.updateWolf;
        GA.prototype.updateWolf = function() {
            if (this._fireFear > 0 && !this._dead && this._mode !== "flee" && !(this._mode === "lunge" && this.isJumping())) {
                const pack = this._pack;
                if (pack && pack.attacker === this) { pack.attacker = null; pack.nextAttack = Math.max(pack.nextAttack, 60); }
                if (this._mode !== "stalk" && this._mode !== "lunge") this.setMode("stalk");
                if (this._mode === "stalk" && backOff(this)) return;
            }
            if (!isLit() || this._dead) return _updateWolf.call(this);
            // a burning torch near: the ring wider, the pause between leaps longer
            const W = P.core.WOLF, ring = W.ring;
            const pack = this._pack, first = pack && pack.members.find(m => !m._dead) === this;
            if (first && pack.nextAttack > 0) pack.nextAttack += FEAR.gapSlow;
            W.ring = ring + FEAR.ringPlus;
            try { return _updateWolf.call(this); } finally { W.ring = ring; }
        };
        const _updateBear = GA.prototype.updateBear;
        GA.prototype.updateBear = function() {
            if (this._fireFear > 0 && !this._dead && !BUSY_BEAR[this._mode] && !(this._hitStop > 0)) {
                if (this._gapT > 0) this._gapT--;
                if (backOff(this)) return;
            }
            return _updateBear.call(this);
        };
    }

    // ------------------------------------------------------------------
    // The look: the flame in his hand (or on the torch stuck in the ground), its glow, the sparks
    // ------------------------------------------------------------------
    // the flame: 8 frames in the campfire's colours (Farming_Render.js FLAME_LAYERS), 1 px cells like the hero's art; k scales it
    const FLAME_LAYERS = [["#b8321a", 1, 0], ["#ee6a1a", 0.8, 0.9], ["#ffb43a", 0.6, 1.7], ["#fff1a6", 0.34, 2.3]];
    // x of the root, height, half width, cycles per loop, phase
    const TONGUES = [[0, 12, 3.3, 1, 0.0], [-2, 8, 2.3, 2, 1.9], [2, 9, 2.3, 3, 4.1], [0, 6, 3.7, 2, 3.0]];
    const FLAME_W = 14, FLAME_H = 20, FLAME_BASE = 17;
    const flameCache = {};
    function flameFrames(k) {
        const key = k.toFixed(2);
        if (flameCache[key]) return flameCache[key];
        const frames = [];
        for (let f = 0; f < 8; f++) {
            const bmp = new Bitmap(FLAME_W, FLAME_H), ctx = bmp.context, phase = f / 8 * Math.PI * 2;
            for (const [color, hk, inset] of FLAME_LAYERS) {
                ctx.fillStyle = color;
                for (const [tx, th, hw, cyc, ph] of TONGUES) {
                    if (hk < 0.5 && th < 9) continue;
                    const flick = 0.78 + 0.22 * Math.sin(phase * cyc + ph);
                    const height = Math.max(1, Math.round(th * k * hk * flick));
                    const half = Math.max(0.5, hw * k * (0.55 + 0.45 * hk) - inset * 0.55 * k);
                    for (let y = 0; y < height; y++) {
                        const p = y / height;
                        const foot = p < 0.2 ? 0.6 + 0.4 * (p / 0.2) : Math.pow(1 - (p - 0.2) / 0.8, 1.2);
                        const w = Math.max(1, Math.round(half * 2 * foot));
                        const sway = Math.round(Math.sin(phase * cyc + ph + y * 0.35) * p * 1.6);
                        ctx.fillRect(Math.round(FLAME_W / 2 + tx * k + sway - w / 2), FLAME_BASE - y - 1, w, 1);
                    }
                }
            }
            // the ember glow at the foot
            ctx.fillStyle = "#ffb43a";
            ctx.fillRect(FLAME_W / 2 - 1, FLAME_BASE - 1, 2, 1);
            bmp._baseTexture.update();
            frames.push(bmp);
        }
        return (flameCache[key] = frames);
    }
    let glowBmp = null;
    function glowBitmap() {
        if (glowBmp) return glowBmp;
        const S = 64, bmp = new Bitmap(S, S), ctx = bmp.context, g = ctx.createRadialGradient(S / 2, S / 2, 1, S / 2, S / 2, S / 2);
        g.addColorStop(0, "rgba(255,190,90,0.55)");
        g.addColorStop(0.4, "rgba(255,130,40,0.22)");
        g.addColorStop(1, "rgba(255,90,20,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, S, S);
        bmp._baseTexture.update();
        return (glowBmp = bmp);
    }
    // the torch stuck in the ground (and the old hero's torch in hand): the stick and the rag head, upright (12 x 22, the ground at the bottom)
    let stickBmp = null;
    function stickBitmap() {
        if (stickBmp) return stickBmp;
        const bmp = new Bitmap(8, 22), ctx = bmp.context;
        const put = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
        put("#181615", 2, 4, 4, 18);                     // the outline
        put("#787068", 3, 7, 1, 14); put("#5f5853", 4, 7, 1, 14);   // the stick (light from the left)
        put("#181615", 1, 1, 6, 6);                       // the head's outline
        put("#97644c", 2, 2, 2, 4); put("#74503b", 4, 2, 2, 4); put("#52382a", 2, 4, 4, 1);   // the tarred rag
        put("#f07721", 3, 1, 2, 1); put("#ce8357", 2, 1, 1, 1);   // the glowing top
        put("#2a2420", 1, 20, 6, 2);                      // the earth heaped round it
        bmp._baseTexture.update();
        return (stickBmp = bmp);
    }
    const STICK_TIP = { x: 4, y: 2 };   // where its flame stands on the stick bitmap

    // a torch standing in the ground: its holder (sorted at its ground line) with the stick, the glow and the flame
    function makeGround() {
        const box = new Sprite(), stick = new Sprite(stickBitmap()), glow = new Sprite(glowBitmap()), flame = new Sprite();
        box.z = 3;
        stick.anchor.set(0.5, 1);
        glow.anchor.set(0.5, 0.5);
        glow.blendMode = 1;
        flame.anchor.set(0.5, FLAME_BASE / FLAME_H);
        box.addChild(stick, glow, flame);
        return { box, stick, glow, flame };
    }
    // put it at (x, y) - the ground under it, screen px; its flame's spot (the light: x, y, and the ground gx, gy)
    function placeGround(g, x, y, frames, frameK, phase) {
        const fy = -22 + STICK_TIP.y;
        g.box.visible = true;
        g.box.x = x;
        g.box.y = y;
        g.stick.x = 0;
        g.stick.y = 0;
        g.flame.bitmap = frames[frameK];
        g.flame.x = 0;
        g.flame.y = fy + 1;
        g.flame.skew.x = 0;
        g.glow.x = 0;
        g.glow.y = fy - 5;
        g.glow.opacity = Math.round(150 + 40 * Math.sin(phase * 0.21) + 20 * Math.sin(phase * 0.53));
        return { x, y: y + fy - 5, gx: x, gy: y };
    }

    let layerNow = null;   // the live layer (the map's spriteset): for the burning animals' embers, the puff when it goes out
    let burstAt = -999;    // the frame it was lit (a burst of sparks)

    function Sprite_TorchLayer() { this.initialize(...arguments); }
    Sprite_TorchLayer.prototype = Object.create(Sprite.prototype);
    Sprite_TorchLayer.prototype.constructor = Sprite_TorchLayer;
    Sprite_TorchLayer.prototype.initialize = function(spriteset) {
        Sprite.prototype.initialize.call(this);
        this._spriteset = spriteset;
        this._phase = Math.floor(Math.random() * 8);
        this._lean = 0;
        this._lastX = null;
        // in the hand: a holder sorted with the hero (just behind him or just in front), the glow and the flame in it
        this._hold = new Sprite();
        this._hold.z = 3;
        this._glow = new Sprite(glowBitmap());
        this._glow.anchor.set(0.5, 0.5);
        this._glow.blendMode = 1;
        this._flame = new Sprite();
        this._flame.anchor.set(0.5, FLAME_BASE / FLAME_H);
        this._stick = new Sprite(stickBitmap());   // (the old hero only)
        this._stick.anchor.set(0.5, 1);
        this._hold.addChild(this._stick, this._glow, this._flame);
        // stuck in the ground: its own holder, sorted at its own ground line
        this._ground = new Sprite();
        this._ground.z = 3;
        this._gStick = new Sprite(stickBitmap());
        this._gStick.anchor.set(0.5, 1);
        this._gGlow = new Sprite(glowBitmap());
        this._gGlow.anchor.set(0.5, 0.5);
        this._gGlow.blendMode = 1;
        this._gFlame = new Sprite();
        this._gFlame.anchor.set(0.5, FLAME_BASE / FLAME_H);
        this._ground.addChild(this._gStick, this._gGlow, this._gFlame);
        // the sparks (map pixels, so they stay where they flew as he walks on), over the characters near him
        this._sparkBox = new Sprite();
        this._sparkBox.z = 3;
        this._sparks = [];
        this._spot = null;
        this._pool = new Map();   // the torches stuck in the ground by hand on this map: id -> their sprites
        this._groundSpots = [];   // ... and where their flames are (screen px) this frame - their light
        const tm = spriteset._tilemap;
        tm.addChild(this._hold);
        tm.addChild(this._ground);
        tm.addChild(this._sparkBox);
        this.visible = false;
    };
    // (the holders are the tilemap's children, not this sprite's: this one is only their keeper)
    Sprite_TorchLayer.prototype.heroSprite = function() {
        const list = this._spriteset._characterSprites || [];
        if (this._hero && this._hero._character === $gamePlayer && list.includes(this._hero)) return this._hero;
        return (this._hero = list.find(s => s._character === $gamePlayer) || null);
    };
    // the frame: where the flame is (screen px; null - none to see) and how it is drawn
    Sprite_TorchLayer.prototype.refresh = function() {
        const lit = isLit(), hero = this.heroSprite();
        this._phase++;
        const frameK = Math.floor(this._phase / 5) % 8;
        this._hold.visible = false;
        this._ground.visible = false;
        this._spot = null;
        if (lit && hero && !$gamePlayer.isTransparent() && hero.visible && hero.opacity > 0) {
            const low = ratio() < TORCH.low, wet = weatherHere();
            const k = (low ? 0.62 : 1) * (wet === "rain" || wet === "storm" ? 0.78 : wet === "snow" ? 0.88 : 1);
            const frames = flameFrames(Math.round(k * 20) / 20);
            // the hero's way this frame: the flame leans back from it
            const sx = $gamePlayer._realX, vx = this._lastX === null ? 0 : sx - this._lastX;
            this._lastX = sx;
            this._lean = this._lean * 0.85 + Math.max(-0.5, Math.min(0.5, -vx * 12)) * 0.15;
            if (plant && plant.map === $gameMap.mapId()) this.drawPlanted(frames, frameK);
            else this.drawHeld(hero, frames, frameK);
            if (this._spot) this.emitSparks(wet);
        } else {
            this._lastX = null;
        }
        this.drawStuck();
        this.updateSparks();
        return this._spot;
    };
    // the torches stuck in the ground by hand on this map: each its stick, flame and glow, sorted at its own ground line; their light
    Sprite_TorchLayer.prototype.drawStuck = function() {
        const map = $gameMap.mapId(), list = plantedList().filter(p => p.map === map), seen = new Set(), tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const frameK = Math.floor(this._phase / 5) % 8, wet = weatherHere();
        this._groundSpots = [];
        for (const p of list) {
            let g = this._pool.get(p.id);
            if (!g) {
                g = makeGround();
                this._pool.set(p.id, g);
                this._spriteset._tilemap.addChild(g.box);
            }
            seen.add(p.id);
            const low = p.max > 0 && p.left / p.max < TORCH.low;
            const k = (low ? 0.62 : 1) * (wet === "rain" || wet === "storm" ? 0.78 : wet === "snow" ? 0.88 : 1);
            const x = Math.round($gameMap.adjustX(p.x + 0.5) * tw), y = Math.round($gameMap.adjustY(p.y + 0.82) * th);
            const spot = placeGround(g, x, y, flameFrames(Math.round(k * 20) / 20), (frameK + p.id) % 8, this._phase + p.id * 7);
            spot.id = p.id;
            this._groundSpots.push(spot);
            // now and then a spark, while it is on the screen
            if (x > -40 && x < Graphics.width + 40 && y > -40 && y < Graphics.height + 60 && (Graphics.frameCount + p.id * 5) % 15 === 0) {
                const mx = spot.x + $gameMap.displayX() * tw, my = spot.y + $gameMap.displayY() * th;
                if (wet && Math.random() < 0.35) this.addSpark(mx, my - 6, "#c8ccd2", 0.3, 40, true);
                else this.addSpark(mx + (Math.random() - 0.5) * 5, my - 4, Math.random() < 0.5 ? "#ffd35a" : "#ffb43a", 0.55, 26 + Math.floor(Math.random() * 18));
            }
        }
        for (const [id, g] of this._pool) {
            if (seen.has(id)) continue;
            if (g.box.parent) g.box.parent.removeChild(g.box);
            this._pool.delete(id);
        }
    };
    // the smoke where a stuck one went out (map tiles of its tile)
    Sprite_TorchLayer.prototype.puffAt = function(p) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), mx = (p.x + 0.5) * tw, my = (p.y + 0.82) * th - 22;
        for (let i = 0; i < 7; i++) this.addSpark(mx + (Math.random() - 0.5) * 6, my, i < 2 ? "#ffb43a" : "#9aa0a8", 0.35, 55, true, 2);
    };
    Sprite_TorchLayer.prototype.drawHeld = function(hero, frames, frameK) {
        const kind = swingNow(), torchSwing = kind >= 0 && kind === torchKind();
        const h = this._hold, look = T.api("HeroLook"), active = look && look.active && look.active();
        h.x = hero.x;
        h.rotation = hero.rotation;
        h.scale.x = hero.scale.x;
        h.scale.y = hero.scale.y;
        h.opacity = hero.opacity;
        let tx = null, ty = null, behind = false;
        this._stick.visible = false;
        if (torchSwing) {   // the blow: the sheet's own fire; the sparks fly from it
            const body = hero._swingBody, f = body && body._frame;
            if (body && body.visible && f && body.bitmap && /Hero_Torch/.test(body.bitmap._url || "")) {   // (the old hero swings his club sheet: no table)
                const col = Math.round(f.x / SWING_CELL), row = Math.round(f.y / SWING_CELL), tip = (SWING_TIPS[row] || [])[col];
                if (tip) { tx = tip[0] - SWING_FEET.x + body.x; ty = tip[1] - SWING_FEET.y + body.y; }
            }
            this._flame.visible = false;
            this._glow.visible = tx !== null;
            this._swingSparks = true;
        } else if (kind >= 0) {   // another swing of a fight (a blow of another weapon, the roll, the fall): out of sight, only its light
            this._flame.visible = false;
            this._glow.visible = false;
            this._swingSparks = false;
            this._spot = { x: hero.x, y: hero.y - 30, gx: hero.x, gy: hero.y };
            return;
        } else if (active && hero._heroSheet && TIPS[hero._heroSheet] && hero._heroCell) {   // in his hand: where the walking sheet holds it
            const c = hero._heroCell, row = c.row || 0, col = c.col || 0, tip = (TIPS[hero._heroSheet][row] || [])[col];
            if (tip) { tx = tip[0] - CELL / 2; ty = tip[1] - CELL; behind = !!tip[2]; }
            this._flame.visible = !!tip;
            this._glow.visible = !!tip;
            this._swingSparks = false;
        } else {   // the old hero (Reid): a torch drawn beside him
            const o = OLD_HAND[$gamePlayer.direction()] || OLD_HAND[2];
            this._stick.visible = true;
            this._stick.x = o[0];
            this._stick.y = o[1] + 22 - STICK_TIP.y;
            tx = o[0];
            ty = o[1];
            behind = !!o[2];
            this._flame.visible = true;
            this._glow.visible = true;
            this._swingSparks = false;
        }
        if (tx === null) {
            this._spot = { x: hero.x, y: hero.y - 30, gx: hero.x, gy: hero.y };
            return;
        }
        h.visible = true;
        h.y = hero.y + (behind ? -0.01 : 0.01);   // (sorted right behind / right in front of him)
        h.z = hero.z;
        this._flame.bitmap = frames[frameK];
        this._flame.x = tx;
        this._flame.y = ty + 1;
        this._flame.skew.x = this._lean;
        this._glow.x = tx;
        this._glow.y = ty - 5;
        this._glow.opacity = Math.round(150 + 40 * Math.sin(this._phase * 0.21) + 20 * Math.sin(this._phase * 0.53));
        // the flame on the screen (the hero's sprite may be turned: the flinch)
        const c = Math.cos(h.rotation), s = Math.sin(h.rotation), lx = tx * h.scale.x, ly = ty * h.scale.y;
        const x = h.x + lx * c - ly * s, y = hero.y + lx * s + ly * c;
        this._spot = { x, y: y - 5, gx: hero.x, gy: hero.y };   // (the ground under him: he throws no shadow from his own torch)
    };
    Sprite_TorchLayer.prototype.drawPlanted = function(frames, frameK) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const x = Math.round($gameMap.adjustX(plant.gx) * tw), y = Math.round($gameMap.adjustY(plant.gy) * th);
        this._swingSparks = false;
        this._spot = placeGround({ box: this._ground, stick: this._gStick, glow: this._gGlow, flame: this._gFlame }, x, y, frames, frameK, this._phase);
    };
    // the sparks: now and then one from the flame (more while he runs or swings, a burst when lit); steam puffs in the rain
    Sprite_TorchLayer.prototype.emitSparks = function(wet) {
        const sp = this._spot, moving = $gamePlayer.isMoving() && this._lastX !== null;
        const every = this._swingSparks ? 2 : Graphics.frameCount - burstAt < 30 ? 2 : moving ? 7 : 13;
        if (Graphics.frameCount % every !== 0) return;
        const mx = sp.x + $gameMap.displayX() * $gameMap.tileWidth(), my = sp.y + $gameMap.displayY() * $gameMap.tileHeight();
        if (wet && Math.random() < 0.35) this.addSpark(mx, my - 6, "#c8ccd2", 0.3, 40, true);
        else this.addSpark(mx + (Math.random() - 0.5) * 5, my - 4, Math.random() < 0.5 ? "#ffd35a" : "#ffb43a", 0.55, 26 + Math.floor(Math.random() * 18));
    };
    // embers flying off something that burns (a struck animal) - map tiles
    Sprite_TorchLayer.prototype.emberAt = function(x, y, rise) {
        const mx = x * $gameMap.tileWidth() + (Math.random() - 0.5) * 18, my = y * $gameMap.tileHeight() + (Math.random() - 0.5) * 10;
        this.addSpark(mx, my, Math.random() < 0.4 ? "#ffd35a" : Math.random() < 0.5 ? "#ee6a1a" : "#ffb43a", rise || 0.5, 22, false, 2);
    };
    // the puff of smoke when it goes out
    Sprite_TorchLayer.prototype.puff = function() {
        const sp = this._spot;
        if (!sp) return;
        const mx = sp.x + $gameMap.displayX() * $gameMap.tileWidth(), my = sp.y + $gameMap.displayY() * $gameMap.tileHeight();
        for (let i = 0; i < 6; i++) this.addSpark(mx + (Math.random() - 0.5) * 6, my - 2, i < 2 ? "#ffb43a" : "#9aa0a8", 0.35, 50, true, 2);
    };
    let sparkBmps = {};
    function sparkBitmap(color, size) {
        const key = color + size;
        if (sparkBmps[key]) return sparkBmps[key];
        const b = new Bitmap(size, size);
        b.fillRect(0, 0, size, size, color);
        return (sparkBmps[key] = b);
    }
    Sprite_TorchLayer.prototype.addSpark = function(mx, my, color, rise, life, smoke, size) {
        if (this._sparks.length > 40) return;
        const s = new Sprite(sparkBitmap(color, size || (Math.random() < 0.25 ? 2 : 1)));
        s.anchor.set(0.5, 0.5);
        this._sparkBox.addChild(s);
        this._sparks.push({ s, mx, my, vx: (Math.random() - 0.5) * 0.5, vy: -rise * (0.6 + Math.random() * 0.8), t: 0, life, smoke: !!smoke });
    };
    Sprite_TorchLayer.prototype.updateSparks = function() {
        const box = this._sparkBox, hero = this.heroSprite();
        box.y = hero ? hero.y + 0.02 : 0;
        box.x = 0;
        const ox = $gameMap.displayX() * $gameMap.tileWidth(), oy = $gameMap.displayY() * $gameMap.tileHeight();
        for (let i = this._sparks.length - 1; i >= 0; i--) {
            const p = this._sparks[i];
            p.t++;
            p.mx += p.vx + Math.sin((p.t + i) * 0.3) * 0.15;
            p.my += p.vy;
            if (!p.smoke) p.vy += 0.008;   // (embers slow down; smoke keeps rising)
            const k = p.t / p.life;
            p.s.x = p.mx - ox;
            p.s.y = p.my - oy - box.y;
            p.s.opacity = Math.round(255 * (1 - k) * (p.smoke ? 0.55 : 1));
            if (p.smoke) p.s.scale.set(1 + k * 1.5, 1 + k * 1.5);
            if (p.t >= p.life) { box.removeChild(p.s); this._sparks.splice(i, 1); }
        }
    };
    Sprite_TorchLayer.prototype.update = function() { /* (refreshed after the spriteset's frame: Spriteset_Map.update below) */ };

    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this._torchLayer = new Sprite_TorchLayer(this);
        this.addChild(this._torchLayer);
        layerNow = this._torchLayer;
    };
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        if (this._torchLayer) {
            layerNow = this._torchLayer;
            spotNow = this._torchLayer.refresh();
        }
    };
    let spotNow = null;
    // the lights of the torches stuck in the ground by hand on this map: as many small fires (the reach of the one in his hand)
    function groundLights() {
        const spots = layerNow && layerNow._groundSpots;
        if (!spots || !spots.length) return [];
        return spots.map(sp => ({ x: sp.x, y: sp.y, r: 300, i: 1, id: 7100 + (sp.id % 800), gx: sp.gx, gy: sp.gy, hf: 20, glow: true }));
    }
    // where the light of the torch is now (screen px): x, y - the flame; gx, gy - the ground under it (for the shadows). null: not lit
    function lightSpot() {
        if (!isLit()) return null;
        return spotNow;
    }

    // the sheets load with the map (the first step with the torch does not wait for them)
    const _Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _Scene_Map_create.call(this);
        for (const name of Object.keys(TIPS)) ImageManager.loadCharacter(name);
        installFear();
    };
    T.onMapUpdate(tick, { name: "torch", owner: "Torch" });
    T.on("mapLeave", () => { plant = null; burning.length = 0; }, { owner: "Torch" });
    T.on("load", () => { plant = null; burning.length = 0; const s = store(); if (s.lit) s.at = clockNow(); }, { owner: "Torch" });

    PluginManager.registerCommand("Torch", "light", () => light());
    PluginManager.registerCommand("Torch", "douse", () => douse(""));

    // held(): in his hand right now (HeroLook draws the torch sheets); inHand(): his (lit - also while stuck in the ground) - a weapon then
    const held = () => isLit() && !(plant && plant.map === $gameMap.mapId());
    window.Torch = T.register("Torch", {
        VERSION: "1.0.0", ITEM, TORCH, FIRE, FEAR, PLANT, TIPS, SWING_TIPS,
        light, douse, isLit, inHand: isLit, held, ratio, lightSpot, struck, weatherHere, groundLights, canPlantAt, plantTorch, pickUp,
        stuck: () => plantedList().map(p => Object.assign({}, p)), stuckAt: (map, x, y) => plantedAt(map, x, y), frontTile,
        planted: () => (plant ? Object.assign({}, plant) : null), burning: () => burning.map(b => ({ a: b.a, left: b.left })),
        state: () => store(), layer: () => layerNow
    });
})();
