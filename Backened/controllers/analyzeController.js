const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { cleanupOldSessions } = require('../utils/cleanupOldSessions');
const PY_CMD = process.platform === 'win32' ? 'py' : 'python3';

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
}

function runPython(inputCsv, outputName, type, sessionPath, res) {
  const script = path.join(__dirname, `../python/${type}_analysis.py`);
  const args = ['--input', inputCsv, '--outdir', sessionPath];

  console.log(`🔧 Spawning: ${PY_CMD} ${script} ${args.join(' ')}`);
  let stderr = '';

  const proc = spawn(PY_CMD, [script, ...args]);

  proc.stdout.on('data', d => console.log('PY ▶', d.toString()));
  proc.stderr.on('data', d => {
    stderr += d.toString();
    console.error('PY ERR ▶', d.toString());
  });

  proc.on('close', code => {
    fs.unlink(inputCsv, () => {}); // Delete uploaded CSV

    const pptxPath = path.join(sessionPath, `${type}_report.pptx`);
    const finalName = outputName.replace(/\.csv$/i, '.pptx');
    const finalPath = path.join(sessionPath, finalName);
    

    if (code !== 0 || !fs.existsSync(pptxPath)) {
      return res.status(500).json({ error: 'Analysis failed', details: stderr });
    }

    fs.renameSync(pptxPath, finalPath);

    res.json({
      pptxUrl: `/download/${path.basename(sessionPath)}/${finalName}`,
      sessionId: path.basename(sessionPath)
    });
  });
}

exports.analyzeByUpload = async (req, res) => {
  const type = req.body.type || 'crash';

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const uploadedPath = req.file.path;
  const originalName = req.originalFilename;
  const sessionPath = req.sessionPath;

  if (!originalName.toLowerCase().endsWith('.csv')) {
    return res.status(400).json({ error: 'Only .csv files are allowed' });
  }

  const outputRoot = path.join(__dirname, '../output');
  await cleanupOldSessions(outputRoot, 2 * 60 * 60 * 1000,[req.sessionId]);

  runPython(uploadedPath, originalName, type, sessionPath, res);
};