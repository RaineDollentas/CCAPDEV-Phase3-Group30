document.addEventListener("DOMContentLoaded", () => {
  const likeButtons = document.querySelectorAll(".like-btn");

  likeButtons.forEach(btn => {
    const postId = btn.dataset.postId; 

    btn.addEventListener("click", async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/posts/${postId}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          
          body: JSON.stringify({ userId: JSON.parse(localStorage.getItem("loggedInUser"))._id })
        });

        const updatedPost = await res.json();

        // Update UI
        const upvoteCount = btn.parentElement.querySelector(".upvote-count");
        if (upvoteCount) upvoteCount.textContent = updatedPost.upvotes;

        if (updatedPost.likedByUser) {
          btn.classList.add("liked");
          btn.textContent = "▲ Liked";
        } else {
          btn.classList.remove("liked");
          btn.textContent = "△ Like";
        }

      } catch (err) {
        console.error("Error liking post:", err);
        alert("Failed to like post. Check console.");
      }
    });
  });
});