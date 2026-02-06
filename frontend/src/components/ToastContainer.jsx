import { useState, useEffect } from 'react';
import { toast } from '../services/ToastService';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        return toast.subscribe((message, type, duration) => {
            const id = Date.now();
            setToasts(prev => [...prev, { id, message, type }]);

            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        });
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast-item ${t.type} fade-in`}>
                    <div className="toast-icon">
                        {t.type === 'success' && <CheckCircle size={20} />}
                        {t.type === 'error' && <AlertCircle size={20} />}
                        {t.type === 'warning' && <AlertTriangle size={20} />}
                        {t.type === 'info' && <Info size={20} />}
                    </div>
                    <div className="toast-message">{t.message}</div>
                    <button className="toast-close" onClick={() => removeToast(t.id)}>
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
