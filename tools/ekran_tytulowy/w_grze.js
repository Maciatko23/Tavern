// Ekran tytułowy w grze (TitleScreen.js): zrzut docs/ekran_tytulowy/w_grze.png (z zapisem day40_farm w pliku 1, więc „Kontynuuj”
// pokazuje prawdziwy opis), w_grze_bez_zapisu.png, w_grze_lista_zapisow.png i klatki do GIF-a (tools/ekran_tytulowy/klatki/).
//   CDP_PORT=9470 node tools/ekran_tytulowy/w_grze.js [klatki]
"use strict";
const fs = require("fs");
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const DOCS = path.join(__dirname, "..", "..", "docs", "ekran_tytulowy");
const FR = path.join(__dirname, "klatki");
const N = Number(process.argv[2] || 0);

kit.test({ port: Number(process.env.CDP_PORT) || 9470, errorCheck: false }, async t => {
    await t.frames(150);
    await t.shot(path.join(DOCS, "w_grze_bez_zapisu.png"));
    // zapis z dnia 40 w pliku 1, powrót na ekran tytułowy
    await t.loadFixture("day40_farm", { slot: 1 });
    await t.saveTo(1);
    await t.eval("Window_TitleCommand._lastCommandSymbol = null; 0");
    await t.toTitle();
    await t.until("TitleScreen.info() && TitleScreen.info().named && TitleScreen.info().open", 20);
    await t.frames(160);
    console.log("INFO", JSON.stringify(await t.json("TitleScreen.info()")));
    await t.shot(path.join(DOCS, "w_grze.png"));
    if (N) {
        fs.mkdirSync(FR, { recursive: true });
        for (const f of fs.readdirSync(FR)) fs.unlinkSync(path.join(FR, f));
        for (let i = 0; i < N; i++) {
            await t.shot(path.join(FR, String(i).padStart(3, "0") + ".png"));
            await t.frames(3);
        }
    }
    await t.key("O");
    await t.until("SceneManager._scene instanceof Scene_Load && !SceneManager.isSceneChanging()", 10);
    await t.frames(30);
    await t.shot(path.join(DOCS, "w_grze_lista_zapisow.png"));
    console.log("console errors:", JSON.stringify(t.errors().slice(-5)));
});
