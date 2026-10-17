//=============================================================================
// Starcia.js
//=============================================================================
// The beasts and the men fight each other (2026-10-17, the user's "całość"). Until now the animals (Hunting.js, Hunting_AI.js) and the
// men (Humans.js) went for the hero alone. Here each fighter may have someone else to fight:
//   - a wolf pack at night goes for a lone man and comes up to a bandits' camp (round it at the edge of the firelight, then the most
//     exposed of them - a sleeper at the edge, one who walked out); the men drive it off with fire (a brand from the camp fire: every
//     blow of it frightens a wolf off and burns it); nobody's wolf steps into a fire (the camp's, a lit fire of the hero's, a torch stuck
//     in the ground);
//   - the boar on its charge rams whoever stands on its line (a bandit, the dog, a wolf - and the hero, when it charges another);
//   - the bear goes for whoever comes too near, not only the hero;
//   - the archers by a camp hunt hares and deer (an arrow, the carcass fetched, the meat on a spit over the fire); a camp with an
//     archer leaves less game round it the next day;
//   - raw meat lying on the ground (a bundle thrown out of the bag, Drops.js) draws the wolves at night: by a camp it draws them
//     onto the bandits; running from a pack into a camp sets the wolves on the men;
//   - the tame dog (Dog.js) fights beside the hero against wolves, boars, bears and bandits who are after him: its own life (half
//     the hero's), it runs out of the fight when badly hurt and comes back only better; at no life it is not dead - it drags itself
//     to its kennel for a day (as always).
// How: a fighter's foe. A wolf pack, the boar and the bear keep it in `_clash` (a man, the dog); while such a one thinks, that foe stands in
// for the hero ($gamePlayer is it for the length of its brain - every move, ring, charge, leap and blow of Hunting_AI.js works on it),
// and its blow goes to the foe's takeHit (Hunting_AI.js hitTarget) instead of Combat.hitPlayer. A man's foe is Humans.js's own `_foe`
// (as for Act3.js's defenders). The choice: at most every CFG.every frames, only for those near the hero. Another's kill gives the hero
// no experience (the bus's "kill" with by: "wolf" | "boar" | "bear" | "human"); the loot lies there for him.
// The quests' men (a tag or a name of their own) and the quests' animals (a contract's, TownQuests' wolves) take no part.

