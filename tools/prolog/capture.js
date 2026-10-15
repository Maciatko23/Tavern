// Prolog - klatka podglądu z gry: dom dziadka (Map019), nowa rozmowa (proponowany tekst, NIE wdrożony), prawdziwe dymki i popiersia.
// Tylko zrzut: nic w grze nie zmienia na stałe (komendy rozmowy idą do interpretera mapy na czas zrzutu).
//   CDP_PORT=9470 node tools/prolog/capture.js
"use strict";
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "zrzuty");
require("fs").mkdirSync(OUT, { recursive: true });

kit.test({ port: Number(process.env.CDP_PORT) || 9470, errorCheck: false }, async t => {
    await t.newGame({ story: true, skipIntro: true, hour: 9.5, quiet: true });
    await t.eval("$gameParty.leader().setName('Łukasz'); 0");
    await t.frames(30);
    // dziadek przy posłaniu bohatera (wnęka obok startu), bohater w łóżku/przy nim
    await t.eval(`(function(){ const g = $gameMap.event(901); if (g) { g.locate(4, 6); g.setDirection(4); } $gamePlayer.locate(3, 6); $gamePlayer.setDirection(6); return 0; })()`);
    await t.frames(420);   // (napis „Cel wykonany” u góry zgasł)
    const G = ["People1", 6];
    const lines = [
        [G, "\\SPK[901]Rybak Janek przyniósł cię z plaży. Trzy dni gorączki, \\N[1]."],
        [null, "\\SPK[0]Dziadku? To naprawdę ty?"]
    ];
    for (const [i, [face, text]] of lines.entries()) {
        const list = [{ code: 101, indent: 0, parameters: [face ? face[0] : "", face ? face[1] : 0, 0, 2, ""] }, { code: 401, indent: 0, parameters: [text] }, { code: 0, indent: 0, parameters: [] }];
        await t.eval(`(function(){ $gameMap._interpreter.setup(${JSON.stringify(list)}, ${face ? 901 : 0}); return 0; })()`);
        await t.until("$gameMessage.hasText() && SceneManager._scene._messageWindow.isOpen()", 10);
        await t.frames(70);   // (tekst wypisany, popiersia wjechały)
        await t.shot(path.join(OUT, "dziadek_" + (i + 1) + ".png"));
        await t.press("ok"); await t.frames(20);
        await t.finish();
    }
    // sama izba bez rozmowy (tło)
    await t.shot(path.join(OUT, "dziadek_izba.png"));
});
