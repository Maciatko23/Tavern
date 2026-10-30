//=============================================================================
// Historyjki_Data.js
//=============================================================================
// The illustrated stories of the ferry's travellers, the thrifty four (docs/PODROZNI.md 8.2, stage 7 - 2026-10-29) - the DATA; the
// player of the stories and the journal's tab "Wspomnienia": Historyjki.js, the words: js/teksty/historyjki.txt.
//   H1 "Olszynka, dzień poboru" - Urszula, after the first clue of D43
//   H2 "Pod Brzozową Wolą" - Tymon, once he trusts the hero (W16: tymonBrzozowa)
//   H3 "Biblioteka w Lipnicy" - Augustyn, once the list from the box is found (W15: gasparZdemaskowany)
//   H5 "Pieczęć" - the envoy's letter in the hero's hands (W14: the letter taken back from Albin)
// A story: boards (img/pictures/Hist_<id>_<n>.png, 1280x720 - a missing one: the sepia, the words still told), shots (a board, how long
// at least, a camera drifting from `cam[0]` to `cam[1]` - [centre x, centre y (0-1), zoom], the effects over it, the words
// "<id>.s<n>" of js/teksty/historyjki.txt), the moment it comes (`gdy`: a function, asked twice a second on the calm map; once a game).
// Load order: any place below Watki and TawernaCore (nothing else reads it); the tab waits for Journal.

/*:
 * @target MZ
 * @plugindesc [etap 7] Dane historyjek podróżnych: H1 Olszynka, H2 Pod Brzozową Wolą, H3 Biblioteka w Lipnicy, H5 Pieczęć (plansze, ujęcia, wyzwalacze). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 *
 * @help
 * ============================================================================
 * Historyjki_Data.js - dane czterech historyjek (docs/PODROZNI.md 8.2)
 * ============================================================================
 * Same dane: odtwarzacz i zakładka „Wspomnienia” to Historyjki.js, teksty
 * js/teksty/historyjki.txt, plansze img/pictures/Hist_<H1|H2|H3|H5>_<n>.png.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Historyjki_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");

    // ------------------------------------------------------------------ reading the game (each guarded: a missing plugin = not yet)
    const flags = () => { try { return (window.TownQuests && TownQuests.state().flags) || {}; } catch (e) { return {}; } };
    const d43Slady = () => { try { return Object.keys(PodroznicyData.watek.S().d43.slady || {}).length; } catch (e) { return 0; } };
    const w14List = () => { try { const s = window.Poselstwo && Poselstwo.stan(); return !!s && (s.list === "bohater" || s.list === "posel" || s.list === "lord" || s.oddany > 0); } catch (e) { return false; } };

    // ------------------------------------------------------------------ the stories
    // fx: "mist" (drifting fog), "rain", "embers" (rising sparks), "smoke", "dust", "candle" (a flicker over the whole board)
    const STORIES = [
        { id: "H1", boards: 1, music: null, gdy: () => d43Slady() >= 1,
          shots: [
              { board: 1, len: 330, cam: [[0.5, 0.55, 1.0], [0.45, 0.62, 1.12]], fx: ["mist"] },
              { board: 1, len: 300, cam: [[0.7, 0.62, 1.15], [0.35, 0.67, 1.15]], fx: ["mist", "dust"] },
              { board: 1, len: 330, cam: [[0.3, 0.62, 1.2], [0.2, 0.5, 1.0]], fx: ["mist"] },
              { board: 1, len: 330, cam: [[0.5, 0.62, 1.08], [0.55, 0.45, 1.0]], fx: ["mist"] }
          ] },
        { id: "H2", boards: 1, music: null, gdy: () => !!flags().tymonBrzozowa,
          shots: [
              { board: 1, len: 330, cam: [[0.75, 0.45, 1.0], [0.5, 0.62, 1.1]], fx: ["smoke", "embers"] },
              { board: 1, len: 330, cam: [[0.25, 0.67, 1.15], [0.45, 0.62, 1.15]], fx: ["smoke"] },
              { board: 1, len: 330, cam: [[0.5, 0.72, 1.2], [0.5, 0.5, 1.0]], fx: ["smoke", "embers"] }
          ] },
        { id: "H3", boards: 1, music: null, gdy: () => !!flags().gasparZdemaskowany,
          shots: [
              { board: 1, len: 330, cam: [[0.5, 0.5, 1.0], [0.4, 0.62, 1.12]], fx: ["rain", "candle"] },
              { board: 1, len: 330, cam: [[0.5, 0.62, 1.1], [0.55, 0.55, 1.0]], fx: ["embers", "candle"] },
              { board: 1, len: 330, cam: [[0.65, 0.62, 1.18], [0.5, 0.5, 1.0]], fx: ["rain"] }
          ] },
        { id: "H5", boards: 1, music: null, gdy: () => w14List(),
          shots: [
              { board: 1, len: 330, cam: [[0.5, 0.55, 1.0], [0.5, 0.62, 1.12]], fx: ["candle"] },
              { board: 1, len: 330, cam: [[0.8, 0.57, 1.25], [0.7, 0.62, 1.3]], fx: ["candle", "dust"] },
              { board: 1, len: 330, cam: [[0.3, 0.62, 1.15], [0.5, 0.5, 1.0]], fx: ["candle"] }
          ] }
    ];
    const LOOK = { W: 1280, H: 720, BAR: 56, caption: 170, perChar: 4.2, minLine: 150, hold: 72, fadeIn: 20, fadeOut: 16, pause: 24 };
    const SEPIA = ["#2b2118", "#463525", "#1a130d"];
    const TX = Watki.teksty("historyjki");

    window.HistoryjkiData = { TAB: "Wspomnienia", STORIES, LOOK, SEPIA, TX };
})();
