// inject-offer-video.js
document.addEventListener('DOMContentLoaded', function () {
  // Get the current offer slug from the URL
  const match = window.location.pathname.match(/\/offers\/([^\/]+)\//);
  if (!match) return;
  const slug = match[1];

  fetch('/data/offers_sheet.csv')
    .then(r => r.text())
    .then(csvText => {
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      // Find the row for this offer
      const row = parsed.data.find(row => 
        (row['File'] || '').replace(/.html$/i, '') === slug
      );
      if (!row || !row['YouTube Video']) return;
      // Extract video ID
      const youtubeUrl = row['YouTube Video'];
      const idMatch = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
      const videoId = idMatch ? idMatch[1] : youtubeUrl;
      // Build embed
      const videoHtml = `
        <div class="card offer-video-card">
          <div style="width:100%;margin:0 auto;position:relative;padding-bottom:56.25%;height:0;">
            <iframe src="https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0"
              title="YouTube video player" frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border-radius:12px;">
            </iframe>
          </div>
        </div>
      `;
      document.getElementById('offer-video').innerHTML = videoHtml;
    });
}); 