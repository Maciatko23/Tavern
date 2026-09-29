// The PASS / FAIL lines and the "N/M passed" summary every test prints (tests/run.js, tests/run.sh and other tools parse them).
"use strict";

class Report {
    constructor() {
        this.results = [];
    }
    // one check: "PASS name  info" / "FAIL name  info"; returns ok as a boolean
    check(name, ok, info) {
        ok = !!ok;
        this.results.push(ok);
        console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : ""));
        return ok;
    }
    // an exception that ended the test early: an "ERR" line and a failed result
    error(e) {
        console.log("ERR", (e && e.message) || String(e));
        this.results.push(false);
    }
    get passed() { return this.results.filter(Boolean).length; }
    get ok() { return this.passed === this.results.length; }
    // the summary line; the exit code says it too
    summary() {
        console.log(this.passed + "/" + this.results.length + " passed");
        process.exitCode = this.ok ? 0 : 1;
        return this.ok;
    }
}

module.exports = { Report };
