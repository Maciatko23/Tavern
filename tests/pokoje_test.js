// Zasięg widzenia (js/plugins/Pokoje.js v2, 2026-11-05): widać to, co bohater może zobaczyć; za ścianami i daleko czarno; przez przejście klin następnej sali rosnący, gdy podchodzi;
// zmiana płynna; drzwi zasłaniają, aż stanie przy nich; scena pokazuje swoje miejsce; nic w zapisie; poza listą map nic; koszt w limicie.
// Ze stagingu: GAME_OVERLAY=tools/tavern/pokoje/staging GAME_OVERLAY_JS=1 CDP_PORT=9428 node tests/pokoje_test.js
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9428, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 240000 }, async t => {
    t.check("wtyczka wczytana", await t.json("!!window.Pokoje"));
    await t.newGame({ map: 1, x: 50, y: 35, day: 12, hour: 20, quiet: true, minimap: false });
    await t.frames(40);
    const c = (x, y) => t.json(`Pokoje.cover(${x}, ${y})`);
    const widzi = (x, y) => t.json(`Pokoje.sees(${x}, ${y})`);
    const go = async (x, y) => { await t.eval(`$gamePlayer.locate(${x}, ${y}); 0`); await t.frames(10); await t.until("Pokoje.settled()", 15); await t.frames(4); };
    console.log("   drzwi zasłaniające widok: " + JSON.stringify(await t.json("Pokoje.doors()")));
    await t.until("Pokoje.settled()", 15);
    // w sali
    t.check("widać salę wokół bohatera", (await c(50, 35)) === 0 && (await c(44, 33)) === 0 && (await c(56, 38)) === 0, [await c(50, 35), await c(44, 33), await c(56, 38)]);
    t.check("za ścianą czarno: korytarz i kuchnia", (await c(50, 21)) === 1 && (await c(45, 14)) === 1, [await c(50, 21), await c(45, 14)]);
    t.check("ściana nad salą widoczna do góry", (await c(44, 26)) < 0.1 && (await c(44, 24)) < 0.1, [await c(44, 26), await c(44, 24)]);
    const daleko = await c(64, 33), bardzo = await c(68, 33);
    t.check("zasięg: daleko przygasa, dalej czerń", daleko > 0.2 && bardzo === 1, [daleko, bardzo]);
    // klin przez szerokie przejście (36,30-35): im bliżej, tym więcej skrzydła widać
    const skrzydlo = `(() => { let n = 0; for (let y = 27; y <= 38; y++) for (let x = 25; x <= 35; x++) if (Pokoje.sees(x, y)) n++; return n; })()`;
    await go(50, 32); const n1 = await t.json(skrzydlo);
    await go(44, 32); const n2 = await t.json(skrzydlo);
    await go(38, 32); const n3 = await t.json(skrzydlo);
    t.check("przez przejście widać klin, rosnący gdy podchodzi", n1 < n2 && n2 < n3, [n1, n2, n3]);
    t.check("zza progu kawałek skrzydła widać, ale nie całe", n2 > 0 && n2 < 132, n2);
    // płynność: to, co wchodzi w pole widzenia, jaśnieje szybko, ale nie naraz; to, co wychodzi, gaśnie powoli
    await go(50, 28);
    t.check("przed drzwiami korytarz zakryty (drzwi zasłaniają)", (await c(50, 21)) === 1, await c(50, 21));
    t.check("widać same drzwi i ścianę nad nimi, bez czarnego wcięcia", (await c(50, 26)) < 0.1 && (await c(50, 24)) < 0.1, [await c(50, 26), await c(50, 24)]);
    await go(50, 22);
    const drzwiKuchni = [await c(49, 18), await c(50, 18), await c(51, 18), await c(50, 17)];
    t.check("szerokie drzwi do kuchni widać w całości, bez czarnego wcięcia nad nimi", drzwiKuchni.every(a => a < 0.1), drzwiKuchni);
    t.check("a kuchni za nimi nie", (await c(50, 12)) === 1, await c(50, 12));
    await go(50, 28);
    await t.eval(`$gamePlayer.locate(50, 27); 0`); await t.frames(3);
    const zaraz = await c(50, 22);
    await t.frames(40);
    const potem = await c(50, 22);
    t.check("stając przy drzwiach: korytarz za nimi jaśnieje płynnie, nie naraz", zaraz > 0.1 && zaraz < 1 && potem < zaraz, [zaraz, potem]);
    await t.eval(`$gamePlayer.locate(50, 24); 0`); await t.frames(6);
    const sala = await c(45, 32);
    t.check("w wąskim przejściu sala za plecami gaśnie powoli, ekran nie czernieje od razu", sala < 0.5, sala);
    await go(50, 21);
    t.check("w korytarzu: korytarz widać, salę za ścianą nie", (await c(52, 21)) === 0 && (await c(44, 33)) === 1, [await c(52, 21), await c(44, 33)]);
    t.check("ściana działowa zakrytych pokoi nie wystaje ponad korytarz", (await c(54, 15)) === 1, await c(54, 15));
    t.check("ściana nad korytarzem widoczna do góry", (await c(45, 19)) < 0.1 && (await c(45, 17)) < 0.1, [await c(45, 19), await c(45, 17)]);
    t.check("z korytarza widać przejście, ale nie panele na ścianie po stronie sali", (await c(50, 24)) < 0.1 && (await c(49, 26)) === 1 && (await c(51, 26)) === 1, [await c(50, 24), await c(49, 26), await c(51, 26)]);
    await go(50, 30);
    t.check("od strony sali te panele widać", (await c(49, 26)) < 0.1 && (await c(51, 26)) < 0.1, [await c(49, 26), await c(51, 26)]);
    await go(50, 21);
    // zapis z poprzedniej wersji wtyczki (pole „pokoje”) wczytuje się bez kłopotu
    await t.eval(`$gameSystem._tw.pokoje = { odw: { 1: { 123: 1 } } }; 0`);
    await t.saveTo(5);
    const stary = await t.loadFrom(5);
    await t.frames(10); await t.until("Pokoje.settled()", 15);
    t.check("stary zapis z polem „pokoje” wczytuje się, widok działa", stary && (await c(52, 21)) === 0, await c(52, 21));
    await t.eval(`delete $gameSystem._tw.pokoje; 0`);
    // nic w zapisie
    const zapis = await t.json(`(() => { try { const s = JsonEx.stringify(DataManager.makeSaveContents()); return { n: s.length, ma: /"pokoje"/.test(s) }; } catch (e) { return String(e); } })()`);
    t.check("zapis działa i nic z tego w nim nie ma", zapis && zapis.n > 1000 && !zapis.ma, zapis);
    await t.saveTo(4);
    await t.loadFrom(4);
    await t.frames(10); await t.until("Pokoje.settled()", 15);
    t.check("po wczytaniu widok liczony od nowa", (await c(52, 21)) === 0 && (await c(44, 33)) === 1, [await c(52, 21), await c(44, 33)]);
    // scena: pokazuje miejsce zdarzenia
    const evKuchnia = await t.json(`$gameMap.events().filter(e => e.x >= 40 && e.x <= 50 && e.y >= 8 && e.y <= 15)[0].eventId()`);
    const gdzie = await t.json(`[$gameMap.event(${evKuchnia}).x, $gameMap.event(${evKuchnia}).y]`);
    await t.eval(`$gameMap._interpreter.setup([{ code: 230, indent: 0, parameters: [240] }, { code: 0, indent: 0, parameters: [] }], ${evKuchnia}); 0`);
    await t.frames(60);
    t.check("w czasie sceny widać miejsce jej zdarzenia", (await c(gdzie[0], gdzie[1] + 1)) < 0.2, { gdzie, cover: await c(gdzie[0], gdzie[1] + 1) });
    await t.until("!$gameMap.isEventRunning()", 20); await t.frames(10); await t.until("Pokoje.settled()", 15); await t.frames(4);
    t.check("po scenie znów tylko to, co widzi bohater", (await c(gdzie[0], gdzie[1] + 1)) === 1, await c(gdzie[0], gdzie[1] + 1));
    // gadanie zza ściany
    await go(50, 35);
    const mowa = await t.json(`(() => { const SB = Tawerna.api("SpeechBubbles"), e = $gameMap.events().find(q => q.x >= 86 && q.x <= 96 && q.y >= 45 && q.y <= 52); return e ? SB.say(e, "test") : null; })()`);
    t.check("ktoś, kogo nie widać, nie gada nad czernią", mowa === false || mowa === null, mowa);
    // koszt
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const koszt = await t.json("Pokoje.cost(200)");
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    console.log("   koszt przy CPU 4x: promienie " + koszt.rays.toFixed(3) + " ms, rysowanie " + koszt.paint.toFixed(3) + " ms");
    t.check("klatka w ruchu (promienie + rysowanie) <= 3 ms (CPU 4x)", koszt.rays + koszt.paint <= 3, koszt);
    // inne wnętrze: pokoje za ścianami nie prześwitują; zamknięte drzwi zasłaniają, choćby stał obok
    await t.go(25, 30, 18, 8); await t.frames(10); await t.until("Pokoje.settled()", 15); await t.frames(4);
    t.check("piętro: korytarz widać, pokój za ścianą nie", (await t.json("Pokoje.active()")) && (await c(30, 18)) === 0 && (await c(30, 8)) === 1, [await c(30, 18), await c(30, 8)]);
    await t.go(108, 5, 10, 8); await t.frames(10); await t.until("Pokoje.settled()", 15); await t.frames(4);
    t.check("sznur dzwonu narysowany z arkusza drzwi nie rzuca czarnego klina: za nim widać podłogę", (await t.json("Pokoje.doors()")).length === 0 && (await c(5, 5)) === 0, [await t.json("Pokoje.doors()"), await c(5, 5)]);
    // poza wnętrzami budynków nic
    await t.go(9, 7, 8, 8); await t.frames(20);
    t.check("w piwnicy (zestaw lochów) brak zakrycia", !(await t.json("Pokoje.active()")));
    await t.go(3, 20, 20, 2); await t.frames(20);
    t.check("na dworze brak zakrycia", !(await t.json("Pokoje.active()")));
    await t.go(1, 50, 35, 8); await t.frames(20);
    t.check("po powrocie działa", await t.json("Pokoje.active()"));
    await t.eval("window.POKOJE = false; 0"); await t.frames(5);
    t.check("window.POKOJE = false wyłącza", (await t.json("SceneManager._scene._spriteset._pokoje.sp.visible")) === false);
    await t.eval("window.POKOJE = undefined; 0");
});
