import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { History } from 'lucide-react';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Capture from './pages/Capture';
import HistorySidebar from './components/HistorySidebar';
import ToastContainer from './components/ToastContainer';
import Intro from './components/Intro';

import './App.css';

function App() {
  const [showHistory, setShowHistory] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  if (showIntro) {
    return <Intro onFinish={() => setShowIntro(false)} />;
  }

  return (
    <Router>
      <div className="app dashboard-entry">
        <ToastContainer />
        <nav className="navbar">
          <div className="navbar-container">
            <Link to="/" className="navbar-brand">
              <span className="brand-icon">🚂</span>
              RailSafe AI
            </Link>

            <ul className="navbar-menu">
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/upload">Upload</Link></li>
              <li><Link to="/capture">Capture</Link></li>
            </ul>

            <div className="navbar-actions">
              <button className="nav-action-btn" onClick={() => setShowHistory(true)} title="History">
                <History size={20} />
              </button>
            </div>
          </div>
        </nav>

        <HistorySidebar
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onSelectResult={(result) => {
            console.log("Selected result from history:", result);
          }}
        />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/capture" element={<Capture />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
