// frontend/src/App.jsx
import React,{ useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; 
import { Container, Row, Col } from 'react-bootstrap';
import ChartCard from './components/ChartCard';
import 'bootstrap/dist/css/bootstrap.min.css'; 


export default function App() {
  const [mode,       setMode]       = useState('local');
  const [showBrowser, setShow]     = useState(false);
  const [currentDir, setDir]       = useState('');      
  const [entries,    setEntries]   = useState([]);
  const [csvPath,    setCsvPath]   = useState('');
  const [file,       setFile]      = useState(null);
  const [loading,    setLoading]   = useState(false);
  const [pptUrl,     setPptUrl]    = useState('');
  const [summary, setSummary] = useState({});
  const [showCharts, setShowCharts] = useState(false);
  
  const [emailStatus, setEmailStatus] = useState('');
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


  // Load folder contents whenever modal opens or dir changes
  useEffect(() => {
    if (!showBrowser) return;
    axios
      .get('/fs/list', { params: { path: currentDir } })
      .then(res => setEntries(res.data.files))
      .catch(err => alert(err.message));
  }, [showBrowser, currentDir]);

  const goUp = () => {
    if (!currentDir) return;
    const parts = currentDir.split('/');
    const parent = parts.length > 1 ?+ parts.slice(0, -1).join('/') : '';
    setDir(parent);
  };

 const pickItem = e => {
    const next = currentDir ? `${currentDir}/${e.name}` : e.name;
    if (e.type==='dir') {
      setDir(next);
    } else {
      setCsvPath(next);
      setShow(false);
    }
  };

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

  // Prepare email data
  setEmailStatus('Sending...');
  try {
    const res = await axios.post('/email/send', {
      to,
      cc,
      bcc,
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
  try {
    let res;
 if (mode === 'local') {
  if (!csvPath) throw new Error('No CSV path selected');
  res = await axios.get('/analyze/local', {
    params: { csvPath, type: analysisType }
  });
} else {
  if (!file) throw new Error('No file uploaded');
  const fm = new FormData();
  fm.append('csv', file);
  fm.append('type', analysisType);
  res = await axios.post('/analyze/upload', fm, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}
    if (res.status !== 200 || !res.data.pptxUrl) {
      throw new Error('Invalid response from analysis');
    }
    setPptUrl(res.data.pptxUrl);
    setSummaryStatus('✅ Analysis complete. Click below to view graphs.');
    setEmailStatus('');
    // setShowCharts(false);
  } catch (err) {
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
    <h1 className="app-title">📊 CSV → PPTX Analyzer</h1>
<div className="mode-selection">
  <label className="mode-option">
    <input
      type="radio"
      value="crash"
      checked={analysisType === 'crash'}
      onChange={() => setAnalysisType('crash')}
    />
    Crash Report
  </label>
  <label className="mode-option">
    <input
      type="radio"
      value="anr"
      checked={analysisType === 'anr'}
      onChange={() => setAnalysisType('anr')}
    />
    JioSphere ANR Report
  </label>
</div>

    <div className="mode-selection">
      <label className="mode-option">
        <input type="radio" value="local" checked={mode === 'local'} onChange={() => setMode('local')} />
        Browse Server
      </label>
      <label className="mode-option">
        <input type="radio" value="upload" checked={mode === 'upload'} onChange={() => setMode('upload')} />
        Upload File
      </label>
    </div>

    <form onSubmit={handleSubmit}>
      {mode === 'local' ? (
        <div>
          <button type="button" className="browse-button" onClick={() => setShow(true)}>
            {csvPath ? 'Change CSV…' : 'Browse Server…'}
          </button>
          {csvPath && (
            <div className="selected-path">
              Selected: <code>{csvPath}</code>
            </div>
          )}
        </div>
      ) : (
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} />
      )}

      <button type="submit" className="submit-button" disabled={loading || (mode === 'local' ? !csvPath : !file)}>
        {loading ? 'Analyzing…' : 'Start Analysis'}
      </button>
    </form>

    {pptUrl && (
      <div className="download-link">
        <a href={pptUrl} target="_blank" rel="noopener noreferrer">📥 Download Presentation</a>
      </div>
    )}

    {summaryStatus && (
      <p className="text-success text-center mt-3">{summaryStatus}</p>
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

    {showBrowser && (
      <>
        <div className="modal-overlay" onClick={() => setShow(false)} />
        <div className="modal-box">
          <div className="modal-header">
            <button className="modal-up-button" onClick={goUp} disabled={!currentDir}>↑ Up</button>
            <span className="modal-path">{currentDir || '/'}</span>
            <button className="modal-close-button" onClick={() => setShow(false)}>✕</button>
          </div>
          <ul className="file-list">
            {entries.map(e => (
              <li key={e.name} className="file-item">
                <button className="file-button" onClick={() => pickItem(e)}>
                  {e.type === 'dir' ? '📁' : '📄'} {e.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </>
    )}

    <div className="email-section">
      <h3 className="email-heading">📧 Send Report via Email</h3>
      <div className="email-options">
        <label>
          <input type="checkbox" checked={ascii} onChange={() => setAscii(!ascii)} /> ASCII Graphs
        </label>
        <label>
          <input type="checkbox" checked={table} onChange={() => setTable(!table)} /> Summary Tables
        </label>
        <label>
          <input type="checkbox" checked={images} onChange={() => setImages(!images)} /> Graph Images
        </label>
        <label>
          <input type="checkbox" checked={ppt} onChange={() => setPpt(!ppt)} /> PowerPoint Presentation
        </label>
      </div>
      <input
        type="text"
        className="email-input"
        placeholder="To: user1@example.com, user2@example.com"
        value={to}
        onChange={e => setTo(e.target.value)}
      />
      <input
        type="text"
        className="email-input"
        placeholder="CC: optional1@example.com, optional2@example.com"
        value={cc}
        onChange={e => setCc(e.target.value)}
      />
      <input
        type="text"
        className="email-input"
        placeholder="BCC: hidden1@example.com, hidden2@example.com"
        value={bcc}
        onChange={e => setBcc(e.target.value)}
      />
      
      <button className="email-send-button" disabled={!to.trim()} onClick={handleEmailSend}>
        Send Email
      </button>
      {emailStatus && <p className="email-status">{emailStatus}</p>}
    </div>

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