// // routes/fs.js
// const express = require('express');
// const fs      = require('fs');
// const path    = require('path');
// const router  = express.Router();

// const BASE_DIR = path.resolve(__dirname, '..');

// router.get('/list', (req, res) => {
//   const rel    = req.query.path || '';
//   const target = path.normalize(path.join(BASE_DIR, rel));

//   if (!target.startsWith(BASE_DIR)) {
//     return res.status(403).json({ error: 'Forbidden' });
//   }

//   fs.stat(target, (err, stats) => {
//     if (err) return res.status(400).json({ error: err.message });
//     if (!stats.isDirectory()) {
//       return res.status(400).json({ error: 'Not a directory' });
//     }

//     fs.readdir(target, { withFileTypes: true }, (err, entries) => {
//       if (err) return res.status(500).json({ error: err.message });

//       const files = entries
//         .map(e => ({ name: e.name, type: e.isDirectory() ? 'dir' : 'file' }))
//         .filter(e => e.type === 'dir' || /\.csv$/i.test(e.name));

//       res.json({ path: rel, files });
//     });
//   });
// });

// module.exports = router;