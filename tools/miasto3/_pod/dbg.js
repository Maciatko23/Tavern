const kit = require("../../../tests/lib/kit.js");
kit.test({ port: 9595, lightGpu: true, bootCheck: "boot", overlay: "tools/miasto3/staging", overlayJs: true }, async t => {
    await t.newGame({ map: 8, x: 51, y: 36, dir: 2, quiet: true, hour: 12, minimap: false });
    const r = await t.json(`(function(){
        const out = {};
        for (const [x, y] of [[49,50],[33,17],[116,49],[15,85],[11,25],[31,58]]) {
            const o = [];
            for (const [d,dx,dy] of [[2,0,1],[4,-1,0],[6,1,0],[8,0,-1]]) { const nx=x+dx, ny=y+dy; o.push(d+":"+$gameMap.isPassable(x,y,d)+"/"+$gameMap.isPassable(nx,ny,{2:8,8:2,4:6,6:4}[d])+"/ev"+$gameMap.eventsXyNt(nx,ny).filter(e=>e.isNormalPriority()&&!e.isThrough()).map(e=>e.eventId()+(e.characterName()||"")).join("+")); }
            out[x+","+y] = o.join(" "); }
        return out; })()`);
    console.log(JSON.stringify(r,null,1));
});
