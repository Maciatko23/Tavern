// The marathon (2026-09-26, the user: "większość błędów wyszła dopiero przy długim graniu autopilotem - czy można coś z tym zrobić?"):
// the autopilot (tests/autopilot/ap.js) plays a NEW game for DAYS game days, the game run several updates a frame (SPEED - the same
// rules, just faster), with everything on (needs, animals, birds, weather). A guard watches it the whole time and notes every problem
// with the game time and a screenshot of the first one of its kind:
//   the game's error screen; the hero standing still for long outside rest and sleep (and the autopilot's own "stoi od minuty");
//   the dog hurt longer than a day, or not moving for long outside its kennel; an animal hunting or charging but not moving;
//   hunger or thirst at 0 for hours; positions that are not numbers.
// Every ~2 game days, at a random moment (also in the middle of work), the game is saved and loaded again (what froze the game once).
// At the end: tests/marathon/raport.md (days played, buildings, level, deaths, the problems) and the screenshots beside it.
// Run: node marathon_test.js [days] [speed]    (defaults 5 days, speed 4). Needs the local game server (port 8765).
const { launch, sleep } = require("./cdp.js");
const { notify } = require("./notify.js");   // (to the phone, when tests/marathon/notify.json is there)
const fs = require("fs"), path = require("path");
const DAYS = Number(process.argv[2]) || 5, SPEED = Number(process.argv[3]) || 4;
const OUT = path.join(__dirname, "marathon");
(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    for (const f of fs.readdirSync(OUT)) if (/^problem_.*\.png$/.test(f)) fs.unlinkSync(path.join(OUT, f));
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout")), 60000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const t0 = Date.now();
    let report = null;
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 26, 17, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); $gameSystem._minimapHidden = true; 0");
        await ev(fs.readFileSync(path.join(__dirname, "autopilot", "ap.js"), "utf8"));
        // ---- the speed: several updates of the game per drawn frame (input read each time, the picture drawn once)
        await ev(`(function(){
            const N = ${SPEED}, orig = SceneManager.determineRepeatNumber;
            SceneManager.determineRepeatNumber = function(dt) { return orig.call(this, dt) * N; };   // (MZ draws once after the updates)
            return 0; })()`);
        // ---- the guard (in the page): problems into __MG.problems
        await ev(`(function(){
            const clock = () => $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour();
            const at = () => "dzień " + $gameSystem.dayNightDay() + " " + Math.floor($gameSystem.dayNightHour()) + ":" + String(Math.floor(($gameSystem.dayNightHour() % 1) * 60)).padStart(2, "0");
            const M = window.__MG = { problems: [], seen: {}, hero: null, dog: null, animals: new Map(), needs0: null, saves: 0, loads: 0, nextSave: clock() + 30 + Math.random() * 30, apSet: new Set(), deaths: 0, lastNow: clock() };
            const note = (type, info) => { const key = type + "|" + (info.key || ""); if (M.seen[key] && clock() - M.seen[key] < 12) return; M.seen[key] = clock(); M.problems.push({ type, at: at(), info }); };
            const finite = (...v) => v.every(n => typeof n === "number" && isFinite(n));
            M.check = function() {
                const sc = SceneManager._scene, onMap = sc && sc.constructor.name === "Scene_Map" && !SceneManager.isSceneChanging();
                const err = (document.getElementById("errorPrinter") || {}).innerText || "";
                if (err && !M.errNoted) { M.errNoted = true; note("błąd gry", { text: err.slice(0, 300) }); }
                if (sc && sc.constructor.name === "Scene_Gameover" && !M.over) {   // (killed: the run ends here)
                    M.over = true; M.deaths++;
                    note("bohater zginął - koniec gry", { task: window.AP && AP.curName, hp: $gameParty.leader() && $gameParty.leader().hp, log: ((window.AP && AP.log) || []).slice(-4) });
                }
                if (!onMap) return;
                const now = clock(), p = $gamePlayer;
                // time jumped (a night's sleep, a rest an hour a second): the "still for long" clocks start again
                if (now - M.lastNow > 0.5 || now < M.lastNow) { M.hero = null; M.dog = null; M.animals = new Map(); M.needs0 = null; }
                M.lastNow = now;
                // the autopilot's own words: "stoi od minuty", errors it caught (its log is cut short: read by the text, each line once)
                for (const l of (window.AP && AP.log) || []) {
                    if (M.apSet.has(l)) continue;
                    M.apSet.add(l);
                    if (/stoi od minuty/.test(l)) note("autopilot stał", { text: l });
                    if (/błąd|Error|TypeError|Maximum call/.test(l)) note("błąd autopilota", { text: l });
                }
                if (M.apSet.size > 3000) M.apSet = new Set(Array.from(M.apSet).slice(-1000));
                if (!finite(p._realX, p._realY)) note("pozycja bohatera nie jest liczbą", {});
                // the hero: still for 3 game hours outside rest, sleep and menus
                const resting = !!p._toolSwing || !!$gameTemp._farmMenuOpen || $gameMessage.isBusy();
                if (!M.hero || Math.hypot(M.hero.x - p._realX, M.hero.y - p._realY) > 0.5 || resting) M.hero = { x: p._realX, y: p._realY, t: now };
                else if (now - M.hero.t > 3) { note("bohater stoi", { key: Math.round(p._realX) + "," + Math.round(p._realY), pos: [p.x, p.y], task: window.AP && AP.curName }); M.hero.t = now; }
                // the hero's life
                const hp = $gameParty.leader() ? $gameParty.leader().hp : 1;
                if (hp <= 0 && !M.dead) { M.dead = true; M.deaths++; note("bohater padł", { task: window.AP && AP.curName }); }
                if (hp > 0) M.dead = false;
                // hunger and thirst at 0 for 6 hours
                if (window.Needs && Needs.enabled && Needs.enabled()) {
                    const n = Needs.state(), zero = n.food <= 0.5 || n.water <= 0.5;
                    if (!zero) M.needs0 = null; else if (M.needs0 === null) M.needs0 = now; else if (now - M.needs0 > 6) { note("głód/pragnienie na zero od 6 godzin", { food: Math.round(n.food), water: Math.round(n.water) }); M.needs0 = now; }
                }
                // the dog
                if (window.Dog && Dog.state && Dog.state().tame) {
                    const d = Dog.state(), g = Dog.dog;
                    if (d.hurtUntil > 0 && d.hurtUntil - now > 24.5) note("pies ranny dłużej niż dobę", { until: d.hurtUntil, now });
                    if (d.hurtUntil > 0) { M.dogHurt = M.dogHurt || now; if (now - M.dogHurt > 30) { note("pies nie zdrowieje (30 godz.)", {}); M.dogHurt = now; } } else M.dogHurt = null;
                    if (g && d.map === $gameMap.mapId()) {
                        if (!finite(g._realX, g._realY)) note("pozycja psa nie jest liczbą", {});
                        const still = g._pose === "sleep" || g._pose === "rest" || g._pose === "hurt" || d.mode === "stay";
                        if (!M.dog || Math.hypot(M.dog.x - g._realX, M.dog.y - g._realY) > 0.5 || still) M.dog = { x: g._realX, y: g._realY, t: now };
                        else if (now - M.dog.t > 3) { note("pies utknął", { key: g.x + "," + g.y, pos: [g.x, g.y], task: g._task && g._task.kind }); M.dog.t = now; }
                    }
                }
                // animals after him that do not move
                if (window.Hunting && Hunting.animals) {
                    for (const a of Hunting.animals) {
                        if (!a || a._dead) continue;
                        if (!finite(a._realX, a._realY)) { note("pozycja zwierzęcia nie jest liczbą", { kind: a.kind() }); continue; }
                        const busy = ["stalk", "charge", "hunt", "chase", "alert"].includes(a._mode);
                        const r = M.animals.get(a);
                        if (!r || !busy || Math.hypot(r.x - a._realX, r.y - a._realY) > 0.5) M.animals.set(a, { x: a._realX, y: a._realY, t: now });
                        else if (now - r.t > 0.5) { note("zwierzę utknęło", { key: a.kind() + a._mode, kind: a.kind(), mode: a._mode, pos: [a.x, a.y] }); r.t = now; }
                    }
                }
                // a save and a load at a random moment, about every 2 game days
                if (now >= M.nextSave && !M.saving) {
                    M.saving = true; M.nextSave = now + 36 + Math.random() * 24;
                    $gameSystem.onBeforeSave();
                    DataManager.saveGame(3).then(() => { M.saves++; return DataManager.loadGame(3); }).then(() => {
                        M.loads++;
                        $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), 0);
                        $gamePlayer.requestMapReload();
                        SceneManager.goto(Scene_Map);
                        if (window.AP) { AP.stop(); AP.wantPlay = true; AP.queue = [["play"]]; }
                        M.hero = null; M.dog = null; M.animals = new Map();
                        M.saving = false;
                    }).catch(e => { note("zapis/wczytanie nieudane", { text: String(e && e.message || e) }); M.saving = false; });
                }
            };
            M.timer = setInterval(() => { try { M.check(); } catch (e) { note("strażnik: wyjątek", { text: String(e && e.message) }); } }, 500);
            return 0; })()`);
        await ev(`Needs.setEnabled(true); AP.run([["play"]]); 0`);
        // ---- play, watch
        const day0 = await ev("$gameSystem.dayNightDay()");
        let shotTypes = new Set(), lastDay = day0, stallAt = Date.now(), lastFrame = 0;
        console.log(`marathon: ${DAYS} days at x${SPEED}, from day ${day0}`);
        notify(`Maraton start: ${DAYS} dni gry, x${SPEED}, od dnia ${day0}`, { title: "Tawerna - maraton", tags: ["runner"] });
        while (true) {
            await sleep(5000);
            const s = await J(`({ day: $gameSystem.dayNightDay(), hour: +$gameSystem.dayNightHour().toFixed(1), f: Graphics.frameCount, problems: __MG.problems, over: !!__MG.over, err: (document.getElementById("errorPrinter") || {}).innerText || "" })`).catch(e => ({ fail: e.message }));
            if (s.fail) { console.log("page not answering:", s.fail); break; }
            for (const p of s.problems) {
                if (shotTypes.has(p.type)) continue;
                shotTypes.add(p.type);
                const r = await b.send("Page.captureScreenshot", { format: "png" });
                const file = "problem_" + (shotTypes.size) + ".png";
                fs.writeFileSync(path.join(OUT, file), Buffer.from(r.data, "base64"));
                p.shot = file;
                await ev(`(function(){ const q = __MG.problems.find(q => q.type === ${JSON.stringify(p.type)} && !q.shot); if (q) q.shot = ${JSON.stringify(file)}; return 0; })()`);
                console.log("  problem:", p.type, p.at, JSON.stringify(p.info).slice(0, 200));
                notify(`Problem: ${p.type} (${p.at})`, { title: "Tawerna - maraton", tags: ["warning"], priority: 4, file: path.join(OUT, file) });
            }
            if (s.day !== lastDay) {
                console.log(`  day ${s.day} (${Math.round((Date.now() - t0) / 60000)} min)`); lastDay = s.day;
                const st = await J(`({ bld: ((Farming.farm().buildings || {})[3] || []).filter(b => !b.site).length, lvl: window.Combat && Combat.hero ? Combat.hero().level : 0, deaths: __MG.deaths, n: __MG.problems.length })`).catch(() => null);
                if (st) notify(`Dzień ${s.day}/${day0 + DAYS} · budynki ${st.bld} · poziom ${st.lvl} · problemy ${st.n} · ${Math.round((Date.now() - t0) / 60000)} min`, { title: "Tawerna - maraton", tags: ["calendar"], priority: 2 });
            }
            if (s.f !== lastFrame) { lastFrame = s.f; stallAt = Date.now(); } else if (Date.now() - stallAt > 60000) { console.log("the game stopped (no frames for a minute)"); break; }
            if (s.err) { console.log("the game's error:", s.err.slice(0, 200)); await sleep(1000); break; }
            if (s.over) { console.log("the hero was killed - Game Over"); break; }
            if (s.day - day0 >= DAYS) break;
        }
        // ---- the report
        report = await J(`({ day: $gameSystem.dayNightDay(), hour: +$gameSystem.dayNightHour().toFixed(1), problems: __MG.problems, saves: __MG.saves, loads: __MG.loads, deaths: __MG.deaths,
            level: window.Combat && Combat.hero ? Combat.hero().level : 0,
            buildings: ((Farming.farm().buildings || {})[3] || []).filter(b => !b.site).map(b => b.type),
            dog: window.Dog ? { tame: Dog.state().tame, hp: Math.round(Dog.state().hp), food: Math.round(Dog.state().food), water: Math.round(Dog.state().water) } : null,
            needs: window.Needs ? { food: Math.round(Needs.state().food), water: Math.round(Needs.state().water) } : null,
            apLog: (window.AP && AP.log || []).slice(-15) })`).catch(e => ({ fail: e.message }));
    } catch (e) { console.log("ERR", e.message); report = report || { fail: e.message }; }
    const r = await b.send("Page.captureScreenshot", { format: "png" }).catch(() => null);
    if (r) fs.writeFileSync(path.join(OUT, "koniec.png"), Buffer.from(r.data, "base64"));
    const mins = Math.round((Date.now() - t0) / 60000);
    const lines = ["# Maraton autopilota", "", `Data: ${new Date().toISOString().slice(0, 16).replace("T", " ")} · ${DAYS} dni gry · przyspieszenie x${SPEED} · ${mins} min`, ""];
    if (!report || report.fail) lines.push("Nie udało się: " + (report && report.fail));
    else {
        const counts = {};
        for (const b of report.buildings) counts[b] = (counts[b] || 0) + 1;
        lines.push(`Koniec: dzień ${report.day}, ${report.hour}:00 · poziom ${report.level} · padł: ${report.deaths} razy · zapisy/wczytania: ${report.saves}/${report.loads}`);
        lines.push(`Budynki (${report.buildings.length}): ` + Object.entries(counts).map(([k, n]) => k + (n > 1 ? " ×" + n : "")).join(", "));
        if (report.needs) lines.push(`Na koniec: jedzenie ${report.needs.food}, woda ${report.needs.water}` + (report.dog && report.dog.tame ? ` · pies: życie ${report.dog.hp}, jedzenie ${report.dog.food}, woda ${report.dog.water}` : ""));
        lines.push("", `## Problemy (${report.problems.length})`, "");
        if (!report.problems.length) lines.push("Brak.");
        for (const p of report.problems) lines.push(`- **${p.type}** (${p.at})` + (p.shot ? ` - zrzut ${p.shot}` : "") + ` - ${JSON.stringify(p.info).slice(0, 240)}`);
        lines.push("", "## Ostatnie wpisy autopilota", "", ...report.apLog.map(l => "    " + l));
    }
    fs.writeFileSync(path.join(OUT, "raport.md"), lines.join("\n"));
    const nProblems = report && report.problems ? report.problems.length : "?";
    await notify(report && !report.fail ? `Koniec maratonu: dzień ${report.day}, poziom ${report.level}, budynki ${report.buildings.length}, śmierci ${report.deaths}, problemy ${nProblems}, ${mins} min`
        : `Maraton przerwany: ${report && report.fail}`, { title: "Tawerna - maraton", tags: [nProblems === 0 ? "white_check_mark" : "warning"], priority: 4, file: path.join(OUT, "koniec.png") });
    console.log(lines.slice(0, 12).join("\n"));
    console.log(`problems: ${report && report.problems ? report.problems.length : "?"} (report: tests/marathon/raport.md)`);
    await b.close();
    process.exit(0);
})();
