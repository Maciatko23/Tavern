const http = require("http");
const port = process.argv[2] || 9460, expr = process.argv[3];
http.get(`http://127.0.0.1:${port}/json`, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => {
    const pg = JSON.parse(d).find(t => t.type === "page"); const ws = new WebSocket(pg.webSocketDebuggerUrl);
    ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true } }));
    ws.onmessage = m => { console.log(JSON.stringify(JSON.parse(m.data).result).slice(0, 1500)); process.exit(0); };
    setTimeout(() => { console.log("timeout"); process.exit(1); }, 8000); }); });
