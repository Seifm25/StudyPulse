/* cart.js — tiny cart for StudyPulse: course list -> payment -> success.
   Uses localStorage only (no server). */
(function () {
  var CART_KEY = 'sp_cart', ORDER_KEY = 'sp_order';

  /* ===== Discount settings (change them here) ===== */
  var EARLY = { until: '2026-12-31', percent: 10 };  // automatic early-registration discount
  var PROMOS = { STUDY15: 15 };                      // promo codes (demo only: visible in the browser)

  function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function getCart() { return load(CART_KEY) || []; }
  function money(n) { return 'EGP ' + n.toLocaleString('en-US'); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* The bigger of (early discount, promo code) is applied. They never stack. */
  function totals(items, promoPct) {
    var sub = items.reduce(function (s, i) { return s + i.price; }, 0);
    var early = new Date() <= new Date(EARLY.until + 'T23:59:59') ? EARLY.percent : 0;
    var pct = Math.max(early, promoPct || 0);
    var off = Math.round(sub * pct / 100);
    return { sub: sub, pct: pct, off: off, total: sub - off,
             label: (promoPct || 0) > early ? 'Promo code' : 'Early registration' };
  }

  /* ================= COURSE LIST PAGE ================= */
  var table = document.getElementById('courseTable');
  if (table) {
    var bar = document.createElement('div');
    bar.className = 'checkout-bar';
    bar.hidden = true;
    bar.innerHTML = '<span><b id="cartCount">0</b> course(s) selected · Subtotal <b id="cartTotal"></b></span>' +
                    '<a href="payment.html" class="btn-checkout">Proceed to Payment <span class="arrow">→</span></a>';
    document.body.appendChild(bar);

    var rows = [].slice.call(table.querySelectorAll('tr[data-cr]'));
    var info = function (tr) {
      var c = tr.cells;
      return { code: c[0].textContent.trim(), name: c[1].textContent.trim(),
               price: parseInt(c[3].textContent.replace(/\D/g, ''), 10), cr: tr.dataset.cr };
    };

    var refresh = function () {
      var cart = getCart();
      rows.forEach(function (tr) {
        var b = tr.querySelector('button');
        if (!b) return;
        b.classList.add('add-btn');
        if (/^\s*0 of/.test(tr.cells[2].textContent)) { b.disabled = true; b.textContent = 'Full'; return; }
        var code = tr.cells[0].textContent.trim();
        var added = cart.some(function (i) { return i.code === code; });
        b.classList.toggle('added', added);
        b.textContent = added ? 'Added ✓' : 'Register';
        b.title = added ? 'Click to remove' : '';
      });
      bar.hidden = !cart.length;
      document.body.classList.toggle('has-cart', cart.length > 0);
      document.getElementById('cartCount').textContent = cart.length;
      document.getElementById('cartTotal').textContent = money(totals(cart).sub);
    };

    table.addEventListener('click', function (e) {
      var b = e.target.closest('button.add-btn');
      if (!b || b.disabled) return;
      var d = info(b.closest('tr')), cart = getCart();
      var idx = cart.findIndex(function (i) { return i.code === d.code; });
      if (idx > -1) cart.splice(idx, 1); else cart.push(d);
      save(CART_KEY, cart);
      refresh();
    });
    refresh();
  }

  /* ================= PAYMENT PAGE ================= */
  var list = document.getElementById('cartItems');
  if (list) {
    var promoPct = 0;
    var dl = document.getElementById('totals');

    var render = function () {
      var cart = getCart(), t = totals(cart, promoPct);
      document.body.classList.toggle('cart-empty', !cart.length);
      list.innerHTML = cart.length ? cart.map(function (i) {
        return '<li><span class="dot"></span><div><strong>' + esc(i.name) + '</strong><small>' +
               esc(i.code) + ' · ' + esc(i.cr) + ' credit hours</small></div><b>' + money(i.price) +
               '</b><button type="button" class="rm" data-code="' + esc(i.code) +
               '" aria-label="Remove ' + esc(i.name) + '">×</button></li>';
      }).join('') : '<li class="empty">Your cart is empty. <a href="course-list.html">Browse courses</a></li>';

      dl.innerHTML = '<div><dt>Subtotal</dt><dd>' + money(t.sub) + '</dd></div>' +
        (t.off ? '<div class="disc"><dt>' + t.label + ' −' + t.pct + '%</dt><dd>− ' + money(t.off) + '</dd></div>' : '') +
        '<div><dt>Service fee</dt><dd>Free</dd></div>' +
        '<div class="grand"><dt>Total</dt><dd>' + money(t.total) + '</dd></div>';

      [].forEach.call(document.querySelectorAll('.pay-amt'), function (el) { el.textContent = money(t.total); });
    };

    list.addEventListener('click', function (e) {
      var b = e.target.closest('.rm');
      if (!b) return;
      save(CART_KEY, getCart().filter(function (i) { return i.code !== b.dataset.code; }));
      render();
    });

    document.getElementById('promoApply').addEventListener('click', function () {
      var code = document.getElementById('promoInput').value.trim().toUpperCase();
      var msg = document.getElementById('promoMsg');
      if (PROMOS[code]) {
        promoPct = PROMOS[code];
        msg.textContent = 'Code applied: ' + PROMOS[code] + '% off (the bigger discount is used)';
        msg.className = 'promo-msg ok';
      } else {
        promoPct = 0;
        msg.textContent = code ? 'Invalid code' : '';
        msg.className = 'promo-msg bad';
      }
      render();
    });

    var placeOrder = function (e) {
      var items = getCart();
      if (!items.length) { if (e && e.preventDefault) e.preventDefault(); return; }
      var m = document.querySelector('.method-radio:checked').id.replace('m-', '');
      save(ORDER_KEY, {
        id: 'SP-' + String(Date.now()).slice(-5),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        method: { card: 'Card', fawry: 'Fawry', wallet: 'Mobile wallet', insta: 'InstaPay' }[m],
        items: items,
        total: totals(items, promoPct).total
      });
      try { localStorage.removeItem(CART_KEY); } catch (err) {}
    };

    [].forEach.call(document.querySelectorAll('form.method-panel'), function (f) {
      f.addEventListener('submit', placeOrder);
    });
    document.querySelector('.p-fawry .btn-pay').addEventListener('click', placeOrder);
    render();
  }

  /* ================= SUCCESS PAGE ================= */
  var oId = document.getElementById('oId');
  if (oId) {
    var o = load(ORDER_KEY);
    if (o) {
      document.getElementById('oAmount').textContent = money(o.total);
      oId.textContent = '#' + o.id;
      document.getElementById('oDate').textContent = o.date;
      document.getElementById('oMethod').textContent = o.method;
      document.getElementById('oCourses').innerHTML = o.items.map(function (i) {
        return '<li><span class="dot"></span>' + esc(i.name) + '</li>';
      }).join('');
    }
  }
})();