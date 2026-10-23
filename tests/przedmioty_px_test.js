// Przedmioty na środku blatu (2026-10-22, user: "w bibliotece książki leżą na krawędzi stołu"):
//   - TawernaCore: <Px:dx,dy> w notatce zdarzenia przesuwa jego obrazek o piksele
//   - tools/mapy/popraw.py: przedmiot z kafla, który na stole na dwa rzędy w żadnej kratce nie leżał cały na blacie, jest
//     zdarzeniem z obrazkiem tego kafla i <Px:0,dy> (biblioteka dworu Map173: dwie księgi, zdarzenia 18 i 19, +16 px)
// Uruchom: CDP_PORT=9562 node tests/przedmioty_px_test.js (serwer: node tools/serve.js)
const kit = require("./lib/kit.js");

kit.test({ port: 9562, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ map: 173, x: 8, y: 10, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    const r = await t.json(`(function(){
        const sprites = SceneManager._scene._spriteset._characterSprites;
        const of = id => { const ev = $gameMap.event(id), sp = sprites.find(s => s._character === ev);
            return ev && sp ? { tile: ev.tileId(), note: ev.event().note, dx: sp.x - ev.screenX(), dy: sp.y - ev.screenY(), z: sp.z } : null; };
        const plain = $gameMap.events().find(e => !/<Px:/i.test(e.event().note || "") && e.tileId() > 0);
        const sp = plain && sprites.find(s => s._character === plain);
        return { a: of(18), b: of(19), plain: sp ? { dx: sp.x - plain.screenX(), dy: sp.y - plain.screenY() } : null,
                 tiles: [$gameMap.tileId(11, 8, 3), $gameMap.tileId(13, 8, 3)] };
    })()`);
    t.check("Map173: księgi to zdarzenia z obrazkami kafli 598 i 599", r.a && r.b && r.a.tile === 598 && r.b.tile === 599, r);
    t.check("Map173: obrazki ksiąg 16 px niżej niż ich kratki (<Px:0,16>), w poziomie bez zmian",
        r.a && r.b && r.a.dx === 0 && r.a.dy === 16 && r.b.dx === 0 && r.b.dy === 16, r);
    t.check("Map173: pod postacią (z 1), kafli ksiąg na mapie już nie ma", r.a && r.a.z === 1 && r.tiles[0] === 0 && r.tiles[1] === 0, r);
    t.check("zdarzenie bez <Px> stoi na swojej kratce", !r.plain || (r.plain.dx === 0 && r.plain.dy === 0), r.plain);
});
