const registerForm = document.getElementById("register-form");
const registerMsg = document.getElementById("register-msg");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("reg-username").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;

  registerMsg.textContent = "";

  if (!username || !email || !password) {
    registerMsg.style.color = "#f28b82";
    registerMsg.textContent = "Username, email, and password are required.";
    return;
  }

  if (username.length < 3) {
    registerMsg.style.color = "#f28b82";
    registerMsg.textContent = "Username must be at least 3 characters.";
    return;
  }

  if (username.length > 20) {
    registerMsg.style.color = "#f28b82";
    registerMsg.textContent = "Username must be at most 20 characters.";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    registerMsg.style.color = "#f28b82";
    registerMsg.textContent = "Please enter a valid email address.";
    return;
  }

  if (password.length < 6) {
    registerMsg.style.color = "#f28b82";
    registerMsg.textContent = "Password must be at least 6 characters.";
    return;
  }

  try {
    const res = await fetch("/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      registerMsg.style.color = "#f28b82";
      registerMsg.textContent = data.message || "Registration failed.";
      return;
    }

    registerMsg.style.color = "#9ef18d";
    registerMsg.textContent = "Registration successful! Redirecting...";

    setTimeout(() => {
      window.location.href = "profile.html";
    }, 1000);
  } catch (err) {
    console.error(err);
    registerMsg.style.color = "#f28b82";
    registerMsg.textContent = "Error connecting to server.";
  }
});