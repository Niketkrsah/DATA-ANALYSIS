const express = require('express');
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');
const { analyzeByPath, analyzeByUpload } = require('../controllers/analyzeController');

const router   = express.Router();
const BASE_DIR = path.resolve(__dirname, '..');
const uploadDir = path.join(BASE_DIR, 'uploads');

// Clean uploads folder before saving new file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.readdir(uploadDir, (err, files) => {
      if (!err) {
        for (const f of files) {
          fs.unlink(path.join(uploadDir, f), () => {});
        }
      }
      cb(null, uploadDir);
    });
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_\-.]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});

const upload = multer({ storage });

function validateType(req, res, next) {
  const type = req.query.type || req.body?.type || 'crash';
  if (!['crash', 'anr'].includes(type)) {
    return res.status(400).json({ error: 'Invalid analysis type. Must be "crash" or "anr".' });
  }
  next();
}

// Main endpoints
router.get('/local', validateType, analyzeByPath);
router.post('/upload', upload.single('csv'), validateType, analyzeByUpload);

// Optional debug route
router.get('/test-path', (req, res) => {
  const rel = req.query.csvPath;
  if (!rel) return res.status(400).json({ error: 'csvPath required' });

  const full = path.normalize(path.join(BASE_DIR, rel));
  if (!full.startsWith(BASE_DIR)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  fs.stat(full, (err, stats) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ fullPath: full, isFile: stats.isFile(), size: stats.size });
  });
});

module.exports = router;
