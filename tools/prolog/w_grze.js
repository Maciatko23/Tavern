// Prolog w grze: zrzuty docs/prolog/w_grze_*.png (ekran imienia, sceny filmu, dom dziadka) i klatki sztormu do GIF-a.
//   CDP_PORT=9470 node tools/prolog/w_grze.js [szybko]
"use strict";
const fs = require("fs");
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const DOCS = path.join(__dirname, "..", "..", "docs", "prolog");
const FR = path.join(__dirname, "klatki");
const FAST = process.argv.includes("szybko");

kit.test({ port: Number(process.env.CDP_PORT) || 9470, errorCheck: false }, async t => {
    const info = () => t.json("window.Prologue ? Prologue.info() : null");
    const typeKey = async ch => {
        await t.b.send("Input.dispatchKeyEvent", { type: "keyDown", key: ch, text: ch, unmodifiedText: ch });
        await t.b.send("Input.dispatchKeyEvent", { type: "keyUp", key: ch });
        await t.frames(3);
    };
    await t.until("TitleScreen.info() && TitleScreen.info().open && TitleScreen.info().active", 20);
    await t.frames(30);
    await t.key("O");
    await t.until("Prologue.info() && Prologue.info().screen === 'name'", 15);
    await t.frames(40);
    for (const ch of "Łukasz") await typeKey(ch);
    await t.frames(20);
    if (!FAST) await t.shot(path.join(DOCS, "w_grze_1_imie.png"));
    console.log("NAME", JSON.stringify(await info()));
    await t.key("Enter");
    await t.until("Prologue.info() && Prologue.info().screen === 'film'", 15);
    const shots = { kronika: [520, "w_grze_2_kronika"], wies: [480, "w_grze_3_wies"], chata: [700, "w_grze_4_chata"], port: [560, "w_grze_5_port"], sztorm: [330, "w_grze_6_sztorm"], plaza: [520, "w_grze_7_plaza"] };
    if (FAST) await t.eval("Prologue.speed(20); 0");
    let last = null;
    for (let k = 0; k < 6; k++) {
        await t.until(`Prologue.info() && Prologue.info().index === ${k}`, 120);
        const id = (await info()).scene;
        if (!FAST && shots[id]) {
            await t.frames(shots[id][0]);
            await t.shot(path.join(DOCS, shots[id][1] + ".png"));
            if (id === "sztorm") {
                fs.mkdirSync(FR, { recursive: true });
                for (const f of fs.readdirSync(FR)) fs.unlinkSync(path.join(FR, f));
                for (let i = 0; i < 48; i++) { await t.shot(path.join(FR, String(i).padStart(3, "0") + ".png")); await t.frames(3); }
            }
        }
        last = await info();
        console.log("SCENE", id, JSON.stringify(last).slice(0, 300));
    }
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 200);
    await t.until("$gameMessage.hasText() && SceneManager._scene._messageWindow.isOpen()", 30);
    await t.frames(60);
    if (!FAST) await t.shot(path.join(DOCS, "w_grze_8_dziadek.png"));
    console.log("MAP", JSON.stringify(await t.json("({ map: $gameMap.mapId(), name: $gameActors.actor(1).name(), text: SceneManager._scene._messageWindow.convertEscapeCharacters($gameMessage.allText()), pendant: $gameParty.numItems($dataItems[172]), log: Prologue.lastRun })")));
    console.log("ERRORS", JSON.stringify(t.errors().slice(-8)));
});
