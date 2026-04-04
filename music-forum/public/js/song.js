// ---------- ELEMENTS ----------
const songInfoContainer = document.getElementById("song-info");
const reviewsContainer = document.getElementById("song-reviews");

// ---------- HELPER ----------
function renderStars(rating) {
  return [...Array(5)]
    .map((_, i) => (i < rating ? "★" : "☆"))
    .join("");
}

// ---------- GET SONG ID ----------
const urlParams = new URLSearchParams(window.location.search);
const songId = urlParams.get("songId");

// ---------- FETCH AND RENDER ----------
async function fetchSongAndReviews() {
  try {
    
    const loggedInUserRes = await fetch("/api/users/me");
    const loggedInUser = loggedInUserRes.ok ? await loggedInUserRes.json() : null;

    // Fetch song data
    const songRes = await fetch(`/api/songs/${songId}`);
    if (!songRes.ok) {
      songInfoContainer.innerHTML = "<p>Song not found.</p>";
      reviewsContainer.innerHTML = "";
      return;
    }
    const song = await songRes.json();

    // Fetch song reviews/posts
    const reviewsRes = await fetch(`/api/songs/${songId}/reviews`);
    const songPosts = reviewsRes.ok ? await reviewsRes.json() : [];

    // Compute average rating
    const avgRating = songPosts.length
      ? songPosts.reduce((sum, p) => sum + Number(p.rating || 0), 0) / songPosts.length
      : 0;

    // Render song info
    songInfoContainer.innerHTML = `
      <button id="back-button" class="back-button" aria-label="Back">←</button>
      <div class="song-info">
        <div class="song-left">
          <img src="${song.cover}" alt="${song.title}" class="album-cover">
          <h2>${song.title}</h2>
          <div class="stars">${renderStars(Math.round(avgRating))}</div>
          <div class="avg-num">${avgRating.toFixed(1)} / 5</div>
          <p class="review-count">${songPosts.length} review${songPosts.length !== 1 ? "s" : ""}</p>
        </div>

        <div class="song-right">
          <p><strong>Artist:</strong> ${song.artist}</p>
          <p class="description">${song.description}</p>
          <p><strong>Released:</strong> ${song.releaseDate}</p>
        </div>
      </div>
    `;

    // attach back handler
    const backBtn = document.getElementById('back-button');
    if (backBtn) backBtn.addEventListener('click', () => { history.back(); });

    // Render reviews
    reviewsContainer.innerHTML = "";
    if (songPosts.length === 0) {
      reviewsContainer.innerHTML = "<p>No reviews yet.</p>";
    } else {
      // sort by newest first
      songPosts
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .forEach((post) => {
          const reviewDiv = document.createElement("div");
          reviewDiv.className = "post-card";
          reviewDiv.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.body.length > 100 ? post.body.slice(0, 100) + "..." : post.body}</p>
            <small>by ${post.author.username || "Unknown"} | △ ${post.upvotes || 0}</small>
            <div class="stars">${renderStars(Number(post.rating) || 0)}</div>
            ${post.edited ? "<em>(edited)</em>" : ""}
            <br>
            <a href="post.html?postId=${post.id}">View Review</a>
          `;
          reviewsContainer.appendChild(reviewDiv);
        });
    }
  } catch (err) {
    console.error(err);
    songInfoContainer.innerHTML = "<p>Error loading song data.</p>";
    reviewsContainer.innerHTML = "";
  }
}

// Initial render
fetchSongAndReviews();

// Optional: listen to custom 'dataChanged' event to re-fetch
window.addEventListener("dataChanged", fetchSongAndReviews);