fetch('/navbar.html')
  .then(response => response.text())
  .then(html => {
    const banner = document.querySelector('.site-banner');
    if (banner) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      banner.insertAdjacentElement('afterend', tempDiv.firstElementChild);
    }
  }); 