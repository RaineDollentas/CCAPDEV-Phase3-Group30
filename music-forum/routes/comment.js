const express = require('express');
const router = express.Router();
const Comment = require('../model/Comment');
const Post = require('../model/Post');

// GET all comments
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find().populate('user', 'username');
    const out = comments.map(c => {
      const counts = c.votesBy ? Array.from(c.votesBy.values()).reduce((acc, v) => { if (v===1) acc.up++; else if (v===-1) acc.down++; return acc; }, {up:0, down:0}) : {up:0, down:0};
      return { id: String(c._id), 
        text: c.body, 
        author: c.user ? { id: String(c.user._id), 
          username: c.user.username } : null, 
          postId: String(c.post), 
          parentId: c.parent ? String(c.parent) : null,
          edited: c.edited || false, 
          upvotes: counts.up, 
          downvotes: counts.down, 
          score: counts.up - counts.down, 
          createdAt: c.createdAt };
    });
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET comments for a specific post
router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId }).populate('user', 'username');
    const out2 = comments.map(c => {
      const counts = c.votesBy ? Array.from(c.votesBy.values()).reduce((acc, v) => { if (v===1) acc.up++; else if (v===-1) acc.down++; return acc; }, {up:0, down:0}) : {up:0, down:0};
      return { id: String(c._id), text: c.body, 
        author: c.user ? { id: String(c.user._id), 
          username: c.user.username } : null, 
          postId: String(c.post), 
          parentId: c.parent ? String(c.parent) : null, 
          edited: c.edited || false,
          upvotes: counts.up, 
          downvotes: counts.down, 
          score: counts.up - counts.down, 
          createdAt: c.createdAt };
    });
    res.json(out2);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create a comment under a post
router.post('/post/:postId', async (req, res) => {
  try {
    const userId = req.session && req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const { text, parentId } = req.body;
    const cleanText = (text || '').trim();

    if (!cleanText) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    if (cleanText.length < 2) {
      return res.status(400).json({ message: 'Comment must be at least 2 characters.' });
    }

    if (cleanText.length > 500) {
      return res.status(400).json({ message: 'Comment must be at most 500 characters.' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = new Comment({
      post: post._id,
      user: userId,
      body: cleanText
    });

    if (parentId) comment.parent = parentId;

    const saved = await comment.save();
    const populated = await Comment.findById(saved._id).populate('user', 'username');

    const counts2 = populated.votesBy
      ? Array.from(populated.votesBy.values()).reduce((acc, v) => {
          if (v === 1) acc.up++;
          else if (v === -1) acc.down++;
          return acc;
        }, { up: 0, down: 0 })
      : { up: 0, down: 0 };

    res.status(201).json({
      id: String(populated._id),
      text: populated.body,
      author: populated.user
        ? { id: String(populated.user._id), username: populated.user.username }
        : null,
      parentId: populated.parent ? String(populated.parent) : null,
      edited: populated.edited || false,
      upvotes: counts2.up,
      downvotes: counts2.down,
      score: counts2.up - counts2.down,
      createdAt: populated.createdAt
    });
  } catch (err) {
    console.error('Create comment (post) error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a vote on a comment
router.post('/:id/vote', async (req, res) => {
  try {
    const userId = req.session && req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    const { type } = req.body; // 'up' or 'down'
    if (!['up','down'].includes(type)) return res.status(400).json({ message: 'Invalid vote type' });
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const current = comment.votesBy.get(userId) || 0;
    const value = type === 'up' ? 1 : -1;
    if (current === value) {
      comment.votesBy.delete(userId);
    } else {
      comment.votesBy.set(userId, value);
    }
    await comment.save();
    const counts = Array.from(comment.votesBy.values()).reduce((acc, v) => { if (v===1) acc.up++; else if (v===-1) acc.down++; return acc; }, {up:0, down:0});
    const score = counts.up - counts.down;
    res.json({ upvotes: counts.up, downvotes: counts.down, score });
  } catch (err) {
    console.error('Comment vote error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single comment by id
router.get('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate('user', 'username');
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    return res.json({ id: String(comment._id), 
      text: comment.body, 
      author: comment.user ? { id: String(comment.user._id), 
        username: comment.user.username } : null, 
        parentId: comment.parent || null, 
        edited: comment.edited || false,
        createdAt: comment.createdAt });
  } catch (err) {
    console.error('Get comment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update a comment (edit)
router.put('/:id', async (req, res) => {
  try {
    const userId = req.session && req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const { text } = req.body;
    const cleanText = (text || '').trim();

    if (!cleanText) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    if (cleanText.length < 2) {
      return res.status(400).json({ message: 'Comment must be at least 2 characters.' });
    }

    if (cleanText.length > 500) {
      return res.status(400).json({ message: 'Comment must be at most 500 characters.' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (String(comment.user) !== String(userId)) return res.status(403).json({ message: 'Forbidden' });

    comment.body = cleanText;
    comment.edited = true;
    await comment.save();

    const populated = await Comment.findById(comment._id).populate('user', 'username');

    return res.json({
      id: String(populated._id),
      text: populated.body,
      author: populated.user
        ? { id: String(populated.user._id), username: populated.user.username }
        : null,
      parentId: populated.parent || null,
      edited: populated.edited || false,
      createdAt: populated.createdAt
    });
  } catch (err) {
    console.error('Edit comment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE a comment (and its direct replies)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.session && req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (String(comment.user) !== String(userId)) return res.status(403).json({ message: 'Forbidden' });
    // remove the comment and any direct children (replies)
    await Comment.deleteMany({ $or: [ { _id: comment._id }, { parent: comment._id } ] });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
