

# ====================================================================================================================
# main: run every section, write ONLY to tools/questy_mapa/staging/
# ====================================================================================================================
def write_all():
    for sub in ("data", "js", "tests"):
        d = os.path.join(STG, sub)
        if os.path.isdir(d): shutil.rmtree(d)
    changed = []
    for i, m in sorted(MAPS.items()):
        raw = W.map_text(m).encode("utf-8")
        back = json.loads(raw.decode("utf-8"))
        if W.map_text(back).encode("utf-8") != raw: raise SystemExit("STOP: Map%03d nie wraca w petli" % i)
        for k, e in enumerate(back["events"]):
            if e is not None and e["id"] != k: raise SystemExit("STOP: Map%03d zdarzenie %d ma id %d" % (i, k, e["id"]))
        if raw == MAP_ORIG[i]: continue
        out = os.path.join(STG, "data", "Map%03d.json" % i)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "wb").write(raw); changed.append("data/Map%03d.json" % i)
    for rel, f in sorted(FILES.items()):
        if f["b"] == f["orig"]: continue
        out = os.path.join(STG, *rel.split("/"))
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "wb").write(f["b"]); changed.append(rel)
    return changed

if __name__ == "__main__":
    for fn in (sec_towncquests, sec_kantor, sec_ludzie, sec_zakon, sec_zasoby, sec_lowy, sec_homes, sec_swiat, sec_maps, sec_miasto, sec_teksty, sec_tests, sec_tests2):
        fn()
    ch = write_all()
    os.makedirs(os.path.join(STG, "tests"), exist_ok=True)
    shutil.copyfile(os.path.join(HERE, "questy_mapa_test.js"), os.path.join(STG, "tests", "questy_mapa_test.js")); ch.append("tests/questy_mapa_test.js")
    print("\n".join("  zapisano staging/" + c for c in ch))
    print("%d plikow w %s" % (len(ch), STG))
