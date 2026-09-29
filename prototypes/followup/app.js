/* FollowUp working prototype. Vanilla JS, sample data only. */
(() => {
  'use strict';

  const DATA = window.FOLLOWUP_DATA;
  const KEY = 'followup-prototype-state';
  const BASE = new Date(2026, 8, 30); /* The board is set on Wednesday 30 September 2026 */
  const TODAY_DOW = 3;
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const TEAM = {
    you: { name: 'You', short: 'You' },
    shanice: { name: 'Shanice Morgan', short: 'Shanice' },
    andre: { name: 'Andre Campbell', short: 'Andre' }
  };
  const TEAM_KEYS = ['you', 'shanice', 'andre'];
  const CH = {
    phone: { label: 'Phone call', icon: 'phone', word: '' },
    whatsapp: { label: 'WhatsApp', icon: 'chat', word: 'WhatsApp' },
    email: { label: 'Email', icon: 'mail', word: '' },
    meeting: { label: 'Meeting', icon: 'meet', word: 'Meeting' },
    send: { label: 'Send', icon: 'send', word: '' }
  };
  const CH_KEYS = ['phone', 'whatsapp', 'email', 'meeting', 'send'];
  const DEFAULT_TITLE = { phone: 'Check-in call', whatsapp: 'WhatsApp check-in', email: 'Check-in email', meeting: 'Meeting', send: 'Send details' };
  const VIEWS = ['today', 'upcoming', 'clients', 'reports', 'settings'];
  const VIEW_NAMES = { today: 'Today', upcoming: 'Upcoming', clients: 'Clients', reports: 'Reports', settings: 'Settings' };
  const AREAS = ['Barbican', 'Cherry Gardens', 'Constant Spring', 'Cross Roads', 'Downtown', 'Duhaney Park', 'Half Way Tree', 'Harbour View', 'Havendale', 'Hope Pastures', 'Hughenden', 'Liguanea', 'Manor Park', 'Maxfield Avenue', 'Meadowbrook', 'Mona', 'New Kingston', 'Newport West', 'Norbrook', 'Papine', 'Portmore', 'Red Hills', 'Rollington Town', 'Spanish Town Road', 'Stony Hill', 'Vineyard Town', 'Waltham Park', 'Washington Boulevard', 'Waterloo Road'];
  const mqMobile = window.matchMedia('(max-width: 820px)');
  let T0 = Date.now();

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const E = {
    app: $('#app'), main: $('#main'), panel: $('#panel'), side: $('#side'), toast: $('#toast'),
    menuBtn: $('.menubtn'), menuLabel: $('[data-menu-label]'),
    logDlg: $('#logDlg'), logForm: $('#logForm'), logInput: $('#logInput'), logMirror: $('#logMirror'),
    logFields: $('#logFields'), logAlso: $('#logAlso'),
    clientDlg: $('#clientDlg'), clientForm: $('#clientForm'), clientErr: $('#clientErr')
  };

  /* ---------- Formatting ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => 'J$' + Math.round(n).toLocaleString('en-US');
  const moneyShort = n => n >= 1e6 ? 'J$' + (n / 1e6).toFixed(2) + 'M' : 'J$' + Math.round(n / 1e3) + 'K';
  const pad = n => (n < 10 ? '0' : '') + n;
  const t24 = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const t12 = m => { let h = Math.floor(m / 60); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + pad(m % 60) + ' ' + ap; };
  const clock = s => Math.floor(s / 60) + ':' + pad(s % 60);
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const icon = (name, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  const dateOf = off => new Date(BASE.getFullYear(), BASE.getMonth(), BASE.getDate() + off);
  const dow = off => ((TODAY_DOW + off) % 7 + 7) % 7;
  const dayName = off => DAYS[dow(off)];
  const dayShort = off => DAYS[dow(off)].slice(0, 3);
  const dayMonth = off => { const d = dateOf(off); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
  const dateShort = off => dayShort(off) + ' ' + dayMonth(off);
  const iso = off => { const d = dateOf(off); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const offFromIso = s => {
    const p = String(s || '').split('-').map(Number);
    if (p.length !== 3 || p.some(isNaN)) return null;
    return Math.round((new Date(p[0], p[1] - 1, p[2]) - dateOf(0)) / 864e5);
  };
  const soon = off => off > 1 && off < 7;
  const whenWord = off => off === 0 ? 'today' : off === 1 ? 'tomorrow' : soon(off) ? dayName(off) : dateShort(off);
  const whenLong = off => off === 0 ? 'Today' : off === 1 ? 'Tomorrow' : soon(off) ? dayName(off) : dateShort(off);
  const whenShort = off => off === 0 ? 'Today' : off === 1 ? 'Tomorrow' : soon(off) ? dayShort(off) : dateShort(off);
  const relDays = off => off === 0 ? 'today' : off === 1 ? 'tomorrow' : off < 0 ? Math.abs(off) + ' days ago' : 'in ' + off + ' days';
  const lateText = day => { const n = -day; return n + (n === 1 ? ' day late' : ' days late'); };

  function ago(day) {
    const d = -day;
    if (d <= 0) return 'today';
    if (d === 1) return 'yesterday';
    if (d < 60) return d + ' days ago';
    const months = Math.round(d / 30.4);
    if (months < 12) return months + ' months ago';
    const years = Math.round(months / 12);
    return years === 1 ? '1 year ago' : years + ' years ago';
  }
  function relAgo(day, time) {
    if (day === 0) return 'Today' + (time != null ? ', ' + t24(time) : '');
    if (day === -1) return 'Yesterday';
    return cap(ago(day));
  }
  function dueText(it) {
    const t = it.time != null ? ', ' + t12(it.time) : '';
    if (it.day < 0) return 'Was due ' + (it.day === -1 ? 'yesterday' : it.day > -7 ? dayName(it.day) : dateShort(it.day)) + t;
    if (it.day === 0) return 'Due today' + t;
    if (it.day === 1) return 'Due tomorrow' + t;
    return 'Due ' + (soon(it.day) ? dayName(it.day) : dateShort(it.day)) + t;
  }
  const PAST = {
    call: 'Called', send: 'Sent', confirm: 'Confirmed', check: 'Checked', email: 'Emailed', whatsapp: 'Messaged',
    meet: 'Met', visit: 'Visited', try: 'Tried', chase: 'Chased', remind: 'Reminded', follow: 'Followed', book: 'Booked',
    drop: 'Dropped', collect: 'Collected', deliver: 'Delivered', share: 'Shared', review: 'Reviewed', ask: 'Asked',
    set: 'Set', walk: 'Walked', run: 'Ran', get: 'Got', measure: 'Measured', install: 'Installed', text: 'Texted', ring: 'Rang', phone: 'Phoned'
  };
  function pastTense(t) {
    const m = /^(\S+)(.*)$/.exec(t || '');
    if (!m) return 'Done';
    const w = m[1].toLowerCase();
    if (PAST[w]) return PAST[w] + m[2];
    if (/^renewal reminder/i.test(t)) return 'Sent the renewal reminder';
    if (/^renewal call/i.test(t)) return 'Had the renewal call';
    return 'Done: ' + t;
  }
  /* A simulated clock: the board opens at 09:40 and runs in real time from there. */
  const nowMin = () => Math.min(17 * 60 + 30, 9 * 60 + 40 + Math.floor((Date.now() - T0) / 60000));

  /* ---------- State ---------- */
  let state = load();
  let cmap = {}, imap = {}, vmap = {};
  const freshUi = () => ({ view: 'today', team: null, sel: null, call: null, q: '', sort: { key: 'name', dir: 1 }, period: 12, sheet: false, menu: false, scroll: {}, lastView: null });
  let ui = freshUi();
  let undoSnap = null, toastTimer = 0, callTimer = 0, pop = null, popClosedAt = 0, opener = null;

  function load() {
    try {
      const raw = window.sessionStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.v === DATA.version && Array.isArray(s.clients)) return s;
      }
    } catch (e) { /* storage can be unavailable */ }
    return DATA.build();
  }
  function persist() {
    try { window.sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function reindex() {
    cmap = {}; imap = {}; vmap = {};
    state.clients.forEach(c => { cmap[c.id] = c; });
    state.items.forEach(it => { imap[it.id] = it; });
    state.invoices.forEach(v => { vmap[v.no] = v; });
  }
  const snapshot = () => ({ s: JSON.stringify(state), sel: ui.sel ? Object.assign({}, ui.sel) : null });

  /* ---------- Derived data ---------- */
  const client = id => cmap[id];
  const item = id => imap[id];
  const inv = no => vmap[no];
  const fullName = c => (c.first + ' ' + c.last).trim();
  const boardDay = it => it.status === 'done' ? it.doneDay : Math.max(it.day, 0);
  const byWhen = (a, b) => a.day - b.day || (a.time || 0) - (b.time || 0);
  const mine = it => !ui.team || it.owner === ui.team;
  const openFor = cid => state.items.filter(it => it.clientId === cid && it.status === 'open').sort(byWhen);
  const unpaidFor = cid => state.invoices.filter(v => v.clientId === cid && !v.paid).sort((a, b) => a.issued - b.issued);
  const owed = cid => unpaidFor(cid).reduce((s, v) => s + v.amount, 0);
  const dayCount = (d, team) => state.items.filter(it => (!team || it.owner === team) && boardDay(it) === d).length;
  const upcomingCount = () => state.items.filter(it => it.status === 'open' && it.day > 0).length;

  function board() {
    const over = [], due = [], done = [];
    state.items.forEach(it => {
      if (!mine(it)) return;
      if (it.status === 'open') { if (it.day < 0) over.push(it); else if (it.day === 0) due.push(it); }
      else if (it.doneDay === 0) done.push(it);
    });
    over.sort(byWhen); due.sort(byWhen); done.sort((a, b) => a.doneAt - b.doneAt);
    return { over, due, done };
  }
  const upcoming = () => state.items.filter(it => it.status === 'open' && it.day > 0 && mine(it)).sort(byWhen);
  function waitingOn(list) {
    const seen = {}; let sum = 0;
    list.forEach(it => {
      if (!it.invoice || seen[it.invoice]) return;
      const v = inv(it.invoice);
      if (v && !v.paid) { seen[it.invoice] = 1; sum += v.amount; }
    });
    return sum;
  }
  function itemAmount(it) {
    if (it.invoice) { const v = inv(it.invoice); if (v && !v.paid) return v.amount; }
    return it.value || 0;
  }

  function clientRows() {
    const q = ui.q.trim().toLowerCase();
    const rows = state.clients.filter(c => !q || [fullName(c), c.company, c.area, c.phone].join(' ').toLowerCase().includes(q));
    const k = ui.sort.key, dir = ui.sort.dir;
    const nx = c => openFor(c.id)[0] || null;
    rows.sort((a, b) => {
      let r = 0;
      if (k === 'name') r = fullName(a).localeCompare(fullName(b));
      else if (k === 'company') r = (a.company || '').localeCompare(b.company || '');
      else if (k === 'area') r = (a.area || '').localeCompare(b.area || '');
      else if (k === 'owed') r = owed(a.id) - owed(b.id);
      else if (k === 'owner') r = TEAM_KEYS.indexOf(a.owner) - TEAM_KEYS.indexOf(b.owner);
      else if (k === 'next') {
        const x = nx(a), y = nx(b);
        if (!x || !y) { if (x || y) return x ? -1 : 1; r = 0; } else r = byWhen(x, y);
      }
      return r * dir || fullName(a).localeCompare(fullName(b));
    });
    return rows;
  }

  /* ---------- Selection ---------- */
  function viewList() {
    if (ui.view === 'today') { const b = board(); return b.over.concat(b.due, b.done).map(it => ({ type: 'item', id: it.id })); }
    if (ui.view === 'upcoming') return upcoming().map(it => ({ type: 'item', id: it.id }));
    if (ui.view === 'clients') return clientRows().map(c => ({ type: 'client', id: c.id }));
    return [];
  }
  const sameSel = (a, b) => !!a && !!b && a.type === b.type && a.id === b.id;
  const selIndex = list => list.findIndex(x => sameSel(x, ui.sel));
  function ensureSel() {
    if (ui.view === 'reports' || ui.view === 'settings') return;
    if (ui.sel && ui.sel.type === 'item' && !item(ui.sel.id)) ui.sel = null;
    if (ui.sel && ui.sel.type === 'client' && !client(ui.sel.id)) ui.sel = null;
    if (ui.view === 'clients') {
      if (ui.sel && ui.sel.type === 'item') ui.sel = { type: 'client', id: item(ui.sel.id).clientId };
      if (!ui.sel) ui.sel = viewList()[0] || null;
      return;
    }
    if (ui.sel && ui.sel.type === 'client') return; /* a client with no row, e.g. just added */
    const list = viewList();
    if (selIndex(list) < 0) ui.sel = list[0] || null;
  }
  function panelClient() {
    if (!ui.sel) return null;
    if (ui.sel.type === 'item') { const it = item(ui.sel.id); return it ? client(it.clientId) : null; }
    return client(ui.sel.id) || null;
  }
  function nextStep(c) {
    if (!c) return null;
    const s = ui.sel && ui.sel.type === 'item' ? item(ui.sel.id) : null;
    if (s && s.status === 'open' && s.clientId === c.id) return s;
    return openFor(c.id)[0] || null;
  }
  /* After an item leaves (or changes place in) the list, move to the nearest one that is still open. */
  function advanceFrom(prevList, idx, movedId) {
    const now = viewList();
    const ok = x => x.id !== movedId && now.some(y => sameSel(x, y)) && (x.type !== 'item' || item(x.id).status === 'open');
    for (let i = idx + 1; i < prevList.length; i++) if (ok(prevList[i])) { ui.sel = prevList[i]; return; }
    for (let i = idx - 1; i >= 0; i--) if (ok(prevList[i])) { ui.sel = prevList[i]; return; }
    if (!now.some(y => sameSel(y, ui.sel))) ui.sel = now[0] || null;
  }

  /* ---------- Rendering ---------- */
  function render() {
    reindex();
    ensureSel();
    const a = document.activeElement;
    const key = a && a !== document.body ? focusKey(a) : null;
    let s0 = null, s1 = null;
    if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName) && /^(text|search|tel|)$/.test(a.type || '')) { try { s0 = a.selectionStart; s1 = a.selectionEnd; } catch (e) { /* noop */ } }
    renderSide();
    renderMain();
    renderPanel();
    if (ui.view === 'reports') drawChart();
    if (key && a && !document.contains(a)) {
      const n = document.querySelector(key);
      if (n) { n.focus({ preventScroll: true }); if (s0 != null && n.setSelectionRange) { try { n.setSelectionRange(s0, s1); } catch (e) { /* noop */ } } }
    }
    persist();
  }
  function focusKey(n) {
    if (n.id) return '#' + CSS.escape(n.id);
    const d = n.dataset || {};
    if (d.item) return `[data-item="${d.item}"]`;
    if (d.client && n.tagName === 'BUTTON') return `button[data-client="${d.client}"]`;
    if (d.act) return `[data-act="${d.act}"]` + (d.key ? `[data-key="${d.key}"]` : '') + (d.day ? `[data-day="${d.day}"]` : '');
    if (d.nav) return `[data-nav="${d.nav}"]`;
    if (d.team) return `[data-team="${d.team}"]`;
    if (d.day) return `[data-day="${d.day}"]`;
    return null;
  }

  function renderSide() {
    const counts = { today: dayCount(0), upcoming: upcomingCount(), clients: state.clients.length };
    TEAM_KEYS.forEach(k => { counts[k] = dayCount(0, k); });
    $$('[data-count]').forEach(n => { n.textContent = counts[n.dataset.count]; });
    $$('[data-nav]', E.side).forEach(b => {
      const on = b.dataset.nav === ui.view;
      b.classList.toggle('on', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $$('[data-team]', E.side).forEach(b => {
      const on = ui.team === b.dataset.team;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    E.menuLabel.textContent = VIEW_NAMES[ui.view] + (ui.team ? ' · ' + TEAM[ui.team].short : '');
    E.app.classList.toggle('menu-open', ui.menu);
    E.menuBtn.setAttribute('aria-expanded', ui.menu ? 'true' : 'false');
  }

  function renderMain() {
    const prev = $('.scroll', E.main);
    if (prev && ui.lastView === ui.view) ui.scroll[ui.view] = prev.scrollTop;
    const views = { today: viewToday, upcoming: viewUpcoming, clients: viewClients, reports: viewReports, settings: viewSettings };
    E.main.innerHTML = views[ui.view]();
    E.app.dataset.view = ui.view;
    const sc = $('.scroll', E.main);
    if (sc && ui.lastView === ui.view && ui.scroll[ui.view]) sc.scrollTop = ui.scroll[ui.view];
    ui.lastView = ui.view;
  }

  const head = (title, sub, extra) => `<div class="mhead"><div class="mhead-t"><h1>${title}</h1><p class="sub">${sub}</p></div>${extra == null ? '<button type="button" class="btn" data-act="new-client">New client</button>' : extra}</div>`;
  const hints = () => '<p class="hints-bar" aria-hidden="true">J / K move · D done · R reschedule · N new follow-up</p>';
  const filterLine = () => ui.team ? `<p class="filter">Showing <b>${TEAM[ui.team].name}</b> · <button type="button" class="textbtn link" data-act="show-all">Show everyone</button></p>` : '';
  const isSel = (type, id) => !!ui.sel && ui.sel.type === type && ui.sel.id === id;

  function viewToday() {
    const b = board();
    const total = b.over.length + b.due.length + b.done.length;
    const parts = [dayName(0), plural(total, 'follow-up')];
    parts.push(b.over.length ? `<span class="rust">${b.over.length} overdue</span>` : 'nothing overdue');
    const w = waitingOn(b.over.concat(b.due, b.done));
    if (w) parts.push(`<span class="fig ink">${money(w)}</span> waiting on payment`);
    return head('Today', parts.join(' · ')) + weekStrip() +
      `<button type="button" class="logbox" data-act="log">${icon('plus')}<span class="logbox-t">Log a follow-up<span class="logbox-ex"> in one line — “Call Marsha about invoice 1042 Friday 10am”</span></span><kbd>N</kbd></button>` +
      filterLine() +
      `<div class="board scroll">${col('over', 'Overdue', b.over, 'Nothing overdue.')}${col('due', 'Due today', b.due, 'Nothing else due today.')}${col('done', 'Done', b.done, 'Nothing done yet today.')}</div>` +
      hints();
  }

  function weekStrip() {
    const days = state.settings.weekends ? [-2, -1, 0, 1, 2, 3, 4] : [-2, -1, 0, 1, 2];
    const cells = days.map(d => {
      const n = dayCount(d, ui.team);
      const h = n ? Math.min(36, Math.max(3, Math.round(n * 3.3))) : 0;
      const inner = `<span class="wk-l">${dayShort(d)}${d === 0 ? '<span class="wk-today"> · today</span>' : ''}</span><span class="wk-v"><span class="wk-in"><span class="wk-n">${n}</span><span class="wk-b${n ? '' : ' zero'}" style="height:${h || 1}px"></span></span></span>`;
      if (d > 0) return `<button type="button" class="wk-d next" data-day="${d}" aria-label="${dayName(d)}: ${plural(n, 'follow-up')}. Show in Upcoming">${inner}</button>`;
      return `<div class="wk-d ${d < 0 ? 'past' : 'now'}"${d === 0 ? ' aria-current="date"' : ''} aria-label="${dayName(d)}${d === 0 ? ', today' : ''}: ${plural(n, 'follow-up')}">${inner}</div>`;
    });
    return `<div class="week" role="group" aria-label="This week" style="--days:${days.length}">${cells.join('')}</div>`;
  }

  function col(key, label, list, empty) {
    return `<section class="col col-${key}" aria-labelledby="h-${key}"><header class="colh"><h2 id="h-${key}">${label}</h2><span class="n">${list.length}</span></header>` +
      (list.length ? `<ul class="rows">${list.map(it => rowHtml(it)).join('')}</ul>` : `<p class="empty">${empty}</p>`) + '</section>';
  }

  function rowHtml(it) {
    const c = client(it.clientId);
    const done = it.status === 'done';
    const sel = isSel('item', it.id);
    let right;
    if (done) right = `<span class="rt">${t24(it.doneAt)}</span>`;
    else if (it.day < 0) right = `<span class="rt late">${lateText(it.day)}</span>`;
    else right = `<span class="rt${it.day === 0 && it.time < nowMin() ? ' late' : ''}">${t24(it.time)}</span>`;
    let meta, amt = '';
    if (done) {
      const nx = openFor(c.id)[0];
      meta = esc(TEAM[it.owner].short) + (nx ? ' · next step set for ' + (nx.day <= 0 ? 'today' : whenShort(nx.day) === 'Tomorrow' ? 'tomorrow' : whenShort(nx.day)) : '');
    } else {
      const w = CH[it.channel].word;
      meta = icon(CH[it.channel].icon) + `<span>${esc(TEAM[it.owner].short)}${w ? ' · ' + w : ''}</span>`;
      const a = itemAmount(it);
      if (a) amt = `<span class="amt">${money(a)}</span>`;
    }
    return `<li><button type="button" class="row${sel ? ' is-sel' : ''}${done ? ' is-done' : ''}" data-item="${it.id}"${sel ? ' aria-current="true"' : ''}>` +
      `<span class="r1"><span class="nm">${done ? icon('check') : ''}${esc(fullName(c))}</span>${right}</span>` +
      `<span class="r2">${esc(done ? it.result : it.title)}</span>` +
      `<span class="r3"><span class="who">${meta}</span>${amt}</span></button></li>`;
  }

  function viewUpcoming() {
    const list = upcoming();
    const groups = {};
    list.forEach(it => { (groups[it.day] = groups[it.day] || []).push(it); });
    const lastDay = state.settings.weekends ? 4 : 2;
    const days = [];
    for (let d = 1; d <= lastDay; d++) days.push(d);
    Object.keys(groups).map(Number).forEach(d => { if (!days.includes(d)) days.push(d); });
    days.sort((a, b) => a - b);
    const w = waitingOn(list);
    const sub = [plural(list.length, 'follow-up') + ' after today'];
    if (w) sub.push(`<span class="fig ink">${money(w)}</span> on unpaid invoices`);
    let html = head('Upcoming', sub.join(' · ')) + filterLine() + '<div class="scroll upc">';
    days.forEach(d => {
      const g = groups[d] || [];
      const note = d >= 5 && d <= 11 ? dayMonth(d) + ' · next week' : dayMonth(d);
      html += `<section class="grp" id="day-${d}" aria-labelledby="gh-${d}"><header class="colh"><h2 id="gh-${d}">${dayName(d)} <span class="colh-sub">${note}</span></h2><span class="n">${g.length}</span></header>` +
        (g.length ? `<ul class="rows grid">${g.map(it => rowHtml(it)).join('')}</ul>` : '<p class="empty">Nothing planned.</p>') + '</section>';
    });
    return html + '</div>' + hints();
  }

  function viewClients() {
    const rows = clientRows();
    const all = state.clients.length;
    const unpaid = state.invoices.filter(v => !v.paid);
    const total = unpaid.reduce((s, v) => s + v.amount, 0);
    const sub = `${plural(all, 'client')} · <span class="fig ink">${money(total)}</span> outstanding on ${plural(unpaid.length, 'invoice')}`;
    const th = (key, label, cls) => {
      const on = ui.sort.key === key;
      return `<th scope="col" class="${cls || ''}"${on ? ` aria-sort="${ui.sort.dir === 1 ? 'ascending' : 'descending'}"` : ''}><button type="button" data-act="sort" data-key="${key}">${label}<svg class="ic sort${on ? ' on' : ''}${on && ui.sort.dir === -1 ? ' down' : ''}" aria-hidden="true"><use href="#i-send"/></svg></button></th>`;
    };
    const body = rows.map(c => {
      const nx = openFor(c.id)[0];
      const o = owed(c.id);
      const sel = isSel('client', c.id);
      const next = nx ? `${esc(nx.title)} <span class="${nx.day < 0 ? 'rust' : 'muted'}">· ${nx.day < 0 ? lateText(nx.day) : esc(whenShort(nx.day))}</span>` : '<span class="muted">—</span>';
      return `<tr data-client="${c.id}" class="${sel ? 'is-sel' : ''}"><td class="c-name"><button type="button" class="cl" data-client="${c.id}"${sel ? ' aria-current="true"' : ''}>${esc(fullName(c))}</button><span class="c-sub">${esc([c.company, c.area].filter(Boolean).join(' · '))}</span></td>` +
        `<td class="c-co">${esc(c.company || '—')}</td><td class="c-area">${esc(c.area || '—')}</td>` +
        `<td class="num">${o ? money(o) : '<span class="muted">—</span>'}</td><td class="c-next">${next}</td><td class="c-own">${TEAM[c.owner].short}</td></tr>`;
    }).join('');
    const empty = rows.length ? '' : `<tr><td colspan="6" class="empty">No clients match “${esc(ui.q)}”.</td></tr>`;
    return head('Clients', sub) +
      `<div class="search">${icon('search')}<input id="clientSearch" type="search" placeholder="Search by name, company or area" value="${esc(ui.q)}" aria-label="Search clients" autocomplete="off" spellcheck="false"></div>` +
      (ui.q.trim() ? `<p class="found" aria-live="polite">Showing ${rows.length} of ${all}</p>` : '') +
      `<div class="scroll tbl-wrap"><table class="tbl"><thead><tr>${th('name', 'Name', 'c-name')}${th('company', 'Company', 'c-co')}${th('area', 'Area', 'c-area')}${th('owed', 'Outstanding', 'num')}${th('next', 'Next step', 'c-next')}${th('owner', 'Owner', 'c-own')}</tr></thead><tbody>${body}${empty}</tbody></table></div>` +
      hints();
  }

  function reportData() {
    const P = ui.period;
    const weeks = DATA.weeks.slice(-P);
    const offset = DATA.weeks.length - weeks.length;
    const done = weeks.reduce((s, w) => s + w[0] + w[1], 0);
    const onTime = weeks.reduce((s, w) => s + w[0], 0);
    return { P, weeks, offset, done, pct: Math.round(onTime / done * 100), meta: DATA.periods[P] };
  }

  function viewReports() {
    const r = reportData();
    const overdueNow = state.items.filter(it => it.status === 'open' && it.day < 0).length;
    const period = `<label class="period"><span>Period</span><select id="period"><option value="4"${r.P === 4 ? ' selected' : ''}>Last 4 weeks</option><option value="12"${r.P === 12 ? ' selected' : ''}>Last 12 weeks</option></select></label>`;
    const first = r.weeks[0][1], last = r.weeks[r.weeks.length - 1][1];
    const take = first > last ? `Late follow-ups fell from ${first} to ${last} a week over the period.` : first < last ? `Late follow-ups rose from ${first} to ${last} a week over the period.` : `Late follow-ups held at ${last} a week over the period.`;
    const team = r.meta.team.map(t => `<li><div class="tm-r"><span class="tm-n">${TEAM[t[0]].name}</span><span class="tm-d">${t[1]}</span><span class="tm-p">${t[2]}%</span></div><div class="tm-bar" role="img" aria-label="${t[2]}% on time"><i style="width:${t[2]}%"></i></div></li>`).join('');
    const maxR = Math.max(...r.meta.reply.map(x => x[1]));
    const reply = r.meta.reply.map(x => `<li><span class="rp-l">${x[0]}</span><span class="rp-t"><i style="width:${(x[1] / maxR * 100).toFixed(1)}%"></i></span><span class="rp-v">${x[1] >= 10 ? x[1] : x[1].toFixed(1)} h</span></li>`).join('');
    return `<div class="mhead rep-head"><div class="mhead-t"><h1>Reports</h1><p class="sub">How the team is keeping up with clients</p></div>${period}</div>` +
      `<div class="scroll rep-scroll"><div class="stats">` +
      `<div class="stat"><p class="stat-l">Follow-ups done</p><p class="stat-v">${r.done}</p></div>` +
      `<div class="stat"><p class="stat-l">Done on time</p><p class="stat-v indigo">${r.pct}%</p></div>` +
      `<div class="stat"><p class="stat-l">Overdue right now</p><p class="stat-v${overdueNow ? ' rust' : ''}">${overdueNow}</p></div>` +
      `<div class="stat"><p class="stat-l">Paid within 7 days of a follow-up</p><p class="stat-v fig">${moneyShort(r.meta.paid)}</p></div></div>` +
      `<div class="rep"><section class="rep-chart" aria-labelledby="ch-h"><div class="rep-h"><h2 id="ch-h">Follow-ups done each week</h2><p class="legend"><span><i class="lg-on"></i>On time</span><span><i class="lg-late"></i>Late</span></p></div>` +
      `<div class="chart" id="chart"><div class="chart-svg"></div><div class="chart-tip" role="tooltip" hidden></div></div><p class="take">${take}</p></section>` +
      `<section class="rep-side"><h2 class="rep-h2">By team member</h2><div class="tm-head"><span>Name</span><span>Done</span><span>On time</span></div><ul class="tm">${team}</ul>` +
      `<h2 class="rep-h2 rp-h">How fast clients reply</h2><ul class="rp">${reply}</ul></section></div>` +
      '<p class="rep-note">Sample data for the prototype.</p></div>';
  }

  function drawChart() {
    const wrap = $('#chart');
    if (!wrap) return;
    const r = reportData();
    const W = Math.max(260, Math.floor(wrap.clientWidth || 600));
    const H = mqMobile.matches ? 220 : 268;
    const padL = 48, padT = 14, padB = 30, padR = 2;
    const plotH = H - padT - padB, plotW = W - padL - padR;
    const yMax = 40;
    const n = r.weeks.length;
    const bw = plotW / n;
    const barW = Math.min(36, bw * 0.6);
    const y = v => padT + plotH * (1 - v / yMax);
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Stacked bars: on-time and late follow-ups for each of the last ${n} weeks">`;
    for (let v = 0; v <= yMax; v += 10) {
      s += `<line x1="${padL - 6}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}" class="${v === 0 ? 'ax' : 'gr'}"/>`;
      s += `<text x="${padL - 16}" y="${y(v) + 4}" class="yl" text-anchor="end">${v}</text>`;
    }
    r.weeks.forEach((w, i) => {
      const cx = padL + bw * (i + 0.5);
      const x = cx - barW / 2;
      const onH = plotH * w[0] / yMax, lateH = plotH * w[1] / yMax;
      const base = y(0);
      s += `<rect x="${x.toFixed(1)}" y="${(base - onH).toFixed(1)}" width="${barW.toFixed(1)}" height="${onH.toFixed(1)}" class="b-on"/>`;
      s += `<rect x="${x.toFixed(1)}" y="${(base - onH - lateH).toFixed(1)}" width="${barW.toFixed(1)}" height="${lateH.toFixed(1)}" class="b-late"/>`;
      s += `<text x="${cx.toFixed(1)}" y="${H - 9}" class="xl" text-anchor="middle">W${r.offset + i + 1}</text>`;
      s += `<rect x="${(padL + bw * i).toFixed(1)}" y="${padT}" width="${bw.toFixed(1)}" height="${plotH}" class="hit" data-w="${i}" tabindex="0" aria-label="Week ${r.offset + i + 1}: ${w[0] + w[1]} done, ${w[0]} on time, ${w[1]} late"/>`;
    });
    s += '</svg>';
    $('.chart-svg', wrap).innerHTML = s;
    const tip = $('.chart-tip', wrap);
    const show = t => {
      const i = +t.dataset.w, w = r.weeks[i];
      const cx = padL + bw * (i + 0.5);
      const top = y(w[0] + w[1]);
      $$('.hit', wrap).forEach(h => h.classList.toggle('on', h === t));
      tip.innerHTML = `<b>W${r.offset + i + 1}</b> · ${w[0] + w[1]} done<br><span class="tip-on">${w[0]} on time</span> · <span class="tip-late">${w[1]} late</span>`;
      tip.hidden = false;
      const tw = tip.offsetWidth;
      const left = Math.min(Math.max(cx - tw / 2, 0), W - tw);
      tip.style.left = left + 'px';
      tip.style.top = Math.max(0, top - tip.offsetHeight - 8) + 'px';
    };
    const hide = () => { tip.hidden = true; $$('.hit', wrap).forEach(h => h.classList.remove('on')); };
    $$('.hit', wrap).forEach(h => {
      h.addEventListener('mouseenter', () => show(h));
      h.addEventListener('focus', () => show(h));
      h.addEventListener('mouseleave', hide);
      h.addEventListener('blur', hide);
    });
  }

  function viewSettings() {
    const S = state.settings;
    const times = [];
    for (let m = 7 * 60; m <= 19 * 60; m += 30) times.push(m);
    const opt = (v, label, cur) => `<option value="${v}"${v === cur ? ' selected' : ''}>${label}</option>`;
    return `<div class="mhead"><div class="mhead-t"><h1>Settings</h1><p class="sub">How FollowUp schedules follow-ups for you. Changes save as you go.</p></div></div>` +
      '<div class="scroll set">' +
      `<div class="set-row"><div><p class="set-l" id="sl-hours">Working hours</p><p class="set-d">Follow-ups logged outside these hours are flagged.</p></div><div class="set-c" role="group" aria-labelledby="sl-hours"><select id="setStart" aria-label="Start">${times.filter(m => m <= 12 * 60).map(m => opt(m, t12(m), S.start)).join('')}</select><span class="muted">to</span><select id="setEnd" aria-label="End">${times.filter(m => m >= 12 * 60).map(m => opt(m, t12(m), S.end)).join('')}</select></div></div>` +
      `<div class="set-row"><div><p class="set-l"><label for="setDefault">Default follow-up time</label></p><p class="set-d">Used when you give a day but no time, and for next steps after a call.</p></div><div class="set-c"><select id="setDefault">${[540, 600, 660, 840, 900].map(m => opt(m, t12(m), S.defaultTime)).join('')}</select></div></div>` +
      `<div class="set-row"><div><p class="set-l"><label for="setRemind">Remind me before a follow-up is due</label></p><p class="set-d">A reminder on your phone and in the browser.</p></div><div class="set-c"><select id="setRemind">${opt(0, 'Off', S.remind)}${opt(15, '15 minutes', S.remind)}${opt(30, '30 minutes', S.remind)}${opt(60, '1 hour', S.remind)}</select></div></div>` +
      `<div class="set-row"><div><p class="set-l"><label for="setWeekends">Show weekends</label></p><p class="set-d">Saturday and Sunday in the week strip and in Upcoming.</p></div><div class="set-c"><input type="checkbox" id="setWeekends"${S.weekends ? ' checked' : ''}></div></div>` +
      `<div class="set-row"><div><p class="set-l">Team</p><p class="set-d">You, Shanice Morgan and Andre Campbell. Your admin manages who’s on the team.</p></div></div>` +
      '</div>';
  }

  /* ---------- Panel ---------- */
  const sheetBar = () => '<div class="sheet-bar"><button type="button" class="textbtn back" data-act="sheet-close">' + icon('back') + '<span>Back</span></button></div>';

  function renderPanel() {
    const hasPanel = ui.view === 'today' || ui.view === 'upcoming' || ui.view === 'clients';
    E.app.classList.toggle('no-panel', !hasPanel);
    const c = panelClient();
    if (ui.call) E.panel.innerHTML = ui.call.phase === 'calling' ? callingHtml() : afterHtml();
    else if (!c) E.panel.innerHTML = sheetBar() + '<div class="p-empty"><p>Nothing selected.</p><p class="muted">Pick a follow-up or a client to see their details here.</p></div>';
    else E.panel.innerHTML = clientHtml(c);
    const sheet = ui.sheet && mqMobile.matches && hasPanel;
    E.app.classList.toggle('sheet-open', sheet);
    document.documentElement.classList.toggle('lock', sheet || (ui.menu && mqMobile.matches));
  }

  function clientHtml(c) {
    const unpaid = unpaidFor(c.id);
    const total = unpaid.reduce((s, v) => s + v.amount, 0);
    const ns = nextStep(c);
    let h = sheetBar();
    h += `<h2 class="p-name" tabindex="-1">${esc(fullName(c))}</h2><p class="p-sub">${esc([c.company, c.area].filter(Boolean).join(' · ') || 'No company yet')}</p><hr class="p-rule">`;
    h += '<div class="p-out"><p class="p-lbl">Outstanding</p>';
    if (total) {
      h += `<p class="p-amt fig">${money(total)}</p><p class="p-note">${unpaid.length === 1 ? `Invoice ${unpaid[0].no} · issued ${ago(unpaid[0].issued)}` : `${unpaid.length} invoices · oldest issued ${ago(unpaid[0].issued)}`}</p>`;
    } else {
      h += '<p class="p-amt fig zero">J$0</p><p class="p-note">No unpaid invoices</p>';
    }
    h += '</div><hr class="p-rule">';
    h += '<p class="eyebrow">Next step</p>';
    if (ns) {
      h += `<p class="ns-t">${esc(ns.title)}</p><p class="ns-d${ns.day < 0 ? ' rust' : ''}">${dueText(ns)}${ns.owner !== 'you' ? ' · ' + TEAM[ns.owner].short : ''}</p>`;
    } else {
      h += '<p class="ns-t none">Nothing planned</p><p class="ns-d">Add a follow-up so this client doesn’t slip.</p>';
    }
    h += `<p class="tip"><b>Tip:</b> ${esc(c.tip)}</p>`;
    h += '<div class="pacts">' +
      `<button type="button" class="btn btn-primary" data-act="call">${icon('phone')}<span>Call now</span></button>` +
      (ns ? '<button type="button" class="btn" data-act="done">Done <span class="k" aria-hidden="true">D</span></button><button type="button" class="btn" data-act="later" aria-haspopup="true" aria-expanded="false">Later <span class="k" aria-hidden="true">R</span></button>'
        : '<button type="button" class="btn span2" data-act="add-fu">Add follow-up <span class="k" aria-hidden="true">N</span></button>') +
      '</div>';
    const hist = c.history.slice().sort((a, b) => b.day - a.day || (b.time || 0) - (a.time || 0));
    h += '<p class="eyebrow hist-h">History</p><ol class="hist">' + hist.map(x =>
      `<li><p class="h-t">${esc(x.text)}</p>${x.note ? `<p class="h-n">${esc(x.note)}</p>` : ''}<p class="h-m">${relAgo(x.day, x.time)} · ${TEAM[x.who].short}</p></li>`).join('') + '</ol>';
    return h;
  }

  function callingHtml() {
    const k = ui.call, c = client(k.clientId), v = k.invoice ? inv(k.invoice) : null;
    const secs = Math.floor((Date.now() - k.start) / 1000);
    return '<div class="calling">' +
      `<p class="call-state">${icon('phone')}<span>Calling ${esc(fullName(c))}…</span><span class="fig" data-timer>${clock(secs)}</span></p>` +
      `<h2 class="p-name" tabindex="-1">${esc(fullName(c))}</h2><p class="p-sub">${esc([c.phone, c.company].filter(Boolean).join(' · '))}</p><hr class="p-rule">` +
      `<p class="p-lbl">On the line</p><p class="p-amt fig" data-timer>${clock(secs)}</p>` +
      `<p class="p-note">${v ? `Invoice ${v.no} · <span class="fig ink">${money(v.amount)}</span> outstanding` : 'Nothing outstanding'}</p>` +
      `<p class="tip"><b>Tip:</b> ${esc(c.tip)}</p>` +
      `<div class="pacts one"><button type="button" class="btn btn-primary" data-act="end-call">${icon('phone')}<span>End call</span></button></div>` +
      '<p class="call-note">Prototype: no call is placed. End the call to log how it went.</p></div>';
  }

  function payOutcomes(pay) {
    return pay ? [['paid', 'Paid in full'], ['promised', 'Promised to pay'], ['more', 'Asked for more time'], ['none', 'No answer']]
      : [['sorted', 'All sorted'], ['followup', 'Wants a follow-up'], ['callback', 'Asked to call back'], ['none', 'No answer']];
  }
  const NEEDS_DAY = ['promised', 'more', 'followup', 'callback'];

  function nextFromCall(k) {
    const def = state.settings.defaultTime;
    const v = k.invoice ? inv(k.invoice) : null;
    switch (k.outcome) {
      case null: return { none: true, text: 'Pick how it went to set the next step.' };
      case 'paid': return { none: true, text: v ? `Nothing to add. Invoice ${v.no} will be marked paid.` : 'Nothing to add.' };
      case 'sorted': return { none: true, text: 'Nothing to add. This follow-up will be marked done.' };
      case 'promised': case 'more': return { title: 'Check payment', day: k.pay, time: def };
      case 'followup': return { title: 'Follow up', day: k.pay, time: def };
      case 'callback': return { title: 'Call back', day: k.pay, time: def };
      case 'none': return { title: 'Try again', day: 1, time: def };
      default: return { none: true, text: '' };
    }
  }

  function afterHtml() {
    const k = ui.call, c = client(k.clientId), v = k.invoice ? inv(k.invoice) : null;
    const outs = payOutcomes(!!v);
    const sub = [c.company].filter(Boolean);
    if (v) sub.push('Invoice ' + v.no);
    let h = '<form class="after" id="afterForm" novalidate>' +
      `<p class="ended">${icon('phone')}<span>Call ended ·</span><span class="fig">${clock(k.secs)}</span></p>` +
      `<h2 class="a-name" tabindex="-1">${esc(fullName(c))}</h2>` +
      `<p class="a-sub">${esc(sub.join(' · '))}${v ? `${sub.length ? ' · ' : ''}<span class="fig ink">${money(v.amount)}</span>` : ''}</p>` +
      '<fieldset class="a-set"><legend class="eyebrow">How did it go?</legend><div class="radios">' +
      outs.map(o => `<label class="radio${k.outcome === o[0] ? ' on' : ''}"><input type="radio" name="outcome" id="oc-${o[0]}" value="${o[0]}"${k.outcome === o[0] ? ' checked' : ''}><span class="rd" aria-hidden="true"></span><span>${o[1]}</span></label>`).join('') +
      '</div></fieldset>';
    if (NEEDS_DAY.includes(k.outcome)) {
      const picked = k.pay != null && k.pay !== 2 && k.pay !== 5;
      const chip = (d, label) => `<button type="button" class="chip" data-act="pay" data-day="${d}" aria-pressed="${k.pay === d && !k.picking ? 'true' : 'false'}">${label}</button>`;
      h += `<fieldset class="a-set"><legend class="eyebrow">${v ? 'When will they pay?' : 'When should you follow up?'}</legend><div class="chips">` +
        chip(2, dayName(2)) + chip(5, dayName(5)) +
        `<button type="button" class="chip" data-act="pay-pick" aria-pressed="${picked || k.picking ? 'true' : 'false'}">${picked ? esc(dateShort(k.pay)) : 'Pick a date'}</button></div>` +
        (k.picking || picked ? `<label class="a-date"><span class="sr-only">Pick a date</span><input type="date" id="afterDate" min="${iso(1)}" max="${iso(90)}" value="${picked ? iso(k.pay) : ''}"></label>` : '') +
        '</fieldset>';
    }
    h += `<div class="a-set a-note"><label class="eyebrow" for="afterNote">Note</label><textarea id="afterNote" rows="2" placeholder="${v ? 'Paying by bank transfer, will send receipt' : 'What did you agree?'}">${esc(k.note)}</textarea></div>`;
    const nx = nextFromCall(k);
    if (nx.none) {
      h += `<div class="a-next"><div><p class="a-next-l">Next step</p><p class="a-next-t muted">${esc(nx.text)}</p></div></div>`;
    } else {
      h += `<div class="a-next"><label for="afterAdd"><span class="a-next-l">Next step, added for ${k.itemId && item(k.itemId) && item(k.itemId).owner !== 'you' ? TEAM[item(k.itemId).owner].short : 'you'}</span><span class="a-next-t">${esc(nx.title)} · ${esc(whenShort(nx.day))} ${t12(nx.time)}</span></label><input type="checkbox" id="afterAdd"${k.add ? ' checked' : ''}></div>`;
    }
    h += `<p class="a-err" id="afterErr"${k.err ? '' : ' hidden'}>Pick how the call went first.</p>`;
    h += '<button type="submit" class="btn btn-primary btn-block">Save</button><button type="button" class="skip" data-act="skip-call">Skip for now</button></form>';
    return h;
  }

  /* ---------- Actions ---------- */
  function blockedByCall() {
    if (ui.call) { toast(ui.call.phase === 'calling' ? 'End the call first' : 'Save or skip the call first'); return true; }
    return false;
  }

  function go(view, keepTeam) {
    if (!VIEWS.includes(view)) view = 'today';
    if (view !== ui.view && blockedByCall()) return;
    closePop();
    ui.view = view;
    ui.menu = false;
    if (!keepTeam) ui.team = null;
    if ((view === 'today' || view === 'upcoming') && ui.sel && ui.sel.type === 'client') {
      reindex();
      const list = viewList();
      const hit = list.find(x => item(x.id).clientId === ui.sel.id);
      ui.sel = hit || list[0] || null;
    }
    if (mqMobile.matches) { ui.sheet = false; window.scrollTo(0, 0); }
    try { history.replaceState(null, '', '#' + view); } catch (e) { /* noop */ }
    render();
  }

  function setTeam(k) {
    if (blockedByCall()) return;
    ui.team = k && ui.team !== k ? k : null;
    if (ui.view !== 'today' && ui.view !== 'upcoming') { ui.view = 'today'; try { history.replaceState(null, '', '#today'); } catch (e) { /* noop */ } }
    ui.menu = false;
    if (mqMobile.matches) ui.sheet = false;
    reindex();
    const list = viewList();
    if (selIndex(list) < 0) ui.sel = list[0] || null;
    render();
  }

  function selectItem(id) {
    if (ui.call && !(ui.sel && ui.sel.id === id)) { blockedByCall(); return; }
    ui.sel = { type: 'item', id };
    if (mqMobile.matches) ui.sheet = true;
    render();
    if (mqMobile.matches) focusSheet();
  }
  function selectClient(id) {
    if (ui.call) { blockedByCall(); return; }
    ui.sel = { type: 'client', id };
    if (mqMobile.matches) ui.sheet = true;
    render();
    if (mqMobile.matches) focusSheet();
  }
  function focusSheet() { const h = $('.p-name, .a-name', E.panel); if (h) h.focus({ preventScroll: true }); E.panel.scrollTop = 0; }
  function closeSheet() {
    ui.sheet = false;
    render();
    const r = ui.sel && (ui.sel.type === 'item' ? $(`[data-item="${ui.sel.id}"]`) : $(`button[data-client="${ui.sel.id}"]`));
    if (r) r.focus({ preventScroll: true });
  }

  function goDay(d) {
    if (blockedByCall()) return;
    ui.view = 'upcoming';
    reindex();
    const first = upcoming().find(it => it.day === d);
    if (first) ui.sel = { type: 'item', id: first.id };
    try { history.replaceState(null, '', '#upcoming'); } catch (e) { /* noop */ }
    render();
    const g = $('#day-' + d);
    if (g) g.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function markDone(it) {
    if (!it || it.status !== 'open') return;
    const snap = snapshot();
    const list = viewList(), idx = selIndex(list);
    const wasSel = ui.sel && ui.sel.type === 'item' && ui.sel.id === it.id;
    it.status = 'done'; it.doneDay = 0; it.doneAt = nowMin(); it.result = pastTense(it.title);
    client(it.clientId).history.push({ text: it.result, day: 0, time: it.doneAt, who: it.owner });
    reindex();
    if (wasSel && (ui.view === 'today' || ui.view === 'upcoming')) advanceFrom(list, idx, it.id);
    if (mqMobile.matches) ui.sheet = false;
    render();
    toast('Marked done', snap);
  }

  function reschedule(it, day) {
    if (!it || day == null || isNaN(day)) return;
    const snap = snapshot();
    const list = viewList(), idx = selIndex(list);
    const wasSel = ui.sel && ui.sel.type === 'item' && ui.sel.id === it.id;
    it.day = day;
    if (it.time == null) it.time = state.settings.defaultTime;
    reindex();
    if (wasSel && ui.view === 'today') advanceFrom(list, idx, it.id);
    if (mqMobile.matches) ui.sheet = false;
    render();
    toast('Moved to ' + whenWord(day), snap);
  }

  function openLater(anchor, it) {
    if (!it || !anchor) return;
    if (pop && pop.anchor === anchor) { closePop(); return; }
    const opts = [[1, 'Tomorrow'], [2, dayName(2)], [5, 'Next ' + dayName(5)]];
    const html = '<p class="pop-h">Move to</p>' + opts.map(o => {
      const cur = it.day === o[0];
      return `<button type="button" class="pop-i" data-pick="${o[0]}"${cur ? ' aria-disabled="true"' : ''}><span>${o[1]}</span><span class="pop-r">${cur ? 'already' : dateShort(o[0])}</span></button>`;
    }).join('') +
      '<button type="button" class="pop-i" data-pick="date"><span>Pick a date</span><span class="pop-r">…</span></button>' +
      `<div class="pop-date" hidden><label><span class="sr-only">Date</span><input type="date" min="${iso(1)}" max="${iso(90)}"></label></div>`;
    openPop(anchor, html, (v, b, p) => {
      if (v === 'date') {
        const box = $('.pop-date', p);
        box.hidden = false;
        const input = $('input', box);
        input.focus();
        try { if (input.showPicker) input.showPicker(); } catch (e) { /* not allowed everywhere */ }
        input.addEventListener('change', () => { const d = offFromIso(input.value); if (d != null && d > 0) { closePop(); reschedule(it, d); } });
        return;
      }
      closePop();
      reschedule(it, +v);
    }, 'pop-later');
  }

  function startCall() {
    if (ui.call) return;
    const c = panelClient();
    if (!c) return;
    const ns = nextStep(c);
    const linked = ns && ns.invoice && inv(ns.invoice) && !inv(ns.invoice).paid ? ns.invoice : null;
    const u = unpaidFor(c.id);
    ui.call = { clientId: c.id, itemId: ns ? ns.id : null, invoice: linked || (u[0] ? u[0].no : null), start: Date.now(), secs: 0, phase: 'calling', outcome: null, pay: null, picking: false, note: '', add: true, err: false };
    if (mqMobile.matches) ui.sheet = true;
    render();
    clearInterval(callTimer);
    callTimer = setInterval(() => {
      if (!ui.call || ui.call.phase !== 'calling') { clearInterval(callTimer); return; }
      const t = clock(Math.floor((Date.now() - ui.call.start) / 1000));
      $$('[data-timer]').forEach(n => { n.textContent = t; });
    }, 250);
    const b = $('[data-act="end-call"]', E.panel);
    if (b) b.focus({ preventScroll: true });
  }
  function endCall() {
    if (!ui.call) return;
    clearInterval(callTimer);
    ui.call.secs = Math.max(1, Math.floor((Date.now() - ui.call.start) / 1000));
    ui.call.phase = 'after';
    render();
    E.panel.scrollTop = 0;
    const h = $('.a-name', E.panel);
    if (h) h.focus({ preventScroll: true });
  }
  function setOutcome(v) {
    const k = ui.call;
    k.outcome = v; k.err = false;
    if (NEEDS_DAY.includes(v)) {
      if (k.pay == null || (k.pay === 2 && v === 'more') || (k.pay === 5 && v === 'promised')) k.pay = v === 'more' ? 5 : 2;
    }
    k.picking = false;
    renderPanelKeepFocus();
  }
  function renderPanelKeepFocus() {
    const a = document.activeElement;
    const key = a && a.id ? '#' + a.id : a && a.dataset && a.dataset.act ? focusKey(a) : null;
    const top = E.panel.scrollTop;
    renderPanel();
    E.panel.scrollTop = top;
    if (key) { const n = $(key, E.panel); if (n) n.focus({ preventScroll: true }); }
  }
  function saveCall() {
    const k = ui.call;
    if (!k) return;
    if (!k.outcome) { k.err = true; renderPanelKeepFocus(); const r = $('#oc-' + payOutcomes(!!k.invoice)[0][0]); if (r) r.focus(); return; }
    const snap = snapshot();
    const c = client(k.clientId), it = k.itemId ? item(k.itemId) : null, v = k.invoice ? inv(k.invoice) : null;
    const nx = nextFromCall(k);
    const dw = k.pay != null ? whenWord(k.pay) : '';
    const ds = k.pay != null ? whenShort(k.pay) : '';
    const T = {
      paid: ['Call: paid in full', 'Called: paid in full'],
      promised: ['Call: will pay ' + dw, 'Called: paying ' + dw],
      more: ['Call: asked for more time, paying ' + dw, 'Called: more time, paying ' + ds],
      none: ['Call: no answer', 'Called: no answer'],
      sorted: ['Call: all sorted', 'Called: all sorted'],
      followup: ['Call: follow up ' + dw, 'Called: follow up ' + dw],
      callback: ['Call: call back ' + dw, 'Called: call back ' + dw]
    }[k.outcome];
    const at = nowMin();
    c.history.push({ text: T[0] + (k.outcome === 'paid' && v ? ' · invoice ' + v.no : ''), note: k.note.trim() || null, day: 0, time: at, who: 'you' });
    if (it && it.status === 'open') { it.status = 'done'; it.doneDay = 0; it.doneAt = at; it.result = T[1]; }
    if (k.outcome === 'paid' && v) v.paid = true;
    let created = null;
    if (!nx.none && k.add) {
      created = {
        id: 'i' + state.seq++, clientId: c.id, title: nx.title, channel: 'phone', owner: it ? it.owner : 'you',
        day: nx.day, time: nx.time, status: 'open',
        invoice: v && ['promised', 'more', 'none'].includes(k.outcome) ? v.no : null, value: null
      };
      state.items.push(created);
    }
    ui.call = null;
    if (mqMobile.matches) ui.sheet = false;
    render();
    toast('Call saved' + (created ? ' · ' + created.title + ' ' + whenShort(created.day) + ' ' + t12(created.time) : ''), snap);
  }
  function skipCall() {
    clearInterval(callTimer);
    ui.call = null;
    render();
    const b = $('[data-act="call"]', E.panel);
    if (b) b.focus({ preventScroll: true });
  }

  function undo() {
    if (!undoSnap) return;
    state = JSON.parse(undoSnap.s);
    ui.sel = undoSnap.sel;
    undoSnap = null;
    hideToast();
    render();
  }

  function resetDemo() {
    closePop();
    if (E.logDlg.open) E.logDlg.close();
    if (E.clientDlg.open) E.clientDlg.close();
    clearInterval(callTimer);
    try { window.sessionStorage.removeItem(KEY); } catch (e) { /* noop */ }
    state = DATA.build();
    T0 = Date.now();
    ui = freshUi();
    undoSnap = null;
    try { history.replaceState(null, '', '#today'); } catch (e) { /* noop */ }
    render();
    toast('Demo reset to the sample data');
  }

  /* ---------- Toast ---------- */
  function toast(msg, snap) {
    undoSnap = snap || null;
    E.toast.innerHTML = `<span>${esc(msg)}</span>` + (snap ? '<button type="button" data-act="undo">Undo</button>' : '');
    E.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, snap ? 7000 : 3200);
  }
  function hideToast() { E.toast.classList.remove('show'); clearTimeout(toastTimer); }

  /* ---------- Popovers ---------- */
  function openPop(anchor, html, onPick, cls) {
    closePop();
    const p = document.createElement('div');
    p.className = 'pop' + (cls ? ' ' + cls : '');
    p.setAttribute('role', 'dialog');
    p.innerHTML = html;
    (anchor.closest('dialog') || document.body).appendChild(p);
    pop = { el: p, anchor, onPick };
    anchor.setAttribute('aria-expanded', 'true');
    placePop();
    p.addEventListener('click', e => {
      const b = e.target.closest('[data-pick]');
      if (!b || b.getAttribute('aria-disabled') === 'true') return;
      onPick(b.dataset.pick, b, p);
    });
    const f = p.querySelector('input:not([type=hidden]):not([hidden]), [data-pick]:not([aria-disabled="true"])');
    if (f && !(f.closest('[hidden]'))) f.focus({ preventScroll: true });
  }
  function placePop() {
    if (!pop) return;
    const p = pop.el;
    if (mqMobile.matches) { p.classList.add('pop-sheet'); p.style.left = ''; p.style.top = ''; return; }
    p.classList.remove('pop-sheet');
    const r = pop.anchor.getBoundingClientRect();
    const w = p.offsetWidth, h = p.offsetHeight;
    let left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    let top = r.bottom + 6;
    if (top + h > window.innerHeight - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
    p.style.left = left + 'px';
    p.style.top = Math.max(8, top) + 'px';
  }
  function closePop(restore) {
    if (!pop) return;
    const a = pop.anchor;
    pop.el.remove();
    a.setAttribute('aria-expanded', 'false');
    pop = null;
    if (restore && document.contains(a)) a.focus({ preventScroll: true });
  }

  /* ---------- One-line log ---------- */
  let L = null;
  const rxCache = {};
  const nameRx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/-/g, '[-\\s]?');
  function clientRx(c) {
    if (rxCache[c.id]) return rxCache[c.id];
    const poss = "(?:['’]s)?\\b";
    const r = {
      full: c.last ? new RegExp('\\b' + nameRx(c.first) + '\\s+' + nameRx(c.last) + poss, 'gi') : null,
      first: new RegExp('\\b' + nameRx(c.first) + poss, 'gi'),
      nick: c.first.includes('-') ? new RegExp('\\b' + nameRx(c.first.split('-')[0]) + poss, 'gi') : null,
      last: c.last ? new RegExp('\\b' + nameRx(c.last) + poss, 'gi') : null
    };
    rxCache[c.id] = r;
    return r;
  }
  const DOW_RX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  function weekday(name, mod) {
    const idx = DOW_RX[name.toLowerCase().slice(0, 3)];
    let off = (idx - TODAY_DOW + 7) % 7;
    if (off === 0) off = 7;
    if (mod && mod.toLowerCase() === 'next' && off <= 4) off += 7;
    return off;
  }

  function parse(text) {
    const P = { marks: [], remove: [], action: null, actionWord: null, cands: [], day: null, time: null, invoiceNo: null, invoiceWord: null, owner: null, fromInvoice: null };
    const taken = [];
    const free = (s, e) => taken.every(r => e <= r[0] || s >= r[1]);
    const findFree = rx => {
      const g = new RegExp(rx.source, rx.flags.includes('g') ? rx.flags : rx.flags + 'g');
      let m;
      while ((m = g.exec(text))) {
        if (!m[0].length) { g.lastIndex++; continue; }
        if (free(m.index, m.index + m[0].length)) return m;
      }
      return null;
    };
    /* lead = words like "on", "at", "for" that are removed from the title but not underlined */
    const take = (m, kind, lead, keepInTitle) => {
      const s = m.index, e = m.index + m[0].length;
      const ls = s + (lead || 0);
      P.marks.push({ s: ls, e, k: kind });
      if (!keepInTitle) P.remove.push({ s, e });
      taken.push([s, e]);
    };
    const leadLen = (m, rx) => { const x = rx.exec(m[0]); return x ? x[0].length : 0; };
    let m;

    /* Assignment: "for Shanice", "for Andre Campbell", "for me" */
    if ((m = findFree(/\b(?:for|assign(?:ed)?\s+to)\s+(me|myself|shanice|andre)(?:\s+(?:morgan|campbell))?\b/i))) {
      const w = m[1].toLowerCase();
      P.owner = w === 'shanice' ? 'shanice' : w === 'andre' ? 'andre' : 'you';
      take(m, 'who', m[0].toLowerCase().indexOf(w));
    }
    /* Invoice number */
    if ((m = findFree(/\b(?:invoice|inv\.?)\s*(?:no\.?\s*)?#?\s*(\d{3,5})\b/i) || findFree(/#(\d{3,5})\b/))) {
      P.invoiceNo = +m[1];
      take(m, 'inv', 0, true);
    } else if ((m = findFree(/\binvoice\b/i))) {
      P.invoiceWord = [m.index, m.index + m[0].length];
    }
    /* Time */
    if ((m = findFree(/\b(?:at\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/i)) && +m[1] >= 1 && +m[1] <= 12 && (!m[2] || +m[2] < 60)) {
      let h = +m[1];
      const pm = /p/i.test(m[3]);
      if (h === 12) h = pm ? 12 : 0; else if (pm) h += 12;
      P.time = h * 60 + (m[2] ? +m[2] : 0);
      take(m, 'time', leadLen(m, /^at\s+/i));
    } else if ((m = findFree(/\b(?:at\s+)?(noon|midday)\b/i))) {
      P.time = 720;
      take(m, 'time', leadLen(m, /^at\s+/i));
    } else if ((m = findFree(/\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/))) {
      let h = +m[1];
      if (h >= 1 && h < 7) h += 12;
      P.time = h * 60 + +m[2];
      take(m, 'time', leadLen(m, /^at\s+/i));
    } else if ((m = findFree(/\b(?:in\s+the\s+|this\s+)?(morning|afternoon|evening)\b/i))) {
      P.time = { morning: 540, afternoon: 840, evening: 1020 }[m[1].toLowerCase()];
      take(m, 'time', leadLen(m, /^(in\s+the|this)\s+/i));
    }
    /* Day */
    const dayRx = [
      [/\b(?:on\s+)?(today|tonight)\b/i, () => 0, /^on\s+/i],
      [/\b(?:on\s+)?(tomorrow|tmrw|tmr)\b/i, () => 1, /^on\s+/i],
      [/\b(?:by\s+|on\s+)?next\s+week\b/i, () => 5, /^(by|on)\s+/i],
      [/\bin\s+(\d{1,2})\s+days?\b/i, x => +x[1], null],
      [/\b(?:on\s+|by\s+)?(?:(this|next)\s+)?(monday|mon|tuesday|tues|tue|wednesday|weds|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat|sunday|sun)\b\.?/i, x => weekday(x[2], x[1]), /^(on|by)\s+/i]
    ];
    for (const [rx, fn, lead] of dayRx) {
      if ((m = findFree(rx))) {
        const d = fn(m);
        if (d >= 0 && d <= 90) { P.day = d; take(m, 'day', lead ? leadLen(m, lead) : 0); break; }
      }
    }
    /* Action: the earliest action word wins */
    const acts = [
      [/\b(call|phone|ring)\b/i, 'phone'],
      [/\b(whats\s?app|text|message)\b/i, 'whatsapp'],
      [/\b(e-?mail)\b/i, 'email'],
      [/\b(meet(?:ing)?|visit)\b/i, 'meeting'],
      [/\b(send)\b/i, 'send']
    ];
    let best = null;
    acts.forEach(([rx, ch]) => { const x = findFree(rx); if (x && (!best || x.index < best.m.index)) best = { m: x, ch }; });
    if (best) { P.action = best.ch; P.actionWord = best.m[0]; take(best.m, 'act', 0, true); }
    /* Client */
    let cands = [];
    state.clients.forEach(c => {
      const r = clientRx(c);
      const tries = [[r.full, 3], [r.first, 2], [r.nick, 2], [r.last, 1]];
      for (const [rx, score] of tries) {
        if (!rx) continue;
        const x = findFree(rx);
        if (x) { cands.push({ c, score, s: x.index, e: x.index + x[0].length }); break; }
      }
    });
    const top = cands.reduce((a, x) => Math.max(a, x.score), 0);
    cands = cands.filter(x => x.score === top);
    const rank = c => { const o = openFor(c.id); return o.some(it => it.day < 0) ? 0 : o.length ? 1 : 2; };
    cands.sort((a, b) => rank(a.c) - rank(b.c) || fullName(a.c).localeCompare(fullName(b.c)));
    P.cands = cands;
    if (!cands.length && P.invoiceNo && inv(P.invoiceNo)) P.fromInvoice = inv(P.invoiceNo).clientId;
    return P;
  }

  function resolveLog(text) {
    const P = parse(text);
    const R = { P, clientMark: null, invMark: null, multi: null };
    const n = state.clients.length;
    if (L.ov.clientId) { R.clientId = L.ov.clientId; R.clientNote = 'changed'; }
    else if (P.cands.length) {
      const ids = P.cands.map(x => x.c.id);
      const pick = L.pick && ids.includes(L.pick) ? L.pick : ids[0];
      const hit = P.cands.find(x => x.c.id === pick);
      R.clientId = pick;
      R.clientMark = [hit.s, hit.e];
      R.clientNote = P.cands.length === 1 ? `1 match of ${n}` : `${P.cands.length} matches`;
      if (P.cands.length > 1) R.multi = P.cands.slice(0, 3);
    } else if (P.fromInvoice) { R.clientId = P.fromInvoice; R.clientNote = 'from invoice ' + P.invoiceNo; }
    else { R.clientId = null; R.clientNote = text.trim() ? 'no match' : ''; }
    const c = R.clientId ? client(R.clientId) : null;

    if (L.ov.channel) { R.channel = L.ov.channel; R.actionNote = 'changed'; }
    else if (P.action) { R.channel = P.action; R.actionNote = `from “${P.actionWord}”`; }
    else { R.channel = 'phone'; R.actionNote = 'default'; }

    let day = P.day, time = P.time;
    if (day == null && time != null) day = time > nowMin() ? 0 : 1;
    if (day == null) day = 1;
    if (time == null) time = state.settings.defaultTime;
    const changed = L.ov.day != null || L.ov.time != null;
    if (L.ov.day != null) day = L.ov.day;
    if (L.ov.time != null) time = L.ov.time;
    R.day = day; R.time = time;
    R.whenNote = changed ? 'changed' : (P.day != null || P.time != null) ? relDays(day) : 'default';
    R.outside = time < state.settings.start || time >= state.settings.end;

    if (L.ov.invoice !== undefined) R.invoice = L.ov.invoice;
    else if (P.invoiceNo) R.invoice = P.invoiceNo;
    else if (c && P.invoiceWord) {
      const u = unpaidFor(c.id);
      R.invoice = u.length ? u[0].no : null;
      if (R.invoice) R.invMark = P.invoiceWord;
    } else R.invoice = null;

    R.owner = L.ov.owner || P.owner || 'you';
    R.title = makeTitle(text, P, R);
    R.late = c ? openFor(c.id).find(it => it.day < 0) || null : null;
    return R;
  }

  function makeTitle(text, P, R) {
    const rm = P.remove.slice();
    if (R.clientMark) rm.push({ s: R.clientMark[0], e: R.clientMark[1] });
    rm.sort((a, b) => b.s - a.s);
    let t = text;
    rm.forEach(r => { t = t.slice(0, r.s) + ' ' + t.slice(r.e); });
    t = t.replace(/\s+/g, ' ').trim();
    for (let i = 0; i < 3; i++) {
      t = t.replace(/\b(with|to)\s+(?=(about|re|regarding|for|on|at|and)\b)/gi, '')
        .replace(/\s+(on|at|by|for|with|to|this|next|and|the|in)$/i, '')
        .replace(/^(on|at|by|for|and)\s+/i, '')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/[,.;:\s-]+$/, '')
        .trim();
    }
    t = t.replace(/\bwhats\s?app\b/gi, 'WhatsApp');
    if (t.split(/\s+/).filter(Boolean).length <= 1) t = DEFAULT_TITLE[R.channel];
    t = t.charAt(0).toUpperCase() + t.slice(1);
    return t.length > 64 ? t.slice(0, 63).trim() + '…' : t;
  }

  function openLog(prefill) {
    if (blockedByCall()) return;
    closePop();
    if (E.logDlg.open) return;
    opener = document.activeElement;
    L = { ov: {}, pick: null, also: true, alsoFor: null, err: false, R: null };
    E.logInput.value = prefill || '';
    updateLog();
    showDialog(E.logDlg);
    E.logInput.focus();
    const n = E.logInput.value.length;
    E.logInput.setSelectionRange(n, n);
  }

  function updateLog() {
    const text = E.logInput.value;
    const R = L.R = resolveLog(text);
    const marks = R.P.marks.slice();
    if (R.clientMark) marks.push({ s: R.clientMark[0], e: R.clientMark[1] });
    if (R.invMark) marks.push({ s: R.invMark[0], e: R.invMark[1] });
    marks.sort((a, b) => a.s - b.s);
    let html = '', pos = 0;
    marks.forEach(m => {
      if (m.s < pos) return;
      html += esc(text.slice(pos, m.s)) + '<mark>' + esc(text.slice(m.s, m.e)) + '</mark>';
      pos = m.e;
    });
    E.logMirror.innerHTML = html + esc(text.slice(pos)) + '\u200b';
    E.logInput.style.height = 'auto';
    E.logInput.style.height = E.logInput.scrollHeight + 'px';
    if (R.late && L.alsoFor !== R.late.id) { L.alsoFor = R.late.id; L.also = true; }
    renderLogFields();
  }

  function renderLogFields() {
    const R = L.R;
    const a = document.activeElement;
    const key = a && E.logFields.contains(a) ? (a.id ? '#' + a.id : a.dataset.id ? `[data-id="${a.dataset.id}"]` : null) : null;
    const c = R.clientId ? client(R.clientId) : null;
    const row = (label, id, value, note, plain, extra) =>
      `<div class="f"><span class="f-l" id="fl-${id}">${label}</span>${value}<span class="f-r">${extra || esc(note || '')}</span></div>`;
    const fv = (id, html, plain) => `<button type="button" class="fv" id="fv-${id}" data-act="log-field" data-field="${id}" aria-haspopup="true" aria-expanded="false" aria-label="${esc(plain)}. Change">${html}</button>`;

    const ch = CH[R.channel];
    let h = row('Action', 'action', fv('action', icon(ch.icon) + `<b>${ch.label}</b>`, 'Action: ' + ch.label), R.actionNote);

    let cv;
    if (R.multi && !L.ov.clientId) {
      cv = '<span class="fv choices" role="group" aria-labelledby="fl-client">' + R.multi.map((x, i) =>
        (i ? '<span class="or">or</span>' : '') + `<button type="button" class="choice${x.c.id === R.clientId ? ' on' : ''}" data-act="pick-client" data-id="${x.c.id}" aria-pressed="${x.c.id === R.clientId}" title="${esc(x.c.company)}">${esc(fullName(x.c))}</button>`).join('') + '</span>';
    } else if (c) {
      cv = fv('client', `<span class="fv-t"><b>${esc(fullName(c))}</b>${c.company ? ' · ' + esc(c.company) : ''}</span>`, 'Client: ' + fullName(c));
    } else {
      cv = fv('client', `<span class="fv-t ${L.err ? 'rust' : 'muted'}">${L.err ? 'Pick a client to save' : 'Type a name, or choose a client'}</span>`, 'Client: none');
    }
    h += row('Client', 'client', cv, R.clientNote);

    const when = `${whenLong(R.day)}, ${t12(R.time)}`;
    h += row('When', 'when', fv('when', `<b>${esc(when)}</b>`, 'When: ' + when), R.outside ? 'outside hours' : R.whenNote);

    let lv, lp;
    if (R.invoice) {
      const v = inv(R.invoice);
      if (v && !v.paid) { lv = `<span class="fv-t"><b>Invoice ${v.no}</b> · <span class="fig">${money(v.amount)}</span> · ${-v.issued} days old</span>`; lp = 'Invoice ' + v.no; }
      else if (v) { lv = `<span class="fv-t"><b>Invoice ${v.no}</b> · paid</span>`; lp = 'Invoice ' + v.no + ', paid'; }
      else { lv = `<span class="fv-t"><b>Invoice ${R.invoice}</b> · <span class="muted">not in the sample</span></span>`; lp = 'Invoice ' + R.invoice + ', not found'; }
    } else { lv = '<span class="fv-t muted">Nothing linked</span>'; lp = 'Nothing linked'; }
    h += row('Linked to', 'link', fv('link', lv, 'Linked to: ' + lp), '');

    h += row('Assigned to', 'owner', `<span class="fv fv-static"><b>${TEAM[R.owner].name}</b></span>`, '', '',
      `<button type="button" class="btn btn-sm" id="fv-owner" data-act="log-field" data-field="owner" aria-haspopup="true" aria-expanded="false" aria-label="Assigned to ${TEAM[R.owner].name}. Change">Change</button>`);
    E.logFields.innerHTML = h;

    E.logAlso.innerHTML = R.late
      ? `<label class="also"><input type="checkbox" id="logAlsoBox"${L.also ? ' checked' : ''}><span>Also mark <b>“${esc(R.late.title)}”</b> (${lateText(R.late.day)}) as done</span></label>`
      : '';
    if (key) { const n = $(key, E.logFields); if (n) n.focus({ preventScroll: true }); }
  }

  function openFieldEditor(field, anchor) {
    if (pop && pop.anchor === anchor) { closePop(); return; }
    const R = L.R;
    const c = R.clientId ? client(R.clientId) : null;
    const done = () => { closePop(); updateLog(); const n = $('#fv-' + field) || $('#fv-client') || E.logInput; n.focus({ preventScroll: true }); };
    if (field === 'action') {
      openPop(anchor, '<p class="pop-h">Action</p>' + CH_KEYS.map(k => `<button type="button" class="pop-i${k === R.channel ? ' on' : ''}" data-pick="${k}"><span class="pop-ic">${icon(CH[k].icon)}${CH[k].label}</span></button>`).join(''),
        v => { L.ov.channel = v; done(); });
    } else if (field === 'owner') {
      openPop(anchor, '<p class="pop-h">Assign to</p>' + TEAM_KEYS.map(k => `<button type="button" class="pop-i${k === R.owner ? ' on' : ''}" data-pick="${k}"><span>${TEAM[k].name}</span></button>`).join(''),
        v => { L.ov.owner = v; done(); }, 'pop-right');
    } else if (field === 'link') {
      const list = c ? unpaidFor(c.id) : state.invoices.filter(v => !v.paid);
      openPop(anchor, '<p class="pop-h">Link to</p>' + list.map(v => `<button type="button" class="pop-i${v.no === R.invoice ? ' on' : ''}" data-pick="${v.no}"><span>Invoice ${v.no}</span><span class="pop-r">${money(v.amount)}</span></button>`).join('') +
        (list.length ? '' : '<p class="pop-empty">No unpaid invoices for this client.</p>') +
        `<button type="button" class="pop-i${!R.invoice ? ' on' : ''}" data-pick="none"><span>Nothing linked</span></button>`,
        v => { L.ov.invoice = v === 'none' ? null : +v; done(); });
    } else if (field === 'when') {
      const times = [];
      for (let m = 7 * 60; m <= 19 * 60; m += 30) times.push(m);
      if (!times.includes(R.time)) times.push(R.time), times.sort((a, b) => a - b);
      openPop(anchor, '<p class="pop-h">When</p>' + [[0, 'Today'], [1, 'Tomorrow'], [2, dayName(2)], [5, 'Next ' + dayName(5)]].map(o =>
        `<button type="button" class="pop-i${o[0] === R.day ? ' on' : ''}" data-pick="${o[0]}"><span>${o[1]}</span><span class="pop-r">${dateShort(o[0])}</span></button>`).join('') +
        `<div class="pop-when"><label><span>Date</span><input type="date" id="popDate" min="${iso(0)}" max="${iso(90)}" value="${iso(R.day)}"></label>` +
        `<label><span>Time</span><select id="popTime">${times.map(m => `<option value="${m}"${m === R.time ? ' selected' : ''}>${t12(m)}</option>`).join('')}</select></label></div>`,
        v => { L.ov.day = +v; done(); });
      const pd = $('#popDate'), pt = $('#popTime');
      pd.addEventListener('change', () => { const d = offFromIso(pd.value); if (d != null && d >= 0) { L.ov.day = d; updateLog(); } });
      pt.addEventListener('change', () => { L.ov.time = +pt.value; updateLog(); });
    } else if (field === 'client') {
      openPop(anchor, `<div class="pop-search">${icon('search')}<input type="search" id="popSearch" placeholder="Search ${state.clients.length} clients" aria-label="Search clients" autocomplete="off" spellcheck="false"></div><div class="pop-list" id="popList"></div>`,
        v => { L.ov.clientId = v; L.pick = null; done(); }, 'pop-wide');
      const s = $('#popSearch');
      const fill = () => {
        const q = s.value.trim().toLowerCase();
        const list = state.clients.filter(x => !q || (fullName(x) + ' ' + x.company + ' ' + x.area).toLowerCase().includes(q))
          .sort((a, b) => (a.id === R.clientId ? -1 : b.id === R.clientId ? 1 : 0) || fullName(a).localeCompare(fullName(b))).slice(0, 7);
        $('#popList').innerHTML = list.length ? list.map(x => `<button type="button" class="pop-i${x.id === R.clientId ? ' on' : ''}" data-pick="${x.id}"><span>${esc(fullName(x))}</span><span class="pop-r sans">${esc(x.company)}</span></button>`).join('') : '<p class="pop-empty">No clients match.</p>';
      };
      s.addEventListener('input', fill);
      s.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); const b = $('#popList [data-pick]'); if (b) { L.ov.clientId = b.dataset.pick; L.pick = null; done(); } }
        if (e.key === 'ArrowDown') { e.preventDefault(); const b = $('#popList [data-pick]'); if (b) b.focus(); }
      });
      fill();
      s.focus();
    }
  }

  function saveLog() {
    const R = L.R;
    if (!R.clientId) { L.err = true; renderLogFields(); const b = $('#fv-client'); if (b) b.focus(); return; }
    const snap = snapshot();
    const v = R.invoice ? inv(R.invoice) : null;
    const it = { id: 'i' + state.seq++, clientId: R.clientId, title: R.title, channel: R.channel, owner: R.owner, day: R.day, time: R.time, status: 'open', invoice: v ? v.no : null, value: null };
    state.items.push(it);
    let closed = null;
    if (R.late && L.also) {
      closed = item(R.late.id);
      closed.status = 'done'; closed.doneDay = 0; closed.doneAt = nowMin(); closed.result = pastTense(closed.title);
      client(closed.clientId).history.push({ text: closed.result, day: 0, time: closed.doneAt, who: closed.owner });
    }
    E.logDlg.close();
    reindex();
    if ((ui.view === 'today' && it.day === 0) || ui.view === 'upcoming') ui.sel = { type: 'item', id: it.id };
    else if (ui.view === 'clients') ui.sel = { type: 'client', id: it.clientId };
    render();
    toast(`Follow-up added · ${whenShort(it.day)} ${t12(it.time)}${closed ? ' · late one marked done' : ''}`, snap);
  }

  /* ---------- New client ---------- */
  function openClientDlg() {
    if (blockedByCall()) return;
    closePop();
    opener = document.activeElement;
    E.clientForm.reset();
    E.clientErr.hidden = true;
    showDialog(E.clientDlg);
    E.clientForm.elements.name.focus();
  }
  function saveClient() {
    const f = E.clientForm.elements;
    const name = f.name.value.trim().replace(/\s+/g, ' ');
    if (!name) { E.clientErr.hidden = false; f.name.setAttribute('aria-invalid', 'true'); f.name.focus(); return; }
    f.name.removeAttribute('aria-invalid');
    const snap = snapshot();
    const parts = name.split(' ');
    const first = cap(parts.shift()), last = parts.join(' ');
    const c = {
      id: 'c' + state.clientSeq++, first, last, company: f.company.value.trim(), area: f.area.value.trim(),
      phone: f.phone.value.trim() || 'No number yet', owner: f.owner.value,
      tip: 'No calls logged yet. Note the best time to reach ' + first + ' after the first call.',
      history: [{ text: 'Added as a client', day: 0, time: nowMin(), who: 'you' }]
    };
    state.clients.push(c);
    E.clientDlg.close();
    if (ui.view === 'reports' || ui.view === 'settings') { ui.view = 'clients'; try { history.replaceState(null, '', '#clients'); } catch (e) { /* noop */ } }
    ui.sel = { type: 'client', id: c.id };
    if (ui.view === 'clients') ui.q = '';
    if (mqMobile.matches) ui.sheet = true;
    render();
    const r = $(`tr[data-client="${c.id}"]`);
    if (r) r.scrollIntoView({ block: 'nearest' });
    toast('Added ' + fullName(c), snap);
  }

  function showDialog(d) {
    d.showModal();
    E.app.classList.add('dim');
  }
  [E.logDlg, E.clientDlg].forEach(d => {
    d.addEventListener('cancel', e => { if (pop || Date.now() - popClosedAt < 120) { e.preventDefault(); popClosedAt = 0; closePop(true); } });
    d.addEventListener('close', () => {
      closePop();
      if (!E.logDlg.open && !E.clientDlg.open) E.app.classList.remove('dim');
      const back = opener && document.contains(opener) ? opener : null;
      opener = null;
      if (back) back.focus({ preventScroll: true });
      else {
        const r = ui.sel && ui.sel.type === 'item' ? $(`[data-item="${ui.sel.id}"]`) : null;
        if (r) r.focus({ preventScroll: true });
      }
    });
    /* A click on the backdrop closes the dialog */
    d.addEventListener('mousedown', e => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
  });

  E.logForm.addEventListener('submit', e => { e.preventDefault(); saveLog(); });
  E.clientForm.addEventListener('submit', e => { e.preventDefault(); saveClient(); });
  E.logInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); saveLog(); }
  });
  E.logInput.addEventListener('input', () => { L.err = false; updateLog(); });
  $('#areas').innerHTML = AREAS.map(a => `<option value="${a}"></option>`).join('');

  /* ---------- Events ---------- */
  function currentNext() { return nextStep(panelClient()); }

  function act(name, b) {
    switch (name) {
      case 'reset': resetDemo(); break;
      case 'new-client': openClientDlg(); break;
      case 'client-cancel': E.clientDlg.close(); break;
      case 'log': openLog(); break;
      case 'log-cancel': E.logDlg.close(); break;
      case 'log-field': openFieldEditor(b.dataset.field, b); break;
      case 'pick-client': L.pick = b.dataset.id; L.err = false; updateLog(); { const n = $(`[data-id="${b.dataset.id}"]`, E.logFields); if (n) n.focus(); } break;
      case 'add-fu': { const c = panelClient(); openLog(c ? 'Call ' + c.first + ' ' : ''); break; }
      case 'call': startCall(); break;
      case 'end-call': endCall(); break;
      case 'skip-call': skipCall(); break;
      case 'done': markDone(currentNext()); break;
      case 'later': openLater(b, currentNext()); break;
      case 'show-all': setTeam(null); break;
      case 'sheet-close': closeSheet(); break;
      case 'menu': ui.menu = !ui.menu; renderSide(); renderPanel(); if (ui.menu) { const f = $('.side-close', E.side); if (f && mqMobile.matches) f.focus(); } else E.menuBtn.focus(); break;
      case 'undo': undo(); break;
      case 'sort': {
        const k = b.dataset.key;
        ui.sort = ui.sort.key === k ? { key: k, dir: -ui.sort.dir } : { key: k, dir: k === 'owed' ? -1 : 1 };
        render();
        break;
      }
      case 'pay': ui.call.pay = +b.dataset.day; ui.call.picking = false; renderPanelKeepFocus(); break;
      case 'pay-pick': {
        ui.call.picking = true;
        renderPanelKeepFocus();
        const d = $('#afterDate');
        if (d) { d.focus(); try { if (d.showPicker) d.showPicker(); } catch (e) { /* noop */ } }
        break;
      }
      default: break;
    }
  }

  document.addEventListener('click', e => {
    const t = e.target;
    if (!(t instanceof Element) || t.closest('.pop')) return;
    if (pop && !pop.anchor.contains(t)) closePop();
    const a = t.closest('[data-act]');
    if (a) { e.preventDefault(); act(a.dataset.act, a); return; }
    const nav = t.closest('[data-nav]');
    if (nav) { go(nav.dataset.nav); return; }
    const tm = t.closest('[data-team]');
    if (tm) { setTeam(tm.dataset.team); return; }
    const row = t.closest('[data-item]');
    if (row) { selectItem(row.dataset.item); return; }
    const cl = t.closest('[data-client]');
    if (cl) { selectClient(cl.dataset.client); return; }
    const wd = t.closest('[data-day]');
    if (wd && wd.classList.contains('wk-d')) { goDay(+wd.dataset.day); return; }
    if (ui.menu && !t.closest('#side') && !t.closest('.menubtn')) { ui.menu = false; renderSide(); renderPanel(); }
  });
  document.addEventListener('mousedown', e => {
    if (pop && !pop.el.contains(e.target) && !pop.anchor.contains(e.target)) closePop();
  }, true);

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'clientSearch') { ui.q = t.value; render(); }
    else if (t.id === 'afterNote' && ui.call) ui.call.note = t.value;
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'logAlsoBox') L.also = t.checked;
    else if (t.name === 'outcome' && ui.call) setOutcome(t.value);
    else if (t.id === 'afterAdd' && ui.call) ui.call.add = t.checked;
    else if (t.id === 'afterDate' && ui.call) { const d = offFromIso(t.value); if (d != null && d > 0) { ui.call.pay = d; ui.call.picking = false; renderPanelKeepFocus(); } }
    else if (t.id === 'period') { ui.period = +t.value; render(); }
    else if (/^set/.test(t.id)) {
      const S = state.settings;
      if (t.id === 'setStart') S.start = +t.value;
      if (t.id === 'setEnd') S.end = +t.value;
      if (t.id === 'setDefault') S.defaultTime = +t.value;
      if (t.id === 'setRemind') S.remind = +t.value;
      if (t.id === 'setWeekends') S.weekends = t.checked;
      if (S.end <= S.start) S.end = Math.min(19 * 60, S.start + 60);
      render();
      toast('Settings saved');
    }
  });
  document.addEventListener('submit', e => {
    if (e.target.id === 'afterForm') { e.preventDefault(); saveCall(); }
  });

  function move(dir) {
    const list = viewList();
    if (!list.length) return;
    const wasRow = document.activeElement && document.activeElement.matches('.row, .cl');
    const i = selIndex(list);
    const ni = i < 0 ? 0 : Math.min(list.length - 1, Math.max(0, i + dir));
    ui.sel = list[ni];
    render();
    const n = ui.sel.type === 'item' ? $(`[data-item="${ui.sel.id}"]`) : $(`tr[data-client="${ui.sel.id}"]`);
    if (n) {
      n.scrollIntoView({ block: 'nearest' });
      if (wasRow) (n.matches('tr') ? $('.cl', n) : n).focus({ preventScroll: true });
    }
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (pop) { e.preventDefault(); e.stopPropagation(); popClosedAt = Date.now(); closePop(true); return; }
      if (E.logDlg.open || E.clientDlg.open) return;
      if (ui.menu) { ui.menu = false; renderSide(); renderPanel(); E.menuBtn.focus(); return; }
      if (ui.sheet && mqMobile.matches && !ui.call) { closeSheet(); }
      return;
    }
    if (E.logDlg.open || E.clientDlg.open || pop) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t instanceof Element && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    const k = e.key.toLowerCase();
    if (k === 'n') { e.preventDefault(); openLog(); return; }
    if (ui.call || !['today', 'upcoming', 'clients'].includes(ui.view)) return;
    const onRow = t instanceof Element && t.matches('.row, .cl');
    if (k === 'j' || (onRow && k === 'arrowdown')) { e.preventDefault(); move(1); return; }
    if (k === 'k' || (onRow && k === 'arrowup')) { e.preventDefault(); move(-1); return; }
    if (k === 'd') {
      const ns = currentNext();
      if (!ns) { if (panelClient()) toast('Nothing to mark done for this client'); return; }
      e.preventDefault();
      const wasRow = onRow;
      markDone(ns);
      if (wasRow && ui.sel) { const n = $(ui.sel.type === 'item' ? `[data-item="${ui.sel.id}"]` : `button[data-client="${ui.sel.id}"]`); if (n) n.focus({ preventScroll: true }); }
      return;
    }
    if (k === 'r') {
      const ns = currentNext();
      if (!ns) return;
      e.preventDefault();
      let anchor = $('[data-act="later"]', E.panel);
      if (!anchor || !anchor.offsetParent) anchor = ui.sel && ui.sel.type === 'item' ? $(`[data-item="${ui.sel.id}"]`) : null;
      if (anchor) openLater(anchor, ns);
    }
  });

  let resizeT = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (ui.view === 'reports') drawChart(); placePop(); }, 80);
  });
  const onMq = () => { if (!mqMobile.matches) ui.sheet = false; closePop(); render(); };
  if (mqMobile.addEventListener) mqMobile.addEventListener('change', onMq); else mqMobile.addListener(onMq);
  window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (VIEWS.includes(v) && v !== ui.view) go(v); });

  /* ---------- Start ---------- */
  const start = location.hash.slice(1);
  if (VIEWS.includes(start)) ui.view = start;
  render();
  window.FollowUp = { get state() { return state; }, get ui() { return ui; } };
})();
