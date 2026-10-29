// Zrzuty „jeden wygląd” (docs/UI_JEDEN_WYGLAD.md) do docs/ui_jeden_wyglad/<etap>_<ujęcie>.png - te same ujęcia przed i po zmianie.
//   CDP_PORT=9731 node tools/ui_jeden_wyglad/zrzuty.js przed [ujęcie...]
//   CDP_PORT=9731 node tools/ui_jeden_wyglad/zrzuty.js po [ujęcie...]
// Ujęcia: hud_dzien, hud_noc, walka, poziom, budowa, wiadomosc, wybor, menu_* (postac, ekwipunek, umiejetnosci, drzewko, plecak,
// dziennik, mapa, opcje, zapis, wyjdz), skrzynia, sklep, tablica, podsumowanie, kosci, kosci_gra, tytul, wczytaj, opcje_tytul, imie. Zapis tests/fixtures/day40_farm, godz. 11.
// Wygląd taki, jaki gracz ma bez zmienionych ustawień (przed zmianą: domyślny „Grafit”).
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "ui_jeden_wyglad");
const stage = process.argv[2] === "po" ? "po" : "przed";
const want = process.argv.slice(3);
const on = name => !want.length || want.some(w => name === w || (w.endsWith("*") && name.startsWith(w.slice(0, -1))));

const SETUP = `(function(){
    if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather();
    $gameSystem.setDayNightHour(11.02);
    if (window.Needs && Needs.setEnabled) Needs.setEnabled(true);
    const N = window.Needs && Needs.state ? Needs.state() : null; if (N) { N.food = 64; N.water = 41; }
    const a = $gameParty.leader(); a.setHp(Math.round(a.mhp * 0.78));
    if ($gameSystem.setStamina) $gameSystem.setStamina(70);
    if (window.Combat && Combat.setCombatMode) Combat.setCombatMode(false);
    $gamePlayer.locate(27, 9); $gamePlayer.setDirection(2); $gamePlayer.center(27, 9);
    if (window.Hunting) Hunting.auto(false);
    if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); }
    if (window.Birds && Birds.auto) Birds.auto(false);
    window.dispatchEvent(new Event("pointerdown"));
    return 0; })()`;

