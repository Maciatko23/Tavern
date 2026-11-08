//=============================================================================
// Fullscreen.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Gra zawsze startuje w pełnym ekranie, obraz jest dopasowany do ekranu i ostry (bez rozmycia), F4 lub Alt+Enter przełącza okno. v1.0.0
 * @author Claude
 *
 * @param startFullscreen
 * @text Start w pełnym ekranie
 * @type boolean
 * @default true
 *
 * @param fullscreenInPlaytest
 * @text Pełny ekran także w teście z edytora
 * @desc Wyłącz, jeśli test z edytora ma otwierać się w oknie.
 * @type boolean
 * @default true
 *
 * @param crispPixels
 * @text Ostre piksele przy skalowaniu
 * @desc Skaluje obraz bez wygładzania, więc pixel art zostaje ostry (zamiast rozmytego) także przy skali 1.5x.
 * @type boolean
 * @default true
 *
 * @param hideCursor
 * @text Chowaj kursor myszy w pełnym ekranie
 * @desc Kursor znika po kilku sekundach bez ruchu myszą i wraca, gdy ją ruszysz.
 * @type boolean
 * @default true
 *
 * @param cursorDelay
 * @text Po ilu sekundach chować kursor
 * @type number
 * @decimals 1
 * @min 0.5
 * @default 2.5
 *
 * @help
 * ============================================================================
 * Fullscreen.js
 * ============================================================================
 * - Gra od razu startuje w pełnym ekranie (w przeglądarce po pierwszym
 *   kliknięciu lub naciśnięciu klawisza, bo przeglądarka nie pozwala inaczej).
 * - Obraz zawsze wypełnia ekran z zachowaniem proporcji 16:9; na innych
 *   ekranach (np. ultrapanoramicznych) po bokach są czarne pasy, nic się nie
 *   rozciąga.
 * - Piksele są skalowane ostro. Przy skali całkowitej (2x na 1440p, 3x na 4K)
 *   jest idealnie, przy 1.5x (Full HD) nadal ostrzej niż domyślnie.
 * - F4 lub Alt+Enter przełącza pełny ekran i okno. Po wyjściu z pełnego ekranu
 *   okno ma rozsądny rozmiar (dopasowany do ekranu, w proporcjach gry),
 *   zamiast ogromnego 2560x1440.
 * - W pełnym ekranie kursor myszy chowa się, gdy nią nie ruszasz.
 *
 * Wtyczka działa w NW.js (zwykła gra i test z edytora) oraz w przeglądarce.
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "Fullscreen";
    const params = PluginManager.parameters(pluginName);
    const START = params.startFullscreen !== "false";
    const IN_PLAYTEST = params.fullscreenInPlaytest !== "false";
    const CRISP = params.crispPixels !== "false";
    const HIDE_CURSOR = params.hideCursor !== "false";
    const CURSOR_DELAY = Math.max(0.5, Number(params.cursorDelay || 2.5)) * 1000;
    const WINDOW_SHARE = 0.92;   // the windowed size, as a share of the screen's work area

    const nwWindow = () => (Utils.isNwjs() && typeof nw === "object" ? nw.Window.get() : null);

    function isFullscreen() {
        const win = nwWindow();
        if (win) return !!win.isFullscreen;
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }

    function setFullscreen(on) {
        const win = nwWindow();
        if (win) {
            if (on) {
                win.enterFullscreen();
            } else {
                win.leaveFullscreen();
                fitWindowLater();
            }
            return;
        }
        const root = document.documentElement, quiet = result => result && result.catch && result.catch(() => {});
        if (on) {
            const request = root.requestFullscreen || root.webkitRequestFullscreen;
            if (request) quiet(request.call(root));   // a browser may refuse without a real click or key
        } else {
            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            if (exit) quiet(exit.call(document));
        }
    }

    // F4 (the engine's own key) goes through the same three hooks
    Graphics._isFullScreen = isFullscreen;
    Graphics._requestFullScreen = () => setFullscreen(true);
    Graphics._cancelFullScreen = () => setFullscreen(false);

    // Always fit the picture to the window or screen (the engine does that only in NW.js and on phones).
    Graphics._defaultStretchMode = () => true;

    // nearest-neighbour scaling keeps pixel art sharp
    const _updateCanvas = Graphics._updateCanvas;
    Graphics._updateCanvas = function() {
        _updateCanvas.call(this);
        if (this._canvas) this._canvas.style.imageRendering = CRISP ? "pixelated" : "auto";
    };

    // Alt+Enter, before the game's own key handling sees the Enter
    window.addEventListener("keydown", event => {
        if (event.altKey && (event.key === "Enter" || event.keyCode === 13)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            Graphics._switchFullScreen();
        }
    }, true);

    // ------------------------------------------------------------------
    // Window size when not fullscreen: fit the screen, keep the game's proportions.
    // (The engine sizes it to 2560x1440 with a screen scale of 2, which does not fit most screens.)
    // ------------------------------------------------------------------
    function fitWindow() {
        if (!Utils.isNwjs() || isFullscreen()) return;
        const scale = Math.min(screen.availWidth * WINDOW_SHARE / Graphics.width, screen.availHeight * WINDOW_SHARE / Graphics.height);
        const xDelta = Math.round(Graphics.width * scale) - window.innerWidth;
        const yDelta = Math.round(Graphics.height * scale) - window.innerHeight;
        window.moveBy(-xDelta / 2, -yDelta / 2);
        window.resizeBy(xDelta, yDelta);
    }
    // (NW.js restores its old bounds a little after leaving fullscreen, so the fit is applied twice)
    function fitWindowLater() {
        setTimeout(fitWindow, 250);
        setTimeout(fitWindow, 800);
    }
    Scene_Boot.prototype.adjustWindow = fitWindow;

    // ------------------------------------------------------------------
    // Start in fullscreen
    // ------------------------------------------------------------------
    const playtest = Utils.isNwjs() && Utils.isOptionValid("test");
    const wantFullscreen = START && (IN_PLAYTEST || !playtest);
    const win = nwWindow();
    if (win) {
        // leaving fullscreen gives back a window of the right size, not the huge starting one
        win.on("leave-fullscreen", fitWindowLater);
        if (wantFullscreen && !win.isFullscreen) win.enterFullscreen();
    } else if (wantFullscreen) {
        // a browser only allows fullscreen after a click or a key
        const once = () => {
            window.removeEventListener("pointerdown", once, true);
            window.removeEventListener("keydown", once, true);
            if (!isFullscreen()) setFullscreen(true);
        };
        window.addEventListener("pointerdown", once, true);
        window.addEventListener("keydown", once, true);
    }

    // ------------------------------------------------------------------
    // The mouse cursor hides after a while in fullscreen
    // ------------------------------------------------------------------
    if (HIDE_CURSOR) {
        let lastMove = Date.now();
        const setCursor = value => { document.documentElement.style.cursor = value; document.body && (document.body.style.cursor = value); };
        window.addEventListener("mousemove", () => {
            lastMove = Date.now();
            setCursor("");
        }, true);
        setInterval(() => {
            if (isFullscreen() && Date.now() - lastMove > CURSOR_DELAY) setCursor("none");
        }, 400);
    }

    window.FullscreenPlugin = { isFullscreen, setFullscreen, fitWindow };
})();
