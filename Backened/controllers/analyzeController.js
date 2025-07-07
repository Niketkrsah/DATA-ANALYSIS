const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const BASE_DIR = path.resolve(__dirname, '..');
const PY_CMD = process.platform === 'win32' ? 'py' : 'python3';

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
}

function runPython(inputCsv, outputName, type, res) {
  const script = path.join(__dirname, `../python/${type}_analysis.py`);
  const outdir = path.join(__dirname, '../output/');
  const args = ['--input', inputCsv, '--outdir', outdir];

  console.log(`🔧 Spawning: ${PY_CMD} ${script} ${args.join(' ')}`);
  let stderr = '';

  const proc = spawn(PY_CMD, [script, ...args]);

  proc.stdout.on('data', d => console.log('PY ▶', d.toString()));
  proc.stderr.on('data', d => {
    stderr += d.toString();
    console.error('PY ERR ▶', d.toString());
  });

  proc.on('close', code => {
    if (code !== 0) {
      return res.status(500).json({ error: 'Analysis failed', details: stderr });
    }

    const pptxPath = path.join(outdir, `${type}_report.pptx`);
    const renamed = path.join(outdir, `${outputName}.pptx`);

    try {
      if (!fs.existsSync(pptxPath)) {
        return res.status(500).json({ error: 'PPTX not generated' });
      }
      fs.renameSync(pptxPath, renamed);
    } catch (err) {
      console.error('Rename failed:', err);
      return res.status(500).json({ error: 'Failed to rename PPTX file' });
    }

    res.json({ pptxUrl: `/download/${outputName}.pptx` });
    filename = outputName; // Store for email
    // console.log(`✅ Analysis complete. PPTX available at: ${renamed}`);
  });
}

// For local (server-browsed) CSV files
exports.analyzeByPath = (req, res) => {
  const rel = req.query.csvPath;
  const type = req.query.type || 'crash';

  if (!rel) return res.status(400).json({ error: 'csvPath required' });

  const full = path.normalize(path.join(BASE_DIR, rel));
  console.log('📁 CSV path received:', rel);
  console.log('📄 Resolved full path:', full);

  if (!full.startsWith(BASE_DIR)) {
    return res.status(403).json({ error: 'Forbidden path' });
  }

  if (!fs.existsSync(full) || !full.endsWith('.csv')) {
    return res.status(400).json({ error: 'Invalid or missing CSV file' });
  }

  const baseName = sanitizeFilename(path.basename(full, '.csv'));

  // ✅ Corrected parameter order
  runPython(full, baseName, type, res);
};

// For uploaded CSV files
exports.analyzeByUpload = (req, res) => {
  const type = req.body.type || 'crash';

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const uploadedPath = req.file.path;
  const originalName = req.file.originalname;

  if (!originalName.toLowerCase().endsWith('.csv')) {
    return res.status(400).json({ error: 'Only .csv files are allowed' });
  }

  const baseName = sanitizeFilename(path.basename(originalName, '.csv'));

  // ✅ Corrected parameter order
  runPython(uploadedPath, baseName, type, res);
};
