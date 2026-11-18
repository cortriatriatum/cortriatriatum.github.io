#!/usr/bin/env python3
"""Make a link-preview card (1200 x 630 PNG) for each essay, styled as an MTA station sign.

    python3 tools/og_cards.py            # writes img/og/<essay>.png for every essay

Each essay's front matter sets `route` (letter), `route_color`, `route_text`, and `image: /img/og/<essay>.png`.
Run it after adding or retitling an essay. Needs PyMuPDF and PyYAML.
"""
import re
from pathlib import Path

import fitz  # PyMuPDF
import yaml

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "img" / "og"
W, H = 1200, 630
FM = re.compile(r"\A---[ \t]*\n(.*?)^---[ \t]*\n", re.S | re.M)
SUP = Path("/System/Library/Fonts/Supplemental")
# Arial covers curly quotes and dashes; the built-in Helvetica (Latin-1 only) is the fallback.
FONTS = {"bold": SUP / "Arial Bold.ttf", "reg": SUP / "Arial.ttf"}
HAVE = all(f.exists() for f in FONTS.values())
F = {k: fitz.Font(fontfile=str(v)) if HAVE else fitz.Font("hebo" if k == "bold" else "helv") for k, v in FONTS.items()}


def txt(s):
    return s if HAVE else s.replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')


def font_kw(kind):
    if HAVE:
        return dict(fontname=kind, fontfile=str(FONTS[kind]))
    return dict(fontname="hebo" if kind == "bold" else "helv")


def put(page, x, y, s, kind, size, color):
    page.insert_text(fitz.Point(x, y), txt(s), fontsize=size, color=color, **font_kw(kind))


def width(s, kind, size):
    return F[kind].text_length(txt(s), fontsize=size)


def rgb(hex_color):
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def card(fm, out):
    doc = fitz.open()
    page = doc.new_page(width=W, height=H)
    page.draw_rect(page.rect, color=None, fill=rgb("#111111"))                         # black sign face
    page.draw_rect(fitz.Rect(0, 0, W, 14), color=None, fill=rgb("#FFFFFF"))            # white top band
    page.draw_rect(fitz.Rect(0, H - 14, W, H), color=None, fill=rgb(fm.get("route_color", "#00933C")))  # route-colour base
    # route bullet
    cx, cy, r = 130, 150, 62
    page.draw_circle(fitz.Point(cx, cy), r, color=None, fill=rgb(fm.get("route_color", "#00933C")))
    letter, fs = str(fm.get("route", "W")), 78
    put(page, cx - width(letter, "bold", fs) / 2, cy + fs * 0.36, letter, "bold", fs, rgb(fm.get("route_text", "#FFFFFF")))
    # kicker
    d = fm["date"]
    put(page, 222, 140, "ESSAY", "bold", 26, rgb("#BFBFBF"))
    put(page, 222, 176, f"{d:%B} {d.day}, {d.year}".upper(), "reg", 24, rgb("#BFBFBF"))
    # title: largest size that fits the box
    box = fitz.Rect(70, 245, W - 70, 520)
    kw = font_kw("bold")
    for size in (64, 58, 52, 46, 42):
        pg = fitz.open().new_page(width=W, height=H)
        if pg.insert_textbox(box, txt(fm["title"]), fontsize=size, lineheight=1.12, **kw) >= 0:
            break
    page.insert_textbox(box, txt(fm["title"]), fontsize=size, lineheight=1.12, color=rgb("#FFFFFF"), **kw)
    # footer
    put(page, 70, H - 48, "Rick Mathews, PhD", "bold", 26, rgb("#FFFFFF"))
    site = "cortriatriatum.github.io"
    put(page, W - 70 - width(site, "reg", 24), H - 48, site, "reg", 24, rgb("#BFBFBF"))
    page.get_pixmap(dpi=72, alpha=False).save(str(out))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for md in sorted((ROOT / "_essays").glob("*.md")):
        if md.name.startswith("_"):
            continue
        fm = yaml.safe_load(FM.match(md.read_text(encoding="utf-8")).group(1))
        if fm.get("published") is False:
            continue
        out = OUT / f"{md.stem}.png"
        card(fm, out)
        print(f"wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
