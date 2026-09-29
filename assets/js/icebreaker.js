/* Ice breaker: spot the three problems on a team task board */
(function () {
  var root = document.getElementById('spot');
  if (!root) return;
  var board = root.querySelector('.board');
  var status = root.querySelector('.ice-status');
  var slots = root.querySelectorAll('.ice-slots li');
  var showBtn = root.querySelector('[data-ice="show"]');
  var resetBtn = root.querySelector('[data-ice="reset"]');
  var hi = root.querySelector('.ice-hi');
  var miss = root.querySelector('.board-miss');
  var todoCount = root.querySelector('[data-todo]');
  var doneCount = root.querySelector('[data-done]');
  var doneList = root.querySelector('[data-done-list]');
  var bug1 = root.querySelector('[data-bug="1"]');
  var bug1Home = bug1.parentNode;
  var bug1Next = bug1.nextElementSibling;
  var bug1Tag = bug1.querySelector('.tag');
  var target = root.querySelector('[data-target="onboarding"]');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var found = {};
  var helped = false;
  var missTimer = null;
  var misses = ['Not that one', 'Looks fine to me', 'Keep looking', 'That one works'];
  var missIndex = 0;

  function count() { return Object.keys(found).length; }

  function say(text, win) {
    status.textContent = text;
    status.classList.toggle('win', !!win);
  }

  function markFound(n) {
    if (found[n]) return;
    found[n] = true;
    root.querySelector('[data-bug="' + n + '"]').classList.add('found');
    slots[n - 1].classList.add('found');
    var c = count();
    if (c < 3) say(c + ' of 3 found');
    else setTimeout(win, reduced ? 0 : 700);
  }

  function win() {
    board.setAttribute('data-state', 'fixed');
    root.classList.add('won');
    // The done task finally leaves the to-do list, stamped
    bug1Tag.textContent = '09:52';
    bug1Tag.classList.remove('late');
    doneList.insertBefore(bug1, doneList.firstChild);
    var stamp = document.createElement('span');
    stamp.className = 'hanko' + (reduced ? '' : ' stamp');
    stamp.textContent = '済';
    stamp.setAttribute('aria-label', 'Done');
    bug1.replaceChild(stamp, bug1Tag);
    todoCount.textContent = '3';
    doneCount.textContent = '2';
    say(helped ? 'There they are. Now you know what I look for.' : 'All three. You’d have made a great tester.', true);
    hi.hidden = false;
    hi.href = 'mailto:bingham.kristina1@gmail.com?subject=' + encodeURIComponent(helped ? 'I needed a hint' : 'I found all three');
    showBtn.hidden = true;
    resetBtn.hidden = false;
  }

  function reset() {
    found = {};
    helped = false;
    board.setAttribute('data-state', 'broken');
    root.classList.remove('won');
    root.querySelectorAll('.found').forEach(function (el) { el.classList.remove('found'); });
    var stamp = bug1.querySelector('.hanko');
    if (stamp) bug1.replaceChild(bug1Tag, stamp);
    bug1Tag.textContent = 'Overdue 3 days';
    bug1Tag.classList.add('late');
    bug1Home.insertBefore(bug1, bug1Next);
    todoCount.textContent = '4';
    doneCount.textContent = '1';
    say('0 of 3 found');
    hi.hidden = true;
    showBtn.hidden = false;
    resetBtn.hidden = true;
  }

  function nope(row) {
    miss.textContent = misses[missIndex++ % misses.length];
    miss.classList.add('on');
    clearTimeout(missTimer);
    missTimer = setTimeout(function () { miss.classList.remove('on'); }, 1100);
    if (!reduced) { row.classList.remove('nudge'); void row.offsetWidth; row.classList.add('nudge'); }
  }

  board.addEventListener('click', function (e) {
    var row = e.target.closest('.board-row');
    if (!row) return;
    var fixed = board.getAttribute('data-state') === 'fixed';
    if (fixed) {
      // After the fix, the notification actually opens its task
      if (row.getAttribute('data-bug') === '3' && target) {
        target.classList.remove('flash'); void target.offsetWidth; target.classList.add('flash');
        target.focus({ preventScroll: true });
      }
      return;
    }
    var n = row.getAttribute('data-bug');
    if (n) markFound(n);
    else nope(row);
  });

  showBtn.addEventListener('click', function () {
    helped = count() < 3;
    [1, 2, 3].forEach(function (n, i) {
      setTimeout(function () { markFound(String(n)); }, reduced ? 0 : i * 260);
    });
  });
  resetBtn.addEventListener('click', reset);
})();
