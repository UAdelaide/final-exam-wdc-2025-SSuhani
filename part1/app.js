// app.js
const express = require('express');
const path    = require('path');
const logger  = require('morgan');
const mysql   = require('mysql2/promise');
const db      = require('./models/db'); 

const app = express();

// --- Middleware ---
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Database connection & seeding ---
let db;
(async () => {
  db = await mysql.createConnection({
    host:     'localhost',
    user:'root',
    password: '',            // fill in if you have a password
    database: 'DogWalkService',
    multipleStatements: true
  });

  // Seed test data (INSERT IGNORE to avoid duplicates)
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
})().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Helper to ensure routes wait for DB ready
function withDB(handler) {
  return async (req, res) => {
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }
    return handler(req, res);
  };
}

// --- API Endpoints ---

// 1) GET /api/dogs
app.get('/api/dogs', withDB(async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        d.name     AS dog_name,
        d.size     AS size,
        u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching dogs:', err);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
}));

// 2) GET /api/walkrequests/open
app.get('/api/walkrequests/open', withDB(async (req, res) => {
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
    res.json(rows);
  } catch (err) {
    console.error('Error fetching open walk requests:', err);
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
}));

// 3) GET /api/walkers/summary
app.get('/api/walkers/summary', withDB(async (req, res) => {
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
}));

// --- Start server ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API server listening at http://localhost:${PORT}`);
});
