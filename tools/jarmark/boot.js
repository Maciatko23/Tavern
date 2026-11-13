const cdp = require("../../tests/cdp.js");
(async () => {
    const b = await cdp.launch({ port: 9461, overlay: "tools/jarmark/overlay", overlayJs: true });
    await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
    await b.sleep(25000);
    console.log(JSON.stringify(b.logs.slice(0,4)).slice(0, 3500));
    try { console.log(await b.evaluate("document.title + ' ' + (window.Jarmark ? 'J' : 'noJ') + ' ' + (typeof SceneManager !== 'undefined' && SceneManager._scene ? SceneManager._scene.constructor.name : '?')")); } catch (e) { console.log("eval", e.message); }
    await b.close(); process.exit(0);
})();
