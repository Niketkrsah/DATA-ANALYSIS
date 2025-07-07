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
    filename
  } = req.body;

  const toList = parseEmails(to);
  const ccList = parseEmails(cc);
  const bccList = parseEmails(bcc);

  if (!toList.length) {
    return res.status(400).json({ error: 'At least one recipient is required in the "to" field' });
  }

  const jsonPath = path.join(__dirname, `../output/${analysisType}_summary.json`);

  let html, attachments;
  try {
    ({ html, attachments } = buildEmailBody({
      jsonPath,
      includeAscii: ascii,
      includeTable: table,
      includeImages: images,
      includePpt: ppt,
      analysisType,

      //useBase64: false

    }));
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
    res.json({ message: 'Email sent successfully!' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;
