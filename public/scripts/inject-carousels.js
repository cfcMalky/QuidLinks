// inject-carousels.js
// Fetches and injects the static carousels partial

// Add this script to your index.html: <script src="inject-carousels.js"></script>
// Make sure you have a <div id="carousels"></div> in your HTML

console.log("inject-carousels.js loaded");

document.addEventListener('DOMContentLoaded', function () {
  fetch('/partials/carousels.html')
    .then(r => r.text())
    .then(html => {
      const carouselsDiv = document.getElementById('carousels');
      if (carouselsDiv) carouselsDiv.innerHTML = html;
    });
}); 