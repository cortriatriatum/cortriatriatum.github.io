#!/usr/bin/env python3
"""Sanity checks on a built site (the Jekyll output folder). Standard library only.

    python3 tools/check_site.py _site       # in CI, after the Pages build
    python3 tools/check_site.py _preview    # locally, after tools/preview.py

Checks every HTML page outside the me/ redirect stubs:
  - it has a <title>, and a canonical link unless it is the 404 page;
  - every JSON-LD block parses;
  - images carry alt text;
  - no link or asset points at the old /me/ address or at localhost;
  - every internal link and asset resolves to a file in the build (anchors included, for same-page links);
  - Cite and Share: the #citable registry parses, every data-cite-id / data-cite-panel / data-share on the
    page names an entry in it, and every entry has what the citation formats need.
Exits 1 and lists the problems if any check fails.
"""
import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

SITE_HOSTS = {"cortriatriatum.github.io"}
# Other GitHub Pages project sites served under this host from their own repositories.
OTHER_SITES = ("/lifeinweeks/",)
# Anchors that a page's script handles instead of an element id: index.html opens the Subscribe and Contact dialogs
# and moves to a stop on its loop;
# essay pages open their Markup, Edits, and Provenance tabs.
SCRIPT_ANCHORS = {"subscribe", "markup", "edits", "original",
                  # stops on the home page's loop (assets/world.js) and the contact dialog
                  "contact", "room", "tram", "street", "subway", "notes", "research", "ride", "portland"}


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = None
        self.canonical = None
        self.ids = set()
        self.links = []           # (tag, url)
        self.ld = []
        self.citable = None
        self.cite_refs = []      # ids named by data-cite-id, data-cite-panel, data-share
        self.no_alt = 0
        self._in = None
        self._buf = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        if tag == "a" and a.get("name"):
            self.ids.add(a["name"])
        if tag == "title" or (tag == "script" and a.get("type") == "application/ld+json"):
            self._in, self._buf = tag, []
        if tag == "script" and a.get("id") == "citable":
            self._in, self._buf = "citable", []
        for attr in ("data-cite-id", "data-cite-panel", "data-share"):
            if a.get(attr):
                self.cite_refs.append(a[attr])
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        if tag == "img" and a.get("alt") is None:
            self.no_alt += 1
        for attr in ("href", "src"):
            if a.get(attr) and not (tag == "link" and a.get("rel") in ("preconnect", "dns-prefetch")):
                self.links.append((tag, a[attr]))

    def handle_data(self, data):
        if self._in:
            self._buf.append(data)

    def handle_endtag(self, tag):
        if self._in == tag or (self._in == "citable" and tag == "script"):
            text = "".join(self._buf).strip()
            if tag == "title":
                self.title = text
            elif self._in == "citable":
                self.citable = text
            else:
                self.ld.append(text)
            self._in = None


def target(root, page_path, url):
    """Map an internal URL to (file, fragment), or None for external, mailto, data, etc."""
    parts = urlsplit(url)
    if parts.scheme in ("mailto", "tel", "data", "javascript"):
        return None
    if parts.scheme in ("http", "https"):
        if parts.netloc not in SITE_HOSTS:
            return None
        path = parts.path
    elif parts.scheme:
        return None
    else:
        path = parts.path
    if path.startswith(OTHER_SITES):
        return None
    if not path:  # same-page anchor
        return page_path, parts.fragment
    base = root if path.startswith("/") else page_path.parent
    f = (base / unquote(path.lstrip("/"))).resolve()
    if path.endswith("/") or f.is_dir():
        f = f / "index.html"
    elif not f.suffix and (f.parent / (f.name + ".html")).exists():
        f = f.parent / (f.name + ".html")
    return f, parts.fragment


# Fields cite-share.js needs to write the citation, BibTeX, and RIS for each kind of item.
NEEDS = {
    "essay": ("title", "url", "date", "cite", "key"),
    "article": ("title", "url", "cite", "authors", "cite_title", "journal", "year"),
    "abstract": ("title", "url", "cite", "authors", "cite_title", "journal", "year"),
    "preprint": ("title", "url", "cite", "authors", "cite_title", "journal", "year"),
    "chapter": ("title", "url", "cite", "authors", "cite_title", "book", "publisher", "year"),
}


def check_citable(rel, pg):
    if not pg.cite_refs and pg.citable is None:
        return []
    if pg.citable is None:
        return [f"{rel}: has Cite/Share hooks but no #citable registry"]
    try:
        db = json.loads(pg.citable)
    except ValueError as e:
        return [f"{rel}: #citable registry does not parse ({e})"]
    out = []
    for group, entries in db.items():
        for key, r in entries.items():
            kind = r.get("type") or r.get("kind")
            missing = [f for f in NEEDS.get(kind, ("title", "url", "cite")) if not r.get(f)]
            if kind not in NEEDS:
                out.append(f"{rel}: citable {group}:{key} has unknown kind {kind!r}")
            if missing:
                out.append(f"{rel}: citable {group}:{key} is missing {', '.join(missing)}")
    for ref in sorted(set(pg.cite_refs)):
        group, _, key = ref.partition(":")
        if key not in db.get(group, {}):
            out.append(f"{rel}: Cite/Share names {ref}, which is not in the registry")
    return out


def main(root):
    root = Path(root).resolve()
    problems = []
    pages = {}
    for p in sorted(root.rglob("*.html")):
        rel = p.relative_to(root).as_posix()
        if rel.startswith("me/") or rel.startswith("google"):
            continue
        pg = Page()
        pg.feed(p.read_text(encoding="utf-8", errors="replace"))
        pages[p] = pg
    for p, pg in pages.items():
        rel = p.relative_to(root).as_posix()
        if not pg.title:
            problems.append(f"{rel}: no <title>")
        if not pg.canonical and rel != "404.html":
            problems.append(f"{rel}: no canonical link")
        for i, block in enumerate(pg.ld):
            try:
                json.loads(block)
            except ValueError as e:
                problems.append(f"{rel}: JSON-LD block {i + 1} does not parse ({e})")
        problems += check_citable(rel, pg)
        if pg.no_alt:
            problems.append(f"{rel}: {pg.no_alt} image(s) without alt text")
        for tag, url in pg.links:
            low = url.lower()
            if "localhost" in low or "127.0.0.1" in low:
                problems.append(f"{rel}: link to a local address: {url}")
                continue
            parts = urlsplit(url)
            if parts.path.startswith("/me/") and (not parts.netloc or parts.netloc in SITE_HOSTS):
                problems.append(f"{rel}: link to the old /me/ address: {url}")
                continue
            t = target(root, p, url)
            if t is None:
                continue
            f, frag = t
            if not f.exists():
                problems.append(f"{rel}: broken {tag} -> {url}")
            elif frag and f == p and frag not in pg.ids and frag not in SCRIPT_ANCHORS:
                problems.append(f"{rel}: missing anchor #{frag}")
    print(f"checked {len(pages)} pages")
    for line in problems:
        print("  " + line)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "_site"))
