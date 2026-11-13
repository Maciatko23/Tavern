# -*- coding: utf-8 -*-
"""Instalator wątku W17 „Jarmark Kruczogrodu” (docs/zadania_nowe/jarmark.md). Nakłada zmiany NA BIEŻĄCE pliki gry (kotwice dokładne,
idempotentnie, STOP z jasnym komunikatem, gdy kotwicy brak); nie wysyła gotowych kopii cudzych plików.

   python tools/jarmark/zainstaluj.py                    podgląd: co by zrobiło
   python tools/jarmark/zainstaluj.py --do <katalog>     pełna nakładka do testów (GAME_OVERLAY=<katalog względem projektu> GAME_OVERLAY_JS=1)
   python tools/jarmark/zainstaluj.py --wykonaj          zapis do gry (edytor zamknięty), kopia zmienianych plików do
                                                         ../Tawerna_archiwum_2026-11-08/jarmark_<czas>/

Co robi:
  1. data/Map008.json - dwie nowe, przylegające kamienice z kafli Winlu (kopie Domu 14 i Domu weterana) na łące nad dzwonnicą x42-49 y94-98,
     dwa zamknięte wejścia (zdarzenia), usunięte dwa drzewa ozdobne (217, 283), które zasłaniałyby dachy (tools/jarmark/miasto.py)
  2. js/tawerna_wtyczki.js - Jarmark_Data (pod Dezerter_Data), Jarmark (pod Dezerter), Jarmark_Sceny (pod Jarmark) - przez tools/wtyczki.py
  3. js/plugins/TawernaCore.js - wpis pasma 4800-4999 (Jarmark) na liście zarezerwowanych numerów
  4. img/characters/ - 8 arkuszy postaci $Npc_Jarmark_* (tools/jarmark/art_postacie.py), scena !$Jarmark_Scena, poduszka !$Jarmark_Kruk
Pliki wtyczek (js/plugins/Jarmark*.js) i tekstów (js/teksty/jarmark.txt) to nowe pliki projektu.
PO --wykonaj (miasto zmieniło kafle, trzeba je wypalić na nowo, ok. 10 min):
   python tools/klimat/ziemia_miasta.py ; python tools/klimat/pogoda_miasta.py ; python tools/drzewa/drzewa.py --mapy 8 --wykonaj
   i podbić versionId w data/System.json (stare zapisy trzymają stary układ zdarzeń)."""
import datetime, os, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia")); sys.path.insert(0, os.path.join(ROOT, "tools")); sys.path.insert(0, HERE)
import wspolne as W   # noqa: E402
import wtyczki        # noqa: E402
import miasto         # noqa: E402
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
ARCH = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08")
PLUGINS = [("Jarmark_Data", "Dezerter_Data"), ("Jarmark", "Dezerter"), ("Jarmark_Sceny", "Jarmark")]
NOWE = ["js/plugins/Jarmark_Data.js", "js/plugins/Jarmark.js", "js/plugins/Jarmark_Sceny.js", "js/teksty/jarmark.txt"]
ART = os.path.join(HERE, "art")
CORE = "js/plugins/TawernaCore.js"
CORE_KOTWICA = "    const reserved = [\n"
CORE_WPIS = ('        // (2026-11-12) W17 "Jarmark Kruczogrodu" (Jarmark*.js): stalls, lamps, stage, troupe, clues, chase (Map008), the hall\'s judges (Map001)\n'
             '        { owner: "Jarmark", from: 4800, to: 4999, what: "W17 Jarmark: kramy, lampiony, scena trupy, trupa, ślady, pościg (mapa 8), sędziowie konkursu (mapa 1)" },\n')

def stop(msg): raise SystemExit("STOP: " + msg)
def czytaj(rel): return open(os.path.join(ROOT, rel), "rb").read()

class Zmiany:
    def __init__(self): self.pliki = {}; self.raport = []
    def put(self, rel, data, note): self.pliki[rel] = data; self.raport.append("%s: %s" % (rel, note))

def patch_map(z):
    m, lay = W.read_json("data/Map008.json")
    msgs = miasto.patch(m)
    if msgs == ["Map008: kamienice już są"]: z.raport.append("data/Map008.json: kamienice już są"); return
    txt = W.json_text(m, lay)
    back = __import__("json").loads(txt.decode("utf-8") if isinstance(txt, bytes) else txt)
    if back != m: stop("Map008: nie wraca po zapisie (round trip)")
    z.put("data/Map008.json", txt if isinstance(txt, bytes) else txt.encode("utf-8"), "; ".join(msgs))

