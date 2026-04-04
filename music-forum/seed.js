require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('./model/User');
const Song = require('./model/Song');
const Post = require('./model/Post');
const Comment = require('./model/Comment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/musicForum';
const SALT_ROUNDS = 10;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => console.error(err));

async function seedDB() {
  try {
    await User.deleteMany({});
    await Song.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});

    // create unique passwords per user and hash them
    const plainPasswords = [
      'tillPass1',
      'chaewonPass1',
      'mitsukiPass1',
      'kPass1',
      'yeonjunPass1',
      'beomgyuPass1',
      'gojoPass1'
    ];
    const hashedPasswords = await Promise.all(plainPasswords.map(p => bcrypt.hash(p, SALT_ROUNDS)));

    const users = await User.insertMany([
      { username: 'till', password: hashedPasswords[0], email: 'till@example.com', avatar: '/assets/avatars/till.jfif' },
      { username: 'chaewon', password: hashedPasswords[1], email: 'chaewon@example.com', avatar: '/assets/avatars/chaewon.jfif' },
      { username: 'mitsuki', password: hashedPasswords[2], email: 'mitsuki@example.com', avatar: '/assets/avatars/mitsuki.jfif' },
      { username: 'k', password: hashedPasswords[3], email: 'k@example.com', avatar: '/assets/avatars/k.jfif' },
      { username: 'yeonjun', password: hashedPasswords[4], email: 'yeonjun@example.com', avatar: '/assets/avatars/yeonjun.jpg' },
      { username: 'beomgyu', password: hashedPasswords[5], email: 'beomgyu@example.com', avatar: '/assets/avatars/beomgyu.jfif' },
      { username: 'gojo', password: hashedPasswords[6], email: 'gojo@example.com', avatar: '/assets/avatars/gojo.jfif' }
    ]);

    const songs = await Song.insertMany([
      { title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', genre: 'Grunge', duration: '5:01', albumCover: 'assets/covers/nirvana.jfif', description: 'An iconic grunge anthem with raw vocals and a driving riff.', releaseDate: new Date('1991-09-10') },
      { title: 'Enter Sandman', artist: 'Metallica', album: 'Metallica', genre: 'Heavy Metal', duration: '5:31', albumCover: 'assets/covers/enter_sandman.jpg', description: 'A heavy, stadium-ready track with a menacing riff and intense chorus.', releaseDate: new Date('1991-07-29') },
      { title: 'Always', artist: 'Bon Jovi', album: 'Cross Road', genre: 'Rock', duration: '5:55', albumCover: 'assets/covers/always.jfif', description: 'A sweeping rock ballad with emotive vocals and a memorable chorus.', releaseDate: new Date('1994-10-24') },
      { title: 'Under Pressure', artist: 'Queen & David Bowie', album: 'Hot Space', genre: 'Rock', duration: '4:08', albumCover: 'assets/covers/under_pressure.jfif', description: 'An iconic collaboration with a famous bassline and powerful vocal interplay.', releaseDate: new Date('1981-10-26') },
      { title: 'Diamond Eyes', artist: 'Deftones', album: 'Diamond Eyes', genre: 'Alternative Metal', duration: '4:07', albumCover: 'assets/covers/diamond_eyes.jpg', description: 'Melodic yet heavy, with a soaring chorus and layered production.', releaseDate: new Date('2010-05-04') },
      { title: 'Karma Police', artist: 'Radiohead', album: 'OK Computer', genre: 'Alternative Rock', duration: '4:21', albumCover: 'assets/covers/karma_police.jpg', description: 'A haunting track with piano motifs and memorable, ironic lyrics.', releaseDate: new Date('1997-07-21') },
      { title: 'Paranoid Android', artist: 'Radiohead', album: 'OK Computer', genre: 'Progressive Rock', duration: '6:27', albumCover: 'assets/covers/paranoid_android.jpg', description: 'An ambitious multi-part composition with shifting moods and complex arrangements.', releaseDate: new Date('1997-05-26') },
      { title: 'There Is a Light That Never Goes Out', artist: 'The Smiths', album: 'The Queen Is Dead', genre: 'Indie Rock', duration: '4:02', albumCover: 'assets/covers/light_never_goes_out.jpg', description: 'A melancholic, romantic song with jangly guitars and poetic lyrics.', releaseDate: new Date('1986-06-16') },
      { title: 'How Soon Is Now?', artist: 'The Smiths', album: 'Hatful of Hollow', genre: 'Indie Rock', duration: '6:44', albumCover: 'assets/covers/how_soon_is_now.jpg', description: 'Famous for its tremolo guitar sound and moody atmosphere.', releaseDate: new Date('1985-08-05') },
      { title: 'London Calling', artist: 'The Clash', album: 'London Calling', genre: 'Punk Rock', duration: '3:19', albumCover: 'assets/covers/london_calling.jpg', description: 'A politically charged punk anthem with ska and reggae influences.', releaseDate: new Date('1979-12-07') },
      { title: 'Rock the Casbah', artist: 'The Clash', album: 'Combat Rock', genre: 'Punk Rock', duration: '3:42', albumCover: 'assets/covers/rock_the_casbah.jpg', description: 'An upbeat Clash track mixing punk energy with danceable rhythms.', releaseDate: new Date('1982-01-08') },
      { title: '1979', artist: 'Smashing Pumpkins', album: 'Mellon Collie and the Infinite Sadness', genre: 'Alternative Rock', duration: '4:25', albumCover: 'assets/covers/1979.jpg', description: 'A nostalgic, melodic reflection on youth and suburban life.', releaseDate: new Date('1996-01-23') },
      { title: 'Bullet with Butterfly Wings', artist: 'Smashing Pumpkins', album: 'Mellon Collie and the Infinite Sadness', genre: 'Alternative Rock', duration: '4:16', albumCover: 'assets/covers/bullet_with_butterfly_wings.jpg', description: 'A heavy, angst-filled song with a memorable chorus.', releaseDate: new Date('1995-04-13') },
      { title: 'Welcome to the Black Parade', artist: 'My Chemical Romance', album: 'The Black Parade', genre: 'Emo/Alternative', duration: '5:11', albumCover: 'assets/covers/black_parade.jpg', description: 'A theatrical and rousing rock opera-style single with strong hooks.', releaseDate: new Date('2006-09-11') },
      { title: 'Helena', artist: 'My Chemical Romance', album: 'Three Cheers for Sweet Revenge', genre: 'Emo/Alternative', duration: '3:22', albumCover: 'assets/covers/helena.jpg', description: 'Emotional and driving, with powerful vocal harmonies.', releaseDate: new Date('2004-02-03') }
    ]);

    const posts = await Post.insertMany([
      { user: users[0]._id, song: songs[0]._id, title: 'Iconic Grunge Anthem', body: 'Smells Like Teen Spirit’s chorus hits like a punch — the raw guitar tone and aggressive delivery define early 90s grunge.', rating: 5 },
      { user: users[1]._id, song: songs[1]._id, title: 'Menacing Riff', body: 'Enter Sandman opens with one of the most recognizable riffs in metal; it’s heavy and perfect for big venues.', rating: 5 },
      { user: users[2]._id, song: songs[2]._id, title: 'Powerful Ballad', body: 'Always is a sweeping rock ballad — emotive vocals and a huge chorus make it a guilty pleasure that hits hard.', rating: 4 },
      { user: users[3]._id, song: songs[3]._id, title: 'Classic Collaboration', body: 'Under Pressure’s bassline is legendary and the vocal interplay between Queen and Bowie is brilliant.', rating: 5 },
      { user: users[4]._id, song: songs[4]._id, title: 'Melodic and Heavy', body: 'Diamond Eyes balances heavy riffs with melodic hooks; it’s atmospheric yet punchy.', rating: 5 },
      { user: users[5]._id, song: songs[5]._id, title: 'Haunting Piano', body: 'Karma Police has a melancholic piano motif and lyrics that stick with you — haunting and beautiful.', rating: 5 },
      { user: users[6]._id, song: songs[6]._id, title: 'Multi-Part Masterpiece', body: 'Paranoid Android shifts through moods and sections; ambitious songwriting that keeps revealing itself.', rating: 5 },
      { user: users[0]._id, song: songs[7]._id, title: 'Melancholic Romance', body: 'There Is a Light That Never Goes Out is achingly romantic — jangly guitars and poignant lyrics.', rating: 5 },
      { user: users[1]._id, song: songs[8]._id, title: 'Moody and Textured', body: 'How Soon Is Now? is known for that tremolo guitar sound and a moody atmosphere that’s unforgettable.', rating: 5 },
      { user: users[2]._id, song: songs[9]._id, title: 'Punk Anthem', body: 'London Calling blends punk with other genres and delivers a charged political message — timeless.', rating: 5 },
      { user: users[3]._id, song: songs[10]._id, title: 'Fun and Danceable', body: 'Rock the Casbah is upbeat and unexpectedly danceable for a Clash track.', rating: 4 },
      { user: users[4]._id, song: songs[11]._id, title: 'Nostalgic Vibe', body: '1979 captures a wistful nostalgia; mellow but compelling storytelling.', rating: 5 },
      { user: users[5]._id, song: songs[12]._id, title: 'Angst-filled Hit', body: 'Bullet with Butterfly Wings packs fury into its chorus — raw emotion and power.', rating: 5 },
      { user: users[6]._id, song: songs[13]._id, title: 'Theatrical Rock', body: 'Welcome to the Black Parade is grand and theatrical — a rock opera moment that rallies the crowd.', rating: 5 },
      { user: users[0]._id, song: songs[14]._id, title: 'Driving and Emotional', body: 'Helena delivers emotional vocals and a driving chorus that sticks with you.', rating: 5 },
      { user: users[1]._id, song: songs[0]._id, title: 'Still Powerful', body: 'Smells Like Teen Spirit still sounds ferocious live; the energy never fades.', rating: 5 },
      { user: users[2]._id, song: songs[1]._id, title: 'Timeless Metal', body: 'Enter Sandman’s riff and dynamics make it a metal staple.', rating: 5 },
      { user: users[3]._id, song: songs[2]._id, title: 'Big Chorus', body: 'Always is melodramatic but gorgeous — the chorus is unforgettable.', rating: 4 },
      { user: users[4]._id, song: songs[3]._id, title: 'Iconic Bassline', body: 'Under Pressure’s bass hook grabs you instantly; an all-time collaboration.', rating: 5 },
      { user: users[5]._id, song: songs[4]._id, title: 'Atmospheric Rock', body: 'Diamond Eyes layers textures while keeping a powerful core — great production.', rating: 5 }
    ]);

    // create 3-4 comments for each post
    const commentBodies = [
      'Totally agree!',
      'Nice review!',
      'I think it’s better than you said.',
      'I liked it more!',
      'This is my favorite too!',
      'Great point — hadn’t thought of that.',
      'Not my style but well written.',
      'The live version is even better.',
      'Production on this is top-notch.',
      'Lyrics hit different every time.'
    ];

    const commentsToInsert = [];
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      // add 3 comments, sometimes 4
      const count = (i % 4 === 0) ? 4 : 3;
      for (let j = 0; j < count; j++) {
        const userIndex = (i + j + 1) % users.length; // vary commenter
        const body = commentBodies[(i * 3 + j) % commentBodies.length];
        commentsToInsert.push({ post: post._id, user: users[userIndex]._id, body });
      }
    }

    await Comment.insertMany(commentsToInsert);

    console.log('Database seeded!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    mongoose.connection.close();
  }
}

seedDB();