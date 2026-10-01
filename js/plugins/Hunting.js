//=============================================================================
// Hunting.js
//=============================================================================
// Wild animals and the hunt. Split in four (2026-09-29): this file holds the data (the species, the wolves, the night raids, the
// 8-way looks), the saved state, sneaking and the animals' senses, spawning, the night raids, the snares looked after while the hero
// is away, the map's clock, the API (window.Hunting) and EVERY engine hook. Hunting_Path.js (the way round what is in the way, in 8
// directions - the dog's too), Hunting_AI.js (the animal: grazing, flight, the snares' bait, the boar, the wolves) and
// Hunting_Weapons.js (the sling and the bow, aiming, the spear, a hit and a kill, the carcasses) are functions and classes only.

/*:
 * @target MZ
 * @plugindesc Polowanie i dzikie zwierzęta: zające i jelenie płoszą się, dzik szarżuje, nocą polują watahy wilków. Proca, łuk, broń wręcz (Combat.js) - tryb walki (Tab), klawisz O. v1.3.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
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
 *
 * STAN W ZAPISIE (rdzeń TawernaCore): $gameSystem._tw.hunt (ile zwierząt
 * każdego gatunku upolowano, co ubito dziś na której mapie, skradanie) i
 * $gameSystem._tw.carcasses (zwłoki na mapach). Stare zapisy z
 * $gameSystem._hunt, _carcasses i _sneak są przejmowane; stare nazwy dalej
 * prowadzą do nowego miejsca.
 *
 * SZYNA ZDARZEŃ (Tawerna.on): kill { kind, by, how, mapId, x, y, level,
 * bounty?, animal } - ubite zwierzę (strzał, oszczep, cios, pies); shot
 * { weapon, hit, kind, x, y } - kamień z procy albo strzała skończyła lot
 * (trafiła: kind - co; nie: kind "").
 *
 * PLIKI (2026-09-29 podzielone): Hunting.js (dane, stan, API, skradanie i
 * czujność, pojawianie się zwierząt, nocne napady, pułapki pod nieobecność,
 * WSZYSTKIE haki silnika - ten), Hunting_Path.js (droga w 8 kierunkach -
 * także psa), Hunting_AI.js (zwierzę: pasienie, ucieczka, przynęta, dzik,
 * wilki), Hunting_Weapons.js (proca, łuk, celowanie, oszczep, trafienie,
 * zwłoki i oprawianie). Kolejność na liście wtyczek: Hunting, Hunting_Path,
 * Hunting_AI, Hunting_Weapons. Dopóki części nie są wpisane, ten plik
 * wczytuje je sam.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("Hunting.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    // the family's shared bag: this file (P.core), Hunting_Path.js (P.path), Hunting_AI.js (P.ai), Hunting_Weapons.js (P.weapons) - the
    // parts are read when needed
    const P = T.api("Hunting_parts") || T.register("Hunting_parts", {});
    const missing = file => { throw new Error("Hunting.js: brak " + file + " (a part of Hunting.js)"); };
    const PA = () => P.path || missing("Hunting_Path.js");
    const AI = () => P.ai || missing("Hunting_AI.js");
    const W = () => P.weapons || missing("Hunting_Weapons.js");

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
    // biteFrom: no bite before that frame of the leap; near: too close to start one; pace: frames it stands at its place on the ring
    // before it paces a little along it; close: the frames the pack's attacker may take to go round to a clear leap
    const WOLF = { ring: 3.2, windup: 38, recover: 44, gap: [60, 140], bite: 0.95, biteFrom: 6, lunge: 3, near: 1.6, engage: 6, lose: 16, flee: 0.25, pace: 50, close: 240 };
    // ---- a night outdoors: in the wolves' hours a pack of this map may find the sleeper (Farming's sleepInTent asks; never in the hut)
    const RAID = { perHour: 0.06, fire: 0.5, near: 9, dogNear: 13,   // near: tiles off when it wakes him (dogNear: the dog heard them first)
        calm: 0.1, calmDays: 3, fullDay: 10 };   // the first days are calm: x0.1 till day 3, then up evenly to the full chance on day 10
    // the 8 ways (numpad); VEC_DIR: a step (dx, dy) -> its way, DIR_VEC: back (the slants: the hero's 8-way facing too)
    const DIRS8 = [2, 4, 6, 8, 1, 3, 7, 9];
    const VEC_DIR = { "0,1": 2, "-1,0": 4, "1,0": 6, "0,-1": 8, "-1,1": 1, "1,1": 3, "-1,-1": 7, "1,-1": 9 };
    const DIR_VEC = { 1: [-1, 1], 2: [0, 1], 3: [1, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 8: [0, -1], 9: [1, -1] };   // (the slants: the hero's 8-way facing)
    // the tiles off the map's edge a leaving animal runs to (Hunting_Path.js: escapeSpot)
    const EDGE = 2;
    // really on the screen (the engine's isNearTheScreen allows a whole screen more on every side)
    const onScreen = ch => { const x = ch.screenX(), y = ch.screenY(), m = $gameMap.tileWidth(); return x > -m && x < Graphics.width + m && y > -m && y < Graphics.height + 2 * m; };

    // ------------------------------------------------------------------
    // Saved data (TawernaCore): _tw.hunt = { kills: { rabbit: n, deer: n }, killed: { mapId: { day, rabbit: n, deer: n } }, sneak } -
    // an older save's $gameSystem._hunt is taken over (the old name stays a hidden way there: Journal.js and HomeDecor.js read it);
    // _tw.carcasses = { mapId: [carcass] } (Hunting_Weapons.js; an older save's _carcasses the same). The sneaking switch was
    // $gameSystem._sneak: that name (on Game_System.prototype, never saved) leads to hunt.sneak now.
    // ------------------------------------------------------------------
    const huntState = T.state.define("hunt", () => ({ kills: {}, killed: {}, sneak: false }), { version: 1, adopt: "_hunt", owner: "Hunting" });
    const carcassState = T.state.define("carcasses", () => ({}), { version: 1, adopt: "_carcasses", owner: "Hunting" });
    const hunt = () => huntState();
    Object.defineProperty(Game_System.prototype, "_sneak", { configurable: true, enumerable: false,
        get() { const h = this === window.$gameSystem ? huntState() : this._tw && this._tw.hunt; return h ? h.sneak : undefined; },
        set(v) {
            if (this === window.$gameSystem) huntState().sneak = !!v;
            else Object.defineProperty(this, "_sneak", { value: v, writable: true, enumerable: true, configurable: true });
        } });
    T.on("load", () => {   // (a save from before: its own _sneak moves in, the prototype's way takes over)
        const sys = $gameSystem;
        if (!Object.prototype.hasOwnProperty.call(sys, "_sneak")) return;
        const v = sys._sneak;
        delete sys._sneak;
        huntState().sneak = !!v;
    }, { owner: "Hunting", priority: -10 });
    function killedToday(mapId, kind) {
        const rec = hunt().killed[mapId];
        return rec && rec.day === day() ? rec[kind] || 0 : 0;
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
    const hours = () => T.time.hour();
    const day = () => T.time.day();

    // a sound from the core's safe pool (a missing file stays silent; pan -100..100); a popup over the hero (in a menu: its help line)
    const se = (name, volume, pitch, pan) => T.audio.se(name, { volume, pitch, pan: pan || 0 });
    const popup = (icon, text, color) => T.popup(text, { icon, color, kind: "good", menu: true });
    // the hero's skills (Combat.js, Skills_Data.js): perk(key) = what the learnt skills add up to for an effect, perkRoll(key) = a
    // roll against it (a chance), knowsSkill(id) = that one skill is learnt
    const C = () => T.api("Combat");
    const perk = key => T.call("Combat", "perk", key) || 0;
    const perkRoll = key => { const c = perk(key); return c > 0 && Math.random() < c; };
    const knowsSkill = id => !!T.call("Combat", "hasSkill", id);
    // free to act on the map (the sneak key, the shoot key): he can move; no message, event, farm menu, building being placed or scene change
    const FREE_PLAY = { only: ["canMove", "message", "event", "farmMenu", "build", "sceneChange"] };
    const canShoot = () => T.isCalm(null, FREE_PLAY);

    let animals = [];
    let packs = [];
    let spotCache = { mapId: 0, spots: null };

    // ------------------------------------------------------------------
    // What lives on this map
    // ------------------------------------------------------------------
    function mapTargets() {
        const tag = T.mapTag("Hunt");   // <Hunt:rabbit=3,deer=1> / <Hunt:off> in the map's note
        if (tag) {
            if (/^off$/i.test(tag.raw)) return {};
            const out = {};
            for (const pair of tag.raw.split(",")) {
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
        const F = T.api("Farming");
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
    // Sneaking (C switches it on and off): slower, never running, a crouched walk (its own sheet), quieter steps
    // (Atmosphere.js asks Hunting.sneaking()), and the animals and birds notice the player much later (noticeRate).
    // ------------------------------------------------------------------
    const SNEAK_SHEET = "$Reid_Poor_Sneak";
    const sneaking = () => !!($gameSystem && huntState().sneak);
    function setSneak(on) {
        huntState().sneak = !!on;
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
        const d = Math.hypot(bx - ax, by - ay), n = Math.floor(d / 0.5), F = T.api("Farming");
        for (let i = 1; i < n; i++) {
            const tx = Math.floor(ax + (bx - ax) * i / n), ty = Math.floor(ay + (by - ay) * i / n);
            if (F && F.buildingAt(tx, ty)) return true;
            if ($gameMap.eventsXy(tx, ty).some(e => e.isNormalPriority() && (e.characterName() !== "" || e.tileId() > 0))) return true;
        }
        return false;
    }
    // per frame, for something at (x, y) (tiles, centre) that watches `sight` tiles around it; 0 = does not notice him
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
        const bmp = new Bitmap(20, 24), UI = T.api("UITheme") || {};
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
    // the badge while sneaking: a small plate at the bottom of the screen
    function Sprite_SneakBadge() {
        this.initialize(...arguments);
    }
    Sprite_SneakBadge.prototype = Object.create(Sprite.prototype);
    Sprite_SneakBadge.prototype.constructor = Sprite_SneakBadge;
    Sprite_SneakBadge.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(170, 30));
        const bmp = this.bitmap, S = T.api("UITheme");
        if (S) S.panel(bmp.context, 0, 0, 170, 30, { cut: 4 });
        bmp.fontSize = 17;
        bmp.textColor = (S && S.text) || "#eceef0";
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
        const a = new (AI().Game_Animal)(kind, x, y);
        animals.push(a);
        addSprite(a);
        return a;
    }
    // a pack of `n` wolves round (x, y) (where there is room); returns the pack
    function spawnPack(x, y, n) {
        const members = [], F = T.api("Farming");
        const spots = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [-2, 0], [0, 2]];
        for (const [ox, oy] of spots) {
            if (members.length >= n) break;
            const sx = x + ox, sy = y + oy;
            if (!$gameMap.isValid(sx, sy) || !$gameMap.checkPassage(sx, sy, 0x0f) || !canLeave(sx, sy) || animals.some(a => a._x === sx && a._y === sy)) continue;
            if (F && (F.buildingAt(sx, sy) || F.hasObjectTile(sx, sy))) continue;
            if ($gameMap.eventsXyNt(sx, sy).some(e => e.isNormalPriority())) continue;
            members.push(spawn("wolf", sx, sy));
        }
        return members.length ? AI().makePack(members) : null;
    }
    // the chance a pack comes in one hour of sleep on `day` (fire: a lit fire by the bed halves it)
    function raidChance(day, fire) {
        const k = day <= RAID.calmDays ? RAID.calm : day >= RAID.fullDay ? 1 : RAID.calm + (1 - RAID.calm) * (day - RAID.calmDays) / (RAID.fullDay - RAID.calmDays);
        return RAID.perHour * k * (fire ? RAID.fire : 1);
    }
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
        if (pack && pack.members.length) AI().wolfEngage(pack.members[0]);
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
        if (!ENABLED || !$gameMap || !$dataMap || !spriteset() || !T.api("Farming")) return;
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

    // While the player does not see it - on another map, or asleep (the clock jumps) - a baited snare may catch a rabbit all the same:
    // every hour the rabbits of this map are about (SPECIES.rabbit.hours) while the bait lies there gives lure.awayChance. b.watch:
    // the clock hour up to which the snare has been looked after (by the live rabbits while the player is on the map, or by this).
    function rabbitHours(from, to) {
        let n = 0;
        for (let t = from; t < to; t += 0.25) { const h = ((t % 24) + 24) % 24; if (SPECIES.rabbit.hours.some(([a, b]) => h >= a && h < b)) n += 0.25; }
        return n;
    }
    function snareUnseen() {
        const F = T.api("Farming");
        if (!F || !F.snares || !F.clockHours) return;
        const now = F.clockHours(), rabbits = (mapTargets().rabbit || 0) > 0;
        for (const b of F.snares()) {
            const from = b.watch === undefined ? now : b.watch;
            b.watch = now;
            const bait = b.bait, lure = F.BUILDINGS[b.type].lure;
            if (now - from < 0.25 || !bait || !rabbits || F.snareSprung(b)) continue;
            const hours = rabbitHours(Math.max(from, bait.at !== undefined ? bait.at : bait.until - lure.baitHours), Math.min(now, bait.until));
            if (hours > 0 && Math.random() < 1 - Math.pow(1 - Math.min(0.9, lure.awayChance * (1 + perk("snare.lure"))), hours)) {
                F.snareCatch(b);
                hunt().kills.rabbit = (hunt().kills.rabbit || 0) + 1;
            } else F.snareBait(b);   // (gone off meanwhile: it is cleared)
        }
    }

    // ------------------------------------------------------------------
    // The map drives it: the bus (a loaded game, a map entered) and the map's clock (after the map, the events and the old-style hooks)
    // ------------------------------------------------------------------
    // loading a save must not keep the animals of the game that was running (their sprites are gone with the old scene); a map entered:
    // nothing of the last one either (and its carcasses' pictures), and the carcasses of this one rot
    function clearMap() {
        animals = [];
        packs = [];
        W().clearShots();
        spotCache = { mapId: 0, spots: null };
        PA().resetGrid();
    }
    T.on("load", clearMap, { owner: "Hunting" });
    T.on("mapEnter", () => {
        clearMap();
        W().clearCarcassSprites();
        if ($gameSystem) W().rotCarcasses();
    }, { owner: "Hunting" });
    // the F9 menu (Debug.js) asks for an animal near the hero: Hunting.pending = "boar" | "deer" | "wolves"
    function summoned() {
        if (API.pending === "boar") {   // the F9 menu (Debug.js): a boar 5-8 tiles away
            API.pending = null;
            const spots = (spotsOfMap() || []).filter(s => { const d = Math.hypot(s.x - $gamePlayer.x, s.y - $gamePlayer.y); return d >= 5 && d <= 8; });
            if (spots.length) { const s = spots[Math.floor(Math.random() * spots.length)]; spawn("boar", s.x, s.y)._summoned = true; popup(ITEM.spear && $dataItems[ITEM.spear] ? $dataItems[ITEM.spear].iconIndex : 0, "Gdzieś blisko chrząka dzik...", "#ffd98f"); }
            else popup(0, "Nie ma tu miejsca dla dzika", "#bcd8ff");
        }
        if (API.pending === "deer") {   // the F9 menu: a deer 6-9 tiles away, whatever the hour (it stays: _summoned)
            API.pending = null;
            const spots = (spotsOfMap() || []).filter(s => { const d = Math.hypot(s.x - $gamePlayer.x, s.y - $gamePlayer.y); return d >= 6 && d <= 9; });
            if (spots.length) { const s = spots[Math.floor(Math.random() * spots.length)]; spawn("deer", s.x, s.y)._summoned = true; popup($dataItems[157] ? $dataItems[157].iconIndex : 0, "Niedaleko pasie się jeleń...", "#ffd98f"); }
            else popup(0, "Nie ma tu miejsca dla jelenia", "#bcd8ff");
        }
        if (API.pending === "wolves") {   // the F9 menu: a pack of 3 wolves 7-10 tiles away
            API.pending = null;
            const spots = (spotsOfMap() || []).filter(s => { const d = Math.hypot(s.x - $gamePlayer.x, s.y - $gamePlayer.y); return d >= 7 && d <= 10; });
            const s = spots.length ? spots[Math.floor(Math.random() * spots.length)] : null;
            const pack = s ? spawnPack(s.x, s.y, 3) : null;
            if (pack) { for (const w of pack.members) w._summoned = true; popup(0, "W ciemności błyszczą oczy... wilki!", "#ffd98f"); }
            else popup(0, "Nie ma tu miejsca dla watahy", "#bcd8ff");
        }
    }
    let populateWait = 0, snareWait = 0, rotWait = 0;
    let auto = true;   // tests switch the automatic refilling off
    T.onMapUpdate(() => {
        if (!ENABLED || !$gamePlayer) return;
        const Wp = W();
        trackPlayer();
        Wp.countDown();
        if (auto && --populateWait <= 0) { populateWait = 90; populate(); }
        if (--snareWait <= 0) { snareWait = 60; snareUnseen(); }
        if (--rotWait <= 0) { rotWait = 120; Wp.rotCarcasses(); }
        Wp.updateCarcassSprites();
        summoned();
        for (const a of animals) if (!a._sprite || !a._sprite.parent) addSprite(a);   // never leave an animal without a picture
        Wp.updateProjectiles();
        if (Input.isTriggered("sneak") && canShoot()) setSneak(!sneaking());
        Wp.updateShootKey();   // (aiming while the key is held, the shot when it is let go; the key pressed: aim or jab)
    }, { owner: "Hunting", name: "update" });

    // ------------------------------------------------------------------
    // Engine hooks. Every one Hunting has is in this file, so they keep Hunting's place in the plugin list whether its parts are
    // listed or put into the page by this file at the end (the parts are functions and classes only). (Sneaking: above.)
    // ------------------------------------------------------------------
    // the animals move with the map (inside its update: they hold still with the world in Combat.js's hitstop)
    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        for (const a of animals.slice()) a.update();
    };
    // sprites of the animals that exist when the spriteset is (re)built, e.g. after a menu; the aiming circle (Hunting_Weapons.js)
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        for (const a of animals) { a._sprite = null; a._markSprite = null; addSprite(a, this); }
        this._aimReticle = new (W().Sprite_AimReticle)();
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
    // the action button in front of a carcass: dressed with a knife (Hunting_Weapons.js)
    const _Game_Player_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok")) {
            const Wp = W(), c = Wp.carcassAhead();
            if (c) return Wp.dressCarcass(c);
        }
        return _Game_Player_triggerButtonAction.call(this);
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
        if (Math.abs(dx) > 0.0005) this._l8side = dx > 0 ? 6 : 4;   // (the last way it went sideways: for a look whose up and down rows are wanting)
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
        // a sheet may say which of its rows to use for a facing (look.rows(dir, moving, side) -> a numpad dir): some have no good
        // back views - the cat's walking up rows show its face, as if it went backwards (user 2026-10-01)
        const dir = look.rows ? look.rows(this._l8dir, moving, this._l8side || 6) : this._l8dir;
        this.setFrame(col * cell, (LOOK8_ROW[dir] || 0) * cell, cell, cell);
    };
    // the sheets come with the map, so the first step does not wait for them
    const _look8MapCreate = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _look8MapCreate.call(this);
        if (look8On) for (const k of Object.keys(LOOK8)) { ImageManager.loadCharacter(LOOK8[k].sheet); if (LOOK8[k].run) ImageManager.loadCharacter(LOOK8[k].run.sheet); }
    };

    // ------------------------------------------------------------------
    // For the parts, and window.Hunting (the same names as before the split)
    // ------------------------------------------------------------------
    const targetSources = [], noiseListeners = [];   // (Birds.js adds its birds and listens to the shots while it loads: here, not in a part)
    P.core = { ENABLED, ITEM, SPECIES, WOLF, RAID, EDGE, DIRS8, DIAGONAL, STEP, VEC_DIR, DIR_VEC, huntState, carcassState, hunt, killedToday, tally, tallyGone,
        hours, day, se, popup, C, perk, perkRoll, knowsSkill, canShoot, sneaking, updateAwareness, updateMark, activeNow, mapTargets, spotsOfMap, onScreen,
        roamingSpriteset, roamingAddSprite, roamingDropSprite, roamingCanStep, roamingStep, roamingFleeDirection, removeAnimal, targetSources, noiseListeners,
        animals: () => animals, packs: () => packs };
    const path = name => function() { const p = PA(); return p[name].apply(p, arguments); };
    const ai = name => function() { const a = AI(); return a[name].apply(a, arguments); };
    const weapon = name => function() { const w = W(); return w[name].apply(w, arguments); };
    const API = window.Hunting = T.register("Hunting", {
        auto: v => { auto = !!v; }, LOOK8, look8: v => { look8On = !!v; }, animate: weapon("animate"), SPECIES, get WEAPONS() { return W().WEAPONS; },
        spawn, shoot: weapon("shoot"), populate, hit: weapon("hit"), kill: weapon("kill"), removeAnimal, mapTargets,
        get animals() { return animals; }, get projectiles() { return W().projectiles(); }, hunt, killedToday, pickWeapon: weapon("pickWeapon"),
        updateProjectiles: weapon("updateProjectiles"),
        // sneaking, awareness, aiming, and the hooks for other hunters' targets (Birds.js)
        sneaking, setSneak, noticeRate, facingVector: weapon("facingVector"), faceSlant: weapon("faceSlant"), DIR_VEC, updateAwareness, updateMark, coverBetween,
        startAim: weapon("startAim"), updateAim: weapon("updateAim"), fireAimed: weapon("fireAimed"), endAim: weapon("endAim"), get aim() { return W().aim(); },
        // the spear and the boar
        get SPEAR() { return W().SPEAR; }, get BOAR() { return AI().BOAR; }, thrust: weapon("thrust"), spearTarget: weapon("spearTarget"),
        pressShoot: weapon("pressShoot"), gore: ai("gore"), enrage: ai("enrage"), get cooldown() { return W().cooldown(); }, resetCooldown: weapon("resetCooldown"),
        allTargets: weapon("allTargets"), addTargets: fn => { targetSources.push(fn); }, onNoise: fn => { noiseListeners.push(fn); }, makeNoise: weapon("makeNoise"),
        snareUnseen, rabbitHours, get playerStep() { return playerStep; },
        // the carcasses (Hunting_Weapons.js)
        get YIELD() { return W().YIELD; }, get CARCASS() { return W().CARCASS; }, dropCarcass: weapon("dropCarcass"), removeCarcass: weapon("removeCarcass"),
        carcasses: weapon("carcasses"), carcassAhead: weapon("carcassAhead"), dressCarcass: weapon("dressCarcass"), takeFromSnare: weapon("takeFromSnare"),
        // the animal class (Hunting_AI.js), the wolves, the night raids (the kills: the bus's "kill" - Hunting.onKill had no users left)
        get Game_Animal() { return AI().Game_Animal; }, WOLF, RAID, raidChance, nightRaid, raidPack, get packs() { return packs; }, spawnPack,
        makePack: ai("makePack"), wolfEngage: ai("wolfEngage"), stagger: ai("stagger"), knockBack: ai("knockBack"), atkOf: ai("atkOf"),
        // the way round what is in the way (8 directions) and the stuck watch: the animals here and the dog (Dog.js) - Hunting_Path.js
        get PATH() { return PA().PATH; }, get STUCK() { return PA().STUCK; }, path8: path("path8"), pathGrid: path("pathGrid"), clearLine: path("clearLine"),
        stalled: path("stalled"), unstall: path("unstall"), avoidTile: path("avoidTile"), takeStep: path("takeStep")
    });

    // the parts not in js/plugins.js yet: put into the page here (after every plugin - functions and classes only, every engine hook
    // is above, so nothing moves in the chain)
    for (const part of ["Hunting_Path", "Hunting_AI", "Hunting_Weapons"]) {
        if (!(window.$plugins || []).some(p => p && p.name === part && p.status)) PluginManager.loadScript(part);
    }
})();