/*:
 * @target MZ
 * @plugindesc Starcia: wilki napadają ludzi i obozy, ludzie odpędzają je ogniem, dzik taranuje każdego na swojej linii, niedźwiedź atakuje każdego, kto podejdzie, łucznicy przy obozie polują, mięso na ziemi ściąga wilki, pies walczy obok bohatera. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Hunting
 * @orderAfter Hunting_Weapons
 * @base Humans
 * @orderAfter Humans
 * @orderAfter Dog
 * @orderAfter Torch
 * @orderAfter Drops
 *
 * @help
 * ============================================================================
 * STARCIA - zwierzęta i ludzie walczą między sobą
 * ============================================================================
 * WILKI I LUDZIE (nocą): wataha zaczepia samotnego człowieka (bandytę na
 *   drodze, uciekiniera) i podchodzi pod obóz bandytów: krąży na skraju blasku
 *   ogniska, wyje, a po chwili rzuca się na najbardziej odsłoniętego - śpiącego
 *   na skraju obozu, tego, kto odszedł od ognia. Czuwający przy ognisku
 *   krzyczą "Wilki!", chwytają głownie z ognia i ruszają na wilki: każdy cios
 *   głownią parzy wilka i odpędza go na chwilę. Żaden wilk nie wejdzie w ogień
 *   (ognisko obozu, twoje ognisko, pochodnia wbita w ziemię) i nie skoczy na
 *   kogoś, kto stoi tuż przy nim. Walka jest prawdziwa: ciosy, życie,
 *   zachwianie; kto przegra, leży - wilka oprawisz nożem, bandytę przeszukasz.
 * DZIK w szarży taranuje każdego na swojej linii: bandytę, psa, wilka - także
 *   ciebie, gdy szarżuje na kogoś innego. Zauważy człowieka z bliska - szarżuje.
 * NIEDŹWIEDŹ atakuje każdego, kto podejdzie za blisko (staje dęba, potem łapa
 *   i przygniecenie, jak na ciebie).
 * ŁUCZNICY przy obozie polują: zając albo jeleń w zasięgu strzału - strzała,
 *   łucznik przynosi zdobycz, mięso piecze się na rożnie nad ogniskiem.
 *   Obóz z łucznikiem przerzedza zwierzynę: następnego dnia jest jej tu mniej.
 * PRZYNĘTA: surowe mięso (albo ryba) wyrzucone z plecaka (tobołek, menu P,
 *   Plecak, X) nocą zwabia wilki z daleka (ok. 18 pól) - zjedzą je. Połóż je
 *   przy obozie bandytów, a wilki zrobią resztę. Uciekasz przed watahą? Wbiegnij
 *   w obóz: wilki rzucą się na bliższych ludzi, a ludzie na wilki.
 * PADLINA: nieoprawione zwłoki zwierzęcia (zająca, jelenia, dzika, niedźwiedzia)
 *   zostawione nocą też wabią wilki - słabiej, z ok. 11 pól. Szarpią je: co pół
 *   minuty kawałek mięsa mniej, po pierwszym kęsie skóra podarta (nic z niej),
 *   po drugim ścięgno mniej; gdy mięsa nie zostanie - same kości, zwłoki znikają.
 *   Resztki po oprawianiu pachną słabo (ok. 6 pól, pół doby). Ciała ludzi nie
 *   wabią. Za pierwszym razem podpowiedź i notatka w dzienniku.
 * PIES (oswojony) staje do walki obok ciebie: z wilkami, dzikiem, niedźwiedziem
 *   i ludźmi, którzy cię atakują (nie z ludźmi z zadań). Ma własne życie
 *   (połowa twojego); mocno ranny ucieka z walki i wraca dopiero, gdy wydobrzeje.
 *   Nie ginie: bez życia wlecze się do budy i leczy się przez dobę.
 * DOŚWIADCZENIE tylko za twoje zabicia (i psa): za zabitych przez wilki,
 *   dzika, bandytów - nic. Łup leży i jest twój.
 * Nie biorą w tym udziału: ludzie z zadań (kurier, rywal w ruinach, Grum,
 *   Rafał, napastnicy z wątków - mają własne znaczniki albo imiona), zwierzę
 *   z tablicy zleceń, wilki z zadań (TownQuests), stwory podziemi.
 * F9 (Zdarzenia): "Wilki przy obozie bandytów (noc)", "Dzik i bandyta",
 *   "Niedźwiedź i bandyta".
 *
 * DLA INNYCH WTYCZEK (window.Starcia, Tawerna.api("Starcia")):
 *   Starcia.alive(kto), Starcia.freeMan(człowiek), Starcia.freeBeast(zwierzę),
 *   Starcia.setPackClash(wataha, cel), Starcia.clearPack(wataha),
 *   Starcia.setManFoe(człowiek, zwierzę), Starcia.fires(), Starcia.baits(),
 *   Starcia.tick() - jedno spojrzenie wszystkich (testy).
 * SZYNA: "kill" z by: "wolf" | "boar" | "bear" | "human" (cudze zabicie, noXp),
 *   "clash" { a, b, kind: "start" } - ktoś rzucił się na kogoś (nie bohatera).
 * Kolejność: po Hunting (i częściach), Humans, Dog, Torch, Drops. Gdy nie ma jej
 * na liście wtyczek, Humans.js wczytuje ją sam.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Starcia.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    if (T.api("Starcia")) return;   // (put into the page twice: kept as it was)
    const PLUGIN = "Starcia";
    const P = T.api("Hunting_parts");
    if (!P || !P.core || !P.ai || !P.path) throw new Error("Starcia.js: musi być pod Hunting.js i jego częściami na liście wtyczek (Hunting_AI.js is missing)");
    const H = () => T.api("Hunting"), HM = () => T.api("Humans"), DG = () => T.api("Dog"), CB = () => T.api("Combat");
    const GA = P.ai.Game_Animal, SP = P.core.SPECIES;
    const GH = () => (HM() || {}).Game_Human, GD = () => (DG() || {}).Game_Dog;
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const say = (ch, text, frames) => T.call("SpeechBubbles", "say", ch, text, frames || 150);
    const popup = (text, icon, color) => T.popup(text, { icon: icon || 0, color: color || "#ffd98f" });
    const clock = () => T.time.day() * 24 + T.time.hour();

    // ------------------------------------------------------------------
    // The numbers (tiles, frames)
    // ------------------------------------------------------------------
    const CFG = {
        every: 10,          // frames between two looks round of the fighters (the packs and beasts on one frame, the men five later)
        near: 26,           // tiles from the hero: only those this near look round (the rest keep what they have)
        tags: ["", "camp", "road", "raid", "f9", "starcia"],   // the men who take part: the plain bandits - a quest's men have tags of their own
        // notice: a pack (roaming) goes for a man or the dog this near; lose: it lets go this far; steal: one of them this near among the
        // wolves after the hero (and switchGain tiles nearer than he is) takes his place; campSmell: a camp this far draws the pack;
        // prowl: the ring round the camp's fire; prowlWait: frames it goes round before it picks the most exposed; dogFree: the dog
        // this near the hero is with him (no pack goes for it then, only for him)
        wolf: { notice: 8, lose: 15, steal: 3.2, switchGain: 2.5, campSmell: 26, prowl: 5.5, prowlWait: [300, 540], howl: [480, 900], dogFree: 4 },
        // keep: no wolf steps this near a fire; safe: nobody standing this near a fire is leapt at; brandFrom: a man this near the camp's
        // fire as he goes out at the wolves takes a brand from it (brands: at most so many in a band); fear: frames a wolf keeps off after a
        // brand's blow; burn: what the flame adds to the blow
        fire: { keep: 1.7, safe: 1.6, brandFrom: 5, brands: 2, fear: 110, burn: 3 },
        boar: { notice: 4.5, contact: 1.05 },   // notice: a man / the dog this near and it charges him; contact: what its charge rams
        bear: { notice: 3.6 },                  // whoever comes this near is its enemy
        // seeWolf: an awake man sees a wolf this far (at night); keep: one fighting the hero turns on a beast only this near him; lose: lets a
        // beast go this far; hearFight: a man roused (by the noise) goes for a beast fighting his own this near
        man: { seeWolf: 6.5, keep: 2.5, lose: 12, hearFight: 12 },
        // join: the dog goes for one of the hero's foes this near it (and fromHero of the hero); bite: its bite at level 1 (+6% a level
        // of the hero's); gap: frames between bites; fleeAt / backAt: the part of its life under which it runs out of the fight / over which it
        // comes back; flee: frames it runs; cost: strength a bite
        dog: { join: 8, fromHero: 12, bite: 8, gap: 26, fleeAt: 0.3, backAt: 0.55, flee: 240, cost: 2, reach: 1.5, tired: 0.1 },
        bait: { smell: 18, eat: 90 },           // smell: a pack this near meat lying on the ground goes to it; eat: frames a piece
        // a carcass left lying (not dressed): a weaker bait - smell tiles, `penalty` tiles worse than meat in a bundle when both are there;
        // eat: frames for one bite (a piece of its meat - Hunting_Weapons.js gnawLeft: the hide torn after the first, a sinew less after the
        // second; no meat left: bones, gone); kinds: what the wolves eat (not a wolf). remains: the leavings of a dressed one (a faint smell,
        // sniffed and eaten up; life in game hours). Men's bodies never draw them.
        carrion: { smell: 11, penalty: 3, eat: 1800, kinds: ["rabbit", "deer", "boar", "bear"] },
        remains: { smell: 6, penalty: 5, sniff: 300, life: 12 },
        hunt: { range: 8.5, min: 2.5, cd: 900, fetch: 900, game: 0.7, deer: 0.3 }   // the camp archers' hunt; game: the chance a camp's archer hunted before dark
    };
    const LINES = {
        wolves: ["Wilki!", "Wilki pod obozem!", "Bierz głownię z ognia!", "Do ognia, chłopy, wilki!"],
        brand: ["Precz, bestio!", "A sio!", "Ognia mu!", "Wynocha!"],
        boar: ["Dzik! Z drogi!", "Uważaj, dzik!"],
        bear: ["Niedźwiedź!", "Matko, niedźwiedź!"],
        hunt: ["Cicho... kolacja.", "Zając. Nie ruszać się."],
        roast: ["Pieczyste będzie.", "Dobra sztuka."]
    };

    // the little state kept in the save: the hints said, what the others killed
    const S = T.state.define("starcia", () => ({ hints: {}, kills: {}, remains: [], seq: 0 }), { version: 1, owner: PLUGIN });
    const remainsList = () => { const s = S(); return s.remains || (s.remains = []); };

    // ------------------------------------------------------------------
    // Who is who
    // ------------------------------------------------------------------
    const isMan = x => !!(x && GH() && x instanceof GH());
    const isBeast = x => !!(x && x instanceof GA);
    const isDog = x => !!(x && GD() && x instanceof GD());
    // a man who takes part: a plain bandit (a camp's, the road's, a raid's, F9's) - never a quest's (a tag of its own, a name)
    function freeMan(h) {
        return isMan(h) && !h._dead && !h._surrendered && CFG.tags.includes(h._tag || "") && !h._label && !h._noClash && !h._robber;
    }
    // an animal that takes part: not a contract's (QuestBoard), not a quest's wolf (TownQuests), not a pack leader of a quest
    function freeBeast(a) {
        return isBeast(a) && !a._dead && a._hp > 0 && !a._qbBounty && !a._tqLeader && !a._noClash;
    }
    // the tame dog on this map, up and about (not hurt, not in its kennel)
    function dogNow() {
        const D = DG(), g = D && D.dog, s = D && D.state ? D.state() : null;
        if (!g || !s || !s.tame || g._transparent) return null;
        if (s.hurtUntil && clock() < s.hurtUntil) return null;
        if (g._pose === "sleep" || g._pose === "rest" || g._pose === "hurt") return null;
        return g;
    }
    // the hero (the real one also while a beast thinks with another in his place)
    let realP = null, swapA = null, soundSpot = null;
    const hero = () => realP || window.$gamePlayer;
    // (the hero's own centerX / centerY are the engine's - the middle of the screen for the scroll - not where he stands)
    const cx = c => (c instanceof Game_Player || typeof c.centerX !== "function" ? c._realX + 0.5 : c.centerX());
    const cy = c => (c instanceof Game_Player || typeof c.centerY !== "function" ? c._realY + 0.5 : c.centerY());
    const dist = (a, b) => Math.hypot(cx(a) - cx(b), cy(a) - cy(b));
    const heroDist = c => dist(c, hero());
    // still in the fight: on this map, alive, on its feet (a kneeling man is out of it; the dog: up and about)
    function alive(t) {
        if (!t) return false;
        if (t === hero()) return true;
        if (isMan(t)) return !t._dead && !t._surrendered && HM().list.includes(t);
        if (isDog(t)) return t === dogNow();
        if (isBeast(t)) return !t._dead && t._hp > 0 && H().animals.includes(t);
        return false;
    }
    const wolvesOut = live => P.core.activeNow("wolf") || live.some(m => m._summoned);

    // ------------------------------------------------------------------
    // Fire: the camp's, a lit fire of the hero's (Farming), a torch stuck in the ground (Torch) - kept for 30 frames
    // ------------------------------------------------------------------
    let fires = [], firesAt = -99, firesMap = 0, firesCamp = null;
    function fireSpots() {
        const Hm = HM(), camp = Hm && Hm.campHere ? Hm.campHere() : null;
        if (Graphics.frameCount - firesAt < 30 && firesAt <= Graphics.frameCount && firesMap === $gameMap.mapId() && firesCamp === camp) return fires;   // (a camp come or gone: at once)
        firesAt = Graphics.frameCount;
        firesMap = $gameMap.mapId();
        firesCamp = camp;
        const out = [];
        if (camp) out.push({ x: camp.x + 0.5, y: camp.y + 0.5, camp });
        const F = T.api("Farming");
        try {
            if (F && F.farm && F.geoOf && F.fireLit) for (const b of ((F.farm().buildings || {})[$gameMap.mapId()] || [])) {
                if (b.site) continue;
                const g = F.geoOf(b);
                if (!g || !g.fire || !F.fireLit(b)) continue;
                out.push({ x: b.x + (g.w || 1) / 2, y: b.y + 1 - (g.h || 1) / 2 });   // (the anchor: the bottom-left tile)
            }
        } catch (e) { /* (no fires this time) */ }
        const Tc = T.api("Torch");
        if (Tc && Tc.stuck) for (const p of Tc.stuck()) if (p.map === $gameMap.mapId()) out.push({ x: p.x + 0.5, y: p.y + 0.5, torch: true });
        return (fires = out);
    }
    function fireNear(x, y, r) {
        for (const f of fireSpots()) if (Math.hypot(f.x - x, f.y - y) < r) return f;
        return null;
    }
    const shielded = t => !!fireNear(cx(t), cy(t), CFG.fire.safe);

    // ------------------------------------------------------------------
    // Sounds and the screen: a fight between others sounds from where it is (quieter further off, from its side), and does not shake
    // the hero's screen
    // ------------------------------------------------------------------
    const _se = T.audio.se;
    T.audio.se = function(name, opts) {
        const at = swapA || soundSpot;
        if (at && window.$gamePlayer) {
            const o = typeof opts === "number" ? { volume: opts } : Object.assign({}, opts || {});
            const x = cx(at), y = cy(at), d = Math.hypot(x - (hero()._realX + 0.5), y - (hero()._realY + 0.5));
            const k = d <= 6 ? 1 : Math.max(0, 1 - (d - 6) / 12);
            if (k <= 0.05) return false;
            o.volume = Math.round((o.volume === undefined ? 90 : o.volume) * k);
            o.pan = Math.max(-80, Math.min(80, Math.round((x - (hero()._realX + 0.5)) * 12)));
            return _se.call(this, name, o);
        }
        return _se.call(this, name, opts);
    };
    function soundAt(c, fn) {
        const was = soundSpot;
        soundSpot = c;
        try { return fn(); } finally { soundSpot = was; }
    }
    const otherFight = () => { const at = swapA || soundSpot; return !!(at && window.$gamePlayer && Math.hypot(cx(at) - (hero()._realX + 0.5), cy(at) - (hero()._realY + 0.5)) > 3); };
    const _startShake = Game_Screen.prototype.startShake;
    Game_Screen.prototype.startShake = function(power, speed, duration) {
        if (otherFight()) return;   // (a blow between others, away from him)
        return _startShake.call(this, power, speed, duration);
    };
    const _startFlash = Game_Screen.prototype.startFlash;
    Game_Screen.prototype.startFlash = function(color, duration) {
        if (otherFight()) return;
        return _startFlash.call(this, color, duration);
    };

    // ------------------------------------------------------------------
    // The beasts think with their foe in the hero's place
    // ------------------------------------------------------------------
    const ATT = P.ai.ATTACKING || { charge: true, close: true, windup: true, lunge: true, swipeWind: true, swipe: true, pinWind: true };
    function clashOk(a) {
        const f = a._clash;
        if (!f) return null;
        if (alive(f) && f !== hero()) return f;
        if (a._pack) { repick(a._pack); return a._clash || null; }
        a._clash = null;
        return null;
    }
    // the hero struck one that fights another: when he is about as near as its foe, it turns on him
    function heroStruck(a) {
        if (!a._heroHitAt || a._heroHitAt === a._stSeenHit) return;
        a._stSeenHit = a._heroHitAt;
        const f = a._clash;
        if (!f || heroDist(a) > dist(a, f) + 2) return;
        if (a._pack) clearPack(a._pack); else a._clash = null;
    }
    function think(fn) {
        return function() {
            if (realP) return fn.call(this);   // (already in another's place)
            heroStruck(this);
            const f = this._clash ? clashOk(this) : null;
            if (fireFirst(this, f)) return undefined;
            if (!f) return fn.call(this);
            realP = window.$gamePlayer;
            swapA = this;
            window.$gamePlayer = f;
            try { return fn.call(this); } finally { window.$gamePlayer = realP; realP = null; swapA = null; }
        };
    }
    for (const m of ["updateWolf", "updateBoar", "updateBear"]) GA.prototype[m] = think(GA.prototype[m]);
    // what a blow does, and what the bus tells, happens with the hero back in his place (only the beast's own thinking sees its foe there:
    // the hit, the kill, the journal, the quests know the real hero)
    function unswapped(fn) {
        if (!realP) return fn();
        const sw = window.$gamePlayer, r = realP;
        window.$gamePlayer = r;
        realP = null;
        try { return fn(); } finally { realP = r; window.$gamePlayer = sw; }
    }
    const _emit = T.emit;
    T.emit = function() { const args = arguments; return realP ? unswapped(() => _emit.apply(T, args)) : _emit.apply(T, args); };
    // a wolf and the fire: it backs off a brand's blow a while; it does not step near a fire; it leaps at nobody standing by one
    function fireFirst(a, foe) {
        const sp = SP[a.kind()];
        if (!sp || !sp.pack || a._dead || a._mode === "flee" || a._mode === "lunge" || a.isJumping()) return false;
        if (a._brandFear > 0) {
            a._brandFear--;
            const pack = a._pack;
            if (pack && pack.attacker === a) { pack.attacker = null; pack.nextAttack = Math.max(pack.nextAttack, 50); }
            if (a._mode === "windup" || a._mode === "close") a.setMode("stalk");
            if (a.isMoving()) return true;
            const b = a._brandFrom;
            if (b && dist(a, b) < 3.4) { const d = a.bestEscape(a._realX + 0.5 - cx(b), a._realY + 0.5 - cy(b)); if (d) P.core.roamingStep(a, d); }
            else if (b) a.turnTowardCharacter({ x: Math.round(cx(b) - 0.5), y: Math.round(cy(b) - 0.5) });
            return true;
        }
        const pack = a._pack, t = foe || (pack && pack.engaged ? hero() : null);
        if (t && shielded(t)) {   // (its foe stands by a fire: no leap at him now)
            if (pack && pack.attacker === a && a._mode !== "lunge") { pack.attacker = null; pack.nextAttack = Math.max(pack.nextAttack, 30); }
            if (a._mode === "windup" || a._mode === "close") a.setMode("stalk");
            if (pack) pack.nextAttack = Math.max(pack.nextAttack, 20);
        }
        if (a.isMoving()) return false;
        const f = fireNear(a.centerX(), a.centerY(), CFG.fire.keep);
        if (!f) return false;
        const d = a.bestEscape(a._realX + 0.5 - f.x, a._realY + 0.5 - f.y);
        if (d) P.core.roamingStep(a, d); else a.turnTowardCharacter({ x: Math.floor(f.x), y: Math.floor(f.y) });
        if (pack && pack.attacker === a) { pack.attacker = null; pack.nextAttack = Math.max(pack.nextAttack, 40); }
        if (a._mode === "windup" || a._mode === "close") a.setMode("stalk");
        return true;
    }
    // what Combat_Feel.js asks: one that fights another is no threat of the hero's (no auto combat mode, no warning flash on him)
    const _isThreat = GA.prototype.isThreat;
    GA.prototype.isThreat = function() { return clashOk(this) ? false : _isThreat.call(this); };
    const _tell = GA.prototype.combatTell;
    GA.prototype.combatTell = function() { return clashOk(this) ? null : _tell.call(this); };
    // a goal of the pack's leader (Starcia's: a bait, the ring round a camp) - instead of a random wander, a walk there
    const _wander = GA.prototype.wander;
    GA.prototype.wander = function() {
        const g = this._goal;
        if (!g) return _wander.call(this);
        this.setMoveSpeed(SP[this.kind()].speed);
        const d = Math.hypot(this._x - g.x, this._y - g.y);
        if (d <= (g.near || 0.5)) { if (g.face) this.turnTowardCharacter({ x: g.x, y: g.y }); return; }   // (there: it stands - eats, watches)
        const r = P.path.path8(this, g.x, g.y, { animal: true, key: "goal", near: g.near || 0 });
        if (P.path.takeStep(this, r.dir)) this._goalStuck = 0;
        else if ((this._goalStuck = (this._goalStuck || 0) + 1) > 8) { this._goalStuck = 0; this._goal = null; }
    };

    // ------------------------------------------------------------------
    // A blow on a beast from another (a man's club or arrow, the dog's bite, the boar's charge): its life, its balance, its anger - and
    // its death (the carcass for the hero; no experience)
    // ------------------------------------------------------------------
    function knockFrom(a, from) {
        if (!from || a.isJumping()) return;
        const ax = a._x - Math.floor(cx(from)), ay = a._y - Math.floor(cy(from));
        const bx = Math.abs(ax) >= Math.abs(ay) ? Math.sign(ax) : 0, by = Math.abs(ax) >= Math.abs(ay) ? 0 : Math.sign(ay);
        const d = bx > 0 ? 6 : bx < 0 ? 4 : by > 0 ? 2 : 8;
        if ((bx || by) && a.canPass(a._x, a._y, d)) a.jump(bx, by); else a.jump(0, 0);
    }
    function fxHit(c, dmg, color) {
        const Cb = CB();
        if (Cb && Cb.numberAt) Cb.numberAt(cx(c), cy(c) - 0.9, String(dmg), color || "#ffd0b0", 0.85);
        if (Cb && Cb.sparksAt) Cb.sparksAt(cx(c), cy(c) - 0.3, "#b8322a", 7);
        c._flashT = 8;
        c._flashAt = Graphics.frameCount;
    }
    function tallyKill(by) { const k = S().kills; k[by] = (k[by] || 0) + 1; }
    function hurtBeast(a, dmg, o) {
        if (!alive(a) || a === hero() || !(dmg > 0)) return "miss";
        const sp = SP[a.kind()], by = o.by || "human", from = o.from || null;
        if (o.fire) dmg += CFG.fire.burn;
        a._hp -= dmg;
        a._poiseT = 0;
        a._wounded = true;
        soundAt(a, () => {
            fxHit(a, dmg, o.fire ? "#ffa040" : null);
            if (o.fire) { const Cb = CB(); if (Cb && Cb.sparksAt) Cb.sparksAt(a.centerX(), a.centerY() - 0.4, "#ffb43a", 8); }
            T.audio.se("Damage1", { volume: 55, pitch: sp.aggressive ? 90 : 120 });
            const Hn = H();
            if (sp.aggressive && Hn && Hn.makeNoise) Hn.makeNoise(a.centerX(), a.centerY(), 6);   // (a fight wakes a camp - a hare shot by the archer does not)
            if (a._hp <= 0) { tallyKill(by); Hn.kill(a, o.how || "melee", by); }
        });
        if (a._hp <= 0) return "hit";
        retaliate(a, from);
        const heavy = !!o.heavy, poise = o.poise !== undefined ? o.poise : Math.round(dmg * 0.8);
        a._poise -= sp.heavy && !heavy ? Math.round(poise * P.ai.BEAR_AI.light) : poise;
        if (a._poise <= 0 && a._mode !== "lunge") { P.ai.stagger(a, false); knockFrom(a, from); }
        else if (o.knock && !sp.heavy && a._mode !== "charge" && a._mode !== "lunge") knockFrom(a, from);
        if (o.fire && sp.pack) {   // a brand: it yelps and keeps off a while
            a._brandFear = Math.max(a._brandFear || 0, CFG.fire.fear);
            a._brandFrom = from;
            soundAt(a, () => T.audio.se("Growl", { volume: 60, pitch: 150 }));
        }
        if (!sp.aggressive) {   // a hare, a deer: off it runs, from whoever it was
            a._alarm = 120;
            a._fleeing = true;
            if (from) a._scare = { x: from._realX, y: from._realY, t: 200 };
        }
        return "hit";
    }
    // the one that struck it becomes its foe - unless it is on the hero right now (and he is near), or it is a hare or a deer
    function retaliate(a, from) {
        if (!from || from === hero() || !alive(from) || isBeast(from)) return;
        const sp = SP[a.kind()];
        if (!sp.aggressive) return;
        if (sp.pack) {
            const pack = a._pack;
            if (!pack) { if (!a._clash) a._clash = from; return; }
            if (pack._clash === from) return;
            const live = pack.members.filter(m => !m._dead);
            if (live.some(m => m._mode === "lunge" && m.isJumping())) return;   // (a leap under way: the next time)
            if (!pack._clash && pack.engaged && heroDist(a) < 2.5) return;      // (busy with the hero, beside him)
            if (pack._clash && dist(a, pack._clash) + 1.5 < dist(a, from)) return;
            setPackClash(pack, from);
            if (!pack.engaged) soundAt(a, () => P.ai.wolfEngage(a));
            return;
        }
        if (a._clash === from) return;
        if (!a._clash && a._engaged && heroDist(a) < 4 && a._mode !== "roam") return;   // (the boar / the bear on the hero, near him)
        a._clash = from;
        a._aware = 1;
        if (sp.bear && (a._mode === "roam" || a._mode === "warn" || a._mode === "leave")) a.bearEngage();
        else if (!sp.bear && (a._mode === "roam" || a._mode === "retreat")) a.setMode("warn", 16);
    }
    // the takeHit of each: what a blow does to it (Hunting_AI.js hitTarget, Humans.js blowLand and arrows, the boar's charge, the dog)
    function byOf(from) {
        if (!from) return "human";
        if (isDog(from)) return "dog";
        if (isBeast(from)) return from.kind();
        return "human";
    }
    GA.prototype.takeHit = function(info) {
        const from = info.from && typeof info.from.centerX === "function" ? info.from : null, by = byOf(from);
        return unswapped(() => hurtBeast(this, Math.max(1, Math.round(info.damage || 1)), { poise: info.poise, knock: info.knock, heavy: info.heavy, by, from,
            how: info.shot ? "shot" : by === "dog" ? "dog" : "melee", fire: !!(from && from._brand) }));
    };
    GA.prototype.isDown = function() { return !alive(this); };

    // ------------------------------------------------------------------
    // The men: a beast's blow (through Humans.hit - his guard, his life, his body to search), he turns on it; whom he fights
    // ------------------------------------------------------------------
    function installMen() {
        const G = GH();
        if (!G || G.prototype._starcia) return;
        G.prototype._starcia = true;
        G.prototype.takeHit = function(info) {
            if (this._dead || this._surrendered) return "miss";
            return unswapped(() => {
                const from = info.from && typeof info.from.centerX === "function" ? info.from : null;
                if (from && !isMan(from) && freeMan(this)) defendAgainst(this, from);
                const at = from ? { x: cx(from), y: cy(from) } : null;
                soundAt(this, () => HM().hit(this, Math.max(1, Math.round(info.damage || 1)), info.shot ? "shot" : "beast",
                    { from: at, poise: info.poise, knock: info.knock, heavy: info.heavy, by: byOf(from) }));
                return "hit";
            });
        };
        G.prototype.isDown = function() { return this._dead || this._surrendered || !HM().list.includes(this); };
        // engaged: by a beast (no shout of "Sakiewka albo życie!" at a wolf; his band is up for the beasts, not after the hero) or by the
        // hero; one roused by the noise of a beast's fight goes for the beast
        const _engage = G.prototype.engage;
        G.prototype.engage = function(shout) {
            if (this._engaged || this._surrendered || this._dead || !freeMan(this)) return _engage.call(this, shout);
            let beast = isBeast(this._foe) || isDog(this._foe) ? this._foe : null;
            const band = this._band;
            if (!beast && !(this._aware >= 1) && !(band && band._heroAlarm)) {   // (roused by a noise: the beasts' fight, not the hero)
                const b = threatNear(this, CFG.man.seeWolf, CFG.man.hearFight);
                if (b) { beast = b; this._foe = b; }
            }
            if (band) {
                if (beast) { if (!band.engaged) band._beastAlarm = true; }
                else if (!band._beastAlarm) band._heroAlarm = true;
                else if (!band._heroAlarm) this._beastOnly = true;
            }
            if (beast) { this._stFoe = true; brandUp(this); }
            const r = _engage.call(this, beast ? false : shout);
            if (!beast && this._beastOnly) manTick(this);   // (roused by the beasts: one of them at once, not a step towards the hero)
            return r;
        };
        // he is sure it is someone: the hero (the band knows him from now on)
        const _notice = G.prototype.notice;
        G.prototype.notice = function() {
            if (this._aware >= 1 && this._band && freeMan(this)) this._band._heroAlarm = true;
            return _notice.call(this);
        };
        // one who fights a beast is no threat of the hero's (while his band has not seen the hero)
        const _isThreat = G.prototype.isThreat;
        G.prototype.isThreat = function() {
            const Hm = HM(), f = Hm && Hm.foeOf ? Hm.foeOf(this) : null;
            if (f && (isBeast(f) || isDog(f)) && !(this._band && this._band._heroAlarm)) return false;
            return _isThreat.call(this);
        };
    }
    // a beast that is on him or near him: a wolf at night (one he sees - within r, awake), a boar or a bear after him (within r); `ourR`:
    // also one fighting a man of his band that far off (he heard it, or he is up for them)
    function threatNear(h, r, ourR) {
        r = r || 0;
        ourR = ourR || 0;
        if (!(r > 0) && !(ourR > 0)) return null;
        let best = null, bd = Infinity;
        for (const a of H().animals) {
            if (!freeBeast(a) || a._mode === "flee" || a._dawn) continue;
            const sp = SP[a.kind()];
            if (!sp.aggressive) continue;
            const d = dist(h, a), on = a._clash || (a._pack && a._pack._clash);
            const onHim = on === h && d <= Math.max(r, CFG.man.seeWolf);
            const onOurs = on && on !== h && isMan(on) && on._band && on._band === h._band && d <= ourR;
            const wolf = sp.pack && d <= Math.min(r, CFG.man.seeWolf) && (P.core.activeNow("wolf") || a._summoned);
            if (!(onHim || onOurs || wolf)) continue;
            const s = d - (onHim ? 2 : 0);
            if (s < bd) { bd = s; best = a; }
        }
        return best;
    }
    // he goes for it (a beast, or the dog that bit him): his band's shout, a brand out of the camp's fire
    function setManFoe(h, t) {
        const Hm = HM();
        if (!Hm || !t || !Hm.setFoe(h, t, { ranged: true })) return false;
        h._stFoe = true;
        const band = h._band;
        if (isBeast(t) && band && !band._beastShout) {
            band._beastShout = true;
            const k = t.kind();
            say(h, pick(k === "wolf" ? LINES.wolves : k === "boar" ? LINES.boar : LINES.bear));
        }
        brandUp(h);
        T.emit("clash", { a: h, b: t, kind: "start" });
        return true;
    }
    function defendAgainst(h, from) {
        const Hm = HM();
        if (!Hm || Hm.foeOf(h) === from || !alive(from)) return;
        const f = Hm.foeOf(h);
        if (f && f !== from && alive(f) && dist(h, f) < dist(h, from)) return;   // (the nearer one first)
        if (!isBeast(from) && !(isDog(from) && Math.random() < 0.5)) return;      // (the dog's bite: half the time he turns on it)
        setManFoe(h, from);
    }
    // a brand out of the camp's fire for one going out at the wolves near it (at most CFG.fire.brands a band; not the archer)
    function brandUp(h) {
        if (h._brand || h._kind === "archer" || !h._campRef) return;
        const Hm = HM(), camp = Hm && Hm.campHere ? Hm.campHere() : null, f = h._foe;
        if (!camp || !f || !isBeast(f) || f.kind() !== "wolf") return;
        if (Math.hypot(h.centerX() - camp.x - 0.5, h.centerY() - camp.y - 0.5) > CFG.fire.brandFrom) return;
        const band = h._band, n = band ? band.members.filter(m => !m._dead && m._brand).length : 0;
        if (n >= CFG.fire.brands) return;
        h._brand = true;
        if (Math.random() < 0.5) say(h, pick(LINES.brand), 120);
    }
    // the beasts gone: one roused by them (who never saw the hero) goes back to his place; the band calms down
    function calmDown(h) {
        const Hm = HM();
        Hm.setFoe(h, null);
        h._stFoe = false;
        h._beastOnly = false;
        h._brand = false;
        if (h._engaged) h.disengage();
        const band = h._band;
        if (band && !band.members.some(m => !m._dead && m._engaged)) {
            band.engaged = false;
            band.shouted = false;
            band.attacker = null;
            band._beastAlarm = false;
            band._beastShout = false;
        }
    }
    function manTick(h) {
        const Hm = HM();
        if (!freeMan(h) || Hm.robbery || h._stHunt || h._stFetch) return;
        if (h._mode === "flee" || h._mode === "leave" || h._mode === "gloat" || h._mode === "surrender") { h._brand = false; return; }
        const f = Hm.foeOf(h), band = h._band;
        if (f && !isBeast(f) && !isDog(f)) return;   // (another's foe - not ours)
        const forBeasts = h._beastOnly || !!(band && band._beastAlarm && !band._heroAlarm);
        const r = h._mode === "sleep" ? 0 : h._engaged && !forBeasts ? CFG.man.keep : CFG.man.seeWolf;
        const t = threatNear(h, r, h._engaged && forBeasts ? CFG.man.hearFight : 0);
        if (f) {   // the beast (or the dog) he fights: kept while it is about; a nearer one on him takes its place
            if (alive(f) && dist(h, f) < CFG.man.lose && !(isDog(f) && f.isDown())) {
                if (t && t !== f && dist(h, t) + 1.5 < dist(h, f)) setManFoe(h, t);
                return;
            }
            Hm.setFoe(h, null);
            h._stFoe = false;
        }
        if (t) { setManFoe(h, t); return; }
        if (h._brand && !h._engaged) h._brand = false;
        if (h._engaged && (h._beastOnly || (band && band._beastAlarm && !band._heroAlarm))) calmDown(h);
    }

    // ------------------------------------------------------------------
    // The wolves: a pack's foe, its prey, a bait, the ring round a camp
    // ------------------------------------------------------------------
    function setPackClash(pack, t) {
        if (!pack || !t) return;
        const first = pack._clash !== t;
        pack._clash = t;
        pack._prowl = null;
        for (const m of pack.members) {
            if (m._dead) continue;
            if (m._clash !== t) { m._slot = undefined; m._spot = null; m._noSpot = null; m._p8 = null; m._badSlots = []; m._badSpots = []; }
            m._clash = t;
            m._goal = null;
            if (m._mode === "windup" || m._mode === "close") m.setMode("stalk");
        }
        if (pack.attacker && !(pack.attacker._mode === "lunge" && pack.attacker.isJumping())) pack.attacker = null;
        pack.nextAttack = Math.max(pack.nextAttack || 0, 45);
        if (first) T.emit("clash", { a: pack.members.find(m => !m._dead), b: t, kind: "start" });
    }
    function clearPack(pack) {
        if (!pack) return;
        pack._clash = null;
        pack._prowl = null;
        for (const m of pack.members) { m._clash = null; m._goal = null; }
    }
    // its foe gone: the next of its prey near, else back to roaming (its own senses decide about the hero again)
    function repick(pack) {
        const live = pack.members.filter(m => !m._dead);
        const next = live.length ? pickPrey(pack, live, CFG.wolf.notice + 2, true) : null;
        if (next) { setPackClash(pack, next); return; }
        clearPack(pack);
        if (pack.engaged) P.ai.disengage(pack);
    }
    const packDist = (live, t) => Math.min(...live.map(m => dist(m, t)));
    // the pack's prey within `range` of it: a man not by a fire (a lone one first, a sleeper sooner), the dog when it is not with the hero;
    // campOk: the camp's men too (else only the ones awake and out)
    function pickPrey(pack, live, range, campOk) {
        let best = null, bs = Infinity;
        const Hm = HM();
        const men = Hm ? Hm.list : [];
        for (const h of men) {
            if (!freeMan(h) || h._mode === "leave" || shielded(h)) continue;
            if (h._campRef && !campOk && !h._engaged) continue;
            const d = packDist(live, h);
            if (d > range) continue;
            const crowd = men.filter(o => o !== h && !o._dead && !o._surrendered && dist(o, h) < 3).length;
            const s = d + 2 * crowd - (h._mode === "sleep" ? 1 : 0);
            if (s < bs) { bs = s; best = h; }
        }
        const g = dogNow();
        if (g && heroDist(g) > CFG.wolf.dogFree && !shielded(g) && !g.isDown()) {
            const d = packDist(live, g);
            if (d <= range && d + 1 < bs) { bs = d + 1; best = g; }
        }
        return best;
    }
    // meat lying on the ground (a bundle with raw meat or fish - Drops.js): the baits of this map
    let baitList = [], baitAt = -99;
    function meatIds() {
        const F = T.api("Farming");
        let ids = [];
        try {
            if (F && F.RAW_MEATS) ids = ids.concat(typeof F.RAW_MEATS === "function" ? F.RAW_MEATS() : F.RAW_MEATS);
            if (F && F.RAW_FISH) ids = ids.concat(typeof F.RAW_FISH === "function" ? F.RAW_FISH() : F.RAW_FISH);
        } catch (e) { /* (none known) */ }
        if (!ids.length) ids = [94, 157, 159, 161, 168];
        return ids.filter(Boolean);
    }
    let baitKey = "";
    function baits() {
        // (kept 30 frames - a carcass or a bundle come or gone, a new map: at once)
        const Hn0 = H(), D0 = T.api("Drops"), key = $gameMap.mapId() + ":" + (Hn0 && Hn0.carcasses ? Hn0.carcasses().length : 0) + ":" + (D0 && D0.list ? D0.list().length : 0) + ":" + remainsList().length;
        if (Graphics.frameCount - baitAt < 30 && baitAt <= Graphics.frameCount && key === baitKey) return baitList;
        baitAt = Graphics.frameCount;
        baitKey = key;
        const D = T.api("Drops"), ids = meatIds(), out = [], map = $gameMap.mapId();
        if (D && D.list) for (const b of D.list()) {
            if (b.map !== map) continue;
            const meat = ids.find(id => (b.items[id] || 0) > 0);
            if (meat) out.push({ id: b.id, x: b.x, y: b.y, meat, n: ids.reduce((t, id) => t + (b.items[id] || 0), 0), smell: CFG.bait.smell, penalty: 0 });
        }
        // the carcasses left lying (not in the dog's mouth; not a wolf - they do not eat their own); the remains of dressed ones
        const Hn = H();
        for (const c of (Hn && Hn.carcasses ? Hn.carcasses() : [])) {
            if (c.held || !CFG.carrion.kinds.includes(c.kind)) continue;
            out.push({ id: "c:" + c.id, carcass: c, x: Math.floor(c.x), y: Math.floor(c.y), smell: CFG.carrion.smell, penalty: CFG.carrion.penalty });
        }
        const now = clock(), rl = remainsList();
        for (let i = rl.length - 1; i >= 0; i--) if (rl[i].until <= now) rl.splice(i, 1);
        for (const r of rl) if (r.map === map) out.push({ id: "r:" + r.id, remains: r, x: r.x, y: r.y, smell: CFG.remains.smell, penalty: CFG.remains.penalty });
        return (baitList = out);
    }
    // a carcass dressed: its remains lie there a while (a faint bait)
    T.on("carcassDressed", e => {
        if (!e || !CFG.carrion.kinds.includes(e.kind) || !window.$gameSystem) return;
        const s = S(), rl = remainsList();
        s.seq = (s.seq || 0) + 1;
        rl.push({ id: s.seq, map: e.mapId, x: Math.floor(e.x), y: Math.floor(e.y), until: clock() + CFG.remains.life });
        while (rl.length > 12) rl.shift();
        baitAt = -99;
    }, { owner: PLUGIN });
    // the first time wolves go for a carcass near the hero: a word over him and a line in the journal
    function carrionHint(L) {
        const s = S();
        if (s.hints.carrion || heroDist(L) > 16) return;
        s.hints.carrion = true;
        popup("Wilki poczuły padlinę… zwłoki zostawione na noc ściągają je", 0, "#ffd98f");
        T.call("Journal", "addNote", "Padlina wabi wilki", "Zwłoki zwierzęcia zostawione nocą na ziemi ściągają wilki. Szarpią je, a co ogryzą, tego już nie oprawię: mniej mięsa, skóra podarta, w końcu same kości. Resztki po oprawianiu też trochę pachną. Ciała ludzi ich nie wabią.");
    }
    // one bite of a carcass: a piece of its meat gone (to the bones: it is taken away)
    function gnaw(c, L) {
        const Hn = H(), W = (T.api("Hunting_parts") || {}).weapons;
        if (!Hn || !Hn.carcasses().includes(c)) return;
        c.gnawed = (c.gnawed || 0) + 1;
        soundAt(L, () => { T.audio.se("Bite", { volume: 70, pitch: 80 }); T.audio.se("Growl", { volume: 50, pitch: 105 }); });
        const left = W && W.gnawLeft ? W.gnawLeft(c.kind, c.gnawed) : null;
        if (left && left.meat <= 0) {
            Hn.removeCarcass(c);
            if (heroDist(L) < 14) popup("Wilki ogryzły zwłoki do kości", 0, "#ffd98f");
        }
    }
    // the bait the pack goes for: meat in a bundle (strongest), a carcass left lying, the remains of a dressed one - each within its own
    // smell, the nearest counting its penalty
    function baitTick(pack, L) {
        let best = null, bs = Infinity, bd = 0;
        for (const b of baits()) {
            const d = Math.hypot(L.centerX() - b.x - 0.5, L.centerY() - b.y - 0.5);
            if (d > b.smell || d + b.penalty >= bs) continue;
            bs = d + b.penalty; bd = d; best = b;
        }
        if (!best) { pack._eat = null; return false; }
        if (best.carcass) carrionHint(L);
        if (bd > 1.5) { L._goal = { x: best.x, y: best.y, near: 1 }; pack._eat = null; return true; }
        L._goal = { x: best.x, y: best.y, near: 1.5, face: true };
        const e = pack._eat && pack._eat.id === best.id ? pack._eat : (pack._eat = { id: best.id, t: 0 });
        if (!e.said && heroDist(L) < 14 && !best.remains) {
            e.said = true;
            popup(best.carcass ? "Wilki szarpią zwłoki" : "Wilki dopadły przynęty - szarpią mięso", 0, "#ffd98f");
        }
        const need = best.carcass ? CFG.carrion.eat : best.remains ? CFG.remains.sniff : CFG.bait.eat;
        if ((e.t += CFG.every) >= need) {
            e.t = 0;
            baitAt = -99;
            if (best.carcass) gnaw(best.carcass, L);
            else if (best.remains) { const rl = remainsList(), i = rl.indexOf(best.remains); if (i >= 0) rl.splice(i, 1); soundAt(L, () => T.audio.se("Bite", { volume: 55, pitch: 95 })); }
            else {
                const D = T.api("Drops");
                if (D && D.take && D.take(best.id, best.meat, 1) > 0) soundAt(L, () => { T.audio.se("Bite", { volume: 70, pitch: 85 }); T.audio.se("Growl", { volume: 45, pitch: 110 }); });
            }
        }
        return true;
    }
    function prowlTick(pack, L, live) {
        const Hm = HM(), camp = Hm && Hm.campHere ? Hm.campHere() : null;
        if (!camp) { pack._prowl = null; return false; }
        const fx = camp.x + 0.5, fy = camp.y + 0.5, d = Math.hypot(L.centerX() - fx, L.centerY() - fy);
        if (d > CFG.wolf.campSmell) { pack._prowl = null; return false; }
        const pr = pack._prowl || (pack._prowl = { a: Math.atan2(L.centerY() - fy, L.centerX() - fx), t: 0, wait: rnd(CFG.wolf.prowlWait[0], CFG.wolf.prowlWait[1]), howl: 60 });
        pr.t += CFG.every;
        if (d < CFG.wolf.prowl + 2) pr.a += 0.05;   // (round the camp, slowly)
        const R = CFG.wolf.prowl;
        L._goal = { x: Math.round(fx - 0.5 + Math.cos(pr.a) * R), y: Math.round(fy - 0.5 + Math.sin(pr.a) * R * 0.8), near: 1 };
        if ((pr.howl -= CFG.every) <= 0) {
            pr.howl = rnd(CFG.wolf.howl[0], CFG.wolf.howl[1]);
            soundAt(L, () => T.audio.se("Wolf", { volume: 70, pitch: 95 + rnd(0, 15) }));
        }
        if (pr.t >= pr.wait && d < R + 3) {   // gone round it a while: the most exposed of them (a sleeper at the edge, one away from the fire)
            const t = pickPrey(pack, live, R + 4, true);
            if (t) { L._goal = null; setPackClash(pack, t); soundAt(L, () => P.ai.wolfEngage(L)); }
            else pr.t = pr.wait - 120;   // (all by the fire: round again)
        }
        return true;
    }
    function packTick(pack) {
        const live = pack.members.filter(m => !m._dead);
        if (!live.length) return;
        const L = live[0];
        if (live.some(m => !freeBeast(m))) return;   // (a quest's pack: not ours)
        if (!wolvesOut(live) || L._mode === "flee" || L._dawn) { if (pack._clash || L._goal) clearPack(pack); return; }
        // 1. its foe: kept while it is about, not by a fire and not too far - else the next one, else roaming again
        if (pack._clash) {
            const t = pack._clash;
            if (alive(t) && t !== hero() && packDist(live, t) < CFG.wolf.lose && !shielded(t)) return;
            repick(pack);
            return;
        }
        // 2. after the hero: a man (or the dog) right among the wolves, much nearer than he is, takes his place (he ran into the camp)
        if (pack.engaged) {
            if (live.some(m => m._mode === "windup" || m._mode === "lunge")) return;
            const t = pickPrey(pack, live, CFG.wolf.steal, true);
            if (t && packDist(live, t) + CFG.wolf.switchGain < packDist(live, hero())) setPackClash(pack, t);
            return;
        }
        // 3. roaming: a man (not a sleeping camp's) or the dog alone, near
        const t = pickPrey(pack, live, CFG.wolf.notice, false);
        if (t) { L._goal = null; setPackClash(pack, t); soundAt(L, () => P.ai.wolfEngage(L)); return; }
        // 4. meat on the ground: there, and eat it
        if (baitTick(pack, L)) return;
        // 5. a camp: round it, then the most exposed
        if (prowlTick(pack, L, live)) return;
        L._goal = null;
    }

    // ------------------------------------------------------------------
    // The boar and the bear: whom they go for; the boar's charge rams whoever is on its line
    // ------------------------------------------------------------------
    function victims(a) {
        const out = [];
        for (const h of (HM() ? HM().list : [])) if (freeMan(h) && h._mode !== "leave") out.push(h);
        const g = dogNow();
        if (g && !g.isDown()) out.push(g);
        return out;
    }
    function nearestOf(a, list, r) {
        let best = null, bd = r;
        for (const t of list) { const d = dist(a, t); if (d < bd) { bd = d; best = t; } }
        return best;
    }
    function boarTick(a) {
        if (!freeBeast(a)) return;
        if (a._clash) {
            const t = a._clash;
            if (alive(t) && t !== hero() && dist(a, t) < SP.boar.sight * 1.6 && a._mode !== "flee") return;
            a._clash = null;
            if (a._mode === "warn" || a._mode === "charge" || a._mode === "approach") { a.setMode("roam"); a._aware = 0.4; }
            return;
        }
        if (a._mode !== "roam" || a._aware >= 0.7) return;   // (busy with the hero, or about to be)
        const t = nearestOf(a, victims(a), CFG.boar.notice);
        if (t) { a._clash = t; a._aware = 1; a._alarm = Math.max(a._alarm || 0, 60); T.emit("clash", { a, b: t, kind: "start" }); }   // (_alarm: its brain warns at it next)
    }
    function bearTick(a) {
        if (!freeBeast(a)) return;
        const B = P.ai.BEAR_AI;
        if (a._clash) {
            const t = a._clash, h = a._home || { x: a._x, y: a._y };
            if (alive(t) && t !== hero() && dist(a, t) < B.lose && Math.hypot(a._x - h.x, a._y - h.y) <= B.leash && a._mode !== "leave") return;
            a._clash = null;
            a._engaged = false;
            if (a._mode === "chase" || a._mode === "warn") { a.setMode("leave"); a._leaveT = 0; }
            return;
        }
        if ((a._mode !== "roam" && a._mode !== "leave") || a._engaged) return;
        const t = nearestOf(a, victims(a), CFG.bear.notice);
        if (!t) return;
        a._clash = t;
        a._aware = 1;
        a._alarm = Math.max(a._alarm || 0, 60);
        if (dist(a, t) < B.engage) a.bearEngage(); else if (a._mode === "leave") a.setMode("roam");
        T.emit("clash", { a, b: t, kind: "start" });
    }
    // every frame: a rushing boar rams whoever is on its line (not its own foe - its charge reaches that one anyway); with another foe the
    // hero on its line too
    function boarRam() {
        for (const a of H().animals) {
            if (a.kind() !== "boar" || a._dead || !freeBeast(a)) continue;
            if (a._mode !== "charge" && a._mode !== "overshoot") { a._rammed = null; continue; }
            const hit = a._rammed || (a._rammed = []);
            const near = c => Math.hypot(a.centerX() - cx(c), a.centerY() - cy(c)) < CFG.boar.contact;
            const list = victims(a).concat(H().animals.filter(o => o !== a && freeBeast(o) && o.kind() !== "bear" && o.kind() !== "boar"));
            for (const v of list) {
                if (v === a._clash || hit.includes(v) || !near(v)) continue;
                hit.push(v);
                soundAt(a, () => { T.audio.se("Blow1", { volume: 85, pitch: 70 }); });
                const Cb = CB();
                if (Cb && Cb.sparksAt) Cb.sparksAt(cx(v), cy(v) - 0.2, "#b79a6a", 10);
                v.takeHit({ damage: P.ai.atkOf(a), poise: 75, from: a, knock: 0.9, wound: 0.7, heavy: true, name: "dzik" });
            }
            const me = hero();
            if (a._clash && !hit.includes(me) && near(me)) {
                hit.push(me);
                const Cb = CB();
                if (Cb && Cb.hitPlayer) Cb.hitPlayer({ damage: P.ai.atkOf(a), poise: 75, from: { x: a.centerX(), y: a.centerY() }, attacker: a, name: "dzik", wound: 0.7, knock: 0.9,
                    unblockable: true, unparryable: true });
            }
        }
    }

    // ------------------------------------------------------------------
    // The camp's archers hunt; the meat on the spit
    // ------------------------------------------------------------------
    function campHere() { const Hm = HM(); return Hm && Hm.campHere ? Hm.campHere() : null; }
    // a camp with an archer hunted before dark (maybe): the meat on its spit tonight, less of that game round here tomorrow (Hunting's
    // "killed today" of the morning after - set once the night is past midnight)
    function campGame(camp) {
        if (!camp || camp.mapId !== $gameMap.mapId()) return;
        if (camp._stGame === undefined) {
            const archer = camp.members.some(m => m.kind === "archer");
            camp._stGame = archer && Math.random() < CFG.hunt.game ? (Math.random() < CFG.hunt.deer ? "deer" : "rabbit") : null;
            if (camp._stGame && !camp.roast) camp.roast = { kind: camp._stGame, at: clock() };
        }
        if (camp._stGame && !camp._stGameDone && T.time.day() > camp.night) {
            camp._stGameDone = true;
            const h = P.core.hunt(), id = camp.mapId, d = T.time.day();
            const rec = h.killed[id] && h.killed[id].day === d ? h.killed[id] : (h.killed[id] = { day: d });
            rec[camp._stGame] = (rec[camp._stGame] || 0) + 1;
        }
    }
    // the arrow's own way (Humans.js: a wall, an impassable tile or a thing standing there - a herb, a flower, a stump - stops it): free
    function arrowClear(h, a) {
        const sx = h.centerX(), sy = h.centerY() - 0.25, tx = a.centerX(), ty = a.centerY(), n = Math.ceil(Math.hypot(tx - sx, ty - sy) / 0.25);
        for (let i = 1; i < n; i++) {
            const X = Math.floor(sx + (tx - sx) * i / n), Y = Math.floor(sy + (ty - sy) * i / n);
            if ((X === a._x && Y === a._y) || (X === h._x && Y === h._y)) continue;
            if (!$gameMap.isValid(X, Y) || !$gameMap.checkPassage(X, Y, 0x0f)) return false;
            if ($gameMap.eventsXy(X, Y).some(e => e.isNormalPriority() && e.characterName() !== "")) return false;
        }
        return true;
    }
    function archerTick(h) {
        if (h._kind !== "archer" || !h._campRef || !freeMan(h)) return;
        if (h._stHunt) { huntGoing(h); return; }
        if (h._stFetch || h._engaged || h._foe || (h._band && h._band.engaged)) return;
        if (h._mode !== "sit" && h._mode !== "idle") return;
        if ((h._stHuntCd || 0) > Graphics.frameCount) return;
        const G = P.path.pathGrid();
        let prey = null, bd = CFG.hunt.range;
        for (const a of H().animals) {
            if (!freeBeast(a) || SP[a.kind()].aggressive) continue;
            const d = dist(h, a);
            if (d < CFG.hunt.min || d > bd || !P.path.clearLine(G, h._x, h._y, a._x, a._y, true) || !arrowClear(h, a)) continue;
            bd = d;
            prey = a;
        }
        if (!prey) return;
        h._stHunt = { prey, t: 0 };
        h._foe = prey;   // (no setFoe: no engage - the band sleeps on)
        h.startDraw();
        if (Math.random() < 0.5) say(h, pick(LINES.hunt), 100);
    }
    function huntGoing(h) {
        const S2 = h._stHunt, p = S2.prey;
        S2.t += CFG.every;
        if (h._engaged || h._dead || h._mode === "flee") { endHunt(h, null); return; }
        if (!alive(p)) {
            const list = H().carcasses ? H().carcasses() : [];
            const c = p._dead ? list.slice().reverse().find(q => q.kind === p.kind() && Math.hypot(q.x - cx(p), q.y - cy(p)) < 1.2) : null;
            endHunt(h, c);
            return;
        }
        if (S2.t > 900 || !["draw", "loose", "reload", "chase"].includes(h._mode)) endHunt(h, null);
    }
    function endHunt(h, carcass) {
        const S2 = h._stHunt;
        if (S2 && h._foe === S2.prey) h._foe = null;
        h._stHunt = null;
        h._aim = null;
        h._stHuntCd = Graphics.frameCount + CFG.hunt.cd;
        if (h._engaged || h._dead) return;
        if (carcass) { h._stFetch = { c: carcass, t: 0 }; h.setMode("idle"); return; }
        h.setMode("return");
    }
    // every frame: the archer walks to the carcass, takes it, back to his place - the meat on the spit
    function fetchUpdate() {
        const Hm = HM();
        if (!Hm) return;
        for (const h of Hm.list) {
            const f = h._stFetch;
            if (!f) continue;
            const list = H().carcasses ? H().carcasses() : [];
            if (h._dead || h._engaged || !list.includes(f.c) || ++f.t > CFG.hunt.fetch) { h._stFetch = null; if (!h._dead && !h._engaged) h.setMode("return"); continue; }
            if (Math.hypot(h.centerX() - f.c.x, h.centerY() - f.c.y) <= 1.2) {
                H().removeCarcass(f.c);
                const camp = campHere();
                if (camp) camp.roast = { kind: f.c.kind, at: clock() };
                h._stFetch = null;
                h.setMode("return");
                if (Math.random() < 0.6) say(h, pick(LINES.roast), 120);
                continue;
            }
            if (!h.isMoving()) h.walkTo(Math.floor(f.c.x), Math.floor(f.c.y), "fetch", 0);
        }
    }

    // ------------------------------------------------------------------
    // The dog in the fight (Dog.js's Game_Dog: before its own thinking)
    // ------------------------------------------------------------------
    const DOG_ICON = 431;
    function dogFoeOf(g, t) {
        if (!alive(t) || t === hero() || t === g) return false;
        if (t === g._stHitBy && Graphics.frameCount - (g._stHitAt || 0) < 300) return true;   // (whoever hurt it)
        if (isBeast(t)) {
            const sp = SP[t.kind()];
            if (!sp.aggressive || t._mode === "flee" || t._dawn) return false;
            const on = t._clash || (t._pack && t._pack._clash);
            if (on === g) return true;
            if (on) return false;   // (a beast fighting a man: not the dog's fight)
            if (sp.pack) return !!t._engaged;
            if (sp.bear) return !!t._engaged;
            return ["warn", "charge", "approach", "overshoot", "recover", "stagger", "retreat"].includes(t._mode);
        }
        if (isMan(t)) {
            if (!freeMan(t) || t._mode === "flee" || t._mode === "leave" || t._mode === "gloat") return false;
            const f = HM().foeOf(t);
            if (f === g) return true;
            return !!t._engaged && !f && !!(t._band && t._band._heroAlarm);
        }
        return false;
    }
    function pickDogFoe(g) {
        const cand = [];
        for (const a of H().animals) cand.push(a);
        for (const h of (HM() ? HM().list : [])) cand.push(h);
        let best = null, bd = CFG.dog.join;
        for (const t of cand) {
            if (!dogFoeOf(g, t) || heroDist(t) > CFG.dog.fromHero) continue;
            const d = dist(g, t) - (t === g._stHitBy ? 2 : 0);
            if (d < bd) { bd = d; best = t; }
        }
        return best;
    }
    function dogBite(g, foe) {
        const D = DG(), s = D.state(), Cb = CB();
        s.st = Math.max(0, s.st - CFG.dog.cost);
        const lv = Cb && Cb.hero ? (Cb.hero().level || 1) : 1, dmg = Math.round(CFG.dog.bite * (1 + 0.06 * (lv - 1)));
        soundAt(g, () => T.audio.se("Bite", { volume: 60, pitch: 118 }));
        if (isBeast(foe)) hurtBeast(foe, dmg, { by: "dog", how: "dog", from: g, poise: 14 });
        else if (isMan(foe)) {
            defendAgainst(foe, g);
            soundAt(foe, () => HM().hit(foe, dmg, "dog", { from: { x: g.centerX(), y: g.centerY() }, poise: 14, by: "dog" }));
        }
        if (!g.isJumping()) g.jump(0, 0);
    }
    function startFlee(g, from) {
        g._stFight = null;
        g._stFleeUntil = Graphics.frameCount + CFG.dog.flee;
        g._stFleeFrom = from || null;
        if (Graphics.frameCount - (g._stFleeSaid || -9999) > 600) { g._stFleeSaid = Graphics.frameCount; T.popup("Pies ranny - ucieka z walki", { icon: DOG_ICON, color: "#ffb4a0" }); }
    }
    function letGoDrag(g) {
        if (!g._drag) return;
        delete g._drag.held;
        g._drag = null;
        if (g._task && (g._task.kind === "haul" || g._task.kind === "hunt")) g._task = null;
    }
    function dogFight(g) {
        const D = DG(), s = D && D.state ? D.state() : null, now = Graphics.frameCount;
        if (!s || !s.tame || g !== dogNow()) { g._stFight = null; return false; }
        if ((g._stFleeUntil || 0) > now) {   // badly hurt: out of the fight - to the hero (away from its foe)
            g.setPose("");
            g.setMoveSpeed(D.DOG.runSpeed);
            const from = g._stFleeFrom, me = hero();
            if (!from || !alive(from) || dist(from, me) > 3.5) { g.stepTo(me.x, me.y, true); return true; }
            const d = window.RoamingActor.fleeDirection(g, g._realX - from._realX, g._realY - from._realY, { diagonal: true, lookahead: 0.5 });
            if (d) window.RoamingActor.step(g, d);
            return true;
        }
        const max = D.maxHp(), hurt = s.hp < max * CFG.dog.fleeAt, weak = s.hp < max * CFG.dog.backAt;
        let foe = g._stFight && dogFoeOf(g, g._stFight) && dist(g, g._stFight) < CFG.dog.join + 4 && heroDist(g._stFight) < CFG.dog.fromHero + 4 ? g._stFight : null;
        if (!foe && now >= (g._stLook || 0)) { g._stLook = now + 12; foe = pickDogFoe(g); }
        if (foe && hurt) { startFlee(g, foe); return true; }
        if (!foe || (weak && !g._stFight) || s.st < D.maxSt() * CFG.dog.tired) { g._stFight = null; return false; }
        if (s.mode === "stay" && foe !== g._stHitBy) { g._stFight = null; return false; }   // ("Zostań": it only defends itself)
        if (!g._stFight) T.emit("clash", { a: g, b: foe, kind: "start" });
        g._stFight = foe;
        letGoDrag(g);
        g._task = null;
        g._sleeping = false;
        g.setPose("");
        g.setMoveSpeed(D.DOG.runSpeed);
        const d = dist(g, foe);
        if (d < CFG.dog.reach) {
            g.turnTowardCharacter({ x: Math.round(cx(foe) - 0.5), y: Math.round(cy(foe) - 0.5) });
            if ((g._stBiteAt || 0) > now) return true;
            g._stBiteAt = now + CFG.dog.gap;
            dogBite(g, foe);
            return true;
        }
        g.stepTo(Math.round(cx(foe) - 0.5), Math.round(cy(foe) - 0.5), true);
        return true;
    }
    function installDog() {
        const G = GD();
        if (!G || G.prototype._starcia) return;
        G.prototype._starcia = true;
        const _think = G.prototype.think;
        G.prototype.think = function() {
            if (dogFight(this)) return;
            return _think.call(this);
        };
        // a blow on the dog: its own life (Dog.js's - half the hero's); badly hurt it runs out of the fight; at none it does not die, it
        // drags itself to its kennel for a day (Dog.hurtDog)
        G.prototype.takeHit = function(info) {
            if (this !== dogNow()) return "miss";
            return unswapped(() => {
                const D = DG(), dmg = Math.max(1, Math.round(info.damage || 1)), from = info.from && typeof info.from.centerX === "function" ? info.from : null;
                soundAt(this, () => { fxHit(this, dmg, "#ff9f8f"); T.audio.se("Growl", { volume: 65, pitch: 160 }); });
                D.hurtDog(dmg);
                this._stHitBy = from;
                this._stHitAt = Graphics.frameCount;
                if (from) knockFrom(this, from);
                const s = D.state();
                if (s.hp <= 0) { this._stFight = null; this._stFleeUntil = 0; return "hit"; }
                if (s.hp < D.maxHp() * CFG.dog.fleeAt) startFlee(this, from);
                return "hit";
            });
        };
        // out of the fight (running off hurt, in its kennel, hurt): nobody's foe
        G.prototype.isDown = function() { return this !== dogNow() || (this._stFleeUntil || 0) > Graphics.frameCount; };
    }

    // ------------------------------------------------------------------
    // The look: the meat on the spit over the camp's fire, the brands in the men's hands (a flame and its light)
    // ------------------------------------------------------------------
    const bmpCache = {};
    function spitBitmap(k) {   // k: 0 raw .. 1 roasted; the frame (0-3) turns the meat
        const key = "spit" + Math.round(k * 4);
        if (bmpCache[key]) return bmpCache[key];
        const b = new Bitmap(48, 34), c = b.context;
        const px = (x, y, col, w, h) => { c.fillStyle = col; c.fillRect(x, y, w || 2, h || 2); };
        // the two forked sticks and the rod (2 px cells, the camp fire's wood)
        for (const x of [4, 40]) { px(x - 1, 8, "#1e1a17", 4, 26); px(x, 9, "#6a4022", 2, 24); px(x - 3, 5, "#1e1a17", 4, 5); px(x + 1, 5, "#1e1a17", 4, 5); px(x - 2, 6, "#5a361d", 2, 3); px(x + 2, 6, "#5a361d", 2, 3); }
        px(2, 9, "#1e1a17", 44, 4);
        px(3, 10, "#3a2414", 42, 2);
        // the meat: a chunk, raw red going brown
        const lerp = (a, b2, t) => Math.round(a + (b2 - a) * t);
        const col = (r1, g1, b1, r2, g2, b2) => "rgb(" + lerp(r1, r2, k) + "," + lerp(g1, g2, k) + "," + lerp(b1, b2, k) + ")";
        px(14, 6, "#1d0f0a", 20, 12);
        px(16, 5, "#1d0f0a", 16, 2);
        px(15, 7, col(176, 74, 56, 122, 60, 30), 18, 10);
        px(15, 7, col(204, 110, 88, 160, 92, 46), 18, 2);
        px(17, 13, col(140, 52, 40, 92, 44, 22), 14, 4);
        px(19, 9, col(232, 170, 150, 214, 150, 92), 4, 2);
        b._baseTexture.update();
        return (bmpCache[key] = b);
    }
    function flameFrames() {
        if (bmpCache.flames) return bmpCache.flames;
        const out = [];
        const LAYERS = [["#b8321a", 1], ["#ee6a1a", 0.75], ["#ffb43a", 0.5], ["#fff1a6", 0.28]];
        for (let f = 0; f < 6; f++) {
            const b = new Bitmap(12, 18), c = b.context, ph = f / 6 * Math.PI * 2;
            for (const [color, hk] of LAYERS) {
                c.fillStyle = color;
                const h = Math.round((12 + 3 * Math.sin(ph) + 2 * Math.sin(ph * 2 + 1)) * hk);
                for (let y = 0; y < h; y++) {
                    const w = Math.max(1, Math.round((5 * hk + 1) * (1 - y / Math.max(1, h)))), sway = Math.round(Math.sin(ph + y * 0.35) * (y / 7));
                    c.fillRect(6 - Math.ceil(w / 2) + sway, 17 - y, w, 1);
                }
            }
            b._baseTexture.update();
            out.push(b);
        }
        return (bmpCache.flames = out);
    }
    function Sprite_StarciaLayer() { this.initialize(...arguments); }
    Sprite_StarciaLayer.prototype = Object.create(Sprite.prototype);
    Sprite_StarciaLayer.prototype.constructor = Sprite_StarciaLayer;
    Sprite_StarciaLayer.prototype.initialize = function(tilemap) {
        Sprite.prototype.initialize.call(this);
        this._tilemap = tilemap;
        this._spit = null;
        this._brands = new Map();
        this._age = 0;
    };
    const toSX = x => Math.round($gameMap.adjustX(x - 0.5) * $gameMap.tileWidth() + $gameMap.tileWidth() / 2);
    const toSY = y => Math.round($gameMap.adjustY(y - 0.5) * $gameMap.tileHeight() + $gameMap.tileHeight() / 2);
    Sprite_StarciaLayer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!$gameMap) return;
        this._age++;
        this.updateSpit();
        this.updateBrands();
    };
    Sprite_StarciaLayer.prototype.updateSpit = function() {
        const camp = campHere(), r = camp && camp.roast;
        if (!r) { if (this._spit) { if (this._spit.parent) this._spit.parent.removeChild(this._spit); this._spit = null; } return; }
        if (!this._spit || !this._spit.parent) {
            this._spit = new Sprite();
            this._spit.anchor.set(0.5, 1);
            this._spit.z = 3.2;
            this._tilemap.addChild(this._spit);
        }
        const k = Math.max(0, Math.min(1, (clock() - (r.at || clock())) / 1.5));
        this._spit.bitmap = spitBitmap(k);
        this._spit.x = toSX(camp.x + 0.5);
        this._spit.y = toSY(camp.y + 0.5) + 8;
        this._spit.scale.y = 1 + (Math.floor(this._age / 20) % 2 ? 0 : 0.03);   // (it is turned now and then)
        if (this._age % 90 === 0) {   // (the fat drips into the fire: a flare of sparks)
            const Cb = CB();
            if (Cb && Cb.sparksAt && Math.hypot(camp.x + 0.5 - hero()._realX - 0.5, camp.y + 0.5 - hero()._realY - 0.5) < 14) Cb.sparksAt(camp.x + 0.5, camp.y + 0.2, "#ffcf5a", 4);
        }
    };
    Sprite_StarciaLayer.prototype.updateBrands = function() {
        const seen = new Set(), Hm = HM();
        for (const h of (Hm ? Hm.list : [])) {
            if (!h._brand || h._dead || !h._sprite) continue;
            seen.add(h);
            let s = this._brands.get(h);
            if (!s || !s.parent) {
                s = new Sprite();
                s.anchor.set(0.5, 1);
                s.z = 4;
                this._tilemap.addChild(s);
                this._brands.set(h, s);
            }
            const f8 = typeof h.face8 === "function" ? h.face8() || h.direction() : h.direction(), side = [1, 4, 7].includes(f8) ? -1 : [3, 6, 9].includes(f8) ? 1 : 0;
            s.bitmap = flameFrames()[Math.floor((this._age + h._hid * 3) / 5) % 6];
            s.x = h._sprite.x + (side ? side * 14 : 10);
            s.y = h._sprite.y - 30 + (f8 === 8 ? 4 : 0);
        }
        for (const [h, s] of this._brands) if (!seen.has(h)) { if (s.parent) s.parent.removeChild(s); this._brands.delete(h); }
    };
    // the brands' light at night (Farming_Render.js's dark: its lights list - glow and flicker like every flame)
    function brandLights() {
        const out = [], Hm = HM();
        for (const h of (Hm ? Hm.list : [])) {
            if (!h._brand || h._dead) continue;
            const x = toSX(h.centerX()), y = toSY(h.centerY());
            out.push({ x, y: y - 34, r: 150, i: 0.8, id: 7300 + (h._hid % 100), gx: x, gy: y, hf: 10, glow: true });
        }
        return out;
    }
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this._starciaLayer = new Sprite_StarciaLayer(this._tilemap);
        this._tilemap.addChild(this._starciaLayer);
        const nl = this._nightLight;
        if (nl && typeof nl.lights === "function" && !nl._starciaLit) {
            const base = nl.lights;
            nl.lights = function() { const out = base.call(this); try { out.push(...brandLights()); } catch (e) { /* no brand light this frame */ } return out; };
            nl._starciaLit = true;
        }
    };

    // ------------------------------------------------------------------
    // Raw meat thrown out at night where the wolves are: a hint (once a night)
    // ------------------------------------------------------------------
    function hookDrops() {
        const D = T.api("Drops");
        if (!D || !D.drop || D._starcia) return;
        D._starcia = true;
        const _drop = D.drop;
        D.drop = function(id, n) {
            const b = _drop.apply(this, arguments);
            try {
                const night = P.core.activeNow("wolf"), wolves = (P.core.mapTargets().wolf || 0) > 0 || H().animals.some(a => a.kind() === "wolf");
                const key = T.time.day() * 24 + Math.floor(T.time.hour() / 12);
                if (b && night && wolves && meatIds().includes(Number(id)) && S().hints.bait !== key) {
                    S().hints.bait = key;
                    T.popup("Zapach surowego mięsa niesie się w ciemności - wilki go zwęszą", { icon: $dataItems[id] ? $dataItems[id].iconIndex : 0, color: "#ffd98f" });
                }
            } catch (e) { /* (no hint) */ }
            return b;
        };
    }

    // ------------------------------------------------------------------
    // F9 (Debug.js): the beasts and the men a few tiles from the hero
    // ------------------------------------------------------------------
    let pending = null;
    function openTile(x, y) {
        const G = P.path.pathGrid(), F = T.api("Farming");
        return $gameMap.isValid(x, y) && P.path.gridOpen(G, x, y, true) && $gameMap.checkPassage(x, y, 0x0f) && !(F && (F.buildingAt(x, y) || F.hasObjectTile(x, y))) &&
            !$gameMap.eventsXy(x, y).length && !H().animals.some(a => a._x === x && a._y === y) && !(HM() && HM().list.some(h => h._x === x && h._y === y));
    }
    // a free tile lo-hi from (x0, y0), at least `far` from the hero, the farther from him the better (they meet away from him)
    function spotFrom(x0, y0, lo, hi, far) {
        let best = null, bs = -Infinity;
        const px = $gamePlayer.x, py = $gamePlayer.y;
        for (let y = y0 - Math.ceil(hi); y <= y0 + Math.ceil(hi); y++) for (let x = x0 - Math.ceil(hi); x <= x0 + Math.ceil(hi); x++) {
            const d = Math.hypot(x - x0, y - y0), dh = Math.hypot(x - px, y - py);
            if (d < lo || d > hi || dh < far || !openTile(x, y)) continue;
            const s = dh + Math.random();
            if (s > bs) { bs = s; best = { x, y }; }
        }
        return best;
    }
    function summon() {
        const p = pending;
        pending = null;
        const Hm = HM(), Hn = H();
        if (!Hm || !Hn) return;
        if (p === "camp") {
            const camp = Hm.camp({ far: 9, near: 14, tag: "" });
            if (!camp) { popup("Nie ma tu miejsca na obóz", 0, "#bcd8ff"); return; }
            const s = spotFrom(camp.x, camp.y, 8, 11, 7);
            const pack = s ? Hn.spawnPack(s.x, s.y, 3) : null;
            if (!pack) { popup("Nie ma tu miejsca dla watahy", 0, "#bcd8ff"); return; }
            for (const w of pack.members) w._summoned = true;
            pack._prowl = { a: Math.atan2(s.y - camp.y, s.x - camp.x), t: 0, wait: 200, howl: 30 };
            popup("Między drzewami błyszczą oczy... wataha krąży wokół obozu", 0, "#ffd98f");
            return;
        }
        if (p === "boar" || p === "bear") {
            const h = Hm.spawnNear("bandit", 7, 9, { tag: "starcia", mode: "roam" });
            if (!h) { popup("Nie ma tu miejsca", 0, "#bcd8ff"); return; }
            h._summoned = true;
            const s = spotFrom(h._x, h._y, p === "bear" ? 3 : 4, p === "bear" ? 4 : 5.5, 6);
            const a = s ? Hn.spawn(p, s.x, s.y) : null;
            if (!a) { Hm.remove(h); popup("Nie ma tu miejsca", 0, "#bcd8ff"); return; }
            a._summoned = true;
            a._home = { x: s.x, y: s.y };
            a._clash = h;
            a._aware = 1;
            if (p === "bear") a.bearRear(); else a.setMode("warn", 40);
            a.turnTowardCharacter(h);
            popup(p === "bear" ? "Niedźwiedź wypatrzył bandytę..." : "Dzik wypatrzył bandytę...", 0, "#ffd98f");
        }
    }

    // ------------------------------------------------------------------
    // The clock: every frame the boar's ram and the archers' fetching; every CFG.every frames the looks round (the packs and the beasts on
    // one frame, the men on another) - only for those near the hero
    // ------------------------------------------------------------------
    let auto = true;   // tests switch the looks round off (and call tick() themselves)
    const nearHero = c => heroDist(c) < CFG.near;
    function tickBeasts() {
        const Hn = H();
        for (const pack of Hn.packs.slice()) { const L = pack.members.find(m => !m._dead); if (L && nearHero(L)) packTick(pack); }
        for (const a of Hn.animals.slice()) {
            if (a._dead || !nearHero(a)) continue;
            if (a.kind() === "boar") boarTick(a);
            else if (a.kind() === "bear") bearTick(a);
            else if (a._pack === null && SP[a.kind()].pack && a._clash && !alive(a._clash)) a._clash = null;
        }
    }
    function tickMen() {
        const Hm = HM();
        if (!Hm || Hm.robbery) return;
        const camp = campHere();
        if (camp) campGame(camp);
        for (const h of Hm.list.slice()) {
            if (h._dead || !nearHero(h)) continue;
            archerTick(h);
            manTick(h);
        }
    }
    function tick() { if (!$gameMap || !H()) return; tickBeasts(); tickMen(); }
    T.onMapUpdate(() => {
        if (!$gameMap || !$gamePlayer || !H()) return;
        installMen();
        installDog();
        hookDrops();
        if (pending) summon();
        boarRam();
        fetchUpdate();
        if (!auto) return;
        const f = Graphics.frameCount % CFG.every;
        if (f === 0) tickBeasts();
        else if (f === Math.floor(CFG.every / 2)) tickMen();
    }, { owner: PLUGIN, name: "update" });
    T.on("load", () => { realP = null; swapA = null; soundSpot = null; firesAt = -99; baitAt = -99; }, { owner: PLUGIN });
    T.on("mapEnter", () => { realP = null; swapA = null; soundSpot = null; firesAt = -99; baitAt = -99; }, { owner: PLUGIN });
    installMen();
    installDog();

    window.Starcia = T.register(PLUGIN, {
        CFG, LINES, state: S,
        get pending() { return pending; }, set pending(v) { pending = v; },
        auto: v => { auto = !!v; }, tick, tickBeasts, tickMen,
        alive, freeMan, freeBeast, dogNow, hero, fires: fireSpots, fireNear, shielded, baits,
        setPackClash, clearPack, pickPrey, packTick, boarTick, bearTick, boarRam, manTick, archerTick, setManFoe, calmDown, hurtBeast, dogFight, campGame,
        get swapping() { return swapA; }
    });
})();
