import { useEffect, useState } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import HowItWorks from './HowItWorks';
import './Intro.css';

const Intro = ({ onFinish }) => {
    const [phase, setPhase] = useState('logo'); // logo -> hero -> transition
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    useEffect(() => {
        // Animation sequence
        const heroTimer = setTimeout(() => setPhase('hero'), 1800);
        return () => clearTimeout(heroTimer);
    }, []);

    const handleEnter = () => {
        setPhase('transition');
        setTimeout(onFinish, 1200);
    };

    return (
        <div className={`intro-overlay phase-${phase}`}>
            {/* Cinematic Background */}
            <div className="futuristic-bg">
                <div className="grid-overlay"></div>
                <div className="dynamic-scanline"></div>
                <div className="perspective-tracks">
                    <div className="rail left"></div>
                    <div className="rail right"></div>
                    <div className="sleepers"></div>
                </div>
            </div>

            <div className="intro-content-container">
                {/* Logo Phase */}
                <div className="logo-emergence">
                    <svg viewBox="0 0 100 100" className="intro-logo-svg">
                        <defs>
                            <linearGradient id="introGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#4facfe', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#00f2fe', stopOpacity: 1 }} />
                            </linearGradient>
                        </defs>
                        <g transform="translate(25, 15)">
                            <path className="draw-path" d="M10 0 L10 70 M20 0 L20 70" stroke="#4285F4" strokeWidth="4" fill="none" />
                            <path className="draw-path" d="M20 5 A25 15 0 1 1 20 35 M20 11 A19 9 0 1 1 20 29" stroke="#EA4335" strokeWidth="4" fill="none" />
                            <path className="draw-path" d="M20 35 L45 70 M28 35 L53 70" stroke="#34A853" strokeWidth="4" fill="none" />
                            <circle className="dot-path" cx="50" cy="5" r="4" fill="#FBBC05" />
                        </g>
                    </svg>
                </div>

                {/* Hero Content Phase */}
                <div className={`hero-content ${phase !== 'logo' ? 'visible' : ''}`}>
                    <div className="hero-badge">AI-POWERED SAFETY</div>
                    <h1 className="hero-headline">
                        <span className="text-white">Smarter Track Inspection for</span>
                        <span className="text-accent gradient-text">Safer Railways</span>
                    </h1>

                    <h2 className="hero-subheadline">
                        RailSafe AI uses advanced LLMs and Vision models to analyze track conditions,
                        detect damage, and highlight repair requirements with surgical accuracy.
                    </h2>

                    <p className="hero-tagline">
                        "Predict. Detect. Protect Railway Infrastructure."
                    </p>

                    <div className="hero-actions">
                        <button className="btn-primary-futuristic" onClick={handleEnter}>
                            Explore the Platform <ArrowRight size={20} />
                        </button>
                        <button className="btn-secondary-futuristic" onClick={() => setShowHowItWorks(true)}>
                            How It Works <Info size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* How It Works Modal */}
            {showHowItWorks && <HowItWorks onClose={() => setShowHowItWorks(false)} />}

            {/* Transition Overlay */}
            <div className="transition-shutter"></div>
        </div>
    );
};

export default Intro;
