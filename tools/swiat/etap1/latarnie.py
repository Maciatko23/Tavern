# -*- coding: utf-8 -*-
"""Latarnie na drewnianym slupie zamiast zelaznego stelaza z lampa wiszaca w powietrzu (2026-10-30, gracz: "super zle wygladaja").
Dawny zestaw: kafle C tilesetu 11 375 (gora) i 383 (dol) + zdarzenie !Decoration 7 (latarnia do powieszenia NA SCIANIE) na kaflu 375.
Teraz: kafle 375/383 usuniete, to samo zdarzenie (id, nazwa, notatka swiatla zostaja) stoi na kaflu dawnej podstawy (x, y+1) z obrazem
!$Latarnia_Slup (tools/swiat/etap1/latarnia_slup.py), blokuje jedna kratke (priorytet jak postac)."""
import copy
import zbuduj as Z
W = Z.W

LATARNIE = {
    111: [18] + list(range(435, 452)),
    125: [23, 24],
    155: [10],
    162: [75, 76],
}


def napraw(m, mid):
    n = 0
    for eid in LATARNIE[mid]:
        e = m["events"][eid]
        assert e and e["id"] == eid, (mid, eid)
        pg = e["pages"][0]
        assert pg["image"]["characterName"] == "!Decoration" and pg["image"]["characterIndex"] == 7, (mid, eid)
        x, y = e["x"], e["y"]
        for z in (1, 2, 3):
            if W.at(m, z, x, y) == 375: Z.kafel(m, z, x, y, 0)
            if W.at(m, z, x, y + 1) == 383: Z.kafel(m, z, x, y + 1, 0)
        e["y"] = y + 1
        pg["image"] = {"tileId": 0, "characterName": "!$Latarnia_Slup", "direction": 2, "pattern": 0, "characterIndex": 0}
        pg["priorityType"] = 1
        pg["through"] = False
        pg["directionFix"] = True
        pg["stepAnime"] = False
        note = e["note"]
        if "<LightFlicker" not in note: note += "<LightFlicker:0.12,255,130,55>"
        if "<LightHeight" not in note: note += "<LightHeight:34>"
        e["note"] = note
        n += 1
    return n
