document.addEventListener("DOMContentLoaded", async () => {
  const main = document.querySelector("main");

  let loggedInUser = null;
  try {
    const res = await fetch("/api/users/me", { credentials: "include" });
    if (res.ok) loggedInUser = await res.json();
  } catch (err) {
    console.error(err);
  }

  const urlParams = new URLSearchParams(window.location.search);
  const viewUserId = urlParams.get("userId");

  let profileUser = null;
  try {
    if (viewUserId) {
      const res = await fetch(`/api/users/${viewUserId}`);
      if (!res.ok) {
        main.innerHTML = "<p>User not found.</p>";
        return;
      }
      profileUser = await res.json();
    } else {
      if (!loggedInUser) {
        main.innerHTML = "<p>Please login first to view your profile.</p>";
        return;
      }
      profileUser = loggedInUser;
    }
  } catch (err) {
    console.error(err);
    main.innerHTML = "<p>Error loading profile.</p>";
    return;
  }

  // fetch posts by user
  let userPosts = [];
  try {
    const res = await fetch(`/api/users/${profileUser.id}/posts`);
    if (res.ok) userPosts = await res.json();
  } catch (err) {
    console.error(err);
  }

  // fetch comments by user
  let userComments = [];
  try {
    const res = await fetch(`/api/users/${profileUser.id}/comments`);
    if (res.ok) userComments = await res.json();
  } catch (err) {
    console.error(err);
  }

  renderProfile(profileUser, loggedInUser, userPosts, userComments);

  function getAvatarSrc(user) {
    const rawAvatar = (user.avatar || "").trim();

    if (!rawAvatar) {
      return "/assets/avatars/default.jpg";
    }

    if (
      rawAvatar.startsWith("/") ||
      rawAvatar.startsWith("http://") ||
      rawAvatar.startsWith("https://")
    ) {
      return rawAvatar;
    }

    return `/assets/avatars/${rawAvatar}`;
  }

  function renderProfile(profileUser, loggedInUser, userPosts, userComments) {
  const canEdit = loggedInUser && loggedInUser.id === profileUser.id;
  const avatarSrc = getAvatarSrc(profileUser);
  const safeBio = profileUser.bio || "";
  const safeUsername = profileUser.username || "";

  const visiblePosts = userPosts.slice(0, 3);
  const visibleComments = userComments.slice(0, 3);

  main.innerHTML = `
    <div class="profile-header">
      <div class="profile-top">
        <img 
          src="${avatarSrc}" 
          width="120" 
          class="profile-avatar" 
          alt="Avatar"
          onerror="this.src='/assets/avatars/default.jpg'"
        >
        <div class="profile-meta">
          <h2 id="profile-username">${safeUsername}</h2>
          <p id="profile-bio">${safeBio}</p>
          <div id="follow-stats" style="margin-top:0.5rem; color:#b8c2cc">
            <span id="follower-count">${profileUser.followerCount || 0} followers</span>
            &nbsp;·&nbsp;
            <span id="following-count">${profileUser.followingCount || 0} following</span>
          </div>
          ${canEdit ? '<button id="edit-profile">Edit Profile</button>' : ''}
          ${(!canEdit && loggedInUser) ? '<button id="follow-btn" style="margin-top:0.5rem"></button>' : ''}
        </div>
      </div>
    </div>

    <h2>Latest Posts</h2>
    <div id="user-posts" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap:1.5rem;">
      ${
        visiblePosts.length === 0
          ? "<p>No posts yet.</p>"
          : visiblePosts.map(post => `
              <div class="post-card">
                <img src="${post.cover}" alt="${post.title}" class="album-cover">
                <h3>${post.title}</h3>
                <p>${post.body}</p>
                ${post.edited ? '<em>(edited)</em>' : ''}
                <small>Score: ${post.score}</small>
                <div class="stars">${[...Array(5)].map((_, i) => i < post.rating ? "★" : "☆").join("")}</div>
                <a href="post.html?postId=${post.id}">View Post</a>
              </div>
            `).join("")
      }
    </div>

    ${userPosts.length > 3 ? '<button id="show-all-posts" style="margin-top:1rem;">Show All Posts</button>' : ''}

    <h2 style="margin-top:2rem;">Latest Comments</h2>
    <div id="user-comments">
      ${
        visibleComments.length === 0
          ? "<p>No comments yet.</p>"
          : visibleComments.map(comment => `
              <div class="comment">
                <p>${comment.text}</p>
                <small>
                  on <a href="post.html?postId=${comment.postId}">${comment.postTitle}</a>
                </small>
              </div>
            `).join("")
      }
    </div>

    ${userComments.length > 3 ? '<button id="show-all-comments" style="margin-top:1rem;">Show All Comments</button>' : ''}
  `;

  if (canEdit) setupEditProfile(profileUser);

  // Setup follow button if present
  const followBtn = document.getElementById('follow-btn');
if (followBtn) {
  const isFollowing =
    loggedInUser &&
    Array.isArray(loggedInUser.following) &&
    loggedInUser.following.includes(profileUser.id);

  followBtn.textContent = isFollowing ? 'Unfollow' : 'Follow';

  followBtn.addEventListener('click', async () => {
    try {
      followBtn.disabled = true;

      const res = await fetch(`/api/users/${profileUser.id}/follow`, {
        method: 'POST',
        credentials: 'include'
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(payload.message || 'Failed to update follow status');
        followBtn.disabled = false;
        return;
      }

      // update ONLY the viewed profile's follower count
      const followerCountEl = document.getElementById('follower-count');
      if (payload.followerCount !== undefined) {
        followerCountEl.textContent = `${payload.followerCount} followers`;
        profileUser.followerCount = payload.followerCount;
      }

      // update local logged-in user's following list only for button state
      if (loggedInUser) {
        loggedInUser.following = loggedInUser.following || [];

        if (payload.following) {
          if (!loggedInUser.following.includes(profileUser.id)) {
            loggedInUser.following.push(profileUser.id);
          }
          followBtn.textContent = 'Unfollow';
        } else {
          loggedInUser.following = loggedInUser.following.filter(
            id => id !== profileUser.id
          );
          followBtn.textContent = 'Follow';
        }
      }

      followBtn.disabled = false;
    } catch (err) {
      console.error(err);
      followBtn.disabled = false;
    }
  });
}

  const showAllPostsBtn = document.getElementById("show-all-posts");
  if (showAllPostsBtn) {
    showAllPostsBtn.addEventListener("click", () => {
      const postsContainer = document.getElementById("user-posts");
      postsContainer.innerHTML = userPosts.map(post => `
        <div class="post-card">
          <img src="${post.cover}" alt="${post.title}" class="album-cover">
          <h3>${post.title}</h3>
          <p>${post.body}</p>
          ${post.edited ? '<em>(edited)</em>' : ''}
          <small>Score: ${post.score}</small>
          <div class="stars">${[...Array(5)].map((_, i) => i < post.rating ? "★" : "☆").join("")}</div>
          <a href="post.html?postId=${post.id}">View Post</a>
        </div>
      `).join("");
      showAllPostsBtn.remove();
    });
  }

  const showAllCommentsBtn = document.getElementById("show-all-comments");
  if (showAllCommentsBtn) {
    showAllCommentsBtn.addEventListener("click", () => {
      const commentsContainer = document.getElementById("user-comments");
      commentsContainer.innerHTML = userComments.map(comment => `
        <div class="comment">
          <p>${comment.text}</p>
          <small>
            on <a href="post.html?postId=${comment.postId}">${comment.postTitle}</a>
          </small>
        </div>
      `).join("");
      showAllCommentsBtn.remove();
    });
  }
}

  function setupEditProfile(profileUser) {
    const editBtn = document.getElementById("edit-profile");
    if (!editBtn) return;

    editBtn.addEventListener("click", () => {
      const meta = document.querySelector(".profile-meta");
      meta.innerHTML = `
        <label>Username: <input id="edit-username" value="${profileUser.username || ""}"></label>
        <label>Bio: <textarea id="edit-bio">${profileUser.bio || ""}</textarea></label>
        <label>Avatar path or filename: <input id="edit-avatar" value="${profileUser.avatar || ""}"></label>
        <div style="margin-top:0.5rem">
          <button id="save-profile">Save</button>
          <button id="cancel-profile">Cancel</button>
        </div>
      `;

      document.getElementById("cancel-profile").addEventListener("click", () => {
        renderProfile(profileUser, loggedInUser, userPosts, userComments);
      });

      document.getElementById("save-profile").addEventListener("click", async () => {
        const newName = document.getElementById("edit-username").value.trim();
        const newBio = document.getElementById("edit-bio").value.trim();
        const newAvatar = document.getElementById("edit-avatar").value.trim();

        if (!newName) {
          alert("Username cannot be empty");
          return;
        }

        try {
          const res = await fetch(`/api/users/${profileUser.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              username: newName,
              bio: newBio,
              avatar: newAvatar
            })
          });

          const updatedPayload = await res.json().catch(() => ({}));

          if (!res.ok) {
            alert(updatedPayload.message || "Failed to update profile.");
            return;
          }

          const updatedUser = updatedPayload.user || updatedPayload;

          profileUser = updatedUser;

          if (loggedInUser && loggedInUser.id === updatedUser.id) {
            loggedInUser = updatedUser;
          }

          renderProfile(profileUser, loggedInUser, userPosts, userComments);
        } catch (err) {
          console.error(err);
          alert("Error updating profile");
        }
      });
    });
  }
});