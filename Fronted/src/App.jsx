import React,{ useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; 
import { Container, Row, Col } from 'react-bootstrap';
import ChartCard from './components/ChartCard';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import { Modal, Button } from 'react-bootstrap';

// App Component - Main entry point of the application
export default function App() {

  // ----------------- STATE VARIABLES -----------------
  const [mode,       setMode]       = useState('upload');  
  const [csvPath,    setCsvPath]   = useState('');
  const [file,       setFile]      = useState(null);
  const [loading,    setLoading]   = useState(false);
  const [pptUrl,     setPptUrl]    = useState('');
  const [summary, setSummary] = useState({});
  const [showCharts, setShowCharts] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);



  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const openEmailModal = () => setShowEmailModal(true);
  const closeEmailModal = () => setShowEmailModal(false);

  const [emailMode, setEmailMode] = useState('to');
  const [message, setMessage] = useState('');
  const [ascii, setAscii] = useState(false);
  const [table, setTable] = useState(false);
  const [images, setImages] = useState(true);
  const [ppt, setPpt] = useState(false);
  const [bcc, setBcc] = useState('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [filename, setFilename] = useState('');

  const [summaryStatus, setSummaryStatus] = useState('');
  const [analysisType, setAnalysisType] = useState('crash'); 
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [selectorEnabled, setSelectorEnabled] = useState(false);



  //Chart selector
const toggleChartSelection = (chart) => {
  setSelectedCharts(prev => {
    if (prev.includes(chart)) {
      return prev.filter(item => item !== chart); // remove
    } else {
      return [...prev, chart]; // add to end
    }
  });
};

useEffect(() => {
  if (selectorEnabled) {
    setSelectedCharts([]);  //  clear selections on enable
  } else {
    setSelectedCharts(Object.keys(summary));  // show all charts when selector disabled
  }
}, [selectorEnabled, summary]);


//theme
useEffect(() => {
  if (isThemeLoaded) {
    document.body.classList.toggle('dark-theme', darkMode);
    document.body.classList.toggle('light-theme', !darkMode);
  }
}, [darkMode, isThemeLoaded]);


useEffect(() => {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode !== null) {
    setDarkMode(savedMode === 'true');
  }
  setIsThemeLoaded(true); // ✅ Mark as ready
}, []);

if (!isThemeLoaded) return <div className="loading-screen">Loading...</div>;



// Default message body for the email
const defaultEmailMessage = `Hello sir,\nI am writing to submit the analysis of the provided CSV file. I have reviewed the data and compiled insights which I believe will be useful for your evaluation. PFA.\n Best Regards,\n<strong>Jio Team </strong>`




// ----------------- EMAIL HANDLER -----------------
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
  setSendingEmail(true);

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
      filename,
      sessionId,
      selectedCharts,
    });
     if (res.status === 200) {
      setEmailStatus(res.data.message || 'Email sent!');
    } else {
      throw new Error('Unexpected response from server');
    }
  } catch (err) {
    console.error('Email send error:', err);
    setEmailStatus(err.response?.data?.error || 'Failed to send email');
  } finally {
    setSendingEmail(false); // re-enable the button
  }
};




 // ----------------- SUBMIT HANDLER -----------------
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

    // Simulate analysis progress animation
      interval = setInterval(() => {
      setAnalysisProgress(prev => {
        const next = prev + 10;
        if (next >= 100) clearInterval(interval);
        return next;
      });
    }, 100);

    // Send file to backend for analysis
    const res = await axios.post('/analyze/upload', fm, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      }
    });

    clearInterval(interval);

    if (res.status !== 200 || !res.data.pptxUrl || !res.data.sessionId) {
    throw new Error('Invalid response from analysis');
    }

    setPptUrl(res.data.pptxUrl);
    setFilename(file.name); // Save original filename
    setSessionId(res.data.sessionId);
    setSummaryStatus('✅ Analysis complete. Click below to view graphs.');
    setEmailStatus('');

// ✅ Immediately fetch and show summary
  try {
    const res2 = await axios.get(`/download/${res.data.sessionId}/${analysisType}_summary.json`);
    const data = res2.data;
    if (data && data.status === 'success' && typeof data.summary === 'object') {
      setSummary(data.summary);
      setShowCharts(true);
  } else {
      throw new Error('Invalid summary format');
  }
  } catch (err) {
  console.error('Failed to load summary:', err);
  alert('❌ Could not load summary data.');
   }
    
} catch (err) {
    clearInterval(interval);
    console.error('Analysis error:', err);
    alert(`❌ ${err.message}`);
  } finally {
    setLoading(false);
  }
};





// ----------------- LOAD CHART DATA -----------------
const handleShowCharts = async () => {
  try {
    const res = await axios.get(`/download/${sessionId}/${analysisType}_summary.json`);
    if (res.status === 200 && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      setSummary(res.data);
      setShowCharts(true);
      setSelectedCharts(Object.keys(res.data.summary)); 

    } else {
      alert('⚠️ Unexpected summary format.');
    }
  } catch (err) {
    console.error('Failed to load summary:', err);
    alert('❌ Could not load summary data.');
  }
};





 // ----------------- JSX RENDER -----------------
