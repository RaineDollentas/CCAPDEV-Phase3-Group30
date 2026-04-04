const express = require('express');
const router = express.Router();
const Post = require('../model/Post'); 
const Song = require('../model/Song');
const Comment = require('../model/Comment');
const User = require('../model/User');

// GET all posts (normalized for frontend)
router.get('/', async (req, res) => {
  try {
    const raw = await Post.find().sort({ createdAt: -1 }).populate('user', 'username'); // newest first
    const posts = await Promise.all(raw.map(async p => {
      let cover = p.cover || null;
      if (!cover && p.song) {
        try {
          const song = await Song.findById(p.song);
          if (song) cover = song.albumCover || song.cover || null;
        } catch (e) {}
      }
        const counts = p.votesBy ? Array.from(p.votesBy.values()).reduce((acc, v) => { if (v===1) acc.up++; else if (v===-1) acc.down++; return acc; }, {up:0, down:0}) : {up:0, down:0};
        const score = counts.up - counts.down;
        return {
          id: String(p._id),
          title: p.title,
          body: p.body,
          cover,
          rating: p.rating || 0,
          edited: p.edited || false,
          authorId: p.user ? String(p.user._id) : null,
          songId: p.song ? String(p.song._id || p.song) : null,
          authorUsername: p.user ? p.user.username : null,
          upvotes: counts.up,
          downvotes: counts.down,
          score,
          createdAt: p.createdAt
        };
    }));
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET comments for a specific post (used by frontend at /api/posts/:id/comments)
router.get('/:id/comments', async (req, res) => {
  try {
    console.log('GET comments for post', req.params.id);
    const comments = await Comment.find({ post: req.params.id }).populate('user', 'username');
    console.log(`Found ${comments.length} comments for post ${req.params.id}`);
    comments.forEach(c => console.log(' - comment', String(c._id), 'parent:', String(c.parent)));
    // map to frontend shape: id, text/body, author
    const out = comments.map(c => {
      const counts = c.votesBy ? Array.from(c.votesBy.values()).reduce((acc, v) => { if (v===1) acc.up++; else if (v===-1) acc.down++; return acc; }, {up:0, down:0}) : {up:0, down:0};
      return {
        id: String(c._id),
        text: c.body || c.text || '',
        author: c.user ? { id: String(c.user._id), username: c.user.username } : null,
        parentId: c.parent ? String(c.parent) : (c.parentId ? String(c.parentId) : null),
        edited: c.edited || false,
        upvotes: counts.up,
        downvotes: counts.down,
        score: counts.up - counts.down,
        createdAt: c.createdAt
      };
    });
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new comment on a post
router.post('/:id/comments', async (req, res) => {
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

    const comment = new Comment({
      post: req.params.id,
      user: userId,
      body: cleanText
    });

    if (parentId) comment.parent = parentId;

    const saved = await comment.save();
    const populated = await Comment.findById(saved._id).populate('user', 'username');

    const counts = populated.votesBy
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
      upvotes: counts.up,
      downvotes: counts.down,
      score: counts.up - counts.down,
      createdAt: populated.createdAt
    });
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST vote on a post
router.post('/:id/vote', async (req, res) => {
  try {
    const userId = req.session && req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    const { type } = req.body; // 'up' or 'down'
    if (!['up','down'].includes(type)) return res.status(400).json({ message: 'Invalid vote type' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const current = post.votesBy.get(userId) || 0;
    const value = type === 'up' ? 1 : -1;
    if (current === value) {
      // unvote
      post.votesBy.delete(userId);
    } else {
      post.votesBy.set(userId, value);
    }
    await post.save();
    const counts = Array.from(post.votesBy.values()).reduce((acc, v) => { if (v===1) acc.up++; else if (v===-1) acc.down++; return acc; }, {up:0, down:0});
    const score = counts.up - counts.down;
    res.json({ upvotes: counts.up, downvotes: counts.down, score });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET a single post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username')
      .populate('song', 'albumCover cover');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const author = post.user
      ? { id: String(post.user._id), username: post.user.username }
      : null;

    const cover =
      (post.song && (post.song.albumCover || post.song.cover)) ||
      post.cover ||
      null;

    let voteValues = [];
    if (post.votesBy) {
      if (typeof post.votesBy.values === 'function') {
        voteValues = Array.from(post.votesBy.values());
      } else {
        voteValues = Object.values(post.votesBy);
      }
    }

    const upvotes = voteValues.filter(v => v === 1).length;
    const downvotes = voteValues.filter(v => v === -1).length;

    return res.json({
      id: String(post._id),
      title: post.title || '',
      body: post.body || '',
      cover,
      rating: Number(post.rating || 0),
      songId: post.song ? String(post.song._id || post.song) : null,
      author,
      edited: post.edited || false,
      upvotes,
      downvotes,
      score: upvotes - downvotes
    });
  } catch (err) {
    console.error('GET single post error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT update a post (edit)
router.put('/:id', async (req, res) => {
  try {
    const userId = req.session && req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const { title, body, content, rating, songId } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.user) !== String(userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const cleanTitle = (title || '').trim();
    const cleanBody = (body || content || '').trim();
    const numericRating = rating != null ? Number(rating) : post.rating;

    if (!cleanTitle || !cleanBody) {
      return res.status(400).json({ message: 'Title and review are required.' });
    }

    if (cleanTitle.length < 3) {
      return res.status(400).json({ message: 'Title must be at least 3 characters.' });
    }

    if (cleanTitle.length > 100) {
      return res.status(400).json({ message: 'Title must be at most 100 characters.' });
    }

    if (cleanBody.length < 10) {
      return res.status(400).json({ message: 'Review must be at least 10 characters.' });
    }

    if (cleanBody.length > 2000) {
      return res.status(400).json({ message: 'Review must be at most 2000 characters.' });
    }

    if (Number.isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 0 and 5.' });
    }

    let validSongId = post.song;
    if (songId !== undefined && songId !== null && songId !== '') {
      const songExists = await Song.findById(songId);
      if (!songExists) {
        return res.status(400).json({ message: 'Selected song does not exist.' });
      }
      validSongId = songId;
    } else if (songId === null || songId === '') {
      validSongId = null;
    }

    post.title = cleanTitle;
    post.body = cleanBody;
    post.rating = numericRating;
    post.song = validSongId;
    post.edited = true;

    await post.save();

    const populated = await Post.findById(post._id).populate('user', 'username');

    let voteValues = [];
    if (populated.votesBy) {
      if (typeof populated.votesBy.values === 'function') {
        voteValues = Array.from(populated.votesBy.values());
      } else {
        voteValues = Object.values(populated.votesBy);
      }
    }

    const upvotes = voteValues.filter(v => v === 1).length;
    const downvotes = voteValues.filter(v => v === -1).length;

    return res.json({
      id: String(populated._id),
      title: populated.title,
      body: populated.body,
      rating: populated.rating || 0,
      edited: populated.edited || false,
      author: populated.user
        ? { id: String(populated.user._id), username: populated.user.username }
        : null,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      createdAt: populated.createdAt
    });
  } catch (err) {
    console.error('Edit post error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE a post
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.session && req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.user) !== String(userId)) return res.status(403).json({ message: 'Forbidden' });
    // delete post and its comments
    await Comment.deleteMany({ post: post._id });
    await Post.deleteOne({ _id: post._id });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new post
router.post('/', async (req, res) => {
  try {
    const sessionUser = req.session && req.session.userId;
    const { title, content, body, songId, rating, userId, authorId } = req.body;
    const postUser = sessionUser || userId || authorId || null;

    if (!postUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const cleanTitle = (title || '').trim();
    const postBody = (body || content || '').trim();
    const numericRating = Number(rating);

    if (!cleanTitle || !postBody) {
      return res.status(400).json({ message: 'Title and review are required.' });
    }

    if (cleanTitle.length < 3) {
      return res.status(400).json({ message: 'Title must be at least 3 characters.' });
    }

    if (cleanTitle.length > 100) {
      return res.status(400).json({ message: 'Title must be at most 100 characters.' });
    }

    if (postBody.length < 10) {
      return res.status(400).json({ message: 'Review must be at least 10 characters.' });
    }

    if (postBody.length > 2000) {
      return res.status(400).json({ message: 'Review must be at most 2000 characters.' });
    }

    if (Number.isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 0 and 5.' });
    }

    let validSongId = null;
    if (songId) {
      const songExists = await Song.findById(songId);
      if (!songExists) {
        return res.status(400).json({ message: 'Selected song does not exist.' });
      }
      validSongId = songId;
    }

    const newPost = new Post({
      title: cleanTitle,
      body: postBody,
      song: validSongId,
      user: postUser,
      rating: numericRating
    });

    const savedPost = await newPost.save();
    const populated = await Post.findById(savedPost._id).populate('user', 'username');

    const counts = populated.votesBy
      ? Array.from(populated.votesBy.values()).reduce((acc, v) => {
          if (v === 1) acc.up++;
          else if (v === -1) acc.down++;
          return acc;
        }, { up: 0, down: 0 })
      : { up: 0, down: 0 };

    return res.status(201).json({
      id: String(populated._id),
      title: populated.title,
      body: populated.body,
      cover: populated.cover || null,
      rating: populated.rating || 0,
      edited: populated.edited || false,
      author: populated.user
        ? { id: String(populated.user._id), username: populated.user.username }
        : null,
      upvotes: counts.up,
      downvotes: counts.down,
      score: counts.up - counts.down,
      createdAt: populated.createdAt
    });
  } catch (err) {
    console.error('Create post error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;