
let users = [];
let songs = [];
let posts = [];
let comments = [];

// ---------- FETCH FUNCTIONS ----------

// Fetch users from backend
async function fetchUsers() {
  try {
    const res = await fetch('http://localhost:3000/api/users');
    users = await res.json();
    // Normalize users: ensure `id` and `username` exist in expected places
    users = users.map(u => ({
      ...u,
      id: String(u._id || u.id),
      username: u.username || u.name || u.userName
    }));
    console.log('Users loaded:', users.length);
  } catch (err) {
    console.error('Error fetching users:', err);
  }
}

// Fetch songs from backend
async function fetchSongs() {
  try {
    const res = await fetch('http://localhost:3000/api/songs');
    songs = await res.json();
    // Normalize song objects: ensure `id` and `cover` fields exist for frontend
    songs = songs.map(s => ({
      ...s,
      id: String(s._id || s.id),
      cover: s.albumCover || s.cover || s.albumCover
    }));
    console.log('Songs loaded:', songs.length);
  } catch (err) {
    console.error('Error fetching songs:', err);
  }
}

// Fetch posts from backend
async function fetchPosts() {
  try {
    const res = await fetch('http://localhost:3000/api/posts');
    posts = await res.json();

    // Normalize posts: add id, authorId and songId (strings) and fill missing cover
    posts = posts.map(p => {
      const np = { ...p };
      np.id = String(p._id || p.id);
      np.authorId = String(p.user || p.authorId || p.userId || '');
      // song may be stored as `song` ObjectId or populated object
      np.songId = (p.song && (p.song._id || p.song)) || p.songId || p.song;
      // ensure string form
      if (np.songId != null) np.songId = String(np.songId);
      if (np.authorId != null) np.authorId = String(np.authorId);

      if (!np.cover) {
        const s = songs.find(sg => String(sg.id) === String(np.songId) || String(sg._id) === String(np.songId));
        np.cover = s ? s.cover : (s && s.albumCover) || 'assets/covers/nirvana.jfif';
      }
      return np;
    });

    console.log('Posts loaded:', posts.length);
  } catch (err) {
    console.error('Error fetching posts:', err);
  }
}

// Fetch comments from backend
async function fetchComments() {
  try {
    const res = await fetch('http://localhost:3000/api/comments');
    comments = await res.json();
    console.log('Comments loaded:', comments.length);
  } catch (err) {
    console.error('Error fetching comments:', err);
  }
}

// ---------- INITIALIZE ALL DATA ----------

async function initData() {
  await fetchUsers();
  await fetchSongs();
  await fetchPosts();
  await fetchComments();

  // Trigger event for other scripts
  try {
    window.dispatchEvent(new Event('dataChanged'));
  } catch (e) {
    // ignore if not in browser
  }
}

// Run initialization
initData();