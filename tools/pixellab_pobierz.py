# Pobiera gotowe obrazki z PixelLab po job_id (czeka, gdy jeszcze się robią: 423 + Retry-After).
# Użycie: python tools/pixellab_pobierz.py <folder> <nazwa>=<job_id>[:<index>] ...
#   index - n-ty obrazek zadania z wieloma (create_image_pro daje zestaw kandydatów)
# Zapisuje <folder>/<nazwa>.png; na końcu wypisuje, co się udało.
import sys, os, time, urllib.request, urllib.error

def pobierz(job, index, cel, czekaj=600):
    url = "https://api.pixellab.ai/mcp/images/" + job + "/download" + ("?index=%d" % index if index is not None else "")
    t0 = time.time()
    while time.time() - t0 < czekaj:
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "tawerna-tools"}), timeout=60) as r:
                data = r.read()
            open(cel, "wb").write(data)
            return True
        except urllib.error.HTTPError as e:
            if e.code == 423:
                time.sleep(int(e.headers.get("Retry-After") or 5))
                continue
            print("BŁĄD", job, e.code)
            return False
        except Exception as e:
            print("BŁĄD", job, e)
            time.sleep(5)
    print("ZA DŁUGO", job)
    return False

if __name__ == "__main__":
    folder = sys.argv[1]
    os.makedirs(folder, exist_ok=True)
    ok = []
    for arg in sys.argv[2:]:
        name, job = arg.split("=", 1)
        index = None
        if ":" in job:
            job, index = job.split(":", 1)
            index = int(index)
        if pobierz(job, index, os.path.join(folder, name + ".png")):
            ok.append(name)
    print("pobrane:", " ".join(ok))
