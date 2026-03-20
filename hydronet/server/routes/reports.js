const express   = require('express');
const Report    = require('../models/Report');
const Structure = require('../models/Structure');
const User      = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Eco points logic
const ECO_POINTS = {
  functional:    10,
  needs_repair:  25,
  non_functional:30,
  overflow:      20,
  contaminated:  35,
  blocked_inlet: 20,
  other:         10,
};

// GET /api/reports — list reports (admin/officer) or own reports (citizen)
router.get('/', protect, async (req, res) => {
  try {
    const { status, structureId, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'citizen') filter.reporter = req.user._id;
    if (status)      filter.validationStatus = status;
    if (structureId) filter.structure = structureId;

    const reports = await Report.find(filter)
      .populate('structure', 'name type location status')
      .populate('reporter',  'name ecoScore rank')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.json({ success: true, data: reports, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reports — submit a new report
router.post('/', protect, async (req, res) => {
  try {
    const { structureId, conditionObserved, severity, description, reportLocation, images, isOfflineReport } = req.body;

    const structure = await Structure.findById(structureId);
    if (!structure) return res.status(404).json({ success: false, message: 'Structure not found.' });

    const points = ECO_POINTS[conditionObserved] || 10;

    const report = await Report.create({
      structure:         structureId,
      reporter:          req.user._id,
      conditionObserved,
      severity,
      description,
      reportLocation,
      images:            images || [],
      pointsAwarded:     points,
      isOfflineReport:   isOfflineReport || false,
      syncedAt:          isOfflineReport ? new Date() : undefined,
    });

    // Add report reference to structure
    structure.reports.push(report._id);
    await structure.save();

    // Award eco points to reporter
    const user = await User.findById(req.user._id);
    user.ecoScore     += points;
    user.reportsCount += 1;
    user.updateRank();

    // Badge awards
    if (user.reportsCount === 1)   user.badges.push({ name: 'First Drop', icon: '💧', awardedAt: new Date() });
    if (user.reportsCount === 10)  user.badges.push({ name: 'Rain Watcher', icon: '🌧️', awardedAt: new Date() });
    if (user.reportsCount === 50)  user.badges.push({ name: 'Hydro Hero', icon: '🏆', awardedAt: new Date() });
    if (user.ecoScore   >= 1000)   user.badges.push({ name: 'Water Champion', icon: '🌊', awardedAt: new Date() });

    await user.save();

    res.status(201).json({ success: true, data: report, pointsAwarded: points, newEcoScore: user.ecoScore, newRank: user.rank });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/reports/:id/validate — admin/officer validates report
router.patch('/:id/validate', protect, authorize('admin', 'municipal_officer'), async (req, res) => {
  try {
    const { validationStatus, adminNotes } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { validationStatus, adminNotes, validatedBy: req.user._id, validatedAt: new Date() },
      { new: true }
    ).populate('structure');

    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    // Update structure status if verified
    if (validationStatus === 'verified' && report.structure) {
      const statusMap = {
        functional:     'functional',
        needs_repair:   'needs_repair',
        non_functional: 'non_functional',
        contaminated:   'needs_repair',
        overflow:       'needs_repair',
        blocked_inlet:  'needs_repair',
      };
      const newStatus = statusMap[report.conditionObserved];
      if (newStatus) {
        await Structure.findByIdAndUpdate(report.structure._id, { status: newStatus });
      }
    }

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/reports/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('structure', 'name type location')
      .populate('reporter', 'name ecoScore rank');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
