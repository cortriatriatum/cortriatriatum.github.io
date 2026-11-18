#!/usr/bin/env python3
"""Approximate local preview of this Jekyll site without Ruby.

GitHub Pages runs the real Jekyll build. This script mimics the subset of Jekyll the site uses
(front matter, layouts, includes, _data, the essays collection, kramdown-style Markdown with footnotes)
so you can check pages and essays before pushing.

    pip install "python-liquid>=3" markdown pyyaml
    python3 tools/preview.py            # builds into _preview/
    python3 tools/preview.py --drafts   # also renders essays marked published: false
    python3 -m http.server -d _preview 8000   then open http://localhost:8000/me/
"""
import argparse, datetime as dt, html, json, os, re, shutil, sys
from pathlib import Path

import markdown
import yaml
from liquid import Environment, FileSystemLoader

ROOT = Path(__file__).resolve().parent.parent
FM = re.compile(r"\A---[ \t]*\n(.*?)^---[ \t]*(?:\n|\Z)", re.S | re.M)
INCLUDE = re.compile(r"{%-?\s*include\s+([\w./-]+)\s*-?%}")


def read(path):
    text = path.read_text(encoding="utf-8")
    m = FM.match(text)
    if not m:
        return None, text
    return (yaml.safe_load(m.group(1)) or {}), text[m.end():]


def jekyll_includes(src):
    return INCLUDE.sub(lambda m: "{% include '" + m.group(1) + "' %}", src)


def to_date(v):
    if isinstance(v, dt.datetime):
        return v
    if isinstance(v, dt.date):
        return dt.datetime(v.year, v.month, v.day)
    if isinstance(v, str):
        try:
            return dt.datetime.fromisoformat(v)
        except ValueError:
            return None
    return None


def md(text):
    return markdown.markdown(
        text,
        extensions=["footnotes", "tables", "fenced_code", "attr_list", "md_in_html", "sane_lists"],
        extension_configs={"footnotes": {"BACKLINK_TEXT": "↩"}},
    )


def build(drafts=False):
    cfg = yaml.safe_load((ROOT / "_config.yml").read_text())
    baseurl = cfg.get("baseurl", "")
    out_root = ROOT / "_preview"
    out = out_root / baseurl.strip("/") if baseurl else out_root
    shutil.rmtree(out_root, ignore_errors=True)
    out.mkdir(parents=True)

    data = {p.stem: yaml.safe_load(p.read_text()) for p in sorted((ROOT / "_data").glob("*.yml"))}

    def relative_url(v):
        v = "" if v is None else str(v)
        if v.startswith(("http://", "https://", "#", "mailto:")):
            return v
        return baseurl.rstrip("/") + "/" + v.lstrip("/")

    def absolute_url(v):
        return cfg["url"].rstrip("/") + relative_url(v)

    def date_to_xml_schema(v):
        d = to_date(v)
        return d.strftime("%Y-%m-%dT%H:%M:%S-08:00") if d else ""

    def where(seq, key, val):
        return [x for x in (seq or []) if isinstance(x, dict) and str(x.get(key)) == str(val)]

    def number_of_words(v):
        return len(re.sub(r"<[^>]+>", " ", str(v)).split())

    def xml_escape(v):
        return html.escape("" if v is None else str(v), quote=True)

    env = Environment(loader=FileSystemLoader(str(ROOT / "_includes")))
    for name, fn in {
        "relative_url": relative_url, "absolute_url": absolute_url, "date_to_xml_schema": date_to_xml_schema,
        "where": where, "number_of_words": number_of_words, "xml_escape": xml_escape,
        "markdownify": md, "jsonify": json.dumps,
    }.items():
        env.filters[name] = (lambda f: lambda _ctx, *a: f(*a))(fn)  # python-liquid 3 passes a FilterContext first

    # Includes use Jekyll's unquoted syntax; rewrite them as they are loaded.
    orig_get_source = env.loader.get_source
    def get_source(e, name, *a, **k):
        src = orig_get_source(e, name, *a, **k)
        src.text = jekyll_includes(src.text)
        return src
    env.loader.get_source = get_source  # type: ignore[assignment]

    layouts = {}
    for p in (ROOT / "_layouts").glob("*.html"):
        fm, body = read(p)
        layouts[p.stem] = (fm or {}, jekyll_includes(body))

    # essays collection
    essays = []
    for p in sorted(q for q in (ROOT / "_essays").glob("*.md") if not q.name.startswith("_")):
        fm, body = read(p)
        fm = fm or {}
        if fm.get("published") is False and not drafts:
            continue
        doc = dict(fm)
        doc.update(url=f"/essays/{p.stem}/", collection="essays", layout=fm.get("layout", "essay"),
                   date=to_date(fm.get("date")), _body=body)
        essays.append(doc)

    site = dict(cfg)
    site.update(data=data, essays=essays, time=dt.datetime.now())

    def render(src, page, content=""):
        return env.parse(jekyll_includes(src)).render({"site": site, "page": page, "content": content})

    def apply_layouts(html_out, page):
        name = page.get("layout")
        while name and name in layouts:
            lfm, lsrc = layouts[name]
            merged = dict(page); merged.update({k: v for k, v in lfm.items() if k not in page and k != "layout"})
            html_out = render(lsrc, merged, html_out)
            name = lfm.get("layout")
        return html_out

    # render essay bodies first so site.essays[*].content exists for lists and the feed
    for e in essays:
        e["content"] = md(render(e["_body"], e))

    def write(url, text):
        target = out / url.lstrip("/")
        if url.endswith("/"):
            target = target / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8")

    if (cfg.get("collections", {}).get("essays") or {}).get("output", True):
        for e in essays:
            write(e["url"], apply_layouts(e["content"], e))

    skip_dirs = {"_layouts", "_includes", "_data", "_essays", "_preview", "_site", ".git", "tools", "node_modules", "vendor"}
    excluded = set(cfg.get("exclude", []))
    for p in ROOT.rglob("*"):
        rel = p.relative_to(ROOT)
        if p.is_dir() or rel.parts[0] in skip_dirs or rel.parts[0].startswith(".") or str(rel) in excluded or rel.parts[0] + "/" in excluded:
            continue
        if p.name in ("_config.yml",):
            continue
        fm, body = (read(p) if p.suffix in (".html", ".md", ".xml", ".txt") else (None, None))
        if fm is None:
            dest = out / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dest)
            continue
        url = fm.get("permalink") or "/" + str(rel).replace("index.html", "").replace(".md", "/")
        page = dict(fm); page["url"] = url
        page.setdefault("layout", "default")
        if page["layout"] in (None, "null"):
            page["layout"] = None
        content = render(body, page)
        if p.suffix == ".md":
            content = md(content)
        write(url, apply_layouts(content, page) if page["layout"] else content)

    print(f"Built {len(essays)} essay(s) into {out_root}. Serve with: python3 -m http.server -d {out_root} 8000")
    return out_root


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--drafts", action="store_true", help="render essays marked published: false")
    build(ap.parse_args().drafts)
