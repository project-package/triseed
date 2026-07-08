// Utility functions for the entire application

// Local Storage Management
const Storage = {
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    
    get(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    
    remove(key) {
        localStorage.removeItem(key);
    },
    
    clear() {
        localStorage.clear();
    }
};

// User Management
let currentUser = null;

function setCurrentUser(user) {
    currentUser = user;
    Storage.set('currentUser', user);
}

function getCurrentUser() {
    if (!currentUser) {
        currentUser = Storage.get('currentUser');
    }
    return currentUser;
}

function logout() {
    currentUser = null;
    Storage.remove('currentUser');
    window.location.href = 'login.html';
}

// Replace the mockCNNClassification function with this updated version:

function mockCNNClassification(imageDataURL) {
    // Simulate AI processing with consistent results based on image data
    let hash = 0;
    if (imageDataURL) {
        for (let i = 0; i < Math.min(imageDataURL.length, 1000); i++) {
            hash = ((hash << 5) - hash) + imageDataURL.charCodeAt(i);
            hash |= 0;
        }
    } else {
        hash = Date.now();
    }
    
    // YOUR 3 SPECIFIC CORN VARIETIES ONLY
    const varieties = ["Waxy Corn", "Sweet Corn", "Hybrid Yellow"];
    const qualities = ["High Quality", "Moderate Quality", "Low Quality"];
    
    // More controlled distribution - can adjust weights if needed
    // This ensures all 3 varieties appear naturally
    const varietyIndex = Math.abs(hash % 3);  // Will always be 0, 1, or 2
    const qualityIndex = Math.abs(Math.floor(hash / 7) % 3);
    
    // Calculate confidence based on hash consistency
    const confidence = 75 + (Math.abs(hash % 20));
    
    // Performance score calculation based on variety and quality
    let performanceScore = 0;
    if (qualityIndex === 0) {
        // High quality
        if (varietyIndex === 0) performanceScore = 88 + (hash % 8);  // Waxy: 88-95
        else if (varietyIndex === 1) performanceScore = 85 + (hash % 10); // Sweet: 85-94
        else performanceScore = 82 + (hash % 12); // Hybrid Yellow: 82-93
    } else if (qualityIndex === 1) {
        // Moderate quality
        if (varietyIndex === 0) performanceScore = 68 + (hash % 10);  // Waxy: 68-77
        else if (varietyIndex === 1) performanceScore = 65 + (hash % 12); // Sweet: 65-76
        else performanceScore = 62 + (hash % 14); // Hybrid Yellow: 62-75
    } else {
        // Low quality
        if (varietyIndex === 0) performanceScore = 45 + (hash % 12);  // Waxy: 45-56
        else if (varietyIndex === 1) performanceScore = 42 + (hash % 14); // Sweet: 42-55
        else performanceScore = 40 + (hash % 15); // Hybrid Yellow: 40-54
    }
    performanceScore = Math.min(98, Math.max(30, Math.round(performanceScore)));
    
    // Germination potential
    const germinationPotential = Math.min(95, Math.max(40, performanceScore - 5 + (Math.abs(hash % 10))));
    
    // Market value index based on variety
    let marketValueIndex = qualityIndex === 0 ? 90 : (qualityIndex === 1 ? 70 : 50);
    if (varietyIndex === 0) marketValueIndex += 5;  // Waxy premium
    if (varietyIndex === 1) marketValueIndex += 0;  // Sweet standard
    
    // Detailed traits for your 3 varieties
    const traits = {
        "Waxy Corn": "Chewy glutinous texture, high amylopectin starch. Excellent for Asian cuisine, industrial starch, and specialty food products. High market demand in premium segments.",
        "Sweet Corn": "High sugar content, tender kernels, bright yellow color. Ideal for fresh consumption, canning, and frozen food industry. Superior eating quality.",
        "Hybrid Yellow": "High-yielding hybrid variety with excellent kernel uniformity. Balanced starch content, disease resistant, suitable for both processing and animal feed."
    };
    
    // Visual characteristics for each variety
    const visualTraits = {
        "Waxy Corn": "Pearlescent white to pale yellow kernels, waxy appearance, uniform size",
        "Sweet Corn": "Bright golden-yellow kernels, plump and juicy appearance, slight translucency",
        "Hybrid Yellow": "Deep yellow to orange kernels, uniform shape, robust texture"
    };
    
    // Disease detection (mock)
    const diseases = ["None detected", "Minor surface blemishes", "Potential fungal spots", "Insect damage visible"];
    const diseaseIndex = Math.abs(Math.floor(hash / 13) % 4);
    
    // Quality description based on grade
    const qualityDescriptions = {
        "High Quality": "Superior seed with excellent characteristics. Optimal size, color, and texture. No defects visible.",
        "Moderate Quality": "Good quality seed with minor imperfections. Suitable for most applications.",
        "Low Quality": "Significant defects present. Limited applications. Consider for processing only."
    };
    
    return {
        variety: varieties[varietyIndex],
        quality: qualities[qualityIndex],
        qualityDescription: qualityDescriptions[qualities[qualityIndex]],
        confidence: Math.round(confidence),
        performanceScore: performanceScore,
        germinationPotential: Math.round(germinationPotential),
        marketValueIndex: marketValueIndex,
        traits: traits[varieties[varietyIndex]],
        visualTraits: visualTraits[varieties[varietyIndex]],
        diseaseDetection: diseases[diseaseIndex],
        varietyIndex: varietyIndex,
        qualityIndex: qualityIndex,
        timestamp: Date.now(),
        date: new Date().toLocaleString()
    };
}

// Quality criteria descriptions based on visual features
function getQualityCriteria(quality, variety) {
    const criteria = {
        "High Quality": {
            general: "Superior seed characteristics meeting all quality standards",
            visual: "• Uniform kernel size and shape\n• Vibrant, consistent coloration\n• No visible defects or damage\n• Intact pericarp (seed coat)",
            standards: "• 90-100% uniformity score\n• Optimal moisture content\n• No disease symptoms\n• Excellent germination potential",
            why: "This seed exhibits exceptional visual characteristics with perfect uniformity, ideal color development, and zero defects, indicating optimal growing conditions and proper harvest timing."
        },
        "Moderate Quality": {
            general: "Acceptable quality with minor imperfections",
            visual: "• Slight size or shape variation\n• Minor color inconsistencies\n• Small surface blemishes present\n• Generally intact seed coat",
            standards: "• 70-89% uniformity score\n• Slightly suboptimal moisture\n• Minor surface irregularities\n• Good germination potential",
            why: "This seed shows good overall structure but has minor imperfections such as slight size variation or small blemishes, which may result from suboptimal growing conditions or minor mechanical damage during harvest."
        },
        "Low Quality": {
            general: "Significant defects affecting seed value",
            visual: "• Notable size or shape irregularities\n• Discoloration present\n• Visible cracks or damage\n• Compromised seed coat integrity",
            standards: "• Below 70% uniformity score\n• Potential moisture issues\n• Visible disease or damage\n• Reduced germination potential",
            why: "This seed exhibits significant quality issues including visible damage, discoloration, or irregular development, likely due to disease pressure, pest damage, environmental stress, or improper handling/storage."
        }
    };
    
    // Variety-specific comments
    const varietyComments = {
        "Waxy Corn": {
            "High Quality": "Excellent pearlescent appearance with ideal waxy texture characteristics.",
            "Moderate Quality": "Acceptable waxy characteristics with minor variations in translucency.",
            "Low Quality": "Compromised waxy starch properties visible through kernel abnormalities."
        },
        "Sweet Corn": {
            "High Quality": "Superior sugar development indicated by bright, uniform golden color.",
            "Moderate Quality": "Good sugar content with slight variations in kernel plumpness.",
            "Low Quality": "Reduced sugar content indicated by dull coloring and kernel shriveling."
        },
        "Hybrid Yellow": {
            "High Quality": "Excellent hybrid characteristics with robust, uniform kernel development.",
            "Moderate Quality": "Good hybrid traits with minor uniformity variations.",
            "Low Quality": "Compromised hybrid vigor visible through inconsistent kernel fill."
        }
    };
    
    return {
        ...criteria[quality],
        varietySpecific: varietyComments[variety]?.[quality] || "",
        recommendations: quality === "High Quality" 
            ? "✓ Premium market pricing recommended\n✓ Suitable for seed saving\n✓ Ideal for direct consumption"
            : (quality === "Moderate Quality" 
                ? "• Good for processing\n• Suitable for animal feed\n• Consider for secondary markets"
                : "⚠ Limited market value\n⚠ Processing only recommended\n⚠ Not suitable for seed saving")
    };
}
// Format date for display
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Export to CSV
function exportToCSV(data, filename) {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Export to PDF (simplified - would use html2pdf in production)
function exportToPDF(elementId, filename) {
    alert('PDF export would use html2pdf library. In production, implement with jsPDF or html2pdf.js');
    // In production: html2pdf().from(element).save();
}

// Generate QR Code (simplified)
function generateQRCode(data) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle')}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    `;
    
    if (type === 'success') notification.style.borderLeft = `4px solid var(--success)`;
    if (type === 'error') notification.style.borderLeft = `4px solid var(--danger)`;
    if (type === 'info') notification.style.borderLeft = `4px solid var(--info)`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Pagination helper
function paginate(array, pageSize, pageNumber) {
    return array.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[A-Z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    if (password.match(/[$@#&!]+/)) strength++;
    return strength;
}
