# cortriatriatum.github.io

Built by GitHub Pages with Jekyll (no plugins).

The home page (`index.html`) is one looping ink drawing, run by `assets/world.js`. It is a day's commute, in
order: the street at South Waterfront, the subway stairs, the mezzanine (Notes), the platform (Research), the ride
(New Delhi by air to New York, then Madison, then Portland), Portland · Now (Contact), the escalator up to TriMet, the
streetcar along the Willamette back to South Waterfront (Work and service), the Aerial Tram up to OHSU (Education),
the sky bridge (Awards), the room, out its door, and the tram back down to the street (Dev). Scrolling backward runs
it in reverse. Scroll, swipe or arrow keys move through it; the loop indicator on the right jumps to any stop;
`/#room`, `/#notes`, `/#ride`, `/#streetcar` and so on link to a stop. `/ride/` and `/room/` now redirect there. `/directory/` is the static site: everything on one page, with the route rail; the
Plain switch sends the home page there. Search indexes the Directory.

Shared pieces: styles in `_includes/ink.css`; head, nav, footer (with the site map), dialogs and every piece of
content in `_includes/ink/`; `assets/ink.js` is the line engine, the character, live Portland weather (Open-Meteo)
and the sun over Portland, which sets the page tone (`data-sky` on `<html>`: night, dawn, morning, day, golden,
dusk); `assets/vig.js` draws the small drawings (`<canvas class="vig" data-vig="..." [data-still]>`);
`assets/site.js` runs the forms, the publication filter, search, and the route rail. Essay pages show the N line
with transfers and previous/next stops; the essays map draws transfers as curves. Portland recommendations for
"Grab a coffee" live in `_data/portland.yml`; a list shows once it has a title.
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
