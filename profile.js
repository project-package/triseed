// History Page JavaScript

let allAnalyses = [];
let filteredAnalyses = [];
let currentPage = 1;
const itemsPerPage = 10;

function loadHistory() {
    const user = getCurrentUser();
    if (!user) return;
    
    allAnalyses = Storage.get(`history_${user.username}`) || [];
    filteredAnalyses = [...allAnalyses];
    
    updateStats();
    renderTable();
    setupFilters();
}

function updateStats() {
    document.getElementById('totalCount').textContent = allAnalyses.length;
    document.getElementById('showingCount').textContent = filteredAnalyses.length;
}

function renderTable() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filteredAnalyses.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No analyses found</td></tr>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    tbody.innerHTML = paginated.map(analysis => `
        <tr>
            <td><input type="checkbox" class="select-item" data-id="${analysis.timestamp}"></td>
            <td>${formatDate(analysis.timestamp)}</td>
            <td><img src="${analysis.previewUrl}" class="preview-thumb" alt="Preview"></td>
            <td><span class="variety-tag">${analysis.variety}</span></td>
            <td><span class="quality-badge ${analysis.quality.toLowerCase().replace(' ', '-')}">${analysis.quality}</span></td>
            <td><strong>${analysis.performanceScore}</strong>/100</td>
            <td><span class="confidence">${analysis.confidence || 85}%</span></td>
            <td>
                <button class="icon-btn view-analysis" data-id="${analysis.timestamp}"><i class="fas fa-eye"></i></button>
                <button class="icon-btn delete-analysis" data-id="${analysis.timestamp}"><i class="fas fa-trash"></i></button>
                <button class="icon-btn export-analysis" data-id="${analysis.timestamp}"><i class="fas fa-download"></i></button>
            </td>
        </tr>
    `).join('');
    
    renderPagination();
    attachRowEvents();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredAnalyses.length / itemsPerPage);
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;
    
    if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination-controls">';
    if (currentPage > 1) {
        html += `<button class="page-btn" data-page="${currentPage - 1}">Previous</button>`;
    }
    
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    if (currentPage < totalPages) {
        html += `<button class="page-btn" data-page="${currentPage + 1}">Next</button>`;
    }
    html += '</div>';
    
    paginationDiv.innerHTML = html;
    
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.getAttribute('data-page'));
            renderTable();
        });
    });
}

function attachRowEvents() {
    // View analysis
    document.querySelectorAll('.view-analysis').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            const analysis = allAnalyses.find(a => a.timestamp === id);
            if (analysis) {
                showAnalysisModal(analysis);
            }
        });
    });
    
    // Delete analysis
    document.querySelectorAll('.delete-analysis').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            if (confirm('Delete this analysis?')) {
                const user = getCurrentUser();
                allAnalyses = allAnalyses.filter(a => a.timestamp !== id);
                filteredAnalyses = filteredAnalyses.filter(a => a.timestamp !== id);
                Storage.set(`history_${user.username}`, allAnalyses);
                updateStats();
                renderTable();
                showNotification('Analysis deleted', 'success');
            }
        });
    });
    
    // Export single analysis
    document.querySelectorAll('.export-analysis').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            const analysis = allAnalyses.find(a => a.timestamp === id);
            if (analysis) {
                exportToCSV([analysis], `analysis_${analysis.timestamp}.csv`);
            }
        });
    });
}

function showAnalysisModal(analysis) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Analysis Details</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <img src="${analysis.previewUrl}" style="max-width: 100%; border-radius: 1rem;">
                <div class="details-grid">
                    <div><strong>Variety:</strong> ${analysis.variety}</div>
                    <div><strong>Quality:</strong> ${analysis.quality}</div>
                    <div><strong>Performance:</strong> ${analysis.performanceScore}/100</div>
                    <div><strong>Confidence:</strong> ${analysis.confidence || 85}%</div>
                    <div><strong>Date:</strong> ${formatDate(analysis.timestamp)}</div>
                </div>
                <p><strong>Traits:</strong> ${analysis.traits}</p>
            </div>
            <div class="modal-footer">
                <button class="btn-primary generate-pdf">Generate PDF Report</button>
                <button class="btn-outline close-modal">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    const closeBtns = modal.querySelectorAll('.close-modal');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });
    
    const pdfBtn = modal.querySelector('.generate-pdf');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            exportToPDF(modal.querySelector('.modal-body'), `analysis_report_${analysis.timestamp}.pdf`);
        });
    }
}

function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const varietyFilter = document.getElementById('varietyFilter');
    const qualityFilter = document.getElementById('qualityFilter');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    const applyBtn = document.getElementById('applyFiltersBtn');
    const clearBtn = document.getElementById('clearFiltersBtn');
    const selectAll = document.getElementById('selectAll');
    const exportAllBtn = document.getElementById('exportAllBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    
    function applyFilters() {
        let filtered = [...allAnalyses];
        
        const search = searchInput.value.toLowerCase();
        if (search) {
            filtered = filtered.filter(a => 
                a.variety.toLowerCase().includes(search) || 
                a.quality.toLowerCase().includes(search)
            );
        }
        
        const variety = varietyFilter.value;
        if (variety) {
            filtered = filtered.filter(a => a.variety === variety);
        }
        
        const quality = qualityFilter.value;
        if (quality) {
            filtered = filtered.filter(a => a.quality === quality);
        }
        
        const fromDate = dateFrom.value;
        if (fromDate) {
            filtered = filtered.filter(a => new Date(a.timestamp).toISOString().split('T')[0] >= fromDate);
        }
        
        const toDate = dateTo.value;
        if (toDate) {
            filtered = filtered.filter(a => new Date(a.timestamp).toISOString().split('T')[0] <= toDate);
        }
        
        filteredAnalyses = filtered;
        currentPage = 1;
        updateStats();
        renderTable();
    }
    
    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            varietyFilter.value = '';
            qualityFilter.value = '';
            dateFrom.value = '';
            dateTo.value = '';
            filteredAnalyses = [...allAnalyses];
            currentPage = 1;
            updateStats();
            renderTable();
        });
    }
    
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            document.querySelectorAll('.select-item').forEach(cb => {
                cb.checked = e.target.checked;
            });
        });
    }
    
    if (exportAllBtn) {
        exportAllBtn.addEventListener('click', () => {
            exportToCSV(filteredAnalyses, `all_analyses_${Date.now()}.csv`);
        });
    }
    
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', () => {
            if (confirm('Delete ALL analyses? This cannot be undone.')) {
                const user = getCurrentUser();
                allAnalyses = [];
                filteredAnalyses = [];
                Storage.set(`history_${user.username}`, []);
                updateStats();
                renderTable();
                showNotification('All analyses deleted', 'success');
            }
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', loadHistory);