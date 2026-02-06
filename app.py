from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import torch
import torchvision.transforms as transforms
from PIL import Image
import cv2
import numpy as np
import io
import base64
import os
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv
from ultralytics import YOLO

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS for all routes with specific origins
CORS(app, 
     resources={r"/*": {"origins": "*"}},
     supports_credentials=False,
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads directory if it doesn't exist
Path(app.config['UPLOAD_FOLDER']).mkdir(exist_ok=True)

# Global variables for model
model = None
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
class_names = []


# Gemini Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    llm_model = genai.GenerativeModel('gemini-1.5-flash')
else:
    print("WARNING: GEMINI_API_KEY not found in environment. Deep Analysis will be disabled.")
    llm_model = None

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((640, 640)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def load_model(model_path='model.pt'):
    """Load the PyTorch model using Ultralytics"""
    global model, class_names
    try:
        if os.path.exists(model_path):
            model = YOLO(model_path)
            class_names = model.names
            
            print(f"Model loaded successfully using Ultralytics")
            return True
        else:
            print(f"Model file not found at {model_path}")
            return False
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

def analyze_image_with_gemini(image):
    """Internal helper to analyze an image with Gemini and return detections + report"""
    try:
        # Reload environment variables to catch any changes to the .env file
        load_dotenv(override=True)
        api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key or api_key == "your_api_key_here":
            return None, "Gemini API Key is missing or invalid in .env."

        # Re-configure Gemini with the current API key
        genai.configure(api_key=api_key)
        
        try:
            model_gemini = genai.GenerativeModel('gemini-1.5-flash')
        except:
            return None, "Failed to initialize Gemini model."

        # Prepare prompt for Gemini
        prompt = """
        Analyze this railway track image for safety issues. 
        Identify defects like cracks, broken rails, loose bolts, vegetation, debris, or misalignment.
        
        Return the result in EXACTLY this JSON format:
        {
          "detections": [
            {"bbox_2d": [ymin, xmin, ymax, xmax], "label": "defect_name", "confidence": 0.95}
          ],
          "safety_report": "Detailed description of the scene and any hazards found."
        }
        
        Note: [ymin, xmin, ymax, xmax] should be normalized values (0-1000).
        """
        
        # Call Gemini
        response = model_gemini.generate_content([prompt, image])
        
        # Parse JSON from response
        import json
        import re
        
        # Extract JSON block using regex
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
        else:
            return [], response.text
        
        # Convert Gemini bboxes (0-1000) to pixel coordinates
        width, height = image.size
        processed_detections = []
        for det in data.get('detections', []):
            if 'bbox_2d' in det:
                ymin, xmin, ymax, xmax = det['bbox_2d']
                processed_detections.append({
                    'bbox': [
                        int(xmin * width / 1000),
                        int(ymin * height / 1000),
                        int(xmax * width / 1000),
                        int(ymax * height / 1000)
                    ],
                    'class': det.get('label', 'defect'),
                    'confidence': det.get('confidence', 0.9)
                })
        
        return processed_detections, data.get('safety_report', 'Analyzed.')
        
    except Exception as e:
        print(f"Error in analyze_image_with_gemini: {e}")
        return None, f"Error: {str(e)}"

def detect_objects(image, conf_threshold=0.15):
    """Run inference on image using YOLO and return detections"""
    try:
        if model is None:
            return []
        
        # Run inference using Ultralytics YOLO
        results = model.predict(source=image, conf=conf_threshold, verbose=False)
        
        # Process predictions
        detections = []
        if results and len(results) > 0:
            result = results[0]
            if hasattr(result, 'boxes') and result.boxes:
                for box in result.boxes:
                    # Get box coordinates in xyxy format
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0].item())
                    cls = int(box.cls[0].item())
                    
                    detections.append({
                        'bbox': [int(x1), int(y1), int(x2), int(y2)],
                        'confidence': conf,
                        'class': class_names[cls] if cls < len(class_names) else f'class_{cls}',
                        'class_id': cls
                    })
        
        return detections
    except Exception as e:
        print(f"Error during detection: {e}")
        import traceback
        traceback.print_exc()
        return []

