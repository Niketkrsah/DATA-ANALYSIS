// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');


const analyzeRouter = require('./routes/analyze');

const emailRoutes = require('./routes/email');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (PPTX, images, etc.)
app.use('/download', express.static(path.join(__dirname, 'output')));
app.use('/output', express.static(path.join(__dirname, 'output')));

//cleanup
const { cleanupOldSessions } = require('./utils/cleanupOldSessions');


// Mount routes
app.use('/analyze', analyzeRouter);
app.use('/email', emailRoutes);



cron.schedule('*/30 * * * *', () => {
  const outputDir = path.join(__dirname, 'output');
  const maxAgeMs = 2 * 60 * 60 * 1000; // 2 hours
  const activeSessionId = global.activeSessionId || null; // Replace with real session tracking

  console.log('⏰ Running 2-hour session cleanup...');
  cleanupOldSessions(outputDir, maxAgeMs, activeSessionId ? [activeSessionId] : []);
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`⚡️ Backend listening on http://localhost:${PORT}`);
});