return (
 <div className={`container-fluid ${darkMode ? 'dark-theme' : 'light-theme'}`}>
    <h1 className="app-title">📊 CSV Analyzer</h1>
    <div className="theme-toggle-fixed">
  <button
  className={`btn ${darkMode ? 'btn-outline-light' : 'btn-outline-dark'}`}
  onClick={() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  }}
>
  {darkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
</button>


</div>


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

{pptUrl && (
  <div className="text-center mt-4">
    <button className="btn btn-success" onClick={openEmailModal}>
      📩 Send Report
    </button>
  </div>
)}

<Modal show={showEmailModal} onHide={closeEmailModal} size="lg" centered>
  <Modal.Header closeButton>
    <Modal.Title>📧 Send Report via Email</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <div className="email-checkbox-group">
      <label><input type="checkbox" checked={ascii} onChange={() => setAscii(!ascii)} /> ASCII Graphs</label>
      <label><input type="checkbox" checked={table} onChange={() => setTable(!table)} /> Summary Tables</label>
      <label><input type="checkbox" checked={images} onChange={() => setImages(!images)} /> Graph Images</label>
      <label><input type="checkbox" checked={ppt} onChange={() => setPpt(!ppt)} /> PowerPoint Presentation</label>
    </div>

    <div className="email-mode-selector mt-3">
      <label>Select Email Mode: </label>
      <select value={emailMode} onChange={e => setEmailMode(e.target.value)} className="email-mode-dropdown">
        <option value="to">To Only</option>
        <option value="to-cc">To + CC</option>
        <option value="to-cc-bcc">To + CC + BCC</option>
      </select>
    </div>

    <div className="email-input-group mt-3">
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
          className="email-input mt-2"
          placeholder="CC: optional1@example.com"
          value={cc}
          onChange={e => setCc(e.target.value)}
        />
      )}
      {emailMode === 'to-cc-bcc' && (
        <input
          type="email"
          className="email-input mt-2"
          placeholder="BCC: hidden1@example.com"
          value={bcc}
          onChange={e => setBcc(e.target.value)}
        />
      )}
      <textarea
        className="email-message-textarea mt-3"
        rows={4}
        placeholder={defaultEmailMessage}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="word-count">{message.length} / 300 Char</div>
    </div>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={closeEmailModal}>Close</Button>
    <Button
      variant="primary"
      onClick={handleEmailSend}
      disabled={sendingEmail ||!to.trim() || !to.includes('@') || !pptUrl}
    >
      ✉️ Send Email
    </Button>
    {emailStatus && (
  <div className="text-center mt-3">
    <p className={`email-status ${emailStatus.includes('Failed') ? 'text-danger' : 'text-success'}`}>
      {emailStatus}
    </p>
  </div>
)}
  </Modal.Footer>
</Modal>



{pptUrl && (
      <div className="download-link">
        <a href={pptUrl} target="_blank" rel="noopener noreferrer">📥 Download Presentation</a>
      </div>
    )}


  {pptUrl && summaryStatus && !showCharts && (
      <div className="text-center mt-3">
        <button
          className="btn btn-primary"
          onClick={handleShowCharts}

        >
          📊 Show Graphs
        </button>
      </div>
    )}
{showCharts && (
  <div className="text-center my-3">
    <button
  className={`btn ${selectorEnabled ? 'btn-primary' : 'btn-secondary'}`}
  onClick={() => setSelectorEnabled(!selectorEnabled)}>
  {selectorEnabled ? 'Disable Selector' : 'Enable Selector'}
</button>

  </div>
)}

  {showCharts && !showEmailModal && Object.keys(summary).length > 0 && (
  <Container fluid className="mt-4">
    <h4 className="mb-4">📊 Visual Graph</h4>
    <Row> 
{Object.entries(summary).map(([title, data], idx) => (
  <Col key={idx} xs={12} md={6} className="mb-4">
    {selectorEnabled && (
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          checked={selectedCharts.includes(title)}
          onChange={() => toggleChartSelection(title)}
          id={`chart-${idx}`}
        />
        <label className="form-check-label" htmlFor={`chart-${idx}`}>
          <strong>{idx + 1}.</strong> {title}
        </label>
        <span className="badge bg-secondary ms-2">
          {selectedCharts.includes(title) ? selectedCharts.indexOf(title) + 1 : ''}
        </span>
      </div>
    )}
    {!selectorEnabled && (
      <h5><strong>{idx + 1}.</strong> {title}</h5>
    )}
    <ChartCard title={title} data={data} type="bar" size="large" darkMode={darkMode} />
  </Col>
))}


       
    </Row>
  </Container>
)}
  </div>
)};