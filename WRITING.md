# Publishing an essay

Each essay has a web page at `/essays/<name>/` and a PDF. Both come from one Markdown file in `_essays/`.

1. Copy `_essays/_template.md` to `_essays/<name>.md`. Fill in `title`, `date`, `description`, `keywords`
   and `pdf: /docs/essays/<file>.pdf`, and write the essay below the second `---`.
   For the essays map (`/essays/`), give it a subway route: `route` (one letter), `route_color` and
   `route_text` (hex colors for the bullet and its letter), and `transfers` (names of related essays, e.g.
   `[atomic-unit-single-experiment]`; list it on both essays so the transfer shows at each stop).
2. Citations (optional). List sources under `references:` in the front matter (`id`, `cite`, `url`, and a
   `quote` copied word for word from the source, with `where` it came from). In the text, wrap the claim and
   add its number:
   `<span class="claim" data-ref="smith2020">the claim</span><sup class="ref"><a href="#ref-smith2020">1</a></sup>`
   Readers hover (or tap) the claim or the number to see the source and the quote. Number references in
   order of first use. Paragraphs with citations must be written as `<p>…</p>`.
3. Revisions. When you change a published essay, set `updated: <date>` in the front matter and add a row to
   `edits:`. The page then shows "Revised <date> · see every edit" under the title, and search engines and
   feed readers see the new date. Cite and Share (on the essay page, the essays map, and the home Notes
   card) and the transfer links are automatic. The citation is NLM / Vancouver style, written once in
   `_includes/essay-citation.txt`; Cite also offers BibTeX and an RIS file for reference managers.
4. Provenance (optional). Put the unedited first draft in `original:` (plus `original_title`, `original_date`)
   and say who changed what in `editing:`. The page gets Essay / Markup / Provenance tabs: Markup is a
   redline of the original against the current text, computed in the browser, so there is nothing to mark
   by hand. The PDF gets a last page with the note and the original.
5. Build the PDF: `python3 tools/essay-pdf/build_pdf.py _essays/<name>.md` (needs `pip install pymupdf pyyaml`;
   no LaTeX). It writes `docs/essays/<pdf name>.pdf` in the LaTeX layout of the original PDFs, with the
   references and provenance page. To compile with real LaTeX instead, `tools/essay-pdf/md2tex.py` writes
   the same essay as a .tex file for `latexmk -xelatex`.
6. Share card: set `image: /img/og/<name>.png` in the front matter and run `python3 tools/og_cards.py`
   (rerun it if the title changes). It draws the 1200 x 630 picture that link previews show.
7. Delete the `published: false` line when it is ready. The home Notes card ("Notes, Scribbles & Ideas in Progress", the N line; latest four), the essays
   map, the RSS feed, the sitemap, and llms.txt all update on their own. Commit and push; GitHub Pages
   rebuilds in about a minute, and the "Check site" action (`.github/workflows/check.yml`) builds it again
   and flags broken internal links, missing titles, bad structured data, or images without alt text.
   To run the same check locally: `python3 tools/check_site.py _preview` after a preview build.

8. After the push deploys, tell search engines: `python3 tools/indexnow.py`. Google reads the sitemap
   (`/sitemap.xml`) through Search Console on its own schedule.

## Publications

The Research card on the home page lists `_data/publications.yml`, grouped by `kind` (article, preprint,
chapter, abstract) with counts filled in. To add a paper, add an entry in its place (newest first within its
kind). `title`, `url`, `venue` are what the page shows; `cite` is the citation exactly as readers copy it;
`authors`, `cite_title`, `journal` (or `book` and `publisher`), `volume`, `issue`, `pages`, `doi` and `pmid`
are the same facts as fields, from which BibTeX and RIS are generated. Every row gets Cite and Share; Share
links to the DOI when there is one. The site check flags an entry that is missing a field.

Work in progress: every essay is labeled "Work in progress" on its page, on the essays map, on the home
Notes card, in its PDF, and in its structured data (`creativeWorkStatus`). The default is set once in
`_config.yml`; give an essay its own `status:` to change the wording, or `status: ""` to drop the label.

Feed: `/essays/feed.xml`.

Preview without Ruby: `pip install "python-liquid>=3" markdown pyyaml`, then
`python3 tools/preview.py --drafts` and `python3 -m http.server -d _preview 8000` → http://localhost:8000/
