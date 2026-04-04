const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-msg");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const rememberMe = document.getElementById("remember-me").checked;

  loginMsg.textContent = "";

  if (!username || !password) {
    loginMsg.style.color = "#f28b82";
    loginMsg.textContent = "Username and password are required.";
    return;
  }

  if (username.length < 3) {
    loginMsg.style.color = "#f28b82";
    loginMsg.textContent = "Username must be at least 3 characters.";
    return;
  }

  try {
    const res = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password, rememberMe })
    });

    const data = await res.json();

    if (!res.ok) {
      loginMsg.style.color = "#f28b82";
      loginMsg.textContent = data.message || "Login failed.";
      return;
    }

    loginMsg.style.color = "#9ef18d";
    loginMsg.textContent = "Login successful! Redirecting...";

    setTimeout(() => {
      window.location.href = "profile.html";
    }, 1000);
  } catch (err) {
    console.error(err);
    loginMsg.style.color = "#f28b82";
    loginMsg.textContent = "Error connecting to server.";
  }
});