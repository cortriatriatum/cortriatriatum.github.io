# cortriatriatum.github.io

Built by GitHub Pages with Jekyll (no plugins).

The home page (`index.html`) is one looping ink drawing, run by `assets/world.js`. It is a day's commute, in
order: the street at South Waterfront, the subway stairs, the mezzanine (Notes), the platform (Research), the ride
(New Delhi by air to New York, then Madison, then Portland), Portland · Now (Contact), the escalator up to TriMet, the
streetcar along the Willamette back to South Waterfront (Work and service), the Aerial Tram up to OHSU (Education),
the sky bridge (Awards), the room, out its door, and the tram back down to the street (Dev). Scrolling backward runs
it in reverse. Scroll, swipe or arrow keys move through it; the loop indicator on the right jumps to any stop;
`/explore/#room`, `/explore/#train` and so on link to a stop. The home page `/` is a static board of station signs in three columns (one column on phones), each with a still
drawing that plays on hover or tap. Its two edges lead into the walk at `/explore/`, which loops: scrolling on past
the bottom walks the figure into the station (the room); scrolling up past the very top brings the Aerial Tram down.
Off the loop are the rabbit holes: the gallery (`/photos/`) through the photo wall, the library (`/library/`, the
notes as books) through the notebook and the train, and the food walk (`/food/`) through the food cart. Every walk
page has a "← One page" button back. The Drawings switch hides every drawing and turns the edges off. Photos are black and white only; each has an "Ask for it in
color" link to the contact form. Food recs carry my own notes (cuisine, price, a line) from `_data/food.yml`. Photos and food recs are only in the animated walk
(neither is indexed): the photo wall in the room opens the gallery (`/photos/`, prints in date order with wall labels;
clicking one zooms into it), and the food cart on the street leads to the food walk (`/food/`, `assets/pod.js`): one street per city drawn from
its real landmarks, with that city's live weather and daylight, and every place as its own cart or shop; the subway
links the cities. The gallery runs on `assets/strip.js`, which turns the page's scroll into a walk.
`/photos/all/` is the plain grid, and Plain mode shows plain lists on both.
`/directory/`, `/ride/` and `/room/` redirect. Search indexes the home page. Photos are exported by
`tools/photo-review/export.py` from `decisions.py`.

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
