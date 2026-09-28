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
 * Gdy między wami stoi drzewo, krzak, kamień albo budynek, dzik nie stoi i nie
 * wbiega w przeszkodę: obiega ją i szarżuje z miejsca 3-5 pól od ciebie, skąd ma
 * czystą drogę. Rozpędzony dzik, który wpadnie na drzewo, kamień albo ścianę
 * (bo w ostatniej chwili uskoczysz), jest ogłuszony przez ok. 1,5 s - zwab go na sosnę!
 * Zwierzęta i pies chodzą w 8 kierunkach i obchodzą przeszkody (nie utykają w lesie).
 * Opis poniżej (siła broni, życie) dotyczy gry bez Combat.js.
 *
 * WILKI (nocą 20-5): watahy po 2-4. Gdy cię zauważą (albo podejdziesz na 6 pól),
 * wyją i otaczają cię w kręgu; po jednym naraz: przysiada i szczeka ("!"), skacze
 * i gryzie, a po skoku stoi chwilę - wtedy bij. Mocno poranione, albo gdy padnie
 * przewodnik, uciekają. Każdy wilk ma w kręgu swoje miejsce (podchodzą z różnych
 * stron), obchodzi drzewa i krzaki, a skacze tylko wtedy, gdy nic nie stoi między
 * nim a tobą - inaczej najpierw obiega przeszkodę.
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
    // the maps of the new start (2026-09-27: grandpa's yard and the three roads to his field) - their animals when the plugin's
    // parameter does not list them (a list in the Plugin Manager wins)
    const NEW_START_MAPS = { 20: { rabbit: 2 }, 21: { rabbit: 3, deer: 1, boar: 1, wolf: 2 }, 22: { rabbit: 4, deer: 1, wolf: 2 }, 23: { rabbit: 3, deer: 2, boar: 1, wolf: 3 } };
    for (const id of Object.keys(NEW_START_MAPS)) if (!MAPS[id]) MAPS[id] = NEW_START_MAPS[id];

    // (the "shoot" action - the attack, the shot - is on O in Combat.js's combat mode; no key of its own here)
    Input.keyMapper[67] = "sneak";   // C

    const ITEM = { carcass: 101, stone: 64, sling: 125, bow: 126, arrows: 127, bandage: 152, spear: 154, rawHide: 96, sinew: 163, knifeStone: 90, knifeIron: 91 };
    // speed / flee: MZ move speeds (4 = the player); sight: tiles at which it starts to notice the player (see noticeRate);
    // hours: when it is about. aggressive (the boar): it does not run from the player but charges him - see Game_Animal.thinkBoar;
    // charge: its speed then, hurt: the strength it takes on a hit (plus a wound, Survival.js), run: its sheet while charging
    // hp: its life at level 1 (combat scale: an arrow takes 30); atk: what its attack takes from the hero (Combat.js, +12% a level);
    // poise: its balance (hits take it away; at 0 it reels for `stun` frames). pack: wolves come in packs of pack[0]-pack[1]
    const SPECIES = {
        rabbit: { name: "Zając", sheet: "$Animal_Rabbit", hp: 12, poise: 10, stun: 30, speed: 3, flee: 5, sight: 6, radius: 0.5, drop: 1, hours: [[5, 21]], hops: true },   // hops: over a stump, a log, a bush
        deer: { name: "Jeleń", sheet: "$Animal_Deer", hp: 40, poise: 25, stun: 40, speed: 3, flee: 5, sight: 9, radius: 0.75, drop: 2, hours: [[5, 10], [16, 21]] },
        boar: { name: "Dzik", sheet: "$Animal_Boar", run: "$Animal_Boar_Run", hp: 110, atk: 30, poise: 60, stun: 70, speed: 3, trot: 4, flee: 4.6, charge: 4.6, sight: 7, radius: 0.65, drop: 3,
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
    // lane: tiles from the hero of the place it goes round to when something stands between them (then laneWarn: its shorter
    // warning there); bash: the frames it stands stunned after running flat out into a tree, a rock, a building or a wall
    const BOAR = { warn: 50, charge: 240, retreat: [90, 150], stagger: 36, contact: 1.05, commit: 5, overshoot: 3.5, recover: 100, rush: 0.4, lane: [3, 5], laneWarn: 30, bash: 90 };
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

    // grass tiles a wild animal may stand on: passable, no event, no building (Farming.js knows the ground), and one it can step off
    // (a berry bush is no event but Farming's passage: an animal born in one stood there all night - the 6-day marathon)
    const canLeave = (x, y) => [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d));
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
                if (!$gameMap.checkPassage(x, y, 0x0f) || !canLeave(x, y) || $gameMap.eventsXy(x, y).length > 0 || F.hasObjectTile(x, y) || F.buildingAt(x, y)) continue;
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
        return diag ? actor.canPassDiagonally(x, y, diag[0], diag[1]) : actor.canPass(x, y, d) || !!(actor.hopOver && actor.hopOver(x, y, d));
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
    // Path8: the way round what is in the way, in 8 directions, for the wild animals and the dog (Dog.js). The engine's
    // findDirectionTo walks only the four ways, looks 12 steps ahead and asks every event of the map about every tile it tries (in a
    // wood that stalled the game once). Here: A* over a grid of the map kept for some frames (the tiles' passage, the events in the
    // way, the buildings); a slant only where both straight ways round its corner are open too (no cutting past a tree); a cap on the
    // nodes of a search and on the searches in a frame; a path found is followed for a while.
    // ------------------------------------------------------------------
    // nodes: a search's cap; perFrame: the searches in one frame (past it an actor follows its old path or steps greedily); keep: the
    // frames a path is followed before it is searched again; tiles / events: the frames the grid's parts are kept
    const PATH = { nodes: 1600, perFrame: 4, keep: 24, tiles: 600, events: 20 };
    const DIRS8 = [2, 4, 6, 8, 1, 3, 7, 9];
    const PBIT = { 2: 1, 4: 2, 6: 4, 8: 8 };
    const DX8 = [0, -1, 1, 0, -1, 1, -1, 1], DY8 = [1, 0, 0, -1, 1, 1, -1, -1], SB8 = [1, 2, 4, 8];   // (DIRS8 as steps; the bits of the straight ones)
    // per tile: pass - the map's passage of its four sides; ev - an event in the way stands there; bld - a building; s4a / s4d - the
    // straight steps (bits of PBIT) that go from it, for a wild animal (all of a building keeps it out: Game_Animal.isMapPassable)
    // and for the dog (only a building's solid cells, the map's passage of Farming.js)
    const pgrid = { mapId: -1, w: 0, h: 0, pass: null, ev: null, bld: null, s4a: null, s4d: null, tilesAt: -1e9, eventsAt: -1e9, rev: -1 };
    function pathGrid() {
        const now = Graphics.frameCount, w = $gameMap.width(), h = $gameMap.height(), mapId = $gameMap.mapId(), G = pgrid, n = w * h;
        if (G.mapId !== mapId || G.w !== w || G.h !== h) {
            Object.assign(G, { mapId, w, h, pass: new Uint8Array(n), ev: new Uint8Array(n), bld: new Uint8Array(n), s4a: new Uint8Array(n), s4d: new Uint8Array(n), tilesAt: -1e9, eventsAt: -1e9, rev: -1 });
        }
        const F = window.Farming, rev = F && F.farm ? F.farm().rev : 0;
        let changed = false;
        if (now - G.tilesAt > PATH.tiles || now < G.tilesAt || (rev !== G.rev && now - G.tilesAt > 30)) {   // (the farm changed - a building put up or taken down: soon)
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                const i = y * w + x;
                G.pass[i] = ($gameMap.isPassable(x, y, 2) ? 1 : 0) | ($gameMap.isPassable(x, y, 4) ? 2 : 0) | ($gameMap.isPassable(x, y, 6) ? 4 : 0) | ($gameMap.isPassable(x, y, 8) ? 8 : 0);
                G.bld[i] = F && F.buildingAt(x, y) ? 1 : 0;
            }
            G.tilesAt = now;
            G.rev = rev;
            changed = true;
        }
        if (now - G.eventsAt > PATH.events || now < G.eventsAt) {   // (the events that keep a character out: Game_Map.eventsXyNt)
            G.ev.fill(0);
            for (const e of $gameMap.events()) if (e.isNormalPriority() && !e.isThrough() && $gameMap.isValid(e._x, e._y)) G.ev[e._y * w + e._x] = 1;
            G.eventsAt = now;
            changed = true;
        }
        if (changed) {
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                const i = y * w + x, p = G.pass[i];
                let a = 0, dg = 0;
                if (p) for (let k = 0; k < 4; k++) {
                    const x2 = x + DX8[k], y2 = y + DY8[k], j = y2 * w + x2;
                    if (!(p & SB8[k]) || x2 < 0 || y2 < 0 || x2 >= w || y2 >= h || !(G.pass[j] & SB8[3 - k]) || G.ev[j]) continue;   // (3 - k: the side it comes in by)
                    dg |= SB8[k];
                    if (!G.bld[j]) a |= SB8[k];
                }
                G.s4a[i] = a;
                G.s4d[i] = dg;
            }
        }
        return G;
    }
    // one step from (x, y) the straight way d, as the grid sees it (Game_Character.canPass); animal: see pgrid
    function gridStep(G, x, y, d, animal) {
        return x >= 0 && y >= 0 && x < G.w && y < G.h && ((animal ? G.s4a : G.s4d)[y * G.w + x] & PBIT[d]) !== 0;
    }
    // any of the 8 ways: a slant only when both straight ways round its corner go as well (no cutting past a tree's corner)
    function gridStep8(G, x, y, d, animal) {
        const diag = DIAGONAL[d];
        if (!diag) return gridStep(G, x, y, d, animal);
        const [hd, vd] = diag, [sx, sy] = STEP[d];
        return gridStep(G, x, y, hd, animal) && gridStep(G, x, y, vd, animal) && gridStep(G, x + sx, y, vd, animal) && gridStep(G, x, y + sy, hd, animal);
    }
    // a tile it may stand on
    const gridOpen = (G, x, y, animal) => x >= 0 && y >= 0 && x < G.w && y < G.h && G.pass[y * G.w + x] !== 0 && !G.ev[y * G.w + x] && !(animal && G.bld[y * G.w + x]);
    // the 8-way steps of the straight line from tile (x0, y0) to (x1, y1) (Bresenham): does every one of them go? The last one (into
    // the hero's tile: he stands there) is not asked unless toEnd
    function clearLine(G, x0, y0, x1, y1, animal, toEnd) {
        const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
        let x = x0, y = y0, err = dx - dy;
        while (x !== x1 || y !== y1) {
            const e2 = 2 * err;
            let mx = 0, my = 0;
            if (e2 > -dy) { err -= dy; mx = sx; }
            if (e2 < dx) { err += dx; my = sy; }
            const last = x + mx === x1 && y + my === y1;
            if ((!last || toEnd) && !gridStep8(G, x, y, VEC_DIR[mx + "," + my], animal)) return false;
            x += mx;
            y += my;
        }
        return true;
    }
    // the first step of that line (numpad; 0 when it is there)
    function lineDir(x0, y0, x1, y1) {
        const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), e2 = 2 * (dx - dy);
        return VEC_DIR[(e2 > -dy ? Math.sign(x1 - x0) : 0) + "," + (e2 < dx ? Math.sign(y1 - y0) : 0)] || 0;
    }
    // the straight 8-way line (vx, vy) from (x, y): its next n steps all go
    function rayClear(G, x, y, vx, vy, n, animal) {
        const d = VEC_DIR[vx + "," + vy];
        for (let k = 0; k < n; k++) {
            if (!d || !gridStep8(G, x, y, d, animal)) return false;
            x += vx;
            y += vy;
        }
        return true;
    }
    // the search's buffers, kept from one search to the next (a stamp tells this search's marks from the old ones)
    let pCost = null, pFrom = null, pSeen = null, pClosed = null, pHeapI = null, pHeapF = null, pStamp = 0, pHeapN = 0;
    function pathBuffers(n) {
        if (pCost && pCost.length >= n) return;
        pCost = new Float32Array(n); pFrom = new Int32Array(n); pSeen = new Int32Array(n); pClosed = new Int32Array(n);
        pHeapI = new Int32Array(n * 8 + 8); pHeapF = new Float32Array(n * 8 + 8); pStamp = 0;
    }
    function heapPush(i, f) {
        let k = pHeapN++;
        while (k > 0) {
            const p = (k - 1) >> 1;
            if (pHeapF[p] <= f) break;
            pHeapI[k] = pHeapI[p]; pHeapF[k] = pHeapF[p]; k = p;
        }
        pHeapI[k] = i; pHeapF[k] = f;
    }
    function heapPop() {
        const top = pHeapI[0], n = --pHeapN, li = pHeapI[n], lf = pHeapF[n];
        let k = 0;
        for (;;) {
            let c = 2 * k + 1;
            if (c >= n) break;
            if (c + 1 < n && pHeapF[c + 1] < pHeapF[c]) c++;
            if (pHeapF[c] >= lf) break;
            pHeapI[k] = pHeapI[c]; pHeapF[k] = pHeapF[c]; k = c;
        }
        pHeapI[k] = li; pHeapF[k] = lf;
        return top;
    }
    // A* from tile (sx, sy) towards (tx, ty). opts: animal (see gridStep), near (tiles: that close to (tx, ty) will do - "beside"),
    // goal(x, y) (any tile it likes will do, the nearest one: then (tx, ty) is not aimed at), avoid (tile indices to keep off),
    // nodes (the cap). Returns { path: tile indices, the first step first, reached } - when the goal cannot be reached (or not within
    // the cap), the way to the tile nearest to (tx, ty) it found
    function search8(G, sx, sy, tx, ty, opts) {
        const w = G.w, animal = !!opts.animal, near = opts.near || 0, goal = opts.goal || null, avoid = opts.avoid || null, cap = opts.nodes || PATH.nodes;
        pathBuffers(w * G.h);
        if (++pStamp > 2e9) { pSeen.fill(0); pClosed.fill(0); pStamp = 1; }
        const oct = (x, y) => { const ax = Math.abs(x - tx), ay = Math.abs(y - ty); return Math.max(ax, ay) + 0.4142 * Math.min(ax, ay); };
        const hOf = goal ? () => 0 : (x, y) => Math.max(0, oct(x, y) - near);
        const isGoal = goal || ((x, y) => (near > 0 ? Math.hypot(x - tx, y - ty) <= near + 1e-6 : x === tx && y === ty));
        const start = sy * w + sx;
        pHeapN = 0;
        pCost[start] = 0; pFrom[start] = -1; pSeen[start] = pStamp;
        heapPush(start, hOf(sx, sy));
        const S4 = animal ? G.s4a : G.s4d;   // (gridStep8 by the bits: the straight steps of the tile, and of the two beside a slant)
        let best = start, bestD = oct(sx, sy), found = -1, count = 0;
        while (pHeapN > 0 && count < cap) {
            const i = heapPop();
            if (pClosed[i] === pStamp) continue;
            pClosed[i] = pStamp;
            count++;
            const x = i % w, y = (i - x) / w, m = S4[i];
            if (isGoal(x, y)) { found = i; break; }
            const dd = oct(x, y);
            if (dd < bestD) { bestD = dd; best = i; }
            for (let k = 0; k < 8; k++) {
                const ox = DX8[k], oy = DY8[k];
                if (k < 4) { if (!(m & SB8[k])) continue; }
                else {
                    const hb = ox < 0 ? 2 : 4, vb = oy < 0 ? 8 : 1;
                    if (!(m & hb) || !(m & vb) || !(S4[i + ox] & vb) || !(S4[i + oy * w] & hb)) continue;
                }
                const j = i + oy * w + ox;
                if (pClosed[j] === pStamp || (avoid && avoid.includes(j))) continue;
                const g = pCost[i] + (k < 4 ? 1 : 1.4142);
                if (pSeen[j] === pStamp && g >= pCost[j]) continue;
                pSeen[j] = pStamp; pCost[j] = g; pFrom[j] = i;
                heapPush(j, g + hOf(x + ox, y + oy));
            }
        }
        const end = found >= 0 ? found : best, path = [];
        for (let i = end; i !== start; i = pFrom[i]) path.push(i);
        path.reverse();
        return { path, reached: found >= 0 };
    }
    // the searches of this frame (PATH.perFrame at most): true when one more may run
    let pFrame = -1, pSearches = 0;
    function searchBudget() {
        if (pFrame !== Graphics.frameCount) { pFrame = Graphics.frameCount; pSearches = 0; }
        if (pSearches >= PATH.perFrame) return false;
        pSearches++;
        return true;
    }
    // no search this frame: the open way (of 8) that ends nearest to the target, when nearer than here
    function greedyDir(G, x, y, tx, ty, animal) {
        let best = 0, bestD = Math.hypot(tx - x, ty - y) - 0.01;
        for (const d of DIRS8) {
            if (!gridStep8(G, x, y, d, animal)) continue;
            const [ox, oy] = STEP[d], nd = Math.hypot(tx - x - ox, ty - y - oy);
            if (nd < bestD) { bestD = nd; best = d; }
        }
        return best;
    }
    // tiles an actor keeps off a while (a step that did not go, a way it got nowhere on): actor._avoid = [{ i, until }]
    function avoidTile(actor, x, y, frames) {
        const G = pathGrid();
        if (x < 0 || y < 0 || x >= G.w || y >= G.h) return;
        const now = Graphics.frameCount, i = y * G.w + x;
        actor._avoid = (actor._avoid || []).filter(a => a.until > now && a.i !== i).concat([{ i, until: now + (frames || 90) }]).slice(-6);
        actor._p8 = null;
    }
    function avoidList(actor) {
        const now = Graphics.frameCount, list = (actor._avoid || []).filter(a => a.until > now).map(a => a.i);
        return list.length ? list : null;
    }
    // The next of the 8 ways (numpad; 0: nowhere nearer to go) from the actor's tile towards (tx, ty), along a path it keeps for
    // PATH.keep frames while it stands on it and the next step still goes. opts: as search8, plus key (what the walk is for).
    // Returns { dir, reached, to: the tile the path ends at, steps: how many steps it still is, greedy: no search this frame (the greedy
    // step) }
    function path8(actor, tx, ty, opts) {
        opts = opts || {};
        const G = pathGrid(), w = G.w, now = Graphics.frameCount, here = actor._y * w + actor._x, animal = !!opts.animal;
        const key = (opts.key || "") + ":" + tx + "," + ty + ":" + (opts.near || 0), P = actor._p8;
        const dirTo = i => { const nx = i % w, ny = (i - nx) / w; return VEC_DIR[(nx - actor._x) + "," + (ny - actor._y)] || 0; };
        if (P && P.key === key && P.map === G.mapId && now - P.t <= (opts.keep || PATH.keep)) {
            const at = P.start === here ? 0 : P.path.indexOf(here) + 1;
            if (at > 0 || P.start === here) {
                if (at >= P.path.length) return { dir: 0, reached: P.reached, to: P.to, steps: 0 };
                const d = dirTo(P.path[at]);
                if (d && gridStep8(G, actor._x, actor._y, d, animal)) return { dir: d, reached: P.reached, to: P.to, steps: P.path.length - at };
            }
        }
        if (!searchBudget()) return { dir: greedyDir(G, actor._x, actor._y, tx, ty, animal), reached: false, greedy: true, to: { x: tx, y: ty } };
        const res = search8(G, actor._x, actor._y, tx, ty, Object.assign({}, opts, { avoid: avoidList(actor) }));
        const last = res.path.length ? res.path[res.path.length - 1] : here, to = { x: last % w, y: Math.floor(last / w) };
        actor._p8 = { key, map: G.mapId, t: now, start: here, path: res.path, reached: res.reached, to };
        return { dir: res.path.length ? dirTo(res.path[0]) : 0, reached: res.reached, to, steps: res.path.length };
    }
    // the actor takes that step (numpad) when it still goes (the grid may be some frames old); when not, that tile is kept off a
    // moment and false
    function takeStep(actor, d) {
        if (!d) return false;
        if (roamingCanStep(actor, actor._x, actor._y, d)) { roamingStep(actor, d); return true; }
        const [ox, oy] = STEP[d];
        avoidTile(actor, actor._x + ox, actor._y + oy, 60);
        return false;
    }
    // A purposeful walk (a chase, a way round, a place on the ring, a flight, a walk to a place): stalled() is true once it has gone
    // STUCK.frames (longer for a slow walker) with its score (lower = better: the distance to its goal, or minus the distance from
    // what it runs from) not getting STUCK.gain better and without setting foot on a tile new to this walk - to and fro between two
    // tiles is no progress. key: what the walk is for; (gx, gy): its goal - a new key, or the goal moved off by more than
    // STUCK.drift tiles, starts a new watch; arrived: a score that means it is there (no progress wanted); unstick: the frames between
    // two looks whether it stands where it cannot take a step at all (Game_Animal.unstick)
    const STUCK = { frames: 45, gain: 0.5, seen: 24, gap: 60, drift: 3, unstick: 20 };
    function stalled(actor, key, score, arrived, gx, gy) {
        const now = Graphics.frameCount, tile = actor._y * 100000 + actor._x, perTile = 1 / Math.max(0.005, actor.distancePerFrame());
        gx = gx || 0;
        gy = gy || 0;
        let w = actor._stall;
        if (!w || w.key !== key || now - w.last > Math.max(STUCK.gap, perTile * 1.5) || Math.abs(w.gx - gx) + Math.abs(w.gy - gy) > STUCK.drift) {
            w = actor._stall = { key, gx, gy, best: score, t: now, seen: [tile], last: now };
        }
        w.last = now;
        if (score < w.best - STUCK.gain || (arrived !== undefined && score <= arrived)) { w.best = Math.min(w.best, score); w.t = now; }
        if (!w.seen.includes(tile)) { w.seen.push(tile); if (w.seen.length > STUCK.seen) w.seen.shift(); w.t = now; }
        if (now - w.t <= Math.max(STUCK.frames, perTile * 1.6)) return false;
        w.t = now;   // (said once: the walker does something about it, and the watch goes on)
        return true;
    }
    // the way to a place near him that goes a long way round (round a whole wall, out along the map's edge and back): not worth it
    const detour = (steps, x0, y0, x1, y1) => steps > 2 * Math.hypot(x1 - x0, y1 - y0) + 6;
    // How far each tile near the hero is from him on foot (for a wild animal; tiles further than `reach` steps are Infinity): a search
    // out from the tiles round him (his own may be no floor - he can stand half on a wall), kept while he stays on his tile, for some
    // frames. A place "round him" across a wall, out on the map's edge behind it, is far from him on foot.
    const heroFieldCache = { key: "", t: -1e9, dist: null };
    function heroField(reach) {
        const G = pathGrid(), hx = $gamePlayer.x, hy = $gamePlayer.y, now = Graphics.frameCount, key = G.mapId + ":" + hx + "," + hy + ":" + reach;
        const F = heroFieldCache;
        if (F.key === key && now - F.t < 30 && now >= F.t && F.dist && F.dist.length === G.w * G.h) return F.dist;
        const n = G.w * G.h, dist = F.dist && F.dist.length === n ? F.dist : new Float32Array(n), S4 = G.s4a, open = [];
        dist.fill(Infinity);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const x = hx + dx, y = hy + dy;
            if (!gridOpen(G, x, y, true)) continue;
            dist[y * G.w + x] = Math.hypot(dx, dy);
            open.push(y * G.w + x);
        }
        while (open.length) {   // (a small field: a plain list, the nearest taken each time)
            let k = 0;
            for (let j = 1; j < open.length; j++) if (dist[open[j]] < dist[open[k]]) k = j;
            const i = open[k], x = i % G.w, y = (i - x) / G.w, m = S4[i];
            open[k] = open[open.length - 1];
            open.pop();
            for (let s = 0; s < 8; s++) {
                const ox = DX8[s], oy = DY8[s];
                if (s < 4) { if (!(m & SB8[s])) continue; }
                else { const hb = ox < 0 ? 2 : 4, vb = oy < 0 ? 8 : 1; if (!(m & hb) || !(m & vb) || !(S4[i + ox] & vb) || !(S4[i + oy * G.w] & hb)) continue; }
                const j = i + oy * G.w + ox, c = dist[i] + (s < 4 ? 1 : 1.4142);
                if (c >= dist[j] || c > reach) continue;
                if (dist[j] === Infinity) open.push(j);
                dist[j] = c;
            }
        }
        F.key = key;
        F.t = now;
        F.dist = dist;
        return dist;
    }
    // stalled: the next tile of its path is kept off a while, and the way is searched again
    function unstall(actor, frames) {
        const P = actor._p8, G = pathGrid();
        if (P && P.map === G.mapId && P.path.length) {
            const here = actor._y * G.w + actor._x, at = Math.min(P.path.length - 1, P.start === here ? 0 : P.path.indexOf(here) + 1), next = P.path[at];
            avoidTile(actor, next % G.w, Math.floor(next / G.w), frames || 90);
        }
        actor._p8 = null;
    }
    // a far spot to run to, away from (fx, fy): one of the points by the map's edge (the corners, the middles of the sides) - far from
    // it and not far for the runner, on the side away from it; not `tried`
    function escapeSpot(actor, fx, fy, tried) {
        const w = $gameMap.width(), h = $gameMap.height(), spots = [];
        for (const kx of [0, 0.5, 1]) for (const ky of [0, 0.5, 1]) {
            if (kx === 0.5 && ky === 0.5) continue;
            spots.push({ x: Math.round(EDGE + kx * (w - 1 - 2 * EDGE)), y: Math.round(EDGE + ky * (h - 1 - 2 * EDGE)) });
        }
        const score = q => Math.hypot(q.x - fx, q.y - fy) - 0.6 * Math.hypot(q.x - actor._x, q.y - actor._y)   // far from it, not far for the runner
            + (((q.x - actor._x) * (actor._x - fx) + (q.y - actor._y) * (actor._y - fy)) > 0 ? 6 : 0);          // on the side away from it
        return spots.filter(q => !tried || q.x !== tried.x || q.y !== tried.y).sort((a, b) => score(b) - score(a))[0];
    }

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
        this._unstickT = Math.floor(Math.random() * STUCK.unstick);   // (see unstick; not all on the same frame)
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
    // A rabbit hops over what lies low in its way - a stump, a log, a bush, a berry bush (the user's, 2026-09-25): where the next tile
    // holds only such a thing and the one behind it is free, a two-tile jump instead of the step.
    function lowObstacleAt(x, y) {
        if (window.Farming && Farming.bushSolid && Farming.bushSolid(x, y, $gameMap.mapId())) return true;   // (a berry bush: not an event)
        const blocking = $gameMap.eventsXy(x, y).filter(e => e.isNormalPriority() && !e.isThrough());
        return blocking.length > 0 && !!(window.ChoppableTree && ChoppableTree.isLow) && blocking.every(e => ChoppableTree.isLow(e));
    }
    // the tile it lands on when it hops from (x, y) in direction d, or null
    Game_Animal.prototype.hopOver = function(x, y, d) {
        if (!SPECIES[this._kind].hops) return null;
        const x1 = $gameMap.roundXWithDirection(x, d), y1 = $gameMap.roundYWithDirection(y, d);
        const x2 = $gameMap.roundXWithDirection(x1, d), y2 = $gameMap.roundYWithDirection(y1, d);
        if (!$gameMap.isValid(x2, y2) || !$gameMap.checkPassage(x1, y1, 0x0f) || !lowObstacleAt(x1, y1)) return null;
        if (!$gameMap.isPassable(x2, y2, this.reverseDir(d)) || this.isCollidedWithCharacters(x2, y2) || (window.Farming && Farming.buildingAt(x2, y2))) return null;
        return { x: x2, y: y2 };
    };
    Game_Animal.prototype.moveStraight = function(d) {
        const hop = !Game_Character.prototype.canPass.call(this, this._x, this._y, d) && this.hopOver(this._x, this._y, d);
        if (!hop) return Game_Character.prototype.moveStraight.call(this, d);
        this.setDirection(d);
        this.jump(hop.x - this._x, hop.y - this._y);
        this.setMovementSuccess(true);
    };
    Game_Animal.prototype.kind = function() { return this._kind; };
    // on a tile it cannot step off at all (born in a berry bush, a bush grown or a building put up round it, a wall): out onto the
    // nearest open tile it can walk on from (the dog does the same, Dog.js)
    Game_Animal.prototype.unstick = function() {
        if ([2, 4, 6, 8].some(d => roamingCanStep(this, this._x, this._y, d))) return false;
        const G = pathGrid();
        for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const x = this._x + dx, y = this._y + dy;
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !gridOpen(G, x, y, true) || !G.s4a[y * G.w + x]) continue;
            this.locate(x, y);
            this._p8 = null;
            return true;
        }
        return false;
    };
    Game_Animal.prototype.centerX = function() { return this._realX + 0.5; };
    Game_Animal.prototype.centerY = function() { return this._realY + 0.5; };
    // it does not count as an "event" for Farming.js etc.
    Game_Animal.prototype.isAnimal = function() { return true; };

    Game_Animal.prototype.update = function() {
        Game_Character.prototype.update.call(this);
        if (this._alarm > 0) this._alarm--;
        if (this._lureCd > 0) this._lureCd--;
        if (this._flashT > 0) this._flashT--;
        if (this._scare && --this._scare.t <= 0) this._scare = null;
        if (++this._poiseT > 120 && this._poise < this._maxPoise) this._poise = Math.min(this._maxPoise, this._poise + this._maxPoise / 90);
        if (!this._dead) updateAwareness(this, this.centerX(), this.centerY(), SPECIES[this._kind].sight);
        const sprite = this._sprite;   // (its height only once the sheet has loaded)
        const calm = this._mode === "roam" || this._mode === "warn" || this._mode === "windup" || this._mode === "approach";   // (no mark while a boar charges, backs off or reels)
        const markY = SPECIES[this._kind].markY, windup = this._mode === "windup";
        if (sprite && sprite.bitmap && sprite.bitmap.isReady()) updateMark(this, sprite, markY !== undefined ? markY : -sprite.patternHeight() - 2, this._fleeing || !calm || this._stun > 0 ? 0 : windup ? 1 : this._aware);
        if (this._frozen || this._dead) return;
        if (this._stun > 0) { if (--this._stun === 0) this.afterStun(); return; }
        if (++this._unstickT >= STUCK.unstick && !this.isMoving() && !this.isJumping()) { this._unstickT = 0; this.unstick(); }
        if (SPECIES[this._kind].pack) { this.updateWolf(); return; }
        if (SPECIES[this._kind].aggressive) { this.updateBoar(); return; }
        if (this.isMoving()) return;
        this.think();
    };

    Game_Animal.prototype.think = function() {
        const sp = SPECIES[this._kind];
        const from = this._scare || null;   // (a dog after it, Dog.js: it runs from the dog, not from the hero)
        const dx = this._realX - (from ? from.x : $gamePlayer._realX), dy = this._realY - (from ? from.y : $gamePlayer._realY);
        const dist = Math.hypot(dx, dy);
        if (from) this._fleeing = true;
        else if (this._aware >= 1 || this._wounded || this._alarm > 0) this._fleeing = true;
        else if (this._aware < 0.3 && dist > sp.sight * 1.2) this._fleeing = false;
        if ((this._aware >= 0.3 || this._fleeing) && this._sniff > 0) { this._sniff = 0; this._lureSnare = null; }   // disturbed at the snare
        if (this._aware >= 0.3 && !this._fleeing) { this.turnTowardCharacter($gamePlayer); return; }   // it stops and looks
        if (this._fleeing) {
            this.setMoveSpeed(sp.flee);
            if (this.fleeRoute(dx, dy, dist)) return;
            const d = this.bestEscape(dx, dy);
            if (d) roamingStep(this, d);
            return;
        }
        if (this.lure()) return;
        this.wander();
    };
    // running from something and getting nowhere (a wall, a building, a thicket in the way: no ground won for a while, or to and fro):
    // it takes the way round (path8) to a far spot away from it, until it is well away or has run a while. (dx, dy): from the threat
    // to it; true while it runs that way
    Game_Animal.prototype.fleeRoute = function(dx, dy, dist) {
        const now = Graphics.frameCount, fx = Math.round(this._realX - dx), fy = Math.round(this._realY - dy);
        let R = this._route;
        if (R && (now > R.until || dist > SPECIES[this._kind].sight * 1.4 || (this._x === R.x && this._y === R.y))) R = this._route = null;
        if (!R) {
            if (!stalled(this, "flee", -dist)) return false;
            R = this._route = Object.assign({}, escapeSpot(this, fx, fy, null), { until: now + 240 });
        }
        const r = path8(this, R.x, R.y, { animal: true, key: "route" });
        if (!takeStep(this, r.dir) && !r.dir) { this._route = null; return false; }   // (nowhere to go from here that way: the plain flight)
        if (stalled(this, "route", Math.hypot(this._x - R.x, this._y - R.y), 1, R.x, R.y)) this._route = Object.assign({}, escapeSpot(this, fx, fy, R), { until: now + 240 });
        return true;
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
        if (!best) best = path8(this, s.cell.x, s.cell.y, { animal: true, key: "lure", near: 1.5 }).dir;   // (nothing nearer straight on: the way round)
        if (!best || !roamingCanStep(this, this._x, this._y, best)) return false;   // no way to it: it just wanders
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
    // a clear straight run at the hero's tile: nothing in between (a tree, a bush, a rock, a building, a wall) - the boar's charge,
    // a wolf's leap
    Game_Animal.prototype.clearRun = function() {
        return clearLine(pathGrid(), this._x, this._y, $gamePlayer.x, $gamePlayer.y, true);
    };
    // a tile lo-hi tiles from the hero with a clear run at him, the nearest one to walk to (one search from the animal to any of
    // them); kept while he stays about where he was; null when there is none it can get to, undefined when no search may run this
    // frame. near: only places it gets to without a long way round (detour)
    Game_Animal.prototype.runSpot = function(lo, hi, near) {
        const G = pathGrid(), px = $gamePlayer.x, py = $gamePlayer.y, now = Graphics.frameCount, S = this._spot;
        const bad = (this._badSpots || []).filter(b => b.until > now).map(b => b.i);
        const same = q => q && q.lo === lo && Math.abs(q.px - px) + Math.abs(q.py - py) <= 1;
        if (same(S) && now - S.t < 120 && !bad.includes(S.y * G.w + S.x) && clearLine(G, S.x, S.y, px, py, true)) return S;
        if (same(this._noSpot) && now - this._noSpot.t < 30) return null;   // (none a moment ago: not every frame again)
        if (!searchBudget()) return same(S) ? S : undefined;
        this._spot = null;
        const ok = new Set(), R = Math.ceil(hi);
        for (let y = py - R; y <= py + R; y++) for (let x = px - R; x <= px + R; x++) {
            const r = Math.hypot(x - px, y - py);
            if (r < lo || r > hi || !gridOpen(G, x, y, true) || bad.includes(y * G.w + x)) continue;
            if (clearLine(G, x, y, px, py, true)) ok.add(y * G.w + x);
        }
        const sx = this._x, sy = this._y, goal = near ? (x, y) => ok.has(y * G.w + x) && !detour(pCost[y * G.w + x], sx, sy, x, y) : (x, y) => ok.has(y * G.w + x);
        const res = ok.size ? search8(G, sx, sy, px, py, { animal: true, goal, avoid: avoidList(this) }) : null;
        if (!res || !res.reached) { this._noSpot = { lo, px, py, t: now }; return null; }
        const end = res.path.length ? res.path[res.path.length - 1] : this._y * G.w + this._x;
        return (this._spot = { x: end % G.w, y: Math.floor(end / G.w), px, py, lo, t: now });
    };
    // that place was no good (it got nowhere on the way): not again for a while
    Game_Animal.prototype.badSpot = function(s) {
        const now = Graphics.frameCount, G = pathGrid();
        this._badSpots = (this._badSpots || []).filter(b => b.until > now).concat([{ i: s.y * G.w + s.x, until: now + 300 }]).slice(-8);
        this._spot = null;
    };

    // ------------------------------------------------------------------
    // The boar: it does not run from the player. Once it has noticed him (or a shot flies near it) it stands, snorts and shows
    // "!" (warn), then charges at him, faster than he runs; BOAR.commit tiles away it locks its line and runs straight on. When
    // it reaches him it knocks him about (gore) and backs off for a while (retreat), then it may come again. When it misses (a
    // roll, a step aside) it runs BOAR.overshoot tiles past him (overshoot), stops and stands panting (recover), then turns and
    // warns again. A spear jab stops a charge: it reels back (stagger). Badly hurt it runs away for good (flee).
    // With something between them (a tree, a bush, a rock, a building) it does not stand and does not run into it: it trots round
    // (approach, path8) to a place BOAR.lane tiles from him with a clear run, and warns and charges from there; on its way it goes
    // round what stands in it. Running flat out (the locked line, the run past him) into a tree, a rock, a building or a wall, it
    // hits it and stands stunned (bash) - luring it into a pine is a way to fight it.
    // ------------------------------------------------------------------
    Game_Animal.prototype.setMode = function(mode, frames) {
        const sp = SPECIES[this._kind], running = mode === "charge" || mode === "retreat" || mode === "flee" || mode === "overshoot" || mode === "lunge";
        this._mode = mode;
        this._modeT = frames || 0;
        this._fleeing = mode === "flee";
        this._commit = null;
        const sheet = (mode === "stalk" || mode === "close") && sp.stalk ? sp.stalk : mode === "windup" && sp.bark ? sp.bark : running && sp.run ? sp.run : sp.sheet;
        if (this.characterName() !== sheet) this.setImage(sheet, 0);
        this.setStepAnime(mode === "windup");   // (the bark plays standing still)
        this.setMoveSpeed(mode === "charge" || mode === "overshoot" ? sp.charge : running ? sp.flee : mode === "approach" && sp.trot ? sp.trot : sp.speed);
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
        if (ATTACKING[this._mode]) this.setMode(SPECIES[this._kind].pack ? "stalk" : "warn", 0);
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
        if (this._mode === "overshoot") {   // it missed him: it runs on along its line, well past him, then stops - or into what stands there
            const [cx, cy] = this._line || DIR_VEC[this.direction()], len = Math.hypot(cx, cy) || 1;
            const past = -(($gamePlayer._realX - this._realX) * cx + ($gamePlayer._realY - this._realY) * cy) / len;
            const d = VEC_DIR[cx + "," + cy];
            if (this._modeT <= 0 || past >= BOAR.overshoot || !d) { this.startRecover(); return; }
            if (!roamingCanStep(this, this._x, this._y, d)) { this.bash(d); return; }   // flat out into a tree, a rock, a building, a wall
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
            // beaten and far enough from him: it limps off into the forest (limpAway); out of sight it is gone (and does not come
            // back before dawn). Running on from him step by step it only dithered left and right against a wall or a building.
            if (this._mode === "flee" && dist > sp.sight) { this.limpAway(); return; }
            this._fleeTo = null;
            if (this.fleeRoute(dx, dy, dist)) return;
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
            if (dist > 1.6 && !this.clearRun()) { this.setMode("approach"); return; }   // something in between: round it first (not into it)
            if (this._modeT <= 0) { this.setMode("charge", BOAR.charge); snort(this, 70); }
            return;
        }
        if (this._mode === "approach") {   // trotting round what stands between them, to a place with a clear run at him
            this._aware = 1;
            if (dist > sp.sight * 1.6) { this.setMode("roam"); this._aware = 0.5; return; }
            if (dist <= BOAR.lane[1] + 0.6 && this.clearRun()) { this.setMode("warn", BOAR.laneWarn); this.turnTowardCharacter($gamePlayer); snort(this, 90); return; }
            const spot = this.runSpot(BOAR.lane[0], BOAR.lane[1]), g = spot || { x: $gamePlayer.x, y: $gamePlayer.y };
            if (spot === undefined) return;   // (no search this frame: the next one)
            const r = path8(this, g.x, g.y, { animal: true, key: "lane", near: spot ? 0 : 1 });
            if (!takeStep(this, r.dir)) this.turnTowardCharacter($gamePlayer);
            if (stalled(this, "lane", Math.hypot(this._x - g.x, this._y - g.y), 0.5, g.x, g.y)) { if (spot) this.badSpot(spot); unstall(this); }   // (to and fro, or no nearer: another place)
            return;
        }
        if (this._mode === "charge") {
            if (this._modeT <= 0 || dist > sp.sight * 2) { this.setMode("retreat", BOAR.retreat[0] + Math.floor(Math.random() * (BOAR.retreat[1] - BOAR.retreat[0]))); return; }
            const G = pathGrid(), px = $gamePlayer.x, py = $gamePlayer.y;
            // the last BOAR.commit tiles it runs straight on, no more turning after him (a roll to the side lets it go past) - only on a
            // clear line: it does not lock itself onto a tree
            if (!this._commit && dist < BOAR.commit) {
                const dx = $gamePlayer._realX - this._x, dy = $gamePlayer._realY - this._y, k = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
                const vx = Math.round(Math.cos(k * Math.PI / 4)), vy = Math.round(Math.sin(k * Math.PI / 4));
                if ((Math.abs(dx * vy - dy * vx) / Math.hypot(vx, vy) < 0.6 || dist < 2.6) && rayClear(G, this._x, this._y, vx, vy, Math.max(0, Math.round(dist) - 1), true)) {   // (he is on one of its eight lines)
                    this._commit = [vx, vy];
                    this.setMoveSpeed(sp.charge + BOAR.rush);   // the last stretch: flat out
                }
            }
            if (this._commit) {
                const [cx, cy] = this._commit, ahead = ($gamePlayer._realX - this._realX) * cx + ($gamePlayer._realY - this._realY) * cy;
                const d = VEC_DIR[cx + "," + cy];
                if (!d) { this.startRecover(); return; }
                if (!roamingCanStep(this, this._x, this._y, d)) { this.bash(d); return; }   // flat out into something: it hits it
                if (ahead < -0.6) { this.startOvershoot(); return; }   // gone past him
                roamingStep(this, d);
                return;
            }
            // on the way: straight at him while the line is clear, round what is in the way when not (path8) - never into it
            let d = lineDir(this._x, this._y, px, py);
            if (!d || !clearLine(G, this._x, this._y, px, py, true)) d = path8(this, px, py, { animal: true, key: "charge", near: 1 }).dir;
            if (!takeStep(this, d)) this.turnTowardCharacter($gamePlayer);
            if (stalled(this, "charge", dist, 1.2)) { unstall(this); this.setMode("approach"); }   // it gets no nearer: round to a clear run
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
    // a beaten animal leaving: to one far spot away from the hero (a point by the map's edge, escapeSpot), a step slower, round what
    // is in the way (path8); a new spot when stuck (or going to and fro); gone when out of sight or at the edge
    const EDGE = 2;
    // really on the screen (the engine's isNearTheScreen allows a whole screen more on every side)
    const onScreen = ch => { const x = ch.screenX(), y = ch.screenY(), m = $gameMap.tileWidth(); return x > -m && x < Graphics.width + m && y > -m && y < Graphics.height + 2 * m; };
    Game_Animal.prototype.limpAway = function() {
        if (!onScreen(this)) { tallyGone(this); removeAnimal(this); return; }
        const w = $gameMap.width(), h = $gameMap.height();
        if (this._x <= EDGE || this._y <= EDGE || this._x >= w - 1 - EDGE || this._y >= h - 1 - EDGE) { tallyGone(this); removeAnimal(this); return; }
        if (!this._fleeTo || (this._fleeStuck || 0) > 6 || (this._x === this._fleeTo.x && this._y === this._fleeTo.y)) {
            this._fleeTo = escapeSpot(this, $gamePlayer.x, $gamePlayer.y, this._fleeTo);
            this._fleeStuck = 0;
        }
        this.setMoveSpeed(SPECIES[this._kind].speed);   // (walking, not running: slower than its flight; slower still looked frozen)
        const to = this._fleeTo, r = path8(this, to.x, to.y, { animal: true, key: "limp" });
        if (takeStep(this, r.dir)) this._fleeStuck = 0;
        else this._fleeStuck = (this._fleeStuck || 0) + 1;
        if (stalled(this, "limp", Math.hypot(this._x - to.x, this._y - to.y), 1, to.x, to.y)) this._fleeStuck = 99;   // (no nearer, or to and fro: another spot)
    };
    const VEC_DIR = { "0,1": 2, "-1,0": 4, "1,0": 6, "0,-1": 8, "-1,1": 1, "1,1": 3, "-1,-1": 7, "1,-1": 9 };
    const DIR_VEC = { 1: [-1, 1], 2: [0, 1], 3: [1, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 8: [0, -1], 9: [1, -1] };   // (the slants: the hero's 8-way facing)
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
    // flat out into a tree, a rock, a building or a wall (its locked charge, its run past him): a thud, dust, what it hit sways, a
    // jolt, and it stands stunned BOAR.bash frames (the swaying and the stars of Combat.js) - the moment to hit it
    Game_Animal.prototype.bash = function(d) {
        const [vx, vy] = DIR_VEC[d] || [0, 0];
        for (const [ox, oy] of vx && vy ? [[vx, vy], [vx, 0], [0, vy]] : [[vx, vy]]) {   // (on a slant: the tile ahead, else one of the two beside it)
            const hit = $gameMap.eventsXy(this._x + ox, this._y + oy).filter(e => e.isNormalPriority() && !e.isThrough());
            if (!hit.length) continue;
            for (const e of hit) { e._treeKickAt = Graphics.frameCount; e._treeKickDir = vx < 0 ? -1 : 1; }   // (ChoppableTree.js: the tree / the rock shakes)
            break;
        }
        const pan = Math.max(-80, Math.min(80, Math.round((this.centerX() - ($gamePlayer._realX + 0.5)) * 12)));
        AudioManager.playSe({ name: "Blow1", volume: 90, pitch: 55, pan });
        AudioManager.playSe({ name: "Damage3", volume: 45, pitch: 50, pan });
        if (window.Combat && Combat.sparksAt) Combat.sparksAt(this.centerX() + vx * 0.45, this.centerY() + vy * 0.45 - 0.2, "#b79a6a", 16);
        this.setMode("recover", 0);
        this._stun = Math.max(this._stun, BOAR.bash);
        this._bashed = (this._bashed || 0) + 1;
        if (!this.isJumping()) this.jump(0, 0);
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
    // the modes of an attack under way: a boar's charge, a wolf going round to a clear leap, its bark, its leap
    const ATTACKING = { charge: true, close: true, windup: true, lunge: true };
    // its balance is gone: it reels (does nothing) for a while; an attack it was about to make is off
    function stagger(animal, knock) {
        animal._stun = SPECIES[animal.kind()].stun || 50;
        animal._poise = 0;
        if (animal._pack && animal._pack.attacker === animal) { animal._pack.attacker = null; animal._pack.nextAttack = 60; }
        if (ATTACKING[animal._mode]) animal.setMode(SPECIES[animal.kind()].pack ? "stalk" : "warn", 0);
        if (knock) knockBack(animal);
    }

    // ------------------------------------------------------------------
    // Wolves: a pack hunts at night. Once it has noticed the hero (or he comes within WOLF.engage tiles) it howls and spreads round
    // him on a ring (stalk); one at a time comes in: it crouches and barks (windup, a "!"), leaps at him (lunge: a bite if he is
    // still there) and stands a moment after the leap (recover) - the moment to hit it. Hurt badly, or with the leader dead, they run.
    // ------------------------------------------------------------------
    // biteFrom: no bite before that frame of the leap; near: too close to start one; pace: frames it stands at its place on the ring
    // before it paces a little along it; close: the frames the pack's attacker may take to go round to a clear leap
    const WOLF = { ring: 3.2, windup: 38, recover: 44, gap: [60, 140], bite: 0.95, biteFrom: 6, lunge: 3, near: 1.6, engage: 6, lose: 16, flee: 0.25, pace: 50, close: 240 };
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
        // day breaks: the pack stops the hunt and runs off into the forest (gone once out of sight) - the user saw wolves that came
        // in the night still bite him in the morning (2026-09-26)
        if (!this._summoned && !activeNow("wolf") && this._mode !== "flee") {
            if (pack && pack.engaged) disengage(pack);
            this._engaged = false;
            this._dawn = true;
            this.setMode("flee");
            if (!dawnSaid) { dawnSaid = true; popup(0, "Świta - wilki odchodzą do lasu", "#cfe6a8"); }
        }
        if (activeNow("wolf")) dawnSaid = false;
        if (this.isMoving() || this.isJumping()) return;
        this.thinkWolf(dist);
    };
    Game_Animal.prototype.thinkWolf = function(dist) {
        const pack = this._pack, dx = this._realX - $gamePlayer._realX, dy = this._realY - $gamePlayer._realY;
        if (this._mode === "flee") {
            if (dist > WOLF.lose + 2) { removeAnimal(this); return; }   // gone into the dark
            if (this.fleeRoute(dx, dy, dist)) return;
            const d = this.bestEscape(dx, dy);
            if (d) roamingStep(this, d);
            return;
        }
        if (this._hp <= this._maxHp * WOLF.flee || (pack && pack.broken)) {
            if (pack && pack.attacker === this) pack.attacker = null;
            this.setMode("flee");
            return;
        }
        if ((this._mode === "windup" || this._mode === "close") && pack && pack.attacker !== this) { this.setMode("stalk"); return; }   // (not its turn any more: one at a time)
        if (this._mode === "windup") {
            this.turnTowardCharacter($gamePlayer);
            if (!this.clearRun()) { this.callOff(20); return; }   // he stepped behind a tree: no leap into it
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
                if (Math.hypot(L._x - this._x, L._y - this._y) > 2.2) {
                    this.setMoveSpeed(SPECIES.wolf.speed);
                    if (takeStep(this, path8(this, L._x, L._y, { animal: true, key: "pack", near: 1.5 }).dir)) return;
                }
            }
            this.wander();
            return;
        }
        // lost him: only when none of the pack is near him (one left far behind comes back). A straggler past WOLF.lose that called the
        // hunt off while one beside him called it on again, every frame, froze the whole pack (the 6-day marathon, the map's edge)
        if (dist > WOLF.lose && (!pack || liveMembers(pack).every(m => m.playerDistance() > WOLF.lose))) { if (pack) disengage(pack); else { this._engaged = false; this.setMode("roam"); } return; }
        if (this._mode === "close") { this.thinkClose(dist); return; }
        if (this._mode !== "stalk") this.setMode("stalk");
        // its turn, when the pack's pause is over: the stalking wolf nearest to the hero with a clear leap at him (not the one that
        // went last, if another can: they come from all sides); without a clear leap it first goes round to one (close)
        if (pack && !pack.attacker && pack.nextAttack <= 0 && pickAttacker(pack) === this) {
            pack.attacker = this;
            pack.last = this;
            if (dist > WOLF.near && dist < WOLF.ring + 1.8 && this.clearRun()) { this.setMode("windup", WOLF.windup); this.turnTowardCharacter($gamePlayer); growl(this); }
            else this.setMode("close", WOLF.close);
            return;
        }
        // its own place on the ring round the hero (ringSlot), the way round what is in the way (path8). With no place on the ring
        // it can get to (the map's edge, a wall, a thicket round him): a place near him with a clear run (runSpot), else up to him
        let slot = this.ringSlot(pack ? liveMembers(pack) : [this], pack ? pack.angle : 0), kind = "ring";
        if (!slot) {
            const s = this.runSpot(WOLF.near + 0.4, WOLF.ring + 0.8, true);
            if (s === undefined) return;   // (no search this frame: the next one)
            slot = s || { x: $gamePlayer.x, y: $gamePlayer.y };
            kind = s ? "spot" : "him";
        }
        const off = Math.hypot(slot.x - this._realX, slot.y - this._realY), there = kind === "him" ? 1.6 : 0.9;
        if (off > there) {
            const r = path8(this, slot.x, slot.y, { animal: true, key: "ring", near: kind === "him" ? 1.5 : 0 });
            // it cannot get any nearer, or only the long way round: another place
            if (!r.greedy && ((!r.reached && r.to.x === this._x && r.to.y === this._y) || (r.reached && detour(r.steps, this._x, this._y, slot.x, slot.y)))) this.dropPlace(slot, kind);
            if (takeStep(this, r.dir)) this._still = 0;
            else this.turnTowardCharacter($gamePlayer);
        } else {
            this.turnTowardCharacter($gamePlayer);
            // standing there a while it paces a little along the ring (the ring turns slowly: again till it is off); nowhere to pace
            // to - another place (beside him: a step round him)
            this._still = (this._still || 0) + 1;
            if (this._still > WOLF.pace && (kind !== "ring" || !this.paceOn(pack ? pack.angle : 0))) { this._still = 0; this.dropPlace(slot, kind); }
        }
        if (stalled(this, "ring", off, there, slot.x, slot.y)) { this.dropPlace(slot, kind); unstall(this); }
    };
    // a place it gives up (it cannot get there, only the long way round, or it paces on): not again for a while
    Game_Animal.prototype.dropPlace = function(slot, kind) {
        if (kind === "spot") { this.badSpot(slot); return; }
        if (kind === "him") { this.shuffle(); return; }
        const G = pathGrid(), now = Graphics.frameCount;
        this._badSlots = (this._badSlots || []).filter(b => b.until > now).concat([{ i: slot.y * G.w + slot.x, until: now + 300 }]).slice(-12);
        this._slotBad = true;
    };
    // a step to an open tile round the hero, near him (pacing where there is no room for the ring)
    Game_Animal.prototype.shuffle = function() {
        const px = $gamePlayer._realX, py = $gamePlayer._realY, G = pathGrid();
        const dirs = DIRS8.filter(d => { const [ox, oy] = STEP[d], r = Math.hypot(this._x + ox - px, this._y + oy - py); return r >= 0.9 && r <= 3.5 && gridStep8(G, this._x, this._y, d, true); });
        if (dirs.length) takeStep(this, dirs[Math.floor(Math.random() * dirs.length)]);
    };
    // Its own place on the ring round the hero: an angle of its own (they spread round him, not one behind the other) on the ring
    // that turns slowly. A place off the map, in a tree, a rock or a building, or one it could not get to, is given up for the nearest
    // free one round the ring, away from the others' places (null: none - at the map's edge, by a wall, in a thicket). Standing there a
    // while it paces a little to and fro along the ring.
    const angGap = (a, b) => { const d = Math.abs(a - b) % (Math.PI * 2); return d > Math.PI ? Math.PI * 2 - d : d; };
    Game_Animal.prototype.ringSlot = function(live, turn) {
        const G = pathGrid(), n = live.length;
        if (this._slot === undefined || this._slotN !== n) { this._slot = Math.max(0, live.indexOf(this)) * Math.PI * 2 / n; this._slotN = n; }
        const ok = this.slotOk();
        const s = ringTile(turn + this._slot + (this._paceOff || 0));
        if (!this._slotBad && ok(s)) return s;
        this._slotBad = false;
        this._paceOff = 0;
        const others = live.filter(m => m !== this && m._slot !== undefined).map(m => m._slot);
        for (const apart of [Math.PI / (n + 1), 0]) {   // (away from the others' places; in a thicket, anywhere open)
            for (let k = 1; k <= 8; k++) for (const sg of [1, -1]) {   // (round the ring both ways, the nearest first)
                const a = this._slot + sg * k * Math.PI / 8, q = ringTile(turn + a);
                if (!ok(q) || (q.x === this._x && q.y === this._y) || others.some(o => angGap(o, a) < apart)) continue;
                this._slot = a;
                return q;
            }
        }
        return null;
    };
    // a ring tile it may take: on the map, open, near him on foot too (not across a wall from him - heroField), not one it gave up a
    // moment ago (dropPlace)
    Game_Animal.prototype.slotOk = function() {
        const G = pathGrid(), now = Graphics.frameCount, bad = (this._badSlots || []).filter(b => b.until > now).map(b => b.i);
        const near = heroField(WOLF.ring * 2 + 3);
        return q => gridOpen(G, q.x, q.y, true) && near[q.y * G.w + q.x] !== Infinity && !bad.includes(q.y * G.w + q.x);
    };
    // the tile of the ring round the hero at that angle
    const ringTile = a => ({ x: Math.round($gamePlayer._realX + Math.cos(a) * WOLF.ring), y: Math.round($gamePlayer._realY + Math.sin(a) * WOLF.ring * 0.8) });
    // pacing: a step or two along the ring, to one side and then the other - to an open tile other than the one it stands on (false:
    // there is none)
    Game_Animal.prototype.paceOn = function(turn) {
        const ok = this.slotOk(), side = this._paceSide = -(this._paceSide || 1);
        for (const off of [0.35 * side, 0.6 * side, -0.35 * side, -0.6 * side, 0]) {
            const q = ringTile(turn + this._slot + off);
            if ((q.x !== this._x || q.y !== this._y) && ok(q)) { this._paceOff = off; return true; }
        }
        return false;
    };
    // whose turn it is: the stalking wolf nearest to him, one with a clear leap before one without, not the last one if another can
    function pickAttacker(pack) {
        let best = null, bestS = Infinity;
        for (const m of liveMembers(pack)) {
            if (m._mode !== "stalk" || m._stun > 0) continue;
            const d = m.playerDistance(), s = d + (m.clearRun() ? 0 : 2.5) + (pack.last === m ? 1.5 : 0) + (d <= WOLF.near ? 2 : 0);
            if (s < bestS) { bestS = s; best = m; }
        }
        return best;
    }
    // the pack's attacker without a clear leap at him (a tree, a bush in between): it goes round to a place near him with one
    // (runSpot), then barks and leaps; given up when it takes too long or gets nowhere (the pack waits a moment)
    Game_Animal.prototype.thinkClose = function(dist) {
        const clear = dist < WOLF.lunge + 0.9 && this.clearRun(), windup = () => { this.setMode("windup", WOLF.windup); this.turnTowardCharacter($gamePlayer); growl(this); };
        if (clear && (dist > WOLF.near || WOLF.close - this._modeT > 60)) { windup(); return; }   // (right beside him: a moment to back off, then a snap from there)
        const spot = this.runSpot(WOLF.near + 0.4, WOLF.lunge, true);
        if (spot === null && clear) { windup(); return; }
        if (this._modeT <= 0 || spot === null) { this.callOff(30); return; }
        if (!spot) return;   // (no search this frame: the next one)
        const r = path8(this, spot.x, spot.y, { animal: true, key: "close" });
        if (!takeStep(this, r.dir)) this.turnTowardCharacter($gamePlayer);
        if (stalled(this, "close", Math.hypot(this._x - spot.x, this._y - spot.y), 0.5, spot.x, spot.y)) { this.badSpot(spot); unstall(this); }
    };
    // an attack called off before the leap (he is behind a tree, no way round to him): back to the ring, the pack waits a moment
    Game_Animal.prototype.callOff = function(wait) {
        const pack = this._pack;
        if (pack && pack.attacker === this) { pack.attacker = null; pack.nextAttack = Math.max(pack.nextAttack, wait || 30); }
        this.setMode("stalk");
    };
    // the leap: of the tiles within WOLF.lunge it can leap to along a clear line (never over a tree or into one; his own tile is fine),
    // the one nearest to him - his tile, else the one beside it (at the map's edge, by a wall, his tile may be no landing)
    Game_Animal.prototype.leap = function() {
        const G = pathGrid(), px = $gamePlayer._realX, py = $gamePlayer._realY, R = WOLF.lunge;
        let lx = 0, ly = 0, best = Math.hypot(this._x - px, this._y - py) - 0.01;
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
            const x = this._x + dx, y = this._y + dy, him = x === $gamePlayer.x && y === $gamePlayer.y, d = Math.hypot(x - px, y - py);
            if (d >= best || !$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f) || (window.Farming && Farming.buildingAt(x, y))) continue;
            if (!(him || gridOpen(G, x, y, true)) || !clearLine(G, this._x, this._y, x, y, true, !him)) continue;
            best = d;
            lx = dx;
            ly = dy;
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
        const pack = animal._pack;   // (the attacker killed in its leap: its turn was never given back - the pack waited for good)
        if (pack && pack.attacker === animal) { pack.attacker = null; pack.nextAttack = Math.max(pack.nextAttack, WOLF.gap[0]); }
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
            if (!$gameMap.isValid(sx, sy) || !$gameMap.checkPassage(sx, sy, 0x0f) || !canLeave(sx, sy) || animals.some(a => a._x === sx && a._y === sy)) continue;
            if (window.Farming && (Farming.buildingAt(sx, sy) || Farming.hasObjectTile(sx, sy))) continue;
            if ($gameMap.eventsXyNt(sx, sy).some(e => e.isNormalPriority())) continue;
            members.push(spawn("wolf", sx, sy));
        }
        return members.length ? makePack(members) : null;
    }
    // ---- a night outdoors: in the wolves' hours a pack of this map may find the sleeper (Farming's sleepInTent asks; never in the hut)
    const RAID = { perHour: 0.06, fire: 0.5, near: 9, dogNear: 13,   // near: tiles off when it wakes him (dogNear: the dog heard them first)
        calm: 0.1, calmDays: 3, fullDay: 10 };   // the first days are calm: x0.1 till day 3, then up evenly to the full chance on day 10
    // the chance a pack comes in one hour of sleep on `day` (fire: a lit fire by the bed halves it)
    function raidChance(day, fire) {
        const k = day <= RAID.calmDays ? RAID.calm : day >= RAID.fullDay ? 1 : RAID.calm + (1 - RAID.calm) * (day - RAID.calmDays) / (RAID.fullDay - RAID.calmDays);
        return RAID.perHour * k * (fire ? RAID.fire : 1);
    }
    let dawnSaid = false;
    // the clock hour (day * 24 + hour) a pack comes while he sleeps from `from` to `to` (clock hours), or null
    function nightRaid(from, to, opts) {
        if (!ENABLED || !((mapTargets().wolf || 0) > 0)) return null;
        for (let t = Math.floor(from) + 1; t < to; t++) {   // (the whole hours after lying down; from/to = day * 24 + hour)
            const h = ((t % 24) + 24) % 24;
            if (!SPECIES.wolf.hours.some(([a, b]) => h >= a && h < b)) continue;
            if (Math.random() < raidChance(Math.floor(t / 24), opts && opts.fire)) return t;
        }
        return null;
    }
    // the pack that woke him: 2-4 wolves some tiles off, already after him
    function raidPack(dogWarned) {
        const spots = spotsOfMap() || [], px = $gamePlayer.x, py = $gamePlayer.y, want = dogWarned ? RAID.dogNear : RAID.near;
        let best = null;
        for (const s of spots) {
            const d = Math.hypot(s.x - px, s.y - py);
            if (d < want - 1.5) continue;
            const score = Math.abs(d - want);
            if (!best || score < best.score) best = { s, score };
        }
        if (!best) return null;
        const [lo, hi] = SPECIES.wolf.pack, n = lo + Math.floor(Math.random() * (hi - lo + 1));
        const pack = spawnPack(best.s.x, best.s.y, n);
        if (pack && pack.members.length) wolfEngage(pack.members[0]);
        return pack;
    }
    function countOf(kind) {
        return animals.filter(a => a.kind() === kind).length;
    }
    // out of its hours an animal goes home - but not one called up with F9 (Debug.js), nor a boar or a wolf still in a fight
    // (it goes once it has calmed down), so nothing vanishes in front of the hero
    const staysOut = a => a._summoned || a._engaged || (SPECIES[a.kind()].aggressive && a._mode !== "roam" && a._mode !== "flee") ||
        (a._dawn && a._mode === "flee" && onScreen(a));   // (the wolves leaving at dawn: they run out of sight first)
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
    // where he faces, a unit vector - on the slant too: HeroLook.js keeps the 8-way facing (_heroDir8) that goes with the 4-way one
    // (with only the four ways, a spear jab never reached a boar standing on the slant - the user's, 2026-09-26)
    const FITS8 = { 2: [2, 1, 3], 4: [4, 1, 7], 6: [6, 3, 9], 8: [8, 7, 9] };
    function facingVector() {
        const d4 = $gamePlayer.direction(), d8 = $gamePlayer._heroDir8;
        const v = DIR_VEC[d8 && FITS8[d4] && FITS8[d4].includes(d8) ? d8 : d4] || [0, 1], len = Math.hypot(v[0], v[1]);
        return [v[0] / len, v[1] / len];
    }
    // turns him to (dx, dy): the 4-way direction and, on the slant, the 8-way facing too
    function faceSlant(dx, dy) {
        faceVector(dx, dy);
        const d8 = [6, 3, 2, 1, 4, 7, 8, 9][((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8];
        if (FITS8[$gamePlayer.direction()].includes(d8)) $gamePlayer._heroDir8 = d8;
    }
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
    // a beaten one that ran off into the forest: it counts for today on this map (no fresh one takes its place before dawn), not as a kill
    function tallyGone(animal) {
        const mapId = $gameMap.mapId(), h = hunt(), rec = h.killed[mapId] && h.killed[mapId].day === day() ? h.killed[mapId] : (h.killed[mapId] = { day: day() });
        rec[animal.kind()] = (rec[animal.kind()] || 0) + 1;
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
            const held = e.c.held, blood = e.sprite.children[0], body = e.sprite.children[1];   // (held: in the dog's mouth, Dog.js)
            e.sprite.z = held ? (held.dir === 8 ? 2.9 : 3.6) : 2.2;
            e.sprite.scale.set(held ? held.scale || 0.8 : 1, held ? held.scale || 0.8 : 1);
            if (blood) blood.visible = !held;
            if (body) { body.rotation = held ? (held.dir === 4 ? 0.8 : held.dir === 6 ? -0.8 : 0) : 0; body.scale.y = held ? 1 : -1; }
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
        pgrid.mapId = -1;
    };
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        animals = [];
        packs = [];
        projectiles = [];
        spotCache = { mapId: 0, spots: null };
        pgrid.mapId = -1;
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

    // ------------------------------------------------------------------
    // The 8-way looks (the user's, 2026-09-26: "swobodny ruch w 8 kierunkach i animacje też"): img/characters/anim8/<Kind>_<Motion>8.png
    // are 8 rows (S, SW, W, NW, N, NE, E, SE) x 9 cells - column 0 standing, 1-8 the cycle, the feet on the old sheets' line. They stand
    // in for the old 4-way sheets while an animal walks, runs or stalks (the dog lying, barking and the like keep the old ones); the
    // facing comes from the way it really moves, the frame from the way it has come (like HeroLook.js does for the hero). Not the
    // animals in the yards (Livestock.js) - their sheets are not in the list.
    // ------------------------------------------------------------------
    const LOOK8 = {   // old sheet -> the 8-way one; cell: its square cell; stride: tiles for one cycle of the legs
        "$Animal_Dog": { sheet: "anim8/Dog_Walk8", cell: 68, stride: 1.5 },
        "$Animal_Dog_Run": { sheet: "anim8/Dog_Run8", cell: 68, stride: 2.6 },
        "$Animal_Dog_Stalk": { sheet: "anim8/Dog_Stalk8", cell: 68, stride: 1.2 },
        "$Animal_Wolf": { sheet: "anim8/Wolf_Walk8", cell: 68, stride: 1.5 },
        "$Animal_Wolf_Run": { sheet: "anim8/Wolf_Run8", cell: 68, stride: 2.6 },
        "$Animal_Wolf_Stalk": { sheet: "anim8/Wolf_Stalk8", cell: 68, stride: 1.2 },
        "$Animal_Boar": { sheet: "anim8/Boar_Walk8", cell: 76, stride: 1.4 },
        "$Animal_Boar_Run": { sheet: "anim8/Boar_Run8", cell: 76, stride: 2.4 },
        "$Animal_Deer": { sheet: "anim8/Deer_Walk8", cell: 75, stride: 1.8, run: { sheet: "anim8/Deer_Run8", cell: 75, stride: 3.2 } },
        "$Animal_Rabbit": { sheet: "anim8/Rabbit_Hop8", cell: 56, stride: 1.1 }
    };
    const LOOK8_ROW = { 2: 0, 1: 1, 4: 2, 7: 3, 8: 4, 9: 5, 6: 6, 3: 7 };
    const LOOK8_OCT = { 0: 6, 1: 3, 2: 2, 3: 1, 4: 4, "-4": 4, "-3": 7, "-2": 8, "-1": 9 };   // octant of the move (y down) -> numpad
    const LOOK8_FITS = { 2: [2, 1, 3], 4: [4, 1, 7], 6: [6, 3, 9], 8: [8, 7, 9] };
    let look8On = true;   // (tests may switch them off: the old sheets)
    function look8For(ch) {
        if (!look8On || !ch || ch._pose || ch === $gamePlayer) return null;   // (the dog lying / asleep: its old sheet)
        const look = LOOK8[ch.characterName()];
        if (!look) return null;
        return look.run && (ch.realMoveSpeed() >= 4.5 || ch._fleeing) ? look.run : look;
    }
    const _look8UpdateBitmap = Sprite_Character.prototype.updateBitmap;
    Sprite_Character.prototype.updateBitmap = function() {
        const look = look8For(this._character);
        if (look) {
            if (this._look8Sheet !== look.sheet) {
                this._look8Sheet = look.sheet;
                this.bitmap = ImageManager.loadCharacter(look.sheet);
            }
            // (not an empty name: that hides the sprite - isEmptyCharacter; the dog coming out of its kennel stayed invisible)
            this._characterName = look.sheet;
            this._tileId = 0;
            this._look8 = look;
            return;
        }
        if (this._look8Sheet) { this._look8Sheet = null; this._look8 = null; this._characterName = null; }   // (the old sheet is loaded again)
        _look8UpdateBitmap.call(this);
    };
    const _look8PatternWidth = Sprite_Character.prototype.patternWidth;
    Sprite_Character.prototype.patternWidth = function() { return this._look8 && this.bitmap ? this._look8.cell : _look8PatternWidth.call(this); };
    const _look8PatternHeight = Sprite_Character.prototype.patternHeight;
    Sprite_Character.prototype.patternHeight = function() { return this._look8 && this.bitmap ? this._look8.cell : _look8PatternHeight.call(this); };
    const _look8UpdateFrame = Sprite_Character.prototype.updateFrame;
    Sprite_Character.prototype.updateFrame = function() {
        const look = this._look8, ch = this._character;
        if (!look || !ch) return _look8UpdateFrame.call(this);
        // how it moved since the last frame: the facing (smoothed, a turn held a few frames so it does not flicker) and the legs
        const x = ch._realX, y = ch._realY, dx = this._l8x === undefined ? 0 : x - this._l8x, dy = this._l8y === undefined ? 0 : y - this._l8y;
        this._l8x = x; this._l8y = y;
        const d = Math.hypot(dx, dy);
        if (d > 0.0005 && d < 1.5) {
            this._l8vx = (this._l8vx || 0) * 0.6 + dx;
            this._l8vy = (this._l8vy || 0) * 0.6 + dy;
            const want = LOOK8_OCT[Math.round(Math.atan2(this._l8vy, this._l8vx) / (Math.PI / 4))];
            if (!this._l8dir || want === this._l8dir) { this._l8dir = want; this._l8turn = 0; }
            else if (++this._l8turn >= 4) { this._l8dir = want; this._l8turn = 0; }
            this._l8step = (this._l8step || 0) + d;
            this._l8still = 0;
        } else {
            this._l8still = (this._l8still || 0) + 1;
            // turned where it stands (towards the hero, a growl): the 8-way facing follows the 4-way one
            const d4 = ch.direction();
            if (!this._l8dir || !(LOOK8_FITS[d4] || []).includes(this._l8dir)) this._l8dir = d4;
        }
        const cell = look.cell, n = Math.max(1, Math.round(this.bitmap.width / cell) - 1);
        const moving = this._l8still < 6 || ch.isJumping();
        const col = moving ? 1 + Math.min(n - 1, Math.floor((((this._l8step || 0) / look.stride) % 1) * n)) : 0;
        this.setFrame(col * cell, (LOOK8_ROW[this._l8dir] || 0) * cell, cell, cell);
    };
    // the sheets come with the map, so the first step does not wait for them
    const _look8MapCreate = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _look8MapCreate.call(this);
        if (look8On) for (const k of Object.keys(LOOK8)) { ImageManager.loadCharacter(LOOK8[k].sheet); if (LOOK8[k].run) ImageManager.loadCharacter(LOOK8[k].run.sheet); }
    };

    window.Hunting = { auto: v => { auto = !!v; }, LOOK8, look8: v => { look8On = !!v; }, animate: v => { animate = !!v; }, SPECIES, WEAPONS, spawn, shoot, populate, hit, kill, removeAnimal, mapTargets,
        get animals() { return animals; }, get projectiles() { return projectiles; }, hunt, killedToday, pickWeapon, updateProjectiles,
        // sneaking, awareness, aiming, and the hooks for other hunters' targets (Birds.js)
        sneaking, setSneak, noticeRate, facingVector, faceSlant, DIR_VEC, updateAwareness, updateMark, coverBetween, startAim, updateAim, fireAimed, endAim, get aim() { return aim; },
        // the spear and the boar
        SPEAR, BOAR, thrust, spearTarget, pressShoot, gore, enrage, get cooldown() { return cooldown; }, resetCooldown: () => { cooldown = 0; },
        allTargets, addTargets: fn => { targetSources.push(fn); }, onNoise: fn => { noiseListeners.push(fn); }, makeNoise, snareUnseen, rabbitHours,
        get playerStep() { return playerStep; },
        // combat (Combat.js): the animal class, the wolves, the hooks
        YIELD, CARCASS, dropCarcass, removeCarcass, carcasses: () => carcassList(), carcassAhead, dressCarcass, takeFromSnare,
        Game_Animal, WOLF, RAID, raidChance, nightRaid, raidPack, get packs() { return packs; }, spawnPack, makePack, wolfEngage, stagger, knockBack, atkOf, onKill: fn => { killListeners.push(fn); },
        // the way round what is in the way (8 directions) and the stuck watch: the animals here and the dog (Dog.js)
        PATH, STUCK, path8, pathGrid, clearLine, stalled, unstall, avoidTile, takeStep };
})();
