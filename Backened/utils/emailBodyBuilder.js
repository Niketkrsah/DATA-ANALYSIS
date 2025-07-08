const fs = require('fs');
const path = require('path');

// ASCII Bar Chart
function generateAsciiBarChart(data, title) {
  const wrapLimit = 70;
  const maxLabelLength = Math.max(
    ...Object.keys(data).map(k => (k.replace(/\n/g, ' ').length > wrapLimit ? wrapLimit : k.replace(/\n/g, ' ').length))
  );
  const maxValue = Math.max(...Object.values(data));
  const scale = maxValue > 50 ? 50 / maxValue : 1;

  let chart = `\n<b>${title}</b>\n<pre style="font-family: monospace;">`;

  for (const [rawLabel, value] of Object.entries(data)) {
    const label = rawLabel.replace(/\n/g, ' ');
    const bar = '■'.repeat(Math.round(value * scale));
    const lines = [];

    for (let i = 0; i < label.length; i += wrapLimit) {
      lines.push(label.slice(i, i + wrapLimit));
    }

    chart += `${lines[0].padEnd(maxLabelLength)} | ${bar} (${value})\n`;
    for (let i = 1; i < lines.length; i++) {
      chart += `${lines[i].padEnd(maxLabelLength)} |\n`;
    }
  }

  chart += '</pre>';
  return chart;
}

// HTML Table
function generateHtmlTable(data, title) {
  if (typeof data !== 'object' || Array.isArray(data)) return '';

  let table = `<h3>${title}</h3><table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">`;
  table += '<tr><th>Key</th><th>Value</th></tr>';
  for (const [key, value] of Object.entries(data)) {
    table += `<tr><td>${key}</td><td>${value}</td></tr>`;
  }
  table += '</table><br>';
  return table;
}

// Image Embeds (using CID)
function generateImageEmbeds(imageDir) {
  const imageFiles = fs.readdirSync(imageDir).filter(file =>
    /\.(png|jpg|jpeg)$/i.test(file)
  );

  const attachments = imageFiles.map(file => ({
    filename: file,
    path: path.join(imageDir, file),
    cid: file
  }));

  const html = imageFiles.map(file => `
    <div style="margin-bottom: 30px;">
      <img src="cid:${file}" alt="${file}" style="max-width: 100%; border: 1px solid #ccc; padding: 5px;" />
    </div>
  `).join('');

  return { html, attachments };
}

// //using (base64)
// function generateBase64ImageEmbeds(imageDir) {
//   const imageFiles = fs.readdirSync(imageDir).filter(file =>
//     /\.(png|jpg|jpeg)$/i.test(file)
//   );

//   const html = imageFiles.map(file => {
//     const imagePath = path.join(imageDir, file);
//     const imageData = fs.readFileSync(imagePath).toString('base64');
//     const mimeType = file.endsWith('.png') ? 'image/png'
//                    : file.endsWith('.jpg') || file.endsWith('.jpeg') ? 'image/jpeg'
//                    : 'application/octet-stream';

//     return `
//       <div style="margin-bottom: 30px;">
//         <img src="data:${mimeType};base64,${imageData}" alt="${file}" style="max-width: 100%; border: 1px solid #ccc; padding: 5px;" />
//       </div>
//     `;
//   }).join('');

//   return { html, attachments: [] }; // No attachments needed
// }


// Main builder
function buildEmailBody({ jsonPath, includeAscii, includeTable, includePpt, includeImages, analysisType, sessionDir, filename }) {
  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const summaryData = rawData.summary || rawData; // ✅ Support both formats

  const imageDir = path.join(path.dirname(jsonPath), `${analysisType}_images`);
  let html = '<h2>📊 Crash Report Summary</h2>';
  let attachments = [];

  for (const [section, data] of Object.entries(summaryData)) {
    const isNumeric = typeof data === 'object' && !Array.isArray(data) && Object.values(data).every(v => typeof v === 'number');

    if (includeAscii && isNumeric) {
      html += generateAsciiBarChart(data, section);
    }

    if (includeTable) {
      html += generateHtmlTable(data, section);
    }
  }

  if (includeImages) {
    const imageBlock = generateImageEmbeds(imageDir);
    html += imageBlock.html;
    attachments = imageBlock.attachments;
  }

  //
  // else {
  //     const imageBlock = generateBase64ImageEmbeds(imageDir);
  //     html += imageBlock.html;
  //   }

  if (includePpt) {
    const pptxPath = path.join(sessionDir, filename.replace(/\.csv$/i, '.pptx'));
    if (fs.existsSync(pptxPath)) {
      attachments.push({
        filename: filename.replace(/\.csv$/i, '.pptx'),
        path: pptxPath
      });
    } else {
      console.warn('⚠️ PPTX file not found at:', pptxPath);
    }
  }

  return { html, attachments };
}

module.exports = { buildEmailBody };