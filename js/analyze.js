// Analyze Page JavaScript

let currentImageFile = null;
let currentImagePreview = null;
let batchQueue = [];

// Initialize analyze page
document.addEventListener('DOMContentLoaded', () => {
    initUploadTab();
    initBatchTab();
    initTabs();
});

// Show variety guide modal
const guideBtn = document.getElementById('showGuideBtn');
if (guideBtn) {
    guideBtn.addEventListener('click', () => {
        const modal = document.getElementById('varietyGuideModal');
        if (modal) {
            modal.style.display = 'flex';
            const closeBtn = modal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }
        }
    });
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

function initUploadTab() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('imageInput');
    const selectBtn = document.getElementById('selectFileBtn');
    const runBtn = document.getElementById('runAnalysisBtn');
    const previewContainer = document.getElementById('imagePreview');
    const resultsArea = document.getElementById('analysisResults');
    
    if (!uploadZone) return;
    
    function handleFile(file) {
        if (!file) return;
        currentImageFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            currentImagePreview = e.target.result;
            previewContainer.innerHTML = `
                <img src="${currentImagePreview}" alt="Preview" class="preview-img">
                <button class="remove-image-btn"><i class="fas fa-times"></i> Remove</button>
            `;
            previewContainer.classList.remove('hidden');
            if (runBtn) runBtn.disabled = false;
            
            // Add remove handler
            const removeBtn = previewContainer.querySelector('.remove-image-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    currentImageFile = null;
                    currentImagePreview = null;
                    previewContainer.innerHTML = '';
                    previewContainer.classList.add('hidden');
                    if (runBtn) runBtn.disabled = true;
                    resultsArea.innerHTML = `
                        <div class="placeholder-results">
                            <i class="fas fa-camera-retro"></i>
                            <p>Upload an image to start analysis</p>
                        </div>
                    `;
                });
            }
        };
        reader.readAsDataURL(file);
    }
    
    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });
    selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    
    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    
    // Run analysis
    if (runBtn) {
        runBtn.addEventListener('click', () => {
            if (!currentImagePreview) return;
            
            runBtn.disabled = true;
            runBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Processing...';
            resultsArea.innerHTML = `
                <div class="analysis-loading">
                    <i class="fas fa-brain"></i>
                    <p>CNN Model analyzing image...</p>
                    <div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div>
                </div>
            `;
            
            // Simulate progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                const fill = resultsArea.querySelector('.progress-fill');
                if (fill) fill.style.width = `${progress}%`;
            }, 100);
            
// Inside the runAnalysisBtn click handler, replace the resultsArea.innerHTML section
// Look for this part and update it:

// Inside the runAnalysisBtn click handler, replace the resultsArea.innerHTML section
// Look for this part and update it:

setTimeout(() => {
    clearInterval(interval);
    const result = mockCNNClassification(currentImagePreview);
    
    // Get quality criteria
    const qualityCriteria = getQualityCriteria(result.quality, result.variety);
    
    // Save to history
    const user = getCurrentUser();
    if (user) {
        const history = Storage.get(`history_${user.username}`) || [];
        history.unshift({
            ...result,
            previewUrl: currentImagePreview,
            timestamp: Date.now()
        });
        Storage.set(`history_${user.username}`, history.slice(0, 100));
    }
    
    // Determine quality class for styling
    const qualityClass = result.quality.toLowerCase().replace(' ', '-');
    
    // Display simplified results with only Variety, Quality Grade, and Quality Assessment Criteria
    resultsArea.innerHTML = `
        <div class="result-card">
            <!-- Variety Display -->
            <div class="result-item-full">
                <div class="result-label">Variety</div>
                <div class="result-value-large ${result.variety.toLowerCase().replace(' ', '-')}">
                    ${result.variety}
                </div>
            </div>
            
            <!-- Quality Grade Display with Percentage -->
            <div class="result-item-full">
                <div class="result-label">Quality Grade</div>
                <div class="result-value-large quality-${qualityClass}">
                    ${result.quality} ${result.confidence}%
                </div>
            </div>
            
            <!-- Quality Assessment Criteria Section -->
            <div class="quality-criteria ${qualityClass}">
                <h4><i class="fas fa-clipboard-list"></i> Quality Assessment Criteria</h4>
                <div class="criteria-section">
                    <strong>📊 Quality Summary:</strong>
                    <p>${qualityCriteria.general}</p>
                </div>
                <div class="criteria-section">
                    <strong>👁️ Visual Indicators Observed:</strong>
                    <pre>${qualityCriteria.visual}</pre>
                </div>
                <div class="criteria-section">
                    <strong>📏 Quality Standards Met:</strong>
                    <pre>${qualityCriteria.standards}</pre>
                </div>
                <div class="why-explanation">
                    <strong><i class="fas fa-question-circle"></i> Why ${result.quality}?:</strong><br>
                    ${qualityCriteria.why}
                </div>
                ${qualityCriteria.varietySpecific ? `
                <div class="criteria-section">
                    <strong>🌽 ${result.variety}-Specific Notes:</strong>
                    <p>${qualityCriteria.varietySpecific}</p>
                </div>
                ` : ''}
                <div class="recommendations-box ${qualityClass}">
                    <strong><i class="fas fa-lightbulb"></i> Recommendations:</strong><br>
                    ${qualityCriteria.recommendations}
                </div>
            </div>
            
            <!-- Save Button -->
            <div class="result-actions" style="margin-top: 1.5rem;">
                <button class="btn-outline save-result" data-result='${JSON.stringify(result)}'>
                    <i class="fas fa-save"></i> Save to Collection
                </button>
            </div>
        </div>
    `;
    
    runBtn.disabled = false;
    runBtn.innerHTML = '<i class="fas fa-brain"></i> Run CNN Classification';
    
    // Add save handler
    const saveBtn = resultsArea.querySelector('.save-result');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            showNotification('Analysis saved to collection!', 'success');
        });
    }
    
}, 2000);
        });
    }
}

