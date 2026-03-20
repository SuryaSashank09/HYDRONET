const express = require('express');
const User    = require('../models/User');
const router  = express.Router();

// GET /api/leaderboard — top eco contributors
router.get('/', async (req, res) => {
  try {
    const { limit = 20, city } = req.query;
    const filter = { isActive: true };
    if (city) filter['location.city'] = new RegExp(city, 'i');

    const leaders = await User.find(filter)
      .select('name ecoScore rank reportsCount badges location')
      .sort({ ecoScore: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: leaders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
