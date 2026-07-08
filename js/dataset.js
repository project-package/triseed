// Dataset page JavaScript - Interactive elements

document.addEventListener('DOMContentLoaded', () => {
    // Add interactive elements to dataset page
    initVarietyCards();
    initModelVisualization();
});

function initVarietyCards() {
    const cards = document.querySelectorAll('.variety-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.style.transform = 'scale(1)');
            card.style.transform = 'scale(1.02)';
            card.style.transition = 'all 0.3s ease';
            
            const variety = card.querySelector('h3').textContent;
            showNotification(`Selected: ${variety}. View full details in gallery.`, 'info');
        });
    });
}

function initModelVisualization() {
    const layers = document.querySelectorAll('.layer');
    layers.forEach((layer, index) => {
        layer.addEventListener('mouseenter', () => {
            layer.style.transform = 'scale(1.05)';
            layer.style.transition = 'all 0.3s ease';
        });
        layer.addEventListener('mouseleave', () => {
            layer.style.transform = 'scale(1)';
        });
    });
}

// Add tooltips for quality criteria
document.querySelectorAll('.quality-card').forEach(card => {
    card.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = 'Click for detailed quality assessment guide';
        tooltip.style.cssText = `
            position: absolute;
            background: var(--primary-color);
            color: white;
            padding: 0.5rem;
            border-radius: 0.5rem;
            font-size: 0.75rem;
            z-index: 1000;
        `;
        document.body.appendChild(tooltip);
        
        const rect = card.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.top - 30) + 'px';
        
        setTimeout(() => tooltip.remove(), 2000);
    });
});