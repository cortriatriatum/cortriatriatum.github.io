#!/usr/bin/env python3
"""Write the LaTeX source for an essay's PDF from its Markdown file, so the web page and the PDF share one text.

    python3 tools/essay-pdf/md2tex.py _essays/<name>.md      # writes tools/essay-pdf/<pdf name>.tex
    cd tools/essay-pdf && latexmk -xelatex <pdf name>.tex     # MacTeX; then copy the PDF to docs/essays/

Layout matches the original Medicine's Missing Experiments PDF: centered title block, 13pt Latin Modern,
ragged right. Added: numbered reference marks that link to a reference list carrying each verbatim quote,
and, when the essay has `original:` in its front matter, a final page with the editing note and the
unedited original. Needs PyYAML.
"""
import datetime as dt, html, re, sys
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
FM = re.compile(r"\A---[ \t]*\n(.*?)^---[ \t]*\n", re.S | re.M)

CHARS = {"“": "``", "”": "''", "‘": "`", "’": "'", "–": "--", "—": "---", "…": "\\ldots{}",
         "č": "\\v{c}", "è": "\\`{e}", "é": "\\'{e}", "ü": '\\"{u}', "ö": '\\"{o}', "\u00a0": "~"}


def esc(s):
    s = html.unescape(s)
    s = re.sub(r"([&%$#_{}])", r"\\\1", s)
    s = s.replace("~", "\\textasciitilde{}").replace("^", "\\textasciicircum{}")
    for k, v in CHARS.items():
        s = s.replace(k, v)
    return s


def inline(h, nums):
    """Essay HTML/Markdown paragraph -> LaTeX. Claim and edit spans are web-only and drop out."""
    h = re.sub(r'<sup class="ref"><a href="#ref-([\w-]+)">\d+</a></sup>',
               lambda m: "\x00REF%s\x00" % m.group(1), h)
    h = h.replace('<sup class="ref">,</sup>', "\x00COMMA\x00")
    links = []
    def keep_link(m):
        links.append((m.group(1), m.group(2)))
        return "\x00A%d\x00" % (len(links) - 1)
    h = re.sub(r'<a href="([^"]+)">(.*?)</a>', keep_link, h)
    h = re.sub(r"<i>(.*?)</i>|<em>(.*?)</em>", lambda m: "\x00I\x00%s\x00/I\x00" % (m.group(1) or m.group(2)), h)
    h = re.sub(r"\*([^*]+)\*", lambda m: "\x00I\x00%s\x00/I\x00" % m.group(1), h)
    h = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1", h)  # markdown links -> text
    h = re.sub(r"</?(span|p)[^>]*>", "", h)
    out = esc(h)
    out = re.sub(r"\x00REF([\w-]+)\x00",
                 lambda m: "\\textsuperscript{\\hyperlink{ref-%s}{%d}}" % (m.group(1), nums[m.group(1)]), out)
    out = re.sub(r"\x00A(\d+)\x00", lambda m: "\\href{%s}{%s}" % (
        links[int(m.group(1))][0].replace("%", "\\%").replace("#", "\\#"),
        inline(links[int(m.group(1))][1], nums)), out)
    out = out.replace("\x00COMMA\x00", "\\textsuperscript{,}")
    return out.replace("\x00I\x00", "\\textit{").replace("\x00/I\x00", "}")


def paragraphs(body):
    body = body.strip()
    paras = re.findall(r"<p[^>]*>(.*?)</p>", body, re.S)
    rest = re.sub(r"<p[^>]*>.*?</p>", "", body, flags=re.S).strip()
    return paras, [x.strip() for x in rest.split("\n\n") if x.strip()]


def date_line(d):
    d = d if isinstance(d, dt.date) else dt.date.fromisoformat(str(d))
    suf = "th" if 11 <= d.day <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(d.day % 10, "th")
    return f"{d:%B} {d.day}\\textsuperscript{{{suf}}}, {d.year}"


