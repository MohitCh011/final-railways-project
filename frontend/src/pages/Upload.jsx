import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ImageSlider from '../components/ImageSlider';
import { saveToHistory } from '../utils/historyUtils';
import { toast } from '../services/ToastService';
import './Upload.css';

const API_URL = import.meta.env.VITE_API_URL || '';

function Upload() {
    const navigate = useNavigate();
    const reportRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [analysisMode, setAnalysisMode] = useState('standard'); // 'standard' or 'deep'
    const [isExporting, setIsExporting] = useState(false);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        setSelectedFile(file);
        setResults(null);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

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
                preview, // Keep the original for history
                mode: analysisMode
            });

            if (response.data.detections && response.data.detections.length > 0) {
                toast.warning(`Safety Alert: ${response.data.detections.length} defect(s) detected.`);
            } else {
                toast.success("Analysis Complete: No critical defects found.");
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            const errorMsg = error.response?.data?.error || 'Error connecting to the server. Please ensure the backend is running.';
            toast.error(`Analysis Failed: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!reportRef.current) return;

        setIsExporting(true);

        // Wait for state change to apply high-contrast styles
        setTimeout(async () => {
            try {
                const canvas = await html2canvas(reportRef.current, {
                    scale: 2, // 2x scale is sufficient for light mode and prevents memory issues
                    useCORS: true,
                    backgroundColor: '#ffffff', // Set white background for light mode
                    logging: false,
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

                // Ratio to convert canvas pixels to PDF mm
                const ratio = pdfWidth / imgWidth;
                const canvasPageHeight = pdfHeight / ratio;

                let heightLeft = imgHeight;
                let position = 0;
                let page = 1;

                // First page
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight * ratio);
                heightLeft -= canvasPageHeight;

                // Subsequent pages if content overflows
                while (heightLeft > 0) {
                    position = -(page * pdfHeight);
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight * ratio);
                    heightLeft -= canvasPageHeight;
                    page++;
                }

                pdf.save(`RailSafe_Safety_Report_${new Date().getTime()}.pdf`);
            } catch (err) {
                console.error("PDF Export failed:", err);
                alert("Failed to generate PDF. Please try again.");
            } finally {
                setIsExporting(false);
            }
        }, 500);
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreview(null);
        setResults(null);
    };

    const handleBackToDashboard = () => {
        navigate('/');
    };

    return (
        <div className="container">
            <h1 className="page-title">Upload Track Image for Analysis</h1>
            <p className="page-subtitle">
                Upload railway track images to detect potential issues and maintenance needs
            </p>

            <div
                className={`upload-section ${dragActive ? 'dragover' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
            >
                <div className="upload-icon">📤</div>
                <div className="upload-text">Drag & Drop Image Here</div>
                <div className="upload-subtext">or click to browse files</div>
                <input
                    type="file"
                    id="fileInput"
                    accept="image/*"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                />
                <button className="btn btn-primary" onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('fileInput').click();
                }}>
                    Browse Files
                </button>
            </div>

            {preview && !results && (
                <div className="preview-section">
                    <h2>Analysis Preview</h2>
                    <img src={preview} alt="Preview" className="preview-image" />

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

                    <button className="btn btn-primary analyze-btn" onClick={handleUpload} disabled={loading}>
                        {loading ? 'Analyzing...' : `Analyze Image (${analysisMode === 'deep' ? 'Deep' : 'Standard'})`}
                    </button>
                </div>
            )}

            {loading && (
                <div className="loading-section">
                    <div className="spinner"></div>
                    <p>Analyzing image...</p>
                </div>
            )}

            {results && (
                <div className={`results-wrapper ${isExporting ? 'is-exporting' : ''}`} ref={reportRef}>
                    <div className="results-section active">
                        <h2 className="section-title">Analysis Results</h2>

                        <div className="modern-comparison">
                            <ImageSlider before={preview} after={results.result_image} />
                        </div>

                        <div className="analysis-content">
                            {results.report && typeof results.report === 'object' ? (
                                <div className="structured-report fade-in">
                                    <h2 className="report-main-title">{results.report.title || "🛡️ Railway Safety Analysis"}</h2>

                                    <div className="report-grid">
                                        <div className="report-section highlight">
                                            <h3>📋 Defect Summary</h3>
                                            <ul>
                                                <li><strong>Detected Defect:</strong> {results.report.defect_summary?.detected_defect}</li>
                                                <li><strong>Category:</strong> {results.report.defect_summary?.category}</li>
                                                <li><strong>Type:</strong> {results.report.defect_summary?.type}</li>
                                                <li><strong>Confidence:</strong> {results.report.defect_summary?.confidence}</li>
                                            </ul>
                                        </div>

                                        <div className="report-section danger">
                                            <h3>⚠️ Severity Assessment</h3>
                                            <ul>
                                                <li><strong>Severity Level:</strong> {results.report.severity_assessment?.severity_level}</li>
                                                <li><strong>Risk Level:</strong> {results.report.severity_assessment?.risk_level}</li>
                                                <li><strong>Derailment Probability:</strong> {results.report.severity_assessment?.derailment_probability}</li>
                                            </ul>
                                        </div>

                                        <div className="report-section info">
                                            <h3>🔍 Visual Evidence</h3>
                                            <ul>
                                                {Array.isArray(results.report.visual_evidence) ?
                                                    results.report.visual_evidence.map((item, i) => <li key={i}>{item}</li>) :
                                                    <li>{results.report.visual_evidence}</li>
                                                }
                                            </ul>
                                        </div>

                                        <div className="report-section secondary">
                                            <h3>🛤️ Track Context</h3>
                                            <ul>
                                                <li><strong>Track Component:</strong> {results.report.track_context?.track_component}</li>
                                                <li><strong>Location:</strong> {results.report.track_context?.location}</li>
                                                <li><strong>Alignment:</strong> {results.report.track_context?.alignment}</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="report-full-section warning-box">
                                        <h3>🚀 Operational Recommendation</h3>
                                        <ul>
                                            {Array.isArray(results.report.operational_recommendation) ?
                                                results.report.operational_recommendation.map((item, i) => <li key={i}>{item}</li>) :
                                                <li>{results.report.operational_recommendation}</li>
                                            }
                                        </ul>
                                    </div>

                                    {results.report.additional_observations && (
                                        <div className="report-full-section observation-box">
                                            <h3>📝 Additional Observations</h3>
                                            <p>{results.report.additional_observations}</p>
                                        </div>
                                    )}
                                </div>
                            ) : results.report ? (
                                <div className="report-box fade-in">
                                    <h3>🛡️ Safety Insights</h3>
                                    <div className="report-text">{results.report}</div>
                                </div>
                            ) : null}

                            <div className="raw-detections">
                                <h3>Object Probabilities</h3>
                                {results.detections && results.detections.length > 0 ? (
                                    <div className="detection-grid">
                                        {results.detections.map((detection, index) => (
                                            <div key={index} className="detection-card">
                                                <span className="detection-class">{detection.class}</span>
                                                <span className="detection-confidence">
                                                    {(detection.confidence * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-detections">No specific objects isolated</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {results && (
                <div className="action-bar fade-in">
                    <button className="btn btn-secondary action-btn" onClick={handleExportPDF}>
                        <span className="btn-icon">📄</span> Export as PDF
                    </button>
                    <button className="btn btn-primary action-btn" onClick={handleReset}>
                        <span className="btn-icon">🔄</span> Analyze Another
                    </button>
                    <button className="btn btn-outline action-btn" onClick={handleBackToDashboard}>
                        <span className="btn-icon">📊</span> Back to Dashboard
                    </button>
                </div>
            )}


            <div className="tips-section">
                <h2>📋 Tips for Best Results</h2>
                <div className="tips-grid">
                    <div className="tip-card">
                        <h4>📸 Image Quality</h4>
                        <p>Use high-resolution images (minimum 640x640 pixels) for better detection accuracy.</p>
                    </div>

                    <div className="tip-card">
                        <h4>☀️ Lighting</h4>
                        <p>Ensure good lighting conditions. Avoid shadows and extreme brightness.</p>
                    </div>

                    <div className="tip-card">
                        <h4>📐 Angle</h4>
                        <p>Capture images at a clear angle showing the track details prominently.</p>
                    </div>

                    <div className="tip-card">
                        <h4>🎯 Focus</h4>
                        <p>Keep the camera focused on the track area. Avoid blurry images.</p>
                    </div>

                    <div className="tip-card">
                        <h4>📏 Distance</h4>
                        <p>Maintain optimal distance to capture sufficient track details.</p>
                    </div>

                    <div className="tip-card">
                        <h4>🗂️ File Format</h4>
                        <p>Supported formats: JPG, PNG, JPEG. Maximum file size: 16MB.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Upload;
