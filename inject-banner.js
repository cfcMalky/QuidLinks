document.addEventListener('DOMContentLoaded', function() {
  fetch('/banner.html')
    .then(response => response.text())
    .then(html => {
      document.body.insertAdjacentHTML('afterbegin', html);
    });
}); 