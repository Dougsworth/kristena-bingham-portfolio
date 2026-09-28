/* Small working sketches on the case study pages. Sample data only. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function money(n) { return 'J$' + Math.round(n).toLocaleString('en-US'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- FollowUp: the one-line log ---------- */
  var log = document.querySelector('[data-demo="log"]');
  if (log) {
    var input = log.querySelector('input');
    var out = log.querySelector('.fields');
    var closes = log.querySelector('.closes');

    var clients = [
      { first: 'Marsha', last: 'Brown', company: "Brown's Hardware", late: 'Call about invoice 1042', days: 2 },
      { first: 'Devon', last: 'Clarke', late: 'Send revised quote', days: 1 },
      { first: 'Kerry-Ann', last: 'Lewis' },
      { first: 'Omar', last: 'Grant' },
      { first: 'Tanya', last: 'Reid' },
      { first: 'Nadine', last: 'Scott' },
      { first: 'Paul', last: 'Wright' }
    ];
    var invoices = { '1042': { amount: 84500, age: 32 } };
    var team = ['Shanice Morgan', 'Andre Campbell'];
    var actions = [
      [/\b(call|ring|phone)\b/i, 'Phone call'],
      [/\b(whatsapp|text|message)\b/i, 'WhatsApp message'],
      [/\b(email|e-mail|mail)\b/i, 'Email'],
      [/\b(meet|visit|see)\b/i, 'Meeting'],
      [/\b(send)\b/i, 'Send something'],
      [/\b(check|follow up|chase|remind)\b/i, 'Check in']
    ];
    var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    var TODAY = 3; /* The sample board is set on a Wednesday */

    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function parse(text) {
      var r = {};
      var a = actions.find(function (p) { return p[0].test(text); });
      if (a) r.action = { value: a[1], from: 'from “' + text.match(a[0])[0] + '”' };

      var matches = clients.filter(function (c) {
        return new RegExp('\\b' + c.first + '\\b', 'i').test(text) || new RegExp('\\b' + c.last + '\\b', 'i').test(text);
      });
      if (matches.length) {
        var c = matches[0];
        r.client = { value: c.first + ' ' + c.last + (c.company ? ' · ' + c.company : ''), from: matches.length + ' match of ' + clients.length, c: c };
      }

      var inv = text.match(/\b(?:invoice|inv)\s*#?\s*(\d{3,6})\b/i);
      if (inv) {
        var known = invoices[inv[1]];
        r.invoice = { value: 'Invoice ' + inv[1] + (known ? ' · ' + money(known.amount) + ' · ' + known.age + ' days old' : ''), from: known ? 'found' : 'not in the sample' };
      }

      var when = '', whenFrom = '', ahead = null, lower = text.toLowerCase();
      if (/\btoday\b/.test(lower)) { when = 'Today'; ahead = 0; whenFrom = 'today'; }
      else if (/\btomorrow\b/.test(lower)) { when = 'Tomorrow'; ahead = 1; whenFrom = 'in 1 day'; }
      else {
        for (var i = 0; i < 7; i++) {
          var d = days[i];
          if (new RegExp('\\b(' + d + '|' + d.slice(0, 3) + ')\\b').test(lower)) {
            ahead = (i - TODAY + 7) % 7 || 7;
            when = cap(d);
            whenFrom = 'in ' + ahead + (ahead === 1 ? ' day' : ' days');
            break;
          }
        }
      }
      var t = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
      var noon = /\bnoon\b/i.test(text);
      if (t || noon) {
        var h = noon ? 12 : parseInt(t[1], 10), m = noon ? '00' : (t[2] || '00'), ap = noon ? 'PM' : t[3].toUpperCase();
        var time = h + ':' + m + ' ' + ap;
        when = when ? when + ', ' + time : 'Today, ' + time;
        if (!whenFrom) whenFrom = 'today';
      }
      if (when) r.when = { value: when, from: whenFrom };

      var who = team.find(function (p) { return new RegExp('\\bfor ' + p.split(' ')[0] + '\\b|\\bto ' + p.split(' ')[0] + '\\b', 'i').test(text); });
      r.assigned = { value: who || 'You', from: who ? 'from “for ' + who.split(' ')[0] + '”' : 'default' };
      return r;
    }

    function row(label, f, missing) {
      return '<div><dt>' + label + '</dt>' +
        (f ? '<dd>' + esc(f.value) + '</dd><dd class="from">' + esc(f.from) + '</dd>'
           : '<dd class="miss">' + missing + '</dd><dd class="from"></dd>') + '</div>';
    }

    function render() {
      var r = parse(input.value);
      out.innerHTML =
        row('Action', r.action, 'Not sure yet. Try “call”, “email” or “WhatsApp”') +
        row('Client', r.client, 'No match in the sample clients') +
        row('When', r.when, 'No day or time yet') +
        row('Linked to', r.invoice, 'Nothing linked') +
        row('Assigned to', r.assigned);
      var c = r.client && r.client.c;
      closes.innerHTML = c && c.late
        ? '<span class="mono">Also</span><span>Mark “' + esc(c.late) + '” (' + c.days + (c.days === 1 ? ' day' : ' days') + ' late) as done</span>'
        : '';
    }

    input.addEventListener('input', render);
    log.querySelectorAll('[data-try]').forEach(function (b) {
      b.addEventListener('click', function () { input.value = b.getAttribute('data-try'); render(); input.focus(); });
    });
    render();
  }

  /* ---------- Kingston Commute: one trip, three ways ---------- */
  var trip = document.querySelector('[data-demo="trips"]');
  if (trip) {
    var list = trip.querySelector('.trips');
    var why = trip.querySelector('.why');
    var tabs = trip.querySelectorAll('.tabs button');
    var options = {
      a: { label: 'Best balance', mins: 24, fare: 120, meta: '7:52 → 8:16 AM · Bus in 6 min', segs: [['walk', 3], ['bus', 19, '75 · 19 min'], ['walk', 2]] },
      b: { label: 'Fastest', mins: 18, fare: 200, meta: 'Leaves when full · Sovereign Centre · ~3 min', segs: [['walk', 1], ['taxi', 17, 'Route taxi · 17 min']] },
      c: { label: 'Backup route', mins: 31, fare: 240, meta: '7:58 → 8:29 AM · 1 change · Bus in 12 min', segs: [['walk', 1], ['bus', 12, '72'], ['wait', 3], ['bus', 13, '42'], ['walk', 2]] }
    };
    var orders = {
      recommended: { order: ['a', 'b', 'c'], why: 'Route 75 is the cheapest fare and only 6 minutes slower than the route taxi.' },
      fastest: { order: ['b', 'a', 'c'], why: 'The route taxi saves 6 minutes but costs J$80 more, and it leaves when it’s full.' },
      cheapest: { order: ['a', 'b', 'c'], why: 'Route 75 at J$120. The backup route costs double because it needs two buses.' }
    };
    var longest = 31;

    Object.keys(options).forEach(function (k) {
      var o = options[k];
      var li = document.createElement('li');
      li.className = 'trip';
      li.setAttribute('data-key', k);
      var bar = o.segs.map(function (s) {
        return '<i class="seg-' + s[0] + '" style="width:' + (s[1] / longest * 100).toFixed(2) + '%">' + (s[2] ? esc(s[2]) : '') + '</i>';
      }).join('');
      li.innerHTML = '<div class="t">' + o.mins + ' min<small>' + o.label + '</small></div>' +
        '<div class="route"><div class="bar" role="img" aria-label="' + o.mins + ' minutes door to door">' + bar + '</div><p class="meta">' + esc(o.meta) + '</p></div>' +
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
    /* 48 sample 2-bed homes in Kingston 6, in J$10,000 bands from J$60,000 */
    var bins = [1, 2, 3, 5, 6, 7, 8, 7, 5, 2, 2];
    var low = 60000, step = 10000, high = low + step * bins.length;
    var total = bins.reduce(function (a, b) { return a + b; }, 0);
    var bars = [];
    var peak = Math.max.apply(null, bins);
    bins.forEach(function (n) {
      var i = document.createElement('i');
      i.style.height = (n / peak * 100) + '%';
      hist.insertBefore(i, line);
      bars.push(i);
    });

    function update() {
      var rent = parseInt(range.value, 10);
      var opt = area.options[area.selectedIndex];
      var median = parseInt(opt.value, 10), name = opt.textContent;
      shown.innerHTML = money(rent) + '<small>/ month</small>';
      var diff = (rent - median) / median * 100;
      var pct = Math.round(Math.abs(diff));
      if (pct < 3) verdict.innerHTML = 'About the same as the <em>' + esc(name) + '</em> median of ' + money(median) + '.';
      else verdict.innerHTML = '<em>' + pct + '% ' + (diff < 0 ? 'below' : 'above') + '</em> the ' + esc(name) + ' median of ' + money(median) + '.';

      var above = 0;
      bins.forEach(function (n, i) {
        var end = low + (i + 1) * step;
        above += n * Math.min(1, Math.max(0, (end - rent) / step));
      });
      var inside = rent >= low && rent < high;
      var cheaper = Math.max(0, Math.round(above) - (inside ? 1 : 0));
      detail.textContent = 'Cheaper than ' + cheaper + ' of the ' + total + ' two-bed homes listed in Kingston 6.';

      var idx = Math.floor((rent - low) / step);
      bars.forEach(function (b, i) { b.classList.toggle('on', i === idx); });
      var pos = Math.min(100, Math.max(0, (median - low) / (high - low) * 100));
      line.style.left = pos + '%';
      line.querySelector('span').textContent = 'Median J$' + Math.round(median / 1000) + 'k';
    }
    range.addEventListener('input', update);
    area.addEventListener('change', update);
    update();
  }
})();