kit.test({ port: 9731, errorCheck: false }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    t.check("zapis wczytany", await t.loadFixture("day40_farm", {}));
    await t.eval(SETUP);
    await t.frames(240);   // (the map's name and the welcome go away)
    const shot = async name => { const f = await t.shot(path.join(OUT, stage + "_" + name + ".png")); console.log("SHOT", path.basename(f)); };
    const onMap = () => t.until(t.onMap(), 20);
    const info = () => t.json("window.MenuRing && MenuRing.info ? MenuRing.info() : null");

    if (on("hud_dzien")) {
        await t.eval(`(function(){ const give = (id, n) => $gameParty.gainItem($dataItems[id], n); give(61, 6); give(64, 4); give(77, 8); return 0; })()`);
        await t.frames(60);
        await shot("hud_dzien");
    }
    if (on("hud_noc")) {
        await t.eval("$gameSystem.setDayNightHour(22.5); 0");
        await t.frames(90);
        await shot("hud_noc");
        await t.eval("$gameSystem.setDayNightHour(11.02); 0");
        await t.frames(60);
    }
    if (on("walka")) {
        await t.eval(`(function(){ Combat.setCombatMode(true); const p = $gamePlayer, a = Hunting.spawn("boar", p.x + 2, p.y + 1); a._frozen = true; a._engaged = true; window.__boar = a;
            if (Combat.feel && Combat.feel.setTarget) Combat.feel.setTarget(a); if (Combat.spendBreath) Combat.spendBreath(35); return 0; })()`);
        await t.frames(40);
        await shot("walka");
        await t.eval("(function(){ if (window.__boar) Hunting.removeAnimal(window.__boar); Combat.setCombatMode(false); if (Combat.feel) Combat.feel.setTarget(null); return 0; })()");
        await t.frames(30);
    }
    if (on("poziom")) {
        await t.eval("(function(){ const h = Combat.hero(); Combat.gainXp(Combat.xpToNext(h.level) - h.xp + 1, 'próba'); return 0; })()");
        await t.frames(40);
        await shot("poziom");
        await t.frames(300);
    }
    if (on("budowa")) {
        await t.key("Q");
        await t.frames(40);
        await shot("budowa");
        await t.key("Escape");
        await t.frames(20);
    }
    if (on("wiadomosc") || on("wybor")) {
        await t.run(t.cmd.text(["People3", 4], ["Słyszałem, że chcesz odbudować tę starą karczmę.", "Ciężka to będzie praca, ale da się."])
            .concat(t.cmd.text(null, ["Co odpowiesz?"]), t.cmd.choice(["Dam radę", "Zobaczymy", "Nie twoja sprawa"]), t.cmd.end()));
        await t.until("$gameMessage.isBusy() && SceneManager._scene._messageWindow.openness >= 255 && SceneManager._scene._messageWindow.pause", 15);
        await t.frames(20);
        if (on("wiadomosc")) await shot("wiadomosc");
        for (let i = 0; i < 6 && !(await t.eval("!!(SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active)")); i++) {
            if (await t.eval("SceneManager._scene._messageWindow.pause")) await t.press("ok");
            await t.frames(30);
        }
        await t.until("!!(SceneManager._scene._choiceListWindow && SceneManager._scene._choiceListWindow.active && SceneManager._scene._choiceListWindow.openness >= 255)", 10);
        await t.key("S");
        await t.frames(30);
        if (on("wybor")) await shot("wybor");
        await t.finish();
        await t.frames(20);
    }
    if (on("menu_*")) {
        await t.key("P");
        await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
        await t.frames(50);
        const tabs = [["hero", "postac"], ["equip", "ekwipunek"], ["skills", "umiejetnosci"], ["item", "plecak"], ["journal", "dziennik"], ["mapa", "mapa"],
            ["options", "opcje"], ["save", "zapis"], ["gameEnd", "wyjdz"]];
        for (const [sym, name] of tabs) {
            let m = await info();
            for (let i = 0; i < 12 && m && m.active !== sym; i++) { await t.key("D"); await t.frames(10); m = await info(); }
            await t.frames(20);
            if (on("menu_" + name)) await shot("menu_" + name);
            if (sym === "skills" && on("menu_drzewko")) {
                await t.key("O"); await t.frames(20);
                await shot("menu_drzewko");
                await t.key("P"); await t.frames(20);
            }
            if (sym === "item" && on("menu_plecak_karta")) {
                await t.key("O"); await t.frames(20);
                await shot("menu_plecak_karta");
                await t.key("P"); await t.frames(20);
            }
        }
        await t.eval("SceneManager.goto(Scene_Map); 0");
        await onMap();
        await t.frames(40);
    }
    // other screens over the map: a chest, the tailor's shop, the quest board, the day's summary
    const scene = async (name, js, cls) => {
        await t.eval(`(function(){ ${js}; return 0; })()`);
        const ok = await t.until(`SceneManager._scene && SceneManager._scene.constructor.name === "${cls}" && !SceneManager.isSceneChanging()`, 15);
        await t.frames(50);
        if (ok) await shot(name); else console.log("NOTE " + name + ": no " + cls);
        await t.eval("SceneManager.goto(Scene_Map); 0");
        await onMap();
        await t.frames(30);
    };
    if (on("skrzynia")) await scene("skrzynia", "const F = Farming.farm(), all = Object.values(F.buildings).reduce((a, l) => a.concat(l || []), []), b = all.find(x => !x.site && /chest/.test(x.type)); if (b) Farming.openChest(b)", "Scene_Chest");
    if (on("sklep")) await scene("sklep", "Ubior_Sklepy.otworz('szwaczka', 'kup', 0)", "Scene_UbiorSklep");
    if (on("tablica")) await scene("tablica", "QuestBoard.open()", "Scene_QuestBoard");
    if (on("podsumowanie")) await scene("podsumowanie", "SceneManager.push(Journal.Scene_DaySummary); SceneManager.prepareNextScene(Journal.buildSummary(Journal.data().day || {}, 39))", "Scene_DaySummary");
    if (on("kosci") || on("kosci_gra")) {
        await t.eval("TavernDice.start({ seed: 3 }); 0");
        await t.until("SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_TavernDice' && !SceneManager.isSceneChanging()", 20);
        await t.frames(60);
        if (on("kosci")) await shot("kosci");
        await t.key("O");
        await t.frames(80);
        if (on("kosci_gra")) await shot("kosci_gra");
        await t.eval("SceneManager.goto(Scene_Map); 0");
        await onMap();
        await t.frames(30);
    }
    if (on("tytul") || on("wczytaj") || on("opcje_tytul") || on("imie")) {
        await t.saveTo(1);
        await t.toTitle();
        await t.frames(90);
        if (on("tytul")) await shot("tytul");
        if (on("wczytaj")) {
            await t.eval("SceneManager.push(Scene_Load); 0");
            await t.until("SceneManager._scene instanceof Scene_Load && !SceneManager.isSceneChanging()", 15);
            await t.frames(40);
            await shot("wczytaj");
            await t.eval("SceneManager.goto(Scene_Title); 0");
            await t.until("SceneManager._scene instanceof Scene_Title && !SceneManager.isSceneChanging()", 15);
        }
        if (on("opcje_tytul")) {
            await t.eval("SceneManager.push(Scene_Options); 0");
            await t.until("SceneManager._scene instanceof Scene_Options && !SceneManager.isSceneChanging()", 15);
            await t.frames(40);
            await shot("opcje_tytul");
            await t.eval("SceneManager.goto(Scene_Title); 0");
            await t.until("SceneManager._scene instanceof Scene_Title && !SceneManager.isSceneChanging()", 15);
        }
        if (on("imie") && (await t.eval("!!(window.Prologue && Prologue.Scene_HeroName)"))) {
            await t.eval("SceneManager.goto(Prologue.Scene_HeroName); 0");
            await t.until("SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_HeroName' && !SceneManager.isSceneChanging()", 15);
            await t.frames(60);
            await shot("imie");
        }
    }
    t.check("zrzuty", true);
});
