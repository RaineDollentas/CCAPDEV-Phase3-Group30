// -------------------- BACKEND-FETCHED DATA --------------------
// Use shared `users`, `songs`, `posts`, `comments` from `data.js`.
// Wait for `data.js` to finish loading data and dispatch `dataChanged`.
window.addEventListener('dataChanged', () => {
  try {
    initPage();
  } catch (e) {
    console.error('Error initializing page after data change:', e);
  }
});

if (typeof posts !== 'undefined' && posts.length) {
  try { initPage(); } catch (e) { console.error(e); }
}

// -------------------- INIT PAGE --------------------
function initPage() {
  handleSearch();
  renderTrendingSongs();
  renderPopularPosts();
  renderRecentPosts();
  renderSidebarPlaylists();
  initBackgroundSlideshow();
  setupTrendingArrows();
}

// -------------------- UTILITY --------------------
function renderStars(rating) {
  return [...Array(5)].map((_, i) => i < rating ? '★' : '☆').join('');
}

function postScore(p) {
  if (typeof p.score === 'number') return p.score;
  if (p.upvotes != null && p.downvotes != null) return (p.upvotes - p.downvotes);
  return Object.values(p.votesBy || {}).reduce((s, v) => s + v, 0);
}

function getPostCounts(p) {
  if (p.upvotes != null && p.downvotes != null) return { up: Number(p.upvotes), down: Number(p.downvotes), score: Number(p.upvotes) - Number(p.downvotes) };
  if (p.votesBy) {
    const vals = Object.values(p.votesBy || {});
    const up = vals.filter(v => v === 1).length;
    const down = vals.filter(v => v === -1).length;
    return { up, down, score: up - down };
  }
  return { up: 0, down: 0, score: 0 };
}

// -------------------- SEARCH --------------------
function handleSearch() {
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = (urlParams.get('search') || '').trim();

  const trendingContainer = document.getElementById("trending-songs");
  const popularContainer = document.getElementById("popular-posts");
  const recentContainer = document.getElementById("recent-posts");

  if (!searchQuery) return; // skip if no search

  // clear existing sections
  trendingContainer.innerHTML = '';
  popularContainer.innerHTML = '';
  recentContainer.innerHTML = '';

  const main = document.querySelector('main');
  main.innerHTML = `<h2>Search results for "${searchQuery}"</h2><div id="search-results" class="results-grid"></div>`;
  const resultsContainer = document.getElementById('search-results');

  const q = searchQuery.toLowerCase();

  const matchingPosts = posts.filter(p => (p.title + ' ' + p.body).toLowerCase().includes(q));
  const matchingUsers = users.filter(u => (u.username + ' ' + (u.bio || '')).toLowerCase().includes(q));
  const matchingSongs = songs.filter(s => (s.title + ' ' + s.artist).toLowerCase().includes(q));

  if (matchingPosts.length === 0 && matchingSongs.length === 0 && matchingUsers.length === 0) {
    resultsContainer.innerHTML = '<p>No results found.</p>';
    return;
  }

  matchingSongs.forEach(song => {
    const songPosts = posts.filter(p => String(p.songId) === String(song.id));
    const avgRating = songPosts.length ? (songPosts.reduce((sum, p) => sum + Number(p.rating || 0), 0) / songPosts.length) : 0;
    const div = document.createElement('div');
    div.className = 'post-card';
    div.innerHTML = `
      <img src="${song.cover}" alt="${song.title}" class="album-cover">
      <h3>${song.title} - ${song.artist}</h3>
      <div class="stars">${renderStars(Math.round(avgRating))}</div>
      <small>${songPosts.length} review${songPosts.length !== 1 ? 's' : ''}</small>
      <br>
      <a href="song.html?songId=${song.id}">View Song</a>
    `;
    resultsContainer.appendChild(div);
  });

  matchingUsers.forEach(user => {
    const div = document.createElement('div');
    div.className = 'post-card';
    // determine avatar src
    let rawAvatar = (user.avatar || '').trim();
    let avatarSrc = '/assets/avatars/default.jpg';
    if (rawAvatar) {
      if (rawAvatar.startsWith('/') || rawAvatar.startsWith('http://') || rawAvatar.startsWith('https://')) avatarSrc = rawAvatar;
      else avatarSrc = `/assets/avatars/${rawAvatar}`;
    }
    div.innerHTML = `
      <img src="${avatarSrc}" alt="${user.username}" class="search-avatar" onerror="this.src='/assets/avatars/default.jpg'">
      <h3>${user.username}</h3>
      <p>${user.bio || ''}</p>
      <a href="profile.html?userId=${user.id}">View Profile</a>
    `;
    resultsContainer.appendChild(div);
  });

  matchingPosts.forEach(post => {
    const user = users.find(u => u.id === post.authorId) || { username: 'Unknown' };
    const div = document.createElement('div');
    div.className = 'post-card';
  const counts = getPostCounts(post);
  const upCount = counts.up;
  const downCount = counts.down;
    div.innerHTML = `
      <img src="${post.cover || ''}" alt="${post.title}" class="album-cover">
      <h3>${post.title}</h3>
      <p>${post.body.length > 100 ? post.body.slice(0, 100) + '...' : post.body}</p>
      <small>by ${user.username} | Score: ${postScore(post)} (△ ${upCount} | ▽ ${downCount})</small>
      <div class="stars">${renderStars(Number(post.rating) || 0)}</div>
      <br>
      <a href="post.html?postId=${post.id}">View Review</a>
    `;
    resultsContainer.appendChild(div);
  });
}

