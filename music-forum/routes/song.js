const express = require('express');
const router = express.Router();
const Song = require('../model/Song');
const Post = require('../model/Post');
const User = require('../model/User');

// GET /api/songs - Get all songs
router.get('/', async (req, res) => {
  try {
    const raw = await Song.find();
    const songs = raw.map(s => ({
      id: String(s._id),
      title: s.title,
      artist: s.artist,
      cover: s.albumCover || s.cover || null,
      releaseDate: s.releaseDate,
      description: s.description || ''
    }));
    console.log('GET /api/songs -> returning', songs.length, 'songs');
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

// GET single song by id
router.get('/:id', async (req, res) => {
  try {
    console.log('GET /api/songs/:id ->', req.params.id);
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json({ id: String(song._id), title: song.title, artist: song.artist, cover: song.albumCover || song.cover, releaseDate: song.releaseDate, description: song.description || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch song' });
  }
});

// GET reviews/posts for a song
router.get('/:id/reviews', async (req, res) => {
  try {
    const posts = await Post.find({ song: req.params.id }).sort({ createdAt: -1 }).populate('user', 'username');
    const out = posts.map(p => ({
      id: String(p._id),
      title: p.title,
      body: p.body,
      rating: p.rating || 0,
      upvotes: p.upvotes || 0,
      downvotes: p.downvotes || 0,
      edited: p.edited || false,
      author: p.user ? { id: String(p.user._id), username: p.user.username } : null,
      createdAt: p.createdAt
    }));
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
