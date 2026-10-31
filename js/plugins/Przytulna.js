//=============================================================================
// Przytulna.js
//=============================================================================
// (2026-10-30, próba „Przytulna sala”: główna sala tawerny, Map001, w klimacie makiety ekranu tytułowego tytul_17_sala_tawerny_noca.)
// Cała próba ma JEDEN przełącznik (Opcje „Przytulna sala (próba)”, parametr „enabled”, w testach window.PRZYTULNA = true / false).
// Wyłączona nie zmienia nic: ani światła, ani nastroju, ani życia sali. Włączona (tylko Map001, tylko sala, bar i scena):
//   1. ŚWIATŁO JAK OD OGNIA: noc ciemniejsza (<DarkNight> mapy +), kominki skupione i mocniejsze, żyrandole słabsze, miękkie
//      „wypełnienie” kątów zdjęte - jasno przy ogniu, latarniach i świecach, w kątach półmrok. Dane mapy zmieniane w pamięci przy
//      wczytaniu (plik Map001.json bez zmian).
//   2. NASTRÓJ: ciepły ton, mocniejsza winieta (Mood.addTweak, tylko ta mapa).
//   3. IGŁY OGNIA: iskry z kominków i migotliwy ciepły blask na podłodze przed nimi (kilkanaście małych sprite'ów w jednej warstwie).
//   4. ŻYCIE: goście co jakiś czas unoszą kufel (mały sprite przy siedzącym), grajek na podeście wieczorem gra na lutni
//      (zdarzenie bez obrazu w mapie; rysowane z img/characters/Przytulna_Grajek_Lutnia.png), karczmarz Borgar od czasu do czasu
//      wyciera ladę (Przytulna_Borgar_Wyciera.png). Klatki 84x84 z PixelLab (stopa w wierszu 74, środek w kolumnie 42).
// Nic nie trafia do zapisu gry (stan tylko w pamięci strony).

