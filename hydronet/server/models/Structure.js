const mongoose = require('mongoose');

const structureSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  type:        {
    type: String,
    enum: ['rooftop_tank', 'check_dam', 'percolation_pit', 'recharge_well', 'pond', 'sump', 'other'],
    required: true,
  },
  status:      {
    type: String,
    enum: ['functional', 'needs_repair', 'non_functional', 'under_maintenance'],
    default: 'functional',
  },
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    address:     { type: String, default: '' },
    district:    { type: String, default: '' },
    city:        { type: String, default: '' },
    pincode:     { type: String, default: '' },
  },

  // Technical specs
  capacityLitres:      { type: Number, default: 0 },
  catchmentAreaSqM:    { type: Number, default: 0 },
  yearInstalled:       { type: Number },
  lastMaintenanceDate: { type: Date },
  nextMaintenanceDate: { type: Date },

  // Computed water impact
  annualRechargeEstimateLitres: { type: Number, default: 0 },
  waterSavedLitres:             { type: Number, default: 0 },

  // Media
  images: [{ url: String, uploadedAt: Date }],

  // Relations
  addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reports:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],

  // Tags / notes
  tags:  [String],
  notes: { type: String, default: '' },

  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Geospatial index
structureSchema.index({ location: '2dsphere' });
structureSchema.index({ status: 1, 'location.city': 1 });

module.exports = mongoose.model('Structure', structureSchema);
