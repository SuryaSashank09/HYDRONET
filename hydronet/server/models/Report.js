const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  structure: { type: mongoose.Schema.Types.ObjectId, ref: 'Structure', required: true },
  reporter:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  conditionObserved: {
    type: String,
    enum: ['functional', 'needs_repair', 'non_functional', 'overflow', 'contaminated', 'blocked_inlet', 'other'],
    required: true,
  },

  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },

  description: { type: String, required: true, trim: true },

  images: [{ url: String, filename: String }],

  // GPS at time of report (may differ from structure location)
  reportLocation: {
    type:        { type: String, default: 'Point' },
    coordinates: [Number], // [lng, lat]
  },

  validationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'duplicate'],
    default: 'pending',
  },
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt: { type: Date },
  adminNotes:  { type: String, default: '' },

  // Eco points awarded for this report
  pointsAwarded: { type: Number, default: 0 },

  // Offline support: cached offline and synced later
  isOfflineReport: { type: Boolean, default: false },
  syncedAt:        { type: Date },

}, { timestamps: true });

reportSchema.index({ structure: 1, validationStatus: 1 });
reportSchema.index({ reporter: 1 });

module.exports = mongoose.model('Report', reportSchema);
