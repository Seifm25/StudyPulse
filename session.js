/* session.js — remembers who logged in (localStorage), one name per role.
   Student name -> student pages only. Admin name -> admin page only.
   Load it on: login.html, student-dashboard.html, admin.html */
(function () {
  var KEY = 'sp_users';   // { student: {name, first}, admin: {name, first}, last: 'student' | 'admin' }

  /* Known student IDs (same records as the admin page). Add more here. */
  var STUDENTS = {
    '20240123': 'Ahmed Hassan',
    '20240211': 'Sara Mahmoud',
    '20240318': 'Omar Khaled',
    '20240407': 'Mariam Ali'
  };

  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function write(u) { try { localStorage.setItem(KEY, JSON.stringify(u)); } catch (e) {} }

  /* "ahmed.hassan@x.edu" -> "Ahmed Hassan" */
  function pretty(s) {
    return s.split(/[._\-\s]+/).filter(Boolean).map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
  }

  function nameFrom(value, role) {
    var v = value.trim();
    if (v.indexOf('@') > 0) return pretty(v.split('@')[0]);
    if (STUDENTS[v]) return STUDENTS[v];
    if (/^\d+$/.test(v)) return (role === 'admin' ? 'Staff ' : 'Student ') + v;
    return pretty(v);
  }

  var file = (location.pathname.split('/').pop() || '').toLowerCase();
  var isAdminPage = document.body.classList.contains('admin') || file.indexOf('admin') === 0;

  /* ---- Login page: save the name under ITS role, then open that role's page ---- */
  [].forEach.call(document.querySelectorAll('.login-form'), function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var role = (form.classList.contains('form-admin') || form.querySelector('#admin-email')) ? 'admin' : 'student';
      var name = nameFrom(form.querySelector('input[type="text"]').value, role);
      var first = /^(Student|Staff) /.test(name) ? name : name.split(' ')[0];

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