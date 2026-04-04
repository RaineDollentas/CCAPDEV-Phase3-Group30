// nav.js

document.addEventListener("DOMContentLoaded", async () => {
  const loginLink = document.querySelector('nav a[href="login.html"]');
  const registerLink = document.querySelector('nav a[href="register.html"]');
  const createPostLink = document.querySelector('nav a[href="create-post.html"]');

  // Check logged-in status from backend
  let loggedInUser = null;
  try {
    const res = await fetch('/api/users/me', { credentials: 'include' }); 
    // 'credentials: include' ensures cookies/session is sent
    if (res.ok) {
      loggedInUser = await res.json(); 
    }
  } catch (err) {
    console.error('Error fetching user info:', err);
  }


  if (!loggedInUser) {
    try {
      const tmp = sessionStorage.getItem('recentUser');
      if (tmp) {
        loggedInUser = JSON.parse(tmp);
        // remove temporary flag; server session should take over shortly
        sessionStorage.removeItem('recentUser');
      }
    } catch (e) {}
  }

  if (loggedInUser) {
    // User is logged in
    loginLink.style.display = "none";
    registerLink.style.display = "none";
    createPostLink.style.display = "inline";

    // Add logout link
    let logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.textContent = "Logout";
    logoutLink.addEventListener("click", async () => {
      try {
        const res = await fetch('/api/users/logout', {
          method: 'POST',
          credentials: 'include'
        });
        if (res.ok) {
          // clear any client-side temp state and reload
          try { sessionStorage.removeItem('recentUser'); } catch (e) {}
          try { localStorage.removeItem('loggedInUser'); } catch (e) {}
          window.location.reload();
        } else {
          alert("Logout failed.");
        }
      } catch (err) {
        console.error("Logout error:", err);
      }
    });
    document.querySelector("nav").appendChild(logoutLink);
  } else {
    // User not logged in
    loginLink.style.display = "inline";
    registerLink.style.display = "inline";
    createPostLink.style.display = "none";
  }

  // Search form: redirect to index with query
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchInput.value.trim();
      if (!q) return;
      window.location.href = `index.html?search=${encodeURIComponent(q)}`;
    });
  }
});