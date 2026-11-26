/* admin-guard.js — put in the <head> of the ADMIN page (before everything else).
   If nobody logged in as admin, the page is hidden and the visitor is sent to the login page. */
(function () {
  var isAdmin = false;
  try { isAdmin = !!(JSON.parse(localStorage.getItem('sp_users')) || {}).admin; } catch (e) {}
  if (!isAdmin) {
    document.documentElement.style.display = 'none';   // nothing is shown while redirecting
    location.replace('login.html');
  }
})();