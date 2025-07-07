// function generateSmartGraphWithMargin(data, title) {
//   const keys = Object.keys(data);
//   const values = Object.values(data);
//   const max = Math.max(...values);

//   const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
//   const roundedMax = Math.ceil(max / magnitude) * magnitude;

//   const step = Math.ceil(roundedMax / 8);
//   const yTicks = [];
//   for (let i = roundedMax; i >= 0; i -= step) {
//     yTicks.push(i);
//   }

//   const colWidth = 6; // fixed width for each bar column
//   const lines = [];

//   // Helper to center a symbol in a column
//   const center = (symbol) => {
//     const pad = Math.floor((colWidth +2) / 2);
//     return ' '.repeat(pad) + symbol + ' '.repeat(colWidth - pad - 1);
//   };

//   // Build graph rows
//   for (const y of yTicks) {
//     let row = String(y).padStart(6) + ' |';
//     keys.forEach((key) => {
//       const val = data[key];
//       const hasFull = val >= y;
//       const isPartial = val < y && val >= y - step / 2;

//       const symbol = hasFull ? '🟦' : isPartial ? '🔺' : ' ';
//       const content = symbol === ' ' ? ' '.repeat(colWidth) : center(symbol);
//       row += content;
//     });
//     lines.push(row);
//   }

//   // Axis line
//   const axis = '       +' + '-'.repeat(keys.length * colWidth);

//   // Label line: 5 characters + '..' if needed, then 1 space
//   const nameLine = '       ' + keys.map(k => {
//     const short = k.length > 5 ? k.slice(0, 5) + '..' : k.padEnd(7);
//     return short + ' ';
//   }).join('');

//   // Full-name legend
//   const legend = keys.map(k => `• ${k}`).join('<br>');

//   return `
// <h3>${title}</h3>
// <pre style="font-family: monospace; line-height: 1.2;">
// ${title} ↑
// ${lines.join('\n')}
// ${axis}
// ${nameLine}
// </pre>
// <p><strong>Legend:</strong><br>${legend}</p>`;
// }

// module.exports = { generateSmartGraphWithMargin };