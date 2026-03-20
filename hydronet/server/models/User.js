const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['citizen', 'municipal_officer', 'ngo', 'admin'], default: 'citizen' },
  avatar:   { type: String, default: '' },

  // Gamification
  ecoScore:    { type: Number, default: 0 },
  reportsCount:{ type: Number, default: 0 },
  badges:      [{ name: String, awardedAt: Date, icon: String }],
  rank:        { type: String, default: 'Seedling' }, // Seedling → Sapling → Guardian → Champion → Legend

  location: {
    city:    { type: String, default: '' },
    district:{ type: String, default: '' },
  },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update rank based on eco score
userSchema.methods.updateRank = function() {
  const score = this.ecoScore;
  if (score >= 5000)      this.rank = 'Legend';
  else if (score >= 2000) this.rank = 'Champion';
  else if (score >= 800)  this.rank = 'Guardian';
  else if (score >= 200)  this.rank = 'Sapling';
  else                    this.rank = 'Seedling';
};

module.exports = mongoose.model('User', userSchema);
