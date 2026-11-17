// Pilot nowego ekwipunku (2026-11-17): zrzuty bohatera w komplecie żelaznym - stare warstwy PixelLab (październik) i nowy, dokładniejszy
// stan „Komplet zelazny” (pliki *Z2, gra ich jeszcze nie używa: tu podmienione na chwilę w Ubior.PL / PL_HELM). Zapisuje pełne zrzuty
// i pozycje bohatera do docs/ekwipunek/pilot/zrzuty/ (tools składa z nich porównanie).
// Uruchom: node tests/run.js pilot_zbroja_shot --port 9478
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
const OUT = path.join(__dirname, "..", "docs", "ekwipunek", "pilot", "zrzuty");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    fs.mkdirSync(OUT, { recursive: true });
    await t.newGame({ map: 218, x: 30, y: 21, dir: 2, hour: 12, quiet: true, minimap: false });
    await t.eval("if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); [[353],[362],[368],[372],[346],[305],[378]].forEach(([id]) => $gameParty.gainItem($dataItems[id], 1)); 0");
    // the iron set on: torso, hands, legs, feet, head; the sword in hand, the kite shield
    const eq = await J(`(function(){ const out = {}; for (const [s, id] of [["torso",353],["hands",362],["legs",368],["feet",372],["head",346],["left",378]]) { try { out[s] = Equipment.equip(s, id); } catch (e) { out[s] = "ERR " + e.message; } }
        try { out.hand = Combat.setHand("m305"); } catch (e) { out.hand = "ERR"; } $gameSystem.setStamina(100); return out; })()`);
    const OLD = await J(`({ kol: Ubior.PL.kolczuga.plik, kar: JSON.stringify(Ubior.PL.karwasze), nag: Ubior.PL.nagolenniki.plik, but: Ubior.PL.buty_okute.plik, nos: JSON.stringify(Ubior.PL_HELM.nosal) })`);
    const poses = [];
    async function shoot(tag) {
        const shots = [];
        const pos = async n => { const p = await J("({ x: $gamePlayer.screenX(), y: $gamePlayer.screenY() })"); const f = path.join(OUT, tag + "_" + n + ".png"); await t.shot(f); shots.push({ n, f, x: p.x, y: p.y }); };
        await t.eval("$gamePlayer.locate(30, 21); $gamePlayer.center(30, 21); 0"); await t.frames(10);
        for (const [d, n] of [[2, "dol"], [6, "prawo"], [8, "gora"], [4, "lewo"]]) { await t.eval(`$gamePlayer.setDirection(${d}); 0`); await t.frames(20); await pos(n); }
        await t.eval("$gamePlayer.setDirection(2); 0");
        await t.eval("Input._currentState.down = true; 0"); await t.frames(14); await pos("chod"); await t.eval("Input._currentState.down = false; 0");
        await t.frames(30);
        await t.eval("$gamePlayer.locate(30, 21); $gamePlayer.center(30, 21); $gamePlayer.setDirection(6); 0"); await t.frames(10);
        await t.key("Tab"); await t.frames(10);
        await t.eval("Input._currentState.keyO = true; 0"); await t.frames(9); await pos("cios"); await t.eval("Input._currentState.keyO = false; 0");
        await t.frames(40); await t.key("Tab"); await t.frames(10);
        await t.eval("$gamePlayer.setDirection(2); $gameSystem.setStamina(30); 0"); await t.key("Z"); await t.frames(70); await pos("siedzi");
        await t.hold("down", 4); await t.frames(120);
        poses.push({ tag, shots });
    }
    await shoot("stary");
    // the new layers (Z2) in place of the old for this run only
    await t.eval(`(function(){ const P = Ubior.PL, H = Ubior.PL_HELM;
        P.kolczuga.plik = "KolczugaZ2"; P.nagolenniki.plik = "NagolennikiZ2"; P.buty_okute.plik = "ButyZ2";
        Object.assign(P.karwasze, { plik: "KarwaszeZ2", natywny: "zelazo", glowny: "szary", lo: 0.149, hi: 0.809, reszta: "natywny" });
        Object.assign(H.nosal, { plik: "SpangenZ2", w: 24, h: 24, anchor: [11, 3] });
        Ubior.PICTURES.helmpl_nosal.file = "Ubior_HelmPL_SpangenZ2"; Ubior.PICTURES.helmpl_nosal.w = 24; Ubior.PICTURES.helmpl_nosal.h = 24; Ubior.PICTURES.helmpl_nosal.anchor = [11, 3]; Ubior.PICTURES.helmpl_nosal.cut = 24;
        Ubior.clear(); return 0; })()`);
    await t.frames(60);
    await shoot("nowy");
    fs.writeFileSync(path.join(OUT, "pozycje.json"), JSON.stringify({ eq, OLD, poses }, null, 1));
    t.check("komplet założony (tors, ręce, nogi, stopy, głowa, tarcza, miecz)", Object.values(eq).every(v => v === true || v === undefined || (typeof v !== "string")), eq);
    t.check("zrzuty: stary i nowy wygląd, po 7 póz", poses.length === 2 && poses.every(p => p.shots.length === 7), poses.map(p => p.shots.length));
});
