#!/usr/bin/env python3
"""Build an essay's PDF from its Markdown file, locally, with no LaTeX install.

    python3 tools/essay-pdf/build_pdf.py _essays/<name>.md [...]   # writes docs/essays/<pdf name>.pdf

Typesetting copies the LaTeX layout of the original PDFs: US letter, 0.7in/0.75in top/bottom and 1in side
margins, Latin Modern (fonts/, GUST Font License), a centered 21pt title block, 13pt text on 18.85pt
leading with 6.5pt between paragraphs and a 1.5em first-line indent, ragged right. Then come the closing
note and bio, the numbered references with their verbatim quotes, and, when the essay has `original:`,
a last page with the editing note and the unedited original. Reference numbers link to the list; web
links stay clickable. Needs PyMuPDF (`pip install pymupdf`) and PyYAML.

tools/essay-pdf/md2tex.py writes the same essay as LaTeX, for anyone who would rather compile with xelatex.
"""
import datetime as dt, html, re, sys
from pathlib import Path

import fitz  # PyMuPDF
import yaml

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
FM = re.compile(r"\A---[ \t]*\n(.*?)^---[ \t]*\n", re.S | re.M)
PAGE = fitz.paper_rect("letter")
MARGIN = (72, 38, 72, 54)  # left, top, right, bottom: 1in sides, 0.75in bottom; top trimmed so the
# title sits where LaTeX puts it at 0.7in (Story adds its own space above the first line)
SITE = "https://cortriatriatum.github.io/me/"

CSS = """
@font-face { font-family: LM; src: url(LM-regular.ttf); }
@font-face { font-family: LM; src: url(LM-italic.ttf); font-style: italic; }
@font-face { font-family: LM; src: url(LM-bold.ttf); font-weight: bold; }
@font-face { font-family: LM; src: url(LM-bold-italic.ttf); font-weight: bold; font-style: italic; }
* { font-family: LM; }
body { font-size: 13pt; line-height: 18.85pt; color: #000; }
a { color: #000; text-decoration: none; }
p { margin: 0 0 6.5pt 0; text-indent: 19.5pt; text-align: left; }
.title { font-size: 21pt; line-height: 25.2pt; font-weight: bold; text-align: center; text-indent: 0; margin: 0 0 9pt 0; }
.author { font-size: 14.4pt; line-height: 18pt; text-align: center; text-indent: 0; margin: 0 0 3pt 0; }
.date { font-size: 10.95pt; line-height: 13.6pt; text-align: center; text-indent: 0; margin: 0 0 6pt 0; }
.rule { border-top: 0.4pt solid #999; margin: 0 0 6pt 0; font-size: 1pt; line-height: 1pt; }
.short-rule { border-top: 0.4pt solid #999; width: 30%; margin: 14pt 0 6pt 0; font-size: 1pt; line-height: 1pt; }
.coda { font-size: 11.7pt; line-height: 16.38pt; text-indent: 0; margin: 0 0 5pt 0; }
.refs-h { font-size: 10.5pt; line-height: 13.5pt; font-weight: bold; text-indent: 0; margin: 12pt 0 4pt 0; }
.ref { font-size: 10.5pt; line-height: 13.5pt; text-indent: 0; margin: 0 0 5pt 0; }
.q { color: #4d4d4d; }
.where { color: #4d4d4d; font-size: 9pt; }
.copy { font-size: 10pt; text-align: center; text-indent: 0; margin: 10pt 0 0 0; }
.h { font-size: 11.7pt; line-height: 16.38pt; font-weight: bold; text-indent: 0; margin: 0 0 4pt 0; }
.note { font-size: 11.7pt; line-height: 16.38pt; text-indent: 0; margin: 0 0 10pt 0; }
sup { font-size: 8pt; }
"""


def as_date(v):
    return v if isinstance(v, dt.date) else dt.date.fromisoformat(str(v))


def date_line(v):
    d = as_date(v)
    suf = "th" if 11 <= d.day <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(d.day % 10, "th")
    return f"{d:%B} {d.day}<sup>{suf}</sup>, {d.year}"


def inline(h):
    """Essay HTML -> the subset Story renders. Claim and edit spans are web-only."""
    h = re.sub(r'<sup class="ref"><a href="#ref-([\w-]+)">(\d+)</a></sup>', r'<sup><a href="#ref-\1">\2</a></sup>', h)
    h = h.replace('<sup class="ref">,</sup>', "<sup>,</sup>")
    h = re.sub(r"</?span[^>]*>", "", h)
    h = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", h)  # Markdown italics in the closing note
    h = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", lambda m: '<a href="%s">%s</a>' % (
        SITE + m.group(2).split("/me/", 1)[-1] if m.group(2).startswith("/me/") else m.group(2), m.group(1)), h)
    return h


def split_body(body):
    paras = [inline(p) for p in re.findall(r"<p[^>]*>(.*?)</p>", body, re.S)]
    rest = re.sub(r"<p[^>]*>.*?</p>", "", body, flags=re.S).strip()
    return paras, [inline(x.strip()) for x in rest.split("\n\n") if x.strip()]


def esc(s):
    return html.escape(s, quote=False)


