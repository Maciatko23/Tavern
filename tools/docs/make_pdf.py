# Robi ładny PDF z docs/FABULA_I_PRZEJSCIE.md: Markdown -> HTML (czcionki gry, okładka z ekranu tytułowego, kilka obrazków) ->
# PDF przez Edge bez okna (--print-to-pdf). Uruchom: python tools/docs/make_pdf.py  (wynik: docs/FABULA_I_PRZEJSCIE.pdf)
import os, sys, subprocess, datetime, pathlib
import markdown
from markdown.extensions.toc import slugify_unicode

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "FABULA_I_PRZEJSCIE.md"
OUT_HTML = ROOT / "tools" / "docs" / "_przejscie.html"   # (temporary: absolute file:// paths; deleted after printing)
OUT_PDF = ROOT / "docs" / "FABULA_I_PRZEJSCIE.pdf"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def uri(p):
    return (ROOT / p).resolve().as_uri()

# obrazki wstawiane pod nagłówkami sekcji (nagłówek -> (plik, podpis))
IMAGES = {
    "4. Prolog: „Ostatni prom”": ("img/pictures/Prolog_Wies.png", "Prolog: płonąca Brzozowa Wola"),
    "7. Wyspa: przystań i sześć miejsc na wybrzeżu": ("docs/miejsca_wyspy/polozenie.png", "Położenie miejsc na Kruczej Wyspie"),
    "10. Akt III: napad na tawernę": ("docs/zwierzeta_ludzie/wilki_przy_ognisku.png", "Noc na wyspie: ogień trzyma wilki z daleka"),
}

text = SRC.read_text(encoding="utf-8")
# pierwsza linia (# tytuł) i podtytuł idą na okładkę
lines = text.splitlines()
import re
LIST = re.compile(r"^\s*(- |\d+\. |\||> )")
body_lines = []
for l in lines[1:]:
    # Python-Markdown wants 4 spaces for a nested list (GitHub takes 2) and a blank line before a list after a paragraph
    n = len(l) - len(l.lstrip(" "))
    if n:
        l = " " * (n * 2) + l.lstrip(" ")
    if LIST.match(l) and not l.startswith(" ") and body_lines and body_lines[-1].strip() and not LIST.match(body_lines[-1]) \
            and not body_lines[-1].startswith(" "):
        body_lines.append("")
    body_lines.append(l)
body = "\n".join(body_lines)
for head, (img, cap) in IMAGES.items():
    if (ROOT / img).exists():
        body = body.replace("## " + head + "\n", "## " + head + "\n\n<figure><img src=\"" + uri(img) + "\"><figcaption>" + cap + "</figcaption></figure>\n", 1)

html_body = markdown.markdown(body, extensions=["tables", "toc", "sane_lists"],
                              extension_configs={"toc": {"slugify": slugify_unicode}})

fonts = {n: uri("fonts/" + f) for n, f in {
    "pirata": "PirataOne-Regular.ttf", "garamond": "EBGaramond-Variable.ttf",
    "sans": "AlegreyaSans-Regular.ttf", "sansb": "AlegreyaSans-Bold.ttf", "sansm": "AlegreyaSans-Medium.ttf", "sc": "AlegreyaSansSC-Medium.ttf"}.items()}
cover = uri("img/titles1/Tawerna_Title_Kufel.png")
today = datetime.date.today().strftime("%d.%m.%Y")

