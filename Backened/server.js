// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const analyzeRouter = require('./routes/analyze');
const emailRoutes = require('./routes/email');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (PPTX, images, etc.)
app.use('/download', express.static(path.join(__dirname, 'output')));
app.use('/output', express.static(path.join(__dirname, 'output')));

//cleanup
const { deleteOldPPTXFiles,cleanupOldPPTX, cleanupOldFiles} = require('./utils/cleanup');

// Mount routes
app.use('/analyze', analyzeRouter);
app.use('/email', emailRoutes);

const cron = require('node-cron');


// Run cleanup every hour
cron.schedule('0 * * * *', () => {
  console.log('⏰ Running hourly cleanup...');
  const uploadsDir = path.join(__dirname, 'uploads');
  const outputDir = path.join(__dirname, 'output');

  cleanupOldFiles(uploadsDir);       // Clean old uploads
  cleanupOldPPTX(outputDir);         // Clean old PPTX files
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`⚡️ Backend listening on http://localhost:${PORT}`);
});