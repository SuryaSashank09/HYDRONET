/**
 * HydroNet Database Seeder
 * Run: node seed.js
 * Populates DB with sample structures and users for development
 */

require('dotenv').config();
const mongoose  = require('mongoose');
const Structure = require('./models/Structure');
const User      = require('./models/User');
const Report    = require('./models/Report');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hydronet';

// Sample structures around Hyderabad / Bengaluru
const sampleStructures = [
  {
    name: 'Jubilee Hills Rooftop Tank Complex',
    type: 'rooftop_tank',
    status: 'functional',
    location: { type: 'Point', coordinates: [78.4082, 17.4319], address: 'Road No. 36, Jubilee Hills', district: 'Jubilee Hills', city: 'Hyderabad', pincode: '500033' },
    capacityLitres: 50000, catchmentAreaSqM: 400, yearInstalled: 2019,
    annualRechargeEstimateLitres: 180000, waterSavedLitres: 120000,
    isVerified: true, tags: ['residential', 'large-complex'],
  },
  {
    name: 'Madhapur Percolation Pit — IT Hub',
    type: 'percolation_pit',
    status: 'needs_repair',
    location: { type: 'Point', coordinates: [78.3809, 17.4484], address: 'Mindspace Road, Madhapur', district: 'Madhapur', city: 'Hyderabad', pincode: '500081' },
    capacityLitres: 0, catchmentAreaSqM: 200, yearInstalled: 2017,
    annualRechargeEstimateLitres: 96000, waterSavedLitres: 0,
    isVerified: true, notes: 'Inlet blocked, reported multiple times. Urgent maintenance needed.',
    tags: ['commercial', 'urgent'],
  },
  {
    name: 'Banjara Hills Check Dam — Lake 1',
    type: 'check_dam',
    status: 'functional',
    location: { type: 'Point', coordinates: [78.4483, 17.4156], address: 'Near KBR Park, Banjara Hills', district: 'Banjara Hills', city: 'Hyderabad', pincode: '500034' },
    capacityLitres: 500000, catchmentAreaSqM: 2000, yearInstalled: 2015,
    annualRechargeEstimateLitres: 960000, waterSavedLitres: 750000,
    isVerified: true, tags: ['public', 'lake-adjacent'],
  },
  {
    name: 'Gachibowli Recharge Well — Phase 2',
    type: 'recharge_well',
    status: 'non_functional',
    location: { type: 'Point', coordinates: [78.3506, 17.4432], address: 'Financial District, Gachibowli', district: 'Gachibowli', city: 'Hyderabad', pincode: '500032' },
    capacityLitres: 20000, catchmentAreaSqM: 100, yearInstalled: 2018,
    annualRechargeEstimateLitres: 0, waterSavedLitres: 0,
    isVerified: false, notes: 'Motor failure. Last operational: March 2024.',
    tags: ['commercial', 'non-functional'],
  },
  {
    name: 'Kondapur Residential Colony Sump',
    type: 'sump',
    status: 'functional',
    location: { type: 'Point', coordinates: [78.3629, 17.4603], address: 'Kondapur Main Road', district: 'Kondapur', city: 'Hyderabad', pincode: '500084' },
    capacityLitres: 30000, catchmentAreaSqM: 250, yearInstalled: 2020,
    annualRechargeEstimateLitres: 120000, waterSavedLitres: 90000,
    isVerified: true, tags: ['residential'],
  },
  {
    name: 'Hitec City Pond Restoration',
    type: 'pond',
    status: 'under_maintenance',
    location: { type: 'Point', coordinates: [78.3742, 17.4489], address: 'HITEC City, Cyberabad', district: 'HITEC City', city: 'Hyderabad', pincode: '500081' },
    capacityLitres: 2000000, catchmentAreaSqM: 5000, yearInstalled: 2012,
    annualRechargeEstimateLitres: 2400000, waterSavedLitres: 1800000,
    isVerified: true, tags: ['public', 'restoration-project'],
    notes: 'GHMC restoration project underway. Expected completion: Q3 2025.',
  },
  {
    name: 'Kukatpally Housing Board Rooftop',
    type: 'rooftop_tank',
    status: 'functional',
    location: { type: 'Point', coordinates: [78.4088, 17.4849], address: 'KPHB Colony, Kukatpally', district: 'Kukatpally', city: 'Hyderabad', pincode: '500072' },
    capacityLitres: 80000, catchmentAreaSqM: 600, yearInstalled: 2021,
    annualRechargeEstimateLitres: 288000, waterSavedLitres: 200000,
    isVerified: true, tags: ['government-housing', 'large'],
  },
  {
    name: 'Secunderabad Cantonment Percolation Pit',
    type: 'percolation_pit',
    status: 'functional',
    location: { type: 'Point', coordinates: [78.5066, 17.4479], address: 'Trimulgherry, Secunderabad', district: 'Secunderabad', city: 'Hyderabad', pincode: '500015' },
    capacityLitres: 0, catchmentAreaSqM: 150, yearInstalled: 2016,
    annualRechargeEstimateLitres: 72000, waterSavedLitres: 0,
    isVerified: true, tags: ['government', 'cantonment'],
  },
];

