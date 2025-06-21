const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'dogwalks.db');
const db = new sqlite3.Database(dbPath);

// Initialize database with sample data on startup
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create tables if they don't exist (assuming they're created by dogwalks.sql)
      // Insert sample users
      db.run(`INSERT OR IGNORE INTO users (username, user_type) VALUES
        ('alice123', 'owner'),
        ('carol123', 'owner'),
        ('bobwalker', 'walker'),
        ('newwalker', 'walker')`, function(err) {
        if (err) console.log('Users insert error:', err);
      });

      // Insert sample dogs
      db.run(`INSERT OR IGNORE INTO dogs (name, size, owner_username) VALUES
        ('Max', 'medium', 'alice123'),
        ('Bella', 'small', 'carol123'),
        ('Charlie', 'large', 'alice123')`, function(err) {
        if (err) console.log('Dogs insert error:', err);
      });

      // Insert sample walk requests
      db.run(`INSERT OR IGNORE INTO walk_requests (dog_name, requested_time, duration_minutes, location, status, owner_username) VALUES
        ('Max', '2025-06-10T08:00:00.000Z', 30, 'Parklands', 'open', 'alice123'),
        ('Bella', '2025-06-11T14:00:00.000Z', 45, 'City Park', 'completed', 'carol123'),
        ('Charlie', '2025-06-12T16:00:00.000Z', 60, 'Beach Walk', 'open', 'alice123')`, function(err) {
        if (err) console.log('Walk requests insert error:', err);
      });

      // Insert sample walks (completed)
      db.run(`INSERT OR IGNORE INTO walks (walker_username, request_id, rating) VALUES
        ('bobwalker', 2, 5),
        ('bobwalker', 3, 4)`, function(err) {
        if (err) console.log('Walks insert error:', err);
        resolve();
      });
    });
  });
}

// Route 1: /api/dogs - Return all dogs with size and owner's username
app.get('/api/dogs', (req, res) => {
  try {
    const query = `
      SELECT
        d.name as dog_name,
        d.size,
        d.owner_username
      FROM dogs d
      ORDER BY d.name
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to retrieve dogs data'
        });
      }

      res.json(rows);
    });
  } catch (error) {
    console.error('Error in /api/dogs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process request'
    });
  }
});

// Route 2: /api/walkrequests/open - Return all open walk requests
app.get('/api/walkrequests/open', (req, res) => {
  try {
    const query = `
      SELECT
        wr.id as request_id,
        wr.dog_name,
        wr.requested_time,
        wr.duration_minutes,
        wr.location,
        wr.owner_username
      FROM walk_requests wr
      WHERE wr.status = 'open'
      ORDER BY wr.requested_time
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to retrieve open walk requests'
        });
      }

      res.json(rows);
    });
  } catch (error) {
    console.error('Error in /api/walkrequests/open:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process request'
    });
  }
});

// Route 3: /api/walkers/summary - Return walker summary with ratings and completed walks
app.get('/api/walkers/summary', (req, res) => {
  try {
    const query = `
      SELECT
        u.username as walker_username,
        COUNT(CASE WHEN w.rating IS NOT NULL THEN 1 END) as total_ratings,
        CASE
          WHEN COUNT(CASE WHEN w.rating IS NOT NULL THEN 1 END) > 0
          THEN ROUND(AVG(w.rating * 1.0), 1)
          ELSE NULL
        END as average_rating,
        COUNT(w.id) as completed_walks
      FROM users u
      LEFT JOIN walks w ON u.username = w.walker_username
      WHERE u.user_type = 'walker'
      GROUP BY u.username
      ORDER BY u.username
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to retrieve walker summary'
        });
      }

      res.json(rows);
    });
  } catch (error) {
    console.error('Error in /api/walkers/summary:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process request'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Dog Walking API server running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log('- GET /api/dogs');
    console.log('- GET /api/walkrequests/open');
    console.log('- GET /api/walkers/summary');
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;