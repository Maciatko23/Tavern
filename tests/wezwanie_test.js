// Wezwanie króla (Story.js WEZ, docs/STORY.md, 2026-11-08): day 3 the king's messenger in grandpa's house, the butler's pledge, the
// letter to Szczepan, grandpa out of the door; the seal at dusk (the hero walked out to the yard, the Lord's sign, the door shut); the
// debt paid - the seal off, grandpa home two days later; the other way: away from home till day 5 - no goodbye, the letter under the door.
//   CDP_PORT=9554 node tests/wezwanie_test.js
"use strict";
const path = require("path");
const kit = require("./lib/kit.js");
const OUT = path.join(__dirname, "..", "docs", "wezwanie");
require("fs").mkdirSync(OUT, { recursive: true });

kit.test({ port: Number(process.env.CDP_PORT) || 9554, bootCheck: "gra", errorCheck: "bez błędów w konsoli" }, async t => {
    const z = () => t.json("(function(){ const s = Story.state(); return s && s.wez ? Object.assign({}, s.wez, { api: Story.wezwanie() }) : null; })()");
    const where = () => t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    const grandpaShown = () => t.eval("(function(){ const g = Story.npc('grandpa'); return !!g && !g._erased; })()");
    const rec = () => t.json("(function(){ const r = Watki.rekordy && Watki.rekordy(); const w = r && r.w ? r.w.wezwanie : null; return w ? { s: w.s, krok: w.krok } : null; })()");

    // ---------------------------------------------------------------- the summons at home
    t.check("nowa gra z fabułą (dom dziadka)", await t.newGame({ story: true, skipIntro: true, quiet: true, minimap: false }));
    let s = await z();
    t.check("nowa gra ma stan wezwania (wez), nic się jeszcze nie stało", !!s && !s.called && !s.api.sealed && !s.api.away, s);
    await t.setDay(2, 12); await t.frames(90);
    t.check("dzień 2: spokój (dziadek w domu, bez sceny)", !(await z()).called && (await grandpaShown()) && !(await t.eval("$gameMap.isEventRunning()")));
    await t.setDay(3, 8);
    t.check("dzień 3, 8:00 w domu: scena rusza", await t.until("Story.state().wez.called === 3 && $gameMap.isEventRunning()", 15));
    await t.until("!!$gameMap.event(3240) && $gameSelfSwitches.value([19, 3240, 'A'])", 15);
    await t.frames(90);
    await t.shot(path.join(OUT, "scena_poslaniec.png"));
    for (let i = 0; i < 6; i++) { await t.press("ok"); await t.frames(14); }
    await t.until("$gameSelfSwitches.value([19, 3241, 'A'])", 40, 100).then(async ok => { if (ok) { await t.frames(120); await t.shot(path.join(OUT, "scena_feliks.png")); } });
    await t.finish(160);
    s = await z();
    t.check("po scenie: list do Szczepana u bohatera, dziadek wyszedł (zniknął za drzwiami), pieczęć o 20:00", s.letter && s.gone && s.sealAt === 3 * 24 + 20 && !(await grandpaShown()), s);
    t.check("postacie sceny były w domu (posłaniec, kamerdyner, dwóch strażników)", await t.eval("[3240, 3241, 3242, 3243].every(id => !!$gameMap.event(id))"));
    t.check("posłaniec, kamerdyner i straż wyszli drzwiami (ukryci)", !(await t.eval("[3240, 3241, 3242, 3243].some(id => $gameSelfSwitches.value([19, id, 'A']))")));
    t.check("paski sceny zdjęte", !(await t.eval("!!$gameTemp._hudScene")));
    let r = await rec();
    t.check("w dzienniku wątek „Wezwanie króla”: krok drugi (list do Szczepana)", !!r && r.s === "active" && r.krok === 1, r);
    t.check("Story.wezwanie(): wezwany, dziadek daleko, list jest, jeszcze bez pieczęci", s.api.called === 3 && s.api.away && s.api.letter && !s.api.sealed, s.api);

    // ---------------------------------------------------------------- the seal at dusk
    await t.setHour(20);
    t.check("20:00 w domu: kamerdyner puka, bohater wychodzi na podwórze", await t.until("$gameMap.isEventRunning() || $gameMap.mapId() === 20", 10));
    await t.finish(10);
    t.check("na podwórzu (mapa 20) przed drzwiami", await t.until("$gameMap.mapId() === 20 && !SceneManager.isSceneChanging()", 15), await where());
    await t.frames(40);
    t.check("pieczęć: dom zapieczętowany, znak Lorda przy drzwiach", (await z()).api.sealed && (await t.eval("$gameSelfSwitches.value([20, 3244, 'A']) && !!$gameMap.event(3244)")));
    await t.shot(path.join(OUT, "pieczec_podworze.png"));
    await t.eval("window.__kit && (window.__kit.pops.length = 0); $gamePlayer.reserveTransfer(19, 9, 11, 8, 0); 0");
    await t.frames(40);
    t.check("drzwi zapieczętowanego domu się nie otwierają (popup o pieczęci)", (await t.eval("$gameMap.mapId()")) === 20 && (await t.popups()).some(p => /Pieczęć Lorda/.test(p)), await t.popups());

    // ---------------------------------------------------------------- the debt paid: the seal off, grandpa home two days later
    await t.eval("(function(){ const s = Story.state(); s.paid = s.debt; s.done = Tawerna.time.day(); return 0; })()");
    await t.frames(60);
    s = await z();
    t.check("dług spłacony: pieczęć zdjęta, dziadek wraca za dwa dni (10:00)", !!s.freed && s.backAt === (s.freed + 2) * 24 + 10 && !s.api.sealed && s.api.away, s);
    await t.frames(40);
    t.check("znak pieczęci zniknął", !(await t.eval("$gameSelfSwitches.value([20, 3244, 'A'])")));
    await t.setDay(s.freed + 2, 11);
    await t.eval("$gamePlayer.reserveTransfer(19, 9, 11, 8, 0); 0");
    t.check("dom znowu otwarty", await t.until("$gameMap.mapId() === 19 && !SceneManager.isSceneChanging()", 15));
    await t.frames(30);
    t.check("dziadek wrócił do domu", await grandpaShown() && !(await z()).api.away);

    // ---------------------------------------------------------------- no goodbye: away from home till day 5
    t.check("druga gra: z dala od domu", await t.newGame({ story: true, skipIntro: true, quiet: true, minimap: false }));
    await t.eval("$gamePlayer.reserveTransfer(3, 60, 30, 2, 0); 0");
    await t.until("$gameMap.mapId() === 3 && !SceneManager.isSceneChanging()", 15);
    await t.setDay(3, 9); await t.frames(60);
    s = await z();
    r = await rec();
    t.check("dzień 3 poza domem: posłaniec przejechał (wątek: wróć do domu), wezwania jeszcze nie ma", s.told && !s.called && !!r && r.s === "active" && r.krok === 0, { s, r });
    await t.setDay(5, 9); await t.frames(60);
    s = await z();
    t.check("dzień 5: dziadek odpłynął bez pożegnania, dom zapieczętowany, list pod drzwiami", s.called === 5 && s.gone && s.underDoor && !s.letter && s.api.sealed, s);
    await t.eval("$gamePlayer.reserveTransfer(20, 15, 9, 8, 0); 0");
    await t.until("$gameMap.mapId() === 20 && !SceneManager.isSceneChanging()", 15);
    t.check("na podwórzu: list spod drzwi czytany", await t.until("$gameMessage.isBusy() || Story.state().wez.letter", 10));
    await t.finish(10);
    s = await z();
    t.check("list przeczytany - jest u bohatera", s.letter && !s.underDoor, s);
    await t.shot(path.join(OUT, "list_pod_drzwiami.png"));
});
