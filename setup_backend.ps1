# Setup script for RailSafe AI Backend
# Run this script to install all required Python dependencies

Write-Host "Installing RailSafe AI Backend Dependencies..." -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.8 or higher." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing Python packages..." -ForegroundColor Yellow
Write-Host ""

# Install packages
pip install flask flask-cors torch torchvision opencv-python pillow numpy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ All dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Place your trained PyTorch model as 'model.pt' in this directory"
    Write-Host "2. Run: python app.py"
    Write-Host "3. The backend will start on http://localhost:5000"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "✗ Installation failed. Please check the error messages above." -ForegroundColor Red
    Write-Host ""
}