def main(md_path):
    text = Path(md_path).read_text(encoding="utf-8")
    m = FM.match(text)
    fm, body = yaml.safe_load(m.group(1)), text[m.end():]
    refs = fm.get("references") or []
    nums = {r["id"]: i + 1 for i, r in enumerate(refs)}
    paras, tail = paragraphs(body)
    title = esc(fm["title"])
    year = (fm["date"] if isinstance(fm["date"], dt.date) else dt.date.fromisoformat(str(fm["date"]))).year
    small = {"and", "or", "of", "the", "for", "a", "an", "in", "on", "to"}
    pdf_name = Path(fm["pdf"]).stem if fm.get("pdf") else "Mathews_%d_%s" % (year, "_".join(
        w if (w in small and i) else w.capitalize() for i, w in enumerate(Path(md_path).stem.split("-"))))

    L = []
    w = L.append
    w(f"% {fm['title']}\n% Copyright (c) {year} Rick Mathews. All rights reserved.\n")
    w(f"% Generated from {Path(md_path).as_posix()} by tools/essay-pdf/md2tex.py; edit the Markdown, not this file.\n")
    w("% Build: latexmk -xelatex <this file>\n")
    w(r"""\documentclass[12pt]{article}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage[final]{microtype}
\usepackage[letterpaper,top=0.7in,bottom=0.75in,left=1in,right=1in]{geometry}
\usepackage{ragged2e}
\usepackage{xcolor}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{hyperxmp}
""")
    w("\\hypersetup{\n  pdftitle={%s},\n" % esc(fm["title"]).replace("``", "").replace("''", ""))
    w("""  pdfauthor={Rick Mathews, PhD},
  pdfsubject={Essay},
  pdfkeywords={%s},
  pdfcopyright={Copyright (C) %d Rick Mathews. All rights reserved.},
  pdfcontacturl={https://cortriatriatum.github.io/me/},
  pdflang={en-US},
  pdfcreator={Rick Mathews},
  pdfproducer={LaTeX}
}
""" % (esc(fm.get("keywords", "essay")), year))
    w(r"""\definecolor{rule}{gray}{0.6}
\definecolor{quote}{gray}{0.3}
\pagestyle{empty}
% Ragged right: lines run the full measure without stretched word spacing.
\setlength{\RaggedRightParindent}{1.5em}
\setlength{\RaggedRightRightskip}{0pt plus 2em}
\setlength{\emergencystretch}{1.5em}
\tolerance=1000
\hyphenpenalty=1000 % no words split across lines
\widowpenalty=10000 % no single lines stranded at the top or bottom of a page
\clubpenalty=10000
\begin{document}
\special{pdf:docinfo << /Author (Rick Mathews, PhD) >>}% hyperxmp drops the Author field
\RaggedRight
\begin{center}
""")
    w("  {\\fontsize{21}{25.2}\\selectfont\\bfseries %s\\par}\n" % title)
    w("  \\vspace{9pt}\n  {\\large Rick Mathews, PhD\\par}\n  \\vspace{3pt}\n")
    w("  {\\small %s\\par}\n\\end{center}\n" % date_line(fm["date"]))
    w("\\vspace{2pt}\n{\\color{rule}\\noindent\\rule{\\textwidth}{0.4pt}}\\par\n\\vspace{-4pt}\n\n")
    w("\\fontsize{13.0}{18.85}\\selectfont\n\\setlength{\\parskip}{6.5pt}\n")
    for p in paras:
        w(inline(p, nums) + "\n\n")

    # closing note and bio (the Markdown lines after the last paragraph)
    w("\\vspace{14pt}\n{\\color{rule}\\noindent\\rule{0.3\\textwidth}{0.4pt}}\n\\vspace{4pt}\n\n")
    w("{\\fontsize{11.7}{16.38}\\selectfont\\setlength{\\parindent}{0pt}\\setlength{\\parskip}{5pt}\n")
    for t in tail:
        if t.startswith("*"):
            msg = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", t.strip("*")).rstrip(".")
            w("{\\itshape %s: \\href{https://cortriatriatum.github.io/me/\\#contact}{\\upshape cortriatriatum.github.io/me}.}\n\n" % esc(msg))
        else:
            w(esc(t) + "\n\n")
    w("}\n")

    if refs:
        w("\n\\vspace{12pt}\n{\\fontsize{10.5}{13.5}\\selectfont\\setlength{\\parskip}{0pt}\n")
        w("\\noindent{\\bfseries References}\\par\\vspace{4pt}\n")
        w("\\begin{enumerate}[leftmargin=1.8em,itemsep=5pt,topsep=0pt,label=\\arabic*.]\n")
        for r in refs:
            w("\\item \\hypertarget{ref-%s}{}%s \\url{%s}" % (r["id"], inline(r["cite"], nums), r["url"]))
            if r.get("quote"):
                w("\\\\[1pt]{\\color{quote}\\itshape ``%s''}~{\\color{quote}\\footnotesize(%s)}" % (esc(r["quote"]), esc(r.get("where", ""))))
            else:
                w("\\\\[1pt]{\\color{quote}\\footnotesize No verbatim excerpt attached.}")
            w("\n")
        w("\\end{enumerate}\n}\n")

    if fm.get("original"):
        w("\n\\clearpage\n{\\fontsize{11.7}{16.38}\\selectfont\\setlength{\\parindent}{0pt}\\setlength{\\parskip}{6pt}\n")
        w("\\noindent{\\bfseries How this was edited}\\par\n%s\\par\n\\vspace{10pt}\n" % esc(fm.get("editing", "")))
        head = "Original version"
        if fm.get("original_title"):
            head += ": \\textit{%s}" % esc(fm["original_title"])
        if fm.get("original_date"):
            head += ", " + date_line(fm["original_date"])
        w("{\\color{rule}\\noindent\\rule{\\textwidth}{0.4pt}}\\par\n")
        w("\\noindent{\\bfseries %s.} Unedited.\\par\n}\n" % head)
        w("\\fontsize{13.0}{18.85}\\selectfont\\setlength{\\parskip}{6.5pt}\n")
        for p in [x.strip() for x in fm["original"].split("\n\n") if x.strip()]:
            w(inline(p, nums) + "\n\n")

    w("\n\\vspace{10pt}\n{\\centering\\footnotesize \\copyright\\ %d Rick Mathews. All rights reserved.\\par}\n" % year)
    w("\\end{document}\n")

    out = HERE / f"{pdf_name}.tex"
    out.write_text("".join(L), encoding="utf-8")
    print(f"wrote {out.relative_to(HERE.parent.parent)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for a in sys.argv[1:]:
        if not Path(a).name.startswith("_"):  # skip _template.md
            main(a)