function initBatchTab() {
    const batchZone = document.getElementById('batchZone');
    const batchInput = document.getElementById('batchInput');
    const batchSelectBtn = document.getElementById('batchSelectBtn');
    const batchQueueDiv = document.getElementById('batchQueue');
    const batchPreview = document.getElementById('batchPreview');
    const processBtn = document.getElementById('processBatchBtn');
    const exportBtn = document.getElementById('exportBatchBtn');
    
    if (!batchZone) return;
    
    function addToBatch(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    batchQueue.push({
                        file: file,
                        preview: e.target.result,
                        name: file.name,
                        result: null
                    });
                    updateBatchPreview();
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    function updateBatchPreview() {
        if (batchQueue.length > 0) {
            batchQueueDiv.classList.remove('hidden');
            batchPreview.innerHTML = batchQueue.map((item, index) => `
                <div class="batch-item">
                    <img src="${item.preview}" alt="${item.name}">
                    <div class="remove-btn" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </div>
                    ${item.result ? '<div class="result-badge"><i class="fas fa-check"></i></div>' : ''}
                </div>
            `).join('');
            
            document.getElementById('queueCount').textContent = batchQueue.length;
            processBtn.innerHTML = `<i class="fas fa-play"></i> Process All (${batchQueue.length})`;
            
            // Add remove handlers
            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(btn.getAttribute('data-index'));
                    batchQueue.splice(index, 1);
                    updateBatchPreview();
                    if (batchQueue.length === 0) {
                        batchQueueDiv.classList.add('hidden');
                    }
                });
            });
        } else {
            batchQueueDiv.classList.add('hidden');
        }
    }
    
    
    batchZone.addEventListener('click', () => batchInput.click());
    batchSelectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        batchInput.click();
    });
    batchInput.addEventListener('change', (e) => {
        if (e.target.files.length) addToBatch(e.target.files);
    });
    
    // Process batch
    if (processBtn) {
        processBtn.addEventListener('click', async () => {
            const progressDiv = document.getElementById('batchProgress');
            const progressFill = progressDiv.querySelector('.progress-fill');
            const progressText = document.getElementById('progressText');
            
            progressDiv.classList.remove('hidden');
            
            for (let i = 0; i < batchQueue.length; i++) {
                const item = batchQueue[i];
                const progress = ((i + 1) / batchQueue.length) * 100;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${i + 1}/${batchQueue.length}`;
                
                // Simulate analysis
                await new Promise(resolve => setTimeout(resolve, 800));
                item.result = mockCNNClassification(item.preview);
                updateBatchPreview();
            }
            
            showNotification(`Batch processing complete! ${batchQueue.length} images analyzed.`, 'success');
            
            if (exportBtn) {
                exportBtn.disabled = false;
                exportBtn.addEventListener('click', () => {
                    const results = batchQueue.map(item => item.result).filter(r => r);
                    exportToCSV(results, `batch_analysis_${Date.now()}.csv`);
                });
            }
        });
    }
}
