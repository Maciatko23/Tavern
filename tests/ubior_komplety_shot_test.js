// Cały ekwipunek z PixelLab na bohaterze (2026-11-17, docs/ekwipunek/PLAN_BRON_ZBROJE.md sekcja 9): zrzuty z mapy kompletów (zbroje
// wszystkich rodzin kształtów, ubrania, pasy, płaszcz, czapki, tarcze na lewym przedramieniu) w pozach: 4 kierunki, chód (dół, prawo),
// cios mieczem (prawo, dół), siedzi. Wycinki wokół bohatera do docs/ekwipunek/mapa/zrzuty/ (+ pozycje.json); zestawienia składa
// tools/ubior/zloz_komplety.py.
// Uruchom: node tests/run.js ubior_komplety_shot --port 9483
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
const OUT = path.join(__dirname, "..", "docs", "ekwipunek", "mapa", "zrzuty");
const NONE = { glowa: "", tors: "", nogi: "", stopy: "", pas: "", rece: "", plecy: "", plaszcz: "" };
const SETS = [
    ["zelazny", { glowa: "helm_nosal_zelazo", tors: "zbroja_kolczuga_zelazo", rece: "karwasze_zelazo", nogi: "nagolenniki_zelazo", stopy: "buty_okute_zelazo" }, "tarcza_drewniana"],
    ["skorzany", { glowa: "helm_otwarty_skora", tors: "zbroja_skorznia_skora", rece: "karwasze_skora", nogi: "nagolenniki_skora", stopy: "buty_brazowe" }, "tarcza_puklerz"],
    ["pikowany", { glowa: "helm_czepiec_len", tors: "zbroja_przeszywanica_len", rece: "karwasze_len", nogi: "nagolenniki_len", stopy: "buty_filcowe" }, ""],
    ["stalowy", { glowa: "helm_otwarty_stal", tors: "zbroja_napiersnik_stal", rece: "karwasze_stal", nogi: "nagolenniki_stal", stopy: "buty_okute_stal" }, "tarcza_zelazna"],
    ["brygantyna", { glowa: "helm_kapalin_zelazo", tors: "zbroja_brygantyna_stal", rece: "rekawice_brazowe", nogi: "spodnie_welniane_brazowe", stopy: "buty_czarne" }, "tarcza_migdalowa"],
    ["zakonny", { glowa: "helm_zakonny_zakon", tors: "zbroja_luska_zakon", rece: "karwasze_zakon", nogi: "nagolenniki_zakon", stopy: "buty_okute_zakon", plaszcz: "plaszcz_zakonny" }, "tarcza_zakonna"],
    ["braz", { glowa: "helm_kapalin_braz", tors: "zbroja_kolczuga_stal", rece: "karwasze_braz", nogi: "nagolenniki_braz", stopy: "buty_okute_braz" }, "tarcza_umbo"],
    ["chlop", { glowa: "kapelusz_slomkowy", tors: "koszula_lniana_biala", pas: "pas_skorzany_braz", nogi: "spodnie_plocienne_szare", stopy: "lapcie" }, ""],
    ["mieszczanin", { glowa: "czapka_filc_braz", tors: "kaftan_czerwony", nogi: "spodnie_welniane_zielone", stopy: "buty_brazowe", rece: "rekawice_szare", plaszcz: "plaszcz_zwiadowcy" }, ""],
    ["odswietny", { glowa: "chusta_czerwona", tors: "koszula_odswietna", pas: "pas_sakiewka", nogi: "spodnie_plocienne_niebieskie", stopy: "buty_czarne" }, ""],
    // (2026-11-17: the new things of Ubior_Data.js 284-299 and Bron_Data.js 419-451)
    ["kozuszek", { glowa: "kapelusz_filcowy", tors: "kozuszek", nogi: "portki_latane", stopy: "chodaki", rece: "rekawiczki_welniane", pas: "pas_tragarza", plaszcz: "plaszcz_lniany" }, "tarcza_drewniana_plecionka"],
    ["zupan", { glowa: "czapka_filc_szara", tors: "zupan_sukienny", pas: "pas_okuty_braz", stopy: "buty_czarne", plaszcz: "plaszcz_futrzany" }, "tarcza_okuta_krab"],
    ["kowal", { glowa: "opaska_braz", tors: "fartuch_kowalski", nogi: "spodnie_skorzane_czarne", stopy: "buty_filcowe", rece: "rekawice_brazowe", pas: "pas_ladownica" }, "tarcza_migdalowa_pawez"],
    ["garnczkowy", { glowa: "helm_garnczkowy_stal", tors: "zbroja_brygantyna_zelazo", rece: "karwasze_skora_czarna", nogi: "nagolenniki_skora", stopy: "buty_okute_braz", plaszcz: "plaszcz_welniany" }, "tarcza_drewniana_skora"],
    ["sukno", { glowa: "helm_kaptur_welna", tors: "zbroja_przeszywanica_welna", rece: "karwasze_len", nogi: "nagolenniki_len", stopy: "buty_okute_zelazo" }, "tarcza_puklerz_braz"]
];
const CLIP = { left: 56, up: 100, w: 112, h: 112 };
kit.test({ port: 9483, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    const J = e => t.json(e);
    fs.mkdirSync(OUT, { recursive: true });
    await t.newGame({ map: 218, x: 30, y: 21, dir: 2, hour: 12, quiet: true, minimap: false });
    await t.eval("if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); $gameParty.gainItem($dataItems[305], 1); try { Combat.setHand('m305'); } catch (e) {} $gameSystem.setStamina(100); 0");
    await t.eval("(function(){ $gameScreen.clearWeather(); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); return 0; })()");
    const look = () => J(`(function(){ const p = $gamePlayer, s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === p);
        const g = s.getGlobalPosition(); return { x: g.x, y: g.y }; })()`);
    const clip = async file => {
        const at = await look();
        const r = await t.b.send("Page.captureScreenshot", { format: "png", clip: { x: at.x - CLIP.left, y: at.y - CLIP.up, width: CLIP.w, height: CLIP.h, scale: 1 } });
        fs.writeFileSync(path.join(OUT, file), Buffer.from(r.data, "base64"));
        return file;
    };
    const out = [];
    let dressed = 0, shielded = 0;
    for (const [name, set, shield] of SETS) {
        await t.setHour(12);   // (sitting rests: an hour a second - every set at noon)
        await t.eval(`Ubior.set(${JSON.stringify(Object.assign({}, NONE, set))}); UbiorBron.shield(${JSON.stringify(shield || null)}); 0`);
        const ok = await t.until(`Ubior.liveKey("Hero_Walk") === Ubior.key() && Ubior.sheet("Hero_Walk").isReady()`, 30, 50);
        if (ok) dressed++;
        if (shield && await t.eval(`(Ubior.liveFullKey("Hero_Walk") || "").indexOf("#tarcza") >= 0`)) shielded++;
        const shots = [];
        const pose = async n => shots.push({ n, f: await clip(name + "_" + n + ".png") });
        await t.eval("$gamePlayer.locate(30, 21); $gamePlayer.center(30, 21); 0"); await t.frames(10);
        for (const [d, n] of [[2, "dol"], [6, "prawo"], [8, "gora"], [4, "lewo"]]) { await t.eval(`$gamePlayer.setDirection(${d}); 0`); await t.frames(20); await pose(n); }
        await t.eval("$gamePlayer.setDirection(2); Input._currentState.down = true; 0"); await t.frames(14); await pose("chod"); await t.eval("Input._currentState.down = false; 0");
        await t.frames(20);
        await t.eval("$gamePlayer.locate(30, 21); $gamePlayer.center(30, 21); $gamePlayer.setDirection(4); Input._currentState.right = true; 0"); await t.frames(14); await pose("chod_prawo");
        await t.eval("Input._currentState.right = false; 0"); await t.frames(20);
        await t.eval("$gamePlayer.locate(30, 21); $gamePlayer.center(30, 21); $gamePlayer.setDirection(6); $gameSystem.setStamina(100); 0"); await t.frames(10);
        await t.key("Tab"); await t.frames(10);
        await t.eval("Input._currentState.keyO = true; 0"); await t.frames(9); await pose("cios"); await t.eval("Input._currentState.keyO = false; 0");
        await t.frames(40);
        await t.eval("$gamePlayer.setDirection(2); 0"); await t.frames(4);
        await t.eval("Input._currentState.keyO = true; 0"); await t.frames(9); await pose("cios_dol"); await t.eval("Input._currentState.keyO = false; 0");
        await t.frames(40); await t.key("Tab"); await t.frames(10);
        await t.eval("$gamePlayer.locate(30, 21); $gamePlayer.center(30, 21); $gamePlayer.setDirection(2); $gameSystem.setStamina(30); 0"); await t.key("Z"); await t.frames(70); await pose("siedzi");
        await t.hold("down", 4); await t.frames(100);
        out.push({ name, set, shield, shots });
    }
    await t.eval("Ubior.set(null); UbiorBron.shield(null); 0");
    const stats = await J("Ubior.stats().map(s => s.ms)");
    fs.writeFileSync(path.join(OUT, "pozycje.json"), JSON.stringify({ sets: out, worst: Math.max(...stats) }, null, 1));
    t.check("komplety ubrane (" + dressed + "/" + SETS.length + ")", dressed === SETS.length);
    t.check("tarcza na przedramieniu w kompletach z tarczą (" + shielded + ")", shielded === SETS.filter(s => s[2]).length);
    t.check("zrzuty: po 9 póz", out.every(o => o.shots.length === 9), out.map(o => o.shots.length));
    t.check("składanie: każdy arkusz poniżej 60 ms (" + Math.max(...stats) + ")", Math.max(...stats) < 60, stats.slice(-10));
});
