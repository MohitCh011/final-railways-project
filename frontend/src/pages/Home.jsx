import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AnalyticsChart from '../components/AnalyticsChart';
import './Home.css';

const API_URL = import.meta.env.VITE_API_URL || '';

function Home() {
    const [stats, setStats] = useState({
        total_incidents: 0,
        critical_issues: 0,
        maintenance_required: 0,
        accuracy: 0
    });

    useEffect(() => {
        // Fetch dashboard statistics
        axios.get(`${API_URL}/api/stats`)
            .then(response => setStats(response.data))
            .catch(error => console.error('Error fetching stats:', error));
    }, []);

    return (
        <div className="container">
            <div className="main-layout">
                <div className="dashboard-content">
                    <section className="hero-compact">
                        <h1 className="hero-title">Track Safety Monitor</h1>
                        <p className="hero-subtitle">Real-time infrastructure analysis overview.</p>
                    </section>

                    <div className="stats-strip">
                        <div className="stat-card-small">
                            <span className="stat-card-icon danger">🚨</span>
                            <div className="stat-card-info">
                                <span className="stat-card-val">{stats.total_incidents}</span>
                                <span className="stat-card-lab">Incidents</span>
                            </div>
                        </div>
                        <div className="stat-card-small">
                            <span className="stat-card-icon warning">⚠️</span>
                            <div className="stat-card-info">
                                <span className="stat-card-val">{stats.critical_issues}</span>
                                <span className="stat-card-lab">Critical</span>
                            </div>
                        </div>
                        <div className="stat-card-small">
                            <span className="stat-card-icon safe">✅</span>
                            <div className="stat-card-info">
                                <span className="stat-card-val">{stats.accuracy}%</span>
                                <span className="stat-card-lab">Accuracy</span>
                            </div>
                        </div>
                    </div>

                    <AnalyticsChart />

                    <section className="issues-list-section">
                        <h2 className="sub-title">Monitored Anomalies</h2>
                        <div className="issues-compact-grid">
                            <div className="issue-item">
                                <div className="issue-type danger">Cracks</div>
                                <p>Structural failure detection.</p>
                            </div>
                            <div className="issue-item">
                                <div className="issue-type warning">Fasteners</div>
                                <p>Loose bolt & clip monitoring.</p>
                            </div>
                            <div className="issue-item">
                                <div className="issue-type info">Vegetation</div>
                                <p>Track clearance & growth.</p>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="dashboard-sidebar">
                    <div className="sidebar-widget">
                        <h3>Quick Actions</h3>
                        <div className="sidebar-actions">
                            <Link to="/capture" className="sidebar-btn primary">
                                📸 New Capture
                            </Link>
                            <Link to="/upload" className="sidebar-btn">
                                📁 Upload File
                            </Link>
                        </div>
                    </div>

                    <div className="sidebar-widget tip-widget">
                        <h3>Safety Protocol</h3>
                        <p>Regular maintenance reduces derailment risk by <strong>85%</strong>. Ensure all loose bolts are tightened within 24 hours of detection.</p>
                    </div>

                    <div className="sidebar-widget status-widget">
                        <div className="status-indicator">
                            <div className="pulse-dot"></div>
                            <span>System Online</span>
                        </div>
                        <p className="status-details">VLM Node: Active<br />Detection Engine: Normal</p>
                    </div>
                </div>
            </div>

            <footer className="dashboard-footer">
                <p className="footer-quotation">"All train tracks or rail repairs investigation at one place"</p>
                <div className="footer-line"></div>
                <p className="copyright">&copy; {new Date().getFullYear()} RailSafe AI. Leading the future of railway safety.</p>
            </footer>
        </div>
    );
}

export default Home;
