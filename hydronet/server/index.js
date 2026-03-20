const express      = require('express');
const mongoose     = require('mongoose');
const cors         = require('cors');
const morgan       = require('morgan');
const path         = require('path');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/structures',  require('./routes/structures'));
app.use('/api/reports',     require('./routes/reports'));
app.use('/api/dashboard',   require('./routes/dashboard'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/upload',      require('./routes/upload'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({
    status:    'ok',
    service:   'HydroNet API',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
    uptime:    `${Math.floor(process.uptime())}s`,
  })
);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` })
);

// Global error handler — must be last middleware
app.use(errorHandler);

// ── MongoDB Connection ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hydronet';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`\n🚀 HydroNet API  →  http://localhost:${PORT}`);
      console.log(`   Env: ${process.env.NODE_ENV || 'development'}\n`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
