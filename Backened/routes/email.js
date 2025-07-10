const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const { buildEmailBody } = require('../utils/emailBodyBuilder');
const { text } = require('stream/consumers');

const router = express.Router();

// comma separated email lists
const parseEmails = str =>
str?.split(',').map(e => e.trim()).filter(Boolean) || [];
router.post('/send', async (req, res) => {
  const {
    to,
    cc = '',
    bcc = '',
    ascii = false,
    table = false,
    images = false,
    ppt = false,
    analysisType,
    selectedCharts = [],
    filename,
    sessionId, // ✅ Extract sessionId from request
    message = ''
  } = req.body;

  if (!sessionId || !analysisType || !filename) {
    return res.status(400).json({ error: 'Missing sessionId, analysisType, or filename' });
  }

  // Validate and sanitize message
  const sanitizeMessage = (msg) => {
    if (!msg || typeof msg !== 'string') {
      throw new Error('Custom message must be a valid string');
    }
    if (msg.length > 300) {
      throw new Error('Custom message exceeds 300-character limit');
    }
    return msg;
  };

  let customMessage;
  try {
    customMessage = sanitizeMessage(message).replace(/\n/g, '<br>');
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const toList = parseEmails(to);
  const ccList = parseEmails(cc);
  const bccList = parseEmails(bcc);

  if (!toList.length) {
    return res.status(400).json({ error: 'At least one recipient is required in the "to" field' });
  }

  const sessionDir = path.join(__dirname, `../output/${sessionId}`);
  const jsonPath = path.join(sessionDir, `${analysisType}_summary.json`);
  const pptxPath = path.join(sessionDir, filename.replace(/\.csv$/i, '.pptx'));

  let html, attachments;
  try {
    ({ html, attachments } = buildEmailBody({
      jsonPath,
      includeAscii: ascii,
      includeTable: table,
      includeImages: images,
      includePpt: ppt,
      analysisType,
      sessionDir,
      selectedCharts,
      filename //  Pass filename for PPTX attachment
    }));

    html = `<div style="margin-bottom: 1em;">${customMessage}</div>` + html;
  } catch (err) {
    console.error('Failed to build email body:', err);
    return res.status(500).json({ error: 'Failed to build email content' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'Niketkrsah@gmail.com',
      pass: 'chxymumrpfdxiyfs'
    }
  });

  const mailOptions = {
    from: 'Niketkrsah@gmail.com',
    to: toList,
    cc: ccList.length > 0 ? ccList : undefined,
    bcc: bccList.length > 0 ? bccList : undefined,
    subject: `📈 ${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} Report Summary`,
    html,
    attachments
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;
