fetch('/banner.html')
  .then(response => response.text())
  .then(html => {
    const body = document.body;
    if (body) {
      body.insertAdjacentHTML('afterbegin', html);
    }
  }); 