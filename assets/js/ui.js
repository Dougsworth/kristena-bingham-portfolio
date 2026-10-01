/* UI portfolio: before/after slider and switchable screen states */
(function () {
  document.querySelectorAll('.ui-compare').forEach(function (box) {
    var input = box.querySelector('input');
    function set(v) { box.style.setProperty('--pos', v + '%'); }
    input.addEventListener('input', function () { set(input.value); });
    set(input.value);
  });

  document.querySelectorAll('[data-states]').forEach(function (wrap) {
    var tabs = wrap.querySelectorAll('[role="tab"]');
    var imgs = wrap.querySelectorAll('.ui-stage img');
    var note = wrap.querySelector('.ui-state-note');
    function pick(i) {
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', i === j ? 'true' : 'false'); t.tabIndex = i === j ? 0 : -1; });
      imgs.forEach(function (im, j) { im.classList.toggle('on', i === j); });
      if (note) note.textContent = tabs[i].getAttribute('data-note');
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!k) return;
        e.preventDefault();
        var n = (i + k + tabs.length) % tabs.length; pick(n); tabs[n].focus();
      });
    });
    pick(0);
  });
})();
