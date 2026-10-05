//=============================================================================
// RoomLighting.js
//=============================================================================
// Z-order: must load after DustMotes.js and before DayNightCycle.js, CloudShadows.js and SwayingFoliage.js.

/*:
 * @target MZ
 * @plugindesc Przyciemnia pokój i dodaje ciepłą poświatę światła (np. z okna); ludzie i zwierzęta rzucają cienie od lamp i ognia; każde światło migocze jak płomień. v1.4.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
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
 * @param flameFlicker
 * @text Każde światło to płomień
 * @type boolean
 * @default true
 * @desc Światła <Light> bez własnego <LightFlicker> migoczą delikatnie jak płomień (w grze nie ma elektryczności). Nie dotyczy smug z okien, świateł dziennych i miękkiego wypełnienia.
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
 *   Światła i dziury poza ekranem nie są rysowane (duże mapy z wieloma
 *   światłami), a ciemność jest przeliczana tylko, gdy coś się zmieniło.
 *
 * PORA DNIA (v1.1.0, tylko na mapach z tagiem <DarkDay>):
 *   W notatce mapy:
 *     <DarkDay:80>    - przyciemnienie za dnia (0-255); w nocy jest to z
 *                       parametru "Siła przyciemnienia" albo z <DarkNight:N>.
 *     <DarkNight:190> - (opcjonalnie) przyciemnienie w nocy na tej mapie.
 *   Między dniem i nocą przyciemnienie przechodzi płynnie: wieczór 16-19
 *   (zapalają się lampy), świt 6-8.
 *   W notatce eventu ze światłem (obok <Light> / <LightCone>):
 *     <LightWhen:night> - świeci wieczorem i w nocy (świece, lampy,
 *                         żyrandole), za dnia gaśnie
 *     <LightWhen:day>   - świeci za dnia (smugi słońca z okien), w nocy gaśnie
 *   Bez <LightWhen> światło świeci zawsze (kominek, piec).
 *     <LightSoft>       - (v1.1.1) miękkie, równe wygaszanie aż do krawędzi -
 *                         dla dużych świateł wypełniających, żeby między nimi
 *                         nie zostawały ciemniejsze pasy
 *   Mapy bez <DarkDay> działają jak dotąd (stałe przyciemnienie).
 *
 * ŻYWY PŁOMIEŃ (v1.2.0):
 *   W notatce eventu ze światłem <Light> (obok niego):
 *     <LightFlicker:0.15>             - światło migocze: jasność i zasięg
 *                                       falują jak prawdziwy ogień (kilka
 *                                       nałożonych szumów, czasem krótkie
 *                                       przygaśnięcie - nigdy równy rytm);
 *                                       liczba to siła (0.05 świeca, 0.15
 *                                       palenisko)
 *     <LightFlicker:0.15,130,82,20>   - do tego kolor powoli przechodzi
 *                                       w podany R,G,B i z powrotem (np.
 *                                       pomarańcz <-> bursztyn)
 *   Każde światło ma własny rytm - świece obok siebie nie migoczą razem.
 *   (v1.4.0) Bez tego tagu każde <Light> i tak migocze delikatnie jak
 *   płomień (parametr "Każde światło to płomień"): mała lampka/świeca 0.05,
 *   lampa 0.07, palenisko/kominek 0.1. <LightFlicker:0> - równe światło.
 *   Nie migoczą: <LightCone> (smugi z okien), <LightWhen:day>, <LightSoft>
 *   i światła wypełniające o prawie czarnym kolorze (każda składowa < 25).
 *   Przy <LightCone> migocze tylko jasność.
 *
 * CIENIE (v1.3.0, razem z ChoppableTree_Render.js):
 *   Ludzie i zwierzęta stojący w świetle lampy, kominka, pieca, świecy czy
 *   żyrandola rzucają cień w stronę od światła - wycięty z jego blasku (w
 *   cieniu jest tak ciemno jak w pokoju dookoła). Blisko światła krótki, dalej
 *   dłuższy, przy stopach wyraźny, dalej blednie i się rozmywa; migocze razem
 *   z płomieniem. Okna (smugi <LightCone>) i miękkie światła wypełniające
 *   (<LightSoft>) cieni nie dają.
 *   Wysokość płomienia (od niej długość cieni) gra zgaduje: ogień, piec,
 *   kocioł (świecą zawsze) 22 px, świece 30 px, lampy i żyrandole 56 px. Inną
 *   można wpisać w notatce eventu: <LightHeight:40>.
 *
 * DLA INNYCH WTYCZEK:
 *   SceneManager._scene._spriteset.roomLightHoles() - lista świateł mapy
 *   ({ shape, sprite, radius | geom }); sprite._eventId to numer eventu,
 *   sprite._gain (0..1, domyślnie 1) przygasza światło (np. słońce w oknie,
 *   gdy pada deszcz), sprite._weight to jego siła w tej chwili.
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

    const T = window.Tawerna;
    if (!T) throw new Error("RoomLighting.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");

    const pluginName = "RoomLighting";
    const params = PluginManager.parameters(pluginName);
    const num = (v, d) => (v !== undefined && v !== "" && isFinite(Number(v)) ? Number(v) : d);
    // Parses a "R,G,B" plugin-parameter string (e.g. "20,20,35") into [r,g,b] numbers.
    const parseRGB = str => String(str).split(",").map(s => Number(s.trim()));
    const DARKNESS = num(params.darkness, 120);
    const DARK_COLOR = parseRGB(params.darkColor || "20,20,35");
    const DEFAULT_RADIUS = num(params.lightRadius, 150);
    const DEFAULT_COLOR = parseRGB(params.lightColor || "255,244,214");
    const DEFAULT_ENABLED = params.defaultEnabled === "true";
    const TORCH_SWITCH_ID = num(params.torchSwitch, 0);
    const TORCH_RADIUS = num(params.torchRadius, 140);
    const TORCH_COLOR = parseRGB(params.torchColor || "255,170,80");
    const TORCH_FLICKER = params.torchFlicker === "true";
    const FLAME_FLICKER = params.flameFlicker !== "false";
    const TORCH_EXPIRE_COMMON_EVENT = num(params.torchExpireCommonEvent, 0);
    const TORCH_ICON_INDEX = num(params.torchIconIndex, 80);
    const DARK_SCALE = 2;          // the darkness layer is painted at half resolution

    // <Dark:on> / <Dark:off> in the map's note, else the parameter ("on" wins when both are there)
    function isDarkEnabled() {
        return T.mapFlag("Dark", DEFAULT_ENABLED);
    }

    // ---- time of day (only on maps with <DarkDay:N>): 0 by day .. 1 in the evening and at night
    function noteNumber(tag) {
        const t = T.mapTag(tag);
        return t && /^\d+$/.test(t.raw) ? Number(t.raw) : null;
    }
    const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    function nightCurve(h) {
        if (h >= 19 || h < 6) return 1;
        if (h >= 16) return smooth((h - 16) / 3);   // the tavern lights its lamps from 16:00, full evening at 19:00
        if (h < 8) return 1 - smooth((h - 6) / 2);  // dawn
        return 0;
    }
    // the darkness (0..1 alpha) and how much of "night" there is, for this map and hour
    function timeOfDay() {
        const day = noteNumber("DarkDay");
        if (day === null || typeof $gameSystem.dayNightHour !== "function") return { alpha: DARKNESS / 255, night: 1, timed: false };
        const nightDark = noteNumber("DarkNight");
        const n = nightCurve($gameSystem.dayNightHour());
        const a = day + ((nightDark !== null ? nightDark : DARKNESS) - day) * n;
        return { alpha: a / 255, night: n, timed: true };
    }
    function lightWeight(when, tod) {
        if (!tod.timed || !when) return 1;
        return when === "night" ? tod.night : when === "day" ? 1 - tod.night : 1;
    }
    function lightWhen(note, kv) {
        const m = note.match(/<LightWhen:\s*(day|night)\s*>/i);
        const w = (m ? m[1] : (kv && kv.when) || "").toLowerCase();
        return w === "day" || w === "night" ? w : null;
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

    // ---- <LightFlicker:amount[,r,g,b]> (v1.2.0): a living flame. Strength and reach wobble with layered value noise (three octaves
    // and now and then a quick dip, never a regular sine); with r,g,b the colour drifts between its own and that one. Each light has
    // its own seed. The flicker is read every FLICKER_STEP frames, so the darkness is repainted at most that often for it.
    const FLICKER_STEP = 2;
    // null: no tag (the default flame may apply), false: <LightFlicker:0> - a steady light
    function parseFlicker(note) {
        const m = note.match(/<LightFlicker(?::([^>]*))?>/i);
        if (!m) return null;
        if (m[1] !== undefined && m[1].trim() !== "" && Number(m[1].split(",")[0].trim()) === 0) return false;
        const p = (m[1] || "").split(",").map(s => Number(s.trim()));
        const amount = p[0] > 0 ? Math.min(0.5, p[0]) : 0.12;
        const alt = p.length >= 4 && p.slice(1, 4).every(v => isFinite(v)) ? p.slice(1, 4) : null;
        return { amount, alt };
    }
    // (v1.4.0) every light in the game is a flame (user 2026-10-05: "nie ma elektryczności w grze"): a <Light> with no <LightFlicker>
    // of its own (after HomeAmbience.js has added its own to the hearths and candles of the home maps) flickers gently - by its size:
    // a small lamp or a candle, a lamp, a hearth. Not the day's light: a window's beam (<LightCone>), <LightWhen:day>, a <LightSoft> fill,
    // nor a fill light with no colour of its own to speak of (near black, under FILL_COLOUR: the upper floors' 'wypelnienie' 14,10,4).
    const FILL_COLOUR = 25;
    function flameFlicker(radius) {
        return { amount: radius <= 80 ? 0.05 : radius <= 170 ? 0.07 : 0.1, alt: null };
    }
    // smooth value noise 0..1 along a line (a seeded lattice, smoothstep between its points); nothing allocated
    function lattice(i, seed) {
        const v = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
        return v - Math.floor(v);
    }
    function noise1(x, seed) {
        const i = Math.floor(x), f = x - i, a = lattice(i, seed);
        return a + (lattice(i + 1, seed) - a) * f * f * (3 - 2 * f);
    }

    function findLightMarkers() {
        const markers = [];
        if (!$dataMap || !$dataMap.events) return markers;
        for (const event of $dataMap.events) {
            if (!event || !event.note) continue;
            const flicker = parseFlicker(event.note);
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
                    length, angle, direction, startWidth, anchor, blur, dust, dustSize, offsetX, offsetY, color,
                    when: lightWhen(event.note, kv), flicker: flicker || null, eventId: event.id
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
                const height = event.note.match(/<LightHeight:\s*(\d+)>/i);
                const when = lightWhen(event.note, null), soft = /<LightSoft>/i.test(event.note);
                const fill = soft || Math.max(color[0], color[1], color[2]) < FILL_COLOUR;
                const flame = flicker === null && FLAME_FLICKER && !fill && when !== "day" ? flameFlicker(radius) : flicker || null;
                markers.push({ x: event.x, y: event.y, shape: "circle", radius, color, when, soft, flicker: flame, eventId: event.id,
                    height: height ? Number(height[1]) : 0 });
            }
        }
        return markers;
    }

    // Builds a square bitmap `size` px wide filled with a radial gradient from
    // its center to its edge, painted from `colorStops` ([offset, r, g, b, a]
    // tuples fed straight to CanvasGradient.addColorStop). Duplicated
    // identically in CloudShadows.js/DustMotes.js is NOT possible for the
    // multi-puff cloud shape in CloudShadows.js, but DustMotes.js's own glow
    // dot uses the same shape as this one - see the top-of-file note there.
    function makeRadialGlowBitmap(size, colorStops) {
        const d = Math.max(2, Math.round(size));
        const bitmap = new Bitmap(d, d);
        const context = bitmap.context;
        const r = d / 2;
        const gradient = context.createRadialGradient(r, r, 0, r, r, r);
        for (const stop of colorStops) {
            gradient.addColorStop(stop[0], `rgba(${stop[1]},${stop[2]},${stop[3]},${stop[4]})`);
        }
        context.fillStyle = gradient;
        context.fillRect(0, 0, d, d);
        bitmap._baseTexture.update();
        return bitmap;
    }

    function makeCircleGlowBitmap(radius, color) {
        const bitmap = makeRadialGlowBitmap(radius * 2, [
            [0, color[0], color[1], color[2], 0.9],
            [0.6, color[0], color[1], color[2], 0.35],
            [1, color[0], color[1], color[2], 0]
        ]);
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

    // A tiny shared shape for the map-anchored particle sprites in this plugin
    // (currently just Sprite_LightDustMote): centers themselves like a glow,
    // and convert their position via $gameMap.adjustX/adjustY (the same
    // conversion the tile renderer itself uses, so wrapping/looping maps
    // scroll correctly) instead of a manual `value - displayX()` subtraction.
    // The same shape is duplicated in CloudShadows.js (Sprite_CloudShadow) and
    // DustMotes.js (Sprite_DustMote) - no shared module between these plugin
    // files today, see the top-of-file z-order note.
    function Sprite_ParticleBase() {
        this.initialize(...arguments);
    }
    Sprite_ParticleBase.prototype = Object.create(Sprite.prototype);
    Sprite_ParticleBase.prototype.constructor = Sprite_ParticleBase;
    Sprite_ParticleBase.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
    };
    // tileX/tileY are in TILE units (e.g. an event's x/y on the map).
    Sprite_ParticleBase.prototype.tileToScreenX = function(tileX) {
        return $gameMap.adjustX(tileX) * $gameMap.tileWidth();
    };
    Sprite_ParticleBase.prototype.tileToScreenY = function(tileY) {
        return $gameMap.adjustY(tileY) * $gameMap.tileHeight();
    };

    // A single tiny, drifting speck of dust visible inside a light beam - like
    // the motes you see floating in a real sunbeam through a window. Lives for
    // a few seconds, fading in and out, then respawns at a new random spot
    // inside the same beam.
    function Sprite_LightDustMote() {
        this.initialize(...arguments);
    }

    Sprite_LightDustMote.prototype = Object.create(Sprite_ParticleBase.prototype);
    Sprite_LightDustMote.prototype.constructor = Sprite_LightDustMote;

    Sprite_LightDustMote._bitmapCache = {};
    Sprite_LightDustMote.sharedBitmap = function(size) {
        const d = Math.max(1, Math.round(size));
        if (!this._bitmapCache[d]) {
            this._bitmapCache[d] = makeRadialGlowBitmap(d, [
                [0, 255, 255, 255, 0.95],
                [1, 255, 255, 255, 0]
            ]);
        }
        return this._bitmapCache[d];
    };

    Sprite_LightDustMote.prototype.initialize = function(geom, tileX, tileY, offsetX, offsetY, size) {
        Sprite_ParticleBase.prototype.initialize.call(this);
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
        Sprite_ParticleBase.prototype.update.call(this);
        this._age++;
        this._localX += this._vx;
        this._localY += this._vy;
        if (this._age > this._life) this.respawn();
        const fadeFrames = 25;
        const fadeIn = Math.min(1, this._age / fadeFrames);
        const fadeOut = Math.min(1, (this._life - this._age) / fadeFrames);
        const weight = this._light ? this._light._weight : 1;      // the mote fades with its beam (time of day)
        this.opacity = Math.round(220 * weight * Math.max(0, Math.min(fadeIn, fadeOut)));
        if (this._light) this.visible = this._light.visible;
        this.x = Math.round(this.tileToScreenX(this._tileX) + this._offsetX + this._localX);
        this.y = Math.round(this.tileToScreenY(this._tileY) + this._offsetY + this._localY);
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
        this._when = marker.when || null;
        this._weight = 1;
        this._gain = 1;                        // (other plugins may dim it: 0..1)
        this._eventId = marker.eventId || 0;
        // how high the flame is (px), for the shadows it makes things throw: <LightHeight:N>, else a fire, a stove, a cauldron (always
        // lit) low, a candle a little higher, a lamp or a chandelier high up
        this._lightHeight = marker.height || (marker.when !== "night" ? 22 : marker.radius <= 130 ? 30 : 56);
        // a flickering flame: k strength, s reach (scale), c how far the colour has drifted to the other one (alt)
        const fl = marker.flicker;
        this._flicker = fl ? { amount: fl.amount, alt: marker.shape === "circle" ? fl.alt : null, seed: (marker.eventId || 0) * 7.31 + marker.x * 0.37 + marker.y * 1.91,
            k: 1, s: 1, c: 0, dip: 0 } : null;
        if (this._flicker && this._flicker.alt) this._altBitmap = makeCircleGlowBitmap(marker.radius, this._flicker.alt).bitmap;
        // how far the light reaches from its point (for leaving out lights that are off the screen)
        this._reach = marker.shape === "cone"
            ? marker.length + marker.startWidth / 2 + (marker.blur || 0) * 2 + 8
            : marker.radius * (fl ? 1 + fl.amount : 1);
    };

    // the flame's next moment: three octaves of noise (the slow breathing of the fire, its licking, a quick shiver) and now and
    // then a short dip, as when a draught ducks the flame
    Sprite_RoomLight.prototype.updateFlicker = function(frame) {
        const f = this._flicker;
        if (!f || frame % FLICKER_STEP !== 0) return;
        const t = frame / 60, sd = f.seed;
        const n = 0.55 * noise1(t * 1.1, sd) + 0.3 * noise1(t * 3.3, sd + 7) + 0.15 * noise1(t * 8.7, sd + 13);   // 0..1
        if (f.dip > 0) f.dip -= FLICKER_STEP;
        else if (Math.random() < 0.003 * FLICKER_STEP) f.dip = 6 + Math.random() * 12;
        const w = (n - 0.5) * 2.2 - (f.dip > 0 ? 0.45 : 0);
        f.k = Math.max(0.2, 1 + f.amount * (w - 0.2));        // strength: mostly just under full
        f.s = Math.max(0.5, 1 + f.amount * 0.45 * w);           // reach
        if (f.alt) f.c = Math.max(0, Math.min(1, 1.4 * noise1(t * 0.55, sd + 29) - 0.2));
    };

    Sprite_RoomLight.prototype.update = function() {
        Sprite.prototype.update.call(this);
        // Same conversion as Sprite_ParticleBase above (adjustX/Y, not a manual
        // displayX() subtraction) so this also scrolls correctly on looping maps.
        this.x = Math.round($gameMap.adjustX(this._tileX) * $gameMap.tileWidth() + this._offsetX);
        this.y = Math.round($gameMap.adjustY(this._tileY) * $gameMap.tileHeight() + this._offsetY);
    };

    // visible = inside the part of the map on screen (view: {x0, y0, x1, y1} in the spriteset's own coordinates) and
    // lit at this hour; the glow's strength follows the hour too
    Sprite_RoomLight.prototype.updateShown = function(view, tod) {
        if (this._flicker) this.updateFlicker(Graphics.frameCount);
        this._weight = lightWeight(this._when, tod) * this._gain * (this._flicker ? this._flicker.k : 1);
        const r = this._reach;
        const inView = this.x + r > view.x0 && this.x - r < view.x1 && this.y + r > view.y0 && this.y - r < view.y1;
        this.visible = inView && this._weight > 0.004;
        this.opacity = Math.round(255 * this._weight);
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
        this._darkKey = "";
        if (isDarkEnabled()) {
            // the darkness at half resolution, drawn twice as large: a quarter of the pixels to paint and to upload
            // each time it changes (the edges of the light are soft gradients, so nothing is lost)
            const darkBitmap = new Bitmap(Math.ceil(Graphics.width / DARK_SCALE) + 2, Math.ceil(Graphics.height / DARK_SCALE) + 2);
            this._darknessSprite = new Sprite(darkBitmap);
            this._darknessSprite.scale.set(DARK_SCALE, DARK_SCALE);
            this._roomLightingContainer.addChild(this._darknessSprite);
            // all the warm glows painted into ONE half-resolution layer (added to the picture like each glow was):
            // one screen of pixels to blend instead of a big sprite per light
            this._glowSprite = new Sprite(new Bitmap(darkBitmap.width, darkBitmap.height));
            this._glowSprite.scale.set(DARK_SCALE, DARK_SCALE);
            this._glowSprite.blendMode = 1;
            this._roomLightingContainer.addChild(this._glowSprite);

            const tw = $gameMap.tileWidth();
            const th = $gameMap.tileHeight();
            for (const marker of findLightMarkers()) {
                const light = new Sprite_RoomLight(marker);
                light.renderable = false;          // its glow is painted into the shared glow layer
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
                            mote._light = light;
                            this._roomLightSprites.push(mote);
                            this._roomLightingContainer.addChild(mote);
                        }
                    }
                } else {
                    this._roomHoles.push({ shape: "circle", sprite: light, radius: marker.radius, soft: !!marker.soft });
                }
            }
        }
        this.addChild(this._roomLightingContainer);
    };

    // Cuts a soft-edged hole in the darkness bitmap so the real, fully-lit
    // scene shows through underneath - not just a warm tint added on top of
    // the dimmed colors. Must run with context.globalCompositeOperation
    // already set to "destination-out" by the caller.
    function punchCircleHole(context, cx, cy, radius, weight = 1, soft = false) {
        const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const stops = soft ? SOFT_STOPS : HARD_STOPS;   // (<LightSoft>: a long even fall-off - big fill lights leave no bands between them)
        for (const [at, k] of stops) gradient.addColorStop(at, `rgba(0,0,0,${k * weight})`);
        context.fillStyle = gradient;
        // (a square filled with the radial gradient, not an arc path: the software renderer triangulates a big arc
        // and leaves a thin diagonal seam in the hole under destination-out; outside the radius the gradient is clear)
        context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }

    const HARD_STOPS = [[0, 1], [0.6, 0.85], [1, 0]];
    const SOFT_STOPS = [[0, 1], [0.25, 0.9], [0.5, 0.62], [0.75, 0.27], [1, 0]];

    function punchConeHole(context, cx, cy, geom, weight = 1) {
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
        gradient.addColorStop(0, `rgba(0,0,0,${weight})`);
        gradient.addColorStop(0.75, `rgba(0,0,0,${0.7 * weight})`);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.fill();
        context.restore();
    }

    // the part of the map on screen, in the spriteset's own coordinates (MapZoom scales and moves the spriteset)
    Spriteset_Map.prototype.roomLightView = function() {
        const s = this.scale.x || 1;
        const x0 = -this.x / s, y0 = -this.y / s;
        return { x0, y0, x1: x0 + Graphics.width / s, y1: y0 + Graphics.height / s };
    };

    // a light's strength now; a hole another plugin put in (e.g. TavernLife's room candle) has none of its own: full
    const weightOf = sp => (typeof sp._weight === "number" && isFinite(sp._weight) ? sp._weight : 1);
    Spriteset_Map.prototype.redrawDarkness = function() {
        if (!this._darknessSprite) return;
        const tod = this._roomTimeOfDay || timeOfDay();
        const view = this._roomView || this.roomLightView();
        const visible = this._roomHoles.filter(h => h.sprite.visible);
        this.updateLightBlockers(visible);
        // nothing moved and the hour's light is the same: the last picture is still right (skip the paint and upload)
        // (a light's own strength is in the key too: a flickering flame or one another plugin dims; and who stands in it)
        const Sun = T.api("Sun");
        const key = this._playerTorch ? "" : [tod.alpha.toFixed(3), tod.night.toFixed(3), Math.round(view.x0), Math.round(view.y0),
            view.x1 - view.x0, visible.map(h => h.sprite.x + "," + h.sprite.y + "," + weightOf(h.sprite).toFixed(3) +
                (h.sprite._flicker ? "," + h.sprite._flicker.s.toFixed(3) + "," + h.sprite._flicker.c.toFixed(2) : "") +
                (h._blockers && h._blockers.length ? "," + Sun.blockersKey(h._blockers) : "")).join(";")].join("|");
        if (key && key === this._darkKey) return;
        this._darkKey = key;
        const bitmap = this._darknessSprite.bitmap;
        const context = bitmap.context;
        const k = 1 / DARK_SCALE;
        context.save();
        context.globalCompositeOperation = "source-over";
        context.clearRect(0, 0, bitmap.width, bitmap.height);
        context.fillStyle = `rgba(${DARK_COLOR[0]},${DARK_COLOR[1]},${DARK_COLOR[2]},${tod.alpha})`;
        context.fillRect(0, 0, bitmap.width, bitmap.height);
        context.globalCompositeOperation = "destination-out";
        context.scale(k, k);
        for (const hole of visible) {
            const w = weightOf(hole.sprite);
            if (hole.shape === "circle") {
                const reach = hole.sprite._flicker ? hole.radius * hole.sprite._flicker.s : hole.radius;
                if (hole._blockers && hole._blockers.length) {
                    // with people in its light: the hole on its own canvas first, their shadows cut out of it, then out of the darkness
                    const cx = hole.sprite.x * k, cy = hole.sprite.y * k, rad = reach * k, size = Math.ceil(rad * 2) + 2;
                    const ox = cx - rad - 1, oy = cy - rad - 1, c = Sun.scratchCanvas(size, size);
                    punchCircleHole(c, cx - ox, cy - oy, rad, w, hole.soft);
                    Sun.cutLightShadows(c, hole._blockers, k, ox, oy);
                    context.save();
                    context.setTransform(1, 0, 0, 1, 0, 0);
                    context.globalCompositeOperation = "destination-out";
                    context.drawImage(c.canvas, ox, oy);
                    context.restore();
                    continue;
                }
                punchCircleHole(context, hole.sprite.x, hole.sprite.y, reach, w, hole.soft);
            } else {
                punchConeHole(context, hole.sprite.x, hole.sprite.y, hole.geom, w);
            }
        }
        if (this._playerTorch) {
            punchCircleHole(context, this._playerTorch.x, this._playerTorch.y, TORCH_RADIUS);
        }
        context.restore();
        bitmap._baseTexture.update();
        this.redrawGlows(visible);
    };

    // the people and animals in each visible light's way (hole._blockers; T.api("Sun") - ChoppableTree_Render.js): a lamp, a hearth, a
    // stove, a candle, a chandelier; not a window's beam nor a soft fill light
    Spriteset_Map.prototype.updateLightBlockers = function(visible) {
        const Sun = T.api("Sun"), things = Sun && Sun.lightBlockers && Sun.shadows ? Sun.occluders(this) : [];
        const th = $gameMap.tileHeight();
        for (const hole of visible) {
            hole._blockers = null;
            if (!things.length || hole.shape !== "circle" || hole.soft || weightOf(hole.sprite) < 0.05) continue;
            const s = hole.sprite, f = s._flicker, reach = f ? hole.radius * f.s : hole.radius;
            const light = { x: s.x, y: s.y, r: reach, gx: s.x, gy: s.y + th / 2, hf: s._lightHeight || 30, id: s._eventId };
            const list = Sun.lightBlockers(light, things, Graphics.frameCount, f ? f.k : 1);
            if (list.length) hole._blockers = list;
        }
    };

    // the glows of the visible lights, added together ("lighter") at half resolution, each as strong as the hour says
    Spriteset_Map.prototype.redrawGlows = function(visible) {
        if (!this._glowSprite) return;
        const bitmap = this._glowSprite.bitmap;
        const context = bitmap.context;
        const k = 1 / DARK_SCALE;
        context.save();
        context.clearRect(0, 0, bitmap.width, bitmap.height);
        context.globalCompositeOperation = "lighter";
        for (const hole of visible) {
            const s = hole.sprite, src = s.bitmap;
            if (!src || !src._canvas) continue;
            const f = s._flicker, sc = f && hole.shape === "circle" ? f.s : 1;   // (a flame's glow grows and shrinks with its reach)
            const w = src.width * sc, h = src.height * sc, x = (s.x - s.anchor.x * w) * k, y = (s.y - s.anchor.y * h) * k;
            const a = Math.max(0, Math.min(1, weightOf(s)));
            // with people in its light the glow goes on its own canvas first, their shadows cut out of it (no warm glow in a shadow)
            const shaded = hole._blockers && hole._blockers.length, Sun = shaded ? T.api("Sun") : null;
            const c = shaded ? Sun.scratchCanvas(Math.ceil(w * k) + 1, Math.ceil(h * k) + 1) : context, dx = shaded ? 0 : x, dy = shaded ? 0 : y;
            if (f && f.alt && s._altBitmap && s._altBitmap._canvas) {   // its colour drifting to the other one
                c.globalAlpha = a * (1 - f.c);
                c.drawImage(src._canvas, dx, dy, w * k, h * k);
                c.globalAlpha = a * f.c;
                c.drawImage(s._altBitmap._canvas, dx, dy, w * k, h * k);
            } else {
                c.globalAlpha = a;
                c.drawImage(src._canvas, dx, dy, w * k, h * k);
            }
            if (shaded) {
                Sun.cutLightShadows(c, hole._blockers, k, x, y);
                context.globalAlpha = 1;
                context.drawImage(c.canvas, x, y);
            }
        }
        context.restore();
        bitmap._baseTexture.update();
    };

    // the map's lights for other plugins: [{ shape, sprite, radius | geom, soft }] (read them, and sprite._gain to dim one)
    Spriteset_Map.prototype.roomLightHoles = function() {
        return this._roomHoles || [];
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        if (this._roomLightSprites) {
            // lights off the screen are not drawn; with <DarkDay> the hour sets the darkness and which lights shine
            this._roomTimeOfDay = timeOfDay();
            this._roomView = this.roomLightView();
            for (const light of this._roomLightSprites) {
                light.update();
                if (light.updateShown) light.updateShown(this._roomView, this._roomTimeOfDay);
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
