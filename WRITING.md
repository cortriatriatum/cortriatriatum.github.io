# Publishing an essay

1. Copy `_essays/_template.md` to `_essays/<url-name>.md` (letters, numbers, hyphens). The URL becomes `/me/essays/<url-name>/`.
2. Fill in `title`, `date`, and optionally `description` (shown under the title in the Writing card and in RSS).
3. Write the body in Markdown below the second `---`. Footnotes: `text[^1]` and later `[^1]: note`.
   Images: put files in `img/essays/` and use `![alt text](/me/img/essays/file.jpg)`.
   Math: add `math: true` to the front matter.
   PDF: put the file in `docs/essays/` and add `pdf: /docs/essays/<file>.pdf` to the front matter.
   The essay page shows a PDF button and the RSS entry carries the PDF as an attachment.
4. Delete the `published: false` line when it's ready. Commit and push; GitHub Pages rebuilds in about a minute.

The Writing card on the home page shows the newest four. An "All essays" button appears after the fifth.
Feed: `/me/essays/feed.xml`.

Preview without Ruby: `pip install "python-liquid>=3" markdown pyyaml`, then
`python3 tools/preview.py --drafts` and `python3 -m http.server -d _preview 8000` → http://localhost:8000/me/
