/* Cite and Share: one implementation for every page that lists writing (home, essays map, essay pages).

   Data: the #citable JSON registry (_includes/citable.html), built from _essays/ and _data/publications.yml.
   Markup contract, all optional per page:
     data-cite-id="essay:<slug>" | "pub:<doi or url>"   on a row: Cite and Share buttons go in its
                                                        .cs-slot (or at the end of the row); Cite opens a
                                                        panel under the row.
     data-cite-panel="<id>"                             renders the citation panel in place, always open,
                                                        with the BibTeX shown (the essay page).
     data-share="<id>"                                  on a button: shares that item.
   Cite panel: the formatted citation (NLM / Vancouver), Copy citation, Copy BibTeX, Download RIS (Zotero,
   EndNote, Mendeley, Papers). Share: the system share sheet where there is one, otherwise copy the link.
   Without JavaScript none of the buttons appear, and the essay page still shows its citation as text. */
(function(){
  var node = document.getElementById('citable');
  if (!node) return;
  var DB;
  try { DB = JSON.parse(node.textContent); } catch (e) { return; }

  function rec(id){
    var i = id.indexOf(':'), r = i > 0 && DB[id.slice(0, i)] && DB[id.slice(0, i)][id.slice(i + 1)];
    if (r) { r.id = id; r.type = r.type || r.kind; }  /* publications say kind:, essays type: */
    return r || null;
  }

  /* ---------- formats ---------- */
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var now = new Date();
  var CITED = now.getFullYear() + ' ' + MON[now.getMonth()] + ' ' + now.getDate();
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  var TODAY = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());

  /* A web page's NLM citation carries the date it was read; add it at copy time. */
  function citation(r){
    if (r.type !== 'essay') return r.cite;
    if (/ \[updated [^\]]+\]\./.test(r.cite)) return r.cite.replace(/ \[updated ([^\]]+)\]\./, ' [updated $1; cited ' + CITED + '].');
    return r.cite.replace(/\. Available from:/, ' [cited ' + CITED + ']. Available from:');
  }

  /* "De Sa H" -> {last: "De Sa", initials: ["H"]}; "Mathews R" -> {last: "Mathews", initials: ["R"]}. */
  function person(n){
    var m = /^(.*\S)\s+([A-Z]{1,4})$/.exec(n);
    return m ? { last: m[1], initials: m[2].split('') } : { last: n, initials: [] };
  }
  function lastFirst(n){
    var p = person(n);
    return p.initials.length ? p.last + ', ' + p.initials.join('. ') + '.' : p.last;
  }
  function authors(r){ return r.type === 'essay' ? ['Mathews, Rick'] : r.authors.map(lastFirst); }
  function asciiWord(s){ return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  var STOP = ['the','and','for','with','from','into','during','under','role','study','use'];
  function bibKey(r){
    var last = asciiWord(person(r.type === 'essay' ? 'Mathews R' : r.authors[0]).last);
    var year = r.type === 'essay' ? r.date.slice(0, 4) : String(r.year);
    var word = r.type === 'essay' ? r.key : ((r.cite_title || r.title).split(/\s+/).map(asciiWord)
      .filter(function(w){ return w.length > 3 && STOP.indexOf(w) < 0; })[0] || '');
    return last + year + word;
  }
  function tex(s){ return String(s).replace(/([&%$#_{}])/g, '\\$1').replace(/~/g, '\\textasciitilde{}').replace(/\^/g, '\\textasciicircum{}'); }
  function bibtex(r){
    var f = [], type;
    var who = authors(r).concat(r.et_al ? ['others'] : []).join(' and ');
    function add(k, v){ if (v !== undefined && v !== null && v !== '') f.push('  ' + k + ' = {' + v + '}'); }
    if (r.type === 'essay') {
      type = 'online';
      add('author', tex(who)); add('title', '{' + tex(r.title) + '}'); add('date', r.date);  /* title case on purpose: protect it */
      if (r.updated) add('note', 'Revised ' + r.updated);
      add('url', r.url); add('urldate', TODAY);
      if (r.keywords) add('keywords', tex(r.keywords));
    } else {
      type = { article: 'article', abstract: 'article', preprint: 'misc', chapter: 'incollection' }[r.type] || 'misc';
      add('author', tex(who)); add('title', tex(r.cite_title || r.title));  /* sentence case: let the style re-case it */
      if (r.type === 'chapter') { add('booktitle', tex(r.book)); add('publisher', tex(r.publisher)); }
      else if (r.type === 'preprint') { add('howpublished', tex(r.journal)); add('note', 'Preprint' + (r.number ? ', ' + tex(r.number) : '')); }
      else add('journal', tex(r.journal));
      add('year', r.year); add('volume', r.volume); add('number', r.issue);
      if (r.pages) add('pages', r.pages.replace('-', '--'));
      if (r.type === 'abstract') add('note', 'Abstract');
      add('doi', r.doi); if (!r.doi) add('url', r.url);
      if (r.pmid) add('pmid', r.pmid);
    }
    return '@' + type + '{' + bibKey(r) + ',\n' + f.join(',\n') + '\n}';
  }
  function ris(r){
    var L = [];
    function add(t, v){ if (v !== undefined && v !== null && v !== '') L.push(t + '  - ' + v); }
    add('TY', r.type === 'essay' ? 'ELEC' : r.type === 'chapter' ? 'CHAP' : r.type === 'abstract' ? 'ABST' : 'JOUR');
    authors(r).forEach(function(a){ add('AU', a); });
    add('TI', r.type === 'essay' ? r.title : (r.cite_title || r.title));
    if (r.type === 'essay') {
      add('PY', r.date.slice(0, 4)); add('DA', r.date.replace(/-/g, '/')); add('PB', 'Rick Mathews, PhD');
      add('UR', r.url); add('Y2', TODAY.replace(/-/g, '/'));
      if (r.updated) add('N1', 'Revised ' + r.updated);
      if (r.description) add('AB', r.description);
      (r.keywords || '').split(/,\s*/).forEach(function(k){ if (k) add('KW', k); });
      if (r.pdf) add('L1', r.pdf);
    } else {
      if (r.type === 'chapter') { add('T2', r.book); add('PB', r.publisher); }
      else { add('T2', r.journal); add('JO', r.journal); }
      add('PY', r.year); add('VL', r.volume); add('IS', r.issue);
      if (r.pages) { var pg = r.pages.split('-'); add('SP', pg[0]); add('EP', pg[1]); }
      if (r.type === 'preprint') { add('M3', 'Preprint'); add('M1', r.number); }
      add('DO', r.doi); add('UR', r.doi ? 'https://doi.org/' + r.doi : r.url);
      if (r.pmid) add('AN', 'PMID:' + r.pmid);
      if (r.et_al) add('N1', 'Author list truncated; see the DOI record for all authors.');
    }
    L.push('ER  - ');                      /* end of record; add() would skip the empty value */
    return L.join('\r\n') + '\r\n';
  }

  /* ---------- feedback, copying, sharing ---------- */
  var toast = document.querySelector('.cs-toast'), toastTimer;
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'cs-toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  function say(msg){
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 2200);
  }
  function copy(text, done){
    function fallback(){
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      say(ok ? done : 'Copying is blocked here. Select the text to copy it.');
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function(){ say(done); }, fallback);
    else fallback();
  }
  function download(name, text, mime){
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 0);
    say('Downloaded ' + name);
  }
  function shareUrl(r){ return r.type === 'essay' || !r.doi ? r.url : 'https://doi.org/' + r.doi; }
  function share(r){
    var url = shareUrl(r);
    var text = r.type === 'essay' ? r.title + ', by Rick Mathews, PhD'
      : (r.cite_title || r.title) + ' (' + (r.journal || r.book) + ', ' + r.year + ')';
    if (navigator.share) {
      navigator.share({ title: r.title, text: text, url: url }).catch(function(e){
        if (e && e.name !== 'AbortError') copy(url, 'Link copied');
      });
    } else copy(url, 'Link copied');
  }

  /* ---------- building blocks ---------- */
  var seq = 0;
  function button(label, aria, onClick){
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cite-btn'; b.textContent = label;
    if (aria) b.setAttribute('aria-label', aria);
    b.addEventListener('click', onClick);
    return b;
  }
  function panel(r, opts){
    var p = document.createElement('div');
    p.className = 'cs-panel' + (opts.inline ? ' cs-inline' : '');
    p.id = 'cs-panel-' + (++seq);
    if (!opts.inline) { p.setAttribute('role', 'region'); p.setAttribute('aria-label', 'Citation for ' + r.title); }
    var t = document.createElement('p'); t.className = 'cs-text'; t.textContent = citation(r);
    p.appendChild(t);
    if (opts.bib) {
      var pre = document.createElement('pre'); pre.className = 'cs-bib'; pre.textContent = bibtex(r);
      p.appendChild(pre);
    }
    var acts = document.createElement('div'); acts.className = 'cs-acts';
    acts.appendChild(button('Copy citation', null, function(){ copy(citation(r), 'Citation copied'); }));
    acts.appendChild(button('Copy BibTeX', null, function(){ copy(bibtex(r), 'BibTeX copied'); }));
    acts.appendChild(button('Download RIS', 'Download RIS file for Zotero, EndNote, or Mendeley', function(){
      download(bibKey(r) + '.ris', ris(r), 'application/x-research-info-systems');
    }));
    p.appendChild(acts);
    return p;
  }

  /* Rows: Cite (a disclosure for the panel) and Share. One panel open at a time; Escape closes it. */
  var open = null;
  function close(){
    if (!open) return;
    open.panel.remove(); open.btn.setAttribute('aria-expanded', 'false');
    var b = open.btn; open = null; return b;
  }
  document.querySelectorAll('[data-cite-id]').forEach(function(row){
    var r = rec(row.getAttribute('data-cite-id'));
    if (!r) return;
    var slot = row.querySelector('.cs-slot');
    if (!slot) { slot = document.createElement('span'); slot.className = 'cs-slot'; (row.querySelector('.data-title') || row).appendChild(slot); }
    slot.classList.add('cs-row');
    var name = r.cite_title || r.title;
    var cite = button('Cite', 'Cite: ' + name, function(){
      var was = open && open.btn === cite;
      close();
      if (was) return;
      var p = panel(r, {});
      cite.setAttribute('aria-controls', p.id); cite.setAttribute('aria-expanded', 'true');
      (slot.closest('.data-title, .stop') || row).appendChild(p);
      open = { panel: p, btn: cite };
    });
    cite.setAttribute('aria-expanded', 'false');
    slot.appendChild(cite);
    slot.appendChild(button('Share', 'Share: ' + name, function(){ share(r); }));
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && open) { var b = close(); if (b) b.focus(); }
  });

  document.querySelectorAll('[data-cite-panel]').forEach(function(host){
    var r = rec(host.getAttribute('data-cite-panel'));
    if (!r) return;
    host.textContent = '';
    host.appendChild(panel(r, { inline: true, bib: true }));
  });
  document.querySelectorAll('[data-share]').forEach(function(b){
    var r = rec(b.getAttribute('data-share'));
    if (r) b.addEventListener('click', function(){ share(r); });
  });
})();
