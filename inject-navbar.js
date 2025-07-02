document.addEventListener('DOMContentLoaded', function() {
  fetch('/navbar.html')
    .then(response => response.text())
    .then(html => {
      let banner = document.querySelector('.site-banner');
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const navbar = tempDiv.firstElementChild;
      if (banner) {
        banner.insertAdjacentElement('afterend', navbar);
      } else {
        document.body.insertBefore(navbar, document.body.firstChild);
      }
      // Hamburger menu logic (after navbar is injected)
      setTimeout(function() {
        const nav = document.querySelector('.navbar');
        const hamburger = document.querySelector('.nav-hamburger');
        if (nav && hamburger) {
          hamburger.addEventListener('click', function() {
            nav.classList.toggle('open');
          });
        }
        // Set active class on nav button (only for category nav, not top nav)
        const navBtns = document.querySelectorAll('.brand-nav-btn');
        const path = window.location.pathname;
        navBtns.forEach(btn => {
          const href = btn.getAttribute('href');
          if (href && path.includes(href.replace('/offers/', '').replace('.html', ''))) {
            btn.classList.add('active');
          }
        });
        // Remove .active from top nav links if present
        const topNavLinks = document.querySelectorAll('.navbar > a, .navbar > button');
        topNavLinks.forEach(link => link.classList.remove('active'));
        // Dropdown click-to-toggle for mobile
        const navCategories = document.querySelectorAll('.nav-category');
        navCategories.forEach(cat => {
          const btn = cat.querySelector('.brand-nav-btn');
          if (btn) {
            btn.addEventListener('click', function(e) {
              e.stopPropagation();
              navCategories.forEach(c => { if (c !== cat) c.classList.remove('open'); });
              cat.classList.toggle('open');
            });
          }
        });
        document.addEventListener('click', () => {
          navCategories.forEach(cat => cat.classList.remove('open'));
        });
        // Bold the current brand in the dropdown
        const dropdownLinks = document.querySelectorAll('.navbar-link');
        dropdownLinks.forEach(link => {
          if (window.location.pathname === link.getAttribute('href')) {
            link.style.fontWeight = 'bold';
          }
        });
      }, 100);
    });
}); 