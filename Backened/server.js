// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const fsRouter = require('./routes/fs');
const analyzeRouter = require('./routes/analyze');
const emailRoutes = require('./routes/email');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (PPTX, images, etc.)
app.use('/download', express.static(path.join(__dirname, 'output')));
app.use('/output', express.static(path.join(__dirname, 'output')));

// Mount routes
app.use('/fs', fsRouter);
app.use('/analyze', analyzeRouter);
app.use('/email', emailRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`⚡️ Backend listening on http://localhost:${PORT}`);
});