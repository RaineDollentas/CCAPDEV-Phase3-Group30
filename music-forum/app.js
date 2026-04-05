require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const path = require('path');

// Import routes
const userRoutes = require('./routes/user');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comment');
const songRoutes = require('./routes/song');

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/musicForum';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change_this_secret';

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1);

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));


console.log('Session cookie settings:', {
  NODE_ENV: process.env.NODE_ENV || 'undefined',
  cookieSecure: (process.env.NODE_ENV === 'production'),
  sameSite: 'lax'
});

app.use((req, res, next) => {
  if (req.session && req.session.userId && req.session.rememberMe) {
    req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 21; // refresh to 3 weeks
  }
  next();
});


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/songs', songRoutes);

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Tip: If running locally over http, ensure NODE_ENV!=production so cookie.secure is false.');
});