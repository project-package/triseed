// Compare Page JavaScript

let selectedSeeds = [null, null, null];

function initComparison() {
    const slots = document.querySelectorAll('.slot');
    
    slots.forEach((slot, index) => {
        const fromHistoryBtn = slot.querySelector('.select-from-history');
        const uploadNewBtn = slot.querySelector('.upload-new');
        
        if (fromHistoryBtn) {
            fromHistoryBtn.addEventListener('click', () => showHistorySelector(index));
        }
        
        if (uploadNewBtn) {
            uploadNewBtn.addEventListener('click', () => uploadNewSeed(index));
        }
    });
}

function showHistorySelector(slotIndex) {
    const user = getCurrentUser();
    const history = Storage.get(`history_${user.username}`) || [];
    
    if (history.length === 0) {
        showNotification('No previous analyses found. Please analyze a seed first.', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Select from History</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="history-list">
                    ${history.slice(0, 10).map(item => `
                        <div class="history-item" data-id="${item.timestamp}">
                            <img src="${item.previewUrl}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 0.5rem;">
                            <div>
                                <strong>${item.variety}</strong><br>
                                ${item.quality} | ${item.performanceScore}/100<br>
                                ${formatDate(item.timestamp)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    modal.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.getAttribute('data-id'));
            const selected = history.find(h => h.timestamp === id);
            if (selected) {
                selectedSeeds[slotIndex] = selected;
                updateSlot(slotIndex, selected);
                updateComparison();
                modal.remove();
            }
        });
    });
    
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });
}

function uploadNewSeed(slotIndex) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                // Mock analysis for new upload
                const result = mockCNNClassification(ev.target.result);
                const newSeed = {
                    ...result,
                    previewUrl: ev.target.result,
                    timestamp: Date.now()
                };
                selectedSeeds[slotIndex] = newSeed;
                updateSlot(slotIndex, newSeed);
                updateComparison();
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function updateSlot(slotIndex, seed) {
    const slot = document.querySelector(`.slot[data-slot="${slotIndex}"]`);
    if (!slot) return;
    
    const content = slot.querySelector('.slot-content');
    if (seed) {
        content.innerHTML = `
            <img src="${seed.previewUrl}" style="width: 100%; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <strong>${seed.variety}</strong><br>
            <small>${seed.quality}</small><br>
            <small>Score: ${seed.performanceScore}/100</small>
            <button class="remove-seed" data-slot="${slotIndex}" style="margin-top: 0.5rem; background: var(--danger); color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; cursor: pointer;">Remove</button>
        `;
        content.classList.remove('empty');
        
        const removeBtn = content.querySelector('.remove-seed');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                selectedSeeds[slotIndex] = null;
                updateSlot(slotIndex, null);
                updateComparison();
            });
        }
    } else {
        content.innerHTML = `
            <i class="fas fa-plus-circle"></i>
            <button class="select-from-history">From History</button>
            <button class="upload-new">Upload New</button>
        `;
        content.classList.add('empty');
        
        // Reattach event listeners
        content.querySelector('.select-from-history')?.addEventListener('click', () => showHistorySelector(slotIndex));
        content.querySelector('.upload-new')?.addEventListener('click', () => uploadNewSeed(slotIndex));
    }
}

function updateComparison() {
    const resultsDiv = document.getElementById('comparisonResults');
    const hasSeeds = selectedSeeds.some(s => s !== null);
    
    if (!hasSeeds) {
        resultsDiv.classList.add('hidden');
        return;
    }
    
    resultsDiv.classList.remove('hidden');
    
    // Update table headers
    for (let i = 0; i < 3; i++) {
        const nameEl = document.getElementById(`seed${i + 1}Name`);
        if (nameEl && selectedSeeds[i]) {
            nameEl.textContent = selectedSeeds[i].variety;
        } else if (nameEl) {
            nameEl.textContent = `Seed ${i + 1}`;
        }
    }
    
    // Update table values
    const metrics = ['variety', 'quality', 'performanceScore', 'confidence', 'germinationPotential', 'marketValueIndex'];
    metrics.forEach(metric => {
        for (let i = 0; i < 3; i++) {
            const cell = document.getElementById(`${metric.substring(0, 4)}${i + 1}`);
            if (cell && selectedSeeds[i]) {
                let value = selectedSeeds[i][metric];
                if (metric === 'performanceScore' || metric === 'confidence' || metric === 'germinationPotential' || metric === 'marketValueIndex') {
                    value = `${value}/100`;
                }
                cell.textContent = value || '-';
            } else if (cell) {
                cell.textContent = '-';
            }
        }
    });
    
    // Update chart
    updateComparisonChart();
    
    // Generate recommendations
    generateRecommendations();
}

function updateComparisonChart() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    const labels = ['Performance', 'Germination', 'Market Value', 'Quality Index'];
    const datasets = [];
    const colors = ['#2a7221', '#c47a2e', '#3498db'];
    
    selectedSeeds.forEach((seed, index) => {
        if (seed) {
            datasets.push({
                label: seed.variety,
                data: [
                    seed.performanceScore,
                    seed.germinationPotential || 70,
                    seed.marketValueIndex || 75,
                    seed.qualityIndex === 0 ? 90 : (seed.qualityIndex === 1 ? 70 : 50)
                ],
                borderColor: colors[index],
                backgroundColor: colors[index] + '20',
                tension: 0.4,
                fill: true
            });
        }
    });
    
    if (window.comparisonChart) {
        window.comparisonChart.destroy();
    }
    
    window.comparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function generateRecommendations() {
    const validSeeds = selectedSeeds.filter(s => s !== null);
    if (validSeeds.length < 2) return;
    
    const bestPerformer = validSeeds.reduce((best, current) => 
        (current.performanceScore > best.performanceScore) ? current : best
    );
    
    const bestQuality = validSeeds.reduce((best, current) => 
        (current.qualityIndex < best.qualityIndex) ? current : best
    );
    
    const recommendationsDiv = document.getElementById('recommendationsText');
    if (recommendationsDiv) {
        recommendationsDiv.innerHTML = `
            <p><strong>🏆 Best Overall Performance:</strong> ${bestPerformer.variety} (${bestPerformer.performanceScore}/100)</p>
            <p><strong>✨ Highest Quality Grade:</strong> ${bestQuality.variety} (${bestQuality.quality})</p>
            <p><strong>💡 Recommendation:</strong> For cultivation, ${bestPerformer.variety} shows the highest performance potential. For immediate processing, ${bestQuality.variety} offers superior quality characteristics.</p>
            <p><i class="fas fa-chart-line"></i> Consider variety selection based on your specific market needs and growing conditions.</p>
        `;
    }
}

// Export comparison as PDF
document.getElementById('exportComparisonBtn')?.addEventListener('click', () => {
    exportToPDF('comparisonResults', `comparison_${Date.now()}.pdf`);
});

// Initialize
document.addEventListener('DOMContentLoaded', initComparison);