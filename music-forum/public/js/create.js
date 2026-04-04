const form = document.getElementById("new-post-form");

async function fetchSongs() {
  try {
    const res = await fetch("/api/songs");
    const songs = await res.json();

    const sel = document.getElementById("post-song");
    if (sel && Array.isArray(songs)) {
      songs.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s._id || s.id || "";
        opt.textContent = `${s.title} — ${s.artist}`;
        sel.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("Error fetching songs:", err);
  }
}

document.addEventListener("DOMContentLoaded", fetchSongs);

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const title = document.getElementById("post-title").value.trim();
  const body = document.getElementById("post-body").value.trim();
  const songIdVal = document.getElementById("post-song")?.value || "";
  const ratingVal = Number(document.getElementById("post-rating")?.value || 0);

  if (!title || !body) {
    alert("Title and review are required.");
    return;
  }

  if (title.length < 3) {
    alert("Title must be at least 3 characters.");
    return;
  }

  if (title.length > 100) {
    alert("Title must be at most 100 characters.");
    return;
  }

  if (body.length < 10) {
    alert("Review must be at least 10 characters.");
    return;
  }

  if (body.length > 2000) {
    alert("Review must be at most 2000 characters.");
    return;
  }

  if (Number.isNaN(ratingVal) || ratingVal < 0 || ratingVal > 5) {
    alert("Rating must be between 0 and 5.");
    return;
  }

  try {
    const meRes = await fetch("/api/users/me", { credentials: "include" });
    if (!meRes.ok) {
      alert("You must be logged in to post.");
      return;
    }

    const newPost = {
      title,
      body,
      rating: ratingVal,
      songId: songIdVal || null
    };

    const res = await fetch("/api/posts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost)
    });

    const createdPost = await res.json();

    if (!res.ok) {
      alert(createdPost.message || "Failed to create post");
      return;
    }

    alert("Post created!");
    window.location.href = `post.html?postId=${createdPost.id}`;
  } catch (err) {
    console.error("Error creating post:", err);
    alert("Failed to create post. Check console.");
  }
});