// -------------------- TRENDING SONGS --------------------
function renderTrendingSongs() {
  const trendingContainer = document.getElementById("trending-songs");
  if (!trendingContainer) return;

  const songsWithAvg = songs.map(song => {
    const songPosts = posts.filter(p => String(p.songId) === String(song.id));
    const avgRating = songPosts.length
      ? songPosts.reduce((sum, p) => sum + Number(p.rating || 0), 0) / songPosts.length
      : 0;
    return { ...song, avgRating, reviewCount: songPosts.length };
  });

  const trendingSongs = songsWithAvg.sort((a, b) => b.avgRating - a.avgRating).slice(0, 5);

  trendingSongs.forEach(song => {
    const div = document.createElement("div");
    div.className = "post-card";
    div.innerHTML = `
      <img src="${song.cover}" alt="${song.title}" class="album-cover">
      <h3>${song.title} - ${song.artist}</h3>
      <div class="stars">${renderStars(Math.round(song.avgRating))}</div>
      <small>${song.reviewCount} review${song.reviewCount !== 1 ? "s" : ""}</small>
      <br>
      <a href="song.html?songId=${song.id}">View Song Info</a>
    `;
    trendingContainer.appendChild(div);
  });
}

// -------------------- POPULAR POSTS --------------------
function renderPopularPosts() {
  const popularContainer = document.getElementById("popular-posts");
  if (!popularContainer) return;

  const popularPosts = [...posts].sort((a, b) => postScore(b) - postScore(a)).slice(0, 5);

  popularPosts.forEach(post => {
    const user = users.find(u => u.id === post.authorId) || { username: 'Unknown' };
    const div = document.createElement("div");
    div.className = "post-card";
  const counts = getPostCounts(post);
  const upCount = counts.up;
  const downCount = counts.down;
    div.innerHTML = `
      <img src="${post.cover}" alt="${post.title}" class="album-cover">
      <h3>${post.title}</h3>
      <p>${post.body.length > 100 ? post.body.slice(0, 100) + '...' : post.body}</p>
      <small>by ${user.username} | Score: ${postScore(post)} (△ ${upCount} | ▽ ${downCount})</small>
      <div class="stars">${renderStars(post.rating)}</div>
      ${post.edited ? "<em>(edited)</em>" : ""}
      <br>
      <a href="post.html?postId=${post.id}">View Review</a>
    `;
    popularContainer.appendChild(div);
  });
}

// -------------------- RECENT POSTS (Load More) --------------------
let postsPerPage = 15, currentIndex = 0;

