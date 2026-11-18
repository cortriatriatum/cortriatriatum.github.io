# Publishing an essay

Each essay has a web page at `/essays/<name>/` and a PDF. Both come from one Markdown file in `_essays/`.

1. Copy `_essays/_template.md` to `_essays/<name>.md`. Fill in `title`, `date`, `description`, `keywords`
   and `pdf: /docs/essays/<file>.pdf`, and write the essay below the second `---`.
2. Citations (optional). List sources under `references:` in the front matter (`id`, `cite`, `url`, and a
   `quote` copied word for word from the source, with `where` it came from). In the text, wrap the claim and
   add its number:
   `<span class="claim" data-ref="smith2020">the claim</span><sup class="ref"><a href="#ref-smith2020">1</a></sup>`
   Readers hover (or tap) the claim or the number to see the source and the quote. Number references in
   order of first use. Paragraphs with citations must be written as `<p>…</p>`.
3. Provenance (optional). Put the unedited first draft in `original:` (plus `original_title`, `original_date`)
   and say who changed what in `editing:`. The page gets Essay / Markup / Provenance tabs: Markup is a
   redline of the original against the current text, computed in the browser, so there is nothing to mark
   by hand. The PDF gets a last page with the note and the original.
4. Build the PDF: `python3 tools/essay-pdf/build_pdf.py _essays/<name>.md` (needs `pip install pymupdf pyyaml`;
   no LaTeX). It writes `docs/essays/<pdf name>.pdf` in the LaTeX layout of the original PDFs, with the
   references and provenance page. To compile with real LaTeX instead, `tools/essay-pdf/md2tex.py` writes
   the same essay as a .tex file for `latexmk -xelatex`.
5. Delete the `published: false` line when it's ready. Add the essay to the Writing card in `index.html`
   by hand (copy the existing row); the essays list and RSS feed update on their own. Commit and push;
   GitHub Pages rebuilds in about a minute.

6. After the push deploys, tell search engines: `python3 tools/indexnow.py`. Google reads the sitemap
   (`/sitemap.xml`) through Search Console on its own schedule.

Feed: `/essays/feed.xml`.

Preview without Ruby: `pip install "python-liquid>=3" markdown pyyaml`, then
`python3 tools/preview.py --drafts` and `python3 -m http.server -d _preview 8000` → http://localhost:8000/
