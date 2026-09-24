//=============================================================================
// Hunting.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Polowanie i dzikie zwierzęta: zające i jelenie płoszą się, dzik szarżuje, nocą polują watahy wilków. Proca, łuk, broń wręcz (Combat.js) - tryb walki (Tab), klawisz O. v1.2.0
 * @author Tawerna
 *
 * @param enabled
 * @text Zwierzyna biega po mapach
 * @type boolean
 * @default true
 *
 * @param maps
 * @text Mapy i liczba zwierząt (JSON)
 * @desc Numer mapy -> ile zajęcy (rabbit), jeleni (deer), dzików (boar) i wilków (wolf) najwyżej naraz. Notatka mapy <Hunt:rabbit=3,deer=1> albo <Hunt:off> ma pierwszeństwo.
 * @type string
 * @default {"3":{"rabbit":3,"boar":1,"wolf":2},"4":{"rabbit":4,"deer":1,"wolf":3},"5":{"rabbit":3,"deer":2,"boar":1,"wolf":3},"6":{"rabbit":2,"deer":1,"boar":1,"wolf":3},"7":{"rabbit":2},"8":{"rabbit":2},"12":{"deer":2,"boar":2,"wolf":4},"15":{"rabbit":3,"deer":1}}
 *
 * @help
 * ============================================================================
 * POLOWANIE
 * ============================================================================
 * Na mapach z listy (parametr "Mapy i liczba zwierząt") w ciągu dnia (5-21)
 * pasą się zające i jelenie (jelenie tylko rano i wieczorem). Uciekają, gdy
 * podejdziesz za blisko, więc trzeba je ustrzelić z daleka.
 * CZUJNOŚĆ: zwierzę (i ptak, wtyczka Birds) nie ucieka od razu - najpierw coś
 * słyszy (szare "?" nad głową, przestaje się paść i patrzy), potem jest pewne
 * (żółte "!"), a wtedy ucieka. Szybciej zauważa cię, gdy idziesz albo biegniesz
 * prosto na nie; wolniej, gdy stoisz, gdy zasłaniają cię drzewa, krzaki albo
 * budynek, o świcie i zmierzchu, w deszczu - i przede wszystkim gdy się skradasz.
 * SKRADANIE: klawisz C włącza i wyłącza. Postać idzie pochylona, dwa razy
 * wolniej, nie biega, kroki są ciche (Atmosphere), na dole ekranu plakietka.
 * CELOWANIE (tryb walki, Tab): przytrzymaj O. Postać kręci procą (napina łuk), a na najbliższym
 * zwierzęciu przed nią pojawia się żółty krąg, który maleje, gdy stoisz. Puść O:
 * strzał leci w losowy punkt kręgu - mały ptak wymaga małego kręgu, zając
 * wybacza więcej. Zmęczony nie wycelujesz dokładnie; napięty łuk po chwili
 * zaczyna drżeć. Strzałki kierunku w czasie celowania obracają na inny cel,
 * Anuluj opuszcza broń bez strzału.
 *
 *   Proca (zrobisz ją w warsztacie): amunicją są kamienie, zasięg 6 kratek,
 *     siła 1. Zając pada od jednego trafienia, jeleń ma 3 życia.
 *   Łuk + strzały (warsztat): zasięg 9 kratek, siła 2. Jeleń pada od dwóch strzałów.
 *   Oszczep (warsztat): bez amunicji i celowania. Gdy zwierzę stoi najwyżej
 *     2 pola przed tobą, O pchnie je oszczepem (siła 3); gdy nic nie ma tak
 *     blisko, O celuje z łuku albo procy jak wcześniej (a bez nich pcha w
 *     powietrze).
 *
 * WALKA (Combat.js, jeśli jest): zwierzęta mają poziom (zależny od mapy), życie
 * i równowagę; ciosy zbijają równowagę, a pusta = zwierzę się zatacza (odsłonięte).
 * Dzik i wilki atakują przez obronę gracza z Combat.js: przewrót (Spacja) unika
 * ciosu, blok (P w trybie walki) go osłabia, parowanie (P tuż przed trafieniem) ogłusza napastnika.
 * Dzik z bliska (5 pól) szarżuje w prostej linii; gdy chybi, przebiega jeszcze
 * ok. 3,5 pola, staje zziajany (ok. 1,7 s - czas na atak), potem ostrzega i wraca.
 * Opis poniżej (siła broni, życie) dotyczy gry bez Combat.js.
 *
 * WILKI (nocą 20-5): watahy po 2-4. Gdy cię zauważą (albo podejdziesz na 6 pól),
 * wyją i otaczają cię w kręgu; po jednym naraz: przysiada i szczeka ("!"), skacze
 * i gryzie, a po skoku stoi chwilę - wtedy bij. Mocno poranione, albo gdy padnie
 * przewodnik, uciekają.
 *
 * DZIK (rano 5-9 i wieczorem 17-21): 5 żyć, nie ucieka. Gdy cię zauważy albo
 * oberwie, staje, prycha i pokazuje "!", a potem szarżuje - szybciej, niż
 * biegniesz. Jeśli cię dopadnie, zabiera 35% zdrowia (trzy trafienia i koniec
 * gry) i 22 wytrzymałości, i rani (Survival.js: przez dobę siły najwyżej 60%,
 * zdrowie nie odrasta; leczy opatrunek z krwawnika), po czym odbiega
 * i po chwili może wrócić. Pchnięcie oszczepem zatrzymuje szarżę: dzik
 * odskakuje, a drugie pchnięcie go kładzie. Z jednym życiem ucieka. Łup: 3 sztuki
 * zwierzyny.
 *
 * STRZAŁ: klawisz O w trybie walki (Tab). Lecisz w stronę, w którą patrzysz; gdy trzymasz dwa
 * klawisze kierunku naraz (skos), strzał leci na skos. Strzał kosztuje trochę
 * wytrzymałości i jedno użycie broni (wtyczka Durability), a huk płoszy zwierzynę
 * w promieniu 7 kratek. Trafiony jeleń, który jeszcze żyje, ucieka ranny.
 *
 * ŁUP: zabite zwierzę leży na ziemi (zwłoki). Podejdź z nożem i naciśnij przycisk
 * akcji: bohater kuca i oprawia je - mięso tego zwierzęcia, surowa skóra i ścięgna
 * (zając 1/1/1, jeleń 3/2/2, dzik 4/2/2, wilk 2/1/2). Bez noża nic nie weźmiesz,
 * a zwłoki czekają - po dobie gniją. Zając z pułapki: z nożem oprawiasz go od
 * razu przy odbiorze, bez noża zostaje przy pułapce jako zwłoki.
 *
 * PUŁAPKI (Farming.js): sama pułapka nic nie łapie - trzeba założyć w niej
 * przynętę (menu pułapki: "Załóż przynętę" - marchew, kapusta, dzikie jabłka,
 * gruszki albo jagody). Spokojny zając zwęszy ją z 9 kratek, podchodzi skokami,
 * obwąchuje i wpada (65%) albo płoszy się i ucieka - może przy tym ukraść
 * przynętę. Przynęta wystarcza na dobę albo do pierwszego zająca. Złapany zając
 * siedzi w pułapce, dopóki go nie zabierzesz ("Zbierz: Zwierzyna"); do tego czasu
 * pułapka nie łapie następnego. Gdy jesteś blisko, słychać trzask i widać dymek
 * "Zając wpadł w pułapkę!". Zające boją się ciebie: przy pułapce, przy której
 * stoisz, nic się nie złapie. Kiedy cię nie ma (inna mapa, sen), zając też może
 * się skusić: każda godzina, gdy zające są na nogach (5-21), a przynęta leży,
 * to 8% szans.
 *
 * Zwierzyna odnawia się co rano do pełnej liczby, ale to, co ustrzeliłeś dzisiaj,
 * nie wróci przed świtem. Zwierzęta nie są zapisywane w grze (pojawiają się od
 * nowa po wejściu na mapę).
 * ============================================================================
 */