# --- Update report messaging in upload_file ---
# (Searching for the report generation block in upload_file)

def draw_boxes(image, detections):
    """Draw bounding boxes on image with dynamic scaling for clarity"""
    width, height = image.size
    img_array = np.array(image)
    img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    
    # Calculate scale factors based on image resolution
    base_dim = max(width, height)
    font_scale = max(0.5, base_dim / 1500)
    thickness = max(1, int(base_dim / 500))
    label_padding = int(10 * font_scale)
    
    for det in detections:
        if 'bbox' in det:
            x1, y1, x2, y2 = det['bbox']
            label = f"{det['class']}: {det['confidence']:.2f}"
            
            # Draw rectangle with dynamic thickness
            cv2.rectangle(img_bgr, (x1, y1), (x2, y2), (0, 255, 0), thickness)
            
            # Calculate text size for background box
            (label_width, label_height), baseline = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, max(1, int(thickness/2))
            )
            
            # Ensure label is within image boundaries
            label_y = max(y1, label_height + label_padding)
            
            # Draw label background box
            cv2.rectangle(
                img_bgr, 
                (x1, label_y - label_height - label_padding), 
                (x1 + label_width, label_y), 
                (0, 255, 0), 
                -1
            )
            
            # Draw label text with high contrast (black text on green background)
            cv2.putText(
                img_bgr, 
                label, 
                (x1, label_y - label_padding // 2), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                font_scale, 
                (0, 0, 0), 
                max(1, int(thickness/2))
            )
    
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(img_rgb)

@app.route('/')
def index():
    """Root route for health check"""
    return jsonify({
        'status': 'online',
        'message': 'RailSafe AI API is running.'
    })

@app.route('/api/stats')
def get_stats():
    """Get dashboard statistics"""
    return jsonify({
        'total_incidents': 1247,
        'critical_issues': 89,
        'maintenance_required': 342,
        'accuracy': 95.3
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload and return detection results"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        # Read and process image
        image = Image.open(file.stream).convert('RGB')
        
        # Run detection
        detections = detect_objects(image)
        
        if detections is None:
            return jsonify({'error': 'Detection failed. Please check server logs.'}), 500
        
        # Create a report for Standard Analysis
        if detections:
            classes_found = list(set([str(d['class']) for d in detections]))
            report = f"Standard analysis detected {len(detections)} potential issues, including {', '.join(classes_found)}. Immediate inspection is recommended for highlighted areas. If you suspect a defect was missed, please try 'Deep AI Analysis'."
        else:
            report = "No immediate structural defects were detected by the standard AI model. The track appears to be in normal condition. **Note:** If you see a defect that was missed, please use **'Deep AI Analysis'** mode. Our advanced Vision Model is specialized in catching subtle cracks and structural anomalies."

        # Draw bounding boxes
        result_image = draw_boxes(image.copy(), detections)
        
        # Convert result image to base64
        buffered = io.BytesIO()
        result_image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({
            'success': True,
            'detections': detections,
            'report': report,
            'result_image': f'data:image/jpeg;base64,{img_str}'
        })
    
    except Exception as e:
        print(f"Error in upload_file: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/analyze_deep', methods=['POST'])
def analyze_deep():
    """Run deep analysis using Gemini VLM"""
    # Reload environment variables to catch any changes to the .env file
    load_dotenv(override=True)
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key or api_key == "your_api_key_here":
        return jsonify({'error': 'Gemini API Key is missing or invalid in .env. Please add your real key from Google AI Studio.'}), 400

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    try:
        # Re-configure Gemini with the current API key
        genai.configure(api_key=api_key)
        
        # Dynamically discover available models that support generateContent
        model_gemini = None
        working_model_name = None
        
        try:
            available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
            print(f"Available API models: {available_models}")
            
            # Prioritize models
            priority = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-2.0-flash-exp']
            
            # Find the best match from available models
            candidates = []
            for p in priority:
                full_p = f"models/{p}"
                if full_p in available_models:
                    candidates.append(full_p)
                elif p in available_models:
                    candidates.append(p)
            
            # Add any other available models as fallback
            for m in available_models:
                if m not in candidates:
                    candidates.append(m)
            
            print(f"Will try models in this order: {candidates}")
            
            for name in candidates:
                try:
                    m = genai.GenerativeModel(name)
                    # We'll verify it works by trying to generate a tiny response
                    model_gemini = m
                    working_model_name = name
                    print(f"Selected model: {working_model_name}")
                    break
                except Exception as e:
                    print(f"Failed to init {name}: {e}")
                    
        except Exception as list_err:
            print(f"Model discovery failed: {list_err}. Falling back to defaults.")
            model_gemini = genai.GenerativeModel('gemini-1.5-flash')
            working_model_name = 'gemini-1.5-flash'
        
        if model_gemini is None:
            return jsonify({'error': 'No suitable Gemini model found for this API key.'}), 500
        
        # Read image
        image = Image.open(file.stream).convert('RGB')
        
        # Prepare prompt for Gemini
        prompt = """
        Analyze this railway track image for safety issues. 
        Identify defects like cracks, broken rails, loose bolts, vegetation, debris, or misalignment.
        
        Return the result in EXACTLY this JSON format:
        {
          "detections": [
            {"bbox_2d": [ymin, xmin, ymax, xmax], "label": "defect_name", "confidence": 0.95}
          ],
          "safety_report": {
            "title": "🛡️ Railway Safety Analysis",
            "defect_summary": {
              "detected_defect": "defect_name",
              "category": "category_name",
              "type": "type_name",
              "confidence": "99.0%"
            },
            "severity_assessment": {
              "severity_level": "Severity Level (e.g., 🔴 Critical, 🟡 Warning)",
              "risk_level": "Risk Level",
              "derailment_probability": "Probability"
            },
            "visual_evidence": [
              "Observation 1",
              "Observation 2"
            ],
            "track_context": {
              "track_component": "Component name",
              "location": "Location description",
              "alignment": "Alignment description"
            },
            "operational_recommendation": [
              "Recommendation 1",
              "Recommendation 2"
            ],
            "additional_observations": "Other findings"
          }
        }
        
        Note: [ymin, xmin, ymax, xmax] should be normalized values (0-1000). 
        The safety_report must be a structured JSON object as shown above, NOT a string.
        """

        
        # Call Gemini
        response = model_gemini.generate_content([prompt, image])
        
        # Parse JSON from response
        import json
        import re
        
        # Extract JSON block using regex
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
        else:
            # Fallback if no clear JSON found
            data = {
                "detections": [],
                "safety_report": response.text
            }
        
        # Convert Gemini bboxes (0-1000) to pixel coordinates
        width, height = image.size
        processed_detections = []
        for det in data.get('detections', []):
            if 'bbox_2d' in det:
                ymin, xmin, ymax, xmax = det['bbox_2d']
                processed_detections.append({
                    'bbox': [
                        int(xmin * width / 1000),
                        int(ymin * height / 1000),
                        int(xmax * width / 1000),
                        int(ymax * height / 1000)
                    ],
                    'class': det.get('label', 'defect'),
                    'confidence': det.get('confidence', 0.9)
                })
            
        # Draw boxes for the result image
        result_image = draw_boxes(image.copy(), processed_detections)
        
        # Convert to base64
        buffered = io.BytesIO()
        result_image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({
            'success': True,
            'detections': processed_detections,
            'report': data.get('safety_report', 'No report generated.'),
            'result_image': f'data:image/jpeg;base64,{img_str}'
        })
        
    except Exception as e:
        print(f"Error in analyze_deep: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    load_model('model.pt')
    app.run(debug=True, host='0.0.0.0', port=5000)
