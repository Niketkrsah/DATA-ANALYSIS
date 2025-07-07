const fs = require('fs');
const path = require('path');


function deleteOldPPTXFiles(outdir) {
  try {
    if (!fs.existsSync(outdir)) {
      console.warn(`⚠️ Output directory does not exist: ${outdir}`);
      return;
    }

    const files = fs.readdirSync(outdir);
    for (const file of files) {
      if (file.toLowerCase().endsWith('.pptx')) {
        const filePath = path.join(outdir, file);
        fs.unlinkSync(filePath);
        console.log(`🧹 Deleted PPTX: ${filePath}`);
      }
    }
  } catch (err) {
    console.error('❌ Failed to delete PPTX files:', err.message);
  }
}


async function cleanupOldPPTX(outdir, maxAgeMs = 10 * 60 * 1000) {
  const now = Date.now();
  try {
    const files = await fs.promises.readdir(outdir);
    for (const file of files) {
      if (file.endsWith('.pptx')) {
        const filePath = path.join(outdir, file);
        const stats = await fs.promises.stat(filePath);
        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.promises.unlink(filePath);
          console.log(`🧹 Deleted expired PPTX: ${filePath}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ PPTX cleanup error:', err.message);
  }
}

const cleanupOldFiles = async () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const now = Date.now();
  const oneHour = 1* 60 * 60 * 1000;

  try {
    const files = await fs.promises.readdir(uploadsDir);
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = await fs.promises.stat(filePath);
      if (now - stats.mtimeMs > oneHour) {
        await fs.promises.unlink(filePath);
        console.log(`🧹 Deleted old file: ${filePath}`);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
};

module.exports = {
  deleteOldPPTXFiles,
  cleanupOldFiles,
  cleanupOldPPTX
};
