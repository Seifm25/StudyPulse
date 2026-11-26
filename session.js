/* session.js — remembers who logged in (localStorage), one name per role.
   Student name -> student pages only. Admin name -> admin page only.
   Load it on: login.html, student-dashboard.html, admin.html */
(function () {
  var KEY = 'sp_users';

  /* Password for the Admin tab (change it!). It is visible in this file, so it is only a demo gate. */
  var ADMIN_PASSWORD = 'admin123';
   // { student: {name, first}, admin: {name, first}, last: 'student' | 'admin' }

  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function write(u) { try { localStorage.setItem(KEY, JSON.stringify(u)); } catch (e) {} }

  /* "ahmed.hassan@x.edu" -> "Ahmed Hassan" */
  function pretty(s) {
    return s.split(/[._\-\s]+/).filter(Boolean).map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
  }

  /* Shows exactly what was typed (ID or name). Only an email is turned into a readable name. */
  function nameFrom(value) {
    var v = value.trim();
    return v.indexOf('@') > 0 ? pretty(v.split('@')[0]) : v;
  }

  var file = (location.pathname.split('/').pop() || '').toLowerCase();
  var isAdminPage = document.body.classList.contains('admin') || file.indexOf('admin') === 0;

  /* ---- Login page: save the name under ITS role, then open that role's page ---- */
  [].forEach.call(document.querySelectorAll('.login-form'), function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var role = (form.classList.contains('form-admin') || form.querySelector('#admin-email')) ? 'admin' : 'student';
      if (role === 'admin') {
        var pass = form.querySelector('input[type="password"]').value;
        var err = form.querySelector('.login-error');
        if (!err) {
          err = document.createElement('p');
          err.className = 'login-error';
          err.style.cssText = 'color:#C0201F;font-size:.8rem;font-weight:600;';
          form.insertBefore(err, form.querySelector('button[type="submit"]'));
        }
        if (pass !== ADMIN_PASSWORD) { err.textContent = 'Wrong admin password.'; return; }
        err.textContent = '';
      }
      var typed = form.querySelector('input[type="text"]').value;
      var name = nameFrom(typed);
      var first = typed.indexOf('@') > 0 ? name.split(' ')[0] : name;

      var users = read();
      users[role] = { name: name, first: first };
      users.last = role;
      write(users);
      try { localStorage.removeItem('sp_user'); } catch (err) {}   // old single-name key

      var action = form.getAttribute('action') || '';
      location.href = role === 'admin'
        ? (action.indexOf('admin') > -1 ? action : 'admin.html')
        : (action.indexOf('student') > -1 ? action : 'student-dashboard.html');
    });
  });

  /* ---- Dashboards: each page only uses ITS role's name ---- */
  var who = read()[isAdminPage ? 'admin' : 'student'];
  if (who) {
    [].forEach.call(document.querySelectorAll('.user-name'), function (el) {
      el.textContent = el.hasAttribute('data-full') ? who.name : who.first;
    });

    /* Admin page: no HTML edits needed, the name is swapped automatically */
    if (isAdminPage) {
      var tu = document.querySelector('.topbar .user');
      if (tu) {
        [].slice.call(tu.childNodes).forEach(function (n) { if (n.nodeType === 3) tu.removeChild(n); });
        tu.appendChild(document.createTextNode(who.name));
      }
      var h = document.querySelector('.sidebar h3');
      if (h) {
        h.textContent = '';
        h.appendChild(document.createTextNode('Welcome,'));
        h.appendChild(document.createElement('br'));
        h.appendChild(document.createTextNode(who.first + '!'));
      }
    }
  }

  /* ---- Hide the Admin links from everyone who is not logged in as admin ---- */
  if (!read().admin) {
    [].forEach.call(document.querySelectorAll('a[href^="admin"]'), function (a) {
      if (!a.classList.contains('go-btn')) a.style.display = 'none';
    });
  }

  /* ---- Logout link (admin sidebar) clears the ADMIN name only ---- */
  [].forEach.call(document.querySelectorAll('.sidebar a[href="login.html"]'), function (a) {
    a.addEventListener('click', function () {
      var users = read();
      delete users.admin;
      if (users.last === 'admin') delete users.last;
      write(users);
    });
  });
})();
