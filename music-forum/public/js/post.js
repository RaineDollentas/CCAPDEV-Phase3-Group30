document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("postId");
  const main = document.querySelector("main");

  let loggedInUser = null;
  try {
    const res = await fetch("/api/users/me", { credentials: 'include' });
    if (res.ok) loggedInUser = await res.json();
  } catch(err) { console.error(err); }

  let post = null;
  let comments = [];
  try {
    const res = await fetch(`/api/posts/${postId}`);
    if (res.ok) post = await res.json();
    else { main.innerHTML = "<p>Post not found.</p>"; return; }
  } catch(err) { console.error(err); main.innerHTML = "<p>Post not found.</p>"; return; }

  try {
    const res = await fetch(`/api/posts/${postId}/comments`);
    if (res.ok) comments = await res.json();
    console.log('Loaded comments for post', postId, comments);
  } catch(err) { console.error(err); }

  renderPost(post, comments, loggedInUser);

  // ----------------- POST RENDER -----------------
  function renderPost(post, comments, loggedInUser) {
    main.innerHTML = `
      <div class="post-card" id="post-card-${post.id}">
        <button id="back-button" class="back-button" aria-label="Back">←</button>
        <img src="${post.cover}" alt="${post.title}" class="album-cover">
        <h3>${post.title}</h3>
        <p>${post.body}</p>
        ${post.edited ? '<em>(edited)</em>' : ''}
        <small>
          by ${post.author && post.author.username ? post.author.username : 'Unknown'} | <span class="post-score">${post.score}</span>
          (△ <span class="upvote-count">${post.upvotes}</span> | ▽ <span class="downvote-count">${post.downvotes}</span>)
        </small>
        <div class="stars">${renderStars(post.rating)}</div>
        <br>
        <div class="post-actions-inline">
          <button class="upvote-post" data-post-id="${post.id}">△</button>
          <button class="downvote-post" data-post-id="${post.id}">▽</button>
        </div>
      </div>

      <h3>Comments</h3>
      <div id="comment-list"></div>

      ${loggedInUser ? `
        <form id="comment-form">
          <textarea id="comment-text" placeholder="Write a comment..." required></textarea>
          <button type="submit">Post Comment</button>
        </form>
      ` : `<p>Please log in to comment.</p>`}
    `;

    // back button handler
    const backBtn = document.getElementById('back-button');
    if (backBtn) backBtn.addEventListener('click', () => { history.back(); });

    if (loggedInUser && loggedInUser.id === post.author.id) renderPostActions(post.id);
    renderComments();
    setupPostVoting();
    setupCommentForm();
  }

  function renderStars(rating) {
    return [...Array(5)].map((_, i) => i < rating ? '★' : '☆').join('');
  }

  // ----------------- POST ACTIONS -----------------
  function renderPostActions(postId) {
    const postCard = document.querySelector(`#post-card-${postId}`);
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "post-actions";
    actionsDiv.innerHTML = `
      <button class="edit-post" data-id="${postId}">Edit</button>
      <button class="delete-post" data-id="${postId}">Delete</button>
    `;
    postCard.appendChild(actionsDiv);

  actionsDiv.querySelector(".edit-post").addEventListener("click", () => {
    const postCard = document.querySelector(`#post-card-${postId}`);
    if (!postCard) return;

    // replace title, body and stars with editable controls
    const titleEl = postCard.querySelector('h3');
    const bodyEl = postCard.querySelector('p');
    const starsEl = postCard.querySelector('.stars');

    const original = {
      titleHtml: titleEl ? titleEl.outerHTML : '',
      bodyHtml: bodyEl ? bodyEl.outerHTML : '',
      starsHtml: starsEl ? starsEl.outerHTML : ''
    };

    // create inputs
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'edit-title';
    titleInput.value = post.title || '';
    titleInput.style.width = '100%';
    titleInput.style.margin = '0.6rem 0';
    titleInput.style.padding = '0.6rem';

    const bodyTextarea = document.createElement('textarea');
    bodyTextarea.className = 'edit-body';
    bodyTextarea.value = post.body || '';
    bodyTextarea.style.width = '100%';
    bodyTextarea.style.minHeight = '120px';
    bodyTextarea.style.margin = '0.6rem 0';
    bodyTextarea.style.padding = '0.6rem';

    // rating control (clickable full stars only)
    let newRating = Number(post.rating) || 0;
    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'edit-stars';
    function renderEditStars() {
      ratingDiv.innerHTML = '';
      for (let i = 1; i <= 5; i++) {
        const s = document.createElement('span');
        s.className = 'edit-star';
        s.dataset.value = i;
        s.textContent = i <= newRating ? '★' : '☆';
        s.style.cursor = 'pointer';
        s.style.fontSize = '1.25rem';
        s.style.marginRight = '4px';
        s.addEventListener('click', () => { newRating = i; renderEditStars(); });
        ratingDiv.appendChild(s);
      }
    }
    renderEditStars();

    // replace nodes
    if (titleEl) titleEl.replaceWith(titleInput);
    if (bodyEl) bodyEl.replaceWith(bodyTextarea);
    if (starsEl) starsEl.replaceWith(ratingDiv);

    // swap actions to save/cancel
    actionsDiv.innerHTML = `
      <button class="save-post">Save</button>
      <button class="cancel-edit">Cancel</button>
      <button class="delete-post" data-id="${postId}">Delete</button>
    `;

    actionsDiv.querySelector('.cancel-edit').addEventListener('click', () => {
      // restore original view
      renderPost(post, comments, loggedInUser);
    });

    actionsDiv.querySelector('.save-post').addEventListener('click', async () => {
      const cleanTitle = (titleInput.value || '').trim();
      const cleanBody = (bodyTextarea.value || '').trim();
      const finalRating = Number(newRating) || 0;

      if (!cleanTitle || !cleanBody) { alert('Title and review are required.'); return; }
      if (cleanTitle.length < 3) { alert('Title must be at least 3 characters.'); return; }
      if (cleanTitle.length > 100) { alert('Title must be at most 100 characters.'); return; }
      if (cleanBody.length < 10) { alert('Review must be at least 10 characters.'); return; }
      if (cleanBody.length > 2000) { alert('Review must be at most 2000 characters.'); return; }
      if (Number.isNaN(finalRating) || finalRating < 0 || finalRating > 5) { alert('Rating must be between 0 and 5.'); return; }

      try {
        const res = await fetch(`/api/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title: cleanTitle, body: cleanBody, rating: finalRating })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { alert(data.message || 'Failed to update post.'); return; }
        post = { ...post, ...data };
        renderPost(post, comments, loggedInUser);
      } catch (err) {
        console.error(err);
        alert('Error saving post');
      }
    });

    // re-bind delete handler (in case user clicks delete while editing)
    const delBtn = actionsDiv.querySelector('.delete-post');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (!confirm('Delete this post?')) return;
        const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) main.innerHTML = '<p>Post deleted.</p>';
      });
    }
  });
    
    
  
 

    actionsDiv.querySelector(".delete-post").addEventListener("click", async () => {
      if (!confirm("Delete this post?")) return;
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) main.innerHTML = "<p>Post deleted.</p>";
    });
  }

  // ----------------- POST VOTING -----------------
  function setupPostVoting() {
    document.addEventListener('click', async e => {
      if (!loggedInUser) return;
      const t = e.target;
      if (!t.classList.contains('upvote-post') && !t.classList.contains('downvote-post')) return;

      const type = t.classList.contains('upvote-post') ? 'up' : 'down';
      const prevUp = post.upvotes || 0;
      const prevDown = post.downvotes || 0;
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        const data = await res.json(); // returns updated score/up/down counts
        post.upvotes = data.upvotes;
        post.downvotes = data.downvotes;
        post.score = data.score;
        document.querySelector('.upvote-count').textContent = post.upvotes;
        document.querySelector('.downvote-count').textContent = post.downvotes;
        document.querySelector('.post-score').textContent = post.score;
        // set button visuals: filled only if the count increased (vote set).
        const postCard = document.querySelector(`#post-card-${postId}`);
        if (postCard) {
          const upBtn = postCard.querySelector('.upvote-post');
          const downBtn = postCard.querySelector('.downvote-post');
          if (upBtn && downBtn) {
            if (type === 'up') {
              if (data.upvotes > prevUp) { upBtn.textContent = '▲'; downBtn.textContent = '▽'; }
              else { upBtn.textContent = '△'; downBtn.textContent = '▽'; }
            } else {
              if (data.downvotes > prevDown) { upBtn.textContent = '△'; downBtn.textContent = '▼'; }
              else { upBtn.textContent = '△'; downBtn.textContent = '▽'; }
            }
          }
        }
        // Refresh global posts list so homepage reflects updated votes
        try {
          const rAll = await fetch('/api/posts');
          if (rAll.ok) {
            posts = await rAll.json();
            try { window.dispatchEvent(new Event('dataChanged')); } catch (e) {}
          }
        } catch (err) {
          console.warn('Could not refresh posts after vote:', err);
        }
      }
    });
  }

  // ----------------- COMMENTS -----------------
  function renderComments() {
    const commentList = document.getElementById("comment-list");
    console.log('renderComments - current comments:', comments);
    commentList.innerHTML = '';

    function buildTree(all) {
      const map = new Map();
      all.forEach(c => map.set(c.id, { ...c, children: [] }));
      const roots = [];
      map.forEach(c => {
        if (!c.parentId) roots.push(c);
        else if (map.has(c.parentId)) map.get(c.parentId).children.push(c);
        else roots.push(c);
      });
      return roots.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
    }

    function renderNode(node, level=0) {
      const div = document.createElement('div');
      div.className = 'comment';
      div.style.marginLeft = `${level*20}px`;
      div.dataset.commentId = node.id;
      div.innerHTML = `
        <div class="comment-top">
          <strong>${node.author && node.author.username ? node.author.username : 'Unknown'}:</strong>
          <span class="comment-text">${node.text}</span>
          ${node.edited ? '<em style="margin-left:6px; display:inline-block;">(edited)</em>' : ''}
        </div>
        <div class="comment-actions">
          <button class="upvote-comment" data-id="${node.id}">△</button>
          <span class="comment-up">${node.upvotes || 0}</span>
          <button class="downvote-comment" data-id="${node.id}">▽</button>
          <span class="comment-down">${node.downvotes || 0}</span>
          ${loggedInUser && node.author && loggedInUser.id===node.author.id ? `<button class="edit-comment" data-id="${node.id}">Edit</button> <button class="delete-comment" data-id="${node.id}">Delete</button>` : ''}
          <button class="reply-comment" data-id="${node.id}">Reply</button>
        </div>
        <div class="reply-area"></div>
      `;
      commentList.appendChild(div);
      if (node.children) node.children.forEach(c=>renderNode(c, level+1));
    }

    buildTree(comments).forEach(r=>renderNode(r));
    setupCommentActions();
  }

  function setupCommentActions() {
    const commentList = document.getElementById("comment-list");
    if (!commentList) return;
    // avoid attaching multiple listeners when re-rendering
    if (commentList.dataset.clickBound === 'true') return;
    commentList.addEventListener('click', async e => {
      if (!loggedInUser) return;
      // normalize the clicked element to the nearest button if present
      let target = e.target;
      const btn = target.closest ? target.closest('button') : null;
      if (btn) target = btn;

      if (target.classList.contains('upvote-comment') || target.classList.contains('downvote-comment')) {
        const type = target.classList.contains('upvote-comment') ? 'up' : 'down';
        const cid = target.dataset.id;
        const res = await fetch(`/api/comments/${cid}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type })
        });
        if (res.ok) {
          // try to get updated counts from response
          const updated = await res.json().catch(() => null);
          const commentDiv = target.closest('.comment');
          if (commentDiv) {
            const upSpan = commentDiv.querySelector('.comment-up');
            const downSpan = commentDiv.querySelector('.comment-down');
            const upBtn = commentDiv.querySelector('.upvote-comment');
            const downBtn = commentDiv.querySelector('.downvote-comment');
            const prevUp = Number(upSpan ? upSpan.textContent : 0);
            const prevDown = Number(downSpan ? downSpan.textContent : 0);
            if (updated && typeof updated.upvotes !== 'undefined') {
              if (upSpan) upSpan.textContent = updated.upvotes;
              if (downSpan) downSpan.textContent = updated.downvotes;
            } else {
              // fallback: increment/decrement heuristically
              if (type === 'up') {
                if (upSpan) upSpan.textContent = prevUp + 1;
                if (downSpan) downSpan.textContent = Math.max(0, prevDown - 1);
              } else {
                if (downSpan) downSpan.textContent = prevDown + 1;
                if (upSpan) upSpan.textContent = Math.max(0, prevUp - 1);
              }
            }
            // set visual state: filled only if count increased
            const newUp = Number(upSpan ? upSpan.textContent : 0);
            const newDown = Number(downSpan ? downSpan.textContent : 0);
            if (upBtn && downBtn) {
              if (type === 'up') {
                if (newUp > prevUp) { upBtn.textContent = '▲'; downBtn.textContent = '▽'; }
                else { upBtn.textContent = '△'; downBtn.textContent = '▽'; }
              } else {
                if (newDown > prevDown) { upBtn.textContent = '△'; downBtn.textContent = '▼'; }
                else { upBtn.textContent = '△'; downBtn.textContent = '▽'; }
              }
            }
          }
        }
      }

      if (target.classList.contains('edit-comment')) {
        const commentDiv = target.closest('.comment');
        if (!commentDiv) return;
        // avoid adding multiple edit forms
        if (commentDiv.querySelector('.edit-form')) return;
        const cid = target.dataset.id;
        const c = comments.find(c=>c.id===cid);
        const textSpan = commentDiv.querySelector('.comment-text');
        if (!c) return;
        // hide text and show edit form
        if (textSpan) textSpan.style.display = 'none';
        const form = document.createElement('div');
        form.className = 'edit-form';
        form.innerHTML = `
          <textarea class="edit-text" style="width:100%;min-height:60px">${c.text}</textarea>
          <div style="margin-top:6px">
            <button class="save-edit" data-id="${cid}">Save</button>
            <button class="cancel-edit" data-id="${cid}">Cancel</button>
          </div>
        `;
        commentDiv.appendChild(form);
      }

      if (target.classList.contains('delete-comment')) {
        const cid = target.dataset.id;
        if (!confirm("Delete comment?")) return;
        const res = await fetch(`/api/comments/${cid}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
          comments = comments.filter(c=>c.id!==cid && c.parentId!==cid);
          renderComments();
        }
      }

      if (target.classList.contains('reply-comment')) {
        const commentDiv = target.closest('.comment');
        if (!commentDiv) return;
        const area = commentDiv.querySelector('.reply-area');
        if (!area) return;
        // avoid duplicate forms
        if (area.querySelector('.reply-form')) return;
        const form = document.createElement('div');
        form.className = 'reply-form';
        form.innerHTML = `
          <textarea class="reply-text" style="width:100%;min-height:60px" placeholder="Write a reply..."></textarea>
          <div style="margin-top:6px">
            <button class="post-reply" data-parent="${target.dataset.id}">Post</button>
            <button class="cancel-reply" data-parent="${target.dataset.id}">Cancel</button>
          </div>
        `;
        area.appendChild(form);
      }

      // Inline edit form actions
      if (target.classList.contains('save-edit')) {
        const id = target.dataset.id;
        const commentDiv = target.closest('.comment');
        const textarea = commentDiv.querySelector('.edit-text');
       const newText = textarea.value.trim();

        if (!newText) {
          return alert('Comment text is required.');
        }

        if (newText.length < 2) {
          return alert('Comment must be at least 2 characters.');
        }

        if (newText.length > 500) {
          return alert('Comment must be at most 500 characters.');
        }
        const res = await fetch(`/api/comments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ text: newText })
        });
        if (res.ok) {
          // update local copy
          const c = comments.find(c=>c.id===id);
          if (c) c.text = newText;
          renderComments();
        } else {
          const err = await res.json().catch(()=>({message:'Error'}));
          alert(err.message || 'Failed to update comment');
        }
      }

      if (target.classList.contains('cancel-edit')) {
        const commentDiv = target.closest('.comment');
        const textSpan = commentDiv.querySelector('.comment-text');
        const form = commentDiv.querySelector('.edit-form');
        if (form) form.remove();
        if (textSpan) textSpan.style.display = '';
      }

      // Reply form actions
      if (target.classList.contains('post-reply')) {
        const parentId = target.dataset.parent;
        const area = target.closest('.reply-form');
        const textarea = area.querySelector('.reply-text');
        const replyText = textarea.value.trim();

        if (!replyText) {
          return alert('Reply text is required.');
        }

        if (replyText.length < 2) {
          return alert('Reply must be at least 2 characters.');
        }

        if (replyText.length > 500) {
          return alert('Reply must be at most 500 characters.');
        }
        const res = await fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ text: replyText, parentId })
        });
        if (res.ok) {
          const newC = await res.json();
          comments.push(newC);
          renderComments();
        } else {
          const err = await res.json().catch(()=>({message:'Error'}));
          alert(err.message || 'Failed to post reply');
        }
      }

      if (target.classList.contains('cancel-reply')) {
        const area = target.closest('.reply-area');
        if (!area) return;
        const form = area.querySelector('.reply-form');
        if (form) form.remove();
      }
    });
    commentList.dataset.clickBound = 'true';
  }

  // ----------------- NEW COMMENT FORM -----------------
  function setupCommentForm() {
    if (!loggedInUser) return;
    const form = document.getElementById("comment-form");
    if (!form) return;
    if (form.dataset.submitBound === 'true') return;
   form.addEventListener("submit", async e => {
        e.preventDefault();

        const text = document.getElementById("comment-text").value.trim();

        if (!text) {
          alert("Comment text is required.");
          return;
        }

        if (text.length < 2) {
          alert("Comment must be at least 2 characters.");
          return;
        }

        if (text.length > 500) {
          alert("Comment must be at most 500 characters.");
          return;
        }

        const res = await fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ text })
        });

        if (res.ok) {
          const newC = await res.json();
          comments.push(newC);
          form.reset();
          renderComments();
        } else {
          const err = await res.json().catch(() => ({ message: 'Failed to post comment' }));
          alert(err.message || 'Failed to post comment');
        }
      });
    form.dataset.submitBound = 'true';
  }
});