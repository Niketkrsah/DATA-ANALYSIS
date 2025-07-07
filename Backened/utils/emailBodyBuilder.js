const fs = require('fs');
const path = require('path');

// ASCII Bar Chart
function generateAsciiBarChart(data, title) {
  const maxLabelLength = Math.max(...Object.keys(data).map(k => k.length));
  const maxValue = Math.max(...Object.values(data));
  const scale = maxValue > 50 ? 50 / maxValue : 1;

  let chart = `\n<b>${title}</b>\n<pre style="font-family: monospace;">`;
  for (const [label, value] of Object.entries(data)) {
    const bar = '█'.repeat(Math.round(value * scale));
    chart += `${label.padEnd(maxLabelLength)} | ${bar} (${value})\n`;
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
function buildEmailBody({ jsonPath, includeAscii, includeTable, includePpt, includeImages, analysisType }) {
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const imageDir = path.join(path.dirname(jsonPath), `${analysisType}_images`);



  let html = '<h2>📊 Crash Report Summary</h2>';
  let attachments = [];

  for (const [section, data] of Object.entries(jsonData)) {
    const isNumeric = typeof data === 'object' && !Array.isArray(data) && Object.values(data).every(v => typeof v === 'number');

    if (includeAscii && isNumeric) {
      html += generateAsciiBarChart(data, section);
    }

    if (includeTable) {
      html += generateHtmlTable(data, section);
    }
  }

// Images
  if (includeImages) {
    const imageBlock = generateImageEmbeds(imageDir);
    html += imageBlock.html;
    attachments = imageBlock.attachments;
  }


  // else {
  //     const imageBlock = generateBase64ImageEmbeds(imageDir);
  //     html += imageBlock.html;
  //   }


  
  // ppt
 if (includePpt) {
  const pptxPath = path.join(path.dirname(jsonPath), `${filename}.pptx`);
  console.log('📁 Checking for PPTX file at:', pptxPath);

  if (fs.existsSync(pptxPath)) {
    console.log('📎 PPTX file found, adding to attachments');
    attachments.push({
      filename: `${filename}.pptx`,
      path: pptxPath
    });
  } else {
    console.warn('⚠️ PPTX file not found at:', pptxPath);
  }
}


  return { html, attachments };
}

module.exports = { buildEmailBody };