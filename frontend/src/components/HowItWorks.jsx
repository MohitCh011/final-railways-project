import { X, Cpu, Globe, Zap, Database, Server } from 'lucide-react';
import './HowItWorks.css';

const HowItWorks = ({ onClose }) => {
    return (
        <div className="how-it-works-overlay" onClick={onClose}>
            <div className="how-it-works-modal" onClick={e => e.stopPropagation()}>
                <button className="close-overlay-btn" onClick={onClose}>
                    <X size={32} />
                </button>

                <div className="how-header">
                    <h1 className="gradient-text">How RailSafe AI Works</h1>
                    <p>Understanding our hybrid AI infrastructure for railway safety.</p>
                </div>

                <div className="how-content-scroll">
                    {/* Section 1: System Architecture */}
                    <section className="how-section">
                        <div className="section-title-box">
                            <Globe className="icon-green" />
                            <h2>Full System Architecture</h2>
                        </div>
                        <div className="architecture-diagram system-overview">
                            <div className="diag-node frontend">
                                <h3>Frontend</h3>
                                <p>React + Vite</p>
                                <span>SPA Dashboard</span>
                            </div>
                            <div className="diag-arrow">➜</div>
                            <div className="diag-node backend">
                                <Server className="bg-icon" />
                                <h3>Backend</h3>
                                <p>Python + Flask</p>
                                <span>RESTful API</span>
                            </div>
                            <div className="diag-arrow">➜</div>
                            <div className="diag-group">
                                <div className="diag-node model-yolo">
                                    <h3>Standard AI</h3>
                                    <p>YOLO v8</p>
                                </div>
                                <div className="diag-node model-llm">
                                    <h3>Deep AI</h3>
                                    <p>Gemini LLM</p>
                                </div>
                            </div>
                        </div>
                        <p className="description-text">
                            Our platform uses a <strong>React</strong> frontend for real-time visualization,
                            communicating with a <strong>Flask</strong> backend that orchestrates two distinct AI analysis channels.
                        </p>
                    </section>

                    {/* Section 2: YOLO v8 Architecture */}
                    <section className="how-section">
                        <div className="section-title-box">
                            <Zap className="icon-blue" />
                            <h2>Standard Analysis: YOLO v8</h2>
                        </div>
                        <div className="architecture-diagram yolo-flow">
                            <div className="yolo-box input">Input Image</div>
                            <div className="yolo-arrow">⥱</div>
                            <div className="yolo-stack">
                                <div className="yolo-layer">Backbone (Feature Extraction)</div>
                                <div className="yolo-layer">Neck (Feature Fusion)</div>
                                <div className="yolo-layer">Head (Box Prediction)</div>
                            </div>
                            <div className="yolo-arrow">⥱</div>
                            <div className="yolo-box output">BBOX & Labels</div>
                        </div>
                        <p className="description-text">
                            <strong>YOLO (You Only Look Once) v8</strong> is optimized for speed.
                            It divides images into a grid and predicts bounding boxes and probabilities
                            simultaneously in a single pass, providing millisecond detection of common track defects.
                        </p>
                    </section>

                    {/* Section 3: LLM Architecture */}
                    <section className="how-section">
                        <div className="section-title-box">
                            <Cpu className="icon-purple" />
                            <h2>Deep Analysis: Gemini VLM</h2>
                        </div>
                        <div className="architecture-diagram llm-flow">
                            <div className="llm-box image-input">Visual Data</div>
                            <div className="llm-plus">+</div>
                            <div className="llm-box prompt-input">Safety Prompt</div>
                            <div className="llm-arrow">⥬</div>
                            <div className="llm-core">
                                <div className="transformer-layer">Multimodal Transformer</div>
                                <span>VLM (Vision-Language Model)</span>
                            </div>
                            <div className="llm-arrow">⥬</div>
                            <div className="llm-box final-report">Structured Safety Report</div>
                        </div>
                        <p className="description-text">
                            Our <strong>Deep AI</strong> uses Gemini's Vision-Language Model.
                            Instead of just drawing boxes, it "understands" the scene, reasoning about
                            environmental context and subtle structural anomalies that traditional
                            computer vision might miss.
                        </p>
                    </section>

                    {/* Final Step */}
                    <div className="how-footer-cta">
                        <button className="btn-primary-futuristic" onClick={onClose}>
                            Got it, Let's Analyze!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