/*:
 * @target MZ
 * @plugindesc Próba „Przytulna sala”: sala tawerny jak z makiety - światło od ognia, iskry, kufle gości, grajek z lutnią i Borgar przy ladzie. Domyślnie wyłączona. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter RoomLighting
 * @orderAfter Mood
 * @orderAfter TavernLife
 *
 * @param enabled
 * @text Włączona
 * @type boolean
 * @default false
 * @desc Domyślnie wyłączona, dopóki próba nie zostanie zatwierdzona (install.py tavern/przytulna ustawia na true). Opcje gry mogą to zmienić.
 *
 * @help
 * Przytulna.js - próba „Przytulna sala”. Przełącznik: Opcje -> „Przytulna sala (próba)”, albo Przytulna.set(true/false).
 * Działa tylko na Map001 (sala, bar, scena). Zdarzenia ozdób (świece, latarnie, półki, grajek) stoją w mapie po instalacji
 * (tools/tavern/przytulna/install.py); ta wtyczka dodaje światło, nastrój i życie.
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Przytulna.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const PLUGIN = "Przytulna";
    const params = PluginManager.parameters(PLUGIN);
    const DEF = String(params.enabled === undefined || params.enabled === "" ? "false" : params.enabled) === "true";
    const MAP = 1;
    const HALL = { x0: 37, y0: 27, x1: 83, y1: 44 };   // sala, bar i scena (kratki)
    const DARK_PLUS = 22;                                // o tyle ciemniejsza noc (0-255)
    const BARD_ID = 360, BARD_X = 70, BARD_Y = 29;       // zdarzenie grajka na scenie (Przytulna: nowe id w mapie)
    const BARD_FROM = 18, BARD_TO = 23.5;                // godziny gry grajka
    const SHEET = { grajek: "Przytulna_Grajek_Lutnia", borgar: "Przytulna_Borgar_Wyciera" };
    // goście siedzą na stołkach przy stołach: klatki z img/characters/Przytulna_Siedzi_<Klucz>.png (komórki 88x88; wiersz 0 zwrot na wschód,
    // wiersz 1 na zachód; kolumna 0 siedzi, 1-8 pije z kufla; tools/tavern/przytulna/siedzi.py). Klucz = nazwa arkusza bez "$Npc_".
    const SEATED_KEYS = ["Kowal", "Woziwoda", "Kupiec", "Soltys", "Garbarz", "Bartek", "Woznica", "Janek", "Rozbitek", "Pula_K", "Pula_M", "Pula_S", "Pula_Z", "Pula_K2", "Pula_K3", "Pula_M2", "Pula_M3", "Pula_S2", "Pula_Z2"];   // (uzupełnia siedzi.py --lista; patrz niżej)
    const SCELL = 88, SFEET = 76, TABLE_TILES = [416, 424, 432, 439, 447], TABLE_TILES2 = [842, 850, 859, 867, 863, 871, 844, 852];   // stoły: długie i małe (warstwa 3), okrągłe ze sceny (warstwa 2)
    const CELL = 84, FEET_Y = 74;                        // klatka PixelLab: 84x84, stopa w wierszu 74

    // ------------------------------------------------------------------
    // Przełącznik (plik konfiguracji, nie zapis gry; window.PRZYTULNA nadpisuje - testy i zdjęcia)
    // ------------------------------------------------------------------
    const KEY = "przytulnaOn";
    if (ConfigManager[KEY] === undefined) ConfigManager[KEY] = DEF;
    const _makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() { const c = _makeData.call(this); c[KEY] = this[KEY] === undefined ? DEF : this[KEY]; return c; };
    const _applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) { _applyData.call(this, config); const v = config ? config[KEY] : undefined; this[KEY] = v === undefined ? DEF : !!v; };
    function on() {
        if (window.PRZYTULNA !== undefined) return !!window.PRZYTULNA;
        return ConfigManager[KEY] === undefined ? DEF : !!ConfigManager[KEY];
    }
    const skip = k => !!(window.PRZYTULNA_BEZ && window.PRZYTULNA_BEZ.includes(k));   // (tylko diagnoza: window.PRZYTULNA_BEZ = ["nastroj", "blask", "swiatlo"])
    const here = () => !!(window.$gameMap && $gameMap.mapId() === MAP);
    const active = () => on() && here();
    const inHall = (x, y) => x >= HALL.x0 && x <= HALL.x1 && y >= HALL.y0 && y <= HALL.y1;
    const _addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        _addGeneralOptions.call(this);
        this._list.push({ name: "Przytulna sala (próba)", symbol: KEY, enabled: true, ext: null });
    };
    const _statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        return this.commandSymbol(index) === KEY ? (this.getConfigValue(KEY) ? "Wł" : "Wył") : _statusText.call(this, index);
    };

    // ------------------------------------------------------------------
    // 1. Światło: dane mapy w pamięci (plik bez zmian). $dataMap jest wczytywany od nowa przy każdym wejściu na mapę.
    // ------------------------------------------------------------------
    function patchData() {
        if (!window.$dataMap || $dataMap._przyt || skip("swiatlo")) return;
        $dataMap._przyt = true;
        $dataMap.note = String($dataMap.note || "").replace(/<DarkNight:(\d+)>/i, (m, n) => "<DarkNight:" + Math.min(250, Number(n) + DARK_PLUS) + ">");
        for (const e of $dataMap.events) {
            if (!e || !inHall(e.x, e.y) || !e.note) continue;
            const name = String(e.name || "");
            if (/^wypelnienie/i.test(name)) e.note = e.note.replace(/<Light:(\d+),(\d+),(\d+),(\d+)>/i, (m, r, a, b, c) => "<Light:" + Math.round(r * 1.3) + "," + Math.round(a * 3.2) + "," + Math.round(b * 3.2) + "," + Math.round(c * 3.2) + ">");   // miękkie wypełnienie mocniejsze: bez ciemnych plam między kręgami świateł
            else if (/^Kominek/i.test(name)) e.note = e.note.replace(/<Light:(\d+),(\d+),(\d+),(\d+)>/i, "<Light:330,185,98,30>");
            else if (/randol/i.test(name)) e.note = e.note.replace(/<Light:(\d+),(\d+),(\d+),(\d+)>/i, (m, r, a, b, c) => "<Light:" + Math.round(r * 0.68) + "," + a + "," + b + "," + c + ">");
            else if (e.x >= 65 && /^(Świeca|Latarnia)/i.test(name) && !/na stole/i.test(name)) e.note = e.note.replace(/<Light:(\d+),(\d+),(\d+),(\d+)>/i, (m, r, a, b, c) => "<Light:" + Math.round(r * 1.5) + "," + Math.round(a * 0.78) + "," + Math.round(b * 0.78) + "," + Math.round(c * 0.78) + ">");   // miękkie, szersze koła (bez twardych krawędzi)
        }
    }
    // ($dataMap bywa wczytany od nowa bez Game_Map.setup - przejście w obrębie tej samej mapy: łatamy też po wczytaniu sceny)
    const _onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        if (window.$dataMap && $gamePlayer && ($gamePlayer.isTransferring() ? $gamePlayer.newMapId() : $gameMap.mapId()) === MAP && on()) patchData();
        _onMapLoaded.call(this);
    };
    // CIENIE LUDZI i rzeczy w świetle ognia (Sky.js: Sun.occluders; liczą je RoomLighting i Farming_Render): w tłoku sali każdy gość
    // rzuca od każdej lampy długi ukośny cień - nocą to brzydkie czarne smugi. W sali (przy włączonej próbie) zostaje gładki półmrok:
    // światło nie liczy zasłon (przy okazji oszczędza czas). Poza salą i przy wyłączonej próbie nic się nie zmienia.
    const NONE = [];
    function hookShadows() {
        const Sun = T.api("Sun");
        if (!Sun || !Sun.occluders || Sun._przytWrapped) return;
        const orig = Sun.occluders;
        Sun.occluders = function() { return active() && !skip("cienie") ? NONE : orig.apply(this, arguments); };
        Sun._przytWrapped = true;
    }
    hookShadows();
    const _setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _setup.call(this, mapId);
        if (mapId === MAP && on()) patchData();
    };

    // ------------------------------------------------------------------
    // 2. Nastrój: ciepły ton i winieta, tylko Map001
    // ------------------------------------------------------------------
    function moodTweak(P, kind, dark) {
        if (kind !== "interior" || !active() || skip("nastroj")) return;
        const k = 0.35 + 0.65 * dark;
        P.high = [P.high[0] * (1 + 0.03 * k), P.high[1], P.high[2] * (1 - 0.04 * k)];
        P.shadow = [P.shadow[0] * (1 + 0.03 * k), P.shadow[1] * (1 - 0.01 * k), P.shadow[2] * (1 - 0.03 * k)];
        P.vig += 0.22 * k; P.vigIn = Math.max(0.28, P.vigIn - 0.08 * k);
        P.bloom *= 1 + 0.15 * k;
    }
    function hookMood() { const M = T.api("Mood"); if (M && M.addTweak) M.addTweak(PLUGIN, moodTweak); }
    hookMood();
    T.on("tekstyWczytane", hookMood, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // 3-4. Warstwa: iskry, blask na podłodze, kufle, grajek, Borgar
    // ------------------------------------------------------------------
    const rnd = (a, b) => a + Math.random() * (b - a);
    function dotBitmap(size, soft) {
        const b = new Bitmap(size, size), c = b.context, h = size / 2;
        const g = c.createRadialGradient(h, h, 0, h, h, h);
        g.addColorStop(0, "rgba(255,230,160,1)"); g.addColorStop(soft ? 0.35 : 0.6, "rgba(255,150,50," + (soft ? 0.5 : 0.9) + ")"); g.addColorStop(1, "rgba(255,90,20,0)");
        c.fillStyle = g; c.fillRect(0, 0, size, size); b._baseTexture.update && b._baseTexture.update();
        return b;
    }
    function mugBitmap() {
        const b = new Bitmap(16, 18), c = b.context;
        const px = (col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
        px("#2b1a10", 2, 3, 9, 13); px("#2b1a10", 11, 5, 4, 8); px("#2b1a10", 12, 7, 3, 4);   // obrys: korpus i ucho
        px("#b9772f", 3, 5, 7, 10); px("#8c5521", 3, 11, 7, 2); px("#d9a050", 3, 5, 2, 8);        // drewno, obręcz, światło
        px("#6b3f17", 12, 6, 2, 6); px("#c98a3a", 12, 7, 1, 4);                                    // ucho
        px("#f6eed8", 2, 1, 9, 3); px("#fffaf0", 3, 0, 4, 2); px("#e4d6b0", 8, 3, 3, 1);           // piana
        b._baseTexture.update && b._baseTexture.update();
        return b;
    }
    const ST = { sparks: [], mugs: [], glow: new Map(), t: 0, nextMug: 4, nextWipe: 6, wipe: null, bard: null, layer: null, bmp: null };

    class Layer extends Sprite {
        constructor(spriteset) {
            super();
            this.spriteset = spriteset; this.z = 5;
            this.bmps = { spark: dotBitmap(8, false), glow: dotBitmap(128, true), mug: mugBitmap() };
            this.parts = [];
            this.glow = new Map(); this._cs = new Map(); this._seatMemo = new Map(); this._seatCand = null;
            this.anims = new Map();   // zdarzenie -> { sprite, bitmap, ... }
            ST.mugs.length = 0; ST.wipe = null;
        }
        fires() {   // kominki sali: lista raz na warstwę (nie przeglądamy wszystkich zdarzeń co klatkę)
            if (!this._fires) {
                this._fires = [];
                for (const ev of $gameMap.events()) {
                    const d = ev.event();
                    if (d && /^Kominek/i.test(d.name || "") && inHall(d.x, d.y)) this._fires.push(ev);
                }
            }
            return this._fires;
        }
        origin(ev) { return { x: ev.screenX(), y: ev.screenY() }; }
        onScreen(x, y, m = 60) { return x > -m && x < Graphics.width + m && y > -m && y < Graphics.height + m; }
        // --- iskry i blask
        updateFires(dt) {
            for (const ev of this.fires()) {
                const o = this.origin(ev);
                if (!this.onScreen(o.x, o.y, 140)) continue;
                let g = this.glow.get(ev);
                if (!g && !skip("blask")) {
                    g = new Sprite(this.bmps.glow); g.anchor.set(0.5, 0.5); g.blendMode = 1; g.z = 1.5; g._ph = Math.random() * 9;
                    this.parent.addChild(g); this.glow.set(ev, g);
                }
                if (!g) continue;
                const f = 0.5 + 0.5 * Math.sin(ST.t * 7 + g._ph) * Math.sin(ST.t * 3.1 + g._ph * 2);
                g.x = o.x; g.y = o.y + 62; g.scale.set(2.7 + 0.15 * f, 1.7 + 0.1 * f); g.opacity = 70 + 50 * f;
                if (Math.random() < dt * 7 && this.parts.length < 34) {
                    const s = new Sprite(this.bmps.spark); s.anchor.set(0.5, 0.5); s.blendMode = 1;
                    s._dx = rnd(-14, 14); s._dy = -8; s._vx = rnd(-10, 10); s._vy = rnd(-34, -70); s._life = 0; s._max = rnd(0.7, 1.5); s._ev = ev;
                    this.addChild(s); this.parts.push(s);
                }
            }
        }
        updateParts(dt) {
            for (let i = this.parts.length - 1; i >= 0; i--) {
                const s = this.parts[i]; s._life += dt;
                if (s._life >= s._max) { this.removeChild(s); this.parts.splice(i, 1); continue; }
                const o = this.origin(s._ev), k = s._life / s._max;
                s._vx += rnd(-30, 30) * dt; s._dx += s._vx * dt; s._dy += s._vy * dt;
                s.x = o.x + s._dx; s.y = o.y + s._dy;
                s.scale.set(0.5 + 0.5 * (1 - k)); s.opacity = 255 * (1 - k) * (k < 0.1 ? k * 10 : 1);
            }
        }
        // --- kufle
        pickGuest() {
            const list = [];
            for (const ev of $gameMap.events()) {
                const d = ev.event(), name = ev.characterName();
                if (!d || !name || name[0] === "!" || d.id <= 8 || d.id === BARD_ID || (name.indexOf("$Npc_") === 0 && SEATED_KEYS.includes(name.slice(5)))) continue;
                if (!inHall(ev.x, ev.y) || ev.isMoving() || ev._erased || ev._opacity < 255 || ev.isThrough()) continue;
                const o = this.origin(ev); if (!this.onScreen(o.x, o.y, -10)) continue;
                list.push(ev);
            }
            return list.length ? list[Math.floor(Math.random() * list.length)] : null;
        }
        raiseMug() {
            const ev = this.pickGuest(); if (!ev) return;
            const s = new Sprite(this.bmps.mug); s.anchor.set(0.5, 1); s._ev = ev; s._t = 0; s._d = 2.1; s._side = Math.random() < 0.5 ? -1 : 1;
            this.addChild(s); ST.mugs.push(s);
        }
        updateMugs(dt) {
            for (let i = ST.mugs.length - 1; i >= 0; i--) {
                const s = ST.mugs[i]; s._t += dt;
                const ev = s._ev;
                if (s._t >= s._d || ev.isMoving() || ev._erased) { this.removeChild(s); ST.mugs.splice(i, 1); continue; }
                const k = s._t / s._d, up = k < 0.2 ? k / 0.2 : k > 0.8 ? (1 - k) / 0.2 : 1, e = up * up * (3 - 2 * up);
                const o = this.origin(ev);
                s.x = o.x + s._side * (13 - 7 * e); s.y = o.y - (20 + 22 * e);
                s.rotation = s._side * (-0.9 * e) + (k > 0.3 && k < 0.7 ? Math.sin(k * 40) * 0.05 : 0);
                s.opacity = 255;
            }
        }
        // --- animacje postaci (grajek, Borgar): cudza klatka w miejscu zwykłego sprite'a zdarzenia
        charSprite(ev) {   // sprite zdarzenia: szukany raz i zapamiętany
            let sp = this._cs.get(ev);
            if (!sp) {
                for (const c of this.spriteset._characterSprites || []) if (c._character === ev) { sp = c; this._cs.set(ev, c); break; }
            }
            return sp || null;
        }
        playAnim(key, ev, frame) {
            let a = this.anims.get(key);
            if (!a) {
                const bmp = ImageManager.loadBitmap("img/characters/", SHEET[key]);
                const sp = new Sprite(bmp); sp.anchor.set(0.5, FEET_Y / CELL); sp.visible = false;
                this.parent.addChild(sp); sp.z = 3;
                a = { sp, bmp }; this.anims.set(key, a);
            }
            const cs = this.charSprite(ev);
            if (!a.bmp.isReady() || !cs) return false;
            a.sp.setFrame(frame * CELL, 0, CELL, CELL);
            a.sp.x = cs.x; a.sp.y = cs.y; a.sp.z = cs.z || 3; a.sp.visible = true;
            a.sp.opacity = 255;
            cs._przytHide = true; cs._wyKeep = true; cs.opacity = 0;   // (zwykły sprite zdarzenia ukryty, gdy gra własna klatka)
            return true;
        }
        stopAnim(key, ev) {
            const a = this.anims.get(key); if (a) a.sp.visible = false;
            const cs = ev && this.charSprite(ev); if (cs && cs._przytHide) { cs._przytHide = false; cs._wyKeep = false; cs.opacity = 255; }
        }
        updateBard(dt) {
            const ev = $gameMap.event(BARD_ID); if (!ev) return;
            const h = $gameSystem.dayNightHour ? $gameSystem.dayNightHour() : T.time.hour();
            if (h >= BARD_FROM && h < BARD_TO && !$gameMap.event(3023)) {
                const n = 8, f = Math.floor(ST.t * 7) % n;
                this.playAnim("grajek", ev, f + 1);
            } else this.stopAnim("grajek", ev);
        }
        updateBorgar(dt) {
            const ev = $gameMap.event(1); if (!ev) return;
            if (!ST.wipe && ST.t >= ST.nextWipe && !$gameMessage.isBusy() && !ev.isMoving()) ST.wipe = { t0: ST.t, d: rnd(7, 11) };
            if (ST.wipe) {
                const k = ST.t - ST.wipe.t0;
                if (k > ST.wipe.d || $gameMessage.isBusy()) { ST.wipe = null; ST.nextWipe = ST.t + rnd(12, 24); this.stopAnim("borgar", ev); return; }
                // klatki 0-1 spokojnie, 2-8 przecieranie tam i z powrotem
                const cyc = Math.floor(k * 6) % 12, f = cyc < 7 ? 2 + cyc : 2 + (12 - cyc);
                this.playAnim("borgar", ev, k < 0.3 ? 1 : Math.min(8, f));
            } else this.stopAnim("borgar", ev);
        }
        // --- siedzący goście: stołek obok stołu (kafel stołu po lewej / prawej), własne klatki zamiast zwykłego sprite'a
        seatSide(x, y) {
            const k = x + y * 4096; let v = this._seatMemo.get(k);
            if (v !== undefined) return v;
            const W = $dataMap.width, H = $dataMap.height, d = $dataMap.data;
            const tbl = xx => TABLE_TILES.includes(d[(3 * H + y) * W + xx]) || TABLE_TILES2.includes(d[(2 * H + y) * W + xx]);
            v = tbl(x + 1) ? 6 : tbl(x - 1) ? 4 : 0;
            this._seatMemo.set(k, v); return v;
        }
        seatCandidates() {
            if (!this._seatCand) {
                this._seatCand = [];
                for (const ev of $gameMap.events()) {
                    const d = ev.event(); if (!d) continue;
                    const m = /<Siedzi:(\w+)>/i.exec(d.note || "");
                    const nm = ev.characterName();
                    const key = m ? m[1] : (nm && nm.indexOf("$Npc_") === 0 ? nm.slice(5) : null);
                    if (key && SEATED_KEYS.includes(key)) this._seatCand.push({ ev, key, fig: !!m, sp: null, bmp: null, next: ST.t + rnd(2, 9), t0: -1, side: 0 });
                }
            }
            return this._seatCand;
        }
        updateSeated(dt) {
            const hour = $gameSystem.dayNightHour ? $gameSystem.dayNightHour() : T.time.hour();
            const evening = hour >= 17 || hour < 1;
            for (const c of this.seatCandidates()) {
                const ev = c.ev, cs = this.charSprite(ev);
                let ok = !!cs && !ev.isMoving() && !ev._erased && (!c.fig || evening) && inHall(ev.x, ev.y);
                const side = ok ? this.seatSide(ev.x, ev.y) : 0;
                ok = ok && side && (c.fig || ev.characterName() === "$Npc_" + c.key);
                if (!ok) { if (c.sp && c.sp.visible) { c.sp.visible = false; if (cs && cs._przytHide) { cs._przytHide = false; cs._wyKeep = false; cs.opacity = 255; } } continue; }
                const ox = ev.screenX(), oy = ev.screenY();
                if (!this.onScreen(ox, oy, 80)) { if (c.sp) c.sp.renderable = false; if (cs) { cs._przytHide = true; cs.opacity = 0; } continue; }
                if (!c.sp) {
                    c.bmp = ImageManager.loadBitmap("img/characters/", "Przytulna_Siedzi_" + c.key);
                    c.sp = new Sprite(c.bmp); c.sp.anchor.set(0.5, SFEET / SCELL); c.sp.visible = false;
                    this.parent.addChild(c.sp);
                }
                if (!c.bmp.isReady()) { if (cs) { cs._przytHide = false; } continue; }
                const frames = Math.max(1, Math.floor(c.bmp.width / SCELL));
                if (ST.t >= c.next && frames > 1 && c.t0 < 0) { c.t0 = ST.t; }
                let f = 0;
                if (c.t0 >= 0) { f = 1 + Math.floor((ST.t - c.t0) * 8); if (f > frames - 1) { c.t0 = -1; c.next = ST.t + rnd(4, 11); f = 0; } }
                c.sp.setFrame(f * SCELL, (side === 6 ? 0 : 1) * SCELL, SCELL, SCELL);
                c.sp.x = ox; c.sp.y = oy; c.sp.z = ev.screenZ ? ev.screenZ() : 3; c.sp.visible = true; c.sp.renderable = true; c.sp.opacity = 255;
                if (cs) { cs._przytHide = true; cs._wyKeep = true; cs.opacity = 0; }
            }
        }
        update() {
            super.update();
            const dt = 1 / 60;
            ST.t += dt;
            if (!on()) { this.reset(); return; }
            this.updateFires(dt); this.updateParts(dt);
            if (ST.t >= ST.nextMug) { ST.nextMug = ST.t + rnd(1.2, 3.2); if (ST.mugs.length < 3) this.raiseMug(); }
            this.updateMugs(dt); this.updateBard(dt); this.updateBorgar(dt); this.updateSeated(dt);
        }
        reset() {
            for (const s of this.parts) this.removeChild(s); this.parts.length = 0;
            for (const s of ST.mugs) this.removeChild(s); ST.mugs.length = 0;
            for (const g of this.glow.values()) this.parent.removeChild(g); this.glow.clear();
            for (const [k, a] of this.anims) { a.sp.visible = false; }
            if (this._seatCand) for (const c of this._seatCand) if (c.sp) c.sp.visible = false;
            for (const sp of this.spriteset._characterSprites || []) if (sp._przytHide) { sp._przytHide = false; sp._wyKeep = false; sp.opacity = 255; }
        }
    }

    // iskry trzymają stałą pozycję względem kominka: przeliczamy przy tworzeniu, więc zapamiętujemy położenie początkowe zdarzenia
    const _createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _createCharacters.call(this);
        hookShadows();
        if (here()) {
            this._przytLayer = new Layer(this);
            this._tilemap.addChild(this._przytLayer);
            ST.layer = this._przytLayer;
        }
    };
    const api = {
        on, set(v) { ConfigManager[KEY] = !!v; return on(); }, here, active, HALL, ST,
        reload() { if (!window.$gamePlayer || !here()) return false; $gamePlayer.reserveTransfer(MAP, $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), 2); return true; },
        mugNow() { return ST.layer ? (ST.layer.raiseMug(), ST.mugs.length) : -1; },
        stats() { return { sparks: ST.layer ? ST.layer.parts.length : 0, mugs: ST.mugs.length, glow: ST.layer ? ST.layer.glow.size : 0, wipe: !!ST.wipe, seated: ST.layer && ST.layer._seatCand ? ST.layer._seatCand.filter(c => c.sp && c.sp.visible).length : 0, drinking: ST.layer && ST.layer._seatCand ? ST.layer._seatCand.filter(c => c.t0 >= 0).length : 0 }; }
    };
    window.Przytulna = T.register(PLUGIN, api);
})();
