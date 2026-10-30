// Tryb oglądania autopilota fabuły (tools/autopilot/ogladaj.js): pasek u góry ekranu i klawisze w oknie gry. Wstrzykiwany tylko
// w tym trybie, po fab.js - zwykła gra go nie ma.
//   F6 - pauza / wznowienie (gdy utknął: spróbuj dalej)    F7 - prędkość ×1 / ×2 / ×4    F8 - pokaż / schowaj pasek    Esc - koniec
// Pasek: co robi i po co, dzień i godzina, złoto i dług, prędkość. Czarno-żółty, jak interfejs gry (UITheme: #ffd23f na czerni).
(function() {
    "use strict";
    if (!window.FAB) return "brak fab.js";
    const old = document.getElementById("fab-pasek");
    if (old) old.remove();
    if (window.__fabKeys) window.removeEventListener("keydown", window.__fabKeys, true);
    if (window.__fabBarTimer) clearInterval(window.__fabBarTimer);

    const SPEEDS = [1, 2, 4];
    const css = document.createElement("style");
    css.id = "fab-pasek-css";
    css.textContent = `
        @font-face { font-family: "FabPasek"; src: url("fonts/AlegreyaSans-Medium.ttf"); }
        #fab-pasek { position: fixed; left: 50%; top: 6px; transform: translateX(-50%); z-index: 99999; pointer-events: none;
            max-width: min(1180px, calc(100vw - 32px)); box-sizing: border-box; padding: 6px 14px 7px; border-radius: 8px;
            background: rgba(8, 9, 11, 0.82); border: 1px solid #5c4c18; box-shadow: 0 2px 10px rgba(0,0,0,0.45);
            font-family: "FabPasek", "Alegreya Sans", Georgia, serif; color: #ece6da; font-size: 17px; line-height: 1.25;
            display: flex; flex-direction: column; gap: 2px; opacity: 0.93; transition: opacity 0.2s; }
        #fab-pasek.ukryty { display: none; }
        #fab-pasek .r1 { display: flex; gap: 10px; align-items: baseline; white-space: nowrap; overflow: hidden; }
        #fab-pasek .tag { color: #100e06; background: #ffd23f; border-radius: 4px; padding: 0 6px; font-size: 13px; letter-spacing: 0.04em; flex: none; }
        #fab-pasek .co { color: #ffd23f; overflow: hidden; text-overflow: ellipsis; }
        #fab-pasek .po { color: #b8b0a2; overflow: hidden; text-overflow: ellipsis; }
        #fab-pasek .r2 { display: flex; gap: 14px; font-size: 14px; color: #b8b0a2; white-space: nowrap; }
        #fab-pasek .r2 b { color: #ece6da; font-weight: normal; }
        #fab-pasek .klaw { margin-left: auto; color: #8a8478; }
        #fab-pasek.stoi { border-color: #ffd23f; }
        #fab-pasek .uwaga { color: #100e06; background: #ff8f5a; }`;
    if (!document.getElementById("fab-pasek-css")) document.head.appendChild(css);
    const bar = document.createElement("div");
    bar.id = "fab-pasek";
    bar.innerHTML = `<div class="r1"><span class="tag">AUTOPILOT</span><span class="co"></span><span class="po"></span></div>
        <div class="r2"><span class="dz"></span><span class="zl"></span><span class="sp"></span><span class="klaw">F6 pauza · F7 prędkość · F8 pasek · Esc koniec</span></div>`;
    document.body.appendChild(bar);
    const $ = s => bar.querySelector(s);
    const esc = s => String(s === undefined || s === null ? "" : s);

    function draw() {
        let st;
        try { st = FAB.status(); } catch (e) { return; }
        const tag = $(".tag");
        bar.classList.toggle("stoi", !!(st.paused || st.stuck));
        if (FAB.stuck && FAB.mode === "watch") {
            tag.textContent = "UTKNĄŁEM"; tag.classList.add("uwaga");
            $(".co").textContent = "utknąłem: " + esc(FAB.stuck.doing);
            $(".po").textContent = "F6 - spróbuj dalej · Esc - koniec";
        } else if (st.paused) {
            tag.textContent = "PAUZA"; tag.classList.remove("uwaga");
            $(".co").textContent = esc(st.doing);
            $(".po").textContent = "F6 - wznów";
        } else {
            tag.textContent = "AUTOPILOT"; tag.classList.remove("uwaga");
            $(".co").textContent = esc(st.doing);
            $(".po").textContent = st.why ? "– " + esc(st.why) : "";
        }
        $(".dz").innerHTML = "Dzień <b>" + st.day + "</b> " + esc(st.clock) + " · " + esc(st.mapName);
        const d = st.debt;
        $(".zl").innerHTML = "Złoto <b>" + st.gold + " G</b>" + (d ? d.done ? " · dług spłacony" : " · dług <b>" + d.paid + "/" + d.debt + " G</b>" + (d.daysLeft !== null ? " (" + d.daysLeft + " dni)" : "") : "");
        $(".sp").innerHTML = "Prędkość <b>×" + st.speed + "</b>";
    }
    window.__fabBarTimer = setInterval(draw, 250);
    draw();

    function pause(on) {
        FAB.paused = on;
        AP.paused = on;
        if (on && AP.lib) AP.lib.releaseAll();
    }
    // the keys: caught before the game (capture) - F6/F7/F8 the game does not use (F2 frames, F4 full screen, F9 debug); Esc is the
    // autopilot's only in this mode (the player does not play then)
    window.__fabKeys = function(ev) {
        const k = ev.key;
        if (k === "F6") {
            if (FAB.stuck) { FAB.stuck.handled = true; FAB.rep.stalls.push(Object.assign({}, FAB.stuck, { strategy: "gracz: F6 (spróbuj dalej)" })); FAB.stuck = null; FAB.lastKeyAt = null; pause(false); FAB.restart(); }
            else pause(!FAB.paused);
        } else if (k === "F7") {
            const i = SPEEDS.indexOf(FAB.speed);
            FAB.setSpeed(SPEEDS[(i + 1) % SPEEDS.length]);
        } else if (k === "F8") {
            bar.classList.toggle("ukryty");
        } else if (k === "Escape") {
            window.__fabQuit = true;
            pause(true);
        } else return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        draw();
    };
    window.addEventListener("keydown", window.__fabKeys, true);
    if (window.__fabKeysUp) window.removeEventListener("keyup", window.__fabKeysUp, true);
    window.__fabKeysUp = ev => { if (["F6", "F7", "F8", "Escape"].includes(ev.key)) { ev.preventDefault(); ev.stopImmediatePropagation(); } };
    window.addEventListener("keyup", window.__fabKeysUp, true);
    // stuck while watched: shown on the bar, the autopilot waits for F6 (or Esc)
    FAB.onStuck = function() { if (FAB.mode === "watch") pause(true); };
    return "pasek ok";
})();
