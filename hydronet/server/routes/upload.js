const express = require('express');
const path    = require('path');
const upload  = require('../middleware/upload');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/upload/image — upload a single image, returns URL
router.post('/image', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, url, filename: req.file.filename });
});

// POST /api/upload/images — upload up to 5 images
router.post('/images', protect, upload.array('images', 5), (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ success: false, message: 'No files uploaded.' });
  }
  const files = req.files.map(f => ({
    url:      `${req.protocol}://${req.get('host')}/uploads/${f.filename}`,
    filename: f.filename,
  }));
  res.json({ success: true, files });
});

module.exports = router;
