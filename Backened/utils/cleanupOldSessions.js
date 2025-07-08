const fs = require('fs');
const path = require('path');

const cleanupOldSessions = async (baseDir, maxAgeMs = 2 * 60 * 60 * 1000, excludeIds = []) => {
  const now = Date.now();
  try {
    const folders = await fs.promises.readdir(baseDir);
    for (const folder of folders) {
      if (excludeIds.includes(folder)) {
        console.log(`⛔ Skipping active session: ${folder}`);
        continue;
      }

      const folderPath = path.join(baseDir, folder);
      const stats = await fs.promises.stat(folderPath);

      if (stats.isDirectory()) {
        const age = now - stats.ctimeMs;
        console.log(`📁 Checking: ${folder} — Age: ${Math.round(age / 1000 / 60)} min`);

        if (age > maxAgeMs) {
          await fs.promises.rm(folderPath, { recursive: true, force: true });
          console.log(`🧹 Deleted expired session: ${folderPath}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Session cleanup error:', err.message);
  }
};

module.exports = {
  cleanupOldSessions
};