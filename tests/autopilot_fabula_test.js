// Autopilot fabuły (2026-10-28, prośba gracza: „czy mamy autopilota, który przechodzi grę od początku do końca?”): gra sama od nowej
// gry (tytuł, prolog pominięty klawiszem P, dom dziadka) jak gracz - prawdziwe przejścia, rozmowy, wybory klawiszami, jedzenie, picie,
// sen, zmiany u Borgara (mini-gra grana klawiszami), spłata długu z zarobionych pieniędzy. Bez setDay, teleportów i dosypywania złota.
// Mózg w stronie: tests/autopilot_fabula/fab.js (na tests/autopilot/ap.js), graf map: tests/autopilot_fabula/graf.js.
// Raport: tests/autopilot_fabula/raport.md (oś dni, złoto vs dług, czas na rozdział, śmierci, wybory, utknięcia ze zrzutami,
// niejasności celu, mielenie). Punkty kontrolne (zapisy po rozdziałach): tests/autopilot_fabula/zapisy/<nazwa>.json.
// Poza smoke i full (SKIP_FULL w tests/run.js) - tylko na życzenie:
//   node tests/run.js autopilot_fabula_test --port 9751 --timeout 10800   (sam test kończy po --minuty, domyślnie 150)
//   node tests/autopilot_fabula_test.js [--od po_rozdziale1] [--szybkosc 10] [--etap 3] [--minuty 115] [--dni 200] [--bez-obejsc]
//   (to samo zmiennymi: AUTOPILOT_OD, AUTOPILOT_SZYBKOSC, AUTOPILOT_ETAP, AUTOPILOT_MINUTY, AUTOPILOT_DNI, AUTOPILOT_TAG; przez run.js
//   opcje TYLKO zmiennymi - run.js sam zjada --od, a resztę bierze za nazwy testów; wprost port zmienną: CDP_PORT=9751 node tests/...)
"use strict";
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
const { build: buildGraph } = require("./autopilot_fabula/graf.js");

const OUT = path.join(__dirname, "autopilot_fabula");
const SAVES = path.join(OUT, "zapisy");
const arg = (name, def) => {
    const i = process.argv.indexOf("--" + name);
    if (i >= 0 && process.argv[i + 1] !== undefined) return process.argv[i + 1];
    const e = process.env["AUTOPILOT_" + name.toUpperCase()];
    return e !== undefined && e !== "" ? e : def;
};
const OD = arg("od", "");
const SPEED = Number(arg("szybkosc", 10));
const ETAP = Number(arg("etap", 3));
const MAX_MIN = Number(arg("minuty", 150));
// (a run from a checkpoint writes its own report: raport_od_<zapis>.md; from a new game: raport.md)
const TAG = (OD ? "_od_" + OD.replace(/\.json$/, "") : "") + (arg("tag", "") ? "_" + arg("tag", "") : "");   // (--tag x: a run of its own files)
const MAX_DAY = Number(arg("dni", 200));
// --bez-obejsc: no workarounds for the map faults (the loose brick in the tavern's wall) - the run stops there as a player would
const NOFIX = process.argv.includes("--bez-obejsc") || !!process.env.AUTOPILOT_BEZ_OBEJSC;
const T0 = Date.now();
const mins = () => Math.round((Date.now() - T0) / 6000) / 10;

