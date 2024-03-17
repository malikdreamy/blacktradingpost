const express = require('express');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const http = require('http');
const https = require('https'); // Import the 'https' module
const fs = require('fs'); // Import the 'fs' module
const socketIo = require('socket.io');  //use sockIo for real time connections
const path = require('path');
const cors = require('cors');
const cookieparser = require('cookie-parser');
const helmet = require('helmet');
const configureRouter = require('./controllers/index.js');
const PORT = process.env.PORT || 443;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Closet-Catch';
const app = express();

const store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/Closet-Catch', // MongoDB connection URI
  collection: 'sessions', // Name of the collection to store sessions
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3001', // Replace with actual URLs or an array of allowed origins
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250, // limit each IP to 100 requests per 15
  message: 'Too many requests from you , please try again later.'
});

app.use(limiter);

app.use(helmet.xXssProtection());
app.use(cookieparser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: 'Vanessa24051762Clyde',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    // secure: true, // Enable this in production with HTTPS
    sameSite: 'strict',
  },
  resave: false,
  saveUninitialized: true,
  store: store,
}));

app.set('views', path.join(__dirname, 'views')); // Use EJS for admin
app.set('view engine', 'ejs');

// set up server to use io (real time connection)
const privateKey = fs.readFileSync('/etc/letsencrypt/live/malikhub.com/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/malikhub.com/fullchain.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
};

const httpsServer = https.createServer(credentials, app);
const io = socketIo(httpsServer);
const router = configureRouter(io);
app.use(router)
app.use(express.static(path.join(__dirname, 'public')));

// Handle redirection from http://www.malikhub.com to https://www.malikhub.com
http.createServer((req, res) => {
  res.writeHead(301, { 'Location': `https://${req.headers.host}${req.url}` });
  res.end();
}).listen(80);

// Connect to MongoDB and start servers
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');

    // Start the HTTPS server for malikhub.com and www.malikhub.com
    httpsServer.listen(PORT, () => {
      console.log(`Server Listening on Port ${PORT}`);
    });

    // Start the HTTP server for redirecting www.malikhub.com to HTTPS
  
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });