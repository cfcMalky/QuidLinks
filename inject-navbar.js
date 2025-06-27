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
    });
}); 