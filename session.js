/* session.js — remembers who logged in (localStorage) and shows the name.
   Load it on: login.html, student-dashboard.html, admin.html */
(function () {
  var KEY = 'sp_user';

  /* Known student IDs (same records as the admin page). Add more here. */
  var STUDENTS = {
    '20240123': 'Ahmed Hassan',
    '20240211': 'Sara Mahmoud',
    '20240318': 'Omar Khaled',
    '20240407': 'Mariam Ali'
  };

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save(u) { try { localStorage.setItem(KEY, JSON.stringify(u)); } catch (e) {} }

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

  /* ---- Login page: save the name, then go to the dashboard (no password in the URL) ---- */
  [].forEach.call(document.querySelectorAll('.login-form'), function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var role = form.classList.contains('form-admin') ? 'admin' : 'student';
      var name = nameFrom(form.querySelector('input[type="text"]').value, role);
      var first = /^(Student|Staff) /.test(name) ? name : name.split(' ')[0];
      save({ role: role, name: name, first: first });
      location.href = form.getAttribute('action');
    });
  });

  /* ---- Dashboards: replace every .user-name with the saved name ---- */
  var user = load();
  if (user) {
    [].forEach.call(document.querySelectorAll('.user-name'), function (el) {
      el.textContent = el.hasAttribute('data-full') ? user.name : user.first;
    });
  }

  /* ---- Logout link (admin sidebar) clears the saved name ---- */
  [].forEach.call(document.querySelectorAll('.sidebar a[href="login.html"]'), function (a) {
    a.addEventListener('click', function () { try { localStorage.removeItem(KEY); } catch (e) {} });
  });
})();
