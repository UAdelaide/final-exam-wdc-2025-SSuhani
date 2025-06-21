// Filename: app.js
const express = require('express');
const path = require('path');
const logger = 'morgan';

// --- Database Connection ---
const mysql = require('mysql2/promise');

// Create a connection pool. This is more efficient than creating a new connection for every query.
// !!! IMPORTANT: Replace with your actual MySQL database details from your dogwalks.sql !!!
const db = mysql.createPool({
    host: 'localhost',
    user: 'your_mysql_user',       // e.g., 'root'
    password: 'your_mysql_password', // e.g., 'password'
    database: 'DogWalkService'       // The database name from your .sql file
});

// Make the 'db' object available to all routes
// By attaching it to the request object, our route files can access it.
const app = express();
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Import your new API router
const apiRouter = require('./routes/api');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Use the routers
app.use('/api', apiRouter); // All API routes will be handled by api.js
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Note: The original /api/dogs handler that was here has been moved to routes/api.js

module.exports = app;

// The server is typically started in a separate file (e.g., bin/www)
// in an Express-generated project. If you are running this file directly with `node app.js`,
// you would add the app.listen() call here.