const sampleUsers = [
  { name: 'Priya Sharma', email: 'priya@example.com', password: 'password123', role: 'citizen', location: { city: 'Hyderabad', district: 'Jubilee Hills' } },
  { name: 'Ravi Kumar', email: 'ravi@example.com', password: 'password123', role: 'municipal_officer', location: { city: 'Hyderabad', district: 'Madhapur' } },
  { name: 'Ananya Reddy', email: 'ananya@ngo.com', password: 'password123', role: 'ngo', location: { city: 'Hyderabad', district: 'Banjara Hills' } },
  { name: 'Admin User', email: 'admin@hydronet.com', password: 'admin123!', role: 'admin', location: { city: 'Hyderabad', district: 'Madhapur' } },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([Structure.deleteMany(), User.deleteMany(), Report.deleteMany()]);
    console.log('🗑️  Cleared existing data');

    // Create users
    const users = await User.create(sampleUsers);
    console.log(`👥 Created ${users.length} users`);

    // Create structures with user reference
    const structuresWithUser = sampleStructures.map(s => ({ ...s, addedBy: users[0]._id }));
    const structures = await Structure.create(structuresWithUser);
    console.log(`🏗️  Created ${structures.length} structures`);

    // Create sample reports
    const sampleReports = [
      {
        structure: structures[1]._id, reporter: users[0]._id,
        conditionObserved: 'blocked_inlet', severity: 'high',
        description: 'The inlet pipe is completely blocked with debris. Water is not percolating.',
        validationStatus: 'verified', pointsAwarded: 20,
        validatedBy: users[1]._id, validatedAt: new Date(),
      },
      {
        structure: structures[3]._id, reporter: users[0]._id,
        conditionObserved: 'non_functional', severity: 'critical',
        description: 'Motor has completely stopped working. No water recharge happening.',
        validationStatus: 'pending', pointsAwarded: 30,
      },
      {
        structure: structures[0]._id, reporter: users[2]._id,
        conditionObserved: 'functional', severity: 'low',
        description: 'System working perfectly. Tank is full after last rain. Good maintenance.',
        validationStatus: 'verified', pointsAwarded: 10,
        validatedBy: users[1]._id, validatedAt: new Date(),
      },
    ];

    await Report.create(sampleReports);
    console.log(`📋 Created ${sampleReports.length} reports`);

    // Update user eco scores
    await User.findByIdAndUpdate(users[0]._id, {
      ecoScore: 250, reportsCount: 2, rank: 'Sapling',
      badges: [{ name: 'First Drop', icon: '💧', awardedAt: new Date() }]
    });
    await User.findByIdAndUpdate(users[2]._id, {
      ecoScore: 130, reportsCount: 1, rank: 'Seedling',
      badges: [{ name: 'First Drop', icon: '💧', awardedAt: new Date() }]
    });

    console.log('\n🎉 Seeding complete!\n');
    console.log('Test accounts:');
    console.log('  Citizen:          priya@example.com     / password123');
    console.log('  Municipal Officer: ravi@example.com      / password123');
    console.log('  NGO:              ananya@ngo.com        / password123');
    console.log('  Admin:            admin@hydronet.com    / admin123!');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seed();
