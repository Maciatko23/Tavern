# -*- coding: utf-8 -*-
"""The F9 way in: one row in Debug.js's ISLE_GO list + its two texts in js/teksty/f9.txt. Text insertions in binary mode (LF), idempotent."""
DBG_OLD = b'        { id: "probnaB", map: 991, x: 29, y: 34, d: 2 }\n'
DBG_NEW = b'        { id: "probnaB", map: 991, x: 29, y: 34, d: 2 },\n        // (2026-11-08) mapa testowa budynk\xc3\xb3w (tools/proba): Winlu + Fantastic Buildings obok siebie\n        { id: "probaBudynki", map: 27, x: 52, y: 53, d: 8 }\n'
TXT_ANCHOR = "wyspa.miejsca.probnaB.opis = ".encode("utf-8")
TXT_ADD = ("# probaBudynki\nwyspa.miejsca.probaBudynki.nazwa = Mapa testowa: budynki\n"
           "wyspa.miejsca.probaBudynki.opis = Map027: stare budynki Winlu (lewo) i nowe z paczki Fantastic Buildings (prawo) na bruku, do porównania w edytorze. Wyjście: dół mapy.\n").encode("utf-8")
def patch_debug(b):
    if b"probaBudynki" in b: return b
    assert DBG_OLD in b, "Debug.js: anchor (probnaB row) not found"
    return b.replace(DBG_OLD, DBG_NEW, 1)
def patch_f9(b):
    if b"probaBudynki" in b: return b
    i = b.index(TXT_ANCHOR); j = b.index(b"\n", i) + 1
    return b[:j] + TXT_ADD + b[j:]
