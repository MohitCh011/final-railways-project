import { X, Trash2, Calendar, ShieldCheck, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import './HistorySidebar.css';

const HistorySidebar = ({ isOpen, onClose, onSelectResult }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const loadHistory = () => {
            const savedHistory = JSON.parse(localStorage.getItem('detectionHistory') || '[]');
            setHistory(savedHistory.reverse()); // Show newest first
        };

        if (isOpen) {
            loadHistory();
            // Listen for storage changes
            window.addEventListener('storage', loadHistory);
        }

        return () => window.removeEventListener('storage', loadHistory);
    }, [isOpen]);

    const clearHistory = () => {
        if (window.confirm('Clear all detection history?')) {
            localStorage.setItem('detectionHistory', '[]');
            setHistory([]);
        }
    };

    const deleteItem = (idx, e) => {
        e.stopPropagation();
        const updatedHistory = [...history];
        updatedHistory.splice(idx, 1);
        const rawToSave = [...updatedHistory].reverse();
        localStorage.setItem('detectionHistory', JSON.stringify(rawToSave));
        setHistory(updatedHistory);
    };

    return (
        <div className={`history-sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="history-sidebar" onClick={e => e.stopPropagation()}>
                <div className="history-header">
                    <h2><History size={20} /> Detection History</h2>
                    <div className="history-header-actions">
                        <button className="clear-btn" onClick={clearHistory} title="Clear All">
                            <Trash2 size={18} />
                        </button>
                        <button className="close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="history-list">
                    {history.length === 0 ? (
                        <div className="empty-history">
                            <p>No recent detections found.</p>
                            <span className="hint">Your captures will appear here automatically.</span>
                        </div>
                    ) : (
                        history.map((item, idx) => (
                            <div key={idx} className="history-item" onClick={() => { onSelectResult(item); onClose(); }}>
                                <div className="history-item-thumb">
                                    {item.result_image ? (
                                        <img src={item.result_image} alt="Thumbnail" />
                                    ) : (
                                        <div className="thumb-placeholder">📷</div>
                                    )}
                                </div>
                                <div className="history-item-info">
                                    <div className="item-meta">
                                        <span className="item-date"><Calendar size={12} /> {new Date(item.timestamp).toLocaleDateString()}</span>
                                        <span className={`item-severity ${item.detections?.length > 0 ? 'danger' : 'safe'}`}>
                                            {item.detections?.length > 0 ? '⚠️ Detected' : '✅ Clear'}
                                        </span>
                                    </div>
                                    <div className="item-title">
                                        {item.report?.defect_summary?.detected_defect || item.detections?.[0]?.class || "Track Analysis"}
                                    </div>
                                </div>
                                <button className="delete-item-btn" onClick={(e) => deleteItem(idx, e)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistorySidebar;
