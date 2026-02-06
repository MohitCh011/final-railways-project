import { useState, useRef, useEffect } from 'react';
import './ImageSlider.css';

const ImageSlider = ({ before, after }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef(null);

    const handleMove = (e) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX || (e.touches && e.touches[0].clientX);

        if (x !== undefined) {
            const position = ((x - rect.left) / rect.width) * 100;
            setSliderPosition(Math.max(0, Math.min(100, position)));
        }
    };

    const handleMouseDown = () => {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    const handleTouchStart = () => {
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleTouchEnd);
    };

    const handleTouchEnd = () => {
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleTouchEnd);
    };

    return (
        <div
            className="image-slider-container fade-in"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            <div className="image-after-container">
                <img src={after} alt="After" className="after-image" />
                <div className="badge after-badge">AI DETECTION</div>
            </div>

            <div
                className="image-before-container"
                style={{ width: `${sliderPosition}%` }}
            >
                <img src={before} alt="Before" className="before-image" />
                <div className="badge before-badge">ORIGINAL</div>
            </div>

            <div
                className="slider-handle"
                style={{ left: `${sliderPosition}%` }}
            >
                <div className="handle-line"></div>
                <div className="handle-button">
                    <span>⟷</span>
                </div>
            </div>
        </div>
    );
};

export default ImageSlider;
