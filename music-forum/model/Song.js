const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String },
  genre: { type: String },
  duration: { type: String }, // e.g. '4:05'
  albumCover: { type: String }, // URL or path to image
  description: { type: String },
  releaseDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Song = mongoose.model('Song', songSchema);

module.exports = Song;