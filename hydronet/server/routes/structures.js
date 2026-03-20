const express   = require('express');
const mongoose  = require('mongoose');
const Structure = require('../models/Structure');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ── IMPORTANT: specific named routes MUST come before /:id ─────────────────

// GET /api/structures/stats/summary — aggregate stats (MUST be first)
router.get('/stats/summary', async (req, res) => {
  try {
    const [statusBreakdown, typeBreakdown, totals] = await Promise.all([
      Structure.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Structure.aggregate([{ $group: { _id: '$type',   count: { $sum: 1 } } }]),
      Structure.aggregate([{
        $group: {
          _id: null,
          totalCapacityL:       { $sum: '$capacityLitres' },
          totalWaterSavedL:     { $sum: '$waterSavedLitres' },
          totalAnnualRechargeL: { $sum: '$annualRechargeEstimateLitres' },
          totalStructures:      { $sum: 1 },
        },
      }]),
    ]);
    res.json({ success: true, data: { statusBreakdown, typeBreakdown, totals: totals[0] || {} } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/structures — list with filters
router.get('/', async (req, res) => {
  try {
    const { status, type, city, lat, lng, radius = 5000, limit = 200 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type)   filter.type   = type;
    if (city)   filter['location.city'] = new RegExp(city, 'i');

    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry:    { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      };
    }

    const structures = await Structure.find(filter)
      .populate('addedBy', 'name role')
      .limit(Math.min(parseInt(limit) || 200, 500))
      .lean();

    res.json({ success: true, count: structures.length, data: structures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/structures/:id — single structure with reports
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid structure ID.' });
    }
    const structure = await Structure.findById(req.params.id)
      .populate('addedBy', 'name role')
      .populate({
        path: 'reports',
        populate: { path: 'reporter', select: 'name ecoScore rank' },
        options: { sort: { createdAt: -1 }, limit: 50 },
      });

    if (!structure) return res.status(404).json({ success: false, message: 'Structure not found.' });
    res.json({ success: true, data: structure });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/structures
router.post('/', protect, async (req, res) => {
  try {
    const structure = await Structure.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json({ success: true, data: structure });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/structures/:id
router.put('/:id', protect, authorize('municipal_officer', 'admin'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID.' });
    }
    const { addedBy, reports, createdAt, ...safeBody } = req.body;
    const structure = await Structure.findByIdAndUpdate(
      req.params.id, safeBody, { new: true, runValidators: true }
    );
    if (!structure) return res.status(404).json({ success: false, message: 'Structure not found.' });
    res.json({ success: true, data: structure });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/structures/:id/verify
router.patch('/:id/verify', protect, authorize('admin', 'municipal_officer'), async (req, res) => {
  try {
    const structure = await Structure.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, verifiedBy: req.user._id },
      { new: true }
    );
    if (!structure) return res.status(404).json({ success: false, message: 'Structure not found.' });
    res.json({ success: true, data: structure });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/structures/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const structure = await Structure.findByIdAndDelete(req.params.id);
    if (!structure) return res.status(404).json({ success: false, message: 'Structure not found.' });
    res.json({ success: true, message: 'Structure deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
