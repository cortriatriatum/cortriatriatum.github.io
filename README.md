# cortriatriatum.github.io

Built by GitHub Pages with Jekyll (no plugins).

The home page (`index.html`) is one looping ink drawing, run by `assets/world.js`. It is a day's commute, in
order: the street at South Waterfront, the subway stairs, the mezzanine (Notes), the platform (Research), the ride
(New Delhi by air to New York, then Madison, then Portland), Portland · Now (Contact), the escalator up to TriMet, the
streetcar along the Willamette back to South Waterfront (Work and service), the Aerial Tram up to OHSU (Education),
the sky bridge (Awards), the room, out its door, and the tram back down to the street (Dev). Scrolling backward runs
it in reverse. Scroll, swipe or arrow keys move through it; the loop indicator on the right jumps to any stop;
`/explore/#room`, `/explore/#train` and so on link to a stop. The top bar of every page is "Rick Mathews" (home) and the line: the whole site as one subway line, Lab · Tram ↑ ·
CV · Subway ↓ · Platform · Train · Marquam Hill, with the detours (Gallery, Library, Food recs) on a dashed line; the
stop you are at wobbles. On phones the line is a strip you can swipe, and the Drawings and Dark switches are in the
footer. The home page `/` is the CV: a static board of station signs that fits the window, each sign scrolling inside
itself (stacked on phones). It is the street level of the loop: scroll down past it and the figure walks down the
station stairs into the subway (the walk at `/explore/`, from the room on); pull up past its top and he rides the
Aerial Tram up toward the lab. The tram's landing and the room's stairs lead back to it, so it loops. Either edge
turns the drawings on. Photos are black and white only; each has an "Ask for it in
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
