/* FollowUp working prototype. Vanilla JS, sample data only. */
(() => {
  'use strict';

  const DATA = window.FOLLOWUP_DATA;
  const KEY = 'followup-prototype-v2';
  const OLD_KEYS = ['followup-prototype-state'];
  const BASE = new Date(2026, 8, 30); /* The board is set on Wednesday 30 September 2026 */
  const TODAY_DOW = 3;
  const START_MIN = 10 * 60 + 40; /* The simulated clock opens at 10:40 and runs in real time */
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const TEAM = DATA.team;
  const TEAM_KEYS = DATA.teamKeys;
  const STAGES = DATA.stages;
  const PRI_RANK = { High: 0, Medium: 1, Low: 2 };
  const TYPES = {
    call: { label: 'Call', icon: 'phone' },
    meeting: { label: 'Meeting', icon: 'calendar' },
    email: { label: 'Email', icon: 'mail' },
    note: { label: 'Note', icon: 'note' }
  };
  const TYPE_KEYS = ['call', 'meeting', 'email', 'note'];
  const NEXT_OPTS = [
    ['proposal', 'Send proposal', 'file-text', 'email'],
    ['meeting', 'Schedule meeting', 'calendar-plus', 'meeting'],
    ['call', 'Follow up call', 'phone', 'call'],
    ['info', 'Send information', 'send', 'email'],
    ['none', 'None for now', 'circle-minus', null]
  ];
  const VIEWS = ['home', 'tasks', 'contacts', 'deals', 'reports', 'settings'];
  const LEGACY = { today: 'home', upcoming: 'tasks', clients: 'contacts' };
  const VIEW_NAMES = { home: 'Home', tasks: 'Tasks', contacts: 'Contacts', deals: 'Deals', reports: 'Reports', settings: 'Settings' };
  const NAV_OF = { home: 'home', tasks: 'home', contacts: 'contacts', deals: 'deals', reports: 'reports', settings: 'settings' };
  const AREAS = ['Barbican', 'Cherry Gardens', 'Constant Spring', 'Cross Roads', 'Downtown', 'Duhaney Park', 'Half Way Tree', 'Harbour View', 'Havendale', 'Hope Pastures', 'Hughenden', 'Kingston', 'Liguanea', 'Manor Park', 'Meadowbrook', 'Mona', 'Mountain View', 'New Kingston', 'Newport West', 'Norbrook', 'Papine', 'Red Hills', 'Rollington Town', 'Spanish Town Road', 'Stony Hill', 'Vineyard Town', 'Waterloo Road'];
  const COLORS = { High: '#E5484D', Medium: '#D98A0B', Low: '#1F9D55' };
  const mqMobile = window.matchMedia('(max-width: 820px)');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const E = {
    app: $('#app'), main: $('#main'), view: $('#view'), panel: $('#panel'), side: $('#side'), toast: $('#toast'),
    menuBtn: $('.menubtn'), menuLabel: $('[data-menu-label]'),
    q: $('#q'), qres: $('#qResults'), bell: $('[data-act="bell"]'), bellDot: $('.bell-dot'),
    logDlg: $('#logDlg'), logForm: $('#logForm'), logInput: $('#logInput'), logTypes: $('#logTypes'),
    logFields: $('#logFields'), logAlso: $('#logAlso'),
    contactDlg: $('#contactDlg'), contactForm: $('#contactForm'), contactErr: $('#contactErr')
  };

  /* ---------- Formatting ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => 'J$' + Math.round(n).toLocaleString('en-US');
  const moneyShort = n => n >= 1e6 ? 'J$' + (n / 1e6).toFixed(2) + 'M' : 'J$' + Math.round(n / 1e3) + 'K';
  const pad = n => (n < 10 ? '0' : '') + n;
  const t12 = m => { let h = Math.floor(m / 60); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + pad(m % 60) + ' ' + ap; };
  const clock = s => Math.floor(s / 60) + ':' + pad(s % 60);
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const icon = (name, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  const dateOf = off => new Date(BASE.getFullYear(), BASE.getMonth(), BASE.getDate() + off);
  const dow = off => ((TODAY_DOW + off) % 7 + 7) % 7;
  const dayName = off => DAYS[dow(off)];
  const dayShort = off => DAYS[dow(off)].slice(0, 3);
  const dayNum = off => dateOf(off).getDate();
  const dayMonth = off => { const d = dateOf(off); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
  const dateShort = off => dayShort(off) + ' ' + dayMonth(off);
  const iso = off => { const d = dateOf(off); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const offFromIso = s => {
    const p = String(s || '').split('-').map(Number);
    if (p.length !== 3 || p.some(isNaN)) return null;
    return Math.round((new Date(p[0], p[1] - 1, p[2]) - dateOf(0)) / 864e5);
  };
  const weekend = off => dow(off) === 0 || dow(off) === 6;
  const whenLong = off => off === 0 ? 'Today' : off === 1 ? 'Tomorrow' : off > 1 && off < 7 ? dayName(off) : dateShort(off);
  const whenShort = off => off === 0 ? 'today' : off === 1 ? 'tomorrow' : off > 1 && off < 7 ? dayName(off) : dateShort(off);

  /* ---------- State ---------- */
  let state = load();
  let cmap = {}, tmap = {};
  const freshUi = () => ({
    view: 'home', panel: false, cid: null, tab: 'overview', sel: null, focusTask: null,
    filter: 'all', cfilter: 'all', cq: '', sort: { key: 'org', dir: 1 }, dstage: 'all',
    period: 12, feedAll: false, menu: false, call: null, lastView: null, scroll: {}
  });
  let ui = freshUi();
  let undoSnap = null, toastTimer = 0, callTimer = 0, pop = null, popClosedAt = 0, opener = null, panelOpener = null;

  function load() {
    try {
      OLD_KEYS.forEach(k => { window.sessionStorage.removeItem(k); });
      const raw = window.sessionStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.v === DATA.version && Array.isArray(s.contacts) && s.t0) return s;
      }
    } catch (e) { /* storage can be unavailable */ }
    const s = DATA.build();
    s.t0 = Date.now();
    return s;
  }
  function persist() {
    try { window.sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function reindex() {
    cmap = {}; tmap = {};
    state.contacts.forEach(c => { cmap[c.id] = c; });
    state.tasks.forEach(t => { tmap[t.id] = t; });
  }
  const snapshot = () => ({ s: JSON.stringify(state), cid: ui.cid, sel: ui.sel });

  const nowMin = () => Math.min(17 * 60 + 30, START_MIN + Math.floor((Date.now() - state.t0) / 60000));

  /* ---------- Derived data ---------- */
  const contact = id => cmap[id];
  const task = id => tmap[id];
  const person = c => [c.first, c.last].filter(Boolean).join(' ');
  const label = t => t.title + ' – ' + contact(t.contactId).org;
  const isOpen = t => t.status === 'open';
  const isOverdue = t => isOpen(t) && (t.day < 0 || (t.day === 0 && t.time < nowMin()));
  const isToday = t => isOpen(t) && t.day === 0 && t.time >= nowMin();
  const isWeek = t => isOpen(t) && !isOverdue(t) && t.day >= 0 && t.day <= 4;
  const isCustomer = c => c.deal && c.deal.stage === 'Won';
  const isNewLead = c => !isCustomer(c) && c.added >= -6;
  const byDue = (a, b) => a.day - b.day || a.time - b.time;
  function overdueFirst(a, b) {
    const oa = isOverdue(a) ? 0 : 1, ob = isOverdue(b) ? 0 : 1;
    if (oa !== ob) return oa - ob;
    if (oa === 0) return PRI_RANK[a.priority] - PRI_RANK[b.priority] || b.day - a.day || b.time - a.time;
    return byDue(a, b) || PRI_RANK[a.priority] - PRI_RANK[b.priority];
  }
  const openTasks = () => state.tasks.filter(isOpen);
  const openFor = cid => state.tasks.filter(t => t.contactId === cid && isOpen(t)).sort(overdueFirst);
  const doneFor = cid => state.tasks.filter(t => t.contactId === cid && t.status === 'done').sort((a, b) => b.doneDay - a.doneDay || b.doneAt - a.doneAt);
  const stats = () => {
    const open = openTasks();
    return {
      over: open.filter(isOverdue).length,
      today: open.filter(isToday).length,
      week: open.filter(isWeek).length,
      leads: state.contacts.filter(isNewLead).length
    };
  };
  const homeTasks = () => openTasks().sort(overdueFirst).slice(0, 5);

  function ageText(t) {
    if (t.day < 0) return plural(-t.day, 'day') + ' ago';
    const m = nowMin() - t.time;
    if (m < 60) return Math.max(1, m) + ' min ago';
    return Math.round(m / 60) + 'h ago';
  }
  function dueShort(t) {
    if (t.status === 'done') return 'Done ' + (t.doneDay === 0 ? t12(t.doneAt) : whenShort(t.doneDay));
    if (isOverdue(t)) return ageText(t);
    if (t.day === 0) return t12(t.time);
    if (t.day === 1) return 'Tomorrow';
    if (t.day < 7) return dayShort(t.day) + ' ' + dayNum(t.day);
    return dateShort(t.day);
  }
  function dueLong(t) {
    if (isOverdue(t)) return 'Overdue · due ' + (t.day === 0 ? 'today, ' + t12(t.time) : t.day === -1 ? 'yesterday' : dateShort(t.day));
    return whenLong(t.day) + ', ' + t12(t.time);
  }
  function relWhen(day, time) {
    if (day === 0) {
      const m = nowMin() - (time || 0);
      if (m < 1) return 'just now';
      if (m < 60) return m + ' min ago';
      return Math.round(m / 60) + 'h ago';
    }
    if (day === -1) return 'Yesterday';
    if (day > -45) return -day + ' days ago';
    const months = Math.round(-day / 30.4);
    return months < 12 ? months + ' months ago' : (Math.round(months / 12) === 1 ? '1 year ago' : Math.round(months / 12) + ' years ago');
  }
  const stamp = (day, time) => day === 0 ? 'Today, ' + t12(time) : day === -1 ? 'Yesterday, ' + t12(time) : dateShort(day);
  const location_ = c => !c.area ? '—' : c.area === 'Kingston' ? 'Kingston, Jamaica' : c.area + ', Kingston';

  /* ---------- Small pieces of markup ---------- */
  const TAGS = { High: 'red', Medium: 'amber', Low: 'green', Lead: 'blue', Customer: 'green', 'High priority': 'red', Qualified: 'grey', Proposal: 'violet', Negotiation: 'amber', Won: 'green' };
  const tag = l => `<span class="tag tag-${TAGS[l] || 'grey'}">${esc(l)}</span>`;
  const statusDot = color => `<svg class="sdot" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8.4" stroke="${color}" stroke-width="1.75" fill="none"/><circle cx="10" cy="10" r="3.4" fill="${color}"/></svg>`;
  const ring = color => `<svg class="ring" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="9.8" stroke="${color}" stroke-width="1.75" fill="none"/><path class="ring-tick" d="M6.9 11.3l2.8 2.8 5.4-5.7" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const checkCircle = () => '<svg class="ccheck" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="11" fill="#6739F5"/><path d="M6.9 11.3l2.8 2.8 5.4-5.7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const avatar = k => `<span class="av av-${TEAM[k].tone}" aria-hidden="true">${TEAM[k].ini}</span>`;
  const contactTag = c => tag(isCustomer(c) ? 'Customer' : 'Lead');

  /* ---------- Rendering ---------- */
  function render() {
    reindex();
    if (ui.cid && !contact(ui.cid)) { ui.cid = null; ui.panel = false; }
    if (ui.sel && ui.sel.type === 'task' && !task(ui.sel.id)) ui.sel = null;
    const a = document.activeElement;
    const key = a && a !== document.body && !E.logDlg.contains(a) && !E.contactDlg.contains(a) ? focusKey(a) : null;
    let s0 = null, s1 = null;
    if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName)) { try { s0 = a.selectionStart; s1 = a.selectionEnd; } catch (e) { /* noop */ } }
    renderSide();
    renderView();
    renderPanel();
    renderBell();
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
    const scope = E.panel.contains(n) ? '#panel ' : E.view.contains(n) ? '#view ' : '';
    if (d.act) return scope + `[data-act="${d.act}"]` + (d.id ? `[data-id="${d.id}"]` : '') + (d.key ? `[data-key="${d.key}"]` : '') + (d.f ? `[data-f="${d.f}"]` : '') + (d.tab ? `[data-tab="${d.tab}"]` : '');
    if (d.task) return scope + `[data-task="${d.task}"]`;
    if (d.contact) return scope + `[data-contact="${d.contact}"]`;
    if (d.nav) return `[data-nav="${d.nav}"]`;
    return null;
  }

  function renderSide() {
    $$('[data-nav]', E.side).forEach(b => {
      const on = b.dataset.nav === NAV_OF[ui.view];
      b.classList.toggle('on', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    E.menuLabel.textContent = VIEW_NAMES[ui.view];
    E.app.classList.toggle('menu-open', ui.menu);
    E.menuBtn.setAttribute('aria-expanded', ui.menu ? 'true' : 'false');
  }

  function renderBell() {
    const s = stats();
    E.bellDot.hidden = !s.over;
    E.bell.setAttribute('aria-label', s.over ? `Reminders, ${s.over} overdue` : 'Reminders');
  }

  function renderView() {
    if (ui.lastView === ui.view) ui.scroll[ui.view] = E.main.scrollTop;
    const views = { home: viewHome, tasks: viewTasks, contacts: viewContacts, deals: viewDeals, reports: viewReports, settings: viewSettings };
    E.view.innerHTML = views[ui.view]();
    E.app.dataset.view = ui.view;
    if (ui.lastView === ui.view && ui.scroll[ui.view] != null) E.main.scrollTop = ui.scroll[ui.view];
    ui.lastView = ui.view;
  }

  const isSel = (type, id) => !!ui.sel && ui.sel.type === type && ui.sel.id === id;
  const hints = () => '<p class="hints" aria-hidden="true"><span><kbd>N</kbd> log</span><span><kbd>/</kbd> search</span><span><kbd>J</kbd><kbd>K</kbd> move</span><span><kbd>D</kbd> done</span><span><kbd>R</kbd> later</span><span><kbd>C</kbd> call</span></p>';

  /* Home */
  function greeting() {
    const m = nowMin();
    return m < 12 * 60 ? 'Good morning' : m < 17 * 60 ? 'Good afternoon' : 'Good evening';
  }
  function viewHome() {
    const s = stats();
    const card = (n, l, cls, act, f, aria) => `<button type="button" class="stat stat-${cls}" data-act="${act}" data-f="${f}" aria-label="${aria}"><span class="stat-n">${n}</span><span class="stat-l">${l}</span></button>`;
    const list = homeTasks();
    const rows = list.length ? list.map(t => {
      const c = contact(t.contactId), o = isOverdue(t);
      const sel = isSel('task', t.id);
      return `<li><button type="button" class="d-row${sel ? ' is-sel' : ''}" data-task="${t.id}"${sel ? ' aria-current="true"' : ''} aria-label="${esc(label(t))}, ${t.priority} priority, ${o ? 'overdue, due ' + ageText(t) : 'due ' + dueShort(t)}">` +
        `${statusDot(o ? COLORS.High : isToday(t) ? '#6739F5' : '#9A9AA8')}<span class="d-row-t">${esc(t.title)} – ${esc(c.org)}</span>${tag(t.priority)}<span class="d-row-time">${esc(dueShort(t))}</span></button></li>`;
    }).join('') : '<li class="empty">Nothing open. Nice work.</li>';
    const feed = feedItems(ui.feedAll ? 12 : 4);
    return `<div class="greet"><div><h1>${greeting()}, Kristena</h1><p>Here’s what needs your attention.</p></div>` +
      `<button type="button" class="btn-primary btn-log" data-act="log">${icon('plus')}<span>Log interaction</span></button></div>` +
      '<div class="stats">' +
      card(s.over, 'Overdue', 'over', 'tasks', 'overdue', `${s.over} overdue. Show overdue tasks`) +
      card(s.today, 'Due today', 'today', 'tasks', 'today', `${s.today} due today. Show today’s tasks`) +
      card(s.week, 'This week', 'week', 'tasks', 'week', `${s.week} due this week. Show this week’s tasks`) +
      card(s.leads, 'New leads', 'leads', 'contacts-filter', 'new', `${s.leads} new leads. Show new leads`) +
      '</div><div class="cols">' +
      `<section class="col-tasks" aria-labelledby="h-tasks"><div class="sec-h"><h2 id="h-tasks">Tasks (Overdue first)</h2><button type="button" class="link" data-act="tasks" data-f="all">View all</button></div><ul class="d-list">${rows}</ul></section>` +
      `<section class="col-act" aria-labelledby="h-act"><div class="sec-h"><h2 id="h-act">Team activity</h2><button type="button" class="link" data-act="feed-toggle" aria-expanded="${ui.feedAll}">${ui.feedAll ? 'Show less' : 'See all'}</button></div><ul class="feed${ui.feedAll ? ' all' : ''}">${feed}</ul></section>` +
      '</div>';
  }

  function allActivity() {
    const out = [];
    state.contacts.forEach(c => c.history.forEach(h => out.push({ h, c })));
    return out.sort((a, b) => b.h.day - a.h.day || (b.h.time || 0) - (a.h.time || 0));
  }
  function feedLine(h, c) {
    const who = `<b>${TEAM[h.who].short}</b>`;
    const org = `<b>${esc(c.org)}</b>`;
    const when = relWhen(h.day, h.time);
    switch (h.kind) {
      case 'note': return [`${who} added a note on ${org}`, `“${esc(h.text)}” · ${when}`];
      case 'stage': return [`${who} updated ${org}`, `${esc(h.text)} · ${when}`];
      case 'done': return [`${who} completed <b>${esc(h.text)} – ${esc(c.org)}</b>`, when];
      case 'assign': return [`${who} assigned you ${org}`, `${esc(h.text)} · ${when}`];
      case 'added': return [`${who} added ${org}`, `${esc(h.text)} · ${when}`];
      case 'call': return [`${who} logged a call with ${org}`, `${esc(h.text)} · ${when}`];
      case 'email': return [`${who} emailed ${org}`, `${esc(h.text)} · ${when}`];
      case 'meeting': return [`${who} met with ${org}`, `${esc(h.text)} · ${when}`];
      case 'task': return [`${who} added a task for ${org}`, `${esc(h.text)} · ${when}`];
      default: return [`${who} updated ${org}`, when];
    }
  }
  function feedItems(n) {
    const list = allActivity().slice(0, n);
    return list.map(({ h, c }) => {
      const [t, m] = feedLine(h, c);
      return `<li><button type="button" class="act" data-contact="${c.id}" data-tab="activity">${avatar(h.who)}<span class="act-b"><span class="act-t">${t}</span><span class="act-m">${m}</span></span></button></li>`;
    }).join('');
  }

  /* Task board */
  function boardGroups() {
    const f = ui.filter;
    const open = openTasks();
    const groups = [];
    const push = (key, title, list) => { if (list.length) groups.push({ key, title, list }); };
    const over = open.filter(isOverdue).sort(overdueFirst);
    const today = open.filter(isToday).sort(byDue);
    if (f === 'overdue') push('over', 'Overdue', over);
    else if (f === 'today') push('today', 'Due today', today);
    else {
      if (f === 'all') push('over', 'Overdue', over);
      push('today', 'Due today', today);
      const lastDay = f === 'week' ? 4 : 6;
      for (let d = 1; d <= lastDay; d++) {
        push('d' + d, d === 1 ? 'Tomorrow · ' + dateShort(d) : dateShort(d), open.filter(t => t.day === d).sort(byDue));
      }
      if (f === 'all') {
        push('later', 'Later', open.filter(t => t.day > lastDay).sort(byDue));
        push('done', 'Completed today', state.tasks.filter(t => t.status === 'done' && t.doneDay === 0).sort((a, b) => b.doneAt - a.doneAt));
      }
    }
    return groups;
  }
  const boardList = () => boardGroups().filter(g => g.key !== 'done').reduce((a, g) => a.concat(g.list), []);

  function taskRow(t) {
    const c = contact(t.contactId);
    const done = t.status === 'done';
    const sel = isSel('task', t.id);
    const check = done
      ? `<span class="t-check is-done" aria-hidden="true">${checkCircle()}</span>`
      : `<button type="button" class="t-check" data-act="done" data-id="${t.id}" aria-label="Mark “${esc(label(t))}” done">${ring(COLORS[t.priority])}</button>`;
    return `<li class="t-row${sel ? ' is-sel' : ''}${done ? ' is-done' : ''}">${check}` +
      `<button type="button" class="t-open" data-task="${t.id}"${sel ? ' aria-current="true"' : ''} aria-label="${esc(label(t))}. ${t.priority} priority. ${esc(c.first)}. ${done ? 'Done' : isOverdue(t) ? 'Overdue, ' + ageText(t) : 'Due ' + esc(dueShort(t))}">` +
      `<span class="t-b"><span class="t-t">${esc(t.title)} – ${esc(c.org)}</span><span class="t-m">${tag(t.priority)}<span class="t-who">${esc(c.first)}</span>${t.owner !== 'you' ? `<span class="t-own">for ${TEAM[t.owner].short}</span>` : ''}</span></span>` +
      `<span class="t-r"><span class="t-time${isOverdue(t) ? ' late' : ''}">${esc(dueShort(t))}</span>${icon('chevron-right')}</span></button></li>`;
  }

  function viewTasks() {
    const s = stats();
    const pill = (f, l, n, cls) => `<button type="button" class="pill${ui.filter === f ? ' on' : ''}${cls ? ' ' + cls : ''}" data-act="filter" data-f="${f}" aria-pressed="${ui.filter === f}">${l}${n != null ? `<span class="pill-n">${n}</span>` : ''}</button>`;
    const groups = boardGroups();
    const body = groups.length ? groups.map(g =>
      `<section class="t-grp" aria-labelledby="g-${g.key}"><h2 class="t-gh" id="g-${g.key}">${esc(g.title)}<span>${g.list.length}</span></h2><ul class="t-list">${g.list.map(taskRow).join('')}</ul></section>`).join('')
      : `<p class="empty">${ui.filter === 'overdue' ? 'Nothing overdue.' : 'Nothing due.'}</p>`;
    return `<div class="board-wrap"><div class="vh"><button type="button" class="back" data-act="go" data-f="home">${icon('chevron-left')}<span>Home</span></button></div>` +
      `<div class="vh-row"><h1>Tasks</h1><button type="button" class="round-add" data-act="log" aria-label="Log interaction or add a task">${icon('plus')}</button></div>` +
      `<div class="pills" role="group" aria-label="Filter tasks">${pill('all', 'All')}${pill('overdue', 'Overdue', s.over, 'red')}${pill('today', 'Today', s.today)}${pill('week', 'This week')}</div>` +
      `<div class="board">${body}</div>` + hints() + '</div>';
  }

  /* Contacts */
  function contactRows() {
    const q = ui.cq.trim().toLowerCase();
    const f = ui.cfilter;
    const rows = state.contacts.filter(c => {
      if (f === 'leads' && isCustomer(c)) return false;
      if (f === 'customers' && !isCustomer(c)) return false;
      if (f === 'new' && !isNewLead(c)) return false;
      return !q || [c.org, person(c), c.title, c.industry, c.area].join(' ').toLowerCase().includes(q);
    });
    const k = ui.sort.key, dir = ui.sort.dir;
    const nx = c => openFor(c.id)[0] || null;
    rows.sort((a, b) => {
      let r = 0;
      if (k === 'org') r = a.org.localeCompare(b.org);
      else if (k === 'status') r = (isCustomer(a) ? 1 : 0) - (isCustomer(b) ? 1 : 0);
      else if (k === 'owner') r = TEAM_KEYS.indexOf(a.owner) - TEAM_KEYS.indexOf(b.owner);
      else if (k === 'deal') r = a.deal.amount - b.deal.amount;
      else if (k === 'next') {
        const x = nx(a), y = nx(b);
        if (!x || !y) { if (x || y) return x ? -1 : 1; r = 0; } else r = overdueFirst(x, y);
      }
      return r * dir || a.org.localeCompare(b.org);
    });
    return rows;
  }
  function nextCell(c) {
    const nx = openFor(c.id)[0];
    if (!nx) return '<span class="muted">—</span>';
    return `${esc(nx.title)} <span class="${isOverdue(nx) ? 'red' : 'muted'}">· ${esc(isOverdue(nx) ? 'overdue' : dueShort(nx))}</span>`;
  }
  function viewContacts() {
    const rows = contactRows();
    const all = state.contacts.length, leads = state.contacts.filter(isNewLead).length;
    const pill = (f, l) => `<button type="button" class="pill${ui.cfilter === f ? ' on' : ''}" data-act="cfilter" data-f="${f}" aria-pressed="${ui.cfilter === f}">${l}</button>`;
    const th = (key, l, cls) => {
      const on = ui.sort.key === key;
      return `<th scope="col" class="${cls || ''}"${on ? ` aria-sort="${ui.sort.dir === 1 ? 'ascending' : 'descending'}"` : ''}><button type="button" data-act="sort" data-key="${key}">${l}<span class="sort${on ? ' on' : ''}${on && ui.sort.dir === -1 ? ' down' : ''}" aria-hidden="true">${icon('chevron-right')}</span></button></th>`;
    };
    const body = rows.map(c => {
      const sel = isSel('contact', c.id);
      return `<tr class="${sel ? 'is-sel' : ''}"><td class="c-org"><button type="button" class="cl" data-contact="${c.id}"${sel ? ' aria-current="true"' : ''}>${esc(c.org)}</button><span class="c-sub">${esc(person(c))}${c.title ? ' – ' + esc(c.title) : ''}</span></td>` +
        `<td class="c-st">${contactTag(c)}${c.priority === 'High' ? tag('High priority') : ''}</td><td class="c-own">${esc(TEAM[c.owner].short)}</td><td class="c-next">${nextCell(c)}</td><td class="num">${c.deal.amount ? money(c.deal.amount) : '<span class="muted">—</span>'}</td></tr>`;
    }).join('');
    const empty = rows.length ? '' : `<tr><td colspan="5" class="empty">No contacts match${ui.cq.trim() ? ' “' + esc(ui.cq.trim()) + '”' : ''}.</td></tr>`;
    return `<div class="vh-row"><div><h1>Contacts</h1><p class="sub">${plural(all, 'contact')} · ${plural(leads, 'new lead')} this week</p></div><button type="button" class="btn" data-act="new-contact">${icon('plus')}<span>New contact</span></button></div>` +
      `<div class="toolbar"><div class="pills" role="group" aria-label="Filter contacts">${pill('all', 'All')}${pill('leads', 'Leads')}${pill('customers', 'Customers')}${pill('new', 'New this week')}</div>` +
      `<label class="filter">${icon('search')}<span class="sr-only">Filter contacts</span><input id="cq" type="search" placeholder="Filter by name, company or area" value="${esc(ui.cq)}" autocomplete="off" spellcheck="false"></label></div>` +
      ((ui.cq.trim() || ui.cfilter !== 'all') ? `<p class="found" aria-live="polite">Showing ${rows.length} of ${all}</p>` : '') +
      `<div class="tbl-wrap"><table class="tbl"><thead><tr>${th('org', 'Company', 'c-org')}${th('status', 'Status', 'c-st')}${th('owner', 'Owner', 'c-own')}${th('next', 'Next step', 'c-next')}${th('deal', 'Deal', 'num')}</tr></thead><tbody>${body}${empty}</tbody></table></div>` + hints();
  }

  /* Deals */
  function viewDeals() {
    const openDeals = state.contacts.filter(c => c.deal && c.deal.stage !== 'Won');
    const won = state.contacts.filter(isCustomer);
    const sum = l => l.reduce((s, c) => s + c.deal.amount, 0);
    const cells = STAGES.map(st => {
      const l = state.contacts.filter(c => c.deal && c.deal.stage === st);
      const on = ui.dstage === st;
      return `<button type="button" class="stage${on ? ' on' : ''}" data-act="dstage" data-f="${st}" aria-pressed="${on}"><span class="stage-l">${st}</span><span class="stage-n">${l.length}</span><span class="stage-v">${moneyShort(sum(l))}</span></button>`;
    }).join('');
    const rows = state.contacts.filter(c => c.deal && (ui.dstage === 'all' || c.deal.stage === ui.dstage))
      .sort((a, b) => STAGES.indexOf(a.deal.stage) - STAGES.indexOf(b.deal.stage) || b.deal.amount - a.deal.amount);
    const body = rows.map(c => `<tr><td class="c-org"><button type="button" class="cl" data-contact="${c.id}" data-tab="deals">${esc(c.org)}</button><span class="c-sub">${esc(c.deal.name)}</span></td>` +
      `<td class="c-st">${tag(c.deal.stage)}</td><td class="c-own">${esc(TEAM[c.owner].short)}</td><td class="c-next">${nextCell(c)}</td><td class="num">${money(c.deal.amount)}</td></tr>`).join('');
    return `<div class="vh-row"><div><h1>Deals</h1><p class="sub">${money(sum(openDeals))} open across ${plural(openDeals.length, 'deal')} · ${money(sum(won))} won</p></div></div>` +
      `<div class="stages" role="group" aria-label="Filter by stage">${cells}</div>` +
      (ui.dstage !== 'all' ? `<p class="found">Showing ${rows.length} in ${ui.dstage} · <button type="button" class="link" data-act="dstage" data-f="all">Show all stages</button></p>` : '') +
      `<div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col" class="c-org">Deal</th><th scope="col" class="c-st">Stage</th><th scope="col" class="c-own">Owner</th><th scope="col" class="c-next">Next step</th><th scope="col" class="num">Amount</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }

  /* Reports */
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
    const over = stats().over;
    const period = `<label class="period"><span class="sr-only">Period</span><select id="period"><option value="4"${r.P === 4 ? ' selected' : ''}>Last 4 weeks</option><option value="12"${r.P === 12 ? ' selected' : ''}>Last 12 weeks</option></select></label>`;
    const first = r.weeks[0][1], last = r.weeks[r.weeks.length - 1][1];
    const take = first > last ? `Late tasks fell from ${first} to ${last} a week over the period.` : first < last ? `Late tasks rose from ${first} to ${last} a week over the period.` : `Late tasks held at ${last} a week over the period.`;
    const team = r.meta.team.map(t => `<li><div class="tm-r"><span class="tm-n">${avatar(t[0])}${esc(TEAM[t[0]].name)}</span><span class="tm-d">${t[1]}</span><span class="tm-p">${t[2]}%</span></div><div class="tm-bar" role="img" aria-label="${t[2]}% on time"><i style="width:${t[2]}%"></i></div></li>`).join('');
    const maxR = Math.max(...r.meta.reply.map(x => x[1]));
    const reply = r.meta.reply.map(x => `<li><span class="rp-l">${x[0]}</span><span class="rp-t"><i style="width:${(x[1] / maxR * 100).toFixed(1)}%"></i></span><span class="rp-v">${x[1] >= 10 ? x[1] : x[1].toFixed(1)} h</span></li>`).join('');
    const stat = (l, v, cls) => `<div class="rstat"><span class="rstat-n${cls ? ' ' + cls : ''}">${v}</span><span class="rstat-l">${l}</span></div>`;
    return `<div class="vh-row"><div><h1>Reports</h1><p class="sub">How the team is keeping up with contacts</p></div>${period}</div>` +
      `<div class="rstats">${stat('Tasks done', r.done)}${stat('Done on time', r.pct + '%', 'violet')}${stat('Overdue right now', over, over ? 'red' : '')}${stat('Won in the period', moneyShort(r.meta.won), 'green')}</div>` +
      `<div class="rep"><section class="box rep-chart" aria-labelledby="ch-h"><div class="rep-h"><h2 id="ch-h">Tasks done each week</h2><p class="legend"><span><i class="lg-on"></i>On time</span><span><i class="lg-late"></i>Late</span></p></div>` +
      `<div class="chart" id="chart"><div class="chart-svg"></div><div class="chart-tip" role="tooltip" hidden></div></div><p class="take">${take}</p></section>` +
      `<section class="box rep-side"><h2 class="rep-h2">By team member</h2><div class="tm-head"><span>Name</span><span>Done</span><span>On time</span></div><ul class="tm">${team}</ul>` +
      `<h2 class="rep-h2 rp-h">How fast contacts reply</h2><ul class="rp">${reply}</ul></section></div>` +
      '<p class="note">Sample data for the prototype.</p>';
  }
  function drawChart() {
    const wrap = $('#chart');
    if (!wrap) return;
    const r = reportData();
    const W = Math.max(260, Math.floor(wrap.clientWidth || 600));
    const H = mqMobile.matches ? 220 : 268;
    const padL = 40, padT = 14, padB = 30, padR = 2;
    const plotH = H - padT - padB, plotW = W - padL - padR;
    const yMax = 40;
    const n = r.weeks.length;
    const bw = plotW / n;
    const barW = Math.min(32, bw * 0.56);
    const y = v => padT + plotH * (1 - v / yMax);
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Stacked bars: on-time and late tasks for each of the last ${n} weeks">`;
    for (let v = 0; v <= yMax; v += 10) {
      s += `<line x1="${padL - 6}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}" class="${v === 0 ? 'ax' : 'gr'}"/>`;
      s += `<text x="${padL - 14}" y="${y(v) + 4}" class="yl" text-anchor="end">${v}</text>`;
    }
    r.weeks.forEach((w, i) => {
      const cx = padL + bw * (i + 0.5);
      const x = cx - barW / 2;
      const onH = plotH * w[0] / yMax, lateH = plotH * w[1] / yMax;
      const base = y(0);
      s += `<rect x="${x.toFixed(1)}" y="${(base - onH).toFixed(1)}" width="${barW.toFixed(1)}" height="${onH.toFixed(1)}" rx="3" class="b-on"/>`;
      s += `<rect x="${x.toFixed(1)}" y="${(base - onH - lateH - 2).toFixed(1)}" width="${barW.toFixed(1)}" height="${lateH.toFixed(1)}" rx="3" class="b-late"/>`;
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
      tip.innerHTML = `<b>W${r.offset + i + 1}</b> · ${w[0] + w[1]} done<br><span>${w[0]} on time</span> · <span class="red">${w[1]} late</span>`;
      tip.hidden = false;
      const tw = tip.offsetWidth;
      tip.style.left = Math.min(Math.max(cx - tw / 2, 0), W - tw) + 'px';
      tip.style.top = Math.max(0, top - tip.offsetHeight - 10) + 'px';
    };
    const hide = () => { tip.hidden = true; $$('.hit', wrap).forEach(h => h.classList.remove('on')); };
    $$('.hit', wrap).forEach(h => {
      h.addEventListener('mouseenter', () => show(h));
      h.addEventListener('focus', () => show(h));
      h.addEventListener('mouseleave', hide);
      h.addEventListener('blur', hide);
    });
  }

  /* Settings */
  function viewSettings() {
    const S = state.settings;
    const times = [];
    for (let m = 7 * 60; m <= 19 * 60; m += 30) times.push(m);
    const opt = (v, l, cur) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`;
    return '<div class="vh-row"><div><h1>Settings</h1><p class="sub">How FollowUp schedules tasks for you. Changes save as you go.</p></div></div><div class="set">' +
      `<div class="set-row"><div><p class="set-l" id="sl-hours">Working hours</p><p class="set-d">Tasks logged outside these hours are flagged.</p></div><div class="set-c" role="group" aria-labelledby="sl-hours"><select id="setStart" aria-label="Start">${times.filter(m => m <= 12 * 60).map(m => opt(m, t12(m), S.start)).join('')}</select><span class="muted">to</span><select id="setEnd" aria-label="End">${times.filter(m => m >= 12 * 60).map(m => opt(m, t12(m), S.end)).join('')}</select></div></div>` +
      `<div class="set-row"><div><p class="set-l"><label for="setDefault">Default due time</label></p><p class="set-d">Used when a next step has a day but no time, and after a call.</p></div><div class="set-c"><select id="setDefault">${[480, 540, 600, 660, 840, 900].map(m => opt(m, t12(m), S.defaultTime)).join('')}</select></div></div>` +
      `<div class="set-row"><div><p class="set-l"><label for="setRemind">Remind me</label></p><p class="set-d">A reminder on your phone and in the browser.</p></div><div class="set-c"><select id="setRemind">${opt(0, 'At the due time', S.remind)}${opt(15, '15 minutes before', S.remind)}${opt(30, '30 minutes before', S.remind)}${opt(60, '1 hour before', S.remind)}${opt(-1, 'Off', S.remind)}</select></div></div>` +
      `<div class="set-row"><div><p class="set-l"><label for="setWeekends">Weekend due dates</label></p><p class="set-d">Offer Saturday and Sunday as due dates after a call.</p></div><div class="set-c"><input type="checkbox" id="setWeekends"${S.weekends ? ' checked' : ''}></div></div>` +
      `<div class="set-row"><div><p class="set-l">Team</p><p class="set-d">You, Daniel Brooks, Maya Chen and Andre Grant. Your admin manages who’s on the team.</p></div><div class="set-c team-av">${TEAM_KEYS.map(avatar).join('')}</div></div>` +
      '</div>';
  }

  /* ---------- Panel: contact view, call, after call ---------- */
  function renderPanel() {
    const open = ui.panel && (ui.call || ui.cid);
    E.app.classList.toggle('panel-open', !!open);
    E.panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    E.panel.inert = !open;
    if (!open) { E.panel.innerHTML = ''; document.documentElement.classList.remove('lock'); return; }
    const top = E.panel.scrollTop;
    if (ui.call) E.panel.innerHTML = ui.call.phase === 'calling' ? callingHtml() : afterHtml();
    else E.panel.innerHTML = contactHtml(contact(ui.cid));
    E.panel.scrollTop = top;
    document.documentElement.classList.toggle('lock', mqMobile.matches);
  }

  function heroAvatar(c) {
    const active = c.history.some(h => h.day === 0);
    return `<span class="c-avatar"${active ? ' title="Active today"' : ''}><svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true" focusable="false"><circle cx="38" cy="38" r="38" fill="#6739F5"/><g transform="translate(22 22) scale(1.3333)" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></g></svg>` +
      (active ? '<svg class="c-online" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false"><circle cx="9" cy="9" r="9" fill="#fff"/><circle cx="9" cy="9" r="6" fill="#1F9D55"/></svg><span class="sr-only">Active today</span>' : '') + '</span>';
  }
  function latestNote(c) {
    return c.history.filter(h => h.kind === 'note' || (h.note && ['call', 'meeting', 'email'].includes(h.kind)))
      .sort((a, b) => b.day - a.day || (b.time || 0) - (a.time || 0))[0] || null;
  }

  function contactHtml(c) {
    const TABS = [['overview', 'Overview'], ['activity', 'Activity'], ['tasks', 'Tasks'], ['deals', 'Deals'], ['files', 'Files']];
    const acts = [['call', 'Call', 'phone'], ['email', 'Email', 'mail'], ['meet', 'Meet', 'video'], ['note', 'Note', 'note'], ['more', 'More', 'more']];
    let h = `<div class="c-top"><button type="button" class="c-back" data-act="panel-close">${icon('chevron-left')}<span>Back</span></button>` +
      `<div class="c-top-r"><button type="button" class="c-dots" data-act="more" aria-label="More actions" aria-haspopup="true" aria-expanded="false">${icon('more')}</button><button type="button" class="c-edit" data-act="edit-contact">Edit</button></div></div>`;
    h += `<div class="c-hero">${heroAvatar(c)}<div class="c-hero-b"><h2 class="c-name" tabindex="-1">${esc(c.org)}</h2><p class="c-role">${esc(person(c))}${c.title ? ' – ' + esc(c.title) : ''}</p>` +
      `<div class="c-tags">${contactTag(c)}${c.priority === 'High' ? tag('High priority') : ''}</div></div></div>`;
    h += '<div class="c-acts">' + acts.map(a => `<button type="button" class="c-act" data-act="c-${a[0]}"${a[0] === 'more' ? ' aria-haspopup="true" aria-expanded="false"' : ''}><span class="c-act-c">${icon(a[2])}</span><span>${a[1]}</span></button>`).join('') + '</div>';
    h += '<div class="c-tabs" role="tablist" aria-label="Contact sections">' + TABS.map(t => {
      const on = ui.tab === t[0];
      return `<button type="button" role="tab" class="c-tab${on ? ' on' : ''}" id="tab-${t[0]}" data-act="tab" data-tab="${t[0]}" aria-selected="${on}" aria-controls="tabpanel" tabindex="${on ? 0 : -1}">${t[1]}</button>`;
    }).join('') + '</div>';
    h += `<div class="c-body" role="tabpanel" id="tabpanel" aria-labelledby="tab-${ui.tab}">${tabHtml(c)}</div>`;
    return h;
  }

  function tabHtml(c) {
    if (ui.tab === 'overview') {
      const nx = openFor(c.id)[0];
      const kv = (k, v) => `<div class="c-kv"><span class="c-k">${k}</span><span class="c-v">${v}</span></div>`;
      let h = '<h3 class="c-h">About</h3><div class="c-about">' +
        kv('Company', esc(c.org)) + kv('Industry', esc(c.industry || '—')) + kv('Location', esc(location_(c))) + kv('Website', esc(c.website || '—')) +
        kv('Phone', esc(c.phone || '—')) +
        kv('Next step', nx ? `<button type="button" class="link" data-act="tab" data-tab="tasks">${esc(nx.title)}</button><span class="${isOverdue(nx) ? 'red' : 'muted'}">&nbsp;· ${esc(isOverdue(nx) ? 'overdue ' + ageText(nx) : dueShort(nx))}</span>` : '<span class="muted">Nothing planned</span>') +
        '</div>';
      const n = latestNote(c);
      h += n ? `<div class="c-notes"><span class="c-notes-l">Notes</span><p>${esc(n.kind === 'note' ? n.text : n.note)}</p><span class="c-notes-m">${esc(TEAM[n.who].first)} · ${esc(stamp(n.day, n.time))}</span></div>`
        : `<div class="c-notes"><span class="c-notes-l">Notes</span><p class="muted">No notes yet.</p><button type="button" class="link" data-act="c-note">Add a note</button></div>`;
      return h;
    }
    if (ui.tab === 'activity') {
      const list = c.history.slice().sort((a, b) => b.day - a.day || (b.time || 0) - (a.time || 0));
      const title = x => ({
        note: 'Note', stage: x.text, done: 'Completed: ' + x.text, assign: 'Assigned to you', added: x.text === 'New lead' ? 'Added as a lead' : 'Added as a contact',
        call: 'Call', email: 'Email', meeting: 'Meeting', task: 'Task added'
      }[x.kind] || 'Update');
      const ic = { note: 'note', call: 'phone', email: 'mail', meeting: 'calendar', done: 'check', stage: 'briefcase', assign: 'user', added: 'plus', task: 'calendar-plus' };
      return '<ol class="hist">' + list.map(x => {
        const body = x.kind === 'note' ? x.text : ['call', 'email', 'meeting', 'task'].includes(x.kind) ? x.text : x.kind === 'done' ? (x.note || '') : x.kind === 'assign' ? x.text : '';
        return `<li><span class="hist-ic">${icon(ic[x.kind] || 'note')}</span><div><p class="hist-t">${esc(title(x))}</p>${body ? `<p class="hist-n">${esc(body)}</p>` : ''}<p class="hist-m">${esc(TEAM[x.who].first)} · ${esc(stamp(x.day, x.time))}</p></div></li>`;
      }).join('') + '</ol>';
    }
    if (ui.tab === 'tasks') {
      const open = openFor(c.id), done = doneFor(c.id).slice(0, 4);
      let h = `<div class="c-sec-h"><h3 class="c-h">Open tasks</h3><button type="button" class="link" data-act="c-log">Log interaction</button></div>`;
      h += open.length ? '<ul class="ct-list">' + open.map(t => {
        const hl = ui.focusTask === t.id || isSel('task', t.id);
        return `<li class="ct${hl ? ' is-sel' : ''}"><button type="button" class="t-check" data-act="done" data-id="${t.id}" aria-label="Mark “${esc(t.title)}” done">${ring(COLORS[t.priority])}</button>` +
          `<div class="ct-b"><p class="ct-t">${esc(t.title)}</p><p class="ct-m">${tag(t.priority)}<span class="${isOverdue(t) ? 'red' : ''}">${esc(dueLong(t))}</span>${t.owner !== 'you' ? `<span>· ${TEAM[t.owner].short}</span>` : ''}</p></div>` +
          `<button type="button" class="btn btn-sm" data-act="later" data-id="${t.id}" aria-haspopup="true" aria-expanded="false">Later</button></li>`;
      }).join('') + '</ul>' : '<p class="empty-s">Nothing planned. Log an interaction to set a next step.</p>';
      if (done.length) {
        h += '<h3 class="c-h c-h2">Done</h3><ul class="ct-list">' + done.map(t => `<li class="ct is-done"><span class="t-check is-done" aria-hidden="true">${checkCircle()}</span><div class="ct-b"><p class="ct-t">${esc(t.title)}</p><p class="ct-m">${esc(t.result || 'Done')} · ${esc(stamp(t.doneDay, t.doneAt))}</p></div></li>`).join('') + '</ul>';
      }
      return h;
    }
    if (ui.tab === 'deals') {
      const d = c.deal;
      return `<h3 class="c-h">Deal</h3><div class="deal"><p class="deal-n">${esc(d.name)}</p><p class="deal-v">${money(d.amount)}</p>` +
        `<label class="deal-st"><span>Stage</span><select id="dealStage">${STAGES.map(s => `<option${s === d.stage ? ' selected' : ''}>${s}</option>`).join('')}</select></label>` +
        `<p class="deal-m">Owner · ${esc(TEAM[c.owner].name)}</p></div>`;
    }
    return '<p class="empty-s">No files yet. Proposals and contracts shared with this contact will show here.</p>';
  }

  function callingHtml() {
    const k = ui.call, c = contact(k.cid);
    const secs = Math.floor((Date.now() - k.start) / 1000);
    const t = k.taskId ? task(k.taskId) : null;
    return '<div class="calling">' +
      `<p class="call-state"><span class="live" aria-hidden="true"></span><span>Calling</span><span data-timer>${clock(secs)}</span></p>` +
      `<div class="call-who">${heroAvatar(c)}<h2 class="c-name" tabindex="-1">${esc(person(c))}</h2><p class="c-role">${esc(c.org)} · ${esc(c.phone)}</p></div>` +
      `<p class="call-timer" data-timer aria-hidden="true">${clock(secs)}</p>` +
      (t ? `<p class="call-for">For <b>${esc(t.title)}</b> · ${esc(dueLong(t))}</p>` : '') +
      `<button type="button" class="btn-end" data-act="end-call">${icon('phone')}<span>End call</span></button>` +
      '<p class="call-note">Prototype: no call is placed. End the call to log the next step.</p></div>';
  }

  function dueChips() {
    const out = [];
    for (let d = 0; out.length < 4 && d < 14; d++) if (state.settings.weekends || !weekend(d)) out.push(d);
    return out;
  }
  function afterHtml() {
    const k = ui.call, c = contact(k.cid);
    const none = k.step === 'none';
    const chips = dueChips();
    const custom = k.custom || !chips.includes(k.day);
    let h = '<form class="after" id="afterForm" novalidate>' +
      `<div class="p-nav"><button type="button" class="p-cancel" data-act="call-cancel">Cancel</button><h2 class="p-title" tabindex="-1">After call</h2><span class="p-spacer"></span></div>` +
      `<p class="p-ctx">${esc(person(c))} · ${esc(c.org)} · ${clock(k.secs)}</p>` +
      '<fieldset class="p-set"><legend class="p-h">What’s the next step?</legend><div class="p-opts">' +
      NEXT_OPTS.map(o => {
        const on = k.step === o[0];
        return `<label class="p-opt${on ? ' on' : ''}"><input type="radio" class="sr-only" name="step" value="${o[0]}"${on ? ' checked' : ''}>${icon(o[2])}<span class="p-opt-t">${o[1]}</span>${on ? checkCircle() : ''}</label>`;
      }).join('') + '</div></fieldset>';
    if (!none) {
      h += '<fieldset class="p-set"><legend class="p-h p-h2">Set due date</legend><div class="p-days">' +
        chips.map(d => {
          const on = !custom && k.day === d;
          return `<label class="p-day${on ? ' on' : ''}"><input type="radio" class="sr-only" name="due" value="${d}"${on ? ' checked' : ''} aria-label="${d === 0 ? 'Today, ' : d === 1 ? 'Tomorrow, ' : ''}${dayName(d)} ${dayMonth(d)}"><span class="p-day-d" aria-hidden="true">${dayShort(d)}</span><span class="p-day-n" aria-hidden="true">${dayNum(d)}</span></label>`;
        }).join('') +
        `<label class="p-day${custom ? ' on' : ''}"><input type="radio" class="sr-only" name="due" value="custom"${custom ? ' checked' : ''} aria-label="Custom date">${icon('calendar')}<span class="p-day-c" aria-hidden="true">${custom && k.day != null ? esc(dayShort(k.day) + ' ' + dayNum(k.day)) : 'Custom'}</span></label>` +
        '</div>' +
        (custom ? `<label class="p-date"><span class="sr-only">Due date</span><input type="date" id="afterDate" min="${iso(0)}" max="${iso(90)}" value="${k.day != null ? iso(k.day) : ''}"></label>` : '') +
        '</fieldset>';
      const at = state.settings.defaultTime - Math.max(0, state.settings.remind);
      const when = k.day === 0 ? 'today' : dayShort(k.day) + ' ' + dayNum(k.day);
      h += `<p class="p-hint">${icon('bell')}<span>${state.settings.remind < 0 ? `Due ${when} at ${t12(state.settings.defaultTime)}` : `We’ll remind you ${when} at ${t12(at)}`}</span></p>`;
    } else {
      h += '<p class="p-hint">Nothing added. The call is logged on the contact.</p>';
    }
    h += '<button type="submit" class="btn-primary p-save">Save and complete</button></form>';
    return h;
  }

  /* ---------- Actions ---------- */
  function blockedByCall() {
    if (ui.call) { toast(ui.call.phase === 'calling' ? 'End the call first' : 'Save or cancel the call first'); return true; }
    return false;
  }

  function go(view, opts) {
    view = LEGACY[view] || view;
    if (!VIEWS.includes(view)) view = 'home';
    if (blockedByCall()) return;
    closePop();
    closeSearch();
    ui.view = view;
    ui.menu = false;
    if (opts && opts.filter) ui.filter = opts.filter;
    if (opts && opts.cfilter) ui.cfilter = opts.cfilter;
    ui.sel = null;
    ui.panel = false;
    try { history.replaceState(null, '', '#' + view); } catch (e) { /* noop */ }
    render();
    E.main.scrollTop = 0;
    if (opts && opts.focus) { E.view.focus({ preventScroll: true }); }
  }

  function openContact(cid, tab, taskId) {
    if (ui.call && ui.call.cid !== cid) { blockedByCall(); return; }
    if (!ui.panel) panelOpener = document.activeElement;
    closeSearch();
    ui.cid = cid;
    ui.tab = tab || 'overview';
    ui.focusTask = taskId || null;
    ui.panel = true;
    render();
    E.panel.scrollTop = 0;
    const hd = $('.c-name, .p-title', E.panel);
    if (hd) hd.focus({ preventScroll: true });
  }
  function closePanel() {
    if (ui.call) { blockedByCall(); return; }
    closePop();
    ui.panel = false;
    ui.focusTask = null;
    render();
    const back = panelOpener && document.contains(panelOpener) ? panelOpener : null;
    panelOpener = null;
    if (back) back.focus({ preventScroll: true });
    else {
      const n = ui.sel && (ui.sel.type === 'task' ? $(`[data-task="${ui.sel.id}"]`, E.view) : $(`[data-contact="${ui.sel.id}"]`, E.view));
      if (n) n.focus({ preventScroll: true });
    }
  }

  function selectTask(id) {
    const t = task(id);
    if (!t) return;
    ui.sel = { type: 'task', id };
    openContact(t.contactId, 'tasks', id);
  }
  function selectContact(id, tab) {
    ui.sel = ui.view === 'contacts' ? { type: 'contact', id } : ui.sel;
    openContact(id, tab || 'overview');
  }

  function viewList() {
    if (ui.view === 'home') return homeTasks().map(t => ({ type: 'task', id: t.id }));
    if (ui.view === 'tasks') return boardList().map(t => ({ type: 'task', id: t.id }));
    if (ui.view === 'contacts') return contactRows().map(c => ({ type: 'contact', id: c.id }));
    return [];
  }

  function markDone(t) {
    if (!t || !isOpen(t)) return;
    const snap = snapshot();
    const list = viewList();
    const idx = list.findIndex(x => x.type === 'task' && x.id === t.id);
    const at = nowMin();
    t.status = 'done'; t.doneDay = 0; t.doneAt = at; t.result = 'Marked done';
    contact(t.contactId).history.push({ kind: 'done', text: t.title, who: 'you', day: 0, time: at });
    reindex();
    if (ui.sel && ui.sel.type === 'task' && ui.sel.id === t.id) {
      const now = viewList();
      ui.sel = now[Math.min(idx, now.length - 1)] || null;
      if (ui.sel && ui.sel.type !== 'task') ui.sel = null;
    }
    const label_ = label(t);
    render();
    toast('Marked done · ' + label_, snap);
  }

  function reschedule(t, day) {
    if (!t || day == null || isNaN(day)) return;
    const snap = snapshot();
    t.day = day;
    if (day === 0 && t.time < nowMin()) t.time = Math.min(17 * 60, Math.ceil((nowMin() + 30) / 30) * 30);
    render();
    toast('Moved to ' + whenShort(day) + ' · ' + label(t), snap);
  }

  function openLater(anchor, t) {
    if (!t || !anchor) return;
    if (pop && pop.anchor === anchor) { closePop(); return; }
    const fri = (5 - TODAY_DOW + 7) % 7 || 7;
    const mon = (8 - TODAY_DOW) % 7 || 7;
    const opts = [[1, 'Tomorrow'], [fri, dayName(fri)], [mon, 'Next ' + dayName(mon)]];
    const html = '<p class="pop-h">Move to</p>' + opts.map(o => {
      const cur = t.day === o[0];
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
        input.addEventListener('change', () => { const d = offFromIso(input.value); if (d != null && d > 0) { closePop(); reschedule(t, d); } });
        return;
      }
      closePop(true);
      reschedule(t, +v);
    });
  }

  function openMore(anchor) {
    const c = contact(ui.cid);
    if (!c) return;
    if (pop && pop.anchor === anchor) { closePop(); return; }
    const html = '<p class="pop-h">' + esc(c.org) + '</p>' +
      '<button type="button" class="pop-i" data-pick="log"><span>Log interaction</span></button>' +
      `<button type="button" class="pop-i" data-pick="pri"><span>${c.priority === 'High' ? 'Set to Medium priority' : 'Mark as High priority'}</span></button>` +
      '<button type="button" class="pop-i" data-pick="edit"><span>Edit details</span></button>' +
      `<button type="button" class="pop-i" data-pick="copy"><span>Copy phone number</span><span class="pop-r">${esc(c.phone)}</span></button>`;
    openPop(anchor, html, v => {
      closePop();
      if (v === 'log') openLog({ contactId: c.id });
      else if (v === 'edit') openContactDlg(c);
      else if (v === 'pri') {
        const snap = snapshot();
        c.priority = c.priority === 'High' ? 'Medium' : 'High';
        render();
        toast(c.priority === 'High' ? 'Marked as High priority' : 'Set to Medium priority', snap);
      } else if (v === 'copy') {
        try { navigator.clipboard.writeText(c.phone).then(() => toast('Copied ' + c.phone), () => toast(c.phone)); } catch (e) { toast(c.phone); }
      }
    }, 'pop-right');
  }

  function setStage(c, stage) {
    if (!c || !STAGES.includes(stage) || c.deal.stage === stage) return;
    const snap = snapshot();
    c.deal.stage = stage;
    c.history.push({ kind: 'stage', text: 'Deal moved to ' + stage, who: 'you', day: 0, time: nowMin() });
    render();
    toast('Deal moved to ' + stage, snap);
  }

  /* Calls */
  function startCall(cid) {
    if (ui.call) return;
    const c = contact(cid);
    if (!c) return;
    const open = openFor(cid);
    const selT = ui.sel && ui.sel.type === 'task' ? task(ui.sel.id) : null;
    const focT = ui.focusTask ? task(ui.focusTask) : null;
    let tid = null;
    if (selT && isOpen(selT) && selT.contactId === cid) tid = selT.id;
    else if (focT && isOpen(focT) && focT.contactId === cid) tid = focT.id;
    else {
      const x = open.find(y => y.type === 'call' && (isOverdue(y) || y.day === 0)) || open.find(y => isOverdue(y) || y.day === 0);
      tid = x ? x.id : null;
    }
    if (!ui.panel) panelOpener = document.activeElement;
    ui.cid = cid;
    ui.panel = true;
    ui.call = { cid, taskId: tid, start: Date.now(), secs: 0, phase: 'calling', step: 'proposal', day: dueChips()[1], custom: false };
    render();
    clearInterval(callTimer);
    callTimer = setInterval(() => {
      if (!ui.call || ui.call.phase !== 'calling') { clearInterval(callTimer); return; }
      const s = clock(Math.floor((Date.now() - ui.call.start) / 1000));
      $$('[data-timer]').forEach(n => { n.textContent = s; });
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
    const h = $('.p-title', E.panel);
    if (h) h.focus({ preventScroll: true });
  }
  function renderPanelKeepFocus() {
    const a = document.activeElement;
    let key = null;
    if (a && E.panel.contains(a)) key = a.id ? '#' + a.id : a.name ? `[name="${a.name}"][value="${a.value}"]` : focusKey(a);
    renderPanel();
    if (key) { const n = $(key, E.panel) || (a.name ? $(`[name="${a.name}"]:checked`, E.panel) : null); if (n) n.focus({ preventScroll: true }); }
  }
  function cancelCall() {
    clearInterval(callTimer);
    const cid = ui.call ? ui.call.cid : null;
    ui.call = null;
    ui.cid = cid;
    ui.tab = 'overview';
    render();
    const b = $('[data-act="c-call"]', E.panel);
    if (b) b.focus({ preventScroll: true });
    toast('Call not logged');
  }
  function saveCall() {
    const k = ui.call;
    if (!k) return;
    const snap = snapshot();
    const c = contact(k.cid);
    const opt = NEXT_OPTS.find(o => o[0] === k.step);
    const at = nowMin();
    const t = k.taskId ? task(k.taskId) : null;
    let created = null;
    if (k.step !== 'none' && k.day != null) {
      created = { id: 't' + state.seq++, contactId: c.id, title: opt[1], type: opt[3], priority: c.priority, owner: 'you', day: k.day, time: state.settings.defaultTime, status: 'open' };
      if (created.day === 0 && created.time < at) created.time = Math.min(17 * 60 + 30, Math.ceil((at + 30) / 30) * 30);
      state.tasks.push(created);
    }
    const closes = t && isOpen(t) ? t : null;
    c.history.push({ kind: 'call', text: `Call · ${clock(k.secs)}` + (closes ? ` · ${closes.title} done` : '') + (created ? ` · Next: ${created.title}, ${whenShort(created.day)}` : ''), who: 'you', day: 0, time: at });
    if (closes) { closes.status = 'done'; closes.doneDay = 0; closes.doneAt = at; closes.result = 'Called' + (created ? '. Next: ' + created.title : ''); }
    ui.call = null;
    ui.tab = 'tasks';
    ui.focusTask = created ? created.id : null;
    if (ui.sel && ui.sel.type === 'task' && t && ui.sel.id === t.id) ui.sel = created ? { type: 'task', id: created.id } : null;
    render();
    const hd = $('.c-name', E.panel);
    if (hd) hd.focus({ preventScroll: true });
    toast('Call saved' + (closes ? ' · ' + closes.title + ' done' : '') + (created ? ' · ' + created.title + ' ' + whenShort(created.day) : ''), snap);
  }

  function undo() {
    if (!undoSnap) return;
    state = JSON.parse(undoSnap.s);
    ui.sel = undoSnap.sel;
    if (undoSnap.cid && ui.panel) ui.cid = undoSnap.cid;
    undoSnap = null;
    hideToast();
    render();
  }

  function resetDemo() {
    closePop();
    closeSearch();
    if (E.logDlg.open) E.logDlg.close();
    if (E.contactDlg.open) E.contactDlg.close();
    clearInterval(callTimer);
    try { window.sessionStorage.removeItem(KEY); } catch (e) { /* noop */ }
    state = DATA.build();
    state.t0 = Date.now();
    ui = freshUi();
    undoSnap = null;
    try { history.replaceState(null, '', '#home'); } catch (e) { /* noop */ }
    render();
    E.main.scrollTop = 0;
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
    const f = p.querySelector('input:not([type=hidden]), textarea, [data-pick]:not([aria-disabled="true"])');
    if (f && !f.closest('[hidden]')) f.focus({ preventScroll: true });
  }
  function placePop() {
    if (!pop) return;
    const p = pop.el;
    if (mqMobile.matches) { p.classList.add('pop-sheet'); p.style.left = ''; p.style.top = ''; return; }
    p.classList.remove('pop-sheet');
    const r = pop.anchor.getBoundingClientRect();
    const w = p.offsetWidth, h = p.offsetHeight;
    let left = p.classList.contains('pop-right') ? r.right - w : r.left;
    left = Math.min(Math.max(8, left), window.innerWidth - w - 8);
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

  function openBell() {
    if (pop && pop.anchor === E.bell) { closePop(); return; }
    const s = stats();
    const next = openTasks().filter(isToday).sort(byDue).slice(0, 3);
    const html = '<p class="pop-h">Reminders</p>' +
      (s.over ? `<button type="button" class="pop-i" data-pick="over"><span class="red">${plural(s.over, 'task')} overdue</span><span class="pop-r">View</span></button>` : '') +
      next.map(t => `<button type="button" class="pop-i" data-pick="${t.id}"><span>${esc(label(t))}</span><span class="pop-r">${t12(t.time)}</span></button>`).join('') +
      (!s.over && !next.length ? '<p class="pop-empty">You’re all caught up.</p>' : '');
    openPop(E.bell, html, v => {
      closePop();
      if (v === 'over') go('tasks', { filter: 'overdue' });
      else selectTask(v);
    }, 'pop-right pop-wide');
  }

  /* ---------- Search ---------- */
  let qItems = [], qActive = -1;
  function runSearch() {
    const q = E.q.value.trim().toLowerCase();
    if (!q) { closeSearch(); return; }
    const has = s => String(s || '').toLowerCase().includes(q);
    const contacts = state.contacts.filter(c => has(c.org) || has(person(c)) || has(c.industry) || has(c.area)).slice(0, 5);
    const deals = state.contacts.filter(c => has(c.deal.name) || has(c.deal.stage)).filter(c => !contacts.includes(c)).slice(0, 3);
    const notes = [];
    state.contacts.forEach(c => c.history.forEach(h => { if ((h.kind === 'note' && has(h.text)) || has(h.note)) notes.push({ c, h }); }));
    notes.sort((a, b) => b.h.day - a.h.day || b.h.time - a.h.time);
    qItems = [];
    let html = '';
    const sec = (title, items) => {
      if (!items.length) return;
      html += `<p class="qres-h" role="presentation">${title}</p>`;
      items.forEach(it => {
        const i = qItems.length;
        qItems.push(it);
        html += `<div class="qres-i" role="option" id="qo-${i}" data-qi="${i}" aria-selected="false"><span class="qres-t">${it.t}</span><span class="qres-m">${it.m}</span></div>`;
      });
    };
    sec('Contacts', contacts.map(c => ({ cid: c.id, tab: 'overview', t: esc(c.org), m: esc(person(c) + (c.title ? ' – ' + c.title : '')) })));
    sec('Deals', deals.map(c => ({ cid: c.id, tab: 'deals', t: esc(c.org) + ' · ' + esc(c.deal.name), m: esc(c.deal.stage + ' · ' + money(c.deal.amount)) })));
    sec('Notes', notes.slice(0, 3).map(({ c, h }) => ({ cid: c.id, tab: 'activity', t: '“' + esc(h.kind === 'note' ? h.text : h.note) + '”', m: esc(c.org + ' · ' + TEAM[h.who].first) })));
    if (!qItems.length) html = `<p class="qres-empty">No matches for “${esc(E.q.value.trim())}”.</p>`;
    E.qres.innerHTML = html;
    E.qres.hidden = false;
    E.q.setAttribute('aria-expanded', 'true');
    qActive = qItems.length ? 0 : -1;
    markActive();
  }
  function markActive() {
    $$('.qres-i', E.qres).forEach((n, i) => { const on = i === qActive; n.classList.toggle('on', on); n.setAttribute('aria-selected', on); });
    if (qActive >= 0) { E.q.setAttribute('aria-activedescendant', 'qo-' + qActive); const n = $('#qo-' + qActive); if (n) n.scrollIntoView({ block: 'nearest' }); }
    else E.q.removeAttribute('aria-activedescendant');
  }
  function closeSearch() {
    E.qres.hidden = true;
    E.q.setAttribute('aria-expanded', 'false');
    E.q.removeAttribute('aria-activedescendant');
    qItems = []; qActive = -1;
  }
  function pickSearch(i) {
    const it = qItems[i];
    if (!it) return;
    E.q.value = '';
    closeSearch();
    openContact(it.cid, it.tab);
  }
  E.q.addEventListener('input', runSearch);
  E.q.addEventListener('focus', () => { if (E.q.value.trim()) runSearch(); });
  E.q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' && qItems.length) { e.preventDefault(); qActive = (qActive + 1) % qItems.length; markActive(); }
    else if (e.key === 'ArrowUp' && qItems.length) { e.preventDefault(); qActive = (qActive - 1 + qItems.length) % qItems.length; markActive(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (qActive >= 0) pickSearch(qActive); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!E.qres.hidden) closeSearch(); else { E.q.value = ''; E.q.blur(); } }
  });
  E.qres.addEventListener('mousedown', e => e.preventDefault());
  E.qres.addEventListener('click', e => { const n = e.target.closest('[data-qi]'); if (n) pickSearch(+n.dataset.qi); });
  E.q.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== E.q) closeSearch(); }, 100));

  /* ---------- Log interaction ---------- */
  let L = null;
  const rxCache = {};
  const escRx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const COMMON = ['joy', 'rose', 'hall', 'grant', 'chin', 'cole', 'baker', 'miller', 'kelly', 'lawrence', 'dennis', 'scott', 'kerr', 'wint', 'troy', 'shane', 'petal', 'owen', 'ryan', 'neil'];
  function contactRx(c) {
    if (rxCache[c.id] && rxCache[c.id].org === c.org && rxCache[c.id].p === person(c)) return rxCache[c.id];
    const poss = "(?:['’]s)?\\b";
    const core = c.org.replace(/\s+(?:Ltd\.?|Limited|Co\.?|Company|Inc\.?)$/i, '');
    const one = w => new RegExp('\\b' + escRx(w) + poss, COMMON.includes(w.toLowerCase()) ? 'g' : 'gi');
    const r = {
      org: c.org, p: person(c),
      tries: [
        [new RegExp('(?:^|[^\\w])(' + escRx(core) + '(?:\\s+(?:Ltd|Limited|Co|Company)\\.?)?)' + '(?![\\w])', 'gi'), 4, 1],
        c.last ? [new RegExp('\\b' + escRx(c.first) + '\\s+' + escRx(c.last) + poss, 'gi'), 3] : null,
        c.first ? [one(c.first), 2] : null,
        c.last ? [one(c.last), 1] : null
      ].filter(Boolean)
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
  const nextMonday = () => (8 - TODAY_DOW) % 7 || 7;
  const DAY_RX = [
    [/\b(?:on\s+)?(today|tonight|this\s+afternoon|later\s+today)\b/i, () => [0, null]],
    [/\b(?:on\s+)?(tomorrow|tmrw|tmr)\b/i, () => [1, null]],
    [/\b(?:by\s+|on\s+)?(?:early\s+)?next\s+week\b/i, () => [nextMonday(), 'Next week']],
    [/\b(?:by\s+)?(?:the\s+)?end\s+of\s+(?:the|this)\s+week\b/i, () => [(5 - TODAY_DOW + 7) % 7 || 7, 'End of week']],
    [/\bin\s+(\d{1,2})\s+days?\b/i, x => [+x[1], null]],
    [/\bin\s+(?:a|one)\s+week\b/i, () => [7, 'In a week']],
    [/\b(?:on\s+|by\s+)?(?:(this|next)\s+)?(monday|mon|tuesday|tues|tue|wednesday|weds|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat|sunday|sun)\b\.?/i, x => [weekday(x[2], x[1]), null]]
  ];
  const TIME_RX = [
    [/\b(?:at\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/i, m => { let h = +m[1]; const pm = /p/i.test(m[3]); if (h < 1 || h > 12 || (m[2] && +m[2] > 59)) return null; if (h === 12) h = pm ? 12 : 0; else if (pm) h += 12; return h * 60 + (m[2] ? +m[2] : 0); }],
    [/\b(?:at\s+)?(noon|midday)\b/i, () => 720],
    [/\bat\s+([01]?\d|2[0-3]):([0-5]\d)\b/i, m => { let h = +m[1]; if (h >= 1 && h < 7) h += 12; return h * 60 + +m[2]; }],
    [/\b(?:in\s+the\s+|this\s+)(morning|afternoon|evening)\b/i, m => ({ morning: 540, afternoon: 840, evening: 1020 }[m[1].toLowerCase()])]
  ];
  const NEXT_RX = /^(?:(?:and|then|so|also|please|pls|but)\s+)?(?:(?:i|we|he|she|they)\s+(?:need|needs|have|has|want|wants)\s+to\s+|(?:i|we)(?:'ll|’ll|\s+will|\s+should|\s+must|\s+need\s+to)\s+|need\s+to\s+|to\s*do:?\s+|next(?:\s+step)?:?\s+|remember\s+to\s+)?(send|email|e-mail|call|phone|ring|text|whatsapp|follow[\s-]?up|schedule|book|set\s+up|arrange|share|check|confirm|review|prepare|draft|remind|visit|meet|chase|update|invoice|drop\s+off|get|reply)\b/i;

  function findContacts(text) {
    const out = [];
    state.contacts.forEach(c => {
      for (const [rx, score, grp] of contactRx(c).tries) {
        rx.lastIndex = 0;
        const m = rx.exec(text);
        if (m) {
          const s = grp ? m.index + m[0].indexOf(m[grp]) : m.index;
          const len = grp ? m[grp].length : m[0].length;
          out.push({ c, score, s, e: s + len });
          break;
        }
      }
    });
    const top = out.reduce((a, x) => Math.max(a, x.score), 0);
    const rank = c => { const o = openFor(c.id); return o.some(isOverdue) ? 0 : o.length ? 1 : 2; };
    return out.filter(x => x.score === top).sort((a, b) => rank(a.c) - rank(b.c) || a.c.org.localeCompare(b.c.org));
  }
  function findWhen(text) {
    const W = { day: null, time: null, label: null, spans: [] };
    for (const [rx, fn] of DAY_RX) {
      const m = rx.exec(text);
      if (m) { const [d, l] = fn(m); if (d >= 0 && d <= 90) { W.day = d; W.label = l; W.spans.push([m.index, m.index + m[0].length]); break; } }
    }
    for (const [rx, fn] of TIME_RX) {
      const m = rx.exec(text);
      if (m) { const t = fn(m); if (t != null) { W.time = t; W.spans.push([m.index, m.index + m[0].length]); break; } }
    }
    return W;
  }
  function stripWhen(s) {
    let t = s;
    DAY_RX.forEach(([rx]) => { t = t.replace(new RegExp(rx.source, 'gi'), ' '); });
    TIME_RX.forEach(([rx]) => { t = t.replace(new RegExp(rx.source, 'gi'), ' '); });
    return t;
  }
  function stripNames(s, c) {
    if (!c) return s;
    let t = s;
    contactRx(c).tries.forEach(([rx]) => { t = t.replace(new RegExp(rx.source, 'gi'), m => m.replace(/[^\s(]+.*$/, ' ')); });
    return t;
  }
  function tidy(s) {
    let t = s.replace(/\s+/g, ' ').trim();
    for (let i = 0; i < 3; i++) {
      t = t.replace(/\s+(with|to|for|on|at|by|about|and|in|of|the|a|an|this|next)$/i, '')
        .replace(/^(and|then|so|also|to)\s+/i, '')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/[,.;:\s-]+$/, '')
        .trim();
    }
    return t;
  }
  function nextTitle(clause, c) {
    let t = clause.replace(/^(?:(?:and|then|so|also|please|pls|but)\s+)?(?:(?:i|we|he|she|they)\s+(?:need|needs|have|has|want|wants)\s+to\s+|(?:i|we)(?:'ll|’ll|\s+will|\s+should|\s+must|\s+need\s+to)\s+|need\s+to\s+|to\s*do:?\s+|next(?:\s+step)?:?\s+|remember\s+to\s+)?/i, '');
    t = stripWhen(t);
    t = stripNames(t, c);
    t = t.replace(/\b(him|her|them|us|me|it|a|an|the|some|our|my|his|their|over)\b/gi, ' ').replace(/\bfollow[\s-]?up\b/i, 'follow up');
    t = tidy(t);
    const words = t.split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    t = words.slice(0, 5).join(' ');
    t = t.replace(/\bwhats\s?app\b/gi, 'WhatsApp');
    return cap(t);
  }
  function makeSummary(sents, c) {
    if (!sents.length) return { short: '', full: '' };
    const first = sents[0];
    let s = first, verb = false;
    s = s.replace(/^(?:i\s+|we\s+)?(?:just\s+)?(?:spoke|talked|chatted|met|called|phoned|rang|emailed|caught\s+up)\s+(?:with\s+|to\s+)?/i, () => { verb = true; return ''; });
    if (verb && c) {
      const core = c.org.replace(/\s+(?:Ltd\.?|Limited|Co\.?|Company|Inc\.?)$/i, '');
      const alts = [c.org, core, person(c), c.first, c.last].filter(Boolean).sort((x, y) => y.length - x.length).map(escRx);
      const orgAlt = [c.org, core].map(escRx).join('|');
      s = s.replace(new RegExp('^(?:' + alts.join('|') + ")(?:['’]s)?(?![\\w])\\s*", 'i'), '');
      s = s.replace(new RegExp('^(?:at|from)\\s+(?:' + orgAlt + ')(?![\\w])\\s*', 'i'), '');
      s = s.replace(/^(?:about|re|regarding|on|over)\s+(?:the\s+)?/i, '');
      s = s.replace(/[.!?]+$/, '').trim();
      s = s ? 'Discussed ' + s : first.replace(/[.!?]+$/, '');
    } else s = first.replace(/[.!?]+$/, '');
    s = cap(s.trim());
    const rest = sents.slice(1).map(x => x.trim()).join(' ');
    return { short: s + (rest ? '…' : ''), full: s + '.' + (rest ? ' ' + rest : '') };
  }
  function detectType(summaryText) {
    const s = summaryText.toLowerCase();
    if (/\b(spoke|speak|talked|called|phoned|rang|on the phone|call|phone call|voicemail)\b/.test(s)) return 'call';
    if (/\b(met|meeting|visited|lunch|coffee|demo|in person|stopped by|dropped by)\b/.test(s)) return 'meeting';
    if (/\b(emailed|email|e-mail|wrote|replied)\b/.test(s)) return 'email';
    return null;
  }
  const typeForTitle = t => /^(call|phone|ring|follow up call)/i.test(t) ? 'call' : /^(schedule|book|meet|visit|set up|arrange)/i.test(t) ? 'meeting' : /^(send|email|share|reply|invoice|draft|prepare)/i.test(t) ? 'email' : /^follow up/i.test(t) ? 'call' : 'note';

  function parseLog(text) {
    const P = { cands: findContacts(text), when: findWhen(text), summary: { short: '', full: '' }, next: null, type: null };
    const hit = P.cands[0] || null;
    const sents = text.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
    const sumParts = [];
    let nextClause = null;
    sents.forEach(s => {
      if (nextClause) { if (!NEXT_RX.test(s)) sumParts.push(s); return; }
      const clauses = s.split(/\s*[,;]\s*|\s+(?=(?:and|then|so)\s+)/i).filter(Boolean);
      const i = clauses.findIndex(x => NEXT_RX.test(x.trim()));
      if (i < 0) { sumParts.push(s); return; }
      nextClause = clauses[i];
      if (i > 0) sumParts.push(clauses.slice(0, i).join(', ').replace(/[,\s]+$/, '') + '.');
    });
    const c = hit ? hit.c : null;
    P.summary = makeSummary(sumParts, c);
    P.type = detectType(sumParts.join(' '));
    if (nextClause) P.next = nextTitle(nextClause, c);
    return P;
  }

  function resolveLog() {
    const text = E.logInput.value;
    const P = parseLog(text);
    const R = { P, multi: null };
    if (L.ov.contactId) { R.contactId = L.ov.contactId; }
    else if (P.cands.length) {
      const ids = P.cands.map(x => x.c.id);
      R.contactId = L.pick && ids.includes(L.pick) ? L.pick : ids[0];
      if (P.cands.length > 1) R.multi = P.cands.length;
    } else R.contactId = null;
    R.type = L.ov.type || P.type || 'note';
    R.typeAuto = !L.ov.type && !!P.type;
    R.summaryShort = L.ov.summary != null ? L.ov.summary : P.summary.short;
    R.summaryFull = L.ov.summary != null ? L.ov.summary : P.summary.full;
    R.next = L.ov.next !== undefined ? L.ov.next : P.next;
    let day = P.when.day, time = P.when.time, dl = P.when.label;
    if (day == null && time != null) { day = time > nowMin() ? 0 : 1; }
    if (L.ov.day != null) { day = L.ov.day; dl = L.ov.dayLabel || null; }
    if (L.ov.time != null) time = L.ov.time;
    R.dayFromText = P.when.day != null && L.ov.day == null;
    if (day == null) { day = 1; dl = null; R.dayDefault = true; }
    if (time == null) time = state.settings.defaultTime;
    if (day === 0 && time < nowMin() && L.ov.time == null) time = Math.min(17 * 60 + 30, Math.ceil((nowMin() + 30) / 30) * 30);
    R.day = day; R.time = time; R.dayLabel = dl;
    R.outside = time < state.settings.start || time >= state.settings.end;
    const c = R.contactId ? contact(R.contactId) : null;
    R.late = c ? openFor(c.id).find(t => isOverdue(t) || t.day === 0) || null : null;
    return R;
  }

  function openLog(o) {
    o = o || {};
    if (blockedByCall()) return;
    closePop();
    closeSearch();
    if (E.logDlg.open) return;
    opener = document.activeElement;
    L = { ov: {}, pick: null, also: true, alsoFor: null, err: false, R: null };
    if (o.contactId) L.ov.contactId = o.contactId;
    if (o.type) L.ov.type = o.type;
    E.logInput.value = o.text || '';
    updateLog();
    showDialog(E.logDlg);
    E.logInput.focus();
    const n = E.logInput.value.length;
    E.logInput.setSelectionRange(n, n);
  }

  function updateLog() {
    const R = L.R = resolveLog();
    if (R.late && L.alsoFor !== R.late.id) { L.alsoFor = R.late.id; L.also = true; }
    renderLogTypes();
    renderLogFields();
  }
  function renderLogTypes() {
    const R = L.R;
    const a = document.activeElement;
    const had = a && E.logTypes.contains(a) ? a.dataset.type : null;
    E.logTypes.innerHTML = TYPE_KEYS.map(k => {
      const on = R.type === k;
      return `<button type="button" class="n-chip${on ? ' on' : ''}" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-act="log-type" data-type="${k}">${icon(TYPES[k].icon)}<span>${TYPES[k].label}</span></button>`;
    }).join('');
    if (had) { const n = $(`[data-type="${had}"]`, E.logTypes); if (n) n.focus({ preventScroll: true }); }
  }
  function renderLogFields() {
    const R = L.R;
    const a = document.activeElement;
    const key = a && E.logFields.contains(a) && a.id ? '#' + a.id : null;
    const c = R.contactId ? contact(R.contactId) : null;
    const row = (id, k, v, plain, note) =>
      `<button type="button" class="n-field" id="nf-${id}" data-act="log-field" data-field="${id}" aria-haspopup="true" aria-expanded="false" aria-label="${esc(k)}: ${esc(plain)}. Change"><span class="n-k">${k}</span><span class="n-v">${v}</span>${note ? `<span class="n-note">${note}</span>` : ''}${icon('chevron-right')}</button>`;
    let h = '';
    if (c) h += row('contact', 'Contact', `${esc(c.first)} (${esc(c.org)})`, `${c.first} (${c.org})`, R.multi && !L.ov.contactId ? plural(R.multi, 'match') : '');
    else h += row('contact', 'Contact', `<span class="${L.err ? 'red' : 'muted'}">${L.err ? 'Choose a contact to save' : 'Type a name, or choose'}</span>`, 'none');
    h += row('type', 'Type', esc(TYPES[R.type].label), TYPES[R.type].label);
    h += row('summary', 'Summary', R.summaryShort ? esc(R.summaryShort) : '<span class="muted">Add what happened</span>', R.summaryShort || 'none');
    h += row('next', 'Next step', R.next ? esc(R.next) : '<span class="muted">None</span>', R.next || 'None');
    const due = R.next ? (R.dayLabel ? `${esc(R.dayLabel)} <span class="muted">· ${esc(dateShort(R.day))}</span>` : esc(whenLong(R.day)) + (R.day > 1 ? '' : '') + ` <span class="muted">· ${t12(R.time)}</span>`) : '<span class="muted">—</span>';
    h += row('due', 'Due date', due, R.next ? (R.dayLabel || whenLong(R.day)) : 'none', R.next && R.outside ? 'outside hours' : R.next && R.dayDefault ? 'default' : '');
    E.logFields.innerHTML = h;
    E.logAlso.innerHTML = R.late
      ? `<label class="also"><input type="checkbox" id="logAlsoBox"${L.also ? ' checked' : ''}><span>Also complete <b>“${esc(R.late.title)}”</b> (${isOverdue(R.late) ? 'overdue ' + esc(ageText(R.late)) : 'due ' + t12(R.late.time)})</span></label>`
      : '';
    if (key) { const n = $(key, E.logFields); if (n) n.focus({ preventScroll: true }); }
  }

  function openFieldEditor(field, anchor) {
    if (pop && pop.anchor === anchor) { closePop(); return; }
    const R = L.R;
    const done = () => { closePop(); updateLog(); const n = $('#nf-' + field); if (n) n.focus({ preventScroll: true }); };
    if (field === 'type') {
      openPop(anchor, '<p class="pop-h">Type</p>' + TYPE_KEYS.map(k => `<button type="button" class="pop-i${k === R.type ? ' on' : ''}" data-pick="${k}"><span class="pop-ic">${icon(TYPES[k].icon)}${TYPES[k].label}</span></button>`).join(''),
        v => { L.ov.type = v; done(); }, 'pop-right');
    } else if (field === 'next') {
      const opts = NEXT_OPTS.filter(o => o[0] !== 'none').map(o => o[1]);
      if (R.next && !opts.includes(R.next)) opts.unshift(R.next);
      openPop(anchor, '<p class="pop-h">Next step</p>' + opts.map(o => `<button type="button" class="pop-i${o === R.next ? ' on' : ''}" data-pick="${esc(o)}"><span>${esc(o)}</span></button>`).join('') +
        `<button type="button" class="pop-i${!R.next ? ' on' : ''}" data-pick="__none"><span>None for now</span></button>` +
        '<form class="pop-form" id="popNextForm"><label><span class="sr-only">Custom next step</span><input type="text" id="popNext" placeholder="Or type a next step" autocomplete="off"></label><button type="submit" class="btn btn-sm">Set</button></form>',
        v => { L.ov.next = v === '__none' ? null : v; done(); }, 'pop-right');
      $('#popNextForm').addEventListener('submit', e => { e.preventDefault(); const v = $('#popNext').value.trim(); if (v) { L.ov.next = cap(v); done(); } });
    } else if (field === 'summary') {
      openPop(anchor, `<p class="pop-h">Summary</p><form class="pop-form col" id="popSumForm"><label><span class="sr-only">Summary</span><textarea id="popSum" rows="3">${esc(R.summaryFull)}</textarea></label><div class="pop-acts">${L.ov.summary != null ? '<button type="button" class="btn btn-sm" data-pick="auto">Use extracted</button>' : ''}<button type="submit" class="btn btn-sm btn-sm-primary">Done</button></div></form>`,
        v => { if (v === 'auto') { delete L.ov.summary; done(); } }, 'pop-right pop-wide');
      $('#popSumForm').addEventListener('submit', e => { e.preventDefault(); L.ov.summary = $('#popSum').value.trim(); done(); });
    } else if (field === 'due') {
      const times = [];
      for (let m = 7 * 60; m <= 19 * 60; m += 30) times.push(m);
      if (!times.includes(R.time)) { times.push(R.time); times.sort((a, b) => a - b); }
      const fri = (5 - TODAY_DOW + 7) % 7 || 7;
      openPop(anchor, '<p class="pop-h">Due date</p>' + [[0, 'Today'], [1, 'Tomorrow'], [fri, dayName(fri)], [nextMonday(), 'Next week']].map(o =>
        `<button type="button" class="pop-i${o[0] === R.day ? ' on' : ''}" data-pick="${o[0]}" data-l="${o[1] === 'Next week' ? 'Next week' : ''}"><span>${o[1]}</span><span class="pop-r">${dateShort(o[0])}</span></button>`).join('') +
        `<div class="pop-when"><label><span>Date</span><input type="date" id="popDate" min="${iso(0)}" max="${iso(90)}" value="${iso(R.day)}"></label>` +
        `<label><span>Time</span><select id="popTime">${times.map(m => `<option value="${m}"${m === R.time ? ' selected' : ''}>${t12(m)}</option>`).join('')}</select></label></div>`,
        (v, b) => { L.ov.day = +v; L.ov.dayLabel = b.dataset.l || null; if (!R.next) L.ov.next = 'Follow up'; done(); }, 'pop-right');
      const pd = $('#popDate'), pt = $('#popTime');
      pd.addEventListener('change', () => { const d = offFromIso(pd.value); if (d != null && d >= 0) { L.ov.day = d; L.ov.dayLabel = null; updateLog(); } });
      pt.addEventListener('change', () => { L.ov.time = +pt.value; updateLog(); });
    } else if (field === 'contact') {
      openPop(anchor, `<div class="pop-search">${icon('search')}<input type="search" id="popSearch" placeholder="Search ${state.contacts.length} contacts" aria-label="Search contacts" autocomplete="off" spellcheck="false"></div><div class="pop-list" id="popList"></div>`,
        v => { L.ov.contactId = v; L.pick = null; L.err = false; done(); }, 'pop-right pop-wide');
      const s = $('#popSearch');
      const candIds = R.P.cands.map(x => x.c.id);
      const fill = () => {
        const q = s.value.trim().toLowerCase();
        const list = state.contacts.filter(x => !q || (x.org + ' ' + person(x) + ' ' + x.area).toLowerCase().includes(q))
          .sort((a, b) => (a.id === R.contactId ? -1 : b.id === R.contactId ? 1 : 0) || (candIds.includes(b.id) - candIds.includes(a.id)) || a.org.localeCompare(b.org)).slice(0, 7);
        $('#popList').innerHTML = list.length ? list.map(x => `<button type="button" class="pop-i${x.id === R.contactId ? ' on' : ''}" data-pick="${x.id}"><span>${esc(x.org)}</span><span class="pop-r">${esc(person(x))}</span></button>`).join('') : '<p class="pop-empty">No contacts match.</p>';
      };
      s.addEventListener('input', fill);
      s.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); const b = $('#popList [data-pick]'); if (b) { L.ov.contactId = b.dataset.pick; L.pick = null; L.err = false; done(); } }
        if (e.key === 'ArrowDown') { e.preventDefault(); const b = $('#popList [data-pick]'); if (b) b.focus(); }
      });
      fill();
      s.focus();
    }
  }

  function saveLog() {
    const R = L.R;
    if (!R.contactId) { L.err = true; renderLogFields(); const b = $('#nf-contact'); if (b) b.focus(); return; }
    const text = E.logInput.value.trim();
    if (!text && !R.next && L.ov.summary == null) { E.logInput.focus(); E.logInput.setAttribute('aria-invalid', 'true'); toast('Type what happened first'); return; }
    E.logInput.removeAttribute('aria-invalid');
    const snap = snapshot();
    const c = contact(R.contactId);
    const at = nowMin();
    const summary = R.summaryFull || text || TYPES[R.type].label;
    if (R.type === 'note') c.history.push({ kind: 'note', text: text || summary, who: 'you', day: 0, time: at });
    else c.history.push({ kind: R.type, text: summary, note: text && text !== summary ? text : null, who: 'you', day: 0, time: at });
    let created = null;
    if (R.next) {
      created = { id: 't' + state.seq++, contactId: c.id, title: R.next, type: typeForTitle(R.next), priority: c.priority, owner: 'you', day: R.day, time: R.time, status: 'open' };
      state.tasks.push(created);
    }
    let closed = null;
    if (R.late && L.also) {
      closed = task(R.late.id);
      closed.status = 'done'; closed.doneDay = 0; closed.doneAt = at; closed.result = TYPES[R.type].label + ' logged';
    }
    E.logDlg.close();
    if (ui.panel && ui.cid === c.id && !ui.call) { ui.tab = created ? 'tasks' : 'activity'; ui.focusTask = created ? created.id : null; }
    render();
    toast(`Saved to ${c.org}${created ? ' · ' + created.title + ' ' + (R.dayLabel ? R.dayLabel.toLowerCase() : whenShort(created.day)) : ''}${closed ? ' · ' + closed.title + ' done' : ''}`, snap);
  }

  /* ---------- New and edit contact ---------- */
  let editing = null;
  function openContactDlg(c) {
    if (blockedByCall()) return;
    closePop();
    opener = document.activeElement;
    editing = c || null;
    E.contactForm.reset();
    E.contactErr.hidden = true;
    const f = E.contactForm.elements;
    $('#contactTitle').textContent = c ? 'Edit contact' : 'New contact';
    $('#contactSave').textContent = c ? 'Save changes' : 'Add contact';
    if (c) {
      f.org.value = c.org; f.person.value = person(c); f.title.value = c.title || ''; f.industry.value = c.industry || '';
      f.area.value = c.area || ''; f.phone.value = c.phone || ''; f.website.value = c.website || ''; f.owner.value = c.owner; f.priority.value = c.priority;
    }
    showDialog(E.contactDlg);
    f.org.focus();
  }
  function saveContact() {
    const f = E.contactForm.elements;
    const org = f.org.value.trim().replace(/\s+/g, ' ');
    const pn = f.person.value.trim().replace(/\s+/g, ' ');
    if (!org && !pn) { E.contactErr.hidden = false; f.org.setAttribute('aria-invalid', 'true'); f.org.focus(); return; }
    f.org.removeAttribute('aria-invalid');
    const snap = snapshot();
    const parts = pn.split(' ').filter(Boolean);
    const first = parts.length ? cap(parts.shift()) : '', last = parts.join(' ');
    const vals = {
      org: org || pn, first, last, title: f.title.value.trim(), industry: f.industry.value.trim(), area: f.area.value.trim(),
      phone: f.phone.value.trim(), website: f.website.value.trim(), owner: f.owner.value, priority: f.priority.value
    };
    let c = editing;
    if (c) {
      Object.assign(c, vals);
      c.history.push({ kind: 'stage', text: 'Details updated', who: 'you', day: 0, time: nowMin() });
    } else {
      c = Object.assign({ id: 'c' + state.contactSeq++, email: '', deal: { name: 'New deal', amount: 0, stage: 'Lead' }, added: 0, history: [] }, vals);
      c.history.push({ kind: 'added', text: 'New lead', who: 'you', day: 0, time: nowMin() });
      state.contacts.push(c);
    }
    E.contactDlg.close();
    const wasEdit = !!editing;
    editing = null;
    ui.cid = c.id;
    ui.tab = 'overview';
    ui.panel = true;
    if (!wasEdit && ui.view === 'contacts') { ui.cq = ''; ui.cfilter = 'all'; ui.sel = { type: 'contact', id: c.id }; }
    render();
    const hd = $('.c-name', E.panel);
    if (hd) hd.focus({ preventScroll: true });
    toast(wasEdit ? 'Saved ' + c.org : 'Added ' + c.org, snap);
  }

  function showDialog(d) {
    d.showModal();
    E.app.classList.add('dim');
  }
  [E.logDlg, E.contactDlg].forEach(d => {
    d.addEventListener('cancel', e => { if (pop || Date.now() - popClosedAt < 120) { e.preventDefault(); popClosedAt = 0; closePop(true); } });
    d.addEventListener('close', () => {
      closePop();
      if (!E.logDlg.open && !E.contactDlg.open) E.app.classList.remove('dim');
      const back = opener && document.contains(opener) ? opener : null;
      opener = null;
      if (back) back.focus({ preventScroll: true });
      else { const h = $('.c-name', E.panel); if (h && ui.panel) h.focus({ preventScroll: true }); }
    });
    d.addEventListener('mousedown', e => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
  });
  E.logForm.addEventListener('submit', e => { e.preventDefault(); saveLog(); });
  E.contactForm.addEventListener('submit', e => { e.preventDefault(); saveContact(); });
  E.logInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); saveLog(); }
  });
  E.logInput.addEventListener('input', () => { L.err = false; E.logInput.removeAttribute('aria-invalid'); updateLog(); });
  E.logTypes.addEventListener('keydown', e => {
    const i = TYPE_KEYS.indexOf(L.R.type);
    let n = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = TYPE_KEYS[(i + 1) % 4];
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = TYPE_KEYS[(i + 3) % 4];
    if (n) { e.preventDefault(); L.ov.type = n; updateLog(); const b = $(`[data-type="${n}"]`, E.logTypes); if (b) b.focus(); }
  });
  $('#areas').innerHTML = AREAS.map(a => `<option value="${a}"></option>`).join('');

  /* ---------- Events ---------- */
  function selTask() {
    if (ui.sel && ui.sel.type === 'task') { const t = task(ui.sel.id); if (t && isOpen(t)) return t; }
    if (ui.panel && ui.cid && !ui.call) return (ui.focusTask && task(ui.focusTask) && isOpen(task(ui.focusTask)) ? task(ui.focusTask) : openFor(ui.cid)[0]) || null;
    return null;
  }

  function act(name, b) {
    switch (name) {
      case 'reset': resetDemo(); break;
      case 'menu': ui.menu = !ui.menu; renderSide(); if (ui.menu) { const f = $('.side-close', E.side); if (f && mqMobile.matches) f.focus(); } else E.menuBtn.focus(); break;
      case 'go': go(b.dataset.f); break;
      case 'tasks': go('tasks', { filter: b.dataset.f || 'all' }); break;
      case 'contacts-filter': go('contacts', { cfilter: b.dataset.f }); break;
      case 'filter': ui.filter = b.dataset.f; ui.sel = null; render(); break;
      case 'cfilter': ui.cfilter = b.dataset.f; render(); break;
      case 'dstage': ui.dstage = ui.dstage === b.dataset.f ? 'all' : b.dataset.f; render(); break;
      case 'feed-toggle': ui.feedAll = !ui.feedAll; render(); break;
      case 'sort': {
        const k = b.dataset.key;
        ui.sort = ui.sort.key === k ? { key: k, dir: -ui.sort.dir } : { key: k, dir: k === 'deal' ? -1 : 1 };
        render();
        break;
      }
      case 'log': openLog(); break;
      case 'log-cancel': E.logDlg.close(); break;
      case 'log-type': L.ov.type = b.dataset.type; updateLog(); break;
      case 'log-field': openFieldEditor(b.dataset.field, b); break;
      case 'new-contact': openContactDlg(null); break;
      case 'edit-contact': openContactDlg(contact(ui.cid)); break;
      case 'contact-cancel': E.contactDlg.close(); break;
      case 'panel-close': closePanel(); break;
      case 'tab': ui.tab = b.dataset.tab; renderPanelKeepFocus(); { const t = $(`#tab-${ui.tab}`, E.panel); if (t && b.getAttribute('role') !== 'tab') t.focus(); } break;
      case 'c-call': startCall(ui.cid); break;
      case 'c-email': { const c = contact(ui.cid); openLog({ contactId: c.id, type: 'email', text: `Emailed ${c.first || c.org} about ` }); break; }
      case 'c-meet': { const c = contact(ui.cid); openLog({ contactId: c.id, type: 'meeting', text: `Met with ${c.first || c.org} about ` }); break; }
      case 'c-note': openLog({ contactId: ui.cid, type: 'note' }); break;
      case 'c-log': openLog({ contactId: ui.cid }); break;
      case 'c-more': case 'more': openMore(b); break;
      case 'done': markDone(task(b.dataset.id)); break;
      case 'later': openLater(b, task(b.dataset.id)); break;
      case 'end-call': endCall(); break;
      case 'call-cancel': cancelCall(); break;
      case 'bell': openBell(); break;
      case 'undo': undo(); break;
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
    if (nav) { go(nav.dataset.nav, { focus: true }); return; }
    const row = t.closest('[data-task]');
    if (row) { selectTask(row.dataset.task); return; }
    const cl = t.closest('[data-contact]');
    if (cl) { selectContact(cl.dataset.contact, cl.dataset.tab); return; }
    if (ui.menu && !t.closest('#side') && !t.closest('.menubtn')) { ui.menu = false; renderSide(); }
  });
  document.addEventListener('mousedown', e => {
    if (pop && !pop.el.contains(e.target) && !pop.anchor.contains(e.target)) closePop();
  }, true);

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'cq') { ui.cq = t.value; render(); }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'logAlsoBox') L.also = t.checked;
    else if (t.name === 'step' && ui.call) { ui.call.step = t.value; renderPanelKeepFocus(); }
    else if (t.name === 'due' && ui.call) {
      if (t.value === 'custom') { ui.call.custom = true; renderPanelKeepFocus(); const d = $('#afterDate'); if (d) { try { if (d.showPicker) d.showPicker(); } catch (x) { /* noop */ } } }
      else { ui.call.day = +t.value; ui.call.custom = false; renderPanelKeepFocus(); }
    } else if (t.id === 'afterDate' && ui.call) { const d = offFromIso(t.value); if (d != null && d >= 0) { ui.call.day = d; ui.call.custom = true; renderPanelKeepFocus(); } }
    else if (t.id === 'dealStage') setStage(contact(ui.cid), t.value);
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
    const i = list.findIndex(x => ui.sel && x.type === ui.sel.type && x.id === ui.sel.id);
    const ni = i < 0 ? (dir > 0 ? 0 : list.length - 1) : Math.min(list.length - 1, Math.max(0, i + dir));
    ui.sel = list[ni];
    if (ui.panel && !ui.call) {
      if (ui.sel.type === 'task') { const t = task(ui.sel.id); ui.cid = t.contactId; ui.tab = 'tasks'; ui.focusTask = t.id; }
      else { ui.cid = ui.sel.id; }
    }
    render();
    const n = ui.sel.type === 'task' ? $(`[data-task="${ui.sel.id}"]`, E.view) : $(`[data-contact="${ui.sel.id}"]`, E.view);
    if (n) { n.scrollIntoView({ block: 'nearest' }); n.focus({ preventScroll: true }); }
  }

  /* Arrow keys within the tab list */
  E.panel.addEventListener('keydown', e => {
    const t = e.target;
    if (!(t instanceof Element) || t.getAttribute('role') !== 'tab') return;
    const tabs = $$('[role="tab"]', E.panel);
    const i = tabs.indexOf(t);
    let n = -1;
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = tabs.length - 1;
    if (n < 0) return;
    e.preventDefault();
    ui.tab = tabs[n].dataset.tab;
    renderPanel();
    const f = $(`#tab-${ui.tab}`, E.panel);
    if (f) f.focus();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (pop) { e.preventDefault(); e.stopPropagation(); popClosedAt = Date.now(); closePop(true); return; }
      if (E.logDlg.open || E.contactDlg.open) return;
      if (ui.menu) { ui.menu = false; renderSide(); E.menuBtn.focus(); return; }
      if (ui.panel && !ui.call) { closePanel(); return; }
      return;
    }
    if (E.logDlg.open || E.contactDlg.open || pop) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t instanceof Element && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    const k = e.key.toLowerCase();
    if (k === '/') { e.preventDefault(); E.q.focus(); E.q.select(); return; }
    if (k === 'n') { e.preventDefault(); openLog(ui.panel && ui.cid && !ui.call ? { contactId: ui.cid } : undefined); return; }
    if (ui.call) return;
    const onRow = t instanceof Element && t.matches('.d-row, .t-open, .cl');
    if (k === 'j' || (onRow && k === 'arrowdown')) { e.preventDefault(); move(1); return; }
    if (k === 'k' || (onRow && k === 'arrowup')) { e.preventDefault(); move(-1); return; }
    if (k === 'd') {
      const st = selTask();
      if (!st) return;
      e.preventDefault();
      const wasRow = onRow;
      markDone(st);
      if (wasRow && ui.sel) { const n = $(`[data-task="${ui.sel.id}"], [data-contact="${ui.sel.id}"]`, E.view); if (n) n.focus({ preventScroll: true }); }
      return;
    }
    if (k === 'r') {
      const st = selTask();
      if (!st) return;
      e.preventDefault();
      let anchor = $(`[data-act="later"][data-id="${st.id}"]`, E.panel);
      if (!anchor || !anchor.offsetParent) anchor = $(`[data-task="${st.id}"]`, E.view);
      if (anchor) openLater(anchor, st);
      return;
    }
    if (k === 'c') {
      const st = selTask();
      const cid = st ? st.contactId : ui.sel && ui.sel.type === 'contact' ? ui.sel.id : ui.panel ? ui.cid : null;
      if (cid) { e.preventDefault(); startCall(cid); }
    }
  });

  let resizeT = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (ui.view === 'reports') drawChart(); placePop(); }, 80);
  });
  const onMq = () => { closePop(); render(); };
  if (mqMobile.addEventListener) mqMobile.addEventListener('change', onMq); else mqMobile.addListener(onMq);
  window.addEventListener('hashchange', () => { const v = location.hash.slice(1); const w = LEGACY[v] || v; if (VIEWS.includes(w) && w !== ui.view) go(w); });
  /* Keep relative times honest as the simulated clock moves */
  setInterval(() => { if (!E.logDlg.open && !E.contactDlg.open && !pop && document.activeElement !== E.q && (!ui.call) && ['home', 'tasks'].includes(ui.view)) render(); }, 60000);

  /* ---------- Start ---------- */
  const start = location.hash.slice(1);
  if (VIEWS.includes(LEGACY[start] || start)) ui.view = LEGACY[start] || start;
  render();
  window.FollowUp = { get state() { return state; }, get ui() { return ui; } };
})();
