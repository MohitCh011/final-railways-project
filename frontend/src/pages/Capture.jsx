import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ImageSlider from '../components/ImageSlider';
import { saveToHistory } from '../utils/historyUtils';
import { toast } from '../services/ToastService';
import './Capture.css';

const API_URL = import.meta.env.VITE_API_URL || '';

function Capture() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const reportRef = useRef(null);

    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [analysisMode, setAnalysisMode] = useState('standard');
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);

    // Start camera stream on mount
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        setError(null);
        try {
            const constraints = {
                video: {
                    facingMode: 'environment', // Use back camera if available
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            const userStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(userStream);
            if (videoRef.current) {
                videoRef.current.srcObject = userStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please ensure you have granted permission.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        setPreview(imageData);
        stopCamera();
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setPreview(null);
        setResults(null);
        startCamera();
    };

    const dataURLtoFile = (dataurl, filename) => {
        let arr = dataurl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const handleAnalyze = async () => {
        if (!capturedImage) return;

        setLoading(true);
        const file = dataURLtoFile(capturedImage, `capture_${new Date().getTime()}.jpg`);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const endpoint = analysisMode === 'deep' ? '/api/analyze_deep' : '/api/upload';
            const response = await axios.post(`${API_URL}${endpoint}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setResults(response.data);

            // Save to history and show toast
            saveToHistory({
                ...response.data,
                preview: capturedImage, // The "before" image
                mode: analysisMode
            });

            if (response.data.detections && response.data.detections.length > 0) {
                toast.warning(`Safety Alert: ${response.data.detections.length} defect(s) detected.`);
            } else {
                toast.success("Analysis Complete: No critical defects found.");
            }
        } catch (error) {
            console.error('Error analyzing capture:', error);
            const errorMsg = error.response?.data?.error || 'Error connecting to the server.';
            toast.error(`Analysis Failed: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);

        setTimeout(async () => {
            try {
                const canvas = await html2canvas(reportRef.current, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    windowWidth: 1200,
                    onclone: (clonedDoc) => {
                        const element = clonedDoc.querySelector('.results-wrapper');
                        if (element) {
                            element.style.padding = '40px';
                            element.style.borderRadius = '0';
                            element.style.background = '#ffffff';
                        }
                    }
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = pdfWidth / imgWidth;
                const canvasPageHeight = pdfHeight / ratio;

                let heightLeft = imgHeight;
                let position = 0;
                let page = 1;

                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight * ratio);
                heightLeft -= canvasPageHeight;

                while (heightLeft > 0) {
                    position = -(page * pdfHeight);
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight * ratio);
                    heightLeft -= canvasPageHeight;
                    page++;
                }

                pdf.save(`RailSafe_Capture_Report_${new Date().getTime()}.pdf`);
            } catch (err) {
                console.error("PDF Export failed:", err);
            } finally {
                setIsExporting(false);
            }
        }, 500);
    };

    const handleBackToDashboard = () => {
        navigate('/');
    };

    return (
        <div className="container">
            <h1 className="page-title">Capture Track Analysis</h1>

            {!capturedImage && !results && (
                <div className="capture-viewport-container">
                    {error ? (
                        <div className="camera-error">
                            <p>{error}</p>
                            <button className="btn btn-primary" onClick={startCamera}>Try Again</button>
                        </div>
                    ) : (
                        <>
                            <div className="viewfinder">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="camera-feed"
                                />
                                <div className="viewfinder-overlay">
                                    <div className="corner top-left"></div>
                                    <div className="corner top-right"></div>
                                    <div className="corner bottom-left"></div>
                                    <div className="corner bottom-right"></div>
                                </div>
                            </div>
                            <div className="capture-controls">
                                <button className="capture-btn" onClick={handleCapture}>
                                    <div className="shutter-inner"></div>
                                </button>
                                <p className="capture-hint">Point camera at the track and tap to capture</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {capturedImage && !results && (
                <div className="preview-section fade-in">
                    <h2>Capture Preview</h2>
                    <img src={capturedImage} alt="Captured" className="preview-image" />

                    <div className="mode-selection">
                        <label className={`mode-card ${analysisMode === 'standard' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="analysisMode"
                                value="standard"
                                checked={analysisMode === 'standard'}
                                onChange={() => setAnalysisMode('standard')}
                            />
                            <div className="mode-info">
                                <h4>Standard Analysis</h4>
                                <p>Fast PyTorch detection</p>
                            </div>
                        </label>
                        <label className={`mode-card ${analysisMode === 'deep' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="analysisMode"
                                value="deep"
                                checked={analysisMode === 'deep'}
                                onChange={() => setAnalysisMode('deep')}
                            />
                            <div className="mode-info">
                                <h4>Deep AI Analysis</h4>
                                <p>Detailed Gemini reasoning</p>
                            </div>
                        </label>
                    </div>

                    <div className="button-group">
                        <button className="btn btn-outline" onClick={handleRetake} disabled={loading}>
                            Retake Photo
                        </button>
                        <button className="btn btn-primary analyze-btn" onClick={handleAnalyze} disabled={loading}>
                            {loading ? 'Analyzing...' : `Analyze Capture`}
                        </button>
                    </div>
                </div>
            )}

            {loading && (
                <div className="loading-section">
                    <div className="spinner"></div>
                    <p>AI is analyzing the track...</p>
                </div>
            )}

            {results && (
                <div className={`results-wrapper ${isExporting ? 'is-exporting' : ''}`} ref={reportRef}>
                    <div className="results-section active">
                        <h2 className="section-title">Analysis Results</h2>
                        <div className="modern-comparison">
                            <ImageSlider before={capturedImage} after={results.result_image} />
                        </div>

                        <div className="analysis-content">
                            {results.report && typeof results.report === 'object' ? (
                                <div className="structured-report fade-in">
                                    <h2 className="report-main-title">{results.report.title || "🛡️ Safety Analysis Report"}</h2>
                                    <div className="report-grid">
                                        <div className="report-section highlight">
                                            <h3>📋 Defect Summary</h3>
                                            <ul>
                                                <li><strong>Defect:</strong> {results.report.defect_summary?.detected_defect}</li>
                                                <li><strong>Category:</strong> {results.report.defect_summary?.category}</li>
                                                <li><strong>Confidence:</strong> {results.report.defect_summary?.confidence}</li>
                                            </ul>
                                        </div>
                                        <div className="report-section danger">
                                            <h3>⚠️ Severity</h3>
                                            <ul>
                                                <li><strong>Level:</strong> {results.report.severity_assessment?.severity_level}</li>
                                                <li><strong>Risk:</strong> {results.report.severity_assessment?.risk_level}</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="report-full-section warning-box">
                                        <h3>🚀 Recommendation</h3>
                                        <ul>
                                            {Array.isArray(results.report.operational_recommendation) ?
                                                results.report.operational_recommendation.map((item, i) => <li key={i}>{item}</li>) :
                                                <li>{results.report.operational_recommendation}</li>
                                            }
                                        </ul>
                                    </div>
                                </div>
                            ) : results.report ? (
                                <div className="report-box fade-in">
                                    <h3>🛡️ Safety Insights</h3>
                                    <div className="report-text">{results.report}</div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {results && (
                <div className="action-bar fade-in">
                    <button className="btn btn-secondary action-btn" onClick={handleExportPDF}>
                        📄 Export PDF
                    </button>
                    <button className="btn btn-primary action-btn" onClick={handleRetake}>
                        🔄 Capture Another
                    </button>
                    <button className="btn btn-outline action-btn" onClick={handleBackToDashboard}>
                        📊 Dashboard
                    </button>
                </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}

export default Capture;
