# Discboxd

Discboxd is a music review forum web application where users can create accounts, write reviews for songs, comment on posts, vote on posts and comments, follow other users, and create playlists.

- Raine Anne S. Dollentas
CCAPDEV MCO SECTION S08 - Group 30 
---
## Deployed Application

Live website link:
https://ccapdev-phase3-group30.onrender.com

## Features

- User registration and login
- Session-based authentication
- Password hashing with bcrypt
- Create, edit, and delete reviews
- Create, edit, and delete comments
- Nested replies for comments
- Upvote and downvote for posts
- Upvote and downvote for comments
- User profiles
- Follow and unfollow users
- Playlist feature
- Search for songs, users, and reviews
- Seeded sample data for testing

---

## Tech Stack

### Backend
- Node.js
- Express
- MongoDB
- Mongoose

### Frontend
- HTML
- CSS
- JavaScript

### Deployment
- Render
- MongoDB Atlas

---

## NPM Packages Used

### Dependencies
- express
- mongoose
- cors
- express-session
- connect-mongo
- bcrypt
- dotenv

### Dev Dependencies
- nodemon

---

## Project Structure

```text
music-forum/
├── model/         # Mongoose models
├── routes/        # Express routes/controllers
├── public/        # Frontend HTML, CSS, JavaScript, and assets
├── app.js         # Main server file
├── seed.js        # Database seeding script
├── package.json
└── README.md
```

## Requirements

Before running the project locally, make sure you have:

Node.js
npm
MongoDB Community Server or a MongoDB Atlas connection string
Environment Variables

Create a file named .env in the root folder of the project.

Use this template:

MONGODB_URI=your_mongodb_connection_string_here
SESSION_SECRET=your_session_secret_here
NODE_ENV=development
PORT=3000

Example for local MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/musicForum
SESSION_SECRET=your_session_secret_here
NODE_ENV=development
PORT=3000

---

## Notes
If you are using MongoDB Atlas, replace MONGODB_URI with your own Atlas connection string.
Do not commit your real .env file to GitHub.

## How to Run Locally

Step 1: Clone the repository
git clone <your-repository-link>
Step 2: Open the project folder
cd music-forum
Step 3: Install dependencies
npm install
Step 4: Create the .env file

Create a file named .env in the root folder of the project, then paste:

MONGODB_URI=your_mongodb_connection_string_here
SESSION_SECRET=your_session_secret_here
NODE_ENV=development
PORT=3000

Step 5: Seed the database
npm run seed

This loads sample users, songs, posts, and comments into the database.

Step 6: Start the server
npm start
Step 7: Open the app in the browser

Go to:

http://localhost:3000
Development Mode

To run the app with automatic restart during development:

npm run dev
Seeded Data

The seed script inserts sample data into the database so the application already has:

sample users
sample songs
sample reviews
sample comments

This makes it easier to test the required features immediately after setup.

## Authentication
User sessions are handled using express-session
Sessions are stored in MongoDB using connect-mongo
Passwords are hashed using bcrypt

## Validation

The project uses both front-end and back-end validation for major forms, including:

registration
login
post creation and editing
comment creation and editing
replies
profile updates
About Page

The application includes an About page that lists the NPM packages and third-party libraries used in the project.

## Additional Notes
This project follows an MVC-style structure using models, routes/controllers, and frontend views.
If testing locally with MongoDB Atlas, use your own Atlas connection string in .env.
If testing locally with MongoDB Community Server, make sure MongoDB is running before starting the app.
If the database is empty, run npm run seed first before using the app.
