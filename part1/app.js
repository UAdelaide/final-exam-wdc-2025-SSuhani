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

app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        wr.request_id,
        d.name             AS dog_name,
        wr.requested_time,
        wr.duration_minutes,
        wr.location,
        u.username         AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d  ON wr.dog_id  = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching open walk requests:', err);
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

// 3) GET /api/walkers/summary
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        u.username AS walker_username,
        COUNT(r.rating_id)           AS total_ratings,
        AVG(r.rating)                AS average_rating,
        COUNT(CASE WHEN wr.status='completed' THEN 1 END) AS completed_walks
      FROM Users u
      LEFT JOIN WalkRatings r
        ON u.user_id = r.walker_id
      LEFT JOIN WalkApplications wa
        ON u.user_id = wa.walker_id
      LEFT JOIN WalkRequests wr
        ON wa.request_id = wr.request_id AND wr.status='completed'
      WHERE u.role = 'walker'
      GROUP BY u.username
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching walker summary:', err);
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API server listening at http://localhost:${PORT}`);
});