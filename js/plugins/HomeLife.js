//=============================================================================
// HomeLife.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Życie w domu dziadka: dzień dziadka Stacha (kocioł, maselnica, kołowrotek, fotel bujany, fajka, łóżko), kot Mruczek i codzienny kapuśniak z kotła. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter HomeAmbience
 * @orderAfter HomeDecor
 * @orderAfter Hunting
 * @orderAfter Dog
 * @orderAfter SpeechBubbles
 * @orderAfter HeroLook
 * @orderAfter Story
 * @orderAfter TavernLife
 *
 * @param purrVolume
 * @text Mruczenie kota: głośność
 * @type number
 * @min 0
 * @max 100
 * @default 30
 *
 * @param snoreVolume
 * @text Chrapanie dziadka: głośność
 * @type number
 * @min 0
 * @max 100
 * @default 22
 *
 * @help
 * ============================================================================
 * HomeLife.js - życie w chacie dziadka (mapa 19, „Dom dziadka - Wnętrze”)
 * ============================================================================
 * DZIADEK STACH (tylko w grze z fabułą - Story.js; w starej grze go nie ma)
 *   Ma swój dzień, a między miejscami chodzi spokojnie, w 8 kierunkach:
 *    6-9    przy kotle, miesza kapuśniak (nad kotłem para - HomeAmbience.js),
 *    9-10   ubija masło w maselnicy (tłuczek chodzi w górę i w dół),
 *    10-12  krząta się: półka ze spiżarką, okno, skrzynia, kredens,
 *    12-13  przędzie przy kołowrotku, siedząc w fotelu (koło się kręci),
 *    13-18  buja się w fotelu (fotel i dziadek bujają się razem),
 *    18-22  z fajką w fotelu: kłęby dymu i od czasu do czasu kółka z dymu
 *           (fajkę bierze ze stolika i wieczorem ją tam odkłada),
 *    22-6   śpi w swoim łóżku pod kołdrą z łatek; nad łóżkiem „Zzz”,
 *           a gdy bohater stoi blisko - ciche chrapanie.
 *   Rozmowa (Story.js) działa wszędzie: przycisk akcji na dziadku, na fotelu
 *   albo kołowrotku, gdy w nim siedzi, i na łóżku, gdy śpi. W czasie
 *   rozmowy i wstępu dziadek stoi. Nigdy nie staje w drzwiach; gdy bohater
 *   stoi mu na drodze, czeka albo obchodzi go.
 *   Czasem, gdy bohater wchodzi do domu, dziadek coś rzuci: o pogodzie,
 *   o długu, o kocie.
 *
 * KAPUŚNIAK Z KOTŁA (gra z fabułą)
 *   Raz dziennie, od 8:00, przycisk akcji przy kotle (palenisko): miska
 *   kapuśniaku (przedmiot 131). Jutro znowu.
 *
 * KOT MRUCZEK (zawsze, także w starej grze)
 *   Szary dachowiec. Najczęściej śpi zwinięty przy palenisku; chodzi też na
 *   dywan, na parapet okna we wnęce bohatera, siada u stóp dziadka, gdy ten
 *   buja się w fotelu, a nocą śpi na posłaniu bohatera. Nie wychodzi z domu
 *   i nie siada w drzwiach. Przycisk akcji: mruczy (raz dziennie +5
 *   wytrzymałości - „Kot mruczy - odpoczywasz chwilę”).
 *
 * Grafiki: img/characters/Npc_Dziadek_Home.png, Home_Sleeper.png,
 * $Animal_Cat.png, !$Animal_Cat_Sleep.png, anim8/Cat_Walk8.png,
 * !$House_Wheel.png, !$House_Churn.png (tools/homelife/build_art.py).
 * Kot to zdarzenie nr 960 dopisywane przy wczytaniu mapy (960-979 zajęte
 * przez tę wtyczkę) - w edytorze go nie widać.
 * Zapis: Tawerna.state("homeLife") (dawny $gameSystem._homeLife przechodzi
 * sam przy wczytaniu). Korzysta z TawernaCore.js (musi stać wyżej na liście).
 * Dla innych wtyczek i testów: window.HomeLife (activityAt, grandpaState,
 * catState, catGo, cauldron, pet, snap, layout).
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "HomeLife";
    const T = window.Tawerna;
    if (!T) throw new Error("HomeLife.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const params = PluginManager.parameters(PLUGIN);
    const num = (v, d) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? d : Number(v));
    const PURR_VOL = num(params.purrVolume, 30), SNORE_VOL = num(params.snoreVolume, 22);

    const MAP = 19;
    const GRANDPA = 901;            // Story.js's grandpa (a story game only)
    const CAT = 960;                // the cat (ours: 960-979)
    const SOUP = 131, SOUP_FROM = 8;
    const PURR_STAMINA = 5, STAMINA_ICON = 82;
    const BED_AT = 21.75;           // he goes to bed a little before Story's night (22-6): lying by 22
    const WALK_SPEED = 3, SHUFFLE_SPEED = 2.4, CAT_SPEED = 3;
    const TW = 48;
    // grandpa's home sheet (tools/homelife/build_art.py): row 0 sitting down (0 standing .. 4 seated), row 1 seated (0 plain,
    // 1 pipe, 2 pipe glowing, 3 breathing out), row 2 stirring (facing north-west, 8 frames); cells of 64 like $Npc_Dziadek
    const HOME = "Npc_Dziadek_Home", GC = 64;
    // ($Npc_Dziadek is lifted 6 px like every character, the chair - an object - is not: +6 puts his feet on the chair's, +2 in front)
    const SEAT_DY = 8;
    const MOUTH = [-1, -38.5], BOWL = [5.5, -41];   // on his seated frame, from his feet
    const ROCK = { rock: 0.042, smoke: 0.018, period: 170 };   // radians of the chair's swing; frames there and back
    const SMOKE = { cycle: 360, draw: 60, rest: 100, out: 170 };  // the pipe: draws on it, rests, breathes out, rests
    const CAT_SLEEP = "!$Animal_Cat_Sleep", CC = 68;
    const WHEEL = "!$House_Wheel", CHURN = "!$House_Churn", PC = 96;
    const SLEEPER = "Home_Sleeper", QC = 144;
    const HEAD = [-48, -108];       // grandpa's head on the pillow, from the quilt's feet (its sprite's anchor)
    const BAD = "#ff9f8f", GOOD = "#9ff0a8", MUTED = "#c9ccd2";
    const LOOK8_CAT = { sheet: "anim8/Cat_Walk8", cell: 68, stride: 1.0 };
    const LOOK8_GRANDPA = { sheet: "Npc_Dziadek_Walk8", cell: 64, stride: 1.4 };

    // the 8-way walks (Hunting.js draws them: the facing from the way it goes, the legs from the way it has come)
    const Hunting = T.api("Hunting");
    if (Hunting && Hunting.LOOK8) {
        Hunting.LOOK8["$Animal_Cat"] = LOOK8_CAT;
        Hunting.LOOK8["$Npc_Dziadek"] = LOOK8_GRANDPA;
    }

    // ------------------------------------------------------------------
    // State: Tawerna.state("homeLife") = $gameSystem._tw.homeLife (plain data; an older save's $gameSystem._homeLife is taken over)
    // ------------------------------------------------------------------
    const S = T.state.define("homeLife", () => ({ v: 1, soupDay: -1, soups: 0, purrDay: -1, purrs: 0, pipe: false, barkAt: -99, lastBark: "" }),
        { version: 1, adopt: "_homeLife", owner: PLUGIN });
    const day = () => T.time.day();
    const hour = () => T.time.hour();
    const clock = () => day() * 24 + hour();
    const here = () => !!window.$gameMap && $gameMap.mapId() === MAP;
    const storyOn = () => !!T.call("Story", "active");
    const introDone = () => { const s = T.call("Story", "state"); return !!s && s.intro === 2; };
    const rand = n => Math.floor(Math.random() * n);
    const pick = list => list[rand(list.length)];
    const frame = () => Graphics.frameCount;
    function popup(icon, text, colour) {
        T.popup(text, { icon: icon || 0, color: colour || "#eceef0" });
    }
    function bark(ch, text, frames) {
        const SB = T.api("SpeechBubbles");
        if (ch && text && SB && SB.say) SB.say(ch, text, frames);
    }
    function se(name, volume, pitch) {   // (the core's pool: a file that fails to load stays silent)
        if (volume > 0) T.audio.se(name, { volume, pitch: pitch || 100 });
    }

    function grandpa() {
        if (!here() || !storyOn()) return null;
        const e = $gameMap.event(GRANDPA), tag = e && e.event() ? T.tag(e, "Story") : null;
        return tag && tag.pos[0] === "grandpa" ? e : null;   // (<Story:grandpa>: Story.js's own, not an editor's event on 901)
    }
    function cat() {
        if (!here()) return null;
        const e = $gameMap.event(CAT);
        return e && e.event() ? e : null;
    }
    const BUSY = { only: ["event", "message", "sceneChange", "transfer"] };   // (Tawerna.isCalm's checks this house has always used)
    const busy = () => !window.$gameMap || !T.isCalm(SceneManager._scene, BUSY);

    // ------------------------------------------------------------------
    // The cat's event: put into the map's data when it loads (like Story.js's characters) - the map file stays as it is
    // ------------------------------------------------------------------
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function catData(x, y) {
        const page = { conditions: Object.assign({}, BLANK), directionFix: false, image: { tileId: 0, characterName: "$Animal_Cat", direction: 2, pattern: 1, characterIndex: 0 },
            list: [C(355, ["HomeLife.pet(this)"]), C(0, [])], moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false },
            moveSpeed: CAT_SPEED, moveType: 0, priorityType: 1, stepAnime: false, through: true, trigger: 0, walkAnime: true };
        return { id: CAT, name: "Mruczek", note: "<HomeLife:cat>", x, y, pages: [page] };
    }
    const hearthRe = /^Palenisko/i;
    // (ours: 960-979; a game saved in the house before the cat came gets it as it loads - the core's)
    T.inject(MAP, { ids: [960, 979], owner: PLUGIN, build(data) {
        const h = data.events.find(e => e && hearthRe.test(e.name || ""));
        const at = h ? [h.x - 1, h.y + 1] : [Math.floor(data.width / 2), Math.floor(data.height / 2)];
        return [catData(at[0], at[1])];
    } });

    // ------------------------------------------------------------------
    // The house: where things stand (found by the events' names - the user moves things in the editor), where one may walk
    // ------------------------------------------------------------------
    const PROPS = {
        hearth: hearthRe, chair: /^Fotel dziadka/i, wheel: /^Kołowrotek/i, churn: /^maselnica/i, pipe: /^fajka/i,
        chest: /^Skrzynia dziadka/i, quilt: /^Kołdra/i, door: /^Drzwi/i, heroBed: /^Posłanie/i
    };
    let lay = null;
    function layout() {
        if (!lay || lay.gm !== $gameMap || lay.map !== $gameMap.mapId()) lay = buildLayout();
        return lay;
    }
    function propsOf(re) {
        return $gameMap.events().filter(e => e.event() && re.test(e.event().name || "") && e.eventId() !== GRANDPA && e.eventId() !== CAT);
    }
    function buildLayout() {
        const W = $gameMap.width(), H = $gameMap.height(), ev = {};
        for (const e of $gameMap.events()) delete e._homeKind;
        for (const k of Object.keys(PROPS)) ev[k] = propsOf(PROPS[k])[0] || null;
        const beds = propsOf(PROPS.heroBed);
        if (beds.length) ev.heroBed = beds.reduce((a, b) => (b.y > a.y ? b : a));   // (the foot end of the straw bed)
        for (const k of Object.keys(ev)) if (ev[k]) ev[k]._homeKind = k;
        // fully passable tiles without anything solid on them (the characters are not counted here). The solid things are looked at
        // anew every frame: HomeDecor.js puts some up and takes them away (the pumpkins by the door in autumn, a sheaf)
        const walk = [];
        for (let y = 0; y < H; y++) {
            walk.push([]);
            for (let x = 0; x < W; x++) walk[y].push($gameMap.checkPassage(x, y, 0x0f));
        }
        let solidAt = -1, solid = null;
        const solidNow = () => {
            if (solidAt === frame() && solid) return solid;
            solidAt = frame();
            solid = new Set();
            for (const e of $gameMap.events()) {
                if (e.eventId() === GRANDPA || e.eventId() === CAT) continue;
                if (e.isNormalPriority() && !e.isThrough() && e.event()) solid.add(e.x + "," + e.y);   // (also an unseen one: the straw bed)
            }
            return solid;
        };
        const ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H && walk[y][x] && !solidNow().has(x + "," + y);
        const door = ev.door ? [ev.door.x, ev.door.y] : null;
        const doorZone = (x, y) => !!door && Math.abs(x - door[0]) <= 1 && y >= door[1] - 2 && y <= door[1];
        const L = { gm: $gameMap, map: $gameMap.mapId(), W, H, walk, ok, doorZone, ev, st: {}, cat: {}, windows: [] };
        const free = (x, y) => ok(x, y) && !doorZone(x, y);
        const stand = (key, x, y, dir, pose, extra) => { if (free(x, y)) L.st[key] = Object.assign({ key, kind: "stand", x, y, dir, pose }, extra || {}); };
        const h = ev.hearth;
        if (h) {
            L.ladle = [h.x, h.y + 1];
            if (free(h.x + 1, h.y + 1)) stand("cook", h.x + 1, h.y + 1, 7, "stir");
            else if (free(h.x - 1, h.y + 1)) stand("cook", h.x - 1, h.y + 1, 9, "stir", { mirror: true });
        }
        if (ev.churn) stand("churn", ev.churn.x, ev.churn.y + 1, 8, "churn");
        stand("shelves", 13, 5, 8, "fiddle");   // (the pantry shelf and the dresser are tiles, not events)
        stand("kredens", 5, 5, 8, "fiddle");
        const nearHeroBed = (x, y) => !!ev.heroBed && Math.abs(x - ev.heroBed.x) <= 2 && Math.abs(y - ev.heroBed.y) <= 2;
        for (const w of propsOf(/^okno/i)) {
            for (let y = w.y + 1; y < H; y++) {
                if (!ok(w.x, y)) continue;
                if (!doorZone(w.x, y) && !nearHeroBed(w.x, y)) L.windows.push({ x: w.x, y, dir: 8 });
                break;
            }
        }
        L.windows.sort((a, b) => a.x - b.x);
        if (L.windows.length) stand("window", L.windows[0].x, L.windows[0].y, 8, "fiddle");
        const beside = (e, key, pose) => {
            if (!e) return;
            for (const [dx, dy, d] of [[-1, 0, 6], [1, 0, 4], [0, 1, 8], [0, -1, 2]]) {
                if (free(e.x + dx, e.y + dy)) { stand(key, e.x + dx, e.y + dy, d, pose); return; }
            }
        };
        beside(ev.chest, "chest", "fiddle");
        beside(ev.pipe, "pipeTable", "fiddle");
        if (ev.chair) {
            const c = ev.chair, exits = [[c.x + 1, c.y], [c.x - 1, c.y], [c.x, c.y + 1]].filter(([x, y]) => free(x, y));
            if (exits.length) L.chair = { kind: "chair", x: c.x, y: c.y, exits, front: [c.x, c.y + 1] };
        }
        if (ev.quilt) {
            const q = ev.quilt, exits = [[q.x - 2, q.y], [q.x - 1, q.y + 1], [q.x, q.y + 1]].filter(([x, y]) => free(x, y));
            if (exits.length) L.bed = { kind: "bed", x: q.x - 1, y: q.y - 1, exits, cells: [[q.x - 1, q.y - 2], [q.x, q.y - 2], [q.x - 1, q.y - 1], [q.x, q.y - 1], [q.x - 1, q.y], [q.x, q.y]] };
        }
        // the cat's places
        if (h) {
            if (free(h.x - 1, h.y + 1)) L.cat.hearth = { x: h.x - 1, y: h.y + 1 };
            if (free(h.x, h.y + 2)) L.cat.rug = { x: h.x, y: h.y + 2 };
        }
        if (!L.cat.hearth) L.cat.hearth = { x: $gameMap.event(CAT) ? $gameMap.event(CAT).x : 9, y: $gameMap.event(CAT) ? $gameMap.event(CAT).y : 6 };
        if (ev.heroBed) {
            const b = ev.heroBed, from = [[b.x + 1, b.y], [b.x - 1, b.y], [b.x, b.y + 1]].find(([x, y]) => free(x, y));
            if (from) L.cat.heroBed = { x: b.x, y: b.y, from };
            // the window over the straw bed: its sill (the cat jumps up from the floor below it)
            const w = propsOf(/^okno/i).find(o => Math.abs(o.x - b.x) <= 2 && o.y < b.y);
            if (w) {
                for (let y = w.y + 1; y < H; y++) if (free(w.x, y)) { L.cat.sill = { x: w.x, y: w.y + 1, from: [w.x, y], dy: -3 }; break; }
            }
        }
        L.cat.room = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (free(x, y) && !nearHeroBed(x, y)) L.cat.room.push([x, y]);
        return L;
    }

    // ------------------------------------------------------------------
    // The way: 8 directions round what stands in the way (no cutting corners), the doorway dear to grandpa and closed to the cat
    // ------------------------------------------------------------------
    function heroTiles() {
        return $gamePlayer.feetTiles ? $gamePlayer.feetTiles() : [{ x: $gamePlayer.x, y: $gamePlayer.y }];
    }
    const heroOn = (x, y) => heroTiles().some(t => t.x === x && t.y === y);
    function findPath(sx, sy, goals, opt) {
        const L = layout(), W = L.W, H = L.H, isCat = opt.who === "cat";
        const g = grandpa(), kit = isCat ? null : cat();
        const hero = new Set((opt.avoidHero || isCat ? heroTiles() : []).map(t => t.x + "," + t.y));
        const blocked = (x, y) => {
            if (!L.ok(x, y)) return true;
            if (isCat && L.doorZone(x, y)) return true;
            if (hero.has(x + "," + y)) return true;
            if (isCat && g && g.x === x && g.y === y) return true;
            return false;
        };
        const goal = new Set(goals.map(([x, y]) => x + "," + y));
        const hdist = (x, y) => Math.min(...goals.map(([gx, gy]) => { const dx = Math.abs(gx - x), dy = Math.abs(gy - y); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); }));
        const key = (x, y) => y * W + x, start = key(sx, sy);
        const gs = new Map([[start, 0]]), from = new Map(), open = [[hdist(sx, sy), sx, sy]], closed = new Set();
        let n = 0;
        while (open.length && n++ < 2000) {
            let bi = 0;
            for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
            const [, x, y] = open.splice(bi, 1)[0], k = key(x, y);
            if (closed.has(k)) continue;
            closed.add(k);
            if (goal.has(x + "," + y)) {
                const out = [];
                for (let c = k; c !== start; c = from.get(c)) out.unshift([c % W, Math.floor(c / W)]);
                return out;
            }
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                if (!dx && !dy) continue;
                const nx = x + dx, ny = y + dy;
                if (blocked(nx, ny)) continue;
                if (dx && dy && (blocked(x + dx, y) || blocked(x, y + dy))) continue;
                const cost = (dx && dy ? 1.414 : 1) + (!isCat && L.doorZone(nx, ny) ? 6 : 0) + (!isCat && kit && kit.x === nx && kit.y === ny ? 3 : 0);   // (round the cat when he can)
                const ng = gs.get(k) + cost, nk = key(nx, ny);
                if (ng < (gs.has(nk) ? gs.get(nk) : Infinity)) { gs.set(nk, ng); from.set(nk, k); open.push([ng + hdist(nx, ny), nx, ny]); }
            }
        }
        return null;
    }
    // one step to a neighbouring cell (straight or diagonal)
    function stepTo(ev, x, y) {
        const dx = Math.sign(x - ev.x), dy = Math.sign(y - ev.y);
        if (dx && dy) ev.moveDiagonally(dx > 0 ? 6 : 4, dy > 0 ? 2 : 8);
        else if (dx) ev.moveStraight(dx > 0 ? 6 : 4);
        else if (dy) ev.moveStraight(dy > 0 ? 2 : 8);
        return ev.isMovementSucceeded();
    }
    const dir4 = d => ({ 1: 2, 3: 2, 7: 8, 9: 8 }[d] || d);   // (the event's own direction: 4 ways)

    // ------------------------------------------------------------------
    // Grandpa's day
    // ------------------------------------------------------------------
    const POTTER = ["shelves", "window", "chest", "kredens"];
    function hash(a, b) {
        let h = (a * 374761393 + b * 668265263) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    function potterOrder(d) {
        const L = layout(), list = POTTER.filter(k => L.st[k]);
        for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(hash(d, i) * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
        return list;
    }
    // what he does at hour h of day d
    function activityAt(h, d) {
        const L = layout();
        if (h >= 6 && h < 9) return L.st.cook ? "cook" : L.chair ? "rock" : "stay";
        if (h >= 9 && h < 10) return L.st.churn ? "churn" : L.st.cook ? "cook" : "stay";
        if (h >= 10 && h < 12) {
            const o = potterOrder(d);
            if (o.length) return o[Math.min(o.length - 1, Math.floor((h - 10) / 2 * o.length))];
        }
        if (h >= 10 && h < 13) return L.chair ? (L.ev.wheel ? "spin" : "rock") : "stay";   // (no wheel in the house: he rocks)
        if (h >= 13 && h < 18) return L.chair ? "rock" : "stay";
        if (h >= 18 && h < BED_AT) return L.chair ? "pipe" : "stay";
        return L.bed ? "sleep" : "stay";
    }
    function targetOf(key) {
        const L = layout();
        if (key === "spin" || key === "rock" || key === "pipe") return L.chair ? Object.assign({ pose: key === "spin" ? "sit" : key === "rock" ? "rock" : "smoke" }, L.chair) : null;
        if (key === "sleep") return L.bed ? Object.assign({ pose: "sleep" }, L.bed) : null;
        if (L.st[key]) return L.st[key];
        const Sy = T.api("Story"), [x, y] = Sy && Sy.NPCS ? Sy.NPCS.grandpa.at : [10, 6];
        return { key: "stay", kind: "stand", x, y, dir: 2, pose: null };
    }

    const gctl = new WeakMap();
    function G(ev) {
        let c = gctl.get(ev);
        if (!c) gctl.set(ev, c = { key: null, steps: [], snap: true, last: clock(), seat: null, path: null, blocked: 0, stuck: 0, barked: 0 });
        return c;
    }
    const SHEET_POSES = { stir: 1, sitdown: 1, standup: 1, shuffle: 1, sit: 1, rock: 1, smoke: 1 };
    function setPose(ev, k, extra) {
        if (!k) { ev._homePose = null; delete ev._pose; return; }
        ev._homePose = Object.assign({ k, t: frame() }, extra || {});
        if (SHEET_POSES[k] || k === "sleep" || k === "liedown" || k === "getup") ev._pose = "home"; else delete ev._pose;
    }
    const poseOf = ev => (ev && ev._homePose ? ev._homePose.k : null);
    const asleep = g => !!g && (poseOf(g) === "sleep" || poseOf(g) === "liedown");
    const seated = g => !!g && ["sit", "rock", "smoke"].includes(poseOf(g));

    // straight to what he does now (a new visit, a load, the clock jumping - a night's sleep, the debug menu)
    function snap(g, c) {
        const key = introDone() ? activityAt(hour(), day()) : "intro";
        c.steps = []; c.cur = null; c.path = null; c.blocked = 0; c.stuck = 0; c.key = key;
        g.setMoveSpeed(WALK_SPEED);
        g.setOpacity(255);
        if (key === "intro") { setPose(g, null); g.setThrough(false); c.seat = null; return; }
        S().pipe = key === "pipe";
        const t = targetOf(key);
        if (t.kind === "chair") {
            g.locate(t.x, t.y); g.setThrough(true); g.setDirection(2); c.seat = "chair"; setPose(g, t.pose);
        } else if (t.kind === "bed") {
            g.locate(t.x, t.y); g.setThrough(true); g.setDirection(2); c.seat = "bed"; setPose(g, "sleep"); g.setOpacity(0);
        } else {
            const spot = freeNear(t.x, t.y, g);
            g.locate(spot[0], spot[1]); g.setThrough(false); c.seat = null;
            g.setDirection(dir4(t.dir)); setPose(g, t.pose, t.mirror ? { mirror: true } : null);
        }
    }
    function freeNear(x, y, g) {
        const L = layout(), clear = (a, b) => L.ok(a, b) && !L.doorZone(a, b) && !heroOn(a, b) && !$gameMap.eventsXy(a, b).some(e => e !== g && e.isNormalPriority() && !e.isThrough());
        if (clear(x, y)) return [x, y];
        for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) === r && clear(x + dx, y + dy)) return [x + dx, y + dy];
        }
        return [x, y];
    }
    // the steps from what he does to what he should do
    function planFor(c, key) {
        const L = layout(), st = [], t = targetOf(key), wantPipe = key === "pipe";
        if (!t) return st;
        if (c.seat === "chair" && t.kind === "chair" && S().pipe === wantPipe) { st.push({ t: "pose", k: t.pose }); return st; }
        if (c.seat === "chair") st.push({ t: "anim", k: "standup", n: 30 }, { t: "out", cells: L.chair.exits });
        if (c.seat === "bed") st.push({ t: "getup", cells: L.bed.exits });
        if (S().pipe !== wantPipe && L.st.pipeTable) {
            const p = L.st.pipeTable;
            st.push({ t: "go", cells: [[p.x, p.y]] }, { t: "face", dir: p.dir }, { t: "wait", n: 40 }, { t: "call", fn: wantPipe ? "takePipe" : "dropPipe" }, { t: "wait", n: 24 });
        }
        if (t.kind === "stand") st.push({ t: "go", cells: [[t.x, t.y]] }, { t: "face", dir: dir4(t.dir) }, { t: "pose", k: t.pose, mirror: !!t.mirror });
        else if (t.kind === "chair") st.push({ t: "go", cells: t.exits }, { t: "face", dir: 2 }, { t: "in", x: t.x, y: t.y, seat: "chair" }, { t: "anim", k: "sitdown", n: 30 }, { t: "pose", k: t.pose });
        else if (t.kind === "bed") st.push({ t: "go", cells: t.exits }, { t: "liedown", x: t.x, y: t.y });
        return st;
    }

    function updateGrandpa(g) {
        const c = G(g), now = clock();
        if (Math.abs(now - c.last) > 0.3) c.snap = true;
        c.last = now;
        if (c.snap) {
            if (g.isStarting() || g._locked) return;
            c.snap = false;
            snap(g, c);
            return;
        }
        if (!introDone()) {   // Story's talk first: he stands where Story put him
            if (c.key !== "intro") { c.key = "intro"; c.steps = []; setPose(g, null); }
            return;
        }
        if (busy() || g.isStarting() || g._locked) return;
        const want = activityAt(hour(), day());
        if (want !== c.key && !(c.cur && ATOMIC[c.cur.t])) {   // (never in the middle of getting into the chair or the bed)
            c.key = want; c.steps = planFor(c, want); c.cur = null; c.path = null;
        }
        runSteps(g, c);
    }
    const ATOMIC = { anim: 1, in: 1, out: 1, liedown: 1, getup: 1 };
    function runSteps(g, c) {
        if (!c.cur) { c.cur = c.steps.shift() || null; if (c.cur) c.cur.at = frame(); }
        const s = c.cur;
        if (!s) return;
        if (doStep(g, c, s)) { c.cur = null; c.path = null; c.blocked = 0; }
    }
    // true when the step is over
    function doStep(g, c, s) {
        const age = frame() - s.at;
        switch (s.t) {
            case "pose":
                setPose(g, s.k, s.mirror ? { mirror: true } : null);
                return true;
            case "face":
                if (g.isMoving()) return false;
                g.setDirection(s.dir);
                return true;
            case "wait":
                return age >= s.n;
            case "call":
                if (s.fn === "takePipe") S().pipe = true;
                if (s.fn === "dropPipe") S().pipe = false;
                return true;
            case "anim":
                if (age === 0) setPose(g, s.k);
                return age >= s.n;
            case "go":
                if (poseOf(g)) setPose(g, null);
                return walk(g, c, s);
            case "in":   // into the chair: a shuffle sideways, facing the room
                if (!s.moved) { g.setThrough(true); g.setMoveSpeed(SHUFFLE_SPEED); setPose(g, "shuffle"); stepTo(g, s.x, s.y); s.moved = true; return false; }
                if (g.isMoving()) return false;
                g.setMoveSpeed(WALK_SPEED);
                g.setDirection(2);
                c.seat = s.seat;
                return true;
            case "out": {   // out of the chair to a free side
                if (!s.moved) {
                    const to = s.cells.find(([x, y]) => !heroOn(x, y) && !$gameMap.eventsXy(x, y).some(e => e !== g && e.isNormalPriority() && !e.isThrough()));
                    if (!to) return false;   // (someone in the way: he stays a moment longer)
                    g.setMoveSpeed(SHUFFLE_SPEED); setPose(g, "shuffle"); stepTo(g, to[0], to[1]); s.moved = true;
                    return false;
                }
                if (g.isMoving()) return false;
                g.setMoveSpeed(WALK_SPEED); g.setThrough(false); setPose(g, null); c.seat = null;
                return true;
            }
            case "liedown": {   // he fades out beside the bed as the sleeper fades in over the quilt
                if (s.t0 === undefined) { s.t0 = frame(); setPose(g, "liedown"); g.setDirection(6); }
                const a = frame() - s.t0;
                g.setOpacity(Math.max(0, 255 - Math.round(255 * a / 40)));
                if (a < 44) return false;
                g.setThrough(true); g.locate(s.x, s.y); g.setDirection(2); g.setOpacity(0); c.seat = "bed"; setPose(g, "sleep");
                return true;
            }
            case "getup": {
                if (s.t0 === undefined) {
                    const to = s.cells.find(([x, y]) => !heroOn(x, y));
                    if (!to) return false;   // (the hero stands by the bed: a moment)
                    s.t0 = frame(); setPose(g, "getup"); g.locate(to[0], to[1]); g.setOpacity(0); g.setDirection(2);
                }
                const a = frame() - s.t0;
                g.setOpacity(Math.min(255, Math.round(255 * a / 40)));
                if (a < 44) return false;
                g.setThrough(false); g.setOpacity(255); c.seat = null; setPose(g, null);
                return true;
            }
        }
        return true;
    }
    // walking there: a step at a time, waiting (and then going round) when the hero stands in the way
    function walk(g, c, s) {
        if (g.isMoving()) return false;
        if (s.cells.some(([x, y]) => x === g.x && y === g.y)) return true;
        const avoid = c.blocked > 40;
        if (!c.path) {
            c.path = findPath(g.x, g.y, s.cells.filter(([x, y]) => !avoid || !heroOn(x, y)), { who: "grandpa", avoidHero: avoid });
            if (!c.path) {
                if (++c.stuck > 900) { c.stuck = 0; snap(g, c); }   // (a way that never opens: he is simply there, as a last resort)
                else if (c.stuck % 60 === 0) c.blocked += 20;
                noteBlocked(g, c);
                return false;
            }
        }
        const next = c.path[0];
        if (!next) return true;
        if (heroOn(next[0], next[1])) {
            c.blocked++;
            if (c.blocked === 45 || c.blocked % 120 === 0) c.path = null;   // round him
            noteBlocked(g, c);
            g.turnTowardCharacter($gamePlayer);
            return false;
        }
        if (stepTo(g, next[0], next[1])) { c.path.shift(); c.blocked = 0; c.stuck = 0; }
        else { c.blocked++; if (c.blocked % 30 === 0) c.path = null; noteBlocked(g, c); }
        return false;
    }
    function noteBlocked(g, c) {
        if (c.blocked < 150 || frame() - c.barked < 60 * 25) return;
        c.barked = frame();
        bark(g, pick(["Przepuścisz staruszka?", "Z drogi, młodzieży - stary idzie!", "Hop, hop, wnuku... ustąpisz miejsca?"]));
    }

    // ------------------------------------------------------------------
    // The cat's day: sleeps by the hearth most of the time, now and then the rug, the sill, grandpa's feet; at night the straw bed
    // ------------------------------------------------------------------
    const cctl = new WeakMap();
    function K(ev) {
        let c = cctl.get(ev);
        if (!c) cctl.set(ev, c = { snap: true, steps: [], cur: null, path: null, until: 0, spot: null, last: null, purr: 0, perch: null, pause: 0, hold: 0 });
        return c;
    }
    const catNight = () => { const h = hour(); return h >= 22 || h < 6; };
    function catSnap(ev, c) {
        const L = layout(), night = catNight();
        const spot = night && L.cat.heroBed ? "heroBed" : "hearth";
        const p = L.cat[spot] || L.cat.hearth;
        c.steps = []; c.cur = null; c.path = null; c.spot = spot; c.last = spot; c.perch = spot === "heroBed" ? p.from : null;
        ev.locate(p.x, p.y);
        ev.setMoveSpeed(CAT_SPEED);
        ev.setDirection(2);
        ev._homeDy = 0;
        setCatPose(ev, "sleep");
        c.until = frame() + 60 * (40 + rand(80));
    }
    function setCatPose(ev, k) {
        if (!k) { ev._homePose = null; delete ev._pose; return; }
        ev._homePose = { k, t: frame() };
        if (k === "sleep" || k === "curl" || k === "uncurl") ev._pose = "home"; else delete ev._pose;
    }
    // where the cat sits at his feet: beside the chair, else diagonally in front of it - never on the cell right in front of it
    // (the one you face him from to talk: a cat there would take the O)
    function feetCells(L) {
        const c = L.chair;
        if (!c) return [];
        const side = [[c.x + 1, c.y], [c.x - 1, c.y]].filter(([x, y]) => c.exits.some(e => e[0] === x && e[1] === y));
        return side.length ? side : [[c.x + 1, c.y + 1], [c.x - 1, c.y + 1]].filter(([x, y]) => L.ok(x, y));
    }
    function catChoose(ev, c) {
        const L = layout(), night = catNight(), g = grandpa(), h = hour();
        const opts = night ? [["heroBed", 7], ["hearth", 3]]
            : [["hearth", 7], ["rug", 2], ["sill", h >= 8 && h < 19 ? 2 : 0], ["stroll", 2], ["feet", seated(g) && poseOf(g) !== "sit" ? 6 : 0]];
        const ok = opts.filter(([k, w]) => w > 0 && (k === "stroll" ? L.cat.room.length : k === "feet" ? feetCells(L).length > 0 : !!L.cat[k]) && (k !== c.last || k === "hearth" || k === "heroBed"));
        const total = ok.reduce((a, [, w]) => a + w, 0);
        let r = Math.random() * total, k = "hearth";
        for (const [key, w] of ok) { if ((r -= w) < 0) { k = key; break; } }
        catPlan(ev, c, k);
    }
    function catPlan(ev, c, k) {
        const L = layout(), st = [];
        if (c.perch) st.push({ t: "uncurl" }, { t: "hop", x: c.perch[0], y: c.perch[1] });
        else if (poseOf(ev) === "sleep") st.push({ t: "uncurl" });
        const secs = (a, b) => 60 * (a + rand(b - a));
        let p;
        switch (k) {
            case "hearth": p = L.cat.hearth; st.push({ t: "go", x: p.x, y: p.y }, { t: "face", dir: 2 }, { t: "curl" }, { t: "stay", n: secs(70, 200) }); break;
            case "rug": p = L.cat.rug; st.push({ t: "go", x: p.x, y: p.y }, { t: "face", dir: 2 }); if (Math.random() < 0.5) st.push({ t: "stay", n: secs(12, 30) }); else st.push({ t: "curl" }, { t: "stay", n: secs(50, 120) }); break;
            case "sill": p = L.cat.sill; st.push({ t: "go", x: p.from[0], y: p.from[1] }, { t: "face", dir: 8 }, { t: "stay", n: 40 }, { t: "hop", x: p.x, y: p.y, dy: p.dy, perch: p.from }, { t: "face", dir: 2 }, { t: "stay", n: secs(25, 60) }); break;
            case "stroll": { const r = L.cat.room[rand(L.cat.room.length)]; st.push({ t: "go", x: r[0], y: r[1] }, { t: "look" }, { t: "stay", n: secs(5, 14) }, { t: "look" }, { t: "stay", n: secs(3, 8) }); break; }
            case "feet": {
                const g = grandpa(), cells = feetCells(L), ex = cells.filter(([x, y]) => !(g && g.x === x && g.y === y));
                const f = ex[0] || cells[0];
                st.push({ t: "go", x: f[0], y: f[1] }, { t: "face", dir: 2 }, { t: "stay", n: secs(8, 16) });
                if (Math.random() < 0.6) st.push({ t: "curl" }, { t: "stayFeet", n: secs(40, 110) }); else st.push({ t: "stayFeet", n: secs(20, 50) });
                break;
            }
            case "heroBed": p = L.cat.heroBed; st.push({ t: "go", x: p.from[0], y: p.from[1] }, { t: "face", dir: 4 }, { t: "stay", n: 30 }, { t: "hop", x: p.x, y: p.y, perch: p.from }, { t: "face", dir: 2 }, { t: "curl" }, { t: "stay", n: secs(120, 300) }); break;
        }
        c.spot = k; c.last = k; c.steps = st; c.cur = null; c.path = null; c.until = 0;
    }
    function updateCat(ev) {
        const c = K(ev);
        if (c.snap) { c.snap = false; catSnap(ev, c); return; }
        if (ev.isStarting() || ev._locked || busy()) return;
        if (c.purr > 0) {
            if (--c.purr === 0 && c.wasAsleep) {   // (back to sleep)
                c.steps.unshift({ t: "curl" });
                if (!c.steps.some(q => q.t === "stay" || q.t === "stayFeet")) c.steps.push({ t: "stay", n: 60 * 40 });
                c.wasAsleep = false;
            }
            return;
        }
        if (c.pause > 0) { c.pause--; return; }
        if (!c.cur) { c.cur = c.steps.shift() || null; if (c.cur) c.cur.at = frame(); }
        if (!c.cur) { if (frame() >= c.until) catChoose(ev, c); return; }
        if (catStep(ev, c, c.cur)) { c.cur = null; c.path = null; }
    }
    function catStep(ev, c, s) {
        const age = frame() - s.at;
        switch (s.t) {
            case "go": return catWalk(ev, c, s);
            case "face": if (ev.isMoving() || ev.isJumping()) return false; ev.setDirection(s.dir); if (poseOf(ev) !== "sleep") setCatPose(ev, "sit"); return true;
            case "look": ev.setDirection(pick([2, 2, 4, 6, 8])); return true;
            case "stay": return age >= s.n;
            case "stayFeet": return age >= s.n || !seated(grandpa());
            case "curl": if (age === 0) setCatPose(ev, "curl"); if (age < 60) return false; setCatPose(ev, "sleep"); return true;
            case "uncurl": if (poseOf(ev) !== "sleep" && poseOf(ev) !== "curl") return true; if (age === 0) setCatPose(ev, "uncurl"); if (age < 30) return false; setCatPose(ev, "sit"); return true;
            case "hop":
                if (age === 0) { setCatPose(ev, null); ev._homeDy = 0; ev.jump(s.x - ev.x, s.y - ev.y); }
                if (ev.isJumping()) return false;
                ev._homeDy = s.dy || 0;
                c.perch = s.perch || null;
                setCatPose(ev, "sit");
                return true;
        }
        return true;
    }
    function catWalk(ev, c, s) {
        if (ev.isMoving() || ev.isJumping()) return false;
        if (ev.x === s.x && ev.y === s.y) return true;
        setCatPose(ev, null);
        if (!c.path) {
            // (the hero stands on its spot: it settles down right beside it instead - a floor spot, not the sill's or the bed's jump-off)
            if (heroOn(s.x, s.y) && !c.steps.some(q => q.t === "hop")) {
                const L = layout(), near = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]].map(([dx, dy]) => [s.x + dx, s.y + dy])
                    .find(([x, y]) => L.ok(x, y) && !L.doorZone(x, y) && !heroOn(x, y));
                if (near) { s.x = near[0]; s.y = near[1]; }
            }
            c.path = findPath(ev.x, ev.y, [[s.x, s.y]], { who: "cat" });
            if (!c.path) { if (++c.hold > 90) { c.hold = 0; c.steps = []; c.until = frame() + 120; return true; } return false; }
        }
        const next = c.path[0];
        if (!next) return true;
        const g = grandpa();
        if (heroOn(next[0], next[1]) || (g && g.x === next[0] && g.y === next[1])) {   // the cat waits, then goes round
            if (++c.hold > 30) { c.hold = 0; c.path = null; }
            return false;
        }
        c.hold = 0;
        stepTo(ev, next[0], next[1]);
        c.path.shift();
        if (c.path.length > 1 && Math.random() < 0.05) c.pause = 30 + rand(70);   // (a cat stops, looks round, goes on)
        return false;
    }
    // the cat's own event must not start with the straw bed's "sleep?" when it lies on it (that one goes first)
    const _Game_Event_start = Game_Event.prototype.start;
    Game_Event.prototype.start = function() {
        if (this.eventId() === CAT && here() && $gameMap.eventsXy(this.x, this.y).some(e => e !== this && e.isNormalPriority() && (e.list() || []).length > 1)) return;
        _Game_Event_start.call(this);
    };

    // O on the cat: it purrs; once a day a moment's rest
    function pet(interp) {
        const ev = cat();
        if (!ev) return;
        const c = K(ev);
        if (!ev.isJumping() && !(c.cur && c.cur.t === "hop")) {   // (a jump is not broken off)
            c.wasAsleep = poseOf(ev) === "sleep" || poseOf(ev) === "curl";
            if (c.cur && c.cur.t === "go") c.steps.unshift({ t: "go", x: c.cur.x, y: c.cur.y });
            if (c.cur && (c.cur.t === "stay" || c.cur.t === "stayFeet")) c.steps.unshift(c.cur);
            c.cur = null; c.path = null;
            if (!ev.isMoving()) ev.setDirection(2);   // (a purring cat sits and looks up at you)
            setCatPose(ev, "sit");
            c.purr = 240;
        }
        se("Cat", PURR_VOL, 82 + rand(12));
        spawnHeart(ev);
        const s = S();
        s.purrs++;
        if (s.purrDay !== day()) {
            s.purrDay = day();
            if (typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(PURR_STAMINA);
            popup(STAMINA_ICON, "Kot mruczy - odpoczywasz chwilę (+" + PURR_STAMINA + " wytrzymałości)", GOOD);
        }
    }

    // ------------------------------------------------------------------
    // The soup: once a day from eight, a bowl from grandpa's kettle (a story game)
    // ------------------------------------------------------------------
    const CAULDRON = [C(355, ["HomeLife.cauldron(this)"]), C(0, [])];
    const _Game_Event_list = Game_Event.prototype.list;
    Game_Event.prototype.list = function() {
        if (this._homeKind === "hearth" && this._mapId === MAP && storyOn()) return CAULDRON;
        return _Game_Event_list.call(this);
    };
    function cauldron() {
        if (!storyOn() || !$dataItems[SOUP]) return false;
        const s = S(), g = grandpa(), awake = !!g && !asleep(g) && introDone(), item = $dataItems[SOUP];
        if (s.soupDay === day()) {
            if (awake) bark(g, pick(["Wyjadłeś już wszystko, łakomczuchu! Jutro nagotuję nowego.", "Kocioł pusty. Jutro, wnuku, jutro.", "Dno widać! Kapusta nie rośnie tak szybko, jak ty jesz."]));
            else popup(item.iconIndex, "Kocioł pusty - dziadek ugotuje jutro", MUTED);
            return false;
        }
        if (hour() < SOUP_FROM) {
            if (awake) bark(g, pick(["Jeszcze nie doszła! Dobry kapuśniak lubi czas.", "Cierpliwości, wnuku. Od ósmej, nie wcześniej!"]));
            else popup(item.iconIndex, "Kapuśniak jeszcze się nie ugotował", MUTED);
            return false;
        }
        if ($gameParty.maxItems(item) - $gameParty.numItems(item) < 1) {
            popup(item.iconIndex, "Nie zmieści się w plecaku: " + item.name, BAD);
            SoundManager.playBuzzer();
            return false;
        }
        s.soupDay = day();
        s.soups++;
        $gameParty.gainItem(item, 1);
        se("Water1", 30, 135);
        if (awake) {
            bark(g, pick(["Nalej sobie, póki gorący!", "Nalej sobie, póki gorący! Z mojej kapusty, nie z jakiejś tam kupnej.", "Jedz, jedz. Na pustym brzuchu długu nie spłacisz.",
                "Tylko nie mów Borgarowi - jeszcze by mnie zatrudnił za kucharza."]));
        } else {
            popup(item.iconIndex, "Nalewasz po cichu, żeby nie zbudzić dziadka", MUTED);
            bark($gamePlayer, "(szeptem) Dzięki, dziadku...");
        }
        return true;
    }

    // O facing the wheel while he spins or rocks in the chair behind it, or facing any cell of his bed while he sleeps: him
    const _checkThere = Game_Player.prototype.checkEventTriggerThere;
    Game_Player.prototype.checkEventTriggerThere = function(triggers) {
        _checkThere.call(this, triggers);
        if (!here() || $gameMap.isAnyEventStarting() || !triggers.includes(0)) return;
        const g = grandpa();
        if (!g) return;
        const d = this.direction(), x2 = $gameMap.roundXWithDirection(this.x, d), y2 = $gameMap.roundYWithDirection(this.y, d), L = layout();
        const cells = G(g).seat === "chair" && L.chair ? [L.chair.front, [L.chair.x, L.chair.y]] : G(g).seat === "bed" && L.bed ? L.bed.cells : [];
        if (cells.some(([x, y]) => x === x2 && y === y2)) g.start();
    };

    // ------------------------------------------------------------------
    // Coming in: now and then a word from grandpa - the weather, the debt, the cat
    // ------------------------------------------------------------------
    const ARRIVE = { chance: 0.65, gapHours: 2 };   // (not every time: now and then, and not twice within two hours)
    let arriveT = -1;
    const _performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        const coming = this.isTransferring() && this._newMapId === MAP && introDone();   // (not the new game's first scene: his talk comes then)
        _performTransfer.call(this);
        if (coming) arriveT = 100;
    };
    function arrivalLine() {
        const h = hour(), lines = [], W = T.call("Survival", "currentWeather") || null;
        if (W && W.type === "snow") lines.push("Zamykaj drzwi, bo ciepło ucieka! Mruczek od rana nie odchodzi od pieca.");
        else if (W && W.storm && (T.call("Survival", "stormLevel", day(), h) || 0) > 0.3) lines.push("Słyszysz, jak grzmi? Mruczek już siedzi pod piecem.", "Burza jak za starych czasów... Dobrze, że dach połatany.");
        else if (W) lines.push("Zmokłeś? Siadaj bliżej ognia, bo mi się przeziębisz.", "Leje jak z cebra. Dobrze, że dach po burzy połatany... prawie.");
        const st = T.call("Story", "state") || null, Story = T.api("Story");
        if (st && (st.done || st.paid >= st.debt)) lines.push("Pole nasze! Jeszcze mi się w głowie nie mieści.");
        else if (st && T.call("Story", "isOpen")) {
            const n = Story.daysLeft(), left = Story.left();
            if (n <= 5) lines.push("Termin za pasem, wnuku... Trzymam kciuki. Oba.");
            else if (st.paid > 0) lines.push("Lordowi już coś oddałeś? Dobry z ciebie wnuk. Brakuje jeszcze " + left + " G.");
            else lines.push("Brakuje jeszcze " + left + " G dla Lorda. Liczę na ciebie... ale bez presji. Dużej.");
        }
        lines.push("Mruczek znowu spał na twoim posłaniu. Wszędzie sierść!", "Ten kot ma lepsze życie niż my obaj razem wzięci.", "Pogłaszcz Mruczka, to się odwdzięczy. Mruczeniem, bo myszy nie łowi.");
        if (h >= 8 && h < 18 && S().soupDay !== day()) lines.push("Kapuśniak w kotle, nalej sobie, póki ciepły!");
        if (h >= 18) lines.push("Wróciłeś wreszcie. Siadaj, opowiadaj, co w świecie słychać.");
        const fresh = lines.filter(l => l !== S().lastBark);
        return pick(fresh.length ? fresh : lines);
    }
    function updateArrival(g) {
        if (arriveT < 0) return;
        if (busy()) return;
        if (--arriveT > 0) return;
        arriveT = -1;
        if (!g || !introDone() || asleep(g) || G(g).seat === "bed") return;
        const s = S();
        if (clock() - s.barkAt < ARRIVE.gapHours || Math.random() > ARRIVE.chance) return;
        const line = arrivalLine();
        s.barkAt = clock();
        s.lastBark = line;
        bark(g, line, 300);
    }

    // ------------------------------------------------------------------
    // What the house shows: the props with him, the steam, the snore
    // ------------------------------------------------------------------
    const props = { rot: 0, wheel: false, churn: false, pipe: false };
    function rockAngle(amp) {
        return amp * Math.sin(frame() / ROCK.period * Math.PI * 2);
    }
    let steamWas;   // (undefined: not asked yet on this visit - the level kept in the save may be an old one)
    function updateProps(g) {
        const k = poseOf(g);
        props.rot = g && G(g).seat === "chair" ? (k === "rock" ? rockAngle(ROCK.rock) : k === "smoke" ? rockAngle(ROCK.smoke) : 0) : 0;
        props.wheel = !!g && k === "sit";
        props.churn = !!g && k === "churn";
        props.pipe = !!g && S().pipe;
        // the steam over the kettle (HomeAmbience.js): cooking - full, the soup waiting in the kettle - more, else its own gentle one
        const HA = T.api("HomeAmbience");
        if (g && HA && typeof HA.setSteam === "function") {
            const lvl = k === "stir" ? 1 : hour() >= SOUP_FROM && hour() < 22 && S().soupDay !== day() ? 0.55 : null;   // (null: its own gentle steam)
            if (lvl !== steamWas) { steamWas = lvl; try { HA.setSteam(lvl); } catch (e) { /* (theirs to mind) */ } }
        }
    }
    let snoreT = 0;
    function updateSnore(g) {
        if (!g || poseOf(g) !== "sleep" || g._locked) { snoreT = 0; return; }
        if (--snoreT > 0) return;
        snoreT = 60 * (7 + rand(6));
        const dist = Math.hypot($gamePlayer._realX - g._realX, $gamePlayer._realY - g._realY);
        if (dist <= 4.5) { se("Breath", SNORE_VOL, 52 + rand(8)); spawnZ(true); }
    }

    // ------------------------------------------------------------------
    // Map update
    // ------------------------------------------------------------------
    T.onMapUpdate(scene => {
        if (scene !== SceneManager._scene || !here() || !scene._spriteset) return;
        const g = grandpa();
        if (g) updateGrandpa(g);
        const k = cat();
        if (k) updateCat(k);
        updateProps(g);
        updateSnore(g);
        updateArrival(g);
        updateEmitters(g);
    }, { owner: PLUGIN, name: "life" });
    // a map set up (its events made anew): the house's layout looked at again; a game loaded: nothing of the last one kept
    T.on("mapEnter", e => {
        lay = null;
        fx.length = 0;
        steamWas = undefined;
        if (e.mapId === MAP) layout();
    }, { owner: PLUGIN });
    T.on("load", () => { lay = null; fx.length = 0; steamWas = undefined; arriveT = -1; }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The sprites: his poses, the cat asleep, the props moving with him
    // ------------------------------------------------------------------
    function poseLook(ch) {
        const p = ch._homePose, t = Math.max(0, frame() - (p.t || 0));
        if (ch.eventId && ch.eventId() === CAT) {
            const dy = ch._homeDy || 0;
            if (p.k === "curl") return { sheet: CAT_SLEEP, cw: CC, ch: CC, i: Math.min(8, Math.floor(t / 6)), dy };
            if (p.k === "uncurl") return { sheet: CAT_SLEEP, cw: CC, ch: CC, i: Math.max(0, 8 - Math.floor(t / 3)), dy };
            if (p.k === "sleep") return { sheet: CAT_SLEEP, cw: CC, ch: CC, i: [9, 10, 11, 10][Math.floor(t / 50) % 4], dy };
            return dy ? { dy } : null;
        }
        switch (p.k) {
            case "stir": return ch._locked ? null : { sheet: HOME, cw: GC, ch: GC, col: Math.floor(t / 9) % 8, row: 2, flip: !!p.mirror };   // (talking: he turns to you)
            case "shuffle": return { sheet: HOME, cw: GC, ch: GC, col: 0, row: 0, dy: 0 };
            case "sitdown": { const i = Math.min(4, Math.floor(t / 6)); return { sheet: HOME, cw: GC, ch: GC, col: i, row: 0, dy: Math.round(SEAT_DY * i / 4) }; }
            case "standup": { const i = Math.max(0, 4 - Math.floor(t / 6)); return { sheet: HOME, cw: GC, ch: GC, col: i, row: 0, dy: Math.round(SEAT_DY * i / 4) }; }
            case "sit": return { sheet: HOME, cw: GC, ch: GC, col: 0, row: 1, dy: SEAT_DY };
            case "rock": return { sheet: HOME, cw: GC, ch: GC, col: 0, row: 1, dy: SEAT_DY, rot: props.rot };
            case "smoke": return { sheet: HOME, cw: GC, ch: GC, col: smokeCol(t), row: 1, dy: SEAT_DY, rot: props.rot };
            case "churn": return { dy: churnLift(t) >= 4 ? 1 : 0 };
            case "fiddle": { const q = t % 300; return { dy: q > 200 && q < 212 ? 1 : 0 }; }
        }
        return null;
    }
    function smokeCol(t) {
        const q = t % SMOKE.cycle;
        return q < SMOKE.draw ? 2 : q < SMOKE.rest ? 1 : q < SMOKE.out ? 3 : 1;
    }
    // the churn's plunger: 12 frames a stroke, 5 game frames each
    const churnFrame = t => Math.floor(t / 5) % 12;
    const churnLift = t => { const k = churnFrame(t); return Math.round(3.5 - 3.5 * Math.cos(k / 12 * Math.PI * 2)); };
    function propLook(kind) {
        switch (kind) {
            case "chair": return props.rot ? { rot: props.rot } : null;
            case "wheel": return props.wheel ? { sheet: WHEEL, cw: PC, ch: PC, i: Math.floor(frame() / 4) % 12 } : null;
            case "churn": return props.churn ? { sheet: CHURN, cw: PC, ch: PC, i: churnFrame(frame()) } : null;
            case "pipe": return props.pipe ? { hide: true } : null;
        }
        return null;
    }
    function homeLook(ch) {
        if (!ch || !(ch._homePose || ch._homeKind) || !here()) return null;
        if (ch._homeKind) return propLook(ch._homeKind);
        return poseLook(ch);
    }
    const _SC_updateBitmap = Sprite_Character.prototype.updateBitmap;
    Sprite_Character.prototype.updateBitmap = function() {
        const look = homeLook(this._character);
        this._homeLook = look;
        if (look && look.sheet) {
            if (this._homeSheet !== look.sheet) { this._homeSheet = look.sheet; this.bitmap = ImageManager.loadCharacter(look.sheet); }
            this._characterName = look.sheet;
            this._tileId = 0;
            this._look8Sheet = null;   // (Hunting's 8-way look loads its sheet again afterwards)
            this._look8 = null;
            return;
        }
        if (this._homeSheet) { this._homeSheet = null; this._characterName = null; }   // (the own sheet comes back)
        _SC_updateBitmap.call(this);
    };
    const _SC_patternWidth = Sprite_Character.prototype.patternWidth;
    Sprite_Character.prototype.patternWidth = function() {
        return this._homeLook && this._homeLook.sheet ? this._homeLook.cw : _SC_patternWidth.call(this);
    };
    const _SC_patternHeight = Sprite_Character.prototype.patternHeight;
    Sprite_Character.prototype.patternHeight = function() {
        return this._homeLook && this._homeLook.sheet ? this._homeLook.ch : _SC_patternHeight.call(this);
    };
    const _SC_updateFrame = Sprite_Character.prototype.updateFrame;
    Sprite_Character.prototype.updateFrame = function() {
        const look = this._homeLook;
        if (look && look.sheet) {
            const col = look.i !== undefined ? look.i % 3 : look.col, row = look.i !== undefined ? Math.floor(look.i / 3) : look.row;
            this.setFrame(col * look.cw, row * look.ch, look.cw, look.ch);
            return;
        }
        _SC_updateFrame.call(this);
    };
    const _SC_updatePosition = Sprite_Character.prototype.updatePosition;
    Sprite_Character.prototype.updatePosition = function() {
        _SC_updatePosition.call(this);
        const look = this._homeLook;
        if (look) {
            if (look.dx) this.x += look.dx;
            if (look.dy) this.y += look.dy;
        }
        const rot = look && look.rot ? look.rot : 0;
        if (rot || this._homeRot) { this.rotation = rot; this._homeRot = !!rot; }
        const flip = !!(look && look.flip);
        if (flip || this._homeFlip) { this.scale.x = flip ? -Math.abs(this.scale.x) : Math.abs(this.scale.x); this._homeFlip = flip; }
    };
    const _SC_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _SC_update.call(this);
        if (this._homeLook && this._homeLook.hide) this.visible = false;
    };

    // ------------------------------------------------------------------
    // Grandpa asleep over the quilt, smoke, rings, "Zzz", hearts: in the tilemap (they go with the map and its zoom)
    // ------------------------------------------------------------------
    const fx = [];   // { kind, x, y (map px), vx, vy, t, life, s0, s1, spr }
    function spawn(kind, x, y, o) {
        fx.push(Object.assign({ kind, x, y, vx: 0, vy: 0, t: 0, life: 90, s0: 1, s1: 1, a0: 1, sway: 0, ph: Math.random() * 6.28, spr: null }, o || {}));
    }
    // where on the map his seated pipe and mouth are (the chair's swing turns them round his feet)
    function seatedPoint(g, off) {
        const fx0 = (g._realX + 0.5) * TW, fy0 = (g._realY + 1) * TW - g.shiftY() + SEAT_DY, a = props.rot || 0;
        return [fx0 + off[0] * Math.cos(a) - off[1] * Math.sin(a), fy0 + off[0] * Math.sin(a) + off[1] * Math.cos(a)];
    }
    function headPoint() {
        const q = layout().ev.quilt;
        return q ? [(q._realX + 0.5) * TW + HEAD[0], (q._realY + 1) * TW + HEAD[1]] : null;
    }
    let zT = 0;
    function spawnZ(big) {
        const h = headPoint();
        if (!h) return;
        spawn("z", h[0] + 12, h[1] + 4, { vx: 0.16, vy: -0.3, life: 170, s0: big ? 0.95 : 0.75, s1: big ? 1.6 : 1.35, sway: 1.6, txt: big ? "Z" : "z" });
    }
    function updateEmitters(g) {
        if (!g) return;
        const k = poseOf(g);
        if (k === "sleep" && !g._locked) {
            if (--zT <= 0) { zT = 70 + rand(30); spawnZ(false); }
        } else zT = 20;
        if (k === "smoke") {
            const t = Math.max(0, frame() - g._homePose.t), q = t % SMOKE.cycle, cyc = Math.floor(t / SMOKE.cycle);
            const bowl = () => seatedPoint(g, BOWL), mouth = () => seatedPoint(g, MOUTH);
            if (q < SMOKE.draw && q % 14 === 0) { const [x, y] = bowl(); spawn("puff", x, y, { vx: 0.05, vy: -0.34, life: 80, s0: 0.35, s1: 0.8, a0: 0.75, sway: 0.5 }); }
            if (q >= SMOKE.rest && q < SMOKE.out) {
                const rings = cyc === 0 || hash(cyc + day() * 31, 5) < 0.45, r = q - SMOKE.rest;
                if (rings && r % 22 === 4 && r < 60) { const [x, y] = mouth(); spawn("ring", x + 3, y - 4, { vx: 0.1, vy: -0.36, life: 150, s0: 0.45, s1: 1.7, a0: 0.95, sway: 0.4, fin: 18 }); }
                if (!rings && r % 9 === 0) { const [x, y] = mouth(); spawn("puff", x + 1, y, { vx: 0.22, vy: -0.3, life: 120, s0: 0.5, s1: 1.6, a0: 0.8, sway: 0.8 }); }
            }
            if (q >= SMOKE.out && q % 36 === 0) { const [x, y] = bowl(); spawn("puff", x, y, { vx: 0.03, vy: -0.28, life: 90, s0: 0.3, s1: 0.7, a0: 0.55, sway: 0.4 }); }
        }
    }
    function spawnHeart(ev) {
        const x = (ev._realX + 0.5) * TW, y = (ev._realY + 1) * TW - ev.shiftY() - 16 + (ev._homeDy || 0);   // (over its head: the paws near the frame's bottom)
        spawn("heart", x - 6, y - 2, { vy: -0.42, life: 90, s0: 0.5, s1: 1.0, sway: 0.6, pop: true });
        spawn("mrrr", x + 22, y + 4, { vx: 0.15, vy: -0.3, life: 110, s0: 0.8, s1: 1.0, sway: 0.3 });
    }

    // the pictures of the effects (made once)
    const pics = {};
    function pic(kind) {
        if (pics[kind]) return pics[kind];
        let b;
        if (kind === "puff") {   // a soft grey pixel cloud
            b = new Bitmap(12, 12);
            for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
                const d = Math.hypot(x - 5.5, y - 5.5);
                if (d <= 5.2) b.fillRect(x, y, 1, 1, d < 3 ? "rgba(236,236,240,0.85)" : d < 4.4 ? "rgba(214,215,222,0.7)" : "rgba(190,192,202,0.45)");
            }
        } else if (kind === "ring") {   // a smoke ring: an ellipse, thick at the front
            b = new Bitmap(18, 12);
            for (let y = 0; y < 12; y++) for (let x = 0; x < 18; x++) {
                const e = Math.hypot((x - 8.5) / 8, (y - 5.5) / 5);
                if (e > 0.62 && e <= 1.0) b.fillRect(x, y, 1, 1, y > 6 ? "rgba(236,237,242,0.9)" : "rgba(214,216,224,0.72)");
            }
        } else if (kind === "z" || kind === "Z") {   // like the dog's "Zzzz" (Dog.js)
            b = new Bitmap(30, 30);
            b.fontSize = kind === "Z" ? 20 : 16;
            b.outlineWidth = 3;
            b.textColor = "#eceef0";
            b.drawText(kind, 0, 2, 30, 26, "center");
        } else if (kind === "heart") {   // the dog's heart, small
            b = new Bitmap(24, 22);
            const ctx = b.context, cx = 12, cy = 10;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx, cy + 7);
            ctx.bezierCurveTo(cx - 10, cy - 1, cx - 6, cy - 9, cx, cy - 4);
            ctx.bezierCurveTo(cx + 6, cy - 9, cx + 10, cy - 1, cx, cy + 7);
            ctx.closePath();
            ctx.fillStyle = "#e0413b"; ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = "#16181c"; ctx.stroke();
            ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillRect(cx - 5, cy - 4, 3, 3);
            ctx.restore();
            if (b._baseTexture) b._baseTexture.update();
        } else if (kind === "mrrr") {
            b = new Bitmap(70, 26);
            b.fontSize = 15;
            b.outlineWidth = 3;
            b.textColor = "#ffe0ea";
            b.drawText("mrrr...", 0, 2, 70, 22, "center");
        }
        pics[kind] = b;
        return b;
    }
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this._homeSleeper = new Sprite();
        this._homeSleeper.anchor.set(0.5, 1);
        this._homeSleeper.z = 5;   // (over the bed's headboard: his head lies in front of it)
        this._homeSleeper.visible = false;
        this._tilemap.addChild(this._homeSleeper);
        this._homeFx = new Sprite();
        this._homeFx.z = 8;
        this._tilemap.addChild(this._homeFx);
        for (const f of fx) f.spr = null;   // (a new spriteset after a menu: the effects get new sprites)
    };
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        if (this._homeFx) updateHomeSprites(this);
    };
    function updateHomeSprites(set) {
        const onMap = here();
        // grandpa in bed: over the quilt, in its place (its sprite is the one to follow: the same spot, the same zoom)
        const sl = set._homeSleeper, g = onMap ? grandpa() : null, k = poseOf(g);
        const q = onMap ? layout().ev.quilt : null;
        const qs = q && (k === "sleep" || k === "liedown" || k === "getup") ? set._characterSprites.find(s => s._character === q) : null;
        if (qs) {
            if (!sl.bitmap || sl._src !== SLEEPER) { sl.bitmap = ImageManager.loadCharacter(SLEEPER); sl._src = SLEEPER; }
            const t = Math.max(0, frame() - g._homePose.t);
            const awake = g._locked || k !== "sleep";
            sl.setFrame((awake ? 2 : Math.floor(frame() / 80) % 2) * QC, 0, QC, QC);
            sl.x = qs.x;
            sl.y = qs.y;
            sl.opacity = k === "liedown" ? Math.min(255, Math.round(255 * t / 40)) : k === "getup" ? Math.max(0, 255 - Math.round(255 * t / 40)) : 255;
            sl.visible = qs.visible;
        } else sl.visible = false;
        // the effects
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (let i = fx.length - 1; i >= 0; i--) {
            const f = fx[i];
            f.t++;
            if (f.t >= f.life || !onMap) {
                if (f.spr && f.spr.parent) f.spr.parent.removeChild(f.spr);
                fx.splice(i, 1);
                continue;
            }
            if (!f.spr) {
                f.spr = new Sprite(pic(f.kind === "z" && f.txt === "Z" ? "Z" : f.kind));
                f.spr.anchor.set(0.5, 0.5);
                set._homeFx.addChild(f.spr);
            }
            const u = f.t / f.life;
            f.x += f.vx + Math.sin(f.t / 18 + f.ph) * f.sway * 0.06;
            f.y += f.vy * (f.kind === "ring" ? 1 - u * 0.45 : 1);
            const sc = f.pop && f.t < 12 ? f.s0 + (f.s1 * 1.25 - f.s0) * (f.t / 12) : f.s0 + (f.s1 - f.s0) * Math.min(1, u * 1.15);
            f.spr.scale.set(sc, sc);
            f.spr.x = Math.round($gameMap.adjustX(f.x / tw) * tw);
            f.spr.y = Math.round($gameMap.adjustY(f.y / th) * th);
            const fadeIn = Math.min(1, f.t / (f.fin || 10)), fadeOut = Math.min(1, (f.life - f.t) / (f.life * 0.45));
            f.spr.opacity = Math.round(255 * f.a0 * fadeIn * fadeOut);
        }
    }

    // ------------------------------------------------------------------
    // For other plugins, the debug menu and the tests
    // ------------------------------------------------------------------
    window.HomeLife = T.register(PLUGIN, {
        MAP, GRANDPA, CAT, SOUP, BED_AT, ROCK, SMOKE, SEAT_DY, ARRIVE,
        state: S, layout, activityAt: (h, d) => activityAt(h === undefined ? hour() : h, d === undefined ? day() : d), targetOf,
        cauldron, pet: () => pet(), findPath,
        // straight to what they do now (as on coming in)
        snap() { const g = grandpa(), k = cat(); if (g) { G(g).snap = true; updateGrandpa(g); } if (k) { K(k).snap = true; updateCat(k); } return true; },
        grandpaState() {
            const g = grandpa();
            if (!g) return null;
            const c = G(g);
            return { x: g.x, y: g.y, key: c.key, pose: poseOf(g), seat: c.seat, steps: c.steps.map(s => s.t), cur: c.cur ? c.cur.t : null, pipe: S().pipe, opacity: g.opacity(), through: g.isThrough(), moving: g.isMoving() };
        },
        catState() {
            const k = cat();
            if (!k) return null;
            const c = K(k);
            return { x: k.x, y: k.y, spot: c.spot, pose: poseOf(k), cur: c.cur ? c.cur.t : null, steps: c.steps.map(s => s.t), purr: c.purr, moving: k.isMoving() || k.isJumping() };
        },
        catGo(spot) { const k = cat(); if (!k || !layout().cat[spot] && spot !== "stroll" && spot !== "feet") return false; catPlan(k, K(k), spot); return true; },
        get fx() { return fx.map(f => ({ kind: f.kind, x: Math.round(f.x), y: Math.round(f.y), t: f.t })); },
        get props() { return Object.assign({}, props); },
        rockAngle
    });
})();