def patch_core(z):
    raw = czytaj(CORE); crlf = b"\r\n" in raw; s = raw.decode("utf-8")
    if '"Jarmark", from: 4800' in s: z.raport.append(CORE + ": pasmo już wpisane"); return
    k, n = CORE_KOTWICA, CORE_KOTWICA + CORE_WPIS
    if crlf: k, n = k.replace("\n", "\r\n"), n.replace("\n", "\r\n")
    if s.count(k) != 1: stop("w %s nie ma (albo jest kilka) kotwicy początku listy zarezerwowanych numerów („const reserved = [”) - popraw tools/jarmark/zainstaluj.py" % CORE)
    z.put(CORE, s.replace(k, n).encode("utf-8"), "pasmo 4800-4999 (Jarmark)")

def patch_lista(z):
    lista = wtyczki.czytaj_liste(); zm = False
    for nazwa, po in PLUGINS:
        if not os.path.exists(os.path.join(ROOT, "js", "plugins", nazwa + ".js")): stop("brak js/plugins/%s.js" % nazwa)
        if wtyczki.dodaj(lista, wtyczki.wpis_z_pliku(nazwa), po=po): zm = True
    if zm: z.put("js/tawerna_wtyczki.js", lista.tekst(), "wpisy: " + ", ".join("%s pod %s" % p for p in PLUGINS))
    else: z.raport.append("js/tawerna_wtyczki.js: wtyczki już są")

def patch_art(z):
    if not os.path.isdir(ART): stop("brak tools/jarmark/art - uruchom art_postacie.py i art_rekwizyty.py")
    for f in sorted(os.listdir(ART)):
        if f.endswith(".png"):
            cel = os.path.join(ROOT, "img", "characters", f); dane = open(os.path.join(ART, f), "rb").read()
            if os.path.exists(cel) and open(cel, "rb").read() != dane: stop("w grze jest już inny %s - nie nadpisuję" % f)
            z.put("img/characters/" + f, dane, "obrazek")

def zbierz():
    for rel in NOWE:
        if not os.path.exists(os.path.join(ROOT, rel)): stop("brak pliku " + rel)
    r = subprocess.run(["node", os.path.join(ROOT, "tools", "teksty.js"), "sprawdz", "jarmark"], capture_output=True, text=True, cwd=ROOT, encoding="utf-8")
    if "OK " not in r.stdout: stop("teksty jarmark.txt: " + r.stdout[:300])
    z = Zmiany(); patch_map(z); patch_core(z); patch_lista(z); patch_art(z)
    return z

def main():
    a = sys.argv[1:]
    z = zbierz()
    if "--do" in a:
        dst = os.path.abspath(a[a.index("--do") + 1])
        if os.path.isdir(dst): shutil.rmtree(dst)
        for rel, data in z.pliki.items():
            p = os.path.join(dst, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "wb").write(data)
        for rel in NOWE:
            p = os.path.join(dst, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "wb").write(czytaj(rel))
        print("nakładka w", dst); print("\n".join("  " + x for x in z.raport)); return
    if "--wykonaj" not in a:
        print("podgląd:"); print("\n".join("  " + x for x in z.raport)); return
    if wtyczki.edytor_dziala(): stop("edytor RPG Maker MZ działa - zamknij go (zmieniamy mapę)")
    bk = os.path.join(ARCH, "jarmark_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel in z.pliki:
        src = os.path.join(ROOT, rel)
        if os.path.exists(src): os.makedirs(os.path.dirname(os.path.join(bk, rel)), exist_ok=True); shutil.copy2(src, os.path.join(bk, rel))
    for rel, data in z.pliki.items():
        p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "wb").write(data)
    print("zapisano; kopie w", bk); print("\n".join("  " + x for x in z.raport))
    print("TERAZ: python tools/klimat/ziemia_miasta.py ; python tools/klimat/pogoda_miasta.py ; python tools/drzewa/drzewa.py --mapy 8 --wykonaj ; podbić versionId w data/System.json")

if __name__ == "__main__":
    main()
