# cortriatriatum.github.io

Built by GitHub Pages with Jekyll (no plugins).

The home page (`index.html`), `/ride/` and `/room/` share one ink look: styles in `_includes/ink.css`, the head, nav,
footer, dialogs and every piece of content in `_includes/ink/` (edit a fact once and all three pages change), and the
drawings in `assets/` (`ink.js` is the line engine and character, plus live Portland weather from Open-Meteo;
`home.js`, `ride.js`, `room.js` draw each page; `site.js` runs the contact and subscribe forms and the publication
filter). The home page opens on a full-screen live drawing of a Portland street with four ways in: the subway stairs (`/ride/`),
the lit window (`/room/`), the directory board (scrolling moves the camera into it until it becomes the page), and Plain.
Search (the Search button, `/` or Ctrl/Cmd K, in `assets/site.js`) indexes the home page's own sections, so it never
needs updating. The Plain switch on every page turns all drawings off; visitors who ask for reduced motion get still frames.
Every page now uses this look: the essays map (an ink subway line), each essay (its LaTeX sheet lies on the ink page,
with the ink nav and an essay toolbar), and the 404 page. Small drawings come from `assets/vig.js`
(`<canvas class="vig" data-vig="toss|scope|train|study|carry|mail|desk|lost">`). On the home page every object
in the scene is a way in (stairs, room, directory lines, coffee cart for contact), and a route rail down the side
tracks the sections. `_includes/subway.css` is no longer used by any page.
Essays: see `WRITING.md` (web page + PDF from one Markdown file).
Publications: `_data/publications.yml` (the Research section on the home page and the microscope in `/room/`). See "Publications" in `WRITING.md`.

Cite and Share work the same way on every page that lists writing (home, `/essays/`, each essay):

| Piece | Role |
| --- | --- |
| `_includes/citable.html` | JSON registry of every essay and publication; ids `essay:<slug>` and `pub:<doi or url>` |
| `_includes/essay-citation.txt` | the one formatted citation (NLM / Vancouver) for an essay |
| `_includes/cite-share.js` | buttons, citation panel, BibTeX and RIS export, share sheet, toast |
| `_includes/cite-share.css` | layout; each page skins it (`subway.css`, `_layouts/essay.html`) |

Add `data-cite-id="<id>"` to any row to give it Cite and Share. `tools/check_site.py` fails if an id on a page
is not in the registry, or if an entry lacks a field the exports need.
