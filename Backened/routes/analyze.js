const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { analyzeByUpload } = require('../controllers/analyzeController');

const router = express.Router();
const BASE_DIR = path.resolve(__dirname, '..');
const outputDir = path.join(BASE_DIR, 'output');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sessionId = uuidv4();
    const sessionPath = path.join(outputDir, sessionId);
    fs.mkdirSync(sessionPath, { recursive: true });
    req.sessionId = sessionId;
    req.sessionPath = sessionPath;
    cb(null, sessionPath);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_\-.]/g, '_');
    req.originalFilename = safeName;
    cb(null, safeName);
  }
});


const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB max
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv') {
      return cb(new Error('❌ Only CSV files are allowed.'));
    }
    cb(null, true);
  }
});


function validateType(req, res, next) {
  const type = req.query.type || req.body?.type || 'crash';

  if (!['crash', 'anr'].includes(type)) {
    return res.status(400).json({ error: 'Invalid analysis type. Must be "crash" or "anr".' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  if (req.file.size === 0) {
    return res.status(400).json({ error: 'Uploaded file is empty.' });
  }

  next();
}


router.post('/upload', (req, res, next) => {
  upload.single('csv')(req, res, function (err) {
    if (err instanceof multer.MulterError) {

      // A Multer error occurred when uploading
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {

      // An unknown error occurred
      return res.status(400).json({ error: err.message });
    }
    next(); // Proceed if no error
  });
}, validateType, analyzeByUpload);


module.exports = router;