(() => {
    "use strict";

    const params = PluginManager.parameters("Hunting");
    const ENABLED = params.enabled !== "false";
    let MAPS = {};
    try { MAPS = JSON.parse(params.maps || "{}"); } catch (e) { MAPS = {}; }

    // (the "shoot" action - the attack, the shot - is on O in Combat.js's combat mode; no key of its own here)
    Input.keyMapper[67] = "sneak";   // C

    const ITEM = { carcass: 101, stone: 64, sling: 125, bow: 126, arrows: 127, bandage: 152, spear: 154, rawHide: 96, sinew: 163, knifeStone: 90, knifeIron: 91 };
    // speed / flee: MZ move speeds (4 = the player); sight: tiles at which it starts to notice the player (see noticeRate);
    // hours: when it is about. aggressive (the boar): it does not run from the player but charges him - see Game_Animal.thinkBoar;
    // charge: its speed then, hurt: the strength it takes on a hit (plus a wound, Survival.js), run: its sheet while charging
    // hp: its life at level 1 (combat scale: an arrow takes 30); atk: what its attack takes from the hero (Combat.js, +12% a level);
    // poise: its balance (hits take it away; at 0 it reels for `stun` frames). pack: wolves come in packs of pack[0]-pack[1]
    const SPECIES = {
        rabbit: { name: "Zając", sheet: "$Animal_Rabbit", hp: 12, poise: 10, stun: 30, speed: 3, flee: 5, sight: 6, radius: 0.5, drop: 1, hours: [[5, 21]] },
        deer: { name: "Jeleń", sheet: "$Animal_Deer", hp: 40, poise: 25, stun: 40, speed: 3, flee: 5, sight: 9, radius: 0.75, drop: 2, hours: [[5, 10], [16, 21]] },
        boar: { name: "Dzik", sheet: "$Animal_Boar", run: "$Animal_Boar_Run", hp: 110, atk: 30, poise: 60, stun: 70, speed: 3, flee: 4.6, charge: 4.6, sight: 7, radius: 0.65, drop: 3,
            hours: [[5, 9], [17, 21]], aggressive: true, hurt: 22, harm: 0.35, markY: -54 },   // harm: the part of the hero's health a hit takes (without Combat.js); markY: the "?"/"!" just over its back
        wolf: { name: "Wilk", sheet: "$Animal_Wolf", run: "$Animal_Wolf_Run", stalk: "$Animal_Wolf_Stalk", bark: "$Animal_Wolf_Bark", hp: 50, atk: 12, poise: 30, stun: 50,
            speed: 4, flee: 5, sight: 9, radius: 0.55, drop: 1, hours: [[20, 24], [0, 5]], aggressive: true, pack: [2, 4], markY: -46 }
    };
    const atkOf = a => Math.round((SPECIES[a.kind()].atk || 10) * (1 + 0.12 * ((a._level || 1) - 1)));
    // the boar's temper, in frames: the warning before a charge (it stands, snorts and shows "!"), the longest charge, the run
    // back after a hit, the stagger after taking a spear
    // commit: tiles from the hero at which the charge locks its line and goes straight on; overshoot: how far past him it runs when
    // it misses; recover: the frames it then stands panting (the hero's moment to hit it) before it warns again
    // rush: how much faster it runs once its line is locked (move speed, +0.4 = a quarter faster)
    const BOAR = { warn: 50, charge: 240, retreat: [90, 150], stagger: 36, contact: 1.05, commit: 5, overshoot: 3.5, recover: 100, rush: 0.4 };
    // range in tiles, speed in tiles per frame, damage, stamina per shot, cooldown in frames;
    // aiming (hold the shoot key): the circle shrinks from spread to focus (tiles of radius) in `steady` frames; holdAt: the frame of the
    // shooting animation that is held while aiming (the sling whirls over the head, the bow is drawn)
    const WEAPONS = {
        sling: { item: ITEM.sling, ammo: ITEM.stone, range: 6, speed: 0.34, damage: 14, stamina: 2, cooldown: 24, se: "Bow1", pitch: 130, spread: 1.3, focus: 0.12, steady: 70, holdAt: 30, release: 40, wobble: 5 },
        bow: { item: ITEM.bow, ammo: ITEM.arrows, range: 9, speed: 0.55, damage: 30, stamina: 3, cooldown: 30, se: "Bow3", pitch: 100, spread: 1.1, focus: 0.08, steady: 55, holdAt: 30, release: 36, wobble: 0, tremble: 240 }
    };
    // the spear: no ammunition, no aiming - a jab at what stands within reach (tiles from the player's centre) in front of him
    const SPEAR = { item: ITEM.spear, reach: 1.9, damage: 45, stamina: 3, cooldown: 36, noise: 4 };   // (without Combat.js; with it the spear is a melee weapon there)
    const NOISE_RADIUS = 7;

    // swing kinds of ChoppableTree.js: the body whirls the sling / draws the bow, and the shot leaves on the release frame; the spear's jab
    const SHOT_SWING = { sling: 9, bow: 10, spear: 15 };
    let animate = true;   // tests switch the shooting animation off (the shot then leaves at once)
    let animals = [];
    let packs = [];
    let projectiles = [];
    const killListeners = [];
    let cooldown = 0;
    let spotCache = { mapId: 0, spots: null };
    const hours = () => ($gameSystem && typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 12);
    const day = () => ($gameSystem && typeof $gameSystem.dayNightDay === "function" ? $gameSystem.dayNightDay() : 1);

    // ------------------------------------------------------------------
    // Saved data: $gameSystem._hunt = { kills: { rabbit: n, deer: n }, killed: { mapId: { day, rabbit: n, deer: n } } }
    // ------------------------------------------------------------------
    function hunt() {
        if (!$gameSystem._hunt) $gameSystem._hunt = { kills: {}, killed: {} };
        return $gameSystem._hunt;
    }
    function killedToday(mapId, kind) {
        const rec = hunt().killed[mapId];
        return rec && rec.day === day() ? rec[kind] || 0 : 0;
    }

    // ------------------------------------------------------------------
    // What lives on this map
    // ------------------------------------------------------------------
    function mapTargets() {
        const note = ($dataMap && $dataMap.note) || "";
        const tag = /<Hunt:\s*([^>]*)>/i.exec(note);
        if (tag) {
            if (/^\s*off\s*$/i.test(tag[1])) return {};
            const out = {};
            for (const pair of tag[1].split(",")) {
                const [k, v] = pair.split("=").map(s => s.trim());
                if (SPECIES[k] && Number(v) > 0) out[k] = Number(v);
            }
            return out;
        }
        return MAPS[$gameMap.mapId()] || {};
    }
    function activeNow(kind) {
        const h = hours();
        return SPECIES[kind].hours.some(([a, b]) => h >= a && h < b);
    }

    // grass tiles a wild animal may stand on: passable, no event, no building (Farming.js knows the ground)
    function spotsOfMap() {
        const mapId = $gameMap.mapId();
        if (spotCache.mapId === mapId && spotCache.spots) return spotCache.spots;
        const F = window.Farming;
        if (!F) return [];
        const spots = [];
        for (let y = 1; y < $gameMap.height() - 1; y++) {
            for (let x = 1; x < $gameMap.width() - 1; x++) {
                const info = F.groundInfoAt(x, y);
                if (info === undefined) return null;   // the ground pictures are still loading: try again later
                if (!info || !info.kind) continue;
                if (!$gameMap.checkPassage(x, y, 0x0f) || $gameMap.eventsXy(x, y).length > 0 || F.hasObjectTile(x, y) || F.buildingAt(x, y)) continue;
                spots.push({ x, y });
            }
        }
        spotCache = { mapId, spots };
        return spots;
    }

    // ------------------------------------------------------------------
    // RoamingActor: what a wild animal here and a farm animal in Livestock.js have in common - attaching and
    // detaching a Sprite_Character as the map scene comes and goes, and the flee-direction scan a startled
    // animal uses to pick which way to run. Livestock.js reuses this (it loads after Hunting.js in plugins.js).
    // ------------------------------------------------------------------
    function roamingSpriteset() {
        const scene = SceneManager._scene;
        return scene instanceof Scene_Map ? scene._spriteset : null;
    }
    // set: the spriteset to draw in. When the map scene is rebuilt (after the menu, the journal, the day summary...) the new
    // spriteset is not yet SceneManager._scene._spriteset while it is being built, so it has to be passed in.
    function roamingAddSprite(actor, set) {
        set = set || roamingSpriteset();
        if (!set || !set._tilemap) return;
        if (actor._sprite && actor._sprite.parent === set._tilemap) return;
        const sprite = new Sprite_Character(actor);
        actor._sprite = sprite;
        set._tilemap.addChild(sprite);
    }
    function roamingDropSprite(actor) {
        if (!actor._sprite) return;
        try {
            if (actor._sprite.parent) actor._sprite.parent.removeChild(actor._sprite);
            actor._sprite.destroy();
        } catch (e) { /* already gone with the old scene */ }
        actor._sprite = null;
    }
    // the passable direction (2/4/6/8) that leads farthest away from (dx, dy) - a cardinal-direction scan shared
    // by the wild animals here (Game_Animal) and the farm animals of Livestock.js (Game_Livestock), tuned through
    // opts since the two want different temperaments:
    //   opts.startAtDistance: only move when a direction beats the current distance (Livestock's calm step-aside);
    //     left out, any passable direction is picked (Hunting's animals always bolt once alarmed)
    //   opts.margin: how much a direction must beat the running best score to replace it (Livestock: 0.05)
    //   opts.jitter: random wobble added to each score, 0-1 (Hunting: 0.6, so animals don't all dodge identically)
    //   opts.lookahead: bonus for a direction with room to keep running one more step (Hunting: 0.8)
    //   opts.deadEnd: penalty when a direction runs straight into a corner (Hunting: 2)
    //   opts.diagonal: also the four diagonals, as numpad codes 1 3 7 9 (the wild animals walk in 8 directions like the player;
    //     step it with roamingStep)
    const DIAGONAL = { 1: [4, 2], 3: [6, 2], 7: [4, 8], 9: [6, 8] };
    const STEP = { 1: [-1, 1], 2: [0, 1], 3: [1, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 8: [0, -1], 9: [1, -1] };
    function roamingCanStep(actor, x, y, d) {
        const diag = DIAGONAL[d];
        return diag ? actor.canPassDiagonally(x, y, diag[0], diag[1]) : actor.canPass(x, y, d);
    }
    // one step in any of the 8 directions; on a diagonal it faces the side it goes to (the animals' sheets show them best sideways)
    function roamingStep(actor, d) {
        const diag = DIAGONAL[d];
        if (!diag) { actor.moveStraight(d); return; }
        actor.setDirection(diag[0]);
        actor.moveDiagonally(diag[0], diag[1]);
    }
    function roamingFleeDirection(actor, dx, dy, opts) {
        opts = opts || {};
        const dirs = opts.diagonal ? [2, 4, 6, 8, 1, 3, 7, 9] : [2, 4, 6, 8];
        let best = 0, bestScore = opts.startAtDistance ? Math.hypot(dx, dy) : -Infinity;
        for (const d of dirs) {
            if (!roamingCanStep(actor, actor._x, actor._y, d)) continue;
            const [sx, sy] = STEP[d];
            let score = Math.hypot(dx + sx, dy + sy) + (opts.jitter ? Math.random() * opts.jitter : 0);
            if (opts.lookahead || opts.deadEnd) {
                const nx = $gameMap.roundX(actor._x + sx), ny = $gameMap.roundY(actor._y + sy);
                if (roamingCanStep(actor, nx, ny, d)) score += opts.lookahead || 0;   // room to keep running
                else if (opts.deadEnd && !dirs.some(e => roamingCanStep(actor, nx, ny, e))) score -= opts.deadEnd;
            }
            if (score > bestScore + (opts.margin || 0)) { bestScore = score; best = d; }
        }
        return best;
    }
    window.RoamingActor = { spriteset: roamingSpriteset, addSprite: roamingAddSprite, dropSprite: roamingDropSprite, fleeDirection: roamingFleeDirection, step: roamingStep, canStep: roamingCanStep };

    // ------------------------------------------------------------------
    // Sneaking (C switches it on and off): slower, never running, a crouched walk (its own sheet), quieter steps
    // (Atmosphere.js asks Hunting.sneaking()), and the animals and birds notice the player much later (noticeRate).
    // ------------------------------------------------------------------
    const SNEAK_SHEET = "$Reid_Poor_Sneak";
    const sneaking = () => !!($gameSystem && $gameSystem._sneak);
    function setSneak(on) {
        $gameSystem._sneak = !!on;
        popup(82, on ? "Skradasz się (C: wyłącz)" : "Idziesz normalnie", "#cfe6ff");
    }
    const _Game_Player_realMoveSpeed = Game_Player.prototype.realMoveSpeed;
    Game_Player.prototype.realMoveSpeed = function() {
        return sneaking() ? _Game_Player_realMoveSpeed.call(this) - 1 : _Game_Player_realMoveSpeed.call(this);   // half the speed of walking (not running: see isDashing)
    };
    const _Game_Player_isDashing = Game_Player.prototype.isDashing;
    Game_Player.prototype.isDashing = function() {
        return !sneaking() && _Game_Player_isDashing.call(this);
    };
    const _Game_Player_characterName = Game_Player.prototype.characterName;
    Game_Player.prototype.characterName = function() {
        const name = _Game_Player_characterName.call(this);
        return sneaking() && name === "$Reid_Poor" ? SNEAK_SHEET : name;   // (only for the hero's own sheet)
    };
    // how far the player went last frame (tiles): standing, walking or running changes how easily he is seen
    let lastPlayerPos = null, playerStep = 0;
    function trackPlayer() {
        const x = $gamePlayer._realX, y = $gamePlayer._realY;
        playerStep = lastPlayerPos ? Math.hypot(x - lastPlayerPos.x, y - lastPlayerPos.y) : 0;
        lastPlayerPos = { x, y };
    }

    // ------------------------------------------------------------------
    // Awareness: every wild animal (and bird, Birds.js) has a meter 0..1 that fills while it notices the player and
    // empties again when he is out of its sight; full, it runs (or flies) away. noticeRate says how fast it fills.
    // ------------------------------------------------------------------
    // something between the two points that hides the player: a tree, a bush, a rock, a building
    function coverBetween(ax, ay, bx, by) {
        const d = Math.hypot(bx - ax, by - ay), n = Math.floor(d / 0.5);
        for (let i = 1; i < n; i++) {
            const tx = Math.floor(ax + (bx - ax) * i / n), ty = Math.floor(ay + (by - ay) * i / n);
            if (window.Farming && Farming.buildingAt(tx, ty)) return true;
            if ($gameMap.eventsXy(tx, ty).some(e => e.isNormalPriority() && (e.characterName() !== "" || e.tileId() > 0))) return true;
        }
        return false;
    }
    // per frame, for something at (x, y) (tiles, centre) that watches `sight` tiles around it; 0 = does not notice him
    // the hero's skills (Combat.js, Skills_Data.js): perk(key) = what the learnt skills add up to for an effect, perkRoll(key) = a
    // roll against it (a chance), knowsSkill(id) = that one skill is learnt
    const perk = key => (window.Combat && Combat.perk ? Combat.perk(key) : 0);
    const perkRoll = key => { const c = perk(key); return c > 0 && Math.random() < c; };
    const knowsSkill = id => !!(window.Combat && Combat.hasSkill && Combat.hasSkill(id));
    function noticeRate(x, y, sight) {
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.5, dist = Math.hypot(px - x, py - y);
        const moving = playerStep > 0.005, running = moving && playerStep > 0.09, sneak = sneaking();
        const h = hours(), dim = h < 6.5 || h >= 19;   // dawn, dusk, night: it sees worse
        const rain = ["rain", "storm"].includes($gameScreen.weatherType()) && ($gameScreen._weatherPowerTarget || 0) > 0;
        let range = sight * (sneak ? 0.45 : 1) * (running ? 1.35 : 1) * (moving ? 1 : 0.6) * (dim ? 0.8 : 1) * (rain ? 0.85 : 1);
        if (dist >= range) return 0;
        if (dist > 1.5 && coverBetween(px, py, x, y)) {
            range *= 0.6;
            if (dist >= range) return 0;
        }
        // 0 at the edge of its sight .. 1 right beside it. Walking straight at a rabbit (sight 6) it bolts about 4-4.5 tiles
        // away; sneaking (a smaller range, half the speed, a slower meter) you get to about 1.5-2 tiles
        const k = 1 - dist / range;
        return (0.02 + 0.12 * k) * (running ? 1.8 : moving ? 1 : 0.5) * (sneak ? 0.6 : 1) * (1 - Math.min(0.8, perk("sneak")));   // (Ciche kroki, Tropiciel)
    }
    // the meter of one creature (an object with _aware), one frame; returns it
    function updateAwareness(who, x, y, sight) {
        const r = noticeRate(x, y, sight);
        who._aware = Math.max(0, Math.min(1, (who._aware || 0) + (r > 0 ? r : -0.004)));
        return who._aware;
    }
    // "?" when it has heard something, "!" (yellow) when it is about to go; a sprite over its head
    const markCache = {};
    function markBitmap(mark) {
        if (markCache[mark]) return markCache[mark];
        const bmp = new Bitmap(20, 24), UI = window.UIStyle || {};
        bmp.fontSize = 22;
        bmp.fontBold = true;
        bmp.outlineColor = "rgba(0,0,0,0.95)";
        bmp.outlineWidth = 5;
        bmp.textColor = mark === "!" ? (UI.accent || "#ffd23f") : "#eceef0";
        bmp.drawText(mark, 0, 0, 20, 24, "center");
        return (markCache[mark] = bmp);
    }
    // keeps a mark sprite (child of `parent`, `dy` px above its origin) in step with an awareness meter
    function updateMark(owner, parent, dy, aware) {
        const mark = aware >= 0.7 ? "!" : aware >= 0.3 ? "?" : "";
        if (!owner._markSprite || owner._markSprite.parent !== parent) {
            if (!parent) return;
            owner._markSprite = new Sprite();
            owner._markSprite.anchor.set(0.5, 1);
            parent.addChild(owner._markSprite);
        }
        const s = owner._markSprite;
        s.visible = !!mark;
        if (mark) {
            s.bitmap = markBitmap(mark);
            s.y = dy - (mark === "!" ? Math.abs(Math.sin(Graphics.frameCount / 5)) * 2 : 0);
        }
    }

    // ------------------------------------------------------------------
    // The animal: a plain character that thinks for itself
    // ------------------------------------------------------------------
    function Game_Animal() {
        this.initialize(...arguments);
    }
    Game_Animal.prototype = Object.create(Game_Character.prototype);
    Game_Animal.prototype.constructor = Game_Animal;

    Game_Animal.prototype.initialize = function(kind, x, y) {
        Game_Character.prototype.initialize.call(this);
        const sp = SPECIES[kind];
        this._kind = kind;
        const lv = Math.max(1, (window.Combat ? Combat.placeLevel() : 1) + (Math.random() < 0.3 ? 1 : 0));
        this._level = lv;
        this._maxHp = Math.round(sp.hp * (1 + 0.15 * (lv - 1)));
        this._hp = this._maxHp;
        this._maxPoise = Math.round((sp.poise || 20) * (1 + 0.1 * (lv - 1)));
        this._poise = this._maxPoise;
        this._poiseT = 0;        // frames since the last hit: the balance comes back after a while
        this._stun = 0;          // frames it reels (balance broken, an attack parried): it does nothing
        this._flashT = 0;        // frames of the white flash of a hit (Combat.js draws it)
        this._engaged = false;   // it fights the hero (Combat.js shows its bars)
        this._pack = null;       // wolves: the pack (see makePack)
        this._wounded = false;
        this._alarm = 0;         // frames it keeps running after a shot nearby
        this._aware = 0;         // 0..1: how sure it is that someone is there (noticeRate); 1 = it runs
        this._fleeing = false;
        this._wait = 30 + Math.floor(Math.random() * 120);
        this._frozen = false;    // tests: stand still
        this._dead = false;
        this._mode = "roam";     // the boar's temper: roam, warn, charge, retreat, stagger, flee (thinkBoar)
        this._modeT = 0;
        this._sniff = 0;         // frames it still sniffs at a snare before it steps in (or not) - see lure()
        this._lureSnare = null;
        this._lureCd = 0;        // frames it keeps away from snares after a fright at one
        this.setImage(sp.sheet, 0);
        this.setPosition(x, y);
        this.setDirection([2, 4, 6, 8][Math.floor(Math.random() * 4)]);
        this.setMoveSpeed(sp.speed);
        this.setMoveFrequency(5);
        this.setWalkAnime(true);
        this.setStepAnime(false);
        this.setThrough(false);
        this.setPriorityType(1);
    };
    // a wild animal keeps out of buildings and out of the yards (the open ground inside a yard belongs to Livestock.js)
    Game_Animal.prototype.isMapPassable = function(x, y, d) {
        if (window.Farming && Farming.buildingAt($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d))) return false;
        return Game_Character.prototype.isMapPassable.call(this, x, y, d);
    };
    Game_Animal.prototype.kind = function() { return this._kind; };
    Game_Animal.prototype.centerX = function() { return this._realX + 0.5; };
    Game_Animal.prototype.centerY = function() { return this._realY + 0.5; };
    // it does not count as an "event" for Farming.js etc.
    Game_Animal.prototype.isAnimal = function() { return true; };

    Game_Animal.prototype.update = function() {
        Game_Character.prototype.update.call(this);
        if (this._alarm > 0) this._alarm--;
        if (this._lureCd > 0) this._lureCd--;
        if (this._flashT > 0) this._flashT--;
        if (++this._poiseT > 120 && this._poise < this._maxPoise) this._poise = Math.min(this._maxPoise, this._poise + this._maxPoise / 90);
        if (!this._dead) updateAwareness(this, this.centerX(), this.centerY(), SPECIES[this._kind].sight);
        const sprite = this._sprite;   // (its height only once the sheet has loaded)
        const calm = this._mode === "roam" || this._mode === "warn" || this._mode === "windup";   // (no mark while a boar charges, backs off or reels)
        const markY = SPECIES[this._kind].markY, windup = this._mode === "windup";
        if (sprite && sprite.bitmap && sprite.bitmap.isReady()) updateMark(this, sprite, markY !== undefined ? markY : -sprite.patternHeight() - 2, this._fleeing || !calm || this._stun > 0 ? 0 : windup ? 1 : this._aware);
        if (this._frozen || this._dead) return;
        if (this._stun > 0) { if (--this._stun === 0) this.afterStun(); return; }
        if (SPECIES[this._kind].pack) { this.updateWolf(); return; }
        if (SPECIES[this._kind].aggressive) { this.updateBoar(); return; }
        if (this.isMoving()) return;
        this.think();
    };

    Game_Animal.prototype.think = function() {
        const sp = SPECIES[this._kind];
        const dx = this._realX - $gamePlayer._realX, dy = this._realY - $gamePlayer._realY;
        const dist = Math.hypot(dx, dy);
        if (this._aware >= 1 || this._wounded || this._alarm > 0) this._fleeing = true;
        else if (this._aware < 0.3 && dist > sp.sight * 1.2) this._fleeing = false;
        if ((this._aware >= 0.3 || this._fleeing) && this._sniff > 0) { this._sniff = 0; this._lureSnare = null; }   // disturbed at the snare
        if (this._aware >= 0.3 && !this._fleeing) { this.turnTowardCharacter($gamePlayer); return; }   // it stops and looks
        if (this._fleeing) {
            this.setMoveSpeed(sp.flee);
            const d = this.bestEscape(dx, dy);
            if (d) roamingStep(this, d);
            return;
        }
        if (this.lure()) return;
        this.wander();
    };

    // Snares (Farming.js, buildings with `lure`): only bait draws a rabbit - a calm one smells it from lure.radius tiles and hops up
    // to it (a hop, a pause, like it grazes), sniffs at it a moment, and then it is either caught (the snare holds it until the player
    // collects it) or takes fright - maybe with the bait - and runs off, keeping away from snares for a while. A snare without bait,
    // or one that holds a rabbit already, draws none. Only rabbits: a deer is too big for it.
    const LURE = { kinds: ["rabbit"], sniff: 50, cooldown: 1500, hop: [15, 60], eatBait: 0.5 };
    function nearestSnare(animal) {
        if (!window.Farming || !Farming.snares) return null;
        let best = null;
        for (const b of Farming.snares()) {
            if (Farming.snareSprung(b) || !Farming.snareBait(b)) continue;
            const lure = Farming.BUILDINGS[b.type].lure;
            for (const c of Farming.cellsOfGeo(Farming.geoOf(b), b.x, b.y)) {
                const dist = Math.hypot(c.x - animal._x, c.y - animal._y);
                if (dist <= lure.radius * (1 + perk("snare.lure")) && (!best || dist < best.dist)) best = { b, cell: c, dist, lure };   // (Sidlarz)
            }
        }
        return best;
    }
    Game_Animal.prototype.lure = function() {
        if (!LURE.kinds.includes(this._kind) || this._lureCd > 0) return false;
        if (this._sniff > 0) {
            if (--this._sniff === 0) this.tryTrap(this._lureSnare);
            return true;
        }
        const s = nearestSnare(this);
        if (!s) return false;
        if (this._wait > 0) { this._wait--; return true; }   // it nibbles at the grass between the hops
        this.setMoveSpeed(SPECIES[this._kind].speed);
        if (s.dist <= 1.5) {   // beside it: it sniffs
            this._lureSnare = s.b;
            this._sniff = LURE.sniff;
            this.turnTowardPos(s.cell.x, s.cell.y);
            return true;
        }
        // a hop towards it (of the 8 ways, the passable one that ends nearest)
        let best = 0, bestDist = s.dist - 0.01;
        for (const d of [2, 4, 6, 8, 1, 3, 7, 9]) {
            if (!roamingCanStep(this, this._x, this._y, d)) continue;
            const [sx, sy] = STEP[d], nd = Math.hypot(s.cell.x - (this._x + sx), s.cell.y - (this._y + sy));
            if (nd < bestDist) { bestDist = nd; best = d; }
        }
        if (!best) return false;   // nothing gets it nearer: it just wanders
        roamingStep(this, best);
        this._wait = LURE.hop[0] + Math.floor(Math.random() * (LURE.hop[1] - LURE.hop[0]));
        return true;
    };
    Game_Animal.prototype.turnTowardPos = function(x, y) {
        const dx = x - this._x, dy = y - this._y;
        if (Math.abs(dx) >= Math.abs(dy)) this.setDirection(dx < 0 ? 4 : 6); else this.setDirection(dy < 0 ? 8 : 2);
    };
    Game_Animal.prototype.tryTrap = function(b) {
        this._lureSnare = null;
        if (!b || this._dead || !window.Farming || Farming.snareSprung(b) || !Farming.snareBait(b) || !Farming.snares().includes(b)) { this._lureCd = LURE.cooldown; return; }
        const lure = Farming.BUILDINGS[b.type].lure;
        if (Math.random() < Math.min(0.95, lure.chance * (1 + perk("snare.lure")))) { trapped(this, b); return; }
        if (Math.random() < LURE.eatBait) Farming.snareEatBait(b);   // it got away with the bait
        this._alarm = 90;   // off it runs
        this._lureCd = LURE.cooldown;
    };
    // caught in a snare: gone from the map (it counts as today's catch, like one shot), the snare holds it; heard when near
    function trapped(animal, b) {
        Farming.snareCatch(b);
        tally(animal);
        removeAnimal(animal);
        const dist = Math.hypot(animal._x - $gamePlayer.x, animal._y - $gamePlayer.y);
        if (dist > 14) return;
        const pan = Math.max(-80, Math.min(80, Math.round((animal._x - $gamePlayer.x) * 8))), vol = 1 - dist / 20;
        AudioManager.playSe({ name: "Close1", volume: Math.round(85 * vol), pitch: 140, pan });
        AudioManager.playSe({ name: "Damage1", volume: Math.round(35 * vol), pitch: 150, pan });
        popup($dataItems[ITEM.carcass].iconIndex, SPECIES[animal.kind()].name + " wpadł w pułapkę!", "#cfe6a8");
    }
    // While the player does not see it - on another map, or asleep (the clock jumps) - a baited snare may catch a rabbit all the same:
    // every hour the rabbits of this map are about (SPECIES.rabbit.hours) while the bait lies there gives lure.awayChance. b.watch:
    // the clock hour up to which the snare has been looked after (by the live rabbits while the player is on the map, or by this).
    function rabbitHours(from, to) {
        let n = 0;
        for (let t = from; t < to; t += 0.25) { const h = ((t % 24) + 24) % 24; if (SPECIES.rabbit.hours.some(([a, b]) => h >= a && h < b)) n += 0.25; }
        return n;
    }
    function snareUnseen() {
        if (!window.Farming || !Farming.snares || !Farming.clockHours) return;
        const now = Farming.clockHours(), rabbits = (mapTargets().rabbit || 0) > 0;
        for (const b of Farming.snares()) {
            const from = b.watch === undefined ? now : b.watch;
            b.watch = now;
            const bait = b.bait, lure = Farming.BUILDINGS[b.type].lure;
            if (now - from < 0.25 || !bait || !rabbits || Farming.snareSprung(b)) continue;
            const hours = rabbitHours(Math.max(from, bait.at !== undefined ? bait.at : bait.until - lure.baitHours), Math.min(now, bait.until));
            if (hours > 0 && Math.random() < 1 - Math.pow(1 - Math.min(0.9, lure.awayChance * (1 + perk("snare.lure"))), hours)) {
                Farming.snareCatch(b);
                hunt().kills.rabbit = (hunt().kills.rabbit || 0) + 1;
            } else Farming.snareBait(b);   // (gone off meanwhile: it is cleared)
        }
    }
    // the passable direction (of 8, like the player walks) that ends farthest from the player, looking two steps ahead (the shared
    // scan, tuned for a wild animal's full bolt: no floor on the score, a bit of jitter, and a look at the next step)
    Game_Animal.prototype.bestEscape = function(dx, dy) {
        return roamingFleeDirection(this, dx, dy, { jitter: 0.6, lookahead: 0.8, deadEnd: 2, diagonal: true });
    };
    // a quiet wander: now and then one step somewhere, straight or on a slant
    Game_Animal.prototype.wander = function() {
        this.setMoveSpeed(SPECIES[this._kind].speed);
        if (this._wait > 0) { this._wait--; return; }
        const dirs = [2, 4, 6, 8, 1, 3, 7, 9].filter(d => roamingCanStep(this, this._x, this._y, d));
        if (dirs.length > 0 && Math.random() < 0.7) roamingStep(this, dirs[Math.floor(Math.random() * dirs.length)]);
        this._wait = 50 + Math.floor(Math.random() * 150);
    };
    // one step straight at the player, on a slant when he is off to the side (the boar's charge)
    Game_Animal.prototype.stepToward = function(target) {
        const sx = Math.sign(target.x - this._x), sy = Math.sign(target.y - this._y);
        const d = { "-1,1": 1, "1,1": 3, "-1,-1": 7, "1,-1": 9 }[sx + "," + sy];
        if (d && roamingCanStep(this, this._x, this._y, d)) { roamingStep(this, d); return; }
        this.moveTowardCharacter(target);
    };

    // ------------------------------------------------------------------
    // The boar: it does not run from the player. Once it has noticed him (or a shot flies near it) it stands, snorts and shows
    // "!" (warn), then charges at him, faster than he runs; BOAR.commit tiles away it locks its line and runs straight on. When
    // it reaches him it knocks him about (gore) and backs off for a while (retreat), then it may come again. When it misses (a
    // roll, a step aside) it runs BOAR.overshoot tiles past him (overshoot), stops and stands panting (recover), then turns and
    // warns again. A spear jab stops a charge: it reels back (stagger). Badly hurt it runs away for good (flee).
    // ------------------------------------------------------------------
    Game_Animal.prototype.setMode = function(mode, frames) {
        const sp = SPECIES[this._kind], running = mode === "charge" || mode === "retreat" || mode === "flee" || mode === "overshoot" || mode === "lunge";
        this._mode = mode;
        this._modeT = frames || 0;
        this._fleeing = mode === "flee";
        this._commit = null;
        const sheet = mode === "stalk" && sp.stalk ? sp.stalk : mode === "windup" && sp.bark ? sp.bark : running && sp.run ? sp.run : sp.sheet;
        if (this.characterName() !== sheet) this.setImage(sheet, 0);
        this.setStepAnime(mode === "windup");   // (the bark plays standing still)
        this.setMoveSpeed(mode === "charge" || mode === "overshoot" ? sp.charge : running ? sp.flee : sp.speed);
    };
    // its balance is back after reeling: a boar snorts and comes again, a wolf goes back to the ring
    Game_Animal.prototype.afterStun = function() {
        this._poise = this._maxPoise;
        if (SPECIES[this._kind].pack) this.setMode("stalk");
        else if (SPECIES[this._kind].aggressive && this._mode !== "flee") this.setMode("warn", 20);
    };
    // the hero parried its attack (Combat.js): it reels a long moment and is thrown back
    Game_Animal.prototype.onParried = function() {
        this._stun = Math.max(this._stun, (SPECIES[this._kind].stun || 50) + 40);
        this._poise = 0;
        knockBack(this);
        if (this._pack && this._pack.attacker === this) { this._pack.attacker = null; this._pack.nextAttack = 90; }
        if (this._mode === "charge" || this._mode === "lunge" || this._mode === "windup") this.setMode(SPECIES[this._kind].pack ? "stalk" : "warn", 0);
    };
    // a hurt deer or rabbit limps: slower, the more of its life is gone (user) - a bit at first (0.25 of a speed step, ~20%),
    // about a third slower near the end; the boar and the wolves fight on at full speed
    const LIMP = { base: 0.25, more: 0.5 };
    Game_Animal.prototype.limp = function() {
        if (SPECIES[this._kind].aggressive || !(this._maxHp > 0) || !(this._hp < this._maxHp) || this._hp <= 0) return 0;
        return LIMP.base + LIMP.more * (1 - this._hp / this._maxHp);
    };
    Game_Animal.prototype.realMoveSpeed = function() {
        return Game_Character.prototype.realMoveSpeed.call(this) - this.limp();   // (the legs move slower too: the animation follows the speed)
    };
    Game_Animal.prototype.playerDistance = function() {
        return Math.hypot(this.centerX() - ($gamePlayer._realX + 0.5), this.centerY() - ($gamePlayer._realY + 0.5));
    };
    Game_Animal.prototype.updateBoar = function() {
        if (this._modeT > 0) this._modeT--;
        const dist = this.playerDistance();
        if (this._mode === "charge" && dist < BOAR.contact && !this.isJumping()) { gore(this); return; }
        if (this.isMoving() || this.isJumping()) return;
        this.thinkBoar(dist);
    };
    Game_Animal.prototype.thinkBoar = function(dist) {
        const sp = SPECIES[this._kind], dx = this._realX - $gamePlayer._realX, dy = this._realY - $gamePlayer._realY;
        if (this._hp <= this._maxHp * 0.15 && this._mode !== "flee") this.setMode("flee");
        if (this._mode === "overshoot") {   // it missed him: it runs on along its line, well past him, then stops
            const [cx, cy] = this._line || DIR_VEC[this.direction()], len = Math.hypot(cx, cy) || 1;
            const past = -(($gamePlayer._realX - this._realX) * cx + ($gamePlayer._realY - this._realY) * cy) / len;
            const d = VEC_DIR[cx + "," + cy];
            if (this._modeT <= 0 || past >= BOAR.overshoot || !d || !roamingCanStep(this, this._x, this._y, d)) { this.startRecover(); return; }
            roamingStep(this, d);
            return;
        }
        if (this._mode === "recover") {   // it stands panting: the moment to hit it; halfway it turns to look for him
            if (this._modeT === Math.floor(BOAR.recover / 2)) this.turnTowardCharacter($gamePlayer);
            if (this._modeT <= 0) { this.setMode("warn", BOAR.warn); this.turnTowardCharacter($gamePlayer); snort(this, 95); }
            return;
        }
        if (this._mode === "flee" || this._mode === "retreat") {
            if (this._mode === "retreat" && this._modeT <= 0) { this.setMode("roam"); this._aware = 0.55; return; }   // still wary: it notices him again soon
            const d = this.bestEscape(dx, dy);
            if (d) roamingStep(this, d);
            return;
        }
        if (this._mode === "stagger") {
            if (this._modeT <= 0) this.setMode("warn", 20);
            return;
        }
        if (this._mode === "warn") {
            this.turnTowardCharacter($gamePlayer);
            this._aware = 1;
            if (dist > sp.sight * 1.6) { this.setMode("roam"); this._aware = 0.5; return; }   // he got away: it calms down
            if (this._modeT <= 0) { this.setMode("charge", BOAR.charge); snort(this, 70); }
            return;
        }
        if (this._mode === "charge") {
            if (this._modeT <= 0 || dist > sp.sight * 2) { this.setMode("retreat", BOAR.retreat[0] + Math.floor(Math.random() * (BOAR.retreat[1] - BOAR.retreat[0]))); return; }
            // the last BOAR.commit tiles it runs straight on, no more turning after him (a roll to the side lets it go past)
            if (!this._commit && dist < BOAR.commit) {
                const dx = $gamePlayer._realX - this._x, dy = $gamePlayer._realY - this._y, k = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
                const vx = Math.round(Math.cos(k * Math.PI / 4)), vy = Math.round(Math.sin(k * Math.PI / 4));
                if (Math.abs(dx * vy - dy * vx) / Math.hypot(vx, vy) < 0.6 || dist < 2.6) {   // (he is on one of its eight lines)
                    this._commit = [vx, vy];
                    this.setMoveSpeed(sp.charge + BOAR.rush);   // the last stretch: flat out
                }
            }
            if (this._commit) {
                const [cx, cy] = this._commit, ahead = ($gamePlayer._realX - this._realX) * cx + ($gamePlayer._realY - this._realY) * cy;
                const d = VEC_DIR[cx + "," + cy];
                if (!d || !roamingCanStep(this, this._x, this._y, d)) { this.startRecover(); return; }   // it ran into something
                if (ahead < -0.6) { this.startOvershoot(); return; }   // gone past him
                roamingStep(this, d);
                return;
            }
            this.stepToward($gamePlayer);
            if (!this.isMovementSucceeded()) this.turnTowardCharacter($gamePlayer);
            return;
        }
        // roaming
        if (this._aware >= 1 || (this._alarm > 0 && dist < sp.sight * 1.3)) {
            this.setMode("warn", BOAR.warn);
            this.turnTowardCharacter($gamePlayer);
            snort(this, 95);
            return;
        }
        if (this._aware >= 0.3) { this.turnTowardCharacter($gamePlayer); return; }   // it stops and looks
        this.wander();
    };
    const VEC_DIR = { "0,1": 2, "-1,0": 4, "1,0": 6, "0,-1": 8, "-1,1": 1, "1,1": 3, "-1,-1": 7, "1,-1": 9 };
    const DIR_VEC = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
    // missed: it keeps its line (the committed one, else the way it faces) and runs on past him
    Game_Animal.prototype.startOvershoot = function() {
        const line = this._commit || DIR_VEC[this.direction()];
        this.setMode("overshoot", 90);
        this._line = line;
        this.setMoveSpeed(SPECIES[this._kind].charge + BOAR.rush);   // (it cannot stop at once)
    };
    // flat out (Combat.js draws the blur of it): a boar on its line or running past him, a wolf in its leap
    Game_Animal.prototype.isRushing = function() {
        return (this._mode === "charge" && !!this._commit) || this._mode === "overshoot" || (this._mode === "lunge" && this.isJumping());
    };
    // it stops (a skid of dust) and stands panting
    Game_Animal.prototype.startRecover = function() {
        this.setMode("recover", BOAR.recover);
        if (window.Combat && Combat.sparksAt) Combat.sparksAt(this.centerX(), this.centerY() + 0.3, "#b79a6a", 10);
        snort(this, 60);
    };
    function snort(animal, pitch) {
        const pan = Math.max(-80, Math.min(80, Math.round((animal.centerX() - ($gamePlayer._realX + 0.5)) * 12)));
        AudioManager.playSe({ name: "Monster3", volume: 75, pitch, pan });
    }
    // the boar reaches the player: strength lost and a wound (Survival.js), the screen shakes and flashes red, then it backs off
    function gore(animal) {
        const sp = SPECIES[animal.kind()];
        if (window.Combat && Combat.hitPlayer) {   // the hero's defence decides (a roll, a guard, a parry)
            const res = Combat.hitPlayer({ damage: atkOf(animal), poise: 75, from: { x: animal.centerX(), y: animal.centerY() }, attacker: animal, name: "dzik", wound: 0.7, knock: 0.9 });
            if (res === "dodged") { animal.startOvershoot(); return; }
            if (res === "parried") return;   // (it reels: onParried)
            animal.setMode("retreat", BOAR.retreat[0] + Math.floor(Math.random() * (BOAR.retreat[1] - BOAR.retreat[0])));
            return;
        }
        if (typeof $gameSystem.injure === "function") $gameSystem.injure(sp.hurt);
        else $gameSystem.changeStamina(-sp.hurt);
        if (typeof $gameSystem.hurt === "function") $gameSystem.hurt(sp.harm);   // health (Survival.js); at 0 the game is over
        AudioManager.playSe({ name: "Damage3", volume: 90, pitch: 90, pan: 0 });
        $gameScreen.startShake(5, 8, 16);
        $gameScreen.startFlash([255, 40, 30, 120], 14);
        if (!$gamePlayer.isJumping() && !($gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging())) $gamePlayer.jump(0, 0);
        const bandage = $dataItems[ITEM.bandage], hasBandage = !!bandage && $gameParty.numItems(bandage) > 0;
        popup(bandage ? bandage.iconIndex : 0, "Dzik cię poturbował! Jesteś ranny - " + (hasBandage ? "użyj opatrunku (menu Przedmioty)" : "opatrunek z krwawnika zatamuje krew"), "#ff8f7f");
        animal.setMode("retreat", BOAR.retreat[0] + Math.floor(Math.random() * (BOAR.retreat[1] - BOAR.retreat[0])));
    }
    // a hit that did not kill it: a spear jab throws it back (it comes again after a moment), anything else makes it charge at once
    function enrage(animal, how) {
        if (SPECIES[animal.kind()].pack) { wolfEngage(animal); return; }
        if (animal._hp <= animal._maxHp * 0.15) { animal.setMode("flee"); return; }
        if (how === "melee") {   // (Combat.js: its balance decides whether it reels; otherwise it turns on the hero quickly)
            if (animal._stun <= 0 && (animal._mode === "roam" || animal._mode === "warn")) { animal.setMode("warn", 16); animal.turnTowardCharacter($gamePlayer); snort(animal, 80); }
            return;
        }
        if (how === "spear") {
            const ax = animal._x - $gamePlayer.x, ay = animal._y - $gamePlayer.y;
            const bx = Math.abs(ax) >= Math.abs(ay) ? Math.sign(ax) : 0, by = Math.abs(ax) >= Math.abs(ay) ? 0 : Math.sign(ay);
            const d = bx > 0 ? 6 : bx < 0 ? 4 : by > 0 ? 2 : 8;
            if (animal.canPass(animal._x, animal._y, d)) animal.jump(bx, by); else animal.jump(0, 0);
            animal.setMode("stagger", BOAR.stagger);
        } else if (animal._mode !== "charge") {
            animal.turnTowardCharacter($gamePlayer);
            animal.setMode("charge", BOAR.charge);
            snort(animal, 70);
        }
    }

    // a hit throws it one tile away from the hero (a jump), when there is room
    function knockBack(animal) {
        const ax = animal._x - $gamePlayer.x, ay = animal._y - $gamePlayer.y;
        const bx = Math.abs(ax) >= Math.abs(ay) ? Math.sign(ax) : 0, by = Math.abs(ax) >= Math.abs(ay) ? 0 : Math.sign(ay);
        const d = bx > 0 ? 6 : bx < 0 ? 4 : by > 0 ? 2 : 8;
        if (animal.isJumping()) return;
        if ((bx || by) && animal.canPass(animal._x, animal._y, d)) animal.jump(bx, by); else animal.jump(0, 0);
    }
    // its balance is gone: it reels (does nothing) for a while; an attack it was about to make is off
    function stagger(animal, knock) {
        animal._stun = SPECIES[animal.kind()].stun || 50;
        animal._poise = 0;
        if (animal._pack && animal._pack.attacker === animal) { animal._pack.attacker = null; animal._pack.nextAttack = 60; }
        if (animal._mode === "windup" || animal._mode === "lunge" || animal._mode === "charge") animal.setMode(SPECIES[animal.kind()].pack ? "stalk" : "warn", 0);
        if (knock) knockBack(animal);
    }

    // ------------------------------------------------------------------
    // Wolves: a pack hunts at night. Once it has noticed the hero (or he comes within WOLF.engage tiles) it howls and spreads round
    // him on a ring (stalk); one at a time comes in: it crouches and barks (windup, a "!"), leaps at him (lunge: a bite if he is
    // still there) and stands a moment after the leap (recover) - the moment to hit it. Hurt badly, or with the leader dead, they run.
    // ------------------------------------------------------------------
    const WOLF = { ring: 3.2, windup: 38, recover: 44, gap: [60, 140], bite: 0.95, biteFrom: 6, lunge: 3, near: 1.6, engage: 6, lose: 16, flee: 0.25 };   // biteFrom: no bite before that frame of the leap; near: too close to start one
    function makePack(members) {
        const pack = { members, leader: members[0], attacker: null, nextAttack: 90, engaged: false, angle: Math.random() * Math.PI * 2, howled: false, broken: false };
        for (const w of members) { w._pack = pack; w.setMode("roam"); }
        members[0]._leader = true;
        members[0]._maxHp = Math.round(members[0]._maxHp * 1.2);
        members[0]._hp = members[0]._maxHp;
        packs.push(pack);
        return pack;
    }
    const liveMembers = pack => pack.members.filter(m => !m._dead);
    function wolfEngage(wolf) {
        const pack = wolf._pack, members = pack ? liveMembers(pack) : [wolf];
        if (pack) {
            if (!pack.engaged) pack.nextAttack = 70;
            pack.engaged = true;
            if (!pack.howled) { pack.howled = true; AudioManager.playSe({ name: "Wolf", volume: 80, pitch: 95 + Math.floor(Math.random() * 15), pan: 0 }); }
        }
        for (const m of members) {
            m._engaged = true;
            if (m._mode === "roam") m.setMode("stalk");
        }
    }
    function disengage(pack) {
        pack.engaged = false;
        pack.attacker = null;
        for (const m of liveMembers(pack)) { m._engaged = false; m.setMode("roam"); m._aware = 0.4; }
    }
    function growl(wolf) {
        const pan = Math.max(-80, Math.min(80, Math.round((wolf.centerX() - ($gamePlayer._realX + 0.5)) * 12)));
        AudioManager.playSe({ name: "Growl", volume: 80, pitch: 100 + Math.floor(Math.random() * 20), pan });
    }
    function bite(wolf) {
        AudioManager.playSe({ name: "Bite", volume: 90, pitch: 100, pan: 0 });
        if (window.Combat && Combat.hitPlayer) {
            Combat.hitPlayer({ damage: atkOf(wolf), poise: 30, from: { x: wolf.centerX(), y: wolf.centerY() }, attacker: wolf, name: "wilk", wound: 0.3, knock: 0.6 });
            return;
        }
        if (typeof $gameSystem.hurt === "function") $gameSystem.hurt(0.12);
        $gameScreen.startFlash([255, 40, 30, 110], 12);
    }
    Game_Animal.prototype.updateWolf = function() {
        const pack = this._pack;
        // the pack's clock (the pause between two attacks, the turning ring) runs on its first live member
        if (pack && liveMembers(pack)[0] === this) { if (pack.nextAttack > 0) pack.nextAttack--; pack.angle += 0.004; }
        if (this._modeT > 0) this._modeT--;
        const dist = this.playerDistance();
        if (this._mode === "lunge") {
            if (this.isJumping()) {
                this._lungeT = (this._lungeT || 0) + 1;
                if (!this._bitten && this._lungeT >= WOLF.biteFrom && dist < WOLF.bite) { this._bitten = true; bite(this); }
                return;
            }
            this.setMode("recover", WOLF.recover);
            if (pack && pack.attacker === this) { pack.attacker = null; pack.nextAttack = WOLF.gap[0] + Math.floor(Math.random() * (WOLF.gap[1] - WOLF.gap[0])); }
            return;
        }
        if (this.isMoving() || this.isJumping()) return;
        this.thinkWolf(dist);
    };
    Game_Animal.prototype.thinkWolf = function(dist) {
        const pack = this._pack, dx = this._realX - $gamePlayer._realX, dy = this._realY - $gamePlayer._realY;
        if (this._mode === "flee") {
            if (dist > WOLF.lose + 2) { removeAnimal(this); return; }   // gone into the dark
            const d = this.bestEscape(dx, dy);
            if (d) roamingStep(this, d);
            return;
        }
        if (this._hp <= this._maxHp * WOLF.flee || (pack && pack.broken)) {
            if (pack && pack.attacker === this) pack.attacker = null;
            this.setMode("flee");
            return;
        }
        if (this._mode === "windup") {
            this.turnTowardCharacter($gamePlayer);
            if (this._modeT <= 0) this.leap();
            return;
        }
        if (this._mode === "recover") {
            if (this._modeT <= 0) this.setMode("stalk");
            return;
        }
        const engaged = pack ? pack.engaged : this._engaged;
        if (!engaged) {
            if (this._aware >= 1 || this._alarm > 0 || this._wounded || dist < WOLF.engage) { wolfEngage(this); return; }
            if (pack && pack.leader !== this && !pack.leader._dead) {   // it keeps near the leader
                const L = pack.leader;
                if (Math.hypot(L._x - this._x, L._y - this._y) > 2.2) { this.setMoveSpeed(SPECIES.wolf.speed); this.stepToward(L); return; }
            }
            this.wander();
            return;
        }
        if (dist > WOLF.lose) { if (pack) disengage(pack); else { this._engaged = false; this.setMode("roam"); } return; }
        if (this._mode !== "stalk") this.setMode("stalk");
        // its turn: the stalking wolf nearest to the hero goes, when the pack's pause is over
        if (pack && !pack.attacker && pack.nextAttack <= 0 && dist < WOLF.ring + 1.8 && dist > WOLF.near) {
            const next = liveMembers(pack).filter(m => m._mode === "stalk" && m._stun <= 0 && m.playerDistance() > WOLF.near).sort((a, b) => a.playerDistance() - b.playerDistance())[0];
            if (next === this) {
                pack.attacker = this;
                this.setMode("windup", WOLF.windup);
                this.turnTowardCharacter($gamePlayer);
                growl(this);
                return;
            }
        }
        // its place on the ring round the hero (the ring turns slowly)
        const live = pack ? liveMembers(pack) : [this], idx = Math.max(0, live.indexOf(this));
        const ang = (pack ? pack.angle : 0) + idx * Math.PI * 2 / live.length;
        const tx = $gamePlayer._realX + Math.cos(ang) * WOLF.ring, ty = $gamePlayer._realY + Math.sin(ang) * WOLF.ring * 0.8;
        if (Math.hypot(tx - this._realX, ty - this._realY) > 0.9) this.stepToward({ x: Math.round(tx), y: Math.round(ty) });
        else this.turnTowardCharacter($gamePlayer);
    };
    // the leap: at the hero's tile (at most WOLF.lunge tiles), shorter when it could not land there
    Game_Animal.prototype.leap = function() {
        let dx = Math.round($gamePlayer._realX - this._x), dy = Math.round($gamePlayer._realY - this._y);
        const len = Math.max(Math.abs(dx), Math.abs(dy));
        if (len > WOLF.lunge) { dx = Math.round(dx * WOLF.lunge / len); dy = Math.round(dy * WOLF.lunge / len); }
        let lx = 0, ly = 0;
        for (const k of [1, 0.75, 0.5, 0.25]) {
            const x = this._x + Math.round(dx * k), y = this._y + Math.round(dy * k);
            if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !(window.Farming && Farming.buildingAt(x, y))) { lx = Math.round(dx * k); ly = Math.round(dy * k); break; }
        }
        this.turnTowardCharacter($gamePlayer);
        this.setMode("lunge");
        this._bitten = false;
        this._lungeT = 0;
        this.jump(lx, ly);
        AudioManager.playSe({ name: "Wind1", volume: 55, pitch: 140, pan: 0 });
    };

    // ------------------------------------------------------------------
    // Spawning
    // ------------------------------------------------------------------
    const spriteset = roamingSpriteset;
    const addSprite = roamingAddSprite;
    function removeAnimal(animal) {
        animal._dead = true;
        roamingDropSprite(animal);
        animals = animals.filter(a => a !== animal);
    }
    function spawn(kind, x, y) {
        if (!SPECIES[kind]) return null;
        const a = new Game_Animal(kind, x, y);
        animals.push(a);
        addSprite(a);
        return a;
    }
    // a pack of `n` wolves round (x, y) (where there is room); returns the pack
    function spawnPack(x, y, n) {
        const members = [];
        const spots = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [-2, 0], [0, 2]];
        for (const [ox, oy] of spots) {
            if (members.length >= n) break;
            const sx = x + ox, sy = y + oy;
            if (!$gameMap.isValid(sx, sy) || !$gameMap.checkPassage(sx, sy, 0x0f) || animals.some(a => a._x === sx && a._y === sy)) continue;
            if (window.Farming && (Farming.buildingAt(sx, sy) || Farming.hasObjectTile(sx, sy))) continue;
            members.push(spawn("wolf", sx, sy));
        }
        return members.length ? makePack(members) : null;
    }
    function countOf(kind) {
        return animals.filter(a => a.kind() === kind).length;
    }
    // out of its hours an animal goes home - but not one called up with F9 (Debug.js), nor a boar or a wolf still in a fight
    // (it goes once it has calmed down), so nothing vanishes in front of the hero
    const staysOut = a => a._summoned || a._engaged || (SPECIES[a.kind()].aggressive && a._mode !== "roam" && a._mode !== "flee");
    // fills the map up to its targets (minus what was shot today) and sends the animals that are not about home
    function populate() {
        if (!ENABLED || !$gameMap || !$dataMap || !spriteset() || !window.Farming) return;
        const mapId = $gameMap.mapId(), targets = mapTargets();
        for (const kind of Object.keys(SPECIES)) {
            if (!activeNow(kind)) {
                for (const a of animals.filter(a => a.kind() === kind && !staysOut(a))) removeAnimal(a);   // asleep somewhere
                continue;
            }
            const want = Math.max(0, (targets[kind] || 0) - killedToday(mapId, kind));
            let have = countOf(kind);
            if (have >= want) continue;
            const spots = spotsOfMap();
            if (!spots || spots.length === 0) return;
            for (let tries = 0; tries < 80 && have < want; tries++) {
                const s = spots[Math.floor(Math.random() * spots.length)];
                if (Math.hypot(s.x - $gamePlayer.x, s.y - $gamePlayer.y) < (SPECIES[kind].pack ? 12 : 8)) continue;
                if (animals.some(a => a._x === s.x && a._y === s.y)) continue;
                if (SPECIES[kind].pack) {   // a whole pack at once
                    const [lo, hi] = SPECIES[kind].pack, n = Math.min(want - have, lo + Math.floor(Math.random() * (hi - lo + 1)));
                    const pack = spawnPack(s.x, s.y, Math.max(1, n));
                    have += pack ? pack.members.length : 0;
                    continue;
                }
                spawn(kind, s.x, s.y);
                have++;
            }
        }
    }

    // ------------------------------------------------------------------
    // Shooting
    // ------------------------------------------------------------------
    function popup(icon, text, color) {
        if (window.Survival && Survival.feedback) Survival.feedback(icon, text, color);
        else $gameTemp.pushLootPopup(icon, text, color);
    }
    const countItem = id => $gameParty.numItems($dataItems[id]);
    // the bow when there are arrows, else the sling when there are stones; null with the reason (a popup) otherwise
    function pickWeapon() {
        const bow = countItem(ITEM.bow) > 0, sling = countItem(ITEM.sling) > 0;
        if (bow && countItem(ITEM.arrows) > 0) return "bow";
        if (sling && countItem(ITEM.stone) > 0) return "sling";
        if (bow) popup($dataItems[ITEM.arrows].iconIndex, "Potrzebujesz strzał", "#ff9f8f");
        else if (sling) popup($dataItems[ITEM.stone].iconIndex, "Potrzebujesz kamieni", "#ff9f8f");
        else popup($dataItems[ITEM.sling].iconIndex, "Potrzebujesz procy, łuku albo oszczepu", "#ff9f8f");
        return null;
    }
    const hasRanged = () => (countItem(ITEM.bow) > 0 && countItem(ITEM.arrows) > 0) || (countItem(ITEM.sling) > 0 && countItem(ITEM.stone) > 0);
    // unit vector of a shot: the two held arrows (a diagonal) or else the way the player faces
    function aimVector() {
        const d8 = Input.dir8;
        const diag = { 1: [-1, 1], 3: [1, 1], 7: [-1, -1], 9: [1, -1] }[d8];
        if (diag) { const n = Math.SQRT2; return [diag[0] / n, diag[1] / n]; }
        return { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[$gamePlayer.direction()] || [0, 1];
    }
    function canShoot() {
        return $gamePlayer.canMove() && !$gameMessage.isBusy() && !$gameMap.isEventRunning() && !$gameTemp._farmMenuOpen && !$gameTemp._buildMode && !SceneManager.isSceneChanging();
    }

    // ------------------------------------------------------------------
    // What can be hit: the animals here and whatever other plugins add (Birds.js: the birds on the ground):
    // { x, y (tiles, centre), radius, ref, hit(damage) }. Noise listeners hear every shot: fn(x, y, radius).
    // ------------------------------------------------------------------
    const targetSources = [], noiseListeners = [];
    function allTargets() {
        const out = animals.filter(a => !a._dead).map(a => ({ x: a.centerX(), y: a.centerY(), radius: SPECIES[a.kind()].radius, ref: a, hit: (d, how, extra) => hit(a, d, how, extra) }));
        for (const src of targetSources) out.push(...src());
        return out;
    }
    function makeNoise(x, y, radius) {
        for (const a of animals) if (Math.hypot(a.centerX() - x, a.centerY() - y) <= radius) a._alarm = 240;
        for (const fn of noiseListeners) fn(x, y, radius);
    }

    // stamina, the ammunition and the wear of the weapon, paid when the shot leaves; false (with a popup) when too tired
    function payShot(def) {
        if (!$gameSystem.trySpendStamina(def.stamina)) { popup(82, "Jesteś zbyt zmęczony", "#ff9f8f"); return false; }
        if (!perkRoll("ammo.save")) $gameParty.loseItem($dataItems[def.ammo], 1, false);   // (Zbieracz pocisków)
        if (window.Durability) Durability.use(def.item);
        cooldown = Math.round(def.cooldown * (1 - Math.min(0.6, perk("shot.cooldown"))));   // (Szybki strzał)
        $gameTemp._farmLock = Math.max($gameTemp._farmLock || 0, 10);
        return true;
    }
    function faceVector(dx, dy) {
        if (Math.abs(dx) >= Math.abs(dy)) $gamePlayer.setDirection(dx < 0 ? 4 : 6); else $gamePlayer.setDirection(dy < 0 ? 8 : 2);
    }
    // the stone / the arrow leaves (the direction is a unit vector)
    function launch(w, dx, dy) {
        const def = WEAPONS[w];
        AudioManager.playSe({ name: def.se, volume: 85, pitch: def.pitch, pan: 0 });
        const sx = $gamePlayer._realX + 0.5, sy = $gamePlayer._realY + 0.3;
        projectiles.push(makeProjectile(w, sx, sy, dx, dy));
        makeNoise(sx, sy, NOISE_RADIUS * (knowsSkill("r_silent") ? 0.5 : 1));   // (Cichy strzał)
    }
    // A straight shot, no aiming (tests, events). Returns true when a projectile left. dir: [dx, dy] (defaults to the facing),
    // which: "sling" | "bow" (defaults to the best weapon in the bag)
    function shoot(dir, which) {
        if (!ENABLED || cooldown > 0) return false;
        const w = which || pickWeapon();
        if (!w) return false;
        if (!payShot(WEAPONS[w])) return false;
        const [dx, dy] = dir || aimVector();
        faceVector(dx, dy);
        if (animate && typeof $gamePlayer.startToolSwing === "function" && $gamePlayer.startToolSwing(SHOT_SWING[w], () => launch(w, dx, dy))) {
            cooldown = Math.max(cooldown, 60);
            return true;
        }
        launch(w, dx, dy);
        return true;
    }

    // ------------------------------------------------------------------
    // Aiming: the shoot key held down. The sling whirls (the bow is drawn) and a circle sits on the nearest target in front of the player;
    // it shrinks while he holds still - a small bird needs a small circle. Let the key go: the shot flies at a random point of the
    // circle. Tired, it never gets small; sneaking, it shrinks faster; a drawn bow starts to tremble after a while. The
    // direction keys turn him to another target; cancel lowers the weapon without a shot.
    // ------------------------------------------------------------------
    let aim = null;   // { weapon, t, ref, point: {x, y}, radius, manual }
    const facingVector = () => ({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[$gamePlayer.direction()] || [0, 1]);
    // targets in range within 60 degrees of where he faces, the best first (straight ahead, then near)
    function aimCandidates(def) {
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.5, [fx, fy] = facingVector();
        return allTargets().map(t => {
            const dx = t.x - px, dy = t.y - py, d = Math.hypot(dx, dy);
            return { t, d, cos: d > 0 ? (dx * fx + dy * fy) / d : 1 };
        }).filter(c => c.d <= def.range && c.d > 0.3 && c.cos > 0.5)
            .sort((a, b) => (1 - a.cos) * 6 + a.d - ((1 - b.cos) * 6 + b.d)).map(c => c.t);
    }
    function startAim() {
        if (!ENABLED || cooldown > 0 || aim) return false;
        const w = pickWeapon();
        if (!w) return false;
        const def = WEAPONS[w];
        if ($gameSystem.stamina() < def.stamina) { popup(82, "Jesteś zbyt zmęczony", "#ff9f8f"); return false; }
        aim = { weapon: w, t: 0, ref: null, point: null, radius: def.spread, manual: false };
        updateAim();
        // (the circle keeps shrinking from the press on, the whirl included - the map scene calls updateAim every frame)
        if (animate && typeof $gamePlayer.startToolSwing === "function" && $gamePlayer.startToolSwing(SHOT_SWING[w], fireAimed, null, {
            holdAt: def.holdAt, holdWhile: () => Input.isPressed("shoot"), keepOnMove: true, wobble: def.wobble, still: !def.wobble,
            onHoldEnd: cancelled => { if (cancelled) endAim(); }
        })) return true;
        aim.manual = true;   // no shooting animation (tests): the map scene aims until the key is let go and the whirl would be over
        return true;
    }
    function updateAim() {
        if (!aim) return;
        const def = WEAPONS[aim.weapon];
        aim.t++;
        const d4 = Input.dir4;
        if (d4 && d4 !== $gamePlayer.direction()) $gamePlayer.setDirection(d4);   // turning to another target
        const best = aimCandidates(def)[0] || null;
        if ((best ? best.ref : null) !== aim.ref) {
            aim.t = Math.min(aim.t, Math.round(def.steady * 0.4));   // a new target: the circle opens up a little again
            aim.ref = best ? best.ref : null;
        }
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.5, [fx, fy] = facingVector();
        aim.point = best ? { x: best.x, y: best.y } : { x: px + fx * def.range * 0.7, y: py + fy * def.range * 0.7 };
        const dex = window.Combat && Combat.aimSteady ? Combat.aimSteady() : 1;   // (Zręczność: the circle closes sooner)
        const k = Math.min(1, aim.t / (def.steady * (sneaking() ? 0.8 : 1) * dex)), ease = 1 - (1 - k) * (1 - k);
        let r = def.spread - (def.spread - def.focus) * ease;
        if ($gameSystem.staminaRatio() < 0.3) r = Math.max(r, def.focus * 2.2);   // tired hands
        if (def.tremble && aim.t > def.tremble) r += (aim.t - def.tremble) * 0.004;   // the drawn bow starts to shake
        aim.radius = r;
    }
    function endAim() {
        aim = null;
    }
    // the shoot key let go: the shot flies at a random point of the circle
    function fireAimed() {
        if (!aim) return;
        const w = aim.weapon, a = aim.point, ang = Math.random() * Math.PI * 2, rr = aim.radius * Math.sqrt(Math.random());
        endAim();
        if (!a || !payShot(WEAPONS[w])) return;
        const sx = $gamePlayer._realX + 0.5, sy = $gamePlayer._realY + 0.3;
        let dx = a.x + Math.cos(ang) * rr - sx, dy = a.y + Math.sin(ang) * rr - sy;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len; dy /= len;
        faceVector(dx, dy);
        launch(w, dx, dy);
    }
    // ------------------------------------------------------------------
    // The spear: the shoot key with a spear in the bag jabs at what stands within reach in front of the player (the nearest one); with nothing
    // that close, it aims the bow or the sling as before (and with neither, it jabs at the air). The hit lands on the jab's strike frame.
    // ------------------------------------------------------------------
    function spearTarget() {
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.5, [fx, fy] = facingVector();
        let best = null, bestD = Infinity;
        for (const t of allTargets()) {
            const dx = t.x - px, dy = t.y - py, d = Math.hypot(dx, dy);
            if (d < 0.01 || d > SPEAR.reach + t.radius * 0.5 || (dx * fx + dy * fy) / d < 0.5) continue;
            if (d < bestD) { best = t; bestD = d; }
        }
        return best;
    }
    function thrust() {
        if (!ENABLED || cooldown > 0 || aim) return false;
        if (!$gameSystem.trySpendStamina(SPEAR.stamina)) { popup(82, "Jesteś zbyt zmęczony", "#ff9f8f"); return false; }
        cooldown = SPEAR.cooldown;
        $gameTemp._farmLock = Math.max($gameTemp._farmLock || 0, 10);
        const strike = () => {
            const t = spearTarget();
            AudioManager.playSe({ name: "Wind7", volume: 70, pitch: 140, pan: 0 });   // the swish of the jab
            if (window.Durability) Durability.use(ITEM.spear);
            if (t) t.hit(SPEAR.damage, "spear");
            makeNoise($gamePlayer._realX + 0.5, $gamePlayer._realY + 0.5, SPEAR.noise);
        };
        if (animate && typeof $gamePlayer.startToolSwing === "function" && $gamePlayer.startToolSwing(SHOT_SWING.spear, strike)) return true;
        strike();
        return true;
    }
    // the shoot key pressed: the spear for what is within reach (or when there is nothing to shoot with), else aim the bow / the sling
    function pressShoot() {
        if (window.Combat && Combat.pressAttack) return Combat.pressAttack();   // (the weapon in hand: a blow, or aiming the bow / the sling)
        if (countItem(ITEM.spear) > 0 && (spearTarget() || !hasRanged())) return thrust();
        return startAim();
    }

    // the circle on the map: a yellow ring with four ticks and a dot; its size is the spread of the shot
    function Sprite_AimReticle() {
        this.initialize(...arguments);
    }
    Sprite_AimReticle.prototype = Object.create(PIXI.Graphics.prototype);
    Sprite_AimReticle.prototype.constructor = Sprite_AimReticle;
    Sprite_AimReticle.prototype.initialize = function() {
        PIXI.Graphics.call(this);
        this.z = 9;
        this.visible = false;
        this._drawn = -1;
    };
    Sprite_AimReticle.prototype.update = function() {
        if (!aim || !aim.point) { this.visible = false; return; }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), r = Math.max(4, aim.radius * tw), accent = (window.UIStyle && UIStyle.accent) ? parseInt(UIStyle.accent.slice(1), 16) : 0xffd23f;
        this.visible = true;
        this.x = Math.round($gameMap.adjustX(aim.point.x) * tw);
        this.y = Math.round($gameMap.adjustY(aim.point.y) * th);
        const key = Math.round(r) + (aim.ref ? "t" : "f");
        if (key === this._drawn) return;
        this._drawn = key;
        this.clear();
        this.lineStyle(3, 0x000000, 0.45);
        this.drawCircle(0, 0, r);
        this.lineStyle(2, accent, aim.ref ? 0.95 : 0.55);
        this.drawCircle(0, 0, r);
        for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            this.moveTo(ux * (r - 3), uy * (r - 3));
            this.lineTo(ux * (r + 5), uy * (r + 5));
        }
        this.lineStyle(0);
        this.beginFill(accent, 0.9);
        this.drawCircle(0, 0, 1.5);
        this.endFill();
    };
    // the badge while sneaking: a small plate at the bottom of the screen
    function Sprite_SneakBadge() {
        this.initialize(...arguments);
    }
    Sprite_SneakBadge.prototype = Object.create(Sprite.prototype);
    Sprite_SneakBadge.prototype.constructor = Sprite_SneakBadge;
    Sprite_SneakBadge.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(170, 30));
        const bmp = this.bitmap;
        if (window.UIStyle) UIStyle.panel(bmp.context, 0, 0, 170, 30, { cut: 4 });
        bmp.fontSize = 17;
        bmp.textColor = (window.UIStyle && UIStyle.text) || "#eceef0";
        bmp.outlineColor = "rgba(0,0,0,0.9)";
        bmp.outlineWidth = 3;
        bmp.drawText("Skradanie  ·  C", 0, 0, 170, 30, "center");
        this.anchor.set(0.5, 1);
        this.visible = false;
    };
    Sprite_SneakBadge.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.visible = sneaking() && !$gameMessage.isBusy();
        this.x = Graphics.width / 2;
        this.y = Graphics.height - 14;
    };
    function makeProjectile(weapon, x, y, dx, dy) {
        const p = { weapon, x, y, dx, dy, travelled: 0, done: false, sprite: null };
        const set = spriteset();
        if (set && set._tilemap) {
            const arrow = weapon === "bow";
            const bmp = new Bitmap(arrow ? 22 : 8, arrow ? 6 : 8), ctx = bmp.context;
            if (arrow) {
                ctx.fillStyle = "#2a1c14"; ctx.fillRect(0, 1, 22, 4);
                ctx.fillStyle = "#b98a55"; ctx.fillRect(1, 2, 15, 2);
                ctx.fillStyle = "#c9c9c0"; ctx.fillRect(16, 1, 5, 4); ctx.fillRect(21, 2, 1, 2);
                ctx.fillStyle = "#f0e2b0"; ctx.fillRect(0, 0, 4, 1); ctx.fillRect(0, 5, 4, 1);
            } else {
                ctx.fillStyle = "#2a1c14"; ctx.beginPath(); ctx.arc(4, 4, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#9a9a90"; ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#cfcfc4"; ctx.fillRect(2, 2, 2, 2);
            }
            bmp._baseTexture.update();
            const sprite = new Sprite(bmp);
            sprite.anchor.set(arrow ? 0.9 : 0.5, 0.5);
            sprite.rotation = Math.atan2(dy, dx);
            sprite.z = 5;
            set._tilemap.addChild(sprite);
            p.sprite = sprite;
        }
        return p;
    }
    function endProjectile(p) {
        p.done = true;
        if (p.sprite) {
            try {
                if (p.sprite.parent) p.sprite.parent.removeChild(p.sprite);
                p.sprite.destroy();
            } catch (e) { /* the scene (and with it the sprite) is already gone */ }
            p.sprite = null;
        }
    }
    function blockedAt(x, y) {
        const tx = Math.floor(x), ty = Math.floor(y);
        if (!$gameMap.isValid(tx, ty)) return true;
        if (!$gameMap.checkPassage(tx, ty, 0x0f)) return true;
        return $gameMap.eventsXy(tx, ty).some(e => e.isNormalPriority() && e.characterName() !== "");
    }
    function updateProjectiles() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const targets = projectiles.length ? allTargets() : [];
        for (const p of projectiles) {
            if (p.done) continue;
            const def = WEAPONS[p.weapon];
            const steps = 3, step = def.speed / steps;
            for (let i = 0; i < steps && !p.done; i++) {
                p.x += p.dx * step; p.y += p.dy * step; p.travelled += step;
                const target = targets.find(t => Math.hypot(t.x - p.x, t.y - p.y) <= t.radius);
                if (target) { shotHit(target, def); endProjectile(p); break; }
                if (p.travelled >= def.range || blockedAt(p.x, p.y)) endProjectile(p);
            }
            if (p.sprite && !p.sprite.parent) p.sprite = null;   // the scene was rebuilt: the flight goes on without the picture
            if (p.sprite && !p.done) {
                p.sprite.x = Math.round($gameMap.adjustX(p.x) * tw);
                p.sprite.y = Math.round($gameMap.adjustY(p.y) * th);
            }
        }
        projectiles = projectiles.filter(p => !p.done);
    }

    // ------------------------------------------------------------------
    // A hit
    // ------------------------------------------------------------------
    // how: "spear" for a jab (a boar reels back from it), anything else for a shot
    // extra (Combat.js): { poise, knock, crit, heavy, tag } - how much of its balance the blow takes, whether it is thrown back
    // a stone / an arrow hits: Zręczność and the Strzelectwo skills make it stronger; a lucky shot (Słaby punkt) doubles it, a shot at
    // an animal that has not noticed the hero yet (Strzał w serce) triples it
    function shotHit(target, def) {
        let dmg = def.damage * (window.Combat ? 1 + 0.02 * (Combat.attr("dex") - 5) : 1) * (1 + perk("ranged.dmg")), tag = "";
        const a = target.ref && target.ref.isAnimal ? target.ref : null;
        if (a && knowsSkill("r_heart") && (a._aware || 0) < 0.3 && !a._engaged) { dmg *= 3; tag = "heart"; }
        else if (perkRoll("ranged.crit")) { dmg *= 2; tag = "crit"; }
        target.hit(Math.round(dmg), "shot", { poise: Math.round(def.damage * 0.6), crit: !!tag, tag });
    }
    function hit(animal, damage, how, extra) {
        const sp = SPECIES[animal.kind()];
        if (animal._dead) return;
        damage = Math.round(damage * (1 + perk("hunt.dmg")));   // (Łowca, Tropiciel, Pogromca zwierząt: any weapon)
        extra = extra || {};
        animal._hp -= damage;
        animal._poiseT = 0;
        animal._engaged = true;
        AudioManager.playSe({ name: "Damage1", volume: window.Combat ? 55 : 80, pitch: sp.aggressive ? 90 : 120, pan: 0 });
        if (window.Combat && Combat.enemyHurtFx) Combat.enemyHurtFx(animal, damage, how, extra);
        if (animal._hp > 0) {
            animal._wounded = true;
            if (!window.Combat) popup($dataItems[ITEM.carcass].iconIndex, sp.name + " ranny", "#ffd98f");
            animal._poise -= extra.poise !== undefined ? extra.poise : Math.round(damage * 0.8);
            if (animal._poise <= 0 && how !== "spear") stagger(animal, extra.knock);
            else if (extra.knock && animal._mode !== "charge") knockBack(animal);
            if (sp.aggressive) enrage(animal, how);
            makeNoise(animal.centerX(), animal.centerY(), NOISE_RADIUS);
            return;
        }
        kill(animal);
    }
    // one more of this kind taken today on this map (it does not come back before dawn) and in all
    function tally(animal) {
        const mapId = $gameMap.mapId(), h = hunt(), rec = h.killed[mapId] && h.killed[mapId].day === day() ? h.killed[mapId] : (h.killed[mapId] = { day: day() });
        rec[animal.kind()] = (rec[animal.kind()] || 0) + 1;
        h.kills[animal.kind()] = (h.kills[animal.kind()] || 0) + 1;
    }
    function kill(animal) {
        const sp = SPECIES[animal.kind()];
        tally(animal);
        removeAnimal(animal);
        if (animal._pack && animal._pack.leader === animal) animal._pack.broken = true;   // the leader down: the pack loses heart
        for (const fn of killListeners) fn(animal);
        AudioManager.playSe({ name: "Collapse1", volume: 70, pitch: 130, pan: 0 });
        dropCarcass(animal.kind(), animal.centerX(), animal.centerY(), animal.direction());   // it lies where it fell
        void sp;
    }

    // ------------------------------------------------------------------
    // Carcasses (user, 2026-09-24): a killed animal lies where it fell. Only with a knife is it dressed - the action button in
    // front of it: the meat of that animal, raw hide and sinews (YIELD); without one it waits, and after CARCASS.rot hours it
    // has rotted away. Kept per map in $gameSystem._carcasses (saved); drawn in the tilemap on its back, darker, with blood.
    // ------------------------------------------------------------------
    const YIELD = {
        rabbit: { meat: 94, n: 1, skin: 1, sinew: 1 },
        deer: { meat: 157, n: 3, skin: 2, sinew: 2 },
        boar: { meat: 159, n: 4, skin: 2, sinew: 2 },
        wolf: { meat: 161, n: 2, skin: 1, sinew: 2 }
    };
    const CARCASS = { rot: 24, reach: 1.3, max: 16 };   // rot: game hours; reach: tiles from the hero's centre; max: a map's
    const clockNow = () => $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour();
    function carcassList(mapId) {
        const s = $gameSystem._carcasses || ($gameSystem._carcasses = {}), id = mapId || $gameMap.mapId();
        return s[id] || (s[id] = []);
    }
    let carcassSeq = 0;
    function dropCarcass(kind, x, y, dir) {
        if (!YIELD[kind]) return null;
        const list = carcassList();
        const c = { kind, x, y, dir: dir || 6, until: clockNow() + CARCASS.rot, id: Date.now() + "-" + (carcassSeq++) };
        list.push(c);
        while (list.length > CARCASS.max) list.shift();
        return c;
    }
    function removeCarcass(c) {
        const list = carcassList(), i = list.indexOf(c);
        if (i >= 0) list.splice(i, 1);
    }
    function rotCarcasses() {
        const now = clockNow();
        for (const c of carcassList().slice()) if (c.until <= now) removeCarcass(c);
    }
    // the carcass in front of the hero (or under him), the nearest one
    function carcassAhead() {
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.5, d = $gamePlayer.direction();
        const fx = d === 4 ? -1 : d === 6 ? 1 : 0, fy = d === 8 ? -1 : d === 2 ? 1 : 0;
        let best = null, bestD = 99;
        for (const c of carcassList()) {
            const dx = c.x - px, dy = c.y - py, dist = Math.hypot(dx, dy);
            if (dist > CARCASS.reach || (dist > 0.6 && (dx * fx + dy * fy) / dist < 0.3)) continue;
            if (dist < bestD) { bestD = dist; best = c; }
        }
        return best;
    }
    const knifeOwned = () => [ITEM.knifeIron, ITEM.knifeStone].find(id => $gameParty.numItems($dataItems[id]) > 0) || 0;
    function giveYield(kind, knife) {
        const y = YIELD[kind];
        const more = k => (perkRoll(k) ? 1 : 0);   // (Rzeźnik, Skórnik, Ścięgna, Król puszczy)
        $gameParty.gainItem($dataItems[y.meat], y.n + more("carcass.meat"));   // (the popups "+N ..." come from SurvivalHUD)
        $gameParty.gainItem($dataItems[ITEM.rawHide], y.skin + more("carcass.hide"));
        $gameParty.gainItem($dataItems[ITEM.sinew], y.sinew + more("carcass.sinew"));
        if (window.Durability) Durability.use(knife);
        AudioManager.playSe({ name: "Slash1", volume: 55, pitch: 85, pan: 0 });
    }
    // the action button at a carcass: with a knife the hero crouches and dresses it, without one nothing (a popup)
    function dressCarcass(c) {
        const knife = knifeOwned();
        if (!knife) { popup($dataItems[ITEM.knifeStone].iconIndex, "Potrzebujesz noża, żeby oprawić: " + SPECIES[c.kind].name, "#ff9f8f"); return true; }
        if ($gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging()) return true;
        const dx = c.x - ($gamePlayer._realX + 0.5), dy = c.y - ($gamePlayer._realY + 0.5);
        if (Math.hypot(dx, dy) > 0.3) $gamePlayer.setDirection(Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 4 : 6) : (dy < 0 ? 8 : 2));
        const finish = () => { if (!carcassList().includes(c)) return; removeCarcass(c); giveYield(c.kind, knife); };
        const crouch = window.ChoppableTree && ChoppableTree.swingKindOf ? ChoppableTree.swingKindOf("Swing_Crouch") : -1;
        if (crouch < 0 || !$gamePlayer.startToolSwing(crouch, finish, null)) finish();
        return true;
    }
    // the snare's rabbit (Farming.js): dressed at once with a knife, else its carcass lies at the snare
    function takeFromSnare(x, y) {
        const knife = knifeOwned();
        if (knife) { giveYield("rabbit", knife); return; }
        dropCarcass("rabbit", x + 0.5, y + 0.6, 2);
        popup($dataItems[ITEM.knifeStone].iconIndex, "Zając leży przy pułapce: oprawisz go nożem", "#ffd98f");
    }
    const _Game_Player_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok")) {
            const c = carcassAhead();
            if (c) return dressCarcass(c);
        }
        return _Game_Player_triggerButtonAction.call(this);
    };
    // the sprites: made with the map scene, one per carcass of this map
    let carcassSprites = [], bloodBmp = null;
    function bloodBitmap() {
        if (bloodBmp) return bloodBmp;
        bloodBmp = new Bitmap(34, 12);
        const ctx = bloodBmp.context;
        ctx.fillStyle = "rgba(92,12,10,0.75)";
        ctx.beginPath(); ctx.ellipse(17, 6, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(120,20,16,0.6)";
        ctx.beginPath(); ctx.ellipse(12, 5, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
        bloodBmp._baseTexture.update();
        return bloodBmp;
    }
    function makeCarcassSprite(c, tm) {
        const root = new Sprite();
        root.z = 2.2;   // (on the ground over the herbs, stones and site markers lying there - Farming_Render's litter 1.5, footprint 2 - under the characters)
        const blood = new Sprite(bloodBitmap());
        blood.anchor.set(0.5, 0.5);
        blood.y = 4;
        root.addChild(blood);
        const body = new Sprite(ImageManager.loadCharacter(SPECIES[c.kind].sheet));
        body.anchor.set(0.5, 0.5);
        body.scale.y = -1;   // on its back, the legs up
        body.setBlendColor([30, 8, 8, 110]);   // (the life gone out of it)
        body.bitmap.addLoadListener(bmp => {
            const pw = bmp.width / 3, ph = bmp.height / 4, row = c.dir === 4 ? 1 : 2;
            body.setFrame(pw, row * ph, pw, ph);
            body.y = Math.round(ph * 0.2);   // (the animal fills the lower part of its cell: turned over it goes up, so back down onto the blood)
        });
        root.addChild(body);
        tm.addChild(root);
        return root;
    }
    function updateCarcassSprites() {
        const set = spriteset(), tm = set && set._tilemap;
        if (!tm) return;
        const list = carcassList();
        carcassSprites = carcassSprites.filter(e => {
            const keep = e.sprite.parent === tm && list.includes(e.c);
            if (!keep && e.sprite.parent) e.sprite.parent.removeChild(e.sprite);
            return keep;
        });
        for (const c of list) if (!carcassSprites.some(e => e.c === c)) carcassSprites.push({ c, sprite: makeCarcassSprite(c, tm) });
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const e of carcassSprites) {
            e.sprite.x = Math.round($gameMap.adjustX(e.c.x) * tw);
            e.sprite.y = Math.round($gameMap.adjustY(e.c.y) * th);
        }
    }

    // ------------------------------------------------------------------
    // The map scene drives it
    // ------------------------------------------------------------------
    // loading a save must not keep the animals of the game that was running (their sprites are gone with the old scene)
    const _extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _extractSaveContents.call(this, contents);
        animals = [];
        packs = [];
        projectiles = [];
        spotCache = { mapId: 0, spots: null };
    };
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        animals = [];
        packs = [];
        projectiles = [];
        spotCache = { mapId: 0, spots: null };
        carcassSprites = [];
        if ($gameSystem) rotCarcasses();
    };
    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        for (const a of animals.slice()) a.update();
    };
    // sprites of the animals that exist when the spriteset is (re)built, e.g. after a menu
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        for (const a of animals) { a._sprite = null; a._markSprite = null; addSprite(a, this); }
        this._aimReticle = new Sprite_AimReticle();
        this._tilemap.addChild(this._aimReticle);
    };
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        if (this._aimReticle) this._aimReticle.update();
    };
    const _Scene_Map_createSpriteset = Scene_Map.prototype.createSpriteset;
    Scene_Map.prototype.createSpriteset = function() {
        _Scene_Map_createSpriteset.call(this);
        this._sneakBadge = new Sprite_SneakBadge();
        this.addChild(this._sneakBadge);
    };
    let populateWait = 0, snareWait = 0, rotWait = 0;
    let auto = true;   // tests switch the automatic refilling off
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (!ENABLED || !$gamePlayer) return;
        trackPlayer();
        if (cooldown > 0) cooldown--;
        if (auto && --populateWait <= 0) { populateWait = 90; populate(); }
        if (--snareWait <= 0) { snareWait = 60; snareUnseen(); }
        if (--rotWait <= 0) { rotWait = 120; rotCarcasses(); }
        updateCarcassSprites();
        if (window.Hunting.pending === "boar") {   // the F9 menu (Debug.js): a boar 5-8 tiles away
            window.Hunting.pending = null;
            const spots = (spotsOfMap() || []).filter(s => { const d = Math.hypot(s.x - $gamePlayer.x, s.y - $gamePlayer.y); return d >= 5 && d <= 8; });
            if (spots.length) { const s = spots[Math.floor(Math.random() * spots.length)]; spawn("boar", s.x, s.y)._summoned = true; popup(ITEM.spear && $dataItems[ITEM.spear] ? $dataItems[ITEM.spear].iconIndex : 0, "Gdzieś blisko chrząka dzik...", "#ffd98f"); }
            else popup(0, "Nie ma tu miejsca dla dzika", "#bcd8ff");
        }
        if (window.Hunting.pending === "deer") {   // the F9 menu: a deer 6-9 tiles away, whatever the hour (it stays: _summoned)
            window.Hunting.pending = null;
            const spots = (spotsOfMap() || []).filter(s => { const d = Math.hypot(s.x - $gamePlayer.x, s.y - $gamePlayer.y); return d >= 6 && d <= 9; });
            if (spots.length) { const s = spots[Math.floor(Math.random() * spots.length)]; spawn("deer", s.x, s.y)._summoned = true; popup($dataItems[157] ? $dataItems[157].iconIndex : 0, "Niedaleko pasie się jeleń...", "#ffd98f"); }
            else popup(0, "Nie ma tu miejsca dla jelenia", "#bcd8ff");
        }
        if (window.Hunting.pending === "wolves") {   // the F9 menu: a pack of 3 wolves 7-10 tiles away
            window.Hunting.pending = null;
            const spots = (spotsOfMap() || []).filter(s => { const d = Math.hypot(s.x - $gamePlayer.x, s.y - $gamePlayer.y); return d >= 7 && d <= 10; });
            const s = spots.length ? spots[Math.floor(Math.random() * spots.length)] : null;
            const pack = s ? spawnPack(s.x, s.y, 3) : null;
            if (pack) { for (const w of pack.members) w._summoned = true; popup(0, "W ciemności błyszczą oczy... wilki!", "#ffd98f"); }
            else popup(0, "Nie ma tu miejsca dla watahy", "#bcd8ff");
        }
        for (const a of animals) if (!a._sprite || !a._sprite.parent) addSprite(a);   // never leave an animal without a picture
        updateProjectiles();
        if (Input.isTriggered("sneak") && canShoot()) setSneak(!sneaking());
        if (aim && aim.manual) {   // aiming without the animation (tests): the same timing as the whirl
            updateAim();
            if (!Input.isPressed("shoot") && aim.t >= WEAPONS[aim.weapon].release) fireAimed();
        } else if (aim && !$gamePlayer.isToolSwinging()) {
            endAim();   // the swing was taken away (a scene change...)
        } else if (aim) {
            updateAim();
        } else if (Input.isTriggered("shoot") && canShoot()) {
            pressShoot();
        }
    };

    window.Hunting = { auto: v => { auto = !!v; }, animate: v => { animate = !!v; }, SPECIES, WEAPONS, spawn, shoot, populate, hit, kill, removeAnimal, mapTargets,
        get animals() { return animals; }, get projectiles() { return projectiles; }, hunt, killedToday, pickWeapon, updateProjectiles,
        // sneaking, awareness, aiming, and the hooks for other hunters' targets (Birds.js)
        sneaking, setSneak, noticeRate, updateAwareness, updateMark, coverBetween, startAim, updateAim, fireAimed, endAim, get aim() { return aim; },
        // the spear and the boar
        SPEAR, BOAR, thrust, spearTarget, pressShoot, gore, enrage, get cooldown() { return cooldown; }, resetCooldown: () => { cooldown = 0; },
        allTargets, addTargets: fn => { targetSources.push(fn); }, onNoise: fn => { noiseListeners.push(fn); }, makeNoise, snareUnseen, rabbitHours,
        get playerStep() { return playerStep; },
        // combat (Combat.js): the animal class, the wolves, the hooks
        YIELD, CARCASS, dropCarcass, removeCarcass, carcasses: () => carcassList(), carcassAhead, dressCarcass, takeFromSnare,
        Game_Animal, WOLF, get packs() { return packs; }, spawnPack, makePack, wolfEngage, stagger, knockBack, atkOf, onKill: fn => { killListeners.push(fn); } };
})();
