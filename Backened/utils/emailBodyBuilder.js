const fs = require('fs');
const path = require('path');

const titleToFilenameMap = {
  crash: {
    "Crash Frequency by Signal": "signal_freq.png",
    "Top Error Types": "error_types.png",
    "Top Backtrace Chains": "top_backtrace_chain.png",
    "Top STB Serial Numbers": "STB_Serial_NO.png",
    "Top STB Models": "STB_Model.png",
    "Faulting Libraries": "faulting_libraries.png",
    "Crashes by State": "by_state.png"
  },
  anr: {
    "Top ANR Activities": "top_anr_activities.jpg",
    "ANR by App Version": "anr_by_version.jpg",
    "ANR by State": "anr_by_state.jpg",
    "ANR by Hour": "anr_by_hour.jpg",
    "Available Memory Ranges": "mi4_available_memory_ranges.jpg",
    "Simplified ANR Subjects": "anr_subject_simplified.jpg",
    "Top 5 STB Series": "top_5_stb_series_vertical.jpg",
    "Customer Product Types": "top_5_customer_product_types.jpg",
    "No Focused Window": "focused_window_anrs.jpg"
  }
};



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

  let table = `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">`;
  table += `<tr><th>${title}</th><th>Value</th></tr>`;
  for (const [key, value] of Object.entries(data)) {
    table += `<tr><td>${key}</td><td>${value}</td></tr>`;
  }
  table += '</table><br>';
  return table;
}

// Image Embeds (using CID)
function generateImageEmbeds(imageDir, wantedImages = null) {
 let imageFiles = fs.readdirSync(imageDir).filter(file =>
  /\.(png|jpg|jpeg)$/i.test(file)
);

if (wantedImages) {
  imageFiles = wantedImages.filter(file => fs.existsSync(path.join(imageDir, file)));
}else {
    // Default: load all images in any order
    imageFiles = fs.readdirSync(imageDir).filter(file =>
      /\.(png|jpg|jpeg)$/i.test(file)
    );
  }


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
function buildEmailBody({ jsonPath, includeAscii, includeTable, includePpt, includeImages, analysisType, sessionDir, filename,selectedCharts = [] }) {
  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const summaryData = rawData.summary || rawData; // ✅ Support both formats
  let filteredSummary = summaryData;
if (Array.isArray(selectedCharts) && selectedCharts.length > 0) {
  filteredSummary = {};
  selectedCharts.forEach(title => {
    if (summaryData[title]) {
      filteredSummary[title] = summaryData[title];
    }
  });
}


  const imageDir = path.join(path.dirname(jsonPath), `${analysisType}_images`);
  let html = `<h2>📊 ${analysisType.toUpperCase()} Report Summary</h2>`;

  let attachments = [];

 for (const [section, data] of Object.entries(filteredSummary)) {
  const isNumeric = typeof data === 'object' && !Array.isArray(data) && Object.values(data).every(v => typeof v === 'number');

  if (includeAscii && isNumeric) {
    html += generateAsciiBarChart(data, section);
  }

  if (includeTable) {
    html += generateHtmlTable(data, section);
  }
}


  if (includeImages) {
  let wantedImages = null;
  if (selectedCharts.length > 0) {
  const mapping = titleToFilenameMap[analysisType] || {};
  wantedImages = selectedCharts.map(title => {
  const file = mapping[title];
  if (!file) console.warn(`⚠️ Missing image mapping for title "${title}" in ${analysisType}`);
  return file;
}).filter(Boolean);

  }

  const imageBlock = generateImageEmbeds(imageDir, wantedImages);
  html += imageBlock.html;
  attachments = attachments.concat(imageBlock.attachments);
}


  //
  // else {
  //     const imageBlock = generateBase64ImageEmbeds(imageDir);
  //     html += imageBlock.html;
  //   }

  // 🎯 PPT generation with filtered charts and uploaded filename


  
  if (includePpt && selectedCharts.length > 0) {
    const execSync = require('child_process').execSync;
    const filteredTitles = selectedCharts.join(';;');
    const outputPptFilename = filename.replace(/\.csv$/i, '.pptx');
    const pythonScript = path.join( 'python', 'generate_filtered_ppt.py');


    try {
      execSync(`py "${pythonScript}" "${sessionDir}" "${analysisType}" "${filteredTitles}" "${outputPptFilename}"`, {
        stdio: 'inherit'
      });

      const pptxPath = path.join(sessionDir, outputPptFilename);
      if (fs.existsSync(pptxPath)) {
        attachments.push({
          filename: outputPptFilename,
          path: pptxPath
        });
      } else {
        console.warn('⚠️ PPTX not found after generation:', pptxPath);
      }
    } catch (err) {
      console.warn('⚠️ PPT generation failed:', err.message);
    }
  }



// Attach filtered or full PPT
// if (includePpt) {
//   const pptxPath = path.join(sessionDir, filename.replace(/\.csv$/i, '.pptx'));
//   if (fs.existsSync(pptxPath)) {
//     attachments.push({
//       filename: filename.replace(/\.csv$/i, '.pptx'),
//       path: pptxPath
//     });
//   } else {
//     console.warn('⚠️ PPTX file not found at:', pptxPath);
//   }
// }



  return { html, attachments };
}

module.exports = { buildEmailBody };