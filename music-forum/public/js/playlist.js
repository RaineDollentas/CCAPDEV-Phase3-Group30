document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const pid = params.get('pl');
  const root = document.getElementById('playlist-root');
  const backBtn = document.getElementById('back-button');
  if (backBtn) backBtn.addEventListener('click', () => history.back());

  function render(playlist) {
    if (!playlist) {
      root.innerHTML = '<p>Playlist not found.</p>';
      return;
    }
    const covers = playlist.covers || (playlist.songIndexes ? playlist.songIndexes.map(i => (window.songs && window.songs[i] ? window.songs[i].cover : null)).filter(Boolean) : []);
    const title = playlist.title || 'Playlist';
    const desc = playlist.description || '';

    let html = `
      <button id="back-button" class="back-button" title="Back" aria-label="Back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M15 18L9 12L15 6" stroke="#14181c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h2 style="text-align:left;">${title}</h2>
      <p style="color:#b8c2cc; margin-bottom:1rem;">${desc}</p>
      <div style="background:transparent; padding:0;">
        <table style="width:100%; border-collapse:collapse; color: #d8e0e8;">
          <thead>
            <tr style="text-align:left; color:#8fa3b8;">
              <th style="width:40px">#</th>
              <th>Title</th>
              <th>Album</th>
            </tr>
          </thead>
          <tbody>
    `;

    let indexes = [];
    if (playlist.songIndexes && Array.isArray(playlist.songIndexes)) {
      indexes = playlist.songIndexes.slice();
    } else if (playlist.songs && Array.isArray(playlist.songs) && window.songs && Array.isArray(window.songs)) {
      indexes = playlist.songs.map(s => {
        const idx = window.songs.findIndex(ss => String(ss.id) === String(s));
        return idx >= 0 ? idx : null;
      }).filter(v => v !== null);
    }

    if ((!window.songs || !Array.isArray(window.songs) || window.songs.length === 0) && indexes.length > 0) {
      html += `
        <tr>
          <td colspan="3" style="padding:18px 8px; color:#8fa3b8">Loading tracks…</td>
        </tr>
      `;
    } else {
      indexes.forEach((si, i) => {
        const s = (window.songs && typeof si === 'number' && si >= 0 && si < window.songs.length) ? window.songs[si] : null;
        const titleText = s ? s.title : 'Unknown';
        const albumText = s ? (s.album || s.albumTitle || '') : '';
      
        try { console.log('playlist row', i+1, 'songIndex=', si, 'album=', s && s.album, 'albumText=', albumText); } catch (e) {}
        const cover = s ? s.cover : '';
        html += `
          <tr style="border-top:1px solid rgba(255,255,255,0.03);">
            <td style="padding:10px 8px; vertical-align:middle">${i+1}</td>
            <td style="padding:10px 8px; vertical-align:middle">
              <div style="display:flex; gap:12px; align-items:center">
                <img src="${cover}" style="width:48px;height:48px;object-fit:cover;border-radius:4px">
                <div>
                  <div style="font-weight:700">${titleText}</div>
                  <div style="color:#8fa3b8; font-size:0.95rem">${s && s.artist ? s.artist : ''}</div>
                  <div style="color:#8fa3b8; font-size:0.85rem">${s && s.album ? s.album : ''}</div>
                </div>
              </div>
            </td>
            <td style="padding:10px 8px; vertical-align:middle;color:#b8c2cc">
              <div class="playlist-album">${albumText || '&nbsp;'}</div>
            </td>
          </tr>
        `;
      });
    }

    html += `</tbody></table></div>`;
    root.innerHTML = html;

    const newBack = document.getElementById('back-button');
    if (newBack) newBack.addEventListener('click', () => history.back());
  }

  function findAndRender() {
    const pl = window.getPlaylistById ? window.getPlaylistById(pid) : (window.playlists || []).find(p=>p.id===pid);
    if (pl) {
      render(pl);
    } else {
     
      const idx = Number(pid);
      if (!Number.isNaN(idx) && window.playlists && window.playlists[idx]) render(window.playlists[idx]);
      else render(null);
    }
  }


  findAndRender();

  window.addEventListener('dataChanged', findAndRender);
});
