// app.js
const express = require('express');
const path    = require('path');
const logger  = require('morgan');
const db      = require('./models/db');    // your mysql2/promise pool

const app = express();

// --- Middleware ---
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Seed data once on startup ---
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
    console.log('Seed data applied');
  } catch (err) {
    console.error('Seeding error:', err);
  }
})();

// --- API Endpoints ---

// GET /api/dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [dogs] = await db.execute(`
      SELECT
        d.name       AS dog_name,
        d.size       AS size,
        u.username   AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    return res.json(dogs);
  } catch (err) {
    console.error('Error fetching dogs:', err);
    return res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// GET /api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        wr.request_id,
        d.name               AS dog_name,
        wr.requested_time,
        wr.duration_minutes,
        wr.location,
        u.username           AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d  ON wr.dog_id  = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching open walk requests:', err);
    return res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

// GET /api/walkers/summary
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        u.username AS walker_username,
        COUNT(r.rating_id)           AS total_ratings,
        AVG(r.rating)                AS average_rating,
        COUNT(CASE WHEN wr.status='completed' THEN 1 END)
                                      AS completed_walks
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
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching walker summary:', err);
    return res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
