const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const User = require('../model/User');
const Post = require('../model/Post');
const Comment = require('../model/Comment');

const SALT_ROUNDS = 10;

function sanitizeUser(user) {
  return {
    id: String(user._id),
    username: user.username,
    email: user.email || '',
    bio: user.bio || '',
    avatar: user.avatar || '',
    createdAt: user.createdAt
  };
}

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const cleanUsername = username.trim();

    if (cleanUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }

    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    req.session.userId = String(user._id);
    req.session.rememberMe = !!rememberMe;

    if (rememberMe) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 21; // 3 weeks
    } else {
      req.session.cookie.expires = false; // session cookie
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }

    if (cleanUsername.length > 20) {
      return res.status(400).json({ message: 'Username must be at most 20 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username already taken.' });
    }

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new User({
      username: cleanUsername,
      password: hashedPassword,
      email: cleanEmail
    });

    await user.save();

    req.session.userId = String(user._id);

    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (err) {
    if (err && err.code === 11000) {
      if (err.keyPattern && err.keyPattern.email) {
        return res.status(409).json({ message: 'Email already in use.' });
      }
      if (err.keyPattern && err.keyPattern.username) {
        return res.status(409).json({ message: 'Username already taken.' });
      }
      return res.status(409).json({ message: 'Duplicate value already exists.' });
    }

    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const safeUsers = users.map(sanitizeUser);
    return res.json(safeUsers);
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me
router.get('/me', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    return res.json(sanitizeUser(user));
  } catch (err) {
    console.error('Me route error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/logout
router.post('/logout', (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }

      res.clearCookie('connect.sid');
      return res.json({ message: 'Logged out' });
    });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(sanitizeUser(user));
  } catch (err) {
    console.error('Get single user error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id/posts
router.get('/:id/posts', async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .populate('song');

    const out = posts.map(p => ({
      id: String(p._id),
      title: p.title,
      body: p.body,
      score: p.score || 0,
      rating: p.rating || 0,
      edited: p.edited || false,
      cover: (p.song && (p.song.albumCover || p.song.cover)) || p.cover || null,
      createdAt: p.createdAt
    }));

    return res.json(out);
  } catch (err) {
    console.error('User posts error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .populate('post', 'title');

    const out = comments.map(c => ({
      id: String(c._id),
      text: c.body || '',
      postId: c.post ? String(c.post._id) : null,
      postTitle: c.post ? c.post.title : 'Unknown post',
      parentId: c.parent ? String(c.parent) : null,
      createdAt: c.createdAt
    }));

    return res.json(out);
  } catch (err) {
    console.error('User comments error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

















// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const sessionUser = req.session && req.session.userId;

    if (!sessionUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (String(sessionUser) !== String(req.params.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { username, bio, avatar, email } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username !== undefined) user.username = username.trim();
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (email !== undefined) user.email = email.trim();

    await user.save();

    return res.json(sanitizeUser(user));
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    console.error('Update user error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;