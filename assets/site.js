/* Shared page behavior: contact and subscribe dialogs (Formspree), and the publication topic filter.
   Spam layers for the forms: no address in the source, a _gotcha honeypot, a time trap (sends within
   2–3 s of opening are dropped here), Formspree's own filter, and "Restrict to domain" in Formspree. */
(function(){
  'use strict';
  var FORMSPREE_ID = 'mwlllezg', ENDPOINT = 'https://formspree.io/f/' + FORMSPREE_ID;
  var OFFLINE = 'Could not reach the mail service. What you typed is still here; please try again in a few minutes.';
  function postForm(form){
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function(){ if (ctl) ctl.abort(); }, 15000);
    return fetch(ENDPOINT, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' }, signal: ctl ? ctl.signal : undefined })
      .then(function(r){ clearTimeout(timer); return r; }, function(e){ clearTimeout(timer); throw e; });
  }
  function wire(o){
    var dlg = document.getElementById(o.dlg);
    if (!dlg || typeof dlg.showModal !== 'function') return null;
    var form = dlg.querySelector('form'), status = dlg.querySelector('.status'), send = form.querySelector('.send'), openedAt = 0;
    form.action = ENDPOINT;
    function open(){ status.textContent = ''; openedAt = Date.now(); if (!dlg.open) dlg.showModal(); form.querySelector('input:not([type=hidden])').focus(); }
    dlg.querySelector('.close').addEventListener('click', function(){ dlg.close(); });
    dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function(){ if (location.hash === '#' + o.hash) history.replaceState(null, '', location.pathname + location.search); });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (!form.checkValidity()){ status.textContent = o.invalid; return; }
      if (form.elements._gotcha.value || Date.now() - openedAt < o.minMs){ status.textContent = o.done; form.reset(); return; }
      send.disabled = true; status.textContent = 'Sending…';
      postForm(form).then(function(r){
        if (r.ok){ status.textContent = o.done; form.reset(); setTimeout(function(){ dlg.close(); }, 1800); }
        else form.submit();   /* e.g. CAPTCHA required: fall back to Formspree's own page */
      }).catch(function(){ status.textContent = OFFLINE; }).then(function(){ send.disabled = false; });
    });
    function fromHash(){ if (location.hash === '#' + o.hash) open(); }
    addEventListener('hashchange', fromHash); fromHash();
    return open;
  }
  var openContact = wire({ dlg: 'contactDlg', hash: 'contact', minMs: 3000, invalid: 'Please fill in all three fields with a valid email.', done: 'Sent. Thank you, I will reply soon.' });
  var openSub = wire({ dlg: 'subDlg', hash: 'subscribe', minMs: 2000, invalid: 'Please enter a valid email.', done: 'Subscribed. Thank you.' });
  document.querySelectorAll('[data-open="contact"]').forEach(function(b){ if (openContact){ b.hidden = false; b.addEventListener('click', function(e){ e.preventDefault(); openContact(); var ta = document.querySelector('#contactDlg textarea'); if (b.dataset.prefill && ta && !ta.value) ta.value = b.dataset.prefill + ' '; }); } });
  document.querySelectorAll('[data-open="subscribe"]').forEach(function(b){ if (openSub) b.addEventListener('click', function(e){ e.preventDefault(); openSub(); }); });
  window.InkSite = { openContact: function(){ if (openContact) openContact(); else location.href = (document.querySelector('.nav .me') || {}).href + '#contact'; }, openSub: function(){ if (openSub) openSub(); } };

  /* Publication topics: grouped by words in the title, counted, and filterable. */
  function topic(t){ t = t.toLowerCase();
    if (/coarct|tfap2|atrial appendage/.test(t)) return 'heart';
    if (/endotheli|glycocalyx|heparan|glypican|shear|nitric|flow chamber|pecam/.test(t)) return 'endo';
    return 'blood'; }
  var TOPICS = [['all', 'All'], ['heart', 'Coarctation and congenital heart'], ['endo', 'Endothelium'], ['blood', 'Blood and thrombosis']];
  document.querySelectorAll('[data-pub-list]').forEach(function(list){
    var chips = list.parentNode.querySelector('[data-pub-filter]'); if (!chips) return;
    var rows = [].slice.call(list.children);
    rows.forEach(function(li){ var a = li.querySelector('.t'); li.dataset.topic = topic(a ? a.textContent : ''); });
    /* Long lists start short: the first few, then a button for the rest. */
    var limit = +list.dataset.limit || 0, more = null, cur = 'all';
    function apply(){ var shown = 0; rows.forEach(function(li){ var ok = cur === 'all' || li.dataset.topic === cur; if (ok) shown++; li.hidden = !ok || (limit && cur === 'all' && !list.classList.contains('all') && shown > limit); });
      if (more) more.hidden = !(limit && cur === 'all' && !list.classList.contains('all') && rows.length > limit); }
    if (limit && rows.length > limit){ more = document.createElement('button'); more.type = 'button'; more.className = 'more'; more.textContent = 'Show all ' + rows.length;
      more.addEventListener('click', function(){ list.classList.add('all'); apply(); rows[limit].querySelector('a').focus(); }); list.after(more); }
    TOPICS.forEach(function(tp){
      var n = tp[0] === 'all' ? rows.length : rows.filter(function(li){ return li.dataset.topic === tp[0]; }).length;
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', String(tp[0] === 'all'));
      b.textContent = tp[1]; var c = document.createElement('b'); c.textContent = n; b.appendChild(c);
      b.addEventListener('click', function(){
        cur = tp[0]; apply();
        chips.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
      });
      chips.appendChild(b);
    });
    apply();
  });
})();

