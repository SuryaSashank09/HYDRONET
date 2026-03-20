const express   = require('express');
const Structure = require('../models/Structure');
const Report    = require('../models/Report');
const User      = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/overview — key metrics for admin dashboard
router.get('/overview', protect, authorize('admin', 'municipal_officer', 'ngo'), async (req, res) => {
  try {
    const [
      totalStructures,
      functional,
      needsRepair,
      nonFunctional,
      underMaintenance,
      pendingReports,
      verifiedReports,
      totalUsers,
      recentReports,
    ] = await Promise.all([
      Structure.countDocuments(),
      Structure.countDocuments({ status: 'functional' }),
      Structure.countDocuments({ status: 'needs_repair' }),
      Structure.countDocuments({ status: 'non_functional' }),
      Structure.countDocuments({ status: 'under_maintenance' }),
      Report.countDocuments({ validationStatus: 'pending' }),
      Report.countDocuments({ validationStatus: 'verified' }),
      User.countDocuments({ isActive: true }),
      Report.find({ validationStatus: 'pending' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('structure', 'name type location status')
        .populate('reporter', 'name rank'),
    ]);

    // Water impact aggregation
    const waterImpact = await Structure.aggregate([{
      $group: {
        _id: null,
        totalCapacityM3:    { $sum: { $divide: ['$capacityLitres', 1000] } },
        totalWaterSavedM3:  { $sum: { $divide: ['$waterSavedLitres', 1000] } },
        totalRechargeM3:    { $sum: { $divide: ['$annualRechargeEstimateLitres', 1000] } },
      }
    }]);

    // 7-day report trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const reportTrend = await Report.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
    ]);

    // Coverage percentage
    const coveragePercent = totalStructures > 0
      ? Math.round(((functional + needsRepair) / totalStructures) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        structures: { total: totalStructures, functional, needsRepair, nonFunctional, underMaintenance, coveragePercent },
        reports:    { pending: pendingReports, verified: verifiedReports, recentPending: recentReports },
        users:      { total: totalUsers },
        waterImpact: waterImpact[0] || { totalCapacityM3: 0, totalWaterSavedM3: 0, totalRechargeM3: 0 },
        reportTrend,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/maintenance-alerts — structures needing attention
router.get('/maintenance-alerts', protect, authorize('admin', 'municipal_officer'), async (req, res) => {
  try {
    const alertStructures = await Structure.find({
      $or: [
        { status: 'non_functional' },
        { status: 'needs_repair' },
        { nextMaintenanceDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
      ]
    }).sort({ status: 1 }).limit(50).lean();

    res.json({ success: true, count: alertStructures.length, data: alertStructures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/water-impact — predictive engine data
router.get('/water-impact', async (req, res) => {
  try {
    // Estimate: avg rainfall 600mm/year, 80% runoff efficiency for rooftop
    const structures = await Structure.find({ status: { $in: ['functional', 'needs_repair'] } })
      .select('type capacityLitres catchmentAreaSqM status');

    let totalRechargeM3 = 0;
    let totalHarvestM3  = 0;

    structures.forEach(s => {
      const area     = s.catchmentAreaSqM || 50; // default 50 sqm
      const rainfall = 600; // mm/year
      const harvest  = (area * rainfall * 0.001 * 0.8); // in m³
      totalHarvestM3  += harvest;
      totalRechargeM3 += harvest * 0.6; // 60% goes to groundwater recharge
    });

    const co2SavedKg    = totalHarvestM3 * 0.35; // rough CO2 offset
    const treesEquiv    = Math.round(co2SavedKg / 21);
    const familiesWater = Math.round(totalHarvestM3 / 50); // 50m3/family/year

    res.json({
      success: true,
      data: {
        totalStructuresActive: structures.length,
        totalHarvestM3:        Math.round(totalHarvestM3),
        totalRechargeM3:       Math.round(totalRechargeM3),
        co2SavedKg:            Math.round(co2SavedKg),
        treesEquivalent:       treesEquiv,
        familiesSupported:     familiesWater,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
