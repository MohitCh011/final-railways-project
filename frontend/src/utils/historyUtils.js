export const saveToHistory = (result) => {
    try {
        const history = JSON.parse(localStorage.getItem('detectionHistory') || '[]');
        const newEntry = {
            ...result,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };

        // Add to beginning and limit to 20 items
        const updatedHistory = [newEntry, ...history].slice(0, 20);
        localStorage.setItem('detectionHistory', JSON.stringify(updatedHistory));

        // Dispatch storage event manually for same-window updates
        window.dispatchEvent(new Event('storage'));
    } catch (err) {
        console.error('Failed to save to history:', err);
    }
};

export const getHistory = () => {
    return JSON.parse(localStorage.getItem('detectionHistory') || '[]');
};
