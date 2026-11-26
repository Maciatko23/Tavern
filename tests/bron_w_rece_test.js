// (2026-11-25) the weapon in hand on the walk, the run and the sneak (Ubior_Bron.js HELD, tools/ubior/bron_w_rece.py): in the combat
// mode with a melee weapon it is seen in his hand standing, walking, running; out of the combat mode (and with the fists) it is not.
// Run: CDP_PORT=9764 node tests/bron_w_rece_test.js   (pictures: tests/bron_w_rece/)
const path = require("path");
const { launch, sleep } = require("./cdp.js");
const OUT = path.join(__dirname, "bron_w_rece");
require("fs").mkdirSync(OUT, { recursive: true });
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(218, 27, 26, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===218").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev(`(function(){ SceneManager._scene.startFadeIn(1,false); if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); if (window.Hunting) Hunting.auto(false); if (window.Humans) Humans.auto(false);
            $gameSystem.setDayNightHour(11); if (Combat.feel && Combat.feel.auto) Combat.feel.auto(false); return 0; })()`);
        const swordId = await ev(`(function(){ const D = window.Bron_Data; const p = D && D.PRZEDMIOTY ? D.PRZEDMIOTY.find(p => p.rodzaj === "miecz" && /zelazo/.test(p.material || p.wyglad || "")) || D.PRZEDMIOTY.find(p => p.rodzaj === "miecz") : null; return p ? p.id : 0; })()`);
        const spearId = 154;
        const key = () => ev("Ubior.sheetKey('Hero_Walk')");
        const settle = async () => { for (let i = 0; i < 80 && (await ev("Ubior.dressing('Hero_Walk') || Ubior.dressing('Hero_Run')")); i++) await frames(2); await frames(4); };
        const walk = async (dirKey, n) => { await ev(`Input._currentState["${dirKey}"] = true; 0`); await frames(n); };
        const stop = async () => { await ev(`for (const k of ["left","right","up","down","shift"]) Input._currentState[k] = false; 0`); await frames(6); };
        const shotAt = async file => { await b.shot(path.join(OUT, file)); };

        // 1. out of the combat mode: nothing in hand
        await ev(`$gameParty.gainItem($dataItems[60], 1); ${swordId ? `$gameParty.gainItem($dataItems[${swordId}], 1);` : ""} $gameParty.gainItem($dataItems[${spearId}], 1); Combat.setHand("m60"); Combat.setCombatMode(false); 0`);
        await settle();
        const k0 = await key();
        check("out of the combat mode: no weapon on the walking sheet", !/bron/.test(k0), k0);
        // 2. the combat mode, the stone axe: on the walk sheet, standing and walking
        await ev("Combat.setCombatMode(true); 0");
        await frames(2);
        await settle();
        const k1 = await key();
        check("the combat mode, the stone axe in hand: the walking sheet carries it (bron_siekiera_kamien)", /bron_siekiera_kamien/.test(k1), k1);
        await shotAt("siekiera_stoi.png");
        await walk("left", 14); await shotAt("siekiera_w_lewo.png"); await stop();
        await walk("up", 14); await shotAt("siekiera_w_gore.png"); await stop();
        await walk("right", 14); await shotAt("siekiera_w_prawo.png"); await stop();
        await walk("down", 14); await shotAt("siekiera_w_dol.png"); await stop();
        // 3. the sword, the spear, running
        if (swordId) {
            await ev(`Combat.setHand("m${swordId}"); 0`);
            await frames(2); await settle();
            const k2 = await key();
            check("a sword in hand: the walking sheet carries the sword", /bron_miecz/.test(k2), k2);
            await ev(`Input._currentState.shift = true; 0`);
            await walk("right", 16); await settle(); await shotAt("miecz_bieg_w_prawo.png");
            const run = await J(`(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer), bm = s && s.bitmap;
                return { key: Ubior.sheetKey("Hero_Run"), dressing: Ubior.dressing("Hero_Run"), all: Ubior.dressing(), sheet: bm && bm._ubior, dressed: !!(bm && bm._ubiorDressed), name: $gamePlayer.characterName(),
                    pic: !!Ubior.pictureOf("Ubior_Bron_Run_Miecz") }; })()`);
            check("running with the sword: the run sheet carries it and is dressed", /bron_miecz/.test(run.key) && run.sheet === "Hero_Run" && run.dressed && !run.dressing, run);
            await stop();
            await walk("down", 12); await shotAt("miecz_w_dol.png"); await stop();
        }
        await ev(`Combat.setHand("m${spearId}"); 0`);
        await frames(2); await settle();
        const k3 = await key();
        check("the stone spear in hand: the walking sheet carries it (bron_wlocznia_kamien)", /bron_wlocznia/.test(k3), k3);
        await walk("left", 12); await shotAt("wlocznia_w_lewo.png"); await stop();
        await walk("up", 12); await shotAt("wlocznia_w_gore.png"); await stop();
        // 3b. (2026-11-26) the lit torch in one hand, the sword in the other: the torch sheets carry the sword
        if (swordId) {
            await ev(`Combat.setHand("m${swordId}"); $gameParty.gainItem($dataItems[59], 1); Torch.light(); 0`);
            await frames(4);
            for (let i = 0; i < 80 && (await ev("Ubior.dressing('Hero_TorchWalk')")); i++) await frames(2);
            const tk = await J(`({ lit: Torch.isLit(), hand: Combat.hand(), key: Ubior.sheetKey("Hero_TorchWalk") })`);
            check("a lit torch and the sword: the torch's walking sheet carries the sword in the other hand", tk.lit && /bron_miecz/.test(tk.key), tk);
            await walk("down", 12); await shotAt("pochodnia_miecz_w_dol.png"); await stop();
            await walk("right", 12); await shotAt("pochodnia_miecz_w_prawo.png"); await stop();
            await ev("Torch.douse && Torch.douse(); 0");
            await frames(4);
        }
        // 4. the fists: nothing
        await ev(`Combat.setHand("m0"); 0`);
        await frames(2); await settle();
        const k4 = await key();
        check("bare fists in the combat mode: nothing drawn in hand", !/bron/.test(k4), k4);
        const err = await ev("(document.getElementById('errorPrinter') || {}).innerText || ''");
        check("no game error", !err, err.slice(0, 200));
    } catch (e) { console.log("FAIL test crashed: " + e.message); results.push(false); }
    finally {
        console.log(results.filter(Boolean).length + "/" + results.length + " passed");
        await b.close();
        process.exit(results.every(Boolean) ? 0 : 1);
    }
})();