kit.test({ port: 9751, bootCheck: "gra się uruchamia", errorCheck: false, evalTimeout: 60000 }, async t => {
    const J = e => t.json(e);
    fs.mkdirSync(SAVES, { recursive: true });
    for (const f of fs.readdirSync(OUT)) if (f.startsWith("utkniecie" + TAG + "_") && /_\d+\.png$/.test(f)) fs.unlinkSync(path.join(OUT, f));
    const keyRaw = async (type, code, id, key) => t.b.send("Input.dispatchKeyEvent", { type, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, code: id, key });
    const keyMs = async (code, id, key, ms) => { await keyRaw("rawKeyDown", code, id, key); await t.wait(ms || 80); await keyRaw("keyUp", code, id, key); await t.wait(120); };
    let rep0 = null;

    // ============================================================ 0. start: nowa gra od tytułu (prolog pominięty: P przytrzymane) albo zapis
    if (OD) {
        const file = path.join(SAVES, OD.replace(/\.json$/, "") + ".json");
        if (!fs.existsSync(file)) throw new Error("nie ma zapisu " + file);
        const fx = JSON.parse(fs.readFileSync(file, "utf8"));
        rep0 = fx.rep || null;
        const ok = await t.loadFixture(fx, { slot: 1 });
        t.check("start z zapisu „" + OD + "” (" + (fx.summary ? "dzień " + fx.summary.day + ", mapa " + fx.summary.map : "?") + ")", ok);
    } else {
        const titleReady = "(SceneManager._scene instanceof Scene_Title && window.TitleScreen && TitleScreen.info() && TitleScreen.info().open && TitleScreen.info().active)";
        const onName = "(window.Prologue && Prologue.info() && Prologue.info().screen === 'name')";
        const onFilm = "(window.Prologue && Prologue.info() && Prologue.info().screen === 'film')";
        await t.until(titleReady, 30);
        await t.frames(20);
        // (a profile with saves stands on „Kontynuuj”: the arrows to „Nowa gra” first)
        for (let i = 0; i < 6 && (await t.eval("TitleScreen.info() && TitleScreen.info().symbol")) !== "newGame"; i++) await keyMs(38, "ArrowUp", "ArrowUp", 60);
        await keyMs(79, "KeyO", "o");   // „Nowa gra”
        const named = await t.until(onName, 15);
        let film = false;
        for (let i = 0; i < 4 && !film; i++) { await t.frames(30); await t.key("Enter"); film = await t.until(onFilm, 6); }   // (puste pole = „Reid”)
        // the film skipped as a player does: P held (~1.2 s = the whole prologue)
        let landed = false;
        for (let i = 0; i < 6 && !landed; i++) {
            await keyRaw("rawKeyDown", 80, "KeyP", "p");
            await t.wait(2600);
            await keyRaw("keyUp", 80, "KeyP", "p");
            landed = await t.until(t.onMap(19), 8);
        }
        const run = await J("window.Prologue ? Prologue.lastRun : null");
        t.check("prolog: „Nowa gra” → imię (puste = Reid) → film pominięty klawiszem P → dom dziadka (Map019)", named && film && landed,
            { named, film, landed, skippedAll: run && run.all, scenes: run && run.log });
        if (!landed) return;
    }
    await t.eval("$gameSystem._minimapHidden = true; 0");

    // ============================================================ 1. autopilot do strony
    await t.eval("window.FAB_GRAPH = " + JSON.stringify(buildGraph()) + "; 0");
    await t.eval(fs.readFileSync(path.join(__dirname, "autopilot", "ap.js"), "utf8"));
    const v = await t.eval(fs.readFileSync(path.join(OUT, "fab.js"), "utf8"));
    if (rep0) await t.eval("FAB.rep = " + JSON.stringify(rep0) + "; 0");
    await t.eval(`FAB.start({ mode: "test", speed: ${SPEED}, mapFixes: ${!NOFIX} }); FAB.setSpeed(${SPEED}); 0`);
    t.check("autopilot fabuły w stronie (" + v + "), szybkość ×" + SPEED, /^ok|same/.test(String(v)), v);

    // ============================================================ 2. gra; strażnik po stronie Node: utknięcia, zapisy po rozdziałach, limity
    const STRATS = [
        { name: "od nowa (mózg zaczyna od nowa)", js: "FAB.restart()" },
        { name: "odejdź kawałek i od nowa", js: "FAB.unstickWalk ? FAB.unstickWalk() : FAB.restart()" },
        { name: "wczytaj ostatni zapis", js: "FAB.reloadLatest()" }
    ];
    let stallN = 0, stratI = 0, lastStallAt = -1e9, stopWhy = "", lastDay = -1, lastStage = "", lastSave = Date.now();
    const saved = new Set(rep0 && rep0.savedCheckpoints || []);
    const checkpoint = async (name, desc) => {
        if (saved.has(name)) return;
        saved.add(name);
        try {
            await t.eval("FAB.rep.savedCheckpoints = " + JSON.stringify([...saved]) + "; 0");
            const r = await t.saveFixture("__autopilot_tmp", { slot: 2, desc });
            const fx = JSON.parse(fs.readFileSync(r.file, "utf8"));
            fs.unlinkSync(r.file);
            fx.name = name;
            fx.rep = await J("FAB.rep");
            fs.writeFileSync(path.join(SAVES, name + ".json"), JSON.stringify(fx));
            console.log("  zapis kontrolny: " + name + " (" + Math.round(fs.statSync(path.join(SAVES, name + ".json")).size / 1024) + " kB)");
        } catch (e) { console.log("  zapis kontrolny " + name + " nieudany: " + e.message); }
    };
    console.log("autopilot: start " + (OD || "nowa gra") + ", ×" + SPEED + ", do etapu " + ETAP + ", najwyżej " + MAX_MIN + " min");
    for (;;) {
        await t.wait(3000);
        let s;
        try { s = await J("Object.assign(FAB.status(), { scene: SceneManager._scene && SceneManager._scene.constructor.name, err: (document.getElementById('errorPrinter') || {}).innerText || '', done1: !!FAB.done1, done2a: !!FAB.done2a, done2: !!FAB.done2, done3: !!FAB.done3, blocked3: FAB.done3blocked ? FAB.stop3 : null, deepest: window.Underground ? Underground.deepest() : 0, stuckObj: FAB.stuck, stallHandled: FAB.stallHandled || 0 })"); }
        catch (e) { stopWhy = "strona nie odpowiada: " + e.message; break; }
        if (s.err) { stopWhy = "błąd gry: " + s.err.slice(0, 200); await t.shot(path.join(OUT, "blad_gry" + TAG + ".png")); break; }
        if (s.day !== lastDay) {
            lastDay = s.day;
            console.log(`  dzień ${s.day} ${s.clock} · ${s.stage} · złoto ${s.gold}` + (s.debt ? ` · spłacone ${s.debt.paid}/${s.debt.debt}` : "") + ` · zmiany ${s.shifts} · zgony ${s.deaths} · ${mins()} min`);
        }
        if (s.stage !== lastStage) { lastStage = s.stage; console.log("  >> " + s.stage + " (dzień " + s.day + " " + s.clock + ", " + mins() + " min)"); }
        if (Date.now() - lastSave > 60000) { lastSave = Date.now(); try { fs.writeFileSync(path.join(OUT, "stan" + TAG + ".json"), JSON.stringify(await J("FAB.rep"))); } catch (e) {} }
        try {
        // checkpoints
        if (s.done1) await checkpoint("po_rozdziale1", "dług spłacony (etap 1)");
        if (s.done1 && ETAP <= 1) { stopWhy = "etap 1 zakończony (rozdział 1: dług spłacony)"; break; }
        if (s.done2a) await checkpoint("po_w4", "W4: krata otwarta, hasło Borgara");
        if (s.deepest >= 10) await checkpoint("po_pietrze10", "podziemia: piętro 10 (strażnik)");
        if (s.deepest >= 30) await checkpoint("po_pietrze30", "podziemia: piętro 30");
        if (s.deepest >= 50) await checkpoint("po_pietrze50", "podziemia: piętro 50");
        if (s.done2) await checkpoint("po_akcie3", "Akt III rozstrzygnięty (etap 2)");
        if (s.done2 && ETAP <= 2) { stopWhy = "etap 2 zakończony (Akt III)"; break; }
        if (s.done3) { stopWhy = "etap 3 zakończony (zakończenie gry)"; break; }
        if (s.blocked3) { stopWhy = "etap 3 zablokowany: " + s.blocked3; break; }
        // stuck
        if (s.stuckObj && !s.stuckObj.handled) {
            stallN++;
            const shot = "utkniecie" + TAG + "_" + stallN + ".png";
            await t.shot(path.join(OUT, shot));
            const sameSpot = s.stuckObj.at - lastStallAt < 48;
            stratI = sameSpot ? stratI + 1 : 0;
            lastStallAt = s.stuckObj.at;
            const st = STRATS[stratI];
            const info = Object.assign({}, s.stuckObj, { n: stallN, shot, strategy: st ? st.name : "stop", real: mins() });
            await t.eval("FAB.rep.stalls.push(" + JSON.stringify(info) + "); if (FAB.stuck) FAB.stuck.handled = true; FAB.stuck = null; FAB.lastKeyAt = null; 0");
            console.log(`  UTKNIĘCIE ${stallN}: ${s.stuckObj.doing} (dzień ${s.stuckObj.day} ${s.stuckObj.clock}, ${s.stuckObj.mapName}) - ${st ? st.name : "stop"}`);
            if (!st) { stopWhy = "utknął i obejścia nie pomogły: " + s.stuckObj.doing; break; }
            try { await t.eval("(async function(){ return " + st.js + "; })()"); } catch (e) { console.log("  obejście nieudane: " + e.message); }
        }
        } catch (e) { console.log("  błąd strażnika testu (gra dalej): " + e.message); }
        if (mins() >= MAX_MIN) { stopWhy = "limit czasu (" + MAX_MIN + " min)"; break; }
        if (s.day > MAX_DAY) { stopWhy = "limit dni gry (" + MAX_DAY + ")"; break; }
        if (s.debt && !s.debt.done && s.debt.daysLeft !== null && s.debt.daysLeft < 0 && s.debt.left > 0) { stopWhy = "termin minął, dług niespłacony"; }
    }
    console.log("koniec: " + stopWhy);

    // ============================================================ 3. raport
    await t.shot(path.join(OUT, "koniec" + TAG + ".png")).catch(() => null);
    const fin = await J("({ rep: FAB.rep, st: FAB.status(), log: FAB.log.slice(-60), tracked: FAB.trackedInfo(), talk: FAB.talkLog.slice(-20) })").catch(e => ({ fail: e.message }));
    if (fin.fail) { console.log("raport: strona nie odpowiada: " + fin.fail); return; }
    fs.writeFileSync(path.join(OUT, "stan" + TAG + ".json"), JSON.stringify(fin.rep));
    const md = require("./autopilot_fabula/raport.js").write(fin, { od: OD, speed: SPEED, etap: ETAP, stopWhy, realMin: mins() });
    fs.writeFileSync(path.join(OUT, "raport" + TAG + ".md"), md);
    console.log("raport: tests/autopilot_fabula/raport" + TAG + ".md");
    const st = fin.st, rep = fin.rep;
    const paidDay = (rep.payments || []).filter(p => p.paid >= 2500)[0];
    t.check("rozdział 1: dług 2500 G spłacony uczciwie do dnia 60 (zarobione na zmianach)", st.debt && st.debt.done && (paidDay ? paidDay.day <= 60 : !!OD),
        { spłacone: st.debt && st.debt.paid, dzień: paidDay && paidDay.day, zmiany: rep.shifts.length, zgony: rep.deaths.length });
    if (ETAP >= 2 || OD) t.check("etap 2: W4 (klucz, krata, hasło) → piętro 10 → piętro 50 → Akt III", !!(await J("!!FAB.done2")), { w4: await J("!!FAB.done2a"), najgłębiej: await J("window.Underground ? Underground.deepest() : 0"), akt3: await J("window.Act3 ? Act3.phase() : null") });
    if (ETAP >= 3) t.check("etap 3: Księga sygnałów (W2) → Komnata Serca → zakończenie", !!(await J("!!FAB.done3")), await J("({ w2: window.TownQuests ? TownQuests.rec('W2') : null, ending: window.Underground ? Underground.state().ending : null })"));
    t.check("bez błędów gry (ekran błędu)", !/błąd gry/.test(stopWhy), stopWhy);
});
