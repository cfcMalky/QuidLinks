document.addEventListener('DOMContentLoaded', function() {
  fetch('/pages/banner.html')
    .then(response => response.text())
    .then(html => {
      document.body.insertAdjacentHTML('afterbegin', html);
    });
}); 