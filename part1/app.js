var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
// In app.js, after you’ve set up your Express app and MySQL connection (e.g. `const db = await mysql.createConnection(...)`):

app.get('/api/dogs', async (req, res) => {
  try {

    const [dogs] = await db.execute(`
      SELECT
        d.name          AS dog_name,
        d.size          AS size,
        u.username      AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);


    res.json(dogs);
  } catch (err) {
    console.error('Error fetching dogs:', err);
    res
      .status(500)
      .json({ error: 'Failed to fetch dogs' });
  }
});