function renderRecentPosts() {
  const recentContainer = document.getElementById("recent-posts");
  if (!recentContainer) return;

  const nextPosts = posts.slice(currentIndex, currentIndex + postsPerPage);
  nextPosts.forEach(post => {
    const user = users.find(u => u.id === post.authorId) || { username: 'Unknown' };
    const counts = getPostCounts(post);
    const upCount = counts.up;
    const downCount = counts.down;

    const div = document.createElement("div");
    div.className = "post-card";
    div.innerHTML = `
      <img src="${post.cover}" alt="${post.title}" class="album-cover">
      <div class="post-content">
        <h3>${post.title}</h3>
        <small>by ${user.username}</small>
        <p class="post-body">${post.body.length > 220 ? post.body.slice(0, 220) + '...' : post.body}</p>
        <div class="post-actions-row">
          <div class="post-meta"><span class="stars">${renderStars(post.rating)}</span> &nbsp; (${postScore(post)} | △ ${upCount} | ▽ ${downCount})</div>
          <a href="post.html?postId=${post.id}">View Review</a>
        </div>
      </div>
    `;
    recentContainer.appendChild(div);
  });

  currentIndex += postsPerPage;
  const loadMoreBtn = document.getElementById("load-more-btn");
  if (currentIndex >= posts.length && loadMoreBtn) loadMoreBtn.style.display = "none";
}

const loadMoreBtn = document.createElement("button");
loadMoreBtn.id = "load-more-btn";
loadMoreBtn.textContent = "Load More";
loadMoreBtn.style.display = "block";
loadMoreBtn.style.margin = "2rem auto";
loadMoreBtn.style.cursor = "pointer";
loadMoreBtn.addEventListener("click", renderRecentPosts);
document.getElementById("recent-posts")?.parentNode.appendChild(loadMoreBtn);

// -------------------- BACKGROUND SLIDESHOW --------------------
function initBackgroundSlideshow() {
  const bgSlideshow = document.getElementById('bg-slideshow');
  if (!bgSlideshow || !songs.length) return;

  const covers = songs.map(s => s.cover).filter(Boolean).slice(0, 8);
  if (!covers.length) return;

  covers.forEach((url, i) => {
    const slide = document.createElement('div');
    slide.className = 'bg-slide';
    slide.style.backgroundImage = `url("${url}")`;
    if (i === 0) slide.classList.add('active');
    bgSlideshow.appendChild(slide);
  });

  let current = 0;
  const slides = bgSlideshow.querySelectorAll('.bg-slide');
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 5000);
}

// -------------------- TRENDING / POPULAR SCROLL ARROWS --------------------
function setupTrendingArrows() {
  // trending arrows
  const trendingLeft = document.querySelector('.trending-arrow.left');
  const trendingRight = document.querySelector('.trending-arrow.right');
  const trendingContainer = document.getElementById('trending-songs');
  if (trendingContainer) {
    if (trendingLeft) trendingLeft.addEventListener('click', () => trendingContainer.scrollBy({ left: -300, behavior: 'smooth' }));
    if (trendingRight) trendingRight.addEventListener('click', () => trendingContainer.scrollBy({ left: 300, behavior: 'smooth' }));
  }

  // popular arrows (if present)
  const popularLeft = document.querySelector('.trending-arrow.left.popular-left');
  const popularRight = document.querySelector('.trending-arrow.right.popular-right');
  const popularContainer = document.getElementById('popular-posts');
  if (popularContainer) {
    if (popularLeft) popularLeft.addEventListener('click', () => popularContainer.scrollBy({ left: -300, behavior: 'smooth' }));
    if (popularRight) popularRight.addEventListener('click', () => popularContainer.scrollBy({ left: 300, behavior: 'smooth' }));
  }
}

// -------------------- SIDEBAR PLAYLISTS --------------------
function renderSidebarPlaylists() {
  const container = document.getElementById('sidebar-lists');
  if (!container) return;

  container.innerHTML = '';

  const playlists = [
    { title: 'Chill Guitar Moods', author: 'curator1', covers: songs.slice(0,4).map(s => s.cover) },
    { title: 'Classic Rock Essentials', author: 'curator2', covers: songs.slice(3,7).map(s => s.cover) },
    { title: 'Late Night Vibes', author: 'curator3', covers: songs.slice(5,9).map(s => s.cover) }
  ];

  playlists.forEach(pl => {
    const card = document.createElement('div');
    card.className = 'post-card';
    const collage = pl.covers.slice(0,4).map((c,i) => `<img src="${c}" class="playlist-thumb" style="left:${i*12}px;z-index:${10-i}">`).join('');
    card.innerHTML = `
      <div style="position:relative;height:60px;margin-bottom:0.6rem">${collage}</div>
      <h4 style="margin:0 0 0.25rem 0">${pl.title}</h4>
      <small>by ${pl.author} | ${pl.covers.length} tracks</small>
    `;
    container.appendChild(card);
  });
}
