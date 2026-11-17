# Publishing an essay

Each essay is a PDF. The home page, the essays list and the RSS feed link straight to it; there is no essay web page.

1. Write the essay in LaTeX. Copy `tools/essay-pdf/Mathews_2026_Medicines_Missing_Experiments.tex`,
   replace the title, date, `pdftitle`, `pdfkeywords` and body, then build it:
   `latexmk -xelatex <file>.tex` (MacTeX). Put the PDF in `docs/essays/`.
2. Copy `_essays/_template.md` to `_essays/<name>.md`. Fill in `title`, `date`,
   and `pdf: /docs/essays/<file>.pdf`. Paste the plain text below the second `---`; it becomes the RSS entry text.
3. Delete the `published: false` line when it's ready. Commit and push; GitHub Pages rebuilds in about a minute.

Add the essay to the Writing card in `index.html` by hand (copy the existing row); the essays list and RSS feed update on their own.
Feed: `/me/essays/feed.xml`.

Preview without Ruby: `pip install "python-liquid>=3" markdown pyyaml`, then
`python3 tools/preview.py --drafts` and `python3 -m http.server -d _preview 8000` → http://localhost:8000/me/
