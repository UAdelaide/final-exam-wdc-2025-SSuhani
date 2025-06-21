const express = require('express');
const router  = express.Router();

// GET /api/owners/me/dogs
router.get('/me/dogs', async (req, res) => {
  try {
    const ownerId = req.user.user_id;    // however you grab the logged-in user
    const [rows] = await db.execute(`
      SELECT dog_id, name
      FROM Dogs
      WHERE owner_id = ?
    `, [ownerId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch your dogs' });
  }
});

module.exports = router;
