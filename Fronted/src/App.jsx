// frontend/src/App.jsx
import React,{ useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; 
import { Container, Row, Col } from 'react-bootstrap';
import ChartCard from './components/ChartCard';
import 'bootstrap/dist/css/bootstrap.min.css'; 


export default function App() {
  const [mode,       setMode]       = useState('upload');  
  const [csvPath,    setCsvPath]   = useState('');
  const [file,       setFile]      = useState(null);
  const [loading,    setLoading]   = useState(false);
  const [pptUrl,     setPptUrl]    = useState('');
  const [summary, setSummary] = useState({});
  const [showCharts, setShowCharts] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const [emailStatus, setEmailStatus] = useState('');
  const [emailMode, setEmailMode] = useState('to');
  const [message, setMessage] = useState('');
  const [ascii, setAscii] = useState(true);
  const [table, setTable] = useState(false);
  const [images, setImages] = useState(true);
  const [ppt, setPpt] = useState(false);
  const [bcc, setBcc] = useState('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [filename, setFilename] = useState('');

  const [summaryStatus, setSummaryStatus] = useState('');
  const [analysisType, setAnalysisType] = useState('crash'); // or 'anr'

const defaultEmailMessage = `Hello sir,\nI am writing to submit the analysis of the provided CSV file. I have reviewed the data and compiled insights which I believe will be useful for your evaluation. PFA.\n Best Regards,\n<strong>Jio Team </strong>`

  // email send function
  const handleEmailSend = async () => {
  if (!to.trim()) {
    alert('Please enter at least one recipient email.');
    return;
  }
  if (!pptUrl) {
    alert('Please complete the analysis before sending an email.');
    return;
  }
  if (!ascii && !table && !images && !ppt) {
    alert('Please select at least one report type to send.');
    return;
  }
   if (!to.includes('@')) {
    alert('Please enter a valid email address.');
    return;
  }
  const trimmedMessage = message.trim();
  if (trimmedMessage.length > 300) {
    alert('Custom message exceeds 300-character limit');
    return;
  }


  // Prepare email data
  setEmailStatus('Sending...');
  try {
    const res = await axios.post('/email/send', {
      to,
      cc,
      bcc,
      message: trimmedMessage || defaultEmailMessage,
      ascii,
      table,
      images,
      ppt,
      analysisType,
      filename
    });
     if (res.status === 200) {
      setEmailStatus(res.data.message || 'Email sent!');
    } else {
      throw new Error('Unexpected response from server');
    }
  } catch (err) {
    console.error('Email send error:', err);
    setEmailStatus(err.response?.data?.error || 'Failed to send email');
  }
};



const handleSubmit = async e => {
  e.preventDefault();
  setLoading(true);
  setSummary({});
  setShowCharts(false);
  setSummaryStatus('');
  setPptUrl('');
  setUploadProgress(0);
  setAnalysisProgress(0);
   let interval = null;
  try {
    if (!file) throw new Error('No file uploaded');

    const fm = new FormData();
    fm.append('csv', file);
    fm.append('type', analysisType);

      interval = setInterval(() => {
      setAnalysisProgress(prev => {
        const next = prev + 10;
        if (next >= 100) clearInterval(interval);
        return next;
      });
    }, 100);

    const res = await axios.post('/analyze/upload', fm, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      }
    });

    clearInterval(interval);

    if (res.status !== 200 || !res.data.pptxUrl) {
      throw new Error('Invalid response from analysis');
    }
    // setAnalysisProgress(100);
    setPptUrl(res.data.pptxUrl);
    setSummaryStatus('✅ Analysis complete. Click below to view graphs.');
    setEmailStatus('');
  } catch (err) {
    clearInterval(interval);
    console.error('Analysis error:', err);
    alert(`❌ ${err.message}`);
  } finally {
    setLoading(false);
  }
};

//show chart
const handleShowCharts = async () => {
  try {
    const res = await axios.get(`/output/${analysisType}_summary.json`);
    // console.log('📦 Summary response:', res.data);

    // Accept any non-null object
    if (res.status === 200 && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      setSummary(res.data);
      setShowCharts(true);
    } else {
      alert('⚠️ Unexpected summary format.');
    }
  } catch (err) {
    console.error('Failed to load summary:', err);
    alert('❌ Could not load summary data.');
  }
};

return (
  <div className="container-fluid">
    <h1 className="app-title">📊 CSV Analyzer</h1>
<div className="selector-row">
  <div className="selector-group">
    <label>Select Report Type:</label>
    <select value={analysisType} onChange={(e) => setAnalysisType(e.target.value)}>
      <option value="anr">JioSphere ANR Report</option>
      <option value="crash">Crash Report</option>
    </select>
  </div>

  <div className="selector-group">
    <label>Select Mode:</label>
    <select value={mode} onChange={(e) => setMode(e.target.value)}>
      <option value="upload">Upload File</option>
    </select>
  </div>
</div>

{loading && (
  <div className="progress-wrapper mt-3">
    <label>📤 Uploading: {uploadProgress}%</label>
    <div className="progress mb-2">
      <div
        className="progress-bar"
        role="progressbar"
        style={{ width: `${uploadProgress}%` }}
      />
    </div>

    {uploadProgress === 100 && !pptUrl && (
      <div className="text-center mt-2">
        <label>⚙️ Analyzing, please wait...</label>
        <div className="spinner-border text-warning ms-2" role="status" />
      </div>
    )}
  </div>
)}


    <form onSubmit={handleSubmit}>
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} />
      <button type="submit" className="submit-button" disabled={loading ||!file}>
        {loading ? 'Analyzing…' : 'Start Analysis'}
      </button>
    </form>

  {summaryStatus && (
      <p className="text-success text-center mt-3">{summaryStatus}</p>
    )}

   
<div className="email-section-container">
  <h3 className="email-heading">📧 Send Report via Email</h3>

  <div className="email-checkbox-group">
    <label><input type="checkbox" checked={ascii} onChange={() => setAscii(!ascii)} /> ASCII Graphs</label>
    <label><input type="checkbox" checked={table} onChange={() => setTable(!table)} /> Summary Tables</label>
    <label><input type="checkbox" checked={images} onChange={() => setImages(!images)} /> Graph Images</label>
    <label><input type="checkbox" checked={ppt} onChange={() => setPpt(!ppt)} /> PowerPoint Presentation</label>
  </div>

  {/* Selector for email mode */}
  <div className="email-mode-selector">
    <label>Select Email Mode: </label>
    <select value={emailMode} onChange={e => setEmailMode(e.target.value)} className="email-mode-dropdown">
      <option value="to">To Only</option>
      <option value="to-cc">To + CC</option>
      <option value="to-cc-bcc">To + CC + BCC</option>
    </select>
  </div>

  <div className="email-input-group">
    
    <input
      type="email"
      className="email-input"
      placeholder="To: user1@example.com, user2@example.com"
      value={to}
      onChange={e => setTo(e.target.value)}
    />
    {(emailMode === 'to-cc' || emailMode === 'to-cc-bcc') && (
      <input
        type="email"
        className="email-input"
        placeholder="CC: optional1@example.com, optional2@example.com"
        value={cc}
        onChange={e => setCc(e.target.value)}
      />
    )}
    {emailMode === 'to-cc-bcc' && (
      <input
        type="email"
        className="email-input"
        placeholder="BCC: hidden1@example.com, hidden2@example.com"
        value={bcc}
        onChange={e => setBcc(e.target.value)}
      />
    )}
    <label htmlFor="emailMessage"></label>
  <textarea
    id="emailMessage"
    className="email-message-textarea"
    rows={4}
    placeholder={defaultEmailMessage}
    value={message}
    onChange={(e) => setMessage(e.target.value)
    }
  />
  <div className="word-count">
  {message.length} / 300 Char
</div>
  </div>

  <button
    className="email-send-button"
    disabled={!to.trim() || !to.includes('@') || !pptUrl}
    onClick={handleEmailSend}
  >
    ✉️ Send Email
  </button>

  {emailStatus && <p className="email-status">{emailStatus}</p>}
</div>

 {pptUrl && (
      <div className="download-link">
        <a href={pptUrl} target="_blank" rel="noopener noreferrer">📥 Download Presentation</a>
      </div>
    )}


  {pptUrl && summaryStatus && (
      <div className="text-center mt-3">
        <button
          className="btn btn-primary"
          onClick={handleShowCharts}

        >
          📊 Show Graphs
        </button>
      </div>
    )}

  {showCharts && Object.keys(summary).length > 0 && (
  <Container fluid className="mt-4">
    <h4 className="mb-4">📊 Visual Graph</h4>
    <Row> 
      {Object.entries(summary).map(([title, data], idx) => (
        // console.log(`Rendering chart for: ${title}`, data),
        <Col key={idx} xs={5} md={6}>
          <ChartCard title={title} data={data} type="bar" size="large" />
        </Col>
      ))}
    </Row>
  </Container>
)}
  </div>
)};