CSS = f"""
@font-face {{ font-family: Pirata; src: url('{fonts['pirata']}'); }}
@font-face {{ font-family: Garamond; src: url('{fonts['garamond']}'); }}
@font-face {{ font-family: Sans; src: url('{fonts['sans']}'); font-weight: 400; }}
@font-face {{ font-family: Sans; src: url('{fonts['sansm']}'); font-weight: 500; }}
@font-face {{ font-family: Sans; src: url('{fonts['sansb']}'); font-weight: 700; }}
@font-face {{ font-family: SansSC; src: url('{fonts['sc']}'); }}
@page {{ size: A4; margin: 18mm 17mm 20mm 17mm;
  @bottom-center {{ content: counter(page); font-family: Garamond; font-size: 10pt; color: #9a6b3f; }}
  @top-right {{ content: "Tawerna · fabuła i przejście"; font-family: SansSC; font-size: 8pt; color: #b99b78; }} }}
@page :first {{ margin: 0; @bottom-center {{ content: none; }} @top-right {{ content: none; }} }}
html {{ background: #ffffff; }}
body {{ font-family: Sans, sans-serif; font-size: 10.6pt; line-height: 1.48; color: #2b241c; margin: 0; }}
.cover {{ height: 297mm; width: 210mm; position: relative; overflow: hidden; page-break-after: always;
  background: #120d09 url('{cover}') center/cover no-repeat; }}
.cover::after {{ content: ""; position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(10,7,4,.92) 0%, rgba(10,7,4,.72) 45%, rgba(10,7,4,.15) 100%); }}
.cover .in {{ position: absolute; z-index: 2; left: 18mm; top: 70mm; width: 120mm; }}
.cover h1 {{ font-family: Pirata; font-weight: 400; font-size: 64pt; margin: 0; color: #f0c26a;
  text-shadow: 0 2px 0 #5a3611, 0 0 18px rgba(255,190,90,.35); letter-spacing: 1px; }}
.cover .rule {{ height: 1.5px; width: 95mm; background: linear-gradient(90deg, #d9a55a, transparent); margin: 4mm 0 5mm; }}
.cover .sub {{ font-family: Garamond; font-size: 20pt; color: #f3e6cf; }}
.cover .sub2 {{ font-family: Garamond; font-style: italic; font-size: 12.5pt; color: #cdb48f; margin-top: 3mm; }}
.cover .meta {{ position: absolute; z-index: 2; left: 18mm; bottom: 16mm; font-family: SansSC; font-size: 9pt; color: #b99b78; letter-spacing: 1px; }}
h2 {{ font-family: Pirata; font-weight: 400; font-size: 25pt; color: #8a4a1f; margin: 0 0 3mm; page-break-before: always;
  border-bottom: 1.5px solid #d9b07a; padding-bottom: 1.5mm; }}
h3 {{ font-family: Garamond; font-weight: 700; font-size: 14.5pt; color: #6b3a17; margin: 6mm 0 2mm; page-break-after: avoid; }}
h4 {{ font-family: Garamond; font-size: 12pt; color: #6b3a17; margin: 4mm 0 1mm; }}
p {{ margin: 0 0 2.2mm; }}
em {{ color: #6e5a43; }}
strong {{ color: #1f1912; }}
a {{ color: #8a4a1f; text-decoration: none; }}
ul, ol {{ margin: 0 0 2.5mm; padding-left: 6mm; }}
li {{ margin: 0.6mm 0; }}
li::marker {{ color: #b0743c; }}
hr {{ display: none; }}
blockquote {{ margin: 3mm 0; padding: 2.5mm 4mm; background: #f2e7d4; border-left: 3px solid #c48a4a; font-family: Garamond;
  font-size: 11.5pt; font-style: italic; color: #4a3b2a; border-radius: 0 4px 4px 0; }}
blockquote p {{ margin: 0 0 1mm; }}
table {{ border-collapse: collapse; width: 100%; margin: 2.5mm 0 4mm; font-size: 9.6pt; page-break-inside: avoid; }}
th {{ background: #7a4520; color: #fbefdc; font-family: SansSC; font-weight: 400; letter-spacing: .3px; text-align: left; padding: 1.6mm 2.4mm; }}
td {{ padding: 1.5mm 2.4mm; border-bottom: 1px solid #e3d3bb; vertical-align: top; }}
tr:nth-child(even) td {{ background: #f4ecdf; }}
code {{ font-family: Consolas, monospace; font-size: 9pt; background: #efe4d1; padding: 0 1mm; border-radius: 2px; color: #5b3a1e; }}
figure {{ margin: 2mm 0 5mm; page-break-inside: avoid; }}
figure img {{ width: 100%; border-radius: 5px; border: 1px solid #d9c2a2; box-shadow: 0 1.5mm 3mm rgba(60,35,10,.18); }}
figcaption {{ font-family: Garamond; font-style: italic; font-size: 9.5pt; color: #8a6d4c; text-align: center; margin-top: 1.5mm; }}
/* spis treści: pierwsza lista po "Spis treści" */
h2#spis-treści {{ page-break-before: avoid; }}
h2#spis-treści + ol {{ font-family: Garamond; font-size: 13pt; columns: 1; }}
h2#spis-treści + ol li {{ margin: 1.6mm 0; border-bottom: 1px dotted #d9c2a2; padding-bottom: 1mm; }}
.lead {{ font-family: Garamond; font-style: italic; font-size: 11pt; color: #6e5a43; margin-bottom: 5mm; }}
"""

intro, _, rest = html_body.partition("<h2")
rest = "<h2" + rest if rest else ""
html = f"""<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Tawerna — fabuła i pełne przejście</title><style>{CSS}</style></head>
<body>
<section class="cover"><div class="in"><h1>Tawerna</h1><div class="rule"></div>
<div class="sub">Fabuła i pełne przejście</div>
<div class="sub2">„Pod Złotym Kuflem” · Krucza Wyspa</div></div>
<div class="meta">STAN GRY NA {today}</div></section>
<div class="lead">{intro}</div>
{rest}
</body></html>"""
OUT_HTML.write_text(html, encoding="utf-8")

cmd = [EDGE, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=8000",
       "--allow-file-access-from-files", f"--print-to-pdf={OUT_PDF}", OUT_HTML.resolve().as_uri()]
subprocess.run(cmd, check=True, timeout=180, capture_output=True)
OUT_HTML.unlink(missing_ok=True)
print("PDF:", OUT_PDF, OUT_PDF.stat().st_size // 1024, "KB")
