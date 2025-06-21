var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const db = require('./models/db');

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

(async () => {
  try {
    await db.execute(`
      INSERT IGNORE INTO Users (username, email, password_hash, role) VALUES
        ('alice123','alice@example.com','hashed123','owner'),
        ('bobwalker','bob@example.com','hashed456','walker'),
        ('carol123','carol@example.com','hashed789','owner'),
        ('anakin567','darthvader@example.com','hashed122','owner'),
        ('felix325','felix@example.com','hashed030','walker');

      INSERT IGNORE INTO Dogs (owner_id, name, size) VALUES
        ((SELECT user_id FROM Users WHERE username='alice123'),'Max','medium'),
        ((SELECT user_id FROM Users WHERE username='carol123'),'Bella','small'),
        ((SELECT user_id FROM Users WHERE username='anakin567'),'Luke','large'),
        ((SELECT user_id FROM Users WHERE username='felix325'),'Chris','medium'),
        ((SELECT user_id FROM Users WHERE username='bobwalker'),'Rocky','large');
    `);
    console.log('Seed data inserted (if not already present)');
  } catch (err) {
    console.error('Seeding error:', err);
  }
})();

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
