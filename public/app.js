class FashionSearchApp {
    constructor() {
        this.API_BASE = 'http://localhost:3000';
        this.currentQuery = '';
        this.searchResults = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.showWelcomeState();
    }
    
    initializeElements() {
        // Search elements
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.hybridSearch = document.getElementById('hybridSearch');
        this.topKSelect = document.getElementById('topK');
        
        // State elements
        this.loadingState = document.getElementById('loadingState');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.noResults = document.getElementById('noResults');
        this.errorState = document.getElementById('errorState');
        
        // Results info
        this.resultsTitle = document.getElementById('resultsTitle');
        this.resultsCount = document.getElementById('resultsCount');
        this.searchTime = document.getElementById('searchTime');
        
        // Modal
        this.productModal = document.getElementById('productModal');
        this.modalBody = document.getElementById('modalBody');
        this.closeModal = document.getElementById('closeModal');
        
        // Error handling
        this.errorMessage = document.getElementById('errorMessage');
        this.retryBtn = document.getElementById('retryBtn');
    }
    
    setupEventListeners() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        // Quick search tags
        document.querySelectorAll('.quick-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                const query = e.target.dataset.query;
                this.searchInput.value = query;
                this.performSearch();
            });
        });
        
        // Modal functionality
        this.closeModal.addEventListener('click', () => this.closeProductModal());
        this.productModal.addEventListener('click', (e) => {
            if (e.target === this.productModal) this.closeProductModal();
        });
        
        // Retry functionality
        this.retryBtn.addEventListener('click', () => this.performSearch());
        
        // Real-time search suggestions
        this.searchInput.addEventListener('input', this.debounce(() => {
            if (this.searchInput.value.trim().length > 2) {
                // Could add search suggestions here in the future
            }
        }, 300));
    }
    
    showWelcomeState() {
        this.hideAllStates();
        // Show welcome message or featured items here
    }
    
    hideAllStates() {
        [this.loadingState, this.resultsSection, this.noResults, this.errorState]
            .forEach(el => el.classList.add('hidden'));
    }
    
    showLoadingState() {
        this.hideAllStates();
        this.loadingState.classList.remove('hidden');
    }
    
    showErrorState(message = 'Something went wrong. Please try again.') {
        this.hideAllStates();
        this.errorMessage.textContent = message;
        this.errorState.classList.remove('hidden');
    }
    
    showNoResultsState() {
        this.hideAllStates();
        this.noResults.classList.remove('hidden');
    }
    
    showResultsState() {
        this.hideAllStates();
        this.resultsSection.classList.remove('hidden');
    }
    
    async performSearch() {
        const query = this.searchInput.value.trim();
        
        if (!query) {
            this.searchInput.focus();
            return;
        }
        
        this.currentQuery = query;
        this.showLoadingState();
        
        const startTime = performance.now();
        
        try {
            const searchParams = {
                query: query,
                topK: parseInt(this.topKSelect.value),
                hybrid: this.hybridSearch.checked,
                lexicalWeight: 0.3,
                facets: true
            };
            
            const response = await fetch(`${this.API_BASE}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchParams)
            });
            
            const endTime = performance.now();
            const searchTimeMs = Math.round(endTime - startTime);
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.searchResults = data.results || [];
            
            if (this.searchResults.length === 0) {
                this.showNoResultsState();
            } else {
                this.displayResults(searchTimeMs);
            }
            
        } catch (error) {
            console.error('Search error:', error);
            this.showErrorState(error.message);
        }
    }
    
    displayResults(searchTimeMs) {
        this.showResultsState();
        
        // Update results info
        this.resultsTitle.textContent = `Results for "${this.currentQuery}"`;
        this.resultsCount.textContent = `${this.searchResults.length} items found`;
        this.searchTime.textContent = `in ${searchTimeMs}ms`;
        
        // Clear previous results
        this.resultsContainer.innerHTML = '';
        
        // Render product cards
        this.searchResults.forEach((product, index) => {
            const productCard = this.createProductCard(product, index);
            this.resultsContainer.appendChild(productCard);
        });
        
        // Add smooth scroll to results
        this.resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    createProductCard(product, index) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        // Format price
        const price = product.price ? `$${product.price.toFixed(2)}` : 'Price not available';
        
        // Get similarity score if available
        const similarityScore = product.similarity ? 
            Math.round(product.similarity * 100) : null;
        
        // Create stock status
        const stockClass = product.stock_status === 'in_stock' ? 'in-stock' : 'out-of-stock';
        const stockText = product.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock';
        
        // Create product details tags
        const details = [];
        if (product.color && product.color !== 'unknown') details.push(product.color);
        if (product.material && product.material !== 'unknown') details.push(product.material);
        
        card.innerHTML = `
            <div class="stock-status ${stockClass}">${stockText}</div>
            ${product.image_url ? 
                `<img src="${product.image_url}" alt="${product.name}" class="product-image" onerror="this.style.display='none'">` : 
                '<div class="product-image" style="background: linear-gradient(45deg, #f0f0f0, #e0e0e0); display: flex; align-items: center; justify-content: center; color: #999;"><i class="fas fa-image" style="font-size: 2rem;"></i></div>'
            }
            <div class="product-content">
                <div class="product-brand">${product.brand || 'Unknown Brand'}</div>
                <div class="product-name">${product.name || 'Unnamed Product'}</div>
                <div class="product-category">${product.category || 'Uncategorized'}</div>
                <div class="product-price">${price}</div>
                ${details.length > 0 ? 
                    `<div class="product-details">
                        ${details.map(detail => `<span class="detail-tag">${detail}</span>`).join('')}
                    </div>` : ''
                }
                ${product.description && product.description !== 'no description available' ? 
                    `<p class="product-description" style="font-size: 0.9rem; color: #666; margin-top: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.description}</p>` : ''
                }
                ${similarityScore ? 
                    `<div class="similarity-score">Match: ${similarityScore}%</div>` : ''
                }
            </div>
        `;
        
        // Add click event to show product details
        card.addEventListener('click', () => this.showProductModal(product));
        
        return card;
    }
    
    showProductModal(product) {
        const price = product.price ? `$${product.price.toFixed(2)}` : 'Price not available';
        const stockClass = product.stock_status === 'in_stock' ? 'in-stock' : 'out-of-stock';
        const stockText = product.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock';
        
        this.modalBody.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                ${product.image_url ? 
                    `<img src="${product.image_url}" alt="${product.name}" style="max-width: 100%; max-height: 300px; border-radius: 10px; object-fit: cover;" onerror="this.style.display='none'">` : 
                    '<div style="width: 100%; height: 200px; background: linear-gradient(45deg, #f0f0f0, #e0e0e0); display: flex; align-items: center; justify-content: center; color: #999; border-radius: 10px;"><i class="fas fa-image" style="font-size: 3rem;"></i></div>'
                }
            </div>
            
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="color: #667eea; font-size: 1rem; font-weight: 500; margin-bottom: 5px;">${product.brand || 'Unknown Brand'}</div>
                <h2 style="font-size: 1.5rem; color: #333; margin-bottom: 10px;">${product.name || 'Unnamed Product'}</h2>
                <div style="display: inline-block; background: #f0f0f0; color: #666; padding: 4px 12px; border-radius: 15px; font-size: 0.9rem; margin-bottom: 15px;">${product.category || 'Uncategorized'}</div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <div>
                    <div style="font-size: 1.8rem; font-weight: 700; color: #2d3748;">${price}</div>
                </div>
                <div>
                    <span class="stock-status ${stockClass}" style="position: static;">${stockText}</span>
                </div>
            </div>
            
            ${product.description && product.description !== 'no description available' ? 
                `<div style="margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 10px;">Description</h4>
                    <p style="color: #666; line-height: 1.6;">${product.description}</p>
                </div>` : ''
            }
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                ${product.color && product.color !== 'unknown' ? 
                    `<div>
                        <h4 style="color: #333; margin-bottom: 5px;">Color</h4>
                        <span class="detail-tag">${product.color}</span>
                    </div>` : ''
                }
                ${product.material && product.material !== 'unknown' ? 
                    `<div>
                        <h4 style="color: #333; margin-bottom: 5px;">Material</h4>
                        <span class="detail-tag">${product.material}</span>
                    </div>` : ''
                }
            </div>
            
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e1e1e1;">
                <div style="display: flex; justify-content: center; gap: 10px;">
                    <button onclick="fashionApp.findSimilarProducts('${product.id}')" style="padding: 12px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Find Similar</button>
                    ${product.image_url ? 
                        `<a href="${product.image_url}" target="_blank" style="padding: 12px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-block;">View Full Image</a>` : ''
                    }
                </div>
            </div>
        `;
        
        this.productModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    closeProductModal() {
        this.productModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
    
    async findSimilarProducts(productId) {
        this.closeProductModal();
        this.showLoadingState();
        
        try {
            const response = await fetch(`${this.API_BASE}/recommend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: productId,
                    topK: 8
                })
            });
            
            if (!response.ok) {
                throw new Error(`Recommendation failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.searchResults = data.results || [];
            this.currentQuery = 'Similar Products';
            
            if (this.searchResults.length === 0) {
                this.showNoResultsState();
            } else {
                this.displayResults(0);
            }
            
        } catch (error) {
            console.error('Recommendation error:', error);
            this.showErrorState(error.message);
        }
    }
    
    // Utility function to debounce function calls
    debounce(func, wait) {
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
    
    // Method to handle keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.searchInput.focus();
            }
            
            // Escape to close modal
            if (e.key === 'Escape' && !this.productModal.classList.contains('hidden')) {
                this.closeProductModal();
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fashionApp = new FashionSearchApp();
    window.fashionApp.setupKeyboardShortcuts();
    
    // Add some nice loading animation for cards
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .product-card {
            animation: fadeInUp 0.6s ease forwards;
        }
        
        .product-card:hover .product-name {
            color: #667eea;
        }
        
        .search-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }
        
        .search-input-focused {
            border-color: #667eea !important;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1) !important;
        }
    `;
    document.head.appendChild(style);
});

// Add some global utility functions
window.searchUtils = {
    formatPrice: (price) => {
        return price ? `$${price.toFixed(2)}` : 'Price not available';
    },
    
    truncateText: (text, maxLength = 100) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    capitalizeWords: (str) => {
        if (!str) return '';
        return str.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }
};
