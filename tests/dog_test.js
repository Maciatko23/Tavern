// The dog (Dog.js): a wild dog by day on the home map, tamed with meat (3 meals, one an hour); it follows the hero, and with a
// kennel it works alone: gathers branches / stones / fibre into the stockpile (shown at the top of the screen), eats berries and
// the like, drinks from a clay pot or a puddle, hunts a rabbit and drags the carcass to the stockpile, sleeps at the kennel by
// night, lies there a day when its life is gone. Half the hero's life and strength. Kennel and stockpile are buildings.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const OUT = require("path").join(__dirname, "..");
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 26, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); Survival.calmWeather(); $gameScreen.clearWeather(); if (window.Needs) Needs.setEnabled(false); Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gameSystem.setDayNightHour(10); $gameSystem._minimapHidden = true; 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const until = async (cond, secs) => { const t0 = Date.now(); while (Date.now() - t0 < secs * 1000) { if (await ev(cond)) return true; await sleep(400); } return false; };
        const dogPos = () => J("Dog.dog ? { x: Dog.dog.x, y: Dog.dog.y, pose: Dog.dog._pose, task: Dog.dog._task && Dog.dog._task.kind } : null");

        // the buildings
        const defs = await J(`(function(){ const B = Farming.BUILDINGS; return { dh: B.doghouse && { name: B.doghouse.name, cost: B.doghouse.cost.length, img: B.doghouse.image }, sp: B.stockpile && { name: B.stockpile.name, slots: B.stockpile.slots, w: B.stockpile.w, h: B.stockpile.h },
            coopNails: B.coop.cost.some(([id]) => id === Farming.ITEM.nails), penNails: B.pen.cost.some(([id]) => id === Farming.ITEM.nails), cowNails: B.cowshed.cost.some(([id]) => id === Farming.ITEM.nails) }; })()`);
        check("Buda and Składowisko are buildings (the stockpile a 3x2 chest of 20 kinds); coop, pen and cowshed need nails", defs.dh && defs.dh.name === "Buda" && defs.sp && defs.sp.name === "Składowisko" && defs.sp.slots === 20 && defs.coopNails && defs.penNails && defs.cowNails, defs);

        // the wild dog
        await ev("Dog.sync(); 0");
        await frames(10);
        const wild = await J("({ dog: !!Dog.dog, tame: Dog.state().tame, img: Dog.dog && Dog.dog.characterName() })");
        check("by day a wild dog is on the home map (the brown dog sheet), not tame", wild.dog && !wild.tame && wild.img === "$Animal_Dog", wild);
        // it keeps away from him
        await ev("(function(){ const d = Dog.dog; $gamePlayer.locate(d.x, d.y + 2); return 0; })()");
        await frames(90);
        const shy = await ev("Math.hypot(Dog.dog._realX - $gamePlayer._realX, Dog.dog._realY - $gamePlayer._realY)");
        check("the wild dog is shy: it steps away when he comes close", shy > 2.2, +shy.toFixed(2));
        // taming: the menu in front of it, meat three times, an hour apart
        await ev("(function(){ const d = Dog.dog; d._frozen = true; $gamePlayer.locate(d.x, d.y + 1); $gamePlayer.setDirection(8); return 0; })()");
        const noMeat = await J("(function(){ Dog.openDogMenu(); const m = SceneManager._scene._farmMenu; const e = m && m._list ? m._list[0] : null; return { open: !!$gameTemp._farmMenuOpen, first: e && e.name, enabled: e && e.enabled !== false }; })()");
        await ev("SceneManager._scene.closeFarmMenu && SceneManager._scene.closeFarmMenu(); $gameTemp._farmMenuOpen = false; 0");
        check("its menu: 'Rzuć mu mięso', greyed out without meat", noMeat.first === "Rzuć mu mięso" && noMeat.enabled === false, noMeat);
        await ev("$gameParty.gainItem($dataItems[94], 3); 0");
        const t1 = await J("(function(){ Dog.feedWild(); Dog.feedWild(); return { trust: Dog.state().trust, meat: $gameParty.numItems($dataItems[94]) }; })()");
        check("one meal an hour: the first counts (trust 1/3), the second at once does not", t1.trust === 1 && t1.meat === 2, t1);
        const tamed = await J("(function(){ $gameSystem.advanceDayNight(1.1); Dog.feedWild(); $gameSystem.advanceDayNight(1.1); Dog.feedWild(); const s = Dog.state(); return { tame: s.tame, mode: s.mode, hp: s.hp, st: s.st, mhp: $gameParty.leader().mhp, maxSt: $gameSystem.maxStamina() }; })()");
        check("three meals: the dog is tame, follows him (no kennel yet), half his life and strength", tamed.tame && tamed.mode === "follow" && tamed.hp === Math.round(tamed.mhp / 2) && tamed.st === Math.round(tamed.maxSt / 2), tamed);
        // following
        await ev(`(function(){ Dog.dog._frozen = false; const p = $gamePlayer, x0 = p.x, y0 = p.y;
            const open = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.buildingAt(x, y);
            for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let k = 1; while (k <= 8 && open(x0 + sx * k, y0 + sy * k)) k++; if (k > 6) { p.locate(x0 + sx * (k - 1), y0 + sy * (k - 1)); return 0; } }
            p.locate(x0 + 6, y0); return 0; })()`);
        const follows = await until("Math.hypot(Dog.dog._realX - $gamePlayer._realX, Dog.dog._realY - $gamePlayer._realY) < 2.5", 15);
        check("'Chodź za mną': it comes after him", follows, await ev("Math.hypot(Dog.dog._realX - $gamePlayer._realX, Dog.dog._realY - $gamePlayer._realY).toFixed(2)"));

        // the kennel and the stockpile, near a spot with ground items
        const spot = await J(`(function(){
            const free = (t, x, y) => !Farming.whyNotBuild(t, x, y, false, false);
            for (let r = 0; r < 14; r++) for (let y = 14 - r; y <= 14 + r; y++) for (let x = 24 - r; x <= 24 + r; x++) {
                if (free("stockpile", x, y) && free("doghouse", x + 4, y) && [0,1,2].every(k => $gameMap.checkPassage(x + k, y + 1, 0x0f)) && $gameMap.checkPassage(x + 4, y + 1, 0x0f)) return { x, y };
            }
            return null; })()`);
        check("found room for a kennel and a stockpile", !!spot, spot);
        await ev(`(function(){ const f = $gameSystem._farm; const list = (f.buildings[3] = f.buildings[3] || []);
            list.push({ id: f.nextId++, type: "stockpile", x: ${spot.x}, y: ${spot.y}, last: 1 }); list.push({ id: f.nextId++, type: "doghouse", x: ${spot.x + 4}, y: ${spot.y}, last: 1 }); f.rev++; return 0; })()`);
        await frames(20);
        const menu = await J("(function(){ const d = Dog.dog; $gamePlayer.locate(d.x, d.y + 1); $gamePlayer.setDirection(8); Dog.openDogMenu(); const m = SceneManager._scene._farmMenu; const names = m && m._list ? m._list.map(e => e.name) : []; SceneManager._scene.closeFarmMenu && SceneManager._scene.closeFarmMenu(); $gameTemp._farmMenuOpen = false; return names; })()");
        check("the tame dog's menu: Pogłaszcz, Chodź za mną, Pracuj sam, Poluj, Zostań", menu.join() === "Pogłaszcz,Chodź za mną,Pracuj sam,Poluj,Zostań", menu);
        await ev("Dog.setMode('work'); 0");
        // gathering into the stockpile
        const gathered = await until(`(function(){ const s = Dog.stockpile(); return !!s && Object.keys(s.store || {}).some(k => ["i77","i64","i92"].includes(k) && s.store[k] > 0); })()`, 90);
        const store = await J("Dog.stockpile().store || {}");
        check("'Pracuj sam': it gathers branches / stones / fibre and brings them to the stockpile", gathered, store);
        const strip = await J("(function(){ const s = SceneManager._scene._dogStock; return { visible: s.visible, y: s.y, x: s.x }; })()");
        check("the stockpile's contents are shown at the top of the screen", strip.visible && strip.y < 20, strip);
        await b.shot(OUT + "/dog_work.png");

        // eating and drinking
        await ev("(function(){ const s = Dog.state(); s.food = 8; Dog.dog._task = null; return 0; })()");
        const ate = await until("Dog.state().food > 20", 60);
        check("hungry: it finds berries / mushrooms / wild vegetables and eats", ate, await ev("Dog.state().food.toFixed(1)"));
        await ev(`(function(){ const f = $gameSystem._farm; const d = Dog.dog; const s = Dog.state(); s.water = 8; d._task = null;
            f.buildings[3].push({ id: f.nextId++, type: "clay_pot", x: (function(){ for (let dx = 2; dx < 8; dx++) { const x = d.x + dx; if (!Farming.whyNotBuild("clay_pot", x, d.y) && !(Dog.kennel() && x === Dog.kennel().x && d.y === Dog.kennel().y + 1)) return x; } return d.x + 2; })(), y: d.y, last: 1, water: 3, wt: $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour() }); f.rev++; return 0; })()`);
        await frames(5);
        const pot0 = await ev("(function(){ const p = $gameSystem._farm.buildings[3].find(b => b.type === 'clay_pot'); return Farming.bucketUnits(p); })()");
        const drank = await until("Dog.state().water > 30", 60);
        check("thirsty: it drinks (the clay pot nearby: a portion of its rain water)", drank && pot0 >= 1, { water: await ev("Dog.state().water.toFixed(1)"), pot0, pot1: await ev("Farming.bucketUnits($gameSystem._farm.buildings[3].find(b => b.type === 'clay_pot'))") });

        // a well: water for good - it drinks there too (asking the well for its rain portions stopped the game: "reading 'leak'")
        await ev(`(function(){ const f = $gameSystem._farm, d = Dog.dog, list = f.buildings[3]; for (const p of list.filter(b => b.type === "clay_pot")) list.splice(list.indexOf(p), 1);
            let at = null; for (let r = 2; r < 10 && !at; r++) for (let dy = -r; dy <= r && !at; dy++) for (let dx = -r; dx <= r && !at; dx++) if (!Farming.whyNotBuild("well", d.x + dx, d.y + dy, false, true)) at = { x: d.x + dx, y: d.y + dy };
            list.push({ id: f.nextId++, type: "well", x: at.x, y: at.y, last: 1, v: 3 }); f.rev++; Dog.state().water = 8; d._task = null; return 0; })()`);
        const atWell = await until("Dog.state().water > 30", 12);
        const wellErr = await ev("(document.getElementById('errorPrinter') || {}).innerText || ''");
        check("thirsty with only a well about: it does not drink there (it cannot reach the water; the game runs on)", !atWell && !wellErr, { water: await ev("Dog.state().water.toFixed(1)"), err: wellErr });
        // the bowl at the kennel: water poured in from the bucket in the bag (the kennel's menu), food put in (only food goes in)
        const bowlMenu = await J(`(function(){ const k = Dog.kennel(); $gameParty.gainItem($dataItems[138], 1); $gameSystem._bagWater = 2;
            const m = Farming.menuFor(k.x, k.y); const e = m.entries.find(e => e.name === "Nalej wody do miski"); const names = m.entries.map(e => e.name);
            const ok = e && e.enabled !== false; if (ok) e.run();
            const branch = Farming.putInChest(k, $dataItems[77], 1); $gameParty.gainItem($dataItems[94], 2); const meat = Farming.putInChest(k, $dataItems[94], 2);
            return { names, note: m.note, ok, bowlWater: k.bowlWater, bag: $gameSystem._bagWater, branch, meat, store: k.store }; })()`);
        check("the kennel's menu: 'Miska: jedzenie' (food only - no branch) and 'Nalej wody do miski' (a portion from the bucket)",
            bowlMenu.names.includes("Miska: jedzenie") && bowlMenu.ok && bowlMenu.bowlWater === 1 && bowlMenu.bag === 1 && bowlMenu.branch === 0 && bowlMenu.meat === 2 && /Miska:/.test(bowlMenu.note || ""), bowlMenu);
        const fromBowl = await until("Dog.state().water > 30", 60);
        check("thirsty, nothing about but the well: it drinks from the bowl", fromBowl && (await ev("Dog.kennel().bowlWater || 0")) === 0, { water: await ev("Dog.state().water.toFixed(1)"), task: await ev("Dog.dog._task && Dog.dog._task.kind") });
        // hungry and nothing to find on the map (every tile unreachable for it): the meat in the bowl
        await ev(`(function(){ const d = Dog.dog; d._bad = new Set(); for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) d._bad.add(x + "," + y); Dog.state().food = 8; d._task = null; return 0; })()`);
        const ateBowl = await until("Dog.state().food > 40", 60);
        check("hungry and nothing on the map for it: it eats from the bowl (raw meat +40)", ateBowl && (await ev("(Dog.kennel().store || {}).i94 || 0")) === 1, { food: await ev("Dog.state().food.toFixed(1)"), left: await ev("(Dog.kennel().store || {}).i94 || 0") });
        await ev("Dog.dog._bad = new Set(); 0");
        // the bowl: 6 portions of water; spoilt food is thrown out of it (it never blocks the bowl)
        const bowl6 = await J(`(function(){ const k = Dog.kennel(); k.bowlWater = 5; $gameSystem._bagWater = 3;
            const run = () => { const m = Farming.menuFor(k.x, k.y); const e = m.entries.find(e => e.name === "Nalej wody do miski"); return e; };
            const e1 = run(); if (e1 && e1.enabled !== false) e1.run(); const e2 = run();
            k.store = Object.assign(k.store || {}, { i122: 5 }); return { water: k.bowlWater, full: !!e2 && e2.enabled === false, right: e2 && e2.right }; })()`);
        await frames(20);
        const rotGone = await ev("!((Dog.kennel().store || {}).i122)");
        check("the bowl holds 6 portions of water (full at 6/6), and spoilt food is thrown out of it", bowl6.water === 6 && bowl6.full && bowl6.right === "6/6" && rotGone, Object.assign({ rotGone }, bowl6));
        // hungry, it eats what it catches (a rabbit whole: nothing carried home)
        await ev(`(function(){ Dog.DOG.luck = 1; const s = Dog.state(); s.food = 40; s.water = 60; s.st = Dog.maxSt(); s.mode = "hunt"; const d = Dog.dog; d._task = null; d._huntT = 0; d._drag = null;
            for (const c of Hunting.carcasses().slice()) Hunting.removeCarcass(c); window.__meal = Hunting.spawn("rabbit", d.x + 3, d.y); window.__meal._frozen = true; return 0; })()`);
        const ateCatch = await until("Dog.state().food > 90", 60);   // (40 - hungry enough to eat its catch, not to go for berries - + 60)
        const meal = await J("({ food: Math.round(Dog.state().food), water: Math.round(Dog.state().water), rabbitDead: !!__meal._dead, carcasses: Hunting.carcasses().filter(c => c.kind === 'rabbit').length, dragging: !!Dog.dog._drag })");
        check("hungry (food 40), it eats the rabbit it caught: food +60, some water, nothing dragged home", ateCatch && meal.rabbitDead && meal.carcasses === 0 && !meal.dragging && meal.water > 60, meal);
        await ev("Dog.DOG.luck = 0.5; if (!__meal._dead) Hunting.removeAnimal(__meal); for (const c of Hunting.carcasses().slice()) Hunting.removeCarcass(c); Dog.state().food = 90; Dog.setMode('work'); Dog.dog._task = null; 0");

        // hunting: a rabbit near it - bitten, carried to the stockpile (luck forced: a real hunt succeeds half the time)
        await ev("Dog.DOG.luck = 1; 0");
        await ev(`(function(){ const s = Dog.state(); s.st = Dog.maxSt(); s.food = 90; s.water = 90; s.carry = []; const d = Dog.dog; d._task = null; d._huntT = 0;
            const ok = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.buildingAt(x, y) && $gameMap.isPassable(x, y, 2);
            let at = null; for (let r = 3; r <= 6 && !at; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, 1], [-r, 1]]) if (!at && ok(d.x + dx, d.y + dy)) at = [d.x + dx, d.y + dy];
            const r = Hunting.spawn('rabbit', at[0], at[1]); r._frozen = true; window.__rab = r; return 0; })()`);
        const killed = await until("window.__rab._dead || !(window.__rab._hp > 0)", 40);
        const dragged = await until("(function(){ const s = Dog.stockpile(), sp = { x: s.x + 1.5, y: s.y + 1.75 }; return Hunting.carcasses().some(c => c.kind === 'rabbit' && Math.hypot(c.x - sp.x, c.y - sp.y) < 1.6) && !Dog.dog._drag; })()", 60);
        check("it hunts a rabbit and carries the carcass in its mouth to the stockpile (for the knife)", killed && dragged, { killed, dragged, carcasses: await J("Hunting.carcasses().map(c => [c.kind, +c.x.toFixed(1), +c.y.toFixed(1)])"), stock: await J("[Dog.stockpile().x, Dog.stockpile().y]") });

        // "Poluj": prey far off (beyond the work's 10 tiles) is found and brought, in its mouth (held by its head), laid down at the stockpile
        await ev(`(function(){ Dog.DOG.luck = 1; Dog.DOG.deerEscape = 0; const s = Dog.state(); s.st = Dog.maxSt(); s.food = 95; s.water = 95; s.carry = []; Dog.setMode("hunt"); const d = Dog.dog; d._task = null;
            const ok = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.buildingAt(x, y) && $gameMap.isPassable(x, y, 2);
            let at = null; for (let r = 14; r <= 22 && !at; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, 2], [-r, 2]]) if (!at && ok(d.x + dx, d.y + dy)) at = [d.x + dx, d.y + dy];
            const r = Hunting.spawn('deer', at[0], at[1]); r._frozen = true; window.__deer = r; window.__held = false;
            window.__hi = setInterval(() => { if (Dog.dog && Dog.dog._drag && Dog.dog._drag.held) window.__held = true; }, 50);
            return Math.hypot(at[0] - d.x, at[1] - d.y); })()`);
        const deerKilled = await until("window.__deer._dead || !(window.__deer._hp > 0)", 60);
        const deerHome = await until("(function(){ const s = Dog.stockpile(), sp = { x: s.x + 1.5, y: s.y + 1.75 }; return Hunting.carcasses().some(c => c.kind === 'deer' && !c.held && Math.hypot(c.x - sp.x, c.y - sp.y) < 1.6) && !Dog.dog._drag; })()", 80);
        const held = await ev("clearInterval(window.__hi); window.__held");
        const deerBites = await ev("Math.ceil(Hunting.SPECIES.deer.hp / Dog.DOG.deerBites)");
        check("'Poluj': it finds a deer far off, kills it and brings it in its mouth to the stockpile", deerKilled && deerHome && held, { deerKilled, deerHome, held });
        if (!(deerKilled && deerHome)) console.log("DEBUG", JSON.stringify(await J(`(function(){ const d = Dog.dog, s = Dog.stockpile(); const sp = { x: s.x + 1, y: s.y + 1 };
            return { at: [d.x, d.y], real: [+d._realX.toFixed(2), +d._realY.toFixed(2)], moving: d.isMoving(), stuck: d._stuck, wait: d._wait, task: d._task && d._task.kind, frozen: d._frozen, mode: Dog.state().mode, st: Dog.state().st, hurt: Dog.state().hurtUntil,
                pass: [2, 4, 6, 8].map(k => d.canPass(d.x, d.y, k)), dirToStock: d.findDirectionTo(sp.x, sp.y), deer: window.__deer && [window.__deer.x, window.__deer.y, window.__deer._hp], dirToDeer: window.__deer ? d.findDirectionTo(window.__deer.x, window.__deer.y) : -1,
                huntT: d._huntT, prey: !!Dog.findPrey(d, true), buildingsNear: $gameSystem._farm.buildings[3].filter(b => Math.abs(b.x - d.x) < 4 && Math.abs(b.y - d.y) < 4).map(b => b.type + "@" + b.x + "," + b.y) }; })()`)));
        check("a deer takes about three bites (each a third of its life)", deerBites * 3 >= 40 && deerBites * 2 < 40, deerBites);
        // a deer that breaks away: after the first bite it gets away wounded, the dog gives it up
        await ev(`(function(){ Dog.DOG.deerEscape = 1; const s = Dog.state(); s.st = Dog.maxSt(); s.carry = []; const d = Dog.dog; d._task = null; d._huntT = 0;
            const ok = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.buildingAt(x, y) && $gameMap.isPassable(x, y, 2);
            let at = null; for (let r = 4; r <= 8 && !at; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) if (!at && ok(d.x + dx, d.y + dy)) at = [d.x + dx, d.y + dy];
            window.__deer2 = Hunting.spawn('deer', at[0], at[1]); return 0; })()`);
        const brokeAway = await until("window.__deer2._dogSpared > Graphics.frameCount", 40);
        const deer2 = await J("({ hp: window.__deer2._hp, max: window.__deer2._maxHp, dead: !!window.__deer2._dead, task: Dog.dog._task && Dog.dog._task.kind })");
        check("a bitten deer may break away (half the time after each bite): wounded, alive, the dog gives the hunt up", brokeAway && !deer2.dead && deer2.hp < deer2.max && deer2.hp > 0 && deer2.task !== "hunt", { brokeAway, deer2 });
        await ev("Dog.DOG.deerEscape = 0.5; if (!window.__deer2._dead) Hunting.removeAnimal(window.__deer2); 0");
        await ev("Dog.setMode('work'); 0");

        // a lost hunt: the rabbit bolts from the dog when it comes close and gets away; the dog gives it up and leaves it alone
        await ev(`(function(){ Dog.DOG.luck = 0; const s = Dog.state(); s.st = Dog.maxSt(); s.carry = []; Dog.setMode("hunt"); const d = Dog.dog; d._task = null; d._huntT = 0;
            const ok = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.buildingAt(x, y) && $gameMap.isPassable(x, y, 2);
            let at = null; for (let r = 5; r <= 8 && !at; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) if (!at && ok(d.x + dx, d.y + dy)) at = [d.x + dx, d.y + dy];
            window.__run = Hunting.spawn('rabbit', at[0], at[1]); return 0; })()`);
        const escaped = await until("window.__run._dogSpared > Graphics.frameCount && !(Dog.dog._task && Dog.dog._task.kind === 'hunt' && Dog.dog._task.prey.ref === window.__run)", 40);
        const alive = await J("({ hp: window.__run._hp, dead: !!window.__run._dead, fled: !!window.__run._fleeing })");
        check("a hunt may fail (half the time): the rabbit bolts from the dog and gets away alive, the dog gives it up", escaped && alive.hp > 0 && !alive.dead, { escaped, alive });
        await ev("Dog.DOG.luck = 0.5; if (!window.__run._dead) Hunting.removeAnimal(window.__run); Dog.setMode('work'); Dog.dog._task = null; 0");

        // tired with its mouth full: the things go to the stockpile first, then it lies down at the kennel
        const b77 = await ev("(Dog.stockpile().store || {}).i77 || 0");
        await ev("(function(){ const s = Dog.state(); s.carry = [{ item: 77, n: 3 }]; s.st = 3; Dog.dog._task = null; Dog.dog._drag = null; return 0; })()");
        const unloadedFirst = await until(`(function(){ const s = Dog.state(); return (s.carry || []).length === 0 && ((Dog.stockpile().store || {}).i77 || 0) >= ${b77} + 3; })()`, 40);
        const liesAfter = await until(`(function(){ const k = Dog.kennel(), d = Dog.dog; return d.x === k.x && d.y === k.y + 1 && d._pose === "rest" && d.characterName() === ""; })()`, 40);
        check("tired with branches in its mouth: it takes them to the stockpile first, then rests INSIDE the kennel (hidden, 'Zzz' over it)", unloadedFirst && liesAfter, { unloadedFirst, liesAfter, pos: await dogPos() });
        await frames(10);
        await b.shot(OUT + "/dog_rest_kennel.png");
        await ev("(function(){ const s = Dog.state(); s.st = Dog.maxSt(); Dog.dog._task = null; return 0; })()");

        // night: asleep at the kennel
        await ev("$gameSystem.setDayNightHour(21); Dog.dog._task = null; 0");
        const slept = await until(`(function(){ const k = Dog.kennel(), d = Dog.dog; return d.x === k.x && d.y === k.y + 1 && d._pose === "sleep"; })()`, 40);
        check("at night it sleeps in its kennel", slept, await dogPos());
        await b.shot(OUT + "/dog_sleep.png");
        // hurt: it lies a day at the kennel, then it is well again
        await ev("$gameSystem.setDayNightHour(10); const s0 = Dog.state(); s0.food = 100; s0.water = 100; Dog.hurtDog(999); 0");
        await frames(60);
        await until("Dog.dog._pose === 'hurt'", 40);
        await frames(20);
        const hurt = await J("({ hurt: Dog.state().hurtUntil > 0, hp: Dog.state().hp, pose: Dog.dog._pose, hidden: Dog.dog.characterName() === '', hud: !!(Dog.dog._hud && Dog.dog._hud.visible !== false) })");
        await b.shot(OUT + "/dog_hurt_kennel.png");
        check("hurt: it heals INSIDE the kennel (hidden) with a heart over it", hurt.pose === "hurt" && hurt.hidden && hurt.hud, hurt);
        // lying hurt, hungry: it eats from the bowl right there
        const inBowl = await J("(function(){ const k = Dog.kennel(); $gameParty.gainItem($dataItems[95], 1); Farming.putInChest(k, $dataItems[95], 1); const s = Dog.state(); s.food = 20; Dog.tickNeeds(); return { food: Math.round(Dog.state().food), left: (k.store || {}).i95 || 0 }; })()");
        await frames(30);
        const inBowl2 = await J("({ food: Math.round(Dog.state().food), left: (Dog.kennel().store || {}).i95 || 0 })");
        check("lying hurt and hungry: it eats from the bowl in the kennel", inBowl2.food >= 60 && inBowl2.left === 0, { inBowl, inBowl2 });
        await ev("$gameSystem.advanceDayNight(25); 0");
        await frames(20);
        const well = await J("({ hurt: Dog.state().hurtUntil, hp: Math.round(Dog.state().hp), max: Dog.maxHp() })");
        check("its life gone: it lies at the kennel a day, then it is well (full life)", hurt.hurt && hurt.hp === 0 && !well.hurt && well.hp === well.max, { hurt, well });
        // out of the kennel again it is drawn again (its 8-way sheet: the sprite had kept the empty name of the hidden pose and stayed
        // invisible - the user: "grafika psa zniknęła")
        await ev("Dog.dog._task = null; 0");
        const seenAgain = await until(`(function(){ const g = Dog.dog, t = SceneManager._scene._spriteset._tilemap, sp = t.children.find(s => s._character === g); return !!sp && g._pose === "" && sp.visible && !!sp._characterName; })()`, 30);
        check("well again, out of the kennel: the dog is drawn again", seenAgain, await J(`(function(){ const g = Dog.dog, t = SceneManager._scene._spriteset._tilemap, sp = t.children.find(s => s._character === g); return { pose: g._pose, vis: sp && sp.visible, name: sp && sp._characterName, look8: sp && sp._look8Sheet }; })()`));
        // down from hunger and thirst: lying hurt it needs four times less, and when the day is over it gets up whole (it used to be
        // knocked down again at once by the hunger - hurt for another day, over and over) and goes to drink and eat
        await ev("$gameSystem.setDayNightHour(10); const s1 = Dog.state(); s1.food = 0; s1.water = 0; s1.hp = 0; 0");
        await frames(30);
        const starved = await J("({ hurt: Dog.state().hurtUntil > 0, hp: Dog.state().hp })");
        await ev("const s2 = Dog.state(); s2.food = 40; s2.water = 40; $gameSystem.advanceDayNight(25); Dog.tickNeeds(); 0");
        const up = await J("({ hurt: Dog.state().hurtUntil, hp: Math.round(Dog.state().hp), max: Dog.maxHp(), food: +Dog.state().food.toFixed(1), water: +Dog.state().water.toFixed(1) })");
        check("down from hunger: a day at the kennel (needs four times slower), then up whole - not knocked down again", starved.hurt && starved.hp === 0 && !up.hurt && up.hp >= up.max - 5 && up.food > 20 && up.water > 14, { starved, up });
        await ev("const s3 = Dog.state(); s3.water = 10; s3.food = 10; Dog.dog._task = null; 0");
        const goes = await until("!!(Dog.dog._task && (Dog.dog._task.kind === 'drink' || Dog.dog._task.kind === 'eat'))", 20);
        check("...and up again, hungry and thirsty, it goes to drink or eat", goes, await J("({ task: Dog.dog._task && Dog.dog._task.kind, hp: Dog.state().hp })"));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