def page_html(fm, paras, coda):
    year = as_date(fm["date"]).year
    out = [f'<p class="title">{esc(fm["title"])}</p>', '<p class="author">Rick Mathews, PhD</p>',
           f'<p class="date">{date_line(fm["date"])}</p>', '<div class="rule">&nbsp;</div>']
    out += [f"<p>{p}</p>" for p in paras]
    out.append('<div class="short-rule">&nbsp;</div>')
    for c in coda:
        if c.startswith("<i>"):  # contact line: show the site address, as in the original PDF
            c = re.sub(r'<a href="([^"]+)">([^<]+)</a>', r'\2: <a href="\1">cortriatriatum.github.io/me</a>', c)
            c = c.replace("get in touch: <a", "get in touch: </i><a").replace("</a>.</i>", "</a>.")
        out.append(f'<p class="coda">{c}</p>')
    refs = fm.get("references") or []
    if refs:
        out.append('<div id="refs-start">')
        out.append('<p class="refs-h">References</p>')
        for i, r in enumerate(refs, 1):
            q = (f'<br/><span class="q"><i>“{esc(r["quote"])}”</i></span> <span class="where">({esc(r.get("where", ""))})</span>'
                 if r.get("quote") else '<br/><span class="where">No verbatim excerpt attached.</span>')
            url = r["url"]
            out.append(f'<p class="ref" id="ref-{r["id"]}">{i}. {r["cite"]} <a href="{url}">{esc(url.replace("https://", ""))}</a>{q}</p>')
            KEEP_IDS.add(f"ref-{r['id']}")
            if i == 1:
                out.append("</div>")
        KEEP_IDS.add("refs-start")
    if not fm.get("original"):
        out.append(f'<p class="copy">© {year} Rick Mathews. All rights reserved.</p>')
    return "\n".join(out)


def provenance_html(fm):
    year = as_date(fm["date"]).year
    head = "Original version"
    if fm.get("original_title"):
        head += f': <i>{esc(fm["original_title"])}</i>'
    if fm.get("original_date"):
        head += ", " + date_line(fm["original_date"])
    out = ['<p class="h">How this was edited</p>', f'<p class="note">{esc(fm.get("editing", ""))} '
           f'A web version with every change marked is at {SITE}essays/.</p>',
           '<div class="rule">&nbsp;</div>', f'<p class="h">{head}. Unedited.</p>']
    out += [f"<p>{esc(p.strip())}</p>" for p in fm["original"].split("\n\n") if p.strip()]
    out.append(f'<p class="copy">© {year} Rick Mathews. All rights reserved.</p>')
    return "\n".join(out)


LINK = 'style="color:#000;text-decoration:none"'  # links stay clickable but print like LaTeX's hidelinks


def render(markup, path):
    """Lay out the markup. Blocks marked keep="1" (each reference, and the References heading together with
    the first reference) never split across a page: any that would are pushed to the next page and the
    layout is redone, like LaTeX's \\needspace."""
    markup = markup.replace("<a href=", f"<a {LINK} href=")
    where = fitz.Rect(PAGE.x0 + MARGIN[0], PAGE.y0 + MARGIN[1], PAGE.x1 - MARGIN[2], PAGE.y1 - MARGIN[3])
    push = {}  # id -> extra top margin in points
    for _ in range(40):
        m = markup
        for i, pts in push.items():
            m = m.replace(f'id="{i}"', f'id="{i}" style="margin-top:{pts:.1f}pt"', 1)
        story = fitz.Story(html=f"<html><body>{m}</body></html>", user_css=CSS, archive=fitz.Archive(str(HERE / "fonts")))
        seen = {}

        def pos(p):
            if getattr(p, "id", "") and p.id in KEEP_IDS:
                seen.setdefault(p.id, []).append((p.page_num, fitz.Rect(p.rect)))
        doc = story.write_with_links(lambda n, filled: (PAGE, where, None), positionfn=pos)
        # A block that splits is reported clipped at the bottom margin, so a block reaching the margin is moved.
        split = next(((i, v) for i, v in seen.items() if v[0][1].y1 > where.y1 - 10), None)
        if not split:
            doc.save(str(path))
            return
        i, v = split
        push[i] = push.get(i, 0) + (where.y1 - v[0][1].y0) + 2
    doc.save(str(path))


KEEP_IDS = set()


def main(md_path):
    text = Path(md_path).read_text(encoding="utf-8")
    m = FM.match(text)
    fm, body = yaml.safe_load(m.group(1)), text[m.end():]
    paras, coda = split_body(body)
    year = as_date(fm["date"]).year
    small = {"and", "or", "of", "the", "for", "a", "an", "in", "on", "to"}
    name = Path(fm["pdf"]).stem if fm.get("pdf") else "Mathews_%d_%s" % (year, "_".join(
        w if (w in small and i) else w.capitalize() for i, w in enumerate(Path(md_path).stem.split("-"))))
    out = ROOT / "docs" / "essays" / f"{name}.pdf"
    tmp_main, tmp_prov = out.with_suffix(".main.tmp.pdf"), out.with_suffix(".prov.tmp.pdf")
    render(page_html(fm, paras, coda), tmp_main)
    doc = fitz.open(tmp_main)
    if fm.get("original"):
        render(provenance_html(fm), tmp_prov)
        doc.insert_pdf(fitz.open(tmp_prov))
    plain_title = re.sub(r"<[^>]+>", "", fm["title"])
    doc.set_metadata({"title": plain_title, "author": "Rick Mathews, PhD", "subject": "Essay",
                      "keywords": fm.get("keywords", "essay"), "creator": "Rick Mathews",
                      "producer": "PyMuPDF (tools/essay-pdf/build_pdf.py)",
                      "creationDate": fitz.get_pdf_now(), "modDate": fitz.get_pdf_now()})
    doc.save(str(out), garbage=3, deflate=True)
    pages = doc.page_count
    doc.close()
    for t in (tmp_main, tmp_prov):
        t.unlink(missing_ok=True)
    print(f"wrote {out.relative_to(ROOT)} ({pages} pages)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for a in sys.argv[1:]:
        if not Path(a).name.startswith("_"):
            main(a)
