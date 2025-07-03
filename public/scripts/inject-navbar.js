// inject-navbar.js
// Fetches and injects the static navbar partial

document.addEventListener('DOMContentLoaded', function () {
  fetch('/partials/navbar.html')
    .then(r => r.text())
    .then(html => {
      const navbarDiv = document.getElementById('navbar');
      if (navbarDiv) navbarDiv.innerHTML = html;
    });
}); 