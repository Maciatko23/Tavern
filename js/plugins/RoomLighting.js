//=============================================================================
// RoomLighting.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Przyciemnia pokój i dodaje ciepłą poświatę światła (np. z okna). v1.0.0
 * @author Claude
 *
 * @param darkness
 * @text Siła przyciemnienia (0-255)
 * @type number
 * @min 0
 * @max 255
 * @default 120
 *
 * @param darkColor
 * @text Kolor przyciemnienia (R,G,B)
 * @type string
 * @default 20,20,35
 *
 * @param lightRadius
 * @text Domyślny promień światła (px)
 * @type number
 * @default 150
 *
 * @param lightColor
 * @text Domyślny kolor światła (R,G,B)
 * @type string
 * @default 255,244,214
 *
 * @param defaultEnabled
 * @text Domyślnie włączone
 * @type boolean
 * @default false
 *
 * @param torchSwitch
 * @text Przełącznik "pochodnia zapalona"
 * @type switch
 * @default 0
 * @desc Gdy ten przełącznik jest ON, wokół gracza świeci pochodnia. 0 = funkcja wyłączona.
 *
 * @param torchRadius
 * @text Promień światła pochodni (px)
 * @type number
 * @default 140
 *
 * @param torchColor
 * @text Kolor pochodni (R,G,B)
 * @type string
 * @default 255,170,80
 *
 * @param torchFlicker
 * @text Migotanie pochodni
 * @type boolean
 * @default true
 *
 * @param torchExpireCommonEvent
 * @text Wspólne zdarzenie po zgaśnięciu
 * @type common_event
 * @default 0
 * @desc Uruchamiane, gdy wbudowany licznik czasu dojdzie do zera podczas gdy pochodnia płonie. 0 = brak.
 *
 * @param torchIconIndex
 * @text Ikona pochodni (indeks w IconSet)
 * @type number
 * @default 80
 *
 * @help
 * ============================================================================
 * RoomLighting.js
 * ============================================================================
 * Przyciemnia całą mapę i dodaje ciepłą poświatę światła w wyznaczonych
 * miejscach (np. przy oknie).
 *
 * Każde światło (poświata, smuga i pochodnia gracza) faktycznie WYCINA dziurę
 * w przyciemnieniu - w jego zasięgu widać prawdziwy, w pełni jasny pokój, a
 * nie tylko przyciemnioną scenę z dodanym ciepłym odcieniem. Kolorowa
 * poświata jest rysowana dodatkowo na wierzchu tej "dziury" dla klimatu.
 *
 * WŁĄCZANIE NA MAPIE:
 *   W notatce mapy (Map Properties > Note) wpisz jeden z tagów:
 *     <Dark:on>   - wymusza przyciemnienie na tej mapie
 *     <Dark:off>  - wymusza brak przyciemnienia
 *   Bez tagu używane jest ustawienie "Domyślnie włączone" z parametrów.
 *
 * DODAWANIE ŹRÓDŁA ŚWIATŁA (np. okna):
 *   Postaw na mapie zwykły event w miejscu, skąd ma "świecić" (np. na kafelku
 *   okna). Grafika i wyzwalacz eventu nie mają znaczenia - plugin tylko
 *   odczytuje jego pozycję. W polu "Note" tego eventu (NIE w komendzie
 *   "Skrypt", tylko we właściwości Note samego eventu) wpisz jeden z wariantów:
 *
 *   Okrągła poświata (światło we wszystkich kierunkach):
 *     <Light>                     - domyślny promień i kolor
 *     <Light:200>                 - promień 200px, domyślny kolor
 *     <Light:200,255,220,180>     - promień 200px, kolor R255 G220 B180
 *
 *   Stożek/smuga światła (np. promień słońca z okna) - zapis klucz=wartość,
 *   dowolna kolejność, wszystkie klucze opcjonalne:
 *     <LightCone:length=96,angle=60,dir=90,width=48,anchor=top,r=255,g=220,b=180>
 *   gdzie:
 *     length  - zasięg smugi w pikselach (1 kratka = 48px), domyślnie 150
 *     angle   - szerokość kąta rozszerzania się smugi w stopniach, domyślnie 60
 *     dir     - kierunek w stopniach: 0=w prawo, 90=w dół, 180=w lewo, 270=w górę
 *               (domyślnie 90, czyli w dół)
 *     width   - szerokość smugi w miejscu startu w pikselach (0 = zaczyna się
 *               w jednym punkcie jak stożek; np. 48 = zaczyna się na całej
 *               szerokości kratki), domyślnie 0
 *     anchor  - z której krawędzi kratki eventu wychodzi światło:
 *               center (środek, domyślnie), top, bottom, left, right
 *     blur    - rozmycie krawędzi w pikselach (0 = ostre krawędzie). Trzymaj to
 *               niewielkie (kilka px) - zbyt duże rozmycie względem szerokości
 *               smugi zamienia ją w bezkształtną plamę zamiast wiązki. Domyślnie 6.
 *     dust    - liczba maleńkich drobinek kurzu unoszących się w samej smudze
 *               światła (0 = brak), domyślnie 0
 *     dustsize - rozmiar pojedynczej drobinki w pikselach, domyślnie 2
 *     offsetx, offsety - ręczne doregulowanie pozycji początku smugi w
 *               pikselach (dodatnie x = w prawo, dodatnie y = w dół), gdyby
 *               "anchor" nie trafiał idealnie w krawędź Twojej grafiki okna.
 *               Domyślnie 0,0.
 *     r,g,b   - kolor światła, domyślnie z parametrów pluginu
 *   Przykład - smuga w dół z dolnej krawędzi okna, szeroka od startu na całą
 *   kratkę, rozszerzająca się dalej pod kątem 60 stopni, na długość 2 kratek,
 *   z miękko rozmytymi krawędziami i pyłem w powietrzu:
 *     <LightCone:length=96,angle=60,dir=90,width=48,anchor=bottom,blur=14,dust=12>
 *
 *   Można postawić dowolnie wiele takich eventów - każdy to osobne światło.
 *
 * POCHODNIA GRACZA:
 *   To osobna, niezależna funkcja - światło podąża za graczem po całej mapie
 *   (nie jest przypięte do eventu). Sterowana jednym przełącznikiem (parametr
 *   "Przełącznik pochodnia zapalona"): gdy jest ON, wokół gracza świeci ciepła
 *   poświata; gdy OFF, gaśnie. Działa niezależnie od tagów <Dark:on/off>.
 *
 *   Żeby zrobić z tego przedmiot w ekwipunku:
 *   1. W bazie danych Przedmioty stwórz nowy przedmiot (np. "Pochodnia"),
 *      w polu Efekty dodaj "Wspólne zdarzenie" wskazujące na event, który
 *      włącza ten przełącznik i uruchamia komendę "Ustaw licznik czasu"
 *      (Control Timer: Start) - wbudowany licznik RPG Makera sam pokaże się
 *      na ekranie jako odliczanie.
 *   2. Ten plugin podpina się pod wygaśnięcie licznika: gdy dojdzie do zera
 *      podczas gdy pochodnia płonie, przełącznik automatycznie się wyłącza
 *      (pochodnia gaśnie) i można uruchomić dodatkowe wspólne zdarzenie
 *      (np. komunikat "Pochodnia zgasła") - wskaż je w parametrze
 *      "Wspólne zdarzenie po zgaśnięciu".
 *   3. Automatycznie, w prawym górnym rogu ekranu, pojawia się ikonka
 *      pochodni z paskiem czasu, który się zmniejsza w miarę upływu czasu
 *      i znika razem z pochodnią. Ikona to indeks z parametru "Ikona
 *      pochodni" (domyślnie 80 - płomień z domyślnego IconSet).
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "RoomLighting";
    const params = PluginManager.parameters(pluginName);
    const DARKNESS = Number(params.darkness || 120);
    const DARK_COLOR = String(params.darkColor || "20,20,35")
        .split(",")
        .map(s => Number(s.trim()));
    const DEFAULT_RADIUS = Number(params.lightRadius || 150);
    const DEFAULT_COLOR = String(params.lightColor || "255,244,214")
        .split(",")
        .map(s => Number(s.trim()));
    const DEFAULT_ENABLED = params.defaultEnabled === "true";
    const TORCH_SWITCH_ID = Number(params.torchSwitch || 0);
    const TORCH_RADIUS = Number(params.torchRadius || 140);
    const TORCH_COLOR = String(params.torchColor || "255,170,80")
        .split(",")
        .map(s => Number(s.trim()));
    const TORCH_FLICKER = params.torchFlicker === "true";
    const TORCH_EXPIRE_COMMON_EVENT = Number(params.torchExpireCommonEvent || 0);
    const TORCH_ICON_INDEX = Number(params.torchIconIndex || 80);

    function isDarkEnabled() {
        const note = $dataMap && $dataMap.note ? $dataMap.note : "";
        if (/<Dark:\s*on\s*>/i.test(note)) return true;
        if (/<Dark:\s*off\s*>/i.test(note)) return false;
        return DEFAULT_ENABLED;
    }

    function parseKeyValues(str) {
        const result = {};
        for (const pair of str.split(",")) {
            const eq = pair.indexOf("=");
            if (eq < 0) continue;
            const key = pair.slice(0, eq).trim().toLowerCase();
            const value = pair.slice(eq + 1).trim();
            if (key) result[key] = value;
        }
        return result;
    }

    // Where within the event's tile the light originates from.
    function anchorOffset(name, tileWidth, tileHeight) {
        switch ((name || "center").toLowerCase()) {
            case "top": return { x: tileWidth / 2, y: 0 };
            case "bottom": return { x: tileWidth / 2, y: tileHeight };
            case "left": return { x: 0, y: tileHeight / 2 };
            case "right": return { x: tileWidth, y: tileHeight / 2 };
            default: return { x: tileWidth / 2, y: tileHeight / 2 };
        }
    }

    function findLightMarkers() {
        const markers = [];
        if (!$dataMap || !$dataMap.events) return markers;
        for (const event of $dataMap.events) {
            if (!event || !event.note) continue;
            const coneMatch = event.note.match(/<LightCone:([^>]*)>/i);
            if (coneMatch) {
                const kv = parseKeyValues(coneMatch[1]);
                const length = kv.length !== undefined ? Number(kv.length) : DEFAULT_RADIUS;
                const angle = kv.angle !== undefined ? Number(kv.angle) : 60;
                const direction = kv.dir !== undefined ? Number(kv.dir) : 90;
                const startWidth = kv.width !== undefined ? Number(kv.width) : 0;
                const anchor = kv.anchor || "center";
                const blur = kv.blur !== undefined ? Number(kv.blur) : 6;
                const dust = kv.dust !== undefined ? Number(kv.dust) : 0;
                const dustSize = kv.dustsize !== undefined ? Number(kv.dustsize) : 2;
                const offsetX = kv.offsetx !== undefined ? Number(kv.offsetx) : 0;
                const offsetY = kv.offsety !== undefined ? Number(kv.offsety) : 0;
                const color =
                    kv.r !== undefined && kv.g !== undefined && kv.b !== undefined
                        ? [Number(kv.r), Number(kv.g), Number(kv.b)]
                        : DEFAULT_COLOR;
                markers.push({
                    x: event.x, y: event.y, shape: "cone",
                    length, angle, direction, startWidth, anchor, blur, dust, dustSize, offsetX, offsetY, color
                });
                continue;
            }
            const circleMatch = event.note.match(/<Light(?::([^>]*))?>/i);
            if (circleMatch) {
                let radius = DEFAULT_RADIUS;
                let color = DEFAULT_COLOR;
                if (circleMatch[1]) {
                    const parts = circleMatch[1].split(",").map(s => Number(s.trim()));
                    if (parts.length >= 1 && !isNaN(parts[0])) radius = parts[0];
                    if (parts.length >= 4) color = [parts[1], parts[2], parts[3]];
                }
                markers.push({ x: event.x, y: event.y, shape: "circle", radius, color });
            }
        }
        return markers;
    }

    function makeCircleGlowBitmap(radius, color) {
        const d = Math.max(2, Math.round(radius * 2));
        const bitmap = new Bitmap(d, d);
        const context = bitmap.context;
        const r = d / 2;
        const gradient = context.createRadialGradient(r, r, 0, r, r, r);
        gradient.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},0.9)`);
        gradient.addColorStop(0.6, `rgba(${color[0]},${color[1]},${color[2]},0.35)`);
        gradient.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
        context.fillStyle = gradient;
        context.fillRect(0, 0, d, d);
        bitmap._baseTexture.update();
        return { bitmap, anchorX: 0.5, anchorY: 0.5 };
    }

    function rotateVector(x, y, rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        return { x: x * c - y * s, y: x * s + y * c };
    }

    // The beam's shape: a segment `startWidth` pixels wide (0 = a single point)
    // whose two side edges fan out by `angleDeg` over `length` pixels.
    function computeConeGeometry(length, angleDeg, directionDeg, startWidth) {
        const halfAngle = ((angleDeg / 2) * Math.PI) / 180;
        const dirRad = (directionDeg * Math.PI) / 180;
        const mainDir = { x: Math.cos(dirRad), y: Math.sin(dirRad) };
        const perpDir = { x: -mainDir.y, y: mainDir.x };
        const halfW = startWidth / 2;
        const nearLeft = { x: -perpDir.x * halfW, y: -perpDir.y * halfW };
        const nearRight = { x: perpDir.x * halfW, y: perpDir.y * halfW };
        const leftDir = rotateVector(mainDir.x, mainDir.y, -halfAngle);
        const rightDir = rotateVector(mainDir.x, mainDir.y, halfAngle);
        return { mainDir, nearLeft, nearRight, leftDir, rightDir, length };
    }

    // A uniformly-sampled random point inside the beam's trapezoid, in the
    // same local coordinate space as the beam's own geometry (origin at the
    // anchor point on the tile edge).
    function randomPointInCone(geom) {
        const t = Math.random() * geom.length;
        const s = Math.random();
        const leftX = geom.nearLeft.x + geom.leftDir.x * t;
        const leftY = geom.nearLeft.y + geom.leftDir.y * t;
        const rightX = geom.nearRight.x + geom.rightDir.x * t;
        const rightY = geom.nearRight.y + geom.rightDir.y * t;
        return { x: leftX + s * (rightX - leftX), y: leftY + s * (rightY - leftY) };
    }

    // Draws a light beam as a quadrilateral filled with a linear gradient along
    // the beam direction, so it's bright at the source and fades out by the far
    // edge. `blur` softens every edge (sides, near edge and far edge alike) so
    // it blends into the room instead of looking like a cut-out shape.
    function makeConeGlowBitmap(length, angleDeg, directionDeg, startWidth, blur, color) {
        const geom = computeConeGeometry(length, angleDeg, directionDeg, startWidth);
        const { mainDir, nearLeft, nearRight, leftDir, rightDir } = geom;
        const farLeft = { x: nearLeft.x + leftDir.x * length, y: nearLeft.y + leftDir.y * length };
        const farRight = { x: nearRight.x + rightDir.x * length, y: nearRight.y + rightDir.y * length };

        const points = [nearLeft, nearRight, farRight, farLeft];
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        for (const p of points) {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
        }
        // Extra padding so the blur has room to spread without being clipped
        // by the bitmap's own edge.
        const padding = 4 + blur * 2;
        const originX = Math.round(padding - minX);
        const originY = Math.round(padding - minY);
        const width = Math.max(2, Math.ceil(maxX - minX) + padding * 2);
        const height = Math.max(2, Math.ceil(maxY - minY) + padding * 2);

        const bitmap = new Bitmap(width, height);
        const context = bitmap.context;
        context.save();
        context.translate(originX, originY);
        context.beginPath();
        context.moveTo(nearLeft.x, nearLeft.y);
        context.lineTo(nearRight.x, nearRight.y);
        context.lineTo(farRight.x, farRight.y);
        context.lineTo(farLeft.x, farLeft.y);
        context.closePath();
        const gradient = context.createLinearGradient(
            0, 0, mainDir.x * length, mainDir.y * length
        );
        gradient.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},0.9)`);
        gradient.addColorStop(0.7, `rgba(${color[0]},${color[1]},${color[2]},0.35)`);
        gradient.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
        context.fillStyle = gradient;
        if (blur > 0) context.filter = `blur(${blur}px)`;
        context.fill();
        context.restore();
        bitmap._baseTexture.update();
        return { bitmap, anchorX: originX / width, anchorY: originY / height, geom };
    }

    // A single tiny, drifting speck of dust visible inside a light beam - like
    // the motes you see floating in a real sunbeam through a window. Lives for
    // a few seconds, fading in and out, then respawns at a new random spot
    // inside the same beam.
    function Sprite_LightDustMote() {
        this.initialize(...arguments);
    }

    Sprite_LightDustMote.prototype = Object.create(Sprite.prototype);
    Sprite_LightDustMote.prototype.constructor = Sprite_LightDustMote;

    Sprite_LightDustMote._bitmapCache = {};
    Sprite_LightDustMote.sharedBitmap = function(size) {
        const d = Math.max(1, Math.round(size));
        if (!this._bitmapCache[d]) {
            const bitmap = new Bitmap(d, d);
            const context = bitmap.context;
            const r = d / 2;
            const gradient = context.createRadialGradient(r, r, 0, r, r, r);
            gradient.addColorStop(0, "rgba(255,255,255,0.95)");
            gradient.addColorStop(1, "rgba(255,255,255,0)");
            context.fillStyle = gradient;
            context.fillRect(0, 0, d, d);
            bitmap._baseTexture.update();
            this._bitmapCache[d] = bitmap;
        }
        return this._bitmapCache[d];
    };

    Sprite_LightDustMote.prototype.initialize = function(geom, tileX, tileY, offsetX, offsetY, size) {
        Sprite.prototype.initialize.call(this);
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.blendMode = 1; // additive - reads as a bright fleck even on a dark room
        this.bitmap = Sprite_LightDustMote.sharedBitmap(size);
        this._geom = geom;
        this._tileX = tileX;
        this._tileY = tileY;
        this._offsetX = offsetX;
        this._offsetY = offsetY;
        this.respawn();
    };

    Sprite_LightDustMote.prototype.respawn = function() {
        const p = randomPointInCone(this._geom);
        this._localX = p.x;
        this._localY = p.y;
        this._vx = (Math.random() - 0.5) * 0.2;
        this._vy = (Math.random() - 0.5) * 0.2;
        this._age = 0;
        this._life = 180 + Math.random() * 240; // ~3-7s at 60fps
    };

    Sprite_LightDustMote.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this._age++;
        this._localX += this._vx;
        this._localY += this._vy;
        if (this._age > this._life) this.respawn();
        const fadeFrames = 25;
        const fadeIn = Math.min(1, this._age / fadeFrames);
        const fadeOut = Math.min(1, (this._life - this._age) / fadeFrames);
        this.opacity = Math.round(220 * Math.max(0, Math.min(fadeIn, fadeOut)));
        const tw = $gameMap.tileWidth();
        const th = $gameMap.tileHeight();
        this.x = Math.round((this._tileX - $gameMap.displayX()) * tw + this._offsetX + this._localX);
        this.y = Math.round((this._tileY - $gameMap.displayY()) * th + this._offsetY + this._localY);
    };

    function Sprite_RoomLight() {
        this.initialize(...arguments);
    }

    Sprite_RoomLight.prototype = Object.create(Sprite.prototype);
    Sprite_RoomLight.prototype.constructor = Sprite_RoomLight;

    Sprite_RoomLight.prototype.initialize = function(marker) {
        Sprite.prototype.initialize.call(this);
        this.blendMode = 1; // additive - punches a bright hole through the darkness
        const tw = $gameMap.tileWidth();
        const th = $gameMap.tileHeight();
        let built, offset;
        if (marker.shape === "cone") {
            built = makeConeGlowBitmap(marker.length, marker.angle, marker.direction, marker.startWidth, marker.blur, marker.color);
            offset = anchorOffset(marker.anchor, tw, th);
        } else {
            built = makeCircleGlowBitmap(marker.radius, marker.color);
            offset = { x: tw / 2, y: th / 2 };
        }
        this.bitmap = built.bitmap;
        this.anchor.x = built.anchorX;
        this.anchor.y = built.anchorY;
        this._tileX = marker.x;
        this._tileY = marker.y;
        this._offsetX = offset.x + (marker.offsetX || 0);
        this._offsetY = offset.y + (marker.offsetY || 0);
    };

    Sprite_RoomLight.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const tw = $gameMap.tileWidth();
        const th = $gameMap.tileHeight();
        this.x = Math.round((this._tileX - $gameMap.displayX()) * tw + this._offsetX);
        this.y = Math.round((this._tileY - $gameMap.displayY()) * th + this._offsetY);
    };

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this.createRoomLighting();
    };

    Spriteset_Map.prototype.createRoomLighting = function() {
        this._roomLightSprites = [];
        this._roomHoles = []; // {shape, sprite, radius} | {shape:'cone', sprite, geom} - punched into the darkness each frame
        this._roomLightingContainer = new Sprite();
        if (isDarkEnabled()) {
            const darkBitmap = new Bitmap(Graphics.width, Graphics.height);
            this._darknessSprite = new Sprite(darkBitmap);
            this._roomLightingContainer.addChild(this._darknessSprite);

            const tw = $gameMap.tileWidth();
            const th = $gameMap.tileHeight();
            for (const marker of findLightMarkers()) {
                const light = new Sprite_RoomLight(marker);
                this._roomLightSprites.push(light);
                this._roomLightingContainer.addChild(light);

                if (marker.shape === "cone") {
                    const geom = computeConeGeometry(marker.length, marker.angle, marker.direction, marker.startWidth);
                    this._roomHoles.push({ shape: "cone", sprite: light, geom });
                    if (marker.dust > 0) {
                        const offset = anchorOffset(marker.anchor, tw, th);
                        const ox = offset.x + (marker.offsetX || 0);
                        const oy = offset.y + (marker.offsetY || 0);
                        for (let i = 0; i < marker.dust; i++) {
                            const mote = new Sprite_LightDustMote(geom, marker.x, marker.y, ox, oy, marker.dustSize);
                            this._roomLightSprites.push(mote);
                            this._roomLightingContainer.addChild(mote);
                        }
                    }
                } else {
                    this._roomHoles.push({ shape: "circle", sprite: light, radius: marker.radius });
                }
            }
        }
        this.addChild(this._roomLightingContainer);
    };

    // Cuts a soft-edged hole in the darkness bitmap so the real, fully-lit
    // scene shows through underneath - not just a warm tint added on top of
    // the dimmed colors. Must run with context.globalCompositeOperation
    // already set to "destination-out" by the caller.
    function punchCircleHole(context, cx, cy, radius) {
        const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, "rgba(0,0,0,1)");
        gradient.addColorStop(0.6, "rgba(0,0,0,0.85)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(cx, cy, radius, 0, Math.PI * 2);
        context.fill();
    }

    function punchConeHole(context, cx, cy, geom) {
        const { nearLeft, nearRight, leftDir, rightDir, mainDir, length } = geom;
        const farLeft = { x: nearLeft.x + leftDir.x * length, y: nearLeft.y + leftDir.y * length };
        const farRight = { x: nearRight.x + rightDir.x * length, y: nearRight.y + rightDir.y * length };
        context.save();
        context.translate(cx, cy);
        context.beginPath();
        context.moveTo(nearLeft.x, nearLeft.y);
        context.lineTo(nearRight.x, nearRight.y);
        context.lineTo(farRight.x, farRight.y);
        context.lineTo(farLeft.x, farLeft.y);
        context.closePath();
        const gradient = context.createLinearGradient(0, 0, mainDir.x * length, mainDir.y * length);
        gradient.addColorStop(0, "rgba(0,0,0,1)");
        gradient.addColorStop(0.75, "rgba(0,0,0,0.7)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.fill();
        context.restore();
    }

    Spriteset_Map.prototype.redrawDarkness = function() {
        if (!this._darknessSprite) return;
        const bitmap = this._darknessSprite.bitmap;
        const context = bitmap.context;
        context.save();
        context.globalCompositeOperation = "source-over";
        context.clearRect(0, 0, bitmap.width, bitmap.height);
        context.fillStyle = `rgba(${DARK_COLOR[0]},${DARK_COLOR[1]},${DARK_COLOR[2]},${DARKNESS / 255})`;
        context.fillRect(0, 0, bitmap.width, bitmap.height);
        context.globalCompositeOperation = "destination-out";
        for (const hole of this._roomHoles) {
            if (hole.shape === "circle") {
                punchCircleHole(context, hole.sprite.x, hole.sprite.y, hole.radius);
            } else {
                punchConeHole(context, hole.sprite.x, hole.sprite.y, hole.geom);
            }
        }
        if (this._playerTorch) {
            punchCircleHole(context, this._playerTorch.x, this._playerTorch.y, TORCH_RADIUS);
        }
        context.restore();
        bitmap._baseTexture.update();
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        if (this._roomLightSprites) {
            for (const light of this._roomLightSprites) {
                light.update();
            }
        }
        this.updatePlayerTorch();
        this.redrawDarkness();
    };

    // --- Player-carried torch: a light that follows the player anywhere on the
    // map, independent of the per-map <Dark:on/off> lighting above. Turned on
    // and off purely by a switch, so any event (e.g. using a "Torch" item) can
    // control it with a plain "Control Switch" command. ---
    function Sprite_PlayerTorch() {
        this.initialize(...arguments);
    }

    Sprite_PlayerTorch.prototype = Object.create(Sprite.prototype);
    Sprite_PlayerTorch.prototype.constructor = Sprite_PlayerTorch;

    Sprite_PlayerTorch.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.blendMode = 1; // additive - punches through darkness like the other lights
        this.bitmap = makeCircleGlowBitmap(TORCH_RADIUS, TORCH_COLOR).bitmap;
        this._flickerPhase = Math.random() * Math.PI * 2;
    };

    Sprite_PlayerTorch.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.x = $gamePlayer.screenX();
        this.y = $gamePlayer.screenY() - $gameMap.tileHeight() * 0.6;
        if (TORCH_FLICKER) {
            this._flickerPhase += 0.15 + Math.random() * 0.1;
            const flick = 1 + Math.sin(this._flickerPhase) * 0.05 + (Math.random() - 0.5) * 0.04;
            this.scale.x = this.scale.y = flick;
            this.opacity = Math.round(255 * (0.88 + Math.random() * 0.12));
        }
    };

    Spriteset_Map.prototype.updatePlayerTorch = function() {
        const lit = TORCH_SWITCH_ID > 0 && $gameSwitches.value(TORCH_SWITCH_ID);
        if (lit && !this._playerTorch) {
            this._playerTorch = new Sprite_PlayerTorch();
            this.addChild(this._playerTorch);
            this._torchMaxFrames = $gameTimer.frames();
            this._torchGauge = new Sprite_TorchGauge();
            // Live in the scene's HUD layer when there is one: the spriteset is
            // scaled by MapZoom, which would shrink and shift the gauge.
            const scene = SceneManager._scene;
            const hud = scene && typeof scene.hudLayer === "function" ? scene.hudLayer() : null;
            (hud || this).addChild(this._torchGauge);
        } else if (!lit && this._playerTorch) {
            this.removeChild(this._playerTorch);
            this._playerTorch = null;
            if (this._torchGauge.parent) this._torchGauge.parent.removeChild(this._torchGauge);
            this._torchGauge = null;
        }
        if (this._playerTorch) this._playerTorch.update();
        if (this._torchGauge) {
            const ratio = this._torchMaxFrames > 0 ? $gameTimer.frames() / this._torchMaxFrames : 0;
            this._torchGauge.setRatio(Math.max(0, Math.min(1, ratio)));
            this._torchGauge.update();
        }
    };

    // A small always-on-top HUD readout: torch icon + a shrinking bar, shown
    // in the top-right corner while the torch is lit.
    function Sprite_TorchGauge() {
        this.initialize(...arguments);
    }

    Sprite_TorchGauge.prototype = Object.create(Sprite.prototype);
    Sprite_TorchGauge.prototype.constructor = Sprite_TorchGauge;

    Sprite_TorchGauge.ICON_SIZE = 32;
    Sprite_TorchGauge.BAR_WIDTH = 120;
    Sprite_TorchGauge.BAR_HEIGHT = 10;
    Sprite_TorchGauge.MARGIN = 12;
    Sprite_TorchGauge.GAP = 6;

    Sprite_TorchGauge.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        const iconSize = Sprite_TorchGauge.ICON_SIZE;
        const width = iconSize + Sprite_TorchGauge.GAP + Sprite_TorchGauge.BAR_WIDTH;
        this.bitmap = new Bitmap(width, iconSize);
        this.x = Graphics.width - width - Sprite_TorchGauge.MARGIN;
        this.y = Sprite_TorchGauge.MARGIN;
        this._iconBitmap = ImageManager.loadSystem("IconSet");
        this._ratio = 1;
        this.redraw();
    };

    Sprite_TorchGauge.prototype.setRatio = function(ratio) {
        this._ratio = ratio;
    };

    Sprite_TorchGauge.prototype.redraw = function() {
        const bmp = this.bitmap;
        const iconSize = Sprite_TorchGauge.ICON_SIZE;
        bmp.clear();
        if (this._iconBitmap.isReady()) {
            const cols = Math.floor(this._iconBitmap.width / iconSize);
            const sx = (TORCH_ICON_INDEX % cols) * iconSize;
            const sy = Math.floor(TORCH_ICON_INDEX / cols) * iconSize;
            bmp.blt(this._iconBitmap, sx, sy, iconSize, iconSize, 0, 0);
        }
        const barX = iconSize + Sprite_TorchGauge.GAP;
        const barY = Math.round((iconSize - Sprite_TorchGauge.BAR_HEIGHT) / 2);
        const barW = Sprite_TorchGauge.BAR_WIDTH;
        const barH = Sprite_TorchGauge.BAR_HEIGHT;
        bmp.fillRect(barX, barY, barW, barH, "rgba(0,0,0,0.6)");
        const innerW = Math.max(0, Math.round((barW - 2) * this._ratio));
        const color = this._ratio > 0.3 ? "#ffa050" : "#ff5040";
        if (innerW > 0) bmp.fillRect(barX + 1, barY + 1, innerW, barH - 2, color);
    };

    Sprite_TorchGauge.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.redraw();
    };

    // When the built-in timer expires while the torch switch is on, treat it
    // as the torch burning out: turn the switch off and optionally fire a
    // common event, instead of the default battle-timeout behavior.
    const _Game_Timer_onExpire = Game_Timer.prototype.onExpire;
    Game_Timer.prototype.onExpire = function() {
        if (TORCH_SWITCH_ID > 0 && $gameSwitches.value(TORCH_SWITCH_ID)) {
            $gameSwitches.setValue(TORCH_SWITCH_ID, false);
            if (TORCH_EXPIRE_COMMON_EVENT > 0) {
                $gameTemp.reserveCommonEvent(TORCH_EXPIRE_COMMON_EVENT);
            }
        } else {
            _Game_Timer_onExpire.call(this);
        }
    };
})();