/* Site search. The index is the home page itself: every row, course, stop and note in its sections,
   so search never goes stale. Opens with the Search button, "/" or Ctrl/Cmd K. */
(function(){
  'use strict';
  var dlg = document.getElementById('searchDlg'); if (!dlg || typeof dlg.showModal !== 'function') return;
  var q = document.getElementById('searchQ'), out = document.getElementById('searchResults');
  var dirLink = document.querySelector('.nav [data-dir]'), HOME = dirLink ? dirLink.href.replace(/#.*$/, '') : '/directory/';
  var onHome = location.href.replace(/[?#].*$/, '') === HOME.replace(/[?#].*$/, '');
  var INDEX = null, sel = 0, hits = [];
  function txt(el){ return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function norm(s){ return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  /* Give every row on the home page a stable id: section id + position. Search links point at these. */
  function rowsOf(sec){ return [].slice.call(sec.querySelectorAll('.rows>li, .ideas>li, .route>li, .build>div, details.course li, .food-list>li')); }
  function tagRows(doc){ doc.querySelectorAll('section[data-index][id]').forEach(function(sec){ rowsOf(sec).forEach(function(el, i){ if (!el.id) el.id = sec.id + '-' + (i + 1); }); }); }
  function build(doc){
    var items = [];
    doc.querySelectorAll('section[data-index][id]').forEach(function(sec){
      var label = txt(sec.querySelector('h2')) || sec.id;
      items.push({ t: label, d: '', s: 'Section', href: HOME + '#' + sec.id });
      rowsOf(sec).forEach(function(el, i){
        var id = el.id || (sec.id + '-' + (i + 1)), title, detail, href = HOME + '#' + id, kind = label;
        if (el.matches('details.course li')){ title = txt(el); detail = txt(el.closest('details').querySelector('summary')).replace(/[+–]$/, ''); kind = 'Coursework'; }
        else if (el.matches('.food-list>li')){ var fa = el.querySelector('a'); title = txt(fa); detail = el.closest('.food-list').getAttribute('aria-label') + (el.querySelector('span') ? ' · ' + txt(el.querySelector('span')) : ''); kind = 'Food recs'; }
        else {
          var a = el.querySelector('.data-title > a, .t, b'); title = txt(a) || txt(el);
          detail = txt(el.querySelector('.s, .desc, p, .note, .when')); var d = txt(el.querySelector(':scope > .d')); if (d) detail = (detail ? detail + ' · ' : '') + d;
          if (el.matches('.ideas>li')){ var link = el.querySelector('.data-title > a'); if (link) href = link.href; kind = 'Note'; }
        }
        items.push({ t: title, d: detail, s: kind, href: href, id: id });
      });
    });
    items.forEach(function(it){ it.n = norm(it.t + ' ' + it.d + ' ' + it.s); it.nt = norm(it.t); });
    return items;
  }
  function load(){
    if (INDEX) return Promise.resolve(INDEX);
    if (onHome){ INDEX = build(document); return Promise.resolve(INDEX); }
    return fetch(HOME).then(function(r){ return r.text(); }).then(function(h){
      var doc = new DOMParser().parseFromString(h, 'text/html'); INDEX = build(doc); return INDEX;
    }).catch(function(){ INDEX = []; return INDEX; });
  }
  function mark(parent, s, terms){
    var low = norm(s), i = 0, spans = [];
    terms.forEach(function(t){ var k = low.indexOf(t); while (t && k > -1){ spans.push([k, k + t.length]); k = low.indexOf(t, k + t.length); } });
    spans.sort(function(a, b){ return a[0] - b[0]; });
    spans.forEach(function(sp){ if (sp[0] < i) return; parent.appendChild(document.createTextNode(s.slice(i, sp[0]))); var m = document.createElement('mark'); m.textContent = s.slice(sp[0], sp[1]); parent.appendChild(m); i = sp[1]; });
    parent.appendChild(document.createTextNode(s.slice(i)));
  }
  function render(){
    var terms = norm(q.value.trim()).split(/\s+/).filter(Boolean);
    out.textContent = '';
    if (!terms.length){ hits = []; return; }
    hits = INDEX.filter(function(it){ return terms.every(function(t){ return it.n.indexOf(t) > -1; }); })
      .map(function(it){ var sc = 0; terms.forEach(function(t){ if (it.nt.indexOf(t) === 0) sc += 4; else if (it.nt.indexOf(t) > -1) sc += 2; else sc += 1; }); if (it.s === 'Section') sc += 1; return [sc, it]; })
      .sort(function(a, b){ return b[0] - a[0]; }).slice(0, 14).map(function(x){ return x[1]; });
    sel = 0;
    if (!hits.length){ var li = document.createElement('li'); li.className = 'none'; li.textContent = 'Nothing matches “' + q.value.trim() + '”.'; out.appendChild(li); return; }
    hits.forEach(function(it, i){
      var li = document.createElement('li'), a = document.createElement('a'); a.href = it.href; a.setAttribute('role', 'option'); a.setAttribute('aria-selected', String(i === 0));
      var t = document.createElement('span'); t.className = 'rt'; mark(t, it.t, terms);
      var s = document.createElement('span'); s.className = 'rs'; s.textContent = it.s;
      a.append(t, s);
      if (it.d){ var d = document.createElement('span'); d.className = 'rd'; mark(d, it.d, terms); a.appendChild(d); }
      a.addEventListener('click', function(e){ go(it, e); });
      li.appendChild(a); out.appendChild(li);
    });
  }
  function highlight(id){
    var el = document.getElementById(id); if (!el) return false;
    var det = el.closest('details'); if (det) det.open = true;
    var fl = el.closest('[data-city-list]'); if (fl && fl.hidden){ var fb = fl.closest('[data-food]').querySelector('[data-city="' + fl.dataset.cityList + '"]'); if (fb) fb.click(); }
    el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
    return true;
  }
  function go(it, e){
    if (onHome && it.href.indexOf(HOME + '#') === 0){ if (e) e.preventDefault(); dlg.close(); var id = it.href.split('#')[1]; history.replaceState(null, '', '#' + id); highlight(id); }
    else dlg.close();
  }
  function open(){ load().then(function(){ if (!dlg.open) dlg.showModal(); q.select(); render(); }); }
  document.querySelectorAll('[data-search]').forEach(function(b){ b.addEventListener('click', function(e){ e.preventDefault(); open(); }); });
  document.getElementById('searchClose').addEventListener('click', function(){ dlg.close(); });
  dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });
  q.addEventListener('input', render);
  q.addEventListener('keydown', function(e){
    var links = out.querySelectorAll('a');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if (!links.length) return; sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length; links.forEach(function(a, i){ a.setAttribute('aria-selected', String(i === sel)); }); links[sel].scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter' && hits[sel]){ e.preventDefault(); var it = hits[sel]; if (onHome && it.href.indexOf(HOME + '#') === 0) go(it); else { dlg.close(); location.href = it.href; } }
  });
  addEventListener('keydown', function(e){
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) || e.target.isContentEditable;
    if ((e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))){ if (document.querySelector('dialog[open]:not(#searchDlg)')) return; e.preventDefault(); open(); }
  });
  if (onHome){ tagRows(document); var h = location.hash.slice(1); if (h && /-\d+$/.test(h)) setTimeout(function(){ highlight(h); }, 60); addEventListener('hashchange', function(){ var k = location.hash.slice(1); if (/-\d+$/.test(k)) highlight(k); }); }
})();

/* The route rail: a subway line down the side of the home page. The current station fills in as you
   scroll, the line fills behind you, and every station is a link. */
(function(){
  'use strict';
  var rail = document.querySelector('.rail'); if (!rail) return;
  var links = [].slice.call(rail.querySelectorAll('a[href^="#"]')), fill = rail.querySelector('.rail-fill');
  var secs = links.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); });
  var tick = false;
  function update(){
    tick = false; var mid = innerHeight * .35, cur = -1;
    secs.forEach(function(s, i){ if (s && s.getBoundingClientRect().top < mid) cur = i; });
    links.forEach(function(a, i){ a.classList.toggle('here', i === cur); a.classList.toggle('past', i < cur); if (i === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    if (fill && links.length > 1){
      var first = links[0].querySelector('.bul').getBoundingClientRect(), last = links[links.length - 1].querySelector('.bul').getBoundingClientRect();
      var total = rail.classList.contains('flat') || matchMedia('(max-width: 1100px)').matches ? last.left - first.left : last.top - first.top;
      var at = cur < 0 ? 0 : (cur >= links.length - 1 ? 1 : cur / (links.length - 1));
      fill.style.setProperty('--p', at);
    }
    var here = rail.querySelector('a.here'); if (here && matchMedia('(max-width: 1100px)').matches){ var r = here.getBoundingClientRect(), rr = rail.getBoundingClientRect(); if (r.left < rr.left || r.right > rr.right) rail.scrollBy({ left: r.left - rr.left - rr.width / 2 + r.width / 2, behavior: 'smooth' }); }
  }
  addEventListener('scroll', function(){ if (!tick){ tick = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update); update();
})();

/* Food recommendations: one city at a time. */
(function(){
  document.querySelectorAll('[data-food]').forEach(function(box){
    var btns = box.querySelectorAll('[data-city]'), lists = box.querySelectorAll('[data-city-list]');
    btns.forEach(function(b){ b.addEventListener('click', function(){
      btns.forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
      lists.forEach(function(l){ l.hidden = l.dataset.cityList !== b.dataset.city; });
    }); });
  });
})();
