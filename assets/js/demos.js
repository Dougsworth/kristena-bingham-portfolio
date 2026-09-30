/* Small working sketches on the case study pages. Sample data only. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Amounts are in JMD and written the way the designs write them: $150,000 */
  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- FollowUp: log an interaction in plain words ---------- */
  var log = document.querySelector('[data-demo="log"]');
  if (log) {
    var input = log.querySelector('textarea');
    var out = log.querySelector('.fields');
    var closes = log.querySelector('.closes');
    var typeBtns = log.querySelectorAll('[data-type]');
    var picked = null;

    /* The same sample clients as the FollowUp screens, with the open task each one has */
    var clients = [
      { name: 'Dane', company: 'Caribbean Tech Ltd', match: ['dane', 'mitchell', 'caribbean tech'], task: 'Call back – Caribbean Tech Ltd' },
      { company: 'Island Supplies', match: ['island supplies'], task: 'Send proposal – Island Supplies' },
      { name: 'J. Williams', match: ['williams'], task: 'Follow up – J. Williams' },
      { company: 'Bluewave Media', match: ['bluewave'], task: 'Check contract – Bluewave Media' },
      { name: 'K. Morgan', match: ['morgan'], task: 'Intro call – K. Morgan' },
      { company: 'Palm Retail', match: ['palm retail'], task: 'Review quote – Palm Retail' }
    ];
    var types = [
      ['Call', /\b(spoke|spoken|speak|call(?:ed)?|phoned?|rang|ring)\b/i],
      ['Meeting', /\b(met|meet(?:ing)?|visit(?:ed)?|lunch|sat down)\b/i],
      ['Email', /\b(e-?mail(?:ed)?|wrote)\b/i]
    ];
    var things = 'proposal|quote|contract|invoice|pricing|price list|deck|samples|agreement|brochure';
    var steps = [
      [new RegExp('\\bsend\\b(?:\\s+(?:him|her|them|over|across|the|a|an|our|new|revised|updated))*\\s+(' + things + ')\\b', 'i'), function (m) { return 'Send ' + m[1].toLowerCase(); }],
      [/\b(book|schedule|set up|arrange)\b(?:\s+(?:a|an|the))?\s+(demo|meeting|call|visit|review)\b/i, function (m) { return cap(m[1].toLowerCase()) + ' ' + m[2].toLowerCase(); }],
      [/\bcall (?:(?:him|her|them) )?back\b/i, function () { return 'Call back'; }],
      [new RegExp('\\b(review|check|sign)\\b(?:\\s+(?:the|a|an|their|his|her))?\\s+(' + things + ')\\b', 'i'), function (m) { return cap(m[1].toLowerCase()) + ' ' + m[2].toLowerCase(); }],
      [/\bfollow(?:\s|-)?up\b/i, function () { return 'Follow up'; }]
    ];
    var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    function parse(text, picked) {
      var r = {}, lower = text.toLowerCase();

      var c = clients.find(function (cl) {
        return cl.match.some(function (m) { return new RegExp('\\b' + m.replace('.', '\\.') + '\\b', 'i').test(text); });
      });
      if (c) r.contact = { value: c.name && c.company ? c.name + ' (' + c.company + ')' : (c.name || c.company), c: c };

      /* The first kind of contact mentioned sets the type. Anything else is a note. */
      var first = null;
      types.forEach(function (t) {
        var m = text.match(t[1]);
        if (m && (!first || m.index < first.at)) first = { value: t[0], at: m.index };
      });
      if (text.trim()) r.type = { value: picked || (first ? first.value : 'Note') };

      var about = text.match(/\babout\s+(?:the\s+|a\s+|an\s+|our\s+|their\s+)?([^.,;!?\n]+)/i);
      if (about) {
        var topic = about[1].trim().replace(/\s+(?:and|but)\s+.*$/i, '');
        if (topic.length > 26) topic = topic.slice(0, 26).replace(/\s+\S*$/, '');
        var verb = { Call: 'Discussed ', Meeting: 'Discussed ', Email: 'Emailed about ', Note: 'Note on ' }[r.type ? r.type.value : 'Note'];
        r.summary = { value: verb + topic + '…' };
      } else if (text.trim().length > 12) {
        var s = text.trim().split(/[.!?\n]/)[0];
        if (s.length > 30) s = s.slice(0, 30).replace(/\s+\S*$/, '');
        r.summary = { value: s + '…' };
      }

      var step = null;
      steps.some(function (p) { var m = text.match(p[0]); if (m) step = p[1](m); return !!m; });
      if (step) r.next = { value: step };

      var due = '';
      if (/\btoday\b/.test(lower)) due = 'Today';
      else if (/\btomorrow\b/.test(lower)) due = 'Tomorrow';
      else if (/\bnext week\b/.test(lower)) due = 'Next week';
      else if (/\b(this week|end of (?:the )?week)\b/.test(lower)) due = 'This week';
      else if (/\bnext month\b/.test(lower)) due = 'Next month';
      else if (/\bin (\d{1,2}) days?\b/.test(lower)) { var n = lower.match(/\bin (\d{1,2}) days?\b/)[1]; due = 'In ' + n + (n === '1' ? ' day' : ' days'); }
      else {
        for (var i = 0; i < 7; i++) {
          var d = days[i];
          var dm = lower.match(new RegExp('\\b(next )?(' + d + '|' + d.slice(0, 3) + ')\\b'));
          if (dm) { due = (dm[1] ? 'Next ' : '') + cap(d); break; }
        }
      }
      var t = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
      var noon = /\bnoon\b/i.test(text);
      if (t || noon) {
        var h = noon ? 12 : parseInt(t[1], 10), mm = noon ? '00' : (t[2] || '00'), ap = noon ? 'PM' : t[3].toUpperCase();
        due = (due || 'Today') + ', ' + h + ':' + mm + ' ' + ap;
      }
      if (due) r.due = { value: due };
      return r;
    }

    function row(label, f, missing) {
      return '<div><dt>' + label + '</dt>' +
        (f ? '<dd>' + esc(f.value) + '</dd>' : '<dd class="miss">' + missing + '</dd>') + '</div>';
    }

    function render() {
      var r = parse(input.value, picked);
      var type = r.type ? r.type.value : picked;
      typeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-type') === type ? 'true' : 'false'); });
      out.innerHTML =
        row('Contact', r.contact, 'Add a name, like Dane or Palm Retail') +
        row('Type', type ? { value: type } : null, 'Say “spoke with”, “met” or “emailed”') +
        row('Summary', r.summary, 'Say what it was about') +
        row('Next step', r.next, 'Add one, like “send a proposal”') +
        row('Due date', r.due, 'Add a day, like “Friday” or “next week”');
      var c = r.contact && r.contact.c;
      closes.innerHTML = c && r.next
        ? '<span class="mono">Also</span><span>Marks “' + esc(c.task) + '” done and replaces it with “' + esc(r.next.value) + '”</span>'
        : '';
    }

    input.addEventListener('input', function () { picked = null; render(); });
    typeBtns.forEach(function (b) {
      b.addEventListener('click', function () { picked = b.getAttribute('data-type'); render(); });
    });
    log.querySelectorAll('[data-try]').forEach(function (b) {
      b.addEventListener('click', function () { input.value = b.getAttribute('data-try'); picked = null; render(); input.focus(); });
    });
    render();
  }

  /* ---------- Kingston Commute: one trip, three ways ---------- */
  var trip = document.querySelector('[data-demo="trips"]');
  if (trip) {
    var list = trip.querySelector('.trips');
    var why = trip.querySelector('.why');
    var tabs = trip.querySelectorAll('.tabs button');
    /* UWI, Mona to New Kingston, leaving now: the three options on the Route Options screen */
    var options = {
      a: { label: 'JUTC 101', mins: 24, fare: 120, meta: 'UWI → New Kingston · Depart 10:46 AM', segs: [['walk', 2], ['bus', 24, '101 · 24 min']] },
      b: { label: 'Route Taxi', mins: 28, fare: 150, meta: 'Papine stand → New Kingston · Leaves 10:48 AM', segs: [['walk', 3], ['taxi', 28, 'Route taxi · 28 min']] },
      c: { label: 'JUTC 98', mins: 32, fare: 120, meta: 'UWI → New Kingston via Cross Roads · Depart 10:52 AM · Running about 5 min late', segs: [['walk', 3], ['bus', 32, '98 · 32 min']] }
    };
    var orders = {
      recommended: { order: ['a', 'b', 'c'], why: 'JUTC 101 is the quickest and the cheapest. Walk 2 minutes, board at 10:48 AM and arrive at 11:12 AM.' },
      fastest: { order: ['a', 'b', 'c'], why: 'JUTC 101 takes 24 minutes, 4 fewer than the route taxi and 8 fewer than JUTC 98.' },
      cheapest: { order: ['a', 'c', 'b'], why: 'JUTC 101 and JUTC 98 are both $120. The 101 is 8 minutes quicker, so it comes first. The route taxi is $150.' }
    };
    var longest = 0;
    Object.keys(options).forEach(function (k) {
      longest = Math.max(longest, options[k].segs.reduce(function (s, g) { return s + g[1]; }, 0));
    });

    Object.keys(options).forEach(function (k) {
      var o = options[k];
      var li = document.createElement('li');
      li.className = 'trip';
      li.setAttribute('data-key', k);
      var bar = o.segs.map(function (s) {
        return '<i class="seg-' + s[0] + '" style="width:' + (s[1] / longest * 100).toFixed(2) + '%">' + (s[2] ? esc(s[2]) : '') + '</i>';
      }).join('');
      var walk = o.segs[0][1];
      li.innerHTML = '<div class="t">' + o.mins + ' min<small>' + esc(o.label) + '</small></div>' +
        '<div class="route"><div class="bar" role="img" aria-label="Walk ' + walk + ' minutes, then ' + o.mins + ' minutes on the ' + esc(o.label) + '">' + bar + '</div><p class="meta">' + esc(o.meta) + '</p></div>' +
        '<div class="fare">' + money(o.fare) + '</div>';
      list.appendChild(li);
    });

    function sort(key) {
      var items = Array.prototype.slice.call(list.children);
      var first = {};
      items.forEach(function (el) { first[el.getAttribute('data-key')] = el.getBoundingClientRect().top; });
      orders[key].order.forEach(function (k) { list.appendChild(list.querySelector('[data-key="' + k + '"]')); });
      if (!reduced && list.animate) {
        items.forEach(function (el) {
          var dy = first[el.getAttribute('data-key')] - el.getBoundingClientRect().top;
          if (dy) el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
        });
      }
      why.textContent = orders[key].why;
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('data-sort') === key ? 'true' : 'false'); });
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { sort(t.getAttribute('data-sort')); }); });
    sort('recommended');
  }

  /* ---------- RentScope: is this a fair price? ---------- */
  var fair = document.querySelector('[data-demo="fair"]');
  if (fair) {
    var range = fair.querySelector('input[type="range"]');
    var area = fair.querySelector('select');
    var shown = fair.querySelector('output');
    var verdict = fair.querySelector('.verdict');
    var detail = fair.querySelector('.detail');
    var hist = fair.querySelector('.hist');
    var line = hist.querySelector('.median');
    /* Sample two-bed rents per area, in $10,000 bands from $100,000 to $240,000.
       Each area's bands split evenly at its median. */
    var low = 100000, step = 10000;
    var areas = {
      'New Kingston': [1, 1, 2, 3, 4, 6, 7, 7, 5, 4, 3, 2, 2, 1],
      'Barbican': [1, 2, 3, 5, 6, 6, 5, 3, 2, 1, 0, 0, 0, 0],
      'Liguanea': [2, 4, 6, 8, 7, 5, 4, 2, 1, 1, 0, 0, 0, 0]
    };
    var nb = areas['New Kingston'].length, high = low + step * nb;
    var bars = [];
    for (var b = 0; b < nb; b++) {
      var i = document.createElement('i');
      hist.insertBefore(i, line);
      bars.push(i);
    }

    function update() {
      var rent = parseInt(range.value, 10);
      var opt = area.options[area.selectedIndex];
      var median = parseInt(opt.getAttribute('data-median'), 10), name = opt.value;
      var bins = areas[name];
      var total = bins.reduce(function (a, n) { return a + n; }, 0);
      var peak = Math.max.apply(null, bins);
      shown.innerHTML = money(rent) + '<small>/mo</small>';

      var diff = (rent - median) / median * 100;
      var pct = Math.round(Math.abs(diff));
      var state = pct < 5 ? 'near' : (diff < 0 ? 'below' : 'above');
      fair.setAttribute('data-state', state);
      if (pct === 0) verdict.innerHTML = 'Right on the ' + esc(name) + ' 2‑bed median of ' + money(median) + '.';
      else verdict.innerHTML = '<em>' + pct + '% ' + (diff < 0 ? 'below' : 'above') + '</em> the ' + esc(name) + ' 2‑bed median of ' + money(median) + '.';

      var above = 0;
      bins.forEach(function (n, j) {
        var end = low + (j + 1) * step;
        above += n * Math.min(1, Math.max(0, (end - rent) / step));
      });
      var cheaper = Math.round(above);
      detail.textContent = 'Cheaper than ' + cheaper + ' of the ' + total + ' sample two-bed homes in ' + name + '.';

      var idx = Math.floor((rent - low) / step);
      var medIdx = (median - low) / step;
      bars.forEach(function (el, j) {
        el.style.height = (bins[j] / peak * 100) + '%';
        el.classList.toggle('on', j === idx);
        el.classList.toggle('lo', j + 1 <= medIdx);
      });
      var pos = Math.min(100, Math.max(0, (median - low) / (high - low) * 100));
      line.style.left = pos + '%';
      line.querySelector('span').textContent = 'Median ' + money(median);
    }
    range.addEventListener('input', update);
    area.addEventListener('change', update);
    update();
  }
})();
