# RailSafe AI - Railway Track Safety Monitoring System

A modern web application for detecting railway track defects using AI-powered computer vision with PyTorch.

## Features

- 🏠 **Dashboard**: Real-time statistics and overview of railway track issues
- 📤 **Upload Detection**: Drag-and-drop image upload with instant analysis
- 📹 **Live Detection**: Real-time camera feed with bounding box detection
- 🤖 **AI-Powered**: Uses PyTorch models for accurate defect detection
- 🎨 **Modern UI**: Beautiful, responsive design with glassmorphism effects

## Tech Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- Axios for API calls
- Modern CSS with animations

### Backend
- Flask (Python web framework)
- PyTorch for model inference
- OpenCV for image processing
- Flask-CORS for cross-origin requests

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- A trained PyTorch model file (`.pt` format)
- Webcam (for live detection)

### Backend Setup

1. Navigate to the project root directory:
```bash
cd c:\railway
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Place your trained PyTorch model file in the root directory and name it `model.pt`

5. Run the Flask backend:
```bash
python app.py
```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Usage

1. **Home Page**: View dashboard statistics and learn about common railway track issues

2. **Upload Page**: 
   - Drag and drop an image or click to browse
   - Click "Analyze Image" to detect defects
   - View results with bounding boxes and confidence scores

3. **Live Detection**:
   - Real-time camera feed with automatic detection
   - View detection statistics and alerts

## Model Requirements

Your PyTorch model should:
- Accept images of size 640x640 (or be compatible with the transform pipeline)
- Return detections in YOLO format (for object detection) or classification probabilities
- Have a `names` attribute with class names, or use the default classes:
  - crack
  - broken_rail
  - loose_bolt
  - vegetation
  - debris
  - normal
  - corrosion
  - misalignment

## API Endpoints

- `GET /api/stats` - Get dashboard statistics
- `POST /api/upload` - Upload and analyze an image
- `GET /video_feed` - Live camera stream with detection

## Project Structure

```
c:\railway\
├── app.py                 # Flask backend
├── requirements.txt       # Python dependencies
├── model.pt              # Your trained PyTorch model (add this)
├── uploads/              # Uploaded images directory
└── frontend/
    ├── src/
    │   ├── App.jsx       # Main app component
    │   ├── App.css       # Global styles
    │   ├── pages/
    │   │   ├── Home.jsx  # Dashboard page
    │   │   ├── Upload.jsx # Upload page
    │   │   └── Live.jsx  # Live detection page
    │   └── main.jsx      # Entry point
    ├── package.json
    └── vite.config.js
```

## Troubleshooting

### Backend Issues
- **Model not loading**: Ensure `model.pt` is in the root directory
- **CORS errors**: Flask-CORS is configured to allow all origins in development
- **Camera not working**: Check camera permissions and ensure it's not being used by another application

### Frontend Issues
- **API connection failed**: Ensure the backend is running on port 5000
- **Build errors**: Delete `node_modules` and run `npm install` again

## Development

To modify the model inference logic, edit the `detect_objects()` function in `app.py`.

To customize the UI, edit the respective component files in `frontend/src/pages/`.

## License

This project is for educational and demonstration purposes.
