// Camera functionality for analyze page

let cameraStream = null;
let isCameraActive = false;

async function startCamera() {
    const video = document.getElementById('cameraVideo');
    if (!video) return;
    
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        video.srcObject = cameraStream;
        isCameraActive = true;
        
        document.getElementById('startCameraBtn').style.display = 'none';
        document.getElementById('captureBtn').style.display = 'inline-flex';
        
        showNotification('Camera started. Place seed in frame and capture.', 'success');
    } catch (err) {
        console.error('Camera error:', err);
        showNotification('Unable to access camera. Please check permissions.', 'error');
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    isCameraActive = false;
}

function captureImage() {
    if (!isCameraActive) return;
    
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataURL = canvas.toDataURL('image/jpeg');
    
    // Switch to upload tab with captured image
    stopCamera();
    
    // Simulate file upload
    const file = dataURLToFile(imageDataURL, 'camera_capture.jpg');
    
    // Trigger analysis with captured image
    const fileInput = document.getElementById('imageInput');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
    
    // Switch to upload tab
    document.querySelector('.tab-btn[data-tab="upload"]').click();
    
    showNotification('Image captured! Ready for analysis.', 'success');
}

function dataURLToFile(dataURL, filename) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

// Initialize camera controls
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startCameraBtn');
    const captureBtn = document.getElementById('captureBtn');
    
    if (startBtn) {
        startBtn.addEventListener('click', startCamera);
    }
    
    if (captureBtn) {
        captureBtn.addEventListener('click', captureImage);
        captureBtn.style.display = 'none';
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopCamera();
});