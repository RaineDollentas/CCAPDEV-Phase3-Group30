document.addEventListener('DOMContentLoaded', () => {
  const likeButtons = document.querySelectorAll('.like-btn');

  likeButtons.forEach(btn => {
    const postId = btn.dataset.postId;

    btn.addEventListener('click', async () => {
      try {
        btn.disabled = true;

        const wasLiked = btn.classList.contains('liked');

        const res = await fetch(`/api/posts/${postId}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin',
          body: JSON.stringify({ type: 'up' })
        });

        const updatedPost = await res.json();

        if (!res.ok) {
          throw new Error(updatedPost.message || 'Vote failed');
        }

        const upvoteCount = btn.parentElement.querySelector('.upvote-count');
        if (upvoteCount && typeof updatedPost.upvotes !== 'undefined') {
          upvoteCount.textContent = updatedPost.upvotes;
        }

        // Toggle button UI based on previous state
        if (wasLiked) {
          btn.classList.remove('liked');
          btn.textContent = '△ Like';
        } else {
          btn.classList.add('liked');
          btn.textContent = '▲ Liked';
        }
      } catch (err) {
        console.error('Error liking post:', err);
        alert('Failed to like post.');
      } finally {
        btn.disabled = false;
      }
    });
  });
});